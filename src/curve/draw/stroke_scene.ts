/* StrokeScene -- everything the stroker needs about a Spline, in flat arrays.

   This is the data boundary stage 4 of the draw refactor exists to create: the
   stroker reads only what is here, so the same code can run against a wasm heap
   with no Spline on the other side of it.  See docs/plans/draw-refactor-plan-final-notes.md §3.

   Persistent, not per-frame.  Slots are stable across passes -- a segment keeps
   its index until it is deleted -- because dirty tracking and every downstream
   index (chains, junctions, groups) is meaningless otherwise.  Deleted slots go
   on a free list; nothing compacts.

   What is stored and what is not.  Values that move with an edit are stored:
   vertex coordinates, the four per-segment width and shift parameters, the
   material's linewidth.  Two things are deliberately *not*:

   - **Arc length.**  It lives in `ks[KSCALE]` and is rewritten by eval_curve()
     as the drawer evaluates each segment, so it changes during a pass and is
     stale at the start of one (after a load, or mid-drag).  The scene points at
     `ks` and reads the length through it, which is what width() does today; see
     the same argument in width_chain.ts.
   - **The width net's knot vector**, for the same reason: it is built from
     neighbour lengths at evaluation time.  What the scene holds is the *walk* --
     which seven segments the net gathers and which end of each -- because that
     is topology, and topology is what is expensive to rediscover.

   Cost per pass is therefore a coordinate copy per vertex and five doubles per
   segment.  The width walk, the expensive part, is rebuilt only when topology
   changed.  That is the shape the plan asks for: incrementally patched, not
   repopulated.

   `ks` itself.  Segments that have been evaluated natively have their `ks`
   permanently relocated into the wasm heap (native_api.checkSegment), so the
   scene stores both the pointer -- what C++ will read -- and the JS view onto
   the same bytes.  The view is the one object reference in here, and it is data
   rather than graph: heap residency is conditional today (§5.1), and a plain
   Float64Array is what the fallback has instead of an address. */

import * as native_api from "../../wasm/native_api.js";
import {
  EMPTY_F64,
  EMPTY_I32,
  EMPTY_U8,
  ensureI32,
  growF64,
  growI32,
  growU8,
  reviewF64,
  reviewI32,
  reviewU8,
} from "../../wasm/heap_arrays.js";
import { KSCALE, KTOTKS, useNativeEval } from "../spline_math.js";
import {
  beginWidthChains,
  endWidthChains,
  netStepSegs,
  netStepV1,
  widthChainsActive,
  widthNetSteps,
} from "./width_chain.js";

import type { HeapF64, HeapI32, HeapU8 } from "../../wasm/heap_arrays.js";
import type { Spline } from "../spline.js";
import type { SplineSegment } from "../spline_types.js";
import type { TrimState } from "./trim_state.js";

/* Per-vertex doubles: x, y, z.  The app is 2d and z is always zero, but the
   evaluator's fallback takes a 3d length, so carrying it keeps that arithmetic
   identical rather than assumed. */
export const VERT_F = 3;
/* Per-vertex ints: eid, flag, valence. */
export const VERT_I = 3;

/* Per-segment doubles: w1, w2, shift1, shift2, linewidth, linewidth2. */
export const SEG_F = 6;
/* Per-segment ints: eid, flag, v1 slot, v2 slot, ks pointer (0 if none), trim
   slot (see trim_state.ts; -1 before this segment's first pass). */
export const SEG_I = 6;

/* Steps in a width net's walk; see width_chain.ts for what each one is. */
export const NET_STEPS = 7;

export const enum VertF {
  X = 0,
  Y = 1,
  Z = 2,
}

export const enum VertI {
  EID = 0,
  FLAG = 1,
  VALENCE = 2,
}

export const enum SegF {
  W1 = 0,
  W2 = 1,
  SHIFT1 = 2,
  SHIFT2 = 3,
  LINEWIDTH = 4,
  /* The double stroke's width; only the trimming reads it. */
  LINEWIDTH2 = 5,
}

export const enum SegI {
  EID = 0,
  FLAG = 1,
  V1 = 2,
  V2 = 3,
  KSPTR = 4,
  TRIM = 5,
}

/* Per-group ints: the group's id -- its half of a path key -- and the half-open
   range of groupSegs holding its segment slots, in walk order. */
export const GROUP_I = 3;

