import * as wasm_mod from "./built_wasm.js";
import type { WasmModule } from "./load_wasm.js";

/* built_wasm.js is generated, @ts-nocheck'd emscripten output; its only export
   is the live Module object emscripten mutates in place, which infers as {}. */
let wasm = wasm_mod.default as WasmModule;

export let wasmModule = wasm;

/* spline._solve_id -> job id. A solve is live while it has an entry here. */
export let active_solves: { [solveId: number]: number } = {};
/* Job start time in ms, keyed by job id. */
export let solve_starttimes: { [jobId: number]: number } = {};
/* Start and end time of the last finished solve for a spline, keyed by
   spline._solve_id, so a job can tell whether it was superseded. */
export let solve_starttimes2: { [solveId: number]: number } = {};
export let solve_endtimes: { [solveId: number]: number } = {};
/* job id -> spline._solve_id; the reverse of active_solves. */
export let active_jobs: { [jobId: number]: number } = {};

import type { AnyConstraint } from "../curve/solver.js";
import type { Spline } from "../curve/spline.js";
import type { SplineVertex, SplineSegment } from "../curve/spline_types.js";
import { ModalStates } from "../core/toolops_api.js";
import { SplineTypes, SplineFlags } from "../curve/spline_base.js";
import { build_solver, solve_pre } from "../curve/spline_math_hermite.js";
import type {
  CopyParams,
  CurvParams,
  HardTanParams,
  TanParams,
} from "../curve/spline_math_hermite.js";
import type { KsArray } from "../curve/spline_math.js";

import { TypedWriter } from "../util/typedwriter.js";
import * as util from "../path.ux/scripts/util/util.js";
import { Vector2, Vector3, Vector4, Matrix4, Quat } from "../path.ux/scripts/util/vectormath.js";

import * as config from "../config/config.js";

//XXX evil super-old module!
import * as ajax from "../core/ajax.js";

export function isReady() {
  return wasm.calledRun;
}

const mmax = Math.max,
  mmin = Math.min,
  mfloor = Math.floor;
const abs = Math.abs,
  sqrt = Math.sqrt,
  sin = Math.sin,
  cos = Math.cos,
  pow = Math.pow,
  log = Math.log,
  acos = Math.acos,
  asin = Math.asin,
  PI = Math.PI;

let last_call = undefined;
let DEBUG = false;
const FIXED_KS_FLAG = SplineFlags.FIXED_KS;

/* The status object a job shares with the message pump: the wasm reply lands
   on `data`, and whatever the job produced on `value`. */
export interface JobStatus {
  msgid: number;
  data: ArrayBuffer | undefined;
  value?: () => void;
}

/* The hand-rolled iterator wasm_solve() returns in place of a generator. */
export interface ApiJob {
  ret: { done: boolean; value: (() => void) | undefined };
  stage: number;
  next(): { done: boolean; value: (() => void) | undefined };
  stage0(): void;
  stage1(): void;
  [Symbol.iterator](): ApiJob;
}

/* Optional per-call settings for call_api(). */
export interface ApiCallParams {
  callback?: (value: (() => void) | undefined) => void;
  thisvar?: object;
  error?: (error: Error) => void;
  /* Whether only the newest job of this typeid should report back. */
  only_latest?: boolean;
  typeid?: number;
}

/* A job in flight. */
interface ApiJobEntry {
  job: ApiJob;
  typeid: number | undefined;
  only_latest: boolean;
  callback: ((value: (() => void) | undefined) => void) | undefined;
  thisvar: object | undefined;
  error: ((error: Error) => void) | undefined;
  status: JobStatus;
  /* Set on jobs the clear_jobs_* helpers dropped. */
  _skip?: number;
}

/* Keyed by message id; `for..in` over it hands the keys back as strings. */
export const callbacks: { [msgid: string]: ApiJobEntry } = {};
let msg_idgen = 0;
let solve_idgen = 0;

import {
  ORDER,
  KSCALE,
  KANGLE,
  KSTARTX,
  KSTARTY,
  KSTARTZ,
  KTOTKS,
  INT_STEPS,
} from "../curve/spline_math_hermite.js";
import { DISABLE_SOLVE } from "../config/config.js";

