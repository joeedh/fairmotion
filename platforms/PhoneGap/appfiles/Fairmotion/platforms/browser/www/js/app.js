"use strict";
"not_a_module";
"not_covered_prof";
window.coverage = (function coverage_module() {
  var exports={}
  exports.lines = {}
  var Line=exports.Line = function Line(file, line) {
    this.file = file;
    this.line = line;
    this.count = 0;
  }
  exports.getLine = function(file, line) {
    var hash=""+file+line;
    if (!(hash in exports.lines)) {
        exports.lines[hash] = new Line(file, line);
    }
    return exports.lines[hash];
  }
  window.$cov_prof = function(file, line) {
    exports.getLine(file, line).count++;
  }
  window.$cov_reg = function(file, line) {
    exports.getLine(file, line);
  }
  exports.report = function() {
    var lines=[];
    var files={}
    var ftots={}
    for (var k in exports.lines) {
        var l=exports.lines[k];
        if (!(l.file in files)) {
            files[l.file] = [];
            ftots[l.file] = 0;
        }
        lines.push(l);
        files[l.file].push(l);
    }
    for (var i=0; i<lines.length; i++) {
        var l=lines[i];
        var tot=files[l.file].length;
        if (l.count>0) {
            ftots[l.file]+=1.0/tot;
        }
    }
    var flat=[];
    for (var k in ftots) {
        flat.push([k, ftots[k]]);
    }
    flat.sort(function(a, b) {
      return a[1]-b[1];
    });
    var out="";
    for (var i=0; i<flat.length; i++) {
        out+=""+flat[i]+"\n";
    }
    return out;
  }
  return exports;
})();

"not_a_module";
function startup_report(message) {
  console.log("%c "+message+"", "color:green");
}
function startup_warning(message) {
  console.trace("%c "+message+"\n\n", "color:red");
}
function warn(message) {
  var args=["%c "+message+"\n", "color:orange"];
  for (var i=1; i<arguments.length; i++) {
      args.push(arguments[i]);
  }
  console.log.apply(console, args);
}
function warntrace(message) {
  var args=["%c "+message+"\n", "color:orange"];
  for (var i=1; i<arguments.length; i++) {
      args.push(arguments[i]);
  }
  console.trace.apply(console, args);
}
if (Symbol.keystr===undefined) {
    Symbol.keystr = Symbol("keystr");
}
if (Array.prototype.remove===undefined) {
    Array.prototype.remove = function(item, hide_error) {
      var i=this.indexOf(item);
      if (i<0) {
          if (hide_error)
            console.trace("Error: item", item, "not in array", this);
          else 
            throw new Error("Item "+item+" not in array");
          return ;
      }
      var len=this.length;
      while (i<len) {
        this[i] = this[i+1];
        i++;
      }
      this.length--;
    };
}
if (String.startsWith==undefined) {
    String.prototype.startsWith = function(str) {
      if (str.length>this.length)
        return false;
      for (var i=0; i<str.length; i++) {
          if (this[i]!=str[i])
            return false;
      }
      return true;
    };
}
if (String.endsWith==undefined) {
    String.prototype.endsWith = function(str) {
      if (str.length>this.length)
        return false;
      for (var i=0; i<str.length; i++) {
          if (this[this.length-str.length+i]!=str[i])
            return false;
      }
      return true;
    };
}
if (String.contains==undefined) {
    String.prototype.contains = function(str) {
      if (str.length>this.length)
        return false;
      for (var i=0; i<this.length-str.length+1; i++) {
          var found=true;
          for (var j=0; j<str.length; j++) {
              if (this[i+j]!=str[j]) {
                  found = false;
                  break;
              }
          }
          if (found)
            return true;
      }
      return false;
    };
}
window._my_object_keys = function(obj) {
  var arr=[];
  for (var k in obj) {
      arr.push(k);
  }
  return arr;
};
function is_str(str) {
  return typeof str=="string"||typeof str=="String";
}
function get_type_name(obj) {
  if (obj==undefined)
    return "undefined";
  if (obj.constructor!=undefined&&obj.constructor.name!=undefined&&obj.constructor.name!="")
    return obj.constructor.name;
  var c;
  try {
    var c=obj.toSource();
  }
  catch (Error) {
      c = "";
  }
  if (obj.toString().startsWith("[object ")) {
      var c2=obj.toString().replace("[object ", "").replace("]", "");
      if (c2!="Object"&&c2!="Array") {
          return c2;
      }
  }
  if (c.contains(">")&&c.contains("<")&&!c.contains(" ")&&!c.contains(",")&&!c.contains(".")) {
      c = c.replace(">", "").replace("<", "");
      if (c!="Object"&&c!="Array") {
          return c;
      }
  }
  if (obj.constructor==MouseEvent)
    return "MouseEvent";
  if (obj.constructor==KeyEvent)
    return "KeyEvent";
  if (obj.constructor==KeyboardEvent)
    return "KeyboardEvent";
  return "(unknown)";
}
function obj_get_keys(obj) {
  var ret=[];
  for (var k in obj) {
      if (obj.hasOwnProperty(k))
        ret.push(k);
  }
  return ret;
}
window._do_frame_debug = false;
window._do_iter_err_stacktrace = true;
window.FrameContinue = {"FC": 1};
window.FrameBreak = {"FB": 1};
function getattr(obj, attr) {
  return obj[attr];
}
function setattr(obj, attr, val) {
  obj[attr] = val;
}
function delattr(obj, attr) {
  delete obj[attr];
}
function _KeyValIterator(obj) {
  if (obj[Symbol.iterator]!=undefined) {
      return obj[Symbol.iterator]();
  }
  else {
    var keys=[];
    for (var k in obj) {
        keys.push([k, obj[k]]);
    }
    return new arr_iter(keys);
  }
}
Iterator = _KeyValIterator;

