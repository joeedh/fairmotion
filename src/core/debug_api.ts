"use strict";

/* Test/debug bridge, published as window.__fm.
   Playwright reaches it with page.evaluate; buildtools/cdp.mjs reaches the
   same object in an electron build over CDP. One API, both modes. */

import { areaclasses, getAreaConstructor } from "../path.ux/scripts/screen/area_base.js";
import { DataList, DataStruct } from "../path.ux/scripts/pathux.js";
import { ToolClasses } from "../path.ux/scripts/path-controller/toolsys/toolsys.js";
import { unpack_ctx } from "./ajax.js";
import { manager as renderThreads } from "../vectordraw/vectordraw_jobs.js";
import { beginWidthChains, endWidthChains } from "../curve/width_chain.js";
import { trimState } from "../curve/trim_state.js";
import { checkScene, SEG_I, SegI, strokeScene, VERT_F } from "../curve/stroke_scene.js";
import { OutlineBuffer } from "../curve/outline_buffer.js";
import { useNativeEval } from "../curve/spline_math.js";
import { strokeAll } from "../curve/stroker.js";
import {
  dumpScene,
  hashBuffer,
  hashOutlines,
  loadScene,
  newTrims,
  sceneTrimSlots,
} from "../curve/stroke_dump.js";
import type { OutlineDigest } from "../curve/stroke_dump.js";
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
} from "../curve/stroker_eval.js";
import * as native_api from "../wasm/native_api.js";
import type { DataAPI, DataPath } from "../path.ux/scripts/pathux.js";

/* Mirror of path.ux's DataTypes. Duplicated on purpose: the walker below is
   duck-typed so it keeps working across path.ux API churn. */
const DataTypes = {
  STRUCT        : 0,
  DYNAMIC_STRUCT: 1,
  PROP          : 2,
  ARRAY         : 3,
};

function getApp() {
  return window.g_app_state;
}

function getCtx() {
  let app = getApp();
  return app ? app.ctx : undefined;
}

function getApi() {
  let app = getApp();
  return app ? app.api : undefined;
}

/* `.message || the value itself`, the way the catch blocks below want it. */
function errorText(error: unknown) {
  let msg = error instanceof Error ? error.message : undefined;
  return "" + (msg || error);
}

/* One row of walkPaths(): a registered datapath and what it points at. */
interface PathEntry {
  path: string;
  kind: "prop" | "struct" | "dynamicStruct" | "list";
  propType?: string;
  structName?: string;
}

function getListElementStruct(api: DataAPI, dpath: DataPath): DataStruct | undefined {
  let data = dpath ? dpath.data : undefined;
  let cb = data instanceof DataList ? data.cb : undefined;

  if (!cb || typeof cb.getStruct !== "function") {
    return undefined;
  }

  try {
    let st: DataStruct | undefined = cb.getStruct(api, undefined, 0);
    return st && Array.isArray(st.members) ? st : undefined;
  } catch (error) {
    return undefined;
  }
}

function structName(st: DataStruct | undefined) {
  return st && st.name && st.name !== "unnamed" ? st.name : undefined;
}

function walkStruct(
  api: DataAPI,
  struct: DataStruct,
  prefix: string,
  depth: number,
  maxDepth: number,
  out: PathEntry[],
  visited: Set<object>
) {
  if (!struct || !Array.isArray(struct.members)) {
    return;
  }

  for (let dpath of struct.members) {
    let seg = dpath.apiname || dpath.path || "";
    if (!seg) {
      continue;
    }

    let path = prefix ? `${prefix}.${seg}` : seg;

    if (dpath.type === DataTypes.PROP) {
      out.push({
        path,
        kind    : "prop",
        propType: dpath.data && dpath.data.constructor ? dpath.data.constructor.name : "unknown",
      });
    } else if (dpath.type === DataTypes.STRUCT || dpath.type === DataTypes.DYNAMIC_STRUCT) {
      let dynamic = dpath.type === DataTypes.DYNAMIC_STRUCT;
      let data = dpath.data;
      let child = data instanceof DataStruct ? data : undefined;

      out.push({
        path,
        kind      : dynamic ? "dynamicStruct" : "struct",
        structName: structName(child),
      });

      if (child && !visited.has(child) && depth + 1 <= maxDepth) {
        walkStruct(api, child, path, depth + 1, maxDepth, out, new Set(visited).add(child));
      }
    } else if (dpath.type === DataTypes.ARRAY) {
      let elem = getListElementStruct(api, dpath);

      out.push({
        path,
        kind      : "list",
        structName: structName(elem),
      });

      if (elem && !visited.has(elem) && depth + 1 <= maxDepth) {
        walkStruct(api, elem, `${path}[n]`, depth + 1, maxDepth, out, new Set(visited).add(elem));
      }
    }
  }
}

