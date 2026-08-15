/* The stroker: a StrokeScene in, an OutlineBuffer out, and nothing else.

   No Spline, no VectorDraw, no DOM -- the boundary stage 4 of the draw refactor
   exists to create, and the shape a C++/wasm implementation has to fit.  What
   used to be SplineDrawer.update_stroke_group() is here; what is left there is
   an assembler that hands this a group index and plays the outlines back onto
   retained paths.  See docs/plans/draw-refactor.md stage 4.

   Two outlines per group, and the difference between them is the whole reason
   this is not a point list.  The stroke's own path and the double-stroke path
   walk identical geometry but break it differently: where a tangent break makes
   the stroke draw a straight line across, the double stroke lifts the pen
   instead.  So each point is recorded once, with the opcode each of the two
   paths wants, and the two command streams are flushed from one traversal.
   That staging is also what keeps the geometry evaluated exactly once, in the
   order update_stroke_group() evaluated it -- which is load-bearing, because
   evaluating a segment rewrites its arc length and its neighbours' width nets
   read that (see stroke_scene.ts).

   The debug overlays the viewport's "Stroke Debug" toggle draws are emitted
   here too, from the same records, under the roles DEBUG_1 and DEBUG_3.  They
   are geometry like any other; a port may ignore them. */

import { bez4, dbez4 } from "../util/bezier.js";
import { dist2, dot2, len2, mul2, normalize2 } from "./flat_vec.js";
import { OutlineBuffer, OutCmd } from "./outline_buffer.js";
import { PathRole } from "./path_key.js";
import { SplineFlags } from "./spline_base.js";
import {
  GROUP_I,
  GroupI,
  NO_SLOT,
  otherVert,
  SEG_F,
  SEG_I,
  SegF,
  SegI,
  sortSegments,
  VERT_F,
  VERT_I,
  VertF,
  VertI,
} from "./stroke_scene.js";
import { sceneDerivative, sceneEvalSide, segLength } from "./stroker_eval.js";
import { trimVertex } from "./trimmer.js";
import { trimEnd, trimGetp, trimGets, trimHasp, trimStart } from "./trim_view.js";

import type { StrokeScene } from "./stroke_scene.js";
import type { TrimView } from "./trim_view.js";

/* One recorded point of the walk: where it is, the two control points a cubic
   to it would use, its scaled tangent (debug only), and the extra point the
   two-valence break case evaluates -- which on a BREAK record instead carries
   the size of the marker that point draws, since it has no second point. */
const REC_F = 10;

const enum RecF {
  X = 0,
  Y = 1,
  C1X = 2,
  C1Y = 3,
  C2X = 4,
  C2Y = 5,
  DVSX = 6,
  DVSY = 7,
  P2X = 8,
  P2Y = 9,
}

/* ...and what to do with it: the opcode the stroke path takes, the one the
   double-stroke path takes, an optional second opcode for the double stroke,
   and which branch produced the record. */
const REC_I = 4;

const enum RecI {
  OP = 0,
  OP2A = 1,
  OP2B = 2,
  KIND = 3,
}

const NO_OP = 255;

const enum RecKind {
  /* A point on the curve, joined to the last one by a cubic. */
  CURVE = 0,
  /* The break point at a BREAK_TANGENTS vertex. */
  BREAK = 1,
  /* The same point again, where the vertex has exactly two segments and no
     mitre point of its own. */
  BREAK_2 = 2,
}

let recf = new Float64Array(0);
let reci = new Uint8Array(0);
let recCount = 0;

/* Scratch shared by one call; the buffer is the only thing that outlives it. */
const co = [0, 0];
const p2 = [0, 0];
const dv = [0, 0];
const dv2 = [0, 0];
const no = [0, 0];
const lw_dlw = [0, 0, 0];

