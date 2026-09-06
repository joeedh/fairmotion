/* The stroker's geometry, over a StrokeScene instead of a Spline.

   Every function here is the scene-side twin of a SplineSegment method, and the
   twins are required to be *bit-identical*, not merely close: they run on the
   same coefficients, in the same expression order, calling the same evaluator.
   playwright/stroker-eval.spec.ts holds them to that over every segment of the
   sample files, and the comments below mark each place where the order is
   copied rather than chosen.

   Why twins at all, rather than moving the methods: the methods stay as the
   reference implementation.  They are what picking, tools and the overlay call,
   they are what the parity spec compares against, and they are what says what
   the C++ port has to reproduce.  See docs/plans/draw-refactor-plan-final-notes.md stage 4.

   The scene does not carry a Spline, so what a method reaches through `this`
   arrives here as a slot index.  Nothing in this file touches a SplineSegment,
   a SplineVertex or a Material -- that is the property that makes it portable,
   and it is worth more than the duplication costs. */

import * as bspline from "../bspline.js";
import {
  eval_curve_flat,
  KANGLE,
  KSCALE,
  ORDER,
  spiralcurvature,
  spiraltheta,
} from "../spline_math.js";
import { NET_STEPS, NO_SLOT, SEG_F, SEG_I, SegF, SegI, VERT_F, VertF } from "./stroke_scene.js";

import { SplineFlags } from "../spline_base.js";

import type { StrokeScene } from "./stroke_scene.js";

/* What a two-element out-param may be; spline_types keeps this type private. */
type VecOut = number[] | Vector2 | Vector3;

const COINCIDENT = SplineFlags.COINCIDENT;

/* Scratch for one width net, in the layout deBoor wants: it reads
   knots.length, so these are plain arrays rather than views. */
const netKnots: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
const netWidths: number[] = [0, 0, 0, 0, 0, 0, 0];
const netShifts: number[] = [0, 0, 0, 0, 0, 0, 0];

const shiftout = [0];

/* Two-element outputs, as the segment methods' Vector2 returns. */
const co_tmp = [0, 0];
const dv_tmp = [0, 0];

export function segFlag(scene: StrokeScene, slot: number): number {
  return scene.segi[slot * SEG_I + SegI.FLAG];
}

export function segLength(scene: StrokeScene, slot: number): number {
  return scene.ksv[slot][KSCALE];
}

/* SplineSegment.evaluate() with no_effects -- the only mode the port supports,
   since ks cannot express a curve effect (§5.4). */
export function sceneEvaluate(scene: StrokeScene, slot: number, s: number, out: VecOut): VecOut {
  const io = slot * SEG_I;

  if (scene.segi[io + SegI.FLAG] & COINCIDENT) {
    const v1 = scene.segi[io + SegI.V1] * VERT_F;

    out[0] = scene.vertf[v1 + VertF.X];
    out[1] = scene.vertf[v1 + VertF.Y];

    return out;
  }

  /* Copied verbatim from evaluate(): the nudge keeps s off both ends. */
  s = (s + 0.00000001) * (1.0 - 0.00000002);
  s -= 0.5;

  const co = evalFlat(scene, slot, s, undefined, undefined);

  out[0] = co![0];
  out[1] = co![1];

  return out;
}

/* SplineSegment.derivative().  The `1` is angle_only, which the wasm path
   reads as no_update -- so this call does not refresh the arc length, and the
   KSCALE it multiplies by is whatever the last evaluate() left (§5.7). */
export function sceneDerivative(scene: StrokeScene, slot: number, s: number, out: VecOut): VecOut {
  if (scene.segi[slot * SEG_I + SegI.FLAG] & COINCIDENT) {
    out[0] = out[1] = 0.0;
    return out;
  }

  const ks = scene.ksv[slot];

  evalFlat(scene, slot, 0.5, 1, undefined);

  const th = spiraltheta(s, ks, ORDER);
  const ang = ks[KANGLE];

  out[0] = Math.sin(th + ang) * ks[KSCALE];
  out[1] = Math.cos(th + ang) * ks[KSCALE];

  return out;
}

