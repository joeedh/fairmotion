"use strict";

/* Test/debug bridge, published as window.__fm.
   Playwright reaches it with page.evaluate; buildtools/cdp.mjs reaches the
   same object in an electron build over CDP. One API, both modes. */

import {areaclasses} from '../path.ux/scripts/screen/area_wrangler.js';
import {ToolClasses} from '../path.ux/scripts/path-controller/toolsys/toolsys.js';
import {unpack_ctx} from './ajax.js';

/* Mirror of path.ux's DataTypes. Duplicated on purpose: the walker below is
   duck-typed so it keeps working across path.ux API churn. */
const DataTypes = {
  STRUCT        : 0,
  DYNAMIC_STRUCT: 1,
  PROP          : 2,
  ARRAY         : 3
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

function getListElementStruct(api, dpath) {
  let cb = dpath && dpath.data ? dpath.data.cb : undefined;

  if (!cb || typeof cb.getStruct !== "function") {
    return undefined;
  }

  try {
    let st = cb.getStruct(api, undefined, 0);
    return st && Array.isArray(st.members) ? st : undefined;
  } catch (error) {
    return undefined;
  }
}

function structName(st) {
  return st && st.name && st.name !== "unnamed" ? st.name : undefined;
}

function walkStruct(api, struct, prefix, depth, maxDepth, out, visited) {
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
        propType: dpath.data && dpath.data.constructor ? dpath.data.constructor.name : "unknown"
      });
    } else if (dpath.type === DataTypes.STRUCT || dpath.type === DataTypes.DYNAMIC_STRUCT) {
      let dynamic = dpath.type === DataTypes.DYNAMIC_STRUCT;
      let child = dpath.data;

      out.push({
        path,
        kind      : dynamic ? "dynamicStruct" : "struct",
        structName: structName(child)
      });

      if (child && !visited.has(child) && depth + 1 <= maxDepth) {
        walkStruct(api, child, path, depth + 1, maxDepth, out, new Set(visited).add(child));
      }
    } else if (dpath.type === DataTypes.ARRAY) {
      let elem = getListElementStruct(api, dpath);

      out.push({
        path,
        kind      : "list",
        structName: structName(elem)
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
  let out = [];

  if (!root) {
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
  let api = getApi(), ctx = getCtx();
  let entries = walkPaths(maxDepth);

  let ok = [], failed = [];

  for (let entry of entries) {
    if (entry.path.includes("[n]")) {
      continue; /* not a concrete path */
    }

    try {
      let res = api.resolvePath(ctx, entry.path, true);

      if (res === undefined) {
        failed.push({path: entry.path, error: "unresolved"});
        continue;
      }

      if (entry.kind === "prop") {
        api.getValue(ctx, entry.path);
      }

      ok.push(entry.path);
    } catch (error) {
      failed.push({path: entry.path, error: "" + (error.message || error)});
    }
  }

  return {total: entries.length, ok, failed};
}

function frame() {
  return new Promise(resolve => requestAnimationFrame(() => resolve()));
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

  function poll(resolve, reject) {
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

  function drain(resolve) {
    let times = window.redraw_start_times;
    let pending = times ? Object.keys(times).length : 0;

    if (pending === 0 || performance.now() - start >= timeout) {
      frame().then(frame).then(() => resolve(true));
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

function getPath(path) {
  return getApi().getValue(getCtx(), path);
}

function setPath(path, value) {
  getApi().setValue(getCtx(), path, value);
  return true;
}

function execTool(toolpath, args = {}) {
  return getApi().execTool(getCtx(), toolpath, args);
}

function listTools() {
  let out = [];

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
function switchEditor(name) {
  let cls = areaclasses[name];

  if (!cls) {
    return Promise.reject(new Error("__fm.switchEditor(): no editor named " + name));
  }

  let screen = getApp().screen;
  let best, bestArea;

  for (let sarea of screen.sareas) {
    let area = sarea.size[0]*sarea.size[1];

    if (best === undefined || area > best) {
      best = area;
      bestArea = sarea;
    }
  }

  bestArea.switch_editor(cls);
  screen.setCSS();

  return waitIdle().then(() => true);
}

/* Structural state dump, for semantic assertions that do not depend on pixels. */
function snapshot() {
  let ctx = getCtx();
  let out = {
    editors : [],
    counts  : {},
    toolpath: undefined
  };

  let screen = getApp().screen;

  for (let sarea of screen.sareas) {
    if (sarea.area) {
      let def = sarea.area.constructor.define();
      out.editors.push(def.areaname || sarea.area.constructor.name);
    }
  }
  out.editors.sort();

  try {
    let spline = ctx.frameset.spline;

    out.counts = {
      verts   : spline.verts.length,
      handles : spline.handles.length,
      segments: spline.segments.length,
      faces   : spline.faces.length,
      layers  : spline.layerset.length
    };
  } catch (error) {
    out.counts = {error: "" + (error.message || error)};
  }

  try {
    out.toolpath = ctx.toolmode ? ctx.toolmode.constructor.name : undefined;
  } catch (error) {
    /* no toolmode */
  }

  return out;
}

/* The UI lives in shadow roots, so a plain querySelectorAll misses most of it. */
function deepQuery(tag, root = document, out = []) {
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

function distinctColors(canvas) {
  let ctx2d;

  try {
    ctx2d = canvas.getContext("2d");
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
  for (let i = 0; i + 3 < data.length; i += 4*97) {
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
  let out = [];

  for (let canvas of deepQuery("canvas")) {
    out.push({
      id      : canvas.id || undefined,
      width   : canvas.width,
      height  : canvas.height,
      distinct: distinctColors(canvas)
    });
  }

  return out;
}

/* Deserialize a .fmo passed in as a byte array (Playwright cannot hand over
   an ArrayBuffer directly through page.evaluate). */
function loadFile(bytes) {
  let view = new DataView(new Uint8Array(bytes).buffer);

  getApp().load_user_file_new(view, undefined, new unpack_ctx());

  return waitIdle().then(() => snapshot());
}

function saveFile() {
  let buf = getApp().create_user_file_new({save_toolstack: false});
  let bytes = buf.buffer ? new Uint8Array(buf.buffer) : new Uint8Array(buf);

  return Array.from(bytes);
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
  saveFile
};

window.__fm = debug_api;
