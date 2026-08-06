import {ContextOverlay, Context, LockedContext} from "../path.ux/scripts/path-controller/controller/context.js";
import {SavedToolDefaults, DataAPI} from '../path.ux/scripts/pathux.js';
import {DataLib} from './lib_api.js';
import type {AppState} from './AppState.js';
import type {ToolStack} from './toolstack.js';
import type {ToolOp} from './toolops_api.js';
import type {ToolMode} from '../editors/viewport/toolmodes/toolmode.js';
import type {AppSettings} from './UserSettings.js';

/*
 * How BaseContext.saveProperty encodes one context member so it survives an
 * undo step. Everything except "passthru" is a recipe for looking the value up
 * again: "lookup" re-reads ctx[key], "path" re-resolves a data API path and
 * "block" re-resolves a DataRef against the datalib.
 */
export interface SavedContextProperty {
  type: "passthru" | "lookup" | "path" | "block";
  key: string;
  value: unknown;
}

/* The editable() iterators read exactly one flag off the context they are
   handed, and ToggleSelectAllOp passes a bare object literal rather than a
   real context. */
export interface LayerFilterContext {
  edit_all_layers: boolean;
}

export class BaseContextOverlay extends ContextOverlay {
  /* The context this overlay was pushed onto, filled in by pushOverlay(). */
  declare ctx: FullContext | undefined;

  constructor(state: AppState = g_app_state) {
    super(state);
  }

  /* ContextOverlay types `state` as unknown; the app only ever puts an
     AppState there, and this getter is the single place that says so. */
  get appstate(): AppState {
    return this.state as AppState;
  }

  get api(): DataAPI {
    return this.appstate.pathcontroller;
  }

  get settings(): AppSettings {
    return this.appstate.settings;
  }

  get toolmode(): ToolMode | undefined {
    return this.scene ? this.scene.toolmode : undefined;
  }

  get active_area(): Editor | undefined {
    return Editor.active_area();
  }

  switch_active_spline(newpath: string): void {
    g_app_state.switch_active_spline(newpath);
  }

  get splinepath(): string {
    return g_app_state.active_splinepath === undefined ? "frameset.drawspline" : g_app_state.active_splinepath;
  }

  get filepath(): string {
    return g_app_state.filepath;
  }

  get edit_all_layers(): boolean {
    let scene = this.scene;

    return scene !== undefined ? scene.edit_all_layers : false;
  }

  /* NOTE: the two getValue() calls below were passed `this`, the overlay,
     rather than the context it belongs to. Both resolve the same properties,
     but only the context is a ContextLike. */
  get spline(): Spline {
    const ctx = this.ctx;

    if (ctx === undefined) {
      throw new Error("BaseContextOverlay was never pushed onto a context");
    }

    var ret = this.api.getValue<Spline>(ctx, g_app_state.active_splinepath);

    if (ret === undefined) {
      warntrace("Warning: bad spline path", g_app_state.active_splinepath);
      g_app_state.switch_active_spline("frameset.drawspline");

      ret = this.api.getValue<Spline>(ctx, g_app_state.active_splinepath);
      if (ret === undefined) {
        warntrace("Even Worse: base spline path failed!", g_app_state.active_splinepath);
      }
    }

    return ret as Spline;
  }

  get frameset(): SplineFrameSet {
    const ob = this.scene.objects.active;

    if (ob === undefined) {
      throw new Error("no active object in the scene");
    }

    return ob.data;
    //return g_app_state.datalib.framesets.active;
  }


  get scene(): Scene {
    var list = this.datalib.scenes;

    //sanity check
    if (list.length == 0) {
      console.warn("No scenes; adding empty scene");

      var scene = new Scene();
      scene.set_fake_user(true);

      this.datalib.add(scene);
    }

    const active = this.datalib.get_active(DataTypes.SCENE);

    if (!(active instanceof Scene)) {
      throw new Error("no active scene");
    }

    return active;
  }

  get datalib(): DataLib {
    return g_app_state.datalib;
  }

  get toolstack(): ToolStack {
    return g_app_state.toolstack;
  }

  get toolDefaults(): typeof SavedToolDefaults {
    return SavedToolDefaults;
  }

  get view2d(): View2DHandler | undefined {
    var ret = Editor.context_area(View2DHandler);

    //if (ret === undefined)
    //  ret = g_app_state.active_view2d;

    return ret; //g_app_state.active_view2d;
  }

}

export class ViewContextOverlay extends ContextOverlay {
  appstate: AppState;
  _keymap_mpos: Array<number>;

  constructor(state: AppState = g_app_state) {
    super(state);

    this.appstate = state;
    this._keymap_mpos = [0, 0];
  }

  /* NOTE: the `font` getter that used to be here read g_app_state.raster.font,
     which RasterState has never had, so ctx.font was always undefined.
     Removed; nothing in the app reads it. */

  get keymap_mpos(): number[] {
    return this._keymap_mpos;
  }

  /*make sure we're saved properly for LockedContext's*/
  keymap_mpos_save(): number[] {
    return [this._keymap_mpos[0], this._keymap_mpos[1]];
  }

  keymap_mpos_load(ctx: FullContext, data: number[]): number[] {
    return data;
  }

  get dopesheet(): DopeSheetEditor | undefined {
    return Editor.context_area(DopeSheetEditor);
  }

  get editcurve(): CurveEditor | undefined {
    return Editor.context_area(CurveEditor);
  }

  /*need to figure out a better way to pass active editor types
    around API*/
  get settings_editor(): SettingsEditor | undefined {
    return Editor.context_area(SettingsEditor);
  }