/* Enumerate the entire registered datapath tree from the root context struct.
   This is the regression oracle: a path that disappears is a real break. */
function walkPaths(maxDepth = 6) {
  let api = getApi();
  let root = api ? api.rootContextStruct : undefined;
  let out: PathEntry[] = [];

  if (!api || !root) {
    return out;
  }

  walkStruct(api, root, "", 0, maxDepth, out, new Set([root]));
  out.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

  return out;
}

/* Attempt to resolve (and, for props, read) every enumerated path.
   Many legitimately fail — no active object, empty list. What matters is that
   the pass/fail split stays stable across a path.ux bump. */
function sweepPaths(maxDepth = 6) {
  let api = getApi(),
    ctx = getCtx();
  let entries = walkPaths(maxDepth);

  let ok: string[] = [],
    failed: { path: string; error: string }[] = [];

  for (let entry of entries) {
    if (entry.path.includes("[n]")) {
      continue; /* not a concrete path */
    }

    try {
      /* walkPaths() returns nothing at all unless the api exists, so entries is
         empty in the only case where these could be undefined. */
      let res = api!.resolvePath(ctx!, entry.path, true);

      if (res === undefined) {
        failed.push({ path: entry.path, error: "unresolved" });
        continue;
      }

      if (entry.kind === "prop") {
        api!.getValue(ctx!, entry.path);
      }

      ok.push(entry.path);
    } catch (error) {
      failed.push({ path: entry.path, error: errorText(error) });
    }
  }

  return { total: entries.length, ok, failed };
}

function frame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function appStarted() {
  let app = getApp();
  return !!(app && app.ctx && app.screen && app.api && app.api.rootContextStruct);
}

/* Resolves once the app has a screen and a context, so specs can await
   startup instead of sleeping on it.
   Written without async/await: the legacy extjs_cc transpiler cannot parse
   either, and this file has to build under it until phase 3 lands. */
function ready(timeout = 30000) {
  let start = performance.now();

  function poll(resolve: (started: boolean) => void, reject: (error: Error) => void) {
    if (appStarted()) {
      frame().then(() => resolve(true));
      return;
    }

    if (performance.now() - start >= timeout) {
      reject(new Error("__fm.ready(): app did not start within " + timeout + "ms"));
      return;
    }

    sleep(50).then(() => poll(resolve, reject));
  }

  return new Promise(poll);
}

/* Flush pending redraws and let the event dag settle. */
function waitIdle(timeout = 15000) {
  let start = performance.now();

  function drain(resolve: (idle: boolean) => void) {
    let times = window.redraw_start_times;
    let pending = times ? Object.keys(times).length : 0;

    if (pending === 0 || performance.now() - start >= timeout) {
      frame()
        .then(frame)
        .then(() => resolve(true));
      return;
    }

    sleep(16).then(() => drain(resolve));
  }

  return ready(timeout).then(() => {
    if (window.the_global_dag && window.the_global_dag.exec) {
      window.the_global_dag.exec();
    }

    if (window.redraw_viewport) {
      window.redraw_viewport();
    }

    return new Promise(drain);
  });
}

/* These three are the bridge's front door; the app is up by the time a test
   calls them. */
function getPath(path: string) {
  return getApi()!.getValue(getCtx()!, path);
}

function setPath(path: string, value: unknown) {
  getApi()!.setValue(getCtx()!, path, value);
  return true;
}

function execTool(toolpath: string, args: { [k: string]: unknown } = {}) {
  return getApi()!.execTool(getCtx()!, toolpath, args);
}

function listTools() {
  let out: string[] = [];

  for (let cls of ToolClasses) {
    let def;

    try {
      def = cls.tooldef();
    } catch (error) {
      continue;
    }

    if (def && def.toolpath) {
      out.push(def.toolpath);
    }
  }

  out.sort();
  return out;
}

function listEditors() {
  return Object.keys(areaclasses).sort();
}

