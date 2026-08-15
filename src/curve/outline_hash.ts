/* Reducing an OutlineBuffer to something two implementations can compare.

   The other half of stage 5's parity gate: stroke_dump.ts hands both sides the
   same document, and this turns what they make of it into numbers.  It lives
   apart from the dump because it depends on nothing -- no scene, no wasm heap,
   no platform -- which is what lets a unit test drive it.  src/wasm/outline_hash.h
   is the C++ twin, line for line.

   The hash is FNV-1a, 32-bit, over little-endian bytes: `h = 2166136261`, then
   `h = (h ^ byte) * 16777619` per byte, truncated to 32 bits.  Spelled out
   because the C++ side has to compute the same number, and because a hash over
   IEEE754 bytes is portable in a way one over formatted decimals is not.

   Bytes mean this is equality and not tolerance, so it is the right gate for
   the outline *structure* -- how many paths, in what order, of what commands --
   and the wrong one for the arithmetic underneath, which two libms will not
   agree on to the last ulp.  That is what stroke_eval_ref.ts compares instead. */

import { OUTLINE_I, OutlineI } from "./outline_buffer.js";

import type { OutlineBuffer } from "./outline_buffer.js";

export function fnv1a(bytes: Uint8Array, h = 2166136261): number {
  for (let i = 0; i < bytes.length; i++) {
    h = Math.imul(h ^ bytes[i], 16777619) >>> 0;
  }

  return h;
}

export function hashBuffer(buf: ArrayBuffer): number {
  return fnv1a(new Uint8Array(buf));
}

/* One row per outline, and one number over all of them. */
export interface OutlineRow {
  owner: number;
  role: number;
  finish: number;
  cmds: number;
  pts: number;
  hash: number;
}

export interface OutlineDigest {
  count: number;
  cmds: number;
  pts: number;
  hash: number;
  rows: OutlineRow[];
}

/* Each outline's opcodes and coordinates hashed as bytes, and the rows
   themselves folded into a total.  Rows are kept in emission order -- unlike
   the path dump, which sorts, because here the order is part of what the port
   has to reproduce. */
export function hashOutlines(out: OutlineBuffer): OutlineDigest {
  const rows: OutlineRow[] = [];
  const fold = new Int32Array(6);
  const foldBytes = new Uint8Array(fold.buffer);

  let total = 2166136261;

  for (let i = 0; i < out.count; i++) {
    const o = i * OUTLINE_I;

    const cmd0 = out.outlines[o + OutlineI.CMD0];
    const cmd1 = out.outlines[o + OutlineI.CMD1];
    const pt0 = out.outlines[o + OutlineI.PT0];
    const pt1 = out.outlines[o + OutlineI.PT1];

    let h = fnv1a(out.cmds.subarray(cmd0, cmd1));
    h = fnv1a(new Uint8Array(out.pts.buffer, out.pts.byteOffset + pt0 * 8, (pt1 - pt0) * 8), h);

    const row: OutlineRow = {
      owner : out.owner(i),
      role  : out.role(i),
      finish: out.finishOf(i),
      cmds  : cmd1 - cmd0,
      pts   : pt1 - pt0,
      hash  : h,
    };

    rows.push(row);

    fold[0] = row.owner;
    fold[1] = row.role;
    fold[2] = row.finish;
    fold[3] = row.cmds;
    fold[4] = row.pts;
    fold[5] = row.hash | 0;

    total = fnv1a(foldBytes, total);
  }

  return { count: out.count, cmds: out.cmdCount, pts: out.ptCount, hash: total, rows };
}
