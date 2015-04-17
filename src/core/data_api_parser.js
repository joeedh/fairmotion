"use strict";

function apiparser() {
  function tk(name, re, func) {
    return new PUTL.tokdef(name, re, func);
  }
  
  var tokens = [
    tk("ID", /[a-zA-Z_]+[a-zA-Z$0-9_]*/),
    tk("EQUALS", /=/),
    tk("COLON", /:/),
    tk("LSBRACKET", /\[/),
    tk("RSBRACKET", /\]/),
    tk("LPARAM", /\(/),
    tk("RPARAM", /\)/),
    tk("CODE", /\{.*\}/, function(t) {
      t.value = t.value.slice(1, t.value.length-1).trim();
      return t;
    }),
    tk("COMMA", /,/),
    tk("DOT", /\./),
    tk("NUM", /[0-9]+/),
    tk("SEMI", /;/),
    tk("NEWLINE", /\n/, function(t) {
      t.lexer.lineno += 1;
    }),
    tk("SPACE", / |\t/, function(t) {
      //throw out non-newline whitespace tokens
    })
  ];

  function errfunc(lexer) {
    return true; //throw error
  }
  
  var lex = new PUTL.lexer(tokens, errfunc)
  var parser = new PUTL.parser(lex);
  
  function numnode(token, n) {
    return {type : "NUM", val : n, children : [],
            lexstart: token.lexpos, 
            lexend: token.lexpos+token.lexlen
           }
  }
  function valnode(token, id) {
    return {type : "ID", val : id, children : [],
            lexstart: token.lexpos, 
            lexend: token.lexpos+token.lexlen
           }
  }
  function varnode(token, id, val=undefined) {
    var cs = val != undefined ? [val] : [];
    return {type : "VAR", val : id, children : cs,
            lexstart: token.lexpos, 
            lexend: token.lexpos+token.lexlen
           }
  }
  
  function bnode(token, l, r, op) {
    return {
            type : op, children : [l, r], 
            lexstart: token.lexpos, 
            lexend: token.lexpos+token.lexlen
           };
  }
  
  function funcnode(token, name_expr, args) {
    var cs = [name_expr];
    for (var i=0; i<args.length; i++) {
      cs.push(args[i]);
    }
    
    return {type : "FUNC", children : cs,
            lexstart: token.lexpos, 
            lexend: token.lexpos+token.lexlen
            }
  }
  
  function arrnode(token, name_expr, ref) {
    return {type : "ARRAY", children : [name_expr, ref],
            lexstart: token.lexpos, 
            lexend: token.lexpos+token.lexlen
           }
  }
  
  function p_FuncCall(p, name_expr) {
    var args = [];
    
    //node format : children : [name_expr, args]
    //func_call : LPARAM arg_list RPARAM
    //arg_list  : ID 
    //          | ID EQUALS EXPR
    //          | arg_list COMMA ID
    //          | arg_list COMMA ID EQUALS EXPR
    
    var lexstart1 = p.lexer.lexpos;
    p.expect("LPARAM");
    
    while (!p.at_end()) {
      var t = p.peeknext();
      
      if (t == undefined) {
        p.error(t, "func");
      }
      
      if (t.type == "RPARAM") {
        p.next();
        break;
      }
      
      var lexstart = p.lexer.lexpos;
      var arg = p.expect("ID");
      
      var val = undefined;
      if (p.peeknext().type == "EQUALS") {
        p.next();
        var val = p_Expr(p, ",)");
      }
      var lexend = p.lexer.lexpos;
      
      args.push({lexpos: lexstart, lexlen: lexstart-lexend}, varnode(arg, val));
      
      var t = p.next();
      //console.log("=>", t.type, t.value);
      
      if (t.type == "RPARAM") {
        break;
      } else if (t.type != "COMMA") {
        p.error(t, "invalid token in function call");
      }
    }
    
    var lexlen = p.lexer.lexpos-lexstart1;
    var ret = funcnode({lexpos: lexstart, lexlen: lexlen}, name_expr, args);
    return ret;
  }  
  
  function p_Expr(p, end_chars="") {
    //console.log(p);
    
    var lexstart = p.lexer.lexpos;
    
    var t = p.peeknext();
    var ast;
    
    if (t.type == "ID")
      ast = valnode(t, p.expect("ID"));
    else if (t.type == "NUM")
      ast = numnode(t, p.expect("NUM"));
    else
      p.error("Invalid token " + t.type + "'" + t.value + "'");
    
    while (!p.at_end()) {
      var t = p.peeknext();
      
      if (t.type == "DOT") {
        p.next();
        var t2 = p.peeknext();
        var id = p.expect("ID", "expected id after '.'");
        
        ast = bnode({lexpos: lexstart, lexlen: t.lexpos+t.lexlen}, ast, valnode(t2, id), ".");
      } else if (t.type == "LPARAM") {
        ast = p_FuncCall(p, ast);
      } else if (t.type == "LSBRACKET") {
        p.expect("LSBRACKET");
        var val = p_Expr(p, "]");
        p.expect("RSBRACKET");
        
        ast = arrnode({lexpos: lexstart, lexlen: t.lexpos+t.lexlen}, ast, val);
      } else if (t.type =="CODE") {
        p.next();
        var n2 = {
          type     : "STRING",
          lexstart : t.lexpos,
          lexend   : t.lexpos+t.lexlen,
          value    : t.value
        };
        
        ast = bnode({lexpos: lexstart, lexlen: t.lexpos+t.lexlen}, ast, n2, "CODE");
      } else if (end_chars.contains(t.value)) {
        return ast;
      } else {
        p.error(t, "Invalid token " + t.type + "'" + t.value + "'"); 
      }
    }
    
    return ast;
  }
   
  parser.start = p_Expr;
  return parser;
}

function fmt_ast(ast, tlevel=0) {
  var s = "";
  var t = ""
  
  for (var i=0; i<tlevel; i++) t += " ";
  
  s += t + ast["type"]
  if (ast["type"] == "ID" || ast["type"] == "VAR" || ast["type"] == "NUM")
    s += " " + ast["val"];
  s += " {\n"
  
  var cs = ast["children"];
  if (cs == undefined) cs = [];
  for (var i=0; i<cs.length; i++) {
    s += fmt_ast(cs[i], tlevel+1);
  }
  
  s += t + "}\n";
  
  return s;
}

function test_dapi_parser() {
  var p = apiparser();
  
  var tst = "operator_stack[0].name";
  var tree = p.parse(tst);
  console.log(fmt_ast(tree));
  
  console.log(g_app_state.api.get_prop_new(new Context(), tst));
  g_app_state.api.set_prop_new(new Context(), "view2d.zoomfac", 0.5);
}