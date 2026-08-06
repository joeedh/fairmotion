import { Area, contextWrangler, ScreenArea } from "../path.ux/scripts/screen/ScreenArea.js";
import { areaclasses } from "../path.ux/scripts/screen/area_base.js";
import { Screen } from "../path.ux/scripts/screen/FrameManager.js";
import { STRUCT } from "../core/struct.js";
import * as ui_base from "../path.ux/scripts/core/ui_base.js";
import * as util from "../path.ux/scripts/util/util.js";
import { ModalStates } from "../core/toolops_api.js";
import { HotKey, KeyMap } from "../core/keymap.js";
import { haveModal } from "../path.ux/scripts/pathux.js";
import type { FullContext } from "../core/context.js";
import type { DataBlock, GetBlockFunc, GetBlockUserFunc } from "../core/lib_api.js";
import type { Container } from "../path.ux/scripts/core/ui.js";
import type { View2DHandler } from "./viewport/view2d.js";
import type { IAreaConstructor } from "../path.ux/scripts/screen/area_base.js";

export function resetAreaStacks() {
  contextWrangler.reset();
}

/*
primary app screen subclass
*/
export class FairmotionScreen extends Screen<FullContext> {
  /* NOTE: written by AppState on file load and read by nothing. */
  view2d?: View2DHandler;

  /* Settings generation the keymap deltas were last loaded at. */
  _last_keymap_gen: number;
  declare keymap: KeyMap;
  /* scene.time playback started from, restored when it stops. */
  startFrame: number;
  _lastFrameTime: number;

  /*
   * NOTE: the multitouch state view2d_ops.ts's touch ops read. Nothing has
   * written either since the old touch event layer was removed, so tottouch
   * is always undefined and every guard against it misfires.
   */
  tottouch!: number;
  touchstate!: { [id: string]: number[] };

  /* NOTE: the modifier state that same event layer used to mirror here. Also
     unwritten now, so view2d's middle-click pan tests always read undefined. */
  declare ctrl: boolean;
  declare shift: boolean;
  declare alt: boolean;

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
    let k = (this.keymap = new KeyMap("screen"));

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
    k.add(
      new HotKey(
        "U",
        ["CTRL", "SHIFT"],
        function () {
          g_app_state.set_startup_file();
        },
        "Save Startup File"
      )
    );

    k.add(new HotKey("Left", ["CTRL"], "anim.nextprev(dir=-1)|Previous Keyframe"));
    k.add(new HotKey("Right", ["CTRL"], "anim.nextprev(dir=1)|Next Keyframe"));

    k.add(
      new HotKey(
        "Space",
        [],
        () => {
          this.ctx.screen.togglePlayback();
        },
        "Animation Playback"
      )
    );
    k.add(
      new HotKey(
        "Escape",
        [],
        () => {
          this.ctx.screen.stopPlayback();
        },
        "Animation Playback"
      )
    );

    k.add(
      new HotKey(
        "Z",
        ["CTRL", "SHIFT"],
        function (ctx: FullContext) {
          console.log("Redo");
          ctx.toolstack.redo();
        },
        "Redo"
      )
    );
    k.add(
      new HotKey(
        "Y",
        ["CTRL"],
        function (ctx: FullContext) {
          console.log("Redo");
          ctx.toolstack.redo();
        },
        "Redo"
      )
    );
    k.add(
      new HotKey(
        "Z",
        ["CTRL"],
        function (ctx: FullContext) {
          console.log("Undo");
          ctx.toolstack.undo();
        },
        "Undo"
      )
    );

    k.loadDeltaSet();
  }

  *getKeySets() {
    let this2 = this;

    yield new KeymapSet("General", "screen", [this2.keymap]);

    for (let key in areaclasses) {
      let cls = areaclasses[key];

      if (cls.name === "SettingsEditor") {
        continue;
      }

      let area = new cls(); //document.createElement(cls.define().tagname);

      /* NOTE: areaclasses also holds path.ux's own editors, whose keymaps are
         plain path.ux KeyMaps.  The settings UI below calls ensureWrite() and
         reads typeName on everything it is handed, neither of which those
         have, so they are skipped rather than crashing it. */
      if (!(area instanceof Editor)) {
        continue;
      }

      area.ctx = this.ctx;
      area.size = new Vector2([512, 512]);
      area.pos = new Vector2([0, 0]);
      /* Stubbed out so a throwaway area harvested for its keymap does not try
         to lay itself out; Area has no such method to override. */
      Reflect.set(area, "updateSize", () => {});

      try {
        area._init();
      } catch (error) {
        if (error instanceof Error) {
          console.error(error.stack);
          console.error(error.message);
        }
      }

      let uiname = cls.define().uiname || cls.name;
      let path = cls.name;

      let km = area.getKeyMaps();
      let kmset = km instanceof KeymapSet ? km : new KeymapSet(uiname, path, km);

      for (let keymap of kmset) {
        //keymap.loadDeltaSet();
      }

      yield kmset;
    }

    /* NOTE: a second loop over this.sareas, building the same KeymapSets from
       the areas actually on screen, sat here behind an unconditional return.
       It was unreachable, and the loop above supersedes it. */
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

      if (dt > 1000.0 / fps) {
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
      tagname: "fairmotion-screen-x",
    };
  }
}

