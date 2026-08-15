/* Serializing a StrokeScene, and hashing what the stroker makes of one.

   This is stage 5 of the draw refactor: the parity gate.  A C++ stroker is
   unverifiable without a way to hand both implementations the same document and
   compare the geometry byte for byte, so this writes the scene out as a flat
   binary blob and reduces an OutlineBuffer to a hash a port can reproduce.  The
   JS side of the comparison is playwright/stroke-golden.spec.ts; see
   docs/plans/draw-refactor.md stage 5 and stage 6.

   The blob is deliberately dull -- a header of int32s and then the scene's own
   arrays, in slot order, at their own capacities.  Slot indices are preserved
   rather than compacted because every derived index in the scene (net walks,
   adjacency, groups, trims) is a slot number; renumbering here would mean
   rewriting all of them and would make a diff against the live scene useless.

   What is *not* in it:

   - **KSPTR.**  A live heap address means nothing to a reader, and leaving it in
     would make two dumps of the same document differ.  It is zeroed on write and
     filled in on load, from memory the loader allocates itself.
   - **Trim state.**  The stroker is run behind a trim pass that writes every
     value it later reads (trimmer.ts), so the harness starts from a fresh set of
     untrimmed defaults -- newTrims() below -- rather than carrying a pass's
     scratch across.  That also makes the run reproducible from the blob alone.

   The hash is FNV-1a, 32-bit, over little-endian bytes: `h = 2166136261`, then
   `h = (h ^ byte) * 16777619` per byte, truncated to 32 bits.  Spelled out
   because the C++ side has to compute the same number, and because a hash over
   IEEE754 bytes is portable in a way one over formatted decimals is not. */

import * as native_api from "../wasm/native_api.js";
import { OUTLINE_I, OutlineI } from "./outline_buffer.js";
import { KTOTKS, useNativeEval } from "./spline_math.js";
import {
  GROUP_I,
  GroupI,
  NET_STEPS,
  SEG_F,
  SEG_I,
  SegI,
  StrokeScene,
  VERT_F,
  VERT_I,
  VertI,
} from "./stroke_scene.js";
import { TRIM_STRIDE } from "./trim_state.js";

import type { OutlineBuffer } from "./outline_buffer.js";
import type { TrimView } from "./trim_view.js";

/* Coefficients per segment.  Sixteen, not KTOTKS: that is how much
   native_api.checkSegment() reserves, so it is how much a heap-resident `ks`
   has and how much a port will find there. */
export const KS_SLOTS = 16;

/* "FMSD", read little-endian. */
export const SCENE_MAGIC = 0x44534d46;
export const SCENE_VERSION = 1;

const HEADER_I = 16;

const enum H {
  MAGIC = 0,
  VERSION = 1,
  VERT_MAX = 2,
  SEG_MAX = 3,
  VERT_LIVE = 4,
  SEG_LIVE = 5,
  GROUP_COUNT = 6,
  GROUP_SEGS = 7,
  VSEGS = 8,
  TRIM_SLOTS = 9,
  KS_SLOTS = 10,
  FLAGS = 11,
}

/* Bit 0 of the FLAGS word: the dump was taken while the native evaluator was
   live, so its coefficients are the ones wasm left. */
export const SCENE_FLAG_NATIVE = 1;

/* Byte offsets of every section, derived from the header alone so the writer
   and the reader cannot drift apart. */
interface Layout {
  vertLive: number;
  segLive: number;
  verti: number;
  segi: number;
  netSeg: number;
  groups: number;
  groupSegs: number;
  vsegOff: number;
  vsegs: number;
  netV1: number;
  vertf: number;
  segf: number;
  ks: number;
  total: number;
}

function layout(h: Int32Array): Layout {
  const vertMax = h[H.VERT_MAX];
  const segMax = h[H.SEG_MAX];

  let o = HEADER_I * 4;

  const i32 = (n: number) => {
    const at = o;
    o += n * 4;
    return at;
  };

  const vertLive = i32(h[H.VERT_LIVE]);
  const segLive = i32(h[H.SEG_LIVE]);
  const verti = i32(vertMax * VERT_I);
  const segi = i32(segMax * SEG_I);
  const netSeg = i32(segMax * NET_STEPS);
  const groups = i32(h[H.GROUP_COUNT] * GROUP_I);
  const groupSegs = i32(h[H.GROUP_SEGS]);
  const vsegOff = i32(vertMax);
  const vsegs = i32(h[H.VSEGS]);

  const netV1 = o;
  o += segMax * NET_STEPS;

  /* Doubles want eight-byte alignment, and the byte section above is the only
     thing that can leave the cursor off it. */
  o = (o + 7) & ~7;

  const f64 = (n: number) => {
    const at = o;
    o += n * 8;
    return at;
  };

  const vertf = f64(vertMax * VERT_F);
  const segf = f64(segMax * SEG_F);
  const ks = f64(segMax * h[H.KS_SLOTS]);

  return {
    vertLive,
    segLive,
    verti,
    segi,
    netSeg,
    groups,
    groupSegs,
    vsegOff,
    vsegs,
    netV1,
    vertf,
    segf,
    ks,
    total: o,
  };
}

