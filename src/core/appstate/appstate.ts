/* The application state: everything the running app owns that is not the DOM.

   One instance lives at g_app_state.  It holds the datalib (all the document's
   datablocks), the toolstack (undo), the screen, the data API, and the user
   session.  A file load replaces the datalib and usually the screen too, which
   is why so much of what surrounds this class is file I/O.

   The file work itself lives beside this file rather than in it: file_write.ts
   writes a .fmo, file_read.ts reads one back, and versions.ts forward-ports
   what older builds wrote.  The methods here stay as the names everything else
   already calls. */

import { ToolStack } from "../toolstack.js";
import { FullContext } from "../context.js";
import { makeAPI } from "../data_api/data_api_define.js";
import { DataLib, DataTypes } from "../lib_api.js";
import { AppSettings } from "../UserSettings.js";
import { RasterState } from "../raster.js";
import { NotificationManager } from "../notifications.js";
import { Scene } from "../../scene/scene.js";
import { b64encode } from "../../util/strutils.js";
import { Editor, FairmotionScreen, resetAreaStacks } from "../../editors/editor_base.js";
import { View2DHandler } from "../../editors/viewport/view2d.js";
import * as platform from "../../../platforms/platform.js";

import { UserSession } from "./session.js";
import { create_user_file_new, write_blocks } from "./file_write.js";
import {
  dataLinkScreen,
  link_blocks,
  load_blocks,
  load_user_file_new,
  readScreen,
  screenIsDegenerate,
} from "./file_read.js";
import { do_versions, do_versions_post } from "./versions.js";

import type { BlockWriteArgs, FileBlock, FileData, FileWriteArgs } from "./file_format.js";
import type { GetBlockFunc, GetBlockUserFunc } from "../lib_api.js";
import type { DataAPI } from "../../path.ux/scripts/pathux.js";
import type { unpack_ctx } from "../ajax.js";

/* Last-used inputs per tool class name, keyed by ToolOp constructor name.
   Shared across resets, hence the module-level object. */
const toolop_input_cache = {};

export class AppState {
  /* Stack of modalstate bitmasks; see ModalStates in toolops_api.ts. */
  modalStateStack!: int[];
  modalstate!: int;

  /* Non-optional even though destroyScreen() nulls it: every read happens while
     a screen is live, and the only teardown path re-inits immediately after. */
  screen!: FairmotionScreen;
  /* Always the same object as .screen. The split is historical: the screen used
     to be one of several possible event sinks. */
  eventhandler!: FairmotionScreen;
  active_editor?: Editor;
  active_view2d?: View2DHandler;

  /* Shift/ctrl emulation for tablets, set by the on-screen modifier buttons. */
  select_multiple!: boolean;
  select_inverse!: boolean;

  _last_touch_mpos!: number[];
  was_touch!: boolean;

  notes!: NotificationManager;
  toolstack!: ToolStack;
  datalib!: DataLib;
  raster!: RasterState;
  session!: UserSession;
  ctx!: FullContext;

  /* makeAPI() builds both; pathcontroller is the same object under the name
     path.ux's own code expects. */
  api!: DataAPI;
  pathcontroller!: DataAPI;

  /* Data-API path of the spline being edited, plus the stack push/pop of it
     walks when a tool descends into a nested spline. */
  _active_splinepath!: string;
  spline_pathstack!: string[];

  filepath!: string;
  version!: number;
  /* Copied from the screen, whose .size is a Vector2, or a plain pair when
     there is no screen yet. */
  /* Normally the very same Vector2 the screen holds -- see AppState_init. */
  size!: Vector2;

  /* Last-used inputs per tool class name, keyed by ToolOp constructor name.
     Shared across resets, hence the module-level object. */
  toolop_input_cache!: { [toolClassName: string]: unknown };

  /* Cleared by link_blocks() and never read; the active scene lives in the
     datalib. Declared only because that assignment is still there. */
  scene?: Scene;

  /* `screen` is optional because startup() builds the state first and hands
     the screen over afterwards; AppState_init() has always allowed it. */
  constructor(screen?: FairmotionScreen, reset_mode: boolean = false) {
    this.AppState_init(screen, reset_mode);
  }