/* SplineSegment.curvature(). */
export function sceneCurvature(scene: StrokeScene, slot: number, s: number): number {
  if (scene.segi[slot * SEG_I + SegI.FLAG] & COINCIDENT) {
    return 0.0;
  }

  const ks = scene.ksv[slot];

  evalFlat(scene, slot, 0.5, 1, undefined);

  const k = spiralcurvature(s, ks, ORDER);
  return k / (0.0000001 + ks[KSCALE]);
}

function evalFlat(
  scene: StrokeScene,
  slot: number,
  s: number,
  angle_only: number | undefined,
  no_update: boolean | undefined
) {
  const io = slot * SEG_I;
  const v1 = scene.segi[io + SegI.V1] * VERT_F;
  const v2 = scene.segi[io + SegI.V2] * VERT_F;
  const vf = scene.vertf;

  return eval_curve_flat(
    scene.segi[io + SegI.KSPTR],
    scene.ksv[slot],
    s,
    vf[v1 + VertF.X],
    vf[v1 + VertF.Y],
    vf[v1 + VertF.Z],
    vf[v2 + VertF.X],
    vf[v2 + VertF.Y],
    vf[v2 + VertF.Z],
    ORDER,
    angle_only,
    no_update
  );
}

/* Whether the scene recorded a width net for this segment.  A degenerate chain
   has none and the caller must fall back to SplineSegment.widthWalk(); see
   stroke_scene.buildNets(). */
export function sceneHasNet(scene: StrokeScene, slot: number): boolean {
  return scene.netSeg[slot * NET_STEPS] !== NO_SLOT;
}

/* Loads this segment's eight-knot window, exactly as width_chain.loadWidthNet()
   does from the live graph: values and lengths read now, expression order and
   clamping copied. */
function loadNet(scene: StrokeScene, slot: number): number {
  const off = slot * NET_STEPS;
  const fo = slot * SEG_F;

  const l2 = loadStep(scene, off, 0);
  const l1 = loadStep(scene, off + 1, -1);
  const l0 = loadStep(scene, off + 2, -1);

  const l5 = loadStep(scene, off + 3, 3);
  const l6 = loadStep(scene, off + 4, 4);
  const l7 = loadStep(scene, off + 5, 5);
  loadStep(scene, off + 6, 6);

  const lw = scene.segf[fo + SegF.LINEWIDTH];
  const l4 = Math.max(segLength(scene, slot), 0.0001);

  netWidths[1] = scene.segf[fo + SegF.W1] * lw;
  netShifts[1] = scene.segf[fo + SegF.SHIFT1];
  netWidths[2] = scene.segf[fo + SegF.W2] * lw;
  netShifts[2] = scene.segf[fo + SegF.SHIFT2];

  netKnots[0] = -l0 - l1 - l2;
  netKnots[1] = -l1 - l2;
  netKnots[2] = -l2;
  netKnots[3] = 0;
  netKnots[4] = l4;
  netKnots[5] = l4 + l5;
  netKnots[6] = l4 + l5 + l6;
  netKnots[7] = l4 + l5 + l6 + l7;

  return l4;
}

function loadStep(scene: StrokeScene, i: number, oi: number): number {
  const slot = scene.netSeg[i];
  const fo = slot * SEG_F;

  if (oi >= 0) {
    const v1 = scene.netV1[i] === 1;

    netWidths[oi] = scene.segf[fo + (v1 ? SegF.W1 : SegF.W2)] * scene.segf[fo + SegF.LINEWIDTH];
    netShifts[oi] = scene.segf[fo + (v1 ? SegF.SHIFT1 : SegF.SHIFT2)];
  }

  return Math.max(segLength(scene, slot), 0.0001);
}