FairmotionScreen.STRUCT =
  STRUCT.inherit(FairmotionScreen, Screen) +
  `
}
`;
ui_base.UIBase.register(FairmotionScreen);

export class KeymapSet extends Array<KeyMap> {
  name: string;
  /* Class name of the editor the keymaps belong to; the settings UI groups
     on it. */
  path: string;

  constructor(name: string, path: string, keymaps?: Iterable<KeyMap>) {
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

/* An overlay canvas an editor owns, plus its 2d context and the dpi scale it
   was sized at. */
export type EditorCanvas = HTMLCanvasElement & { dpi_scale: number; g: Canvas2D };

/* Every editor in this tree only ever sees the app's own context, so the base
   is parameterized rather than re-declaring `ctx` (UIBase declares it as an
   accessor, which a class-level property may not override).  path.ux types it
   non-optional even though it is unset until the screen wires the widget up,
   which is why so much of this file still tests it against undefined. */
export class Editor extends Area<FullContext> {
  /* path.ux types this as IUIBaseConstructor, whose define() returns the plain
     UIBaseDefinition; every editor here is an area, so its define() is an
     IAreaDef and carries uiname/areaname. */
  declare ["constructor"]: IAreaConstructor<FullContext, this>;

  /* Assigned by the owning ScreenArea before anything can draw or handle an
     event, so path.ux's `Vector2 | undefined` is narrowed here rather than
     guarded at each of the hundred-odd uses. */
  declare pos: Vector2;
  declare size: Vector2;

  canvases: { [id: string]: EditorCanvas };

  _last_keymap_delta_gen: number;
  declare keymap: KeyMap;
  container!: Container<FullContext>;

  constructor() {
    super();

    this._last_keymap_delta_gen = 0;
    this.canvases = {};
  }

  makeHeader(container: Container<FullContext>, addNoteArea = true) {
    return super.makeHeader(container, addNoteArea);
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

    /* NOTE: this read keyDeltaGen off AppState rather than off its settings
       (see update() above), so the test always passed and every editor reloaded
       every keymap delta on every update. */
    if (this._last_keymap_delta_gen !== this.ctx.state.settings.keyDeltaGen) {
      this._last_keymap_delta_gen = this.ctx.state.settings.keyDeltaGen;

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
    let canvas: EditorCanvas;
    let dpi = ui_base.UIBase.getDPI();

    if (id in this.canvases) {
      canvas = this.canvases[id];
    } else {
      const el = document.createElement("canvas");

      /* The two extra fields are what make it an EditorCanvas; attaching them
         here rather than after the fact keeps the type honest. */
      canvas = this.canvases[id] = Object.assign(el, {
        dpi_scale,
        g: el.getContext("2d")! as Canvas2D,
      });

      this.shadow.prepend(canvas);

      canvas.style["position"] = "absolute";
    }

    canvas.dpi_scale = dpi_scale;

    /* NOTE: this compared the style string against a number, so it never
       matched and rewrote z-index on every call. */
    if (canvas.style.zIndex !== "" + zindex) {
      canvas.style.zIndex = "" + zindex;
    }

    if (this.size !== undefined) {
      let w = ~~(this.size[0] * dpi * dpi_scale);
      let h = ~~(this.size[1] * dpi * dpi_scale);

      let sw = w / dpi / dpi_scale + "px";
      let sh = h / dpi / dpi_scale + "px";

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

  on_destroy() {}

  /**
   * mostly called by AppState.load_undo_file,
   * called when a file is loaded into an existing screen UI
   *
   * NOTE: this shadows path.ux's Area.on_fileload(isActiveEditor), which resets
   * the context wrangler.  Fairmotion passes a context instead and nothing
   * overrides this, so that reset never happens.  The parameter is widened only
   * so the override stays compatible with the base signature.
   * */
  on_fileload(ctx: FullContext | boolean) {}

  /* `block` is the editor itself for editors -- AppState.dataLinkScreen passes
     the area in where datablocks pass themselves. */
  data_link(block: DataBlock | Editor, getblock: GetBlockFunc, getblock_us: GetBlockUserFunc) {}

  /* `never[]` for the same reason as context_area() below. */
  static register(cls: new (...args: never[]) => Editor) {
    return Area.register(cls);
  }

  static getActiveArea() {
    return this.active_area();
  }

  static active_area() {
    return contextWrangler.getLastArea(this);
  }

  /* `never[]` rather than a fixed parameter list: editor subclasses declare
     their own constructor arguments, and only the class object is used here. */
  static context_area<T extends Editor>(cls: new (...args: never[]) => T): T | undefined {
    return contextWrangler.getLastArea(cls as new () => T);
  }

  //wraps an event handler so that it calls this.push_ctx_active/pop_ctx_active
  static wrapContextEvent<T extends Event>(f: (e: T) => void) {
    return function (this: Editor, e: T) {
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
    };
  }

  push_ctx_active(dontSetLastRef = false) {
    super.push_ctx_active(dontSetLastRef);
  }

  pop_ctx_active(dontSetLastRef = false) {
    super.pop_ctx_active(dontSetLastRef);
  }
}

Editor.STRUCT =
  STRUCT.inherit(Editor, Area) +
  `
}
`;
