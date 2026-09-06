/* The parity gates the C++ port is held to, and the artifacts a port is
   handed.

   Three things are compared here.  strokerEvalParity() holds every scene-side
   evaluator in stroker_eval.ts to the SplineSegment method it replaces.
   strokeGolden() reduces a whole document's stroker output to numbers, and
   checks that a scene round-trips through stroke_dump.ts on the way.
   strokeWasmParity() runs the wasm stroker and the JS one over the same bytes
   and compares what came back.

   strokeArtifacts() writes the same scene out for a compiler to read, which is
   what src/wasm/tests/ consumes.

   See docs/plans/draw-refactor-plan-final-notes.md stages 4 to 6. */

import { OutlineBuffer } from "../../curve/draw/outline_buffer.js";
import { dumpEvalRef } from "../../curve/draw/stroke_eval_ref.js";
import { dumpOutlineRef } from "../../curve/draw/outline_ref.js";
import { dumpTrimRef } from "../../curve/draw/trim_ref.js";
import { dumpScene, loadScene, newTrims, sceneTrimSlots } from "../../curve/draw/stroke_dump.js";
import { hashBuffer, hashOutlines } from "../../curve/draw/outline_hash.js";
import { strokeAll, strokeGroup, strokeJoin } from "../../curve/draw/stroker.js";
import { trimVertex } from "../../curve/draw/trimmer.js";
import { wasmStrokeGroup, wasmStrokeJoin, wasmTrimVertex } from "../../curve/draw/stroke_wasm.js";
import {
  NO_SLOT,
  SEG_I,
  SegI,
  VERT_F,
  VERT_I,
  VertI,
  strokeScene,
} from "../../curve/draw/stroke_scene.js";
import {
  sceneCurvature,
  sceneDerivative,
  sceneDshift,
  sceneDwidth,
  sceneEvalSide,
  sceneEvaluate,
  sceneHasNet,
  sceneShift,
  sceneWidth,
} from "../../curve/draw/stroker_eval.js";
import { useNativeEval } from "../../curve/spline_math.js";
import * as native_api from "../../wasm/native_api.js";

import { DIRTY, getCtx, waitIdle } from "./app.js";

import type { OutlineDigest, OutlineRow } from "../../curve/draw/outline_hash.js";

function bytesEqual(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) {
    return false;
  }

  let x = new Uint8Array(a),
    y = new Uint8Array(b);

  for (let i = 0; i < x.length; i++) {
    if (x[i] !== y[i]) {
      return false;
    }
  }

  return true;
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";

  /* One character per byte, in chunks: String.fromCharCode is applied to the
     whole slice and a megabyte of arguments overflows the stack. */
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }

  return btoa(s);
}

/* Holds stroker_eval.ts to the standard its header claims: every scene-side
   twin is bit-identical to the SplineSegment method it replaces, over every
   segment of the document and `steps` values of s.

   The comparison is stronger than it looks.  Width chains are not active out
   here, so the reference width()/shift() fall through to widthWalk() -- the
   independent implementation that steps the graph -- while the twin reads the
   net the scene recorded.  A diff means the extract, the walk or the evaluator
   disagree, and the three are written separately.

   Order matters and is deliberate: each metric's reference call is made
   immediately before its twin, because eval_curve() rewrites ks[KSCALE] as it
   goes.  Both sides refresh it at the same points in the same sequence, so the
   values compared are read from identical state.

   See docs/plans/draw-refactor-plan-final-notes.md stage 4 and playwright/stroker-eval.spec.ts. */
