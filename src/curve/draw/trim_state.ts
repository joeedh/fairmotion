/* Trim state -- where each of a segment's two stroke sides starts and ends, and
   the mitre points that replace those endpoints at a two-valence join.

   This is pure render scratch.  update_vertex_strokes() bisects on a trim
   distance until the strokes meeting at a vertex stop overlapping each other,
   writes the result here, and update_stroke_group() reads it back when it walks
   the group.  Nothing outside the drawer computes it, and it is recomputed from
   scratch for every vertex the drawer sees flagged.

   It used to live in the document.  `SplineDrawData` was a CustomDataLayer on
   segment cdata with a STRUCT, so every .fmo carried a copy of numbers the next
   draw pass would overwrite -- plus a permanent back-compat path, because the
   original layer wrote `start`/`end` as fields straight over what are now
   methods.  See docs/plans/draw-refactor-plan-final-notes.md P4.  The class is still registered
   so old files parse; afterSTRUCT() drops the layer once they have.

   Layout.  One slot per segment, indexed by the segment's position in
   spline.segments, twelve doubles and a mask byte each:

     0..3    start1, end1, start2, end2
     4,5     sp1     mitre point at v1, side 0
     6,7     sp2     mitre point at v1, side 1
     8,9     ep1     mitre point at v2, side 0
     10,11   ep2     mitre point at v2, side 1
     mask    which of those four points are in use (see maskbit())

   Lifetime.  Unlike the width nets in width_chain.ts this state has to outlive
   the pass that wrote it: a frame only recomputes the vertices it sees flagged,
   and stroke groups whose vertices did not move read last frame's trims.  So
   begin() carries every live segment's slot forward by identity into a fresh
   set of arrays and hands out its new index -- which both renumbers around
   added and removed segments and gives new ones the untrimmed defaults the
   fresh CustomDataLayer used to have.

   One state per Spline: a frameset draws a drawspline and a pathspline through
   the same code, and the two must not share slots. */

import { Vector2 } from "../../path.ux/scripts/pathux.js";
import * as native_api from "../../wasm/native_api.js";
import {
  allocF64,
  allocU8,
  EMPTY_F64,
  EMPTY_U8,
  freeHeap,
  reviewF64,
  reviewU8,
} from "../../wasm/heap_arrays.js";

import type { HeapF64, HeapU8 } from "../../wasm/heap_arrays.js";

import type { Spline } from "../spline.js";
import type { SplineSegment, SplineVertex, StrokeSide } from "../spline_types.js";

/* Doubles per segment slot; exported because stroker.ts indexes `data` itself,
   with no segment to ask. */
export const TRIM_STRIDE = 12;

const STRIDE = TRIM_STRIDE;

/* Bumped by every begin() of every state, so a slot stamp names one pass of one
   TrimState and nothing else. */
let gencount = 0;

/* getp() used to hand back the stored Vector2 itself; callers hold two or three
   at once and none of them keeps one across a call. */
const retvecs: Vector2[] = [];
for (let i = 0; i < 16; i++) {
  retvecs.push(new Vector2());
}
let reti = 0;

function retvec(): Vector2 {
  reti = (reti + 1) & 15;
  return retvecs[reti];
}

/* Which mask bit and which point slot a (vertex, side) pair names.  The vertex
   is v1 or v2 of the segment; callers that pass neither are a bug and are
   caught by slotOf()'s callers. */
function maskbit(seg: SplineSegment, v: SplineVertex, side: StrokeSide): number {
  if (v === seg.v1) {
    return side ? 1 : 2;
  }

  return side ? 4 : 8;
}

function pointOff(seg: SplineSegment, v: SplineVertex, side: StrokeSide): number {
  return (v === seg.v1 ? 4 : 8) + (side ? 2 : 0);
}

export class TrimState {
  /* Generation the slots on the segments were stamped with; -1 on a segment
     that has never been through a begin(). */
  gen = 0;

  /* Heap arrays where there is a heap: the wasm trimmer writes these in place.
     Both pairs, because begin() swaps them and either can be the live one. */
  data: HeapF64 = EMPTY_F64;
  mask: HeapU8 = EMPTY_U8;

  /* The previous pass's arrays, reused as the destination of the next one. */
  private spare: HeapF64 = EMPTY_F64;
  private spareMask: HeapU8 = EMPTY_U8;

  constructor() {
    native_api.onHeapMove(this);
  }

  /* Growth detaches the four views; the addresses they were made at survive. */
  reviewHeapViews() {
    this.data = reviewF64(this.data);
    this.mask = reviewU8(this.mask);
    this.spare = reviewF64(this.spare);
    this.spareMask = reviewU8(this.spareMask);
  }