/* The live slots, ascending.  Ascending rather than in map order because the
   order decides what the stroker evaluates first, and evaluating a segment
   rewrites the arc length its neighbours' widths are read against (see
   stroke_scene.ts) -- so it has to be a property of the data, not of how the
   scene happened to fill its maps. */
function liveSlots(map: Map<number, number>): number[] {
  const out = Array.from(map.values());
  out.sort((a, b) => a - b);
  return out;
}

/* One past the highest trim slot any live segment names. */
function trimSlots(scene: StrokeScene, segLive: number[]): number {
  let n = 0;

  for (const slot of segLive) {
    const t = scene.segi[slot * SEG_I + SegI.TRIM];

    if (t + 1 > n) {
      n = t + 1;
    }
  }

  return n;
}

export function dumpScene(scene: StrokeScene): ArrayBuffer {
  const vertLive = liveSlots(scene.vertMap);
  const segLive = liveSlots(scene.segMap);

  let vsegs = 0;

  for (const slot of vertLive) {
    vsegs += scene.verti[slot * VERT_I + VertI.VALENCE];
  }

  const groupSegs =
    scene.groupCount > 0 ? scene.groups[(scene.groupCount - 1) * GROUP_I + GroupI.SEG1] : 0;

  const h = new Int32Array(HEADER_I);

  h[H.MAGIC] = SCENE_MAGIC;
  h[H.VERSION] = SCENE_VERSION;
  h[H.VERT_MAX] = scene.vertMax;
  h[H.SEG_MAX] = scene.segMax;
  h[H.VERT_LIVE] = vertLive.length;
  h[H.SEG_LIVE] = segLive.length;
  h[H.GROUP_COUNT] = scene.groupCount;
  h[H.GROUP_SEGS] = groupSegs;
  h[H.VSEGS] = vsegs;
  h[H.TRIM_SLOTS] = trimSlots(scene, segLive);
  h[H.KS_SLOTS] = KS_SLOTS;
  h[H.FLAGS] = useNativeEval() ? SCENE_FLAG_NATIVE : 0;

  const l = layout(h);
  const buf = new ArrayBuffer(l.total);

  new Int32Array(buf, 0, HEADER_I).set(h);

  const i32 = (at: number, n: number) => new Int32Array(buf, at, n);
  const f64 = (at: number, n: number) => new Float64Array(buf, at, n);

  i32(l.vertLive, vertLive.length).set(vertLive);
  i32(l.segLive, segLive.length).set(segLive);
  i32(l.verti, scene.vertMax * VERT_I).set(scene.verti.subarray(0, scene.vertMax * VERT_I));
  i32(l.netSeg, scene.segMax * NET_STEPS).set(scene.netSeg.subarray(0, scene.segMax * NET_STEPS));
  i32(l.groups, scene.groupCount * GROUP_I).set(
    scene.groups.subarray(0, scene.groupCount * GROUP_I)
  );
  i32(l.groupSegs, groupSegs).set(scene.groupSegs.subarray(0, groupSegs));
  i32(l.vsegOff, scene.vertMax).set(scene.vsegOff.subarray(0, scene.vertMax));
  i32(l.vsegs, vsegs).set(scene.vsegs.subarray(0, vsegs));

  /* Everything but the pointer, which is this process's and no one else's. */
  const segi = i32(l.segi, scene.segMax * SEG_I);
  segi.set(scene.segi.subarray(0, scene.segMax * SEG_I));

  for (let slot = 0; slot < scene.segMax; slot++) {
    segi[slot * SEG_I + SegI.KSPTR] = 0;
  }

  new Uint8Array(buf, l.netV1, scene.segMax * NET_STEPS).set(
    scene.netV1.subarray(0, scene.segMax * NET_STEPS)
  );

  f64(l.vertf, scene.vertMax * VERT_F).set(scene.vertf.subarray(0, scene.vertMax * VERT_F));
  f64(l.segf, scene.segMax * SEG_F).set(scene.segf.subarray(0, scene.segMax * SEG_F));

  const ks = f64(l.ks, scene.segMax * KS_SLOTS);

  for (const slot of segLive) {
    const src = scene.ksv[slot];

    if (src === undefined) {
      continue;
    }

    const n = Math.min(KS_SLOTS, src.length);

    for (let i = 0; i < n; i++) {
      ks[slot * KS_SLOTS + i] = src[i];
    }
  }

  return buf;
}

/* Rebuilds a scene from a dump.  The result is read-only in the sense that
   matters: it has no Spline behind it, so begin() must never be called on it --
   everything the stroker reads is here, and nothing else is.

   Coefficients are copied into memory this allocates.  Under the native
   evaluator that means the wasm heap, because §5.6 pins the comparison to one
   evaluator and a scene with no address falls through to the JS one. */
