import {Area, ScreenArea} from '../path.ux/scripts/ScreenArea.js';
import {Screen} from '../path.ux/scripts/FrameManager.js';
import {STRUCT} from '../core/struct.js';
import * as ui_base from "../path.ux/scripts/ui_base.js";
import {KeyMap, ToolKeyHandler, FuncKeyHandler, HotKey,
  charmap, TouchEventManager, EventHandler} from "./events.js";
import {patch_canvas2d, set_rendermat} from '../curve/spline_draw.js';

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
  constructor() {
    super();

    this.define_keymap();
  }

  init() {
    this.define_keymap();
  }

  define_keymap() {
    this.keymap = new KeyMap();
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
  }
  on_keyup(e) {
    if (g_app_state.eventhandler !== this)
      return g_app_state.eventhandler.on_keyup(e);
  }

  on_keydown(e) {
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

  static define() {return {
    tagname : "fairmotion-screen-x"
  };}
}

FairmotionScreen.STRUCT = STRUCT.inherit(FairmotionScreen, Screen) + `
}
`;
ui_base.UIBase.register(FairmotionScreen);

export class Editor extends Area {
  constructor() {
    super();

    this.canvases = {};
  }

  makeHeader(container) {
    return super.makeHeader(container);
  }

  init() {
    super.init();

    this.container = document.createElement("container-x");
    this.container.ctx = this.ctx;

    this.container.style["width"] = "100%";
    this.shadow.appendChild(this.container);

    this.makeHeader(this.container);
    this.setCSS();

    this.keymap = new KeyMap();
  }

  getCanvas(id, zindex, patch_canvas2d_matrix=true) {
    let canvas;
    let dpi = ui_base.UIBase.getDPI();

    if (id in this.canvases) {
      canvas = this.canvases[id];
    } else {
      console.log("creating new canvas", id, zindex);

      canvas = this.canvases[id] = document.createElement("canvas");
      canvas.g = this.canvases[id].getContext("2d");

      if (patch_canvas2d_matrix) {
        patch_canvas2d(canvas.g);
      }

      this.shadow.prepend(canvas);

      canvas.style["position"] = "absolute";
    }

    if (canvas.style["z-index"] != zindex) {
      canvas.style["z-index"] = zindex;
    }

    if (this.size !== undefined) {
      let w = ~~(this.size[0] * dpi);
      let h = ~~(this.size[1] * dpi);

      let sw = this.size[0] + "px";
      let sh = this.size[1] + "px";

      if (canvas.width != w || canvas.style["width"] != sw) {
        canvas.width = w;
        canvas.style["width"] = sw;
      }

      if (canvas.height != h || canvas.style["height"] != sh) {
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

    if (stack.length == 0)
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

    if (stack.length == 0 || stack[stack.length - 1] !== this) {
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
