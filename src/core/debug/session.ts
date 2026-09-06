/* Driving the running app: reading and writing datapaths, running tools,
   switching editors, loading and saving documents, and the two structural
   reports a spec asserts against instead of comparing pixels.

   snapshot() is the semantic one -- which editors are mounted and how many
   elements the spline holds.  canvasReport() is the pixel-adjacent one, and
   counts distinct colours rather than comparing an image, because an exact
   comparison across rendering backends is hopeless. */

import { areaclasses, getAreaConstructor } from "../../path.ux/scripts/screen/area_base.js";
import { ToolClasses } from "../../path.ux/scripts/path-controller/toolsys/toolsys.js";

import { unpack_ctx } from "../ajax.js";
import { manager as renderThreads } from "../../vectordraw/vectordraw_jobs.js";
import { errorText, getApi, getApp, getCtx, waitIdle } from "./app.js";

/* These three are the bridge's front door; the app is up by the time a test
   calls them. */
export function getPath(path: string) {
  return getApi()!.getValue(getCtx()!, path);
}

export function setPath(path: string, value: unknown) {
  getApi()!.setValue(getCtx()!, path, value);
  return true;
}

export function execTool(toolpath: string, args: { [k: string]: unknown } = {}) {
  return getApi()!.execTool(getCtx()!, toolpath, args);
}

export function listTools() {
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

export function listEditors() {
  return Object.keys(areaclasses).sort();
}

/* Switch the largest screen area to the named editor class. */
export function switchEditor(name: string) {
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
export function snapshot() {
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
   rendering backends. */
export function canvasReport() {
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
export function loadFile(bytes: number[]) {
  let view = new DataView(new Uint8Array(bytes).buffer);

  getApp().load_user_file_new(view, undefined, new unpack_ctx());

  return waitIdle().then(() => snapshot());
}

export function saveFile() {
  let buf = getApp().create_user_file_new({ save_toolstack: false });
  /* create_user_file_new() hands back a DataView unless asked otherwise. */
  let bytes = new Uint8Array(buf.buffer);

  return Array.from(bytes);
}

/* The render-worker layer, and a way to pull the rug out from under it.
   `outstanding` counts posted jobs whose promise has not settled, which is
   the thing a cancel is supposed to leave at zero. */
export function renderJobs() {
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

export function cancelRenderJobs() {
  renderThreads.cancelAllJobs();
  return renderJobs();
}
