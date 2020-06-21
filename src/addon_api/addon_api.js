"use strict";

import {tokdef, token, lexer, parser} from '../path.ux/scripts/util/parseutil.js';
import {app} from '../../platforms/platform.js';

import * as vectormath from '../util/vectormath.js';
import * as math from '../path.ux/scripts/util/math.js';
import * as util from '../path.ux/scripts/util/util.js';
import * as parseutil from '../path.ux/scripts/util/parseutil.js';

let builtins = {
  vectormath : vectormath,
  parseutil : parseutil,
  util : util,
  math : math
};

let tk = (name, re, func) => new tokdef(name, re, func);

let keywords = new Set([
  "export", "import", "from", "as", "in", "default",
  "let", "const", "var", "class", "function"
]);

let tokens = [
  tk("ID",/[a-zA-Z_$]+[a-zA-Z0-9_$]*/, (t) => {
    if (keywords.has(t.value)) {
      t.type = t.value.toUpperCase();
    }

    return t;
  }),

  tk("LBRACE", /\{/),
  tk("RBRACE", /\}/),
  tk("COMMA", /\,/),
  tk("LPAREN", /\(/),
  tk("RPAREN", /\)/),
  tk("STRLIT", /["'`]/, (t) => {
    t.type = "STRLIT";

    let chr = t.value;
    let start = t.lexer.lexpos-1;
    let li = t.lexer.lexpos+1;
    let buf = t.lexer.lexdata;

    while (li < buf.length && buf[li] !== chr) {
      let c = buf[li];

      if (c === "\\" && buf[li+1] === chr) {
        li++;
      } else if (c === "\n" && chr !== "`") {
        break;
      }

      li++;
    }

    t.value = buf.slice(start, li+1);
    t.lexer.lexpos = li+1;

    return t;
  }),
  tk( "STAR", /\*/),
  tk( "WS", /[ \t\n\r]/, (t) => {
    t.lexer.lineno += t.value === "\n" ? 1 : 0;
    //drop token
  }),
  tk("SEMI", /;/),
  tk("BINOP", /[+\-\*\/%$~\.\<\>&%^|]/),
  tk("BINOP", /(\*\*)|(\<\<)/),
  tk("BINOP", /\=\=/),
  tk("UNOP", /[!~]/),
  tk("COLON", /\:/),
  tk("ASSIGN", /\=/)
];

