/* A recording of stroker_eval.ts's output, for the C++ port to be checked
   against.

   Stage 5 gave the port a scene it can load and a hash of the outlines a
   correct stroker makes of it.  A hash is the right gate for the *end* of the
   pipeline and useless in the middle of it: when the number disagrees it says
   nothing about where, and it cannot be compared at all across two different
   libms.  This is the other half -- every quantity stroker_eval.ts computes,
   at fixed parameter values, as numbers a port can subtract from its own.

   Three things make it comparable rather than merely dumped:

   - **A fixed probe order.**  Evaluating a segment rewrites `ks[KSCALE]`, which
     is the arc length every width net downstream reads, so which calls happen
     in which order is part of the answer.  Both sides walk live slots
     ascending, samples in order, fields in the order of the enum below, and
     make exactly the calls listed -- including sceneEvalSide's, which repeats
     work the fields above it already did.  Repeating it is the point.
   - **Segments with no width net are marked, not skipped.**  A degenerate chain
     has none (stroke_scene.buildNets), and the width calls would walk off the
     end of the arrays.  The evaluator fields are still recorded for them; the
     net-dependent ones are left zero on both sides.
   - **Tolerance, not equality.**  §5.6 pins the evaluator, so the wasm
     `eval_curve` is on both sides of the comparison -- but `Math.sin` is not
     the same function as the platform libm's, and the finite differences in
     sceneDwidth/sceneDshift multiply whatever they disagree by five thousand.
     The reader compares with a tolerance per field group; see
     src/wasm/tests/eval_ref.cc.

   Layout, all little-endian: eight int32s of header, then one int32 slot number
   per live segment, then one int32 of flags per live segment, then (padded to
   eight bytes) SEG_LIVE * SAMPLES * FIELDS doubles. */

import {
  sceneCurvature,
  sceneDerivative,
  sceneDshift,
  sceneDwidth,
  sceneEvalSide,
  sceneEvaluate,
  sceneHasNet,
  sceneShift,
  sceneWidth,
  segLength,
} from "./stroker_eval.js";

import type { StrokeScene } from "./stroke_scene.js";

/* "FMER", read little-endian. */
export const EVALREF_MAGIC = 0x52454d46;
export const EVALREF_VERSION = 1;

/* s = i / (SAMPLES - 1), so both endpoints are probed.  The endpoints are where
   the evaluator's nudges and the knot vector's clamping live, which is where a
   port is most likely to be wrong. */
export const EVALREF_SAMPLES = 11;

const EVALREF_HEADER_I = 8;

/* Bit 0 of a segment's flag word. */
export const EVALREF_HAS_NET = 1;

/* Field order is call order.  Everything from WIDTH down needs a width net. */
export const enum RefF {
  CO_X = 0,
  CO_Y = 1,
  DV_X = 2,
  DV_Y = 3,
  CURVATURE = 4,
  LENGTH = 5,

  WIDTH = 6,
  SHIFT = 7,
  DWIDTH = 8,
  DSHIFT = 9,

  SIDE0_CO_X = 10,
  SIDE0_CO_Y = 11,
  SIDE0_DV_X = 12,
  SIDE0_DV_Y = 13,
  SIDE0_N_X = 14,
  SIDE0_N_Y = 15,
  SIDE0_LW = 16,
  SIDE0_DLW = 17,

  SIDE1_CO_X = 18,
  SIDE1_CO_Y = 19,
  SIDE1_DV_X = 20,
  SIDE1_DV_Y = 21,
  SIDE1_N_X = 22,
  SIDE1_N_Y = 23,
  SIDE1_LW = 24,
  SIDE1_DLW = 25,
}

export const EVALREF_FIELDS = 26;

const co = [0, 0];
const dv = [0, 0];
const nor = [0, 0];
const lw = [0, 0];

/* One sample of one segment, written at `o`.  Nothing here is conditional on
   the values, only on whether the net exists -- a port has to be able to make
   the same calls without looking at what came back. */
function probe(scene: StrokeScene, slot: number, s: number, out: Float64Array, o: number) {
  sceneEvaluate(scene, slot, s, co);
  out[o + RefF.CO_X] = co[0];
  out[o + RefF.CO_Y] = co[1];

  sceneDerivative(scene, slot, s, dv);
  out[o + RefF.DV_X] = dv[0];
  out[o + RefF.DV_Y] = dv[1];

  out[o + RefF.CURVATURE] = sceneCurvature(scene, slot, s);
  out[o + RefF.LENGTH] = segLength(scene, slot);

  if (!sceneHasNet(scene, slot)) {
    return;
  }

  out[o + RefF.WIDTH] = sceneWidth(scene, slot, s);
  out[o + RefF.SHIFT] = sceneShift(scene, slot, s);
  out[o + RefF.DWIDTH] = sceneDwidth(scene, slot, s);
  out[o + RefF.DSHIFT] = sceneDshift(scene, slot, s);

  for (let side = 0; side < 2; side++) {
    const b = o + (side === 0 ? RefF.SIDE0_CO_X : RefF.SIDE1_CO_X);

    sceneEvalSide(scene, slot, s, side, co, dv, nor, lw);

    out[b + 0] = co[0];
    out[b + 1] = co[1];
    out[b + 2] = dv[0];
    out[b + 3] = dv[1];
    out[b + 4] = nor[0];
    out[b + 5] = nor[1];
    out[b + 6] = lw[0];
    out[b + 7] = lw[1];
  }
}

/* Live slots ascending -- the same order stroke_dump.ts writes them in, and for
   the same reason. */
function liveSlots(scene: StrokeScene): number[] {
  const out = Array.from(scene.segMap.values());
  out.sort((a, b) => a - b);
  return out;
}

export function dumpEvalRef(scene: StrokeScene): ArrayBuffer {
  const slots = liveSlots(scene);
  const n = slots.length;

  const dataAt = (EVALREF_HEADER_I * 4 + n * 4 * 2 + 7) & ~7;
  const buf = new ArrayBuffer(dataAt + n * EVALREF_SAMPLES * EVALREF_FIELDS * 8);

  const h = new Int32Array(buf, 0, EVALREF_HEADER_I);

  h[0] = EVALREF_MAGIC;
  h[1] = EVALREF_VERSION;
  h[2] = n;
  h[3] = EVALREF_SAMPLES;
  h[4] = EVALREF_FIELDS;

  const segs = new Int32Array(buf, EVALREF_HEADER_I * 4, n);
  const flags = new Int32Array(buf, EVALREF_HEADER_I * 4 + n * 4, n);
  const data = new Float64Array(buf, dataAt, n * EVALREF_SAMPLES * EVALREF_FIELDS);

  for (let i = 0; i < n; i++) {
    const slot = slots[i];

    segs[i] = slot;
    flags[i] = sceneHasNet(scene, slot) ? EVALREF_HAS_NET : 0;

    for (let j = 0; j < EVALREF_SAMPLES; j++) {
      probe(
        scene,
        slot,
        j / (EVALREF_SAMPLES - 1),
        data,
        (i * EVALREF_SAMPLES + j) * EVALREF_FIELDS
      );
    }
  }

  return buf;
}
