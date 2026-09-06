/* TrimState's two arrays, with no TrimState around them.

   The trims are already flat -- twelve doubles and a mask byte per segment slot,
   laid out in trim_state.ts -- so the stroker and the trimmer read and write
   them directly, indexed by the slot StrokeScene recorded in SegI.TRIM.  What
   the graph-side accessors get from a SplineSegment and a SplineVertex, these
   get from a slot and a flag saying which end of it is meant.

   The `v1` argument is that flag: TrimState.gets()/hasp()/setp() branch on
   `v === seg.v1`, and there is no vertex here to compare. */

import { sceneEvalSide } from "./stroker_eval.js";
import { TRIM_STRIDE } from "./trim_state.js";

import type { HeapF64, HeapU8 } from "../wasm/heap_arrays.js";
import type { StrokeScene } from "./stroke_scene.js";

/* Heap arrays, not plain ones: the wasm stroker writes the trims in place, so
   both sides have to be looking at the same bytes (see heap_arrays.ts, and
   §5.1 of docs/plans/draw-refactor-plan-final-notes.md).  Where there is no heap they are
   ordinary typed arrays and only the JS trimmer touches them. */
export interface TrimView {
  data: HeapF64;
  mask: HeapU8;
}

/* A segment that has not been through a TrimState.begin() has no slot, and
   reads fall back to the untrimmed defaults it will get when it does. */
export function trimStart(trims: TrimView, slot: number, side: number): number {
  if (slot < 0) {
    return 0.0;
  }

  return trims.data[slot * TRIM_STRIDE + (side ? 2 : 0)];
}

export function trimEnd(trims: TrimView, slot: number, side: number): number {
  if (slot < 0) {
    return 1.0;
  }

  return trims.data[slot * TRIM_STRIDE + (side ? 3 : 1)];
}

/* The trim value at one end of the segment. */
export function trimGets(trims: TrimView, slot: number, v1: boolean, side: number): number {
  return v1 ? trimStart(trims, slot, side) : trimEnd(trims, slot, side);
}

export function trimSets(
  trims: TrimView,
  slot: number,
  v1: boolean,
  side: number,
  s: number
): void {
  if (slot < 0) {
    return;
  }

  trims.data[slot * TRIM_STRIDE + (v1 ? (side ? 2 : 0) : side ? 3 : 1)] = s;
}

function maskbit(v1: boolean, side: number): number {
  if (v1) {
    return side ? 1 : 2;
  }

  return side ? 4 : 8;
}

/* Whether a mitre point is in use at this end and side. */
export function trimHasp(trims: TrimView, slot: number, v1: boolean, side: number): number {
  if (slot < 0) {
    return 0;
  }

  return trims.mask[slot] & maskbit(v1, side);
}

function pointOff(slot: number, v1: boolean, side: number): number {
  return slot * TRIM_STRIDE + (v1 ? 4 : 8) + (side ? 2 : 0);
}

/* The mitre point, or the point on the boundary where there is none. */
export function trimGetp(
  scene: StrokeScene,
  trims: TrimView,
  seg: number,
  slot: number,
  v1: boolean,
  side: number,
  out: number[],
  dv_out?: number[]
): number[] {
  const s = trimGets(trims, slot, v1, side);

  if (!trimHasp(trims, slot, v1, side)) {
    sceneEvalSide(scene, seg, s, side, out, dv_out);
    return out;
  }

  if (dv_out) {
    sceneEvalSide(scene, seg, s, side, getpco, dv_out);
  }

  const o = pointOff(slot, v1, side);

  out[0] = trims.data[o];
  out[1] = trims.data[o + 1];

  return out;
}

const getpco = [0, 0];

export function trimSetp(
  trims: TrimView,
  slot: number,
  v1: boolean,
  side: number,
  x: number,
  y: number
): void {
  if (slot < 0) {
    return;
  }

  trims.mask[slot] |= maskbit(v1, side);

  const o = pointOff(slot, v1, side);

  trims.data[o] = x;
  trims.data[o + 1] = y;
}

export function trimClearp(trims: TrimView, slot: number, v1: boolean, side: number): void {
  if (slot < 0) {
    return;
  }

  trims.mask[slot] &= ~maskbit(v1, side);
}
