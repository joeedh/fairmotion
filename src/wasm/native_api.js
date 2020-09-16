import * as wasm from './built_wasm.js';

export let wasmModule = wasm;

export let active_solves = {};
export let solve_starttimes = {};
export let solve_starttimes2 = {};
export let solve_endtimes = {};
export let active_jobs = {}

import {constraint, solver} from "../curve/solver.js";
import {ModalStates} from '../core/toolops_api.js';
import {SplineTypes, SplineFlags} from '../curve/spline_base.js';
import {build_solver, solve_pre} from '../curve/spline_math_hermite.js';

import {TypedWriter} from '../util/typedwriter.js';
import * as util from '../path.ux/scripts/util/util.js';
import {Vector2, Vector3, Vector4, Matrix4, Quat} from '../path.ux/scripts/util/vectormath.js';

import * as config from '../config/config.js';

//XXX evil super-old module!
import * as ajax from '../core/ajax.js';

export function isReady() {
  return wasm.calledRun;
}

const mmax = Math.max, mmin = Math.min, mfloor = Math.floor;
const abs = Math.abs, sqrt=Math.sqrt, sin=Math.sin, cos=Math.cos,
  pow = Math.pow, log=Math.log, acos=Math.acos, asin=Math.asin,
  PI=Math.PI;

let last_call = undefined;
let DEBUG = false;
const FIXED_KS_FLAG = SplineFlags.FIXED_KS;

export const callbacks = {};
let msg_idgen = 0;
let solve_idgen = 0;

import {
  ORDER, KSCALE, KANGLE,
  KSTARTX, KSTARTY, KSTARTZ,
  KTOTKS, INT_STEPS
} from '../curve/spline_math_hermite.js';
import {DISABLE_SOLVE} from "../config/config.js";

export function onMessage(type : number, message : ArrayBuffer, ptr : number) {
  let iview = new Int32Array(message);
  
  //find callback id
  let id = iview[1];
  
  if (DEBUG)
    console.log("got array buffer!", message, "ID", id);
  
  if (!(id in callbacks)) {
    if (DEBUG)
      console.log("Warning, dead communication callback", id);
    return;
  }
  
  let job = callbacks[id], iter=job.job;
  if (DEBUG)
    console.log("job:", job);
  
  job.status.data = message.slice(8, message.byteLength);
  if (DEBUG)
    console.log("iter:", iter, iter.data);
  
  let ret = iter.next();
  
  if (ret.done) {
    delete callbacks[id];
    
    if (job.callback !== undefined)
      job.callback.call(job.thisvar, job.status.value);
  }
  
  //free data now we are done with it (hopefully)
  wasm._free(ptr);
}

export let messageQueue = [];
let queueMessages = false;

export function queueUpMessages(state) {
  queueMessages = state;
}

export function flushQueue() {
  let queue =  messageQueue.slice(0, messageQueue.length);
  messageQueue.length = 0;
  
  //console.log(queue, "=======");
  
  for (let msg of queue) {
    onMessage(msg.type, msg.msg, msg.ptr);
  }
}

//called from within wasm (C) code to post messages
window._wasm_post_message = function(type, ptr, len) {
  if (DEBUG) console.log("got wasm message", type, ptr, len);
  
  let message = wasm.HEAPU8.slice(ptr, ptr+len).buffer;
  if (DEBUG) console.log(message);
  
  if (!queueMessages) {
    onMessage(type, message, ptr);
  } else {
    if (DEBUG) console.log("Queuing a message!", type, message, ptr, "=======");
    
    messageQueue.push({
      type : type,
      msg  : message,
      ptr  : ptr
    });
  }
}

let wv1, wv2, wks, wco;
let pv1, pv2, pks, pco;

function init_eval_mem() {
  let ptr = wasm._malloc(8*3 + 8*16 + 8*3*2);
  let mem = wasm.HEAPU8;

  wv1 = new Float64Array(mem.buffer, ptr, 2); pv1 = ptr; ptr += 8*2;
  wv2 = new Float64Array(mem.buffer, ptr, 2); pv2 = ptr; ptr += 8*2;
  wks = new Float64Array(mem.buffer, ptr, 16); pks = ptr; ptr += 16*8;
  wco = new Float64Array(mem.buffer, ptr, 3); pco = ptr;
}

export function onSegmentDestroy(seg) {
  if (seg.ks._has_wasm) {
    wasm._free(seg.ks.ptr);
    seg.ks = new Float64Array(16);
  }
}

