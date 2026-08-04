import {ContextOverlay, Context} from "../path.ux/scripts/path-controller/controller/context.js";
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

export class BaseContextOverlay extends ContextOverlay {
  constructor(state: AppState = g_app_state) {
    super(state);
  }

  get appstate(): AppState {
    return this.state;
  }

  get api(): DataAPI {
    return this.state.pathcontroller;
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

  get spline(): Spline {
    var ret = this.api.getValue(this, g_app_state.active_splinepath);

    if (ret === undefined) {
      warntrace("Warning: bad spline path", g_app_state.active_splinepath);
      g_app_state.switch_active_spline("frameset.drawspline");

      ret = this.api.getValue(this, g_app_state.active_splinepath);
      if (ret === undefined) {
        warntrace("Even Worse: base spline path failed!", g_app_state.active_splinepath);
      }
    }

    return ret;
  }

  get frameset(): SplineFrameSet {
    return this.scene.objects.active.data;
    //return g_app_state.datalib.framesets.active;
  }


  get scene(): Scene {
    var list = this.datalib.scenes;

    //sanity check
    if (list.length == 0) {
      console.warn("No scenes; adding empty scene");

      var scene = new Scene();
      scene.set_fake_user();

      this.datalib.add(scene);
    }

    return this.datalib.get_active(DataTypes.SCENE);
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

  get font() {
    return g_app_state.raster.font;
  }

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

  get dopesheet(): DopeSheetEditor {
    return Editor.context_area(DopeSheetEditor);
  }

  get editcurve(): CurveEditor {
    return Editor.context_area(CurveEditor);
  }

  /*need to figure out a better way to pass active editor types
    around API*/
  get settings_editor(): SettingsEditor {
    return Editor.context_area(SettingsEditor);
  }

  /*need to figure out a better way to pass active editor types
    around API*/
  get opseditor(): OpStackEditor {
    return Editor.context_area(OpStackEditor);
  }

  get selectmode(): int {
    return this.view2d.selectmode;
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
  datalib!: DataLib;
  frameset!: SplineFrameSet
  spline!: Spline
  scene!: Scene
  toolstack!: ToolStack;
  api!: DataAPI
  selectmode!: int;

  constructor(state = g_app_state) {
    super(state);

    this.reset(state);
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

  reset(state: AppState = this.state): void {
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
    } else if (val.type === "path") {
      return ctx.api.getValue(ctx, val.value);
    } else if (val.type === "passthru") {
      return val.value;
    } else if (val.type === "block") {
      return ctx.datalib.get(val.value);
    }
  }
}

export class FullContext extends BaseContext {
  view2d!: View2DHandler
  screen!: FairmotionScreen;

  constructor(state = g_app_state) {
    super(state);

    this.reset(state);
  }

  reset(state = this.state) {
    super.reset(state);
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
