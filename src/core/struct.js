import {nstructjs} from "../path.ux/scripts/pathux.js";
import * as PUTL from "../path.ux/scripts/util/parseutil.js";

import {Matrix4, Vector2, Vector3, Vector4, Quat} from "../path.ux/scripts/pathux.js";

export let STRUCT = nstructjs.STRUCT;
export function profile_reset() {}
export function profile_report() {}

/*
*
* Fairmotion exports big-endian files
*
* */
window.STRUCT_ENDIAN = false;
nstructjs.setDebugMode(false);
window.istruct = nstructjs.manager;

function patch_dataref_type(buf) {
  return buf.replace(/dataref\([a-zA-Z0-9_$]+\)/g, "dataref");
}

class Mat4Compat extends Matrix4 {
  constructor() {
    super();
  }

  static fromSTRUCT(reader) {
    let ret = new Matrix4();
    reader(ret);
    ret.$matrix = ret._matrix;
    delete ret._matrix;

    return ret;
  }
}

Mat4Compat.STRUCT = `
mat4 {
  _matrix : mat4_intern | obj.$matrix;
}
`;

export class Mat4Intern {
}
Mat4Intern.STRUCT = `
mat4_intern {
  m11 : float;
  m12 : float;
  m13 : float;
  m14 : float;
  m21 : float;
  m22 : float;
  m23 : float;
  m24 : float;
  m31 : float;
  m32 : float;
  m33 : float;
  m34 : float;
  m41 : float;
  m42 : float;
  m43 : float;
  m44 : float;
}
`;

let vecpatches = [];

function makeVecPatch(cls, size, name) {
  let dummycls = {
    fromSTRUCT(reader) {
      let ret = new cls();
      reader(ret);
      return ret;
    },
    prototype : {}
  };


  let s = name + "{\n";
  for (let i=0; i<size; i++) {
    s += `  ${i} : float;\n`
  }
  s += "}\n";

  //console.log(s);
  dummycls.STRUCT = s;
  dummycls.structName = dummycls.name = name;

  vecpatches.push(dummycls);
}

makeVecPatch(Vector2, 2, "vec2");
makeVecPatch(Vector3, 3, "vec3");
makeVecPatch(Vector4, 4, "vec4");
makeVecPatch(Vector4, 4, "quat");

/*backwards compatibility for files saved with older in-house STRUCT implementation*/

let _old = nstructjs.STRUCT.prototype.parse_structs;
nstructjs.STRUCT.prototype.parse_structs = function(buf, defined_classes) {
  buf = patch_dataref_type(buf);
  //console.log(buf);
  let ret = _old.call(this, buf);

  if (!this.structs.dataref) {
    this.register(__dataref);
  }

  //*
  if (!this.structs.mat4) {
    this.register(Mat4Intern);
    this.register(Mat4Compat);
  }

  for (let v of vecpatches) {
    if (!this.structs[v.structName]) {
      this.register(v);
    }
  }

  return ret;
};

export function gen_struct_str() {
  return nstructjs.write_scripts(istruct);
}

window.init_struct_packer = function() {
  global defined_classes, istruct;

  init_toolop_structs();

  var errs = [];

  ////dataref\([a-zA-Z0-9_$]+\)/g
  let buf = "";
  for (var cls of defined_classes) {
    if (cls.STRUCT) {
      cls.STRUCT = patch_dataref_type(cls.STRUCT);
      buf += cls.STRUCT + "\n";
    }
  }

  window._struct_scripts = buf;

  for (var cls of defined_classes) {
    if (cls.name == "Matrix4UI" || cls.name == "Matrix4" || cls.name == "Vector3" || cls.name == "Vector4" || cls.name == "Vector2") {
      //XXX dumb, kind of locked into the custom vector STRUCT types that's not in nstructjs
      //since I now use the vectormath in path.ux, I have to specially make sure I don't
      //parse the STRUCT scripts there
      continue;
    }

    if (cls.STRUCT) {
      cls.STRUCT = patch_dataref_type(cls.STRUCT);
    }

    try {
      if (cls.STRUCT !== undefined) {
        istruct.register(cls);
      }
    } catch (err) {
      if (err instanceof PUTL.PUTLParseError) {
        console.log("cls.structName: ", cls.structName)
        print_stack(err);
        console.log("Error parsing struct: " + err.message);
      } else {
        errs.push([err, cls]);
      }
    }
  }

  for (var i=0; i<errs.length; i++) {
    let err = errs[i][0];
    let cls = errs[i][1];

    console.log(cls.STRUCT);
    print_stack(err);

    //throw last error
    if (i == errs.length-1)
      throw err;
  }

  //copy global env (could conceivably become outdated later?)
  window.safe_global = {};

  for (var k in window) {
    //try to avoid banned globals
    if (k.search("bar") >= 0 || k == "localStorage" || (k.startsWith("on") && k[2] != "l")) {
      continue;
    }
    if (k.startsWith("webkit")) {
      continue;
    }

    safe_global[k] = window[k];
  }
}

//the ancient, original design comment, preserved for posterity:

/*

Okay.  The serialization system needs to do three things:

1. Handle data model changes.
2. Be lightning fast (which means no excessive creation of objects).
3. Be light-weight.

Thus, all the existing serialization schemes (that I know of) for JS
are ineligible.  Here is my final solution: a serialization language
that can compile itself to JS, and minimizes new object creation.

Note: this is *not* like C structs; specifically, variable-length
member fields are allowed (e.g. arrays, "abstract" sub-structs, etc).
There are no enforced byte alignments, either.

Format:

StructName {
  member-name : data-type ; helper-js-code;
}

where:

member-name = any valid identifier
data-type : int float double vec2 vec3 vec4 mat4

            static_string(max length)

            array([optional iter name for helepr JS], type),

            iter([optional iter name for help JS], type),

            dataref(SomeDataBlockType),

            NameOfAStruct

            abstract(StructName) //write type info for reading child classes

helper-js-code : an expression to get a value.  a local variable 'obj'
                 is the equivalent of 'this'.
                 note that this code is not saved when serializing files.

note that the iter type is the same as array, except instead
of fetching list items by iterating over a numeric range,
e.g. for (i=0; i<arr.lenght; i++), it uses the (much slower)
iteration API.
*/