function record(kind: RecKind, op: OutCmd, op2a: OutCmd, op2b: number) {
  if ((recCount + 1) * REC_F > recf.length) {
    let cap = recf.length > 0 ? recf.length / REC_F : 256;

    while ((recCount + 1) * REC_F > cap * REC_F) {
      cap *= 2;
    }

    const f = new Float64Array(cap * REC_F);
    const i = new Uint8Array(cap * REC_I);

    f.set(recf);
    i.set(reci);

    recf = f;
    reci = i;
  }

  const io = recCount * REC_I;

  reci[io + RecI.OP] = op;
  reci[io + RecI.OP2A] = op2a;
  reci[io + RecI.OP2B] = op2b;
  reci[io + RecI.KIND] = kind;

  const fo = recCount * REC_F;

  for (let k = 0; k < REC_F; k++) {
    recf[fo + k] = 0;
  }

  recCount++;
  return fo;
}

/* --- the walk ------------------------------------------------------------ */

/* Strokes group `gi` of `scene` into `out`, as two outlines keyed by the
   group's id: the stroke and its double stroke.  With `debug` on, two more. */
export function strokeGroup(
  scene: StrokeScene,
  trims: TrimView,
  gi: number,
  debug: boolean,
  out: OutlineBuffer
): OutlineBuffer {
  const go = gi * GROUP_I;
  const id = scene.groups[go + GroupI.ID];
  const seg0 = scene.groups[go + GroupI.SEG0];
  const seg1 = scene.groups[go + GroupI.SEG1];
  const total = seg1 - seg0;

  recCount = 0;

  if (total === 0) {
    return out;
  }

  /* The end to start from: the vertex the second segment does not share, so
     the walk runs through the group rather than off the front of it. */
  const first0 = scene.groupSegs[seg0];
  const second = total > 1 ? scene.groupSegs[seg0 + 1] : NO_SLOT;

  let v = segV1(scene, first0);

  if (second !== NO_SLOT) {
    const a = segV1(scene, second);
    const b = segV2(scene, second);

    if (v === a || v === b) {
      v = segV2(scene, first0);
    }
  }

  let lastpx = 0,
    lastpy = 0;
  let lastdvx = 0,
    lastdvy = 0;
  let lastdvsx = 0,
    lastdvsy = 0;
  let dobreak = false;

  for (let step = 0; step < 2; step++) {
    let first = true;

    for (let si = 0; si < total; si++) {
      const seg = scene.groupSegs[step ? seg0 + total - si - 1 : seg0 + si];

      if (seg === NO_SLOT) {
        continue;
      }

      const tslot = scene.segi[seg * SEG_I + SegI.TRIM];
      const seglen = segLength(scene, seg);
      let steps = seglen > 0.0 ? ~~(seglen / 55.0 + 0.5) : 0;

      steps = Math.min(Math.max(steps, 7), 16);

      const isV1 = v === segV1(scene, seg);
      const dsign = isV1 ? 1.0 : -1.0;
      const side = dsign < 0.0 ? 1 : 0;

      const start = trimStart(trims, tslot, side);
      const end = trimEnd(trims, tslot, side);

      const ds = dsign * ((end - start) / steps);
      let s = dsign < 0.0 ? end : start;

      /* Make sure we hit endpoints. */
      const last = si === total - 1;

      if (last) {
        steps++;
      }

      const vo = v * VERT_I;
      const usepoint =
        scene.verti[vo + VertI.VALENCE] <= 2 &&
        scene.verti[vo + VertI.FLAG] & SplineFlags.BREAK_TANGENTS;

      if (usepoint) {
        const hasp = trimHasp(trims, tslot, isV1, 1);

        if (hasp) {
          trimGetp(scene, trims, seg, tslot, isV1, 1, co);
          sceneDerivative(scene, seg, s, dv);
        } else {
          let s2 = trimGets(trims, tslot, isV1, side);
          s2 = Math.min(Math.max(s2, 0.0), 1.0);
          sceneEvalSide(scene, seg, s2, 1, co, dv);
        }

        dobreak = true;

        let fo: number;

        if (first) {
          first = false;

          if (!step) {
            fo = record(RecKind.BREAK, OutCmd.MOVE, OutCmd.MOVE, NO_OP);
          } else {
            fo = record(RecKind.BREAK, OutCmd.LINE, OutCmd.LINE, OutCmd.MOVE);
          }
        } else {
          fo = record(RecKind.BREAK, OutCmd.LINE, OutCmd.LINE, NO_OP);
        }

        recf[fo + RecF.X] = co[0];
        recf[fo + RecF.Y] = co[1];
        recf[fo + RecF.P2X] = hasp ? 15 : 8;

        /* The far side of the join, evaluated whether or not anything draws it:
           evaluating a segment refreshes its arc length, and the widths of its
           neighbours are read from that. */
        if (scene.verti[vo + VertI.VALENCE] === 2 && !hasp) {
          const seg2 = otherSegment(scene, v, seg);

          if (seg2 !== NO_SLOT) {
            const t2 = scene.segi[seg2 * SEG_I + SegI.TRIM];
            let s2 = trimGets(trims, t2, v === segV1(scene, seg2), side);
            s2 = Math.min(Math.max(s2, 0.0), 1.0);

            sceneEvalSide(scene, seg2, s2, 1, p2, dv2);
          }

          const fo2 = record(RecKind.BREAK_2, OutCmd.LINE, OutCmd.LINE, NO_OP);

          recf[fo2 + RecF.X] = co[0];
          recf[fo2 + RecF.Y] = co[1];
          recf[fo2 + RecF.P2X] = p2[0];
          recf[fo2 + RecF.P2Y] = p2[1];
        }
      }

      /* Now do curve. */
      for (let i = 0; i < steps; i++, s += ds) {
        if (last) {
          if (i === 0) {
            s = dsign > 0.0 ? start : end;
          } else if (i === steps - 1) {
            s = dsign < 0.0 ? start : end;
          }
        }

        sceneEvalSide(scene, seg, s, side, co, dv, no, lw_dlw);

        dv[0] *= dsign;
        dv[1] *= dsign;

        let dfac = ds / 3.0;

        if (side) {
          dfac *= -1;
        }

        const dvsx = dv[0] * dfac;
        const dvsy = dv[1] * dfac;

        lastdvsx = lastdvx * dfac;
        lastdvsy = lastdvy * dfac;

        let fo: number;

        if (first) {
          first = false;

          if (!step) {
            fo = record(RecKind.CURVE, OutCmd.MOVE, OutCmd.MOVE, NO_OP);
          } else {
            fo = record(RecKind.CURVE, OutCmd.LINE, OutCmd.MOVE, NO_OP);
          }
        } else if (dobreak) {
          dobreak = false;

          fo = record(RecKind.CURVE, OutCmd.LINE, OutCmd.LINE, NO_OP);

          lastdvsx = lastdvsy = 0.0;
        } else {
          fo = record(RecKind.CURVE, OutCmd.CUBIC, OutCmd.CUBIC, NO_OP);

          recf[fo + RecF.C1X] = lastpx + lastdvsx;
          recf[fo + RecF.C1Y] = lastpy + lastdvsy;
          recf[fo + RecF.C2X] = co[0] - dvsx;
          recf[fo + RecF.C2Y] = co[1] - dvsy;
        }

        recf[fo + RecF.X] = co[0];
        recf[fo + RecF.Y] = co[1];
        recf[fo + RecF.DVSX] = dvsx;
        recf[fo + RecF.DVSY] = dvsy;

        lastdvx = dv[0];
        lastdvy = dv[1];
        lastpx = co[0];
        lastpy = co[1];
      }

      v = otherVert(scene, seg, v);
    }
  }

  flush(id, out);

  if (debug) {
    flushDebug(id, out);
  }

  return out;
}

