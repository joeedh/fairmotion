var ast_util = require("./ast_util"),
    js_parse = ast_util.js_parse;

console.log(js_parse("inherit_multiple($n1, [$s]);", js_parse("a.b.c"), "t"));
console.log(js_parse("[]", {start_node : "ArrayExpression"}));
