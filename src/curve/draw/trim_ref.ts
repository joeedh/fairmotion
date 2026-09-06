/* A recording of trimmer.ts's output, for the C++ port to be checked against.

   The third dump format, and the same shape as the second (stroke_eval_ref.ts):
   run the pass over a scene loaded from a scene blob, in an order written down
   rather than inherited, and write out every number it produced.  Here the
   output is the trim arrays themselves -- twelve doubles and a mask byte per
   segment slot -- which is the whole of what the trimmer computes and all the
   stroker later reads.

   The order is strokeAll()'s: live vertex slots ascending, one trimVertex()
   each.  That is not how a frame does it (a frame trims only the vertices an
   edit touched), and it is the point -- a parity comparison needs an order that
   is a property of the scene rather than of an edit history.  It matters twice
   over here, because trimming evaluates segments, and evaluating a segment
   rewrites the arc length its neighbours' widths are read against.

   Tolerance, not equality, for the doubles: the trim values come out of a
   bisection over an evaluator whose last bits differ between two libms.  The
   mask is compared exactly -- it is a set of decisions, not a measurement, and
   a port that mitres a join the JS left plain has a real bug rather than a
   rounding difference.  The bisection can amplify: eight halvings of a 0.65
   bracket means a crossing test that answers differently once moves the result
   by up to 0.0025, which is why the reader reports the count of differing
   slots rather than only a worst-case number.

   Layout, all little-endian: eight int32s of header, one int32 per trimmed
   vertex slot, one byte of mask per trim slot, then (padded to eight bytes)
   SLOTS * TRIM_STRIDE doubles. */

import { newTrims, sceneTrimSlots } from "./stroke_dump.js";
import { TRIM_STRIDE } from "./trim_state.js";
import { trimVertex } from "./trimmer.js";

import type { StrokeScene } from "./stroke_scene.js";

/* "FMTR", read little-endian. */
export const TRIMREF_MAGIC = 0x52544d46;
export const TRIMREF_VERSION = 1;

const TRIMREF_HEADER_I = 8;

/* Trims `scene` the way strokeAll() does, and writes down what came out. */
export function dumpTrimRef(scene: StrokeScene): ArrayBuffer {
  const slots = sceneTrimSlots(scene);
  const trims = newTrims(slots);

  const verts = Array.from(scene.vertMap.values());
  verts.sort((a, b) => a - b);

  for (const v of verts) {
    trimVertex(scene, trims, v);
  }

  const n = verts.length;
  const maskAt = TRIMREF_HEADER_I * 4 + n * 4;
  const dataAt = (maskAt + slots + 7) & ~7;

  const buf = new ArrayBuffer(dataAt + slots * TRIM_STRIDE * 8);

  const h = new Int32Array(buf, 0, TRIMREF_HEADER_I);

  h[0] = TRIMREF_MAGIC;
  h[1] = TRIMREF_VERSION;
  h[2] = slots;
  h[3] = n;
  h[4] = TRIM_STRIDE;

  new Int32Array(buf, TRIMREF_HEADER_I * 4, n).set(verts);
  new Uint8Array(buf, maskAt, slots).set(trims.mask.subarray(0, slots));
  new Float64Array(buf, dataAt, slots * TRIM_STRIDE).set(
    trims.data.subarray(0, slots * TRIM_STRIDE)
  );

  return buf;
}