/* Plays the records into the two outlines.  The stroke path takes OP, the
   double stroke takes OP2A and then OP2B where there is one. */
function flush(id: number, out: OutlineBuffer) {
  out.begin(id, PathRole.ELEMENT);

  for (let i = 0; i < recCount; i++) {
    emit(out, i, reci[i * REC_I + RecI.OP]);
  }

  out.begin(id, PathRole.DOUBLE_STROKE);

  for (let i = 0; i < recCount; i++) {
    emit(out, i, reci[i * REC_I + RecI.OP2A]);

    const op2b = reci[i * REC_I + RecI.OP2B];

    if (op2b !== NO_OP) {
      emit(out, i, op2b);
    }
  }

  out.finish();
}

function emit(out: OutlineBuffer, i: number, op: number) {
  const fo = i * REC_F;

  if (op === OutCmd.CUBIC) {
    out.cubicTo(
      recf[fo + RecF.C1X],
      recf[fo + RecF.C1Y],
      recf[fo + RecF.C2X],
      recf[fo + RecF.C2Y],
      recf[fo + RecF.X],
      recf[fo + RecF.Y]
    );
  } else if (op === OutCmd.MOVE) {
    out.moveTo(recf[fo + RecF.X], recf[fo + RecF.Y]);
  } else {
    out.lineTo(recf[fo + RecF.X], recf[fo + RecF.Y]);
  }
}

