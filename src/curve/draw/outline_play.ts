/* Replays one of the stroker's outlines onto a retained path.  The buffer holds
   the same commands the path takes, so this is a copy and nothing more; it is
   the only place that knows both sides of the boundary. */

import { OutCmd, OUTLINE_I, OutlineI } from "./outline_buffer.js";

import type { OutlineBuffer } from "./outline_buffer.js";
import type { PathBase } from "../../vectordraw/vectordraw_base.js";

export function playOutline(out: OutlineBuffer, i: number, path: PathBase) {
  const o = i * OUTLINE_I;
  const cmd1 = out.outlines[o + OutlineI.CMD1];
  const pts = out.pts;

  let p = out.outlines[o + OutlineI.PT0];

  for (let c = out.outlines[o + OutlineI.CMD0]; c < cmd1; c++) {
    switch (out.cmds[c]) {
      case OutCmd.MOVE:
        path.moveTo(pts[p], pts[p + 1]);
        p += 2;
        break;
      case OutCmd.LINE:
        path.lineTo(pts[p], pts[p + 1]);
        p += 2;
        break;
      case OutCmd.CUBIC:
        path.cubicTo(pts[p], pts[p + 1], pts[p + 2], pts[p + 3], pts[p + 4], pts[p + 5]);
        p += 6;
        break;
    }
  }
}
