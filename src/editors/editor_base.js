import {Area, areaclasses, contextWrangler, ScreenArea} from '../path.ux/scripts/screen/ScreenArea.js';
import {Screen} from '../path.ux/scripts/screen/FrameManager.js';
import {STRUCT} from '../core/struct.js';
import * as ui_base from '../path.ux/scripts/core/ui_base.js';
import * as util from '../path.ux/scripts/util/util.js';
import {ModalStates} from '../core/toolops_api.js';
import {HotKey, KeyMap} from '../core/keymap.js';
import {haveModal} from '../path.ux/scripts/pathux.js';

export function resetAreaStacks() {
  contextWrangler.reset();
}

/*
primary app screen subclass
*/
export class FairmotionScreen extends Screen {
  ctx: FullContext;

  constructor() {
    super();

    this._last_keymap_gen = -1;

    //used by playback
    this.startFrame = 1;
    this._lastFrameTime = util.time_ms();
    this.define_keymap();
  }

  init() {
    this.define_keymap();
  }

  define_keymap() {
    let k = this.keymap = new KeyMap("screen");

    /*
    class FuncKeyHandler {
      constructor(f) {
        this.f = f;
      }
    }

    let k = {
      add_tool: (hotkey, tool) => {
        tool = typeof tool === "object" && tool instanceof FuncKeyHandler ? tool.f : tool;

        hotkey.uiname = ""+hotkey.action;
        hotkey.action = tool;

        this.keymap.add(hotkey);
      },

      add: (hotkey, action) => {
        action = typeof action === "object" && action instanceof FuncKeyHandler ? action.f : action;

        hotkey.uiname = ""+hotkey.action;
        hotkey.action = action;

        this.keymap.add(hotkey);
      },

      add_func: (hotkey, action) => {
        action = typeof action === "object" && action instanceof FuncKeyHandler ? action.f : action;

        hotkey.uiname = ""+hotkey.action;
        hotkey.action = action;

        this.keymap.add(hotkey);
      },
    };
    */

    k.add(new HotKey("O", ["CTRL"], "appstate.open()"));
    k.add(new HotKey("O", ["CTRL", "SHIFT"], "appstate.open_recent()"));
    k.add(new HotKey("S", ["CTRL", "ALT"], "appstate.save_as()"));
    k.add(new HotKey("S", ["CTRL"], "appstate.save()"));
    k.add(new HotKey("U", ["CTRL", "SHIFT"], function () {
      g_app_state.set_startup_file();
    }, "Save Startup File"));

    k.add(new HotKey("Left", ["CTRL"], "anim.nextprev(dir=-1)|Previous Keyframe"));
    k.add(new HotKey("Right", ["CTRL"], "anim.nextprev(dir=1)|Next Keyframe"));

    k.add(new HotKey("Space", [], () => {
      this.ctx.screen.togglePlayback();
    }, "Animation Playback"));
    k.add(new HotKey("Escape", [], () => {
      this.ctx.screen.stopPlayback();
    }, "Animation Playback"));

    k.add(new HotKey("Z", ["CTRL", "SHIFT"], function (ctx: FullContext) {
      console.log("Redo")
      ctx.toolstack.redo();
    }, "Redo"));
    k.add(new HotKey("Y", ["CTRL"], function (ctx: FullContext) {
      console.log("Redo")
      ctx.toolstack.redo();
    }, "Redo"));
    k.add(new HotKey("Z", ["CTRL"], function (ctx: FullContext) {
      console.log("Undo");
      ctx.toolstack.undo();
    }, "Undo"));

    k.loadDeltaSet();
  }