"not_a_module";
var _defined_modules={};
var allow_cycles=false;
var _is_cyclic=false;
var _post_primary_load=false;
var _es6_module_resort=false;
var _es6_module_verbose=false;
var _debug_modules=0;
function debug() {
  if (!_debug_modules)
    return ;
  var s="console.log";
  console.log.apply(console, arguments);
}
function ES6Module(name) {
  this.name = name;
  this.depends = [];
  this.flag = 0;
  this.loaded = false;
  this.callback = undefined;
  this.exports = {}
  this.global_exports = {}
  this.already_processed = {}
  this.classes = [];
}
ES6Module.prototype = {add_class: function(cls) {
  this.classes.push(cls);
}, add_export: function(name, object, allow_override) {
  if (allow_override==undefined) {
      allow_override = false;
  }
  if (object!=undefined)
    this.already_processed[name] = object;
  if (!allow_override&&name in this.exports&&this.exports[name]!=undefined) {
      return this.exports[name];
  }
  this.exports[name] = object;
  return object;
}, add_global: function(name, object) {
  if (object!=undefined)
    this.already_processed[name] = object;
  if (name in this.exports) {
      return ;
  }
  this.global_exports[name] = object;
  return object;
}, add_depend: function(module) {
  if (typeof module!="string"&&!(__instance_of(module, String))) {
      throw new Error("ES6Module.add_depend: Expected a string");
  }
  this.depends.push(es6_get_module_meta(module));
}, set_default_export: function(name, object) {
  if (this.default_export!=undefined) {
      throw new Error("Can only have one default export");
  }
  this.exports["default"] = object;
  this.default_export = object;
  if (name!=undefined&&name!='') {
      return this.add_export(name, object);
  }
  return object;
}};
function es6_get_module_meta(name) {
  if (!(name in _defined_modules)) {
      var mod=new ES6Module(name);
      _defined_modules[name] = mod;
  }
  return _defined_modules[name];
}
function es6_module_define(name, depends, callback) {
  debug("defining module ", name, "with dependencies", JSON.stringify(depends));
  if (name in _defined_modules) {
      throw new Error("Duplicate module name '"+name+"'");
  }
  var mod=es6_get_module_meta(name);
  mod.callback = callback;
  depends.forEach(function(d) {
    mod.depends.push(d);
  });
  return mod;
}
function sort_modules() {
  var sortlist=[];
  for (var k in _defined_modules) {
      var mod=_defined_modules[k];
      mod.flag = 0;
  }
  var localvisit={}
  function sort(mod, path) {
    var p2=[];
    for (var i=0; i<path.length; i++) {
        p2.push(path[i]);
    }
    path = p2;
    path.push(mod.name);
    if (path.length>1) {
    }
    if (mod.name in localvisit) {
        _is_cyclic = true;
        debug("Cycle!", path);
        if (!allow_cycles) {
            throw new Error("module cycle! "+JSON.stringify(path));
        }
        return ;
    }
    localvisit[mod.name] = 1;
    for (var i=0; i<mod.depends.length; i++) {
        var p=mod.depends[i];
        if (!p.flag) {
            sort(p, path);
        }
    }
    mod.flag++;
    sortlist.push(mod);
  }
  for (var k in _defined_modules) {
      var mod=_defined_modules[k];
      localvisit = {};
      if (!mod.flag)
        sort(mod, []);
  }
  var namelist=[];
  for (var i=0; i<sortlist.length; i++) {
      namelist.push(sortlist[i].name);
  }
  window.module_order = namelist;
  return sortlist;
}
function _load_module(mod) {
  var args=[mod];
  var start=time_ms();
  if (mod.loaded)
    return ;
  debug("loading module", mod.name);
  var dependnames=[];
  for (var i=0; i<mod.depends.length; i++) {
      args.push(mod.depends[i].exports);
      dependnames.push(mod.depends[i].name);
  }
  if (dependnames.length!=0) {
  }
  if (mod.callback==undefined) {
      console.log("WARNING: module", mod.name, "does not exist!");
      return ;
  }
  mod.callback.apply(this, args);
  for (var k in mod.global_exports) {
      this[k] = mod.global_exports[k];
  }
  mod.loaded = true;
  var end=time_ms();
  if (end-start>4) {
  }
}
function ModuleLoadError() {
  Error.apply(this, arguments);
}
ModuleLoadError.prototype = Object.create(Error.prototype);
function _es6_get_module(name) {
  var mod=es6_get_module_meta(name);
  if (_post_primary_load) {
      if (mod.callback!=undefined&&!mod.loaded) {
          _load_module(mod);
      }
      else 
        if (mod.callback==undefined) {
          if (_debug_modules)
            console.log("Module Load Error", mod, Object.keys(mod), mod.__proto__);
          throw new ModuleLoadError("Unknown module "+name);
      }
  }
  return mod;
}
function es6_import(_es6_module, name) {
  var mod=_es6_get_module(name);
  if (mod!=undefined&&_es6_module.depends.indexOf(mod)<0) {
      debug("updating dependencies");
      _es6_module_resort = true;
      _es6_module.depends.push(mod);
  }
  if (mod==undefined||!mod.loaded) {
      if (_debug_modules)
        console.log("cannot import module", name, mod);
      throw new ModuleLoadError();
  }
  return mod.exports;
}
function es6_import_item(_es6_module, modname, name) {
  var mod=_es6_get_module(modname);
  if (mod!=undefined&&_es6_module.depends.indexOf(mod)<0) {
      debug("updating dependencies");
      _es6_module_resort = true;
      _es6_module.depends.push(mod);
  }
  if (!(name in mod.exports)) {
      if (1||_debug_modules)
        console.log("name not in exports", name, mod);
      throw new ModuleLoadError("");
  }
  return mod.exports[name];
}
function load_cyclic_modules(sortlist) {
  var trylimit=35;
  var last_totfail=undefined;
  debug("start load", sortlist.length);
  _es6_module_verbose = false;
  for (var si=0; si<trylimit; si++) {
      var totfail=0;
      if (si>0) {
          _es6_module_verbose = true;
          console.log("\n\n\n---------CYCLE STAGE", si+1, "!------------\n");
          if (!allow_cycles&&si>0) {
              throw new Error("module cycle!");
          }
          if (_es6_module_resort) {
              sortlist = sort_modules();
              _es6_module_resort = false;
          }
      }
      for (var i=0; i<sortlist.length; i++) {
          var mod=sortlist[i];
          if (mod.loaded)
            continue;
          try {
            _load_module(mod);
          }
          catch (err) {
              if (!(__instance_of(err, ModuleLoadError))) {
                  print_stack(err);
                  throw err;
              }
              totfail++;
          }
          last_totfail = totfail;
      }
      if (totfail==0)
        break;
  }
  if (si==trylimit) {
      throw new Error("Failed to load all modules");
  }
  return si;
}
function reload_modules() {
  for (var k in _defined_modules) {
      var mod=_defined_modules[k];
      mod.loaded = false;
      mod.exports = {};
      mod.global_exports = {};
      mod.default_export = undefined;
  }
  load_modules();
}
function load_modules() {
  startup_report("Loading modules. . .");
  var start_time=time_ms();
  for (var k in _defined_modules) {
      var mod=_defined_modules[k];
      for (var i=0; i<mod.depends.length; i++) {
          var d=mod.depends[i];
          if (typeof d=="string"||__instance_of(d, String)) {
              mod.depends[i] = es6_get_module_meta(d);
          }
      }
  }
  var sortlist=sort_modules();
  var totcycle=load_cyclic_modules(sortlist);
  _post_primary_load = true;
  startup_report("...Finished.  "+(time_ms()-start_time).toFixed(1)+"ms", totcycle, "cycle iterations");
  for (var k in _defined_modules) {
      window["_"+k] = _defined_modules[k].exports;
  }
}
function test_modules() {
  es6_module_define("util", [], function(_es6_module) {
    debug("in util");
    var mod=_es6_module;
    mod.add_export("list", Array);
  });
  es6_module_define("math", ["util"], function(_es6_module, util) {
    debug("in math");
    var mod=_es6_module;
    mod.add_export("FancyInt", Number);
    mod.add_global("MathGlobal", Boolean);
    debug("util", util);
  });
  load_modules();
  debug(MathGlobal);
}
function es6_import_all_fancy(_es6_module, name) {
  var ret="import {";
  var mod=_defined_modules[name];
  var i=0;
  for (var k in mod.exports) {
      if (i>0)
        ret+=", ";
      ret+=k;
      i++;
  }
  ret+="} from '"+name+"';\n";
  return ret;
}
function es6_import_all(_es6_module, name) {
  var ret="var ";
  var mod=_defined_modules[name];
  var i=0;
  for (var k in mod.exports) {
      empty = false;
      if (i>0)
        ret+=", ";
      ret+=k+" = es6_import_item(_es6_module, '"+name+"', '"+k+"')";
      i++;
  }
  if (i==0)
    ret = "";
  ret+=";\n";
  ret+="es6_import(_es6_module, '"+name+"');\n";
  return ret;
}