export function strokerEvalParity(steps = 9) {
  let ctx = getCtx();

  if (!ctx || !ctx.frameset) {
    return Promise.resolve({
      skipped: true,
      total  : 0,
      segs   : 0,
      noSlot : 0,
      noNet  : 0,
      bad    : [] as string[],
      diag   : undefined as Record<string, unknown> | undefined,
    });
  }

  let spline = ctx.frameset.spline;

  for (let seg of spline.segments) {
    seg.flag |= DIRTY;
  }
  for (let v of spline.verts) {
    v.flag |= DIRTY;
  }

  if (spline.drawer) {
    spline.drawer.recalc_all = true;
  }

  return waitIdle().then(() => {
    let scene = strokeScene(spline);

    let bad: string[] = [];
    let total = 0,
      segs = 0,
      noSlot = 0,
      noNet = 0;

    /* Out-params, one pair per quantity so a stale write cannot pass for a
       match. */
    let co1 = [0, 0],
      co2 = [0, 0];
    let dv1 = [0, 0],
      dv2 = [0, 0];
    let no1 = [0, 0],
      no2 = [0, 0];
    let lw1 = [0, 0],
      lw2 = [0, 0];
    let sh1 = [0],
      sh2 = [0];

    let firstBad = -1;

    let cmp = (what: string, eid: number, s: number, a: number, b: number) => {
      total++;

      if (Object.is(a, b)) {
        return;
      }

      if (firstBad < 0) {
        firstBad = eid;
      }

      if (bad.length < 40) {
        bad.push(`${what} seg ${eid} s=${s}: ${a} vs ${b}`);
      }
    };

    for (let seg of spline.segments) {
      let slot = scene.segSlot(seg.eid);

      if (slot < 0) {
        noSlot++;
        continue;
      }

      /* A degenerate chain gets no net; the drawer falls back to widthWalk()
         for those, and so must this. */
      if (!sceneHasNet(scene, slot)) {
        noNet++;
        continue;
      }

      segs++;

      for (let i = 0; i < steps; i++) {
        let s = i / (steps - 1);

        /* no_effects forced on: ks cannot express a curve effect, so that is
           the only mode the twin implements (§5.4). */
        let a = seg.evaluate(s, undefined, undefined, undefined, true);
        sceneEvaluate(scene, slot, s, co2);
        cmp("evaluate.x", seg.eid, s, a[0], co2[0]);
        cmp("evaluate.y", seg.eid, s, a[1], co2[1]);

        let d = seg.derivative(s);
        sceneDerivative(scene, slot, s, dv2);
        cmp("derivative.x", seg.eid, s, d[0], dv2[0]);
        cmp("derivative.y", seg.eid, s, d[1], dv2[1]);

        cmp("curvature", seg.eid, s, seg.curvature(s), sceneCurvature(scene, slot, s));

        let w = seg.width(s, sh1);
        let w2 = sceneWidth(scene, slot, s, sh2);
        cmp("width", seg.eid, s, w, w2);
        cmp("width.shift", seg.eid, s, sh1[0], sh2[0]);

        cmp("shift", seg.eid, s, seg.shift(s), sceneShift(scene, slot, s));
        cmp("dwidth", seg.eid, s, seg.dwidth(s), sceneDwidth(scene, slot, s));
        cmp("dshift", seg.eid, s, seg.dshift(s), sceneDshift(scene, slot, s));

        for (let side = 0; side < 2; side++) {
          let c = seg.evaluateSide(s, side as 0 | 1, dv1, no1, lw1);

          co1[0] = c[0];
          co1[1] = c[1];

          sceneEvalSide(scene, slot, s, side, co2, dv2, no2, lw2);

          for (let j = 0; j < 2; j++) {
            cmp(`side${side}.co[${j}]`, seg.eid, s, co1[j], co2[j]);
            cmp(`side${side}.dv[${j}]`, seg.eid, s, dv1[j], dv2[j]);
            cmp(`side${side}.no[${j}]`, seg.eid, s, no1[j], no2[j]);
            cmp(`side${side}.lw[${j}]`, seg.eid, s, lw1[j], lw2[j]);
          }
        }
      }
    }

    /* A failure here is almost always a stale reference rather than wrong
       arithmetic -- the wrong coefficient address, a ks view the scene no longer
       shares, or endpoints it copied a pass ago.  Reporting those beside the
       first bad segment saves the round trip of asking. */
    let diag: Record<string, unknown> | undefined;

    if (firstBad >= 0) {
      for (let seg of spline.segments) {
        if (seg.eid !== firstBad) {
          continue;
        }

        let slot = scene.segSlot(seg.eid);
        let io = slot * SEG_I;
        let v1 = scene.segi[io + SegI.V1] * VERT_F;
        let v2 = scene.segi[io + SegI.V2] * VERT_F;

        diag = {
          native   : native_api.isReady() && !(DEBUG.no_native || DEBUG.no_nativeEval),
          sameKs   : scene.ksv[slot] === (seg.ks as unknown as Float64Array | number[]),
          segPtr   : seg.ks.ptr,
          scenePtr : scene.segi[io + SegI.KSPTR],
          hasWasm  : !!seg.ks._has_wasm,
          v1       : [seg.v1[0], seg.v1[1], Reflect.get(seg.v1, 2)],
          sceneV1  : [scene.vertf[v1], scene.vertf[v1 + 1], scene.vertf[v1 + 2]],
          v2       : [seg.v2[0], seg.v2[1], Reflect.get(seg.v2, 2)],
          sceneV2  : [scene.vertf[v2], scene.vertf[v2 + 1], scene.vertf[v2 + 2]],
          ks       : Array.from(seg.ks),
          sceneKs  : Array.from(scene.ksv[slot]),
          flag     : seg.flag,
          sceneFlag: scene.segi[io + SegI.FLAG],
        };

        break;
      }
    }

    return { skipped: false, total, segs, noSlot, noNet, bad, diag };
  });
}

