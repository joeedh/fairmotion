import {Area, ScreenArea} from 'ScreenArea';
import {Screen} from 'FrameManager';
import {STRUCT} from 'struct';
import * as ui_base from "../path.ux/scripts/ui_base";
import {KeyMap, ToolKeyHandler, FuncKeyHandler, HotKey,
  charmap, TouchEventManager, EventHandler} from "./events";

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
      console.log("saving new startup file.");
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

    if (area !== undefined && area.keymap.process_event(this.ctx, e)) {
      return;
    }
  }

  static define() {return {
    tagname : "fairmotion-screen-x"
  };}

  static fromSTRUCT(reader) {
    /*Parent class's fromSTRUCT pulls tagname from define(), so no need to
      do weirdness with STRUCT.chain_fromSTRUCT
     */

    return super.fromSTRUCT(reader);
  }
}

FairmotionScreen.STRUCT = STRUCT.inherit(FairmotionScreen, Screen) + `
}
`;
ui_base.UIBase.register(FairmotionScreen);

export class Editor extends Area {
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

  on_destroy() {

  }

  data_link(block : DataBlock, getblock : Function, getblock_us : Function) {

  }

  static register(cls) {
    return Area.register(cls);
  }
}

Editor.STRUCT = STRUCT.inherit(Editor, Area) + `
}
`;