  /*need to figure out a better way to pass active editor types
    around API*/
  get opseditor(): OpStackEditor | undefined {
    return Editor.context_area(OpStackEditor);
  }

  get selectmode(): int {
    const view2d = this.view2d;

    if (view2d === undefined) {
      throw new Error("no viewport");
    }

    return view2d.selectmode;
  }

  get console(): ConsoleEditor | undefined {
    return Editor.context_area(ConsoleEditor);
  }

  get view2d(): View2DHandler | undefined {
    var ret = Editor.context_area(View2DHandler);

    //if (ret === undefined)
    //  ret = g_app_state.active_view2d;

    return ret; //g_app_state.active_view2d;
  }

  get screen(): FairmotionScreen {
    return g_app_state.screen;
  }
}

export class BaseContext extends Context {
  /* Context types `state` as unknown; the app only ever puts an AppState
     there. */
  declare state: AppState;

  datalib!: DataLib;
  frameset!: SplineFrameSet
  spline!: Spline
  scene!: Scene
  toolstack!: ToolStack;
  /* path.ux's ContextLike requires `api : DataAPI<this>`; the app only ever
     builds one API and it is defined over FullContext. */
  api!: DataAPI<FullContext>
  selectmode!: int;

  /* The rest of what BaseContextOverlay supplies. Without these, every lookup
     falls through Context's `[key : string] : unknown` index signature. */
  appstate!: AppState;
  settings!: AppSettings;
  toolmode!: ToolMode | undefined;
  active_area!: Editor | undefined;
  splinepath!: string;
  filepath!: string;
  edit_all_layers!: boolean;
  toolDefaults!: typeof SavedToolDefaults;
  view2d!: View2DHandler | undefined;
  declare switch_active_spline: (newpath: string) => void;

  /* LockedContext copies every context property onto itself, so it stands in
     for the context it was built from; path.ux's ContextLike makes the same
     claim with `toLocked?(): this`, and the rest of the app types locked
     contexts as FullContext (see ToolOp.modal_tctx). */
  declare toLocked: () => LockedContext & this;

  constructor(state = g_app_state) {
    super(state);

    this.resetOverlays(state);
  }

  get last_tool(): ToolOp | undefined {
    return this.toolstack.head;
  }

  error(msg: string): void {
    g_app_state.notes.label("ERROR: " + msg);
  }

  report(msg: string): void {
    g_app_state.notes.label(msg);
  }

  /* Not called `reset`: path.ux's Context.reset(have_new_file) is a different
     method that clears the overlay stack. */
  resetOverlays(state: AppState = this.state): void {
    this.pushOverlay(new BaseContextOverlay(state));
  }

  /* One entry of a SavedContext: enough to find the value again after an undo
     step reloaded the file and invalidated every object identity. */
  saveProperty(key: string): SavedContextProperty {
    let v = this[key];

    function passthru(v: unknown): SavedContextProperty {
      return {
        type : "passthru",
        key  : key,
        value: v
      };
    }

    function lookup(v: unknown): SavedContextProperty {
      return {
        type : "lookup",
        key  : key,
        value: v
      };
    }

    if (!v) return passthru(v);

    if (typeof v !== "object") {
      return passthru(v);
    }

    if (key === "spline") {
      return {
        type : "path",
        key  : key,
        value: this.splinepath
      }
    } else if (v instanceof DataBlock) {
      return {
        type : "block",
        key  : key,
        value: new DataRef(v)
      }
    }

    return lookup(v);
  }

  loadProperty(ctx: FullContext, key: string, val: SavedContextProperty) {
    if (val.type === "lookup") {
      return ctx[val.key];
    } else if (val.type === "path" && typeof val.value === "string") {
      return ctx.api.getValue(ctx, val.value);
    } else if (val.type === "passthru") {
      return val.value;
    } else if (val.type === "block" && val.value instanceof DataRef) {
      return ctx.datalib.get(val.value);
    }
  }
}

export class FullContext extends BaseContext {
  view2d!: View2DHandler
  screen!: FairmotionScreen;

  /* The rest of what ViewContextOverlay supplies; see BaseContext. */
  keymap_mpos!: number[];
  dopesheet!: DopeSheetEditor | undefined;
  editcurve!: CurveEditor | undefined;
  settings_editor!: SettingsEditor | undefined;
  opseditor!: OpStackEditor | undefined;
  console!: ConsoleEditor | undefined;

  constructor(state = g_app_state) {
    super(state);

    this.resetOverlays(state);
  }

  resetOverlays(state = this.state) {
    super.resetOverlays(state);
    this.pushOverlay(new ViewContextOverlay(state));
  }
}

window.Context = FullContext; //XXX track down and kill all references to this dirty, dirty global

import {SplineFrameSet} from './frameset.js';
import {DataTypes, DataBlock, DataRef} from "./lib_api.js";

import {Editor, FairmotionScreen} from "../editors/editor_base.js";
import {SettingsEditor} from '../editors/settings/SettingsEditor.js';
import {CurveEditor} from '../editors/curve/CurveEditor.js';
import {OpStackEditor} from '../editors/ops/ops_editor.js';
import {ConsoleEditor} from '../editors/console/console.js';
import {DopeSheetEditor} from '../editors/dopesheet/DopeSheetEditor.js';

import {View2DHandler} from '../editors/viewport/view2d.js';
import {Scene} from "../scene/scene.js";
import {Spline} from "../curve/spline.js";
//import {ToolStack} from './toolstack.js';
