"not_a_module";
"use strict";

var defined_classes = [];
var defined_tests = new Array();


if (Array.prototype.remove === undefined) {
  Array.prototype.remove = function (item, throw_error = true) {
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

function register_test(obj) {
  defined_tests.push(obj);
}

//a mini module!
window._ESClass = (function() {
  function ClassGetter(func) {
    this.func = func;
  }
  function ClassSetter(func) {
    this.func = func;
  }

  var StaticMethod = function StaticMethod(func) {
    this.func = func;
  };
    
  var SymbolMethod = function SymbolMethod(symbol, func) {
    if (typeof symbol === "object" && Array.isArray(symbol)) {
      symbol = symbol[0];
    }

    this.symbol = symbol;
    this.func = func;
  };

  var handle_statics = function(cls, parent) {
    for (var k in cls.prototype) {
      if (cls.prototype[k] instanceof StaticMethod) {
        var func = cls.prototype[k];
        
        delete cls.prototype[k];
        cls[k] = func.func;
      }
    }
    
    if (parent != undefined) {
      for (var k in parent) {
        var v = parent[k];
        
        //only inherit static methods added to parent with this module
        if (v == undefined || ((typeof v == "object" || typeof v == "function") && "_is_static_method" in v)
            && !(k in cls)) {
        //if (!(k in cls)) {
          cls[k] = v;
        }
      }
    }
  }

  //arguments:
  //constructor_name, parent, methods
  var Class = function Class() {
    if (arguments.length == 3) {
      var classname = arguments[0], parent = arguments[1], 
                 methods = arguments[2];
    } else if (arguments.length == 2) {
      if (typeof arguments[0] == "string") {
        var classname = arguments[0], parent = undefined, 
                   methods = arguments[1];
      } else {
        var classname = "constructor", parent = arguments[0], 
                   methods = arguments[1];
      }
    } else {
      var classname = "constructor", parent = undefined,
                 methods = arguments[0];
    }
    
    var construct = undefined;
    var ownmethods = {}

    for (var i=0; i<methods.length; i++) {
      var f = methods[i];
      
      if (f.name == classname) {
        construct = f;
        methods.remove(f);
        break;
      }
    }
    
    if (construct === undefined) {
      console.trace("Error, constructor was not defined", methods);
      throw new Error("Error, constructor was not defined");
      
      if (parent != undefined) {
        construct = function() {
          parent.apply(this, arguments);
        }
      } else {
        construct = function() {
        }
      }
    }
    
    if (parent != undefined) {
      construct.prototype = Object.create(parent.prototype);
    }
    
    construct.prototype.constructor = construct;
    construct.prototype.__prototypeid__ = Class.__prototype_idgen++;
    construct.__prototypeid__ = construct.prototype.__prototypeid__;
    
    construct[Symbol.keystr] = function() {
      return this.prototype.__prototypeid__;
    }
    
    construct.__parent__ = parent;
    construct.__statics__ = {};
    construct.__subclass_map__ = {};
    construct.__subclass_map__[construct.__prototypeid__] = 1;
    construct.prototype.__class__ = construct.name;
    
    var p = parent;
    while (p != undefined) {
      if (p.__subclass_map__ == undefined) {
        p.__subclass_map__ = {};
        p.__prototypeid__ = Class.__prototype_idgen++;
      }
      
      p.__subclass_map__[construct.__prototypeid__] = 1;
      p = p.__parent__;
    }
    
    var getters = {};
    var setters = {};
    var getset = {};
    
    var statics = {}
    
    //handle getters/setters
    for (var i=0; i<methods.length; i++) {
      var f = methods[i];
      var name, func;
      
      if (!(f instanceof ClassGetter) &&
          !(f instanceof ClassSetter) &&
          !(f instanceof StaticMethod))
      {
        continue;
      }
      
      if (f.func instanceof SymbolMethod) {
        name = f.func.symbol;
        func = f.func.func;
        
        if (name == undefined) {
          throw new Error("Symbol was undefined");
        }
      } else {
        name = f.func.name;
        func = f.func;
      }
      
      if (f instanceof ClassSetter) {
        setters[name] = func;
        getset[name] = 1;
      } else if (f instanceof ClassGetter) {
        getters[name] = func;
        getset[name] = 1;
      } else if (f instanceof StaticMethod) {
        statics[name] = func;
      }
    }
    
    for (var k in statics) {
      construct[k] = statics[k];
    }
    
    for (var k in getset) {
      var def = {
        configurable : true,
        get : getters[k],
        set : setters[k]
      }
      
      Object.defineProperty(construct.prototype, k, def);
    }
    
    handle_statics(construct, parent);
    
    if (parent != undefined)
      construct.__parent__ = parent;

    for (var i=0; i<methods.length; i++) {
      var f = methods[i];
      
      if (f instanceof ClassGetter || f instanceof ClassSetter)
        continue;
      
      var name = f.name;

      if (f instanceof SymbolMethod) {
        name = f.symbol;
        f = f.func;
      }

      ownmethods[name] = f;
      construct.prototype[name] = f;
    }

    defined_classes.push(construct);
    
    return construct;
  };

  Class.register = function(cls) {
      cls.prototype.__prototypeid__ = Class.__prototype_idgen++;

      //if (cls.prototype.prototype !== undefined) {
      //  cls.__parent__ = cls.prototype.prototype.constructor;
      //}
      cls.__parent__ = cls.prototype.__proto__.constructor;

      cls.prototype.prototype = cls.prototype.__proto__

      defined_classes.push(cls);
  }

  Class.get = function(func) {
    return new ClassGetter(func);
  }
  
  Class.set = function(func) {
    return new ClassSetter(func);
  }
  
  Class.__prototype_idgen = 1;

  Class.static = Class.static_method = function(func) {
    func._is_static_method = true;
    return new StaticMethod(func);
  };

  Class.symbol = function(symbol, func) {
    return new SymbolMethod(symbol, func);
  };
  
  return Class;
})();

function mixin(child, parent) {
  let ok = 1;

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

    ok = parent !== parent.prototype.__proto__.constructor;
    parent = parent.prototype.__proto__.constructor;
    ok = ok && parent !== undefined && parent !== Object;
  }
}

function define_static(obj, name, val) {
  obj[name] = val;

  if (obj.__statics__) {
    obj.__statics__[name] = name;
  }

  if (val != undefined && (typeof val == "object" || typeof val == "function" || typeof val == "string")) {
    val._is_static_method = true;
  }
}

function __instance_of(child, parent) {
  if (child instanceof parent)
    return true;

  if (parent == undefined)
    return child == undefined;
  if (typeof child != "object" && typeof child != "function")
    return typeof child == typeof(parent); //return btypeof(child) == btypeof(parent);
  
  if ("__subclass_map__" in parent && "__prototypeid__" in child) {
    return child.__prototypeid__ in parent.__subclass_map__;
  } else {
    //console.log("falling back on normal instanceof");
    //console.log(parent.__subclass_map__, parent)
    return child instanceof parent;
  }
}

var instance_of = __instance_of;

//a basic array iterator utility function
var arr_iter = function arr_iter(keys)
{
  this.ret = {done : false, value : undefined};
  this.keys = keys;
  this.cur = 0;
  
  this[Symbol.iterator] = function() {
    return this;
  }
  
  this.next = function() {
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
  String.prototype.trimRight = function() {
    var i = this.length-1;
    
    while (i >= 0 && this[i] in __sp_ws) {
      i--;
    }
    
    return this.slice(0, i+1);
  }
}

if (String.prototype.trimLeft == undefined) {
  String.prototype.trimLeft = function() {
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
function __get_in_iter(obj) {
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
function __get_iter(obj) //, file, line, keyword)
{
  if (obj == undefined) {
    console.trace();
    print_stack();
    throw new Error("Invalid iteration over undefined value")
  }
  
  if (obj[Symbol.iterator] != undefined) {
    /*
    if (keyword == "in") {
      var hash = file + ":"+line +":" + keyword
      
      if (!(hash in _forin_data)) {
        _forin_data[hash] = [file, line]
      }
    }
    //*/
    
    return obj[Symbol.iterator]();
  }
}

class _KeyValIterator {
  ret : Object
  i : number;

  constructor(obj) {
    this.ret = {done : false, value : [undefined, undefined]};
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
    
    this.ret.value[0] = k;
    this.ret.value[1] = v;
    this.i++;

    return this.ret;
  }
}

var Iterator = function(obj) {
  if (Symbol.iterator in obj) {
    return obj[Symbol.iterator]();
  } else {
    return new _KeyValIterator(obj);
  }
}

function define_docstring(func, docstr) {
  func.__doc__ = docstr;
  
  return func;
}

//XXX do I ever use this?
function __bind_super_prop(obj, cls, parent, prop) {
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
