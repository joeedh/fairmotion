"use strict";

import '../editors/all.js';

import * as platform from '../../platforms/platform.js';

import * as electron_api from '../path.ux/scripts/platforms/electron/electron_api.js';
import {ToolStack} from './toolstack.js';

if (window.haveElectron) {
  electron_api.checkInit();
}

import * as theme from '../editors/theme.js';

import * as config from '../config/config.js';
import * as html5_fileapi from './fileapi/fileapi.js';

import {FullContext, BaseContext, BaseContextOverlay} from "./context.js";

export {FullContext, BaseContext, BaseContextOverlay} from "./context.js";

import {SplineFrameSet} from "./frameset.js";
import {ConsoleEditor} from '../editors/console/console.js';
import {CurveEditor} from '../editors/curve/CurveEditor.js';
import {OpStackEditor} from '../editors/ops/ops_editor.js';
import {View2DHandler} from '../editors/viewport/view2d.js';
import {MaterialEditor} from "../editors/material/MaterialEditor.js";
import {DopeSheetEditor} from "../editors/dopesheet/DopeSheetEditor.js";
import {SettingsEditor} from '../editors/settings/SettingsEditor.js';
import {MenuBar} from '../editors/menubar/MenuBar.js';
import {registerToolStackGetter} from '../path.ux/scripts/screen/FrameManager_ops.js';
import {FairmotionScreen, resetAreaStacks} from '../editors/editor_base.js';

import {iconmanager, setIconMap, setTheme} from '../path.ux/scripts/core/ui_base.js';
import {Editor} from '../editors/editor_base.js';

import cconst from '../path.ux/scripts/config/const.js';
import {termColor} from '../path.ux/scripts/util/util.js';

cconst.loadConstants(config.PathUXConstants);

//set iconsheets, need to find proper place for it other than here in AppState.js
iconmanager.reset(16);

setTheme(theme.theme);
setIconMap(window.Icons);

if (window.devicePixelRatio > 1.1) {
  //iconmanager.add(document.getElementById("iconsheet24"), 24, 16);
} else {
  //iconmanager.add(document.getElementById("iconsheet16"), 16);
}
//to deal with dpi/zoom hell, just use twice as big of icons and scale
iconmanager.add(document.getElementById("iconsheet32"), 32, 16);
iconmanager.add(document.getElementById("iconsheet64"), 64, 32);
//iconmanager.add(document.getElementById("iconsheet64"), 64);

import {Area} from '../path.ux/scripts/screen/ScreenArea.js';

Area.prototype.getScreen = () => {
  return g_app_state.screen;
}

registerToolStackGetter(() => {
  return g_app_state.toolstack;
});

//can't I have the screen area registration code generate this for me?
export let AreaTypes = {
  VIEW2D: View2DHandler,
  SETTINGS: SettingsEditor,
  OPSTACK: OpStackEditor,
  MATERIAL: MaterialEditor,
  DOPESHEET: DopeSheetEditor,
  CURVE: CurveEditor,
  MENUBAR: MenuBar
};

import {setAreaTypes} from "../path.ux/scripts/screen/ScreenArea.js";

setAreaTypes(AreaTypes);

import {Screen} from '../path.ux/scripts/screen/FrameManager.js';
import {PathUXInterface} from './data_api/data_api_pathux.js';


export function get_app_div() {
  let app = document.getElementById("app");

  if (!app) {
    app = document.body;
  }

  return app;
}

export function gen_screen(unused, w, h) {
  let app = get_app_div();

  let screen = document.getElementById("screenmain");
  if (screen) {
    screen.clear();
  } else {
    screen = document.createElement("fairmotion-screen-x");
    resetAreaStacks();
    app.appendChild(screen);
  }

  screen.style["position"] = "absolute";

  screen.setAttribute("id", "screenmain");
  screen.id = "screenmain";

  screen.size = [window.innerWidth, window.innerHeight];
  screen.ctx = new FullContext();

  let sarea = document.createElement("screenarea-x");
  sarea.size[0] = window.innerWidth;
  sarea.size[1] = window.innerHeight;

  screen.appendChild(sarea);

  sarea.setCSS();
  screen.setCSS();
  screen.makeBorders();

  sarea.switch_editor(View2DHandler);
  sarea.area.setCSS();

  let t = MenuBar.getHeight() / sarea.size[1];

  let view2d = screen.splitArea(sarea, t);
  sarea.switch_editor(MenuBar);

  let mated = screen.splitArea(view2d, 0.7, false);
  mated.switch_editor(MaterialEditor);

  g_app_state.screen = screen;
  g_app_state.eventhandler = screen;
  //g_app_state.active_view2d = view2d;

  //make material editor

  app.appendChild(screen);
}

import './startup/startup_file_example.js';
import {startup_file} from './startup/startup_file.js';

//$XXX import {gen_screen} from 'FrameManager';
import {
  DataPath, DataStruct, DataPathTypes, DataFlags,
  DataAPI, DataStructArray
} from './data_api/data_api.js';
import {wrap_getblock, wrap_getblock_us} from './lib_utils.js';
//$XXX import {UICanvas} from 'UICanvas';
import {urlencode, b64decode, b64encode} from '../util/strutils.js';
import {BasicFileOp} from '../editors/viewport/view2d_ops.js';
import {AppSettings} from './UserSettings.js';
import {JobManager} from './jobs.js';
import {RasterState} from './raster.js';
import {NotificationManager, Notification} from './notifications.js';
import {STRUCT} from './struct.js';
import {get_data_typemap} from './lib_api_typedefine.js';
import {Screen} from '../path.ux/scripts/screen/FrameManager.js';
import {ScreenArea, Area} from '../path.ux/scripts/screen/ScreenArea.js';
import {DataLib, DataBlock, DataTypes} from './lib_api.js';
import {ToolMacro, ToolOp, UndoFlags, ToolFlags} from './toolops_api.js';
import {PropTypes, TPropFlags, StringProperty, CollectionProperty} from './toolprops.js';
import {View2DHandler} from '../editors/viewport/view2d.js';
import {Scene} from '../scene/scene.js';
import {SplineTypes, SplineFlags} from '../curve/spline_base.js';
import {DopeSheetEditor} from '../editors/dopesheet/DopeSheetEditor.js';
import {CurveEditor} from '../editors/curve/CurveEditor.js';
import {OpStackEditor} from '../editors/ops/ops_editor.js';