  /* gen_default_file() calls this without a screen, on purpose: the screen is
     built afterwards by gen_screen(). */
  AppState_init(screen?: FairmotionScreen, reset_mode: boolean = false) {
    this.modalStateStack = [];

    /* `screen` is declared non-optional because the app always has one once it
       has started; gen_default_file() building the state first is the one
       exception, and it hands the screen over immediately afterwards. */
    this.screen = screen!;
    this.eventhandler = screen!;

    this.active_editor = undefined;

    this.select_multiple = false; //basically, this is shift key emulation for tablets
    this.select_inverse = false; //same as select_mutiple

    this._last_touch_mpos = [0, 0];
    this.notes = new NotificationManager();

    this.spline_pathstack = [];

    this._active_splinepath = "frameset.drawspline";

    this.was_touch = false;
    this.toolstack = new ToolStack(this);
    this.active_view2d = undefined;

    this.api = makeAPI();
    this.pathcontroller = this.api;

    this.filepath = "";
    this.version = g_app_version;
    this.size = screen !== undefined ? screen.size : new Vector2([512, 512]);
    this.raster = new RasterState(screen !== undefined ? screen.size : [512, 512]);

    this.toolop_input_cache = toolop_input_cache;

    if (this.datalib !== undefined) {
      this.datalib.on_destroy();
    }
    this.datalib = new DataLib();

    this.modalstate = 0; //see toolops_api.js

    if (!reset_mode) {
      if (myLocalStorage.hasCached("session")) {
        try {
          this.session = UserSession.fromJSON(
            JSON.parse(myLocalStorage.getCached("session") ?? "null")
          );
        } catch (error) {
          print_stack(error);
          console.log("Error loading json session object:", myLocalStorage.getCached("session"));
        }
      } else {
        this.session = new UserSession();
      }
    }

    this.ctx = new FullContext(this);
  }

  get settings(): AppSettings {
    return this.session.settings;
  }

  /** we do not enforce that calls to push/pop modalstate happen in order */
  pushModalState(state: int) {
    this.modalStateStack.push(this.modalstate);
    this.modalstate = state;
  }

  /** we do not enforce that calls to push/pop modalstate happen in order */
  popModalState(state: int) {
    if (this.modalstate === state) {
      this.modalstate = this.modalStateStack.pop()!;
    } else {
      this.modalStateStack.remove(state);
    }
  }

  onFrameChange(ctx: FullContext, time: float) {
    for (let id in ctx.datalib.idmap) {
      let block = ctx.datalib.idmap[id];

      for (let ch of block.lib_anim_channels) {
        console.warn("anim: setting path", ch.path, ch.evaluate(time));
        ctx.api.setValue(ctx, ch.path, ch.evaluate(time));
      }
    }
  }

  get active_splinepath() {
    let scene = this.datalib.get_active(DataTypes.SCENE);

    if (scene instanceof Scene) return scene.active_splinepath;

    return this._active_splinepath;
  }

  set active_splinepath(val) {
    this._active_splinepath = val;

    let scene = this.datalib.get_active(DataTypes.SCENE);
    if (scene instanceof Scene) scene.active_splinepath = val;
  }

  destroy() {
    console.trace("Appstate.destroy called");
    this.destroyScreen();
  }

  update_context() {
    let scene = this.datalib.get_active(DataTypes.SCENE);
    if (scene === undefined) return;
  }

  switch_active_spline(newpath: string) {
    this.active_splinepath = newpath;
  }

  push_active_spline(newpath: string) {
    this.spline_pathstack.push(this.active_splinepath);
    this.switch_active_spline(newpath);
  }

  pop_active_spline() {
    this.switch_active_spline(this.spline_pathstack.pop()!);
  }

  reset_state(screen?: FairmotionScreen) {
    this.spline_pathstack = [];
    this.active_splinepath = "frameset.drawspline";

    for (let k in window.active_canvases) {
      let canvas = window.active_canvases[k];

      canvas[1].kill_canvas(k);
    }

    window.active_canvases = {};

    try {
      if (this.screen !== undefined) this.destroyScreen();
    } catch (error) {
      print_stack(error);
      console.log("ERROR: failed to fully destroy screen context");
    }

    this.AppState_init(screen, true);
  }

  //shallow copy
  copy() {
    let as = new AppState(this.screen, undefined);
    as.datalib = this.datalib;
    as.session = this.session;
    as.toolstack = this.toolstack;
    as.filepath = this.filepath;

    return as;
  }

  set_startup_file() {
    let buf = this.create_user_file_new({
      gen_dataview  : true,
      compress      : true,
      save_theme    : false,
      save_toolstack: false,
    });

    //gen_dataview above means this is always the DataView branch
    let bytes = buf instanceof DataView ? new Uint8Array(buf.buffer) : new Uint8Array(buf);

    let text = b64encode(bytes);

    myLocalStorage.set("startup_file", text);

    g_app_state.notes.label("New file template saved");
    return text;
  }

  //file minus ui data, used by BasicFileDataOp
  create_scene_file() {
    let buf = this.create_user_file_new({
      save_screen   : false,
      save_toolstack: false,
    });

    return buf;
  }

  create_undo_file() {
    let buf = this.create_user_file_new({
      save_screen   : false,
      save_toolstack: false,
    });

    return buf;
  }

