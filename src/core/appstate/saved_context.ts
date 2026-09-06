/* Contexts that outlive the moment they were built.

   A tool's properties keep a reference to the context they ran under, and the
   undo stack is serialized, so that context has to survive a save/load round
   trip.  SavedContext stores one entry per live context property saying how to
   find the value again -- a lib_id, a data-API path, or a plain value -- and
   installs a getter per key that re-resolves it against the live context.
   Anything that was a bare object cannot be saved at all and is tagged
   "lookup", which reads back off the current context.

   _ToolContext is the unrelated other half of this file: a small fixed context
   handed to tools that only need the frameset, spline and scene. */

import { DataLib } from "../lib_api.js";
import { FullContext } from "../context.js";

import type { DataAPI } from "../../path.ux/scripts/pathux.js";
import type { SavedContextProperty } from "../context.js";
import type { FairmotionScreen } from "../../editors/editor_base.js";
import type { Scene } from "../../scene/scene.js";
import type { Spline } from "../../curve/spline.js";
import type { SplineFrameSet } from "../frameset.js";
import type { ToolStack } from "../toolstack.js";
import type { AppState } from "./appstate.js";

/* The subset of a context an undo step needs to restore. Exported because
   toolstack.ts and toolops_api.ts both name it. */
export class SavedContext {
  static STRUCT: string;

  /*
   * One entry per context property that was live when the tool ran. `type`
   * mirrors the context overlay's own tag: "block" stores a lib_id to look up,
   * "path" a data-API path to re-evaluate, "passthru" a plain value, and
   * "lookup" a value that was an object and so could not be saved at all.
   */
  _props: { [k: string]: { type: string; key: string; value?: unknown } };

  /* Only set when the saved context pinned a specific library; otherwise reads
     fall through to the live g_app_state.datalib. */
  _datalib?: DataLib;

  state!: AppState;
  api!: DataAPI;
  toolstack!: ToolStack;
  screen?: FairmotionScreen;

  /* Written by the STRUCT script, consumed and deleted by loadSTRUCT(). */
  json?: string;

  /* ctx is optional: view2d_ops constructs an empty SavedContext, which the
     else branch fills from g_app_state. */
  constructor(ctx?: FullContext) {
    this._props = {};

    this._datalib = undefined;

    if (ctx) {
      this.save(ctx);
    } else {
      ctx = g_app_state.ctx;

      this.state = g_app_state;
      this.datalib = ctx.datalib;
      this.api = ctx.api;
      this.toolstack = ctx.toolstack;
    }
  }

  get datalib(): DataLib {
    if (this._datalib) {
      return this._datalib;
    }

    return g_app_state.datalib;
  }

  set datalib(d: DataLib) {
    this._datalib = d;
  }

  /* Installs a getter for one saved property that re-resolves it against the
     live context each time it is read. */
  make(k: string) {
    if (k === "datalib") {
      return;
    }

    Object.defineProperty(this, k, {
      get: function () {
        let ctx = g_app_state.ctx;

        let v = this._props[k];

        if (v.type === "block") {
          return ctx.datalib.get(v.value);
        } else if (v.type === "passthru") {
          return v.value;
        } else if (v.type === "path") {
          return ctx.api.getValue(ctx, v.value);
        } else {
          return ctx[k];
        }
      },
    });
  }

  set_context(ctx: FullContext) {
    //not necassary anymore
  }

  save(ctx: FullContext) {
    this.state = ctx.state;
    this.datalib = ctx.datalib;
    this.api = ctx.api;
    this.toolstack = ctx.toolstack;
    this.screen = ctx.screen;
    this._props = {};

    /* Reassigning the parameter would hide the locked type, so keep it apart. */
    const lctx = ctx.toLocked();

    for (let k in lctx.props) {
      /* path.ux types an overlay's payload `unknown`; what fairmotion puts
         there is always BaseContext.saveProperty's record. */
      let v = lctx.props[k].data as SavedContextProperty;

      let val: unknown = v.value;
      let type: string = v.type;

      if (v.type === "passthru" && typeof val === "object") {
        val = undefined;
        type = "lookup";
      }

      if (v.type !== "block" && typeof val === "object") {
        val = undefined;
      }

      this._props[k] = {
        type : type,
        key  : k,
        value: val,
      };

      this.make(k);
    }
  }

  saveJSON() {
    return JSON.stringify(this._props);
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);

    let json;

    try {
      json = JSON.parse(this.json!);
    } catch (error) {
      console.warn("json error");
      json = {};
    }

    for (let k in json) {
      this._props[k] = json[k];
      this.make(k);
    }

    delete this.json;
  }
}

SavedContext.STRUCT = `
SavedContext {
  json : string | this.saveJSON();
}
`;
window.SavedContext = SavedContext;

/* NOTE: an unreachable SavedContextOld class used to sit here -- never
   instantiated, never exported, never registered, and its STRUCT script
   duplicated SavedContext's own struct name. Removed. */

/*
  The Context classes represent a set of common arguments that
  are passed to various parts of the API (especially the tool
  and data/UI APIs).  Like most of the rest of the tool API,
  it's inspired by what Blender does.
*/

//restricted context for tools
export class _ToolContext {
  datalib: DataLib;
  splinepath: string;
  frameset: SplineFrameSet;
  spline: Spline;
  scene: Scene;
  edit_all_layers: boolean;
  api: DataAPI;

  /* Every argument falls back to the live context when left undefined. */
  constructor(frameset?: SplineFrameSet, spline?: Spline, scene?: Scene, splinepath?: string) {
    let ctx = new FullContext().toLocked();

    if (splinepath === undefined) splinepath = ctx.splinepath;

    if (frameset === undefined) frameset = ctx.frameset;

    if (spline === undefined && frameset !== undefined) spline = ctx.spline;

    if (scene === undefined) scene = ctx.scene;

    this.datalib = g_app_state.datalib;

    this.splinepath = splinepath;
    this.frameset = frameset;
    this.spline = spline!;
    this.scene = scene;
    this.edit_all_layers = ctx.edit_all_layers;

    this.api = g_app_state.api;
  }
}