export function parseFile(buf, modname, path, modid) {
  let lex = new lexer(tokens);
  let p = new parser(lex);

  let linemap = new Array(buf.length);
  let li = 0;
  for (let i=0; i<buf.length; i++) {
    linemap[i] = li;

    if (buf[i] === "\n") {
      li++;
    }
  }

  let newbuf = buf;
  let spans = [];

  function p_Id() {
    let t = p.next();
    if (t.type === "ID" || t.value === "default") {
      return t.value;
    }

    console.log(t);
    p.error(t, "Expected an identifier");
  }

  let deps = [];
  let name_idgen = 1;

  function p_Import(t) {
    let start = t.lexpos;
    let t2 = p.next();

    let repl = "";

    if (t2.type === "LBRACE") {
      let t3 = t2;
      let members = [];

      while (!p.at_end() && t3 && t3.type !== "RBRACE") {
        members.push(p_Id());

        p.optional("COMMA");

        t3 = p.peeknext();

        if (t3.type === "COMMA") {
          p.next();
          t3 = p.peeknext();
        }
      }

      p.expect("RBRACE");
      p.expect("FROM");

      console.log(members);

      let path = p.expect("STRLIT");
      let modname = "__mod_tmp_" + name_idgen;

      deps.push(path);

      repl = `var ${modname} = _addon_require(${modid}, ${path});\n`;
      name_idgen++;

      let first = true;
      repl += "var ";
      for (let m of members) {
        if (first) {
          first = false;
        } else {
          repl += ", ";
        }
        repl += `${m} = ${modname}.${m}`;
      }

      repl += ";\n";
    } else if (t2.type === "ID") {
      let mod = t2.value;

      t2 = p.next();
      if (t2.type === "FROM") {
        let path = p.expect("STRLIT");
        repl = `var ${mod} = _addon_require(${modid}, ${path}).default;`;
        deps.push(path);
      } else {
        p.error(t2, "Invalid import statement");
      }
    } else if (t2.type === "STRLIT") {
      repl = `_addon_require(${t2.value});`
      deps.push(t2.value);
    } else if (t2.type === "STAR") {
      p.expect("AS");
      let mod = p_Id();
      p.expect("FROM");
      let path = p.expect("STRLIT");
      
      repl = `var ${mod} = _addon_require(${modid}, ${path});`;
      deps.push(path);
    } else {
      p.error(t, "Invalid import statement");
    }

    let end = p.lexer.lexpos;

    console.log(start, end, repl);
    spans.push([start, end, repl]);
  }

  function p_VarExpr() {
    let li = p.lexer.lexpos, start = li;

    let bracketmap = {
      "{" : "{",
      "}" : "{",

      "[" : "[",
      "]" : "[",

      "(" : "(",
      ")" : "("
    };

    let bracketsigns = {
      "{" : 1,
      "}" : -1,

      "[" : 1,
      "]" : -1,

      "(" : 1,
      ")" : -1
    };

    let states = {
      base(li) {
        if (buf[li] === "/" && buf[li+1] === "*") {
          this.push("comment");
          return li + 2;
        } else if (buf[li] === "`") {
          this.push("tmpl");
          return li + 2;
        } else if (buf[li] === "'" || buf[li] === '"') {
          let chr = buf[li];

          li++;
          while (li < buf.length && buf[li] !== chr) {
            if (buf[li] === "\\" && buf[li+1] === chr) {
              li++;
            }
            li++;
          }
        } else if (buf[li] in bracketmap) {
          this.brackets[bracketmap[buf[li]]] += bracketsigns[buf[li]];
        } else if ((buf[li] === "," || buf[li] === ";") && this.bracketsZero()) {
          this.end();
          return li;
        }

        return li + 1;
      },

      tmpl(li) {
        if (buf[li-1] !== "\\" && buf[li] === "`") {
          this.pop();
        }

        return li + 1;
      },

      str(li) {

      },

      comment(li) {
        if (buf[li] === "*" && buf[li+1] === "/") {
          this.pop();
          return li + 2;
        }

        return li + 1;
      },

      push(state, statedata=undefined) {
        this.statestack.push([this.statedata, this.state]);
        this.state = state;
        this.statedata = statedata;
      },

      pop() {
        [this.statedata, this.state] = this.statestack.pop();
      },

      bracketsZero() {
        for (let k in this.brackets) {
          if (this.brackets[k]) {
            return false;
          }
        }

        return true;
      },

      end() {
        this.done = true;
      },
      done : false,
      brackets : {
        "{" : 0,
        "[" : 0,
        "(" : 0
      },

      statedata : undefined,
      state : "base",
      statestack : []
    }

    while (li < buf.length) {
      let start = li;

      li = states[states.state](li);

      if (states.done) {
        break;
      }
      if (li <= start) {
        li = start + 1;
      }
    }

    p.lexer.lexpos = li;
    p.lexer.lineno = li < linemap.length ? linemap[li] : p.lexer.lineno;

    return buf.slice(start, li).trim();
  }

  let varkeywords = new Set(["let", "const", "var"]);

  function p_Export(t) {
    let start = t.lexpos;
    let t2 = p.next();

    let repl = "";

    if (t2.type === "LBRACE") {
      let t3 = t2;
      let members = [];

      while (!p.at_end() && t3 && t3.type !== "RBRACE") {
        members.push(p_Id());

        p.optional("COMMA");

        t3 = p.peeknext();

        if (t3.type === "COMMA") {
          p.next();
          t3 = p.peeknext();
        }
      }

      p.expect("RBRACE");
      p.expect("FROM");

      console.log(members);

      let path = p.expect("STRLIT");
      let modname = "__mod_tmp_" + name_idgen;

      repl = `var ${modname} = _addon_require(${modid}, ${path});\n`;
      deps.push(path);

      name_idgen++;

      let first = true;
      repl += "";
      for (let m of members) {
        if (first) {
          first = false;
        } else {
          repl += ";\n ";
        }
        repl += `exports.${m} = ${modname}.${m}`;
      }

      repl += ";\n";
    } else if (t2.type === "ID") {
      let mod = t2.value;

      t2 = p.next();
      if (t2.type === "FROM") {
        let path = p.expect("STRLIT");
        repl = `exports.${mod} = _addon_require(${modid}, ${path}).default;\n`;
        deps.push(path);
      } else {
        p.error(t2, "Invalid import statement");
      }
    } else if (t2.type === "STRLIT") {
      repl = `_addon_require(${t2.value});\n`
      deps.push(t2.value);
    } else if (t2.type === "STAR") {
      p.expect("FROM");
      let path = p.expect("STRLIT");

      repl = `_exportall(${modid}, exports, _addon_require(${modid}, ${path}));\n`;
      deps.push(path);
    } else if (varkeywords.has(t2.value)) {
      let vars = {};

      let keyword = t2.value;
      repl = '';

      for (let _i=0; _i<500000; _i++) {
        let lineno = p.lexer.lineno;

        let id = p.expect("ID");
        let expr = undefined;
        console.log("VAR", id);

        if (p.optional("ASSIGN")) {
          expr = p_VarExpr();
        }


        if (expr) {
          repl += `${keyword} ${id} = exports.${id} = ${expr};\n`;
        } else {
          repl += `${keyword} ${id} = exports.${id} = undefined;\n`;
        }
        vars[id] = expr;
        console.log(vars);

        p.optional("COMMA");
        let t = p.peeknext();

        if (!t || t.type === "SEMI" || (t.type !== "ID" && t.lexer.lineno > lineno)) {
          break;
        }
      }
    } else if (t2.value === "function" || t2.value === "class") {
      let id = p_Id();

      repl = `var ${id} = exports.${id} = ${t2.value} ${id}`;
    } else {
      console.log(t);
      p.error(t, "Invalid export statement");
    }

    let end = p.lexer.lexpos;

    console.log(start, end, repl);
    spans.push([start, end, repl]);
  }

  p.lexer.input(buf);

  li = 0;
  while (li < buf.length) {
    let startli = li;
    let buf2 = buf.slice(li, buf.length);

    let i1 = buf2.search(/\bexport\b/);
    let i2 = buf2.search(/\bimport\b/);

    if (i1 < 0 && i2 < 0) {
      break;
    }

    i1 = i1 < 0 ? buf2.length : i1;
    i2 = i2 < 0 ? buf2.length : i2;

    i1 += li;
    i2 += li;

    let i = Math.min(i1, i2);
    if (i1 < i2) {
      p.lexer.peeked_tokens.length = 0;
      p.lexer.lexpos = i1;
      p.lexer.lineno = linemap[i1];
      p_Export(p.next());
    } else {
      p.lexer.peeked_tokens.length = 0;
      p.lexer.lexpos = i2;
      p.lexer.lineno = linemap[i2];
      p_Import(p.next());
    }

    li = p.lexer.lexpos + 1;

    if (li === i) {
      break;
    }
  }

  let off = 0;

  for (let span of spans) {
    let [start, end, line] = span;

    start += off;
    end += off;

    buf = buf.slice(0, start) + line + buf.slice(end, buf.length);
    off += line.length - (end - start);
  }

  buf = `"use strict";
_addon_define(${modid}, "${path}", [${""+deps}], function($__module, exports) {
${buf}
});
  `

  console.log("FINAL:", buf);
  console.log(spans);

  return buf;
}

