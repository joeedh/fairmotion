"use strict";

import {
  util,
  nstructjs,
  Vector3,
  Matrix4,
  Vector4,
  Quat,
  Vector2,
} from "../path.ux/scripts/pathux.js";

let STRUCT = nstructjs.STRUCT;

/* The context this app runs on is WebGL2 *plus* a set of fields bolted on at
   init time: cached getExtension() results, a shader cache, and the originals
   addFastParameterGet() keeps before it shadows them.

   This has to be an intersection, not a `WebGL1 | WebGL2` union: a union would
   expose only the members common to both, so every WebGL2-only call would
   error. init_webgl() can still produce a WebGL1 context when params.webgl2 is
   false, but it then patches the WebGL2 names it needs (RGBA32F, RGBA8UI) onto
   the object -- and imagecanvas_webgl.ts patches drawBuffers and the vertex
   array methods the same way -- so one type genuinely does describe both. */
export type WebGLContext = WebGL2RenderingContext & {
  haveWebGL2: boolean;
  shadercache: { [hash: string]: ShaderProgram };

  /* Cached getExtension() results; null when the extension is unavailable. */
  color_buffer_float: EXT_color_buffer_float | null;
  texture_float: OES_texture_float_linear | null;
  float_blend: EXT_float_blend | null;
  draw_buffers: WEBGL_draw_buffers | null;
  depth_texture: WEBGL_depth_texture | null;
  srgb: EXT_sRGB | null;
  ctxloss: WEBGL_lose_context | null;

  /* WebGL1 extension objects backing the WebGL2 methods of the same name;
     see imagecanvas_webgl.ts. */
  _drawbuf: WEBGL_draw_buffers | null;
  _vbo: OES_vertex_array_object | null;

  /* Saved by addFastParameterGet() before it replaces the originals. */
  _getParameter: WebGL2RenderingContext["getParameter"];
  _enable: WebGL2RenderingContext["enable"];
  _disable: WebGL2RenderingContext["disable"];
  _viewport: WebGL2RenderingContext["viewport"];
  _scissor: WebGL2RenderingContext["scissor"];
  _depthMask: WebGL2RenderingContext["depthMask"];

  /* Patched on from EXT_texture_filter_anisotropic by imagecanvas_webgl.ts. */
  MAX_TEXTURE_MAX_ANISOTROPY: number;
  TEXTURE_MAX_ANISOTROPY: number;

  /* Set by consumers rather than by init_webgl(). */
  program: ShaderProgram;
  simple_shader: ShaderProgram;
};

/* Everything ShaderProgram.bind() knows how to push to the GPU. Vectors arrive
   here as Array subclasses, which is why the `v instanceof Array` branch in
   bind() catches them. */
export type UniformValue =
  | number
  | number[]
  | Float32Array
  | Float64Array
  | Vector2
  | Vector3
  | Vector4
  | Matrix4
  | Texture
  | IntUniform;
export type Uniforms = { [name: string]: UniformValue };

/* The literal shader descriptors in shaders.ts and simplemesh.ts. `__hash` is
   memoised by hashShader() on first use. */
export interface ShaderDef {
  vertex: string;
  fragment: string;
  uniforms: Uniforms;
  /* An iterable rather than an array: simplemesh.ts builds its auto-generated
     smooth-line variant with a Set here. */
  attributes: Iterable<string>;
  __hash?: string;
}

/* GLSL preprocessor defines; a null/empty value means a bare #define. */
export type ShaderDefines = { [name: string]: string | number | null | undefined };

/* Maps every numeric GL constant back to its name, for error reporting. */
export const constmap: { [value: string]: string } = {};

let TEXTURE_2D = 3553;

export class IntUniform {
  val: number;

  constructor(val: number) {
    this.val = val;
  }
}

/* Wraps every gl.* function so it checks getError() afterwards; the originals
   are kept alongside under an underscore-prefixed name. */
export function initDebugGL(gl: WebGLContext) {
  let addfuncs: { [name: string]: unknown } = {};

  let makeDebugFunc = (k: string, k2: string) => {
    return function (this: WebGLContext, ...args: unknown[]) {
      let ret = Reflect.get(this, k2).apply(this, args);

      let err = this.getError();
      if (err !== 0) {
        console.warn("gl." + k + ":", constmap[err]);
      }

      return ret;
    };
  };

  for (let k in gl) {
    let v = Reflect.get(gl, k);

    if (k !== "getError" && typeof v === "function") {
      let k2 = "_" + k;

      addfuncs[k2] = v;
      Reflect.set(gl, k, makeDebugFunc(k, k2));
    }
  }

  for (let k in addfuncs) {
    Reflect.set(gl, k, addfuncs[k]);
  }

  return gl;
}

let _gl: WebGLContext | undefined = undefined;

/* Shadows the handful of state getters/setters that get hammered every frame
   with a memoised version, so redundant GL calls are skipped. Only the keys in
   `validkeys` are cached; everything else falls through to the real call. */
export function addFastParameterGet(gl: WebGLContext) {
  let map: { [param: number]: boolean | number[] } = {};

  gl._getParameter = gl.getParameter;
  gl._enable = gl.enable;
  gl._disable = gl.disable;
  gl._viewport = gl.viewport;
  gl._scissor = gl.scissor;
  gl._depthMask = gl.depthMask;

  let validkeys = new Set<number>([
    gl.DEPTH_TEST,
    gl.MAX_VERTEX_ATTRIBS,
    gl.DEPTH_WRITEMASK,
    gl.SCISSOR_BOX,
    gl.VIEWPORT,
  ]);

  gl.depthMask = function (mask) {
    mask = !!mask;

    if (mask !== map[gl.DEPTH_WRITEMASK]) {
      map[gl.DEPTH_WRITEMASK] = mask;
      gl._depthMask(mask);
    }
  };

  gl.viewport = function (x, y, w, h) {
    let box = map[gl.VIEWPORT];

    if (!Array.isArray(box)) {
      map[gl.VIEWPORT] = [x, y, w, h];
    } else {
      box[0] = x;
      box[1] = y;
      box[2] = w;
      box[3] = h;
    }

    return gl._viewport(x, y, w, h);
  };

  gl.scissor = function (x, y, w, h) {
    let box = map[gl.SCISSOR_BOX];

    if (!Array.isArray(box)) {
      map[gl.SCISSOR_BOX] = [x, y, w, h];
    } else {
      box[0] = x;
      box[1] = y;
      box[2] = w;
      box[3] = h;
    }

    return gl._scissor(x, y, w, h);
  };

  gl.enable = function (p) {
    if (p in map && map[p]) {
      return;
    }

    map[p] = true;
    return gl._enable(p);
  };

  gl.disable = function (p) {
    if (p in map && !map[p]) {
      return;
    }

    map[p] = false;
    gl._disable(p);
  };

  //*
  gl.getParameter = function (p) {
    if (p !== undefined && !validkeys.has(p)) {
      return gl._getParameter(p);
    }

    if (p in map) {
      return map[p];
    }

    map[p] = this._getParameter(p);

    if (map[p] && Array.isArray(map[p])) {
      let cpy = [];
      for (let item of map[p]) {
        cpy.push(item);
      }

      map[p] = cpy;
    }

    return map[p];
  }; //*/
}
//*/