"not_a_module";
"use strict";
var defined_classes=[];
var defined_tests=new Array();
function register_test(obj) {
  defined_tests.push(obj);
}
var _ESClass=(function() {
  function ClassGetter(func) {
    this.func = func;
  }
  function ClassSetter(func) {
    this.func = func;
  }
  var StaticMethod=function StaticMethod(func) {
    this.func = func;
  }
  var SymbolMethod=function SymbolMethod(symbol, func) {
    this.symbol = symbol;
    this.func = func;
  }
  var handle_statics=function(cls, parent) {
    for (var k in cls.prototype) {
        if (__instance_of(cls.prototype[k], StaticMethod)) {
            var func=cls.prototype[k];
            delete cls.prototype[k];
            cls[k] = func.func;
        }
    }
    if (parent!=undefined) {
        for (var k in parent) {
            var v=parent[k];
            if (v==undefined||((typeof v=="object"||typeof v=="function")&&"_is_static_method" in v)&&!(k in cls)) {
                cls[k] = v;
            }
        }
    }
  }
  var Class=function Class() {
    if (arguments.length==3) {
        var classname=arguments[0], parent=arguments[1], methods=arguments[2];
    }
    else 
      if (arguments.length==2) {
        if (typeof arguments[0]=="string") {
            var classname=arguments[0], parent=undefined, methods=arguments[1];
        }
        else {
          var classname="constructor", parent=arguments[0], methods=arguments[1];
        }
    }
    else {
      var classname="constructor", parent=undefined, methods=arguments[0];
    }
    var construct=undefined;
    var ownmethods={}
    for (var i=0; i<methods.length; i++) {
        var f=methods[i];
        if (f.name==classname) {
            construct = f;
            methods.remove(f);
            break;
        }
    }
    if (construct===undefined) {
        console.trace("Error, constructor was not defined", methods);
        throw new Error("Error, constructor was not defined");
        if (parent!=undefined) {
            construct = function() {
              parent.apply(this, arguments);
            };
        }
        else {
          construct = function() {
          };
        }
    }
    if (parent!=undefined) {
        construct.prototype = Object.create(parent.prototype);
    }
    construct.prototype.constructor = construct;
    construct.prototype.__prototypeid__ = Class.__prototype_idgen++;
    construct.__prototypeid__ = construct.prototype.__prototypeid__;
    construct[Symbol.keystr] = function() {
      return this.prototype.__prototypeid__;
    }
    construct.__parent__ = parent;
    construct.__statics__ = {}
    construct.__subclass_map__ = {}
    construct.__subclass_map__[construct.__prototypeid__] = 1;
    construct.prototype.__class__ = construct.name;
    var p=parent;
    while (p!=undefined) {
      if (p.__subclass_map__==undefined) {
          p.__subclass_map__ = {};
          p.__prototypeid__ = Class.__prototype_idgen++;
      }
      p.__subclass_map__[construct.__prototypeid__] = 1;
      p = p.__parent__;
    }
    var getters={}
    var setters={}
    var getset={}
    var statics={}
    for (var i=0; i<methods.length; i++) {
        var f=methods[i];
        var name, func;
        if (!(__instance_of(f, ClassGetter))&&!(__instance_of(f, ClassSetter))&&!(__instance_of(f, StaticMethod))) {
            continue;
        }
        if (__instance_of(f.func, SymbolMethod)) {
            name = f.func.symbol;
            func = f.func.func;
            if (name==undefined) {
                throw new Error("Symbol was undefined");
            }
        }
        else {
          name = f.func.name;
          func = f.func;
        }
        if (__instance_of(f, ClassSetter)) {
            setters[name] = func;
            getset[name] = 1;
        }
        else 
          if (__instance_of(f, ClassGetter)) {
            getters[name] = func;
            getset[name] = 1;
        }
        else 
          if (__instance_of(f, StaticMethod)) {
            statics[name] = func;
        }
    }
    for (var k in statics) {
        construct[k] = statics[k];
    }
    for (var k in getset) {
        var def={configurable: true, get: getters[k], set: setters[k]};
        Object.defineProperty(construct.prototype, k, def);
    }
    handle_statics(construct, parent);
    if (parent!=undefined)
      construct.__parent__ = parent;
    for (var i=0; i<methods.length; i++) {
        var f=methods[i];
        if (__instance_of(f, ClassGetter)||__instance_of(f, ClassSetter))
          continue;
        var name=f.name;
        if (__instance_of(f, SymbolMethod)) {
            name = f.symbol;
            f = f.func;
        }
        ownmethods[name] = f;
        construct.prototype[name] = f;
    }
    defined_classes.push(construct);
    return construct;
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
  }
  Class.symbol = function(symbol, func) {
    return new SymbolMethod(symbol, func);
  }
  return Class;
})();
function mixin(child, parent) {
  for (var k in parent.prototype) {
      if (child.prototype[k]==undefined) {
          child.prototype[k] = parent.prototype[k];
      }
  }
  var symbols=Object.getOwnPropertySymbols(parent);
  for (var i=0; i<symbols.length; i++) {
      var k=symbols[i];
      if (!(k in child.prototype)) {
          child.prototype[k] = parent.prototype[k];
      }
  }
}
function define_static(obj, name, val) {
  obj[name] = val;
  obj.__statics__[name] = name;
  if (val!=undefined&&(typeof val=="object"||typeof val=="function"||typeof val=="string")) {
      val._is_static_method = true;
  }
}
function __instance_of(child, parent) {
  if (parent==undefined)
    return child==undefined;
  if (typeof child!="object"&&typeof child!="function")
    return typeof child==typeof (parent);
  if ("__subclass_map__" in parent&&"__prototypeid__" in child) {
      return child.__prototypeid__ in parent.__subclass_map__;
  }
  else {
    return child instanceof parent;
  }
}
var instance_of=__instance_of;
var arr_iter=function arr_iter(keys) {
  this.ret = {done: false, value: undefined}
  this.keys = keys;
  this.cur = 0;
  this[Symbol.iterator] = function() {
    return this;
  }
  this.next = function() {
    if (this.cur>=this.keys.length) {
        this.ret.done = true;
        this.ret.value = undefined;
        return this.ret;
    }
    this.ret.value = this.keys[this.cur++];
    return this.ret;
  }
};
var _forin_data={};
function save_forin_conv() {
  var s="";
  var lst=Object.keys(_forin_data);
  lst.sort();
  var buf=lst.join("\n");
  var blob=new Blob([buf], {type: "text/plain"});
  var obj_url=window.URL.createObjectURL(blob);
  window.open(obj_url);
}
var __sp_ws={"\n": 0, "\r": 0, "\t": 0, "\v": 0, " ": 0, "\0": 0};
if (String.prototype.trimRight==undefined) {
    String.prototype.trimRight = function() {
      var i=this.length-1;
      while (i>=0&&this[i] in __sp_ws) {
        i--;
      }
      return this.slice(0, i+1);
    };
}
if (String.prototype.trimLeft==undefined) {
    String.prototype.trimLeft = function() {
      var i=0;
      while (i<this.length&&this[i] in __sp_ws) {
        i++;
      }
      return this.slice(i, this.length);
    };
}
function __get_in_iter(obj) {
  if (obj==undefined) {
      console.trace();
      print_stack();
      throw new Error("Invalid iteration over undefined value");
  }
  var keys=_my_object_keys(obj);
  return new arr_iter(keys);
}
function __get_iter(obj) {
  if (obj==undefined) {
      console.trace();
      print_stack();
      throw new Error("Invalid iteration over undefined value");
  }
  if (obj[Symbol.iterator]!=undefined) {
      return obj[Symbol.iterator]();
  }
}
var _KeyValIterator=_ESClass("_KeyValIterator", [function _KeyValIterator(obj) {
  this.ret = {done: false, value: [undefined, undefined]}
  this.i = 0;
  this.obj = obj;
  this.keys = Object.keys(obj);
}, _ESClass.symbol(Symbol.iterator, function iterator() {
  return this;
}), function next() {
  if (this.i>=this.keys.length) {
      this.ret.done = true;
      this.ret.value = undefined;
      return this.ret;
  }
  var k=this.keys[this.i];
  var v=this.obj[k];
  this.ret.value[0] = k;
  this.ret.value[1] = v;
  this.i++;
  return this.ret;
}]);
var Iterator=function(obj) {
  if (Symbol.iterator in obj) {
      return obj[Symbol.iterator]();
  }
  else {
    return new _KeyValIterator(obj);
  }
};
function define_docstring(func, docstr) {
  func.__doc__ = docstr;
  return func;
}
function __bind_super_prop(obj, cls, parent, prop) {
  var descr=Object.getOwnPropertyDescriptor(parent.prototype, prop);
  if (descr==undefined)
    return parent.prototype[prop];
  if (descr.get!=undefined) {
      return descr.get.call(obj);
  }
  else 
    if (descr.value!=undefined) {
      return descr.value;
  }
  else {
    var p=parent.prototype[prop];
    if (typeof p=="function") {
        console.trace("Warning: inefficient branch detected in __bind_super_prop");
        return p.bind(obj);
    }
    else {
      return p;
    }
  }
}