export const enum GroupI {
  ID = 0,
  SEG0 = 1,
  SEG1 = 2,
}

/* A slot that never existed. */
export const NO_SLOT = -1;

export class StrokeScene {
  /* Slot capacity, not live count; slots below this may be free. */
  vertMax = 0;
  segMax = 0;

  vertf: HeapF64 = EMPTY_F64;
  verti: HeapI32 = EMPTY_I32;
  segf: HeapF64 = EMPTY_F64;
  segi: HeapI32 = EMPTY_I32;

  /* One view per segment slot onto that segment's sixteen coefficients --
     wasm heap memory when it has been evaluated natively. */
  ksv: (Float64Array | number[])[] = [];

  /* The width net's walk: for each of the seven steps, the segment slot it
     landed on and whether the vertex it arrived at is that segment's v1.  A
     segment whose chain is degenerate (see width_chain.gatherChain) has
     netSeg[.] === NO_SLOT and falls back to the walk. */
  netSeg: HeapI32 = EMPTY_I32;
  netV1: HeapU8 = EMPTY_U8;

  /* The stroke groups the drawer walks, in spline.drawStrokeGroups order, and
     the segment slots they run through.  Rebuilt whole every pass: a group is a
     handful of ints and the spline rebuilds the groups themselves whenever
     anything about them can have changed. */
  groups: HeapI32 = EMPTY_I32;
  groupSegs: HeapI32 = EMPTY_I32;
  groupCount = 0;
  groupMap = new Map<number, number>();

  /* Vertex -> segment adjacency: the segments meeting at vertex slot `v` are
     vsegs[vsegOff[v] .. vsegOff[v] + valence).  The stroker needs it to step
     across a two-valence join; rebuilt only when topology moves. */
  vsegOff: HeapI32 = EMPTY_I32;
  vsegs: HeapI32 = EMPTY_I32;

  vertMap = new Map<number, number>();
  segMap = new Map<number, number>();

  /* Pass number a slot was last seen in; older means deleted. */
  vertStamp: HeapI32 = EMPTY_I32;
  segStamp: HeapI32 = EMPTY_I32;

  vertFree: number[] = [];
  segFree: number[] = [];

  vertCount = 0;
  segCount = 0;

  /* Bumped by begin(); slots stamped with an older one are swept. */
  gen = 0;

  /* Set by the last begin() when the width walk had to be rebuilt, which is
     also what says every derived index downstream is stale. */
  topoChanged = true;

  private ensureVertCap(n: number) {
    if (n <= this.vertMax) {
      return;
    }

    let cap = Math.max(64, this.vertMax);
    while (cap < n) {
      cap *= 2;
    }

    this.vertf = growF64(this.vertf, cap * VERT_F);
    this.verti = growI32(this.verti, cap * VERT_I);
    this.vertStamp = growI32(this.vertStamp, cap);
    this.vertMax = cap;
  }

  private ensureSegCap(n: number) {
    if (n <= this.segMax) {
      return;
    }

    let cap = Math.max(64, this.segMax);
    while (cap < n) {
      cap *= 2;
    }

    this.segf = growF64(this.segf, cap * SEG_F);
    this.segi = growI32(this.segi, cap * SEG_I);
    this.segStamp = growI32(this.segStamp, cap);
    this.netSeg = growI32(this.netSeg, cap * NET_STEPS);
    this.netV1 = growU8(this.netV1, cap * NET_STEPS);
    this.ksv.length = cap;
    this.segMax = cap;
  }

  private newVertSlot(): number {
    const reuse = this.vertFree.pop();

    if (reuse !== undefined) {
      return reuse;
    }

    this.ensureVertCap(this.vertCount + 1);
    return this.vertCount;
  }

  private newSegSlot(): number {
    const reuse = this.segFree.pop();

    if (reuse !== undefined) {
      return reuse;
    }

    this.ensureSegCap(this.segCount + 1);
    return this.segCount;
  }

  vertSlot(eid: number): number {
    const slot = this.vertMap.get(eid);
    return slot === undefined ? NO_SLOT : slot;
  }

  segSlot(eid: number): number {
    const slot = this.segMap.get(eid);
    return slot === undefined ? NO_SLOT : slot;
  }

  /* Arc length as the stroker must read it: live from the coefficients, never
     from a copy the scene took. */
  segLength(slot: number): number {
    return this.ksv[slot][KSCALE];
  }