/** make sure segment has wasm-allocate .ks */
export function checkSegment(seg) {
  if (!seg.ks._has_wasm) {
    let ks = seg.ks;
    let ptr2 = wasm._malloc(8*16);
    let ks2 = new Float64Array(wasm.HEAPU8.buffer, ptr2, ks.length);

    for (let i=0; i<ks.length; i++) {
      ks2[i] = ks[i];
    }

    ks2._has_wasm = true;
    ks2.ptr = ptr2;

    seg.ks = ks2;
  }
}

let evalrets = util.cachering.fromConstructor(Vector2, 64);
export function evalCurve(seg, s, v1, v2, ks, no_update=false) {
  if (!wv1) {
    init_eval_mem();
  }

  for (let i=0; i<2; i++) {
    wv1[i] = v1[i];
    wv2[i] = v2[i];
  }

  /*for (let i=0; i<ks.length; i++) {
      wks[i] = ks[i];
  }//*/

  checkSegment(seg);

  wasm._evalCurve(pco, s, seg.ks.ptr, pv1, pv2, no_update ? 1 : 0);

  /*
  if (!no_update) {
    for (let i=0; i<ks.length; i++) {
      ks[i] = wks[i];
    }
  }//*/

  let ret = evalrets.next();
  ret[0] = wco[0];
  ret[1] = wco[1];

  return ret;
}

export function postToWasm(type : int, msg : ArrayBuffer) {
  
  if (!(msg instanceof ArrayBuffer)) {
    throw new Error("msg must be array buffer");
  }
  
  let bytes = new Uint8Array(msg);
  let ptr = wasm._malloc(msg.byteLength*2);
  let mem = wasm.HEAPU8;
  
  for (let i=ptr; i<ptr+bytes.length; i++) {
    mem[i] = bytes[i-ptr];
  }

  wasm._gotMessage(type, ptr, msg.byteLength);
  wasm._free(ptr);
}

export function test_wasm() {
  let msg = new Int32Array([0, 1, 2, 3, 2, 1, -1]);
  console.log(msg);
  
  postToWasm(0, msg.buffer);
}

export const MessageTypes = {
  GEN_DRAW_BEZIERS : 0,
  REPLY            : 1,
  SOLVE            : 2
}

export const ConstraintTypes = {
  TAN_CONSTRAINT       : 0,
  HARD_TAN_CONSTRAINT  : 1,
  CURVATURE_CONSTRAINT : 2,
  COPY_C_CONSTRAINT    : 3
};

export const JobTypes = {
  DRAWSOLVE : 1,
  PATHSOLVE : 2,
  SOLVE     : 1|2
};

export function clear_jobs_except_latest(typeid) {
  let last = undefined;
  let lastk = undefined;
  
  for (let k in callbacks) {
    let job = callbacks[k];
    
    if (job.typeid & typeid) {
      job._skip = 1;
      delete callbacks[k];
      last = job;
      lastk = k;
    }
  }
  
  if (last !== undefined) {
    callbacks[lastk] = last;
    delete last._skip;
  }
}

