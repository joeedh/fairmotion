import sys, random, time, os, os.path
from js_global import *
from js_ast import *
from js_process_ast import *
from js_typespace import *
from js_cc import js_parse

loggercode = """
(function() {
    function MySet(items=[]) {
      Array.call(this);

      this.map = {};

      for (let item of items) {
        this.add(item);
      }
    }

    MySet.prototype = Object.assign(Object.create(Array.prototype), {
      has(item) {
        return this._key(item) in this.map;
      },

      _key(item) {
        if (typeof item === "object") {
          item = item.valueOf();
        } else {
          item = safeToString(item);
        }

        if (item === "__proto__") {
            item = "__EVILNESS__proto__EVILNESS__";
        }

        return item;
      },

      add(item) {
        if (typeof item !== "string") {
            throw new Error("evil");
        }

        if (this.has(item)) {
          this.get(item).count++;
          return;
        }

        let ts = new typestr(item);
        this.map[this._key(item)] = ts;
        this.push(ts);
      },

      get(item) {
        let key = this._key(item);

        return key in this.map ? this.map[key] : undefined;
      },

      toJSON() {
        let ret = [];

        for (let item of this) {
          ret.push(item);
        }

        return ret;
      }
    });

    function typestr(str) {
        this.str = str;
        this.count = 1;

        this.valueOf = function() {
            return this.str;
        }
        this.toJSON = function() {
            return {
                value : this.str,
                count : this.count
            }
        }
    }

    function safeToString(item) {
        return typeof item === "symbol" ? item.toString() : "" + item;
    }

    Set.prototype.toJSON = function() {
        let lst = [];

        for (let item of this) {
            lst.push(item);
        }

        return lst;
    }

    let g;
    if (typeof window === "undefined") {
        if (typeof self !== "undefined") {
            g = self; //worker?
        } else {
            g = global; //node?
        }
    } else {
        g = window; //browser?
    }

    g.TYPE_LOGGING_ENABLED = true;
    g._dynamic_literals = {};
    g._type_defs = {};

    let exclude = new MySet(["pop_i", "remove", "toString", "prototype", "__proto__", "constructor", "toLocaleString()",
                           "hasOwnProperty", "__defineGetter__", "__defineSetter__"])

    function funckeyToIdent(k) {
        let ws = k.replace(/[\.:]/g, " ")
        ws = ws.split("\\n")
        let out = "";
        for (let w of ws) {
            if (w.length < 2) {
                out += w + "_";
                continue;
            }

            let c1 = w[0].toLowerCase() !== w[0];
            let c2 = w[1].toLowerCase() !== w[1];

            if (c1 === c2) {
                w += "_"
            }

            out += w
        }

        out = out.trim();

        if (out.endsWith("_")) {
            out = out.slice(0, out.length-1);
        }

        out = out.trim();

        return out;
    }

    function buildDynamicLiteral(funckey, name, obj) {
        let keys = []

        for (let k in obj) {
            let v;

            if (k.search(":") >= 0 || k.search(/\./) >= 0) {
                continue;
            }

            try {
                v = obj[k];
            } catch (error) {
                continue;
            }

            if (!exclude.has(k)) {
                keys.push(k)
            }
        }

        keys.sort()
        let hash = funckey + ":" + name
        if (hash in _dynamic_literals) {
            let objlit = _dynamic_literals[hash];

            for (let k of keys) {
                let v = obj[k];

                if (!(k in objlit.properties)) {
                    objlit.properties[k] = new MySet([getTypeSimple(v)])
                } else {
                    _log_add_type(objlit.properties[k], getTypeSimple(v), v);
                }
            }

            return objlit.name;
        }

        let props = {};

        if (name.length > 1) {
            name = name[0].toUpperCase() + name.slice(1, name.length)
        }

        _dynamic_literals[hash] = {
            name : funckeyToIdent(funckey) + name + "Params",
            properties : props
        }

        for (let key of keys) {
            let v = obj[key];
            props[key] = new MySet([getTypeSimple(v)])
        }

        return _dynamic_literals[hash].name;
    }

    function getTypeSimple(obj) {
        if (typeof obj !== "object") {
            return typeof obj;
        }

        if (obj.constructor && obj.constructor !== null && obj.constructor.name) {
            return "" + obj.constructor.name;
        } else {
            return "ObjectLiteral";
        }
    }

    function getType(funckey, name, obj) {
        if (typeof obj !== "object") {
            return typeof obj;
        }

        if (obj === null) {
            return "null";
        }

        if (obj.constructor && obj.constructor !== null && obj.constructor !== Object) {
            return obj.constructor.name;
        } else {
            return "Object"; // buildDynamicLiteral(funckey, name, obj);
        }
    }

    g._type_lines = {};
    g._all_types = {};

    g._log_add_type = function(set, typestr, val) {
        if (typeof val === "object" && val !== null && val.constructor) {
            let ok = 1;

            let p = Object.getPrototypeOf(val.constructor);
            let lastp = undefined;

            while (p && p !== lastp && p !== Object) {
                if (p.name) {
                    for (let item of set) {
                        if (item.str === p.name) {
                            ok = 0;
                            break;
                        }
                    }
                }
                lastp = p
                p = Object.getPrototypeOf(p);
            }

            if (ok) {
                set.add(typestr)
            }
        } else {
            set.add(typestr)
        }
    }

    g._log_types = function(file, line, funckey, arg, val, lexstart, lexend) {
        let key = file + "|" + funckey + "|" + arg

        if (!(key in _type_defs)) {
            _type_defs[key] = new MySet();
            _all_types[key] = new MySet();

            _type_lines[key] = {
                file    : file,
                line    : line,
                funckey : funckey,
                lexpos  : lexstart,
                lexend  : lexend
            }
        }

        let t = getType(funckey, arg, val);

        _log_add_type(_type_defs[key], t, val);
        _all_types[key].add(t);
    };

    g.getTypeLogData = function() {
        return {
            dynamicLiterals : _dynamic_literals,
            typeLines       : _type_lines,
            allTypes        : _all_types,
            types           : _type_defs
        }
    }

    g.saveTypeData = function() {
        require("fs").writeFileSync("mytypes.json", JSON.stringify(getTypeLogData()));
    }

    g._log_return = function(file, line, funckey, val, lexstart, lexend) {
        _log_types(file, line, funckey, "__return__", val, lexstart, lexend);
        return val;
    }
})();
"""

