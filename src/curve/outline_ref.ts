/* A recording of what the stroker produced, for the C++ port to be checked
   against.

   The fourth dump format, and the last one stage 6 needs: run strokeAll() over a
   scene loaded from a scene blob and write the OutlineBuffer out whole -- the
   outline table, the command stream, and every point.

   Why this exists when stage 5 already hashes outlines.  The golden digest is
   exact, which is what makes it the right gate at the end of the JS pipeline and
   the wrong one across a language boundary: §5.6 forbids comparing two libms bit
   for bit, so a hash that folds coordinates in can only ever say "different".
   This splits the two.  The table and the command stream are *structure* --
   which outline, in which role, how many commands, which opcodes, what finish --
   and structure is compared exactly, because a port that emits a lineTo where
   the JS emitted a cubic has a bug rather than a rounding difference.  The
   points are measurements and get a tolerance.

   Recorded with the debug overlays on.  They are geometry like any other, they
   are a strict superset -- flushDebug() only appends outlines, it does not
   change the two the group already flushed -- and they reach code nothing else
   in the harness does, including dline()'s unguarded division.

   Layout, all little-endian: eight int32s of header, count * OUTLINE_I int32s of
   table, cmdCount opcode bytes, then (padded to eight bytes) ptCount doubles. */

import { newTrims, sceneTrimSlots } from "./stroke_dump.js";
import { OUTLINE_I, OutlineBuffer } from "./outline_buffer.js";
import { strokeAll } from "./stroker.js";

import type { StrokeScene } from "./stroke_scene.js";

/* "FMOR", read little-endian. */
export const OUTREF_MAGIC = 0x524f4d46;
export const OUTREF_VERSION = 1;

const OUTREF_HEADER_I = 8;

/* Strokes `scene` the way the golden harness does, and writes down what it
   built. */
export function dumpOutlineRef(scene: StrokeScene): ArrayBuffer {
  const out = strokeAll(scene, newTrims(sceneTrimSlots(scene)), true, new OutlineBuffer());

  const count = out.count;
  const cmds = out.cmdCount;
  const pts = out.ptCount;

  const cmdAt = OUTREF_HEADER_I * 4 + count * OUTLINE_I * 4;
  const ptAt = (cmdAt + cmds + 7) & ~7;

  const buf = new ArrayBuffer(ptAt + pts * 8);

  const h = new Int32Array(buf, 0, OUTREF_HEADER_I);

  h[0] = OUTREF_MAGIC;
  h[1] = OUTREF_VERSION;
  h[2] = count;
  h[3] = cmds;
  h[4] = pts;
  h[5] = OUTLINE_I;
  h[6] = 1; /* debug */

  new Int32Array(buf, OUTREF_HEADER_I * 4, count * OUTLINE_I).set(
    out.outlines.subarray(0, count * OUTLINE_I)
  );
  new Uint8Array(buf, cmdAt, cmds).set(out.cmds.subarray(0, cmds));
  new Float64Array(buf, ptAt, pts).set(out.pts.subarray(0, pts));

  return buf;
}
