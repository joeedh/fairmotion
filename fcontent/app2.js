es6_module_define('parseutil', [], function _parseutil_module(_es6_module) {
  "use strict";
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
     toString() {
      if (this.value!=undefined)
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
     constructor(msg) {
      super();
    }
  }
  _ESClass.register(PUTLParseError);
  _es6_module.add_class(PUTLParseError);
  PUTLParseError = _es6_module.add_export('PUTLParseError', PUTLParseError);
  class lexer  {
    
    
    
    
    
    
    
     constructor(tokdef, errfunc) {
      this.tokdef = tokdef;
      this.tokens = new GArray();
      this.lexpos = 0;
      this.lexdata = "";
      this.lineno = 0;
      this.errfunc = errfunc;
      this.tokints = {};
      for (var i=0; i<tokdef.length; i++) {
          this.tokints[tokdef[i].name] = i;
      }
      this.statestack = [["__main__", 0]];
      this.states = {"__main__": [tokdef, errfunc]};
      this.statedata = 0;
    }
     add_state(name, tokdef, errfunc) {
      if (errfunc==undefined) {
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
      var item=this.statestack[this.statestack.length-1];
      var state=this.states[item[0]];
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
      this.tokens = new GArray();
      this.peeked_tokens = [];
    }
     error() {
      if (this.errfunc!=undefined&&!this.errfunc(this))
        return ;
      console.log("Syntax error near line "+this.lineno);
      var next=Math.min(this.lexpos+8, this.lexdata.length);
      console.log("  "+this.lexdata.slice(this.lexpos, next));
      throw new PUTLParseError("Parse error");
    }
     peek() {
      var tok=this.next(true);
      if (tok==undefined)
        return undefined;
      this.peeked_tokens.push(tok);
      return tok;
    }
     peek_i(i) {
      while (this.peeked_tokens.length<=i) {
        var t=this.peek();
        if (t==undefined)
          return undefined;
      }
      return this.peeked_tokens[i];
    }
     at_end() {
      return this.lexpos>=this.lexdata.length&&this.peeked_tokens.length==0;
    }
     next(ignore_peek) {
      if (ignore_peek!=true&&this.peeked_tokens.length>0) {
          var tok=this.peeked_tokens[0];
          this.peeked_tokens.shift();
          return tok;
      }
      if (this.lexpos>=this.lexdata.length)
        return undefined;
      var ts=this.tokdef;
      var tlen=ts.length;
      var lexdata=this.lexdata.slice(this.lexpos, this.lexdata.length);
      var results=[];
      for (var i=0; i<tlen; i++) {
          var t=ts[i];
          if (t.re==undefined)
            continue;
          var res=t.re.exec(lexdata);
          if (res!=null&&res!=undefined&&res.index==0) {
              results.push([t, res]);
          }
      }
      var max_res=0;
      var theres=undefined;
      for (var i=0; i<results.length; i++) {
          var res=results[i];
          if (res[1][0].length>max_res) {
              theres = res;
              max_res = res[1][0].length;
          }
      }
      if (theres==undefined) {
          this.error();
          return ;
      }
      var def=theres[0];
      var lexlen=max_res;
      var tok=new token(def.name, theres[1][0], this.lexpos, lexlen, this.lineno, this, undefined);
      this.lexpos+=max_res;
      if (def.func) {
          tok = def.func(tok);
          if (tok==undefined) {
              return this.next();
          }
      }
      return tok;
    }
  }
  _ESClass.register(lexer);
  _es6_module.add_class(lexer);
  lexer = _es6_module.add_export('lexer', lexer);
  class parser  {
     constructor(lexer, errfunc) {
      this.lexer = lexer;
      this.errfunc = errfunc;
      this.start = undefined;
    }
     parse(data, err_on_unconsumed) {
      if (err_on_unconsumed==undefined)
        err_on_unconsumed = true;
      if (data!=undefined)
        this.lexer.input(data);
      var ret=this.start(this);
      if (err_on_unconsumed&&!this.lexer.at_end()&&this.lexer.next()!=undefined) {
          var left=this.lexer.lexdata.slice(this.lexer.lexpos-1, this.lexer.lexdata.length);
          this.error(undefined, "parser did not consume entire input; left: "+left);
      }
      return ret;
    }
     input(data) {
      this.lexer.input(data);
    }
     error(tok, msg) {
      if (msg==undefined)
        msg = "";
      if (tok==undefined)
        var estr="Parse error at end of input: "+msg;
      else 
        estr = "Parse error at line "+(tok.lineno+1)+": "+msg;
      var buf="1| ";
      var ld=this.lexer.lexdata;
      var l=1;
      for (var i=0; i<ld.length; i++) {
          var c=ld[i];
          if (c=='\n') {
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
      var tok=this.lexer.peek();
      if (tok!=undefined)
        tok.parser = this;
      return tok;
    }
     peek_i(i) {
      var tok=this.lexer.peek_i(i);
      if (tok!=undefined)
        tok.parser = this;
      return tok;
    }
     peeknext() {
      return this.peek_i(0);
    }
     next() {
      var tok=this.lexer.next();
      if (tok!=undefined)
        tok.parser = this;
      return tok;
    }
     optional(type) {
      var tok=this.peek();
      if (tok==undefined)
        return false;
      if (tok.type==type) {
          this.next();
          return true;
      }
      return false;
    }
     at_end() {
      return this.lexer.at_end();
    }
     expect(type, msg) {
      var tok=this.next();
      if (msg==undefined)
        msg = type;
      if (tok==undefined||tok.type!=type) {
          this.error(tok, "Expected "+msg+", not "+tok.type);
      }
      return tok.value;
    }
  }
  _ESClass.register(parser);
  _es6_module.add_class(parser);
  parser = _es6_module.add_export('parser', parser);
  function test_parser() {
    var basic_types=new set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string"]);
    var reserved_tokens=new set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string", "static_string", "array"]);
    function tk(name, re, func) {
      return new tokdef(name, re, func);
    }
    var tokens=[tk("ID", /[a-zA-Z]+[a-zA-Z0-9_]*/, function (t) {
      if (reserved_tokens.has(t.value)) {
          t.type = t.value.toUpperCase();
      }
      return t;
    }), tk("OPEN", /\{/), tk("CLOSE", /}/), tk("COLON", /:/), tk("JSCRIPT", /\|/, function (t) {
      var js="";
      var lexer=t.lexer;
      while (lexer.lexpos<lexer.lexdata.length) {
        var c=lexer.lexdata[lexer.lexpos];
        if (c=="\n")
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
    for (var rt of reserved_tokens) {
        tokens.push(tk(rt.toUpperCase()));
    }
    var a=`
  Loop {
    eid : int;
    flag : int;
    index : int;
    type : int;
    
    co : vec3;
    no : vec3;
    loop : int | eid(loop);
    edges : array(e, int) | e.eid;
    
    loops : array(Loop);
  }
  `;
    function errfunc(lexer) {
      return true;
    }
    var lex=new lexer(tokens, errfunc);
    console.log("Testing lexical scanner...");
    lex.input(a);
    var tok;
    while (tok = lex.next()) {
      console.log(tok.toString());
    }
    var parser=new parser(lex);
    parser.input(a);
    function p_Array(p) {
      p.expect("ARRAY");
      p.expect("LPARAM");
      var arraytype=p_Type(p);
      var itername="";
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
      var tok=p.peek();
      if (tok.type=="ID") {
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
        if (tok.type=="ARRAY") {
          return p_Array(p);
      }
      else {
        p.error(tok, "invalid type "+tok.type);
      }
    }
    function p_Field(p) {
      var field={}
      console.log("-----", p.peek().type);
      field.name = p.expect("ID", "struct field name");
      p.expect("COLON");
      field.type = p_Type(p);
      field.set = undefined;
      field.get = undefined;
      var tok=p.peek();
      if (tok.type=="JSCRIPT") {
          field.get = tok.value;
          p.next();
      }
      tok = p.peek();
      if (tok.type=="JSCRIPT") {
          field.set = tok.value;
          p.next();
      }
      p.expect("SEMI");
      return field;
    }
    function p_Struct(p) {
      var st={}
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
    var ret=p_Struct(parser);
    console.log(JSON.stringify(ret));
  }
}, '/dev/fairmotion/src/util/parseutil.js');
es6_module_define('typedwriter', [], function _typedwriter_module(_es6_module) {
  "use strict";
  class TypedCache  {
    
     constructor() {
      this.freelist = {};
    }
     get(size) {
      var lst=this.freelist[size];
      if (lst==undefined) {
          lst = this.freelist[size] = [];
      }
      if (lst.length>0) {
          return lst.pop();
      }
      else {
        lst.push(new ArrayBuffer());
        return lst.pop();
      }
    }
     free(arraybuffer) {
      var lst=this.freelist[size];
      if (lst==undefined) {
          lst = this.freelist[size] = [];
      }
      lst.insert(0, arraybuffer);
    }
  }
  _ESClass.register(TypedCache);
  _es6_module.add_class(TypedCache);
  TypedCache = _es6_module.add_export('TypedCache', TypedCache);
  var typedcache=new TypedCache();
  typedcache = _es6_module.add_export('typedcache', typedcache);
  var u8=new Uint8Array(16);
  var u16=new Uint16Array(u8.buffer);
  var i16=new Int16Array(u8.buffer);
  var u32=new Uint32Array(u8.buffer);
  var i32=new Int32Array(u8.buffer);
  var f32=new Float32Array(u8.buffer);
  var f64=new Float64Array(u8.buffer);
  class TypedWriter  {
    
    
     constructor(maxsize) {
      this.i = 0;
      this.maxsize = maxsize;
      this.buf = new Uint8Array(maxsize);
    }
     destroy() {

    }
     int8(f) {
      this.buf[this.i++] = f;
      return this;
    }
     int16(f) {
      var buf=this.buf, i=this.i;
      i16[0] = f;
      buf[i++] = u8[0];
      buf[i++] = u8[1];
      this.i = i;
      return this;
    }
     vec2(v) {
      this.float32(v[0]);
      this.float32(v[1]);
      return this;
    }
     vec3(v) {
      this.float32(v[0]);
      this.float32(v[1]);
      this.float32(v[2]);
      return this;
    }
     vec4(v) {
      this.float32(v[0]);
      this.float32(v[1]);
      this.float32(v[2]);
      this.float32(v[3]);
      return this;
    }
     final() {
      if (this.i>this.buf.length) {
          throw new Error("Exceeded maximum size of TypedWriter: "+this.i+" > "+this.buf.length);
      }
      return this.buf.buffer;
    }
     bytes(f, len=f.length) {
      var buf=this.buf, i=this.i;
      if (typeof f=="string") {
          for (var j=0; j<f.length; j++) {
              buf[i++] = f.charCodeAt(j);
          }
      }
      else {
        for (var j=0; j<f.length; j++) {
            buf[i++] = f[j];
        }
      }
      this.i = i;
      return this;
    }
     int32(f) {
      var buf=this.buf, i=this.i;
      i32[0] = f;
      buf[i++] = u8[0];
      buf[i++] = u8[1];
      buf[i++] = u8[2];
      buf[i++] = u8[3];
      this.i = i;
      return this;
    }
     uint32(f) {
      var buf=this.buf, i=this.i;
      u32[0] = f;
      buf[i++] = u8[0];
      buf[i++] = u8[1];
      buf[i++] = u8[2];
      buf[i++] = u8[3];
      this.i = i;
      return this;
    }
     float32(f) {
      var buf=this.buf, i=this.i;
      f32[0] = f;
      buf[i++] = u8[0];
      buf[i++] = u8[1];
      buf[i++] = u8[2];
      buf[i++] = u8[3];
      this.i = i;
      return this;
    }
     float64(f) {
      var buf=this.buf, i=this.i;
      f64[0] = f;
      buf[i++] = u8[0];
      buf[i++] = u8[1];
      buf[i++] = u8[2];
      buf[i++] = u8[3];
      buf[i++] = u8[4];
      buf[i++] = u8[5];
      buf[i++] = u8[6];
      buf[i++] = u8[7];
      this.i = i;
      return this;
    }
  }
  _ESClass.register(TypedWriter);
  _es6_module.add_class(TypedWriter);
  TypedWriter = _es6_module.add_export('TypedWriter', TypedWriter);
}, '/dev/fairmotion/src/util/typedwriter.js');
es6_module_define('jobs', [], function _jobs_module(_es6_module) {
  "use strict";
  var default_job_interval=1;
  class ThreadIterator  {
    
     constructor(worker) {
      this.queue = [];
      this.worker = worker;
      this.iter = {value: undefined, 
     done: false};
      this.data = undefined;
      var this2=this;
      worker.onerror = function (event) {
        console.log("worker error; event: ", event);
        this2.iter.done = true;
      };
      var this2=this;
      worker.onmessage = function (event) {
        var data=event.data.evaluated();
        console.log(data);
        if (data=="{{terminate}}") {
            this2.kill();
            return ;
        }
        this2.queue.push(data);
      };
    }
     next() {
      if (this.iter.done&&this.poll()) {
          this.data = this.get();
      }
      return this.iter;
    }
     send(msg) {
      this.worker.postMessage(data);
    }
     poll() {
      return this.queue.length;
    }
     get() {
      if (this.queue.length===0)
        return undefined;
      var msg=this.queue[0];
      this.queue.shift();
      return msg;
    }
     kill() {
      this.iter.done = true;
      this.worker.terminate();
    }
  }
  _ESClass.register(ThreadIterator);
  _es6_module.add_class(ThreadIterator);
  ThreadIterator = _es6_module.add_export('ThreadIterator', ThreadIterator);
  ThreadIterator;
  function worker_joblet(url, method, data) {
    var worker=new Worker(url);
    worker.postMessage({method: method, 
    data: data});
    var iter=new ThreadIterator(worker);
  }
  class Joblet  {
     constructor(owner, iter, destroyer, ival, start, finish) {
      if (ival==0||ival==undefined) {
          ival = default_job_interval;
      }
      if (destroyer==undefined) {
          destroyer = function (job) {
          };
      }
      this.start = start;
      this.finish = finish;
      this.ival = ival;
      this._kill = destroyer;
      this.dead = false;
      this.removed = false;
      this.type = get_type_name(iter);
      this.iter = iter;
      this.owner = owner;
      this.last_ms = time_ms(10);
      this.time_mean = new movavg();
      this._id = 0;
      this.queued = false;
    }
     kill() {
      this._kill(this);
    }
     start() {
      this.iter = new this.type;
    }
     [Symbol.keystr]() {
      return get_type_name(this)+this._id;
    }
  }
  _ESClass.register(Joblet);
  _es6_module.add_class(Joblet);
  Joblet = _es6_module.add_export('Joblet', Joblet);
  class JobManager  {
    
    
    
    
    
    
    
     constructor() {
      this.jobs = new GArray();
      this.jobmap_owners = new hashtable();
      this.jobmap_types = new hashtable();
      this.queue = new GArray();
      this.idgen = 0;
      this.last_ms = time_ms();
      this.ival = default_job_interval;
      this.host_mean = new movavg(10);
      this.time_perc = 0.3;
    }
     add_job(job) {
      var owner=job.owner;
      var type=job.type;
      job._id = this.idgen++;
      this.jobs.push(job);
      if (!this.jobmap_owners.has(owner))
        this.jobmap_owners.add(owner, new GArray());
      if (!this.jobmap_types.has(type))
        this.jobmap_types.add(type, new GArray());
      var type=job.type;
      this.jobmap_owners.get(owner).push(job);
      this.jobmap_types.get(type).push(job);
    }
     remove_job(job) {
      var type=job.type;
      if (this.removed) {
          console.trace();
          throw "Tried to remove an already removed job!";
      }
      if (!this.dead)
        job.kill(job);
      if (job.queued) {
          this.queue.remove(job);
      }
      this.jobs.remove(job);
      this.jobmap_owners.get(job.owner).remove(job);
      this.jobmap_types.get(job.type).remove(job);
      var q_job, q_i=1000000;
      for (var job2 of this.jobmap_types.get(type)) {
          if (job2.queued) {
              var i=this.queue.indexOf(job2);
              if (i<q_i) {
                  q_job = job2;
                  q_i = i;
              }
          }
      }
      if (q_job!=undefined) {
          if (q_job.start!=undefined)
            q_job.start(q_job);
          this.queue.remove(q_job);
          q_job.queued = false;
      }
    }
     kill_owner_jobs(owner) {
      if (!this.jobmap_owners.has(owner))
        return ;
      var jobs=g_list(this.jobmap_owners.get(owner));
      for (var job of jobs) {
          this.remove_job(job);
      }
      this.jobmap_owners.remove(owner);
    }
     kill_type_jobs(type) {
      type = get_type_name(type);
      if (!jobmap_types.has(type))
        return ;
      var jobs=g_list(jobmap_types.get(type));
      for (var job of jobs) {
          this.remove_job(job);
      }
      this.jobmap_types.remove(type);
    }
     queue_job(job) {
      this.add_job(job);
      job.queued = true;
      this.queue.push(job);
    }
     queue_replace(job, start) {
      var type=job.type;
      if (start!=undefined) {
          job.start = start;
      }
      if (this.jobmap_types.has(type)) {
          var lst=this.jobmap_types.get(type);
          var found_queued=false;
          for (var job2 of g_list(lst)) {
              if (job2.queued) {
                  this.remove_job(job2);
                  found_queued = true;
              }
          }
          if (this.jobmap_types.get(type).length>0) {
              this.queue_job(job);
          }
          else {
            this.add_job(job);
            if (start!=undefined)
              start();
          }
      }
      else {
        this.add_job(job);
        if (start!=undefined)
          start();
      }
    }
     run() {
      if (time_ms()-this.last_ms<this.ival)
        return ;
      var host_ival=time_ms()-this.last_ms-this.ival;
      host_ival = this.host_mean.update(host_ival);
      var max_time=Math.abs((-host_ival*this.time_perc)/(1.0-this.time_perc));
      this.last_ms = time_ms();
      while (time_ms()-this.last_ms<max_time) {
        if (this.jobs.length==0)
          break;
        for (var job of this.jobs) {
            if (job.queued)
              continue;
            var ms=time_ms();
            var reti=job.iter.next();
            if (!reti.done) {
                var d=time_ms()-job.last_ms;
                job.time_mean.update(d);
                job.last_ms = time_ms();
            }
            else {
              if (job.finish!=undefined)
                job.finish(job);
              this.remove_job(job);
            }
        }
      }
      this.last_ms = time_ms();
    }
     has_job(type) {
      type = get_type_name(type);
      if (this.jobmap_types.has(type)) {
          return this.jobmap_types.get(type).length>0;
      }
      return false;
    }
  }
  _ESClass.register(JobManager);
  _es6_module.add_class(JobManager);
  JobManager = _es6_module.add_export('JobManager', JobManager);
}, '/dev/fairmotion/src/core/jobs.js');
es6_module_define('ajax', ["../util/strutils.js", "../config/config.js"], function _ajax_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var encode_utf8=es6_import_item(_es6_module, '../util/strutils.js', 'encode_utf8');
  var decode_utf8=es6_import_item(_es6_module, '../util/strutils.js', 'decode_utf8');
  var truncate_utf8=es6_import_item(_es6_module, '../util/strutils.js', 'truncate_utf8');
  var urlencode=es6_import_item(_es6_module, '../util/strutils.js', 'urlencode');
  var b64decode=es6_import_item(_es6_module, '../util/strutils.js', 'b64decode');
  var b64encode=es6_import_item(_es6_module, '../util/strutils.js', 'b64encode');
  var DEFL_NAMELEN=64;
  if (typeof String.prototype.toUTF8!="function") {
      String.prototype.toUTF8 = function () {
        var input=String(this);
        var b=[], i, unicode;
        for (i = 0; i<input.length; i++) {
            unicode = input.charCodeAt(i);
            if (unicode<=0x7f) {
                b.push(unicode);
            }
            else 
              if (unicode<=0x7ff) {
                b.push((unicode>>6)|0xc0);
                b.push((unicode&0x3f)|0x80);
            }
            else 
              if (unicode<=0xffff) {
                b.push((unicode>>12)|0xe0);
                b.push(((unicode>>6)&0x3f)|0x80);
                b.push((unicode&0x3f)|0x80);
            }
            else {
              b.push((unicode>>18)|0xf0);
              b.push(((unicode>>12)&0x3f)|0x80);
              b.push(((unicode>>6)&0x3f)|0x80);
              b.push((unicode&0x3f)|0x80);
            }
        }
        return b;
      };
  }
  Number.prototype.pack = function (data) {
    if (Number(Math.ceil(this))==Number(this)) {
        pack_int(data, this);
    }
    else {
      pack_float(data, this);
    }
  }
  String.prototype.pack = function (data) {
    pack_string(data, this);
  }
  Array.prototype.pack = function (data) {
    pack_int(data, this.length);
    for (var i=0; i<this.length; i++) {
        this[i].pack(data);
    }
  }
  function get_endian() {
    var d=[1, 0, 0, 0];
    d = new Int32Array((new Uint8Array(d)).buffer)[0];
    return d==1;
  }
  get_endian = _es6_module.add_export('get_endian', get_endian);
  var little_endian=get_endian();
  little_endian = _es6_module.add_export('little_endian', little_endian);
  function str_to_uint8(str) {
    var uint8=[];
    for (var i=0; i<str.length; i++) {
        uint8.push(str.charCodeAt(i));
    }
    return new Uint8Array(uint8);
  }
  var _static_byte=new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]);
  var _static_view=new DataView(_static_byte.buffer);
  function pack_int(data, i, lendian) {
    if (lendian===undefined) {
        lendian = false;
    }
    
    
    _static_view.setInt32(0, i);
    if (lendian) {
        for (var j=3; j>=0; j--) {
            data.push(_static_byte[j]);
        }
    }
    else {
      for (var j=0; j<4; j++) {
          data.push(_static_byte[j]);
      }
    }
    
    
  }
  pack_int = _es6_module.add_export('pack_int', pack_int);
  function pack_short(data, i, lendian) {
    if (lendian===undefined) {
        lendian = false;
    }
    
    
    _static_view.setInt16(0, i);
    if (lendian) {
        for (var j=1; j>=0; j--) {
            data.push(_static_byte[j]);
        }
    }
    else {
      for (var j=0; j<2; j++) {
          data.push(_static_byte[j]);
      }
    }
    
    
  }
  pack_short = _es6_module.add_export('pack_short', pack_short);
  function pack_byte(data, i) {
    data.push(i);
  }
  pack_byte = _es6_module.add_export('pack_byte', pack_byte);
  function pack_float(data, f, lendian) {
    if (lendian===undefined) {
        lendian = false;
    }
    
    
    _static_view.setFloat32(0, f);
    if (lendian) {
        for (var j=3; j>=0; j--) {
            data.push(_static_byte[j]);
        }
    }
    else {
      for (var j=0; j<4; j++) {
          data.push(_static_byte[j]);
      }
    }
    
    
  }
  pack_float = _es6_module.add_export('pack_float', pack_float);
  function pack_double(data, f, lendian) {
    
    
    _static_view.setFloat64(0, f);
    if (lendian) {
        for (var j=7; j>=0; j--) {
            data.push(_static_byte[j]);
        }
    }
    else {
      for (var j=0; j<8; j++) {
          data.push(_static_byte[j]);
      }
    }
    
    
  }
  pack_double = _es6_module.add_export('pack_double', pack_double);
  function pack_vec2(data, vec, lendian) {
    if (lendian===undefined) {
        lendian = false;
    }
    
    
    pack_float(data, vec[0], lendian);
    pack_float(data, vec[1], lendian);
    
    
  }
  pack_vec2 = _es6_module.add_export('pack_vec2', pack_vec2);
  function pack_vec3(data, vec, lendian) {
    if (lendian===undefined) {
        lendian = false;
    }
    
    
    pack_float(data, vec[0], lendian);
    pack_float(data, vec[1], lendian);
    pack_float(data, vec[2], lendian);
    
    
  }
  pack_vec3 = _es6_module.add_export('pack_vec3', pack_vec3);
  function pack_vec4(data, vec, lendian) {
    if (lendian===undefined) {
        lendian = false;
    }
    pack_float(data, vec[0], lendian);
    pack_float(data, vec[1], lendian);
    pack_float(data, vec[2], lendian);
    pack_float(data, vec[3], lendian);
  }
  pack_vec4 = _es6_module.add_export('pack_vec4', pack_vec4);
  function pack_quat(data, vec, lendian) {
    if (lendian===undefined) {
        lendian = false;
    }
    pack_float(data, vec[0], lendian);
    pack_float(data, vec[1], lendian);
    pack_float(data, vec[2], lendian);
    pack_float(data, vec[3], lendian);
  }
  pack_quat = _es6_module.add_export('pack_quat', pack_quat);
  function pack_mat4(data, mat, lendian) {
    if (lendian===undefined) {
        lendian = false;
    }
    
    
    var m=mat.getAsArray();
    for (var i=0; i<16; i++) {
        pack_float(data, m[i], lendian);
    }
    
    
  }
  pack_mat4 = _es6_module.add_export('pack_mat4', pack_mat4);
  function pack_dataref(data, b, lendian) {
    if (lendian===undefined) {
        lendian = false;
    }
    if (b!=undefined) {
        pack_int(data, b.lib_id, lendian);
        if (b.lib_lib!=undefined)
          pack_int(data, b.lib_lib.id, lendian);
        else 
          pack_int(data, -1, lendian);
    }
    else {
      pack_int(data, -1, lendian);
      pack_int(data, -1, lendian);
    }
  }
  pack_dataref = _es6_module.add_export('pack_dataref', pack_dataref);
  var _static_sbuf_ss=new Array(32);
  function pack_static_string(data, str, length) {
    
    
    if (length==undefined)
      throw new Error("'length' paremter is not optional for pack_static_string()");
    var arr=length<2048 ? _static_sbuf_ss : new Array();
    arr.length = 0;
    encode_utf8(arr, str);
    truncate_utf8(arr, length);
    for (var i=0; i<length; i++) {
        if (i>=arr.length) {
            data.push(0);
        }
        else {
          data.push(arr[i]);
        }
    }
    
    
  }
  pack_static_string = _es6_module.add_export('pack_static_string', pack_static_string);
  function test_str_packers() {
    function static_string_test() {
      var arr=[];
      var teststr="12345678"+String.fromCharCode(8800);
      console.log(teststr);
      var arr2=[];
      encode_utf8(arr2, teststr);
      console.log(arr2.length);
      pack_static_string(arr, teststr, 9);
      if (arr.length!=9)
        throw new UnitTestError("Bad length "+arr.length.toString());
      arr = new DataView(new Uint8Array(arr).buffer);
      var str2=unpack_static_string(arr, new unpack_ctx(), 9);
      console.log(teststr, str2);
      console.log("'12345678'", "'"+str2+"'");
      if (str2!="12345678")
        throw new UnitTestError("Bad truncation");
    }
    static_string_test();
    return true;
  }
  test_str_packers = _es6_module.add_export('test_str_packers', test_str_packers);
  register_test(test_str_packers);
  var _static_sbuf=new Array(32);
  function pack_string(data, str) {
    
    
    _static_sbuf.length = 0;
    encode_utf8(_static_sbuf, str);
    pack_int(data, _static_sbuf.length);
    for (var i=0; i<_static_sbuf.length; i++) {
        data.push(_static_sbuf[i]);
    }
    
    
  }
  pack_string = _es6_module.add_export('pack_string', pack_string);
  function unpack_bytes(data, uctx, len) {
    var ret=new DataView(data.buffer.slice(uctx.i, uctx.i+len));
    uctx.i+=len;
    return ret;
  }
  unpack_bytes = _es6_module.add_export('unpack_bytes', unpack_bytes);
  function unpack_array(data, uctx, unpacker) {
    var len=unpack_int(data, uctx);
    var list=new Array(len);
    for (var i=0; i<len; i++) {
        list[i] = unpacker(data, uctx);
    }
    return list;
  }
  unpack_array = _es6_module.add_export('unpack_array', unpack_array);
  function unpack_garray(data, uctx, unpacker) {
    var len=unpack_int(data, uctx);
    var list=new GArray();
    for (var i=0; i<len; i++) {
        list.push(unpacker(data, uctx));
    }
    return list;
  }
  unpack_garray = _es6_module.add_export('unpack_garray', unpack_garray);
  function unpack_dataref(data, uctx) {
    var block_id=unpack_int(data, uctx);
    var lib_id=unpack_int(data, uctx);
    return new DataRef(block_id, lib_id);
  }
  unpack_dataref = _es6_module.add_export('unpack_dataref', unpack_dataref);
  function unpack_byte(data, uctx) {
    var ret=data.getUint8(uctx.i);
    uctx.i+=1;
    return ret;
  }
  unpack_byte = _es6_module.add_export('unpack_byte', unpack_byte);
  function unpack_int(data, uctx) {
    var ret=data.getInt32(uctx.i);
    uctx.i+=4;
    return ret;
  }
  unpack_int = _es6_module.add_export('unpack_int', unpack_int);
  function unpack_short(data, uctx) {
    var ret=data.getInt16(uctx.i);
    uctx.i+=2;
    return ret;
  }
  unpack_short = _es6_module.add_export('unpack_short', unpack_short);
  function unpack_float(data, uctx) {
    var ret=data.getFloat32(uctx.i);
    uctx.i+=4;
    return ret;
  }
  unpack_float = _es6_module.add_export('unpack_float', unpack_float);
  function unpack_double(data, uctx) {
    var ret=data.getFloat64(uctx.i);
    uctx.i+=8;
    return ret;
  }
  unpack_double = _es6_module.add_export('unpack_double', unpack_double);
  function unpack_vec2(data, uctx) {
    var x=unpack_float(data, uctx);
    var y=unpack_float(data, uctx);
    return new Vector2([x, y]);
  }
  unpack_vec2 = _es6_module.add_export('unpack_vec2', unpack_vec2);
  function unpack_vec3(data, uctx) {
    var vec=new Vector3();
    var x=unpack_float(data, uctx);
    var y=unpack_float(data, uctx);
    var z=unpack_float(data, uctx);
    vec[0] = x;
    vec[1] = y;
    vec[2] = z;
    return vec;
  }
  unpack_vec3 = _es6_module.add_export('unpack_vec3', unpack_vec3);
  function unpack_vec4(data, uctx) {
    var x=unpack_float(data, uctx);
    var y=unpack_float(data, uctx);
    var z=unpack_float(data, uctx);
    var w=unpack_float(data, uctx);
    return new Vector4([x, y, z, w]);
  }
  unpack_vec4 = _es6_module.add_export('unpack_vec4', unpack_vec4);
  function unpack_quat(data, uctx) {
    var x=unpack_float(data, uctx);
    var y=unpack_float(data, uctx);
    var z=unpack_float(data, uctx);
    var w=unpack_float(data, uctx);
    return new Quat([x, y, z, w]);
  }
  unpack_quat = _es6_module.add_export('unpack_quat', unpack_quat);
  function unpack_mat4(data, uctx) {
    var m=new Array(16);
    for (var i=0; i<16; i++) {
        m[i] = unpack_float(data, uctx);
    }
    return new Matrix4(m);
  }
  unpack_mat4 = _es6_module.add_export('unpack_mat4', unpack_mat4);
  function debug_unpack_bytes(data, uctx, length) {
    var s="";
    var arr=new Array(length);
    arr.length = 0;
    for (var i=0; i<length; i++) {
        var c=unpack_byte(data, uctx);
        try {
          c = c ? String.fromCharCode(c) : "?";
        }
        catch (_err) {
            c = "?";
        }
        s+=c;
    }
    return s;
  }
  debug_unpack_bytes = _es6_module.add_export('debug_unpack_bytes', debug_unpack_bytes);
  var _static_arr_uss=new Array(32);
  function unpack_static_string(data, uctx, length) {
    var str="";
    if (length==undefined)
      throw new Error("'length' cannot be undefined in unpack_static_string()");
    var arr=length<2048 ? _static_arr_uss : new Array(length);
    arr.length = 0;
    var done=false;
    for (var i=0; i<length; i++) {
        var c=unpack_byte(data, uctx);
        if (c==0) {
            done = true;
        }
        if (!done&&c!=0) {
            arr.push(c);
        }
    }
    truncate_utf8(arr, length);
    return decode_utf8(arr);
  }
  unpack_static_string = _es6_module.add_export('unpack_static_string', unpack_static_string);
  var _static_arr_us=new Array(32);
  function unpack_string(data, uctx) {
    var str="";
    var slen=unpack_int(data, uctx);
    var arr=slen<2048 ? _static_arr_us : new Array(slen);
    arr.length = slen;
    for (var i=0; i<slen; i++) {
        arr[i] = unpack_byte(data, uctx);
    }
    return decode_utf8(arr);
  }
  unpack_string = _es6_module.add_export('unpack_string', unpack_string);
  class unpack_ctx  {
     constructor() {
      this.i = 0;
    }
  }
  _ESClass.register(unpack_ctx);
  _es6_module.add_class(unpack_ctx);
  unpack_ctx = _es6_module.add_export('unpack_ctx', unpack_ctx);
  window.NetStatus = function NetStatus() {
    this.progress = 0;
    this.status_msg = "";
    this.cancel = false;
    this._client_control = false;
  }
  class NetJob  {
     constructor(owner, iter, finish, error, status) {
      this.iter = iter;
      this.finish = finish;
      this.error = error;
      this.status = status;
      this.status_data = new NetStatus();
      this.value = undefined;
      this.req = undefined;
    }
  }
  _ESClass.register(NetJob);
  _es6_module.add_class(NetJob);
  NetJob = _es6_module.add_export('NetJob', NetJob);
  window.NetJob = NetJob;
  function parse_headers(headers) {
    var ret={}
    if (headers==undefined)
      return ret;
    var in_name=true;
    var key="";
    var value="";
    for (var i=0; i<headers.length; i++) {
        var c=headers[i];
        if (c=="\n") {
            ret[key.trim()] = value.trim();
            key = "";
            value = "";
            in_name = true;
            continue;
        }
        else 
          if (c=="\r") {
            continue;
        }
        if (in_name) {
            if (c==" "||c=="\t") {
                continue;
            }
            else 
              if (c==":") {
                in_name = false;
            }
            else {
              key+=c;
            }
        }
        else {
          value+=c;
        }
    }
    if (key.trim().length!=0) {
        ret[key.trim()] = value.trim();
    }
    return ret;
  }
  window.create_folder = function* create_folder(job, args) {
    var token=g_app_state.session.tokens.access;
    var url="/api/files/dir/new?accessToken="+token+"&id="+args.folderid;
    url+="&name="+urlencode(args.name);
    api_exec(url, job, "GET");
    yield ;
  }
  window.api_exec = function api_exec(path, netjob, mode, data, mime, extra_headers, responseType) {
    var owner=netjob.owner;
    var iter=netjob.iter;
    if (mode==undefined)
      mode = "GET";
    if (mime==undefined)
      mime = "application/octet-stream";
    if (data==undefined) {
        data = "";
    }
    var error=netjob.error;
    if (error==undefined) {
        error = function (netjob, owner, msg) {
          console.log("Network Error: "+msg);
        };
    }
    var req=new XMLHttpRequest();
    netjob.req = req;
    req.open(mode, path, true);
    if (mode!="GET")
      req.setRequestHeader("Content-type", mime);
    if (extra_headers!=undefined) {
        for (var k in extra_headers) {
            req.setRequestHeader(k, extra_headers[k]);
        }
    }
    if (responseType==undefined)
      responseType = "text";
    req.onerror = req.onabort = function () {
      error(netjob, netjob.owner, "Network Error");
    }
    req.responseType = responseType;
    req.onprogress = function (evt) {
      if (netjob.status_data._client_control||evt.total==0)
        return ;
      if (DEBUG.netio)
        console.log("progress: ", evt, evt.status, evt.loaded, evt.total);
      var perc=evt.loaded/evt.total;
      netjob.status_data.progress = perc;
      if (DEBUG.netio)
        console.log("perc", perc, netjob.status);
      if (netjob.status)
        netjob.status(netjob, netjob.owner, netjob.status_data);
    }
    req.onreadystatechange = function () {
      if (req.readyState==4&&(req.status>=200&&req.status<=300)) {
          var obj;
          netjob.headers = parse_headers(req.getAllResponseHeaders());
          if (DEBUG.netio)
            console.log("headers:", netjob.headers);
          if (netjob.headers["Content-Type"]=="application/x-javascript") {
              try {
                obj = JSON.parse(req.response);
              }
              catch (_error) {
                  error(netjob, owner, "JSON parse error");
                  obj = {};
                  return ;
              }
              netjob.value = obj;
          }
          else {
            netjob.value = req.response;
          }
          var reti=iter.next();
          if (reti.done) {
              if (netjob.status_data.progress!=1.0) {
                  netjob.status_data.progress = 1.0;
                  if (netjob.status)
                    netjob.status(netjob, netjob.owner, netjob.status_data);
              }
              if (netjob.finish) {
                  netjob.finish(netjob, owner);
              }
          }
      }
      else 
        if (req.status>=400) {
          var resp;
          try {
            resp = req.responseText;
          }
          catch (err) {
              resp = "";
          }
          error(netjob, netjob.owner, resp);
          console.log(req.readyState, req.status, resp);
      }
    }
    var ret=req.send(data);
  }
  window.AuthSessionGen = function* AuthSessionGen(job, user, password, refresh_token) {
    if (refresh_token==undefined) {
        var sha1pwd="{SHA}"+CryptoJS.enc.Base64.stringify(CryptoJS.SHA1(password));
        api_exec("/api/auth?user="+user+"&password="+sha1pwd, job);
        yield 1;
        console.log("auth value: ", job.value);
        refresh_token = job.value["refresh_token"];
    }
    api_exec("/api/auth/session?refreshToken="+refresh_token, job);
    yield 1;
    var access_token=job.value["access_token"];
    job.value = {refresh: refresh_token, 
    access: access_token}
    if (job.finish!=undefined)
      job.finish(job, job.owner);
  }
  window.auth_session = function auth_session(user, password, finish, error, status) {
    var obj={}
    obj.job = new NetJob(obj, undefined, finish, error, status);
    obj.job.finish = finish;
    obj.iter = new AuthSessionGen(obj.job, user, password);
    obj.job.iter = obj.iter;
    obj.iter.next();
    return obj;
  }
  window.call_api = function call_api(iternew, args, finishcb, errorcb, status) {
    var promise=new Promise(function (accept, reject) {
      var obj={}
      function finish() {
        if (finishcb!=undefined)
          finishcb.apply(this, arguments);
        accept.apply(this, arguments);
      }
      function error() {
        if (errorcb!=undefined)
          errorcb.apply(this, arguments);
        if (reject!=undefined)
          reject.apply(this, arguments);
      }
      obj.job = new NetJob(obj, undefined, finish, error, status);
      var iter=iternew(obj.job, args);
      iter.job = obj.job;
      obj.iter = obj.job.iter = iter;
      obj.iter.next();
    });
    return promise;
  }
  window.get_user_info = function* get_user_info(job, args) {
    if (g_app_state.session.tokens==undefined) {
        job.finish = undefined;
        job.error(job, job.owner);
        return ;
    }
    var token=g_app_state.session.tokens.access;
    api_exec("/api/auth/userinfo?accessToken="+token, job);
    yield ;
  }
  window.get_dir_files = function* get_dir_files(job, args) {
    var token=g_app_state.session.tokens.access;
    var path=args.path;
    if (path==undefined) {
        api_exec("/api/files/dir/list?accessToken="+token+"&id="+args.id, job);
    }
    else {
      api_exec("/api/files/dir/list?accessToken="+token+"&path="+path, job);
    }
    yield ;
  }
  window.upload_file = function* upload_file(job, args) {
    var suffix;
    job.status_data._client_control = true;
    var url=args.url;
    var url2=args.chunk_url;
    api_exec(url, job);
    yield 1;
    if (DEBUG.netio)
      console.log(job.value);
    var upload_token=job.value.uploadToken;
    var data=args.data;
    var len=data.byteLength;
    var csize=1024*256;
    var c=0;
    var ilen=Math.ceil(len/csize);
    var prog=0.0;
    var dp=1.0/ilen;
    if (DEBUG.netio)
      console.log("beginning upload", ilen);
    for (var i=0; i<ilen; i++) {
        if (DEBUG.netio)
          console.log("Uploading chunk "+(i+1)+" of "+ilen);
        var url=url2+"&uploadToken="+upload_token;
        var size=i==ilen-1 ? len%(csize) : csize;
        if (DEBUG.netio)
          console.log(i*csize, size, data);
        var chunk=new DataView(data, i*csize, size);
        var last=i*csize+size-1;
        var headers={"Content-Range": "bytes "+c+"-"+(c+size-1)+"/"+len};
        if (DEBUG.netio)
          console.log(headers["Content-Range"], size, c, chunk);
        api_exec(url, job, "PUT", chunk, undefined, headers);
        yield ;
        c+=size;
        prog+=dp;
        job.status_data.progress = prog;
        if (job.status) {
            job.status(job, job.owner, job.status_data);
            if (job.status.cancel) {
                job.finish = undefined;
                job.req.abort();
                break;
            }
        }
    }
  }
  window.get_file_data = function* get_file_data(job, args) {
    var token=g_app_state.session.tokens.access;
    var path=args.path;
    var url;
    if (path==undefined) {
        url = "/api/files/get?accessToken="+token+"&id="+args.id;
    }
    else {
      url = "/api/files/get?accessToken="+token+"&path="+path;
    }
    api_exec(url, job, undefined, undefined, undefined, undefined, "arraybuffer");
    yield ;
  }
}, '/dev/fairmotion/src/core/ajax.js');
es6_module_define('raster', ["./icon.js", "../config/config.js"], function _raster_module(_es6_module) {
  "use strict";
  var IconManager=es6_import_item(_es6_module, './icon.js', 'IconManager');
  var config=es6_import(_es6_module, '../config/config.js');
  class CacheStack extends Array {
     constructor(itemlen) {
      super();
      this.dellist = [];
      this.ilen = itemlen;
    }
     pop() {
      var ret=Array.prototype.pop.apply(this, arguments);
      if (this.dellist.length<64) {
          this.dellist.push(ret);
      }
      return ret;
    }
     clear() {
      var len=this.length;
      for (var i=0; i<len; i++) {
          this.pop(len);
      }
    }
     gen() {
      if (this.dellist.length!=0) {
          return this.dellist.pop();
      }
      else {
        return new Array(this.ilen);
      }
    }
  }
  _ESClass.register(CacheStack);
  _es6_module.add_class(CacheStack);
  var $ret_bFJq_viewport;
  class RasterState  {
    
    
    
    
    
     constructor(gl, size) {
      return ;
      this.size = size;
      this.pos = [0, 0];
      this.iconsheet = new IconManager(gl, config.ICONPATH+"iconsheet.png", [512, 512], [32, 32]);
      this.iconsheet16 = new IconManager(gl, config.ICONPATH+"iconsheet16.png", [256, 256], [16, 16]);
      this.viewport_stack = new CacheStack(2);
      this.scissor_stack = new CacheStack(4);
    }
     on_gl_lost(gl) {
      this.pos = [0, 0];
      this.iconsheet = new IconManager(gl, config.ICONPATH+"iconsheet.png", [512, 512], [32, 32]);
      this.iconsheet16 = new IconManager(gl, config.ICONPATH+"iconsheet16.png", [256, 256], [16, 16]);
    }
     begin_draw(gl, pos, size) {
      this.gl = gl;
      this.pos = pos;
      this.size = size;
      this.viewport_stack.clear();
      this.scissor_stack.clear();
      this.cur_scissor = undefined;
    }
    get  viewport() {
      if (this.viewport_stack.length>0) {
          return this.viewport_stack[this.viewport_stack.length-1];
      }
      else {
        $ret_bFJq_viewport[0][0] = $ret_bFJq_viewport[0][1] = 0.0;
        $ret_bFJq_viewport[1][0] = g_app_state.screen.size[0];
        $ret_bFJq_viewport[1][1] = g_app_state.screen.size[1];
        return $ret_bFJq_viewport;
      }
    }
     push_viewport(pos, size) {
      var arr=this.viewport_stack.gen();
      arr[0] = pos;
      arr[1] = size;
      this.viewport_stack.push(arr);
      this.pos = pos;
      this.size = size;
    }
     pop_viewport() {
      var ret=this.viewport_stack.pop(this.viewport_stack.length-1);
      this.pos = ret[0];
      this.size = ret[1];
      return ret;
    }
     push_scissor(pos, size) {
      var rect;
      var gl=this.gl;
      if (this.cur_scissor==undefined) {
          var rect=this.scissor_stack.gen();
          var size2=g_app_state.screen.size;
          rect[0] = 0;
          rect[1] = 0;
          rect[2] = size2[0];
          rect[3] = size2[1];
      }
      else {
        rect = this.scissor_stack.gen();
        for (var i=0; i<4; i++) {
            rect[i] = this.cur_scissor[i];
        }
      }
      this.scissor_stack.push(rect);
      if (this.cur_scissor==undefined) {
          this.cur_scissor = [pos[0], pos[1], size[0], size[1]];
      }
      else {
        var cur=this.cur_scissor;
        cur[0] = pos[0];
        cur[1] = pos[1];
        cur[2] = size[0];
        cur[3] = size[1];
      }
    }
     pop_scissor() {
      var rect=this.scissor_stack.pop();
      var cur=this.cur_scissor;
      if (cur==undefined) {
          cur = [rect[0], rect[1], rect[2], rect[3]];
      }
      else {
        cur[0] = rect[0];
        cur[1] = rect[1];
        cur[2] = rect[2];
        cur[3] = rect[3];
      }
      this.cur_scissor = cur;
    }
     reset_scissor_stack() {
      this.scissor_stack.clear();
      this.cur_scissor = undefined;
    }
  }
  var $ret_bFJq_viewport=[[0, 0], [0, 0]];
  _ESClass.register(RasterState);
  _es6_module.add_class(RasterState);
  RasterState = _es6_module.add_export('RasterState', RasterState);
}, '/dev/fairmotion/src/core/raster.js');
es6_module_define('imageblock', ["../editors/viewport/selectmode.js", "../util/strutils.js", "../path.ux/scripts/util/vectormath.js", "../editors/viewport/view2d_editor.js", "./lib_api.js", "./struct.js", "./toolops_api.js"], function _imageblock_module(_es6_module) {
  var DataBlock=es6_import_item(_es6_module, './lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, './lib_api.js', 'DataTypes');
  var BlockFlags=es6_import_item(_es6_module, './lib_api.js', 'BlockFlags');
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  var ModalStates=es6_import_item(_es6_module, './toolops_api.js', 'ModalStates');
  var SelMask=es6_import_item(_es6_module, '../editors/viewport/selectmode.js', 'SelMask');
  var SessionFlags=es6_import_item(_es6_module, '../editors/viewport/view2d_editor.js', 'SessionFlags');
  var strutils=es6_import(_es6_module, '../util/strutils.js');
  es6_import(_es6_module, '../path.ux/scripts/util/vectormath.js');
  var ImageFlags={SELECT: 1, 
   VALID: 2}
  ImageFlags = _es6_module.add_export('ImageFlags', ImageFlags);
  class Image extends DataBlock {
    
     constructor(name="Image") {
      super(DataTypes.IMAGE, name);
      this.path = "";
      this.data = undefined;
      this.size = [-1, -1];
      this._dom = undefined;
    }
     get_dom_image() {
      if (this._dom==undefined) {
          var img=document.createElement("img");
          var mimetype="image/png";
          if (this.path!=undefined) {
              var p=this.path.toLowerCase();
              if (p.endsWith(".jpg"))
                mimetype = "image/jpeg";
              else 
                if (p.endsWith(".bmp"))
                mimetype = "image/bitmap";
              else 
                if (p.endsWith(".gif"))
                mimetype = "image/gif";
              else 
                if (p.endsWith(".tif"))
                mimetype = "image/tiff";
          }
          if (this.data!=undefined) {
              img.src = strutils.encode_dataurl(mimetype, this.data);
          }
          this._dom = img;
      }
      return this._dom;
    }
     _get_data() {
      if (this.data) {
          return this.data;
      }
      else {
        return new Uint8Array([]);
      }
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      if (this.data.length===0) {
          this.data = undefined;
      }
      this.afterSTRUCT();
    }
  }
  _ESClass.register(Image);
  _es6_module.add_class(Image);
  Image = _es6_module.add_export('Image', Image);
  Image.STRUCT = STRUCT.inherit(Image, DataBlock)+`
  path  : string;
  width : array(int);
  data  : arraybuffer | this._get_data();
}
`;
  class ImageUser  {
    
    
    
     constructor() {
      this.off = new Vector2([0, 0]);
      this.scale = new Vector2([1, 1]);
      this.image = undefined;
      this.flag = 0;
    }
     data_link(block, getblock, getblock_us) {
      this.image = getblock(this.image);
    }
    static  fromSTRUCT(reader) {
      var ret=new ImageUser();
      reader(ret);
      return ret;
    }
  }
  _ESClass.register(ImageUser);
  _es6_module.add_class(ImageUser);
  ImageUser = _es6_module.add_export('ImageUser', ImageUser);
  ImageUser.STRUCT = `
ImageUser {
  off   : vec2;
  scale : vec2;
  image : dataref(Image);
  flag  : int;
}
`;
}, '/dev/fairmotion/src/core/imageblock.js');
es6_module_define('image_ops', ["../core/struct.js", "../core/toolprops.js", "../core/frameset.js", "../curve/spline.js", "../core/toolops_api.js", "../core/fileapi/fileapi.js", "../curve/spline_draw.js", "../path.ux/scripts/util/struct.js", "../config/config.js", "../core/lib_api.js", "../core/imageblock.js"], function _image_ops_module(_es6_module) {
  var Image=es6_import_item(_es6_module, '../core/imageblock.js', 'Image');
  var DataTypes=es6_import_item(_es6_module, '../core/lib_api.js', 'DataTypes');
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var IntProperty=es6_import_item(_es6_module, '../core/toolprops.js', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, '../core/toolprops.js', 'FloatProperty');
  var CollectionProperty=es6_import_item(_es6_module, '../core/toolprops.js', 'CollectionProperty');
  var BoolProperty=es6_import_item(_es6_module, '../core/toolprops.js', 'BoolProperty');
  var StringProperty=es6_import_item(_es6_module, '../core/toolprops.js', 'StringProperty');
  var TPropFlags=es6_import_item(_es6_module, '../core/toolprops.js', 'TPropFlags');
  var DataRefProperty=es6_import_item(_es6_module, '../core/toolprops.js', 'DataRefProperty');
  var ArrayBufferProperty=es6_import_item(_es6_module, '../core/toolprops.js', 'ArrayBufferProperty');
  var ToolOp=es6_import_item(_es6_module, '../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../core/toolops_api.js', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, '../core/toolops_api.js', 'ModalStates');
  var RestrictFlags=es6_import_item(_es6_module, '../curve/spline.js', 'RestrictFlags');
  var Spline=es6_import_item(_es6_module, '../curve/spline.js', 'Spline');
  var VDAnimFlags=es6_import_item(_es6_module, '../core/frameset.js', 'VDAnimFlags');
  var TPropFlags=es6_import_item(_es6_module, '../core/toolprops.js', 'TPropFlags');
  es6_import(_es6_module, '../path.ux/scripts/util/struct.js');
  var redo_draw_sort=es6_import_item(_es6_module, '../curve/spline_draw.js', 'redo_draw_sort');
  var config=es6_import(_es6_module, '../config/config.js');
  var html5_fileapi=es6_import(_es6_module, '../core/fileapi/fileapi.js');
  class LoadImageOp extends ToolOp {
    static  tooldef() {
      return {apiname: "image.load_image", 
     uiname: "Load Image", 
     inputs: {name: new StringProperty("Image"), 
      dest_datapath: new StringProperty(""), 
      imagedata: new ArrayBufferProperty(), 
      imagepath: new StringProperty("")}, 
     outputs: {block: new DataRefProperty(undefined, [DataTypes.IMAGE])}, 
     icon: -1, 
     is_modal: true}
    }
     constructor(datapath="", name="") {
      super();
      datapath = ""+datapath;
      name = ""+name;
      this.inputs.dest_datapath.setValue(datapath);
      this.inputs.name.setValue(name);
    }
     start_modal(ctx) {
      super.start_modal(ctx);
      console.log("modal start!", ctx);
      this.end_modal();
      var this2=this;
      if (config.USE_HTML5_FILEAPI) {
          html5_fileapi.open_file(function (buffer, name) {
            console.log("loaded image!", buffer, buffer.byteLength);
            this2.inputs.imagedata.setValue(buffer);
            this2.inputs.imagepath.setValue(name);
            this2.exec(ctx);
          }, this, false, "Images", ["png", "jpg", "bmp", "tiff", "gif", "tga", "targa", "ico", "exr"]);
          return ;
      }
    }
     exec(ctx) {
      ctx = new Context();
      var name=this.inputs.name.data.trim();
      name = name==="" ? undefined : name;
      var image=new Image(name);
      ctx.datalib.add(image);
      image.path = this.inputs.imagepath.data;
      image.data = this.inputs.imagedata.data;
      this.outputs.block.setValue(image);
      var outpath=this.inputs.dest_datapath.data.trim();
      if (outpath!=="") {
          ctx.api.setValue(ctx, outpath, image);
      }
    }
  }
  _ESClass.register(LoadImageOp);
  _es6_module.add_class(LoadImageOp);
  LoadImageOp = _es6_module.add_export('LoadImageOp', LoadImageOp);
}, '/dev/fairmotion/src/image/image_ops.js');
es6_module_define('UserSettings', ["../datafiles/theme.js", "../editors/theme.js", "./struct.js", "../path.ux/scripts/core/ui_theme.js", "../path.ux/scripts/util/util.js", "../path.ux/scripts/core/ui_base.js", "../util/strutils.js", "../config/config.js"], function _UserSettings_module(_es6_module) {
  var config=es6_import(_es6_module, '../config/config.js');
  var reload_default_theme=es6_import_item(_es6_module, '../datafiles/theme.js', 'reload_default_theme');
  var b64encode=es6_import_item(_es6_module, '../util/strutils.js', 'b64encode');
  var b64decode=es6_import_item(_es6_module, '../util/strutils.js', 'b64decode');
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  var exportTheme=es6_import_item(_es6_module, '../path.ux/scripts/core/ui_theme.js', 'exportTheme');
  var CSSFont=es6_import_item(_es6_module, '../path.ux/scripts/core/ui_theme.js', 'CSSFont');
  var setTheme=es6_import_item(_es6_module, '../path.ux/scripts/core/ui_base.js', 'setTheme');
  var ui_base=es6_import(_es6_module, '../path.ux/scripts/core/ui_base.js');
  var theme=es6_import_item(_es6_module, '../editors/theme.js', 'theme');
  var util=es6_import(_es6_module, '../path.ux/scripts/util/util.js');
  let defaultTheme=exportTheme(theme);
  function loadTheme(str) {
    var theme;
    eval(str);
    setTheme(theme);
  }
  loadTheme = _es6_module.add_export('loadTheme', loadTheme);
  class RecentPath  {
     constructor(path, displayname) {
      this.path = path;
      this.displayname = displayname;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(RecentPath);
  _es6_module.add_class(RecentPath);
  RecentPath = _es6_module.add_export('RecentPath', RecentPath);
  RecentPath.STRUCT = `
  RecentPath {
    path        : string;
    displayname : string;
  }
`;
  class ToolOpSettings  {
     constructor(toolcls) {
      if (toolcls===undefined) {
          this.name = "";
          this.entries = {};
      }
      else {
        this.name = toolcls.tooldef().apiname||toolcls.tooldef().toolpath;
        this.entries = {};
      }
    }
     isFor(toolcls) {
      return this.name===(toolcls.tooldef().apiname||toolcls.tooldef().toolpath);
    }
     _save() {
      let ret=[];
      for (let k in this.entries) {
          let v=this.entries[k];
          ret.push([k, JSON.stringify(v)]);
      }
      return ret;
    }
     set(k, v) {
      this.entries[k] = v;
    }
     has(k) {
      return k in this.entries;
    }
     get(k) {
      return this.entries[k];
    }
     loadSTRUCT(reader) {
      reader(this);
      let entries=this.entries;
      this.entries = {};
      for (let item of entries) {
          let k=item[0], v=item[1];
          try {
            v = JSON.parse(v);
          }
          catch (error) {
              util.print_stack(error);
              console.error("JSON error when loading "+this.name+"."+k+":", v);
              continue;
          }
          this.entries[k] = v;
      }
    }
  }
  _ESClass.register(ToolOpSettings);
  _es6_module.add_class(ToolOpSettings);
  ToolOpSettings = _es6_module.add_export('ToolOpSettings', ToolOpSettings);
  ToolOpSettings.STRUCT = `
ToolOpSettings {
  name    : string;
  entries : array(array(string)) | this._save(); 
}
`;
  class AppSettings  {
     constructor() {
      this.reload_defaults(false);
      this.recent_paths = [];
      this.tool_settings = [];
    }
     _getToolOpS(toolcls) {
      for (let settings of this.tool_settings) {
          if (settings.isFor(toolcls)) {
              return settings;
          }
      }
      let ret=new ToolOpSettings(toolcls);
      this.tool_settings.push(ret);
      return ret;
    }
     setToolOpSetting(toolcls, k, v) {
      this._getToolOpS(toolcls).set(k, v);
      this.save();
    }
     hasToolOpSetting(toolcls, k) {
      return this._getToolOpS(toolcls).has(k);
    }
     getToolOpSetting(toolcls, k, defaultval) {
      if (!this._getToolOpS(toolcls).has(k)) {
          return defaultval;
      }
      return this._getToolOpS(toolcls).get(k);
    }
     reload_defaults(load_theme=false) {
      this.unit_scheme = "imperial";
      this.unit = "in";
      this.theme = defaultTheme;
      if (load_theme) {
          loadTheme(this.theme);
      }
    }
     reloadDefaultTheme() {
      this.theme = defaultTheme;
      loadTheme(this.theme);
    }
     setTheme(th=ui_base.theme) {
      this.theme = exportTheme(th);
      return this;
    }
     loadFrom(b, load_theme=true) {
      this.unit = b.unit;
      this.unit_scheme = b.unit_scheme;
      this.theme = b.theme;
      if (load_theme) {
          loadTheme(this.theme);
      }
      this.recent_paths = b.recent_paths;
      return this;
    }
     download(callback) {
      console.warn("Deprecated function AppSettings.prototype.download() called");
      this.load().then(() =>        {
        if (callback) {
            callback();
        }
      });
    }
     load() {
      return new Promise((accept, reject) =>        {
        myLocalStorage.getAsync("_fairmotion_settings").then((data) =>          {
          console.warn("%cLoading saved settings. . . ", "color : green;");
          data = new DataView(b64decode(data).buffer);
          let fdata=g_app_state.load_blocks(data);
          let blocks=fdata.blocks;
          let fstruct=fdata.fstructs;
          let version=fdata.version;
          var settings=undefined;
          for (var i=0; i<blocks.length; i++) {
              if (blocks[i].type==="USET") {
                  settings = fstruct.read_object(blocks[i].data, AppSettings);
                  console.log("  found settings:", settings);
              }
          }
          if (settings==undefined) {
              console.trace("  could not find settings block");
              reject("could not find settings block, but did get a file");
              return ;
          }
          this.loadFrom(settings);
          this.loaded_settings = true;
          accept(this);
        });
      });
    }
     save() {
      var data=this.gen_file().buffer;
      data = b64encode(new Uint8Array(data));
      myLocalStorage.set("_fairmotion_settings", data);
    }
     gen_file() {
      let blocks={USET: this};
      var args={blocks: blocks};
      return g_app_state.write_blocks(args);
    }
     find_recent_path(path) {
      for (var i=0; i<this.recent_paths.length; i++) {
          if (this.recent_paths[i].path===path) {
              return i;
          }
      }
      return -1;
    }
     add_recent_file(path, displayname=path) {
      let rpath=new RecentPath(path, displayname);
      var rp=this.find_recent_path(path);
      if (rp>=0) {
          try {
            this.recent_paths.remove(this.recent_paths[path]);
          }
          catch (error) {
              util.print_stack(error);
          }
          this.recent_paths.push(rpath);
      }
      else 
        if (this.recent_paths.length>=config.MAX_RECENT_FILES) {
          this.recent_paths.shift();
          this.recent_paths.push(rpath);
      }
      else {
        this.recent_paths.push(rpath);
      }
      this.save();
    }
     loadSTRUCT(reader) {
      reader(this);
      if (typeof this.theme!=="string") {
          this.theme = defaultTheme;
      }
    }
  }
  _ESClass.register(AppSettings);
  _es6_module.add_class(AppSettings);
  AppSettings = _es6_module.add_export('AppSettings', AppSettings);
  AppSettings.STRUCT = `
AppSettings {
  unit_scheme   : string;
  unit          : string;
  tool_settings : array(ToolOpSettings);
  theme         : string;
  recent_paths  : array(RecentPath);
}
`;
  class OldAppSettings  {
    
    
    
    
     constructor() {
      this.unit_scheme = "imperial";
      this.unit = "in";
      this.last_server_update = 0;
      this.update_waiting = false;
      this.recent_paths = [];
    }
     reload_defaults() {
      this.unit_scheme = "imperial";
      this.unit = "in";
      this.recent_paths.length = 0;
      reload_default_theme();
      this.server_update(true);
    }
     find_recent_path(path) {
      for (var i=0; i<this.recent_paths.length; i++) {
          if (this.recent_paths[i].path===path) {
              return i;
          }
      }
      return -1;
    }
     add_recent_file(path, displayname=path) {
      var rp=this.find_recent_path(path);
      path = new RecentPath(path, displayname);
      if (rp>=0) {
          try {
            this.recent_paths.remove(this.recent_paths[path]);
          }
          catch (error) {
              util.print_stack(error);
          }
          this.recent_paths.push(path);
      }
      else 
        if (this.recent_paths.length>=config.MAX_RECENT_FILES) {
          this.recent_paths.shift();
          this.recent_paths.push(path);
      }
      else {
        this.recent_paths.push(path);
      }
    }
     toJSON() {
      return this;
    }
    static  fromJSON(obj) {
      var as=new AppSettings();
      as.unit_scheme = obj.unit_scheme;
      as.unit = obj.unit;
      return as;
    }
    static  fromSTRUCT(reader) {
      var ret=new AppSettings();
      reader(ret);
      return ret;
    }
     on_tick() {
      if (this.update_waiting) {
          this.server_update();
      }
    }
     server_update(force=false) {
      force = force||config.NO_SERVER||time_ms()-this.last_server_update>3000;
      force = force&&window.g_app_state!==undefined;
      if (force) {
          _settings_manager.server_push(this);
          this.last_server_update = time_ms();
          this.update_waiting = false;
      }
      else {
        this.update_waiting = true;
      }
    }
     gen_file() {
      var blocks={USET: this};
      var args={blocks: blocks};
      return g_app_state.write_blocks(args);
    }
     download(on_finish=undefined) {
      function finish(data) {
        function finish2(data) {
          console.log("loading settings data...");
          var ret=g_app_state.load_blocks(data);
          if (ret==undefined) {
              console.trace("could not load settings : load_blocks returned undefined");
              return ;
          }
          var fstructs=ret.fstructs;
          var blocks=ret.blocks;
          var version=ret.version;
          var settings=undefined;
          for (var i=0; i<blocks.length; i++) {
              if (blocks[i].type=="USET") {
                  settings = fstructs.read_object(blocks[i].data, AppSettings);
              }
          }
          if (settings==undefined) {
              console.trace("could not find settings block");
              return ;
          }
          if (settings.theme!=undefined) {
              
              console.log("loading theme");
              g_theme.patch(settings.theme);
              g_theme = settings.theme;
              delete settings.theme;
              g_theme.gen_globals();
          }
          g_app_state.session.settings = settings;
          if (g_app_state.screen!=undefined) {
              redraw_viewport();
          }
          if (on_finish!=undefined) {
              on_finish(settings);
          }
        }
        try {
          finish2(data);
        }
        catch (_err) {
            print_stack(_err);
            console.log("exception occured while loading settings!");
        }
      }
      if (config.NO_SERVER) {
          startup_report("getting settings from myLocalStorage. . .");
          myLocalStorage.getAsync("_settings").then(function (settings) {
            var settings=b64decode(settings);
            settings = new DataView(settings.buffer);
            finish(settings);
          });
      }
      else {
        download_file("/"+fairmotion_settings_filename, finish, "Settings", true);
      }
    }
  }
  _ESClass.register(OldAppSettings);
  _es6_module.add_class(OldAppSettings);
  OldAppSettings = _es6_module.add_export('OldAppSettings', OldAppSettings);
  OldAppSettings.STRUCT = `
  OldAppSettings {
    unit_scheme  : string;
    unit         : string;
    theme        : Theme | g_theme;
    recent_paths : array(RecentPath);
  }
`;
  class SettUploadManager  {
     constructor() {
      this.next = undefined;
      this.active = undefined;
    }
     server_push(settings) {
      startup_report("writing settings");
      if (config.NO_SERVER) {
          var data=settings.gen_file().buffer;
          data = b64encode(new Uint8Array(data));
          myLocalStorage.set("_settings", data);
          return ;
      }
      var job=new UploadJob(undefined, settings);
      if (this.active!=undefined&&!this.active.done) {
          this.next = job;
      }
      else {
        this.active = upload_settings(settings, this);
      }
    }
     finish(job) {
      job.done = true;
      this.active = undefined;
      if (this.next!=undefined) {
          this.server_push(this.next.settings);
          this.next = undefined;
      }
    }
  }
  _ESClass.register(SettUploadManager);
  _es6_module.add_class(SettUploadManager);
  SettUploadManager = _es6_module.add_export('SettUploadManager', SettUploadManager);
  window._settings_manager = new SettUploadManager();
  class UploadJob  {
    
    
     constructor(data, settings=undefined) {
      this.cancel = false;
      this.data = data;
      this.done = false;
      this.settings = settings;
    }
  }
  _ESClass.register(UploadJob);
  _es6_module.add_class(UploadJob);
  UploadJob = _es6_module.add_export('UploadJob', UploadJob);
  function upload_settings(settings, uman) {
    var path="/"+fairmotion_settings_filename;
    var data=settings.gen_file().buffer;
    var pnote=g_app_state.notes.progbar("upload settings", 0.0, "uset");
    var ctx=new Context();
    var ujob=new UploadJob(data);
    var did_error=false;
    function error(job, owner, msg) {
      if (!did_error) {
          uman.finish(ujob);
          pnote.end();
          g_app_state.notes.label("Network Error");
          did_error = true;
      }
    }
    function status(job, owner, status) {
      pnote.set_value(status.progress);
    }
    var this2=this;
    function finish(job, owner) {
      uman.finish(ujob);
    }
    var token=g_app_state.session.tokens.access;
    var url="/api/files/upload/start?accessToken="+token+"&path="+path;
    var url2="/api/files/upload?accessToken="+token;
    call_api(upload_file, {data: data, 
    url: url, 
    chunk_url: url2}, finish, error, status);
    return ujob;
  }
}, '/dev/fairmotion/src/core/UserSettings.js');
es6_module_define('context', ["../editors/menubar/MenuBar.js", "../path.ux/scripts/controller/context.js", "../editors/console/console.js", "../editors/dopesheet/DopeSheetEditor.js", "../editors/curve/CurveEditor.js", "../editors/material/MaterialEditor.js", "./lib_api.js", "../editors/settings/SettingsEditor.js", "../curve/spline.js", "../path.ux/scripts/screen/FrameManager_ops.js", "../editors/ops/ops_editor.js", "../editors/editor_base.js", "./frameset.js", "./data_api/data_api.js", "../scene/scene.js", "../editors/viewport/view2d.js"], function _context_module(_es6_module) {
  var ContextOverlay=es6_import_item(_es6_module, '../path.ux/scripts/controller/context.js', 'ContextOverlay');
  var Context=es6_import_item(_es6_module, '../path.ux/scripts/controller/context.js', 'Context');
  class BaseContextOverlay extends ContextOverlay {
     constructor(state=g_app_state) {
      super(state);
    }
    get  appstate() {
      return this.state;
    }
    get  api() {
      return this.state.pathcontroller;
    }
    get  settings() {
      return this.appstate.settings;
    }
    get  toolmode() {
      return this.scene ? this.scene.toolmode : undefined;
    }
    get  active_area() {
      return Editor.active_area();
    }
     switch_active_spline(newpath) {
      g_app_state.switch_active_spline(newpath);
    }
    get  splinepath() {
      return g_app_state.active_splinepath===undefined ? "frameset.drawspline" : g_app_state.active_splinepath;
    }
    get  filepath() {
      return g_app_state.filepath;
    }
    get  edit_all_layers() {
      let scene=this.scene;
      return scene!==undefined ? scene.edit_all_layers : false;
    }
    get  spline() {
      var ret=this.api.getValue(this, g_app_state.active_splinepath);
      if (ret===undefined) {
          warntrace("Warning: bad spline path", g_app_state.active_splinepath);
          g_app_state.switch_active_spline("frameset.drawspline");
          ret = this.api.getValue(this, g_app_state.active_splinepath);
          if (ret===undefined) {
              warntrace("Even Worse: base spline path failed!", g_app_state.active_splinepath);
          }
      }
      return ret;
    }
    get  frameset() {
      return this.scene.objects.active.data;
    }
    get  scene() {
      var list=this.datalib.scenes;
      if (list.length==0) {
          console.warn("No scenes; adding empty scene");
          var scene=new Scene();
          scene.set_fake_user();
          this.datalib.add(scene);
      }
      return this.datalib.get_active(DataTypes.SCENE);
    }
    get  datalib() {
      return g_app_state.datalib;
    }
    get  toolstack() {
      return g_app_state.toolstack;
    }
    get  view2d() {
      var ret=Editor.context_area(View2DHandler);
      return ret;
    }
  }
  _ESClass.register(BaseContextOverlay);
  _es6_module.add_class(BaseContextOverlay);
  BaseContextOverlay = _es6_module.add_export('BaseContextOverlay', BaseContextOverlay);
  class ViewContextOverlay extends ContextOverlay {
    
     constructor(state=g_app_state) {
      super();
      this.appstate = state;
      this._keymap_mpos = [0, 0];
    }
    get  font() {
      return g_app_state.raster.font;
    }
    get  keymap_mpos() {
      return this._keymap_mpos;
    }
    get  dopesheet() {
      return Editor.context_area(DopeSheetEditor);
    }
    get  editcurve() {
      return Editor.context_area(CurveEditor);
    }
    get  settings_editor() {
      return Editor.context_area(SettingsEditor);
    }
    get  opseditor() {
      return Editor.context_area(OpStackEditor);
    }
    get  selectmode() {
      return this.view2d.selectmode;
    }
    get  console() {
      return Editor.context_area(ConsoleEditor);
    }
    get  view2d() {
      var ret=Editor.context_area(View2DHandler);
      return ret;
    }
    get  screen() {
      return g_app_state.screen;
    }
  }
  _ESClass.register(ViewContextOverlay);
  _es6_module.add_class(ViewContextOverlay);
  ViewContextOverlay = _es6_module.add_export('ViewContextOverlay', ViewContextOverlay);
  class BaseContext extends Context {
     constructor(state=g_app_state) {
      super(state);
      this.reset(state);
    }
     error(msg) {
      g_app_state.notes.label("ERROR: "+msg);
    }
     report(msg) {
      g_app_state.notes.label(msg);
    }
     reset(state=this.state) {
      this.pushOverlay(new BaseContextOverlay(state));
    }
     saveProperty(key) {
      let v=this[key];
      function passthru(v) {
        return {type: "passthru", 
      key: key, 
      value: v}
      }
      function lookup(v) {
        return {type: "lookup", 
      key: key, 
      value: v}
      }
      if (!v)
        return passthru(v);
      if (typeof v!=="object") {
          return passthru(v);
      }
      if (key==="spline") {
          return {type: "path", 
       key: key, 
       value: this.splinepath}
      }
      else 
        if (__instance_of(v, DataBlock)) {
          return {type: "block", 
       key: key, 
       value: new DataRef(v)}
      }
      return lookup(v);
    }
     loadProperty(ctx, key, val) {
      if (val.type==="lookup") {
          return ctx[val.key];
      }
      else 
        if (val.type==="path") {
          return ctx.api.getValue(ctx, val.value);
      }
      else 
        if (val.type==="passthru") {
          return val.value;
      }
      else 
        if (val.type==="block") {
          return ctx.datalib.get(val.value);
      }
    }
  }
  _ESClass.register(BaseContext);
  _es6_module.add_class(BaseContext);
  BaseContext = _es6_module.add_export('BaseContext', BaseContext);
  class FullContext extends BaseContext {
    
    
    
    
    
     constructor(state=g_app_state) {
      super(state);
      this.reset(state);
    }
     reset(state=this.state) {
      super.reset(state);
      this.pushOverlay(new ViewContextOverlay(state));
    }
  }
  _ESClass.register(FullContext);
  _es6_module.add_class(FullContext);
  FullContext = _es6_module.add_export('FullContext', FullContext);
  window.Context = FullContext;
  var SplineFrameSet=es6_import_item(_es6_module, './frameset.js', 'SplineFrameSet');
  var SettingsEditor=es6_import_item(_es6_module, '../editors/settings/SettingsEditor.js', 'SettingsEditor');
  var MenuBar=es6_import_item(_es6_module, '../editors/menubar/MenuBar.js', 'MenuBar');
  var DataTypes=es6_import_item(_es6_module, './lib_api.js', 'DataTypes');
  var DataBlock=es6_import_item(_es6_module, './lib_api.js', 'DataBlock');
  var ConsoleEditor=es6_import_item(_es6_module, '../editors/console/console.js', 'ConsoleEditor');
  var CurveEditor=es6_import_item(_es6_module, '../editors/curve/CurveEditor.js', 'CurveEditor');
  var OpStackEditor=es6_import_item(_es6_module, '../editors/ops/ops_editor.js', 'OpStackEditor');
  var MaterialEditor=es6_import_item(_es6_module, '../editors/material/MaterialEditor.js', 'MaterialEditor');
  var DopeSheetEditor=es6_import_item(_es6_module, '../editors/dopesheet/DopeSheetEditor.js', 'DopeSheetEditor');
  var SettingsEditor=es6_import_item(_es6_module, '../editors/settings/SettingsEditor.js', 'SettingsEditor');
  var MenuBar=es6_import_item(_es6_module, '../editors/menubar/MenuBar.js', 'MenuBar');
  var registerToolStackGetter=es6_import_item(_es6_module, '../path.ux/scripts/screen/FrameManager_ops.js', 'registerToolStackGetter');
  var FairmotionScreen=es6_import_item(_es6_module, '../editors/editor_base.js', 'FairmotionScreen');
  var resetAreaStacks=es6_import_item(_es6_module, '../editors/editor_base.js', 'resetAreaStacks');
  var Editor=es6_import_item(_es6_module, '../editors/editor_base.js', 'Editor');
  var View2DHandler=es6_import_item(_es6_module, '../editors/viewport/view2d.js', 'View2DHandler');
  var Scene=es6_import_item(_es6_module, '../scene/scene.js', 'Scene');
  var Spline=es6_import_item(_es6_module, '../curve/spline.js', 'Spline');
  var DataAPI=es6_import_item(_es6_module, './data_api/data_api.js', 'DataAPI');
}, '/dev/fairmotion/src/core/context.js');
es6_module_define('toolstack', ["./data_api/data_api.js", "./toolprops.js", "./context.js", "./AppState.js", "./toolops_api.js"], function _toolstack_module(_es6_module) {
  var BaseContext=es6_import_item(_es6_module, './context.js', 'BaseContext');
  var FullContext=es6_import_item(_es6_module, './context.js', 'FullContext');
  var ToolFlags=es6_import_item(_es6_module, './toolops_api.js', 'ToolFlags');
  var ToolMacro=es6_import_item(_es6_module, './toolops_api.js', 'ToolMacro');
  var ToolOp=es6_import_item(_es6_module, './toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, './toolops_api.js', 'UndoFlags');
  var DataFlags=es6_import_item(_es6_module, './data_api/data_api.js', 'DataFlags');
  var DataPath=es6_import_item(_es6_module, './data_api/data_api.js', 'DataPath');
  var DataStruct=es6_import_item(_es6_module, './data_api/data_api.js', 'DataStruct');
  var DataStructArray=es6_import_item(_es6_module, './data_api/data_api.js', 'DataStructArray');
  var CollectionProperty=es6_import_item(_es6_module, './toolprops.js', 'CollectionProperty');
  var StringProperty=es6_import_item(_es6_module, './toolprops.js', 'StringProperty');
  var TPropFlags=es6_import_item(_es6_module, './toolprops.js', 'TPropFlags');
  class ToolStack  {
    
    
    
    
    
     constructor(appstate) {
      this.undocur = 0;
      this.undostack = new Array();
      this.appstate = appstate;
      this.valcache = appstate.toolop_input_cache;
      this.do_truncate = true;
    }
     reexec_stack2(validate=false) {
      let stack=this.undostack;
      g_app_state.datalib.clear();
      let mctx=new FullContext().toLocked();
      let first=true;
      let last_time=0;
      function do_next(i) {
        let tool=stack[i];
        let ctx=tool.saved_context;
        if ((1||ctx.time!==last_time)&&mctx.frameset!==undefined) {
            mctx.frameset.update_frame();
        }
        ctx.set_context(mctx);
        last_time = ctx.time;
        tool.is_modal = false;
        tool.exec_pre(ctx);
        if (!(tool.undoflag&UndoFlags.IGNORE_UNDO)) {
            tool.undo_pre(ctx);
            tool.undoflag|=UndoFlags.HAS_UNDO_DATA;
        }
        tool.exec(ctx);
        if (mctx.frameset!==undefined)
          mctx.frameset.spline.solve();
        if (mctx.frameset!==undefined)
          mctx.frameset.pathspline.solve();
        if ((1||ctx.time!==last_time)&&mctx.frameset!==undefined) {
            mctx.frameset.update_frame();
        }
      }
      let ival;
      let thei;
      let this2=this;
      function cbfunc() {
        do_next(thei);
        thei+=1;
        let cctx=new FullContextt().toLocked();
        if (cctx.frameset!==undefined) {
            cctx.frameset.spline.solve();
            cctx.frameset.pathspline.solve();
        }
        window.redraw_viewport();
        clearInterval(ival);
        if (thei<this2.undostack.length)
          ival = window.setInterval(cbfunc, 500);
      }
      do_next(0);
      thei = 1;
      ival = window.setInterval(cbfunc, 500);
      console.log("reexecuting tool stack from scratch. . .");
      for (let i=0; i<this.undocur; i++) {

      }
    }
     reexec_stack(validate=false) {
      let stack=this.undostack;
      g_app_state.datalib.clear();
      let mctx=new FullContext();
      let first=true;
      console.log("reexecuting tool stack from scratch. . .");
      for (let i=0; i<this.undocur; i++) {
          let tool=stack[i];
          let ctx=tool.saved_context;
          ctx.set_context(mctx);
          tool.is_modal = false;
          tool.exec_pre(ctx);
          if (!(tool.undoflag&UndoFlags.IGNORE_UNDO)) {
              tool.undo_pre(ctx);
              tool.undoflag|=UndoFlags.HAS_UNDO_DATA;
          }
          tool.exec(ctx);
      }
    }
     default_inputs(ctx, tool) {
      let cache=this.valcache;
      function get_default(key, defaultval, input_prop) {
        key = tool.constructor.name+":"+key;
        if (key in cache)
          return cache[key];
        cache[key] = defaultval;
        return defaultval;
      }
      let tctx=ctx.toLocked();
      for (let k in tool.inputs) {
          tool.inputs[k].ctx = tctx;
      }
      for (let k in tool.outputs) {
          tool.outputs[k].ctx = tctx;
      }
      tool.default_inputs(ctx, get_default);
    }
     truncate_stack() {
      if (this.undocur!==this.undostack.length) {
          if (this.undocur===0) {
              this.undostack = new Array();
          }
          else {
            this.undostack = this.undostack.slice(0, this.undocur);
          }
      }
    }
     undo_push(tool) {
      if (this.do_truncate) {
          this.truncate_stack();
          this.undostack.push(tool);
      }
      else {
        this.undostack.insert(this.undocur, tool);
        for (let i=this.undocur-1; i<this.undostack.length; i++) {
            if (i<0)
              continue;
            this.undostack[i].stack_index = i;
        }
      }
      tool.stack_index = this.undostack.indexOf(tool);
      this.undocur++;
    }
     toolop_cancel(op, executeUndo) {
      if (executeUndo===undefined) {
          console.warn("Warning, executeUndo in toolop_cancel() was undefined");
      }
      if (executeUndo) {
          this.undo();
      }
      else {
        if (this.undostack.indexOf(op)>=0) {
            this.undostack.remove(op);
            this.undocur--;
        }
      }
    }
    get  head() {
      return this.undostack[this.undocur-1];
    }
     undo() {
      the_global_dag.exec(this.ctx);
      if (this.undocur>0&&(this.undostack[this.undocur-1].undoflag&UndoFlags.UNDO_BARRIER))
        return ;
      if (this.undocur>0&&!(this.undostack[this.undocur-1].undoflag&UndoFlags.HAS_UNDO_DATA))
        return ;
      if (this.undocur>0) {
          this.undocur--;
          let tool=this.undostack[this.undocur];
          let ctx=new FullContext();
          let tctx=(tool.flag&ToolFlags.USE_TOOL_CONTEXT) ? tool.ctx : ctx;
          if (the_global_dag!==undefined)
            the_global_dag.reset_cache();
          tool.saved_context.set_context(ctx);
          tool.undo(tctx);
          if (the_global_dag!==undefined)
            the_global_dag.reset_cache();
          if (this.undocur>0)
            this.rebuild_last_tool(this.undostack[this.undocur-1]);
          window.redraw_viewport();
      }
    }
     redo() {
      the_global_dag.exec(this.ctx);
      if (this.undocur<this.undostack.length) {
          let tool=this.undostack[this.undocur];
          let ctx=new FullContext();
          tool.saved_context.set_context(ctx);
          tool.is_modal = false;
          if (!(tool.undoflag&UndoFlags.IGNORE_UNDO)) {
              tool.undo_pre((tool.flag&ToolFlags.USE_TOOL_CONTEXT) ? tool.ctx : ctx);
              tool.undoflag|=UndoFlags.HAS_UNDO_DATA;
          }
          let tctx=(tool.flag&ToolFlags.USE_TOOL_CONTEXT) ? tool.ctx : tool.ctx.toLocked();
          if (the_global_dag!==undefined)
            the_global_dag.reset_cache();
          tool.exec_pre(tctx);
          tool.exec(tctx);
          tool.redo_post(ctx);
          this.undocur++;
          if (this.undocur>0)
            this.rebuild_last_tool(this.undostack[this.undocur-1]);
      }
    }
     reexec_tool(tool) {
      if (!(tool.undoflag&UndoFlags.HAS_UNDO_DATA)) {
          this.reexec_stack();
      }
      if (tool.stack_index===-1) {
          for (let i=0; i<this.undostack.length; i++) {
              this.undostack[i].stack_index = i;
          }
      }
      if (tool===this.undostack[this.undocur-1]) {
          this.undo();
          this.redo();
      }
      else 
        if (this.undocur>tool.stack_index) {
          let i=0;
          while (this.undocur!==tool.stack_index) {
            this.undo();
            i++;
          }
          while (i>=0) {
            this.redo();
            i--;
          }
      }
      else {
        console.log("reexec_tool: can't reexec tool in inactive portion of stack");
      }
      tool.saved_context = new SavedContext(new FullContext());
    }
     kill_opstack() {
      this.undostack = new Array();
      this.undocur = 0;
    }
     gen_tool_datastruct(tool) {
      let datastruct=new DataStruct([]);
      let this2=this;
      let stacktool=tool;
      while (stacktool.parent!==undefined) {
        stacktool = stacktool.parent;
      }
      function makeUpdate(tool, prop, k) {
        return function update_dataprop(d) {
          if (prop.flag&TPropFlags.SAVE_LAST_VALUE) {
              console.log(tool, prop, k, prop.getValue(), "<-----");
              this.ctx.settings.setToolOpSetting(tool.constructor, k, prop.getValue());
          }
          this2.reexec_tool(stacktool);
        }
      }
      function gen_subtool_struct(tool) {
        if (tool.apistruct===undefined)
          tool.apistruct = this2.gen_tool_datastruct(tool);
        return tool.apistruct;
      }
      let prop=new StringProperty(tool.uiname, tool.uiname, tool.uiname, "Tool Name");
      let dataprop=new DataPath(prop, "tool", "tool_name", true, false);
      dataprop.update = function () {
      };
      prop.flag = TPropFlags.LABEL;
      if (!(tool.flag&ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS)) {
          datastruct.add(dataprop);
      }
      for (let k in tool.inputs) {
          prop = tool.inputs[k];
          if (prop.flag&TPropFlags.PRIVATE)
            continue;
          let name=prop.uiname||prop.apiname||k;
          prop.uiname = name;
          let apiname=prop.apiname||k;
          dataprop = new DataPath(prop, apiname, "", true, false);
          dataprop.update = makeUpdate(tool, prop, k);
          datastruct.add(dataprop);
      }
      if (__instance_of(tool, ToolMacro)) {
          let tarr=new DataStructArray(gen_subtool_struct);
          let toolsprop=new DataPath(tarr, "tools", "tools", false);
          datastruct.add(toolsprop);
      }
      return datastruct;
    }
     rebuild_last_tool(tool) {
      let s;
      if (tool!==undefined)
        s = this.gen_tool_datastruct(tool);
      else 
        s = new DataStruct([]);
      s.flag|=DataFlags.RECALC_CACHE;
      s.name = "last_tool";
      s = new DataPath(s, "last_tool", "", false, false);
      s.flag|=DataFlags.RECALC_CACHE;
      ContextStruct.addOrReplace(s, s);
    }
     set_tool_coll_flag(tool) {
      for (let k in tool.inputs) {
          let p=tool.inputs[k];
          if (__instance_of(p, CollectionProperty))
            p.flag&=~TPropFlags.COLL_LOOSE_TYPE;
      }
      for (let k in tool.outputs) {
          let p=tool.inputs[k];
          if (__instance_of(p, CollectionProperty))
            p.flag&=~TPropFlags.COLL_LOOSE_TYPE;
      }
      if (__instance_of(tool, ToolMacro)) {
          for (let t2 of tool.tools) {
              this.set_tool_coll_flag(t2);
          }
      }
    }
     exec_datapath(ctx, path, val, undo_push=true, use_simple_undo=false, cls=DataPathOp) {
      let api=g_app_state.api;
      let prop=api.get_prop_meta(ctx, path);
      if (prop===undefined) {
          console.trace("Error in exec_datapath", path);
          return ;
      }
      let good=this.undostack.length>0&&__instance_of(this.undostack[this.undocur-1], cls);
      good = good&&this.undostack[this.undocur-1].path===path;
      let exists=false;
      if (undo_push||!good) {
          let op=new cls(path, use_simple_undo);
      }
      else {
        op = this.undostack[this.undocur-1];
        this.undo();
        exists = true;
      }
      let input=op.get_prop_input(path, prop);
      input.setValue(val);
      if (exists) {
          this.redo();
      }
      else {
        this.exec_tool(op);
      }
    }
     exec_tool(tool) {
      console.warn("exec_tool deprecated in favor of execTool");
      return this.execTool(g_app_state.ctx, tool);
    }
     execToolRepeat(ctx, cls, args={}) {
      let tools=cls.getRepeat(ctx, args);
      for (let tool of tools) {
          tool.flag|=ToolFlags.USE_TOOL_CONTEXT;
      }
      let macro=new ToolMacro(cls.tooldef().apiname, cls.tooldef().uiname, tools);
      this.execTool(macro);
    }
     error(msg) {
      console.error(msg);
      g_app_state.ctx.error(msg);
    }
     execTool(ctx, tool) {
      if (__instance_of(ctx, ToolOp)) {
          console.warn("Bad arguments to g_app_state.toolstack.execTool()");
          tool = ctx;
          ctx = g_app_state.ctx;
      }
      the_global_dag.exec(this.ctx);
      this.set_tool_coll_flag(tool);
      ctx = new FullContext();
      tool.ctx = ctx;
      if (tool.constructor.canRun(ctx)===false) {
          if (DEBUG.toolstack) {
              console.trace();
              console.log(tool);
          }
          this.error("Can not call tool '"+tool.constructor.name+"'");
          return ;
      }
      if (!(tool.undoflag&UndoFlags.IGNORE_UNDO))
        this.undo_push(tool);
      for (let k in tool.inputs) {
          let p=tool.inputs[k];
          p.ctx = ctx;
          if (p.userSetData!==undefined)
            p.userSetData.call(p, p.data);
      }
      if (tool.is_modal) {
          let modal_ctx=ctx.toLocked();
          tool.modal_ctx = modal_ctx;
          tool.modal_tctx = new BaseContext().toLocked();
          tool.saved_context = new SavedContext(tool.modal_tctx);
          tool.exec_pre(tool.modal_tctx);
          if (!(tool.undoflag&UndoFlags.IGNORE_UNDO)) {
              if (tool.is_modal)
                tool.modal_running = true;
              tool.undo_pre(modal_ctx);
              tool.undoflag|=UndoFlags.HAS_UNDO_DATA;
              if (tool.is_modal)
                tool.modal_running = false;
          }
          tool._start_modal(modal_ctx);
          tool.start_modal(modal_ctx);
      }
      else {
        let tctx=(tool.flag&ToolFlags.USE_TOOL_CONTEXT) ? new BaseContext().toLocked() : ctx.toLocked();
        tool.saved_context = new SavedContext(tctx);
        if (!(tool.undoflag&UndoFlags.IGNORE_UNDO)) {
            tool.undo_pre((tool.flag&ToolFlags.USE_TOOL_CONTEXT) ? tool.ctx : ctx);
            tool.undoflag|=UndoFlags.HAS_UNDO_DATA;
        }
        tool.exec_pre(tctx);
        tool.exec(tctx);
      }
      if (!(tool.undoflag&UndoFlags.IGNORE_UNDO)) {
          this.rebuild_last_tool(tool);
      }
    }
    static  fromSTRUCT(reader) {
      let ts=new ToolStack(g_app_state);
      reader(ts);
      ts.undostack = new Array(ts.undostack);
      for (let i=0; i<ts.undostack.length; i++) {
          ts.undostack[i].stack_index = i;
          ts.set_tool_coll_flag(ts.undostack[i]);
      }
      return ts;
    }
  }
  _ESClass.register(ToolStack);
  _es6_module.add_class(ToolStack);
  ToolStack = _es6_module.add_export('ToolStack', ToolStack);
  ToolStack.STRUCT = `
  ToolStack {
    undocur   : int;
    undostack : array(abstract(ToolOp)) | obj.undostack.slice(0, obj.undocur);
  }
`;
  var AppState=es6_import_item(_es6_module, './AppState.js', 'AppState');
}, '/dev/fairmotion/src/core/toolstack.js');
es6_module_define('AppState', ["./struct.js", "../curve/spline_base.js", "./lib_utils.js", "../config/config.js", "../path.ux/scripts/screen/ScreenArea.js", "../path.ux/scripts/platforms/electron/electron_api.js", "./toolops_api.js", "../editors/viewport/view2d.js", "./toolprops.js", "../path.ux/scripts/core/ui_base.js", "../editors/dopesheet/DopeSheetEditor.js", "./raster.js", "./toolstack.js", "./context.js", "../editors/all.js", "../editors/curve/CurveEditor.js", "./data_api/data_api.js", "../editors/theme.js", "./fileapi/fileapi.js", "./ajax.js", "../editors/menubar/MenuBar.js", "../editors/console/console.js", "../editors/editor_base.js", "../editors/material/MaterialEditor.js", "../path.ux/scripts/config/const.js", "../util/strutils.js", "../editors/settings/SettingsEditor.js", "./lib_api.js", "./notifications.js", "../path.ux/scripts/screen/FrameManager.js", "../scene/scene.js", "./frameset.js", "./startup/startup_file_example.js", "../editors/ops/ops_editor.js", "../path.ux/scripts/util/util.js", "../../platforms/platform.js", "./UserSettings.js", "./lib_api_typedefine.js", "../path.ux/scripts/screen/FrameManager_ops.js", "./startup/startup_file.js", "../editors/viewport/view2d_ops.js", "./jobs.js", "./data_api/data_api_pathux.js"], function _AppState_module(_es6_module) {
  "use strict";
  es6_import(_es6_module, '../editors/all.js');
  var platform=es6_import(_es6_module, '../../platforms/platform.js');
  var electron_api=es6_import(_es6_module, '../path.ux/scripts/platforms/electron/electron_api.js');
  var ToolStack=es6_import_item(_es6_module, './toolstack.js', 'ToolStack');
  if (window.haveElectron) {
      electron_api.checkInit();
  }
  var theme=es6_import(_es6_module, '../editors/theme.js');
  var config=es6_import(_es6_module, '../config/config.js');
  var html5_fileapi=es6_import(_es6_module, './fileapi/fileapi.js');
  var FullContext=es6_import_item(_es6_module, './context.js', 'FullContext');
  var BaseContext=es6_import_item(_es6_module, './context.js', 'BaseContext');
  var BaseContextOverlay=es6_import_item(_es6_module, './context.js', 'BaseContextOverlay');
  let _ex_FullContext=es6_import_item(_es6_module, './context.js', 'FullContext');
  _es6_module.add_export('FullContext', _ex_FullContext, true);
  let _ex_BaseContext=es6_import_item(_es6_module, './context.js', 'BaseContext');
  _es6_module.add_export('BaseContext', _ex_BaseContext, true);
  let _ex_BaseContextOverlay=es6_import_item(_es6_module, './context.js', 'BaseContextOverlay');
  _es6_module.add_export('BaseContextOverlay', _ex_BaseContextOverlay, true);
  var SplineFrameSet=es6_import_item(_es6_module, './frameset.js', 'SplineFrameSet');
  var ConsoleEditor=es6_import_item(_es6_module, '../editors/console/console.js', 'ConsoleEditor');
  var CurveEditor=es6_import_item(_es6_module, '../editors/curve/CurveEditor.js', 'CurveEditor');
  var OpStackEditor=es6_import_item(_es6_module, '../editors/ops/ops_editor.js', 'OpStackEditor');
  var View2DHandler=es6_import_item(_es6_module, '../editors/viewport/view2d.js', 'View2DHandler');
  var MaterialEditor=es6_import_item(_es6_module, '../editors/material/MaterialEditor.js', 'MaterialEditor');
  var DopeSheetEditor=es6_import_item(_es6_module, '../editors/dopesheet/DopeSheetEditor.js', 'DopeSheetEditor');
  var SettingsEditor=es6_import_item(_es6_module, '../editors/settings/SettingsEditor.js', 'SettingsEditor');
  var MenuBar=es6_import_item(_es6_module, '../editors/menubar/MenuBar.js', 'MenuBar');
  var registerToolStackGetter=es6_import_item(_es6_module, '../path.ux/scripts/screen/FrameManager_ops.js', 'registerToolStackGetter');
  var FairmotionScreen=es6_import_item(_es6_module, '../editors/editor_base.js', 'FairmotionScreen');
  var resetAreaStacks=es6_import_item(_es6_module, '../editors/editor_base.js', 'resetAreaStacks');
  var iconmanager=es6_import_item(_es6_module, '../path.ux/scripts/core/ui_base.js', 'iconmanager');
  var setIconMap=es6_import_item(_es6_module, '../path.ux/scripts/core/ui_base.js', 'setIconMap');
  var setTheme=es6_import_item(_es6_module, '../path.ux/scripts/core/ui_base.js', 'setTheme');
  var Editor=es6_import_item(_es6_module, '../editors/editor_base.js', 'Editor');
  var cconst=es6_import_item(_es6_module, '../path.ux/scripts/config/const.js', 'default');
  var termColor=es6_import_item(_es6_module, '../path.ux/scripts/util/util.js', 'termColor');
  cconst.loadConstants(config.PathUXConstants);
  iconmanager.reset(16);
  setTheme(theme.theme);
  setIconMap(window.Icons);
  if (window.devicePixelRatio>1.1) {
  }
  else {
  }
  iconmanager.add(document.getElementById("iconsheet32"), 32, 16);
  iconmanager.add(document.getElementById("iconsheet64"), 64, 32);
  var Area=es6_import_item(_es6_module, '../path.ux/scripts/screen/ScreenArea.js', 'Area');
  Area.prototype.getScreen = () =>    {
    return g_app_state.screen;
  }
  registerToolStackGetter(() =>    {
    return g_app_state.toolstack;
  });
  let AreaTypes={VIEW2D: View2DHandler, 
   SETTINGS: SettingsEditor, 
   OPSTACK: OpStackEditor, 
   MATERIAL: MaterialEditor, 
   DOPESHEET: DopeSheetEditor, 
   CURVE: CurveEditor, 
   MENUBAR: MenuBar}
  AreaTypes = _es6_module.add_export('AreaTypes', AreaTypes);
  var setAreaTypes=es6_import_item(_es6_module, '../path.ux/scripts/screen/ScreenArea.js', 'setAreaTypes');
  setAreaTypes(AreaTypes);
  var Screen=es6_import_item(_es6_module, '../path.ux/scripts/screen/FrameManager.js', 'Screen');
  var PathUXInterface=es6_import_item(_es6_module, './data_api/data_api_pathux.js', 'PathUXInterface');
  function get_app_div() {
    let app=document.getElementById("app");
    if (!app) {
        app = document.body;
    }
    return app;
  }
  get_app_div = _es6_module.add_export('get_app_div', get_app_div);
  function gen_screen(unused, w, h) {
    let app=get_app_div();
    let screen=document.getElementById("screenmain");
    if (screen) {
        screen.clear();
    }
    else {
      screen = document.createElement("fairmotion-screen-x");
      resetAreaStacks();
      app.appendChild(screen);
    }
    screen.style["position"] = "absolute";
    screen.setAttribute("id", "screenmain");
    screen.id = "screenmain";
    screen.size = [window.innerWidth, window.innerHeight];
    screen.ctx = new FullContext();
    let sarea=document.createElement("screenarea-x");
    sarea.size[0] = window.innerWidth;
    sarea.size[1] = window.innerHeight;
    screen.appendChild(sarea);
    sarea.setCSS();
    screen.setCSS();
    screen.makeBorders();
    sarea.switch_editor(View2DHandler);
    sarea.area.setCSS();
    let t=MenuBar.getHeight()/sarea.size[1];
    let view2d=screen.splitArea(sarea, t);
    sarea.switch_editor(MenuBar);
    let mated=screen.splitArea(view2d, 0.7, false);
    mated.switch_editor(MaterialEditor);
    g_app_state.screen = screen;
    g_app_state.eventhandler = screen;
    app.appendChild(screen);
  }
  gen_screen = _es6_module.add_export('gen_screen', gen_screen);
  es6_import(_es6_module, './startup/startup_file_example.js');
  var startup_file=es6_import_item(_es6_module, './startup/startup_file.js', 'startup_file');
  var DataPath=es6_import_item(_es6_module, './data_api/data_api.js', 'DataPath');
  var DataStruct=es6_import_item(_es6_module, './data_api/data_api.js', 'DataStruct');
  var DataPathTypes=es6_import_item(_es6_module, './data_api/data_api.js', 'DataPathTypes');
  var DataFlags=es6_import_item(_es6_module, './data_api/data_api.js', 'DataFlags');
  var DataAPI=es6_import_item(_es6_module, './data_api/data_api.js', 'DataAPI');
  var DataStructArray=es6_import_item(_es6_module, './data_api/data_api.js', 'DataStructArray');
  var wrap_getblock=es6_import_item(_es6_module, './lib_utils.js', 'wrap_getblock');
  var wrap_getblock_us=es6_import_item(_es6_module, './lib_utils.js', 'wrap_getblock_us');
  var urlencode=es6_import_item(_es6_module, '../util/strutils.js', 'urlencode');
  var b64decode=es6_import_item(_es6_module, '../util/strutils.js', 'b64decode');
  var b64encode=es6_import_item(_es6_module, '../util/strutils.js', 'b64encode');
  var BasicFileOp=es6_import_item(_es6_module, '../editors/viewport/view2d_ops.js', 'BasicFileOp');
  var AppSettings=es6_import_item(_es6_module, './UserSettings.js', 'AppSettings');
  var JobManager=es6_import_item(_es6_module, './jobs.js', 'JobManager');
  var RasterState=es6_import_item(_es6_module, './raster.js', 'RasterState');
  var NotificationManager=es6_import_item(_es6_module, './notifications.js', 'NotificationManager');
  var Notification=es6_import_item(_es6_module, './notifications.js', 'Notification');
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  var get_data_typemap=es6_import_item(_es6_module, './lib_api_typedefine.js', 'get_data_typemap');
  var Screen=es6_import_item(_es6_module, '../path.ux/scripts/screen/FrameManager.js', 'Screen');
  var ScreenArea=es6_import_item(_es6_module, '../path.ux/scripts/screen/ScreenArea.js', 'ScreenArea');
  var Area=es6_import_item(_es6_module, '../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var DataLib=es6_import_item(_es6_module, './lib_api.js', 'DataLib');
  var DataBlock=es6_import_item(_es6_module, './lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, './lib_api.js', 'DataTypes');
  var ToolMacro=es6_import_item(_es6_module, './toolops_api.js', 'ToolMacro');
  var ToolOp=es6_import_item(_es6_module, './toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, './toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, './toolops_api.js', 'ToolFlags');
  var PropTypes=es6_import_item(_es6_module, './toolprops.js', 'PropTypes');
  var TPropFlags=es6_import_item(_es6_module, './toolprops.js', 'TPropFlags');
  var StringProperty=es6_import_item(_es6_module, './toolprops.js', 'StringProperty');
  var CollectionProperty=es6_import_item(_es6_module, './toolprops.js', 'CollectionProperty');
  var View2DHandler=es6_import_item(_es6_module, '../editors/viewport/view2d.js', 'View2DHandler');
  var Scene=es6_import_item(_es6_module, '../scene/scene.js', 'Scene');
  var SplineTypes=es6_import_item(_es6_module, '../curve/spline_base.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../curve/spline_base.js', 'SplineFlags');
  var DopeSheetEditor=es6_import_item(_es6_module, '../editors/dopesheet/DopeSheetEditor.js', 'DopeSheetEditor');
  var CurveEditor=es6_import_item(_es6_module, '../editors/curve/CurveEditor.js', 'CurveEditor');
  var OpStackEditor=es6_import_item(_es6_module, '../editors/ops/ops_editor.js', 'OpStackEditor');
  var pack_byte=es6_import_item(_es6_module, './ajax.js', 'pack_byte');
  var pack_short=es6_import_item(_es6_module, './ajax.js', 'pack_short');
  var pack_int=es6_import_item(_es6_module, './ajax.js', 'pack_int');
  var pack_float=es6_import_item(_es6_module, './ajax.js', 'pack_float');
  var pack_double=es6_import_item(_es6_module, './ajax.js', 'pack_double');
  var pack_vec2=es6_import_item(_es6_module, './ajax.js', 'pack_vec2');
  var pack_vec3=es6_import_item(_es6_module, './ajax.js', 'pack_vec3');
  var pack_vec4=es6_import_item(_es6_module, './ajax.js', 'pack_vec4');
  var pack_mat4=es6_import_item(_es6_module, './ajax.js', 'pack_mat4');
  var pack_quat=es6_import_item(_es6_module, './ajax.js', 'pack_quat');
  var pack_dataref=es6_import_item(_es6_module, './ajax.js', 'pack_dataref');
  var pack_string=es6_import_item(_es6_module, './ajax.js', 'pack_string');
  var pack_static_string=es6_import_item(_es6_module, './ajax.js', 'pack_static_string');
  var unpack_byte=es6_import_item(_es6_module, './ajax.js', 'unpack_byte');
  var unpack_short=es6_import_item(_es6_module, './ajax.js', 'unpack_short');
  var unpack_int=es6_import_item(_es6_module, './ajax.js', 'unpack_int');
  var unpack_float=es6_import_item(_es6_module, './ajax.js', 'unpack_float');
  var unpack_double=es6_import_item(_es6_module, './ajax.js', 'unpack_double');
  var unpack_vec2=es6_import_item(_es6_module, './ajax.js', 'unpack_vec2');
  var unpack_vec3=es6_import_item(_es6_module, './ajax.js', 'unpack_vec3');
  var unpack_vec4=es6_import_item(_es6_module, './ajax.js', 'unpack_vec4');
  var unpack_mat4=es6_import_item(_es6_module, './ajax.js', 'unpack_mat4');
  var unpack_quat=es6_import_item(_es6_module, './ajax.js', 'unpack_quat');
  var unpack_dataref=es6_import_item(_es6_module, './ajax.js', 'unpack_dataref');
  var unpack_string=es6_import_item(_es6_module, './ajax.js', 'unpack_string');
  var unpack_static_string=es6_import_item(_es6_module, './ajax.js', 'unpack_static_string');
  var unpack_bytes=es6_import_item(_es6_module, './ajax.js', 'unpack_bytes');
  var unpack_ctx=es6_import_item(_es6_module, './ajax.js', 'unpack_ctx');
  var profile_reset=es6_import_item(_es6_module, './struct.js', 'profile_reset');
  var profile_report=es6_import_item(_es6_module, './struct.js', 'profile_report');
  var gen_struct_str=es6_import_item(_es6_module, './struct.js', 'gen_struct_str');
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  let FileFlags={COMPRESSED_LZSTRING: 1}
  FileFlags = _es6_module.add_export('FileFlags', FileFlags);
  class FileData  {
     constructor(blocks, fstructs, version) {
      this.blocks = blocks;
      this.fstructs = fstructs;
      this.version = version;
    }
  }
  _ESClass.register(FileData);
  _es6_module.add_class(FileData);
  FileData = _es6_module.add_export('FileData', FileData);
  function ensureMenuBar(appstate, screen) {
    for (let sarea of screen.sareas) {
        if (!sarea.area||!(__instance_of(sarea.area, MenuBar))) {
            continue;
        }
        return ;
    }
    screen.regenScreenMesh();
    console.log("Adding menu bar", screen.size);
    let scale=(screen.size[1]-MenuBar.getHeight())/screen.size[1];
    for (let sv of screen.screenverts) {
        sv[1] = sv[1]*scale+MenuBar.getHeight();
    }
    screen.loadFromVerts();
    let sarea2=document.createElement("screenarea-x");
    sarea2.pos[0] = 0;
    sarea2.pos[1] = 0;
    sarea2.size[0] = screen.size[0];
    sarea2.size[1] = MenuBar.getHeight();
    screen.appendChild(sarea2);
    sarea2.switch_editor(MenuBar);
    screen.regenScreenMesh();
    screen.snapScreenVerts();
  }
  function patchScreen(appstate, fstructs, data) {
    let fakeclass={fromSTRUCT: (reader) =>        {
        let ret={}
        reader(ret);
        return ret;
      }, 
    structName: "Screen", 
    name: "Screen"}
    fakeclass.prototype = Object.create(Object.prototype);
    data = fstructs.read_object(data, fakeclass);
    let screen=document.createElement("fairmotion-screen-x");
    resetAreaStacks();
    screen.size = data.size;
    console.log(data);
    console.log("SCREEN SIZE", screen.size);
    for (let sarea of data.areas) {
        console.log("AREA!");
        let sarea2=document.createElement("screenarea-x");
        sarea2.size = sarea.size;
        sarea2.pos = sarea.pos;
        for (let editor of sarea.editors) {
            let areaname=editor.constructor.define().areaname;
            sarea2.editors.push(editor);
            sarea2.editormap[areaname] = editor;
            if (editor.constructor.name===sarea.area) {
                sarea2.area = editor;
                sarea2.shadow.appendChild(editor);
            }
        }
        screen.appendChild(sarea2);
    }
    ensureMenuBar(appstate, screen);
    return screen;
  }
  class UserSession  {
    
    
    
    
    
    
     constructor() {
      this.tokens = {};
      this.username = "user";
      this.password = "";
      this.is_logged_in = true;
      this.loaded_settings = false;
      this.userid = undefined;
      this.settings = new AppSettings();
      this.settings.load();
    }
     copy() {
      let c=new UserSession();
      for (let k in this.tokens) {
          c.tokens[k] = this.tokens[k];
      }
      c.username = this.username;
      c.password = this.password;
      c.is_logged_in = this.is_logged_in;
      c.loaded_settings = false;
      c.settings = this.settings;
      c.userid = this.userid;
      return c;
    }
     store(override_settings=false) {
      let saveobj=this.copy();
      if (!override_settings&&myLocalStorage.hasCached("session")) {
          try {
            let old=JSON.parse(myLocalStorage.getCached("session"));
            saveobj.settings = old;
          }
          catch (error) {
              print_stack(error);
              console.log("error loading session json object");
          }
      }
      myLocalStorage.set("session", JSON.stringify(saveobj));
    }
     logout_simple() {

    }
     validate_session() {
      return true;
    }
    static  fromJSON(obj) {
      let us=new UserSession;
      us.tokens = obj.tokens;
      us.username = obj.username;
      us.password = obj.password;
      us.is_logged_in = obj.is_logged_in;
      us.userid = obj.userid;
      us.settings = new AppSettings();
      us.settings.load();
      return us;
    }
  }
  _ESClass.register(UserSession);
  _es6_module.add_class(UserSession);
  window.test_load_file = function () {
    let buf=startup_file;
    buf = new DataView(b64decode(buf).buffer);
    g_app_state.load_user_file_new(buf, undefined, new unpack_ctx());
  }
  let load_default_file=function (g, size) {
    if (size===undefined) {
        size = [512, 512];
    }
    if (!myLocalStorage.hasCached("startup_file")) {
        myLocalStorage.startup_file = startup_file;
    }
    for (let i=0; i<2; i++) {
        let file=i==0 ? myLocalStorage.getCached("startup_file") : startup_file;
        if (file)
          file = file.trim().replace(/[\n\r]/g, "");
        if (file) {
            let buf=new DataView(b64decode(file).buffer);
            try {
              g.load_user_file_new(buf, undefined, new unpack_ctx());
            }
            catch (error) {
                print_stack(error);
                return false;
            }
            return true;
        }
    }
    return false;
  }
  window.gen_default_file = function gen_default_file(size, force_new) {
    if (size===undefined) {
        size = [512, 512];
    }
    if (force_new===undefined) {
        force_new = false;
    }
    html5_fileapi.reset();
    let g=g_app_state;
    
    if (!force_new&&load_default_file(g)) {
        return ;
    }
    g.reset_state();
    let op=new BasicFileOp();
    g.toolstack.exec_tool(op);
    gen_screen(undefined, size[0], size[1]);
  }
  function output_startup_file() {
    let str=myLocalStorage.getCached("startup_file");
    let out="";
    for (let i=0; i<str.length; i++) {
        out+=str[i];
        if (((i+1)%77)===0) {
            out+="\n";
        }
    }
    return out;
  }
  const _nonblocks=Object.freeze(new set(["SCRN", "TSTK", "THME", "DLIB"]));
  const toolop_input_cache={}
  class AppState  {
     constructor(screen) {
      this.AppState_init(screen);
    }
     AppState_init(screen, reset_mode=false) {
      this.modalStateStack = [];
      this.screen = screen;
      this.eventhandler = screen;
      this.active_editor = undefined;
      this.select_multiple = false;
      this.select_inverse = false;
      this._last_touch_mpos = [0, 0];
      this.notes = new NotificationManager();
      this.spline_pathstack = [];
      this._active_splinepath = "frameset.drawspline";
      this.was_touch = false;
      this.toolstack = new ToolStack(this);
      this.active_view2d = undefined;
      this.api = new DataAPI(this);
      this.pathcontroller = new PathUXInterface(this.api);
      this.pathcontroller.setContext(new FullContext(this));
      this.filepath = "";
      this.version = g_app_version;
      this.size = screen!==undefined ? screen.size : [512, 512];
      this.raster = new RasterState(undefined, screen!==undefined ? screen.size : [512, 512]);
      this.toolop_input_cache = toolop_input_cache;
      if (this.datalib!==undefined) {
          this.datalib.on_destroy();
      }
      this.datalib = new DataLib();
      this.modalstate = 0;
      this.jobs = new JobManager();
      if (!reset_mode) {
          if (myLocalStorage.hasCached("session")) {
              try {
                this.session = UserSession.fromJSON(JSON.parse(myLocalStorage.getCached("session")));
              }
              catch (error) {
                  print_stack(error);
                  console.log("Error loading json session object:", myLocalStorage.getCached("session"));
              }
          }
          else {
            this.session = new UserSession();
          }
      }
      this.ctx = new FullContext(this);
    }
    get  settings() {
      return this.session.settings;
    }
     pushModalState(state) {
      this.modalStateStack.push(this.modalstate);
      this.modalstate = state;
    }
     popModalState(state) {
      if (this.modalstate===state) {
          this.modalstate = this.modalStateStack.pop();
      }
      else {
        this.modalStateStack.remove(state);
      }
    }
    get  active_splinepath() {
      let scene=this.datalib.get_active(DataTypes.SCENE);
      if (scene!==undefined)
        return scene.active_splinepath;
      return this._active_splinepath;
    }
    set  active_splinepath(val) {
      this._active_splinepath = val;
      let scene=this.datalib.get_active(DataTypes.SCENE);
      if (scene!==undefined)
        scene.active_splinepath = val;
    }
     destroy() {
      console.trace("Appstate.destroy called");
      this.destroyScreen();
    }
     update_context() {
      let scene=this.datalib.get_active(DataTypes.SCENE);
      if (scene===undefined)
        return ;
    }
     switch_active_spline(newpath) {
      this.active_splinepath = newpath;
    }
     push_active_spline(newpath) {
      this.spline_pathstack.push(this.active_splinepath);
      this.switch_active_spline(newpath);
    }
     pop_active_spline() {
      this.switch_active_spline(this.spline_pathstack.pop());
    }
     reset_state(screen) {
      this.spline_pathstack = [];
      this.active_splinepath = "frameset.drawspline";
      for (let k in window.active_canvases) {
          let canvas=window.active_canvases[k];
          canvas[1].kill_canvas(k);
      }
      window.active_canvases = {};
      try {
        if (this.screen!==undefined)
          this.destroyScreen();
      }
      catch (error) {
          print_stack(error);
          console.log("ERROR: failed to fully destroy screen context");
      }
      this.AppState_init(screen, true);
    }
     copy() {
      let as=new AppState(this.screen, undefined);
      as.datalib = this.datalib;
      as.session = this.session;
      as.toolstack = this.toolstack;
      as.filepath = this.filepath;
      return as;
    }
     set_startup_file() {
      let buf=this.create_user_file_new({gen_dataview: true, 
     compress: true, 
     save_theme: false, 
     save_toolstack: false});
      buf = new Uint8Array(buf.buffer);
      buf = b64encode(buf);
      myLocalStorage.set("startup_file", buf);
      g_app_state.notes.label("New file template saved");
      return buf;
    }
     create_scene_file() {
      let buf=this.create_user_file_new({save_screen: false, 
     save_toolstack: false});
      return buf;
    }
     create_undo_file() {
      let buf=this.create_user_file_new({save_screen: false, 
     save_toolstack: false});
      return buf;
    }
     load_scene_file(scenefile) {
      if (the_global_dag!==undefined)
        the_global_dag.reset_cache();
      let screen=this.screen;
      let toolstack=this.toolstack;
      let view2d=this.active_view2d;
      console.trace("Load internal scene file", scenefile);
      if (this.datalib!==undefined) {
          this.datalib.on_destroy();
      }
      let datalib=new DataLib();
      this.datalib = datalib;
      let filedata=this.load_blocks(scenefile);
      this.link_blocks(datalib, filedata);
      resetAreaStacks();
      this.screen = screen;
      this.eventhandler = screen;
      this.active_view2d = view2d;
      this.toolstack = toolstack;
      this.screen.ctx = this.ctx = new FullContext();
      if (the_global_dag!==undefined)
        the_global_dag.reset_cache();
      window.redraw_viewport();
    }
     load_undo_file(undofile) {
      let screen=this.screen;
      let toolstack=this.toolstack;
      console.log(undofile);
      this.datalib.clear();
      let filedata=this.load_blocks(undofile);
      this.link_blocks(this.datalib, filedata);
      this.eventhandler = screen;
      this.toolstack = toolstack;
      this.screen.ctx = new FullContext();
      window.redraw_viewport();
      for (let sarea of screen.sareas) {
          for (let area of sarea.editors) {
              area.on_fileload(this.ctx);
          }
      }
    }
     create_user_file_new(args={}) {
      let gen_dataview=true, compress=false;
      let save_screen=true, save_toolstack=false;
      let save_theme=false, save_datalib=true;
      if (args.save_datalib!==undefined)
        save_datalib = args.save_datalib;
      if (args.gen_dataview!==undefined)
        gen_dataview = args.gen_dataview;
      if (args.compress!==undefined)
        compress = args.compress;
      if (args.save_screen!==undefined)
        save_screen = args.save_screen;
      if (args.save_toolstack!==undefined)
        save_toolstack = args.save_toolstack;
      if (args.save_theme!==undefined)
        save_theme = args.save_theme;
      function bheader(data, type, subtype) {
        pack_static_string(data, type, 4);
        pack_static_string(data, subtype, 4);
      }
      let data=[];
      pack_static_string(data, "FAIR", 4);
      let flag=compress ? FileFlags.COMPRESSED_LZSTRING : 0;
      pack_int(data, flag);
      let major=Math.floor(g_app_version);
      let minor=Math.floor((g_app_version-Math.floor(g_app_version))*1000);
      pack_int(data, major);
      pack_int(data, minor);
      let headerdata=data;
      if (compress) {
          data = [];
      }
      let buf=gen_struct_str();
      bheader(data, "SDEF", "SDEF");
      pack_string(data, buf);
      profile_reset();
      if (save_datalib) {
          let data2=[];
          istruct.write_object(data2, this.datalib);
          bheader(data, "DLIB", "STRT");
          pack_int(data, data2.length);
          data = data.concat(data2);
      }
      if (save_screen) {
          let data2=[];
          istruct.write_object(data2, this.screen);
          bheader(data, "SCRN", "STRT");
          pack_int(data, data2.length);
          data = data.concat(data2);
      }
      let data2=[];
      for (let lib of this.datalib.datalists.values()) {
          for (let block of lib) {
              data2 = [];
              let t1=time_ms();
              istruct.write_object(data2, block);
              t1 = time_ms()-t1;
              if (t1>50) {
                  console.log(t1.toFixed(1)+"ms", block);
              }
              bheader(data, "BLCK", "STRT");
              pack_int(data, data2.length+4);
              pack_int(data, block.lib_type);
              data = data.concat(data2);
          }
      }
      profile_report();
      if (save_toolstack) {
          console.log("writing toolstack");
          let data2=[];
          istruct.write_object(data2, this.toolstack);
          bheader(data, "TSTK", "STRT");
          pack_int(data, data2.length);
          data = data.concat(data2);
      }
      if (save_theme) {
          console.log("writing theme");
          let data2=[];
          istruct.write_object(data2, g_theme);
          bheader(data, "THME", "STRT");
          pack_int(data, data2.length);
          data = data.concat(data2);
      }
      if (compress) {
          data = LZString.compress(new Uint8Array(data));
          console.log("using compression");
          let d=new Uint16Array(data.length);
          for (let i=0; i<data.length; i++) {
              d[i] = data.charCodeAt(i);
          }
          d = new Uint8Array(d.buffer);
          console.log("  file size", d.length);
          data = new Uint8Array(d.length+headerdata.length);
          for (let i=0; i<headerdata.length; i++) {
              data[i] = headerdata[i];
          }
          for (let i=0; i<d.length; i++) {
              data[i+headerdata.length] = d[i];
          }
          if (gen_dataview)
            return new DataView(data.buffer);
          else 
            return data;
      }
      else {
        console.log("  file size", data.length);
        if (gen_dataview)
          return new DataView(new Uint8Array(data).buffer);
        else 
          return data;
      }
    }
     write_blocks(args={}) {
      let gen_dataview=true, compress=false;
      let save_screen=args.save_screen!==undefined ? args.save_screen : true;
      let save_toolstack=args.save_toolstack!==undefined ? args.save_toolstack : false;
      let save_theme=false;
      let blocks=args["blocks"];
      if (args.gen_dataview!==undefined)
        gen_dataview = args.gen_dataview;
      if (args.compress!==undefined)
        compress = args.compress;
      function bheader(data, type, subtype) {
        pack_static_string(data, type, 4);
        pack_static_string(data, subtype, 4);
      }
      let data=[];
      pack_static_string(data, "FAIR", 4);
      let flag=compress ? FileFlags.COMPRESSED_LZSTRING : 0;
      pack_int(data, flag);
      let major=Math.floor(g_app_version);
      let minor=Math.floor((g_app_version-Math.floor(g_app_version))*1000);
      pack_int(data, major);
      pack_int(data, minor);
      let headerdata=data;
      if (compress) {
          data = [];
      }
      let buf=gen_struct_str();
      bheader(data, "SDEF", "SDEF");
      pack_string(data, buf);
      for (let k in blocks) {
          let data2=[];
          istruct.write_object(data2, blocks[k]);
          bheader(data, k, "STRT");
          pack_int(data, data2.length);
          data = data.concat(data2);
      }
      if (compress) {
          console.log("1 using compression");
          data = LZString.compress(new Uint8Array(data));
          let d=new Uint16Array(data.length);
          for (let i=0; i<data.length; i++) {
              d[i] = data.charCodeAt(i);
          }
          d = new Uint8Array(d.buffer);
          console.log("  file size:", d.length);
          data = new Uint8Array(d.length+headerdata.length);
          for (let i=0; i<headerdata.length; i++) {
              data[i] = headerdata[i];
          }
          for (let i=0; i<d.length; i++) {
              data[i+headerdata.length] = d[i];
          }
          if (gen_dataview)
            return new DataView(data.buffer);
          else 
            return data;
      }
      else {
        console.log("  file size:", data.length);
        if (gen_dataview)
          return new DataView(new Uint8Array(data).buffer);
        else 
          return data;
      }
    }
     do_versions(datalib, blocks, version) {
      if (version<0.046) {
          for (let frameset of datalib.framesets) {
              for (let spline of frameset._allsplines) {
                  for (let h of spline.handles) {
                      console.log("  -", h.segments[0], h.segments);
                      console.log("  -", h.owning_segment);
                      let s=h.owning_segment;
                      let v1=s.handle_vertex(h), v2=s.other_vert(v1);
                      console.log("patching handle!", h.eid);
                      h.load(v2).sub(v1).mulScalar(1.0/3.0).add(v1);
                  }
              }
          }
      }
      if (version<0.047) {
          let scene=new Scene();
          scene.set_fake_user();
          this.datalib.add(scene);
      }
      if (version<0.048) {
          for (let frameset of datalib.framesets) {
              for (let spline of frameset._allsplines) {
                  for (let eid in spline.eidmap) {
                      let e=spline.eidmap[eid];
                      let layer=spline.layerset.active;
                      layer.add(e);
                  }
              }
          }
      }
      if (version<0.049) {
          for (let frameset of datalib.framesets) {
              if (frameset.kcache!==undefined) {
                  frameset.kcache.cache = {};
              }
              for (let s of frameset.spline.segments) {
                  s.v1.flag|=SplineFlags.UPDATE;
                  s.v2.flag|=SplineFlags.UPDATE;
                  s.h1.flag|=SplineFlags.UPDATE;
                  s.h2.flag|=SplineFlags.UPDATE;
                  s.flag|=SplineFlags.UPDATE;
              }
              frameset.spline.resolve = 1;
          }
      }
      if (version<0.05) {
          for (let frameset of datalib.framesets) {
              startup_warning("Spline equation changed; forcing resolve. . .", version);
              frameset.spline.force_full_resolve();
              frameset.pathspline.force_full_resolve();
          }
      }
    }
     dataLinkScreen(screen, getblock, getblock_us) {
      for (let sarea of screen.sareas) {
          for (let area of sarea.editors) {
              area.data_link(area, getblock, getblock_us);
          }
      }
    }
     destroyScreen() {
      console.warn("destroyScreen called");
      if (this.screen!==undefined) {
          for (let sarea of this.screen.sareas) {
              for (let area of sarea.editors) {
                  area.on_destroy();
              }
          }
          this.screen.destroy();
          this.screen.remove();
          this.screen = undefined;
      }
    }
     do_versions_post(version) {
      let datalib=this.datalib;
      if (version<0.052) {
          for (let scene of datalib.scenes) {
              for (let frameset of datalib.framesets) {
                  let ob=scene.addFrameset(frameset);
                  scene.setActiveObject(ob);
              }
          }
          console.log("objectification");
      }
      if (version<0.053) {
          let map={};
          let max_id=-1;
          for (let block of this.datalib.allBlocks) {
              max_id = Math.max(max_id, block.lib_id+1);
          }
          this.datalib.idgen.set_cur(max_id);
          this.datalib.idmap = {};
          for (let list of this.datalib.datalists) {
              list = this.datalib.datalists.get(list);
              list.idmap = {};
              for (let block of list) {
                  if (block.lib_id in map) {
                      console.warn("%cConverting old file with overlapping DataBlock IDs", "color : red");
                      block.lib_id = this.datalib.idgen.gen_id();
                  }
                  list.idmap[block.lib_id] = block;
                  this.datalib.idmap[block.lib_id] = block;
                  map[block.lib_id] = 1;
              }
          }
      }
    }
     load_path(path_handle) {
      platform.app.openFile(path_handle).then((buf) =>        {
        let dview=new DataView(buf.buffer);
        this.load_user_file_new(dview, path_handle);
      }).catch((error) =>        {
        this.ctx.error(error.toString());
      });
    }
     load_user_file_new(data, path, uctx, use_existing_screen=false) {
      if (this.screen!==undefined)
        this.size = new Vector2(this.screen.size);
      if (uctx===undefined) {
          uctx = new unpack_ctx();
      }
      let s=unpack_static_string(data, uctx, 4);
      if (s!=="FAIR") {
          console.log("header", s, s.length);
          console.log("data", new Uint8Array(data.buffer));
          throw new Error("Could not load file.");
      }
      let file_flag=unpack_int(data, uctx);
      let version_major=unpack_int(data, uctx);
      let version_minor=unpack_int(data, uctx)/1000.0;
      let version=version_major+version_minor;
      if (file_flag&FileFlags.COMPRESSED_LZSTRING) {
          if (DEBUG.compression)
            console.log("decompressing. . .");
          data = new Uint16Array(data.buffer.slice(uctx.i, data.byteLength));
          let s="";
          for (let i=0; i<data.length; i++) {
              s+=String.fromCharCode(data[i]);
          }
          data = LZString.decompress(s);
          let data2=new Uint8Array(data.length);
          if (DEBUG.compression)
            console.log("uncompressed length: ", data.length);
          for (let i=0; i<data.length; i++) {
              data2[i] = data.charCodeAt(i);
          }
          data = new DataView(data2.buffer);
          uctx.i = 0;
      }
      let blocks=new Array();
      let fstructs=new STRUCT();
      let datalib=undefined;
      let tmap=get_data_typemap();
      window._send_killscreen();
      while (uctx.i<data.byteLength) {
        let type=unpack_static_string(data, uctx, 4);
        let subtype=unpack_static_string(data, uctx, 4);
        let len=unpack_int(data, uctx);
        let bdata;
        if (subtype==="JSON") {
            bdata = unpack_static_string(data, uctx, len);
        }
        else 
          if (subtype==="STRT") {
            if (type==="BLCK") {
                let dtype=unpack_int(data, uctx);
                bdata = unpack_bytes(data, uctx, len-4);
                bdata = [dtype, bdata];
            }
            else {
              bdata = unpack_bytes(data, uctx, len);
              if (type==="DLIB") {
                  datalib = fstructs.read_object(bdata, DataLib);
              }
            }
        }
        else 
          if (subtype==="SDEF") {
            bdata = unpack_static_string(data, uctx, len).trim();
            fstructs.parse_structs(bdata);
        }
        else {
          console.log(subtype, type, uctx.i, data.byteLength);
          console.trace();
          break;
        }
        blocks.push({type: type, 
      subtype: subtype, 
      len: len, 
      data: bdata});
      }
      if (datalib===undefined) {
          console.warn("%c Creating new DataLib; probably an old file...", "color : red;");
          datalib = new DataLib();
      }
      for (let i=0; i<blocks.length; i++) {
          let b=blocks[i];
          if (b.subtype==="JSON") {
              b.data = JSON.parse(b.data);
          }
          else 
            if (b.subtype==="STRT") {
              if (b.type==="BLCK") {
                  let lt=tmap[b.data[0]];
                  lt = lt!==undefined ? lt.name : lt;
                  b.data = fstructs.read_object(b.data[1], tmap[b.data[0]]);
                  b.data.lib_refs = 0;
                  datalib.add(b.data, false);
              }
              else {
                if (b.type==="SCRN") {
                    b.data = this.readScreen(fstructs, b.data);
                }
                else 
                  if (b.type==="THME") {
                    b.data = fstructs.read_object(b.data, Theme);
                }
              }
          }
      }
      for (let i=0; i<blocks.length; i++) {
          let block=blocks[i];
          if (block.type==="THME") {
              let old=window.g_theme;
              window.g_theme = block.data;
              window.g_theme.gen_globals();
              old.patch(window.g_theme);
          }
      }
      if (this.datalib!==undefined) {
          this.datalib.on_destroy();
      }
      this.datalib = datalib;
      this.active_view2d = undefined;
      let getblock=wrap_getblock(datalib);
      let getblock_us=wrap_getblock_us(datalib);
      let screen=undefined;
      let toolstack=undefined;
      let this2=this;
      function load_state() {
        this2.do_versions(datalib, blocks, version);
        for (let i=0; i<blocks.length; i++) {
            let block=blocks[i];
            if (block.subtype==="STRT"&&!_nonblocks.has(block.type)) {
                block.data.data_link(block.data, getblock, getblock_us);
            }
        }
        for (let i=0; i<blocks.length; i++) {
            let block=blocks[i];
            if (block.type==="SCRN") {
                screen = block.data;
            }
        }
        this2.destroyScreen();
        let size=new Vector2(this2.size);
        if (screen===undefined) {
            gen_default_file(this2.size);
            if (this2.datalib!==undefined) {
                this2.datalib.on_destroy();
            }
            this2.datalib = datalib;
            screen = this2.screen;
        }
        else {
          this2.datalib = new DataLib();
          if (this2.datalib!==undefined) {
              this2.datalib.on_destroy();
          }
          this2.reset_state(screen, undefined);
          this2.datalib = datalib;
          get_app_div().appendChild(screen);
        }
        this2.screen = screen;
        resetAreaStacks();
        this2.size = size;
        for (let sa of screen.sareas) {
            if (__instance_of(sa.area, View2DHandler)) {
                this2.active_view2d = sa.area;
                break;
            }
        }
        let ctx=new FullContext();
        if (screen!==undefined) {
            screen.view2d = this2.active_view2d;
            this2.dataLinkScreen(screen, getblock, getblock_us);
        }
        if (this2.datalib!==undefined) {
            this2.datalib.on_destroy();
        }
        this2.datalib = datalib;
        this2.eventhandler = this2.screen;
        for (let i=0; i<blocks.length; i++) {
            let block=blocks[i];
            if (block.type==="TSTK") {
                console.warn("%cFound a tool stack block", "color : blue;", block);
                toolstack = block.data;
            }
        }
      }
      function add_macro(p1, p2, tool) {
        p1.push(tool);
        p2.push(tool.saved_context);
        for (let t of tool.tools) {
            if (__instance_of(t, ToolMacro))
              add_macro(p1, p2, t);
            t.parent = tool;
            p1.push(t);
            p2.push(tool.saved_context);
        }
      }
      load_state();
      this.filepath = path;
      if (toolstack!==undefined) {
          this.toolstack = fstructs.read_object(toolstack, ToolStack);
          this.toolstack.undocur = this.toolstack.undostack.length;
          let patch_tools1=new Array();
          let patch_tools2=new Array();
          for (let i=0; i<this.toolstack.undostack.length; i++) {
              let tool=this.toolstack.undostack[i];
              if (tool.uiname==="(undefined)"||tool.uiname===undefined||tool.uiname==="") {
                  tool.uiname = tool.name;
                  if (tool.uiname==="(undefined)"||tool.uiname===undefined||tool.uiname==="") {
                      tool.uiname = "Macro";
                  }
              }
              patch_tools1.push(tool);
              patch_tools2.push(tool.saved_context);
              if (__instance_of(tool, ToolMacro)) {
                  add_macro(patch_tools1, patch_tools2, tool);
              }
          }
          for (let i=0; i<this.toolstack.undostack.length; i++) {
              let tool=this.toolstack.undostack[i];
              tool.stack_index = i;
          }
          for (let i=0; i<patch_tools1.length; i++) {
              let tool=patch_tools1[i];
              let saved_context=patch_tools2[i];
              for (let k in tool.inputs) {
                  tool.inputs[k].ctx = saved_context;
              }
              for (let k in tool.outputs) {
                  tool.outputs[k].ctx = saved_context;
              }
          }
      }
      this.do_versions_post(version);
      window.redraw_viewport();
    }
     readScreen(fstructs, data) {
      let screen;
      if (!(Screen.structName in fstructs.structs)) {
          screen = patchScreen(this, fstructs, data);
      }
      else {
        screen = fstructs.read_object(data, FairmotionScreen);
      }
      screen.style["position"] = "absolute";
      screen.setAttribute("id", "screenmain");
      screen.id = "screenmain";
      screen.ctx = new FullContext();
      screen.setCSS();
      screen.makeBorders();
      return screen;
    }
     load_blocks(data, uctx) {
      if (uctx===undefined) {
          uctx = new unpack_ctx();
      }
      let s=unpack_static_string(data, uctx, 4);
      if (s!=="FAIR") {
          console.log(s, s.length);
          console.log(data);
          throw new Error("Could not load file.");
      }
      let file_flag=unpack_int(data, uctx);
      let version_major=unpack_int(data, uctx);
      let version_minor=unpack_int(data, uctx)/1000.0;
      let version=version_major+version_minor;
      if (file_flag&FileFlags.COMPRESSED_LZSTRING) {
          if (DEBUG.compression)
            console.log("decompressing. . .");
          data = new Uint16Array(data.buffer.slice(uctx.i, data.byteLength));
          let s="";
          for (let i=0; i<data.length; i++) {
              s+=String.fromCharCode(data[i]);
          }
          data = LZString.decompress(s);
          let data2=new Uint8Array(data.length);
          if (DEBUG.compression)
            console.log("uncompressed length: ", data.length);
          for (let i=0; i<data.length; i++) {
              data2[i] = data.charCodeAt(i);
          }
          data = new DataView(data2.buffer);
          uctx.i = 0;
      }
      let blocks=new Array();
      let fstructs=new STRUCT();
      let tmap=get_data_typemap();
      while (uctx.i<data.byteLength) {
        let type=unpack_static_string(data, uctx, 4);
        let subtype=unpack_static_string(data, uctx, 4);
        let len=unpack_int(data, uctx);
        let bdata;
        if (subtype==="JSON") {
            bdata = unpack_static_string(data, uctx, len);
        }
        else 
          if (subtype==="STRT") {
            if (type==="BLCK") {
                let dtype=unpack_int(data, uctx);
                bdata = unpack_bytes(data, uctx, len-4);
                bdata = [dtype, bdata];
            }
            else {
              bdata = unpack_bytes(data, uctx, len);
            }
        }
        else 
          if (subtype==="SDEF") {
            bdata = unpack_static_string(data, uctx, len).trim();
            fstructs.parse_structs(bdata);
        }
        else {
          console.log(subtype, type, uctx.i, data.byteLength);
          console.trace();
          throw new Error("Unknown block type '"+subtype+"', "+JSON.stringify({subtype: subtype, 
       type: type}));
        }
        blocks.push({type: type, 
      subtype: subtype, 
      len: len, 
      data: bdata});
      }
      return new FileData(blocks, fstructs, version);
    }
     link_blocks(datalib, filedata) {
      let blocks=filedata.blocks;
      let fstructs=filedata.fstructs;
      let version=filedata.version;
      let tmap=get_data_typemap();
      let screen=undefined;
      for (let i=0; i<blocks.length; i++) {
          let b=blocks[i];
          if (b.subtype==="JSON") {
              b.data = JSON.parse(b.data);
          }
          else 
            if (b.subtype==="STRT") {
              if (b.type==="BLCK") {
                  let lt=tmap[b.data[0]];
                  lt = lt!==undefined ? lt.name : lt;
                  b.data = fstructs.read_object(b.data[1], tmap[b.data[0]]);
                  datalib.add(b.data, false);
              }
              else {
                if (b.type==="SCRN") {
                    b.data = screen = this.readScreen(fstructs, b.data);
                }
              }
          }
      }
      this.active_view2d = undefined;
      let getblock=wrap_getblock(datalib);
      let getblock_us=wrap_getblock_us(datalib);
      this.scene = undefined;
      this.do_versions(datalib, blocks, version);
      for (let i=0; i<blocks.length; i++) {
          let block=blocks[i];
          if (block!==undefined&&(typeof (block.data)==="string"||__instance_of(block.data, String)))
            continue;
          if (block.data!==undefined&&"data_link" in block.data&&block.subtype==="STRT"&&block.type!=="SCRN"&&block.type!=="THME") {
              block.data.data_link(block.data, getblock, getblock_us);
          }
      }
      for (let block of blocks) {
          if (block.type==="SCRN") {
              screen = block.data;
          }
      }
      if (screen!==undefined) {
          this.active_view2d = undefined;
          for (let sa of screen.sareas) {
              if (__instance_of(sa.area, View2DHandler)) {
                  this.active_view2d = sa.area;
                  break;
              }
          }
      }
      let ctx=new FullContext();
      if (screen!==undefined) {
          screen.view2d = this.active_view2d;
          this.dataLinkScreen(screen, getblock, getblock_us);
      }
      if (screen!==undefined) {
          screen.on_resize(this.size);
          screen.size = this.size;
      }
    }
  }
  _ESClass.register(AppState);
  _es6_module.add_class(AppState);
  AppState = _es6_module.add_export('AppState', AppState);
  window.AppState = AppState;
  class SavedContext  {
    
     constructor(ctx) {
      this._props = {};
      this._datalib = undefined;
      if (ctx) {
          this.save(ctx);
      }
      else {
        ctx = g_app_state.ctx;
        this.state = g_app_state;
        this.datalib = ctx.datalib;
        this.api = ctx.api;
        this.toolstack = ctx.toolstack;
      }
    }
    get  datalib() {
      if (this._datalib) {
          return this._datalib;
      }
      return g_app_state.datalib;
    }
    set  datalib(d) {
      this._datalib = d;
    }
     make(k) {
      if (k==="datalib") {
          return ;
      }
      Object.defineProperty(this, k, {get: function () {
          let ctx=g_app_state.ctx;
          let v=this._props[k];
          if (v.type==="block") {
              return ctx.datalib.get(v.value);
          }
          else 
            if (v.type==="passthru") {
              return v.value;
          }
          else 
            if (v.type==="path") {
              return ctx.api.getValue(ctx, v.value);
          }
          else {
            return ctx[k];
          }
        }});
    }
     set_context(ctx) {

    }
     save(ctx) {
      this.state = ctx.state;
      this.datalib = ctx.datalib;
      this.api = ctx.api;
      this.toolstack = ctx.toolstack;
      this.screen = ctx.screen;
      this._props = {};
      ctx = ctx.toLocked();
      for (let k in ctx.props) {
          let v=ctx.props[k].data;
          let val=v.value;
          let type=v.type;
          if (v.type==="passthru"&&typeof val==="object") {
              val = undefined;
              type = "lookup";
          }
          if (v.type!=="block"&&typeof val==="object") {
              val = undefined;
          }
          this._props[k] = {type: type, 
       key: k, 
       value: val};
          this.make(k, v);
      }
    }
     saveJSON() {
      return JSON.stringify(this._props);
    }
     loadSTRUCT(reader) {
      reader(this);
      let json;
      try {
        json = JSON.parse(this.json);
      }
      catch (error) {
          console.warn("json error");
          json = {};
      }
      for (let k in json) {
          this._props[k] = json[k];
          this.make(k);
      }
      delete this.json;
    }
  }
  _ESClass.register(SavedContext);
  _es6_module.add_class(SavedContext);
  SavedContext.STRUCT = `
SavedContext {
  json : string | this.saveJSON();
}
`;
  window.SavedContext = SavedContext;
  class SavedContextOld  {
    
    
    
    
    
    
     constructor(ctx=undefined) {
      if (ctx!==undefined) {
          this.time = ctx.scene!==undefined ? ctx.scene.time : undefined;
          this.edit_all_layers = ctx.edit_all_layers;
          this._scene = ctx.scene ? new DataRef(ctx.scene) : new DataRef(-1);
          this._frameset = ctx.frameset ? new DataRef(ctx.frameset) : new DataRef(-1);
          this._object = ctx.scene&&ctx.scene.objects.active ? ctx.scene.objects.active.id : -1;
          this._selectmode = ctx.selectmode;
          this._frameset_editmode = "MAIN";
          this._spline_path = ctx.splinepath;
          if (ctx.spline!==undefined) {
              this._active_spline_layer = ctx.spline.layerset.active.id;
          }
      }
      else {
        this.selectmode = 0;
        this._scene = new DataRef(-1);
        this._frameset = new DataRef(-1);
        this.time = 0;
        this._spline_path = "frameset.drawspline";
        this._active_spline_layer = -1;
      }
    }
    get  splinepath() {
      return this._spline_path;
    }
     set_context(state) {
      let scene=state.datalib.get(this._scene);
      let fset=state.datalib.get(this._frameset);
      if (scene!==undefined&&scene.time!==this.time)
        scene.change_time(this, this.time, false);
      if (this._object>=0&&(!scene.objects.active||this._object!==scene.objects.active.id)) {
          try {
            scene.setActiveObject(this._object);
          }
          catch (error) {
              util.print_stack(error);
          }
      }
      this._selectmode = state.selectmode;
      if (fset!==undefined)
        fset.editmode = this._frameset_editmode;
      state.switch_active_spline(this._spline_path);
      let spline=state.api.getObject(state, this._spline_path);
      if (spline!==undefined) {
          let layer=spline.layerset.idmap[this._active_spline_layer];
          if (layer===undefined) {
              warn("Warning: layer was undefined in SavedContext!");
          }
          else {
            spline.layerset.active = layer;
          }
      }
      else {
        warn("Warning: spline was undefined in SavedContext!");
      }
    }
    get  spline() {
      let ret=g_app_state.api.get_object(this, this._spline_path);
      if (ret===undefined) {
          warntrace("Warning: bad spline path", this._spline_path);
          ret = g_app_state.api.get_object(this, "frameset.drawspline");
          if (ret===undefined) {
              console.trace("Even Worse: base spline path failed!");
          }
      }
      return ret;
    }
    get  selectmode() {
      return this._selectmode;
    }
    get  frameset() {
      return g_app_state.datalib.get(this._frameset);
    }
    get  datalib() {
      return g_app_state.datalib;
    }
    get  scene() {
      return this._scene!==undefined ? g_app_state.datalib.get(this._scene) : undefined;
    }
    get  api() {
      return g_app_state.pathcontroller;
    }
    static  fromSTRUCT(reader) {
      let sctx=new SavedContext();
      reader(sctx);
      if (sctx._scene.id===-1)
        sctx._scene = undefined;
      return sctx;
    }
  }
  _ESClass.register(SavedContextOld);
  _es6_module.add_class(SavedContextOld);
  SavedContextOld.STRUCT = `
  SavedContext {
    _scene               : DataRef | obj._scene === undefined ? new DataRef(-1) : obj._scene;
    _frameset            : DataRef | obj._frameset === undefined ? new DataRef(-1) : obj._frameset;
    _frameset_editmode   : static_string[12];
    _spline_path         : string;
    time                 : float;
    edit_all_layers      : int;
  }
`;
  class _ToolContext  {
     constructor(frameset, spline, scene, splinepath) {
      let ctx=new FullContext().toLocked();
      if (splinepath===undefined)
        splinepath = ctx.splinepath;
      if (frameset===undefined)
        frameset = ctx.frameset;
      if (spline===undefined&&frameset!==undefined)
        spline = ctx.spline;
      if (scene===undefined)
        scene = ctx.scene;
      this.datalib = g_app_state.datalib;
      this.splinepath = splinepath;
      this.frameset = frameset;
      this.spline = spline;
      this.scene = scene;
      this.edit_all_layers = ctx.edit_all_layers;
      this.api = g_app_state.pathcontroller;
    }
  }
  _ESClass.register(_ToolContext);
  _es6_module.add_class(_ToolContext);
  _ToolContext = _es6_module.add_export('_ToolContext', _ToolContext);
}, '/dev/fairmotion/src/core/AppState.js');
es6_module_define('units', ["./safe_eval.js"], function _units_module(_es6_module) {
  "use strict";
  var safe_eval=es6_import_item(_es6_module, './safe_eval.js', 'safe_eval');
  var number_regexpr=/(0x[0-9a-fA-F]+)|((\d|(\d\.\d+))+(e|e\-|e\+)\d+)|(\d*\.\d+)|(\d+)/;
  class UnitAttr  {
     constructor(attrs) {
      function getval(defval, key, required) {
        if (required===undefined) {
            required = false;
        }
        if (key in attrs)
          return attrs[key];
        if (required)
          throw new Error("Missing required unit parameter");
        return defval;
      }
      this.grid_steps = getval(undefined, "grid_steps", true);
      this.grid_substeps = getval(undefined, "grid_substeps", true);
      this.geounit = getval(1.0, "geounit", false);
    }
  }
  _ESClass.register(UnitAttr);
  _es6_module.add_class(UnitAttr);
  UnitAttr = _es6_module.add_export('UnitAttr', UnitAttr);
  class Unit  {
    
     constructor(suffices, cfactor, grid_subd_1, grid_subd_2=grid_subd_1, attrs={}) {
      this.cfactor = cfactor;
      this.suffix_list = suffices;
      attrs.grid_steps = grid_subd_1;
      attrs.grid_substeps = grid_subd_2;
      if (!("geounit" in attrs)) {
          attrs.geounit = cfactor;
      }
      this.attrs = new UnitAttr(attrs);
    }
     from_normalized(v) {
      return v/this.cfactor;
    }
     to_normalized(v) {
      return v*this.cfactor;
    }
    static  get_unit(string) {
      var lower=string.toLowerCase();
      var units=Unit.units;
      var unit=undefined;
      if (string=="default") {
          string = lower = g_app_state.session.settings.unit;
      }
      for (var i=0; i<units.length; i++) {
          var u=units[i];
          for (var j=0; j<u.suffix_list.length; j++) {
              if (lower.trim().endsWith(u.suffix_list[j])) {
                  unit = u;
                  string = string.slice(0, string.length-u.suffix_list[j].length);
                  break;
              }
          }
          if (unit!=undefined)
            break;
      }
      return [unit, string];
    }
    static  parse(string, oldval, errfunc, funcparam, defaultunit) {
      var units=Unit.units;
      var lower=string.toLowerCase();
      var unit=undefined;
      if (defaultunit==undefined)
        defaultunit = "cm";
      if (oldval==undefined)
        oldval = 0.0;
      var ret=Unit.get_unit(string);
      unit = ret[0];
      string = ret[1];
      if (unit==undefined) {
          unit = Unit.get_unit(defaultunit)[0];
      }
      var val=-1;
      try {
        val = safe_eval(string);
      }
      catch (err) {
          if (errfunc!=undefined) {
              errfunc(funcparam);
          }
          return oldval;
      }
      if (val==undefined||typeof (val)!="number"||isNaN(val)) {
          console.log(["haha ", val, string]);
          errfunc(funcparam);
          return oldval;
      }
      if (unit!=undefined) {
          val = unit.to_normalized(val);
      }
      return val;
    }
    static  gen_string(val, suffix, max_decimal=3) {
      if (!(typeof val=="number")||val==undefined)
        return "?";
      if (suffix==undefined)
        return val.toFixed(max_decimal);
      if (suffix=="default")
        suffix = g_app_state.session.settings.unit;
      suffix = suffix.toLowerCase().trim();
      var unit=undefined;
      var units=Unit.units;
      for (var i=0; i<units.length; i++) {
          var u=units[i];
          var sl=u.suffix_list;
          for (var j=0; j<sl.length; j++) {
              var s=sl[j];
              if (s==suffix) {
                  unit = u;
                  break;
              }
          }
          if (unit!=undefined)
            break;
      }
      var out;
      if (unit!=undefined) {
          val = unit.from_normalized(val);
          if (val!=undefined)
            val = val.toFixed(max_decimal);
          else 
            val = "0";
          out = val.toString()+unit.suffix_list[0];
      }
      else {
        val = val.toFixed(max_decimal);
        out = val.toString()+Unit.internal_unit;
      }
      return out;
    }
  }
  _ESClass.register(Unit);
  _es6_module.add_class(Unit);
  Unit = _es6_module.add_export('Unit', Unit);
  Unit.units = [new Unit(["cm"], 1.0, 10), new Unit(["in", "''", "``", '"'], 2.54, 8), new Unit(["ft", "'", "`"], 30.48, 12, 8), new Unit(["m"], 100, 10), new Unit(["mm"], 0.1, 10), new Unit(["km"], 100000, 10), new Unit(["mile"], 160934.4, 10)];
  Unit.metric_units = ["cm", "m", "mm", "km"];
  Unit.imperial_units = ["in", "ft", "mile"];
  Unit.internal_unit = "cm";
}, '/dev/fairmotion/src/core/units.js');
es6_module_define('data_api_types', ["../toolops_api.js", "../toolprops.js", "./data_api_base.js"], function _data_api_types_module(_es6_module) {
  var DataFlags=es6_import_item(_es6_module, './data_api_base.js', 'DataFlags');
  var DataPathTypes=es6_import_item(_es6_module, './data_api_base.js', 'DataPathTypes');
  var PropTypes=es6_import_item(_es6_module, '../toolprops.js', 'PropTypes');
  var TPropFlags=es6_import_item(_es6_module, '../toolprops.js', 'TPropFlags');
  var ToolProperty=es6_import_item(_es6_module, '../toolprops.js', 'ToolProperty');
  var IntProperty=es6_import_item(_es6_module, '../toolprops.js', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, '../toolprops.js', 'FloatProperty');
  var Vec2Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec2Property');
  var BoolProperty=es6_import_item(_es6_module, '../toolprops.js', 'BoolProperty');
  var Vec3Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec4Property');
  var StringProperty=es6_import_item(_es6_module, '../toolprops.js', 'StringProperty');
  var FlagProperty=es6_import_item(_es6_module, '../toolprops.js', 'FlagProperty');
  var EnumProperty=es6_import_item(_es6_module, '../toolprops.js', 'EnumProperty');
  var ToolFlags=es6_import_item(_es6_module, '../toolops_api.js', 'ToolFlags');
  var UndoFlags=es6_import_item(_es6_module, '../toolops_api.js', 'UndoFlags');
  var PropSubTypes=es6_import_item(_es6_module, '../toolprops.js', 'PropSubTypes');
  class DataPath  {
     constructor(prop, name, path, dest_is_prop=false, use_path=true, flag=0) {
      this.flag = flag;
      this.dest_is_prop = dest_is_prop;
      if (prop==undefined)
        this.type = dest_is_prop ? DataPathTypes.PROP : DataPathTypes.STRUCT;
      if (prop!=undefined&&__instance_of(prop, ToolProperty)) {
          this.type = DataPathTypes.PROP;
      }
      else 
        if (prop!=undefined&&__instance_of(prop, DataStruct)) {
          this.type = DataPathTypes.STRUCT;
          prop.parent = this;
          this.pathmap = prop.pathmap;
      }
      else 
        if (prop!=undefined&&__instance_of(prop, DataStructArray)) {
          this.type = DataPathTypes.STRUCT_ARRAY;
          prop.parent = this;
          this.getter = prop.getter;
      }
      this.name = name;
      this.data = prop;
      this.path = path;
      this.update = undefined;
      this.use_path = use_path;
      this.parent = undefined;
    }
     OnUpdate(func) {
      this.update = func;
      if (this.data!==undefined) {
          this.data.update = func;
      }
      return this;
    }
     Default(val) {
      this.data.value = val;
      return this;
    }
     Range(min, max) {
      this.data.range = [min, max];
      return this;
    }
     ExpRate(rate) {
      this.data.expRate = rate;
      return this;
    }
     Step(f) {
      this.data.step = f;
      return this;
    }
     DecimalPlaces(p) {
      this.data.decimalPlaces = p;
      return this;
    }
     SetFlag(flag) {
      this.data.flag|=flag;
      return this;
    }
     ClearFlag() {
      this.data.flag = 0;
      return this;
    }
     FlagsUINames(uinames) {
      this.data.setUINames(uinames);
      return this;
    }
     cache_good() {
      var p=this;
      while (p!==undefined) {
        if (p.flag&(DataFlags.RECALC_CACHE|DataFlags.NO_CACHE))
          return false;
        p = p.parent;
      }
      return true;
    }
  }
  _ESClass.register(DataPath);
  _es6_module.add_class(DataPath);
  DataPath = _es6_module.add_export('DataPath', DataPath);
  class DataStructIter  {
     constructor(s) {
      this.ret = {done: false, 
     value: undefined};
      this.cur = 0;
      this.strct = s;
      this.value = undefined;
    }
     [Symbol.iterator]() {
      return this;
    }
     reset() {
      this.cur = 0;
      this.ret.done = false;
      this.ret.value = undefined;
    }
     next() {
      if (this.cur>=this.strct.paths.length) {
          var ret=this.ret;
          this.cur = 0;
          ret.done = true;
          this.ret = {done: false, 
       value: undefined};
          return ret;
      }
      var p=this.strct.paths[this.cur++];
      p.data.path = p.path;
      this.ret.value = p;
      return this.ret;
    }
  }
  _ESClass.register(DataStructIter);
  _es6_module.add_class(DataStructIter);
  DataStructIter = _es6_module.add_export('DataStructIter', DataStructIter);
  class DataStructArray  {
     constructor(array_item_struct_getter, getitempath, getitem, getiter, getkeyiter, getlength) {
      this.getter = array_item_struct_getter;
      this.getitempath = getitempath;
      this.getitem = getitem;
      this.getiter = getiter;
      this.getkeyiter = getkeyiter;
      this.getlength = getlength;
      this.type = DataPathTypes.STRUCT_ARRAY;
    }
  }
  _ESClass.register(DataStructArray);
  _es6_module.add_class(DataStructArray);
  DataStructArray = _es6_module.add_export('DataStructArray', DataStructArray);
  class DataStruct  {
     constructor(paths=[], cls) {
      this.paths = new GArray();
      this.pathmap = {};
      this.parent = undefined;
      this.dataClass = cls;
      this._flag = 0;
      for (let p of paths) {
          this.add(p);
      }
      this.type = DataPathTypes.STRUCT;
    }
     Color3(apiname, path, uiname, description) {
      var ret=new Vec3Property(undefined, apiname, uiname, description);
      ret.subtype = PropSubTypes.COLOR;
      ret = new DataPath(ret, apiname, path, path!==undefined);
      this.add(ret);
      return ret;
    }
     String(apiname, path, uiname, description) {
      let ret=new StringProperty("", apiname, uiname, description);
      ret = new DataPath(ret, apiname, path, true, path!==undefined);
      this.add(ret);
      return ret;
    }
     Color4(apiname, path, uiname, description) {
      var ret=new Vec4Property(undefined, apiname, uiname, description);
      ret.subtype = PropSubTypes.COLOR;
      ret = new DataPath(ret, apiname, path, path!==undefined);
      this.add(ret);
      return ret;
    }
     Vector2(apiname, path, uiname, description) {
      var ret=new Vec2Property(undefined, apiname, uiname, description);
      ret = new DataPath(ret, apiname, path, path!==undefined);
      this.add(ret);
      return ret;
    }
     Vector3(apiname, path, uiname, description) {
      var ret=new Vec3Property(undefined, apiname, uiname, description);
      ret = new DataPath(ret, apiname, path, path!=undefined);
      this.add(ret);
      return ret;
    }
     Bool(apiname, path, uiname, description) {
      var ret=new BoolProperty(0, apiname, uiname, description);
      ret = new DataPath(ret, apiname, path, path!==undefined);
      this.add(ret);
      return ret;
    }
     Flags(flags, apiname, path, uiname, description) {
      var ret=new FlagProperty(0, flags, undefined, apiname, uiname, description);
      ret = new DataPath(ret, apiname, path, path!==undefined);
      this.add(ret);
      return ret;
    }
     Float(apiname, path, uiname, description) {
      var ret=new FloatProperty(0, apiname, uiname, description);
      ret = new DataPath(ret, apiname, path, path!==undefined);
      this.add(ret);
      return ret;
    }
     Struct(apiname, path, uiname, description) {
      var ret=new DataStruct([]);
      var path=new DataPath(ret, apiname, path, path!==undefined);
      this.add(path);
      return ret;
    }
     Int(apiname, path, uiname, description) {
      var ret=new IntProperty(0, apiname, uiname, description);
      ret = new DataPath(ret, apiname, path, path!==undefined);
      this.add(ret);
      return ret;
    }
     [Symbol.iterator]() {
      return new DataStructIter(this);
    }
    get  flag() {
      return this._flag;
    }
     cache_good() {
      var p=this;
      while (p!==undefined) {
        if (p.flag&DataFlags.RECALC_CACHE)
          return false;
        p = p.parent;
      }
      return true;
    }
    set  flag(val) {
      this._flag = val;
      function recurse(p, flag) {
        p.flag|=flag;
        if (__instance_of(p, DataStruct)) {
            for (var p2 of p.paths) {
                if (__instance_of(p2, DataStruct)) {
                    p2.flag|=flag;
                }
                else {
                  recurse(p2, flag);
                }
            }
        }
      }
      if (val&DataFlags.NO_CACHE) {
          for (var p of this.paths) {
              recurse(p, DataFlags.NO_CACHE);
          }
      }
      if (val&DataFlags.RECALC_CACHE) {
          for (var p of this.paths) {
              recurse(p, DataFlags.RECALC_CACHE);
          }
      }
    }
     add(p) {
      if (!p) {
          console.warn("Invalid call to DataStruct.prototype.add()");
          return ;
      }
      if (this._flag&DataFlags.NO_CACHE) {
          p.flag|=DataFlags.NO_CACHE;
      }
      else {
        p.flag|=DataFlags.RECALC_CACHE;
        this._flag|=DataFlags.RECALC_CACHE;
      }
      this.pathmap[p.name] = p;
      this.paths.push(p);
      p.parent = this;
      if (p.type===DataPathTypes.PROP) {
          p.data.path = p.path;
      }
      return this;
    }
     remove(p) {
      delete this.pathmap[p.name];
      this.paths.remove(p);
      this.flag|=DataFlags.RECALC_CACHE;
      return this;
    }
     addOrReplace(p) {
      return this.replace(p, p);
    }
     replace(p, p2) {
      if (p2===undefined) {
          console.warn("Invalid call to DataStruct.prototype.replace()");
          return ;
      }
      for (let p3 of this.paths) {
          if (p3.name===p.name) {
              this.remove(p3);
              break;
          }
      }
      this.add(p2);
      return this;
    }
  }
  _ESClass.register(DataStruct);
  _es6_module.add_class(DataStruct);
  DataStruct = _es6_module.add_export('DataStruct', DataStruct);
}, '/dev/fairmotion/src/core/data_api/data_api_types.js');
es6_module_define('data_api', ["./data_api_parser.js", "./data_api_base.js", "../toolops_api.js", "../../config/config.js", "../lib_api.js", "../toolprops.js", "../animdata.js", "./data_api_pathux.js", "../../curve/spline_multires.js", "./data_api_types.js", "../safe_eval.js"], function _data_api_module(_es6_module) {
  function is_int(s) {
    s = s.trim();
    if (typeof s=="number") {
        return s===~~s;
    }
    let m=s.match(/(\-)?[0-9]+/);
    if (!m)
      return false;
    return m[0].length===s.length;
  }
  window._is_int = is_int;
  var DataPathTypes={PROP: 0, 
   STRUCT: 1, 
   STRUCT_ARRAY: 2}
  DataPathTypes = _es6_module.add_export('DataPathTypes', DataPathTypes);
  var DataFlags={NO_CACHE: 1, 
   RECALC_CACHE: 2}
  DataFlags = _es6_module.add_export('DataFlags', DataFlags);
  var ___data_api_types_js=es6_import(_es6_module, './data_api_types.js');
  for (let k in ___data_api_types_js) {
      _es6_module.add_export(k, ___data_api_types_js[k], true);
  }
  var DataStruct=es6_import_item(_es6_module, './data_api_types.js', 'DataStruct');
  var DataStructArray=es6_import_item(_es6_module, './data_api_types.js', 'DataStructArray');
  var DataStructIter=es6_import_item(_es6_module, './data_api_types.js', 'DataStructIter');
  var DataPath=es6_import_item(_es6_module, './data_api_types.js', 'DataPath');
  var config=es6_import(_es6_module, '../../config/config.js');
  var safe_eval=es6_import(_es6_module, '../safe_eval.js');
  var PropSubTypes=es6_import_item(_es6_module, '../toolprops.js', 'PropSubTypes');
  class TinyParserError extends Error {
  }
  _ESClass.register(TinyParserError);
  _es6_module.add_class(TinyParserError);
  TinyParserError = _es6_module.add_export('TinyParserError', TinyParserError);
  var PropTypes=es6_import_item(_es6_module, '../toolprops.js', 'PropTypes');
  var TPropFlags=es6_import_item(_es6_module, '../toolprops.js', 'TPropFlags');
  var ToolProperty=es6_import_item(_es6_module, '../toolprops.js', 'ToolProperty');
  var IntProperty=es6_import_item(_es6_module, '../toolprops.js', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, '../toolprops.js', 'FloatProperty');
  var Vec2Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec2Property');
  var BoolProperty=es6_import_item(_es6_module, '../toolprops.js', 'BoolProperty');
  var Vec3Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec4Property');
  var StringProperty=es6_import_item(_es6_module, '../toolprops.js', 'StringProperty');
  var FlagProperty=es6_import_item(_es6_module, '../toolprops.js', 'FlagProperty');
  var EnumProperty=es6_import_item(_es6_module, '../toolprops.js', 'EnumProperty');
  var ToolFlags=es6_import_item(_es6_module, '../toolops_api.js', 'ToolFlags');
  var UndoFlags=es6_import_item(_es6_module, '../toolops_api.js', 'UndoFlags');
  var DataBlock=es6_import_item(_es6_module, '../lib_api.js', 'DataBlock');
  var apiparser=es6_import_item(_es6_module, './data_api_parser.js', 'apiparser');
  var MultiResLayer=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'MultiResLayer');
  var MultiResEffector=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'MultiResEffector');
  var MResFlags=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'MResFlags');
  var has_multires=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'has_multires');
  var ensure_multires=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'ensure_multires');
  var iterpoints=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'iterpoints');
  var compose_id=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'decompose_id');
  var safe_eval=es6_import(_es6_module, '../safe_eval.js');
  var ___data_api_base_js=es6_import(_es6_module, './data_api_base.js');
  for (let k in ___data_api_base_js) {
      _es6_module.add_export(k, ___data_api_base_js[k], true);
  }
  var DataPathTypes=es6_import_item(_es6_module, './data_api_base.js', 'DataPathTypes');
  var DataFlags=es6_import_item(_es6_module, './data_api_base.js', 'DataFlags');
  var DataAPIError=es6_import_item(_es6_module, './data_api_base.js', 'DataAPIError');
  let resolve_path_rets=new cachering(() =>    {
    return new Array(6);
  }, 32);
  var _TOKEN=0;
  var _WORD=1;
  var _STRLIT=2;
  var _LP="(";
  var _RP=")";
  var _LS="[";
  var _RS="]";
  var _CM=",";
  var _EQ="=";
  var _DT=".";
  class TinyParser  {
     constructor(data) {
      var tpl=TinyParser.ctemplates;
      this.toks = objcache.fetch(tpl.toks);
      this.toks.length = 0;
      this.split_chars = TinyParser.split_chars;
      this.ws = TinyParser.ws;
      this.data = data;
      this.cur = 0;
    }
     reset(data) {
      this.cur = 0;
      this.toks.length = 0;
      this.data = data;
      if (data!=undefined&&data!="")
        this.lex();
    }
     gen_tok(a, b) {
      var ret=objcache.fetch(TinyParser.ctemplates.token);
      ret[0] = a;
      ret[1] = b;
      ret.length = 2;
      return ret;
    }
     lex(data) {
      var gt=this.gen_tok;
      if (data==undefined)
        data = this.data;
      var toks=this.toks;
      var tok=undefined;
      var in_str=false;
      var lastc=0;
      var i=0;
      while (i<data.length) {
        var c=data[i];
        if (c=="'"&&lastc!="\\") {
            in_str^=1;
            if (in_str) {
                tok = gt("", _STRLIT);
                toks.push(tok);
            }
            else {
              tok = undefined;
            }
        }
        else 
          if (in_str) {
            tok[0]+=c;
        }
        else 
          if (this.ws.has(c)) {
            if (tok!=undefined&&tok[1]==_WORD) {
                tok = undefined;
            }
        }
        else 
          if (this.split_chars.has(c)) {
            toks.push(gt(c, _TOKEN));
            tok = undefined;
        }
        else {
          if (tok==undefined) {
              tok = gt("", _WORD);
              toks.push(tok);
          }
          tok[0]+=c;
        }
        lastc = c;
        i+=1;
      }
    }
     next() {
      this.cur++;
      if (this.cur-1<this.toks.length) {
          return this.toks[this.cur-1];
      }
      return undefined;
    }
     peek() {
      if (this.cur<this.toks.length) {
          return this.toks[this.cur];
      }
      return undefined;
    }
     expect(type, val) {
      if (this.peek()[1]!=type) {
          console.trace("Unexpected token "+this.peek[0]+", expected "+(type==_WORD ? "WORD" : val));
          throw new TinyParserError();
      }
      if (type==_TOKEN&&this.peek()[0]!=val) {
          console.trace("Unexpected token "+this.peek[0]);
          throw new TinyParserError();
      }
      return this.next()[0];
    }
  }
  _ESClass.register(TinyParser);
  _es6_module.add_class(TinyParser);
  
  var AnimKey=es6_import_item(_es6_module, '../animdata.js', 'AnimKey');
  var AnimChannel=es6_import_item(_es6_module, '../animdata.js', 'AnimChannel');
  var AnimKeyFlags=es6_import_item(_es6_module, '../animdata.js', 'AnimKeyFlags');
  var AnimInterpModes=es6_import_item(_es6_module, '../animdata.js', 'AnimInterpModes');
  TinyParser.ctemplates = {toks: {obj: Array(64), 
    init: function (val) {
        val.length = 0;
      }}, 
   token: {obj: ["", ""], 
    cachesize: 512}}
  TinyParser.split_chars = new set([",", "=", "(", ")", ".", "$", "[", "]"]);
  TinyParser.ws = new set([" ", "\n", "\t", "\r"]);
  var toolmap=es6_import_item(_es6_module, './data_api_pathux.js', 'toolmap');
  var $cache_Vty__resolve_path_intern;
  var $retcpy_EE94_set_prop;
  var $scope_tNJe_set_prop;
  class DataAPI  {
     constructor(appstate) {
      this.appstate = appstate;
      this.parser = new TinyParser();
      this.parser2 = apiparser();
      this.root_struct = ContextStruct;
      this.cache = {};
      this.evalcache = {};
      this.evalcache2 = {};
      this.op_keyhandler_cache = {};
    }
     parse_call_line_intern(ctx, line) {
      var p=this.parser;
      function parse_argval(p) {
        var val;
        if (p.peek()[1]==_STRLIT) {
            val = p.next()[0];
        }
        else {
          val = p.expect(_WORD);
        }
        var args;
        if (p.peek()[0]==_LP) {
            args = parse_call(p);
        }
        return [val, args];
      }
      function parse_arg(p) {
        var arg=p.expect(_WORD);
        var val=undefined;
        if (p.peek()[0]==_EQ) {
            p.next();
            val = parse_argval(p);
        }
        return [arg, val];
      }
      function parse_call(p) {
        p.expect(_TOKEN, _LP);
        var args=[];
        var t=undefined;
        while (p.peek()!=undefined) {
          if (p.peek()[1]==_WORD) {
              args.push(parse_arg(p));
          }
          else 
            if (p.peek()[0]==_CM) {
              p.next();
          }
          else {
            p.expect(_TOKEN, _RP);
            break;
          }
        }
        return args;
      }
      if (line.contains(_LP)==0)
        throw new TinyParserError();
      var li=line.search(/\(/);
      path = line.slice(0, li);
      line = line.slice(li, line.length);
      p.reset(line);
      var call=parse_call(p);
      path = path.trimRight().trimLeft();
      var ret=objcache.array(2);
      ret[0] = path;
      ret[1] = call;
      return ret;
    }
     parse_call_line(ctx, line) {
      if (line==undefined) {
          line = ctx;
          ctx = new Context();
      }
      try {
        var ret=this.parse_call_line_intern(ctx, line);
        return ret;
      }
      catch (error) {
          if (!(__instance_of(error, TinyParserError))) {
              throw error;
          }
          else {
            console.log("Could not parse tool call line "+line+"!");
          }
      }
    }
     do_selectmode(ctx, args) {
      return ctx.view2d.selectmode;
    }
     do_datapath(ctx, args) {
      if (args==undefined||args.length==0||args[0].length!=1) {
          console.log("Invalid arguments to do_datapath()");
          throw TinyParserError();
      }
      return args[0];
    }
     do_active_vertex(ctx, args) {
      var spline=ctx.spline;
      var v=spline.verts.active;
      return v==undefined ? -1 : v.eid;
    }
     do_mesh_selected(ctx, args) {
      if (args==undefined||args.length==0||args[0].length!=2) {
          console.log("Invalid arguments to do_mesh_selected()");
          throw TinyParserError();
      }
      var val=args[0][0];
      var typemask=0;
      for (var i=0; i<val.length; i++) {
          c = val[i].toLowerCase();
          if (c=="v") {
              typemask|=MeshTypes.VERT;
          }
          else 
            if (c=="e") {
              typemask|=MeshTypes.EDGE;
          }
          else 
            if (c=="f") {
              typemask|=MeshTypes.FACE;
          }
          else {
            console.log("Invalid arguments to do_mesh_select(): "+c);
            throw TinyParserError();
          }
      }
      var mesh=ctx.mesh;
      if (mesh===undefined) {
          console.trace();
          console.log("Mesh operation called with bad context");
          console.log("Creating dummy mesh. . .");
          console.log(ctx);
          mesh = new Mesh();
      }
      return new MSelectIter(typemask, mesh);
    }
     prepare_args(ctx, call) {
      var args={};
      for (var i=0; i<call.length; i++) {
          var a=call[i];
          if (a[1]!=undefined) {
              if ("do_"+a[1][0] in this) {
                  args[a[0]] = this["do_"+a[1][0]](ctx, a[1][1], a[1], a);
              }
              else 
                if (typeof a[1][0]=="string") {
                  args[a[0]] = a[1][0];
              }
              else 
                if (typeof a[1][0]=="number"||parseFloat(a[1][0])!=NaN) {
                  args[a[0]] = parseFloat(a[1][0]);
              }
              else {
                console.log("Invalid initializer"+a[1][1], a[1], a);
              }
          }
          else {
            console.log("Error: No parameter for undefined argument "+a[0]);
            throw TinyParserError();
          }
      }
      return args;
    }
     get_opclass_intern(ctx, str) {
      var ret=this.parse_call_line(ctx, str);
      if (ret===undefined)
        return ;
      var call=ret[1];
      var path=ret[0];
      if (!(path in toolmap)) {
          console.error("Invalid api call "+str+"!", call, path);
          return ;
      }
      return toolmap[path];
    }
     get_op_intern(ctx, str) {
      var ret=this.parse_call_line(ctx, str);
      if (ret==undefined)
        return ;
      var call=ret[1];
      var path=ret[0];
      if (!(path in toolmap)) {
          console.error("Invalid api call "+str+"!");
          return ;
      }
      var args=this.prepare_args(ctx, call);
      let cls=toolmap[path];
      let op=cls.invoke(ctx, args);
      return op;
    }
     get_op_keyhandler(ctx, str) {
      console.warn("get_op_keyhandler: implement me!");
    }
     call_op(ctx, str) {
      if (RELEASE)
        return this.call_op_release(ctx, str);
      else 
        return this.call_op_debug(ctx, str);
    }
     call_op_debug(ctx, str) {
      console.log("calling op", str);
      var op=this.get_op_intern(ctx, str);
      if (op==undefined) {
          throw new Error("Unknown tool '"+str+"'!");
      }
      if (op.flag&ToolFlags.USE_DEFAULT_INPUT) {
          this.appstate.toolstack.default_inputs(ctx, op);
      }
      this.appstate.toolstack.exec_tool(op);
    }
     call_op_release(ctx, str) {
      try {
        var op=this.get_op_intern(ctx, str);
        if (op.flag&ToolFlags.USE_DEFAULT_INPUT) {
            this.appstate.toolstack.default_inputs(ctx, op);
        }
        this.appstate.toolstack.exec_tool(op);
      }
      catch (error) {
          console.log("Error calling "+str);
          print_stack(error);
      }
    }
     get_op_uiname(ctx, str) {
      if (str==undefined) {
          str = ctx;
          ctx = new Context();
      }
      try {
        var op=this.get_op_intern(ctx, str);
        return op.uiname;
      }
      catch (error) {
          if (!(__instance_of(error, TinyParserError))) {
              throw error;
          }
          else {
            console.log("Error calling "+str);
            console.trace();
          }
      }
    }
     get_op(ctx, str) {
      if (str==undefined) {
          str = ctx;
          ctx = new Context();
      }
      try {
        var op=this.get_op_intern(ctx, str);
        return op;
      }
      catch (error) {
          if ((__instance_of(error, TinyParserError))) {
              throw error;
          }
          else {
            print_stack(error);
            console.log("Error calling "+str);
          }
      }
    }
     get_opclass(ctx, str) {
      if (str===undefined) {
          str = ctx;
          ctx = new Context();
      }
      try {
        var op=this.get_opclass_intern(ctx, str);
        return op;
      }
      catch (error) {
          if ((__instance_of(error, TinyParserError))) {
              throw error;
          }
          else {
            console.log("Error calling "+str);
            console.trace();
          }
      }
    }
     copy_path(path) {
      var ret=[];
      ret.push(path[0]);
      for (var i=1; i<path.length; i++) {
          ret.push(copy_object_deep(path[i]));
      }
      return ret;
    }
     _build_path(dp) {
      var s="";
      while (dp!=undefined) {
        if (__instance_of(dp, DataPath))
          s = dp.path+"."+s;
        dp = dp.parent;
      }
      s = s.slice(0, s.length-1);
      return s;
    }
     onFrameChange(ctx, time) {
      return this.on_frame_change(ctx, time);
    }
     on_frame_change(ctx, time) {
      for (var id in ctx.datalib.idmap) {
          var block=ctx.datalib.idmap[id];
          for (var ch of block.lib_anim_channels) {
              this.set_prop(ctx, ch.path, ch.evaluate(time));
          }
      }
    }
     key_animpath(ctx, owner, path, time) {
      if (ctx==undefined) {
          time = path;
          path = ctx;
          ctx = new Context();
      }
      path = path.trim();
      var ret=this.resolve_path_intern(ctx, path);
      if (ret==undefined||ret[0]==undefined) {
          console.log("Error, cannot set keyframe for path", path, "!");
          return ;
      }
      var prop=ret[0];
      if (!(path in owner.lib_anim_pathmap)) {
          var name=path.split(".");
          name = name[name.length-1];
          var ch=new AnimChannel(prop.type, name, path);
          ch.idgen = owner.lib_anim_idgen;
          ch.id = owner.lib_anim_idgen.next();
          ch.idmap = owner.lib_anim_idmap;
          ch.owner = owner;
          owner.lib_anim_pathmap[path] = ch;
          owner.lib_anim_channels.push(ch);
      }
      var ch=owner.lib_anim_pathmap[path];
      var val=this.get_prop(ctx, path);
      ch.update(time, val);
    }
     resolve_path_intern(ctx, str) {
      if (str===undefined) {
          throw new Error("invalid arguments to resolve_path_intern");
      }
      if (str===undefined) {
          warntrace("Warning, undefined path in resolve_path_intern (forgot to pass ctx?)");
          return undefined;
      }
      let ret;
      try {
        if (!(str in $cache_Vty__resolve_path_intern)) {
            ret = this.resolve_path_intern2(ctx, str);
            let ret2=[];
            for (let i=0; i<ret.length; i++) {
                ret2.push(ret[i]);
            }
            $cache_Vty__resolve_path_intern[str] = ret2;
        }
        else {
          ret = $cache_Vty__resolve_path_intern[str];
          if (ret[0]===undefined||!ret[0].cache_good()) {
              delete $cache_Vty__resolve_path_intern[str];
              return this.resolve_path_intern(ctx, str);
          }
          else {
            let ret2=resolve_path_rets.next();
            for (let i=0; i<ret.length; i++) {
                ret2[i] = ret[i];
            }
            return ret2;
          }
        }
        return ret;
      }
      catch (_err) {
          print_stack(_err);
          console.log("error: ", str);
      }
      return undefined;
    }
     resolve_path_intern2(ctx, str) {
      var parser=this.parser2;
      var arr_index=undefined;
      var build_path=this._build_path;
      var pathout=[""];
      var spathout=["ContextStruct"];
      var ownerpathout=[""];
      var mass_set=undefined;
      var this2=this;
      var debugmsg="";
      function do_eval(node, scope, pathout, spathout) {
        if (node.type==="ID") {
            if (scope===undefined) {
                console.log("data api error: ", str+", "+pathout[0]+", "+spathout[0]);
            }
            if (scope.pathmap==undefined||!(node.val in scope.pathmap))
              return undefined;
            var ret=scope.pathmap[node.val];
            if (ret===undefined)
              return undefined;
            if (ret.use_path) {
                ownerpathout[0] = pathout[0];
                if (ret.path!==""&&ret.path[0]!=="["&&ret.path[0]!="(")
                  pathout[0] = pathout[0]+"."+ret.path;
                else 
                  pathout[0]+=ret.path;
            }
            spathout[0] = spathout[0]+".pathmap."+node.val;
            return ret;
        }
        else 
          if (node.type==="EQUALS") {
            let ret=do_eval(node.children[0], scope, pathout, spathout);
            pathout[0]+="==";
            let val=node.children[1].value;
            if (typeof val==="string"||__instance_of(val, String)) {
                let prop=ret.data;
                if (prop.type===PropTypes.ENUM) {
                    val = prop.values[val];
                }
            }
            pathout[0]+=val;
            return ret;
        }
        else 
          if (node.type==="CODE") {
            mass_set = {filter: node.children[1].value, 
        path: str.slice(0, node.children[1].lexstart), 
        subpath: str.slice(node.children[1].lexend, str.length).trim(), 
        do_mass_set: true};
            if (mass_set.subpath[0]===".")
              mass_set.subpath = mass_set.subpath.slice(1, mass_set.subpath.length);
            return mass_set;
        }
        else 
          if (node.type===".") {
            var n2=do_eval(node.children[0], scope, pathout, spathout);
            if (n2!==undefined) {
                if (__instance_of(n2, DataPath))
                  n2 = n2.data;
                return do_eval(node.children[1], n2, pathout, spathout);
            }
        }
        else 
          if (node.type==="ARRAY") {
            var array=do_eval(node.children[0], scope, pathout, spathout);
            if (array===undefined) {
                console.log(node, "eek!");
                return undefined;
            }
            scope = Object.assign({}, scope);
            let index;
            if (array.type===DataPathTypes.PROP&&(array.data.type&(PropTypes.FLAG|PropTypes.ENUM))) {
                index = node.children[1].val;
                if (typeof index==="string") {
                    index = index.trim();
                }
                debugmsg = index in array.data.values;
                if (index in array.data.values) {
                    index = array.data.values[index];
                }
                else 
                  if (index in array.data.keys) {
                    index = array.data.keys[index];
                }
            }
            else {
              index = do_eval(node.children[1], scope, pathout, spathout);
            }
            if (index===undefined)
              index = node.children[1].val;
            arr_index = index;
            var is_flag=false;
            if (array.type===DataPathTypes.PROP&&(array.data.type&(PropTypes.FLAG|PropTypes.ENUM))) {
                spathout[0]+=".data.data & "+index;
                is_flag = true;
            }
            else 
              if (array.type===DataPathTypes.PROP) {
                spathout[0]+=".data.data["+index+"]";
            }
            if (!array.use_path) {
                return array;
            }
            else {
              if (!is_flag) {
                  ownerpathout[0] = pathout[0];
              }
              var path=pathout[0];
              path = path.slice(1, path.length);
              if (array.type===DataPathTypes.PROP&&array.data.type===PropTypes.FLAG) {
                  pathout[0]+="&"+index;
              }
              else 
                if (array.type===DataPathTypes.PROP&&array.data.type===PropTypes.ENUM) {
                  pathout[0]+="=="+index;
              }
              else 
                if (array.type===DataPathTypes.STRUCT_ARRAY) {
                  pathout[0]+=array.data.getitempath(index);
              }
              else {
                pathout[0]+="["+index+"]";
              }
              if (array.type===DataPathTypes.STRUCT_ARRAY) {
                  var arr=this2.evaluate(ctx, path, undefined);
                  var stt=array.data.getter(arr[index]);
                  stt.parent = array;
                  spathout[0]+=".getter("+path+"["+index+"]"+")";
                  return stt;
              }
              else {
                return array;
              }
            }
        }
        else 
          if (node.type=="NUM") {
            return node.val;
        }
      }
      var ast=parser.parse(str);
      let sret=resolve_path_rets.next();
      sret[0] = do_eval(ast, ContextStruct, pathout, spathout);
      pathout[0] = pathout[0].slice(1, pathout[0].length);
      sret[1] = pathout[0];
      sret[2] = spathout[0];
      sret[3] = mass_set;
      sret[4] = ownerpathout[0].slice(1, ownerpathout[0].length);
      sret[5] = debugmsg;
      return sret;
    }
     evaluate(ctx, str, scope) {
      try {
        if (str in this.evalcache) {
            return this.evalcache[str](ctx, scope);
        }
        var func;
        if (config.HAVE_EVAL) {
            var script=`
          func = function(ctx, scope) {
            return $s
          }
        `.replace("$s", str);
            eval(script);
        }
        else {
          var ast=safe_eval.compile(str);
          var _scope={ctx: undefined, 
       scope: undefined, 
       ContextStruct: ContextStruct, 
       g_theme: g_theme};
          func = function (ctx, scope) {
            _scope.scope = scope;
            _scope.ctx = ctx;
            _scope.g_theme = window.g_theme;
            return safe_eval.exec(ast, _scope);
          };
        }
        this.evalcache[str] = func;
        return func(ctx, scope);
      }
      catch (error) {
          if (window.DEBUG!==undefined&&window.DEBUG.ui_datapaths)
            print_stack(error);
          throw new DataAPIError(error.message);
      }
    }
     get_object(ctx, str) {
      if (str===undefined) {
          throw new Error("context cannot be undefined");
      }
      var ret=this.resolve_path_intern(ctx, str);
      if (ret===undefined||ret[0]===undefined||ret[0].type===DataPathTypes.PROP) {
          console.trace("Not a direct object reference", str);
          return undefined;
      }
      else {
        var path=ret[1];
        var val=this.evaluate(ctx, path);
        return val;
      }
    }
     get_prop(ctx, str) {
      try {
        return this.get_prop_intern(ctx, str);
      }
      catch (error) {
          if (!(__instance_of(error, DataAPIError))) {
              print_stack(error);
              console.log("Data API error! path:", str);
          }
          if (DEBUG.ui_datapaths) {
              print_stack(error);
          }
          throw error;
      }
    }
     get_prop_intern(ctx, str) {
      if (str===undefined) {
          str = ctx;
          ctx = new Context();
      }
      let ret=this.resolve_path_intern(ctx, str);
      if (ret===undefined)
        return undefined;
      let val=ret[0];
      if (ret[0].type===DataPathTypes.PROP) {
          if (ret[0].use_path) {
              let path=ret[1];
              val = this.evaluate(ctx, path);
          }
          else {
            val = this.evaluate(ctx, ret[2]);
            if (__instance_of(val, DataPath))
              val = val.data;
            if (__instance_of(val, ToolProperty))
              val = val.data;
          }
          window.__prop = {path: path, 
       val: val};
          let prop=ret[0].data;
          if (prop.flag&TPropFlags.USE_CUSTOM_GETSET) {
              let thisvar=undefined;
              if (prop.flag&TPropFlags.NEEDS_OWNING_OBJECT) {
                  thisvar = ret[4]!==undefined ? this.evaluate(ctx, ret[4]) : prop;
              }
              val = prop.userGetData.call(thisvar, prop, val);
              window.__prop = {path: path, 
         val: val, 
         userGetData: prop.userGetData, 
         flag: prop.flag};
              if (path.match("==")) {
                  let i=path.search(/\=\=/);
                  let num=path.slice(i+2, path.length).trim();
                  if (num.match(/[0-9]+/)) {
                      num = parseInt(num);
                  }
                  else 
                    if (num in prop.values) {
                      num = prop.values[num];
                  }
                  val = val===num;
              }
          }
      }
      else {
        let path=ret[1];
        val = this.evaluate(ctx, path);
        window.__prop = {path: path, 
      val: val};
        return val;
      }
      return val;
    }
     build_mass_set_paths(ctx, listpath, subpath, value, filterstr) {
      if (ctx===undefined) {
          filterstr = value;
          value = subpath;
          subpath = listpath;
          listpath = ctx;
          ctx = new Context();
      }
      var filter;
      if (config.HAVE_EVAL) {
          var filtercode=`
        filter = function filter($) {\n
          return `+filterstr+`\n;
        }`;
          eval(filtercode);
      }
      else {
        var ast=safe_eval.compile(filterstr);
        var scope={ctx: ctx, 
      $: undefined};
        filter = function filter($) {
          scope.$ = $;
          return safe_eval.exec(ast, scope);
        };
      }
      var list=this.get_object(ctx, listpath);
      var ret=this.resolve_path_intern(ctx, listpath);
      var sta=ret[0].data;
      var ret=[];
      for (var key of sta.getkeyiter.call(list, ctx)) {
          var item=sta.getitem.call(list, key);
          if (!filter(item))
            continue;
          var path=(listpath+"["+key+"]"+"."+subpath).trim();
          ret.push(path);
      }
      return ret;
    }
     mass_set_prop(ctx, listpath, subpath, value, filterstr) {
      if (ctx==undefined) {
          filterstr = value;
          value = subpath;
          subpath = listpath;
          listpath = ctx;
          ctx = new Context();
      }
      var paths=this.build_mass_set_paths(ctx, listpath, subpath, value, filterstr);
      for (var i=0; i<paths.length; i++) {
          this.set_prop(ctx, paths[i], value);
      }
    }
     set_prop(ctx, str, value) {
      var ret=this.resolve_path_intern(ctx, str);
      if (ret===undefined) {
          if (DEBUG.ui_datapaths) {
              console.log("Failed to resolve path:", str, "with context", ctx);
          }
          return ret;
      }
      $retcpy_EE94_set_prop.length = ret.length;
      for (var i=0; i<5; i++) {
          $retcpy_EE94_set_prop[i] = ret[i];
      }
      ret = $retcpy_EE94_set_prop;
      var owner=this.evaluate(ctx, ret[4]);
      if (ret[0]!==undefined&&ret[0].type==DataPathTypes.PROP) {
          var prop=ret[0].data;
          prop.ctx = ctx;
          if (prop.flag&TPropFlags.USE_CUSTOM_GETSET) {
              value = prop.userSetData.call(owner, prop, value);
          }
      }
      if (ret[0]==undefined&&ret[3]!=undefined&&ret[3].do_mass_set) {
          if (DEBUG.ui_datapaths) {
              console.log("Mass set prop", str, value);
          }
          this.mass_set_prop(ctx, ret[3].path, ret[3].subpath, value, ret[3].filter);
          return ;
      }
      else 
        if (ret[0]==undefined) {
          console.trace("Error! Unknown path", str, "!");
          return ;
      }
      if (DEBUG.ui_datapaths&&ret[0]==undefined) {
          console.log("error setting", str, "to", value, "ret[0] was undefined", ret.slice(0, ret.length));
      }
      if (DEBUG.ui_datapaths) {
          console.log("set", str, "to", value, "type", ret[0].type, "use_path", ret[0].use_path, "rdata", ret.slice(0, ret.length));
      }
      if (ret[0].type!=DataPathTypes.PROP) {
          console.trace("Error: non-property in set_prop()", str, ret.slice(0, ret.length));
          return ;
      }
      var old_value=this.get_prop(ctx, str);
      var changed=true;
      if (ret[0].type==DataPathTypes.PROP) {
          if (DEBUG.ui_datapaths) {
              console.log("prop set; use_path: ", ret[0].use_path, "type", ret[0].type, ret[0].data);
          }
          var path;
          if (ret[0].use_path) {
              path = ret[1];
          }
          else {
            path = ret[2];
          }
          let si=path.search(/\=\=/);
          if (si>=0) {
              value = path.slice(si+2, path.length).trim();
              path = path.slice(0, si).trim();
              if (is_int(value)) {
                  value = parseInt(value);
              }
          }
          var prop=ret[0].data;
          prop.ctx = ctx;
          if (prop.type==PropTypes.FLAG) {
              if (path.contains("&")) {
                  var mask=Number.parseInt(path.slice(path.search("&")+1, path.length).trim());
                  var path2=path.slice(0, path.search("&"));
                  var val=this.evaluate(ctx, path2);
                  changed = !!(val&mask)!=!!(old_value&mask);
                  if (value)
                    val|=mask;
                  else 
                    val&=~mask;
                  prop.dataref = owner;
                  prop.setValue(val, owner, changed);
                  $scope_tNJe_set_prop[0] = val;
                  path2+=" = scope[0];";
                  this.evaluate(ctx, path2, $scope_tNJe_set_prop);
              }
              else {
                path+=" = "+value;
                this.evaluate(ctx, path);
                changed = value!=old_value;
                prop.dataref = owner;
                prop.setValue(value, owner, changed);
              }
          }
          else {
            if (prop.type==PropTypes.DATAREF) {
                console.trace("IMPLEMENT ME!");
            }
            else 
              if (prop.type==PropTypes.ENUM) {
                if (__instance_of(value, String)||typeof value=="string") {
                    value = prop.values[value];
                }
                if (__instance_of(value, String)||typeof value=="string") {
                    value = '"'+value+'"';
                }
            }
            else 
              if (prop.type==PropTypes.STRING) {
                value = '"'+value+'"';
            }
            var valpath=path;
            if (path.endsWith("]")) {
                var i=path.length-1;
                while (i>=0&&path[i]!="[") {
                  i--                }
                valpath = path.slice(0, i);
            }
            else 
              if (!ret[0].use_path) {
                valpath+=".data.data";
                path+=".data.data";
            }
            var oval=this.evaluate(ctx, path);
            if (typeof value!="number"&&(prop.type==PropTypes.VEC2||prop.type==PropTypes.VEC3||prop.type==PropTypes.VEC4)) {
                var arr=this.evaluate(ctx, path);
                changed = false;
                for (var i=0; i<arr.length; i++) {
                    changed = changed||arr[i]!=value[i];
                    arr[i] = value[i];
                }
            }
            else {
              if (typeof value=="object") {
                  $scope_tNJe_set_prop[0] = value;
                  path+=" = scope[0]";
                  this.evaluate(ctx, path, $scope_tNJe_set_prop);
              }
              else {
                changed = value==old_value;
                path+=" = "+value;
                if (DEBUG.ui_datapaths) {
                    console.log("SETPATH:", path);
                }
                this.evaluate(ctx, path);
              }
            }
            window.__path = {path: path, 
        valpath: valpath};
            changed = value==old_value;
            if (DEBUG.ui_datapaths) {
                console.log("prop set:", valpath, value);
            }
            value = this.evaluate(ctx, valpath);
            prop.dataref = owner;
            prop.setValue(value, owner, changed);
          }
          ret[0].ctx = ctx;
          if (ret[0].update!=undefined)
            ret[0].update.call(ret[0], owner, old_value, changed);
      }
    }
     get_struct(ctx, str) {
      if (str==undefined) {
          str = ctx;
          ctx = new Context();
      }
      var ret=this.resolve_path_intern(ctx, str);
      if (ret==undefined||ret[0]==undefined)
        return undefined;
      if (__instance_of(ret[0], DataPath)) {
          return ret[0].data;
      }
      return ret[0];
    }
     get_prop_meta(ctx, str) {
      if (str==undefined) {
          str = ctx;
          ctx = new Context();
      }
      var ret=this.resolve_path_intern(ctx, str);
      if (ret==undefined||ret[0]==undefined)
        return undefined;
      return ret[0].data;
    }
  }
  var $cache_Vty__resolve_path_intern={}
  var $retcpy_EE94_set_prop=new Array(16);
  var $scope_tNJe_set_prop=[0, 0];
  _ESClass.register(DataAPI);
  _es6_module.add_class(DataAPI);
  DataAPI = _es6_module.add_export('DataAPI', DataAPI);
}, '/dev/fairmotion/src/core/data_api/data_api.js');
es6_module_define('data_api_parser', ["../../path.ux/scripts/util/parseutil.js"], function _data_api_parser_module(_es6_module) {
  "use strict";
  var PUTL=es6_import(_es6_module, '../../path.ux/scripts/util/parseutil.js');
  function apiparser() {
    function tk(name, re, func) {
      return new PUTL.tokdef(name, re, func);
    }
    var tokens=[tk("ID", /[a-zA-Z_]+[a-zA-Z$0-9_]*/), tk("ASSIGN", /=/), tk("EQUALS", /==/), tk("COLON", /:/), tk("INT", /[0-9]+/, (t) =>      {
      t.value = parseInt(t.value);
      return t;
    }), tk("LSBRACKET", /\[/), tk("RSBRACKET", /\]/), tk("LPARAM", /\(/), tk("RPARAM", /\)/), tk("CODE", /\{.*\}/, function (t) {
      t.value = t.value.slice(1, t.value.length-1).trim();
      return t;
    }), tk("COMMA", /,/), tk("DOT", /\./), tk("SEMI", /;/), tk("NEWLINE", /\n/, function (t) {
      t.lexer.lineno+=1;
    }), tk("SPACE", / |\t/, function (t) {
    })];
    function errfunc(lexer) {
      return true;
    }
    var lex=new PUTL.lexer(tokens, errfunc);
    var parser=new PUTL.parser(lex);
    function numnode(token, n) {
      return {type: "INT", 
     val: n, 
     children: [], 
     lexstart: token.lexpos, 
     lexend: token.lexpos+token.lexlen}
    }
    function valnode(token, id) {
      return {type: "ID", 
     val: id, 
     children: [], 
     lexstart: token.lexpos, 
     lexend: token.lexpos+token.lexlen}
    }
    function varnode(token, id, val) {
      if (val===undefined) {
          val = undefined;
      }
      var cs=val!=undefined ? [val] : [];
      return {type: "VAR", 
     val: id, 
     children: cs, 
     lexstart: token.lexpos, 
     lexend: token.lexpos+token.lexlen}
    }
    function bnode(token, l, r, op) {
      return {type: op, 
     children: [l, r], 
     lexstart: token.lexpos, 
     lexend: token.lexpos+token.lexlen}
    }
    function funcnode(token, name_expr, args) {
      var cs=[name_expr];
      for (var i=0; i<args.length; i++) {
          cs.push(args[i]);
      }
      return {type: "FUNC", 
     children: cs, 
     lexstart: token.lexpos, 
     lexend: token.lexpos+token.lexlen}
    }
    function arrnode(token, name_expr, ref) {
      return {type: "ARRAY", 
     children: [name_expr, ref], 
     lexstart: token.lexpos, 
     lexend: token.lexpos+token.lexlen}
    }
    function p_FuncCall(p, name_expr) {
      var args=[];
      var lexstart1=p.lexer.lexpos;
      p.expect("LPARAM");
      while (!p.at_end()) {
        var t=p.peeknext();
        if (t==undefined) {
            p.error(t, "func");
        }
        if (t.type=="RPARAM") {
            p.next();
            break;
        }
        var lexstart=p.lexer.lexpos;
        var arg=p.expect("ID");
        var val=undefined;
        if (p.peeknext().type=="ASSIGN") {
            p.next();
            var val=p_Expr(p, ",)");
        }
        var lexend=p.lexer.lexpos;
        args.push({lexpos: lexstart, 
      lexlen: lexstart-lexend}, varnode(arg, val));
        var t=p.next();
        if (t.type=="RPARAM") {
            break;
        }
        else 
          if (t.type!="COMMA") {
            p.error(t, "invalid token in function call");
        }
      }
      var lexlen=p.lexer.lexpos-lexstart1;
      var ret=funcnode({lexpos: lexstart, 
     lexlen: lexlen}, name_expr, args);
      return ret;
    }
    function p_Expr(p, end_chars) {
      if (end_chars===undefined) {
          end_chars = "";
      }
      var lexstart=p.lexer.lexpos;
      var t=p.peeknext();
      var ast;
      if (t.type=="ID")
        ast = valnode(t, p.expect("ID"));
      else 
        if (t.type=="INT")
        ast = numnode(t, p.expect("INT"));
      else 
        p.error("Invalid token "+t.type+"'"+t.value+"'");
      while (!p.at_end()) {
        var t=p.peeknext();
        if (t.type=="DOT") {
            p.next();
            var t2=p.peeknext();
            var id=p.expect("ID", "expected id after '.'");
            ast = bnode({lexpos: lexstart, 
        lexlen: t.lexpos+t.lexlen}, ast, valnode(t2, id), ".");
        }
        else 
          if (t.type=="LPARAM") {
            ast = p_FuncCall(p, ast);
        }
        else 
          if (t.type=="EQUALS") {
            p.expect("EQUALS");
            let t2=p.next();
            var n2={type: "EQUALS", 
        lexstart: t2.lexpos, 
        lexend: t2.lexpos+t2.lexlen, 
        value: t2.value};
            ast = bnode({lexstart: n2.lexstart, 
        lexend: n2.lexend}, ast, n2, "EQUALS");
        }
        else 
          if (t.type=="LSBRACKET") {
            p.expect("LSBRACKET");
            var val=p_Expr(p, "]");
            p.expect("RSBRACKET");
            ast = arrnode({lexpos: lexstart, 
        lexlen: t.lexpos+t.lexlen}, ast, val);
        }
        else 
          if (t.type=="INT") {
            ast = numnode(t, t.value);
            p.next();
        }
        else 
          if (t.type=="CODE") {
            p.next();
            var n2={type: "STRING", 
        lexstart: t.lexpos, 
        lexend: t.lexpos+t.lexlen, 
        value: t.value};
            ast = bnode({lexpos: lexstart, 
        lexlen: t.lexpos+t.lexlen}, ast, n2, "CODE");
        }
        else 
          if (end_chars.contains(t.value)) {
            return ast;
        }
        else {
          p.error(t, "Invalid token "+t.type+"'"+t.value+"'");
        }
      }
      return ast;
    }
    parser.start = p_Expr;
    return parser;
  }
  apiparser = _es6_module.add_export('apiparser', apiparser);
  function fmt_ast(ast, tlevel) {
    if (tlevel===undefined) {
        tlevel = 0;
    }
    var s="";
    var t="";
    for (var i=0; i<tlevel; i++) {
t+=" "
    }
    s+=t+ast["type"];
    if (ast["type"]=="ID"||ast["type"]=="VAR"||ast["type"]=="INT")
      s+=" "+ast["val"];
    s+=" {\n";
    var cs=ast["children"];
    if (cs==undefined)
      cs = [];
    for (var i=0; i<cs.length; i++) {
        s+=fmt_ast(cs[i], tlevel+1);
    }
    s+=t+"}\n";
    return s;
  }
  function test_dapi_parser() {
    var p=apiparser();
    var tst="operator_stack[0].name";
    var tree=p.parse(tst);
    console.log(fmt_ast(tree));
    console.log(g_app_state.api.get_prop_new(new Context(), tst));
    g_app_state.api.set_prop_new(new Context(), "view2d.zoomfac", 0.5);
  }
}, '/dev/fairmotion/src/core/data_api/data_api_parser.js');
es6_module_define('video', [], function _video_module(_es6_module) {
  class FrameIterator  {
    
    
     constructor(vm) {
      this.vm = vm;
      this.ret = {done: true, 
     value: undefined};
      this.i = 0;
    }
     init(vm) {
      this.vm = vm;
      this.ret.done = false;
      this.ret.value = undefined;
      this.i = 0;
    }
     [Symbol.iterator]() {
      return this;
    }
     next() {
      if (this.i>=this.vm.totframe) {
          this.ret.done = true;
          return this.ret;
      }
      this.ret.value = this.vm.get(this.i++);
      return this.ret;
    }
  }
  _ESClass.register(FrameIterator);
  _es6_module.add_class(FrameIterator);
  class Video  {
    
    
    
     constructor(url) {
      this.canvas = document.createElement("canvas");
      this.g = this.canvas.getContext("2d");
      this.video = document.createElement("video");
      this.url = url;
      this.source = document.createElement("source");
      this.source.src = url;
      this.video.appendChild(this.source);
      var this2=this;
      this.video.oncanplaythrough = (function oncanplaythrough() {
        this2.record_video();
        this2.video.oncanplaythrough = null;
      }).bind(this);
      this.video.load();
      this.frames = {};
      this.recording = false;
      this.totframe = 0;
    }
     record_video() {
      if (this.recording) {
          console.trace("Already started recording!");
          return ;
      }
      var video=this.video;
      if (video.readyState!=4) {
          var this2=this;
          var timer=window.setInterval(function () {
            if (video.readyState==4) {
                window.clearInterval(timer);
                this2.record_video();
            }
          }, 100);
          return ;
      }
      this.recording = true;
      this.canvas.width = video.videoWidth;
      this.canvas.height = video.videoHeight;
      var g=this.g;
      var frames=this.frames;
      var size=[video.videoWidth, video.videoHeight];
      var this2=this;
      function finish() {
        console.log("finish!", this2);
        this2.recording = false;
        var rerun=false;
        for (var i=1; i<this2.totframe; i++) {
            if (!(i in this2.frames)) {
                console.log("Missing frame", i);
                rerun = true;
            }
        }
        if (rerun) {
            console.log("Scanning video again. . .");
            this2.video = video = document.createElement("video");
            this2.source = document.createElement("source");
            this2.source.src = this2.url;
            this2.video.appendChild(this2.source);
            this2.video.oncanplaythrough = (function () {
              this2.record_video();
              this2.video.oncanplaythrough = null;
            }).bind(this2);
            this2.video.load();
        }
      }
      this.blank = g.getImageData(0, 0, size[0], size[1]);
      var canvas=this.canvas;
      var cur_i=0;
      var on_frame=(function () {
        var frame=cur_i++;
        if (video.paused) {
            console.log("Done!");
        }
        if (frame in frames)
          return ;
        this2.totframe = Math.max(this2.totframe, frame+1);
        g.drawImage(video, 0, 0);
        var img=document.createElement("img");
        img.width = size[0];
        img.height = size[1];
        img.src = canvas.toDataURL();
        frames[frame] = img;
      }).bind(this);
      console.log("start video");
      video.onloadeddata = function () {
        console.log("meta", arguments);
      };
      video.addEventListener("loadeddata", function () {
        console.log("meta2", arguments);
      });
      var last_frame=-1;
      video.playbackRate = 0.5;
      video.ontimeupdate = video.onseeked = video.onplaying = function () {
        var frame=Math.floor(video.currentTime*29.97);
        if (last_frame!=frame) {
            console.clear();
            console.log("frame: ", frame-last_frame);
            on_frame();
        }
        last_frame = frame;
        video.onpause = function () {
          video.onpause = null;
          video.play();
        }
        video.pause();
      };
      video.play();
    }
     get(frame) {
      if (frame in this.frames)
        return this.frames[frame];
      return undefined;
    }
     [Symbol.iterator]() {
      return new FrameIterator(this);
    }
  }
  _ESClass.register(Video);
  _es6_module.add_class(Video);
  Video = _es6_module.add_export('Video', Video);
  function current_frame(v) {
    return Math.floor(v.currentTime*15.0);
    if (v.webkitDecodedFrameCount!=undefined)
      return v.currentTime;
  }
  class VideoManager  {
     constructor() {
      this.pathmap = {};
      this.videos = {};
    }
     get(url) {
      if (url in this.pathmap) {
          return this.pathmap[url];
      }
      this.pathmap[url] = new Video(url);
    }
  }
  _ESClass.register(VideoManager);
  _es6_module.add_class(VideoManager);
  VideoManager = _es6_module.add_export('VideoManager', VideoManager);
  var manager=new VideoManager();
  manager = _es6_module.add_export('manager', manager);
}, '/dev/fairmotion/src/core/video.js');
es6_module_define('fileapi', ["./fileapi_electron", "./fileapi_chrome", "./fileapi_html5", "../../config/config.js"], function _fileapi_module(_es6_module) {
  var config=es6_import(_es6_module, '../../config/config.js');
  function get_root_folderid() {
    return '/';
  }
  get_root_folderid = _es6_module.add_export('get_root_folderid', get_root_folderid);
  function get_current_dir() {
    return '';
  }
  get_current_dir = _es6_module.add_export('get_current_dir', get_current_dir);
  function path_to_id() {
    return '';
  }
  path_to_id = _es6_module.add_export('path_to_id', path_to_id);
  function id_to_path() {
    return '';
  }
  id_to_path = _es6_module.add_export('id_to_path', id_to_path);
  if (config.CHROME_APP_MODE) {
      var ___fileapi_chrome=es6_import(_es6_module, './fileapi_chrome');
      for (let k in ___fileapi_chrome) {
          _es6_module.add_export(k, ___fileapi_chrome[k], true);
      }
  }
  else 
    if (config.ELECTRON_APP_MODE) {
      var ___fileapi_electron=es6_import(_es6_module, './fileapi_electron');
      for (let k in ___fileapi_electron) {
          _es6_module.add_export(k, ___fileapi_electron[k], true);
      }
  }
  else {
    var ___fileapi_html5=es6_import(_es6_module, './fileapi_html5');
    for (let k in ___fileapi_html5) {
        _es6_module.add_export(k, ___fileapi_html5[k], true);
    }
  }
}, '/dev/fairmotion/src/core/fileapi/fileapi.js');
es6_module_define('fileapi_html5', ["../../config/config.js"], function _fileapi_html5_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../../config/config.js');
  function clearRecentList() {
  }
  clearRecentList = _es6_module.add_export('clearRecentList', clearRecentList);
  function getRecentList() {
    return [];
  }
  getRecentList = _es6_module.add_export('getRecentList', getRecentList);
  function setRecent(name, id) {
  }
  setRecent = _es6_module.add_export('setRecent', setRecent);
  function openRecent(thisvar, id) {
    throw new Error("not supported for html5");
  }
  openRecent = _es6_module.add_export('openRecent', openRecent);
  function reset() {
  }
  reset = _es6_module.add_export('reset', reset);
  function open_file(callback, thisvar, set_current_file, extslabel, exts) {
    if (thisvar==undefined)
      thisvar = this;
    var form=document.createElement("form");
    document.body.appendChild(form);
    var input=document.createElement("input");
    input.type = "file";
    input.id = "file";
    input.style.position = "absolute";
    input.style["z-index"] = 10;
    input.style.visible = "hidden";
    input.style.visibility = "hidden";
    var finished=false;
    input.oncancel = input.onabort = input.close = function () {
      console.log("aborted");
      if (!finished) {
          document.body.removeChild(form);
          finished = true;
      }
    }
    input.onchange = function (e) {
      var files=this.files;
      if (!finished) {
          document.body.removeChild(form);
          finished = true;
      }
      if (files.length==0)
        return ;
      var file=files[0];
      var reader=new FileReader();
      reader.onload = function (e) {
        console.log(e.target.result);
        callback.call(thisvar, e.target.result, file.name, file.name);
      }
      reader.readAsArrayBuffer(file);
    }
    input.focus();
    input.select();
    input.click();
    window.finput = input;
    form.appendChild(input);
  }
  open_file = _es6_module.add_export('open_file', open_file);
  function can_access_path(path) {
    return false;
  }
  can_access_path = _es6_module.add_export('can_access_path', can_access_path);
  function save_file(data, save_as_mode, set_current_file, extslabel, exts, error_cb) {
    if (config.CHROME_APP_MODE) {
        return chrome_app_save(data, save_as_mode, set_current_file, extslabel, exts, error_cb);
    }
    if (!(__instance_of(data, Blob)))
      data = new Blob([data], {type: "application/octet-binary"});
    var url=URL.createObjectURL(data);
    var link=document.createElement("a");
    link.href = url;
    var name=g_app_state.filepath;
    name = name===undefined||name.trim()=="" ? "untitled.fmo" : name;
    link.download = name;
    console.log(link, link.__proto__);
    window._link = link;
    link.click();
    return ;
    window.open(url);
    console.log("url:", url);
  }
  save_file = _es6_module.add_export('save_file', save_file);
  function save_with_dialog(data, default_path, extslabel, exts, error_cb, success_cb) {
    return save_file(data, true, false, extslabel, exts, error_cb);
  }
  save_with_dialog = _es6_module.add_export('save_with_dialog', save_with_dialog);
}, '/dev/fairmotion/src/core/fileapi/fileapi_html5.js');
es6_module_define('fileapi_chrome', [], function _fileapi_chrome_module(_es6_module) {
  "use strict";
  var current_chromeapp_file=undefined;
  function chrome_get_current_file() {
    return current_chromeapp_file;
  }
  chrome_get_current_file = _es6_module.add_export('chrome_get_current_file', chrome_get_current_file);
  function reset() {
    current_chromeapp_file = undefined;
  }
  reset = _es6_module.add_export('reset', reset);
  function open_file(callback, thisvar, set_current_file, extslabel, exts) {
    console.log("Chrome open");
    function errorHandler() {
      console.log("Error reading file!", arguments);
    }
    var params={type: 'openFile'}
    params.accepts = [{description: extslabel, 
    extensions: exts}];
    chrome.fileSystem.chooseEntry(params, function (readOnlyEntry) {
      if (readOnlyEntry==undefined)
        return ;
      if (set_current_file)
        current_chromeapp_file = readOnlyEntry;
      readOnlyEntry.file(function (file) {
        var reader=new FileReader();
        console.log("got file", arguments, reader);
        reader.onerror = errorHandler;
        reader.onload = function (e) {
          var id=chrome.fileSystem.retainEntry(readOnlyEntry);
          console.log("\n\n           ->", e.target.result, readOnlyEntry, id, "<-\n\n");
          callback.call(thisvar, e.target.result, file.name, id);
        }
        reader.readAsArrayBuffer(file);
      });
    });
  }
  open_file = _es6_module.add_export('open_file', open_file);
  function save_file(data, save_as_mode, set_current_file, extslabel, exts, error_cb) {
    function errorHandler() {
      console.log("Error writing file!", arguments);
    }
    function chooseFile() {
      var params={type: 'saveFile'}
      if (g_app_state.filepath!=""&g_app_state.filepath!=undefined) {
          params.suggestedName = g_app_state.filepath;
      }
      params.accepts = [{description: extslabel, 
     extensions: exts}];
      chrome.fileSystem.chooseEntry(params, function (writableFileEntry) {
        if (writableFileEntry==undefined) {
            console.log("user cancel?");
            return ;
        }
        if (set_current_file)
          current_chromeapp_file = writableFileEntry;
        writableFileEntry.createWriter(function (writer) {
          writer.onerror = errorHandler;
          writer.onwriteend = function (e) {
            console.log('write complete');
            g_app_state.notes.label("File saved");
          }
          if (!(__instance_of(data, Blob)))
            data = new Blob([data], {type: "application/octet-binary"});
          writer.write(data);
        }, errorHandler);
      });
    }
    function error() {
      console.log("Error writing file", arguments);
      current_chromeapp_file = undefined;
      if (error_cb!=undefined)
        error_cb.apply(this, arguments);
    }
    if (save_as_mode||current_chromeapp_file==undefined) {
        chooseFile();
    }
    else 
      if (current_chromeapp_file!=undefined) {
        current_chromeapp_file.createWriter(function (writer) {
          writer.onerror = error;
          writer.onwriteend = function () {
            console.log('write complete');
            g_app_state.notes.label("File saved");
          }
          data = new Blob([data], {type: "application/octet-binary"});
          writer.write(data);
        }, errorHandler);
    }
  }
  save_file = _es6_module.add_export('save_file', save_file);
}, '/dev/fairmotion/src/core/fileapi/fileapi_chrome.js');
es6_module_define('fileapi_electron', ["../../config/config.js", "./fileapi_html5.js"], function _fileapi_electron_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../../config/config.js');
  var fileapi_html5=es6_import(_es6_module, './fileapi_html5.js');
  let fs;
  if (config.IS_NODEJS) {
      fs = require("fs");
  }
  function reset() {
  }
  reset = _es6_module.add_export('reset', reset);
  function is_dir(path) {
    try {
      let st=fs.statSync(path);
      return st.isDirectory();
    }
    catch (error) {
        print_stack(error);
        return false;
    }
  }
  is_dir = _es6_module.add_export('is_dir', is_dir);
  function get_base_dir(path) {
    if (path===undefined)
      return undefined;
    while (path.length>0&&!is_dir(path)) {
      while (path.length>0&&path[path.length-1]!="/"&&path[path.length-1]!="\\") {
        path = path.slice(0, path.length-1);
      }
      if (path.length>0) {
          path = path.slice(0, path.length-1);
      }
    }
    return path=="" ? undefined : path;
  }
  get_base_dir = _es6_module.add_export('get_base_dir', get_base_dir);
  function open_file(callback, thisvar, set_current_file, extslabel, exts, error_cb) {
    if (thisvar==undefined)
      thisvar = this;
    let default_path=get_base_dir(g_app_state.filepath);
    let dialog=require('electron').dialog;
    if (dialog===undefined) {
        dialog = require('electron').remote.dialog;
    }
    dialog.showOpenDialog(undefined, {title: "Open", 
    defaultPath: default_path, 
    filters: [{name: extslabel, 
     extensions: exts}], 
    securityScopedBookmarks: true}).then((e) =>      {
      if (e.cancelled) {
          return ;
      }
      let path=e.filePaths;
      if (__instance_of(path, Array)) {
          path = path[0];
      }
      let fname=path;
      if (path===undefined) {
          return ;
      }
      let idx1=path.lastIndexOf("/");
      let idx2=path.lastIndexOf("\\");
      let idx=Math.max(idx1, idx2);
      if (idx>=0) {
          fname = fname.slice(idx+1, fname.length);
      }
      console.warn(set_current_file, "set_current_file");
      console.log("path:", path, "name", fname);
      let buf;
      try {
        buf = fs.readFileSync(path);
      }
      catch (error) {
          print_stack(error);
          console.warn("Failed to load file at path ", path);
          if (error_cb!==undefined)
            error_cb();
      }
      let buf2=new Uint8Array(buf.byteLength);
      let i=0;
      for (let b of buf) {
          buf2[i++] = b;
      }
      buf = buf2.buffer;
      if (thisvar!==undefined)
        callback.call(thisvar, buf, fname, path);
      else 
        callback(buf, fname, path);
    });
  }
  open_file = _es6_module.add_export('open_file', open_file);
  function can_access_path(path) {
    try {
      fs.accessSync(path, fs.constants.R_OK|fs.constants.W_OK);
      return true;
    }
    catch (error) {
        return false;
    }
  }
  can_access_path = _es6_module.add_export('can_access_path', can_access_path);
  function save_file(data, path, error_cb, success_cb) {
    if (__instance_of(data, DataView)) {
        data = data.buffer;
    }
    else 
      if (!(__instance_of(data, ArrayBuffer))&&data.buffer) {
        data = data.buffer;
    }
    console.log("Data", data, path);
    data = new Uint8Array(data);
    try {
      fs.writeFileSync(path, data);
    }
    catch (error) {
        console.warn("Failed to write to path "+path);
        if (error_cb!==undefined)
          error_cb(error);
        print_stack(error);
        return ;
    }
    if (success_cb!==undefined) {
        success_cb(path);
    }
  }
  save_file = _es6_module.add_export('save_file', save_file);
  function save_with_dialog(data, default_path, extslabel, exts, error_cb, success_cb) {
    let dialog=require('electron').dialog;
    if (dialog===undefined) {
        dialog = require('electron').remote.dialog;
    }
    dialog.showSaveDialog(undefined, {title: "Save", 
    defaultPath: default_path, 
    filters: [{name: extslabel, 
     extensions: exts}], 
    securityScopedBookmarks: true}).then((dialog_data) =>      {
      let canceled=dialog_data.canceled;
      let path=dialog_data.filePath;
      if (canceled)
        return ;
      console.log("SAVING:", path);
      save_file(data, path, error_cb, success_cb);
    });
  }
  save_with_dialog = _es6_module.add_export('save_with_dialog', save_with_dialog);
  function save_file_old(data, save_as_mode, set_current_file, extslabel, exts, error_cb) {
    if (config.CHROME_APP_MODE) {
        return chrome_app_save(data, save_as_mode, set_current_file, extslabel, exts, error_cb);
    }
    if (!(__instance_of(data, Blob)))
      data = new Blob([data], {type: "application/octet-binary"});
    var url=URL.createObjectURL(data);
    var link=document.createElement("a");
    link.href = url;
    var name=g_app_state.filepath.trim();
    name = name=="" ? "untitled.fmo" : name;
    link.download = name;
    console.log(link, link.__proto__);
    window._link = link;
    link.click();
    return ;
    window.open(url);
    console.log("url:", url);
  }
  save_file_old = _es6_module.add_export('save_file_old', save_file_old);
}, '/dev/fairmotion/src/core/fileapi/fileapi_electron.js');
es6_module_define('animdata', ["./lib_api.js", "./eventdag.js", "./toolprops.js", "./struct.js", "../curve/spline_base.js"], function _animdata_module(_es6_module) {
  "use strict";
  var PropTypes=es6_import_item(_es6_module, './toolprops.js', 'PropTypes');
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  var CustomDataLayer=es6_import_item(_es6_module, '../curve/spline_base.js', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, '../curve/spline_base.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../curve/spline_base.js', 'SplineFlags');
  var DataPathWrapperNode=es6_import_item(_es6_module, './eventdag.js', 'DataPathWrapperNode');
  function getDataPathKey(ctx, id) {
    let datalib=ctx.datalib;
    for (let block of datalib.allBlocks) {
        if (id in block.lib_anim_idmap) {
            return block.lib_anim_idmap[id];
        }
    }
  }
  getDataPathKey = _es6_module.add_export('getDataPathKey', getDataPathKey);
  const AnimKeyTypes={SPLINE: 0, 
   DATAPATH: 1}
  _es6_module.add_export('AnimKeyTypes', AnimKeyTypes);
  const AnimKeyFlags={SELECT: 1}
  _es6_module.add_export('AnimKeyFlags', AnimKeyFlags);
  var AnimInterpModes={STEP: 1, 
   CATMULL: 2, 
   LINEAR: 4}
  AnimInterpModes = _es6_module.add_export('AnimInterpModes', AnimInterpModes);
  class TimeDataLayer extends CustomDataLayer {
    
     constructor() {
      super();
      this.owning_veid = -1;
      this.time = 1.0;
    }
     interp(srcs, ws) {
      this.time = 0.0;
      if (srcs.length>0) {
          this.owning_veid = srcs[0].owning_veid;
      }
      for (var i=0; i<srcs.length; i++) {
          this.time+=srcs[i].time*ws[i];
      }
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
    }
    static  define() {
      return {typeName: "TimeDataLayer"}
    }
  }
  _ESClass.register(TimeDataLayer);
  _es6_module.add_class(TimeDataLayer);
  TimeDataLayer = _es6_module.add_export('TimeDataLayer', TimeDataLayer);
  TimeDataLayer.STRUCT = STRUCT.inherit(TimeDataLayer, CustomDataLayer)+`
    time         : float;
    owning_veid  : int;
  }
`;
  function get_vtime(v) {
    var ret=v.cdata.get_layer(TimeDataLayer);
    if (ret!==undefined)
      return ret.time;
    return -1;
  }
  get_vtime = _es6_module.add_export('get_vtime', get_vtime);
  function set_vtime(spline, v, time) {
    var ret=v.cdata.get_layer(TimeDataLayer);
    if (ret!=undefined) {
        ret.time = time;
        spline.flagUpdateVertTime(v);
    }
  }
  set_vtime = _es6_module.add_export('set_vtime', set_vtime);
  var IntProperty=es6_import_item(_es6_module, './toolprops.js', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, './toolprops.js', 'FloatProperty');
  var DataTypes=es6_import_item(_es6_module, './lib_api.js', 'DataTypes');
  var DataNames=es6_import_item(_es6_module, './lib_api.js', 'DataNames');
  class AnimKey extends DataPathWrapperNode {
    
    
    
     constructor() {
      super();
      this.id = -1;
      this.flag = 0;
      this.time = 1.0;
      this.handles = [0, 0];
      this.mode = AnimInterpModes.STEP;
      this.data = undefined;
      this.owner_eid = -1;
      this.channel = undefined;
    }
     dag_get_datapath(ctx) {
      var owner=this.channel.owner;
      var path;
      if (owner.lib_id<=-1) {
          path = owner.dag_get_datapath();
      }
      else {
        var name=DataNames[owner.lib_type].toLowerCase();
        path = "datalib."+name+".items["+owner.lib_id+"]";
      }
      path+=".animkeys["+this.id+"]";
      return path;
    }
     set_time(time) {
      this.time = time;
      this.channel.resort = true;
    }
    static  fromSTRUCT(reader) {
      var ret=new AnimKey();
      reader(ret);
      return ret;
    }
    static  nodedef() {
      return {name: "AnimKey", 
     inputs: {}, 
     outputs: {"depend": undefined, 
      "id": 0.0}}
    }
  }
  _ESClass.register(AnimKey);
  _es6_module.add_class(AnimKey);
  AnimKey = _es6_module.add_export('AnimKey', AnimKey);
  AnimKey.STRUCT = `
  AnimKey {
    owner_eid : int;
    id        : int;
    flag      : int;
    time      : float;
    mode      : int;
    handles   : array(float);
    data      : abstract(ToolProperty);
  }
`;
  class AnimChannel  {
    
     constructor(proptype, name, path) {
      this.keys = [];
      this.resort = false;
      this.proptype = proptype;
      this.name = name===undefined ? "unnamed" : name;
      this.path = path;
      this.id = -1;
      this.owner = undefined;
      this.idgen = undefined;
      this.idmap = undefined;
    }
     add(key) {
      if (key.id===-1) {
          key.id = this.idgen.gen_id();
      }
      this.idmap[key.id] = key;
      this.keys.push(key);
      return this;
    }
     remove(key) {
      delete this.idmap[key.id];
      this.keys.remove(key);
      this.resort = true;
      return this;
    }
     _do_resort() {
      this.keys.sort(function (a, b) {
        return a.time-b.time;
      });
      this.resort = false;
    }
     get_propcls() {
      if (this.propcls==undefined) {
          switch (this.proptype) {
            case PropTypes.INT:
              this.propcls = IntProperty;
              break;
            case PropTypes.FLOAT:
              this.propcls = FloatProperty;
              break;
          }
      }
      return this.propcls;
    }
     update(time, val) {
      if (this.resort) {
          this._do_resort();
      }
      for (var i=0; i<this.keys.length; i++) {
          if (this.keys[i].time==time) {
              this.keys[i].data.setValue(val);
              return this.keys[i];
          }
      }
      var propcls=this.get_propcls();
      var key=new AnimKey();
      key.id = this.idgen.gen_id();
      this.idmap[key.id] = key;
      key.channel = this;
      key.data = new propcls();
      key.data.setValue(val);
      key.time = time;
      this.keys.push(key);
      this._do_resort();
      return key;
    }
     evaluate(time) {
      if (this.resort) {
          this._do_resort();
      }
      for (var i=0; i<this.keys.length; i++) {
          var k=this.keys[i];
          if (k.time>time) {
              break;
          }
      }
      var prev=i===0 ? this.keys[i] : this.keys[i-1];
      var key=i===this.keys.length ? this.keys[this.keys.length-1] : this.keys[i];
      var t;
      if (prev.time!==key.time) {
          t = (time-prev.time)/(key.time-prev.time);
      }
      else {
        t = 1.0;
      }
      var a=prev.data.data, b=key.data.data;
      var ret;
      if (key.mode===AnimInterpModes.STEP)
        ret = a;
      else 
        ret = a+(b-a)*t;
      if (this.proptype===PropTypes.INT)
        ret = Math.floor(ret+0.5);
      return ret;
    }
    static  fromSTRUCT(reader) {
      var ret=new AnimChannel();
      reader(ret);
      for (var i=0; i<ret.keys.length; i++) {
          ret.keys[i].channel = ret;
      }
      return ret;
    }
  }
  _ESClass.register(AnimChannel);
  _es6_module.add_class(AnimChannel);
  AnimChannel = _es6_module.add_export('AnimChannel', AnimChannel);
  AnimChannel.STRUCT = `
  AnimChannel {
    name     : string;
    keys     : array(AnimKey);
    proptype : int;
    path     : string;
    id       : int;
  }
`;
}, '/dev/fairmotion/src/core/animdata.js');
es6_module_define('animutil', [], function _animutil_module(_es6_module) {
  "use strict";
  var AnimTypes={SPLINE_PATH_TIME: 1, 
   DATABLOCK_PATH: 2, 
   ALL: 1|2}
  AnimTypes = _es6_module.add_export('AnimTypes', AnimTypes);
  function iterAnimCurves(ctx, types) {
  }
  iterAnimCurves = _es6_module.add_export('iterAnimCurves', iterAnimCurves);
}, '/dev/fairmotion/src/core/animutil.js');
es6_module_define('config_defines', [], function _config_defines_module(_es6_module) {
}, '/dev/fairmotion/src/config/config_defines.js');
es6_module_define('svg_export', ["../curve/spline_draw.js", "./mathlib.js", "../curve/spline_draw_new.js", "../vectordraw/vectordraw_svg.js", "../curve/spline_base.js"], function _svg_export_module(_es6_module) {
  "use strict";
  var math=es6_import(_es6_module, './mathlib.js');
  var SplineFlags=es6_import_item(_es6_module, '../curve/spline_base.js', 'SplineFlags');
  var MaterialFlags=es6_import_item(_es6_module, '../curve/spline_base.js', 'MaterialFlags');
  var SplineTypes=es6_import_item(_es6_module, '../curve/spline_base.js', 'SplineTypes');
  var SplineDrawer=es6_import_item(_es6_module, '../curve/spline_draw_new.js', 'SplineDrawer');
  var draw_spline=es6_import_item(_es6_module, '../curve/spline_draw.js', 'draw_spline');
  var SVGDraw2D=es6_import_item(_es6_module, '../vectordraw/vectordraw_svg.js', 'SVGDraw2D');
  var cubic_rets=cachering.fromConstructor(Vector3, 64);
  function cubic(a, b, c, d, s) {
    var ret=cubic_rets.next();
    for (var i=0; i<3; i++) {
        ret[i] = a[i]*s*s*s-3*a[i]*s*s+3*a[i]*s-a[i]-3*b[i]*s*s*s+6*b[i]*s*s-3*b[i]*s;
        ret[i]+=3*c[i]*s*s*s-3*c[i]*s*s-d[i]*s*s*s;
        ret[i] = -ret[i];
    }
    return ret;
  }
  function export_svg(spline, visible_only) {
    if (visible_only===undefined) {
        visible_only = false;
    }
    if (spline===undefined) {
        spline = g_app_state.ctx.spline;
    }
    let drawer=new SplineDrawer(spline, new SVGDraw2D());
    spline.regen_render();
    spline.regen_sort();
    let view2d=g_app_state.ctx.view2d;
    let matrix=new Matrix4(view2d.rendermat);
    let width=1024;
    let height=768;
    matrix.scale(1, -1, 1);
    matrix.translate(0, -height);
    let canvas=document.createElement("canvas");
    let g=canvas.getContext("2d");
    canvas.width = width;
    canvas.height = height;
    canvas.style["width"] = canvas.width+"px";
    canvas.style["height"] = canvas.height+"px";
    drawer.update(spline, spline.drawlist, spline.draw_layerlist, matrix, [], true, 1, g, 1.0, view2d, true);
    drawer.draw(g);
    let ret=drawer.drawer.svg.outerHTML;
    drawer.drawer.destroy();
    return ret;
  }
  export_svg = _es6_module.add_export('export_svg', export_svg);
}, '/dev/fairmotion/src/util/svg_export.js');
es6_module_define('vectormath', ["../path.ux/scripts/util/vectormath.js"], function _vectormath_module(_es6_module) {
  "use strict";
  var ____path_ux_scripts_util_vectormath_js=es6_import(_es6_module, '../path.ux/scripts/util/vectormath.js');
  for (let k in ____path_ux_scripts_util_vectormath_js) {
      _es6_module.add_export(k, ____path_ux_scripts_util_vectormath_js[k], true);
  }
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../path.ux/scripts/util/vectormath.js', 'Vector4');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/util/vectormath.js', 'Matrix4');
  var Quat=es6_import_item(_es6_module, '../path.ux/scripts/util/vectormath.js', 'Quat');
  window.Vector2 = Vector2;
  window.Vector3 = Vector3;
  window.Vector4 = Vector4;
  window.Quat = Quat;
  window.Matrix4 = Matrix4;
}, '/dev/fairmotion/src/util/vectormath.js');
es6_module_define('context', ["../util/util.js", "../widgets/ui_noteframe.js", "../config/const.js"], function _context_module(_es6_module) {
  var util=es6_import(_es6_module, '../util/util.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var ui_noteframe=es6_import(_es6_module, '../widgets/ui_noteframe.js');
  window.ccosnt = cconst;
  const ContextFlags={IS_VIEW: 1}
  _es6_module.add_export('ContextFlags', ContextFlags);
  class InheritFlag  {
     constructor(data) {
      this.data = data;
    }
  }
  _ESClass.register(InheritFlag);
  _es6_module.add_class(InheritFlag);
  let __idgen=1;
  if (Symbol.ContextID===undefined) {
      Symbol.ContextID = Symbol("ContextID");
  }
  if (Symbol.CachedDef===undefined) {
      Symbol.CachedDef = Symbol("CachedDef");
  }
  const _ret_tmp=[undefined];
  const OverlayClasses=[];
  _es6_module.add_export('OverlayClasses', OverlayClasses);
  class ContextOverlay  {
     constructor(appstate) {
      this.ctx = undefined;
      this._state = appstate;
    }
    get  state() {
      return this._state;
    }
     onRemove(have_new_file=false) {

    }
     copy() {
      return new this.constructor(this._state);
    }
     validate() {
      throw new Error("Implement me!");
    }
    static  contextDefine() {
      throw new Error("implement me!");
      return {name: "", 
     flag: 0}
    }
    static  resolveDef() {
      if (this.hasOwnProperty(Symbol.CachedDef)) {
          return this[Symbol.CachedDef];
      }
      let def2=Symbol.CachedDef = {};
      let def=this.contextDefine();
      if (def===undefined) {
          def = {};
      }
      for (let k in def) {
          def2[k] = def[k];
      }
      if (!("flag") in def) {
          def2.flag = Context.inherit(0);
      }
      let parents=[];
      let p=util.getClassParent(this);
      while (p&&p!==ContextOverlay) {
        parents.push(p);
        p = util.getClassParent(p);
      }
      if (__instance_of(def2.flag, InheritFlag)) {
          let flag=def2.flag.data;
          for (let p of parents) {
              let def=p.contextDefine();
              if (!def.flag) {
                  continue;
              }
              else 
                if (__instance_of(def.flag, InheritFlag)) {
                  flag|=def.flag.data;
              }
              else {
                flag|=def.flag;
                break;
              }
          }
          def2.flag = flag;
      }
      return def2;
    }
  }
  _ESClass.register(ContextOverlay);
  _es6_module.add_class(ContextOverlay);
  ContextOverlay = _es6_module.add_export('ContextOverlay', ContextOverlay);
  const excludedKeys=new Set(["onRemove", "reset", "toString", "_fix", "valueOf", "copy", "next", "save", "load", "clear", "hasOwnProperty", "toLocaleString", "constructor", "propertyIsEnumerable", "isPrototypeOf", "state", "saveProperty", "loadProperty", "getOwningOverlay", "_props"]);
  _es6_module.add_export('excludedKeys', excludedKeys);
  class LockedContext  {
     constructor(ctx) {
      this.props = {};
      this.state = ctx.state;
      this.api = ctx.api;
      this.toolstack = ctx.toolstack;
      this.load(ctx);
    }
     toLocked() {
      return this;
    }
     error() {
      return this.ctx.error(...arguments);
    }
     warning() {
      return this.ctx.warning(...arguments);
    }
     message() {
      return this.ctx.message(...arguments);
    }
     progbar() {
      return this.ctx.progbar(...arguments);
    }
     load(ctx) {
      let keys=ctx._props;
      function wrapget(name) {
        return function (ctx2, data) {
          return ctx.loadProperty(ctx2, name, data);
        }
      }
      for (let k of keys) {
          let v;
          if (k==="state"||k==="toolstack"||k==="api") {
              continue;
          }
          if (typeof k==="string"&&(k.endsWith("_save")||k.endsWith("_load"))) {
              continue;
          }
          try {
            v = ctx[k];
          }
          catch (error) {
              if (cconst.DEBUG.contextSystem) {
                  console.warn("failed to look up property in context: ", k);
              }
              continue;
          }
          let data, getter;
          let overlay=ctx.getOwningOverlay(k);
          if (overlay===undefined) {
              continue;
          }
          try {
            if (typeof k==="string"&&(overlay[k+"_save"]&&overlay[k+"_load"])) {
                data = overlay[k+"_save"]();
                getter = overlay[k+"_load"];
            }
            else {
              data = ctx.saveProperty(k);
              getter = wrapget(k);
            }
          }
          catch (error) {
              console.warn("Failed to save context property", k);
              continue;
          }
          this.props[k] = {data: data, 
       get: getter};
      }
      let defineProp=(name) =>        {
        Object.defineProperty(this, name, {get: function () {
            let def=this.props[name];
            return def.get(this.ctx, def.data);
          }});
      };
      for (let k in this.props) {
          defineProp(k);
      }
      this.ctx = ctx;
    }
     setContext(ctx) {
      this.ctx = ctx;
      this.state = ctx.state;
      this.api = ctx.api;
      this.toolstack = ctx.toolstack;
    }
  }
  _ESClass.register(LockedContext);
  _es6_module.add_class(LockedContext);
  LockedContext = _es6_module.add_export('LockedContext', LockedContext);
  let next_key={}
  let idgen=1;
  class Context  {
     constructor(appstate) {
      this.state = appstate;
      this._props = new Set();
      this._stack = [];
      this._inside_map = {};
    }
     _fix() {
      this._inside_map = {};
    }
     error(message, timeout=1500) {
      let state=this.state;
      console.warn(message);
      if (state&&state.screen) {
          return ui_noteframe.error(state.screen, message, timeout);
      }
    }
     warning(message, timeout=1500) {
      let state=this.state;
      console.warn(message);
      if (state&&state.screen) {
          return ui_noteframe.warning(state.screen, message, timeout);
      }
    }
     message(msg, timeout=1500) {
      let state=this.state;
      console.warn(msg);
      if (state&&state.screen) {
          return ui_noteframe.message(state.screen, msg, timeout);
      }
    }
     progbar(msg, perc=0.0, timeout=1500, id=msg) {
      let state=this.state;
      if (state&&state.screen) {
          return ui_noteframe.progbarNote(state.screen, msg, perc, "green", timeout, id);
      }
    }
     validateOverlays() {
      let stack=this._stack;
      let stack2=[];
      for (let i=0; i<stack.length; i++) {
          if (stack[i].validate()) {
              stack2.push(stack[i]);
          }
      }
      this._stack = stack2;
    }
     hasOverlay(cls) {
      return this.getOverlay(cls)!==undefined;
    }
     getOverlay(cls) {
      for (let overlay of this._stack) {
          if (overlay.constructor===cls) {
              return overlay;
          }
      }
    }
     clear(have_new_file=false) {
      for (let overlay of this._stack) {
          overlay.onRemove(have_new_file);
      }
      this._stack = [];
    }
     reset(have_new_file=false) {
      this.clear(have_new_file);
    }
     override(overrides) {
      if (overrides.copy===undefined) {
          overrides.copy = function () {
            return Object.assign({}, this);
          };
      }
      let ctx=this.copy();
      ctx.pushOverlay(overrides);
      return ctx;
    }
     copy() {
      let ret=new this.constructor(this.state);
      for (let item of this._stack) {
          ret.pushOverlay(item.copy());
      }
      return ret;
    }
    static  super() {
      return next_key;
    }
     saveProperty(key) {
      console.warn("Missing saveProperty implementation in Context; passing through values...");
      return this[key];
    }
     loadProperty(ctx, key, data) {
      console.warn("Missing loadProperty implementation in Context; passing through values...");
      return data;
    }
     getOwningOverlay(name, _val_out) {
      let inside_map=this._inside_map;
      let stack=this._stack;
      if (cconst.DEBUG.contextSystem) {
          console.log(name, inside_map);
      }
      for (let i=stack.length-1; i>=0; i--) {
          let overlay=stack[i];
          let ret=next_key;
          if (overlay[Symbol.ContextID]===undefined) {
              throw new Error("context corruption");
          }
          let ikey=overlay[Symbol.ContextID];
          if (cconst.DEBUG.contextSystem) {
              console.log(ikey, overlay);
          }
          if (inside_map[ikey]) {
              continue;
          }
          if (overlay.__allKeys.has(name)) {
              if (cconst.DEBUG.contextSystem) {
                  console.log("getting value");
              }
              inside_map[ikey] = 1;
              try {
                ret = overlay[name];
              }
              catch (error) {
                  inside_map[ikey] = 0;
                  throw error;
              }
              inside_map[ikey] = 0;
          }
          if (ret!==next_key) {
              if (_val_out!==undefined) {
                  _val_out[0] = ret;
              }
              return overlay;
          }
      }
      if (_val_out!==undefined) {
          _val_out[0] = undefined;
      }
      return undefined;
    }
     ensureProperty(name) {
      if (this.hasOwnProperty(name)) {
          return ;
      }
      this._props.add(name);
      Object.defineProperty(this, name, {get: function () {
          let ret=_ret_tmp;
          _ret_tmp[0] = undefined;
          this.getOwningOverlay(name, ret);
          return ret[0];
        }, 
     set: function () {
          throw new Error("Cannot set ctx properties");
        }});
    }
     toLocked() {
      return new LockedContext(this);
    }
     pushOverlay(overlay) {
      if (!overlay.hasOwnProperty(Symbol.ContextID)) {
          overlay[Symbol.ContextID] = idgen++;
      }
      let keys=new Set();
      for (let key of util.getAllKeys(overlay)) {
          if (!excludedKeys.has(key)&&!(typeof key==="string"&&key[0]==="_")) {
              keys.add(key);
          }
      }
      overlay.ctx = this;
      if (overlay.__allKeys===undefined) {
          overlay.__allKeys = keys;
      }
      for (let k of keys) {
          let bad=typeof k==="symbol"||excludedKeys.has(k);
          bad = bad||(typeof k==="string"&&k[0]==="_");
          bad = bad||(typeof k==="string"&&k.endsWith("_save"));
          bad = bad||(typeof k==="string"&&k.endsWith("_load"));
          if (bad) {
              continue;
          }
          this.ensureProperty(k);
      }
      if (this._stack.indexOf(overlay)>=0) {
          console.warn("Overlay already added once");
          if (this._stack[this._stack.length-1]===overlay) {
              console.warn("  Definitely an error, overlay is already at top of stack");
              return ;
          }
      }
      this._stack.push(overlay);
    }
     popOverlay(overlay) {
      if (overlay!==this._stack[this._stack.length-1]) {
          console.warn("Context.popOverlay called in error", overlay);
          return ;
      }
      overlay.onRemove();
      this._stack.pop();
    }
     removeOverlay(overlay) {
      if (this._stack.indexOf(overlay)<0) {
          console.warn("Context.removeOverlay called in error", overlay);
          return ;
      }
      overlay.onRemove();
      this._stack.remove(overlay);
    }
    static  inherit(data) {
      return new InheritFlag(data);
    }
    static  register(cls) {
      if (cls[Symbol.ContextID]) {
          console.warn("Tried to register same class twice:", cls);
          return ;
      }
      cls[Symbol.ContextID] = __idgen++;
      OverlayClasses.push(cls);
    }
  }
  _ESClass.register(Context);
  _es6_module.add_class(Context);
  Context = _es6_module.add_export('Context', Context);
  function test() {
    function testInheritance() {
      class Test0 extends ContextOverlay {
        static  contextDefine() {
          return {flag: 1}
        }
      }
      _ESClass.register(Test0);
      _es6_module.add_class(Test0);
      class Test1 extends Test0 {
        static  contextDefine() {
          return {flag: 2}
        }
      }
      _ESClass.register(Test1);
      _es6_module.add_class(Test1);
      class Test2 extends Test1 {
        static  contextDefine() {
          return {flag: Context.inherit(4)}
        }
      }
      _ESClass.register(Test2);
      _es6_module.add_class(Test2);
      class Test3 extends Test2 {
        static  contextDefine() {
          return {flag: Context.inherit(8)}
        }
      }
      _ESClass.register(Test3);
      _es6_module.add_class(Test3);
      class Test4 extends Test3 {
        static  contextDefine() {
          return {flag: Context.inherit(16)}
        }
      }
      _ESClass.register(Test4);
      _es6_module.add_class(Test4);
      return Test4.resolveDef().flag===30;
    }
    return testInheritance();
  }
  test = _es6_module.add_export('test', test);
  if (!test()) {
      throw new Error("Context test failed");
  }
}, '/dev/fairmotion/src/path.ux/scripts/controller/context.js');
es6_module_define('controller', ["../util/vectormath.js", "../util/util.js", "../toolsys/toolprop.js", "../toolsys/simple_toolsys.js", "../toolsys/toolprop_abstract.js"], function _controller_module(_es6_module) {
  var toolprop=es6_import(_es6_module, '../toolsys/toolprop.js');
  var ToolOp=es6_import_item(_es6_module, '../toolsys/simple_toolsys.js', 'ToolOp');
  var print_stack=es6_import_item(_es6_module, '../util/util.js', 'print_stack');
  var toolprop_abstract=es6_import(_es6_module, '../toolsys/toolprop_abstract.js');
  var ToolProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'ToolProperty');
  var util=es6_import(_es6_module, '../util/util.js');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../util/vectormath.js', 'Quat');
  let PropFlags=toolprop.PropFlags, PropTypes=toolprop.PropTypes;
  function getVecClass(proptype) {
    switch (proptype) {
      case PropTypes.VEC2:
        return Vector2;
      case PropTypes.VEC3:
        return Vector3;
      case PropTypes.VEC4:
        return Vector4;
      case PropTypes.QUAT:
        return Quat;
      default:
        throw new Error("bad prop type "+proptype);
    }
  }
  getVecClass = _es6_module.add_export('getVecClass', getVecClass);
  function isVecProperty(prop) {
    if (!prop||typeof prop!=="object"||prop===null)
      return false;
    let ok=false;
    ok = ok||__instance_of(prop, toolprop_abstract.Vec2PropertyIF);
    ok = ok||__instance_of(prop, toolprop_abstract.Vec3PropertyIF);
    ok = ok||__instance_of(prop, toolprop_abstract.Vec4PropertyIF);
    ok = ok||__instance_of(prop, toolprop.Vec2Property);
    ok = ok||__instance_of(prop, toolprop.Vec3Property);
    ok = ok||__instance_of(prop, toolprop.Vec4Property);
    ok = ok||prop.type===PropTypes.VEC2;
    ok = ok||prop.type===PropTypes.VEC3;
    ok = ok||prop.type===PropTypes.VEC4;
    ok = ok||prop.type===PropTypes.QUAT;
    return ok;
  }
  isVecProperty = _es6_module.add_export('isVecProperty', isVecProperty);
  const DataFlags={READ_ONLY: 1, 
   USE_CUSTOM_GETSET: 2, 
   USE_FULL_UNDO: 4}
  _es6_module.add_export('DataFlags', DataFlags);
  class DataPathError extends Error {
  }
  _ESClass.register(DataPathError);
  _es6_module.add_class(DataPathError);
  DataPathError = _es6_module.add_export('DataPathError', DataPathError);
  
  class ListIface  {
     getStruct(api, list, key) {

    }
     get(api, list, key) {

    }
     getKey(api, list, obj) {

    }
     getActive(api, list) {

    }
     setActive(api, list, val) {

    }
     set(api, list, key, val) {
      list[key] = val;
    }
     getIter() {

    }
     filter(api, list, filter) {

    }
  }
  _ESClass.register(ListIface);
  _es6_module.add_class(ListIface);
  ListIface = _es6_module.add_export('ListIface', ListIface);
  class ToolOpIface  {
     constructor() {

    }
    static  tooldef() {
      return {uiname: "!untitled tool", 
     icon: -1, 
     toolpath: "logical_module.tool", 
     description: undefined, 
     is_modal: false, 
     inputs: {}, 
     outputs: {}}
    }
  }
  _ESClass.register(ToolOpIface);
  _es6_module.add_class(ToolOpIface);
  ToolOpIface = _es6_module.add_export('ToolOpIface', ToolOpIface);
  
  class ModelInterface  {
     constructor() {
      this.prefix = "";
    }
     getToolDef(path) {
      throw new Error("implement me");
    }
     getToolPathHotkey(ctx, path) {
      return undefined;
    }
    get  list() {
      throw new Error("implement me");
      return ListIface;
    }
     createTool(path, inputs={}, constructor_argument=undefined) {
      throw new Error("implement me");
    }
     parseToolPath(path) {
      throw new Error("implement me");
    }
     execOrRedo(ctx, toolop, compareInputs=false) {
      return ctx.toolstack.execOrRedo(ctx, toolop, compareInputs);
    }
     execTool(ctx, path, inputs={}, constructor_argument=undefined) {
      return new Promise((accept, reject) =>        {
        let tool=path;
        try {
          if (typeof tool=="string"||!(__instance_of(tool, ToolOp))) {
              tool = this.createTool(ctx, path, inputs, constructor_argument);
          }
        }
        catch (error) {
            print_stack(error);
            reject(error);
            return ;
        }
        accept(tool);
        try {
          ctx.toolstack.execTool(ctx, tool);
        }
        catch (error) {
            print_stack(error);
            throw error;
        }
      });
    }
     pushReportContext(name) {

    }
     popReportContext() {

    }
    static  toolRegistered(tool) {
      throw new Error("implement me");
    }
    static  registerTool(tool) {
      throw new Error("implement me");
    }
     massSetProp(ctx, mass_set_path, value) {
      throw new Error("implement me");
    }
     resolveMassSetPaths(ctx, mass_set_path) {
      throw new Error("implement me");
    }
     resolvePath(ctx, path, ignoreExistence) {

    }
     setValue(ctx, path, val) {
      let res=this.resolvePath(ctx, path);
      let prop=res.prop;
      if (prop!==undefined&&(prop.flag&PropFlags.USE_CUSTOM_GETSET)) {
          prop.dataref = res.obj;
          prop.ctx = ctx;
          prop.datapath = path;
          prop.setValue(val);
          return ;
      }
      if (prop!==undefined) {
          if (prop.type===PropTypes.CURVE&&!val) {
              throw new DataPathError("can't set curve data to nothing");
          }
          let use_range=(prop.type&(PropTypes.INT|PropTypes.FLOAT));
          use_range = use_range||(res.subkey&&(prop.type&(PropTypes.VEC2|PropTypes.VEC3|PropTypes.VEC4)));
          use_range = use_range&&prop.range;
          use_range = use_range&&!(prop.range[0]===0.0&&prop.range[1]===0.0);
          if (use_range) {
              val = Math.min(Math.max(val, prop.range[0]), prop.range[1]);
          }
      }
      let old=res.obj[res.key];
      if (res.subkey!==undefined&&res.prop!==undefined&&res.prop.type==PropTypes.ENUM) {
          let ival=res.prop.values[res.subkey];
          if (val) {
              res.obj[res.key] = ival;
          }
      }
      else 
        if (res.prop!==undefined&&res.prop.type==PropTypes.FLAG) {
          let ival=res.prop.values[res.subkey];
          if (val) {
              res.obj[res.key]|=ival;
          }
          else {
            res.obj[res.key]&=~ival;
          }
      }
      else 
        if (res.subkey!==undefined&&isVecProperty(res.prop)) {
          res.obj[res.subkey] = val;
      }
      else 
        if (!(prop!==undefined&&__instance_of(prop, ListIface))) {
          res.obj[res.key] = val;
      }
      if (prop!==undefined&&__instance_of(prop, ListIface)) {
          prop.set(this, res.obj, res.key, val);
      }
      else 
        if (prop!==undefined) {
          prop.dataref = res.obj;
          prop.datapath = path;
          prop.ctx = ctx;
          prop._fire("change", res.obj[res.key], old);
      }
    }
     getDescription(ctx, path) {
      let rdef=this.resolvePath(ctx, path);
      if (rdef===undefined) {
          throw new DataPathError("invalid path "+path);
      }
      if (!rdef.prop||!(__instance_of(rdef.prop, ToolProperty))) {
          return "";
      }
      let type=rdef.prop.type;
      let prop=rdef.prop;
      if (rdef.subkey!==undefined) {
          let subkey=rdef.subkey;
          if (type&(PropTypes.VEC2|PropTypes.VEC3|PropTypes.VEC4)) {
              if (prop.descriptions&&subkey in prop.descriptions) {
                  return prop.descriptions[subkey];
              }
          }
          else 
            if (type&(PropTypes.ENUM|PropTypes.FLAG)) {
              if (!(subkey in prop.values)&&subkey in prop.keys) {
                  subkey = prop.keys[subkey];
              }
              
              if (prop.descriptions&&subkey in prop.descriptions) {
                  return prop.descriptions[subkey];
              }
          }
          else 
            if (type===PropTypes.PROPLIST) {
              let val=tdef.value;
              if (typeof val==="object"&&__instance_of(val, ToolProperty)) {
                  return val.description;
              }
          }
      }
      return rdef.prop.description ? rdef.prop.description : rdef.prop.uiname;
    }
     validPath(ctx, path) {
      try {
        this.getValue(ctx, path);
        return true;
      }
      catch (error) {
          if (!(__instance_of(error, DataPathError))) {
              throw error;
          }
      }
      return false;
    }
     getValue(ctx, path) {
      if (typeof ctx=="string") {
          throw new Error("You forgot to pass context to getValue");
      }
      let ret=this.resolvePath(ctx, path);
      if (ret===undefined) {
          throw new DataPathError("invalid path", path);
      }
      if (ret.prop!==undefined&&(ret.prop.flag&PropFlags.USE_CUSTOM_GETSET)) {
          ret.prop.dataref = ret.obj;
          ret.prop.datapath = path;
          ret.prop.ctx = ctx;
          return ret.prop.getValue();
      }
      return this.resolvePath(ctx, path).value;
    }
  }
  _ESClass.register(ModelInterface);
  _es6_module.add_class(ModelInterface);
  ModelInterface = _es6_module.add_export('ModelInterface', ModelInterface);
  let DataAPIClass=undefined;
  function setImplementationClass(cls) {
    DataAPIClass = cls;
  }
  setImplementationClass = _es6_module.add_export('setImplementationClass', setImplementationClass);
  function registerTool(cls) {
    if (DataAPIClass===undefined) {
        throw new Error("data api not initialized properly; call setImplementationClass");
    }
    return DataAPIClass.registerTool(cls);
  }
  registerTool = _es6_module.add_export('registerTool', registerTool);
}, '/dev/fairmotion/src/path.ux/scripts/controller/controller.js');
es6_module_define('controller_ops', ["./controller.js", "../toolsys/simple_toolsys.js", "../util/util.js", "../toolsys/toolprop.js"], function _controller_ops_module(_es6_module) {
  var ToolOp=es6_import_item(_es6_module, '../toolsys/simple_toolsys.js', 'ToolOp');
  var ToolFlags=es6_import_item(_es6_module, '../toolsys/simple_toolsys.js', 'ToolFlags');
  var PropTypes=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropTypes');
  var PropFlags=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropFlags');
  var BoolProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'BoolProperty');
  var IntProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'FloatProperty');
  var FlagProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'FlagProperty');
  var EnumProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'EnumProperty');
  var StringProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'StringProperty');
  var Vec3Property=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'Vec3Property');
  var Vec2Property=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'Vec2Property');
  var Vec4Property=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'Vec4Property');
  var QuatProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'QuatProperty');
  var Mat4Property=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'Mat4Property');
  var util=es6_import(_es6_module, '../util/util.js');
  var isVecProperty=es6_import_item(_es6_module, './controller.js', 'isVecProperty');
  var getVecClass=es6_import_item(_es6_module, './controller.js', 'getVecClass');
  class DataPathSetOp extends ToolOp {
     constructor() {
      super();
      this.propType = -1;
      this._undo = undefined;
    }
     setValue(ctx, val, object) {
      let prop=this.inputs.prop;
      let path=this.inputs.dataPath.getValue();
      if (path.type&(PropTypes.ENUM|PropTypes.FLAG)) {
          let rdef=ctx.api.resolvePath(ctx, path);
          if (rdef.subkey!==undefined) {
          }
      }
      prop.dataref = object;
      prop.ctx = ctx;
      prop.datapath = path;
      prop.setValue(val);
    }
    static  create(ctx, datapath, value, id, massSetPath) {
      let rdef=ctx.api.resolvePath(ctx, datapath);
      if (rdef===undefined||rdef.prop===undefined) {
          console.warn("DataPathSetOp failed", rdef, rdef.prop);
          return ;
      }
      let prop=rdef.prop;
      let tool=new DataPathSetOp();
      tool.propType = prop.type;
      if (prop&&(prop.flag&PropFlags.USE_BASE_UNDO)) {
          tool.inputs.fullSaveUndo.setValue(true);
      }
      let mask=PropTypes.FLAG|PropTypes.ENUM;
      mask|=PropTypes.VEC2|PropTypes.VEC3|PropTypes.VEC4|PropTypes.QUAT;
      if (rdef.subkey!==undefined&&(prop.type&mask)) {
          if (prop.type&(PropTypes.ENUM|PropTypes.FLAG))
            tool.inputs.prop = new IntProperty();
          else 
            tool.inputs.prop = new FloatProperty();
      }
      else {
        tool.inputs.prop = prop.copy();
      }
      tool.inputs.dataPath.setValue(datapath);
      if (massSetPath) {
          tool.inputs.massSetPath.setValue(massSetPath);
      }
      else {
        tool.inputs.massSetPath.setValue("");
      }
      tool.id = id;
      tool.setValue(ctx, value, rdef.obj);
      return tool;
    }
     hash(massSetPath, dataPath, prop, id) {
      massSetPath = massSetPath===undefined ? "" : massSetPath;
      massSetPath = massSetPath===null ? "" : massSetPath;
      let ret=""+massSetPath+":"+dataPath+":"+prop+":"+id;
      return ret;
    }
     hashThis() {
      return this.hash(this.inputs.massSetPath.getValue(), this.inputs.dataPath.getValue(), this.propType, this.id);
    }
     undoPre(ctx) {
      if (this.inputs.fullSaveUndo.getValue()) {
          return super.undoPre(ctx);
      }
      if (this.__ctx)
        ctx = this.__ctx;
      this._undo = {};
      let paths=new util.set();
      if (this.inputs.massSetPath.getValue().trim()) {
          let massSetPath=this.inputs.massSetPath.getValue().trim();
          paths = new util.set(ctx.api.resolveMassSetPaths(ctx, massSetPath));
      }
      paths.add(this.inputs.dataPath.getValue());
      for (let path of paths) {
          this._undo[path] = ctx.api.getValue(ctx, path);
      }
    }
     undo(ctx) {
      if (this.__ctx)
        ctx = this.__ctx;
      if (this.inputs.fullSaveUndo.getValue()) {
          return super.undo(ctx);
      }
      for (let path in this._undo) {
          let rdef=ctx.api.resolvePath(ctx, path);
          if (rdef.prop!==undefined&&(rdef.prop.type&(PropTypes.ENUM|PropTypes.FLAG))) {
              let old=rdef.obj[rdef.key];
              rdef.obj[rdef.key] = this._undo[path];
              rdef.prop.dataref = rdef.obj;
              rdef.prop.datapath = path;
              rdef.prop.ctx = ctx;
              rdef.prop._fire("change", rdef.obj[rdef.key], old);
          }
          else {
            try {
              ctx.api.setValue(ctx, path, this._undo[path]);
            }
            catch (error) {
                util.print_stack(error);
                console.warn("Failed to set property in undo for DataPathSetOp");
            }
          }
      }
    }
     exec(ctx) {
      if (this.__ctx) {
          ctx = this.__ctx;
      }
      let path=this.inputs.dataPath.getValue();
      let massSetPath=this.inputs.massSetPath.getValue().trim();
      ctx.api.setValue(ctx, path, this.inputs.prop.getValue());
      if (massSetPath) {
          ctx.api.massSetProp(ctx, massSetPath, this.inputs.prop.getValue());
      }
    }
     modalStart(ctx) {
      this.__ctx = ctx.toLocked();
      super.modalStart(this.__ctx);
      this.exec(this.__ctx);
      this.modalEnd(false);
    }
    static  tooldef() {
      return {uiname: "Property Set", 
     toolpath: "app.prop_set", 
     icon: -1, 
     flag: ToolFlags.PRIVATE, 
     is_modal: true, 
     inputs: {dataPath: new StringProperty(), 
      massSetPath: new StringProperty(), 
      fullSaveUndo: new BoolProperty(false)}}
    }
  }
  _ESClass.register(DataPathSetOp);
  _es6_module.add_class(DataPathSetOp);
  DataPathSetOp = _es6_module.add_export('DataPathSetOp', DataPathSetOp);
  ToolOp.register(DataPathSetOp);
}, '/dev/fairmotion/src/path.ux/scripts/controller/controller_ops.js');
es6_module_define('simple_controller', ["../util/util.js", "../toolsys/toolpath.js", "../toolsys/toolprop_abstract.js", "../config/const.js", "../toolsys/toolprop.js", "./controller_ops.js", "./controller.js", "../util/parseutil.js", "../toolsys/simple_toolsys.js"], function _simple_controller_module(_es6_module) {
  var toolprop=es6_import(_es6_module, '../toolsys/toolprop.js');
  var parseutil=es6_import(_es6_module, '../util/parseutil.js');
  var print_stack=es6_import_item(_es6_module, '../util/util.js', 'print_stack');
  var ToolOp=es6_import_item(_es6_module, '../toolsys/simple_toolsys.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../toolsys/simple_toolsys.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../toolsys/simple_toolsys.js', 'ToolFlags');
  var Vec2Property=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'Vec2Property');
  var Vec3Property=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'Vec4Property');
  var PropTypes=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropTypes');
  var PropFlags=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropFlags');
  var toolprop_abstract=es6_import(_es6_module, '../toolsys/toolprop_abstract.js');
  var util=es6_import(_es6_module, '../util/util.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  let PUTLParseError=parseutil.PUTLParseError;
  let tk=(name, re, func) =>    {
    return new parseutil.tokdef(name, re, func);
  }
  let tokens=[tk("ID", /[a-zA-Z_$]+[a-zA-Z_$0-9]*/), tk("NUM", /-?[0-9]+/, (t) =>    {
    t.value = parseInt(t.value);
    return t;
  }), tk("STRLIT", /'.*'/, (t) =>    {
    t.value = t.value.slice(1, t.value.length-1);
    return t;
  }), tk("STRLIT", /".*"/, (t) =>    {
    t.value = t.value.slice(1, t.value.length-1);
    return t;
  }), tk("DOT", /\./), tk("EQUALS", /(\=)|(\=\=)/), tk("LSBRACKET", /\[/), tk("RSBRACKET", /\]/), tk("AND", /\&/), tk("WS", /[ \t\n\r]+/, (t) =>    {
    return undefined;
  })];
  let lexer=new parseutil.lexer(tokens, (t) =>    {
    console.warn("Parse error", t);
    throw new DataPathError();
  });
  let pathParser=new parseutil.parser(lexer);
  pathParser = _es6_module.add_export('pathParser', pathParser);
  var ModelInterface=es6_import_item(_es6_module, './controller.js', 'ModelInterface');
  var ToolOpIface=es6_import_item(_es6_module, './controller.js', 'ToolOpIface');
  var DataFlags=es6_import_item(_es6_module, './controller.js', 'DataFlags');
  var DataPathError=es6_import_item(_es6_module, './controller.js', 'DataPathError');
  var setImplementationClass=es6_import_item(_es6_module, './controller.js', 'setImplementationClass');
  var isVecProperty=es6_import_item(_es6_module, './controller.js', 'isVecProperty');
  var ListIface=es6_import_item(_es6_module, './controller.js', 'ListIface');
  var initToolPaths=es6_import_item(_es6_module, '../toolsys/toolpath.js', 'initToolPaths');
  var parseToolPath=es6_import_item(_es6_module, '../toolsys/toolpath.js', 'parseToolPath');
  let _ex_DataPathError=es6_import_item(_es6_module, './controller.js', 'DataPathError');
  _es6_module.add_export('DataPathError', _ex_DataPathError, true);
  let _ex_DataFlags=es6_import_item(_es6_module, './controller.js', 'DataFlags');
  _es6_module.add_export('DataFlags', _ex_DataFlags, true);
  var ToolClasses=es6_import_item(_es6_module, '../toolsys/simple_toolsys.js', 'ToolClasses');
  var ToolProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'ToolProperty');
  var IntProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'IntProperty');
  let tool_classes=ToolClasses;
  let tool_idgen=1;
  Symbol.ToolID = Symbol("toolid");
  function toolkey(cls) {
    if (!(Symbol.ToolID in cls)) {
        cls[Symbol.ToolID] = tool_idgen++;
    }
    return cls[Symbol.ToolID];
  }
  let lt=util.time_ms();
  let lastmsg=undefined;
  let lcount=0;
  let reportstack=["api"];
  function pushReportName(name) {
    if (reportstack.length>1024) {
        console.trace("eerk, reportstack overflowed");
        reportstack.length = 0;
        reportstack.push("api");
    }
    reportstack.push(name);
  }
  pushReportName = _es6_module.add_export('pushReportName', pushReportName);
  function report(msg) {
    let name=reportstack.length===0 ? "api" : reportstack[reportstack.length-1];
    util.console.context(name).warn(msg);
  }
  function popReportName() {
    reportstack.pop();
  }
  popReportName = _es6_module.add_export('popReportName', popReportName);
  const DataTypes={STRUCT: 0, 
   DYNAMIC_STRUCT: 1, 
   PROP: 2, 
   ARRAY: 3}
  _es6_module.add_export('DataTypes', DataTypes);
  class DataPath  {
     constructor(path, apiname, prop, type=DataTypes.PROP) {
      this.type = type;
      this.data = prop;
      this.apiname = apiname;
      this.path = path;
      this.flag = 0;
      this.struct = undefined;
    }
     copy() {
      let ret=new DataPath();
      ret.flag = this.flag;
      ret.type = this.type;
      ret.data = this.data;
      ret.apiname = this.apiname;
      ret.path = this.path;
      ret.struct = this.struct;
      return ret;
    }
     setProp(prop) {
      this.data = prop;
    }
     read_only() {
      this.flag|=DataFlags.READ_ONLY;
      return this;
    }
     customGetSet(get, set) {
      this.data.flag|=PropFlags.USE_CUSTOM_GETSET;
      this.flag|=DataFlags.USE_CUSTOM_GETSET;
      this.data._getValue = this.data.getValue;
      this.data._setValue = this.data.setValue;
      if (get)
        this.data.getValue = get;
      if (set)
        this.data.setValue = set;
      return this;
    }
     customSet(set) {
      this.customGetSet(undefined, set);
      return this;
    }
     customGet(get) {
      this.customGetSet(get, undefined);
      return this;
    }
     on(type, cb) {
      if (this.type==DataTypes.PROP) {
          this.data.on(type, cb);
      }
      else {
        throw new Error("invalid call to DataPath.on");
      }
      return this;
    }
     off(type, cb) {
      if (this.type==DataTypes.PROP) {
          this.data.off(type, cb);
      }
    }
     simpleSlider() {
      this.data.flag|=PropFlags.SIMPLE_SLIDER;
      return this;
    }
     rollerSlider() {
      this.data.flag&=~PropFlags.SIMPLE_SLIDER;
      this.data.flag|=PropFlags.FORCE_ROLLER_SLIDER;
      return this;
    }
     baseUnit(unit) {
      this.data.setBaseUnit(unit);
      return this;
    }
     displayUnit(unit) {
      this.data.setDisplayUnit(unit);
      return this;
    }
     range(min, max) {
      this.data.setRange(min, max);
      return this;
    }
     uiRange(min, max) {
      this.data.setUIRange(min, max);
      return this;
    }
     decimalPlaces(n) {
      this.data.setDecimalPlaces(n);
      return this;
    }
     expRate(exp) {
      this.data.setExpRate(exp);
      return this;
    }
     uniformSlider(state=true) {
      this.data.uniformSlider(state);
      return this;
    }
     radix(r) {
      this.data.setRadix(r);
      return this;
    }
     relativeStep(s) {
      this.data.setRelativeStep(s);
      return this;
    }
     step(s) {
      this.data.setStep(s);
      return this;
    }
     fullSaveUndo() {
      this.flag|=DataFlags.USE_FULL_UNDO;
      this.data.flag|=PropFlags.USE_BASE_UNDO;
      return this;
    }
     icon(i) {
      this.data.setIcon(i);
      return this;
    }
     icons(icons) {
      this.data.addIcons(icons);
      return this;
    }
     descriptions(description_map) {
      this.data.addDescriptions(description_map);
      return this;
    }
     uiNames(uinames) {
      this.data.setUINames(uinames);
      return this;
    }
     description(d) {
      this.data.description = d;
      return this;
    }
  }
  _ESClass.register(DataPath);
  _es6_module.add_class(DataPath);
  DataPath = _es6_module.add_export('DataPath', DataPath);
  class DataList extends ListIface {
     copy() {
      let ret=new DataList([this.cb.get]);
      for (let k in this.cb) {
          ret.cb[k] = this.cb[k];
      }
      return ret;
    }
     constructor(callbacks) {
      super();
      if (callbacks===undefined) {
          throw new DataPathError("missing callbacks argument to DataList");
      }
      this.cb = {};
      for (let cb of callbacks) {
          this.cb[cb.name] = cb;
      }
      let check=(key) =>        {
        if (!(key in this.cbs)) {
            throw new DataPathError(`Missing ${key} callback in DataList`);
        }
      };
    }
     get(api, list, key) {
      return this.cb.get(api, list, key);
    }
     getLength(api, list) {
      this._check("getLength");
      return this.cb.getLength(api, list);
    }
     _check(cb) {
      if (!(cb in this.cb)) {
          throw new DataPathError(cb+" not supported by this list");
      }
    }
     set(api, list, key, val) {
      if (this.cb.set===undefined) {
          list[key] = val;
      }
      else {
        this.cb.set(api, list, key, val);
      }
    }
     getIter(api, list) {
      this._check("getIter");
      return this.cb.getIter(api, list);
    }
     filter(api, list, bitmask) {
      this._check("filter");
      return this.cb.filter(api, list, bitmask);
    }
     getActive(api, list) {
      this._check("getActive");
      return this.cb.getActive(api, list);
    }
     setActive(api, list, key) {
      this._check("setActive");
      this.cb.setActive(api, list, key);
    }
     getKey(api, list, obj) {
      this._check("getKey");
      return this.cb.getKey(api, list, obj);
    }
     getStruct(api, list, key) {
      if (this.cb.getStruct!==undefined) {
          return this.cb.getStruct(api, list, key);
      }
      let obj=this.get(api, list, key);
      if (obj===undefined)
        return undefined;
      return api.getStruct(obj.constructor);
    }
  }
  _ESClass.register(DataList);
  _es6_module.add_class(DataList);
  DataList = _es6_module.add_export('DataList', DataList);
  const StructFlags={NO_UNDO: 1}
  _es6_module.add_export('StructFlags', StructFlags);
  class DataStruct  {
     constructor(members=[], name="unnamed") {
      this.members = [];
      this.name = name;
      this.pathmap = {};
      this.flag = 0;
      for (let m of members) {
          this.add(m);
      }
    }
     copy() {
      let ret=new DataStruct();
      ret.name = this.name;
      ret.flag = this.flag;
      for (let m of this.members) {
          let m2=m.copy();
          if (m2.type===DataTypes.PROP) {
              m2.data = m2.data.copy();
          }
          ret.add(m2);
      }
      return ret;
    }
     dynamicStruct(path, apiname, uiname, default_struct=undefined) {
      let ret=default_struct ? default_struct : new DataStruct();
      let dpath=new DataPath(path, apiname, ret, DataTypes.DYNAMIC_STRUCT);
      this.add(dpath);
      return ret;
    }
     struct(path, apiname, uiname, existing_struct=undefined) {
      let ret=existing_struct ? existing_struct : new DataStruct();
      let dpath=new DataPath(path, apiname, ret, DataTypes.STRUCT);
      this.add(dpath);
      return ret;
    }
     color3(path, apiname, uiname, description) {
      let ret=this.vec3(path, apiname, uiname, description);
      ret.data.subtype = toolprop.PropSubTypes.COLOR;
      ret.range(0, 1);
      ret.simpleSlider();
      return ret;
    }
     color4(path, apiname, uiname, description) {
      let ret=this.vec4(path, apiname, uiname, description);
      ret.data.subtype = toolprop.PropSubTypes.COLOR;
      ret.range(0, 1);
      ret.simpleSlider();
      return ret;
    }
     arrayList(path, apiname, structdef, uiname, description) {
      let ret=this.list(path, apiname, [function getIter(api, list) {
        return list[Symbol.iterator]();
      }, function getLength(api, list) {
        return list.length;
      }, function get(api, list, key) {
        return list[key];
      }, function set(api, list, key, val) {
        if (typeof key==="string") {
            key = parseInt(key);
        }
        if (key<0||key>=list.length) {
            throw new DataPathError("Invalid index "+key);
        }
        list[key] = val;
        window.redraw_viewport();
      }, function getKey(api, list, obj) {
        return list.indexOf(obj);
      }, function getStruct(api, list, key) {
        return structdef;
      }]);
      return ret;
    }
     vectorList(size, path, apiname, uiname, description) {
      let type;
      switch (size) {
        case 2:
          type = toolprop.Vec2Property;
          break;
        case 3:
          type = toolprop.Vec3Property;
        case 4:
          type = toolprop.Vec4Property;
      }
      if (type===undefined) {
          throw new DataPathError("Invalid size for vectorList; expected 2 3 or 4");
      }
      let prop=new type(undefined, apiname, uiname, description);
      let pstruct=new DataStruct(undefined, "Vector");
      pstruct.vec3("", "co", "Coords", "Coordinates");
      let ret=this.list(path, apiname, [function getIter(api, list) {
        return list[Symbol.iterator]();
      }, function getLength(api, list) {
        return list.length;
      }, function get(api, list, key) {
        return list[key];
      }, function set(api, list, key, val) {
        if (typeof key=="string") {
            key = parseInt(key);
        }
        if (key<0||key>=list.length) {
            throw new DataPathError("Invalid index "+key);
        }
        list[key] = val;
        window.redraw_viewport();
      }, function getKey(api, list, obj) {
        return list.indexOf(obj);
      }, function getStruct(api, list, key) {
        return pstruct;
      }]);
      return ret;
    }
     bool(path, apiname, uiname, description) {
      let prop=new toolprop.BoolProperty(undefined, apiname, uiname, description);
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     vec2(path, apiname, uiname, description) {
      let prop=new toolprop.Vec2Property(undefined, apiname, uiname, description);
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     vec3(path, apiname, uiname, description) {
      let prop=new toolprop.Vec3Property(undefined, apiname, uiname, description);
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     vec4(path, apiname, uiname, description) {
      let prop=new toolprop.Vec4Property(undefined, apiname, uiname, description);
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     float(path, apiname, uiname, description) {
      let prop=new toolprop.FloatProperty(0, apiname, uiname, description);
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     textblock(path, apiname, uiname, description) {
      let prop=new toolprop.StringProperty(undefined, apiname, uiname, description);
      prop.multiLine = true;
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     string(path, apiname, uiname, description) {
      let prop=new toolprop.StringProperty(undefined, apiname, uiname, description);
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     int(path, apiname, uiname, description, prop=undefined) {
      if (!prop) {
          prop = new toolprop.IntProperty(0, apiname, uiname, description);
      }
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     curve1d(path, apiname, uiname, description) {
      let prop=new toolprop.Curve1DProperty(undefined);
      prop.apiname = apiname;
      prop.uiname = uiname;
      prop.description = description;
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     enum(path, apiname, enumdef, uiname, description) {
      let prop;
      if (__instance_of(enumdef, toolprop.EnumProperty)) {
          prop = enumdef;
      }
      else {
        prop = new toolprop.EnumProperty(undefined, enumdef, apiname, uiname, description);
      }
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     list(path, apiname, funcs) {
      let array=new DataList(funcs);
      let dpath=new DataPath(path, apiname, array);
      dpath.type = DataTypes.ARRAY;
      this.add(dpath);
      return dpath;
    }
     flags(path, apiname, enumdef, uiname, description) {
      let prop;
      if (enumdef===undefined||!(__instance_of(enumdef, toolprop.ToolProperty))) {
          prop = new toolprop.FlagProperty(undefined, enumdef, apiname, uiname, description);
      }
      else {
        prop = enumdef;
      }
      let dpath=new DataPath(path, apiname, prop);
      this.add(dpath);
      return dpath;
    }
     remove(m) {
      if (!(m.apiname in this.pathmap)) {
          throw new Error("Member not in struct "+m.apiname);
      }
      delete this.pathmap[m.apiname];
      this.members.remove(m);
    }
     add(m) {
      if (m.apiname in this.pathmap) {
          console.warn("Overriding existing member in datapath struct", m.apiname);
          this.remove(this.pathmap[m.apiname]);
      }
      this.members.push(m);
      m.parent = this;
      this.pathmap[m.apiname] = m;
      return this;
    }
  }
  _ESClass.register(DataStruct);
  _es6_module.add_class(DataStruct);
  DataStruct = _es6_module.add_export('DataStruct', DataStruct);
  let _map_struct_idgen=1;
  let _map_structs={}
  window._debug__map_structs = _map_structs;
  let _dummypath=new DataPath();
  let DummyIntProperty=new IntProperty();
  const CLS_API_KEY="__dp_map_id";
  class DataAPI extends ModelInterface {
     constructor() {
      super();
      this.rootContextStruct = undefined;
    }
    get  list() {
      return undefined;
    }
     setRoot(sdef) {
      this.rootContextStruct = sdef;
    }
     hasStruct(cls) {
      return cls.hasOwnProperty(CLS_API_KEY);
    }
     getStruct(cls) {
      return this.mapStruct(cls, false);
    }
     mergeStructs(dest, src) {
      for (let m of src.members) {
          dest.add(m.copy());
      }
    }
     inheritStruct(cls, parent, auto_create_parent=false) {
      let st=this.mapStruct(parent, auto_create_parent);
      if (st===undefined) {
          throw new Error("parent has no struct definition");
      }
      st = st.copy();
      st.name = cls.name;
      this._addClass(cls, st);
      return st;
    }
     _addClass(cls, dstruct) {
      let key=_map_struct_idgen++;
      cls[CLS_API_KEY] = key;
      _map_structs[key] = dstruct;
    }
     mapStruct(cls, auto_create=true) {
      let key;
      if (!cls.hasOwnProperty(CLS_API_KEY)) {
          key = undefined;
      }
      else {
        key = cls[CLS_API_KEY];
      }
      if (key===undefined&&auto_create) {
          let dstruct=new DataStruct(undefined, cls.name);
          this._addClass(cls, dstruct);
          return dstruct;
      }
      else 
        if (key===undefined) {
          throw new Error("class does not have a struct definition: "+cls.name);
      }
      return _map_structs[key];
    }
     pushReportContext(name) {
      pushReportName(name);
    }
     popReportContext() {
      popReportName();
    }
     massSetProp(ctx, massSetPath, value) {
      for (let path of this.resolveMassSetPaths(ctx, massSetPath)) {
          this.setValue(ctx, path, value);
      }
    }
     resolveMassSetPaths(ctx, massSetPath) {
      let start=massSetPath.search("{");
      let end=massSetPath.search("}");
      if (start<0||end<0) {
          throw new DataPathError("Invalid mass set datapath: "+massSetPath);
          return ;
      }
      let prefix=massSetPath.slice(0, start-1);
      let filter=massSetPath.slice(start+1, end);
      let suffix=massSetPath.slice(end+2, massSetPath.length);
      let rdef=this.resolvePath(ctx, prefix);
      if (!(__instance_of(rdef.prop, DataList))) {
          throw new DataPathError("massSetPath expected a path resolving to a DataList: "+massSetPath);
      }
      let paths=[];
      let list=rdef.prop;
      function applyFilter(obj) {
        let $=obj;
        return eval(filter);
      }
      for (let obj of list.getIter(this, rdef.value)) {
          if (!applyFilter(obj)) {
              continue;
          }
          let key=""+list.getKey(this, rdef.value, obj);
          let path=`${prefix}[${key}]${suffix}`;
          paths.push(path);
      }
      return paths;
    }
     resolvePath(ctx, inpath, ignoreExistence=false) {
      try {
        return this.resolvePath_intern(ctx, inpath, ignoreExistence);
      }
      catch (error) {
          if (!(__instance_of(error, DataPathError))) {
              util.print_stack(error);
          }
          if (cconst.DEBUG.datapaths) {
              util.print_stack(error);
          }
          report("bad path "+inpath);
          return undefined;
      }
    }
     resolvePath_intern(ctx, inpath, ignoreExistence=false) {
      let p=pathParser;
      inpath = inpath.replace("==", "=");
      p.input(inpath);
      let dstruct=this.rootContextStruct;
      let obj=ctx;
      let lastobj=ctx;
      let subkey;
      let lastobj2=undefined;
      let lastkey=undefined;
      let prop=undefined;
      function p_key() {
        let t=p.peeknext();
        if (t.type==="NUM"||t.type==="STRLIT") {
            p.next();
            return t.value;
        }
        else {
          throw new PUTLParseError("Expected list key");
        }
      }
      let _i=0;
      while (!p.at_end()) {
        let key=p.expect("ID");
        let dpath=dstruct.pathmap[key];
        if (dpath===undefined) {
            if (prop!==undefined&&__instance_of(prop, DataList)&&key==="length") {
                prop.getLength(this, obj);
                key = "length";
                prop = DummyIntProperty;
                prop.name = "length";
                prop.flag = PropFlags.READ_ONLY;
                dpath = _dummypath;
                dpath.type = DataTypes.PROP;
                dpath.data = prop;
                dpath.struct = dpath.parent = dstruct;
                dpath.flag = DataFlags.READ_ONLY;
                dpath.path = "length";
            }
            else 
              if (prop!==undefined&&__instance_of(prop, DataList)&&key==="active") {
                let act=prop.getActive(this, obj);
                if (act===undefined&&!ignoreExistence) {
                    throw new DataPathError("no active elem ent for list");
                }
                let actkey=obj!==undefined&&act!==undefined ? prop.getKey(this, obj, act) : undefined;
                dstruct = prop.getStruct(this, obj, actkey);
                if (dstruct===undefined) {
                    throw new DataPathError("couldn't get data type for "+inpath+"'s element '"+key+"'");
                }
                _dummypath.parent = dpath;
                dpath = _dummypath;
                lastobj = obj;
                obj = act;
                dpath.type = DataTypes.STRUCT;
                dpath.data = dstruct;
                dpath.path = key;
                p.optional("DOT");
                continue;
            }
            else {
              throw new DataPathError(inpath+": unknown property "+key);
            }
        }
        if (dpath.type===DataTypes.STRUCT) {
            dstruct = dpath.data;
        }
        else 
          if (dpath.type===DataTypes.DYNAMIC_STRUCT) {
            let ok=false;
            if (obj!==undefined) {
                let obj2=obj[dpath.path];
                if (obj2!==undefined) {
                    dstruct = this.mapStruct(obj2.constructor, false);
                }
                else {
                  dstruct = dpath.data;
                }
                if (dstruct===undefined) {
                    dstruct = dpath.data;
                }
                ok = dstruct!==undefined;
            }
            if (!ok) {
                throw new DataPathError("dynamic struct error for path: "+inpath);
            }
        }
        else {
          prop = dpath.data;
        }
        if (dpath.path.search(/\./)>=0) {
            let keys=dpath.path.split(/\./);
            for (let key of keys) {
                lastobj2 = lastobj;
                lastobj = obj;
                lastkey = key;
                if (obj===undefined&&!ignoreExistence) {
                    throw new DataPathError("no data for "+inpath);
                }
                else 
                  if (obj!==undefined) {
                    obj = obj[key.trim()];
                }
            }
        }
        else {
          lastobj2 = lastobj;
          lastobj = obj;
          lastkey = dpath.path;
          if (obj===undefined&&!ignoreExistence) {
              throw new DataPathError("no data for "+inpath);
          }
          else 
            if (obj!==undefined&&dpath.path!=="") {
              obj = obj[dpath.path];
          }
        }
        let t=p.peeknext();
        if (t===undefined) {
            break;
        }
        if (t.type==="DOT") {
            p.next();
        }
        else 
          if (t.type==="EQUALS"&&prop!==undefined&&(prop.type&(PropTypes.ENUM|PropTypes.FLAG))) {
            p.expect("EQUALS");
            let t2=p.peeknext();
            let type=t2&&t2.type==="ID" ? "ID" : "NUM";
            let val=p.expect(type);
            let val1=val;
            if (typeof val=="string") {
                val = prop.values[val];
            }
            if (val===undefined) {
                throw new DataPathError("unknown value "+val1);
            }
            if (val in prop.keys) {
                subkey = prop.keys[val];
            }
            key = dpath.path;
            obj = !!(lastobj[key]==val);
        }
        else 
          if (t.type==="AND"&&prop!==undefined&&(prop.type&(PropTypes.ENUM|PropTypes.FLAG))) {
            p.expect("AND");
            let t2=p.peeknext();
            let type=t2&&t2.type==="ID" ? "ID" : "NUM";
            let val=p.expect(type);
            let val1=val;
            if (typeof val=="string") {
                val = prop.values[val];
            }
            if (val===undefined) {
                throw new DataPathError("unknown value "+val1);
            }
            if (val in prop.keys) {
                subkey = prop.keys[val];
            }
            key = dpath.path;
            obj = !!(lastobj[key]&val);
        }
        else 
          if (t.type==="LSBRACKET"&&prop!==undefined&&(prop.type&(PropTypes.ENUM|PropTypes.FLAG))) {
            p.expect("LSBRACKET");
            let t2=p.peeknext();
            let type=t2&&t2.type==="ID" ? "ID" : "NUM";
            let val=p.expect(type);
            let val1=val;
            if (typeof val=="string") {
                val = prop.values[val];
            }
            if (val===undefined) {
                console.warn(inpath, prop.values, val1, prop);
                throw new DataPathError("unknown value "+val1);
            }
            if (val in prop.keys) {
                subkey = prop.keys[val];
            }
            let bitfield;
            key = dpath.path;
            if (!(prop.flag&PropFlags.USE_CUSTOM_GETSET)) {
                bitfield = lastobj[key];
            }
            else {
              prop.dataref = lastobj;
              prop.datapath = inpath;
              prop.ctx = ctx;
              bitfield = prop.getValue();
            }
            if (lastobj===undefined&&!ignoreExistence) {
                throw new DataPathError("no data for path "+inpath);
            }
            else 
              if (lastobj!==undefined) {
                if (prop.type===PropTypes.ENUM) {
                    obj = !!(bitfield==val);
                }
                else {
                  obj = !!(bitfield&val);
                }
            }
            p.expect("RSBRACKET");
        }
        else 
          if (t.type==="LSBRACKET"&&prop!==undefined&&isVecProperty(prop)) {
            p.expect("LSBRACKET");
            let num=p.expect("NUM");
            p.expect("RSBRACKET");
            subkey = num;
            lastobj = obj;
            obj = obj[num];
        }
        else 
          if (t.type==="LSBRACKET") {
            p.expect("LSBRACKET");
            if (lastobj&&lastkey&&typeof lastkey==="string"&&lastkey.length>0) {
                lastobj = lastobj[lastkey];
            }
            lastkey = p_key();
            p.expect("RSBRACKET");
            if (!(__instance_of(prop, DataList))) {
                throw new DataPathError("bad property, not a list");
            }
            obj = prop.get(this, lastobj, lastkey);
            dstruct = prop.getStruct(this, lastobj, lastkey);
            if (p.peeknext()!==undefined&&p.peeknext().type==="DOT") {
                p.next();
            }
        }
        if (_i++>1000) {
            console.warn("infinite loop in resolvePath parser");
            break;
        }
      }
      return {parent: lastobj2, 
     obj: lastobj, 
     value: obj, 
     key: lastkey, 
     dstruct: dstruct, 
     prop: prop, 
     subkey: subkey}
    }
     resolvePathOld2(ctx, path) {
      let splitchars=new Set([".", "[", "]", "=", "&"]);
      let subkey=undefined;
      path = path.replace(/\=\=/g, "=");
      path = "."+this.prefix+path;
      let p=[""];
      for (let i=0; i<path.length; i++) {
          let s=path[i];
          if (splitchars.has(s)) {
              if (s!=="]") {
                  p.push(s);
              }
              p.push("");
              continue;
          }
          p[p.length-1]+=s;
      }
      for (let i=0; i<p.length; i++) {
          p[i] = p[i].trim();
          if (p[i].length===0) {
              p.remove(p[i]);
              i--;
          }
          let c=parseInt(p[i]);
          if (!isNaN(c)) {
              p[i] = c;
          }
      }
      let i=0;
      let parent1, obj=ctx, parent2;
      let key=undefined;
      let dstruct=undefined;
      let arg=undefined;
      let type="normal";
      let retpath=p;
      let prop;
      let lastkey=key, a;
      let apiname=key;
      while (i<p.length-1) {
        lastkey = key;
        apiname = key;
        if (dstruct!==undefined&&dstruct.pathmap[lastkey]) {
            let dpath=dstruct.pathmap[lastkey];
            apiname = dpath.apiname;
        }
        let a=p[i];
        let b=p[i+1];
        if (a==="[") {
            let ok=false;
            key = b;
            prop = undefined;
            if (dstruct!==undefined&&dstruct.pathmap[lastkey]) {
                let dpath=dstruct.pathmap[lastkey];
                if (dpath.type===DataTypes.PROP) {
                    prop = dpath.data;
                }
            }
            if (prop!==undefined&&(prop.type===PropTypes.ENUM||prop.type===PropTypes.FLAG)) {
                util.console.context("api").log("found flag/enum property");
                ok = true;
            }
            if (ok) {
                if (isNaN(parseInt(key))) {
                    key = prop.values[key];
                }
                else 
                  if (typeof key=="int") {
                    key = parseInt(key);
                }
                let value=obj;
                if (typeof value=="string") {
                    value = prop.values[key];
                }
                if (prop.type===PropTypes.ENUM) {
                    value = !!(value==key);
                }
                else {
                  value = !!(value&key);
                }
                if (key in prop.keys) {
                    subkey = prop.keys[key];
                }
                obj = value;
                i++;
                continue;
            }
        }
        if (dstruct!==undefined&&dstruct.pathmap[lastkey]) {
            let dpath=dstruct.pathmap[lastkey];
            if (dpath.type==DataTypes.PROP) {
                prop = dpath.data;
            }
        }
        if (a==="."||a==="[") {
            key = b;
            parent2 = parent1;
            parent1 = obj;
            obj = obj[b];
            if (obj===undefined||obj===null) {
                break;
            }
            if (typeof obj=="object") {
                dstruct = this.mapStruct(obj.constructor, false);
            }
            i+=2;
            continue;
        }
        else 
          if (a==="&") {
            obj&=b;
            arg = b;
            if (b in prop.keys) {
                subkey = prop.keys[b];
            }
            i+=2;
            type = "flag";
            continue;
        }
        else 
          if (a==="=") {
            obj = obj==b;
            arg = b;
            if (b in prop.keys) {
                subkey = prop.keys[b];
            }
            i+=2;
            type = "enum";
            continue;
        }
        else {
          throw new DataPathError("bad path "+path);
        }
        i++;
      }
      if (lastkey!==undefined&&dstruct!==undefined&&dstruct.pathmap[lastkey]) {
          let dpath=dstruct.pathmap[key];
          apiname = dpath.apiname;
      }
      if (dstruct!==undefined&&dstruct.pathmap[key]) {
          let dpath=dstruct.pathmap[key];
          if (dpath.type==DataTypes.PROP) {
              prop = dpath.data;
          }
      }
      return {parent: parent2, 
     obj: parent1, 
     value: obj, 
     key: key, 
     dstruct: dstruct, 
     subkey: subkey, 
     prop: prop, 
     arg: arg, 
     type: type, 
     _path: retpath}
    }
     resolvePathold(ctx, path) {
      path = this.prefix+path;
      path = path.replace(/\[/g, ".").replace(/\]/g, "").trim().split(".");
      let parent1, obj=ctx, parent2;
      let key=undefined;
      let dstruct=undefined;
      for (let c of path) {
          let c2=parseInt(c);
          if (!isNaN(c2)) {
              c = c2;
          }
          parent2 = parent1;
          parent1 = obj;
          key = c;
          if (typeof obj=="number") {
              obj = obj&c;
              break;
          }
          obj = obj[c];
          if (typeof obj=="object") {
              dstruct = this.mapStruct(obj.constructor, false);
          }
      }
      let prop;
      if (dstruct!==undefined&&dstruct.pathmap[key]) {
          let dpath=dstruct.pathmap[key];
          if (dpath.type==DataTypes.PROP) {
              prop = dpath.data;
          }
      }
      return {parent: parent2, 
     obj: parent1, 
     value: obj, 
     key: key, 
     dstruct: dstruct, 
     prop: prop}
    }
     getToolDef(path) {
      let cls=this.parseToolPath(path);
      if (cls===undefined) {
          throw new DataPathError("unknown path \""+path+"\"");
      }
      return cls.tooldef();
    }
     getToolPathHotkey(ctx, path) {
      try {
        return this.getToolPathHotkey_intern(ctx, path);
      }
      catch (error) {
          print_stack(error);
          util.console.context("api").log("failed to fetch tool path: "+path);
          return undefined;
      }
    }
     getToolPathHotkey_intern(ctx, path) {
      let screen=ctx.screen;
      function searchKeymap(keymap) {
        if (keymap===undefined) {
            return undefined;
        }
        for (let hk of keymap) {
            if (typeof hk.action=="string"&&hk.action==path) {
                return hk.buildString();
            }
        }
      }
      if (screen.sareas.length===0) {
          return searchKeymap(screen.keymap);
      }
      let areacls=screen.sareas[0].area.constructor;
      let area=areacls.getActiveArea();
      for (let keymap of area.getKeyMaps()) {
          let ret=searchKeymap(keymap);
          if (ret!==undefined) {
              return ret;
          }
      }
      for (let sarea of screen.sareas) {
          if (!sarea.area)
            continue;
          for (let keymap of sarea.area.getKeyMaps()) {
              let ret=searchKeymap(keymap);
              if (ret) {
                  return ret;
              }
          }
      }
      return this.keymap ? searchKeymap(this.keymap) : false;
    }
     parseToolPath(path) {
      try {
        return parseToolPath(path).toolclass;
      }
      catch (error) {
          if (__instance_of(error, DataPathError)) {
              console.warn("warning, bad tool path", path);
              return undefined;
          }
          else {
            throw error;
          }
      }
    }
     parseToolArgs(path) {
      return parseToolPath(path).args;
    }
     createTool(ctx, path, inputs={}) {
      let cls;
      let args;
      if (typeof path=="string"||__instance_of(path, String)) {
          let tpath=parseToolPath(path);
          cls = tpath.toolclass;
          args = tpath.args;
      }
      else {
        cls = path;
        args = {};
      }
      let tool=cls.invoke(ctx, args);
      if (inputs!==undefined) {
          for (let k in inputs) {
              if (!(k in tool.inputs)) {
                  console.warn(cls.tooldef().uiname+": Unknown tool property \""+k+"\"");
                  continue;
              }
              tool.inputs[k].setValue(inputs[k]);
          }
      }
      return tool;
    }
    static  toolRegistered(cls) {
      return ToolOp.isRegistered(cls);
    }
    static  registerTool(cls) {
      console.warn("Outdated function simple_controller.DataAPI.registerTool called");
      return ToolOp.register(cls);
    }
  }
  _ESClass.register(DataAPI);
  _es6_module.add_class(DataAPI);
  DataAPI = _es6_module.add_export('DataAPI', DataAPI);
  function registerTool(cls) {
    return DataAPI.registerTool(cls);
  }
  registerTool = _es6_module.add_export('registerTool', registerTool);
  function initSimpleController() {
    initToolPaths();
  }
  initSimpleController = _es6_module.add_export('initSimpleController', initSimpleController);
  var DataPathSetOp=es6_import_item(_es6_module, './controller_ops.js', 'DataPathSetOp');
  let dpt=DataPathSetOp;
  function getDataPathToolOp() {
    return dpt;
  }
  getDataPathToolOp = _es6_module.add_export('getDataPathToolOp', getDataPathToolOp);
  function setDataPathToolOp(cls) {
    ToolOp.unregister(DataPathSetOp);
    if (!ToolOp.isRegistered(cls)) {
        ToolOp.register(cls);
    }
    dpt = cls;
  }
  setDataPathToolOp = _es6_module.add_export('setDataPathToolOp', setDataPathToolOp);
  setImplementationClass(DataAPI);
}, '/dev/fairmotion/src/path.ux/scripts/controller/simple_controller.js');
es6_module_define('anim', ["../util/math.js", "./ui_theme.js", "../util/util.js", "../curve/curve1d.js", "../util/vectormath.js"], function _anim_module(_es6_module) {
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var Matrix4=es6_import_item(_es6_module, '../util/vectormath.js', 'Matrix4');
  var Quat=es6_import_item(_es6_module, '../util/vectormath.js', 'Quat');
  var Vector3=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector4');
  var math=es6_import(_es6_module, '../util/math.js');
  var color2css=es6_import_item(_es6_module, './ui_theme.js', 'color2css');
  var css2color=es6_import_item(_es6_module, './ui_theme.js', 'css2color');
  var parsepx=es6_import_item(_es6_module, './ui_theme.js', 'parsepx');
  var Curve1D=es6_import_item(_es6_module, '../curve/curve1d.js', 'Curve1D');
  var getCurve=es6_import_item(_es6_module, '../curve/curve1d.js', 'getCurve');
  var util=es6_import(_es6_module, '../util/util.js');
  class Task  {
     constructor(taskcb) {
      this.task = taskcb;
      this.start = util.time_ms();
      this.done = false;
    }
  }
  _ESClass.register(Task);
  _es6_module.add_class(Task);
  class AnimManager  {
     constructor() {
      this.tasks = [];
      this.timer = undefined;
      this.timeOut = 10*1000.0;
    }
     stop() {
      if (this.timer!==undefined) {
          window.clearInterval(this.timer);
          this.timer = undefined;
      }
    }
     add(task) {
      this.tasks.push(new Task(task));
    }
     remove(task) {
      for (let t of this.tasks) {
          if (t.task===task) {
              t.dead = true;
              this.tasks.remove(t);
              return ;
          }
      }
    }
     start() {
      this.timer = window.setInterval(() =>        {
        for (let t of this.tasks) {
            try {
              t.task();
            }
            catch (error) {
                t.done = true;
                util.print_stack(error);
            }
            if (util.time_ms()-t.start>this.timeOut) {
                t.dead = true;
            }
        }
        for (let i=0; i<this.tasks.length; i++) {
            if (this.tasks[i].done) {
                let t=this.tasks[i];
                this.tasks.remove(t);
                i--;
                try {
                  if (t.task.onend) {
                      t.task.onend();
                  }
                }
                catch (error) {
                    util.print_stack(error);
                }
            }
        }
      }, 1000/40.0);
    }
  }
  _ESClass.register(AnimManager);
  _es6_module.add_class(AnimManager);
  AnimManager = _es6_module.add_export('AnimManager', AnimManager);
  const manager=new AnimManager();
  _es6_module.add_export('manager', manager);
  manager.start();
  class AbstractCommand  {
     constructor() {
      this.cbs = [];
      this.end_cbs = [];
    }
     start(animator, done) {

    }
     exec(animator, done) {

    }
  }
  _ESClass.register(AbstractCommand);
  _es6_module.add_class(AbstractCommand);
  AbstractCommand = _es6_module.add_export('AbstractCommand', AbstractCommand);
  class WaitCommand extends AbstractCommand {
     constructor(ms) {
      super();
      this.ms = ms;
    }
     start(animator, done) {
      this.time = animator.time;
    }
     exec(animator, done) {
      if (animator.time-this.time>this.ms) {
          done();
      }
    }
  }
  _ESClass.register(WaitCommand);
  _es6_module.add_class(WaitCommand);
  WaitCommand = _es6_module.add_export('WaitCommand', WaitCommand);
  class GoToCommand extends AbstractCommand {
     constructor(obj, key, value, time, curve="ease") {
      super();
      this.object = obj;
      this.key = key;
      this.value = value;
      this.ms = time;
      if (typeof curve==="string") {
          this.curve = new (getCurve(curve))();
      }
      else {
        this.curve = curve;
      }
    }
     start(animator, done) {
      this.time = animator.time;
      let value=this.object[this.key];
      if (Array.isArray(value)) {
          this.startValue = util.list(value);
      }
      else {
        this.startValue = value;
      }
    }
     exec(animator, done) {
      let t=animator.time-this.time;
      let ms=this.ms;
      if (t>ms) {
          done();
          t = ms;
      }
      t/=ms;
      t = this.curve.evaluate(t);
      if (Array.isArray(this.startValue)) {
          let value=this.object[this.key];
          for (let i=0; i<this.startValue.length; i++) {
              if (value[i]===undefined||this.value[i]===undefined) {
                  continue;
              }
              value[i] = this.startValue[i]+(this.value[i]-this.startValue[i])*t;
          }
      }
      else {
        this.object[this.key] = this.startValue+(this.value-this.startValue)*t;
      }
    }
  }
  _ESClass.register(GoToCommand);
  _es6_module.add_class(GoToCommand);
  GoToCommand = _es6_module.add_export('GoToCommand', GoToCommand);
  class SetCommand extends AbstractCommand {
     constructor(obj, key, val) {
      super();
      this.object = obj;
      this.key = key;
      this.value = val;
    }
     start(animator, done) {
      this.object[key] = val;
      done();
    }
  }
  _ESClass.register(SetCommand);
  _es6_module.add_class(SetCommand);
  SetCommand = _es6_module.add_export('SetCommand', SetCommand);
  class Command  {
     constructor(type, args) {
      this.args = args;
      this.cbs = [];
    }
  }
  _ESClass.register(Command);
  _es6_module.add_class(Command);
  Command = _es6_module.add_export('Command', Command);
  class Animator  {
     constructor(owner, method="update") {
      this.on_tick = this.on_tick.bind(this);
      this.on_tick.onend = () =>        {
        if (this.onend) {
            this.onend();
        }
      };
      this.commands = [];
      this.owner = owner;
      this._done = false;
      this.method = method;
      this.onend = null;
      this.first = true;
      this.time = 0.0;
      this.last = util.time_ms();
      this.bind(owner);
    }
     bind(owner) {
      this._done = false;
      this.owner = owner;
      manager.add(this.on_tick);
    }
     wait(ms) {
      this.commands.push(new WaitCommand(ms));
      return this;
    }
     goto(key, val, time, curve="ease") {
      let cmd=new GoToCommand(this.owner, key, val, time, curve);
      this.commands.push(cmd);
      return this;
    }
     set(key, val, time) {
      let cmd=new SetCommand(this.owner, key, val);
      this.commands.push(cmd);
      return this;
    }
     while(cb) {
      this.commands[this.commands.length-1].cbs.push(cb);
      return this;
    }
     then(cb) {
      this.commands[this.commands.length-1].end_cbs.push(cb);
      return this;
    }
     end() {
      if (this._done) {
          return ;
      }
      this._done = true;
      manager.remove(this.on_tick);
      if (this.onend) {
          this.onend();
      }
    }
     on_tick() {
      if (this._done) {
          throw new Error("animation wasn't properly cleaned up");
      }
      let dt=util.time_ms()-this.last;
      this.time+=dt;
      this.last = util.time_ms();
      if (this.commands.length===0) {
          this.end();
          return ;
      }
      let cmd=this.commands[0];
      let done=false;
      function donecb() {
        done = true;
      }
      if (this.first) {
          this.first = false;
          cmd.start(this, donecb);
      }
      try {
        cmd.exec(this, donecb);
      }
      catch (error) {
          done = true;
          util.print_stack(error);
      }
      for (let cb of this.commands[0].cbs) {
          try {
            cb();
          }
          catch (error) {
              util.print_stack(error);
          }
      }
      if (done) {
          for (let cb of this.commands[0].end_cbs) {
              try {
                cb();
              }
              catch (error) {
                  util.print_stack(error);
              }
          }
          while (this.commands.length>0) {
            this.commands.shift();
            done = false;
            if (this.commands.length>0) {
                this.commands[0].start(this, donecb);
            }
            if (!done) {
                break;
            }
          }
      }
    }
  }
  _ESClass.register(Animator);
  _es6_module.add_class(Animator);
  Animator = _es6_module.add_export('Animator', Animator);
}, '/dev/fairmotion/src/path.ux/scripts/core/anim.js');
es6_module_define('aspect', [], function _aspect_module(_es6_module) {
  let exclude=new Set(["toString", "constructor", "prototype", "__proto__", "toLocaleString", "hasOwnProperty", "shadow"]);
  let UIBase=undefined;
  function _setUIBase(uibase) {
    UIBase = uibase;
  }
  _setUIBase = _es6_module.add_export('_setUIBase', _setUIBase);
  function initAspectClass(object, blacklist) {
    if (blacklist===undefined) {
        blacklist = new Set();
    }
    let cls=object.constructor;
    let keys=[];
    let p=object.__proto__;
    while (p) {
      keys = keys.concat(Reflect.ownKeys(p));
      p = p.__proto__;
    }
    keys = new Set(keys);
    for (let k of keys) {
        let v;
        if (typeof k==="string"&&k.startsWith("_")) {
            continue;
        }
        if (k==="constructor") {
            continue;
        }
        if (blacklist.has(k)||exclude.has(k)) {
            continue;
        }
        try {
          v = object[k];
        }
        catch (error) {
            continue;
        }
        if (typeof v!=="function") {
            continue;
        }
        AfterAspect.bind(object, k);
    }
  }
  initAspectClass = _es6_module.add_export('initAspectClass', initAspectClass);
  class AfterAspect  {
     constructor(owner, key) {
      this.owner = owner;
      this.key = key;
      this.chain = [[owner[key], false]];
      this.chain2 = [[owner[key], false]];
      let this2=this;
      let method=this._method = function () {
        let chain=this2.chain;
        let chain2=this2.chain2;
        chain2.length = chain.length;
        for (let i=0; i<chain.length; i++) {
            chain2[i] = chain[i];
        }
        for (let i=0; i<chain2.length; i++) {
            let cb=chain2[i][0], node=chain2[i][1], once=chain2[i][2];
            if (node) {
                let isDead=!node.isConnected;
                if (__instance_of(node, UIBase)) {
                    isDead = isDead||node.isDead();
                }
                if (isDead) {
                    console.warn("pruning dead AfterAspect callback", node);
                    chain.remove(chain2[i]);
                    continue;
                }
            }
            if (once&&chain.indexOf(chain2[i])>=0) {
                chain.remove(chain2[i]);
            }
            if (cb&&cb.apply) {
                method.value = cb.apply(this, arguments);
            }
        }
        let ret=method.value;
        method.value = undefined;
        return ret;
      };
      this._method_bound = false;
      method.after = this.after.bind(this);
      method.once = this.once.bind(this);
      method.remove = this.remove.bind(this);
      owner[key].after = this.after.bind(this);
      owner[key].once = this.once.bind(this);
      owner[key].remove = this.remove.bind(this);
    }
    static  bind(owner, key) {
      return new AfterAspect(owner, key);
    }
     remove(cb) {
      for (let item of this.chain) {
          if (item[0]===cb) {
              this.chain.remove(item);
              return true;
          }
      }
      return false;
    }
     once(cb, node) {
      return this.after(cb, node, true);
    }
     _checkbind() {
      if (!this._method_bound) {
          this.owner[this.key] = this._method;
      }
    }
     before(cb, node, once) {
      this._checkbind();
      if (cb===undefined) {
          console.warn("invalid call to .after(); cb was undefined");
          return ;
      }
      this.chain = [[cb, node, once]].concat(this.chain);
    }
     after(cb, node, once) {
      this._checkbind();
      if (cb===undefined) {
          console.warn("invalid call to .after(); cb was undefined");
          return ;
      }
      this.chain.push([cb, node, once]);
    }
  }
  _ESClass.register(AfterAspect);
  _es6_module.add_class(AfterAspect);
  AfterAspect = _es6_module.add_export('AfterAspect', AfterAspect);
}, '/dev/fairmotion/src/path.ux/scripts/core/aspect.js');
es6_module_define('safeobservable', [], function _safeobservable_module(_es6_module) {
  let idgen=0;
  class AbstractObservable  {
    static  observeDefine() {
      return {events: {"mousedown": MouseEvent, 
      "some_integer": IntProperty}}
    }
     stillAlive() {
      throw new Error("implement me");
    }
  }
  _ESClass.register(AbstractObservable);
  _es6_module.add_class(AbstractObservable);
  AbstractObservable = _es6_module.add_export('AbstractObservable', AbstractObservable);
  function _valid(obj) {
    return obj&&(typeof obj==="object"||typeof obj==="function");
  }
  class ObserveManger  {
     constructor() {
      this.subscriberMap = new Map();
      this.subscribeeMap = new Map();
      this.idmap = new WeakMap();
    }
     getId(obj) {
      if (!this.idmap.has(obj)) {
          this.idmap.set(obj, idgen++);
      }
      return this.idmap.get(obj);
    }
     _getEvents(owner) {
      let keys=new Set();
      let p=owner;
      while (p) {
        if (p.observeDefine) {
            let def=p.observeDefine();
            for (let item of def.events) {
                keys.add(item);
            }
        }
        p = p.prototype;
      }
      return keys;
    }
     dispatch(owner, type, data) {
      if (!_valid(owner)) {
          throw new Error("invalid argument to ObserveManger.dispathc");
      }
      let oid=this.getId(owner);
      let list=this.subscribeeMap.get(oid);
      for (let i=0; i<list.length; i++) {
          let item=list[i];
          let cid=item.id, cb=item.callback, isValid=item.isValid;
          if (isValid&&!isValid()) {
              if (this._unsubscribe(oid, type, cid, cb)) {
                  i--;
              }
              continue;
          }
          try {
            cb(data);
          }
          catch (error) {
              util.print_stack(error);
              console.log("event dispatch error for "+type);
          }
      }
    }
     update() {
      for (let cid of this.subscriberMap.keys()) {
          let list=this.subscriberMap.get(cid);
          for (let item of list) {
              let bad=false;
              let oid=item.id;
              try {
                bad = item.isValid&&!item.isValid();
              }
              catch (error) {
                  bad = true;
                  console.log("error in event callback");
              }
              if (bad) {
                  this._unsubscribe(oid, item.type, cid, item.callback);
              }
          }
      }
      for (let oid of this.subscribeeMap.keys()) {
          let list=this.subscriberMap.get(oid);
          for (let item of list) {
              let bad=false;
              let cid=item.id;
              try {
                bad = item.isValid&&!item.isValid();
              }
              catch (error) {
                  bad = true;
                  console.log("error in event callback");
              }
              if (bad) {
                  this._unsubscribe(oid, item.type, cid, item.callback);
              }
          }
      }
    }
     subscribe(owner, type, child, callback, customIsValid=undefined) {
      if (!_valid(owner)||!_valid(child)) {
          throw new Error("invalid arguments to ObserveManager.subscribe");
      }
      if (!owner.constructor.observeDefine) {
          throw new Error("owner is not an observable; no observeDefine");
      }
      let validkeys=this._getEvents(owner);
      if (!validkeys.has(type)) {
          throw new Error("unknown event type "+type);
      }
      let oid=this.getId(owner);
      let cid=this.getId(child);
      let cbid=thi.getId(callback);
      if (!(cid in this.subscriberMap)) {
          this.subscriberMap.set(cid, []);
      }
      if (!(oid in this.subscribeeMap)) {
          this.subscribeeMap.set(oid, []);
      }
      let ref;
      if (typeof child.isValid==="function") {
          ref = child.isValid;
          if (ref===child.prototype.isValid) {
              ref = ref.bind(child);
          }
      }
      if (customIsValid&&ref) {
          let ref2=ref;
          ref = () =>            {
            return ref2&&customIsValid();
          };
      }
      else 
        if (customIsValid) {
          ref = customIsValid;
      }
      this.subscriberMap.get(cid).push({id: oid, 
     type: type, 
     isValid: ref, 
     callback: callback});
      ref = undefined;
      if (owner.isValid) {
          ref = owner.isValid;
          if (ref===owner.prototype.isValid) {
              ref = ref.bind(owner);
          }
      }
      this.subscribeeMap.get(oid).push({id: cid, 
     type: type, 
     callback: callback, 
     isValid: ref});
    }
     has(owner, type, child, callback) {
      if (!_valid(owner)||!_valid(child)) {
          throw new Error("invalid arguments to ObserveManager.has");
      }
    }
     unsubscribe(owner, type, child, callback) {
      if (!_valid(owner)||!_valid(child)) {
          throw new Error("invalid arguments to ObserveManager.unsubscribe");
      }
      let oid=this.getId(owner);
      let cid=this.getId(child);
      return this._unsubscribe(oid, type, cid, callback);
    }
     _unsubscribe(oid, type, cid, callback) {
      let cbid=this.getId(callback);
      if (!this.subscribeeMap.has(oid)||!this.subscriberMap.has(cid)) {
          console.warn("Warning, bad call to ObserveManager.unsubscribe");
      }
      let list=this.subscriberMap.get(cid);
      let found=false;
      for (let item of list.concat([])) {
          if (item.type===type&&item.id===oid&&(!callback||item.callback===callback)) {
              list.remove(item);
              found = true;
          }
      }
      list = this.subscribeeMap.get(oid);
      for (let item of list.concat([])) {
          if (item.type===type&&item.id===cid&&(!callback||item.callback===callback)) {
              list.remove(item);
              found = true;
          }
      }
      return found;
    }
  }
  _ESClass.register(ObserveManger);
  _es6_module.add_class(ObserveManger);
  ObserveManger = _es6_module.add_export('ObserveManger', ObserveManger);
  var manager=new ObserveManger();
  manager = _es6_module.set_default_export('manager', manager);
  
  class Observable extends AbstractObservable {
    static  observeDefine() {
      throw new Error("implement me; see AbstractObservable");
    }
     isValid() {
      return true;
    }
     on(type, child, callback) {
      manager.subscribe(this, type, child, callback);
      return this;
    }
     off(type, child, callback) {
      manager.subscribe(this, type, child, callback);
      return this;
    }
     once(type, child, callback) {
      let i=0;
      manager.subscribe(this, type, child, callback, () =>        {
        return i++>0;
      });
      return this;
    }
    static  mixin(cls) {
      function set(p, key, val) {
        if (p[key]===undefined) {
            p[key] = val;
        }
      }
      set(cls, prototype, "on", this.prototype.on);
      set(cls, prototype, "off", this.prototype.off);
      set(cls, prototype, "once", this.prototype.once);
      set(cls, prototype, "isValid", this.prototype.isValid);
      set(cls, "observeDefine", this.observeDefine);
    }
  }
  _ESClass.register(Observable);
  _es6_module.add_class(Observable);
  Observable = _es6_module.add_export('Observable', Observable);
}, '/dev/fairmotion/src/path.ux/scripts/core/safeobservable.js');
es6_module_define('theme', ["../util/util.js", "./ui_theme.js"], function _theme_module(_es6_module) {
  var CSSFont=es6_import_item(_es6_module, './ui_theme.js', 'CSSFont');
  var util=es6_import(_es6_module, '../util/util.js');
  const DefaultTheme={base: {themeVersion: 0.1, 
    mobileTextSizeMultiplier: 1.0, 
    mobileSizeMultiplier: 1, 
    "oneAxisPadding": 6, 
    "oneAxisMargin": 6, 
    "FocusOutline": "rgba(100, 150, 255, 1.0)", 
    "BasePackFlag": 0, 
    "ScreenBorderOuter": "rgba(120, 120, 120, 1.0)", 
    "ScreenBorderInner": "rgba(170, 170, 170, 1.0)", 
    "ScreenBorderWidth": util.isMobile() ? 5 : 2, 
    "ScreenBorderMousePadding": util.isMobile() ? 6 : 5, 
    "numslider_width": 24, 
    "numslider_height": 24, 
    "defaultWidth": 32, 
    "defaultHeight": 32, 
    "ProgressBarBG": "rgba(110, 110, 110, 1.0)", 
    "ProgressBar": "rgba(75, 175, 255, 1.0)", 
    "NoteBG": "rgba(220, 220, 220, 0.0)", 
    "NoteText": new CSSFont({font: "sans-serif", 
     size: 12, 
     color: "rgba(135, 135, 135, 1.0)", 
     weight: "bold"}), 
    "DefaultPanelBG": "rgba(225, 225, 225, 1.0)", 
    "InnerPanelBG": "rgba(195, 195, 195, 1.0)", 
    "AreaHeaderBG": "rgba(205, 205, 205, 1.0)", 
    "BoxRadius": 12, 
    "BoxMargin": 4, 
    "BoxDrawMargin": 2, 
    "BoxHighlight": "rgba(155, 220, 255, 1.0)", 
    "BoxDepressed": "rgba(130, 130, 130, 1.0)", 
    "BoxBG": "rgba(170, 170, 170, 1.0)", 
    Disabled: {"background-size": "5px 3px", 
     "background-color": "rgb(72, 72, 72)", 
     "border-radius": "15px", 
     BoxBG: "rgb(50, 50, 50)", 
     BoxSubBG: "rgb(50, 50, 50)", 
     BoxSub2BG: "rgb(50, 50, 50)", 
     AreaHeaderBG: "rgb(72, 72, 72)", 
     DefaultPanelBG: "rgb(72, 72, 72)", 
     InnerPanelBG: "rgb(72, 72, 72)"}, 
    "BoxSubBG": "rgba(175, 175, 175, 1.0)", 
    "BoxSub2BG": "rgba(125, 125, 125, 1.0)", 
    "BoxBorder": "rgba(255, 255, 255, 1.0)", 
    "DefaultText": new CSSFont({font: "sans-serif", 
     size: 12, 
     color: "rgba(35, 35, 35, 1.0)", 
     weight: "bold"}), 
    "ToolTipText": new CSSFont({font: "sans-serif", 
     size: 12, 
     color: "rgba(35, 35, 35, 1.0)", 
     weight: "bold"}), 
    "LabelText": new CSSFont({size: 13, 
     color: "rgba(75, 75, 75, 1.0)", 
     font: "sans-serif", 
     weight: "bold"}), 
    "HotkeyText": new CSSFont({size: 12, 
     color: "rgba(130, 130, 130, 1.0)", 
     font: "courier"}), 
    "TitleText": new CSSFont({size: 16, 
     color: "rgba(55, 55, 55, 1.0)", 
     font: "sans-serif", 
     weight: "bold"})}, 
   treeview: {itemIndent: 10, 
    rowHeight: 18}, 
   menu: {MenuBG: "rgba(250, 250, 250, 1.0)", 
    MenuHighlight: "rgba(155, 220, 255, 1.0)", 
    MenuSpacing: 0, 
    MenuText: new CSSFont({size: 12, 
     color: "rgba(25, 25, 25, 1.0)", 
     font: "sans-serif"}), 
    MenuSeparator: `
      width : 100%;
      height : 2px;
      padding : 0px;
      margin : 0px;
      border : none;
      background-color : grey; 
    `, 
    MenuBorder: "1px solid grey"}, 
   tooltip: {"BoxBG": "rgb(245, 245, 245, 1.0)", 
    "BoxBorder": "rgb(145, 145, 145, 1.0)"}, 
   textbox: {"background-color": "rgb(255, 255, 255, 1.0)"}, 
   richtext: {"background-color": "rgb(245, 245, 245)", 
    "DefaultText": new CSSFont({font: "sans-serif", 
     size: 16, 
     color: "rgba(35, 35, 35, 1.0)", 
     weight: "normal"})}, 
   button: {defaultWidth: 100, 
    defaultHeight: 24, 
    BoxMargin: 10}, 
   iconcheck: {}, 
   checkbox: {BoxMargin: 2, 
    CheckSide: "left"}, 
   iconbutton: {}, 
   scrollbars: {color: undefined, 
    color2: undefined, 
    width: undefined, 
    border: undefined, 
    contrast: undefined}, 
   numslider: {DefaultText: new CSSFont({font: "sans-serif", 
     color: "black", 
     size: 16, 
     weight: 'bold'}), 
    defaultWidth: 100, 
    defaultHeight: 29}, 
   curvewidget: {CanvasWidth: 256, 
    CanvasHeight: 256, 
    CanvasBG: "rgba(50, 50, 50, 0.75)"}, 
   numslider_simple: {labelOnTop: false, 
    TitleText: new CSSFont({size: 14}), 
    BoxBG: "rgb(225, 225, 225)", 
    BoxBorder: "rgb(75, 75, 75)", 
    SlideHeight: 10, 
    DefaultWidth: 135, 
    DefaultHeight: 18, 
    BoxRadius: 5, 
    TextBoxWidth: 45}, 
   tabs: {TabStrokeStyle1: "rgba(200, 200, 200, 1.0)", 
    TabStrokeStyle2: "rgba(255, 255, 255, 1.0)", 
    TabInactive: "rgba(150, 150, 150, 1.0)", 
    TabHighlight: "rgba(50, 50, 50, 0.2)", 
    TabText: new CSSFont({size: 18, 
     color: "rgba(35, 35, 35, 1.0)", 
     font: "sans-serif"})}, 
   colorfield: {fieldsize: 32, 
    defaultWidth: 200, 
    defaultHeight: 200, 
    hueheight: 24, 
    colorBoxHeight: 24, 
    circleSize: 4}, 
   panel: {"Background": "rgba(175, 175, 175, 1.0)", 
    "TitleBackground": "rgba(125, 125, 125, 1.0)", 
    "BoxBorder": "rgba(255, 255, 255, 0.0)", 
    "TitleBorder": "rgba(255, 255, 255, 0.0)", 
    "BoxRadius": 5, 
    "BoxLineWidth": 1, 
    "padding-top": 7, 
    "padding-bottom": 5, 
    "border-style": "solid"}, 
   listbox: {DefaultPanelBG: "rgba(230, 230, 230, 1.0)", 
    ListHighlight: "rgba(155, 220, 255, 0.5)", 
    ListActive: "rgba(200, 205, 215, 1.0)", 
    width: 110, 
    height: 200}, 
   colorpickerbutton: {defaultWidth: 100, 
    defaultHeight: 25, 
    defaultFont: "LabelText"}, 
   dropbox: {dropTextBG: "rgba(250, 250, 250, 0.7)", 
    BoxHighlight: "rgba(155, 220, 255, 0.4)", 
    defaultHeight: 24}}
  _es6_module.add_export('DefaultTheme', DefaultTheme);
}, '/dev/fairmotion/src/path.ux/scripts/core/theme.js');