/* Switch the largest screen area to the named editor class. */
function switchEditor(name: string) {
  let cls = areaclasses[name];

  if (!cls) {
    return Promise.reject(new Error("__fm.switchEditor(): no editor named " + name));
  }

  let screen = getApp().screen;
  let best: number | undefined, bestArea: (typeof screen.sareas)[number] | undefined;

  for (let sarea of screen.sareas) {
    let area = sarea.size[0] * sarea.size[1];

    if (best === undefined || area > best) {
      best = area;
      bestArea = sarea;
    }
  }

  /* The screen always has at least one area. */
  bestArea!.switch_editor(cls);
  screen.setCSS();

  return waitIdle().then(() => true);
}

/* Structural state dump, for semantic assertions that do not depend on pixels. */
function snapshot() {
  let ctx = getCtx();
  let out: {
    editors: string[];
    /* Element counts, or a single `error` string if the spline was unreachable. */
    counts: { [name: string]: number | string };
    toolpath: string | undefined;
  } = {
    editors : [],
    counts  : {},
    toolpath: undefined,
  };

  let screen = getApp().screen;

  for (let sarea of screen.sareas) {
    if (sarea.area) {
      let def = getAreaConstructor(sarea.area).define();
      out.editors.push(def.areaname || sarea.area.constructor.name);
    }
  }
  out.editors.sort();

  try {
    let spline = ctx!.frameset.spline;

    out.counts = {
      verts   : spline.verts.length,
      handles : spline.handles.length,
      segments: spline.segments.length,
      faces   : spline.faces.length,
      layers  : spline.layerset.length,
    };
  } catch (error) {
    out.counts = { error: errorText(error) };
  }

  try {
    out.toolpath = ctx!.toolmode ? ctx!.toolmode.constructor.name : undefined;
  } catch (error) {
    /* no toolmode */
  }

  return out;
}

/* The UI lives in shadow roots, so a plain querySelectorAll misses most of it. */
function deepQuery(tag: string, root: Document | ShadowRoot = document, out: Element[] = []) {
  for (let node of root.querySelectorAll("*")) {
    if (node.tagName && node.tagName.toLowerCase() === tag) {
      out.push(node);
    }
    if (node.shadowRoot) {
      deepQuery(tag, node.shadowRoot, out);
    }
  }

  return out;
}