export function onMessage(type: number, message: ArrayBuffer, ptr: number) {
  let iview = new Int32Array(message);

  //find callback id
  let id = iview[1];

  if (DEBUG) console.log("got array buffer!", message, "ID", id);

  if (!(id in callbacks)) {
    if (DEBUG) console.log("Warning, dead communication callback", id);
    return;
  }

  let job = callbacks[id],
    iter = job.job;
  if (DEBUG) console.log("job:", job);

  job.status.data = message.slice(8, message.byteLength);
  /* NOTE: this also logged `iter.data`, which was never a member of the job
     object wasm_solve() returns. */
  if (DEBUG) console.log("iter:", iter);

  let ret = iter.next();

  if (ret.done) {
    delete callbacks[id];

    if (job.callback !== undefined) job.callback.call(job.thisvar, job.status.value);
  }

  //free data now we are done with it (hopefully)
  wasm._free(ptr);
}

/* Messages that arrived while queueUpMessages(true) was in force. */
export let messageQueue: { type: number; msg: ArrayBuffer; ptr: number }[] = [];
let queueMessages = false;

export function queueUpMessages(state: boolean) {
  queueMessages = state;
}

export function flushQueue() {
  let queue = messageQueue.slice(0, messageQueue.length);
  messageQueue.length = 0;

  //console.log(queue, "=======");

  for (let msg of queue) {
    onMessage(msg.type, msg.msg, msg.ptr);
  }
}

//called from within wasm (C) code to post messages
window._wasm_post_message = function (type: number, ptr: number, len: number) {
  if (DEBUG) console.log("got wasm message", type, ptr, len);

  let message = wasm.HEAPU8.slice(ptr, ptr + len).buffer;
  if (DEBUG) console.log(message);

  if (!queueMessages) {
    onMessage(type, message, ptr);
  } else {
    if (DEBUG) console.log("Queuing a message!", type, message, ptr, "=======");

    messageQueue.push({
      type: type,
      msg : message,
      ptr : ptr,
    });
  }
};

/* Growing a WebAssembly.Memory swaps in a fresh ArrayBuffer and detaches every
   view onto the old one. The bytes survive, at the same addresses; the views do
   not -- a detached Float64Array reads as length 0, so `seg.ks[KSCALE]` becomes
   undefined and NaN spreads from there. Emscripten rebuilds its own HEAPU8 in
   updateGlobalBufferAndViews(); ours are ours to rebuild.

   The heap is built with ALLOW_MEMORY_GROWTH=1 (src/wasm/build.sh), so this can
   happen. It is invisible today only because the solver allocates little.

   Every way to make the heap grow runs through either heapAlloc() or a call
   into wasm, and both end in checkHeap(), which compares the buffer's identity
   and re-views on a change. That is eager on purpose: `ks` is read all over the
   drawer without anything calling in here first, so a lazy scheme would leave
   detached views reachable. */
const KS_SLOTS = 16; /* matches the _malloc(8 * 16) in checkSegment(). */

let heapBuffer: ArrayBufferLike | undefined = undefined;
let evalMemReady = false;

/* Every segment whose ks lives in the heap. Weak because a spline dropped
   without on_destroy() must not be held alive by this; such entries are pruned
   the next time the heap moves. */
const wasmSegs = new Set<WeakRef<SplineSegment>>();

/* Holders of heap views that are not `seg.ks` -- StrokeScene keeps one per
   segment slot. They rebuild their own, since this module does not know their
   layout; weak for the same reason wasmSegs is. */
export interface HeapViewHolder {
  reviewHeapViews(): void;
}

const heapHolders = new Set<WeakRef<HeapViewHolder>>();

export function onHeapMove(holder: HeapViewHolder) {
  heapHolders.add(new WeakRef(holder));
}

export const heapStats = { grows: 0, reviewed: 0 };

