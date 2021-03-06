"use strict";

import {TypedWriter} from 'typedwriter';

var mmax = Math.max, mmin = Math.min, mfloor = Math.floor;
var abs = Math.abs, sqrt=Math.sqrt, sin=Math.sin, cos=Math.cos,
    pow = Math.pow, log=Math.log, acos=Math.acos, asin=Math.asin,
    PI=Math.PI;
    
var DEBUG = false;
var FIXED_KS_FLAG = SplineFlags.FIXED_KS;

import {constraint, solver} from "solver";
import {ModalStates} from 'toolops_api';
import {SplineTypes, SplineFlags} from 'spline_base';

var FIXED_KS_FLAG = SplineFlags.FIXED_KS;

export function has_nacl() {
  return common.naclModule != undefined;
}

var solve_idgen = 0;
export var active_solves = {};
export var solve_starttimes = {};
export var solve_starttimes2 = {};
export var solve_endtimes = {};
export var active_jobs = {}

var MessageTypes = {
    GEN_DRAW_BEZIERS : 0,
    REPLY            : 1,
    SOLVE            : 2
}

export var callbacks = {};
export var msg_idgen = 0;

import {
  ORDER, KSCALE, KANGLE,
  KSTARTX, KSTARTY, KSTARTZ,
  KTOTKS, INT_STEPS
} from 'spline_math_hermite';

import {SplineTypes} from 'spline_types';

export var ConstraintTypes = {
  TAN_CONSTRAINT       : 0,
  HARD_TAN_CONSTRAINT  : 1,
  CURVATURE_CONSTRAINT : 2,
  COPY_C_CONSTRAINT    : 3
};

export var JobTypes = {
  DRAWSOLVE : 1,
  PATHSOLVE : 2,
  SOLVE     : 1|2
};

import * as ajax from 'ajax';

export function clear_jobs_except_latest(typeid) {
  var last = undefined;
  var lastk = undefined;
  
  for (var k in callbacks) {
    var job = callbacks[k];
    
    if (job.typeid & typeid) {
      job._skip = 1;
      delete callbacks[k];
      last = job;
      lastk = k;
    }
  }
  
  if (last != undefined) {
    callbacks[lastk] = last;
    delete last._skip;
  }
}

export function clear_jobs_except_first(typeid) {
  var last = undefined;
  var lastk = undefined;
  
  for (var k in callbacks) {
    var job = callbacks[k];
    
    if (job.typeid & typeid) {
      if (last != undefined) {
        job._skip = 1;
        delete callbacks[k];
      }
      
      last = job;
      lastk = k;
    }
  }
}

export function clear_jobs(typeid) {
  for (var k in callbacks) {
  
    var job = callbacks[k];
    if (job.typeid & typeid) {
      job._skip = 1;
      delete callbacks[k];
    }
  }
}

//evil copy pasted code here
var last_call = undefined;

import {build_solver} from 'spline_math_hermite';

export function _get_job(message) {
  if (message.data instanceof ArrayBuffer) {
      var iview = new Int32Array(message.data);
      
      if (DEBUG)
        console.log("got array buffer!", message.data);
      
      //find callback id
      var id = iview[1];

      if (!(id in callbacks)) {
          //console.log("Warning, dead communication callback", id);
          return;
      }

      var job = callbacks[id], iter=job.job;
      if (DEBUG)
        console.log("job:", job);
      
      return job;
  }
}

function destroy_job(job) {
  delete callbacks[job.status.msgid];
}