  //used by BasicFileDataOp, which
  //is a root toolop that stores
  //saved data
  load_scene_file(scenefile: DataView) {
    if (the_global_dag !== undefined) the_global_dag.reset_cache();

    let screen = this.screen;
    let toolstack = this.toolstack;
    let view2d = this.active_view2d;

    console.trace("Load internal scene file", scenefile);

    if (this.datalib !== undefined) {
      this.datalib.on_destroy();
    }

    let datalib = new DataLib();
    this.datalib = datalib;
    let filedata = this.load_blocks(scenefile);

    this.link_blocks(datalib, filedata);

    resetAreaStacks();

    this.screen = screen;
    this.eventhandler = screen;
    this.active_view2d = view2d;

    if (!screen.listening) {
      screen.listen();
      screen.completeSetCSS();
    }

    this.toolstack = toolstack;
    this.screen.ctx = this.ctx = new FullContext();

    if (the_global_dag !== undefined) the_global_dag.reset_cache();
    window.redraw_viewport();
  }

  load_undo_file(undofile: DataView) {
    let screen = this.screen;
    let toolstack = this.toolstack;

    console.log(undofile);

    this.datalib.clear();
    let filedata = this.load_blocks(undofile);

    this.link_blocks(this.datalib, filedata);

    this.eventhandler = screen;
    this.toolstack = toolstack;

    this.screen.ctx = new FullContext();
    window.redraw_viewport();

    for (let sarea of screen.sareas) {
      for (let area of sarea.editors) {
        if (area instanceof Editor) {
          area.on_fileload(this.ctx);
        }
      }
    }
  }

  /* Every caller leaves gen_dataview at its default of true, so that case gets
     a concrete DataView back rather than the three-way union. */
  create_user_file_new(args?: FileWriteArgs & { gen_dataview?: true }): DataView<ArrayBuffer>;
  create_user_file_new(
    args: FileWriteArgs
  ): DataView<ArrayBuffer> | Uint8Array<ArrayBuffer> | byte[];
  create_user_file_new(args: FileWriteArgs = {}) {
    return create_user_file_new(this, args);
  }

  //blocks is a map from 4-byte ID strings to
  //STRUCT-compatible objects.
  /* Both callers leave gen_dataview at its default of true, so that case gets
     a concrete DataView back rather than the three-way union. */
  write_blocks(args: BlockWriteArgs & { gen_dataview?: true }): DataView<ArrayBuffer>;
  write_blocks(args: BlockWriteArgs): DataView<ArrayBuffer> | Uint8Array<ArrayBuffer> | byte[];
  write_blocks(args: BlockWriteArgs) {
    return write_blocks(this, args);
  }

  //version patching happens *before* block linking
  do_versions(datalib: DataLib, blocks: FileBlock[], version: float) {
    do_versions(this, datalib, blocks, version);
  }

  do_versions_post(version: float) {
    do_versions_post(this, version);
  }

  dataLinkScreen(screen: FairmotionScreen, getblock: GetBlockFunc, getblock_us: GetBlockUserFunc) {
    dataLinkScreen(screen, getblock, getblock_us);
  }

  destroyScreen() {
    console.warn("destroyScreen called");

    if (this.screen !== undefined) {
      for (let sarea of this.screen.sareas) {
        for (let area of sarea.editors) {
          if (area instanceof Editor) {
            area.on_destroy();
          }
        }
      }

      this.screen.unlisten();
      this.screen.destroy();
      this.screen.remove();
      /* declared non-optional (the app always has a screen once started); this
         teardown path is the one moment it does not. */
      this.screen = undefined!;
    }
  }

  load_path(path_handle: string) {
    platform.app
      .openFile(path_handle)
      .then((buf: Uint8Array) => {
        let dview = new DataView(buf.buffer);
        this.load_user_file_new(dview, path_handle);
      })
      .catch((error: { toString(): string }) => {
        this.ctx.error(error.toString());
      });
  }

  load_user_file_new(
    data: DataView,
    path?: string,
    uctx?: unpack_ctx,
    use_existing_screen = false
  ) {
    load_user_file_new(this, data, path, uctx, use_existing_screen);
  }

  screenIsDegenerate(screen: FairmotionScreen) {
    return screenIsDegenerate(screen);
  }

  readScreen(fstructs: import("nstructjs").STRUCT, data: DataView) {
    return readScreen(fstructs, data);
  }

  load_blocks(data: DataView, uctx?: unpack_ctx) {
    return load_blocks(this, data, uctx);
  }

  link_blocks(datalib: DataLib, filedata: FileData) {
    link_blocks(this, datalib, filedata);
  }

  static defineAPI(api: DataAPI<FullContext>, struct = api.mapStruct(this, true)) {
    struct.bool("select_multiple", "select_multiple", "Multiple");
    struct.bool("select_inverse", "select_inverse", "Deselect");
    return struct;
  }
}

window.AppState = AppState;
