
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
  let profile_start=(name) =>    {  }
  let profile_end=(name) =>    {  }
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
    profile_start("pack_int");
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
    profile_end("pack_int");
  }
  pack_int = _es6_module.add_export('pack_int', pack_int);
  function pack_short(data, i, lendian) {
    if (lendian===undefined) {
        lendian = false;
    }
    profile_start("pack_short");
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
    profile_end("pack_short");
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
    profile_start("pack_float");
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
    profile_end("pack_float");
  }
  pack_float = _es6_module.add_export('pack_float', pack_float);
  function pack_double(data, f, lendian) {
    profile_start("pack_double");
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
    profile_end("pack_double");
  }
  pack_double = _es6_module.add_export('pack_double', pack_double);
  function pack_vec2(data, vec, lendian) {
    if (lendian===undefined) {
        lendian = false;
    }
    profile_start("pack_vec2");
    pack_float(data, vec[0], lendian);
    pack_float(data, vec[1], lendian);
    profile_end("pack_vec2");
  }
  pack_vec2 = _es6_module.add_export('pack_vec2', pack_vec2);
  function pack_vec3(data, vec, lendian) {
    if (lendian===undefined) {
        lendian = false;
    }
    profile_start("pack_vec3");
    pack_float(data, vec[0], lendian);
    pack_float(data, vec[1], lendian);
    pack_float(data, vec[2], lendian);
    profile_end("pack_vec3");
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
    profile_start("pack_mat4");
    var m=mat.getAsArray();
    for (var i=0; i<16; i++) {
        pack_float(data, m[i], lendian);
    }
    profile_end("pack_mat4");
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
    profile_start("pack_static_string");
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
    profile_end("pack_static_string");
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
    profile_start("pack_string");
    _static_sbuf.length = 0;
    encode_utf8(_static_sbuf, str);
    pack_int(data, _static_sbuf.length);
    for (var i=0; i<_static_sbuf.length; i++) {
        data.push(_static_sbuf[i]);
    }
    profile_end("pack_string");
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
  var $ret_Tbwd_viewport;
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
        $ret_Tbwd_viewport[0][0] = $ret_Tbwd_viewport[0][1] = 0.0;
        $ret_Tbwd_viewport[1][0] = g_app_state.screen.size[0];
        $ret_Tbwd_viewport[1][1] = g_app_state.screen.size[1];
        return $ret_Tbwd_viewport;
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
  var $ret_Tbwd_viewport=[[0, 0], [0, 0]];
  _ESClass.register(RasterState);
  _es6_module.add_class(RasterState);
  RasterState = _es6_module.add_export('RasterState', RasterState);
}, '/dev/fairmotion/src/core/raster.js');


