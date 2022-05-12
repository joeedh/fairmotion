"not_a_module";
"use strict";
"not_covered_prof";
window.coverage = (function coverage_module() {
  var exports={}
  exports.lines = {}
  var Line=exports.Line = function Line(file, line) {
    this.file = file;
    this.line = line;
    this.count = 0;
  }
  exports.getLine = function (file, line) {
    var hash=""+file+line;
    if (!(hash in exports.lines)) {
        exports.lines[hash] = new Line(file, line);
    }
    return exports.lines[hash];
  }
  window.$cov_prof = function (file, line) {
    exports.getLine(file, line).count++;
  }
  window.$cov_reg = function (file, line) {
    exports.getLine(file, line);
  }
  exports.report = function () {
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
    flat.sort(function (a, b) {
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
"no_type_logging";
let handler={getProperty: function getProperty(target, key, r) {
    if (key==="count") {
        throw new Error("what?");
    }
    return target[key];
  }, 
  setProperty: function setProperty(target, key, val, r) {
    if (key==="count") {
        throw new Error("what?");
    }
    target[key] = val;
  }};
var _defined_modules={};
let _curpath_stack=[];
var allow_cycles=true;
var _rootpath_src="";
var _is_cyclic=false;
var _post_primary_load=false;
var _es6_module_resort=false;
var _es6_module_verbose=1;
var _debug_modules=0;
function debug() {
  if (!_debug_modules)
    return ;
  var s="console.log";
  console.warn.apply(console, arguments);
}
function ES6Module(name, path) {
  this.name = name;
  this.path = path;
  this.links = [];
  this.depends = [];
  this.imports = {}
  this.flag = 0;
  this.loaded = false;
  this.callback = undefined;
  this.exports = {}
  this.global_exports = {}
  this.already_processed = {}
  this.classes = [];
}
ES6Module.prototype = {add_class: function (cls) {
    this.classes.push(cls);
  }, 
  add_export: function (name, object, allow_override) {
    if (allow_override===undefined) {
        allow_override = false;
    }
    if (object!==undefined)
      this.already_processed[name] = object;
    if (!allow_override&&name in this.exports&&this.exports[name]!==undefined) {
        return this.exports[name];
    }
    this.exports[name] = object;
    return object;
  }, 
  add_global: function (name, object) {
    if (object!==undefined)
      this.already_processed[name] = object;
    if (name in this.exports) {
        return ;
    }
    this.global_exports[name] = object;
    return object;
  }, 
  add_depend: function (module) {
    if (typeof module!="string"&&!(__instance_of(module, String))) {
        throw new Error("ES6Module.add_depend: Expected a string");
    }
    _es6_push_basepath(this.path);
    this.depends.push(es6_get_module_meta(module));
    _es6_pop_basepath();
  }, 
  set_default_export: function (name, object) {
    if (this.default_export!==undefined) {
        throw new Error("Can only have one default export");
    }
    this.exports["default"] = object;
    this.default_export = object;
    if (name!==undefined&&name!=='') {
        return this.add_export(name, object);
    }
    return object;
  }};
function _es6_get_basename(path) {
  if (!(path.endsWith(".js"))) {
      path+=".js";
  }
  let name=path.split("/");
  name = name[name.length-1];
  name = name.slice(0, name.length-3);
  return name;
}
function es6_get_module_meta(path, compatibility_mode, autoAdd) {
  if (compatibility_mode===undefined) {
      compatibility_mode = false;
  }
  if (autoAdd===undefined) {
      autoAdd = true;
  }
  path = path.replace(/\\/g, "/");
  if (!compatibility_mode&&!path.startsWith("\.")&&path.search("/")<0) {
      throw new Error("Bad import string: "+path);
  }
  if (compatibility_mode) {
      let name=path;
      if (!path.toLowerCase().endsWith(".js")) {
          path+=".js";
      }
      path = _normpath("./"+path, _es6_get_basepath());
      if (!(path in _defined_modules)) {
          for (let k in _defined_modules) {
              let mod=_defined_modules[k];
              if (mod.name==name) {
                  return mod;
              }
          }
          console.warn("Unknown module", name, "hackishly patching. . .");
          throw new Error("");
          let mod=new ES6Module(name, name);
          mod._bad_path = true;
          _defined_modules[name] = mod;
          return mod;
      }
      else {
        return _defined_modules[path];
      }
  }
  if (!path.endsWith(".js")) {
      path+=".js";
  }
  path = _normpath(path, _es6_get_basepath());
  path = _normpath1(path);
  if (autoAdd&&!(path in _defined_modules)) {
      let name=_es6_get_basename(path);
      let mod=new ES6Module(name, path);
      _defined_modules[path] = mod;
  }
  return _defined_modules[path];
}
function _es6_get_basepath() {
  if (_curpath_stack.length>0)
    return _curpath_stack[_curpath_stack.length-1];
  return _rootpath_src;
}
function _es6_push_basepath(path) {
  _curpath_stack.push(path);
}
function _es6_pop_basepath(path) {
  return _curpath_stack.pop();
}
function es6_module_define(name, depends, callback, path) {
  path = path===undefined ? name : path;
  if (_debug_modules===2) {
      debug("defining module ", path, "with dependencies", JSON.stringify(depends));
  }
  else {
    debug("defining module ", path);
  }
  let mod;
  path = _normpath(path, _es6_get_basepath());
  if (!(path in _defined_modules)) {
      mod = new ES6Module(name, path);
      _defined_modules[path] = mod;
  }
  else {
    mod = _defined_modules[path];
  }
  mod.callback = callback;
  depends.forEach(function (d) {
    mod.depends.push(d);
  });
  return mod;
}
function sort_modules() {
  var sortlist=[];
  for (var k in _defined_modules) {
      var mod=_defined_modules[k];
      if (mod.callback===undefined) {
          console.warn('module "'+mod.path+'" does not exist', mod);
          throw new Error('module "'+mod.path+'" does not exist');
      }
      mod.flag = 0;
  }
  var localvisit={}
  function sort(mod, path) {
    var p2=[];
    for (var i=0; i<path.length; i++) {
        p2.push(path[i]);
    }
    path = p2;
    path.push(mod.path);
    if (path.length>1) {
        debug(path);
    }
    if (mod.path in localvisit) {
        _is_cyclic = true;
        console.log("Cycle!", mod.path, path);
        if (!allow_cycles) {
            throw new Error("module cycle! "+JSON.stringify(path));
        }
        return ;
    }
    localvisit[mod.path] = 1;
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
function _es_dynamic_import(_es6_module, path) {
  let mod=es6_get_module_meta(path, undefined, false);
  if (mod) {
      return new Promise((accept, reject) =>        {
        accept(mod.exports);
      });
  }
  else {
    console.log("PATH", path, "BASEPATH", _rootpath_src);
    path = _normpath(path, _es6_get_basepath());
    while (path.length>0&&path[0]==="/"||path[0]==="\\") {
      path = path.slice(1, path.length).trim();
    }
    console.log(path, _rootpath_src);
    path = path.slice(_rootpath_src.length, path.length);
    while (path.startsWith("/")||path.startsWith("\\")) {
      path = path.slice(1, path.length).trim();
    }
    path = "./"+path;
    console.log(path);
    return import(path);
  }
}
function _load_module_cyclic(mod, visitmap, modstack) {
  window.es6_import = function es6_import(_es6_module, name) {
    var mod=_es6_get_module(name);
    if (mod!==undefined) {
        mod.links.push(_es6_module);
    }
    if (mod!==undefined&&_es6_module.depends.indexOf(mod)<0) {
        debug("updating dependencies");
        _es6_module_resort = true;
        _es6_module.depends.push(mod);
    }
    if (mod===undefined) {
        if (_debug_modules)
          console.log("cannot import module", name, mod);
        throw new ModuleLoadError("Cannot import module "+name);
    }
    if (!mod.loaded) {
        _load_module_cyclic(mod, visitmap, modstack);
    }
    return mod.exports;
  }
  window.es6_import_item = function es6_import_item(_es6_module, modname, name) {
    var mod=_es6_get_module(modname);
    if (mod!==undefined) {
        mod.links.push(_es6_module);
    }
    if (mod!==undefined&&_es6_module.depends.indexOf(mod)<0) {
        debug("updating dependencies");
        _es6_module_resort = true;
        _es6_module.depends.push(mod);
    }
    if (!mod.loaded) {
        _load_module_cyclic(mod, visitmap, modstack);
    }
    if (!(name in mod.exports)) {
        if (1||_debug_modules)
          console.log(_es6_module.name+":", "name not in exports (module cycle?)", name, mod);
        let msg=_es6_module.name+":"+"name not in exports: "+name+" is not in "+mod.path;
        msg+="\n  wanted by: '"+_es6_module.path+"'";
        throw new ModuleLoadError(msg);
    }
    _es6_module.imports[name] = {module: mod, 
    value: mod.exports[name]}
    return mod.exports[name];
  }
  if (!visitmap.has(mod)) {
      visitmap.set(mod, 0);
  }
  else 
    if (visitmap.get(mod)>15) {
      throw new ModuleLoadError("Failed to resolve module cycle");
  }
  visitmap.set(mod, visitmap.get(mod)+1);
  if (mod.loaded) {
      return ;
  }
  let args=[mod];
  for (let dep of mod.depends) {
      args.push(dep.exports);
  }
  modstack.push(window.Module);
  modstack.push(window.exports);
  window.module = window.Module = mod;
  window.exports = mod.exports;
  mod.loaded = true;
  _es6_push_basepath(mod.path);
  if (mod.callback===undefined) {
      throw new Error("Unknown module "+mod.path, mod);
  }
  else {
    mod.callback.apply(this, args);
  }
  _es6_pop_basepath(mod.path);
  if (mod.exports!==window.exports) {
      mod.exports = window.exports;
  }
  window.exports = modstack.pop();
  window.module = window.Module = modstack.pop();
}
function _load_module(mod) {
  var args=[mod];
  var start=time_ms();
  if (mod.loaded)
    return ;
  debug("loading module", mod.name, mod);
  for (var i=0; i<mod.depends.length; i++) {
      args.push(mod.depends[i].exports);
  }
  if (_debug_modules) {
      var dependnames=[];
      for (let dep of mod.depends) {
          dependnames.push(dep.name);
      }
      if (dependnames.length!=0) {
          debug("  ", JSON.stringify(dependnames));
      }
  }
  if (mod.callback===undefined) {
      console.warn("WARNING: module", mod.name, "does not exist!");
      throw new Error("module \""+mod.path+"\" does not exist");
      return ;
  }
  let old=window.module;
  _es6_push_basepath(mod.path);
  mod.exports = {}
  window.module = {}
  window.exports = mod.exports;
  mod.callback.apply(this, args);
  if (!module) {
      console.warn("possible module error?");
  }
  else 
    if (module.exports) {
      let keys=Object.keys(module);
      keys = keys.concat(Object.getOwnPropertySymbols(module));
      for (let k in keys) {
          mod.exports[k] = module.exports[k];
      }
  }
  window.module = old;
  _es6_pop_basepath();
  for (var k in mod.global_exports) {
      this[k] = mod.global_exports[k];
  }
  mod.loaded = true;
  var end=time_ms();
  if (end-start>4) {
  }
}
window._ESClass = {register: () =>    {  }};
class ModuleLoadError extends Error {
}
_ESClass.register(ModuleLoadError);
function _normpath1(path) {
  path = path.replace(/\\/g, "/").trim();
  path = path.replace(/\/\//g, "/").trim();
  while (path.startsWith("/")) {
    path = path.slice(1, path.length);
  }
  while (path.endsWith("/")) {
    path = path.slice(0, path.length-1);
  }
  return path;
}
function _splitpath(path) {
  path = _normpath1(path);
  let ret=["", ""];
  if (path.startsWith("/")) {
      ret[0]+="/";
  }
  path = path.split("/");
  for (let item of path.slice(0, path.length-1)) {
      ret[0]+=item+"/";
  }
  if (path.length>1) {
      ret[0] = ret[0].slice(0, ret[0].length-1);
  }
  else 
    if (path.length>0) {
      ret[0] = "/";
  }
  if (path.length>0) {
      ret[1] = path[path.length-1];
  }
  if (ret[0].trim()===".") {
      ret[0] = ret[0].trim()+"/";
  }
  return ret;
}
function _normpath(path, basepath) {
  if (basepath.trim().length===0)
    return _normpath1(path);
  path = _normpath1(path);
  basepath = _normpath1(basepath);
  if (path.startsWith(basepath)) {
      path = _normpath1(path.slice(basepath.length, path.length));
  }
  if (path[0]=="."&&path[1]=="/") {
      path = path.slice(2, path.length);
  }
  let ps=path.split("/");
  let bs=basepath.split("/");
  let stack=bs.slice(0, bs.length-1);
  for (let i=0; i<ps.length; i++) {
      if (ps[i]=="..") {
          stack.pop();
      }
      else {
        stack.push(ps[i]);
      }
  }
  path = "";
  for (let c of stack) {
      if (c.trim().length==0||c.trim()=="/")
        continue;
      path = path+"/"+c;
  }
  return path;
}
function _es6_get_module(name, compatibility_mode) {
  if (compatibility_mode===undefined) {
      compatibility_mode = false;
  }
  var mod=es6_get_module_meta(name, compatibility_mode);
  if (_post_primary_load) {
      if (mod.callback!==undefined&&!mod.loaded) {
      }
      else 
        if (mod.callback===undefined) {
          if (_debug_modules)
            console.log("Module Load Error", mod, Object.keys(mod), mod.__proto__);
          throw new ModuleLoadError("Unknown module "+name);
      }
  }
  return mod;
}
function es6_import(_es6_module, name) {
  var mod=_es6_get_module(name);
  if (mod!==undefined) {
      mod.links.push(_es6_module);
  }
  if (mod!==undefined&&_es6_module.depends.indexOf(mod)<0) {
      debug("updating dependencies");
      _es6_module_resort = true;
      _es6_module.depends.push(mod);
  }
  if (mod===undefined||!mod.loaded) {
      if (_debug_modules)
        console.log("cannot import module", name, mod);
      throw new ModuleLoadError("Cannot import module "+name);
  }
  return mod.exports;
}
function es6_import_item(_es6_module, modname, name) {
  var mod=_es6_get_module(modname);
  if (mod!==undefined) {
      mod.links.push(_es6_module);
  }
  if (mod!==undefined&&_es6_module.depends.indexOf(mod)<0) {
      debug("updating dependencies");
      _es6_module_resort = true;
      _es6_module.depends.push(mod);
  }
  if (!(name in mod.exports)) {
      if (1||_debug_modules)
        console.log(_es6_module.name+":", "name not in exports", name, mod);
      throw new ModuleLoadError(_es6_module.name+":"+"name not in exports: "+name+" is not in "+mod.path);
  }
  return mod.exports[name];
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
  for (let k in _defined_modules) {
      let mod=_defined_modules[k];
      let i=mod.path.search(/src\/core/);
      if (i>=0) {
          let path=mod.path.slice(0, i);
          _rootpath_src = path+"src";
      }
  }
  var start_time=time_ms();
  for (let k in _defined_modules) {
      let mod=_defined_modules[k];
      if (mod===undefined||mod.depends===undefined) {
          console.warn("Module error", mod);
          throw new Error("Module Error"+(mod ? mod.name : ""));
      }
      for (var i=0; i<mod.depends.length; i++) {
          let mod2=mod.depends[i];
          if (typeof (mod2)=="string") {
              _es6_push_basepath(mod.path);
              mod2 = es6_get_module_meta(mod2);
              _es6_pop_basepath();
          }
          mod.depends[i] = mod2;
          if (mod2.links.indexOf(mod)<0)
            mod2.links.push(mod);
      }
  }
  var sortlist=sort_modules();
  if (_is_cyclic) {
      for (let k in _defined_modules) {
          let mod=_defined_modules[k];
          mod._exports = mod.exports||{};
          Object.defineProperty(mod, "exports", {get: function get() {
              return this._exports;
            }, 
       set: function set(v) {
              Object.assign(this._exports, v);
            }});
      }
      let visitmap=new Map();
      let modstack=[];
      console.log("cyclic module load");
      for (let k in _defined_modules) {
          let mod=_defined_modules[k];
          if (!mod.loaded) {
              _load_module_cyclic(mod, visitmap, modstack);
          }
      }
      _post_primary_load = true;
      if (_debug_modules) {
          for (let k of visitmap.keys()) {
              if (visitmap.get(k)<2)
                continue;
              if (!k.name) {
                  console.log("EEK!", k);
              }
              console.log(visitmap.get(k), k.name, k.path);
          }
      }
  }
  else {
    for (let mod of sortlist) {
        _load_module(mod);
    }
  }
  startup_report("...Finished.  "+(time_ms()-start_time).toFixed(1)+"ms");
  for (var k in _defined_modules) {
      let mod=_defined_modules[k];
      window["_"+mod.name] = mod.exports;
  }
}
function test_modules() {
  es6_module_define("util", [], function (_es6_module) {
    debug("in util");
    var mod=_es6_module;
    mod.add_export("list", Array);
  });
  es6_module_define("math", ["util"], function (_es6_module, util) {
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
if (Array.prototype.remove===undefined) {
    Array.prototype.remove = function (item, throw_error) {
      if (throw_error===undefined) {
          throw_error = true;
      }
      let idx=this.indexOf(item);
      if (idx<0) {
          console.warn("Item not in array:", item);
          if (throw_error) {
              throw new Error("Item not in array");
          }
          else {
            return this;
          }
      }
      while (idx<this.length-1) {
        this[idx] = this[idx+1];
        idx++;
      }
      this[idx] = undefined;
      this.length--;
      return this;
    };
}
function register_test(obj) {
  defined_tests.push(obj);
}
window._ESClass = (function () {
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
    if (typeof symbol==="object"&&Array.isArray(symbol)) {
        symbol = symbol[0];
    }
    this.symbol = symbol;
    this.func = func;
  }
  var handle_statics=function (cls, parent) {
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
            construct = function () {
              parent.apply(this, arguments);
            };
        }
        else {
          construct = function () {
          };
        }
    }
    if (parent!=undefined) {
        construct.prototype = Object.create(parent.prototype);
    }
    construct.prototype.constructor = construct;
    construct.prototype.__prototypeid__ = Class.__prototype_idgen++;
    construct.__prototypeid__ = construct.prototype.__prototypeid__;
    construct[Symbol.keystr] = function () {
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
        var def={configurable: true, 
      get: getters[k], 
      set: setters[k]};
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
  Class.register = function (cls) {
    cls.prototype.__prototypeid__ = Class.__prototype_idgen++;
    cls.__parent__ = cls.prototype.__proto__.constructor;
    cls.prototype.prototype = cls.prototype.__proto__;
    defined_classes.push(cls);
  }
  Class.get = function (func) {
    return new ClassGetter(func);
  }
  Class.set = function (func) {
    return new ClassSetter(func);
  }
  Class.__prototype_idgen = 1;
  Class.static = Class.static_method = function (func) {
    func._is_static_method = true;
    return new StaticMethod(func);
  }
  Class.symbol = function (symbol, func) {
    return new SymbolMethod(symbol, func);
  }
  return Class;
})();
function mixin(child, parent) {
  let ok=1;
  while (ok) {
    let keys=Object.getOwnPropertyNames(parent.prototype);
    for (var i=0; i<keys.length; i++) {
        let k=keys[i];
        if (child.prototype[k]==undefined) {
            child.prototype[k] = parent.prototype[k];
        }
    }
    var symbols=Object.getOwnPropertySymbols(parent.prototype);
    for (var i=0; i<symbols.length; i++) {
        var k=symbols[i];
        if (!(k in child.prototype)) {
            child.prototype[k] = parent.prototype[k];
        }
    }
    ok = parent!==parent.prototype.__proto__.constructor;
    parent = parent.prototype.__proto__.constructor;
    ok = ok&&parent!==undefined&&parent!==Object;
  }
}
function define_static(obj, name, val) {
  obj[name] = val;
  if (obj.__statics__) {
      obj.__statics__[name] = name;
  }
  if (val!=undefined&&(typeof val=="object"||typeof val=="function"||typeof val=="string")) {
      val._is_static_method = true;
  }
}
function __instance_of(child, parent) {
  if (child instanceof parent)
    return true;
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
  this.ret = {done: false, 
   value: undefined}
  this.keys = keys;
  this.cur = 0;
  this[Symbol.iterator] = function () {
    return this;
  }
  this.next = function () {
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
var __sp_ws={"\n": 0, 
  "\r": 0, 
  "\t": 0, 
  "\v": 0, 
  " ": 0, 
  "\0": 0};
if (String.prototype.trimRight==undefined) {
    String.prototype.trimRight = function () {
      var i=this.length-1;
      while (i>=0&&this[i] in __sp_ws) {
        i--;
      }
      return this.slice(0, i+1);
    };
}
if (String.prototype.trimLeft==undefined) {
    String.prototype.trimLeft = function () {
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
class _KeyValIterator  {
  
  
   constructor(obj) {
    this.ret = {done: false, 
    value: [undefined, undefined]};
    this.i = 0;
    this.obj = obj;
    this.keys = Object.keys(obj);
  }
   [Symbol.iterator]() {
    return this;
  }
   next() {
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
  }
}
_ESClass.register(_KeyValIterator);
var Iterator=function (obj) {
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

es6_module_define('config', ["./config_local.js", "../path.ux/scripts/config/const.js", "./config_local"], function _config_module(_es6_module) {
  "use strict";
  es6_import(_es6_module, '../path.ux/scripts/config/const.js');
  let PathUXConstants={colorSchemeType: "dark", 
   autoSizeUpdate: true, 
   useAreaTabSwitcher: false, 
   addHelpPickers: true, 
   showPathsInToolTips: true, 
   DEBUG: {modalEvents: true}}
  PathUXConstants = _es6_module.add_export('PathUXConstants', PathUXConstants);
  var ORIGIN=location.origin;
  ORIGIN = _es6_module.add_export('ORIGIN', ORIGIN);
  var MANIPULATOR_MOUSEOVER_LIMIT=25;
  MANIPULATOR_MOUSEOVER_LIMIT = _es6_module.add_export('MANIPULATOR_MOUSEOVER_LIMIT', MANIPULATOR_MOUSEOVER_LIMIT);
  var NO_RENDER_WORKERS=false;
  NO_RENDER_WORKERS = _es6_module.add_export('NO_RENDER_WORKERS', NO_RENDER_WORKERS);
  var ELECTRON_APP_MODE=document.getElementById("ElectronAppMode")!==null;
  ELECTRON_APP_MODE = _es6_module.add_export('ELECTRON_APP_MODE', ELECTRON_APP_MODE);
  var CHROME_APP_MODE=document.getElementById("GoogleChromeAppMode")!==null;
  CHROME_APP_MODE = _es6_module.add_export('CHROME_APP_MODE', CHROME_APP_MODE);
  var PHONE_APP_MODE=document.getElementById("PhoneAppMode")!==null;
  PHONE_APP_MODE = _es6_module.add_export('PHONE_APP_MODE', PHONE_APP_MODE);
  var HTML5_APP_MODE=document.getElementById("Html5AppMode")!==null;
  HTML5_APP_MODE = _es6_module.add_export('HTML5_APP_MODE', HTML5_APP_MODE);
  var HAVE_SKIA=false;
  HAVE_SKIA = _es6_module.add_export('HAVE_SKIA', HAVE_SKIA);
  let platform="web";
  if (ELECTRON_APP_MODE) {
      platform = process.platform.toLowerCase();
  }
  var PLATFORM=platform;
  PLATFORM = _es6_module.add_export('PLATFORM', PLATFORM);
  var IS_WIN=platform.toLowerCase().search("win")>=0;
  IS_WIN = _es6_module.add_export('IS_WIN', IS_WIN);
  var ICONPATH=PHONE_APP_MODE ? "img/" : (ELECTRON_APP_MODE ? "./fcontent/" : "fcontent/");
  ICONPATH = _es6_module.add_export('ICONPATH', ICONPATH);
  var IS_NODEJS=ELECTRON_APP_MODE;
  IS_NODEJS = _es6_module.add_export('IS_NODEJS', IS_NODEJS);
  var USE_WASM=true;
  USE_WASM = _es6_module.add_export('USE_WASM', USE_WASM);
  var USE_NACL=CHROME_APP_MODE;
  USE_NACL = _es6_module.add_export('USE_NACL', USE_NACL);
  var NO_SERVER=true;
  NO_SERVER = _es6_module.add_export('NO_SERVER', NO_SERVER);
  var USE_HTML5_FILEAPI=NO_SERVER;
  USE_HTML5_FILEAPI = _es6_module.add_export('USE_HTML5_FILEAPI', USE_HTML5_FILEAPI);
  var DISABLE_SOLVE=false;
  DISABLE_SOLVE = _es6_module.add_export('DISABLE_SOLVE', DISABLE_SOLVE);
  var ENABLE_MULTIRES=false;
  ENABLE_MULTIRES = _es6_module.add_export('ENABLE_MULTIRES', ENABLE_MULTIRES);
  var HAVE_EVAL=false;
  HAVE_EVAL = _es6_module.add_export('HAVE_EVAL', HAVE_EVAL);
  var MAX_CANVAS2D_VECTOR_CACHE_SIZE=1700;
  MAX_CANVAS2D_VECTOR_CACHE_SIZE = _es6_module.add_export('MAX_CANVAS2D_VECTOR_CACHE_SIZE', MAX_CANVAS2D_VECTOR_CACHE_SIZE);
  var MAX_RECENT_FILES=12;
  MAX_RECENT_FILES = _es6_module.add_export('MAX_RECENT_FILES', MAX_RECENT_FILES);
  var ON_TICK_TIMER_MS=150;
  ON_TICK_TIMER_MS = _es6_module.add_export('ON_TICK_TIMER_MS', ON_TICK_TIMER_MS);
  window.RELEASE = false;
  var config_local=es6_import(_es6_module, './config_local.js');
  var ___config_local=es6_import(_es6_module, './config_local');
  for (let k in ___config_local) {
      _es6_module.add_export(k, ___config_local[k], true);
  }
  window._DEBUG = {timeChange: false, 
   dag: false, 
   theme: false, 
   no_native: false, 
   solve_order: false, 
   degenerate_geometry: false, 
   viewport_partial_update: false, 
   alias_g_app_state: true, 
   gl_objects: false, 
   Struct: false, 
   ui_except_handling: false, 
   modal: false, 
   datalib: false, 
   glext: false, 
   selbuf: false, 
   toolstack: false, 
   transform: false, 
   mesh_api: false, 
   keyboard: false, 
   modifier_keys: false, 
   mouse: false, 
   touch: 1, 
   mousemove: false, 
   ui_datapaths: false, 
   ui_menus: false, 
   ui_canvas: false, 
   ui_redraw: false, 
   icons: false, 
   complex_ui_recalc: false, 
   screen_keyboard: false, 
   data_api_timing: false, 
   canvas_sep_text: true, 
   disable_on_tick: false, 
   octree: false, 
   netio: false, 
   compression: false, 
   force_mobile: false, 
   tesselator: false, 
   use_2d_uicanvas: 1, 
   trace_recalc_all: false, 
   fastDrawMode: false}
  if (window.DEBUG===undefined) {
      window.DEBUG = config_local.DEBUG!==undefined ? config_local.DEBUG : {};
  }
  else {
    for (let k in config_local.DEBUG) {
        window.DEBUG[k] = config_local.DEBUG[k];
    }
  }
  for (var k in _DEBUG) {
      if (!(k in DEBUG)) {
          DEBUG[k] = _DEBUG[k];
      }
  }
  if (DEBUG&&DEBUG.force_mobile)
    window.IsMobile = true;
  if (window._platform_config) {
      for (let k in _platform_config) {
          exports[k] = _platform_config[k];
      }
  }
}, '/dev/fairmotion/src/config/config.js');

es6_module_define('config_local', [], function _config_local_module(_es6_module) {
  'use strict';
  let HAVE_EVAL=true;
  HAVE_EVAL = _es6_module.add_export('HAVE_EVAL', HAVE_EVAL);
  let NO_RENDER_WORKERS=false;
  NO_RENDER_WORKERS = _es6_module.add_export('NO_RENDER_WORKERS', NO_RENDER_WORKERS);
  let DEBUG={fastDrawMode: false, 
   modalEvents: true}
  DEBUG = _es6_module.add_export('DEBUG', DEBUG);
}, '/dev/fairmotion/src/config/config_local.js');

es6_module_define('const', ["../config/config.js"], function _const_module(_es6_module) {
  "use strict";
  es6_import(_es6_module, '../config/config.js');
  const USE_PATHUX_API=true;
  _es6_module.add_export('USE_PATHUX_API', USE_PATHUX_API);
  window.fairmotion_file_ext = ".fmo";
  window.fairmotion_settings_filename = ".settings.bin";
  window.g_app_version = 0.053;
  window.UNIT_TESTER = false;
  window.FEATURES = {save_toolstack: false}
  window.use_octree_select = true;
  window.fuzzy_ui_press_hotspot = 25;
  window.new_api_parser = true;
  if (myLocalStorage.use_canvas2d==undefined)
    myLocalStorage.use_canvas2d = true;
  var $_mh=undefined;
  if (!RELEASE&&!("M" in window)&&!("O" in window)) {
      Object.defineProperty(window, "G", {get: function () {
          return g_app_state;
        }, 
     configurable: true});
      Object.defineProperty(window, "V2D", {get: function () {
          return g_app_state.active_view2d;
        }, 
     configurable: true});
      Object.defineProperty(window, "API", {get: function () {
          return g_app_state.api;
        }, 
     configurable: true});
  }
}, '/dev/fairmotion/src/core/const.js');

es6_module_define('const', ["../path-controller/config/config.js"], function _const_module(_es6_module) {
  let _clipdata={name: "nothing", 
   mime: "nothing", 
   data: undefined}
  let _clipboards={}
  var ctrlconfig=es6_import(_es6_module, '../path-controller/config/config.js');
  window.setInterval(() =>    {
    let cb=navigator.clipboard;
    if (!cb||!cb.read) {
        return ;
    }
    cb.read().then((data) =>      {
      for (let item of data) {
          for (let i=0; i<item.types.length; i++) {
              let type=item.types[i];
              if (!(type in _clipboards)) {
                  _clipboards[type] = {name: type, 
           mime: type, 
           data: undefined};
              }
              
              item.getType(type).then((blob) =>                {
                return new Response(blob).text();
              }).then((text) =>                {
                _clipboards[type].data = text;
              });
          }
      }
    }).catch(function () {
    });
  }, 200);
  let exports={getClipboardData: function getClipboardData(desiredMimes) {
      if (desiredMimes===undefined) {
          desiredMimes = "text/plain";
      }
      if (typeof desiredMimes==="string") {
          desiredMimes = [desiredMimes];
      }
      for (let m of desiredMimes) {
          let cb=_clipboards[m];
          if (cb&&cb.data) {
              return cb;
          }
      }
    }, 
   setClipboardData: function setClipboardData(name, mime, data) {
      _clipboards[mime] = {name: name, 
     mime: mime, 
     data: data}
      let clipboard=navigator.clipboard;
      if (!clipboard) {
          return ;
      }
      try {
        clipboard.write([new ClipboardItem({[mime]: new Blob([data], {type: mime})})]).catch((error) =>          {
          if (mime.startsWith("text")&&mime!=="text/plain") {
              this.setClipboardData(name, "text/plain", data);
          }
          else {
            console.error(error);
          }
        });
      }
      catch (error) {
          console.log(error.stack);
          console.log("failed to write to system clipboard");
      }
    }, 
   colorSchemeType: "light", 
   docManualPath: "../simple_docsys/doc_build/", 
   useNumSliderTextboxes: true, 
   numSliderArrowLimit: 3, 
   simpleNumSliders: false, 
   menusCanPopupAbove: false, 
   menu_close_time: 500, 
   doubleClickTime: 500, 
   doubleClickHoldTime: 750, 
   DEBUG: {paranoidEvents: false, 
    screenborders: false, 
    areaContextPushes: false, 
    allBordersMovable: false, 
    doOnce: false, 
    modalEvents: false, 
    areaConstraintSolver: false, 
    datapaths: false, 
    domEvents: false, 
    domEventAddRemove: false, 
    debugUIUpdatePerf: false, 
    screenAreaPosSizeAccesses: false, 
    buttonEvents: false}, 
   autoLoadSplineTemplates: true, 
   addHelpPickers: true, 
   useAreaTabSwitcher: false, 
   autoSizeUpdate: true, 
   showPathsInToolTips: true, 
   enableThemeAutoUpdate: true, 
   useNativeToolTips: false, 
   loadConstants: function (args) {
      for (let k in args) {
          if (k==="loadConstants")
            continue;
          this[k] = args[k];
      }
      console.error("CC", ctrlconfig);
      ctrlconfig.setConfig(this);
    }}
  exports;
  _es6_module.set_default_export('exports', exports);
  
  window.DEBUG = exports.DEBUG;
  let cfg=document.getElementById("pathux-config");
  if (cfg) {
      console.error("CONFIG CONFIG", cfg.innerText);
      exports.loadConstants(JSON.parse(cfg.innerText));
  }
}, '/dev/fairmotion/src/path.ux/scripts/config/const.js');

es6_module_define('config', [], function _config_module(_es6_module) {
  let config={doubleClickTime: 500, 
   autoLoadSplineTemplates: true, 
   doubleClickHoldTime: 750, 
   DEBUG: {}}
  config = _es6_module.add_export('config', config);
  function setConfig(obj) {
    for (let k in obj) {
        config[k] = obj[k];
    }
  }
  setConfig = _es6_module.add_export('setConfig', setConfig);
  config;
  _es6_module.set_default_export('config', config);
  
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/config/config.js');

es6_module_define('polyfill', [], function _polyfill_module(_es6_module) {
  if (typeof window==="undefined"&&typeof global!=="undefined") {
      global.window = global;
  }
  (function () {
    let visitgen=0;
    window.destroyAllCSS = function () {
      visitgen++;
      let visit=(n) =>        {
        if (n.__visit===visitgen) {
            return ;
        }
        n.__visit = visitgen;
        if (n.tagName==="STYLE") {
            n.textContents = '';
        }
        if (n.style) {
            for (let k in n.style) {
                try {
                  n.style[k] = "";
                }
                catch (error) {
                }
            }
        }
        if (!n.childNodes) {
            return ;
        }
        for (let c of n.childNodes) {
            visit(c);
        }
      }
      visit(document.head);
      visit(document.body);
      for (let sheet of document.styleSheets) {
          for (let i=0; i<sheet.rules.length; i++) {
              sheet.removeRule(sheet.rules[0]);
          }
      }
    }
  })();
  window.eventDebugModule = (function () {
    "use strict";
    return {start: function start() {
        window.debugEventLists = {}
        window.debugEventList = [];
        this._addEventListener = EventTarget.prototype.addEventListener;
        this._removeEventListener = EventTarget.prototype.removeEventListener;
        this._dispatchEvent = EventTarget.prototype.dispatchEvent;
        EventTarget.prototype.addEventListener = this.onadd;
        EventTarget.prototype.removeEventListener = this.onrem;
        EventTarget.prototype.dispatchEvent = this.ondispatch;
      }, 
    add: function add(type, data) {
        if (!(type in debugEventLists)) {
            debugEventLists[type] = [];
        }
        debugEventLists[type].push(data);
      }, 
    ondispatch: function ondispatch() {
        let a=arguments;
        eventDebugModule.add("Dispatch", {event: a[0], 
      thisvar: a[4], 
      line: a[5], 
      filename: a[6].replace(/\\/g, "/"), 
      filepath: location.origin+a[6].replace(/\\/g, "/")+":"+a[5], 
      ownerpath: a[7]});
        return eventDebugModule._dispatchEvent.apply(this, arguments);
      }, 
    onadd: function onadd() {
        let a=arguments;
        eventDebugModule.add("Add", {type: a[0], 
      cb: a[1], 
      args: a[2], 
      thisvar: a[4], 
      line: a[5], 
      filename: a[6].replace(/\\/g, "/"), 
      filepath: location.origin+a[6].replace(/\\/g, "/")+":"+a[5], 
      ownerpath: a[7]});
        return eventDebugModule._addEventListener.apply(this, arguments);
      }, 
    pruneConnected: function pruneConnected() {
        for (let k in debugEventLists) {
            let list=debugEventLists[k];
            for (let i=0; i<list.length; i++) {
                let e=list[i];
                if (!e.thisvar||!(__instance_of(e.thisvar, Node))) {
                    continue;
                }
                if (!e.thisvar.isConnected) {
                    list[i] = list[list.length-1];
                    list[list.length-1] = undefined;
                    list.length--;
                    i--;
                }
            }
        }
      }, 
    onrem: function onrem() {
        let a=arguments;
        eventDebugModule.add("Rem", {type: a[0], 
      cb: a[1], 
      args: a[2], 
      thisvar: a[4], 
      line: a[5], 
      filename: a[6].replace(/\\/g, "/"), 
      filepath: location.origin+a[6].replace(/\\/g, "/")+":"+a[5], 
      ownerpath: a[7]});
        return eventDebugModule._removeEventListener.apply(this, arguments);
      }}
  })();
  if (typeof _debug_event_listeners!=="undefined"&&_debug_event_listeners) {
      eventDebugModule.start();
  }
  if (window._disable_all_listeners) {
      console.warn("Disabling all event listeners");
      EventTarget.prototype.addEventListener = () =>        {      };
      EventSource.prototype.addEventListener = () =>        {      };
  }
  if (typeof visualViewport==="undefined") {
      (function () {
        class MyVisualViewport  {
          get  width() {
            return window.innerWidth;
          }
          get  height() {
            return window.innerHeight;
          }
          get  offsetLeft() {
            return 0;
          }
          get  offsetTop() {
            return 0;
          }
          get  pageLeft() {
            return 0;
          }
          get  pageTop() {
            return 0;
          }
          get  scale() {
            return 1.0;
          }
        }
        _ESClass.register(MyVisualViewport);
        _es6_module.add_class(MyVisualViewport);
        window.visualViewport = new MyVisualViewport();
      })();
  }
  if (Array.prototype.set===undefined) {
      Array.prototype.set = function set(array) {
        if (arguments.length===0) {
            return ;
        }
        let src, dst, count;
        if (arguments.length===0) {
            src = 0;
            dst = 0;
            count = array.length;
        }
        else 
          if (arguments.length===1) {
            count = array.length;
            src = arguments[1];
            dst = 0;
        }
        else 
          if (arguments.length===2) {
            src = arguments[1];
            count = arguments[2];
        }
        else 
          if (arguments.length===3) {
            src = arguments[1];
            dst = arguments[2];
            count = arguments[3];
        }
        src = src===undefined ? 0 : src;
        dst = dst===undefined ? 0 : dst;
        count = count===undefined ? array.length : count;
        if (count<0) {
            throw new RangeError("Count must be >= zero");
        }
        let len=Math.min(src+count, array.length)-src;
        if (dst+len>this.length) {
            this.length = dst+len;
        }
        for (let i=0; i<len; i++) {
            this[dst+i] = array[src+i];
        }
        return this;
      };
      Object.defineProperty(Array.prototype, "set", {enumerable: false, 
     configurable: true});
      if (Float64Array.prototype.set===undefined) {
          Float64Array.prototype.set = Array.prototype.set;
          Float32Array.prototype.set = Array.prototype.set;
          Uint8Array.prototype.set = Array.prototype.set;
          Uint8ClampedArray.prototype.set = Array.prototype.set;
          Int32Array.prototype.set = Array.prototype.set;
          Int16Array.prototype.set = Array.prototype.set;
          Int8Array.prototype.set = Array.prototype.set;
      }
  }
  if (Array.prototype.reject===undefined) {
      Array.prototype.reject = function reject(func) {
        return this.filter((item) =>          {
          return !func(item);
        });
      };
      Object.defineProperty(Array.prototype, "reject", {enumerable: false, 
     configurable: true});
  }
  if (window.Symbol==undefined) {
      window.Symbol = {iterator: "$__iterator__$", 
     keystr: "$__keystr__$"};
  }
  else 
    if (Symbol.keystr===undefined) {
      Symbol.keystr = Symbol("keystr");
  }
  if (Math.fract===undefined) {
      Math.fract = function fract(f) {
        return f-Math.floor(f);
      };
  }
  if (Math.tent===undefined) {
      Math.tent = function tent(f) {
        return 1.0-Math.abs(Math.fract(f)-0.5)*2.0;
      };
  }
  if (Math.sign===undefined) {
      Math.sign = function sign(f) {
        return (f>0.0)*2.0-1.0;
      };
  }
  if (Array.prototype.pop_i===undefined) {
      Array.prototype.pop_i = function (idx) {
        if (idx<0||idx>=this.length) {
            throw new Error("Index out of range");
        }
        while (idx<this.length) {
          this[idx] = this[idx+1];
          idx++;
        }
        this.length-=1;
      };
      Object.defineProperty(Array.prototype, "pop_i", {enumerable: false, 
     configurable: true});
  }
  if (Array.prototype.remove===undefined) {
      Array.prototype.remove = function (item, suppress_error) {
        var i=this.indexOf(item);
        if (i<0) {
            if (suppress_error)
              console.trace("Warning: item not in array", item);
            else 
              throw new Error("Error: item not in array "+item);
            return ;
        }
        this.pop_i(i);
      };
      Object.defineProperty(Array.prototype, "remove", {enumerable: false, 
     configurable: true});
  }
  if (String.prototype.contains===undefined) {
      String.prototype.contains = function (substr) {
        return String.search(substr)>=0;
      };
  }
  String.prototype[Symbol.keystr] = function () {
    return this;
  }
  Number.prototype[Symbol.keystr] = Boolean.prototype[Symbol.keystr] = function () {
    return ""+this;
  }
  Array.prototype[Symbol.keystr] = function () {
    let key="";
    for (let item of this) {
        key+=item[Symbol.keystr]()+":";
    }
    return key;
  }
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/polyfill.js');

es6_module_define('util', ["../extern/lz-string/lz-string.js", "./mobile-detect.js", "./polyfill.js", "./struct.js"], function _util_module(_es6_module) {
  es6_import(_es6_module, './polyfill.js');
  es6_import(_es6_module, './struct.js');
  es6_import(_es6_module, './mobile-detect.js');
  var nstructjs=es6_import_item(_es6_module, './struct.js', 'default');
  let f64tmp=new Float64Array(1);
  let u16tmp=new Uint16Array(f64tmp.buffer);
  function isDenormal(f) {
    f64tmp[0] = f;
    let a=u16tmp[0], b=u16tmp[1], c=u16tmp[2], d=u16tmp[3];
    if (a===0&&b===0&&c===0&&(d===0||d===32768)) {
        return false;
    }
    let test=d&~(1<<15);
    test = test>>4;
    return test===0;
  }
  isDenormal = _es6_module.add_export('isDenormal', isDenormal);
  globalThis._isDenormal = isDenormal;
  let colormap={"black": 30, 
   "red": 31, 
   "green": 32, 
   "yellow": 33, 
   "blue": 34, 
   "magenta": 35, 
   "cyan": 36, 
   "teal": 36, 
   "white": 37, 
   "reset": 0, 
   "grey": 2, 
   "gray": 2, 
   "orange": 202, 
   "pink": 198, 
   "brown": 314, 
   "lightred": 91, 
   "peach": 210}
  let termColorMap={}
  termColorMap = _es6_module.add_export('termColorMap', termColorMap);
  for (let k in colormap) {
      termColorMap[k] = colormap[k];
      termColorMap[colormap[k]] = k;
  }
  function termColor(s, c, d) {
    if (d===undefined) {
        d = 0;
    }
    if (typeof s==="symbol") {
        s = s.toString();
    }
    else {
      s = ""+s;
    }
    if (c in colormap)
      c = colormap[c];
    if (c>107) {
        let s2='\u001b[38;5;'+c+"m";
        return s2+s+'\u001b[39m';
    }
    return '\u001b['+c+'m'+s+'\u001b[39m';
  }
  termColor = _es6_module.add_export('termColor', termColor);
  
  function termPrint() {
    let s='';
    for (let i=0; i<arguments.length; i++) {
        if (i>0) {
            s+=' ';
        }
        s+=arguments[i];
    }
    let re1a=/\u001b\[[1-9][0-9]?m/;
    let re1b=/\u001b\[[1-9][0-9];[0-9][0-9]?;[0-9]+m/;
    let re2=/\u001b\[39m/;
    let endtag='\u001b[39m';
    function tok(s, type) {
      return {type: type, 
     value: s}
    }
    let tokdef=[[re1a, "start"], [re1b, "start"], [re2, "end"]];
    let s2=s;
    let i=0;
    let tokens=[];
    while (s2.length>0) {
      let ok=false;
      let mintk=undefined, mini=undefined;
      let minslice=undefined, mintype=undefined;
      for (let tk of tokdef) {
          let i=s2.search(tk[0]);
          if (i>=0&&(mini===undefined||i<mini)) {
              minslice = s2.slice(i, s2.length).match(tk[0])[0];
              mini = i;
              mintype = tk[1];
              mintk = tk;
              ok = true;
          }
      }
      if (!ok) {
          break;
      }
      if (mini>0) {
          let chunk=s2.slice(0, mini);
          tokens.push(tok(chunk, "chunk"));
      }
      s2 = s2.slice(mini+minslice.length, s2.length);
      let t=tok(minslice, mintype);
      tokens.push(t);
    }
    if (s2.length>0) {
        tokens.push(tok(s2, "chunk"));
    }
    let stack=[];
    let cur;
    let out='';
    for (let t of tokens) {
        if (t.type==="chunk") {
            out+=t.value;
        }
        else 
          if (t.type==="start") {
            stack.push(cur);
            cur = t.value;
            out+=t.value;
        }
        else 
          if (t.type==="end") {
            cur = stack.pop();
            if (cur) {
                out+=cur;
            }
            else {
              out+=endtag;
            }
        }
    }
    return out;
  }
  termPrint = _es6_module.add_export('termPrint', termPrint);
  globalThis.termColor = termColor;
  class MovingAvg extends Array {
     constructor(size=64) {
      super();
      this.length = size;
      this.cur = 0;
      this.used = 0;
      this.sum = 0;
    }
     reset() {
      this.cur = this.used = this.sum = 0.0;
      return this;
    }
     add(val) {
      if (this.used<this.length) {
          this[this.cur] = val;
          this.used++;
      }
      else {
        this.sum-=this[this.cur];
        this[this.cur] = val;
      }
      this.sum+=val;
      this.cur = (this.cur+1)%this.length;
      return this.sample();
    }
     sample() {
      return this.used ? this.sum/this.used : 0.0;
    }
  }
  _ESClass.register(MovingAvg);
  _es6_module.add_class(MovingAvg);
  MovingAvg = _es6_module.add_export('MovingAvg', MovingAvg);
  let timers={}
  timers = _es6_module.add_export('timers', timers);
  function pollTimer(id, interval) {
    if (!(id in timers)) {
        timers[id] = time_ms();
    }
    if (time_ms()-timers[id]>=interval) {
        timers[id] = time_ms();
        return true;
    }
    return false;
  }
  pollTimer = _es6_module.add_export('pollTimer', pollTimer);
  let mdetect=undefined;
  let mret=undefined;
  function isMobile() {
    if (!window.MobileDetect) {
        return ;
    }
    if (mret===undefined) {
        mdetect = new MobileDetect(navigator.userAgent);
        let ret=mdetect.mobile();
        if (typeof ret==="string") {
            ret = ret.toLowerCase();
        }
        mret = ret;
    }
    return mret;
  }
  isMobile = _es6_module.add_export('isMobile', isMobile);
  class SmartConsoleContext  {
     constructor(name, console) {
      this.name = name;
      let c=[random(), random(), random()];
      let sum=Math.sqrt(c[0]*c[0]+c[1]*c[1]+c[2]*c[2]);
      sum = 255/sum;
      let r=~~(c[0]*sum);
      let g=~~(c[1]*sum);
      let b=~~(c[2]*sum);
      this.color = `rgb(${r},${g},${b})`;
      this.__console = console;
      this.timeInterval = 375;
      this.timeIntervalAll = 245;
      this._last = 0;
      this.last = 0;
      this.last2 = 0;
      this._data = {};
      this._data_length = 0;
      this.maxCache = 256;
    }
     hash(args) {
      let sum=0;
      let mul=(1<<19)-1, off=(1<<27)-1;
      let i=0;
      function dohash(h) {
        h = (h*mul+off+i*mul*0.25)&mul;
        i++;
        sum = sum^h;
      }
      let visit=new WeakSet();
      let recurse=(n) =>        {
        if (typeof n==="string") {
            dohash(strhash(n));
        }
        else 
          if (typeof n==="undefined"||n===null) {
            dohash(0);
        }
        else 
          if (typeof n==="object") {
            if (n===undefined) {
            }
            if (visit.has(n)) {
                return ;
            }
            visit.add(n);
            let keys=getAllKeys(n);
            for (let k of keys) {
                let v;
                if (typeof k!=="string") {
                    continue;
                }
                try {
                  v = n[k];
                }
                catch (error) {
                    continue;
                }
                recurse(v);
            }
        }
        else 
          if (typeof n==="function") {
            dohash(strhash(""+n.name));
        }
      };
      for (let i=0; i<args.length; i++) {
          recurse(args[i]);
      }
      return sum;
    }
     clearCache() {
      this._data_length = 0;
      this._data = {};
      return this;
    }
     _getData(args) {
      let key=this.hash(args);
      if (!(key in this._data)) {
          if (this._data_length>this.maxCache) {
              this.clearCache();
          }
          this._data[key] = {time: 0, 
       count: 0};
          this._data_length++;
      }
      return this._data[key];
    }
     _check(args) {
      if (this.timeIntervalAll>0&&time_ms()-this.last2<this.timeIntervalAll) {
          return false;
      }
      this.last2 = time_ms();
      return true;
    }
     log() {
      if (this._check(arguments)) {
          window.console.log("%c", "color:"+this.color, ...arguments);
      }
    }
     warn() {
      if (this._check(arguments)) {
          window.console.log("%c"+this.name, "color : "+this.color, ...arguments);
      }
    }
     trace() {
      if (this._check(arguments)) {
          window.console.trace(...arguments);
      }
    }
     error() {
      if (this._check(arguments)) {
          window.console.error(...arguments);
      }
    }
  }
  _ESClass.register(SmartConsoleContext);
  _es6_module.add_class(SmartConsoleContext);
  SmartConsoleContext = _es6_module.add_export('SmartConsoleContext', SmartConsoleContext);
  class SmartConsole  {
     constructor() {
      this.contexts = {};
    }
     context(name) {
      if (!(name in this.contexts)) {
          this.contexts[name] = new SmartConsoleContext(name, this);
      }
      return this.contexts[name];
    }
     log() {
      let c=this.context("default");
      return c.log(...arguments);
    }
     warn() {
      let c=this.context("default");
      return c.warn(...arguments);
    }
     trace() {
      let c=this.context("default");
      return c.trace(...arguments);
    }
     error() {
      let c=this.context("default");
      return c.error(...arguments);
    }
  }
  _ESClass.register(SmartConsole);
  _es6_module.add_class(SmartConsole);
  SmartConsole = _es6_module.add_export('SmartConsole', SmartConsole);
  const console=new SmartConsole();
  _es6_module.add_export('console', console);
  globalThis.tm = 0.0;
  var EmptySlot={}
  function getClassParent(cls) {
    let p=cls.prototype;
    if (p)
      p = p.__proto__;
    if (p)
      p = p.constructor;
    return p;
  }
  getClassParent = _es6_module.add_export('getClassParent', getClassParent);
  function list(iterable) {
    let ret=[];
    for (let item of iterable) {
        ret.push(item);
    }
    return ret;
  }
  list = _es6_module.add_export('list', list);
  function count(iterable, searchItem) {
    if (searchItem===undefined) {
        searchItem = undefined;
    }
    let count=0;
    if (searchItem!==undefined) {
        for (let item of iterable) {
            if (item===searchItem) {
                count++;
            }
        }
    }
    else {
      for (let item of iterable) {
          count++;
      }
    }
    return count;
  }
  count = _es6_module.add_export('count', count);
  function getAllKeys(obj) {
    let keys=new Set();
    if (typeof obj!=="object"&&typeof obj!=="function") {
        throw new Error("must pass an object ot getAllKeys; object was: "+obj);
    }
    let p;
    while (p&&p!==Object) {
      for (let k in Object.getOwnPropertyDescriptors(obj)) {
          if (k==="__proto__")
            continue;
          keys.add(k);
      }
      for (let k of Object.getOwnPropertySymbols(obj)) {
          keys.add(k);
      }
      p = p.__proto__;
    }
    let cls=obj.constructor;
    if (!cls)
      return keys;
    while (cls) {
      let proto=cls.prototype;
      if (!proto) {
          cls = getClassParent(cls);
          continue;
      }
      for (let k in proto) {
          keys.add(k);
      }
      for (let k in Object.getOwnPropertyDescriptors(proto)) {
          keys.add(k);
      }
      cls = getClassParent(cls);
    }
    return keys;
  }
  getAllKeys = _es6_module.add_export('getAllKeys', getAllKeys);
  function btoa(buf) {
    if (__instance_of(buf, ArrayBuffer)) {
        buf = new Uint8Array(buf);
    }
    if (typeof buf=="string"||__instance_of(buf, String)) {
        return window.btoa(buf);
    }
    var ret="";
    for (var i=0; i<buf.length; i++) {
        ret+=String.fromCharCode(buf[i]);
    }
    return btoa(ret);
  }
  btoa = _es6_module.add_export('btoa', btoa);
  
  function formatNumberUI(val, isInt, decimals) {
    if (isInt===undefined) {
        isInt = false;
    }
    if (decimals===undefined) {
        decimals = 5;
    }
    if (val===undefined||val===null) {
        val = "0";
    }
    else 
      if (isNaN(val)) {
        val = "NaN";
    }
    else 
      if (val===-Infinity) {
        val = "-"+String.fromCharCode(0x221e);
    }
    else 
      if (val===Infinity) {
        val = "+"+String.fromCharCode(0x221e);
    }
    else 
      if (!isInt) {
        val = val.toFixed(decimals);
    }
    else {
      val = ""+Math.floor(val);
    }
    return val;
  }
  formatNumberUI = _es6_module.add_export('formatNumberUI', formatNumberUI);
  function atob(buf) {
    let data=window.atob(buf);
    let ret=[];
    for (let i=0; i<data.length; i++) {
        ret.push(data.charCodeAt(i));
    }
    return new Uint8Array(ret);
  }
  atob = _es6_module.add_export('atob', atob);
  function time_ms() {
    if (window.performance)
      return window.performance.now();
    else 
      return new Date().getMilliseconds();
  }
  time_ms = _es6_module.add_export('time_ms', time_ms);
  function color2css(c) {
    var ret=c.length==3 ? "rgb(" : "rgba(";
    for (var i=0; i<3; i++) {
        if (i>0)
          ret+=",";
        ret+=~~(c[i]*255);
    }
    if (c.length==4)
      ret+=","+c[3];
    ret+=")";
    return ret;
  }
  color2css = _es6_module.add_export('color2css', color2css);
  function merge(obja, objb) {
    return Object.assign({}, obja, objb);
  }
  merge = _es6_module.add_export('merge', merge);
  
  const debug_cacherings=false;
  if (debug_cacherings) {
      window._cacherings = [];
      window._clear_all_cacherings = function (kill_all) {
        if (kill_all===undefined) {
            kill_all = false;
        }
        function copy(obj) {
          if (typeof obj.copy==="function") {
              return obj.copy();
          }
          else 
            if (obj.constructor===Object) {
              let ret={};
              for (let k of Reflect.ownKeys(obj)) {
                  let v;
                  try {
                    v = obj[k];
                  }
                  catch (error) {
                      continue;
                  }
                  if (typeof v!=="object") {
                      ret[k] = v;
                  }
                  else {
                    ret[k] = copy(v);
                  }
              }
              return ret;
          }
          else {
            return new obj.constructor();
          }
        }
        for (let ch of window._cacherings) {
            let obj=ch[0];
            let len=ch.length;
            ch.length = 0;
            ch.cur = 0;
            if (kill_all) {
                continue;
            }
            for (let i=0; i<len; i++) {
                ch.push(copy(obj));
            }
        }
      };
      window._nonvector_cacherings = function () {
        for (let ch of window._cacherings) {
            if (ch.length===0) {
                continue;
            }
            let name=ch[0].constructor.name;
            let ok=!name.startsWith("Vector")&&!name.startsWith("Quat");
            ok = ok&&!name.startsWith("TriEditor");
            ok = ok&&!name.startsWith("QuadEditor");
            ok = ok&&!name.startsWith("PointEditor");
            ok = ok&&!name.startsWith("LineEditor");
            if (ok) {
                console.log(name, ch);
            }
        }
      };
      window._stale_cacherings = function () {
        let ret=_cacherings.concat([]);
        ret.sort((a, b) =>          {
          return a.gen-b.gen;
        });
        return ret;
      };
  }
  class cachering extends Array {
     constructor(func, size, isprivate=false) {
      super();
      this.private = isprivate;
      this.cur = 0;
      if (!isprivate&&debug_cacherings) {
          this.gen = 0;
          window._cacherings.push(this);
      }
      for (var i=0; i<size; i++) {
          this.push(func());
      }
    }
    static  fromConstructor(cls, size, isprivate=false) {
      var func=function () {
        return new cls();
      };
      return new cachering(func, size, isprivate);
    }
     next() {
      if (debug_cacherings) {
          this.gen++;
      }
      let ret=this[this.cur];
      this.cur = (this.cur+1)%this.length;
      return ret;
    }
  }
  _ESClass.register(cachering);
  _es6_module.add_class(cachering);
  cachering = _es6_module.add_export('cachering', cachering);
  class SetIter  {
     constructor(set) {
      this.set = set;
      this.i = 0;
      this.ret = {done: false, 
     value: undefined};
    }
     [Symbol.iterator]() {
      return this;
    }
     next() {
      var ret=this.ret;
      while (this.i<this.set.items.length&&this.set.items[this.i]===EmptySlot) {
        this.i++;
      }
      if (this.i>=this.set.items.length) {
          ret.done = true;
          ret.value = undefined;
          return ret;
      }
      ret.value = this.set.items[this.i++];
      return ret;
    }
  }
  _ESClass.register(SetIter);
  _es6_module.add_class(SetIter);
  SetIter = _es6_module.add_export('SetIter', SetIter);
  class set  {
     constructor(input) {
      this.items = [];
      this.keys = {};
      this.freelist = [];
      this.length = 0;
      if (typeof input=="string") {
          input = new String(input);
      }
      if (input!==undefined) {
          if (Symbol.iterator in input) {
              for (var item of input) {
                  this.add(item);
              }
          }
          else 
            if ("forEach" in input) {
              input.forEach(function (item) {
                this.add(item);
              }, this);
          }
          else 
            if (__instance_of(input, Array)) {
              for (var i=0; i<input.length; i++) {
                  this.add(input[i]);
              }
          }
      }
    }
    get  size() {
      return this.length;
    }
     [Symbol.iterator]() {
      return new SetIter(this);
    }
     equals(setb) {
      for (let item of this) {
          if (!setb.has(item)) {
              return false;
          }
      }
      for (let item of setb) {
          if (!this.has(item)) {
              return false;
          }
      }
      return true;
    }
     clear() {
      this.items.length = 0;
      this.keys = {};
      this.freelist.length = 0;
      this.length = 0;
      return this;
    }
     filter(f, thisvar) {
      let i=0;
      let ret=new set();
      for (let item of this) {
          if (f.call(thisvar, item, i++, this)) {
              ret.add(item);
          }
      }
      return ret;
    }
     map(f, thisvar) {
      let ret=new set();
      let i=0;
      for (let item of this) {
          ret.add(f.call(thisvar, item, i++, this));
      }
      return ret;
    }
     reduce(f, initial) {
      if (initial===undefined) {
          for (let item of this) {
              initial = item;
              break;
          }
      }
      let i=0;
      for (let item of this) {
          initial = f(initial, item, i++, this);
      }
      return initial;
    }
     copy() {
      let ret=new set();
      for (let item of this) {
          ret.add(item);
      }
      return ret;
    }
     add(item) {
      var key=item[Symbol.keystr]();
      if (key in this.keys)
        return ;
      if (this.freelist.length>0) {
          var i=this.freelist.pop();
          this.keys[key] = i;
          this.items[i] = item;
      }
      else {
        var i=this.items.length;
        this.keys[key] = i;
        this.items.push(item);
      }
      this.length++;
    }
     delete(item, ignore_existence=true) {
      this.remove(item, ignore_existence);
    }
     remove(item, ignore_existence) {
      var key=item[Symbol.keystr]();
      if (!(key in this.keys)) {
          if (!ignore_existence) {
              console.warn("Warning, item", item, "is not in set");
          }
          return ;
      }
      var i=this.keys[key];
      this.freelist.push(i);
      this.items[i] = EmptySlot;
      delete this.keys[key];
      this.length--;
    }
     has(item) {
      return item[Symbol.keystr]() in this.keys;
    }
     forEach(func, thisvar) {
      for (var i=0; i<this.items.length; i++) {
          var item=this.items[i];
          if (item===EmptySlot)
            continue;
          thisvar!==undefined ? func.call(thisvar, item) : func(item);
      }
    }
  }
  _ESClass.register(set);
  _es6_module.add_class(set);
  set = _es6_module.add_export('set', set);
  class HashIter  {
     constructor(hash) {
      this.hash = hash;
      this.i = 0;
      this.ret = {done: false, 
     value: undefined};
    }
     next() {
      var items=this.hash._items;
      if (this.i>=items.length) {
          this.ret.done = true;
          this.ret.value = undefined;
          return this.ret;
      }
      do {
        this.i+=2;
      } while (this.i<items.length&&items[i]===_hash_null);
      
      return this.ret;
    }
  }
  _ESClass.register(HashIter);
  _es6_module.add_class(HashIter);
  HashIter = _es6_module.add_export('HashIter', HashIter);
  var _hash_null={}
  class hashtable  {
     constructor() {
      this._items = [];
      this._keys = {};
      this.length = 0;
    }
     [Symbol.iterator]() {
      return new HashIter(this);
    }
     set(key, val) {
      var key2=key[Symbol.keystr]();
      var i;
      if (!(key2 in this._keys)) {
          i = this._items.length;
          try {
            this._items.push(0);
            this._items.push(0);
          }
          catch (error) {
              console.log(":::", this._items.length, key, key2, val);
              throw error;
          }
          this._keys[key2] = i;
          this.length++;
      }
      else {
        i = this._keys[key2];
      }
      this._items[i] = key;
      this._items[i+1] = val;
    }
     remove(key) {
      var key2=key[Symbol.keystr]();
      if (!(key2 in this._keys)) {
          console.warn("Warning, key not in hashtable:", key, key2);
          return ;
      }
      var i=this._keys[key2];
      this._items[i] = _hash_null;
      this._items[i+1] = _hash_null;
      delete this._keys[key2];
      this.length--;
    }
     has(key) {
      var key2=key[Symbol.keystr]();
      return key2 in this._keys;
    }
     get(key) {
      var key2=key[Symbol.keystr]();
      if (!(key2 in this._keys)) {
          console.warn("Warning, item not in hash", key, key2);
          return undefined;
      }
      return this._items[this._keys[key2]+1];
    }
     add(key, val) {
      return this.set(key, val);
    }
     keys() {
      var ret=[];
      for (var i=0; i<this._items.length; i+=2) {
          var key=this._items[i];
          if (key!==_hash_null) {
              ret.push(key);
          }
      }
      return ret;
    }
     values() {
      var ret=[];
      for (var i=0; i<this._items.length; i+=2) {
          var item=this._items[i+1];
          if (item!==_hash_null) {
              ret.push(item);
          }
      }
      return ret;
    }
     forEach(cb, thisvar) {
      if (thisvar==undefined)
        thisvar = self;
      for (var k in this._keys) {
          var i=this._keys[k];
          cb.call(thisvar, k, this._items[i]);
      }
    }
  }
  _ESClass.register(hashtable);
  _es6_module.add_class(hashtable);
  hashtable = _es6_module.add_export('hashtable', hashtable);
  let IDGenInternalIDGen=0;
  class IDGen  {
     constructor() {
      this.__cur = 1;
      this._debug = false;
      this._internalID = IDGenInternalIDGen++;
    }
    get  cur() {
      return this.__cur;
    }
    set  cur(v) {
      if (isNaN(v)||!isFinite(v)) {
          throw new Error("NaN error in util.IDGen");
      }
      this.__cur = v;
    }
    get  _cur() {
      return this.cur;
    }
    set  _cur(v) {
      window.console.warn("Deprecated use of IDGen._cur");
      this.cur = v;
    }
    static  fromJSON(obj) {
      let ret=new IDGen();
      ret.cur = obj.cur===undefined ? obj._cur : obj.cur;
      return ret;
    }
     next() {
      return this.cur++;
    }
     copy() {
      let ret=new IDGen();
      ret.cur = this.cur;
      return ret;
    }
     max_cur(id) {
      this.cur = Math.max(this.cur, id+1);
    }
     toJSON() {
      return {cur: this.cur}
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(IDGen);
  _es6_module.add_class(IDGen);
  IDGen = _es6_module.add_export('IDGen', IDGen);
  IDGen.STRUCT = `
IDGen {
  cur : int;
}
`;
  nstructjs.register(IDGen);
  function get_callstack(err) {
    return (""+err.stack).split("\n");
  }
  function print_stack(err) {
    if (!err) {
        window.console.trace();
    }
    else {
      window.console.log(err.stack);
    }
  }
  print_stack = _es6_module.add_export('print_stack', print_stack);
  globalThis.get_callstack = get_callstack;
  globalThis.print_stack = print_stack;
  function fetch_file(path) {
    var url=location.origin+"/"+path;
    var req=new XMLHttpRequest();
    return new Promise(function (accept, reject) {
      req.open("GET", url);
      req.onreadystatechange = function (e) {
        if (req.status==200&&req.readyState==4) {
            accept(req.response);
        }
        else 
          if (req.status>=400) {
            reject(req.status, req.statusText);
        }
      }
      req.send();
    });
  }
  fetch_file = _es6_module.add_export('fetch_file', fetch_file);
  function _int32(x) {
    return ~~(((1<<30)-1)&(~~x));
  }
  class MersenneRandom  {
     constructor(seed) {
      this.index = 624;
      this.mt = new Uint32Array(624);
      this.seed(seed);
    }
     random() {
      return this.extract_number()/(1<<30);
    }
     nrandom(n=3) {
      let ret=0.0;
      for (let i=0; i<n; i++) {
          ret+=this.random();
      }
      return ret/n;
    }
     seed(seed) {
      seed = ~~(seed*8192);
      this.index = 624;
      this.mt.fill(0, 0, this.mt.length);
      this.mt[0] = seed;
      for (var i=1; i<624; i++) {
          this.mt[i] = _int32(1812433253*(this.mt[i-1]^this.mt[i-1]>>30)+i);
      }
    }
     extract_number() {
      if (this.index>=624)
        this.twist();
      var y=this.mt[this.index];
      y = y^y>>11;
      y = y^y<<7&2636928640;
      y = y^y<<15&4022730752;
      y = y^y>>18;
      this.index = this.index+1;
      return _int32(y);
    }
     twist() {
      for (var i=0; i<624; i++) {
          var y=_int32((this.mt[i]&0x80000000)+(this.mt[(i+1)%624]&0x7fffffff));
          this.mt[i] = this.mt[(i+397)%624]^y>>1;
          if (y%2!=0)
            this.mt[i] = this.mt[i]^0x9908b0df;
      }
      this.index = 0;
    }
  }
  _ESClass.register(MersenneRandom);
  _es6_module.add_class(MersenneRandom);
  MersenneRandom = _es6_module.add_export('MersenneRandom', MersenneRandom);
  var _mt=new MersenneRandom(0);
  function random() {
    return _mt.extract_number()/(1<<30);
  }
  random = _es6_module.add_export('random', random);
  function seed(n) {
    _mt.seed(n);
  }
  seed = _es6_module.add_export('seed', seed);
  let smallstr_hashes={}
  function strhash(str) {
    if (str.length<=64) {
        let hash=smallstr_hashes[str];
        if (hash!==undefined) {
            return hash;
        }
    }
    var hash=0;
    for (var i=0; i<str.length; i++) {
        var ch=str.charCodeAt(i);
        hash = hash<0 ? -hash : hash;
        hash^=(ch*524287+4323543)&((1<<19)-1);
    }
    if (str.length<=64) {
        smallstr_hashes[str] = hash;
    }
    return hash;
  }
  strhash = _es6_module.add_export('strhash', strhash);
  var hashsizes=[223, 383, 653, 1117, 1901, 3251, 5527, 9397, 15991, 27191, 46229, 78593, 133631, 227177, 38619, 656587, 1116209, 1897561, 3225883, 5484019, 9322861, 15848867, 26943089, 45803279, 77865577, 132371489, 225031553];
  var FTAKEN=0, FKEY=1, FVAL=2, FTOT=3;
  class FastHash extends Array {
     constructor() {
      super();
      this.cursize = 0;
      this.size = hashsizes[this.cursize];
      this.used = 0;
      this.length = this.size*FTOT;
      this.fill(0, 0, this.length);
    }
     resize(size) {
      var table=this.slice(0, this.length);
      this.length = size*FTOT;
      this.size = size;
      this.fill(0, 0, this.length);
      for (var i=0; i<table.length; i+=FTOT) {
          if (!table[i+FTAKEN])
            continue;
          var key=table[i+FKEY], val=table[i+FVAL];
          this.set(key, val);
      }
      return this;
    }
     get(key) {
      var hash=typeof key=="string" ? strhash(key) : key;
      hash = typeof hash=="object" ? hash.valueOf() : hash;
      var probe=0;
      var h=(hash+probe)%this.size;
      var _i=0;
      while (_i++<50000&&this[h*FTOT+FTAKEN]) {
        if (this[h*FTOT+FKEY]==key) {
            return this[h*FTOT+FVAL];
        }
        probe = (probe+1)*2;
        h = (hash+probe)%this.size;
      }
      return undefined;
    }
     has(key) {
      var hash=typeof key=="string" ? strhash(key) : key;
      hash = typeof hash=="object" ? hash.valueOf() : hash;
      var probe=0;
      var h=(hash+probe)%this.size;
      var _i=0;
      while (_i++<50000&&this[h*FTOT+FTAKEN]) {
        if (this[h*FTOT+FKEY]==key) {
            return true;
        }
        probe = (probe+1)*2;
        h = (hash+probe)%this.size;
      }
      return false;
    }
     set(key, val) {
      var hash=typeof key=="string" ? strhash(key) : key;
      hash = typeof hash=="object" ? hash.valueOf() : hash;
      if (this.used>this.size/3) {
          this.resize(hashsizes[this.cursize++]);
      }
      var probe=0;
      var h=(hash+probe)%this.size;
      var _i=0;
      while (_i++<50000&&this[h*FTOT+FTAKEN]) {
        if (this[h*FTOT+FKEY]==key) {
            this[h*FTOT+FVAL] = val;
            return ;
        }
        probe = (probe+1)*2;
        h = (hash+probe)%this.size;
      }
      this[h*FTOT+FTAKEN] = 1;
      this[h*FTOT+FKEY] = key;
      this[h*FTOT+FVAL] = val;
      this.used++;
    }
  }
  _ESClass.register(FastHash);
  _es6_module.add_class(FastHash);
  FastHash = _es6_module.add_export('FastHash', FastHash);
  function test_fasthash() {
    var h=new FastHash();
    console.log("bleh hash:", strhash("bleh"));
    h.set("bleh", 1);
    h.set("bleh", 2);
    h.set("bleh", 3);
    console.log(h);
    return h;
  }
  test_fasthash = _es6_module.add_export('test_fasthash', test_fasthash);
  
  class ImageReader  {
     load_image() {
      let input=document.createElement("input");
      input.type = "file";
      let doaccept;
      let promise=new Promise((accept, reject) =>        {
        doaccept = accept;
      });
      input.addEventListener("change", function (e) {
        let files=this.files;
        console.log("got file", e, files);
        if (files.length==0)
          return ;
        var reader=new FileReader();
        var this2=this;
        reader.onload = (e) =>          {
          let data=e.target.result;
          let image=new Image();
          image.src = data;
          image.onload = (e) =>            {
            console.log("got image", image.width, image.height);
            let canvas=document.createElement("canvas");
            let g=canvas.getContext("2d");
            canvas.width = image.width;
            canvas.height = image.height;
            g.drawImage(image, 0, 0);
            let idata=g.getImageData(0, 0, image.width, image.height);
            doaccept(idata);
          }
        }
        reader.readAsDataURL(files[0]);
      });
      input.click();
      return promise;
    }
     example() {
      this.load_image().then((idata) =>        {
        console.log(idata);
      });
    }
  }
  _ESClass.register(ImageReader);
  _es6_module.add_class(ImageReader);
  ImageReader = _es6_module.add_export('ImageReader', ImageReader);
  
  let digestcache;
  class HashDigest  {
     constructor() {
      this.i = 0;
      this.hash = 0;
    }
    static  cachedDigest() {
      return digestcache.next().reset();
    }
     reset() {
      this.i = 0;
      this.hash = 0;
      return this;
    }
     get() {
      return this.hash;
    }
     add(v) {
      if (typeof v==="string") {
          v = strhash(v);
      }
      if (typeof v==="object"&&Array.isArray(v)) {
          for (let i=0; i<v.length; i++) {
              this.add(v[i]);
          }
          return this;
      }
      if (v>=-5&&v<=5) {
          v*=32;
      }
      let f=Math.fract(v)*(1024*512);
      f = (~~f)/(1024*512);
      v = Math.floor(v)+f;
      this.i = ((this.i+(~~v))*1103515245+12345)&((1<<29)-1);
      let v2=(v*1024*1024)&((1<<29)-1);
      v = v|v2;
      v = ~~v;
      this.hash^=v^this.i;
      return this;
    }
  }
  _ESClass.register(HashDigest);
  _es6_module.add_class(HashDigest);
  HashDigest = _es6_module.add_export('HashDigest', HashDigest);
  window._test_hash2 = () =>    {
    let h=new HashDigest();
    let tests=[[0, 0, 0, 0], [0, 0, 0], [0, 0], [0], [1], [2], [3], [strhash("yay")], [strhash("yay"), strhash("yay")], [strhash("yay"), strhash("yay"), strhash("yay")]];
    for (let test of tests) {
        let h=new HashDigest();
        for (let f of test) {
            h.add(f);
        }
        window.console.log(h.get());
    }
    for (let i=0; i<50; i++) {
        h.add(0);
    }
  }
  digestcache = cachering.fromConstructor(HashDigest, 512);
  function hashjoin(hash, val) {
    let sum=0;
    let mul=(1<<19)-1, off=(1<<27)-1;
    let i=0;
    h = (h*mul+off+i*mul*0.25)&mul;
  }
  hashjoin = _es6_module.add_export('hashjoin', hashjoin);
  let NullItem={}
  class MapIter  {
     constructor(ownermap) {
      this.ret = {done: true, 
     value: undefined};
      this.value = new Array(2);
      this.i = 0;
      this.map = ownermap;
      this.done = true;
    }
     finish() {
      if (!this.done) {
          this.done = true;
          this.map.itercur--;
      }
    }
     next() {
      let ret=this.ret;
      let i=this.i;
      let map=this.map, list=map._list;
      while (i<list.length&&list[i]===NullItem) {
        i+=2;
      }
      if (i>=list.length) {
          ret.done = true;
          ret.value = undefined;
          this.finish();
          return ret;
      }
      this.i = i+2;
      ret.value = this.value;
      ret.value[0] = list[i];
      ret.value[1] = list[i+1];
      ret.done = false;
      return ret;
    }
     return() {
      this.finish();
      return this.ret;
    }
     reset() {
      this.i = 0;
      this.value[0] = undefined;
      this.value[1] = undefined;
      this.done = false;
      return this;
    }
  }
  _ESClass.register(MapIter);
  _es6_module.add_class(MapIter);
  MapIter = _es6_module.add_export('MapIter', MapIter);
  class map  {
     constructor() {
      this._items = {};
      this._list = [];
      this.size = 0;
      this.iterstack = new Array(8);
      this.itercur = 0;
      for (let i=0; i<this.iterstack.length; i++) {
          this.iterstack[i] = new MapIter(this);
      }
      this.freelist = [];
    }
     has(key) {
      return key[Symbol.keystr]() in this._items;
    }
     set(key, v) {
      let k=key[Symbol.keystr]();
      let i=this._items[k];
      if (i===undefined) {
          if (this.freelist.length>0) {
              i = this.freelist.pop();
          }
          else {
            i = this._list.length;
            this._list.length+=2;
          }
          this.size++;
      }
      this._list[i] = key;
      this._list[i+1] = v;
      this._items[k] = i;
    }
     keys() {
      let this2=this;
      return (function* () {
        for (let /*unprocessed ExpandNode*/[key, val] of this2) {
            yield key;
        }
      })();
    }
     values() {
      let this2=this;
      return (function* () {
        for (let /*unprocessed ExpandNode*/[key, val] of this2) {
            yield val;
        }
      })();
    }
     get(k) {
      k = k[Symbol.keystr]();
      let i=this._items[k];
      if (i!==undefined) {
          return this._list[i+1];
      }
    }
     delete(k) {
      k = k[Symbol.keystr]();
      if (!(k in this._items)) {
          return false;
      }
      let i=this._items[k];
      this.freelist.push(i);
      this._list[i] = NullItem;
      this._list[i+1] = NullItem;
      delete this._items[k];
      this.size--;
      return true;
    }
     [Symbol.iterator]() {
      let ret=this.iterstack[this.itercur].reset();
      this.itercur++;
      if (this.itercur===this.iterstack.length) {
          this.iterstack.push(new MapIter(this));
      }
      return ret;
    }
  }
  _ESClass.register(map);
  _es6_module.add_class(map);
  map = _es6_module.add_export('map', map);
  globalThis._test_map = function () {
    let m=new map();
    m.set("1", 2);
    m.set(11, 3);
    m.set("5", 4);
    m.set("3", 5);
    m.set("3", 6);
    m.delete("3");
    for (let /*unprocessed ExpandNode*/[key, item] of m) {
        for (let /*unprocessed ExpandNode*/[key2, item2] of m) {
            window.console.log(key, item, key2, item2);
        }
        break;
    }
    console.log("itercur", m.itercur);
    return m;
  }
  function validateId(id) {
    let bad=typeof id!=="number";
    bad = bad||id!==~~id;
    bad = bad||isNaN(id);
    if (bad) {
        throw new Error("bad number "+id);
    }
    return bad;
  }
  let UndefinedTag={}
  class IDMap extends Array {
     constructor() {
      super();
      this._keys = new Set();
      this.size = 0;
    }
     has(id) {
      validateId(id);
      if (id<0||id>=this.length) {
          return false;
      }
      return this[id]!==undefined;
    }
     set(id, val) {
      validateId(id);
      if (id<0) {
          console.warn("got -1 id in IDMap");
          return ;
      }
      if (id>=this.length) {
          this.length = id+1;
      }
      if (val===undefined) {
          val = UndefinedTag;
      }
      let ret=false;
      if (this[id]===undefined) {
          this.size++;
          this._keys.add(id);
          ret = true;
      }
      this[id] = val;
      return ret;
    }
     get(id) {
      validateId(id);
      if (id===-1) {
          return undefined;
      }
      else 
        if (id<0) {
          console.warn("id was negative");
          return undefined;
      }
      let ret=id<this.length ? this[id] : undefined;
      ret = ret===UndefinedTag ? undefined : ret;
      return ret;
    }
     delete(id) {
      if (!this.has(id)) {
          return false;
      }
      this._keys.remove(id);
      this[id] = undefined;
      this.size--;
      return true;
    }
     keys() {
      let this2=this;
      return (function* () {
        for (let id of this2._keys) {
            yield id;
        }
      })();
    }
     values() {
      let this2=this;
      return (function* () {
        for (let id of this2._keys) {
            yield this2[id];
        }
      })();
    }
     [Symbol.iterator]() {
      let this2=this;
      let iteritem=[0, 0];
      return (function* () {
        for (let id of this2._keys) {
            iteritem[0] = id;
            iteritem[1] = this2[id];
            if (iteritem[1]===UndefinedTag) {
                iteritem[1] = undefined;
            }
            yield iteritem;
        }
      })();
    }
  }
  _ESClass.register(IDMap);
  _es6_module.add_class(IDMap);
  IDMap = _es6_module.add_export('IDMap', IDMap);
  globalThis._test_idmap = function () {
    let map=new IDMap();
    for (let i=0; i<5; i++) {
        let id=~~(Math.random()*55);
        map.set(id, "yay"+i);
    }
    for (let /*unprocessed ExpandNode*/[key, val] of map) {
        window.console.log(key, val, map.has(key), map.get(key));
    }
    return map;
  }
  let HW=0, HELEM=1, HTOT=2;
  function heaplog() {
  }
  class MinHeapQueue  {
     constructor(iter, iterw=iter) {
      this.heap = [];
      this.freelist = [];
      this.length = 0;
      this.end = 0;
      if (iter) {
          let witer=iterw[Symbol.iterator]();
          for (let item of iter) {
              let w=witer.next().value;
              this.push(item, w);
          }
      }
    }
     push(e, w) {
      if (typeof w!=="number") {
          throw new Error("w must be a number");
      }
      if (isNaN(w)) {
          throw new Error("NaN");
      }
      this.length++;
      let depth=Math.ceil(Math.log(this.length)/Math.log(2.0));
      let tot=Math.pow(2, depth)+1;
      heaplog(depth, tot);
      if (this.heap.length<tot*HTOT) {
          let start=this.heap.length/HTOT;
          for (let i=start; i<tot; i++) {
              this.freelist.push(i*HTOT);
          }
      }
      let heap=this.heap;
      heap.length = tot*HTOT;
      let n=this.freelist.pop();
      heaplog("freelist", this.freelist);
      this.end = Math.max(this.end, n);
      heap[n] = w;
      heap[n+1] = e;
      while (n>0) {
        n/=HTOT;
        let p=(n-1)>>1;
        n*=HTOT;
        p*=HTOT;
        if (heap[p]===undefined||heap[p]>w) {
            if (n===this.end) {
                this.end = p;
            }
            heap[n] = heap[p];
            heap[n+1] = heap[p+1];
            heap[p] = w;
            heap[p+1] = e;
            n = p;
        }
        else {
          break;
        }
      }
    }
     pop() {
      if (this.length===0) {
          return undefined;
      }
      let heap=this.heap;
      if (this.end===0) {
          let ret=heap[1];
          this.freelist.push(0);
          heap[0] = undefined;
          this.length = 0;
          return ret;
      }
      let ret=heap[1];
      let end=this.end;
      function swap(n1, n2) {
        let t=heap[n1];
        heap[n1] = heap[n2];
        heap[n2] = t;
        t = heap[n1+1];
        heap[n1+1] = heap[n2+1];
        heap[n2+1] = t;
      }
      heaplog("end", end);
      heaplog(heap.concat([]));
      heap[0] = heap[end];
      heap[1] = heap[end+1];
      heap[end] = undefined;
      heap[end+1] = undefined;
      let n=0;
      while (n<heap.length) {
        n/=HTOT;
        let n1=n*2+1;
        let n2=n*2+2;
        n1 = ~~(n1*HTOT);
        n2 = ~~(n2*HTOT);
        n = ~~(n*HTOT);
        heaplog("  ", heap[n], heap[n1], heap[n2]);
        if (heap[n1]!==undefined&&heap[n2]!==undefined) {
            if (heap[n1]>heap[n2]) {
                let t=n1;
                n1 = n2;
                n2 = t;
            }
            if (heap[n]>heap[n1]) {
                swap(n, n1);
                n = n1;
            }
            else 
              if (heap[n]>heap[n2]) {
                swap(n, n2);
                n = n2;
            }
            else {
              break;
            }
        }
        else 
          if (heap[n1]!==undefined) {
            if (heap[n]>heap[n1]) {
                swap(n, n1);
                n = n1;
            }
            else {
              break;
            }
        }
        else 
          if (heap[n2]!==undefined) {
            if (heap[n]>heap[n2]) {
                swap(n, n2);
                n = n2;
            }
            else {
              break;
            }
        }
        else {
          break;
        }
      }
      this.freelist.push(this.end);
      heap[this.end] = undefined;
      heap[this.end+1] = undefined;
      while (this.end>0&&heap[this.end]===undefined) {
        this.end-=HTOT;
      }
      this.length--;
      return ret;
    }
  }
  _ESClass.register(MinHeapQueue);
  _es6_module.add_class(MinHeapQueue);
  MinHeapQueue = _es6_module.add_export('MinHeapQueue', MinHeapQueue);
  globalThis.testHeapQueue = function (list1) {
    if (list1===undefined) {
        list1 = [1, 8, -3, 11, 33];
    }
    let h=new MinHeapQueue(list1);
    window.console.log(h.heap.concat([]));
    let list=[];
    let len=h.length;
    for (let i=0; i<len; i++) {
        list.push(h.pop());
    }
    window.console.log(h.heap.concat([]));
    return list;
  }
  class Queue  {
     constructor(n=32) {
      n = Math.max(n, 8);
      this.initialSize = n;
      this.queue = new Array(n);
      this.a = 0;
      this.b = 0;
      this.length = 0;
    }
     enqueue(item) {
      let qlen=this.queue.length;
      let b=this.b;
      this.queue[b] = item;
      this.b = (this.b+1)%qlen;
      if (this.length>=qlen||this.a===this.b) {
          let newsize=qlen<<1;
          let queue=new Array(newsize);
          for (let i=0; i<qlen; i++) {
              let i2=(i+this.a)%qlen;
              queue[i] = this.queue[i2];
          }
          this.a = 0;
          this.b = qlen;
          this.queue = queue;
      }
      this.length++;
    }
     clear(clearData=true) {
      this.queue.length = this.initialSize;
      if (clearData) {
          for (let i=0; i<this.queue.length; i++) {
              this.queue[i] = undefined;
          }
      }
      this.a = this.b = 0;
      this.length = 0;
      return this;
    }
     dequeue() {
      if (this.length===0) {
          return undefined;
      }
      this.length--;
      let ret=this.queue[this.a];
      this.queue[this.a] = undefined;
      this.a = (this.a+1)%this.queue.length;
      return ret;
    }
  }
  _ESClass.register(Queue);
  _es6_module.add_class(Queue);
  Queue = _es6_module.add_export('Queue', Queue);
  globalThis._testQueue = function (steps, samples) {
    if (steps===undefined) {
        steps = 15;
    }
    if (samples===undefined) {
        samples = 15;
    }
    let queue=new Queue(3);
    for (let i=0; i<steps; i++) {
        let list=[];
        for (let j=0; j<samples; j++) {
            let item={f: Math.random()};
            list.push(item);
            queue.enqueue(item);
        }
        let j=0;
        while (queue.length>0) {
          let item=queue.dequeue();
          if (item!==list[j]) {
              console.log(item, list);
              throw new Error("got wrong item", item);
          }
          j++;
          if (j>10000) {
              console.error("Infinite loop error");
              break;
          }
        }
    }
  }
  class ArrayPool  {
     constructor() {
      this.pools = new Map();
      this.map = new Array(1024);
    }
     get(n, clear) {
      let pool;
      if (n<1024) {
          pool = this.map[n];
      }
      else {
        pool = this.pools.get(n);
      }
      if (!pool) {
          let tot;
          if (n>512) {
              tot = 32;
          }
          else 
            if (n>256) {
              tot = 64;
          }
          else 
            if (n>128) {
              tot = 256;
          }
          else 
            if (n>64) {
              tot = 512;
          }
          else {
            tot = 1024;
          }
          pool = new cachering(() =>            {
            return new Array(n);
          }, tot);
          if (n<1024) {
              this.map[n] = pool;
          }
          this.pools.set(n, pool);
          return this.get(n, clear);
      }
      let ret=pool.next();
      if (ret.length!==n) {
          console.warn("Array length was set", n, ret);
          ret.length = n;
      }
      if (clear) {
          for (let i=0; i<n; i++) {
              ret[i] = undefined;
          }
      }
      return ret;
    }
  }
  _ESClass.register(ArrayPool);
  _es6_module.add_class(ArrayPool);
  ArrayPool = _es6_module.add_export('ArrayPool', ArrayPool);
  class DivLogger  {
     constructor(elemId, maxLines=16) {
      this.elemId = elemId;
      this.elem = undefined;
      this.lines = new Array();
      this.maxLines = maxLines;
    }
     push(line) {
      if (this.lines.length>this.maxLines) {
          this.lines.shift();
          this.lines.push(line);
      }
      else {
        this.lines.push(line);
      }
      this.update();
    }
     update() {
      let buf=this.lines.join(`<br>`);
      buf = buf.replace(/[ \t]/g, "&nbsp;");
      if (!this.elem) {
          this.elem = document.getElementById(this.elemId);
      }
      this.elem.innerHTML = buf;
    }
     toString(obj, depth=0) {
      let s='';
      let tab='';
      for (let i=0; i<depth; i++) {
          tab+='$TAB';
      }
      if (typeof obj==="symbol") {
          return `[${obj.description}]`;
      }
      const DEPTH_LIMIT=1;
      const CHAR_LIMIT=100;
      if (typeof obj==="object"&&Array.isArray(obj)) {
          s = "[$NL";
          for (let i=0; i<obj.length; i++) {
              let v=obj[i];
              if (depth>=DEPTH_LIMIT) {
                  v = typeof v;
              }
              else {
                v = this.toString(v, depth+1);
              }
              s+=tab+"$TAB";
              s+=v+(i!==obj.length-1 ? "," : "")+"$NL";
          }
          let keys=Reflect.ownKeys(obj);
          for (let i=0; i<keys.length; i++) {
              let k=keys[i];
              let n;
              let k2=this.toString(k);
              if (typeof k!=="symbol"&&!isNaN(n = parseInt(k))) {
                  if (n>=0&&n<obj.length) {
                      continue;
                  }
              }
              let v;
              try {
                v = obj[k];
              }
              catch (error) {
                  v = "(error)";
              }
              s+=tab+`$TAB${k2} : ${v}`;
              if (i<keys.length-1) {
                  s+=",";
              }
              if (!s.endsWith("$NL")&&!s.endsWith("\n")) {
                  s+="$NL";
              }
          }
          s+="$TAB]$NL";
          if (s.length<CHAR_LIMIT) {
              s = s.replace(/\$NL/g, "");
              s = s.replace(/(\$TAB)+/g, " ");
          }
          else {
            s = s.replace(/\$NL/g, "\n");
            s = s.replace(/\$TAB/g, "  ");
          }
      }
      else 
        if (typeof obj==="object") {
          s = '{$NL';
          let keys=Reflect.ownKeys(obj);
          for (let i=0; i<keys.length; i++) {
              let k=keys[i];
              let k2=this.toString(k);
              let v;
              try {
                v = obj[k];
              }
              catch (error) {
                  v = '(error)';
              }
              if (depth>=DEPTH_LIMIT) {
                  v = typeof v;
              }
              else {
                v = this.toString(v, depth+1);
              }
              s+=tab+`$TAB${k2} : ${v}`;
              if (i<keys.length-1) {
                  s+=",";
              }
              if (!s.endsWith("$NL")&&!s.endsWith("\n")) {
                  s+="$NL";
              }
          }
          s+=tab+"}$NL";
          if (s.length<CHAR_LIMIT) {
              s = s.replace(/\$NL/g, "");
              s = s.replace(/(\$TAB)+/g, " ");
          }
          else {
            s = s.replace(/\$NL/g, "\n");
            s = s.replace(/\$TAB/g, "  ");
          }
      }
      else 
        if (typeof obj==="undefined") {
          s = 'undefined';
      }
      else 
        if (typeof obj==="function") {
          s = 'function '+obj.name;
      }
      else {
        s = ""+obj;
      }
      return s;
    }
  }
  _ESClass.register(DivLogger);
  _es6_module.add_class(DivLogger);
  DivLogger = _es6_module.add_export('DivLogger', DivLogger);
  const PendingTimeoutPromises=new Set();
  _es6_module.add_export('PendingTimeoutPromises', PendingTimeoutPromises);
  class TimeoutPromise  {
     constructor(callback, timeout=3000, silent=false) {
      if (!callback) {
          return ;
      }
      this.silent = silent;
      this.timeout = timeout;
      let accept2=this._accept2.bind(this);
      let reject2=this._reject2.bind(this);
      this.time = time_ms();
      this.rejected = false;
      this._promise = new Promise((accept, reject) =>        {
        this._accept = accept;
        this._reject = reject;
        callback(accept2, reject2);
      });
      PendingTimeoutPromises.add(this);
    }
     _accept2(val) {
      if (this.bad) {
          if (!this.silent) {
              this._reject(new Error("Timeout"));
          }
      }
      else {
        return this._accept(val);
      }
    }
    static  wrapPromise(promise, timeout=3000, callback) {
      let p=new TimeoutPromise();
      p._promise = promise;
      p._accept = callback;
      p._reject = function (error) {
        throw error;
      };
      p.then((val) =>        {
        p._accept2(val);
      }).catch((error) =>        {
        p._reject2(error);
      });
      return p;
    }
     _reject2(error) {
      this._reject(error);
    }
     then(callback) {
      let cb=(val) =>        {
        let ret=callback(val);
        if (__instance_of(ret, Promise)) {
            ret = TimeoutPromise.wrapPromise(ret, this.timeout, callback);
        }
        return ret;
      };
      this._promise.then(cb);
      return this;
    }
     catch(callback) {
      this._promise.catch(callback);
      return this;
    }
     finally(callback) {
      this._promise.catch(callback);
      return this;
    }
    get  bad() {
      return time_ms()-this.time>this.timeout;
    }
  }
  _ESClass.register(TimeoutPromise);
  _es6_module.add_class(TimeoutPromise);
  TimeoutPromise = _es6_module.add_export('TimeoutPromise', TimeoutPromise);
  window.setInterval(() =>    {
    let bad=[];
    for (let promise of PendingTimeoutPromises) {
        if (promise.bad) {
            bad.push(promise);
        }
    }
    for (let promise of bad) {
        PendingTimeoutPromises.delete(promise);
    }
    for (let promise of bad) {
        try {
          promise._reject(new Error("Timeout"));
        }
        catch (error) {
            print_stack(error);
        }
    }
  }, 250);
  var lzstring=es6_import_item(_es6_module, '../extern/lz-string/lz-string.js', 'default');
  function compress(data) {
    return lzstring.compressToUint8Array(data);
  }
  compress = _es6_module.add_export('compress', compress);
  function decompress(data) {
    if (__instance_of(data, DataView)) {
        data = data.buffer;
    }
    if (__instance_of(data, ArrayBuffer)) {
        data = new Uint8Array(data);
    }
    return lzstring.decompressFromUint8Array(data);
  }
  decompress = _es6_module.add_export('decompress', decompress);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/util.js');

es6_module_define('util', ["../path-controller/util/util.js"], function _util_module(_es6_module) {
  var ____path_controller_util_util_js=es6_import(_es6_module, '../path-controller/util/util.js');
  for (let k in ____path_controller_util_util_js) {
      _es6_module.add_export(k, ____path_controller_util_util_js[k], true);
  }
}, '/dev/fairmotion/src/path.ux/scripts/util/util.js');


    var totfile=12, fname="app";
    for (var i=0; i<totfile; i++) {
      var path = "./fcontent/"+fname+i+".js";
      var node = document.createElement("script")
      node.src = path
      node.async = false

      document.head.appendChild(node);
    }
  