  /* Rebuilds the flat arrays from `spline`, patching what changed.  Returns the
     scene so a caller can chain. */
  begin(spline: Spline, trims?: TrimState): StrokeScene {
    this.gen++;

    const gen = this.gen;
    let topo = false;
    let seen = 0;

    for (const v of spline.verts) {
      let slot = this.vertMap.get(v.eid);

      if (slot === undefined) {
        slot = this.newVertSlot();

        if (slot === this.vertCount) {
          this.vertCount++;
        }

        this.vertMap.set(v.eid, slot);
        topo = true;
      }

      this.vertStamp[slot] = gen;
      seen++;

      const fo = slot * VERT_F;
      const io = slot * VERT_I;

      this.vertf[fo + VertF.X] = v[0];
      this.vertf[fo + VertF.Y] = v[1];
      this.vertf[fo + VertF.Z] = v[2];
      this.verti[io + VertI.EID] = v.eid;
      this.verti[io + VertI.FLAG] = v.flag;

      if (this.verti[io + VertI.VALENCE] !== v.segments.length) {
        this.verti[io + VertI.VALENCE] = v.segments.length;
        topo = true;
      }
    }

    if (seen !== this.vertMap.size) {
      this.sweepVerts(gen);
    }

    seen = 0;

    for (const seg of spline.segments) {
      let slot = this.segMap.get(seg.eid);

      if (slot === undefined) {
        slot = this.newSegSlot();

        if (slot === this.segCount) {
          this.segCount++;
        }

        this.segMap.set(seg.eid, slot);
        topo = true;
      }

      this.segStamp[slot] = gen;
      seen++;

      if (this.patchSeg(slot, seg, trims)) {
        topo = true;
      }
    }

    if (seen !== this.segMap.size) {
      this.sweepSegs(gen);
      topo = true;
    }

    if (topo) {
      this.buildNets(spline);
      this.buildAdjacency(spline);
    }

    this.buildGroups(spline);

    this.topoChanged = topo;
    return this;
  }

  /* Copies the values that move with an edit.  Returns true if the segment's
     endpoints changed, which is a topology change like any other. */
  private patchSeg(slot: number, seg: SplineSegment, trims?: TrimState): boolean {
    const fo = slot * SEG_F;
    const io = slot * SEG_I;

    this.segf[fo + SegF.W1] = seg.w1;
    this.segf[fo + SegF.W2] = seg.w2;
    this.segf[fo + SegF.SHIFT1] = seg.shift1;
    this.segf[fo + SegF.SHIFT2] = seg.shift2;
    this.segf[fo + SegF.LINEWIDTH] = seg.mat.linewidth;
    this.segf[fo + SegF.LINEWIDTH2] = seg.mat.linewidth2;

    this.segi[io + SegI.EID] = seg.eid;
    this.segi[io + SegI.FLAG] = seg.flag;

    /* The trim slot is stamped by TrimState.begin(), which the drawer runs
       before this; a segment made since then has none and reads the untrimmed
       defaults, exactly as the graph-side accessors do. */
    this.segi[io + SegI.TRIM] = trims ? trims.trimSlot(seg) : NO_SLOT;

    /* §5.1: heap residency is conditional -- `ks` is relocated the first time a
       segment is evaluated or solved natively, and until then it has no address
       at all.  Migrating here rather than assuming is what the constraint asks
       for; without it the scene spends a whole pass pointing at a plain array
       the drawer has already replaced. */
    if (useNativeEval()) {
      native_api.checkSegment(seg);
    }

    /* `ks` is replaced, not written through, by that migration and by a heap
       move -- so re-read the view every pass rather than caching one. */
    this.ksv[slot] = seg.ks;
    this.segi[io + SegI.KSPTR] = seg.ks.ptr ?? 0;

    const v1 = this.vertMap.get(seg.v1.eid);
    const v2 = this.vertMap.get(seg.v2.eid);

    /* A segment whose vertices are not in the spline's vertex list is a
       corrupt document, not a case to model; NO_SLOT keeps it inert. */
    const s1 = v1 === undefined ? NO_SLOT : v1;
    const s2 = v2 === undefined ? NO_SLOT : v2;

    if (this.segi[io + SegI.V1] === s1 && this.segi[io + SegI.V2] === s2) {
      return false;
    }

    this.segi[io + SegI.V1] = s1;
    this.segi[io + SegI.V2] = s2;
    return true;
  }