/* NOTE: this walked a `shapes` registry that is not defined in this module,
   or anywhere else in the tree, so restoring a lost context threw a
   ReferenceError. There is nothing here to iterate -- the per-object handlers
   live on the drawing objects themselves (see simplemesh.ts). Now a no-op. */
export function onContextLost(e: Event) {}

//params are passed to canvas.getContext as-is
/* Returns a process-wide singleton: the first call wins and every later call
   gets the same context back, `canvas` and `params` ignored. Nothing in the
   tree calls this; the live context comes from imagecanvas_webgl.ts. */
export function init_webgl(
  canvas: HTMLCanvasElement,
  params: WebGLContextAttributes & { webgl2?: boolean } = {}
) {
  if (_gl !== undefined) {
    return _gl;
  }

  let webgl2 = params.webgl2 !== undefined ? params.webgl2 : true;

  /* getContext() hands back the union of the two context interfaces; the rest
     of this module works against the WebGL2 superset, which the webgl1 branch
     below back-fills. */
  let gl = (
    webgl2 ? canvas.getContext("webgl2", params) : canvas.getContext("webgl", params)
  ) as WebGLContext;

  if (webgl2) {
    gl.color_buffer_float = gl.getExtension("EXT_color_buffer_float");
  } else {
    /* RGBA32F/RGBA8UI are readonly on a real WebGL2 context; on the webgl1
       one they do not exist at all, and this is where they come from. */
    if (!gl.RGBA32F) {
      Reflect.set(gl, "RGBA32F", gl.RGBA);
      Reflect.set(gl, "RGBA8UI", gl.RGBA);
    }

    gl.getExtension("EXT_frag_depth");
    gl.color_buffer_float = gl.getExtension("WEBGL_color_buffer_float");
    gl.texture_float = gl.getExtension("OES_texture_float");
  }

  canvas.addEventListener(
    "webglcontextlost",
    function (event) {
      event.preventDefault();
    },
    false
  );

  canvas.addEventListener("webglcontextrestored", onContextLost, false);

  addFastParameterGet(gl);

  _gl = gl;
  gl.haveWebGL2 = webgl2;

  for (let k in gl) {
    //of Object.getOwnPropertyNames(gl)) {
    let v = Reflect.get(gl, k);

    if (typeof v == "number" || typeof v == "string") {
      constmap[v] = k;
    }
  }

  window._constmap = constmap;

  gl.texture_float = gl.getExtension("OES_texture_float_linear");
  gl.float_blend = gl.getExtension("EXT_float_blend");
  gl.getExtension("OES_standard_derivatives");
  gl.getExtension("ANGLE_instanced_arrays");
  gl.getExtension("WEBGL_lose_context");
  gl.draw_buffers = gl.getExtension("WEBGL_draw_buffers");

  gl.depth_texture = gl.getExtension("WEBGL_depth_texture");
  //gl.getExtension("WEBGL_debug_shaders");

  gl.shadercache = {};

  if (DEBUG.gl) {
    initDebugGL(gl);
  }

  return gl;
}

function format_lines(script: string) {
  var i = 1;
  var lines = script.split("\n");
  var maxcol = Math.ceil(Math.log(lines.length) / Math.log(10)) + 1;

  var s = "";

  for (var line of lines) {
    s += "" + i + ":";
    while (s.length < maxcol) {
      s += " ";
    }

    s += line + "\n";
    i++;
  }

  return s;
}

/* The hash is just the shader's own JSON, memoised onto the def. */
export function hashShader(sdef: ShaderDef) {
  let clean = {
    vertex    : sdef.vertex,
    fragment  : sdef.fragment,
    uniforms  : sdef.uniforms,
    attributes: sdef.attributes,
  };

  let ret = JSON.stringify(clean);
  sdef.__hash = ret;

  return ret;
}

/*
shaderdef = {
  fragment : fragment shader code,
  vertex : vertex shader code,
  uniforms : uniforms,
  attributes : attributes
}
*/

export function getShader(gl: WebGLContext, shaderdef: ShaderDef) {
  if (gl.shadercache === undefined) {
    gl.shadercache = {};
  }

  let hash = shaderdef.__hash !== undefined ? shaderdef.__hash : hashShader(shaderdef);
  if (hash in gl.shadercache) {
    return gl.shadercache[hash];
  }

  let shader = new ShaderProgram(gl, shaderdef.vertex, shaderdef.fragment, shaderdef.attributes);
  if (shaderdef.uniforms) shader.uniforms = shaderdef.uniforms;

  gl.shadercache[hash] = shader;
  return shader;
}

/* NOTE: a module-level loadShader(id) used to live here, pulling shader text
   out of a <script> tag. It was unexported, unreachable, and unusable as
   written -- its error branch called a `log()` that does not exist and it
   handed format_lines() the script element rather than its text. The live
   version is the one nested inside ShaderProgram.init(). Removed. */

/* Scratch buffers for uniform2fv/3fv/4fv, indexed by component count. The two
   leading zeroes only pad the array out so the index is the length. */