/* The parity gate for the port: a whole document's stroker output, reduced to
   numbers a C++ rewrite can be held to.

   Three things are checked at once.  The scene serializes and deserializes
   without loss -- dump, load, dump again, compare bytes.  A scene rebuilt from
   that blob strokes to the same outlines as the live one, which is what makes
   the blob a self-contained test case: hand stroke_dump's format to a port and
   its output has something to be equal to.  And the digest itself is recorded
   as a baseline, so a refactor that changes the geometry says so.

   The dump is taken before anything strokes, because evaluating a segment
   rewrites ks[KSCALE] -- a dump of a stroked scene is a dump of different
   numbers.  Both runs then start from identical state.

   See docs/plans/draw-refactor-plan-final-notes.md stage 5 and playwright/stroke-golden.spec.ts. */
type StrokeGolden =
  | { skipped: true }
  | {
      skipped: false;
      native: boolean;
      bytes: number;
      dump: number;
      roundTrip: boolean;
      verts: number;
      segs: number;
      groups: number;
      live: OutlineDigest;
      loaded: OutlineDigest;
    };

export function strokeGolden(debug = false): Promise<StrokeGolden> {
  let ctx = getCtx();

  if (!ctx || !ctx.frameset) {
    return Promise.resolve({ skipped: true as const });
  }

  let spline = ctx.frameset.spline;

  for (let seg of spline.segments) {
    seg.flag |= DIRTY;
  }
  for (let v of spline.verts) {
    v.flag |= DIRTY;
  }

  if (spline.drawer) {
    spline.drawer.recalc_all = true;
  }

  return waitIdle().then(() => {
    let scene = strokeScene(spline);

    let dump = dumpScene(scene);
    let loaded = loadScene(dump);
    let roundTrip = bytesEqual(dump, dumpScene(loaded));

    let live = hashOutlines(
      strokeAll(scene, newTrims(sceneTrimSlots(scene)), debug, new OutlineBuffer())
    );
    let copy = hashOutlines(
      strokeAll(loaded, newTrims(sceneTrimSlots(loaded)), debug, new OutlineBuffer())
    );

    return {
      skipped: false as const,
      native : useNativeEval(),
      bytes  : dump.byteLength,
      dump   : hashBuffer(dump),
      roundTrip,
      verts : scene.vertMap.size,
      segs  : scene.segMap.size,
      groups: scene.groupCount,
      live,
      loaded: copy,
    };
  });
}

/* Stage 6f's parity gate: the wasm stroker against the JS one, over the three
   entry points the drawer actually calls.

   Both sides are given the *same bytes* -- one dump, loaded twice -- rather
   than one scene run twice, because evaluating a segment rewrites the arc
   length the next read sees, so a second pass over a used scene starts
   somewhere the first did not.  That is the same argument strokeArtifacts()
   makes for its own four recordings.

   Byte equality and not tolerance, for the reason 6e found: through emscripten
   the stroker reproduces the JS geometry exactly, so a coordinate that differs
   at all is a difference worth reporting.  The worst delta is measured anyway,
   because "not equal" and "off by an ulp in one place" are different bugs. */
type StrokeWasmParity =
  | { skipped: true; reason: string }
  | {
      skipped: false;
      native: boolean;
      fellBack: number;
      calls: number;
      trimsEqual: boolean;
      trimMax: number;
      rowsEqual: boolean;
      outlines: number;
      ptMax: number;
      firstBad: string | null;
    };