import {
  pack_byte, pack_short, pack_int, pack_float,
  pack_double, pack_vec2, pack_vec3, pack_vec4,
  pack_mat4, pack_quat, pack_dataref, pack_string,
  pack_static_string, unpack_byte, unpack_short,
  unpack_int, unpack_float, unpack_double, unpack_vec2,
  unpack_vec3, unpack_vec4, unpack_mat4, unpack_quat,
  unpack_dataref, unpack_string, unpack_static_string,
  unpack_bytes, unpack_ctx
} from './ajax.js';

//include "src/config/config_defines.js"

//#ifdef PACK_PROFILE
import {
  profile_reset, profile_report, gen_struct_str,
  STRUCT
} from './struct.js';
//#endif

export let FileFlags = {COMPRESSED_LZSTRING: 1};

export class FileData {
  constructor(blocks, fstructs, version) {
    this.blocks = blocks;
    this.fstructs = fstructs;
    this.version = version;
  }
}

function ensureMenuBar(appstate, screen) {
  for (let sarea of screen.sareas) {
    if (!sarea.area || !(sarea.area instanceof MenuBar)) {
      continue;
    }

    return;
  }

  screen.regenScreenMesh();

  console.log("Adding menu bar", screen.size);

  let scale = (screen.size[1] - MenuBar.getHeight()) / screen.size[1];

  for (let sv of screen.screenverts) {
    sv[1] = sv[1] * scale + MenuBar.getHeight();
  }

  screen.loadFromVerts();

  let sarea2 = document.createElement("screenarea-x");

  sarea2.pos[0] = 0;
  sarea2.pos[1] = 0;
  sarea2.size[0] = screen.size[0];
  sarea2.size[1] = MenuBar.getHeight();
  screen.appendChild(sarea2);

  sarea2.switch_editor(MenuBar);

  screen.regenScreenMesh();
  screen.snapScreenVerts();
}

function patchScreen(appstate, fstructs, data) {
  let fakeclass = {
    fromSTRUCT: (reader) => {
      let ret = {};
      reader(ret);
      return ret;
    },

    structName: "Screen",
    name: "Screen"
  };

  fakeclass.prototype = Object.create(Object.prototype);

  data = fstructs.read_object(data, fakeclass);
  let screen = document.createElement("fairmotion-screen-x");
  resetAreaStacks();

  screen.size = data.size;
  console.log(data);
  console.log("SCREEN SIZE", screen.size);

  for (let sarea of data.areas) {
    console.log("AREA!");

    let sarea2 = document.createElement("screenarea-x");

    sarea2.size = sarea.size;
    sarea2.pos = sarea.pos;

    for (let editor of sarea.editors) {
      let areaname = editor.constructor.define().areaname;

      sarea2.editors.push(editor);
      sarea2.editormap[areaname] = editor;

      if (editor.constructor.name === sarea.area) {
        sarea2.area = editor;
        sarea2.shadow.appendChild(editor);
      }
    }

    screen.appendChild(sarea2);
  }

  ensureMenuBar(appstate, screen);

  return screen;
}

//truly ancient class, from AllShape.
class UserSession {
  tokens: Object
  username: string
  password: string
  is_logged_in: boolean
  loaded_settings: boolean
  settings: AppSettings;

  constructor() {
    this.tokens = {}
  :
    ObjectMap;
    this.username = "user";
    this.password = "";
    this.is_logged_in = true; //false;
    this.loaded_settings = false;
    this.userid = undefined;

    this.settings = new AppSettings();
    this.settings.load();
  }

  copy(): UserSession {
    let c = new UserSession();

    for (let k in this.tokens) {
      c.tokens[k] = this.tokens[k];
    }
    c.username = this.username;
    c.password = this.password;
    c.is_logged_in = this.is_logged_in;
    c.loaded_settings = false;
    c.settings = this.settings;
    c.userid = this.userid;

    return c;
  }

  store(override_settings = false) {
    let saveobj = this.copy();

    if (!override_settings && myLocalStorage.hasCached("session")) {
      try {
        let old = JSON.parse(myLocalStorage.getCached("session"));
        saveobj.settings = old;
      } catch (error) {
        print_stack(error);
        console.log("error loading session json object");
      }
    }

    myLocalStorage.set("session", JSON.stringify(saveobj));
  }

  logout_simple() {
    //this.is_logged_in = false;
    //this.tokens = {};
    //this.loaded_settings = false;
  }

  validate_session() {
    return true;
  }

  static fromJSON(obj) {
    let us = new UserSession;

    us.tokens = obj.tokens;
    us.username = obj.username;
    us.password = obj.password;
    us.is_logged_in = obj.is_logged_in;
    us.userid = obj.userid;

    us.settings = new AppSettings();
    us.settings.load();

    return us;
  }
}

window.test_load_file = function () {
  let buf = startup_file;
  buf = new DataView(b64decode(buf).buffer);

  g_app_state.load_user_file_new(buf, undefined, new unpack_ctx());
};

let load_default_file = function (g: AppState, size = [512, 512]) {
  if (!myLocalStorage.hasCached("startup_file")) {
    myLocalStorage.startup_file = startup_file;
  }

  //if (RELEASE && (!("startup_file" in myLocalStorage) || myLocalStorage.startup_file === undefined || myLocalStorage.startup_file === "undefined")) {
  //  myLocalStorage.startup_file = startup_file;
  //}

  //try loading twice, load embedded startup_file on second attempt
  for (let i = 0; i < 2; i++) {
    let file = i == 0 ? myLocalStorage.getCached("startup_file") : startup_file;

    if (file)
      file = file.trim().replace(/[\n\r]/g, "");

    if (file) {
      //try {
      let buf = new DataView(b64decode(file).buffer);

      try {
        g.load_user_file_new(buf, undefined, new unpack_ctx());
      } catch (error) {
        print_stack(error);
        return false;
      }

      return true;
      //} catch (err) {
      // print_stack(err);
      //console.log("ERROR: Could not load user-defined startup file.");
      //}
    }
  }

  return false;
};

