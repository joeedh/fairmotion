/* Width chains -- the topology behind SplineSegment.width(), resolved once per
   draw pass instead of once per call.

   width() evaluates stroke width at `s` as a cubic B-spline through the width
   samples of a nine-vertex neighbourhood, so width stays smooth across joins.
   To gather that neighbourhood it walks outward through 2-valence vertices,
   four segments each way.  The walk is pure topology, and topology does not
   change inside a draw pass -- but the numbers it collects do, so only the walk
   is cached.  One evaluateSide() costs six width() calls, and a stroked
   boundary sample paid forty-eight walk steps to feed nine deBoors.

   The neighbourhood the walk traverses is a *chain*: the maximal run of
   segments joined at 2-valence vertices.  It is strictly coarser than a
   SplineStrokeGroup -- a group can end at a 2-valence vertex (material change,
   linewidth change, and the rest of vertexIsSplit's reasons) and the walk
   crosses that boundary regardless.  Nothing else in the code names this
   object; see docs/plans/draw-refactor-plan-final-notes.md P3.

   Layout.  One slot per segment; the seven walk steps that reach a value or a
   length the net needs are stored as a segment slot plus a flag saying which
   end of that segment the walk arrived at:

     stepSeg[slot*7 .. +7)  slot of the segment each step landed on
     stepV1 [slot*7 .. +7)  1 if the vertex it landed on is that segment's v1
     slotSegs[slot]         the segment itself

   Steps 0..2 run backward from the segment's own v1 (their lengths are l2, l1
   and l0; only the first one's value is used), steps 3..6 run forward from its
   own v2 (values w5..w8, lengths l5..l7).  l3 and l8 are gathered by the walk
   and never read, so they are not stored.

   Lifetime.  The set is built at the top of SplineDrawer.update() and dropped
   when that call returns, so there is no invalidation protocol: outside a pass
   there is no cache to go stale, and calls made outside one (picking, tools)
   fall through to the walk, which stays as the reference implementation.

   Why topology only.  Segment arc length lives in ks[KSCALE] and is recomputed
   from the vertex coordinates by eval_curve(), which the drawer calls as it
   evaluates each segment -- so lengths *do* change mid-pass, and they are
   frankly stale at its start after a load or during a drag.  Caching the knot
   vector was measurably wrong there (knots off by a percent mid-drag); caching
   the walk and reading w1/w2/shift/length/linewidth live at width() time is
   bit-identical to the walk by construction, whatever the drawer has done to
   the geometry so far.

   Expression order below is copied from width() deliberately -- `-l0 - l1 - l2`
   rather than `-(l0 + l1 + l2)` -- because float addition is not associative
   and the point of this pass is that nothing downstream can tell the
   difference. */

import type { Spline } from "../spline.js";
import type { SplineSegment, SplineVertex } from "../spline_types.js";

const STEPS = 7;

/* Scratch the evaluator reads.  deBoor takes plain arrays and consults
   knots.length, so the net is built into these rather than viewed through a
   subarray. */
export const netKnots: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
export const netWidths: number[] = [0, 0, 0, 0, 0, 0, 0];
export const netShifts: number[] = [0, 0, 0, 0, 0, 0, 0];

let active = false;
let gencount = 0;

let slotSegs: SplineSegment[] = [];
let stepSeg = new Int32Array(0);
let stepV1 = new Uint8Array(0);

/* Per-chain scratch, grown on demand and reused across chains and passes. */
let chainSegs: SplineSegment[] = [];
let chainVerts: SplineVertex[] = [];
let chainCyclic = false;
let segTotal = 0;
let cFwd = new Uint8Array(0);

const backSeg = [0, 0, 0];
const backV1 = [0, 0, 0];
const fwdSeg = [0, 0, 0, 0];
const fwdV1 = [0, 0, 0, 0];

/* A chain can be a cycle, in which case it has no ends to clamp against and
   the walk wraps forever; index arithmetic is modular there. */
function imod(i: number, n: number): number {
  return ((i % n) + n) % n;
}