def buildkey(node):
    def getname(name):
        if type(name) not in [str, int] and isinstance(name, Node):
            return name.gen_js(0).strip()
        else:
            return str(name)

    def inside_arglist(n):
        p = n.parent
        state = 0
        while p:
            if isinstance(p, FunctionNode):
                state = 1

            if p.parent and isinstance(p.parent, FunctionNode) and p == p.parent[0]:
                return True

            if state == 0 and type(p) == FuncCallNode:
                return True

            p = p.parent

        return False

    def safeprint(n):
        if type(n) in [str, int, float]:
            return str(n)
        elif type(n) in [IdentNode, StrLitNode, NumLitNode]:
            return n.gen_js(0).strip()
        elif type(n) == BinOpNode:
            return safeprint(n[0]) + n.op + safeprint(n[1])
        elif type(n) == AssignNode:
            return safeprint(n[0]) + "." + safeprint(n[1])
        elif type(n) == FuncCallNode:
            return safeprint(n[0])
        elif type(n) == FunctionNode:
            return safeprint(n.name)
        else:
            return ""

    p = node
    key = "."
    while p:
        if isinstance(p, FunctionNode):
            if p.name == "(anonymous)":
                key = "__anonymous__"
            else:
                key = getname(p.name) + "." + key
        elif isinstance(p, ClassNode):
            key = getname(p.name) + "." + key
        elif isinstance(p, AssignNode):
            key = key + "." + safeprint(p[0])

        p = p.parent

    key = key.strip()
    if key.endswith("."):
        key = key.strip()[:-2]
    key = key.replace("'", "_").replace('"', "_").replace('`', "_").replace("\\", "\\\\")

    return key

