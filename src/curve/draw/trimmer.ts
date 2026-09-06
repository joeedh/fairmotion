/* The trimmer: junction geometry over a StrokeScene, the same boundary the
   stroker sits behind.

   Where strokes meet at a vertex their outlines overlap, and a stroke drawn
   through the overlap shows a bulge or a crossed corner.  This trims each
   stroke back until they stop crossing, and at a two-segment join replaces the
   trimmed ends with the point where the two outer edges actually cross -- the
   mitre.  Both results go into the flat trim arrays (trim_view.ts), which the
   stroker reads when it walks the group.  This was
   SplineDrawer.update_vertex_strokes() and update_stroke_points().

   Bisection, not a formula: the overlap test is a segment-vs-segment crossing
   check over the trimmed outlines, and the trim distance that clears it is
   found by eight halvings of a fixed bracket.  That is why this is worth having
   behind the wasm boundary -- it evaluates the curve some hundreds of times per
   vertex, and it runs for every vertex an edit touches.

   Port notes.  The vector arithmetic is spelled out in doubles, and where the
   original leaned on path.ux's Vector2 the quirks come with it: dot() snaps
   values within 1e-11 of +/-1 to exactly +/-1 (so acos() cannot blow up), and
   normalize() leaves vectors shorter than 1e-8 alone.  Both change results, so
   both are reproduced here rather than written the obvious way.  The two
   predicates that are still called out of util/mathlib.js -- line_isect() and
   line_line_cross4() -- are pure geometry over coordinate pairs; a C++ port
   takes them along. */

