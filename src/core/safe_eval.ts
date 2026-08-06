"use strict";

var debug_parser = 0;
var debug_exec = 0;

function parsedebug(...args: unknown[]) {
  if (debug_parser) console.log.apply(console, args);
}

function execdebug(...args: unknown[]) {
  if (debug_exec) console.log.apply(console, args);
}

/*
class set {
  constructor(array) {
    this.set = {};
    this.length = 0;
    
    if (array != undefined) {
      for (var i=0; i<array.length; i++) {
        this.add(array[i]);
      }
    }
  }
  
  add(item) {
    if (!this.has(item))
      this.length++;

    item = "" + item;
    
    this.set[item] = 1;
  }
  
  has(item) {
    item = "" + item;
    
    return item in this.set;
  }
}*/

/* NOTE: a second, hand-written Pratt parser used to live here -- a `Node`
   class, a token table, p_prefix/p_expr/p_root, and the compile2()/exec2()
   pair that drove them. Nothing had called any of it in years (the live path
   is compile() + exec(), on esprima), and a debug-only test() helper beside it
   referenced a `ContextStruct` global that no longer exists. All removed.

   The evaluator hands around whatever the caller put in scope -- arbitrary
   runtime values -- and walks esprima's AST, whose node fields vary by node
   type. Neither is knowable statically, so this single alias carries both. */
type EvalValue = any;

interface EvalScope {
  thisvar: EvalValue;
  scope: { [k: string]: EvalValue };
  parent?: EvalScope;
}

/* Walks an esprima AST and back-links every node to its parent. */
export function parentify(node: EvalValue): EvalValue {
  var idgen = 0;
  var set: { [inst_id: number]: number } = {};

  function visit(node: EvalValue) {
    if (node == null) {
      return;
    }

    if (node._inst_id !== undefined && node._inst_id in set) return;

    if (node._inst_id === undefined) {
      node._inst_id = idgen++;
    }
    set[node._inst_id] = 1;

    for (var k in node) {
      var v = node[k];
      if (typeof v != "object" || v === null) continue;

      if (v._inst_id === undefined) {
        v._inst_id = idgen++;
      }

      if (v._inst_id in set) {
        continue;
      }

      v.parent = node;
      visit(v);
    }
  }

  visit(node);
  return node;
}

/* esprima is a UMD bundle loaded as a plain script; it sets window.esprima.
   The old module emulation exposed it as the global `_esprima`. */
export function compile(code: string) {
  return parentify(window.esprima.parse(code).body);
}

/* `ast` is whatever compile() handed back — an array of esprima statement nodes.
   `scope1` is the caller's variable bag; its values are arbitrary. */
