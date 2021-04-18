import {ContextOverlay, Context} from "../path.ux/scripts/path-controller/controller/context.js";
import {SavedToolDefaults} from '../path.ux/scripts/pathux.js';

export class BaseContextOverlay extends ContextOverlay {
  constructor(state=g_app_state) {
    super(state);
  }

  get appstate() {
    return this.state;
  }

  get api() {
    return this.state.pathcontroller;
  }

  get settings() {
    return this.appstate.settings;
  }

  get toolmode() {
    return this.scene ? this.scene.toolmode : undefined;
  }

  get active_area() {
    return Editor.active_area();
  }

  switch_active_spline(newpath) {
    g_app_state.switch_active_spline(newpath);
  }

  get splinepath() : String {
    return g_app_state.active_splinepath === undefined ? "frameset.drawspline" : g_app_state.active_splinepath;
  }

  get filepath() : String {
    return g_app_state.filepath;
  }

  get edit_all_layers() {
    let scene = this.scene;

    return scene !== undefined ? scene.edit_all_layers : false;
  }

  get spline() : FrameSet {
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

  get frameset() : SplineFrameSet {
    return this.scene.objects.active.data;
    //return g_app_state.datalib.framesets.active;
  }



  get scene() {
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
  get datalib() {
    return g_app_state.datalib;
  }

  get toolstack() {
    return g_app_state.toolstack;
  }

  get toolDefaults() {
    return SavedToolDefaults;
  }

  get view2d() {
    var ret = Editor.context_area(View2DHandler);

    //if (ret === undefined)
    //  ret = g_app_state.active_view2d;

    return ret; //g_app_state.active_view2d;
  }

}

export class ViewContextOverlay extends ContextOverlay {
  _keymap_mpos : Array<number>;

  constructor(state = g_app_state) {
    super(state);

    this.appstate = state;
    this._keymap_mpos = [0, 0];
  }

  get font() {
    return g_app_state.raster.font;
  }

  get keymap_mpos() {
    return this._keymap_mpos;
  }

  /*make sure we're saved properly for LockedContext's*/
  keymap_mpos_save() {
    return [this._keymap_mpos[0], this._keymap_mpos[1]];
  }

  keymap_mpos_load(ctx, data) {
    return data;
  }

  get dopesheet() : DopeSheetEditor {
    return Editor.context_area(DopeSheetEditor);
  }

  get editcurve() : CurveEditor {
    return Editor.context_area(CurveEditor);
  }

  /*need to figure out a better way to pass active editor types
    around API*/
  get settings_editor() : SettingsEditor {
    return Editor.context_area(SettingsEditor);
  }
  /*need to figure out a better way to pass active editor types
    around API*/
  get opseditor() : OpStackEditor {
    return Editor.context_area(OpStackEditor);
  }

  get selectmode() {
    return this.view2d.selectmode;
  }

  get console() {
    return  Editor.context_area(ConsoleEditor);
  }

  get view2d() {
    var ret = Editor.context_area(View2DHandler);

    //if (ret === undefined)
    //  ret = g_app_state.active_view2d;

    return ret; //g_app_state.active_view2d;
  }

  get screen() {
    return g_app_state.screen;
  }
}

export class BaseContext extends Context {
  constructor(state=g_app_state) {
    super(state);

    this.reset(state);
  }

  error(msg) {
    g_app_state.notes.label("ERROR: " + msg);
  }

  report(msg) {
    g_app_state.notes.label(msg);
  }

  reset(state=this.state) {
    this.pushOverlay(new BaseContextOverlay(state));
  }

  saveProperty(key) {
    let v = this[key];

    function passthru(v) {
      return {
        type  : "passthru",
        key   : key,
        value : v
      };
    }

    function lookup(v) {
      return {
        type  : "lookup",
        key   : key,
        value : v
      };
    }

    if (!v) return passthru(v);

    if (typeof v !== "object") {
      return passthru(v);
    }

    if (key === "spline") {
      return {
        type  : "path",
        key   : key,
        value : this.splinepath
      }
    } else if (v instanceof DataBlock) {
      return {
        type   : "block",
        key    : key,
        value  : new DataRef(v)
      }
    }

    return lookup(v);
  }

  loadProperty(ctx, key, val) {
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
  frameset : SplineFrameSet
  spline   : Spline
  view2d   : View2DHandler
  scene    : Scene
  api      : DataAPI;

  constructor(state=g_app_state) {
    super(state);

    this.reset(state);
  }

  reset(state=this.state) {
    super.reset(state);
    this.pushOverlay(new ViewContextOverlay(state));
  }
}

window.Context = FullContext; //XXX track down and kill all references to this dirty, dirty global

import {SplineFrameSet} from './frameset.js';
import {SettingsEditor} from "../editors/settings/SettingsEditor.js";
import {MenuBar} from "../editors/menubar/MenuBar.js";
import {DataTypes, DataBlock} from "./lib_api.js";
import {ConsoleEditor} from '../editors/console/console.js';
import {CurveEditor} from '../editors/curve/CurveEditor.js';
import {OpStackEditor} from '../editors/ops/ops_editor.js';
import {MaterialEditor} from "../editors/material/MaterialEditor.js";
import {DopeSheetEditor} from "../editors/dopesheet/DopeSheetEditor.js";
import {SettingsEditor} from '../editors/settings/SettingsEditor.js';
import {MenuBar} from '../editors/menubar/MenuBar.js';
import {registerToolStackGetter} from '../path.ux/scripts/screen/FrameManager_ops.js';
import {FairmotionScreen, resetAreaStacks} from '../editors/editor_base.js';

import {Editor} from "../editors/editor_base.js";

import {View2DHandler} from '../editors/viewport/view2d.js';
import {Scene} from "../scene/scene.js";
import {Spline} from "../curve/spline.js";
import {DataAPI} from "./data_api/data_api.js";
