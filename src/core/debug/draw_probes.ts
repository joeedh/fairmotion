/* Probes over one draw pass of the active spline: what the width chains
   resolved to, what the trim pass produced, what the drawer built, whether the
   extracted scene still agrees with the spline, and whether the views onto the
   wasm heap survive it growing.

   Each one forces a full pass first (DIRTY on every element plus the drawer's
   recalc flag) and then reads the state that pass left behind, so what they
   report is what the drawer would actually have used. */

import { beginWidthChains, endWidthChains } from "../../curve/draw/width_chain.js";
import { trimState } from "../../curve/draw/trim_state.js";
import { checkScene, strokeScene } from "../../curve/draw/stroke_scene.js";
import * as native_api from "../../wasm/native_api.js";

import { DIRTY, getCtx, waitIdle } from "./app.js";

/* SplineSegment.width() reads a per-chain control net that width_chain.ts
   resolves once per draw pass; widthWalk() is the reference implementation it
   replaces, and the two are required to agree bit for bit.  Samples every
   segment of the active spline with the nets built, and reports how many
   results were not identical. */
export function widthNetParity(steps = 11, jitter = 0) {
  let ctx = getCtx();

  if (!ctx || !ctx.frameset) {
    return { total: 0, bad: 0, error: "no spline" };
  }

  let spline = ctx.frameset.spline;
  let shift: number[] = [0];
  let shiftWalk: number[] = [0];
  let total = 0,
    bad = 0;

  /* Moving vertices without re-solving leaves each segment's arc length --
     ks[KSCALE], which eval_curve() recomputes as the drawer walks the frame --
     a step behind the coordinates. That is the state a cache holding knots
     rather than topology would get wrong, so the check runs in it too. */
  if (jitter !== 0.0) {
    for (let v of spline.verts) {
      v[0] += jitter;
      v[1] -= jitter;
    }
  }

  beginWidthChains(spline);

  try {
    for (let seg of spline.segments) {
      for (let i = 0; i < steps; i++) {
        let s = i / (steps - 1);
        let w = seg.width(s, shift);
        let wWalk = seg.widthWalk(s, shiftWalk);

        total++;

        if (!Object.is(w, wWalk) || !Object.is(shift[0], shiftWalk[0])) {
          bad++;
        }
      }
    }
  } finally {
    endWidthChains();

    if (jitter !== 0.0) {
      for (let v of spline.verts) {
        v[0] -= jitter;
        v[1] += jitter;
      }
    }
  }

  return { total, bad };
}

/* Re-strokes the active spline and reports what the trim pass produced: how
   many segments ended up trimmed or mitred, and whether the file still carries
   the dead `drawdata` cdata layer.  With `all` false only one segment is
   flagged, so the rest are read from what TrimState.begin() carried forward. */
export function trimReport(all = true) {
  let ctx = getCtx();

  if (!ctx || !ctx.frameset) {
    return { segments: 0, trimmed: 0, mitred: 0, layer: false };
  }

  let spline = ctx.frameset.spline;

  if (all) {
    for (let seg of spline.segments) {
      seg.flag |= DIRTY;
    }
    for (let v of spline.verts) {
      v.flag |= DIRTY;
    }

    if (spline.drawer) {
      spline.drawer.recalc_all = true;
    }
  } else {
    /* One segment only, so every other stroke group is drawn from the trims
       begin() carried forward rather than from a fresh recompute. */
    for (let seg of spline.segments) {
      seg.flag |= DIRTY;
      seg.v1.flag |= DIRTY;
      seg.v2.flag |= DIRTY;
      break;
    }
  }

  return waitIdle().then(() => {
    let trims = trimState(spline);
    let trimmed = 0,
      mitred = 0;

    for (let seg of spline.segments) {
      if (trims.start(seg, 0) !== 0.0 || trims.end(seg, 0) !== 1.0) {
        trimmed++;
      } else if (trims.start(seg, 1) !== 0.0 || trims.end(seg, 1) !== 1.0) {
        trimmed++;
      }

      if (trims.hasp(seg, seg.v1, 0) || trims.hasp(seg, seg.v2, 0)) {
        mitred++;
      }
    }

    return {
      segments: spline.segments.length,
      trimmed,
      mitred,
      layer: spline.segments.cdata.has_layer("drawdata"),
    };
  });
}

/* Forces the wasm heap to grow and reports whether the views onto it survived.

   Growth detaches every view of the old ArrayBuffer, so without the re-view in
   native_api.checkHeap() every segment's `ks` silently reads as length 0 --
   which is not a hypothetical, just untriggered: the solver allocates far less
   than the 32 MB initial heap.  This allocates past it on purpose. */
