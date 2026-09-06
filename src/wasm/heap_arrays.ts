/* Typed arrays that may live in the wasm heap, and the same arrays when they
   cannot.

   §5.1 of docs/plans/draw-refactor-plan-final-notes.md asks for the scene to *be* heap-resident
   storage rather than a buffer that gets copied across the boundary each pass.
   `ks` has worked that way since long before the refactor -- checkSegment()
   relocates a segment's coefficients into the heap and JS keeps a view onto the
   same bytes -- and this is that pattern generalized so StrokeScene and
   TrimState can use it for the other eleven arrays.

   The fallback is the reason this is a module and not four calls to _malloc.
   Wasm is not always there: config.USE_WASM can be off, DEBUG.no_native can be
   on, and until the runtime has finished starting isReady() is false.  In all
   three cases these functions return ordinary typed arrays with `ptr` of 0, the
   JS stroker runs over them unchanged, and nothing above here has to branch.
   A zero pointer is also the signal the wasm stroker checks before it will run:
   an array with no address is one C++ cannot read.

   Heap growth is the hazard §5.2 records.  Growing a WebAssembly.Memory
   detaches every view onto the old buffer while leaving the bytes where they
   were, so the address survives and the view does not.  native_api.checkHeap()
   is what notices; holders rebuild through review(), which is why `ptr` is
   carried on the array rather than looked up from it. */

import * as config from "../config/config.js";
import * as native_api from "./native_api.js";

/* A view onto the wasm heap at `ptr`, or a plain array with ptr 0.

   `cap` is `length` as it was when the array was made.  They are the same
   number until the heap moves, at which point `length` reads 0 and `cap` is the
   only record of how long the view is meant to be -- so it is what review()
   rebuilds from, and what a holder should ask for a size. */
export type HeapF64 = Float64Array & { ptr: number; cap: number };
export type HeapI32 = Int32Array & { ptr: number; cap: number };
export type HeapU8 = Uint8Array & { ptr: number; cap: number };

export type HeapArray = HeapF64 | HeapI32 | HeapU8;

/* Whether an allocation made now would come from the heap.  Deliberately the
   same three conditions spline_math.useNativeEval() applies, so the stroker and
   the evaluator can never disagree about which side they are running on. */
export function heapReady(): boolean {
  return config.USE_WASM && !DEBUG.no_native && native_api.isReady();
}

export const EMPTY_F64 = plainF64(0);
export const EMPTY_I32 = plainI32(0);
export const EMPTY_U8 = plainU8(0);

function plainF64(n: number): HeapF64 {
  const a = new Float64Array(n) as HeapF64;
  a.ptr = 0;
  a.cap = n;
  return a;
}

function plainI32(n: number): HeapI32 {
  const a = new Int32Array(n) as HeapI32;
  a.ptr = 0;
  a.cap = n;
  return a;
}

function plainU8(n: number): HeapU8 {
  const a = new Uint8Array(n) as HeapU8;
  a.ptr = 0;
  a.cap = n;
  return a;
}

/* An allocation of zero is not given an address: _malloc(0) is allowed to
   return one, and a scene with no segments would then hand C++ a pointer to
   nothing.  Zero-length views are read by nobody and shared.

   Zeroed, because `new Float64Array(n)` is and every caller was written against
   that.  stroke_dump.newTrims() is the one that showed it: it writes the two
   trim ends of each slot and leaves the four mitre points to be zero, so over
   raw _malloc it published whatever the allocator last held there -- which read
   as a subnormal, differed between two loads of one document, and would have
   been a real difference in geometry the moment a mask bit said to use it. */
export function allocF64(n: number): HeapF64 {
  if (n === 0 || !heapReady()) {
    return n === 0 ? EMPTY_F64 : plainF64(n);
  }

  return viewF64(native_api.heapAlloc(n * 8), n).fill(0) as HeapF64;
}

export function allocI32(n: number): HeapI32 {
  if (n === 0 || !heapReady()) {
    return n === 0 ? EMPTY_I32 : plainI32(n);
  }

  return viewI32(native_api.heapAlloc(n * 4), n).fill(0) as HeapI32;
}

export function allocU8(n: number): HeapU8 {
  if (n === 0 || !heapReady()) {
    return n === 0 ? EMPTY_U8 : plainU8(n);
  }

  return viewU8(native_api.heapAlloc(n), n).fill(0) as HeapU8;
}

/* Builds a view over `n` elements at `ptr`.  The count is passed in because a
   detached view reports zero, the same trap viewKs() names. */
export function viewF64(ptr: number, n: number): HeapF64 {
  const a = new Float64Array(native_api.wasmModule.HEAPU8.buffer, ptr, n) as HeapF64;
  a.ptr = ptr;
  a.cap = n;
  return a;
}