var handleMessage_intern = function(message) {
    if (typeof message.data == "string" || message.data instanceof String) {
        if (message.data.startsWith("OK ")) {
            console.log("%cNaCL: %s", "color:green", message.data.slice(3, message.data.length));
        } else if (message.data.startsWith("ER ")) {
            console.log("%cNaCL: Error: %s", "color:red", message.data.slice(3, message.data.length));
        } else {
            console.log("%cNaCL: %s", "color:rgb(255, 65, 10)", message.data);
        }
    } else if (message.data instanceof ArrayBuffer) {
        var iview = new Int32Array(message.data);
        
        if (DEBUG)
          console.log("got array buffer!", message.data);
        
        //find callback id
        var id = iview[1];

        if (!(id in callbacks)) {
            //console.log("Warning, dead communication callback", id);
            return;
        }

        var job = callbacks[id], iter=job.job;
        if (DEBUG)
          console.log("job:", job);
        
        job.status.data = message.data.slice(8, message.data.byteLength);
        if (DEBUG)
          console.log("iter:", iter, iter.data);
        
        var ret = iter.next();

        if (ret.done) {
            delete callbacks[id];

            if (job.callback != undefined)
                job.callback.call(job.thisvar, job.status.value);
        }

        return;
    } else {
        if (DEBUG)
          console.log("Got message!", message);
    }
}

export var queue = [];

window.handleMessage = function(message) {
  handleMessage_intern(message);
  //queue.push(message);
}

/*
var last_check = time_ms();
var queue_timer = window.setInterval(function() {
  if (time_ms() - last_check < 16.5) {
    return;
  }
  
  last_check = time_ms();
  
  //handle reversed stuff first
  var last_job = undefined;
  
  for (var i=queue.length-1; i>=0; i--) {
    var job = _get_job(queue[i]);
    
    if (job == undefined || !job.only_latest) {
      if (job != undefined)
        last_job = job;
      continue;
    }
    console.log("typeid!", job.typeid);
    
    if (last_job != undefined && last_job.typeid != job.typeid) {
      console.log("  last typeid!", last_job.typeid);
      last_job = undefined;
      continue;
    }
    
    if (job._skip) {
      continue;
    }
    
    job._skip = 2;
    handleMessage_intern(queue[i]);
    
    last_job = job;
    
    for (var j=0; j<i; j++) {
      var job2 = _get_job(queue[j]);
      
      if (job2 != undefined && job2.typeid == job.typeid)
        job2._skip = 1;
    }
  }
  
  for (var i=0; i<queue.length; i++) {
    var job = _get_job(queue[i]);
    
    if (job != undefined && job._skip == 1) {
      destroy_job(job);
      continue;
    } else if (job != undefined && job._skip) {
      continue;
    }
    
    handleMessage_intern(queue[i]);
  }
  
  queue.splice(0, queue.length);
}, 16);//*/

export function _PostMessage(msg, id) {
    common.naclModule.postMessage(data);
}

export function call_api(job, params=undefined) {
    var callback, error, thisvar, typeid, only_latest=false;

    if (params != undefined) {
        callback = params.callback;
        thisvar = params.thisvar != undefined ? params.thisvar : self;
        error = params.error;
        only_latest = params.only_latest != undefined ? params.only_latest : false;
        typeid = params.typeid;
    }

    var postMessage = function(msg) {
        common.naclModule.postMessage(msg);
    }

    var id = msg_idgen++;
    var status = {
      msgid : id,
      data  : undefined
    }
    var args = [postMessage, status];
    
    for (var i=2; i<arguments.length; i++) {
        args.push(arguments[i]);
    }

    var iter = job.apply(job, args);

    var ret = iter.next();
    if (ret.done) {
        callback.call(thisvar, iter.value);
        return;
    }

    callbacks[id] = {
        job      : iter,
        typeid   : typeid,
        only_latest : only_latest,//only return latest for all jobs of same typeid
        callback : callback,
        thisvar  : thisvar,
        error    : error,
        status   : status //status object used to communicate with job
    };
}

export function test_nacl() {
    call_api(gen_draw_cache, {
        callback : function(value) {
        }
    }, new Context().frameset.spline);
    
    window.redraw_viewport();
}

export function start_message(type, msgid, endian) {
    var data = [];
    
    ajax.pack_int(data, type, endian);
    ajax.pack_int(data, msgid, endian);
    
    return data;
}

export function start_message_new(writer, type, msgid, endian) {
    writer.int32(type);
    writer.int32(msgid);
}

