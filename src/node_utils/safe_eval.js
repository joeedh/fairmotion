"use strict";

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
}

var parseutil = require('./parseutil');
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

/*export*/function test(path) {
  if (path == undefined)
    path = "(ctx.spline.layerset.active.id in $.layers) && ($.flag & 1) && !$.hidden";
  
  var scope = {
    ctx : new Context(),
    $ : {
      layers : {}
    }
  };
  
  scope.$.layers[scope.ctx.spline.layerset.active.id] = 1;
  
  var ast = compile(path);
  console.log(JSON.stringify(ast, undefined, 2));
  
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
  new tokdef("NUMLIT", /([0-9]+)|([0-9]*\.[0-9]+)/, function(t) {
    t.value = parseFloat(t.value);
    return t;
  }),
  
  new tokdef("COND", /\?/),
  new tokdef("COLON", /\:/),
  new tokdef("PLUS", /\+/),
  new tokdef("MINUS", /\-/),
  new tokdef("MUL", /\*/),
  new tokdef("DIV", /\//),
  new tokdef("LSHIFT", /\<\</),
  new tokdef("RSHIFT", /\>\>/),
  
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
  ">>" : 3,
  ">>>": 3,
  "<<" : 3,
  "+"  : 3,
  "-"  : 3,
  
  "%"  : 4,
  "/"  : 4,
  "*"  : 4,

  "typeof" : 5,
  
  ">=" : 4,
  "<=" : 4,
  "in" : 4,
  
  "==" : 5,
  "&&" : 6,
  "||" : 6,
  
  "&"  : 7,
  "|"  : 7,
  "^"  : 7,
  
  "="  : 10,
  "!"  : 99,
  
  "."  : 100,
  
  "["  : 200,
  "]"  : 0,
  ")"  : 0,
  "("  : 200,
  
  ":"  : 300,
  "?"  : 300
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
  console.log("T", t.type);
  
  var a = p_prefix(p, t);
  
  while(prec < get_prec(p)) {
    if (p.peeknext() != undefined) {
      console.log("PREC", prec, get_prec(p), p.peeknext().type);
    }
    
    t = p.next();
    console.log("  T:", t.type);
    
    if (bin_ops.has(t.type)) {
      var b = p_expr(p, prec_map[t.value]);
      a = new Node(t.value, prec_map[t.value], a, b);
    } else if (t.type == "LPAREN") {
      a = p_expr(p, prec_map[")"]);
      p.expect("RPAREN");
    } else if (t.type == "LSBRACKET") {
      var b = p_expr(p, prec_map["]"]);
      p.expect("RSBRACKET");
      
      console.log("LSBRACKET");
      
      a = new Node("array", prec_map["["], a, b);
    } else if (t.type == "COND") { //trinary logic operator
      var b = p_expr(p, 0)
      p.expect(":");
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
      console.log("PREC", prec, get_prec(p), p.peeknext().type);
    }
  }
  
  return a;
}

function p_root(p) {
  var ret = p_expr(p, 0);
  /*
  while (p.peeknext() != undefined) {
    p.next();
  }//*/
  
  return ret;
}

/*export*/var jslexer = new lexer(tokens);
/*export*/var jsparser = new parser(jslexer);
jsparser.start = p_root;

var compile = exports.compile = function compile(code) {
  return jsparser.parse(code);
}

var exec = exports.exec = function exec(ast, scope) {
  function visit(node, scope) {
    if (typeof node == "string")
      return scope[node];
    if (typeof node == "number")
      return node;
    
    if (node.type == "!") {
      return !visit(node[0], scope);
    } else if (node.type == "ID") {
      return scope[node];
    } else if (node.type == "NUMLIT") {
      return node.value;
    } else if (node.type == "STRLIT") {
      return node.value;
    } else if (node.type == ".") {
      scope = visit(node[0], scope);
      return visit(node[1], scope);
    } else if (node.type == "array") {
      var array = visit(node[0], scope);
      var idx = visit(node[1], scope);
      
      return array[idx];
    } else if (node.type == "==") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      return a == b;
    } else if (node.type == "&&") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      return a && b;
    } else if (node.type == "||") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      return a || b;
    } else if (node.type == "^") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      return a ^ b;
    } else if (node.type == ">=") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      return a >= b;
    } else if (node.type == ">") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      return a > b;
    } else if (node.type == "!=") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      return a != b;
    } else if (node.type == "in") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      console.log("in keyword", a, b, a in b);
      
      return a in b;
    } else if (node.type == "<=") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      return a <= b;
    } else if (node.type == "<") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      return a < b;
    } else if (node.type == "|") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      return a | b;
    } else if (node.type == "+") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      return a + b;
    } else if (node.type == "-") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      return a - b;
    } else if (node.type == "*") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      return a * b;
    } else if (node.type == "/") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      return a / b;
    } else if (node.type == ">>") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      return a >> b;
    } else if (node.type == "<<") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      return a << b;
    } else if (node.type == "&") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      return a & b;
    } else if (node.type == "=") {
      var a = visit(node[0], scope);
      var b = visit(node[1], scope);
      
      var container = visit(node[0][0], scope);
      
      var key = node[0][1];
      if (typeof key != "string") {
        throw new Error("safe_eval error with: " + code);
      }
      
      container[key] = b;
      return b;
    } else {
      console.log("Error, unknown node. " + node.type + ", ast:\n", JSON.stringify(ast, undefined, 2));
    }
  }
  
  return visit(ast, scope);
}

var safe_eval = exports.safe_eval = function safe_eval(code, scope) {
  scope = scope == undefined ? {} : scope;
  
  var ast = compile(code);
  console.log(JSON.stringify(ast, undefined, 2));
  
  return exec(ast, scope);
}

//console.log(safe_eval("a[1+(2*3)] & 2"));
//console.log(safe_eval("a.b.c.d.e + f"));
console.log(safe_eval("!(1 + 1 * 2 + 3 * 4) + 5"));
//console.log(JSON.stringify(compile("(ctx.spline.layerset.active.id in $.layers) && ($.flag & 1) && !$.hidden"), undefined, 2));