/* The overlays, in the order update_stroke_group() drew them: a marker at every
   point and its tangent into DEBUG_1, and the cubic's control arm into DEBUG_3.
   DEBUG_2 is opened empty because the pass resets it and draws nothing. */
function flushDebug(id: number, out: OutlineBuffer) {
  out.begin(id, PathRole.DEBUG_1);

  for (let i = 0; i < recCount; i++) {
    const fo = i * REC_F;
    const kind = reci[i * REC_I + RecI.KIND];

    if (kind === RecKind.BREAK) {
      dpoint(out, recf[fo + RecF.X], recf[fo + RecF.Y], recf[fo + RecF.P2X]);
    } else if (kind === RecKind.CURVE) {
      const x = recf[fo + RecF.X],
        y = recf[fo + RecF.Y];
      const dx = recf[fo + RecF.DVSX],
        dy = recf[fo + RecF.DVSY];

      dline(out, x, y, x + dx, y + dy, 0.5);
      dpoint(out, x + dx, y + dy, 4);
    }
  }

  out.begin(id, PathRole.DEBUG_2);

  out.begin(id, PathRole.DEBUG_3);

  for (let i = 0; i < recCount; i++) {
    const fo = i * REC_F;
    const kind = reci[i * REC_I + RecI.KIND];

    if (kind === RecKind.BREAK_2) {
      dpoint(out, recf[fo + RecF.P2X], recf[fo + RecF.P2Y], 15);
    } else if (kind === RecKind.CURVE && reci[i * REC_I + RecI.OP] === OutCmd.CUBIC) {
      dline(
        out,
        recf[fo + RecF.C1X],
        recf[fo + RecF.C1Y],
        recf[fo + RecF.C2X],
        recf[fo + RecF.C2Y],
        0.5
      );
      dpoint(out, recf[fo + RecF.C1X], recf[fo + RecF.C1Y], 4);
    }
  }

  out.finish();
}

function dpoint(out: OutlineBuffer, x: number, y: number, w: number) {
  w *= 0.5;

  out.moveTo(x - w, y - w);
  out.lineTo(x - w, y + w);
  out.lineTo(x + w, y + w);
  out.lineTo(x + w, y - w);
  out.lineTo(x - w, y - w);
}

function dline(out: OutlineBuffer, x1: number, y1: number, x2: number, y2: number, w: number) {
  let dx = y1 - y2,
    dy = x2 - x1;
  let l = Math.sqrt(dx * dx + dy * dy);
  l = (0.5 * w) / l;

  dx *= l;
  dy *= l;

  out.moveTo(x1 - dx, y1 - dy);
  out.lineTo(x2 - dx, y2 - dy);
  out.lineTo(x2 + dx, y2 + dy);
  out.lineTo(x1 + dx, y1 + dy);
  out.lineTo(x1 - dx, y1 - dy);
}

/* --- joins ---------------------------------------------------------------- */

/* `v`'s segments in angular order, and the six points the join works from. */
const jsorted: number[] = [];

const p0 = [0, 0];
const p1a = [0, 0];
const p1b = [0, 0];
const dv0 = [0, 0];
const dv1a = [0, 0];
const dv1b = [0, 0];
const t1 = [0, 0];
const t2 = [0, 0];

/* Fills the wedge between `seg`'s two stroke sides at vertex slot `v`, so a
   vertex the trimming pulled the strokes back from does not show a gap.

   Two outlines.  The wedge itself is a cubic from the previous segment's
   boundary round to this one's, closed back through the vertex, and filled.
   The double stroke's cap across it is either a stroke along that same cubic or,
   where the corner is too tight for one to look right, a filled quad -- and
   since that choice is made from the geometry, the outlines carry the finish op
   rather than leaving the assembler to guess. */
