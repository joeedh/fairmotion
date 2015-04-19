var acorn = require("./acorn_modified/src/index");
var gen = require("babel-core/lib/babel/generation")
//var acorn = require("babel-core/lib/acorn/src/index")

exports.remove = function remove(array, item) {
  var idx = array.indexOf(item);
  
  for (var i=idx; i<array.length-1; i++) {
    array[i] = array[i+1];
  }
  
  array.pop();
}

exports.insert = function insert(array, before, item) {
  array.push(undefined);
  
  for (var i=array.length-1; i>before; i--) {
    array[i] = array[i-1];
  }
  
  array[before] = item;
}

var traverse_one = exports.traverse_one = function traverse_one(node, callback, depth, stack, liststack, depth2) {
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
  
  //console.log(ts, "Entering node", node.type);
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

var traverse = exports.traverse = function traverse(node, callback, depth, stack, liststack) {
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
  
  //console.log(ts, "Entering node", node.type);
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

var num_toks=["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/*
usage:

  js_parse(code, substitution argument1..., options);

  js_parse uses the substitution codes $s and $n.
    $s inserts an argument as a string
    $n transforms an ast node into a string and then inserts it
*/
exports.js_parse = function js_parse(code) {
  var options = arguments[arguments.length-1];
  if (typeof options == "string")
    options = {};
  
  var code2 = "";
  var ni = 1;
  
  for (var i=0; i<code.length; i++) {
    var c = code[i];
    var cn = code[i < code.length-1 ? i+1 : i];
    
    if (c == "$" && (cn == "n" || cn == "s")) {
      var num = ""

      i += 2
      while (i < code.length && num_toks.indexOf(code[i]) >= 0) {
        num += code[i];
        i++
      }
      i--;
      
      //console.log(num);
      
      var n = undefined;
      if (num != "") {
        num = parseInt(num);
        n = arguments[num];
        ni = Math.max(ni, 1+num);
      } else {
        n = arguments[ni++];
      }
      
      if (cn == "n") {
        var g = new gen(n);
        
        g = g.code.trim();
        if (g[g.length-1] == ";")
          g = g.slice(0, g.length-1);
          
        //console.log("---", g)
        
        code2 += g;
      } else {
        //console.log("ni", ni, num, arguments[2]);
        code2 += n;
      }
      
      continue;
    }
    
    code2 += c;
  }
  
  //console.log(code2);
  
  code = code2;
  var ast = acorn.parse(code, {ecmaVersion : 6});
  
  if (ast.body.length == 1)
    ast = ast.body[0];
  var ret = undefined;
  
  if (options.start_node != undefined) {
    traverse(ast, function(node) {
      if (node.type == options.start_node && ret == undefined) {
        ret = node;
      }
    });
  }
  
  if (ret == undefined)
    ret = ast;
    
  return ret;
}
