var acorn = require("./acorn_modified/src/index");
var fs = require("fs");
var extjs_transforms = require("./extjs_transforms");

var babel = require("babel");

/*
function a(x) {
  //this is a c-style static local variable.
  //necassary since JS doesn't handle mass allocation
  //of small objects well.
  static b = [0, 0];
  
  b[0] = sin(x);
  b[1] = cos(x);
  
  return b;
}
*/
var argv = process.argv;

function main() {
  if (argv.length < 3) {
    console.log("js_cc.js: expected source file");
    return -1;
  }
  
  infile=argv[2];
  console.log("parsing", infile);
  
  buf = fs.readFileSync(infile, {encoding : "utf8"});
  try {
    var ast = acorn.parse(buf, {
      ecmaVersion : 6,
      sourceType  : "module",
      plugins     : {"argument_types" : "argument_types"}
    });
  } catch (err) {
    try {
      if (err.line == undefined || err.location == undefined || err.pos == undefined)
        throw err;
        
      var lexpos = err.pos;
      //find start of line;
      var col = 0;
      
      while (buf[lexpos] != "\n" && lexpos >= 0) {
        lexpos--;
        col++;
      }
      
      var line = "", colstr = "";
      lexpos++;
      while(lexpos < buf.length && buf[lexpos] != "\n") {
        line += buf[lexpos];
        lexpos++;
      }
      for (var i=0; i<col-1; i++) {
        colstr += " ";
      }
      
      console.log("\n"+infile+":"+err.loc.line+":"+err.loc.column+": Parse error")
      console.log(line);
      console.log(colstr+"^");
    } catch (err2) {
      throw err2;
    }
  }
  
  /*
  for (var k in babel.transform.transformers) {
    if (k.startsWith("es6")) {
      var transform = babel.transform.transformers[k];
      
    }
  }
  */
  
  function remove(array, item) {
    var idx = array.indexOf(item);
    
    for (var i=idx; i<array.length-1; i++) {
      array[i] = array[i+1];
    }
    
    array.pop();
  }
  
  function insert(array, before, item) {
    array.push(undefined);
    
    for (var i=array.length-1; i>before; i--) {
      array[i] = array[i-1];
    }
    
    array[before] = item;
  }
  
  function traverse_one(node, callback, depth, stack, liststack, depth2) {
    if (stack == undefined) stack = [];
    if (depth == undefined) depth = 0;
    if (depth2 == undefined) depth2 = 0;
    if (liststack == undefined) liststack = [];
    
    stack.push(node);
    
    if (depth2 > 0) {
      callback(node, stack, liststack, depth);
      return;
    }
    
    var ts = "";
    for (var i=0; i<depth; i++) {
      ts += "  ";
    }
    
    console.log(ts, "Entering node", node.type);
    //console.log(ts, Object.keys(node), node.type)
    
    switch (node.type) {
      case "FunctionExpression":
      case "FunctionDeclaration":
        node = node.body;
      case "Program":
        liststack.push(node.body);
        for (var i=0; i<node.body.length; i++) {
          if (node.body[i]._doskip)
            continue;
          
          traverse_one(node.body[i], callback, depth+1, stack, liststack, depth2+1);
        }
        liststack.pop();
        break;
      case "VariableDeclaration":
        for (var i=0; i<node.declarations.length; i++) {
          traverse_one(node.declarations[i], callback, depth+1, stack, liststack, depth2+1);
        }
        break;
      case "VariableDeclarator":
        //console.log(ts+"======----==", node);
        traverse_one(node.init, callback, depth+1, stack, liststack, depth2+1);
        break;
      default:
        for (var k in node) {
          if (k[0] == "_" || k[0] == "$") continue;
          var v = node[k];
          if (v == null) continue;
          
          if (typeof v == "function" || v instanceof Function) continue;
          if (typeof v == "number" || typeof v == "string" || typeof(v) == "boolean" 
              || typeof(v) == "undefined") continue;
          
          if (v instanceof Array) {
            liststack.push(v);
            
            for (var i=0; i<v.length; i++) {
              var v2 = v[i];
              if (v2.type != undefined || v2.start != undefined || v2.loc != undefined) {
                traverse_one(v2, callback, depth+1, stack, liststack, depth2+1);
              }
            }
            
            liststack.pop();
          }
          if (v.type != undefined || v.start != undefined || v.loc != undefined) {
            traverse_one(v, callback, depth+1, stack, liststack, depth2+1);
          }
        }
        break;
    }
    
    stack.pop();
  }
  
  function traverse(node, callback, depth, stack, liststack) {
    if (node == undefined)
      return;
      
    if (stack == undefined) stack = [];
    if (depth == undefined) depth = 0;
    if (liststack == undefined) liststack = [];
    
    if (node._doskip) return;
    
    stack.push(node);
    callback(node, stack, liststack, depth);
    
    var ts = "";
    for (var i=0; i<depth; i++) {
      ts += "  ";
    }
    
    console.log(ts, "Entering node", node.type);
    //console.log(ts, Object.keys(node), node.type)
    
    switch (node.type) {
      case "FunctionExpression":
      case "FunctionDeclaration":
        node = node.body;
      case "Program":
        liststack.push(node.body);
        for (var i=0; i<node.body.length; i++) {
          if (node.body[i]._doskip)
            continue;
          
          traverse(node.body[i], callback, depth+1, stack, liststack);
        }
        liststack.pop();
        break;
      case "VariableDeclaration":
        for (var i=0; i<node.declarations.length; i++) {
          traverse(node.declarations[i], callback, depth+1, stack, liststack);
        }
        break;
      case "VariableDeclarator":
        //console.log(ts+"======----==", node);
        traverse(node.init, callback, depth+1, stack, liststack);
        break;
      default:
        for (var k in node) {
          if (k[0] == "_" || k[0] == "$") continue;
          var v = node[k];
          if (v == null) continue;
          
          if (typeof v == "function" || v instanceof Function) continue;
          if (typeof v == "number" || typeof v == "string" || typeof(v) == "boolean" 
              || typeof(v) == "undefined") continue;
          
          if (v instanceof Array) {
            liststack.push(v);
            
            for (var i=0; i<v.length; i++) {
              var v2 = v[i];
              if (v2.type != undefined || v2.start != undefined || v2.loc != undefined) {
                traverse(v2, callback, depth+1, stack, liststack);
              }
            }
            
            liststack.pop();
          }
          if (v.type != undefined || v.start != undefined || v.loc != undefined) {
            traverse(v, callback, depth+1, stack, liststack);
          }
        }
        break;
    }
    
    stack.pop();
  }
  
  function hoistStaticVar(node, chain) {
    var orig_name = node.id.name;
    var name = node.id.name;
    
    console.log("CHAIN.LENGTH", chain.length);
    for (var _i=0; _i<chain.length; _i++) {
      var i = chain.length-_i-1;
      var n = chain[i];
      
      console.log("III", i);
      var nstr = undefined;
      
      switch (n.type) {
        case "FunctionDeclaration":
          nstr = n.id.name;
          break;
        case "MethodDefinition":
          nstr = n.key.name;
          break;
        case "ClassDeclaration":
          name = n.id.name + "_" + name;
          break;
      }
      
      if (nstr != undefined) {
        name = nstr + "_" + name;
      }
      
      if (n.type == "c") {
        console.log("found function");
        console.log(Object.keys(n));
        console.log(n.id);
      }
    }
    
    //generate small uuid;
    for (var i=0; i<3; i++) {
      var c = Math.floor(Math.random()*24)+65;
      c = String.fromCharCode(c);
      name = c + name;
    }
    
    name = "$static_" + name;
    console.log("NAME:", name);
    
    node.id.name = name;
    //if (node.loc == undefined)
    //  node.loc = {start : -1, end : -1};
      
    node2 = {
      type : "VariableDeclaration",
      declarations : [node],
      kind : "var",
      id : {
        name : name,
        type : "Identifier",
        //loc : node.loc
      },
      //loc : node.loc
    };
    
    var i = chain[0].body.indexOf(chain[1]);
    
    node2._doskip = true;
    chain[1]._doskip = true;
    
    insert(chain[0].body, i, node2);
    
    return [orig_name, name];
  }
  
  function rescope(name, newname, thenode, depth) {
    if (depth == undefined) depth = 0;
    console.log("RESCOPE");
    var scopestack = [], scope = {};
    
    scope[name] = newname;
    
    function new_scope(scope) {
      var ret = {};
      for (var k in scope) {
        ret[k] = scope[k];
      }
      
      return ret;
    }
    
    function visit(node, stack, liststack, depth) {
      if (node == undefined)
        return;
        
      function doident(n) {
        if (n.type == "Identifier" && n.name in scope) {
          n.name = scope[n.name];
        }
      }
      
      switch (node.type) {
         case "FunctionDeclaration":
            scopestack.push(scope);
            scope = new_scope(scope);
            
            for (var i=0; i<node.params.length; i++) {  
              var p = node.params[i];
              if (p.type == "AssignmentPattern")
                p = p.left;
              
              if (p.name in scope) {
                delete scope[p.name];
              }
            }
          
            traverse_one(node.body, visit, depth+1, stack, liststack);
            
            scope = scopestack.pop();
            console.log("Function!", node, "Function|");
            return;
         case "AssignmentExpression":
//            console.log("AssignmentExpression", node, "||", scope, "||");
            doident(node.left);
            break;
         case "CallExpression":
            doident(node.callee);
//            console.log("CallExpression", node, "||", scope, "||");
            break;
         case "UnaryExpression":
  //          console.log("UnaryExpression", node, "||", scope, "||");
            doident(node.argument);
            break;
         case "MemberExpression":
  //          console.log("MemberExpression", node, "||", scope, "||");

            doident(node.object);
            
            traverse_one(node, visit, depth+1, stack, liststack);
            
            return
         case "ConditionalExpression":
            console.log("ConditionalExpression", node, node, "||", scope, "||");
            
            doident(node.test);
            doident(node.consequent);
            doident(node.alternate);
            break;
         case "BinaryExpression":
    //        console.log("BinOp", node, "||", scope, "||");
            doident(node.left);
            doident(node.right);
            
            break;
         case "ClassDefinition":
            //ignore classes altogether
            return;
      }
      
      traverse_one(node, visit, depth+1, stack, liststack);
    }
    
    traverse_one(thenode, visit);
  }

  traverse(ast, function(node, stack, liststack, depth) {
    if (node.type != "VariableDeclaration") return;
    if (!node.isStaticLocalVar) return;

    var vars = [];
    console.log("Found static!");
    
    for (var i=0; i<node.declarations.length; i++) {
      vars.push(hoistStaticVar(node.declarations[i], stack));
    }
    
    remove(liststack[liststack.length-1], node);
    for (var j=0; j<vars.length; j++) {
      rescope(vars[j][0], vars[j][1], stack[stack.length-2]);
    }
  });
  
  //babel.transform.transformers.es6_static_local_var = extjs_transforms;
  
  //console.log(Object.keys(babel.transform.transformers));
  //extjs_transforms
  
  console.log("\nSending ast to babel. . .\n");
  
  var ret = babel.transform.fromAst(ast, buf, {
  });
  
  //console.log(ast);
  console.log(ret.code);
  
  return 0;
}

var retcode = main();