import { COLINEAR, line_isect, line_line_cross4 } from "../../util/mathlib.js";
import { add2, dot2, negate2, normalize2 } from "./flat_vec.js";
import { SplineFlags } from "../spline_base.js";
import {
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
import { sceneEvalSide, sceneEvaluate, sceneWidth, segLength } from "./stroker_eval.js";
import { trimClearp, trimGets, trimSets, trimSetp } from "./trim_view.js";

import type { StrokeScene } from "./stroke_scene.js";
import type { TrimView } from "./trim_view.js";

/* One list per function: trimVertex() still holds its order while trimPoints()
   sorts again. */
const vsorted: number[] = [];
const psorted: number[] = [];

/* Scratch for the crossing test and the mitre solve. */
const p1a = [0, 0];
const p1b = [0, 0];
const p2a = [0, 0];
const p2b = [0, 0];

const pts = [
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
];
const dvs = [
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
];

/* Trims every stroke meeting at vertex slot `v` back far enough that none of
   them overlaps another, then sets the mitre points.  The caller decides
   whether joins are wanted at all (FANCY_JOINS) and whether `v` needs redoing. */
export function trimVertex(scene: StrokeScene, trims: TrimView, v: number): void {
  const vo = v * VERT_I;
  const valence = scene.verti[vo + VertI.VALENCE];

  if (valence === 0) {
    return;
  }

  const off = scene.vsegOff[v];

  if (!(scene.verti[vo + VertI.FLAG] & SplineFlags.BREAK_TANGENTS || valence > 2)) {
    for (let i = 0; i < valence; i++) {
      const seg = scene.vsegs[off + i];
      const tslot = trimSlot(scene, seg);
      const v1 = isV1(scene, seg, v);

      trimSets(trims, tslot, v1, 0, v1 ? 0.0 : 1.0);
      trimSets(trims, tslot, v1, 1, v1 ? 0.0 : 1.0);
    }

    return;
  }

  const segs = vsorted;
  const n = sortSegments(scene, v, segs);

  let seglen = 0.0;

  for (let i = 0; i < n; i++) {
    seglen += segLength(scene, segs[i]);
  }

  seglen /= n;

  /* Every stroke pulled back the same distance, in arc length rather than
     parameter, so a short segment is not trimmed away entirely. */
  const setSegments = (s: number) => {
    for (let i = 0; i < n; i++) {
      const seg = segs[i];
      const tslot = trimSlot(scene, seg);
      const v1 = isV1(scene, seg, v);

      let s2 = (s * seglen) / segLength(scene, seg);
      s2 = Math.min(Math.max(s2, 0.0), 1.0);

      trimSets(trims, tslot, v1, 0, v1 ? s2 : 1.0 - s2);
      trimSets(trims, tslot, v1, 1, v1 ? s2 : 1.0 - s2);
    }
  };

  /* Does any stroke's cut end still cross another's? */
  const testIsect = () => {
    for (let i = 0; i < n; i++) {
      const seg1 = segs[i];
      const s1 = trimGets(trims, trimSlot(scene, seg1), isV1(scene, seg1, v), 0);

      for (let j = 0; j < n; j++) {
        const seg2 = segs[j];

        if (seg1 === seg2) continue;

        const s2 = trimGets(trims, trimSlot(scene, seg2), isV1(scene, seg2, v), 0);

        for (let k = 0; k < 8; k++) {
          const side1 = k % 2;
          const side2 = ~~(k / 2);

          sceneEvaluate(scene, seg1, s1, p1a);
          sceneEvalSide(scene, seg1, s1, side1, p1b);

          sceneEvaluate(scene, seg2, s2, p2a);
          sceneEvalSide(scene, seg2, s2, side2, p2b);

          if (line_line_cross4(p1a, p1b, p2a, p2b)) {
            return true;
          }
        }
      }
    }

    return false;
  };

  let a = 0.0;
  let b = 0.65;

  for (let i = 0; i < 8; i++) {
    const s = (a + b) * 0.5;

    setSegments(s);

    if (testIsect()) {
      a = (a + b) * 0.5;
    } else {
      b = (a + b) * 0.5;
    }
  }

  let s = (a + b) * 0.5;
  s = Math.min(Math.max(s, 0.0), 1.0);

  setSegments(s);

  /* Then a little further, by the strokes' own widths: the crossing test walks
     centre lines, and a wide stroke overlaps well before those meet. */
  let w = 0.0;
  let tot = 0.0;

  for (let i = 0; i < n; i++) {
    const seg = segs[i];
    const s1 = trimGets(trims, trimSlot(scene, seg), isV1(scene, seg, v), 0);
    const w2 = sceneWidth(scene, seg, s1);

    w += w2 * 0.1 + scene.segf[seg * SEG_F + SegF.LINEWIDTH2] * 1.0;
    tot++;
  }

  if (tot && w && seglen) {
    w /= tot;

    s += w / seglen;
    s = Math.min(Math.max(s, 0.0), 0.5);

    setSegments(s);
  }

  trimPoints(scene, trims, v);
}

/* Sets the explicit mitre points at `v` for the two-segment case: where the two
   strokes' outer edges actually cross.  Higher valences fall through to the
   plain trim trimVertex() just set. */
function trimPoints(scene: StrokeScene, trims: TrimView, v: number): void {
  const vo = v * VERT_I;
  const valence = scene.verti[vo + VertI.VALENCE];

  if (valence === 2 && !(scene.verti[vo + VertI.FLAG] & SplineFlags.BREAK_TANGENTS)) {
    return;
  }

  const segs = psorted;
  const n = sortSegments(scene, v, segs);

  for (let si = 0; si < n; si++) {
    const seg = segs[si];
    const prev = segs[(si + n - 1) % n];
    const next = segs[(si + 1) % n];

    const tseg = trimSlot(scene, seg);
    const tprev = trimSlot(scene, prev);
    const tnext = trimSlot(scene, next);

    const f0 = isV1(scene, prev, v);
    const f1 = isV1(scene, seg, v);
    const f2 = isV1(scene, next, v);

    const s0a = trimGets(trims, tprev, f0, 0);
    const s0b = trimGets(trims, tprev, f0, 1);

    const s1a = trimGets(trims, tseg, f1, 0);
    const s1b = trimGets(trims, tseg, f1, 1);

    const s2a = trimGets(trims, tnext, f2, 0);
    const s2b = trimGets(trims, tnext, f2, 1);

    /* Both sides of all three segments, as points and boundary tangents. */
    let pa = pts[0],
      pb = pts[1],
      sa = pts[2],
      sb = pts[3],
      na = pts[4],
      nb = pts[5];
    let d0a = dvs[0],
      d0b = dvs[1],
      d1a = dvs[2],
      d1b = dvs[3],
      d2a = dvs[4],
      d2b = dvs[5];

    sceneEvalSide(scene, prev, s0b, 1, pa, d0a);
    sceneEvalSide(scene, prev, s0a, 0, pb, d0b);

    sceneEvalSide(scene, seg, s1a, 0, sa, d1a);
    sceneEvalSide(scene, seg, s1b, 1, sb, d1b);

    sceneEvalSide(scene, next, s2b, 1, na, d2a);
    sceneEvalSide(scene, next, s2a, 0, nb, d2b);

    /* Which side is "outer" flips with the direction the segment leaves `v`. */
    if (f0) {
      let t = pa;
      pa = pb;
      pb = t;
      t = d0a;
      d0a = d0b;
      d0b = t;
      negate2(d0a);
      negate2(d0b);
    }
    if (f1) {
      let t = sa;
      sa = sb;
      sb = t;
      t = d1a;
      d1a = d1b;
      d1b = t;
      negate2(d1a);
      negate2(d1b);
    }
    if (f2) {
      let t = na;
      na = nb;
      nb = t;
      t = d2a;
      d2a = d2b;
      d2b = t;
      negate2(d2a);
      negate2(d2b);
    }

    if (isNaN(dot2(sa[0], sa[1], sa[0], sa[1]))) {
      continue;
    }

    /* Evaluated for its side effects: this refreshes the segment's arc length,
       which its neighbours' widths are read against. */
    sceneEvaluate(scene, seg, s1a, evalscratch);

    if (n !== 2) {
      trimClearp(trims, tseg, f1, 0);
      trimClearp(trims, tseg, f1, 1);
      continue;
    }

    /* A shallow join needs no mitre -- the outer edges barely diverge, and the
       crossing point runs off to infinity. */
    normalize2(d0b);
    normalize2(d1b);
    let doIsect1 = Math.abs(Math.acos(dot2(d0b[0], d0b[1], d1b[0], d1b[1]))) > Math.PI * 0.3;

    normalize2(d0a);
    normalize2(d1a);
    let doIsect2 = Math.abs(Math.acos(dot2(d0a[0], d0a[1], d1a[0], d1a[1]))) > Math.PI * 0.3;

    doIsect1 = doIsect1 && doIsect2;
    doIsect2 = doIsect1;

    /* The tangents become second points on their lines. */
    add2(d0a, pa);
    add2(d0b, pb);
    add2(d1a, sa);
    add2(d1b, sb);
    add2(d2a, na);
    add2(d2b, nb);

    if (doIsect1) {
      setIsect(scene, trims, tseg, f1, 1, v, pb, d0b, sb, d1b);
    } else {
      trimClearp(trims, tseg, f1, 1);
      trimSets(trims, tseg, f1, 1, f1 ? 0.0 : 1.0);
    }

    if (doIsect2) {
      setIsect(scene, trims, tseg, f1, 0, v, pa, d0a, sa, d1a);
    } else {
      trimClearp(trims, tseg, f1, 0);
      trimSets(trims, tseg, f1, 0, f1 ? 0.0 : 1.0);
    }
  }
}

const evalscratch = [0, 0];

/* Where the two outer edges cross, floored to whole units as the original did;
   colinear edges fall back to the vertex itself. */
function setIsect(
  scene: StrokeScene,
  trims: TrimView,
  tseg: number,
  v1: boolean,
  side: number,
  v: number,
  a1: number[],
  a2: number[],
  b1: number[],
  b2: number[]
): void {
  const isect = line_isect(a1, a2, b1, b2);

  if (isect[1] === COLINEAR) {
    const o = v * VERT_F;

    trimSetp(trims, tseg, v1, side, scene.vertf[o + VertF.X], scene.vertf[o + VertF.Y]);
    return;
  }

  trimSetp(trims, tseg, v1, side, Math.floor(isect[0][0]), Math.floor(isect[0][1]));
}

function trimSlot(scene: StrokeScene, seg: number): number {
  return scene.segi[seg * SEG_I + SegI.TRIM];
}

function isV1(scene: StrokeScene, seg: number, v: number): boolean {
  return scene.segi[seg * SEG_I + SegI.V1] === v;
}