export function loadScene(buf: ArrayBuffer): StrokeScene {
  const h = new Int32Array(buf, 0, HEADER_I);

  if (h[H.MAGIC] !== SCENE_MAGIC) {
    throw new Error("not a stroke scene dump");
  }
  if (h[H.VERSION] !== SCENE_VERSION) {
    throw new Error(`stroke scene dump version ${h[H.VERSION]}, expected ${SCENE_VERSION}`);
  }

  const l = layout(h);

  if (l.total !== buf.byteLength) {
    throw new Error(`stroke scene dump is ${buf.byteLength} bytes, expected ${l.total}`);
  }

  const vertMax = h[H.VERT_MAX];
  const segMax = h[H.SEG_MAX];
  const ksSlots = h[H.KS_SLOTS];

  const scene = new StrokeScene();

  scene.vertMax = vertMax;
  scene.segMax = segMax;
  /* Slot allocation is what these are for and a loaded scene does none, so
     they say "nothing below capacity is free to hand out". */
  scene.vertCount = vertMax;
  scene.segCount = segMax;

  scene.verti = new Int32Array(buf, l.verti, vertMax * VERT_I).slice();
  scene.segi = new Int32Array(buf, l.segi, segMax * SEG_I).slice();
  scene.netSeg = new Int32Array(buf, l.netSeg, segMax * NET_STEPS).slice();
  scene.netV1 = new Uint8Array(buf, l.netV1, segMax * NET_STEPS).slice();
  scene.groups = new Int32Array(buf, l.groups, h[H.GROUP_COUNT] * GROUP_I).slice();
  scene.groupSegs = new Int32Array(buf, l.groupSegs, h[H.GROUP_SEGS]).slice();
  scene.vsegOff = new Int32Array(buf, l.vsegOff, vertMax).slice();
  scene.vsegs = new Int32Array(buf, l.vsegs, h[H.VSEGS]).slice();
  scene.vertf = new Float64Array(buf, l.vertf, vertMax * VERT_F).slice();
  scene.segf = new Float64Array(buf, l.segf, segMax * SEG_F).slice();

  scene.groupCount = h[H.GROUP_COUNT];
  scene.vertStamp = new Int32Array(vertMax);
  scene.segStamp = new Int32Array(segMax);

  const vertLive = new Int32Array(buf, l.vertLive, h[H.VERT_LIVE]);
  const segLive = new Int32Array(buf, l.segLive, h[H.SEG_LIVE]);

  for (const slot of vertLive) {
    scene.vertMap.set(scene.verti[slot * VERT_I + VertI.EID], slot);
  }
  for (const slot of segLive) {
    scene.segMap.set(scene.segi[slot * SEG_I + SegI.EID], slot);
  }

  for (let gi = 0; gi < scene.groupCount; gi++) {
    scene.groupMap.set(scene.groups[gi * GROUP_I + GroupI.ID], gi);
  }

  const ks = new Float64Array(buf, l.ks, segMax * ksSlots);
  const native = useNativeEval();

  scene.ksv.length = segMax;

  for (let slot = 0; slot < segMax; slot++) {
    scene.ksv[slot] = new Float64Array(KTOTKS);
  }

  for (const slot of segLive) {
    const dst = native ? native_api.allocKs() : new Float64Array(ksSlots);
    const n = Math.min(dst.length, ksSlots);

    for (let i = 0; i < n; i++) {
      dst[i] = ks[slot * ksSlots + i];
    }

    scene.ksv[slot] = dst;
    scene.segi[slot * SEG_I + SegI.KSPTR] = native ? (dst as { ptr?: number }).ptr! : 0;
  }

  /* Held weakly, so this does not keep the scene alive. */
  native_api.onHeapMove(scene);

  scene.topoChanged = false;

  return scene;
}

/* A trim state with nothing trimmed and nothing mitred: the same values
   TrimState.begin() gives a segment it has not seen before.  The stroker is
   always run behind a trim pass that overwrites all of it. */
export function newTrims(slots: number): TrimView {
  const data = new Float64Array(slots * TRIM_STRIDE);

  for (let i = 0; i < slots; i++) {
    data[i * TRIM_STRIDE + 1] = 1.0;
    data[i * TRIM_STRIDE + 3] = 1.0;
  }

  return { data, mask: new Uint8Array(slots) };
}

/* How many trim slots a scene's segments name; what to pass newTrims(). */
export function sceneTrimSlots(scene: StrokeScene): number {
  return trimSlots(scene, liveSlots(scene.segMap));
}

/* --- hashing -------------------------------------------------------------- */

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

/* Reduces a finished OutlineBuffer to something comparable across
   implementations: each outline's opcodes and coordinates hashed as bytes, and
   the rows themselves folded into a total.  Rows are kept in emission order --
   unlike the path dump, which sorts, because here the order is part of what the
   port has to reproduce. */
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