export function strokeJoin(
  scene: StrokeScene,
  trims: TrimView,
  seg: number,
  v: number,
  out: OutlineBuffer
): OutlineBuffer {
  const n = sortSegments(scene, v, jsorted);
  const si = jsorted.indexOf(seg);
  const prev = jsorted[(si + n - 1) % n];

  const atV1 = segV1(scene, seg) === v;
  const prevV1 = segV1(scene, prev) === v;

  const side0 = prevV1 ? 0 : 1;
  const side1 = atV1 ? 1 : 0;

  const tprev = scene.segi[prev * SEG_I + SegI.TRIM];
  const tseg = scene.segi[seg * SEG_I + SegI.TRIM];

  trimGetp(scene, trims, prev, tprev, prevV1, side0, p0, dv0);
  trimGetp(scene, trims, seg, tseg, atV1, side1, p1a, dv1a);
  /* dv1b goes nowhere, but asking for it is what evaluates the far boundary. */
  trimGetp(scene, trims, seg, tseg, atV1, side1 ^ 1, p1b, dv1b);

  const scl = 0.7;

  mul2(dv0, prevV1 ? scl : -scl);
  mul2(dv1a, atV1 ? scl : -scl);
  mul2(dv1b, atV1 ? scl : -scl);

  const vx = scene.vertf[v * VERT_F + VertF.X];
  const vy = scene.vertf[v * VERT_F + VertF.Y];

  /* How far back the trimming took each side, as a fraction of its segment. */
  let scale1 = dist2(vx, vy, p0[0], p0[1]) / Math.max(segLength(scene, prev), 0.00001);
  let scale2 = dist2(vx, vy, p1a[0], p1a[1]) / Math.max(segLength(scene, seg), 0.00001);

  scale1 /= 1.5;
  scale2 /= 1.5;

  mul2(dv0, -scale1);
  mul2(dv1a, scale2);

  const eid = scene.segi[seg * SEG_I + SegI.EID];

  out.begin(eid, atV1 ? PathRole.JOIN_V1 : PathRole.JOIN_V2);
  out.moveTo(p0[0], p0[1]);
  out.cubicTo(p0[0] + dv0[0], p0[1] + dv0[1], p1a[0] - dv1a[0], p1a[1] - dv1a[1], p1a[0], p1a[1]);
  out.lineTo(p1b[0], p1b[1]);
  out.lineTo(vx, vy);
  out.fill();

  out.begin(eid, atV1 ? PathRole.JOIN_V1_DOUBLE : PathRole.JOIN_V2_DOUBLE);
  out.moveTo(p0[0], p0[1]);

  const lw2 = scene.segf[seg * SEG_F + SegF.LINEWIDTH2];

  /* No double stroke to cap.  The lone moveTo above stays, and the outline
     finishes as neither a fill nor a stroke, exactly as the path did. */
  if (lw2 === 0) {
    return out;
  }

  const px = bez4(p0[0], p0[0] + dv0[0], p1a[0] - dv1a[0], p1a[0], 0.5);
  const py = bez4(p0[1], p0[1] + dv0[1], p1a[1] - dv1a[1], p1a[1], 0.5);

  t1[0] = p0[0] - px;
  t1[1] = p0[1] - py;
  t2[0] = p1a[0] - px;
  t2[1] = p1a[1] - py;

  const len1 = len2(t1) + len2(t2);

  normalize2(t1);
  normalize2(t2);

  const th = Math.acos(dot2(t1[0], t1[1], t2[0], t2[1]));

  if (len1 * 0.25 > lw2 || th > Math.PI * 0.2) {
    out.cubicTo(p0[0] + dv0[0], p0[1] + dv0[1], p1a[0] - dv1a[0], p1a[1] - dv1a[1], p1a[0], p1a[1]);
    out.stroke();

    return out;
  }

  /* Too tight: the cap becomes a quad across the corner, plus the two edges
     leading into it. */
  let dy1 = dbez4(p0[0], p0[0] + dv0[0], p1a[0] - dv1a[0], p1a[0], 0.0);
  let dx1 = -dbez4(p0[1], p0[1] + dv0[1], p1a[1] - dv1a[1], p1a[1], 0.0);
  let dy2 = dbez4(p0[0], p0[0] + dv0[0], p1a[0] - dv1a[0], p1a[0], 1.0);
  let dx2 = -dbez4(p0[1], p0[1] + dv0[1], p1a[1] - dv1a[1], p1a[1], 1.0);

  let l = Math.sqrt(dx1 * dx1 + dy1 * dy1);
  if (l > 0.0) {
    dx1 /= l;
    dy1 /= l;
  }

  l = Math.sqrt(dx2 * dx2 + dy2 * dy2);
  if (l > 0.0) {
    dx2 /= l;
    dy2 /= l;
  }

  dx1 *= lw2 * 0.5;
  dy1 *= lw2 * 0.5;
  dx2 *= lw2 * 0.5;
  dy2 *= lw2 * 0.5;

  out.moveTo(p0[0] + dx1, p0[1] + dy1);
  out.lineTo(px, py);
  out.lineTo(p1a[0] + dx2, p1a[1] + dy2);

  out.moveTo(p0[0] + dx1, p0[1] + dy1);
  out.lineTo(p1a[0] + dx2, p1a[1] + dy2);
  out.lineTo(p1a[0] - dx2, p1a[1] - dy2);
  out.lineTo(p0[0] - dx1, p0[1] - dy1);

  out.fill();

  return out;
}

