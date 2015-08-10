"use strict";

var INCREMENTAL = true;

var mmax = Math.max, mmin = Math.min, mfloor = Math.floor;
var abs = Math.abs, sqrt=Math.sqrt, sin=Math.sin, cos=Math.cos,
    pow = Math.pow, log=Math.log, acos=Math.acos, asin=Math.asin,
    PI=Math.PI;
    
var DEBUG = false;

import {constraint, solver} from "solver";
import {ModalStates} from 'toolops_api';
import {SplineTypes, SplineFlags} from 'spline_types';

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
} from 'spline_math_safe';

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

function solve_intern(spline, update_verts, order, goal_order, steps, gk) {
    static con_cache = {
        list : [],
        used : 0
    };

    con_cache.used = 0;

    function con(w, ks, order, func, params) {
        if (con_cache.used < con_cache.list.length) {
            return con_cache.list[con_cache.used++].cache_init(w, ks, order, func, params);
        } else {
            var ret = new constraint(w, ks, order, func, params);
            con_cache.list.push(ret);
            con_cache.used++;
            return ret;
        }
    }

    if (order == undefined)
        order = ORDER;
    if (steps == undefined)
        steps = 35;
    if (gk == undefined)
        gk = 4.0;
    
    var edge_segs = [];
    
    var UPDATE = SplineFlags.UPDATE;
    for (var i=0; INCREMENTAL && i<spline.segments.length; i++) {
        var seg = spline.segments[i];
        if ((seg.v1.flag & UPDATE) != (seg.v2.flag & UPDATE)) {
            for (var j=0; j<KTOTKS; j++) {
                seg._last_ks[j] = seg.ks[j];
            }
            seg.flag |= SplineFlags.TEMP_TAG;
            edge_segs.push(seg);

            var s2=undefined, s3=undefined;
            if (seg.v1.segments.length == 2) s2 = seg.v1.other_segment(seg);
            if (seg.v2.segments.length == 2) s3 = seg.v2.other_segment(seg);
        } else {
            seg.flag &= ~SplineFlags.TEMP_TAG;
        }
    }

    var start_time = time_ms();

    window._SOLVING = true;
    
    function hard_tan_c(params) {
        var seg = params[0], tan = params[1], s = params[2];

        var dv = seg.derivative(s, order);
        dv.normalize();

        return abs(dv.vectorDistance(tan));
    }

    function tan_c(params) {
        var seg1 = params[0], seg2 = params[1];
        var v, s1=0, s2=0;

        if (seg1.v1 == seg2.v1 || seg1.v1 == seg2.v2)
            v = seg1.v1;
        else if (seg1.v2 == seg2.v1 || seg1.v2 == seg2.v2)
            v = seg1.v2;
        else
            console.trace("EVIL INCARNATE!");

        var eps = 0.0001;
        s1 = v == seg1.v1 ? eps : 1.0-eps;
        s2 = v == seg2.v1 ? eps : 1.0-eps;

        var t1 = seg1.derivative(s1, order);
        var t2 = seg2.derivative(s2, order);

        t1.normalize(); t2.normalize();

        if (seg1.v1.eid == seg2.v1.eid || seg1.v2.eid == seg2.v2.eid) {
            t1.negate();
        }

        /*
         if (t1[1] == 0.0)
         return t2[1];
         if (t2[1] == 0.0)
         return t1[1];

         return abs(t1[0]/t1[1] - t2[0]/t2[1]);
         //return abs(atan2(t1[0], t1[1]) - atan2(t2[0], t2[1])); //abs(t1[0]/t1[1] - t2[0]/t2[1]);
         //*/

        var d = t1.dot(t2);
        d = mmax(mmin(d, 1.0), -1.0);
        return acos(d);

        var ret = abs(t1.vectorDistance(t2));
        return ret;
    }

    function handle_curv_c(params) {
        if (order < 4) return 0;

        //HARD CLAMP
        var seg1 = params[0], seg2 = params[1];
        var h1 = params[2], h2 = params[3];

        var len1 = seg1.ks[KSCALE] - h1.vectorDistance(seg1.handle_vertex(h1));
        var len2 = seg2.ks[KSCALE] - h2.vectorDistance(seg2.handle_vertex(h2));

        var k1i = h1 == seg1.h1 ? 1 : order-2;
        var k2i = h2 == seg2.h1 ? 1 : order-2;

        var k1 = (len1 != 0.0 ? 1.0 / len1 : 0.0) * seg1.ks[KSCALE];
        var k2 = (len2 != 0.0 ? 1.0 / len2 : 0.0) * seg2.ks[KSCALE];

        var s1 = seg1.ks[k1i] < 0.0 ? -1 : 1;
        var s2 = seg2.ks[k2i] < 0.0 ? -1 : 1;

        if (isNaN(k1) || isNaN(k2)) return 0;

        if (abs(seg1.ks[k1i]) < k1) seg1.ks[k1i] = k1*s1;
        if (abs(seg2.ks[k2i]) < k2) seg2.ks[k2i] = k2*s2;

        return 0;
    }

    function curv_c(params) {
        //HARD CLAMP
        var seg1 = params[0], seg2 = params[1];
        var v, s1=0, s2=0;

        /*
         seg1.eval(0.5);
         seg2.eval(0.5);
         //*/

        if (seg1.v1 == seg2.v1 || seg1.v1 == seg2.v2)
            v = seg1.v1;
        else if (seg1.v2 == seg2.v1 || seg1.v2 == seg2.v2)
            v = seg1.v2;
        else
            console.trace("EVIL INCARNATE!");

        var s1 = v == seg1.v1 ? 0 : order-1;
        var s2 = v == seg2.v1 ? 0 : order-1;

        var k1 = seg1.ks[s1]/seg1.ks[KSCALE];
        var k2 = seg2.ks[s2]/seg2.ks[KSCALE];

        if (seg1.v1.eid == seg2.v1.eid || seg1.v2.eid == seg2.v2.eid) {
            k1 = -k1;
        }

        var k3 = (k1+k2)*0.5;

        seg2.ks[s2] = (k3*seg2.ks[KSCALE]);//2+seg2.ks[s2]/2;

        if (seg1.v1.eid == seg2.v1.eid || seg1.v2.eid == seg2.v2.eid) {
            k3 = -k3;
        }
        seg1.ks[s1] = (k3*seg1.ks[KSCALE]);//2+seg1.ks[s1]/2;

        return 0;
    }

    var cs = [];
    
    function copy_c(params) {
      var v = params[1], seg = params[0];
      
      var s1 = v === seg.v1 ? 0 : order-1;
      var s2 = v === seg.v1 ? order-1 : 0;
      
      seg.ks[s1] += (seg.ks[s2]-seg.ks[s1])*gk*0.5;
      
      return 0.0;
    }

    //handle manual tangents
    for (var i=0; i<spline.handles.length; i++) {
        var h = spline.handles[i];

        if (!h.use) continue;

        var seg = h.segments[0];

        if (seg.v1.vectorDistance(seg.v2) < 2)
            continue;

        var v = seg.handle_vertex(h);

        if (INCREMENTAL && !((v.flag) & SplineFlags.UPDATE))
            continue;

        var tan1 = new Vector3(h).sub(seg.handle_vertex(h)).normalize();

        if (h == seg.h2)
            tan1.negate();

        if (isNaN(tan1.dot(tan1)) || tan1.dot(tan1) == 0.0) continue;

        var s = h == seg.h1 ? 0 : 1;

        //console.log("tan1", tan1);

        //var tc = new constraint(tw1, [ss1.ks, ss2.ks], order, tan_c, params);
        var do_curv = (v.flag & SplineFlags.BREAK_CURVATURES);

        var htw = 1.0;

        if (h.owning_vertex == undefined) continue;

        var do_tan = !((h.flag) & SplineFlags.BREAK_TANGENTS);
        do_tan = do_tan && !(h.flag & SplineFlags.AUTO_PAIRED_HANDLE);

        if (do_tan) {
            var tc = new constraint(htw, [seg.ks], order, hard_tan_c, [seg, tan1, s]);
            tc.type = "hard_tan_c";
            cs.push(tc);
            
            update_verts.add(h);
        }

        if (h.hpair == undefined) continue;

        var ss1 = seg, h2 = h.hpair, ss2=h2.owning_segment;

        if ((h.flag & SplineFlags.AUTO_PAIRED_HANDLE) &&
            !((seg.handle_vertex(h).flag & SplineFlags.BREAK_TANGENTS)))
        {
            var tc = new constraint(0.2, [ss1.ks], order, tan_c, [ss1, ss2]);
            tc.type = "tan_c";
            tc.k2 = 0.8
            cs.push(tc);
            
            var tc = new constraint(0.2, [ss2.ks], order, tan_c, [ss2, ss1]);
            tc.type = "tan_c";
            tc.k2 = 0.8
            cs.push(tc);
            
            update_verts.add(h);
        }

        /*
         var cw1 = 0.5, cw2=cw1;

         var cws = [0, 0, 0, 0, 0, 0, 0, 0];
         cws[0] = cws[order-1] = 1;
         if (order == 3) cws[1] = 1;

         var cc = new constraint(cw1, [ss1.ks], order, handle_curv_c, [ss1, ss2, h, h2]);
         slv.add(cc);
         var cc = new constraint(cw2, [ss2.ks], order, handle_curv_c, [ss1, ss2, h, h2]);
         slv.add(cc);
         */

        var cc = new constraint(1, [ss1.ks], order, curv_c, [ss1, ss2, h, h2]);
        cc.type = "curv_c";
        cs.push(cc);
        
        var cc = new constraint(1, [ss2.ks], order, curv_c, [ss1, ss2, h, h2]);
        cs.push(cc);
        cc.type = "curv_c";
        
        update_verts.add(h);
    }

    var limits = {
        v_curve_limit : 12,
        v_tan_limit   : 1
    };

    for (var i=0; i<spline.verts.length; i++) {
        var v = spline.verts[i];

        if (INCREMENTAL && !(v.flag & SplineFlags.UPDATE)) continue;
        
        if (v.segments.length == 1 && !(v.flag & SplineFlags.BREAK_CURVATURES)) {
          var seg = v.segments[0];
          
          var cc = new constraint(1.0, [seg.ks], order, copy_c, [seg, v]);
          cc.type = "copy_c";
          cc.k2 = 0.8
          cs.push(cc);
        }

        if (v.segments.length != 2) continue;

        var ss1 = v.segments[0], ss2 = v.segments[1];

        var bad = false;

        //ignore anything connected to a zero-length segment
        for (var j=0; j<v.segments.length; j++) {
            var seg = v.segments[j];
            if (seg.v1.vectorDistance(seg.v2) < 2) {
                bad = true;
            }
        }

        var mindis = Math.min(ss1.other_vert(v).vectorDistance(v), ss2.other_vert(v).vectorDistance(v));
        var maxdis = Math.max(ss1.other_vert(v).vectorDistance(v), ss2.other_vert(v).vectorDistance(v));

        if (mindis == 0.0) {
            //bad = true;
        } else {
            //bad = bad || maxdis/mindis > 20.0;
        }
        //bad = bad || (mindis < limits.v_tan_limit);

        if (bad) {
            console.log("Ignoring!");
        }

        if (bad) continue;

        var l1 = ss1.length, l2 = ss2.length;
        var l3 = (l1+l2)*0.5;
        var tw1 = Math.min(l1/l2, l2/l1), tw2 = tw1
        tw1 = tw2 = 1.0;

        if (!(v.flag & SplineFlags.BREAK_TANGENTS)) {
            var tc = new constraint(0.2, [ss2.ks], order, tan_c, [ss1, ss2]);
            
            tc.k2 = 0.8;
            tc.type = "tan_c";
            cs.push(tc);
            
            var tc = new constraint(0.2, [ss1.ks], order, tan_c, [ss2, ss1]);
            tc.k2 = 0.8
            tc.type = "tan_c";
            cs.push(tc);

            update_verts.add(v);
        } else {
            continue;
        }

        if (v.flag & SplineFlags.BREAK_CURVATURES)
            continue;

        if (mindis == 0.0) {
            bad = true;
        } else {
            bad = bad || maxdis/mindis > 9.0;
        }

        if (bad)
            continue;

        //if (mindis < limits.v_curve_limit)
        //  continue;

        var cc = new constraint(1, [ss1.ks], order, curv_c, [ss1, ss2]);
        cc.type = "curv_c";
        cs.push(cc);
        
        var cc = new constraint(1, [ss2.ks], order, curv_c, [ss2, ss1]);
        cc.type = "curv_c";
        cs.push(cc);

        update_verts.add(v);
    }
    
    return [cs, edge_segs];
}

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

        for (var i=0; i<s.ks.length; i++) {
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

    if (!INCREMENTAL) {
      for (var v of spline.verts) {
        v.flag |= sflags.UPDATE;
      }
    }
    
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
    
    for (var i=0; i<spline.verts.length; i++) {
      var v = spline.verts[i];
    }
    
    for (var i=0; i<spline.segments.length; i++) {
        var seg = spline.segments[i];

        if (INCREMENTAL && (!(seg.v1.flag & SplineFlags.UPDATE) || !(seg.v2.flag & SplineFlags.UPDATE)))
            continue;
        
        /* do this when writing seg.ks
        for (var j=0; j<seg.ks.length; j++) {
            seg.ks[j] = 0.000001; //(j-ORDER/2)*4;
        }
        */

        seg.eval(0.5);
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
        
        console.log((solve_endtimes[spline._solve_id]-start_time).toFixed(2)+"ms");
        
        for (var i = 0; i < spline.segments.length; i++) {
            var seg = spline.segments[i];
            seg.eval(0.5);

            for (var j = 0; j < seg.ks.length; j++) {
                if (isNaN(seg.ks[j])) {
                    seg.ks[j] = 0;
                }
            }

            //don't need to do spline here
            //want to avoid per-frame updates of spline sort
            if (g_app_state.modalstate != ModalStates.TRANSFROMING) {
                if ((seg.v1.flag & SplineFlags.UPDATE) || (seg.v2.flag & SplineFlags.UPDATE))
                    seg.update_aabb();
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
    var ret = solve_intern(spline, update_verts, ORDER, undefined, 30, 1);
    var cs=ret[0], edge_segs=ret[1];
    
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
      
      for (var ji=0; ji<1; ji++) {
        for (var j=0; j<klen; j++) {
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

export function* nacl_solve(Function postMessage, ObjLit status, Spline spline, 
                            Array<constraint> cons, set<SplineVertex> update_verts,
                            float gk, set<SplineSegment> edge_segs) 
{
  var msgid = status.msgid;
  var endian = ajax.little_endian;
  
  //write vertices and their associated segments first
  var data = start_message(MessageTypes.SOLVE, msgid, endian);
  
  //build list of update segments
  var update_segs = new set();
  for (var v of update_verts) {
    for (var i=0; i<v.segments.length; i++) {
      var s = v.segments[i];
      
      update_segs.add(s)
    }
  }
  
  //add any stray vertices brought in by update segments
  for (var s of update_segs) {
    update_verts.add(s.v1);
    update_verts.add(s.v2);
  }
  
  ajax.pack_int(data, update_verts.length, endian);
  ajax.pack_int(data, 0, endian); //pad to 8 byte boundary
  
  var idxmap = write_nacl_solve(data, spline, cons, update_verts, update_segs, gk, edge_segs);
  
  data = new Uint8Array(data).buffer;
  postMessage(data);
  yield; //wait for reply from nacl
  
  //console.log("Got reply!", status.data.byteLength, data.byteLength);
  
  //okay, now read back data (from status.data)
  data = new DataView(status.data);
  status.value = wrap_unload(spline, data);
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
