"not_a_module";

//this file is loaded before the type system.
//as such, cannot use ES6 class syntax

var _defined_modules = {};
var allow_cycles = false;

var _is_cyclic = false;
var _post_primary_load = false;
var _es6_module_resort = false;
var _es6_module_verbose = false;
var _debug_modules = 0;

function debug() {
  if (!_debug_modules)
    return;
  
  var s = "console.log";
  console.log.apply(console, arguments);
}

function ES6Module(name) {
  this.name = name;
  
  this.depends = [];
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
    
    this.depends.push(es6_get_module_meta(module));
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

function es6_get_module_meta(name) {
  if (!(name in _defined_modules)) {
    var mod = new ES6Module(name);
    _defined_modules[name] = mod;
  }
  
  return _defined_modules[name];
}

function es6_module_define(name, depends, callback) {
  debug("defining module ", name, "with dependencies", JSON.stringify(depends));
  
  if (name in _defined_modules) {
    throw new Error("Duplicate module name '" + name + "'");
  }
  
  var mod = es6_get_module_meta(name);
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
    
    path.push(mod.name);
    
    if (path.length > 1) {
      //debug(path);
    }
    
    if (mod.name in localvisit) { //mod.flag > 1) {
      _is_cyclic = true;

      debug("Cycle!", path);
      if (!allow_cycles) {
        throw new Error("module cycle! " + JSON.stringify(path));
      }
      return;
    }
    
    localvisit[mod.name] = 1;
    
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

function _load_module(mod) {
  var args = [mod];
  
  var start = time_ms();
  
  if (mod.loaded) return;
  
  debug("loading module", mod.name);
  
  var dependnames = [];
  for (var i=0; i<mod.depends.length; i++) {
    args.push(mod.depends[i].exports);
    dependnames.push(mod.depends[i].name);
  }
  
  if (dependnames.length != 0) {
    //debug("  ", JSON.stringify(dependnames));
  }
  
  if (mod.callback == undefined) {
    console.log("WARNING: module", mod.name, "does not exist!");
    return;
  }
  
  mod.callback.apply(this, args);

  //debug("global exports", mod.global_exports);
  
  for (var k in mod.global_exports) {
    //debug("adding global", k);
    this[k] = mod.global_exports[k];
  }
  
  mod.loaded = true;
  var end = time_ms();
  
  if (end - start > 4) {
    debug("  ", Math.floor(end-start).toFixed(1) + "ms");
  }
}

function ModuleLoadError() {
  Error.apply(this, arguments);
}
ModuleLoadError.prototype = Object.create(Error.prototype);

function _es6_get_module(name) {
  var mod = es6_get_module_meta(name);
  
  if (_post_primary_load) {
    if (mod.callback != undefined && !mod.loaded) {
      _load_module(mod);
    } else if (mod.callback == undefined) {
      if (_debug_modules) console.log("Module Load Error", mod, Object.keys(mod), mod.__proto__);
      throw new ModuleLoadError("Unknown module "+name);
    }
  }
  
  return mod;
}

function es6_import(_es6_module, name) {
  var mod = _es6_get_module(name);
  
  //add to active module's dependencies, if necassary
  if (mod != undefined && _es6_module.depends.indexOf(mod) < 0) {
    debug("updating dependencies");
    _es6_module_resort = true;
    _es6_module.depends.push(mod);
  }
  
  if (mod == undefined || !mod.loaded) {
    if (_debug_modules) console.log("cannot import module", name, mod);
    throw new ModuleLoadError();
  }
  
  return mod.exports;
}

function es6_import_item(_es6_module, modname, name) {
  var mod = _es6_get_module(modname);
  
  //add to active module's dependencies, if necassary
  if (mod != undefined && _es6_module.depends.indexOf(mod) < 0) {
    debug("updating dependencies");
    
    _es6_module_resort = true;
    _es6_module.depends.push(mod);
  }
  
  if (!(name in mod.exports)) {
    if (1||_debug_modules) console.log("name not in exports", name, mod);
    throw new ModuleLoadError("");
  }
  
  return mod.exports[name];
}

function load_cyclic_modules(sortlist) {
  var trylimit = 35;
  var last_totfail = undefined;
  
  debug("start load", sortlist.length);
  
  _es6_module_verbose = false;
  
  for (var si=0; si<trylimit; si++) {
    var totfail = 0;
    
    if (si > 0) {
      _es6_module_verbose = true;
      
      console.log("\n\n\n---------CYCLE STAGE", si+1, "!------------\n");
      if (!allow_cycles && si > 0) {
        throw new Error("module cycle!");
      }
      
      if (_es6_module_resort) {
        sortlist = sort_modules();
        _es6_module_resort = false;
      }
    }
    
    for (var i=0; i<sortlist.length; i++) {
      var mod = sortlist[i];
      
      if (mod.loaded) 
        continue;

      try {
        _load_module(mod);
      } catch (err) {
        if (!(err instanceof ModuleLoadError)) {
          print_stack(err);
          throw err;
        }
        
        totfail++;
      }
      
      /*if ((si > 8 && totfail > 0) && totfail > last_totfail) {
        debug("totfail", totfail, last_totfail);
        throw new Error("Could not resolve module import order");
      }*/
      
      last_totfail = totfail;
    }
    
    if (totfail == 0) break;
  }
  
  if (si == trylimit) {
    throw new Error("Failed to load all modules");
  }
  
  return si;
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
  
  var start_time = time_ms();
  
  for (var k in _defined_modules) {
    var mod = _defined_modules[k];
    for (var i=0; i<mod.depends.length; i++) {
      var d = mod.depends[i];
      
      if (typeof d == "string" || d instanceof String) {
        mod.depends[i] = es6_get_module_meta(d);
      }
    }
  }

  var sortlist = sort_modules();
  var totcycle = load_cyclic_modules(sortlist);
  
  _post_primary_load = true;
  startup_report("...Finished.  " + (time_ms()-start_time).toFixed(1) + "ms", totcycle, "cycle iterations");
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