  /* Renumbers every segment of `spline` and carries its trims across. */
  begin(spline: Spline) {
    const segs = spline.segments;
    const n = segs.length;

    if (this.spare.cap < n * STRIDE) {
      let cap = 64;

      while (cap < n) {
        cap *= 2;
      }

      freeHeap(this.spare);
      freeHeap(this.spareMask);

      this.spare = allocF64(cap * STRIDE);
      this.spareMask = allocU8(cap);
    }

    const src = this.data;
    const srcMask = this.mask;
    const dst = this.spare;
    const dstMask = this.spareMask;
    const gen = this.gen;

    gencount++;

    let i = 0;

    for (const seg of segs) {
      const o = i * STRIDE;
      const s = seg._trimGen === gen ? seg._trimSlot : -1;

      if (s >= 0) {
        const so = s * STRIDE;

        for (let k = 0; k < STRIDE; k++) {
          dst[o + k] = src[so + k];
        }

        dstMask[i] = srcMask[s];
      } else {
        /* Untrimmed and unmitred, exactly as a fresh SplineDrawData was. */
        dst[o] = 0.0;
        dst[o + 1] = 1.0;
        dst[o + 2] = 0.0;
        dst[o + 3] = 1.0;

        for (let k = 4; k < STRIDE; k++) {
          dst[o + k] = 0.0;
        }

        dstMask[i] = 0;
      }

      seg._trimSlot = i;
      seg._trimGen = gencount;
      i++;
    }

    this.data = dst;
    this.mask = dstMask;
    this.spare = src;
    this.spareMask = srcMask;
    this.gen = gencount;
  }

  /* Slot of `seg`, or -1 for a segment that has not been through begin() --
     one made since the last draw pass.  Reads fall back to the defaults it
     will get when it does; writes to it would be overwritten there anyway. */
  private slotOf(seg: SplineSegment): number {
    return seg._trimGen === this.gen ? seg._trimSlot : -1;
  }

  /* The same slot, for StrokeScene to record so the stroker can read `data` and
     `mask` without a segment in its hand. */
  trimSlot(seg: SplineSegment): number {
    return this.slotOf(seg);
  }

  start(seg: SplineSegment, side: StrokeSide) {
    const slot = this.slotOf(seg);

    if (slot < 0) {
      return 0.0;
    }

    return this.data[slot * STRIDE + (side ? 2 : 0)];
  }

  end(seg: SplineSegment, side: StrokeSide) {
    const slot = this.slotOf(seg);

    if (slot < 0) {
      return 1.0;
    }

    return this.data[slot * STRIDE + (side ? 3 : 1)];
  }

  gets(seg: SplineSegment, v: SplineVertex, side: StrokeSide, margin = 0.0) {
    if (v === seg.v1) {
      return this.start(seg, side) - margin;
    } else if (v === seg.v2) {
      return this.end(seg, side) + margin;
    }

    console.warn(v, seg);
    throw new Error("vertex not in segment");
  }

  sets(seg: SplineSegment, v: SplineVertex, side: StrokeSide, s: number) {
    let i: number;

    if (v === seg.v1) {
      i = side ? 2 : 0;
    } else if (v === seg.v2) {
      i = side ? 3 : 1;
    } else {
      throw new Error("vertex not in segment");
    }

    const slot = this.slotOf(seg);

    if (slot >= 0) {
      this.data[slot * STRIDE + i] = s;
    }

    return this;
  }

  hasp(seg: SplineSegment, v: SplineVertex, side: StrokeSide) {
    const slot = this.slotOf(seg);

    if (slot < 0) {
      return 0;
    }

    return this.mask[slot] & maskbit(seg, v, side);
  }

  getp(seg: SplineSegment, v: SplineVertex, side: StrokeSide, dv_out?: Vector2) {
    if (!this.hasp(seg, v, side)) {
      return seg.evaluateSide(this.gets(seg, v, side), side, dv_out);
    }

    if (dv_out) {
      seg.evaluateSide(this.gets(seg, v, side), side, dv_out);
    }

    if (v !== seg.v1 && v !== seg.v2) {
      console.log(v, seg);
      throw new Error("vertex not in segment");
    }

    const o = this.slotOf(seg) * STRIDE + pointOff(seg, v, side);
    const ret = retvec();

    ret[0] = this.data[o];
    ret[1] = this.data[o + 1];

    return ret;
  }

  setp(seg: SplineSegment, v: SplineVertex, side: StrokeSide, p: Vector2 | undefined) {
    const slot = this.slotOf(seg);

    if (slot < 0) {
      return;
    }

    if (!p) {
      this.mask[slot] &= ~maskbit(seg, v, side);
      return;
    }

    if (v !== seg.v1 && v !== seg.v2) {
      console.log(v, seg);
      throw new Error("vertex not in segment");
    }

    this.mask[slot] |= maskbit(seg, v, side);

    const o = slot * STRIDE + pointOff(seg, v, side);

    this.data[o] = p[0];
    this.data[o + 1] = p[1];
  }
}

const states = new WeakMap<Spline, TrimState>();

/* The trim state of `spline`, created empty on first use. */
export function trimState(spline: Spline): TrimState {
  let ret = states.get(spline);

  if (ret === undefined) {
    ret = new TrimState();
    states.set(spline, ret);
  }

  return ret;
}
