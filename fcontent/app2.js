
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


es6_module_define('ajax', ["../config/config.js", "../util/strutils.js"], function _ajax_module(_es6_module) {
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


es6_module_define('raster', ["../config/config.js", "./icon.js"], function _raster_module(_es6_module) {
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
  var $ret_PX9V_viewport;
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
        $ret_PX9V_viewport[0][0] = $ret_PX9V_viewport[0][1] = 0.0;
        $ret_PX9V_viewport[1][0] = g_app_state.screen.size[0];
        $ret_PX9V_viewport[1][1] = g_app_state.screen.size[1];
        return $ret_PX9V_viewport;
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
  var $ret_PX9V_viewport=[[0, 0], [0, 0]];
  _ESClass.register(RasterState);
  _es6_module.add_class(RasterState);
  RasterState = _es6_module.add_export('RasterState', RasterState);
}, '/dev/fairmotion/src/core/raster.js');


es6_module_define('imageblock', ["../editors/viewport/selectmode.js", "../path.ux/scripts/util/vectormath.js", "./struct.js", "./toolops_api.js", "../util/strutils.js", "../editors/viewport/view2d_editor.js", "./lib_api.js"], function _imageblock_module(_es6_module) {
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


es6_module_define('image_ops', ["../core/struct.js", "../core/fileapi/fileapi.js", "../config/config.js", "../curve/spline_draw.js", "../path.ux/scripts/util/struct.js", "../core/lib_api.js", "../core/toolops_api.js", "../core/imageblock.js", "../core/toolprops.js", "../curve/spline.js", "../core/frameset.js"], function _image_ops_module(_es6_module) {
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


es6_module_define('UserSettings', ["../editors/theme.js", "../path.ux/scripts/util/util.js", "./struct.js", "../path.ux/scripts/core/ui_base.js", "../config/config.js", "../util/strutils.js", "../datafiles/theme.js", "../path.ux/scripts/core/ui_theme.js"], function _UserSettings_module(_es6_module) {
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


es6_module_define('context', ["../curve/spline.js", "../editors/console/console.js", "./frameset.js", "./data_api/data_api.js", "../editors/curve/CurveEditor.js", "../editors/settings/SettingsEditor.js", "../path.ux/scripts/screen/FrameManager_ops.js", "../path.ux/scripts/pathux.js", "../editors/menubar/MenuBar.js", "./lib_api.js", "../editors/ops/ops_editor.js", "../editors/dopesheet/DopeSheetEditor.js", "../editors/viewport/view2d.js", "../path.ux/scripts/path-controller/controller/context.js", "../scene/scene.js", "../editors/material/MaterialEditor.js", "../editors/editor_base.js"], function _context_module(_es6_module) {
  var ContextOverlay=es6_import_item(_es6_module, '../path.ux/scripts/path-controller/controller/context.js', 'ContextOverlay');
  var Context=es6_import_item(_es6_module, '../path.ux/scripts/path-controller/controller/context.js', 'Context');
  var SavedToolDefaults=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'SavedToolDefaults');
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


es6_module_define('toolstack', ["./AppState.js", "./toolprops.js", "./data_api/data_api.js", "./context.js", "./toolops_api.js", "./const.js"], function _toolstack_module(_es6_module) {
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
  var USE_PATHUX_API=es6_import_item(_es6_module, './const.js', 'USE_PATHUX_API');
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
          if (!(tool.undoflag&UndoFlags.NO_UNDO)) {
              tool.undoPre((tool.flag&ToolFlags.USE_TOOL_CONTEXT) ? tool.ctx : ctx);
              tool.undoflag|=UndoFlags.HAS_UNDO_DATA;
          }
          let tctx=(tool.flag&ToolFlags.USE_TOOL_CONTEXT) ? tool.ctx : tool.ctx.toLocked();
          if (the_global_dag!==undefined)
            the_global_dag.reset_cache();
          tool.exec_pre(tctx);
          tool.exec(tctx);
          if (tool.redo_post) {
              tool.redo_post(ctx);
          }
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
      if (USE_PATHUX_API) {
          return ;
      }
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


es6_module_define('AppState', ["../path.ux/scripts/config/const.js", "../editors/viewport/view2d_ops.js", "./struct.js", "./raster.js", "../editors/ops/ops_editor.js", "../path.ux/scripts/screen/ScreenArea.js", "../curve/spline_base.js", "./toolstack.js", "./toolops_api.js", "./frameset.js", "./toolprops.js", "../../platforms/platform.js", "./data_api/data_api_new.js", "./ajax.js", "../editors/theme.js", "./fileapi/fileapi.js", "../path.ux/scripts/util/util.js", "./context.js", "./data_api/data_api_pathux.js", "./startup/startup_file.js", "../path.ux/scripts/screen/FrameManager_ops.js", "./jobs.js", "../editors/console/console.js", "../path.ux/scripts/platforms/electron/electron_api.js", "../editors/curve/CurveEditor.js", "./lib_utils.js", "./UserSettings.js", "../config/config.js", "../editors/editor_base.js", "./data_api/data_api.js", "../editors/settings/SettingsEditor.js", "./const.js", "./lib_api.js", "./startup/startup_file_example.js", "../util/strutils.js", "../editors/material/MaterialEditor.js", "../editors/menubar/MenuBar.js", "./notifications.js", "../editors/all.js", "../path.ux/scripts/screen/FrameManager.js", "../editors/dopesheet/DopeSheetEditor.js", "../path.ux/scripts/core/ui_base.js", "../editors/viewport/view2d.js", "../scene/scene.js"], function _AppState_module(_es6_module) {
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
  var makeAPI=es6_import_item(_es6_module, './data_api/data_api_new.js', 'makeAPI');
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
      if (USE_PATHUX_API) {
          this.api = makeAPI();
          this.pathcontroller = this.api;
      }
      else {
        this.api = new DataAPI(this);
        this.pathcontroller = new PathUXInterface(this.api);
        this.pathcontroller.setContext(new FullContext(this));
      }
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


es6_module_define('data_api', ["../safe_eval.js", "../toolprops.js", "./data_api_types.js", "../../path.ux/scripts/pathux.js", "../../config/config.js", "./data_api_base.js", "../animdata.js", "./data_api_pathux.js", "../../curve/spline_multires.js", "./data_api_parser.js", "../lib_api.js", "../toolops_api.js"], function _data_api_module(_es6_module) {
  var util=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'util');
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
  let arraypool=new util.ArrayPool();
  let token_cachering;
  let tks_cachering;
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
      this.toks = tks_cachering.next();
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
      if (data!==undefined&&data!=="")
        this.lex();
    }
     gen_tok(a, b) {
      var ret=token_cachering.next();
      ret[0] = a;
      ret[1] = b;
      ret.length = 2;
      return ret;
    }
     lex(data) {
      var gt=this.gen_tok;
      if (data===undefined)
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
  token_cachering = new util.cachering(() =>    {
    return {obj: ["", ""], 
    cachesize: 512}
  }, 512);
  tks_cachering = new util.cachering(() =>    {
    return [];
  }, 64);
  TinyParser.split_chars = new set([",", "=", "(", ")", ".", "$", "[", "]"]);
  TinyParser.ws = new set([" ", "\n", "\t", "\r"]);
  var toolmap=es6_import_item(_es6_module, './data_api_pathux.js', 'toolmap');
  var $cache_y5ss_resolve_path_intern;
  var $retcpy_XiNg_set_prop;
  var $scope__O7Q_set_prop;
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
      var ret=arraypool.get(2, false);
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
      if (0) {
          var hash=str;
          if (ctx.screen.active.type!=undefined)
            hash+=ctx.screen.active.type;
          if (hash in this.op_keyhandler_cache) {
              return this.op_keyhandler_cache[hash];
          }
          function find_hotkey_recurse(element) {
            if (element==undefined)
              return undefined;
            var maps=element.get_keymaps();
            for (var i=0; i<maps.length; i++) {
                var km=maps[i];
                var handler=km.get_tool_handler(str);
                if (handler!=undefined)
                  return handler;
            }
            if (__instance_of(element, UIFrame)&&element.active!=undefined) {
                return find_hotkey_recurse(element.active);
            }
          }
          this.op_keyhandler_cache[hash] = find_hotkey_recurse(ctx.screen);
          return this.op_keyhandler_cache[hash];
      }
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
            console.log(error.stack);
            console.log(error.message);
            console.warn("Error calling "+str);
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
        if (!(str in $cache_y5ss_resolve_path_intern)) {
            ret = this.resolve_path_intern2(ctx, str);
            let ret2=[];
            for (let i=0; i<ret.length; i++) {
                ret2.push(ret[i]);
            }
            $cache_y5ss_resolve_path_intern[str] = ret2;
        }
        else {
          ret = $cache_y5ss_resolve_path_intern[str];
          if (ret[0]===undefined||!ret[0].cache_good()) {
              delete $cache_y5ss_resolve_path_intern[str];
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
      $retcpy_XiNg_set_prop.length = ret.length;
      for (var i=0; i<5; i++) {
          $retcpy_XiNg_set_prop[i] = ret[i];
      }
      ret = $retcpy_XiNg_set_prop;
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
                  $scope__O7Q_set_prop[0] = val;
                  path2+=" = scope[0];";
                  this.evaluate(ctx, path2, $scope__O7Q_set_prop);
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
                  $scope__O7Q_set_prop[0] = value;
                  path+=" = scope[0]";
                  this.evaluate(ctx, path, $scope__O7Q_set_prop);
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
  var $cache_y5ss_resolve_path_intern={}
  var $retcpy_XiNg_set_prop=new Array(16);
  var $scope__O7Q_set_prop=[0, 0];
  _ESClass.register(DataAPI);
  _es6_module.add_class(DataAPI);
  DataAPI = _es6_module.add_export('DataAPI', DataAPI);
}, '/dev/fairmotion/src/core/data_api/data_api.js');


es6_module_define('data_api_parser', ["../../util/parseutil.js"], function _data_api_parser_module(_es6_module) {
  "use strict";
  var PUTL=es6_import(_es6_module, '../../util/parseutil.js');
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


es6_module_define('fileapi', ["./fileapi_html5", "./fileapi_chrome", "./fileapi_electron", "../../config/config.js"], function _fileapi_module(_es6_module) {
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


es6_module_define('fileapi_electron', ["./fileapi_html5.js", "../../config/config.js", "../../path.ux/scripts/platforms/electron/electron_api.js"], function _fileapi_electron_module(_es6_module) {
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
    let $_t0ttlh=require('electron'), ipcRenderer=$_t0ttlh.ipcRenderer;
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
    let $_t1mlue=require('electron'), ipcRenderer=$_t1mlue.ipcRenderer;
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


es6_module_define('animdata', ["./lib_api.js", "../curve/spline_base.js", "./eventdag.js", "./struct.js", "./toolprops.js"], function _animdata_module(_es6_module) {
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


es6_module_define('svg_export', ["../vectordraw/vectordraw_svg.js", "./mathlib.js", "../curve/spline_base.js", "../curve/spline_draw.js", "../curve/spline_draw_new.js"], function _svg_export_module(_es6_module) {
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


es6_module_define('anim', ["../path-controller/util/vectormath.js", "../path-controller/curve/curve1d.js", "./ui_theme.js", "../path-controller/util/math.js", "../path-controller/util/util.js"], function _anim_module(_es6_module) {
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
    object.__aspect_methods = new Set();
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
            let $_t0afta=chain2[i], cb=$_t0afta[0], node=$_t0afta[1], once=$_t0afta[2];
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


es6_module_define('theme', ["./ui_theme.js"], function _theme_module(_es6_module) {
  var CSSFont=es6_import_item(_es6_module, './ui_theme.js', 'CSSFont');
  const DefaultTheme={base: {AreaHeaderBG: 'rgba(200, 200, 200, 0.95)', 
    BasePackFlag: 0, 
    BoxDepressed: 'rgba(130,130,130, 1)', 
    BoxHighlight: 'rgba(151,208,239, 1)', 
    DefaultText: new CSSFont({font: 'sans-serif', 
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
    "highlight-pressed": {DefaultText: new CSSFont({font: 'poppins', 
      weight: 'bold', 
      variant: 'normal', 
      style: 'normal', 
      size: 12, 
      color: 'rgba(35,35,35, 1)'}), 
     'background-color': 'rgba(113,113,113, 1)', 
     'border-color': '#DADCE0', 
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
    margin: 4, 
    'margin-left': 4, 
    'margin-right': 4, 
    padding: 1, 
    width: 25}, 
   checkbox: {CheckSide: 'left', 
    height: 32, 
    width: 32}, 
   colorfield: {circleSize: 16, 
    colorBoxHeight: 24, 
    fieldSize: 400, 
    height: 256, 
    hueHeight: 32, 
    width: 256}, 
   colorpickerbutton: {height: 32, 
    width: 120}, 
   curvewidget: {CanvasBG: 'rgba(117,79,79, 1)', 
    CanvasHeight: 256, 
    CanvasWidth: 256}, 
   dropbox: {dropTextBG: 'rgba(233,233,233, 1)', 
    height: 25, 
    width: 32}, 
   iconbutton: {'background-color': 'rgba(15,15,15, 0)', 
    'border-color': 'black', 
    'border-radius': 5, 
    'border-width': 1, 
    height: 32, 
    width: 32, 
    'margin-bottom': 1, 
    'margin-left': 2, 
    'margin-right': 2, 
    'margin-top': 1, 
    padding: 2}, 
   iconcheck: {'background-color': 'rgba(15,15,15, 0)', 
    'border-color': 'rgba(237,209,209, 1)', 
    'border-radius': 5, 
    'border-width': 0, 
    drawCheck: true, 
    height: 32, 
    width: 32, 
    'margin-bottom': 1, 
    'margin-left': 2, 
    'margin-right': 2, 
    'margin-top': 1, 
    padding: 2}, 
   listbox: {ListActive: 'rgba(200, 205, 215, 1.0)', 
    ListHighlight: 'rgba(155, 220, 255, 0.5)', 
    height: 200, 
    width: 110}, 
   menu: {MenuBG: 'rgba(250, 250, 250, 1.0)', 
    MenuBorder: '1px solid grey', 
    MenuHighlight: 'rgba(155, 220, 255, 1.0)', 
    MenuSeparator: `
      width : 100%;
      height : 2px;
      padding : 0px;
      margin : 0px;
      border : none;
      background-color : grey; 
    `, 
    MenuSpacing: 5, 
    MenuText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(25, 25, 25, 1.0)'}), 
    'border-color': 'grey', 
    'border-radius': 5, 
    'border-style': 'solid', 
    'border-width': 1}, 
   numslider: {'background-color': 'rgba(219,219,219, 1)', 
    'border-color': 'black', 
    'border-radius': 1, 
    height: 18, 
    width: 135}, 
   numslider_simple: {DefaultHeight: 18, 
    DefaultWidth: 135, 
    SlideHeight: 10, 
    TextBoxWidth: 45, 
    'background-color': 'rgba(219,219,219, 1)', 
    height: 18, 
    labelOnTop: true, 
    width: 135}, 
   label: {LabelText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 14, 
     color: 'rgba(35, 35, 35, 1.0)'})}, 
   numslider_textbox: {TextBoxHeight: 25, 
    TextBoxWidth: 100, 
    'background-color': 'rgba(219,219,219, 1)', 
    height: 25, 
    labelOnTop: true, 
    width: 120}, 
   panel: {HeaderBorderRadius: 5.829650280441558, 
    HeaderRadius: 5.829650280441558, 
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
    'border-radius': 7.243125760182565, 
    'border-style': 'groove', 
    'border-width': 1.141, 
    'margin-bottom': 15.762442435166511, 
    'margin-bottom-closed': 0, 
    'margin-top': 0.2606556353343805, 
    'margin-top-closed': 0, 
    'margin-left': 0, 
    'margin-right': 0, 
    'padding-bottom': 0.8561244078997758, 
    'padding-left': 0, 
    'padding-right': 0, 
    'padding-top': 0.9665377430621097}, 
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
    'mouse-threshold': 5}, 
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
    padding: 1}, 
   tabs: {TabActive: 'rgba(212,212,212, 1)', 
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
   vecPopupButton: {defaultHeight: 18, 
    defaultWidth: 100, 
    padding: 3}}
  _es6_module.add_export('DefaultTheme', DefaultTheme);
}, '/dev/fairmotion/src/path.ux/scripts/core/theme.js');


es6_module_define('ui', ["../path-controller/util/util.js", "../path-controller/util/vectormath.js", "./ui_theme.js", "../path-controller/util/html5_fileapi.js", "./ui_base.js", "../widgets/ui_menu.js", "../path-controller/controller/controller_base.js", "../widgets/ui_widgets.js", "../path-controller/toolsys/toolprop.js", "../path-controller/util/simple_events.js", "../config/const.js", "../core/units.js"], function _ui_module(_es6_module) {
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
  var list=function list(iter) {
    let ret=[];
    for (let item of iter) {
        ret.push(item);
    }
    return ret;
  }
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
     init() {
      this.dom.style["width"] = "max-content";
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
    set  background(bg) {
      this.__background = bg;
      this.styletag.textContent = `div.containerx {
        background-color : ${bg};
      }
    `;
      this.style["background-color"] = bg;
    }
    static  define() {
      return {tagname: "container-x"}
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
    get  children() {
      let list=[];
      this._forEachChildWidget((n) =>        {
        list.push(n);
      });
      return list;
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
        this.shadow.insertBefore(ch, list(this.children)[i]);
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
            this._menu = createMenu(this.ctx, title, templ);
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
      if (inpath)
        path = this._joinPrefix(inpath);
      packflag|=this.inherit_packflag&~PackFlags.NO_UPDATE;
      let ret=UIBase.createElement("textbox-x");
      if (path!==undefined) {
          ret.setAttribute("datapath", path);
      }
      ret.ctx = this.ctx;
      ret.parentWidget = this;
      ret._init();
      ret.setCSS();
      ret.update();
      ret.packflag|=packflag;
      ret.onchange = cb;
      ret.text = text;
      this._add(ret);
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
      if (prefix.length>0&&!prefix.endsWith(".")&&!path.startsWith(".")) {
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
          if (!(packflag&PackFlags.USE_ICONS)) {
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
            if (packflag&PackFlags.FORCE_PROP_LABELS) {
                let strip=thdis.strip();
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
          let rdef;
          try {
            rdef = this.ctx.api.resolvePath(this.ctx, inpath, true);
          }
          catch (error) {
              if (__instance_of(error, DataPathError)) {
                  util.print_stack(error);
                  console.warn("Error resolving property", inpath);
              }
              else {
                throw error;
              }
          }
          if (rdef&&rdef.prop) {
              let prop=rdef.prop;
              let range=prop.uiRange!==undefined ? prop.uiRange : prop.range;
              range = range===undefined ? [-100000, 100000] : range;
              min = min===undefined ? range[0] : min;
              max = max===undefined ? range[1] : max;
              is_int = is_int===undefined ? prop.type===PropTypes.INT : is_int;
              name = name===undefined ? prop.uiname : name;
              step = step===undefined ? prop.step : step;
              step = step===undefined ? (is_int ? 1 : 0.1) : step;
              decimals = decimals===undefined ? prop.decimalPlaces : decimals;
          }
          else {
            console.warn("warning, failed to lookup property info for path", inpath);
          }
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
      if (is_int)
        ret.setAttribute("integer", is_int);
      if (decimals!==undefined) {
          ret.decimalPlaces = decimals;
      }
      if (callback) {
          ret.onchange = callback;
      }
      this._add(ret);
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
     colorPicker(inpath, packflag=0, mass_set_path=undefined) {
      let path;
      if (inpath) {
          path = this._joinPrefix(inpath);
      }
      let ret=UIBase.createElement("colorpicker-x");
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
    static  define() {
      return {tagname: 'rowframe-x'}
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
    static  define() {
      return {tagname: "colframe-x"}
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
    static  define() {
      return {tagname: "two-column-x"}
    }
  }
  _ESClass.register(TwoColumnFrame);
  _es6_module.add_class(TwoColumnFrame);
  TwoColumnFrame = _es6_module.add_export('TwoColumnFrame', TwoColumnFrame);
  UIBase.internalRegister(TwoColumnFrame);
}, '/dev/fairmotion/src/path.ux/scripts/core/ui.js');

