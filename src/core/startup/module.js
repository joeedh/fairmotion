"not_a_module";
"no_type_logging";


//this file is loaded before the type system.
//as such, cannot use ES6 class syntax

let handler = {
  getProperty(target, key, r) {
    if (key === "count") {
      throw new Error("what?")
    }
    return target[key];
  },

  setProperty(target, key, val, r) {
    if (key === "count") {
      throw new Error("what?")
    }

    target[key] = val;
  }
}
var _defined_modules = {} //new Proxy({}, handler);

let _curpath_stack = [];
var allow_cycles = true;
var _rootpath_src = "";

var _is_cyclic = false;
var _post_primary_load = false;
var _es6_module_resort = false;
var _es6_module_verbose = 0;
var _debug_modules = 0;

function debug() {
  if (!_debug_modules)
    return;
  
  var s = "console.log";
  console.warn.apply(console, arguments);
}

function ES6Module(name, path) {
  this.name = name;
  this.path = path;
  
  this.links = []; //modules that depend on this module, use only for debugging purposes
  this.depends = []; //modules this module depend on
  
  this.flag = 0;
  this.loaded = false;
  
  this.callback = undefined;
  
  this.exports = {};
  this.global_exports = {};
  
  this.already_processed = {};
  this.classes = [];
};

ES6Module.prototype = {
  add_class  : function(cls) {
    this.classes.push(cls);
  },
  
  add_export : function(name, object, allow_override=false) {
    if (object != undefined)
      this.already_processed[name] = object;
    
    if (!allow_override && name in this.exports && this.exports[name] != undefined) {
      return this.exports[name];
    }
    
    this.exports[name] = object;
    
    /* outdated
    
    //stupid.  during refactoring, anything without an export tag
    //is auto-inserted into the global namespace.
    //we have to double-check this here.
    
    if (name in this.global_exports) {
      //debug("  ignoring auto-global for ", name);
      delete this.global_exports[name];
    }*/
    
    return object;
  },
  
  add_global : function(name, object) {
    if (object != undefined)
      this.already_processed[name] = object;
    
    if (name in this.exports) {
      //debug("  ignoring auto-global for ", name);
      return;
    }
    
    //if (!(name in this.exports))
    //  this.add_export(name, object);
      
    this.global_exports[name] = object;
    return object;
  },
  
  add_depend : function(module) {
    if (typeof module != "string" && !(module instanceof String)) {
      throw new Error("ES6Module.add_depend: Expected a string");
    }
    
    _es6_push_basepath(this.path);
    this.depends.push(es6_get_module_meta(module));
    _es6_pop_basepath();
  },
  
  set_default_export : function(name, object) {
    if (this.default_export != undefined) {
      throw new Error("Can only have one default export");
    }
    
    this.exports["default"] = object;
    this.default_export = object;
    
    if (name != undefined && name != '') {
      return this.add_export(name, object);
    }
    
    return object;
  }
};

function _es6_get_basename(path) {
  if (!(path.endsWith(".js"))) {
    path += ".js";
  }
  
  let name = path.split("/");
  name = name[name.length-1];
  name = name.slice(0, name.length-3);
  
  return name;
}

function es6_get_module_meta(path, compatibility_mode=false) {
  path = path.replace(/\\/g, "/");
  
  //extjs originally just looked up modules by their
  //filenames (minus .js), detect if this is happening

  if (!compatibility_mode && !path.startsWith("\.") && path.search("/") < 0) {
    throw new Error("Bad import string: " + path);
  }

  if (compatibility_mode) {
    let name = path;
    
    //first look for module in same directory. . .
    if (!path.toLowerCase().endsWith(".js")) {
      path += ".js";
    }
    
    path = _normpath("./" + path, _es6_get_basepath());
    
    //ok we didn't find it; now search all defined modules. . .
    if (!(path in _defined_modules)) {
      //search modules by name
      for (let k in _defined_modules) {
        let mod = _defined_modules[k];
        
        if (mod.name == name) {
          return mod;
        }
      }
      
      console.warn("Unknown module", name, "hackishly patching. . .");
      throw new Error("");
      
      let mod = new ES6Module(name, name);
      mod._bad_path = true;
      
      _defined_modules[name] = mod;
      return mod;
    } else {
      return _defined_modules[path];
    }
  }
  
  if (!path.endsWith(".js")) {
    path += ".js";
  }

  path = _normpath(path, _es6_get_basepath());
  path = _normpath1(path);
  
  if (!(path in _defined_modules)) {
    let name = _es6_get_basename(path);
    
    let mod = new ES6Module(name, path);
    _defined_modules[path] = mod;
  }
  
  return _defined_modules[path];
}