function distinctColors(canvas: HTMLCanvasElement) {
  let ctx2d;

  try {
    ctx2d = canvas.getContext("2d")!;
  } catch (error) {
    return undefined;
  }

  if (!ctx2d || !canvas.width || !canvas.height) {
    return undefined;
  }

  let data = ctx2d.getImageData(0, 0, canvas.width, canvas.height).data;
  let seen = new Set();

  /* Stride is a prime multiple of the pixel size so the samples do not land
     on a repeating pattern in the source. */
  for (let i = 0; i + 3 < data.length; i += 4 * 97) {
    seen.add((data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | data[i + 3]);

    if (seen.size > 16) {
      break;
    }
  }

  return seen.size;
}

/* Content oracle: report every canvas and how many distinct colours a
   2D one holds. Beats an exact-pixel comparison, which is hopeless across
   GPU backends. WebGL surfaces report size only — their drawing buffer is
   gone by the time a test can read it. */
function canvasReport() {
  let out: { id?: string; width: number; height: number; distinct?: number }[] = [];

  for (let canvas of deepQuery("canvas")) {
    if (!(canvas instanceof HTMLCanvasElement)) {
      continue;
    }

    out.push({
      id      : canvas.id || undefined,
      width   : canvas.width,
      height  : canvas.height,
      distinct: distinctColors(canvas),
    });
  }

  return out;
}

/* Deserialize a .fmo passed in as a byte array (Playwright cannot hand over
   an ArrayBuffer directly through page.evaluate). */
function loadFile(bytes: number[]) {
  let view = new DataView(new Uint8Array(bytes).buffer);

  getApp().load_user_file_new(view, undefined, new unpack_ctx());

  return waitIdle().then(() => snapshot());
}

function saveFile() {
  let buf = getApp().create_user_file_new({ save_toolstack: false });
  /* create_user_file_new() hands back a DataView unless asked otherwise. */
  let bytes = new Uint8Array(buf.buffer);

  return Array.from(bytes);
}

/* The render-worker layer, and a way to pull the rug out from under it.
   `outstanding` counts posted jobs whose promise has not settled, which is
   the thing a cancel is supposed to leave at zero. */
function renderJobs() {
  let outstanding = 0;

  for (let thread of renderThreads.threads) {
    outstanding += Object.keys(thread.callbacks).length;
  }

  return {
    threads : renderThreads.threads.length,
    drawing : renderThreads.drawing,
    haveJobs: renderThreads.haveJobs,
    outstanding,
  };
}

function cancelRenderJobs() {
  renderThreads.cancelAllJobs();
  return renderJobs();
}

/* SplineSegment.width() reads a per-chain control net that width_chain.ts
   resolves once per draw pass; widthWalk() is the reference implementation it
   replaces, and the two are required to agree bit for bit.  Samples every
   segment of the active spline with the nets built, and reports how many
   results were not identical. */
function widthNetParity(steps = 11, jitter = 0) {
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
function trimReport(all = true) {
  let ctx = getCtx();

  if (!ctx || !ctx.frameset) {
    return { segments: 0, trimmed: 0, mitred: 0, layer: false };
  }

  let spline = ctx.frameset.spline;

  /* UPDATE | FRAME_DIRTY | REDRAW. */
  const dirty = 8 | 128 | (1 << 23);

  if (all) {
    for (let seg of spline.segments) {
      seg.flag |= dirty;
    }
    for (let v of spline.verts) {
      v.flag |= dirty;
    }

    if (spline.drawer) {
      spline.drawer.recalc_all = true;
    }
  } else {
    /* One segment only, so every other stroke group is drawn from the trims
       begin() carried forward rather than from a fresh recompute. */
    for (let seg of spline.segments) {
      seg.flag |= dirty;
      seg.v1.flag |= dirty;
      seg.v2.flag |= dirty;
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
function heapGrowthCheck(bytes = 64 * 1024 * 1024) {
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

   See docs/plans/draw-refactor.md stage 4. */
function pathDump(strokeDebug = false) {
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

  /* UPDATE | FRAME_DIRTY | REDRAW. */
  const dirty = 8 | 128 | (1 << 23);

  for (let seg of spline.segments) {
    seg.flag |= dirty;
  }
  for (let v of spline.verts) {
    v.flag |= dirty;
  }
  for (let f of spline.faces) {
    f.flag |= dirty;
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
function sceneCheck() {
  let ctx = getCtx();

  if (!ctx || !ctx.frameset) {
    return { skipped: true, verts: 0, segs: 0, bad: [] as string[], badAfterEdit: [] as string[] };
  }

  let spline = ctx.frameset.spline;

  /* UPDATE | FRAME_DIRTY | REDRAW. */
  const dirty = 8 | 128 | (1 << 23);

  for (let seg of spline.segments) {
    seg.flag |= dirty;
  }
  for (let v of spline.verts) {
    v.flag |= dirty;
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
      seg.flag |= dirty;
    }
    for (let v of spline.verts) {
      v.flag |= dirty;
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

   See docs/plans/draw-refactor.md stage 4 and playwright/stroker-eval.spec.ts. */
function strokerEvalParity(steps = 9) {
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

  /* UPDATE | FRAME_DIRTY | REDRAW: force a full pass so the scene is current. */
  const dirty = 8 | 128 | (1 << 23);

  for (let seg of spline.segments) {
    seg.flag |= dirty;
  }
  for (let v of spline.verts) {
    v.flag |= dirty;
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

   See docs/plans/draw-refactor.md stage 5 and playwright/stroke-golden.spec.ts. */
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

function strokeGolden(debug = false): Promise<StrokeGolden> {
  let ctx = getCtx();

  if (!ctx || !ctx.frameset) {
    return Promise.resolve({ skipped: true as const });
  }

  let spline = ctx.frameset.spline;

  /* UPDATE | FRAME_DIRTY | REDRAW: force a full pass so the scene is current. */
  const dirty = 8 | 128 | (1 << 23);

  for (let seg of spline.segments) {
    seg.flag |= dirty;
  }
  for (let v of spline.verts) {
    v.flag |= dirty;
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

export const debug_api = {
  ready,
  waitIdle,
  getPath,
  setPath,
  execTool,
  listTools,
  listEditors,
  switchEditor,
  walkPaths,
  sweepPaths,
  snapshot,
  canvasReport,
  loadFile,
  saveFile,
  renderJobs,
  cancelRenderJobs,
  widthNetParity,
  trimReport,
  heapGrowthCheck,
  pathDump,
  sceneCheck,
  strokerEvalParity,
  strokeGolden,
};

window.__fm = debug_api;