const _safe_arrays: [number, number, Float32Array, Float32Array, Float32Array] = [
  0,
  0,
  new Float32Array(2),
  new Float32Array(3),
  new Float32Array(4),
];

export let use_ml_array = false;

export class ShaderProgram {
  vertexSource: string;
  fragmentSource: string;
  /* Set by init() when defines were spliced into the sources. */
  _vertexSource!: string;
  _fragmentSource!: string;

  attrs: string[];
  gl: WebGLContext;

  defines: ShaderDefines;
  /* When true, bind() builds and caches a variant per set of defines rather
     than compiling this program directly. */
  _use_def_shaders: boolean;
  _def_shaders: { [defkey: string]: ShaderProgram };

  /* SMOOTH_LINE variant of this program, generated and cached on first use by
     simplemesh.ts. */
  _smoothline!: ShaderProgram;

  /* attr name -> layer count, for the multilayer attribute machinery. */
  multilayer_attrs: { [attr: string]: number };
  multilayer_programs: { [attrsizekey: string]: ShaderProgram };

  /* 1 or true until init() has compiled and linked. */
  rebuild: number | boolean;

  program: WebGLProgram | undefined;
  vertexShader!: WebGLShader | null;
  fragmentShader!: WebGLShader | null;

  uniformlocs: { [name: string]: WebGLUniformLocation | null };
  attrlocs: { [name: string]: number };
  uniform_defaults: Uniforms;
  uniforms: Uniforms;

  constructor(gl: WebGLContext, vertex: string, fragment: string, attributes: Iterable<string>) {
    this.vertexSource = vertex;
    this.fragmentSource = fragment;

    this.attrs = [];

    this.multilayer_programs = {};

    for (var a of attributes) {
      this.attrs.push(a);
    }

    this.defines = {};
    this._use_def_shaders = true;
    this._def_shaders = {};

    this.multilayer_attrs = {};

    this.rebuild = 1;

    this.uniformlocs = {};
    this.attrlocs = {};
    this.uniform_defaults = {};

    this.uniforms = {};
    this.gl = gl;
  }

  /* `this.constructor` types as Function, so the statics below cannot be
     reached through it. This keeps the dynamic dispatch that a plain
     `ShaderProgram.` prefix would throw away. */
  get cls(): typeof ShaderProgram {
    return this.constructor as typeof ShaderProgram;
  }

  /* Splices the defines in after the third line, so a #version directive and
     any leading precision qualifiers stay first. */
  static insertDefine(define: string, code: string) {
    let lines = code.trim().split("\n");

    if (lines.length > 3) {
      lines = lines.slice(0, 3).concat([define]).concat(lines.slice(3, lines.length));
    } else {
      lines = lines.concat([define]);
    }

    return lines.join("\n") + "\n";
  }

  static _use_ml_array() {
    return use_ml_array;
  }
  static multilayerAttrSize(attr: string) {
    return attr.toUpperCase() + "_SIZE";
  }

  static multilayerGet(attr: string, i: number) {
    if (this._use_ml_array()) {
      return `${attr}_layers[${i}]`;
    } else {
      return `get_${attr}_layer(i)`;
    }
  }

  static maxMultilayer() {
    return 8;
  }

  static multilayerAttrDeclare(
    attr: string,
    type: string,
    is_fragment: boolean,
    is_glsl_300: boolean
  ) {
    let keyword, keyword2;

    if (is_fragment) {
      keyword = is_glsl_300 ? "in" : "attribute";
      keyword2 = is_glsl_300 ? "in" : "varying";
    } else {
      keyword = is_glsl_300 ? "in" : "attribute";
      keyword2 = is_glsl_300 ? "out" : "varying";
    }
    let size = this.multilayerAttrSize(attr);

    if (this._use_ml_array()) {
      let ret = `
#ifndef ${size}_DECLARE
#define ${size} 1
#endif

//${size}_DECLARE
#define ${attr} ${attr}_layers[0]\n`;
      if (!is_fragment) {
        ret += `${keyword} ${type} ${attr}_layers[${size}];\n`;
      }
      ret += `${keyword2} ${type} v${attr}_layers[${size}];\n`;

      return ret;
    }

    let ret = `
#ifndef ${size}_DECLARE
#define ${size} 1
#endif
//${size}_DECLARE\n`;
    if (!is_fragment) {
      ret += `${keyword} ${type} ${attr};\n`;
    }
    ret += `
${keyword2} ${type} v${attr};
    `;

    let func = `
${type} get_${attr}_layer(i) {
  switch (i) {
    case 0:
      return ${attr}

    `;
    for (let i = 0; i < this.maxMultilayer(); i++) {
      ret += `
      #if ${size} > ${i + 1}\n`;
      if (!is_fragment) {
        ret += `${keyword} ${type} ${attr}_${i + 2};\n`;
      }

      ret += `${keyword2} ${type} v${attr}_${i + 2};
      #endif
      `;

      if (i === 0) {
        continue;
      }

      func += `
    case ${i}:
#if ${size} > ${i + 1}
      return ${attr}_${i + 2};
      break;
#endif
      `;
    }

    func += "  }\n}\n";

    return ret;
  }

  /* `use_glsl300` is accepted and ignored. */
  static multiLayerAttrKey(attr: string, i: number, use_glsl300?: boolean) {
    if (!this._use_ml_array()) {
      return i ? `${attr}_${i}` : attr;
    } else {
      return `${attr}_layers[${i}]`;
    }
  }
  static multilayerVertexCode(attr: string) {
    let size = this.multilayerAttrSize(attr);
    let ret = `

v${attr} = ${attr};
#if ${size} > 1

    `;

    /* NOTE: this read `i < this.maxMultilayer` -- the method itself, not a
       call -- so the comparison was always false and the loop never ran. Kept
       as it was; correcting it would emit layer code no caller has seen. */
    const maxMultilayer = 0; //this.maxMultilayer()

    for (let i = 1; i < maxMultilayer; i++) {
      if (this._use_ml_array()) {
        ret += `
#if ${size} >= ${i}
  v${attr}_layers[{i}] = ${attr}_layers[${i}];
#endif
      `;
      } else {
        ret += `
#if ${size} >= ${i}
  v${attr}_${i + 2} = ${attr}_${i + 2};
#endif
      `;
      }
    }
    ret += "#endif\n";

    return ret;
  }