function _es6_get_basepath() {
  if (_curpath_stack.length > 0)
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
  path = path === undefined ? name : path;
  
  debug("defining module ", name, "with dependencies", JSON.stringify(depends));
  
  //if (name in _defined_modules) {
    //throw new Error("Duplicate module name '" + name + "'");
  //  console.log("Warning, duplicate module name \""+name+"\",", " make sure to use path in import statements");
  //}
  
  let mod;
  
  path = _normpath(path, _es6_get_basepath());
  
  if (!(path in _defined_modules)) {
    mod = new ES6Module(name, path);
    _defined_modules[path] = mod;
  } else {
    mod = _defined_modules[path];
  }
  
  mod.callback = callback;
  
  depends.forEach(function(d) {
    mod.depends.push(d);
  });
  
  return mod;
}

function sort_modules() {
  var sortlist = [];
  
  for (var k in _defined_modules) {
    var mod = _defined_modules[k];
    
    if (mod.callback === undefined) {
      debug('module "' + mod.path + '" does not exist', mod);
      throw new Error('module "' + mod.path + '" does not exist');
    }
    mod.flag = 0;
  }
  
  var localvisit = {};
  function sort(mod, path) {
    //copy path
    var p2 = [];
    for (var i=0; i<path.length; i++) {
      p2.push(path[i]);
    }
    path = p2;
    
    path.push(mod.path);
    
    if (path.length > 1) {
      debug(path);
    }
    
    if (mod.path in localvisit) { //mod.flag > 1) {
      _is_cyclic = true;

      debug("Cycle!", path);
      if (!allow_cycles) {
        throw new Error("module cycle! " + JSON.stringify(path));
      }
      return;
    }
    
    localvisit[mod.path] = 1;
    
    for (var i=0; i<mod.depends.length; i++) {
      var p = mod.depends[i];
      if (!p.flag) {
        sort(p, path);
      }
    }
    
    mod.flag++;
    sortlist.push(mod);
  }
  
  for (var k in _defined_modules) {
    var mod = _defined_modules[k];
    
    localvisit = {};
    if (!mod.flag)
      sort(mod, []);
  }
  
  var namelist = [];
  for (var i=0; i<sortlist.length; i++) {
    namelist.push(sortlist[i].name);
  }
  window.module_order = namelist;
  
  //console.log(JSON.stringify(namelist).replace(/"/g, "").replace(/'/g, ""));
  //throw new Error();
  
  return sortlist;
}

function _load_module_cyclic(mod, visitmap, modstack) {
  window.es6_import = function es6_import(_es6_module, name) {
    var mod = _es6_get_module(name);

    if (mod !== undefined) {
      mod.links.push(_es6_module);
    }

    //add to active module's dependencies, if necassary
    if (mod !== undefined && _es6_module.depends.indexOf(mod) < 0) {
      debug("updating dependencies");
      _es6_module_resort = true;
      _es6_module.depends.push(mod);
    }

    if (mod === undefined) {
      if (_debug_modules) console.log("cannot import module", name, mod);
      throw new ModuleLoadError("Cannot import module " + name);
    }

    if (!mod.loaded) {
      _load_module_cyclic(mod, visitmap, modstack);
    }

    return mod.default_export !== undefined ? mod.default_export : mod.exports;
  }

  window.es6_import_item = function es6_import_item(_es6_module, modname, name) {
    var mod = _es6_get_module(modname);

    if (mod !== undefined) {
      mod.links.push(_es6_module);
    }

    //add to active module's dependencies, if necassary
    if (mod !== undefined && _es6_module.depends.indexOf(mod) < 0) {
      debug("updating dependencies");

      _es6_module_resort = true;
      _es6_module.depends.push(mod);
    }

    if (!mod.loaded) {
      _load_module_cyclic(mod, visitmap, modstack);
    }

    if (!(name in mod.exports)) {
      if (1||_debug_modules) console.log(_es6_module.name + ":", "name not in exports (module cycle?)", name, mod);
      let msg = _es6_module.name + ":" + "name not in exports: " + name + " is not in " + mod.path;
      msg += "\n  wanted by: '" + _es6_module.path + "'";
      throw new ModuleLoadError(msg);
    }

    return mod.exports[name];
  }

  if (!visitmap.has(mod)) {
    visitmap.set(mod, 0);
  } else if (visitmap.get(mod) > 15) {
    throw new ModuleLoadError("Failed to resolve module cycle");
  }

  visitmap.set(mod, visitmap.get(mod)+1);

  if (mod.loaded) {
    return;
  }

  let args = [mod];
  for (let dep of mod.depends) {
    args.push(dep.exports);
  }


  modstack.push(window.Module);
  modstack.push(window.exports);

  window.module = window.Module = mod;
  window.exports = mod.exports;

  mod.loaded = true;

  _es6_push_basepath(mod.path);
  if (mod.callback === undefined) {
    throw new Error("Unknown module " + mod.path, mod);
  } else {
    mod.callback.apply(this, args);
  }
  _es6_pop_basepath(mod.path);

  if (mod.exports !== window.exports) {
    //the setter we added in load_modules with Object.defineProperty
    //will copy keys and not assign the actual reference
    mod.exports = window.exports;
  }

  window.exports = modstack.pop();
  window.module = window.Module = modstack.pop();
}

