import {Area, ScreenArea} from '../path.ux/scripts/screen/ScreenArea.js';
import {Screen} from '../path.ux/scripts/screen/FrameManager.js';
import {STRUCT} from '../core/struct.js';
import * as ui_base from '../path.ux/scripts/core/ui_base.js';
import * as util from '../path.ux/scripts/util/util.js';
import {KeyMap, ToolKeyHandler, FuncKeyHandler, HotKey,
  charmap, TouchEventManager, EventHandler} from './events.js';
import {ModalStates} from '../core/toolops_api.js';

export var _area_active_stacks = {}; //last active stacks for each area type
export var _area_active_lasts = {};
export var _area_main_stack = []; //combined stack of all area types

var _last_area = undefined;

function _get_area_stack(cls) {
  var h = cls.name;

  if (!(h in _area_active_stacks)) {
    _area_active_stacks[h] = new Array();
  }

  return _area_active_stacks[h];
};

export function resetAreaStacks() {
  _area_main_stack.length = 0;

  for (let k in _area_active_lasts) {
    _area_active_lasts[k].length = 0;
  }

  for (let k in _area_active_stacks) {
    _area_active_stacks[k].length = 0;
  }

  _last_area = undefined;
}

/*
primary app screen subclass
*/
export class FairmotionScreen extends Screen {
  ctx : FullContext;

  constructor() {
    super();

    //used by playback
    this.startFrame = 1;
    this._lastFrameTime = util.time_ms();
    this.define_keymap();
  }

  init() {
    this.define_keymap();
  }

  define_keymap() {
    this.keymap = new KeyMap("screen");
    var k = this.keymap;

    k.add_tool(new HotKey("O", ["CTRL"], "Open File"),
      "appstate.open()");
    k.add_tool(new HotKey("O", ["CTRL", "SHIFT"], "Open Recent"),
      "appstate.open_recent()");
    k.add_tool(new HotKey("S", ["CTRL", "ALT"], "Save File"),
      "appstate.save_as()");
    k.add_tool(new HotKey("S", ["CTRL"], "Save File"),
      "appstate.save()");
    k.add_func(new HotKey("U", ["CTRL", "SHIFT"]), function() {
       ("saving new startup file.");
      g_app_state.set_startup_file();
    });

    k.add_tool(new HotKey("Left", ["CTRL"], "Previous Keyframe"),
               "anim.nextprev(dir=-1)");
    k.add_tool(new HotKey("Right", ["CTRL"], "Next Keyframe"),
      "anim.nextprev(dir=1)");

    k.add(new HotKey("Space", [], "Animation Playback"), new FuncKeyHandler(() => {
      this.ctx.screen.togglePlayback();
    }));
    k.add(new HotKey("Escape", [], "Animation Playback"), new FuncKeyHandler(() => {
      this.ctx.screen.stopPlayback();
    }));

    k.add(new HotKey("Z", ["CTRL", "SHIFT"], "Redo"), new FuncKeyHandler(function(ctx : FullContext) {
      console.log("Redo")
      ctx.toolstack.redo();
    }));
    k.add(new HotKey("Y", ["CTRL"], "Redo"), new FuncKeyHandler(function(ctx : FullContext) {
      console.log("Redo")
      ctx.toolstack.redo();
    }));
    k.add(new HotKey("Z", ["CTRL"], "Undo"), new FuncKeyHandler(function(ctx : FullContext) {
      console.log("Undo");
      ctx.toolstack.undo();
    }));
  }

  * getKeySets() {
    let this2 = this;

    yield new KeymapSet("General", "screen", [this2.keymap]);

    for (let sarea of this2.sareas) {
      if (!sarea.area) continue;

      let area = sarea.area;
      let uiname = area.constructor.define().uiname || area.constructor.name;
      let path = area.constructor.name;

      let km = sarea.area.getKeyMaps();
      if (!(km instanceof KeymapSet)) {
        km = new KeymapSet(uiname, path, km);
      }

      yield km;
    }
  }

  on_keyup(e) {
    if (g_app_state.eventhandler !== this)
      return g_app_state.eventhandler.on_keyup(e);
  }

  on_keydown(e : Object) {
    if (g_app_state.eventhandler !== this)
      return g_app_state.eventhandler.on_keydown(e);

    if (this.keymap.process_event(this.ctx, e)) {
      return;
    }

    let area = this.pickElement(this.mpos[0], this.mpos[1], undefined, undefined, Area);

    if (area === undefined) {
      return;
    }

    area.push_ctx_active();
    var ret = false;

    try {
      ret = area.keymap.process_event(this.ctx, e);
    } catch (error) {
      print_stack(error);
      console.log("Error executing hotkey");
    }

    area.pop_ctx_active();
    return ret;
  }

  stopPlayback() {
    if (g_app_state.modalstate === ModalStates.PLAYING) {
      console.log("Playback end");

      g_app_state.popModalState(ModalStates.PLAYING);
      this._lastFrameTime = util.time_ms();

      //this.ctx.scene.change_time(this.ctx, this.startFrame, false);
      //the_global_dag.exec();
      window.redraw_viewport();
    }
  }

