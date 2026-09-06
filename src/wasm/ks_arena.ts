/* The arena a segment's spiral coefficients are allocated out of.

   Every segment carries sixteen doubles of `ks`, and native_api.checkSegment()
   relocates them into the wasm heap the first time the segment is evaluated or
   solved natively.  That used to be one _malloc(8 * 16) per segment, which the
   allocator was free to scatter anywhere in the heap.  The strokers walk a
   chain linearly -- width_chain gathers seven segments either side of the one
   being evaluated, and stroke_scene records that walk -- so the 128-byte blocks
   want to be next to each other, and scattered blocks cost a cache miss per
   step.  See docs/plans/draw-refactor-plan-final-notes.md §3.

   So allocation is by cell out of large chunks instead.  A cell is one
   segment's sixteen doubles; a chunk is CHUNK_CELLS of them taken in a single
   _malloc.  Segments created in sequence -- which is what a chain is, whether it
   was drawn with the pen tool or read off disk in spline.segments order -- land
   in consecutive cells of one chunk.

   Chunks are never reallocated and never released.  A cell's address is its
   identity: seg.ks is a Float64Array view onto those exact bytes and
   stroke_scene stores the address in SegI.KSPTR, so moving a chunk would
   invalidate both.  Freed cells go on a free list and are handed back out.
   Growing the heap does still detach the views onto it, which is what
   native_api.checkHeap() rebuilds; the addresses here survive that untouched. */

import { heapAlloc } from "./native_api.js";

/* Doubles per segment.  The wasm side reserves the same sixteen; see
   src/wasm/stroke_scene.h. */
export const KS_SLOTS = 16;

const KS_BYTES = KS_SLOTS * 8;

/* 256 cells is 32KiB a chunk -- big enough that a document's worth of segments
   is a handful of allocations, small enough that a tiny document does not
   reserve much it will not use. */
const CHUNK_SHIFT = 8;
const CHUNK_CELLS = 1 << CHUNK_SHIFT;
const CHUNK_MASK = CHUNK_CELLS - 1;

/* Base address of each chunk, in the order they were taken. */
const chunks: number[] = [];

/* Cells handed out so far, counting across chunks; the next fresh cell's
   index. */
let cellCount = 0;

const freeCells: number[] = [];

/* For the debug api and the parity harness: how much the arena is holding. */
export const ksArenaStats = {
  get chunks() {
    return chunks.length;
  },
  get cells() {
    return cellCount;
  },
  get free() {
    return freeCells.length;
  },
};

/* The heap address of cell `cell`. */
export function ksCellPtr(cell: number): number {
  return chunks[cell >> CHUNK_SHIFT] + (cell & CHUNK_MASK) * KS_BYTES;
}

/* A cell nothing else is using, taking a fresh chunk if the last one is full.
   The caller is expected to zero or overwrite it: a reused cell still holds the
   coefficients of the segment that gave it up. */
export function allocKsCell(): number {
  const reuse = freeCells.pop();

  if (reuse !== undefined) {
    return reuse;
  }

  if (cellCount >> CHUNK_SHIFT === chunks.length) {
    chunks.push(heapAlloc(CHUNK_CELLS * KS_BYTES));
  }

  return cellCount++;
}

export function freeKsCell(cell: number): void {
  freeCells.push(cell);
}