function _load_module(mod) {
  var args = [mod];
  
  var start = time_ms();
  
  if (mod.loaded) return;
  
  debug("loading module", mod.name, mod);
  
  for (var i=0; i<mod.depends.length; i++) {
    args.push(mod.depends[i].exports);
  }
  
  if (_debug_modules) {
    var dependnames = [];
    
    for (let dep of mod.depends) {
      dependnames.push(dep.name);
    }
    
    if (dependnames.length != 0) {
      debug("  ", JSON.stringify(dependnames));
    }
  }
  
  if (mod.callback === undefined) {
    console.warn("WARNING: module", mod.name, "does not exist!");
    throw new Error("module \"" + mod.path + "\" does not exist");
    return;
  }

  let old = window.module;

  _es6_push_basepath(mod.path);

  mod.exports = {};
  //support code that sets module.exports
  window.module = {};
  window.exports = mod.exports;

  mod.callback.apply(this, args);

  if (!module) {
    console.warn("possible module error?");
  } else if (module.exports) {
    let keys = Object.keys(module);
    keys = keys.concat(Object.getOwnPropertySymbols(module));

    for (let k in keys) {
      mod.exports[k] = module.exports[k];
    }
  }

  window.module = old;
  _es6_pop_basepath();
  
  //debug("global exports", mod.global_exports);
  
  for (var k in mod.global_exports) {
    //debug("adding global", k);
    this[k] = mod.global_exports[k];
  }
  
  mod.loaded = true;
  var end = time_ms();
  
  if (end - start > 4) {
    //console.log("  ", Math.floor(end-start).toFixed(1) + "ms", mod.name);
  }
}

//stub out esclass.register
window._ESClass = {
  register : () => {}
};

class ModuleLoadError extends Error {

}

function _normpath1(path) {
  path = path.replace(/\\/g, "/").trim();
  
  while (path.startsWith("/")) {
    path = path.slice(1, path.length);
  }
  
  while (path.endsWith("/")) {
    path = path.slice(0, path.length-1);
  }
  
  return path;
}

function _normpath(path, basepath) {
  if (basepath.trim().length == 0)
    return _normpath1(path);
  
  path = _normpath1(path);
  basepath = _normpath1(basepath);
  
  if (path.startsWith(basepath)) {
    path = _normpath1(path.slice(basepath.length, path.length));
  }
  
  if (path[0] == "." && path[1] == "/") {
    path = path.slice(2, path.length);
  }
  
  let ps = path.split("/");
  let bs = basepath.split("/");
  
  let stack = bs.slice(0, bs.length-1);
  
  for (let i=0; i<ps.length; i++) {
    if (ps[i] == "..") {
      stack.pop();
    } else {
      stack.push(ps[i]);
    }
  }
  
  path = "";
  
  for (let c of stack) {
    if (c.trim().length == 0 || c.trim() == "/")
      continue;
    
    path = path + "/" + c
  }
  
  return path;
}

function _es6_get_module(name, compatibility_mode=false) {
  var mod = es6_get_module_meta(name, compatibility_mode);
  
  if (_post_primary_load) {
    if (mod.callback !== undefined && !mod.loaded) {
      //_load_module(mod);
    } else if (mod.callback === undefined) {
      if (_debug_modules) console.log("Module Load Error", mod, Object.keys(mod), mod.__proto__);
      throw new ModuleLoadError("Unknown module "+name);
    }
  }
  
  return mod;
}

function es6_import(_es6_module, name) {
  var mod = _es6_get_module(name);
  
  if (mod !== undefined) {
    mod.links.push(_es6_module);
  }
  
  //add to active module's dependencies, if necassary
  if (mod != undefined && _es6_module.depends.indexOf(mod) < 0) {
    debug("updating dependencies");
    _es6_module_resort = true;
    _es6_module.depends.push(mod);
  }
  
  if (mod === undefined || !mod.loaded) {
    if (_debug_modules) console.log("cannot import module", name, mod);
    throw new ModuleLoadError("Cannot import module " + name);
  }
  
  return mod.default_export !== undefined ? mod.default_export : mod.exports;
}