export function heapGrowthCheck(bytes = 64 * 1024 * 1024) {
  let ctx = getCtx();

  if (!ctx || !ctx.frameset || !native_api.isReady()) {
    return { skipped: true };
  }

  let spline = ctx.frameset.spline;
  let segs = Array.from(spline.segments);

  for (let seg of segs) {
    native_api.checkSegment(seg);
  }

  /* Compared after the growth: same addresses, same bytes, new views. */
  let before = segs.map((seg) => Array.from(seg.ks));
  let grows = native_api.heapStats.grows;

  let wasm = native_api.wasmModule;
  let ptr = wasm._malloc(bytes);
  native_api.checkHeap();
  wasm._free(ptr);

  let grew = native_api.heapStats.grows > grows;
  let detached = 0,
    changed = 0;

  for (let i = 0; i < segs.length; i++) {
    let ks = segs[i].ks;

    if (ks.length !== before[i].length) {
      detached++;
      continue;
    }

    for (let k = 0; k < ks.length; k++) {
      if (!Object.is(ks[k], before[i][k])) {
        changed++;
        break;
      }
    }
  }

  return {
    skipped: false,
    grew,
    segments: segs.length,
    reviewed: native_api.heapStats.reviewed,
    detached,
    changed,
  };
}

/* A key-independent fingerprint of everything the drawer built: one row per
   retained path, sorted by z and then by content, never by path key.

   Key-independent is the point.  Stage 4 of the draw refactor moves geometry
   between passes and renames every path key on the way (see path_key.ts), so an
   oracle that compared keys would report a diff for every rename and prove
   nothing.  What must not change is the set of paths, their draw order, their
   command streams and their styles -- which is what this hashes.

   With `strokeDebug` the viewport's stroke-debug overlays are turned on for the
   pass, so the debug geometry is in the dump too -- it is drawn by the same
   stroker and a refactor can break it just as easily.

   See docs/plans/draw-refactor-plan-final-notes.md stage 4. */
export function pathDump(strokeDebug = false) {
  let ctx = getCtx();

  if (!ctx || !ctx.frameset) {
    return { paths: [], hash: 0 };
  }

  let spline = ctx.frameset.spline;
  let view2d = ctx.view2d;
  let hadDebug = view2d ? view2d.draw_stroke_debug : false;

  if (view2d) {
    view2d.draw_stroke_debug = strokeDebug;
  }

  for (let seg of spline.segments) {
    seg.flag |= DIRTY;
  }
  for (let v of spline.verts) {
    v.flag |= DIRTY;
  }
  for (let f of spline.faces) {
    f.flag |= DIRTY;
  }

  if (spline.drawer) {
    spline.drawer.recalc_all = true;
  }

  return waitIdle().then(() => {
    let hash = (h: number, s: string) => {
      for (let i = 0; i < s.length; i++) {
        h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
      }

      return h;
    };

    let rows = [];
    let paths = spline.drawer ? spline.drawer.drawer.paths : [];

    for (let path of paths) {
      /* Every live backend keeps its opcode stream here; PathBase does not
         declare it because SVGDraw2D builds its own. */
      let cmds = (path as unknown as { commands: number[] }).commands ?? [];
      /* String(x) round-trips a double exactly, so this is a bit-exact hash. */
      let h = 2166136261;

      for (let i = 0; i < cmds.length; i++) {
        h = hash(h, String(cmds[i]) + ",");
      }

      rows.push({
        z     : path.z ?? 0,
        len   : cmds.length,
        cmds  : h,
        color : Array.from(path.color).join(),
        blur  : path.blur,
        hidden: !!path.hidden,
        clips : path.clip_paths ? path.clip_paths.length : 0,
      });
    }

    rows.sort((a, b) => a.z - b.z || a.cmds - b.cmds || a.len - b.len);

    let total = 2166136261;

    for (let r of rows) {
      total = hash(total, `${r.z}|${r.len}|${r.cmds}|${r.color}|${r.blur}|${r.hidden}|${r.clips};`);
    }

    if (view2d) {
      view2d.draw_stroke_debug = hadDebug;
    }

    return { paths: rows, hash: total };
  });
}

/* Checks the extracted scene against the spline it was extracted from, after a
   full pass and again after an edit that changes topology -- the case the
   incremental patching is there for and the one that can go wrong.  Reports the
   scene's size and every invariant violation; see stroke_scene.checkScene(). */
export function sceneCheck() {
  let ctx = getCtx();

  if (!ctx || !ctx.frameset) {
    return { skipped: true, verts: 0, segs: 0, bad: [] as string[], badAfterEdit: [] as string[] };
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
    let bad = checkScene(scene, spline);

    /* Now delete a segment and redraw: slots must be freed, the maps must
       shrink, and every remaining width net must have been rebuilt. */
    let victim = spline.segments[(spline.segments.length / 2) | 0];

    if (victim) {
      spline.kill_segment(victim);
      spline.regen_render();
    }

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
      return {
        skipped: false,
        verts  : scene.vertMap.size,
        segs   : scene.segMap.size,
        bad,
        badAfterEdit: checkScene(scene, spline),
      };
    });
  });
}