  setAttributeLayerCount(attr: string, n: number) {
    if (n <= 1 && attr in this.multilayer_attrs) {
      delete this.multilayer_attrs[attr];
    } else {
      this.multilayer_attrs[attr] = n;
    }

    return this;
  }

  init(gl: WebGLContext) {
    this.gl = gl;
    this.rebuild = false;

    let vshader = this.vertexSource,
      fshader = this.fragmentSource;

    if (!this._use_def_shaders) {
      let defs = "";

      for (let k in this.defines) {
        let v = this.defines[k];

        if (v === undefined || v === null || v === "") {
          defs += `#define ${k}\n`;
        } else {
          defs += `#define ${k} ${v}\n`;
        }
      }

      if (defs !== "") {
        vshader = this.cls.insertDefine(defs, vshader);
        fshader = this.cls.insertDefine(defs, fshader);

        this._vertexSource = vshader;
        this._fragmentSource = fshader;
      }
    }

    function loadShader(shaderType: number, code: string) {
      var shader = gl.createShader(shaderType);

      if (shader === null) {
        return null;
      }

      // Load the shader source
      gl.shaderSource(shader, code);

      // Compile the shader
      gl.compileShader(shader);

      // Check the compile status
      let compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (!compiled && !gl.isContextLost()) {
        // Something went wrong during compilation; get the error
        var error = gl.getShaderInfoLog(shader);

        console.log(format_lines(code));
        console.log("\nError compiling shader: ", error);

        gl.deleteShader(shader);
        return null;
      }

      return shader;
    }

    // create our shaders
    let vertexShader = loadShader(gl.VERTEX_SHADER, vshader);
    let fragmentShader = loadShader(gl.FRAGMENT_SHADER, fshader);

    // Create the program object
    let program = gl.createProgram();

    if (program === null || vertexShader === null || fragmentShader === null) {
      /* A failed compile used to reach attachShader() as a null argument,
         which GL rejects; the link check below then returned null anyway. */
      return null;
    }

    // Attach our two shaders to the program
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    let attribs = this.attrs;

    // Bind attributes
    let li = 0;

    for (let i = 0; i < attribs.length; ++i) {
      let attr = attribs[i];

      if (attr in this.multilayer_attrs) {
        let count = this.multilayer_attrs[attr];
        for (let j = 0; j < count; j++) {
          let key = this.cls.multiLayerAttrKey(attr, j, gl.haveWebGL2);
          gl.bindAttribLocation(program, li++, key);
        }
      } else {
        gl.bindAttribLocation(program, li++, attribs[i]);
      }
    }
    // Link the program
    gl.linkProgram(program);

    // Check the link status
    let linked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linked && !gl.isContextLost()) {
      // something went wrong with the link
      let error = gl.getProgramInfoLog(program);

      console.log("\nVERTEX:\n" + format_lines(vshader));
      console.log("\nFRAGMENT\n:" + format_lines(fshader));

      console.log("Error in program linking:" + error);

      gl.deleteProgram(program);

      //do nothing
      //gl.deleteProgram(program);
      //gl.deleteProgram(fragmentShader);
      //gl.deleteProgram(vertexShader);

      return null;
    }

    //console.log("created shader", program);

    this.program = program;

    this.gl = gl;
    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;

    this.attrlocs = {};
    this.uniformlocs = {};

    this.uniforms = {}; //default uniforms