function _unpacker(dview) {
  var b = 0;
  
  return {
    getint : function getint() {
      b += 4;
      return dview.getInt32(b-4, endian);
    },
  
    getfloat : function getfloat() {
      b += 4;
      return dview.getFloat32(b-4, endian);
    },
    getdouble : function getdouble() {
      b += 8;
      return dview.getFloat64(b-8, endian);
    }
  };
}
export function* gen_draw_cache(postMessage, status, spline) {
    var data = [];
    var msgid = status.msgid;
    
    var endian = ajax.little_endian;
    var data = start_message(MessageTypes.GEN_DRAW_BEZIERS, msgid, endian);

    //make sure to follow C struct alignment rules
    ajax.pack_int(data, spline.segments.length, endian);
    ajax.pack_int(data, 0, endian); //dummy, to maintain 8-byte alignment
    /*
     struct SplineDrawSegment {
        int32_t eid;
        float v1[3];
        float v2[3];
        int32_t totks;
        double ks[16];
     }
     */
    for (var s of spline.segments) {
        ajax.pack_int(data, s.eid, endian); //4   bytes
        ajax.pack_vec3(data, s.v1, endian); //16  bytes
        ajax.pack_vec3(data, s.v2, endian); //28 bytes
        ajax.pack_int(data, s.ks.length, endian); //32 bytes
        
        var zero_ks = ((s.v1.flag & SplineFlags.BREAK_TANGENTS) || (s.v2.flag & SplineFlags.BREAK_TANGENTS));
        
        for (var i=0; i<s.ks.length; i++) {
            if (zero_ks && i < ORDER)
              ajax.pack_double(data, 0.0, endian);
            else
              ajax.pack_double(data, s.ks[i], endian);
        }

        //nacl expects 16 doubles for ks, pad remaining with zeros. . .
        var rem = 16 - s.ks.length;

        for (var i=0; i<rem; i++) {
            ajax.pack_double(data, 0.0, endian);
        }
    }

    data = new Uint8Array(data).buffer;

    postMessage(data);
    yield;

    //console.log("got reply!", status.data);
    var dview = new DataView(status.data);
    var upack = _unpacker(dview);
    
    var getint = upack.getint;
    var getfloat = upack.getfloat;
    var getdouble = upack.getdouble;
    
    var tot = getint();
    
    var ret = [];
    var eidmap = spline.eidmap;
    
    for (var i=0; i<tot; i++) {
      var eid = getint(), totseg=getint();
      var segs = [];
      
      var seg = eidmap[eid];
      
      if (seg == undefined || seg.type != SplineTypes.SEGMENT) {
        console.log("WARNING: defunct segment in gen_draw_cache", seg);
      }
      
      ret.push(segs);
      for (var j=0; j<totseg; j++) {
        segs[j] = [0, 0, 0, 0];
      }
      
      for (var j=0; j<totseg*4; j++) {
        var p = new Vector3();
        
        p[0] = getdouble();
        p[1] = getdouble();
        p[2] = 0.0;
        
        segs[Math.floor(j/4)][j % 4] = p;
      }
      
      if (seg != undefined) {
        seg._draw_bzs = segs;
      }
    }
    
    //console.log("final result: ", ret);
    status.value = ret;
    
    //data from nacl is in this.data
    //final value will be in this.value
}

