"use strict";

import * as config from "../config/config.js";

//math globals
let FEPS = 1e-18;
let PI = Math.PI;
let sin = Math.sin,
  acos = Math.acos,
  asin = Math.asin,
  atan2 = Math.atan2,
  sqrt = Math.sqrt;
let cos = Math.cos,
  pow = Math.pow,
  abs = Math.abs;
let SPI2 = Math.sqrt(PI / 2);

import * as math from "./spline_math_hermite.js";

export let spiraltheta = math.spiraltheta;
export let spiralcurvature = math.spiralcurvature;
export let spiralcurvature_dv = math.spiralcurvature_dv;
export let approx = math.approx;
export let INT_STEPS = math.INT_STEPS;
export let ORDER = math.ORDER;

import { DISABLE_SOLVE } from "../config/config.js";

import * as native_api from "../wasm/native_api.js";

import { loadVec2Into3, loadVec3Into2 } from "./spline_base.js";

import type { SplineSegment, SplineVertex } from "./spline_types.js";
import type { Spline } from "./spline.js";

/* `steps` is vestigial -- neither implementation reads it.  This used to
   forward `arguments` verbatim; both callees default every parameter past
   `spline`, so passing them through by name is the same call. */
export function do_solve(
  sflags: { [name: string]: number },
  spline: Spline,
  steps?: number,
  gk?: number,
  return_promise?: boolean
) {
  if (DISABLE_SOLVE || window.DISABLE_SOLVE) return;

  if (!DEBUG.no_native && config.USE_WASM && native_api.isReady()) {
    return native_api.do_solve(sflags, spline, steps, gk, return_promise);
  } else {
    return math.do_solve(sflags, spline, steps, gk);
  }
}

/* A segment's spiral coefficients.  A plain Array until
   native_api.checkSegment() swaps in a wasm-backed Float64Array; `ptr` is that
   array's address inside the wasm heap and `_has_wasm` marks the swap.  `cell`
   is which arena cell the bytes were taken from, so they can be given back; see
   src/wasm/ks_arena.ts. */
export type KsArray = (number[] | Float64Array) & {
  _has_wasm?: boolean;
  ptr?: number;
  cell?: number;
};

export const KSCALE = ORDER + 1;
export const KANGLE = ORDER + 2;
export const KSTARTX = ORDER + 3;
export const KSTARTY = ORDER + 4;
export const KSTARTZ = ORDER + 5; //unused
//used by wasm solver
export const KV1X = ORDER + 6;
export const KV1Y = ORDER + 7;
export const KV2X = ORDER + 8;
export const KV2Y = ORDER + 9;

export const KTOTKS = ORDER + 10;

const eval_curve_vs = cachering.fromConstructor(Vector3, 64);

//XXX
//export let eval_curve = math.eval_curve_fast;

const eval_ret_vs = cachering.fromConstructor(Vector2, 256);

/* loadVec2Into3 with the source unpacked; `z` may be undefined and must stay
   that way -- see eval_curve_flat. */
function loadXYZ(dst: Vector3, x: number, y: number, z: number): Vector3 {
  dst[0] = x;
  dst[1] = y;
  Reflect.set(dst, 2, z);

  return dst;
}

/* NOTE: `angle_only` goes into native_api.evalCurve()'s `no_update` slot and
   this function's own `no_update` is dropped -- the seventh argument the call
   used to carry was ignored by the callee anyway. Left alone: correcting it
   changes what the solver is told.
   NOTE: the `no_update` branch reads `start[0]` before `start` is assigned, so
   it throws. Nothing reaches it while the native path is available. */
export function eval_curve(
  seg: SplineSegment,
  s: number,
  v1: Vector2 | SplineVertex,
  v2: Vector2 | SplineVertex,
  ks: KsArray,
  order?: number,
  angle_only?: boolean | number,
  no_update?: boolean
): Vector2 | undefined {
  let ksPtr = 0;

  if (useNativeEval()) {
    /* Relocates ks into the wasm heap the first time, which is what makes the
       pointer below valid. */
    native_api.checkSegment(seg);
    ksPtr = seg.ks.ptr!;
  }

  /* Reflect.get rather than v1[2]: a Vector2 has no third element, and the
     undefined that produces is load-bearing -- see the note in eval_curve_flat. */
  return eval_curve_flat(
    ksPtr,
    ks,
    s,
    v1[0],
    v1[1],
    Reflect.get(v1, 2) as number,
    v2[0],
    v2[1],
    Reflect.get(v2, 2) as number,
    order,
    angle_only,
    no_update
  );
}

export function useNativeEval(): boolean {
  return native_api.isReady() && !(DEBUG.no_native || DEBUG.no_nativeEval);
}

/* eval_curve with no segment: coefficients by address (and by view, for the JS
   fallback), endpoints by value.  This is the whole of what the evaluator needs
   from a Spline, and StrokeScene calls it directly.

   `v1z`/`v2z` are carried because the fallback's `scale` is a 3d length, and a
   Vector2 endpoint makes it NaN -- a quirk callers may depend on, so it is
   reproduced rather than fixed (§5.7). */
export function eval_curve_flat(
  ksPtr: number,
  ks: KsArray,
  s: number,
  v1x: number,
  v1y: number,
  v1z: number,
  v2x: number,
  v2y: number,
  v2z: number,
  order?: number,
  angle_only?: boolean | number,
  no_update?: boolean
): Vector2 | undefined {
  if (useNativeEval()) {
    return native_api.evalCurvePtr(ksPtr, s, v1x, v1y, v2x, v2y, !!angle_only);
  }

  if (order === undefined) order = ORDER;

  s *= 0.99999999;

  let eps = 0.000000001;

  let ang: number, scale: number;
  let start: Vector3 | undefined, end: Vector3 | undefined;
  if (!no_update) {
    start = approx(-0.5 + eps, ks, order);
    end = approx(0.5 - eps, ks, order);

    end.sub(start);
    let a1 = atan2(end[0], end[1]);

    /* Vector3.load()/sub() against a 2d vector leave z undefined and then NaN;
       these two keep that, one ring slot each. */
    let vec = loadXYZ(eval_curve_vs.next(), v2x, v2y, v2z);
    vec.sub(loadXYZ(eval_curve_vs.next(), v1x, v1y, v1z));

    let a2 = atan2(vec[0], vec[1]);

    ang = a2 - a1;
    scale = vec.vectorLength() / end.vectorLength();

    ks[KSCALE] = scale;
    ks[KANGLE] = ang;
    ks[KSTARTX] = start[0];
    ks[KSTARTY] = start[1];
  } else {
    ang = ks[KANGLE];
    scale = ks[KSCALE];

    start![0] = ks[KSTARTX];
    start![1] = ks[KSTARTY];
  }

  if (!angle_only) {
    let co = approx(s, ks, order);
    co.sub(start!)
      .rot2d(-ang)
      .mulScalar(scale)
      .add(loadXYZ(eval_curve_vs.next(), v1x, v1y, v1z));

    return loadVec3Into2(eval_ret_vs.next(), co);
  }
}