    for (var i = 0; i < attribs.length; i++) {
      this.attrlocs[attribs[i]] = i;
    }
  }

  /* NOTE: a static load_shader(scriptid) used to live here, building a program
     out of a <script> tag whose text was split on a //fragment marker. It was
     called by nothing, constructed a ShaderProgram with no gl context, ignored
     its own `attrs` argument, and carried a thenable shim left over from when
     it was asynchronous. Removed, along with the ready/promise/then fields
     that only it ever set. */

  on_gl_lost(newgl: WebGLContext) {
    this.rebuild = 1;
    this.gl = newgl;
    this.program = undefined;

    this.uniformlocs = {};
  }

  destroy(gl: WebGLContext) {
    if (gl && this.program) {
      gl.deleteProgram(this.program);
      this.uniforms = {};
      this.program = undefined;
    }

    //XXX implement me
    //console.warn("ShaderProgram.prototype.destroy: implement me!");
  }

  uniformloc(name: string) {
    if (this.program === undefined) {
      return null;
    }

    if (this.uniformlocs[name] == undefined) {
      this.uniformlocs[name] = this.gl.getUniformLocation(this.program, name);
    }

    return this.uniformlocs[name];
  }

  /* NOTE: this called an attrLocation() that has never existed on this class,
     so it threw for any caller. Nothing calls it. */
  attrloc(name: string) {
    return this.attrLoc(name);
  }

  attrLoc(name: string) {
    if (this.program === undefined) {
      return -1;
    }

    if (!(name in this.attrlocs)) {
      this.attrlocs[name] = this.gl.getAttribLocation(this.program, name);
    }

    return this.attrlocs[name];
  }

  calcDefKey(extraDefines?: ShaderDefines) {
    let key = "";

    for (let i = 0; i < 2; i++) {
      let defs = i ? extraDefines : this.defines;

      if (!defs) {
        continue;
      }

      for (let k in defs) {
        let v = defs[k];

        key += k;

        if (v !== null && v !== undefined && v !== "") {
          key += ":" + v;
        }
      }
    }

    return key;
  }

  bindMultiLayer(
    gl: WebGLContext,
    uniforms: Uniforms,
    attrsizes: { [attr: string]: number },
    attributes?: object
  ) {
    let key = "";
    for (let k in attrsizes) {
      key += k + ":" + attrsizes[k] + ":";
    }

    if (key in this.multilayer_programs) {
      let shader = this.multilayer_programs[key];
      shader.defines = this.defines;

      return shader.bind(gl, uniforms, attributes);
    }

    let shader = this.copy();

    for (let k in attrsizes) {
      let i = attrsizes[k];

      if (i > 1) {
        shader.multilayer_attrs[k] = i;
      }

      let size = this.cls.multilayerAttrSize(k);

      let define = `#define ${size} ${i}`;

      shader.vertexSource = shader.vertexSource.replace("//" + size + "_DECLARE", define);
      shader.fragmentSource = shader.fragmentSource.replace("//" + size + "_DECLARE", define);
    }

    this.multilayer_programs[key] = shader;
    return shader.bind(gl, uniforms, attributes);
  }

  copy() {
    let ret = new ShaderProgram(this.gl, this.vertexSource, this.fragmentSource, this.attrs);

    ret.uniforms = this.uniforms;
    ret.defines = Object.assign({}, this.defines);

    return ret;
  }

  /* Returns `this` on success, or false when the program could not be built.
     `attributes` is only read for its keys, which become HAVE_<KEY> defines. */
  bind(gl: WebGLContext, uniforms?: Uniforms, attributes?: object): ShaderProgram | false {
    this.gl = gl;

    let defines: ShaderDefines | undefined = undefined;

    if (attributes && this._use_def_shaders) {
      for (let k in attributes) {
        let key = "HAVE_" + k.toUpperCase();

        if (!defines) {
          defines = {};
        }

        defines[key] = null;
      }
    }

    if (this._use_def_shaders) {
      let key = this.calcDefKey(defines);

      if (key !== "") {
        if (!(key in this._def_shaders)) {
          let shader = this.copy();

          if (defines) {
            for (let k in defines) {
              shader.defines[k] = defines[k];
            }
          }

          shader._use_def_shaders = false;

          this._def_shaders[key] = shader;
        }

        return this._def_shaders[key].bind(gl, uniforms);
      }
    }

    if (this.rebuild) {
      this.init(gl);

      if (this.rebuild) return false; //failed to initialize
    }

    if (!this.program) {
      return false;
    }

    function setv(dst: Float32Array, src: ArrayLike<number>, n: number) {
      for (var i = 0; i < n; i++) {
        dst[i] = src[i];
      }
    }

    let slot_i = 0;
    gl.useProgram(this.program);
    this.gl = gl;

    for (var i = 0; i < 2; i++) {
      var us = i ? uniforms : this.uniforms;

      if (uniforms === undefined) {
        continue;
      }

      for (var k in us) {
        var v = us[k];
        var loc = this.uniformloc(k);

        if (loc === undefined) {
          //stupid gl returns null if it optimized away the uniform,
          //so we must silently accept this
          //console.log("Warning, could not locate uniform", k, "in shader");
          continue;
        }

        if (v instanceof IntUniform) {
          gl.uniform1i(loc, v.val);
        } else if (v instanceof Texture) {
          let slot = v.texture_slot;

          if (slot === undefined) {
            slot = slot_i++;
          }

          v.bind(gl, this.uniformloc(k), slot);
        } else if (v instanceof Array || v instanceof Float32Array || v instanceof Float64Array) {
          switch (v.length) {
            case 2:
              var arr = _safe_arrays[2];
              setv(arr, v, 2);

              gl.uniform2fv(loc, arr);
              break;
            case 3:
              var arr = _safe_arrays[3];
              setv(arr, v, 3);
              gl.uniform3fv(loc, arr);
              break;
            case 4:
              var arr = _safe_arrays[4];
              setv(arr, v, 4);
              gl.uniform4fv(loc, arr);
              break;
            default:
              console.log(v);
              throw new Error("invalid array");
              break;
          }
        } else if (v instanceof Matrix4) {
          //console.log("found matrix");
          if (loc !== null) {
            v.setUniform(gl, loc);
          }
        } else if (typeof v == "number") {
          gl.uniform1f(loc, v);
        } else if (v !== undefined && v !== null) {
          console.warn("Invalid uniform", k, v);
          throw new Error("Invalid uniform");
        }
      }
    }

    return this;
  }
}

window._ShaderProgram = ShaderProgram;

const GL_ARRAY_BUFFER = 34962;
const GL_ELEMENT_ARRAY_BUFFER = 34963;

/* What actually gets uploaded: always a typed array. `length` is read below,
   which the bare ArrayBufferView interface does not carry. */
export type GLBufferData = ArrayBufferView & { length: number };

export class VBO {
  gl: WebGLContext;
  vbo: WebGLBuffer | undefined;
  /* Element count of the last upload, or -1 when nothing has been uploaded
     yet. uploadData() uses it to decide between bufferData and bufferSubData. */
  size: number;
  bufferType: number;
  ready: boolean;
  /* Kept so the buffer can be re-uploaded after a context loss. */
  lastData: GLBufferData | undefined;
  dead: boolean;
  drawhint: number | undefined;

  constructor(
    gl: WebGLContext,
    vbo: WebGLBuffer | undefined,
    size = -1,
    bufferType: number = GL_ARRAY_BUFFER
  ) {
    this.gl = gl;
    this.vbo = vbo;
    this.size = size;

    this.bufferType = bufferType;

    this.ready = false;
    this.lastData = undefined;
    this.dead = false;
    this.drawhint = undefined;
    this.lastData = undefined;
  }

  get(gl?: WebGLContext) {
    if (this.dead) {
      throw new Error("vbo is dead");
    }

    if (gl !== undefined && gl !== this.gl) {
      this.ready = false;
      this.gl = gl;
      this.vbo = gl.createBuffer();

      console.warn("context loss detected");
    }

    if (!this.ready) {
      console.warn("buffer was not ready; forgot to call .uploadData?");
    }

    if (!this.vbo) {
      throw new Error("webgl error");
    }

    return this.vbo;
  }

  checkContextLoss(gl?: WebGLContext) {
    if (gl !== undefined && gl !== this.gl) {
      this.ready = false;
      this.gl = gl;
      this.vbo = gl.createBuffer();

      console.warn("context loss detected");

      if (this.lastData !== undefined) {
        this.uploadData(gl, this.lastData, this.bufferType, this.drawhint);
      }
    }
  }

  reset(gl: WebGLContext) {
    if (this.dead) {
      this.dead = false;
      this.gl = gl;
      this.vbo = gl.createBuffer();
      console.log("vbo creation");
    }

    this.ready = false;
    this.lastData = undefined;

    return this;
  }