export function do_solve(sflags, Spline spline, int steps, float gk=0.95, return_promise=false, draw_id=0) {
    if (spline._solve_id == undefined) {
        spline._solve_id = solve_idgen++;
    }

    if (spline._solve_id in active_solves) {
        //delete active_jobs[spline._solve_id];
    }

    var job_id = solve_idgen++;
    active_solves[spline._solve_id] = job_id;
    active_jobs[job_id] = spline._solve_id;
    solve_starttimes[job_id] = time_ms();
    
    //if (spline === new Context().frameset.pathspline)
    //  return;
    var SplineFlags = sflags;

    spline.resolve = 1;
    spline.propagate_update_flags();
    
    for (var i=0; i<spline.segments.length; i++) {
        var seg = spline.segments[i];

        if ((!(seg.v1.flag & SplineFlags.UPDATE) && !(seg.v2.flag & SplineFlags.UPDATE)))
            continue;
        
        //need to clear seg.ks in this case
        if ((seg.v1.flag & SplineFlags.BREAK_TANGENTS) && (seg.v2.flag & SplineFlags.BREAK_TANGENTS)) {
          for (var j=0; j<seg.ks.length; j++) {
            seg.ks[j] = 0.0000001;
          }
        }
        
        //check for NaN
        for (var j=0; j<seg.ks.length; j++) {
            if (isNaN(seg.ks[j])) {
              seg.ks[j] = 0.000001;
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
        var start_time = solve_starttimes[job_id];
        
        window.pop_solve(draw_id);
        
        var skip = solve_endtimes[spline._solve_id] > start_time;
        skip = skip && solve_starttimes2[spline._solve_id] > start_time;
        
        //skip = skip || !(job_id in active_jobs);

        delete active_jobs[job_id];
        delete active_solves[spline._solve_id];
        delete solve_starttimes[job_id];
        
        if (skip) {
            if (on_reject != undefined) {
              on_reject();
            }
            
            console.log("Dropping dead solve job", job_id);
            return; //another solve started after this one
        }
        
        unload();
        
        //console.log("unload:", unload);
        solve_endtimes[spline._solve_id] = time_ms();
        solve_starttimes2[spline._solve_id] = start_time;
        
        //if (Math.random() > 0.95) {
        if (_DEBUG.solve_times) {
          console.log((solve_endtimes[spline._solve_id] - start_time).toFixed(2) + "ms");
        }
        //}
        
        for (var i = 0; i < spline.segments.length; i++) {
            var seg = spline.segments[i];
            seg.evaluate(0.5);

            for (var j = 0; j < seg.ks.length; j++) {
                if (isNaN(seg.ks[j])) {
                    console.log("NaN!", seg.ks, seg);
                    seg.ks[j] = 0;
                }
            }

            //don't need to do spline sort here
            //want to avoid per-frame updates of spline sort
            if (g_app_state.modalstate != ModalStates.TRANSFROMING) {
                if ((seg.v1.flag & SplineFlags.UPDATE) || (seg.v2.flag & SplineFlags.UPDATE))
                    seg.update_aabb();
            } else {
                if ((seg.v1.flag & SplineFlags.UPDATE) || (seg.v2.flag & SplineFlags.UPDATE))
                  seg.flag |= SplineFlags.UPDATE_AABB;
            }
        }

        for (var f of spline.faces) {
            for (var path of f.paths) {
                for (var l of path) {
                    if (l.v.flag & SplineFlags.UPDATE)
                        f.flag |= SplineFlags.UPDATE_AABB;
                }
            }
        }

        if (!spline.is_anim_path) {
            for (var i = 0; i < spline.handles.length; i++) {
                var h = spline.handles[i];
                h.flag &= ~(SplineFlags.UPDATE | SplineFlags.TEMP_TAG);
            }

            for (var i = 0; i < spline.verts.length; i++) {
                var v = spline.verts[i];
                v.flag &= ~(SplineFlags.UPDATE | SplineFlags.TEMP_TAG);
            }
        }
        
        if (spline.on_resolve != undefined) {
          spline.on_resolve();
          spline.on_resolve = undefined;
        }
        
        //do promise's callback, too
        if (on_finish != undefined) {
          on_finish();
        }
    }

    //console.log("finished nacl solve");
  
    spline.resolve = 0;
    
    var update_verts = new set();
    var slv = build_solver(spline, ORDER, undefined, 1, undefined, update_verts);
    var cs = slv.cs, edge_segs = slv.edge_segs;
    
    edge_segs = new set(edge_segs);
    
    /*
      edge_segs = [];
      var slv = new solver()
      for (var i=0; i<cs.length; i++) {
        slv.add(cs[i]);
      }
    
      slv.solve(70, 1.0, ORDER, edge_segs);
      finish();
      window.redraw_viewport();
    
      return;
    //*/
    
    call_api(nacl_solve, {
      callback : function(value) {
        //console.log("value", value);
        finish(value);
      }, error : function(error) {
        console.log("Nacl solve error!");
        window.pop_solve(draw_id);
      },
      typeid        : spline.is_anim_path ? JobTypes.PATHSOLVE : JobTypes.DRAWSOLVE,
      only_latest   : true
    }, spline, cs, update_verts, gk, edge_segs);
    
    return promise;
}

window.nacl_do_solve = do_solve;

function write_nacl_solve_new(writer, spline, cons, update_verts, update_segs, gk, edge_segs) {
    var idxmap = {}
    
    var i = 0;
    function add_vert(v) {
      writer.int32(v.eid);
      writer.int32(v.flag);
      writer.vec3(v);
      writer.int32(0); //pad int
      
      idxmap[v.eid] = i++;
    }
    
    for (var v of update_verts) {
      add_vert(v, true);
    }
    
    writer.int32(update_segs.length);
    writer.int32(0); //pad to 8 byte boundary
    
    var i = 0;
    for (var s of update_segs) {
      var flag = s.flag;
      
      if (edge_segs.has(s)) {
        flag |= FIXED_KS_FLAG;
        //console.log("edge segment!");
      }
      
      writer.int32(s.eid);
      writer.int32(flag);
      
      var klen = s.ks.length;
      var is_eseg = edge_segs.has(s);
      
      var zero_ks = ((s.v1.flag & SplineFlags.BREAK_TANGENTS) || (s.v2.flag & SplineFlags.BREAK_TANGENTS));
      
      for (var ji=0; ji<1; ji++) {
        for (var j=0; j<klen; j++) {
          if (zero_ks && j < ORDER)
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
    writer.int32(0.0); //pad to 8 byte boundary
    
    for (var i=0; i<cons.length; i++) {
      var c = cons[i];
      
      var type=0, seg1=-1, seg2=-1, param1=0, param2=0, fparam1=0, fparam2=0;
      
      if (c.type == "tan_c") {
          type = ConstraintTypes.TAN_CONSTRAINT;
          seg1 = c.params[0];
          seg2 = c.params[1];
          
          var v = seg1.shared_vert(seg2);
          
          param1 = idxmap[seg1.eid];
          param2 = idxmap[seg2.eid];
          
          fparam1 = seg1.v2 === v;
          fparam2 = seg2.v2 === v;

          if (c.klst.length == 1) {
            seg1 = c.klst[0] !== seg1.ks ? param2 : param1;
            seg2 = -1;
          } else {
            seg1 = param1;
            seg2 = param2;
          }
      } else if (c.type == "hard_tan_c") {
          type = ConstraintTypes.HARD_TAN_CONSTRAINT;
          
          var seg = c.params[0], tan = c.params[1], s = c.params[2];
          
          seg1 = idxmap[seg.eid];
          seg2 = -1;
          
          fparam1 = Math.atan2(tan[0], tan[1]);
          fparam2 = s;
      } else if (c.type == "curv_c") {
          type = ConstraintTypes.CURVATURE_CONSTRAINT;
          //console.log("curvature constraint!")
          seg1 = c.params[0];
          seg2 = c.params[1];
          
          //console.log("c.klst[0]:", c.klst[0], c.klst[0]===seg1.ks, c.klst[0]===seg2.ks);
          if (seg1.ks !== c.klst[0]) {
            //var tmp = seg1; seg1 = seg2; seg2 = tmp;
          }
          
          var v = seg1.shared_vert(seg2);
          
          //is v at seg1/seg2's endpoint or startpoint?
          fparam1 = seg1.v2 === v;
          fparam2 = seg2.v2 === v;
          
          param1 = idxmap[seg1.eid];
          param2 = idxmap[seg2.eid];
          
          seg1 = param1;
          seg2 = -1; //param2
      } else if (c.type == "copy_c") {
          type = ConstraintTypes.COPY_C_CONSTRAINT;
          //console.log("curvature constraint!")
          
          seg1 = c.params[0];
          param1 = seg1.v1.segments.length == 1; //c.params[1] === seg1.v1;
      } else {
       console.trace(c, seg1, seg2);
       throw new Error("unknown constraint type " + c.type);
      }
   
    //console.log("c.type, c.k, gk:", c.type, c.k, gk);
    
    writer.int32(type);
    writer.float32(c.k*gk);
    writer.float32(c.k2 == undefined ? c.k*gk : c.k2*gk);
    
    writer.int32(0); //pad int
    
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
    var endian = ajax.little_endian;
    var idxmap = {}
    
    var i = 0;
    function add_vert(v) {
      ajax.pack_int(data, v.eid, endian);
      ajax.pack_int(data, v.flag, endian);
      ajax.pack_vec3(data, v, endian);
      ajax.pack_int(data, 0, endian); //pad int
      
      idxmap[v.eid] = i++;
    }
    
    for (var v of update_verts) {
      add_vert(v, true);
    }
    
    ajax.pack_int(data, update_segs.length, endian);
    ajax.pack_int(data, 0, endian); //pad to 8 byte boundary
    
    var i = 0;
    for (var s of update_segs) {
      var flag = s.flag;
      
      if (edge_segs.has(s)) {
        flag |= FIXED_KS_FLAG;
        //console.log("edge segment!");
      }
      
      ajax.pack_int(data, s.eid, endian);
      ajax.pack_int(data, flag, endian);
      
      var klen = s.ks.length;
      var is_eseg = edge_segs.has(s);
      
      var zero_ks = ((s.v1.flag & SplineFlags.BREAK_TANGENTS) || (s.v2.flag & SplineFlags.BREAK_TANGENTS));
      
      for (var ji=0; ji<1; ji++) {
        for (var j=0; j<klen; j++) {
          if (zero_ks && j < ORDER)
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
    ajax.pack_int(data, 0, endian); //pad to 8 byte boundary
    
    for (var i=0; i<cons.length; i++) {
      var c = cons[i];
      
      var type=0, seg1=-1, seg2=-1, param1=0, param2=0, fparam1=0, fparam2=0;
      
      if (c.type == "tan_c") {
          type = ConstraintTypes.TAN_CONSTRAINT;
          seg1 = c.params[0];
          seg2 = c.params[1];
          
          var v = seg1.shared_vert(seg2);
          
          param1 = idxmap[seg1.eid];
          param2 = idxmap[seg2.eid];
          
          fparam1 = seg1.v2 === v;
          fparam2 = seg2.v2 === v;

          if (c.klst.length == 1) {
            seg1 = c.klst[0] !== seg1.ks ? param2 : param1;
            seg2 = -1;
          } else {
            seg1 = param1;
            seg2 = param2;
          }
     } else if (c.type == "hard_tan_c") {
          type = ConstraintTypes.HARD_TAN_CONSTRAINT;
          
          var seg = c.params[0], tan = c.params[1], s = c.params[2];
          
          seg1 = idxmap[seg.eid];
          seg2 = -1;
          
          fparam1 = Math.atan2(tan[0], tan[1]);
          fparam2 = s;
     } else if (c.type == "curv_c") {
          type = ConstraintTypes.CURVATURE_CONSTRAINT;
          //console.log("curvature constraint!")
          seg1 = c.params[0];
          seg2 = c.params[1];
          
          //console.log("c.klst[0]:", c.klst[0], c.klst[0]===seg1.ks, c.klst[0]===seg2.ks);
          if (seg1.ks !== c.klst[0]) {
            //var tmp = seg1; seg1 = seg2; seg2 = tmp;
          }
          
          var v = seg1.shared_vert(seg2);
          
          //is v at seg1/seg2's endpoint or startpoint?
          fparam1 = seg1.v2 === v;
          fparam2 = seg2.v2 === v;
          
          param1 = idxmap[seg1.eid];
          param2 = idxmap[seg2.eid];
          
          seg1 = param1;
          seg2 = -1; //param2
     } else if (c.type == "copy_c") {
          type = ConstraintTypes.COPY_C_CONSTRAINT;
          //console.log("curvature constraint!")
          
          seg1 = c.params[0];
          param1 = seg1.v1.segments.length == 1; //c.params[1] === seg1.v1;
     }
   
    //console.log("c.type, c.k, gk:", c.type, c.k, gk);
    
    ajax.pack_int(data, type, endian);
    ajax.pack_float(data, c.k*gk, endian);
    ajax.pack_float(data, c.k2 == undefined ? c.k*gk : c.k2*gk, endian);
    
    ajax.pack_int(data, 0, endian); //pad int
    
    ajax.pack_int(data, seg1, endian);
    ajax.pack_int(data, seg2, endian);
    
    ajax.pack_int(data, param1, endian);
    ajax.pack_int(data, param2, endian);
    
    ajax.pack_float(data, fparam1, endian);
    ajax.pack_float(data, fparam2, endian);
    //write remaining 33 doubles

    for (var j=0; j<33; j++) {
      ajax.pack_double(data, 0, endian);
    }
  }
  
  return idxmap;
}


function _unload(spline, data) {
  //handleMessage will have chopped off 
  //the type/msgid header for us
  
  var _i = 0;
  function getint() {
    _i += 4;
    return data.getInt32(_i-4, true);
  }
  function getfloat() {
    _i += 4;
    return data.getFloat32(_i-4, true);
  }
  function getdouble() {
    _i += 8;
    return data.getFloat64(_i-8, true);
  }
  
  var totvert = getint();
  getint(); //skip pad int 
  
  //skip past vertex data, we don't need it
  _i += 24*totvert; //sizeof(SplineVertex), see solver.h
  
  var totseg = getint();
  getint(); //skip pad int 
    
  /*
  for (var s of spline.segments) {
    for (var i=0; i<s.ks.length; i++) {
      s.ks[i] = 0;
    }
  }
  //*/
  
  for (var i=0; i<totseg; i++) {
    var eid = getint(), flag = getint();
    
    var seg = spline.eidmap[eid];
    if (seg == undefined || seg.type != SplineTypes.SEGMENT) {
      console.log("WARNING: defunct/invalid segment in nacl_solve!", eid);
      _i += 160; //sizeof(SplineSegment) - 2*sizeof(int32_t)
      continue;
    }
    
    for (var j=0; j<16; j++) {
      var d = getdouble();
      
      if (j < seg.ks.length) {
        seg.ks[j] = d;
      }
    }
    
    //skip handle data
    _i += 4*6;
    
    //skip v1/v2 fields
    _i += 4*2;
  }
}
  
function wrap_unload(spline, data) {
  return function() {
    _unload(spline, data);
  }
}

//generator is manually unpacked for easier analysis

export function nacl_solve(Function postMessage, ObjLit status, Spline spline, 
                            Array<constraint> cons, set<SplineVertex> update_verts,
                            float gk, set<SplineSegment> edge_segs) 
{
  var ret = {};
  
  ret.ret = {done : false, value : undefined};
  ret.stage = 0;
  ret[Symbol.iterator] = function() {
    return this;
  }
  
  ret.next = function() {
    if (ret.stage == 0) {
      this.stage++;
      this.stage0();
      
      return this.ret;
    } else if (ret.stage == 1) {
      this.stage++;
      this.stage1();
      
      this.ret.done = true;
      return this.ret;
    } else {
      this.ret.done = true;
      this.ret.value = undefined;
      
      return this.ret;
    }
  }
  
  var data;
  
  ret.stage0 = function() {
    //measured test had average bytes per constraint at 355.
    //but to be safe. . .
    
    var maxsize = (cons.length+1)*650 + 128;
    var writer = new TypedWriter(maxsize);
    
    var msgid = status.msgid;
    var endian = ajax.little_endian;
    
    var prof = false;
    
    //write vertices and their associated segments first
    start_message_new(writer, MessageTypes.SOLVE, msgid, endian);
    
    //build list of update segments
    var timestart = time_ms();
    
    var update_segs = new set();
    for (var v of update_verts) {
      for (var i=0; i<v.segments.length; i++) {
        var s = v.segments[i];
        
        update_segs.add(s);
      }
    }
    
    //add any stray vertices brought in by update segments
    for (var s of update_segs) {
      update_verts.add(s.v1);
      update_verts.add(s.v2);
    }
    
    if (prof) 
      console.log("time a:", time_ms() - timestart);
    
    writer.int32(update_verts.length);
    writer.int32(0); //pad to 8 byte boundary
    
    if (prof) 
      console.log("time b:", time_ms() - timestart);
    
    var idxmap = write_nacl_solve_new(writer, spline, cons, update_verts, update_segs, gk, edge_segs);
    var data = writer.final();
    
    /*
    console.log("datalen", data.byteLength, update_verts.length, update_segs.length, edge_segs.length, cons.length);
    console.log((data.byteLength/cons.length).toFixed(3));
    console.log(writer.buf);
    //*/
    
    if (prof) 
      console.log("time c:", time_ms() - timestart);
    
    if (prof) 
      console.log("time d:", time_ms() - timestart, data.byteLength);
    
    postMessage(data);
    
    if (prof) 
      console.log("time e:", time_ms() - timestart, "\n\n\n");
  }

  ret.stage1 = function() {  
    //console.log("Got reply!", status.data.byteLength, data.byteLength);
    
    //okay, now read back data (from status.data)
    data = new DataView(status.data);
    status.value = wrap_unload(spline, data);
  }
  
  return ret;
}

/*
export var sizemap = {
    "int"    : 4,
    "short"  : 2,
    "char"   : 1,
    "float"  : 4,
    "double" : 8,
    "long long" : 16
};

export class DVStruct {
    constructor(members) {
        function parse_array(str) {
            var cs = str.split("[");
            var type = cs[0];
            var size = parseInt(cs[1]);

            return [type, size];
        }

        function parse_type(str) {
            if (str.contains("[")) {
                var adata = parse_array(str);

                return {
                    type : "array",
                    data : adata,
                    size : adata[1]*sizemap[adata[0]]
                };
            }

            return {
                type : str,
                data : undefined,
                size : sizemap[str]
            }
        }

        this._members = {};

        var b = 0;
        for (var k in members) {
            var m = this.members[k] = m = parse_type(type);
            m.name = k;
            m.start = b;

            b += m.size;
        }

        this.size = b;
    }

    bind(buffer, i=0) {
        var ret = {};

        self.$i = i;
        ret.$buffer = buffer;

        for (var k in this._members) {
            Object.defineProperty(ret, k, {
                configurable : true,
                enumerable : true,
                get : {

                }
            })
        }
    }
}

var VertStruct = new DVStruct({
    eid  : "int",
    flag : "int",
    co   : "float[3]"
});

var SegmentStruct = new DVStruct({
    eid  : "int",
    flag : "int",
    ks   : "double[16]",
    h1   : "float[3]",
    h2   : "float[3]",
    v1   : "int",
    v2   : "int"
});

var ConstraintStruct = new DVStruct({
    type : "int",
    eid1 : "int",
    eid2 : "int",
    param1 : "int",
    param2 : "int",
    ws     : "double[16]",
    gs     : "double[16]",
    error  : "double"
})
*/

/*
 export class TinyPromise {
 constructor() {
 this.thenlist = []
 this._id = promid++;
 this.data = undefined;
 this.done = false;
 }

 then(cb, thisvar) {
 var ret = new TinyPromise();

 ret._src_id = this._id;
 ret.parent = this;

 this.thenlist.push([cv, thisvar, ret]);
 }

 _fire(data, is_done=true) {
 this.data = data;

 for (var i=0; i<this.thenlist.length; i++) {
 var cc = this.thenlist[i][0], thisvar = this.thenlist[i][1];
 var prom = this.thenlist[i][2];

 }

 this.done = is_done;
 }
 }//*/