export function exec(ast: EvalValue, scope1: { [k: string]: EvalValue }): EvalValue {
  let scope = scopes.next();
  scope.scope = scope1;
  scope.parent = undefined;

  function visit(node: EvalValue, scope: EvalScope): EvalValue {
    if (!node) {
      throw new Error("node was undefined!");
    }

    if (node.type === "Identifier") {
      return scope.scope[node.name];
    } else if (node.type === "Literal") {
      return node.value;
    } else if (node.type === "ExpressionStatement") {
      return visit(node.expression, scope);
    } else if (node.type === "VariableDeclarator") {
      let name = node.id.name;

      if (node.init === null) {
        scope.scope[name] = undefined;
      } else {
        scope.scope[name] = visit(node.init, scope);
      }

      return scope.scope[name];
    } else if (node.type === "VariableDeclaration") {
      let first = visit(node.declarations[0], scope);

      for (let i = 1; i < node.declarations.length; i++) {
        visit(node.declarations[i], scope);
      }

      return first;
    } else if (node.type === "MemberExpression") {
      let obj = visit(node.object, scope);
      let prop;

      execdebug("Member Expression!", node);

      if (node.computed) {
        prop = visit(node.property, scope);
      } else if (node.property.type === "Identifier") {
        prop = node.property.name;
      } else if (node.property.type === "Literal") {
        prop = node.property.value;
      } else {
        console.trace(node);
        throw new Error("Expected an identifier or literal node");
      }

      execdebug("  Obj, prop:", obj, prop, "...");

      return obj[prop];
    } else if (node.type === "ConditionalExpression") {
      let a = visit(node.test, scope);

      if (a) {
        return visit(node.consequent, scope);
      } else {
        return visit(node.alternate, scope);
      }
    } else if (node.type === "UpdateExpression") {
      let obj, prop;

      if (node.argument.type === "MemberExpression") {
        obj = visit(node.argument.object, scope);

        if (node.argument.computed) {
          prop = visit(node.argument.property, scope);
        } else if (node.argument.property.type === "Identifier") {
          prop = node.argument.property.name;
        } else if (node.argument.property.type === "Literal") {
          prop = node.argument.property.value;
        } else {
          console.trace(node.argument);
          throw new Error("Expected an identifier or literal node");
        }
      } else {
        if (node.argument.type !== "Identifier") {
          console.log(node);
          console.trace(node.argument);
          throw new Error("Expeced an identifier node");
        }

        obj = scope.scope;
        prop = node.argument.name;
      }

      let preval = obj[prop];
      if (node.operator === "++") obj[prop]++;
      else obj[prop]--;

      return node.prefix ? obj[prop] : preval;
    } else if (node.type === "AssignmentExpression") {
      let obj, prop;

      if (node.left.type === "MemberExpression") {
        obj = visit(node.left.object, scope);

        if (node.left.computed) {
          prop = visit(node.left.property, scope);
        } else if (node.left.property.type === "Identifier") {
          prop = node.left.property.name;
        } else if (node.left.property.type === "Literal") {
          prop = node.left.property.value;
        } else {
          console.trace(node.left);
          throw new Error("Expected an identifier or literal node");
        }
      } else {
        if (node.left.type !== "Identifier") {
          console.log(node);
          console.trace(node.left);
          throw new Error("Expeced an identifier node");
        }

        obj = scope.scope;
        prop = node.left.name;
      }

      switch (node.operator) {
        case "=":
          obj[prop] = visit(node.right, scope);
          break;
        case "+=":
          obj[prop] += visit(node.right, scope);
          break;
        case "-=":
          obj[prop] -= visit(node.right, scope);
          break;
        case "/=":
          obj[prop] /= visit(node.right, scope);
          break;
        case "*=":
          obj[prop] *= visit(node.right, scope);
          break;
        case "%=":
          obj[prop] %= visit(node.right, scope);
          break;
        case "<<=":
          obj[prop] <<= visit(node.right, scope);
          break;
        case ">>=":
          obj[prop] >>= visit(node.right, scope);
          break;
        case ">>>=":
          obj[prop] >>>= visit(node.right, scope);
          break;
        case "|=":
          obj[prop] |= visit(node.right, scope);
          break;
        case "^=":
          obj[prop] ^= visit(node.right, scope);
          break;
        case "&=":
          obj[prop] &= visit(node.right, scope);
          break;
          break;
      }

      return obj[prop];
    } else if (node.type === "ArrayExpression") {
      let ret = [];
      let items = node.elements;

      for (let i = 0; i < items.length; i++) {
        ret.push(visit(items[i], scope));
      }

      return ret;
    } else if (node.type === "UnaryExpression") {
      let val = visit(node.argument, scope);

      switch (node.operator) {
        case "-":
          return -val;
        case "+":
          return val;
        case "!":
          return !val;
        case "~":
          return ~val;
        case "typeof":
          return typeof val;
        case "void":
          throw new Error("implement me");
        case "delete":
          throw new Error("implement me");
        default:
          throw new Error("Unknown prefix " + node.prefix);
      }
    } else if (node.type === "NewExpression") {
      execdebug("new call!", node, node.callee);

      let func = visit(node.callee, scope);
      let thisvar = undefined;

      if (node.callee.type === "MemberExpression") {
        thisvar = visit(node.callee.object, scope);
      }

      let args = node.arguments;

      switch (args.length) {
        case 0:
          return new func();
        case 1:
          return new func(visit(args[0], scope));
        case 2:
          return new func(visit(args[0], scope), visit(args[1], scope));
        case 3:
          return new func(visit(args[0], scope), visit(args[1], scope), visit(args[2], scope));
        case 4:
          return new func(
            visit(args[0], scope),
            visit(args[1], scope),
            visit(args[2], scope),
            visit(args[3], scope)
          );
        case 5:
          throw new Error("new calls of more than 4 arguments is not supported");
      }
    } else if (node.type === "CallExpression") {
      execdebug("function call!", node, node.callee);

      let func = visit(node.callee, scope);
      /* NOTE: this was `thislet` -- a var->let rename that missed the five uses
         below, so every call expression threw a ReferenceError. */
      let thisvar = undefined;

      if (node.callee.type === "MemberExpression") {
        thisvar = visit(node.callee.object, scope);
      }

      let args = node.arguments;

      switch (args.length) {
        case 0:
          return func.call(thisvar);
        case 1:
          return func.call(thisvar, visit(args[0], scope));
        case 2:
          return func.call(thisvar, visit(args[0], scope), visit(args[1], scope));
        case 3:
          return func.call(
            thisvar,
            visit(args[0], scope),
            visit(args[1], scope),
            visit(args[2], scope)
          );
        case 4:
          return func.call(
            thisvar,
            visit(args[0], scope),
            visit(args[1], scope),
            visit(args[2], scope),
            visit(args[3], scope)
          );
        case 5:
          throw new Error("function calls of more than 4 arguments is not supported");
      }
    } else if (node.type === "BinaryExpression" || node.type === "LogicalExpression") {
      let a = visit(node.left, scope);
      let b = visit(node.right, scope);

      switch (node.operator) {
        case "==":
          return a === b;
        case "!=":
          return a !== b;
        case ">":
          return a > b;
        case "<":
          return a < b;
        case ">=":
          return a >= b;
        case "<=":
          return a <= b;
        case "===":
          return a === b;
        case "!==":
          return a !== b;
        case "<<":
          return a << b;
        case ">>":
          return a >> b;
        case ">>>":
          return a >>> b;
        case "+":
          return a + b;
        case "-":
          return a - b;
        case "*":
          return a * b;
        case "/":
          return a / b;
        case "%":
          return a % b;
        case "|":
          return a | b;
        case "&&":
          return a && b;
        case "||":
          return a || b;
        case "^":
          return a ^ b;
        case "&":
          return a & b;
        case "in":
          return a in b;
        case "instanceof":
          return a instanceof b;
        default:
          throw new Error("Unknown binary operator " + node.operator);
      }
    } else {
      console.log(node);
      throw new Error("Unknown node " + node.type);
    }
  }

  if (ast instanceof Array) {
    let last = undefined;

    for (let i = 0; i < ast.length; i++) {
      last = visit(ast[i], scope);
    }

    return last;
  } else {
    return visit(ast, scope);
  }
}

var scopes = new cachering<EvalScope>(function (): EvalScope {
  return {
    thisvar: undefined,
    scope  : {},
  };
}, 512);

export function safe_eval(code: string, scope?: { [k: string]: EvalValue }) {
  scope = scope === undefined ? {} : scope;

  var ast = compile(code);

  parsedebug(ast);

  return exec(ast, scope);
}
