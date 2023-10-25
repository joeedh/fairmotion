
es6_module_define('nstructjs_es6', [], function _nstructjs_es6_module(_es6_module) {
  let colormap={"black": 30, 
   "red": 31, 
   "green": 32, 
   "yellow": 33, 
   "blue": 34, 
   "magenta": 35, 
   "cyan": 36, 
   "white": 37, 
   "reset": 0, 
   "grey": 2, 
   "orange": 202, 
   "pink": 198, 
   "brown": 314, 
   "lightred": 91, 
   "peach": 210}
  function tab(n, chr) {
    if (chr===undefined) {
        chr = ' ';
    }
    let t='';
    for (let i=0; i<n; i++) {
        t+=chr;
    }
    return t;
  }
  let termColorMap={}
  for (let k in colormap) {
      termColorMap[k] = colormap[k];
      termColorMap[colormap[k]] = k;
  }
  function termColor(s, c) {
    if (typeof s==="symbol") {
        s = s.toString();
    }
    else {
      s = ""+s;
    }
    if (c in colormap)
      c = colormap[c];
    if (c>107) {
        let s2='\u001b[38;5;'+c+"m";
        return s2+s+'\u001b[0m';
    }
    return '\u001b['+c+'m'+s+'\u001b[0m';
  }
  function termPrint() {
    let s='';
    for (let i=0; i<arguments.length; i++) {
        if (i>0) {
            s+=' ';
        }
        s+=arguments[i];
    }
    let re1a=/\u001b\[[1-9][0-9]?m/;
    let re1b=/\u001b\[[1-9][0-9];[0-9][0-9]?;[0-9]+m/;
    let re2=/\u001b\[0m/;
    let endtag='\u001b[0m';
    function tok(s, type) {
      return {type: type, 
     value: s}
    }
    let tokdef=[[re1a, "start"], [re1b, "start"], [re2, "end"]];
    let s2=s;
    let i=0;
    let tokens=[];
    while (s2.length>0) {
      let ok=false;
      let mintk=undefined, mini=undefined;
      let minslice=undefined, mintype=undefined;
      for (let tk of tokdef) {
          let i=s2.search(tk[0]);
          if (i>=0&&(mini===undefined||i<mini)) {
              minslice = s2.slice(i, s2.length).match(tk[0])[0];
              mini = i;
              mintype = tk[1];
              mintk = tk;
              ok = true;
          }
      }
      if (!ok) {
          break;
      }
      if (mini>0) {
          let chunk=s2.slice(0, mini);
          tokens.push(tok(chunk, "chunk"));
      }
      s2 = s2.slice(mini+minslice.length, s2.length);
      let t=tok(minslice, mintype);
      tokens.push(t);
    }
    if (s2.length>0) {
        tokens.push(tok(s2, "chunk"));
    }
    let stack=[];
    let cur;
    let out='';
    for (let t of tokens) {
        if (t.type==="chunk") {
            out+=t.value;
        }
        else 
          if (t.type==="start") {
            stack.push(cur);
            cur = t.value;
            out+=t.value;
        }
        else 
          if (t.type==="end") {
            cur = stack.pop();
            if (cur) {
                out+=cur;
            }
            else {
              out+=endtag;
            }
        }
    }
    return out;
  }
  function list(iter) {
    let ret=[];
    for (let item of iter) {
        ret.push(item);
    }
    return ret;
  }
  var util=Object.freeze({__proto__: null, 
   tab: tab, 
   termColorMap: termColorMap, 
   termColor: termColor, 
   termPrint: termPrint, 
   list: list});
  "use strict";
  function print_lines(ld, lineno, col, printColors, token) {
    let buf='';
    let lines=ld.split("\n");
    let istart=Math.max(lineno-5, 0);
    let iend=Math.min(lineno+3, lines.length);
    let color=printColors ? (c) =>      {
      return c;
    } : termColor;
    for (let i=istart; i<iend; i++) {
        let l=""+(i+1);
        while (l.length<3) {
          l = " "+l;
        }
        l+=`: ${lines[i]}\n`;
        if (i===lineno&&token&&token.value.length===1) {
            l = l.slice(0, col+5)+color(l[col+5], "yellow")+l.slice(col+6, l.length);
        }
        buf+=l;
        if (i===lineno) {
            let colstr='     ';
            for (let i=0; i<col; i++) {
                colstr+=' ';
            }
            colstr+=color("^", "red");
            buf+=colstr+"\n";
        }
    }
    buf = "------------------\n"+buf+"\n==================\n";
    return buf;
  }
  class token  {
     constructor(type, val, lexpos, lineno, lexer, parser, col) {
      this.type = type;
      this.value = val;
      this.lexpos = lexpos;
      this.lineno = lineno;
      this.col = col;
      this.lexer = lexer;
      this.parser = parser;
    }
     toString() {
      if (this.value!==undefined)
        return "token(type="+this.type+", value='"+this.value+"')";
      else 
        return "token(type="+this.type+")";
    }
  }
  _ESClass.register(token);
  _es6_module.add_class(token);
  class tokdef  {
     constructor(name, regexpr, func, example) {
      this.name = name;
      this.re = regexpr;
      this.func = func;
      this.example = example;
      if (example===undefined&&regexpr) {
          let s=""+regexpr;
          if (s.startsWith("/")&&s.endsWith("/")) {
              s = s.slice(1, s.length-1);
          }
          if (s.startsWith("\\")) {
              s = s.slice(1, s.length);
          }
          s = s.trim();
          if (s.length===1) {
              this.example = s;
          }
      }
    }
  }
  _ESClass.register(tokdef);
  _es6_module.add_class(tokdef);
  class PUTIL_ParseError extends Error {
     constructor(msg) {
      super();
    }
  }
  _ESClass.register(PUTIL_ParseError);
  _es6_module.add_class(PUTIL_ParseError);
  class lexer  {
     constructor(tokdef, errfunc) {
      this.tokdef = tokdef;
      this.tokens = new Array();
      this.lexpos = 0;
      this.lexdata = "";
      this.colmap = undefined;
      this.lineno = 0;
      this.printTokens = false;
      this.linestart = 0;
      this.errfunc = errfunc;
      this.linemap = undefined;
      this.tokints = {};
      for (let i=0; i<tokdef.length; i++) {
          this.tokints[tokdef[i].name] = i;
      }
      this.statestack = [["__main__", 0]];
      this.states = {"__main__": [tokdef, errfunc]};
      this.statedata = 0;
      this.logger = function () {
        console.log(...arguments);
      };
    }
     add_state(name, tokdef, errfunc) {
      if (errfunc===undefined) {
          errfunc = function (lexer) {
            return true;
          };
      }
      this.states[name] = [tokdef, errfunc];
    }
     tok_int(name) {

    }
     push_state(state, statedata) {
      this.statestack.push([state, statedata]);
      state = this.states[state];
      this.statedata = statedata;
      this.tokdef = state[0];
      this.errfunc = state[1];
    }
     pop_state() {
      let item=this.statestack[this.statestack.length-1];
      let state=this.states[item[0]];
      this.tokdef = state[0];
      this.errfunc = state[1];
      this.statedata = item[1];
    }
     input(str) {
      let linemap=this.linemap = new Array(str.length);
      let lineno=0;
      let col=0;
      let colmap=this.colmap = new Array(str.length);
      for (let i=0; i<str.length; i++, col++) {
          let c=str[i];
          linemap[i] = lineno;
          colmap[i] = col;
          if (c==="\n") {
              lineno++;
              col = 0;
          }
      }
      while (this.statestack.length>1) {
        this.pop_state();
      }
      this.lexdata = str;
      this.lexpos = 0;
      this.lineno = 0;
      this.tokens = new Array();
      this.peeked_tokens = [];
    }
     error() {
      if (this.errfunc!==undefined&&!this.errfunc(this))
        return ;
      let safepos=Math.min(this.lexpos, this.lexdata.length-1);
      let line=this.linemap[safepos];
      let col=this.colmap[safepos];
      let s=print_lines(this.lexdata, line, col, true);
      this.logger("  "+s);
      this.logger("Syntax error near line "+(this.lineno+1));
      let next=Math.min(this.lexpos+8, this.lexdata.length);
      throw new PUTIL_ParseError("Parse error");
    }
     peek() {
      let tok=this.next(true);
      if (tok===undefined)
        return undefined;
      this.peeked_tokens.push(tok);
      return tok;
    }
     peeknext() {
      if (this.peeked_tokens.length>0) {
          return this.peeked_tokens[0];
      }
      return this.peek();
    }
     at_end() {
      return this.lexpos>=this.lexdata.length&&this.peeked_tokens.length===0;
    }
     next(ignore_peek) {
      if (!ignore_peek&&this.peeked_tokens.length>0) {
          let tok=this.peeked_tokens[0];
          this.peeked_tokens.shift();
          if (!ignore_peek&&this.printTokens) {
              this.logger(""+tok);
          }
          return tok;
      }
      if (this.lexpos>=this.lexdata.length)
        return undefined;
      let ts=this.tokdef;
      let tlen=ts.length;
      let lexdata=this.lexdata.slice(this.lexpos, this.lexdata.length);
      let results=[];
      for (var i=0; i<tlen; i++) {
          let t=ts[i];
          if (t.re===undefined)
            continue;
          let res=t.re.exec(lexdata);
          if (res!==null&&res!==undefined&&res.index===0) {
              results.push([t, res]);
          }
      }
      let max_res=0;
      let theres=undefined;
      for (var i=0; i<results.length; i++) {
          let res=results[i];
          if (res[1][0].length>max_res) {
              theres = res;
              max_res = res[1][0].length;
          }
      }
      if (theres===undefined) {
          this.error();
          return ;
      }
      let def=theres[0];
      let col=this.colmap[Math.min(this.lexpos, this.lexdata.length-1)];
      if (this.lexpos<this.lexdata.length) {
          this.lineno = this.linemap[this.lexpos];
      }
      let tok=new token(def.name, theres[1][0], this.lexpos, this.lineno, this, undefined, col);
      this.lexpos+=tok.value.length;
      if (def.func) {
          tok = def.func(tok);
          if (tok===undefined) {
              return this.next();
          }
      }
      if (!ignore_peek&&this.printTokens) {
          this.logger(""+tok);
      }
      return tok;
    }
  }
  _ESClass.register(lexer);
  _es6_module.add_class(lexer);
  class parser  {
     constructor(lexer, errfunc) {
      this.lexer = lexer;
      this.errfunc = errfunc;
      this.start = undefined;
      this.logger = function () {
        console.log(...arguments);
      };
    }
     parse(data, err_on_unconsumed) {
      if (err_on_unconsumed===undefined)
        err_on_unconsumed = true;
      if (data!==undefined)
        this.lexer.input(data);
      let ret=this.start(this);
      if (err_on_unconsumed&&!this.lexer.at_end()&&this.lexer.next()!==undefined) {
          this.error(undefined, "parser did not consume entire input");
      }
      return ret;
    }
     input(data) {
      this.lexer.input(data);
    }
     error(token, msg) {
      let estr;
      if (msg===undefined)
        msg = "";
      if (token===undefined)
        estr = "Parse error at end of input: "+msg;
      else 
        estr = `Parse error at line ${token.lineno + 1}:${token.col + 1}: ${msg}`;
      let buf="";
      let ld=this.lexer.lexdata;
      let lineno=token ? token.lineno : this.lexer.linemap[this.lexer.linemap.length-1];
      let col=token ? token.col : 0;
      ld = ld.replace(/\r/g, '');
      this.logger(print_lines(ld, lineno, col, true, token));
      this.logger(estr);
      if (this.errfunc&&!this.errfunc(token)) {
          return ;
      }
      throw new PUTIL_ParseError(estr);
    }
     peek() {
      let tok=this.lexer.peek();
      if (tok!==undefined)
        tok.parser = this;
      return tok;
    }
     peeknext() {
      let tok=this.lexer.peeknext();
      if (tok!==undefined)
        tok.parser = this;
      return tok;
    }
     next() {
      let tok=this.lexer.next();
      if (tok!==undefined)
        tok.parser = this;
      return tok;
    }
     optional(type) {
      let tok=this.peeknext();
      if (tok===undefined)
        return false;
      if (tok.type===type) {
          this.next();
          return true;
      }
      return false;
    }
     at_end() {
      return this.lexer.at_end();
    }
     expect(type, msg) {
      let tok=this.next();
      if (msg===undefined) {
          msg = type;
          for (let tk of this.lexer.tokdef) {
              if (tk.name===type&&tk.example) {
                  msg = tk.example;
              }
          }
      }
      if (tok===undefined||tok.type!==type) {
          this.error(tok, "Expected "+msg);
      }
      return tok.value;
    }
  }
  _ESClass.register(parser);
  _es6_module.add_class(parser);
  function test_parser() {
    let basic_types=new Set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string"]);
    let reserved_tokens=new Set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string", "static_string", "array"]);
    function tk(name, re, func) {
      return new tokdef(name, re, func);
    }
    let tokens=[tk("ID", /[a-zA-Z]+[a-zA-Z0-9_]*/, function (t) {
      if (reserved_tokens.has(t.value)) {
          t.type = t.value.toUpperCase();
      }
      return t;
    }), tk("OPEN", /\{/), tk("CLOSE", /}/), tk("COLON", /:/), tk("JSCRIPT", /\|/, function (t) {
      let js="";
      let lexer=t.lexer;
      while (lexer.lexpos<lexer.lexdata.length) {
        let c=lexer.lexdata[lexer.lexpos];
        if (c==="\n")
          break;
        js+=c;
        lexer.lexpos++;
      }
      if (js.endsWith(";")) {
          js = js.slice(0, js.length-1);
          lexer.lexpos--;
      }
      t.value = js;
      return t;
    }), tk("LPARAM", /\(/), tk("RPARAM", /\)/), tk("COMMA", /,/), tk("NUM", /[0-9]/), tk("SEMI", /;/), tk("NEWLINE", /\n/, function (t) {
      t.lexer.lineno+=1;
    }), tk("SPACE", / |\t/, function (t) {
    })];
    for (let rt of reserved_tokens) {
        tokens.push(tk(rt.toUpperCase()));
    }
    let a=`
  Loop {
    eid : int;
    flag : int;
    index : int;
    type : int;

    co : vec3;
    no : vec3;
    loop : int | eid(loop);
    edges : array(e, int) | e.eid;

    loops :, array(Loop);
  }
  `;
    function errfunc(lexer) {
      return true;
    }
    let lex=new lexer(tokens, errfunc);
    console.log("Testing lexical scanner...");
    lex.input(a);
    let token;
    while (token = lex.next()) {
      console.log(token.toString());
    }
    let parse=new parser(lex);
    parse.input(a);
    function p_Array(p) {
      p.expect("ARRAY");
      p.expect("LPARAM");
      let arraytype=p_Type(p);
      let itername="";
      if (p.optional("COMMA")) {
          itername = arraytype;
          arraytype = p_Type(p);
      }
      p.expect("RPARAM");
      return {type: "array", 
     data: {type: arraytype, 
      iname: itername}}
    }
    function p_Type(p) {
      let tok=p.peek();
      if (tok.type==="ID") {
          p.next();
          return {type: "struct", 
       data: "\""+tok.value+"\""}
      }
      else 
        if (basic_types.has(tok.type.toLowerCase())) {
          p.next();
          return {type: tok.type.toLowerCase()}
      }
      else 
        if (tok.type==="ARRAY") {
          return p_Array(p);
      }
      else {
        p.error(tok, "invalid type "+tok.type);
      }
    }
    function p_Field(p) {
      let field={}
      console.log("-----", p.peek().type);
      field.name = p.expect("ID", "struct field name");
      p.expect("COLON");
      field.type = p_Type(p);
      field.set = undefined;
      field.get = undefined;
      let tok=p.peek();
      if (tok.type==="JSCRIPT") {
          field.get = tok.value;
          p.next();
      }
      tok = p.peek();
      if (tok.type==="JSCRIPT") {
          field.set = tok.value;
          p.next();
      }
      p.expect("SEMI");
      return field;
    }
    function p_Struct(p) {
      let st={}
      st.name = p.expect("ID", "struct name");
      st.fields = [];
      p.expect("OPEN");
      while (1) {
        if (p.at_end()) {
            p.error(undefined);
        }
        else 
          if (p.optional("CLOSE")) {
            break;
        }
        else {
          st.fields.push(p_Field(p));
        }
      }
      return st;
    }
    let ret=p_Struct(parse);
    console.log(JSON.stringify(ret));
  }
  var struct_parseutil=Object.freeze({__proto__: null, 
   token: token, 
   tokdef: tokdef, 
   PUTIL_ParseError: PUTIL_ParseError, 
   lexer: lexer, 
   parser: parser});
  "use strict";
  class NStruct  {
     constructor(name) {
      this.fields = [];
      this.id = -1;
      this.name = name;
    }
  }
  _ESClass.register(NStruct);
  _es6_module.add_class(NStruct);
  const StructEnum={INT: 0, 
   FLOAT: 1, 
   DOUBLE: 2, 
   STRING: 7, 
   STATIC_STRING: 8, 
   STRUCT: 9, 
   TSTRUCT: 10, 
   ARRAY: 11, 
   ITER: 12, 
   SHORT: 13, 
   BYTE: 14, 
   BOOL: 15, 
   ITERKEYS: 16, 
   UINT: 17, 
   USHORT: 18, 
   STATIC_ARRAY: 19, 
   SIGNED_BYTE: 20}
  const ArrayTypes=new Set([StructEnum.STATIC_ARRAY, StructEnum.ARRAY, StructEnum.ITERKEYS, StructEnum.ITER]);
  const ValueTypes=new Set([StructEnum.INT, StructEnum.FLOAT, StructEnum.DOUBLE, StructEnum.STRING, StructEnum.STATIC_STRING, StructEnum.SHORT, StructEnum.BYTE, StructEnum.BOOL, StructEnum.UINT, StructEnum.USHORT, StructEnum.SIGNED_BYTE]);
  let StructTypes={"int": StructEnum.INT, 
   "uint": StructEnum.UINT, 
   "ushort": StructEnum.USHORT, 
   "float": StructEnum.FLOAT, 
   "double": StructEnum.DOUBLE, 
   "string": StructEnum.STRING, 
   "static_string": StructEnum.STATIC_STRING, 
   "struct": StructEnum.STRUCT, 
   "abstract": StructEnum.TSTRUCT, 
   "array": StructEnum.ARRAY, 
   "iter": StructEnum.ITER, 
   "short": StructEnum.SHORT, 
   "byte": StructEnum.BYTE, 
   "bool": StructEnum.BOOL, 
   "iterkeys": StructEnum.ITERKEYS, 
   "sbyte": StructEnum.SIGNED_BYTE}
  let StructTypeMap={}
  for (let k in StructTypes) {
      StructTypeMap[StructTypes[k]] = k;
  }
  function gen_tabstr(t) {
    let s="";
    for (let i=0; i<t; i++) {
        s+="  ";
    }
    return s;
  }
  function stripComments(buf) {
    let s='';
    const MAIN=0, COMMENT=1, STR=2;
    let p, n;
    let strs=new Set(["'", '"', "`"]);
    let mode=MAIN;
    let strlit;
    let escape=false;
    for (let i=0; i<buf.length; i++) {
        let p=i>0 ? buf[i-1] : undefined;
        let c=buf[i];
        let n=i<buf.length-1 ? buf[i+1] : undefined;
        switch (mode) {
          case MAIN:
            if (c==="/"&&n==="/") {
                mode = COMMENT;
                continue;
            }
            if (strs.has(c)) {
                strlit = c;
                mode = STR;
            }
            s+=c;
            break;
          case COMMENT:
            if (n==="\n") {
                mode = MAIN;
            }
            break;
          case STR:
            if (c===strlit&&!escape) {
                mode = MAIN;
            }
            s+=c;
            break;
        }
        if (c==="\\") {
            escape^=true;
        }
        else {
          escape = false;
        }
    }
    return s;
  }
  function StructParser() {
    let basic_types=new Set(["int", "float", "double", "string", "short", "byte", "sbyte", "bool", "uint", "ushort"]);
    let reserved_tokens=new Set(["int", "float", "double", "string", "static_string", "array", "iter", "abstract", "short", "byte", "sbyte", "bool", "iterkeys", "uint", "ushort", "static_array"]);
    function tk(name, re, func) {
      return new tokdef(name, re, func);
    }
    let tokens=[tk("ID", /[a-zA-Z_$]+[a-zA-Z0-9_\.$]*/, function (t) {
      if (reserved_tokens.has(t.value)) {
          t.type = t.value.toUpperCase();
      }
      return t;
    }, "identifier"), tk("OPEN", /\{/), tk("EQUALS", /=/), tk("CLOSE", /}/), tk("STRLIT", /\"[^"]*\"/, (t) =>      {
      t.value = t.value.slice(1, t.value.length-1);
      return t;
    }), tk("STRLIT", /\'[^']*\'/, (t) =>      {
      t.value = t.value.slice(1, t.value.length-1);
      return t;
    }), tk("COLON", /:/), tk("SOPEN", /\[/), tk("SCLOSE", /\]/), tk("JSCRIPT", /\|/, function (t) {
      let js="";
      let lexer=t.lexer;
      let p;
      while (lexer.lexpos<lexer.lexdata.length) {
        let c=lexer.lexdata[lexer.lexpos];
        if (c==="\n")
          break;
        if (c==="/"&&p==="/") {
            js = js.slice(0, js.length-1);
            lexer.lexpos--;
            break;
        }
        js+=c;
        lexer.lexpos++;
        p = c;
      }
      while (js.trim().endsWith(";")) {
        js = js.slice(0, js.length-1);
        lexer.lexpos--;
      }
      t.value = js.trim();
      return t;
    }), tk("COMMENT", /\/\/.*[\n\r]/), tk("LPARAM", /\(/), tk("RPARAM", /\)/), tk("COMMA", /,/), tk("NUM", /[0-9]+/, undefined, "number"), tk("SEMI", /;/), tk("NEWLINE", /\n/, function (t) {
      t.lexer.lineno+=1;
    }, "newline"), tk("SPACE", / |\t/, function (t) {
    }, "whitespace")];
    reserved_tokens.forEach(function (rt) {
      tokens.push(tk(rt.toUpperCase()));
    });
    function errfunc(lexer) {
      return true;
    }
    class Lexer extends lexer {
       input(str) {
        return super.input(str);
      }
    }
    _ESClass.register(Lexer);
    _es6_module.add_class(Lexer);
    let lex=new Lexer(tokens, errfunc);
    let parser$1=new parser(lex);
    function p_Static_String(p) {
      p.expect("STATIC_STRING");
      p.expect("SOPEN");
      let num=p.expect("NUM");
      p.expect("SCLOSE");
      return {type: StructEnum.STATIC_STRING, 
     data: {maxlength: num}}
    }
    function p_DataRef(p) {
      p.expect("DATAREF");
      p.expect("LPARAM");
      let tname=p.expect("ID");
      p.expect("RPARAM");
      return {type: StructEnum.DATAREF, 
     data: tname}
    }
    function p_Array(p) {
      p.expect("ARRAY");
      p.expect("LPARAM");
      let arraytype=p_Type(p);
      let itername="";
      if (p.optional("COMMA")) {
          itername = arraytype.data.replace(/"/g, "");
          arraytype = p_Type(p);
      }
      p.expect("RPARAM");
      return {type: StructEnum.ARRAY, 
     data: {type: arraytype, 
      iname: itername}}
    }
    function p_Iter(p) {
      p.expect("ITER");
      p.expect("LPARAM");
      let arraytype=p_Type(p);
      let itername="";
      if (p.optional("COMMA")) {
          itername = arraytype.data.replace(/"/g, "");
          arraytype = p_Type(p);
      }
      p.expect("RPARAM");
      return {type: StructEnum.ITER, 
     data: {type: arraytype, 
      iname: itername}}
    }
    function p_StaticArray(p) {
      p.expect("STATIC_ARRAY");
      p.expect("SOPEN");
      let arraytype=p_Type(p);
      let itername="";
      p.expect("COMMA");
      let size=p.expect("NUM");
      if (size<0||Math.abs(size-Math.floor(size))>1e-06) {
          console.log(Math.abs(size-Math.floor(size)));
          p.error("Expected an integer");
      }
      size = Math.floor(size);
      if (p.optional("COMMA")) {
          itername = p_Type(p).data;
      }
      p.expect("SCLOSE");
      return {type: StructEnum.STATIC_ARRAY, 
     data: {type: arraytype, 
      size: size, 
      iname: itername}}
    }
    function p_IterKeys(p) {
      p.expect("ITERKEYS");
      p.expect("LPARAM");
      let arraytype=p_Type(p);
      let itername="";
      if (p.optional("COMMA")) {
          itername = arraytype.data.replace(/"/g, "");
          arraytype = p_Type(p);
      }
      p.expect("RPARAM");
      return {type: StructEnum.ITERKEYS, 
     data: {type: arraytype, 
      iname: itername}}
    }
    function p_Abstract(p) {
      p.expect("ABSTRACT");
      p.expect("LPARAM");
      let type=p.expect("ID");
      let jsonKeyword="_structName";
      if (p.optional("COMMA")) {
          jsonKeyword = p.expect("STRLIT");
      }
      p.expect("RPARAM");
      return {type: StructEnum.TSTRUCT, 
     data: type, 
     jsonKeyword: jsonKeyword}
    }
    function p_Type(p) {
      let tok=p.peeknext();
      if (tok.type==="ID") {
          p.next();
          return {type: StructEnum.STRUCT, 
       data: tok.value}
      }
      else 
        if (basic_types.has(tok.type.toLowerCase())) {
          p.next();
          return {type: StructTypes[tok.type.toLowerCase()]}
      }
      else 
        if (tok.type==="ARRAY") {
          return p_Array(p);
      }
      else 
        if (tok.type==="ITER") {
          return p_Iter(p);
      }
      else 
        if (tok.type==="ITERKEYS") {
          return p_IterKeys(p);
      }
      else 
        if (tok.type==="STATIC_ARRAY") {
          return p_StaticArray(p);
      }
      else 
        if (tok.type==="STATIC_STRING") {
          return p_Static_String(p);
      }
      else 
        if (tok.type==="ABSTRACT") {
          return p_Abstract(p);
      }
      else 
        if (tok.type==="DATAREF") {
          return p_DataRef(p);
      }
      else {
        p.error(tok, "invalid type "+tok.type);
      }
    }
    function p_ID_or_num(p) {
      let t=p.peeknext();
      if (t.type==="NUM") {
          p.next();
          return t.value;
      }
      else {
        return p.expect("ID", "struct field name");
      }
    }
    function p_Field(p) {
      let field={}
      field.name = p_ID_or_num(p);
      p.expect("COLON");
      field.type = p_Type(p);
      field.set = undefined;
      field.get = undefined;
      let check=0;
      let tok=p.peeknext();
      if (tok&&tok.type==="JSCRIPT") {
          field.get = tok.value;
          check = 1;
          p.next();
          tok = p.peeknext();
      }
      if (tok&&tok.type==="JSCRIPT") {
          check = 1;
          field.set = tok.value;
          p.next();
      }
      p.expect("SEMI");
      tok = p.peeknext();
      if (tok&&tok.type==="COMMENT") {
          field.comment = tok.value;
          p.next();
      }
      else {
        field.comment = "";
      }
      return field;
    }
    function p_Struct(p) {
      let name=p.expect("ID", "struct name");
      let st=new NStruct(name);
      let tok=p.peeknext();
      let id=-1;
      if (tok.type==="ID"&&tok.value==="id") {
          p.next();
          p.expect("EQUALS");
          st.id = p.expect("NUM");
      }
      p.expect("OPEN");
      while (1) {
        if (p.at_end()) {
            p.error(undefined);
        }
        else 
          if (p.optional("CLOSE")) {
            break;
        }
        else {
          st.fields.push(p_Field(p));
        }
      }
      return st;
    }
    parser$1.start = p_Struct;
    return parser$1;
  }
  const struct_parse=StructParser();
  var struct_parser=Object.freeze({__proto__: null, 
   NStruct: NStruct, 
   StructEnum: StructEnum, 
   ArrayTypes: ArrayTypes, 
   ValueTypes: ValueTypes, 
   StructTypes: StructTypes, 
   StructTypeMap: StructTypeMap, 
   stripComments: stripComments, 
   struct_parse: struct_parse});
  var struct_typesystem=Object.freeze({__proto__: null});
  "use strict";
  var STRUCT_ENDIAN=true;
  function setBinaryEndian(mode) {
    STRUCT_ENDIAN = !!mode;
  }
  let temp_dataview=new DataView(new ArrayBuffer(16));
  let uint8_view=new Uint8Array(temp_dataview.buffer);
  class unpack_context  {
     constructor() {
      this.i = 0;
    }
  }
  _ESClass.register(unpack_context);
  _es6_module.add_class(unpack_context);
  function pack_byte(array, val) {
    array.push(val);
  }
  function pack_sbyte(array, val) {
    if (val<0) {
        val = 256+val;
    }
    array.push(val);
  }
  function pack_bytes(array, bytes) {
    for (let i=0; i<bytes.length; i++) {
        array.push(bytes[i]);
    }
  }
  function pack_int(array, val) {
    temp_dataview.setInt32(0, val, STRUCT_ENDIAN);
    array.push(uint8_view[0]);
    array.push(uint8_view[1]);
    array.push(uint8_view[2]);
    array.push(uint8_view[3]);
  }
  function pack_uint(array, val) {
    temp_dataview.setUint32(0, val, STRUCT_ENDIAN);
    array.push(uint8_view[0]);
    array.push(uint8_view[1]);
    array.push(uint8_view[2]);
    array.push(uint8_view[3]);
  }
  function pack_ushort(array, val) {
    temp_dataview.setUint16(0, val, STRUCT_ENDIAN);
    array.push(uint8_view[0]);
    array.push(uint8_view[1]);
  }
  function pack_float(array, val) {
    temp_dataview.setFloat32(0, val, STRUCT_ENDIAN);
    array.push(uint8_view[0]);
    array.push(uint8_view[1]);
    array.push(uint8_view[2]);
    array.push(uint8_view[3]);
  }
  function pack_double(array, val) {
    temp_dataview.setFloat64(0, val, STRUCT_ENDIAN);
    array.push(uint8_view[0]);
    array.push(uint8_view[1]);
    array.push(uint8_view[2]);
    array.push(uint8_view[3]);
    array.push(uint8_view[4]);
    array.push(uint8_view[5]);
    array.push(uint8_view[6]);
    array.push(uint8_view[7]);
  }
  function pack_short(array, val) {
    temp_dataview.setInt16(0, val, STRUCT_ENDIAN);
    array.push(uint8_view[0]);
    array.push(uint8_view[1]);
  }
  function encode_utf8(arr, str) {
    for (let i=0; i<str.length; i++) {
        let c=str.charCodeAt(i);
        while (c!==0) {
          let uc=c&127;
          c = c>>7;
          if (c!==0)
            uc|=128;
          arr.push(uc);
        }
    }
  }
  function decode_utf8(arr) {
    let str="";
    let i=0;
    while (i<arr.length) {
      let c=arr[i];
      let sum=c&127;
      let j=0;
      let lasti=i;
      while (i<arr.length&&(c&128)) {
        j+=7;
        i++;
        c = arr[i];
        c = (c&127)<<j;
        sum|=c;
      }
      if (sum===0)
        break;
      str+=String.fromCharCode(sum);
      i++;
    }
    return str;
  }
  function test_utf8() {
    let s="a"+String.fromCharCode(8800)+"b";
    let arr=[];
    encode_utf8(arr, s);
    let s2=decode_utf8(arr);
    if (s!==s2) {
        throw new Error("UTF-8 encoding/decoding test failed");
    }
    return true;
  }
  function truncate_utf8(arr, maxlen) {
    let len=Math.min(arr.length, maxlen);
    let last_codepoint=0;
    let last2=0;
    let incode=false;
    let i=0;
    let code=0;
    while (i<len) {
      incode = arr[i]&128;
      if (!incode) {
          last2 = last_codepoint+1;
          last_codepoint = i+1;
      }
      i++;
    }
    if (last_codepoint<maxlen)
      arr.length = last_codepoint;
    else 
      arr.length = last2;
    return arr;
  }
  let _static_sbuf_ss=new Array(2048);
  function pack_static_string(data, str, length) {
    if (length===undefined)
      throw new Error("'length' paremter is not optional for pack_static_string()");
    let arr=length<2048 ? _static_sbuf_ss : new Array();
    arr.length = 0;
    encode_utf8(arr, str);
    truncate_utf8(arr, length);
    for (let i=0; i<length; i++) {
        if (i>=arr.length) {
            data.push(0);
        }
        else {
          data.push(arr[i]);
        }
    }
  }
  let _static_sbuf=new Array(32);
  function pack_string(data, str) {
    _static_sbuf.length = 0;
    encode_utf8(_static_sbuf, str);
    pack_int(data, _static_sbuf.length);
    for (let i=0; i<_static_sbuf.length; i++) {
        data.push(_static_sbuf[i]);
    }
  }
  function unpack_bytes(dview, uctx, len) {
    let ret=new DataView(dview.buffer.slice(uctx.i, uctx.i+len));
    uctx.i+=len;
    return ret;
  }
  function unpack_byte(dview, uctx) {
    return dview.getUint8(uctx.i++);
  }
  function unpack_sbyte(dview, uctx) {
    return dview.getInt8(uctx.i++);
  }
  function unpack_int(dview, uctx) {
    uctx.i+=4;
    return dview.getInt32(uctx.i-4, STRUCT_ENDIAN);
  }
  function unpack_uint(dview, uctx) {
    uctx.i+=4;
    return dview.getUint32(uctx.i-4, STRUCT_ENDIAN);
  }
  function unpack_ushort(dview, uctx) {
    uctx.i+=2;
    return dview.getUint16(uctx.i-2, STRUCT_ENDIAN);
  }
  function unpack_float(dview, uctx) {
    uctx.i+=4;
    return dview.getFloat32(uctx.i-4, STRUCT_ENDIAN);
  }
  function unpack_double(dview, uctx) {
    uctx.i+=8;
    return dview.getFloat64(uctx.i-8, STRUCT_ENDIAN);
  }
  function unpack_short(dview, uctx) {
    uctx.i+=2;
    return dview.getInt16(uctx.i-2, STRUCT_ENDIAN);
  }
  let _static_arr_us=new Array(32);
  function unpack_string(data, uctx) {
    let slen=unpack_int(data, uctx);
    if (!slen) {
        return "";
    }
    let str="";
    let arr=slen<2048 ? _static_arr_us : new Array(slen);
    arr.length = slen;
    for (let i=0; i<slen; i++) {
        arr[i] = unpack_byte(data, uctx);
    }
    return decode_utf8(arr);
  }
  let _static_arr_uss=new Array(2048);
  function unpack_static_string(data, uctx, length) {
    let str="";
    if (length===undefined)
      throw new Error("'length' cannot be undefined in unpack_static_string()");
    let arr=length<2048 ? _static_arr_uss : new Array(length);
    arr.length = 0;
    let done=false;
    for (let i=0; i<length; i++) {
        let c=unpack_byte(data, uctx);
        if (c===0) {
            done = true;
        }
        if (!done&&c!==0) {
            arr.push(c);
        }
    }
    truncate_utf8(arr, length);
    return decode_utf8(arr);
  }
  var struct_binpack=Object.freeze({__proto__: null, 
   get STRUCT_ENDIAN() {
      return STRUCT_ENDIAN;
    }, 
   setBinaryEndian: setBinaryEndian, 
   temp_dataview: temp_dataview, 
   uint8_view: uint8_view, 
   unpack_context: unpack_context, 
   pack_byte: pack_byte, 
   pack_sbyte: pack_sbyte, 
   pack_bytes: pack_bytes, 
   pack_int: pack_int, 
   pack_uint: pack_uint, 
   pack_ushort: pack_ushort, 
   pack_float: pack_float, 
   pack_double: pack_double, 
   pack_short: pack_short, 
   encode_utf8: encode_utf8, 
   decode_utf8: decode_utf8, 
   test_utf8: test_utf8, 
   pack_static_string: pack_static_string, 
   pack_string: pack_string, 
   unpack_bytes: unpack_bytes, 
   unpack_byte: unpack_byte, 
   unpack_sbyte: unpack_sbyte, 
   unpack_int: unpack_int, 
   unpack_uint: unpack_uint, 
   unpack_ushort: unpack_ushort, 
   unpack_float: unpack_float, 
   unpack_double: unpack_double, 
   unpack_short: unpack_short, 
   unpack_string: unpack_string, 
   unpack_static_string: unpack_static_string});
  let warninglvl=2;
  let debug=0;
  let _static_envcode_null="";
  let packer_debug, packer_debug_start, packer_debug_end;
  let packdebug_tablevel=0;
  function _get_pack_debug() {
    return {packer_debug: packer_debug, 
    packer_debug_start: packer_debug_start, 
    packer_debug_end: packer_debug_end, 
    debug: debug, 
    warninglvl: warninglvl}
  }
  class cachering extends Array {
     constructor(cb, tot) {
      super();
      this.length = tot;
      this.cur = 0;
      for (let i=0; i<tot; i++) {
          this[i] = cb();
      }
    }
    static  fromConstructor(cls, tot) {
      return new cachering(() =>        {
        return new cls();
      }, tot);
    }
     next() {
      let ret=this[this.cur];
      this.cur = (this.cur+1)%this.length;
      return ret;
    }
  }
  _ESClass.register(cachering);
  _es6_module.add_class(cachering);
  function gen_tabstr$1(tot) {
    let ret="";
    for (let i=0; i<tot; i++) {
        ret+=" ";
    }
    return ret;
  }
  function setWarningMode2(t) {
    if (typeof t!=="number"||isNaN(t)) {
        throw new Error("Expected a single number (>= 0) argument to setWarningMode");
    }
    warninglvl = t;
  }
  function setDebugMode2(t) {
    debug = t;
    if (debug) {
        packer_debug = function () {
          let tab=gen_tabstr$1(packdebug_tablevel);
          if (arguments.length>0) {
              console.warn(tab, ...arguments);
          }
          else {
            console.warn("Warning: undefined msg");
          }
        };
        packer_debug_start = function (funcname) {
          packer_debug("Start "+funcname);
          packdebug_tablevel++;
        };
        packer_debug_end = function (funcname) {
          packdebug_tablevel--;
          if (funcname) {
              packer_debug("Leave "+funcname);
          }
        };
    }
    else {
      packer_debug = function () {
      };
      packer_debug_start = function () {
      };
      packer_debug_end = function () {
      };
    }
  }
  setDebugMode2(debug);
  const StructFieldTypes=[];
  const StructFieldTypeMap={}
  function packNull(manager, data, field, type) {
    StructFieldTypeMap[type.type].packNull(manager, data, field, type);
  }
  function toJSON(manager, val, obj, field, type) {
    return StructFieldTypeMap[type.type].toJSON(manager, val, obj, field, type);
  }
  function fromJSON(manager, val, obj, field, type, instance) {
    return StructFieldTypeMap[type.type].fromJSON(manager, val, obj, field, type, instance);
  }
  function formatJSON(manager, val, obj, field, type, instance, tlvl) {
    if (tlvl===undefined) {
        tlvl = 0;
    }
    return StructFieldTypeMap[type.type].formatJSON(manager, val, obj, field, type, instance, tlvl);
  }
  function validateJSON(manager, val, obj, field, type, instance, _abstractKey) {
    return StructFieldTypeMap[type.type].validateJSON(manager, val, obj, field, type, instance, _abstractKey);
  }
  function unpack_field(manager, data, type, uctx) {
    let name;
    if (debug) {
        name = StructFieldTypeMap[type.type].define().name;
        packer_debug_start("R "+name);
    }
    let ret=StructFieldTypeMap[type.type].unpack(manager, data, type, uctx);
    if (debug) {
        packer_debug_end();
    }
    return ret;
  }
  let fakeFields=new cachering(() =>    {
    return {type: undefined, 
    get: undefined, 
    set: undefined}
  }, 256);
  function fmt_type(type) {
    return StructFieldTypeMap[type.type].format(type);
  }
  function do_pack(manager, data, val, obj, field, type) {
    let name;
    if (debug) {
        name = StructFieldTypeMap[type.type].define().name;
        packer_debug_start("W "+name);
    }
    let typeid=type;
    if (typeof typeid!=="number") {
        typeid = typeid.type;
    }
    let ret=StructFieldTypeMap[typeid].pack(manager, data, val, obj, field, type);
    if (debug) {
        packer_debug_end();
    }
    return ret;
  }
  let _ws_env=[[undefined, undefined]];
  class StructFieldType  {
    static  pack(manager, data, val, obj, field, type) {

    }
    static  unpack(manager, data, type, uctx) {

    }
    static  packNull(manager, data, field, type) {
      this.pack(manager, data, 0, 0, field, type);
    }
    static  format(type) {
      return this.define().name;
    }
    static  toJSON(manager, val, obj, field, type) {
      return val;
    }
    static  fromJSON(manager, val, obj, field, type, instance) {
      return val;
    }
    static  formatJSON(manager, val, obj, field, type, instance, tlvl) {
      return JSON.stringify(val);
    }
    static  validateJSON(manager, val, obj, field, type, instance, _abstractKey) {
      return true;
    }
    static  useHelperJS(field) {
      return true;
    }
    static  define() {
      return {type: -1, 
     name: "(error)"}
    }
    static  register(cls) {
      if (StructFieldTypes.indexOf(cls)>=0) {
          throw new Error("class already registered");
      }
      if (cls.define===StructFieldType.define) {
          throw new Error("you forgot to make a define() static method");
      }
      if (cls.define().type===undefined) {
          throw new Error("cls.define().type was undefined!");
      }
      if (cls.define().type in StructFieldTypeMap) {
          throw new Error("type "+cls.define().type+" is used by another StructFieldType subclass");
      }
      StructFieldTypes.push(cls);
      StructFieldTypeMap[cls.define().type] = cls;
    }
  }
  _ESClass.register(StructFieldType);
  _es6_module.add_class(StructFieldType);
  class StructIntField extends StructFieldType {
    static  pack(manager, data, val, obj, field, type) {
      pack_int(data, val);
    }
    static  unpack(manager, data, type, uctx) {
      return unpack_int(data, uctx);
    }
    static  validateJSON(manager, val, obj, field, type, instance) {
      if (typeof val!=="number"||val!==Math.floor(val)) {
          return ""+val+" is not an integer";
      }
      return true;
    }
    static  define() {
      return {type: StructEnum.INT, 
     name: "int"}
    }
  }
  _ESClass.register(StructIntField);
  _es6_module.add_class(StructIntField);
  StructFieldType.register(StructIntField);
  class StructFloatField extends StructFieldType {
    static  pack(manager, data, val, obj, field, type) {
      pack_float(data, val);
    }
    static  unpack(manager, data, type, uctx) {
      return unpack_float(data, uctx);
    }
    static  validateJSON(manager, val, obj, field, type, instance, _abstractKey) {
      if (typeof val!=="number") {
          return "Not a float: "+val;
      }
      return true;
    }
    static  define() {
      return {type: StructEnum.FLOAT, 
     name: "float"}
    }
  }
  _ESClass.register(StructFloatField);
  _es6_module.add_class(StructFloatField);
  StructFieldType.register(StructFloatField);
  class StructDoubleField extends StructFieldType {
    static  pack(manager, data, val, obj, field, type) {
      pack_double(data, val);
    }
    static  unpack(manager, data, type, uctx) {
      return unpack_double(data, uctx);
    }
    static  validateJSON(manager, val, obj, field, type, instance) {
      if (typeof val!=="number") {
          return "Not a double: "+val;
      }
      return true;
    }
    static  define() {
      return {type: StructEnum.DOUBLE, 
     name: "double"}
    }
  }
  _ESClass.register(StructDoubleField);
  _es6_module.add_class(StructDoubleField);
  StructFieldType.register(StructDoubleField);
  class StructStringField extends StructFieldType {
    static  pack(manager, data, val, obj, field, type) {
      val = !val ? "" : val;
      pack_string(data, val);
    }
    static  validateJSON(manager, val, obj, field, type, instance) {
      if (typeof val!=="string") {
          return "Not a string: "+val;
      }
      return true;
    }
    static  packNull(manager, data, field, type) {
      this.pack(manager, data, "", 0, field, type);
    }
    static  unpack(manager, data, type, uctx) {
      return unpack_string(data, uctx);
    }
    static  define() {
      return {type: StructEnum.STRING, 
     name: "string"}
    }
  }
  _ESClass.register(StructStringField);
  _es6_module.add_class(StructStringField);
  StructFieldType.register(StructStringField);
  class StructStaticStringField extends StructFieldType {
    static  pack(manager, data, val, obj, field, type) {
      val = !val ? "" : val;
      pack_static_string(data, val, type.data.maxlength);
    }
    static  validateJSON(manager, val, obj, field, type, instance) {
      if (typeof val!=="string") {
          return "Not a string: "+val;
      }
      if (val.length>type.data.maxlength) {
          return "String is too big; limit is "+type.data.maxlength+"; string:"+val;
      }
      return true;
    }
    static  format(type) {
      return `static_string[${type.data.maxlength}]`;
    }
    static  packNull(manager, data, field, type) {
      this.pack(manager, data, "", 0, field, type);
    }
    static  unpack(manager, data, type, uctx) {
      return unpack_static_string(data, uctx, type.data.maxlength);
    }
    static  define() {
      return {type: StructEnum.STATIC_STRING, 
     name: "static_string"}
    }
  }
  _ESClass.register(StructStaticStringField);
  _es6_module.add_class(StructStaticStringField);
  StructFieldType.register(StructStaticStringField);
  class StructStructField extends StructFieldType {
    static  pack(manager, data, val, obj, field, type) {
      let stt=manager.get_struct(type.data);
      packer_debug("struct", stt.name);
      manager.write_struct(data, val, stt);
    }
    static  validateJSON(manager, val, obj, field, type, instance, _abstractKey) {
      let stt=manager.get_struct(type.data);
      if (!val) {
          return "Expected "+stt.name+" object";
      }
      return manager.validateJSONIntern(val, stt, _abstractKey);
    }
    static  format(type) {
      return type.data;
    }
    static  fromJSON(manager, val, obj, field, type, instance) {
      let stt=manager.get_struct(type.data);
      return manager.readJSON(val, stt, instance);
    }
    static  formatJSON(manager, val, obj, field, type, instance, tlvl) {
      let stt=manager.get_struct(type.data);
      return manager.formatJSON_intern(val, stt, field, tlvl);
    }
    static  toJSON(manager, val, obj, field, type) {
      let stt=manager.get_struct(type.data);
      return manager.writeJSON(val, stt);
    }
    static  unpackInto(manager, data, type, uctx, dest) {
      let cls2=manager.get_struct_cls(type.data);
      packer_debug("struct", cls2 ? cls2.name : "(error)");
      return manager.read_object(data, cls2, uctx, dest);
    }
    static  packNull(manager, data, field, type) {
      let stt=manager.get_struct(type.data);
      packer_debug("struct", type);
      for (let field2 of stt.fields) {
          let type2=field2.type;
          packNull(manager, data, field2, type2);
      }
    }
    static  unpack(manager, data, type, uctx) {
      let cls2=manager.get_struct_cls(type.data);
      packer_debug("struct", cls2 ? cls2.name : "(error)");
      return manager.read_object(data, cls2, uctx);
    }
    static  define() {
      return {type: StructEnum.STRUCT, 
     name: "struct"}
    }
  }
  _ESClass.register(StructStructField);
  _es6_module.add_class(StructStructField);
  StructFieldType.register(StructStructField);
  class StructTStructField extends StructFieldType {
    static  pack(manager, data, val, obj, field, type) {
      let cls=manager.get_struct_cls(type.data);
      let stt=manager.get_struct(type.data);
      const keywords=manager.constructor.keywords;
      if (val.constructor.structName!==type.data&&(__instance_of(val, cls))) {
          stt = manager.get_struct(val.constructor.structName);
      }
      else 
        if (val.constructor.structName===type.data) {
          stt = manager.get_struct(type.data);
      }
      else {
        console.trace();
        throw new Error("Bad struct "+val.constructor.structName+" passed to write_struct");
      }
      packer_debug("int "+stt.id);
      pack_int(data, stt.id);
      manager.write_struct(data, val, stt);
    }
    static  validateJSON(manager, val, obj, field, type, instance, _abstractKey) {
      let key=type.jsonKeyword;
      if (typeof val!=="object") {
          return typeof val+" is not an object";
      }
      let stt=manager.get_struct(val[key]);
      let cls=manager.get_struct_cls(stt.name);
      let parentcls=manager.get_struct_cls(type.data);
      let ok=false;
      do {
        if (cls===parentcls) {
            ok = true;
            break;
        }
        cls = cls.prototype.__proto__.constructor;
      } while (cls&&cls!==Object);
      
      if (!ok) {
          return stt.name+" is not a child class off "+type.data;
      }
      return manager.validateJSONIntern(val, stt, type.jsonKeyword);
    }
    static  fromJSON(manager, val, obj, field, type, instance) {
      let key=type.jsonKeyword;
      let stt=manager.get_struct(val[key]);
      return manager.readJSON(val, stt, instance);
    }
    static  formatJSON(manager, val, obj, field, type, instance, tlvl) {
      let key=type.jsonKeyword;
      let stt=manager.get_struct(val[key]);
      return manager.formatJSON_intern(val, stt, field, tlvl);
    }
    static  toJSON(manager, val, obj, field, type) {
      const keywords=manager.constructor.keywords;
      let stt=manager.get_struct(val.constructor.structName);
      let ret=manager.writeJSON(val, stt);
      ret[type.jsonKeyword] = ""+stt.name;
      return ret;
    }
    static  packNull(manager, data, field, type) {
      let stt=manager.get_struct(type.data);
      pack_int(data, stt.id);
      packNull(manager, data, field, {type: StructEnum.STRUCT, 
     data: type.data});
    }
    static  format(type) {
      return "abstract("+type.data+")";
    }
    static  unpackInto(manager, data, type, uctx, dest) {
      let id=unpack_int(data, uctx);
      packer_debug("-int "+id);
      if (!(id in manager.struct_ids)) {
          packer_debug("tstruct id: "+id);
          console.trace();
          console.log(id);
          console.log(manager.struct_ids);
          throw new Error("Unknown struct type "+id+".");
      }
      let cls2=manager.get_struct_id(id);
      packer_debug("struct name: "+cls2.name);
      cls2 = manager.struct_cls[cls2.name];
      return manager.read_object(data, cls2, uctx, dest);
    }
    static  unpack(manager, data, type, uctx) {
      let id=unpack_int(data, uctx);
      packer_debug("-int "+id);
      if (!(id in manager.struct_ids)) {
          packer_debug("tstruct id: "+id);
          console.trace();
          console.log(id);
          console.log(manager.struct_ids);
          throw new Error("Unknown struct type "+id+".");
      }
      let cls2=manager.get_struct_id(id);
      packer_debug("struct name: "+cls2.name);
      cls2 = manager.struct_cls[cls2.name];
      return manager.read_object(data, cls2, uctx);
    }
    static  define() {
      return {type: StructEnum.TSTRUCT, 
     name: "tstruct"}
    }
  }
  _ESClass.register(StructTStructField);
  _es6_module.add_class(StructTStructField);
  StructFieldType.register(StructTStructField);
  function formatArrayJson(manager, val, obj, field, type, type2, instance, tlvl, array) {
    if (array===undefined) {
        array = val;
    }
    if (array===undefined||array===null||typeof array!=="object"||!array[Symbol.iterator]) {
        console.log(obj);
        console.log(array);
        throw new Error(`Expected an array for ${field.name}`);
    }
    if (ValueTypes.has(type2.type)) {
        return JSON.stringify(array);
    }
    let s='[';
    if (manager.formatCtx.addComments&&field.comment.trim()) {
        s+=" "+field.comment.trim();
    }
    s+="\n";
    for (let i=0; i<array.length; i++) {
        let item=array[i];
        s+=tab(tlvl+1)+formatJSON(manager, item, val, field, type2, instance, tlvl+1)+",\n";
    }
    s+=tab(tlvl)+"]";
    return s;
  }
  class StructArrayField extends StructFieldType {
    static  pack(manager, data, val, obj, field, type) {
      if (val===undefined) {
          console.trace();
          console.log("Undefined array fed to struct struct packer!");
          console.log("Field: ", field);
          console.log("Type: ", type);
          console.log("");
          packer_debug("int 0");
          pack_int(data, 0);
          return ;
      }
      packer_debug("int "+val.length);
      pack_int(data, val.length);
      let d=type.data;
      let itername=d.iname;
      let type2=d.type;
      let env=_ws_env;
      for (let i=0; i<val.length; i++) {
          let val2=val[i];
          if (itername!==""&&itername!==undefined&&field.get) {
              env[0][0] = itername;
              env[0][1] = val2;
              val2 = manager._env_call(field.get, obj, env);
          }
          let fakeField=fakeFields.next();
          fakeField.type = type2;
          do_pack(manager, data, val2, obj, fakeField, type2);
      }
    }
    static  packNull(manager, data, field, type) {
      pack_int(data, 0);
    }
    static  format(type) {
      if (type.data.iname!==""&&type.data.iname!==undefined) {
          return "array("+type.data.iname+", "+fmt_type(type.data.type)+")";
      }
      else {
        return "array("+fmt_type(type.data.type)+")";
      }
    }
    static  useHelperJS(field) {
      return !field.type.data.iname;
    }
    static  validateJSON(manager, val, obj, field, type, instance, _abstractKey) {
      if (!val) {
          return "not an array: "+val;
      }
      for (let i=0; i<val.length; i++) {
          let ret=validateJSON(manager, val[i], val, field, type.data.type, undefined, _abstractKey);
          if (typeof ret==="string"||!ret) {
              return ret;
          }
      }
      return true;
    }
    static  fromJSON(manager, val, obj, field, type, instance) {
      let ret=instance||[];
      ret.length = 0;
      for (let i=0; i<val.length; i++) {
          let val2=fromJSON(manager, val[i], val, field, type.data.type, undefined);
          if (val2===undefined) {
              console.log(val2);
              console.error("eeek");
              process.exit();
          }
          ret.push(val2);
      }
      return ret;
    }
    static  formatJSON(manager, val, obj, field, type, instance, tlvl) {
      return formatArrayJson(manager, val, obj, field, type, type.data.type, instance, tlvl);
    }
    static  toJSON(manager, val, obj, field, type) {
      val = val||[];
      let json=[];
      let itername=type.data.iname;
      for (let i=0; i<val.length; i++) {
          let val2=val[i];
          let env=_ws_env;
          if (itername!==""&&itername!==undefined&&field.get) {
              env[0][0] = itername;
              env[0][1] = val2;
              val2 = manager._env_call(field.get, obj, env);
          }
          json.push(toJSON(manager, val2, val, field, type.data.type));
      }
      return json;
    }
    static  unpackInto(manager, data, type, uctx, dest) {
      let len=unpack_int(data, uctx);
      dest.length = 0;
      for (let i=0; i<len; i++) {
          dest.push(unpack_field(manager, data, type.data.type, uctx));
      }
    }
    static  unpack(manager, data, type, uctx) {
      let len=unpack_int(data, uctx);
      packer_debug("-int "+len);
      let arr=new Array(len);
      for (let i=0; i<len; i++) {
          arr[i] = unpack_field(manager, data, type.data.type, uctx);
      }
      return arr;
    }
    static  define() {
      return {type: StructEnum.ARRAY, 
     name: "array"}
    }
  }
  _ESClass.register(StructArrayField);
  _es6_module.add_class(StructArrayField);
  StructFieldType.register(StructArrayField);
  class StructIterField extends StructFieldType {
    static  pack(manager, data, val, obj, field, type) {
      function forEach(cb, thisvar) {
        if (val&&val[Symbol.iterator]) {
            for (let item of val) {
                cb.call(thisvar, item);
            }
        }
        else 
          if (val&&val.forEach) {
            val.forEach(function (item) {
              cb.call(thisvar, item);
            });
        }
        else {
          console.trace();
          console.log("Undefined iterable list fed to struct struct packer!", val);
          console.log("Field: ", field);
          console.log("Type: ", type);
          console.log("");
        }
      }
      let starti=data.length;
      data.length+=4;
      let d=type.data, itername=d.iname, type2=d.type;
      let env=_ws_env;
      let i=0;
      forEach(function (val2) {
        if (itername!==""&&itername!==undefined&&field.get) {
            env[0][0] = itername;
            env[0][1] = val2;
            val2 = manager._env_call(field.get, obj, env);
        }
        let fakeField=fakeFields.next();
        fakeField.type = type2;
        do_pack(manager, data, val2, obj, fakeField, type2);
        i++;
      }, this);
      temp_dataview.setInt32(0, i, STRUCT_ENDIAN);
      data[starti++] = uint8_view[0];
      data[starti++] = uint8_view[1];
      data[starti++] = uint8_view[2];
      data[starti++] = uint8_view[3];
    }
    static  formatJSON(manager, val, obj, field, type, instance, tlvl) {
      return formatArrayJson(manager, val, obj, field, type, type.data.type, instance, tlvl, list(val));
    }
    static  validateJSON(manager, val, obj, field, type, instance) {
      return StructArrayField.validateJSON(...arguments);
    }
    static  fromJSON() {
      return StructArrayField.fromJSON(...arguments);
    }
    static  toJSON(manager, val, obj, field, type) {
      val = val||[];
      let json=[];
      let itername=type.data.iname;
      for (let val2 of val) {
          let env=_ws_env;
          if (itername!==""&&itername!==undefined&&field.get) {
              env[0][0] = itername;
              env[0][1] = val2;
              val2 = manager._env_call(field.get, obj, env);
          }
          json.push(toJSON(manager, val2, val, field, type.data.type));
      }
      return json;
    }
    static  packNull(manager, data, field, type) {
      pack_int(data, 0);
    }
    static  useHelperJS(field) {
      return !field.type.data.iname;
    }
    static  format(type) {
      if (type.data.iname!==""&&type.data.iname!==undefined) {
          return "iter("+type.data.iname+", "+fmt_type(type.data.type)+")";
      }
      else {
        return "iter("+fmt_type(type.data.type)+")";
      }
    }
    static  unpackInto(manager, data, type, uctx, arr) {
      let len=unpack_int(data, uctx);
      packer_debug("-int "+len);
      arr.length = 0;
      for (let i=0; i<len; i++) {
          arr.push(unpack_field(manager, data, type.data.type, uctx));
      }
      return arr;
    }
    static  unpack(manager, data, type, uctx) {
      let len=unpack_int(data, uctx);
      packer_debug("-int "+len);
      let arr=new Array(len);
      for (let i=0; i<len; i++) {
          arr[i] = unpack_field(manager, data, type.data.type, uctx);
      }
      return arr;
    }
    static  define() {
      return {type: StructEnum.ITER, 
     name: "iter"}
    }
  }
  _ESClass.register(StructIterField);
  _es6_module.add_class(StructIterField);
  StructFieldType.register(StructIterField);
  class StructShortField extends StructFieldType {
    static  pack(manager, data, val, obj, field, type) {
      pack_short(data, val);
    }
    static  unpack(manager, data, type, uctx) {
      return unpack_short(data, uctx);
    }
    static  define() {
      return {type: StructEnum.SHORT, 
     name: "short"}
    }
  }
  _ESClass.register(StructShortField);
  _es6_module.add_class(StructShortField);
  StructFieldType.register(StructShortField);
  class StructByteField extends StructFieldType {
    static  pack(manager, data, val, obj, field, type) {
      pack_byte(data, val);
    }
    static  unpack(manager, data, type, uctx) {
      return unpack_byte(data, uctx);
    }
    static  define() {
      return {type: StructEnum.BYTE, 
     name: "byte"}
    }
  }
  _ESClass.register(StructByteField);
  _es6_module.add_class(StructByteField);
  StructFieldType.register(StructByteField);
  class StructSignedByteField extends StructFieldType {
    static  pack(manager, data, val, obj, field, type) {
      pack_sbyte(data, val);
    }
    static  unpack(manager, data, type, uctx) {
      return unpack_sbyte(data, uctx);
    }
    static  define() {
      return {type: StructEnum.SIGNED_BYTE, 
     name: "sbyte"}
    }
  }
  _ESClass.register(StructSignedByteField);
  _es6_module.add_class(StructSignedByteField);
  StructFieldType.register(StructSignedByteField);
  class StructBoolField extends StructFieldType {
    static  pack(manager, data, val, obj, field, type) {
      pack_byte(data, !!val);
    }
    static  unpack(manager, data, type, uctx) {
      return !!unpack_byte(data, uctx);
    }
    static  validateJSON(manager, val, obj, field, type, instance) {
      if (val===0||val===1||val===true||val===false||val==="true"||val==="false") {
          return true;
      }
      return ""+val+" is not a bool";
    }
    static  fromJSON(manager, val, obj, field, type, instance) {
      if (val==="false") {
          val = false;
      }
      return !!val;
    }
    static  toJSON(manager, val, obj, field, type) {
      return !!val;
    }
    static  define() {
      return {type: StructEnum.BOOL, 
     name: "bool"}
    }
  }
  _ESClass.register(StructBoolField);
  _es6_module.add_class(StructBoolField);
  StructFieldType.register(StructBoolField);
  class StructIterKeysField extends StructFieldType {
    static  pack(manager, data, val, obj, field, type) {
      if ((typeof val!=="object"&&typeof val!=="function")||val===null) {
          console.warn("Bad object fed to iterkeys in struct packer!", val);
          console.log("Field: ", field);
          console.log("Type: ", type);
          console.log("");
          pack_int(data, 0);
          return ;
      }
      let len=0.0;
      for (let k in val) {
          len++;
      }
      packer_debug("int "+len);
      pack_int(data, len);
      let d=type.data, itername=d.iname, type2=d.type;
      let env=_ws_env;
      let i=0;
      for (let val2 in val) {
          if (i>=len) {
              if (warninglvl>0) {
                  console.warn("Warning: object keys magically replaced during iteration", val, i);
              }
              return ;
          }
          if (itername&&itername.trim().length>0&&field.get) {
              env[0][0] = itername;
              env[0][1] = val2;
              val2 = manager._env_call(field.get, obj, env);
          }
          else {
            val2 = val[val2];
          }
          let f2={type: type2, 
       get: undefined, 
       set: undefined};
          do_pack(manager, data, val2, obj, f2, type2);
          i++;
      }
    }
    static  validateJSON(manager, val, obj, field, type, instance) {
      return StructArrayField.validateJSON(...arguments);
    }
    static  fromJSON() {
      return StructArrayField.fromJSON(...arguments);
    }
    static  formatJSON(manager, val, obj, field, type, instance, tlvl) {
      return formatArrayJson(manager, val, obj, field, type, type.data.type, instance, tlvl, list(val));
    }
    static  toJSON(manager, val, obj, field, type) {
      val = val||[];
      let json=[];
      let itername=type.data.iname;
      for (let k in val) {
          let val2=val[k];
          let env=_ws_env;
          if (itername!==""&&itername!==undefined&&field.get) {
              env[0][0] = itername;
              env[0][1] = val2;
              val2 = manager._env_call(field.get, obj, env);
          }
          json.push(toJSON(manager, val2, val, field, type.data.type));
      }
      return json;
    }
    static  packNull(manager, data, field, type) {
      pack_int(data, 0);
    }
    static  useHelperJS(field) {
      return !field.type.data.iname;
    }
    static  format(type) {
      if (type.data.iname!==""&&type.data.iname!==undefined) {
          return "iterkeys("+type.data.iname+", "+fmt_type(type.data.type)+")";
      }
      else {
        return "iterkeys("+fmt_type(type.data.type)+")";
      }
    }
    static  unpackInto(manager, data, type, uctx, arr) {
      let len=unpack_int(data, uctx);
      packer_debug("-int "+len);
      arr.length = 0;
      for (let i=0; i<len; i++) {
          arr.push(unpack_field(manager, data, type.data.type, uctx));
      }
      return arr;
    }
    static  unpack(manager, data, type, uctx) {
      let len=unpack_int(data, uctx);
      packer_debug("-int "+len);
      let arr=new Array(len);
      for (let i=0; i<len; i++) {
          arr[i] = unpack_field(manager, data, type.data.type, uctx);
      }
      return arr;
    }
    static  define() {
      return {type: StructEnum.ITERKEYS, 
     name: "iterkeys"}
    }
  }
  _ESClass.register(StructIterKeysField);
  _es6_module.add_class(StructIterKeysField);
  StructFieldType.register(StructIterKeysField);
  class StructUintField extends StructFieldType {
    static  pack(manager, data, val, obj, field, type) {
      pack_uint(data, val);
    }
    static  unpack(manager, data, type, uctx) {
      return unpack_uint(data, uctx);
    }
    static  validateJSON(manager, val, obj, field, type, instance) {
      if (typeof val!=="number"||val!==Math.floor(val)) {
          return ""+val+" is not an integer";
      }
      return true;
    }
    static  define() {
      return {type: StructEnum.UINT, 
     name: "uint"}
    }
  }
  _ESClass.register(StructUintField);
  _es6_module.add_class(StructUintField);
  StructFieldType.register(StructUintField);
  class StructUshortField extends StructFieldType {
    static  pack(manager, data, val, obj, field, type) {
      pack_ushort(data, val);
    }
    static  unpack(manager, data, type, uctx) {
      return unpack_ushort(data, uctx);
    }
    static  validateJSON(manager, val, obj, field, type, instance) {
      if (typeof val!=="number"||val!==Math.floor(val)) {
          return ""+val+" is not an integer";
      }
      return true;
    }
    static  define() {
      return {type: StructEnum.USHORT, 
     name: "ushort"}
    }
  }
  _ESClass.register(StructUshortField);
  _es6_module.add_class(StructUshortField);
  StructFieldType.register(StructUshortField);
  class StructStaticArrayField extends StructFieldType {
    static  pack(manager, data, val, obj, field, type) {
      if (type.data.size===undefined) {
          throw new Error("type.data.size was undefined");
      }
      let itername=type.data.iname;
      if (val===undefined||!val.length) {
          this.packNull(manager, data, field, type);
          return ;
      }
      for (let i=0; i<type.data.size; i++) {
          let i2=Math.min(i, Math.min(val.length-1, type.data.size));
          let val2=val[i2];
          if (itername!==""&&itername!==undefined&&field.get) {
              let env=_ws_env;
              env[0][0] = itername;
              env[0][1] = val2;
              val2 = manager._env_call(field.get, obj, env);
          }
          do_pack(manager, data, val2, val, field, type.data.type);
      }
    }
    static  useHelperJS(field) {
      return !field.type.data.iname;
    }
    static  validateJSON() {
      return StructArrayField.validateJSON(...arguments);
    }
    static  fromJSON() {
      return StructArrayField.fromJSON(...arguments);
    }
    static  formatJSON(manager, val, obj, field, type, instance, tlvl) {
      return formatArrayJson(manager, val, obj, field, type, type.data.type, instance, tlvl, list(val));
    }
    static  packNull(manager, data, field, type) {
      let size=type.data.size;
      for (let i=0; i<size; i++) {
          packNull(manager, data, field, type.data.type);
      }
    }
    static  toJSON(manager, val, obj, field, type) {
      return StructArrayField.toJSON(...arguments);
    }
    static  format(type) {
      let type2=StructFieldTypeMap[type.data.type.type].format(type.data.type);
      let ret=`static_array[${type2}, ${type.data.size}`;
      if (type.data.iname) {
          ret+=`, ${type.data.iname}`;
      }
      ret+=`]`;
      return ret;
    }
    static  unpackInto(manager, data, type, uctx, ret) {
      packer_debug("-size: "+type.data.size);
      ret.length = 0;
      for (let i=0; i<type.data.size; i++) {
          ret.push(unpack_field(manager, data, type.data.type, uctx));
      }
      return ret;
    }
    static  unpack(manager, data, type, uctx) {
      packer_debug("-size: "+type.data.size);
      let ret=[];
      for (let i=0; i<type.data.size; i++) {
          ret.push(unpack_field(manager, data, type.data.type, uctx));
      }
      return ret;
    }
    static  define() {
      return {type: StructEnum.STATIC_ARRAY, 
     name: "static_array"}
    }
  }
  _ESClass.register(StructStaticArrayField);
  _es6_module.add_class(StructStaticArrayField);
  StructFieldType.register(StructStaticArrayField);
  var _sintern2=Object.freeze({__proto__: null, 
   _get_pack_debug: _get_pack_debug, 
   setWarningMode2: setWarningMode2, 
   setDebugMode2: setDebugMode2, 
   StructFieldTypes: StructFieldTypes, 
   StructFieldTypeMap: StructFieldTypeMap, 
   packNull: packNull, 
   toJSON: toJSON, 
   fromJSON: fromJSON, 
   formatJSON: formatJSON, 
   validateJSON: validateJSON, 
   do_pack: do_pack, 
   StructFieldType: StructFieldType, 
   formatArrayJson: formatArrayJson});
  var structEval=eval;
  function setStructEval(val) {
    structEval = val;
  }
  var _struct_eval=Object.freeze({__proto__: null, 
   get structEval() {
      return structEval;
    }, 
   setStructEval: setStructEval});
  const TokSymbol=Symbol("token-info");
  function buildJSONParser() {
    let tk=(name, re, func, example) =>      {
      return new tokdef(name, re, func, example);
    }
    let parse;
    let nint="[+-]?[0-9]+";
    let nhex="[+-]?0x[0-9a-fA-F]+";
    let nfloat1="[+-]?[0-9]+\\.[0-9]*";
    let nfloat2="[+-]?[0-9]*\\.[0-9]+";
    let nfloat3="[+-]?[0-9]+\\.[0-9]+";
    let nfloatexp="[+-]?[0-9]+\\.[0-9]+[eE][+-]?[0-9]+";
    let nfloat=`(${nfloat1})|(${nfloat2})|(${nfloatexp})`;
    let num=`(${nint})|(${nfloat})|(${nhex})`;
    let numre=new RegExp(num);
    let numreTest=new RegExp(`(${num})$`);
    nfloat3 = new RegExp(nfloat3);
    nfloatexp = new RegExp(nfloatexp);
    let tests=["1.234234", ".23432", "-234.", "1e-17", "-0x23423ff", "+23423", "-4.263256414560601e-14"];
    for (let test of tests) {
        if (!numreTest.test(test)) {
            console.error("Error! Number regexp failed:", test);
        }
    }
    let tokens=[tk("BOOL", /true|false/), tk("WS", /[ \r\t\n]/, (t) =>      {
      return undefined;
    }), tk("STRLIT", /["']/, (t) =>      {
      let lex=t.lexer;
      let char=t.value;
      let i=lex.lexpos;
      let lexdata=lex.lexdata;
      let escape=0;
      t.value = "";
      let prev;
      while (i<lexdata.length) {
        let c=lexdata[i];
        t.value+=c;
        if (c==="\\") {
            escape^=true;
        }
        else 
          if (!escape&&c===char) {
            break;
        }
        else {
          escape = false;
        }
        i++;
      }
      lex.lexpos = i+1;
      if (t.value.length>0) {
          t.value = t.value.slice(0, t.value.length-1);
      }
      return t;
    }), tk("LSBRACKET", /\[/), tk("RSBRACKET", /]/), tk("LBRACE", /{/), tk("RBRACE", /}/), tk("NULL", /null/), tk("COMMA", /,/), tk("COLON", /:/), tk("NUM", numre, (t) =>      {
      return (t.value = parseFloat(t.value), t);
    }), tk("NUM", nfloat3, (t) =>      {
      return (t.value = parseFloat(t.value), t);
    }), tk("NUM", nfloatexp, (t) =>      {
      return (t.value = parseFloat(t.value), t);
    })];
    function tokinfo(t) {
      return {lexpos: t.lexpos, 
     lineno: t.lineno, 
     col: t.col, 
     fields: {}}
    }
    function p_Array(p) {
      p.expect("LSBRACKET");
      let t=p.peeknext();
      let first=true;
      let ret=[];
      ret[TokSymbol] = tokinfo(t);
      while (t&&t.type!=="RSBRACKET") {
        if (!first) {
            p.expect("COMMA");
        }
        ret[TokSymbol].fields[ret.length] = tokinfo(t);
        ret.push(p_Start(p));
        first = false;
        t = p.peeknext();
      }
      p.expect("RSBRACKET");
      return ret;
    }
    function p_Object(p) {
      p.expect("LBRACE");
      let obj={}
      let first=true;
      let t=p.peeknext();
      obj[TokSymbol] = tokinfo(t);
      while (t&&t.type!=="RBRACE") {
        if (!first) {
            p.expect("COMMA");
        }
        let key=p.expect("STRLIT");
        p.expect("COLON");
        let val=p_Start(p, true);
        obj[key] = val;
        first = false;
        t = p.peeknext();
        obj[TokSymbol].fields[key] = tokinfo(t);
      }
      p.expect("RBRACE");
      return obj;
    }
    function p_Start(p, throwError) {
      if (throwError===undefined) {
          throwError = true;
      }
      let t=p.peeknext();
      if (t.type==="LSBRACKET") {
          return p_Array(p);
      }
      else 
        if (t.type==="LBRACE") {
          return p_Object(p);
      }
      else 
        if (t.type==="STRLIT"||t.type==="NUM"||t.type==="NULL"||t.type==="BOOL") {
          return p.next().value;
      }
      else {
        p.error(t, "Unknown token");
      }
    }
    function p_Error(token, msg) {
      throw new PUTIL_ParseError("Parse Error");
    }
    let lex=new lexer(tokens);
    lex.linestart = 0;
    parse = new parser(lex, p_Error);
    parse.start = p_Start;
    return parse;
  }
  var jsonParser=buildJSONParser();
  function printContext(buf, tokinfo, printColors) {
    if (printColors===undefined) {
        printColors = true;
    }
    let lines=buf.split("\n");
    if (!tokinfo) {
        return '';
    }
    let lineno=tokinfo.lineno;
    let col=tokinfo.col;
    let istart=Math.max(lineno-50, 0);
    let iend=Math.min(lineno+2, lines.length-1);
    let s='';
    if (printColors) {
        s+=termColor("  /* pretty-printed json */\n", "blue");
    }
    else {
      s+="/* pretty-printed json */\n";
    }
    for (let i=istart; i<iend; i++) {
        let l=lines[i];
        let idx=""+i;
        while (idx.length<3) {
          idx = " "+idx;
        }
        if (i===lineno&&printColors) {
            s+=termColor(`${idx}: ${l}\n`, "yellow");
        }
        else {
          s+=`${idx}: ${l}\n`;
        }
        if (i===lineno) {
            let l2='';
            for (let j=0; j<col+5; j++) {
                l2+=" ";
            }
            s+=l2+"^\n";
        }
    }
    return s;
  }
  var nGlobal;
  if (typeof globalThis!=="undefined") {
      nGlobal = globalThis;
  }
  else 
    if (typeof window!=="undefined") {
      nGlobal = window;
  }
  else 
    if (typeof global!=="undefined") {
      nGlobal = global;
  }
  else 
    if (typeof globals!=="undefined") {
      nGlobal = globals;
  }
  else 
    if (typeof self!=="undefined") {
      nGlobal = self;
  }
  const DEBUG={}
  function updateDEBUG() {
    for (let k in Object.keys(DEBUG)) {
        delete DEBUG[k];
    }
    if (typeof nGlobal.DEBUG==="object") {
        for (let k in nGlobal.DEBUG) {
            DEBUG[k] = nGlobal.DEBUG[k];
        }
    }
  }
  "use strict";
  var sintern2=_sintern2;
  var struct_eval=_struct_eval;
  let warninglvl$1=2;
  var truncateDollarSign=true;
  var manager;
  class JSONError extends Error {
  }
  _ESClass.register(JSONError);
  _es6_module.add_class(JSONError);
  
  function printCodeLines(code) {
    let lines=code.split(String.fromCharCode(10));
    let buf='';
    for (let i=0; i<lines.length; i++) {
        let line=""+(i+1)+":";
        while (line.length<3) {
          line+=" ";
        }
        line+=" "+lines[i];
        buf+=line+String.fromCharCode(10);
    }
    return buf;
  }
  function printEvalError(code) {
    console.log("== CODE ==");
    console.log(printCodeLines(code));
    eval(code);
  }
  function setTruncateDollarSign(v) {
    truncateDollarSign = !!v;
  }
  function _truncateDollarSign(s) {
    let i=s.search("$");
    if (i>0) {
        return s.slice(0, i).trim();
    }
    return s;
  }
  function unmangle(name) {
    if (truncateDollarSign) {
        return _truncateDollarSign(name);
    }
    else {
      return name;
    }
  }
  let _static_envcode_null$1="";
  function gen_tabstr$2(tot) {
    let ret="";
    for (let i=0; i<tot; i++) {
        ret+=" ";
    }
    return ret;
  }
  let packer_debug$1, packer_debug_start$1, packer_debug_end$1;
  function update_debug_data() {
    let ret=_get_pack_debug();
    packer_debug$1 = ret.packer_debug;
    packer_debug_start$1 = ret.packer_debug_start;
    packer_debug_end$1 = ret.packer_debug_end;
    warninglvl$1 = ret.warninglvl;
  }
  update_debug_data();
  function setWarningMode(t) {
    sintern2.setWarningMode2(t);
    if (typeof t!=="number"||isNaN(t)) {
        throw new Error("Expected a single number (>= 0) argument to setWarningMode");
    }
    warninglvl$1 = t;
  }
  function setDebugMode(t) {
    sintern2.setDebugMode2(t);
    update_debug_data();
  }
  let _ws_env$1=[[undefined, undefined]];
  function define_empty_class(scls, name) {
    let cls=function () {
    }
    cls.prototype = Object.create(Object.prototype);
    cls.constructor = cls.prototype.constructor = cls;
    let keywords=scls.keywords;
    cls.STRUCT = name+" {\n  }\n";
    cls.structName = name;
    cls.prototype.loadSTRUCT = function (reader) {
      reader(this);
    }
    cls.newSTRUCT = function () {
      return new this();
    }
    return cls;
  }
  let haveCodeGen;
  class STRUCT  {
     constructor() {
      this.idgen = 0;
      this.allowOverriding = true;
      this.structs = {};
      this.struct_cls = {};
      this.struct_ids = {};
      this.compiled_code = {};
      this.null_natives = {};
      this.define_null_native("Object", Object);
      this.jsonUseColors = true;
      this.jsonBuf = '';
      this.formatCtx = {};
    }
    static  inherit(child, parent, structName=child.name) {
      const keywords=this.keywords;
      if (!parent.STRUCT) {
          return structName+"{\n";
      }
      let stt=struct_parse.parse(parent.STRUCT);
      let code=structName+"{\n";
      code+=STRUCT.fmt_struct(stt, true, false, true);
      return code;
    }
    static  Super(obj, reader) {
      if (warninglvl$1>0) {
          console.warn("deprecated");
      }
      reader(obj);
      function reader2(obj) {
      }
      let cls=obj.constructor;
      let bad=cls===undefined||cls.prototype===undefined||cls.prototype.__proto__===undefined;
      if (bad) {
          return ;
      }
      let parent=cls.prototype.__proto__.constructor;
      bad = bad||parent===undefined;
      if (!bad&&parent.prototype.loadSTRUCT&&parent.prototype.loadSTRUCT!==obj.loadSTRUCT) {
          parent.prototype.loadSTRUCT.call(obj, reader2);
      }
    }
    static  chain_fromSTRUCT(cls, reader) {
      if (warninglvl$1>0) {
          console.warn("Using deprecated (and evil) chain_fromSTRUCT method, eek!");
      }
      let proto=cls.prototype;
      let parent=cls.prototype.prototype.constructor;
      let obj=parent.fromSTRUCT(reader);
      let obj2=new cls();
      let keys=Object.keys(obj).concat(Object.getOwnPropertySymbols(obj));
      for (let i=0; i<keys.length; i++) {
          let k=keys[i];
          try {
            obj2[k] = obj[k];
          }
          catch (error) {
              if (warninglvl$1>0) {
                  console.warn("  failed to set property", k);
              }
          }
      }
      return obj2;
    }
    static  formatStruct(stt, internal_only, no_helper_js) {
      return this.fmt_struct(stt, internal_only, no_helper_js);
    }
    static  fmt_struct(stt, internal_only, no_helper_js, addComments) {
      if (internal_only===undefined)
        internal_only = false;
      if (no_helper_js===undefined)
        no_helper_js = false;
      let s="";
      if (!internal_only) {
          s+=stt.name;
          if (stt.id!==-1)
            s+=" id="+stt.id;
          s+=" {\n";
      }
      let tab="  ";
      function fmt_type(type) {
        return StructFieldTypeMap[type.type].format(type);
        if (type.type===StructEnum.ARRAY||type.type===StructEnum.ITER||type.type===StructEnum.ITERKEYS) {
            if (type.data.iname!==""&&type.data.iname!==undefined) {
                return "array("+type.data.iname+", "+fmt_type(type.data.type)+")";
            }
            else {
              return "array("+fmt_type(type.data.type)+")";
            }
        }
        else 
          if (type.type===StructEnum.STATIC_STRING) {
            return "static_string["+type.data.maxlength+"]";
        }
        else 
          if (type.type===StructEnum.STRUCT) {
            return type.data;
        }
        else 
          if (type.type===StructEnum.TSTRUCT) {
            return "abstract("+type.data+")";
        }
        else {
          return StructTypeMap[type.type];
        }
      }
      let fields=stt.fields;
      for (let i=0; i<fields.length; i++) {
          let f=fields[i];
          s+=tab+f.name+" : "+fmt_type(f.type);
          if (!no_helper_js&&f.get!==undefined) {
              s+=" | "+f.get.trim();
          }
          s+=";";
          if (addComments&&f.comment.trim()) {
              s+=f.comment.trim();
          }
          s+="\n";
      }
      if (!internal_only)
        s+="}";
      return s;
    }
    static  setClassKeyword(keyword, nameKeyword=undefined) {
      if (!nameKeyword) {
          nameKeyword = keyword.toLowerCase()+"Name";
      }
      this.keywords = {script: keyword, 
     name: nameKeyword, 
     load: "load"+keyword, 
     new: "new"+keyword, 
     after: "after"+keyword, 
     from: "from"+keyword};
    }
     define_null_native(name, cls) {
      const keywords=this.constructor.keywords;
      let obj=define_empty_class(this.constructor, name);
      let stt=struct_parse.parse(obj.STRUCT);
      stt.id = this.idgen++;
      this.structs[name] = stt;
      this.struct_cls[name] = cls;
      this.struct_ids[stt.id] = stt;
      this.null_natives[name] = 1;
    }
     validateStructs(onerror) {
      function getType(type) {
        switch (type.type) {
          case StructEnum.ITERKEYS:
          case StructEnum.ITER:
          case StructEnum.STATIC_ARRAY:
          case StructEnum.ARRAY:
            return getType(type.data.type);
          case StructEnum.TSTRUCT:
            return type;
          case StructEnum.STRUCT:
          default:
            return type;
        }
      }
      function formatType(type) {
        let ret={}
        ret.type = type.type;
        if (typeof ret.type==="number") {
            for (let k in StructEnum) {
                if (StructEnum[k]===ret.type) {
                    ret.type = k;
                    break;
                }
            }
        }
        else 
          if (typeof ret.type==="object") {
            ret.type = formatType(ret.type);
        }
        if (typeof type.data==="object") {
            ret.data = formatType(type.data);
        }
        else {
          ret.data = type.data;
        }
        return ret;
      }
      function throwError(stt, field, msg) {
        let buf=STRUCT.formatStruct(stt);
        console.error(buf+"\n\n"+msg);
        if (onerror) {
            onerror(msg, stt, field);
        }
        else {
          throw new Error(msg);
        }
      }
      for (let k in this.structs) {
          let stt=this.structs[k];
          for (let field of stt.fields) {
              if (field.name==="this") {
                  let type=field.type.type;
                  if (ValueTypes.has(type)) {
                      throwError(stt, field, "'this' cannot be used with value types");
                  }
              }
              let type=getType(field.type);
              if (type.type!==StructEnum.STRUCT&&type.type!==StructEnum.TSTRUCT) {
                  continue;
              }
              if (!(type.data in this.structs)) {
                  let msg=stt.name+":"+field.name+": Unknown struct "+type.data+".";
                  throwError(stt, field, msg);
              }
          }
      }
    }
     forEach(func, thisvar) {
      for (let k in this.structs) {
          let stt=this.structs[k];
          if (thisvar!==undefined)
            func.call(thisvar, stt);
          else 
            func(stt);
      }
    }
     parse_structs(buf, defined_classes) {
      const keywords=this.constructor.keywords;
      if (defined_classes===undefined) {
          defined_classes = manager;
      }
      if (__instance_of(defined_classes, STRUCT)) {
          let struct2=defined_classes;
          defined_classes = [];
          for (let k in struct2.struct_cls) {
              defined_classes.push(struct2.struct_cls[k]);
          }
      }
      if (defined_classes===undefined) {
          defined_classes = [];
          for (let k in manager.struct_cls) {
              defined_classes.push(manager.struct_cls[k]);
          }
      }
      let clsmap={};
      for (let i=0; i<defined_classes.length; i++) {
          let cls=defined_classes[i];
          if (!cls.structName&&cls.STRUCT) {
              let stt=struct_parse.parse(cls.STRUCT.trim());
              cls.structName = stt.name;
          }
          else 
            if (!cls.structName&&cls.name!=="Object") {
              if (warninglvl$1>0)
                console.log("Warning, bad class in registered class list", unmangle(cls.name), cls);
              continue;
          }
          clsmap[cls.structName] = defined_classes[i];
      }
      struct_parse.input(buf);
      while (!struct_parse.at_end()) {
        let stt=struct_parse.parse(undefined, false);
        if (!(stt.name in clsmap)) {
            if (!(stt.name in this.null_natives))
              if (warninglvl$1>0)
              console.log("WARNING: struct "+stt.name+" is missing from class list.");
            let dummy=define_empty_class(this.constructor, stt.name);
            dummy.STRUCT = STRUCT.fmt_struct(stt);
            dummy.structName = stt.name;
            dummy.prototype.structName = dummy.name;
            this.struct_cls[dummy.structName] = dummy;
            this.structs[dummy.structName] = stt;
            if (stt.id!==-1)
              this.struct_ids[stt.id] = stt;
        }
        else {
          this.struct_cls[stt.name] = clsmap[stt.name];
          this.structs[stt.name] = stt;
          if (stt.id!==-1)
            this.struct_ids[stt.id] = stt;
        }
        let tok=struct_parse.peek();
        while (tok&&(tok.value==="\n"||tok.value==="\r"||tok.value==="\t"||tok.value===" ")) {
          tok = struct_parse.peek();
        }
      }
    }
     registerGraph(srcSTRUCT, cls) {
      if (!cls.structName) {
          console.warn("class was not in srcSTRUCT");
          return this.register(cls);
      }
      let recStruct;
      let recArray=(t) =>        {
        switch (t.type) {
          case StructEnum.ARRAY:
            return recArray(t.data.type);
          case StructEnum.ITERKEYS:
            return recArray(t.data.type);
          case StructEnum.STATIC_ARRAY:
            return recArray(t.data.type);
          case StructEnum.ITER:
            return recArray(t.data.type);
          case StructEnum.STRUCT:
          case StructEnum.TSTRUCT:
{            let st=srcSTRUCT.structs[t.data];
            let cls=srcSTRUCT.struct_cls[st.name];
            return recStruct(st, cls);
}
        }
      };
      recStruct = (st, cls) =>        {
        if (!(cls.structName in this.structs)) {
            this.add_class(cls, cls.structName);
        }
        for (let f of st.fields) {
            if (f.type.type===StructEnum.STRUCT||f.type.type===StructEnum.TSTRUCT) {
                let st2=srcSTRUCT.structs[f.type.data];
                let cls2=srcSTRUCT.struct_cls[st2.name];
                recStruct(st2, cls2);
            }
            else 
              if (f.type.type===StructEnum.ARRAY) {
                recArray(f.type);
            }
            else 
              if (f.type.type===StructEnum.ITER) {
                recArray(f.type);
            }
            else 
              if (f.type.type===StructEnum.ITERKEYS) {
                recArray(f.type);
            }
            else 
              if (f.type.type===StructEnum.STATIC_ARRAY) {
                recArray(f.type);
            }
        }
      };
      let st=srcSTRUCT.structs[cls.structName];
      recStruct(st, cls);
    }
     register(cls, structName) {
      return this.add_class(cls, structName);
    }
     unregister(cls) {
      const keywords=this.constructor.keywords;
      if (!cls||!cls.structName||!(cls.structName in this.struct_cls)) {
          console.warn("Class not registered with nstructjs", cls);
          return ;
      }
      let st=this.structs[cls.structName];
      delete this.structs[cls.structName];
      delete this.struct_cls[cls.structName];
      delete this.struct_ids[st.id];
    }
     add_class(cls, structName) {
      if (cls===Object) {
          return ;
      }
      const keywords=this.constructor.keywords;
      if (cls.STRUCT) {
          let bad=false;
          let p=cls;
          while (p) {
            p = p.__proto__;
            if (p&&p.STRUCT&&p.STRUCT===cls.STRUCT) {
                bad = true;
                break;
            }
          }
          if (bad) {
              if (warninglvl$1>0) {
                  console.warn("Generating "+keywords.script+" script for derived class "+unmangle(cls.name));
              }
              if (!structName) {
                  structName = unmangle(cls.name);
              }
              cls.STRUCT = STRUCT.inherit(cls, p)+"\n}";
          }
      }
      if (!cls.STRUCT) {
          throw new Error("class "+unmangle(cls.name)+" has no "+keywords.script+" script");
      }
      let stt=struct_parse.parse(cls.STRUCT);
      stt.name = unmangle(stt.name);
      cls.structName = stt.name;
      if (cls.newSTRUCT===undefined) {
          cls.newSTRUCT = function () {
            return new this();
          };
      }
      if (structName!==undefined) {
          stt.name = cls.structName = structName;
      }
      else 
        if (cls.structName===undefined) {
          cls.structName = stt.name;
      }
      else {
        stt.name = cls.structName;
      }
      if (cls.structName in this.structs) {
          if (warninglvl$1>0) {
              console.warn("Struct "+unmangle(cls.structName)+" is already registered", cls);
          }
          if (!this.allowOverriding) {
              throw new Error("Struct "+unmangle(cls.structName)+" is already registered");
          }
          return ;
      }
      if (stt.id===-1)
        stt.id = this.idgen++;
      this.structs[cls.structName] = stt;
      this.struct_cls[cls.structName] = cls;
      this.struct_ids[stt.id] = stt;
    }
     isRegistered(cls) {
      const keywords=this.constructor.keywords;
      if (!cls.hasOwnProperty("structName")) {
          return false;
      }
      return cls===this.struct_cls[cls.structName];
    }
     get_struct_id(id) {
      return this.struct_ids[id];
    }
     get_struct(name) {
      if (!(name in this.structs)) {
          console.warn("Unknown struct", name);
          throw new Error("Unknown struct "+name);
      }
      return this.structs[name];
    }
     get_struct_cls(name) {
      if (!(name in this.struct_cls)) {
          console.trace();
          throw new Error("Unknown struct "+name);
      }
      return this.struct_cls[name];
    }
     _env_call(code, obj, env) {
      let envcode=_static_envcode_null$1;
      if (env!==undefined) {
          envcode = "";
          for (let i=0; i<env.length; i++) {
              envcode = "let "+env[i][0]+" = env["+i.toString()+"][1];\n"+envcode;
          }
      }
      let fullcode="";
      if (envcode!==_static_envcode_null$1)
        fullcode = envcode+code;
      else 
        fullcode = code;
      let func;
      if (!(fullcode in this.compiled_code)) {
          let code2="func = function(obj, env) { "+envcode+"return "+code+"}";
          try {
            func = struct_eval.structEval(code2);
          }
          catch (err) {
              console.warn(err.stack);
              console.warn(code2);
              console.warn(" ");
              throw err;
          }
          this.compiled_code[fullcode] = func;
      }
      else {
        func = this.compiled_code[fullcode];
      }
      try {
        return func.call(obj, obj, env);
      }
      catch (err) {
          console.warn(err.stack);
          let code2="func = function(obj, env) { "+envcode+"return "+code+"}";
          console.warn(code2);
          console.warn(" ");
          throw err;
      }
    }
     write_struct(data, obj, stt) {
      function use_helper_js(field) {
        let type=field.type.type;
        let cls=StructFieldTypeMap[type];
        return cls.useHelperJS(field);
      }
      let fields=stt.fields;
      let thestruct=this;
      for (let i=0; i<fields.length; i++) {
          let f=fields[i];
          let t1=f.type;
          let t2=t1.type;
          if (use_helper_js(f)) {
              let val;
              let type=t2;
              if (f.get!==undefined) {
                  val = thestruct._env_call(f.get, obj);
              }
              else {
                val = f.name==="this" ? obj : obj[f.name];
              }
              if (DEBUG.tinyeval) {
                  console.log("\n\n\n", f.get, "Helper JS Ret", val, "\n\n\n");
              }
              sintern2.do_pack(this, data, val, obj, f, t1);
          }
          else {
            let val=f.name==="this" ? obj : obj[f.name];
            sintern2.do_pack(this, data, val, obj, f, t1);
          }
      }
    }
     write_object(data, obj) {
      const keywords=this.constructor.keywords;
      let cls=obj.constructor.structName;
      let stt=this.get_struct(cls);
      if (data===undefined) {
          data = [];
      }
      this.write_struct(data, obj, stt);
      return data;
    }
     readObject(data, cls_or_struct_id, uctx) {
      if (__instance_of(data, Uint8Array)||__instance_of(data, Uint8ClampedArray)) {
          data = new DataView(data.buffer);
      }
      else 
        if (__instance_of(data, Array)) {
          data = new DataView(new Uint8Array(data).buffer);
      }
      return this.read_object(data, cls_or_struct_id, uctx);
    }
     writeObject(data, obj) {
      return this.write_object(data, obj);
    }
     writeJSON(obj, stt=undefined) {
      const keywords=this.constructor.keywords;
      let cls=obj.constructor;
      stt = stt||this.get_struct(cls.structName);
      function use_helper_js(field) {
        let type=field.type.type;
        let cls=StructFieldTypeMap[type];
        return cls.useHelperJS(field);
      }
      let toJSON=sintern2.toJSON;
      let fields=stt.fields;
      let thestruct=this;
      let json={};
      for (let i=0; i<fields.length; i++) {
          let f=fields[i];
          let val;
          let t1=f.type;
          let json2;
          if (use_helper_js(f)) {
              if (f.get!==undefined) {
                  val = thestruct._env_call(f.get, obj);
              }
              else {
                val = f.name==="this" ? obj : obj[f.name];
              }
              if (DEBUG.tinyeval) {
                  console.log("\n\n\n", f.get, "Helper JS Ret", val, "\n\n\n");
              }
              json2 = toJSON(this, val, obj, f, t1);
          }
          else {
            val = f.name==="this" ? obj : obj[f.name];
            json2 = toJSON(this, val, obj, f, t1);
          }
          if (f.name!=='this') {
              json[f.name] = json2;
          }
          else {
            let isArray=Array.isArray(json2);
            isArray = isArray||f.type.type===StructTypes.ARRAY;
            isArray = isArray||f.type.type===StructTypes.STATIC_ARRAY;
            if (isArray) {
                json.length = json2.length;
                for (let i=0; i<json2.length; i++) {
                    json[i] = json2[i];
                }
            }
            else {
              Object.assign(json, json2);
            }
          }
      }
      return json;
    }
     read_object(data, cls_or_struct_id, uctx, objInstance) {
      const keywords=this.constructor.keywords;
      let cls, stt;
      if (__instance_of(data, Array)) {
          data = new DataView(new Uint8Array(data).buffer);
      }
      if (typeof cls_or_struct_id==="number") {
          cls = this.struct_cls[this.struct_ids[cls_or_struct_id].name];
      }
      else {
        cls = cls_or_struct_id;
      }
      if (cls===undefined) {
          throw new Error("bad cls_or_struct_id "+cls_or_struct_id);
      }
      stt = this.structs[cls.structName];
      if (uctx===undefined) {
          uctx = new unpack_context();
          packer_debug$1("\n\n=Begin reading "+cls.structName+"=");
      }
      let thestruct=this;
      let this2=this;
      function unpack_field(type) {
        return StructFieldTypeMap[type.type].unpack(this2, data, type, uctx);
      }
      function unpack_into(type, dest) {
        return StructFieldTypeMap[type.type].unpackInto(this2, data, type, uctx, dest);
      }
      let was_run=false;
      function makeLoader(stt) {
        return function load(obj) {
          if (was_run) {
              return ;
          }
          was_run = true;
          let fields=stt.fields;
          let flen=fields.length;
          for (let i=0; i<flen; i++) {
              let f=fields[i];
              if (f.name==='this') {
                  unpack_into(f.type, obj);
              }
              else {
                obj[f.name] = unpack_field(f.type);
              }
          }
        }
      }
      let load=makeLoader(stt);
      if (cls.prototype.loadSTRUCT!==undefined) {
          let obj=objInstance;
          if (!obj&&cls.newSTRUCT!==undefined) {
              obj = cls.newSTRUCT(load);
          }
          else 
            if (!obj) {
              obj = new cls();
          }
          obj.loadSTRUCT(load);
          if (!was_run) {
              console.warn(""+cls.structName+".prototype.loadSTRUCT() did not execute its loader callback!");
              load(obj);
          }
          return obj;
      }
      else 
        if (cls.fromSTRUCT!==undefined) {
          if (warninglvl$1>1) {
              console.warn("Warning: class "+unmangle(cls.name)+" is using deprecated fromSTRUCT interface; use newSTRUCT/loadSTRUCT instead");
          }
          return cls.fromSTRUCT(load);
      }
      else {
        let obj=objInstance;
        if (!obj&&cls.newSTRUCT!==undefined) {
            obj = cls.newSTRUCT(load);
        }
        else 
          if (!obj) {
            obj = new cls();
        }
        load(obj);
        return obj;
      }
    }
     validateJSON(json, cls_or_struct_id, useInternalParser=true, useColors=true, consoleLogger=function () {
      console.log(...arguments);
    }, _abstractKey="_structName") {
      if (cls_or_struct_id===undefined) {
          throw new Error(this.constructor.name+".prototype.validateJSON: Expected at least two arguments");
      }
      try {
        json = JSON.stringify(json, undefined, 2);
        this.jsonBuf = json;
        this.jsonUseColors = useColors;
        this.jsonLogger = consoleLogger;
        jsonParser.logger = this.jsonLogger;
        if (useInternalParser) {
            json = jsonParser.parse(json);
        }
        else {
          json = JSON.parse(json);
        }
        this.validateJSONIntern(json, cls_or_struct_id, _abstractKey);
      }
      catch (error) {
          if (!(__instance_of(error, JSONError))) {
              console.error(error.stack);
          }
          this.jsonLogger(error.message);
          return false;
      }
      return true;
    }
     validateJSONIntern(json, cls_or_struct_id, _abstractKey="_structName") {
      const keywords=this.constructor.keywords;
      let cls, stt;
      if (typeof cls_or_struct_id==="number") {
          cls = this.struct_cls[this.struct_ids[cls_or_struct_id].name];
      }
      else 
        if (__instance_of(cls_or_struct_id, NStruct)) {
          cls = this.get_struct_cls(cls_or_struct_id.name);
      }
      else {
        cls = cls_or_struct_id;
      }
      if (cls===undefined) {
          throw new Error("bad cls_or_struct_id "+cls_or_struct_id);
      }
      stt = this.structs[cls.structName];
      if (stt===undefined) {
          throw new Error("unknown class "+cls);
      }
      let fields=stt.fields;
      let flen=fields.length;
      let keys=new Set();
      keys.add(_abstractKey);
      let keyTestJson=json;
      for (let i=0; i<flen; i++) {
          let f=fields[i];
          let val;
          let tokinfo;
          if (f.name==='this') {
              val = json;
              keyTestJson = {"this": json};
              keys.add("this");
              tokinfo = json[TokSymbol];
          }
          else {
            val = json[f.name];
            keys.add(f.name);
            tokinfo = json[TokSymbol] ? json[TokSymbol].fields[f.name] : undefined;
            if (!tokinfo) {
                let f2=fields[Math.max(i-1, 0)];
                tokinfo = TokSymbol[TokSymbol] ? json[TokSymbol].fields[f2.name] : undefined;
            }
            if (!tokinfo) {
                tokinfo = json[TokSymbol];
            }
          }
          if (val===undefined) {
          }
          let instance=f.name==='this' ? val : json;
          let ret=sintern2.validateJSON(this, val, json, f, f.type, instance, _abstractKey);
          if (!ret||typeof ret==="string") {
              let msg=typeof ret==="string" ? ": "+ret : "";
              if (tokinfo) {
                  this.jsonLogger(printContext(this.jsonBuf, tokinfo, this.jsonUseColors));
              }
              if (val===undefined) {
                  throw new JSONError(stt.name+": Missing json field "+f.name+msg);
              }
              else {
                throw new JSONError(stt.name+": Invalid json field "+f.name+msg);
              }
              return false;
          }
      }
      for (let k in keyTestJson) {
          if (typeof json[k]==="symbol") {
              continue;
          }
          if (!keys.has(k)) {
              this.jsonLogger(cls.STRUCT);
              throw new JSONError(stt.name+": Unknown json field "+k);
              return false;
          }
      }
      return true;
    }
     readJSON(json, cls_or_struct_id, objInstance=undefined) {
      const keywords=this.constructor.keywords;
      let cls, stt;
      if (typeof cls_or_struct_id==="number") {
          cls = this.struct_cls[this.struct_ids[cls_or_struct_id].name];
      }
      else 
        if (__instance_of(cls_or_struct_id, NStruct)) {
          cls = this.get_struct_cls(cls_or_struct_id.name);
      }
      else {
        cls = cls_or_struct_id;
      }
      if (cls===undefined) {
          throw new Error("bad cls_or_struct_id "+cls_or_struct_id);
      }
      stt = this.structs[cls.structName];
      packer_debug$1("\n\n=Begin reading "+cls.structName+"=");
      let thestruct=this;
      let this2=this;
      let was_run=false;
      let fromJSON=sintern2.fromJSON;
      function makeLoader(stt) {
        return function load(obj) {
          if (was_run) {
              return ;
          }
          was_run = true;
          let fields=stt.fields;
          let flen=fields.length;
          for (let i=0; i<flen; i++) {
              let f=fields[i];
              let val;
              if (f.name==='this') {
                  val = json;
              }
              else {
                val = json[f.name];
              }
              if (val===undefined) {
                  console.warn("nstructjs.readJSON: Missing field "+f.name+" in struct "+stt.name);
                  continue;
              }
              let instance=f.name==='this' ? obj : objInstance;
              let ret=fromJSON(this2, val, obj, f, f.type, instance);
              if (f.name!=='this') {
                  obj[f.name] = ret;
              }
          }
        }
      }
      let load=makeLoader(stt);
      if (cls.prototype.loadSTRUCT!==undefined) {
          let obj=objInstance;
          if (!obj&&cls.newSTRUCT!==undefined) {
              obj = cls.newSTRUCT(load);
          }
          else 
            if (!obj) {
              obj = new cls();
          }
          obj.loadSTRUCT(load);
          return obj;
      }
      else 
        if (cls.fromSTRUCT!==undefined) {
          if (warninglvl$1>1) {
              console.warn("Warning: class "+unmangle(cls.name)+" is using deprecated fromSTRUCT interface; use newSTRUCT/loadSTRUCT instead");
          }
          return cls.fromSTRUCT(load);
      }
      else {
        let obj=objInstance;
        if (!obj&&cls.newSTRUCT!==undefined) {
            obj = cls.newSTRUCT(load);
        }
        else 
          if (!obj) {
            obj = new cls();
        }
        load(obj);
        return obj;
      }
    }
     formatJSON_intern(json, stt, field, tlvl=0) {
      const keywords=this.constructor.keywords;
      const addComments=this.formatCtx.addComments;
      let s='{';
      if (addComments&&field&&field.comment.trim()) {
          s+=" "+field.comment.trim();
      }
      s+="\n";
      for (let f of stt.fields) {
          let value=json[f.name];
          s+=tab(tlvl+1)+f.name+": ";
          s+=sintern2.formatJSON(this, value, json, f, f.type, undefined, tlvl+1);
          s+=",";
          let basetype=f.type.type;
          if (ArrayTypes.has(basetype)) {
              basetype = f.type.data.type.type;
          }
          const addComment=ValueTypes.has(basetype)&&addComments&&f.comment.trim();
          if (addComment) {
              s+=" "+f.comment.trim();
          }
          s+="\n";
      }
      s+=tab(tlvl)+"}";
      return s;
    }
     formatJSON(json, cls, addComments=true, validate=true) {
      const keywords=this.constructor.keywords;
      let s='';
      if (validate) {
          this.validateJSON(json, cls);
      }
      let stt=this.structs[cls.structName];
      this.formatCtx = {addComments: addComments, 
     validate: validate};
      return this.formatJSON_intern(json, stt);
    }
  }
  _ESClass.register(STRUCT);
  _es6_module.add_class(STRUCT);
  
  if (haveCodeGen) {
      var StructClass;
      try {
        eval(code);
      }
      catch (error) {
          printEvalError(code);
      }
      StructClass.keywords = {name: "structName", 
     script: "STRUCT", 
     load: "loadSTRUCT", 
     from: "fromSTRUCT", 
     new: "newSTRUCT"};
      STRUCT = StructClass;
  }
  STRUCT.setClassKeyword("STRUCT");
  function deriveStructManager(keywords) {
    if (keywords===undefined) {
        keywords = {script: "STRUCT", 
      name: undefined, 
      load: undefined, 
      new: undefined, 
      from: undefined};
    }
    if (!keywords.name) {
        keywords.name = keywords.script.toLowerCase()+"Name";
    }
    if (!keywords.load) {
        keywords.load = "load"+keywords.script;
    }
    if (!keywords.new) {
        keywords.new = "new"+keywords.script;
    }
    if (!keywords.from) {
        keywords.from = "from"+keywords.script;
    }
    if (!haveCodeGen) {
        class NewSTRUCT extends STRUCT {
        }
        _ESClass.register(NewSTRUCT);
        _es6_module.add_class(NewSTRUCT);
        NewSTRUCT.keywords = keywords;
        return NewSTRUCT;
    }
    else {
      var StructClass;
      var _json_parser=jsonParser;
      var _util=util;
      let code2=code;
      code2 = code2.replace(/\[keywords.script\]/g, "."+keywords.script);
      code2 = code2.replace(/\[keywords.name\]/g, "."+keywords.name);
      code2 = code2.replace(/\bjsonParser\b/g, "_json_parser");
      code2 = code2.replace(/\butil\b/g, "_util");
      try {
        eval(code2);
      }
      catch (error) {
          printEvalError(code2);
      }
      StructClass.keywords = keywords;
      return StructClass;
    }
  }
  manager = new STRUCT();
  function write_scripts(nManager, include_code) {
    if (nManager===undefined) {
        nManager = manager;
    }
    if (include_code===undefined) {
        include_code = false;
    }
    let buf="";
    let nl=String.fromCharCode(10);
    let tab=String.fromCharCode(9);
    nManager.forEach(function (stt) {
      buf+=STRUCT.fmt_struct(stt, false, !include_code)+nl;
    });
    let buf2=buf;
    buf = "";
    for (let i=0; i<buf2.length; i++) {
        let c=buf2[i];
        if (c===nl) {
            buf+=nl;
            let i2=i;
            while (i<buf2.length&&(buf2[i]===" "||buf2[i]===tab||buf2[i]===nl)) {
              i++;
            }
            if (i!==i2)
              i--;
        }
        else {
          buf+=c;
        }
    }
    return buf;
  }
  "use strict";
  let nbtoa, natob;
  if (typeof btoa==="undefined") {
      nbtoa = function btoa(str) {
        let buffer=new Buffer(""+str, 'binary');
        return buffer.toString('base64');
      };
      natob = function atob(str) {
        return new Buffer(str, 'base64').toString('binary');
      };
  }
  else {
    natob = atob;
    nbtoa = btoa;
  }
  function versionToInt(v) {
    v = versionCoerce(v);
    let mul=64;
    return ~~(v.major*mul*mul*mul+v.minor*mul*mul+v.micro*mul);
  }
  let ver_pat=/[0-9]+\.[0-9]+\.[0-9]+$/;
  function versionCoerce(v) {
    if (!v) {
        throw new Error("empty version: "+v);
    }
    if (typeof v==="string") {
        if (!ver_pat.exec(v)) {
            throw new Error("invalid version string "+v);
        }
        let ver=v.split(".");
        return {major: parseInt(ver[0]), 
      minor: parseInt(ver[1]), 
      micro: parseInt(ver[2])}
    }
    else 
      if (Array.isArray(v)) {
        return {major: v[0], 
      minor: v[1], 
      micro: v[2]}
    }
    else 
      if (typeof v==="object") {
        let test=(k) =>          {
          return k in v&&typeof v[k]==="number";
        };
        if (!test("major")||!test("minor")||!test("micro")) {
            throw new Error("invalid version object: "+v);
        }
        return v;
    }
    else {
      throw new Error("invalid version "+v);
    }
  }
  function versionLessThan(a, b) {
    return versionToInt(a)<versionToInt(b);
  }
  class FileParams  {
     constructor() {
      this.magic = "STRT";
      this.ext = ".bin";
      this.blocktypes = ["DATA"];
      this.version = {major: 0, 
     minor: 0, 
     micro: 1};
    }
  }
  _ESClass.register(FileParams);
  _es6_module.add_class(FileParams);
  class Block  {
     constructor(type_magic, data) {
      this.type = type_magic;
      this.data = data;
    }
  }
  _ESClass.register(Block);
  _es6_module.add_class(Block);
  class FileeError extends Error {
  }
  _ESClass.register(FileeError);
  _es6_module.add_class(FileeError);
  class FileHelper  {
     constructor(params) {
      if (params===undefined) {
          params = new FileParams();
      }
      else {
        let fp=new FileParams();
        for (let k in params) {
            fp[k] = params[k];
        }
        params = fp;
      }
      this.version = params.version;
      this.blocktypes = params.blocktypes;
      this.magic = params.magic;
      this.ext = params.ext;
      this.struct = undefined;
      this.unpack_ctx = undefined;
    }
     read(dataview) {
      this.unpack_ctx = new unpack_context();
      let magic=unpack_static_string(dataview, this.unpack_ctx, 4);
      if (magic!==this.magic) {
          throw new FileError("corrupted file");
      }
      this.version = {};
      this.version.major = unpack_short(dataview, this.unpack_ctx);
      this.version.minor = unpack_byte(dataview, this.unpack_ctx);
      this.version.micro = unpack_byte(dataview, this.unpack_ctx);
      let struct=this.struct = new STRUCT();
      let scripts=unpack_string(dataview, this.unpack_ctx);
      this.struct.parse_structs(scripts, manager);
      let blocks=[];
      let dviewlen=dataview.buffer.byteLength;
      while (this.unpack_ctx.i<dviewlen) {
        let type=unpack_static_string(dataview, this.unpack_ctx, 4);
        let datalen=unpack_int(dataview, this.unpack_ctx);
        let bstruct=unpack_int(dataview, this.unpack_ctx);
        let bdata;
        if (bstruct===-2) {
            bdata = unpack_static_string(dataview, this.unpack_ctx, datalen);
        }
        else {
          bdata = unpack_bytes(dataview, this.unpack_ctx, datalen);
          bdata = struct.read_object(bdata, bstruct, new unpack_context());
        }
        let block=new Block();
        block.type = type;
        block.data = bdata;
        blocks.push(block);
      }
      this.blocks = blocks;
      return blocks;
    }
     doVersions(old) {
      let blocks=this.blocks;
      if (versionLessThan(old, "0.0.1")) {
      }
    }
     write(blocks) {
      this.struct = manager;
      this.blocks = blocks;
      let data=[];
      pack_static_string(data, this.magic, 4);
      pack_short(data, this.version.major);
      pack_byte(data, this.version.minor&255);
      pack_byte(data, this.version.micro&255);
      let scripts=write_scripts();
      pack_string(data, scripts);
      let struct=this.struct;
      for (let block of blocks) {
          if (typeof block.data==="string") {
              pack_static_string(data, block.type, 4);
              pack_int(data, block.data.length);
              pack_int(data, -2);
              pack_static_string(data, block.data, block.data.length);
              continue;
          }
          let structName=block.data.constructor.structName;
          if (structName===undefined||!(structName in struct.structs)) {
              throw new Error("Non-STRUCTable object "+block.data);
          }
          let data2=[];
          let stt=struct.structs[structName];
          struct.write_object(data2, block.data);
          pack_static_string(data, block.type, 4);
          pack_int(data, data2.length);
          pack_int(data, stt.id);
          pack_bytes(data, data2);
      }
      return new DataView(new Uint8Array(data).buffer);
    }
     writeBase64(blocks) {
      let dataview=this.write(blocks);
      let str="";
      let bytes=new Uint8Array(dataview.buffer);
      for (let i=0; i<bytes.length; i++) {
          str+=String.fromCharCode(bytes[i]);
      }
      return nbtoa(str);
    }
     makeBlock(type, data) {
      return new Block(type, data);
    }
     readBase64(base64) {
      let data=natob(base64);
      let data2=new Uint8Array(data.length);
      for (let i=0; i<data.length; i++) {
          data2[i] = data.charCodeAt(i);
      }
      return this.read(new DataView(data2.buffer));
    }
  }
  _ESClass.register(FileHelper);
  _es6_module.add_class(FileHelper);
  var struct_filehelper=Object.freeze({__proto__: null, 
   versionToInt: versionToInt, 
   versionCoerce: versionCoerce, 
   versionLessThan: versionLessThan, 
   FileParams: FileParams, 
   Block: Block, 
   FileeError: FileeError, 
   FileHelper: FileHelper});
  function truncateDollarSign$1(value) {
    if (value===undefined) {
        value = true;
    }
    setTruncateDollarSign(value);
  }
  function validateStructs(onerror) {
    return manager.validateStructs(onerror);
  }
  function setEndian(mode) {
    let ret=STRUCT_ENDIAN;
    setBinaryEndian(mode);
    return ret;
  }
  function consoleLogger() {
    console.log(...arguments);
  }
  function validateJSON$1(json, cls, useInternalParser, printColors, logger) {
    if (printColors===undefined) {
        printColors = true;
    }
    if (logger===undefined) {
        logger = consoleLogger;
    }
    return manager.validateJSON(json, cls, useInternalParser, printColors, logger);
  }
  function getEndian() {
    return STRUCT_ENDIAN;
  }
  function setAllowOverriding(t) {
    return manager.allowOverriding = !!t;
  }
  function isRegistered(cls) {
    return manager.isRegistered(cls);
  }
  function register(cls, structName) {
    return manager.register(cls, structName);
  }
  function unregister(cls) {
    manager.unregister(cls);
  }
  function inherit(child, parent, structName) {
    if (structName===undefined) {
        structName = child.name;
    }
    return STRUCT.inherit(...arguments);
  }
  function readObject(data, cls, __uctx) {
    if (__uctx===undefined) {
        __uctx = undefined;
    }
    return manager.readObject(data, cls, __uctx);
  }
  function writeObject(data, obj) {
    return manager.writeObject(data, obj);
  }
  function writeJSON(obj) {
    return manager.writeJSON(obj);
  }
  function formatJSON$1(json, cls, addComments, validate) {
    if (addComments===undefined) {
        addComments = true;
    }
    if (validate===undefined) {
        validate = true;
    }
    return manager.formatJSON(json, cls, addComments, validate);
  }
  function readJSON(json, class_or_struct_id) {
    return manager.readJSON(json, class_or_struct_id);
  }
  JSONError = _es6_module.add_export('JSONError', JSONError);
  STRUCT = _es6_module.add_export('STRUCT', STRUCT);
  _truncateDollarSign = _es6_module.add_export('_truncateDollarSign', _truncateDollarSign);
  struct_binpack = _es6_module.add_export('struct_binpack', struct_binpack);
  consoleLogger = _es6_module.add_export('consoleLogger', consoleLogger);
  deriveStructManager = _es6_module.add_export('deriveStructManager', deriveStructManager);
  struct_filehelper = _es6_module.add_export('struct_filehelper', struct_filehelper);
  formatJSON$1 = _es6_module.add_export('formatJSON$1', formatJSON$1);
  getEndian = _es6_module.add_export('getEndian', getEndian);
  inherit = _es6_module.add_export('inherit', inherit);
  isRegistered = _es6_module.add_export('isRegistered', isRegistered);
  manager = _es6_module.add_export('manager', manager);
  struct_parser = _es6_module.add_export('struct_parser', struct_parser);
  struct_parseutil = _es6_module.add_export('struct_parseutil', struct_parseutil);
  readJSON = _es6_module.add_export('readJSON', readJSON);
  readObject = _es6_module.add_export('readObject', readObject);
  register = _es6_module.add_export('register', register);
  setAllowOverriding = _es6_module.add_export('setAllowOverriding', setAllowOverriding);
  setDebugMode = _es6_module.add_export('setDebugMode', setDebugMode);
  setEndian = _es6_module.add_export('setEndian', setEndian);
  setTruncateDollarSign = _es6_module.add_export('setTruncateDollarSign', setTruncateDollarSign);
  setWarningMode = _es6_module.add_export('setWarningMode', setWarningMode);
  truncateDollarSign$1 = _es6_module.add_export('truncateDollarSign$1', truncateDollarSign$1);
  struct_typesystem = _es6_module.add_export('struct_typesystem', struct_typesystem);
  unpack_context = _es6_module.add_export('unpack_context', unpack_context);
  unregister = _es6_module.add_export('unregister', unregister);
  validateJSON$1 = _es6_module.add_export('validateJSON$1', validateJSON$1);
  validateStructs = _es6_module.add_export('validateStructs', validateStructs);
  writeJSON = _es6_module.add_export('writeJSON', writeJSON);
  writeObject = _es6_module.add_export('writeObject', writeObject);
  write_scripts = _es6_module.add_export('write_scripts', write_scripts);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/nstructjs_es6.js');


es6_module_define('parseutil', [], function _parseutil_module(_es6_module) {
  class token  {
     constructor(type, val, lexpos, lexlen, lineno, lexer, parser) {
      this.type = type;
      this.value = val;
      this.lexpos = lexpos;
      this.lexlen = lexlen;
      this.lineno = lineno;
      this.lexer = lexer;
      this.parser = parser;
    }
     setValue(val) {
      this.value = val;
      return this;
    }
     toString() {
      if (this.value!==undefined)
        return "token(type="+this.type+", value='"+this.value+"')";
      else 
        return "token(type="+this.type+")";
    }
  }
  _ESClass.register(token);
  _es6_module.add_class(token);
  token = _es6_module.add_export('token', token);
  class tokdef  {
     constructor(name, regexpr, func) {
      this.name = name;
      this.re = regexpr;
      this.func = func;
    }
  }
  _ESClass.register(tokdef);
  _es6_module.add_class(tokdef);
  tokdef = _es6_module.add_export('tokdef', tokdef);
  class PUTLParseError extends Error {
  }
  _ESClass.register(PUTLParseError);
  _es6_module.add_class(PUTLParseError);
  PUTLParseError = _es6_module.add_export('PUTLParseError', PUTLParseError);
  class lexer  {
     constructor(tokdef, errfunc) {
      this.tokdef = tokdef;
      this.tokens = new Array();
      this.lexpos = 0;
      this.lexdata = "";
      this.lineno = 0;
      this.errfunc = errfunc;
      this.tokints = {};
      this.print_tokens = false;
      this.print_debug = false;
      for (let i=0; i<tokdef.length; i++) {
          this.tokints[tokdef[i].name] = i;
      }
      this.statestack = [["__main__", 0]];
      this.states = {"__main__": [tokdef, errfunc]};
      this.statedata = 0;
    }
     copy() {
      let ret=new lexer(this.tokdef, this.errfunc);
      for (let k in this.states) {
          let state=this.states[k];
          state = [state[0], state[1]];
          ret.states[k] = state;
      }
      ret.statedata = this.statedata;
      return ret;
    }
     add_state(name, tokdef, errfunc) {
      if (errfunc===undefined) {
          errfunc = function (lexer) {
            return true;
          };
      }
      this.states[name] = [tokdef, errfunc];
    }
     tok_int(name) {

    }
     push_state(state, statedata) {
      this.statestack.push([state, statedata]);
      state = this.states[state];
      this.statedata = statedata;
      this.tokdef = state[0];
      this.errfunc = state[1];
    }
     pop_state() {
      let item=this.statestack[this.statestack.length-1];
      let state=this.states[item[0]];
      this.tokdef = state[0];
      this.errfunc = state[1];
      this.statedata = item[1];
    }
     input(str) {
      while (this.statestack.length>1) {
        this.pop_state();
      }
      this.lexdata = str;
      this.lexpos = 0;
      this.lineno = 0;
      this.tokens = new Array();
      this.peeked_tokens = [];
    }
     error() {
      if (this.errfunc!==undefined&&!this.errfunc(this))
        return ;
      console.log("Syntax error near line "+this.lineno);
      let next=Math.min(this.lexpos+8, this.lexdata.length);
      console.log("  "+this.lexdata.slice(this.lexpos, next));
      throw new PUTLParseError("Parse error");
    }
     peek() {
      let tok=this.next(true);
      if (tok===undefined)
        return undefined;
      this.peeked_tokens.push(tok);
      return tok;
    }
     peek_i(i) {
      while (this.peeked_tokens.length<=i) {
        let t=this.peek();
        if (t===undefined)
          return undefined;
      }
      return this.peeked_tokens[i];
    }
     at_end() {
      return this.lexpos>=this.lexdata.length&&this.peeked_tokens.length===0;
    }
     next(ignore_peek) {
      if (ignore_peek!==true&&this.peeked_tokens.length>0) {
          let tok=this.peeked_tokens[0];
          if (this.print_debug) {
              console.log("PEEK_SHIFTING", ""+tok);
          }
          this.peeked_tokens.shift();
          if (this.print_tokens) {
              console.log(tok.toString());
          }
          return tok;
      }
      if (this.lexpos>=this.lexdata.length)
        return undefined;
      let ts=this.tokdef;
      let tlen=ts.length;
      let lexdata=this.lexdata.slice(this.lexpos, this.lexdata.length);
      let results=[];
      for (let i=0; i<tlen; i++) {
          let t=ts[i];
          if (t.re===undefined)
            continue;
          let res=t.re.exec(lexdata);
          if (res!==null&&res!==undefined&&res.index===0) {
              results.push([t, res]);
          }
      }
      let max_res=0;
      let theres=undefined;
      for (let i=0; i<results.length; i++) {
          let res=results[i];
          if (res[1][0].length>max_res) {
              theres = res;
              max_res = res[1][0].length;
          }
      }
      if (theres===undefined) {
          this.error();
          return ;
      }
      let def=theres[0];
      let lexlen=max_res;
      let tok=new token(def.name, theres[1][0], this.lexpos, lexlen, this.lineno, this, undefined);
      this.lexpos+=max_res;
      if (def.func) {
          tok = def.func(tok);
          if (tok===undefined) {
              return this.next(ignore_peek);
          }
      }
      if (this.print_tokens) {
          console.log(tok.toString());
      }
      if (!ignore_peek&&this.print_debug) {
          console.log("CONSUME", tok.toString(), "\n"+getTraceBack());
      }
      return tok;
    }
  }
  _ESClass.register(lexer);
  _es6_module.add_class(lexer);
  lexer = _es6_module.add_export('lexer', lexer);
  function getTraceBack(limit, start) {
    try {
      throw new Error();
    }
    catch (error) {
        let stack=error.stack.split("\n");
        stack = stack.slice(1, stack.length);
        if (start===undefined) {
            start = 0;
        }
        for (let i=0; i<stack.length; i++) {
            let l=stack[i];
            let j=l.length-1;
            while (j>0&&l[j]!=="/") {
              j--;
            }
            let k=j;
            while (k>=0&&l[k]!=="(") {
              k--;
            }
            let func=l.slice(0, k).trim();
            let file=l.slice(j+1, l.length-1);
            l = `  ${func} (${file})`;
            if (l.search(/parseutil\.js/)>=0) {
                start = Math.max(start, i);
            }
            stack[i] = l;
        }
        if (limit!==undefined) {
            stack.length = Math.min(stack.length, limit);
        }
        if (start!==undefined) {
            stack = stack.slice(start, stack.length);
        }
        stack = stack.join("\n");
        return stack;
    }
  }
  getTraceBack = _es6_module.add_export('getTraceBack', getTraceBack);
  class parser  {
     constructor(lexer, errfunc) {
      this.lexer = lexer;
      this.errfunc = errfunc;
      this.start = undefined;
      this.userdata = undefined;
    }
     copy() {
      let ret=new parser(this.lexer.copy(), this.errfunc);
      ret.start = this.start;
      return ret;
    }
     parse(data, err_on_unconsumed) {
      if (err_on_unconsumed===undefined)
        err_on_unconsumed = true;
      if (data!==undefined)
        this.lexer.input(data);
      let ret=this.start(this);
      if (err_on_unconsumed&&!this.lexer.at_end()&&this.lexer.next()!==undefined) {
          this.error(undefined, "parser did not consume entire input");
      }
      return ret;
    }
     input(data) {
      this.lexer.input(data);
    }
     error(tok, msg) {
      if (msg===undefined)
        msg = "";
      let estr;
      if (tok===undefined)
        estr = "Parse error at end of input: "+msg;
      else 
        estr = "Parse error at line "+(tok.lineno+1)+": "+msg;
      let buf="1| ";
      let ld=this.lexer.lexdata;
      let l=1;
      for (let i=0; i<ld.length; i++) {
          let c=ld[i];
          if (c==='\n') {
              l++;
              buf+="\n"+l+"| ";
          }
          else {
            buf+=c;
          }
      }
      console.log("------------------");
      console.log(buf);
      console.log("==================");
      console.log(estr);
      if (this.errfunc&&!this.errfunc(tok)) {
          return ;
      }
      throw new PUTLParseError(estr);
    }
     peek() {
      let tok=this.lexer.peek();
      if (tok!==undefined)
        tok.parser = this;
      return tok;
    }
     peek_i(i) {
      let tok=this.lexer.peek_i(i);
      if (tok!==undefined)
        tok.parser = this;
      return tok;
    }
     peeknext() {
      return this.peek_i(0);
    }
     next() {
      let tok=this.lexer.next();
      if (tok!==undefined)
        tok.parser = this;
      return tok;
    }
     optional(type) {
      let tok=this.peek_i(0);
      if (tok&&tok.type===type) {
          this.next();
          return true;
      }
      return false;
    }
     at_end() {
      return this.lexer.at_end();
    }
     expect(type, msg) {
      let tok=this.next();
      if (msg===undefined)
        msg = type;
      if (tok===undefined||tok.type!=type) {
          this.error(tok, "Expected "+msg+", not "+tok.type);
      }
      return tok.value;
    }
  }
  _ESClass.register(parser);
  _es6_module.add_class(parser);
  parser = _es6_module.add_export('parser', parser);
  function test_parser() {
    let basic_types=new set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string"]);
    let reserved_tokens=new set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string", "static_string", "array"]);
    function tk(name, re, func) {
      return new tokdef(name, re, func);
    }
    let tokens=[tk("ID", /[a-zA-Z]+[a-zA-Z0-9_]*/, function (t) {
      if (reserved_tokens.has(t.value)) {
          t.type = t.value.toUpperCase();
      }
      return t;
    }), tk("OPEN", /\{/), tk("CLOSE", /}/), tk("COLON", /:/), tk("JSCRIPT", /\|/, function (t) {
      let js="";
      let lexer=t.lexer;
      while (lexer.lexpos<lexer.lexdata.length) {
        let c=lexer.lexdata[lexer.lexpos];
        if (c==="\n")
          break;
        js+=c;
        lexer.lexpos++;
      }
      if (js.endsWith(";")) {
          js = js.slice(0, js.length-1);
          lexer.lexpos--;
      }
      t.value = js;
      return t;
    }), tk("LPARAM", /\(/), tk("RPARAM", /\)/), tk("COMMA", /,/), tk("NUM", /[0-9]/), tk("SEMI", /;/), tk("NEWLINE", /\n/, function (t) {
      t.lexer.lineno+=1;
    }), tk("SPACE", / |\t/, function (t) {
    })];
    for (let rt in reserved_tokens) {
        tokens.push(tk(rt.toUpperCase()));
    }
    function errfunc(lexer) {
      return true;
    }
    let lex=new lexer(tokens, errfunc);
    console.log("Testing lexical scanner...");
    lex.input(a);
    let tok;
    while (tok = lex.next()) {
      console.log(tok.toString());
    }
    let parser=new parser(lex);
    parser.input(a);
    function p_Array(p) {
      p.expect("ARRAY");
      p.expect("LPARAM");
      let arraytype=p_Type(p);
      let itername="";
      if (p.optional("COMMA")) {
          itername = arraytype;
          arraytype = p_Type(p);
      }
      p.expect("RPARAM");
      return {type: "array", 
     data: {type: arraytype, 
      iname: itername}}
    }
    function p_Type(p) {
      let tok=p.peek();
      if (tok.type==="ID") {
          p.next();
          return {type: "struct", 
       data: "\""+tok.value+"\""}
      }
      else 
        if (basic_types.has(tok.type.toLowerCase())) {
          p.next();
          return {type: tok.type.toLowerCase()}
      }
      else 
        if (tok.type==="ARRAY") {
          return p_Array(p);
      }
      else {
        p.error(tok, "invalid type "+tok.type);
      }
    }
    function p_Field(p) {
      let field={}
      console.log("-----", p.peek().type);
      field.name = p.expect("ID", "struct field name");
      p.expect("COLON");
      field.type = p_Type(p);
      field.set = undefined;
      field.get = undefined;
      let tok=p.peek();
      if (tok.type==="JSCRIPT") {
          field.get = tok.value;
          p.next();
      }
      tok = p.peek();
      if (tok.type==="JSCRIPT") {
          field.set = tok.value;
          p.next();
      }
      p.expect("SEMI");
      return field;
    }
    function p_Struct(p) {
      let st={}
      st.name = p.expect("ID", "struct name");
      st.fields = [];
      p.expect("OPEN");
      while (1) {
        if (p.at_end()) {
            p.error(undefined);
        }
        else 
          if (p.optional("CLOSE")) {
            break;
        }
        else {
          st.fields.push(p_Field(p));
        }
      }
      return st;
    }
    let ret=p_Struct(parser);
    console.log(JSON.stringify(ret));
  }
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/parseutil.js');


es6_module_define('simple_events', ["./vectormath.js", "./util.js", "../config/config.js"], function _simple_events_module(_es6_module) {
  var util=es6_import(_es6_module, './util.js');
  var cconst=es6_import_item(_es6_module, '../config/config.js', 'default');
  var Vector2=es6_import_item(_es6_module, './vectormath.js', 'Vector2');
  let modalstack=[];
  modalstack = _es6_module.add_export('modalstack', modalstack);
  let singleMouseCBs={}
  function debugDomEvents() {
    let cbsymbol=Symbol("event-callback");
    let thsymbol=Symbol("debug-info");
    let idgen=0;
    function init(et) {
      if (!et[thsymbol]) {
          et[thsymbol] = idgen++;
      }
    }
    function getkey(et, type, options) {
      init(et);
      return ""+et[thsymbol]+":"+type+":"+JSON.stringify(options);
    }
    let addEventListener=EventTarget.prototype.addEventListener;
    let removeEventListener=EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function (type, cb, options) {
      init(this);
      if (!cb[cbsymbol]) {
          cb[cbsymbol] = new Set();
      }
      let key=getkey(this, type, options);
      cb[cbsymbol].add(key);
      return addEventListener.call(this, type, cb, options);
    }
    EventTarget.prototype.removeEventListener = function (type, cb, options) {
      init(this);
      if (!cb[cbsymbol]) {
          console.error("Invalid callback in removeEventListener for", type, this, cb);
          return ;
      }
      let key=getkey(this, type, options);
      if (!cb[cbsymbol].has(key)) {
          console.error("Callback not in removeEventListener;", type, this, cb);
          return ;
      }
      cb[cbsymbol].delete(key);
      return removeEventListener.call(this, type, cb, options);
    }
  }
  function singletonMouseEvents() {
    let keys=["mousedown", "mouseup", "mousemove"];
    for (let k of keys) {
        singleMouseCBs[k] = new Set();
    }
    let ddd=-1.0;
    window.testSingleMouseUpEvent = (type) =>      {
      if (type===undefined) {
          type = "mousedown";
      }
      let id=ddd++;
      singleMouseEvent(() =>        {
        console.log("mouse event", id);
      }, type);
    }
    let _mpos=new Vector2();
    function doSingleCbs(e, type) {
      let list=singleMouseCBs[type];
      singleMouseCBs[type] = new Set();
      if (e.type!=="touchend"&&e.type!=="touchcancel") {
          _mpos[0] = e.touches&&e.touches.length>0 ? e.touches[0].pageX : e.x;
          _mpos[1] = e.touches&&e.touches.length>0 ? e.touches[0].pageY : e.y;
      }
      if (e.touches) {
          e = copyEvent(e);
          e.type = type;
          if (e.touches.length>0) {
              e.x = e.pageX = e.touches[0].pageX;
              e.y = e.pageY = e.touches[0].pageY;
          }
          else {
            e.x = _mpos[0];
            e.y = _mpos[1];
          }
      }
      for (let cb of list) {
          try {
            cb(e);
          }
          catch (error) {
              util.print_stack(error);
              console.warn("Error in event callback");
          }
      }
    }
    window.addEventListener("mouseup", (e) =>      {
      doSingleCbs(e, "mouseup");
    }, {capture: true});
    window.addEventListener("touchcancel", (e) =>      {
      doSingleCbs(e, "mouseup");
    }, {capture: true});
    document.addEventListener("touchend", (e) =>      {
      doSingleCbs(e, "mouseup");
    }, {capture: true});
    document.addEventListener("mousedown", (e) =>      {
      doSingleCbs(e, "mousedown");
    }, {capture: true});
    document.addEventListener("touchstart", (e) =>      {
      doSingleCbs(e, "mousedown");
    }, {capture: true});
    document.addEventListener("mousemove", (e) =>      {
      doSingleCbs(e, "mousemove");
    }, {capture: true});
    document.addEventListener("touchmove", (e) =>      {
      doSingleCbs(e, "mousemove");
    }, {capture: true});
    return {singleMouseEvent: function singleMouseEvent(cb, type) {
        if (!(type in singleMouseCBs)) {
            throw new Error("not a mouse event");
        }
        singleMouseCBs[type].add(cb);
      }}
  }
  singletonMouseEvents = singletonMouseEvents();
  function singleMouseEvent(cb, type) {
    return singletonMouseEvents.singleMouseEvent(cb, type);
  }
  singleMouseEvent = _es6_module.add_export('singleMouseEvent', singleMouseEvent);
  function isLeftClick(e) {
    if (e.touches!==undefined) {
        return e.touches.length===1;
    }
    return e.button===0;
  }
  isLeftClick = _es6_module.add_export('isLeftClick', isLeftClick);
  class DoubleClickHandler  {
     constructor() {
      this.down = 0;
      this.last = 0;
      this.dblEvent = undefined;
      this.start_mpos = new Vector2();
      this._on_mouseup = this._on_mouseup.bind(this);
      this._on_mousemove = this._on_mousemove.bind(this);
    }
     _on_mouseup(e) {
      this.mdown = false;
    }
     _on_mousemove(e) {
      let mpos=new Vector2();
      mpos[0] = e.x;
      mpos[1] = e.y;
      let dist=mpos.vectorDistance(this.start_mpos)*devicePixelRatio;
      if (dist>11) {
          this.mdown = false;
      }
      if (this.mdown) {
          singleMouseEvent(this._on_mousemove, "mousemove");
      }
      this.update();
    }
     mousedown(e) {
      if (!this.last) {
          this.last = 0;
      }
      if (!this.down) {
          this.down = 0;
      }
      if (!this.up) {
          this.up = 0;
      }
      if (isMouseDown(e)) {
          this.mdown = true;
          let cpy=Object.assign({}, e);
          this.start_mpos[0] = e.x;
          this.start_mpos[1] = e.y;
          singleMouseEvent(this._on_mousemove, "mousemove");
          if (e.type.search("touch")>=0&&e.touches.length>0) {
              cpy.x = cpy.pageX = e.touches[0].pageX;
              cpy.y = cpy.pageY = e.touches[1].pageY;
          }
          else {
            cpy.x = cpy.pageX = e.x;
            cpy.y = cpy.pageY = e.y;
          }
          this.dblEvent = copyEvent(e);
          this.dblEvent.type = "dblclick";
          this.last = this.down;
          this.down = util.time_ms();
          if (this.down-this.last<cconst.doubleClickTime) {
              this.mdown = false;
              this.ondblclick(this.dblEvent);
              this.down = this.last = 0.0;
          }
          else {
            singleMouseEvent(this._on_mouseup, "mouseup");
          }
      }
      else {
        this.mdown = false;
      }
    }
     ondblclick(e) {

    }
     update() {
      if (modalstack.length>0) {
          this.mdown = false;
      }
      if (this.mdown&&util.time_ms()-this.down>cconst.doubleClickHoldTime) {
          this.mdown = false;
          this.ondblclick(this.dblEvent);
      }
    }
     abort() {
      this.last = this.down = 0;
    }
  }
  _ESClass.register(DoubleClickHandler);
  _es6_module.add_class(DoubleClickHandler);
  DoubleClickHandler = _es6_module.add_export('DoubleClickHandler', DoubleClickHandler);
  function isMouseDown(e) {
    let mdown=0;
    if (e.touches!==undefined) {
        mdown = e.touches.length>0;
    }
    else {
      mdown = e.buttons;
    }
    mdown = mdown&1;
    return mdown;
  }
  isMouseDown = _es6_module.add_export('isMouseDown', isMouseDown);
  function pathDebugEvent(e, extra) {
    e.__prevdef = e.preventDefault;
    e.__stopprop = e.stopPropagation;
    e.preventDefault = function () {
      console.warn("preventDefault", extra);
      return this.__prevdef();
    }
    e.stopPropagation = function () {
      console.warn("stopPropagation", extra);
      return this.__stopprop();
    }
  }
  pathDebugEvent = _es6_module.add_export('pathDebugEvent', pathDebugEvent);
  function eventWasTouch(e) {
    let ret=e.sourceCapabilities&&e.sourceCapabilities.firesTouchEvents;
    ret = ret||e.was_touch;
    ret = ret||__instance_of(e, TouchEvent);
    ret = ret||e.touches!==undefined;
    if (__instance_of(e, PointerEvent)) {
        ret = ret||(e.pointerType==="pen"||e.pointerType==="touch");
    }
    return ret;
  }
  eventWasTouch = _es6_module.add_export('eventWasTouch', eventWasTouch);
  function copyEvent(e) {
    let ret={}
    let keys=[];
    for (let k in e) {
        keys.push(k);
    }
    keys = keys.concat(Object.getOwnPropertySymbols(e));
    keys = keys.concat(Object.getOwnPropertyNames(e));
    for (let k of keys) {
        let v;
        try {
          v = e[k];
        }
        catch (error) {
            console.warn("read error for event key", k);
            continue;
        }
        if (typeof v=="function") {
            ret[k] = v.bind(e);
        }
        else {
          ret[k] = v;
        }
    }
    ret.original = e;
    return ret;
  }
  copyEvent = _es6_module.add_export('copyEvent', copyEvent);
  let Screen;
  function _setScreenClass(cls) {
    Screen = cls;
  }
  _setScreenClass = _es6_module.add_export('_setScreenClass', _setScreenClass);
  function findScreen() {
    let rec=(n) =>      {
      for (let n2 of n.childNodes) {
          if (n2&&typeof n2==="object"&&__instance_of(n2, Screen)) {
              return n2;
          }
      }
      for (let n2 of n.childNodes) {
          let ret=rec(n2);
          if (ret) {
              return ret;
          }
      }
    }
    return rec(document.body);
  }
  window._findScreen = findScreen;
  let ContextAreaClass;
  function _setModalAreaClass(cls) {
    ContextAreaClass = cls;
  }
  _setModalAreaClass = _es6_module.add_export('_setModalAreaClass', _setModalAreaClass);
  function pushPointerModal(obj, elem, pointerId, autoStopPropagation) {
    if (autoStopPropagation===undefined) {
        autoStopPropagation = true;
    }
    return pushModalLight(obj, autoStopPropagation, elem, pointerId);
  }
  pushPointerModal = _es6_module.add_export('pushPointerModal', pushPointerModal);
  function pushModalLight(obj, autoStopPropagation, elem, pointerId) {
    if (autoStopPropagation===undefined) {
        autoStopPropagation = true;
    }
    let keys;
    if (pointerId===undefined) {
        keys = new Set(["keydown", "keyup", "mousedown", "mouseup", "touchstart", "touchend", "touchcancel", "mousewheel", "mousemove", "mouseover", "mouseout", "mouseenter", "mouseleave", "dragstart", "drag", "dragend", "dragexit", "dragleave", "dragover", "dragenter", "drop", "pointerdown", "pointermove", "pointerup", "pointercancel", "pointerstart", "pointerend", "pointerleave", "pointerexit", "pointerenter", "pointerover"]);
    }
    else {
      keys = new Set(["keydown", "keyup", "keypress", "mousewheel"]);
    }
    let ret={keys: keys, 
    handlers: {}, 
    last_mpos: [0, 0]}
    let touchmap={"touchstart": "mousedown", 
    "touchmove": "mousemove", 
    "touchend": "mouseup", 
    "touchcancel": "mouseup"}
    let mpos=[0, 0];
    let screen=findScreen();
    if (screen) {
        mpos[0] = screen.mpos[0];
        mpos[1] = screen.mpos[1];
        screen = undefined;
    }
    function handleAreaContext() {
      let screen=findScreen();
      if (screen) {
          let sarea=screen.findScreenArea(mpos[0], mpos[1]);
          if (sarea&&sarea.area) {
              sarea.area.push_ctx_active();
              sarea.area.pop_ctx_active();
          }
      }
    }
    function make_default_touchhandler(type, state) {
      return function (e) {
        if (cconst.DEBUG.domEvents) {
            pathDebugEvent(e);
        }
        if (touchmap[type] in ret.handlers) {
            let type2=touchmap[type];
            let e2=copyEvent(e);
            e2.was_touch = true;
            e2.type = type2;
            e2.button = type=="touchcancel" ? 1 : 0;
            e2.touches = e.touches;
            if (e.touches.length>0) {
                let t=e.touches[0];
                mpos[0] = t.pageX;
                mpos[1] = t.pageY;
                e2.pageX = e2.x = t.pageX;
                e2.pageY = e2.y = t.pageY;
                e2.clientX = t.clientX;
                e2.clientY = t.clientY;
                e2.x = t.clientX;
                e2.y = t.clientY;
                ret.last_mpos[0] = e2.x;
                ret.last_mpos[1] = e2.y;
            }
            else {
              e2.x = e2.clientX = e2.pageX = e2.screenX = ret.last_mpos[0];
              e2.y = e2.clientY = e2.pageY = e2.screenY = ret.last_mpos[1];
            }
            e2.was_touch = true;
            handleAreaContext();
            ret.handlers[type2](e2);
        }
        if (autoStopPropagation) {
            e.preventDefault();
            e.stopPropagation();
        }
      }
    }
    function make_handler(type, key) {
      return function (e) {
        if (cconst.DEBUG.domEvents) {
            pathDebugEvent(e);
        }
        if (typeof key!=="string") {
            return ;
        }
        if (key.startsWith("mouse")) {
            mpos[0] = e.pageX;
            mpos[1] = e.pageY;
        }
        else 
          if (key.startsWith("pointer")) {
            mpos[0] = e.x;
            mpos[1] = e.y;
        }
        handleAreaContext();
        if (key!==undefined)
          obj[key](e);
        if (autoStopPropagation) {
            e.preventDefault();
            e.stopPropagation();
        }
      }
    }
    let found={}
    for (let k of keys) {
        let key;
        if (obj[k])
          key = k;
        else 
          if (obj["on"+k])
          key = "on"+k;
        else 
          if (obj["on_"+k])
          key = "on_"+k;
        else 
          if (k in touchmap)
          continue;
        else 
          key = undefined;
        if (key===undefined&&k.search("pointer")===0) {
            continue;
        }
        if (key!==undefined) {
            found[k] = 1;
        }
        let handler=make_handler(k, key);
        ret.handlers[k] = handler;
        let settings=handler.settings = {passive: false, 
      capture: true};
        window.addEventListener(k, handler, settings);
    }
    for (let k in touchmap) {
        if (!(k in found)) {
            ret.handlers[k] = make_default_touchhandler(k, ret);
            let settings=ret.handlers[k].settings = {passive: false, 
        capture: true};
            window.addEventListener(k, ret.handlers[k], settings);
        }
    }
    if (pointerId!==undefined) {
        ret.pointer = {elem: elem, 
      pointerId: pointerId};
        function make_pointer(k) {
          let k2="on_"+k;
          ret.pointer[k] = function (e) {
            if (obj[k2]!==undefined) {
                obj[k2](e);
            }
            if (autoStopPropagation) {
                e.stopPropagation();
                e.preventDefault();
            }
          }
        }
        make_pointer("pointerdown");
        make_pointer("pointermove");
        make_pointer("pointerup");
        make_pointer("pointerstart");
        make_pointer("pointerend");
        make_pointer("pointerleave");
        make_pointer("pointerenter");
        make_pointer("pointerout");
        make_pointer("pointerover");
        make_pointer("pointerexit");
        make_pointer("pointercancel");
        for (let k in ret.pointer) {
            if (k!=="elem"&&k!=="pointerId") {
                elem.addEventListener(k, ret.pointer[k]);
            }
        }
        try {
          elem.setPointerCapture(pointerId);
        }
        catch (error) {
            util.print_stack(error);
            console.log("attempting fallback");
            for (let k in ret.pointer) {
                if (k!=="elem"&&k!=="pointerId") {
                    elem.removeEventListener(k, ret.pointer[k]);
                }
            }
            delete ret.pointer;
            modalstack.push(ret);
            popModalLight(ret);
            for (let k in obj) {
                if (k==="pointercancel"||k==="pointerend"||k==="pointerstart") {
                    continue;
                }
                if (k.startsWith("pointer")) {
                    let k2=k.replace(/pointer/, "mouse");
                    if (k2 in obj) {
                        console.warn("warning, existing mouse handler", k2);
                        continue;
                    }
                    let v=obj[k];
                    obj[k] = undefined;
                    obj[k2] = v;
                }
            }
            console.log(obj);
            return pushModalLight(obj, autoStopPropagation);
        }
    }
    modalstack.push(ret);
    ContextAreaClass.lock();
    if (cconst.DEBUG.modalEvents) {
        console.warn("pushModalLight", ret.pointer ? "(pointer events)" : "");
    }
    return ret;
  }
  pushModalLight = _es6_module.add_export('pushModalLight', pushModalLight);
  if (0) {
      window._print_evt_debug = false;
      function evtprint() {
        if (window.window._print_evt_debug) {
            console.warn(...arguments);
        }
      }
      let addevent=EventTarget.prototype.addEventListener;
      let remevent=EventTarget.prototype.removeEventListener;
      const funckey=Symbol("eventfunc");
      EventTarget.prototype.addEventListener = function (name, func, args) {
        evtprint("listener added", name, func.name, args);
        let func2=function (e) {
          let proxy=new Proxy(e, {get: function get(target, p, receiver) {
              if (p==="preventDefault") {
                  return function () {
                    evtprint("preventDefault", name, arguments);
                    return e.preventDefault(...arguments);
                  }
              }
              else 
                if (p==="stopPropagation") {
                  return function () {
                    evtprint("stopPropagation", name, arguments);
                    return e.preventDefault(...arguments);
                  }
              }
              return e[p];
            }});
          return func.call(this, proxy);
        }
        func[funckey] = func2;
        return addevent.call(this, name, func2, args);
      };
      EventTarget.prototype.removeEventListener = function (name, func, args) {
        evtprint("listener removed", name, func.name, args);
        func = func[funckey];
        return remevent.call(this, name, func, args);
      };
  }
  function popModalLight(state) {
    if (state===undefined) {
        console.warn("Bad call to popModalLight: state was undefined");
        return ;
    }
    if (state!==modalstack[modalstack.length-1]) {
        if (modalstack.indexOf(state)<0) {
            console.warn("Error in popModalLight; modal handler not found");
            return ;
        }
        else {
          console.warn("Error in popModalLight; called in wrong order");
        }
    }
    for (let k in state.handlers) {
        window.removeEventListener(k, state.handlers[k], state.handlers[k].settings);
    }
    state.handlers = {}
    modalstack.remove(state);
    ContextAreaClass.unlock();
    if (cconst.DEBUG.modalEvents) {
        console.warn("popModalLight", modalstack, state.pointer ? "(pointer events)" : "");
    }
    if (state.pointer) {
        let elem=state.pointer.elem;
        try {
          elem.releasePointerCapture(state.pointer.pointerId);
        }
        catch (error) {
            util.print_stack(error);
        }
        for (let k in state.pointer) {
            if (k!=="elem"&&k!=="pointerId") {
                elem.removeEventListener(k, state.pointer[k]);
            }
        }
    }
  }
  popModalLight = _es6_module.add_export('popModalLight', popModalLight);
  function haveModal() {
    return modalstack.length>0;
  }
  haveModal = _es6_module.add_export('haveModal', haveModal);
  window._haveModal = haveModal;
  var keymap_latin_1={"Space": 32, 
   "Escape": 27, 
   "Enter": 13, 
   "Return": 13, 
   "Up": 38, 
   "Down": 40, 
   "Left": 37, 
   "Right": 39, 
   "Num0": 96, 
   "Num1": 97, 
   "Num2": 98, 
   "Num3": 99, 
   "Num4": 100, 
   "Num5": 101, 
   "Num6": 102, 
   "Num7": 103, 
   "Num8": 104, 
   "Num9": 105, 
   "Home": 36, 
   "End": 35, 
   "Delete": 46, 
   "Backspace": 8, 
   "Insert": 45, 
   "PageUp": 33, 
   "PageDown": 34, 
   "Tab": 9, 
   "-": 189, 
   "=": 187, 
   ".": 190, 
   "/": 191, 
   ",": 188, 
   ";": 186, 
   "'": 222, 
   "[": 219, 
   "]": 221, 
   "NumPlus": 107, 
   "NumMinus": 109, 
   "Shift": 16, 
   "Ctrl": 17, 
   "Control": 17, 
   "Alt": 18}
  keymap_latin_1 = _es6_module.add_export('keymap_latin_1', keymap_latin_1);
  for (var i=0; i<26; i++) {
      keymap_latin_1[String.fromCharCode(i+65)] = i+65;
  }
  for (var i=0; i<10; i++) {
      keymap_latin_1[String.fromCharCode(i+48)] = i+48;
  }
  for (var k in keymap_latin_1) {
      if (!(k in keymap_latin_1)) {
          keymap_latin_1[keymap_latin_1[k]] = k;
      }
  }
  var keymap_latin_1_rev={}
  for (var k in keymap_latin_1) {
      keymap_latin_1_rev[keymap_latin_1[k]] = k;
  }
  var keymap=keymap_latin_1;
  keymap = _es6_module.add_export('keymap', keymap);
  var reverse_keymap=keymap_latin_1_rev;
  reverse_keymap = _es6_module.add_export('reverse_keymap', reverse_keymap);
  class HotKey  {
     constructor(key, modifiers, action, uiname) {
      this.action = action;
      this.mods = modifiers;
      this.key = keymap[key];
      this.uiname = uiname;
    }
     exec(ctx) {
      if (typeof this.action=="string") {
          ctx.api.execTool(ctx, this.action);
      }
      else {
        this.action(ctx);
      }
    }
     buildString() {
      let s="";
      for (let i=0; i<this.mods.length; i++) {
          if (i>0) {
              s+=" + ";
          }
          let k=this.mods[i].toLowerCase();
          k = k[0].toUpperCase()+k.slice(1, k.length).toLowerCase();
          s+=k;
      }
      if (this.mods.length>0) {
          s+="+";
      }
      s+=reverse_keymap[this.key];
      return s.trim();
    }
  }
  _ESClass.register(HotKey);
  _es6_module.add_class(HotKey);
  HotKey = _es6_module.add_export('HotKey', HotKey);
  class KeyMap extends Array {
     constructor(hotkeys=[], pathid="undefined") {
      super();
      this.pathid = pathid;
      for (let hk of hotkeys) {
          this.add(hk);
      }
    }
     handle(ctx, e) {
      let mods=new util.set();
      if (e.shiftKey)
        mods.add("shift");
      if (e.altKey)
        mods.add("alt");
      if (e.ctrlKey) {
          mods.add("ctrl");
      }
      if (e.commandKey) {
          mods.add("command");
      }
      for (let hk of this) {
          let ok=e.keyCode===hk.key;
          if (!ok)
            continue;
          let count=0;
          for (let m of hk.mods) {
              m = m.toLowerCase().trim();
              if (!mods.has(m)) {
                  ok = false;
                  break;
              }
              count++;
          }
          if (count!==mods.length) {
              ok = false;
          }
          if (ok) {
              try {
                hk.exec(ctx);
              }
              catch (error) {
                  util.print_stack(error);
                  console.log("failed to execute a hotkey", keymap[e.keyCode]);
              }
              return true;
          }
      }
    }
     add(hk) {
      this.push(hk);
    }
     push(hk) {
      super.push(hk);
    }
  }
  _ESClass.register(KeyMap);
  _es6_module.add_class(KeyMap);
  KeyMap = _es6_module.add_export('KeyMap', KeyMap);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/simple_events.js');


es6_module_define('solver', ["./util.js", "./vectormath.js", "./math.js"], function _solver_module(_es6_module) {
  var Vector2=es6_import_item(_es6_module, './vectormath.js', 'Vector2');
  var math=es6_import(_es6_module, './math.js');
  var util=es6_import(_es6_module, './util.js');
  class Constraint  {
     constructor(name, func, klst, params, k=1.0) {
      this.glst = [];
      this.klst = klst;
      this.k = k;
      this.params = params;
      this.name = name;
      for (let ks of klst) {
          this.glst.push(new Float64Array(ks.length));
      }
      this.df = 0.0005;
      this.threshold = 0.0001;
      this.func = func;
      this.funcDv = null;
    }
     evaluate(no_dvs=false) {
      let r1=this.func(this.params);
      if (this.funcDv) {
          this.funcDv(this.params, this.glst);
          return r1;
      }
      if (Math.abs(r1)<this.threshold)
        return 0.0;
      let df=this.df;
      if (no_dvs)
        return r1;
      for (let i=0; i<this.klst.length; i++) {
          let gs=this.glst[i];
          let ks=this.klst[i];
          for (let j=0; j<ks.length; j++) {
              let orig=ks[j];
              ks[j]+=df;
              let r2=this.func(this.params);
              ks[j] = orig;
              gs[j] = (r2-r1)/df;
          }
      }
      return r1;
    }
  }
  _ESClass.register(Constraint);
  _es6_module.add_class(Constraint);
  Constraint = _es6_module.add_export('Constraint', Constraint);
  class Solver  {
     constructor() {
      this.constraints = [];
      this.gk = 0.99;
      this.simple = false;
      this.randCons = false;
      this.threshold = 0.01;
    }
     add(con) {
      this.constraints.push(con);
    }
     solveStep(gk=this.gk) {
      let err=0.0;
      let cons=this.constraints;
      for (let ci=0; ci<cons.length; ci++) {
          let ri=ci;
          if (this.randCons) {
              ri = ~~(Math.random()*this.constraints.length*0.99999);
          }
          let con=cons[ri];
          let r1=con.evaluate();
          if (r1===0.0)
            continue;
          err+=Math.abs(r1);
          let totgs=0.0;
          for (let i=0; i<con.klst.length; i++) {
              let ks=con.klst[i], gs=con.glst[i];
              for (let j=0; j<ks.length; j++) {
                  totgs+=gs[j]*gs[j];
              }
          }
          if (totgs===0.0) {
              continue;
          }
          r1/=totgs;
          for (let i=0; i<con.klst.length; i++) {
              let ks=con.klst[i], gs=con.glst[i];
              for (let j=0; j<ks.length; j++) {
                  ks[j]+=-r1*gs[j]*con.k*gk;
              }
          }
      }
      return err;
    }
     solveStepSimple(gk=this.gk) {
      let err=0.0;
      let cons=this.constraints;
      for (let ci=0; ci<cons.length; ci++) {
          let ri=ci;
          if (this.randCons) {
              ri = ~~(Math.random()*this.constraints.length*0.99999);
          }
          let con=cons[ri];
          let r1=con.evaluate();
          if (r1===0.0)
            continue;
          err+=Math.abs(r1);
          let totgs=0.0;
          for (let i=0; i<con.klst.length; i++) {
              let ks=con.klst[i], gs=con.glst[i];
              for (let j=0; j<ks.length; j++) {
                  totgs+=gs[j]*gs[j];
              }
          }
          if (totgs===0.0) {
              continue;
          }
          totgs = 0.0001/Math.sqrt(totgs);
          for (let i=0; i<con.klst.length; i++) {
              let ks=con.klst[i], gs=con.glst[i];
              for (let j=0; j<ks.length; j++) {
                  ks[j]+=-totgs*gs[j]*con.k*gk;
              }
          }
      }
      return err;
    }
     solve(steps, gk=this.gk, printError=false) {
      let err=0.0;
      for (let i=0; i<steps; i++) {
          if (this.simple) {
              err = this.solveStepSimple(gk);
          }
          else {
            err = this.solveStep(gk);
          }
          if (printError) {
              console.warn("average error:", (err/this.constraints.length).toFixed(4));
          }
          if (err<this.threshold/this.constraints.length) {
              break;
          }
      }
      return err;
    }
  }
  _ESClass.register(Solver);
  _es6_module.add_class(Solver);
  Solver = _es6_module.add_export('Solver', Solver);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/solver.js');


es6_module_define('struct', ["./nstructjs_es6.js"], function _struct_module(_es6_module) {
  var nstructjs=es6_import(_es6_module, './nstructjs_es6.js');
  nstructjs;
  _es6_module.set_default_export('nstructjs', nstructjs);
  
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/struct.js');


es6_module_define('vectormath', ["./struct.js", "./util.js"], function _vectormath_module(_es6_module) {
  var util=es6_import(_es6_module, './util.js');
  var nstructjs=es6_import_item(_es6_module, './struct.js', 'default');
  const EulerOrders={XYZ: 0, 
   XZY: 1, 
   YXZ: 2, 
   YZX: 3, 
   ZXY: 4, 
   ZYX: 5}
  _es6_module.add_export('EulerOrders', EulerOrders);
  window.makeCompiledVectormathCode = function (mode) {
    if (mode===undefined) {
        mode = "es";
    }
    let s="";
    let es6exports=mode==="es";
    function doExports(name) {
      if (es6exports) {
          return "export";
      }
      else {
        return `var ${name} = exports.${name} =`;
      }
    }
    let classes=[Vector2, Vector3, Vector4, a];
    let lens={Vector2: 2, 
    Vector3: 3, 
    Vector4: 4, 
    Quat: 4}
    let modecode="";
    let nstructjscode=`
  let g = typeof window !== "undefined" ? window : "undefined";
  
  g = g || (typeof global !== "undefined" ? global : "undefined");
  g = g || (typeof self !== "undefined" ? self : "undefined");
  g = g || (typeof globals !== "undefined" ? globals : "undefined");

  if (typeof nstructjs === "undefined") {
    //add nstructjs stub
    g.nstructjs = {
      register : function() {}
    }
  }
  `;
    if (mode!=="rjs") {
        if (mode==="commonjs") {
            modecode = `if (typeof module !== "undefined" && typeof exports === "undefined") {
      if (module.exports === undefined) {
        module.exports = {};
      }
      
      g.exports = module.exports;
    } else if (typeof module === "undefined") {
      g.exports = g.vectormath = {};
    }\n`;
        }
        s+=`{
      ${nstructjscode}
    ${modecode}
  }`;
    }
    s+=`
class cachering extends Array {
  constructor(func, size) {
    super()

    this.cur = 0;

    for (var i=0; i<size; i++) {
      this.push(func());
    }
  }

  static fromConstructor(cls, size) {
    var func = function() {
      return new cls();
    }

    return new cachering(func, size);
  }

  next() {
    var ret = this[this.cur];
    this.cur = (this.cur+1)%this.length;

    return ret;
  }
}
`;
    s+=`

var M_SQRT2 = Math.sqrt(2.0);
var FLT_EPSILON = 2.22e-16;  
var sin=Math.sin, cos=Math.cos, abs=Math.abs, log=Math.log,
    asin=Math.asin, exp=Math.exp, acos=Math.acos, fract=Math.fract,
    sign=Math.sign, tent=Math.tent, atan2=Math.atan2, atan=Math.atan,
    pow=Math.pow, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil,
    min=Math.min, max=Math.max, PI=Math.PI, E=2.718281828459045;

var DOT_NORM_SNAP_LIMIT = 0.00000000001;

${doExports("BaseVector")} class BaseVector extends Array {
  constructor() {
    super();
    
    this.vec = undefined; //for compatibility with old files
  }

  copy() {
    return new this.constructor(this);
  }

  load(data) {
    throw new Error("Implement me!");
  }
  
  vectorLength() {
    return sqrt(this.dot(this));
  }
  
  normalize() {
    var l = this.vectorLength();
    if (l > 0.00000001) {
      this.mulScalar(1.0/l);
    }
    
    return this;
  }
}
  
`;
    function indent(s, pad) {
      if (pad===undefined) {
          pad = "  ";
      }
      let l=s.split("\n");
      let s2="";
      for (let l2 of l) {
          s2+=pad+l2+"\n";
      }
      return s2;
    }
    let i=0;
    for (let cls of classes) {
        s+=doExports(cls.name)+" class "+cls.name+" extends BaseVector {\n";
        let keys=Reflect.ownKeys(cls.prototype);
        for (let k of keys) {
            let v=cls.prototype[k];
            if (typeof v!=="function") {
                continue;
            }
            if (typeof k==="symbol") {
                k = "  ["+k.toString()+"]";
            }
            v = (""+v).trim();
            if (v.startsWith("function(")||v.startsWith("function (")) {
                v = k+v.slice(8, v.length).trim();
            }
            else 
              if (v.startsWith("function")) {
                v = v.slice(8, v.length).trim();
            }
            if (v.endsWith(";}")) {
                v = v.slice(0, v.length-1)+"\n  }\n";
            }
            let zero="";
            let l=lens[cls.name];
            for (let j=0; j<l; j++) {
                if (j>0) {
                    zero+=" = ";
                }
                zero+=`this[${j}]`;
            }
            zero+=" = 0.0";
            if (k==="constructor") {
                s+=`  constructor(data) {
    super(${l});
        
    this.vec = undefined; //for compatibility with old files
    
    if (arguments.length > 1) {
      throw new Error("unexpected argument");
    }

    //this.length = ${l};
    ${zero};

    if (data !== undefined) {
      this.load(data);
    }
  }
`;
            }
            else {
              s+=indent(v);
            }
            s+="\n";
            i++;
        }
        s+="}\n\n";
        s+=`${cls.name}.STRUCT = \`${cls.STRUCT}\`;\n`;
        s+=`nstructjs.register(${cls.name});\n\n`;
    }
    s+="\n\n"+(""+internal_matrix).trim()+"\n";
    s+="\n"+doExports("Matrix4")+Matrix4;
    s+=`\n  Matrix4.STRUCT = \`${Matrix4.STRUCT}\`;\n`;
    s+="nstructjs.register(Matrix4)\n";
    s+=`
  var _quat_vs3_temps = cachering.fromConstructor(Vector3, 64);
  var _v3nd4_n1_normalizedDot4 = new Vector3();
  var _v3nd4_n2_normalizedDot4 = new Vector3();
  var _v3nd_n1_normalizedDot = new Vector3();
  var _v3nd_n2_normalizedDot = new Vector3();

  var $_v3nd4_n1_normalizedDot4 = new Vector3();
  var $_v3nd4_n2_normalizedDot4 = new Vector3();
  var $_v3nd_n1_normalizedDot = new Vector3();
  var $_v3nd_n2_normalizedDot = new Vector3();

  var lookat_cache_vs3 = cachering.fromConstructor(Vector3, 64);
  var lookat_cache_vs4 = cachering.fromConstructor(Vector4, 64);

  var makenormalcache = cachering.fromConstructor(Vector3, 64);
`;
    if (mode==="rjs") {
        s = `define([], function() {
  "use strict";

  let exports = {};

  {
    ${nstructjscode}
  }
  ${indent(s)}

  return exports;
});
`;
    }
    return s;
  }
  var sin=Math.sin, cos=Math.cos, abs=Math.abs, log=Math.log, asin=Math.asin, exp=Math.exp, acos=Math.acos, fract=Math.fract, sign=Math.sign, tent=Math.tent, atan2=Math.atan2, atan=Math.atan, pow=Math.pow, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, min=Math.min, max=Math.max, PI=Math.PI, E=2.718281828459045;
  var DOT_NORM_SNAP_LIMIT=1e-11;
  var M_SQRT2=Math.sqrt(2.0);
  var FLT_EPSILON=2.22e-16;
  var basic_funcs={equals: [["b"], "this[X] === b[X]", "&&"], 
   zero: [[], "0.0;"], 
   negate: [[], "-this[X];"], 
   combine: [["b", "u", "v"], "this[X]*u + this[X]*v;"], 
   interp: [["b", "t"], "this[X] + (b[X] - this[X])*t;"], 
   add: [["b"], "this[X] + b[X];"], 
   addFac: [["b", "F"], "this[X] + b[X]*F;"], 
   fract: [[], "Math.fract(this[X]);"], 
   sub: [["b"], "this[X] - b[X];"], 
   mul: [["b"], "this[X] * b[X];"], 
   div: [["b"], "this[X] / b[X];"], 
   mulScalar: [["b"], "this[X] * b;"], 
   divScalar: [["b"], "this[X] / b;"], 
   addScalar: [["b"], "this[X] + b;"], 
   subScalar: [["b"], "this[X] - b;"], 
   minScalar: [["b"], "Math.min(this[X], b);"], 
   maxScalar: [["b"], "Math.max(this[X], b);"], 
   ceil: [[], "Math.ceil(this[X])"], 
   floor: [[], "Math.floor(this[X])"], 
   abs: [[], "Math.abs(this[X])"], 
   min: [["b"], "Math.min(this[X], b[X])"], 
   max: [["b"], "Math.max(this[X], b[X])"], 
   clamp: [["MIN", "MAX"], "min(max(this[X], MAX), MIN)"]}
  function bounded_acos(fac) {
    if (fac<=-1.0)
      return Math.pi;
    else 
      if (fac>=1.0)
      return 0.0;
    else 
      return Math.acos(fac);
  }
  function make_norm_safe_dot(cls) {
    var _dot=cls.prototype.dot;
    cls.prototype._dot = _dot;
    cls.prototype.dot = function (b) {
      var ret=_dot.call(this, b);
      if (ret>=1.0-DOT_NORM_SNAP_LIMIT&&ret<=1.0+DOT_NORM_SNAP_LIMIT)
        return 1.0;
      if (ret>=-1.0-DOT_NORM_SNAP_LIMIT&&ret<=-1.0+DOT_NORM_SNAP_LIMIT)
        return -1.0;
      return ret;
    }
  }
  function getBaseVector(parent) {
    return class BaseVector extends parent {
       constructor() {
        super(...arguments);
        this.vec = undefined;
      }
      static  inherit(cls, vectorsize) {
        make_norm_safe_dot(cls);
        var f;
        var vectorDotDistance="f = function vectorDotDistance(b) {\n";
        for (var i=0; i<vectorsize; i++) {
            vectorDotDistance+="  let d"+i+" = this["+i+"]-b["+i+"];\n\n  ";
        }
        vectorDotDistance+="  return ";
        for (var i=0; i<vectorsize; i++) {
            if (i>0)
              vectorDotDistance+=" + ";
            vectorDotDistance+="d"+i+"*d"+i;
        }
        vectorDotDistance+=";\n";
        vectorDotDistance+="};";
        cls.prototype.vectorDotDistance = eval(vectorDotDistance);
        var f;
        var vectorDistance="f = function vectorDistance(b) {\n";
        for (var i=0; i<vectorsize; i++) {
            vectorDistance+=`  let d${i} = this[${i}] - (b[${i}]||0);\n\n  `;
        }
        vectorDistance+="  return Math.sqrt(";
        for (var i=0; i<vectorsize; i++) {
            if (i>0)
              vectorDistance+=" + ";
            vectorDistance+="d"+i+"*d"+i;
        }
        vectorDistance+=");\n";
        vectorDistance+="};";
        cls.prototype.vectorDistance = eval(vectorDistance);
        var vectorDistanceSqr="f = function vectorDistanceSqr(b) {\n";
        for (var i=0; i<vectorsize; i++) {
            vectorDistanceSqr+=`  let d${i} = this[${i}] - (b[${i}]||0);\n\n  `;
        }
        vectorDistanceSqr+="  return (";
        for (var i=0; i<vectorsize; i++) {
            if (i>0)
              vectorDistanceSqr+=" + ";
            vectorDistanceSqr+="d"+i+"*d"+i;
        }
        vectorDistanceSqr+=");\n";
        vectorDistanceSqr+="};";
        cls.prototype.vectorDistanceSqr = eval(vectorDistanceSqr);
        for (var k in basic_funcs) {
            var func=basic_funcs[k];
            var args=func[0];
            var line=func[1];
            var f;
            var code="f = function "+k+"(";
            for (var i=0; i<args.length; i++) {
                if (i>0)
                  code+=", ";
                line = line.replace(args[i], args[i].toLowerCase());
                code+=args[i].toLowerCase();
            }
            code+=") {\n";
            if (func.length>2) {
                code+="  return ";
                for (var i=0; i<vectorsize; i++) {
                    if (i>0)
                      code+=func[2];
                    code+="("+line.replace(/X/g, ""+i)+")";
                }
                code+=";\n";
            }
            else {
              for (var i=0; i<vectorsize; i++) {
                  var line2=line.replace(/X/g, ""+i);
                  code+="  this["+i+"] = "+line2+";\n";
              }
              code+="  return this;\n";
            }
            code+="}\n";
            var f=eval(code);
            cls.prototype[k] = f;
        }
      }
       copy() {
        return new this.constructor(this);
      }
       load(data) {
        throw new Error("Implement me!");
      }
       init_swizzle(size) {
        var ret={};
        var cls=size===4 ? Vector4 : (size===3 ? Vector3 : Vector2);
        for (var k in cls.prototype) {
            var v=cls.prototype[k];
            if (typeof v!=="function"&&!(__instance_of(v, Function)))
              continue;
            ret[k] = v.bind(this);
        }
        return ret;
      }
       vectorLength() {
        return sqrt(this.dot(this));
      }
       swapAxes(axis1, axis2) {
        let t=this[axis1];
        this[axis1] = this[axis2];
        this[axis2] = t;
        return this;
      }
       normalize() {
        let l=this.vectorLength();
        if (l>1e-08) {
            this.mulScalar(1.0/l);
        }
        return this;
      }
    }
    _ESClass.register(BaseVector);
    _es6_module.add_class(BaseVector);
  }
  const BaseVector=getBaseVector(Array);
  _es6_module.add_export('BaseVector', BaseVector);
  const F64BaseVector=getBaseVector(Float64Array);
  _es6_module.add_export('F64BaseVector', F64BaseVector);
  const F32BaseVector=getBaseVector(Float32Array);
  _es6_module.add_export('F32BaseVector', F32BaseVector);
  function myclamp(f, a, b) {
    return Math.min(Math.max(f, a), b);
  }
  class Vector4 extends BaseVector {
     constructor(data) {
      super(4);
      if (arguments.length>1) {
          throw new Error("unexpected argument");
      }
      this[0] = this[1] = this[2] = this[3] = 0.0;
      if (data!==undefined) {
          this.load(data);
      }
    }
     toCSS() {
      let r=~~(this[0]*255);
      let g=~~(this[1]*255);
      let b=~~(this[2]*255);
      let a=this[3];
      return `rgba(${r},${g},${b},${a})`;
    }
     loadXYZW(x, y, z, w) {
      this[0] = x;
      this[1] = y;
      this[2] = z;
      this[3] = w;
      return this;
    }
     loadXYZ(x, y, z) {
      this[0] = x;
      this[1] = y;
      this[2] = z;
      return this;
    }
     load(data) {
      if (data===undefined)
        return this;
      this[0] = data[0];
      this[1] = data[1];
      this[2] = data[2];
      this[3] = data[3];
      return this;
    }
     dot(b) {
      return this[0]*b[0]+this[1]*b[1]+this[2]*b[2]+this[3]*b[3];
    }
     mulVecQuat(q) {
      let t0=-q[1]*this[0]-q[2]*this[1]-q[3]*this[2];
      let t1=q[0]*this[0]+q[2]*this[2]-q[3]*this[1];
      let t2=q[0]*this[1]+q[3]*this[0]-q[1]*this[2];
      this[2] = q[0]*this[2]+q[1]*this[1]-q[2]*this[0];
      this[0] = t1;
      this[1] = t2;
      t1 = t0*-q[1]+this[0]*q[0]-this[1]*q[3]+this[2]*q[2];
      t2 = t0*-q[2]+this[1]*q[0]-this[2]*q[1]+this[0]*q[3];
      this[2] = t0*-q[3]+this[2]*q[0]-this[0]*q[2]+this[1]*q[1];
      this[0] = t1;
      this[1] = t2;
      return this;
    }
     multVecMatrix(matrix) {
      var x=this[0];
      var y=this[1];
      var z=this[2];
      var w=this[3];
      this[0] = w*matrix.$matrix.m41+x*matrix.$matrix.m11+y*matrix.$matrix.m21+z*matrix.$matrix.m31;
      this[1] = w*matrix.$matrix.m42+x*matrix.$matrix.m12+y*matrix.$matrix.m22+z*matrix.$matrix.m32;
      this[2] = w*matrix.$matrix.m43+x*matrix.$matrix.m13+y*matrix.$matrix.m23+z*matrix.$matrix.m33;
      this[3] = w*matrix.$matrix.m44+x*matrix.$matrix.m14+y*matrix.$matrix.m24+z*matrix.$matrix.m34;
      return this[3];
    }
     cross(v) {
      var x=this[1]*v[2]-this[2]*v[1];
      var y=this[2]*v[0]-this[0]*v[2];
      var z=this[0]*v[1]-this[1]*v[0];
      this[0] = x;
      this[1] = y;
      this[2] = z;
      return this;
    }
     preNormalizedAngle(v2) {
      let th=this.dot(v2)*0.99999;
      return Math.acos(th);
    }
     loadSTRUCT(reader) {
      reader(this);
      if (typeof this.vec!=="undefined") {
          this.load(this.vec);
          this.vec = undefined;
      }
    }
  }
  _ESClass.register(Vector4);
  _es6_module.add_class(Vector4);
  Vector4 = _es6_module.add_export('Vector4', Vector4);
  
  Vector4.STRUCT = `
vec4 {
  0 : float;
  1 : float;
  2 : float;
  3 : float;
}
`;
  nstructjs.manager.add_class(Vector4);
  var _v3nd_n1_normalizedDot, _v3nd_n2_normalizedDot;
  var _v3nd4_n1_normalizedDot4, _v3nd4_n2_normalizedDot4;
  class Vector3 extends F64BaseVector {
     constructor(data) {
      super(3);
      if (arguments.length>1) {
          throw new Error("unexpected argument");
      }
      this[0] = this[1] = this[2] = 0.0;
      if (data!==undefined) {
          this.load(data);
      }
      if (this.constructor===Vector3) {
          Object.preventExtensions(this);
      }
    }
    static  normalizedDot4(v1, v2, v3, v4) {
      $_v3nd4_n1_normalizedDot4.load(v2).sub(v1).normalize();
      $_v3nd4_n2_normalizedDot4.load(v4).sub(v3).normalize();
      return $_v3nd4_n1_normalizedDot4.dot($_v3nd4_n2_normalizedDot4);
    }
    static  normalizedDot3(v1, center, v2) {
      $_v3nd4_n1_normalizedDot3.load(v1).sub(center).normalize();
      $_v3nd4_n2_normalizedDot3.load(v2).sub(center).normalize();
      return $_v3nd4_n1_normalizedDot3.dot($_v3nd4_n2_normalizedDot3);
    }
     toCSS() {
      let r=~~(this[0]*255);
      let g=~~(this[1]*255);
      let b=~~(this[2]*255);
      return `rgb(${r},${g},${b})`;
    }
     loadXYZ(x, y, z) {
      this[0] = x;
      this[1] = y;
      this[2] = z;
      return this;
    }
     loadXY(x, y) {
      this[0] = x;
      this[1] = y;
      return this;
    }
     toJSON() {
      return [this[0], this[1], this[2]];
    }
     loadJSON(obj) {
      return this.load(obj);
    }
     initVector3() {
      this.length = 3;
      this[0] = this[1] = this[2] = 0;
      return this;
    }
     load(data) {
      if (data===undefined)
        return this;
      this[0] = data[0];
      this[1] = data[1];
      this[2] = data[2];
      return this;
    }
     dot(b) {
      return this[0]*b[0]+this[1]*b[1]+this[2]*b[2];
    }
     normalizedDot(v) {
      $_v3nd_n1_normalizedDot.load(this);
      $_v3nd_n2_normalizedDot.load(v);
      $_v3nd_n1_normalizedDot.normalize();
      $_v3nd_n2_normalizedDot.normalize();
      return $_v3nd_n1_normalizedDot.dot($_v3nd_n2_normalizedDot);
    }
     mulVecQuat(q) {
      let t0=-q[1]*this[0]-q[2]*this[1]-q[3]*this[2];
      let t1=q[0]*this[0]+q[2]*this[2]-q[3]*this[1];
      let t2=q[0]*this[1]+q[3]*this[0]-q[1]*this[2];
      this[2] = q[0]*this[2]+q[1]*this[1]-q[2]*this[0];
      this[0] = t1;
      this[1] = t2;
      t1 = t0*-q[1]+this[0]*q[0]-this[1]*q[3]+this[2]*q[2];
      t2 = t0*-q[2]+this[1]*q[0]-this[2]*q[1]+this[0]*q[3];
      this[2] = t0*-q[3]+this[2]*q[0]-this[0]*q[2]+this[1]*q[1];
      this[0] = t1;
      this[1] = t2;
      return this;
    }
     multVecMatrix(matrix, ignore_w) {
      if (ignore_w===undefined) {
          ignore_w = false;
      }
      var x=this[0];
      var y=this[1];
      var z=this[2];
      this[0] = matrix.$matrix.m41+x*matrix.$matrix.m11+y*matrix.$matrix.m21+z*matrix.$matrix.m31;
      this[1] = matrix.$matrix.m42+x*matrix.$matrix.m12+y*matrix.$matrix.m22+z*matrix.$matrix.m32;
      this[2] = matrix.$matrix.m43+x*matrix.$matrix.m13+y*matrix.$matrix.m23+z*matrix.$matrix.m33;
      var w=matrix.$matrix.m44+x*matrix.$matrix.m14+y*matrix.$matrix.m24+z*matrix.$matrix.m34;
      if (!ignore_w&&w!==1&&w!==0&&matrix.isPersp) {
          this[0]/=w;
          this[1]/=w;
          this[2]/=w;
      }
      return w;
    }
     cross(v) {
      var x=this[1]*v[2]-this[2]*v[1];
      var y=this[2]*v[0]-this[0]*v[2];
      var z=this[0]*v[1]-this[1]*v[0];
      this[0] = x;
      this[1] = y;
      this[2] = z;
      return this;
    }
     rot2d(A, axis) {
      var x=this[0];
      var y=this[1];
      if (axis===1) {
          this[0] = x*cos(A)+y*sin(A);
          this[1] = y*cos(A)-x*sin(A);
      }
      else {
        this[0] = x*cos(A)-y*sin(A);
        this[1] = y*cos(A)+x*sin(A);
      }
      return this;
    }
     preNormalizedAngle(v2) {
      let th=this.dot(v2)*0.99999;
      return Math.acos(th);
    }
     loadSTRUCT(reader) {
      reader(this);
      if (typeof this.vec!=="undefined") {
          this.load(this.vec);
          this.vec = undefined;
      }
    }
  }
  _ESClass.register(Vector3);
  _es6_module.add_class(Vector3);
  Vector3 = _es6_module.add_export('Vector3', Vector3);
  Vector3.STRUCT = `
vec3 {
  0 : float;
  1 : float;
  2 : float;
}
`;
  nstructjs.manager.add_class(Vector3);
  class Vector2 extends BaseVector {
     constructor(data) {
      super(2);
      if (arguments.length>1) {
          throw new Error("unexpected argument");
      }
      this[0] = this[1] = 0.0;
      if (data!==undefined) {
          this.load(data);
      }
    }
     initVector2(co) {
      this.length = 2;
      if (co!==undefined) {
          this[0] = co[0];
          this[1] = co[1];
      }
      else {
        this[0] = this[1] = 0.0;
      }
      return this;
    }
     loadXY(x, y) {
      this[0] = x;
      this[1] = y;
      return this;
    }
     toJSON() {
      return [this[0], this[1]];
    }
     loadJSON(obj) {
      return this.load(obj);
    }
     loadXY(x, y) {
      this[0] = x;
      this[1] = y;
      return this;
    }
     load(data) {
      if (data===undefined)
        return this;
      this[0] = data[0];
      this[1] = data[1];
      return this;
    }
     rot2d(A, axis) {
      var x=this[0];
      var y=this[1];
      if (axis===1) {
          this[0] = x*cos(A)+y*sin(A);
          this[1] = y*cos(A)-x*sin(A);
      }
      else {
        this[0] = x*cos(A)-y*sin(A);
        this[1] = y*cos(A)+x*sin(A);
      }
      return this;
    }
     dot(b) {
      return this[0]*b[0]+this[1]*b[1];
    }
     multVecMatrix(matrix) {
      var x=this[0];
      var y=this[1];
      var w=1.0;
      this[0] = w*matrix.$matrix.m41+x*matrix.$matrix.m11+y*matrix.$matrix.m21;
      this[1] = w*matrix.$matrix.m42+x*matrix.$matrix.m12+y*matrix.$matrix.m22;
      if (matrix.isPersp) {
          let w2=w*matrix.$matrix.m44+x*matrix.$matrix.m14+y*matrix.$matrix.m24;
          if (w2!==0.0) {
              this[0]/=w2;
              this[1]/=w2;
          }
      }
      return this;
    }
     mulVecQuat(q) {
      let t0=-q[1]*this[0]-q[2]*this[1];
      let t1=q[0]*this[0]-q[3]*this[1];
      let t2=q[0]*this[1]+q[3]*this[0];
      let z=q[1]*this[1]-q[2]*this[0];
      this[0] = t1;
      this[1] = t2;
      t1 = t0*-q[1]+this[0]*q[0]-this[1]*q[3]+z*q[2];
      t2 = t0*-q[2]+this[1]*q[0]-z*q[1]+this[0]*q[3];
      this[0] = t1;
      this[1] = t2;
      return this;
    }
     vectorLengthSqr() {
      return this.dot(this);
    }
     loadSTRUCT(reader) {
      reader(this);
      if (typeof this.vec!==undefined) {
          this.load(this.vec);
          this.vec = undefined;
      }
    }
  }
  _ESClass.register(Vector2);
  _es6_module.add_class(Vector2);
  Vector2 = _es6_module.add_export('Vector2', Vector2);
  
  Vector2.STRUCT = `
vec2 {
  0 : float;
  1 : float;
}
`;
  nstructjs.manager.add_class(Vector2);
  let _quat_vs3_temps=util.cachering.fromConstructor(Vector3, 64);
  class Quat extends Vector4 {
     makeUnitQuat() {
      this[0] = 1.0;
      this[1] = this[2] = this[3] = 0.0;
    }
     isZero() {
      return (this[0]===0&&this[1]===0&&this[2]===0&&this[3]===0);
    }
     mulQuat(qt) {
      var a=this[0]*qt[0]-this[1]*qt[1]-this[2]*qt[2]-this[3]*qt[3];
      var b=this[0]*qt[1]+this[1]*qt[0]+this[2]*qt[3]-this[3]*qt[2];
      var c=this[0]*qt[2]+this[2]*qt[0]+this[3]*qt[1]-this[1]*qt[3];
      this[3] = this[0]*qt[3]+this[3]*qt[0]+this[1]*qt[2]-this[2]*qt[1];
      this[0] = a;
      this[1] = b;
      this[2] = c;
    }
     conjugate() {
      this[1] = -this[1];
      this[2] = -this[2];
      this[3] = -this[3];
    }
     dotWithQuat(q2) {
      return this[0]*q2[0]+this[1]*q2[1]+this[2]*q2[2]+this[3]*q2[3];
    }
     invert() {
      var f=this.dot(this);
      if (f===0.0)
        return ;
      conjugate_qt(q);
      this.mulscalar(1.0/f);
    }
     sub(q2) {
      var nq2=new Quat();
      nq2[0] = -q2[0];
      nq2[1] = q2[1];
      nq2[2] = q2[2];
      nq2[3] = q2[3];
      this.mul(nq2);
    }
     mulScalarWithFactor(fac) {
      var angle=fac*bounded_acos(this[0]);
      var co=Math.cos(angle);
      var si=Math.sin(angle);
      this[0] = co;
      var last3=Vector3([this[1], this[2], this[3]]);
      last3.normalize();
      last3.mulScalar(si);
      this[1] = last3[0];
      this[2] = last3[1];
      this[3] = last3[2];
      return this;
    }
     toMatrix(m) {
      if (m===undefined) {
          m = new Matrix4();
      }
      var q0=M_SQRT2*this[0];
      var q1=M_SQRT2*this[1];
      var q2=M_SQRT2*this[2];
      var q3=M_SQRT2*this[3];
      var qda=q0*q1;
      var qdb=q0*q2;
      var qdc=q0*q3;
      var qaa=q1*q1;
      var qab=q1*q2;
      var qac=q1*q3;
      var qbb=q2*q2;
      var qbc=q2*q3;
      var qcc=q3*q3;
      m.$matrix.m11 = (1.0-qbb-qcc);
      m.$matrix.m12 = (qdc+qab);
      m.$matrix.m13 = (-qdb+qac);
      m.$matrix.m14 = 0.0;
      m.$matrix.m21 = (-qdc+qab);
      m.$matrix.m22 = (1.0-qaa-qcc);
      m.$matrix.m23 = (qda+qbc);
      m.$matrix.m24 = 0.0;
      m.$matrix.m31 = (qdb+qac);
      m.$matrix.m32 = (-qda+qbc);
      m.$matrix.m33 = (1.0-qaa-qbb);
      m.$matrix.m34 = 0.0;
      m.$matrix.m41 = m.$matrix.m42 = m.$matrix.m43 = 0.0;
      m.$matrix.m44 = 1.0;
      return m;
    }
     matrixToQuat(wmat) {
      var mat=temp_mats.next();
      mat.load(wmat);
      mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
      mat.$matrix.m44 = 1.0;
      var r1=new Vector3([mat.$matrix.m11, mat.$matrix.m12, mat.$matrix.m13]);
      var r2=new Vector3([mat.$matrix.m21, mat.$matrix.m22, mat.$matrix.m23]);
      var r3=new Vector3([mat.$matrix.m31, mat.$matrix.m32, mat.$matrix.m33]);
      r1.normalize();
      r2.normalize();
      r3.normalize();
      mat.$matrix.m11 = r1[0];
      mat.$matrix.m12 = r1[1];
      mat.$matrix.m13 = r1[2];
      mat.$matrix.m21 = r2[0];
      mat.$matrix.m22 = r2[1];
      mat.$matrix.m23 = r2[2];
      mat.$matrix.m31 = r3[0];
      mat.$matrix.m32 = r3[1];
      mat.$matrix.m33 = r3[2];
      var tr=0.25*(1.0+mat.$matrix.m11+mat.$matrix.m22+mat.$matrix.m33);
      var s=0;
      if (tr>FLT_EPSILON) {
          s = Math.sqrt(tr);
          this[0] = s;
          s = 1.0/(4.0*s);
          this[1] = ((mat.$matrix.m23-mat.$matrix.m32)*s);
          this[2] = ((mat.$matrix.m31-mat.$matrix.m13)*s);
          this[3] = ((mat.$matrix.m12-mat.$matrix.m21)*s);
      }
      else {
        if (mat.$matrix.m11>mat.$matrix.m22&&mat.$matrix.m11>mat.$matrix.m33) {
            s = 2.0*Math.sqrt(1.0+mat.$matrix.m11-mat.$matrix.m22-mat.$matrix.m33);
            this[1] = (0.25*s);
            s = 1.0/s;
            this[0] = ((mat.$matrix.m32-mat.$matrix.m23)*s);
            this[2] = ((mat.$matrix.m21+mat.$matrix.m12)*s);
            this[3] = ((mat.$matrix.m31+mat.$matrix.m13)*s);
        }
        else 
          if (mat.$matrix.m22>mat.$matrix.m33) {
            s = 2.0*Math.sqrt(1.0+mat.$matrix.m22-mat.$matrix.m11-mat.$matrix.m33);
            this[2] = (0.25*s);
            s = 1.0/s;
            this[0] = ((mat.$matrix.m31-mat.$matrix.m13)*s);
            this[1] = ((mat.$matrix.m21+mat.$matrix.m12)*s);
            this[3] = ((mat.$matrix.m32+mat.$matrix.m23)*s);
        }
        else {
          s = 2.0*Math.sqrt(1.0+mat.$matrix.m33-mat.$matrix.m11-mat.$matrix.m22);
          this[3] = (0.25*s);
          s = 1.0/s;
          this[0] = ((mat.$matrix.m21-mat.$matrix.m12)*s);
          this[1] = ((mat.$matrix.m31+mat.$matrix.m13)*s);
          this[2] = ((mat.$matrix.m32+mat.$matrix.m23)*s);
        }
      }
      this.normalize();
    }
     normalize() {
      var len=Math.sqrt(this.dot(this));
      if (len!==0.0) {
          this.mulScalar(1.0/len);
      }
      else {
        this[1] = 1.0;
        this[0] = this[2] = this[3] = 0.0;
      }
      return this;
    }
     axisAngleToQuat(axis, angle) {
      let nor=_quat_vs3_temps.next().load(axis);
      nor.normalize();
      if (nor.dot(nor)!==0.0) {
          var phi=angle/2.0;
          var si=Math.sin(phi);
          this[0] = Math.cos(phi);
          this[1] = nor[0]*si;
          this[2] = nor[1]*si;
          this[3] = nor[2]*si;
      }
      else {
        this.makeUnitQuat();
      }
      return this;
    }
     rotationBetweenVecs(v1, v2, fac=1.0) {
      v1 = new Vector3(v1);
      v2 = new Vector3(v2);
      v1.normalize();
      v2.normalize();
      if (Math.abs(v1.dot(v2))>0.9999) {
          this.makeUnitQuat();
          return this;
      }
      let axis=new Vector3(v1);
      axis.cross(v2);
      let angle=v1.preNormalizedAngle(v2)*fac;
      this.axisAngleToQuat(axis, angle);
      return this;
    }
     quatInterp(quat2, t) {
      let quat=new Quat();
      let cosom=this[0]*quat2[0]+this[1]*quat2[1]+this[2]*quat2[2]+this[3]*quat2[3];
      if (cosom<0.0) {
          cosom = -cosom;
          quat[0] = -this[0];
          quat[1] = -this[1];
          quat[2] = -this[2];
          quat[3] = -this[3];
      }
      else {
        quat[0] = this[0];
        quat[1] = this[1];
        quat[2] = this[2];
        quat[3] = this[3];
      }
      let omega, sinom, sc1, sc2;
      if ((1.0-cosom)>0.0001) {
          omega = Math.acos(cosom);
          sinom = Math.sin(omega);
          sc1 = Math.sin((1.0-t)*omega)/sinom;
          sc2 = Math.sin(t*omega)/sinom;
      }
      else {
        sc1 = 1.0-t;
        sc2 = t;
      }
      this[0] = sc1*quat[0]+sc2*quat2[0];
      this[1] = sc1*quat[1]+sc2*quat2[1];
      this[2] = sc1*quat[2]+sc2*quat2[2];
      this[3] = sc1*quat[3]+sc2*quat2[3];
      return this;
    }
  }
  _ESClass.register(Quat);
  _es6_module.add_class(Quat);
  Quat = _es6_module.add_export('Quat', Quat);
  
  Quat.STRUCT = nstructjs.inherit(Quat, Vector4, 'quat')+`
}
`;
  nstructjs.register(Quat);
  _v3nd4_n1_normalizedDot4 = new Vector3();
  _v3nd4_n2_normalizedDot4 = new Vector3();
  _v3nd_n1_normalizedDot = new Vector3();
  _v3nd_n2_normalizedDot = new Vector3();
  BaseVector.inherit(Vector4, 4);
  F64BaseVector.inherit(Vector3, 3);
  BaseVector.inherit(Vector2, 2);
  lookat_cache_vs3 = util.cachering.fromConstructor(Vector3, 64);
  lookat_cache_vs4 = util.cachering.fromConstructor(Vector4, 64);
  makenormalcache = util.cachering.fromConstructor(Vector3, 64);
  var $_v3nd_n1_normalizedDot=new Vector3();
  var $_v3nd_n2_normalizedDot=new Vector3();
  var $_v3nd4_n1_normalizedDot4=new Vector3();
  var $_v3nd4_n2_normalizedDot4=new Vector3();
  var $_v3nd4_n1_normalizedDot3=new Vector3();
  var $_v3nd4_n2_normalizedDot3=new Vector3();
  var M_SQRT2=Math.sqrt(2.0);
  var FLT_EPSILON=2.22e-16;
  class internal_matrix  {
     constructor() {
      this.m11 = 1.0;
      this.m12 = 0.0;
      this.m13 = 0.0;
      this.m14 = 0.0;
      this.m21 = 0.0;
      this.m22 = 1.0;
      this.m23 = 0.0;
      this.m24 = 0.0;
      this.m31 = 0.0;
      this.m32 = 0.0;
      this.m33 = 1.0;
      this.m34 = 0.0;
      this.m41 = 0.0;
      this.m42 = 0.0;
      this.m43 = 0.0;
      this.m44 = 1.0;
    }
  }
  _ESClass.register(internal_matrix);
  _es6_module.add_class(internal_matrix);
  var lookat_cache_vs3;
  var lookat_cache_vs4;
  var lookat_cache_ms;
  var euler_rotate_mats;
  var makenormalcache;
  var temp_mats;
  let preMultTemp;
  class Matrix4  {
     constructor(m) {
      this.$matrix = new internal_matrix();
      this.isPersp = false;
      if (typeof m==='object') {
          if ("length" in m&&m.length>=16) {
              this.load(m);
          }
          else 
            if (__instance_of(m, Matrix4)) {
              this.load(m);
          }
      }
    }
    static  fromJSON() {
      var mat=new Matrix4();
      mat.load(json.items);
      mat.isPersp = json.isPersp;
      return mat;
    }
     copy() {
      return this.clone();
    }
     clone() {
      return new Matrix4(this);
    }
     addToHashDigest(hash) {
      let m=this.$matrix;
      hash.add(m.m11);
      hash.add(m.m12);
      hash.add(m.m13);
      hash.add(m.m14);
      hash.add(m.m21);
      hash.add(m.m22);
      hash.add(m.m23);
      hash.add(m.m24);
      hash.add(m.m31);
      hash.add(m.m32);
      hash.add(m.m33);
      hash.add(m.m34);
      hash.add(m.m41);
      hash.add(m.m42);
      hash.add(m.m43);
      hash.add(m.m44);
      return this;
    }
     equals(m) {
      let m1=this.$matrix;
      let m2=m.$matrix;
      let ok=1;
      ok = ok&&m1.m11===m2.m11;
      ok = ok&&m1.m12===m2.m12;
      ok = ok&&m1.m13===m2.m13;
      ok = ok&&m1.m14===m2.m14;
      ok = ok&&m1.m21===m2.m21;
      ok = ok&&m1.m22===m2.m22;
      ok = ok&&m1.m23===m2.m23;
      ok = ok&&m1.m24===m2.m24;
      ok = ok&&m1.m31===m2.m31;
      ok = ok&&m1.m32===m2.m32;
      ok = ok&&m1.m33===m2.m33;
      ok = ok&&m1.m34===m2.m34;
      ok = ok&&m1.m41===m2.m41;
      ok = ok&&m1.m42===m2.m42;
      ok = ok&&m1.m43===m2.m43;
      ok = ok&&m1.m44===m2.m44;
      return ok;
    }
     loadColumn(i, vec) {
      let m=this.$matrix;
      let have4=vec.length>3;
      switch (i) {
        case 0:
          m.m11 = vec[0];
          m.m21 = vec[1];
          m.m31 = vec[2];
          if (have4) {
              m.m41 = vec[3];
          }
          break;
        case 1:
          m.m12 = vec[0];
          m.m22 = vec[1];
          m.m32 = vec[2];
          if (have4) {
              m.m42 = vec[3];
          }
          break;
        case 2:
          m.m13 = vec[0];
          m.m23 = vec[1];
          m.m33 = vec[2];
          if (have4) {
              m.m43 = vec[3];
          }
          break;
        case 3:
          m.m14 = vec[0];
          m.m24 = vec[1];
          m.m34 = vec[2];
          if (have4) {
              m.m44 = vec[3];
          }
          break;
      }
      return this;
    }
     copyColumnTo(i, vec) {
      let m=this.$matrix;
      let have4=vec.length>3;
      switch (i) {
        case 0:
          vec[0] = m.m11;
          vec[1] = m.m21;
          vec[2] = m.m31;
          if (have4) {
              vec[3] = m.m41;
          }
          break;
        case 1:
          vec[0] = m.m12;
          vec[1] = m.m22;
          vec[2] = m.m32;
          if (have4) {
              vec[3] = m.m42;
          }
          break;
        case 2:
          vec[0] = m.m13;
          vec[1] = m.m23;
          vec[2] = m.m33;
          if (have4) {
              vec[3] = m.m43;
          }
          break;
        case 3:
          vec[0] = m.m14;
          vec[1] = m.m24;
          vec[2] = m.m34;
          if (have4) {
              vec[3] = m.m44;
          }
          break;
      }
      return vec;
    }
     copyColumn(i) {
      return this.copyColumnTo(i, new Vector3());
    }
     load() {
      if (arguments.length===1&&typeof arguments[0]==='object') {
          var matrix;
          if (__instance_of(arguments[0], Matrix4)) {
              matrix = arguments[0].$matrix;
              this.isPersp = arguments[0].isPersp;
              this.$matrix.m11 = matrix.m11;
              this.$matrix.m12 = matrix.m12;
              this.$matrix.m13 = matrix.m13;
              this.$matrix.m14 = matrix.m14;
              this.$matrix.m21 = matrix.m21;
              this.$matrix.m22 = matrix.m22;
              this.$matrix.m23 = matrix.m23;
              this.$matrix.m24 = matrix.m24;
              this.$matrix.m31 = matrix.m31;
              this.$matrix.m32 = matrix.m32;
              this.$matrix.m33 = matrix.m33;
              this.$matrix.m34 = matrix.m34;
              this.$matrix.m41 = matrix.m41;
              this.$matrix.m42 = matrix.m42;
              this.$matrix.m43 = matrix.m43;
              this.$matrix.m44 = matrix.m44;
              return this;
          }
          else 
            matrix = arguments[0];
          if ("length" in matrix&&matrix.length>=16) {
              this.$matrix.m11 = matrix[0];
              this.$matrix.m12 = matrix[1];
              this.$matrix.m13 = matrix[2];
              this.$matrix.m14 = matrix[3];
              this.$matrix.m21 = matrix[4];
              this.$matrix.m22 = matrix[5];
              this.$matrix.m23 = matrix[6];
              this.$matrix.m24 = matrix[7];
              this.$matrix.m31 = matrix[8];
              this.$matrix.m32 = matrix[9];
              this.$matrix.m33 = matrix[10];
              this.$matrix.m34 = matrix[11];
              this.$matrix.m41 = matrix[12];
              this.$matrix.m42 = matrix[13];
              this.$matrix.m43 = matrix[14];
              this.$matrix.m44 = matrix[15];
              return this;
          }
      }
      this.makeIdentity();
      return this;
    }
     toJSON() {
      return {isPersp: this.isPersp, 
     items: this.getAsArray()}
    }
     getAsArray() {
      return [this.$matrix.m11, this.$matrix.m12, this.$matrix.m13, this.$matrix.m14, this.$matrix.m21, this.$matrix.m22, this.$matrix.m23, this.$matrix.m24, this.$matrix.m31, this.$matrix.m32, this.$matrix.m33, this.$matrix.m34, this.$matrix.m41, this.$matrix.m42, this.$matrix.m43, this.$matrix.m44];
    }
     getAsFloat32Array() {
      return new Float32Array(this.getAsArray());
    }
     setUniform(ctx, loc, transpose) {
      if (Matrix4.setUniformArray===undefined) {
          Matrix4.setUniformWebGLArray = new Float32Array(16);
          Matrix4.setUniformArray = new Array(16);
      }
      Matrix4.setUniformArray[0] = this.$matrix.m11;
      Matrix4.setUniformArray[1] = this.$matrix.m12;
      Matrix4.setUniformArray[2] = this.$matrix.m13;
      Matrix4.setUniformArray[3] = this.$matrix.m14;
      Matrix4.setUniformArray[4] = this.$matrix.m21;
      Matrix4.setUniformArray[5] = this.$matrix.m22;
      Matrix4.setUniformArray[6] = this.$matrix.m23;
      Matrix4.setUniformArray[7] = this.$matrix.m24;
      Matrix4.setUniformArray[8] = this.$matrix.m31;
      Matrix4.setUniformArray[9] = this.$matrix.m32;
      Matrix4.setUniformArray[10] = this.$matrix.m33;
      Matrix4.setUniformArray[11] = this.$matrix.m34;
      Matrix4.setUniformArray[12] = this.$matrix.m41;
      Matrix4.setUniformArray[13] = this.$matrix.m42;
      Matrix4.setUniformArray[14] = this.$matrix.m43;
      Matrix4.setUniformArray[15] = this.$matrix.m44;
      Matrix4.setUniformWebGLArray.set(Matrix4.setUniformArray);
      ctx.uniformMatrix4fv(loc, transpose, Matrix4.setUniformWebGLArray);
      return this;
    }
     makeIdentity() {
      this.$matrix.m11 = 1;
      this.$matrix.m12 = 0;
      this.$matrix.m13 = 0;
      this.$matrix.m14 = 0;
      this.$matrix.m21 = 0;
      this.$matrix.m22 = 1;
      this.$matrix.m23 = 0;
      this.$matrix.m24 = 0;
      this.$matrix.m31 = 0;
      this.$matrix.m32 = 0;
      this.$matrix.m33 = 1;
      this.$matrix.m34 = 0;
      this.$matrix.m41 = 0;
      this.$matrix.m42 = 0;
      this.$matrix.m43 = 0;
      this.$matrix.m44 = 1;
      this.isPersp = false;
      return this;
    }
     transpose() {
      var tmp=this.$matrix.m12;
      this.$matrix.m12 = this.$matrix.m21;
      this.$matrix.m21 = tmp;
      tmp = this.$matrix.m13;
      this.$matrix.m13 = this.$matrix.m31;
      this.$matrix.m31 = tmp;
      tmp = this.$matrix.m14;
      this.$matrix.m14 = this.$matrix.m41;
      this.$matrix.m41 = tmp;
      tmp = this.$matrix.m23;
      this.$matrix.m23 = this.$matrix.m32;
      this.$matrix.m32 = tmp;
      tmp = this.$matrix.m24;
      this.$matrix.m24 = this.$matrix.m42;
      this.$matrix.m42 = tmp;
      tmp = this.$matrix.m34;
      this.$matrix.m34 = this.$matrix.m43;
      this.$matrix.m43 = tmp;
      return this;
    }
     determinant() {
      return this._determinant4x4();
    }
     invert() {
      var det=this._determinant4x4();
      if (Math.abs(det)<1e-08)
        return null;
      this._makeAdjoint();
      this.$matrix.m11/=det;
      this.$matrix.m12/=det;
      this.$matrix.m13/=det;
      this.$matrix.m14/=det;
      this.$matrix.m21/=det;
      this.$matrix.m22/=det;
      this.$matrix.m23/=det;
      this.$matrix.m24/=det;
      this.$matrix.m31/=det;
      this.$matrix.m32/=det;
      this.$matrix.m33/=det;
      this.$matrix.m34/=det;
      this.$matrix.m41/=det;
      this.$matrix.m42/=det;
      this.$matrix.m43/=det;
      this.$matrix.m44/=det;
      return this;
    }
     translate(x, y, z) {
      if (typeof x==='object'&&"length" in x) {
          var t=x;
          x = t[0];
          y = t[1];
          z = t[2];
      }
      x = x===undefined ? 0 : x;
      y = y===undefined ? 0 : y;
      z = z===undefined ? 0 : z;
      var matrix=temp_mats.next().makeIdentity();
      matrix.$matrix.m41 = x;
      matrix.$matrix.m42 = y;
      matrix.$matrix.m43 = z;
      this.multiply(matrix);
      return this;
    }
     preTranslate(x, y, z) {
      if (typeof x==='object'&&"length" in x) {
          var t=x;
          x = t[0];
          y = t[1];
          z = t[2];
      }
      x = x===undefined ? 0 : x;
      y = y===undefined ? 0 : y;
      z = z===undefined ? 0 : z;
      var matrix=temp_mats.next().makeIdentity();
      matrix.$matrix.m41 = x;
      matrix.$matrix.m42 = y;
      matrix.$matrix.m43 = z;
      this.preMultiply(matrix);
      return this;
    }
     scale(x, y, z, w=1.0) {
      if (typeof x==='object'&&"length" in x) {
          var t=x;
          x = t[0];
          y = t[1];
          z = t[2];
      }
      else {
        if (x===undefined)
          x = 1;
        if (z===undefined) {
            if (y===undefined) {
                y = x;
                z = x;
            }
            else {
              z = x;
            }
        }
        else 
          if (y===undefined) {
            y = x;
        }
      }
      var matrix=temp_mats.next().makeIdentity();
      matrix.$matrix.m11 = x;
      matrix.$matrix.m22 = y;
      matrix.$matrix.m33 = z;
      matrix.$matrix.m44 = w;
      this.multiply(matrix);
      return this;
    }
     preScale(x, y, z, w=1.0) {
      let mat=temp_mats.next().makeIdentity();
      mat.scale(x, y, z, w);
      this.preMultiply(mat);
      return this;
    }
     euler_rotate_order(x, y, z, order=EulerOrders.XYZ) {
      if (y===undefined) {
          y = 0.0;
      }
      if (z===undefined) {
          z = 0.0;
      }
      x = -x;
      y = -y;
      z = -z;
      let xmat=euler_rotate_mats.next().makeIdentity();
      let m=xmat.$matrix;
      let c=Math.cos(x), s=Math.sin(x);
      m.m22 = c;
      m.m23 = s;
      m.m32 = -s;
      m.m33 = c;
      let ymat=euler_rotate_mats.next().makeIdentity();
      c = Math.cos(y);
      s = Math.sin(y);
      m = ymat.$matrix;
      m.m11 = c;
      m.m13 = -s;
      m.m31 = s;
      m.m33 = c;
      let zmat=euler_rotate_mats.next().makeIdentity();
      c = Math.cos(z);
      s = Math.sin(z);
      m = zmat.$matrix;
      m.m11 = c;
      m.m12 = s;
      m.m21 = -s;
      m.m22 = c;
      let a, b;
      switch (order) {
        case EulerOrders.XYZ:
          a = xmat;
          b = ymat;
          c = zmat;
          break;
        case EulerOrders.XZY:
          a = xmat;
          b = zmat;
          c = ymat;
          break;
        case EulerOrders.YXZ:
          a = ymat;
          b = xmat;
          c = zmat;
          break;
        case EulerOrders.YZX:
          a = ymat;
          b = zmat;
          c = xmat;
          break;
        case EulerOrders.ZXY:
          a = zmat;
          b = xmat;
          c = ymat;
          break;
        case EulerOrders.ZYX:
          a = zmat;
          b = ymat;
          c = xmat;
          break;
      }
      b.preMultiply(c);
      b.multiply(a);
      this.preMultiply(b);
      return this;
    }
     euler_rotate(x, y, z) {
      if (y===undefined) {
          y = 0.0;
      }
      if (z===undefined) {
          z = 0.0;
      }
      window.Matrix4 = Matrix4;
      var xmat=euler_rotate_mats.next().makeIdentity();
      var m=xmat.$matrix;
      var c=Math.cos(x), s=Math.sin(x);
      m.m22 = c;
      m.m23 = s;
      m.m32 = -s;
      m.m33 = c;
      var ymat=euler_rotate_mats.next().makeIdentity();
      c = Math.cos(y);
      s = Math.sin(y);
      var m=ymat.$matrix;
      m.m11 = c;
      m.m13 = -s;
      m.m31 = s;
      m.m33 = c;
      ymat.multiply(xmat);
      var zmat=euler_rotate_mats.next().makeIdentity();
      c = Math.cos(z);
      s = Math.sin(z);
      var m=zmat.$matrix;
      m.m11 = c;
      m.m12 = s;
      m.m21 = -s;
      m.m22 = c;
      zmat.multiply(ymat);
      this.preMultiply(zmat);
      return this;
    }
     toString() {
      var s="";
      var m=this.$matrix;
      function dec(d) {
        var ret=d.toFixed(3);
        if (ret[0]!=="-")
          ret = " "+ret;
        return ret;
      }
      s = dec(m.m11)+", "+dec(m.m12)+", "+dec(m.m13)+", "+dec(m.m14)+"\n";
      s+=dec(m.m21)+", "+dec(m.m22)+", "+dec(m.m23)+", "+dec(m.m24)+"\n";
      s+=dec(m.m31)+", "+dec(m.m32)+", "+dec(m.m33)+", "+dec(m.m34)+"\n";
      s+=dec(m.m41)+", "+dec(m.m42)+", "+dec(m.m43)+", "+dec(m.m44)+"\n";
      return s;
    }
     rotate(angle, x, y, z) {
      if (typeof x==='object'&&"length" in x) {
          var t=x;
          x = t[0];
          y = t[1];
          z = t[2];
      }
      else {
        if (arguments.length===1) {
            x = y = 0;
            z = 1;
        }
        else 
          if (arguments.length===3) {
            this.rotate(angle, 1, 0, 0);
            this.rotate(x, 0, 1, 0);
            this.rotate(y, 0, 0, 1);
            return ;
        }
      }
      angle/=2;
      var sinA=Math.sin(angle);
      var cosA=Math.cos(angle);
      var sinA2=sinA*sinA;
      var len=Math.sqrt(x*x+y*y+z*z);
      if (len===0) {
          x = 0;
          y = 0;
          z = 1;
      }
      else 
        if (len!==1) {
          x/=len;
          y/=len;
          z/=len;
      }
      var mat=temp_mats.next().makeIdentity();
      if (x===1&&y===0&&z===0) {
          mat.$matrix.m11 = 1;
          mat.$matrix.m12 = 0;
          mat.$matrix.m13 = 0;
          mat.$matrix.m21 = 0;
          mat.$matrix.m22 = 1-2*sinA2;
          mat.$matrix.m23 = 2*sinA*cosA;
          mat.$matrix.m31 = 0;
          mat.$matrix.m32 = -2*sinA*cosA;
          mat.$matrix.m33 = 1-2*sinA2;
          mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
          mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
          mat.$matrix.m44 = 1;
      }
      else 
        if (x===0&&y===1&&z===0) {
          mat.$matrix.m11 = 1-2*sinA2;
          mat.$matrix.m12 = 0;
          mat.$matrix.m13 = -2*sinA*cosA;
          mat.$matrix.m21 = 0;
          mat.$matrix.m22 = 1;
          mat.$matrix.m23 = 0;
          mat.$matrix.m31 = 2*sinA*cosA;
          mat.$matrix.m32 = 0;
          mat.$matrix.m33 = 1-2*sinA2;
          mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
          mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
          mat.$matrix.m44 = 1;
      }
      else 
        if (x===0&&y===0&&z===1) {
          mat.$matrix.m11 = 1-2*sinA2;
          mat.$matrix.m12 = 2*sinA*cosA;
          mat.$matrix.m13 = 0;
          mat.$matrix.m21 = -2*sinA*cosA;
          mat.$matrix.m22 = 1-2*sinA2;
          mat.$matrix.m23 = 0;
          mat.$matrix.m31 = 0;
          mat.$matrix.m32 = 0;
          mat.$matrix.m33 = 1;
          mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
          mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
          mat.$matrix.m44 = 1;
      }
      else {
        var x2=x*x;
        var y2=y*y;
        var z2=z*z;
        mat.$matrix.m11 = 1-2*(y2+z2)*sinA2;
        mat.$matrix.m12 = 2*(x*y*sinA2+z*sinA*cosA);
        mat.$matrix.m13 = 2*(x*z*sinA2-y*sinA*cosA);
        mat.$matrix.m21 = 2*(y*x*sinA2-z*sinA*cosA);
        mat.$matrix.m22 = 1-2*(z2+x2)*sinA2;
        mat.$matrix.m23 = 2*(y*z*sinA2+x*sinA*cosA);
        mat.$matrix.m31 = 2*(z*x*sinA2+y*sinA*cosA);
        mat.$matrix.m32 = 2*(z*y*sinA2-x*sinA*cosA);
        mat.$matrix.m33 = 1-2*(x2+y2)*sinA2;
        mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
        mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
        mat.$matrix.m44 = 1;
      }
      this.multiply(mat);
      return this;
    }
     normalize() {
      let m=this.$matrix;
      let v1=new Vector4([m.m11, m.m12, m.m13, m.m14]);
      let v2=new Vector4([m.m21, m.m22, m.m23, m.m24]);
      let v3=new Vector4([m.m31, m.m32, m.m33, m.m34]);
      let v4=new Vector4([m.m41, m.m42, m.m43, m.m44]);
      v1.normalize();
      v2.normalize();
      v3.normalize();
      let flat=new Array().concat(v1).concat(v2).concat(v3).concat(v4);
      this.load(flat);
      return this;
    }
     clearTranslation(set_w_to_one=false) {
      let m=this.$matrix;
      m.m41 = m.m42 = m.m43 = 0.0;
      if (set_w_to_one) {
          m.m44 = 1.0;
      }
      return this;
    }
     setTranslation(x, y, z, resetW=true) {
      if (typeof x==="object") {
          y = x[1];
          z = x[2];
          x = x[0];
      }
      let m=this.$matrix;
      m.m41 = x;
      m.m42 = y;
      m.m43 = z;
      if (resetW) {
          m.m44 = 1.0;
      }
      return this;
    }
     makeNormalMatrix(normal, up=undefined) {
      if (normal===undefined) {
          throw new Error("normal cannot be undefined");
      }
      let n=makenormalcache.next().load(normal).normalize();
      if (up===undefined) {
          up = makenormalcache.next().zero();
          if (Math.abs(n[2])>0.95) {
              up[1] = 1.0;
          }
          else {
            up[2] = 1.0;
          }
      }
      up = makenormalcache.next().load(up);
      up.normalize();
      if (up.dot(normal)>0.99) {
          this.makeIdentity();
          return this;
      }
      else 
        if (up.dot(normal)<-0.99) {
          this.makeIdentity();
          this.scale(1.0, 1.0, -1.0);
          return this;
      }
      let x=makenormalcache.next();
      let y=makenormalcache.next();
      x.load(n).cross(up).normalize();
      y.load(x).cross(n).normalize();
      this.makeIdentity();
      let m=this.$matrix;
      m.m11 = x[0];
      m.m12 = x[1];
      m.m13 = x[2];
      m.m21 = y[0];
      m.m22 = y[1];
      m.m23 = y[2];
      m.m31 = n[0];
      m.m32 = n[1];
      m.m33 = n[2];
      m.m44 = 1.0;
      return this;
    }
     preMultiply(mat) {
      preMultTemp.load(mat);
      preMultTemp.multiply(this);
      this.load(preMultTemp);
      return this;
    }
     multiply(mat) {
      let mm=this.$matrix;
      let mm2=mat.$matrix;
      let m11=(mm2.m11*mm.m11+mm2.m12*mm.m21+mm2.m13*mm.m31+mm2.m14*mm.m41);
      let m12=(mm2.m11*mm.m12+mm2.m12*mm.m22+mm2.m13*mm.m32+mm2.m14*mm.m42);
      let m13=(mm2.m11*mm.m13+mm2.m12*mm.m23+mm2.m13*mm.m33+mm2.m14*mm.m43);
      let m14=(mm2.m11*mm.m14+mm2.m12*mm.m24+mm2.m13*mm.m34+mm2.m14*mm.m44);
      let m21=(mm2.m21*mm.m11+mm2.m22*mm.m21+mm2.m23*mm.m31+mm2.m24*mm.m41);
      let m22=(mm2.m21*mm.m12+mm2.m22*mm.m22+mm2.m23*mm.m32+mm2.m24*mm.m42);
      let m23=(mm2.m21*mm.m13+mm2.m22*mm.m23+mm2.m23*mm.m33+mm2.m24*mm.m43);
      let m24=(mm2.m21*mm.m14+mm2.m22*mm.m24+mm2.m23*mm.m34+mm2.m24*mm.m44);
      let m31=(mm2.m31*mm.m11+mm2.m32*mm.m21+mm2.m33*mm.m31+mm2.m34*mm.m41);
      let m32=(mm2.m31*mm.m12+mm2.m32*mm.m22+mm2.m33*mm.m32+mm2.m34*mm.m42);
      let m33=(mm2.m31*mm.m13+mm2.m32*mm.m23+mm2.m33*mm.m33+mm2.m34*mm.m43);
      let m34=(mm2.m31*mm.m14+mm2.m32*mm.m24+mm2.m33*mm.m34+mm2.m34*mm.m44);
      let m41=(mm2.m41*mm.m11+mm2.m42*mm.m21+mm2.m43*mm.m31+mm2.m44*mm.m41);
      let m42=(mm2.m41*mm.m12+mm2.m42*mm.m22+mm2.m43*mm.m32+mm2.m44*mm.m42);
      let m43=(mm2.m41*mm.m13+mm2.m42*mm.m23+mm2.m43*mm.m33+mm2.m44*mm.m43);
      let m44=(mm2.m41*mm.m14+mm2.m42*mm.m24+mm2.m43*mm.m34+mm2.m44*mm.m44);
      mm.m11 = m11;
      mm.m12 = m12;
      mm.m13 = m13;
      mm.m14 = m14;
      mm.m21 = m21;
      mm.m22 = m22;
      mm.m23 = m23;
      mm.m24 = m24;
      mm.m31 = m31;
      mm.m32 = m32;
      mm.m33 = m33;
      mm.m34 = m34;
      mm.m41 = m41;
      mm.m42 = m42;
      mm.m43 = m43;
      mm.m44 = m44;
      return this;
    }
     divide(divisor) {
      this.$matrix.m11/=divisor;
      this.$matrix.m12/=divisor;
      this.$matrix.m13/=divisor;
      this.$matrix.m14/=divisor;
      this.$matrix.m21/=divisor;
      this.$matrix.m22/=divisor;
      this.$matrix.m23/=divisor;
      this.$matrix.m24/=divisor;
      this.$matrix.m31/=divisor;
      this.$matrix.m32/=divisor;
      this.$matrix.m33/=divisor;
      this.$matrix.m34/=divisor;
      this.$matrix.m41/=divisor;
      this.$matrix.m42/=divisor;
      this.$matrix.m43/=divisor;
      this.$matrix.m44/=divisor;
      return this;
    }
     ortho(left, right, bottom, top, near, far) {
      console.warn("Matrix4.ortho() is deprecated, use .orthographic() instead");
      var tx=(left+right)/(left-right);
      var ty=(top+bottom)/(top-bottom);
      var tz=(far+near)/(far-near);
      var matrix=temp_mats.next().makeIdentity();
      matrix.$matrix.m11 = 2/(left-right);
      matrix.$matrix.m12 = 0;
      matrix.$matrix.m13 = 0;
      matrix.$matrix.m14 = 0;
      matrix.$matrix.m21 = 0;
      matrix.$matrix.m22 = 2/(top-bottom);
      matrix.$matrix.m23 = 0;
      matrix.$matrix.m24 = 0;
      matrix.$matrix.m31 = 0;
      matrix.$matrix.m32 = 0;
      matrix.$matrix.m33 = -2/(far-near);
      matrix.$matrix.m34 = 0;
      matrix.$matrix.m41 = tx;
      matrix.$matrix.m42 = ty;
      matrix.$matrix.m43 = tz;
      matrix.$matrix.m44 = 1;
      this.multiply(matrix);
      return this;
    }
     frustum(left, right, bottom, top, near, far) {
      var matrix=temp_mats.next().makeIdentity();
      var A=(right+left)/(right-left);
      var B=(top+bottom)/(top-bottom);
      var C=-(far+near)/(far-near);
      var D=-(2*far*near)/(far-near);
      matrix.$matrix.m11 = (2*near)/(right-left);
      matrix.$matrix.m12 = 0;
      matrix.$matrix.m13 = 0;
      matrix.$matrix.m14 = 0;
      matrix.$matrix.m21 = 0;
      matrix.$matrix.m22 = 2*near/(top-bottom);
      matrix.$matrix.m23 = 0;
      matrix.$matrix.m24 = 0;
      matrix.$matrix.m31 = A;
      matrix.$matrix.m32 = B;
      matrix.$matrix.m33 = C;
      matrix.$matrix.m34 = -1;
      matrix.$matrix.m41 = 0;
      matrix.$matrix.m42 = 0;
      matrix.$matrix.m43 = D;
      matrix.$matrix.m44 = 0;
      this.isPersp = true;
      this.multiply(matrix);
      return this;
    }
     orthographic(scale, aspect, near, far) {
      let mat=temp_mats.next().makeIdentity();
      let zscale=far-near;
      mat.scale(2.0/aspect, 2.0, -1.0/scale/zscale, 1.0/scale);
      mat.translate(0.0, 0.0, 0.5*zscale-near);
      this.isPersp = true;
      this.multiply(mat);
      return mat;
    }
     perspective(fovy, aspect, zNear, zFar) {
      var top=Math.tan(fovy*Math.PI/360)*zNear;
      var bottom=-top;
      var left=aspect*bottom;
      var right=aspect*top;
      this.frustum(left, right, bottom, top, zNear, zFar);
      return this;
    }
     lookat(pos, target, up) {
      var matrix=lookat_cache_ms.next();
      matrix.makeIdentity();
      var vec=lookat_cache_vs3.next().load(pos).sub(target);
      var len=vec.vectorLength();
      vec.normalize();
      var zvec=vec;
      var yvec=lookat_cache_vs3.next().load(up).normalize();
      var xvec=lookat_cache_vs3.next().load(yvec).cross(zvec).normalize();
      let mm=matrix.$matrix;
      mm.m11 = xvec[0];
      mm.m12 = yvec[0];
      mm.m13 = zvec[0];
      mm.m14 = 0;
      mm.m21 = xvec[1];
      mm.m22 = yvec[1];
      mm.m23 = zvec[1];
      mm.m24 = 0;
      mm.m31 = xvec[2];
      mm.m32 = yvec[2];
      mm.m33 = zvec[2];
      mm.m11 = xvec[0];
      mm.m12 = xvec[1];
      mm.m13 = xvec[2];
      mm.m14 = 0;
      mm.m21 = yvec[0];
      mm.m22 = yvec[1];
      mm.m23 = yvec[2];
      mm.m24 = 0;
      mm.m31 = zvec[0];
      mm.m32 = zvec[1];
      mm.m33 = zvec[2];
      mm.m34 = 0;
      mm.m41 = pos[0];
      mm.m42 = pos[1];
      mm.m43 = pos[2];
      mm.m44 = 1;
      this.multiply(matrix);
      return this;
    }
     makeRotationOnly() {
      var m=this.$matrix;
      m.m41 = m.m42 = m.m43 = 0.0;
      m.m44 = 1.0;
      let l1=Math.sqrt(m.m11*m.m11+m.m12*m.m12+m.m13*m.m13);
      let l2=Math.sqrt(m.m21*m.m21+m.m22*m.m22+m.m23*m.m23);
      let l3=Math.sqrt(m.m31*m.m31+m.m32*m.m32+m.m33*m.m33);
      if (l1) {
          m.m11/=l1;
          m.m12/=l1;
          m.m13/=l1;
      }
      if (l2) {
          m.m21/=l2;
          m.m22/=l2;
          m.m23/=l2;
      }
      if (l3) {
          m.m31/=l3;
          m.m32/=l3;
          m.m33/=l3;
      }
      return this;
    }
     alignAxis(axis, vec) {
      vec = new Vector3(vec);
      vec.normalize();
      let mat=this.inputs.transformMatrix.getValue();
      let m=mat.$matrix;
      let mat2=new Matrix4(mat);
      let loc=new Vector3(), scale=new Vector3(), rot=new Vector3();
      mat2.decompose(loc, rot, scale);
      mat2.makeRotationOnly();
      let axes=mat2.getAsVecs();
      let axis2=(axis+1)%3;
      let axis3=(axis+2)%3;
      axes[axis].load(vec);
      axes[axis2].cross(axes[axis]).cross(axes[axis]);
      axes[axis3].load(axes[axis]).cross(axes[axis2]);
      axes[0][3] = 1.0;
      axes[1][3] = 1.0;
      axes[2][3] = 1.0;
      axes[0].normalize();
      axes[1].normalize();
      axes[2].normalize();
      this.loadFromVecs(axes);
      this.scale(scale[0], scale[1], scale[2]);
      m.m41 = loc[0];
      m.m42 = loc[1];
      m.m43 = loc[2];
      return this;
    }
     decompose(_translate, _rotate, _scale, _skew, _perspective, order=EulerOrders.XYZ) {
      if (this.$matrix.m44===0)
        return false;
      let mat=temp_mats.next().load(this);
      let m=mat.$matrix;
      let t=_translate, r=_rotate, s=_scale;
      if (t) {
          t[0] = m.m41;
          t[1] = m.m42;
          t[2] = m.m43;
      }
      let l1=Math.sqrt(m.m11*m.m11+m.m12*m.m12+m.m13*m.m13);
      let l2=Math.sqrt(m.m21*m.m21+m.m22*m.m22+m.m23*m.m23);
      let l3=Math.sqrt(m.m31*m.m31+m.m32*m.m32+m.m33*m.m33);
      if (l1) {
          m.m11/=l1;
          m.m12/=l1;
          m.m13/=l1;
      }
      if (l2) {
          m.m21/=l2;
          m.m22/=l2;
          m.m23/=l2;
      }
      if (l3) {
          m.m31/=l3;
          m.m32/=l3;
          m.m33/=l3;
      }
      if (s) {
          s[0] = l1;
          s[1] = l2;
          s[2] = l3;
      }
      if (r) {
          let clamp=myclamp;
          let rmat=temp_mats.next().load(this);
          rmat.normalize();
          m = rmat.$matrix;
          let m11=m.m11, m12=m.m12, m13=m.m13, m14=m.m14;
          let m21=m.m21, m22=m.m22, m23=m.m23, m24=m.m24;
          let m31=m.m31, m32=m.m32, m33=m.m33, m34=m.m34;
          if (order===EulerOrders.XYZ) {
              r[1] = Math.asin(clamp(m13, -1, 1));
              if (Math.abs(m13)<0.9999999) {
                  r[0] = Math.atan2(-m23, m33);
                  r[2] = Math.atan2(-m12, m11);
              }
              else {
                r[0] = Math.atan2(m32, m22);
                r[2] = 0;
              }
          }
          else 
            if (order===EulerOrders.YXZ) {
              r[0] = Math.asin(-clamp(m23, -1, 1));
              if (Math.abs(m23)<0.9999999) {
                  r[1] = Math.atan2(m13, m33);
                  r[2] = Math.atan2(m21, m22);
              }
              else {
                r[1] = Math.atan2(-m31, m11);
                r[2] = 0;
              }
          }
          else 
            if (order===EulerOrders.ZXY) {
              r[0] = Math.asin(clamp(m32, -1, 1));
              if (Math.abs(m32)<0.9999999) {
                  r[1] = Math.atan2(-m31, m33);
                  r[2] = Math.atan2(-m12, m22);
              }
              else {
                r[1] = 0;
                r[2] = Math.atan2(m21, m11);
              }
          }
          else 
            if (order===EulerOrders.ZYX) {
              r[1] = Math.asin(-clamp(m31, -1, 1));
              if (Math.abs(m31)<0.9999999) {
                  r[0] = Math.atan2(m32, m33);
                  r[2] = Math.atan2(m21, m11);
              }
              else {
                r[0] = 0;
                r[2] = Math.atan2(-m12, m22);
              }
          }
          else 
            if (order===EulerOrders.YZX) {
              r[2] = Math.asin(clamp(m21, -1, 1));
              if (Math.abs(m21)<0.9999999) {
                  r[0] = Math.atan2(-m23, m22);
                  r[1] = Math.atan2(-m31, m11);
              }
              else {
                r[0] = 0;
                r[1] = Math.atan2(m13, m33);
              }
          }
          else 
            if (order===EulerOrders.XZY) {
              r[2] = Math.asin(-clamp(m12, -1, 1));
              if (Math.abs(m12)<0.9999999) {
                  r[0] = Math.atan2(m32, m22);
                  r[1] = Math.atan2(m13, m11);
              }
              else {
                r[0] = Math.atan2(-m23, m33);
                r[1] = 0;
              }
          }
          else {
            console.warn('unsupported euler order:', order);
          }
      }
    }
     _determinant2x2(a, b, c, d) {
      return a*d-b*c;
    }
     _determinant3x3(a1, a2, a3, b1, b2, b3, c1, c2, c3) {
      return a1*this._determinant2x2(b2, b3, c2, c3)-b1*this._determinant2x2(a2, a3, c2, c3)+c1*this._determinant2x2(a2, a3, b2, b3);
    }
     determinant() {
      return this._determinant4x4();
    }
     _determinant4x4() {
      var a1=this.$matrix.m11;
      var b1=this.$matrix.m12;
      var c1=this.$matrix.m13;
      var d1=this.$matrix.m14;
      var a2=this.$matrix.m21;
      var b2=this.$matrix.m22;
      var c2=this.$matrix.m23;
      var d2=this.$matrix.m24;
      var a3=this.$matrix.m31;
      var b3=this.$matrix.m32;
      var c3=this.$matrix.m33;
      var d3=this.$matrix.m34;
      var a4=this.$matrix.m41;
      var b4=this.$matrix.m42;
      var c4=this.$matrix.m43;
      var d4=this.$matrix.m44;
      return a1*this._determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4)-b1*this._determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4)+c1*this._determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4)-d1*this._determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
    }
     _makeAdjoint() {
      var a1=this.$matrix.m11;
      var b1=this.$matrix.m12;
      var c1=this.$matrix.m13;
      var d1=this.$matrix.m14;
      var a2=this.$matrix.m21;
      var b2=this.$matrix.m22;
      var c2=this.$matrix.m23;
      var d2=this.$matrix.m24;
      var a3=this.$matrix.m31;
      var b3=this.$matrix.m32;
      var c3=this.$matrix.m33;
      var d3=this.$matrix.m34;
      var a4=this.$matrix.m41;
      var b4=this.$matrix.m42;
      var c4=this.$matrix.m43;
      var d4=this.$matrix.m44;
      this.$matrix.m11 = this._determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4);
      this.$matrix.m21 = -this._determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4);
      this.$matrix.m31 = this._determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4);
      this.$matrix.m41 = -this._determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
      this.$matrix.m12 = -this._determinant3x3(b1, b3, b4, c1, c3, c4, d1, d3, d4);
      this.$matrix.m22 = this._determinant3x3(a1, a3, a4, c1, c3, c4, d1, d3, d4);
      this.$matrix.m32 = -this._determinant3x3(a1, a3, a4, b1, b3, b4, d1, d3, d4);
      this.$matrix.m42 = this._determinant3x3(a1, a3, a4, b1, b3, b4, c1, c3, c4);
      this.$matrix.m13 = this._determinant3x3(b1, b2, b4, c1, c2, c4, d1, d2, d4);
      this.$matrix.m23 = -this._determinant3x3(a1, a2, a4, c1, c2, c4, d1, d2, d4);
      this.$matrix.m33 = this._determinant3x3(a1, a2, a4, b1, b2, b4, d1, d2, d4);
      this.$matrix.m43 = -this._determinant3x3(a1, a2, a4, b1, b2, b4, c1, c2, c4);
      this.$matrix.m14 = -this._determinant3x3(b1, b2, b3, c1, c2, c3, d1, d2, d3);
      this.$matrix.m24 = this._determinant3x3(a1, a2, a3, c1, c2, c3, d1, d2, d3);
      this.$matrix.m34 = -this._determinant3x3(a1, a2, a3, b1, b2, b3, d1, d2, d3);
      this.$matrix.m44 = this._determinant3x3(a1, a2, a3, b1, b2, b3, c1, c2, c3);
    }
     loadSTRUCT(reader) {
      reader(this);
      this.load(this.mat);
      this.__mat = this.mat;
    }
  }
  _ESClass.register(Matrix4);
  _es6_module.add_class(Matrix4);
  Matrix4 = _es6_module.add_export('Matrix4', Matrix4);
  Matrix4.STRUCT = `
mat4 {
  mat      : array(float) | this.getAsArray();
  isPersp  : int          | this.isPersp;
}
`;
  nstructjs.register(Matrix4);
  preMultTemp = new Matrix4();
  window.testmat = (x, y, z) =>    {
    if (x===undefined) {
        x = 0;
    }
    if (y===undefined) {
        y = 0;
    }
    if (z===undefined) {
        z = Math.PI*0.5;
    }
    let m1=new Matrix4();
    m1.euler_rotate(x, y, z);
    let t=[0, 0, 0], r=[0, 0, 0], s=[0, 0, 0];
    m1.decompose(t, r, s);
    window.console.log("\n");
    window.console.log(t);
    window.console.log(r);
    window.console.log(s);
    let mat=m1.clone();
    mat.transpose();
    mat.multiply(m1);
    console.log(mat.toString());
    return r;
  }
  lookat_cache_ms = util.cachering.fromConstructor(Matrix4, 64);
  euler_rotate_mats = util.cachering.fromConstructor(Matrix4, 64);
  temp_mats = util.cachering.fromConstructor(Matrix4, 64);
}, '/dev/fairmotion/src/path.ux/scripts/path-controller/util/vectormath.js');


es6_module_define('pathux', ["./widgets/ui_widgets2.js", "./path-controller/controller.js", "./path-controller/util/graphpack.js", "./widgets/ui_menu.js", "./config/const.js", "./xmlpage/xmlpage.js", "./widgets/ui_textbox.js", "./widgets/ui_listbox.js", "./widgets/ui_curvewidget.js", "./screen/FrameManager.js", "./widgets/ui_richedit.js", "./util/ScreenOverdraw.js", "./widgets/ui_lasttool.js", "./core/ui.js", "./core/ui_theme.js", "./widgets/ui_numsliders.js", "./platforms/electron/electron_api.js", "./simple/simple.js", "./widgets/ui_panel.js", "./widgets/ui_table.js", "./path-controller/util/html5_fileapi.js", "./widgets/ui_colorpicker2.js", "./screen/ScreenArea.js", "./widgets/ui_tabs.js", "./widgets/ui_treeview.js", "./widgets/ui_button.js", "./platforms/platform_base.js", "./widgets/ui_noteframe.js", "./core/ui_base.js", "./platforms/platform.js", "./path-controller/util/polyfill.js", "./core/units.js", "./widgets/theme_editor.js", "./widgets/ui_widgets.js", "./widgets/ui_progress.js"], function _pathux_module(_es6_module) {
  es6_import(_es6_module, './path-controller/util/polyfill.js');
  var ___xmlpage_xmlpage_js=es6_import(_es6_module, './xmlpage/xmlpage.js');
  for (let k in ___xmlpage_xmlpage_js) {
      _es6_module.add_export(k, ___xmlpage_xmlpage_js[k], true);
  }
  var ___core_ui_base_js=es6_import(_es6_module, './core/ui_base.js');
  for (let k in ___core_ui_base_js) {
      _es6_module.add_export(k, ___core_ui_base_js[k], true);
  }
  var ___core_ui_js=es6_import(_es6_module, './core/ui.js');
  for (let k in ___core_ui_js) {
      _es6_module.add_export(k, ___core_ui_js[k], true);
  }
  var ___widgets_ui_widgets_js=es6_import(_es6_module, './widgets/ui_widgets.js');
  for (let k in ___widgets_ui_widgets_js) {
      _es6_module.add_export(k, ___widgets_ui_widgets_js[k], true);
  }
  var ___widgets_ui_widgets2_js=es6_import(_es6_module, './widgets/ui_widgets2.js');
  for (let k in ___widgets_ui_widgets2_js) {
      _es6_module.add_export(k, ___widgets_ui_widgets2_js[k], true);
  }
  var ___core_ui_theme_js=es6_import(_es6_module, './core/ui_theme.js');
  for (let k in ___core_ui_theme_js) {
      _es6_module.add_export(k, ___core_ui_theme_js[k], true);
  }
  var ___core_units_js=es6_import(_es6_module, './core/units.js');
  for (let k in ___core_units_js) {
      _es6_module.add_export(k, ___core_units_js[k], true);
  }
  var ___widgets_ui_button_js=es6_import(_es6_module, './widgets/ui_button.js');
  for (let k in ___widgets_ui_button_js) {
      _es6_module.add_export(k, ___widgets_ui_button_js[k], true);
  }
  var ___widgets_ui_richedit_js=es6_import(_es6_module, './widgets/ui_richedit.js');
  for (let k in ___widgets_ui_richedit_js) {
      _es6_module.add_export(k, ___widgets_ui_richedit_js[k], true);
  }
  var ___widgets_ui_curvewidget_js=es6_import(_es6_module, './widgets/ui_curvewidget.js');
  for (let k in ___widgets_ui_curvewidget_js) {
      _es6_module.add_export(k, ___widgets_ui_curvewidget_js[k], true);
  }
  var ___widgets_ui_panel_js=es6_import(_es6_module, './widgets/ui_panel.js');
  for (let k in ___widgets_ui_panel_js) {
      _es6_module.add_export(k, ___widgets_ui_panel_js[k], true);
  }
  var ___widgets_ui_colorpicker2_js=es6_import(_es6_module, './widgets/ui_colorpicker2.js');
  for (let k in ___widgets_ui_colorpicker2_js) {
      _es6_module.add_export(k, ___widgets_ui_colorpicker2_js[k], true);
  }
  var ___widgets_ui_tabs_js=es6_import(_es6_module, './widgets/ui_tabs.js');
  for (let k in ___widgets_ui_tabs_js) {
      _es6_module.add_export(k, ___widgets_ui_tabs_js[k], true);
  }
  var ___widgets_ui_listbox_js=es6_import(_es6_module, './widgets/ui_listbox.js');
  for (let k in ___widgets_ui_listbox_js) {
      _es6_module.add_export(k, ___widgets_ui_listbox_js[k], true);
  }
  var ___widgets_ui_menu_js=es6_import(_es6_module, './widgets/ui_menu.js');
  for (let k in ___widgets_ui_menu_js) {
      _es6_module.add_export(k, ___widgets_ui_menu_js[k], true);
  }
  var ___widgets_ui_progress_js=es6_import(_es6_module, './widgets/ui_progress.js');
  for (let k in ___widgets_ui_progress_js) {
      _es6_module.add_export(k, ___widgets_ui_progress_js[k], true);
  }
  var ___widgets_ui_table_js=es6_import(_es6_module, './widgets/ui_table.js');
  for (let k in ___widgets_ui_table_js) {
      _es6_module.add_export(k, ___widgets_ui_table_js[k], true);
  }
  var ___widgets_ui_noteframe_js=es6_import(_es6_module, './widgets/ui_noteframe.js');
  for (let k in ___widgets_ui_noteframe_js) {
      _es6_module.add_export(k, ___widgets_ui_noteframe_js[k], true);
  }
  var ___widgets_ui_numsliders_js=es6_import(_es6_module, './widgets/ui_numsliders.js');
  for (let k in ___widgets_ui_numsliders_js) {
      _es6_module.add_export(k, ___widgets_ui_numsliders_js[k], true);
  }
  var ___widgets_ui_lasttool_js=es6_import(_es6_module, './widgets/ui_lasttool.js');
  for (let k in ___widgets_ui_lasttool_js) {
      _es6_module.add_export(k, ___widgets_ui_lasttool_js[k], true);
  }
  var ___widgets_ui_textbox_js=es6_import(_es6_module, './widgets/ui_textbox.js');
  for (let k in ___widgets_ui_textbox_js) {
      _es6_module.add_export(k, ___widgets_ui_textbox_js[k], true);
  }
  var ___path_controller_util_graphpack_js=es6_import(_es6_module, './path-controller/util/graphpack.js');
  for (let k in ___path_controller_util_graphpack_js) {
      _es6_module.add_export(k, ___path_controller_util_graphpack_js[k], true);
  }
  var ___path_controller_util_html5_fileapi_js=es6_import(_es6_module, './path-controller/util/html5_fileapi.js');
  for (let k in ___path_controller_util_html5_fileapi_js) {
      _es6_module.add_export(k, ___path_controller_util_html5_fileapi_js[k], true);
  }
  var ___path_controller_controller_js=es6_import(_es6_module, './path-controller/controller.js');
  for (let k in ___path_controller_controller_js) {
      _es6_module.add_export(k, ___path_controller_controller_js[k], true);
  }
  var controller=es6_import(_es6_module, './path-controller/controller.js');
  controller = _es6_module.add_export('controller', controller);
  var ui_noteframe=es6_import(_es6_module, './widgets/ui_noteframe.js');
  controller.setNotifier(ui_noteframe);
  let _ex_PlatformAPI=es6_import_item(_es6_module, './platforms/platform_base.js', 'PlatformAPI');
  _es6_module.add_export('PlatformAPI', _ex_PlatformAPI, true);
  let _ex_getMime=es6_import_item(_es6_module, './platforms/platform_base.js', 'getMime');
  _es6_module.add_export('getMime', _ex_getMime, true);
  let _ex_isMimeText=es6_import_item(_es6_module, './platforms/platform_base.js', 'isMimeText');
  _es6_module.add_export('isMimeText', _ex_isMimeText, true);
  let _ex_mimeMap=es6_import_item(_es6_module, './platforms/platform_base.js', 'mimeMap');
  _es6_module.add_export('mimeMap', _ex_mimeMap, true);
  let _ex_textMimes=es6_import_item(_es6_module, './platforms/platform_base.js', 'textMimes');
  _es6_module.add_export('textMimes', _ex_textMimes, true);
  let _ex_FileDialogArgs=es6_import_item(_es6_module, './platforms/platform_base.js', 'FileDialogArgs');
  _es6_module.add_export('FileDialogArgs', _ex_FileDialogArgs, true);
  let _ex_FilePath=es6_import_item(_es6_module, './platforms/platform_base.js', 'FilePath');
  _es6_module.add_export('FilePath', _ex_FilePath, true);
  var platform=es6_import(_es6_module, './platforms/platform.js');
  platform = _es6_module.add_export('platform', platform);
  var electron_api=es6_import(_es6_module, './platforms/electron/electron_api.js');
  electron_api = _es6_module.add_export('electron_api', electron_api);
  var ___widgets_theme_editor_js=es6_import(_es6_module, './widgets/theme_editor.js');
  for (let k in ___widgets_theme_editor_js) {
      _es6_module.add_export(k, ___widgets_theme_editor_js[k], true);
  }
  var ___widgets_ui_treeview_js=es6_import(_es6_module, './widgets/ui_treeview.js');
  for (let k in ___widgets_ui_treeview_js) {
      _es6_module.add_export(k, ___widgets_ui_treeview_js[k], true);
  }
  var ___screen_FrameManager_js=es6_import(_es6_module, './screen/FrameManager.js');
  for (let k in ___screen_FrameManager_js) {
      _es6_module.add_export(k, ___screen_FrameManager_js[k], true);
  }
  var ___screen_ScreenArea_js=es6_import(_es6_module, './screen/ScreenArea.js');
  for (let k in ___screen_ScreenArea_js) {
      _es6_module.add_export(k, ___screen_ScreenArea_js[k], true);
  }
  var ___util_ScreenOverdraw_js=es6_import(_es6_module, './util/ScreenOverdraw.js');
  for (let k in ___util_ScreenOverdraw_js) {
      _es6_module.add_export(k, ___util_ScreenOverdraw_js[k], true);
  }
  var cconst=es6_import_item(_es6_module, './config/const.js', 'default');
  cconst = _es6_module.add_export('cconst', cconst);
  var simple=es6_import(_es6_module, './simple/simple.js');
  simple = _es6_module.add_export('simple', simple);
}, '/dev/fairmotion/src/path.ux/scripts/pathux.js');


es6_module_define('electron_api', ["../../util/util.js", "../../widgets/ui_menu.js", "../../core/ui_base.js", "../platform_base.js", "../../config/const.js"], function _electron_api_module(_es6_module) {
  "use strict";
  let _nativeTheme;
  function getNativeTheme() {
    if (_nativeTheme) {
        return _nativeTheme;
    }
    let remote=getElectron().remote;
    if (!remote) {
        ipcRenderer.invoke("nativeTheme");
    }
    else {
      _nativeTheme = remote.nativeTheme;
    }
    return _nativeTheme;
  }
  function getElectronVersion() {
    let key=navigator.userAgent;
    let i=key.search("Electron");
    key = key.slice(i+9, key.length);
    i = key.search(/[ \t]/);
    if (i>=0) {
        key = key.slice(0, i);
    }
    key = key.trim();
    key = key.split(".").map((f) =>      {
      return parseInt(f);
    });
    return key;
  }
  function getElectron() {
    return require('electron');
  }
  function myRequire(mod) {
    return globalThis.require(mod);
  }
  var Menu=es6_import_item(_es6_module, '../../widgets/ui_menu.js', 'Menu');
  var DropBox=es6_import_item(_es6_module, '../../widgets/ui_menu.js', 'DropBox');
  var getIconManager=es6_import_item(_es6_module, '../../core/ui_base.js', 'getIconManager');
  var cconst=es6_import_item(_es6_module, '../../config/const.js', 'default');
  var util=es6_import(_es6_module, '../../util/util.js');
  var FileDialogArgs=es6_import_item(_es6_module, '../platform_base.js', 'FileDialogArgs');
  var FilePath=es6_import_item(_es6_module, '../platform_base.js', 'FilePath');
  function getFilename(path) {
    let filename=path.replace(/\\/g, "/");
    let i=filename.length-1;
    while (i>=0&&filename[i]!=="/") {
      i--;
    }
    if (filename[i]==="/") {
        i++;
    }
    if (i>0) {
        filename = filename.slice(i, filename.length).trim();
    }
    return filename;
  }
  let _menu_init=false;
  let _init=false;
  var mimeMap=es6_import_item(_es6_module, '../platform_base.js', 'mimeMap');
  let electron_menu_idgen=1;
  let ipcRenderer;
  class ElectronMenu extends Array {
     constructor(args={}) {
      super();
      this._ipcId = electron_menu_idgen++;
      for (let k in args) {
          this[k] = args[k];
      }
    }
     insert(i, item) {
      this.length++;
      let j=this.length-1;
      while (j>i) {
        this[j] = this[j-1];
        j--;
      }
      this[i] = item;
      return this;
    }
    static  setApplicationMenu(menu) {
      initElectronIpc();
      ipcRenderer.invoke("set-menu-bar", menu);
    }
     closePopup() {
      ipcRenderer.invoke("close-menu", this._ipcId);
    }
     append(item) {
      this.push(item);
    }
     popup(args) {
      let $_t0cuui=args, x=$_t0cuui.x, y=$_t0cuui.y, callback=$_t0cuui.callback;
      callback = wrapRemoteCallback("popup_menu_click", callback);
      const $_t1bqlb=require('electron'), ipcRenderer=$_t1bqlb.ipcRenderer;
      ipcRenderer.invoke("popup-menu", this, x, y, callback);
    }
  }
  _ESClass.register(ElectronMenu);
  _es6_module.add_class(ElectronMenu);
  ElectronMenu = _es6_module.add_export('ElectronMenu', ElectronMenu);
  let callbacks={}
  let keybase=1;
  function wrapRemoteCallback(key, callback) {
    key = "remote_"+key+(keybase++);
    callbacks[key] = callback;
    return key;
  }
  wrapRemoteCallback = _es6_module.add_export('wrapRemoteCallback', wrapRemoteCallback);
  let ipcInit=false;
  function initElectronIpc() {
    if (ipcInit) {
        return ;
    }
    ipcInit = true;
    ipcRenderer = require('electron').ipcRenderer;
    ipcRenderer.on('invoke-menu-callback', (event, key, args) =>      {
      callbacks[key].apply(undefined, args);
    });
    ipcRenderer.on("nativeTheme", (event, module) =>      {
      _nativeTheme = Object.assign({}, module);
      _nativeTheme._themeSource = _nativeTheme.themeSource;
      Object.defineProperty(_nativeTheme, "themeSource", {get: function get() {
          return this._themeSource;
        }, 
     set: function set(v) {
          ipcRenderer.invoke("nativeTheme.setThemeSource", v);
        }});
    });
  }
  class ElectronMenuItem  {
     constructor(args) {
      for (let k in args) {
          this[k] = args[k];
      }
      if (this.click) {
          this.click = wrapRemoteCallback("menu_click", this.click);
      }
    }
  }
  _ESClass.register(ElectronMenuItem);
  _es6_module.add_class(ElectronMenuItem);
  ElectronMenuItem = _es6_module.add_export('ElectronMenuItem', ElectronMenuItem);
  function patchDropBox() {
    initElectronIpc();
    if (cconst.noElectronMenus) {
        return ;
    }
    DropBox.prototype._onpress = function _onpress(e) {
      if (this._menu!==undefined) {
          this._menu.close();
          this._menu = undefined;
          this._pressed = false;
          this._redraw();
          return ;
      }
      this._build_menu();
      let emenu=buildElectronMenu(this._menu);
      this._menu.close = () =>        {
        emenu.closePopup();
      }
      if (this._menu===undefined) {
          return ;
      }
      this._menu._dropbox = this;
      this.dom._background = this.getDefault("BoxDepressed");
      this._background = this.getDefault("BoxDepressed");
      this._redraw();
      this._pressed = true;
      this.setCSS();
      let onclose=this._menu.onclose;
      this._menu.onclose = () =>        {
        this._pressed = false;
        this._redraw();
        let menu=this._menu;
        if (menu) {
            this._menu = undefined;
            menu._dropbox = undefined;
        }
        if (onclose) {
            onclose.call(menu);
        }
      }
      let menu=this._menu;
      let screen=this.getScreen();
      let dpi=this.getDPI();
      let x=e.x, y=e.y;
      let rects=this.dom.getClientRects();
      x = rects[0].x;
      y = rects[0].y+Math.ceil(rects[0].height);
      x = ~~x;
      y = ~~y;
      emenu.popup({x: x, 
     y: y, 
     callback: () =>          {
          if (this._menu) {
              this._menu.onclose();
          }
        }});
    }
  }
  let on_tick=() =>    {
    let nativeTheme=getNativeTheme();
    if (nativeTheme) {
        let mode=nativeTheme.shouldUseDarkColors ? "dark" : "light";
        if (mode!==cconst.colorSchemeType) {
            nativeTheme.themeSource = cconst.colorSchemeType;
        }
    }
  }
  function checkInit() {
    if (window.haveElectron&&!_init) {
        _init = true;
        patchDropBox();
        setInterval(on_tick, 350);
    }
  }
  checkInit = _es6_module.add_export('checkInit', checkInit);
  let iconcache={}
  iconcache = _es6_module.add_export('iconcache', iconcache);
  function makeIconKey(icon, iconsheet, invertColors) {
    return ""+icon+":"+iconsheet+":"+invertColors;
  }
  function getNativeIcon(icon, iconsheet, invertColors, size) {
    if (iconsheet===undefined) {
        iconsheet = 0;
    }
    if (invertColors===undefined) {
        invertColors = false;
    }
    if (size===undefined) {
        size = 16;
    }
    let icongen;
    try {
      icongen = myRequire("./icogen.js");
    }
    catch (error) {
        icongen = myRequire("./icogen.cjs");
    }
    window.icongen = icongen;
    let nativeImage=getElectron().nativeImage;
    let manager=getIconManager();
    let sheet=manager.findSheet(iconsheet);
    let images=[];
    let sizes=icongen.GetRequiredICOImageSizes();
    if (1) {
        let iconsheet=manager.findClosestSheet(size);
        let tilesize=manager.getTileSize(iconsheet);
        let canvas=document.createElement("canvas");
        let g=canvas.getContext("2d");
        canvas.width = canvas.height = size;
        if (invertColors) {
            g.filter = "invert(100%)";
        }
        let scale=size/tilesize;
        g.scale(scale, scale);
        manager.canvasDraw({getDPI: () =>            {
            return 1.0;
          }}, canvas, g, icon, 0, 0, iconsheet);
        let header="data:image/png;base64,";
        let data=canvas.toDataURL();
        data = data.slice(header.length, data.length);
        data = Buffer.from(data, "base64");
        myRequire("fs").writeFileSync("./myicon2.png", data);
        images.push(data);
    }
    return "myicon2.png";
    return icon;
    return undefined;
    window._icon = icon;
    return icon;
  }
  getNativeIcon = _es6_module.add_export('getNativeIcon', getNativeIcon);
  let map={CTRL: "Control", 
   ALT: "Alt", 
   SHIFT: "Shift", 
   COMMAND: "Command"}
  function buildElectronHotkey(hk) {
    hk = hk.trim().replace(/[ \t-]+/g, "+");
    for (let k in map) {
        hk = hk.replace(k, map[k]);
    }
    return hk;
  }
  buildElectronHotkey = _es6_module.add_export('buildElectronHotkey', buildElectronHotkey);
  function buildElectronMenu(menu) {
    let electron=getElectron().remote;
    initElectronIpc();
    let emenu=new ElectronMenu();
    let buildItem=(item) =>      {
      if (item._isMenu) {
          let menu2=item._menu;
          return new ElectronMenuItem({submenu: buildElectronMenu(item._menu), 
       label: menu2.getAttribute("title")});
      }
      let hotkey=item.hotkey;
      let icon=item.icon;
      let label=""+item.label;
      if (hotkey&&typeof hotkey!=="string") {
          hotkey = buildElectronHotkey(hotkey);
      }
      else {
        hotkey = ""+hotkey;
      }
      if (icon<0) {
          icon = undefined;
      }
      let args={id: ""+item._id, 
     label: label, 
     accelerator: hotkey, 
     icon: icon ? getNativeIcon(icon) : undefined, 
     click: function () {
          menu.onselect(item._id);
        }, 
     registerAccelerator: false}
      return new ElectronMenuItem(args);
    }
    for (let item of menu.items) {
        emenu.append(buildItem(item));
    }
    return emenu;
  }
  buildElectronMenu = _es6_module.add_export('buildElectronMenu', buildElectronMenu);
  function initMenuBar(menuEditor, override) {
    if (override===undefined) {
        override = false;
    }
    checkInit();
    if (!window.haveElectron) {
        return ;
    }
    if (_menu_init&&!override) {
        return ;
    }
    _menu_init = true;
    let menu=new ElectronMenu();
    let _roles=new Set(["undo", "redo", "cut", "copy", "paste", "delete", "about", "quit", "open", "save", "load", "paste", "cut", "zoom"]);
    let roles={}
    for (let k of _roles) {
        roles[k] = k;
    }
    roles = Object.assign(roles, {"select all": "selectAll", 
    "file": "fileMenu", 
    "edit": "editMenu", 
    "view": "viewMenu", 
    "app": "appMenu", 
    "help": "help", 
    "zoom in": "zoomIn", 
    "zoom out": "zoomOut"});
    let header=menuEditor.header;
    for (let dbox of header.traverse(DropBox)) {
        dbox._build_menu();
        dbox.update();
        dbox._build_menu();
        let menu2=dbox._menu;
        menu2.ctx = dbox.ctx;
        menu2._init();
        menu2.update();
        let title=dbox._genLabel();
        let args={label: title, 
      tooltip: dbox.description, 
      submenu: buildElectronMenu(menu2)};
        menu.insert(0, new ElectronMenuItem(args));
    }
    ElectronMenu.setApplicationMenu(menu);
  }
  initMenuBar = _es6_module.add_export('initMenuBar', initMenuBar);
  var PlatformAPI=es6_import_item(_es6_module, '../platform_base.js', 'PlatformAPI');
  var isMimeText=es6_import_item(_es6_module, '../platform_base.js', 'isMimeText');
  class platform extends PlatformAPI {
    static  showOpenDialog(title, args=new FileDialogArgs()) {
      console.log(args.filters);
      let eargs={defaultPath: args.defaultPath, 
     filters: this._sanitizeFilters(args.filters??[]), 
     properties: ["openFile", "showHiddenFiles", "createDirectory"]};
      if (args.multi) {
          eargs.properties.push("multiSelections");
      }
      if (!args.addToRecentList) {
          eargs.properties.push("dontAddToRecent");
      }
      initElectronIpc();
      return new Promise((accept, reject) =>        {
        ipcRenderer.invoke('show-open-dialog', eargs, wrapRemoteCallback("open-dialog", (ret) =>          {
          if (ret.canceled||ret.cancelled) {
              reject("cancel");
          }
          else {
            accept(ret.filePaths.map((f) =>              {
              return new FilePath(f, getFilename(f));
            }));
          }
        }), wrapRemoteCallback("show-open-dialog", (error) =>          {
          reject(error);
        }));
      });
    }
    static  _sanitizeFilters(filters) {
      let filters2=[];
      for (let filter of filters) {
          if (Array.isArray(filter)) {
              let ext=filter[0];
              filter = {extensions: filter};
              ext = ext.replace(/\./g, "").trim().toLowerCase();
              if (ext in mimeMap) {
                  filter.mime = mimeMap[ext];
              }
              filter.name = ext;
          }
          console.log(filter.extensions);
          filter.extensions = filter.extensions.map((f) =>            {
            return f.startsWith(".") ? f.slice(1, f.length) : f;
          });
          filters2.push(filter);
      }
      return filters2;
    }
    static  showSaveDialog(title, filedata_cb, args=new FileDialogArgs()) {
      console.log(args.filters);
      let eargs={defaultPath: args.defaultPath, 
     filters: this._sanitizeFilters(args.filters??[]), 
     properties: ["openFile", "showHiddenFiles", "createDirectory"]};
      if (args.multi) {
          eargs.properties.push("multiSelections");
      }
      if (!args.addToRecentList) {
          eargs.properties.push("dontAddToRecent");
      }
      return new Promise((accept, reject) =>        {
        initElectronIpc();
        let onthen=(ret) =>          {
          if (ret.canceled) {
              reject("cancel");
          }
          else {
            let path=ret.filePath;
            let filedata=filedata_cb();
            if (__instance_of(filedata, ArrayBuffer)) {
                filedata = new Uint8Array(filedata);
            }
            require('fs').writeFileSync(path, filedata);
            console.log("saved file", filedata);
            accept(new FilePath(path, getFilename(path)));
          }
        }
        let oncatch=(error) =>          {
          reject(error);
        }
        ipcRenderer.invoke('show-save-dialog', eargs, wrapRemoteCallback('dialog', onthen), wrapRemoteCallback('dialog', oncatch));
      });
    }
    static  readFile(path, mime) {
      return new Promise((accept, reject) =>        {
        let fs=require('fs');
        if (isMimeText(mime)) {
            accept(fs.readFileSync(path.data, "utf8"));
        }
        else {
          accept(fs.readFileSync(path.data).buffer);
        }
      });
    }
    static  writeFile(data, handle, mime) {
      return new Promise((accept, reject) =>        {
        let fs=require('fs');
        fs.writeFileSync(handle.data, data);
        accept(handle);
      });
    }
  }
  _ESClass.register(platform);
  _es6_module.add_class(platform);
  platform = _es6_module.add_export('platform', platform);
}, '/dev/fairmotion/src/path.ux/scripts/platforms/electron/electron_api.js');


es6_module_define('icogen', [], function _icogen_module(_es6_module) {
  "use strict";
  if (window.haveElectron) {
      let fs=require("fs");
      let path=require("path");
      let pngjsNozlib=require("pngjs-nozlib");
      let png=require("pngjs");
      const REQUIRED_IMAGE_SIZES=[16, 24, 32, 48, 64, 128, 256];
      const DEFAULT_FILE_NAME='app';
      const FILE_EXTENSION='.ico';
      const HEADER_SIZE=6;
      const DIRECTORY_SIZE=16;
      const BITMAPINFOHEADER_SIZE=40;
      const BI_RGB=0;
      const convertPNGtoDIB=(src, width, height, bpp) =>        {
        const cols=width*bpp;
        const rows=height*cols;
        const rowEnd=rows-cols;
        const dest=Buffer.alloc(src.length);
        for (let row=0; row<rows; row+=cols) {
            for (let col=0; col<cols; col+=bpp) {
                let pos=row+col;
                const r=src.readUInt8(pos);
                const g=src.readUInt8(pos+1);
                const b=src.readUInt8(pos+2);
                const a=src.readUInt8(pos+3);
                pos = rowEnd-row+col;
                dest.writeUInt8(b, pos);
                dest.writeUInt8(g, pos+1);
                dest.writeUInt8(r, pos+2);
                dest.writeUInt8(a, pos+3);
            }
        }
        return dest;
      };
      const createBitmapInfoHeader=(png, compression) =>        {
        const b=Buffer.alloc(BITMAPINFOHEADER_SIZE);
        b.writeUInt32LE(BITMAPINFOHEADER_SIZE, 0);
        b.writeInt32LE(png.width, 4);
        b.writeInt32LE(png.height*2, 8);
        b.writeUInt16LE(1, 12);
        b.writeUInt16LE(png.bpp*8, 14);
        b.writeUInt32LE(compression, 16);
        b.writeUInt32LE(png.data.length, 20);
        b.writeInt32LE(0, 24);
        b.writeInt32LE(0, 28);
        b.writeUInt32LE(0, 32);
        b.writeUInt32LE(0, 36);
        return b;
      };
      const createDirectory=(png, offset) =>        {
        const b=Buffer.alloc(DIRECTORY_SIZE);
        const size=png.data.length+BITMAPINFOHEADER_SIZE;
        const width=256<=png.width ? 0 : png.width;
        const height=256<=png.height ? 0 : png.height;
        const bpp=png.bpp*8;
        b.writeUInt8(width, 0);
        b.writeUInt8(height, 1);
        b.writeUInt8(0, 2);
        b.writeUInt8(0, 3);
        b.writeUInt16LE(1, 4);
        b.writeUInt16LE(bpp, 6);
        b.writeUInt32LE(size, 8);
        b.writeUInt32LE(offset, 12);
        return b;
      };
      const createFileHeader=(count) =>        {
        const b=Buffer.alloc(HEADER_SIZE);
        b.writeUInt16LE(0, 0);
        b.writeUInt16LE(1, 2);
        b.writeUInt16LE(count, 4);
        return b;
      };
      const checkOptions=(options) =>        {
        if (options) {
            return {name: typeof options.name==='string'&&options.name!=='' ? options.name : DEFAULT_FILE_NAME, 
        sizes: Array.isArray(options.sizes) ? options.sizes : REQUIRED_IMAGE_SIZES}
        }
        else {
          return {name: DEFAULT_FILE_NAME, 
       sizes: REQUIRED_IMAGE_SIZES}
        }
      };
      const GetRequiredICOImageSizes=() =>        {
        return REQUIRED_IMAGE_SIZES;
      };
      let stream=require("stream");
      class WriteStream extends stream.Writable {
         constructor() {
          super();
          this.data = [];
        }
         _write(chunk, encoding, cb) {
          let buf=chunk;
          if (!(__instance_of(buf, Buffer))) {
              Buffer.from(chunk, encoding);
          }
          for (let i=0; i<buf.length; i++) {
              this.data.push(buf[i]);
          }
          cb(null);
        }
         end() {
          this.data = Buffer.from(this.data);
          super.end();
        }
      }
      _ESClass.register(WriteStream);
      _es6_module.add_class(WriteStream);
      exports.GetRequiredICOImageSizes = GetRequiredICOImageSizes;
      const GenerateICO=(images, logger) =>        {
        if (logger===undefined) {
            logger = console;
        }
        logger.log('ICO:');
        const stream=new WriteStream();
        stream.write(createFileHeader(images.length), 'binary');
        let pngs=[];
        for (let image of images) {
            pngs.push(pngjsNozlib.PNG.sync.read(image));
        }
        let offset=HEADER_SIZE+DIRECTORY_SIZE*images.length;
        pngs.forEach((png) =>          {
          const directory=createDirectory(png, offset);
          stream.write(directory, 'binary');
          offset+=png.data.length+BITMAPINFOHEADER_SIZE;
        });
        pngs.forEach((png) =>          {
          const header=createBitmapInfoHeader(png, BI_RGB);
          stream.write(header, 'binary');
          const dib=convertPNGtoDIB(png.data, png.width, png.height, png.bpp);
          stream.write(dib, 'binary');
        });
        stream.end();
        return stream.data;
      };
      exports.GenerateICO = GenerateICO;
      let _default=GenerateICO;
      exports.default = _default;
  }
}, '/dev/fairmotion/src/path.ux/scripts/platforms/electron/icogen.js');


es6_module_define('platform', [], function _platform_module(_es6_module) {
  let promise;
  if (window.haveElectron) {
      promise = _es_dynamic_import(_es6_module, './electron/electron_api.js');
  }
  else {
    promise = _es_dynamic_import(_es6_module, './web/web_api.js');
  }
  var platform;
  platform = _es6_module.add_export('platform', platform);
  promise.then((module) =>    {
    platform = module.platform;
    promise = undefined;
  });
  function getPlatformAsync() {
    if (promise) {
        return new Promise((accept, reject) =>          {
          promise.then((mod) =>            {
            accept(mod.platform);
          });
        });
    }
    return new Promise((accept, reject) =>      {
      accept(platform);
    });
  }
  getPlatformAsync = _es6_module.add_export('getPlatformAsync', getPlatformAsync);
}, '/dev/fairmotion/src/path.ux/scripts/platforms/platform.js');


es6_module_define('platform_base', [], function _platform_base_module(_es6_module) {
  const mimeMap={".js": "application/javascript", 
   ".json": "text/json", 
   ".html": "text/html", 
   ".txt": "text/plain", 
   ".jpg": "image/jpeg", 
   ".png": "image/png", 
   ".tiff": "image/tiff", 
   ".gif": "image/gif", 
   ".bmp": "image/bitmap", 
   ".tga": "image/targa", 
   ".svg": "image/svg+xml", 
   ".xml": "text/xml", 
   ".webp": "image/webp", 
   "svg": "image/svg+xml", 
   "txt": "text/plain", 
   "html": "text/html", 
   "css": "text/css", 
   "ts": "application/typescript", 
   "py": "application/python", 
   "c": "application/c", 
   "cpp": "application/cpp", 
   "cc": "application/cpp", 
   "h": "application/c", 
   "hh": "application/cpp", 
   "hpp": "application/cpp", 
   "sh": "application/bash", 
   "mjs": "application/javascript", 
   "cjs": "application/javascript", 
   "gif": "image/gif"}
  _es6_module.add_export('mimeMap', mimeMap);
  var textMimes=new Set(["application/javascript", "application/x-javscript", "image/svg+xml", "application/xml"]);
  textMimes = _es6_module.add_export('textMimes', textMimes);
  function isMimeText(mime) {
    if (!mime) {
        return false;
    }
    if (mime.startsWith("text")) {
        return true;
    }
    return textMimes.has(mime);
  }
  isMimeText = _es6_module.add_export('isMimeText', isMimeText);
  function getExtension(path) {
    if (!path) {
        return "";
    }
    let i=path.length;
    while (i>0&&path[i]!==".") {
      i--;
    }
    return path.slice(i, path.length).trim().toLowerCase();
  }
  getExtension = _es6_module.add_export('getExtension', getExtension);
  function getMime(path) {
    let ext=getExtension(path);
    if (ext in mimeMap) {
        return mimeMap[ext];
    }
    return "application/x-octet-stream";
  }
  getMime = _es6_module.add_export('getMime', getMime);
  class PlatformAPI  {
    static  writeFile(data, handle, mime) {
      throw new Error("implement me");
    }
    static  resolveURL(path, base=location.href) {
      base = base.trim();
      if (path.startsWith("./")) {
          path = path.slice(2, path.length).trim();
      }
      while (path.startsWith("/")) {
        path = path.slice(1, path.length).trim();
      }
      while (base.endsWith("/")) {
        base = base.slice(0, base.length-1).trim();
      }
      let exts=["html", "txt", "js", "php", "cgi"];
      for (let ext of exts) {
          ext = "."+ext;
          if (base.endsWith(ext)) {
              let i=base.length-1;
              while (i>0&&base[i]!=="/") {
                i--;
              }
              base = base.slice(0, i).trim();
          }
      }
      while (base.endsWith("/")) {
        base = base.slice(0, base.length-1).trim();
      }
      path = (base+"/"+path).split("/");
      let path2=[];
      for (let i=0; i<path.length; i++) {
          if (path[i]==="..") {
              path2.pop();
          }
          else {
            path2.push(path[i]);
          }
      }
      return path2.join("/");
    }
    static  showOpenDialog(title, args=new FileDialogArgs()) {
      throw new Error("implement me");
    }
    static  showSaveDialog(title, savedata_cb, args=new FileDialogArgs()) {
      throw new Error("implement me");
    }
    static  readFile(path, mime) {
      throw new Error("implement me");
    }
  }
  _ESClass.register(PlatformAPI);
  _es6_module.add_class(PlatformAPI);
  PlatformAPI = _es6_module.add_export('PlatformAPI', PlatformAPI);
  class FileDialogArgs  {
     constructor() {
      this.multi = false;
      this.addToRecentList = false;
      this.filters = [];
    }
  }
  _ESClass.register(FileDialogArgs);
  _es6_module.add_class(FileDialogArgs);
  FileDialogArgs = _es6_module.add_export('FileDialogArgs', FileDialogArgs);
  class FilePath  {
     constructor(data, filename="unnamed") {
      this.data = data;
      this.filename = filename;
    }
  }
  _ESClass.register(FilePath);
  _es6_module.add_class(FilePath);
  FilePath = _es6_module.add_export('FilePath', FilePath);
}, '/dev/fairmotion/src/path.ux/scripts/platforms/platform_base.js');


es6_module_define('web_api', ["../../path-controller/util/html5_fileapi.js", "../platform_base.js"], function _web_api_module(_es6_module) {
  var PlatformAPI=es6_import_item(_es6_module, '../platform_base.js', 'PlatformAPI');
  var isMimeText=es6_import_item(_es6_module, '../platform_base.js', 'isMimeText');
  var saveFile=es6_import_item(_es6_module, '../../path-controller/util/html5_fileapi.js', 'saveFile');
  var loadFile=es6_import_item(_es6_module, '../../path-controller/util/html5_fileapi.js', 'loadFile');
  var FileDialogArgs=es6_import_item(_es6_module, '../platform_base.js', 'FileDialogArgs');
  var FilePath=es6_import_item(_es6_module, '../platform_base.js', 'FilePath');
  var mimeMap=es6_import_item(_es6_module, '../platform_base.js', 'mimeMap');
  function getWebFilters(filters) {
    if (filters===undefined) {
        filters = [];
    }
    let types=[];
    for (let item of filters) {
        let mime=item.mime;
        let exts=[];
        for (let ext of item.extensions) {
            ext = "."+ext;
            if (ext.toLowerCase() in mimeMap) {
                mime = mime!==undefined ? mime : mimeMap[ext.toLowerCase()];
            }
            exts.push(ext);
        }
        if (!mime) {
            mime = "application/x-octet-stream";
        }
        types.push({description: item.name, 
      accept: {[mime]: exts}});
    }
    return types;
  }
  getWebFilters = _es6_module.add_export('getWebFilters', getWebFilters);
  class platform extends PlatformAPI {
    static  showOpenDialog(title, args=new FileDialogArgs()) {
      let types=getWebFilters(args.filters);
      return new Promise((accept, reject) =>        {
        try {
          window.showOpenFilePicker({multiple: args.multi, 
       types: types}).then((arg) =>            {
            let paths=[];
            for (let file of arg) {
                paths.push(new FilePath(file, file.name));
            }
            accept(paths);
          });
        }
        catch (error) {
            reject(error);
        }
      });
    }
    static  writeFile(data, handle, mime) {
      handle = handle.data;
      return handle.createWritable().then((file) =>        {
        file.write(data);
        file.close();
      });
    }
    static  showSaveDialog(title, savedata_cb, args=new FileDialogArgs()) {
      if (!window.showSaveFilePicker) {
          return this.showSaveDialog_old(...arguments);
      }
      let types=getWebFilters(args.filters);
      return new Promise((accept, reject) =>        {
        let fname;
        let saveHandle;
        try {
          saveHandle = window.showSaveFilePicker({types: types});
        }
        catch (error) {
            reject(error);
        }
        let handle;
        saveHandle.then((handle1) =>          {
          handle = handle1;
          fname = handle.name;
          console.log("saveHandle", handle);
          return handle.createWritable();
        }).then((file) =>          {
          let savedata=savedata_cb();
          if (__instance_of(savedata, Uint8Array)||__instance_of(savedata, DataView)) {
              savedata = savedata.buffer;
          }
          file.write(savedata);
          file.close();
          let path=new FilePath(handle, fname);
          accept(path);
        });
      });
    }
    static  showSaveDialog_old(title, savedata, args=new FileDialogArgs()) {
      let exts=[];
      for (let list of args.filters) {
          if (!Array.isArray(list)&&list.filters) {
              list = list.filters;
          }
          for (let ext of list) {
              exts.push(ext);
          }
      }
      return new Promise((accept, reject) =>        {
        saveFile(savedata);
        window.setTimeout(() =>          {
          accept("undefined");
        });
      });
    }
    static  readFile(path, mime="") {
      if (mime==="") {
          mime = path.filename;
          let i=mime.length-1;
          while (i>0&&mime[i]!==".") {
            i--;
          }
          mime = mime.slice(i, mime.length).trim().toLowerCase();
          if (mime in mimeMap) {
              mime = mimeMap[mime];
          }
      }
      return new Promise((accept, reject) =>        {
        path.data.getFile().then((file) =>          {
          console.log("file!", file);
          let promise;
          if (isMimeText(mime)) {
              promise = file.text();
          }
          else {
            promise = file.arrayBuffer();
          }
          promise.then((data) =>            {
            accept(data);
          });
        });
      });
      return new Promise((accept, reject) =>        {
        let data=path.data;
        if (isMimeText(mime)) {
            let s='';
            data = new Uint8Array(data);
            for (let i=0; i<data.length; i++) {
                s+=String.fromCharCode(data[i]);
            }
            data = s;
        }
        accept(data);
      });
    }
  }
  _ESClass.register(platform);
  _es6_module.add_class(platform);
  platform = _es6_module.add_export('platform', platform);
}, '/dev/fairmotion/src/path.ux/scripts/platforms/web/web_api.js');


es6_module_define('AreaDocker', ["../core/ui.js", "../core/ui_base.js", "../widgets/ui_menu.js", "../path-controller/util/util.js", "../path-controller/util/vectormath.js", "../config/const.js", "./area_wrangler.js", "../path-controller/util/struct.js", "./ScreenArea.js"], function _AreaDocker_module(_es6_module) {
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var saveUIData=es6_import_item(_es6_module, '../core/ui_base.js', 'saveUIData');
  var loadUIData=es6_import_item(_es6_module, '../core/ui_base.js', 'loadUIData');
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var nstructjs=es6_import(_es6_module, '../path-controller/util/struct.js');
  var Vector2=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector2');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var Area=es6_import_item(_es6_module, './ScreenArea.js', 'Area');
  var Icons=es6_import_item(_es6_module, '../core/ui_base.js', 'Icons');
  var startMenu=es6_import_item(_es6_module, '../widgets/ui_menu.js', 'startMenu');
  var getAreaIntName=es6_import_item(_es6_module, './area_wrangler.js', 'getAreaIntName');
  var setAreaTypes=es6_import_item(_es6_module, './area_wrangler.js', 'setAreaTypes');
  var AreaWrangler=es6_import_item(_es6_module, './area_wrangler.js', 'AreaWrangler');
  var areaclasses=es6_import_item(_es6_module, './area_wrangler.js', 'areaclasses');
  let ignore=0;
  function dockerdebug() {
    if (cconst.DEBUG.areadocker) {
        console.warn(...arguments);
    }
  }
  window.testSnapScreenVerts = function (arg) {
    let screen=CTX.screen;
    screen.unlisten();
    screen.on_resize([screen.size[0]-75, screen.size[1]], screen.size);
    screen.on_resize = screen.updateSize = () =>      {    }
    let p=CTX.propsbar;
    p.pos[0]+=50;
    p.owning_sarea.loadFromPosSize();
    screen.regenBorders();
    screen.size[0] = window.innerWidth-5;
    screen.snapScreenVerts(arg);
  }
  class AreaDocker extends Container {
     constructor() {
      super();
      this._last_update_key = undefined;
      this.mpos = new Vector2();
      this.needsRebuild = true;
      this.ignoreChange = 0;
    }
    static  define() {
      return {tagname: "area-docker-x", 
     style: "areadocker"}
    }
     rebuild() {
      if (!this.parentWidget) {
          return ;
      }
      let sarea=this.getArea().parentWidget;
      if (!sarea) {
          this.needsRebuild = true;
          return ;
      }
      this.needsRebuild = false;
      this.ignoreChange++;
      dockerdebug("Rebuild", this.getArea());
      let uidata=sarea.switcherData = saveUIData(this, "switcherTabs");
      this.clear();
      let tabs=this.tbar = this.tabs();
      tabs.onchange = this.tab_onchange.bind(this);
      let tab;
      dockerdebug(sarea._id, sarea.area ? sarea.area._id : "(no active area)", sarea.editors);
      sarea.switcherData = uidata;
      for (let editor of sarea.editors) {
          let def=editor.constructor.define();
          let name=def.uiname;
          if (!name) {
              name = def.areaname||def.tagname.replace(/-x/, '');
              name = ToolProperty.makeUIName(name);
          }
          let tab=tabs.tab(name, editor._id);
          let start_mpos=new Vector2();
          let mpos=new Vector2();
          tab._tab.addEventListener("tabdragstart", (e) =>            {
            if (e.x!==0&&e.y!==0) {
                start_mpos.loadXY(e.x, e.y);
                this.mpos.loadXY(e.x, e.y);
            }
            else {
              start_mpos.load(this.mpos);
            }
            dockerdebug("tab drag start!", start_mpos, e);
          });
          tab._tab.addEventListener("tabdragmove", (e) =>            {
            this.mpos.loadXY(e.x, e.y);
            let rect=this.tbar.tbar.canvas.getBoundingClientRect();
            let x=e.x, y=e.y;
            let m=8;
            if (x<rect.x-m||x>rect.x+rect.width+m||y<rect.y-m||y>=rect.y+rect.height+m) {
                dockerdebug("tab detach!");
                e.preventDefault();
                this.detach(e);
            }
          });
          tab._tab.addEventListener("tabdragend", (e) =>            {
            this.mpos.loadXY(e.x, e.y);
            dockerdebug("tab drag end!", e);
          });
      }
      tab = this.tbar.icontab(Icons.SMALL_PLUS, "add", "Add Editor", false).noSwitch();
      dockerdebug("Add Menu Tab", tab);
      let icon=this.addicon = tab._tab;
      icon.ontabclick = (e) =>        {
        return this.on_addclick(e);
      };
      icon.setAttribute("menu-button", "true");
      icon.setAttribute("simple", "true");
      this.loadTabData(uidata);
      this.ignoreChange--;
    }
     detach(event) {
      this.tbar._ensureNoModal();
      let area=this.getArea();
      let sarea=this.ctx.screen.floatArea(area);
      sarea.size.min([300, 300]);
      sarea.loadFromPosSize();
      let mpos=event ? new Vector2([event.x, event.y]) : this.mpos;
      dockerdebug("EVENT", event);
      if (event&&__instance_of(event, PointerEvent)) {
          this.ctx.screen.moveAttachTool(sarea, mpos, document.body, event.pointerId);
      }
      else {
        this.ctx.screen.moveAttachTool(sarea, mpos);
      }
    }
     loadTabData(uidata) {
      this.ignoreChange++;
      loadUIData(this, uidata);
      this.ignoreChange--;
    }
     on_addclick(e) {
      let mpos=new Vector2([e.x, e.y]);
      if (this.addicon.menu&&!this.addicon.menu.closed) {
          this.addicon.menu.close();
      }
      else {
        this.addTabMenu(e.target, mpos);
      }
    }
     tab_onchange(tab, event) {
      if (this.ignoreChange) {
          return ;
      }
      dockerdebug("EVENT", event);
      if (event&&(!(__instance_of(event, PointerEvent))||event.pointerType==="mouse")) {
      }
      this.select(tab.id, event);
    }
     init() {
      super.init();
      this.style["touch-action"] = "none";
      this.addEventListener("pointermove", (e) =>        {
        this.mpos.loadXY(e.x, e.y);
      });
      this.rebuild();
    }
     setCSS() {
      super.setCSS();
    }
     getArea() {
      let p=this.parentWidget;
      let lastp=p;
      let name=UIBase.getInternalName("screenarea-x");
      while (p&&p.tagName.toLowerCase()!==name) {
        lastp = p;
        p = p.parentWidget;
      }
      return lastp;
    }
     flagUpdate() {
      this.needsRebuild = true;
      return this;
    }
     update() {
      super.update();
      let active=this.tbar.getActive();
      let area=this.getArea();
      let key=this.parentWidget._id;
      for (let area2 of area.parentWidget.editors) {
          key+=area2._id+":";
      }
      if (key!==this._last_update_key) {
          this._last_update_key = key;
          this.needsRebuild = true;
      }
      if (this.needsRebuild) {
          this.rebuild();
          return ;
      }
      if (this.addicon) {
          let tabs=this.tbar.tbar.tabs;
          let idx=tabs.indexOf(this.addicon);
          if (idx!==tabs.length-1) {
              this.tbar.tbar.swapTabs(this.addicon, tabs[tabs.length-1]);
          }
      }
      if (!active||active._id!==area._id) {
          this.ignoreChange++;
          try {
            this.tbar.setActive(area._id);
          }
          catch (error) {
              util.print_stack(error);
              this.needsRebuild = true;
          }
          this.ignoreChange--;
      }
      window.tabs = this.tbar;
      this.ignoreChange = 0;
    }
     select(areaId, event) {
      dockerdebug("Tab Select!", areaId);
      this.ignoreChange++;
      let area=this.getArea();
      let sarea=area.parentWidget;
      let uidata=saveUIData(this.tbar, "switcherTabs");
      let newarea;
      for (let area2 of sarea.editors) {
          if (area2._id===areaId) {
              newarea = area2;
              sarea.switchEditor(area2.constructor);
              break;
          }
      }
      if (newarea===area||!newarea.switcher) {
          return ;
      }
      sarea.flushSetCSS();
      sarea.flushUpdate();
      newarea = sarea.area;
      let parentw=area.switcher.parentWidget;
      let newparentw=newarea.switcher.parentWidget;
      let parent=area.switcher.parentNode;
      let newparent=newarea.switcher.parentNode;
      area.switcher = newarea.switcher;
      newarea.switcher = this;
      HTMLElement.prototype.remove.call(area.switcher);
      HTMLElement.prototype.remove.call(newarea.switcher);
      if (__instance_of(parent, UIBase)) {
          parent.shadow.appendChild(area.switcher);
      }
      else {
        parent.appendChild(area.switcher);
      }
      if (__instance_of(newparent, UIBase)) {
          newparent.shadow.prepend(newarea.switcher);
      }
      else {
        newparent.prepend(newarea.switcher);
      }
      area.switcher.parentWidget = parentw;
      newarea.switcher.parentWidget = newparentw;
      area.switcher.tbar._ensureNoModal();
      newarea.switcher.tbar._ensureNoModal();
      newarea.switcher.loadTabData(uidata);
      area.switcher.loadTabData(uidata);
      newarea.switcher.setCSS();
      newarea.switcher.update();
      if (event&&(__instance_of(event, PointerEvent)||__instance_of(event, MouseEvent)||__instance_of(event, TouchEvent))) {
          event.preventDefault();
          event.stopPropagation();
          newarea.switcher.tbar._startMove(undefined, event);
      }
      sarea.switcherData = uidata;
      this.ignoreChange--;
    }
     addTabMenu(tab, mpos) {
      let rect=tab.getClientRects()[0];
      dockerdebug(tab, tab.getClientRects());
      if (!mpos) {
          mpos = this.ctx.screen.mpos;
      }
      let menu=UIBase.createElement("menu-x");
      menu.closeOnMouseUp = false;
      menu.ctx = this.ctx;
      menu._init();
      let prop=Area.makeAreasEnum();
      let sarea=this.getArea().parentWidget;
      if (!sarea) {
          return ;
      }
      for (let k in Object.assign({}, prop.values)) {
          let ok=true;
          for (let area of sarea.editors) {
              if (area.constructor.define().uiname===k) {
                  ok = false;
              }
          }
          if (!ok) {
              continue;
          }
          let icon=prop.iconmap[k];
          menu.addItemExtra(k, prop.values[k], undefined, icon);
      }
      if (!rect) {
          console.warn("no rect!");
          return ;
      }
      dockerdebug(mpos[0], mpos[1], rect.x, rect.y);
      menu.onselect = (val) =>        {
        dockerdebug("menu select", val, this.getArea().parentWidget);
        this.addicon.menu = undefined;
        let sarea=this.getArea().parentWidget;
        if (sarea) {
            let cls=areaclasses[val];
            this.ignoreChange++;
            let area, ud;
            try {
              let uidata=saveUIData(this.tbar, "switcherTabs");
              sarea.switchEditor(cls);
              dockerdebug("switching", cls);
              area = sarea.area;
              area._init();
              if (area.switcher) {
                  area.switcher.rebuild();
                  area.switcher.loadTabData(uidata);
                  sarea.switcherData = uidata;
              }
            }
            catch (error) {
                util.print_stack(error);
                throw error;
            }
            finally {
                this.ignoreChange = Math.max(this.ignoreChange-1, 0);
              }
            dockerdebug("AREA", area.switcher, area);
            if (area.switcher) {
                this.ignoreChange++;
                try {
                  area.parentWidget = sarea;
                  area.owning_sarea = sarea;
                  area.switcher.parentWidget = area;
                  area.switcher.ctx = area.ctx;
                  area.switcher._init();
                  area.switcher.update();
                  dockerdebug("loading data", ud);
                  area.switcher.loadTabData(ud);
                  area.switcher.rebuild();
                  area.flushUpdate();
                }
                catch (error) {
                    throw error;
                }
                finally {
                    this.ignoreChange = Math.max(this.ignoreChange-1, 0);
                  }
            }
        }
      };
      this.addicon.menu = menu;
      startMenu(menu, mpos[0]-35, rect.y+rect.height, false, 0);
      return menu;
    }
  }
  _ESClass.register(AreaDocker);
  _es6_module.add_class(AreaDocker);
  AreaDocker = _es6_module.add_export('AreaDocker', AreaDocker);
  UIBase.internalRegister(AreaDocker);
}, '/dev/fairmotion/src/path.ux/scripts/screen/AreaDocker.js');


es6_module_define('area_wrangler', ["../path-controller/util/struct.js", "../path-controller/util/simple_events.js", "../core/ui_consts.js", "../path-controller/util/util.js"], function _area_wrangler_module(_es6_module) {
  var haveModal=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'haveModal');
  var _setModalAreaClass=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', '_setModalAreaClass');
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  es6_import(_es6_module, '../path-controller/util/struct.js');
  let ScreenClass=undefined;
  var ClassIdSymbol=es6_import_item(_es6_module, '../core/ui_consts.js', 'ClassIdSymbol');
  function setScreenClass(cls) {
    ScreenClass = cls;
  }
  setScreenClass = _es6_module.add_export('setScreenClass', setScreenClass);
  function getAreaIntName(name) {
    let hash=0;
    for (let i=0; i<name.length; i++) {
        let c=name.charCodeAt(i);
        if (i%2===0) {
            hash+=c<<8;
            hash*=13;
            hash = hash&((1<<15)-1);
        }
        else {
          hash+=c;
        }
    }
    return hash;
  }
  getAreaIntName = _es6_module.add_export('getAreaIntName', getAreaIntName);
  window.getAreaIntName = getAreaIntName;
  var AreaTypes={TEST_CANVAS_EDITOR: 0}
  AreaTypes = _es6_module.add_export('AreaTypes', AreaTypes);
  function setAreaTypes(def) {
    for (let k in AreaTypes) {
        delete AreaTypes[k];
    }
    for (let k in def) {
        AreaTypes[k] = def[k];
    }
  }
  setAreaTypes = _es6_module.add_export('setAreaTypes', setAreaTypes);
  let areaclasses={}
  areaclasses = _es6_module.add_export('areaclasses', areaclasses);
  let theWrangler=undefined;
  class AreaWrangler  {
     constructor() {
      this.stacks = new Map();
      this.lasts = new Map();
      this.lastArea = undefined;
      this.stack = [];
      this.idgen = 0;
      this.locked = 0;
      this._last_screen_id = undefined;
      theWrangler = this;
    }
     makeSafeContext(ctx) {
      let wrangler=this.copy();
      let this2=this;
      return new Proxy(ctx, {get: function get(target, key, rec) {
          wrangler.copyTo(contextWrangler);
          return target[key];
        }});
    }
     copyTo(ret) {
      for (let /*unprocessed ExpandNode*/[key, stack1] of this.stacks) {
          ret.stack.set(key, util.list(stack1));
      }
      for (let /*unprocessed ExpandNode*/[key, val] of this.lasts) {
          ret.lasts.set(key, val);
      }
      ret.stack = util.list(this.stack);
      ret.lastArea = this.lastArea;
    }
     copy(b) {
      let ret=new AreaWrangler();
      this.copyTo(ret);
      return ret;
    }
     _checkWrangler(ctx) {
      if (ctx===undefined) {
          return true;
      }
      if (this._last_screen_id===undefined) {
          this._last_screen_id = ctx.screen._id;
          return true;
      }
      if (ctx.screen._id!==this._last_screen_id) {
          this.reset();
          this._last_screen_id = ctx.screen._id;
          console.warn("contextWrangler detected a new screen; new file?");
          return false;
      }
      return true;
    }
     reset() {
      theWrangler = this;
      this.stacks = new Map();
      this.lasts = new Map();
      this.lastArea = undefined;
      this.stack = [];
      this.locked = 0;
      this._last_screen_id = undefined;
      return this;
    }
    static  findInstance() {
      return theWrangler;
    }
    static  lock() {
      return this.findInstance().lock();
    }
    static  unlock() {
      return this.findInstance().unlock();
    }
     lock() {
      this.locked++;
      return this;
    }
     unlock() {
      this.locked = Math.max(this.locked-1, 0);
      return this;
    }
     push(type, area, pushLastRef=true) {
      theWrangler = this;
      if (haveModal()||this.locked) {
          pushLastRef = false;
      }
      if (pushLastRef||!this.lasts.has(type[ClassIdSymbol])) {
          this.lasts.set(type[ClassIdSymbol], area);
          this.lastArea = area;
      }
      let stack=this.stacks.get(type[ClassIdSymbol]);
      if (stack===undefined) {
          stack = [];
          this.stacks.set(type[ClassIdSymbol], stack);
      }
      let last=this.lasts.get(type[ClassIdSymbol]);
      stack.push(last);
      stack.push(area);
      this.stack.push(area);
    }
     updateLastRef(type, area) {
      theWrangler = this;
      if ((this.locked||haveModal())&&this.lasts.has(type[ClassIdSymbol])) {
          return ;
      }
      this.lasts.set(type[ClassIdSymbol], area);
      this.lastArea = area;
    }
     pop(type, area) {
      let stack=this.stacks.get(type[ClassIdSymbol]);
      if (stack===undefined) {
          console.warn("pop_ctx_area called in error");
          return ;
      }
      if (stack.length>0) {
          stack.pop();
          let last=stack.pop();
          if (!this.locked&&last&&last.isConnected) {
              this.lasts.set(type[ClassIdSymbol], last);
          }
      }
      else {
        console.error("pop_ctx_area called in error");
      }
      if (this.stack.length>0) {
          this.stack.pop();
      }
    }
     getLastArea(type) {
      if (type===undefined) {
          if (this.stack.length>0) {
              return this.stack[this.stack.length-1];
          }
          else {
            return this.lastArea;
          }
      }
      else {
        if (this.stacks.has(type[ClassIdSymbol])) {
            let stack=this.stacks.get(type[ClassIdSymbol]);
            if (stack.length>0) {
                return stack[stack.length-1];
            }
        }
        return this.lasts.get(type[ClassIdSymbol]);
      }
    }
  }
  _ESClass.register(AreaWrangler);
  _es6_module.add_class(AreaWrangler);
  AreaWrangler = _es6_module.add_export('AreaWrangler', AreaWrangler);
  _setModalAreaClass(AreaWrangler);
  let contextWrangler=new AreaWrangler();
  contextWrangler = _es6_module.add_export('contextWrangler', contextWrangler);
}, '/dev/fairmotion/src/path.ux/scripts/screen/area_wrangler.js');


es6_module_define('FrameManager', ["../widgets/ui_noteframe.js", "../widgets/ui_curvewidget.js", "./ScreenArea.js", "../widgets/ui_menu.js", "./AreaDocker.js", "../widgets/ui_tabs.js", "../widgets/ui_widgets2.js", "../widgets/dragbox.js", "../path-controller/util/math.js", "../path-controller/util/struct.js", "../path-controller/util/util.js", "../widgets/ui_table.js", "../core/ui_base.js", "../widgets/ui_listbox.js", "../path-controller/util/simple_events.js", "../widgets/ui_widgets.js", "./FrameManager_ops.js", "../widgets/ui_colorpicker2.js", "../widgets/ui_panel.js", "../path-controller/controller.js", "../widgets/ui_treeview.js", "../path-controller/util/vectormath.js", "../util/ScreenOverdraw.js", "./FrameManager_mesh.js", "../widgets/ui_textbox.js", "../widgets/ui_dialog.js", "../config/const.js"], function _FrameManager_module(_es6_module) {
  var ToolTipViewer=es6_import_item(_es6_module, './FrameManager_ops.js', 'ToolTipViewer');
  let _FrameManager=undefined;
  es6_import(_es6_module, '../widgets/dragbox.js');
  es6_import(_es6_module, '../widgets/ui_widgets2.js');
  es6_import(_es6_module, '../widgets/ui_panel.js');
  es6_import(_es6_module, '../widgets/ui_treeview.js');
  var DataPathError=es6_import_item(_es6_module, '../path-controller/controller.js', 'DataPathError');
  var nstructjs=es6_import_item(_es6_module, '../path-controller/controller.js', 'nstructjs');
  es6_import(_es6_module, '../util/ScreenOverdraw.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var haveModal=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'haveModal');
  var pushModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'popModalLight');
  var _setScreenClass=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', '_setScreenClass');
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  es6_import(_es6_module, '../widgets/ui_curvewidget.js');
  var vectormath=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var ScreenArea=es6_import(_es6_module, './ScreenArea.js');
  var FrameManager_ops=es6_import(_es6_module, './FrameManager_ops.js');
  var math=es6_import(_es6_module, '../path-controller/util/math.js');
  var ui_menu=es6_import(_es6_module, '../widgets/ui_menu.js');
  es6_import(_es6_module, '../path-controller/util/struct.js');
  var KeyMap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'KeyMap');
  var HotKey=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'HotKey');
  var keymap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'keymap');
  var AreaDocker=es6_import_item(_es6_module, './AreaDocker.js', 'AreaDocker');
  var snap=es6_import_item(_es6_module, './FrameManager_mesh.js', 'snap');
  var snapi=es6_import_item(_es6_module, './FrameManager_mesh.js', 'snapi');
  var ScreenBorder=es6_import_item(_es6_module, './FrameManager_mesh.js', 'ScreenBorder');
  var ScreenVert=es6_import_item(_es6_module, './FrameManager_mesh.js', 'ScreenVert');
  var ScreenHalfEdge=es6_import_item(_es6_module, './FrameManager_mesh.js', 'ScreenHalfEdge');
  var SnapLimit=es6_import_item(_es6_module, './FrameManager_mesh.js', 'SnapLimit');
  let _ex_ScreenBorder=es6_import_item(_es6_module, './FrameManager_mesh.js', 'ScreenBorder');
  _es6_module.add_export('ScreenBorder', _ex_ScreenBorder, true);
  let _ex_ScreenVert=es6_import_item(_es6_module, './FrameManager_mesh.js', 'ScreenVert');
  _es6_module.add_export('ScreenVert', _ex_ScreenVert, true);
  let _ex_ScreenHalfEdge=es6_import_item(_es6_module, './FrameManager_mesh.js', 'ScreenHalfEdge');
  _es6_module.add_export('ScreenHalfEdge', _ex_ScreenHalfEdge, true);
  var theme=es6_import_item(_es6_module, '../core/ui_base.js', 'theme');
  var PackFlags=es6_import_item(_es6_module, '../core/ui_base.js', 'PackFlags');
  var FrameManager_mesh=es6_import(_es6_module, './FrameManager_mesh.js');
  var makePopupArea=es6_import_item(_es6_module, '../widgets/ui_dialog.js', 'makePopupArea');
  let Area=ScreenArea.Area;
  es6_import(_es6_module, '../widgets/ui_widgets.js');
  es6_import(_es6_module, '../widgets/ui_tabs.js');
  es6_import(_es6_module, '../widgets/ui_colorpicker2.js');
  es6_import(_es6_module, '../widgets/ui_noteframe.js');
  es6_import(_es6_module, '../widgets/ui_listbox.js');
  es6_import(_es6_module, '../widgets/ui_table.js');
  var AreaFlags=es6_import_item(_es6_module, './ScreenArea.js', 'AreaFlags');
  var setScreenClass=es6_import_item(_es6_module, './ScreenArea.js', 'setScreenClass');
  var checkForTextBox=es6_import_item(_es6_module, '../widgets/ui_textbox.js', 'checkForTextBox');
  var startMenu=es6_import_item(_es6_module, '../widgets/ui_menu.js', 'startMenu');
  function list(iter) {
    let ret=[];
    for (let item of iter) {
        ret.push(item);
    }
    return ret;
  }
  ui_menu.startMenuEventWrangling();
  let _events_started=false;
  function registerToolStackGetter(func) {
    FrameManager_ops.registerToolStackGetter(func);
  }
  registerToolStackGetter = _es6_module.add_export('registerToolStackGetter', registerToolStackGetter);
  let Vector2=vectormath.Vector2, UIBase=ui_base.UIBase, styleScrollBars=ui_base.styleScrollBars;
  let update_stack=new Array(8192);
  update_stack.cur = 0;
  let screen_idgen=0;
  function purgeUpdateStack() {
    for (let i=0; i<update_stack.length; i++) {
        update_stack[i] = undefined;
    }
  }
  purgeUpdateStack = _es6_module.add_export('purgeUpdateStack', purgeUpdateStack);
  class Screen extends ui_base.UIBase {
     constructor() {
      super();
      this.snapLimit = 1;
      this.fullScreen = true;
      this.globalCSS = document.createElement("style");
      this.shadow.prepend(this.globalCSS);
      this._do_updateSize = true;
      this._resize_callbacks = [];
      this.allBordersMovable = cconst.DEBUG.allBordersMovable;
      this.needsBorderRegen = true;
      this._popup_safe = 0;
      this.testAllKeyMaps = false;
      this.needsTabRecalc = true;
      this._screen_id = screen_idgen++;
      this._popups = [];
      this._ctx = undefined;
      this.keymap = new KeyMap();
      this.size = new Vector2([window.innerWidth, window.innerHeight]);
      this.pos = new Vector2();
      this.oldpos = new Vector2();
      this.idgen = 0;
      this.sareas = [];
      this.sareas.active = undefined;
      this.mpos = [0, 0];
      this.screenborders = [];
      this.screenverts = [];
      this._vertmap = {};
      this._edgemap = {};
      this._idmap = {};
      this._aabb = [new Vector2(), new Vector2()];
      let on_mousemove=(e, x, y) =>        {
        let dragging=e.type==="mousemove"||e.type==="touchmove"||e.type==="pointermove";
        dragging = dragging&&(e.buttons||(e.touches&&e.touches.length>0));
        if (!dragging&&Math.random()>0.9) {
            let elem=this.pickElement(x, y, {sx: 1, 
        sy: 1, 
        nodeclass: ScreenArea.ScreenArea, 
        mouseEvent: e});
            if (0) {
                let elem2=this.pickElement(x, y, 1, 1);
                console.log(""+this.sareas.active, elem2 ? elem2.tagName : undefined, elem!==undefined);
            }
            if (elem!==undefined) {
                if (elem.area) {
                    elem.area.push_ctx_active();
                    elem.area.pop_ctx_active();
                }
                this.sareas.active = elem;
            }
        }
        this.mpos[0] = x;
        this.mpos[1] = y;
      };
      this.shadow.addEventListener("mousemove", (e) =>        {
        return on_mousemove(e, e.x, e.y);
      }, {passive: true});
    }
    get  borders() {
      let this2=this;
      return (function* () {
        for (let k in this2._edgemap) {
            yield this2._edgemap[k];
        }
      })();
    }
    get  listening() {
      return this.listen_timer!==undefined;
    }
    get  ctx() {
      return this._ctx;
    }
    set  ctx(val) {
      this._ctx = val;
      let rec=(n) =>        {
        if (__instance_of(n, UIBase)) {
            n.ctx = val;
        }
        for (let n2 of n.childNodes) {
            rec(n2);
        }
        if (n.shadow) {
            for (let n2 of n.shadow.childNodes) {
                rec(n2);
            }
        }
      };
      for (let n of this.childNodes) {
          rec(n);
      }
      for (let n of this.shadow.childNodes) {
          rec(n);
      }
    }
    static  fromJSON(obj, schedule_resize=false) {
      let ret=UIBase.createElement(this.define().tagname);
      return ret.loadJSON(obj, schedule_resize);
    }
    static  define() {
      return {tagname: "pathux-screen-x"}
    }
    static  newSTRUCT() {
      return UIBase.createElement(this.define().tagname);
    }
     setPosSize(x, y, w, h) {
      this.pos[0] = x;
      this.pos[1] = y;
      this.size[0] = w;
      this.size[1] = h;
      this.setCSS();
      this._internalRegenAll();
    }
     setSize(w, h) {
      this.size[0] = w;
      this.size[1] = h;
      this.setCSS();
      this._internalRegenAll();
    }
     setPos(x, y) {
      this.pos[0] = x;
      this.pos[1] = y;
      this.setCSS();
      this._internalRegenAll();
    }
     init() {
      super.init();
      if (this.hasAttribute("listen")) {
          this.listen();
      }
    }
     mergeGlobalCSS(style) {
      return new Promise((accept, reject) =>        {
        let sheet;
        let finish=() =>          {
          let sheet2=this.globalCSS.sheet;
          if (!sheet2) {
              this.doOnce(finish);
              return ;
          }
          let map={}
          for (let rule of sheet2.rules) {
              map[rule.selectorText] = rule;
          }
          for (let rule of sheet.rules) {
              let k=rule.selectorText;
              if (k in map) {
                  let rule2=map[k];
                  if (!rule.styleMap) {
                      for (let k in rule.style) {
                          let desc=Object.getOwnPropertyDescriptor(rule.style, k);
                          if (!desc||!desc.writable) {
                              continue;
                          }
                          let v=rule.style[k];
                          if (v) {
                              rule2.style[k] = rule.style[k];
                          }
                      }
                      continue;
                  }
                  for (let /*unprocessed ExpandNode*/[key, val] of list(rule.styleMap.entries())) {
                      if (1||rule2.styleMap.has(key)) {
                          let sval="";
                          if (Array.isArray(val)) {
                              for (let item of val) {
                                  sval+=" "+val;
                              }
                              sval = sval.trim();
                          }
                          else {
                            sval = (""+val).trim();
                          }
                          rule2.style[key] = sval;
                          rule2.styleMap.set(key, val);
                      }
                      else {
                        rule2.styleMap.append(key, val);
                      }
                  }
              }
              else {
                sheet2.insertRule(rule.cssText);
              }
          }
        }
        if (typeof style==="string") {
            try {
              sheet = new CSSStyleSheet();
            }
            catch (error) {
                sheet = undefined;
            }
            if (sheet&&sheet.replaceSync) {
                sheet.replaceSync(style);
                finish();
            }
            else {
              let tag=document.createElement("style");
              tag.textContent = style;
              document.body.appendChild(tag);
              let cb=() =>                {
                if (!tag.sheet) {
                    this.doOnce(cb);
                    return ;
                }
                sheet = tag.sheet;
                finish();
                tag.remove();
              };
              this.doOnce(cb);
            }
        }
        else 
          if (!(__instance_of(style, CSSStyleSheet))) {
            sheet = style.sheet;
            finish();
        }
        else {
          sheet = style;
          finish();
        }
      });
    }
     newScreenArea() {
      let ret=UIBase.createElement("screenarea-x");
      ret.ctx = this.ctx;
      if (ret.ctx) {
          ret.init();
      }
      return ret;
    }
     copy() {
      let ret=UIBase.createElement(this.constructor.define().tagname);
      ret.ctx = this.ctx;
      ret._init();
      for (let sarea of this.sareas) {
          let sarea2=sarea.copy(ret);
          sarea2._ctx = this.ctx;
          sarea2.screen = ret;
          sarea2.parentWidget = ret;
          ret.appendChild(sarea2);
      }
      for (let sarea of ret.sareas) {
          sarea.ctx = this.ctx;
          sarea.area.ctx = this.ctx;
          sarea.area.push_ctx_active();
          sarea._init();
          sarea.area._init();
          sarea.area.pop_ctx_active();
          for (let area of sarea.editors) {
              area.ctx = this.ctx;
              area.push_ctx_active();
              area._init();
              area.pop_ctx_active();
          }
      }
      ret.update();
      ret.regenBorders();
      ret.setCSS();
      return ret;
    }
     findScreenArea(x, y) {
      for (let i=this.sareas.length-1; i>=0; i--) {
          let sarea=this.sareas[i];
          let ok=x>=sarea.pos[0]&&x<=sarea.pos[0]+sarea.size[0];
          ok = ok&&(y>=sarea.pos[1]&&y<=sarea.pos[1]+sarea.size[1]);
          if (ok) {
              return sarea;
          }
      }
    }
     pickElement(x, y, args, sy, nodeclass, excluded_classes) {
      let sx;
      let clip;
      if (typeof args==="object") {
          sx = args.sx;
          sy = args.sy;
          nodeclass = args.nodeclass;
          excluded_classes = args.excluded_classes;
          clip = args.clip;
      }
      else {
        sx = args;
        args = {sx: sx, 
      sy: sy, 
      nodeclass: nodeclass, 
      excluded_classes: excluded_classes};
      }
      if (!this.ctx) {
          console.warn("no ctx in screen");
          return ;
      }
      let ret;
      for (let i=this._popups.length-1; i>=0; i--) {
          let popup=this._popups[i];
          ret = ret||popup.pickElement(x, y, args);
      }
      ret = ret||super.pickElement(x, y, args);
      return ret;
    }
     _enterPopupSafe() {
      if (this._popup_safe===undefined) {
          this._popup_safe = 0;
      }
      this._popup_safe++;
    }
    * _allAreas() {
      for (let sarea of this.sareas) {
          for (let area of sarea.editors) {
              yield [area, area._area_id, sarea];
          }
      }
    }
     _exitPopupSafe() {
      this._popup_safe = Math.max(this._popup_safe-1, 0);
    }
     popupMenu(menu, x, y) {
      startMenu(menu, x, y);
      for (let i=0; i<3; i++) {
          menu.flushSetCSS();
          menu.flushUpdate();
      }
      return menu;
    }
     popup(owning_node, elem_or_x, y, closeOnMouseOut=true, popupDelay=5) {
      let ret=this._popup(...arguments);
      for (let i=0; i<2; i++) {
          ret.flushUpdate();
          ret.flushSetCSS();
      }
      if (popupDelay===0) {
          return ret;
      }
      let z=ret.style["z-index"];
      ret.style["z-index"] = "-10";
      let cb=() =>        {
        let rect=ret.getClientRects()[0];
        let size=this.size;
        if (!rect) {
            this.doOnce(cb);
            return ;
        }
        if (rect.bottom>size[1]) {
            ret.style["top"] = (size[1]-rect.height-10)+"px";
        }
        else 
          if (rect.top<0) {
            ret.style["top"] = "10px";
        }
        if (rect.right>size[0]) {
            ret.style["left"] = (size[0]-rect.width-10)+"px";
        }
        else 
          if (rect.left<0) {
            ret.style["left"] = "10px";
        }
        ret.style["z-index"] = z;
        ret.flushUpdate();
        ret.flushSetCSS();
      };
      setTimeout(cb, popupDelay);
      return ret;
    }
     draggablePopup(x, y) {
      let ret=UIBase.createElement("drag-box-x");
      ret.ctx = this.ctx;
      ret.parentWidget = this;
      ret._init();
      this._popups.push(ret);
      ret._onend = () =>        {
        if (this._popups.indexOf(ret)>=0) {
            this._popups.remove(ret);
        }
      };
      ret.style["z-index"] = 205;
      ret.style["position"] = UIBase.PositionKey;
      ret.style["left"] = x+"px";
      ret.style["top"] = y+"px";
      document.body.appendChild(ret);
      return ret;
    }
     _popup(owning_node, elem_or_x, y, closeOnMouseOut=true) {
      let x;
      let sarea=this.sareas.active;
      let w=owning_node;
      while (w) {
        if (__instance_of(w, ScreenArea.ScreenArea)) {
            sarea = w;
            break;
        }
        w = w.parentWidget;
      }
      if (typeof elem_or_x==="object") {
          let r=elem_or_x.getClientRects()[0];
          x = r.x;
          y = r.y;
      }
      else {
        x = elem_or_x;
      }
      x+=window.scrollX;
      y+=window.scrollY;
      let container=UIBase.createElement("container-x");
      container.ctx = this.ctx;
      container._init();
      let remove=container.remove;
      container.remove = () =>        {
        if (this._popups.indexOf(container)>=0) {
            this._popups.remove(container);
        }
        return remove.apply(container, arguments);
      };
      container.overrideClass("popup");
      container.background = container.getDefault("background-color");
      container.style["border-radius"] = container.getDefault("border-radius")+"px";
      container.style["border-color"] = container.getDefault("border-color");
      container.style["border-style"] = container.getDefault("border-style");
      container.style["border-width"] = container.getDefault("border-width")+"px";
      container.style["box-shadow"] = container.getDefault("box-shadow");
      container.style["position"] = UIBase.PositionKey;
      container.style["z-index"] = "2205";
      container.style["left"] = x+"px";
      container.style["top"] = y+"px";
      container.style["margin"] = "0px";
      container.parentWidget = this;
      let mm=new math.MinMax(2);
      let p=new Vector2();
      let _update=container.update;
      container.update.after(() =>        {
        container.style["z-index"] = "2205";
      });
      document.body.appendChild(container);
      this.setCSS();
      this._popups.push(container);
      let touchpick, mousepick, keydown;
      let done=false;
      let end=() =>        {
        if (this._popup_safe) {
            return ;
        }
        if (done)
          return ;
        this.ctx.screen.removeEventListener("mousedown", mousepick, true);
        this.ctx.screen.removeEventListener("mousemove", mousepick, {passive: true});
        this.ctx.screen.removeEventListener("mouseup", mousepick, true);
        window.removeEventListener("keydown", keydown);
        done = true;
        container.remove();
      };
      container.end = end;
      let _remove=container.remove;
      container.remove = function () {
        if (arguments.length==0) {
            end();
        }
        _remove.apply(this, arguments);
      };
      container._ondestroy = () =>        {
        end();
      };
      let bad_time=util.time_ms();
      let last_pick_time=util.time_ms();
      mousepick = (e, x, y, do_timeout) =>        {
        if (do_timeout===undefined) {
            do_timeout = true;
        }
        if (!container.isConnected) {
            end();
            return ;
        }
        if (sarea&&sarea.area) {
            sarea.area.push_ctx_active();
            sarea.area.pop_ctx_active();
        }
        if (util.time_ms()-last_pick_time<350) {
            return ;
        }
        last_pick_time = util.time_ms();
        x = x===undefined ? e.x : x;
        y = y===undefined ? e.y : y;
        let elem=this.pickElement(x, y, {sx: 2, 
      sy: 2, 
      excluded_classes: [ScreenBorder], 
      mouseEvent: e});
        let startelem=elem;
        if (elem===undefined) {
            if (closeOnMouseOut) {
                end();
            }
            return ;
        }
        let ok=false;
        let elem2=elem;
        while (elem) {
          if (elem===container) {
              ok = true;
              break;
          }
          elem = elem.parentWidget;
        }
        if (!ok) {
            do_timeout = !do_timeout||(util.time_ms()-bad_time>100);
            if (closeOnMouseOut&&do_timeout) {
                end();
            }
        }
        else {
          bad_time = util.time_ms();
        }
      };
      touchpick = (e) =>        {
        let x=e.touches[0].pageX, y=e.touches[0].pageY;
        return mousepick(e, x, y, false);
      };
      keydown = (e) =>        {
        if (!container.isConnected) {
            window.removeEventListener("keydown", keydown);
            return ;
        }
        switch (e.keyCode) {
          case keymap["Escape"]:
            end();
            break;
        }
      };
      this.ctx.screen.addEventListener("mousedown", mousepick, true);
      this.ctx.screen.addEventListener("mousemove", mousepick, {passive: true});
      this.ctx.screen.addEventListener("mouseup", mousepick, true);
      window.addEventListener("keydown", keydown);
      this.calcTabOrder();
      return container;
    }
     _recalcAABB(save=true) {
      let mm=new math.MinMax(2);
      for (let v of this.screenverts) {
          mm.minmax(v);
      }
      if (save) {
          this._aabb[0].load(mm.min);
          this._aabb[1].load(mm.max);
      }
      return [new Vector2(mm.min), new Vector2(mm.max)];
    }
     load() {

    }
     save() {

    }
     popupArea(area_class) {
      return makePopupArea(area_class, this);
    }
     remove(trigger_destroy=true) {
      this.unlisten();
      if (trigger_destroy) {
          return super.remove();
      }
      else {
        HTMLElement.prototype.remove.call(this);
      }
    }
     unlisten() {
      if (this.listen_timer!==undefined) {
          window.clearInterval(this.listen_timer);
          this.listen_timer = undefined;
      }
    }
     checkCSSSize() {
      let w=this.style.width.toLowerCase().trim();
      let h=this.style.height.toLowerCase().trim();
      if (w.endsWith("px")&&h.endsWith("px")) {
          w = parseFloat(w.slice(0, w.length-2).trim());
          h = parseFloat(h.slice(0, h.length-2).trim());
          if (w!==this.size[0]||h!==this.size[1]) {
              this.on_resize([this.size[0], this.size[1]], [w, h]);
              this.size[0] = w;
              this.size[1] = h;
          }
      }
    }
     getBoolAttribute(attr, defaultval=false) {
      if (!this.hasAttribute(attr)) {
          return defaultval;
      }
      let ret=this.getAttribute(attr);
      if (typeof ret==="number") {
          return !!ret;
      }
      else 
        if (typeof ret==="string") {
          ret = ret.toLowerCase().trim();
          ret = ret==="true"||ret==="1"||ret==="yes";
      }
      return !!ret;
    }
     updateSize() {
      if (this.getBoolAttribute("inherit-scale")||!this.fullScreen||!cconst.autoSizeUpdate) {
          this.checkCSSSize();
          return ;
      }
      let width=window.innerWidth;
      let height=window.innerHeight;
      let ratio=window.outerHeight/window.innerHeight;
      let scale=visualViewport.scale;
      let pad=4;
      width = visualViewport.width*scale-pad;
      height = visualViewport.height*scale-pad;
      let ox=visualViewport.offsetLeft;
      let oy=visualViewport.offsetTop;
      if (cconst.DEBUG.customWindowSize) {
          let s=cconst.DEBUG.customWindowSize;
          width = s.width;
          height = s.height;
          ox = 0;
          oy = 0;
          window._DEBUG = cconst.DEBUG;
      }
      let key=this._calcSizeKey(width, height, ox, oy, devicePixelRatio, scale);
      document.body.style.margin = document.body.style.padding = "0px";
      document.body.style["transform-origin"] = "top left";
      document.body.style["transform"] = `translate(${ox}px,${oy}px) scale(${1.0/scale})`;
      if (key!==this._last_ckey1) {
          this._last_ckey1 = key;
          this.on_resize(this.size, [width, height], false);
          this.on_resize(this.size, this.size, false);
          let scale=visualViewport.scale;
          this.regenBorders();
          this.setCSS();
          this.completeUpdate();
      }
    }
     listen(args={updateSize: true}) {
      ui_menu.setWranglerScreen(this);
      let ctx=this.ctx;
      startEvents(() =>        {
        return ctx.screen;
      });
      if (this.listen_timer!==undefined) {
          return ;
      }
      this._do_updateSize = args.updateSize!==undefined ? args.updateSize : true;
      this.listen_timer = window.setInterval(() =>        {
        if (this.isDead()) {
            console.log("dead screen");
            this.unlisten();
            return ;
        }
        this.update();
      }, 150);
    }
     _calcSizeKey(w, h, x, y, dpi, scale) {
      if (arguments.length!==6) {
          throw new Error("eek");
      }
      let s="";
      for (let i=0; i<arguments.length; i++) {
          s+=arguments[i].toFixed(0)+":";
      }
      return s;
    }
     _ondestroy() {
      if (ui_menu.getWranglerScreen()===this) {
      }
      this.unlisten();
      let recurse=(n, second_pass, parent) =>        {
        if (n.__pass===second_pass) {
            console.warn("CYCLE IN DOM TREE!", n, parent);
            return ;
        }
        n.__pass = second_pass;
        n._forEachChildWidget((n2) =>          {
          if (n===n2)
            return ;
          recurse(n2, second_pass, n);
          try {
            if (!second_pass&&!n2.__destroyed) {
                n2.__destroyed = true;
                n2._ondestroy();
            }
          }
          catch (error) {
              print_stack(error);
              console.log("failed to exectue an ondestroy callback");
          }
          n2.__destroyed = true;
          try {
            if (second_pass) {
                n2.remove();
            }
          }
          catch (error) {
              print_stack(error);
              console.log("failed to remove element after ondestroy callback");
          }
        });
      };
      let id=~~(Math.random()*1024*1024);
      recurse(this, id);
      recurse(this, id+1);
    }
     destroy() {
      this._ondestroy();
    }
     clear() {
      this._ondestroy();
      this.sareas = [];
      this.sareas.active = undefined;
      for (let child of list(this.childNodes)) {
          child.remove();
      }
      for (let child of list(this.shadow.childNodes)) {
          child.remove();
      }
    }
     _test_save() {
      let obj=JSON.parse(JSON.stringify(this));
      console.log(JSON.stringify(this));
      this.loadJSON(obj);
    }
     loadJSON(obj, schedule_resize=false) {
      this.clear();
      super.loadJSON();
      for (let sarea of obj.sareas) {
          let sarea2=UIBase.createElement("screenarea-x");
          sarea2.ctx = this.ctx;
          sarea2.screen = this;
          this.appendChild(sarea2);
          sarea2.loadJSON(sarea);
      }
      this.regenBorders();
      this.setCSS();
      if (schedule_resize) {
          window.setTimeout(() =>            {
            this.on_resize(this.size, [window.innerWidth, window.innerHeight]);
          }, 50);
      }
    }
     toJSON() {
      let ret={sareas: this.sareas};
      ret.size = this.size;
      ret.idgen = this.idgen;
      return Object.assign(super.toJSON(), ret);
    }
     getHotKey(toolpath) {
      let test=(keymap) =>        {
        for (let hk of keymap) {
            if (typeof hk.action!="string")
              continue;
            if (hk.action.trim().startsWith(toolpath.trim())) {
                return hk;
            }
        }
      };
      let ret=test(this.keymap);
      if (ret)
        return ret;
      if (this.sareas.active&&this.sareas.active.keymap) {
          let area=this.sareas.active.area;
          for (let keymap of area.getKeyMaps()) {
              ret = test(keymap);
              if (ret)
                return ret;
          }
      }
      if (ret===undefined) {
          for (let sarea of this.sareas) {
              let area=sarea.area;
              for (let keymap of area.getKeyMaps()) {
                  ret = test(keymap);
                  if (ret) {
                      return ret;
                  }
              }
          }
      }
      return undefined;
    }
     addEventListener(type, cb, options) {
      if (type==="resize") {
          this._resize_callbacks.push(cb);
      }
      else {
        return super.addEventListener(type, cb, options);
      }
    }
     removeEventListener(type, cb, options) {
      if (type==="resize") {
          if (this._resize_callbacks.indexOf(cb)>=0)
            this._resize_callbacks.remove(cb);
      }
      else {
        return super.removeEventListener(type, cb, options);
      }
    }
     execKeyMap(e) {
      let handled=false;
      if (window.DEBUG&&window.DEBUG.keymap) {
          console.warn("execKeyMap called", e.keyCode, document.activeElement.tagName);
      }
      if (this.sareas.active) {
          let area=this.sareas.active.area;
          if (!area) {
              return ;
          }
          area.push_ctx_active();
          for (let keymap of area.getKeyMaps()) {
              if (keymap===undefined) {
                  continue;
              }
              if (keymap.handle(area.ctx, e)) {
                  handled = true;
                  break;
              }
          }
          area.pop_ctx_active();
      }
      handled = handled||this.keymap.handle(this.ctx, e);
      if (!handled&&this.testAllKeyMaps) {
          for (let sarea of this.sareas) {
              if (handled) {
                  break;
              }
              sarea.area.push_ctx_active();
              for (let keymap of sarea.area.getKeyMaps()) {
                  if (keymap.handle(sarea.area.ctx, e)) {
                      handled = true;
                      break;
                  }
              }
              sarea.area.pop_ctx_active();
          }
      }
      return handled;
    }
     calcTabOrder() {
      let nodes=[];
      let visit={};
      let rec=(n) =>        {
        let bad=n.tabIndex<0||n.tabIndex===undefined||n.tabIndex===null;
        bad = bad||!(__instance_of(n, UIBase));
        if (n._id in visit||n.hidden) {
            return ;
        }
        visit[n._id] = 1;
        if (!bad) {
            n.__pos = n.getClientRects()[0];
            if (n.__pos) {
                nodes.push(n);
            }
        }
        n._forEachChildWidget((n2) =>          {
          rec(n2);
        });
      };
      for (let sarea of this.sareas) {
          rec(sarea);
      }
      for (let popup of this._popups) {
          rec(popup);
      }
      for (let i=0; i<nodes.length; i++) {
          let n=nodes[i];
          n.tabIndex = i+1;
      }
    }
     drawUpdate() {
      if (window.redraw_all!==undefined) {
          window.redraw_all();
      }
    }
     update() {
      let move=[];
      for (let child of this.childNodes) {
          if (__instance_of(child, ScreenArea)) {
              move.push(child);
          }
      }
      for (let child of move) {
          console.warn("moved screen area to shadow");
          HTMLElement.prototype.remove.call(child);
          this.shadow.appendChild(child);
      }
      if (this._do_updateSize) {
          this.updateSize();
      }
      if (this.needsTabRecalc) {
          this.needsTabRecalc = false;
          this.calcTabOrder();
      }
      outer: for (let sarea of this.sareas) {
          for (let b of sarea._borders) {
              let movable=this.isBorderMovable(b);
              if (movable!==b.movable) {
                  console.log("detected change in movable borders");
                  this.regenBorders();
                  break outer;
              }
          }
      }
      if (this._update_gen) {
          let ret;
          try {
            ret = this._update_gen.next();
          }
          catch (error) {
              if (!(__instance_of(error, DataPathError))) {
                  util.print_stack(error);
                  console.log("error in update_intern tasklet");
              }
              return ;
          }
          if (ret!==undefined&&ret.done) {
              this._update_gen = undefined;
          }
      }
      else {
        this._update_gen = this.update_intern();
      }
    }
     purgeUpdateStack() {
      this._update_gen = undefined;
      purgeUpdateStack();
    }
     completeSetCSS() {
      let rec=(n) =>        {
        n.setCSS();
        if (n.packflag&PackFlags.NO_UPDATE) {
            return ;
        }
        n._forEachChildWidget((c) =>          {
          rec(c);
        });
      };
      rec(this);
    }
     completeUpdate() {
      for (let step of this.update_intern()) {

      }
    }
     updateScrollStyling() {
      let s=theme.scrollbars;
      if (!s||!s.color)
        return ;
      let key=""+s.color+":"+s.color2+":"+s.border+":"+s.contrast+":"+s.width;
      if (key!==this._last_scrollstyle_key) {
          this._last_scrollstyle_key = key;
          this.mergeGlobalCSS(styleScrollBars(s.color, s.color2, s.contrast, s.width, s.border, "*"));
      }
    }
     update_intern() {
      this.updateScrollStyling();
      let popups=this._popups;
      let cssText="";
      let sheet=this.globalCSS.sheet;
      if (sheet) {
          for (let rule of sheet.rules) {
              cssText+=rule.cssText+"\n";
          }
          window.cssText = cssText;
      }
      let cssTextHash=util.strhash(cssText);
      if (this.needsBorderRegen) {
          this.needsBorderRegen = false;
          this.regenBorders();
      }
      super.update();
      let this2=this;
      for (let sarea of this.sareas) {
          if (!sarea.ctx) {
              sarea.ctx = this.ctx;
          }
      }
      return (function* () {
        let stack=update_stack;
        stack.cur = 0;
        let lastn=this2;
        function push(n) {
          stack[stack.cur++] = n;
        }
        function pop(n) {
          if (stack.cur<0) {
              throw new Error("Screen.update(): stack overflow!");
          }
          return stack[--stack.cur];
        }
        let ctx=this2.ctx;
        let SCOPE_POP=Symbol("pop");
        let AREA_CTX_POP=Symbol("pop2");
        let scopestack=[];
        let areastack=[];
        let t=util.time_ms();
        push(this2);
        for (let p of popups) {
            push(p);
        }
        while (stack.cur>0) {
          let n=pop();
          if (n===undefined) {
              continue;
          }
          else 
            if (n===SCOPE_POP) {
              scopestack.pop();
              continue;
          }
          else 
            if (n===AREA_CTX_POP) {
              areastack.pop().pop_ctx_active(ctx, true);
              continue;
          }
          if (__instance_of(n, Area)) {
              areastack.push(n);
              n.push_ctx_active(ctx, true);
              push(AREA_CTX_POP);
          }
          if (!n.hidden&&n!==this2&&__instance_of(n, UIBase)) {
              if (!n._ctx) {
                  n._ctx = ctx;
              }
              if (n._screenStyleUpdateHash!==cssTextHash) {
                  n._screenStyleTag.textContent = cssText;
                  n._screenStyleUpdateHash = cssTextHash;
              }
              if (scopestack.length>0&&scopestack[scopestack.length-1]) {
                  n.parentWidget = scopestack[scopestack.length-1];
              }
              n.update();
          }
          if (util.time_ms()-t>20) {
              yield ;
              t = util.time_ms();
          }
          for (let n2 of n.childNodes) {
              if (!(__instance_of(n2, UIBase))||!(n2.packflag&PackFlags.NO_UPDATE)) {
                  push(n2);
              }
          }
          if (n.shadow===undefined) {
              continue;
          }
          for (let n2 of n.shadow.childNodes) {
              if (!(__instance_of(n2, UIBase))||!(n2.packflag&PackFlags.NO_UPDATE)) {
                  push(n2);
              }
          }
          if (__instance_of(n, UIBase)) {
              if (!(n.packflag&PackFlags.NO_UPDATE)) {
                  scopestack.push(n);
                  push(SCOPE_POP);
              }
          }
        }
      })();
    }
     loadFromVerts() {
      let old=[0, 0];
      for (let sarea of this.sareas) {
          old[0] = sarea.size[0];
          old[1] = sarea.size[1];
          sarea.loadFromVerts();
          sarea.on_resize(old);
          sarea.setCSS();
      }
      this.setCSS();
    }
     collapseArea(sarea, border) {
      let sarea2;
      if (!border) {
          for (let b of sarea._borders) {
              let sarea2=b.getOtherSarea(sarea);
              if (sarea2&&!b.locked) {
                  border = b;
                  break;
              }
          }
      }
      else 
        if (border.locked) {
          console.warn("Cannot remove screen border");
      }
      console.warn("SAREA2", border, sarea2, sarea2!==sarea);
      if (border) {
          sarea2 = border.getOtherSarea(sarea);
          if (!sarea2) {
              console.error("Error merging sarea");
              return ;
          }
          let size1=new Vector2(sarea.pos).add(sarea.size);
          let size2=new Vector2(sarea2.pos).add(sarea2.size);
          sarea2.pos.min(sarea.pos);
          sarea2.size.load(size1).max(size2).sub(sarea2.pos);
          sarea2.loadFromPosSize();
      }
      this.sareas.remove(sarea);
      sarea.remove();
      this.regenScreenMesh();
      this._internalRegenAll();
      return this;
    }
     splitArea(sarea, t=0.5, horiz=true) {
      let w=sarea.size[0], h=sarea.size[1];
      let x=sarea.pos[0], y=sarea.size[1];
      let s1, s2;
      if (!horiz) {
          s1 = sarea;
          if (s1.ctx===undefined) {
              s1.ctx = this.ctx;
          }
          s2 = s1.copy(this);
          s1.size[0]*=t;
          s2.size[0]*=(1.0-t);
          s2.pos[0]+=w*t;
      }
      else {
        s1 = sarea;
        if (s1.ctx===undefined) {
            s1.ctx = this.ctx;
        }
        s2 = s1.copy(this);
        s1.size[1]*=t;
        s2.size[1]*=(1.0-t);
        s2.pos[1]+=h*t;
      }
      s2.ctx = this.ctx;
      this.appendChild(s2);
      s1.on_resize(s1.size);
      s2.on_resize(s2.size);
      this.regenBorders();
      this.solveAreaConstraints();
      s1.setCSS();
      s2.setCSS();
      this.setCSS();
      if (s2.area!==undefined)
        s2.area.onadd();
      return s2;
    }
     setCSS() {
      if (!this.getBoolAttribute("inherit-scale")) {
          this.style["width"] = this.size[0]+"px";
          this.style["height"] = this.size[1]+"px";
      }
      this.style["overflow"] = "hidden";
      for (let key in this._edgemap) {
          let b=this._edgemap[key];
          b.setCSS();
      }
    }
     regenScreenMesh(snapLimit=SnapLimit) {
      this.snapLimit = snapLimit;
      this.regenBorders();
    }
     regenBorders_stage2() {
      for (let b of this.screenborders) {
          b.halfedges = [];
      }
      function hashHalfEdge(border, sarea) {
        return border._id+":"+sarea._id;
      }
      function has_he(border, border2, sarea) {
        for (let he of border.halfedges) {
            if (border2===he.border&&sarea===he.sarea) {
                return true;
            }
        }
        return false;
      }
      for (let b1 of this.screenborders) {
          for (let sarea of b1.sareas) {
              let he=new ScreenHalfEdge(b1, sarea);
              b1.halfedges.push(he);
          }
          let axis=b1.horiz ? 1 : 0;
          let min=Math.min(b1.v1[axis], b1.v2[axis]);
          let max=Math.max(b1.v1[axis], b1.v2[axis]);
          for (let b2 of this.walkBorderLine(b1)) {
              if (b1===b2) {
                  continue;
              }
              let ok=b2.v1[axis]>=min&&b2.v1[axis]<=max;
              ok = ok||(b2.v2[axis]>=min&&b2.v2[axis]<=max);
              for (let sarea of b2.sareas) {
                  let ok2=ok&&!has_he(b2, b1, sarea);
                  if (ok2) {
                      let he2=new ScreenHalfEdge(b2, sarea);
                      b1.halfedges.push(he2);
                  }
              }
          }
      }
      for (let b of this.screenborders) {
          let movable=true;
          for (let sarea of b.sareas) {
              movable = movable&&this.isBorderMovable(b);
          }
          b.movable = movable;
      }
    }
     hasBorder(b) {
      return b._id in this._idmap;
    }
     killScreenVertex(v) {
      this.screenverts.remove(v);
      delete this._edgemap[ScreenVert.hash(v, undefined, this.snapLimit)];
      delete this._idmap[v._id];
      return this;
    }
     freeBorder(b, sarea) {
      if (b.sareas.indexOf(sarea)>=0) {
          b.sareas.remove(sarea);
      }
      let dels=[];
      for (let he of b.halfedges) {
          if (he.sarea===sarea) {
              dels.push([b, he]);
          }
          for (let he2 of he.border.halfedges) {
              if (he2===he)
                continue;
              if (he2.sarea===sarea) {
                  dels.push([he.border, he2]);
              }
          }
      }
      for (let d of dels) {
          if (d[0].halfedges.indexOf(d[1])<0) {
              console.warn("Double remove detected; use util.set?");
              continue;
          }
          d[0].halfedges.remove(d[1]);
      }
      if (b.sareas.length===0) {
          this.killBorder(b);
      }
    }
     killBorder(b) {
      console.log("killing border", b._id, b);
      if (this.screenborders.indexOf(b)<0) {
          console.log("unknown border", b);
          b.remove();
          return ;
      }
      this.screenborders.remove(b);
      let del=[];
      for (let he of b.halfedges) {
          if (he===he2)
            continue;
          for (let he2 of he.border.halfedges) {
              if (he2.border===b) {
                  del.push([he.border, he2]);
              }
          }
      }
      for (let d of del) {
          d[0].halfedges.remove(d[1]);
      }
      delete this._edgemap[ScreenBorder.hash(b.v1, b.v2)];
      delete this._idmap[b._id];
      b.v1.borders.remove(b);
      b.v2.borders.remove(b);
      if (b.v1.borders.length===0) {
          this.killScreenVertex(b.v1);
      }
      if (b.v2.borders.length===0) {
          this.killScreenVertex(b.v2);
      }
      b.remove();
      return this;
    }
     regenBorders() {
      for (let b of this.screenborders) {
          b.remove();
      }
      this._idmap = {};
      this.screenborders = [];
      this._edgemap = {};
      this._vertmap = {};
      this.screenverts = [];
      for (let sarea of this.sareas) {
          if (sarea.hidden)
            continue;
          sarea.makeBorders(this);
      }
      for (let key in this._edgemap) {
          let b=this._edgemap[key];
          b.setCSS();
      }
      this.regenBorders_stage2();
      this._recalcAABB();
      for (let b of this.screenborders) {
          b.outer = this.isBorderOuter(b);
          b.movable = this.isBorderMovable(b);
          b.setCSS();
      }
      this.updateDebugBoxes();
    }
     _get_debug_overlay() {
      if (!this._debug_overlay) {
          this._debug_overlay = UIBase.createElement("overdraw-x");
          let s=this._debug_overlay;
          s.startNode(this, this);
      }
      return this._debug_overlay;
    }
     updateDebugBoxes() {
      if (cconst.DEBUG.screenborders) {
          let overlay=this._get_debug_overlay();
          overlay.clear();
          for (let b of this.screenborders) {
              overlay.line(b.v1, b.v2, "red");
          }
          let del=[];
          for (let child of document.body.childNodes) {
              if (child.getAttribute&&child.getAttribute("class")==="__debug") {
                  del.push(child);
              }
          }
          for (let n of del) {
              n.remove();
          }
          let box=(x, y, s, text, color) =>            {
            if (color===undefined) {
                color = "red";
            }
            x-=s*0.5;
            y-=s*0.5;
            x = Math.min(Math.max(x, 0.0), this.size[0]-s);
            y = Math.min(Math.max(y, 0.0), this.size[1]-s);
            let ret=UIBase.createElement("div");
            ret.setAttribute("class", "__debug");
            ret.style["position"] = UIBase.PositionKey;
            ret.style["left"] = x+"px";
            ret.style["top"] = y+"px";
            ret.style["height"] = s+"px";
            ret.style["width"] = s+"px";
            ret.style["z-index"] = "1000";
            ret.style["pointer-events"] = "none";
            ret.style["padding"] = ret.style["margin"] = "0px";
            ret.style['display'] = "float";
            ret.style["background-color"] = color;
            document.body.appendChild(ret);
            let colors=["orange", "black", "white"];
            for (let i=2; i>=0; i--) {
                ret = UIBase.createElement("div");
                ret.setAttribute("class", "__debug");
                ret.style["position"] = UIBase.PositionKey;
                ret.style["left"] = x+"px";
                ret.style["top"] = y+"px";
                ret.style["height"] = s+"px";
                ret.style["width"] = "250px";
                ret.style["z-index"] = ""+(1005-i-1);
                ret.style["pointer-events"] = "none";
                ret.style["color"] = colors[i];
                let w=(i)*2;
                ret.style["-webkit-text-stroke-width"] = w+"px";
                ret.style["-webkit-text-stroke-color"] = colors[i];
                ret.style["text-stroke-width"] = w+"px";
                ret.style["text-stroke-color"] = colors[i];
                ret.style["padding"] = ret.style["margin"] = "0px";
                ret.style['display'] = "float";
                ret.style["background-color"] = "rgba(0,0,0,0)";
                ret.innerText = ""+text;
                document.body.appendChild(ret);
            }
          };
          for (let v of this.screenverts) {
              box(v[0], v[1], 10*v.borders.length, ""+v.borders.length, "rgba(255,0,0,0.5)");
          }
          for (let b of this.screenborders) {
              for (let he of b.halfedges) {
                  let txt=`${he.side}, ${b.sareas.length}, ${b.halfedges.length}`;
                  let p=new Vector2(b.v1).add(b.v2).mulScalar(0.5);
                  let size=10*b.halfedges.length;
                  let wadd=25+size*0.5;
                  let axis=b.horiz&1;
                  if (p[axis]>he.sarea.pos[axis]) {
                      p[axis]-=wadd;
                  }
                  else {
                    p[axis]+=wadd;
                  }
                  box(p[0], p[1], size, txt, "rgba(155,255,75,0.5)");
              }
          }
      }
    }
     checkAreaConstraint(sarea, checkOnly=false) {
      let min=sarea.minSize, max=sarea.maxSize;
      let vs=sarea._verts;
      let chg=0.0;
      let mask=0;
      let moveBorder=(sidea, sideb, dh) =>        {
        let b1=sarea._borders[sidea];
        let b2=sarea._borders[sideb];
        let bad=0;
        for (let i=0; i<2; i++) {
            let b=i ? b2 : b1;
            let bad2=sarea.borderLock&(1<<sidea);
            bad2 = bad2||!b.movable;
            bad2 = bad2||this.isBorderOuter(b);
            if (bad2)
              bad|=1<<i;
        }
        if (bad===0) {
            this.moveBorder(b1, dh*0.5);
            this.moveBorder(b2, -dh*0.5);
        }
        else 
          if (bad===1) {
            this.moveBorder(b2, -dh);
        }
        else 
          if (bad===2) {
            this.moveBorder(b1, dh);
        }
        else 
          if (bad===3) {
            if (!this.isBorderOuter(b1)) {
                this.moveBorder(b1, dh);
            }
            else 
              if (!this.isBorderOuter(b2)) {
                this.moveBorder(b2, -dh);
            }
            else {
              this.moveBorder(b1, dh*0.5);
              this.moveBorder(b2, -dh*0.5);
            }
        }
      };
      if (max[0]!==undefined&&sarea.size[0]>max[0]) {
          let dh=(sarea.size[0]-max[0]);
          chg+=Math.abs(dh);
          mask|=1;
          moveBorder(0, 2, dh);
      }
      if (min[0]!==undefined&&sarea.size[0]<min[0]) {
          let dh=(min[0]-sarea.size[0]);
          chg+=Math.abs(dh);
          mask|=2;
          moveBorder(2, 0, dh);
      }
      if (max[1]!==undefined&&sarea.size[1]>max[1]) {
          let dh=(sarea.size[1]-max[1]);
          chg+=Math.abs(dh);
          mask|=4;
          moveBorder(3, 1, dh);
      }
      if (min[1]!==undefined&&sarea.size[1]<min[1]) {
          let dh=(min[1]-sarea.size[1]);
          chg+=Math.abs(dh);
          mask|=8;
          moveBorder(1, 3, dh);
      }
      if (sarea.pos[0]+sarea.size[0]>this.size[0]) {
          mask|=16;
          let dh=((this.size[0]-sarea.size[0])-sarea.pos[0]);
          chg+=Math.abs(dh);
          if (sarea.floating) {
              sarea.pos[0] = this.size[0]-sarea.size[0];
              sarea.loadFromPosSize();
          }
          else {
            this.moveBorder(sarea._borders[0], dh);
            this.moveBorder(sarea._borders[2], dh);
          }
      }
      if (chg===0.0) {
          return false;
      }
      return mask;
    }
     walkBorderLine(b) {
      let visit=new util.set();
      let ret=[b];
      visit.add(b);
      let rec=(b, v) =>        {
        for (let b2 of v.borders) {
            if (b2===b) {
                continue;
            }
            if (b2.horiz===b.horiz&&!visit.has(b2)) {
                visit.add(b2);
                ret.push(b2);
                rec(b2, b2.otherVertex(v));
            }
        }
      };
      rec(b, b.v1);
      let ret2=ret;
      ret = [];
      rec(b, b.v2);
      ret2.reverse();
      return ret2.concat(ret);
    }
     moveBorderWithoutVerts(halfedge, df) {
      let side=halfedge.side;
      let sarea=halfedge.sarea;
      switch (side) {
        case 0:
          sarea.pos[0]+=df;
          sarea.size[0]-=df;
          break;
        case 1:
          sarea.size[1]+=df;
          break;
        case 2:
          sarea.size[0]+=df;
          break;
        case 3:
          sarea.pos[1]+=df;
          sarea.size[1]-=df;
          break;
      }
    }
     moveBorder(b, df, strict=true) {
      return this.moveBorderSimple(b, df, strict);
    }
     moveBorderSimple(b, df, strict=true) {
      let axis=b.horiz&1;
      let axis2=axis^1;
      let min=Math.min(b.v1[axis2], b.v2[axis2]);
      let max=Math.max(b.v1[axis2], b.v2[axis2]);
      let test=(v) =>        {
        return v[axis2]>=min&&v[axis2]<=max;
      };
      let vs=new util.set();
      for (let b2 of this.walkBorderLine(b)) {
          if (strict&&!test(b2.v1)&&!test(b2.v2)) {
              return false;
          }
          vs.add(b2.v1);
          vs.add(b2.v2);
      }
      for (let v of vs) {
          v[axis]+=df;
      }
      for (let v of vs) {
          for (let b of v.borders) {
              for (let sarea of b.sareas) {
                  sarea.loadFromVerts();
              }
          }
      }
      return true;
    }
     moveBorderUnused(b, df, strict=true) {
      if (!b) {
          console.warn("missing border");
          return false;
      }
      let axis=b.horiz&1;
      let vs=new util.set();
      let visit=new util.set();
      let axis2=axis^1;
      let min=Math.min(b.v1[axis2], b.v2[axis2]);
      let max=Math.max(b.v1[axis2], b.v2[axis2]);
      let test=(v) =>        {
        return v[axis2]>=min&&v[axis2]<=max;
      };
      let first=true;
      let found=false;
      let halfedges=new util.set();
      let borders=new util.set();
      for (let b2 of this.walkBorderLine(b)) {
          if (!strict) {
              vs.add(b2.v1);
              vs.add(b2.v2);
              continue;
          }
          let t1=test(b2.v1), t2=test(b2.v2);
          if (!t1||!t2) {
              found = true;
              if (first) {
                  first = false;
                  df = Math.max(Math.abs(df), FrameManager_mesh.SnapLimit)*Math.sign(df);
              }
          }
          if (!t1&&!t2) {
              continue;
          }
          borders.add(b2);
          for (let sarea of b2.sareas) {
              halfedges.add(new ScreenHalfEdge(b2, sarea));
          }
          vs.add(b2.v1);
          vs.add(b2.v2);
      }
      for (let b2 of this.walkBorderLine(b)) {
          if (borders.has(b2)) {
              continue;
          }
          for (let he of b2.halfedges) {
              borders.remove(he.border);
              if (halfedges.has(he)) {
                  halfedges.remove(he);
              }
          }
      }
      for (let v of vs) {
          let ok=v[axis2]>=min&&v[axis2]<=max;
          if (!ok&&strict) {
          }
      }
      if (!found||!strict) {
          for (let v of vs) {
              v[axis]+=df;
          }
      }
      else {
        let borders=new util.set();
        for (let he of halfedges) {
            borders.add(he.border);
            this.moveBorderWithoutVerts(he, df);
        }
        for (let he of halfedges) {
            he.sarea.loadFromPosSize();
        }
        for (let b of borders) {
            let sareas=b.sareas.slice(0, b.sareas.length);
            this.killBorder(b);
            for (let sarea of sareas) {
                sarea.loadFromPosSize();
            }
        }
        return halfedges.length>0;
      }
      for (let sarea of b.sareas) {
          sarea.loadFromVerts();
      }
      for (let he of b.halfedges) {
          he.sarea.loadFromVerts();
          for (let sarea of he.border.sareas) {
              sarea.loadFromVerts();
              for (let b2 of sarea._borders) {
                  b2.setCSS();
              }
          }
      }
      b.setCSS();
      return true;
    }
     solveAreaConstraints(snapArgument=true) {
      let repeat=false;
      let found=false;
      let time=util.time_ms();
      for (let i=0; i<10; i++) {
          repeat = false;
          for (let sarea of this.sareas) {
              if (sarea.hidden)
                continue;
              repeat = repeat||this.checkAreaConstraint(sarea);
          }
          found = found||repeat;
          if (repeat) {
              for (let sarea of this.sareas) {
                  sarea.loadFromVerts();
              }
              this.snapScreenVerts(snapArgument);
          }
          else {
            break;
          }
      }
      if (found) {
          this.snapScreenVerts(snapArgument);
          if (cconst.DEBUG.areaConstraintSolver) {
              time = util.time_ms()-time;
              console.log(`enforced area constraint ${time.toFixed(2)}ms`);
          }
          this._recalcAABB();
          this.setCSS();
      }
    }
     snapScreenVerts(fitToSize=true) {
      let this2=this;
      function* screenverts() {
        for (let v of this2.screenverts) {
            let ok=0;
            for (let sarea of v.sareas) {
                if (!(sarea.flag&AreaFlags.INDEPENDENT)) {
                    ok = 1;
                }
            }
            if (ok) {
                yield v;
            }
        }
      }
      let mm=new math.MinMax(2);
      for (let v of screenverts()) {
          mm.minmax(v);
      }
      let min=mm.min, max=mm.max;
      if (fitToSize) {
          let vec=new Vector2(max).sub(min);
          let sz=new Vector2(this.size);
          sz.div(vec);
          for (let v of screenverts()) {
              v.sub(min).mul(sz);
          }
          for (let v of screenverts()) {
              v[0]+=this.pos[0];
              v[1]+=this.pos[1];
          }
      }
      else {
        for (let v of screenverts()) {

        }
        [min, max] = this._recalcAABB();
        this.size.load(max).sub(min);
      }
      let found=1;
      for (let sarea of this.sareas) {
          if (sarea.hidden)
            continue;
          let old=new Vector2(sarea.size);
          let oldpos=new Vector2(sarea.pos);
          sarea.loadFromVerts();
          found = found||old.vectorDistance(sarea.size)>1;
          found = found||oldpos.vectorDistance(sarea.pos)>1;
          sarea.on_resize(old);
      }
      if (found) {
          this._recalcAABB();
          this.setCSS();
      }
    }
     on_resize(oldsize, newsize=this.size, _set_key=true) {
      if (_set_key) {
          this._last_ckey1 = this._calcSizeKey(newsize[0], newsize[1], this.pos[0], this.pos[1], devicePixelRatio, visualViewport.scale);
      }
      let ratio=[newsize[0]/oldsize[0], newsize[1]/oldsize[1]];
      let offx=this.pos[0]-this.oldpos[0];
      let offy=this.pos[1]-this.oldpos[1];
      this.oldpos.load(this.pos);
      for (let v of this.screenverts) {
          v[0]*=ratio[0];
          v[1]*=ratio[1];
          v[0]+=offx;
          v[1]+=offy;
      }
      let min=[1e+17, 1e+17], max=[-1e+17, -1e+17];
      let olds=[];
      for (let sarea of this.sareas) {
          olds.push([sarea.size[0], sarea.size[1]]);
          sarea.loadFromVerts();
      }
      this.size[0] = newsize[0];
      this.size[1] = newsize[1];
      this.snapScreenVerts();
      this.solveAreaConstraints();
      this._recalcAABB();
      let i=0;
      for (let sarea of this.sareas) {
          sarea.on_resize(sarea.size, olds[i]);
          sarea.setCSS();
          i++;
      }
      this.regenBorders();
      this.setCSS();
      this.calcTabOrder();
      this._fireResizeCB(oldsize);
    }
     _fireResizeCB(oldsize=this.size) {
      for (let cb of this._resize_callbacks) {
          cb(oldsize);
      }
    }
     getScreenVert(pos, added_id="", floating=false) {
      let key=ScreenVert.hash(pos, added_id, this.snapLimit);
      if (floating||!(key in this._vertmap)) {
          let v=new ScreenVert(pos, this.idgen++, added_id);
          this._vertmap[key] = v;
          this._idmap[v._id] = v;
          this.screenverts.push(v);
      }
      return this._vertmap[key];
    }
     isBorderOuter(border) {
      let sides=0;
      for (let he of border.halfedges) {
          sides|=1<<he.side;
      }
      let bits=0;
      for (let i=0; i<4; i++) {
          bits+=(sides&(1<<i)) ? 1 : 0;
      }
      let ret=bits<2;
      let floating=false;
      for (let sarea of border.sareas) {
          floating = floating||sarea.floating;
      }
      if (floating) {
          let axis=border.horiz ? 1 : 0;
          ret = Math.abs(border.v1[axis]-this.pos[axis])<4;
          ret = ret||Math.abs(border.v1[axis]-this.pos[axis]-this.size[axis])<4;
      }
      border.outer = ret;
      return ret;
    }
     isBorderMovable(b, limit=5) {
      if (this.allBordersMovable)
        return true;
      for (let he of b.halfedges) {
          if (he.sarea.borderLock&(1<<he.side)) {
              return false;
          }
      }
      let ok=!this.isBorderOuter(b);
      for (let sarea of b.sareas) {
          if (sarea.floating) {
              ok = true;
              break;
          }
      }
      return ok;
    }
     getScreenBorder(sarea, v1, v2, side) {
      let suffix=sarea._get_v_suffix();
      if (!(__instance_of(v1, ScreenVert))) {
          v1 = this.getScreenVert(v1, suffix);
      }
      if (!(__instance_of(v2, ScreenVert))) {
          v2 = this.getScreenVert(v2, suffix);
      }
      let hash=ScreenBorder.hash(v1, v2);
      if (!(hash in this._edgemap)) {
          let sb=this._edgemap[hash] = UIBase.createElement("screenborder-x");
          sb._hash = hash;
          sb.screen = this;
          sb.v1 = v1;
          sb.v2 = v2;
          sb._id = this.idgen++;
          v1.borders.push(sb);
          v2.borders.push(sb);
          sb.ctx = this.ctx;
          this.screenborders.push(sb);
          this.appendChild(sb);
          sb.setCSS();
          this._edgemap[hash] = sb;
          this._idmap[sb._id] = sb;
      }
      return this._edgemap[hash];
    }
     minmaxArea(sarea, mm=undefined) {
      if (mm===undefined) {
          mm = new math.MinMax(2);
      }
      for (let b of sarea._borders) {
          mm.minmax(b.v1);
          mm.minmax(b.v2);
      }
      return mm;
    }
     areasBorder(sarea1, sarea2) {
      for (let b of sarea1._borders) {
          for (let sa of b.sareas) {
              if (sa===sarea2)
                return true;
          }
      }
      return false;
    }
     replaceArea(dst, src) {
      if (dst===src)
        return ;
      src.pos[0] = dst.pos[0];
      src.pos[1] = dst.pos[1];
      src.size[0] = dst.size[0];
      src.size[1] = dst.size[1];
      src.floating = dst.floating;
      src._borders = dst._borders;
      src._verts = dst._verts;
      if (this.sareas.indexOf(src)<0) {
          this.sareas.push(src);
          this.shadow.appendChild(src);
      }
      if (this.sareas.active===dst) {
          this.sareas.active = src;
      }
      this.sareas.remove(dst);
      dst.remove();
      this.regenScreenMesh();
      this.snapScreenVerts();
      this._updateAll();
    }
     _internalRegenAll() {
      this.snapScreenVerts();
      this._recalcAABB();
      this.calcTabOrder();
      this.setCSS();
      this.completeUpdate();
      this.completeSetCSS();
      this.completeUpdate();
    }
     _updateAll() {
      for (let sarea of this.sareas) {
          sarea.setCSS();
      }
      this.setCSS();
      this.update();
    }
     removeArea(sarea) {
      if (this.sareas.indexOf(sarea)<0) {
          console.warn(sarea, "<- Warning: tried to remove unknown area");
          return ;
      }
      this.sareas.remove(sarea);
      sarea.remove();
      for (let i=0; i<2; i++) {
          this.snapScreenVerts();
          this.regenScreenMesh();
      }
      this._updateAll();
      this.drawUpdate();
    }
     appendChild(child) {
      if (__instance_of(child, ScreenArea.ScreenArea)) {
          child.screen = this;
          child.ctx = this.ctx;
          child.parentWidget = this;
          this.sareas.push(child);
          if (child.size.dot(child.size)===0) {
              child.size[0] = this.size[0];
              child.size[1] = this.size[1];
          }
          if (!child._has_evts) {
              child._has_evts = true;
              let onfocus=(e) =>                {
                this.sareas.active = child;
              };
              let onblur=(e) =>                {              };
              child.addEventListener("focus", onfocus);
              child.addEventListener("mouseenter", onfocus);
              child.addEventListener("blur", onblur);
              child.addEventListener("mouseleave", onblur);
          }
          this.regenBorders();
          child.setCSS();
          this.drawUpdate();
          child._init();
      }
      return this.shadow.appendChild(child);
    }
     add(child) {
      return this.appendChild(child);
    }
     hintPickerTool() {
      (new FrameManager_ops.ToolTipViewer(this)).start();
    }
     removeAreaTool(border) {
      let tool=new FrameManager_ops.RemoveAreaTool(this, border);
      tool.start();
    }
     moveAttachTool(sarea, mpos=this.mpos, elem, pointerId) {
      let tool=new FrameManager_ops.AreaMoveAttachTool(this, sarea, mpos);
      tool.start(elem, pointerId);
    }
     splitTool() {
      let tool=new FrameManager_ops.SplitTool(this);
      tool.start();
    }
     areaDragTool(sarea=this.sareas.active) {
      if (sarea===undefined) {
          console.warn("no active screen area");
          return ;
      }
      let mpos=this.mpos;
      let tool=new FrameManager_ops.AreaDragTool(this, this.sareas.active, mpos);
      tool.start();
    }
     makeBorders() {
      for (let sarea of this.sareas) {
          sarea.makeBorders(this);
      }
    }
     cleanupBorders() {
      let del=new Set();
      for (let b of this.screenborders) {
          if (b.halfedges.length===0) {
              del.add(b);
          }
      }
      for (let b of del) {
          delete this._edgemap[b._hash];
          HTMLElement.prototype.remove.call(b);
      }
    }
     mergeBlankAreas() {
      for (let b of this.screenborders) {
          if (b.locked) {
              continue;
          }
          let blank, sarea;
          for (let he of b.halfedges) {
              if (!he.sarea.area) {
                  blank = he.sarea;
                  sarea = b.getOtherSarea(blank);
                  let axis=b.horiz^1;
                  if (blank&&sarea&&blank.size[axis]!==sarea.size[axis]) {
                      blank = sarea = undefined;
                  }
                  if (blank&&sarea) {
                      break;
                  }
                  else {
                    blank = undefined;
                    sarea = undefined;
                  }
              }
          }
          if (blank&&sarea&&blank!==sarea) {
              this.collapseArea(blank, b);
          }
      }
      this.cleanupBorders();
    }
     floatArea(area) {
      let sarea=area.parentWidget;
      if (sarea.floating) {
          return sarea;
      }
      sarea.editors.remove(area);
      delete sarea.editormap[area.constructor.define().areaname];
      sarea.area = undefined;
      HTMLElement.prototype.remove.call(area);
      let sarea2=UIBase.createElement("screenarea-x", true);
      sarea2.floating = true;
      sarea2.pos = new Vector2(sarea.pos);
      sarea2.pos.addScalar(5);
      sarea2.size = new Vector2(sarea.size);
      sarea2.editors.push(area);
      sarea2.editormap[area.constructor.define().areaname] = area;
      sarea2.shadow.appendChild(area);
      sarea2.area = area;
      area.push_ctx_active();
      area.pop_ctx_active();
      area.pos = sarea2.pos;
      area.size = sarea2.size;
      area.parentWidget = sarea2;
      area.owning_sarea = sarea2;
      sarea.flushSetCSS();
      sarea.flushUpdate();
      sarea2.flushSetCSS();
      sarea2.flushUpdate();
      this.appendChild(sarea2);
      if (sarea.editors.length>0) {
          let area2=sarea.editors[0];
          sarea.switch_editor(area2.constructor);
          sarea.flushSetCSS();
          sarea.flushUpdate();
      }
      sarea2.loadFromPosSize();
      sarea2.bringToFront();
      this.mergeBlankAreas();
      this.cleanupBorders();
      return sarea2;
    }
     on_keydown(e) {
      if (checkForTextBox(this, this.mpos[0], this.mpos[1])) {
          console.log("textbox detected");
          return ;
      }
      if (!haveModal()&&this.execKeyMap(e)) {
          e.preventDefault();
          return ;
      }
      if (!haveModal()&&this.sareas.active!==undefined&&this.sareas.active.on_keydown) {
          let area=this.sareas.active;
          return this.sareas.active.on_keydown(e);
      }
    }
     on_keyup(e) {
      if (!haveModal()&&this.sareas.active!==undefined&&this.sareas.active.on_keyup) {
          return this.sareas.active.on_keyup(e);
      }
    }
     on_keypress(e) {
      if (!haveModal()&&this.sareas.active!==undefined&&this.sareas.active.on_keypress) {
          return this.sareas.active.on_keypress(e);
      }
    }
     draw() {
      for (let sarea of this.sareas) {
          sarea.draw();
      }
    }
     afterSTRUCT() {
      for (let sarea of this.sareas) {
          sarea._ctx = this.ctx;
          sarea.afterSTRUCT();
      }
    }
     loadSTRUCT(reader) {
      this.clear();
      reader(this);
      this.size = new Vector2(this.size);
      let sareas=this.sareas;
      this.sareas = [];
      for (let sarea of sareas) {
          sarea.screen = this;
          sarea.parentWidget = this;
          this.appendChild(sarea);
      }
      this.regenBorders();
      this.setCSS();
      this.doOnce(() =>        {
        this.loadUIData(this.uidata);
        this.uidata = undefined;
      });
      return this;
    }
     test_struct(appstate=_appstate) {
      let data=[];
      nstructjs.manager.write_object(data, this);
      data = new DataView(new Uint8Array(data).buffer);
      let screen2=nstructjs.manager.read_object(data, this.constructor);
      screen2.ctx = this.ctx;
      for (let sarea of screen2.sareas) {
          sarea.screen = screen2;
          sarea.ctx = this.ctx;
          sarea.area.ctx = this.ctx;
      }
      let parent=this.parentElement;
      this.remove();
      appstate.screen = screen2;
      parent.appendChild(screen2);
      screen2.regenBorders();
      screen2.update();
      screen2.listen();
      screen2.doOnce(() =>        {
        screen2.on_resize(screen2.size, [window.innerWidth, window.innerHeight]);
      });
      console.log(data);
      return screen2;
    }
     saveUIData() {
      try {
        return ui_base.saveUIData(this, "screen");
      }
      catch (error) {
          util.print_stack(error);
          console.log("Failed to save UI state data");
      }
    }
     loadUIData(str) {
      try {
        ui_base.loadUIData(this, str);
      }
      catch (error) {
          util.print_stack(error);
          console.log("Failed to load UI state data");
      }
    }
  }
  _ESClass.register(Screen);
  _es6_module.add_class(Screen);
  Screen = _es6_module.add_export('Screen', Screen);
  Screen.STRUCT = `
pathux.Screen { 
  size  : vec2;
  pos   : vec2;
  sareas : array(pathux.ScreenArea);
  idgen : int;
  uidata : string | obj.saveUIData();
}
`;
  nstructjs.register(Screen);
  ui_base.UIBase.internalRegister(Screen);
  ScreenArea.setScreenClass(Screen);
  _setScreenClass(Screen);
  let get_screen_cb;
  let _on_keydown;
  let start_cbs=[];
  let stop_cbs=[];
  let keyboardDom=window;
  let key_event_opts;
  function startEvents(getScreenFunc) {
    get_screen_cb = getScreenFunc;
    if (_events_started) {
        return ;
    }
    _events_started = true;
    _on_keydown = (e) =>      {
      if (e.keyCode===keymap["Alt"]) {
          e.preventDefault();
      }
      let screen=get_screen_cb();
      return screen.on_keydown(e);
    }
    window.addEventListener("keydown", _on_keydown, key_event_opts);
    for (let cb of start_cbs) {
        cb();
    }
  }
  startEvents = _es6_module.add_export('startEvents', startEvents);
  function stopEvents() {
    window.removeEventListener("keydown", _on_keydown, key_event_opts);
    _on_keydown = undefined;
    _events_started = false;
    for (let cb of stop_cbs) {
        try {
          cb();
        }
        catch (error) {
            util.print_stack(error);
        }
    }
    return get_screen_cb;
  }
  stopEvents = _es6_module.add_export('stopEvents', stopEvents);
  function setKeyboardDom(dom) {
    let started=_events_started;
    if (started) {
        stopEvents();
    }
    keyboardDom = dom;
    if (started) {
        startEvents(get_screen_cb);
    }
  }
  setKeyboardDom = _es6_module.add_export('setKeyboardDom', setKeyboardDom);
  function setKeyboardOpts(opts) {
    key_event_opts = opts;
  }
  setKeyboardOpts = _es6_module.add_export('setKeyboardOpts', setKeyboardOpts);
  function _onEventsStart(cb) {
    start_cbs.push(cb);
  }
  _onEventsStart = _es6_module.add_export('_onEventsStart', _onEventsStart);
  function _onEventsStop(cb) {
    stop_cbs.push(cb);
  }
  _onEventsStop = _es6_module.add_export('_onEventsStop', _onEventsStop);
}, '/dev/fairmotion/src/path.ux/scripts/screen/FrameManager.js');


es6_module_define('FrameManager_mesh', ["../config/const.js", "../widgets/ui_menu.js", "./FrameManager_ops.js", "../core/ui_base.js", "../path-controller/util/simple_events.js", "../path-controller/util/vectormath.js", "../path-controller/util/struct.js"], function _FrameManager_mesh_module(_es6_module) {
  var nstructjs=es6_import_item(_es6_module, '../path-controller/util/struct.js', 'default');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var FrameManager_ops=es6_import(_es6_module, './FrameManager_ops.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var Vector2=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector2');
  var createMenu=es6_import_item(_es6_module, '../widgets/ui_menu.js', 'createMenu');
  var Menu=es6_import_item(_es6_module, '../widgets/ui_menu.js', 'Menu');
  var popModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'popModalLight');
  var pushModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'pushModalLight');
  const AreaFlags={HIDDEN: 1, 
   FLOATING: 2, 
   INDEPENDENT: 4, 
   NO_SWITCHER: 8, 
   NO_HEADER_CONTEXT_MENU: 16, 
   NO_COLLAPSE: 32}
  _es6_module.add_export('AreaFlags', AreaFlags);
  let SnapLimit=1;
  SnapLimit = _es6_module.add_export('SnapLimit', SnapLimit);
  const BORDER_ZINDEX_BASE=25;
  _es6_module.add_export('BORDER_ZINDEX_BASE', BORDER_ZINDEX_BASE);
  function snap(c, snap_limit) {
    if (snap_limit===undefined) {
        snap_limit = SnapLimit;
    }
    if (Array.isArray(c)) {
        for (let i=0; i<c.length; i++) {
            c[i] = Math.floor(c[i]/snap_limit)*snap_limit;
        }
    }
    else {
      c = Math.floor(c/snap_limit)*snap_limit;
    }
    return c;
  }
  snap = _es6_module.add_export('snap', snap);
  function snapi(c, snap_limit) {
    if (snap_limit===undefined) {
        snap_limit = SnapLimit;
    }
    if (Array.isArray(c)) {
        for (let i=0; i<c.length; i++) {
            c[i] = Math.ceil(c[i]/snap_limit)*snap_limit;
        }
    }
    else {
      c = Math.ceil(c/snap_limit)*snap_limit;
    }
    return c;
  }
  snapi = _es6_module.add_export('snapi', snapi);
  class ScreenVert extends Vector2 {
     constructor(pos, id, added_id) {
      super(pos);
      this.added_id = added_id;
      this.sareas = [];
      this.borders = [];
      this._id = id;
    }
    static  hash(pos, added_id, limit) {
      let x=snap(pos[0], limit);
      let y=snap(pos[1], limit);
      return ""+x+":"+y+": + added_id";
    }
     valueOf() {
      return ScreenVert.hash(this, this.added_id);
    }
     [Symbol.keystr]() {
      return ScreenVert.hash(this, this.added_id);
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(ScreenVert);
  _es6_module.add_class(ScreenVert);
  ScreenVert = _es6_module.add_export('ScreenVert', ScreenVert);
  ScreenVert.STRUCT = `
pathux.ScreenVert {
  0 : float;
  1 : float;
}
`;
  nstructjs.register(ScreenVert);
  class ScreenHalfEdge  {
     constructor(border, sarea) {
      this.sarea = sarea;
      this.border = border;
      this.side = sarea._side(border);
    }
    get  v1() {
      return this.border.v1;
    }
    get  v2() {
      return this.border.v2;
    }
     [Symbol.keystr]() {
      return this.sarea._id+":"+this.border._id;
    }
  }
  _ESClass.register(ScreenHalfEdge);
  _es6_module.add_class(ScreenHalfEdge);
  ScreenHalfEdge = _es6_module.add_export('ScreenHalfEdge', ScreenHalfEdge);
  class ScreenBorder extends ui_base.UIBase {
     constructor() {
      super();
      this.visibleToPick = false;
      this.screen = undefined;
      this.v1 = undefined;
      this.v2 = undefined;
      this._id = undefined;
      this._hash = undefined;
      this.outer = undefined;
      this.halfedges = [];
      this.sareas = [];
      this._innerstyle = document.createElement("style");
      this._style = undefined;
      this.shadow.appendChild(this._innerstyle);
      this.inner = document.createElement("div");
      this.shadow.appendChild(this.inner);
      let call_menu=ScreenBorder.bindBorderMenu(this);
      this.addEventListener("pointerdown", (e) =>        {
        let ok=this.movable;
        if (e.button===2) {
            call_menu(e);
            return ;
        }
        if (!ok) {
            console.log("border is not movable");
            return ;
        }
        let tool=new FrameManager_ops.AreaResizeTool(this.screen, this, [e.x, e.y]);
        tool.start();
        e.preventDefault();
        e.stopPropagation();
      }, {capture: true});
    }
    static  bindBorderMenu(elem, usePickElement=false) {
      let on_dblclick=(e) =>        {
        if (usePickElement&&elem.pickElement(e.x, e.y)!==elem) {
            return ;
        }
        let menu=[["Split Area", () =>          {
          elem.ctx.screen.splitTool();
        }], Menu.SEP, ["Collapse Area", () =>          {
          elem.ctx.screen.removeAreaTool(__instance_of(elem, ScreenBorder) ? elem : undefined);
        }]];
        menu = createMenu(elem.ctx, "", menu);
        menu.ignoreFirstClick = 2;
        elem.ctx.screen.popupMenu(menu, e.x-15, e.y-15);
        e.preventDefault();
        e.stopPropagation();
      };
      elem.addEventListener("contextmenu", (e) =>        {
        return e.preventDefault();
      });
      elem.addEventListener("dblclick", on_dblclick, {capture: true});
      return on_dblclick;
    }
     getOtherSarea(sarea) {
      console.log(this.halfedges, this.halfedges.length);
      for (let he of this.halfedges) {
          console.log(he);
          let ok=he.sarea!==sarea;
          ok = ok&&he.sarea._verts.indexOf(this.v1)>=0;
          ok = ok&&he.sarea._verts.indexOf(this.v2)>=0;
          if (ok) {
              return he.sarea;
          }
      }
    }
    get  locked() {
      for (let sarea of this.sareas) {
          let mask=1<<sarea._borders.indexOf(this);
          let lock=sarea.borderLock&mask;
          if (lock||(sarea.flag&AreaFlags.NO_COLLAPSE)) {
              return true;
          }
      }
      return false;
    }
    get  dead() {
      return !this.parentNode;
    }
    get  side() {
      throw new Error("side accedd");
    }
    set  side(val) {
      throw new Error("side accedd");
    }
    get  valence() {
      let ret=0;
      let horiz=this.horiz;
      let visit={};
      for (let i=0; i<2; i++) {
          let sv=i ? this.v2 : this.v1;
          for (let sa of sv.borders) {
              if (sa.horiz!=this.horiz)
                continue;
              if (sa._id in visit)
                continue;
              visit[sa._id] = 1;
              let a0x=Math.min(this.v1[0], this.v2[0]);
              let a0y=Math.min(this.v1[1], this.v2[1]);
              let a1x=Math.max(this.v1[0], this.v2[0]);
              let a1y=Math.max(this.v1[1], this.v2[1]);
              let b0x=Math.min(sa.v1[0], sa.v2[0]);
              let b0y=Math.min(sa.v1[1], sa.v2[1]);
              let b1x=Math.min(sa.v1[0], sa.v2[0]);
              let b1y=Math.min(sa.v1[1], sa.v2[1]);
              let ok;
              let eps=0.001;
              if (horiz) {
                  ok = (a0y<=b1y+eps&&a1y>=a0y-eps);
              }
              else {
                ok = (a0x<=b1x+eps&&a1x>=a0x-eps);
              }
              if (ok) {
                  ret+=sa.sareas.length;
              }
          }
      }
      return ret;
    }
    get  horiz() {
      let dx=this.v2[0]-this.v1[0];
      let dy=this.v2[1]-this.v1[1];
      return Math.abs(dx)>Math.abs(dy);
    }
    static  hash(v1, v2) {
      return Math.min(v1._id, v2._id)+":"+Math.max(v1._id, v2._id);
    }
    static  define() {
      return {tagname: "screenborder-x", 
     style: "screenborder"}
    }
     otherVertex(v) {
      if (v===this.v1)
        return this.v2;
      else 
        return this.v1;
    }
     setCSS() {
      this.style["pointer-events"] = this.movable ? "auto" : "none";
      if (this._style===undefined) {
          this._style = document.createElement("style");
          this.appendChild(this._style);
      }
      let dpi=UIBase.getDPI();
      let pad=this.getDefault("mouse-threshold")/dpi;
      let wid=this.getDefault("border-width");
      let v1=this.v1, v2=this.v2;
      let vec=new Vector2(v2).sub(v1);
      let x=Math.min(v1[0], v2[0]), y=Math.min(v1[1], v2[1]);
      let w, h;
      let cursor, bstyle;
      this.style["display"] = "flex";
      this.style["display"] = this.horiz ? "row" : "column";
      this.style["justify-content"] = "center";
      this.style["align-items"] = "center";
      if (!this.horiz) {
          this.style["padding-left"] = this.style["padding-right"] = pad+"px";
          x-=wid*0.5+pad;
          w = wid*2;
          h = Math.abs(vec[1]);
          cursor = 'e-resize';
          bstyle = "border-left-style : solid;\n    border-right-style : solid;\n";
          bstyle = "border-top-style : none;\n    border-bottom-style : none;\n";
      }
      else {
        this.style["padding-top"] = this.style["padding-bottom"] = pad+"px";
        y-=wid*0.5+pad;
        w = Math.abs(vec[0]);
        h = wid;
        cursor = 'n-resize';
        bstyle = "border-top-style : solid;\n    border-bottom-style : solid;\n";
      }
      let color=this.getDefault("border-outer");
      let debug=cconst.DEBUG.screenborders;
      if (debug) {
          wid = 4;
          let alpha=1.0;
          let c=this.sareas.length*75;
          let r=0, g=0, b=0;
          if (this.movable) {
              b = 255;
          }
          if (this.halfedges.length>1) {
              g = 255;
          }
          if (this.outer) {
              r = 255;
          }
          color = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      let innerbuf=`
        .screenborder_inner_${this._id} {
          ${bstyle}
          ${this.horiz ? 'height' : 'width'} : ${wid}px;
          ${!this.horiz ? 'height' : 'width'} : 100%;
          margin : 0px;
          padding : 0px;
          
          background-color : ${this.getDefault("border-inner")};
          border-color : ${color};
          border-width : ${wid*0.5}px;
          border-style : ${debug && this.outer ? "dashed" : "solid"};
          pointer-events : none;
        }`;
      let sbuf=`
        .screenborder_${this._id} {
        }
    `;
      let ok=this.movable;
      if (!this.outer) {
          for (let sarea of this.sareas) {
              ok = ok||sarea.floating;
          }
      }
      if (ok) {
          sbuf+=`
        .screenborder_${this._id}:hover {
          cursor : ${cursor};
        }
      `;
      }
      this._style.textContent = sbuf;
      this._innerstyle.textContent = innerbuf;
      this.setAttribute("class", "screenborder_"+this._id);
      this.inner.setAttribute("class", "screenborder_inner_"+this._id);
      this.style["position"] = UIBase.PositionKey;
      this.style["left"] = x+"px";
      this.style["top"] = y+"px";
      this.style["width"] = w+"px";
      this.style["height"] = h+"px";
      this.style["z-index"] = ""+BORDER_ZINDEX_BASE;
    }
     valueOf() {
      return ScreenBorder.hash(this.v1, this.v2);
    }
     [Symbol.keystr]() {
      return ScreenBorder.hash(this.v1, this.v2);
    }
  }
  _ESClass.register(ScreenBorder);
  _es6_module.add_class(ScreenBorder);
  ScreenBorder = _es6_module.add_export('ScreenBorder', ScreenBorder);
  ui_base.UIBase.internalRegister(ScreenBorder);
}, '/dev/fairmotion/src/path.ux/scripts/screen/FrameManager_mesh.js');


es6_module_define('FrameManager_ops', ["../core/ui_base.js", "../path-controller/toolsys/toolsys.js", "../widgets/ui_widgets2.js", "../util/simple_events.js", "../config/const.js", "../path-controller/util/util.js", "../path-controller/util/vectormath.js"], function _FrameManager_ops_module(_es6_module) {
  "use strict";
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var vectormath=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var simple_toolsys=es6_import(_es6_module, '../path-controller/toolsys/toolsys.js');
  var ToolTip=es6_import_item(_es6_module, '../widgets/ui_widgets2.js', 'ToolTip');
  let toolstack_getter=function () {
    throw new Error("must pass a toolstack getter to registerToolStackGetter");
  }
  function registerToolStackGetter(func) {
    toolstack_getter = func;
  }
  registerToolStackGetter = _es6_module.add_export('registerToolStackGetter', registerToolStackGetter);
  let Vector2=vectormath.Vector2, Vector3=vectormath.Vector3, UndoFlags=simple_toolsys.UndoFlags, ToolFlags=simple_toolsys.ToolFlags;
  var pushModalLight=es6_import_item(_es6_module, '../util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../util/simple_events.js', 'popModalLight');
  var keymap=es6_import_item(_es6_module, '../util/simple_events.js', 'keymap');
  var pushPointerModal=es6_import_item(_es6_module, '../util/simple_events.js', 'pushPointerModal');
  class ToolBase extends simple_toolsys.ToolOp {
     constructor(screen) {
      super();
      this.screen = screen;
      this._finished = false;
    }
     start(elem, pointerId) {
      this.modalStart(undefined, elem, pointerId);
    }
     cancel() {
      this.finish();
    }
     finish() {
      this._finished = true;
      this.popModal(this.screen);
    }
     popModal() {
      this.overdraw.end();
      popModalLight(this.modaldata);
      this.modaldata = undefined;
    }
     modalStart(ctx, elem, pointerId) {
      this.ctx = ctx;
      if (this.modaldata!==undefined) {
          console.log("Error, modaldata was not undefined");
          popModalLight(this.modaldata);
      }
      this.overdraw = ui_base.UIBase.createElement("overdraw-x");
      this.overdraw.start(this.screen);
      let handlers={};
      let keys=Object.getOwnPropertyNames(this);
      for (let k in this.__proto__) {
          keys.push(k);
      }
      for (let k of Object.getOwnPropertyNames(this.__proto__)) {
          keys.push(k);
      }
      for (let k in this) {
          keys.push(k);
      }
      for (let k of keys) {
          if (k.startsWith("on")) {
              handlers[k] = this[k].bind(this);
          }
      }
      if (pointerId!==undefined) {
          handlers.on_pointerdown = handlers.on_pointerdown??handlers.on_mousedown;
          handlers.on_pointermove = handlers.on_pointermove??handlers.on_mousemove;
          handlers.on_pointerup = handlers.on_pointerup??handlers.on_mouseup;
          handlers.on_pointercancel = handlers.on_pointercancel??handlers.on_pointerup??handlers.on_mouseup;
          this.modaldata = pushPointerModal(handlers, elem, pointerId);
      }
      else {
        this.modaldata = pushModalLight(handlers);
      }
    }
     on_pointermove(e) {

    }
     on_pointerup(e) {
      this.finish();
    }
     on_keydown(e) {
      console.log("s", e.keyCode);
      switch (e.keyCode) {
        case keymap.Escape:
          this.cancel();
          break;
        case keymap.Space:
        case keymap.Enter:
          this.finish();
          break;
      }
    }
  }
  _ESClass.register(ToolBase);
  _es6_module.add_class(ToolBase);
  ToolBase = _es6_module.add_export('ToolBase', ToolBase);
  class AreaResizeTool extends ToolBase {
     constructor(screen, border, mpos) {
      if (screen===undefined)
        screen = _appstate.screen;
      super(screen);
      this.start_mpos = new Vector2(mpos);
      this.sarea = border.sareas[0];
      if (!this.sarea||border.dead) {
          console.log(border.dead, border);
          throw new Error("border corruption");
      }
      this.screen = screen;
      this.side = this.sarea._side(border);
    }
    get  border() {
      return this.sarea._borders[this.side];
    }
    static  tooldef() {
      return {uiname: "Resize Area", 
     toolpath: "screen.area.resize", 
     icon: ui_base.Icons.RESIZE, 
     description: "change size of area", 
     is_modal: true, 
     undoflag: UndoFlags.NO_UNDO, 
     flag: 0, 
     inputs: {}, 
     outputs: {}}
    }
     getBorders() {
      let horiz=this.border.horiz;
      let ret=[];
      let visit=new Set();
      let rec=(v) =>        {
        if (visit.has(v._id)) {
            return ;
        }
        visit.add(v._id);
        for (let border of v.borders) {
            if (border.horiz==horiz&&!visit.has(border._id)) {
                visit.add(border._id);
                ret.push(border);
                rec(border.otherVertex(v));
            }
        }
      };
      rec(this.border.v1);
      rec(this.border.v2);
      return ret;
    }
     on_pointerup(e) {
      this.finish();
    }
     finish() {
      super.finish();
      this.screen.snapScreenVerts();
      this.screen.regenBorders();
      this.screen.snapScreenVerts();
      this.screen.loadFromVerts();
    }
     on_keydown(e) {
      switch (e.keyCode) {
        case keymap["Escape"]:
        case keymap["Enter"]:
        case keymap["Space"]:
          this.finish();
          break;
      }
    }
     on_pointermove(e) {
      let mpos=new Vector2([e.x, e.y]);
      mpos.sub(this.start_mpos);
      let axis=this.border.horiz ? 1 : 0;
      this.overdraw.clear();
      let visit=new Set();
      let borders=this.getBorders();
      let color=cconst.DEBUG.screenborders ? "rgba(1.0, 0.5, 0.0, 0.1)" : "rgba(1.0, 0.5, 0.0, 1.0)";
      let bad=false;
      for (let border of borders) {
          bad = bad||!this.screen.isBorderMovable(border);
          border.oldv1 = new Vector2(border.v1);
          border.oldv2 = new Vector2(border.v2);
      }
      if (bad) {
          console.log("border is not movable");
          return ;
      }
      let check=() =>        {
        let count=0;
        for (let sarea of this.screen.sareas) {
            if (sarea.size[0]<15||sarea.size[1]<15) {
                count++;
            }
        }
        return count;
      };
      let badcount=check();
      let snapMode=true;
      let df=mpos[axis];
      let border=this.border;
      this.screen.moveBorder(border, df, false);
      for (let border of borders) {
          if (border.outer) {
              snapMode = false;
          }
          this.overdraw.line(border.v1, border.v2, color);
      }
      this.start_mpos[0] = e.x;
      this.start_mpos[1] = e.y;
      this.screen.loadFromVerts();
      this.screen.setCSS();
      if (check()!=badcount) {
          console.log("bad");
          for (let border of borders) {
              border.v1.load(border.oldv1);
              border.v2.load(border.oldv2);
          }
      }
      this.screen.snapScreenVerts(snapMode);
      this.screen.loadFromVerts();
      this.screen.solveAreaConstraints(snapMode);
      this.screen.setCSS();
      this.screen.updateDebugBoxes();
      this.screen._fireResizeCB();
    }
  }
  _ESClass.register(AreaResizeTool);
  _es6_module.add_class(AreaResizeTool);
  AreaResizeTool = _es6_module.add_export('AreaResizeTool', AreaResizeTool);
  class SplitTool extends ToolBase {
     constructor(screen) {
      if (screen===undefined)
        screen = _appstate.screen;
      super(screen);
      this.done = false;
      this.screen = screen;
      this.ctx = screen.ctx;
      this.sarea = undefined;
      this.t = undefined;
      this.started = false;
    }
    static  tooldef() {
      return {uiname: "Split Area", 
     toolpath: "screen.area.split", 
     icon: ui_base.Icons.SMALL_PLUS, 
     description: "split an area in two", 
     is_modal: true, 
     undoflag: UndoFlags.NO_UNDO, 
     flag: 0, 
     inputs: {}, 
     outputs: {}}
    }
     modalStart(ctx) {
      if (this.started) {
          console.trace("double call to modalStart()");
          return ;
      }
      this.overdraw = ui_base.UIBase.createElement("overdraw-x");
      this.overdraw.start(this.screen);
      super.modalStart(ctx);
    }
     cancel() {
      return this.finish(true);
    }
     finish(canceled=false) {
      if (this.done) {
          return ;
      }
      this.done = true;
      this.overdraw.end();
      this.popModal(this.screen);
      if (canceled||!this.sarea) {
          return ;
      }
      let sarea=this.sarea, screen=this.screen;
      let t=this.t;
      screen.splitArea(sarea, t, this.horiz);
      screen._internalRegenAll();
    }
     on_pointermove(e) {
      let x=e.x, y=e.y;
      let screen=this.screen;
      let sarea=screen.findScreenArea(x, y);
      this.overdraw.clear();
      if (sarea!==undefined) {
          x = (x-sarea.pos[0])/(sarea.size[0]);
          y = (y-sarea.pos[1])/(sarea.size[1]);
          let dx=1.0-Math.abs(x-0.5);
          let dy=1.0-Math.abs(y-0.5);
          this.sarea = sarea;
          let horiz=this.horiz = dx<dy;
          if (horiz) {
              this.t = y;
              this.overdraw.line([sarea.pos[0], e.y], [sarea.pos[0]+sarea.size[0], e.y]);
          }
          else {
            this.t = x;
            this.overdraw.line([e.x, sarea.pos[1]], [e.x, sarea.pos[1]+sarea.size[1]]);
          }
      }
    }
     on_pointerdown(e) {

    }
     on_pointerup(e) {
      this.finish();
      if (e.button) {
          this.stopPropagation();
          this.preventDefault();
      }
    }
     on_keydown(e) {
      console.log("s", e.keyCode);
      switch (e.keyCode) {
        case keymap.Escape:
          this.cancel();
          break;
        case keymap.Space:
        case keymap.Enter:
          this.finish();
          break;
      }
    }
  }
  _ESClass.register(SplitTool);
  _es6_module.add_class(SplitTool);
  SplitTool = _es6_module.add_export('SplitTool', SplitTool);
  class RemoveAreaTool extends ToolBase {
     constructor(screen, border) {
      if (screen===undefined)
        screen = _appstate.screen;
      super(screen);
      this.border = border;
      this.done = false;
      this.screen = screen;
      this.ctx = screen.ctx;
      this.sarea = undefined;
      this.t = undefined;
      this.started = false;
    }
    static  tooldef() {
      return {uiname: "Remove Area", 
     toolpath: "screen.area.pick_remove", 
     icon: ui_base.Icons.SMALL_PLUS, 
     description: "Collapse a window", 
     is_modal: true, 
     undoflag: UndoFlags.NO_UNDO, 
     flag: 0, 
     inputs: {}, 
     outputs: {}}
    }
     modalStart(ctx) {
      if (this.started) {
          console.trace("double call to modalStart()");
          return ;
      }
      this.overdraw = ui_base.UIBase.createElement("overdraw-x");
      this.overdraw.start(this.screen);
      super.modalStart(ctx);
    }
     cancel() {
      return this.finish(true);
    }
     finish(canceled=false) {
      if (this.done) {
          return ;
      }
      this.done = true;
      this.overdraw.end();
      this.popModal(this.screen);
      if (canceled||!this.sarea) {
          return ;
      }
      let sarea=this.sarea, screen=this.screen;
      let t=this.t;
      if (sarea) {
          screen.collapseArea(sarea, this.border);
          screen._internalRegenAll();
      }
    }
     on_pointermove(e) {
      let x=e.x, y=e.y;
      let screen=this.screen;
      let sarea=screen.findScreenArea(x, y);
      this.overdraw.clear();
      if (sarea!==undefined) {
          this.sarea = sarea;
          this.overdraw.rect(sarea.pos, sarea.size, "rgba(0,0,0,0.1)");
      }
    }
     on_pointerdown(e) {

    }
     on_pointerup(e) {
      this.finish();
      if (e.button) {
          this.stopPropagation();
          this.preventDefault();
      }
    }
     on_keydown(e) {
      console.log("s", e.keyCode);
      switch (e.keyCode) {
        case keymap.Escape:
          this.cancel();
          break;
        case keymap.Space:
        case keymap.Enter:
          this.finish();
          break;
      }
    }
  }
  _ESClass.register(RemoveAreaTool);
  _es6_module.add_class(RemoveAreaTool);
  RemoveAreaTool = _es6_module.add_export('RemoveAreaTool', RemoveAreaTool);
  class AreaDragTool extends ToolBase {
     constructor(screen, sarea, mpos) {
      if (screen===undefined)
        screen = _appstate.screen;
      super(screen);
      this.dropArea = false;
      this.excludeAreas = new Set();
      this.cursorbox = undefined;
      this.boxes = [];
      this.boxes.active = undefined;
      this.sarea = sarea;
      this.start_mpos = new Vector2(mpos);
      this.screen = screen;
    }
    static  tooldef() {
      return {uiname: "Drag Area", 
     toolpath: "screen.area.drag", 
     icon: ui_base.Icons.TRANSLATE, 
     description: "move or duplicate area", 
     is_modal: true, 
     undoflag: UndoFlags.NO_UNDO, 
     flag: 0, 
     inputs: {}, 
     outputs: {}}
    }
     finish() {
      super.finish();
      this.screen.regenBorders();
      this.screen.solveAreaConstraints();
      this.screen.snapScreenVerts();
      this.screen._recalcAABB();
    }
     getBoxRect(b) {
      let sa=b.sarea;
      let pos, size;
      if (b.horiz==-1) {
          pos = sa.pos;
          size = sa.size;
      }
      else 
        if (b.horiz) {
          if (b.side=='b') {
              pos = [sa.pos[0], sa.pos[1]+sa.size[1]*b.t];
              size = [sa.size[0], sa.size[1]*(1.0-b.t)];
          }
          else {
            pos = [sa.pos[0], sa.pos[1]];
            size = [sa.size[0], sa.size[1]*b.t];
          }
      }
      else {
        if (b.side=='r') {
            pos = [sa.pos[0]+sa.size[0]*b.t, sa.pos[1]];
            size = [sa.size[0]*(1.0-b.t), sa.size[1]];
        }
        else {
          pos = [sa.pos[0], sa.pos[1]];
          size = [sa.size[0]*b.t, sa.size[1]];
        }
      }
      let color="rgba(100, 100, 100, 0.2)";
      let ret=this.overdraw.rect(pos, size, color);
      ret.style["pointer-events"] = "none";
      return ret;
    }
     doSplit(b) {
      if (this.sarea) {
          return this.doSplitDrop(b);
      }
      let src=this.sarea, dst=b.sarea;
      let screen=this.screen;
      let t=b.t;
      screen.splitArea(dst, t, b.horiz);
      screen._internalRegenAll();
    }
     doSplitDrop(b) {
      if (b.horiz===-1&&b.sarea===this.sarea) {
          return ;
      }
      let can_rip=false;
      let sa=this.sarea;
      let screen=this.screen;
      can_rip = sa.size[0]===screen.size[0]||sa.size[1]===screen.size[1];
      can_rip = can_rip||this.sarea.floating;
      can_rip = can_rip&&b.sarea!==sa;
      can_rip = can_rip&&(b.horiz===-1||!screen.areasBorder(sa, b.sarea));
      let expand=b.horiz===-1&&b.sarea!==sa&&screen.areasBorder(b.sarea, sa);
      can_rip = can_rip||expand;
      console.log("can_rip:", can_rip, expand);
      if (can_rip) {
          screen.removeArea(sa);
          screen.snapScreenVerts();
      }
      if (b.horiz===-1) {
          let src=this.sarea, dst=b.sarea;
          if (can_rip&&src!==dst) {
              let mm;
              if (expand) {
                  mm = screen.minmaxArea(src);
                  screen.minmaxArea(dst, mm);
              }
              console.log("replacing. . .", expand);
              if (src.floating) {
                  let old=dst.editors;
                  dst.editors = [];
                  dst.editormap = {};
                  if (dst.area&&!(dst.area.constructor.define().areaname in src.editormap)) {
                      dst.area.push_ctx_active();
                      dst.area.on_area_inactive();
                      dst.area.remove();
                      dst.area.pop_ctx_active();
                  }
                  for (let editor of old) {
                      let def=editor.constructor.define();
                      let bad=false;
                      for (let editor2 of src.editors) {
                          if (editor.constructor===editor2.constructor) {
                              bad = true;
                              break;
                          }
                      }
                      if (!bad) {
                          dst.editors.push(editor);
                          dst.editormap[def.areaname] = editor;
                      }
                  }
                  for (let editor of src.editors) {
                      let def=editor.constructor.define();
                      dst.editormap[def.areaname] = editor;
                      dst.editors.push(editor);
                      if (editor.owning_sarea) {
                          editor.owning_sarea = dst;
                      }
                      if (editor.parentWidget) {
                          editor.parentWidget = dst;
                      }
                  }
                  if (cconst.useAreaTabSwitcher) {
                      for (let editor of dst.editors) {
                          if (editor.switcher) {
                              editor.switcher.flagUpdate();
                          }
                      }
                  }
                  dst.area = src.area;
                  dst.shadow.appendChild(src.area);
                  src.area = undefined;
                  src.editors = [];
                  src.editormap = {};
                  dst.on_resize(dst.size, dst.size);
                  dst.flushSetCSS();
                  dst.flushUpdate();
                  screen.removeArea(src);
                  screen.snapScreenVerts();
                  return ;
              }
              else {
                screen.replaceArea(dst, src);
              }
              if (expand) {
                  console.log("\nEXPANDING:", src.size[0], src.size[1]);
                  src.pos[0] = mm.min[0];
                  src.pos[1] = mm.min[1];
                  src.size[0] = mm.max[0]-mm.min[0];
                  src.size[1] = mm.max[1]-mm.min[1];
                  src.loadFromPosSize();
                  screen._internalRegenAll();
              }
          }
          else {
            screen.replaceArea(dst, src.copy());
            screen._internalRegenAll();
          }
      }
      else {
        let src=this.sarea, dst=b.sarea;
        let t=b.t;
        let nsa=screen.splitArea(dst, t, b.horiz);
        if (b.side==='l'||b.side==='t') {
            nsa = dst;
        }
        if (can_rip) {
            screen.replaceArea(nsa, src);
        }
        else {
          screen.replaceArea(nsa, src.copy());
        }
        screen._internalRegenAll();
      }
    }
     makeBoxes(sa) {
      let sz=util.isMobile() ? 100 : 40;
      let cx=sa.pos[0]+sa.size[0]*0.5;
      let cy=sa.pos[1]+sa.size[1]*0.5;
      let color=this.color = "rgba(200, 200, 200, 0.55)";
      let hcolor=this.hcolor = "rgba(230, 230, 230, 0.75)";
      let idgen=0;
      let boxes=this.boxes;
      let box=(x, y, sz, horiz, t, side) =>        {
        let b=this.overdraw.rect([x-sz[0]*0.5, y-sz[1]*0.5], sz, color);
        b.style["border-radius"] = "14px";
        boxes.push(b);
        b.sarea = sa;
        let style=document.createElement("style");
        let cls=`mybox_${idgen++}`;
        b.horiz = horiz;
        b.t = t;
        b.side = side;
        b.setAttribute("class", cls);
        b.setAttribute("is_box", true);
        b.addEventListener("pointermove", this.on_pointermove.bind(this));
        let onclick=b.onclick = (e) =>          {
          let type=e.type.toLowerCase();
          if ((e.type==="pointerdown"||e.type==="pointerup")&&e.button!==0) {
              return ;
          }
          console.log("split click");
          if (!this._finished) {
              this.finish();
              this.doSplit(b);
              e.preventDefault();
              e.stopPropagation();
          }
        }
        b.addEventListener("click", onclick);
        b.addEventListener("pointerdown", onclick);
        b.addEventListener("pointerup", onclick);
        b.addEventListener("pointerenter", (e) =>          {
          if (this.curbox!==undefined) {
              if (this.curbox.rect) {
                  this.curbox.rect.remove();
                  this.curbox.rect = undefined;
              }
          }
          if (b.rect!==undefined) {
              b.rect.remove();
              b.rect = undefined;
          }
          b.rect = this.getBoxRect(b);
          this.curbox = b;
          b.setColor(hcolor);
        });
        b.addEventListener("pointerleave", (e) =>          {
          if (b.rect) {
              b.rect.remove();
              b.rect = undefined;
          }
          if (this.curbox===b) {
              this.curbox = undefined;
          }
          b.setColor(color);
        });
        style.textContent = `
        .${cls}:hover {
          background-color : orange;
          fill:orange;stroke-width:2
        }
      `;
        b.appendChild(style);
        b.setAttribute("class", cls);
        return b;
      };
      let pad=5;
      if (this.sarea) {
          box(cx, cy, [sz, sz], -1, -1, -1);
      }
      box(cx-sz*0.75-pad, cy, [sz*0.5, sz], false, 0.5, 'l');
      box(cx-sz*1.2-pad, cy, [sz*0.25, sz], false, 0.3, 'l');
      box(cx+sz*0.75+pad, cy, [sz*0.5, sz], false, 0.5, 'r');
      box(cx+sz*1.2+pad, cy, [sz*0.25, sz], false, 0.7, 'r');
      box(cx, cy-sz*0.75-pad, [sz, sz*0.5], true, 0.5, 't');
      box(cx, cy-sz*1.2-pad, [sz, sz*0.25], true, 0.3, 't');
      box(cx, cy+sz*0.75+pad, [sz, sz*0.5], true, 0.5, 'b');
      box(cx, cy+sz*1.2+pad, [sz, sz*0.25], true, 0.7, 'b');
    }
     getActiveBox(x, y) {
      for (let n of this.boxes) {
          if (n.hasAttribute&&n.hasAttribute("is_box")) {
              let rect=n.getClientRects()[0];
              if (x>=rect.x&&y>=rect.y&&x<rect.x+rect.width&&y<rect.y+rect.height) {
                  return n;
              }
          }
      }
    }
     on_drag(e) {
      this.on_pointermove(e);
    }
     on_dragend(e) {
      this.on_pointerup(e);
    }
     on_pointermove(e) {
      let wid=55;
      let color="rgb(200, 200, 200, 0.7)";
      let n=this.getActiveBox(e.x, e.y);
      if (n!==undefined) {
          n.setColor(this.hcolor);
      }
      if (this.boxes.active!==undefined&&this.boxes.active!==n) {
          this.boxes.active.setColor(this.color);
          this.boxes.active.dispatchEvent(new PointerEvent("pointerleave", e));
      }
      if (n!==undefined) {
          n.dispatchEvent(new PointerEvent("pointerenter", e));
      }
      this.boxes.active = n;
      if (this.sarea===undefined) {
          return ;
      }
      if (this.cursorbox===undefined) {
          wid = 25;
          this.cursorbox = this.overdraw.rect([e.x-wid*0.5, e.y-wid*0.5], [wid, wid], color);
          this.cursorbox.style["pointer-events"] = "none";
      }
      else {
        this.cursorbox.style["x"] = (e.x-wid*0.5)+"px";
        this.cursorbox.style["y"] = (e.y-wid*0.5)+"px";
      }
    }
     on_pointerup(e) {
      console.log("e.button", e.button, e, e.x, e.y, this.getActiveBox(e.x, e.y));
      if (e.button) {
          e.stopPropagation();
          e.preventDefault();
      }
      else {
        let box=this.getActiveBox(e.x, e.y);
        if (box!==undefined) {
            box.onclick(e);
        }
      }
      this.finish();
    }
     modalStart(ctx) {
      super.modalStart(...arguments);
      let screen=this.screen;
      this.overdraw.clear();
      if (this.sarea&&!this.excludeAreas.has(this.sarea)) {
          let sa=this.sarea;
          let box=this.overdraw.rect(sa.pos, sa.size, "rgba(100, 100, 100, 0.5)");
          box.style["pointer-events"] = "none";
      }
      for (let sa of screen.sareas) {
          if (this.excludeAreas.has(sa)) {
              continue;
          }
          this.makeBoxes(sa);
      }
    }
     on_keydown(e) {
      switch (e.keyCode) {
        case keymap["Escape"]:
        case keymap["Enter"]:
        case keymap["Space"]:
          this.finish();
          break;
      }
    }
  }
  _ESClass.register(AreaDragTool);
  _es6_module.add_class(AreaDragTool);
  AreaDragTool = _es6_module.add_export('AreaDragTool', AreaDragTool);
  class AreaMoveAttachTool extends AreaDragTool {
     constructor(screen, sarea, mpos) {
      super(screen, sarea, mpos);
      this.excludeAreas = new Set([sarea]);
      this.dropArea = true;
      this.first = true;
      this.sarea = sarea;
      this.mpos = new Vector2(mpos);
      this.start_mpos2 = new Vector2(mpos);
      this.start_pos = new Vector2(sarea.pos);
    }
     on_pointermove(e) {
      let dx=e.x-this.start_mpos2[0];
      let dy=e.y-this.start_mpos2[1];
      let sarea=this.sarea;
      if (this.first) {
          this.start_mpos2 = new Vector2([e.x, e.y]);
          this.first = false;
          return ;
      }
      sarea.pos[0] = this.start_pos[0]+dx;
      sarea.pos[1] = this.start_pos[1]+dy;
      sarea.loadFromPosSize();
      this.mpos.loadXY(e.x, e.y);
      super.on_pointermove(e);
    }
     on_pointerup(e) {
      super.on_pointerup(e);
    }
     on_pointerdown(e) {
      super.on_pointerdown(e);
    }
     on_keydown(e) {
      super.on_keydown(e);
    }
  }
  _ESClass.register(AreaMoveAttachTool);
  _es6_module.add_class(AreaMoveAttachTool);
  AreaMoveAttachTool = _es6_module.add_export('AreaMoveAttachTool', AreaMoveAttachTool);
  class ToolTipViewer extends ToolBase {
     constructor(screen) {
      super(screen);
      this.tooltip = undefined;
      this.element = undefined;
    }
    static  tooldef() {
      return {uiname: "Help Tool", 
     toolpath: "screen.help_picker", 
     icon: ui_base.Icons.HELP, 
     description: "view tooltips", 
     is_modal: true, 
     undoflag: UndoFlags.NO_UNDO, 
     flag: 0, 
     inputs: {}, 
     outputs: {}}
    }
     on_pointermove(e) {
      this.pick(e);
    }
     on_pointerdown(e) {
      this.pick(e);
    }
     on_pointerup(e) {
      this.finish();
    }
     finish() {
      super.finish();
    }
     on_keydown(e) {
      switch (e.keyCode) {
        case keymap.Escape:
        case keymap.Enter:
        case Keymap.Space:
          if (this.tooltip) {
              this.tooltip.end();
          }
          this.finish();
          break;
      }
    }
     pick(e) {
      let x=e.x, y=e.y;
      let ele=this.screen.pickElement(x, y);
      console.log(ele ? ele.tagName : ele);
      if (ele!==undefined&&ele!==this.element&&ele.title) {
          if (this.tooltip) {
              this.tooltip.end();
          }
          this.element = ele;
          let tip=ele.title;
          this.tooltip = ToolTip.show(tip, this.screen, x, y);
      }
      e.preventDefault();
      e.stopPropagation();
    }
  }
  _ESClass.register(ToolTipViewer);
  _es6_module.add_class(ToolTipViewer);
  ToolTipViewer = _es6_module.add_export('ToolTipViewer', ToolTipViewer);
}, '/dev/fairmotion/src/path.ux/scripts/screen/FrameManager_ops.js');


es6_module_define('ScreenArea', ["../path-controller/util/vectormath.js", "./area_wrangler.js", "./FrameManager_mesh.js", "../core/ui.js", "../path-controller/toolsys/toolprop.js", "../path-controller/util/simple_events.js", "../config/const.js", "../path-controller/util/util.js", "../widgets/ui_noteframe.js", "../core/ui_base.js", "../path-controller/util/struct.js"], function _ScreenArea_module(_es6_module) {
  let _ScreenArea=undefined;
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var vectormath=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var ui=es6_import(_es6_module, '../core/ui.js');
  var ui_noteframe=es6_import(_es6_module, '../widgets/ui_noteframe.js');
  var haveModal=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'haveModal');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var nstructjs=es6_import_item(_es6_module, '../path-controller/util/struct.js', 'default');
  let UIBase=ui_base.UIBase;
  var EnumProperty=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'EnumProperty');
  let Vector2=vectormath.Vector2;
  let Screen=undefined;
  var AreaFlags=es6_import_item(_es6_module, './FrameManager_mesh.js', 'AreaFlags');
  var BORDER_ZINDEX_BASE=es6_import_item(_es6_module, './FrameManager_mesh.js', 'BORDER_ZINDEX_BASE');
  var ScreenBorder=es6_import_item(_es6_module, './FrameManager_mesh.js', 'ScreenBorder');
  var snap=es6_import_item(_es6_module, './FrameManager_mesh.js', 'snap');
  var snapi=es6_import_item(_es6_module, './FrameManager_mesh.js', 'snapi');
  AreaFlags = _es6_module.add_export('AreaFlags', AreaFlags);
  var ___area_wrangler_js=es6_import(_es6_module, './area_wrangler.js');
  for (let k in ___area_wrangler_js) {
      _es6_module.add_export(k, ___area_wrangler_js[k], true);
  }
  var getAreaIntName=es6_import_item(_es6_module, './area_wrangler.js', 'getAreaIntName');
  var setAreaTypes=es6_import_item(_es6_module, './area_wrangler.js', 'setAreaTypes');
  var contextWrangler=es6_import_item(_es6_module, './area_wrangler.js', 'contextWrangler');
  var AreaWrangler=es6_import_item(_es6_module, './area_wrangler.js', 'AreaWrangler');
  var areaclasses=es6_import_item(_es6_module, './area_wrangler.js', 'areaclasses');
  contextWrangler = _es6_module.add_export('contextWrangler', contextWrangler);
  window._contextWrangler = contextWrangler;
  const BorderMask={LEFT: 1, 
   BOTTOM: 2, 
   RIGHT: 4, 
   TOP: 8, 
   ALL: 1|2|4|8}
  _es6_module.add_export('BorderMask', BorderMask);
  const BorderSides={LEFT: 0, 
   BOTTOM: 1, 
   RIGHT: 2, 
   TOP: 3}
  _es6_module.add_export('BorderSides', BorderSides);
  class Area extends ui_base.UIBase {
     constructor() {
      super();
      let def=this.constructor.define();
      this.borderLock = def.borderLock||0;
      this.flag = def.flag||0;
      this.inactive = true;
      this.areaDragToolEnabled = true;
      this.owning_sarea = undefined;
      this._area_id = contextWrangler.idgen++;
      this.pos = undefined;
      this.size = undefined;
      this.minSize = [5, 5];
      this.maxSize = [undefined, undefined];
      let appendChild=this.shadow.appendChild;
      this.shadow.appendChild = (child) =>        {
        appendChild.call(this.shadow, child);
        if (__instance_of(child, UIBase)) {
            child.parentWidget = this;
        }
      };
      let prepend=this.shadow.prepend;
      this.shadow.prepend = (child) =>        {
        prepend.call(this.shadow, child);
        if (__instance_of(child, UIBase)) {
            child.parentWidget = this;
        }
      };
    }
    get  floating() {
      return ~~(this.flag&AreaFlags.FLOATING);
    }
    set  floating(val) {
      if (val) {
          this.flag|=AreaFlags.FLOATING;
      }
      else {
        this.flag&=~AreaFlags.FLOATING;
      }
    }
    static  getActiveArea(type) {
      return contextWrangler.getLastArea(type);
    }
    static  unregister(cls) {
      let def=cls.define();
      if (!def.areaname) {
          throw new Error("Missing areaname key in define()");
      }
      if (def.areaname in areaclasses) {
          delete areaclasses[def.areaname];
      }
    }
    static  register(cls) {
      let def=cls.define();
      if (!def.areaname) {
          throw new Error("Missing areaname key in define()");
      }
      areaclasses[def.areaname] = cls;
      ui_base.UIBase.internalRegister(cls);
    }
    static  makeAreasEnum() {
      let areas={};
      let icons={};
      let i=0;
      for (let k in areaclasses) {
          let cls=areaclasses[k];
          let def=cls.define();
          if (def.flag&AreaFlags.HIDDEN)
            continue;
          let uiname=def.uiname;
          if (uiname===undefined) {
              uiname = k.replace("_", " ").toLowerCase();
              uiname = uiname[0].toUpperCase()+uiname.slice(1, uiname.length);
          }
          areas[uiname] = k;
          icons[uiname] = def.icon!==undefined ? def.icon : -1;
      }
      let prop=new EnumProperty(undefined, areas);
      prop.addIcons(icons);
      return prop;
    }
    static  define() {
      return {tagname: "pathux-editor-x", 
     areaname: undefined, 
     flag: 0, 
     uiname: undefined, 
     icon: undefined}
    }
    static  newSTRUCT() {
      return UIBase.createElement(this.define().tagname);
    }
     init() {
      super.init();
      this.style["overflow"] = "hidden";
      this.noMarginsOrPadding();
      let onover=(e) =>        {
        this.push_ctx_active();
        this.pop_ctx_active();
      };
      super.addEventListener("mouseover", onover, {passive: true});
      super.addEventListener("mousemove", onover, {passive: true});
      super.addEventListener("mousein", onover, {passive: true});
      super.addEventListener("mouseenter", onover, {passive: true});
      super.addEventListener("touchstart", onover, {passive: true});
      super.addEventListener("focusin", onover, {passive: true});
      super.addEventListener("focus", onover, {passive: true});
    }
     _get_v_suffix() {
      if (this.flag&AreaFlags.INDEPENDENT) {
          return this._id;
      }
      else {
        return "";
      }
    }
     getKeyMaps() {
      return this.keymap!==undefined ? [this.keymap] : [];
    }
     on_fileload(isActiveEditor) {
      contextWrangler.reset();
    }
     buildDataPath() {
      let p=this;
      let sarea=this.owning_sarea;
      if (sarea===undefined||sarea.screen===undefined) {
          console.warn("Area.buildDataPath(): Failed to build data path");
          return "";
      }
      let screen=sarea.screen;
      let idx1=screen.sareas.indexOf(sarea);
      let idx2=sarea.editors.indexOf(this);
      if (idx1<0||idx2<0) {
          throw new Error("malformed area data");
      }
      let ret=`screen.sareas[${idx1}].editors[${idx2}]`;
      return ret;
    }
     saveData() {
      return {_area_id: this._area_id, 
     areaName: this.areaName}
    }
     loadData(obj) {
      let id=obj._area_id;
      if (id!==undefined&&id!==null) {
          this._area_id = id;
      }
    }
     draw() {

    }
     copy() {
      console.warn("You might want to implement this, Area.prototype.copy based method called");
      let ret=UIBase.createElement(this.constructor.define().tagname);
      return ret;
    }
     on_resize(size, oldsize) {
      super.on_resize(size, oldsize);
    }
     on_area_focus() {

    }
     on_area_blur() {

    }
     on_area_active() {

    }
     on_area_inactive() {

    }
     push_ctx_active(dontSetLastRef=false) {
      contextWrangler.updateLastRef(this.constructor, this);
      contextWrangler.push(this.constructor, this, !dontSetLastRef);
    }
     pop_ctx_active(dontSetLastRef=false) {
      contextWrangler.pop(this.constructor, this, !dontSetLastRef);
    }
     getScreen() {
      throw new Error("replace me in Area.prototype");
    }
     toJSON() {
      return Object.assign(super.toJSON(), {areaname: this.constructor.define().areaname, 
     _area_id: this._area_id});
    }
     loadJSON(obj) {
      super.loadJSON(obj);
      this._area_id = obj._area_id;
      return this;
    }
     getBarHeight() {
      return this.header.getClientRects()[0].height;
    }
     makeAreaSwitcher(container) {
      if (cconst.useAreaTabSwitcher) {
          let ret=UIBase.createElement("area-docker-x");
          container.add(ret);
          return ret;
      }
      let prop=Area.makeAreasEnum();
      let dropbox=container.listenum(undefined, {name: this.constructor.define().uiname, 
     enumDef: prop, 
     callback: (id) =>          {
          let cls=areaclasses[id];
          this.owning_sarea.switch_editor(cls);
        }});
      dropbox.update.after(() =>        {
        let name=this.constructor.define().uiname;
        let val=prop.values[name];
        if (dropbox.value!==val&&val in prop.keys) {
            val = prop.keys[val];
        }
        if (dropbox.value!==val) {
            dropbox.setValue(prop.values[name], true);
        }
      });
      return dropbox;
    }
     makeHeader(container, add_note_area=true, make_draggable=true) {
      let switcherRow;
      let row;
      let helpRow;
      if (!(this.flag&AreaFlags.NO_SWITCHER)&&cconst.useAreaTabSwitcher) {
          let col=this.header = container.col();
          switcherRow = helpRow = col.row();
          row = col.row();
      }
      else {
        row = helpRow = this.header = container.row();
      }
      if (!(this.flag&AreaFlags.NO_HEADER_CONTEXT_MENU)) {
          let callmenu=ScreenBorder.bindBorderMenu(this.header, true);
          this.addEventListener("mousedown", (e) =>            {
            if (e.button!==2||this.header.pickElement(e.x, e.y)!==this.header) {
                return ;
            }
            callmenu(e);
          });
      }
      this.header.remove();
      container._prepend(this.header);
      row.setCSS.after(() =>        {
        return row.background = this.getDefault("AreaHeaderBG");
      });
      let rh=~~(16*this.getDPI());
      container.noMarginsOrPadding();
      row.noMarginsOrPadding();
      row.style["width"] = "100%";
      row.style["margin"] = "0px";
      row.style["padding"] = "0px";
      if (!(this.flag&AreaFlags.NO_SWITCHER)) {
          if (this.switcher) {
              switcherRow.add(this.switcher);
          }
          else {
            this.switcher = this.makeAreaSwitcher(cconst.useAreaTabSwitcher ? switcherRow : row);
          }
      }
      if (util.isMobile()||cconst.addHelpPickers) {
          if (this.helppicker) {
              this.helppicker.remove();
          }
          this.helppicker = helpRow.helppicker();
          this.helppicker.iconsheet = 0;
      }
      if (add_note_area) {
          let notef=UIBase.createElement("noteframe-x");
          notef.ctx = this.ctx;
          row._add(notef);
      }
      if (cconst.useAreaTabSwitcher) {
          return row;
      }
      let eventdom=this.header;
      let mdown=false;
      let mpos=new Vector2();
      let mpre=(e, pageX, pageY) =>        {
        if (haveModal()) {
            return ;
        }
        pageX = pageX===undefined ? e.x : pageX;
        pageY = pageY===undefined ? e.y : pageY;
        let node=this.getScreen().pickElement(pageX, pageY);
        if (node!==row) {
            return false;
        }
        return true;
      };
      eventdom.addEventListener("pointerout", (e) =>        {
        mdown = false;
      });
      eventdom.addEventListener("pointerleave", (e) =>        {
        mdown = false;
      });
      eventdom.addEventListener("pointerdown", (e) =>        {
        if (!mpre(e))
          return ;
        mpos[0] = e.pageX;
        mpos[1] = e.pageY;
        mdown = true;
      });
      let last_time=util.time_ms();
      let do_mousemove=(e, pageX, pageY) =>        {
        if (haveModal()||!make_draggable) {
            return ;
        }
        let mdown2=e.buttons!==0||(e.touches&&e.touches.length>0);
        mdown2 = mdown2&&mdown;
        if (util.time_ms()-last_time<250) {
            return ;
        }
        last_time = util.time_ms;
        if (!mdown2||!mpre(e, pageX, pageY))
          return ;
        if (e.type==="mousemove"&&e.was_touch) {
            return ;
        }
        let dx=pageX-mpos[0];
        let dy=pageY-mpos[1];
        let dis=dx*dx+dy*dy;
        let limit=7;
        if (dis>limit*limit) {
            let sarea=this.owning_sarea;
            if (sarea===undefined) {
                console.warn("Error: missing sarea ref");
                return ;
            }
            let screen=sarea.screen;
            if (screen===undefined) {
                console.log("Error: missing screen ref");
                return ;
            }
            if (!this.areaDragToolEnabled) {
                return ;
            }
            mdown = false;
            console.log("area drag tool!", e.type, e);
            screen.areaDragTool(this.owning_sarea);
        }
      };
      eventdom.addEventListener("pointermove", (e) =>        {
        return do_mousemove(e, e.pageX, e.pageY);
      }, false);
      eventdom.addEventListener("pointerup", (e) =>        {
        console.log("pointerup", e);
        mdown = false;
      }, false);
      eventdom.addEventListener("pointercancel", (e) =>        {
        console.log("pointercancel", e);
        mdown = false;
      }, false);
      return row;
    }
     setCSS() {
      if (this.size!==undefined) {
          this.style["position"] = UIBase.PositionKey;
          this.style["width"] = this.size[0]+"px";
          this.style["height"] = this.size[1]+"px";
      }
    }
     update() {
      if (this.owning_sarea===undefined||this!==this.owning_sarea.area) {
          return ;
      }
      super.update();
    }
     loadSTRUCT(reader) {
      reader(this);
    }
     _isDead() {
      if (this.dead) {
          return true;
      }
      let screen=this.getScreen();
      if (screen===undefined)
        return true;
      if (screen.parentNode===undefined)
        return true;
    }
     afterSTRUCT() {
      let f=() =>        {
        if (this._isDead()) {
            return ;
        }
        if (!this.ctx) {
            this.doOnce(f);
            return ;
        }
        try {
          ui_base.loadUIData(this, this.saved_uidata);
          this.saved_uidata = undefined;
        }
        catch (error) {
            console.log("failed to load ui data");
            util.print_stack(error);
        }
      };
      this.doOnce(f);
    }
     loadSTRUCT(reader) {
      reader(this);
    }
     _getSavedUIData() {
      return ui_base.saveUIData(this, "area");
    }
  }
  _ESClass.register(Area);
  _es6_module.add_class(Area);
  Area = _es6_module.add_export('Area', Area);
  Area.STRUCT = `
pathux.Area { 
  flag : int;
  saved_uidata : string | obj._getSavedUIData();
}
`;
  nstructjs.register(Area, "pathux.Area");
  ui_base.UIBase.internalRegister(Area);
  class ScreenArea extends ui_base.UIBase {
     constructor() {
      super();
      this._flag = undefined;
      this.flag = 0;
      this._borders = [];
      this._verts = [];
      this.dead = false;
      this._sarea_id = contextWrangler.idgen++;
      this._pos = new Vector2();
      this._size = new Vector2([512, 512]);
      if (cconst.DEBUG.screenAreaPosSizeAccesses) {
          let wrapVector=(name, axis) =>            {
            Object.defineProperty(this[name], axis, {get: function () {
                return this["_"+axis];
              }, 
        set: function (val) {
                console.warn(`ScreenArea.${name}[${axis}] set:`, val);
                this["_"+axis] = val;
              }});
          };
          wrapVector("size", 0);
          wrapVector("size", 1);
          wrapVector("pos", 0);
          wrapVector("pos", 1);
      }
      this.area = undefined;
      this.editors = [];
      this.editormap = {};
      this.addEventListener("mouseover", (e) =>        {
        if (haveModal()) {
            return ;
        }
        let screen=this.getScreen();
        if (screen.sareas.active!==this&&screen.sareas.active&&screen.sareas.active.area) {
            screen.sareas.active.area.on_area_blur();
        }
        if (this.area&&screen.sareas.active!==this) {
            this.area.on_area_focus();
        }
        screen.sareas.active = this;
      });
    }
    get  floating() {
      return this.flag&AreaFlags.FLOATING;
    }
    set  floating(val) {
      if (val) {
          this.flag|=AreaFlags.FLOATING;
      }
      else {
        this.flag&=~AreaFlags.FLOATING;
      }
    }
    get  flag() {
      let flag=this._flag&(AreaFlags.FLOATING|AreaFlags.INDEPENDENT);
      if (this.area) {
          flag|=this.area.flag;
      }
      return flag;
    }
    set  flag(v) {
      this._flag&=~(AreaFlags.FLOATING|AreaFlags.INDEPENDENT);
      this._flag|=v&(AreaFlags.FLOATING|AreaFlags.INDEPENDENT);
      if (this.area) {
          this.area.flag|=v&~(AreaFlags.FLOATING|AreaFlags.INDEPENDENT);
      }
    }
    get  borderLock() {
      return this.area!==undefined ? this.area.borderLock : 0;
    }
    get  minSize() {
      return this.area!==undefined ? this.area.minSize : this.size;
    }
    get  maxSize() {
      return this.area!==undefined ? this.area.maxSize : this.size;
    }
    get  pos() {
      return this._pos;
    }
    set  pos(val) {
      if (cconst.DEBUG.screenAreaPosSizeAccesses) {
          console.log("ScreenArea set pos", val);
      }
      this._pos.load(val);
    }
    get  size() {
      return this._size;
    }
    set  size(val) {
      if (cconst.DEBUG.screenAreaPosSizeAccesses) {
          console.log("ScreenArea set size", val);
      }
      this._size.load(val);
    }
    static  newSTRUCT() {
      return UIBase.createElement("screenarea-x");
    }
    static  define() {
      return {tagname: "screenarea-x"}
    }
     _get_v_suffix() {
      return this.area ? this.area._get_v_suffix() : "";
    }
     bringToFront() {
      let screen=this.getScreen();
      HTMLElement.prototype.remove.call(this);
      screen.sareas.remove(this);
      screen.appendChild(this);
      let zindex=BORDER_ZINDEX_BASE+1;
      if (screen.style["z-index"]) {
          zindex = parseInt(screen.style["z-index"])+1;
      }
      for (let sarea of screen.sareas) {
          let zindex=sarea.style["z-index"];
          if (sarea.style["z-index"]) {
              zindex = Math.max(zindex, parseInt(sarea.style["z-index"])+1);
          }
      }
      this.style["z-index"] = zindex;
    }
     _side(border) {
      let ret=this._borders.indexOf(border);
      if (ret<0) {
          throw new Error("border not in screen area");
      }
      return ret;
    }
     init() {
      super.init();
      this.noMarginsOrPadding();
    }
     draw() {
      if (this.area&&this.area.draw) {
          this.area.push_ctx_active();
          this.area.draw();
          this.area.pop_ctx_active();
      }
    }
     _isDead() {
      if (this.dead) {
          return true;
      }
      let screen=this.getScreen();
      if (screen===undefined)
        return true;
      if (screen.parentNode===undefined)
        return true;
    }
     toJSON() {
      let ret={editors: this.editors, 
     _sarea_id: this._sarea_id, 
     area: this.area.constructor.define().areaname, 
     pos: this.pos, 
     size: this.size};
      return Object.assign(super.toJSON(), ret);
    }
     on_keydown(e) {
      if (this.area.on_keydown) {
          this.area.push_ctx_active();
          this.area.on_keydown(e);
          this.area.pop_ctx_active();
      }
    }
     loadJSON(obj) {
      if (obj===undefined) {
          console.warn("undefined in loadJSON");
          return ;
      }
      super.loadJSON(obj);
      this.pos.load(obj.pos);
      this.size.load(obj.size);
      for (let editor of obj.editors) {
          let areaname=editor.areaname;
          let tagname=areaclasses[areaname].define().tagname;
          let area=UIBase.createElement(tagname);
          area.owning_sarea = this;
          this.editormap[areaname] = area;
          this.editors.push(this.editormap[areaname]);
          area.pos = new Vector2(obj.pos);
          area.size = new Vector2(obj.size);
          area.ctx = this.ctx;
          area.inactive = true;
          area.loadJSON(editor);
          area.owning_sarea = undefined;
          if (areaname===obj.area) {
              this.area = area;
          }
      }
      if (this.area!==undefined) {
          this.area.ctx = this.ctx;
          this.area.style["width"] = "100%";
          this.area.style["height"] = "100%";
          this.area.owning_sarea = this;
          this.area.parentWidget = this;
          this.area.pos = this.pos;
          this.area.size = this.size;
          this.area.inactive = false;
          this.shadow.appendChild(this.area);
          this.area.on_area_active();
          this.area.onadd();
      }
      this.setCSS();
    }
     _ondestroy() {
      super._ondestroy();
      this.dead = true;
      for (let editor of this.editors) {
          if (editor===this.area)
            continue;
          editor._ondestroy();
      }
    }
     getScreen() {
      if (this.screen!==undefined) {
          return this.screen;
      }
      let p=this.parentNode;
      let _i=0;
      while (p&&!(__instance_of(p, Screen))&&p!==p.parentNode) {
        p = this.parentNode;
        if (_i++>1000) {
            console.warn("infinite loop detected in ScreenArea.prototype.getScreen()");
            return undefined;
        }
      }
      return p&&__instance_of(p, Screen) ? p : undefined;
    }
     copy(screen) {
      let ret=UIBase.createElement("screenarea-x");
      ret.screen = screen;
      ret.ctx = this.ctx;
      ret.pos[0] = this.pos[0];
      ret.pos[1] = this.pos[1];
      ret.size[0] = this.size[0];
      ret.size[1] = this.size[1];
      for (let area of this.editors) {
          let cpy=area.copy();
          cpy.ctx = this.ctx;
          cpy.parentWidget = ret;
          ret.editors.push(cpy);
          ret.editormap[cpy.constructor.define().areaname] = cpy;
          if (area===this.area) {
              ret.area = cpy;
          }
      }
      ret.ctx = this.ctx;
      if (ret.area!==undefined) {
          ret.area.ctx = this.ctx;
          ret.area.pos = ret.pos;
          ret.area.size = ret.size;
          ret.area.owning_sarea = ret;
          ret.area.parentWidget = ret;
          ret.shadow.appendChild(ret.area);
          if (ret.area._init_done) {
              ret.area.push_ctx_active();
              ret.area.on_area_active();
              ret.area.pop_ctx_active();
          }
          else {
            ret.doOnce(() =>              {
              if (this.dead) {
                  return ;
              }
              ret._init();
              ret.area._init();
              ret.area.push_ctx_active();
              ret.area.on_area_active();
              ret.area.pop_ctx_active();
            });
          }
      }
      return ret;
    }
     snapToScreenSize() {
      let screen=this.getScreen();
      let co=new Vector2();
      let changed=0;
      for (let v of this._verts) {
          co.load(v);
          v[0] = Math.min(Math.max(v[0], 0), screen.size[0]);
          v[1] = Math.min(Math.max(v[1], 0), screen.size[1]);
          if (co.vectorDistance(v)>0.1) {
              changed = 1;
          }
      }
      if (changed) {
          this.loadFromVerts();
      }
    }
     loadFromPosSize() {
      if (this.floating&&this._verts.length>0) {
          let p=this.pos, s=this.size;
          this._verts[0].loadXY(p[0], p[1]);
          this._verts[1].loadXY(p[0], p[1]+s[1]);
          this._verts[2].loadXY(p[0]+s[0], p[1]+s[1]);
          this._verts[3].loadXY(p[0]+s[0], p[1]);
          for (let border of this._borders) {
              border.setCSS();
          }
          this.setCSS();
          return ;
      }
      let screen=this.getScreen();
      if (!screen)
        return ;
      for (let b of this._borders) {
          screen.freeBorder(b);
      }
      this.makeBorders(screen);
      this.setCSS();
      return this;
    }
     loadFromVerts() {
      if (this._verts.length==0) {
          return ;
      }
      let min=new Vector2([1e+17, 1e+17]);
      let max=new Vector2([-1e+17, -1e+17]);
      for (let v of this._verts) {
          min.min(v);
          max.max(v);
      }
      this.pos[0] = min[0];
      this.pos[1] = min[1];
      this.size[0] = max[0]-min[0];
      this.size[1] = max[1]-min[1];
      this.setCSS();
      return this;
    }
     on_resize(size, oldsize) {
      super.on_resize(size, oldsize);
      if (this.area!==undefined) {
          this.area.on_resize(size, oldsize);
      }
    }
     makeBorders(screen) {
      this._borders.length = 0;
      this._verts.length = 0;
      let p=this.pos, s=this.size;
      let vs=[new Vector2([p[0], p[1]]), new Vector2([p[0], p[1]+s[1]]), new Vector2([p[0]+s[0], p[1]+s[1]]), new Vector2([p[0]+s[0], p[1]])];
      let floating=this.floating;
      for (let i=0; i<vs.length; i++) {
          vs[i] = snap(vs[i]);
          vs[i] = screen.getScreenVert(vs[i], i, floating);
          this._verts.push(vs[i]);
      }
      for (let i=0; i<vs.length; i++) {
          let v1=vs[i], v2=vs[(i+1)%vs.length];
          let b=screen.getScreenBorder(this, v1, v2, i);
          for (let j=0; j<2; j++) {
              let v=j ? b.v2 : b.v1;
              if (v.sareas.indexOf(this)<0) {
                  v.sareas.push(this);
              }
          }
          if (b.sareas.indexOf(this)<0) {
              b.sareas.push(this);
          }
          this._borders.push(b);
          b.movable = screen.isBorderMovable(b);
      }
      return this;
    }
     setCSS() {
      this.style["position"] = UIBase.PositionKey;
      this.style["left"] = this.pos[0]+"px";
      this.style["top"] = this.pos[1]+"px";
      this.style["width"] = this.size[0]+"px";
      this.style["height"] = this.size[1]+"px";
      this.style["overflow"] = "hidden";
      this.style["contain"] = "layout";
      if (this.area!==undefined) {
          this.area.setCSS();
      }
    }
     appendChild(child) {
      if (__instance_of(child, Area)) {
          let def=child.constructor.define();
          let existing=this.editormap[def.areaname];
          if (existing&&existing!==child) {
              console.warn("Warning, replacing an exising editor instance", child, existing);
              if (this.area===existing) {
                  this.area = child;
              }
              existing.remove();
              this.editormap[def.areaname] = child;
          }
          child.ctx = this.ctx;
          child.pos = this.pos;
          child.size = this.size;
          if (this.editors.indexOf(child)<0) {
              this.editors.push(child);
          }
          child.owning_sarea = undefined;
          if (this.area===undefined) {
              this.area = child;
          }
      }
      super.appendChild(child);
      if (__instance_of(child, ui_base.UIBase)) {
          child.parentWidget = this;
          child.onadd();
      }
    }
     switch_editor(cls) {
      return this.switchEditor(cls);
    }
     switchEditor(cls) {
      let def=cls.define();
      let name=def.areaname;
      if (!(name in this.editormap)) {
          this.editormap[name] = UIBase.createElement(def.tagname);
          this.editormap[name].ctx = this.ctx;
          this.editormap[name].parentWidget = this;
          this.editormap[name].owning_sarea = this;
          this.editormap[name].inactive = false;
          this.editors.push(this.editormap[name]);
      }
      if (this.area) {
          this.area.pos = new Vector2(this.area.pos);
          this.area.size = new Vector2(this.area.size);
          this.area.owning_sarea = undefined;
          this.area.inactive = true;
          this.area.push_ctx_active();
          this.area._init();
          this.area.on_area_inactive();
          this.area.pop_ctx_active();
          this.area.remove();
      }
      else {
        this.area = undefined;
      }
      this.area = this.editormap[name];
      this.area.inactive = false;
      this.area.parentWidget = this;
      this.area.pos = this.pos;
      this.area.size = this.size;
      this.area.owning_sarea = this;
      this.area.ctx = this.ctx;
      this.area.packflag|=this.packflag;
      this.shadow.appendChild(this.area);
      this.area.style["width"] = "100%";
      this.area.style["height"] = "100%";
      this.area.push_ctx_active();
      this.area._init();
      this.area.on_resize(this.size, this.size);
      this.area.pop_ctx_active();
      this.area.push_ctx_active();
      this.area.on_area_active();
      this.area.pop_ctx_active();
      this.regenTabOrder();
    }
     _checkWrangler() {
      if (this.ctx)
        contextWrangler._checkWrangler(this.ctx);
    }
     update() {
      this._checkWrangler();
      super.update();
      if (this.area!==undefined) {
          this.area.owning_sarea = this;
          this.area.parentWidget = this;
          this.area.size = this.size;
          this.area.pos = this.pos;
          let screen=this.getScreen();
          let oldsize=[this.size[0], this.size[1]];
          let moved=screen ? screen.checkAreaConstraint(this, true) : 0;
          if (moved) {
              if (cconst.DEBUG.areaConstraintSolver) {
                  console.log("screen constraint solve", moved, this.area.minSize, this.area.maxSize, this.area.tagName, this.size);
              }
              screen.solveAreaConstraints();
              screen.regenBorders();
              this.on_resize(oldsize);
          }
          this.area.push_ctx_active(true);
      }
      this._forEachChildWidget((n) =>        {
        n.update();
      });
      if (this.area!==undefined) {
          this.area.pop_ctx_active(true);
      }
    }
     appendChild(ch) {
      if (__instance_of(ch, Area)) {
          this.editors.push(ch);
          this.editormap[ch.constructor.define().areaname] = ch;
      }
      else {
        super.appendChild(ch);
      }
    }
     removeChild(ch) {
      if (__instance_of(ch, Area)) {
          ch.owining_sarea = undefined;
          ch.pos = undefined;
          ch.size = undefined;
          if (this.area===ch&&this.editors.length>1) {
              let i=(this.editors.indexOf(ch)+1)%this.editors.length;
              this.switchEditor(this.editors[i].constructor);
          }
          else 
            if (this.area===ch) {
              this.editors = [];
              this.editormap = {};
              this.area = undefined;
              ch.remove();
              return ;
          }
          let areaname=ch.constructor.define().areaname;
          this.editors.remove(ch);
          delete this.editormap[areaname];
          ch.parentWidget = undefined;
      }
      else {
        return super.removeChild(ch);
      }
    }
     afterSTRUCT() {
      for (let area of this.editors) {
          area.pos = this.pos;
          area.size = this.size;
          area.owning_sarea = this;
          area.push_ctx_active();
          area._ctx = this.ctx;
          area.afterSTRUCT();
          area.pop_ctx_active();
      }
    }
     loadSTRUCT(reader) {
      reader(this);
      this.pos = new Vector2(this.pos);
      this.size = new Vector2(this.size);
      let editors=[];
      for (let area of this.editors) {
          if (!area.constructor||!area.constructor.define||area.constructor===Area) {
              continue;
          }
          let areaname=area.constructor.define().areaname;
          area.inactive = true;
          area.owning_sarea = undefined;
          this.editormap[areaname] = area;
          if (areaname===this.area) {
              this.area = area;
          }
          area.parentWidget = this;
          editors.push(area);
      }
      this.editors = editors;
      if (typeof this.area!=="object") {
          let area=this.editors[0];
          console.warn("Failed to find active area!", this.area);
          if (typeof area!=="object") {
              for (let k in areaclasses) {
                  area = areaclasses[k].define().tagname;
                  area = UIBase.createElement(area);
                  let areaname=area.constructor.define().areaname;
                  this.editors.push(area);
                  this.editormap[areaname] = area;
                  break;
              }
          }
          if (area) {
              this.area = area;
          }
      }
      if (this.area!==undefined) {
          this.area.style["width"] = "100%";
          this.area.style["height"] = "100%";
          this.area.owning_sarea = this;
          this.area.parentWidget = this;
          this.area.pos = this.pos;
          this.area.size = this.size;
          this.area.inactive = false;
          this.shadow.appendChild(this.area);
          let f=() =>            {
            if (this._isDead()) {
                return ;
            }
            if (!this.ctx&&this.parentNode) {
                console.log("waiting to start. . .");
                this.doOnce(f);
                return ;
            }
            this.area.ctx = this.ctx;
            this.area._init();
            this.area.on_area_active();
            this.area.onadd();
          };
          this.doOnce(f);
      }
    }
  }
  _ESClass.register(ScreenArea);
  _es6_module.add_class(ScreenArea);
  ScreenArea = _es6_module.add_export('ScreenArea', ScreenArea);
  ScreenArea.STRUCT = `
pathux.ScreenArea { 
  pos      : vec2;
  size     : vec2;
  type     : string;
  hidden   : bool;
  editors  : array(abstract(pathux.Area));
  area     : string | this.area ? this.area.constructor.define().areaname : "";
}
`;
  nstructjs.register(ScreenArea, "pathux.ScreenArea");
  ui_base.UIBase.internalRegister(ScreenArea);
  ui_base._setAreaClass(Area);
  function setScreenClass(cls) {
    Screen = cls;
  }
  setScreenClass = _es6_module.add_export('setScreenClass', setScreenClass);
}, '/dev/fairmotion/src/path.ux/scripts/screen/ScreenArea.js');


es6_module_define('app', ["../config/const.js", "../util/util.js", "./editor.js", "../path-controller/curve/curve1d_bspline.js", "../screen/area_wrangler.js", "../path-controller/util/vectormath.js", "./icons.js", "./menubar.js", "../path-controller/controller/controller.js", "../widgets/ui_noteframe.js", "../screen/FrameManager.js", "../core/ui_base.js", "../path-controller/util/simple_events.js", "../path-controller/toolsys/toolsys.js", "./file.js", "../path-controller/util/struct.js", "./app_ops.js", "../path-controller/controller/context.js"], function _app_module(_es6_module) {
  var nstructjs=es6_import_item(_es6_module, '../path-controller/util/struct.js', 'default');
  var Context=es6_import_item(_es6_module, '../path-controller/controller/context.js', 'Context');
  var ContextOverlay=es6_import_item(_es6_module, '../path-controller/controller/context.js', 'ContextOverlay');
  var makeDerivedOverlay=es6_import_item(_es6_module, '../path-controller/controller/context.js', 'makeDerivedOverlay');
  const DataModelClasses=[];
  _es6_module.add_export('DataModelClasses', DataModelClasses);
  var ToolStack=es6_import_item(_es6_module, '../path-controller/toolsys/toolsys.js', 'ToolStack');
  var DataAPI=es6_import_item(_es6_module, '../path-controller/controller/controller.js', 'DataAPI');
  var Screen=es6_import_item(_es6_module, '../screen/FrameManager.js', 'Screen');
  var areaclasses=es6_import_item(_es6_module, '../screen/area_wrangler.js', 'areaclasses');
  var util=es6_import(_es6_module, '../util/util.js');
  var Editor=es6_import_item(_es6_module, './editor.js', 'Editor');
  var Vector2=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector2');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  class DataModel  {
    static  defineAPI(api, strct) {
      return strct;
    }
    static  register(cls) {
      if (!cls.hasOwnProperty("defineAPI")) {
      }
      DataModelClasses.push(cls);
      if (cls.hasOwnProperty("STRUCT")) {
          nstructjs.register(cls);
      }
    }
  }
  _ESClass.register(DataModel);
  _es6_module.add_class(DataModel);
  DataModel = _es6_module.add_export('DataModel', DataModel);
  class EmptyContextClass extends Context {
    static  defineAPI(api, strct) {

    }
  }
  _ESClass.register(EmptyContextClass);
  _es6_module.add_class(EmptyContextClass);
  var ui_noteframe=es6_import(_es6_module, '../widgets/ui_noteframe.js');
  function GetContextClass(ctxClass) {
    let ok=0;
    let cls=ctxClass;
    while (cls) {
      if (cls===Context) {
          ok = 1;
      }
      else 
        if (cls===ContextOverlay) {
          ok = 2;
      }
      cls = cls.__proto__;
    }
    if (ok===1) {
        return ctxClass;
    }
    let OverlayDerived;
    if (ok===2) {
        OverlayDerived = ctxClass;
    }
    else {
      OverlayDerived = makeDerivedOverlay(ctxClass);
    }
    class Overlay extends OverlayDerived {
       constructor(state) {
        super(state);
      }
      get  screen() {
        return this.state.screen;
      }
      get  api() {
        return this.state.api;
      }
      get  toolstack() {
        return this.state.toolstack;
      }
       message(msg, timeout=2500) {
        return ui_noteframe.message(this.screen, msg, timeout);
      }
       error(msg, timeout=2500) {
        return ui_noteframe.error(this.screen, msg, timeout);
      }
       warning(msg, timeout=2500) {
        return ui_noteframe.warning(this.screen, msg, timeout);
      }
       progressBar(msg, percent, color, timeout=1000) {
        return ui_noteframe.progbarNote(this.screen, msg, percent, color, timeout);
      }
    }
    _ESClass.register(Overlay);
    _es6_module.add_class(Overlay);
    Context.register(Overlay);
    return class ContextDerived extends Context {
       constructor(state) {
        super(state);
        this.pushOverlay(new Overlay(state));
      }
      static  defineAPI(api, st) {
        return Overlay.defineAPI(api, st);
      }
    }
    _ESClass.register(ContextDerived);
    _es6_module.add_class(ContextDerived);
  }
  function makeAPI(ctxClass) {
    let api=new DataAPI();
    for (let cls of DataModelClasses) {
        if (cls.defineAPI) {
            cls.defineAPI(api, api.mapStruct(cls, true));
        }
    }
    for (let k in areaclasses) {
        areaclasses[k].defineAPI(api, api.mapStruct(areaclasses[k], true));
    }
    if (ctxClass.defineAPI) {
        ctxClass.defineAPI(api, api.mapStruct(ctxClass, true));
    }
    else {
      throw new Error("Context class should have a defineAPI static method");
    }
    api.rootContextStruct = api.mapStruct(ctxClass, api.mapStruct(ctxClass, true));
    return api;
  }
  makeAPI = _es6_module.add_export('makeAPI', makeAPI);
  var Icons=es6_import_item(_es6_module, './icons.js', 'Icons');
  var loadDefaultIconSheet=es6_import_item(_es6_module, './icons.js', 'loadDefaultIconSheet');
  var IconManager=es6_import_item(_es6_module, '../core/ui_base.js', 'IconManager');
  var setIconManager=es6_import_item(_es6_module, '../core/ui_base.js', 'setIconManager');
  var setIconMap=es6_import_item(_es6_module, '../core/ui_base.js', 'setIconMap');
  var setTheme=es6_import_item(_es6_module, '../core/ui_base.js', 'setTheme');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var FileArgs=es6_import_item(_es6_module, './file.js', 'FileArgs');
  var loadFile=es6_import_item(_es6_module, './file.js', 'loadFile');
  var saveFile=es6_import_item(_es6_module, './file.js', 'saveFile');
  var HotKey=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'HotKey');
  var KeyMap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'KeyMap');
  var initSplineTemplates=es6_import_item(_es6_module, '../path-controller/curve/curve1d_bspline.js', 'initSplineTemplates');
  var MenuBarEditor=es6_import_item(_es6_module, './menubar.js', 'MenuBarEditor');
  var registerMenuBarEditor=es6_import_item(_es6_module, './menubar.js', 'registerMenuBarEditor');
  var register=es6_import_item(_es6_module, './app_ops.js', 'register');
  class StartArgs  {
     constructor() {
      this.singlePage = true;
      this.icons = Icons;
      this.iconsheet = undefined;
      this.iconSizes = [16, 24, 32, 48];
      this.iconTileSize = 32;
      this.iconsPerRow = 16;
      this.theme = undefined;
      this.registerSaveOpenOps = true;
      this.autoLoadSplineTemplates = true;
      this.showPathsInToolTips = true;
      this.enableThemeAutoUpdate = false;
      this.addHelpPickers = false;
      this.useNumSliderTextboxes = true;
      this.numSliderArrowLimit = cconst.numSliderArrowLimit;
      this.simpleNumSliders = cconst.simpleNumSliders;
    }
  }
  _ESClass.register(StartArgs);
  _es6_module.add_class(StartArgs);
  StartArgs = _es6_module.add_export('StartArgs', StartArgs);
  class SimpleScreen extends Screen {
     constructor() {
      super();
      this.keymap = new KeyMap([new HotKey("Z", ["CTRL"], () =>        {
        this.ctx.toolstack.undo(this.ctx);
      }), new HotKey("Z", ["CTRL", "SHIFT"], () =>        {
        this.ctx.toolstack.redo(this.ctx);
      })]);
    }
    static  define() {
      return {tagname: "simple-screen-x"}
    }
     init() {
      if (this.ctx.state.startArgs.registerSaveOpenOps) {
          this.keymap.add(new HotKey("S", ["CTRL"], "app.save()"));
          this.keymap.add(new HotKey("O", ["CTRL"], "app.open()"));
      }
    }
     setCSS() {
      super.setCSS();
      this.style["position"] = UIBase.PositionKey;
      this.style["left"] = this.pos[0]+"px";
      this.style["top"] = this.pos[1]+"px";
    }
  }
  _ESClass.register(SimpleScreen);
  _es6_module.add_class(SimpleScreen);
  SimpleScreen = _es6_module.add_export('SimpleScreen', SimpleScreen);
  UIBase.register(SimpleScreen);
  class AppState  {
     constructor(ctxClass, screenClass=SimpleScreen) {
      this._ctxClass = ctxClass;
      ctxClass = GetContextClass(ctxClass);
      this.startArgs = undefined;
      this.currentFileRef = undefined;
      this.ctx = new ctxClass(this);
      this.ctx._state = this;
      this.toolstack = new ToolStack();
      this.api = makeAPI(ctxClass);
      this.screenClass = screenClass;
      this.screen = undefined;
      this.fileMagic = "STRT";
      this.fileVersion = [0, 0, 1];
      this._fileExt = "data";
      this._fileExtSet = false;
      this.saveFilesInJSON = false;
      this.defaultEditorClass = undefined;
    }
    get  fileExt() {
      return this._fileExt;
    }
    set  fileExt(ext) {
      this._fileExt = ext;
      this._fileExtSet = true;
    }
     reset() {
      this.toolstack.reset();
    }
     createNewFile() {
      console.warn("appstate.createNewFile: implement me, using default hack");
      let state=new this.constructor(this.ctx._ctxClass);
      state.api = this.api;
      state.ctx = this.ctx;
      state.startArgs = this.startArgs;
      state.saveFilesInJSON = this.saveFilesInJSON;
      state.toolstack = this.toolstack;
      state.toolstack.reset();
      this.screen.unlisten();
      this.screen.remove();
      for (let k in state) {
          this[k] = state[k];
      }
      this.makeScreen();
    }
     saveFileSync(objects, args={}) {
      args = new FileArgs(Object.assign({magic: this.fileMagic, 
     version: this.fileVersion, 
     ext: this.fileExt}, args));
      return saveFile(this, args, objects);
    }
     saveFile(objects, args={}) {
      args = new FileArgs(Object.assign({magic: this.fileMagic, 
     version: this.fileVersion, 
     ext: this.fileExt}, args));
      return new Promise((accept, reject) =>        {
        accept(this.saveFileSync(objects, args));
      });
    }
     loadFileSync(data, args={}) {
      args = new FileArgs(Object.assign({magic: this.fileMagic, 
     version: this.fileVersion, 
     ext: this.fileExt}, args));
      let ret=loadFile(this, args, data);
      if (args.doScreen) {
          try {
            this.ensureMenuBar();
          }
          catch (error) {
              console.error(error.stack);
              console.error(error.message);
              console.error("Failed to add menu bar");
          }
          this.screen.completeSetCSS();
          this.screen.completeUpdate();
      }
      return ret;
    }
     loadFile(data, args={}) {
      return new Promise((accept, reject) =>        {
        accept(this.loadFileSync(data, args));
      });
    }
     ensureMenuBar() {
      let screen=this.screen;
      let ok=false;
      for (let sarea of screen.sareas) {
          if (__instance_of(sarea.area, MenuBarEditor)) {
              ok = true;
              break;
          }
      }
      if (ok) {
          return ;
      }
      if (!Editor.makeMenuBar) {
          return ;
      }
      screen.update();
      let sarea=UIBase.createElement("screenarea-x");
      screen.appendChild(sarea);
      let h=55;
      let min=new Vector2().addScalar(1e+17);
      let max=new Vector2().addScalar(-1e+17);
      let tmp=new Vector2();
      for (let sarea2 of screen.sareas) {
          if (sarea2===sarea) {
              continue;
          }
          min.min(sarea2.pos);
          tmp.load(sarea2.pos).add(sarea2.size);
          max.max(tmp);
      }
      let scale=(max[1]-min[1]-h)/(max[1]-min[1]);
      for (let sarea2 of screen.sareas) {
          if (sarea2===sarea) {
              continue;
          }
          sarea2.pos[1]*=scale;
          sarea2.size[1]*=scale;
          sarea2.pos[1]+=h;
      }
      sarea.pos.zero();
      sarea.size[0] = screen.size[0];
      sarea.size[1] = h;
      screen.regenScreenMesh();
      screen.snapScreenVerts();
      sarea.switch_editor(MenuBarEditor);
      screen.solveAreaConstraints();
      screen.completeSetCSS();
      screen.completeUpdate();
    }
     makeScreen() {
      if (this.screen) {
          this.screen.unlisten();
          this.screen.remove();
      }
      let screen=this.screen = UIBase.createElement(this.screenClass.define().tagname);
      let sarea=UIBase.createElement("screenarea-x");
      screen.ctx = this.ctx;
      sarea.ctx = this.ctx;
      document.body.appendChild(screen);
      let cls=this.defaultEditorClass;
      if (!cls) {
          for (let k in areaclasses) {
              cls = areaclasses[k];
              if (cls!==MenuBarEditor) {
                  break;
              }
          }
      }
      sarea.switch_editor(cls);
      screen.appendChild(sarea);
      screen._init();
      screen.listen();
      screen.update();
      screen.completeSetCSS();
      screen.completeUpdate();
      if (Editor.makeMenuBar) {
          this.ensureMenuBar();
      }
    }
     start(args=new StartArgs()) {
      let args2=new StartArgs();
      let methodsCheck=["saveFile", "createNewFile", "loadFile"];
      for (let method of methodsCheck) {
          let m1=AppState.prototype[method];
          let m2=this[method];
          if (m1===m2) {
              console.warn(`Warning: it is recommended to override .${method} when subclassing simple.AppState`);
          }
      }
      document.body.style["touch-action"] = "none";
      registerMenuBarEditor();
      for (let k in args2) {
          if (args[k]===undefined) {
              args[k] = args2[k];
          }
      }
      if (args.registerSaveOpenOps) {
          register();
      }
      if (!args.iconsheet) {
          args.iconsheet = loadDefaultIconSheet();
      }
      this.startArgs = args;
      cconst.loadConstants(args);
      if (args.autoLoadSplineTemplates) {
          initSplineTemplates();
      }
      let sizes=[];
      let images=[];
      for (let size of args.iconSizes) {
          sizes.push([args.iconTileSize, size]);
          images.push(args.iconsheet);
      }
      window.iconsheet = args.iconsheet;
      let iconManager=new IconManager(images, sizes, args.iconsPerRow);
      setIconManager(iconManager);
      setIconMap(args.icons);
      if (args.theme) {
          setTheme(args.theme);
      }
      document.body.style["margin"] = "0px";
      document.body.style["padding"] = "0px";
      if (args.singlePage) {
          document.body.style["overflow"] = "hidden";
      }
      this.makeScreen();
      Object.defineProperty(window, "C", {get: function get() {
          return this._appstate.ctx;
        }});
      nstructjs.validateStructs();
      if (this.saveFilesInJSON&&!this._fileExtSet) {
          this._fileExt = "json";
      }
      if (this._fileExt.startsWith(".")) {
          this._fileExt = this._fileExt.slice(1, this._fileExt.length).trim();
      }
    }
  }
  _ESClass.register(AppState);
  _es6_module.add_class(AppState);
  AppState = _es6_module.add_export('AppState', AppState);
}, '/dev/fairmotion/src/path.ux/scripts/simple/app.js');


es6_module_define('app_ops', ["../widgets/ui_noteframe.js", "../path-controller/toolsys/toolsys.js", "../platforms/platform.js", "../path-controller/toolsys/toolprop.js"], function _app_ops_module(_es6_module) {
  var platform=es6_import(_es6_module, '../platforms/platform.js');
  var ToolOp=es6_import_item(_es6_module, '../path-controller/toolsys/toolsys.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../path-controller/toolsys/toolsys.js', 'UndoFlags');
  var ToolProperty=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'ToolProperty');
  var BoolProperty=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'BoolProperty');
  var StringProperty=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'StringProperty');
  var sendNote=es6_import_item(_es6_module, '../widgets/ui_noteframe.js', 'sendNote');
  var error=es6_import_item(_es6_module, '../widgets/ui_noteframe.js', 'error');
  var warning=es6_import_item(_es6_module, '../widgets/ui_noteframe.js', 'warning');
  var message=es6_import_item(_es6_module, '../widgets/ui_noteframe.js', 'message');
  class SimpleAppNewOp extends ToolOp {
    static  tooldef() {
      return {uiname: "New", 
     toolpath: "app.new", 
     inputs: {}, 
     undoflag: UndoFlags.NO_UNDO}
    }
     exec(ctx) {
      _appstate.createNewFile();
    }
  }
  _ESClass.register(SimpleAppNewOp);
  _es6_module.add_class(SimpleAppNewOp);
  SimpleAppNewOp = _es6_module.add_export('SimpleAppNewOp', SimpleAppNewOp);
  class SimpleAppSaveOp extends ToolOp {
    static  tooldef() {
      return {uiname: "Save", 
     toolpath: "app.save", 
     inputs: {forceDialog: new BoolProperty()}, 
     undoflag: UndoFlags.NO_UNDO}
    }
     exec(ctx) {
      let ext=_appstate.fileExt;
      let useJSON=_appstate.startArgs.saveFilesInJSON;
      _appstate.saveFile({doScreen: true, 
     useJSON: useJSON, 
     fromFileOp: true}).then((data) =>        {
        function save() {
          return data;
        }
        platform.platform.showSaveDialog("Save As", save, {multi: false, 
      addToRecentList: true, 
      filters: [{name: "File", 
       mime: useJSON ? "text/json" : "application/x-octet-stream", 
       extensions: ["."+ext.toLowerCase()]}]}).then((path) =>          {
          _appstate.currentFileRef = path;
          message("File saved");
        }).catch((err) =>          {
          if (typeof err==="object"&&err.message) {
              err = err.message;
          }
          error("Failed to save file "+err);
        });
      });
    }
  }
  _ESClass.register(SimpleAppSaveOp);
  _es6_module.add_class(SimpleAppSaveOp);
  SimpleAppSaveOp = _es6_module.add_export('SimpleAppSaveOp', SimpleAppSaveOp);
  class SimpleAppOpenOp extends ToolOp {
    static  tooldef() {
      return {uiname: "Open", 
     toolpath: "app.open", 
     inputs: {forceDialog: new BoolProperty()}, 
     undoflag: UndoFlags.NO_UNDO}
    }
     exec(ctx) {
      let ext=_appstate.fileExt;
      let useJSON=_appstate.startArgs.saveFilesInJSON;
      let mime=useJSON ? "text/json" : "application/x-octet-stream";
      platform.platform.showOpenDialog("Open File", {multi: false, 
     addToRecentList: true, 
     filters: [{name: "File", 
      mime: mime, 
      extensions: ["."+ext.toLowerCase()]}]}).then((paths) =>        {
        for (let path of paths) {
            platform.platform.readFile(path, mime).then((data) =>              {
              console.log("got data!", data);
              _appstate.loadFile(data, {useJSON: useJSON, 
         doScreen: true, 
         fromFileOp: true}).catch((err) =>                {
                error("File error: "+err.message);
              });
            });
        }
      }).catch((error) =>        {
        ctx.error(error.message);
      });
    }
  }
  _ESClass.register(SimpleAppOpenOp);
  _es6_module.add_class(SimpleAppOpenOp);
  SimpleAppOpenOp = _es6_module.add_export('SimpleAppOpenOp', SimpleAppOpenOp);
  function register() {
    ToolOp.register(SimpleAppSaveOp);
    ToolOp.register(SimpleAppOpenOp);
    ToolOp.register(SimpleAppNewOp);
  }
  register = _es6_module.add_export('register', register);
}, '/dev/fairmotion/src/path.ux/scripts/simple/app_ops.js');


es6_module_define('context_class', [], function _context_class_module(_es6_module) {
  class SimpleContext  {
     constructor() {

    }
    static  getContextClass() {
      let props={};
      let rec=(cls) =>        {
        let prototype=cls.prototype;
        if (cls.__proto__!==Object.__proto__) {
            rec(cls);
        }
        for (let k in cls) {
            let descr=Object.getOwnPropertyDescriptor(prototype, k);
            if (descr) {
                props[k] = descr;
            }
        }
      };
      console.log(props);
      for (let k in props) {
          if (k.search("_save")>=0||k.search("_load")>=0) {
              continue;
          }
      }
    }
  }
  _ESClass.register(SimpleContext);
  _es6_module.add_class(SimpleContext);
  SimpleContext = _es6_module.add_export('SimpleContext', SimpleContext);
}, '/dev/fairmotion/src/path.ux/scripts/simple/context_class.js');


es6_module_define('editor', ["../core/ui.js", "../util/util.js", "../core/ui_base.js", "../screen/ScreenArea.js", "../path-controller/controller.js"], function _editor_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../screen/ScreenArea.js', 'Area');
  var contextWrangler=es6_import_item(_es6_module, '../screen/ScreenArea.js', 'contextWrangler');
  var nstructjs=es6_import_item(_es6_module, '../path-controller/controller.js', 'nstructjs');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var parsepx=es6_import_item(_es6_module, '../core/ui_base.js', 'parsepx');
  var Icons=es6_import_item(_es6_module, '../core/ui_base.js', 'Icons');
  var util=es6_import(_es6_module, '../util/util.js');
  let sidebar_hash=new util.HashDigest();
  class SideBar extends Container {
     constructor() {
      super();
      this.header = this.row();
      this.header.style["height"] = "45px";
      this._last_resize_key = undefined;
      this._closed = false;
      this.closeIcon = this.header.iconbutton(Icons.RIGHT_ARROW, "Close/Open sidebar", () =>        {
        console.log("click!");
        this.closed = !this._closed;
      });
      this._openWidth = undefined;
      this.needsSetCSS = true;
      this.tabbar = this.tabs("left");
    }
     saveData() {
      return {closed: this.closed}
    }
     loadData(obj) {
      this.closed = obj.closed;
    }
    set  closed(val) {
      if (!!this._closed===!!val) {
          return ;
      }
      if (this._openWidth===undefined&&!this._closed&&val) {
          this._openWidth = this.width;
      }
      console.log("animate!");
      let w=val ? 50 : this._openWidth;
      this.animate().goto("width", w, 500);
      if (val) {
          this.closeIcon.icon = Icons.LEFT_ARROW;
      }
      else {
        this.closeIcon.icon = Icons.RIGHT_ARROW;
      }
      this._closed = val;
    }
    get  closed() {
      return this._closed;
    }
    get  width() {
      return parsepx(""+this.getAttribute("width"));
    }
    set  width(val) {
      this.setAttribute("width", ""+val+"px");
      this.update();
    }
    get  height() {
      return parsepx(""+this.getAttribute("height"));
    }
    set  height(val) {
      this.setAttribute("height", ""+val+"px");
      this.update();
    }
    static  define() {
      return {tagname: "sidebar-base-x", 
     style: "sidebar"}
    }
     tab(name) {
      return this.tabbar.tab(name);
    }
     init() {
      super.init();
      let closed=this._closed;
      this._closed = false;
      if (!this.getAttribute("width")) {
          this.width = 300;
      }
      if (!this.getAttribute("height")) {
          this.height = 700;
      }
      this.setCSS();
      if (closed) {
          this.closed = true;
      }
    }
     setCSS() {
      if (!this.parentWidget) {
          return ;
      }
      let editor=this.parentWidget;
      if (!editor.pos||!editor.size) {
          return ;
      }
      this.needsSetCSS = false;
      let w=this.width, h=this.height;
      w = isNaN(w) ? 500 : w;
      h = isNaN(h) ? 500 : h;
      h = Math.min(h, editor.size[1]-25);
      this.style["position"] = "absolute";
      this.style["width"] = w+"px";
      this.style["height"] = h+"px";
      this.style["z-index"] = "100";
      this.style["overflow"] = "scroll";
      this.style["background-color"] = this.getDefault("AreaHeaderBG");
      this.tabbar.style["height"] = (h-45)+"px";
      this.style["left"] = (editor.size[0]-w)+"px";
    }
     update() {
      sidebar_hash.reset();
      sidebar_hash.add(this.width);
      sidebar_hash.add(this.height);
      let key=sidebar_hash.get();
      if (key!==this._last_resize_key) {
          this._last_resize_key = key;
          this.needsSetCSS = true;
      }
      if (this.needsSetCSS) {
          this.setCSS();
      }
    }
  }
  _ESClass.register(SideBar);
  _es6_module.add_class(SideBar);
  SideBar = _es6_module.add_export('SideBar', SideBar);
  UIBase.register(SideBar);
  class Editor extends Area {
     constructor() {
      super();
      this.container = UIBase.createElement("container-x");
      this.container.parentWidget = this;
      this.shadow.appendChild(this.container);
    }
    static  define() {
      return {areaname: "areaname", 
     tagname: "tagname-x"}
    }
    static  defineAPI(api, strct) {
      return strct;
    }
    static  registerAppMenu(makeMenuBar) {
      if (this!==Editor) {
          throw new Error("must call registerAppMenu from simple.Editor base class");
      }
      this.makeMenuBar = makeMenuBar;
    }
    static  register(cls) {
      if (!cls.hasOwnProperty("define")) {
          throw new Error("missing define() method");
      }
      if (!cls.hasOwnProperty("STRUCT")) {
          cls.STRUCT = nstructjs.inherit(cls, this)+`\n}`;
      }
      super.register(cls);
      nstructjs.register(cls);
    }
     makeSideBar() {
      if (this.sidebar) {
          this.sidebar.remove();
      }
      let sidebar=this.sidebar = UIBase.createElement("sidebar-base-x");
      sidebar.parentWidget = this;
      sidebar.ctx = this.ctx;
      this.shadow.appendChild(sidebar);
      if (this.ctx) {
          sidebar._init();
          this.sidebar.flushSetCSS();
          this.sidebar.flushUpdate();
      }
      return this.sidebar;
    }
     on_resize(size, oldsize) {
      super.on_resize(size, oldsize);
      if (this.sidebar) {
          if (this.ctx&&this.pos) {
              this.sidebar.setCSS();
          }
          else {
            this.sidebar.needsSetCSS = true;
          }
      }
    }
    static  findEditor(cls) {
      return contextWrangler.getLastArea(cls);
    }
     getScreen() {
      return this.ctx.screen;
    }
     init() {
      super.init();
      this.makeHeader(this.container);
    }
     makeHeader(container, add_note_area=true, make_draggable=true) {
      return super.makeHeader(container, add_note_area, make_draggable);
    }
     update() {
      super.update();
    }
     setCSS() {
      super.setCSS();
    }
  }
  _ESClass.register(Editor);
  _es6_module.add_class(Editor);
  Editor = _es6_module.add_export('Editor', Editor);
}, '/dev/fairmotion/src/path.ux/scripts/simple/editor.js');


es6_module_define('file', ["../path-controller/util/struct.js", "../core/ui_base.js"], function _file_module(_es6_module) {
  var nstructjs=es6_import_item(_es6_module, '../path-controller/util/struct.js', 'default');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  class FileHeader  {
     constructor(version, magic, flags) {
      this.magic = magic;
      this.flags = flags;
      this.version_major = version ? version[0] : 0;
      this.version_minor = version ? version[1] : 0;
      this.version_micro = version ? version[2] : 0;
      this.schema = nstructjs.write_scripts();
    }
  }
  _ESClass.register(FileHeader);
  _es6_module.add_class(FileHeader);
  FileHeader = _es6_module.add_export('FileHeader', FileHeader);
  FileHeader.STRUCT = `
simple.FileHeader {
  magic         : static_string[4];
  version_major : short;
  version_minor : short;
  version_micro : short;
  flags         : short;
  schema        : string; 
}
`;
  nstructjs.register(FileHeader);
  class FileFull extends FileHeader {
     constructor(version, magic, flags) {
      super(version, magic, flags);
      this.objects = [];
    }
  }
  _ESClass.register(FileFull);
  _es6_module.add_class(FileFull);
  FileFull = _es6_module.add_export('FileFull', FileFull);
  FileFull.STRUCT = nstructjs.inherit(FileFull, FileHeader)+`
  objects : array(abstract(Object));
  screen  : abstract(Object);
}
`;
  nstructjs.register(FileFull);
  class FileArgs  {
     constructor(args={}) {
      this.ext = args.ext||".data";
      this.magic = args.magic||"STRT";
      this.doScreen = args.doScreen!==undefined ? args.doScreen : true;
      this.resetOnLoad = args.resetOnLoad!==undefined ? args.resetOnLoad : true;
      this.useJSON = args.useJSON!==undefined ? args.useJSON : false;
      this.version = args.version!==undefined ? args.version : 0;
      this.fileFlags = args.fileFlags!==undefined ? args.fileFlags : 0;
      this.fromFileOp = false;
    }
  }
  _ESClass.register(FileArgs);
  _es6_module.add_class(FileArgs);
  FileArgs = _es6_module.add_export('FileArgs', FileArgs);
  class EmptyStruct  {
  }
  _ESClass.register(EmptyStruct);
  _es6_module.add_class(EmptyStruct);
  EmptyStruct = _es6_module.add_export('EmptyStruct', EmptyStruct);
  EmptyStruct.STRUCT = `
EmptyStruct {
}
`;
  nstructjs.register(EmptyStruct);
  function saveFile(appstate, args, objects) {
    if (args.useJSON===undefined) {
        args.useJSON = appstate.saveFilesInJSON;
    }
    args = new FileArgs(args);
    let version=args.version;
    if (typeof version==="number") {
        if (version===Math.floor(version)) {
            version = [version, 0, 0];
        }
        else {
          let major=~~version;
          let minor=~~(Math.fract(version)*10.0);
          let micro=(Math.fract(version)-minor)*100.0;
          version = [major, minor, micro];
        }
    }
    let file=new FileFull(version, args.magic, args.fileFlags);
    if (args.doScreen) {
        file.screen = appstate.screen;
    }
    else {
      file.screen = new EmptyStruct();
    }
    for (let ob of objects) {
        file.objects.push(ob);
    }
    if (args.useJSON) {
        return nstructjs.writeJSON(file);
    }
    else {
      let data=[];
      nstructjs.writeObject(data, file);
      return (new Uint8Array(data)).buffer;
    }
  }
  saveFile = _es6_module.add_export('saveFile', saveFile);
  function loadFile(appstate, args, data) {
    let header;
    if (args.useJSON===undefined) {
        args.useJSON = appstate.saveFilesInJSON;
    }
    args = new FileArgs(args);
    if (!args.useJSON) {
        if (__instance_of(data, Array)) {
            data = (new Uint8Array(data)).buffer;
        }
        if (__instance_of(data, Uint8Array)) {
            data = data.buffer;
        }
        if (__instance_of(data, ArrayBuffer)) {
            data = new DataView(data);
        }
        header = nstructjs.readObject(data, FileHeader);
    }
    else {
      if (typeof data==="string") {
          data = JSON.parse(data);
      }
      header = nstructjs.readJSON(data, FileHeader);
    }
    if (header.magic!==args.magic) {
        throw new Error("invalid file");
    }
    let istruct=new nstructjs.STRUCT();
    istruct.parse_structs(header.schema);
    let ret;
    if (!args.useJSON) {
        ret = istruct.readObject(data, FileFull);
    }
    else {
      ret = istruct.readJSON(data, FileFull);
    }
    if (args.resetOnLoad) {
        appstate.reset();
    }
    if (args.doScreen) {
        if (appstate.screen) {
            appstate.screen.unlisten();
            appstate.screen.remove();
        }
        ret.screen.ctx = appstate.ctx;
        if (!(__instance_of(ret.screen, appstate.screenClass))) {
            let screen=UIBase.createElement(appstate.screenClass.define().tagname);
            screen.ctx = appstate.ctx;
            for (let sarea of ret.screen.sareas) {
                screen.appendChild(sarea);
                sarea.area.afterSTRUCT();
                sarea.area.on_fileload();
            }
            ret.screen = screen;
        }
        appstate.screen = ret.screen;
        document.body.appendChild(appstate.screen);
        appstate.screen.listen();
    }
    return ret;
  }
  loadFile = _es6_module.add_export('loadFile', loadFile);
}, '/dev/fairmotion/src/path.ux/scripts/simple/file.js');


es6_module_define('icons', ["./iconsheet.js"], function _icons_module(_es6_module) {
  "use strict";
  var iconSvg=es6_import_item(_es6_module, './iconsheet.js', 'iconSvg');
  const Icons={FOLDER: 0, 
   FILE: 1, 
   TINY_X: 2, 
   SMALL_PLUS: 3, 
   SMALL_MINUS: 4, 
   UNDO: 5, 
   REDO: 6, 
   HELP: 7, 
   ENUM_UNCHECKED: 8, 
   ENUM_CHECKED: 9, 
   LARGE_CHECK: 10, 
   CURSOR_ARROW: 11, 
   NOTE_EXCL: 12, 
   SCROLL_DOWN: 13, 
   SCROLL_UP: 14, 
   BACKSPACE: 15, 
   LEFT_ARROW: 16, 
   RIGHT_ARROW: 17, 
   UI_EXPAND: 18, 
   UI_COLLAPSE: 19, 
   BOLD: 20, 
   ITALIC: 21, 
   UNDERLINE: 22, 
   STRIKETHRU: 23, 
   TREE_EXPAND: 24, 
   TREE_COLLAPSE: 25, 
   ZOOM_OUT: 26, 
   ZOOM_IN: 27}
  _es6_module.add_export('Icons', Icons);
  function loadDefaultIconSheet() {
    let iconSheet=document.createElement("img");
    iconSheet.src = iconSvg;
    return iconSheet;
  }
  loadDefaultIconSheet = _es6_module.add_export('loadDefaultIconSheet', loadDefaultIconSheet);
}, '/dev/fairmotion/src/path.ux/scripts/simple/icons.js');

