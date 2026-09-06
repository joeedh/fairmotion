/* The JS half of src/wasm/stroker.cc: the three drawer entry points, routed
   into wasm when everything they need is there and answering "no" when it is
   not.

   The gate is deliberately narrow.  config.USE_WASM and DEBUG.no_native both
   turn it off, the runtime has to have finished starting, and -- the part that
   is specific to the stroker -- every array the C++ side reads has to actually
   be at an address, which heap_arrays.allResident() is what asks.  A scene
   built before the runtime came up holds plain typed arrays, and there is no
   pointer to hand over; the JS stroker runs and the frame is identical, which
   is the whole reason §5.6 keeps it as the reference implementation.

   `ks` is not in the bind block.  Each segment's coefficients were relocated on
   their own by native_api.checkSegment(), so the addresses are already in the
   scene's SEGI_KSPTR column and scene_ks() reads them from there.  A segment
   that has never been evaluated natively has a KSPTR of 0, which is why
   segsResident() checks the column before any of this runs.

   Every call in ends in native_api.checkHeap().  C++ appends to the outline
   buffer with realloc, so a stroke is one of the routes that can grow the heap,
   and the views this module then builds must be built on the buffer that came
   out of it rather than the one that went in. */

import * as config from "../../config/config.js";
import * as native_api from "../../wasm/native_api.js";

import { allResident, allocI32, viewF64, viewI32, viewU8 } from "../../wasm/heap_arrays.js";
import { OUTLINE_I } from "./outline_buffer.js";
import { SEG_I, SegI } from "./stroke_scene.js";
import { TRIM_STRIDE } from "./trim_state.js";

import type { HeapI32 } from "../../wasm/heap_arrays.js";
import type { OutlineBuffer } from "./outline_buffer.js";
import type { StrokeScene } from "./stroke_scene.js";
import type { TrimView } from "./trim_view.js";

/* Fields of the bind block, in stroker.cc's order. */
const enum Bind {
  VERT_MAX = 0,
  SEG_MAX,
  GROUP_COUNT,
  GROUP_SEG_COUNT,
  VSEG_COUNT,
  TRIM_SLOTS,

  VERTF,
  VERTI,
  SEGF,
  SEGI,
  NET_SEG,
  NET_V1,
  GROUPS,
  GROUP_SEGS,
  VSEG_OFF,
  VSEGS,

  TRIM_DATA,
  TRIM_MASK,
}

const BIND_N = 18;

/* Fields of the out block, which stroker.cc writes after every stroke. */
const enum Out {
  CMDS = 0,
  PTS,
  OUTLINES,
  CMD_COUNT,
  PT_COUNT,
  COUNT,
  OOM,
}

const OUT_N = 7;

/* Bumped in stroker.cc whenever either block's layout changes. */
const STROKER_ABI = 1;

let bind: HeapI32 | undefined = undefined;
let out: HeapI32 | undefined = undefined;

/* The three entry points, once the module has been found to have them.  Held
   here rather than reached through the module each time so the null check
   happens where it can be reported, and not at every call site. */
let fnTrimVertex: ((v: number) => void) | undefined = undefined;
let fnStrokeGroup: ((gi: number, debug: number) => void) | undefined = undefined;
let fnStrokeJoin: ((seg: number, v: number) => void) | undefined = undefined;

/* Off once the ABI check has failed or the module turned out not to export the
   stroker; nothing retries, because neither can become true later. */
let usable = true;

/* Whether the module is there, agrees about the two blocks, and has been given
   them.  Everything after the first call is the two view rebuilds. */
function bound(): boolean {
  if (!usable) {
    return false;
  }

  if (!config.USE_WASM || DEBUG.no_native || !native_api.isReady()) {
    return false;
  }

  if (bind === undefined && !claim()) {
    return false;
  }

  /* The blocks are heap views like any other and detach when it grows. */
  bind = viewI32(bind!.ptr, BIND_N);
  out = viewI32(out!.ptr, OUT_N);

  return true;
}

/* The once-per-session half of bound(): find the exports, check they were built
   against this file, and hand the module the two blocks. */
function claim(): boolean {
  const wasm = native_api.wasmModule;

  const abiOf = wasm._fmStrokerAbi;
  const bindTo = wasm._fmStrokerBind;

  if (!abiOf || !bindTo || !wasm._fmTrimVertex || !wasm._fmStrokeGroup || !wasm._fmStrokeJoin) {
    console.warn("wasm module has no stroker; rebuild it with src/wasm/build.sh");
    usable = false;
    return false;
  }

  const abi = abiOf(0);

  if (abi !== STROKER_ABI || abiOf(1) !== BIND_N || abiOf(2) !== OUT_N) {
    console.warn(`wasm stroker abi ${abi}, expected ${STROKER_ABI}; rebuild both sides`);
    usable = false;
    return false;
  }

  const b = allocI32(BIND_N);
  const o = allocI32(OUT_N);

  if (b.ptr === 0 || o.ptr === 0) {
    usable = false;
    return false;
  }

  bindTo(b.ptr, o.ptr);

  bind = b;
  out = o;

  fnTrimVertex = wasm._fmTrimVertex;
  fnStrokeGroup = wasm._fmStrokeGroup;
  fnStrokeJoin = wasm._fmStrokeJoin;

  return true;
}