/* SplineSegment.width(), and its shift out-param. */
export function sceneWidth(
  scene: StrokeScene,
  slot: number,
  s: number,
  outShift?: number[]
): number {
  const span = loadNet(scene, slot);
  const ss = s * span;

  if (outShift) {
    outShift[0] = bspline.deBoor(3, ss, netKnots, netShifts, 3);
  }

  return bspline.deBoor(3, ss, netKnots, netWidths, 3);
}

/* SplineSegment.shift(): width() called for its out-param alone. */
export function sceneShift(scene: StrokeScene, slot: number, s: number): number {
  sceneWidth(scene, slot, s, shiftout);
  return shiftout[0];
}

/* The two finite differences, at the same 1e-4 step the methods use.  Analytic
   derivatives are a post-parity change (§5.6). */
export function sceneDwidth(scene: StrokeScene, slot: number, s: number): number {
  const df = 0.0001;
  const a = sceneWidth(scene, slot, s - df);
  const b = sceneWidth(scene, slot, s + df);

  return (b - a) / (2.0 * df);
}

export function sceneDshift(scene: StrokeScene, slot: number, s: number): number {
  const df = 0.0001;
  const a = sceneShift(scene, slot, s - df);
  const b = sceneShift(scene, slot, s + df);

  return (b - a) / (2.0 * df);
}

/* SplineSegment.evaluateSide(): the point on one stroke boundary, with the
   boundary's derivative, its normal and [width, dwidth] as out-params.  The
   derivation this implements is in the comment above the method. */
export function sceneEvalSide(
  scene: StrokeScene,
  slot: number,
  s: number,
  side: number,
  co_out: VecOut,
  dv_out?: VecOut,
  normal_out?: VecOut,
  lw_dlw_out?: VecOut
): VecOut {
  const io = slot * SEG_I;

  if (scene.segi[io + SegI.FLAG] & COINCIDENT) {
    if (dv_out) {
      dv_out[0] = dv_out[1] = 0.0;
    }
    if (normal_out) {
      normal_out[0] = normal_out[1] = 0.0;
    }
    if (lw_dlw_out) {
      lw_dlw_out[0] = lw_dlw_out[1] = 0.0;
    }

    const v1 = scene.segi[io + SegI.V1] * VERT_F;

    co_out[0] = scene.vertf[v1 + VertF.X];
    co_out[1] = scene.vertf[v1 + VertF.Y];

    return co_out;
  }

  const sidesign = side ? 1.0 : -1.0;

  sceneEvaluate(scene, slot, s, co_tmp);

  const dv = sceneDerivative(scene, slot, s, dv_tmp);
  let shift = sceneShift(scene, slot, s) * sidesign;
  const dshift = sceneDshift(scene, slot, s) * sidesign;

  let lw = sceneWidth(scene, slot, s) * sidesign;
  let dlw = sceneDwidth(scene, slot, s) * sidesign;

  dlw = dlw * shift + dlw + dshift * lw;
  lw = lw + lw * shift;

  const length = segLength(scene, slot);

  const dx = (-dv[1] * lw * 0.5) / length;
  const dy = (dv[0] * lw * 0.5) / length;

  if (normal_out) {
    normal_out[0] = dx;
    normal_out[1] = dy;
  }

  if (lw_dlw_out) {
    lw_dlw_out[0] = lw;
    lw_dlw_out[1] = dlw;
  }

  if (dv_out) {
    const seglen = length;

    const k = -seglen * sceneCurvature(scene, slot, s);
    const dx2 = (-0.5 * (dlw * dv[1] + dv[0] * k * lw - 2 * dv[0] * seglen)) / seglen;
    const dy2 = (0.5 * (dlw * dv[0] - dv[1] * k * lw + 2 * dv[1] * seglen)) / seglen;

    dv_out[0] = dx2;
    dv_out[1] = dy2;
  }

  co_out[0] = co_tmp[0] + dx;
  co_out[1] = co_tmp[1] + dy;

  return co_out;
}