  togglePlayback() {
    if (g_app_state.modalstate === ModalStates.PLAYING) {
      console.log("Playback end");

      g_app_state.popModalState(ModalStates.PLAYING);
      this._lastFrameTime = util.time_ms();

      //this.ctx.scene.change_time(this.ctx, this.startFrame, false);
      //the_global_dag.exec();
      window.redraw_viewport();
    } else {
      this.startFrame = this.ctx.scene.time;
      console.log("Playback start");
      g_app_state.pushModalState(ModalStates.PLAYING);
    }
  }

  update() {
    super.update();

    if (g_app_state.modalstate === ModalStates.PLAYING) {
      let scene = this.ctx.scene;

      let dt = util.time_ms() - this._lastFrameTime;
      let fps = scene.fps;

      if (dt > 1000.0 / fps) {
        scene.change_time(this.ctx, scene.time+1);
        this._lastFrameTime = util.time_ms();
      }
    }

    if (this.ctx && this.ctx.scene) {
      this.ctx.scene.on_tick(this.ctx);
    }

    the_global_dag.exec();
  }

  static define() {return {
    tagname : "fairmotion-screen-x"
  };}
}

FairmotionScreen.STRUCT = STRUCT.inherit(FairmotionScreen, Screen) + `
}
`;
ui_base.UIBase.register(FairmotionScreen);

export class KeymapSet extends Array {
  constructor(name, path, keymaps) {
    super();

    this.name = name;
    this.path = path;

    if (keymaps) {
      for (let keymap of keymaps) {
        this.push(keymap);
      }
    }
  }
}

export class Editor extends Area {
  canvases : Object;

  constructor() {
    super();

    this.canvases = {};
  }

  makeHeader(container : Container) {
    return super.makeHeader(container);
  }

  init() {
    super.init();

    if (!this.container) {
      this.container = document.createElement("container-x");
      this.container.ctx = this.ctx;

      this.container.style["width"] = "100%";
      this.shadow.appendChild(this.container);

      this.makeHeader(this.container);
    }

    this.keymap = new KeyMap(this.constructor.define().uiname || this.constructor.name);

    if (this.helppicker) {
      this.helppicker.iconsheet = 0;
    }

    this.style["overflow"] = "hidden";
    this.setCSS();
  }

  getCanvas(id : string, zindex : number, patch_canvas2d_matrix=true, dpi_scale=1.0) {
    let canvas;
    let dpi = ui_base.UIBase.getDPI();

    if (id in this.canvases) {
      canvas = this.canvases[id];
    } else {
      console.log("creating new canvas", id, zindex);

      canvas = this.canvases[id] = document.createElement("canvas");
      canvas.g = this.canvases[id].getContext("2d");

      this.shadow.prepend(canvas);

      canvas.style["position"] = "absolute";
    }

    canvas.dpi_scale = dpi_scale;

    if (canvas.style["z-index"] !== zindex) {
      canvas.style["z-index"] = zindex;
    }

    if (this.size !== undefined) {
      let w = ~~(this.size[0] * dpi*dpi_scale);
      let h = ~~(this.size[1] * dpi*dpi_scale);

      let sw = (w/dpi/dpi_scale) + "px";
      let sh = (h/dpi/dpi_scale) + "px";

      if (canvas.style["left"] !== "0px") {
        canvas.style["left"] =  "0px";
        canvas.style["top"] = "0px";
      }

      if (canvas.width !== w || canvas.style["width"] !== sw) {
        canvas.width = w;
        canvas.style["width"] = sw;
      }

      if (canvas.height !== h || canvas.style["height"] !== sh) {
        canvas.height = h;
        canvas.style["height"] = sh;
      }
    }

    return canvas;
  }

  on_destroy() {

  }

  /**
   * mostly called by AppState.load_undo_file,
   * called when a file is loaded into an existing screen UI
   * */
  on_fileload(ctx) {

  }

  data_link(block : DataBlock, getblock : Function, getblock_us : Function) {

  }

  static register(cls) {
    return Area.register(cls);
  }

  static active_area() {
    let ret = _area_main_stack[_area_main_stack.length-1];
    if (ret === undefined) {
      ret = _last_area;
    }

    return ret;
  }
  
  static context_area(cls) {
    var stack = _get_area_stack(cls.name);

    if (stack.length === 0)
      return _area_active_lasts[cls.name];
    else
      return stack[stack.length - 1];
  }

  //wraps an event handler so that it calls this.push_ctx_active/pop_ctx_active
  static wrapContextEvent(f) {
    return function(e) {
      this.push_ctx_active();

      try {
        f(e);
      } catch (error) {
        print_stack(error);
        console.warn("Error executing area", e.type,"callback");
      }

      this.pop_ctx_active();
    }
  }

  push_ctx_active(ctx) {
    var stack = _get_area_stack(this.constructor);
    stack.push(this);
    _area_active_lasts[this.constructor.name] = this;

    _area_main_stack.push(_last_area);
    _last_area = this;
  }

  pop_ctx_active(ctx) {
    let cls = this.constructor;

    var stack = _get_area_stack(cls);

    if (stack.length === 0 || stack[stack.length - 1] !== this) {
      console.trace();
      console.log("Warning: invalid Area.pop_active() call");
      return;
    }

    stack.pop();

    if (stack.length > 0) {
      _area_active_lasts[cls.name] = stack[stack.length - 1];
    }

    let area = _area_main_stack.pop();
    if (area !== undefined) {
      _last_area = area;
    }
  }
}

Editor.STRUCT = STRUCT.inherit(Editor, Area) + `
}
`;

import {FullContext} from "../core/context.js";