/* Re-views everything if the heap moved. Returns whether it had. */
export function checkHeap(): boolean {
  const buf = wasm.HEAPU8.buffer;

  if (buf === heapBuffer) {
    return false;
  }

  const first = heapBuffer === undefined;
  heapBuffer = buf;

  if (first) {
    return false;
  }

  heapStats.grows++;

  if (evalMemReady) {
    viewEvalMem();
  }

  for (const ref of wasmSegs) {
    const seg = ref.deref();

    if (seg === undefined || !seg.ks._has_wasm) {
      /* Collected, or freed by onSegmentDestroy(). */
      wasmSegs.delete(ref);
      continue;
    }

    seg.ks = viewKs(seg.ks.ptr!);
    heapStats.reviewed++;
  }

  for (const ref of heapHolders) {
    const holder = ref.deref();

    if (holder === undefined) {
      heapHolders.delete(ref);
      continue;
    }

    holder.reviewHeapViews();
  }

  return true;
}

/* _malloc plus the re-view its growth may have made necessary. */
function heapAlloc(size: number): number {
  const ptr = wasm._malloc(size);
  checkHeap();
  return ptr;
}

export function viewKs(ptr: number): KsArray {
  /* Not ks.length: a detached view reports 0. */
  const ks: KsArray = new Float64Array(wasm.HEAPU8.buffer, ptr, KS_SLOTS);

  ks._has_wasm = true;
  ks.ptr = ptr;

  return ks;
}

/* Views into the wasm heap that evalCurve() marshals through, and the raw
   pointers to the same memory. Allocated once by init_eval_mem(); the views are
   rebuilt from the pointers whenever the heap moves. */
let wv1: Float64Array, wv2: Float64Array, wks: Float64Array, wco: Float64Array;
let pv1: number, pv2: number, pks: number, pco: number;

function viewEvalMem() {
  const buf = wasm.HEAPU8.buffer;

  wv1 = new Float64Array(buf, pv1, 2);
  wv2 = new Float64Array(buf, pv2, 2);
  wks = new Float64Array(buf, pks, 16);
  wco = new Float64Array(buf, pco, 3);
}

function init_eval_mem() {
  let ptr = heapAlloc(8 * 3 + 8 * 16 + 8 * 3 * 2);

  pv1 = ptr;
  ptr += 8 * 2;
  pv2 = ptr;
  ptr += 8 * 2;
  pks = ptr;
  ptr += 16 * 8;
  pco = ptr;

  viewEvalMem();
  evalMemReady = true;
}

export function onSegmentDestroy(seg: SplineSegment) {
  if (seg.ks._has_wasm) {
    /* checkSegment() sets both together. */
    wasm._free(seg.ks.ptr!);
    seg.ks = new Float64Array(KS_SLOTS);
  }
}

/** make sure segment has wasm-allocate .ks */
export function checkSegment(seg: SplineSegment) {
  if (!seg.ks._has_wasm) {
    let ks = seg.ks;
    let ptr2 = heapAlloc(8 * KS_SLOTS);
    let ks2 = viewKs(ptr2);

    for (let i = 0; i < ks.length; i++) {
      ks2[i] = ks[i];
    }

    seg.ks = ks2;
    wasmSegs.add(new WeakRef(seg));
  }
}

let evalrets = util.cachering.fromConstructor(Vector2, 64);
/* NOTE: spline_math.ts hands its `angle_only` to `no_update` -- the wasm path
   has no angle-only mode and the caller's own `no_update` never arrives.  Left
   alone: fixing it changes what the solver is told.
   `ks` is unused; the copy into wasm memory below is commented out. */
export function evalCurve(
  seg: SplineSegment,
  s: number,
  v1: SplineVertex | Vector2,
  v2: SplineVertex | Vector2,
  ks: ArrayLike<number>,
  no_update = false
) {
  checkSegment(seg);

  /* checkSegment() just moved ks into wasm memory. */
  return evalCurvePtr(seg.ks.ptr!, s, v1[0]!, v1[1]!, v2[0]!, v2[1]!, no_update);
}

/* The same call with no segment on the JS side of it: coefficients named by
   address, endpoints by value.  This is the shape the boundary has to have --
   StrokeScene calls it, and C++ will not have a SplineSegment to be handed.
   `z` never appears because the marshalling below has always copied two
   coordinates. */