//size is screen size
window.gen_default_file = function gen_default_file(size = [512, 512], force_new = false) {
  //needed for chrome app file system api
  html5_fileapi.reset();

  let g = g_app_state;
  global
  startup_file;

  if (!force_new && load_default_file(g)) {
    return;
  }

  //reset app state, calling without args
  //will leave .screen undefined
  g.reset_state();

  let op = new BasicFileOp();
  g.toolstack.exec_tool(op);

  //set up screen UI

  //a 3d viewport
  //let view2d = new View2DHandler(0, 0, size[0], size[1], 0.75, 1000.0);

  //g.view2d = g.active_view2d = view2d;

  //now create screen
  gen_screen(undefined, size[0], size[1]);
}

function output_startup_file(): String {
  let str = myLocalStorage.getCached("startup_file");
  let out = ""

  for (let i = 0; i < str.length; i++) {
    out += str[i];
    if (((i + 1) % 77) === 0) {
      out += "\n";
    }
  }

  return out;
}

const _nonblocks = Object.freeze(new set(["SCRN", "TSTK", "THME", "DLIB"]));
const toolop_input_cache = {};

export class AppState {
  constructor(screen: FrameManager) {
    this.AppState_init(screen);
  }

  AppState_init(screen: FrameManager, reset_mode: boolean = false) {
    this.modalStateStack = [];

    this.screen = screen;
    this.eventhandler = screen;

    this.active_editor = undefined;

    this.select_multiple = false; //basically, this is shift key emulation for tablets
    this.select_inverse = false;  //same as select_mutiple

    this._last_touch_mpos = [0, 0];
    this.notes = new NotificationManager();

    this.spline_pathstack = [];

    this._active_splinepath = "frameset.drawspline";

    this.was_touch = false;
    this.toolstack = new ToolStack(this);
    this.active_view2d = undefined;
    this.api = new DataAPI(this);

    this.pathcontroller = new PathUXInterface(this.api);
    this.pathcontroller.setContext(new FullContext(this));

    this.filepath = ""
    this.version = g_app_version;
    this.size = screen !== undefined ? screen.size : [512, 512];
    this.raster = new RasterState(undefined, screen !== undefined ? screen.size : [512, 512]);

    this.toolop_input_cache = toolop_input_cache;

    if (this.datalib !== undefined) {
      this.datalib.on_destroy();
    }
    this.datalib = new DataLib();

    this.modalstate = 0; //see toolops_api.js
    this.jobs = new JobManager();

    if (!reset_mode) {
      if (myLocalStorage.hasCached("session")) {
        try {
          this.session = UserSession.fromJSON(JSON.parse(myLocalStorage.getCached("session")));
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

  get settings() {
    return this.session.settings;
  }

  /** we do not enforce that calls to push/pop modalstate happen in order */
  pushModalState(state) {
    this.modalStateStack.push(this.modalstate);
    this.modalstate = state;
  }

  /** we do not enforce that calls to push/pop modalstate happen in order */
  popModalState(state) {
    if (this.modalstate === state) {
      this.modalstate = this.modalStateStack.pop();
    } else {
      this.modalStateStack.remove(state);
    }
  }


  get active_splinepath() {
    let scene = this.datalib.get_active(DataTypes.SCENE);

    //console.log("SPATH 1", scene !== undefined ? scene.active_splinepath : "");

    if (scene !== undefined)
      return scene.active_splinepath;

    //console.log("SPATH 2");

    return this._active_splinepath;
  }

  set active_splinepath(val) {
    this._active_splinepath = val;

    //console.trace(val);

    let scene = this.datalib.get_active(DataTypes.SCENE);
    if (scene !== undefined)
      scene.active_splinepath = val;
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
    this.switch_active_spline(this.spline_pathstack.pop());
  }

  reset_state(screen: FairmotionScreen) {
    //global active_canvases;

    this.spline_pathstack = [];
    this.active_splinepath = "frameset.drawspline";

    for (let k in window.active_canvases) {
      let canvas = window.active_canvases[k];

      canvas[1].kill_canvas(k);
    }

    window.active_canvases = {};

    try {
      if (this.screen !== undefined)
        this.destroyScreen();
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
      gen_dataview: true,
      compress: true,
      save_theme: false,
      save_toolstack: false
    });

    buf = new Uint8Array(buf.buffer);

    /*let ar = [];
    for (let i=0; i<buf.length; i++) {
      ar.push(buf[i]);
    }
    buf = JSON.stringify(ar);*/

    buf = b64encode(buf);

    ////XXX
    //warn("WARNING: not saving startup file, debugging file writing code");

    myLocalStorage.set("startup_file", buf);

    g_app_state.notes.label("New file template saved");
    return buf;
  }

  //file minus ui data, used by BasicFileDataOp
  create_scene_file() {
    let buf = this.create_user_file_new({
      save_screen: false,
      save_toolstack: false
    });

    return buf;
  }

  create_undo_file() {
    let buf = this.create_user_file_new({
      save_screen: false,
      save_toolstack: false
    });

    return buf;
  }

  //used by BasicFileDataOp, which 
  //is a root toolop that stores
  //saved data
  load_scene_file(scenefile: DataView) {
    if (the_global_dag !== undefined)
      the_global_dag.reset_cache();

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

    //this.load_user_file_new(scenefile);
    this.screen = screen;
    this.eventhandler = screen;
    this.active_view2d = view2d;

    this.toolstack = toolstack;
    this.screen.ctx = this.ctx = new FullContext();

    if (the_global_dag !== undefined)
      the_global_dag.reset_cache();
    window.redraw_viewport();
  }

  load_undo_file(undofile: DataView) {
    let screen = this.screen;
    let toolstack = this.toolstack;

    console.log(undofile);

    this.datalib.clear();
    let filedata = this.load_blocks(undofile);

    this.link_blocks(this.datalib, filedata);

    //this.load_user_file_new(undofile);

    this.eventhandler = screen;
    this.toolstack = toolstack;

    this.screen.ctx = new FullContext();
    window.redraw_viewport();

    for (let sarea of screen.sareas) {
      for (let area of sarea.editors) {
        area.on_fileload(this.ctx);
      }
    }
  }

  /*
    new file format:
    FAIR          | 4 chars
    file flags    | int (e.g. whether compression was used)
    version major | int
    version minor | int
    
    block {
      type    | 4 chars 
      subtype | 4 chars [STRT (Struct), JSON, SDEF (struct definition[s])]
      datalen | int
    }
    
    BLCK blocks correspond to DataBlocks, and are defined like so:
    
    BLCK         | 4 chars
    STRT         | 4 chars
    data_length  | int
    blocktype    | int
    data (of length data_length-4)
    
  */
  create_user_file_new(args = {}) {
    let gen_dataview = true, compress = false;
    let save_screen = true, save_toolstack = false;
    let save_theme = false, save_datalib = true;

    if (args.save_datalib !== undefined)
      save_datalib = args.save_datalib;

    if (args.gen_dataview !== undefined)
      gen_dataview = args.gen_dataview;

    if (args.compress !== undefined)
      compress = args.compress;

    if (args.save_screen !== undefined)
      save_screen = args.save_screen;

    if (args.save_toolstack !== undefined)
      save_toolstack = args.save_toolstack;

    if (args.save_theme !== undefined)
      save_theme = args.save_theme;

    function bheader(data, type, subtype) {
      pack_static_string(data, type, 4);
      pack_static_string(data, subtype, 4);
    }

    let data = [];

    //header "magic"
    pack_static_string(data, "FAIR", 4);

    //general file flags, e.g. compression
    let flag = compress ? FileFlags.COMPRESSED_LZSTRING : 0;
    pack_int(data, flag);

    //version
    let major = Math.floor(g_app_version);
    let minor = Math.floor((g_app_version - Math.floor(g_app_version)) * 1000);

    pack_int(data, major);
    pack_int(data, minor);

    let headerdata = data;
    if (compress) {
      data = [];
    }

    //the schema struct definitions used to save
    //the non-JSON parts of this file.
    let buf = gen_struct_str();

    bheader(data, "SDEF", "SDEF");
    pack_string(data, buf);

    //reset struct profiler, if its enabled
//#ifdef PACK_PROFILE
    profile_reset();
//#endif

    //save datalib data, note that data blocks are saved independently
    if (save_datalib) {
      let data2 = [];

      istruct.write_object(data2, this.datalib);
      bheader(data, "DLIB", "STRT")
      pack_int(data, data2.length);
      data = data.concat(data2);
    }

    if (save_screen) {
      //write screen block
      let data2 = []
      istruct.write_object(data2, this.screen);

      bheader(data, "SCRN", "STRT");
      pack_int(data, data2.length);
      data = data.concat(data2);
    }

    let data2 = [];
    for (let lib of this.datalib.datalists.values()) {
      for (let block of lib) {
        data2 = [];

        let t1 = time_ms();

        istruct.write_object(data2, block);

        t1 = time_ms() - t1;

        if (t1 > 50) {
          console.log(t1.toFixed(1) + "ms", block);
        }

        bheader(data, "BLCK", "STRT");
        pack_int(data, data2.length + 4);
        pack_int(data, block.lib_type);

        data = data.concat(data2);
      }
    }

//#ifdef PACK_PROFILE
    profile_report();
//#endif

    if (save_toolstack) {
      console.log("writing toolstack");

      let data2 = [];
      istruct.write_object(data2, this.toolstack);

      bheader(data, "TSTK", "STRT");
      pack_int(data, data2.length);
      data = data.concat(data2);
    }

    if (save_theme) {
      console.log("writing theme");
      let data2 = [];
      istruct.write_object(data2, g_theme);

      bheader(data, "THME", "STRT");
      pack_int(data, data2.length);
      data = data.concat(data2);
    }

    if (compress) {
      data = LZString.compress(new Uint8Array(data));
      console.log("using compression");

      let d = new Uint16Array(data.length);
      for (let i = 0; i < data.length; i++) {
        d[i] = data.charCodeAt(i);
      }

      d = new Uint8Array(d.buffer);
      console.log("  file size", d.length);

      data = new Uint8Array(d.length + headerdata.length)
      for (let i = 0; i < headerdata.length; i++) {
        data[i] = headerdata[i];
      }
      for (let i = 0; i < d.length; i++) {
        data[i + headerdata.length] = d[i];
      }

      if (gen_dataview)
        return new DataView(data.buffer);
      else
        return data;
    } else {
      console.log("  file size", data.length);

      if (gen_dataview)
        return new DataView(new Uint8Array(data).buffer);
      else
        return data;
    }
  }

  //blocks is a map from 4-byte ID strings to
  //STRUCT-compatible objects.
  write_blocks(args = {}) {
    let gen_dataview = true, compress = false;
    let save_screen = args.save_screen !== undefined ? args.save_screen : true;
    let save_toolstack = args.save_toolstack !== undefined ? args.save_toolstack : false;
    let save_theme = false;
    let blocks = args["blocks"];

    if (args.gen_dataview !== undefined)
      gen_dataview = args.gen_dataview;
    if (args.compress !== undefined)
      compress = args.compress;

    function bheader(data, type, subtype) {
      pack_static_string(data, type, 4);
      pack_static_string(data, subtype, 4);
    }

    let data = [];

    //header "magic"
    pack_static_string(data, "FAIR", 4);

    //general file flags, e.g. compression
    let flag = compress ? FileFlags.COMPRESSED_LZSTRING : 0;
    pack_int(data, flag);

    //version
    let major = Math.floor(g_app_version);
    let minor = Math.floor((g_app_version - Math.floor(g_app_version)) * 1000);

    pack_int(data, major);
    pack_int(data, minor);

    let headerdata = data;
    if (compress) {
      data = [];
    }

    //the schema struct definitions used to save
    //the non-JSON parts of this file.
    let buf = gen_struct_str();

    bheader(data, "SDEF", "SDEF");
    pack_string(data, buf);

    for (let k in blocks) {
      let data2 = []
      istruct.write_object(data2, blocks[k]);

      bheader(data, k, "STRT");
      pack_int(data, data2.length);
      data = data.concat(data2);
    }

    if (compress) {
      console.log("1 using compression");
      data = LZString.compress(new Uint8Array(data));

      let d = new Uint16Array(data.length);
      for (let i = 0; i < data.length; i++) {
        d[i] = data.charCodeAt(i);
      }

      d = new Uint8Array(d.buffer);
      console.log("  file size:", d.length);

      data = new Uint8Array(d.length + headerdata.length)
      for (let i = 0; i < headerdata.length; i++) {
        data[i] = headerdata[i];
      }
      for (let i = 0; i < d.length; i++) {
        data[i + headerdata.length] = d[i];
      }

      if (gen_dataview)
        return new DataView(data.buffer);
      else
        return data;
    } else {
      console.log("  file size:", data.length);

      if (gen_dataview)
        return new DataView(new Uint8Array(data).buffer);
      else
        return data;
    }
  }

  //version patching happens *before* block linking
  do_versions(datalib, blocks, version) {
    if (version < 0.046) {
      for (let frameset of datalib.framesets) {
        for (let spline of frameset._allsplines) {
          for (let h of spline.handles) {
            //if (!h.use) continue;

            console.log("  -", h.segments[0], h.segments);
            console.log("  -", h.owning_segment);

            let s = h.owning_segment;
            let v1 = s.handle_vertex(h), v2 = s.other_vert(v1);

            console.log("patching handle!", h.eid);
            h.load(v2).sub(v1).mulScalar(1.0 / 3.0).add(v1);
          }
        }
      }
    }

    if (version < 0.047) {
      //create a scene
      let scene = new Scene();
      scene.set_fake_user();

      this.datalib.add(scene);
    }

    if (version < 0.048) {
      for (let frameset of datalib.framesets) {
        for (let spline of frameset._allsplines) {
          for (let eid in spline.eidmap) {
            let e = spline.eidmap[eid];
            let layer = spline.layerset.active; //should exist by this point

            //console.log("adding element to layer!");
            layer.add(e);
          }
        }
      }
    }

    if (version < 0.049) {
      for (let frameset of datalib.framesets) {
        if (frameset.kcache !== undefined) {
          frameset.kcache.cache = {};
        }

        for (let s of frameset.spline.segments) {
          s.v1.flag |= SplineFlags.UPDATE;
          s.v2.flag |= SplineFlags.UPDATE;
          s.h1.flag |= SplineFlags.UPDATE;
          s.h2.flag |= SplineFlags.UPDATE;
          s.flag |= SplineFlags.UPDATE;
        }

        frameset.spline.resolve = 1;
      }
    }

    //spline equation changed, force resolves
    if (version < 0.050) {
      for (let frameset of datalib.framesets) {
        startup_warning("Spline equation changed; forcing resolve. . .", version);

        frameset.spline.force_full_resolve();
        frameset.pathspline.force_full_resolve();
      }
    }
  }

  dataLinkScreen(screen, getblock, getblock_us) {
    for (let sarea of screen.sareas) {
      for (let area of sarea.editors) {
        area.data_link(area, getblock, getblock_us);
      }
    }
  }

  destroyScreen() {
    console.warn("destroyScreen called");

    if (this.screen !== undefined) {
      for (let sarea of this.screen.sareas) {
        for (let area of sarea.editors) {
          area.on_destroy();
        }
      }

      this.screen.unlisten();
      this.screen.destroy();
      this.screen.remove();
      this.screen = undefined;
    }
  }

  do_versions_post(version: float) {
    let datalib = this.datalib;

    if (version < 0.052) {
      for (let scene of datalib.scenes) {
        for (let frameset of datalib.framesets) {
          let ob = scene.addFrameset(frameset);
          scene.setActiveObject(ob);
        }
      }
      console.log("objectification");
    }

    if (version < 0.053) {
      let map = {};
      let max_id = -1;

      for (let block of this.datalib.allBlocks) {
        max_id = Math.max(max_id, block.lib_id + 1);
      }

      this.datalib.idgen.set_cur(max_id);
      this.datalib.idmap = {};

      for (let list of this.datalib.datalists) {
        list = this.datalib.datalists.get(list);
        list.idmap = {};

        for (let block of list) {
          if (block.lib_id in map) {
            console.warn("%cConverting old file with overlapping DataBlock IDs", "color : red");
            block.lib_id = this.datalib.idgen.gen_id();
          }

          list.idmap[block.lib_id] = block;
          this.datalib.idmap[block.lib_id] = block;
          map[block.lib_id] = 1;
        }
      }
    }
  }

  load_path(path_handle) {
    platform.app.openFile(path_handle).then((buf) => {
      let dview = new DataView(buf.buffer);
      this.load_user_file_new(dview, path_handle);
    }).catch((error) => {
      this.ctx.error(error.toString());
    });
  }

  load_user_file_new(data: DataView, path: String, uctx: unpack_ctx, use_existing_screen = false) {
    //fixes a bug where some files loaded with squished
    //size.  probably need to track down actual cause, though.
    if (this.screen !== undefined)
      this.size = new Vector2(this.screen.size);

    if (uctx === undefined) {
      uctx = new unpack_ctx();
    }

    let s = unpack_static_string(data, uctx, 4);
    if (s !== "FAIR") {
      console.log("header", s, s.length);
      console.log("data", new Uint8Array(data.buffer));
      throw new Error("Could not load file.");
    }

    let file_flag = unpack_int(data, uctx);

    let version_major = unpack_int(data, uctx);
    let version_minor = unpack_int(data, uctx) / 1000.0;

    let version = version_major + version_minor;

    if (file_flag & FileFlags.COMPRESSED_LZSTRING) {
      if (DEBUG.compression)
        console.log("decompressing. . .");

      data = new Uint16Array(data.buffer.slice(uctx.i, data.byteLength));
      let s = ""
      for (let i = 0; i < data.length; i++) {
        s += String.fromCharCode(data[i]);
      }
      data = LZString.decompress(s)

      let data2 = new Uint8Array(data.length);
      if (DEBUG.compression)
        console.log("uncompressed length: ", data.length);

      for (let i = 0; i < data.length; i++) {
        data2[i] = data.charCodeAt(i);
      }

      data = new DataView(data2.buffer);
      uctx.i = 0;
    }

    let blocks = new Array();
    let fstructs = new STRUCT();
    let datalib = undefined;

    let tmap = get_data_typemap();

    window._send_killscreen();

    while (uctx.i < data.byteLength) {
      let type = unpack_static_string(data, uctx, 4);
      let subtype = unpack_static_string(data, uctx, 4);
      let len = unpack_int(data, uctx);
      let bdata;

      if (subtype === "JSON") {
        bdata = unpack_static_string(data, uctx, len);
      } else if (subtype === "STRT") {
        if (type === "BLCK") {
          let dtype = unpack_int(data, uctx);
          bdata = unpack_bytes(data, uctx, len - 4);
          bdata = [dtype, bdata];
        } else {
          bdata = unpack_bytes(data, uctx, len);
          if (type === "DLIB") {
            datalib = fstructs.read_object(bdata, DataLib);
          }
        }
      } else if (subtype === "SDEF") {
        bdata = unpack_static_string(data, uctx, len).trim();
        fstructs.parse_structs(bdata);
      } else {
        console.log(subtype, type, uctx.i, data.byteLength);
        console.trace();
        //throw new Error("Unknown block type '" + subtype + "', " + JSON.stringify({subtype: subtype, type : type}));
        break;
      }

      blocks.push({type: type, subtype: subtype, len: len, data: bdata});
    }

    if (datalib === undefined) {
      console.warn("%c Creating new DataLib; probably an old file...", "color : red;");
      datalib = new DataLib();
    }

    for (let i = 0; i < blocks.length; i++) {
      let b = blocks[i];

      if (b.subtype === "JSON") {
        b.data = JSON.parse(b.data);
      } else if (b.subtype === "STRT") { //struct data should only be lib blocks
        if (b.type === "BLCK") {
          let lt = tmap[b.data[0]];

          lt = lt !== undefined ? lt.name : lt;

          b.data = fstructs.read_object(b.data[1], tmap[b.data[0]]);
          b.data.lib_refs = 0; //reading code will re-calculate ref count

          datalib.add(b.data, false);
        } else {
          if (b.type === "SCRN") {
            b.data = this.readScreen(fstructs, b.data);
          } else if (b.type === "THME") {
            b.data = fstructs.read_object(b.data, Theme);
          }
        }
      }
    }

    //load theme, if it exists
    for (let i = 0; i < blocks.length; i++) {
      let block = blocks[i];

      if (block.type === "THME") {
        let old = window.g_theme;

        window.g_theme = block.data;
        window.g_theme.gen_globals();

        old.patch(window.g_theme);
      }
    }

    //let ascopy = this.copy();

    if (this.datalib !== undefined) {
      this.datalib.on_destroy();
    }

    this.datalib = datalib;

    //ensure we get an error if the unpacking code/
    //tries to access g_app_state.active_view2d.
    this.active_view2d = undefined;

    let getblock = wrap_getblock(datalib);
    let getblock_us = wrap_getblock_us(datalib);
    let screen = undefined;

    let toolstack = undefined;
    let this2 = this;

    function load_state() {
      //handle version changes
      this2.do_versions(datalib, blocks, version);

      for (let i = 0; i < blocks.length; i++) {
        let block = blocks[i];

        if (block.subtype === "STRT" && !_nonblocks.has(block.type)) {
          block.data.data_link(block.data, getblock, getblock_us);
        }
      }

      for (let i = 0; i < blocks.length; i++) {
        let block = blocks[i];

        if (block.type === "SCRN") {
          screen = block.data;
        }
      }

      this2.destroyScreen();

      let size = new Vector2(this2.size);
      if (screen === undefined) {
        //generate default UI layout
        gen_default_file(this2.size);

        if (this2.datalib !== undefined) {
          this2.datalib.on_destroy();
        }
        this2.datalib = datalib;
        screen = this2.screen;
      } else {
        //argh, have to set a dummy DataLib here prior to reset_state,
        //because of stupid active_splinepath accessors

        this2.datalib = new DataLib();

        if (this2.datalib !== undefined) {
          this2.datalib.on_destroy();
        }
        this2.reset_state(screen, undefined);
        this2.datalib = datalib;

        get_app_div().appendChild(screen);
      }

      this2.screen = screen;
      resetAreaStacks();

      this2.size = size;

      //stupid. . .
      for (let sa of screen.sareas) {
        //TODO: need to get rid of appstate.active_view2d
        if (sa.area instanceof View2DHandler) {
          this2.active_view2d = sa.area;
          break;
        }
      }

      let ctx = new FullContext();

      if (screen !== undefined) {
        screen.view2d = this2.active_view2d;
        this2.dataLinkScreen(screen, getblock, getblock_us);
      }

      //load data into appstate
      if (this2.datalib !== undefined) {
        this2.datalib.on_destroy();
      }
      this2.datalib = datalib;

      this2.eventhandler = this2.screen;

      //find toolstack block, if it exists
      for (let i = 0; i < blocks.length; i++) {
        let block = blocks[i];

        if (block.type === "TSTK") {
          console.warn("%cFound a tool stack block", "color : blue;", block);
          toolstack = block.data;
        }
      }
    }

    function add_macro(p1, p2, tool) {
      p1.push(tool);
      p2.push(tool.saved_context);

      for (let t of tool.tools) {
        if (t instanceof ToolMacro)
          add_macro(p1, p2, t);

        t.parent = tool;

        p1.push(t);
        p2.push(tool.saved_context);
      }
    }

    load_state();
    this.filepath = path;

    if (toolstack !== undefined) {
      this.toolstack = fstructs.read_object(toolstack, ToolStack);
      this.toolstack.undocur = this.toolstack.undostack.length;

      let patch_tools1 = new Array();
      let patch_tools2 = new Array();

      //set tool property contexts
      for (let i = 0; i < this.toolstack.undostack.length; i++) {
        let tool = this.toolstack.undostack[i];

        //handle mangled names
        if (tool.uiname === "(undefined)" || tool.uiname === undefined || tool.uiname === "") {
          tool.uiname = tool.name;

          if (tool.uiname === "(undefined)" || tool.uiname === undefined || tool.uiname === "") {
            tool.uiname = "Macro";
          }
        }

        //add undo barrier flag, since we don't serialize undo
        //data.
        //UPDATE: no longer necassary, due to new HAS_UNDO_DATA flag
        //tool.undoflag |= UndoFlags.UNDO_BARRIER;

        //tools in the undostack
        patch_tools1.push(tool);
        patch_tools2.push(tool.saved_context);

        //tools within macros
        if (tool instanceof ToolMacro) {
          add_macro(patch_tools1, patch_tools2, tool);
        }
      }

      for (let i = 0; i < this.toolstack.undostack.length; i++) {
        let tool = this.toolstack.undostack[i];
        tool.stack_index = i;
      }

      //set toolproperty contexts
      for (let i = 0; i < patch_tools1.length; i++) {
        let tool = patch_tools1[i];
        let saved_context = patch_tools2[i];

        for (let k in tool.inputs) {
          tool.inputs[k].ctx = saved_context;
        }

        for (let k in tool.outputs) {
          tool.outputs[k].ctx = saved_context;
        }
      }
    }

    this.do_versions_post(version);

    //this2.screen.on_resize(this2.size);
    //this2.screen.size = this2.size;

    window.redraw_viewport();
  }

  readScreen(fstructs: STRUCT, data: DataView) {
    let screen;

    if (!(Screen.structName in fstructs.structs)) {
      screen = patchScreen(this, fstructs, data);
    } else {
      screen = fstructs.read_object(data, FairmotionScreen);
    }

    screen.style["position"] = "absolute";

    screen.setAttribute("id", "screenmain");
    screen.id = "screenmain";

    screen.ctx = new FullContext();

    screen.setCSS();
    screen.makeBorders();

    return screen;
  }

  load_blocks(data: DataView, uctx: unpack_ctx) {
    if (uctx === undefined) {
      uctx = new unpack_ctx();
    }

    let s = unpack_static_string(data, uctx, 4);
    if (s !== "FAIR") {
      console.log(s, s.length);
      console.log(data);
      throw new Error("Could not load file.");
    }

    let file_flag = unpack_int(data, uctx);

    let version_major = unpack_int(data, uctx);
    let version_minor = unpack_int(data, uctx) / 1000.0;

    let version = version_major + version_minor;

    if (file_flag & FileFlags.COMPRESSED_LZSTRING) {
      if (DEBUG.compression)
        console.log("decompressing. . .");

      data = new Uint16Array(data.buffer.slice(uctx.i, data.byteLength));
      let s = ""
      for (let i = 0; i < data.length; i++) {
        s += String.fromCharCode(data[i]);
      }
      data = LZString.decompress(s)

      let data2 = new Uint8Array(data.length);
      if (DEBUG.compression)
        console.log("uncompressed length: ", data.length);

      for (let i = 0; i < data.length; i++) {
        data2[i] = data.charCodeAt(i);
      }

      data = new DataView(data2.buffer);
      uctx.i = 0;
    }

    let blocks = new Array();
    let fstructs = new STRUCT();

    let tmap = get_data_typemap();

    while (uctx.i < data.byteLength) {
      let type = unpack_static_string(data, uctx, 4);
      let subtype = unpack_static_string(data, uctx, 4);
      let len = unpack_int(data, uctx);
      let bdata;

      if (subtype === "JSON") {
        bdata = unpack_static_string(data, uctx, len);
      } else if (subtype === "STRT") {
        if (type === "BLCK") {
          let dtype = unpack_int(data, uctx);
          bdata = unpack_bytes(data, uctx, len - 4);
          bdata = [dtype, bdata];
        } else {
          bdata = unpack_bytes(data, uctx, len);
        }
      } else if (subtype === "SDEF") {
        bdata = unpack_static_string(data, uctx, len).trim();
        fstructs.parse_structs(bdata);
      } else {
        console.log(subtype, type, uctx.i, data.byteLength);
        console.trace();
        throw new Error("Unknown block type '" + subtype + "', " + JSON.stringify({subtype: subtype, type: type}));
      }

      blocks.push({type: type, subtype: subtype, len: len, data: bdata});
    }

    return new FileData(blocks, fstructs, version);
  }

  link_blocks(datalib: DataLib, filedata: FileData) {
    let blocks = filedata.blocks;
    let fstructs = filedata.fstructs;
    let version = filedata.version;

    let tmap = get_data_typemap();
    let screen = undefined;

    for (let i = 0; i < blocks.length; i++) {
      let b = blocks[i];

      if (b.subtype === "JSON") {
        b.data = JSON.parse(b.data);
      } else if (b.subtype === "STRT") { //struct data should only be lib blocks
        if (b.type === "BLCK") {
          let lt = tmap[b.data[0]];

          lt = lt !== undefined ? lt.name : lt;

          b.data = fstructs.read_object(b.data[1], tmap[b.data[0]]);

          datalib.add(b.data, false);
        } else {
          if (b.type === "SCRN") {
            b.data = screen = this.readScreen(fstructs, b.data);
          }
        }
      }
    }

    //ensure we get an error if the unpacking code/
    //tries to access g_app_state.active_view2d.
    this.active_view2d = undefined;

    let getblock = wrap_getblock(datalib);
    let getblock_us = wrap_getblock_us(datalib);

    this.scene = undefined;

    //handle version changes
    this.do_versions(datalib, blocks, version);

    for (let i = 0; i < blocks.length; i++) {
      let block = blocks[i];

      if (block !== undefined && (typeof (block.data) === "string" || block.data instanceof String))
        continue;

      if (block.data !== undefined && "data_link" in block.data &&
        block.subtype === "STRT" && block.type !== "SCRN" && block.type !== "THME") {
        block.data.data_link(block.data, getblock, getblock_us);
      }
    }

    for (let block of blocks) {
      //for (let i=0; i<blocks.length; i++) {
      //let block = blocks[i];
      if (block.type === "SCRN") {
        screen = block.data;
      }
    }

    if (screen !== undefined) {
      this.active_view2d = undefined;

      for (let sa of screen.sareas) {
        //need to get rid of appstate.active_view2d
        if (sa.area instanceof View2DHandler) {
          this.active_view2d = sa.area;
          break;
        }
      }
    }

    let ctx = new FullContext();

    if (screen !== undefined) {
      screen.view2d = this.active_view2d;
      this.dataLinkScreen(screen, getblock, getblock_us);
    }

    if (screen !== undefined) {
      screen.on_resize(this.size);
      screen.size = this.size;
    }
  }
}

window.AppState = AppState;

class SavedContext {
  _props: Object;

  constructor(ctx: FullContext) {
    this._props = {};

    this._datalib = undefined;

    if (ctx) {
      this.save(ctx)
    } else {
      ctx = g_app_state.ctx;

      this.state = g_app_state;
      this.datalib = ctx.datalib;
      this.api = ctx.api;
      this.toolstack = ctx.toolstack;
    }
  }

  get datalib() {
    if (this._datalib) {
      return this._datalib;
    }

    return g_app_state.datalib;
  }

  set datalib(d) {
    this._datalib = d;
  }

  make(k) {
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
      }
    })
  }