  destroy(gl: WebGLContext) {
    if (this.dead) {
      console.warn("tried to kill vbo twice");
      return;
    }

    this.ready = false;

    gl.deleteBuffer(this.vbo ?? null);

    this.vbo = undefined;
    this.lastData = undefined;
    this.gl = undefined!;
    this.dead = true;
  }

  uploadData(
    gl: WebGLContext,
    dataF32: GLBufferData,
    target = this.bufferType,
    drawhint: number = gl.STATIC_DRAW
  ) {
    if (gl !== this.gl) {
      //context loss
      this.gl = gl;
      this.vbo = gl.createBuffer();
      this.size = -1;

      console.warn("Restoring VBO after context loss");
    }

    let useSub = this.size === dataF32.length && this.vbo;

    this.lastData = dataF32;
    this.size = dataF32.length;

    this.drawhint = drawhint;

    gl.bindBuffer(target, this.vbo ?? null);

    if (useSub) {
      gl.bufferSubData(target, 0, dataF32);
    } else {
      if (DEBUG.simplemesh) {
        console.warn("bufferData");
      }
      gl.bufferData(target, dataF32, drawhint);
    }

    this.ready = true;
  }
}

/* A named collection of VBOs. Every buffer is stored twice: in `_layers`, and
   directly on the instance under its own name, which is how consumers reach
   them (`rb.uvs`, `rb.colors`, ...). */
export class RenderBuffer {
  _layers: { [name: string]: VBO };

  constructor() {
    this._layers = {};
  }

  get(gl: WebGLContext, name: string, bufferType: number = gl.ARRAY_BUFFER): VBO {
    /* The buffers live on the instance under their own names, so this is a
       dynamic property lookup by definition. */
    const self: object = this;
    const existing = Reflect.get(self, name);

    if (existing !== undefined) {
      return existing;
    }

    //console.log("new buffer");
    let buf = gl.createBuffer();

    let vbo = new VBO(gl, buf, undefined, bufferType);

    this._layers[name] = vbo;
    Reflect.set(self, name, vbo);

    return vbo;
  }

  get buffers() {
    let this2 = this;

    return (function* () {
      for (let k in this2._layers) {
        yield this2._layers[k];
      }
    })();
  }

  reset(gl: WebGLContext) {
    for (let vbo of this.buffers) {
      vbo.reset(gl);
    }
  }

  destroy(gl: WebGLContext, name?: string) {
    if (name === undefined) {
      for (let k in this._layers) {
        this._layers[k].destroy(gl);

        /* NOTE: `name` is undefined in this branch, so both deletes target the
           literal key "undefined" and remove nothing -- the destroyed buffers
           stay in the map and on `this`. Kept as it was. */
        delete this._layers[name!];
        Reflect.deleteProperty(this, name!);
      }
    } else {
      if (this._layers[name] === undefined) {
        console.trace("WARNING: gl buffer not in RenderBuffer!", name, gl);
        return;
      }

      this._layers[name].destroy(gl);

      delete this._layers[name];
      Reflect.deleteProperty(this, name);
    }
  }
}

/* Everything the last texImage2D() call was given, so copy() can rebuild an
   identically-configured texture. Only `target` is always present; the rest
   arrive on the first upload. */
export interface TexCreateParams {
  target: number;
  level?: number;
  internalformat?: number;
  format?: number;
  type?: number;
  source?: TexImageSource | ArrayBufferView | null;
  width?: number;
  height?: number;
  border?: number;
}

export class Texture {
  texture: WebGLTexture | undefined;
  texture_slot: number | undefined;
  target: number;

  createParams: TexCreateParams;
  /* The same values positionally, in the order texImage2D() took them. */
  createParamsList: (number | TexImageSource | ArrayBufferView | null | undefined)[];

  /* Shadow of the texture's sampler state, keyed by GL parameter enum. */
  _params: { [param: number]: number };

  //3553 is gl.TEXTURE_2D
  constructor(texture_slot?: number, texture?: WebGLTexture, target: number = 3553) {
    this.texture = texture;
    this.texture_slot = texture_slot;
    this.target = target;

    this.createParams = {
      target: TEXTURE_2D,
    };

    this.createParamsList = [TEXTURE_2D];

    this._params = {};
  }

