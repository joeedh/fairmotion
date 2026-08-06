"not_a_module";
"use strict";

var defined_classes: ESClassRegistryEntry[] = [];
/* Filled by register_test(); utils.ts's do_unit_tests() runs them. */
var defined_tests: (() => boolean)[] = new Array();


if (Array.prototype.remove === undefined) {
  Array.prototype.remove = function (this: unknown[], item: unknown, throw_error = true) {
    let idx = this.indexOf(item);

    if (idx < 0) {
      console.warn("Item not in array:", item);

      if (throw_error) {
        throw new Error("Item not in array");
      } else {
        return this;
      }
    }

    while (idx < this.length - 1) {
      this[idx] = this[idx + 1];

      idx++;
    }

    this[idx] = undefined;
    this.length--;

    return this;
  }
}

function register_test(obj: () => boolean) {
  defined_tests.push(obj);
}

//a mini module!
/* NOTE: the `Class(...)` factory that made up the rest of this module -- and
   its get/set/static/symbol wrappers -- has been deleted.  Only the old
   transpiler's generated `Class([...])` calls ever reached it; the esbuild
   classRegistryPlugin that replaced it emits `_ESClass.register(Foo)` and
   nothing else. */
window._ESClass = (function() {
  let prototype_idgen = 1;

  return {
    register(cls: ESClassRegistryEntry) {
      cls.prototype.__prototypeid__ = prototype_idgen++;
      cls.__parent__ = cls.prototype.__proto__.constructor;
      cls.prototype.prototype = cls.prototype.__proto__;

      defined_classes.push(cls);
    }
  };
})();

/* Copies parent's whole prototype chain onto child's prototype, skipping any
   key child already has. Used where real inheritance was not an option. */
function mixin(child: Function, parent: Function) {
  let ok = true;

  while (ok) {
    let keys = Object.getOwnPropertyNames(parent.prototype);
    for (var i=0; i<keys.length; i++) {
      let k = keys[i];

      if (child.prototype[k] == undefined) {
        child.prototype[k] = parent.prototype[k];
      }
    }

    var symbols = Object.getOwnPropertySymbols(parent.prototype);
    for (var i=0; i<symbols.length; i++) {
      var k = symbols[i];

      if (!(k in child.prototype)) {
        child.prototype[k] = parent.prototype[k];
      }
    }

    let next = parent.prototype.__proto__.constructor;

    ok = parent !== next;
    parent = next;
    ok = ok && parent !== undefined && parent !== Object;
  }
}

function define_static(obj: Function, name: string, val: unknown) {
  Reflect.set(obj, name, val);

  let statics = Reflect.get(obj, "__statics__");
  if (statics) {
    statics[name] = name;
  }

  /* NOTE: `typeof val == "string"` was in this test too, and stamping a
     property on a string primitive throws in strict mode. */
  if (val != undefined && (typeof val == "object" || typeof val == "function")) {
    Reflect.set(val as object, "_is_static_method", true);
  }
}

/* instanceof that also understands the __subclass_map__ the _ESClass factory
   above builds, for classes that never made it onto a real prototype chain. */
function __instance_of(child: unknown, parent: Function | undefined) {
  /* NOTE: the parent == undefined test used to sit below the instanceof, which
     throws TypeError for an undefined right-hand side, so it never ran. */
  if (parent == undefined)
    return child == undefined;

  if (child instanceof parent)
    return true;

  if (typeof child != "object" && typeof child != "function")
    return typeof child == typeof(parent); //return btypeof(child) == btypeof(parent);

  let map = Reflect.get(parent, "__subclass_map__");

  /* `in` stringifies its left operand anyway, so String() changes nothing. */
  if (child !== null && "__prototypeid__" in child
      && typeof map === "object" && map !== null) {
    return String(Reflect.get(child, "__prototypeid__")) in map;
  } else {
    //console.log("falling back on normal instanceof");
    //console.log(parent.__subclass_map__, parent)
    return child instanceof parent;
  }
}

var instance_of = __instance_of;

//a basic array iterator utility function
class arr_iter {
  /* One reused result object, as before. */
  ret: {done: boolean; value: unknown};
  keys: unknown[];
  cur: number;

  constructor(keys: unknown[]) {
    this.ret = {done : false, value : undefined};
    this.keys = keys;
    this.cur = 0;
  }

  [Symbol.iterator]() {
    return this;
  }