  set_context(ctx) {
    //not necassary anymore
  }

  save(ctx) {
    this.state = ctx.state;
    this.datalib = ctx.datalib;
    this.api = ctx.api;
    this.toolstack = ctx.toolstack;
    this.screen = ctx.screen;
    this._props = {};

    ctx = ctx.toLocked();


    for (let k in ctx.props) {
      let v = ctx.props[k].data;

      let val = v.value;
      let type = v.type;

      if (v.type === "passthru" && typeof val === "object") {
        val = undefined;
        type = "lookup";
      }

      if (v.type !== "block" && typeof val === "object") {
        val = undefined;
      }

      this._props[k] = {
        type: type,
        key: k,
        value: val
      };

      this.make(k, v);
    }
  }

  saveJSON() {
    return JSON.stringify(this._props);
  }

  loadSTRUCT(reader) {
    reader(this);

    let json;

    try {
      json = JSON.parse(this.json);
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

class SavedContextOld {
  _frameset_editmode: string
  selectmode: number
  _scene: DataRef
  _frameset: DataRef
  time: number
  _spline_path: string;

  constructor(ctx = undefined) {
    if (ctx !== undefined) {
      this.time = ctx.scene !== undefined ? ctx.scene.time : undefined;
      this.edit_all_layers = ctx.edit_all_layers;

      this._scene = ctx.scene ? new DataRef(ctx.scene) : new DataRef(-1);
      this._frameset = ctx.frameset ? new DataRef(ctx.frameset) : new DataRef(-1);
      this._object = ctx.scene && ctx.scene.objects.active ? ctx.scene.objects.active.id : -1;

      this._selectmode = ctx.selectmode;
      this._frameset_editmode = "MAIN";

      this._spline_path = ctx.splinepath;
      if (ctx.spline !== undefined) {
        this._active_spline_layer = ctx.spline.layerset.active.id;
      }
    } else {
      this.selectmode = 0;
      this._scene = new DataRef(-1);
      this._frameset = new DataRef(-1);
      this.time = 0;
      this._spline_path = "frameset.drawspline";
      this._active_spline_layer = -1;
    }
  }

  get splinepath() {
    return this._spline_path;
  }

  //changes state so that normal Context() accessor structs have the right data
  set_context(state: Context) {
    let scene = state.datalib.get(this._scene);
    let fset = state.datalib.get(this._frameset);

    if (scene !== undefined && scene.time !== this.time)
      scene.change_time(this, this.time, false);

    //this._object = ctx.scene && ctx.scene.objects.active ? ctx.scene.objects.active.id : -1;
    if (this._object >= 0 && (!scene.objects.active || this._object !== scene.objects.active.id)) {
      try {
        scene.setActiveObject(this._object);
      } catch (error) {
        util.print_stack(error);
      }
    }

    this._selectmode = state.selectmode;

    //console.log(this._spline_path);

    if (fset !== undefined)
      fset.editmode = this._frameset_editmode;
    state.switch_active_spline(this._spline_path);

    let spline = state.api.getObject(state, this._spline_path);
    if (spline !== undefined) {
      let layer = spline.layerset.idmap[this._active_spline_layer];

      if (layer === undefined) {
        warn("Warning: layer was undefined in SavedContext!");
      } else {
        spline.layerset.active = layer;
      }
    } else {
      warn("Warning: spline was undefined in SavedContext!");
    }
  }

  get spline(): FrameSet {
    let ret = g_app_state.api.get_object(this, this._spline_path);

    if (ret === undefined) {
      warntrace("Warning: bad spline path", this._spline_path);
      ret = g_app_state.api.get_object(this, "frameset.drawspline");

      if (ret === undefined) {
        console.trace("Even Worse: base spline path failed!");
      }
    }

    return ret;
  }

  get selectmode(): int {
    return this._selectmode;
  }

  get frameset(): SplineFrameSet {
    return g_app_state.datalib.get(this._frameset);
  }

  get datalib(): DataLib {
    return g_app_state.datalib;
  }

  get scene(): Scene {
    return this._scene !== undefined ? g_app_state.datalib.get(this._scene) : undefined;
  }

  get api(): DataAPI {
    return g_app_state.pathcontroller;
  }

  static fromSTRUCT(reader): SavedContext {
    let sctx = new SavedContext();

    reader(sctx);

    if (sctx._scene.id === -1)
      sctx._scene = undefined;
    return sctx;
  }
}

SavedContextOld.STRUCT = `
  SavedContext {
    _scene               : DataRef | obj._scene === undefined ? new DataRef(-1) : obj._scene;
    _frameset            : DataRef | obj._frameset === undefined ? new DataRef(-1) : obj._frameset;
    _frameset_editmode   : static_string[12];
    _spline_path         : string;
    time                 : float;
    edit_all_layers      : int;
  }
`;


/*
  The Context classes represent a set of common arguments that
  are passed to various parts of the API (especially the tool
  and data/UI APIs).  Like most of the rest of the tool API,
  it's inspired by what Blender does.
*/

//restricted context for tools
export class _ToolContext {
  constructor(frameset, spline, scene, splinepath) {
    let ctx = new FullContext().toLocked();

    if (splinepath === undefined)
      splinepath = ctx.splinepath;

    if (frameset === undefined)
      frameset = ctx.frameset;

    if (spline === undefined && frameset !== undefined)
      spline = ctx.spline;

    if (scene === undefined)
      scene = ctx.scene;

    this.datalib = g_app_state.datalib;

    this.splinepath = splinepath;
    this.frameset = frameset;
    this.spline = spline;
    this.scene = scene;
    this.edit_all_layers = ctx.edit_all_layers;

    this.api = g_app_state.pathcontroller;
  }
}

//window.ToolContext = ToolContext;

/*
function Context() {
  this.view2d = g_app_state.active_view2d;
  this.font = g_app_state.raster.font
  this.api = g_app_state.api;
  this.screen = g_app_state.screen;
  this.datalib = g_app_state.datalib;
  
  //find active scene, object, and object data, respectively
  let sce = g_app_state.datalib.get_active(DataTypes.SCENE);
  this.scene = sce;
  this.object = undefined;
  
  if (sce !== undefined) {
    if (sce.active === undefined && sce.objects.length > 0) {
      if (DEBUG.datalib) {
        warn(["WARNING: sce.objects (a DBList) had an undefined .active",
              "in the prescence of objects.  This should be impossible.",
              "Correcting."].join("\n"));
      }
      
      sce.active = sce.objects[0];
    }
    
    if (sce.active !== undefined) {
      this.object = sce.active;
      if (sce.active.data instanceof Mesh)
        this.mesh = sce.active.data;
    }
  }
  
  this.appstate = g_app_state;
  this.toolstack = g_app_state.toolstack;
  this.keymap_mpos = [0, 0]; //mouse position at time of keymap event firing
}
create_prototype(Context);
*/