es6_module_define('config', ["config_local"], function _config_module(_es6_module) {
  "use strict";
  var CHROME_APP_MODE=document.getElementById("GoogleChromeAppMode")!==null;
  CHROME_APP_MODE = _es6_module.add_export('CHROME_APP_MODE', CHROME_APP_MODE);
  var PHONE_APP_MODE=document.getElementById("PhoneAppMode")!==null;
  PHONE_APP_MODE = _es6_module.add_export('PHONE_APP_MODE', PHONE_APP_MODE);
  var ICONPATH=PHONE_APP_MODE ? "img/" : "fcontent/";
  ICONPATH = _es6_module.add_export('ICONPATH', ICONPATH);
  var USE_NACL=!PHONE_APP_MODE;
  USE_NACL = _es6_module.add_export('USE_NACL', USE_NACL);
  var NO_SERVER=CHROME_APP_MODE||PHONE_APP_MODE;
  NO_SERVER = _es6_module.add_export('NO_SERVER', NO_SERVER);
  var USE_HTML5_FILEAPI=NO_SERVER;
  USE_HTML5_FILEAPI = _es6_module.add_export('USE_HTML5_FILEAPI', USE_HTML5_FILEAPI);
  var DISABLE_SOLVE=false;
  DISABLE_SOLVE = _es6_module.add_export('DISABLE_SOLVE', DISABLE_SOLVE);
  var ENABLE_MULTIRES=false;
  ENABLE_MULTIRES = _es6_module.add_export('ENABLE_MULTIRES', ENABLE_MULTIRES);
  var HAVE_EVAL=false;
  HAVE_EVAL = _es6_module.add_export('HAVE_EVAL', HAVE_EVAL);
  var MAX_CANVAS2D_VECTOR_CACHE_SIZE=700;
  MAX_CANVAS2D_VECTOR_CACHE_SIZE = _es6_module.add_export('MAX_CANVAS2D_VECTOR_CACHE_SIZE', MAX_CANVAS2D_VECTOR_CACHE_SIZE);
  var MAX_RECENT_FILES=12;
  MAX_RECENT_FILES = _es6_module.add_export('MAX_RECENT_FILES', MAX_RECENT_FILES);
  window.RELEASE = false;
  var config_local=es6_import(_es6_module, 'config_local');
  var _config_local=es6_import(_es6_module, 'config_local');
  for (var k in _config_local) {
      _es6_module.add_export(k, _config_local[k], true);
  }
  window._DEBUG = {degenerate_geometry: false, viewport_partial_update: false, alias_g_app_state: true, gl_objects: false, Struct: false, ui_except_handling: false, modal: false, datalib: false, glext: false, selbuf: false, toolstack: false, transform: false, mesh_api: false, keyboard: false, modifier_keys: false, mouse: false, touch: 1, mousemove: false, ui_datapaths: false, ui_menus: false, ui_canvas: false, ui_redraw: false, dag: false, icons: false, complex_ui_recalc: false, screen_keyboard: false, data_api_timing: false, canvas_sep_text: true, disable_on_tick: false, octree: false, netio: false, compression: false, force_mobile: false, tesselator: false, use_2d_uicanvas: 1, trace_recalc_all: false}
  if (window.DEBUG==undefined||DEBUG==undefined)
    var DEBUG=window.DEBUG = config_local.DEBUG!=undefined ? config_local.DEBUG : {}
  for (var k in _DEBUG) {
      if (!(k in DEBUG)) {
          DEBUG[k] = _DEBUG[k];
      }
  }
  if (DEBUG!=undefined&&DEBUG.force_mobile)
    window.IsMobile = true;
});