  next() {
    if (this.cur >= this.keys.length) {
      this.ret.done = true;
      this.ret.value = undefined;

      return this.ret;
    }

    this.ret.value = this.keys[this.cur++];
    return this.ret;
  }
}

var _forin_data = {};

function save_forin_conv() {
    var s = ""
    var lst = Object.keys(_forin_data)
    
    lst.sort();
    
    var buf = lst.join("\n")
    var blob = new Blob([buf], {type: "text/plain"});
    var obj_url = window.URL.createObjectURL(blob);
    
    window.open(obj_url);
}

var __sp_ws = {
  "\n" : 0,
  "\r" : 0,
  "\t" : 0,
  "\v" : 0,
  " " : 0,
  "\0" : 0
}

if (String.prototype.trimRight == undefined) {
  String.prototype.trimRight = function(this: string) {
    var i = this.length-1;
    
    while (i >= 0 && this[i] in __sp_ws) {
      i--;
    }
    
    return this.slice(0, i+1);
  }
}

if (String.prototype.trimLeft == undefined) {
  String.prototype.trimLeft = function(this: string) {
    var i = 0;
    
    while (i < this.length && this[i] in __sp_ws) {
      i++;
    }
    
    return this.slice(i, this.length);
  }
}

//for in loops were always a pain
//unfortunately, we still have to expand
//them for generator code to work
function __get_in_iter(obj: object) {
  if (obj == undefined) {
    console.trace();
    print_stack();
    throw new Error("Invalid iteration over undefined value")
  }
  
  var keys = _my_object_keys(obj);
  return new arr_iter(keys);
}

/*the grand __get_iter function.
  extjs_cc does not use c[Symbol.iterator] when
  compiling code like "for (var a in c)" to
  harmony ECMAScript; rather, it calls __get_iter(c).
  
  keyword is either "in" or "of"
*/
function __get_iter(obj: object) //, file, line, keyword)
{
  if (obj == undefined) {
    console.trace();
    print_stack();
    throw new Error("Invalid iteration over undefined value")
  }
  
  let iter = Reflect.get(obj, Symbol.iterator);

  if (iter != undefined) {
    /*
    if (keyword == "in") {
      var hash = file + ":"+line +":" + keyword
      
      if (!(hash in _forin_data)) {
        _forin_data[hash] = [file, line]
      }
    }
    //*/
    
    return iter.call(obj);
  }
}

class _KeyValIterator {
  /* One reused result object; `value` is the same [key, val] pair each time. */
  ret : {done: boolean; value: [string, unknown] | undefined}
  i : number;
  obj : {[key: string]: unknown};
  keys : string[];

  constructor(obj: {[key: string]: unknown}) {
    this.ret = {done : false, value : ["", undefined]};
    this.i = 0;
    this.obj = obj;
    
    this.keys = Object.keys(obj);
  }
  
  [Symbol.iterator]() {
    return this;
  }
  
  next() {
    if (this.i >= this.keys.length) {
      this.ret.done = true;
      this.ret.value = undefined;
      
      return this.ret;
    }
    
    var k = this.keys[this.i];
    var v = this.obj[k];

    /* the pair is reused; it is only rebuilt after a done cycle cleared it. */
    if (this.ret.value === undefined) {
      this.ret.value = [k, v];
    } else {
      this.ret.value[0] = k;
      this.ret.value[1] = v;
    }

    this.i++;

    return this.ret;
  }
}

var Iterator = function(obj: {[key: string]: unknown}) {
  let iter = Reflect.get(obj, Symbol.iterator);

  if (iter != undefined) {
    return iter.call(obj);
  } else {
    return new _KeyValIterator(obj);
  }
}

function define_docstring(func: Function, docstr: string) {
  Reflect.set(func, "__doc__", docstr);
  
  return func;
}

//XXX do I ever use this?
function __bind_super_prop(obj: object, cls: Function, parent: Function, prop: string) {
  var descr = Object.getOwnPropertyDescriptor(parent.prototype, prop);
  
  if (descr == undefined) 
    return parent.prototype[prop];
  
  if (descr.get != undefined) {
    return descr.get.call(obj);
  } else if (descr.value != undefined) {
    return descr.value;
  } else {
    var p = parent.prototype[prop];
    
    if (typeof p == "function") {
      console.trace("Warning: inefficient branch detected in __bind_super_prop");
      return p.bind(obj);
    } else {
      return p;
    }
  }
}