function es6_import_item(_es6_module, modname, name) {
  var mod = _es6_get_module(modname);
  
  if (mod !== undefined) {
    mod.links.push(_es6_module);
  }
  
  //add to active module's dependencies, if necassary
  if (mod !== undefined && _es6_module.depends.indexOf(mod) < 0) {
    debug("updating dependencies");
    
    _es6_module_resort = true;
    _es6_module.depends.push(mod);
  }
  
  if (!(name in mod.exports)) {
    if (1||_debug_modules) console.log(_es6_module.name + ":", "name not in exports", name, mod);
    throw new ModuleLoadError(_es6_module.name + ":" + "name not in exports: " + name + " is not in " + mod.path);
  }
  
  return mod.exports[name];
}

function reload_modules() {
  for (var k in _defined_modules) {
    var mod = _defined_modules[k];
    
    mod.loaded = false;
    mod.exports = {};
    mod.global_exports = {};
    mod.default_export = undefined;
  }
  
  load_modules();
}

function load_modules() {
  startup_report("Loading modules. . .");

  //find base path
  for (let k in _defined_modules) {
    let mod = _defined_modules[k];

    let i = mod.path.search(/src\/core/);

    if (i >= 0) {
      let path = mod.path.slice(0, i);
      _rootpath_src = path + "src";
    }
  }

  var start_time = time_ms();
  
  //link all module.depends
  for (let k in _defined_modules) {
    let mod = _defined_modules[k];

    if (mod === undefined || mod.depends === undefined) {
      console.warn("Module error", mod);
      throw new Error("Module Error" + (mod ? mod.name : ""))
    }

    for (var i = 0; i < mod.depends.length; i++) {
      let mod2 = mod.depends[i];
      
      if (typeof(mod2) == "string") {
        _es6_push_basepath(mod.path);
        mod2 = es6_get_module_meta(mod2);
        _es6_pop_basepath();
      }
      
      mod.depends[i] = mod2;
      
      if (mod2.links.indexOf(mod) < 0)
        mod2.links.push(mod);
    }
  }

  var sortlist = sort_modules();

  if (_is_cyclic) {
    for (let k in _defined_modules) {
      let mod = _defined_modules[k];

      mod._exports = mod.exports || {};

      Object.defineProperty(mod, "exports", {
        get() {
          return this._exports;
        },
        set(v) {
          Object.assign(this._exports, v);
        }
      });
    }

    let visitmap = new Map();
    let modstack = [];

    console.log("cyclic module load");
    for (let k in _defined_modules) {
      let mod = _defined_modules[k];

      if (!mod.loaded) {
        _load_module_cyclic(mod, visitmap, modstack);
      }
    }

    _post_primary_load = true;

    if (_debug_modules) {
      for (let k of visitmap.keys()) {
        if (visitmap.get(k) < 2)
          continue;

        if (!k.name) {
          console.log("EEK!", k);
        }
        console.log(visitmap.get(k), k.name, k.path);
      }
    }
  } else {
    for (let mod of sortlist) {
      _load_module(mod);
    }
  }

  startup_report("...Finished.  " + (time_ms()-start_time).toFixed(1) + "ms");

  //add modules to global namespace, but only for debugging purposes
  for (var k in _defined_modules) {
    let mod = _defined_modules[k];

    window["_"+mod.name] = mod.exports;
  }
}

function test_modules() {
  es6_module_define("util", [], function(_es6_module) {
    debug("in util");
    var mod = _es6_module;
    
    mod.add_export("list", Array);
  });
  
  es6_module_define("math", ["util"], function(_es6_module, util) {
    debug("in math");
    var mod = _es6_module;
    
    mod.add_export("FancyInt", Number);
    mod.add_global("MathGlobal", Boolean);
    
    debug("util", util);
  });
  
  load_modules();
  debug(MathGlobal);
}

function es6_import_all_fancy(_es6_module, name) {
  var ret = "import {";
  var mod = _defined_modules[name];
  var i = 0;
  for (var k in mod.exports) {
    if (i > 0)
      ret += ", ";
    ret += k;
    i++;
  }
  ret += "} from '"+name+"';\n";
  
  return ret;
}

function es6_import_all(_es6_module, name) {
  var ret = "var "; //var tmpmod = es6_import(_es6_module, '"+name+"')"
  
  //var mod = es6_import(_es6_module, name);
  var mod = _defined_modules[name];
  
  var i = 0;
  for (var k in mod.exports) {
    empty = false;
    if (i > 0)
      ret += ", ";
      
    ret += k + " = es6_import_item(_es6_module, '"+name+"', '"+k+"')"
    i++;
  }
  
  if (i == 0)
    ret = "";
  
  ret += ";\n";
  ret += "es6_import(_es6_module, '"+name+"');\n";
  
  //console.log(ret);
  
  return ret;
}