/* Walks out from `seg0` to one end of its chain, then back along the whole run,
   filling chainSegs/chainVerts.  chainVerts[i] and chainVerts[i+1] are the ends
   of chainSegs[i]; for a cycle chainVerts[n] is chainVerts[0] again.

   Returns the segment count, negative if the chain is degenerate (a segment
   that closes on itself, a two-vertex loop, a topology error) -- those keep the
   walk instead of a net. */
function gatherChain(seg0: SplineSegment): number {
  const total = segTotal;
  let cyclic = false;

  chainCyclic = false;

  let seg = seg0;
  let v: SplineVertex = seg0.v1;

  for (let guard = 0; v.segments.length === 2; guard++) {
    if (guard > total) {
      return -1;
    }

    const prev = v.other_segment(seg);

    if (prev === seg) {
      return -1;
    }
    if (prev === seg0) {
      cyclic = true;
      break;
    }

    seg = prev;
    v = seg.other_vert(v);
  }

  let n = 0;

  if (cyclic) {
    let cur = seg0;
    let cv: SplineVertex = seg0.v1;

    do {
      chainSegs[n] = cur;
      chainVerts[n] = cv;
      n++;

      if (n > total) {
        return -1;
      }

      cv = cur.other_vert(cv);
      cur = cv.other_segment(cur);
    } while (cur !== seg0);

    chainVerts[n] = chainVerts[0];
    chainCyclic = true;

    /* A two-vertex cycle leaves "which end of the segment is this?" ambiguous
       under the modular indexing below. */
    return n < 2 ? -1 : n;
  }

  let cur = seg;
  let cv = v;

  for (;;) {
    chainSegs[n] = cur;
    chainVerts[n] = cv;
    n++;

    if (n > total) {
      return -1;
    }

    cv = cur.other_vert(cv);
    chainVerts[n] = cv;

    if (cv.segments.length !== 2) {
      break;
    }

    const next = cv.other_segment(cur);

    if (next === cur) {
      return -1;
    }

    cur = next;
  }

  return n;
}

/* One walk() run, unrolled over the chain arrays: `steps` hops from vertex `p`
   in direction `dir`, recording which segment the hop crossed and which of its
   ends it arrived at.  At an open chain's end the hop does not happen and the
   previous segment and vertex repeat, which is what walk()'s
   `if (v.segments.length === 2)` does. */
function stepOut(
  p: number,
  dir: number,
  segIdx: number,
  n: number,
  cyclic: boolean,
  steps: number,
  outSeg: number[],
  outV1: number[]
) {
  let sj = segIdx;

  for (let k = 0; k < steps; k++) {
    if (cyclic) {
      sj = imod(dir > 0 ? p : p - 1, n);
      p += dir;
    } else if (dir > 0 ? p < n : p > 0) {
      sj = dir > 0 ? p : p - 1;
      p += dir;
    }

    /* chainVerts[sj] is the segment's low end; whether that is its v1 depends
       on how it sits in the chain. */
    const low = (cyclic ? imod(p, n) : p) === sj;

    outSeg[k] = sj;
    outV1[k] = low === (cFwd[sj] === 1) ? 1 : 0;
  }
}

/* Records the walk for every segment of the gathered chain.  Returns the next
   free slot. */
function fillChain(slotStart: number, n: number, cyclic: boolean): number {
  for (let j = 0; j < n; j++) {
    cFwd[j] = chainSegs[j].v1 === chainVerts[j] ? 1 : 0;
  }

  for (let j = 0; j < n; j++) {
    const fwd = cFwd[j] === 1;
    const slot = slotStart + j;

    /* The walk starts at the segment's own v1 going one way and its v2 going
       the other; which chain direction that is depends on how the segment is
       oriented within the chain. */
    stepOut(fwd ? j : j + 1, fwd ? -1 : 1, j, n, cyclic, 3, backSeg, backV1);
    stepOut(fwd ? j + 1 : j, fwd ? 1 : -1, j, n, cyclic, 4, fwdSeg, fwdV1);

    const so = slot * STEPS;

    for (let k = 0; k < 3; k++) {
      stepSeg[so + k] = slotStart + backSeg[k];
      stepV1[so + k] = backV1[k];
    }
    for (let k = 0; k < 4; k++) {
      stepSeg[so + 3 + k] = slotStart + fwdSeg[k];
      stepV1[so + 3 + k] = fwdV1[k];
    }

    slotSegs[slot] = chainSegs[j];
    chainSegs[j]._widthSlot = slot;
    chainSegs[j]._widthGen = gencount;
  }

  return slotStart + n;
}