  /* Growing the wasm heap detaches every view onto it, and the scene's views
     outlive the pass that took them.  Addresses survive the move, so rebuilding
     from the pointer is enough; native_api calls this from checkHeap().

     segi first, and not in the loop below: the pointers the loop reads live in
     it, so a detached segi would answer every one of them with undefined. */
  reviewHeapViews() {
    this.segi = reviewI32(this.segi);

    this.vertf = reviewF64(this.vertf);
    this.verti = reviewI32(this.verti);
    this.segf = reviewF64(this.segf);
    this.netSeg = reviewI32(this.netSeg);
    this.netV1 = reviewU8(this.netV1);
    this.groups = reviewI32(this.groups);
    this.groupSegs = reviewI32(this.groupSegs);
    this.vsegOff = reviewI32(this.vsegOff);
    this.vsegs = reviewI32(this.vsegs);
    this.vertStamp = reviewI32(this.vertStamp);
    this.segStamp = reviewI32(this.segStamp);

    for (const slot of this.segMap.values()) {
      const ptr = this.segi[slot * SEG_I + SegI.KSPTR];

      if (ptr !== 0) {
        this.ksv[slot] = native_api.viewKs(ptr);
      }
    }
  }

  private sweepVerts(gen: number) {
    for (const [eid, slot] of this.vertMap) {
      if (this.vertStamp[slot] === gen) {
        continue;
      }

      this.vertMap.delete(eid);
      this.vertFree.push(slot);
      this.verti[slot * VERT_I + VertI.EID] = -1;
    }
  }

  private sweepSegs(gen: number) {
    for (const [eid, slot] of this.segMap) {
      if (this.segStamp[slot] === gen) {
        continue;
      }

      this.segMap.delete(eid);
      this.segFree.push(slot);
      this.segi[slot * SEG_I + SegI.EID] = -1;
      this.ksv[slot] = EMPTY_KS;
    }
  }

  /* Vertex -> segment adjacency, in the vertices' own order, so the stroker can
     step across a join without the graph.  Valence is already extracted, so
     this is one counting pass and one filling pass. */
  private buildAdjacency(spline: Spline) {
    this.vsegOff = ensureI32(this.vsegOff, this.vertMax);

    let total = 0;

    for (const v of spline.verts) {
      const slot = this.vertMap.get(v.eid)!;

      this.vsegOff[slot] = total;
      total += v.segments.length;
    }

    this.vsegs = ensureI32(this.vsegs, total);

    for (const v of spline.verts) {
      const slot = this.vertMap.get(v.eid)!;
      let o = this.vsegOff[slot];

      for (const seg of v.segments) {
        const s = this.segMap.get(seg.eid);
        this.vsegs[o++] = s === undefined ? NO_SLOT : s;
      }
    }
  }

  /* The drawlist's stroke groups, flattened.  Not topology-gated: the spline
     rebuilds drawStrokeGroups when visibility changes as well as when the
     shape does, and this is cheap enough that tracking that is not worth it. */
  private buildGroups(spline: Spline) {
    const gs = spline.drawStrokeGroups;

    this.groups = ensureI32(this.groups, gs.length * GROUP_I);

    let total = 0;

    for (const g of gs) {
      total += g.segments.length;
    }

    this.groupSegs = ensureI32(this.groupSegs, total);

    this.groupMap.clear();
    this.groupCount = 0;

    let o = 0;

    for (const g of gs) {
      const gi = this.groupCount++;
      const go = gi * GROUP_I;

      this.groups[go + GroupI.ID] = g.id;
      this.groups[go + GroupI.SEG0] = o;

      for (const seg of g.segments) {
        const s = this.segMap.get(seg.eid);
        this.groupSegs[o++] = s === undefined ? NO_SLOT : s;
      }

      this.groups[go + GroupI.SEG1] = o;
      this.groupMap.set(g.id, gi);
    }
  }