/* Whether every segment the stroker may reach has its coefficients in the heap.
   patchSeg() migrates them, so in practice this is true for a scene that has
   been through a begin() with the evaluator live -- but a scene loaded from a
   dump with no evaluator has not, and that must not be read as an address. */
function segsResident(scene: StrokeScene): boolean {
  for (const slot of scene.segMap.values()) {
    if (scene.segi[slot * SEG_I + SegI.KSPTR] === 0) {
      return false;
    }
  }

  return true;
}

/* Fills the bind block, or answers false if this scene cannot be described.

   Refilled per call rather than per pass: the scene reallocates its arrays
   whenever the document outgrows their capacity, and eighteen stores is not a
   price worth paying a stale-pointer bug for. */
function describe(scene: StrokeScene, trims: TrimView): boolean {
  if (!bound()) {
    return false;
  }

  if (
    !allResident([
      scene.vertf,
      scene.verti,
      scene.segf,
      scene.segi,
      scene.netSeg,
      scene.netV1,
      scene.vsegOff,
      scene.vsegs,
      trims.data,
      trims.mask,
    ])
  ) {
    return false;
  }

  /* A document with no stroke groups has neither array, and no group index to
     ask about either -- so a null pointer here is reachable and harmless. */
  const b = bind!;

  b[Bind.VERT_MAX] = scene.vertMax;
  b[Bind.SEG_MAX] = scene.segMax;
  b[Bind.GROUP_COUNT] = scene.groupCount;
  b[Bind.GROUP_SEG_COUNT] = scene.groupSegs.cap;
  b[Bind.VSEG_COUNT] = scene.vsegs.cap;
  b[Bind.TRIM_SLOTS] = (trims.data.cap / TRIM_STRIDE) | 0;

  b[Bind.VERTF] = scene.vertf.ptr;
  b[Bind.VERTI] = scene.verti.ptr;
  b[Bind.SEGF] = scene.segf.ptr;
  b[Bind.SEGI] = scene.segi.ptr;
  b[Bind.NET_SEG] = scene.netSeg.ptr;
  b[Bind.NET_V1] = scene.netV1.ptr;
  b[Bind.GROUPS] = scene.groups.ptr;
  b[Bind.GROUP_SEGS] = scene.groupSegs.ptr;
  b[Bind.VSEG_OFF] = scene.vsegOff.ptr;
  b[Bind.VSEGS] = scene.vsegs.ptr;

  b[Bind.TRIM_DATA] = trims.data.ptr;
  b[Bind.TRIM_MASK] = trims.mask.ptr;

  return segsResident(scene);
}

/* Reads what the stroker published into `dst`.  The out block is re-viewed
   first: the stroke itself is what may have moved the heap. */
function adopt(dst: OutlineBuffer): OutlineBuffer | undefined {
  const o = viewI32(out!.ptr, OUT_N);
  out = o;

  if (o[Out.OOM]) {
    console.warn("wasm stroker ran out of memory");
    return undefined;
  }

  const cmdCount = o[Out.CMD_COUNT];
  const ptCount = o[Out.PT_COUNT];
  const count = o[Out.COUNT];

  return dst.adoptHeap(
    viewU8(o[Out.CMDS], cmdCount),
    viewF64(o[Out.PTS], ptCount),
    viewI32(o[Out.OUTLINES], count * OUTLINE_I),
    cmdCount,
    ptCount,
    count
  );
}

/* trimmer.trimVertex(); false means the caller must run the JS one. */
export function wasmTrimVertex(scene: StrokeScene, trims: TrimView, v: number): boolean {
  if (!describe(scene, trims)) {
    return false;
  }

  fnTrimVertex!(v);
  native_api.checkHeap();

  return true;
}

/* stroker.strokeGroup(), into `dst`; undefined means the caller must run the
   JS one.  `dst` is not reset first -- what comes back is heap storage the C++
   side owns, and whatever `dst` was pointing at before is simply dropped. */
export function wasmStrokeGroup(
  scene: StrokeScene,
  trims: TrimView,
  gi: number,
  debug: boolean,
  dst: OutlineBuffer
): OutlineBuffer | undefined {
  if (!describe(scene, trims)) {
    return undefined;
  }

  fnStrokeGroup!(gi, debug ? 1 : 0);
  native_api.checkHeap();

  return adopt(dst);
}

/* stroker.strokeJoin(), the same way. */
export function wasmStrokeJoin(
  scene: StrokeScene,
  trims: TrimView,
  seg: number,
  v: number,
  dst: OutlineBuffer
): OutlineBuffer | undefined {
  if (!describe(scene, trims)) {
    return undefined;
  }

  fnStrokeJoin!(seg, v);
  native_api.checkHeap();

  return adopt(dst);
}