export function viewI32(ptr: number, n: number): HeapI32 {
  const a = new Int32Array(native_api.wasmModule.HEAPU8.buffer, ptr, n) as HeapI32;
  a.ptr = ptr;
  a.cap = n;
  return a;
}

export function viewU8(ptr: number, n: number): HeapU8 {
  const a = new Uint8Array(native_api.wasmModule.HEAPU8.buffer, ptr, n) as HeapU8;
  a.ptr = ptr;
  a.cap = n;
  return a;
}

/* A bigger array holding what the old one held.  Also the migration path: an
   array allocated before the runtime was up has ptr 0, and growing it once the
   heap is ready moves it there.  The reverse cannot happen -- nothing takes the
   heap away mid-session -- so a resident array stays resident.

   The re-view before the copy is not defensive, it is the ordinary case.
   Allocating `dst` is exactly the kind of allocation that grows the heap, and
   growth detaches `src` -- so by the time there is somewhere to copy to, the
   thing being copied from reads as length zero and set() would write nothing
   at all.  checkHeap() has already rebuilt the *holder's* field by then, but
   this function was handed the old object and not the holder, so it has to
   rebuild its own.  `len` is read first for the same reason. */
export function growF64(src: HeapF64, n: number): HeapF64 {
  const len = Math.min(src.cap, n);
  const dst = allocF64(n);

  dst.set(reviewF64(src).subarray(0, len));
  freeHeap(src);

  return dst;
}

export function growI32(src: HeapI32, n: number): HeapI32 {
  const len = Math.min(src.cap, n);
  const dst = allocI32(n);

  dst.set(reviewI32(src).subarray(0, len));
  freeHeap(src);

  return dst;
}

export function growU8(src: HeapU8, n: number): HeapU8 {
  const len = Math.min(src.cap, n);
  const dst = allocU8(n);

  dst.set(reviewU8(src).subarray(0, len));
  freeHeap(src);

  return dst;
}

/* `a` again, rebuilt if the heap moved under it.  A plain array cannot move,
   and neither can one whose length still agrees with the length it was made
   with -- that is what says the buffer it views is still the live one. */
export function reviewF64(a: HeapF64): HeapF64 {
  return a.ptr === 0 || a.length === a.cap ? a : viewF64(a.ptr, a.cap);
}

export function reviewI32(a: HeapI32): HeapI32 {
  return a.ptr === 0 || a.length === a.cap ? a : viewI32(a.ptr, a.cap);
}

export function reviewU8(a: HeapU8): HeapU8 {
  return a.ptr === 0 || a.length === a.cap ? a : viewU8(a.ptr, a.cap);
}

/* `a` if it already holds `n`, otherwise a fresh one.  For the arrays that are
   rebuilt whole every pass, where carrying the old contents over would be
   wasted work; grow*() is the one that preserves them. */
export function ensureF64(a: HeapF64, n: number): HeapF64 {
  if (a.cap >= n) {
    return reviewF64(a);
  }

  freeHeap(a);
  return allocF64(n);
}

export function ensureI32(a: HeapI32, n: number): HeapI32 {
  if (a.cap >= n) {
    return reviewI32(a);
  }

  freeHeap(a);
  return allocI32(n);
}

export function ensureU8(a: HeapU8, n: number): HeapU8 {
  if (a.cap >= n) {
    return reviewU8(a);
  }

  freeHeap(a);
  return allocU8(n);
}

/* A heap array holding a copy of `src`.  For the reader that fills a scene
   from a dump: the bytes arrive in an ArrayBuffer that is not the heap, and the
   copy has to be made anyway. */
export function copyF64(src: ArrayLike<number>): HeapF64 {
  const a = allocF64(src.length);
  a.set(src);
  return a;
}

export function copyI32(src: ArrayLike<number>): HeapI32 {
  const a = allocI32(src.length);
  a.set(src);
  return a;
}

export function copyU8(src: ArrayLike<number>): HeapU8 {
  const a = allocU8(src.length);
  a.set(src);
  return a;
}

export function freeHeap(a: HeapArray): void {
  if (a.ptr === 0) {
    return;
  }

  native_api.heapFree(a.ptr);
  a.ptr = 0;
}

/* Whether every array in `arrays` is somewhere C++ can read it.  An empty one
   is not: a scene that has never been populated has nothing to stroke, and the
   caller wants that answered here rather than as a null dereference. */
export function allResident(arrays: HeapArray[]): boolean {
  for (const a of arrays) {
    if (a.ptr === 0) {
      return false;
    }
  }

  return true;
}
