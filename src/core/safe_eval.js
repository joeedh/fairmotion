"use strict";

var debug_parser = 0;
var debug_exec = 0;

function parsedebug() {
  if (debug_parser)
    console.log.apply(console, arguments);
}

function execdebug() {
  if (debug_exec)
    console.log.apply(console, arguments);
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

//var parseutil = require('./parseutil');
import * as parseutil from '../path.ux/scripts/util/parseutil.js';

var token = parseutil.token;
var tokdef = parseutil.tokdef;
var PUTLParseError = parseutil.PUTLParseError;
var lexer = parseutil.lexer;
var parser = parseutil.parser;

/*export*/class Node extends Array {
  constructor(type, prec, a, b) {
    super();
    
    this.type = type;
    this.prec = prec;
    this.length = b != undefined ? 2 : (a != undefined ? 1 : 0);
    
    if (a != undefined) {
      this[0] = a;
      
      if (a instanceof Node)
        a.parent = this;
    }
    
    if (b != undefined) {
      this[1] = b;
      
      if (b instanceof Node)
        b.parent = this;
    }
  }
  
  toJSON() {
    var ret = {
      type   : this.type,
      length : this.length
    };
    
    for (var i=0; i<this.length; i++) {
      ret[i] = this[i];
    }
    
    return ret;
  }
}

export function test(path) {
  if (path == undefined)
    //path = "(ctx.spline.layerset.active.id in $.layers) && ($.flag & 1) && !$.hidden";
    path = "ContextStruct.pathmap.theme.pathmap.ui.pathmap.colors.getter(g_theme.ui.flat_colors[0]).pathmap.type";
  
  console.log(path);
  
  var scope = {
    ctx : new Context(),
    ContextStruct : ContextStruct,
    g_theme : g_theme,
    $ : {
      layers : {}
    }
  };
  
  //scope.$.layers[scope.ctx.spline.layerset.active.id] = 1;
  
  var ast = compile(path);
  
  console.log("AST:", ast);
  console.log("SCOPE:", scope);
  
  return exec(ast, scope);
}

var reserved_words = new set([
  "in", "function"
]);

var tokens = [
  new tokdef("ID", /[a-zA-Z$_]+[a-zA-Z0-9$_]*/, function(t) {
    if (reserved_words.has(t.value)) {
      t.type = t.value.toUpperCase();
    }
    
    return t;
  }),
  new tokdef("NUMLIT", /([0-9]+[\.][0-9]*)|([0-9]+)/, function(t) {
    t.value = parseFloat(t.value);
    return t;
  }),
  
  new tokdef("PLUS", /\+/),
  new tokdef("MINUS", /\-/),
  new tokdef("MUL", /\*/),
  new tokdef("DIV", /\//),
  new tokdef("LSHIFT", /\<\</),
  new tokdef("RSHIFT", /\>\>/),
  new tokdef("COMMA", /,/),
  
  new tokdef("COND", /\?/),
  new tokdef("COLON", /\:/),
  new tokdef("DOT", /\./),
  new tokdef("LSBRACKET", /\[/),
  new tokdef("RSBRACKET", /\]/),
  new tokdef("LPAREN", /\(/),
  new tokdef("RPAREN", /\)/),
  new tokdef("EQUALS", /\=/),
  new tokdef("MOD", /\%/),
  new tokdef("BITAND", /\&/),
  new tokdef("SEMI", /\;/),
  new tokdef("LNOT", /\!/),
  new tokdef("BNOT", /\~/),
  new tokdef("LEQUALS", /\=\=/),
  new tokdef("LNEQUALS", /\!\=/),
  new tokdef("LOR", /\|\|/),
  new tokdef("LAND", /\&\&/),
  new tokdef("BXOR", /\^/),
  new tokdef("STRLIT", /(".*")|('.*')/, function(t) {
    t.value = t.value.slice(1, t.value.length-1);
    return t;
  }),
  new tokdef("WS", /[ \t\r\n]/, function(t) {
    //drop token
  })
]

var prec_map = {
  ">>" : 4,
  ">>>": 4,
  "<<" : 4,
  "+"  : 4,
  "-"  : 4,
  
  "%"  : 5,
  "/"  : 5,
  "*"  : 5,

  "typeof" : 6,
  
  ">=" : 5,
  "<=" : 5,
  "in" : 5,
  
  "==" : 6,
  "!=" : 6,
  "&&" : 7,
  "||" : 7,
  
  "&"  : 8,
  "|"  : 8,
  "^"  : 8,
  
  "="  : 11,
  "!"  : 99,
  
  "."  : 101,
  
  ","  : 2,
  "["  : 3,
  "]"  : 0,
  ")"  : 0,
  "("  : 200,
  
  ":"  : 0,
  "?"  : 1
};

var bin_ops = new set([
  "DOT",
  "EQUALS",
  "BITAND",
  "LAND",
  "LOR",
  "BXOR",
  "LEQUALS",
  "LNEQUALS",
  "MOD",
  "PLUS",
  "MINUS",
  "MUL",
  "DIV",
  "RSHIFT",
  "LSHIFT",
  "IN"
]);

function get_prec(p) {
  var t = p.peeknext();
  
  if (t == undefined) 
    return 0;
  
  if (t.value in prec_map) {
    return prec_map[t.value];
  }
  
  if (t.type == "ID" || t.type == "NUMLIT" || t.type == "STRLIT") {
    return 0;
  }
  
  return 0;
}

function p_prefix(p, token) {
  if (token.type == "ID") {
    return token.value;
  } else if (token.type == "NUMLIT") {
    return token.value;
  } else if (token.type == "STRLIT") {
    return {type : "STRLIT", value : token.value};
  } else if (token.type == "LNOT") {
    return new Node("!", prec_map["!"], p_expr(p, prec_map["!"]));
    //return {type : "LNOT", value : token.value};
  } else if (token.type == "MINUS") {
    return new Node("negate", prec_map["-"], p_expr(p, prec_map["-"]));
  } else if (token.type == "LPAREN") {
    var ret = p_expr(p, prec_map[")"]);
    p.expect("RPAREN");
    
    return ret
  } else {
    p.error(token, "unexpected " + token.value);
  }
}

function p_expr(p, prec) {
  var t = p.next();
  
  if (t == undefined) {
    return "ERROR_ERROR_ERROR";
  }
  
  if (debug_parser)
    console.log("T", t.type);
  
  var a = p_prefix(p, t);
  
  while(prec < get_prec(p)) {
    if (debug_parser && p.peeknext() != undefined) {
      console.log("PREC", prec, get_prec(p), p.peeknext().type);
    }
    
    t = p.next();
    if (debug_parser)
      console.log("  T:", t.type);
    
    if (bin_ops.has(t.type)) {
      var b = p_expr(p, prec_map[t.value]);
      a = new Node(t.value, prec_map[t.value], a, b);
    } else if (t.type == "LPAREN") {
      if (debug_parser)
        console.log("LPAREN infix!", ast, "\n-----\n");
      var list;
      
      if (p.peeknext().type != "RPAREN") {
        list = p_expr(p, prec_map[")"]);
        
        if (list.type != "list") {
          list = new Node("list", prec["("], list);
        }
      } else {
        list = new Node("list", prec["("]);
      }
      
      a = new Node("call", 500, a, list);
      p.expect("RPAREN");
    } else if (t.type == "LSBRACKET") {
      var b = p_expr(p, prec_map["]"]);
      p.expect("RSBRACKET");
      
      if (debug_parser)
        console.log("LSBRACKET");
      
      a = new Node("array", prec_map["["], a, b);
    } else if (t.type == "COMMA") {
      if (debug_parser)
        console.log("COMMA", a);
      
      if (a.type == "list") {
        a.push(p_expr(p, 0));
      } else {
        var b = p_expr(p, 0);
        
        if (b.type == "list") {
          b.insert(0, a);
          a = b;
        } else {
          a = new Node("list", prec_map[","], a);
          a.push(b);
        }
      }
    } else if (t.type == "COND") { //trinary logic operator
      var b = p_expr(p, 0)
      p.expect("COLON");
      var c = p_expr(p, 0);
      
      a = new Node("?", undefined, a, b);
      a.push(c);
    } else {
      p.error(t, "unexpected " + t.value);
    }
  }
  
  //if (prec >= get_prec(p))
  //  p.next();
  
  if (p.peeknext() != undefined) {
    if (p.peeknext() != undefined) {
      if (debug_parser)
        console.log("PREC", prec, get_prec(p), p.peeknext().type);
    }
  }
  
  return a;
}

function p_root(p) {
  var ret = p_expr(p, 0);
  
  if (p.peeknext() != undefined && p.peeknext().type == "SEMI") {
    p.next();
  }
  /*
  while (p.peeknext() != undefined) {
    p.next();
  }//*/
  
  return ret;
}

/*export*/var jslexer = new lexer(tokens);
/*export*/var jsparser = new parser(jslexer);
jsparser.start = p_root;

export function compile2(code) {
  return jsparser.parse(code);
}

export function parentify(node) {
  var idgen = 0;
  var set = {};
  
  function visit(node) {
    if (node == null) {
      return;
    }
    
    if (node._inst_id != undefined && node._inst_id in set)
      return;
    
    if (node._inst_id == undefined) {
      node._inst_id = idgen++;
    }
    set[node._inst_id] = 1;
    
    for (var k in node) {
      var v = node[k];
      if (typeof v != "object" || v === null)
        continue;
     
      if (v._inst_id == undefined) {
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

export function compile(code) {
  return parentify(esprima.parse(code).body);
}

export function exec(ast, scope1) {
  var scope = scopes.next();
  scope.scope = scope1;
  scope.parent = undefined;
  
  function visit(node, scope) {
    if (node == undefined) {
      throw new Error("node was undefined!");
    }
    
    if (node.type == "Identifier") {
      return scope.scope[node.name];
    } else if (node.type == "Literal") {
      return node.value;
    } else if (node.type == "ExpressionStatement") {
      return visit(node.expression, scope);
    } else if (node.type == "VariableDeclarator") {
      var name = node.id.name;
      
      if (node.init == null) {
        scope.scope[name] = undefined;
      } else {
        scope.scope[name] = visit(node.init, scope);
      }
      
      return scope.scope[name];
    } else if (node.type == "VariableDeclaration") {
      var first = visit(node.declarations[0], scope);
      
      for (var i=1; i<node.declarations.length; i++) {
        visit(node.declarations[i], scope);
      }
      
      return first;
    } else if (node.type == "MemberExpression") {
      var obj = visit(node.object, scope);
      var prop;
      
      execdebug("Member Expression!", node);
      
      if (node.computed) {
        prop = visit(node.property, scope);
      } else if (node.property.type == "Identifier") {
        prop = node.property.name;
      } else if (node.property.type == "Literal") {
        prop = node.property.value;
      } else {
        console.trace(node);
        throw new Error("Expected an identifier or literal node");
      }
      
      execdebug("  Obj, prop:", obj, prop, "...");
      
      return obj[prop];
    } else if (node.type == "ConditionalExpression") {
      var a = visit(node.test, scope);
      
      if (a) {
        return visit(node.consequent, scope);
      } else {
        return visit(node.alternate, scope);
      }
    } else if (node.type == "UpdateExpression") {
      var obj, prop;
      
      if (node.argument.type == "MemberExpression") {
        obj = visit(node.argument.object, scope);
        
        if (node.argument.computed) {
          prop = visit(node.argument.property, scope);
        } else if (node.argument.property.type == "Identifier") {
          prop = node.argument.property.name;
        } else if (node.argument.property.type == "Literal") {
          prop = node.argument.property.value;
        } else {
          console.trace(node.argument);
          throw new Error("Expected an identifier or literal node");
        }
      } else {
        if (node.argument.type != "Identifier") {
          console.log(node);
          console.trace(node.argument);
          throw new Error("Expeced an identifier node");
        }
        
        obj = scope.scope;
        prop = node.argument.name;
      } 
      
      var preval = obj[prop];
      if (node.operator == "++")
        obj[prop]++;
      else
        obj[prop]--;
      
      return node.prefix ? obj[prop] : preval;
    } else if (node.type == "AssignmentExpression") {
      var obj, prop;
      
      if (node.left.type == "MemberExpression") {
        obj = visit(node.left.object, scope);
        
        if (node.left.computed) {
          prop = visit(node.left.property, scope);
        } else if (node.left.property.type == "Identifier") {
          prop = node.left.property.name;
        } else if (node.left.property.type == "Literal") {
          prop = node.left.property.value;
        } else {
          console.trace(node.left);
          throw new Error("Expected an identifier or literal node");
        }
      } else {
        if (node.left.type != "Identifier") {
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
    } else if (node.type == "ArrayExpression") {
      var ret = [];
      var items = node.elements;
      
      for (var i=0; i<items.length; i++) {
        ret.push(visit(items[i], scope));
      }
      
      return ret;
    } else if (node.type == "UnaryExpression") {
      var val = visit(node.argument, scope);
      
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
    } else if (node.type == "NewExpression") {
      execdebug("new call!", node, node.callee);
      
      var func = visit(node.callee, scope);
      var thisvar = undefined;
      
      if (node.callee.type == "MemberExpression") {
        thisvar = visit(node.callee.object, scope);
      }
      
      var args = node.arguments;
      
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
          return new func(visit(args[0], scope), visit(args[1], scope), visit(args[2], scope), visit(args[3], scope));
        case 5:
          throw new Error("new calls of more than 4 arguments is not supported");
      }
    } else if (node.type == "CallExpression") {
      execdebug("function call!", node, node.callee);
      
      var func = visit(node.callee, scope);
      var thisvar = undefined;
      
      if (node.callee.type == "MemberExpression") {
        thisvar = visit(node.callee.object, scope);
      }
      
      var args = node.arguments;
      
      switch (args.length) {
        case 0:
          return func.call(thisvar);
        case 1:
          return func.call(thisvar, visit(args[0], scope));
        case 2:
          return func.call(thisvar, visit(args[0], scope), visit(args[1], scope));
        case 3:
          return func.call(thisvar, visit(args[0], scope), visit(args[1], scope), visit(args[2], scope));
        case 4:
          return func.call(thisvar, visit(args[0], scope), visit(args[1], scope), visit(args[2], scope), visit(args[3], scope));
        case 5:
          throw new Error("function calls of more than 4 arguments is not supported");
      }
    } else if (node.type == "BinaryExpression" || node.type == "LogicalExpression") {
      var a = visit(node.left, scope);
      var b = visit(node.right, scope);
      
      switch (node.operator) {
        case "==":
          return a == b;
        case "!=":
          return a != b;
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
    var last = undefined;
    
    for (var i=0; i<ast.length; i++) {
      last = visit(ast[i], scope);
    }
    
    return last;
  } else {
    return visit(ast, scope);
  }
}

var scopes = new cachering(function() {
  return {
    thisvar : undefined,
    scope   : {}
  };
}, 512);

//var NODE_LOGNOT = 0, NODE_NEGATE=1, NODE_CONDITIONAL=2,
//    NODE_CALL   = 2, NODE_BINOP =3;

export function exec2(ast, scope1) {
  var scope = scopes.next();
  scope.scope = scope1;
  scope.parent = undefined;
  
  function visit(node, scope, pscope) { //parent scope
    if (typeof node == "string")
      return scope.scope[node];
    if (typeof node == "number")
      return node;
    
    if (node.type == "!") {
      return !visit(node[0], scope);
    } else if (node.type == "negate") {
      return -visit(node[0], scope);
    } else if (node.type == "?") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      var c = visit(node[2], scope, pscope);
      
      return a ? b : c;
    } else if (node.type == "call") {
      var func;
      
      if (typeof node[0] == "string" && node.parent.type == ".") {
        func = scope.thisvar[node[0]];
      } else {
        func = visit(node[0], scope, pscope);
      }
      var thisvar;
      
      if (node.parent.type != ".") {
        thisvar = self;
      } else {
        thisvar = scope.thisvar; //visit(node.parent[0], pscope, pscope);
      }
      
      execdebug("func call!", func, thisvar, "...", pscope);
      
      //theoretically, I think this should
      //compile better in v8
      switch (node[1].length) {
        case 0:
          return func.call(thisvar);
        case 1:
          return func.call(thisvar, visit(node[1][0], scope, pscope));
        case 2:
          return func.call(thisvar, visit(node[1][0], scope, pscope),
                           visit(node[1][1], scope, pscope));
        case 3:
          return func.call(thisvar, visit(node[1][0], scope, pscope),
                           visit(node[1][1], scope, pscope),
                           visit(node[1][2], scope, pscope));
        case 4:
          return func.call(thisvar, visit(node[1][0], scope, pscope),
                           visit(node[1][1], scope, pscope),
                           visit(node[1][2], scope, pscope),
                           visit(node[1][3], scope, pscope));
      }
    } else if (node.type == "ID") {
      if (node.parent != undefined && node.parent.type == ".") {
        return scope.thisvar[node.value];
      } else {
        return scope.scope[node.value];
      }
    } else if (node.type == "NUMLIT") {
      return node.value;
    } else if (node.type == "STRLIT") {
      return node.value;
    } else if (node.type == ".") {
      var scope2 = scopes.next();
      
      scope2.parent = scope;
      scope2.scope = scope.scope;
      scope2.thisvar = visit(node[0], scope, pscope);
      pscope = scope, scope = scope2;
      
      if (debug_exec)
        console.log("scope", scope, node[0], scope.scope[node[0]], "...");
      
      if (typeof node[1] == "string") {
        return scope.thisvar[node[1]];
      } else {
        return visit(node[1], scope, pscope);
      }
    } else if (node.type == "array") {
      var array = visit(node[0], scope, pscope);
      var idx = visit(node[1], scope, pscope);
      
      return array[idx];
    } else if (node.type == "==") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      return a == b;
    } else if (node.type == "&&") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      return a && b;
    } else if (node.type == "||") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      return a || b;
    } else if (node.type == "^") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      return a ^ b;
    } else if (node.type == ">=") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      return a >= b;
    } else if (node.type == ">") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      return a > b;
    } else if (node.type == "!=") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      return a != b;
    } else if (node.type == "in") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      if (debug_exec)
        console.log("in keyword", a, b, a in b);
      
      return a in b;
    } else if (node.type == "<=") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      return a <= b;
    } else if (node.type == "<") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      return a < b;
    } else if (node.type == "|") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      return a | b;
    } else if (node.type == "+") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      return a + b;
    } else if (node.type == "-") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      return a - b;
    } else if (node.type == "*") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      return a * b;
    } else if (node.type == "/") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      return a / b;
    } else if (node.type == ">>") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      return a >> b;
    } else if (node.type == "<<") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      return a << b;
    } else if (node.type == "&") {
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      return a & b;
    } else if (node.type == "=") {
      //are we not assigning to an object property?
      if (typeof node[0] == "string" || node[0].type == "ID") {
        var key = typeof node[0] == "string" ? node[0] : node[0].value;
        scope.scope[key] = visit(node[1], scope, pscope);
        
        return scope.scope[key];
      }
      
      var a = visit(node[0], scope, pscope);
      var b = visit(node[1], scope, pscope);
      
      var container = visit(node[0][0], scope, pscope);
      
      var key = node[0][1];
      if (typeof key != "string") {
        throw new Error("safe_eval error with: " + code);
      }
      
      container[key] = b;
      return b;
    } else {
      console.log("Error, unknown node. " + node.type + ", ast:\n", ast);
    }
  }
  
  return visit(ast, scope, undefined);
}

export function safe_eval(code, scope) {
  scope = scope == undefined ? {} : scope;
  
  var ast = compile(code);
  
  parsedebug(ast);
  
  return exec(ast, scope);
}