export function clear_jobs_except_first(typeid) {
  let last = undefined;
  let lastk = undefined;
  
  for (let k in callbacks) {
    let job = callbacks[k];
    
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
  for (let k in callbacks) {

    let job = callbacks[k];
    if (job.typeid & typeid) {
      job._skip = 1;
      delete callbacks[k];
    }
  }
}

export function call_api(job, params=undefined) {
  let callback, error, thisvar, typeid, only_latest=false;
  
  if (params !== undefined) {
    callback = params.callback;
    thisvar = params.thisvar !== undefined ? params.thisvar : self;
    error = params.error;
    only_latest = params.only_latest !== undefined ? params.only_latest : false;
    typeid = params.typeid;
  }

  let postMessage = function(type, msg) {
    postToWasm(type, msg);
  }

  let id = msg_idgen++;

  let status = {
    msgid : id,
    data  : undefined
  }
  let args = [postMessage, status];
  
  for (let i=2; i<arguments.length; i++) {
    args.push(arguments[i]);
  }
  
  //block any messages until after the "callbacks[id] = ..." line below.
  queueUpMessages(true);

  let iter = job.apply(job, args);

  let ret = iter.next();
  if (ret.done) {
    callback.call(thisvar, iter.value);
    return;
  }
  
  if (DEBUG) console.log("  SETTING CALLBACK WITH ID", id);
  
  callbacks[id] = {
    job      : iter,
    typeid   : typeid,
    only_latest : only_latest,//only return latest for all jobs of same typeid
    callback : callback,
    thisvar  : thisvar,
    error    : error,
    status   : status //status object used to communicate with job
  };
  
  //turn off message queuing
  queueUpMessages(false);
  
  //flush any queued messages
  flushQueue();
}


export function start_message(type, msgid, endian) {
  let data = [];
  
  ajax.pack_int(data, type, endian);
  ajax.pack_int(data, msgid, endian);
  
  return data;
}

export function start_message_new(writer, type, msgid, endian) {
  writer.int32(type);
  writer.int32(msgid);
}

function _unpacker(dview) {
  let b = 0;
  
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


//sflags should be SplineFlags from spline_types.js,
//passed in here to avoid a cyclic module dependency
export function do_solve(sflags : int, spline : Spline, steps : int, gk=0.95, return_promise=false) {
  if (config.DISABLE_SOLVE) {
    return new Promise((accept, reject) => {accept()});
  }

  let draw_id = push_solve(spline);

  //if (spline._solve_id !== undefined && spline._solve_id in active_solves) {
  //  delete active_jobs[spline._solve_id];
  //}

  spline._solve_id = draw_id;

  let job_id = solve_idgen++;
  active_solves[spline._solve_id] = job_id;
  active_jobs[job_id] = spline._solve_id;
  solve_starttimes[job_id] = time_ms();
  
  //if (spline === new Context().frameset.pathspline)
  //  return;
  const SplineFlags = sflags;
  
  spline.resolve = 1;

  solve_pre(spline);


  let on_finish, on_reject, promise;
  
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
    let start_time = solve_starttimes[job_id];
    
    window.pop_solve(draw_id);

    let skip = solve_endtimes[spline._solve_id] > start_time;
    skip = skip && solve_starttimes2[spline._solve_id] > start_time;
    
    //skip = skip || !(job_id in active_jobs);
    
    delete active_jobs[job_id];
    delete active_solves[spline._solve_id];
    delete solve_starttimes[job_id];
    
    if (skip) {
      if (on_reject !== undefined) {
        on_reject();
      }
      
      console.log("Dropping dead solve job", job_id);
      return; //another solve started after this one
    }
    
    unload();
    
    //console.log("unload:", unload);
    solve_endtimes[spline._solve_id] = time_ms();
    solve_starttimes2[spline._solve_id] = start_time;
    
    if (_DEBUG.solve_times) {
      console.log((solve_endtimes[spline._solve_id] - start_time).toFixed(2) + "ms");
    }

    for (let seg of spline.segments) {
      seg.evaluate(0.5);
      
      for (let j = 0; j < seg.ks.length; j++) {
        if (isNaN(seg.ks[j])) {
          console.log("NaN!", seg.ks, seg);
          seg.ks[j] = 0;
        }
      }
      
      //don't need to do spline sort here
      //want to avoid per-frame updates of spline sort
      if (g_app_state.modalstate !== ModalStates.TRANSFROMING) {
        if ((seg.v1.flag & SplineFlags.UPDATE) || (seg.v2.flag & SplineFlags.UPDATE))
          seg.update_aabb();
      } else {
        if ((seg.v1.flag & SplineFlags.UPDATE) || (seg.v2.flag & SplineFlags.UPDATE))
          seg.flag |= SplineFlags.UPDATE_AABB;
      }
    }
    
    for (let f of spline.faces) {
      for (let path of f.paths) {
        for (let l of path) {
          if (l.v.flag & SplineFlags.UPDATE)
            f.flag |= SplineFlags.UPDATE_AABB;
        }
      }
    }


    for (let h of spline.handles) {
      h.flag &= ~(SplineFlags.UPDATE | SplineFlags.TEMP_TAG);
    }

    for (let v of spline.verts) {
      v.flag &= ~(SplineFlags.UPDATE | SplineFlags.TEMP_TAG);
    }

    for (let seg of spline.segments) {
      seg.flag &= ~SplineFlags.UPDATE;
    }

    if (spline.on_resolve !== undefined) {
      spline.on_resolve();
      spline.on_resolve = undefined;
    }
    
    //do promise's callback, too
    if (on_finish !== undefined) {
      on_finish();
    }
  }

  spline.resolve = 0;
  
  let update_verts = new set();
  let slv = build_solver(spline, ORDER, undefined, 1, undefined, update_verts);
  let cs = slv.cs, edge_segs = slv.edge_segs;
  
  edge_segs = new set(edge_segs);

  //on_finish();
  //return promise;

  call_api(wasm_solve, {
    callback : function(value) {
      //console.log("value", value);
      finish(value);
    }, error : function(error) {
      console.log("wasm solve error!");
      window.pop_solve(draw_id);
    },
    typeid        : spline.is_anim_path ? JobTypes.PATHSOLVE : JobTypes.DRAWSOLVE,
    only_latest   : true
  }, spline, cs, update_verts, gk, edge_segs);
  
  return promise;
}

window.wasm_do_solve = do_solve;

function write_wasm_solve_new(writer, spline, cons, update_verts, update_segs, gk, edge_segs) {
  let idxmap = {}

  let i = 0;
  function add_vert(v) {
    writer.int32(v.eid);
    writer.int32(v.flag);
    writer.float32(v[0]);
    writer.float32(v[1]);
    writer.float32(0.0);
    writer.int32(0); //pad int
    
    idxmap[v.eid] = i++;
  }
  
  for (let v of update_verts) {
    add_vert(v, true);
  }
  
  writer.int32(update_segs.length);
  writer.int32(0); //pad to 8 byte boundary

  i = 0;
  for (let s of update_segs) {
    let flag = s.flag;
    
    let count = s.v1.flag & SplineFlags.UPDATE ? 1 : 0;
    count += s.v2.flag & SplineFlags.UPDATE ? 1 : 0;

    if (count < 2) {
      flag |= FIXED_KS_FLAG;
      //console.log("edge segment!");
    }

    writer.int32(s.eid);
    writer.int32(flag);
    
    let klen = s.ks.length;
    let is_eseg = edge_segs.has(s);
    
    //let zero_ks = ((s.v1.flag & SplineFlags.BREAK_TANGENTS) || (s.v2.flag & SplineFlags.BREAK_TANGENTS));
    checkSegment(s);
    writer.uint32(s.ks.ptr);

    writer.vec3(s.h1);
    writer.vec3(s.h2);
    writer.int32(idxmap[s.v1.eid]);
    writer.int32(idxmap[s.v2.eid]);

    writer.int32(0); //pad to eight byte boundary
    
    idxmap[s.eid] = i++;
  }

  //console.log("DATA0", writer.i/1024 + "kb");

  writer.int32(cons.length);
  writer.int32(0.0); //pad to 8 byte boundary
  
  for (let i=0; i<cons.length; i++) {
    let c = cons[i];

    let type=0, seg1=-1, seg2=-1, param1=0, param2=0, fparam1=0, fparam2=0;
    
    if (c.type === "tan_c") {
      type = ConstraintTypes.TAN_CONSTRAINT;
      seg1 = c.params[0];
      seg2 = c.params[1];

      let v = seg1.shared_vert(seg2);
      
      param1 = idxmap[seg1.eid];
      param2 = idxmap[seg2.eid];
      
      fparam1 = seg1.v2 === v;
      fparam2 = seg2.v2 === v;
      
      if (c.klst.length === 1) {
        seg1 = c.klst[0] !== seg1.ks ? param2 : param1;
        seg2 = -1;
      } else {
        seg1 = param1;
        seg2 = param2;
      }
    } else if (c.type === "hard_tan_c") {
      type = ConstraintTypes.HARD_TAN_CONSTRAINT;

      let seg = c.params[0], tan = c.params[1], s = c.params[2];
      
      seg1 = idxmap[seg.eid];
      seg2 = -1;
      
      fparam1 = Math.atan2(tan[0], tan[1]);
      fparam2 = s;
    } else if (c.type === "curv_c") {
      type = ConstraintTypes.CURVATURE_CONSTRAINT;
      //console.log("curvature constraint!")
      seg1 = c.params[0];
      seg2 = c.params[1];
      
      //console.log("c.klst[0]:", c.klst[0], c.klst[0]===seg1.ks, c.klst[0]===seg2.ks);
      if (seg1.ks !== c.klst[0]) {
        //let tmp = seg1; seg1 = seg2; seg2 = tmp;
      }

      let v = seg1.shared_vert(seg2);
      
      //is v at seg1/seg2's endpoint or startpoint?
      fparam1 = seg1.v2 === v;
      fparam2 = seg2.v2 === v;
      
      param1 = idxmap[seg1.eid];
      param2 = idxmap[seg2.eid];
      
      seg1 = param1;
      seg2 = -1; //param2
    } else if (c.type === "copy_c") {
      type = ConstraintTypes.COPY_C_CONSTRAINT;
      //console.log("curvature constraint!")
      
      seg1 = c.params[0];
      param1 = seg1.v1.segments.length === 1; //c.params[1] === seg1.v1;
    } else {
      console.trace(c, seg1, seg2);
      throw new Error("unknown constraint type " + c.type);
    }
    
    //console.log("c.type, c.k, gk:", c.type, c.k, gk);
    
    writer.int32(type);
    writer.float32(c.k);
    writer.float32(c.k2 === undefined ? c.k : c.k2);
    
    writer.int32(0); //pad int
    
    writer.int32(seg1);
    writer.int32(seg2);
    
    writer.int32(param1);
    writer.int32(param2);
    
    writer.float32(fparam1);
    writer.float32(fparam2);
    
    for (let j=0; j<17; j++) {
      writer.float64(0);
    }
  }
  
  return idxmap;
}

function write_wasm_solve(data, spline, cons, update_verts, update_segs, gk, edge_segs) {
  let endian = ajax.little_endian;
  let idxmap = {}

  let i = 0;
  function add_vert(v) {
    ajax.pack_int(data, v.eid, endian);
    ajax.pack_int(data, v.flag, endian);
    ajax.pack_vec3(data, v, endian);
    ajax.pack_int(data, 0, endian); //pad int
    
    idxmap[v.eid] = i++;
  }
  
  for (let v of update_verts) {
    add_vert(v, true);
  }
  
  ajax.pack_int(data, update_segs.length, endian);
  ajax.pack_int(data, 0, endian); //pad to 8 byte boundary

  i = 0;
  for (let s of update_segs) {
    let flag = s.flag;
    
    if (edge_segs.has(s)) {
      flag |= FIXED_KS_FLAG;
      //console.log("edge segment!");
    }
    
    ajax.pack_int(data, s.eid, endian);
    ajax.pack_int(data, flag, endian);

    let klen = s.ks.length;
    let is_eseg = edge_segs.has(s);

    let zero_ks = ((s.v1.flag & SplineFlags.BREAK_TANGENTS) || (s.v2.flag & SplineFlags.BREAK_TANGENTS));
    
    for (let ji=0; ji<1; ji++) {
      for (let j=0; j<klen; j++) {
        if (zero_ks && j < ORDER)
          ajax.pack_double(data, 0.0, endian);
        else
          ajax.pack_double(data, is_eseg ? s.ks[j] : 0.0, endian);
      }
      for (let j=0; j<16-klen; j++) {
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
  
  for (let i=0; i<cons.length; i++) {
    let c = cons[i];

    let type=0, seg1=-1, seg2=-1, param1=0, param2=0, fparam1=0, fparam2=0;
    
    if (c.type === "tan_c") {
      type = ConstraintTypes.TAN_CONSTRAINT;
      seg1 = c.params[0];
      seg2 = c.params[1];

      let v = seg1.shared_vert(seg2);
      
      param1 = idxmap[seg1.eid];
      param2 = idxmap[seg2.eid];
      
      fparam1 = seg1.v2 === v;
      fparam2 = seg2.v2 === v;
      
      if (c.klst.length === 1) {
        seg1 = c.klst[0] !== seg1.ks ? param2 : param1;
        seg2 = -1;
      } else {
        seg1 = param1;
        seg2 = param2;
      }
    } else if (c.type === "hard_tan_c") {
      type = ConstraintTypes.HARD_TAN_CONSTRAINT;

      let seg = c.params[0], tan = c.params[1], s = c.params[2];
      
      seg1 = idxmap[seg.eid];
      seg2 = -1;
      
      fparam1 = Math.atan2(tan[0], tan[1]);
      fparam2 = s;
    } else if (c.type === "curv_c") {
      type = ConstraintTypes.CURVATURE_CONSTRAINT;
      //console.log("curvature constraint!")
      seg1 = c.params[0];
      seg2 = c.params[1];
      
      //console.log("c.klst[0]:", c.klst[0], c.klst[0]===seg1.ks, c.klst[0]===seg2.ks);
      if (seg1.ks !== c.klst[0]) {
        //let tmp = seg1; seg1 = seg2; seg2 = tmp;
      }

      let v = seg1.shared_vert(seg2);
      
      //is v at seg1/seg2's endpoint or startpoint?
      fparam1 = seg1.v2 === v;
      fparam2 = seg2.v2 === v;
      
      param1 = idxmap[seg1.eid];
      param2 = idxmap[seg2.eid];
      
      seg1 = param1;
      seg2 = -1; //param2
    } else if (c.type === "copy_c") {
      type = ConstraintTypes.COPY_C_CONSTRAINT;
      //console.log("curvature constraint!")
      
      seg1 = c.params[0];
      param1 = seg1.v1.segments.length === 1; //c.params[1] === seg1.v1;
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
    
    for (let j=0; j<33; j++) {
      ajax.pack_double(data, 0, endian);
    }
  }
  
  return idxmap;
}


function _unload(spline, data) {
  //handleMessage will have chopped off
  //the type/msgid header for us

  let _i = 0;
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

  let totvert = getint();
  getint(); //skip pad int
  
  //skip past vertex data, we don't need it
  _i += 24*totvert; //sizeof(SplineVertex), see solver.h

  let totseg = getint();
  getint(); //skip pad int

  if (DEBUG)
    console.log("totseg:", totseg);
}

function wrap_unload(spline, data) {
  return function() {
    _unload(spline, data);
  }
}

//generator is manually unpacked for easier analysis
//XXX rewrite this
export function wasm_solve(postMessage : Function, status : Object, spline : Spline,
                           cons : Array<constraint>, update_verts : set<SplineVertex>,
                           gk : number, edge_segs : set<SplineSegment>)
{
  let ret = {};
  
  ret.ret = {done : false, value : undefined};
  ret.stage = 0;
  ret[Symbol.iterator] = function() {
    return this;
  }
  
  ret.next = function() {
    if (ret.stage === 0) {
      this.stage++;
      this.stage0();
      
      return this.ret;
    } else if (ret.stage === 1) {
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

  let data;
  
  ret.stage0 = function() {
    //measured test had average bytes per constraint at 355.
    //but to be safe. . .

    let maxsize = (cons.length+1)*650 + 128;
    let writer = new TypedWriter(maxsize);

    let msgid = status.msgid;
    let endian = ajax.little_endian;

    let prof = false;
    
    //write vertices and their associated segments first
    start_message_new(writer, MessageTypes.SOLVE, msgid, endian);
    
    //build list of update segments
    let timestart = time_ms();

    let update_segs = new set();
    for (let v of update_verts) {
      for (let i=0; i<v.segments.length; i++) {
        let s = v.segments[i];
        
        update_segs.add(s);
      }
    }
    
    //add any stray vertices brought in by update segments
    for (let s of update_segs) {
      update_verts.add(s.v1);
      update_verts.add(s.v2);
    }
    
    if (prof)
      console.log("time a:", time_ms() - timestart);
    
    writer.int32(update_verts.length);
    writer.int32(0); //pad to 8 byte boundary
    
    if (prof)
      console.log("time b:", time_ms() - timestart);

    let idxmap = write_wasm_solve_new(writer, spline, cons, update_verts, update_segs, gk, edge_segs);
    let data = writer.final();

    //console.log("DATA FINAL", writer.i/1024 + "kb");

    /*
    console.log("datalen", data.byteLength, update_verts.length, update_segs.length, edge_segs.length, cons.length);
    console.log((data.byteLength/cons.length).toFixed(3));
    console.log(writer.buf);
    //*/
    
    if (prof)
      console.log("time c:", time_ms() - timestart);
    
    if (prof)
      console.log("time d:", time_ms() - timestart, data.byteLength);
    
    postMessage(MessageTypes.SOLVE, data);

    if (prof)
      console.log("DATA " + (data.byteLength/1024).toFixed(3) + "kb");

    if (prof)
      console.log("time e:", time_ms() - timestart, "\n\n\n");
  }
  
  ret.stage1 = function() {
    //console.log("Got reply!", status.data.byteLength, data.byteLength);
    //console.log(status, "<----");
    
    //okay, now read back data (from status.data)
    let buf1 = status.data;
    
    data = new DataView(buf1);
    status.value = wrap_unload(spline, data);
  }
  
  return ret;
}

