es6_module_define('native_api', ["ajax", "toolops_api", "spline_base", "spline_math_hermite", "typedwriter", "solver", "built_wasm"], function _native_api_module(_es6_module) {
  var wasm=es6_import(_es6_module, 'built_wasm');
  var active_solves={}
  active_solves = _es6_module.add_export('active_solves', active_solves);
  var solve_starttimes={}
  solve_starttimes = _es6_module.add_export('solve_starttimes', solve_starttimes);
  var solve_starttimes2={}
  solve_starttimes2 = _es6_module.add_export('solve_starttimes2', solve_starttimes2);
  var solve_endtimes={}
  solve_endtimes = _es6_module.add_export('solve_endtimes', solve_endtimes);
  var active_jobs={}
  active_jobs = _es6_module.add_export('active_jobs', active_jobs);
  var constraint=es6_import_item(_es6_module, 'solver', 'constraint');
  var solver=es6_import_item(_es6_module, 'solver', 'solver');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var SplineTypes=es6_import_item(_es6_module, 'spline_base', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, 'spline_base', 'SplineFlags');
  var build_solver=es6_import_item(_es6_module, 'spline_math_hermite', 'build_solver');
  var TypedWriter=es6_import_item(_es6_module, 'typedwriter', 'TypedWriter');
  var ajax=es6_import(_es6_module, 'ajax');
  var mmax=Math.max, mmin=Math.min, mfloor=Math.floor;
  var abs=Math.abs, sqrt=Math.sqrt, sin=Math.sin, cos=Math.cos, pow=Math.pow, log=Math.log, acos=Math.acos, asin=Math.asin, PI=Math.PI;
  var last_call=undefined;
  var DEBUG=false;
  var FIXED_KS_FLAG=SplineFlags.FIXED_KS;
  var callbacks={}
  callbacks = _es6_module.add_export('callbacks', callbacks);
  var msg_idgen=0;
  var solve_idgen=0;
  var ORDER=es6_import_item(_es6_module, 'spline_math_hermite', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, 'spline_math_hermite', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, 'spline_math_hermite', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, 'spline_math_hermite', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, 'spline_math_hermite', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, 'spline_math_hermite', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, 'spline_math_hermite', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, 'spline_math_hermite', 'INT_STEPS');
  function onMessage(type, message, ptr) {
    var iview=new Int32Array(message);
    var id=iview[1];
    if (DEBUG)
      console.log("got array buffer!", message, "ID", id);
    if (!(id in callbacks)) {
        if (DEBUG)
          console.log("Warning, dead communication callback", id);
        return ;
    }
    var job=callbacks[id], iter=job.job;
    if (DEBUG)
      console.log("job:", job);
    job.status.data = message.slice(8, message.byteLength);
    if (DEBUG)
      console.log("iter:", iter, iter.data);
    var ret=iter.next();
    if (ret.done) {
        delete callbacks[id];
        if (job.callback!=undefined)
          job.callback.call(job.thisvar, job.status.value);
    }
    wasm._free(ptr);
  }
  onMessage = _es6_module.add_export('onMessage', onMessage);
  var messageQueue=[];
  messageQueue = _es6_module.add_export('messageQueue', messageQueue);
  var queueMessages=false;
  function queueUpMessages(state) {
    queueMessages = state;
  }
  queueUpMessages = _es6_module.add_export('queueUpMessages', queueUpMessages);
  function flushQueue() {
    let queue=messageQueue.slice(0, messageQueue.length);
    messageQueue.length = 0;
    var __iter_msg=__get_iter(queue);
    var msg;
    while (1) {
      var __ival_msg=__iter_msg.next();
      if (__ival_msg.done) {
          break;
      }
      msg = __ival_msg.value;
      onMessage(msg.type, msg.msg, msg.ptr);
    }
  }
  flushQueue = _es6_module.add_export('flushQueue', flushQueue);
  window._wasm_post_message = function(type, ptr, len) {
    if (DEBUG)
      console.log("got wasm message", type, ptr, len);
    let message=wasm.HEAPU8.slice(ptr, ptr+len).buffer;
    if (DEBUG)
      console.log(message);
    if (!queueMessages) {
        onMessage(type, message, ptr);
    }
    else {
      if (DEBUG)
        console.log("Queuing a message!", type, message, ptr, "=======");
      messageQueue.push({type: type, msg: message, ptr: ptr});
    }
  }
  function postToWasm(type, msg) {
    if (!(__instance_of(msg, ArrayBuffer))) {
        throw new Error("msg must be array buffer");
    }
    let bytes=new Uint8Array(msg);
    let ptr=wasm._malloc(msg.byteLength*2);
    let mem=wasm.HEAPU8;
    for (let i=ptr; i<ptr+bytes.length; i++) {
        mem[i] = bytes[i-ptr];
    }
    wasm._gotMessage(type, ptr, msg.byteLength);
    wasm._free(ptr);
  }
  postToWasm = _es6_module.add_export('postToWasm', postToWasm);
  function test_wasm() {
    let msg=new Int32Array([0, 1, 2, 3, 2, 1, -1]);
    console.log(msg);
    postToWasm(0, msg.buffer);
  }
  test_wasm = _es6_module.add_export('test_wasm', test_wasm);
  var MessageTypes={GEN_DRAW_BEZIERS: 0, REPLY: 1, SOLVE: 2}
  MessageTypes = _es6_module.add_export('MessageTypes', MessageTypes);
  var ConstraintTypes={TAN_CONSTRAINT: 0, HARD_TAN_CONSTRAINT: 1, CURVATURE_CONSTRAINT: 2, COPY_C_CONSTRAINT: 3}
  ConstraintTypes = _es6_module.add_export('ConstraintTypes', ConstraintTypes);
  var JobTypes={DRAWSOLVE: 1, PATHSOLVE: 2, SOLVE: 1|2}
  JobTypes = _es6_module.add_export('JobTypes', JobTypes);
  function clear_jobs_except_latest(typeid) {
    var last=undefined;
    var lastk=undefined;
    for (var k in callbacks) {
        var job=callbacks[k];
        if (job.typeid&typeid) {
            job._skip = 1;
            delete callbacks[k];
            last = job;
            lastk = k;
        }
    }
    if (last!=undefined) {
        callbacks[lastk] = last;
        delete last._skip;
    }
  }
  clear_jobs_except_latest = _es6_module.add_export('clear_jobs_except_latest', clear_jobs_except_latest);
  function clear_jobs_except_first(typeid) {
    var last=undefined;
    var lastk=undefined;
    for (var k in callbacks) {
        var job=callbacks[k];
        if (job.typeid&typeid) {
            if (last!=undefined) {
                job._skip = 1;
                delete callbacks[k];
            }
            last = job;
            lastk = k;
        }
    }
  }
  clear_jobs_except_first = _es6_module.add_export('clear_jobs_except_first', clear_jobs_except_first);
  function clear_jobs(typeid) {
    for (var k in callbacks) {
        var job=callbacks[k];
        if (job.typeid&typeid) {
            job._skip = 1;
            delete callbacks[k];
        }
    }
  }
  clear_jobs = _es6_module.add_export('clear_jobs', clear_jobs);
  function call_api(job, params) {
    if (params==undefined) {
        params = undefined;
    }
    var callback, error, thisvar, typeid, only_latest=false;
    if (params!=undefined) {
        callback = params.callback;
        thisvar = params.thisvar!=undefined ? params.thisvar : self;
        error = params.error;
        only_latest = params.only_latest!=undefined ? params.only_latest : false;
        typeid = params.typeid;
    }
    var postMessage=function(type, msg) {
      postToWasm(type, msg);
    }
    var id=msg_idgen++;
    var status={msgid: id, data: undefined}
    var args=[postMessage, status];
    for (var i=2; i<arguments.length; i++) {
        args.push(arguments[i]);
    }
    queueUpMessages(true);
    var iter=job.apply(job, args);
    var ret=iter.next();
    if (ret.done) {
        callback.call(thisvar, iter.value);
        return ;
    }
    if (DEBUG)
      console.log("  SETTING CALLBACK WITH ID", id);
    callbacks[id] = {job: iter, typeid: typeid, only_latest: only_latest, callback: callback, thisvar: thisvar, error: error, status: status}
    queueUpMessages(false);
    flushQueue();
  }
  call_api = _es6_module.add_export('call_api', call_api);
  function start_message(type, msgid, endian) {
    var data=[];
    ajax.pack_int(data, type, endian);
    ajax.pack_int(data, msgid, endian);
    return data;
  }
  start_message = _es6_module.add_export('start_message', start_message);
  function start_message_new(writer, type, msgid, endian) {
    writer.int32(type);
    writer.int32(msgid);
  }
  start_message_new = _es6_module.add_export('start_message_new', start_message_new);
  function _unpacker(dview) {
    var b=0;
    return {getint: function getint() {
      b+=4;
      return dview.getInt32(b-4, endian);
    }, getfloat: function getfloat() {
      b+=4;
      return dview.getFloat32(b-4, endian);
    }, getdouble: function getdouble() {
      b+=8;
      return dview.getFloat64(b-8, endian);
    }}
  }
  function gen_draw_cache(postMessage, status, spline) {
    var __gen_this2=this;
    function _generator_iter() {
      this.scope = {postMessage_0: postMessage, status_0: status, spline_0: spline, data_1: undefined, msgid_1: undefined, endian_1: undefined, __iter_s_1: undefined, s_1: undefined, dview_18: undefined, upack_18: undefined, getint_18: undefined, getfloat_18: undefined, getdouble_18: undefined, tot_18: undefined, ret_18: undefined, eidmap_18: undefined, i_18: undefined}
      this.ret = {done: false, value: undefined}
      this.state = 1;
      this.trystack = [];
      this.next = function() {
        var ret;
        var stack=this.trystack;
        try {
          ret = this._next();
        }
        catch (err) {
            if (stack.length>0) {
                var item=stack.pop(stack.length-1);
                this.state = item[0];
                this.scope[item[1]] = err;
                return this.next();
            }
            else {
              throw err;
            }
        }
        return ret;
      }
      this.push_trystack = function(catchstate, catchvar) {
        this.trystack.push([catchstate, catchvar]);
      }
      this.pop_trystack = function() {
        this.trystack.pop(this.trystack.length-1);
      }
      this._next = function() {
        var $__ret=undefined;
        var $__state=this.state;
        var scope=this.scope;
        while ($__state<33) {
          switch ($__state) {
            case 0:
              break;
            case 1:
              scope.data_1=[];
              scope.msgid_1=scope.status_0.msgid;
              scope.endian_1=ajax.little_endian;
              scope.data_1=start_message(MessageTypes.GEN_DRAW_BEZIERS, scope.msgid_1, scope.endian_1);
              ajax.pack_int(scope.data_1, scope.spline_0.segments.length, scope.endian_1);
              ajax.pack_int(scope.data_1, 0, scope.endian_1);
              scope.__iter_s_1=__get_iter(scope.spline_0.segments);
              scope.s_1;
              
              $__state = 2;
              break;
            case 2:
              $__state = (1) ? 3 : 16;
              break;
            case 3:
              scope.__ival_s_3=scope.__iter_s_1.next();
              
              $__state = 4;
              break;
            case 4:
              $__state = (scope.__ival_s_3.done) ? 5 : 6;
              break;
            case 5:
              $__state = 16;
              break;
              
              $__state = 6;
              break;
            case 6:
              scope.s_1 = scope.__ival_s_3.value;
              ajax.pack_int(scope.data_1, scope.s_1.eid, scope.endian_1);
              ajax.pack_vec3(scope.data_1, scope.s_1.v1, scope.endian_1);
              ajax.pack_vec3(scope.data_1, scope.s_1.v2, scope.endian_1);
              ajax.pack_int(scope.data_1, scope.s_1.ks.length, scope.endian_1);
              scope.zero_ks_6=((scope.s_1.v1.flag&SplineFlags.BREAK_TANGENTS)||(scope.s_1.v2.flag&SplineFlags.BREAK_TANGENTS));
              scope.i_6=0;
              
              $__state = 7;
              break;
            case 7:
              $__state = (scope.i_6<scope.s_1.ks.length) ? 8 : 13;
              break;
            case 8:
              $__state = (scope.zero_ks_6&&scope.i_6<ORDER) ? 9 : 10;
              break;
            case 9:
              ajax.pack_double(scope.data_1, 0.0, scope.endian_1);
              
              $__state = 12;
              break;
            case 10:
              
              $__state = 11;
              break;
            case 11:
              ajax.pack_double(scope.data_1, scope.s_1.ks[scope.i_6], scope.endian_1);
              
              $__state = 12;
              break;
            case 12:
              scope.i_6++;
              
              $__state = 7;
              break;
            case 13:
              scope.rem_13=16-scope.s_1.ks.length;
              scope.i_6=0;
              
              $__state = 14;
              break;
            case 14:
              $__state = (scope.i_6<scope.rem_13) ? 15 : 2;
              break;
            case 15:
              ajax.pack_double(scope.data_1, 0.0, scope.endian_1);
              scope.i_6++;
              
              $__state = 14;
              break;
            case 16:
              scope.data_1 = new Uint8Array(scope.data_1).buffer;
              postMessage(MessageTypes.GEN_DRAW_BEZIERS, scope.data_1);
              
              $__state = 17;
              break;
            case 17:
              $__ret = this.ret;
              $__ret.value = undefined;
              
              $__state = 18;
              break;
            case 18:
              scope.dview_18=new DataView(scope.status_0.data);
              scope.upack_18=_unpacker(scope.dview_18);
              scope.getint_18=scope.upack_18.getint;
              scope.getfloat_18=scope.upack_18.getfloat;
              scope.getdouble_18=scope.upack_18.getdouble;
              scope.tot_18=getint();
              scope.ret_18=[];
              scope.eidmap_18=scope.spline_0.eidmap;
              scope.i_18=0;
              
              $__state = 19;
              break;
            case 19:
              $__state = (scope.i_18<scope.tot_18) ? 20 : 32;
              break;
            case 20:
              scope.eid_20=getint(), scope.totseg_20=getint();
              scope.segs_20=[];
              scope.seg_20=scope.eidmap_18[scope.eid_20];
              
              $__state = 21;
              break;
            case 21:
              $__state = (scope.seg_20==undefined||scope.seg_20.type!=SplineTypes.SEGMENT) ? 22 : 23;
              break;
            case 22:
              console.log("WARNING: defunct segment in gen_draw_cache", scope.seg_20);
              
              $__state = 23;
              break;
            case 23:
              scope.ret_18.push(scope.segs_20);
              scope.j_23=0;
              
              $__state = 24;
              break;
            case 24:
              $__state = (scope.j_23<scope.totseg_20) ? 25 : 26;
              break;
            case 25:
              scope.segs_20[scope.j_23] = [0, 0, 0, 0];
              scope.j_23++;
              
              $__state = 24;
              break;
            case 26:
              scope.j_23=0;
              
              $__state = 27;
              break;
            case 27:
              $__state = (scope.j_23<scope.totseg_20*4) ? 28 : 29;
              break;
            case 28:
              scope.p_28=new Vector3();
              scope.p_28[0] = getdouble();
              scope.p_28[1] = getdouble();
              scope.p_28[2] = 0.0;
              scope.segs_20[Math.floor(scope.j_23/4)][scope.j_23%4] = scope.p_28;
              scope.j_23++;
              
              $__state = 27;
              break;
            case 29:
              $__state = (scope.seg_20!=undefined) ? 30 : 31;
              break;
            case 30:
              scope.seg_20._draw_bzs = scope.segs_20;
              
              $__state = 31;
              break;
            case 31:
              scope.i_18++;
              
              $__state = 19;
              break;
            case 32:
              scope.status_0.value = scope.ret_18;
              
              $__state = 33;
              break;
            case 33:
              break;
            default:
              console.log("Generator state error");
              console.trace();
              break;
          }
          if ($__ret!=undefined) {
              break;
          }
        }
        if ($__ret!=undefined) {
            this.ret.value = $__ret.value;
        }
        else {
          this.ret.done = true;
          this.ret.value = undefined;
        }
        this.state = $__state;
        return this.ret;
      }
      this[Symbol.iterator] = function() {
        return this;
      }
      this.forEach = function(callback, thisvar) {
        if (thisvar==undefined)
          thisvar = self;
        var _i=0;
        while (1) {
          var ret=this.next();
          if (ret==undefined||ret.done||(ret._ret!=undefined&&ret._ret.done))
            break;
          callback.call(thisvar, ret.value);
          if (_i++>100) {
              console.log("inf loop", ret);
              break;
          }
        }
      }
    }
    return new _generator_iter();
  }
  gen_draw_cache = _es6_module.add_export('gen_draw_cache', gen_draw_cache);
  function do_solve(sflags, spline, steps, gk, return_promise, draw_id) {
    if (gk==undefined) {
        gk = 0.95;
    }
    if (return_promise==undefined) {
        return_promise = false;
    }
    if (draw_id==undefined) {
        draw_id = 0;
    }
    if (spline._solve_id==undefined) {
        spline._solve_id = solve_idgen++;
    }
    if (spline._solve_id in active_solves) {
    }
    var job_id=solve_idgen++;
    active_solves[spline._solve_id] = job_id;
    active_jobs[job_id] = spline._solve_id;
    solve_starttimes[job_id] = time_ms();
    var SplineFlags=sflags;
    spline.resolve = 1;
    spline.propagate_update_flags();
    for (var i=0; i<spline.segments.length; i++) {
        var seg=spline.segments[i];
        if ((!(seg.v1.flag&SplineFlags.UPDATE)&&!(seg.v2.flag&SplineFlags.UPDATE)))
          continue;
        if ((seg.v1.flag&SplineFlags.BREAK_TANGENTS)&&(seg.v2.flag&SplineFlags.BREAK_TANGENTS)) {
            for (var j=0; j<seg.ks.length; j++) {
                seg.ks[j] = 1e-07;
            }
        }
        for (var j=0; j<seg.ks.length; j++) {
            if (isNaN(seg.ks[j])) {
                seg.ks[j] = 1e-06;
            }
        }
        seg.evaluate(0.5);
    }
    var on_finish, on_reject, promise;
    if (return_promise) {
        promise = new Promise(function(resolve, reject) {
          on_finish = function() {
            resolve();
          }
          on_reject = function() {
            reject();
          }
        });
    }
    function finish(unload) {
      var start_time=solve_starttimes[job_id];
      window.pop_solve(draw_id);
      var skip=solve_endtimes[spline._solve_id]>start_time;
      skip = skip&&solve_starttimes2[spline._solve_id]>start_time;
      delete active_jobs[job_id];
      delete active_solves[spline._solve_id];
      delete solve_starttimes[job_id];
      if (skip) {
          if (on_reject!=undefined) {
              on_reject();
          }
          console.log("Dropping dead solve job", job_id);
          return ;
      }
      unload();
      solve_endtimes[spline._solve_id] = time_ms();
      solve_starttimes2[spline._solve_id] = start_time;
      console.log((solve_endtimes[spline._solve_id]-start_time).toFixed(2)+"ms");
      for (var i=0; i<spline.segments.length; i++) {
          var seg=spline.segments[i];
          seg.evaluate(0.5);
          for (var j=0; j<seg.ks.length; j++) {
              if (isNaN(seg.ks[j])) {
                  console.log("NaN!", seg.ks, seg);
                  seg.ks[j] = 0;
              }
          }
          if (g_app_state.modalstate!=ModalStates.TRANSFROMING) {
              if ((seg.v1.flag&SplineFlags.UPDATE)||(seg.v2.flag&SplineFlags.UPDATE))
                seg.update_aabb();
          }
          else {
            if ((seg.v1.flag&SplineFlags.UPDATE)||(seg.v2.flag&SplineFlags.UPDATE))
              seg.flag|=SplineFlags.UPDATE_AABB;
          }
      }
      var __iter_f=__get_iter(spline.faces);
      var f;
      while (1) {
        var __ival_f=__iter_f.next();
        if (__ival_f.done) {
            break;
        }
        f = __ival_f.value;
        var __iter_path=__get_iter(f.paths);
        var path;
        while (1) {
          var __ival_path=__iter_path.next();
          if (__ival_path.done) {
              break;
          }
          path = __ival_path.value;
          var __iter_l=__get_iter(path);
          var l;
          while (1) {
            var __ival_l=__iter_l.next();
            if (__ival_l.done) {
                break;
            }
            l = __ival_l.value;
            if (l.v.flag&SplineFlags.UPDATE)
              f.flag|=SplineFlags.UPDATE_AABB;
          }
        }
      }
      if (!spline.is_anim_path) {
          for (var i=0; i<spline.handles.length; i++) {
              var h=spline.handles[i];
              h.flag&=~(SplineFlags.UPDATE|SplineFlags.TEMP_TAG);
          }
          for (var i=0; i<spline.verts.length; i++) {
              var v=spline.verts[i];
              v.flag&=~(SplineFlags.UPDATE|SplineFlags.TEMP_TAG);
          }
      }
      if (spline.on_resolve!=undefined) {
          spline.on_resolve();
          spline.on_resolve = undefined;
      }
      if (on_finish!=undefined) {
          on_finish();
      }
    }
    spline.resolve = 0;
    var update_verts=new set();
    var slv=build_solver(spline, ORDER, undefined, 1, undefined, update_verts);
    var cs=slv.cs, edge_segs=slv.edge_segs;
    edge_segs = new set(edge_segs);
    call_api(nacl_solve, {callback: function(value) {
      finish(value);
    }, error: function(error) {
      console.log("Nacl solve error!");
      window.pop_solve(draw_id);
    }, typeid: spline.is_anim_path ? JobTypes.PATHSOLVE : JobTypes.DRAWSOLVE, only_latest: true}, spline, cs, update_verts, gk, edge_segs);
    return promise;
  }
  do_solve = _es6_module.add_export('do_solve', do_solve);
  window.nacl_do_solve = do_solve;
  function write_nacl_solve_new(writer, spline, cons, update_verts, update_segs, gk, edge_segs) {
    var idxmap={}
    var i=0;
    function add_vert(v) {
      writer.int32(v.eid);
      writer.int32(v.flag);
      writer.vec3(v);
      writer.int32(0);
      idxmap[v.eid] = i++;
    }
    var __iter_v=__get_iter(update_verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      add_vert(v, true);
    }
    writer.int32(update_segs.length);
    writer.int32(0);
    var i=0;
    var __iter_s=__get_iter(update_segs);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      var flag=s.flag;
      if (edge_segs.has(s)) {
          flag|=FIXED_KS_FLAG;
      }
      writer.int32(s.eid);
      writer.int32(flag);
      var klen=s.ks.length;
      var is_eseg=edge_segs.has(s);
      var zero_ks=((s.v1.flag&SplineFlags.BREAK_TANGENTS)||(s.v2.flag&SplineFlags.BREAK_TANGENTS));
      for (var ji=0; ji<1; ji++) {
          for (var j=0; j<klen; j++) {
              if (zero_ks&&j<ORDER)
                writer.float64(0.0);
              else 
                writer.float64(is_eseg ? s.ks[j] : 0.0);
          }
          for (var j=0; j<16-klen; j++) {
              writer.float64(0.0);
          }
      }
      writer.vec3(s.h1);
      writer.vec3(s.h2);
      writer.int32(idxmap[s.v1.eid]);
      writer.int32(idxmap[s.v2.eid]);
      idxmap[s.eid] = i++;
    }
    writer.int32(cons.length);
    writer.int32(0.0);
    for (var i=0; i<cons.length; i++) {
        var c=cons[i];
        var type=0, seg1=-1, seg2=-1, param1=0, param2=0, fparam1=0, fparam2=0;
        if (c.type=="tan_c") {
            type = ConstraintTypes.TAN_CONSTRAINT;
            seg1 = c.params[0];
            seg2 = c.params[1];
            var v=seg1.shared_vert(seg2);
            param1 = idxmap[seg1.eid];
            param2 = idxmap[seg2.eid];
            fparam1 = seg1.v2===v;
            fparam2 = seg2.v2===v;
            if (c.klst.length==1) {
                seg1 = c.klst[0]!==seg1.ks ? param2 : param1;
                seg2 = -1;
            }
            else {
              seg1 = param1;
              seg2 = param2;
            }
        }
        else 
          if (c.type=="hard_tan_c") {
            type = ConstraintTypes.HARD_TAN_CONSTRAINT;
            var seg=c.params[0], tan=c.params[1], s=c.params[2];
            seg1 = idxmap[seg.eid];
            seg2 = -1;
            fparam1 = Math.atan2(tan[0], tan[1]);
            fparam2 = s;
        }
        else 
          if (c.type=="curv_c") {
            type = ConstraintTypes.CURVATURE_CONSTRAINT;
            seg1 = c.params[0];
            seg2 = c.params[1];
            if (seg1.ks!==c.klst[0]) {
            }
            var v=seg1.shared_vert(seg2);
            fparam1 = seg1.v2===v;
            fparam2 = seg2.v2===v;
            param1 = idxmap[seg1.eid];
            param2 = idxmap[seg2.eid];
            seg1 = param1;
            seg2 = -1;
        }
        else 
          if (c.type=="copy_c") {
            type = ConstraintTypes.COPY_C_CONSTRAINT;
            seg1 = c.params[0];
            param1 = seg1.v1.segments.length==1;
        }
        else {
          console.trace(c, seg1, seg2);
          throw new Error("unknown constraint type "+c.type);
        }
        writer.int32(type);
        writer.float32(c.k*gk);
        writer.float32(c.k2==undefined ? c.k*gk : c.k2*gk);
        writer.int32(0);
        writer.int32(seg1);
        writer.int32(seg2);
        writer.int32(param1);
        writer.int32(param2);
        writer.float32(fparam1);
        writer.float32(fparam2);
        for (var j=0; j<33; j++) {
            writer.float64(0);
        }
    }
    return idxmap;
  }
  function write_nacl_solve(data, spline, cons, update_verts, update_segs, gk, edge_segs) {
    var endian=ajax.little_endian;
    var idxmap={}
    var i=0;
    function add_vert(v) {
      ajax.pack_int(data, v.eid, endian);
      ajax.pack_int(data, v.flag, endian);
      ajax.pack_vec3(data, v, endian);
      ajax.pack_int(data, 0, endian);
      idxmap[v.eid] = i++;
    }
    var __iter_v=__get_iter(update_verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      add_vert(v, true);
    }
    ajax.pack_int(data, update_segs.length, endian);
    ajax.pack_int(data, 0, endian);
    var i=0;
    var __iter_s=__get_iter(update_segs);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      var flag=s.flag;
      if (edge_segs.has(s)) {
          flag|=FIXED_KS_FLAG;
      }
      ajax.pack_int(data, s.eid, endian);
      ajax.pack_int(data, flag, endian);
      var klen=s.ks.length;
      var is_eseg=edge_segs.has(s);
      var zero_ks=((s.v1.flag&SplineFlags.BREAK_TANGENTS)||(s.v2.flag&SplineFlags.BREAK_TANGENTS));
      for (var ji=0; ji<1; ji++) {
          for (var j=0; j<klen; j++) {
              if (zero_ks&&j<ORDER)
                ajax.pack_double(data, 0.0, endian);
              else 
                ajax.pack_double(data, is_eseg ? s.ks[j] : 0.0, endian);
          }
          for (var j=0; j<16-klen; j++) {
              ajax.pack_double(data, 0.0, endian);
          }
      }
      ajax.pack_vec3(data, s.h1, endian);
      ajax.pack_vec3(data, s.h2, endian);
      ajax.pack_int(data, idxmap[s.v1.eid], endian);
      ajax.pack_int(data, idxmap[s.v2.eid], endian);
      idxmap[s.eid] = i++;
    }
    ajax.pack_int(data, cons.length, endian);
    ajax.pack_int(data, 0, endian);
    for (var i=0; i<cons.length; i++) {
        var c=cons[i];
        var type=0, seg1=-1, seg2=-1, param1=0, param2=0, fparam1=0, fparam2=0;
        if (c.type=="tan_c") {
            type = ConstraintTypes.TAN_CONSTRAINT;
            seg1 = c.params[0];
            seg2 = c.params[1];
            var v=seg1.shared_vert(seg2);
            param1 = idxmap[seg1.eid];
            param2 = idxmap[seg2.eid];
            fparam1 = seg1.v2===v;
            fparam2 = seg2.v2===v;
            if (c.klst.length==1) {
                seg1 = c.klst[0]!==seg1.ks ? param2 : param1;
                seg2 = -1;
            }
            else {
              seg1 = param1;
              seg2 = param2;
            }
        }
        else 
          if (c.type=="hard_tan_c") {
            type = ConstraintTypes.HARD_TAN_CONSTRAINT;
            var seg=c.params[0], tan=c.params[1], s=c.params[2];
            seg1 = idxmap[seg.eid];
            seg2 = -1;
            fparam1 = Math.atan2(tan[0], tan[1]);
            fparam2 = s;
        }
        else 
          if (c.type=="curv_c") {
            type = ConstraintTypes.CURVATURE_CONSTRAINT;
            seg1 = c.params[0];
            seg2 = c.params[1];
            if (seg1.ks!==c.klst[0]) {
            }
            var v=seg1.shared_vert(seg2);
            fparam1 = seg1.v2===v;
            fparam2 = seg2.v2===v;
            param1 = idxmap[seg1.eid];
            param2 = idxmap[seg2.eid];
            seg1 = param1;
            seg2 = -1;
        }
        else 
          if (c.type=="copy_c") {
            type = ConstraintTypes.COPY_C_CONSTRAINT;
            seg1 = c.params[0];
            param1 = seg1.v1.segments.length==1;
        }
        ajax.pack_int(data, type, endian);
        ajax.pack_float(data, c.k*gk, endian);
        ajax.pack_float(data, c.k2==undefined ? c.k*gk : c.k2*gk, endian);
        ajax.pack_int(data, 0, endian);
        ajax.pack_int(data, seg1, endian);
        ajax.pack_int(data, seg2, endian);
        ajax.pack_int(data, param1, endian);
        ajax.pack_int(data, param2, endian);
        ajax.pack_float(data, fparam1, endian);
        ajax.pack_float(data, fparam2, endian);
        for (var j=0; j<33; j++) {
            ajax.pack_double(data, 0, endian);
        }
    }
    return idxmap;
  }
  function _unload(spline, data) {
    var _i=0;
    function getint() {
      _i+=4;
      return data.getInt32(_i-4, true);
    }
    function getfloat() {
      _i+=4;
      return data.getFloat32(_i-4, true);
    }
    function getdouble() {
      _i+=8;
      return data.getFloat64(_i-8, true);
    }
    var totvert=getint();
    getint();
    _i+=24*totvert;
    var totseg=getint();
    getint();
    if (DEBUG)
      console.log("totseg:", totseg);
    for (var i=0; i<totseg; i++) {
        var eid=getint(), flag=getint();
        var seg=spline.eidmap[eid];
        if (seg==undefined||seg.type!=SplineTypes.SEGMENT) {
            console.log("WARNING: defunct/invalid segment in nacl_solve!", eid);
            _i+=160;
            continue;
        }
        for (var j=0; j<16; j++) {
            var d=getdouble();
            if (j<seg.ks.length) {
                seg.ks[j] = d;
            }
        }
        _i+=4*6;
        _i+=4*2;
    }
  }
  function wrap_unload(spline, data) {
    return function() {
      _unload(spline, data);
    }
  }
  function nacl_solve(postMessage, status, spline, cons, update_verts, gk, edge_segs) {
    var ret={}
    ret.ret = {done: false, value: undefined}
    ret.stage = 0;
    ret[Symbol.iterator] = function() {
      return this;
    }
    ret.next = function() {
      if (ret.stage==0) {
          this.stage++;
          this.stage0();
          return this.ret;
      }
      else 
        if (ret.stage==1) {
          this.stage++;
          this.stage1();
          this.ret.done = true;
          return this.ret;
      }
      else {
        this.ret.done = true;
        this.ret.value = undefined;
        return this.ret;
      }
    }
    var data;
    ret.stage0 = function() {
      var maxsize=(cons.length+1)*650+128;
      var writer=new TypedWriter(maxsize);
      var msgid=status.msgid;
      var endian=ajax.little_endian;
      var prof=false;
      start_message_new(writer, MessageTypes.SOLVE, msgid, endian);
      var timestart=time_ms();
      var update_segs=new set();
      var __iter_v=__get_iter(update_verts);
      var v;
      while (1) {
        var __ival_v=__iter_v.next();
        if (__ival_v.done) {
            break;
        }
        v = __ival_v.value;
        for (var i=0; i<v.segments.length; i++) {
            var s=v.segments[i];
            update_segs.add(s);
        }
      }
      var __iter_s=__get_iter(update_segs);
      var s;
      while (1) {
        var __ival_s=__iter_s.next();
        if (__ival_s.done) {
            break;
        }
        s = __ival_s.value;
        update_verts.add(s.v1);
        update_verts.add(s.v2);
      }
      if (prof)
        console.log("time a:", time_ms()-timestart);
      writer.int32(update_verts.length);
      writer.int32(0);
      if (prof)
        console.log("time b:", time_ms()-timestart);
      var idxmap=write_nacl_solve_new(writer, spline, cons, update_verts, update_segs, gk, edge_segs);
      var data=writer.final();
      if (prof)
        console.log("time c:", time_ms()-timestart);
      if (prof)
        console.log("time d:", time_ms()-timestart, data.byteLength);
      postMessage(MessageTypes.SOLVE, data);
      if (prof)
        console.log("time e:", time_ms()-timestart, "\n\n\n");
    }
    ret.stage1 = function() {
      console.log(status, "<----");
      let buf1=status.data;
      data = new DataView(buf1);
      status.value = wrap_unload(spline, data);
    }
    return ret;
  }
  nacl_solve = _es6_module.add_export('nacl_solve', nacl_solve);
}, '/dev/fairmotion/src/wasm/native_api.js');
es6_module_define('addon_api', [], function _addon_api_module(_es6_module) {
  "use strict";
  var modules={}
  var Addon=_ESClass("Addon", [_ESClass.static(function define() {
    return {author: "", email: "", version: "", tooltip: "", description: "", struct_classes: []}
  }), function Addon(manager) {
    this.manager = manager;
  }, function define_data_api(api) {
  }, function init_addon() {
  }, function destroy_addon() {
  }, function handle_versioning(file, oldversion) {
  }]);
  _es6_module.add_class(Addon);
  Addon = _es6_module.add_export('Addon', Addon);
  var AddonManager=_ESClass("AddonManager", [function AddonManager() {
    this.addons = [];
    this.datablock_types = [];
  }, function register_datablock_type(cls) {
    this.datablock_types.push(cls);
  }, function unregister_datablock_type(cls) {
    this.datablock_types.remove(cls, false);
  }, function getmodule(name) {
    return modules[name];
  }, function getmodules() {
    return Object.getOwnPropertyNames(modules);
  }]);
  _es6_module.add_class(AddonManager);
  AddonManager = _es6_module.add_export('AddonManager', AddonManager);
}, '/dev/fairmotion/src/addon_api/addon_api.js');
es6_module_define('scene', ["struct", "lib_api"], function _scene_module(_es6_module) {
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var DataBlock=es6_import_item(_es6_module, 'lib_api', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, 'lib_api', 'DataTypes');
  var Scene=_ESClass("Scene", DataBlock, [function Scene() {
    DataBlock.call(this, DataTypes.SCENE);
    this.active_splinepath = "frameset.drawspline";
    this.time = 1;
  }, function change_time(ctx, time, _update_animation) {
    if (_update_animation==undefined) {
        _update_animation = true;
    }
    if (isNaN(this.time)) {
        console.log("EEK corruption!");
        this.time = ctx.frameset.time;
        if (isNaN(this.time))
          this.time = 0;
        if (isNaN(time))
          time = 0;
    }
    if (isNaN(time))
      return ;
    if (time==this.time)
      return ;
    if (time<1) {
        time = 1;
    }
    this.time = time;
    ctx.frameset.change_time(time, _update_animation);
    ctx.api.on_frame_change(ctx, time);
  }, function copy() {
    var ret=new Scene();
    ret.time = this.time;
    return ret;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=STRUCT.chain_fromSTRUCT(Scene, reader);
    ret.afterSTRUCT();
    if (ret.active_splinepath=="frameset.active_spline")
      ret.active_splinepath = "frameset.drawspline";
    return ret;
  }), function data_link(block, getblock, getblock_us) {
    DataBlock.prototype.data_link.apply(this, arguments);
  }]);
  _es6_module.add_class(Scene);
  Scene = _es6_module.add_export('Scene', Scene);
  Scene.STRUCT = STRUCT.inherit(Scene, DataBlock)+"\n    time              : float;\n    active_splinepath : string;\n  }\n";
}, '/dev/fairmotion/src/scene/scene.js');
es6_module_define('events', [], function _events_module(_es6_module) {
  "use strict";
  var MyKeyboardEvent=_ESClass("MyKeyboardEvent", [function MyKeyboardEvent(code, shift, ctrl, alt) {
    if (shift==undefined) {
        shift = false;
    }
    if (ctrl==undefined) {
        ctrl = false;
    }
    if (alt==undefined) {
        alt = false;
    }
    this.keyCode = code;
    this.shiftKey = shift;
    this.ctrlKey = ctrl;
    this.altKey = alt;
  }]);
  _es6_module.add_class(MyKeyboardEvent);
  MyKeyboardEvent = _es6_module.add_export('MyKeyboardEvent', MyKeyboardEvent);
  window.MyKeyboardEvent = MyKeyboardEvent;
  var MyMouseEvent=_ESClass("MyMouseEvent", [function MyMouseEvent(x, y, button, type) {
    this.x = x;
    this.y = y;
    this.button = button;
    this.type = type;
    this.touches = {}
  }, function copy(sub_offset) {
    if (sub_offset==undefined) {
        sub_offset = undefined;
    }
    var ret=new MyMouseEvent(this.x, this.y, this.button, this.type);
    for (var k in this.touches) {
        var t=this.touches[k];
        var x=t[0], y=t[1];
        if (sub_offset) {
            x-=sub_offset[0];
            y-=sub_offset[1];
        }
        ret.touches[k] = [x, y];
    }
    return ret;
  }]);
  _es6_module.add_class(MyMouseEvent);
  MyMouseEvent = _es6_module.add_export('MyMouseEvent', MyMouseEvent);
  window.MyMouseEvent = MyMouseEvent;
  MyMouseEvent.MOUSEMOVE = 0;
  MyMouseEvent.MOUSEDOWN = 1;
  MyMouseEvent.MOUSEUP = 2;
  MyMouseEvent.LEFT = 0;
  MyMouseEvent.RIGHT = 1;
  var _swap_next_mouseup=false;
  var _swap_next_mouseup_button=2;
  function swap_next_mouseup_event(button) {
    _swap_next_mouseup = true;
    _swap_next_mouseup_button = button;
  }
  swap_next_mouseup_event = _es6_module.add_export('swap_next_mouseup_event', swap_next_mouseup_event);
  var _ignore_next_mouseup=false;
  var _ignore_next_mouseup_button=2;
  function ignore_next_mouseup_event(button) {
    _ignore_next_mouseup = true;
    _ignore_next_mouseup_button = button;
  }
  ignore_next_mouseup_event = _es6_module.add_export('ignore_next_mouseup_event', ignore_next_mouseup_event);
  var EventHandler=_ESClass("EventHandler", [function EventHandler() {
    this.modalstack = new Array();
    this.modalhandler = null;
    this.keymap = null;
    this.touch_manager = undefined;
    this.touch_delay_stack = [];
  }, function push_touch_delay(delay_ms) {
    this.touch_delay_stack.push(this.touch_delay);
    this.touch_delay = delay_ms;
  }, function pop_touch_delay() {
    if (this.touch_delay_stack.length==0) {
        console.log("Invalid call to EventHandler.pop_touch_delay!");
        return ;
    }
    this.touch_delay = this.touch_delay_stack.pop();
  }, _ESClass.set(function touch_delay(delay_ms) {
    if (delay_ms==0) {
        this.touch_manager = undefined;
    }
    else {
      if (this.touch_manager==undefined)
        this.touch_manager = new TouchEventManager(this, delay_ms);
      else 
        this.touch_manager.delay = delay_ms;
    }
  }), _ESClass.get(function touch_delay() {
    if (this.touch_manager==undefined)
      return 0;
    return this.touch_manager.delay;
  }), function on_tick() {
    if (this.touch_manager!=undefined)
      this.touch_manager.process();
  }, function bad_event(event) {
    var tm=this.touch_manager;
    if (tm==undefined)
      return false;
    if (this.touch_manager!=undefined)
      this.touch_manager.process();
    if (tm!=undefined&&__instance_of(event, MyMouseEvent)) {
        var i=0;
        for (var k in event.touches) {
            i++;
        }
        if (i==0)
          return false;
        if ("_good" in event)
          return false;
        this.touch_manager.queue_event(event);
        return true;
    }
    return false;
  }, function on_textinput(event) {
  }, function on_keydown(event) {
  }, function on_charcode(event) {
  }, function on_keyinput(event) {
  }, function on_keyup(event) {
  }, function on_mousemove(event) {
  }, function on_mousedown(event) {
  }, function on_doubleclick(event) {
  }, function on_pan(pan, last_pan) {
  }, function on_gl_lost(new_gl) {
  }, function on_mouseup2(event) {
  }, function on_mouseup3(event) {
  }, function on_mousedown2(event) {
  }, function on_mousedown3(event) {
  }, function on_mousemove2(event) {
  }, function on_mousemove3(event) {
  }, function on_mousewheel(event) {
  }, function on_mouseup(event) {
  }, function on_resize(newsize) {
  }, function on_contextchange(event) {
  }, function on_draw(gl) {
  }, function has_modal() {
    return this.modalhandler!=null;
  }, function push_modal(handler) {
    if (this.modalhandler!=null) {
        this.modalstack.push(this.modalhandler);
    }
    this.modalhandler = handler;
  }, function pop_modal() {
    if (this.modalhandler!=null) {
    }
    if (this.modalstack.length>0) {
        this.modalhandler = this.modalstack.pop();
    }
    else {
      this.modalhandler = null;
    }
  }, function _on_resize(newsize) {
    this.on_resize(event);
  }, function _on_pan(pan, last_pan) {
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_pan(event);
    else 
      this.on_pan(event);
  }, function _on_textinput(event) {
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_textinput(event);
    else 
      this.on_textinput(event);
  }, function _on_keydown(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_keydown(event);
    else 
      this.on_keydown(event);
  }, function _on_charcode(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_charcode(event);
    else 
      this.on_charcode(event);
  }, function _on_keyinput(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_keyinput(event);
    else 
      this.on_keyinput(event);
  }, function _on_keyup(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_keyup(event);
    else 
      this.on_keyup(event);
  }, function _on_mousemove(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_mousemove(event);
    else 
      this.on_mousemove(event);
  }, function _on_doubleclick(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_doubleclick(event);
    else 
      this.on_doubleclick(event);
  }, function _on_mousedown(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_mousedown(event);
    else 
      this.on_mousedown(event);
  }, function _on_mouseup(event) {
    if (this.bad_event(event))
      return ;
    if (_swap_next_mouseup&&event.button==_swap_next_mouseup_button) {
        event.button = _swap_next_mouseup_button==2 ? 0 : 2;
        _swap_next_mouseup = false;
    }
    if (_ignore_next_mouseup&&event.button==_ignore_next_mouseup_button) {
        _ignore_next_mouseup = false;
        return ;
    }
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_mouseup(event);
    else 
      this.on_mouseup(event);
  }, function _on_mousewheel(event, delta) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_mousewheel(event, delta);
    else 
      this.on_mousewheel(event, delta);
  }]);
  _es6_module.add_class(EventHandler);
  EventHandler = _es6_module.add_export('EventHandler', EventHandler);
  var valid_modifiers={"SHIFT": 1, "CTRL": 2, "ALT": 4}
  var charmap_latin_1={"Space": 32, "Escape": 27, "Enter": 13, "Up": 38, "Down": 40, "Left": 37, "Right": 39, "Num0": 96, "Num1": 97, "Num2": 98, "Num3": 99, "Num4": 100, "Num5": 101, "Num6": 102, "Num7": 103, "Num8": 104, "Num9": 105, "Home": 36, "End": 35, "Delete": 46, "Backspace": 8, "Insert": 45, "PageUp": 33, "PageDown": 34, "Tab": 9, "-": 189, "=": 187, "NumPlus": 107, "NumMinus": 109, "Shift": 16, "Ctrl": 17, "Control": 17, "Alt": 18}
  charmap_latin_1 = _es6_module.add_export('charmap_latin_1', charmap_latin_1);
  for (var i=0; i<26; i++) {
      charmap_latin_1[String.fromCharCode(i+65)] = i+65;
  }
  for (var i=0; i<10; i++) {
      charmap_latin_1[String.fromCharCode(i+48)] = i+48;
  }
  for (var k in charmap_latin_1) {
      charmap_latin_1[charmap_latin_1[k]] = k;
  }
  var charmap_latin_1_rev={}
  for (var k in charmap_latin_1) {
      charmap_latin_1_rev[charmap_latin_1[k]] = k;
  }
  var charmap=charmap_latin_1;
  charmap = _es6_module.add_export('charmap', charmap);
  var charmap_rev=charmap_latin_1_rev;
  charmap_rev = _es6_module.add_export('charmap_rev', charmap_rev);
  window.charmap = charmap;
  window.charmap_rev = charmap_rev;
  var KeyHandler=_ESClass("KeyHandler", [function KeyHandler(key, modifiers, uiname, menunum, ignore_charmap_error) {
    if (!charmap.hasOwnProperty(key)) {
        if (ignore_charmap_error!=undefined&&ignore_charmap_error!=true) {
            console.trace();
            console.log("Invalid hotkey "+key+"!");
        }
        this.key = 0;
        this.keyAscii = "[corrupted hotkey]";
        this.shift = this.alt = this.ctrl = false;
        return ;
    }
    if (typeof (key)=="string") {
        if (key.length==1)
          key = key.toUpperCase();
        this.keyAscii = key;
        this.key = charmap[key];
    }
    else {
      this.key = key;
      this.keyAscii = charmap[key];
    }
    this.shift = this.alt = this.ctrl = false;
    this.menunum = menunum;
    for (var i=0; i<modifiers.length; i++) {
        if (modifiers[i]=="SHIFT") {
            this.shift = true;
        }
        else 
          if (modifiers[i]=="ALT") {
            this.alt = true;
        }
        else 
          if (modifiers[i]=="CTRL") {
            this.ctrl = true;
        }
        else {
          console.trace();
          console.log("Warning: invalid modifier "+modifiers[i]+" in KeyHandler");
        }
    }
  }, function build_str(add_menu_num) {
    var s="";
    if (this.ctrl)
      s+="CTRL-";
    if (this.alt)
      s+="ALT-";
    if (this.shift)
      s+="SHIFT-";
    s+=this.keyAscii;
    return s;
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    return this.build_str(false);
  })]);
  _es6_module.add_class(KeyHandler);
  KeyHandler = _es6_module.add_export('KeyHandler', KeyHandler);
  var KeyMap=_ESClass("KeyMap", hashtable, [function KeyMap() {
    hashtable.call(this);
    this.op_map = new hashtable();
  }, function get_tool_handler(toolstr) {
    if (this.op_map.has(toolstr))
      return this.op_map.get(toolstr);
  }, function add_tool(keyhandler, toolstr) {
    this.add(keyhandler, new ToolKeyHandler(toolstr));
    this.op_map.add(toolstr, keyhandler);
  }, function add_func(keyhandler, func) {
    this.add(keyhandler, new FuncKeyHandler(func));
  }, function add(keyhandler, value) {
    if (this.has(keyhandler)) {
        console.trace();
        console.log("Duplicate hotkey definition!");
    }
    if (__instance_of(value, ToolKeyHandler)&&!(typeof value.tool=="string"||__instance_of(value.tool, String))) {
        value.tool.keyhandler = keyhandler;
    }
    hashtable.prototype.add.call(this, keyhandler, value);
  }, function process_event(ctx, event) {
    var modlist=[];
    if (event.ctrlKey)
      modlist.push("CTRL");
    if (event.shiftKey)
      modlist.push("SHIFT");
    if (event.altKey)
      modlist.push("ALT");
    var key=new KeyHandler(event.keyCode, modlist, 0, 0, true);
    if (this.has(key)) {
        ctx.keymap_mpos = ctx.view2d.mpos;
        return this.get(key);
    }
    return undefined;
  }]);
  _es6_module.add_class(KeyMap);
  KeyMap = _es6_module.add_export('KeyMap', KeyMap);
  var KeyHandlerCls=_ESClass("KeyHandlerCls", [function handle(ctx) {
  }, function KeyHandlerCls() {
  }]);
  _es6_module.add_class(KeyHandlerCls);
  KeyHandlerCls = _es6_module.add_export('KeyHandlerCls', KeyHandlerCls);
  var ToolKeyHandler=_ESClass("ToolKeyHandler", KeyHandlerCls, [function ToolKeyHandler(tool) {
    this.tool = tool;
  }, function handle(ctx) {
    var tool=this.tool;
    ctx.api.call_op(ctx, tool);
  }]);
  _es6_module.add_class(ToolKeyHandler);
  ToolKeyHandler = _es6_module.add_export('ToolKeyHandler', ToolKeyHandler);
  var FuncKeyHandler=_ESClass("FuncKeyHandler", KeyHandlerCls, [function FuncKeyHandler(func) {
    this.handle = func;
  }]);
  _es6_module.add_class(FuncKeyHandler);
  FuncKeyHandler = _es6_module.add_export('FuncKeyHandler', FuncKeyHandler);
  var $vel_JxuP_on_tick;
  var $vel_T45V_calc_vel;
  var $was_clamped_2GkZ_clamp_pan;
  var VelocityPan=_ESClass("VelocityPan", EventHandler, [function VelocityPan() {
    this.start_mpos = new Vector2();
    this.last_mpos = new Vector2();
    this.mpos = new Vector2();
    this.start_time = 0;
    this.owner = undefined;
    this.coasting = false;
    this.panning = false;
    this.was_touch = false;
    this.enabled = true;
    this.vel = new Vector2();
    this.pan = new Vector2();
    this.damp = 0.99;
    this.can_coast = true;
    this.start_pan = new Vector2();
    this.first = false;
    this.last_ms = 0;
    this.vel = new Vector2();
  }, function on_tick() {
    if (!this.panning&&this.coasting) {
        var damp=0.99;
        $vel_JxuP_on_tick.load(this.vel);
        $vel_JxuP_on_tick.mulScalar(time_ms()-this.last_ms);
        this.vel.mulScalar(damp);
        this.last_ms = time_ms();
        this.pan.sub($vel_JxuP_on_tick);
        var was_clamped=this.clamp_pan();
        this.owner.on_pan(this.pan, this.start_pan);
        var stop=was_clamped!=undefined&&(was_clamped[0]&&was_clamped[1]);
        stop = stop||this.vel.vectorLength<1;
        if (stop)
          this.coasting = false;
    }
  }, function calc_vel() {
    if (!this.can_coast) {
        this.vel.zero();
        this.coasting = false;
        this.last_ms = time_ms();
        return ;
    }
    var t=time_ms()-this.start_time;
    if (t<10) {
        console.log("small t!!!", t);
        return ;
    }
    $vel_T45V_calc_vel.load(this.last_mpos).sub(this.mpos).divideScalar(t);
    this.vel.add($vel_T45V_calc_vel);
    this.coasting = (this.vel.vectorLength()>0.25);
    this.last_ms = time_ms();
  }, function start(start_mpos, last_mpos, owner, push_modal_func, pop_modal_func) {
    if (this.panning) {
        console.trace("warning, duplicate call to VelocityPan.start()");
        return ;
    }
    this.vel.zero();
    this.pop_modal_func = pop_modal_func;
    this.coasting = false;
    this.first = false;
    this.owner = owner;
    this.panning = true;
    push_modal_func(this);
    this.start_pan.load(this.pan);
    this.last_ms = time_ms();
    this.start_time = time_ms();
    this.was_touch = g_app_state.was_touch;
    this.start_mpos.load(start_mpos);
    this.last_mpos.load(start_mpos);
    this.mpos.load(start_mpos);
    this.do_mousemove(last_mpos);
  }, function end() {
    console.log("in end");
    if (this.panning) {
        console.log("  pop modal");
        this.pop_modal_func();
    }
    this.panning = false;
  }, function do_mousemove(mpos) {
    if (DEBUG.touch) {
        console.log("py", mpos[1]);
    }
    this.last_mpos.load(this.mpos);
    this.mpos.load(mpos);
    this.pan[0] = this.start_pan[0]+mpos[0]-this.start_mpos[0];
    this.pan[1] = this.start_pan[1]+mpos[1]-this.start_mpos[1];
    this.vel.zero();
    this.calc_vel();
    this.clamp_pan();
    this.owner.on_pan(this.pan, this.start_pan);
  }, function clamp_pan() {
    var bs=this.owner.pan_bounds;
    if (this.owner.state&8192*4)
      return ;
    var p=this.pan;
    $was_clamped_2GkZ_clamp_pan[0] = false;
    $was_clamped_2GkZ_clamp_pan[1] = false;
    for (var i=0; i<2; i++) {
        var l=p[i];
        p[i] = Math.min(Math.max(bs[0][i], p[i]), bs[0][i]+bs[1][i]);
        if (p[i]!=l)
          $was_clamped_2GkZ_clamp_pan[i] = true;
    }
    return $was_clamped_2GkZ_clamp_pan;
  }, function on_mouseup(event) {
    console.log("pan mouse up!", this.panning, this.owner);
    if (this.panning) {
        this.mpos.load([event.y, event.y]);
        this.calc_vel();
        this.end();
    }
  }, function on_mousemove(event) {
    this.do_mousemove([event.x, event.y]);
  }, function set_pan(pan) {
    if (this.panning)
      this.end();
    this.pan.load(pan);
    this.coasting = false;
    this.vel.zero();
  }]);
  var $vel_JxuP_on_tick=new Vector2();
  var $vel_T45V_calc_vel=new Vector2();
  var $was_clamped_2GkZ_clamp_pan=[0, 0];
  _es6_module.add_class(VelocityPan);
  VelocityPan = _es6_module.add_export('VelocityPan', VelocityPan);
  var TouchEventManager=_ESClass("TouchEventManager", [function TouchEventManager(owner, delay) {
    if (delay==undefined) {
        delay = 100;
    }
    this.queue = new GArray();
    this.queue_ms = new GArray();
    this.delay = delay;
    this.owner = owner;
  }, function get_last(type) {
    var i=this.queue.length;
    if (i==0)
      return undefined;
    i--;
    var q=this.queue;
    while (i>=0) {
      var e=q[i];
      if (e.type==type||e.type!=MyMouseEvent.MOUSEMOVE)
        break;
      i--;
    }
    if (i<0)
      i = 0;
    return q[i].type==type ? q[i] : undefined;
  }, function queue_event(event) {
    var last=this.get_last(event.type);
    if (DEBUG.touch&&this==touch_manager)
      console.log("touch event", event.type);
    if (last!=undefined&&last.type!=MyMouseEvent.MOUSEMOVE) {
        var dis, same=true;
        for (var k in event.touches) {
            if (!(k in last.touches)) {
            }
        }
        dis = new Vector2([event.x, event.y]).vectorDistance(new Vector2([last.x, last.y]));
        if (DEBUG.touch&&this==touch_manager)
          console.log(dis);
        if (same&&dis<50) {
            if (DEBUG.touch&&this==touch_manager)
              console.log("destroying duplicate event", last.type, event.x, event.y, event.touches);
            for (var k in event.touches) {
                last.touches[k] = event.touches[k];
            }
            return ;
        }
    }
    this.queue.push(event);
    this.queue_ms.push(time_ms());
  }, function cancel(event) {
    var ts=event.touches;
    var dl=new GArray;
    if (DEBUG.touch&&this==touch_manager)
      console.log("touch cancel", event);
    for (var e in this.queue) {
        for (var k in ts) {
            if (k in e.touches) {
                delete e.touches;
            }
        }
        if (list(e.touches).length==0) {
            dl.push(e);
        }
    }
    for (var e in dl) {
        var i=this.queue.indexOf(e);
        this.queue.remove(e);
        this.queue_ms.pop_i(i);
    }
  }, function process() {
    var owner=this.owner;
    var dl=new GArray();
    var q=this.queue;
    var qm=this.queue_ms;
    var delay=this.delay;
    for (var i=0; i<q.length; i++) {
        if (time_ms()-qm[i]>delay) {
            dl.push(q[i]);
        }
    }
    var __iter_e=__get_iter(dl);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      var i=q.indexOf(e);
      q.remove(e);
      qm.pop_i(i);
    }
    var __iter_e=__get_iter(dl);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      e._good = true;
      g_app_state.was_touch = true;
      try {
        if (e.type==MyMouseEvent.MOUSEDOWN) {
            if (DEBUG.touch)
              console.log("td1", e.x, e.y);
            owner._on_mousedown(e);
            if (DEBUG.touch)
              console.log("td2", e.x, e.y);
        }
        else 
          if (e.type==MyMouseEvent.MOUSEMOVE) {
            owner._on_mousemove(e);
        }
        else 
          if (e.type==MyMouseEvent.MOUSEUP) {
            owner._on_mouseup(e);
        }
      }
      catch (_err) {
          print_stack(_err);
          console.log("Error executing delayed touch event");
      }
    }
  }, function reset() {
    this.queue = new GArray();
    this.queue_ms = new GArray();
  }]);
  _es6_module.add_class(TouchEventManager);
  TouchEventManager = _es6_module.add_export('TouchEventManager', TouchEventManager);
  window.TouchEventManager = TouchEventManager;
  var touch_manager=window.touch_manager = new TouchEventManager(undefined, 20);
}, '/dev/fairmotion/src/editors/viewport/events.js');
es6_module_define('touchevents', [], function _touchevents_module(_es6_module) {
  "use strict";
  var TouchManager=_ESClass("TouchManager", [function TouchManager(event) {
    this.pattern = new set(Object.keys(event.touches));
    this.idxmap = {}
    this.tot = event.touches.length;
    this.event = event;
    this.deltas = {}
    var i=0;
    for (var k in event.touches) {
        this.idxmap[i++] = k;
        this.deltas[k] = 0.0;
    }
  }, function update(event) {
    if (this.valid(event)) {
        for (var k in event.touches) {
            var t2=event.touches[k];
            var t1=this.event.touches[k];
            var d=[t2[0]-t1[0], t2[1]-t1[1]];
            this.deltas[k] = d;
        }
    }
    this.event = event;
  }, function delta(i) {
    return this.deltas[this.idxmap[i]];
  }, function get(i) {
    return this.event.touches[this.idxmap[i]];
  }, function valid(event) {
    if (event==undefined) {
        event = this.event;
    }
    var keys=Object.keys(event.touches);
    if (keys.length!=this.pattern.length)
      return false;
    for (var i=0; i<keys.length; i++) {
        if (!pattern.has(keys[i]))
          return false;
    }
    return true;
  }]);
  _es6_module.add_class(TouchManager);
}, '/dev/fairmotion/src/ui/touchevents.js');
es6_module_define('toolprops', ["struct", "ajax", "toolprops_iter"], function _toolprops_module(_es6_module) {
  "use strict";
  
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var pack_int=es6_import_item(_es6_module, 'ajax', 'pack_int');
  var pack_float=es6_import_item(_es6_module, 'ajax', 'pack_float');
  var pack_static_string=es6_import_item(_es6_module, 'ajax', 'pack_static_string');
  var PropTypes={INT: 0, FLOAT: 1, STRING: 4, VEC3: 6, VEC4: 7, BOOL: 8, MATRIX3: 12, MATRIX4: 13, ENUM: 14, STRUCT: 15, FLAG: 16, DATAREF: 17, DATAREFLIST: 18, TRANSFORM: 19, COLLECTION: 20, VEC2: 21, IMAGE: 22, ARRAYBUFFER: 23, COLOR3: 24, COLOR4: 25}
  PropTypes = _es6_module.add_export('PropTypes', PropTypes);
  var TPropFlags={PRIVATE: 1, LABEL: 2, COLL_LOOSE_TYPE: 4, USE_UNDO: 8, UNDO_SIMPLE: 16}
  TPropFlags = _es6_module.add_export('TPropFlags', TPropFlags);
  var ToolProperty=_ESClass("ToolProperty", [function ToolProperty(type, apiname, uiname, description, flag) {
    if (apiname==undefined) {
        apiname = "";
    }
    if (uiname==undefined) {
        uiname = apiname;
    }
    if (description==undefined) {
        description = "";
    }
    if (flag==undefined) {
        flag = 0;
    }
    this.type = type;
    this.data = null;
    this.apiname = apiname;
    if (uiname==undefined)
      uiname = apiname;
    this.listeners = new GArray();
    this.uiname = uiname;
    this.flag = flag;
    this.description = description;
    this.userdata = undefined;
    this.ctx = undefined;
    this.path = undefined;
    this.hotkey_ref = undefined;
    this.unit = undefined;
    this.icon = -1;
  }, function copyTo(dst, copy_data) {
    if (copy_data==undefined) {
        copy_data = false;
    }
    dst.flag = this.flag;
    dst.icon = this.icon;
    dst.unit = this.unit;
    dst.hotkey_ref = this.hotkey_ref;
    dst.uiname = this.uiname;
    dst.apiname = this.apiname;
    if (copy_data)
      dst.data = this.data;
    return dst;
  }, function add_listener(owner, callback) {
    var __iter_l=__get_iter(this.listeners);
    var l;
    while (1) {
      var __ival_l=__iter_l.next();
      if (__ival_l.done) {
          break;
      }
      l = __ival_l.value;
      if (l[0]==owner) {
          l[1] = callback;
          return ;
      }
    }
    this.listeners.push([owner, callback]);
  }, function remove_listener(owner, silent_fail) {
    if (silent_fail==undefined) {
        silent_fail = false;
    }
    var __iter_l=__get_iter(this.listeners);
    var l;
    while (1) {
      var __ival_l=__iter_l.next();
      if (__ival_l.done) {
          break;
      }
      l = __ival_l.value;
      if (l[0]==owner) {
          console.log("removing listener");
          this.listeners.remove(l);
          return ;
      }
    }
    if (!silent_fail)
      console.trace("warning: remove_listener called for unknown owner:", owner);
  }, function _exec_listeners(data_api_owner) {
    var __iter_l=__get_iter(this.listeners);
    var l;
    while (1) {
      var __ival_l=__iter_l.next();
      if (__ival_l.done) {
          break;
      }
      l = __ival_l.value;
      if (RELEASE) {
          try {
            l[1](l[0], this, data_api_owner);
          }
          catch (_err) {
              print_stack(_err);
              console.log("Warning: a property event listener failed", "property:", this, "callback:", l[1], "owner:", l[0]);
          }
      }
      else {
        l[1](l[0], this, data_api_owner);
      }
    }
  }, function load_ui_data(prop) {
    this.uiname = prop.uiname;
    this.apiname = prop.apiname;
    this.description = prop.description;
    this.unit = prop.unit;
    this.hotkey_ref = prop.hotkey_ref;
  }, function user_set_data(this_input) {
  }, function update(owner_obj, old_value, has_changed) {
  }, function api_update(ctx, path) {
  }, function pack(data) {
    pack_int(data, this.type);
    var unit=this.unit!=undefined ? "" : this.unit;
    pack_static_string(data, unit, 16);
  }, function unpack(data, uctx) {
    this.unit = unpack_static_string(data, 16);
    if (this.unit=="")
      this.unit = undefined;
  }, function set_data(data, owner, changed, set_data) {
    if (changed==undefined) {
        changed = true;
    }
    if (set_data==undefined) {
        set_data = true;
    }
    if (set_data)
      this.data = data;
    this.api_update(this.ctx, this.path, owner);
    this.update.call(this, owner, undefined, changed);
    this._exec_listeners(owner);
  }, function toJSON() {
    return {type: this.type, data: this.data}
  }, function loadJSON(prop, json) {
    switch (json.type) {
      case PropTypes.INT:
      case PropTypes.FLOAT:
      case PropTypes.STRING:
      case PropTypes.BOOL:
      case PropTypes.FLOAT_ARRAY:
      case PropTypes.INT_ARRAY:
      case PropTypes.ENUM:
      case PropTypes.FLAG:
        prop.set_data(json.data);
        break;
      case PropTypes.ELEMENTS:
        prop.set_data(new GArray(json.data));
        break;
      case PropTypes.VEC3:
        prop.set_data(new Vector3(json.data));
        break;
      case PropTypes.VEC4:
        prop.set_data(new Vector4(json.data));
        break;
    }
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ob=new ToolProperty();
    reader(ob);
    return ob;
  })]);
  _es6_module.add_class(ToolProperty);
  ToolProperty = _es6_module.add_export('ToolProperty', ToolProperty);
  ToolProperty.STRUCT = "\n  ToolProperty {\n    type : int;\n    flag : int;\n  }\n";
  var ArrayBufferProperty=_ESClass("ArrayBufferProperty", ToolProperty, [function ArrayBufferProperty(data, apiname, uiname, description, flag) {
    if (apiname==undefined) {
        apiname = "";
    }
    if (uiname==undefined) {
        uiname = apiname;
    }
    if (description==undefined) {
        description = "";
    }
    if (flag==undefined) {
        flag = 0;
    }
    ToolProperty.call(this, PropTypes.ARRAYBUFFER, apiname, uiname, description, flag);
    if (data!=undefined) {
        this.set_data(data);
    }
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    if (this.data!=undefined)
      dst.set_data(this.data);
    return dst;
  }, function copy() {
    return this.copyTo(new ArrayBufferProperty());
  }]);
  _es6_module.add_class(ArrayBufferProperty);
  ArrayBufferProperty = _es6_module.add_export('ArrayBufferProperty', ArrayBufferProperty);
  ArrayBufferProperty.STRUCT = STRUCT.inherit(ArrayBufferProperty, ToolProperty)+"\n  data : arraybuffer;\n}\n";
  var DataRefProperty=_ESClass("DataRefProperty", ToolProperty, [function DataRefProperty(value, allowed_types, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.DATAREF, apiname, uiname, description, flag);
    if (allowed_types==undefined)
      allowed_types = new set();
    if (!(__instance_of(allowed_types, set))) {
        if (__instance_of(allowed_types, Array))
          allowed_types = new set(allowed_types);
        else 
          allowed_types = new set([allowed_types]);
    }
    this.types = new set();
    var __iter_val=__get_iter(allowed_types);
    var val;
    while (1) {
      var __ival_val=__iter_val.next();
      if (__ival_val.done) {
          break;
      }
      val = __ival_val.value;
      if (typeof val=="object") {
          val = new val().lib_type;
      }
      this.types.add(val);
    }
    if (value!=undefined)
      this.set_data(value);
  }, function get_block(ctx) {
    if (this.data==undefined)
      return undefined;
    else 
      return ctx.datalib.get(this.data);
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    var data=this.data;
    if (data!=undefined)
      data = data.copy();
    dst.types = new set(this.types);
    if (data!=undefined)
      dst.set_data(data);
    return dst;
  }, function copy() {
    return this.copyTo(new DataRefProperty());
  }, function set_data(value, owner, changed, set_data) {
    if (value==undefined) {
        ToolProperty.prototype.set_data.call(this, undefined, owner, changed, set_data);
    }
    else 
      if (!(__instance_of(value, DataRef))) {
        if (!this.types.has(value.lib_type)) {
            console.trace("Invalid datablock type "+value.lib_type+" passed to DataRefProperty.set_value()");
            return ;
        }
        value = new DataRef(value);
        ToolProperty.prototype.set_data.call(this, value, owner, changed, set_data);
    }
    else {
      ToolProperty.prototype.set_data.call(this, value, owner, changed, set_data);
    }
  }, _ESClass.static(function fromSTRUCT(reader) {
    var l=new DataRefProperty();
    
    reader(l);
    l.types = new set(l.types);
    if (l.data!=undefined&&l.data.id<0)
      l.data = undefined;
    l.set_data(l.data);
    return l;
  })]);
  _es6_module.add_class(DataRefProperty);
  DataRefProperty = _es6_module.add_export('DataRefProperty', DataRefProperty);
  DataRefProperty.STRUCT = STRUCT.inherit(DataRefProperty, ToolProperty)+"\n  data : DataRef | obj.data == undefined ? new DataRef(-1) : obj.data;\n  types : iter(int);\n}\n";
  var RefListProperty=_ESClass("RefListProperty", ToolProperty, [function RefListProperty(value, allowed_types, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.DATAREFLIST, apiname, uiname, description, flag);
    if (allowed_types==undefined)
      allowed_types = [];
    if (!(__instance_of(allowed_types, set))) {
        allowed_types = new set([allowed_types]);
    }
    this.types = allowed_types;
    this.set_data(value);
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    dst.types = new set(this.types);
    if (this.data!=undefined)
      dst.set_data(this.data);
    return dst;
  }, function copy() {
    return this.copyTo(new RefListProperty());
  }, function set_data(value, owner, changed, set_data) {
    if (value!=undefined&&value.constructor.name=="Array")
      value = new GArray(value);
    if (value==undefined) {
        ToolProperty.prototype.set_data.call(this, undefined, owner, changed, set_data);
    }
    else {
      var lst=new DataRefList();
      for (var i=0; i<value.length; i++) {
          var block=value[i];
          if (block==undefined||!this.types.has(block.lib_type)) {
              console.trace();
              if (block==undefined)
                console.log("Undefined datablock in list passed to RefListProperty.set_data");
              else 
                console.log("Invalid datablock type "+block.lib_type+" passed to RefListProperty.set_value()");
              continue;
          }
          lst.push(block);
      }
      value = lst;
      ToolProperty.prototype.set_data.call(this, this, value, owner, changed, set_data);
    }
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new RefListProperty();
    reader(t);
    t.types = new set(t.types);
    t.set_data(t.data);
    return t;
  })]);
  _es6_module.add_class(RefListProperty);
  RefListProperty = _es6_module.add_export('RefListProperty', RefListProperty);
  RefListProperty.STRUCT = STRUCT.inherit(RefListProperty, ToolProperty)+"\n  data : iter(dataref(DataBlock));\n  types : iter(int);\n}\n";
  var FlagProperty=_ESClass("FlagProperty", ToolProperty, [function FlagProperty(value, maskmap, uinames, apiname, uiname, description, range, uirange, flag) {
    ToolProperty.call(this, PropTypes.FLAG, apiname, uiname, description, flag);
    if (value==undefined&&maskmap==undefined) {
        this.ui_value_names = {};
        this.ui_key_names = {};
        this.flag_descriptions = {};
        this.keys = {};
        this.values = {};
        return ;
    }
    this.data = 0;
    this.ui_key_names = {}
    this.flag_descriptions = {}
    this.keys = {}
    this.values = {}
    for (var k in maskmap) {
        this.values[maskmap[k]] = maskmap[k];
        this.keys[k] = maskmap[k];
    }
    if (uinames==undefined) {
        this.setUINames(uinames);
    }
    else {
      this.ui_value_names = uinames;
      for (var k in uinames) {
          this.ui_key_names[uinames[k]] = k;
      }
    }
    this.set_flag(value);
  }, function setUINames(uinames) {
    this.ui_value_names = {}
    this.ui_key_names = {}
    for (var k in this.keys) {
        var key=k[0].toUpperCase()+k.slice(1, k.length).toLowerCase();
        key = key.replace(/\_/g, " ").replace(/\-/g, " ");
        this.ui_value_names[key] = k;
        this.ui_key_names[k] = key;
    }
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    for (var k in this.flag_descriptions) {
        dst.flag_descriptions[k] = this.flag_descriptions[k];
    }
    for (var k in this.keys) {
        dst.keys[k] = this.keys[k];
    }
    for (var k in this.values) {
        dst.values[k] = this.values[k];
    }
    for (var k in this.ui_value_names) {
        dst.ui_value_names[k] = this.ui_value_names[k];
    }
    dst.ui_key_names = {}
    for (var k in this.ui_key_names) {
        dst.ui_key_names[k] = this.ui_key_names[k];
    }
    return dst;
  }, function copy() {
    return this.copyTo(new FlagProperty());
  }, function pack(data) {
    pack_int(this.data);
  }, function set_flag(value) {
    var flag;
    if (this.values.hasOwnProperty(value)) {
        flag = value;
    }
    else 
      if (this.keys.hasOwnProperty(value)) {
        flag = this.keys[value];
    }
    else {
      console.trace("WARNING: bad flag value!", value, this.values);
    }
    this.data|=flag;
  }, function unset_flag(value) {
    var flag;
    if (this.values.hasOwnProperty(value)) {
        flag = value;
    }
    else 
      if (this.keys.hasOwnProperty(value)) {
        flag = this.keys[value];
    }
    else {
      console.log(value, this.values);
      console.trace();
      throw new Error("Bad flag value");
    }
    this.data&=~flag;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new FlagProperty();
    reader(t);
    return t;
  })]);
  _es6_module.add_class(FlagProperty);
  FlagProperty = _es6_module.add_export('FlagProperty', FlagProperty);
  FlagProperty.STRUCT = STRUCT.inherit(FlagProperty, ToolProperty)+"\n  data : int;\n}\n";
  var FloatProperty=_ESClass("FloatProperty", ToolProperty, [function FloatProperty(i, apiname, uiname, description, range, uirange, flag) {
    ToolProperty.call(this, PropTypes.FLOAT, apiname, uiname, description, flag);
    if (uirange==undefined) {
        uirange = range;
    }
    this.ui_range = uirange;
    this.range = range;
    this.data = i;
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    dst.ui_range = this.ui_range;
    dst.range = this.range;
    return dst;
  }, function copy() {
    return this.copyTo(new FloatProperty());
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new FloatProperty();
    reader(t);
    return t;
  })]);
  _es6_module.add_class(FloatProperty);
  FloatProperty = _es6_module.add_export('FloatProperty', FloatProperty);
  FloatProperty.STRUCT = STRUCT.inherit(FloatProperty, ToolProperty)+"\n  data : float;\n}\n";
  var IntProperty=_ESClass("IntProperty", ToolProperty, [function IntProperty(i, apiname, uiname, description, range, uirange, flag) {
    ToolProperty.call(this, PropTypes.INT, apiname, uiname, description, flag);
    if (uirange==undefined) {
        uirange = range;
    }
    this.ui_range = uirange;
    this.range = range;
    this.data = i;
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    dst.ui_range = this.ui_range;
    dst.range = this.range;
    return dst;
  }, function copy() {
    return this.copyTo(new IntProperty());
  }, function pack(data) {
    pack_int(this.data);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new IntProperty();
    reader(t);
    return t;
  })]);
  _es6_module.add_class(IntProperty);
  IntProperty = _es6_module.add_export('IntProperty', IntProperty);
  IntProperty.STRUCT = STRUCT.inherit(IntProperty, ToolProperty)+"\n  data : int;\n}\n";
  var BoolProperty=_ESClass("BoolProperty", ToolProperty, [function BoolProperty(bool, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.BOOL, apiname, uiname, description, flag);
    this.data = bool ? true : false;
  }, function pack(data) {
    pack_int(this.data);
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    dst.ui_range = this.ui_range;
    dst.range = this.range;
    return dst;
  }, function copy() {
    return this.copyTo(new BoolProperty());
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new BoolProperty();
    reader(t);
    t.data = !!t.data;
    return t;
  })]);
  _es6_module.add_class(BoolProperty);
  BoolProperty = _es6_module.add_export('BoolProperty', BoolProperty);
  BoolProperty.STRUCT = STRUCT.inherit(BoolProperty, ToolProperty)+"\n  data : int;\n}\n";
  var StringProperty=_ESClass("StringProperty", ToolProperty, [function StringProperty(string, apiname, uiname, description, flag) {
    if (string==undefined)
      string = "";
    ToolProperty.call(this, PropTypes.STRING, apiname, uiname, description, flag);
    this.data = string;
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    dst.ui_range = this.ui_range;
    dst.range = this.range;
    return dst;
  }, function copy() {
    return this.copyTo(new StringProperty());
  }, function pack(data) {
    pack_string(this.data);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new StringProperty();
    reader(t);
    return t;
  })]);
  _es6_module.add_class(StringProperty);
  StringProperty = _es6_module.add_export('StringProperty', StringProperty);
  StringProperty.STRUCT = STRUCT.inherit(StringProperty, ToolProperty)+"\n  data : string;\n}\n";
  var TransformProperty=_ESClass("TransformProperty", ToolProperty, [function TransformProperty(value, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.TRANSFORM, apiname, uiname, description, flag);
    if (value!=undefined)
      ToolProperty.prototype.set_data.call(this, new Matrix4UI(value));
  }, function set_data(data, owner, changed, set_data) {
    this.data.load(data);
    ToolProperty.prototype.set_data.call(this, undefined, owner, changed, false);
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    dst.data = new Matrix4UI(new Matrix4());
    dst.data.load(this.data);
    return dst;
  }, function copy() {
    return this.copyTo(new TransformProperty());
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new TransformProperty();
    reader(t);
    t.data = new Matrix4UI(t.data);
    return t;
  })]);
  _es6_module.add_class(TransformProperty);
  TransformProperty = _es6_module.add_export('TransformProperty', TransformProperty);
  TransformProperty.STRUCT = STRUCT.inherit(TransformProperty, ToolProperty)+"\n  data : mat4;\n}\n";
  var EnumProperty=_ESClass("EnumProperty", ToolProperty, [function EnumProperty(string, valid_values, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.ENUM, apiname, uiname, description, flag);
    this.values = {}
    this.keys = {}
    this.ui_value_names = {}
    if (valid_values==undefined)
      return ;
    if (__instance_of(valid_values, Array)||__instance_of(valid_values, String)) {
        for (var i=0; i<valid_values.length; i++) {
            this.values[valid_values[i]] = valid_values[i];
            this.keys[valid_values[i]] = valid_values[i];
        }
    }
    else {
      for (var k in valid_values) {
          this.values[k] = valid_values[k];
          this.keys[valid_values[k]] = k;
      }
    }
    if (string==undefined) {
        this.data = Iterator(valid_values).next();
    }
    else {
      this.set_value(string);
    }
    for (var k in this.values) {
        var uin=k[0].toUpperCase()+k.slice(1, k.length);
        uin = uin.replace(/\_/g, " ");
        this.ui_value_names[k] = uin;
    }
    this.iconmap = {}
  }, function load_ui_data(prop) {
    ToolProperty.prototype.load_ui_data.call(this, prop);
    this.ui_value_names = Object.create(prop.ui_value_names);
    this.iconmap = Object.create(prop.iconmap);
    this.values = Object.create(prop.values);
    this.keys = Object.create(prop.keys);
  }, function add_icons(iconmap) {
    for (var k in iconmap) {
        this.iconmap[k] = iconmap[k];
    }
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    p.keys = Object.create(this.keys);
    p.values = Object.create(this.values);
    p.data = this.data;
    p.ui_value_names = this.ui_value_names;
    p.update = this.update;
    p.api_update = this.api_update;
    for (var k in this.iconmap) {
        p.iconmap[k] = this.iconmap[k];
    }
    return p;
  }, function copy() {
    var p=new EnumProperty("dummy", {"dummy": 0}, this.apiname, this.uiname, this.description, this.flag);
    p.keys = Object.create(this.keys);
    p.values = Object.create(this.values);
    p.data = this.data;
    p.ui_value_names = this.ui_value_names;
    p.update = this.update;
    p.api_update = this.api_update;
    for (var k in this.iconmap) {
        p.iconmap[k] = this.iconmap[k];
    }
    return p;
  }, function pack(data) {
    pack_string(this.data);
  }, function get_value() {
    if (this.data in this.values)
      return this.values[this.data];
    else 
      return this.data;
  }, function set_value(val) {
    if (!(val in this.values)&&(val in this.keys))
      val = this.keys[val];
    if (!(val in this.values)) {
        console.trace("Invalid value for enum!");
        console.log("Invalid value for enum!", val, this.values);
        return ;
    }
    this.data = new String(val);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new EnumProperty();
    reader(t);
    return t;
  })]);
  _es6_module.add_class(EnumProperty);
  EnumProperty = _es6_module.add_export('EnumProperty', EnumProperty);
  EnumProperty.STRUCT = STRUCT.inherit(EnumProperty, ToolProperty)+"\n  data : string | obj.data.toString();\n}\n";
  var Vec2Property=_ESClass("Vec2Property", ToolProperty, [function Vec2Property(vec2, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.VEC2, apiname, uiname, description, flag);
    this.unit = undefined;
    this.range = [undefined, undefined];
    this.real_range = [undefined, undefined];
    this.data = new Vector3(vec2);
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    dst.data = new Vector3(this.data);
    dst.real_range = this.real_range;
    dst.range = this.range;
    return dst;
  }, function set_data(data, owner, changed) {
    this.data.load(data);
    ToolProperty.prototype.set_data.call(this, undefined, owner, changed, false);
  }, function copy() {
    return this.copyTo(new Vec2Property());
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new Vec2Property();
    reader(t);
    return t;
  })]);
  _es6_module.add_class(Vec2Property);
  Vec2Property = _es6_module.add_export('Vec2Property', Vec2Property);
  Vec2Property.STRUCT = STRUCT.inherit(Vec2Property, ToolProperty)+"\n  data : array(float);\n}\n";
  var Vec3Property=_ESClass("Vec3Property", ToolProperty, [function Vec3Property(vec3, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.VEC3, apiname, uiname, description, flag);
    this.unit = "default";
    this.range = [undefined, undefined];
    this.real_range = [undefined, undefined];
    this.data = new Vector3(vec3);
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    dst.data = new Vector3(this.data);
    dst.real_range = this.real_range;
    dst.range = this.range;
    return dst;
  }, function set_data(data, owner, changed) {
    this.data.load(data);
    ToolProperty.prototype.set_data.call(this, undefined, owner, changed, false);
  }, function copy() {
    return this.copyTo(new Vec3Property());
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new Vec3Property();
    reader(t);
    return t;
  })]);
  _es6_module.add_class(Vec3Property);
  Vec3Property = _es6_module.add_export('Vec3Property', Vec3Property);
  Vec3Property.STRUCT = STRUCT.inherit(Vec3Property, ToolProperty)+"\n  data : vec3;\n}\n";
  var Vec4Property=_ESClass("Vec4Property", ToolProperty, [function Vec4Property(vec4, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.VEC4, apiname, uiname, description, flag);
    this.subtype==PropTypes.VEC4;
    this.unit = "default";
    this.range = [undefined, undefined];
    this.real_range = [undefined, undefined];
    this.data = new Vector4(vec4);
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    dst.data = new Vector4();
    dst.real_range = this.real_range;
    dst.range = this.range;
    dst.data.load(this.data);
    return dst;
  }, function set_data(data, owner, changed) {
    this.data.load(data);
    ToolProperty.prototype.set_data.call(this, undefined, owner, changed, false);
  }, function copy() {
    return this.copyTo(new Vec4Property());
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new Vec4Property();
    reader(t);
    return t;
  })]);
  _es6_module.add_class(Vec4Property);
  Vec4Property = _es6_module.add_export('Vec4Property', Vec4Property);
  Vec4Property.STRUCT = STRUCT.inherit(Vec4Property, ToolProperty)+"\n  data : vec4;\n}\n";
  var ToolIter=es6_import_item(_es6_module, 'toolprops_iter', 'ToolIter');
  var type_filter_iter=_ESClass("type_filter_iter", ToolIter, [function type_filter_iter(iter, typefilter, ctx) {
    this.types = typefilter;
    this.ret = {done: false, value: undefined}
    this.iter = iter;
    this._ctx = ctx;
  }, _ESClass.set(function ctx(ctx) {
    this._ctx = ctx;
    this.iter.ctx = ctx;
  }), _ESClass.get(function ctx() {
    return this._ctx;
  }), function reset() {
    this.iter.ctx = this.ctx;
    this.iter.reset();
  }, function next() {
    var ret=this.iter.next();
    var types=this.types;
    var tlen=this.types.length;
    var this2=this;
    function has_type(obj) {
      for (i = 0; i<tlen; i++) {
          if (__instance_of(obj, types[i]))
            return true;
      }
      return false;
    }
    while (!ret.done&&!has_type(ret.value)) {
      ret = this.iter.next();
    }
    this.ret.done = ret.done;
    this.ret.value = ret.value;
    ret = this.ret;
    if (ret.done&&this.iter.reset) {
        this.iter.reset();
    }
    return ret;
  }]);
  _es6_module.add_class(type_filter_iter);
  type_filter_iter = _es6_module.add_export('type_filter_iter', type_filter_iter);
  var CollectionProperty=_ESClass("CollectionProperty", ToolProperty, [function CollectionProperty(data, filter_types, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.COLLECTION, apiname, uiname, description, flag);
    this.flag|=TPropFlags.COLL_LOOSE_TYPE;
    this.types = filter_types;
    this._data = undefined;
    this._ctx = undefined;
    this.set_data(data);
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    dst.types = this.types;
    this.set_data(this.data);
    return dst;
  }, function copy() {
    var ret=this.copyTo(new CollectionProperty());
    ret.types = this.types;
    ret._ctx = this._ctx;
    if (this._data!=undefined&&this._data.copy!=undefined)
      ret.set_data(this._data.copy());
    return ret;
  }, _ESClass.get(function ctx() {
    return this._ctx;
  }), _ESClass.set(function ctx(data) {
    this._ctx = data;
    if (this._data!=undefined)
      this._data.ctx = data;
  }), function set_data(data, owner, changed) {
    if (data==undefined) {
        this._data = undefined;
        return ;
    }
    if ("__tooliter__" in data&&typeof data.__tooliter__=="function") {
        this.set_data(data.__tooliter__(), owner, changed);
        return ;
    }
    else 
      if (!(this.flag&TPropFlags.COLL_LOOSE_TYPE)&&!(TPropIterable.isTPropIterable(data))) {
        console.trace();
        console.log("ERROR: bad data '", data, "' was passed to CollectionProperty.set_data!");
        throw new Error("ERROR: bad data '", data, "' was passed to CollectionProperty.set_data!");
    }
    this._data = data;
    this._data.ctx = this.ctx;
    ToolProperty.prototype.set_data.call(this, undefined, owner, changed, false);
  }, _ESClass.set(function data(data) {
    this.set_data(data);
  }), _ESClass.get(function data() {
    return this._data;
  }), _ESClass.symbol(Symbol.iterator, function iterator() {
    if (this._data==undefined)
      return {next: function() {
      return {done: true, value: undefined}
    }}
    this._data.ctx = this._ctx;
    if (this.types!=undefined&&this.types.length>0)
      return new type_filter_iter(this.data[Symbol.iterator](), this.types, this._ctx);
    else 
      return this.data[Symbol.iterator]();
  }), _ESClass.static(function fromSTRUCT(reader) {
    var ret=new CollectionProperty();
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(CollectionProperty);
  CollectionProperty = _es6_module.add_export('CollectionProperty', CollectionProperty);
  CollectionProperty.STRUCT = STRUCT.inherit(CollectionProperty, ToolProperty)+"\n    data : abstract(Object) | obj.data == undefined ? new BlankArray() : obj.data;\n  }\n";
  var BlankArray=_ESClass("BlankArray", [_ESClass.static(function fromSTRUCT(reader) {
    return undefined;
  }), function BlankArray() {
  }]);
  _es6_module.add_class(BlankArray);
  BlankArray = _es6_module.add_export('BlankArray', BlankArray);
  BlankArray.STRUCT = "\n  BlankArray {\n    length : int | 0;\n  }\n";
  window.BlankArray = BlankArray;
}, '/dev/fairmotion/src/core/toolprops.js');
es6_module_define('toolprops_iter', ["struct"], function _toolprops_iter_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var TPropIterable=_ESClass("TPropIterable", [function TPropIterable() {
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
  }), function _is_tprop_iterable() {
  }, _ESClass.static(function isTPropIterable(obj) {
    return obj!=undefined&&"_is_tprop_iterable" in obj;
  })]);
  _es6_module.add_class(TPropIterable);
  TPropIterable = _es6_module.add_export('TPropIterable', TPropIterable);
  window.TPropIterable = TPropIterable;
  var TCanSafeIter=_ESClass("TCanSafeIter", [function TCanSafeIter() {
  }, function __tooliter__() {
  }]);
  _es6_module.add_class(TCanSafeIter);
  TCanSafeIter = _es6_module.add_export('TCanSafeIter', TCanSafeIter);
  window.TCanSafeIter = TCanSafeIter;
  var ToolIter=_ESClass("ToolIter", TPropIterable, [function ToolIter(itemtypes) {
    if (itemtypes==undefined) {
        itemtypes = [];
    }
    TPropIterable.call(this);
    this.itemtypes = itemtypes;
    this.ctx = undefined;
    this.ret = {done: true, value: undefined}
  }, function next() {
  }, function reset() {
  }, function spawn() {
  }, function _get_block(ref) {
    if (this.ctx!=undefined) {
        if (ref.lib_id==this.ctx.object.lib_id)
          return this.ctx.object;
        else 
          return this.ctx.datalib.get(ref);
    }
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this;
  }), _ESClass.static(function fromSTRUCT(reader) {
    var obj=new ToolIter();
    reader(obj);
    return obj;
  })]);
  _es6_module.add_class(ToolIter);
  ToolIter = _es6_module.add_export('ToolIter', ToolIter);
  ToolIter.STRUCT = "\n  ToolIter {\n  }\n";
  var MSelectIter=_ESClass("MSelectIter", ToolIter, [function MSelectIter(typemask, mesh) {
    ToolIter.call(this);
    this.meshref = new DataRef(mesh);
    this.mask = typemask;
    this.mesh = undefined;
    this.init = true;
    this.iter = undefined;
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    if (this.init) {
        return this;
    }
    else {
      return new MSelectIter(this.mask, this.meshref);
    }
  }), function reset() {
    this.init = true;
    this.mesh = undefined;
    this.iter = undefined;
  }, function next() {
    if (this.init) {
        this.mesh = this._get_block(this.meshref);
        this.init = false;
        this.iter = new selectiter(this.mesh, this.mask);
    }
    var ret=this.iter.next();
    if (ret.done) {
        this.reset();
    }
    return ret;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ob={}
    reader(ob);
    var ret=new MSelectIter(ob.mask, ob.meshref);
    return ret;
  })]);
  _es6_module.add_class(MSelectIter);
  MSelectIter.STRUCT = STRUCT.inherit(MSelectIter, ToolIter)+"\n  meshref  : DataRef;\n  mask     : int;\n}\n";
  var $map_qgem_fromSTRUCT;
  var element_iter_convert=_ESClass("element_iter_convert", ToolIter, [function element_iter_convert(iter, type) {
    ToolIter.call(this);
    if (!(__instance_of(iter, TPropIterable))) {
        throw new Error("element_iter_convert requires a 'safe' TPropIterable-derived iterator");
    }
    this.vset = new set();
    this.iter = iter[Symbol.iterator]();
    this.subiter = undefined;
    if (type==MeshTypes.VERT)
      this.type = Vertex;
    else 
      if (type==MeshTypes.EDGE)
      this.type = Edge;
    else 
      if (type==MeshTypes.LOOP)
      this.type = Loop;
    else 
      if (type==MeshTypes.FACE)
      this.type = Face;
  }, function reset() {
    if (this.iter.reset!=undefined)
      this.iter.reset();
    this.vset = new set();
    this.iter.ctx = this.ctx;
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this;
  }), function next() {
    if (this.mesh!=undefined)
      this.iter.mesh = this.mesh;
    var v=this._next();
    if (v.done)
      return v;
    var vset=this.vset;
    while ((!v.done)&&(v.value==undefined||vset.has(v.value))) {
      v = this._next();
    }
    if (!v.done)
      vset.add(v.value);
    return v;
  }, function _next() {
    if (this.subiter==undefined) {
        var next=this.iter.next();
        if (next.done) {
            this.reset();
            return next;
        }
        if (next.value.constructor.name==this.type.name)
          return next;
        this.subiter = next.value.verts[Symbol.iterator]();
    }
    var vset=this.vset;
    var v=this.subiter.next();
    if (v.done) {
        this.subiter = undefined;
        return this._next();
    }
    return v;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ob={}
    reader(ob);
    var type=$map_qgem_fromSTRUCT[ob.type];
    var ret=new element_iter_convert(ob._iter, type);
  })]);
  var $map_qgem_fromSTRUCT={Vertex: 1, Edge: 2, Loop: 4, Face: 8}
  _es6_module.add_class(element_iter_convert);
  element_iter_convert.STRUCT = STRUCT.inherit(element_iter_convert, ToolIter)+"\n  type  : string | this.type != undefined ? this.type.constructor.name : \"\";\n  _iter : abstract(ToolIter) | obj.iter;\n}\n";
}, '/dev/fairmotion/src/core/toolprops_iter.js');
es6_module_define('toolops_api', ["events", "toolprops", "struct"], function _toolops_api_module(_es6_module) {
  "use strict";
  var PropTypes=es6_import_item(_es6_module, 'toolprops', 'PropTypes');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var EventHandler=es6_import_item(_es6_module, 'events', 'EventHandler');
  var charmap=es6_import_item(_es6_module, 'events', 'charmap');
  var UndoFlags={IGNORE_UNDO: 2, IS_ROOT_OPERATOR: 4, UNDO_BARRIER: 8, HAS_UNDO_DATA: 16}
  UndoFlags = _es6_module.add_export('UndoFlags', UndoFlags);
  var ToolFlags={HIDE_TITLE_IN_LAST_BUTTONS: 1, USE_PARTIAL_UNDO: 2, USE_DEFAULT_INPUT: 4}
  ToolFlags = _es6_module.add_export('ToolFlags', ToolFlags);
  var ModalStates={TRANSFORMING: 1, PLAYING: 2}
  ModalStates = _es6_module.add_export('ModalStates', ModalStates);
  var _tool_op_idgen=1;
  var InheritFlag=_ESClass("InheritFlag", [function InheritFlag(val) {
    this.val = val;
  }]);
  _es6_module.add_class(InheritFlag);
  
  var ToolOpAbstract=_ESClass("ToolOpAbstract", [_ESClass.static(function inherit(inputs_or_outputs) {
    return new InheritFlag(inputs_or_outputs);
  }), _ESClass.static(function _get_slots() {
    var ret=[{}, {}];
    var parent=this.__parent__;
    if (this.tooldef!=undefined&&(parent==undefined||this.tooldef!==parent.tooldef)) {
        var tooldef=this.tooldef();
        for (var k in tooldef) {
            if (k!="inputs"&&k!="outputs") {
                continue;
            }
            var v=tooldef[k];
            if (__instance_of(v, InheritFlag)) {
                v = v.val==undefined ? {} : v.val;
                var slots=parent._get_slots();
                slots = k=="inputs" ? slots[0] : slots[1];
                v = this._inherit_slots(slots, v);
            }
            ret[k=="inputs" ? 0 : 1] = v;
        }
    }
    else 
      if (this.inputs!=undefined||this.outputs!=undefined) {
        console.trace("Deprecation warning: (second) old form                     of toolprop definition detected for", this);
        if (this.inputs!=undefined) {
            ret[0] = this.inputs;
        }
        if (this.outputs!=undefined) {
            ret[1] = this.outputs;
        }
    }
    else {
      console.trace("Deprecation warning: oldest (and evilest) form                     of toolprop detected for", this);
    }
    return ret;
  }), function ToolOpAbstract(apiname, uiname, description, icon) {
    if (description==undefined) {
        description = undefined;
    }
    if (icon==undefined) {
        icon = -1;
    }
    var parent=this.constructor.__parent__;
    var slots=this.constructor._get_slots();
    for (var i=0; i<2; i++) {
        var slots2={};
        if (i==0)
          this.inputs = slots2;
        else 
          this.outputs = slots2;
        for (var k in slots[i]) {
            slots2[k] = slots[i][k].copy();
            slots2[k].apiname = k;
        }
    }
    if (this.constructor.tooldef!=undefined&&(parent==undefined||this.constructor.tooldef!==parent.tooldef)) {
        var tooldef=this.constructor.tooldef();
        for (var k in tooldef) {
            if (k=="inputs"||k=="outputs")
              continue;
            this[k] = tooldef[k];
        }
    }
    else {
      if (this.name==undefined)
        this.name = apiname;
      if (this.uiname==undefined)
        this.uiname = uiname;
      if (this.description==undefined)
        this.description = description==undefined ? "" : description;
      if (this.icon==undefined)
        this.icon = icon;
    }
    this.apistruct = undefined;
    this.op_id = _tool_op_idgen++;
    this.stack_index = -1;
  }, _ESClass.static(function _inherit_slots(old, newslots) {
    if (old==undefined) {
        console.trace("Warning: old was undefined in _inherit_slots()!");
        return newslots;
    }
    for (var k in old) {
        if (!(k in newslots))
          newslots[k] = old[k];
    }
    return newslots;
  }), _ESClass.static(function inherit_inputs(cls, newslots) {
    if (cls.inputs==undefined)
      return newslots;
    return ToolOpAbstract._inherit_slots(cls.inputs, newslots);
  }), _ESClass.static(function inherit_outputs(cls, newslots) {
    if (cls.outputs==undefined)
      return newslots;
    return ToolOpAbstract._inherit_slots(cls.outputs, newslots);
  }), function get_saved_context() {
    if (this.saved_context==undefined) {
        console.log("warning : invalid saved_context in "+this.constructor.name+".get_saved_context()");
        this.saved_context = new SavedContext(new Context());
    }
    return this.saved_context;
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    return "TO"+this.op_id;
  }), function exec(tctx) {
  }, function default_inputs(ctx, get_default) {
  }]);
  _es6_module.add_class(ToolOpAbstract);
  ToolOpAbstract = _es6_module.add_export('ToolOpAbstract', ToolOpAbstract);
  ToolOpAbstract.STRUCT = "\n  ToolOpAbstract {\n      flag    : int;\n      saved_context  : SavedContext | obj.get_saved_context();\n      inputs  : iter(k, PropPair) | new PropPair(k, obj.inputs[k]);\n      outputs : iter(k, PropPair) | new PropPair(k, obj.outputs[k]);\n  }\n";
  var PropPair=_ESClass("PropPair", [function PropPair(key, value) {
    this.key = key;
    this.value = value;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var obj={}
    reader(obj);
    return obj;
  })]);
  _es6_module.add_class(PropPair);
  PropPair.STRUCT = "\n  PropPair {\n    key   : string;\n    value : abstract(ToolProperty);\n  }\n";
  var $toolops_r945_get_constructor;
  var ToolOp=_ESClass("ToolOp", ToolOpAbstract, [function ToolOp(apiname, uiname, description, icon) {
    if (apiname==undefined) {
        apiname = "(undefined)";
    }
    if (uiname==undefined) {
        uiname = "(undefined)";
    }
    if (description==undefined) {
        description = undefined;
    }
    if (icon==undefined) {
        icon = -1;
    }
    ToolOpAbstract.call(this, apiname, uiname, description, icon);
    EventHandler.call(this);
    this.drawlines = new GArray();
    if (this.is_modal==undefined)
      this.is_modal = false;
    this.undoflag = 0;
    this.on_modal_end = undefined;
    this.modal_ctx = null;
    this.flag = 0;
    this.keyhandler = undefined;
    this.parent = undefined;
    this.widgets = [];
    this.modal_running = false;
    this._widget_on_tick = undefined;
  }, function new_drawline(v1, v2, color, line_width) {
    var dl=this.modal_ctx.view2d.make_drawline(v1, v2, undefined, color, line_width);
    this.drawlines.push(dl);
    return dl;
  }, function reset_drawlines(ctx) {
    if (ctx==undefined) {
        ctx = this.modal_ctx;
    }
    var view2d=ctx.view2d;
    var __iter_dl=__get_iter(this.drawlines);
    var dl;
    while (1) {
      var __ival_dl=__iter_dl.next();
      if (__ival_dl.done) {
          break;
      }
      dl = __ival_dl.value;
      view2d.kill_drawline(dl);
    }
    this.drawlines.reset();
  }, _ESClass.static(function create_widgets(manager, ctx) {
  }), _ESClass.static(function reset_widgets(op, ctx) {
  }), function undo_ignore() {
    this.undoflag|=UndoFlags.IGNORE_UNDO;
  }, function on_mousemove() {
    redraw_viewport();
  }, function exec_pre(tctx) {
    for (var k in this.inputs) {
        if (this.inputs[k].type==PropTypes.COLLECTION) {
            this.inputs[k].ctx = tctx;
        }
    }
    for (var k in this.outputs) {
        if (this.outputs[k].type==PropTypes.COLLECTION) {
            this.outputs[k].ctx = tctx;
        }
    }
  }, function cancel_modal(ctx) {
    console.log("cancel");
    ctx.toolstack.toolop_cancel(this);
  }, function start_modal(ctx) {
  }, function _start_modal(ctx) {
    this.modal_running = true;
    ctx.view2d.push_modal(this);
    this.modal_ctx = ctx;
  }, function _end_modal() {
    var ctx=this.modal_ctx;
    this.modal_running = false;
    this.saved_context = new SavedContext(this.modal_ctx);
    this.modal_ctx.view2d.pop_modal();
    if (this.on_modal_end!=undefined)
      this.on_modal_end(this);
    this.reset_drawlines(ctx);
  }, function end_modal() {
    this._end_modal();
  }, function can_call(ctx) {
    return true;
  }, function exec(ctx) {
  }, function start_modal(ctx) {
  }, function redo_post(ctx) {
    window.redraw_viewport();
  }, function undo_pre(ctx) {
    this._undocpy = g_app_state.create_undo_file();
    window.redraw_viewport();
  }, function undo(ctx) {
    g_app_state.load_undo_file(this._undocpy);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var op=new ToolOp();
    reader(op);
    var ins={}
    for (var i=0; i<op.inputs.length; i++) {
        ins[op.inputs[i].key] = op.inputs[i].value;
    }
    var outs={}
    for (var i=0; i<op.outputs.length; i++) {
        outs[op.outputs[i].key] = op.outputs[i].value;
    }
    op.inputs = ins;
    op.outputs = outs;
    return op;
  }), _ESClass.static(function get_constructor(name) {
    if ($toolops_r945_get_constructor==undefined) {
        $toolops_r945_get_constructor = {};
        for (var c in defined_classes) {
            if (__instance_of(c, ToolOp))
              $toolops_r945_get_constructor[c.name] = c;
        }
    }
    return $toolops_r945_get_constructor[c];
  })]);
  var $toolops_r945_get_constructor=undefined;
  _es6_module.add_class(ToolOp);
  ToolOp = _es6_module.add_export('ToolOp', ToolOp);
  ToolOp.STRUCT = "\n  ToolOp {\n      flag    : int;\n      saved_context  : SavedContext | obj.get_saved_context();\n      inputs  : iter(k, PropPair) | new PropPair(k, obj.inputs[k]);\n      outputs : iter(k, PropPair) | new PropPair(k, obj.outputs[k]);\n  }\n";
  var ToolMacro=_ESClass("ToolMacro", ToolOp, [function ToolMacro(name, uiname, tools) {
    if (tools==undefined) {
        tools = undefined;
    }
    ToolOp.call(this, name, uiname);
    this.cur_modal = 0;
    this._chained_on_modal_end = false;
    if (tools==undefined)
      this.tools = new GArray();
    else 
      this.tools = new GArray(tools);
  }, function add_tool(tool) {
    tool.parent = this;
    this.tools.push(tool);
    if (tool.is_modal)
      this.is_modal = true;
  }, function connect_tools(output, input) {
    var old_set=input.user_set_data;
    input.user_set_data = function() {
      this.data = output.data;
      old_set.call(this);
    }
  }, function undo_pre(ctx) {
  }, function undo(ctx) {
    for (var i=this.tools.length-1; i>=0; i--) {
        this.tools[i].undo(ctx);
    }
  }, function exec(ctx) {
    for (var i=0; i<this.tools.length; i++) {
        this.tools[i].saved_context = this.saved_context;
    }
    for (var op in this.tools) {
        if (op.is_modal)
          op.is_modal = this.is_modal;
        for (var k in op.inputs) {
            var p=op.inputs[k];
            if (p.user_set_data!=undefined)
              p.user_set_data.call(p);
        }
        op.saved_context = this.saved_context;
        op.undo_pre(ctx);
        op.undoflag|=UndoFlags.HAS_UNDO_DATA;
        op.exec_pre(ctx);
        op.exec(ctx);
    }
  }, function can_call(ctx) {
    return this.tools[0].can_call(ctx);
  }, function start_modal(ctx) {
    if (!this._chained_on_modal_end) {
        var last_modal=undefined;
        for (var op in this.tools) {
            if (op.is_modal)
              last_modal = op;
        }
        console.log("last_modal", last_modal);
        if (last_modal!=undefined) {
            console.log("yay, found last modal");
            var on_modal_end=last_modal.on_modal_end;
            var this2=this;
            last_modal.on_modal_end = function(toolop) {
              if (on_modal_end!=undefined)
                on_modal_end(toolop);
              if (this2.on_modal_end)
                this2.on_modal_end(this2);
            };
            this._chained_on_modal_end = true;
        }
    }
    for (var i=0; i<this.tools.length; i++) {
        this.tools[i].saved_context = this.saved_context;
    }
    for (var i=0; i<this.tools.length; i++) {
        var op=this.tools[i];
        if (op.is_modal) {
            this.cur_modal = i;
            for (var k in op.inputs) {
                var p=op.inputs[k];
                if (p.user_set_data!=undefined)
                  p.user_set_data.call(p);
            }
            op.modal_ctx = this.modal_ctx;
            op.modal_tctx = this.modal_tctx;
            op.saved_context = this.saved_context;
            op.undo_pre(ctx);
            op.undoflag|=UndoFlags.HAS_UNDO_DATA;
            op.modal_running = true;
            return op.start_modal(ctx);
        }
        else {
          for (var k in op.inputs) {
              var p=op.inputs[k];
              if (p.user_set_data!=undefined)
                p.user_set_data.call(p);
          }
          op.saved_context = this.saved_context;
          op.exec_pre(ctx);
          op.undo_pre(ctx);
          op.undoflag|=UndoFlags.HAS_UNDO_DATA;
          op.exec(ctx);
        }
    }
  }, function _end_modal() {
    var ctx=this.modal_ctx;
    this.next_modal(ctx);
  }, function next_modal(ctx) {
    this.tools[this.cur_modal].end_modal(ctx);
    this.cur_modal++;
    while (this.cur_modal<this.tools.length&&!this.tools[this.cur_modal].is_modal) {
      this.cur_modal++    }
    if (this.cur_modal>=this.tools.length) {
        ToolOp.prototype._end_modal.call(this);
    }
    else {
      this.tools[this.cur_modal].undo_pre(ctx);
      this.tools[this.cur_modal].undoflag|=UndoFlags.HAS_UNDO_DATA;
      this.tools[this.cur_modal].start_modal(ctx);
    }
  }, function on_mousemove(event) {
    this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
    this.tools[this.cur_modal].on_mousemove(event);
  }, function on_mousedown(event) {
    this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
    this.tools[this.cur_modal].on_mousedown(event);
  }, function on_mouseup(event) {
    this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
    this.tools[this.cur_modal].on_mouseup(event);
  }, function on_keydown(event) {
    this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
    this.tools[this.cur_modal].on_keydown(event);
  }, function on_keyup(event) {
    this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
    this.tools[this.cur_modal].on_keyup(event);
  }, function on_draw(event) {
    this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
    this.tools[this.cur_modal].on_draw(event);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=STRUCT.chain_fromSTRUCT(ToolMacro, reader);
    ret.tools = new GArray(ret.tools);
    var __iter_t=__get_iter(ret.tools);
    var t;
    while (1) {
      var __ival_t=__iter_t.next();
      if (__ival_t.done) {
          break;
      }
      t = __ival_t.value;
      t.parent = this;
    }
    return ret;
  })]);
  _es6_module.add_class(ToolMacro);
  ToolMacro = _es6_module.add_export('ToolMacro', ToolMacro);
  ToolMacro.STRUCT = STRUCT.inherit(ToolMacro, ToolOp)+"\n  tools   : array(abstract(ToolOp));\n  apiname : string;\n  uiname  : string;\n}\n";
  var StringProperty=es6_import_item(_es6_module, 'toolprops', 'StringProperty');
  var Vec3Property=es6_import_item(_es6_module, 'toolprops', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, 'toolprops', 'Vec4Property');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var DataPathOp=_ESClass("DataPathOp", ToolOp, [function DataPathOp(path, use_simple_undo) {
    if (path==undefined) {
        path = "";
    }
    if (use_simple_undo==undefined) {
        use_simple_undo = false;
    }
    ToolOpAbstract.call(this, "DataPathOp", "DataPath", "DataPath Value Set");
    this.use_simple_undo = use_simple_undo;
    this.is_modal = false;
    this.path = path;
    this.inputs = {path: new StringProperty(path, "path", "path", "path"), vec3: new Vec3Property(undefined, "vec3", "vec3", "vec3"), vec4: new Vec4Property(undefined, "vec4", "vec4", "vec4"), pint: new IntProperty(0, "pint", "pint", "pint"), pfloat: new FloatProperty(0, "pfloat", "pfloat", "pfloat"), str: new StringProperty("", "str", "str", "str"), bool: new BoolProperty(false, "bool", "bool", "bool"), val_input: new StringProperty("", "val_input", "val_input", "val_input")}
    this.outputs = {}
    for (var k in this.inputs) {
        this.inputs[k].flag|=TPropFlags.PRIVATE;
    }
  }, function undo_pre(ctx) {
    this._undocpy = g_app_state.create_undo_file();
  }, function undo(ctx) {
    g_app_state.load_undo_file(this._undocpy);
  }, function get_prop_input(path, prop) {
    if (prop==undefined) {
        console.trace("Warning: DataPathOp failed!", path, prop);
        return ;
    }
    var input;
    if (prop.type==PropTypes.INT) {
        input = this.inputs.pint;
    }
    else 
      if (prop.type==PropTypes.FLOAT) {
        input = this.inputs.pfloat;
    }
    else 
      if (prop.type==PropTypes.VEC3) {
        input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec3;
    }
    else 
      if (prop.type==PropTypes.VEC4) {
        input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec4;
    }
    else 
      if (prop.type==PropTypes.BOOL) {
        input = this.inputs.bool;
    }
    else 
      if (prop.type==PropTypes.STR) {
        input = this.inputs.str;
    }
    else 
      if (prop.type==PropTypes.FLAG) {
        input = this.inputs.str;
    }
    else 
      if (prop.type==PropTypes.ENUM) {
        input = this.inputs.pint;
    }
    else {
      console.trace("ERROR: unimplemented prop type "+prop.type+"in DataPathOp", prop, this);
      return undefined;
    }
    return input;
  }, function exec(ctx) {
    var api=g_app_state.api;
    var path=this.inputs.path.data.trim();
    var prop=api.get_prop_meta(ctx, path);
    if (prop==undefined) {
        console.trace("Warning: DataPathOp failed!");
        return ;
    }
    var input=this.get_prop_input(path, prop);
    api.set_prop(ctx, path, input.data);
  }]);
  _es6_module.add_class(DataPathOp);
  mixin(ToolOp, EventHandler);
  var MassSetPathOp=_ESClass("MassSetPathOp", ToolOp, [function MassSetPathOp(path, subpath, filterstr, use_simple_undo) {
    if (path==undefined) {
        path = "";
    }
    if (subpath==undefined) {
        subpath = "";
    }
    if (filterstr==undefined) {
        filterstr = "";
    }
    if (use_simple_undo==undefined) {
        use_simple_undo = false;
    }
    ToolOpAbstract.call(this, "DataPathOp", "DataPath", "DataPath Value Set");
    this.use_simple_undo = use_simple_undo;
    this.is_modal = false;
    this.path = path;
    this.subpath = subpath;
    this.filterstr = filterstr;
    this.inputs = {path: new StringProperty(path, "path", "path", "path"), vec3: new Vec3Property(undefined, "vec3", "vec3", "vec3"), vec4: new Vec4Property(undefined, "vec4", "vec4", "vec4"), pint: new IntProperty(0, "pint", "pint", "pint"), pfloat: new FloatProperty(0, "pfloat", "pfloat", "pfloat"), str: new StringProperty("", "str", "str", "str"), bool: new BoolProperty(false, "bool", "bool", "bool"), val_input: new StringProperty("", "val_input", "val_input", "val_input")}
    this.outputs = {}
    for (var k in this.inputs) {
        this.inputs[k].flag|=TPropFlags.PRIVATE;
    }
  }, function _get_value(ctx) {
    var path=this.path.trim();
    var prop=api.get_prop_meta(ctx, path);
    if (prop==undefined) {
        console.trace("Warning: DataPathOp failed!");
        return ;
    }
    return this.get_prop_input(path, prop);
  }, function undo_pre(ctx) {
    var value=this._get_value(ctx);
    var paths=ctx.api.build_mass_set_paths(ctx, this.path, this.subpath, value, this.filterstr);
    var ud=this._undo = {}
    for (var i=0; i<paths.length; i++) {
        var value2=ctx.api.get_prop(paths[i]);
        ud[paths[i]] = JSON.stringify(value2);
    }
  }, function undo(ctx) {
    var value=this._get_value(ctx);
    var paths=ctx.api.build_mass_set_paths(ctx, this.path, this.subpath, value, this.filterstr);
    var ud=this._undo;
    for (var k in ud) {
        var data=JSON.parse(ud[k]);
        if (data=="undefined")
          data = undefined;
        ctx.api.set_prop(ctx, k, data);
    }
  }, function get_prop_input(path, prop) {
    if (prop==undefined) {
        console.trace("Warning: DataPathOp failed!", path, prop);
        return ;
    }
    var input;
    if (prop.type==PropTypes.INT) {
        input = this.inputs.pint;
    }
    else 
      if (prop.type==PropTypes.FLOAT) {
        input = this.inputs.pfloat;
    }
    else 
      if (prop.type==PropTypes.VEC3) {
        input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec3;
    }
    else 
      if (prop.type==PropTypes.VEC4) {
        input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec4;
    }
    else 
      if (prop.type==PropTypes.BOOL) {
        input = this.inputs.bool;
    }
    else 
      if (prop.type==PropTypes.STR) {
        input = this.inputs.str;
    }
    else 
      if (prop.type==PropTypes.FLAG) {
        input = this.inputs.str;
    }
    else 
      if (prop.type==PropTypes.ENUM) {
        input = this.inputs.pint;
    }
    else {
      console.trace("ERROR: unimplemented prop type "+prop.type+"in DataPathOp", prop, this);
      return undefined;
    }
    return input;
  }, function exec(ctx) {
    var api=g_app_state.api;
    var path=this.inputs.path.data.trim();
    var prop=api.get_prop_meta(ctx, path);
    if (prop==undefined) {
        console.trace("Warning: DataPathOp failed!");
        return ;
    }
    var input=this.get_prop_input(path, prop);
    api.mass_set_prop(ctx, path, this.subpath, input.data, this.filterstr);
  }]);
  _es6_module.add_class(MassSetPathOp);
  window.init_toolop_structs = function() {
    
    function gen_fromSTRUCT(cls1) {
      function fromSTRUCT(reader) {
        var op=new cls1();
        var inputs=op.inputs, outputs=op.outputs;
        reader(op);
        var ins=Object.create(inputs), outs=Object.create(outputs);
        for (var i=0; i<op.inputs.length; i++) {
            var k=op.inputs[i].key;
            ins[k] = op.inputs[i].value;
            if (k in inputs) {
                ins[k].load_ui_data(inputs[k]);
            }
            else {
              ins[k].uiname = ins[k].apiname = k;
            }
        }
        for (var i=0; i<op.outputs.length; i++) {
            var k=op.outputs[i].key;
            outs[k] = op.outputs[i].value;
            if (k in outputs) {
                outs[k].load_ui_data(outputs[k]);
            }
            else {
              outs[k].uiname = outs[k].apiname = k;
            }
        }
        op.inputs = ins;
        op.outputs = outs;
        return op;
      }
      return fromSTRUCT;
    }
    for (var i=0; i<defined_classes.length; i++) {
        var cls=defined_classes[i];
        var ok=false;
        var is_toolop=false;
        var parent=cls.__parent__;
        while (parent!==undefined) {
          if (parent===ToolOpAbstract) {
              ok = true;
          }
          else 
            if (parent===ToolOp) {
              ok = true;
              is_toolop = true;
              break;
          }
          parent = parent.__parent__;
        }
        if (!ok)
          continue;
        if (!("STRUCT" in cls)) {
            cls.STRUCT = cls.name+" {"+"\n        flag    : int;\n        inputs  : iter(k, PropPair) | new PropPair(k, obj.inputs[k]);\n        outputs : iter(k, PropPair) | new PropPair(k, obj.outputs[k]);\n      ";
            if (is_toolop)
              cls.STRUCT+="    saved_context  : SavedContext | obj.get_saved_context();\n";
            cls.STRUCT+="  }";
        }
        if (!("fromSTRUCT" in cls.__statics__)) {
            cls.fromSTRUCT = gen_fromSTRUCT(cls);
            define_static(cls, "fromSTRUCT", cls.fromSTRUCT);
        }
    }
  }
  var WidgetToolOp=_ESClass("WidgetToolOp", ToolOp, [_ESClass.static(function create_widgets(manager, ctx) {
    var widget=manager.create();
    var enabled_axes=this.widget_axes;
    var do_widget_center=this.widget_center;
    var gen_toolop=this.gen_toolop;
    var do_x=enabled_axes[0], do_y=enabled_axes[1], do_z=enabled_axes[2];
    if (do_x)
      widget.arrow([1, 0, 0], 0, [1, 0, 0, 1]);
    if (do_y)
      widget.arrow([0, 1, 0], 1, [0, 1, 0, 1]);
    if (do_z)
      widget.arrow([0, 0, 1], 2, [0, 0, 1, 1]);
    var this2=this;
    var $zaxis_JzjB;
    function widget_on_tick(widget) {
      var mat=widget.matrix;
      var mesh=ctx.mesh;
      var cent=new Vector3();
      var len=0;
      var v1=new Vector3();
      var __iter_v=__get_iter(mesh.verts.selected);
      var v;
      while (1) {
        var __ival_v=__iter_v.next();
        if (__ival_v.done) {
            break;
        }
        v = __ival_v.value;
        cent.add(v.co);
        v1.load(v.edges[0].v1.co).sub(v.edges[0].v2.co);
        v1.normalize();
        len++;
      }
      if (len>0)
        cent.mulScalar(1.0/len);
      mat.makeIdentity();
      mat.translate(cent[0], cent[1], cent[2]);
      if (this2.widget_align_normal) {
          var n=new Vector3();
          var tan=new Vector3();
          len = 0;
          var v1=new Vector3();
          var __iter_f=__get_iter(mesh.faces.selected);
          var f;
          while (1) {
            var __ival_f=__iter_f.next();
            if (__ival_f.done) {
                break;
            }
            f = __ival_f.value;
            var e=f.looplists[0].loop.e;
            len++;
            n.add(f.no);
          }
          n.mulScalar(1.0/len);
          n.normalize();
          if (tan.dot(tan)==0.0) {
              tan.loadXYZ(0, 0, 1);
          }
          else {
            tan.mulScalar(1.0/len);
            tan.normalize();
          }
          var angle=Math.PI-Math.acos($zaxis_JzjB.dot(n));
          if (n.dot($zaxis_JzjB)>0.9) {
          }
          if (1) {
              if (Math.abs(angle)<0.001||Math.abs(angle)>Math.PI-0.001) {
                  n.loadXYZ(1, 0, 0);
              }
              else {
                n.cross($zaxis_JzjB);
                n.normalize();
              }
              var q=new Quat();
              q.axisAngleToQuat(n, angle);
              var rmat=q.toMatrix();
              mat.multiply(rmat);
          }
      }
      mat.multiply(ctx.object.matrix);
    }
    var $zaxis_JzjB=new Vector3([0, 0, -1]);
    widget.on_tick = widget_on_tick;
    widget.on_click = function(widget, id) {
      console.log("widget click: ", id);
      ctx.view2d._mstart = null;
      var toolop=undefined;
      if (gen_toolop!=undefined) {
          var toolop=gen_toolop(id, widget, ctx);
      }
      else {
        console.trace("IMPLEMENT ME! missing widget gen_toolop callback!");
        return ;
      }
      if (toolop==undefined) {
          console.log("Evil! Undefined toolop in WidgetToolOp.create_widgets()!");
          return ;
      }
      widget.user_data = toolop;
      toolop._widget_on_tick = widget_on_tick;
      toolop.widgets.push(widget);
      toolop.on_modal_end = function(toolop) {
        var __iter_w=__get_iter(toolop.widgets);
        var w;
        while (1) {
          var __ival_w=__iter_w.next();
          if (__ival_w.done) {
              break;
          }
          w = __ival_w.value;
          for (var k in toolop.inputs) {
              var p=toolop.inputs[k];
              p.remove_listener(w, true);
          }
          for (var k in toolop.outputs) {
              var p=toolop.outputs[k];
              p.remove_listener(w, true);
          }
        }
        console.log("widget modal end");
        toolop.widgets = new GArray();
        widget.on_tick = widget_on_tick;
      }
      if (toolop.widget_on_tick)
        widget.widget_on_tick = toolop.widget_on_tick;
      widget.on_tick = function(widget) {
        toolop.widget_on_tick.call(toolop, widget);
      }
      g_app_state.toolstack.exec_tool(toolop);
    }
  }), function widget_on_tick(widget) {
    if (this._widget_on_tick!=undefined)
      this._widget_on_tick(widget);
  }, function WidgetToolOp() {
    ToolOp.apply(this, arguments);
  }]);
  _es6_module.add_class(WidgetToolOp);
}, '/dev/fairmotion/src/core/toolops_api.js');
es6_module_define('eventdag', ["J3DIMath"], function _eventdag_module(_es6_module) {
  "use strict";
  var _event_dag_idgen=undefined;
  es6_import(_es6_module, 'J3DIMath');
  window.the_global_dag = undefined;
  var NodeBase=_ESClass("NodeBase", [function dag_update(field, data) {
    var graph=window.the_global_dag;
    var node=graph.get_node(this, false);
    if (node!=undefined)
      node.dag_update(field, data);
  }, function dag_unlink() {
    var graph=window.the_global_dag;
    var node=graph.get_node(this, false);
    if (node!=undefined)
      window.the_global_dag.remove(node);
  }, function NodeBase() {
  }]);
  _es6_module.add_class(NodeBase);
  NodeBase = _es6_module.add_export('NodeBase', NodeBase);
  var UIOnlyNode=_ESClass("UIOnlyNode", NodeBase, [function UIOnlyNode() {
    NodeBase.apply(this, arguments);
  }]);
  _es6_module.add_class(UIOnlyNode);
  UIOnlyNode = _es6_module.add_export('UIOnlyNode', UIOnlyNode);
  var DataPathNode=_ESClass("DataPathNode", NodeBase, [function dag_get_datapath(ctx) {
  }, _ESClass.static(function isDataPathNode(obj) {
    return "dag_get_datapath" in obj;
  }), function DataPathNode() {
    NodeBase.apply(this, arguments);
  }]);
  _es6_module.add_class(DataPathNode);
  DataPathNode = _es6_module.add_export('DataPathNode', DataPathNode);
  Node.dag_inputs = {}
  Node.dag_outputs = {}
  var DagFlags={UPDATE: 1, TEMP: 2, DEAD: 4}
  DagFlags = _es6_module.add_export('DagFlags', DagFlags);
  var EventNode=_ESClass("EventNode", [function EventNode() {
    this.flag = 0;
    this.id = -1;
    this.graph = undefined;
  }, function get_owner(ctx) {
  }, function on_remove(ctx) {
  }, function dag_update(field, data) {
    if (field==undefined) {
        for (var k in this.outputs) {
            this.dag_update(k);
        }
        return ;
    }
    var sock=this.outputs[field];
    if (arguments.length>1) {
        sock.data = data;
    }
    sock.flag|=DagFlags.UPDATE;
    this.flag|=DagFlags.UPDATE;
    for (var i=0; i<sock.edges.length; i++) {
        var e=sock.edges[i], n2=e.opposite(sock).owner;
    }
    this.graph.on_update(this, field);
  }, function unlink() {
    for (var k in this.inputs) {
        this.inputs[k].disconnect_all();
    }
    for (var k in this.outputs) {
        this.outputs[k].disconnect_all();
    }
  }]);
  _es6_module.add_class(EventNode);
  EventNode = _es6_module.add_export('EventNode', EventNode);
  EventNode.inputs = {}
  EventNode.outputs = {}
  var IndirectNode=_ESClass("IndirectNode", EventNode, [function IndirectNode(path) {
    EventNode.call(this);
    this.datapath = path;
  }, function get_owner(ctx) {
    if (this._owner!=undefined)
      return this._owner;
    this._owner = ctx.api.get_object(ctx, this.datapath);
    return this._owner;
  }]);
  _es6_module.add_class(IndirectNode);
  IndirectNode = _es6_module.add_export('IndirectNode', IndirectNode);
  var DirectNode=_ESClass("DirectNode", EventNode, [function DirectNode(id) {
    EventNode.call(this);
    this.objid = id;
  }, function get_owner(ctx) {
    return this.graph.object_idmap[this.objid];
  }]);
  _es6_module.add_class(DirectNode);
  DirectNode = _es6_module.add_export('DirectNode', DirectNode);
  var DataTypes={DEPEND: 1, NUMBER: 2, BOOL: 4, STRING: 8, VEC2: 16, VEC3: 32, VEC4: 64, MATRIX4: 128, ARRAY: 256}
  DataTypes = _es6_module.add_export('DataTypes', DataTypes);
  var TypeDefaults=t = {}
  t[DataTypes.DEPEND] = undefined;
  t[DataTypes.NUMBER] = 0;
  t[DataTypes.STRING] = "";
  t[DataTypes.VEC2] = new Vector2();
  t[DataTypes.MATRIX4] = new Vector3();
  t[DataTypes.ARRAY] = [];
  t[DataTypes.BOOL] = true;
  var EventEdge=_ESClass("EventEdge", [function EventEdge(dst, src) {
    this.dst = dst;
    this.src = src;
  }, function opposite(socket) {
    return socket==this.dst ? this.src : this.dst;
  }]);
  _es6_module.add_class(EventEdge);
  EventEdge = _es6_module.add_export('EventEdge', EventEdge);
  var EventSocket=_ESClass("EventSocket", [function EventSocket(name, owner, type, datatype) {
    this.type = type;
    this.name = name;
    this.owner = owner;
    this.datatype = datatype;
    this.data = undefined;
    this.flag = DagFlags.UPDATE;
    this.edges = [];
  }, function copy() {
    var s=new EventSocket(this.name, undefined, this.type, this.datatype);
    return s;
  }, function connect(b) {
    if (b.type==this.type) {
        throw new Error("Cannot put two inputs or outputs together");
    }
    var src, dst;
    if (this.type=="i") {
        src = b, dst = this;
    }
    else 
      if (this.type=="o") {
        src = this, dst = b;
    }
    else {
      throw new Error("Malformed socket type.  this.type, b.type, this, b:", this.type, b.type, this, b);
    }
    var edge=new EventEdge(dst, src);
    this.edges.push(edge);
    b.edges.push(edge);
  }, function _find_edge(b) {
    for (var i=0; i<this.edges.length; i++) {
        if (this.edges[i].opposite(this)===b)
          return this.edges[i];
    }
    return undefined;
  }, function disconnect(other_socket) {
    if (other_socket==undefined) {
        warntrace("Warning, no other_socket in disconnect!");
        return ;
    }
    var e=this._find_edge(other_socket);
    if (e!=undefined) {
        other_socket.edges.remove(e);
        this.edges.remove(e);
    }
  }, function disconnect_all() {
    while (this.edges.length>0) {
      var e=this.edges[0];
      e.opposite(this).edges.remove(e);
      this.edges.remove(e);
    }
  }]);
  _es6_module.add_class(EventSocket);
  EventSocket = _es6_module.add_export('EventSocket', EventSocket);
  function gen_callback_exec(func, thisvar) {
    for (var k in UIOnlyNode.prototype) {
        if (k=="toString")
          continue;
        func[k] = UIOnlyNode.prototype[k];
    }
    func.constructor = {}
    func.constructor.name = func.name;
    func.constructor.prototype = UIOnlyNode.prototype;
    func.dag_exec = function(ctx, graph) {
      var args=[];
      for (var k in this.constructor.dag_inputs) {
          args.push(this[k]);
      }
      this.apply(thisvar!=undefined ? thisvar : self, args);
    }
  }
  var $sarr_w8Ca_link;
  var $darr_x8VU_link;
  var EventDag=_ESClass("EventDag", [function EventDag() {
    this.nodes = [];
    this.sortlist = [];
    this.doexec = false;
    this.node_pathmap = {}
    this.node_idmap = {}
    this.object_idmap = {}
    this.idmap = {}
    this.ctx = undefined;
    if (_event_dag_idgen==undefined)
      _event_dag_idgen = new EIDGen();
    this.object_idgen = _event_dag_idgen;
    this.idgen = new EIDGen();
    this.resort = true;
  }, function reset_cache() {
    var __iter_n=__get_iter(this.nodes);
    var n;
    while (1) {
      var __ival_n=__iter_n.next();
      if (__ival_n.done) {
          break;
      }
      n = __ival_n.value;
      if (__instance_of(n, IndirectNode)) {
          n._owner = undefined;
      }
    }
  }, function init_slots(node, object) {
    function make_slot(stype, k, v) {
      var type;
      if (v===undefined||v===null)
        type = DataTypes.DEPEND;
      else 
        if (v===true||k===false)
        type = DataTypes.BOOL;
      else 
        if (typeof v=="number")
        type = DataTypes.NUMBER;
      else 
        if (typeof v=="string"||__instance_of(v, String))
        type = DataTypes.STRING;
      else 
        if (__instance_of(v, Vector2))
        type = DataTypes.VEC2;
      else 
        if (__instance_of(v, Vector3))
        type = DataTypes.VEC3;
      else 
        if (__instance_of(v, Vector4))
        type = DataTypes.VEC4;
      else 
        if (__instance_of(v, Matrix4))
        type = DataTypes.MATRIX4;
      else 
        if (__instance_of(v, Array)) {
          for (var i=0; i<v.length; i++) {
              if (typeof (v[i])!="number"&&typeof (v[i])!=undefined) {
                  warntrace("WARNING: bad array being passed around!!", v);
              }
              type = DataTypes.ARRAY;
          }
      }
      return new EventSocket(k, node, stype, type);
    }
    node.inputs = {}
    node.outputs = {}
    if (object.constructor.dag_inputs!=undefined) {
        for (var k in object.constructor.dag_inputs) {
            var v=object.constructor.dag_inputs[k];
            node.inputs[k] = make_slot('i', k, v);
        }
    }
    if (object.constructor.dag_outputs!=undefined) {
        for (var k in object.constructor.dag_outputs) {
            var v=object.constructor.dag_outputs[k];
            node.outputs[k] = make_slot('o', k, v);
        }
    }
  }, function indirect_node(ctx, path, object, auto_create) {
    if (object==undefined) {
        object = undefined;
    }
    if (auto_create==undefined) {
        auto_create = true;
    }
    if (path in this.node_pathmap)
      return this.node_pathmap[path];
    if (!auto_create)
      return undefined;
    var node=new IndirectNode(path);
    this.node_pathmap[path] = node;
    if (object==undefined) {
        object = ctx.api.get_object(path);
    }
    this.init_slots(node, object);
    this.add(node);
    return node;
  }, function direct_node(ctx, object, auto_create) {
    if (auto_create==undefined) {
        auto_create = true;
    }
    if ("__dag_id" in object&&object.__dag_id in this.node_idmap) {
        this.object_idmap[object.__dag_id] = object;
        return this.node_idmap[object.__dag_id];
    }
    if (!auto_create)
      return undefined;
    if (object.__dag_id==undefined)
      object.__dag_id = this.object_idgen.gen_id();
    var node=new DirectNode(object.__dag_id);
    node.id = object.__dag_id;
    this.object_idmap[object.__dag_id] = object;
    this.node_idmap[object.__dag_id] = node;
    this.init_slots(node, object);
    this.add(node);
    return node;
  }, function add(node) {
    node.graph = this;
    this.nodes.push(node);
    this.resort = true;
    node.id = this.idgen.gen_id();
    this.idmap[node.id] = node;
  }, function remove(node) {
    if (!(__instance_of(node, EventNode)))
      node = this.get_node(node, false);
    if (node==undefined) {
        console.log("node already removed");
        return ;
    }
    node.unlink();
    if (__instance_of(node, DirectNode)) {
        delete this.object_idmap[node.objid];
        delete this.node_idmap[node.objid];
    }
    else 
      if (__instance_of(node, IndirectNode)) {
        delete this.node_pathmap[node.datapath];
    }
    delete this.idmap[node.id];
    this.nodes.remove(node);
    this.sortlist.remove(node);
    this.resort = true;
  }, function get_node(object, auto_create) {
    if (auto_create==undefined) {
        auto_create = true;
    }
    if (this.ctx==undefined)
      this.ctx = new Context();
    var node;
    if (DataPathNode.isDataPathNode(object)) {
        node = this.indirect_node(this.ctx, object.dag_get_datapath(), object, auto_create);
    }
    else {
      node = this.direct_node(this.ctx, object, auto_create);
    }
    if (node!=undefined&&object.dag_exec!=undefined&&node.dag_exec==undefined) {
        object = undefined;
        node.dag_exec = function(ctx) {
          var owner=this.get_owner(ctx);
          if (owner!=undefined) {
              return owner.dag_exec.apply(owner, arguments);
          }
        };
    }
    return node;
  }, function link(src, srcfield, dst, dstfield, dstthis) {
    var obja=src, objb=dst;
    var srcnode=this.get_node(src);
    if (!(__instance_of(srcfield, Array))) {
        $sarr_w8Ca_link[0] = srcfield;
        srcfield = $sarr_w8Ca_link;
    }
    if (!(__instance_of(dstfield, Array))) {
        $darr_x8VU_link[0] = dstfield;
        dstfield = $darr_x8VU_link;
    }
    if ((typeof dst=="function"||__instance_of(dst, Function))&&!dst._dag_callback_init) {
        gen_callback_exec(dst, dstthis);
        dst._dag_callback_init = true;
        delete dst.__prototypeid__;
        dst.constructor.dag_inputs = {};
        if (__instance_of(srcfield, Array)) {
            for (var i=0; i<srcfield.length; i++) {
                var field=srcfield[i];
                var field2=dstfield[i];
                if (!(field in srcnode.outputs)) {
                    console.trace(field, Object.keys(srcnode.outputs), srcnode);
                    throw new Error("Field not in outputs", field);
                }
                var type=srcnode.outputs[field].datatype;
                dst.constructor.dag_inputs[field2] = TypeDefaults[type];
            }
        }
    }
    var dstnode=this.get_node(dst);
    if (__instance_of(srcfield, Array)) {
        if (srcfield.length!=dstfield.length) {
            throw new Error("Error, both arguments must be arrays of equal length!", srcfield, dstfield);
        }
        for (var i=0; i<dstfield.length; i++) {
            if (!(dstfield[i] in dstnode.inputs))
              throw new Error("Event inputs does not exist: "+dstfield[i]);
            if (!(srcfield[i] in srcnode.outputs))
              throw new Error("Event output does not exist: "+srcfield[i]);
            dstnode.inputs[dstfield[i]].connect(srcnode.outputs[srcfield[i]]);
        }
    }
    else {
      console.log(dstnode, dstfield);
      if (!(dstfield in dstnode.inputs))
        throw new Error("Event input does not exist: "+dstfield);
      if (!(srcfield in srcnode.outputs))
        throw new Error("Event output does not exist: "+srcfield);
      dstnode.inputs[dstfield].connect(srcnode.outputs[srcfield]);
    }
    this.resort = true;
  }, function prune_dead_nodes() {
    var dellist=[];
    var __iter_n=__get_iter(this.nodes);
    var n;
    while (1) {
      var __ival_n=__iter_n.next();
      if (__ival_n.done) {
          break;
      }
      n = __ival_n.value;
      var tot=0;
      for (var k in n.inputs) {
          tot+=n.inputs[k].edges.length;
      }
      for (var k in n.outputs) {
          tot+=n.outputs[k].edges.length;
      }
      if (tot==0) {
          dellist.push(n);
      }
    }
    var __iter_n=__get_iter(dellist);
    var n;
    while (1) {
      var __ival_n=__iter_n.next();
      if (__ival_n.done) {
          break;
      }
      n = __ival_n.value;
      this.remove(n);
    }
  }, function sort() {
    this.prune_dead_nodes();
    var sortlist=[];
    var visit={}
    var __iter_n=__get_iter(this.nodes);
    var n;
    while (1) {
      var __ival_n=__iter_n.next();
      if (__ival_n.done) {
          break;
      }
      n = __ival_n.value;
      n.flag&=~DagFlags.TEMP;
    }
    function sort(n) {
      n.flag|=DagFlags.TEMP;
      for (var k in n.inputs) {
          var sock=n.inputs[k];
          for (var i=0; i<sock.length; i++) {
              var n2=sock.edges[i].opposite(sock).owner;
              if (!(n2.flag&DagFlags.TEMP)) {
                  sort(n2);
              }
          }
      }
      sortlist.push(n);
      for (var k in n.outputs) {
          var sock=n.outputs[k];
          for (var i=0; i<sock.length; i++) {
              var n2=sock.edges[i].opposite(sock).owner;
              if (!(n2.flag&DagFlags.TEMP)) {
                  sort(n2);
              }
          }
      }
    }
    var nlen=this.nodes.length, nodes=this.nodes;
    for (var i=0; i<nlen; i++) {
        var n=nodes[i];
        if (n.flag&DagFlags.TEMP)
          continue;
        sort(n);
    }
    this.sortlist = sortlist;
    this.resort = false;
  }, function on_update(node) {
    this.doexec = true;
  }, function exec(ctx) {
    if (this.resort) {
        this.sort();
    }
    var sortlist=this.sortlist;
    var slen=sortlist.length;
    for (var i=0; i<slen; i++) {
        var n=sortlist[i];
        if (!(n.flag&DagFlags.UPDATE))
          continue;
        n.flag&=~DagFlags.UPDATE;
        var owner=n.get_owner(ctx);
        if (owner==undefined) {
            n.flag|=DagFlags.DEAD;
        }
        for (var k in n.outputs) {
            var s=n.outputs[k];
            if (!(s.flag&DagFlags.UPDATE))
              continue;
            for (var j=0; j<s.edges.length; j++) {
                s.edges[j].opposite(s).owner.flag|=DagFlags.UPDATE;
            }
        }
        if (owner==undefined||owner.dag_exec==undefined)
          continue;
        for (var k in n.inputs) {
            var sock=n.inputs[k];
            for (var j=0; j<sock.edges.length; j++) {
                var e=sock.edges[j], s2=e.opposite(sock);
                var n2=s2.owner, owner2=n2.get_owner(ctx);
                if (n2==undefined) {
                    n2.flag|=DagFlags.DEAD;
                    continue;
                }
                if ((sock.flag&DagFlags.UPDATE)||sock.datatype==DataTypes.DEPEND) {
                }
                var data=s2.data!=undefined||owner2==undefined ? s2.data : owner2[s2.name];
                if (data!=undefined)
                  s2.data = data;
                switch (sock.datatype) {
                  case DataTypes.DEPEND:
                    break;
                  case DataTypes.NUMBER:
                  case DataTypes.STRING:
                  case DataTypes.BOOL:
                    owner[sock.name] = data;
                    break;
                  case DataTypes.VEC2:
                    if (!(sock.name in owner)) {
                        owner[sock.name] = new Vector2(data);
                    }
                    else {
                      owner[sock.name].load(data);
                    }
                    break;
                  case DataTypes.VEC3:
                    if (!(sock.name in owner)) {
                        owner[sock.name] = new Vector3(data);
                    }
                    else {
                      owner[sock.name].load(data);
                    }
                    break;
                  case DataTypes.VEC4:
                    if (!(sock.name in owner)) {
                        owner[sock.name] = new Vector4(data);
                    }
                    else {
                      owner[sock.name].load(data);
                    }
                    break;
                  case DataTypes.MATRIX4:
                    if (!(sock.name in owner)) {
                        owner[sock.name] = new Matrix4(data);
                    }
                    else {
                      owner[sock.name].load(data);
                    }
                    break;
                  case DataTypes.ARRAY:
                    owner[sock.name] = data;
                    break;
                }
            }
        }
        owner.dag_exec(ctx, this);
    }
  }]);
  var $sarr_w8Ca_link=[0];
  var $darr_x8VU_link=[0];
  _es6_module.add_class(EventDag);
  EventDag = _es6_module.add_export('EventDag', EventDag);
  window.init_event_graph = function init_event_graph() {
    window.the_global_dag = new EventDag();
    _event_dag_idgen = new EIDGen();
  }
}, '/dev/fairmotion/src/core/eventdag.js');
es6_module_define('lib_utils', ["events", "toolprops_iter", "struct"], function _lib_utils_module(_es6_module) {
  "use strict";
  es6_import(_es6_module, 'events');
  es6_import(_es6_module, 'toolprops_iter');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var EventHandler=es6_import_item(_es6_module, 'events', 'EventHandler');
  var charmap=es6_import_item(_es6_module, 'events', 'charmap');
  var DBList=_ESClass("DBList", GArray, [function DBList(type) {
    GArray.call(this);
    this.type = type;
    this.idmap = {}
    this.selected = new GArray();
    this.active = undefined;
    this.length = 0;
    this.selset = new set();
  }, _ESClass.static(function fromSTRUCT(unpacker) {
    var dblist=new DBList(0);
    unpacker(dblist);
    var arr=dblist.arrdata;
    dblist.length = 0;
    for (var i=0; i<arr.length; i++) {
        GArray.prototype.push.call(dblist, arr[i]);
    }
    dblist.selected = new GArray(dblist.selected);
    delete dblist.arrdata;
    return dblist;
  }), function toJSON() {
    var list=[];
    var sellist=[];
    var __iter_block=__get_iter(this);
    var block;
    while (1) {
      var __ival_block=__iter_block.next();
      if (__ival_block.done) {
          break;
      }
      block = __ival_block.value;
      list.push(block.lib_id);
    }
    var __iter_block=__get_iter(this.selected);
    var block;
    while (1) {
      var __ival_block=__iter_block.next();
      if (__ival_block.done) {
          break;
      }
      block = __ival_block.value;
      sellist.push(block.lib_id);
    }
    var obj={list: list, selected: sellist, active: this.active!=undefined ? this.active.lib_id : -1, length: this.length, type: this.type}
    return obj;
  }, _ESClass.static(function fromJSON(obj) {
    var list=new DBList(obj.type);
    list.list = new GArray(obj.list);
    list.selected = new GArray(obj.selected);
    list.active = obj.active;
    list.length = obj.length;
  }), function clear_select() {
    var __iter_block=__get_iter(this.selected);
    var block;
    while (1) {
      var __ival_block=__iter_block.next();
      if (__ival_block.done) {
          break;
      }
      block = __ival_block.value;
      block.flag&=~SELECT;
    }
    this.selset = new set();
    this.selected = new GArray();
  }, function set_active(block) {
    if (block==undefined&&this.length>0) {
        console.trace();
        console.log("Undefined actives are illegal for DBLists, unless the list length is zero.");
        return ;
    }
    this.active = block;
  }, function select(block, do_select) {
    if (do_select==undefined) {
        do_select = true;
    }
    if (!(__instance_of(block, DataBlock))) {
        warntrace("WARNING: bad value ", block, " passed to DBList.select()");
        return ;
    }
    if (do_select) {
        block.flag|=SELECT;
        if (this.selset.has(block)) {
            return ;
        }
        this.selset.add(block);
        this.selected.push(block);
    }
    else {
      block.flag&=~SELECT;
      if (!this.selset.has(block)) {
          return ;
      }
      this.selset.remove(block);
      this.selected.remove(block);
    }
  }, function data_link(block, getblock, getblock_us) {
    for (var i=0; i<this.length; i++) {
        this[i] = getblock(this[i]);
        this.idmap[this[i].lib_id] = this[i];
    }
    var sel=this.selected;
    for (var i=0; i<sel.length; i++) {
        sel[i] = getblock(sel[i]);
        this.selset.add(sel[i]);
    }
    this.active = getblock(this.active);
  }, function push(block) {
    if (!(__instance_of(block, DataBlock))) {
        warntrace("WARNING: bad value ", block, " passed to DBList.select()");
        return ;
    }
    GArray.prototype.push.call(this, block);
    this.idmap[block.lib_id] = block;
    if (this.active==undefined) {
        this.active = block;
        this.select(block, true);
    }
  }, function remove(block) {
    var i=this.indexOf(block);
    if (i<0||i==undefined) {
        warn("WARNING: Could not remove block "+block.name+" from a DBList");
        return ;
    }
    this.pop(i);
  }, function pop(i) {
    if (i<0||i>=this.length) {
        warn("WARNING: Invalid argument ", i, " to static pop()");
        print_stack();
        return ;
    }
    var block=this[i];
    GArray.prototype.pop.call(this, i);
    delete this.idmap[block.lib_id];
    if (this.active==block) {
        this.select(block, false);
        this.active = this.length>0 ? this[0] : undefined;
    }
    if (this.selset.has(block)) {
        this.selected.remove(block);
        this.selset.remove(block);
    }
  }, function idget(id) {
    return this.idmap[id];
  }]);
  _es6_module.add_class(DBList);
  DBList.STRUCT = "\n  DBList {\n    type : int;\n    selected : array(dataref(DataBlock));\n    arrdata : array(dataref(DataBlock)) | obj;\n    active : dataref(DataBlock);\n  }\n";
  function DataArrayRem(dst, field, obj) {
    var array=dst[field];
    function rem() {
      array.remove(obj);
    }
    return rem;
  }
  function SceneObjRem(scene, obj) {
    function rem() {
      var __iter_e=__get_iter(obj.dag_node.inmap["parent"]);
      var e;
      while (1) {
        var __ival_e=__iter_e.next();
        if (__ival_e.done) {
            break;
        }
        e = __ival_e.value;
        var node=e.opposite(obj).node;
        if (__instance_of(node, ASObject))
          node.unparent(scene);
      }
      scene.objects.remove(obj);
      scene.graph.remove(obj);
      if (scene.active==obj)
        scene.active = scene.objects.length>0 ? scene.objects[0] : undefined;
      if (scene.selection.has(obj))
        scene.selection.remove(obj);
    }
    return rem;
  }
  function DataRem(dst, field) {
    function rem() {
      dst["field"] = undefined;
    }
    return rem;
  }
  function wrap_getblock_us(datalib) {
    return function(dataref, block, fieldname, add_user, refname, rem_func) {
      if (dataref==undefined)
        return ;
      if (rem_func==undefined)
        rem_func = DataRem(block, fieldname);
      if (refname==undefined)
        refname = fieldname;
      var id=dataref[0];
      if (id==-1) {
          return undefined;
      }
      else {
        var b=datalib.get(id);
        if (b!=undefined) {
            if (add_user)
              b.lib_adduser(block, refname, rem_func);
        }
        else {
          warntrace(["WARNING WARNING WARNING saved block reference isn't in database!!!", "  dataref: "].join("\n"), dataref);
        }
        return b;
      }
    }
  }
  wrap_getblock_us = _es6_module.add_export('wrap_getblock_us', wrap_getblock_us);
  function wrap_getblock(datalib) {
    return function(dataref) {
      if (dataref==undefined)
        return ;
      var id=dataref[0];
      if (id==-1) {
          return undefined;
      }
      else {
        var b=datalib.get(id);
        if (b!=undefined) {
        }
        else {
          warntrace(["WARNING WARNING WARNING saved block reference isn't in database!!!", "  dataref: "].join("\n"), dataref);
        }
        return b;
      }
    }
  }
  wrap_getblock = _es6_module.add_export('wrap_getblock', wrap_getblock);
  var DataRefList=_ESClass("DataRefList", GArray, [function DataRefList(lst) {
    if (lst==undefined) {
        lst = undefined;
    }
    GArray.call(this);
    this.datalib = undefined;
    if (lst==undefined)
      return ;
    if (__instance_of(lst, Array)) {
        for (var i=0; i<lst.length; i++) {
            if (lst[i]==undefined)
              continue;
            this.push(lst[i]);
        }
    }
    else 
      if (Symbol.iterator in lst) {
        var __iter_b=__get_iter(lst);
        var b;
        while (1) {
          var __ival_b=__iter_b.next();
          if (__ival_b.done) {
              break;
          }
          b = __ival_b.value;
          this.push(b);
        }
    }
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return new DataRefListIter(this, new Context());
  }), _ESClass.set(function ctx(ctx) {
    this.datalib = ctx.datalib;
  }), _ESClass.get(function ctx() {
    return undefined;
  }), function get(i, return_block) {
    if (return_block==undefined) {
        return_block = true;
    }
    if (return_block) {
        var dl=this.datalib!=undefined ? this.datalib : g_app_state.datalib;
        return dl.get(this[i]);
    }
    else {
      return this[i];
    }
  }, function push(b) {
    if (!(b = this._b(b)))
      return ;
    if (__instance_of(b, DataBlock))
      b = new DataRef(b);
    GArray.prototype.push.call(this, new DataRef(b));
  }, function _b(b) {
    if (b==undefined) {
        warntrace("WARNING: undefined passed to DataRefList.push()");
        return ;
    }
    if (__instance_of(b, DataBlock)) {
        return new DataRef(b);
    }
    else 
      if (__instance_of(b, DataRef)) {
        return b;
    }
    else {
      warntrace("WARNING: bad value ", b, " passed to DataRefList._b()");
    }
  }, function remove(b) {
    if (!(b = this._b(b)))
      return ;
    var i=this.indexOf(b);
    if (i<0) {
        warntrace("WARNING: ", b, " not found in this DataRefList");
        return ;
    }
    this.pop(i);
  }, function pop(i, return_block) {
    if (return_block==undefined) {
        return_block = true;
    }
    var ret=GArray.prototype.pop.call(this, i);
    if (return_block)
      ret = new Context().datalib.get(ret.id);
    return ret;
  }, function replace(a, b) {
    if (!(b = this._b(b)))
      return ;
    var i=this.indexOf(a);
    if (i<0) {
        warntrace("WARNING: ", b, " not found in this DataRefList");
        return ;
    }
    this[i] = b;
  }, function indexOf(b) {
    Array.indexOf.call(this, b);
    if (!(b = this._b(b)))
      return ;
    for (var i=0; i<this.length; i++) {
        if (this[i].id==b.id)
          return i;
    }
    return -1;
  }, function insert(index, b) {
    if (!(b = this._b(b)))
      return ;
    GArray.prototype.insert.call(this, b);
  }, function prepend(b) {
    if (!(b = this._b(b)))
      return ;
    GArray.prototype.prepend.call(this, b);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret={}
    reader(ret);
    return new DataRefList(ret.list);
  })]);
  _es6_module.add_class(DataRefList);
  mixin(DataRefList, TPropIterable);
  DataRefList.STRUCT = "\n  DataRefList {\n    list : array(i, dataref(DataBlock)) | this[i];\n  }\n";
}, '/dev/fairmotion/src/core/lib_utils.js');
es6_module_define('transdata', ["mathlib"], function _transdata_module(_es6_module) {
  "use strict";
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var TransDataItem=_ESClass("TransDataItem", [function TransDataItem(data, type, start_data) {
    this.data = data;
    this.start_data = start_data;
    this.type = type;
    this.w = 1;
    this.dis = -1;
  }]);
  _es6_module.add_class(TransDataItem);
  TransDataItem = _es6_module.add_export('TransDataItem', TransDataItem);
  var TransDataType=_ESClass("TransDataType", [_ESClass.static(function apply(ctx, td, item, mat, w) {
  }), _ESClass.static(function undo_pre(ctx, td, undo_obj) {
  }), _ESClass.static(function undo(ctx, undo_obj) {
  }), _ESClass.static(function update(ctx, td) {
  }), _ESClass.static(function calc_prop_distances(ctx, td, data) {
  }), _ESClass.static(function gen_data(ctx, td, data) {
  }), _ESClass.static(function calc_draw_aabb(Context, td, minmax) {
  }), _ESClass.static(function aabb(ctx, td, item, minmax, selected_only) {
  }), function TransDataType() {
  }]);
  _es6_module.add_class(TransDataType);
  TransDataType = _es6_module.add_export('TransDataType', TransDataType);
  TransDataType.selectmode = -1;
}, '/dev/fairmotion/src/editors/viewport/transdata.js');
es6_module_define('transform', ["spline_types", "native_api", "selectmode", "mathlib", "transdata", "toolprops", "multires_transdata", "dopesheet_transdata", "events", "toolops_api"], function _transform_module(_es6_module) {
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var SelMask=es6_import_item(_es6_module, 'selectmode', 'SelMask');
  var MResTransData=es6_import_item(_es6_module, 'multires_transdata', 'MResTransData');
  var Vec3Property=es6_import_item(_es6_module, 'toolprops', 'Vec3Property');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var EnumProperty=es6_import_item(_es6_module, 'toolprops', 'EnumProperty');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var TransDataItem=es6_import_item(_es6_module, 'transdata', 'TransDataItem');
  var TransDataType=es6_import_item(_es6_module, 'transdata', 'TransDataType');
  var TransDopeSheetType=es6_import_item(_es6_module, 'dopesheet_transdata', 'TransDopeSheetType');
  var KeyMap=es6_import_item(_es6_module, 'events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, 'events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, 'events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, 'events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, 'events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, 'events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, 'events', 'EventHandler');
  var clear_jobs=es6_import_item(_es6_module, 'native_api', 'clear_jobs');
  var clear_jobs_except_latest=es6_import_item(_es6_module, 'native_api', 'clear_jobs_except_latest');
  var clear_jobs_except_first=es6_import_item(_es6_module, 'native_api', 'clear_jobs_except_first');
  var JobTypes=es6_import_item(_es6_module, 'native_api', 'JobTypes');
  var _tsv_apply_tmp1=new Vector3();
  var _tsv_apply_tmp2=new Vector3();
  var post_mousemove_cachering=cachering.fromConstructor(Vector3, 64);
  var mousemove_cachering=cachering.fromConstructor(Vector3, 64);
  var TransSplineVert=_ESClass("TransSplineVert", [_ESClass.static(function apply(ctx, td, item, mat, w) {
    var co=_tsv_apply_tmp1;
    var v=item.data;
    if (w==0.0)
      return ;
    co.load(item.start_data);
    co[2] = 0.0;
    co.multVecMatrix(mat);
    v.load(co).sub(item.start_data).mulScalar(w).add(item.start_data);
    v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
    if (v.type==SplineTypes.HANDLE) {
        var seg=v.owning_segment;
        seg.update();
        seg.flag|=SplineFlags.FRAME_DIRTY;
        seg.v1.flag|=SplineFlags.UPDATE;
        seg.v2.flag|=SplineFlags.UPDATE;
        var hpair=seg.update_handle(v);
        if (hpair!=undefined) {
            hpair.flag|=SplineFlags.FRAME_DIRTY;
        }
    }
    else {
      for (var j=0; j<v.segments.length; j++) {
          v.segments[j].flag|=SplineFlags.FRAME_DIRTY;
          v.segments[j].h1.flag|=SplineFlags.FRAME_DIRTY;
          v.segments[j].h2.flag|=SplineFlags.FRAME_DIRTY;
          v.segments[j].update();
          var hpair=v.segments[j].update_handle(v.segments[j].handle(v));
          if (hpair!=undefined) {
              hpair.flag|=SplineFlags.FRAME_DIRTY;
          }
      }
    }
  }), _ESClass.static(function undo_pre(ctx, td, undo_obj) {
    var doneset=new set();
    var undo=[];
    function push_vert(v) {
      if (doneset.has(v))
        return ;
      doneset.add(v);
      undo.push(v.eid);
      undo.push(v[0]);
      undo.push(v[1]);
      undo.push(v[2]);
    }
    for (var i=0; i<td.data.length; i++) {
        var d=td.data[i];
        if (d.type!==TransSplineVert)
          continue;
        var v=d.data;
        if (v.type==SplineTypes.HANDLE) {
            if (v.hpair!=undefined) {
                push_vert(v.hpair);
            }
            if (v.owning_vertex!==undefined&&v.owning_vertex.segments.length==2) {
                var ov=v.owning_vertex;
                for (var j=0; j<ov.segments.length; j++) {
                    var s=ov.segments[j];
                    push_vert(s.h1);
                    push_vert(s.h2);
                }
            }
            else 
              if (v.owning_vertex===undefined) {
                console.warn("Orphaned handle!", v.eid, v);
            }
        }
        push_vert(v);
    }
    undo_obj['svert'] = undo;
  }), _ESClass.static(function undo(ctx, undo_obj) {
    var spline=ctx.spline;
    var i=0;
    var undo=undo_obj['svert'];
    var edit_all_layers=undo.edit_all_layers;
    while (i<undo.length) {
      var eid=undo[i++];
      var v=spline.eidmap[eid];
      if (v==undefined) {
          console.log("Transform undo error!", eid);
          i+=4;
          continue;
      }
      v[0] = undo[i++];
      v[1] = undo[i++];
      v[2] = undo[i++];
      if (v.type==SplineTypes.HANDLE&&!v.use) {
          var seg=v.segments[0];
          seg.update();
          seg.flag|=SplineFlags.FRAME_DIRTY;
          seg.v1.flag|=SplineFlags.UPDATE;
          seg.v2.flag|=SplineFlags.UPDATE;
      }
      else 
        if (v.type==SplineTypes.VERTEX) {
          v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
          for (var j=0; j<v.segments.length; j++) {
              v.segments[j].update();
              v.segments[j].flag|=SplineFlags.FRAME_DIRTY;
              v.segments[j].h1.flag|=SplineFlags.FRAME_DIRTY;
              v.segments[j].h2.flag|=SplineFlags.FRAME_DIRTY;
          }
      }
    }
    spline.resolve = 1;
  }), _ESClass.static(function update(ctx, td) {
    var spline=ctx.spline;
    spline.resolve = 1;
  }), _ESClass.static(function calc_prop_distances(ctx, td, data) {
    var doprop=td.doprop;
    var proprad=td.propradius;
    var spline=ctx.spline;
    var propfacs={}
    var shash=spline.build_shash();
    var tdmap={}
    var layer=td.layer;
    var edit_all_layers=td.edit_all_layers;
    var __iter_tv=__get_iter(data);
    var tv;
    while (1) {
      var __ival_tv=__iter_tv.next();
      if (__ival_tv.done) {
          break;
      }
      tv = __ival_tv.value;
      if (tv.type!==TransSplineVert)
        continue;
      tdmap[tv.data.eid] = tv;
    }
    var __iter_v=__get_iter(spline.verts.selected.editable(edit_all_layers));
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      shash.forEachPoint(v, proprad, function(v2, dis) {
        if (v2.flag&SplineFlags.SELECT)
          return ;
        if (v2.hidden)
          return ;
        if (!v2.in_layer(layer))
          return ;
        if (!(v2.eid in propfacs)) {
            propfacs[v2.eid] = dis;
        }
        propfacs[v2.eid] = Math.min(propfacs[v2.eid], dis);
        v2.flag|=SplineFlags.UPDATE;
      });
    }
    for (var k in propfacs) {
        var v=spline.eidmap[k];
        var d=propfacs[k];
        var tv=tdmap[k];
        tv.dis = d;
    }
  }), _ESClass.static(function gen_data(ctx, td, data) {
    var doprop=td.doprop;
    var proprad=td.propradius;
    var selmap={}
    var spline=ctx.spline;
    var tdmap={}
    var layer=td.layer;
    var edit_all_layers=td.edit_all_layers;
    for (var i=0; i<2; i++) {
        var __iter_v=__get_iter(i ? spline.handles.selected.editable(edit_all_layers) : spline.verts.selected.editable(edit_all_layers));
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          var co=new Vector3(v);
          if (i) {
              var ov=v.owning_segment.handle_vertex(v);
              if (ov!=undefined&&v.hidden&&ov.hidden)
                continue;
          }
          else 
            if (v.hidden) {
              continue;
          }
          selmap[v.eid] = 1;
          var td=new TransDataItem(v, TransSplineVert, co);
          data.push(td);
          tdmap[v.eid] = td;
        }
    }
    if (!doprop)
      return ;
    var propfacs={}
    var shash=spline.build_shash();
    for (var si=0; si<2; si++) {
        var list=si ? spline.handles : spline.verts;
        var __iter_v=__get_iter(list);
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          if (!edit_all_layers&&!v.in_layer(layer))
            continue;
          if (si) {
              var ov=v.owning_segment.handle_vertex(v);
              if (ov!=undefined&&v.hidden&&ov.hidden)
                continue;
          }
          else 
            if (v.hidden) {
              continue;
          }
          if (v.eid in selmap)
            continue;
          var co=new Vector3(v);
          var td=new TransDataItem(v, TransSplineVert, co);
          data.push(td);
          td.dis = 10000;
          tdmap[v.eid] = td;
        }
    }
    console.log("proprad", proprad);
    var __iter_v=__get_iter(spline.verts.selected.editable(edit_all_layers));
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      shash.forEachPoint(v, proprad, function(v2, dis) {
        if (v2.flag&SplineFlags.SELECT)
          return ;
        if (!edit_all_layers&&!v2.in_layer(layer))
          return ;
        if (v2.type==SplineTypes.HANDLE&&v2.hidden&&(v2.owning_vertex==undefined||v2.owning_vertex.hidden))
          return ;
        if (v2.type==SplineTypes.VERTEX&&v2.hidden)
          return ;
        if (!(v2.eid in propfacs)) {
            propfacs[v2.eid] = dis;
        }
        propfacs[v2.eid] = Math.min(propfacs[v2.eid], dis);
        v2.flag|=SplineFlags.UPDATE;
        for (var i=0; i<v2.segments.length; i++) {
            v2.segments[i].update();
        }
      });
    }
    for (var k in propfacs) {
        var v=spline.eidmap[k];
        var d=propfacs[k];
        var tv=tdmap[k];
        tv.dis = d;
    }
  }), _ESClass.static(function calc_draw_aabb(ctx, td, minmax) {
    var vset={}
    var sset={}
    var hset={}
    for (var i=0; i<td.data.length; i++) {
        var d=td.data[i];
        if (d.type!=TransSplineVert)
          continue;
        if (d.data.type==SplineTypes.HANDLE)
          hset[d.data.eid] = 1;
    }
    function rec_walk(v, depth) {
      if (depth>2)
        return ;
      if (v==undefined)
        return ;
      if (v.eid in vset)
        return ;
      vset[v.eid] = 1;
      minmax.minmax(v);
      for (var i=0; i<v.segments.length; i++) {
          var seg=v.segments[i];
          if (!(seg.eid in sset)) {
              sset[seg.eid] = 1;
              seg.update_aabb();
              minmax.minmax(seg._aabb[0]);
              minmax.minmax(seg._aabb[1]);
          }
          var v2=seg.other_vert(v);
          if (v2!=undefined&&(v2.flag&SplineFlags.SELECT))
            continue;
          if (v.type==SplineTypes.HANDLE&&!(v.eid in hset)) {
              vset[v.eid] = 1;
          }
          else {
            rec_walk(seg.other_vert(v), depth+1);
          }
      }
    }
    for (var i=0; i<td.data.length; i++) {
        var d=td.data[i];
        if (d.type!=TransSplineVert)
          continue;
        if (d.w<=0.0)
          continue;
        var v=d.data;
        if (v.eid in vset)
          continue;
        if (v.type==SplineTypes.HANDLE)
          v = v.owning_vertex;
        for (var j=0; j<v.segments.length; j++) {
            var seg=v.segments[j];
            if (!seg.l)
              continue;
            var _i1=0, l=seg.l;
            do {
              var faabb=l.f._aabb;
              minmax.minmax(faabb[0]);
              minmax.minmax(faabb[1]);
              if (_i1++>100) {
                  console.log("infinite loop!");
                  break;
              }
              l = l.radial_next;
            } while (l!=seg.l);
            
        }
        rec_walk(v, 0);
    }
  }), _ESClass.static(function aabb(ctx, td, item, minmax, selected_only) {
    var co=_tsv_apply_tmp2;
    if (item.w<=0.0)
      return ;
    if (item.data.hidden)
      return ;
    co.load(item.data);
    co[2] = 0.0;
    minmax.minmax(co);
    for (var i=0; i<item.data.segments.length; i++) {
        var seg=item.data.segments[i];
        if (selected_only&&!(item.data.flag&SplineFlags.SELECT))
          continue;
        seg.update_aabb();
        minmax.minmax(seg.aabb[0]);
        minmax.minmax(seg.aabb[1]);
    }
  }), function TransSplineVert() {
  }]);
  _es6_module.add_class(TransSplineVert);
  TransSplineVert = _es6_module.add_export('TransSplineVert', TransSplineVert);
  TransSplineVert.selectmode = SelMask.TOPOLOGY;
  var TransData=_ESClass("TransData", [function TransData(ctx, top, datamode) {
    this.ctx = ctx;
    this.top = top;
    this.datamode = datamode;
    this.edit_all_layers = top.inputs.edit_all_layers.data;
    this.layer = ctx.spline.layerset.active;
    this.types = top.types;
    this.data = new GArray();
    this.undodata = {}
    this.doprop = top.inputs.proportional.data;
    this.propradius = top.inputs.propradius.data;
    this.center = new Vector3();
    this.start_center = new Vector3();
    this.minmax = new MinMax(3);
    var __iter_t=__get_iter(this.types);
    var t;
    while (1) {
      var __ival_t=__iter_t.next();
      if (__ival_t.done) {
          break;
      }
      t = __ival_t.value;
      if (datamode&t.selectmode) {
          t.gen_data(ctx, this, this.data);
      }
    }
    if (this.doprop)
      this.calc_propweights();
    var __iter_d=__get_iter(this.data);
    var d;
    while (1) {
      var __ival_d=__iter_d.next();
      if (__ival_d.done) {
          break;
      }
      d = __ival_d.value;
      d.type.aabb(ctx, this, d, this.minmax, true);
    }
    if (top.inputs.use_pivot.data) {
        this.center.load(top.inputs.pivot.data);
    }
    else {
      this.center.load(this.minmax.max).add(this.minmax.min).mulScalar(0.5);
    }
    this.start_center.load(this.center);
    if (top.modal_running) {
        this.scenter = new Vector3(this.center);
        this.start_scenter = new Vector3(this.start_center);
        ctx.view2d.project(this.scenter);
        ctx.view2d.project(this.start_scenter);
    }
  }, function calc_propweights(radius) {
    if (radius==undefined) {
        radius = this.propradius;
    }
    this.propradius = radius;
    var __iter_t=__get_iter(this.types);
    var t;
    while (1) {
      var __ival_t=__iter_t.next();
      if (__ival_t.done) {
          break;
      }
      t = __ival_t.value;
      if (t.selectmode&this.datamode)
        t.calc_prop_distances(this.ctx, this, this.data);
    }
    var r=radius;
    var __iter_tv=__get_iter(this.data);
    var tv;
    while (1) {
      var __ival_tv=__iter_tv.next();
      if (__ival_tv.done) {
          break;
      }
      tv = __ival_tv.value;
      if (tv.dis==-1)
        continue;
      tv.w = tv.dis>r ? 0 : 1.0-tv.dis/r;
    }
  }]);
  _es6_module.add_class(TransData);
  TransData = _es6_module.add_export('TransData', TransData);
  var TransformOp=_ESClass("TransformOp", ToolOp, [function TransformOp(start_mpos, datamode) {
    ToolOp.call(this);
    this.types = new GArray([MResTransData, TransSplineVert]);
    this.first_viewport_redraw = true;
    if (start_mpos!=undefined&&typeof start_mpos!="number"&&__instance_of(start_mpos, Array)) {
        this.user_start_mpos = start_mpos;
    }
    if (datamode!=undefined)
      this.inputs.datamode.set_data(datamode);
    this.modaldata = {}
  }, _ESClass.static(function tooldef() {
    return {inputs: {data: new CollectionProperty([], [], "data", "data", "data", TPropFlags.COLL_LOOSE_TYPE), proportional: new BoolProperty(false, "proportional", "proportional mode"), propradius: new FloatProperty(80, "propradius", "prop radius"), datamode: new IntProperty(0, "datamode", "datamode"), edit_all_layers: new BoolProperty(false, "Edit all layers", "Edit all layers"), pivot: new Vec3Property(undefined, "pivot", "pivot", "pivot"), use_pivot: new BoolProperty(false, "use_pivot", "use pivot", "use pivot"), constraint_axis: new Vec3Property(undefined, "constraint_axis", "Constraint Axis", "Axis to constrain"), constrain: new BoolProperty(false, "constrain", "Enable Constraint", "Enable Constraint Axis")}}
  }), function ensure_transdata(ctx) {
    var selmode=this.inputs.datamode.data;
    if (this.transdata==undefined) {
        this.types = [];
        if (selmode&SelMask.MULTIRES)
          this.types.push(MResTransData);
        if (selmode&SelMask.TOPOLOGY)
          this.types.push(TransSplineVert);
        this.transdata = new TransData(ctx, this, this.inputs.datamode.data);
    }
    return this.transdata;
  }, function finish(ctx) {
    delete this.transdata;
    delete this.modaldata;
    ctx.frameset.on_ctx_update(ctx);
  }, function cancel() {
    var ctx=this.modal_ctx;
    this.end_modal();
    this.undo(ctx, true);
  }, function undo_pre(ctx) {
    var td=this.ensure_transdata(ctx);
    var undo=this._undo = {}
    undo.edit_all_layers = this.inputs.edit_all_layers.data;
    for (var i=0; i<this.types.length; i++) {
        this.types[i].undo_pre(ctx, td, undo);
    }
  }, function undo(ctx, suppress_ctx_update) {
    if (suppress_ctx_update==undefined) {
        suppress_ctx_update = false;
    }
    var undo=this._undo;
    for (var i=0; i<this.types.length; i++) {
        this.types[i].undo(ctx, undo);
    }
    if (!suppress_ctx_update) {
        ctx.frameset.on_ctx_update(ctx);
    }
    window.redraw_viewport();
  }, function end_modal() {
    var ctx=this.modal_ctx;
    this.post_mousemove(event, true);
    ctx.appstate.set_modalstate(0);
    ToolOp.prototype.end_modal.call(this);
    this.finish(ctx);
  }, function start_modal(ctx) {
    ToolOp.prototype.start_modal.call(this);
    this.first_viewport_redraw = true;
    ctx.appstate.set_modalstate(ModalStates.TRANSFORMING);
    this.ensure_transdata(ctx);
    this.modaldata = {}
  }, function on_mousemove(event) {
    var td=this.ensure_transdata(this.modal_ctx);
    var ctx=this.modal_ctx;
    var mpos=new Vector3([event.x, event.y, 0]);
    var md=this.modaldata;
    if (md.start_mpos==undefined&&this.user_start_mpos!=undefined) {
        md.start_mpos = new Vector3(this.user_start_mpos);
        md.start_mpos[2] = 0.0;
        md.last_mpos = new Vector3(md.start_mpos);
        md.mpos = new Vector3(md.start_mpos);
    }
    if (md.start_mpos==undefined) {
        md.start_mpos = new Vector3(mpos);
        md.mpos = new Vector3(mpos);
        md.last_mpos = new Vector3(mpos);
    }
    else {
      md.last_mpos.load(md.mpos);
      md.mpos.load(mpos);
    }
    this.draw_helper_lines(md, ctx);
  }, function post_mousemove(event, force_solve) {
    if (force_solve==undefined) {
        force_solve = false;
    }
    var td=this.transdata, view2d=this.modal_ctx.view2d;
    var md=this.modaldata, do_last=true;
    var min1=post_mousemove_cachering.next(), max1=post_mousemove_cachering.next();
    var min2=post_mousemove_cachering.next(), max2=post_mousemove_cachering.next();
    if (this.first_viewport_redraw) {
        md.draw_minmax = new MinMax(3);
        do_last = false;
    }
    var ctx=this.modal_ctx;
    var minmax=md.draw_minmax;
    min1.load(minmax.min);
    max1.load(minmax.max);
    minmax.reset();
    for (var i=0; i<td.types.length; i++) {
        td.types[i].calc_draw_aabb(ctx, td, minmax);
    }
    for (var i=0; i<2; i++) {
        minmax.min[i]-=20/view2d.zoom;
        minmax.max[i]+=20/view2d.zoom;
    }
    if (do_last) {
        for (var i=0; i<2; i++) {
            min2[i] = Math.min(min1[i], minmax.min[i]);
            max2[i] = Math.max(max1[i], minmax.max[i]);
        }
    }
    else {
      min2.load(minmax.min), max2.load(minmax.max);
    }
    var found=false;
    for (var i=0; i<this.types; i++) {
        if (this.types[i]==TransSplineVert) {
            found = true;
            break;
        }
    }
    var this2=this;
    if (ctx.spline.resolve==0) {
        if (force_solve&&!ctx.spline.solving) {
            redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);
        }
        else 
          if (force_solve) {
            ctx.spline._pending_solve.then(function() {
              redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);
            });
        }
        return ;
    }
    if (force_solve||!ctx.spline.solving) {
        ctx.spline.solve(undefined, undefined, force_solve).then(function() {
          redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);
        });
    }
  }, function draw_helper_lines(md, ctx) {
    this.reset_drawlines();
    if (this.inputs.proportional.data) {
        var rad=this.inputs.propradius.data;
        var steps=64, t=-Math.PI;
        dt = (Math.PI*2.0)/(steps-1);
        var td=this.transdata;
        var v1=new Vector3(), v2=new Vector3();
        var r=this.inputs.propradius.data;
        var cent=td.center;
        for (var i=0; i<steps-1; i++, t+=dt) {
            v1[0] = Math.sin(t)*r+cent[0];
            v1[1] = Math.cos(t)*r+cent[1];
            v2[0] = Math.sin(t+dt)*r+cent[0];
            v2[1] = Math.cos(t+dt)*r+cent[1];
            var dl=this.new_drawline(v1, v2);
            dl.clr[0] = dl.clr[1] = dl.clr[2] = 0.1;
            dl.clr[3] = 0.01;
            dl.width = 2;
        }
    }
  }, function on_keydown(event) {
    console.log(event.keyCode);
    var propdelta=15;
    switch (event.keyCode) {
      case 189:
        if (this.inputs.proportional.data) {
            this.inputs.propradius.set_data(this.inputs.propradius.data-propdelta);
            this.transdata.propradius = this.inputs.propradius.data;
            this.transdata.calc_propweights();
            this.modal_ctx.view2d.propradius = this.inputs.propradius.data;
            this.exec(this.modal_ctx);
            this.draw_helper_lines(this.modaldata, this.modal_ctx);
            window.redraw_viewport();
        }
        break;
      case 187:
        if (this.inputs.proportional.data) {
            this.inputs.propradius.set_data(this.inputs.propradius.data+propdelta);
            this.transdata.propradius = this.inputs.propradius.data;
            this.transdata.calc_propweights();
            this.modal_ctx.view2d.propradius = this.inputs.propradius.data;
            this.exec(this.modal_ctx);
            this.draw_helper_lines(this.modaldata, this.modal_ctx);
            window.redraw_viewport();
        }
        break;
    }
  }, function on_mouseup(event) {
    console.log("end transform!");
    this.end_modal();
  }, function update(ctx) {
    var __iter_t=__get_iter(this.transdata.types);
    var t;
    while (1) {
      var __ival_t=__iter_t.next();
      if (__ival_t.done) {
          break;
      }
      t = __ival_t.value;
      t.update(ctx, this.transdata);
    }
  }]);
  _es6_module.add_class(TransformOp);
  TransformOp = _es6_module.add_export('TransformOp', TransformOp);
  var TranslateOp=_ESClass("TranslateOp", TransformOp, [function TranslateOp(user_start_mpos, datamode) {
    TransformOp.call(this, user_start_mpos, datamode);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Translate", apiname: "spline.translate", description: "Move geometry around", is_modal: true, inputs: ToolOp.inherit({translation: new Vec3Property(undefined, "translation", "translation", "translation")})}
  }), function on_mousemove(event) {
    TransformOp.prototype.on_mousemove.call(this, event);
    var md=this.modaldata;
    var ctx=this.modal_ctx;
    var td=this.transdata;
    var start=mousemove_cachering.next(), off=mousemove_cachering.next();
    start.load(md.start_mpos);
    off.load(md.mpos);
    ctx.view2d.unproject(start);
    ctx.view2d.unproject(off);
    off.sub(start);
    this.inputs.translation.set_data(off);
    this.exec(ctx);
    this.post_mousemove(event);
  }, function exec(ctx) {
    var td=this.modal_running ? this.transdata : this.ensure_transdata(ctx);
    var mat=new Matrix4();
    var off=this.inputs.translation.data;
    mat.makeIdentity();
    mat.translate(off[0], off[1], 0);
    var __iter_d=__get_iter(td.data);
    var d;
    while (1) {
      var __ival_d=__iter_d.next();
      if (__ival_d.done) {
          break;
      }
      d = __ival_d.value;
      d.type.apply(ctx, td, d, mat, d.w);
    }
    this.update(ctx);
    if (!this.modal_running) {
        ctx.frameset.on_ctx_update(ctx);
        delete this.transdata;
    }
  }]);
  _es6_module.add_class(TranslateOp);
  TranslateOp = _es6_module.add_export('TranslateOp', TranslateOp);
  var NonUniformScaleOp=_ESClass("NonUniformScaleOp", TransformOp, [function NonUniformScaleOp(user_start_mpos, datamode) {
    TransformOp.call(this, user_start_mpos, datamode);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Non-Uniform Scale", apiname: "spline.nonuniform_scale", description: "Resize geometry", is_modal: true, inputs: ToolOp.inherit({scale: new Vec3Property(undefined, "scale", "scale", "scale")})}
  }), function on_mousemove(event) {
    TransformOp.prototype.on_mousemove.call(this, event);
    var md=this.modaldata;
    var ctx=this.modal_ctx;
    var td=this.transdata;
    var scale=mousemove_cachering.next();
    var off1=mousemove_cachering.next();
    var off2=mousemove_cachering.next();
    off1.load(md.mpos).sub(td.scenter).vectorLength();
    off2.load(md.start_mpos).sub(td.scenter).vectorLength();
    scale[0] = off1[0]!=off2[0]&&off2[0]!=0.0 ? off1[0]/off2[0] : 1.0;
    scale[1] = off1[1]!=off2[1]&&off2[1]!=0.0 ? off1[1]/off2[1] : 1.0;
    scale[2] = 1.0;
    this.inputs.scale.set_data(scale);
    this.exec(ctx);
    this.post_mousemove(event);
  }, function exec(ctx) {
    var td=this.modal_running ? this.transdata : this.ensure_transdata(ctx);
    var mat=new Matrix4();
    var scale=this.inputs.scale.data;
    var cent=td.center;
    mat.makeIdentity();
    if (this.inputs.constrain.data) {
        scale = new Vector3(scale);
        let caxis=this.inputs.constraint_axis.data;
        for (let i=0; i<3; i++) {
            scale[i]+=(1.0-scale[i])*(1.0-caxis[i]);
        }
    }
    mat.translate(cent[0], cent[1], 0);
    mat.scale(scale[0], scale[1], scale[2]);
    mat.translate(-cent[0], -cent[1], 0);
    var __iter_d=__get_iter(td.data);
    var d;
    while (1) {
      var __ival_d=__iter_d.next();
      if (__ival_d.done) {
          break;
      }
      d = __ival_d.value;
      d.type.apply(ctx, td, d, mat, d.w);
    }
    this.update(ctx);
    if (!this.modal_running) {
        ctx.frameset.on_ctx_update(ctx);
        delete this.transdata;
    }
  }]);
  _es6_module.add_class(NonUniformScaleOp);
  NonUniformScaleOp = _es6_module.add_export('NonUniformScaleOp', NonUniformScaleOp);
  var ScaleOp=_ESClass("ScaleOp", TransformOp, [function ScaleOp(user_start_mpos, datamode) {
    TransformOp.call(this, user_start_mpos, datamode);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Scale", apiname: "spline.scale", description: "Resize geometry", is_modal: true, inputs: ToolOp.inherit({scale: new Vec3Property(undefined, "scale", "scale", "scale")})}
  }), function on_mousemove(event) {
    TransformOp.prototype.on_mousemove.call(this, event);
    var md=this.modaldata;
    var ctx=this.modal_ctx;
    var td=this.transdata;
    var scale=mousemove_cachering.next();
    var off=mousemove_cachering.next();
    var l1=off.load(md.mpos).sub(td.scenter).vectorLength();
    var l2=off.load(md.start_mpos).sub(td.scenter).vectorLength();
    console.log(event.x, event.y);
    scale[0] = scale[1] = l1/l2;
    scale[2] = 1.0;
    this.inputs.scale.set_data(scale);
    this.exec(ctx);
    this.post_mousemove(event);
  }, function exec(ctx) {
    var td=this.modal_running ? this.transdata : this.ensure_transdata(ctx);
    var mat=new Matrix4();
    var scale=this.inputs.scale.data;
    var cent=td.center;
    mat.makeIdentity();
    if (this.inputs.constrain.data) {
        scale = new Vector3(scale);
        let caxis=this.inputs.constraint_axis.data;
        for (let i=0; i<3; i++) {
            scale[i]+=(1.0-scale[i])*(1.0-caxis[i]);
        }
    }
    mat.translate(cent[0], cent[1], 0);
    mat.scale(scale[0], scale[1], scale[2]);
    mat.translate(-cent[0], -cent[1], 0);
    var __iter_d=__get_iter(td.data);
    var d;
    while (1) {
      var __ival_d=__iter_d.next();
      if (__ival_d.done) {
          break;
      }
      d = __ival_d.value;
      d.type.apply(ctx, td, d, mat, d.w);
    }
    this.update(ctx);
    if (!this.modal_running) {
        ctx.frameset.on_ctx_update(ctx);
        delete this.transdata;
    }
  }]);
  _es6_module.add_class(ScaleOp);
  ScaleOp = _es6_module.add_export('ScaleOp', ScaleOp);
  var RotateOp=_ESClass("RotateOp", TransformOp, [function RotateOp(user_start_mpos, datamode) {
    this.angle_sum = 0.0;
    TransformOp.call(this, user_start_mpos, datamode, "rotate", "Rotate");
  }, _ESClass.static(function tooldef() {
    return {uiname: "Rotate", apiname: "spline.rotate", description: "Rotate geometry", is_modal: true, inputs: ToolOp.inherit({angle: new FloatProperty(undefined, "angle", "angle", "angle")})}
  }), function on_mousemove(event) {
    TransformOp.prototype.on_mousemove.call(this, event);
    var md=this.modaldata;
    var ctx=this.modal_ctx;
    var td=this.transdata;
    var off=mousemove_cachering.next();
    this.reset_drawlines();
    var l1=off.load(md.mpos).sub(td.scenter).vectorLength();
    var l2=off.load(md.start_mpos).sub(td.scenter).vectorLength();
    var dl=this.new_drawline(md.mpos, td.scenter);
    ctx.view2d.unproject(dl.v1), ctx.view2d.unproject(dl.v2);
    var angle=Math.atan2(md.start_mpos[0]-td.scenter[0], md.start_mpos[1]-td.scenter[1])-Math.atan2(md.mpos[0]-td.scenter[0], md.mpos[1]-td.scenter[1]);
    this.angle_sum+=angle;
    md.start_mpos.load(md.mpos);
    this.inputs.angle.set_data(this.angle_sum);
    this.exec(ctx);
    this.post_mousemove(event);
  }, function exec(ctx) {
    var td=this.modal_running ? this.transdata : this.ensure_transdata(ctx);
    var mat=new Matrix4();
    var cent=td.center;
    mat.makeIdentity();
    mat.translate(cent[0], cent[1], 0);
    mat.rotate(this.inputs.angle.data, 0, 0, 1);
    mat.translate(-cent[0], -cent[1], 0);
    var __iter_d=__get_iter(td.data);
    var d;
    while (1) {
      var __ival_d=__iter_d.next();
      if (__ival_d.done) {
          break;
      }
      d = __ival_d.value;
      d.type.apply(ctx, td, d, mat, d.w);
    }
    this.update(ctx);
    if (!this.modal_running) {
        ctx.frameset.on_ctx_update(ctx);
        delete this.transdata;
    }
  }]);
  _es6_module.add_class(RotateOp);
  RotateOp = _es6_module.add_export('RotateOp', RotateOp);
}, '/dev/fairmotion/src/editors/viewport/transform.js');
es6_module_define('transform_ops', ["native_api", "transform", "spline_types", "dopesheet_transdata", "events", "selectmode", "mathlib", "transdata", "toolops_api", "multires_transdata", "toolprops"], function _transform_ops_module(_es6_module) {
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var TransformOp=es6_import_item(_es6_module, 'transform', 'TransformOp');
  var ScaleOp=es6_import_item(_es6_module, 'transform', 'ScaleOp');
  var NonUniformScaleOp=es6_import_item(_es6_module, 'transform', 'NonUniformScaleOp');
  var SelMask=es6_import_item(_es6_module, 'selectmode', 'SelMask');
  var MResTransData=es6_import_item(_es6_module, 'multires_transdata', 'MResTransData');
  var Vec3Property=es6_import_item(_es6_module, 'toolprops', 'Vec3Property');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var TransDataItem=es6_import_item(_es6_module, 'transdata', 'TransDataItem');
  var TransDataType=es6_import_item(_es6_module, 'transdata', 'TransDataType');
  var TransDopeSheetType=es6_import_item(_es6_module, 'dopesheet_transdata', 'TransDopeSheetType');
  var KeyMap=es6_import_item(_es6_module, 'events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, 'events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, 'events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, 'events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, 'events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, 'events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, 'events', 'EventHandler');
  var clear_jobs=es6_import_item(_es6_module, 'native_api', 'clear_jobs');
  var clear_jobs_except_latest=es6_import_item(_es6_module, 'native_api', 'clear_jobs_except_latest');
  var clear_jobs_except_first=es6_import_item(_es6_module, 'native_api', 'clear_jobs_except_first');
  var JobTypes=es6_import_item(_es6_module, 'native_api', 'JobTypes');
  var WidgetResizeOp=_ESClass("WidgetResizeOp", TransformOp, [function WidgetResizeOp(user_start_mpos, datamode) {
    TransformOp.call(this, user_start_mpos, datamode);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Resize", apiname: "spline.widget_resize", description: "Resize geometry", is_modal: true, inputs: ToolOp.inherit({translation: new Vec2Property(), scale: new Vec2Property(), rotation: new FloatProperty(0.0), pivot: new Vec2Property()}), outputs: {}}
  }), _ESClass.static(function _get_bounds(minmax, spline, ctx) {
    var totsel=0;
    minmax.reset();
    var __iter_v=__get_iter(spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      minmax.minmax(v);
      totsel++;
    }
    if (ctx.view2d.selectmode&SelMask.HANDLE) {
        var __iter_h=__get_iter(spline.handles.selected.editable());
        var h;
        while (1) {
          var __ival_h=__iter_h.next();
          if (__ival_h.done) {
              break;
          }
          h = __ival_h.value;
          minmax.minmax(h);
          totsel++;
        }
    }
    var __iter_seg=__get_iter(spline.segments.selected.editable());
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      let aabb=seg.aabb;
      minmax.minmax(aabb[0]);
      minmax.minmax(aabb[1]);
    }
    return totsel;
  }), _ESClass.static(function create_widgets(manager, ctx) {
    var spline=ctx.spline;
    var minmax=new MinMax(2);
    let totsel=WidgetResizeOp._get_bounds(minmax, spline, ctx);
    if (totsel<2) {
        return ;
    }
    console.log(minmax.min, minmax.max);
    var cent=new Vector2(minmax.min).add(minmax.max).mulScalar(0.5);
    var widget=manager.create(this);
    var w=(minmax.max[0]-minmax.min[0])*0.5;
    var h=(minmax.max[1]-minmax.min[1])*0.5;
    var len=9;
    var outline=widget.outline([-w, -h], [w, h], "outline", [0.4, 0.4, 0.4, 0.7]);
    var larrow=widget.arrow([0, 0], [0, 0], "l", [0, 0, 0, 1.0]);
    var rarrow=widget.arrow([0, 0], [0, 0], "r", [0, 0, 0, 1.0]);
    var tarrow=widget.arrow([0, 0], [0, 0], "t", [0, 0, 0, 1.0]);
    var barrow=widget.arrow([0, 0], [0, 0], "b", [0, 0, 0, 1.0]);
    let corners=new Array(4);
    for (let i=0; i<4; i++) {
        corners[i] = widget.arrow([0, 0], [0, 0], i, [0, 0, 0, 1.0]);
    }
    let signs=[[-1, -1], [-1, 1], [1, 1], [1, -1]];
    let set_handles=function() {
      rarrow.v1[0] = w, rarrow.v1[1] = 0.0;
      rarrow.v2[0] = w+len, rarrow.v2[1] = 0.0;
      larrow.v1[0] = -w, larrow.v1[1] = 0.0;
      larrow.v2[0] = -w-len, larrow.v2[1] = 0.0;
      tarrow.v1[0] = 0, tarrow.v1[1] = h;
      tarrow.v2[0] = 0, tarrow.v2[1] = h+len;
      barrow.v1[0] = 0, barrow.v1[1] = -h;
      barrow.v2[0] = 0, barrow.v2[1] = -h-len;
      outline.v1[0] = -w, outline.v1[1] = -h;
      outline.v2[0] = w, outline.v2[1] = h;
      for (let i=0; i<4; i++) {
          let c=corners[i];
          c.v1[0] = w*signs[i][0], c.v1[1] = h*signs[i][1];
          c.v2[0] = (w+len)*signs[i][0], c.v2[1] = (h+len)*signs[i][1];
      }
    }
    set_handles();
    widget.co = new Vector2(cent);
    widget.on_tick = function(ctx) {
      var totsel=WidgetResizeOp._get_bounds(minmax, spline, ctx);
      var update=false;
      if (totsel<2) {
          this.hide();
          return ;
      }
      else {
        update = this.hidden;
        this.unhide();
      }
      var cx=(minmax.min[0]+minmax.max[0])*0.5;
      var cy=(minmax.min[1]+minmax.max[1])*0.5;
      var w2=(minmax.max[0]-minmax.min[0])*0.5;
      var h2=(minmax.max[1]-minmax.min[1])*0.5;
      update = update||cx!=this.co[0]||cy!=this.co[1];
      update = update||w2!=w||h2!=h;
      if (update) {
          w = w2, h = h2;
          this.co[0] = cx;
          this.co[1] = cy;
          set_handles();
          this.update();
      }
    }
    let corner_onclick=function(e, view2d, id) {
      console.log("id", id);
      let ci=id;
      let anchor=corners[(ci+2)%4];
      let co=new Vector3();
      co[0] = anchor.v1[0]+widget.co[0];
      co[1] = anchor.v1[1]+widget.co[1];
      let mpos=new Vector3([e.origX, e.origY, 0.0]);
      let toolop=e.ctrlKey ? new ScaleOp(mpos, view2d.selectmode) : new NonUniformScaleOp(mpos, view2d.selectmode);
      console.log("mpos", mpos[0], mpos[1]);
      toolop.inputs.use_pivot.set_data(true);
      toolop.inputs.pivot.set_data(co);
      view2d.ctx.toolstack.exec_tool(toolop);
      return true;
    }
    for (let i=0; i<4; i++) {
        corners[i].on_click = corner_onclick;
    }
    larrow.on_click = rarrow.on_click = function(e, view2d, id) {
      console.log("widget click!");
      let mpos=new Vector3([e.origX, e.origY, 0.0]);
      console.log("mpos", mpos[0], mpos[1]);
      let toolop=new ScaleOp(mpos, view2d.selectmode);
      let co=new Vector3(widget.co);
      if (!e.shiftKey) {
          co[0]+=id=='l' ? w : -w;
      }
      toolop.inputs.use_pivot.set_data(true);
      toolop.inputs.pivot.set_data(co);
      toolop.inputs.constrain.set_data(true);
      toolop.inputs.constraint_axis.set_data(new Vector3([1, 0, 0]));
      view2d.ctx.toolstack.exec_tool(toolop);
      return true;
    }
    tarrow.on_click = barrow.on_click = function(e, view2d, id) {
      console.log("widget click!");
      let mpos=new Vector3([e.origX, e.origY, 0.0]);
      console.log("mpos", mpos[0], mpos[1]);
      let toolop=new ScaleOp(mpos, view2d.selectmode);
      let co=new Vector3(widget.co);
      if (!e.shiftKey) {
          co[1]+=id=='b' ? h : -h;
      }
      toolop.inputs.use_pivot.set_data(true);
      toolop.inputs.pivot.set_data(co);
      toolop.inputs.constrain.set_data(true);
      toolop.inputs.constraint_axis.set_data(new Vector3([0, 1, 0]));
      view2d.ctx.toolstack.exec_tool(toolop);
      return true;
    }
    return widget;
  }), _ESClass.static(function reset_widgets(op, ctx) {
  })]);
  _es6_module.add_class(WidgetResizeOp);
  WidgetResizeOp = _es6_module.add_export('WidgetResizeOp', WidgetResizeOp);
  var WidgetRotateOp=_ESClass("WidgetRotateOp", TransformOp, [function WidgetRotateOp(user_start_mpos, datamode) {
    TransformOp.call(this, user_start_mpos, datamode);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Rotate", apiname: "spline.widget_rotate", description: "Rotate geometry", is_modal: true, inputs: ToolOp.inherit({translation: new Vec2Property(), scale: new Vec2Property(), rotation: new FloatProperty(0.0), pivot: new Vec2Property()}), outputs: {}}
  }), _ESClass.static(function _get_bounds(minmax, spline, ctx) {
    var totsel=0;
    minmax.reset();
    var __iter_v=__get_iter(spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      minmax.minmax(v);
      totsel++;
    }
    if (ctx.view2d.selectmode&SelMask.HANDLE) {
        var __iter_h=__get_iter(spline.handles.selected.editable());
        var h;
        while (1) {
          var __ival_h=__iter_h.next();
          if (__ival_h.done) {
              break;
          }
          h = __ival_h.value;
          minmax.minmax(h);
          totsel++;
        }
    }
    var __iter_seg=__get_iter(spline.segments.selected.editable());
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      let aabb=seg.aabb;
      minmax.minmax(aabb[0]);
      minmax.minmax(aabb[1]);
    }
    return totsel;
  }), _ESClass.static(function create_widgets(manager, ctx) {
    var spline=ctx.spline;
    var minmax=new MinMax(2);
    let totsel=WidgetResizeOp._get_bounds(minmax, spline, ctx);
    if (totsel<2) {
        return ;
    }
    console.log(minmax.min, minmax.max);
    var cent=new Vector2(minmax.min).add(minmax.max).mulScalar(0.5);
    var widget=manager.create(this);
    var w=(minmax.max[0]-minmax.min[0])*0.5;
    var h=(minmax.max[1]-minmax.min[1])*0.5;
    var len=9;
    if (w==0&h==0) {
        return ;
    }
    let r=Math.sqrt(w*w+h*h)*Math.sqrt(2)*0.5;
    let circle=widget.circle([0, 0], r, "rotate_circle", [0.4, 0.4, 0.4, 0.7]);
    widget.co = new Vector2(cent);
    widget.on_tick = function(ctx) {
      var totsel=WidgetResizeOp._get_bounds(minmax, spline, ctx);
      var update=false;
      if (totsel<2) {
          this.hide();
          return ;
      }
      else {
        update = this.hidden;
        this.unhide();
      }
      var cx=(minmax.min[0]+minmax.max[0])*0.5;
      var cy=(minmax.min[1]+minmax.max[1])*0.5;
      var w2=(minmax.max[0]-minmax.min[0])*0.5;
      var h2=(minmax.max[1]-minmax.min[1])*0.5;
      update = update||cx!=this.co[0]||cy!=this.co[1];
      update = update||w2!=w||h2!=h;
      if (update) {
          this.co[0] = cx;
          this.co[1] = cy;
          this.update();
      }
      return ;
      if (update) {
          w = w2, h = h2;
          this.co[0] = cx;
          this.co[1] = cy;
          set_handles();
          this.update();
      }
    }
    let corner_onclick=function(e, view2d, id) {
      console.log("id", id);
      let ci=id;
      let anchor=corners[(ci+2)%4];
      let co=new Vector3();
      co[0] = anchor.v1[0]+widget.co[0];
      co[1] = anchor.v1[1]+widget.co[1];
      let mpos=new Vector3([e.origX, e.origY, 0.0]);
      let toolop=e.ctrlKey ? new ScaleOp(mpos, view2d.selectmode) : new NonUniformScaleOp(mpos, view2d.selectmode);
      console.log("mpos", mpos[0], mpos[1]);
      toolop.inputs.use_pivot.set_data(true);
      toolop.inputs.pivot.set_data(co);
      view2d.ctx.toolstack.exec_tool(toolop);
      return true;
    }
    circle.on_click = function(e, view2d, id) {
      console.log("widget click!");
      let mpos=new Vector3([e.origX, e.origY, 0.0]);
      console.log("mpos", mpos[0], mpos[1]);
      let toolop=new ScaleOp(mpos, view2d.selectmode);
      let co=new Vector3(widget.co);
      if (!e.shiftKey) {
          co[1]+=id=='b' ? h : -h;
      }
      toolop.inputs.use_pivot.set_data(true);
      toolop.inputs.pivot.set_data(co);
      toolop.inputs.constrain.set_data(true);
      toolop.inputs.constraint_axis.set_data(new Vector3([0, 1, 0]));
      view2d.ctx.toolstack.exec_tool(toolop);
      return true;
    }
    return widget;
  }), _ESClass.static(function reset_widgets(op, ctx) {
  })]);
  _es6_module.add_class(WidgetRotateOp);
  WidgetRotateOp = _es6_module.add_export('WidgetRotateOp', WidgetRotateOp);
}, '/dev/fairmotion/src/editors/viewport/transform_ops.js');
es6_module_define('spline_selectops', ["toolprops", "spline_draw", "toolops_api", "spline_types", "animdata"], function _spline_selectops_module(_es6_module) {
  "use strict";
  var $_mh;
  var $_swapt;
  var PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var EnumProperty=es6_import_item(_es6_module, 'toolprops', 'EnumProperty');
  var StringProperty=es6_import_item(_es6_module, 'toolprops', 'StringProperty');
  var FlagProperty=es6_import_item(_es6_module, 'toolprops', 'FlagProperty');
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var SplineVertex=es6_import_item(_es6_module, 'spline_types', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, 'spline_types', 'SplineSegment');
  var SplineFace=es6_import_item(_es6_module, 'spline_types', 'SplineFace');
  var redraw_element=es6_import_item(_es6_module, 'spline_draw', 'redraw_element');
  var get_vtime=es6_import_item(_es6_module, 'animdata', 'get_vtime');
  var SelectOpBase=_ESClass("SelectOpBase", ToolOp, [function SelectOpBase(datamode, do_flush, uiname) {
    ToolOp.call(this, undefined, uiname);
    if (datamode!=undefined)
      this.inputs.datamode.set_data(datamode);
    if (do_flush!=undefined)
      this.inputs.flush.set_data(do_flush);
  }, _ESClass.static(function tooldef() {
    return {inputs: {mode: new IntProperty(0), datamode: new IntProperty(0), flush: new BoolProperty(false)}}
  }), function undo_pre(ctx) {
    var spline=ctx.spline;
    var ud=this._undo = [];
    var __iter_v=__get_iter(spline.verts.selected);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      ud.push(v.eid);
    }
    var __iter_h=__get_iter(spline.handles.selected);
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
      ud.push(h.eid);
    }
    var __iter_s=__get_iter(spline.segments.selected);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      ud.push(s.eid);
    }
    ud.active_vert = spline.verts.active!=undefined ? spline.verts.active.eid : -1;
    ud.active_handle = spline.handles.active!=undefined ? spline.handles.active.eid : -1;
    ud.active_segment = spline.segments.active!=undefined ? spline.segments.active.eid : -1;
    ud.active_face = spline.faces.active!=undefined ? spline.faces.active.eid : -1;
  }, function undo(ctx) {
    var ud=this._undo;
    var spline=ctx.spline;
    console.log(ctx, spline);
    spline.clear_selection();
    var eidmap=spline.eidmap;
    for (var i=0; i<ud.length; i++) {
        if (!(ud[i] in eidmap)) {
            console.trace("Warning, corruption in SelectOpBase.undo(): '", ud[i], "'.");
            continue;
        }
        var e=eidmap[ud[i]];
        spline.setselect(e, true);
    }
    spline.verts.active = eidmap[ud.active_vert];
    spline.handles.active = eidmap[ud.active_handle];
    spline.segments.active = eidmap[ud.active_segment];
    spline.faces.active = eidmap[ud.active_face];
  }]);
  _es6_module.add_class(SelectOpBase);
  SelectOpBase = _es6_module.add_export('SelectOpBase', SelectOpBase);
  var SelectOneOp=_ESClass("SelectOneOp", SelectOpBase, [function SelectOneOp(e, unique, mode, datamode, do_flush) {
    if (e==undefined) {
        e = undefined;
    }
    if (unique==undefined) {
        unique = true;
    }
    if (mode==undefined) {
        mode = true;
    }
    if (datamode==undefined) {
        datamode = 0;
    }
    if (do_flush==undefined) {
        do_flush = false;
    }
    SelectOpBase.call(this, datamode, do_flush, "Select Element");
    this.inputs.unique.set_data(unique);
    this.inputs.state.set_data(mode);
    if (e!=undefined)
      this.inputs.eid.set_data(e.eid);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Select Element", inputs: ToolOp.inherit({eid: new IntProperty(-1), state: new BoolProperty(true), set_active: new BoolProperty(true), unique: new BoolProperty(true)}), description: "Select Element"}
  }), function exec(ctx) {
    var spline=ctx.spline;
    var e=spline.eidmap[this.inputs.eid.data];
    if (e==undefined) {
        console.trace("Error in SelectOneOp", this.inputs.eid.data, this);
        return ;
    }
    var state=this.inputs.state.data;
    if (this.inputs.unique.data) {
        state = true;
        var __iter_e_0=__get_iter(spline.selected);
        var e_0;
        while (1) {
          var __ival_e_0=__iter_e_0.next();
          if (__ival_e_0.done) {
              break;
          }
          e_0 = __ival_e_0.value;
          redraw_element(e_0);
        }
        spline.clear_selection();
    }
    spline.setselect(e, state);
    if (state&&this.inputs.set_active.data) {
        spline.set_active(e);
    }
    if (this.inputs.flush.data) {
        console.log("flushing data!", this.inputs.datamode.data);
        spline.select_flush(this.inputs.datamode.data);
    }
    redraw_element(e);
  }]);
  _es6_module.add_class(SelectOneOp);
  SelectOneOp = _es6_module.add_export('SelectOneOp', SelectOneOp);
  var ToggleSelectAllOp=_ESClass("ToggleSelectAllOp", SelectOpBase, [function ToggleSelectAllOp() {
    SelectOpBase.call(this, undefined, undefined, "Toggle Select All");
  }, _ESClass.static(function tooldef() {
    return {uiname: "Toggle Select All", apiname: "spline.toggle_select_all", icon: Icons.TOGGLE_SEL_ALL, inputs: {mode: new EnumProperty("auto", ["select", "deselect", "auto"], "mode", "Mode", "mode")}}
  }), function undo_pre(ctx) {
    SelectOpBase.prototype.undo_pre.call(this, ctx);
    redraw_viewport();
  }, function exec(ctx) {
    console.log("toggle select!");
    var spline=ctx.spline;
    var mode=this.inputs.mode.data;
    var layerid=ctx.spline.layerset.active.id;
    var totsel=0.0;
    let iterctx=mode=="sub" ? {edit_all_layers: false} : ctx;
    if (mode=="auto") {
        var __iter_v=__get_iter(spline.verts.editable(iterctx));
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          totsel+=v.flag&SplineFlags.SELECT;
        }
        var __iter_s=__get_iter(spline.segments.editable(iterctx));
        var s;
        while (1) {
          var __ival_s=__iter_s.next();
          if (__ival_s.done) {
              break;
          }
          s = __ival_s.value;
          totsel+=s.flag&SplineFlags.SELECT;
        }
        var __iter_f=__get_iter(spline.faces.editable(iterctx));
        var f;
        while (1) {
          var __ival_f=__iter_f.next();
          if (__ival_f.done) {
              break;
          }
          f = __ival_f.value;
          totsel+=f.flag&SplineFlags.SELECT;
        }
        mode = totsel ? "sub" : "add";
    }
    if (mode=="sub")
      spline.verts.active = undefined;
    var __iter_v=__get_iter(spline.verts.editable(iterctx));
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      v.flag|=SplineFlags.REDRAW;
      if (mode=="sub") {
          spline.setselect(v, false);
      }
      else {
        spline.setselect(v, true);
      }
    }
    var __iter_s=__get_iter(spline.segments.editable(iterctx));
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      s.flag|=SplineFlags.REDRAW;
      if (mode=="sub") {
          spline.setselect(s, false);
      }
      else {
        spline.setselect(s, true);
      }
    }
    var __iter_f=__get_iter(spline.faces.editable(iterctx));
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      f.flag|=SplineFlags.REDRAW;
      if (mode=="sub") {
          spline.setselect(f, false);
      }
      else {
        spline.setselect(f, true);
      }
    }
  }]);
  _es6_module.add_class(ToggleSelectAllOp);
  ToggleSelectAllOp = _es6_module.add_export('ToggleSelectAllOp', ToggleSelectAllOp);
  var SelectLinkedOp=_ESClass("SelectLinkedOp", SelectOpBase, [function SelectLinkedOp(mode, datamode) {
    SelectOpBase.call(this, datamode);
    if (mode!=undefined)
      this.inputs.mode.set_data(mode);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Select Linked", apiname: "spline.select_linked", inputs: ToolOp.inherit({vertex_eid: new IntProperty(-1), mode: new EnumProperty("select", ["select", "deselect"], "mode", "Mode", "mode")})}
  }), function undo_pre(ctx) {
    SelectOpBase.prototype.undo_pre.call(this, ctx);
    window.redraw_viewport();
  }, function exec(ctx) {
    var spline=ctx.spline;
    var v=spline.eidmap[this.inputs.vertex_eid.data];
    if (v==undefined) {
        console.trace("Error in SelectLinkedOp");
        return ;
    }
    var state=this.inputs.mode.data=="select" ? 1 : 0;
    var visit=new set();
    var verts=spline.verts;
    function recurse(v) {
      visit.add(v);
      verts.setselect(v, state);
      for (var i=0; i<v.segments.length; i++) {
          var seg=v.segments[i], v2=seg.other_vert(v);
          if (!visit.has(v2)) {
              recurse(v2);
          }
      }
    }
    recurse(v);
    spline.select_flush(this.inputs.datamode.data);
  }]);
  _es6_module.add_class(SelectLinkedOp);
  SelectLinkedOp = _es6_module.add_export('SelectLinkedOp', SelectLinkedOp);
  var HideOp=_ESClass("HideOp", SelectOpBase, [function HideOp(mode, ghost) {
    SelectOpBase.call(this, undefined, undefined, "Hide");
    if (mode!=undefined)
      this.inputs.selmode.set_data(mode);
    if (ghost!=undefined)
      this.inputs.ghost.set_data(ghost);
  }, function undo_pre(ctx) {
    SelectOpBase.prototype.undo_pre.call(this, ctx);
    window.redraw_viewport();
  }, function undo(ctx) {
    var ud=this._undo;
    var spline=ctx.spline;
    for (var i=0; i<ud.length; i++) {
        var e=spline.eidmap[ud[i]];
        e.flag&=~(SplineFlags.HIDE|SplineFlags.GHOST);
    }
    SelectOpBase.prototype.undo.call(this, ctx);
    window.redraw_viewport();
  }, function exec(ctx) {
    var spline=ctx.spline;
    var mode=this.inputs.selmode.data;
    var ghost=this.inputs.ghost.data;
    var layer=spline.layerset.active;
    var __iter_elist=__get_iter(spline.elists);
    var elist;
    while (1) {
      var __ival_elist=__iter_elist.next();
      if (__ival_elist.done) {
          break;
      }
      elist = __ival_elist.value;
      if (!(elist.type&mode))
        continue;
      var __iter_e=__get_iter(elist.selected);
      var e;
      while (1) {
        var __ival_e=__iter_e.next();
        if (__ival_e.done) {
            break;
        }
        e = __ival_e.value;
        if (!(layer.id in e.layers))
          continue;
        e.sethide(true);
        if (ghost) {
            e.flag|=SplineFlags.GHOST;
        }
        elist.setselect(e, false);
      }
    }
    spline.clear_selection();
    spline.validate_active();
  }]);
  _es6_module.add_class(HideOp);
  HideOp = _es6_module.add_export('HideOp', HideOp);
  HideOp.inputs = {selmode: new IntProperty(1|2), ghost: new BoolProperty(false)}
  var UnhideOp=_ESClass("UnhideOp", ToolOp, [function UnhideOp(mode, ghost) {
    ToolOp.call(this, undefined, "Unhide");
    if (mode!=undefined)
      this.inputs.selmode.set_data(mode);
    if (ghost!=undefined)
      this.inputs.ghost.set_data(ghost);
    this._undo = undefined;
  }, function undo_pre(ctx) {
    var ud=this._undo = [];
    var spline=ctx.spline;
    var __iter_elist=__get_iter(spline.elists);
    var elist;
    while (1) {
      var __ival_elist=__iter_elist.next();
      if (__ival_elist.done) {
          break;
      }
      elist = __ival_elist.value;
      var __iter_e=__get_iter(elist);
      var e;
      while (1) {
        var __ival_e=__iter_e.next();
        if (__ival_e.done) {
            break;
        }
        e = __ival_e.value;
        if (e.flag&SplineFlags.HIDE) {
            ud.push(e.eid);
            ud.push(e.flag&(SplineFlags.SELECT|SplineFlags.HIDE|SplineFlags.GHOST));
        }
      }
    }
    window.redraw_viewport();
  }, function undo(ctx) {
    var ud=this._undo;
    var spline=ctx.spline;
    var i=0;
    while (i<ud.length) {
      var e=spline.eidmap[ud[i++]];
      var flag=ud[i++];
      e.flag|=flag;
      if (flag&SplineFlags.SELECT)
        spline.setselect(e, selstate);
    }
    window.redraw_viewport();
  }, function exec(ctx) {
    var spline=ctx.spline;
    var layer=spline.layerset.active;
    var mode=this.inputs.selmode.data;
    var ghost=this.inputs.ghost.data;
    console.log("mode!", mode);
    var __iter_elist=__get_iter(spline.elists);
    var elist;
    while (1) {
      var __ival_elist=__iter_elist.next();
      if (__ival_elist.done) {
          break;
      }
      elist = __ival_elist.value;
      if (!(mode&elist.type))
        continue;
      var __iter_e=__get_iter(elist);
      var e;
      while (1) {
        var __ival_e=__iter_e.next();
        if (__ival_e.done) {
            break;
        }
        e = __ival_e.value;
        if (!(layer.id in e.layers))
          continue;
        if (!ghost&&(e.flag&SplineFlags.GHOST))
          continue;
        var was_hidden=e.flag&SplineFlags.HIDE;
        e.flag&=~(SplineFlags.HIDE|SplineFlags.GHOST);
        e.sethide(false);
        if (was_hidden)
          spline.setselect(e, true);
      }
    }
  }]);
  _es6_module.add_class(UnhideOp);
  UnhideOp = _es6_module.add_export('UnhideOp', UnhideOp);
  UnhideOp.inputs = {selmode: new IntProperty(1|2), ghost: new BoolProperty(false)}
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var ElementRefSet=es6_import_item(_es6_module, 'spline_types', 'ElementRefSet');
  var _last_radius=45;
  var CircleSelectOp=_ESClass("CircleSelectOp", SelectOpBase, [function CircleSelectOp(datamode, do_flush) {
    if (do_flush==undefined) {
        do_flush = true;
    }
    SelectOpBase.call(this, datamode, do_flush, "Circle Select");
    if (isNaN(_last_radius)||_last_radius<=0)
      _last_radius = 45;
    this.mpos = new Vector3();
    this.mdown = false;
    this.sel_or_unsel = true;
    this.radius = _last_radius;
  }, _ESClass.static(function tooldef() {
    return {apiname: "circle_select", uiname: "Circle Select", inputs: ToolOp.inherit({add_elements: new CollectionProperty(new ElementRefSet(SplineTypes.ALL), [SplineVertex, SplineSegment, SplineFace], "elements", "Elements", "Elements"), sub_elements: new CollectionProperty(new ElementRefSet(SplineTypes.ALL), [SplineVertex, SplineSegment, SplineFace], "elements", "Elements", "Elements")}), outputs: ToolOp.inherit({}), icon: Icons.CIRCLE_SEL, is_modal: true, description: "Select in a circle.\nRight click to deselect."}
  }), function start_modal(ctx) {
    this.radius = _last_radius;
    var mpos=ctx.view2d.mpos;
    if (mpos!=undefined)
      this.on_mousemove({x: mpos[0], y: mpos[1]});
  }, function _draw_circle() {
    var ctx=this.modal_ctx;
    var editor=ctx.view2d;
    this.reset_drawlines();
    var steps=64;
    var t=-Math.PI, dt=(Math.PI*2.0)/steps;
    var lastco=new Vector3();
    var co=new Vector3();
    var mpos=this.mpos;
    var radius=this.radius;
    for (var i=0; i<steps; i++, t+=dt) {
        co[0] = sin(t)*radius+mpos[0];
        co[1] = cos(t)*radius+mpos[1];
        editor.unproject(co);
        if (i>0) {
            var dl=this.new_drawline(lastco, co);
        }
        lastco.load(co);
    }
    window.redraw_viewport();
  }, function exec(ctx) {
    var spline=ctx.spline;
    var eset_add=this.inputs.add_elements;
    var eset_sub=this.inputs.sub_elements;
    eset_add.ctx = ctx;
    eset_sub.ctx = ctx;
    eset_add.data.ctx = ctx;
    eset_sub.data.ctx = ctx;
    console.log("exec!");
    var __iter_e=__get_iter(eset_add);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      spline.setselect(e, true);
    }
    var __iter_e=__get_iter(eset_sub);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      spline.setselect(e, false);
    }
    if (this.inputs.flush.data) {
        spline.select_flush(this.inputs.datamode.data);
    }
  }, function do_sel(sel_or_unsel) {
    var datamode=this.inputs.datamode.data;
    var ctx=this.modal_ctx, spline=ctx.spline;
    var editor=ctx.view2d;
    var co=new Vector3();
    var eset_add=this.inputs.add_elements.data;
    var eset_sub=this.inputs.sub_elements.data;
    var actlayer=spline.layerset.active.id;
    if (datamode&SplineTypes.VERTEX) {
        var __iter_v=__get_iter(spline.verts);
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          if (v.hidden)
            continue;
          if (!(actlayer in v.layers))
            continue;
          co.load(v);
          editor.project(co);
          if (co.vectorDistance(this.mpos)<this.radius) {
              if (sel_or_unsel) {
                  eset_sub.remove(v);
                  eset_add.add(v);
              }
              else {
                eset_add.remove(v);
                eset_sub.add(v);
              }
          }
        }
    }
    else 
      if (datamode&SplineTypes.SEGMENT) {
    }
    else 
      if (datamode&SplineTypes.FACE) {
    }
  }, function on_mousemove(event) {
    var ctx=this.modal_ctx;
    var spline=ctx.spline;
    var editor=ctx.view2d;
    this.mpos[0] = event.x;
    this.mpos[1] = event.y;
    this._draw_circle();
    if (this.mdown) {
        this.do_sel(this.sel_or_unsel);
    }
    this.exec(ctx);
  }, function end_modal(ctx) {
    SelectOpBase.prototype.end_modal.call(this, ctx);
    _last_radius = this.radius;
  }, function on_keydown(event) {
    console.log(event.keyCode);
    var ctx=this.modal_ctx;
    var spline=ctx.spline;
    var view2d=ctx.view2d;
    var radius_inc=10;
    switch (event.keyCode) {
      case charmap["="]:
      case charmap["NumPlus"]:
        this.radius+=radius_inc;
        this._draw_circle();
        break;
      case charmap["-"]:
      case charmap["NumMinus"]:
        this.radius-=radius_inc;
        this._draw_circle();
        break;
    }
  }, function on_mousedown(event) {
    if (event.button==0) {
        this.sel_or_unsel = true;
        this.mdown = true;
    }
    else {
      this.sel_or_unsel = false;
      this.mdown = true;
    }
  }, function on_mouseup(event) {
    console.log("modal end!");
    this.mdown = false;
    this.end_modal();
  }]);
  _es6_module.add_class(CircleSelectOp);
  CircleSelectOp = _es6_module.add_export('CircleSelectOp', CircleSelectOp);
}, '/dev/fairmotion/src/editors/viewport/spline_selectops.js');
es6_module_define('spline_createops', ["spline_types", "spline", "toolprops", "spline_editops", "toolops_api"], function _spline_createops_module(_es6_module) {
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var EnumProperty=es6_import_item(_es6_module, 'toolprops', 'EnumProperty');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var Vec3Property=es6_import_item(_es6_module, 'toolprops', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, 'toolprops', 'Vec4Property');
  var StringProperty=es6_import_item(_es6_module, 'toolprops', 'StringProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var RestrictFlags=es6_import_item(_es6_module, 'spline', 'RestrictFlags');
  var SplineLocalToolOp=es6_import_item(_es6_module, 'spline_editops', 'SplineLocalToolOp');
  var ExtrudeModes={SMOOTH: 0, LESS_SMOOTH: 1, BROKEN: 2}
  ExtrudeModes = _es6_module.add_export('ExtrudeModes', ExtrudeModes);
  var ExtrudeVertOp=_ESClass("ExtrudeVertOp", SplineLocalToolOp, [function ExtrudeVertOp(co, mode) {
    SplineLocalToolOp.call(this);
    if (co!=undefined)
      this.inputs.location.set_data(co);
    if (mode!=undefined) {
        this.inputs.mode.set_data(mode);
    }
  }, _ESClass.static(function tooldef() {
    return {uiname: "Extrude Path", apiname: "spline.extrude_verts", inputs: {location: new Vec3Property(undefined, "location", "location"), linewidth: new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500]), mode: new EnumProperty(ExtrudeModes.SMOOTH, ExtrudeModes, "extrude_mode", "Smooth Mode"), stroke: new Vec4Property([0, 0, 0, 1])}, outputs: {vertex: new IntProperty(-1, "vertex", "vertex", "new vertex")}, icon: -1, is_modal: false, description: "Add points to path"}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_EXTRUDE);
  }, function exec(ctx) {
    console.log("Extrude vertex op");
    var spline=ctx.spline;
    var layer=spline.layerset.active;
    var max_z=1;
    var __iter_f=__get_iter(spline.faces);
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      if (!(layer.id in f.layers))
        continue;
      max_z = Math.max(f.z, max_z);
    }
    var max_z_seg=max_z+1;
    var __iter_s=__get_iter(spline.segments);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      if (!(layer.id in s.layers))
        continue;
      max_z_seg = Math.max(max_z_seg, s.z);
    }
    var co=this.inputs.location.data;
    var actvert=spline.verts.active;
    for (var i=0; i<spline.verts.length; i++) {
        var v=spline.verts[i];
        spline.verts.setselect(v, false);
    }
    var start_eid=spline.idgen.cur_id;
    var v=spline.make_vertex(co);
    var smode=this.inputs.mode.get_value();
    if (smode==ExtrudeModes.LESS_SMOOTH)
      v.flag|=SplineFlags.BREAK_CURVATURES;
    else 
      if (smode==ExtrudeModes.BROKEN)
      v.flag|=SplineFlags.BREAK_TANGENTS;
    this.outputs.vertex.set_data(v.eid);
    spline.verts.setselect(v, true);
    if (actvert!==v&&actvert!=undefined&&!actvert.hidden&&!((spline.restrict&RestrictFlags.VALENCE2)&&actvert.segments.length>=2)) {
        if (actvert.segments.length==2) {
            var v2=actvert;
            var h1=v2.segments[0].handle(v2), h2=v2.segments[1].handle(v2);
            spline.connect_handles(h1, h2);
            h1.flag|=SplineFlags.AUTO_PAIRED_HANDLE;
            h2.flag|=SplineFlags.AUTO_PAIRED_HANDLE;
            h1.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
            h2.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
        }
        var seg=spline.make_segment(actvert, v);
        seg.z = max_z_seg;
        console.log("creating segment");
        if (actvert.segments.length>1) {
            var seg2=actvert.segments[0];
            seg.mat.load(seg2.mat);
        }
        else {
          seg.mat.linewidth = this.inputs.linewidth.data;
          var color=this.inputs.stroke.data;
          for (var i=0; i<4; i++) {
              seg.mat.strokecolor[i] = color[i];
          }
        }
        v.flag|=SplineFlags.UPDATE;
        actvert.flag|=SplineFlags.UPDATE;
    }
    spline.verts.active = v;
    spline.regen_render();
  }]);
  _es6_module.add_class(ExtrudeVertOp);
  ExtrudeVertOp = _es6_module.add_export('ExtrudeVertOp', ExtrudeVertOp);
  var CreateEdgeOp=_ESClass("CreateEdgeOp", SplineLocalToolOp, [function CreateEdgeOp(linewidth) {
    SplineLocalToolOp.call(this);
    if (linewidth!=undefined)
      this.inputs.linewidth.set_data(linewidth);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Make Segment", apiname: "spline.make_edge", inputs: {linewidth: new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500])}, outputs: {}, icon: Icons.MAKE_SEGMENT, is_modal: false, description: "Create segment between two selected points"}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_CONNECT);
  }, function exec(ctx) {
    console.log("create edge op!");
    var spline=ctx.spline;
    var sels=[];
    var max_z=1;
    var __iter_f=__get_iter(spline.faces);
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      max_z = Math.max(f.z, max_z);
    }
    var max_z_seg=max_z+1;
    var __iter_s=__get_iter(spline.segments);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      max_z_seg = Math.max(max_z_seg, s.z);
    }
    for (var i=0; i<spline.verts.length; i++) {
        var v=spline.verts[i];
        if (v.hidden)
          continue;
        if (!(v.flag&SplineFlags.SELECT))
          continue;
        sels.push(v);
    }
    if (sels.length!=2)
      return ;
    sels[0].flag|=SplineFlags.UPDATE;
    sels[1].flag|=SplineFlags.UPDATE;
    var seg=spline.make_segment(sels[0], sels[1]);
    seg.z = max_z_seg;
    seg.mat.linewidth = this.inputs.linewidth.data;
    spline.regen_render();
  }]);
  _es6_module.add_class(CreateEdgeOp);
  CreateEdgeOp = _es6_module.add_export('CreateEdgeOp', CreateEdgeOp);
  var CreateEdgeFaceOp=_ESClass("CreateEdgeFaceOp", SplineLocalToolOp, [function CreateEdgeFaceOp(linewidth) {
    SplineLocalToolOp.call(this);
    if (linewidth!=undefined)
      this.inputs.linewidth.set_data(linewidth);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Make Polygon", apiname: "spline.make_edge_face", inputs: {linewidth: new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500])}, outputs: {}, icon: Icons.MAKE_POLYGON, is_modal: false, description: "Create polygon from selected points"}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_CONNECT);
  }, function exec(ctx) {
    console.log("create edge op!");
    var spline=ctx.spline;
    var layer=spline.layerset.active;
    var sels=[];
    var max_z=1;
    var __iter_f=__get_iter(spline.faces);
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      if (!(layer.id in f.layers))
        continue;
      max_z = Math.max(f.z, max_z);
    }
    var max_z_seg=max_z+1;
    var __iter_s=__get_iter(spline.segments);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      if (!(layer.id in s.layers))
        continue;
      max_z_seg = Math.max(max_z_seg, s.z);
    }
    var vs=[];
    var valmap={}
    var vset=new set();
    var doneset=new set();
    function walk(v) {
      var stack=[v];
      var path=[];
      if (doneset.has(v))
        return path;
      if (!vset.has(v))
        return path;
      while (stack.length>0) {
        var v=stack.pop();
        if (doneset.has(v))
          break;
        path.push(v);
        doneset.add(v);
        if (valmap[v.eid]>2)
          break;
        for (var i=0; i<v.segments.length; i++) {
            var v2=v.segments[i].other_vert(v);
            if (!doneset.has(v2)&&vset.has(v2)) {
                stack.push(v2);
            }
        }
      }
      return path;
    }
    var __iter_v=__get_iter(spline.verts.selected);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      if (v.hidden)
        continue;
      v.flag|=SplineFlags.UPDATE;
      vs.push(v);
      vset.add(v);
    }
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      var valence=0;
      console.log("============", v);
      for (var i=0; i<v.segments.length; i++) {
          var v2=v.segments[i].other_vert(v);
          console.log(v.eid, v2.segments[0].v1.eid, v2.segments[0].v2.eid);
          if (vset.has(v2))
            valence++;
      }
      valmap[v.eid] = valence;
    }
    console.log("VS.LENGTH", vs.length);
    if (vs.length==2) {
        var v=vs[0].segments.length>0 ? vs[0] : vs[1];
        var seg2=v.segments.length>0 ? v.segments[0] : undefined;
        var e=spline.make_segment(vs[0], vs[1]);
        if (seg2!=undefined) {
            e.mat.load(seg2.mat);
        }
        else {
          e.mat.linewidth = this.inputs.linewidth.data;
        }
        e.z = max_z_seg;
        spline.regen_render();
        return ;
    }
    else 
      if (vs.length==3) {
        var f=spline.make_face([vs]);
        f.z = max_z+1;
        max_z++;
        spline.regen_sort();
        spline.faces.setselect(f, true);
        spline.set_active(f);
        spline.regen_render();
        return ;
    }
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      if (valmap[v.eid]!=1)
        continue;
      var path=walk(v);
      if (path.length>2) {
          var f=spline.make_face([path]);
          f.z = max_z+1;
          max_z++;
          spline.regen_sort();
          spline.faces.setselect(f, true);
          spline.set_active(f);
          spline.regen_render();
      }
    }
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      var path=walk(v);
      if (path.length>2) {
          var f=spline.make_face([path]);
          f.z = max_z+1;
          max_z++;
          spline.regen_sort();
          spline.faces.setselect(f, true);
          spline.set_active(f);
          spline.regen_render();
      }
    }
    spline.regen_render();
  }]);
  _es6_module.add_class(CreateEdgeFaceOp);
  CreateEdgeFaceOp = _es6_module.add_export('CreateEdgeFaceOp', CreateEdgeFaceOp);
  var ImportJSONOp=_ESClass("ImportJSONOp", ToolOp, [function ImportJSONOp(str) {
    ToolOp.call(this);
    if (str!=undefined) {
        this.inputs.strdata.set_data(str);
    }
  }, _ESClass.static(function tooldef() {
    return {uiname: "Import Old JSON", apiname: "editor.import_old_json", inputs: {strdata: new StringProperty("", "JSON", "JSON", "JSON string data")}, outputs: {}, icon: -1, is_modal: false, description: "Import old json files"}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_CONNECT);
  }, function exec(ctx) {
    console.log("import json spline op!");
    var spline=ctx.spline;
    var obj=JSON.parse(this.inputs.strdata.data);
    spline.import_json(obj);
    spline.regen_render();
  }]);
  _es6_module.add_class(ImportJSONOp);
  ImportJSONOp = _es6_module.add_export('ImportJSONOp', ImportJSONOp);
}, '/dev/fairmotion/src/editors/viewport/spline_createops.js');
es6_module_define('spline_editops', ["toolops_api", "spline_types", "spline", "../../curve/spline_base", "animdata", "struct", "spline_draw", "toolprops", "frameset"], function _spline_editops_module(_es6_module) {
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var StringProperty=es6_import_item(_es6_module, 'toolprops', 'StringProperty');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var RecalcFlags=es6_import_item(_es6_module, 'spline_types', 'RecalcFlags');
  var RestrictFlags=es6_import_item(_es6_module, 'spline', 'RestrictFlags');
  var Spline=es6_import_item(_es6_module, 'spline', 'Spline');
  var VDAnimFlags=es6_import_item(_es6_module, 'frameset', 'VDAnimFlags');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  es6_import(_es6_module, 'struct');
  var redo_draw_sort=es6_import_item(_es6_module, 'spline_draw', 'redo_draw_sort');
  var KeyCurrentFrame=_ESClass("KeyCurrentFrame", ToolOp, [function KeyCurrentFrame() {
    ToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {apiname: "spline.key_current_frame", uiname: "Key Selected", inputs: {}, outputs: {}, icon: -1, is_modal: false}
  }), function exec(ctx) {
    var __iter_v=__get_iter(ctx.frameset.spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      v.flag|=SplineFlags.FRAME_DIRTY;
    }
    ctx.frameset.update_frame();
    ctx.frameset.pathspline.resolve = 1;
    ctx.frameset.pathspline.regen_sort();
    ctx.frameset.pathspline.solve();
  }]);
  _es6_module.add_class(KeyCurrentFrame);
  KeyCurrentFrame = _es6_module.add_export('KeyCurrentFrame', KeyCurrentFrame);
  var ShiftLayerOrderOp=_ESClass("ShiftLayerOrderOp", ToolOp, [function ShiftLayerOrderOp(layer_id, off) {
    ToolOp.call(this);
    if (layer_id!=undefined) {
        this.inputs.layer_id.set_data(layer_id);
    }
    if (off!=undefined) {
        this.inputs.off.set_data(off);
    }
  }, _ESClass.static(function tooldef() {
    return {uiname: "Shift Layer Order", apiname: "spline.shift_layer_order", inputs: {layer_id: new IntProperty(0), off: new IntProperty(1)}, outputs: {}, icon: -1, is_modal: false}
  }), function exec(ctx) {
    var spline=ctx.spline;
    var layer=this.inputs.layer_id.data;
    layer = spline.layerset.idmap[layer];
    if (layer==undefined)
      return ;
    var off=this.inputs.off.data;
    spline.layerset.change_layer_order(layer, layer.order+off);
    spline.regen_sort();
  }]);
  _es6_module.add_class(ShiftLayerOrderOp);
  ShiftLayerOrderOp = _es6_module.add_export('ShiftLayerOrderOp', ShiftLayerOrderOp);
  var SplineGlobalToolOp=_ESClass("SplineGlobalToolOp", ToolOp, [function SplineGlobalToolOp(apiname, uiname, description, icon) {
    ToolOp.call(this, apiname, uiname, description, icon);
  }]);
  _es6_module.add_class(SplineGlobalToolOp);
  SplineGlobalToolOp = _es6_module.add_export('SplineGlobalToolOp', SplineGlobalToolOp);
  var SplineLocalToolOp=_ESClass("SplineLocalToolOp", ToolOp, [function SplineLocalToolOp(apiname, uiname, description, icon) {
    ToolOp.call(this, apiname, uiname, description, icon);
  }, function undo_pre(ctx) {
    var spline=ctx.spline;
    var data=[];
    istruct.write_object(data, spline);
    data = new DataView(new Uint8Array(data).buffer);
    this._undo = {data: data}
    window.redraw_viewport();
  }, function undo(ctx) {
    var spline=ctx.spline;
    var spline2=istruct.read_object(this._undo.data, Spline);
    var idgen=spline.idgen;
    var is_anim_path=spline.is_anim_path;
    for (var k in spline2) {
        spline[k] = spline2[k];
    }
    var max_cur=spline.idgen.cur_id;
    spline.idgen = idgen;
    if (is_anim_path!=undefined)
      spline.is_anim_path = is_anim_path;
    console.log("Restoring IDGen; max_cur:", max_cur, "current max:", spline.idgen.cur_id);
    idgen.max_cur(max_cur-1);
  }]);
  _es6_module.add_class(SplineLocalToolOp);
  SplineLocalToolOp = _es6_module.add_export('SplineLocalToolOp', SplineLocalToolOp);
  var KeyEdgesOp=_ESClass("KeyEdgesOp", SplineLocalToolOp, [function KeyEdgesOp() {
    SplineLocalToolOp.call(this);
    this.uiname = "Key Edges";
  }, _ESClass.static(function tooldef() {
    return {uiname: "Key Edges", apiname: "spline.key_edges", inputs: {}, outputs: {}, icon: -1, is_modal: false}
  }), function can_call(ctx) {
    return ctx.spline===ctx.frameset.spline;
  }, function exec(ctx) {
    var prefix="frameset.drawspline.segments[";
    var frameset=ctx.frameset;
    var spline=frameset.spline;
    var edge_path_keys={z: 1}
    var __iter_s=__get_iter(spline.segments);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      var path=prefix+s.eid+"]";
      for (var k in edge_path_keys) {
          path+="."+k;
      }
      ctx.api.key_animpath(ctx, frameset, path, ctx.scene.time);
    }
  }]);
  _es6_module.add_class(KeyEdgesOp);
  KeyEdgesOp = _es6_module.add_export('KeyEdgesOp', KeyEdgesOp);
  var pose_clipboards={}
  var CopyPoseOp=_ESClass("CopyPoseOp", SplineLocalToolOp, [function CopyPoseOp() {
    SplineLocalToolOp.call(this);
    this.undoflag|=UndoFlags.IGNORE_UNDO;
  }, _ESClass.static(function tooldef() {
    return {uiname: "Copy Pose", apiname: "editor.copy_pose", undoflag: UndoFlags.IGNORE_UNDO, inputs: {}, outputs: {}, icon: -1, is_modal: false}
  }), function exec(ctx) {
    var lists=[ctx.spline.verts.selected.editable(), ctx.spline.handles.selected.editable()];
    var pose_clipboard={}
    pose_clipboards[ctx.splinepath] = pose_clipboard;
    for (var i=0; i<2; i++) {
        var __iter_v=__get_iter(lists[i]);
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          pose_clipboard[v.eid] = new Vector3(v);
        }
    }
  }]);
  _es6_module.add_class(CopyPoseOp);
  CopyPoseOp = _es6_module.add_export('CopyPoseOp', CopyPoseOp);
  var PastePoseOp=_ESClass("PastePoseOp", SplineLocalToolOp, [function PastePoseOp() {
    SplineLocalToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Paste Pose", apiname: "editor.paste_pose", inputs: {pose: new CollectionProperty([], undefined, "pose", "pose", "pose data", TPropFlags.COLL_LOOSE_TYPE)}, outputs: {}, icon: -1, is_modal: true}
  }), function start_modal(ctx) {
    var spline=ctx.spline;
    var pose_clipboard=pose_clipboards[ctx.splinepath];
    if (pose_clipboard==undefined) {
        console.trace("No pose for splinepath", ctx.splinepath);
        this.end_modal(ctx);
        return ;
    }
    var array=[];
    for (var k in pose_clipboard) {
        var v=spline.eidmap[k];
        if (v==undefined) {
            console.trace("Bad vertex");
            continue;
        }
        var co=pose_clipboard[k];
        array.push(v.eid);
        array.push(co[0]);
        array.push(co[1]);
        array.push(co[2]);
    }
    this.inputs.pose.flag|=TPropFlags.COLL_LOOSE_TYPE;
    this.inputs.pose.set_data(array);
    this.exec(ctx);
  }, function exec(ctx) {
    var spline=ctx.spline;
    if (this.modal_running) {
        this.end_modal(this.modal_ctx);
    }
    var pose=this.inputs.pose.data;
    console.log("poselen", pose.length);
    var actlayer=spline.layerset.active;
    var i=0;
    while (i<pose.length) {
      var eid=pose[i++];
      var v=spline.eidmap[eid];
      if (v==undefined||v.type>2) {
          console.log("bad eid: eid, v:", eid, v);
          i+=3;
          continue;
      }
      var skip=!(v.flag&SplineFlags.SELECT);
      skip = skip||(v.flag&SplineFlags.HIDE);
      skip = skip||!(actlayer.id in v.layers);
      if (skip) {
          console.log("skipping vertex", eid);
          i+=3;
          continue;
      }
      console.log("loading. . .", v, eid, pose[i], pose[i+1], pose[i+2]);
      v[0] = pose[i++];
      v[1] = pose[i++];
      v[2] = pose[i++];
      v.flag|=SplineFlags.UPDATE;
      v.flag|=SplineFlags.FRAME_DIRTY;
    }
    spline.resolve = 1;
    spline.regen_sort();
  }]);
  _es6_module.add_class(PastePoseOp);
  PastePoseOp = _es6_module.add_export('PastePoseOp', PastePoseOp);
  var InterpStepModeOp=_ESClass("InterpStepModeOp", ToolOp, [function InterpStepModeOp() {
    ToolOp.call(this, undefined, "Toggle Step Mode", "Disable/enable smooth interpolation for animation paths");
  }, _ESClass.static(function tooldef() {
    return {uiname: "Toggle Step Mode", apiname: "spline.toggle_step_mode", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Disable/enable smooth interpolation for animation paths"}
  }), function get_animverts(ctx) {
    var vds=new set();
    var spline=ctx.frameset.spline, pathspline=ctx.frameset.pathspline;
    var frameset=ctx.frameset;
    var __iter_v=__get_iter(spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      var vd=frameset.vertex_animdata[v.eid];
      if (vd==undefined)
        continue;
      vds.add(vd);
    }
    return vds;
  }, function undo_pre(ctx) {
    var undo={}
    var pathspline=ctx.frameset.pathspline;
    var __iter_vd=__get_iter(this.get_animverts(ctx));
    var vd;
    while (1) {
      var __ival_vd=__iter_vd.next();
      if (__ival_vd.done) {
          break;
      }
      vd = __ival_vd.value;
      undo[vd.eid] = vd.animflag;
    }
    this._undo = undo;
  }, function undo(ctx) {
    var undo=this._undo;
    var pathspline=ctx.frameset.pathspline;
    var __iter_vd=__get_iter(this.get_animverts(ctx));
    var vd;
    while (1) {
      var __ival_vd=__iter_vd.next();
      if (__ival_vd.done) {
          break;
      }
      vd = __ival_vd.value;
      if (!(vd.eid in undo)) {
          console.log("ERROR in step function tool undo!!");
          continue;
      }
      vd.animflag = undo[vd.eid];
    }
  }, function exec(ctx) {
    var kcache=ctx.frameset.kcache;
    var __iter_vd=__get_iter(this.get_animverts(ctx));
    var vd;
    while (1) {
      var __ival_vd=__iter_vd.next();
      if (__ival_vd.done) {
          break;
      }
      vd = __ival_vd.value;
      vd.animflag^=VDAnimFlags.STEP_FUNC;
      var __iter_v=__get_iter(vd.verts);
      var v;
      while (1) {
        var __ival_v=__iter_v.next();
        if (__ival_v.done) {
            break;
        }
        v = __ival_v.value;
        var time=get_vtime(v);
        kcache.invalidate(v.eid, time);
      }
    }
  }]);
  _es6_module.add_class(InterpStepModeOp);
  InterpStepModeOp = _es6_module.add_export('InterpStepModeOp', InterpStepModeOp);
  var DeleteVertOp=_ESClass("DeleteVertOp", SplineLocalToolOp, [function DeleteVertOp() {
    SplineLocalToolOp.call(this);
  }, function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_DELETE);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Delete Points/Segments", apiname: "spline.delete_verts", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Remove points and segments"}
  }), function exec(ctx) {
    console.log("delete op!");
    var spline=ctx.spline;
    var dellist=[];
    var __iter_v=__get_iter(spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      v.flag|=SplineFlags.UPDATE;
      dellist.push(v);
    }
    spline.propagate_update_flags();
    for (var i=0; i<dellist.length; i++) {
        console.log(dellist[i]);
        spline.kill_vertex(dellist[i]);
    }
    spline.regen_render();
  }]);
  _es6_module.add_class(DeleteVertOp);
  DeleteVertOp = _es6_module.add_export('DeleteVertOp', DeleteVertOp);
  var DeleteSegmentOp=_ESClass("DeleteSegmentOp", ToolOp, [function DeleteSegmentOp() {
    ToolOp.call(this, undefined);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Delete Segments", apiname: "spline.delete_segments", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Remove segments"}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_DELETE);
  }, function exec(ctx) {
    console.log("delete op!");
    var spline=ctx.spline;
    var dellist=[];
    var __iter_s=__get_iter(spline.segments.selected.editable());
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      dellist.push(s);
    }
    for (var i=0; i<dellist.length; i++) {
        console.log(dellist[i]);
        spline.kill_segment(dellist[i]);
    }
    if (dellist.length>0) {
        for (var i=0; i<spline.segments.length; i++) {
            var s=spline.segments[i];
            s.flag|=SplineFlags.UPDATE;
        }
    }
    spline.regen_render();
  }]);
  _es6_module.add_class(DeleteSegmentOp);
  DeleteSegmentOp = _es6_module.add_export('DeleteSegmentOp', DeleteSegmentOp);
  var DeleteFaceOp=_ESClass("DeleteFaceOp", SplineLocalToolOp, [function DeleteFaceOp() {
    SplineLocalToolOp.call(this, undefined, "Delete Faces");
  }, _ESClass.static(function tooldef() {
    return {uiname: "Delete Faces", apiname: "spline.delete_faces", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Remove faces"}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_DELETE);
  }, function exec(ctx) {
    console.log("delete op!");
    var spline=ctx.spline;
    var vset=new set(), sset=new set(), fset=new set();
    var dellist=[];
    var __iter_f=__get_iter(spline.faces.selected.editable());
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      fset.add(f);
    }
    var __iter_f=__get_iter(fset);
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      var __iter_path=__get_iter(f.paths);
      var path;
      while (1) {
        var __ival_path=__iter_path.next();
        if (__ival_path.done) {
            break;
        }
        path = __ival_path.value;
        var __iter_l=__get_iter(path);
        var l;
        while (1) {
          var __ival_l=__iter_l.next();
          if (__ival_l.done) {
              break;
          }
          l = __ival_l.value;
          var l2=l.s.l;
          var _c=0, del=true;
          do {
            if (_c++>1000) {
                console.log("Infintite loop!");
                break;
            }
            if (!fset.has(l2.f))
              del = false;
            l2 = l2.radial_next;
          } while (l2!=l.s.l);
          
          if (del)
            sset.add(l.s);
        }
      }
    }
    var __iter_s=__get_iter(sset);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      for (var si=0; si<2; si++) {
          var del=true;
          var v=si ? s.v2 : s.v1;
          for (var i=0; i<v.segments.length; i++) {
              if (!(sset.has(v.segments[i]))) {
                  del = false;
                  break;
              }
          }
          if (del)
            vset.add(v);
      }
    }
    var __iter_f=__get_iter(fset);
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      spline.kill_face(f);
    }
    var __iter_s=__get_iter(sset);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      spline.kill_segment(s);
    }
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      spline.kill_vertex(v);
    }
    spline.regen_render();
    window.redraw_viewport();
  }]);
  _es6_module.add_class(DeleteFaceOp);
  DeleteFaceOp = _es6_module.add_export('DeleteFaceOp', DeleteFaceOp);
  var ChangeFaceZ=_ESClass("ChangeFaceZ", SplineLocalToolOp, [function ChangeFaceZ(offset, selmode) {
    SplineLocalToolOp.call(this, undefined);
    if (offset!=undefined)
      this.inputs.offset.set_data(offset);
    if (selmode!=undefined)
      this.inputs.selmode.set_data(selmode);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Set Order", apiname: "spline.change_face_z", inputs: {offset: new IntProperty(1), selmode: new IntProperty(SplineTypes.FACE)}, outputs: {}, icon: Icons.Z_UP, is_modal: false, description: "Change draw order of selected faces"}
  }), function can_call(ctx) {
    return 1;
  }, function exec(ctx) {
    var spline=ctx.spline;
    var off=this.inputs.offset.data;
    var selmode=this.inputs.selmode.data;
    if (isNaN(off))
      off = 0.0;
    console.log("change face z! selmode:", selmode, "off", off);
    if (selmode&SplineTypes.VERTEX) {
        selmode|=SplineTypes.FACE|SplineTypes.SEGMENT;
    }
    if (selmode&SplineTypes.FACE) {
        var __iter_f=__get_iter(spline.faces.selected.editable());
        var f;
        while (1) {
          var __ival_f=__iter_f.next();
          if (__ival_f.done) {
              break;
          }
          f = __ival_f.value;
          if (isNaN(f.z))
            f.z = 0.0;
          if (f.hidden)
            continue;
          f.z+=off;
        }
    }
    if (selmode&SplineTypes.SEGMENT) {
        var __iter_s=__get_iter(spline.segments.selected.editable());
        var s;
        while (1) {
          var __ival_s=__iter_s.next();
          if (__ival_s.done) {
              break;
          }
          s = __ival_s.value;
          if (isNaN(s.z))
            s.z = 0.0;
          if (s.hidden)
            continue;
          s.z+=off;
        }
    }
    spline.regen_sort();
    window.redraw_viewport();
  }]);
  _es6_module.add_class(ChangeFaceZ);
  ChangeFaceZ = _es6_module.add_export('ChangeFaceZ', ChangeFaceZ);
  var DissolveVertOp=_ESClass("DissolveVertOp", SplineLocalToolOp, [function DissolveVertOp() {
    SplineLocalToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Collapse Points", apiname: "spline.dissolve_verts", inputs: {verts: new CollectionProperty([], undefined, "verts", "verts"), use_verts: new BoolProperty(false, "use_verts")}, outputs: {}, icon: -1, is_modal: false, description: "Change draw order of selected faces"}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_DISSOLVE);
  }, function exec(ctx) {
    var spline=ctx.spline;
    var dellist=[];
    var verts=spline.verts.selected.editable();
    if (this.inputs.use_verts.data) {
        verts = new set();
        var __iter_eid=__get_iter(this.inputs.verts.data);
        var eid;
        while (1) {
          var __ival_eid=__iter_eid.next();
          if (__ival_eid.done) {
              break;
          }
          eid = __ival_eid.value;
          verts.add(spline.eidmap[eid]);
        }
    }
    var __iter_v=__get_iter(verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      if (v.segments.length!=2)
        continue;
      dellist.push(v);
    }
    for (var i=0; i<dellist.length; i++) {
        spline.dissolve_vertex(dellist[i]);
    }
    spline.regen_render();
  }]);
  _es6_module.add_class(DissolveVertOp);
  DissolveVertOp = _es6_module.add_export('DissolveVertOp', DissolveVertOp);
  function frameset_split_edge(ctx, spline, s, t) {
    if (t==undefined) {
        t = 0.5;
    }
    console.log("split edge op!");
    var interp_animdata=spline===ctx.frameset.spline;
    var frameset=interp_animdata ? ctx.frameset : undefined;
    if (interp_animdata) {
        console.log("interpolating animation data from adjacent vertices!");
    }
    var e_v=spline.split_edge(s, t);
    if (interp_animdata) {
        frameset.create_path_from_adjacent(e_v[1], e_v[0]);
    }
    spline.verts.setselect(e_v[1], true);
    spline.regen_render();
    return e_v;
  }
  var SplitEdgeOp=_ESClass("SplitEdgeOp", SplineGlobalToolOp, [function SplitEdgeOp() {
    SplineGlobalToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Split Segments", apiname: "spline.split_edges", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Split selected segments"}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_SPLIT_EDGE);
  }, function exec(ctx) {
    console.log("split edge op!");
    var spline=ctx.spline;
    var interp_animdata=spline===ctx.frameset.spline;
    var frameset=interp_animdata ? ctx.frameset : undefined;
    console.log("interp_animdata: ", interp_animdata);
    var segs=[];
    if (interp_animdata) {
        console.log("interpolating animation data from adjacent vertices!");
    }
    var __iter_s=__get_iter(spline.segments.selected.editable());
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      if (s.v1.hidden||s.v2.hidden)
        continue;
      if ((s.v1.flag&SplineFlags.SELECT&&s.v2.flag&SplineFlags.SELECT))
        segs.push(s);
    }
    for (var i=0; i<segs.length; i++) {
        let e_v=frameset_split_edge(ctx, spline, segs[i]);
        spline.verts.setselect(e_v[1], true);
    }
    spline.regen_render();
  }]);
  _es6_module.add_class(SplitEdgeOp);
  SplitEdgeOp = _es6_module.add_export('SplitEdgeOp', SplitEdgeOp);
  var SplitEdgePickOp=_ESClass("SplitEdgePickOp", SplineGlobalToolOp, [function SplitEdgePickOp() {
    SplineGlobalToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Split Segment", apiname: "spline.split_pick_edge", inputs: {segment_eid: new IntProperty(-1, "segment_eid", "segment_eid", "segment_eid"), segment_t: new FloatProperty(0, "segment_t", "segment_t", "segment_t"), spline_path: new StringProperty("drawspline", "spline_path", "splien_path", "spline_path")}, outputs: {}, icon: Icons.SPLIT_EDGE, is_modal: true, description: "Split picked segment"}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_SPLIT_EDGE);
  }, function start_modal(ctx) {
    SplineGlobalToolOp.prototype.start_modal.call(this, ctx);
  }, function on_mousedown(e) {
    console.log("mdown", e);
    this.finish(e.button!=0);
  }, function on_mouseup(e) {
    console.log("mup");
    this.finish(e.button!=0);
  }, function end_modal(ctx) {
    this.reset_drawlines();
    SplineGlobalToolOp.prototype.end_modal.call(this, ctx);
  }, function on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Enter"]:
      case charmap["Escape"]:
        this.finish(event.keyCode==charmap["Escape"]);
        break;
    }
  }, function on_mousemove(e) {
    let ctx=this.modal_ctx;
    let mpos=[e.x, e.y];
    let ret=ctx.view2d.editor.findnearest(mpos, SplineTypes.SEGMENT, 105);
    if (ret===undefined) {
        this.reset_drawlines();
        this.inputs.segment_eid.set_data(-1);
        return ;
    }
    let seg=ret[1];
    let spline=ret[0];
    if (spline===ctx.frameset.pathspline) {
        this.inputs.spline_path.set_data("pathspline");
    }
    else {
      this.inputs.spline_path.set_data("spline");
    }
    this.reset_drawlines(ctx);
    let steps=16;
    let ds=1.0/(steps-1), s=ds;
    let lastco=seg.evaluate(s);
    for (let i=1; i<steps; i++, s+=ds) {
        let co=seg.evaluate(s);
        this.new_drawline(lastco, co, [1, 0.3, 0.0, 1.0], 2);
        lastco = co;
    }
    this.inputs.segment_eid.set_data(seg.eid);
    this.inputs.segment_t.set_data(0.5);
    ctx.view2d.unproject(mpos);
    let p=seg.closest_point(mpos, ClosestModes.CLOSEST);
    if (p!==undefined) {
        this.inputs.segment_t.set_data(p[1]);
        p = p[0];
        let w=2;
        this.new_drawline([p[0]-w, p[1]-w], [p[0]-w, p[1]+w]);
        this.new_drawline([p[0]-w, p[1]+w], [p[0]+w, p[1]+w]);
        this.new_drawline([p[0]+w, p[1]+w], [p[0]+w, p[1]-w]);
        this.new_drawline([p[0]+w, p[1]-w], [p[0]-w, p[1]-w]);
    }
  }, function finish(do_cancel) {
    if (do_cancel||this.inputs.segment_eid.data==-1) {
        this.end_modal(this.modal_ctx);
        this.cancel_modal(this.modal_ctx);
    }
    else {
      this.end_modal(this.modal_ctx);
      this.exec(this.modal_ctx);
    }
  }, function exec(ctx) {
    var spline=this.inputs.spline_path.data;
    spline = spline=="pathspline" ? ctx.frameset.pathspline : ctx.frameset.spline;
    var seg=spline.eidmap[this.inputs.segment_eid.data];
    var t=this.inputs.segment_t.data;
    if (seg===undefined) {
        console.warn("Unknown segment", this.inputs.segment_eid.data);
        return ;
    }
    frameset_split_edge(ctx, spline, seg, t);
  }]);
  _es6_module.add_class(SplitEdgePickOp);
  SplitEdgePickOp = _es6_module.add_export('SplitEdgePickOp', SplitEdgePickOp);
  var VertPropertyBaseOp=_ESClass("VertPropertyBaseOp", ToolOp, [function undo_pre(ctx) {
    var spline=ctx.spline;
    var vdata={}
    var __iter_v=__get_iter(spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      vdata[v.eid] = v.flag;
    }
    this._undo = vdata;
    window.redraw_viewport();
  }, function undo(ctx) {
    var spline=ctx.spline;
    for (var k in this._undo) {
        var v=spline.eidmap[k];
        v.flag = this._undo[k];
        v.flag|=SplineFlags.UPDATE;
    }
    spline.resolve = 1;
  }, function VertPropertyBaseOp() {
    ToolOp.apply(this, arguments);
  }]);
  _es6_module.add_class(VertPropertyBaseOp);
  VertPropertyBaseOp = _es6_module.add_export('VertPropertyBaseOp', VertPropertyBaseOp);
  var ToggleBreakTanOp=_ESClass("ToggleBreakTanOp", VertPropertyBaseOp, [function ToggleBreakTanOp() {
    VertPropertyBaseOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Toggle Sharp Corners", apiname: "spline.toggle_break_tangents", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Toggle Sharp Corners"}
  }), function exec(ctx) {
    var spline=ctx.spline;
    var actlayer=spline.layerset.active.id;
    for (var si=0; si<2; si++) {
        var list=si ? spline.handles : spline.verts;
        var __iter_v=__get_iter(list.selected.editable());
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          if (v.type==SplineTypes.HANDLE&&!v.use)
            continue;
          if (v.type==SplineTypes.HANDLE&&(v.owning_vertex!=undefined&&(v.owning_vertex.flag&SplineFlags.SELECT))) {
              if (v.owning_vertex.flag&SplineFlags.BREAK_TANGENTS)
                v.flag|=SplineFlags.BREAK_TANGENTS;
              else 
                v.flag&=~SplineFlags.BREAK_TANGENTS;
          }
          v.flag^=SplineFlags.BREAK_TANGENTS;
          v.flag|=SplineFlags.UPDATE;
        }
    }
    spline.resolve = 1;
  }]);
  _es6_module.add_class(ToggleBreakTanOp);
  ToggleBreakTanOp = _es6_module.add_export('ToggleBreakTanOp', ToggleBreakTanOp);
  var ToggleBreakCurvOp=_ESClass("ToggleBreakCurvOp", VertPropertyBaseOp, [function ToggleBreakCurvOp() {
    VertPropertyBaseOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Toggle Broken Curvatures", apiname: "spline.toggle_break_curvature", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Toggle Break Curvatures, enable 'draw normals'\n in display panel to\n see what this does"}
  }), function exec(ctx) {
    var spline=ctx.spline;
    var __iter_v=__get_iter(spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      v.flag^=SplineFlags.BREAK_CURVATURES;
      v.flag|=SplineFlags.UPDATE;
    }
    spline.resolve = 1;
  }]);
  _es6_module.add_class(ToggleBreakCurvOp);
  ToggleBreakCurvOp = _es6_module.add_export('ToggleBreakCurvOp', ToggleBreakCurvOp);
  var ConnectHandlesOp=_ESClass("ConnectHandlesOp", ToolOp, [function ConnectHandlesOp() {
    ToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Connect Handles", apiname: "spline.connect_handles", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Pairs adjacent handles together to make a smooth curve"}
  }), function exec(ctx) {
    var spline=ctx.spline;
    var h1=undefined, h2=undefined;
    var __iter_h=__get_iter(spline.handles.selected.editable());
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
      if (h1==undefined)
        h1 = h;
      else 
        if (h2==undefined)
        h2 = h;
      else 
        break;
    }
    if (h1==undefined||h2==undefined)
      return ;
    var s1=h1.segments[0], s2=h2.segments[0];
    if (s1.handle_vertex(h1)!=s2.handle_vertex(h2))
      return ;
    console.log("Connecting handles", h1.eid, h2.eid);
    h1.flag|=SplineFlags.AUTO_PAIRED_HANDLE;
    h2.flag|=SplineFlags.AUTO_PAIRED_HANDLE;
    h1.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
    h2.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
    var v=s1.handle_vertex(h1);
    v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
    spline.connect_handles(h1, h2);
    spline.resolve = 1;
  }]);
  _es6_module.add_class(ConnectHandlesOp);
  ConnectHandlesOp = _es6_module.add_export('ConnectHandlesOp', ConnectHandlesOp);
  var DisconnectHandlesOp=_ESClass("DisconnectHandlesOp", ToolOp, [function DisconnectHandlesOp() {
    ToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Disconnect Handles", apiname: "spline.disconnect_handles", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Disconnects all handles around a point.\n  Point must have more than two segments"}
  }), function exec(ctx) {
    var spline=ctx.spline;
    console.log("Disconnect handles");
    var __iter_h=__get_iter(spline.handles.selected.editable());
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
      var v=h.owning_segment.handle_vertex(h);
      if (h.hpair==undefined)
        continue;
      h.flag&=~SplineFlags.AUTO_PAIRED_HANDLE;
      h.hpair.flag&=~SplineFlags.AUTO_PAIRED_HANDLE;
      h.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      h.hpair.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      spline.disconnect_handle(h);
      spline.resolve = 1;
    }
  }]);
  _es6_module.add_class(DisconnectHandlesOp);
  DisconnectHandlesOp = _es6_module.add_export('DisconnectHandlesOp', DisconnectHandlesOp);
  var CurveRootFinderTest=_ESClass("CurveRootFinderTest", ToolOp, [function CurveRootFinderTest() {
    ToolOp.call(this, "curverootfinder", "curverootfinder", "curverootfinder");
  }, _ESClass.static(function tooldef() {
    return {uiname: "Test Closest Point Finder", apiname: "spline._test_closest_points", inputs: {}, outputs: {}, undoflag: UndoFlags.IGNORE_UNDO, icon: -1, is_modal: true, description: "Test closest-point-to-curve functionality"}
  }), function on_mousemove(event) {
    var mpos=[event.x, event.y];
    var ctx=this.modal_ctx;
    var spline=ctx.spline;
    this.reset_drawlines();
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      var ret=seg.closest_point(mpos, 0);
      if (ret==undefined)
        continue;
      var dl=this.new_drawline(ret[0], mpos);
      dl.clr[3] = 0.1;
      continue;
      var ret=seg.closest_point(mpos, 3);
      var __iter_p=__get_iter(ret);
      var p;
      while (1) {
        var __ival_p=__iter_p.next();
        if (__ival_p.done) {
            break;
        }
        p = __ival_p.value;
        this.new_drawline(p[0], mpos);
      }
    }
  }, function end_modal() {
    this.reset_drawlines();
    this._end_modal();
  }, function on_mousedown(event) {
    this.end_modal();
  }, function on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Enter"]:
      case charmap["Escape"]:
        this.end_modal();
        break;
    }
  }]);
  _es6_module.add_class(CurveRootFinderTest);
  CurveRootFinderTest = _es6_module.add_export('CurveRootFinderTest', CurveRootFinderTest);
  var AnimPlaybackOp=_ESClass("AnimPlaybackOp", ToolOp, [function AnimPlaybackOp() {
    ToolOp.call(this);
    this.undoflag|=UndoFlags.IGNORE_UNDO;
    this.timer = undefined;
    this.time = 0;
    this.start_time = 0;
    this.done = false;
    this.on_solve_node = function() {
      console.log("on_solve callback triggered in AnimPLaybackOp");
      window.redraw_viewport();
      this.on_frame(this.modal_ctx);
    }
  }, _ESClass.static(function tooldef() {
    return {uiname: "Playback", apiname: "editor.playback", inputs: {}, outputs: {}, undoflag: UndoFlags.IGNORE_UNDO, icon: -1, is_modal: true, description: "Play back animation"}
  }), function on_frame(ctx) {
    let this2=this;
    window.redraw_viewport().then(function() {
      if (this2.done) {
          return ;
      }
      console.log("frame!");
      console.log("playback op: change time");
      console.log("  time:", this2.time, this2);
      this2.time+=1.0;
      ctx.scene.change_time(ctx, this2.time);
    });
  }, function end_modal(ctx) {
    the_global_dag.remove(this.on_solve_node);
    g_app_state.set_modalstate(0);
    ToolOp.prototype.end_modal.call(this);
    if (this.timer!=undefined) {
        window.clearInterval(this.timer);
        this.timer = undefined;
    }
  }, function cancel(ctx) {
  }, function finish(ctx) {
    if (!this.done) {
        this.done = true;
        ctx.scene.change_time(ctx, this.start_time);
        window.redraw_viewport();
    }
  }, function on_mousemove(event) {
  }, function on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Escape"]:
      case charmap["Return"]:
      case charmap["Space"]:
        this.finish(this.modal_ctx);
        this.end_modal();
    }
  }, function on_mouseup(event) {
    this.finish(this.modal_ctx);
    this.end_modal();
  }, function start_modal(ctx) {
    the_global_dag.link(ctx.frameset.spline, ["on_solve"], this.on_solve_node, "", this);
    g_app_state.set_modalstate(ModalStates.PLAYING);
    var this2=this;
    this.time = this.start_time = ctx.scene.time;
    this.on_frame(this.modal_ctx);
    if (0) {
        var last_time=time_ms();
        this.timer = window.setInterval(function() {
          if (time_ms()-last_time<41) {
              return ;
          }
          last_time = time_ms();
          this2.on_frame(this2.modal_ctx);
        }, 1);
    }
  }]);
  _es6_module.add_class(AnimPlaybackOp);
  AnimPlaybackOp = _es6_module.add_export('AnimPlaybackOp', AnimPlaybackOp);
  var ToggleManualHandlesOp=_ESClass("ToggleManualHandlesOp", ToolOp, [function ToggleManualHandlesOp() {
    ToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Toggle Manual Handles", apiname: "spline.toggle_manual_handles", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Toggle Manual Handles"}
  }), function undo_pre(ctx) {
    var spline=ctx.spline;
    var ud=this._undo = {}
    var __iter_v=__get_iter(spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      ud[v.eid] = v.flag&SplineFlags.USE_HANDLES;
    }
  }, function undo(ctx) {
    var spline=ctx.spline;
    var ud=this._undo;
    for (var k in ud) {
        var v=spline.eidmap[k];
        if (v==undefined||v.type!=SplineTypes.VERTEX) {
            console.log("WARNING: bad v in toggle manual handles op's undo handler!", v);
            continue;
        }
        v.flag = (v.flag&~SplineFlags.USE_HANDLES)|ud[k]|SplineFlags.UPDATE;
    }
    spline.resolve = 1;
  }, function exec(ctx) {
    var spline=ctx.spline;
    var __iter_v=__get_iter(spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      v.flag^=SplineFlags.USE_HANDLES;
      v.flag|=SplineFlags.UPDATE;
    }
    spline.resolve = 1;
  }]);
  _es6_module.add_class(ToggleManualHandlesOp);
  ToggleManualHandlesOp = _es6_module.add_export('ToggleManualHandlesOp', ToggleManualHandlesOp);
  var TimeDataLayer=es6_import_item(_es6_module, 'animdata', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, 'animdata', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, 'animdata', 'set_vtime');
  var ClosestModes=es6_import_item(_es6_module, '../../curve/spline_base', 'ClosestModes');
  var ShiftTimeOp=_ESClass("ShiftTimeOp", ToolOp, [function ShiftTimeOp() {
    ToolOp.call(this);
    this.start_mpos = new Vector3();
  }, _ESClass.static(function tooldef() {
    return {uiname: "Move Keyframes", apiname: "spline.shift_time", inputs: {factor: new FloatProperty(-1, "factor", "factor", "factor")}, outputs: {}, icon: -1, is_modal: true, description: "Move keyframes"}
  }), function get_curframe_animverts(ctx) {
    var vset=new set();
    var spline=ctx.frameset.spline, pathspline=ctx.frameset.pathspline;
    var frameset=ctx.frameset;
    var __iter_v=__get_iter(pathspline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      vset.add(v);
    }
    if (vset.length==0) {
        var __iter_v=__get_iter(spline.verts.selected.editable());
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          var vd=frameset.vertex_animdata[v.eid];
          if (vd==undefined)
            continue;
          var __iter_v2=__get_iter(vd.verts);
          var v2;
          while (1) {
            var __ival_v2=__iter_v2.next();
            if (__ival_v2.done) {
                break;
            }
            v2 = __ival_v2.value;
            var vtime=get_vtime(v2);
            if (vtime==ctx.scene.time) {
                vset.add(v2);
            }
          }
        }
    }
    return vset;
  }, function start_modal(ctx) {
    this.first = true;
  }, function end_modal(ctx) {
    ToolOp.prototype.end_modal.call(this);
  }, function cancel(ctx) {
  }, function finish(ctx) {
    ctx.scene.change_time(ctx, this.start_time);
  }, function on_mousemove(event) {
    if (this.first) {
        this.start_mpos.load([event.x, event.y, 0]);
        this.first = false;
    }
    var mpos=new Vector3([event.x, event.y, 0]);
    var dx=-Math.floor((this.start_mpos[0]-mpos[0])/20+0.5);
    this.undo(this.modal_ctx);
    this.inputs.factor.set_data(dx);
    this.exec(this.modal_ctx);
    window.redraw_viewport();
  }, function on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Escape"]:
        this.cancel(this.modal_ctx);
      case charmap["Return"]:
      case charmap["Space"]:
        this.finish(this.modal_ctx);
        this.end_modal();
    }
  }, function on_mouseup(event) {
    this.end_modal();
  }, function undo_pre(ctx) {
    var ud=this._undo = {}
    var __iter_v=__get_iter(this.get_curframe_animverts(ctx));
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      ud[v.eid] = get_vtime(v);
    }
  }, function undo(ctx) {
    var spline=ctx.frameset.pathspline;
    for (var k in this._undo) {
        var v=spline.eidmap[k], time=this._undo[k];
        set_vtime(v, time);
        v.dag_update("depend");
    }
    ctx.frameset.download();
  }, function exec(ctx) {
    var spline=ctx.frameset.pathspline;
    var starts={}
    var off=this.inputs.factor.data;
    var vset=this.get_curframe_animverts(ctx);
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      starts[v.eid] = get_vtime(v);
    }
    var kcache=ctx.frameset.kcache;
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      kcache.invalidate(v.eid, get_vtime(v));
      set_vtime(v, starts[v.eid]+off);
      kcache.invalidate(v.eid, get_vtime(v));
      v.dag_update("depend");
    }
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      var min=undefined, max=undefined;
      if (v.segments.length==1) {
          var s=v.segments[0];
          var v2=s.other_vert(v);
          var t1=get_vtime(v), t2=get_vtime(v2);
          if (t1<t2) {
              min = 0, max = t2;
          }
          else 
            if (t1==t2) {
              min = max = t1;
          }
          else {
            min = t1, max = 100000;
          }
      }
      else 
        if (v.segments.length==2) {
          var v1=v.segments[0].other_vert(v);
          var v2=v.segments[1].other_vert(v);
          var t1=get_vtime(v1), t2=get_vtime(v2);
          min = Math.min(t1, t2), max = Math.max(t1, t2);
      }
      else {
        min = 0;
        max = 100000;
      }
      var newtime=get_vtime(v);
      newtime = Math.min(Math.max(newtime, min), max);
      set_vtime(v, newtime);
      v.dag_update("depend");
    }
    ctx.frameset.download();
  }]);
  _es6_module.add_class(ShiftTimeOp);
  ShiftTimeOp = _es6_module.add_export('ShiftTimeOp', ShiftTimeOp);
  var DuplicateOp=_ESClass("DuplicateOp", SplineLocalToolOp, [function DuplicateOp() {
    SplineLocalToolOp.call(this, undefined, "Duplicate");
  }, _ESClass.static(function tooldef() {
    return {uiname: "Duplicate Geometry", apiname: "spline.duplicate", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Make a duplicate of selected geometry."}
  }), function can_call(ctx) {
    return !(ctx.spline.restrict&RestrictFlags.NO_CREATE);
  }, function exec(ctx) {
    var vset=new set();
    var sset=new set();
    var fset=new set();
    var hset=new set();
    var spline=ctx.spline;
    var eidmap={}
    var __iter_v=__get_iter(spline.verts.selected.editable());
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      vset.add(v);
    }
    var __iter_s=__get_iter(spline.segments.selected.editable());
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      sset.add(s);
      vset.add(s.v1);
      vset.add(s.v2);
    }
    var __iter_f=__get_iter(spline.faces.selected.editable());
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      fset.add(f);
      var __iter_path=__get_iter(f.paths);
      var path;
      while (1) {
        var __ival_path=__iter_path.next();
        if (__ival_path.done) {
            break;
        }
        path = __ival_path.value;
        var __iter_l=__get_iter(path);
        var l;
        while (1) {
          var __ival_l=__iter_l.next();
          if (__ival_l.done) {
              break;
          }
          l = __ival_l.value;
          sset.add(l.s);
          vset.add(l.s.v1);
          vset.add(l.s.v2);
        }
      }
    }
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      var nv=spline.make_vertex(v);
      spline.copy_vert_data(nv, v);
      eidmap[v.eid] = nv;
      spline.verts.setselect(v, false);
      spline.verts.setselect(nv, true);
    }
    var __iter_s=__get_iter(sset);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      var v1=eidmap[s.v1.eid], v2=eidmap[s.v2.eid];
      var ns=spline.make_segment(v1, v2);
      ns._aabb[0].load(s._aabb[0]);
      ns._aabb[1].load(s._aabb[1]);
      spline.copy_segment_data(ns, s);
      spline.copy_handle_data(ns.h1, s.h1);
      spline.copy_handle_data(ns.h2, s.h2);
      eidmap[s.h1.eid] = ns.h1;
      eidmap[s.h2.eid] = ns.h2;
      ns.h1.load(s.h1);
      ns.h2.load(s.h2);
      hset.add(s.h1);
      hset.add(s.h2);
      eidmap[ns.eid] = ns;
      spline.segments.setselect(s, false);
      spline.segments.setselect(ns, true);
      spline.handles.setselect(s.h1, false);
      spline.handles.setselect(s.h2, false);
      spline.handles.setselect(ns.h1, true);
      spline.handles.setselect(ns.h2, true);
    }
    var __iter_h=__get_iter(hset);
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
      var nh=eidmap[h.eid];
      if (h.pair!=undefined&&h.pair.eid in eidmap) {
          spline.connect_handles(nh, eidmap[h.pair.eid]);
      }
    }
    var __iter_f=__get_iter(fset);
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      var vlists=[];
      var __iter_path=__get_iter(f.paths);
      var path;
      while (1) {
        var __ival_path=__iter_path.next();
        if (__ival_path.done) {
            break;
        }
        path = __ival_path.value;
        var verts=[];
        vlists.push(verts);
        var __iter_l=__get_iter(path);
        var l;
        while (1) {
          var __ival_l=__iter_l.next();
          if (__ival_l.done) {
              break;
          }
          l = __ival_l.value;
          verts.push(eidmap[l.v.eid]);
        }
      }
      console.log("duplicate");
      var nf=spline.make_face(vlists);
      nf._aabb[0].load(f._aabb[0]);
      nf._aabb[1].load(f._aabb[1]);
      spline.copy_face_data(nf, f);
      spline.faces.setselect(f, false);
      spline.faces.setselect(nf, true);
    }
    spline.regen_render();
    spline.solve();
  }]);
  _es6_module.add_class(DuplicateOp);
  DuplicateOp = _es6_module.add_export('DuplicateOp', DuplicateOp);
  var SplineMirrorOp=_ESClass("SplineMirrorOp", SplineLocalToolOp, [function SplineMirrorOp() {
    SplineLocalToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Flip Horizontally", apiname: "spline.mirror_verts", inputs: {}, outputs: {}, icon: -1, is_modal: false, description: "Flip selected points horizontally"}
  }), function exec(ctx) {
    var spline=ctx.spline;
    var points=new set();
    var cent=new Vector3();
    for (var i=0; i<2; i++) {
        var list=i ? spline.handles : spline.verts;
        var __iter_v=__get_iter(list.selected.editable());
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          if (i==1&&v.owning_vertex!=undefined&&v.owning_vertex.hidden)
            continue;
          if (i==0&&v.hidden)
            continue;
          points.add(v);
          cent.add(v);
        }
    }
    if (points.length==0)
      return ;
    cent.mulScalar(1.0/points.length);
    var __iter_v=__get_iter(points);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      v.sub(cent);
      v[0] = -v[0];
      v.add(cent);
      v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
    }
    spline.resolve = 1;
  }]);
  _es6_module.add_class(SplineMirrorOp);
  SplineMirrorOp = _es6_module.add_export('SplineMirrorOp', SplineMirrorOp);
}, '/dev/fairmotion/src/editors/viewport/spline_editops.js');
es6_module_define('spline_layerops', ["toolops_api", "spline", "spline_types", "spline_editops", "toolprops"], function _spline_layerops_module(_es6_module) {
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var RecalcFlags=es6_import_item(_es6_module, 'spline_types', 'RecalcFlags');
  var RestrictFlags=es6_import_item(_es6_module, 'spline', 'RestrictFlags');
  var Spline=es6_import_item(_es6_module, 'spline', 'Spline');
  var SplineLocalToolOp=es6_import_item(_es6_module, 'spline_editops', 'SplineLocalToolOp');
  var StringProperty=es6_import_item(_es6_module, 'toolprops', 'StringProperty');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var AddLayerOp=_ESClass("AddLayerOp", SplineLocalToolOp, [function AddLayerOp(name) {
    SplineLocalToolOp.call(this, undefined, "Add Layer");
    if (name!=undefined)
      this.inputs.name.set_data(name);
  }, function can_call(ctx) {
    return ctx.spline===ctx.frameset.spline;
  }, function exec(ctx) {
    var layer=ctx.spline.layerset.new_layer(this.inputs.name.data);
    this.outputs.layerid.set_data(layer.id);
    if (this.inputs.make_active.data) {
        ctx.spline.layerset.active = layer;
        var __iter_list=__get_iter(ctx.spline.elists);
        var list;
        while (1) {
          var __ival_list=__iter_list.next();
          if (__ival_list.done) {
              break;
          }
          list = __ival_list.value;
          list.active = undefined;
        }
    }
    ctx.spline.regen_sort();
  }]);
  _es6_module.add_class(AddLayerOp);
  AddLayerOp = _es6_module.add_export('AddLayerOp', AddLayerOp);
  AddLayerOp.inputs = {name: new StringProperty("Layer", "name", "Name", "Layer Name"), make_active: new BoolProperty(true, "Make Active")}
  AddLayerOp.outputs = {layerid: new IntProperty(0, "layerid", "layerid", "New Layer ID")}
  var ChangeLayerOp=_ESClass("ChangeLayerOp", ToolOp, [_ESClass.static(function tooldef() {
    return {uiname: "Change Layer", apiname: "spline.layers.set", inputs: {layerid: new IntProperty(0, "layerid", "layerid", "Layer ID")}, is_modal: false}
  }), function ChangeLayerOp(id) {
    ToolOp.call(this, undefined);
    if (id!=undefined)
      this.inputs.layerid.set_data(id);
  }, function undo_pre(ctx) {
    var spline=ctx.spline;
    var actives=[];
    var __iter_list=__get_iter(spline.elists);
    var list;
    while (1) {
      var __ival_list=__iter_list.next();
      if (__ival_list.done) {
          break;
      }
      list = __ival_list.value;
      actives.push(list.active!=undefined ? list.active.eid : -1);
    }
    this._undo = {id: ctx.spline.layerset.active.id, actives: actives}
  }, function undo(ctx) {
    var spline=ctx.spline;
    var layer=spline.layerset.idmap[this._undo.id];
    var actives=this._undo.actives;
    for (var i=0; i<actives.length; i++) {
        spline.elists[i].active = spline.eidmap[actives[i]];
    }
    if (layer==undefined) {
        console.log("ERROR IN CHANGELAYER UNDO!");
        return ;
    }
    spline.layerset.active = layer;
  }, function exec(ctx) {
    var spline=ctx.spline;
    var layer=spline.layerset.idmap[this.inputs.layerid.data];
    if (layer==undefined) {
        console.log("ERROR IN CHANGELAYER!");
        return ;
    }
    var __iter_list=__get_iter(spline.elists);
    var list;
    while (1) {
      var __ival_list=__iter_list.next();
      if (__ival_list.done) {
          break;
      }
      list = __ival_list.value;
      list.active = undefined;
    }
    spline.layerset.active = layer;
    window.redraw_viewport();
  }]);
  _es6_module.add_class(ChangeLayerOp);
  ChangeLayerOp = _es6_module.add_export('ChangeLayerOp', ChangeLayerOp);
  
  var ChangeElementLayerOp=_ESClass("ChangeElementLayerOp", SplineLocalToolOp, [function ChangeElementLayerOp(old_layer, new_layer) {
    SplineLocalToolOp.call(this, undefined, "Move to Layer");
    if (old_layer!=undefined)
      this.inputs.old_layer.set_data(old_layer);
    if (new_layer!=undefined)
      this.inputs.new_layer.set_data(new_layer);
  }, function exec(ctx) {
    var spline=ctx.spline;
    var oldl=this.inputs.old_layer.data;
    var newl=this.inputs.new_layer.data;
    var eset=new set();
    var __iter_e=__get_iter(spline.selected);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      if (e.hidden)
        continue;
      if (!(oldl in e.layers))
        continue;
      eset.add(e);
    }
    console.log("ids", oldl, newl);
    oldl = spline.layerset.idmap[oldl];
    newl = spline.layerset.idmap[newl];
    if (newl==undefined||oldl==undefined||oldl==newl) {
        console.log("Error in ChangeElementLayerOp!", "oldlayer", oldl, "newlayer", newl);
        return ;
    }
    var __iter_e=__get_iter(eset);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      oldl.remove(e);
      newl.add(e);
    }
    window.redraw_viewport();
    spline.regen_sort();
  }]);
  _es6_module.add_class(ChangeElementLayerOp);
  ChangeElementLayerOp = _es6_module.add_export('ChangeElementLayerOp', ChangeElementLayerOp);
  ChangeElementLayerOp.inputs = {old_layer: new IntProperty(0), new_layer: new IntProperty(0)}
  var DeleteLayerOp=_ESClass("DeleteLayerOp", SplineLocalToolOp, [function DeleteLayerOp() {
    SplineLocalToolOp.call(this, undefined);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Delete Layer", apiname: "spline.layers.remove", inputs: {layer_id: new IntProperty(-1)}, is_modal: false}
  }), function exec(ctx) {
    var spline=ctx.spline;
    var layer=spline.layerset.idmap[this.inputs.layer_id.data];
    if (layer==undefined) {
        console.trace("Warning, bad data passed to DeleteLayerOp()");
        return ;
    }
    if (spline.layerset.length<2) {
        console.trace("DeleteLayerOp(): Must have at least one layer at all times");
        return ;
    }
    var orphaned=new set();
    for (var k in spline.eidmap) {
        var e=spline.eidmap[k];
        if (layer.id in e.layers) {
            delete e.layers[layer.id];
        }
        var exist=false;
        for (var id in e.layers) {
            exist = true;
            break;
        }
        if (!exist) {
            orphaned.add(e);
        }
    }
    spline.layerset.remove(layer);
    var layer=spline.layerset.active;
    var __iter_e=__get_iter(orphaned);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      e.layers[layer.id] = 1;
    }
  }]);
  _es6_module.add_class(DeleteLayerOp);
  DeleteLayerOp = _es6_module.add_export('DeleteLayerOp', DeleteLayerOp);
}, '/dev/fairmotion/src/editors/viewport/spline_layerops.js');
es6_module_define('spline_animops', [], function _spline_animops_module(_es6_module) {
}, '/dev/fairmotion/src/editors/viewport/spline_animops.js');
es6_module_define('multires_ops', ["spline", "toolops_api", "spline_editops", "toolprops", "spline_draw", "spline_types", "J3DIMath", "spline_multires"], function _multires_ops_module(_es6_module) {
  es6_import(_es6_module, 'J3DIMath');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var Vec3Property=es6_import_item(_es6_module, 'toolprops', 'Vec3Property');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var RecalcFlags=es6_import_item(_es6_module, 'spline_types', 'RecalcFlags');
  var RestrictFlags=es6_import_item(_es6_module, 'spline', 'RestrictFlags');
  var Spline=es6_import_item(_es6_module, 'spline', 'Spline');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var redo_draw_sort=es6_import_item(_es6_module, 'spline_draw', 'redo_draw_sort');
  var SplineLocalToolOp=es6_import_item(_es6_module, 'spline_editops', 'SplineLocalToolOp');
  var ensure_multires=es6_import_item(_es6_module, 'spline_multires', 'ensure_multires');
  var MResFlags=es6_import_item(_es6_module, 'spline_multires', 'MResFlags');
  var BoundPoint=es6_import_item(_es6_module, 'spline_multires', 'BoundPoint');
  var MultiResLayer=es6_import_item(_es6_module, 'spline_multires', 'MultiResLayer');
  var compose_id=es6_import_item(_es6_module, 'spline_multires', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, 'spline_multires', 'decompose_id');
  var has_multires=es6_import_item(_es6_module, 'spline_multires', 'has_multires');
  var iterpoints=es6_import_item(_es6_module, 'spline_multires', 'iterpoints');
  var $vec_XG4j_exec;
  var CreateMResPoint=_ESClass("CreateMResPoint", SplineLocalToolOp, [function CreateMResPoint(seg, co) {
    SplineLocalToolOp.call(this, "create_mres_point", "Add Detail Point", "", -1);
    if (seg!=undefined) {
        this.inputs.segment.set_data(typeof seg!="number" ? seg.eid : seg);
    }
    if (co!=undefined) {
        this.inputs.co.set_data(co);
    }
  }, function exec(ctx) {
    var spline=ctx.spline;
    var level=this.inputs.level.data;
    console.log("Add mres point! yay!");
    ensure_multires(spline);
    var seg=spline.eidmap[this.inputs.segment.data];
    var co=this.inputs.co.data;
    var flag=MResFlags.SELECT;
    var mr=seg.cdata.get_layer(MultiResLayer);
    var __iter_seg2=__get_iter(spline.segments);
    var seg2;
    while (1) {
      var __ival_seg2=__iter_seg2.next();
      if (__ival_seg2.done) {
          break;
      }
      seg2 = __ival_seg2.value;
      var mr2=seg2.cdata.get_layer(MultiResLayer);
      var __iter_p2=__get_iter(mr2.points(level));
      var p2;
      while (1) {
        var __ival_p2=__iter_p2.next();
        if (__ival_p2.done) {
            break;
        }
        p2 = __ival_p2.value;
        p2.flag&=~MResFlags.SELECT;
      }
    }
    console.log(p);
    console.log("S", s);
    var p=mr.add_point(level, co);
    var cp=seg.closest_point(co);
    var t=10.0, s=0.5;
    if (cp!=undefined) {
        s = cp[1];
        t = cp[0].vectorDistance(co);
        $vec_XG4j_exec.zero().load(co).sub(cp[0]);
        var n=seg.normal(s);
        t*=Math.sign(n.dot($vec_XG4j_exec));
        p.offset[0] = $vec_XG4j_exec[0];
        p.offset[1] = $vec_XG4j_exec[1];
    }
    else {
      flag|=MResFlags.UPDATE;
    }
    p.flag = flag;
    p.s = s;
    p.t = t;
    p.seg = seg.eid;
    var id=compose_id(p.seg, p.id);
    spline.segments.cdata.get_shared('MultiResLayer').active = id;
  }]);
  var $vec_XG4j_exec=new Vector3();
  _es6_module.add_class(CreateMResPoint);
  CreateMResPoint = _es6_module.add_export('CreateMResPoint', CreateMResPoint);
  CreateMResPoint.inputs = {segment: new IntProperty(0), co: new Vec3Property(), level: new IntProperty(0)}
}, '/dev/fairmotion/src/editors/viewport/multires/multires_ops.js');
es6_module_define('multires_selectops', ["spline_editops", "toolops_api", "spline_types", "spline_multires", "J3DIMath", "spline_draw", "toolprops", "spline"], function _multires_selectops_module(_es6_module) {
  "use strict";
  es6_import(_es6_module, 'J3DIMath');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var Vec3Property=es6_import_item(_es6_module, 'toolprops', 'Vec3Property');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var RecalcFlags=es6_import_item(_es6_module, 'spline_types', 'RecalcFlags');
  var RestrictFlags=es6_import_item(_es6_module, 'spline', 'RestrictFlags');
  var Spline=es6_import_item(_es6_module, 'spline', 'Spline');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var redo_draw_sort=es6_import_item(_es6_module, 'spline_draw', 'redo_draw_sort');
  var SplineLocalToolOp=es6_import_item(_es6_module, 'spline_editops', 'SplineLocalToolOp');
  var ensure_multires=es6_import_item(_es6_module, 'spline_multires', 'ensure_multires');
  var has_multires=es6_import_item(_es6_module, 'spline_multires', 'has_multires');
  var MResFlags=es6_import_item(_es6_module, 'spline_multires', 'MResFlags');
  var compose_id=es6_import_item(_es6_module, 'spline_multires', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, 'spline_multires', 'decompose_id');
  var BoundPoint=es6_import_item(_es6_module, 'spline_multires', 'BoundPoint');
  var MultiResLayer=es6_import_item(_es6_module, 'spline_multires', 'MultiResLayer');
  var SelectOpBase=_ESClass("SelectOpBase", ToolOp, [function SelectOpBase(actlevel, uiname, description, icon) {
    ToolOp.call(this, undefined, uiname, description, icon);
    if (actlevel!=undefined)
      this.inputs.level.set_data(actlevel);
  }, function can_call(ctx) {
    var spline=ctx.spline;
    return has_multires(spline);
  }, function undo_pre(ctx) {
    var ud=this._undo = [];
    this._undo_level = this.inputs.level.data;
    var spline=ctx.spline;
    var actlayer=spline.layerset.active;
    var level=this.inputs.level.data;
    if (!has_multires(spline))
      return ;
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      if (seg.hidden)
        continue;
      if (!(actlayer.id in seg.layers))
        continue;
      var mr=seg.cdata.get_layer(MultiResLayer);
      var __iter_p=__get_iter(mr.points(level));
      var p;
      while (1) {
        var __ival_p=__iter_p.next();
        if (__ival_p.done) {
            break;
        }
        p = __ival_p.value;
        if (p.flag&MResFlags.SELECT)
          ud.push(compose_id(seg.eid, p.id));
      }
    }
    window.redraw_viewport();
  }, function undo(ctx) {
    var spline=ctx.spline;
    var actlayer=spline.layerset.active;
    var level=this._undo_level;
    if (!has_multires(spline))
      return ;
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      if (seg.hidden)
        continue;
      if (!(actlayer.id in seg.layers))
        continue;
      var mr=seg.cdata.get_layer(MultiResLayer);
      var __iter_p=__get_iter(mr.points(level));
      var p;
      while (1) {
        var __ival_p=__iter_p.next();
        if (__ival_p.done) {
            break;
        }
        p = __ival_p.value;
        p.flag&=~MResFlags.SELECT;
        p.flag&=~MResFlags.HIGHLIGHT;
      }
    }
    for (var i=0; i<this._undo.length; i++) {
        var id=this._undo[i];
        var seg=decompose_id(id)[0];
        var p=decompose_id(id)[1];
        seg = spline.eidmap[seg];
        if (seg==undefined) {
            console.trace("Eek! bad seg eid!", seg, p, id, this, this._undo);
            continue;
        }
        var mr=seg.cdata.get_layer(MultiResLayer);
        p = mr.get(p);
        p.flag|=MResFlags.SELECT;
    }
    window.redraw_viewport();
  }]);
  _es6_module.add_class(SelectOpBase);
  SelectOpBase.inputs = {level: new IntProperty(0)}
  var ToggleSelectAll=_ESClass("ToggleSelectAll", SelectOpBase, [function ToggleSelectAll(actlevel) {
    if (actlevel==undefined) {
        actlevel = 0;
    }
    SelectOpBase.call(this, actlevel, "Select All", "Select all/none");
  }, function can_call(ctx) {
    var spline=ctx.spline;
    return has_multires(spline);
  }, function exec(ctx) {
    var spline=ctx.spline;
    var actlayer=spline.layerset.active;
    var level=this.inputs.level.data;
    if (!has_multires(spline))
      return ;
    var totsel=0;
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      if (seg.hidden)
        continue;
      if (!(actlayer.id in seg.layers))
        continue;
      var mr=seg.cdata.get_layer(MultiResLayer);
      var __iter_p=__get_iter(mr.points(level));
      var p;
      while (1) {
        var __ival_p=__iter_p.next();
        if (__ival_p.done) {
            break;
        }
        p = __ival_p.value;
        if (p.flag&MResFlags.HIDE)
          continue;
        totsel+=p.flag&MResFlags.SELECT;
      }
    }
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      if (seg.hidden)
        continue;
      if (!(actlayer.id in seg.layers))
        continue;
      var mr=seg.cdata.get_layer(MultiResLayer);
      var __iter_p=__get_iter(mr.points(level));
      var p;
      while (1) {
        var __ival_p=__iter_p.next();
        if (__ival_p.done) {
            break;
        }
        p = __ival_p.value;
        if (p.flag&MResFlags.HIDE)
          continue;
        if (totsel)
          p.flag&=~MResFlags.SELECT;
        else 
          p.flag|=MResFlags.SELECT;
      }
    }
  }]);
  _es6_module.add_class(ToggleSelectAll);
  ToggleSelectAll = _es6_module.add_export('ToggleSelectAll', ToggleSelectAll);
  ToggleSelectAll.inputs = {level: new IntProperty(0)}
  var SelectOneOp=_ESClass("SelectOneOp", SelectOpBase, [function SelectOneOp(pid, unique, mode, level) {
    if (pid==undefined) {
        pid = undefined;
    }
    if (unique==undefined) {
        unique = true;
    }
    if (mode==undefined) {
        mode = true;
    }
    if (level==undefined) {
        level = 0;
    }
    SelectOpBase.call(this, level, "Select One", "select one element");
    this.inputs.unique.set_data(unique);
    this.inputs.state.set_data(mode);
    if (pid!=undefined)
      this.inputs.pid.set_data(pid);
  }, function exec(ctx) {
    var spline=ctx.spline;
    var actlayer=spline.layerset.active;
    var id=this.inputs.pid.data;
    var level=this.inputs.level.data;
    var seg=decompose_id(id)[0];
    var p=decompose_id(id)[1];
    seg = spline.eidmap[seg];
    var mr=seg.cdata.get_layer(MultiResLayer);
    p = mr.get(p);
    if (this.inputs.unique.data) {
        var __iter_seg2=__get_iter(spline.segments);
        var seg2;
        while (1) {
          var __ival_seg2=__iter_seg2.next();
          if (__ival_seg2.done) {
              break;
          }
          seg2 = __ival_seg2.value;
          if (seg2.hidden)
            continue;
          if (!(actlayer.id in seg2.layers))
            continue;
          var mr2=seg2.cdata.get_layer(MultiResLayer);
          var __iter_p2=__get_iter(mr2.points(level));
          var p2;
          while (1) {
            var __ival_p2=__iter_p2.next();
            if (__ival_p2.done) {
                break;
            }
            p2 = __ival_p2.value;
            p2.flag&=~SplineFlags.SELECT;
          }
        }
    }
    var state=this.inputs.state.data;
    if (state&&this.inputs.set_active.data) {
        var shared=spline.segments.cdata.get_shared("MultiResLayer");
        shared.active = id;
    }
    if (state) {
        p.flag|=SplineFlags.SELECT;
    }
    else {
      p.flag&=~SplineFlags.SELECT;
    }
  }]);
  _es6_module.add_class(SelectOneOp);
  SelectOneOp = _es6_module.add_export('SelectOneOp', SelectOneOp);
  SelectOneOp.inputs = ToolOp.inherit_inputs(SelectOpBase, {pid: new IntProperty(-1), state: new BoolProperty(true), set_active: new BoolProperty(true), unique: new BoolProperty(true), level: new IntProperty(0)});
}, '/dev/fairmotion/src/editors/viewport/multires/multires_selectops.js');
es6_module_define('multires_transdata', ["spline_multires", "mathlib", "selectmode", "transdata"], function _multires_transdata_module(_es6_module) {
  "use strict";
  var SelMask=es6_import_item(_es6_module, 'selectmode', 'SelMask');
  var compose_id=es6_import_item(_es6_module, 'spline_multires', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, 'spline_multires', 'decompose_id');
  var has_multires=es6_import_item(_es6_module, 'spline_multires', 'has_multires');
  var ensure_multires=es6_import_item(_es6_module, 'spline_multires', 'ensure_multires');
  var MultiResLayer=es6_import_item(_es6_module, 'spline_multires', 'MultiResLayer');
  var iterpoints=es6_import_item(_es6_module, 'spline_multires', 'iterpoints');
  var MResFlags=es6_import_item(_es6_module, 'spline_multires', 'MResFlags');
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var TransDataType=es6_import_item(_es6_module, 'transdata', 'TransDataType');
  var TransDataItem=es6_import_item(_es6_module, 'transdata', 'TransDataItem');
  var $co_kwdo_apply;
  var $co_xgrv_calc_draw_aabb;
  var $co2_L3tO_calc_draw_aabb;
  var $co_2Lsn_aabb;
  var MResTransData=_ESClass("MResTransData", TransDataType, [_ESClass.static(function gen_data(ctx, td, data) {
    var doprop=td.doprop;
    var proprad=td.propradius;
    var spline=ctx.spline;
    var actlayer=spline.layerset.active;
    if (!has_multires(spline))
      return ;
    var actlevel=spline.actlevel;
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      if (!(actlayer.id in seg.layers))
        continue;
      if (seg.hidden)
        continue;
      var mr=seg.cdata.get_layer(MultiResLayer);
      var __iter_p=__get_iter(mr.points(actlevel));
      var p;
      while (1) {
        var __ival_p=__iter_p.next();
        if (__ival_p.done) {
            break;
        }
        p = __ival_p.value;
        if (!(p.flag&MResFlags.SELECT))
          continue;
        p = mr.get(p.id, true);
        var co=new Vector3(p);
        co[2] = 0.0;
        var td=new TransDataItem(p, MResTransData, co);
        data.push(td);
      }
    }
  }), _ESClass.static(function apply(ctx, td, item, mat, w) {
    var p=item.data;
    if (w==0.0)
      return ;
    $co_kwdo_apply.load(item.start_data);
    $co_kwdo_apply[2] = 0.0;
    $co_kwdo_apply.multVecMatrix(mat);
    $co_kwdo_apply.sub(item.start_data).mulScalar(w).add(item.start_data);
    p[0] = $co_kwdo_apply[0];
    p[1] = $co_kwdo_apply[1];
    p.recalc_offset(ctx.spline);
    var seg=ctx.spline.eidmap[p.seg];
    p.mr.recalc_wordscos(seg);
  }), _ESClass.static(function undo_pre(ctx, td, undo_obj) {
    var ud=[];
    var spline=ctx.spline;
    var actlayer=spline.layerset.active;
    var doprop=td.doprop;
    if (!has_multires(spline))
      return ;
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      if (seg.hidden)
        continue;
      if (!(actlayer.id in seg.layers))
        continue;
      var mr=seg.cdata.get_layer(MultiResLayer);
      var __iter_p=__get_iter(mr.points);
      var p;
      while (1) {
        var __ival_p=__iter_p.next();
        if (__ival_p.done) {
            break;
        }
        p = __ival_p.value;
        if (!doprop&&!(p.flag&MResFlags.SELECT))
          continue;
        ud.push(compose_id(seg.eid, p.id));
        ud.push(p[0]);
        ud.push(p[1]);
      }
    }
    undo_obj.mr_undo = ud;
  }), _ESClass.static(function undo(ctx, undo_obj) {
    var ud=undo_obj.mr_undo;
    var spline=ctx.spline;
    var i=0;
    while (i<ud.length) {
      var pid=ud[i++];
      var x=ud[i++];
      var y=ud[i++];
      var seg=decompose_id(pid)[0];
      var p=decompose_id(pid)[1];
      seg = spline.eidmap[seg];
      var mr=seg.cdata.get_layer(MultiResLayer);
      p = mr.get(p);
      p[0] = x;
      p[1] = y;
    }
  }), _ESClass.static(function update(ctx, td) {
  }), _ESClass.static(function calc_prop_distances(ctx, td, data) {
  }), _ESClass.static(function calc_draw_aabb(ctx, td, minmax) {
    $co_xgrv_calc_draw_aabb.zero();
    var pad=15;
    function do_minmax(co) {
      $co2_L3tO_calc_draw_aabb[0] = co[0]-pad;
      $co2_L3tO_calc_draw_aabb[1] = co[1]-pad;
      minmax.minmax($co2_L3tO_calc_draw_aabb);
      $co2_L3tO_calc_draw_aabb[0]+=pad*2.0;
      $co2_L3tO_calc_draw_aabb[1]+=pad*2.0;
      minmax.minmax($co2_L3tO_calc_draw_aabb);
    }
    var spline=ctx.spline;
    for (var i=0; i<td.data.length; i++) {
        var t=td.data[i];
        if (t.type!==MResTransData)
          continue;
        var seg=spline.eidmap[t.data.seg];
        if (seg!=undefined) {
            seg.update_aabb();
            minmax.minmax(seg.aabb[0]);
            minmax.minmax(seg.aabb[1]);
        }
        if (seg.v1.segments.length==2) {
            var seg2=seg.v1.other_segment(seg);
            seg2.update_aabb();
            minmax.minmax(seg2.aabb[0]);
            minmax.minmax(seg2.aabb[1]);
        }
        if (seg.v2.segments.length==2) {
            var seg2=seg.v2.other_segment(seg);
            seg2.update_aabb();
            minmax.minmax(seg2.aabb[0]);
            minmax.minmax(seg2.aabb[1]);
        }
        $co_xgrv_calc_draw_aabb[0] = t.data[0];
        $co_xgrv_calc_draw_aabb[1] = t.data[1];
        do_minmax($co_xgrv_calc_draw_aabb);
        $co_xgrv_calc_draw_aabb[0]-=t.data.offset[0];
        $co_xgrv_calc_draw_aabb[1]-=t.data.offset[1];
        do_minmax($co_xgrv_calc_draw_aabb);
    }
  }), _ESClass.static(function aabb(ctx, td, item, minmax, selected_only) {
    $co_2Lsn_aabb.zero();
    for (var i=0; i<td.data.length; i++) {
        var t=td.data[i];
        if (t.type!==MResTransData)
          continue;
        $co_2Lsn_aabb[0] = t.data[0];
        $co_2Lsn_aabb[1] = t.data[1];
        minmax.minmax($co_2Lsn_aabb);
    }
  }), function MResTransData() {
    TransDataType.apply(this, arguments);
  }]);
  var $co_kwdo_apply=new Vector3();
  var $co_xgrv_calc_draw_aabb=new Vector3();
  var $co2_L3tO_calc_draw_aabb=[0, 0, 0];
  var $co_2Lsn_aabb=new Vector3();
  _es6_module.add_class(MResTransData);
  MResTransData = _es6_module.add_export('MResTransData', MResTransData);
  MResTransData.selectmode = SelMask.MULTIRES;
}, '/dev/fairmotion/src/editors/viewport/multires/multires_transdata.js');
var g_theme;
es6_module_define('theme', ["struct"], function _theme_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  function darken(c, m) {
    for (var i=0; i<3; i++) {
        c[i]*=m;
    }
    return c;
  }
  darken = _es6_module.add_export('darken', darken);
  var BoxColor=_ESClass("BoxColor", [function BoxColor() {
    this.colors = undefined;
  }, function copy() {
    var ret=new BoxColor();
    ret.colors = JSON.parse(JSON.stringify(this.colors));
    return ret;
  }, _ESClass.static(function fromSTRUCT(reader) {
    return {}
  })]);
  _es6_module.add_class(BoxColor);
  BoxColor = _es6_module.add_export('BoxColor', BoxColor);
  BoxColor.STRUCT = "\n  BoxColor {\n  }\n";
  var BoxColor4=_ESClass("BoxColor4", BoxColor, [function BoxColor4(colors) {
    BoxColor.call(this);
    var clrs=this.colors = [[], [], [], []];
    if (colors==undefined)
      return ;
    for (var i=0; i<4; i++) {
        for (var j=0; j<4; j++) {
            clrs[i].push(colors[i][j]);
        }
    }
  }, function copy() {
    return new BoxColor4(this.colors);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new BoxColor4();
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(BoxColor4);
  BoxColor4 = _es6_module.add_export('BoxColor4', BoxColor4);
  BoxColor4.STRUCT = "\n  BoxColor4 {\n    colors : array(vec4);\n  }\n";
  var BoxWColor=_ESClass("BoxWColor", BoxColor, [function BoxWColor(color, weights) {
    if (color==undefined||weights==undefined)
      return ;
    this.color = [color[0], color[1], color[2], color[3]];
    this.weights = [weights[0], weights[1], weights[2], weights[3]];
  }, _ESClass.get(function colors() {
    var ret=[[], [], [], []];
    var clr=this.color;
    var w=this.weights;
    if (clr==undefined)
      clr = [1, 1, 1, 1];
    for (var i=0; i<4; i++) {
        for (var j=0; j<3; j++) {
            ret[i].push(clr[j]*w[i]);
        }
        ret[i].push(clr[3]);
    }
    return ret;
  }), function copy() {
    return new BoxWColor(this.color, this.weights);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new BoxWColor();
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(BoxWColor);
  BoxWColor = _es6_module.add_export('BoxWColor', BoxWColor);
  BoxWColor.STRUCT = "\n  BoxWColor {\n    color   : vec4;\n    weights : vec4;\n  }\n";
  var ThemePair=_ESClass("ThemePair", [function ThemePair(key, value) {
    this.key = key;
    this.val = value;
  }]);
  _es6_module.add_class(ThemePair);
  ThemePair = _es6_module.add_export('ThemePair', ThemePair);
  var ColorTheme=_ESClass("ColorTheme", [function ColorTheme(defobj) {
    this.colors = new hashtable();
    this.boxcolors = new hashtable();
    if (defobj!==undefined) {
        for (var k in defobj) {
            if (this.colors.has(k)||this.boxcolors.has(k))
              continue;
            var c=defobj[k];
            if (__instance_of(c, BoxColor)) {
                this.boxcolors.set(k, c);
            }
            else {
              this.colors.set(k, c);
            }
        }
    }
    this.flat_colors = new GArray();
  }, function copy() {
    var ret=new ColorTheme({});
    function cpy(c) {
      if (__instance_of(c, BoxColor)) {
          return c.copy();
      }
      else {
        return JSON.parse(JSON.stringify(c));
      }
    }
    var __iter_k=__get_iter(this.boxcolors);
    var k;
    while (1) {
      var __ival_k=__iter_k.next();
      if (__ival_k.done) {
          break;
      }
      k = __ival_k.value;
      var c=this.boxcolors.get(k);
      ret.boxcolors.set(k, cpy(c));
    }
    var __iter_k=__get_iter(this.colors);
    var k;
    while (1) {
      var __ival_k=__iter_k.next();
      if (__ival_k.done) {
          break;
      }
      k = __ival_k.value;
      var c=this.colors.get(k);
      ret.colors.set(k, cpy(c));
    }
    ret.gen_colors();
    return ret;
  }, function patch(newtheme) {
    if (newtheme==undefined)
      return ;
    var ks=new set(newtheme.colors.keys()).union(newtheme.boxcolors.keys());
    var __iter_k=__get_iter(this.colors);
    var k;
    while (1) {
      var __ival_k=__iter_k.next();
      if (__ival_k.done) {
          break;
      }
      k = __ival_k.value;
      if (!ks.has(k)) {
          newtheme.colors.set(k, this.colors.get(k));
      }
    }
    var __iter_k=__get_iter(this.boxcolors);
    var k;
    while (1) {
      var __ival_k=__iter_k.next();
      if (__ival_k.done) {
          break;
      }
      k = __ival_k.value;
      if (!ks.has(k)) {
          newtheme.boxcolors.set(k, this.boxcolors.get(k));
      }
    }
    newtheme.gen_colors();
  }, function gen_code() {
    var s="new ColorTheme({\n";
    var arr=this.flat_colors;
    for (var i=0; i<arr.length; i++) {
        var item=arr[i];
        if (i>0)
          s+=",";
        s+="\n";
        if (__instance_of(item[1], BoxWColor)) {
            s+='  "'+item[0]+'" : ui_weight_clr(';
            s+=JSON.stringify(item[1].color);
            s+=",";
            s+=JSON.stringify(item[1].weights);
            s+=")";
        }
        else 
          if (__instance_of(item[1], BoxColor4)) {
            s+='  "'+item[0]+'" : new BoxColor4(';
            s+=JSON.stringify(item[1].colors);
            s+=")";
        }
        else {
          s+='  "'+item[0]+'" : '+JSON.stringify(item[1]);
        }
    }
    s+="});";
    return s;
  }, function gen_colors() {
    var ret={}
    this.flat_colors = new GArray();
    var __iter_k=__get_iter(this.colors);
    var k;
    while (1) {
      var __ival_k=__iter_k.next();
      if (__ival_k.done) {
          break;
      }
      k = __ival_k.value;
      var c1=this.colors.get(k), c2=[0, 0, 0, 0];
      for (var i=0; i<4; i++) {
          c2[i] = c1[i];
      }
      ret[k] = c2;
      this.flat_colors.push([k, c1]);
    }
    var __iter_k=__get_iter(this.boxcolors);
    var k;
    while (1) {
      var __ival_k=__iter_k.next();
      if (__ival_k.done) {
          break;
      }
      k = __ival_k.value;
      ret[k] = this.boxcolors.get(k).colors;
      this.flat_colors.push([k, this.boxcolors.get(k)]);
    }
    return ret;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var c=new ColorTheme({});
    reader(c);
    var ks=c.colorkeys;
    for (var i=0; i<ks.length; i++) {
        c.colors.set(ks[i], c.colorvals[i]);
    }
    var ks=c.boxkeys;
    for (var i=0; i<ks.length; i++) {
        c.boxcolors.set(ks[i], c.boxvals[i]);
    }
    delete c.colorkeys;
    delete c.boxkeys;
    delete c.colorvals;
    delete c.boxvals;
    return c;
  })]);
  _es6_module.add_class(ColorTheme);
  ColorTheme = _es6_module.add_export('ColorTheme', ColorTheme);
  ColorTheme.STRUCT = "\n  ColorTheme {\n    colorkeys : array(string) | obj.colors.keys();\n    colorvals : array(vec4) | obj.colors.values();\n    boxkeys : array(string) | obj.boxcolors.keys();\n    boxvals : array(abstract(BoxColor)) | obj.boxcolors.values();\n  }\n";
  window.menu_text_size = IsMobile ? 14 : 14;
  window.default_ui_font_size = 16;
  window.ui_hover_time = 800;
  function ui_weight_clr(clr, weights) {
    return new BoxWColor(clr, weights);
  }
  ui_weight_clr = _es6_module.add_export('ui_weight_clr', ui_weight_clr);
  window.uicolors = {}
  window.colors3d = {}
  var Theme=_ESClass("Theme", [function Theme(ui, view2d) {
    this.ui = ui;
    this.view2d = view2d;
  }, function patch(theme) {
    this.ui.patch(theme.ui);
  }, function gen_code() {
    var s='"use strict";\n/*auto-generated file*/\nvar UITheme = '+this.ui.gen_code()+"\n";
    return s;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new Theme();
    reader(ret);
    return ret;
  }), function gen_globals() {
    
    uicolors = this.ui.gen_colors();
  }]);
  _es6_module.add_class(Theme);
  Theme = _es6_module.add_export('Theme', Theme);
  Theme.STRUCT = "\n  Theme {\n    ui     : ColorTheme;\n    view2d : ColorTheme;\n  }\n";
  
  window.init_theme = function() {
    window.UITheme.original = window.UITheme.copy();
    window.View2DTheme.original = window.View2DTheme.copy();
    window.g_theme = new Theme(window.UITheme, window.View2DTheme);
    window.g_theme.gen_globals();
  }
  function reload_default_theme() {
    window.g_theme = new Theme(window.UITheme.original.copy(), window.View2DTheme.original.copy());
    window.g_theme.gen_globals();
  }
  reload_default_theme = _es6_module.add_export('reload_default_theme', reload_default_theme);
}, '/dev/fairmotion/src/ui/theme.js');
es6_module_define('theme_def', ["theme"], function _theme_def_module(_es6_module) {
  "use strict";
  var ColorTheme=es6_import_item(_es6_module, 'theme', 'ColorTheme');
  var ui_weight_clr=es6_import_item(_es6_module, 'theme', 'ui_weight_clr');
  var BoxColor4=es6_import_item(_es6_module, 'theme', 'BoxColor4');
  function uniformbox4(clr) {
    return new BoxColor4([clr, clr, clr, clr]);
  }
  window.UITheme = new ColorTheme({"ErrorText": [1, 0.20000000298023224, 0.20000000298023224, 0.8899999856948853], "ListBoxText": [0.20000000298023224, 0.20000000298023224, 0.20000000298023224, 1], "MenuHighlight": [0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1], "RadialMenu": [1, 0, 0, 1], "RadialMenuHighlight": [0.7831560373306274, 0.7664570808410645, 0.3468262255191803, 0.7717778086662292], "DefaultLine": [0.4163331985473633, 0.3746998906135559, 0.3746998906135559, 1], "SelectLine": [0.699999988079071, 0.699999988079071, 0.699999988079071, 1], "Check": [0.8999999761581421, 0.699999988079071, 0.4000000059604645, 1], "Arrow": [0.4000000059604645, 0.4000000059604645, 0.4000000059604645, 1], "DefaultText": [0.9092121124267578, 0.9092121124267578, 0.9092121124267578, 1], "BoxText": [0, 0, 0, 1], "HotkeyText": [0.43986162543296814, 0.43986162543296814, 0.43986162543296814, 1], "HighlightCursor": [0.8999999761581421, 0.8999999761581421, 0.8999999761581421, 0.875], "TextSelect": [0.4000000059604645, 0.4000000059604645, 0.4000000059604645, 0.75], "TextEditCursor": [0.10000000149011612, 0.10000000149011612, 0.10000000149011612, 1], "TextBoxHighlight": [0.5270000100135803, 0.5270000100135803, 0.5270000100135803, 1], "MenuSep": [0.6901277303695679, 0.6901277303695679, 0.6901277303695679, 1], "MenuBorder": [0.6499999761581421, 0.6499999761581421, 0.6499999761581421, 1], "RadialMenuSep": [0.10000000149011612, 0.20000000298023224, 0.20000000298023224, 1], "TabPanelOutline": [0.24494896829128265, 0.24494896829128265, 0.24494896829128265, 1], "TabPanelBG": [0.47600001096725464, 0.47600001096725464, 0.47600001096725464, 1], "ActiveTab": [0.47600001096725464, 0.47600001096725464, 0.47600001096725464, 1], "HighlightTab": [0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 0.8999999761581421], "InactiveTab": [0.24494896829128265, 0.24494896829128265, 0.24494896829128265, 1], "TabText": [0.930949330329895, 0.930949330329895, 0.930949330329895, 1], "IconBox": [1, 1, 1, 0.17968888580799103], "HighlightIcon": [0.30000001192092896, 0.8149344325065613, 1, 0.21444444358348846], "MenuText": [0.10000000149011612, 0.10000000149011612, 0.10000000149011612, 1], "MenuTextHigh": [0.9330000281333923, 0.9330000281333923, 0.9330000281333923, 1], "PanelText": [0, 0, 0, 1], "DialogText": [0.05000003054738045, 0.05000000447034836, 0.05000000447034836, 1], "DialogBorder": [0.4000000059604645, 0.40000003576278687, 0.4000000059604645, 1], "DisabledBox": [0.5, 0.5, 0.5, 1], "IconCheckBG": [0.587992250919342, 0.587992250919342, 0.587992250919342, 1], "IconCheckSet": [0.6324555320336759, 0.6324555320336759, 0.6324555320336759, 1], "IconCheckUnset": [0.565685424949238, 0.565685424949238, 0.565685424949238, 1], "IconEnumBG": [0.587992250919342, 0.587992250919342, 0.587992250919342, 1], "IconEnumSet": [0.3324555320336759, 0.3324555320336759, 0.3324555320336759, 1], "IconEnumUnset": [0.565685424949238, 0.565685424949238, 0.565685424949238, 1], "Highlight": new BoxColor4([[0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1], [0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1], [0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1], [0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1]]), "NoteBox": ui_weight_clr([0.800000011920929, 0.800000011920929, 0.800000011920929, 1], [0.800000011920929, 0.800000011920929, 0.800000011920929, 1]), "Box": ui_weight_clr([0.9399999976158142, 0.9399999976158142, 0.9399999976158142, 1], [0.800000011920929, 0.800000011920929, 0.800000011920929, 1]), "HoverHint": ui_weight_clr([1, 0.9769999980926514, 0.8930000066757202, 0.8999999761581421], [0.8999999761581421, 0.8999999761581421, 1, 1]), "ErrorBox": ui_weight_clr([1, 0.30000001192092896, 0.20000000298023224, 1], [1, 1, 1, 1]), "ErrorTextBG": ui_weight_clr([1, 1, 1, 1], [0.8999999761581421, 0.8999999761581421, 1, 1]), "ShadowBox": ui_weight_clr([0, 0, 0, 0.10000000149011612], [1, 1, 1, 1]), "ProgressBar": ui_weight_clr([0.4000000059604645, 0.7300000190734863, 0.8999999761581421, 0.8999999761581421], [0.75, 0.75, 1, 1]), "ProgressBarBG": ui_weight_clr([0.699999988079071, 0.699999988079071, 0.699999988079071, 0.699999988079071], [1, 1, 1, 1]), "WarningBox": ui_weight_clr([1, 0.800000011920929, 0.10000000149011612, 0.8999999761581421], [0.699999988079071, 0.800000011920929, 1.0499999523162842, 1]), "ListBoxBG": ui_weight_clr([0.9399999976158142, 0.9399999976158142, 0.9399999976158142, 1], [0.9399999976158142, 0.9399999976158142, 0.9399999976158142, 1]), "InvBox": ui_weight_clr([0.6000000238418579, 0.6000000238418579, 0.6000000238418579, 1], [0.6000000238418579, 0.6000000238418579, 0.6000000238418579, 1]), "HLightBox": new BoxColor4([[0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1], [0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1], [0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1], [0.5686200261116028, 0.7882000207901001, 0.9602000117301941, 1]]), "ActivePanel": ui_weight_clr([0.800000011920929, 0.4000000059604645, 0.30000001192092896, 0.8999999761581421], [1, 1, 1, 1]), "CollapsingPanel": ui_weight_clr([0.687468409538269, 0.687468409538269, 0.687468409538269, 1], [1, 1, 1, 1]), "SimpleBox": ui_weight_clr([0.4760952293872833, 0.4760952293872833, 0.4760952293872833, 1], [0.9399999976158142, 0.9399999976158142, 0.9399999976158142, 1]), "DialogBox": ui_weight_clr([0.7269999980926514, 0.7269999980926514, 0.7269999980926514, 1], [1, 1, 1, 1]), "DialogTitle": ui_weight_clr([0.6299999952316284, 0.6299999952316284, 0.6299999952316284, 1], [1, 1, 1, 1]), "MenuBox": ui_weight_clr([0.9200000166893005, 0.9200000166893005, 0.9200000166893005, 1], [1, 1, 1, 1]), "TextBox": ui_weight_clr([0.800000011920929, 0.800000011920929, 0.800000011920929, 0.8999999761581421], [1, 1, 1, 1]), "TextBoxInv": ui_weight_clr([0.699999988079071, 0.699999988079071, 0.699999988079071, 1], [0.699999988079071, 0.699999988079071, 0.699999988079071, 1]), "MenuLabel": ui_weight_clr([0.9044828414916992, 0.8657192587852478, 0.8657192587852478, 0.24075555801391602], [0.6000000238418579, 0.6000000238418579, 0.6000000238418579, 0.8999999761581421]), "MenuLabelInv": ui_weight_clr([0.75, 0.75, 0.75, 0.47111111879348755], [1, 1, 0.9410666823387146, 1]), "ScrollBG": ui_weight_clr([0.800000011920929, 0.800000011920929, 0.800000011920929, 1], [1, 1, 1, 1]), "ScrollBar": ui_weight_clr([0.5919697284698486, 0.5919697284698486, 0.5919697284698486, 1], [1, 1, 1, 1]), "ScrollBarHigh": ui_weight_clr([0.6548083424568176, 0.6548083424568176, 0.6548083424568176, 1], [1, 1, 1, 1]), "ScrollButton": ui_weight_clr([0.800000011920929, 0.800000011920929, 0.800000011920929, 1], [1, 1, 1, 1]), "ScrollButtonHigh": ui_weight_clr([0.75, 0.75, 0.75, 1], [1, 1, 1, 1]), "ScrollInv": ui_weight_clr([0.4000000059604645, 0.4000000059604645, 0.4000000059604645, 1], [1, 1, 1, 1]), "IconInv": ui_weight_clr([0.48299384117126465, 0.5367956161499023, 0.8049896955490112, 0.4000000059604645], [1, 1, 1, 1])});
  window.View2DTheme = new ColorTheme({"Background": [1, 1, 1, 1], "ActiveObject": [0.800000011920929, 0.6000000238418579, 0.30000001192092896, 1], "Selection": [0.699999988079071, 0.4000000059604645, 0.10000000149011612, 1], "GridLineBold": [0.38, 0.38, 0.38, 1.0], "GridLine": [0.5, 0.5, 0.5, 1.0], "AxisX": [0.9, 0.0, 0.0, 1.0], "AxisY": [0.0, 0.9, 0.0, 1.0], "AxisZ": [0.0, 0.0, 0.9, 1.0]});
}, '/dev/fairmotion/src/ui/theme_def.js');
es6_module_define('UIElement', ["mathlib", "toolprops", "events"], function _UIElement_module(_es6_module) {
  es6_import(_es6_module, 'events');
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var EventHandler=es6_import_item(_es6_module, 'events', 'EventHandler');
  var charmap=es6_import_item(_es6_module, 'events', 'charmap');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var UIFlags={ENABLED: 1, HIGHLIGHT: 2, FOCUS: 4, GREYED: 8, REDERROR: 16, WARNING: 32, USE_PATH: 64, NO_RECALC: 128, FLASH: (16|32), SKIP_DRAW: 256, HAS_PAN: 512, USE_PAN: 1024, PAN_CANVAS_MAT: 2048, IS_CANVAS_ROOT: 4096, NO_FRAME_CACHE: (1<<14), INVISIBLE: (1<<15), IGNORE_PAN_BOUNDS: (1<<16), BLOCK_REPAINT: (1<<17), NO_VELOCITY_PAN: (1<<18), BG_EVENTS_TRANSPARENT: (1<<19), CLIP_CONTENTS: (1<<20)}
  UIFlags = _es6_module.add_export('UIFlags', UIFlags);
  var PackFlags={INHERIT_HEIGHT: 1, INHERIT_WIDTH: 2, ALIGN_RIGHT: 4, ALIGN_LEFT: 8, ALIGN_CENTER: 16, ALIGN_BOTTOM: 32, IGNORE_LIMIT: 64, NO_REPACK: 128, UI_DATAPATH_IGNORE: 256, USE_ICON: 1024|2048, USE_SMALL_ICON: 1024, USE_LARGE_ICON: 2048, ENUM_STRIP: 4096, NO_AUTO_SPACING: 8192, ALIGN_CENTER_Y: 16384, ALIGN_CENTER_X: 32768, FLIP_TABSTRIP: 65536, NO_LEAD_SPACING: (1<<17), NO_TRAIL_SPACING: (1<<18), KEEP_SIZE: (1<<19), _KEEPSIZE: ((1<<19)|128), ALIGN_TOP: (1<<20), CALC_NEGATIVE_PAN: (1<<21), PAN_X_ONLY: (1<<22), PAN_Y_ONLY: (1<<23), VERTICAL: (1<<24), COLOR_BUTTON_ONLY: (1<<25)}
  PackFlags = _es6_module.add_export('PackFlags', PackFlags);
  var CanvasFlags={NOT_ROOT: 1, NO_PROPEGATE: 2}
  CanvasFlags = _es6_module.add_export('CanvasFlags', CanvasFlags);
  window.CanvasFlags = CanvasFlags;
  var _ui_element_id_gen=1;
  function open_mobile_keyboard(e, on_close) {
    if (on_close==undefined) {
        on_close = function() {
        };
    }
    if (IsMobile||DEBUG.screen_keyboard)
      call_keyboard(e, on_close);
  }
  open_mobile_keyboard = _es6_module.add_export('open_mobile_keyboard', open_mobile_keyboard);
  function close_mobile_keyboard(e) {
    if (IsMobile||DEBUG.screen_keyboard)
      end_keyboard(e);
  }
  close_mobile_keyboard = _es6_module.add_export('close_mobile_keyboard', close_mobile_keyboard);
  var _inrect_2d_button_tmps=[new Vector2(), new Vector2()];
  function inrect_2d_button(p, pos, size) {
    let pos2=_inrect_2d_button_tmps[0], size2=_inrect_2d_button_tmps[1];
    if (g_app_state.was_touch) {
        pos2.load(pos);
        size2.load(size);
        pos2.subScalar(fuzzy_ui_press_hotspot);
        size2.addScalar(fuzzy_ui_press_hotspot*2.0);
        return inrect_2d(p, pos2, size2);
    }
    else {
      return inrect_2d(p, pos, size);
    }
  }
  inrect_2d_button = _es6_module.add_export('inrect_2d_button', inrect_2d_button);
  var $empty_arr_N8nx_get_keymaps;
  var $pos_Vsrw_get_abs_pos;
  var $ret_9lEz_get_min_size;
  var UIElement=_ESClass("UIElement", EventHandler, [function UIElement(ctx, path, pos, size) {
    if (path==undefined) {
        path = undefined;
    }
    if (pos==undefined) {
        pos = undefined;
    }
    if (size==undefined) {
        size = undefined;
    }
    EventHandler.call(this);
    this.defunct = false;
    this._uiel_id = _ui_element_id_gen++;
    this.fake_push_modal = 0;
    this.description = "";
    this.dirty = [[0, 0], [0, 0]];
    this.last_dirty = [[0, 0], [0, 0]];
    this.dirty_flag = 0;
    this.abspos = [0, 0];
    this._minsize = [0, 0];
    this._h12 = undefined;
    this.state = UIFlags.ENABLED;
    this.packflag = 0;
    this.data_path = path;
    this.ctx = ctx;
    this.parent = undefined;
    this.flash_timer_len = 650;
    this.status_timer = undefined;
    this.flash_ival = 20;
    this.last_flash = 0;
    this.pos = [0, 0];
    this.size = [0, 0];
    if (pos!=undefined) {
        this.pos[0] = pos[0];
        this.pos[1] = pos[1];
    }
    if (size!=undefined) {
        this.size[0] = size[0];
        this.size[1] = size[1];
    }
    this.recalc = 0;
    this.recalc_minsize = 0;
    if (path!=undefined) {
        this.state|=UIFlags.USE_PATH;
    }
  }, function disable() {
    if ((this.state&UIFlags.ENABLED))
      this.do_recalc();
    this.state&=~UIFlags.ENABLED;
  }, function enable() {
    if (!(this.state&UIFlags.ENABLED))
      this.do_recalc();
    this.state|=UIFlags.ENABLED;
  }, function get_keymaps() {
    return $empty_arr_N8nx_get_keymaps;
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    if (this._h12==undefined) {
        var n=this.constructor.name;
        if (n==undefined)
          n = "evil_ie_bug";
        this._h12 = n[2]+n[3]+n[n.length-2]+n[n.length-1]+this._uiel_id.toString();
    }
    return this._h12;
  }), function set_context(ctx) {
    this.ctx = ctx;
  }, function inc_flash_timer(color) {
    if (this.status_timer==undefined) {
        this.state&=~UIFlags.FLASH;
        return false;
    }
    if (this.status_timer.ready()) {
        this.status_timer = undefined;
        this.state&=~UIFlags.FLASH;
        return false;
    }
    return true;
  }, function do_flash_color(color) {
    this.inc_flash_timer();
    if (!(this.state&UIFlags.FLASH))
      return color;
    var color2;
    if (this.state&UIFlags.REDERROR)
      color2 = uicolors["ErrorBox"];
    else 
      if (this.state&UIFlags.WARNING)
      color2 = uicolors["WarningBox"];
    if (color==undefined)
      color = color2;
    if (color2==undefined)
      return undefined;
    var f=this.status_timer.normval;
    if (f<0.5)
      f*=2.0;
    else 
      (f = 1.0-f)*2.0;
    var alen=color.length;
    var l1=objcache.array(alen), l2=objcache.array(alen);
    l1.length = 0;
    l2.length = 0;
    if (typeof (color[0])=="number") {
        l1.push(color);
    }
    else {
      for (var i=0; i<color.length; i++) {
          l1.push(color[i]);
      }
    }
    if (typeof (color2[0])=="number") {
        l2.push(color2);
    }
    else {
      for (var i=0; i<color2.length; i++) {
          l2.push(color2[i]);
      }
    }
    while (l1.length<l2.length) {
      l1.push(l1[l1.length-1]);
    }
    while (l2.length<l1.length) {
      l2.push(l2[l2.length-1]);
    }
    var l3=objcache.array(l1.length);
    l3.length = 0;
    for (var i=0; i<l1.length; i++) {
        var clr=new Vector4(l1[i]);
        clr.interp(l2[i], f);
        l3.push(clr);
    }
    if (l3.length==1)
      return l3[0];
    else 
      return l3;
  }, function flash(status) {
    if (status==undefined) {
        status = UIFlags.REDERROR;
    }
    console.log("flash!", status);
    this.status_timer = new Timer(this.flash_timer_len);
    this.state|=status;
    this.do_recalc();
  }, function focus() {
    if (this.parent!=undefined)
      this.parent.focus(this);
  }, function get_abs_pos() {
    $pos_Vsrw_get_abs_pos[0] = this.pos[0];
    $pos_Vsrw_get_abs_pos[1] = this.pos[1];
    var p=this.parent;
    while (p!=undefined) {
      $pos_Vsrw_get_abs_pos[0]+=p.pos[0];
      $pos_Vsrw_get_abs_pos[1]+=p.pos[1];
      p = p.parent;
    }
    return $pos_Vsrw_get_abs_pos;
  }, function call_menu(menu, off, min_width) {
    if (off==undefined) {
        off = undefined;
    }
    if (min_width==undefined) {
        min_width = 20;
    }
    if (off==undefined) {
        off = [0, 0];
    }
    var frame;
    if (this.parent==undefined) {
        frame = this;
    }
    else {
      frame = this.parent;
    }
    this.abs_transform(off);
    while (frame.parent!=undefined) {
      frame = frame.parent;
    }
    ui_call_menu(menu, frame, off, false, min_width);
  }, function set_prop_data(data, undo_push) {
    if (undo_push==undefined) {
        undo_push = true;
    }
    if (this.path_is_bad)
      return ;
    var ctx=this.ctx;
    var setpath=this.setter_path!=undefined ? this.setter_path : this.data_path;
    var prop=ctx.api.get_prop_meta(ctx, this.data_path);
    if (prop.flag&TPropFlags.USE_UNDO)
      g_app_state.toolstack.exec_datapath(ctx, setpath, data, undo_push);
    else 
      ctx.api.set_prop(ctx, setpath, data);
  }, function get_prop_data() {
    var ctx=this.ctx;
    var bad=true, ret=undefined;
    try {
      ret = ctx.api.get_prop(ctx, this.data_path);
      bad = false;
    }
    catch (err) {
        if (DEBUG.ui_datapaths) {
            console.trace("Got error");
            print_stack(err);
        }
        ret = 0;
    }
    if (this.path_is_bad!=bad) {
        this.do_recalc();
    }
    this.path_is_bad = bad;
    if (bad)
      this.disable();
    else 
      this.enable();
    return ret;
  }, function get_prop_meta() {
    var ctx=this.ctx;
    return ctx.api.get_prop_meta(ctx, this.data_path);
  }, function do_recalc() {
    window.redraw_ui();
    if (this.state&UIFlags.BLOCK_REPAINT)
      return ;
    this.recalc = 1;
    this.recalc_minsize = 1;
    if (this.parent!=undefined)
      this.parent.do_recalc();
    else 
      if (DEBUG.complex_ui_recalc&&Math.random()>0.99)
      console.trace("leaf ui call");
  }, function abs_transform(pos) {
    var e=this;
    while (e!=undefined) {
      pos[0]+=e.pos[0];
      pos[1]+=e.pos[1];
      if ((e.state&UIFlags.HAS_PAN)) {
          pos[0]+=e.velpan.pan[0];
          pos[1]+=e.velpan.pan[1];
      }
      e = e.parent;
    }
  }, function push_modal(e) {
    if (e==undefined) {
        this.fake_push_modal++;
        this.parent.push_modal(this);
    }
    else {
      EventHandler.prototype.push_modal.call(this, e);
      if (this.parent!=undefined) {
          this.parent.push_modal(this);
      }
    }
  }, function pop_modal() {
    if (this.fake_push_modal) {
        this.fake_push_modal--;
        this.parent.pop_modal();
        return ;
    }
    EventHandler.prototype.pop_modal.call(this);
    if (this.parent!=undefined)
      this.parent.pop_modal();
  }, function get_canvas() {
    var frame=this;
    while (frame.parent!=undefined&&frame.canvas==undefined) {
      frame = frame.parent;
    }
    return frame.canvas;
  }, function is_canvas_root() {
    var ret=this.parent==undefined||(this.canvas!=undefined&&this.parent.get_canvas()!=this.canvas);
    ret = ret||this.state&UIFlags.IS_CANVAS_ROOT;
    ret = ret||__instance_of(this, ScreenArea);
    ret = ret||__instance_of(this, Area);
    ret = ret&&this.canvas!=undefined;
    ret = ret&&!(this.canvas.flag&CanvasFlags.NOT_ROOT);
    return ret;
  }, function get_hint() {
    if (this.description==""&&(this.state&UIFlags.USE_PATH)) {
        var prop=this.get_prop_meta();
        return prop.description!="" ? prop.description : undefined;
    }
    else {
      return this.description;
    }
  }, function start_pan(start_mpos, button, last_mpos) {
    if (button==undefined) {
        button = 0;
    }
    if (last_mpos==undefined) {
        last_mpos = undefined;
    }
    if (!(this.state&UIFlags.HAS_PAN)) {
        if (this.parent==undefined) {
            console.trace();
            console.log("Warning: UIFrame.start_pan: no parent frame with pan support");
        }
        else {
          if (start_mpos!=undefined) {
              start_mpos[0]+=this.pos[0];
              start_mpos[1]+=this.pos[1];
          }
          if (last_mpos!=undefined) {
              last_mpos[0]+=this.pos[0];
              last_mpos[1]+=this.pos[1];
          }
          this.parent.start_pan(start_mpos, button, last_mpos);
        }
    }
  }, function get_filedata() {
    return undefined;
  }, function load_filedata(map) {
  }, function get_uhash() {
    var s=this.constructor.name;
    if (s==undefined)
      s = "";
    if (this.data_path!=undefined) {
        s+=this.data_path;
    }
    if (this.parent!=undefined) {
        s = this.parent.get_uhash()+s;
    }
    return s;
  }, function on_tick() {
    if (time_ms()-this.last_flash>this.flash_ival&&(this.state&UIFlags.FLASH)) {
        this.do_recalc();
        this.last_flash = time_ms();
        this.inc_flash_timer();
    }
    EventHandler.prototype.on_tick.call(this);
  }, function on_keydown(event) {
  }, function on_keyup(event) {
  }, function on_mousemove(event) {
  }, function on_mousedown(event) {
  }, function on_mousewheel(event) {
  }, function on_mouseup(event) {
  }, function on_contextchange(event) {
  }, function update_data(ctx) {
  }, function cached_min_size(canvas, isVertical) {
    if (this.recalc_minsize) {
        this.recalc_minsize = 0;
        var ret=this.get_min_size(canvas, isVertical);
        this._minsize[0] = ret[0];
        this._minsize[1] = ret[1];
    }
    return this._minsize;
  }, function get_min_size(canvas, isvertical) {
    return $ret_9lEz_get_min_size;
  }, function build_draw(canvas, isvertical) {
  }, function on_active() {
  }, function on_inactive() {
  }, function pack(canvas, isvertical) {
  }, function gen_tooltip() {
  }, function on_add(parent) {
  }, function on_remove(parent) {
  }]);
  var $empty_arr_N8nx_get_keymaps=[];
  var $pos_Vsrw_get_abs_pos=[0, 0];
  var $ret_9lEz_get_min_size=[1, 1];
  _es6_module.add_class(UIElement);
  UIElement = _es6_module.add_export('UIElement', UIElement);
  var UIHoverBox=_ESClass("UIHoverBox", UIElement, [function UIHoverBox(ctx, text, is_modal, pos, size) {
    UIElement.call(this, ctx, undefined, pos, size);
    this.is_modal = is_modal;
    this.text = text;
    this.packflag|=PackFlags.NO_REPACK;
  }, function get_min_size(UICanvas, isVertical) {
    return this.size;
  }, function on_mousedown(event) {
    if (this.is_modal) {
        this.pop_modal();
        var mpos=[event.x, event.y];
        var p=this, lastp;
        while (p!=undefined) {
          lastp = p;
          mpos[0]+=p.pos[0];
          mpos[1]+=p.pos[1];
          p = p.parent;
        }
        this.parent.remove(this);
        this.parent.do_recalc();
        event.x = mpos[0];
        event.y = mpos[1];
        lastp._on_mousedown(event);
    }
  }, function _on_mousedown(event) {
    if (this.state&UIFlags.ENABLED)
      this.on_mousedown(event);
  }, function _on_mousemove(event) {
    if (this.state&UIFlags.ENABLED)
      this.on_mousemove(event);
  }, function _on_mouseup(event) {
    if (this.state&UIFlags.ENABLED)
      this.on_mouseup(event);
  }, function _on_keydown(event) {
    if (this.state&UIFlags.ENABLED)
      this.on_keydown(event);
  }, function _on_keyup(event) {
    if (this.state&UIFlags.ENABLED)
      this.on_keyup(event);
  }, function on_mousemove(event) {
    if (this.is_modal&&!inrect_2d([event.x, event.y], [0, 0], this.size)) {
        this.pop_modal();
        this.parent.remove(this);
        this.parent.do_recalc();
    }
  }, function build_draw(canvas, isVertical) {
    canvas.begin(this);
    canvas.shadow_box([0, 0], this.size);
    var size=IsMobile ? this.size : [this.size[0], this.size[1]];
    canvas.box([0, 0], size, uicolors["HoverHint"]);
    canvas.text([4, 7], this.text, uicolors["BoxText"]);
    canvas.end(this);
  }]);
  _es6_module.add_class(UIHoverBox);
  UIHoverBox = _es6_module.add_export('UIHoverBox', UIHoverBox);
  var UIHoverHint=_ESClass("UIHoverHint", UIElement, [function UIHoverHint(ctx, path, pos, size) {
    if (path==undefined) {
        path = undefined;
    }
    if (pos==undefined) {
        pos = undefined;
    }
    if (size==undefined) {
        size = undefined;
    }
    
    UIElement.call(this, ctx, path, pos, size);
    this.start_time = 0;
    this.hover_time = ui_hover_time;
    this.hovering = false;
  }, function start_hover() {
    this.start_time = time_ms();
    this.hovering = true;
  }, function stop_hover() {
    this.hovering = false;
  }, function on_hint(is_modal) {
    if (is_modal==undefined) {
        is_modal = true;
    }
    var hint=this.get_hint();
    console.log("hint: ", hint);
    if (!hint)
      return ;
    if (this.ctx==undefined)
      this.ctx = new Context();
    if (this.get_canvas()==undefined)
      return ;
    var size=new Vector2(this.get_canvas().textsize(hint));
    size.add([8.0, 12.0]);
    var pos=new Vector2([this.pos[0]+4, this.pos[1]-size[1]]);
    var hintbox=new UIHoverBox(this.ctx, hint, is_modal, pos, size);
    var abspos=[0, -size[1]];
    this.abs_transform(abspos);
    var screen=g_app_state.screen;
    var abspos2=[abspos[0], abspos[1]];
    if (abspos[1]<0) {
        abspos[1]+=size[1]+this.size[1];
    }
    abspos[0] = Math.min(Math.max(0, abspos[0]), screen.size[0]-hintbox.size[0]);
    abspos[1] = Math.min(Math.max(0, abspos[1]), screen.size[1]-hintbox.size[1]);
    hintbox.pos[0]+=abspos[0]-abspos2[0];
    hintbox.pos[1]+=abspos[1]-abspos2[1];
    is_modal = is_modal&&(g_app_state.screen.modalhandler==undefined);
    this.parent.add_floating(hintbox, is_modal);
    return hintbox;
  }, function on_active() {
    if (this.hovering) {
        this.start_hover();
    }
  }, function on_inactive() {
    this.hovering = false;
  }, function on_tick() {
    if (this.hovering&&time_ms()-this.start_time>=this.hover_time) {
        this.hovering = false;
        console.log("hint!");
        this.on_hint();
    }
  }]);
  _es6_module.add_class(UIHoverHint);
  UIHoverHint = _es6_module.add_export('UIHoverHint', UIHoverHint);
}, '/dev/fairmotion/src/ui/UIElement.js');
es6_module_define('UIFileData', ["struct"], function _UIFileData_module(_es6_module) {
  "use struct";
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var UIInt=_ESClass("UIInt", [function UIInt(val) {
    this.val = val;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var obj=new UIInt();
    reader(obj);
    return obj.val;
  })]);
  _es6_module.add_class(UIInt);
  UIInt = _es6_module.add_export('UIInt', UIInt);
  UIInt.STRUCT = "\n  UIInt {\n    val : int;\n  }\n";
  var UIFloat=_ESClass("UIFloat", [function UIFloat(val) {
    this.val = val;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var obj=new UIFloat();
    reader(obj);
    return obj.val;
  })]);
  _es6_module.add_class(UIFloat);
  UIFloat = _es6_module.add_export('UIFloat', UIFloat);
  UIFloat.STRUCT = "\n  UIFloat {\n    val : float;\n  }\n";
  var UIString=_ESClass("UIString", [function UIString(val) {
    this.val = val;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var obj=new UIString();
    reader(obj);
    return obj.val;
  })]);
  _es6_module.add_class(UIString);
  UIString = _es6_module.add_export('UIString', UIString);
  UIString.STRUCT = "\n  UIString {\n    val : string;\n  }\n";
  var UIFloatArray=_ESClass("UIFloatArray", [function UIFloatArray(val) {
    this.val = val;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var obj=new UIFloatArray();
    reader(obj);
    return obj.val;
  })]);
  _es6_module.add_class(UIFloatArray);
  UIFloatArray = _es6_module.add_export('UIFloatArray', UIFloatArray);
  UIFloatArray.STRUCT = "\n  UIFloatArray {\n    val : array(float);\n  }\n";
  var UIKeyPair=_ESClass("UIKeyPair", [function UIKeyPair(key, val) {
    this.key = key;
    this.val = val;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var obj=new UIKeyPair();
    reader(obj);
    return obj;
  }), function get_val() {
    is_num = (typeof (this.val)=="number"||__instance_of(this.val, Number));
    is_num = is_num||(typeof (this.val)=="boolean"||__instance_of(this.val, Boolean));
    if (is_num) {
        if (this.val==Math.floor(this.val))
          return new UIInt(this.val);
        else 
          return new UIFloat(this.val);
    }
    else 
      if (typeof (this.val)=="string"||__instance_of(this.val, String)) {
        return new UIString(this.val);
    }
    else 
      if (typeof (this.val)=="array"||__instance_of(this.val, Array)) {
        for (var i=0; i<this.val.length; i++) {
            var val=this.val[i];
            is_num = (typeof (val)=="number"||__instance_of(val, Number));
            is_num = is_num||(typeof (val)=="boolean"||__instance_of(val, Boolean));
            if (!is_num) {
                console.log("warning; could not serialize array as numeric array; will do object serialization instead.");
                return new UIStruct(this.val);
            }
        }
        return new UIFloatArray(this.val);
    }
    else 
      if (typeof (this.val)=="object") {
        return new UIStruct(this.val);
    }
    else {
      console.log("Warning; bad value passed to UIKeyVal; returning 0. . .");
      return new UIInt(0);
    }
  }]);
  _es6_module.add_class(UIKeyPair);
  UIKeyPair = _es6_module.add_export('UIKeyPair', UIKeyPair);
  UIKeyPair.STRUCT = "\n  UIKeyPair {\n    key : string;\n    val : abstract(Object) | obj.get_val();\n  }\n";
  var UIStruct=_ESClass("UIStruct", [function UIStruct(obj) {
    this.obj = obj;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var obj={}
    reader(obj);
    var keys=obj.obj;
    var ret={}
    for (var i=0; i<keys.length; i++) {
        var k=keys[i];
        ret[k.key] = k.val;
    }
    return ret;
  })]);
  _es6_module.add_class(UIStruct);
  UIStruct = _es6_module.add_export('UIStruct', UIStruct);
  UIStruct.STRUCT = "\n  UIStruct {\n    obj : iter(k, UIKeyPair) | new UIKeyPair(k, obj.obj[k]);\n  }\n";
  function test_ui_structs() {
    a = new UIStruct({a: 1, b: [1, 2, 3], c: "yay", d: 0.03, e: {a: [1, 2], b: 2}});
    var arr=[];
    istruct.write_object(arr, a);
    console.log(arr);
    var view=new DataView(new Uint8Array(arr).buffer);
    var ret=istruct.read_object(view, UIStruct);
    arr = LZString.compress(new Uint8Array(view.buffer));
    console.log(ret);
    console.log("- binlen", arr.length);
    console.log("-JSONlen", LZString.compress(JSON.stringify(a.obj)).length);
  }
}, '/dev/fairmotion/src/ui/UIFileData.js');
es6_module_define('UICanvas', ["UIElement", "mathlib"], function _UICanvas_module(_es6_module) {
  "use strict";
  var rot2d=es6_import_item(_es6_module, 'mathlib', 'rot2d');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var $_mh;
  var $_swapt;
  var $arr4_window__box_process_clr=[0, 0, 0, 0];
  window._box_process_clr = function _box_process_clr(default_cs, clr) {
    var cs=default_cs;
    if (clr!=undefined) {
        if (typeof clr=="number") {
            var cs2=$arr4_window__box_process_clr;
            for (var i=0; i<4; i++) {
                cs2[i] = (($_mh = objcache.array(2)), ($_mh[0] = (cs[i][0])), ($_mh[1] = (cs[i][1])), ($_mh[2] = (cs[i][2])), ($_mh[3] = (cs[i][3])), $_mh);
                for (var j=0; j<4; j++) {
                    cs2[i]*=clr;
                }
            }
            cs = cs2;
        }
        else 
          if (typeof clr[0]=="number") {
            var cs=$arr4_window__box_process_clr;
            cs[0] = clr;
            cs[1] = clr;
            cs[2] = clr;
            cs[3] = clr;
        }
        else {
          cs = clr;
        }
    }
    return cs;
  }
  var $ret_G6Y4_get_2d_canvas={}
  function get_2d_canvas() {
    if ($ret_G6Y4_get_2d_canvas.canvas==undefined) {
        $ret_G6Y4_get_2d_canvas.canvas = document.getElementById("canvas2d");
        $ret_G6Y4_get_2d_canvas.ctx = _canvas2d_ctx;
    }
    return $ret_G6Y4_get_2d_canvas;
  }
  get_2d_canvas = _es6_module.add_export('get_2d_canvas', get_2d_canvas);
  window.get_2d_canvas = get_2d_canvas;
  var $ret_7ExE_get_2d_canvas_2={}
  function get_2d_canvas_2() {
    if ($ret_7ExE_get_2d_canvas_2.canvas==undefined) {
        $ret_7ExE_get_2d_canvas_2.canvas = document.getElementById("canvas2d_work");
        $ret_7ExE_get_2d_canvas_2.ctx = _canvas2d_ctx_2;
    }
    return $ret_7ExE_get_2d_canvas_2;
  }
  get_2d_canvas_2 = _es6_module.add_export('get_2d_canvas_2', get_2d_canvas_2);
  window.get_2d_canvas_2 = get_2d_canvas_2;
  window._ui_canvas_2d_idgen = 1;
  var $temp_layer_idgen_SNHR_push_layer;
  var $black_RQAx_quad;
  var $grads_0zuP_quad;
  var $mid_MseH_colorfield;
  var $cache_i8vV_box1;
  var $v1_xmpj_box1;
  var $v3_m2j6_box1;
  var $pairs_4Z0__box1;
  var $pos_maya_text;
  var $v2_htnG_box1;
  var $v4_ZPjw_box1;
  var UICanvas=_ESClass("UICanvas", [function UICanvas(viewport) {
    var c=get_2d_canvas();
    this.canvas = c.canvas;
    this.id = _ui_canvas_2d_idgen++;
    this.ctx = c.ctx;
    this.canvases = {}
    var ctx=c.ctx, fl=Math.floor;
    
    if (ctx.setFillColor==undefined) {
        ctx.setFillColor = function(r, g, b, a) {
          if (a==undefined)
            a = 1.0;
          this.fillStyle = "rgba("+fl(r*255)+","+fl(g*255)+","+fl(b*255)+","+a+")";
        };
    }
    if (ctx.setStrokeColor==undefined) {
        ctx.setStrokeColor = function(r, g, b, a) {
          if (a==undefined)
            a = 1.0;
          this.strokeStyle = "rgba("+fl(r*255)+","+fl(g*255)+","+fl(b*255)+","+a+")";
        };
    }
    this.layerstack = [];
    this.scissor_stack = [];
    this._lastclip = [[0, 0], [0, 0]];
    this.transmat = new Matrix4();
    this.trans_stack = [];
    this.raster = g_app_state.raster;
    this.global_matrix = new Matrix4();
    this.iconsheet = g_app_state.raster.iconsheet;
    this.iconsheet16 = g_app_state.raster.iconsheet16;
    this.viewport = viewport;
  }, function destroy() {
  }, function _css_color(c) {
    if (isNaN(c[0]))
      return "black";
    var s="rgba(";
    for (var i=0; i<3; i++) {
        if (i>0)
          s+=",";
        s+=Math.floor(c[i]*255);
    }
    s+=","+(c[3]==undefined ? "1.0" : c[3])+")";
    return s;
  }, function reset_canvases() {
    console.trace("reset_canvases called");
    for (var k in this.canvases) {
        document.body.removeChild(this.canvases[k]);
    }
    this.canvases = {}
  }, function kill_canvas(obj_or_id) {
    console.trace("kill called");
    var id=obj_or_id;
    if (typeof id=="object") {
        console.log(id);
        id = id[Symbol.keystr]();
    }
    var canvas=this.canvases[id];
    delete this.canvases[id];
    
    delete active_canvases[id];
    if (canvas!=undefined) {
        document.body.removeChild(canvas);
    }
  }, function get_canvas(obj_or_id, pos, size, zindex) {
    if (zindex==undefined) {
        zindex = 4;
    }
    var id=obj_or_id;
    window._ensure_thedimens();
    if (typeof id=="object")
      id = id[Symbol.keystr]();
    var canvas;
    if (id in this.canvases) {
        canvas = this.canvases[id];
        canvas.is_blank = false;
    }
    else {
      console.warn("creating new canvas. . .");
      var canvas=document.createElement("canvas");
      canvas.id = "_canvas2d_"+id;
      document.body.appendChild(canvas);
      canvas.style["position"] = "absolute";
      canvas.style["left"] = "0px";
      canvas.style["top"] = "0px";
      canvas.style["z-index"] = ""+zindex;
      canvas.style["pointer-events"] = "none";
      canvas.width = this.canvas.width;
      canvas.height = this.canvas.height;
      canvas.ctx = canvas.getContext("2d");
      if (canvas.ctx.canvas==undefined) {
          canvas.ctx.canvas = canvas;
      }
      canvas.is_blank = true;
      this.canvases[id] = canvas;
      
      active_canvases[id] = [canvas, this];
    }
    if (parseInt(canvas.style["z-index"])!=zindex) {
        canvas.style["z-index"] = zindex;
    }
    if (canvas.width!=size[0]) {
        canvas.width = size[0];
    }
    if (canvas.height!=size[1]) {
        canvas.height = size[1];
    }
    if (canvas.style["left"]!=""+Math.floor(pos[0])+"px") {
        canvas.style["left"] = Math.floor(pos[0])+"px";
        canvas.is_blank = true;
    }
    var y=Math.floor(window.theHeight-pos[1]-size[1]);
    if (canvas.style["top"]!=""+y+"px") {
        canvas.style["top"] = ""+y+"px";
        canvas.is_blank = true;
    }
    canvas.ctx.is_blank = canvas.is_blank;
    return canvas;
  }, function push_layer() {
    this.layerstack.push([this.canvas, this.ctx]);
    var canvas=document.createElement("canvas");
    canvas.id = "_temp_canvas2d_"+($temp_layer_idgen_SNHR_push_layer++);
    document.body.appendChild(canvas);
    canvas.style["position"] = "absolute";
    canvas.style["left"] = "0px";
    canvas.style["top"] = "0px";
    canvas.style["z-index"] = ""+(4+this.layerstack.length);
    canvas.style["pointer-events"] = "none";
    canvas.width = this.canvas.width;
    canvas.height = this.canvas.height;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
  }, function pop_layer() {
    if (this.layerstack.length==0) {
        console.trace("%cTHE SHEER EVIL OF IT!", "color:red");
        return ;
    }
    var item=this.layerstack.pop();
    document.body.removeChild(this.canvas);
    this.canvas = item[0];
    this.ctx = item[1];
  }, function on_draw(gl) {
  }, function set_viewport(viewport) {
    this.viewport = viewport;
  }, function clear(p, size) {
    var v=this.viewport;
    var canvas=this.canvas;
    var ctx=this.ctx;
    if (p==undefined) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.rect(0, 0, canvas.width, canvas.height);
    }
    else {
      ctx.clearRect(p[0]+v[0][0], canvas.height-(v[0][1]+p[1]+size[1]), size[0], size[1]);
      ctx.beginPath();
      ctx.rect(p[0]+v[0][0], canvas.height-(v[0][1]+p[1]+size[1]), size[0], size[1]);
    }
  }, function reset() {
    var v=this.viewport;
    var canvas=this.canvas;
    var ctx=this.ctx;
  }, function clip(rect, vis_only) {
    if (vis_only==undefined) {
        vis_only = false;
    }
    var canvas=this.canvas;
    var ctx=this.ctx;
    rect[0] = new Vector2(rect[0]);
    rect[1] = new Vector2(rect[1]);
    var v=this.viewport;
    this._clip_to_viewport(rect[0], rect[1], v);
    ctx.fillStyle = Math.random()>0.5 ? "rgba(255,0,0,0.7)" : "rgba(0,255,0,0.7)";
    ctx.beginPath();
    ctx.rect(v[0][0]+rect[0][0], canvas.height-(v[0][1]+rect[0][1]+rect[1][1]), rect[1][0], rect[1][1]);
    ctx.closePath();
    if (vis_only)
      ctx.fill();
    else 
      ctx.clip();
  }, function root_start() {
    this.ctx.save();
  }, function root_end() {
    this.ctx.restore();
  }, function begin() {
  }, function end() {
  }, function frame_begin() {
  }, function frame_end() {
  }, function use_cache(item) {
  }, function has_cache(item) {
    return false;
  }, function remove_cache(item) {
  }, function on_resize(oldsize, newsize) {
  }, function invbox(pos, size, clr, r) {
    var cs=uicolors["InvBox"];
    cs = _box_process_clr(cs, clr);
    this.box(pos, size, cs, r);
  }, function simple_box(pos, size, clr, r) {
    if (clr==undefined) {
        clr = undefined;
    }
    if (r==undefined) {
        r = 2.0;
    }
    var cs=uicolors["SimpleBox"];
    cs = _box_process_clr(cs, clr);
    this.box(pos, size, cs, r);
  }, function hlightbox(pos, size, clr_mul, r) {
    var cs=uicolors["HLightBox"];
    if (clr_mul!==undefined&&typeof clr_mul=="number") {
        cs = [new Vector4(cs[0]), new Vector4(cs[1]), new Vector4(cs[2]), new Vector4(cs[3])];
        for (var i=0; i<4; i++) {
            for (var j=0; j<4; j++) {
                cs[i][j]*=clr_mul;
            }
        }
    }
    else 
      if (clr_mul!==undefined&&__instance_of(clr_mul, Array)) {
        if (typeof clr_mul[0]=="number") {
            cs = [clr_mul, clr_mul, clr_mul, clr_mul];
        }
        else {
          cs = [new Vector4(clr_mul[0]), new Vector4(clr_mul[1]), new Vector4(clr_mul[2]), new Vector4(clr_mul[3])];
        }
    }
    this.box(pos, size, cs, r);
  }, function box_outline(pos, size, clr, rfac) {
    this.box(pos, size, clr, rfac, true);
  }, function quad(v1, v2, v3, v4, c1, c2, c3, c4, horiz_gradient) {
    if (horiz_gradient==undefined) {
        horiz_gradient = false;
    }
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    if (c1==undefined) {
        c1 = $black_RQAx_quad;
    }
    if (c2==undefined) {
        c2 = c1;
    }
    if (c3==undefined) {
        c3 = c2;
    }
    if (c4==undefined) {
        c4 = c3;
    }
    var m=this.transmat.$matrix;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var x=m.m41, y=m.m42;
    var hash="";
    for (var i=0; i<4; i++) {
        hash+=c1[i]+","+c2[i]+","+c3[i]+","+c4[i];
    }
    var grad;
    if (1||!(hash in $grads_0zuP_quad)) {
        var min=[v1[0], v1[1]], max=[v1[0], v1[1]];
        for (var i=0; i<2; i++) {
            min[i] = Math.min(min[i], v1[i]);
            max[i] = Math.max(max[i], v1[i]);
            min[i] = Math.min(min[i], v2[i]);
            max[i] = Math.max(max[i], v2[i]);
            min[i] = Math.min(min[i], v3[i]);
            max[i] = Math.max(max[i], v3[i]);
            min[i] = Math.min(min[i], v4[i]);
            max[i] = Math.max(max[i], v4[i]);
        }
        min[0]+=x+v[0][0];
        max[0]+=x+v[0][0];
        min[1] = canvas.height-(min[1]+y+v[0][1]);
        max[1] = canvas.height-(max[1]+y+v[0][1]);
        var grad;
        if (isNaN(min[0])||isNaN(max[0])||isNaN(min[1])||isNaN(max[1])||isNaN(c1[0])||isNaN(c3[0])) {
            grad = "black";
        }
        else {
          try {
            if (horiz_gradient)
              grad = ctx.createLinearGradient(min[0], min[1]*0.5+max[1]*0.5, max[0], min[1]*0.5+max[1]*0.5);
            else 
              grad = ctx.createLinearGradient(min[0]*0.5+max[0]*0.5, min[1], min[0]*0.5+max[0]*0.5, max[1]);
            $grads_0zuP_quad[hash] = grad;
            grad.addColorStop(0.0, this._css_color(c1));
            grad.addColorStop(1.0, this._css_color(c3));
          }
          catch (error) {
              print_stack(error);
              console.log("GRADIENT ERROR", min[0], min[1], max[0], max[1]);
          }
        }
    }
    else {
      grad = $grads_0zuP_quad[hash];
    }
    if (grad!=undefined)
      ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(v1[0]+x+v[0][0], canvas.height-(v1[1]+y+v[0][1]));
    ctx.lineTo(v2[0]+x+v[0][0], canvas.height-(v2[1]+y+v[0][1]));
    ctx.lineTo(v3[0]+x+v[0][0], canvas.height-(v3[1]+y+v[0][1]));
    ctx.lineTo(v4[0]+x+v[0][0], canvas.height-(v4[1]+y+v[0][1]));
    ctx.fill();
  }, function colorfield(pos, size, color) {
    $mid_MseH_colorfield[3] = 1.0;
    for (var i=0; i<3; i++) {
        if (color[i]==0.0)
          $mid_MseH_colorfield[i] = 0.0;
        else 
          $mid_MseH_colorfield[i] = color[i];
    }
    var color2=this._css_color($mid_MseH_colorfield);
    $mid_MseH_colorfield[3] = 1.0;
    for (var i=0; i<3; i++) {
        $mid_MseH_colorfield[i] = (color[i]*3.0-1.0)/4.0;
    }
    var midclr=this._css_color($mid_MseH_colorfield);
    $mid_MseH_colorfield[3] = 1.0;
    for (var i=0; i<3; i++) {
        $mid_MseH_colorfield[i] = 0.5+color[i]*0.5;
    }
    var smidclr=this._css_color($mid_MseH_colorfield);
    $mid_MseH_colorfield[3] = 0.0;
    for (var i=0; i<3; i++) {
        $mid_MseH_colorfield[i] = color[i];
    }
    var zerocolor=this._css_color($mid_MseH_colorfield);
    color = this._css_color(color);
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    var m=this.transmat.$matrix;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var x=m.m41, y=m.m42;
    var bx=pos[0]+x+v[0][0], by=canvas.height-(pos[1]+y+v[0][1])-size[1];
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.rect(bx, by, size[0], size[1]);
    ctx.closePath();
    ctx.fill();
    function draw_grad(a, b, c, is_horiz) {
      var grad;
      var dp=0.0, dp2=0.0, dp3=35;
      if (is_horiz==1)
        grad = ctx.createLinearGradient(bx+1, by, bx+size[0]-2, by);
      else 
        if (is_horiz==2)
        grad = ctx.createLinearGradient(bx+dp+size[0]-dp*2, by+dp, bx+dp, by+size[1]-dp*2.0);
      else 
        if (is_horiz==3)
        grad = ctx.createLinearGradient(bx+dp2+dp3, by+dp2+dp3, bx+dp2+size[0]-dp2*2, by+size[1]-dp2*2.0);
      else 
        grad = ctx.createLinearGradient(bx, by+size[1], bx, by);
      grad.addColorStop(0.0, a);
      grad.addColorStop(1.0, c);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.rect(bx, by, size[0], size[1]);
      ctx.closePath();
      ctx.fill();
    }
    try {
      draw_grad("rgba(255,255,255,1.0)", "rgba(255,255,255, 0.5)", "rgba(255,255,255,0.0)", 0);
      draw_grad("rgba(0,0,0,1.0)", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.0)", 1);
    }
    catch (error) {
    }
  }, function icon(icon, pos, alpha, small, clr) {
    if (alpha==undefined) {
        alpha = 1.0;
    }
    if (small==undefined) {
        small = false;
    }
    if (clr==undefined) {
        clr = undefined;
    }
    if (icon<0)
      return ;
    var sheet=small ? g_app_state.raster.iconsheet16 : g_app_state.raster.iconsheet;
    var img=sheet.tex.image;
    var csize=sheet.cellsize;
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    var m=this.transmat.$matrix;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var x=m.m41+v[0][0]+pos[0], y=canvas.height-(m.m42+v[0][1]+pos[1])-csize[1];
    var spos=sheet.enum_to_xy(icon);
    ctx.drawImage(img, spos[0], spos[1], csize[0], csize[1], x, y, csize[0], csize[1]);
  }, function quad_aa(v1, v2, v3, v4, c1, c2, c3, c4) {
    this.quad(v1, v2, v3, v4, c1, c2, c3, c4);
  }, function _clip_to_viewport(pos, size, v) {
    if (pos[0]<0) {
        size[0]+=pos[0];
        pos[0] = 0;
    }
    if (pos[0]+size[0]>v[1][0]) {
        size[0] = v[1][0]-pos[0];
    }
    if (pos[1]<0) {
        size[1]+=pos[1];
        pos[1] = 0;
    }
    if (pos[1]+size[1]>v[1][1]) {
        size[1] = v[1][1]-pos[1];
    }
  }, function push_scissor(pos, size) {
    var t="";
    for (var i=0; i<this.scissor_stack.length; i++) {
        t+="  ";
    }
    var oldpos=pos;
    pos = new Vector3([pos[0], pos[1], 0]);
    size = new Vector3([pos[0]+size[0], pos[1]+size[1], 0]);
    pos.multVecMatrix(this.transmat);
    size.multVecMatrix(this.transmat);
    size[0]-=pos[0];
    size[1]-=pos[1];
    var v=g_app_state.raster.viewport;
    this._clip_to_viewport(pos, size, v);
    pos[0]+=v[0][0];
    pos[1]+=v[0][1];
    for (var i=0; i<3; i++) {
        pos[i] = Math.floor(pos[i]);
        size[i] = Math.ceil(size[i]);
    }
    this.scissor_stack.push([pos, size]);
    var canvas=this.canvas;
    var g=this.ctx;
    try {
      g.save();
      if (window._cd==undefined)
        window._cd = 0;
      g.fillStyle = (window._cd++%2) ? "rgba(255, 0, 0, 0.5)" : "rgba(0, 255, 0, 0.5)";
      g.beginPath();
      g.rect(pos[0], canvas.height-(pos[1]+size[1]), size[0], size[1]);
      g.closePath();
      g.clip();
    }
    catch (err) {
        print_stack(err);
    }
  }, function pop_scissor() {
    this.scissor_stack.pop();
    var t="";
    for (var i=0; i<this.scissor_stack.length; i++) {
        t+="  ";
    }
    this.ctx.restore();
  }, function _clipeq(c1, c2) {
    return c1[0][0]==c2[0][0]&&c1[0][1]==c2[0][1]&&c1[1][0]==c2[1][0]&&c1[1][1]==c2[1][1];
  }, function arc_points(pos, start, arc, r, steps) {
    if (steps==undefined) {
        steps = Math.floor(6*arc/Math.PI);
    }
    var f, df;
    var f=start;
    var df=arc/steps;
    var points=[];
    for (var i=0; i<steps+1; i++) {
        var x=pos[0]+Math.sin(f)*r;
        var y=pos[1]+Math.cos(f)*r;
        points.push([x, y, 0]);
        f+=df;
    }
    return points;
  }, function arc(pos, start, arc, r, clr, half) {
    if (clr==undefined) {
        clr = [0.9, 0.8, 0.7, 0.6];
    }
    var steps=18/(2.0-arc/(Math.PI*2));
    var f, df;
    var f=start;
    var df=arc/steps;
    var points=[];
    for (var i=0; i<steps+1; i++) {
        var x=pos[0]+Math.sin(f)*r;
        var y=pos[1]+Math.cos(f)*r;
        points.push([x, y, 0]);
        f+=df;
    }
    var lines=[];
    var colors=[];
    for (var i=0; i<points.length-1; i++) {
        lines.push([points[i], points[i+1]]);
        colors.push([clr, clr]);
    }
    colors[0][0] = [1.0, 1.0, 0.0, 1.0];
    colors[0][1] = [1.0, 1.0, 0.0, 1.0];
  }, function box1(pos, size, clr, rfac, outline_only) {
    if (clr==undefined) {
        clr = undefined;
    }
    if (rfac==undefined) {
        rfac = undefined;
    }
    if (outline_only==undefined) {
        outline_only = false;
    }
    var c1, c2, c3, c4;
    var cs=uicolors["Box"];
    if (outline_only==undefined)
      outline_only = false;
    cs = _box_process_clr(cs, clr);
    var x=Math.floor(pos[0]), y=Math.floor(pos[1]);
    var w=size[0], h=size[1];
    var start=0;
    var ang=Math.PI/2;
    var r=4;
    if (rfac==undefined)
      rfac = 1;
    var hash=size[0].toString()+" "+size[1]+" "+rfac;
    if (!(hash in $cache_i8vV_box1)) {
        r/=rfac;
        var p1=this.arc_points((($_mh = objcache.array(2)), ($_mh[0] = (0+r+2)), ($_mh[1] = (0+r+2)), ($_mh[2] = (0)), $_mh), Math.PI, ang, r);
        var p2=this.arc_points((($_mh = objcache.array(2)), ($_mh[0] = (0+w-r-2)), ($_mh[1] = (0+r+2)), ($_mh[2] = (0)), $_mh), Math.PI/2, ang, r);
        var p3=this.arc_points((($_mh = objcache.array(2)), ($_mh[0] = (0+w-r-2)), ($_mh[1] = (0+h-r-2)), ($_mh[2] = (0)), $_mh), 0, ang, r);
        var p4=this.arc_points((($_mh = objcache.array(2)), ($_mh[0] = (0+r+2)), ($_mh[1] = (0+h-r-2)), ($_mh[2] = (0)), $_mh), -Math.PI/2, ang, r);
        var plen=p1.length;
        p4.reverse();
        p3.reverse();
        p2.reverse();
        p1.reverse();
        var points=[];
        for (var i=0; i<p1.length; i++) {
            points.push(p1[i]);
        }
        for (var i=0; i<p2.length; i++) {
            points.push(p2[i]);
            p1.push(p2[i]);
        }
        for (var i=0; i<p3.length; i++) {
            points.push(p3[i]);
        }
        p2 = p3;
        for (var i=0; i<p4.length; i++) {
            p2.push(p4[i]);
            points.push(p4[i]);
        }
        p2.reverse();
        $cache_i8vV_box1[hash] = [p1, p2, points];
    }
    var cp=$cache_i8vV_box1[hash];
    var p1=cp[0];
    var p2=cp[1];
    var points=cp[2];
    var plen=p1.length;
    function color(i) {
      if (i<plen)
        return cs[0];
      else 
        if (i<plen*2)
        return cs[1];
      else 
        if (i<plen*3)
        return cs[2];
      else 
        if (i<=plen*4+1)
        return cs[3];
    }
    if (!outline_only) {
        for (var i=0; i<p1.length-1; i++) {
            var i1=i;
            var i2=i+plen*2;
            var i3=i+1+plen*2;
            var i4=i+1;
            $v1_xmpj_box1[0] = p1[i][0]+x;
            $v1_xmpj_box1[1] = p1[i][1]+y;
            $v1_xmpj_box1[2] = p1[i][2];
            
            $v2_htnG_box1[0] = p2[i][0]+x;
            $v2_htnG_box1[1] = p2[i][1]+y;
            $v2_htnG_box1[2] = p2[i][2];
            
            $v3_m2j6_box1[0] = p2[i+1][0]+x;
            $v3_m2j6_box1[1] = p2[i+1][1]+y;
            $v3_m2j6_box1[2] = p2[i+1][2];
            
            $v4_ZPjw_box1[0] = p1[i+1][0]+x;
            $v4_ZPjw_box1[1] = p1[i+1][1]+y;
            $v4_ZPjw_box1[2] = p1[i+1][2];
            
            this.quad($v1_xmpj_box1, $v2_htnG_box1, $v3_m2j6_box1, $v4_ZPjw_box1, color(i1), color(i2), color(i3), color(i4));
        }
    }
    var lines=[];
    var colors=[];
    for (var i=0; i<points.length; i++) {
        $v1_xmpj_box1[0] = points[(i+1)%points.length][0]+x;
        $v1_xmpj_box1[1] = points[(i+1)%points.length][1]+y;
        $v1_xmpj_box1[2] = points[(i+1)%points.length][2];
        
        $v2_htnG_box1[0] = points[i][0]+x;
        $v2_htnG_box1[1] = points[i][1]+y;
        $v2_htnG_box1[2] = points[i][2];
        
        if ($pairs_4Z0__box1.length<=i) {
            $pairs_4Z0__box1.push([[0, 0], [0, 0]]);
        }
        $pairs_4Z0__box1[i][0][0] = (($_mh = objcache.array(2)), ($_mh[0] = ($v1_xmpj_box1[0])), ($_mh[1] = ($v1_xmpj_box1[1])), ($_mh[2] = (0)), $_mh);
        $pairs_4Z0__box1[i][0][1] = (($_mh = objcache.array(2)), ($_mh[0] = ($v2_htnG_box1[0])), ($_mh[1] = ($v2_htnG_box1[1])), ($_mh[2] = (0)), $_mh);
        lines.push($pairs_4Z0__box1[i][0]);
        $pairs_4Z0__box1[i][1][0] = color((i+1)%points.length);
        $pairs_4Z0__box1[i][1][1] = color(i);
        colors.push($pairs_4Z0__box1[i][1]);
    }
  }, function tri_aa(v1, v2, v3, c1, c2, c3) {
    this.tri(v1, v2, v3, c1, c2, c3);
  }, function _split_text(line) {
    var i=0;
    var segments=[{line: "", format: "", color: undefined}];
    while (i<line.length) {
      var c=line[i];
      if (c=="%") {
          var n=line[i+1];
          var color=undefined;
          var format="";
          color = undefined;
          switch (n) {
            case "b":
              format = "bold";
              break;
            case "i":
              format = "italic";
              break;
            case "/":
              format = "";
              color = undefined;
              i++;
              break;
            case "c":
              i++;
              var end=line.slice(i, line.length).search("}");
              color = line.slice(i+2, i+end).trim();
              console.log("COLOR!!!", end, color, "|", line.slice(i, line.length));
              i+=end;
              break;
          }
          segments.push({line: "", format: format, color: color});
          i+=2;
          continue;
      }
      segments[segments.length-1].line+=c;
      i++;
    }
    return segments;
  }, function _measure_line(line, fontsize) {
    var segs=this._split_text(line);
    var x=0.0;
    var g=this.ctx;
    for (var i=0; i<segs.length; i++) {
        x+=g.measureText(segs[i].line).width;
    }
    return {width: x}
  }, function _text_line(line, x, y, fontsize) {
    var segs=this._split_text(line);
    var g=this.ctx;
    var startclr=g.fillStyle;
    for (var i=0; i<segs.length; i++) {
        this._set_font(g, fontsize, segs[i].format);
        if (segs[i].color!=undefined) {
            g.fillStyle = segs[i].color;
        }
        else {
          g.fillStyle = startclr;
        }
        g.fillText(segs[i].line, x, y);
        x+=g.measureText(segs[i].line).width;
    }
    g.fillStyle = startclr;
  }, function text(pos1, text, color, fontsize, scale, rot, scissor_pos, scissor_size) {
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    var lines=text.split("\n");
    if (text[0]!="\n"&&text[1]!="\r"&&lines[0].trim()=="") {
        lines = lines.splice(1, lines.length);
    }
    lines.reverse();
    if (rot==undefined)
      rot = 0;
    var ly=0;
    for (var i=0; i<lines.length; i++, ly+=12) {
        var w=this._measure_line(lines[i]).width;
        var m=this.transmat.$matrix;
        $pos_maya_text[0] = m.m41+v[0][0]+pos1[0];
        $pos_maya_text[1] = canvas.height-(m.m42+v[0][1]+pos1[1]+ly);
        $pos_maya_text[2] = 0;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.rotate(rot);
        if (rot!=0) {
            $pos_maya_text[1]-=w;
        }
        rot2d($pos_maya_text, -rot);
        $pos_maya_text[1] = canvas.height-$pos_maya_text[1];
        if (color==undefined)
          color = uicolors.DefaultText;
        ctx.fillStyle = this._css_color(color);
        if (fontsize==undefined)
          fontsize = default_ui_font_size;
        ctx.font = fontsize+"px "+"Arial";
        var x=$pos_maya_text[0], y=canvas.height-($pos_maya_text[1]);
        this._text_line(lines[i], x, y, fontsize);
    }
  }, function _set_font(ctx, fontsize, addition_options) {
    if (addition_options==undefined) {
        addition_options = "";
    }
    addition_options = addition_options.trim()+" ";
    if (fontsize==undefined)
      fontsize = default_ui_font_size;
    ctx.font = addition_options+fontsize+"px "+"Arial";
  }, function line(v1, v2, c1, c2) {
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    var m=this.transmat.$matrix;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var x=m.m41, y=m.m42;
    ctx.strokeStyle = this._css_color(c1);
    ctx.beginPath();
    ctx.moveTo(v1[0]+x+v[0][0], canvas.height-(v1[1]+y+v[0][1]));
    ctx.lineTo(v2[0]+x+v[0][0], canvas.height-(v2[1]+y+v[0][1]));
    ctx.stroke();
  }, function tri(v1, v2, v3, c1, c2, c3) {
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=g_app_state.raster.viewport;
    var m=this.transmat.$matrix;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    var x=m.m41, y=m.m42;
    ctx.fillStyle = this._css_color(c1);
    ctx.beginPath();
    ctx.moveTo(v1[0]+x+v[0][0], canvas.height-(v1[1]+y+v[0][1]));
    ctx.lineTo(v2[0]+x+v[0][0], canvas.height-(v2[1]+y+v[0][1]));
    ctx.lineTo(v3[0]+x+v[0][0], canvas.height-(v3[1]+y+v[0][1]));
    ctx.fill();
  }, function shadow_box(pos, size, steps, margin, clr) {
    if (steps==undefined) {
        steps = 6;
    }
    if (margin==undefined) {
        margin = [6, 6];
    }
    if (clr==undefined) {
        clr = uicolors["ShadowBox"];
    }
  }, function box(pos, size, clr, rfac, outline_only) {
    if (IsMobile||rfac==0.0)
      return this.box2(pos, size, clr, rfac, outline_only);
    else 
      return this.box1(pos, size, clr, rfac, outline_only);
  }, function passpart(pos, size, clr) {
    if (clr==undefined) {
        clr = [0, 0, 0, 0.5];
    }
    var p=this.viewport[0];
    var s=this.viewport[1];
    this.box2([p[0], p[1]], [pos[0], s[1]], clr);
    this.box2([p[0]+pos[0]+size[0], p[1]], [s[0]-pos[0]-size[0], s[1]], clr);
    this.box2([pos[0]+p[0], pos[1]+p[1]+size[1]], [size[0], s[1]-size[1]-p[1]], clr);
    this.box2([pos[0]+p[0], p[1]], [size[0], pos[1]], clr);
  }, function box2(pos, size, clr, rfac, outline_only) {
    if (clr==undefined) {
        clr = undefined;
    }
    if (rfac==undefined) {
        rfac = undefined;
    }
    if (outline_only==undefined) {
        outline_only = false;
    }
    var cs=uicolors["Box"];
    cs = _box_process_clr(cs, clr);
    var x=pos[0], y=pos[1];
    var w=size[0], h=size[1];
    if (outline_only) {
        this.line([pos[0], pos[1]], [pos[0], pos[1]+size[1]], clr, clr, 1.0);
        this.line([pos[0], pos[1]+size[1]], [pos[0]+size[0], pos[1]+size[1]], clr, clr, 1.0);
        this.line([pos[0]+size[0], pos[1]+size[1]], [pos[0]+size[0], pos[1]], clr, clr, 1.0);
        this.line([pos[0]+size[0], pos[1]], [pos[0], pos[1]], clr, clr, 1.0);
    }
    else {
      this.quad((($_mh = objcache.array(2)), ($_mh[0] = (x)), ($_mh[1] = (y)), ($_mh[2] = (0)), $_mh), (($_mh = objcache.array(2)), ($_mh[0] = (x+w)), ($_mh[1] = (y)), ($_mh[2] = (0)), $_mh), (($_mh = objcache.array(2)), ($_mh[0] = (x+w)), ($_mh[1] = (y+h)), ($_mh[2] = (0)), $_mh), (($_mh = objcache.array(2)), ($_mh[0] = (x)), ($_mh[1] = (y+h)), ($_mh[2] = (0)), $_mh), cs[0], cs[1], cs[2], cs[3]);
    }
  }, function textsize(text, size) {
    if (size==undefined) {
        size = default_ui_font_size;
    }
    var lines=text.split("\n");
    if (text[0]!="\n"&&text[1]!="\r"&&lines[0].trim()=="") {
        lines = lines.splice(1, lines.length);
    }
    lines.reverse();
    var canvas=this.canvas;
    var ctx=this.ctx;
    var v=this.viewport;
    this._set_font(ctx, size);
    var wid=0, hgt=0;
    for (var i=0; i<lines.length; i++) {
        wid = Math.max(wid, this._measure_line(lines[i]).width);
        hgt+=size+2;
    }
    return [wid, hgt];
  }, function translate(off) {
    this.transmat.translate(off[0], off[1], 0.0);
  }, function push_transform(mat) {
    if (mat==undefined) {
        mat = undefined;
    }
    this.trans_stack.push(new Matrix4(this.transmat));
    if (mat!=undefined)
      this.transmat.multiply(mat);
  }, function pop_transform() {
    this.transmat.load(this.trans_stack.pop());
  }]);
  var $temp_layer_idgen_SNHR_push_layer=0;
  var $black_RQAx_quad=[0, 0, 0, 1];
  var $grads_0zuP_quad={}
  var $mid_MseH_colorfield=[0, 0, 0, 0.5];
  var $cache_i8vV_box1={}
  var $v1_xmpj_box1=new Vector3();
  var $v3_m2j6_box1=new Vector3();
  var $pairs_4Z0__box1=[];
  var $pos_maya_text=[0, 0, 0];
  var $v2_htnG_box1=new Vector3();
  var $v4_ZPjw_box1=new Vector3();
  _es6_module.add_class(UICanvas);
  UICanvas = _es6_module.add_export('UICanvas', UICanvas);
  window.active_canvases = {}
  function test_canvas2d() {
    var u=new UICanvas();
  }
}, '/dev/fairmotion/src/ui/UICanvas.js');