  * getKeySets() {
    let this2 = this;

    yield new KeymapSet("General", "screen", [this2.keymap]);

    for (let key in areaclasses) {
      let cls = areaclasses[key];

      if (cls.name === "SettingsEditor") {
        continue;
      }

      let area = new cls(); //document.createElement(cls.define().tagname);
      area.ctx = this.ctx;
      area.size = [512, 512];
      area.pos = [0, 0];
      area.updateSize = function() {};

      try {
        area._init();
      } catch (error) {
        console.error(error.stack);
        console.error(error.message);
      }

      let uiname = area.constructor.define().uiname || area.constructor.name;
      let path = area.constructor.name;

      let km = area.getKeyMaps();

      if (!(km instanceof KeymapSet)) {
        km = new KeymapSet(uiname, path, km);
      }

      for (let keymap of km) {
        //keymap.loadDeltaSet();
      }

      yield km;
    }

    return;
    for (let sarea of this2.sareas) {
      if (!sarea.area) continue;

      let area = sarea.area;
      let uiname = area.constructor.define().uiname || area.constructor.name;
      let path = area.constructor.name;

      let km = sarea.area.getKeyMaps();

      if (!(km instanceof KeymapSet)) {
        km = new KeymapSet(uiname, path, km);
      }

      for (let keymap of km) {
        keymap.loadDeltaSet();
      }

      yield km;
    }
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

    if (this.ctx && this._last_keymap_gen !== this.ctx.state.settings.keyDeltaGen) {
      this._last_keymap_gen = this.ctx.state.settings.keyDeltaGen;
      this.keymap.loadDeltaSet();
    }

    if (g_app_state.modalstate === ModalStates.PLAYING) {
      let scene = this.ctx.scene;

      let dt = util.time_ms() - this._lastFrameTime;
      let fps = scene.fps;

      if (dt > 1000.0/fps) {
        scene.change_time(this.ctx, scene.time + 1);
        this._lastFrameTime = util.time_ms();
      }
    }

    if (this.ctx && this.ctx.scene) {
      this.ctx.scene.on_tick(this.ctx);
    }

    the_global_dag.exec();
  }

  static define() {
    return {
      tagname: "fairmotion-screen-x"
    };
  }
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
  canvases: Object;

  constructor() {
    super();

    this._last_keymap_delta_gen = 0;
    this.canvases = {};
  }

  makeHeader(container: Container) {
    return super.makeHeader(container);
  }

  getKeyMaps() {
    if (this.keymap) {
      return [this.keymap];
    }

    return [];
  }

  update() {
    super.update();

    if (!this.ctx || !this.ctx.state) {
      return;
    }

    if (this._last_keymap_delta_gen !== this.ctx.state.keyDeltaGen) {
      this._last_keymap_delta_gen = this.ctx.state.keyDeltaGen;

      for (let k of this.getKeyMaps()) {
        k.loadDeltaSet();
      }
    }
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

    this.doOnce(() => {
      this.keymap.loadDeltaSet();

      for (let keymap of this.getKeyMaps()) {
        keymap.loadDeltaSet();
      }
    });
  }

  getCanvas(id: string, zindex: number, patch_canvas2d_matrix = true, dpi_scale = 1.0) {
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
      let w = ~~(this.size[0]*dpi*dpi_scale);
      let h = ~~(this.size[1]*dpi*dpi_scale);

      let sw = (w/dpi/dpi_scale) + "px";
      let sh = (h/dpi/dpi_scale) + "px";

      if (canvas.style["left"] !== "0px") {
        canvas.style["left"] = "0px";
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

  data_link(block: DataBlock, getblock: Function, getblock_us: Function) {

  }

  static register(cls) {
    return Area.register(cls);
  }

  static getActiveArea() {
    return this.active_area();
  }

  static active_area() {
    return contextWrangler.getLastArea(this);
  }

  static context_area(cls) {
    return contextWrangler.getLastArea(cls);
  }

  //wraps an event handler so that it calls this.push_ctx_active/pop_ctx_active
  static wrapContextEvent(f) {
    return function (e) {
      if (haveModal()) {
        return;
      }

      this.push_ctx_active();

      try {
        f(e);
      } catch (error) {
        print_stack(error);
        console.warn("Error executing area", e.type, "callback");
      }

      this.pop_ctx_active();
    }
  }

  push_ctx_active(dontSetLastRef = false) {
    super.push_ctx_active(dontSetLastRef);
  }

  pop_ctx_active(dontSetLastRef = false) {
    super.pop_ctx_active(dontSetLastRef);
  }
}

Editor.STRUCT = STRUCT.inherit(Editor, Area) + `
}
`;