  static unbindAllTextures(gl: WebGLContext) {
    for (let i = gl.TEXTURE0; i < gl.TEXTURE0 + 31; i++) {
      gl.activeTexture(i);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }

  texParameteri(gl: WebGLContext, target: number, param: number, value: number) {
    this._params[param] = value;

    gl.texParameteri(target, param, value);
    return this;
  }

  getParameter(gl: WebGLContext, param: number) {
    return this._params[param];
  }

  _texImage2D1(
    gl: WebGLContext,
    target: number,
    level: number,
    internalformat: number,
    format: number,
    type: number,
    source: TexImageSource
  ) {
    gl.bindTexture(target, this.texture ?? null);
    gl.texImage2D(target, level, internalformat, format, type, source);

    gl.getError();

    this.createParams = {
      target,
      level,
      internalformat,
      format,
      type,
      source,
    };
    this.createParamsList = [target, level, internalformat, format, type, source];

    if (source instanceof Image || source instanceof ImageData) {
      this.createParams.width = source.width;
      this.createParams.height = source.height;
    }

    return this;
  }

  _texImage2D2(
    gl: WebGLContext,
    target: number,
    level: number,
    internalformat: number,
    width: number,
    height: number,
    border: number,
    format: number,
    type: number,
    source: ArrayBufferView | null
  ) {
    gl.bindTexture(target, this.texture ?? null);

    gl.getError();

    //if (source === undefined || source === null) {
    //  gl.texImage2D(target, level, internalformat, width, height, border, format, type, undefined);
    //} else {
    gl.texImage2D(target, level, internalformat, width, height, border, format, type, source);
    //}

    this.createParams = {
      target,
      level,
      internalformat,
      format,
      type,
      source,
      width,
      height,
      border,
    };
    this.createParamsList = [
      target,
      level,
      internalformat,
      format,
      type,
      source,
      width,
      height,
      border,
    ];

    gl.getError();

    return this;
  }

  /* Arity dispatch: the seven-argument form takes an image source, the ten
     argument one takes explicit dimensions. */
  texImage2D(...args: Parameters<Texture["_texImage2D1"]> | Parameters<Texture["_texImage2D2"]>) {
    if (args.length === 7) {
      return this._texImage2D1(...args);
    } else {
      return this._texImage2D2(...args);
    }
  }

  /* NOTE: a copy() / copyTexTo() pair used to live here. Nothing called either
     (fbo.ts's two uses are commented out) and neither could have worked:
     copy(gl, false) dropped the `gl` argument, so its six remaining arguments
     fell through to the ten-argument form and bound a GL enum as the context,
     and copyTexTo() handed texImage2D() a WebGLTexture where a pixel source
     goes, which GL rejects outright. Removed. */

  destroy(gl: WebGLContext) {
    gl.deleteTexture(this.texture ?? null);
  }

  load(
    gl: WebGLContext,
    width: number,
    height: number,
    data: ArrayBufferView | null,
    target: number = gl.TEXTURE_2D
  ) {
    if (!this.texture) {
      this.texture = gl.createTexture();
    }
    gl.bindTexture(target, this.texture ?? null);

    if (data instanceof Float32Array) {
      gl.texImage2D(target, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, data);
    } else {
      gl.texImage2D(target, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    }

    gl.getError();
    Texture.defaultParams(gl, this, target);
    gl.getError();

    return this;
  }

  initEmpty(
    gl: WebGLContext,
    target: number,
    width: number,
    height: number,
    format: number = gl.RGBA,
    type: number = gl.FLOAT
  ) {
    this.target = target;
    //this.width = width;
    //this.height = height;
    //this.format = format;
    //this.type = type;

    if (!this.texture) {
      this.texture = gl.createTexture();
      Texture.defaultParams(gl, this.texture, target);
    }

    /* NOTE: this called bindTexture() with the texture alone -- GL wants
       (target, texture) -- which throws for want of an argument. Corrected to
       pass the target that was just assigned above. */
    gl.bindTexture(this.target, this.texture ?? null);
    gl.texImage2D(this.target, 0, format, width, height, 0, format, type, null);

    return this;
  }

  static load(
    gl: WebGLContext,
    width: number,
    height: number,
    data: ArrayBufferView | null,
    target: number = gl.TEXTURE_2D
  ) {
    return new Texture(0).load(gl, width, height, data, target);
  }

  static defaultParams(
    gl: WebGLContext,
    tex: Texture | WebGLTexture,
    target: number = gl.TEXTURE_2D
  ) {
    let tex2: Texture;

    if (tex instanceof Texture) {
      tex2 = tex;
    } else {
      console.warn(
        "Depracated call to Texture.defaultParams with 'tex' a raw WebGLTexture instance instance of wrapper webgl.Texture object"
      );
      tex2 = new Texture(undefined, tex);
    }

    gl.bindTexture(target, tex2.texture ?? null);

    tex2.texParameteri(gl, target, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    tex2.texParameteri(gl, target, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    tex2.texParameteri(gl, target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    tex2.texParameteri(gl, target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  bind(
    gl: WebGLContext,
    uniformloc: WebGLUniformLocation | null,
    slot: number = this.texture_slot!
  ) {
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(this.target, this.texture ?? null);
    gl.uniform1i(uniformloc, slot);
  }
}

export class CubeTexture extends Texture {
  constructor(texture_slot: number, texture: WebGLTexture) {
    super();

    this.texture = texture;
    this.texture_slot = texture_slot;
  }

  bind(
    gl: WebGLContext,
    uniformloc: WebGLUniformLocation | null,
    slot: number = this.texture_slot!
  ) {
    gl.activeTexture(gl.TEXTURE0 + slot);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture ?? null);
    gl.uniform1i(uniformloc, slot);
  }
}

/* The serialized form of a DrawMats; every matrix flattens to 16 floats. */
export interface DrawMatsJSON {
  cameramat: number[];
  persmat: number[];
  rendermat: number[];
  normalmat: number[];
  isPerspective: boolean;
  icameramat: number[];
  ipersmat: number[];
  irendermat: number[];
  inormalmat: number[];
}

//cameras will derive from this class
export class DrawMats {
  static STRUCT: string;

  isPerspective: boolean;

  cameramat: Matrix4;
  persmat: Matrix4;
  rendermat: Matrix4;
  normalmat: Matrix4;

  icameramat: Matrix4;
  ipersmat: Matrix4;
  irendermat: Matrix4;
  inormalmat: Matrix4;

  /* sizex / sizey. Only ever assigned by regen_mats(), so it is undefined
     until the first call -- which is also why regen_mats defaults to it. */
  aspect!: number;

  constructor() {
    this.isPerspective = true;

    this.cameramat = new Matrix4();
    this.persmat = new Matrix4();
    this.rendermat = new Matrix4();
    this.normalmat = new Matrix4();

    this.icameramat = new Matrix4();
    this.ipersmat = new Matrix4();
    this.irendermat = new Matrix4();
    this.inormalmat = new Matrix4();
  }

  /** aspect should be sizex / sizey */
  regen_mats(aspect = this.aspect) {
    this.aspect = aspect;

    this.rendermat.load(this.persmat).multiply(this.cameramat);
    this.normalmat.load(this.cameramat).makeRotationOnly();

    this.icameramat.load(this.cameramat).invert();
    this.ipersmat.load(this.persmat).invert();
    this.irendermat.load(this.rendermat).invert();
    this.inormalmat.load(this.normalmat).invert();

    return this;
  }

  toJSON(): DrawMatsJSON {
    return {
      cameramat    : this.cameramat.getAsArray(),
      persmat      : this.persmat.getAsArray(),
      rendermat    : this.rendermat.getAsArray(),
      normalmat    : this.normalmat.getAsArray(),
      isPerspective: this.isPerspective,

      icameramat: this.icameramat.getAsArray(),
      ipersmat  : this.ipersmat.getAsArray(),
      irendermat: this.irendermat.getAsArray(),
      inormalmat: this.inormalmat.getAsArray(),
    };
  }

  loadJSON(obj: DrawMatsJSON) {
    this.cameramat.load(obj.cameramat);
    this.persmat.load(obj.persmat);
    this.rendermat.load(obj.rendermat);
    this.normalmat.load(obj.normalmat);
    this.isPerspective = obj.isPerspective;

    this.icameramat.load(obj.icameramat);
    this.ipersmat.load(obj.ipersmat);
    this.irendermat.load(obj.irendermat);
    this.inormalmat.load(obj.inormalmat);

    return this;
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
  }
}
DrawMats.STRUCT = `
DrawMats {
  cameramat     : mat4;
  persmat       : mat4;
  rendermat     : mat4;
  normalmat     : mat4;
  icameramat    : mat4;
  ipersmat      : mat4;
  irendermat    : mat4;
  inormalmat    : mat4;
  isPerspective : int;
}
`;
nstructjs.manager.add_class(DrawMats);

export interface CameraJSON extends DrawMatsJSON {
  fovy: number;
  near: number;
  far: number;
  aspect: number;
  target: number[];
  pos: number[];
  up: number[];
}

//simplest
export class Camera extends DrawMats {
  static STRUCT: string;

  /* Vertical field of view in degrees; ignored when isPerspective is false. */
  fovy: number;

  pos: Vector3;
  target: Vector3;
  /* Where orbiting pivots, which is not always the look-at target. */
  orbitTarget: Vector3;
  up: Vector3;

  near: number;
  far: number;

  constructor() {
    super();

    this.isPerspective = true;

    this.fovy = 35;
    this.aspect = 1.0;

    this.pos = new Vector3([0, 0, 5]);
    this.target = new Vector3();
    this.orbitTarget = new Vector3();

    this.up = new Vector3([1, 3, 0]);
    this.up.normalize();

    this.near = 0.25;
    this.far = 10000.0;
  }

  /* Cheap change detector: every field that affects the matrices is folded
     into one 31-bit integer. Collisions are possible but unlikely. */
  generateUpdateHash(objectMatrix?: Matrix4) {
    let mul = 1 << 18;

    let ret = 0;

    function add(val: number) {
      val = (val * mul) & ((1 << 31) - 1);
      ret = (ret ^ val) & ((1 << 31) - 1);
    }

    add(this.near);
    add(this.far);
    add(this.fovy);
    add(this.aspect);
    add(this.isPerspective ? 1 : 0);
    add(this.pos[0]);
    add(this.pos[1]);
    add(this.pos[2]);
    add(this.target[0]);
    add(this.target[1]);
    add(this.target[2]);
    add(this.up[0]);
    add(this.up[1]);
    add(this.up[2]);

    if (objectMatrix !== undefined) {
      let m = objectMatrix.$matrix;

      add(m.m11);
      add(m.m12);
      add(m.m13);
      add(m.m21);
      add(m.m22);
      add(m.m23);
      add(m.m31);
      add(m.m32);
      add(m.m33);
    }

    return ret;
  }

  load(b: Camera) {
    this.isPerspective = b.isPerspective;
    this.fovy = b.fovy;
    this.aspect = b.aspect;
    this.pos.load(b.pos);
    this.orbitTarget.load(b.orbitTarget);
    this.target.load(b.target);
    this.up.load(b.up);
    this.near = b.near;
    this.far = b.far;

    this.regen_mats(this.aspect);

    return this;
  }

  copy() {
    let ret = new Camera();

    ret.isPerspective = this.isPerspective;
    ret.fovy = this.fovy;
    ret.aspect = this.aspect;

    ret.pos.load(this.pos);
    ret.target.load(this.target);
    ret.orbitTarget.load(this.orbitTarget);
    ret.up.load(this.up);

    ret.near = this.near;
    ret.far = this.far;

    ret.regen_mats(ret.aspect);

    return ret;
  }

  reset() {
    this.pos = new Vector3([0, 0, 5]);
    this.target = new Vector3();
    this.up = new Vector3([1, 3, 0]);
    this.up.normalize();

    this.regen_mats(this.aspect);
    window.redraw_all();

    return this;
  }

  toJSON(): CameraJSON {
    return Object.assign(super.toJSON(), {
      fovy  : this.fovy,
      near  : this.near,
      far   : this.far,
      aspect: this.aspect,

      target: this.target.slice(0),
      pos   : this.pos.slice(0),
      up    : this.up.slice(0),
    });
  }

  loadJSON(obj: CameraJSON) {
    super.loadJSON(obj);

    this.fovy = obj.fovy;

    this.near = obj.near;
    this.far = obj.far;
    this.aspect = obj.aspect;

    this.target.load(obj.target);
    this.pos.load(obj.pos);
    this.up.load(obj.up);

    return this;
  }

  /** aspect should be sizex / sizey*/
  regen_mats(aspect = this.aspect) {
    this.aspect = aspect;

    this.persmat.makeIdentity();
    if (this.isPerspective) {
      this.persmat.perspective(this.fovy, aspect, this.near, this.far);
    } else {
      /* Suspicious: isPersp is set on the *orthographic* branch. */
      this.persmat.isPersp = true;
      let scale = 1.0 / this.pos.vectorDistance(this.target);

      this.persmat.makeIdentity();
      this.persmat.orthographic(scale, aspect, this.near, this.far);

      //this.persmat.scale(1, 1, -2.0/zscale, 1.0/scale);
      //this.persmat.translate(0.0, 0.0, 0.5*zscale - this.near);
    }

    this.cameramat.makeIdentity();
    this.cameramat.lookat(this.pos, this.target, this.up);
    this.cameramat.invert();

    this.rendermat.load(this.persmat).multiply(this.cameramat);
    //this.rendermat.load(this.cameramat).multiply(this.persmat);

    return super.regen_mats(aspect); //will calculate iXXXmat for us
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
  }
}

Camera.STRUCT =
  STRUCT.inherit(Camera, DrawMats) +
  `
  fovy          : float;
  aspect        : float;
  target        : vec3;
  orbitTarget   : vec3;
  pos           : vec3;
  up            : vec3;
  near          : float;
  far           : float;
  isPerspective : bool;
}
`;
nstructjs.manager.add_class(Camera);