  /* Records every segment's width walk, in slot terms.  width_chain.ts does the
     same walk against the live graph and is the reference for it; this runs
     only when topology changed, so it is not on the per-frame path. */
  private buildNets(spline: Spline) {
    /* Borrow the drawer's chain set when there is one: ending a pass we did not
       begin would drop the cache out from under the rest of it. */
    const borrowed = widthChainsActive();

    if (!borrowed) {
      beginWidthChains(spline);
    }

    for (const seg of spline.segments) {
      const slot = this.segMap.get(seg.eid)!;
      const off = slot * NET_STEPS;
      if (!widthNetSteps(seg)) {
        for (let k = 0; k < NET_STEPS; k++) {
          this.netSeg[off + k] = NO_SLOT;
          this.netV1[off + k] = 0;
        }

        continue;
      }

      for (let k = 0; k < NET_STEPS; k++) {
        const nseg = netStepSegs[k];
        const nslot = nseg === undefined ? undefined : this.segMap.get(nseg.eid);

        this.netSeg[off + k] = nslot === undefined ? NO_SLOT : nslot;
        this.netV1[off + k] = netStepV1[k];
      }
    }

    if (!borrowed) {
      endWidthChains();
    }
  }
}

/* The segments meeting at vertex slot `v`, in angular order around it, written
   into `out`; returns how many there are.  This was SplineDrawer._sortSegments()
   and it is still a comparison sort over atan2 -- the trimmer and the join both
   index off the order, so it has to be the same order. */
export function sortSegments(scene: StrokeScene, v: number, out: number[]): number {
  const n = scene.verti[v * VERT_I + VertI.VALENCE];
  const off = scene.vsegOff[v];

  const vx = scene.vertf[v * VERT_F + VertF.X];
  const vy = scene.vertf[v * VERT_F + VertF.Y];

  out.length = 0;

  for (let i = 0; i < n; i++) {
    out.push(scene.vsegs[off + i]);
  }

  out.sort((a, b) => {
    const oa = otherVert(scene, a, v) * VERT_F;
    const ob = otherVert(scene, b, v) * VERT_F;

    const dx1 = scene.vertf[oa + VertF.X] - vx;
    const dy1 = scene.vertf[oa + VertF.Y] - vy;
    const dx2 = scene.vertf[ob + VertF.X] - vx;
    const dy2 = scene.vertf[ob + VertF.Y] - vy;

    return Math.atan2(dy1, dx1) - Math.atan2(dy2, dx2);
  });

  return out.length;
}

/* The far end of `seg` from vertex slot `v`. */
export function otherVert(scene: StrokeScene, seg: number, v: number): number {
  const v1 = scene.segi[seg * SEG_I + SegI.V1];
  return v === v1 ? scene.segi[seg * SEG_I + SegI.V2] : v1;
}

const EMPTY_KS = new Float64Array(KTOTKS);

/* Every spline that has been drawn keeps its scene; the drawer is per-spline
   too, but the scene outlives any one drawer instance. */
const scenes = new WeakMap<Spline, StrokeScene>();

export function strokeScene(spline: Spline): StrokeScene {
  let scene = scenes.get(spline);

  if (scene === undefined) {
    scene = new StrokeScene();
    scenes.set(spline, scene);

    /* Held weakly there, so this does not outlive the spline. */
    native_api.onHeapMove(scene);
  }

  return scene;
}

/* The eid -> slot map and the free list are the part of this most likely to
   develop bugs -- the plan says so in as many words -- so here is what they are
   supposed to satisfy, checkable against the spline they came from.  Returns
   one string per violation.  Not on any hot path: this is for the spec and for
   a console call when something looks wrong. */