es6_module_define('config_local', [], function _config_local_module(_es6_module) {
  'use strict';
  var DEBUG={ui_redraw: true, viewport_partial_update: false, ui_datapaths: false, screen_keyboard: false, force_mobile: false}
  DEBUG = _es6_module.add_export('DEBUG', DEBUG);
});

es6_module_define('const', ["config"], function _const_module(_es6_module) {
  "use strict";
  es6_import(_es6_module, 'config');
  window.fairmotion_file_ext = ".fmo";
  window.fairmotion_settings_filename = ".settings.bin";
  window.g_app_version = 0.051;
  window.UNIT_TESTER = false;
  window.FEATURES = {save_toolstack: false}
  window.use_octree_select = true;
  window.fuzzy_ui_press_hotspot = 25;
  window.new_api_parser = true;
  if (myLocalStorage.use_canvas2d==undefined)
    myLocalStorage.use_canvas2d = true;
  var $_mh=undefined;
  if (!RELEASE&&!("M" in window)&&!("O" in window)) {
      Object.defineProperty(window, "G", {get: function() {
        return g_app_state;
      }});
      Object.defineProperty(window, "V2D", {get: function() {
        return g_app_state.active_view2d;
      }});
      Object.defineProperty(window, "API", {get: function() {
        return g_app_state.api;
      }});
  }
});


    var totfile=6, fname="app";
    for (var i=0; i<totfile; i++) {
      var path = "/js/"+fname+i+".js";
      var node = document.createElement("script")
      node.src = path
      node.async = false
      
      document.head.appendChild(node);
    }
  