/* --- the whole pass ------------------------------------------------------- */

/* `stroke(scene) -> outlines`: everything the stroker does to a document, in
   the order the drawer does it -- trim every junction, stroke every group, then
   fill the wedge at each segment of a many-valence vertex.

   This is the entry point a port implements and the one the golden harness
   calls (stroke_dump.ts, playwright/stroke-golden.spec.ts).  It is not what the
   drawer calls: a frame trims only the vertices an edit touched and strokes in
   drawlist order, interleaved with the faces, because that is what
   incrementality costs (§5.8).  The order here is the deterministic whole-
   document one, which is what a parity comparison needs -- and order is not
   cosmetic, since evaluating a segment rewrites the arc length its neighbours'
   widths are read against.

   `trims` is written as well as read.  Every value the walk below reads is set
   by the trim pass above it, so a fresh set of defaults (stroke_dump.newTrims)
   is the right thing to hand in. */
export function strokeAll(
  scene: StrokeScene,
  trims: TrimView,
  debug: boolean,
  out: OutlineBuffer
): OutlineBuffer {
  /* Ascending, so the order is a property of the scene rather than of how its
     maps happened to fill. */
  const slots = Array.from(scene.vertMap.values()).sort((a, b) => a - b);

  for (const v of slots) {
    trimVertex(scene, trims, v);
  }

  for (let gi = 0; gi < scene.groupCount; gi++) {
    strokeGroup(scene, trims, gi, debug, out);
  }

  for (const v of slots) {
    const valence = scene.verti[v * VERT_I + VertI.VALENCE];

    if (valence <= 2) {
      continue;
    }

    const off = scene.vsegOff[v];

    for (let i = 0; i < valence; i++) {
      const seg = scene.vsegs[off + i];

      if (seg !== NO_SLOT) {
        strokeJoin(scene, trims, seg, v, out);
      }
    }
  }

  return out.finish();
}

/* --- small scene lookups ------------------------------------------------- */

function segV1(scene: StrokeScene, seg: number): number {
  return scene.segi[seg * SEG_I + SegI.V1];
}

function segV2(scene: StrokeScene, seg: number): number {
  return scene.segi[seg * SEG_I + SegI.V2];
}

/* The other segment at a two-valence vertex. */
function otherSegment(scene: StrokeScene, v: number, seg: number): number {
  const off = scene.vsegOff[v];
  const n = scene.verti[v * VERT_I + VertI.VALENCE];

  for (let i = 0; i < n; i++) {
    const s = scene.vsegs[off + i];

    if (s !== seg) {
      return s;
    }
  }

  return NO_SLOT;
}