export function checkScene(scene: StrokeScene, spline: Spline): string[] {
  const bad: string[] = [];
  const say = (msg: string) => {
    if (bad.length < 32) {
      bad.push(msg);
    }
  };

  const liveVerts = new Set<number>();
  const liveSegs = new Set<number>();

  for (const v of spline.verts) {
    const slot = scene.vertSlot(v.eid);
    liveVerts.add(slot);

    if (slot === NO_SLOT) {
      say(`vert ${v.eid} has no slot`);
      continue;
    }

    if (scene.verti[slot * VERT_I + VertI.EID] !== v.eid) {
      say(`vert ${v.eid} slot ${slot} holds eid ${scene.verti[slot * VERT_I + VertI.EID]}`);
    }
    if (
      scene.vertf[slot * VERT_F + VertF.X] !== v[0] ||
      scene.vertf[slot * VERT_F + VertF.Y] !== v[1] ||
      scene.vertf[slot * VERT_F + VertF.Z] !== v[2]
    ) {
      say(`vert ${v.eid} coordinates are stale`);
    }
    if (scene.verti[slot * VERT_I + VertI.VALENCE] !== v.segments.length) {
      say(`vert ${v.eid} valence is stale`);
    }
    /* Flags are not checked, here or for segments.  The scene copies them at
       extract and the drawer clears them as it consumes them, so the two agree
       only until the pass gets going -- a snapshot, not an invariant. */
  }

  if (liveVerts.size !== spline.verts.length) {
    say(`${spline.verts.length} verts share ${liveVerts.size} slots`);
  }
  if (scene.vertMap.size !== spline.verts.length) {
    say(`vertMap holds ${scene.vertMap.size} of ${spline.verts.length} verts`);
  }

  for (const seg of spline.segments) {
    const slot = scene.segSlot(seg.eid);
    liveSegs.add(slot);

    if (slot === NO_SLOT) {
      say(`segment ${seg.eid} has no slot`);
      continue;
    }

    const fo = slot * SEG_F;
    const io = slot * SEG_I;

    if (scene.segi[io + SegI.EID] !== seg.eid) {
      say(`segment ${seg.eid} slot ${slot} holds eid ${scene.segi[io + SegI.EID]}`);
    }
    if (scene.segi[io + SegI.V1] !== scene.vertSlot(seg.v1.eid)) {
      say(`segment ${seg.eid} v1 slot is stale`);
    }
    if (scene.segi[io + SegI.V2] !== scene.vertSlot(seg.v2.eid)) {
      say(`segment ${seg.eid} v2 slot is stale`);
    }
    /* Same bytes, which for a heap-resident ks means the same address -- the
       views themselves are rebuilt independently whenever the heap moves. */
    const ptr = seg.ks.ptr ?? 0;

    if (scene.segi[io + SegI.KSPTR] !== ptr) {
      say(`segment ${seg.eid} ks pointer is stale`);
    }
    if (ptr === 0 && scene.ksv[slot] !== seg.ks) {
      say(`segment ${seg.eid} points at a different ks`);
    }
    if (ptr === 0 && useNativeEval()) {
      say(`segment ${seg.eid} was never migrated into the heap`);
    }
    if (scene.segLength(slot) !== seg.length) {
      say(`segment ${seg.eid} length disagrees with ks[KSCALE]`);
    }
    if (
      scene.segf[fo + SegF.W1] !== seg.w1 ||
      scene.segf[fo + SegF.W2] !== seg.w2 ||
      scene.segf[fo + SegF.SHIFT1] !== seg.shift1 ||
      scene.segf[fo + SegF.SHIFT2] !== seg.shift2 ||
      scene.segf[fo + SegF.LINEWIDTH] !== seg.mat.linewidth ||
      scene.segf[fo + SegF.LINEWIDTH2] !== seg.mat.linewidth2
    ) {
      say(`segment ${seg.eid} width parameters are stale`);
    }
  }

  if (liveSegs.size !== spline.segments.length) {
    say(`${spline.segments.length} segments share ${liveSegs.size} slots`);
  }
  if (scene.segMap.size !== spline.segments.length) {
    say(`segMap holds ${scene.segMap.size} of ${spline.segments.length} segments`);
  }

  for (const slot of scene.vertFree) {
    if (liveVerts.has(slot)) {
      say(`vert slot ${slot} is both free and live`);
    }
  }
  for (const slot of scene.segFree) {
    if (liveSegs.has(slot)) {
      say(`segment slot ${slot} is both free and live`);
    }
  }

  /* The recorded walk against a freshly resolved one. */
  const borrowed = widthChainsActive();

  if (!borrowed) {
    beginWidthChains(spline);
  }

  for (const seg of spline.segments) {
    const slot = scene.segSlot(seg.eid);

    if (slot === NO_SLOT) {
      continue;
    }

    const off = slot * NET_STEPS;
    const have = widthNetSteps(seg);

    for (let k = 0; k < NET_STEPS; k++) {
      const want = have ? scene.segSlot(netStepSegs[k].eid) : NO_SLOT;
      const wantV1 = have ? netStepV1[k] : 0;

      if (scene.netSeg[off + k] !== want || scene.netV1[off + k] !== wantV1) {
        say(`segment ${seg.eid} width net step ${k} is stale`);
        break;
      }
    }
  }

  if (!borrowed) {
    endWidthChains();
  }

  return bad;
}
