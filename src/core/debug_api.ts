"use strict";

/* Test/debug bridge, published as window.__fm.
   Playwright reaches it with page.evaluate; buildtools/cdp.mjs reaches the
   same object in an electron build over CDP. One API, both modes.

   Only the assembly is here.  The entry points themselves live under debug/:
   app.ts finds the running app and waits for it, datapaths.ts walks the
   registered datapath tree, session.ts drives the app and reports on it,
   draw_probes.ts reads what one draw pass produced, and stroke_parity.ts holds
   the wasm stroker and the scene evaluators to the JS originals. */

import { ready, waitIdle } from "./debug/app.js";
import { sweepPaths, walkPaths } from "./debug/datapaths.js";
import {
  canvasReport,
  cancelRenderJobs,
  execTool,
  getPath,
  listEditors,
  listTools,
  loadFile,
  renderJobs,
  saveFile,
  setPath,
  snapshot,
  switchEditor,
} from "./debug/session.js";
import {
  heapGrowthCheck,
  pathDump,
  sceneCheck,
  trimReport,
  widthNetParity,
} from "./debug/draw_probes.js";
import {
  strokeArtifacts,
  strokeGolden,
  strokeWasmParity,
  strokerEvalParity,
} from "./debug/stroke_parity.js";

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
  strokeArtifacts,
  strokeWasmParity,
};

window.__fm = debug_api;