/* Resolves the walk for every chain in `spline` and makes it the set width()
   reads.  Call endWidthChains() when the pass is done. */
export function beginWidthChains(spline: Spline) {
  const segs = spline.segments;
  const total = segs.length;

  if (stepSeg.length < total * STEPS) {
    let cap = 64;
    while (cap < total) {
      cap *= 2;
    }

    stepSeg = new Int32Array(cap * STEPS);
    stepV1 = new Uint8Array(cap * STEPS);
    cFwd = new Uint8Array(cap + 1);
  }

  gencount++;
  active = true;

  segTotal = total;
  slotSegs.length = total;
  chainSegs.length = total;
  chainVerts.length = total + 1;

  let slot = 0;

  for (const seg of segs) {
    if (seg._widthGen === gencount) {
      continue;
    }

    const n = gatherChain(seg);

    if (n < 0) {
      /* Degenerate: mark it seen with no net so it is not walked again this
         pass, and let width() fall back. */
      seg._widthSlot = -1;
      seg._widthGen = gencount;
      continue;
    }

    slot = fillChain(slot, n, chainCyclic);
  }
}

export function endWidthChains() {
  active = false;
}

/* Whether a chain set is live right now, so a nested user can borrow the
   caller's rather than begin one and end it out from under them. */
export function widthChainsActive(): boolean {
  return active;
}

/* The walk recorded for one segment, as segments rather than slots: which
   segment each of the seven steps landed on, and whether the vertex it arrived
   at is that segment's v1.  This is the topology StrokeScene keeps; the numbers
   it gathers stay live.  Scratch, valid until the next call. */
export const netStepSegs: SplineSegment[] = [];
export const netStepV1 = new Uint8Array(STEPS);

/* Fills netStepSegs/netStepV1 for `seg`.  False when there is no record for it
   -- outside a pass, or a degenerate chain -- and the caller must walk. */
export function widthNetSteps(seg: SplineSegment): boolean {
  if (!active || seg._widthGen !== gencount || seg._widthSlot < 0) {
    return false;
  }

  const so = seg._widthSlot * STEPS;

  for (let k = 0; k < STEPS; k++) {
    netStepSegs[k] = slotSegs[stepSeg[so + k]];
    netStepV1[k] = stepV1[so + k];
  }

  return true;
}

/* Reads one recorded walk step: writes its width and shift into the net at
   `oi` when that value is used, and returns its clamped length. */
function loadStep(i: number, oi: number): number {
  const seg = slotSegs[stepSeg[i]];

  if (oi >= 0) {
    const v1 = stepV1[i] === 1;

    netWidths[oi] = (v1 ? seg.w1 : seg.w2) * seg.mat.linewidth;
    netShifts[oi] = v1 ? seg.shift1 : seg.shift2;
  }

  return Math.max(seg.length, 0.0001);
}

/* Builds `seg`'s net into netKnots/netWidths/netShifts from the walk recorded
   for it, and returns its own clamped length -- or -1 when there is no record
   for it and the caller should walk. */
export function loadWidthNet(seg: SplineSegment): number {
  if (!active || seg._widthGen !== gencount) {
    return -1;
  }

  const slot = seg._widthSlot;

  if (slot < 0) {
    return -1;
  }

  const so = slot * STEPS;

  const l2 = loadStep(so, 0);
  const l1 = loadStep(so + 1, -1);
  const l0 = loadStep(so + 2, -1);

  const l5 = loadStep(so + 3, 3);
  const l6 = loadStep(so + 4, 4);
  const l7 = loadStep(so + 5, 5);
  loadStep(so + 6, 6);

  const lw = seg.mat.linewidth;
  const l4 = Math.max(seg.length, 0.0001);

  netWidths[1] = seg.w1 * lw;
  netShifts[1] = seg.shift1;
  netWidths[2] = seg.w2 * lw;
  netShifts[2] = seg.shift2;

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