let test = `

import {a, b, c} from '../d';
import a from 'b';
import * as a from 'b';
import 'bleh';

export * from 'b';
export {a, d, e, Tst} from 'b.js';

export class b {
}
export function c {
}

export let a = 0, c=2, d=4, e=5, u={a : b, c : d, f : [1, 2, 3]}, c = 3, e="2";

export const d;
`

window._testParseFile = function() {
  console.log(parseFile(test));
}


export const modules = {};
export const pathstack = ["."];

for (let k in builtins) {
  let mod = new ES6Module(k, k);
  mod.loaded = true;
  mod.exports = builtins[k];
  modules[k] = mod;
}

export function resolvePath(path) {
  path = path.replace(/\\/g, "/");
  path = path.replace(/\/\//g, "/");

  if (path.startsWith("/")) {
    path = path.slice(1, path.length);
  }

  if (path.endsWith("/")) {
    path = path.slice(0, path.length-1);
  }

  let root = pathstack[pathstack.length-1];

  if (path.startsWith("./")) {
    path = root + "/" + path.slice(2, path.length);
  } else {
    path = _normpath(path, root);
  }

  return path.trim();
}

let addonmap = new Map();
let addon_idgen = 0;

let file_idgen = 0;
let filestates = {};

export function loadModule(path, addon) {
  /*
  let old = {
    _addon_define : window._addon_define,
    _addon_require : window._addon_require,
    _addon_exportall : window._addon_exportall
  };*/

  if (path in builtins) {
    return true;
  }
  path = resolvePath(path);

  if (path in modules) {
    return true;
  }

  window._addon_define = function _addon_define(fileid, path, deps, func) {
    console.log("ADDON DEFINE CALLED!");

    let module = new ES6Module(_splitpath(path)[1], path);
    module.callback = func;

    let file = filestates[fileid];
    let addon = file.addon;

    module.exports = {};
    module.deps = deps;
    module.loaded = false;
    module.addon = addon;

    modules[path] = module;
    addon.modules[path] = module;

    let ok = true;

    for (let dep of deps) {
      ok = ok && loadModule(dep, addon);
    }

    function load(mod) {
      pathstack.push(_splitpath(mod.path)[0]);

      window._addon_require = function(__module, mod2) {
        if (!(mod2 in builtins)) {
          mod2 = resolvePath(mod2);
        }

        let mod3 = modules[mod2];
        if (!mod3.loaded) {
          load(mod3);
        }

        return mod3.exports;
      }

      mod.loaded = true;
      mod.callback(addon, mod.exports);

      pathstack.pop();
    }

    if (ok) {
      console.log("loading modules for addon. . .");

      for (let k in addon.modules) {
        let mod = addon.modules[k];

        if (!mod.loaded) {
          load(mod);
        }
      }

      addon.onLoad();
    }
  }

  let file = {
    id : file_idgen++,
    path : path,
    addon : addon
  };

  filestates[file.id] = file;

  app.openFile(path).then((data) => {
    let buf = data;

    if (data instanceof Uint8Array || Array.isArray(data)) {
      buf = "";

      for (let i=0; i<data.length; i++) {
        buf += String.fromCharCode(data[i]);
      }
    }

    pathstack.push(_splitpath(path)[0]);

    buf = parseFile(buf, _splitpath(path)[1], path, file.id);
    /*
    let tag = document.createElement("script");

    tag.setAttribute("type", "application/javascript");
    tag.innerText = buf;
    tag.setAttribute("async", "true");
    tag.async = true;
    document.body.appendChild(tag);
    window.thetag = tag;

    //*/

    eval(buf);


    pathstack.pop();
  });

  /*
  for (let k in old) {
    window[k] = old[k];
  }*/

  return false;
}

/*
Addon api.
*/

/*
import * as data_api from 'data_api';
import * as animdata from 'animdata';
import * as frameset from 'frameset';
import * as eventdag from 'eventdag';
import * as STRUCT from 'struct';

import * as toolops_api from 'toolops_api';
import * as toolprops_iter from 'toolprops_iter';
import * as toolsystem from 'toolsystem';
import * as utildefine from 'utildefine';
import * as redraw_globals from 'redraw_globals';
import * as lib_api from 'lib_api';
import * as lib_utils from 'lib_utils';
import * as spline from 'spline';
import * as spline_base from 'spline_base'
import * as spline_query from 'spline_query';
import * as spline_types from 'spline_types';

var modules = {
  data_api       : data_api,
  animdata       : animdata,
  frameset       : frameset,
  eventdag       : eventdag,
  STRUCT         : STRUCT,
  toolops_api    : toolops_api,
  toolprops_iter : toolprops_iter,
  toolsystem     : toolsystem,
  utildefine     : utildefine,
  redraw_globals : redraw_globals,
  lib_api        : lib_api,
  lib_utils      : lib_utils,
  spline         : spline,
  spline_base    : spline_base,
  spline_query   : spline_query,
  spline_types   : spline_types
};
*/

export class Addon {
  static define() { return {
    author             : "",
    email              : "",
    version            : "",
    tooltip            : "",
    description        : "",
    apiVersion         : 0
  }}

  constructor(manager, mainModulePath) {
    this.manager = manager;
    this.modules = {};
    this.id = addon_idgen++;

    this.mainModule = _normpath1(mainModulePath);

    addonmap.set(this.id, this);
    addonmap.set(this, this.id);
  }

  define_data_api(api) {

  }

  onLoad() {
    let main = this.modules[this.mainModule];

    if (main && main.exports.register) {
      main.exports.register();
    }
  }

  //returns a promise
  init_addon() {

  }

  //should return a promise?
  destroyAddon() {
    try {
      this.modules[this.mainModule].exports.unregister();
    } catch (error) {
      util.print_stack(error);
      console.log("error while unloading addon");
    }

    for (let k in this.modules) {
      delete modules[k];
    }

    this.modules = {};
  }

  handle_versioning(file, oldversion) {

  }
}

export class AddonManager {
  constructor() {
    this.addons = [];
    this.addon_pathmap = {};
    this.datablock_types = [];
  }

  loadAddon(path) {
    path = _normpath1(path);

    if (path in this.addon_pathmap) {
      console.log("reloading module");
      this.destroyAddon(this.addon_pathmap[path]);
    }

    let addon = new Addon(this, path);

    pathstack.length = 0;
    pathstack.push(".");

    this.addon_pathmap[addon.mainModule] = addon;
    this.addons.push(addon);

    loadModule(addon.mainModule, addon);
  }

  destroyAddon(addon) {
    addon.destroyAddon();
    delete this.addon_pathmap[addon.mainModule];
  }

  registerDataBlockType(cls) {
    this.datablock_types.push(cls);
  }

  unregisterDataBlockType(cls) {
    this.datablock_types.remove(cls, false);
  }

  getModule(name) {
    return modules[name];
  }

  getModules() {
    return Object.getOwnPropertyNames(modules);
  }
}

export const manager = new AddonManager();

window._testAddons = function() {
  manager.loadAddon("./addons/test.js");
}