export function evalCurvePtr(
  ksPtr: number,
  s: number,
  v1x: number,
  v1y: number,
  v2x: number,
  v2y: number,
  no_update = false
) {
  if (!wv1) {
    init_eval_mem();
  }

  wv1[0] = v1x;
  wv1[1] = v1y;
  wv2[0] = v2x;
  wv2[1] = v2y;

  wasm._evalCurve(pco, s, ksPtr, pv1, pv2, no_update ? 1 : 0);

  /* C++ can allocate, so wco may have been detached by the call that filled
     it -- the write landed at pco either way. */
  checkHeap();

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

export function postToWasm(type: number, msg: ArrayBuffer) {
  if (!(msg instanceof ArrayBuffer)) {
    throw new Error("msg must be array buffer");
  }

  let bytes = new Uint8Array(msg);
  let ptr = heapAlloc(msg.byteLength * 2);
  let mem = wasm.HEAPU8;

  for (let i = ptr; i < ptr + bytes.length; i++) {
    mem[i] = bytes[i - ptr];
  }

  wasm._gotMessage(type, ptr, msg.byteLength);

  /* The solver runs inside that call and allocates as it goes. */
  checkHeap();

  wasm._free(ptr);
}

export function test_wasm() {
  let msg = new Int32Array([0, 1, 2, 3, 2, 1, -1]);
  console.log(msg);

  postToWasm(0, msg.buffer);
}

export const MessageTypes = {
  GEN_DRAW_BEZIERS: 0,
  REPLY           : 1,
  SOLVE           : 2,
};

export const ConstraintTypes = {
  TAN_CONSTRAINT      : 0,
  HARD_TAN_CONSTRAINT : 1,
  CURVATURE_CONSTRAINT: 2,
  COPY_C_CONSTRAINT   : 3,
};

export const JobTypes = {
  DRAWSOLVE: 1,
  PATHSOLVE: 2,
  SOLVE    : 1 | 2,
};

export function clear_jobs_except_latest(typeid: number) {
  let last = undefined;
  let lastk = undefined;

  for (let k in callbacks) {
    let job = callbacks[k];

    if ((job.typeid ?? 0) & typeid) {
      job._skip = 1;
      delete callbacks[k];
      last = job;
      lastk = k;
    }
  }

  if (last !== undefined) {
    /* Set in the same iteration that set `last`. */
    callbacks[lastk!] = last;
    delete last._skip;
  }
}

export function clear_jobs_except_first(typeid: number) {
  let last = undefined;
  let lastk = undefined;

  for (let k in callbacks) {
    let job = callbacks[k];

    if ((job.typeid ?? 0) & typeid) {
      if (last != undefined) {
        job._skip = 1;
        delete callbacks[k];
      }

      last = job;
      lastk = k;
    }
  }
}

export function clear_jobs(typeid: number) {
  for (let k in callbacks) {
    let job = callbacks[k];
    if ((job.typeid ?? 0) & typeid) {
      job._skip = 1;
      delete callbacks[k];
    }
  }
}

/* wasm_solve is the only job there is, so the arguments after `params` are
   spelled out as its trailing parameters and handed straight to it. */
export function call_api(
  job: typeof wasm_solve,
  params: ApiCallParams | undefined,
  spline: Spline,
  cons: AnyConstraint[],
  update_verts: set<SplineVertex>,
  gk: number,
  edge_segs: set<SplineSegment>
) {
  let callback: ((value: (() => void) | undefined) => void) | undefined;
  let error: ((error: Error) => void) | undefined;
  let thisvar: object | undefined;
  let typeid: number | undefined;
  let only_latest = false;

  if (params !== undefined) {
    callback = params.callback;
    thisvar = params.thisvar !== undefined ? params.thisvar : self;
    error = params.error;
    only_latest = params.only_latest !== undefined ? params.only_latest : false;
    typeid = params.typeid;
  }

  let postMessage = function (type: number, msg: ArrayBuffer) {
    postToWasm(type, msg);
  };

  let id = msg_idgen++;

  let status: JobStatus = {
    msgid: id,
    data : undefined,
  };
  //block any messages until after the "callbacks[id] = ..." line below.
  queueUpMessages(true);

  let iter = job(postMessage, status, spline, cons, update_verts, gk, edge_segs);

  let ret = iter.next();
  if (ret.done) {
    /* Unreachable: wasm_solve's first next() always reports done:false.  The
       `iter.value` this used to pass was never a member of the job object. */
    callback!.call(thisvar, undefined);
    return;
  }

  if (DEBUG) console.log("  SETTING CALLBACK WITH ID", id);

  callbacks[id] = {
    job        : iter,
    typeid     : typeid,
    only_latest: only_latest, //only return latest for all jobs of same typeid
    callback   : callback,
    thisvar    : thisvar,
    error      : error,
    status     : status, //status object used to communicate with job
  };

  //turn off message queuing
  queueUpMessages(false);

  //flush any queued messages
  flushQueue();
}

export function start_message(type: number, msgid: number, endian: boolean) {
  let data: number[] = [];

  ajax.pack_int(data, type, endian);
  ajax.pack_int(data, msgid, endian);

  return data;
}

/* `endian` is accepted to match start_message(); TypedWriter is always
   little-endian, so it is ignored. */
export function start_message_new(
  writer: TypedWriter,
  type: number,
  msgid: number,
  endian: boolean
) {
  writer.int32(type);
  writer.int32(msgid);
}

/* NOTE: a dead _unpacker(dview) lived here, returning getint/getfloat/getdouble
   readers.  Nothing called it, and `endian` was not in scope inside any of the
   three, so calling one would have thrown.  Deleted. */

//sflags should be SplineFlags from spline_types.js,
//passed in here to avoid a cyclic module dependency
/* `steps` is vestigial -- nothing in here reads it. */
export function do_solve(
  sflags: { [name: string]: number },
  spline: Spline,
  steps?: number,
  gk = 0.95,
  return_promise = false
) {
  if (config.DISABLE_SOLVE) {
    return new Promise<void>((accept, reject) => {
      accept();
    });
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

  let on_finish: (() => void) | undefined;
  let on_reject: (() => void) | undefined;
  let promise: Promise<void> | undefined;

  if (return_promise) {
    promise = new Promise(function (resolve, reject) {
      on_finish = function () {
        resolve();
      };

      on_reject = function () {
        reject();
      };
    });
  }

  /* `unload` is the reader wrap_unload() built over the wasm reply. */
  function finish(unload: () => void) {
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
      /* NOTE: the guard read `modalstate !== ModalStates.TRANSFROMING`, a typo
         for TRANSFORMING, so it was always true and the else branch below --
         deferring the aabb by flag instead of rebuilding it -- never ran.
         Kept as-is; taking the other branch is a behavior change. */
      if (seg.v1.flag & SplineFlags.UPDATE || seg.v2.flag & SplineFlags.UPDATE) seg.update_aabb();
    }

    for (let f of spline.faces) {
      for (let path of f.paths) {
        for (let l of path) {
          if (l.v.flag & SplineFlags.UPDATE) f.flag |= SplineFlags.UPDATE_AABB;
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

  let update_verts = new set<SplineVertex>();
  let slv = build_solver(spline, ORDER, undefined, 1, undefined, update_verts);
  let cs = slv.cs;

  /* build_solver() hands these back as an array; the job wants membership. */
  let edge_segs = new set<SplineSegment>(slv.edge_segs);

  //on_finish();
  //return promise;

  call_api(
    wasm_solve,
    {
      callback: function (value: (() => void) | undefined) {
        //console.log("value", value);
        /* stage1() sets status.value before the job reports done. */
        finish(value!);
      },
      error: function (error: Error) {
        console.log("wasm solve error!");
        window.pop_solve(draw_id);
      },
      typeid     : spline.is_anim_path ? JobTypes.PATHSOLVE : JobTypes.DRAWSOLVE,
      only_latest: true,
    },
    spline,
    cs,
    update_verts,
    gk,
    edge_segs
  );

  return promise;
}

window.wasm_do_solve = do_solve;

/* NOTE: `gk` is accepted but never applied -- write_wasm_solve() below, the
   version this replaced, scaled every constraint k by it. */
function write_wasm_solve_new(
  writer: TypedWriter,
  spline: Spline,
  cons: AnyConstraint[],
  update_verts: set<SplineVertex>,
  update_segs: set<SplineSegment>,
  gk: number,
  edge_segs: set<SplineSegment>
) {
  /* element eid -> its index in the packed vertex or segment array. */
  let idxmap: { [eid: number]: number } = {};

  let i = 0;
  function add_vert(v: SplineVertex) {
    writer.int32(v.eid);
    writer.int32(v.flag);
    writer.float32(v[0]);
    writer.float32(v[1]);
    writer.float32(0.0);
    writer.int32(0); //pad int

    idxmap[v.eid] = i++;
  }

  for (let v of update_verts) {
    add_vert(v);
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
    /* checkSegment() just moved ks into wasm memory. */
    writer.uint32(s.ks.ptr!);

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

  for (let i = 0; i < cons.length; i++) {
    let c = cons[i];

    let type = 0,
      seg1 = -1,
      seg2 = -1,
      param1 = 0,
      param2 = 0,
      fparam1 = 0,
      fparam2 = 0;

    /* `type` is the discriminant build_solver() stamped on the constraint; the
       class types `params` as a bare unknown[], so each branch has to name the
       layout its own evaluator was built with. */
    if (c.type === "tan_c") {
      type = ConstraintTypes.TAN_CONSTRAINT;
      let [cseg1, cseg2] = c.params as TanParams;

      let v = cseg1.shared_vert(cseg2);

      param1 = idxmap[cseg1.eid];
      param2 = idxmap[cseg2.eid];

      fparam1 = cseg1.v2 === v ? 1 : 0;
      fparam2 = cseg2.v2 === v ? 1 : 0;

      if (c.klst.length === 1) {
        seg1 = c.klst[0] !== cseg1.ks ? param2 : param1;
        seg2 = -1;
      } else {
        seg1 = param1;
        seg2 = param2;
      }
    } else if (c.type === "hard_tan_c") {
      type = ConstraintTypes.HARD_TAN_CONSTRAINT;

      let [seg, tan, s] = c.params as HardTanParams;

      seg1 = idxmap[seg.eid];
      seg2 = -1;

      fparam1 = Math.atan2(tan[0], tan[1]);
      fparam2 = s;
    } else if (c.type === "curv_c") {
      type = ConstraintTypes.CURVATURE_CONSTRAINT;
      //console.log("curvature constraint!")
      let [cseg1, cseg2] = c.params as CurvParams;

      //console.log("c.klst[0]:", c.klst[0], c.klst[0]===cseg1.ks, c.klst[0]===cseg2.ks);
      if (cseg1.ks !== c.klst[0]) {
        //let tmp = cseg1; cseg1 = cseg2; cseg2 = tmp;
      }

      let v = cseg1.shared_vert(cseg2);

      //is v at cseg1/cseg2's endpoint or startpoint?
      fparam1 = cseg1.v2 === v ? 1 : 0;
      fparam2 = cseg2.v2 === v ? 1 : 0;

      param1 = idxmap[cseg1.eid];
      param2 = idxmap[cseg2.eid];

      seg1 = param1;
      seg2 = -1; //param2
    } else if (c.type === "copy_c") {
      type = ConstraintTypes.COPY_C_CONSTRAINT;
      //console.log("curvature constraint!")

      /* NOTE: this assigned the SplineSegment itself to seg1, which packs as
         NaN -- so 0.  Nothing builds a copy_c constraint, so the branch has
         never run; the 0 is spelled out rather than changed. */
      let [cseg1] = c.params as CopyParams;
      seg1 = 0;
      param1 = cseg1.v1.segments.length === 1 ? 1 : 0; //c.params[1] === cseg1.v1;
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

    for (let j = 0; j < 17; j++) {
      writer.float64(0);
    }
  }

  return idxmap;
}

/* Dead: superseded by write_wasm_solve_new(). Kept because it is the only
   record of the pre-TypedWriter packing layout, which the C side still
   half-shares. */
function write_wasm_solve(
  data: number[],
  spline: Spline,
  cons: AnyConstraint[],
  update_verts: set<SplineVertex>,
  update_segs: set<SplineSegment>,
  gk: number,
  edge_segs: set<SplineSegment>
) {
  let endian = ajax.little_endian;
  let idxmap: { [eid: number]: number } = {};

  let i = 0;
  function add_vert(v: SplineVertex) {
    ajax.pack_int(data, v.eid, endian);
    ajax.pack_int(data, v.flag, endian);
    ajax.pack_vec3(data, v, endian);
    ajax.pack_int(data, 0, endian); //pad int

    idxmap[v.eid] = i++;
  }

  for (let v of update_verts) {
    add_vert(v);
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

    let zero_ks = s.v1.flag & SplineFlags.BREAK_TANGENTS || s.v2.flag & SplineFlags.BREAK_TANGENTS;

    for (let ji = 0; ji < 1; ji++) {
      for (let j = 0; j < klen; j++) {
        if (zero_ks && j < ORDER) ajax.pack_double(data, 0.0, endian);
        else ajax.pack_double(data, is_eseg ? s.ks[j] : 0.0, endian);
      }
      for (let j = 0; j < 16 - klen; j++) {
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

  for (let i = 0; i < cons.length; i++) {
    let c = cons[i];

    let type = 0,
      seg1 = -1,
      seg2 = -1,
      param1 = 0,
      param2 = 0,
      fparam1 = 0,
      fparam2 = 0;

    /* `type` is the discriminant build_solver() stamped on the constraint; the
       class types `params` as a bare unknown[], so each branch has to name the
       layout its own evaluator was built with. */
    if (c.type === "tan_c") {
      type = ConstraintTypes.TAN_CONSTRAINT;
      let [cseg1, cseg2] = c.params as TanParams;

      let v = cseg1.shared_vert(cseg2);

      param1 = idxmap[cseg1.eid];
      param2 = idxmap[cseg2.eid];

      fparam1 = cseg1.v2 === v ? 1 : 0;
      fparam2 = cseg2.v2 === v ? 1 : 0;

      if (c.klst.length === 1) {
        seg1 = c.klst[0] !== cseg1.ks ? param2 : param1;
        seg2 = -1;
      } else {
        seg1 = param1;
        seg2 = param2;
      }
    } else if (c.type === "hard_tan_c") {
      type = ConstraintTypes.HARD_TAN_CONSTRAINT;

      let [seg, tan, s] = c.params as HardTanParams;

      seg1 = idxmap[seg.eid];
      seg2 = -1;

      fparam1 = Math.atan2(tan[0], tan[1]);
      fparam2 = s;
    } else if (c.type === "curv_c") {
      type = ConstraintTypes.CURVATURE_CONSTRAINT;
      //console.log("curvature constraint!")
      let [cseg1, cseg2] = c.params as CurvParams;

      //console.log("c.klst[0]:", c.klst[0], c.klst[0]===cseg1.ks, c.klst[0]===cseg2.ks);
      if (cseg1.ks !== c.klst[0]) {
        //let tmp = cseg1; cseg1 = cseg2; cseg2 = tmp;
      }

      let v = cseg1.shared_vert(cseg2);

      //is v at cseg1/cseg2's endpoint or startpoint?
      fparam1 = cseg1.v2 === v ? 1 : 0;
      fparam2 = cseg2.v2 === v ? 1 : 0;

      param1 = idxmap[cseg1.eid];
      param2 = idxmap[cseg2.eid];

      seg1 = param1;
      seg2 = -1; //param2
    } else if (c.type === "copy_c") {
      type = ConstraintTypes.COPY_C_CONSTRAINT;
      //console.log("curvature constraint!")

      /* NOTE: this assigned the SplineSegment itself to seg1, which packs as
         NaN -- so 0.  Nothing builds a copy_c constraint, so the branch has
         never run; the 0 is spelled out rather than changed. */
      let [cseg1] = c.params as CopyParams;
      seg1 = 0;
      param1 = cseg1.v1.segments.length === 1 ? 1 : 0; //c.params[1] === cseg1.v1;
    }

    //console.log("c.type, c.k, gk:", c.type, c.k, gk);

    ajax.pack_int(data, type, endian);
    ajax.pack_float(data, c.k * gk, endian);
    ajax.pack_float(data, c.k2 == undefined ? c.k * gk : c.k2 * gk, endian);

    ajax.pack_int(data, 0, endian); //pad int

    ajax.pack_int(data, seg1, endian);
    ajax.pack_int(data, seg2, endian);

    ajax.pack_int(data, param1, endian);
    ajax.pack_int(data, param2, endian);

    ajax.pack_float(data, fparam1, endian);
    ajax.pack_float(data, fparam2, endian);
    //write remaining 33 doubles

    for (let j = 0; j < 33; j++) {
      ajax.pack_double(data, 0, endian);
    }
  }

  return idxmap;
}

function _unload(spline: Spline, data: DataView) {
  //handleMessage will have chopped off
  //the type/msgid header for us

  let _i = 0;
  function getint() {
    _i += 4;
    return data.getInt32(_i - 4, true);
  }
  function getfloat() {
    _i += 4;
    return data.getFloat32(_i - 4, true);
  }
  function getdouble() {
    _i += 8;
    return data.getFloat64(_i - 8, true);
  }

  let totvert = getint();
  getint(); //skip pad int

  //skip past vertex data, we don't need it
  _i += 24 * totvert; //sizeof(SplineVertex), see solver.h

  let totseg = getint();
  getint(); //skip pad int

  if (DEBUG) console.log("totseg:", totseg);
}

function wrap_unload(spline: Spline, data: DataView) {
  return function () {
    _unload(spline, data);
  };
}

//generator is manually unpacked for easier analysis
//XXX rewrite this
export function wasm_solve(
  postMessage: (type: number, msg: ArrayBuffer) => void,
  status: JobStatus,
  spline: Spline,
  cons: AnyConstraint[],
  update_verts: set<SplineVertex>,
  gk: number,
  edge_segs: set<SplineSegment>
): ApiJob {
  let data: DataView | undefined;

  let ret: ApiJob = {
    ret  : { done: false, value: undefined },
    stage: 0,

    [Symbol.iterator]() {
      return this;
    },

    next() {
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
    },

    stage0() {
      //measured test had average bytes per constraint at 355.
      //but to be safe. . .

      let maxsize = (cons.length + 1) * 650 + 128;
      let writer = new TypedWriter(maxsize);

      let msgid = status.msgid;
      let endian = ajax.little_endian;

      let prof = false;

      //write vertices and their associated segments first
      start_message_new(writer, MessageTypes.SOLVE, msgid, endian);

      //build list of update segments
      let timestart = time_ms();

      let update_segs = new set<SplineSegment>();
      for (let v of update_verts) {
        for (let i = 0; i < v.segments.length; i++) {
          let s = v.segments[i];

          update_segs.add(s);
        }
      }

      //add any stray vertices brought in by update segments
      for (let s of update_segs) {
        update_verts.add(s.v1);
        update_verts.add(s.v2);
      }

      if (prof) console.log("time a:", time_ms() - timestart);

      writer.int32(update_verts.length);
      writer.int32(0); //pad to 8 byte boundary

      if (prof) console.log("time b:", time_ms() - timestart);

      let idxmap = write_wasm_solve_new(
        writer,
        spline,
        cons,
        update_verts,
        update_segs,
        gk,
        edge_segs
      );
      let data = writer.final();

      //console.log("DATA FINAL", writer.i/1024 + "kb");

      /*
      console.log("datalen", data.byteLength, update_verts.length, update_segs.length, edge_segs.length, cons.length);
      console.log((data.byteLength/cons.length).toFixed(3));
      console.log(writer.buf);
      //*/

      if (prof) console.log("time c:", time_ms() - timestart);

      if (prof) console.log("time d:", time_ms() - timestart, data.byteLength);

      postMessage(MessageTypes.SOLVE, data);

      if (prof) console.log("DATA " + (data.byteLength / 1024).toFixed(3) + "kb");

      if (prof) console.log("time e:", time_ms() - timestart, "\n\n\n");
    },

    stage1() {
      //console.log("Got reply!", status.data.byteLength, data.byteLength);
      //console.log(status, "<----");

      //okay, now read back data (from status.data)
      /* onMessage() lands the reply on status.data before advancing us. */
      let buf1 = status.data!;

      data = new DataView(buf1);
      status.value = wrap_unload(spline, data);
    },
  };

  return ret;
}