es6_module_define('imageblock', ["../editors/viewport/view2d_editor.js", "../editors/viewport/selectmode.js", "../util/strutils.js", "./lib_api.js", "./struct.js", "../path.ux/scripts/util/vectormath.js", "./toolops_api.js"], function _imageblock_module(_es6_module) {
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
    static  blockDefine() {
      return {typeName: "image", 
     defaultName: "Image", 
     uiName: "Image", 
     accessorName: "images", 
     typeIndex: 8, 
     linkOrder: 0}
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
  DataBlock.register(Image);
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


es6_module_define('image_ops', ["../core/frameset.js", "../core/toolops_api.js", "../core/toolprops.js", "../path.ux/scripts/util/struct.js", "../curve/spline_draw.js", "../core/fileapi/fileapi.js", "../curve/spline.js", "../core/struct.js", "../core/lib_api.js", "../core/imageblock.js", "../config/config.js"], function _image_ops_module(_es6_module) {
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
      return {toolpath: "image.load_image", 
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


es6_module_define('UserSettings', ["./keymap.js", "../datafiles/theme.js", "../util/strutils.js", "../editors/theme.js", "../path.ux/scripts/core/ui_base.js", "../path.ux/scripts/core/ui_theme.js", "../config/config.js", "../path.ux/scripts/util/util.js"], function _UserSettings_module(_es6_module) {
  var config=es6_import(_es6_module, '../config/config.js');
  var reload_default_theme=es6_import_item(_es6_module, '../datafiles/theme.js', 'reload_default_theme');
  var b64encode=es6_import_item(_es6_module, '../util/strutils.js', 'b64encode');
  var b64decode=es6_import_item(_es6_module, '../util/strutils.js', 'b64decode');
  var exportTheme=es6_import_item(_es6_module, '../path.ux/scripts/core/ui_theme.js', 'exportTheme');
  var CSSFont=es6_import_item(_es6_module, '../path.ux/scripts/core/ui_theme.js', 'CSSFont');
  var setTheme=es6_import_item(_es6_module, '../path.ux/scripts/core/ui_base.js', 'setTheme');
  var ui_base=es6_import(_es6_module, '../path.ux/scripts/core/ui_base.js');
  var theme=es6_import_item(_es6_module, '../editors/theme.js', 'theme');
  var util=es6_import(_es6_module, '../path.ux/scripts/util/util.js');
  var KeyMapDeltaSet=es6_import_item(_es6_module, './keymap.js', 'KeyMapDeltaSet');
  var KeyMapDelta=es6_import_item(_es6_module, './keymap.js', 'KeyMapDelta');
  var KeyMap=es6_import_item(_es6_module, './keymap.js', 'KeyMap');
  let defaultTheme=exportTheme(theme);
  function loadTheme(str) {
    var theme;
    eval(str);
    setTheme(theme);
  }
  loadTheme = _es6_module.add_export('loadTheme', loadTheme);
  loadTheme(defaultTheme);
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
  const SETTINGS_VERSION=1;
  _es6_module.add_export('SETTINGS_VERSION', SETTINGS_VERSION);
  class AppSettings  {
     constructor() {
      this.reload_defaults(false);
      this.recent_paths = [];
      this.tool_settings = [];
      this.keyMaps = [];
      this.version = SETTINGS_VERSION;
      this.keyDeltaGen = 0;
    }
     updateKeyDeltas(typeName, keymap) {
      for (let kd of this.keyMaps) {
          if (kd.typeName===typeName) {
              this.keyMaps.remove(kd);
          }
      }
      this.keyMaps.push(keymap.asDeltaSet());
      this.keyDeltaGen++;
    }
     getKeyMapDeltaSet(typeName) {
      for (let kd of this.keyMaps) {
          if (kd.typeName===typeName) {
              return kd;
          }
      }
      let kd=new KeyMapDeltaSet(typeName);
      this.keyMaps.push(kd);
      return kd;
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
      if (b.version<1) {
          console.error("Resetting theme");
          this.reloadDefaultTheme();
      }
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
          if (settings===undefined) {
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
      this.version = 0;
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
  version       : int;
  keyMaps       : array(KeyMapDeltaSet);
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


es6_module_define('context', ["../editors/viewport/view2d.js", "../editors/dopesheet/DopeSheetEditor.js", "../editors/curve/CurveEditor.js", "../editors/console/console.js", "./lib_api.js", "../editors/settings/SettingsEditor.js", "../path.ux/scripts/path-controller/controller/context.js", "../scene/scene.js", "../curve/spline.js", "../path.ux/scripts/pathux.js", "../editors/ops/ops_editor.js", "./frameset.js", "../editors/editor_base.js"], function _context_module(_es6_module) {
  var ContextOverlay=es6_import_item(_es6_module, '../path.ux/scripts/path-controller/controller/context.js', 'ContextOverlay');
  var Context=es6_import_item(_es6_module, '../path.ux/scripts/path-controller/controller/context.js', 'Context');
  var SavedToolDefaults=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'SavedToolDefaults');
  var DataAPI=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'DataAPI');
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
    get  toolDefaults() {
      return SavedToolDefaults;
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
      super(state);
      this.appstate = state;
      this._keymap_mpos = [0, 0];
    }
    get  font() {
      return g_app_state.raster.font;
    }
    get  keymap_mpos() {
      return this._keymap_mpos;
    }
     keymap_mpos_save() {
      return [this._keymap_mpos[0], this._keymap_mpos[1]];
    }
     keymap_mpos_load(ctx, data) {
      return data;
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
  var DataTypes=es6_import_item(_es6_module, './lib_api.js', 'DataTypes');
  var DataBlock=es6_import_item(_es6_module, './lib_api.js', 'DataBlock');
  var Editor=es6_import_item(_es6_module, '../editors/editor_base.js', 'Editor');
  var SettingsEditor=es6_import_item(_es6_module, '../editors/settings/SettingsEditor.js', 'SettingsEditor');
  var CurveEditor=es6_import_item(_es6_module, '../editors/curve/CurveEditor.js', 'CurveEditor');
  var OpStackEditor=es6_import_item(_es6_module, '../editors/ops/ops_editor.js', 'OpStackEditor');
  var ConsoleEditor=es6_import_item(_es6_module, '../editors/console/console.js', 'ConsoleEditor');
  var DopeSheetEditor=es6_import_item(_es6_module, '../editors/dopesheet/DopeSheetEditor.js', 'DopeSheetEditor');
  var View2DHandler=es6_import_item(_es6_module, '../editors/viewport/view2d.js', 'View2DHandler');
  var Scene=es6_import_item(_es6_module, '../scene/scene.js', 'Scene');
  var Spline=es6_import_item(_es6_module, '../curve/spline.js', 'Spline');
}, '/dev/fairmotion/src/core/context.js');


es6_module_define('toolstack', ["./const.js", "../path.ux/scripts/pathux.js", "./context.js", "./toolops_api.js", "./toolprops.js"], function _toolstack_module(_es6_module) {
  var BaseContext=es6_import_item(_es6_module, './context.js', 'BaseContext');
  var FullContext=es6_import_item(_es6_module, './context.js', 'FullContext');
  var ToolFlags=es6_import_item(_es6_module, './toolops_api.js', 'ToolFlags');
  var ToolMacro=es6_import_item(_es6_module, './toolops_api.js', 'ToolMacro');
  var ToolOp=es6_import_item(_es6_module, './toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, './toolops_api.js', 'UndoFlags');
  var CollectionProperty=es6_import_item(_es6_module, './toolprops.js', 'CollectionProperty');
  var StringProperty=es6_import_item(_es6_module, './toolprops.js', 'StringProperty');
  var TPropFlags=es6_import_item(_es6_module, './toolprops.js', 'TPropFlags');
  var pathux=es6_import(_es6_module, '../path.ux/scripts/pathux.js');
  var USE_PATHUX_API=es6_import_item(_es6_module, './const.js', 'USE_PATHUX_API');
  class ToolStack extends pathux.ToolStack {
    
    
    
    
    
     constructor(appstate) {
      super();
      this.appstate = appstate;
      this.valcache = appstate.toolop_input_cache;
      this.do_truncate = true;
    }
    get  undostack() {
      return this;
    }
    get  undocur() {
      return this.cur;
    }
    set  undocur(v) {
      this.cur = v;
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
        if (!(tool.undoflag&UndoFlags.NO_UNDO)) {
            tool.undoPre(ctx);
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
          if (!(tool.undoflag&UndoFlags.NO_UNDO)) {
              tool.undoPre(ctx);
              tool.undoflag|=UndoFlags.HAS_UNDO_DATA;
          }
          tool.exec(ctx);
      }
    }
     truncate_stack() {
      if (this.cur!==this.length) {
          if (this.cur===0) {
              this.length = 0;
          }
          else {
            this.length = this.cur;
          }
      }
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
     reexec_tool(tool) {
      console.error("reexec_tool called");
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
      this.reset();
    }
     gen_tool_datastruct(tool) {
      return ;
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
      console.warn("toolstack.rebuild_last_tool called!");
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
     exec_tool(tool) {
      console.warn("exec_tool deprecated in favor of execTool");
      return this.execTool(g_app_state.ctx, tool);
    }
     error(msg) {
      console.error(msg);
      g_app_state.ctx.error(msg);
    }
     execTool(ctx, tool) {
      the_global_dag.exec(this.ctx);
      this.set_tool_coll_flag(tool);
      let ret=super.execTool(ctx, tool);
      if (typeof tool==="object") {
          tool.stack_index = this.indexOf(tool);
      }
      return ret;
    }
     _execTool(ctx, tool) {
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
      if (!(tool.undoflag&UndoFlags.NO_UNDO))
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
          if (!(tool.undoflag&UndoFlags.NO_UNDO)) {
              if (tool.is_modal)
                tool.modalRunning = true;
              tool.undoPre(modal_ctx);
              tool.undoflag|=UndoFlags.HAS_UNDO_DATA;
              if (tool.is_modal)
                tool.modalRunning = false;
          }
          if (tool._start_modal) {
              tool._start_modal(modal_ctx);
          }
          tool.modalStart(modal_ctx);
      }
      else {
        let tctx=(tool.flag&ToolFlags.USE_TOOL_CONTEXT) ? new BaseContext().toLocked() : ctx.toLocked();
        tool.saved_context = new SavedContext(tctx);
        if (!(tool.undoflag&UndoFlags.NO_UNDO)) {
            tool.undoPre((tool.flag&ToolFlags.USE_TOOL_CONTEXT) ? tool.ctx : ctx);
            tool.undoflag|=UndoFlags.HAS_UNDO_DATA;
        }
        tool.exec_pre(tctx);
        tool.exec(tctx);
      }
      if (!(tool.undoflag&UndoFlags.NO_UNDO)) {
          this.rebuild_last_tool(tool);
      }
    }
     loadSTRUCT(reader) {
      reader(this);
      this.cur = this.undocur;
      for (let item of this.undostack) {
          this.push(item);
      }
      for (let i=0; i<this.length; i++) {
          this[i].stack_index = i;
          this.set_tool_coll_flag(this[i]);
      }
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
}, '/dev/fairmotion/src/core/toolstack.js');


es6_module_define('AppState', ["../editors/curve/CurveEditor.js", "./toolprops.js", "./data_api/data_api_define.js", "../editors/ops/ops_editor.js", "../config/config.js", "./toolstack.js", "../editors/console/console.js", "./struct.js", "../util/strutils.js", "../path.ux/scripts/platforms/electron/electron_api.js", "../editors/material/MaterialEditor.js", "../editors/all.js", "./jobs.js", "./frameset.js", "../editors/settings/SettingsEditor.js", "../path.ux/scripts/screen/FrameManager.js", "../editors/viewport/view2d.js", "./UserSettings.js", "./notifications.js", "./startup/startup_file_example.js", "../path.ux/scripts/core/ui_base.js", "./raster.js", "./toolops_api.js", "../path.ux/scripts/screen/ScreenArea.js", "./const.js", "../path.ux/scripts/screen/FrameManager_ops.js", "../editors/dopesheet/DopeSheetEditor.js", "./lib_api.js", "../path.ux/scripts/util/util.js", "../editors/editor_base.js", "./ajax.js", "./startup/startup_file.js", "../editors/viewport/view2d_ops.js", "../curve/spline_base.js", "../scene/scene.js", "./lib_utils.js", "../../platforms/platform.js", "../editors/menubar/MenuBar.js", "../path.ux/scripts/config/const.js", "../editors/theme.js", "./context.js", "./fileapi/fileapi.js"], function _AppState_module(_es6_module) {
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
  var makeAPI=es6_import_item(_es6_module, './data_api/data_api_define.js', 'makeAPI');
  let _ex_FullContext=es6_import_item(_es6_module, './context.js', 'FullContext');
  _es6_module.add_export('FullContext', _ex_FullContext, true);
  let _ex_BaseContext=es6_import_item(_es6_module, './context.js', 'BaseContext');
  _es6_module.add_export('BaseContext', _ex_BaseContext, true);
  let _ex_BaseContextOverlay=es6_import_item(_es6_module, './context.js', 'BaseContextOverlay');
  _es6_module.add_export('BaseContextOverlay', _ex_BaseContextOverlay, true);
  var BlockTypeMap=es6_import_item(_es6_module, './lib_api.js', 'BlockTypeMap');
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
  var USE_PATHUX_API=es6_import_item(_es6_module, './const.js', 'USE_PATHUX_API');
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
    screen.listen();
  }
  gen_screen = _es6_module.add_export('gen_screen', gen_screen);
  es6_import(_es6_module, './startup/startup_file_example.js');
  var startup_file=es6_import_item(_es6_module, './startup/startup_file.js', 'startup_file');
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
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
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
      this.api = makeAPI();
      this.pathcontroller = this.api;
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
     onFrameChange(ctx, time) {
      for (let id in ctx.datalib.idmap) {
          let block=ctx.datalib.idmap[id];
          for (let ch of block.lib_anim_channels) {
              console.warn("anim: setting path", ch.path, ch.evaluate(time));
              ctx.api.setValue(ctx, ch.path, ch.evaluate(time));
          }
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
      if (!screen.listening) {
          screen.listen();
      }
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
      if (version<0.053) {
          for (let scene of datalib.scenes) {
              if (!scene.collection) {
                  scene._initCollection(datalib);
              }
          }
      }
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
          this.screen.unlisten();
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
                  let ob=scene.addFrameset(datalib, frameset);
                  scene.setActiveObject(ob);
              }
          }
          console.log("objectification");
      }
      else 
        if (version<0.053) {
          for (let scene of datalib.scenes) {
              if (!scene.collection) {
                  scene._initCollection(datalib);
              }
              for (let ob of scene.objects) {
                  if (ob.lib_id<0) {
                      console.error("Had to add object to datalib during file conversion", ob);
                      datalib.add(ob);
                  }
                  scene.collection.add(ob);
              }
          }
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
      let blocks=[];
      let fstructs=new STRUCT();
      let datalib=undefined;
      let tmap=BlockTypeMap;
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
        if (!screen.listening) {
            screen.listen();
        }
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
      let tmap=BlockTypeMap;
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
      let tmap=BlockTypeMap;
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
      return g_app_state.api;
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
      this.api = g_app_state.api;
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


es6_module_define('fileapi', ["./fileapi_html5", "./fileapi_chrome", "../../config/config.js", "./fileapi_electron"], function _fileapi_module(_es6_module) {
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


es6_module_define('fileapi_electron', ["../../path.ux/scripts/platforms/electron/electron_api.js", "./fileapi_html5.js", "../../config/config.js"], function _fileapi_electron_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../../config/config.js');
  var fileapi_html5=es6_import(_es6_module, './fileapi_html5.js');
  var wrapRemoteCallback=es6_import_item(_es6_module, '../../path.ux/scripts/platforms/electron/electron_api.js', 'wrapRemoteCallback');
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
    let $_t0rksk=require('electron'), ipcRenderer=$_t0rksk.ipcRenderer;
    let onthen=(e) =>      {
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
    }
    let oncatch=(error) =>      {
      if (error_cb) {
          error_cb(error);
      }
    }
    ipcRenderer.invoke('show-open-dialog', {title: "Open", 
    defaultPath: default_path, 
    filters: [{name: extslabel, 
     extensions: exts}], 
    securityScopedBookmarks: true}, wrapRemoteCallback("dialog", onthen), wrapRemoteCallback('dialog', oncatch));
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
    let $_t1jupk=require('electron'), ipcRenderer=$_t1jupk.ipcRenderer;
    let onthen=(dialog_data) =>      {
      let canceled=dialog_data.canceled;
      let path=dialog_data.filePath;
      if (canceled)
        return ;
      console.log("SAVING:", path);
      save_file(data, path, error_cb, success_cb);
    }
    let oncatch=(error) =>      {
      if (error_cb) {
          error_cb(error);
      }
    }
    ipcRenderer.invoke('show-save-dialog', {title: "Save", 
    defaultPath: default_path, 
    filters: [{name: extslabel, 
     extensions: exts}], 
    securityScopedBookmarks: true}, wrapRemoteCallback("dialog", onthen), wrapRemoteCallback("dialog", oncatch));
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


es6_module_define('animdata', ["./lib_api.js", "./struct.js", "../curve/spline_base.js", "./eventdag.js", "./toolprops.js"], function _animdata_module(_es6_module) {
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
        path = "datalib.items["+owner.lib_id+"]";
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


es6_module_define('svg_export', ["../vectordraw/vectordraw_svg.js", "../curve/spline_draw.js", "../curve/spline_base.js", "../curve/spline_draw_new.js", "./mathlib.js"], function _svg_export_module(_es6_module) {
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


es6_module_define('controller', ["../path-controller/controller/controller_base.js"], function _controller_module(_es6_module) {
  var ____path_controller_controller_controller_base_js=es6_import(_es6_module, '../path-controller/controller/controller_base.js');
  for (let k in ____path_controller_controller_controller_base_js) {
      _es6_module.add_export(k, ____path_controller_controller_controller_base_js[k], true);
  }
}, '/dev/fairmotion/src/path.ux/scripts/controller/controller.js');


es6_module_define('simple_controller', ["../path-controller/controller/controller.js"], function _simple_controller_module(_es6_module) {
  var ____path_controller_controller_controller_js=es6_import(_es6_module, '../path-controller/controller/controller.js');
  for (let k in ____path_controller_controller_controller_js) {
      _es6_module.add_export(k, ____path_controller_controller_controller_js[k], true);
  }
}, '/dev/fairmotion/src/path.ux/scripts/controller/simple_controller.js');


es6_module_define('anim', ["../path-controller/util/util.js", "../path-controller/util/math.js", "../path-controller/curve/curve1d.js", "./ui_theme.js", "../path-controller/util/vectormath.js"], function _anim_module(_es6_module) {
  var Vector2=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector2');
  var Matrix4=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Matrix4');
  var Quat=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Quat');
  var Vector3=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector4');
  var math=es6_import(_es6_module, '../path-controller/util/math.js');
  var color2css=es6_import_item(_es6_module, './ui_theme.js', 'color2css');
  var css2color=es6_import_item(_es6_module, './ui_theme.js', 'css2color');
  var parsepx=es6_import_item(_es6_module, './ui_theme.js', 'parsepx');
  var Curve1D=es6_import_item(_es6_module, '../path-controller/curve/curve1d.js', 'Curve1D');
  var getCurve=es6_import_item(_es6_module, '../path-controller/curve/curve1d.js', 'getCurve');
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
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
     goto(key, val, timeMs, curve="ease") {
      let cmd=new GoToCommand(this.owner, key, val, timeMs, curve);
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
  let AspectKeys=Symbol("aspect-keys");
  function initAspectClass(object, blacklist) {
    if (blacklist===undefined) {
        blacklist = new Set();
    }
    let cls=object.constructor;
    if (!cls[AspectKeys]) {
        cls[AspectKeys] = [];
        let keys=[];
        let p=object.__proto__;
        while (p) {
          keys = keys.concat(Reflect.ownKeys(p));
          p = p.__proto__;
        }
        keys = new Set(keys);
        function validProperty(obj, key) {
          let descr=Object.getOwnPropertyDescriptor(obj, key);
          if (descr&&(descr.get||descr.set)) {
              return false;
          }
          let p=obj.constructor;
          do {
            if (p.prototype) {
                let descr=Object.getOwnPropertyDescriptor(p.prototype, key);
                if (descr&&(descr.set||descr.get)) {
                    return false;
                }
            }
            p = p.__proto__;
          } while (p&&p!==p.__proto__);
          
          return true;
        }
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
            if (!validProperty(object, k)) {
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
            cls[AspectKeys].push(k);
        }
    }
    object.__aspect_methods = new Set();
    for (let k of cls[AspectKeys]) {
        AfterAspect.bind(object, k);
    }
  }
  initAspectClass = _es6_module.add_export('initAspectClass', initAspectClass);
  function clearAspectCallbacks(obj) {
    for (let key of obj.__aspect_methods) {
        obj[key].clear();
    }
  }
  clearAspectCallbacks = _es6_module.add_export('clearAspectCallbacks', clearAspectCallbacks);
  class AfterAspect  {
     constructor(owner, key) {
      this.owner = owner;
      this.key = key;
      this.chain = [[owner[key], false]];
      this.chain2 = [[owner[key], false]];
      this.root = [[owner[key], false]];
      let this2=this;
      let method=this._method = function () {
        let chain=this2.chain;
        let chain2=this2.chain2;
        chain2.length = chain.length;
        for (let i=0; i<chain.length; i++) {
            chain2[i] = chain[i];
        }
        for (let i=0; i<chain2.length; i++) {
            let $_t0fwac=chain2[i], cb=$_t0fwac[0], node=$_t0fwac[1], once=$_t0fwac[2];
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
      owner.__aspect_methods.add(key);
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
     clear() {
      this._checkbind();
      this.chain = [[this.root[0][0], this.root[0][1]]];
      this.chain2 = [[this.root[0][0], this.root[0][1]]];
      return this;
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
  _es6_module.set_default_export('manager', manager);
  
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


es6_module_define('theme', ["./ui_theme.js"], function _theme_module(_es6_module) {
  var CSSFont=es6_import_item(_es6_module, './ui_theme.js', 'CSSFont');
  const DefaultTheme={base: {AreaHeaderBG: 'rgba(200, 200, 200, 0.95)', 
    BasePackFlag: 0, 
    BoxDepressed: 'rgba(130,130,130, 1)', 
    BoxHighlight: 'rgba(151,208,239, 1)', 
    "flex-grow": "unset", 
    DefaultText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 14, 
     color: 'rgba(35, 35, 35, 1.0)'}), 
    LabelText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 14, 
     color: 'rgba(35, 35, 35, 1.0)'}), 
    TitleText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(35, 35, 35, 1.0)'}), 
    'background-color': 'rgba(207,207,207, 0.5)', 
    'border-color': 'rgba(34,34,34, 1)', 
    'border-radius': 12.010619764585666, 
    'focus-border-width': 2, 
    oneAxisPadding: 2, 
    padding: 1}, 
   button: {DefaultText: new CSSFont({font: 'poppins', 
     weight: 'bold', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(35,35,35, 1)'}), 
    'background-color': 'rgba(238,238,238, 0.8672412740773168)', 
    'border-color': 'rgba(255,255,255, 1)', 
    'border-radius': 4, 
    'border-style': 'solid', 
    'border-width': 2, 
    disabled: {DefaultText: new CSSFont({font: 'poppins', 
      weight: 'bold', 
      variant: 'normal', 
      style: 'normal', 
      size: 12, 
      color: 'rgb(109,109,109)'}), 
     'background-color': 'rgb(19,19,19)', 
     'border-color': '#f58f8f', 
     'border-style': 'solid', 
     'border-width': 1}, 
    height: 25, 
    highlight: {DefaultText: new CSSFont({font: 'poppins', 
      weight: 'bold', 
      variant: 'normal', 
      style: 'normal', 
      size: 12, 
      color: 'rgba(255,255,255, 1)'}), 
     'background-color': 'rgba(138,222,255, 1)', 
     'border-color': 'rgba(255,255,255, 1)', 
     'border-radius': 4, 
     'border-style': 'solid', 
     'border-width': 2}, 
    'highlight-pressed': {DefaultText: new CSSFont({font: 'poppins', 
      weight: 'bold', 
      variant: 'normal', 
      style: 'normal', 
      size: 12, 
      color: 'rgba(35,35,35, 1)'}), 
     'background-color': 'rgba(113,113,113, 1)', 
     'border-color': '#DADCE0', 
     'border-style': 'solid', 
     'border-width': 1}, 
    margin: 4, 
    'margin-left': 4, 
    'margin-right': 4, 
    padding: 1, 
    pressed: {DefaultText: new CSSFont({font: 'poppins', 
      weight: 'bold', 
      variant: 'normal', 
      style: 'normal', 
      size: 12, 
      color: 'rgba(35,35,35, 1)'}), 
     'background-color': 'rgba(113,113,113, 1)', 
     'border-color': '#DADCE0', 
     'border-style': 'solid', 
     'border-width': 1}, 
    width: 25}, 
   checkbox: {CheckSide: 'left', 
    height: 32, 
    width: 32, 
    "background-color": "rgb(168,168,168)"}, 
   colorfield: {circleSize: 11, 
    colorBoxHeight: 24, 
    fieldSize: 400, 
    height: 256, 
    hueHeight: 32, 
    width: 256}, 
   colorpickerbutton: {height: 32, 
    width: 95}, 
   curvewidget: {CanvasBG: 'rgb(44,44,44)', 
    CanvasHeight: 256, 
    CanvasWidth: 256}, 
   dropbox: {dropTextBG: 'rgba(233,233,233, 1)', 
    height: 25, 
    width: 32}, 
   iconbutton: {highlight: {'background-color': 'rgba(133,182,255,0.8)', 
     'border-color': 'black', 
     'border-radius': 5, 
     'border-width': 1, 
     height: 32, 
     'margin-bottom': 1, 
     'margin-left': 2, 
     'margin-right': 2, 
     'margin-top': 1, 
     padding: 2, 
     width: 32}, 
    depressed: {'background-color': 'rgba(42,61,77,0.8)', 
     'border-color': 'black', 
     'border-radius': 5, 
     'border-width': 1, 
     height: 32, 
     'margin-bottom': 1, 
     'margin-left': 2, 
     'margin-right': 2, 
     'margin-top': 1, 
     padding: 2, 
     width: 32}, 
    'background-color': 'rgba(15,15,15, 0)', 
    'border-color': 'black', 
    'border-radius': 5, 
    'border-width': 1, 
    height: 32, 
    'margin-bottom': 1, 
    'margin-left': 2, 
    'margin-right': 2, 
    'margin-top': 1, 
    padding: 2, 
    width: 32}, 
   iconcheck: {highlight: {'background-color': 'rgba(133,182,255,0.8)', 
     'border-color': 'black', 
     'border-radius': 5, 
     'border-width': 1, 
     height: 32, 
     'margin-bottom': 1, 
     'margin-left': 2, 
     'margin-right': 2, 
     'margin-top': 1, 
     padding: 2, 
     width: 32}, 
    depressed: {'background-color': 'rgba(42,61,77,0.8)', 
     'border-color': 'black', 
     'border-radius': 5, 
     'border-width': 1, 
     height: 32, 
     'margin-bottom': 1, 
     'margin-left': 2, 
     'margin-right': 2, 
     'margin-top': 1, 
     padding: 2, 
     width: 32}, 
    'background-color': 'rgba(15,15,15, 0)', 
    'border-color': 'rgba(237,209,209, 1)', 
    'border-radius': 5, 
    'border-width': 0, 
    drawCheck: true, 
    height: 32, 
    'margin-bottom': 1, 
    'margin-left': 2, 
    'margin-right': 2, 
    'margin-top': 1, 
    padding: 2, 
    width: 32}, 
   label: {LabelText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 14, 
     color: 'rgba(35, 35, 35, 1.0)'})}, 
   listbox: {ListActive: 'rgba(200, 205, 215, 1.0)', 
    ListHighlight: 'rgba(155, 220, 255, 0.5)', 
    height: 200, 
    width: 110}, 
   menu: {MenuBG: 'rgba(250, 250, 250, 1.0)', 
    "item-radius": 0, 
    MenuBorder: '1px solid grey', 
    MenuHighlight: 'rgba(155, 220, 255, 1.0)', 
    MenuSeparator: {width: "100%", 
     height: 2, 
     padding: 0, 
     margin: 0, 
     border: "none", 
     "background-color": "grey"}, 
    'box-shadow': '5px 5px 25px rgba(0,0,0,0.75)', 
    MenuSpacing: 5, 
    MenuText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(25, 25, 25, 1.0)'}), 
    "padding-top": 0, 
    "padding-left": 0, 
    "padding-right": 0, 
    "padding-bottom": 0, 
    'border-color': 'grey', 
    'border-radius': 5, 
    'border-style': 'solid', 
    'border-width': 1}, 
   notification: {DefaultText: new CSSFont({font: 'poppins', 
     weight: 'bold', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgb(55,55,55)'}), 
    "background-color": "rgba(72,72,72,0)", 
    "border-radius": 5, 
    "border-color": "grey", 
    "border-width": 1, 
    "border-style": "solid", 
    ProgressBarBG: "rgb(74,148,183)", 
    ProgressBar: "rgb(250,132,58)"}, 
   numslider: {'background-color': 'rgba(219,219,219, 1)', 
    'border-color': 'black', 
    'border-radius': 1, 
    height: 18, 
    width: 90}, 
   numslider_simple: {SlideHeight: 10, 
    TextBoxWidth: 45, 
    'background-color': 'rgba(219,219,219, 1)', 
    height: 18, 
    labelOnTop: true, 
    width: 135}, 
   numslider_textbox: {TextBoxHeight: 25, 
    TextBoxWidth: 50, 
    'background-color': 'rgba(219,219,219, 1)', 
    height: 25, 
    labelOnTop: true, 
    width: 120}, 
   panel: {HeaderBorderRadius: 5.329650280441558, 
    HeaderRadius: 4, 
    TitleBackground: 'rgba(177,219,255, 1)', 
    TitleBorder: 'rgba(104,104,104, 1)', 
    TitleText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 14, 
     color: 'rgba(0,0,0, 1)'}), 
    'background-color': 'rgba(184,184,184, 0.7594818376068376)', 
    'border-color': 'rgba(0,0,0, 0.5598061397157866)', 
    'border-radius': 4, 
    'border-style': 'groove', 
    'border-width': 1.141, 
    'margin-bottom': 0, 
    'margin-bottom-closed': 0, 
    'margin-left': 5.6584810220495445, 
    'margin-right': 0, 
    'margin-top': 0, 
    'margin-top-closed': 0, 
    'padding-bottom': 0, 
    'padding-left': 0, 
    'padding-right': 0, 
    'padding-top': 0}, 
   richtext: {DefaultText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 16, 
     color: 'rgba(35, 35, 35, 1.0)'}), 
    'background-color': 'rgb(245, 245, 245)'}, 
   screenborder: {'border-inner': 'grey', 
    'border-outer': 'rgba(228,228,228, 1)', 
    'border-width': 2, 
    'mouse-threshold': 8}, 
   scrollbars: {border: undefined, 
    color: undefined, 
    color2: undefined, 
    contrast: undefined, 
    width: undefined}, 
   sidebar: {'background-color': 'rgba(55, 55, 55, 0.5)'}, 
   strip: {'background-color': 'rgba(75,75,75, 0.33213141025641024)', 
    'border-color': 'rgba(0,0,0, 0.31325409987877156)', 
    'border-radius': 8.76503417507447, 
    'border-style': 'solid', 
    'border-width': 1, 
    margin: 2, 
    oneAxisPadding: 2, 
    padding: 1, 
    "flex-grow": "unset"}, 
   tabs: {"movable-tabs": "true", 
    TabActive: 'rgba(212,212,212, 1)', 
    TabBarRadius: 6, 
    TabHighlight: 'rgba(50, 50, 50, 0.2)', 
    TabInactive: 'rgba(183,183,183, 1)', 
    TabStrokeStyle1: 'rgba(0,0,0, 1)', 
    TabStrokeStyle2: 'rgba(0,0,0, 1)', 
    TabText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'bold', 
     style: 'normal', 
     size: 15, 
     color: 'rgba(0,0,0, 1)'}), 
    'background-color': 'rgba(222,222,222, 1)'}, 
   textbox: {DefaultText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 14, 
     color: 'rgba(3,3,3, 1)'}), 
    'background-color': 'rgba(245,245,245, 1)'}, 
   tooltip: {ToolTipText: new CSSFont({font: 'sans-serif', 
     weight: 'bold', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(35, 35, 35, 1.0)'}), 
    'background-color': 'rgba(255,255,255, 1)', 
    'border-color': 'rgba(139,139,139, 1)', 
    'border-radius': 3, 
    'border-style': 'solid', 
    'border-width': 1, 
    padding: 5}, 
   treeview: {itemIndent: 10, 
    rowHeight: 18}, 
   vecPopupButton: {height: 18, 
    padding: 3, 
    width: 100}}
  _es6_module.add_export('DefaultTheme', DefaultTheme);
}, '/dev/fairmotion/src/path.ux/scripts/core/theme.js');


es6_module_define('ui', ["../path-controller/toolsys/toolprop.js", "../path-controller/util/html5_fileapi.js", "../widgets/ui_menu.js", "../widgets/ui_widgets.js", "../path-controller/util/simple_events.js", "../path-controller/util/vectormath.js", "../path-controller/util/util.js", "./ui_base.js", "../core/units.js", "../path-controller/controller/controller_base.js", "./ui_theme.js", "../config/const.js"], function _ui_module(_es6_module) {
  var _ui=undefined;
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var units=es6_import(_es6_module, '../core/units.js');
  var vectormath=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  var ui_base=es6_import(_es6_module, './ui_base.js');
  var ui_widgets=es6_import(_es6_module, '../widgets/ui_widgets.js');
  var toolprop=es6_import(_es6_module, '../path-controller/toolsys/toolprop.js');
  es6_import(_es6_module, '../path-controller/util/html5_fileapi.js');
  var HotKey=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'HotKey');
  var CSSFont=es6_import_item(_es6_module, './ui_theme.js', 'CSSFont');
  var theme=es6_import_item(_es6_module, './ui_base.js', 'theme');
  var iconSheetFromPackFlag=es6_import_item(_es6_module, './ui_base.js', 'iconSheetFromPackFlag');
  var createMenu=es6_import_item(_es6_module, '../widgets/ui_menu.js', 'createMenu');
  var startMenu=es6_import_item(_es6_module, '../widgets/ui_menu.js', 'startMenu');
  let PropFlags=toolprop.PropFlags;
  let PropSubTypes=toolprop.PropSubTypes;
  let EnumProperty=toolprop.EnumProperty;
  let Vector2=vectormath.Vector2, UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, PropTypes=toolprop.PropTypes;
  var DataPathError=es6_import_item(_es6_module, '../path-controller/controller/controller_base.js', 'DataPathError');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  class Label extends ui_base.UIBase {
     constructor() {
      super();
      this._label = "";
      this._lastText = "";
      this.dom = document.createElement("div");
      this.dom.setAttribute("class", "_labelx");
      let style=document.createElement("style");
      style.textContent = `
      div._labelx::selection {
        color: none;
        background: none;
         -webkit-user-select:none;
         user-select:none;
      }
    `;
      this.shadow.appendChild(style);
      this.shadow.appendChild(this.dom);
      this.font = "LabelText";
    }
    get  font() {
      return this._font;
    }
    set  font(fontDefaultName) {
      if (typeof fontDefaultName==="string") {
          this._font = this.getDefault(fontDefaultName);
          if (!this._font) {
              console.warn("Invalid font", fontDefaultName);
          }
      }
      else 
        if (typeof fontDefaultName==="object"&&__instance_of(fontDefaultName, CSSFont)) {
          this._font = fontDefaultName;
      }
      else {
        console.warn("Invalid font", fontDefaultName);
      }
      this._updateFont();
    }
    get  text() {
      return this._label;
    }
    set  text(text) {
      this._label = text;
      if (!this.hasAttribute("datapath")) {
          this.dom.innerText = text;
      }
    }
    static  define() {
      return {tagname: "label-x", 
     style: "label"}
    }
     init() {
      this.dom.style["width"] = "max-content";
    }
     setCSS() {
      super.setCSS(false);
      this.setBoxCSS();
    }
     on_disabled() {
      super.on_disabled();
      this._enabled_font = this.font;
      this.font = "DefaultText";
      this._updateFont();
    }
     on_enabled() {
      super.on_enabled();
      this.font = this._enabled_font;
      this._updateFont();
    }
     _updateFont() {
      let font=this._font;
      if (!font)
        return ;
      this.dom.style["font"] = font.genCSS();
      this.dom.style["color"] = font.color;
    }
     updateDataPath() {
      if (this.ctx===undefined) {
          return ;
      }
      let path=this.getAttribute("datapath");
      let prop=this.getPathMeta(this.ctx, path);
      let val=this.getPathValue(this.ctx, path);
      if (val===undefined) {
          return ;
      }
      if (prop.type&(PropTypes.INT|PropTypes.FLOAT)) {
          val = units.buildString(val, prop.baseUnit, prop.decimalPlaces, prop.displayUnit);
      }
      val = ""+this._label+" "+val;
      if (val!==this._lastText) {
          this._lastText = val;
          this.dom.innerText = val;
      }
    }
     update() {
      let key="";
      if (this._font!==undefined&&__instance_of(this._font, CSSFont)) {
          key+=this._font.genKey();
      }
      if (key!==this._last_font) {
          this._last_font = key;
          this._updateFont();
      }
      this.dom.style["pointer-events"] = this.style["pointer-events"];
      if (this.hasAttribute("datapath")) {
          this.updateDataPath();
      }
    }
  }
  _ESClass.register(Label);
  _es6_module.add_class(Label);
  Label = _es6_module.add_export('Label', Label);
  ui_base.UIBase.internalRegister(Label);
  class Container extends ui_base.UIBase {
     constructor() {
      super();
      this.dataPrefix = '';
      this.massSetPrefix = '';
      this.inherit_packflag = 0;
      let style=this.styletag = document.createElement("style");
      style.textContent = `
    `;
      this.shadow.appendChild(style);
      this.reversed = false;
      this._prefixstack = [];
      this._mass_prefixstack = [];
    }
    set  background(bg) {
      this.__background = bg;
      this.styletag.textContent = `div.containerx {
        background-color : ${bg};
      }
    `;
      this.style["background-color"] = bg;
    }
    get  children() {
      let list=[];
      this._forEachChildWidget((n) =>        {
        list.push(n);
      });
      return list;
    }
    static  define() {
      return {tagname: "container-x"}
    }
     changePathPrefix(newprefix) {
      let prefix=this.dataPrefix.trim();
      this.dataPrefix = newprefix;
      if (prefix.length>0) {
          prefix+=".";
      }
      let rec=(n, con) =>        {
        if (__instance_of(n, Container)&&n!==this) {
            if (n.dataPrefix.startsWith(prefix)) {
                n.dataPrefix = n.dataPath.slice(prefix.length, n.dataPrefix.length);
                n.dataPrefix = con._joinPrefix(n.dataPrefix);
                con = n;
            }
        }
        if (n.hasAttribute("datapath")) {
            let path=n.getAttribute("datapath");
            if (path.startsWith(prefix)) {
                path = path.slice(prefix.length, path.length);
                path = con._joinPrefix(path);
                n.setAttribute("datapath", path);
                n.description = n.description;
            }
        }
        n._forEachChildWidget((n2) =>          {
          rec(n2, con);
        });
      };
      rec(this, this);
    }
     reverse() {
      this.reversed^=true;
      return this;
    }
     pushMassSetPrefix(val) {
      this._mass_prefixstack.push(this.massSetPrefix);
      this.massSetPrefix = val;
      return this;
    }
     pushDataPrefix(val) {
      this._prefixstack.push(this.dataPrefix);
      this.dataPrefix = val;
      return this;
    }
     popDataPrefix() {
      this.dataPrefix = this._prefixstack.pop();
      return this;
    }
     popMassSetPrefix() {
      this.massSetPrefix = this._mass_prefixstack.pop();
      return this;
    }
     saveData() {
      if (this.scrollTop||this.scrollLeft) {
          return {scrollTop: this.scrollTop, 
       scrollLeft: this.scrollLeft}
      }
      else {
        return {}
      }
    }
     loadData(obj) {
      if (!obj)
        return ;
      let x=obj.scrollLeft||0;
      let y=obj.scrollTop||0;
      this.doOnce(() =>        {
        this.scrollTo(x, y);
      }, 12);
    }
     init() {
      this.style["display"] = "flex";
      this.style["flex-direction"] = this.reversed ? "column-reverse" : "column";
      this.style["flex-wrap"] = "nowrap";
      this.style["flex-grow"] = ""+this.getDefault("flex-grow", undefined, "1");
      this.setCSS();
      super.init();
      this.setAttribute("class", "containerx");
    }
     useIcons(enabled_or_sheet=true) {
      let enabled=!!enabled_or_sheet;
      let mask=PackFlags.USE_ICONS|PackFlags.SMALL_ICON|PackFlags.LARGE_ICON;
      mask = mask|PackFlags.CUSTOM_ICON_SHEET;
      mask = mask|(255<<PackFlags.CUSTOM_ICON_SHEET_START);
      let previous=this.packflag&mask;
      if (!enabled) {
          this.packflag&=~PackFlags.USE_ICONS;
          this.inherit_packflag&=~PackFlags.USE_ICONS;
          return previous;
      }
      let sheet=enabled_or_sheet;
      if (sheet===true) {
          sheet = PackFlags.SMALL_ICON;
      }
      else 
        if (sheet===1) {
          sheet = PackFlags.LARGE_ICON;
      }
      else {
        sheet = PackFlags.CUSTOM_ICON_SHEET|(sheet<<(PackFlags.CUSTOM_ICON_SHEET_START));
      }
      this.packflag&=~(PackFlags.SMALL_ICON|PackFlags.LARGE_ICON|PackFlags.CUSTOM_ICON_SHEET);
      this.packflag&=~(255<<PackFlags.CUSTOM_ICON_SHEET_START);
      this.packflag|=PackFlags.USE_ICONS|sheet;
      this.inherit_packflag|=PackFlags.USE_ICONS|sheet;
      return previous;
    }
     wrap(mode="wrap") {
      this.style["flex-wrap"] = mode;
      return this;
    }
     noMarginsOrPadding() {
      super.noMarginsOrPadding();
      let keys=["margin", "padding", "margin-block-start", "margin-block-end"];
      keys = keys.concat(["padding-block-start", "padding-block-end"]);
      for (let k of keys) {
          this.style[k] = "0px";
      }
      return this;
    }
     setCSS() {
      let rest='';
      let add=(style) =>        {
        if (!this.hasDefault(style)) {
            return ;
        }
        let val=this.getDefault(style);
        if (val!==undefined) {
            rest+=`  ${style} = ${val};\n`;
            this.style[style] = val;
        }
      };
      add("border-radius");
      add("border-width");
      add("border-top");
      add("border-bottom");
      add("border-left");
      add("border-right");
      this.styletag.textContent = `div.containerx {
        background-color : ${this.getDefault("background-color")};
        ${rest}
      }
      `;
    }
     overrideDefault(key, val) {
      super.overrideDefault(key, val);
      this.setCSS();
      return this;
    }
     strip(themeClass="strip", margin1=this.getDefault("oneAxisPadding"), margin2=1, horiz=undefined) {
      if (horiz===undefined) {
          horiz = __instance_of(this, RowFrame);
          horiz = horiz||this.style["flex-direction"]==="row";
      }
      let flag=horiz ? PackFlags.STRIP_HORIZ : PackFlags.STRIP_VERT;
      let strip=(horiz ? this.row() : this.col());
      if (typeof margin1!=="number") {
          throw new Error("margin1 was not a number");
      }
      if (typeof margin2!=="number") {
          throw new Error("margin2 was not a number");
      }
      strip.packflag|=flag;
      strip.dataPrefix = this.dataPrefix;
      strip.massSetPrefix = this.massSetPrefix;
      if (themeClass in theme) {
          strip.overrideClass(themeClass);
          strip.background = strip.getDefault("background-color");
          strip.setCSS();
          strip.overrideClass(themeClass);
          let lastkey;
          strip.update.after(function () {
            let bradius=strip.getDefault("border-radius");
            let bline=strip.getDefault("border-width");
            let bstyle=strip.getDefault("border-style")||'solid';
            let padding=strip.getDefault("padding");
            let bcolor=strip.getDefault("border-color")||"rgba(0,0,0,0)";
            let margin=strip.getDefault("margin")||0;
            bline = bline===undefined ? 0 : bline;
            bradius = bradius===undefined ? 0 : bradius;
            padding = padding===undefined ? 5 : padding;
            let bg=strip.getDefault("background-color");
            let key=""+bradius+":"+bline+":"+bg+":"+padding+":";
            key+=bstyle+":"+padding+":"+bcolor+":"+margin;
            if (key!==lastkey) {
                lastkey = key;
                strip.oneAxisPadding(margin1+padding, margin2+padding);
                strip.setCSS();
                strip.background = bg;
                strip.style["margin"] = ""+margin+"px";
                strip.style["border"] = `${bline}px ${bstyle} ${bcolor}`;
                strip.style["border-radius"] = ""+bradius+"px";
            }
          });
      }
      else {
        console.warn(this.constructor.name+".strip(): unknown theme class "+themeClass);
      }
      return strip;
    }
     oneAxisMargin(m=this.getDefault("oneAxisMargin"), m2=0) {
      this.style["margin-top"] = this.style["margin-bottom"] = ""+m+"px";
      this.style["margin-left"] = this.style["margin-right"] = ""+m2+"px";
      return this;
    }
     oneAxisPadding(axisPadding=this.getDefault("oneAxisPadding"), otherPadding=0) {
      this.style["padding-top"] = this.style["padding-bottom"] = ""+axisPadding+"px";
      this.style["padding-left"] = this.style["padding-right"] = ""+otherPadding+"px";
      return this;
    }
     setMargin(m) {
      this.style["margin"] = m+"px";
      return this;
    }
     setPadding(m) {
      this.style["padding"] = m+"px";
      return this;
    }
     setSize(width, height) {
      if (width!==undefined) {
          if (typeof width=="number")
            this.style["width"] = this.div.style["width"] = ~~width+"px";
          else 
            this.style["width"] = this.div.style["width"] = width;
      }
      if (height!==undefined) {
          if (typeof height=="number")
            this.style["height"] = this.div.style["height"] = ~~height+"px";
          else 
            this.style["height"] = this.div.style["height"] = height;
      }
      return this;
    }
     save() {

    }
     load() {

    }
     saveVisibility() {
      localStorage[this.storagePrefix+"_settings"] = JSON.stringify(this);
      return this;
    }
     loadVisibility() {
      let key=this.storagePrefix+"_settings";
      let ok=true;
      if (key in localStorage) {
          console.log("loading UI visibility state. . .");
          try {
            this.loadJSON(JSON.parse(localStorage[key]));
          }
          catch (error) {
              util.print_stack(error);
              ok = false;
          }
      }
      return ok;
    }
     toJSON() {
      let ret={opened: !this.closed};
      return Object.assign(super.toJSON(), ret);
    }
     _ondestroy() {
      this._forEachChildWidget((n) =>        {
        n._ondestroy();
      });
      super._ondestroy();
    }
     loadJSON(obj) {
      return this;
    }
     redrawCurves() {
      throw new Error("Implement me (properly!)");
      if (this.closed)
        return ;
      for (let cw of this.curve_widgets) {
          cw.draw();
      }
    }
     listen() {
      window.setInterval(() =>        {
        this.update();
      }, 150);
    }
     update() {
      super.update();
    }
     appendChild(child) {
      if (__instance_of(child, ui_base.UIBase)) {
          child.ctx = this.ctx;
          child.parentWidget = this;
          this.shadow.appendChild(child);
          if (child.onadd) {
              child.onadd();
          }
          return ;
      }
      return super.appendChild(child);
    }
     clear(trigger_on_destroy=true) {
      for (let child of this.children) {
          if (__instance_of(child, ui_base.UIBase)) {
              child.remove(trigger_on_destroy);
          }
      }
    }
     removeChild(child, trigger_on_destroy=true) {
      let ret=super.removeChild(child);
      if (child.on_remove) {
          child.on_remove();
      }
      if (trigger_on_destroy&&child.on_destroy) {
          child.on_destroy();
      }
      child.parentWidget = undefined;
      return ret;
    }
     prepend(child) {
      if (__instance_of(child, UIBase)) {
          this._prepend(child);
      }
      else {
        super.prepend(child);
      }
    }
     _prepend(child) {
      return this._add(child, true);
    }
     add(child) {
      return this._add(child);
    }
     insert(i, ch) {
      ch.parentWidget = this;
      ch.ctx = this;
      if (i>=this.shadow.childNodes.length) {
          this.add(ch);
      }
      else {
        this.shadow.insertBefore(ch, util.list(this.children)[i]);
      }
      if (ch.onadd) {
          ch.onadd();
      }
    }
     _add(child, prepend=false) {
      if (__instance_of(child, NodeList)) {
          throw new Error("eek!");
      }
      child.ctx = this.ctx;
      child.parentWidget = this;
      child._useDataPathUndo = this._useDataPathUndo;
      if (!child._themeOverride&&this._themeOverride) {
          child.overrideTheme(this._themeOverride);
      }
      if (prepend) {
          this.shadow.prepend(child);
      }
      else {
        this.shadow.appendChild(child);
      }
      if (child.onadd)
        child.onadd();
      return child;
    }
     dynamicMenu(title, list, packflag=0) {
      return this.menu(title, list, packflag);
    }
     menu(title, list, packflag=0) {
      let dbox=UIBase.createElement("dropbox-x");
      dbox._name = title;
      dbox.setAttribute("simple", true);
      dbox.setAttribute("name", title);
      if (__instance_of(list, HTMLElement)&&list.constructor.name==="Menu") {
          dbox._build_menu = function () {
            if (this._menu!==undefined&&this._menu.parentNode!==undefined) {
                this._menu.remove();
            }
            this._menu = createMenu(this.ctx, title, list);
            return this._menu;
          };
      }
      else 
        if (list) {
          dbox.template = list;
      }
      this._container_inherit(dbox, packflag);
      this._add(dbox);
      return dbox;
    }
     toolPanel(path_or_cls, args={}) {
      let tdef;
      let cls;
      if (typeof path_or_cls==="string") {
          cls = this.ctx.api.parseToolPath(path_or_cls);
      }
      else {
        cls = path_or_cls;
      }
      tdef = cls._getFinalToolDef();
      let packflag=args.packflag||0;
      let label=args.label||tdef.uiname;
      let createCb=args.createCb||args.create_cb;
      let container=args.container||this.panel(label);
      let defaultsPath=args.defaultsPath||"toolDefaults";
      if (defaultsPath.length>0&&!defaultsPath.endsWith(".")) {
          defaultsPath+=".";
      }
      let path=defaultsPath+tdef.toolpath;
      container.useIcons(false);
      let inputs=tdef.inputs||{};
      for (let k in inputs) {
          let prop=inputs[k];
          if (prop.flag&PropFlags.PRIVATE) {
              continue;
          }
          let apiname=prop.apiname||k;
          let path2=path+"."+apiname;
          container.prop(path2);
      }
      container.tool(path_or_cls, packflag, createCb, label);
      return container;
    }
     tool(path_or_cls, packflag_or_args={}, createCb=undefined, label=undefined) {
      let cls;
      let packflag;
      if (typeof packflag_or_args==="object") {
          let args=packflag_or_args;
          packflag = args.packflag;
          createCb = args.createCb;
          label = args.label;
      }
      else {
        packflag = packflag_or_args||0;
      }
      if (typeof path_or_cls=="string") {
          if (path_or_cls.search(/\|/)>=0) {
              path_or_cls = path_or_cls.split("|");
              if (label===undefined&&path_or_cls.length>1) {
                  label = path_or_cls[1].trim();
              }
              path_or_cls = path_or_cls[0].trim();
          }
          if (this.ctx===undefined) {
              console.warn("this.ctx was undefined in tool()");
              return ;
          }
          cls = this.ctx.api.parseToolPath(path_or_cls);
          if (cls===undefined) {
              console.warn("Unknown tool for toolpath \""+path_or_cls+"\"");
              return ;
          }
      }
      else {
        cls = path_or_cls;
      }
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      let hotkey;
      if (createCb===undefined) {
          createCb = (cls) =>            {
            return this.ctx.api.createTool(this.ctx, path_or_cls);
          };
      }
      let cb=() =>        {
        console.log("tool run");
        let toolob=createCb(cls);
        this.ctx.api.execTool(this.ctx, toolob);
      };
      let def=typeof path_or_cls==="string" ? this.ctx.api.getToolDef(path_or_cls) : cls.tooldef();
      let tooltip=def.description===undefined ? def.uiname : def.description;
      if (def.hotkey!==undefined) {
          tooltip+="\n\t"+def.hotkey;
          hotkey = def.hotkey;
      }
      else {
        let path=path_or_cls;
        if (typeof path!="string") {
            path = def.toolpath;
        }
        let hotkey=this.ctx.api.getToolPathHotkey(this.ctx, path);
        if (hotkey) {
            tooltip+="\n\tHotkey: "+hotkey;
        }
      }
      let ret;
      if (def.icon!==undefined&&(packflag&PackFlags.USE_ICONS)) {
          label = label===undefined ? tooltip : label;
          ret = this.iconbutton(def.icon, label, cb);
          ret.iconsheet = iconSheetFromPackFlag(packflag);
          ret.packflag|=packflag;
      }
      else {
        label = label===undefined ? def.uiname : label;
        ret = this.button(label, cb);
        ret.description = tooltip;
        ret.packflag|=packflag;
      }
      return ret;
    }
     textbox(inpath, text, cb=undefined, packflag=0) {
      let path;
      if (inpath) {
          path = this._joinPrefix(inpath);
      }
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      let ret=UIBase.createElement("textbox-x");
      if (path!==undefined) {
          ret.setAttribute("datapath", path);
      }
      ret.ctx = this.ctx;
      ret.parentWidget = this;
      ret._init();
      this._add(ret);
      ret.setCSS();
      ret.update();
      ret.packflag|=packflag;
      ret.onchange = cb;
      ret.text = text;
      return ret;
    }
     pathlabel(inpath, label="", packflag=0) {
      let path;
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      if (inpath) {
          path = this._joinPrefix(inpath);
      }
      let ret=UIBase.createElement("label-x");
      ret.text = label;
      ret.packflag = packflag;
      ret.setAttribute("datapath", path);
      this._add(ret);
      return ret;
    }
     label(text) {
      let ret=UIBase.createElement("label-x");
      ret.text = text;
      this._add(ret);
      return ret;
    }
     helppicker() {
      let ret=this.iconbutton(ui_base.Icons.HELP, "Help Picker", () =>        {
        this.getScreen().hintPickerTool();
      });
      if (util.isMobile()) {
      }
      if (ret.ctx) {
          ret._init();
          ret.setCSS();
      }
      return ret;
    }
     iconbutton(icon, description, cb, thisvar, packflag=0) {
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      let ret=UIBase.createElement("iconbutton-x");
      ret.packflag|=packflag;
      ret.setAttribute("icon", icon);
      ret.description = description;
      ret.icon = icon;
      ret.iconsheet = iconSheetFromPackFlag(packflag);
      ret.onclick = cb;
      this._add(ret);
      return ret;
    }
     button(label, cb, thisvar, id, packflag=0) {
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      let ret=UIBase.createElement("button-x");
      ret.packflag|=packflag;
      ret.setAttribute("name", label);
      ret.setAttribute("buttonid", id);
      ret.onclick = cb;
      this._add(ret);
      return ret;
    }
     _joinPrefix(path, prefix=this.dataPrefix.trim()) {
      if (path===undefined) {
          return undefined;
      }
      path = path.trim();
      if (path[0]==="/") {
          return path;
      }
      if (prefix.length>0&&path.length>0&&!prefix.endsWith(".")&&!path.startsWith(".")) {
          path = "."+path;
      }
      return prefix+path;
    }
     colorbutton(inpath, packflag, mass_set_path=undefined) {
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      mass_set_path = this._getMassPath(this.ctx, inpath, mass_set_path);
      let ret=UIBase.createElement("color-picker-button-x");
      if (inpath!==undefined) {
          inpath = this._joinPrefix(inpath);
          ret.setAttribute("datapath", inpath);
      }
      if (mass_set_path!==undefined) {
          ret.setAttribute("mass_set_path", mass_set_path);
      }
      ret.packflag|=packflag;
      this._add(ret);
      return ret;
    }
     noteframe(packflag=0) {
      let ret=UIBase.createElement("noteframe-x");
      ret.packflag|=(this.inherit_packflag&~PackFlags.NO_UPDATE)|packflag;
      this._add(ret);
      return ret;
    }
     curve1d(inpath, packflag=0, mass_set_path=undefined) {
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      mass_set_path = this._getMassPath(this.ctx, inpath, mass_set_path);
      let ret=UIBase.createElement("curve-widget-x");
      ret.ctx = this.ctx;
      ret.packflag|=packflag;
      if (inpath) {
          inpath = this._joinPrefix(inpath);
          ret.setAttribute("datapath", inpath);
      }
      if (mass_set_path)
        ret.setAttribute("mass_set_path", mass_set_path);
      this.add(ret);
      return ret;
    }
     vecpopup(inpath, packflag=0, mass_set_path=undefined) {
      let button=UIBase.createElement("vector-popup-button-x");
      mass_set_path = this._getMassPath(this.ctx, inpath, mass_set_path);
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      let name="vector";
      if (inpath) {
          inpath = this._joinPrefix(inpath);
          button.setAttribute("datapath", inpath);
          if (mass_set_path) {
              button.setAttribute("mass_set_path", mass_set_path);
          }
          let rdef=this.ctx.api.resolvePath(this.ctx, inpath);
          if (rdef&&rdef.prop) {
              name = rdef.prop.uiname||rdef.prop.name;
          }
      }
      button.setAttribute("name", name);
      button.packflag|=packflag;
      this.add(button);
      return button;
    }
     _getMassPath(ctx, inpath, mass_set_path) {
      if (mass_set_path===undefined&&this.massSetPrefix.length>0) {
          mass_set_path = ctx.api.getPropName(ctx, inpath);
      }
      if (mass_set_path===undefined) {
          return undefined;
      }
      return this._joinPrefix(mass_set_path, this.massSetPrefix);
    }
     prop(inpath, packflag=0, mass_set_path=undefined) {
      if (!this.ctx) {
          console.warn(this.id+".ctx was undefined");
          let p=this.parentWidget;
          while (p) {
            if (p.ctx) {
                console.warn("Fetched this.ctx from parent");
                this.ctx = p.ctx;
                break;
            }
            p = p.parentWidget;
          }
          if (!this.ctx) {
              throw new Error("ui.Container.prototype.prop(): this.ctx was undefined");
          }
      }
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      let rdef=this.ctx.api.resolvePath(this.ctx, this._joinPrefix(inpath), true);
      if (rdef===undefined||rdef.prop===undefined) {
          console.warn("Unknown property at path", this._joinPrefix(inpath), this.ctx.api.resolvePath(this.ctx, this._joinPrefix(inpath), true));
          return ;
      }
      let prop=rdef.prop;
      let useDataPathUndo=!(prop.flag&PropFlags.NO_UNDO);
      function makeUIName(name) {
        if (typeof name==="number"&&isNaN(name)) {
            console.warn("Subkey error in data api", inpath);
            return ""+name;
        }
        name = ""+name;
        name = name[0].toUpperCase()+name.slice(1, name.length).toLowerCase();
        name = name.replace(/_/g, " ");
        return name;
      }
      if (prop.type===PropTypes.REPORT) {
          return this.pathlabel(inpath, prop.uiname);
      }
      else 
        if (prop.type===PropTypes.STRING) {
          let ret;
          if (prop.flag&PropFlags.READ_ONLY) {
              ret = this.pathlabel(inpath, prop.uiname);
          }
          else 
            if (prop.multiLine) {
              ret = this.textarea(inpath, rdef.value, packflag, mass_set_path);
              ret.useDataPathUndo = useDataPathUndo;
          }
          else {
            let strip=this.strip();
            let uiname=prop.uiname!==undefined ? prop.uiname : ToolProperty.makeUIName(prop.apiname);
            strip.label(prop.uiname);
            ret = strip.textbox(inpath);
            ret.useDataPathUndo = useDataPathUndo;
            if (mass_set_path) {
                ret.setAttribute("mass_set_path", mass_set_path);
            }
          }
          ret.packflag|=packflag;
          return ret;
      }
      else 
        if (prop.type===PropTypes.CURVE) {
          let ret=this.curve1d(inpath, packflag, mass_set_path);
          ret.useDataPathUndo = useDataPathUndo;
          return ret;
      }
      else 
        if (prop.type===PropTypes.INT||prop.type===PropTypes.FLOAT) {
          let ret;
          if (packflag&PackFlags.SIMPLE_NUMSLIDERS) {
              ret = this.simpleslider(inpath, {packflag: packflag});
          }
          else {
            ret = this.slider(inpath, {packflag: packflag});
          }
          ret.useDataPathUndo = useDataPathUndo;
          ret.packflag|=packflag;
          if (mass_set_path) {
              ret.setAttribute("mass_set_path", mass_set_path);
          }
          return ret;
      }
      else 
        if (prop.type===PropTypes.BOOL) {
          let ret=this.check(inpath, prop.uiname, packflag, mass_set_path);
          ret.useDataPathUndo = useDataPathUndo;
          return ret;
      }
      else 
        if (prop.type===PropTypes.ENUM) {
          if (rdef.subkey!==undefined) {
              let subkey=rdef.subkey;
              let name=rdef.prop.ui_value_names[rdef.subkey];
              if (name===undefined) {
                  name = makeUIName(rdef.subkey);
              }
              let check=this.check(inpath, name, packflag, mass_set_path);
              let tooltip=rdef.prop.descriptions[subkey];
              check.useDataPathUndo = useDataPathUndo;
              check.description = tooltip===undefined ? rdef.prop.ui_value_names[subkey] : tooltip;
              check.icon = rdef.prop.iconmap[rdef.subkey];
              return check;
          }
          if (!(packflag&PackFlags.USE_ICONS)&&!(prop.flag&(PropFlags.USE_ICONS|PropFlags.FORCE_ENUM_CHECKBOXES))) {
              if (packflag&PackFlags.FORCE_PROP_LABELS) {
                  let strip=this.strip();
                  strip.label(prop.uiname);
                  return strip.listenum(inpath, {packflag: packflag, 
           mass_set_path: mass_set_path}).setUndo(useDataPathUndo);
              }
              else {
                return this.listenum(inpath, {packflag: packflag, 
          mass_set_path: mass_set_path}).setUndo(useDataPathUndo);
              }
          }
          else {
            if (prop.flag&PropFlags.USE_ICONS) {
                packflag|=PackFlags.USE_ICONS;
            }
            else 
              if (prop.flag&PropFlags.FORCE_ENUM_CHECKBOXES) {
                packflag&=~PackFlags.USE_ICONS;
            }
            if (packflag&PackFlags.FORCE_PROP_LABELS) {
                let strip=this.strip();
                strip.label(prop.uiname);
                return strip.checkenum(inpath, undefined, packflag).setUndo(useDataPathUndo);
            }
            else {
              return this.checkenum(inpath, undefined, packflag).setUndo(useDataPathUndo);
            }
          }
      }
      else 
        if (prop.type&(PropTypes.VEC2|PropTypes.VEC3|PropTypes.VEC4)) {
          if (rdef.subkey!==undefined) {
              let ret;
              if (packflag&PackFlags.SIMPLE_NUMSLIDERS)
                ret = this.simpleslider(inpath, {packflag: packflag});
              else 
                ret = this.slider(inpath, {packflag: packflag});
              ret.packflag|=packflag;
              return ret.setUndo(useDataPathUndo);
          }
          else 
            if (prop.subtype===PropSubTypes.COLOR) {
              return this.colorbutton(inpath, packflag, mass_set_path).setUndo(useDataPathUndo);
          }
          else {
            let ret=UIBase.createElement("vector-panel-x");
            mass_set_path = this._getMassPath(this.ctx, inpath, mass_set_path);
            ret.packflag|=packflag|(this.inherit_packflag&~PackFlags.NO_UPDATE);
            ret.inherit_packflag|=packflag|(this.inherit_packflag&~PackFlags.NO_UPDATE);
            if (inpath) {
                ret.setAttribute("datapath", this._joinPrefix(inpath));
            }
            if (mass_set_path) {
                ret.setAttribute("mass_set_path", mass_set_path);
            }
            this.add(ret);
            return ret.setUndo(useDataPathUndo);
          }
      }
      else 
        if (prop.type===PropTypes.FLAG) {
          if (rdef.subkey!==undefined) {
              let tooltip=rdef.prop.descriptions[rdef.subkey];
              let name=rdef.prop.ui_value_names[rdef.subkey];
              if (typeof rdef.subkey==="number") {
                  name = rdef.prop.keys[rdef.subkey];
                  if (name&&name in rdef.prop.ui_value_names) {
                      name = rdef.prop.ui_value_names[name];
                  }
                  else {
                    name = makeUIName(name ? name : "(error)");
                  }
              }
              if (name===undefined) {
                  name = "(error)";
              }
              let ret=this.check(inpath, name, packflag, mass_set_path);
              ret.icon = rdef.prop.iconmap[rdef.subkey];
              if (tooltip) {
                  ret.description = tooltip;
              }
              return ret.setUndo(useDataPathUndo);
          }
          else {
            let con=this;
            if (packflag&PackFlags.FORCE_PROP_LABELS) {
                con = this.strip();
                con.label(prop.uiname);
            }
            if (packflag&PackFlags.PUT_FLAG_CHECKS_IN_COLUMNS) {
                let i=0;
                let row=con.row();
                let col1=row.col();
                let col2=row.col();
                for (let k in prop.values) {
                    let name=prop.ui_value_names[k];
                    let tooltip=prop.descriptions[k];
                    if (name===undefined) {
                        name = makeUIName(k);
                    }
                    let con2=i&1 ? col1 : col2;
                    let check=con2.check(`${inpath}[${k}]`, name, packflag, mass_set_path);
                    if (tooltip) {
                        check.description = tooltip;
                    }
                    check.setUndo(useDataPathUndo);
                    i++;
                }
                return row;
            }
            if (packflag&PackFlags.WRAP_CHECKBOXES) {
                let isrow=this.style["flex-direction"]==="row";
                isrow = isrow||this.style["flex-direction"]==="row-reverse";
                let wrapChars;
                let strip, con;
                if (isrow) {
                    wrapChars = this.getDefault("checkRowWrapLimit", undefined, 24);
                    strip = this.col().strip();
                    strip.packflag|=packflag;
                    strip.inherit_packflag|=packflag;
                    con = strip.row();
                }
                else {
                  wrapChars = this.getDefault("checkColWrapLimit", undefined, 5);
                  strip = this.row().strip();
                  strip.packflag|=packflag;
                  strip.inherit_packflag|=packflag;
                  con = strip.col();
                }
                let x=0;
                let y=0;
                for (let k in prop.values) {
                    let name=prop.ui_value_names[k];
                    let tooltip=prop.descriptions[k];
                    if (name===undefined) {
                        name = makeUIName(k);
                    }
                    let check=con.check(`${inpath}[${k}]`, name, packflag, mass_set_path);
                    if (tooltip) {
                        check.description = tooltip;
                    }
                    x+=name.length;
                    y+=1;
                    if (isrow&&x>wrapChars) {
                        x = 0;
                        con = strip.row();
                    }
                    else 
                      if (!isrow&&y>wrapChars) {
                        y = 0;
                        con = strip.col();
                    }
                }
                return strip;
            }
            if (con===this) {
                con = this.strip();
            }
            let rebuild=() =>              {
              con.clear();
              for (let k in prop.values) {
                  let name=prop.ui_value_names[k];
                  let tooltip=prop.descriptions[k];
                  if (name===undefined) {
                      name = makeUIName(k);
                  }
                  let check=con.check(`${inpath}[${k}]`, name, packflag, mass_set_path);
                  check.useDataPathUndo = useDataPathUndo;
                  if (tooltip) {
                      check.description = tooltip;
                  }
                  check.setUndo(useDataPathUndo);
              }
            };
            rebuild();
            let last_hash=prop.calcHash();
            con.update.after(() =>              {
              let hash=prop.calcHash();
              if (last_hash!==hash) {
                  last_hash = hash;
                  console.error("Property definition update");
                  rebuild();
              }
            });
            return con;
          }
      }
    }
     iconcheck(inpath, icon, name, mass_set_path) {
      let ret=UIBase.createElement("iconcheck-x");
      ret.icon = icon;
      ret.description = name;
      if (inpath) {
          ret.setAttribute("datapath", inpath);
      }
      if (mass_set_path) {
          ret.setAttribute("mass_set_path", mass_set_path);
      }
      this.add(ret);
      return ret;
    }
     check(inpath, name, packflag=0, mass_set_path=undefined) {
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      let path=inpath!==undefined ? this._joinPrefix(inpath) : undefined;
      let ret;
      if (packflag&PackFlags.USE_ICONS) {
          ret = UIBase.createElement("iconcheck-x");
          ret.iconsheet = iconSheetFromPackFlag(packflag);
      }
      else {
        ret = UIBase.createElement("check-x");
      }
      mass_set_path = this._getMassPath(this.ctx, inpath, mass_set_path);
      ret.packflag|=packflag;
      ret.label = name;
      ret.noMarginsOrPadding();
      if (inpath) {
          ret.setAttribute("datapath", path);
      }
      if (mass_set_path) {
          ret.setAttribute("mass_set_path", mass_set_path);
      }
      this._add(ret);
      return ret;
    }
     checkenum(inpath, name, packflag, enummap, defaultval, callback, iconmap, mass_set_path) {
      if (typeof name==="object"&&name!==null) {
          let args=name;
          name = args.name;
          packflag = args.packflag;
          enummap = args.enummap;
          defaultval = args.defaultval;
          callback = args.callback;
          iconmap = args.iconmap;
          mass_set_path = args.mass_set_path;
      }
      mass_set_path = this._getMassPath(this.ctx, inpath, mass_set_path);
      packflag = packflag===undefined ? 0 : packflag;
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      let path=this._joinPrefix(inpath);
      let has_path=path!==undefined;
      let prop;
      let frame;
      if (path!==undefined) {
          prop = this.ctx.api.resolvePath(this.ctx, path, true);
          if (prop!==undefined)
            prop = prop.prop;
      }
      if (path!==undefined) {
          if (prop===undefined) {
              console.warn("Bad path in checkenum", path);
              return ;
          }
          frame = this.strip();
          frame.oneAxisPadding();
          if (packflag&PackFlags.USE_ICONS) {
              for (let key in prop.values) {
                  let check=frame.check(inpath+"["+key+"]", "", packflag);
                  check.packflag|=PackFlags.HIDE_CHECK_MARKS;
                  check.icon = prop.iconmap[key];
                  check.drawCheck = false;
                  check.style["padding"] = "0px";
                  check.style["margin"] = "0px";
                  check.dom.style["padding"] = "0px";
                  check.dom.style["margin"] = "0px";
                  check.description = prop.descriptions[key];
              }
          }
          else {
            if (name===undefined) {
                name = prop.uiname;
            }
            frame.label(name).font = "TitleText";
            let checks={};
            let ignorecb=false;
            function makecb(key) {
              return () =>                {
                if (ignorecb)
                  return ;
                ignorecb = true;
                for (let k in checks) {
                    if (k!==key) {
                        checks[k].checked = false;
                    }
                }
                ignorecb = false;
                if (callback) {
                    callback(key);
                }
              }
            }
            for (let key in prop.values) {
                let check=frame.check(inpath+" = "+prop.values[key], prop.ui_value_names[key]);
                checks[key] = check;
                if (mass_set_path) {
                    check.setAttribute("mass_set_path", mass_set_path);
                }
                check.description = prop.descriptions[prop.keys[key]];
                if (!check.description) {
                    check.description = ""+prop.ui_value_names[key];
                }
                check.onchange = makecb(key);
            }
          }
      }
      return frame;
    }
     checkenum_panel(inpath, name, packflag=0, callback=undefined, mass_set_path=undefined, prop=undefined) {
      packflag = packflag===undefined ? 0 : packflag;
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      let path=this._joinPrefix(inpath);
      let frame;
      let has_path=path!==undefined;
      if (path!==undefined&&prop===undefined) {
          prop = this.ctx.api.resolvePath(this.ctx, path, true);
          if (prop!==undefined)
            prop = prop.prop;
      }
      if (!name&&prop) {
          name = prop.uiname;
      }
      if (path!==undefined) {
          if (prop===undefined) {
              console.warn("Bad path in checkenum", path);
              return ;
          }
          frame = this.panel(name, name, packflag);
          frame.oneAxisPadding();
          frame.setCSS.after(frame.background = this.getDefault("BoxSub2BG"));
          if (packflag&PackFlags.USE_ICONS) {
              for (let key in prop.values) {
                  let check=frame.check(inpath+" == "+prop.values[key], "", packflag);
                  check.icon = prop.iconmap[key];
                  check.drawCheck = false;
                  check.style["padding"] = "0px";
                  check.style["margin"] = "0px";
                  check.dom.style["padding"] = "0px";
                  check.dom.style["margin"] = "0px";
                  check.description = prop.descriptions[key];
              }
          }
          else {
            if (name===undefined) {
                name = prop.uiname;
            }
            frame.label(name).font = "TitleText";
            let checks={};
            let ignorecb=false;
            function makecb(key) {
              return () =>                {
                if (ignorecb)
                  return ;
                ignorecb = true;
                for (let k in checks) {
                    if (k!==key) {
                        checks[k].checked = false;
                    }
                }
                ignorecb = false;
                if (callback) {
                    callback(key);
                }
              }
            }
            for (let key in prop.values) {
                let check=frame.check(inpath+" = "+prop.values[key], prop.ui_value_names[key]);
                checks[key] = check;
                if (mass_set_path) {
                    check.setAttribute("mass_set_path", mass_set_path);
                }
                check.description = prop.descriptions[prop.keys[key]];
                if (!check.description) {
                    check.description = ""+prop.ui_value_names[key];
                }
                check.onchange = makecb(key);
            }
          }
      }
      return frame;
    }
     listenum(inpath, name, enumDef, defaultval, callback, iconmap, packflag=0) {
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      let mass_set_path;
      if (name&&typeof name==="object") {
          let args=name;
          name = args.name;
          enumDef = args.enumDef;
          defaultval = args.defaultval;
          callback = args.callback;
          iconmap = args.iconmap;
          packflag = args.packflag||0;
          mass_set_path = args.mass_set_path;
      }
      mass_set_path = this._getMassPath(this.ctx, inpath, mass_set_path);
      let path;
      if (inpath!==undefined) {
          path = this._joinPrefix(inpath);
      }
      let ret=UIBase.createElement("dropbox-x");
      if (enumDef!==undefined) {
          if (__instance_of(enumDef, toolprop.EnumProperty)) {
              ret.prop = enumDef;
          }
          else {
            ret.prop = new toolprop.EnumProperty(defaultval, enumDef, path, name);
          }
          if (iconmap!==undefined) {
              ret.prop.addIcons(iconmap);
          }
      }
      else {
        let res=this.ctx.api.resolvePath(this.ctx, path, true);
        if (res!==undefined) {
            ret.prop = res.prop;
            name = name===undefined ? res.prop.uiname : name;
        }
      }
      mass_set_path = this._getMassPath(this.ctx, inpath, mass_set_path);
      if (path!==undefined) {
          ret.setAttribute("datapath", path);
      }
      if (mass_set_path!==undefined) {
          ret.setAttribute("mass_set_path", mass_set_path);
      }
      ret.setAttribute("name", name);
      if (defaultval) {
          ret.setValue(defaultval);
      }
      ret.onchange = callback;
      ret.onselect = callback;
      ret.packflag|=packflag;
      this._add(ret);
      return ret;
    }
     getroot() {
      let p=this;
      while (p.parent!==undefined) {
        p = p.parent;
      }
      return p;
    }
     simpleslider(inpath, name, defaultval, min, max, step, is_int, do_redraw, callback, packflag=0) {
      if (arguments.length===2||typeof name==="object") {
          let args=Object.assign({}, name);
          args.packflag = (args.packflag||0)|PackFlags.SIMPLE_NUMSLIDERS;
          return this.slider(inpath, args);
      }
      else {
        return this.slider(inpath, name, defaultval, min, max, step, is_int, do_redraw, callback, packflag|PackFlags.SIMPLE_NUMSLIDERS);
      }
    }
     slider(inpath, name, defaultval, min, max, step, is_int, do_redraw, callback, packflag=0) {
      if (arguments.length===2||typeof name==="object") {
          let args=name;
          name = args.name;
          defaultval = args.defaultval;
          min = args.min;
          max = args.max;
          step = args.step;
          is_int = args.is_int||args.isInt;
          do_redraw = args.do_redraw;
          callback = args.callback;
          packflag = args.packflag||0;
      }
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      let ret;
      if (inpath) {
          inpath = this._joinPrefix(inpath);
          let rdef=this.ctx.api.resolvePath(this.ctx, inpath, true);
          if (rdef&&rdef.prop&&(rdef.prop.flag&PropFlags.SIMPLE_SLIDER)) {
              packflag|=PackFlags.SIMPLE_NUMSLIDERS;
          }
          if (rdef&&rdef.prop&&(rdef.prop.flag&PropFlags.FORCE_ROLLER_SLIDER)) {
              packflag|=PackFlags.FORCE_ROLLER_SLIDER;
          }
      }
      let simple=(packflag&PackFlags.SIMPLE_NUMSLIDERS)||cconst.simpleNumSliders;
      simple = simple&&!(packflag&PackFlags.FORCE_ROLLER_SLIDER);
      let extraTextBox=cconst.useNumSliderTextboxes&&!(packflag&PackFlags.NO_NUMSLIDER_TEXTBOX);
      if (extraTextBox) {
          if (simple) {
              ret = UIBase.createElement("numslider-simple-x");
          }
          else {
            ret = UIBase.createElement("numslider-textbox-x");
          }
      }
      else {
        if (simple) {
            ret = UIBase.createElement("numslider-simple-x");
        }
        else {
          ret = UIBase.createElement("numslider-x");
        }
      }
      ret.packflag|=packflag;
      let decimals;
      if (inpath) {
          ret.setAttribute("datapath", inpath);
      }
      if (name) {
          ret.setAttribute("name", name);
      }
      if (min!==undefined) {
          ret.setAttribute("min", min);
      }
      if (max!==undefined) {
          ret.setAttribute("max", max);
      }
      if (defaultval!==undefined) {
          ret.setValue(defaultval);
      }
      if (is_int) {
          ret.setAttribute("integer", is_int);
      }
      if (decimals!==undefined) {
          ret.decimalPlaces = decimals;
      }
      if (callback) {
          ret.onchange = callback;
      }
      this._add(ret);
      if (this.ctx) {
          ret.setCSS();
          ret.update();
      }
      return ret;
    }
     _container_inherit(elem, packflag=0) {
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      elem.packflag|=packflag;
      elem.inherit_packflag|=packflag;
      elem.dataPrefix = this.dataPrefix;
      elem.massSetPrefix = this.massSetPrefix;
    }
     treeview() {
      let ret=UIBase.createElement("tree-view-x");
      ret.ctx = this.ctx;
      this.add(ret);
      this._container_inherit(ret);
      return ret;
    }
     panel(name, id, packflag=0, tooltip=undefined) {
      id = id===undefined ? name : id;
      let ret=UIBase.createElement("panelframe-x");
      this._container_inherit(ret, packflag);
      if (tooltip) {
          ret.setHeaderToolTip(tooltip);
      }
      ret.setAttribute("label", name);
      ret.setAttribute("id", id);
      this._add(ret);
      if (this.ctx) {
          ret.ctx = this.ctx;
          ret._init();
          ret.contents.ctx = ret.ctx;
      }
      ret.contents.dataPrefix = this.dataPrefix;
      ret.contents.massSetPrefix = this.massSetPrefix;
      return ret;
    }
     row(packflag=0) {
      let ret=UIBase.createElement("rowframe-x");
      this._container_inherit(ret, packflag);
      this._add(ret);
      ret.ctx = this.ctx;
      return ret;
    }
     listbox(packflag=0) {
      let ret=UIBase.createElement("listbox-x");
      this._container_inherit(ret, packflag);
      this._add(ret);
      return ret;
    }
     table(packflag=0) {
      let ret=UIBase.createElement("tableframe-x");
      this._container_inherit(ret, packflag);
      this._add(ret);
      return ret;
    }
     twocol(parentDepth=1, packflag=0) {
      let ret=UIBase.createElement("two-column-x");
      ret.parentDepth = parentDepth;
      this._container_inherit(ret, packflag);
      this._add(ret);
      return ret;
    }
     col(packflag=0) {
      let ret=UIBase.createElement("colframe-x");
      this._container_inherit(ret, packflag);
      this._add(ret);
      return ret;
    }
     colorPicker(inpath, packflag_or_args=0, mass_set_path=undefined, themeOverride=undefined) {
      let packflag;
      if (typeof packflag_or_args==="object") {
          let args=packflag_or_args;
          packflag = args.packflag!==undefined ? args.packflag : 0;
          mass_set_path = args.massSetPath;
          themeOverride = args.themeOverride;
      }
      let path;
      if (inpath) {
          path = this._joinPrefix(inpath);
      }
      let ret=UIBase.createElement("colorpicker-x");
      if (themeOverride) {
          ret.overrideClass(themeOverride);
      }
      packflag|=PackFlags.SIMPLE_NUMSLIDERS;
      this._container_inherit(ret, packflag);
      ret.ctx = this.ctx;
      ret.parentWidget = this;
      ret._init();
      ret.packflag|=packflag;
      ret.inherit_packflag|=packflag;
      ret.constructor.setDefault(ret);
      if (path!==undefined) {
          ret.setAttribute("datapath", path);
      }
      console.warn("mass_set_path", mass_set_path);
      if (mass_set_path) {
          ret.setAttribute("mass_set_path", mass_set_path);
      }
      window.colorpicker = ret;
      this._add(ret);
      return ret;
    }
     textarea(datapath=undefined, value="", packflag=0, mass_set_path=undefined) {
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      mass_set_path = this._getMassPath(this.ctx, datapath, mass_set_path);
      let ret=UIBase.createElement("rich-text-editor-x");
      ret.ctx = this.ctx;
      ret.packflag|=packflag;
      if (value!==undefined) {
          ret.value = value;
      }
      if (datapath)
        ret.setAttribute("datapath", datapath);
      if (mass_set_path)
        ret.setAttribute("mass_set_path", mass_set_path);
      this.add(ret);
      return ret;
    }
     viewer(datapath=undefined, value="", packflag=0, mass_set_path=undefined) {
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      mass_set_path = this._getMassPath(this.ctx, datapath, mass_set_path);
      let ret=UIBase.createElement("html-viewer-x");
      ret.ctx = this.ctx;
      ret.packflag|=packflag;
      if (value!==undefined) {
          ret.value = value;
      }
      if (datapath)
        ret.setAttribute("datapath", datapath);
      if (mass_set_path)
        ret.setAttribute("mass_set_path", mass_set_path);
      this.add(ret);
      return ret;
    }
     tabs(position="top", packflag=0) {
      let ret=UIBase.createElement("tabcontainer-x");
      ret.constructor.setDefault(ret);
      ret.setAttribute("bar_pos", position);
      this._container_inherit(ret, packflag);
      this._add(ret);
      return ret;
    }
     asDialogFooter() {
      this.style['margin-top'] = '15px';
      this.style['justify-content'] = 'flex-end';
      return this;
    }
  }
  _ESClass.register(Container);
  _es6_module.add_class(Container);
  Container = _es6_module.add_export('Container', Container);
  
  ui_base.UIBase.internalRegister(Container, "div");
  class RowFrame extends Container {
     constructor() {
      super();
    }
    static  define() {
      return {tagname: 'rowframe-x'}
    }
     connectedCallback() {
      super.connectedCallback();
      this.style['display'] = 'flex';
      this.style['flex-direction'] = this.reversed ? 'row-reverse' : 'row';
    }
     init() {
      super.init();
      this.style['display'] = 'flex';
      this.style['flex-direction'] = this.reversed ? 'row-reverse' : 'row';
      if (!this.style['align-items']||this.style['align-items']=='') {
          this.style['align-items'] = 'center';
      }
      if (this.getDefault("slider-style")==="simple") {
          this.packflag|=PackFlags.SIMPLE_NUMSLIDERS;
          this.inherit_packflag|=PackFlags.SIMPLE_NUMSLIDERS;
      }
    }
     oneAxisMargin(m=this.getDefault('oneAxisMargin'), m2=0) {
      this.style['margin-left'] = this.style['margin-right'] = m+'px';
      this.style['margin-top'] = this.style['margin-bottom'] = ''+m2+'px';
      return this;
    }
     oneAxisPadding(m=this.getDefault('oneAxisPadding'), m2=0) {
      this.style['padding-left'] = this.style['padding-right'] = ''+m+'px';
      this.style['padding-top'] = this.style['padding-bottom'] = ''+m2+'px';
      return this;
    }
     update() {
      super.update();
    }
  }
  _ESClass.register(RowFrame);
  _es6_module.add_class(RowFrame);
  RowFrame = _es6_module.add_export('RowFrame', RowFrame);
  UIBase.internalRegister(RowFrame);
  class ColumnFrame extends Container {
     constructor() {
      super();
    }
    static  define() {
      return {tagname: "colframe-x"}
    }
     init() {
      super.init();
      this.style["display"] = "flex";
      this.style["flex-direction"] = "column";
      this.style["justify-content"] = "right";
    }
     update() {
      super.update();
    }
     oneAxisMargin(m=this.getDefault('oneAxisMargin'), m2=0) {
      this.style['margin-top'] = this.style['margin-bottom'] = ''+m+'px';
      this.style['margin-left'] = this.style['margin-right'] = m2+'px';
      return this;
    }
     oneAxisPadding(m=this.getDefault('oneAxisPadding'), m2=0) {
      this.style['padding-top'] = this.style['padding-bottom'] = ''+m+'px';
      this.style['padding-left'] = this.style['padding-right'] = ''+m2+'px';
      return this;
    }
  }
  _ESClass.register(ColumnFrame);
  _es6_module.add_class(ColumnFrame);
  ColumnFrame = _es6_module.add_export('ColumnFrame', ColumnFrame);
  UIBase.internalRegister(ColumnFrame);
  class TwoColumnFrame extends Container {
     constructor() {
      super();
      this._colWidth = 256;
      this.parentDepth = 1;
    }
    get  colWidth() {
      if (this.hasAttribute("colWidth")) {
          return parsepx(this.getAttribute("colWidth"));
      }
      return this._colWidth;
    }
    set  colWidth(v) {
      if (this.hasAttribute("colWidth")) {
          this.setAttribute("colWidth", ""+v);
      }
      else {
        this._colWidth = v;
      }
    }
    static  define() {
      return {tagname: "two-column-x"}
    }
     init() {
      super.init();
      this.style["display"] = "flex";
      this.style["flex-direction"] = "column";
    }
     update() {
      super.update();
      let p=this;
      for (let i=0; i<this.parentDepth; i++) {
          p = p.parentWidget ? p.parentWidget : p;
      }
      if (!p) {
          return ;
      }
      let r=p.getBoundingClientRect();
      if (!r) {
          return ;
      }
      let style=r.width>this.colWidth*2.0 ? 'row' : 'column';
      if (this.style["flex-direction"]!==style) {
          this.style["flex-direction"] = style;
      }
    }
  }
  _ESClass.register(TwoColumnFrame);
  _es6_module.add_class(TwoColumnFrame);
  TwoColumnFrame = _es6_module.add_export('TwoColumnFrame', TwoColumnFrame);
  UIBase.internalRegister(TwoColumnFrame);
}, '/dev/fairmotion/src/path.ux/scripts/core/ui.js');


es6_module_define('ui_base', ["../path-controller/util/util.js", "../path-controller/controller/controller.js", "./anim.js", "../path-controller/util/simple_events.js", "./aspect.js", "./ui_consts.js", "../path-controller/util/vectormath.js", "./units.js", "../path-controller/toolsys/toolprop.js", "../path-controller/util/math.js", "./theme.js", "../icon_enum.js", "./ui_theme.js", "../screen/area_wrangler.js", "../util/colorutils.js", "../config/const.js"], function _ui_base_module(_es6_module) {
  var contextWrangler=es6_import_item(_es6_module, '../screen/area_wrangler.js', 'contextWrangler');
  let _ui_base=undefined;
  let TextBox=undefined;
  function _setTextboxClass(cls) {
    TextBox = cls;
  }
  _setTextboxClass = _es6_module.add_export('_setTextboxClass', _setTextboxClass);
  var Animator=es6_import_item(_es6_module, './anim.js', 'Animator');
  es6_import(_es6_module, './units.js');
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var vectormath=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  var math=es6_import(_es6_module, '../path-controller/util/math.js');
  var toolprop=es6_import(_es6_module, '../path-controller/toolsys/toolprop.js');
  var pushModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'popModalLight');
  var copyEvent=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'copyEvent');
  var pathDebugEvent=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'pathDebugEvent');
  var haveModal=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'haveModal');
  var keymap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'keymap');
  var reverse_keymap=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'reverse_keymap');
  var pushPointerModal=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'pushPointerModal');
  var getDataPathToolOp=es6_import_item(_es6_module, '../path-controller/controller/controller.js', 'getDataPathToolOp');
  var units=es6_import(_es6_module, './units.js');
  var rgb_to_hsv=es6_import_item(_es6_module, '../util/colorutils.js', 'rgb_to_hsv');
  var hsv_to_rgb=es6_import_item(_es6_module, '../util/colorutils.js', 'hsv_to_rgb');
  var ___ui_theme_js=es6_import(_es6_module, './ui_theme.js');
  for (let k in ___ui_theme_js) {
      _es6_module.add_export(k, ___ui_theme_js[k], true);
  }
  var CSSFont=es6_import_item(_es6_module, './ui_theme.js', 'CSSFont');
  var theme=es6_import_item(_es6_module, './ui_theme.js', 'theme');
  var parsepx=es6_import_item(_es6_module, './ui_theme.js', 'parsepx');
  var compatMap=es6_import_item(_es6_module, './ui_theme.js', 'compatMap');
  var DefaultTheme=es6_import_item(_es6_module, './theme.js', 'DefaultTheme');
  let ElementClasses=[];
  ElementClasses = _es6_module.add_export('ElementClasses', ElementClasses);
  let _ex_theme=es6_import_item(_es6_module, './ui_theme.js', 'theme');
  _es6_module.add_export('theme', _ex_theme, true);
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  window.__cconst = cconst;
  let Vector4=vectormath.Vector4;
  let _ex_Icons=es6_import_item(_es6_module, '../icon_enum.js', 'Icons');
  _es6_module.add_export('Icons', _ex_Icons, true);
  var Icons=es6_import_item(_es6_module, '../icon_enum.js', 'Icons');
  let _ex_setIconMap=es6_import_item(_es6_module, '../icon_enum.js', 'setIconMap');
  _es6_module.add_export('setIconMap', _ex_setIconMap, true);
  var setIconMap=es6_import_item(_es6_module, '../icon_enum.js', 'setIconMap');
  var AfterAspect=es6_import_item(_es6_module, './aspect.js', 'AfterAspect');
  var initAspectClass=es6_import_item(_es6_module, './aspect.js', 'initAspectClass');
  var aspect=es6_import(_es6_module, './aspect.js');
  const EnumProperty=toolprop.EnumProperty;
  let Area;
  let _setAreaClass=(cls) =>    {
    Area = cls;
  }
  _setAreaClass = _es6_module.add_export('_setAreaClass', _setAreaClass);
  const ErrorColors={WARNING: "yellow", 
   ERROR: "red", 
   OK: "green"}
  _es6_module.add_export('ErrorColors', ErrorColors);
  window.__theme = theme;
  let registered_has_happened=false;
  let tagPrefix="";
  const EventCBSymbol=Symbol("wrapped event callback");
  function calcElemCBKey(elem, type, options) {
    return elem._id+":"+type+":"+JSON.stringify(options||{});
  }
  function setTagPrefix(prefix) {
    if (registered_has_happened) {
        throw new Error("have to call ui_base.setTagPrefix before loading any other path.ux modules");
    }
    tagPrefix = ""+prefix;
  }
  setTagPrefix = _es6_module.add_export('setTagPrefix', setTagPrefix);
  function getTagPrefix(prefix) {
    return tagPrefix;
  }
  getTagPrefix = _es6_module.add_export('getTagPrefix', getTagPrefix);
  let prefix=document.getElementById("pathux-tag-prefix");
  if (prefix) {
      console.log("Found pathux-tag-prefix element");
      prefix = prefix.innerText.trim();
      setTagPrefix(prefix);
  }
  var ClassIdSymbol=es6_import_item(_es6_module, './ui_consts.js', 'ClassIdSymbol');
  ClassIdSymbol = _es6_module.add_export('ClassIdSymbol', ClassIdSymbol);
  let class_idgen=1;
  function setTheme(theme2) {
    for (let k in theme2) {
        let v=theme2[k];
        if (typeof v!=="object") {
            theme[k] = v;
            continue;
        }
        let v0=theme[k];
        if (!(k in theme)) {
            theme[k] = {};
        }
        for (let k2 in v) {
            if (k2 in compatMap) {
                let k3=compatMap[k2];
                if (v[k3]===undefined) {
                    v[k3] = v[k2];
                }
                delete v[k2];
                k2 = k3;
            }
            theme[k][k2] = v[k2];
        }
    }
  }
  setTheme = _es6_module.add_export('setTheme', setTheme);
  setTheme(DefaultTheme);
  let _last_report=util.time_ms();
  function report() {
    if (util.time_ms()-_last_report>350) {
        console.warn(...arguments);
        _last_report = util.time_ms();
    }
  }
  report = _es6_module.add_export('report', report);
  function getDefault(key, elem) {
    console.warn("Deprecated call to ui_base.js:getDefault");
    if (key in theme.base) {
        return theme.base[key];
    }
    else {
      throw new Error("Unknown default "+key);
    }
  }
  getDefault = _es6_module.add_export('getDefault', getDefault);
  function IsMobile() {
    console.warn("ui_base.IsMobile is deprecated; use util.isMobile instead");
    return util.isMobile();
  }
  IsMobile = _es6_module.add_export('IsMobile', IsMobile);
  
  let keys=["margin", "padding", "margin-block-start", "margin-block-end"];
  keys = keys.concat(["padding-block-start", "padding-block-end"]);
  keys = keys.concat(["margin-left", "margin-top", "margin-bottom", "margin-right"]);
  keys = keys.concat(["padding-left", "padding-top", "padding-bottom", "padding-right"]);
  const marginPaddingCSSKeys=keys;
  _es6_module.add_export('marginPaddingCSSKeys', marginPaddingCSSKeys);
  class _IconManager  {
     constructor(image, tilesize, number_of_horizontal_tiles, drawsize) {
      this.tilex = number_of_horizontal_tiles;
      this.tilesize = tilesize;
      this.drawsize = drawsize;
      this.customIcons = new Map();
      this.image = image;
      this.promise = undefined;
      this._accept = undefined;
      this._reject = undefined;
    }
    get  ready() {
      return this.image&&this.image.width;
    }
     onReady() {
      if (this.ready) {
          return new Promise((accept, reject) =>            {
            accept(this);
          });
      }
      if (this.promise) {
          return this.promise;
      }
      let onload=this.image.onload;
      this.image.onload = (e) =>        {
        if (onload) {
            onload.call(this.image, e);
        }
        if (!this._accept) {
            return ;
        }
        let accept=this._accept;
        this._accept = this._reject = this.promise = undefined;
        if (this.image.width) {
            accept(this);
        }
      };
      this.promise = new util.TimeoutPromise((accept, reject) =>        {
        this._accept = accept;
        this._reject = reject;
      }, 15000, true);
      this.promise.catch((error) =>        {
        util.print_stack(error);
        this.promise = this._accept = this._reject = undefined;
      });
      return this.promise;
    }
     canvasDraw(elem, canvas, g, icon, x=0, y=0) {
      let customIcon=this.customIcons.get(icon);
      if (customIcon) {
          g.drawImage(customIcon.canvas, x, y);
          return ;
      }
      let tx=icon%this.tilex;
      let ty=~~(icon/this.tilex);
      let dpi=elem.getDPI();
      let ts=this.tilesize;
      let ds=this.drawsize;
      if (!this.image) {
          return ;
      }
      try {
        g.drawImage(this.image, tx*ts, ty*ts, ts, ts, x, y, ds*dpi, ds*dpi);
      }
      catch (error) {
          console.log("failed to draw an icon");
      }
    }
     setCSS(icon, dom, fitsize=undefined) {
      if (!fitsize) {
          fitsize = this.drawsize;
      }
      if (typeof fitsize==="object") {
          fitsize = Math.max(fitsize[0], fitsize[1]);
      }
      dom.style["background"] = this.getCSS(icon, fitsize);
      if (this.customIcons.has(icon)) {
          dom.style["background-size"] = (fitsize)+"px";
      }
      else {
        dom.style["background-size"] = (fitsize*this.tilex)+"px";
      }
      dom.style["background-clip"] = "content-box";
      if (!dom.style["width"]) {
          dom.style["width"] = this.drawsize+"px";
      }
      if (!dom.style["height"]) {
          dom.style["height"] = this.drawsize+"px";
      }
    }
     getCSS(icon, fitsize=this.drawsize) {
      if (icon===-1) {
          return '';
      }
      if (typeof fitsize==="object") {
          fitsize = Math.max(fitsize[0], fitsize[1]);
      }
      let ratio=fitsize/this.tilesize;
      let customIcon=this.customIcons.get(icon);
      if (customIcon!==undefined) {
          let d=0.0;
          let css=`url("${customIcon.blobUrl}")`;
          return css;
      }
      let x=(-(icon%this.tilex)*this.tilesize)*ratio;
      let y=(-(~~(icon/this.tilex))*this.tilesize)*ratio;
      return `url("${this.image.src}") ${x}px ${y}px`;
    }
  }
  _ESClass.register(_IconManager);
  _es6_module.add_class(_IconManager);
  class CustomIcon  {
     constructor(manager, key, id, baseImage) {
      this.key = key;
      this.baseImage = baseImage;
      this.images = [];
      this.id = id;
      this.manager = manager;
    }
     regenIcons() {
      let manager=this.manager;
      let doSheet=(sheet) =>        {
        let size=sheet.drawsize;
        let canvas=document.createElement("canvas");
        let g=canvas.getContext("2d");
        canvas.width = canvas.height = size;
        g.drawImage(this.baseImage, 0, 0, size, size);
        canvas.toBlob((blob) =>          {
          let blobUrl=URL.createObjectURL(blob);
          sheet.customIcons.set(this.id, {blobUrl: blobUrl, 
       canvas: canvas});
        });
      };
      for (let sheet of manager.iconsheets) {
          doSheet(sheet);
      }
    }
  }
  _ESClass.register(CustomIcon);
  _es6_module.add_class(CustomIcon);
  CustomIcon = _es6_module.add_export('CustomIcon', CustomIcon);
  class IconManager  {
     constructor(images, sizes, horizontal_tile_count) {
      this.iconsheets = [];
      this.tilex = horizontal_tile_count;
      this.customIcons = new Map();
      this.customIconIDMap = new Map();
      for (let i=0; i<images.length; i++) {
          let size, drawsize;
          if (typeof sizes[i]=="object") {
              size = sizes[i][0], drawsize = sizes[i][1];
          }
          else {
            size = drawsize = sizes[i];
          }
          if (util.isMobile()) {
              drawsize = ~~(drawsize*theme.base.mobileSizeMultiplier);
          }
          this.iconsheets.push(new _IconManager(images[i], size, horizontal_tile_count, drawsize));
      }
    }
     isReady(sheet=0) {
      return this.iconsheets[sheet].ready;
    }
     addCustomIcon(key, image) {
      let icon=this.customIcons.get(key);
      if (!icon) {
          let maxid=0;
          for (let k in Icons) {
              maxid = Math.max(maxid, Icons[k]+1);
          }
          for (let icon of this.customIcons.values()) {
              maxid = Math.max(maxid, icon.id+1);
          }
          maxid = Math.max(maxid, 1000);
          let id=maxid;
          icon = new CustomIcon(this, key, id, image);
          this.customIcons.set(key, icon);
          this.customIconIDMap.set(id, icon);
      }
      icon.baseImage = image;
      icon.regenIcons();
      return icon.id;
    }
     load(manager2) {
      this.iconsheets = manager2.iconsheets;
      this.tilex = manager2.tilex;
      return this;
    }
     reset(horizontal_tile_count) {
      this.iconsheets.length = 0;
      this.tilex = horizontal_tile_count;
    }
     add(image, size, drawsize=size) {
      this.iconsheets.push(new _IconManager(image, size, this.tilex, drawsize));
      return this;
    }
     canvasDraw(elem, canvas, g, icon, x=0, y=0, sheet=0) {
      let base=this.iconsheets[sheet];
      sheet = this.findSheet(sheet);
      let ds=sheet.drawsize;
      sheet.drawsize = base.drawsize;
      sheet.canvasDraw(elem, canvas, g, icon, x, y);
      sheet.drawsize = ds;
    }
     findClosestSheet(size) {
      let sheets=this.iconsheets.concat([]);
      sheets.sort((a, b) =>        {
        return a.drawsize-b.drawsize;
      });
      let sheet;
      for (let i=0; i<sheets.length; i++) {
          if (sheets[i].drawsize<=size) {
              sheet = sheets[i];
              break;
          }
      }
      if (!sheet)
        sheet = sheets[sheets.length-1];
      return this.iconsheets.indexOf(sheet);
    }
     findSheet(sheet) {
      if (sheet===undefined) {
          console.warn("sheet was undefined");
          sheet = 0;
      }
      let base=this.iconsheets[sheet];
      let dpi=UIBase.getDPI();
      let minsheet=undefined;
      let goal=dpi*base.drawsize;
      for (let sheet of this.iconsheets) {
          minsheet = sheet;
          if (sheet.drawsize>=goal) {
              break;
          }
      }
      return minsheet===undefined ? base : minsheet;
    }
     getTileSize(sheet=0) {
      return this.iconsheets[sheet].drawsize;
      return this.findSheet(sheet).drawsize;
    }
     getRealSize(sheet=0) {
      return this.iconsheets[sheet].tilesize;
      return this.findSheet(sheet).tilesize;
    }
     getCSS(icon, sheet=0) {
      let base=this.iconsheets[sheet];
      sheet = this.findSheet(sheet);
      let ds=sheet.drawsize;
      sheet.drawsize = base.drawsize;
      let ret=sheet.getCSS(icon);
      sheet.drawsize = ds;
      return ret;
    }
     setCSS(icon, dom, sheet=0, fitsize=undefined) {
      let base=this.iconsheets[sheet];
      sheet = this.findSheet(sheet);
      let ds=sheet.drawsize;
      sheet.drawsize = base.drawsize;
      let ret=sheet.setCSS(icon, dom, fitsize);
      sheet.drawsize = ds;
      return ret;
    }
  }
  _ESClass.register(IconManager);
  _es6_module.add_class(IconManager);
  IconManager = _es6_module.add_export('IconManager', IconManager);
  let iconmanager=new IconManager([document.getElementById("iconsheet16"), document.getElementById("iconsheet32"), document.getElementById("iconsheet48")], [16, 32, 64], 16);
  iconmanager = _es6_module.add_export('iconmanager', iconmanager);
  window._iconmanager = iconmanager;
  let IconSheets={SMALL: 0, 
   LARGE: 1, 
   XLARGE: 2}
  IconSheets = _es6_module.add_export('IconSheets', IconSheets);
  function iconSheetFromPackFlag(flag) {
    if (flag&PackFlags.CUSTOM_ICON_SHEET) {
        return flag>>PackFlags.CUSTOM_ICON_SHEET_START;
    }
    if ((flag&PackFlags.SMALL_ICON)&&!(PackFlags.LARGE_ICON)) {
        return 0;
    }
    else {
      return 1;
    }
  }
  iconSheetFromPackFlag = _es6_module.add_export('iconSheetFromPackFlag', iconSheetFromPackFlag);
  function getIconManager() {
    return iconmanager;
  }
  getIconManager = _es6_module.add_export('getIconManager', getIconManager);
  function setIconManager(manager, IconSheetsOverride) {
    iconmanager.load(manager);
    if (IconSheetsOverride!==undefined) {
        for (let k in IconSheetsOverride) {
            IconSheets[k] = IconSheetsOverride[k];
        }
    }
  }
  setIconManager = _es6_module.add_export('setIconManager', setIconManager);
  function makeIconDiv(icon, sheet) {
    if (sheet===undefined) {
        sheet = 0;
    }
    let size=iconmanager.getRealSize(sheet);
    let drawsize=iconmanager.getTileSize(sheet);
    let icontest=document.createElement("div");
    icontest.style["width"] = icontest.style["min-width"] = drawsize+"px";
    icontest.style["height"] = icontest.style["min-height"] = drawsize+"px";
    icontest.style["margin"] = "0px";
    icontest.style["padding"] = "0px";
    iconmanager.setCSS(icon, icontest, sheet);
    return icontest;
  }
  makeIconDiv = _es6_module.add_export('makeIconDiv', makeIconDiv);
  let Vector2=vectormath.Vector2;
  let Matrix4=vectormath.Matrix4;
  let dpistack=[];
  dpistack = _es6_module.add_export('dpistack', dpistack);
  const UIFlags={}
  _es6_module.add_export('UIFlags', UIFlags);
  const internalElementNames={}
  const externalElementNames={}
  const PackFlags={INHERIT_WIDTH: 1, 
   INHERIT_HEIGHT: 2, 
   VERTICAL: 4, 
   USE_ICONS: 8, 
   SMALL_ICON: 16, 
   LARGE_ICON: 32, 
   FORCE_PROP_LABELS: 64, 
   PUT_FLAG_CHECKS_IN_COLUMNS: 128, 
   WRAP_CHECKBOXES: 256, 
   STRIP_HORIZ: 512, 
   STRIP_VERT: 1024, 
   STRIP: 512|1024, 
   SIMPLE_NUMSLIDERS: 2048, 
   FORCE_ROLLER_SLIDER: 4096, 
   HIDE_CHECK_MARKS: (1<<13), 
   NO_NUMSLIDER_TEXTBOX: (1<<14), 
   CUSTOM_ICON_SHEET: 1<<15, 
   CUSTOM_ICON_SHEET_START: 20, 
   NO_UPDATE: 1<<16}
  _es6_module.add_export('PackFlags', PackFlags);
  let first=(iter) =>    {
    if (iter===undefined) {
        return undefined;
    }
    if (!(Symbol.iterator in iter)) {
        for (let item in iter) {
            return item;
        }
        return undefined;
    }
    for (let item of iter) {
        return item;
    }
  }
  var DataPathError=es6_import_item(_es6_module, '../path-controller/controller/controller.js', 'DataPathError');
  var TimeoutPromise=es6_import_item(_es6_module, '../path-controller/util/util.js', 'TimeoutPromise');
  var IntProperty=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'IntProperty');
  var NumberConstraints=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'NumberConstraints');
  var PropFlags=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'PropFlags');
  let _mobile_theme_patterns=[/.*width.*/, /.*height.*/, /.*size.*/, /.*margin.*/, /.*pad/, /.*radius.*/];
  let _idgen=0;
  window._testSetScrollbars = function (color, contrast, width, border) {
    if (color===undefined) {
        color = "grey";
    }
    if (contrast===undefined) {
        contrast = 0.5;
    }
    if (width===undefined) {
        width = 15;
    }
    if (border===undefined) {
        border = "solid";
    }
    let buf=styleScrollBars(color, undefined, contrast, width, border, "*");
    CTX.screen.mergeGlobalCSS(buf);
    return buf;
  }
  function styleScrollBars(color, color2, contrast, width, border, selector) {
    if (color===undefined) {
        color = "grey";
    }
    if (color2===undefined) {
        color2 = undefined;
    }
    if (contrast===undefined) {
        contrast = 0.5;
    }
    if (width===undefined) {
        width = 15;
    }
    if (border===undefined) {
        border = "1px groove black";
    }
    if (selector===undefined) {
        selector = "*";
    }
    if (!color2) {
        let c=css2color(color);
        let a=c.length>3 ? c[3] : 1.0;
        c = rgb_to_hsv(c[0], c[1], c[2]);
        let inv=c.slice(0, c.length);
        inv[2] = 1.0-inv[2];
        inv[2]+=(c[2]-inv[2])*(1.0-contrast);
        inv = hsv_to_rgb(inv[0], inv[1], inv[2]);
        inv.length = 4;
        inv[3] = a;
        inv = color2css(inv);
        color2 = inv;
    }
    let buf=`

${selector} {
  scrollbar-width : ${width <= 16 ? 'thin' : 'auto'};
  scrollbar-color : ${color2} ${color};
}

${selector}::-webkit-scrollbar {
  width : ${width}px;
  background-color : ${color};
}

${selector}::-webkit-scrollbar-track {
  background-color : ${color};
  border : ${border};
}

${selector}::-webkit-scrollbar-thumb {
  background-color : ${color2};
  border : ${border};
}
    `;
    return buf;
  }
  styleScrollBars = _es6_module.add_export('styleScrollBars', styleScrollBars);
  window.styleScrollBars = styleScrollBars;
  let _digest=new util.HashDigest();
  function calcThemeKey(digest) {
    if (digest===undefined) {
        digest = _digest.reset();
    }
    for (let k in theme) {
        let obj=theme[k];
        if (typeof obj!=="object") {
            continue;
        }
        for (let k2 in obj) {
            let v2=obj[k2];
            if (typeof v2==="number"||typeof v2==="boolean"||typeof v2==="string") {
                digest.add(v2);
            }
            else 
              if (typeof v2==="object"&&__instance_of(v2, CSSFont)) {
                v2.calcHashUpdate(digest);
            }
        }
    }
    return digest.get();
  }
  calcThemeKey = _es6_module.add_export('calcThemeKey', calcThemeKey);
  var _themeUpdateKey=calcThemeKey();
  _themeUpdateKey = _es6_module.add_export('_themeUpdateKey', _themeUpdateKey);
  function flagThemeUpdate() {
    _themeUpdateKey = calcThemeKey();
  }
  flagThemeUpdate = _es6_module.add_export('flagThemeUpdate', flagThemeUpdate);
  let setTimeoutQueue=new Set();
  let haveTimeout=false;
  function timeout_cb() {
    if (setTimeoutQueue.size===0) {
        haveTimeout = false;
        return ;
    }
    for (let item of new Set(setTimeoutQueue)) {
        let $_t0knls=item, cb=$_t0knls.cb, timeout=$_t0knls.timeout, time=$_t0knls.time;
        if (util.time_ms()-time<timeout) {
            continue;
        }
        setTimeoutQueue.delete(item);
        try {
          cb();
        }
        catch (error) {
            console.error(error.stack);
        }
    }
    window.setTimeout(timeout_cb, 0);
  }
  function internalSetTimeout(cb, timeout) {
    if (timeout>100) {
        window.setTimeout(cb, timeout);
        return ;
    }
    setTimeoutQueue.add({cb: cb, 
    timeout: timeout, 
    time: util.time_ms()});
    if (!haveTimeout) {
        haveTimeout = true;
        window.setTimeout(timeout_cb, 0);
    }
  }
  internalSetTimeout = _es6_module.add_export('internalSetTimeout', internalSetTimeout);
  window.setTimeoutQueue = setTimeoutQueue;
  class UIBase extends HTMLElement {
     constructor() {
      super();
      this._modalstack = [];
      this._tool_tip_abort_delay = undefined;
      this._tooltip_ref = undefined;
      this._textBoxEvents = false;
      this._themeOverride = undefined;
      this._checkTheme = true;
      this._last_theme_update_key = _themeUpdateKey;
      this._client_disabled_set = undefined;
      this._useNativeToolTips = cconst.useNativeToolTips;
      this._useNativeToolTips_set = false;
      this._has_own_tooltips = undefined;
      this._tooltip_timer = util.time_ms();
      this.pathUndoGen = 0;
      this._lastPathUndoGen = 0;
      this._useDataPathUndo = undefined;
      this._active_animations = [];
      this._screenStyleTag = document.createElement("style");
      this._screenStyleUpdateHash = 0;
      initAspectClass(this, new Set(["appendChild", "animate", "shadow", "removeNode", "prepend", "add", "init"]));
      this.shadow = this.attachShadow({mode: 'open'});
      if (cconst.DEBUG.paranoidEvents) {
          this.__cbs = [];
      }
      this.shadow.appendChild(this._screenStyleTag);
      this.shadow._appendChild = this.shadow.appendChild;
      let appendChild=this.shadow.appendChild;
      this.shadow.appendChild = (child) =>        {
        if (child&&typeof child==="object"&&__instance_of(child, UIBase)) {
            child.parentWidget = this;
        }
        return this.shadow._appendChild(child);
      };
      this._wasAddedToNodeAtSomeTime = false;
      this.visibleToPick = true;
      this._override_class = undefined;
      this.parentWidget = undefined;
      let tagname=this.constructor.define().tagname;
      this._id = tagname.replace(/\-/g, "_")+(_idgen++);
      this.default_overrides = {};
      this.my_default_overrides = {};
      this.class_default_overrides = {};
      this._last_description = undefined;
      this._description_final = undefined;
      this._modaldata = undefined;
      this.packflag = this.getDefault("BasePackFlag");
      this._internalDisabled = false;
      this.__disabledState = false;
      this._disdata = undefined;
      this._ctx = undefined;
      this._description = undefined;
      let style=document.createElement("style");
      style.textContent = `
    .DefaultText {
      font: `+_getFont(this)+`;
    }
    `;
      this.shadow.appendChild(style);
      this._init_done = false;
      let do_touch=(e, type, button) =>        {
        if (haveModal()) {
            return ;
        }
        button = button===undefined ? 0 : button;
        let e2=copyEvent(e);
        if (e.touches.length===0) {
        }
        else {
          let t=e.touches[0];
          e2.pageX = t.pageX;
          e2.pageY = t.pageY;
          e2.screenX = t.screenX;
          e2.screenY = t.screenY;
          e2.clientX = t.clientX;
          e2.clientY = t.clientY;
          e2.x = t.x;
          e2.y = t.y;
        }
        e2.button = button;
        e2 = new MouseEvent(type, e2);
        e2.was_touch = true;
        e2.stopPropagation = e.stopPropagation.bind(e);
        e2.preventDefault = e.preventDefault.bind(e);
        e2.touches = e.touches;
        this.dispatchEvent(e2);
      };
      this.addEventListener("touchstart", (e) =>        {
        do_touch(e, "mousedown", 0);
      }, {passive: false});
      this.addEventListener("touchmove", (e) =>        {
        do_touch(e, "mousemove");
      }, {passive: false});
      this.addEventListener("touchcancel", (e) =>        {
        do_touch(e, "mouseup", 2);
      }, {passive: false});
      this.addEventListener("touchend", (e) =>        {
        do_touch(e, "mouseup", 0);
      }, {passive: false});
      if (this.constructor.define().havePickClipboard) {
          this._clipboardHotkeyInit();
      }
    }
    get  useNativeToolTips() {
      return this._useNativeToolTips;
    }
    set  useNativeToolTips(val) {
      this._useNativeToolTips = val;
      this._useNativeToolTips_set = true;
    }
    get  parentWidget() {
      return this._parentWidget;
    }
    set  parentWidget(val) {
      if (val) {
          this._wasAddedToNodeAtSomeTime = true;
      }
      this._parentWidget = val;
    }
    get  useDataPathUndo() {
      let p=this;
      while (p) {
        if (p._useDataPathUndo!==undefined) {
            return p._useDataPathUndo;
        }
        p = p.parentWidget;
      }
      return false;
    }
    set  useDataPathUndo(val) {
      this._useDataPathUndo = val;
    }
    get  description() {
      return this._description;
    }
    set  description(val) {
      if (val===null) {
          this._description = undefined;
          return ;
      }
      this._description = val;
      if (val===undefined||val===null) {
          return ;
      }
      if (cconst.showPathsInToolTips&&this.hasAttribute("datapath")) {
          let s=""+this._description;
          let path=this.getAttribute("datapath");
          s+="\n    path: "+path;
          if (this.hasAttribute("mass_set_path")) {
              let m=this.getAttribute("mass_set_path");
              s+="\n    massSetPath: "+m;
          }
          this._description_final = s;
      }
      if (cconst.useNativeToolTips) {
          this.title = ""+this._description_final;
      }
    }
    get  background() {
      return this.__background;
    }
    set  background(bg) {
      this.__background = bg;
      this.overrideDefault("background-color", bg, true);
      this.style["background-color"] = bg;
    }
    get  disabled() {
      if (this.parentWidget&&this.parentWidget.disabled) {
          return true;
      }
      return !!this._client_disabled_set||!!this._internalDisabled;
    }
    set  disabled(v) {
      this._client_disabled_set = v;
      this.__updateDisable(this.disabled);
    }
    get  internalDisabled() {
      return this._internalDisabled;
    }
    set  internalDisabled(val) {
      this._internalDisabled = !!val;
      this.__updateDisable(this.disabled);
    }
    get  ctx() {
      return this._ctx;
    }
    set  ctx(c) {
      this._ctx = c;
      this._forEachChildWidget((n) =>        {
        n.ctx = c;
      });
    }
    get  _reportCtxName() {
      return ""+this._id;
    }
    get  modalRunning() {
      return this._modaldata!==undefined;
    }
    static  getIconEnum() {
      return Icons;
    }
    static  setDefault(element) {
      return element;
    }
    static  getDPI() {
      return window.devicePixelRatio;
      return window.devicePixelRatio;
    }
    static  prefix(name) {
      return tagPrefix+name;
    }
    static  internalRegister(cls) {
      cls[ClassIdSymbol] = class_idgen++;
      registered_has_happened = true;
      internalElementNames[cls.define().tagname] = this.prefix(cls.define().tagname);
      customElements.define(this.prefix(cls.define().tagname), cls);
    }
    static  getInternalName(name) {
      return internalElementNames[name];
    }
    static  createElement(name, internal=false) {
      if (!internal&&name in externalElementNames) {
          return document.createElement(name);
      }
      else 
        if (name in internalElementNames) {
          return document.createElement(internalElementNames[name]);
      }
      else {
        return document.createElement(name);
      }
    }
    static  register(cls) {
      registered_has_happened = true;
      cls[ClassIdSymbol] = class_idgen++;
      ElementClasses.push(cls);
      externalElementNames[cls.define().tagname] = cls.define().tagname;
      customElements.define(cls.define().tagname, cls);
    }
    static  define() {
      throw new Error("Missing define() for ux element");
    }
     setUndo(val) {
      this.useDataPathUndo = val;
      return this;
    }
     hide(sethide=true) {
      this.hidden = sethide;
      for (let n of this.shadow.childNodes) {
          n.hidden = sethide;
      }
      this._forEachChildWidget((n) =>        {
        n.hide(sethide);
      });
    }
     getElementById(id) {
      let ret;
      let rec=(n) =>        {
        if (ret) {
            return ;
        }
        if (n.getAttribute("id")===id||n.id===id) {
            ret = n;
        }
        if (__instance_of(n, UIBase)&&n.constructor.define().tagname==="panelframe-x") {
            rec(n.contents);
        }
        else 
          if (__instance_of(n, UIBase)&&n.constructor.define().tagname==="tabcontainer-x") {
            for (let k in n.tabs) {
                let tab=n.tabs[k];
                if (tab) {
                    rec(tab);
                }
            }
        }
        for (let n2 of n.childNodes) {
            if (__instance_of(n2, HTMLElement)) {
                rec(n2);
                if (ret) {
                    break;
                }
            }
        }
        if (n.shadow) {
            for (let n2 of n.shadow.childNodes) {
                if (__instance_of(n2, HTMLElement)) {
                    rec(n2);
                    if (ret) {
                        break;
                    }
                }
            }
        }
      };
      rec(this);
      return ret;
    }
     unhide() {
      this.hide(false);
    }
     findArea() {
      let p=this;
      while (p) {
        if (__instance_of(p, Area)) {
            return p;
        }
        p = p.parentWidget;
      }
      return p;
    }
     addEventListener(type, cb, options) {
      if (cconst.DEBUG.domEventAddRemove) {
          console.log("addEventListener", type, this._id, options);
      }
      let cb2=(e) =>        {
        if (cconst.DEBUG.paranoidEvents) {
            if (this.isDead()) {
                this.removeEventListener(type, cb, options);
                return ;
            }
        }
        if (cconst.DEBUG.domEvents) {
            pathDebugEvent(e);
        }
        let area=this.findArea();
        if (area) {
            area.push_ctx_active();
            try {
              let ret=cb(e);
              area.pop_ctx_active();
              return ret;
            }
            catch (error) {
                area.pop_ctx_active();
                throw error;
            }
        }
        else {
          if (cconst.DEBUG.areaContextPushes) {
              console.warn("Element is not part of an area?", element);
          }
          return cb(e);
        }
      };
      if (!cb[EventCBSymbol]) {
          cb[EventCBSymbol] = new Map();
      }
      let key=calcElemCBKey(this, type, options);
      cb[EventCBSymbol].set(key, cb2);
      if (cconst.DEBUG.paranoidEvents) {
          this.__cbs.push([type, cb2, options]);
      }
      return super.addEventListener(type, cb2, options);
    }
     removeEventListener(type, cb, options) {
      if (cconst.DEBUG.paranoidEvents) {
          for (let item of this.__cbs) {
              if (item[0]==type&&item[1]===cb._cb2&&(""+item[2])===(""+options)) {
                  this.__cbs.remove(item);
                  break;
              }
          }
      }
      if (cconst.DEBUG.domEventAddRemove) {
          console.log("removeEventListener", type, this._id, options);
      }
      let key=calcElemCBKey(this, type, options);
      if (!cb[EventCBSymbol]||!cb[EventCBSymbol].has(key)) {
          return super.removeEventListener(type, cb, options);
      }
      else {
        let cb2=cb[EventCBSymbol].get(key);
        let ret=super.removeEventListener(type, cb2, options);
        cb[EventCBSymbol].delete(key);
        return ret;
      }
    }
     connectedCallback() {

    }
     noMarginsOrPadding() {
      return ;
      let keys=["margin", "padding", "margin-block-start", "margin-block-end"];
      keys = keys.concat(["padding-block-start", "padding-block-end"]);
      keys = keys.concat(["margin-left", "margin-top", "margin-bottom", "margin-right"]);
      keys = keys.concat(["padding-left", "padding-top", "padding-bottom", "padding-right"]);
      for (let k of keys) {
          this.style[k] = "0px";
      }
      return this;
    }
     regenTabOrder() {
      let screen=this.getScreen();
      if (screen!==undefined) {
          screen.needsTabRecalc = true;
      }
      return this;
    }
     noMargins() {
      this.style["margin"] = this.style["margin-left"] = this.style["margin-right"] = "0px";
      this.style["margin-top"] = this.style["margin-bottom"] = "0px";
      return this;
    }
     noPadding() {
      this.style["padding"] = this.style["padding-left"] = this.style["padding-right"] = "0px";
      this.style["padding-top"] = this.style["padding-bottom"] = "0px";
      return this;
    }
     getTotalRect() {
      let found=false;
      let min=new Vector2([1e+17, 1e+17]);
      let max=new Vector2([-1e+17, -1e+17]);
      let doaabb=(n) =>        {
        let rs=n.getClientRects();
        for (let r of rs) {
            min[0] = Math.min(min[0], r.x);
            min[1] = Math.min(min[1], r.y);
            max[0] = Math.max(max[0], r.x+r.width);
            max[1] = Math.max(max[1], r.y+r.height);
            found = true;
        }
      };
      doaabb(this);
      this._forEachChildWidget((n) =>        {
        doaabb(n);
      });
      if (found) {
          return {width: max[0]-min[0], 
       height: max[1]-min[1], 
       x: min[0], 
       y: min[1], 
       left: min[0], 
       top: min[1], 
       right: max[0], 
       bottom: max[1]}
      }
      else {
        return undefined;
      }
    }
     parseNumber(value, args={}) {
      value = (""+value).trim().toLowerCase();
      let baseUnit=args.baseUnit||this.baseUnit;
      let isInt=args.isInt||this.isInt;
      let sign=1.0;
      if (value.startsWith("-")) {
          value = value.slice(1, value.length).trim();
          sign = -1;
      }
      let hexre=/-?[0-9a-f]+h$/;
      if (value.startsWith("0b")) {
          value = value.slice(2, value.length).trim();
          value = parseInt(value, 2);
      }
      else 
        if (value.startsWith("0x")) {
          value = value.slice(2, value.length).trim();
          value = parseInt(value, 16);
      }
      else 
        if (value.search(hexre)===0) {
          value = value.slice(0, value.length-1).trim();
          value = parseInt(value, 16);
      }
      else {
        value = units.parseValue(value, baseUnit);
      }
      if (isInt) {
          value = ~~value;
      }
      return value*sign;
    }
     formatNumber(value, args={}) {
      let baseUnit=args.baseUnit||this.baseUnit;
      let displayUnit=args.displayUnit||this.displayUnit;
      let isInt=args.isInt||this.isInt;
      let radix=args.radix||this.radix||10;
      let decimalPlaces=args.decimalPlaces||this.decimalPlaces;
      if (isInt&&radix!==10) {
          let ret=Math.floor(value).toString(radix);
          if (radix===2)
            return "0b"+ret;
          else 
            if (radix===16)
            return ret+"h";
      }
      return units.buildString(value, baseUnit, decimalPlaces, displayUnit);
    }
     setBoxCSS(subkey) {
      let boxcode='';
      let keys=["left", "right", "top", "bottom"];
      let sub;
      if (subkey) {
          sub = this.getAttribute(subkey)||{};
      }
      let def=(key) =>        {
        if (sub) {
            return this.getSubDefault(subkey, key);
        }
        return this.getDefault(key);
      };
      for (let i=0; i<2; i++) {
          let key=i ? "padding" : "margin";
          this.style[key] = "unset";
          let val=def(key);
          if (val!==undefined) {
              for (let j=0; j<4; j++) {
                  this.style[key+"-"+keys[j]] = val+"px";
              }
          }
          for (let j=0; j<4; j++) {
              let key2=`${key}-${keys[j]}`;
              let val2=def(key2);
              if (val2!==undefined) {
                  this.style[key2] = val2+"px";
              }
          }
      }
      this.style["border-radius"] = def("border-radius")+"px";
      this.style["border"] = `${def("border-width")}px ${def("border-style")} ${def("border-color")}`;
    }
     genBoxCSS(subkey) {
      let boxcode='';
      let keys=["left", "right", "top", "bottom"];
      let sub;
      if (subkey) {
          sub = this.getAttribute(subkey)||{};
      }
      let def=(key) =>        {
        if (sub) {
            return this.getSubDefault(subkey, key);
        }
        return this.getDefault(key);
      };
      for (let i=0; i<2; i++) {
          let key=i ? "padding" : "margin";
          let val=def(key);
          if (val!==undefined) {
              boxcode+=`${key}: ${val} px;\n`;
          }
          for (let j=0; j<4; j++) {
              let key2=`${key}-${keys[j]}`;
              let val2=def(key2);
              if (val2!==undefined) {
                  boxcode+=`${key2}: ${val}px;\n`;
              }
          }
      }
      boxcode+=`border-radius: ${def("border-radius")}px;\n`;
      boxcode+=`border: ${def("border-width")}px ${def("border-style")} ${def("border-color")};\n`;
      return boxcode;
    }
     setCSS(setBG=true) {
      if (setBG) {
          let bg=this.getDefault("background-color");
          if (bg) {
              this.style["background-color"] = bg;
          }
      }
      let zoom=this.getZoom();
      if (zoom===1.0) {
          return ;
      }
      let transform=""+this.style["transform"];
      transform = transform.replace(/[ \t\n\r]+/g, ' ');
      transform = transform.replace(/, /g, ',');
      let transform2=transform.replace(/scale\([^)]+\)/, '').trim();
      this.style["transform"] = transform2+` scale(${zoom},${zoom})`;
    }
     flushSetCSS() {
      this._init();
      this.setCSS();
      this._forEachChildWidget((c) =>        {
        if (!(c.packflag&PackFlags.NO_UPDATE)) {
            c.flushSetCSS();
        }
      });
    }
     replaceChild(newnode, node) {
      for (let i=0; i<this.childNodes.length; i++) {
          if (this.childNodes[i]===node) {
              super.replaceChild(newnode, node);
              return true;
          }
      }
      for (let i=0; i<this.shadow.childNodes.length; i++) {
          if (this.shadow.childNodes[i]===node) {
              this.shadow.replaceChild(newnode, node);
              return true;
          }
      }
      console.error("Unknown child node", node);
      return false;
    }
     swapWith(b) {
      let p1=this.parentNode;
      let p2=b.parentNode;
      if (this.parentWidget&&(p1===this.parentWidget.shadow)||p1===null) {
          p1 = this.parentWidget;
      }
      if (b.parentWidget&&(p2===b.parentWidget.shadow)||p2===null) {
          p2 = b.parentWidget;
      }
      if (!p1||!p2) {
          console.error("Invalid call to UIBase.prototype.swapWith", this, b, p1, p2);
          return false;
      }
      let getPos=(n, p) =>        {
        let i=Array.prototype.indexOf.call(p.childNodes, n);
        if (i<0&&p.shadow) {
            p = p.shadow;
            i = Array.prototype.indexOf.call(p.childNodes, n);
        }
        return [i, p];
      };
      let $_t1jcrd=getPos(this, p1), i1=$_t1jcrd[0], n1=$_t1jcrd[1];
      let $_t2aqfb=getPos(b, p2), i2=$_t2aqfb[0], n2=$_t2aqfb[1];
      console.log("i1, i2, n1, n2", i1, i2, n1, n2);
      let tmp1=document.createElement("div");
      let tmp2=document.createElement("div");
      n1.insertBefore(tmp1, this);
      n2.insertBefore(tmp2, b);
      n1.replaceChild(b, tmp1);
      n2.replaceChild(this, tmp2);
      let ptmp=this.parentWidget;
      this.parentWidget = b.parentWidget;
      b.parentWidget = ptmp;
      tmp1.remove();
      tmp2.remove();
      return true;
    }
     traverse(type_or_set) {
      let this2=this;
      let classes=type_or_set;
      let is_set=__instance_of(type_or_set, Set);
      is_set = is_set||__instance_of(type_or_set, util.set);
      is_set = is_set||Array.isArray(type_or_set);
      if (!is_set) {
          classes = [type_or_set];
      }
      let visit=new Set();
      return (function* () {
        let stack=[this2];
        while (stack.length>0) {
          let n=stack.pop();
          visit.add(n);
          if (!n||!n.childNodes) {
              continue;
          }
          for (let cls of classes) {
              if (__instance_of(n, cls)) {
                  yield n;
              }
          }
          for (let c of n.childNodes) {
              if (!visit.has(c)) {
                  stack.push(c);
              }
          }
          if (n.shadow) {
              for (let c of n.shadow.childNodes) {
                  if (!visit.has(c)) {
                      stack.push(c);
                  }
              }
          }
        }
      })();
    }
     appendChild(child) {
      if (__instance_of(child, UIBase)) {
          child.ctx = this.ctx;
          child.parentWidget = this;
          child.useDataPathUndo = this.useDataPathUndo;
      }
      return super.appendChild(child);
    }
     _clipboardHotkeyInit() {
      this._clipboard_over = false;
      this._last_clipboard_keyevt = undefined;
      this._clipboard_keystart = () =>        {
        if (this._clipboard_events) {
            return ;
        }
        this._clipboard_events = true;
        window.addEventListener("keydown", this._clipboard_keydown, {capture: true, 
      passive: false});
      };
      this._clipboard_keyend = () =>        {
        if (!this._clipboard_events) {
            return ;
        }
        this._clipboard_events = false;
        window.removeEventListener("keydown", this._clipboard_keydown, {capture: true, 
      passive: false});
      };
      this._clipboard_keydown = (e, internal_mode) =>        {
        if (!this.isConnected||!cconst.getClipboardData) {
            this._clipboard_keyend();
            return ;
        }
        if (e===this._last_clipboard_keyevt||!this._clipboard_over) {
            return ;
        }
        let is_copy=e.keyCode===keymap["C"]&&(e.ctrlKey||e.commandKey)&&!e.shiftKey&&!e.altKey;
        let is_paste=e.keyCode===keymap["V"]&&(e.ctrlKey||e.commandKey)&&!e.shiftKey&&!e.altKey;
        if (!is_copy&&!is_paste) {
            return ;
        }
        if (!internal_mode) {
            let screen=this.ctx.screen;
            let elem=screen.pickElement(screen.mpos[0], screen.mpos[1]);
            let checkTree=is_paste&&this.constructor.define().pasteForAllChildren;
            checkTree = checkTree||(is_copy&&this.constructor.define().copyForAllChildren);
            while (checkTree&&!(__instance_of(elem, TextBox))&&elem!==this&&elem.parentWidget) {
              console.log("  "+elem._id);
              elem = elem.parentWidget;
            }
            console.warn("COLOR", this._id, elem._id);
            if (elem!==this) {
                this._clipboard_keyend();
                return ;
            }
        }
        else {
          console.warn("COLOR", this._id);
        }
        this._last_clipboard_keyevt = e;
        if (is_copy) {
            this.clipboardCopy();
            e.preventDefault();
            e.stopPropagation();
        }
        if (is_paste) {
            this.clipboardPaste();
            e.preventDefault();
            e.stopPropagation();
        }
      };
      let start=(e) =>        {
        this._clipboard_over = true;
        this._clipboard_keystart();
      };
      let stop=(e) =>        {
        this._clipboard_over = false;
        this._clipboard_keyend();
      };
      this.doOnce(() =>        {
        this.tabIndex = 0;
      });
      this.addEventListener("keydown", (e) =>        {
        return this._clipboard_keydown(e, true);
      });
      this.addEventListener("pointerover", start, {capture: true, 
     passive: true});
      this.addEventListener("pointerout", stop, {capture: true, 
     passive: true});
      this.addEventListener("focus", stop, {capture: true, 
     passive: true});
    }
     clipboardCopy() {
      throw new Error("implement me!");
    }
     clipboardPaste() {
      throw new Error("implement me!");
    }
     init() {
      this._init_done = true;
      if (!this.hasAttribute("id")&&this._id) {
          this.setAttribute("id", this._id);
      }
    }
     _ondestroy() {
      if (this.tabIndex>=0) {
          this.regenTabOrder();
      }
      if (cconst.DEBUG.paranoidEvents) {
          for (let item of this.__cbs) {
              this.removeEventListener(item[0], item[1], item[2]);
          }
          this.__cbs = [];
      }
      if (this.ondestroy!==undefined) {
          this.ondestroy();
      }
    }
     remove(trigger_on_destroy=true) {
      if (this.tabIndex>=0) {
          this.regenTabOrder();
      }
      super.remove();
      if (trigger_on_destroy) {
          this._ondestroy();
      }
      if (this.on_remove) {
          this.on_remove();
      }
      this.parentWidget = undefined;
    }
     on_remove() {

    }
     removeChild(child, trigger_on_destroy=true) {
      super.removeChild(child);
      if (trigger_on_destroy) {
          child._ondestroy();
      }
    }
     flushUpdate(force=false) {
      this._init();
      this.update();
      this._forEachChildWidget((c) =>        {
        if (force||!(c.packflag&PackFlags.NO_UPDATE)) {
            if (!c.ctx) {
                c.ctx = this.ctx;
            }
            c.flushUpdate(force);
        }
      });
    }
     _forEachChildWidget(cb, thisvar) {
      let rec=(n) =>        {
        if (__instance_of(n, UIBase)) {
            if (thisvar!==undefined) {
                cb.call(thisvar, n);
            }
            else {
              cb(n);
            }
        }
        else {
          for (let n2 of n.childNodes) {
              rec(n2);
          }
          if (n.shadow!==undefined) {
              for (let n2 of n.shadow.childNodes) {
                  rec(n2);
              }
          }
        }
      };
      for (let n of this.childNodes) {
          rec(n);
      }
      if (this.shadow) {
          for (let n of this.shadow.childNodes) {
              rec(n);
          }
      }
    }
     checkInit() {
      return this._init();
    }
     _init() {
      if (this._init_done) {
          return false;
      }
      this._init_done = true;
      this.init();
      return true;
    }
     getWinWidth() {
      return window.innerWidth;
    }
     getWinHeight() {
      return window.innerHeight;
    }
     calcZ() {
      let p=this;
      let n=this;
      while (n) {
        if (n.style&&n.style["z-index"]) {
            let z=parseFloat(n.style["z-index"]);
            return z;
        }
        n = n.parentNode;
        if (!n) {
            n = p = p.parentWidget;
        }
      }
      return 0;
    }
     pickElement(x, y, args={}, marginy=0, nodeclass=UIBase, excluded_classes=undefined) {
      let marginx;
      let clip;
      let mouseEvent;
      let isMouseMove, isMouseDown;
      if (typeof args==="object") {
          marginx = args.sx||0;
          marginy = args.sy||0;
          nodeclass = args.nodeclass||UIBase;
          excluded_classes = args.excluded_classes;
          clip = args.clip;
          mouseEvent = args.mouseEvent;
      }
      else {
        marginx = args;
        args = {marginx: marginx||0, 
      marginy: marginy||0, 
      nodeclass: nodeclass||UIBase, 
      excluded_classes: excluded_classes, 
      clip: clip};
      }
      if (mouseEvent) {
          isMouseMove = mouseEvent.type==="mousemove"||mouseEvent.type==="touchmove"||mouseEvent.type==="pointermove";
          isMouseDown = mouseEvent.buttons||(mouseEvent.touches&&mouseEvent.touches.length>0);
      }
      x-=window.scrollX;
      y-=window.scrollY;
      let elem=document.elementFromPoint(x, y);
      if (!elem) {
          return ;
      }
      let path=[elem];
      let lastelem=elem;
      let i=0;
      while (elem.shadow) {
        if (i++>1000) {
            console.error("Infinite loop error");
            break;
        }
        elem = elem.shadow.elementFromPoint(x, y);
        if (elem===lastelem) {
            break;
        }
        if (elem) {
            path.push(elem);
        }
        lastelem = elem;
      }
      path.reverse();
      for (let i=0; i<path.length; i++) {
          let node=path[i];
          let ok=__instance_of(node, nodeclass);
          if (excluded_classes) {
              for (let cls of excluded_classes) {
                  ok = ok&&!(__instance_of(node, cls));
              }
          }
          if (clip) {
              let rect=node.getBoundingClientRect();
              let clip2=math.aabb_intersect_2d(clip.pos, clip.size, [rect.x, rect.y], [rect.width, rect.height]);
              ok = ok&&clip2;
          }
          if (ok) {
              window.elem = node;
              return node;
          }
      }
    }
     __updateDisable(val) {
      if (!!val===!!this.__disabledState) {
          return ;
      }
      this.__disabledState = !!val;
      if (val&&!this._disdata) {
          let style=this.getDefault("disabled")||this.getDefault("internalDisabled")||{"background-color": this.getDefault("DisabledBG")};
          this._disdata = {style: {}, 
       defaults: {}};
          for (let k in style) {
              this._disdata.style[k] = this.style[k];
              this._disdata.defaults[k] = this.default_overrides[k];
              let v=style[k];
              if (typeof v==="object"&&__instance_of(v, CSSFont)) {
                  this.style[k] = style[k].genCSS();
              }
              else 
                if (typeof v==="object") {
                  continue;
              }
              else {
                this.style[k] = style[k];
              }
              this.default_overrides[k] = style[k];
          }
          this.__disabledState = !!val;
          this.on_disabled();
      }
      else 
        if (!val&&this._disdata) {
          for (let k in this._disdata.style) {
              this.style[k] = this._disdata.style[k];
          }
          for (let k in this._disdata.defaults) {
              let v=this._disdata.defaults[k];
              if (v===undefined) {
                  delete this.default_overrides[k];
              }
              else {
                this.default_overrides[k] = v;
              }
          }
          this._disdata = undefined;
          this.__disabledState = !!val;
          this.on_enabled();
      }
      this.__disabledState = !!val;
      let visit=(n) =>        {
        if (__instance_of(n, UIBase)) {
            let changed=!!n.__disabledState;
            n.__updateDisable(n.disabled);
            changed = changed!==!!n.__disabledState;
            if (changed) {
                n.update();
                n.setCSS();
            }
        }
      };
      this._forEachChildWidget(visit);
    }
     on_disabled() {

    }
     on_enabled() {

    }
     pushModal(handlers=this, autoStopPropagation=true, pointerId=undefined, pointerElem=this) {
      if (this._modaldata!==undefined) {
          console.warn("UIBase.prototype.pushModal called when already in modal mode");
          this.popModal();
      }
      let _areaWrangler=contextWrangler.copy();
      contextWrangler.copy(this.ctx);
      function bindFunc(func) {
        return function () {
          _areaWrangler.copyTo(contextWrangler);
          return func.apply(handlers, arguments);
        }
      }
      let handlers2={};
      for (let k in handlers) {
          let func=handlers[k];
          if (typeof func!=="function") {
              continue;
          }
          handlers2[k] = bindFunc(func);
      }
      if (pointerId!==undefined&&pointerElem) {
          this._modaldata = pushPointerModal(handlers2, autoStopPropagation);
      }
      else {
        this._modaldata = pushModalLight(handlers2, autoStopPropagation);
      }
      return this._modaldata;
    }
     popModal() {
      if (this._modaldata===undefined) {
          console.warn("Invalid call to UIBase.prototype.popModal");
          return ;
      }
      popModalLight(this._modaldata);
      this._modaldata = undefined;
    }
     _flash_focus() {
      this.focus();
    }
     flash(color, rect_element=this, timems=355, autoFocus=true) {
      if (typeof color!="object") {
          color = css2color(color);
      }
      color = new Vector4(color);
      let csscolor=color2css(color);
      if (this._flashtimer!==undefined&&this._flashcolor!==csscolor) {
          window.setTimeout(() =>            {
            this.flash(color, rect_element, timems, autoFocus);
          }, 100);
          return ;
      }
      else 
        if (this._flashtimer!==undefined) {
          return ;
      }
      let rect=rect_element.getBoundingClientRect();
      if (rect===undefined) {
          return ;
      }
      let timer;
      let tick=0;
      let max=~~(timems/20);
      let x=rect.x, y=rect.y;
      let cb=(e) =>        {
        if (timer===undefined) {
            return ;
        }
        let a=1.0-tick/max;
        div.style["background-color"] = color2css(color, a*a*0.5);
        if (tick>max) {
            window.clearInterval(timer);
            this._flashtimer = undefined;
            this._flashcolor = undefined;
            timer = undefined;
            div.remove();
            if (autoFocus) {
                this._flash_focus();
            }
        }
        tick++;
      };
      window.setTimeout(cb, 5);
      this._flashtimer = timer = window.setInterval(cb, 20);
      let div=document.createElement("div");
      div.style["pointer-events"] = "none";
      div.tabIndex = undefined;
      div.style["z-index"] = "900";
      div.style["display"] = "float";
      div.style["position"] = UIBase.PositionKey;
      div.style["margin"] = "0px";
      div.style["left"] = x+"px";
      div.style["top"] = y+"px";
      div.style["background-color"] = color2css(color, 0.5);
      div.style["width"] = rect.width+"px";
      div.style["height"] = rect.height+"px";
      div.setAttribute("class", "UIBaseFlash");
      let screen=this.getScreen();
      if (screen!==undefined) {
          screen._enterPopupSafe();
      }
      document.body.appendChild(div);
      if (autoFocus) {
          this._flash_focus();
      }
      this._flashcolor = csscolor;
      if (screen!==undefined) {
          screen._exitPopupSafe();
      }
    }
     destroy() {

    }
     on_resize(newsize) {

    }
     toJSON() {
      let ret={};
      if (this.hasAttribute("datapath")) {
          ret.datapath = this.getAttribute("datapath");
      }
      return ret;
    }
     loadJSON(obj) {
      if (!this._init_done) {
          this._init();
      }
    }
     getPathValue(ctx, path) {
      try {
        return ctx.api.getValue(ctx, path);
      }
      catch (error) {
          return undefined;
      }
    }
     undoBreakPoint() {
      this.pathUndoGen++;
    }
     setPathValueUndo(ctx, path, val) {
      let mass_set_path=this.getAttribute("mass_set_path");
      let rdef=ctx.api.resolvePath(ctx, path);
      let prop=rdef.prop;
      if (ctx.api.getValue(ctx, path)===val) {
          return ;
      }
      let toolstack=this.ctx.toolstack;
      let head=toolstack.head;
      let bad=head===undefined||!(__instance_of(head, getDataPathToolOp()));
      bad = bad||head.hashThis()!==head.hash(mass_set_path, path, prop.type, this._id);
      bad = bad||this.pathUndoGen!==this._lastPathUndoGen;
      if (!bad) {
          toolstack.undo();
          head.setValue(ctx, val, rdef.obj);
          toolstack.redo();
      }
      else {
        this._lastPathUndoGen = this.pathUndoGen;
        let toolop=getDataPathToolOp().create(ctx, path, val, this._id, mass_set_path);
        ctx.toolstack.execTool(this.ctx, toolop);
        head = toolstack.head;
      }
      if (!head||head.hadError===true) {
          throw new Error("toolpath error");
      }
    }
     loadNumConstraints(prop=undefined, dom=this, onModifiedCallback=undefined) {
      let modified=false;
      if (!prop) {
          let path;
          if (dom.hasAttribute("datapath")) {
              path = dom.getAttribute("datapath");
          }
          if (path===undefined&&this.hasAttribute("datapath")) {
              path = this.getAttribute("datapath");
          }
          if (typeof path==="string") {
              prop = this.getPathMeta(this.ctx, path);
          }
      }
      let loadAttr=(propkey, domkey, thiskey) =>        {
        if (domkey===undefined) {
            domkey = key;
        }
        if (thiskey===undefined) {
            thiskey = key;
        }
        let old=this[thiskey];
        if (dom.hasAttribute(domkey)) {
            this[thiskey] = parseFloat(dom.getAttribute(domkey));
        }
        else 
          if (prop) {
            this[thiskey] = prop[propkey];
        }
        if (this[thiskey]!==old) {
            modified = true;
        }
      };
      for (let key of NumberConstraints) {
          let thiskey=key, domkey=key;
          if (key==="range") {
              continue;
          }
          loadAttr(key, domkey, thiskey);
      }
      let oldmin=this.range[0];
      let oldmax=this.range[1];
      let range=prop ? prop.range : undefined;
      if (range&&!dom.hasAttribute("min")) {
          this.range[0] = range[0];
      }
      else 
        if (dom.hasAttribute("min")) {
          this.range[0] = parseFloat(dom.getAttribute("min"));
      }
      if (range&&!dom.hasAttribute("max")) {
          this.range[1] = range[1];
      }
      else 
        if (dom.hasAttribute("max")) {
          this.range[1] = parseFloat(dom.getAttribute("max"));
      }
      if (this.range[0]!==oldmin||this.range[1]!==oldmax) {
          modified = true;
      }
      let oldint=this.isInt;
      if (dom.getAttribute("integer")) {
          let val=dom.getAttribute("integer");
          val = (""+val).toLowerCase();
          this.isInt = val==="null"||val==="true"||val==="yes"||val==="1";
      }
      else {
        this.isInt = prop&&__instance_of(prop, IntProperty);
      }
      if (!this.isInt!==!oldint) {
          modified = true;
      }
      let oldedit=this.editAsBaseUnit;
      if (this.editAsBaseUnit===undefined) {
          if (prop&&(prop.flag&PropFlags.EDIT_AS_BASE_UNIT)) {
              this.editAsBaseUnit = true;
          }
          else {
            this.editAsBaseUnit = false;
          }
      }
      if (!this.editAsBaseUnit!==!oldedit) {
          modified = true;
      }
      if (modified) {
          this.setCSS();
          if (onModifiedCallback) {
              onModifiedCallback.call(this);
          }
      }
    }
     pushReportContext(key) {
      if (this.ctx.api.pushReportContext) {
          this.ctx.api.pushReportContext(key);
      }
    }
     popReportContext() {
      if (this.ctx.api.popReportContext)
        this.ctx.api.popReportContext();
    }
     setPathValue(ctx, path, val) {
      if (this.useDataPathUndo) {
          this.pushReportContext(this._reportCtxName);
          try {
            this.setPathValueUndo(ctx, path, val);
          }
          catch (error) {
              this.popReportContext();
              if (!(__instance_of(error, DataPathError))) {
                  throw error;
              }
              else {
                return ;
              }
          }
          this.popReportContext();
          return ;
      }
      this.pushReportContext(this._reportCtxName);
      try {
        if (this.hasAttribute("mass_set_path")) {
            ctx.api.massSetProp(ctx, this.getAttribute("mass_set_path"), val);
            ctx.api.setValue(ctx, path, val);
        }
        else {
          ctx.api.setValue(ctx, path, val);
        }
      }
      catch (error) {
          this.popReportContext();
          if (!(__instance_of(error, DataPathError))) {
              throw error;
          }
          return ;
      }
      this.popReportContext();
    }
     getPathMeta(ctx, path) {
      this.pushReportContext(this._reportCtxName);
      let ret=ctx.api.resolvePath(ctx, path);
      this.popReportContext();
      return ret!==undefined ? ret.prop : undefined;
    }
     getPathDescription(ctx, path) {
      let ret;
      this.pushReportContext(this._reportCtxName);
      try {
        ret = ctx.api.getDescription(ctx, path);
      }
      catch (error) {
          this.popReportContext();
          if (__instance_of(error, DataPathError)) {
              return undefined;
          }
          else {
            throw error;
          }
      }
      this.popReportContext();
      return ret;
    }
     getScreen() {
      if (this.ctx!==undefined)
        return this.ctx.screen;
    }
     isDead() {
      return !this.isConnected;
      let p=this, lastp=this;
      function find(c, n) {
        for (let n2 of c) {
            if (n2===n) {
                return true;
            }
        }
      }
      while (p) {
        lastp = p;
        let parent=p.parentWidget;
        if (!parent) {
            parent = p.parentElement ? p.parentElement : p.parentNode;
        }
        if (parent&&p&&!find(parent.childNodes, p)) {
            if (parent.shadow!==undefined&&!find(parent.shadow.childNodes)) {
                return true;
            }
        }
        p = parent;
        if (p===document.body) {
            return false;
        }
      }
      return true;
    }
     doOnce(func, timeout=undefined) {
      if (func._doOnce===undefined) {
          func._doOnce_reqs = new Set();
          func._doOnce = function (thisvar, trace) {
            if (func._doOnce_reqs.has(thisvar._id)) {
                return ;
            }
            func._doOnce_reqs.add(thisvar._id);
            function f() {
              if (thisvar.isDead()) {
                  func._doOnce_reqs.delete(thisvar._id);
                  if (func===thisvar._init||!cconst.DEBUG.doOnce) {
                      return ;
                  }
                  console.warn("Ignoring doOnce call for dead element", thisvar._id, func, trace);
                  return ;
              }
              if (!thisvar.ctx) {
                  if (cconst.DEBUG.doOnce) {
                      console.warn("doOnce call is waiting for context...", thisvar._id, func);
                  }
                  internalSetTimeout(f, 0);
                  return ;
              }
              func._doOnce_reqs.delete(thisvar._id);
              func.call(thisvar);
            }
            internalSetTimeout(f, timeout);
          };
      }
      let trace=new Error().stack;
      func._doOnce(this, trace);
    }
     float(x=0, y=0, zindex=undefined, positionKey=UIBase.PositionKey) {
      this.style.position = positionKey;
      this.style.left = x+"px";
      this.style.top = y+"px";
      if (zindex!==undefined) {
          this.style["z-index"] = zindex;
      }
      return this;
    }
     _ensureChildrenCtx() {
      let ctx=this.ctx;
      if (ctx===undefined) {
          return ;
      }
      this._forEachChildWidget((n) =>        {
        n.parentWidget = this;
        if (n.ctx===undefined) {
            n.ctx = ctx;
        }
        n._ensureChildrenCtx(ctx);
      });
    }
     checkThemeUpdate() {
      if (!cconst.enableThemeAutoUpdate) {
          return false;
      }
      if (_themeUpdateKey!==this._last_theme_update_key) {
          this._last_theme_update_key = _themeUpdateKey;
          return true;
      }
      return false;
    }
     abortToolTips(delayMs=500) {
      if (this._has_own_tooltips) {
          this._has_own_tooltips.stop_timer();
      }
      if (this._tooltip_ref) {
          this._tooltip_ref.remove();
          this._tooltip_ref = undefined;
      }
      this._tool_tip_abort_delay = util.time_ms()+delayMs;
      return this;
    }
     updateToolTipHandlers() {
      if (!this._useNativeToolTips_set&&!cconst.useNativeToolTips!==!this._useNativeToolTips) {
          this._useNativeToolTips = cconst.useNativeToolTips;
      }
      if (!!this.useNativeToolTips===!this._has_own_tooltips) {
          return ;
      }
      if (!this.useNativeToolTips) {
          let state=this._has_own_tooltips = {start_timer: (e) =>              {
              this._tooltip_timer = util.time_ms();
            }, 
       stop_timer: (e) =>              {
              this._tooltip_timer = undefined;
            }, 
       reset_timer: (e) =>              {
              if (this._tooltip_timer!==undefined) {
                  this._tooltip_timer = util.time_ms();
              }
            }, 
       start_events: ["mouseover"], 
       reset_events: ["mousemove", "mousedown", "mouseup", "touchstart", "touchend", "keydown", "focus"], 
       stop_events: ["mouseleave", "blur", "mouseout"], 
       handlers: {}};
          let bind_handler=(type, etype) =>            {
            let handler=(e) =>              {
              if (this._tool_tip_abort_delay!==undefined&&util.time_ms()<this._tool_tip_abort_delay) {
                  this._tooltip_timer = undefined;
                  return ;
              }
              state[type](e);
            }
            if (etype in state.handlers) {
                console.error(type, "is in handlers already");
                return ;
            }
            state.handlers[etype] = handler;
            return handler;
          };
          let i=0;
          let lists=[state.start_events, state.stop_events, state.reset_events];
          for (let type of ["start_timer", "stop_timer", "reset_timer"]) {
              for (let etype of lists[i]) {
                  this.addEventListener(etype, bind_handler(type, etype), {passive: true});
              }
              i++;
          }
      }
      else {
        console.warn(this.id, "removing tooltip handlers");
        let state=this._has_own_tooltips;
        for (let k in this.state.handlers) {
            let handler=this.state.handlers[k];
            this.removeEventListener(k, handler);
        }
        this._has_own_tooltips = undefined;
        this._tooltip_timer = undefined;
      }
    }
     updateToolTips() {
      if (this._description_final===undefined||this._description_final===null||this._description_final.trim().length===0) {
          return ;
      }
      if (!this.ctx||!this.ctx.screen) {
          return ;
      }
      this.updateToolTipHandlers();
      if (this.useNativeToolTips||this._tooltip_timer===undefined) {
          return ;
      }
      if (this._tool_tip_abort_delay!==undefined&&util.time_ms()<this._tool_tip_abort_delay) {
          return ;
      }
      this._tool_tip_abort_delay = undefined;
      let screen=this.ctx.screen;
      const timelimit=500;
      let ok=util.time_ms()-this._tooltip_timer>timelimit;
      let x=screen.mpos[0], y=screen.mpos[1];
      let r=this.getClientRects();
      r = r ? r[0] : r;
      if (!r) {
          ok = false;
      }
      else {
        ok = ok&&x>=r.x&&x<r.x+r.width;
        ok = ok&&y>=r.y&&y<r.y+r.height;
      }
      if (r) {
      }
      ok = ok&&!haveModal();
      ok = ok&&screen.pickElement(x, y)===this;
      ok = ok&&this._description_final;
      if (ok) {
          this._tooltip_ref = _ToolTip.show(this._description_final, this.ctx.screen, x, y);
      }
      else {
        if (this._tooltip_ref) {
            this._tooltip_ref.remove();
        }
        this._tooltip_ref = undefined;
      }
      if (util.time_ms()-this._tooltip_timer>timelimit) {
          this._tooltip_timer = undefined;
      }
    }
     update() {
      this.updateToolTips();
      if (this.ctx&&this._description===undefined&&this.getAttribute("datapath")) {
          let d=this.getPathDescription(this.ctx, this.getAttribute("datapath"));
          this.description = d;
      }
      if (!this._init_done) {
          this._init();
      }
      if (this._init_done&&!this.constructor.define().subclassChecksTheme) {
          if (this.checkThemeUpdate()) {
              console.log("theme update!");
              this.setCSS();
          }
      }
    }
     onadd() {
      if (!this._init_done) {
          this.doOnce(this._init);
      }
      if (this.tabIndex>=0) {
          this.regenTabOrder();
      }
    }
     getZoom() {
      if (this.parentWidget!==undefined) {
          return this.parentWidget.getZoom();
      }
      return 1.0;
    }
     getDPI() {
      if (this.parentWidget!==undefined) {
          return this.parentWidget.getDPI();
      }
      return UIBase.getDPI();
    }
     saveData() {
      return {}
    }
     loadData(obj) {
      return this;
    }
     overrideDefault(key, val, localOnly=false) {
      this.my_default_overrides[key] = val;
      if (!localOnly) {
          this.default_overrides[key] = val;
      }
      return this;
    }
     overrideClass(style) {
      this._override_class = style;
    }
     overrideClassDefault(style, key, val) {
      if (!(style in this.class_default_overrides)) {
          this.class_default_overrides[style] = {};
      }
      this.class_default_overrides[style][key] = val;
    }
     _doMobileDefault(key, val) {
      if (!util.isMobile())
        return val;
      key = key.toLowerCase();
      let ok=false;
      for (let re of _mobile_theme_patterns) {
          if (key.search(re)>=0) {
              ok = true;
              break;
          }
      }
      if (ok) {
          val*=theme.base.mobileSizeMultiplier;
      }
      return val;
    }
     hasDefault(key) {
      let p=this;
      while (p) {
        if (key in p.default_overrides) {
            return true;
        }
        p = p.parentWidget;
      }
      return this.hasClassDefault(key);
    }
     getSubDefault(key, subkey, backupkey=subkey, defaultval=undefined) {
      if (!key) {
          return this.getDefault(subkey, undefined, defaultval);
      }
      let style=this.getDefault(key);
      if (!style||typeof style!=="object"||!(subkey in style)) {
          if (defaultval!==undefined) {
              return defaultval;
          }
          else 
            if (backupkey!==undefined) {
              return this.getDefault(backupkey);
          }
      }
      else {
        return style[subkey];
      }
    }
     getDefault(key, checkForMobile=true, defaultval=undefined) {
      let ret=this.getDefault_intern(key, checkForMobile, defaultval);
      if (typeof ret==="string"&&ret.trim().toLowerCase().endsWith("px")) {
          let s=ret.trim().toLowerCase();
          s = s.slice(0, s.length-2).trim();
          let f=parseFloat(s);
          if (!isNaN(f)&&isFinite(f)) {
              return f;
          }
      }
      return ret;
    }
     getDefault_intern(key, checkForMobile=true, defaultval=undefined) {
      if (this.my_default_overrides[key]!==undefined) {
          let v=this.my_default_overrides[key];
          return checkForMobile ? this._doMobileDefault(key, v) : v;
      }
      let p=this;
      while (p) {
        if (p.default_overrides[key]!==undefined) {
            let v=p.default_overrides[key];
            checkForMobile ? this._doMobileDefault(key, v) : v;
        }
        p = p.parentWidget;
      }
      return this.getClassDefault(key, checkForMobile, defaultval);
    }
     getStyleClass() {
      if (this._override_class!==undefined) {
          return this._override_class;
      }
      let p=this.constructor, lastp=undefined;
      while (p&&p!==lastp&&p!==UIBase&&p!==Object) {
        let def=p.define();
        if (def.style) {
            return def.style;
        }
        if (!p.prototype||!p.prototype.__proto__)
          break;
        p = p.prototype.__proto__.constructor;
      }
      return "base";
    }
     hasClassDefault(key) {
      let style=this.getStyleClass();
      let p=this;
      while (p) {
        let def=p.class_default_overrides[style];
        if (def&&(key in def)) {
            return true;
        }
        p = p.parentWidget;
      }
      let th=this._themeOverride;
      if (th&&style in th&&key in th[style]) {
          return true;
      }
      if (style in theme&&key in theme[style]) {
          return true;
      }
      return key in theme.base;
    }
     getClassDefault(key, checkForMobile=true, defaultval=undefined) {
      let style=this.getStyleClass();
      if (style==="none") {
          return undefined;
      }
      let val=undefined;
      let p=this;
      while (p) {
        let def=p.class_default_overrides[style];
        if (def&&(key in def)) {
            val = def[key];
            break;
        }
        p = p.parentWidget;
      }
      if (val===undefined&&style in theme&&!(key in theme[style])&&!(key in theme.base)) {
          if (window.DEBUG.theme) {
              report("Missing theme key ", key, "for", style);
          }
      }
      for (let i=0; i<2; i++) {
          let th=!i ? this._themeOverride : theme;
          if (!th) {
              continue;
          }
          if (val===undefined&&style in th&&key in th[style]) {
              val = th[style][key];
          }
          else 
            if (defaultval!==undefined) {
              val = defaultval;
          }
          else 
            if (val===undefined) {
              let def=this.constructor.define();
              if (def.parentStyle&&key in th[def.parentStyle]) {
                  val = th[def.parentStyle][key];
              }
              else {
                val = th.base[key];
              }
          }
      }
      return checkForMobile ? this._doMobileDefault(key, val) : val;
    }
     overrideTheme(theme) {
      this._themeOverride = theme;
      this._forEachChildWidget((child) =>        {
        child.overrideTheme(theme);
      });
      if (this.ctx) {
          this.flushSetCSS();
          this.flushUpdate();
      }
      return this;
    }
     getStyle() {
      console.warn("deprecated call to UIBase.getStyle");
      return this.getStyleClass();
    }
     animate(_extra_handlers={}) {
      let transform=new DOMMatrix(this.style["transform"]);
      let update_trans=() =>        {
        let t=transform;
        let css="matrix("+t.a+","+t.b+","+t.c+","+t.d+","+t.e+","+t.f+")";
        this.style["transform"] = css;
      };
      let handlers={background_get: function background_get() {
          return css2color(this.background);
        }, 
     background_set: function background_set(c) {
          if (typeof c!=="string") {
              c = color2css(c);
          }
          this.background = c;
        }, 
     dx_get: function dx_get() {
          return transform.m41;
        }, 
     dx_set: function dx_set(x) {
          transform.m41 = x;
          update_trans();
        }, 
     dy_get: function dy_get() {
          return transform.m42;
        }, 
     dy_set: function dy_set(x) {
          transform.m42 = x;
          update_trans();
        }};
      let pixkeys=["width", "height", "left", "top", "right", "bottom", "border-radius", "border-width", "margin", "padding", "margin-left", "margin-right", "margin-top", "margin-bottom", "padding-left", "padding-right", "padding-bottom", "padding-top"];
      handlers = Object.assign(handlers, _extra_handlers);
      let makePixHandler=(k, k2) =>        {
        handlers[k2+"_get"] = () =>          {
          let s=this.style[k];
          if (s.endsWith("px")) {
              return parsepx(s);
          }
          else {
            return 0.0;
          }
        }
        handlers[k2+"_set"] = (val) =>          {
          this.style[k] = val+"px";
        }
      };
      for (let k of pixkeys) {
          if (!(k in handlers)) {
              makePixHandler(k, `style.${k}`);
              makePixHandler(k, `style["${k}"]`);
              makePixHandler(k, `style['${k}']`);
          }
      }
      let handler={get: (target, key, receiver) =>          {
          console.log(key, handlers[key+"_get"], handlers);
          if ((key+"_get") in handlers) {
              return handlers[key+"_get"].call(target);
          }
          else {
            return target[key];
          }
        }, 
     set: (target, key, val, receiver) =>          {
          console.log(key);
          if ((key+"_set") in handlers) {
              handlers[key+"_set"].call(target, val);
          }
          else {
            target[key] = val;
          }
          return true;
        }};
      let proxy=new Proxy(this, handler);
      let anim=new Animator(proxy);
      anim.onend = () =>        {
        this._active_animations.remove(anim);
      };
      this._active_animations.push(anim);
      return anim;
    }
     abortAnimations() {
      for (let anim of util.list(this._active_animations)) {
          anim.end();
      }
      this._active_animations = [];
    }
  }
  _ESClass.register(UIBase);
  _es6_module.add_class(UIBase);
  UIBase = _es6_module.add_export('UIBase', UIBase);
  function drawRoundBox2(elem, options) {
    if (options===undefined) {
        options = {};
    }
    drawRoundBox(elem, options.canvas, options.g, options.width, options.height, options.r, options.op, options.color, options.margin, options.no_clear);
  }
  drawRoundBox2 = _es6_module.add_export('drawRoundBox2', drawRoundBox2);
  function drawRoundBox(elem, canvas, g, width, height, r, op, color, margin, no_clear) {
    if (r===undefined) {
        r = undefined;
    }
    if (op===undefined) {
        op = "fill";
    }
    if (color===undefined) {
        color = undefined;
    }
    if (margin===undefined) {
        margin = undefined;
    }
    if (no_clear===undefined) {
        no_clear = false;
    }
    width = width===undefined ? canvas.width : width;
    height = height===undefined ? canvas.height : height;
    g.save();
    let dpi=elem.getDPI();
    r = r===undefined ? elem.getDefault("border-radius") : r;
    if (margin===undefined) {
        margin = 1;
    }
    r*=dpi;
    let r1=r, r2=r;
    if (r>(height-margin*2)*0.5) {
        r1 = (height-margin*2)*0.5;
    }
    if (r>(width-margin*2)*0.5) {
        r2 = (width-margin*2)*0.5;
    }
    let bg=color;
    if (bg===undefined&&canvas._background!==undefined) {
        bg = canvas._background;
    }
    else 
      if (bg===undefined) {
        bg = elem.getDefault("background-color");
    }
    if (op==="fill"&&!no_clear) {
        g.clearRect(0, 0, width, height);
    }
    g.fillStyle = bg;
    g.strokeStyle = color===undefined ? elem.getDefault("border-color") : color;
    let w=width, h=height;
    let th=Math.PI/4;
    let th2=Math.PI*0.75;
    g.beginPath();
    g.moveTo(margin, margin+r1);
    g.lineTo(margin, h-r1-margin);
    g.quadraticCurveTo(margin, h-margin, margin+r2, h-margin);
    g.lineTo(w-margin-r2, h-margin);
    g.quadraticCurveTo(w-margin, h-margin, w-margin, h-margin-r1);
    g.lineTo(w-margin, margin+r1);
    g.quadraticCurveTo(w-margin, margin, w-margin-r2, margin);
    g.lineTo(margin+r2, margin);
    g.quadraticCurveTo(margin, margin, margin, margin+r1);
    g.closePath();
    if (op==="clip") {
        g.clip();
    }
    else 
      if (op==="fill") {
        g.fill();
    }
    else {
      g.stroke();
    }
    g.restore();
  }
  drawRoundBox = _es6_module.add_export('drawRoundBox', drawRoundBox);
  
  function _getFont_new(elem, size, font, do_dpi) {
    if (font===undefined) {
        font = "DefaultText";
    }
    if (do_dpi===undefined) {
        do_dpi = true;
    }
    font = elem.getDefault(font);
    return font.genCSS(size);
  }
  _getFont_new = _es6_module.add_export('_getFont_new', _getFont_new);
  function getFont(elem, size, font, do_dpi) {
    if (font===undefined) {
        font = "DefaultText";
    }
    if (do_dpi===undefined) {
        do_dpi = true;
    }
    return _getFont_new(elem, size, font = "DefaultText", do_dpi = true);
  }
  getFont = _es6_module.add_export('getFont', getFont);
  function _getFont(elem, size, font, do_dpi) {
    if (font===undefined) {
        font = "DefaultText";
    }
    if (do_dpi===undefined) {
        do_dpi = true;
    }
    let dpi=elem.getDPI();
    let font2=elem.getDefault(font);
    if (font2!==undefined) {
        return _getFont_new(elem, size, font, do_dpi);
    }
    throw new Error("unknown font "+font);
  }
  _getFont = _es6_module.add_export('_getFont', _getFont);
  function _ensureFont(elem, canvas, g, size) {
    if (canvas.font) {
        g.font = canvas.font;
    }
    else {
      let font=elem.getDefault("DefaultText");
      g.font = font.genCSS(size);
    }
  }
  _ensureFont = _es6_module.add_export('_ensureFont', _ensureFont);
  let _mc;
  function get_measure_canvas() {
    if (_mc!==undefined) {
        return _mc;
    }
    _mc = document.createElement("canvas");
    _mc.width = 256;
    _mc.height = 256;
    _mc.g = _mc.getContext("2d");
    return _mc;
  }
  function measureTextBlock(elem, text, canvas, g, size, font) {
    if (canvas===undefined) {
        canvas = undefined;
    }
    if (g===undefined) {
        g = undefined;
    }
    if (size===undefined) {
        size = undefined;
    }
    if (font===undefined) {
        font = undefined;
    }
    let lines=text.split("\n");
    let ret={width: 0, 
    height: 0}
    if (size===undefined) {
        if (font!==undefined&&typeof font==="object") {
            size = font.size;
        }
        if (size===undefined) {
            size = elem.getDefault("DefaultText").size;
        }
    }
    for (let line of lines) {
        let m=measureText(elem, line, canvas, g, size, font);
        ret.width = Math.max(ret.width, m.width);
        let h=m.height!==undefined ? m.height : size*1.25;
        ret.height+=h;
    }
    return ret;
  }
  measureTextBlock = _es6_module.add_export('measureTextBlock', measureTextBlock);
  function measureText(elem, text, canvas, g, size, font) {
    if (canvas===undefined) {
        canvas = undefined;
    }
    if (g===undefined) {
        g = undefined;
    }
    if (size===undefined) {
        size = undefined;
    }
    if (font===undefined) {
        font = undefined;
    }
    if (typeof canvas==="object"&&canvas!==null&&!(__instance_of(canvas, HTMLCanvasElement))&&canvas.tagName!=="CANVAS") {
        let args=canvas;
        canvas = args.canvas;
        g = args.g;
        size = args.size;
        font = args.font;
    }
    if (g===undefined) {
        canvas = get_measure_canvas();
        g = canvas.g;
    }
    if (font!==undefined) {
        if (typeof font==="object"&&__instance_of(font, CSSFont)) {
            font = font.genCSS(size);
        }
        g.font = font;
    }
    else {
      _ensureFont(elem, canvas, g, size);
    }
    let ret=g.measureText(text);
    if (ret&&util.isMobile()) {
        let ret2={};
        let dpi=UIBase.getDPI();
        for (let k in ret) {
            let v=ret[k];
            if (typeof v==="number") {
                v*=dpi;
            }
            ret2[k] = v;
        }
        ret = ret2;
    }
    if (size!==undefined) {
        g.font = undefined;
    }
    return ret;
  }
  measureText = _es6_module.add_export('measureText', measureText);
  function drawText(elem, x, y, text, args) {
    if (args===undefined) {
        args = {};
    }
    let canvas=args.canvas, g=args.g, color=args.color, font=args.font;
    let size=args.size;
    if (size===undefined) {
        if (font!==undefined&&__instance_of(font, CSSFont)) {
            size = font.size;
        }
        else {
          size = elem.getDefault("DefaultText").size;
        }
    }
    size*=UIBase.getDPI();
    if (color===undefined) {
        if (font&&font.color) {
            color = font.color;
        }
        else {
          color = elem.getDefault("DefaultText").color;
        }
    }
    if (font===undefined) {
        _ensureFont(elem, canvas, g, size);
    }
    else 
      if (typeof font==="object"&&__instance_of(font, CSSFont)) {
        g.font = font = font.genCSS(size);
    }
    else 
      if (font) {
        g.font = font;
    }
    if (typeof color==="object") {
        color = color2css(color);
    }
    g.fillStyle = color;
    g.fillText(text, x+0.5, y+0.5);
    if (size!==undefined) {
        g.font = undefined;
    }
  }
  drawText = _es6_module.add_export('drawText', drawText);
  let PIDX=0, PSHADOW=1, PTOT=2;
  function saveUIData(node, key) {
    if (key===undefined) {
        throw new Error("ui_base.saveUIData(): key cannot be undefined");
    }
    let paths=[];
    let rec=(n, path, ni, is_shadow) =>      {
      path = path.slice(0, path.length);
      let pi=path.length;
      for (let i=0; i<PTOT; i++) {
          path.push(undefined);
      }
      path[pi] = ni;
      path[pi+1] = is_shadow ? 1 : 0;
      if (__instance_of(n, UIBase)) {
          let path2=path.slice(0, path.length);
          let data=n.saveData();
          let bad=!data;
          bad = bad||(typeof data==="object"&&Object.keys(data).length===0);
          if (!bad) {
              path2.push(data);
              if (path2[pi+2]) {
                  paths.push(path2);
              }
          }
      }
      for (let i=0; i<n.childNodes.length; i++) {
          let n2=n.childNodes[i];
          rec(n2, path, i, false);
      }
      let shadow=n.shadow;
      if (!shadow)
        return ;
      for (let i=0; i<shadow.childNodes.length; i++) {
          let n2=shadow.childNodes[i];
          rec(n2, path, i, true);
      }
    }
    rec(node, [], 0, false);
    return JSON.stringify({key: key, 
    paths: paths, 
    _ui_version: 1});
  }
  saveUIData = _es6_module.add_export('saveUIData', saveUIData);
  window._saveUIData = saveUIData;
  function loadUIData(node, buf) {
    if (buf===undefined||buf===null) {
        return ;
    }
    let obj=JSON.parse(buf);
    let key=buf.key;
    for (let path of obj.paths) {
        let n=node;
        let data=path[path.length-1];
        path = path.slice(2, path.length-1);
        for (let pi=0; pi<path.length; pi+=PTOT) {
            let ni=path[pi], shadow=path[pi+1];
            let list;
            if (shadow) {
                list = n.shadow;
                if (list) {
                    list = list.childNodes;
                }
            }
            else {
              list = n.childNodes;
            }
            if (list===undefined||list[ni]===undefined) {
                n = undefined;
                break;
            }
            n = list[ni];
        }
        if (n!==undefined&&__instance_of(n, UIBase)) {
            n._init();
            n.loadData(data);
        }
    }
  }
  loadUIData = _es6_module.add_export('loadUIData', loadUIData);
  UIBase.PositionKey = "fixed";
  window._loadUIData = loadUIData;
  aspect._setUIBase(UIBase);
}, '/dev/fairmotion/src/path.ux/scripts/core/ui_base.js');


es6_module_define('ui_consts', [], function _ui_consts_module(_es6_module) {
  const ClassIdSymbol=Symbol("pathux-class-id");
  _es6_module.add_export('ClassIdSymbol', ClassIdSymbol);
}, '/dev/fairmotion/src/path.ux/scripts/core/ui_consts.js');


es6_module_define('ui_save', ["../path-controller/util/parseutil.js", "../util/util.js", "../util/vectormath.js"], function _ui_save_module(_es6_module) {
  var util=es6_import(_es6_module, '../util/util.js');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector3');
  const UI_SAVE_VERSION=2;
  _es6_module.add_export('UI_SAVE_VERSION', UI_SAVE_VERSION);
  function debuglog() {
    if (window.DEBUG&&window.DEBUG.uipaths) {
        console.warn.apply(...arguments);
    }
  }
  let UIBase;
  function setUIBase(cls) {
    UIBase = cls;
  }
  setUIBase = _es6_module.add_export('setUIBase', setUIBase);
  function saveUIData(node, key) {
    if (key===undefined) {
        throw new Error("ui_base.saveUIData(): key cannot be undefined");
    }
    let paths=new Map();
    let rec=(path, n) =>      {
      if (!(__instance_of(n, HTMLElement))) {
          return ;
      }
      if (__instance_of(n, UIBase)) {
          let path2=n.constructor.define().tagname+"|"+path;
          paths.set(path2, n.saveData());
      }
      let ni=0;
      for (let n2 of n.childNodes) {
          let path2=path+`[${ni}]`;
          rec(path2, n2);
          ni++;
      }
      if (n.shadow) {
          let ni=0;
          for (let n2 of n.shadow.childNodes) {
              let path2=path+`{${ni}}`;
              rec(path2, n2);
              ni++;
          }
      }
    }
    rec("", node, undefined, 0, false);
    let paths2={}
    for (let /*unprocessed ExpandNode*/[path, data] of paths) {
        let bad=!data;
        bad = bad||(typeof data==="object"&&Object.keys(data).length===0);
        if (!bad) {
            paths2[path] = data;
        }
    }
    paths = paths2;
    return JSON.stringify({version: UI_SAVE_VERSION, 
    key: key, 
    paths: paths});
  }
  saveUIData = _es6_module.add_export('saveUIData', saveUIData);
  var tokdef=es6_import_item(_es6_module, '../path-controller/util/parseutil.js', 'tokdef');
  var parser=es6_import_item(_es6_module, '../path-controller/util/parseutil.js', 'parser');
  var lexer=es6_import_item(_es6_module, '../path-controller/util/parseutil.js', 'lexer');
  var PUTLParseError=es6_import_item(_es6_module, '../path-controller/util/parseutil.js', 'PUTLParseError');
  function makeParser() {
    const tk=(name, re, func) =>      {
      return new tokdef(name, re, func);
    }
    let p;
    const tokens=[tk("LSBRACKET", /\[/), tk("RSBRACKET", /\]/), tk("LBRACE", /\{/), tk("RBRACE", /\}/), tk("NUM", /[0-9]+/, (t) =>      {
      return t.setValue(parseInt(t.value));
    }), tk("WS", /[ \t]/, (token) =>      {
      return undefined;
    })];
    function p_error(t) {
      console.warn(t);
      p.userdata = undefined;
      throw new PUTLParseError("Parse error");
    }
    const l=new lexer(tokens);
    p = new parser(l, p_error);
    function consumeAll() {
      while (!p.at_end()) {
        p.next();
      }
    }
    function p_Start() {
      let node=p.userdata;
      while (!p.at_end()) {
        let t=p.peeknext();
        if (t.type==="LSBRACKET") {
            p.next();
            let idx=p.expect("NUM");
            if (idx>=node.childNodes.length||!(__instance_of(node.childNodes[idx], HTMLElement))) {
                let li=p.lexer.lexpos;
                let path=p.lexer.lexdata;
                debuglog(idx, p.lexer.lexpos, path.slice(li-3, path.length), node.childNodes);
                consumeAll();
                return undefined;
            }
            node = node.childNodes[idx];
            p.expect('RSBRACKET');
        }
        else 
          if (t.type==="LBRACE") {
            p.next();
            let idx=p.expect("NUM");
            if (!node.shadow||idx>=node.shadow.childNodes.length||!(__instance_of(node.shadow.childNodes[idx], HTMLElement))) {
                let li=p.lexer.lexpos;
                let path=p.lexer.lexdata;
                debuglog(idx, p.lexer.lexpos, path.slice(li-3, path.length), node, node.shadow ? node.shadow.childNodes : undefined);
                consumeAll();
                return undefined;
            }
            node = node.shadow.childNodes[idx];
            p.expect("RBRACE");
        }
        else {
          p.expect("LBRACE");
        }
      }
      return node;
    }
    p.start = p_Start;
    return p;
  }
  makeParser = _es6_module.add_export('makeParser', makeParser);
  const pathParser=makeParser();
  function loadPath(node, key, json) {
    console.log(key);
    key = key.split("|");
    let tagname=key[0].trim();
    let path=(key[1]||"").trim();
    if (path==="") {
        if (tagname===node.constructor.define().tagname) {
            node.loadData(json);
        }
        else {
          debuglog("Failed to load ui save path", key);
        }
        return ;
    }
    pathParser.userdata = node;
    let child;
    try {
      child = pathParser.parse(path);
    }
    catch (error) {
        if (__instance_of(error, PUTLParseError)) {
            console.error("Parse error parsing ui save path "+path);
        }
        else {
          throw error;
        }
    }
    if (child&&child.constructor.define().tagname!==tagname) {
        debuglog("Failed to load ui save path", key);
        child = undefined;
    }
    else 
      if (!child) {
        debuglog("Failed to load ui save path", key);
    }
    pathParser.userdata = undefined;
    if (child) {
        child.loadData(json);
    }
  }
  loadPath = _es6_module.add_export('loadPath', loadPath);
  function loadUIData(node, json) {
    if (typeof json==='string') {
        json = JSON.parse(json);
    }
    for (let k in json.paths) {
        let v=json.paths[k];
        if (v===undefined) {
            continue;
        }
        loadPath(node, k, v);
    }
  }
  loadUIData = _es6_module.add_export('loadUIData', loadUIData);
}, '/dev/fairmotion/src/path.ux/scripts/core/ui_save.js');


es6_module_define('ui_theme', ["../path-controller/util/util.js", "../path-controller/util/struct.js", "../path-controller/util/vectormath.js", "../config/const.js"], function _ui_theme_module(_es6_module) {
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var Vector3=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector4');
  var nstructjs=es6_import_item(_es6_module, '../path-controller/util/struct.js', 'default');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  let compatMap={BoxMargin: "padding", 
   BoxBG: "background", 
   BoxRadius: "border-radius", 
   background: "background-color", 
   defaultWidth: "width", 
   defaultHeight: "height", 
   DefaultWidth: "width", 
   DefaultHeight: "height", 
   BoxBorder: "border-color", 
   BoxLineWidth: "border-width", 
   BoxSubBG: "background-color", 
   BoxSub2BG: "background-color", 
   DefaultPanelBG: "background-color", 
   InnerPanelBG: "background-color", 
   Background: "background-color", 
   numslider_width: "width", 
   numslider_height: "height"}
  compatMap = _es6_module.add_export('compatMap', compatMap);
  let ColorSchemeTypes={LIGHT: "light", 
   DARK: "dark"}
  ColorSchemeTypes = _es6_module.add_export('ColorSchemeTypes', ColorSchemeTypes);
  function parsepx(css) {
    return parseFloat(css.trim().replace("px", ""));
  }
  parsepx = _es6_module.add_export('parsepx', parsepx);
  function color2css(c, alpha_override) {
    let r=~~(c[0]*255);
    let g=~~(c[1]*255);
    let b=~~(c[2]*255);
    let a=c.length<4 ? 1.0 : c[3];
    a = alpha_override!==undefined ? alpha_override : a;
    if (c.length===3&&alpha_override===undefined) {
        return `rgb(${r},${g},${b})`;
    }
    else {
      return `rgba(${r},${g},${b}, ${a})`;
    }
  }
  color2css = _es6_module.add_export('color2css', color2css);
  window.color2css = color2css;
  let css2color_rets=util.cachering.fromConstructor(Vector4, 64);
  let basic_colors={'white': [1, 1, 1], 
   'grey': [0.5, 0.5, 0.5], 
   'gray': [0.5, 0.5, 0.5], 
   'black': [0, 0, 0], 
   'red': [1, 0, 0], 
   'yellow': [1, 1, 0], 
   'green': [0, 1, 0], 
   'teal': [0, 1, 1], 
   'cyan': [0, 1, 1], 
   'blue': [0, 0, 1], 
   'orange': [1, 0.5, 0.25], 
   'brown': [0.5, 0.4, 0.3], 
   'purple': [1, 0, 1], 
   'pink': [1, 0.5, 0.5]}
  function color2web(color) {
    function tostr(n) {
      n = ~~(n*255);
      let s=n.toString(16);
      if (s.length>2) {
          s = s.slice(0, 2);
      }
      while (s.length<2) {
        s = "0"+s;
      }
      return s;
    }
    if (color.length===3||color[3]===1.0) {
        let r=tostr(color[0]);
        let g=tostr(color[1]);
        let b=tostr(color[2]);
        return "#"+r+g+b;
    }
    else {
      let r=tostr(color[0]);
      let g=tostr(color[1]);
      let b=tostr(color[2]);
      let a=tostr(color[3]);
      return "#"+r+g+b+a;
    }
  }
  color2web = _es6_module.add_export('color2web', color2web);
  window.color2web = color2web;
  function css2color(color) {
    if (!color) {
        return new Vector4([0, 0, 0, 1]);
    }
    color = (""+color).trim();
    let ret=css2color_rets.next();
    if (color[0]==="#") {
        color = color.slice(1, color.length);
        let parts=[];
        for (let i=0; i<color.length>>1; i++) {
            let part="0x"+color.slice(i*2, i*2+2);
            parts.push(parseInt(part));
        }
        ret.zero();
        let i;
        for (i = 0; i<Math.min(parts.length, ret.length); i++) {
            ret[i] = parts[i]/255.0;
        }
        if (i<4) {
            ret[3] = 1.0;
        }
        return ret;
    }
    if (color in basic_colors) {
        ret.load(basic_colors[color]);
        ret[3] = 1.0;
        return ret;
    }
    color = color.replace("rgba", "").replace("rgb", "").replace(/[\(\)]/g, "").trim().split(",");
    for (let i=0; i<color.length; i++) {
        ret[i] = parseFloat(color[i]);
        if (i<3) {
            ret[i]/=255;
        }
    }
    if (color.length===3) {
        color.push(1.0);
    }
    return ret;
  }
  css2color = _es6_module.add_export('css2color', css2color);
  window.css2color = css2color;
  function web2color(str) {
    if (typeof str==="string"&&str.trim()[0]!=="#") {
        str = "#"+str.trim();
    }
    return css2color(str);
  }
  web2color = _es6_module.add_export('web2color', web2color);
  window.web2color = web2color;
  let validate_pat=/\#?[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;
  function validateWebColor(str) {
    if (typeof str!=="string"&&!(__instance_of(str, String)))
      return false;
    return str.trim().search(validate_pat)===0;
  }
  validateWebColor = _es6_module.add_export('validateWebColor', validateWebColor);
  let num="(([0-9]+\.[0-9]+)|[0-9a-f]+)";
  let validate_rgba=new RegExp(`rgba\\(${num},${num},${num},${num}\\)$`);
  let validate_rgb=new RegExp(`rgb\\(${num},${num},${num}\\)$`);
  function validateCSSColor(color) {
    if (color.toLowerCase() in basic_colors) {
        return true;
    }
    let rgba=color.toLowerCase().replace(/[ \t]/g, "");
    rgba = rgba.trim();
    if (validate_rgba.test(rgba)||validate_rgb.exec(rgba)) {
        return true;
    }
    return validateWebColor(color);
  }
  validateCSSColor = _es6_module.add_export('validateCSSColor', validateCSSColor);
  window.validateCSSColor = validateCSSColor;
  let theme={}
  theme = _es6_module.add_export('theme', theme);
  function invertTheme() {
    cconst.colorSchemeType = cconst.colorSchemeType===ColorSchemeTypes.LIGHT ? ColorSchemeTypes.DARK : ColorSchemeTypes.LIGHT;
    function inverted(color) {
      if (Array.isArray(color)) {
          for (let i=0; i<3; i++) {
              color[i] = 1.0-color[i];
          }
          return color;
      }
      color = css2color(color);
      return color2css(inverted(color));
    }
    let bg=document.body.style["background-color"];
    bg = cconst.colorSchemeType===ColorSchemeTypes.LIGHT ? "rgb(200,200,200)" : "rgb(55, 55, 55)";
    document.body.style["background-color"] = bg;
    for (let style in theme) {
        style = theme[style];
        for (let k in style) {
            let v=style[k];
            if (__instance_of(v, CSSFont)) {
                v.color = inverted(v.color);
            }
            else 
              if (typeof v==="string") {
                v = v.trim().toLowerCase();
                let iscolor=v.search("rgb")>=0;
                iscolor = iscolor||v in basic_colors;
                iscolor = iscolor||validateWebColor(v);
                if (iscolor) {
                    style[k] = inverted(v);
                }
            }
        }
    }
  }
  invertTheme = _es6_module.add_export('invertTheme', invertTheme);
  window.invertTheme = invertTheme;
  function setColorSchemeType(mode) {
    if (!!mode!==cconst.colorSchemeType) {
        invertTheme();
        cconst.colorSchemeType = mode;
    }
  }
  setColorSchemeType = _es6_module.add_export('setColorSchemeType', setColorSchemeType);
  window.validateWebColor = validateWebColor;
  let _digest=new util.HashDigest();
  class CSSFont  {
     constructor(args={}) {
      this._size = args.size ? args.size : 12;
      this.font = args.font;
      this.style = args.style!==undefined ? args.style : "normal";
      this.weight = args.weight!==undefined ? args.weight : "normal";
      this.variant = args.variant!==undefined ? args.variant : "normal";
      this.color = args.color;
    }
     calcHashUpdate(digest=_digest.reset()) {
      digest.add(this._size||0);
      digest.add(this.font);
      digest.add(this.style);
      digest.add(this.weight);
      digest.add(this.variant);
      digest.add(this.color);
      return digest.get();
    }
    set  size(val) {
      this._size = val;
    }
    get  size() {
      if (util.isMobile()) {
          let mul=theme.base.mobileTextSizeMultiplier/visualViewport.scale;
          if (mul) {
              return this._size*mul;
              
          }
      }
      return this._size;
    }
     copyTo(b) {
      b._size = this._size;
      b.font = this.font;
      b.style = this.style;
      b.color = this.color;
      b.variant = this.variant;
      b.weight = this.weight;
    }
     copy() {
      let ret=new CSSFont();
      this.copyTo(ret);
      return ret;
    }
     genCSS(size=this.size) {
      return `${this.style} ${this.variant} ${this.weight} ${size}px ${this.font}`;
    }
     hash() {
      return this.genKey();
    }
     genKey() {
      let color=this.color;
      if (typeof this.color==="object"||typeof this.color==="function") {
          color = JSON.stringify(color);
      }
      return this.genCSS()+":"+this.size+":"+color;
    }
  }
  _ESClass.register(CSSFont);
  _es6_module.add_class(CSSFont);
  CSSFont = _es6_module.add_export('CSSFont', CSSFont);
  CSSFont.STRUCT = `
CSSFont {
  size     : float | obj._size;
  font     : string | obj.font || "";
  style    : string | obj.font || "";
  color    : string | ""+obj.color;
  variant  : string | obj.variant || "";
  weight   : string | ""+obj.weight;
}
`;
  nstructjs.register(CSSFont);
  function exportTheme(theme1, addVarDecl) {
    if (theme1===undefined) {
        theme1 = theme;
    }
    if (addVarDecl===undefined) {
        addVarDecl = true;
    }
    let sortkeys=(obj) =>      {
      let keys=[];
      for (let k in obj) {
          keys.push(k);
      }
      keys.sort();
      return keys;
    }
    let s=addVarDecl ? "var theme = {\n" : "{\n";
    function writekey(v, indent) {
      if (indent===undefined) {
          indent = "";
      }
      if (typeof v==="string") {
          if (v.search("\n")>=0) {
              v = "`"+v+"`";
          }
          else {
            v = "'"+v+"'";
          }
          return v;
      }
      else 
        if (typeof v==="object") {
          if (__instance_of(v, CSSFont)) {
              return `new CSSFont({
${indent}  font    : ${writekey(v.font)},
${indent}  weight  : ${writekey(v.weight)},
${indent}  variant : ${writekey(v.variant)},
${indent}  style   : ${writekey(v.style)},
${indent}  size    : ${writekey(v._size)},
${indent}  color   : ${writekey(v.color)}
${indent}})`;
          }
          else {
            let s="{\n";
            for (let k of sortkeys(v)) {
                let v2=v[k];
                if (k.search(" ")>=0||k.search("-")>=0) {
                    k = "'"+k+"'";
                }
                s+=indent+"  "+k+" : "+writekey(v2, indent+"  ")+",\n";
            }
            s+=indent+"}";
            return s;
          }
      }
      else {
        return ""+v;
      }
      return "error";
    }
    for (let k of sortkeys(theme1)) {
        let k2=k;
        if (k.search("-")>=0||k.search(" ")>=0) {
            k2 = "'"+k+"'";
        }
        s+="  "+k2+": ";
        let v=theme1[k];
        if (typeof v!=="object"||__instance_of(v, CSSFont)) {
            s+=writekey(v, "  ")+",\n";
        }
        else {
          s+=" {\n";
          let s2="";
          let maxwid=0;
          for (let k2 of sortkeys(v)) {
              if (k2.search("-")>=0||k2.search(" ")>=0) {
                  k2 = "'"+k2+"'";
              }
              maxwid = Math.max(maxwid, k2.length);
          }
          for (let k2 of sortkeys(v)) {
              let v2=v[k2];
              if (k2.search("-")>=0||k2.search(" ")>=0) {
                  k2 = "'"+k2+"'";
              }
              let pad="";
              for (let i=0; i<maxwid-k2.length; i++) {
                  pad+=" ";
              }
              s2+="    "+k2+pad+": "+writekey(v2, "    ")+",\n";
          }
          s+=s2;
          s+="  },\n\n";
        }
    }
    s+="};\n";
    return s;
  }
  exportTheme = _es6_module.add_export('exportTheme', exportTheme);
  window._exportTheme = exportTheme;
}, '/dev/fairmotion/src/path.ux/scripts/core/ui_theme.js');