def create_type_logger(node, typespace):
    flatten_statementlists(node, typespace)


    for i, s in enumerate(node):
        if i > 5:
            break;

        if s.gen_js(0).strip() in ["'no_type_logging'", '"no_type_logging"', "`no_type_logging`"]:
            return []



    def visit(n):
        args = []
        for c in n[0]:
            n2 = js_parse("""
                _log_types($s1, $s2, $s3, $s4, $s5, $s6, $s7);
            """, ['"'+n.file+'"', str(n.line), '`'+buildkey(n)+'`', '`'+str(c.val)+'`', str(c.val),
            n.lexpos, n.lexpos2]);

            args.append(n2)

        for arg in args:
            if len(n) == 2 and type(n[1]) == StatementList:
                n[1].insert(0, arg)
            else:
                n.insert(1, arg)


    def retvisit(n):
        val = None

        if len(n) == 0 or n[0].gen_js(0).strip() == "":
            val = IdentNode("undefined")
        else:
            val = n[0]

        n2 = js_parse("""_log_return($s1, $s2, $s3, $n4, $s5, $s6)""",
                ['"'+n.file+'"', str(n.line), '`'+buildkey(n)+'`', val, n.lexpos, n.lexpos2],
                start_node=FuncCallNode)

        if len(n) == 0:
            n.append(n2)
        else:
            n.replace(n[0], n2)

    traverse(node, FunctionNode, visit)
    traverse(node, MethodNode, visit)
    traverse(node, MethodGetter, visit)
    traverse(node, MethodSetter, visit)
    traverse(node, ObjLitSetGet, visit)
    traverse(node, ReturnNode, retvisit)

    prefix = js_parse(loggercode)
    oldprefix = None

    if len(node) > 0 and "not_a_module" in node[0].gen_js(0):
        oldprefix = StrLitNode("'not_a_module'")

    node.prepend(prefix)
    if oldprefix is not None:
        node.prepend(oldprefix)

    flatten_statementlists(node, typespace);

def load_types(node, typespace, data):
    inserts = []

    def getType(n, key):
        if key in types:
            ts = filter(lambda a : a["value"] not in ["undefined", "null"], types[key])
            ts = list(ts)
            if len(ts) == 1:
                return IdentNode(ts[0]["value"])

    def visit(n):
        key = buildkey(n)

        key = n.file + "|" + key + "|__return__"

        t = getType(n, key)
        if t is not None:
            n.type = t
            n.template = t

    types = data["types"]
    lits = data["dynamicLiterals"]
    typeLines = data["typeLines"]

    def safestr(n):
        if isinstance(n, Node):
            return n.gen_js(0).strip()
        else:
            return str(n)

    def vvisit(n):
        if n.type is not None and type(n.type) != UnknownTypeNode:
            return

        if not n.parent or not n.parent.parent: return

        #for now, function arguments only
        if not isinstance(n.parent.parent, FunctionNode):
            return
        if n.parent != n.parent.parent[0]:
            return

        key = buildkey(n)
        key = n.file + "|" + key + "|" + n.gen_js(0).strip()
        t = getType(n, key)

        if t is not None:
            n.type = t

            s, e = n.lexpos, n.lexpos2
            e = s + len(safestr(n.val))
            ld = glob.g_filedata

            snippet = ld[s:e]
            if snippet == safestr(n.val):
                print(ld[s:e])

                inserts.append([e, " : " + t.val])

    Types = [FunctionNode, MethodNode, MethodGetter, MethodSetter, ObjLitSetGet]
    for t in Types:
        traverse(node, t, visit)

    traverse(node, VarDeclNode, vvisit)
    #sys.exit()

    #let key = file + "|" + line + "|" + funckey + "|" + arg

    return inserts

def emit_dynamic_literals(node, typespace, data):
    pass

def apply_inserts(node, typespace, inserts, buf):
    inserts.sort(key = lambda key : key[0])

    off = 0
    for it in inserts:
        i, s = it
        i += off

        buf = buf[:i] + s + buf[i:]
        off += len(s)
        pass

    return buf