export function strokeWasmParity(debug = false): Promise<StrokeWasmParity> {
  let ctx = getCtx();

  if (!ctx || !ctx.frameset) {
    return Promise.resolve({ skipped: true as const, reason: "no scene" });
  }

  let spline = ctx.frameset.spline;

  return waitIdle().then(() => {
    const dump = dumpScene(strokeScene(spline));

    const a = loadScene(dump);
    const b = loadScene(dump);

    const slots = Array.from(a.vertMap.values()).sort((x, y) => x - y);

    const ta = newTrims(sceneTrimSlots(a));
    const tb = newTrims(sceneTrimSlots(b));

    let fellBack = 0;
    let calls = 0;

    for (const v of slots) {
      trimVertex(a, ta, v);

      calls++;
      if (!wasmTrimVertex(b, tb, v)) {
        fellBack++;
        trimVertex(b, tb, v);
      }
    }

    let trimMax = 0;

    for (let i = 0; i < ta.data.length; i++) {
      trimMax = Math.max(trimMax, Math.abs(ta.data[i] - tb.data[i]));
    }

    let trimsEqual = trimMax === 0;

    for (let i = 0; i < ta.mask.length; i++) {
      trimsEqual = trimsEqual && ta.mask[i] === tb.mask[i];
    }

    /* Group by group and join by join, the way the drawer asks for them: the
       wasm buffer is reset per call on the C++ side, so each is hashed as it
       comes back rather than accumulated. */
    const rowsA: OutlineRow[] = [];
    const rowsB: OutlineRow[] = [];

    const outA = new OutlineBuffer();
    const outB = new OutlineBuffer();

    let ptMax = 0;

    const take = (ja: OutlineBuffer, jb: OutlineBuffer | undefined) => {
      rowsA.push(...hashOutlines(ja).rows);

      if (jb === undefined) {
        fellBack++;
        return;
      }

      rowsB.push(...hashOutlines(jb).rows);

      const n = Math.min(ja.ptCount, jb.ptCount);

      for (let i = 0; i < n; i++) {
        ptMax = Math.max(ptMax, Math.abs(ja.pts[i] - jb.pts[i]));
      }
    };

    for (let gi = 0; gi < a.groupCount; gi++) {
      calls++;
      take(
        strokeGroup(a, ta, gi, debug, outA.reset()).finish(),
        wasmStrokeGroup(b, tb, gi, debug, outB)
      );
    }

    for (const v of slots) {
      const valence = a.verti[v * VERT_I + VertI.VALENCE];

      if (valence <= 2) {
        continue;
      }

      const off = a.vsegOff[v];

      for (let i = 0; i < valence; i++) {
        const seg = a.vsegs[off + i];

        if (seg === NO_SLOT) {
          continue;
        }

        calls++;
        take(strokeJoin(a, ta, seg, v, outA.reset()).finish(), wasmStrokeJoin(b, tb, seg, v, outB));
      }
    }

    let firstBad: string | null = null;
    let rowsEqual = rowsA.length === rowsB.length;

    for (let i = 0; i < Math.min(rowsA.length, rowsB.length); i++) {
      const x = rowsA[i];
      const y = rowsB[i];

      if (
        x.owner === y.owner &&
        x.role === y.role &&
        x.finish === y.finish &&
        x.cmds === y.cmds &&
        x.pts === y.pts &&
        x.hash === y.hash
      ) {
        continue;
      }

      rowsEqual = false;

      if (firstBad === null) {
        firstBad = `row ${i}: ${JSON.stringify(x)} vs ${JSON.stringify(y)}`;
      }
    }

    return {
      skipped: false as const,
      native : useNativeEval(),
      fellBack,
      calls,
      trimsEqual,
      trimMax,
      rowsEqual,
      outlines: rowsA.length,
      ptMax,
      firstBad,
    };
  });
}

/* The same scene the golden harness hashes, written out for a compiler to
   read: the blob itself, a recording of what stroker_eval.ts computes from it
   (stroke_eval_ref.ts), one of what trimmer.ts does to it (trim_ref.ts), and one
   of the outlines stroker.ts builds from it (outline_ref.ts).
   playwright/stroke-artifacts.spec.ts saves all four under
   playwright/artifacts/, and src/wasm/tests/ is what consumes them.  Base64
   because Playwright's evaluate() will not carry a buffer back.

   Each reference is probed on its *own* scene, loaded from those exact bytes --
   which is the state a port starts from, and the only state the numbers are
   true of.  Its own, because both passes evaluate segments and evaluating a
   segment rewrites the arc length the next read sees; sharing one scene would
   make each recording depend on the one before it. */
type StrokeArtifacts =
  | { skipped: true }
  | {
      skipped: false;
      native: boolean;
      scene: string;
      evalRef: string;
      trimRef: string;
      outRef: string;
    };

export function strokeArtifacts(): Promise<StrokeArtifacts> {
  let ctx = getCtx();

  if (!ctx || !ctx.frameset) {
    return Promise.resolve({ skipped: true as const });
  }

  let spline = ctx.frameset.spline;

  for (let seg of spline.segments) {
    seg.flag |= DIRTY;
  }
  for (let v of spline.verts) {
    v.flag |= DIRTY;
  }

  if (spline.drawer) {
    spline.drawer.recalc_all = true;
  }

  return waitIdle().then(() => {
    let dump = dumpScene(strokeScene(spline));
    let evalRef = dumpEvalRef(loadScene(dump));
    let trimRef = dumpTrimRef(loadScene(dump));
    let outRef = dumpOutlineRef(loadScene(dump));

    return {
      skipped: false as const,
      native : useNativeEval(),
      scene  : toBase64(dump),
      evalRef: toBase64(evalRef),
      trimRef: toBase64(trimRef),
      outRef : toBase64(outRef),
    };
  });
}
