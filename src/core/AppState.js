"use strict";

import '../editors/all.js';

import * as electron_api from '../path.ux/scripts/platforms/electron/electron_api.js';
if (window.haveElectron) {
  electron_api.checkInit();
}

import * as theme from '../editors/theme.js';

import * as config from '../config/config.js';
import * as html5_fileapi from './fileapi/fileapi.js';

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
  VIEW2D : View2DHandler,
  SETTINGS : SettingsEditor,
  OPSTACK : OpStackEditor,
  MATERIAL : MaterialEditor,
  DOPESHEET : DopeSheetEditor,
  CURVE : CurveEditor,
  MENUBAR : MenuBar
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

  screen.style["width"] = "100%";
  screen.style["height"] = "100%";
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
import {DataPath, DataStruct, DataPathTypes, DataFlags,
        DataAPI, DataStructArray} from './data_api/data_api.js';
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
  pack_mat4,  pack_quat, pack_dataref, pack_string,
  pack_static_string, unpack_byte, unpack_short,
  unpack_int, unpack_float, unpack_double, unpack_vec2,
  unpack_vec3, unpack_vec4, unpack_mat4, unpack_quat,
  unpack_dataref, unpack_string, unpack_static_string,
  unpack_bytes, unpack_ctx
} from './ajax.js';

//include "src/config/config_defines.js"

//#ifdef PACK_PROFILE
import {profile_reset, profile_report, gen_struct_str, 
        STRUCT} from './struct.js';
//#endif

export var FileFlags = {COMPRESSED_LZSTRING : 1};

/*Globals*/
global AppState g_app_state = undefined, g, t=2;

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
    sv[1] = sv[1]*scale + MenuBar.getHeight();
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
  fromSTRUCT : (reader) => {
    let ret = {};
    reader(ret);
    return ret;
  },

  structName : "Screen",
  name : "Screen"
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

      if (editor.constructor.name == sarea.area) {
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
  constructor() {
    this.tokens = {} : ObjectMap;
    this.username = "user";
    this.password = "";
    this.is_logged_in = false;
    this.loaded_settings = false;
    this.userid = undefined;
    
    this.settings = new AppSettings();
  }
  
  copy() : UserSession {
    var c = new UserSession();

    for (var k in this.tokens) {
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
  
  store(override_settings=false) {
    var saveobj = this.copy();
    
    if (!override_settings && myLocalStorage.hasCached("session")) {
      try {
        var old = JSON.parse(myLocalStorage.getCached("session"));
        saveobj.settings = old;
      } catch (error) {
        print_stack(error);
        console.log("error loading session json object");
      }
    }
    
    myLocalStorage.set("session", JSON.stringify(saveobj));
  }
  
  logout_simple() {
    this.is_logged_in = false;
    this.tokens = {};
    this.loaded_settings = false;
  }
  
  validate_session() {
    var session = this;
    
    if (config.NO_SERVER) {
        this.is_logged_in = true;
        
        if (!session.loaded_settings) {
            session.settings.download(function() {
              session.loaded_settings = true;
              session.store(true);
            });
        }
        return;
    }
    
    function finish2(job, owner) {
      session.tokens = job.value;
      session.is_logged_in = true;
      session.store(false);
      
      if (DEBUG.netio)
        console.log("downloading current user settings. . .");
        session.settings.download(function() {
        session.store(true);
      });
    }
    
    function error2(obj, owner, msg) {
      session.is_logged_in = false;
      session.store();
    }
    
    function error(job, owner, msg) {
      auth_session(session.username, session.password, finish2, error2);
    }
    
    function finish(job, owner) {
      if (DEBUG.netio)
        console.log("downloading current user settings. . .");
      
      session.userid = job.value.userid;
      
      if (!session.loaded_settings) {
        session.settings.download(function() {
          session.loaded_settings = true;
          session.store(true);
        });
      }
      
      console.log("session valid");
      return;
    }
    
    call_api(get_user_info, undefined, finish, error);
  }
  
  static fromJSON(obj) {
    var us = new UserSession;
    
    us.tokens = obj.tokens;
    us.username = obj.username;
    us.password = obj.password;
    us.is_logged_in = obj.is_logged_in;
    us.userid = obj.userid;
    
    us.settings = new AppSettings();
    
    return us;
  }
}

window.test_load_file = function() {
  var buf = startup_file;
  buf = new DataView(b64decode(buf).buffer);

  g_app_state.load_user_file_new(buf, undefined, new unpack_ctx());
};

let load_default_file = function(g : AppState, size=[512, 512]) {
  if (!myLocalStorage.hasCached("startup_file")) {
    myLocalStorage.startup_file = startup_file;
  }

  //if (RELEASE && (!("startup_file" in myLocalStorage) || myLocalStorage.startup_file == undefined || myLocalStorage.startup_file == "undefined")) {
  //  myLocalStorage.startup_file = startup_file;
  //}

  //try loading twice, load embedded startup_file on second attempt
  for (var i=0; i<2; i++) {
    var file = i==0 ? myLocalStorage.getCached("startup_file") : startup_file;

    if (file)
      file = file.trim().replace(/[\n\r]/g, "");

    if (file) {
      //try {
        var buf = new DataView(b64decode(file).buffer);

        g.load_user_file_new(buf, undefined, new unpack_ctx());
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
window.gen_default_file = function gen_default_file(size=[512, 512], force_new=false) {
  //needed for chrome app file system api
  html5_fileapi.reset();
  
  var g = g_app_state;
  global startup_file;

  if (!force_new && load_default_file(g)) {
    return;
  }

  //reset app state, calling without args
  //will leave .screen undefined
  g.reset_state();
  
  var op = new BasicFileOp();
  g.toolstack.exec_tool(op);

  //set up screen UI
  
  //a 3d viewport
  //var view2d = new View2DHandler(0, 0, size[0], size[1], 0.75, 1000.0);

  //g.view2d = g.active_view2d = view2d;

  //now create screen
  gen_screen(undefined, size[0], size[1]);
}

function output_startup_file() : String {
  var str = myLocalStorage.getCached("startup_file");
  var out = ""
  
  for (var i=0; i<str.length; i++) {
    out += str[i];
    if (((i+1) % 77) == 0) {
      out += "\n";
    }
  }
  
  return out;
}

export class AppState {
  constructor(screen : FrameManager) {
    this.AppState_init(screen);
  }

  AppState_init(screen : FrameManager) {
    this.screen = screen;
    this.eventhandler = screen : EventHandler;

    this.settings = new AppSettings();
    this.active_editor = undefined;
    
    this._nonblocks = new set (["SCRN", "TSTK", "THME"]);
    
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
    
    static toolop_input_cache = {};
    this.toolop_input_cache = toolop_input_cache;
    
    if (this.datalib !== undefined) {
      this.datalib.on_destroy();
    }
    this.datalib = new DataLib();
    
    this.modalstate = 0; //see toolops_api.js
    this.jobs = new JobManager();
    
    if (myLocalStorage.hasCached("session")) {
      try {
        this.session = UserSession.fromJSON(JSON.parse(myLocalStorage.getCached("session")));
      } catch(error) {
        print_stack(error);
        console.log("Error loading json session object:", myLocalStorage.getCached("session"));
      }
    } else {
      this.session = new UserSession();
    }

    this.ctx = new FullContext(this);
  }

  set_modalstate(state=0) {
    this.modalstate = state;
  }
  
  get active_splinepath() {
    var scene = this.datalib.get_active(DataTypes.SCENE);

    //console.log("SPATH 1", scene != undefined ? scene.active_splinepath : "");
    
    if (scene != undefined) 
      return scene.active_splinepath;
    
    //console.log("SPATH 2");
    
    return this._active_splinepath;
  }
  
  set active_splinepath(val) {
    this._active_splinepath = val;
    
    //console.trace(val);
    
    var scene = this.datalib.get_active(DataTypes.SCENE);
    if (scene != undefined)
      scene.active_splinepath = val;
  }
  
  destroy() {
    console.trace("Appstate.destroy called");
    this.destroyScreen();
  }
  
  on_gl_lost(new_gl : WebGLRenderingContext) {
    this.gl = new_gl;
    this.raster.on_gl_lost(new_gl);
    this.datalib.on_gl_lost(new_gl);
    this.screen.on_gl_lost(new_gl);
  }
  
  update_context() {
    var scene = this.datalib.get_active(DataTypes.SCENE);
    if (scene === undefined) return;
  }

  switch_active_spline(newpath) {
    this.active_splinepath = newpath;
  }
  
  push_active_spline(newpath) {
    this.spline_pathstack.push(this.active_splinepath);
    this.switch_active_spline(newpath);
  }
  
  pop_active_spline() {
      this.switch_active_spline(this.spline_pathstack.pop());
  }
  
  reset_state(screen) {
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

    this.AppState_init(screen, undefined, this.gl);
  }

  //shallow copy
  copy() {
    var as = new AppState(this.screen, undefined, this.gl);
    as.datalib = this.datalib;
    as.session = this.session;
    as.toolstack = this.toolstack;
    as.filepath = this.filepath;
    
    return as;
  }

  set_startup_file() {
    var buf = this.create_user_file_new({
      gen_dataview : true, 
      compress : true,
      save_theme : false,
      save_toolstack : false
    });
    
    buf = new Uint8Array(buf.buffer);
    
    /*var ar = [];
    for (var i=0; i<buf.length; i++) {
      ar.push(buf[i]);
    }
    buf = JSON.stringify(ar);*/
    
    buf = b64encode(buf);
    
    ////XXX
    //warn("WARNING: not saving startup file, debugging file writing code");
    
    myLocalStorage.set("startup_file", buf);
    
    g_app_state.notes.label("New file template saved");
  }

  //file minus ui data, used by BasicFileDataOp
  create_scene_file() {
    var buf = this.create_user_file_new({
      save_screen : false, 
      save_toolstack : false
    });
    
    return buf;
  }
  
  create_undo_file() {
    var buf = this.create_user_file_new({
      save_screen : false,
      save_toolstack : false
   });
    
    return buf;
  }
  
  //used by BasicFileDataOp, which 
  //is a root toolop that stores
  //saved data
  load_scene_file(scenefile) {
   if (the_global_dag != undefined)
      the_global_dag.reset_cache();
    
    var screen = this.screen;
    var toolstack = this.toolstack;
    var view2d = this.active_view2d;
    
    console.log(scenefile);
    
    if (this.datalib !== undefined) {
      this.datalib.on_destroy();
    }
    
    var datalib = new DataLib();
    this.datalib = datalib;
    var filedata = this.load_blocks(scenefile);
    
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
  
  load_undo_file(undofile) {
    var screen = this.screen;
    var toolstack = this.toolstack;
    
    console.log(undofile);
    
    if (this.datalib != undefined) {
      this.datalib.on_destroy();
    }
    
    var datalib = new DataLib();
    this.datalib = datalib;
    var filedata = this.load_blocks(undofile);
    
    this.link_blocks(datalib, filedata);
    
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
  create_user_file_new(args={}) {
    var gen_dataview=true, compress=false;
    var save_screen=true, save_toolstack=false;
    var save_theme=false;
    
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
    
    var data = [];
    
    //header "magic"
    pack_static_string(data, "FAIR", 4);
    
    //general file flags, e.g. compression
    var flag = compress ? FileFlags.COMPRESSED_LZSTRING : 0;
    pack_int(data, flag);
    
    //version
    var major = Math.floor(g_app_version);
    var minor = Math.floor((g_app_version - Math.floor(g_app_version))*1000);
    
    pack_int(data, major);
    pack_int(data, minor);
    
    var headerdata = data;
    if (compress) {
      data = [];
    }
    
    //the schema struct definitions used to save
    //the non-JSON parts of this file.
    var buf = gen_struct_str();
    
    bheader(data, "SDEF", "SDEF") ;
    pack_string(data, buf);
    
    //reset struct profiler, if its enabled
//#ifdef PACK_PROFILE
    profile_reset();
//#endif
    
    if (save_screen) {
      //write screen block
      var data2 = []
      istruct.write_object(data2, this.screen);

      bheader(data, "SCRN", "STRT");
      pack_int(data, data2.length);
      data = data.concat(data2);
    }
    
    var data2 = [];
    for (var lib of this.datalib.datalists.values()) {
      for (var block of lib) {
        data2 = [];
        
        var t1 = time_ms();
        
        istruct.write_object(data2, block);
        
        t1 = time_ms() - t1;
        
        if (t1 > 50) {
          console.log(t1.toFixed(1)+"ms", block);
        }
        
        bheader(data, "BLCK", "STRT");
        pack_int(data, data2.length+4);
        pack_int(data, block.lib_type);
        
        data = data.concat(data2);
      }   
    }
    
//#ifdef PACK_PROFILE
    profile_report();
//#endif
    
    if (save_toolstack) {
      console.log("writing toolstack");
      
      var data2 = [];
      istruct.write_object(data2, this.toolstack);
      
      bheader(data, "TSTK", "STRT");
      pack_int(data, data2.length);
      data = data.concat(data2);
    }
    
    if (save_theme) {
      console.log("writing theme");
      var data2 = [];
      istruct.write_object(data2, g_theme);
      
      bheader(data, "THME", "STRT");
      pack_int(data, data2.length);
      data = data.concat(data2);
    }
    
    if (compress) {
      data = LZString.compress(new Uint8Array(data));
      console.log("using compression");
      
      var d = new Uint16Array(data.length);
      for (var i=0; i<data.length; i++) {
        d[i] = data.charCodeAt(i);
      }
      
      d = new Uint8Array(d.buffer);
      console.log("  file size", d.length);
      
      data = new Uint8Array(d.length + headerdata.length)
      for (var i=0; i<headerdata.length; i++) {
        data[i] = headerdata[i];
      }
      for (var i=0; i<d.length; i++) {
        data[i+headerdata.length] = d[i];
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
  write_blocks(args={}) {
    var gen_dataview=true, compress=false;
    var save_screen=args.save_screen != undefined ? args.save_screen : true;
    var save_toolstack=args.save_toolstack != undefined ? args.save_toolstack : false;
    var save_theme=false;
    var blocks = args["blocks"];
    
    if (args.gen_dataview != undefined)
      gen_dataview = args.gen_dataview;
    if (args.compress != undefined)
      compress = args.compress;
    
    function bheader(data, type, subtype) {
      pack_static_string(data, type, 4);
      pack_static_string(data, subtype, 4);
    }
    
    var data = [];
    
    //header "magic"
    pack_static_string(data, "FAIR", 4);
    
    //general file flags, e.g. compression
    var flag = compress ? FileFlags.COMPRESSED_LZSTRING : 0;
    pack_int(data, flag);
    
    //version
    var major = Math.floor(g_app_version);
    var minor = Math.floor((g_app_version - Math.floor(g_app_version))*1000);
    
    pack_int(data, major);
    pack_int(data, minor);
    
    var headerdata = data;
    if (compress) {
      data = [];
    }
    
    //the schema struct definitions used to save
    //the non-JSON parts of this file.
    var buf = gen_struct_str();
    
    bheader(data, "SDEF", "SDEF") ;
    pack_string(data, buf);
    
    for (var k in blocks) {
      var data2 = []
      istruct.write_object(data2, blocks[k]);

      bheader(data, k, "STRT");
      pack_int(data, data2.length);
      data = data.concat(data2);
    }
    
    if (compress) {
      console.log("1 using compression");
      data = LZString.compress(new Uint8Array(data));
      
      var d = new Uint16Array(data.length);
      for (var i=0; i<data.length; i++) {
        d[i] = data.charCodeAt(i);
      }
      
      d = new Uint8Array(d.buffer);
      console.log("  file size:", d.length);
      
      data = new Uint8Array(d.length + headerdata.length)
      for (var i=0; i<headerdata.length; i++) {
        data[i] = headerdata[i];
      }
      for (var i=0; i<d.length; i++) {
        data[i+headerdata.length] = d[i];
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
      for (var frameset of datalib.framesets) {
        for (var spline of frameset._allsplines) {
          console.log("========>", spline);
          
          for (var h of spline.handles) {
            //if (!h.use) continue;
            
            console.log("  -", h.segments[0], h.segments);
            console.log("  -", h.owning_segment);
            
            var s = h.owning_segment;
            var v1 = s.handle_vertex(h), v2 = s.other_vert(v1);
            
            console.log("patching handle!", h.eid);
            h.load(v2).sub(v1).mulScalar(1.0/3.0).add(v1);
          }
        }
      }
    }
    
    if (version < 0.047) {
      //create a scene
      var scene = new Scene();
      scene.set_fake_user();
      
      this.datalib.add(scene);
    }
    
    if (version < 0.048) {
      for (var frameset of datalib.framesets) {
        for (var spline of frameset._allsplines) {
          for (var eid in spline.eidmap) {
            var e = spline.eidmap[eid];
            var layer = spline.layerset.active; //should exist by this point
            
            //console.log("adding element to layer!");
            layer.add(e);
          }
        }
      }
    }
    
    if (version < 0.049) {
      for (var frameset of datalib.framesets) {
        if (frameset.kcache != undefined) {
          frameset.kcache.cache = {};
        }
        
        for (var s of frameset.spline.segments) {
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
      for (var frameset of datalib.framesets) {
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

      this.screen.destroy();
      this.screen.remove();
      this.screen = undefined;
    }
  }

  do_versions_post(version : float) {
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
  }
  
  load_user_file_new(data : DataView, path : String, uctx : unpack_ctx, use_existing_screen=false) {
    //fixes a bug where some files loaded with squished
    //size.  probably need to track down actual cause, though.
    if (this.screen !== undefined)
      this.size = new Vector2(this.screen.size);
    
    if (uctx == undefined) {
      uctx = new unpack_ctx();
    }
    
    var s = unpack_static_string(data, uctx, 4);
    if (s != "FAIR") {
      console.log("header", s, s.length);
      console.log("data", new Uint8Array(data.buffer));
      throw new Error("Could not load file.");
    }
    
    var file_flag = unpack_int(data, uctx);
    
    var version_major = unpack_int(data, uctx);
    var version_minor = unpack_int(data, uctx)/1000.0;
    
    var version = version_major + version_minor;

    if (file_flag & FileFlags.COMPRESSED_LZSTRING) {
      if (DEBUG.compression)
        console.log("decompressing. . .");
      
      data = new Uint16Array(data.buffer.slice(uctx.i, data.byteLength));
      var s = ""
      for (var i=0; i<data.length; i++) {
        s += String.fromCharCode(data[i]);
      }
      data = LZString.decompress(s)
      
      var data2 = new Uint8Array(data.length);
      if (DEBUG.compression)
        console.log("uncompressed length: ", data.length);
      
      for (var i=0; i<data.length; i++) {
        data2[i] = data.charCodeAt(i);
      }
      
      data = new DataView(data2.buffer);
      uctx.i = 0;
    }
    
    var blocks = new GArray();
    var fstructs = new STRUCT();
    var datalib = new DataLib();
    
    var tmap = get_data_typemap();
    
    window._send_killscreen();
    
    while (uctx.i < data.byteLength) {
      var type = unpack_static_string(data, uctx, 4);
      var subtype = unpack_static_string(data, uctx, 4);
      var len = unpack_int(data, uctx);
      var bdata;
      
      if (subtype == "JSON") {
        bdata = unpack_static_string(data, uctx, len);
      } else if (subtype == "STRT") {
        if (type == "BLCK") {
          var dtype = unpack_int(data, uctx);
          bdata = unpack_bytes(data, uctx, len-4);
          bdata = [dtype, bdata];
        } else {
          bdata = unpack_bytes(data, uctx, len);        
        }
      } else if (subtype == "SDEF") {
        bdata = unpack_static_string(data, uctx, len).trim();
        fstructs.parse_structs(bdata);
      } else {
        console.log(subtype, type, uctx.i, data.byteLength);
        console.trace();
        //throw new Error("Unknown block type '" + subtype + "', " + JSON.stringify({subtype: subtype, type : type}));
        break;
      }
      
      blocks.push({type : type, subtype : subtype, len : len, data : bdata});
    }
    
    for (var i=0; i<blocks.length; i++) {
      var b = blocks[i];
      
      if (b.subtype == "JSON") {
        b.data = JSON.parse(b.data);
      } else if (b.subtype == "STRT") { //struct data should only be lib blocks
        if (b.type == "BLCK") {
          var lt = tmap[b.data[0]];
          
          lt = lt != undefined ? lt.name : lt;
          
          b.data = fstructs.read_object(b.data[1], tmap[b.data[0]]);
          b.data.lib_refs = 0; //reading code will re-calculate ref count
          
          datalib.add(b.data, false);
        } else {
          if (b.type == "SCRN") {
            b.data = this.readScreen(fstructs, b.data);
          } else if (b.type == "THME") {
            b.data = fstructs.read_object(b.data, Theme);
          }
        }
      }
    }
    
    //load theme, if it exists
    for (var i=0; i<blocks.length; i++) {
        var block = blocks[i];
        
        if (block.type == "THME") {
          global g_theme;
          
          var old = g_theme;
          
          g_theme = block.data;
          g_theme.gen_globals();
          
          old.patch(g_theme);
        }
    }
    
    //var ascopy = this.copy();
    
    if (this.datalib != undefined) {
      this.datalib.on_destroy();
    }
    
    this.datalib = datalib;
    
    //ensure we get an error if the unpacking code/
    //tries to access g_app_state.active_view2d.
    this.active_view2d = undefined;
    
    var getblock = wrap_getblock(datalib);
    var getblock_us = wrap_getblock_us(datalib);  
    var screen = undefined;
    
    var toolstack = undefined;
    var this2 = this;

    function load_state() {
      //handle version changes
      this2.do_versions(datalib, blocks, version);
      
      for (var i=0; i<blocks.length; i++) {
        var block = blocks[i];
        
        if (block.subtype == "STRT" && !this2._nonblocks.has(block.type)) {
          block.data.data_link(block.data, getblock, getblock_us);
        }
      }
      
      for (var i=0; i<blocks.length; i++) {
        var block = blocks[i];
        
        if (block.type == "SCRN") {
          screen = block.data;
        }
      }

      this2.destroyScreen();

      var size = new Vector2(this2.size);
      if (screen === undefined) {
        //generate default UI layout
        gen_default_file(this2.size);
        
        if (this2.datalib != undefined) {
          this2.datalib.on_destroy();
        }
        this2.datalib = datalib;
        screen = this2.screen;
      } else {
        //argh, have to set a dummy DataLib here prior to reset_state,
        //because of stupid active_splinepath accessors
        
        this2.datalib = new DataLib();
        
        if (this2.datalib != undefined) {
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
      for (var sa of screen.sareas) {
        //TODO: need to get rid of appstate.active_view2d
        if (sa.area instanceof View2DHandler) {
          this2.active_view2d = sa.area;
          break;
        }
      }
      
      var ctx = new FullContext();

      if (screen !== undefined) {
        screen.view2d = this2.active_view2d;
        this2.dataLinkScreen(screen, getblock, getblock_us);
      }
      
      //load data into appstate
      if (this2.datalib != undefined) {
        this2.datalib.on_destroy();
      }
      this2.datalib = datalib;

      this2.eventhandler = this2.screen;

      var ctx = new FullContext();
      
      //find toolstack block, if it exists
      for (var i=0; i<blocks.length; i++) {
        var block = blocks[i];
        
        if (block.type == "TSTK") {
          toolstack = block.data;
        }      
      }
    }
    
    function add_macro(p1, p2, tool) {
      p1.push(tool);
      p2.push(tool.saved_context);
      
      for (var t of tool.tools) {
        if (t instanceof ToolMacro)
          add_macro(p1, p2, t);
        
        t.parent = tool;
        
        p1.push(t);
        p2.push(tool.saved_context);
      }
    }
     
    load_state();
    this.filepath = path;
    
    if (toolstack != undefined) {
      this.toolstack = fstructs.read_object(toolstack, ToolStack);
      this.toolstack.undocur = this.toolstack.undostack.length;
      
      var patch_tools1 = new GArray();
      var patch_tools2 = new GArray();
      
      //set tool property contexts
      for (var i=0; i<this.toolstack.undostack.length; i++) {
        var tool = this.toolstack.undostack[i];
        
        //handle mangled names
        if (tool.uiname == "(undefined)" || tool.uiname == undefined || tool.uiname == "") {
          tool.uiname = tool.name;
          
          if (tool.uiname == "(undefined)" || tool.uiname == undefined || tool.uiname == "") {
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
      
      for (var i=0; i<this.toolstack.undostack.length; i++) {
        var tool = this.toolstack.undostack[i];
        tool.stack_index = i;
      }
      
      //set toolproperty contexts
      for (var i=0; i<patch_tools1.length; i++) {
        var tool = patch_tools1[i];
        var saved_context = patch_tools2[i];
        
        for (var k in tool.inputs) {
          tool.inputs[k].ctx = saved_context;
        }
        
        for (var k in tool.outputs) {
          tool.outputs[k].ctx = saved_context;
        }
      }
    }
    
    this.do_versions_post(version);

    //this2.screen.on_resize(this2.size);
    //this2.screen.size = this2.size;

    window.redraw_viewport();
  }

  readScreen(fstructs, data) {
    let screen;

    if (!(Screen.structName in fstructs.structs)) {
      screen = patchScreen(this, fstructs, data);
    } else {
      screen = fstructs.read_object(data, FairmotionScreen);
    }

    screen.style["width"] = "100%";
    screen.style["height"] = "100%";
    screen.style["position"] = "absolute";

    screen.setAttribute("id", "screenmain");
    screen.id = "screenmain";

    screen.ctx = new FullContext();

    screen.setCSS();
    screen.makeBorders();

    return screen;
  }

  load_blocks(DataView data, unpack_ctx uctx) {
    if (uctx == undefined) {
      uctx = new unpack_ctx();
    }
    
    var s = unpack_static_string(data, uctx, 4);
    if (s != "FAIR") {
      console.log(s, s.length);
      console.log(data);
      throw new Error("Could not load file.");
    }
    
    var file_flag = unpack_int(data, uctx);
    
    var version_major = unpack_int(data, uctx);
    var version_minor = unpack_int(data, uctx)/1000.0;
    
    var version = version_major + version_minor;
    
    if (file_flag & FileFlags.COMPRESSED_LZSTRING) {
      if (DEBUG.compression)
        console.log("decompressing. . .");
      
      data = new Uint16Array(data.buffer.slice(uctx.i, data.byteLength));
      var s = ""
      for (var i=0; i<data.length; i++) {
        s += String.fromCharCode(data[i]);
      }
      data = LZString.decompress(s)
      
      var data2 = new Uint8Array(data.length);
      if (DEBUG.compression)
        console.log("uncompressed length: ", data.length);
      
      for (var i=0; i<data.length; i++) {
        data2[i] = data.charCodeAt(i);
      }
      
      data = new DataView(data2.buffer);
      uctx.i = 0;
    }
    
    var blocks = new GArray();
    var fstructs = new STRUCT();
    
    var tmap = get_data_typemap();
    
    while (uctx.i < data.byteLength) {
      var type = unpack_static_string(data, uctx, 4);
      var subtype = unpack_static_string(data, uctx, 4);
      var len = unpack_int(data, uctx);
      var bdata;
      
      if (subtype == "JSON") {
        bdata = unpack_static_string(data, uctx, len);
      } else if (subtype == "STRT") {
        if (type == "BLCK") {
          var dtype = unpack_int(data, uctx);
          bdata = unpack_bytes(data, uctx, len-4);
          bdata = [dtype, bdata];
        } else {
          bdata = unpack_bytes(data, uctx, len);        
        }
      } else if (subtype == "SDEF") {
        bdata = unpack_static_string(data, uctx, len).trim();
        fstructs.parse_structs(bdata);
      } else {
        console.log(subtype, type, uctx.i, data.byteLength);
        console.trace();
        throw new Error("Unknown block type '" + subtype + "', " + JSON.stringify({subtype: subtype, type : type}));
      }
      
      blocks.push({type : type, subtype : subtype, len : len, data : bdata});
    }
    
    return new FileData(blocks, fstructs, version);
  }
  
  link_blocks(DataLib datalib, FileData filedata) {
    var blocks = filedata.blocks;
    var fstructs = filedata.fstructs;
    var version = filedata.version;
    
    var tmap = get_data_typemap();
    var screen = undefined;

    for (var i=0; i<blocks.length; i++) {
      var b = blocks[i];
      
      if (b.subtype == "JSON") {
        b.data = JSON.parse(b.data);
      } else if (b.subtype == "STRT") { //struct data should only be lib blocks
        if (b.type == "BLCK") {
          var lt = tmap[b.data[0]];
          
          lt = lt != undefined ? lt.name : lt;
          
          b.data = fstructs.read_object(b.data[1], tmap[b.data[0]]);
          
          datalib.add(b.data, false);
        } else {
          if (b.type == "SCRN") {
            b.data = screen = this.readScreen(fstructs, b.data);
          }
        }
      }
    }
    
    //ensure we get an error if the unpacking code/
    //tries to access g_app_state.active_view2d.
    this.active_view2d = undefined;
    
    var getblock = wrap_getblock(datalib);
    var getblock_us = wrap_getblock_us(datalib);  

    this.scene = undefined;
    
    //handle version changes
    this.do_versions(datalib, blocks, version);
    
    for (var i=0; i<blocks.length; i++) {
      var block = blocks[i];
      
      if (block != undefined && (typeof(block.data) == "string" || block.data instanceof String))
        continue;
      
      if (block.data != undefined && "data_link" in block.data && 
          block.subtype == "STRT" && block.type != "SCRN" && block.type != "THME") 
      {
        block.data.data_link(block.data, getblock, getblock_us);
      }
    }

    for (let block of blocks) {
    //for (var i=0; i<blocks.length; i++) {
      //var block = blocks[i];
      if (block.type == "SCRN") {
        screen = block.data;
      }
    }
    
    if (screen != undefined) {
      this.active_view2d = undefined;
      
      for (var sa of screen.sareas) {
        //need to get rid of appstate.active_view2d
        if (sa.area instanceof View2DHandler) {
          this.active_view2d = sa.area;
          break;
        }
      }
    }
    
    var ctx = new FullContext();
    
    if (screen != undefined) {
      screen.view2d = this.active_view2d;
      this.dataLinkScreen(screen, getblock, getblock_us);
    }
    
    if (screen != undefined) {
      screen.on_resize(this.size);
      screen.size = this.size;
    }
  }
}

window.AppState = AppState;

class SavedContext {
  constructor(ctx) {
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
      get : function() {
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
        type  : type,
        key   : k,
        value : val
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
  constructor(ctx=undefined) {
    if (ctx != undefined) {
      this.time = ctx.scene != undefined ? ctx.scene.time : undefined;
      this.edit_all_layers = ctx.edit_all_layers;

      this._scene = ctx.scene ? new DataRef(ctx.scene) : new DataRef(-1);
      this._frameset = ctx.frameset ? new DataRef(ctx.frameset) : new DataRef(-1);
      this._object = ctx.scene && ctx.scene.objects.active ? ctx.scene.objects.active.id : -1;

      this._selectmode = ctx.selectmode;
      this._frameset_editmode = "MAIN";
      
      this._spline_path = ctx.splinepath;
      if (ctx.spline != undefined) {
        this._active_spline_layer = ctx.spline.layerset.active.id;
      }
    } else {
      this.selectmode = 0;
      this._scene = new DataRef(-1); this._frameset = new DataRef(-1);
      this.time = 0; this._spline_path = "frameset.drawspline";
      this._active_spline_layer = -1;
    }
  }
  
  get splinepath() {
    return this._spline_path;
  }
  
  //changes state so that normal Context() accessor structs have the right data
  set_context(state : Context) {
    var scene = state.datalib.get(this._scene);
    var fset = state.datalib.get(this._frameset);

    if (scene != undefined && scene.time != this.time)
      scene.change_time(this, this.time, false);

    //this._object = ctx.scene && ctx.scene.objects.active ? ctx.scene.objects.active.id : -1;
    if (this._object >= 0 && (!scene.objects.active || this._object != scene.objects.active.id)) {
      scene.setActiveObject(this._object);
    }

    this._selectmode = state.selectmode;

    //console.log(this._spline_path);
    
    if (fset != undefined)
      fset.editmode = this._frameset_editmode;
    state.switch_active_spline(this._spline_path);
    
    var spline = state.api.getObject(state, this._spline_path);
    if (spline != undefined) {
      var layer = spline.layerset.idmap[this._active_spline_layer];
      
      if (layer == undefined) {
        warn("Warning: layer was undefined in SavedContext!");
      } else {
        spline.layerset.active = layer;
      }
    } else {
      warn("Warning: spline was undefined in SavedContext!");
    }
  }
  
  get spline() : FrameSet {
    var ret = g_app_state.api.get_object(this._spline_path);
    
    if (ret == undefined) {
      warntrace("Warning: bad spline path", this._spline_path);
      ret = g_app_state.api.get_object("frameset.drawspline");
      
      if (ret == undefined) {
        console.trace("Even Worse: base spline path failed!");
      }
    }

    return ret;
  }

  get selectmode() : int {
    return this._selectmode;
  }

  get frameset() : FrameSet {
    return g_app_state.datalib.get(this._frameset);
  }
  
  get datalib() : DataLib {
    return g_app_state.datalib;
  }
  
  get scene() : Scene {
    return this._scene != undefined ? g_app_state.datalib.get(this._scene) : undefined;
  }
   
  get api() : DataAPI {
    return g_app_state.pathcontroller;
  }
  
  static fromSTRUCT(reader) : SavedContext {
    var sctx = new SavedContext();
    
    reader(sctx);
    
    if (sctx._scene.id == -1)
      sctx._scene = undefined;
    return sctx;
  }
}

SavedContextOld.STRUCT = """
  SavedContext {
    _scene               : DataRef | obj._scene == undefined ? new DataRef(-1) : obj._scene;
    _frameset            : DataRef | obj._frameset == undefined ? new DataRef(-1) : obj._frameset;
    _frameset_editmode   : static_string[12];
    _spline_path         : string;
    time                 : float;
    edit_all_layers      : int;
  }
""";

import {SplineFrameSet} from './frameset.js';
import {SettingsEditor} from "../editors/settings/SettingsEditor.js";
import {MenuBar} from "../editors/menubar/MenuBar.js";

import {ContextOverlay, Context} from "../path.ux/scripts/controller/context.js";

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
    var ret = this.api.getObject(g_app_state.active_splinepath);
    
    if (ret == undefined) {
      warntrace("Warning: bad spline path", g_app_state.active_splinepath);
      g_app_state.switch_active_spline("frameset.drawspline");
      
      if (ret == undefined) {
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
}

export class ViewContextOverlay extends ContextOverlay {
  constructor(state = g_app_state) {
    super();

    this.appstate = state;
    this._keymap_mpos = [0, 0];
  }

  get font() {
    return g_app_state.raster.font;
  }

  get keymap_mpos() {
    return this._keymap_mpos;
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

  /*need to figure out a better way to pass active editor types
    around API.  this one in particular is evil, a holdover fro
    the days when View2DHandler encapsulated the entire application
    state*/
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

/*
  The Context classes represent a set of common arguments that
  are passed to various parts of the API (especially the tool
  and data/UI APIs).  Like most of the rest of the tool API,
  it's inspired by what Blender does.
*/
//restricted context for tools
export class _ToolContext {
  constructor(frameset, spline, scene, splinepath) {
    var ctx = new FullContext().toLocked();

    if (splinepath == undefined)
      splinepath = ctx.splinepath;

    if (frameset == undefined)
      frameset = ctx.frameset;

    if (spline == undefined && frameset != undefined)
      spline = ctx.spline;

    if (scene == undefined)
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
  var sce = g_app_state.datalib.get_active(DataTypes.SCENE);
  this.scene = sce;
  this.object = undefined;
  
  if (sce != undefined) {
    if (sce.active == undefined && sce.objects.length > 0) {
      if (DEBUG.datalib) {
        warn(["WARNING: sce.objects (a DBList) had an undefined .active",
              "in the prescence of objects.  This should be impossible.",
              "Correcting."].join("\n"));
      }
      
      sce.active = sce.objects[0];
    }
    
    if (sce.active != undefined) {
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

class ToolStack {
  constructor(appstate : AppState) {
    this.undocur = 0;
    this.undostack = new GArray();
    
    this.appstate = appstate;
    this.valcache = appstate.toolop_input_cache;
    
    this.do_truncate = true;
  }
  
  reexec_stack2(validate=false) {
    var stack = this.undostack;
    
    g_app_state.datalib = new DataLib();
    
    var mctx = new FullContext().toLocked();
    var first=true;
    
    var last_time = 0;
    function do_next(i) {
      var tool = stack[i];

      var ctx = tool.saved_context;
      if ((1||ctx.time != last_time) && mctx.frameset != undefined) {
        mctx.frameset.update_frame();
      }
      
      ctx.set_context(mctx);
      last_time = ctx.time;
      
      //console.log("- " + i + ": executing " + tool.constructor.name + ". . .");
      
      tool.is_modal = false;
      tool.exec_pre(ctx);
      
      if (!(tool.undoflag & UndoFlags.IGNORE_UNDO)) {
        //console.log(" - undo pre");
        tool.undo_pre(ctx);
        tool.undoflag |= UndoFlags.HAS_UNDO_DATA;
      }
      
      tool.exec(ctx);
      
      //*
      if (mctx.frameset != undefined)// && mctx.frameset.spline.resolve)
        mctx.frameset.spline.solve();
      if (mctx.frameset != undefined)// && mctx.frameset.pathspline.resolve)
        mctx.frameset.pathspline.solve();
      //*/
      
      if ((1||ctx.time != last_time) && mctx.frameset != undefined) {
        mctx.frameset.update_frame();
      }
    }
    
    var ival;
    
    var thei;
    var this2 = this;
    function cbfunc() {
      do_next(thei);
      thei += 1;
      
      var cctx = new FullContextt().toLocked();
      if (cctx.frameset != undefined) {
        cctx.frameset.spline.solve();
        cctx.frameset.pathspline.solve();
      }
      
      window.redraw_viewport();
      
      clearInterval(ival);
      if (thei < this2.undostack.length)
        ival = window.setInterval(cbfunc, 500);
    }
    
    do_next(0);
    thei = 1;
    ival = window.setInterval(cbfunc, 500);
    
    console.log("reexecuting tool stack from scratch. . .");
    for (var i=0; i<this.undocur; i++) {
    //  do_next(i);
    }
  }
  
  reexec_stack(validate=false) {
    var stack = this.undostack;
    
    g_app_state.datalib = new DataLib();
        
    var mctx = new FullContext();
    var first=true;
    
    console.log("reexecuting tool stack from scratch. . .");
    for (var i=0; i<this.undocur; i++) {
      var tool = stack[i];

      var ctx = tool.saved_context;
      ctx.set_context(mctx);
      
      //console.log("- " + i + ": executing " + tool.uiname + ". . .");
      
      tool.is_modal = false;
      tool.exec_pre(ctx);
      
      if (!(tool.undoflag & UndoFlags.IGNORE_UNDO)) {
        //console.log(" - undo pre");
        tool.undo_pre(ctx);
        tool.undoflag |= UndoFlags.HAS_UNDO_DATA;
      }
      
      tool.exec(ctx);
      
      /*
      if (mctx.frameset != undefined && mctx.frameset.spline.resolve)
        mctx.frameset.spline.solve();
      if (mctx.frameset != undefined && mctx.frameset.pathspline.resolve)
        mctx.frameset.pathspline.solve();
      */
    }
  }
  
  default_inputs(Context ctx, ToolOp tool) {
    var cache = this.valcache;
    
    //input_prop will be necassary for type checking
    //in the future
    function get_default(String key, Object defaultval, ToolProperty input_prop) {
      key = tool.constructor.name + ":" + key;
      
      if (key in cache)
        return cache[key];
      
      cache[key] = defaultval;
      
      return defaultval;
    }
    
    /*set .ctx on tool properties*/
    var tctx = ctx.toLocked(); //new ToolContext();

    for (var k in tool.inputs) {
      tool.inputs[k].ctx = tctx;
    }
    for (var k in tool.outputs) {
      tool.outputs[k].ctx = tctx;
    }
    
    tool.default_inputs(ctx, get_default);
  }
  
  truncate_stack() {
    if (this.undocur != this.undostack.length) {
      if (this.undocur == 0) {
        this.undostack = new GArray();
      } else {
        this.undostack = this.undostack.slice(0, this.undocur);
      }
    }
  }
  
  undo_push(ToolOp tool) {
    if (this.do_truncate) {
      this.truncate_stack();      
      this.undostack.push(tool);
    } else {
      this.undostack.insert(this.undocur, tool);
      
      for (var i=this.undocur-1; i<this.undostack.length; i++) {
        if (i < 0) continue;
        
        this.undostack[i].stack_index = i;
      }
    }
    
    tool.stack_index = this.undostack.indexOf(tool);
    this.undocur++;
  }

  //removes undo entry for "canceled" tools, that didn't affect state AT ALL
  //op is the toolop requesting the cancelation, which allows us to validate
  //the call.
  toolop_cancel(ToolOp op) {
    if (this.undostack.indexOf(op) >= 0) {
      this.undostack.remove(op);
      this.undocur--;
    }
  }
  
  undo() {
    //flush event graph
    the_global_dag.exec(this.ctx);

    if (this.undocur > 0 && (this.undostack[this.undocur-1].undoflag & UndoFlags.UNDO_BARRIER))
      return;
    if (this.undocur > 0 && !(this.undostack[this.undocur-1].undoflag & UndoFlags.HAS_UNDO_DATA))
      return;
      
    if (this.undocur > 0) {
      this.undocur--;
      var tool = this.undostack[this.undocur];
      
      var ctx = new FullContext();
      var tctx = (tool.flag & ToolFlags.USE_TOOL_CONTEXT) ? tool.ctx : ctx;

      if (the_global_dag != undefined)
        the_global_dag.reset_cache();
      
      tool.saved_context.set_context(ctx);
      tool.undo(tctx);
      
      if (the_global_dag != undefined)
        the_global_dag.reset_cache();
      
      if (this.undocur > 0)
        this.rebuild_last_tool(this.undostack[this.undocur-1]);
      
      window.redraw_viewport();
    }
  }

  redo() {
    //flush event graph
    the_global_dag.exec(this.ctx);

    if (this.undocur < this.undostack.length) {
      var tool = this.undostack[this.undocur];
      var ctx = new FullContext();
      
      tool.saved_context.set_context(ctx);
      tool.is_modal = false;
      
      if (!(tool.undoflag & UndoFlags.IGNORE_UNDO)) {
        tool.undo_pre((tool.flag & ToolFlags.USE_TOOL_CONTEXT) ? tool.ctx : ctx);
        tool.undoflag |= UndoFlags.HAS_UNDO_DATA;
      }
      
      var tctx = (tool.flag & ToolFlags.USE_TOOL_CONTEXT) ? tool.ctx : tool.ctx.toLocked();
      
      if (the_global_dag != undefined)
        the_global_dag.reset_cache();
      
      tool.exec_pre(tctx);
      tool.exec(tctx);
      tool.redo_post(ctx);
      
      this.undocur++;
      
      if (this.undocur > 0)
        this.rebuild_last_tool(this.undostack[this.undocur-1]);
    }
  }
  
  reexec_tool(ToolOp tool) {
    if (!(tool.undoflag & UndoFlags.HAS_UNDO_DATA)) {
      this.reexec_stack();
    }
    
    if (tool.stack_index == -1) {
      for (var i=0; i<this.undostack.length; i++) {
        this.undostack[i].stack_index = i;
      }
    }
    
    if (tool === this.undostack[this.undocur-1]) {
      this.undo();
      this.redo();
    } else if (this.undocur > tool.stack_index) {
      var i = 0;
      while (this.undocur != tool.stack_index) {
        this.undo();
        i++;
      }
      
      while (i >= 0) {
        this.redo();
        i--;
      }
    } else {
      console.log("reexec_tool: can't reexec tool in inactive portion of stack");
    }
    
    tool.saved_context = new SavedContext(new FullContext());
  }
  
  kill_opstack() {
    this.undostack = new GArray();
    this.undocur = 0;
  }
  
  gen_tool_datastruct(ToolOp tool) {
    var datastruct = new DataStruct([]);
    var this2 = this;
    
    /*find outermost parent macro for reexecution
      callback*/
    var stacktool = tool;
    while (stacktool.parent != undefined) {
      stacktool = stacktool.parent;
    }
    
    function update_dataprop(d) {
      this2.reexec_tool(stacktool);
    }
    
    var this2 = this;
    function gen_subtool_struct(tool) {
      if (tool.apistruct == undefined)
        tool.apistruct = this2.gen_tool_datastruct(tool);
      return tool.apistruct;
    }
    
    var prop = new StringProperty(tool.uiname, tool.uiname, tool.uiname, "Tool Name");
    var dataprop = new DataPath(prop, "tool", "tool_name", true, false);
    dataprop.update = function() { }
    
    prop.flag = TPropFlags.LABEL;
    
    if (!(tool.flag & ToolFlags.HIDE_TITLE_IN_LAST_BUTTONS)) {
      datastruct.add(dataprop);
    }
    
    for (var k in tool.inputs) {
      prop = tool.inputs[k];
      
      if (prop.flag & TPropFlags.PRIVATE) continue;
      
      dataprop = new DataPath(prop, prop.apiname, "", true, false);
      dataprop.update = update_dataprop;
      
      datastruct.add(dataprop);
    }
    
    if (tool instanceof ToolMacro) {
      var tarr = new DataStructArray(gen_subtool_struct);
      var toolsprop = new DataPath(tarr, "tools", "tools", false);
      datastruct.add(toolsprop);
    }
    
    return datastruct;
  }

  rebuild_last_tool(tool) {
    var s
    
    if (tool != undefined)
      s = this.gen_tool_datastruct(tool);
    else
      s = new DataStruct([]);
    
    s.flag |= DataFlags.RECALC_CACHE;
    s.name = "last_tool"
    
    s = new DataPath(s, "last_tool", "", false, false)
    s.flag |= DataFlags.RECALC_CACHE;
    
    ContextStruct.replace(s);
  }
  
  set_tool_coll_flag(ToolOp tool) {
    //find any collectionproperties, and ensure
    //they validate their data strictly, so it
    //can be serialized
    
    for (var k in tool.inputs) {
      var p = tool.inputs[k];
      if (p instanceof CollectionProperty)
        p.flag &= ~TPropFlags.COLL_LOOSE_TYPE;
    }
    for (var k in tool.outputs) {
      var p = tool.inputs[k];
      if (p instanceof CollectionProperty)
        p.flag &= ~TPropFlags.COLL_LOOSE_TYPE;
    }
    
    if (tool instanceof ToolMacro) {
      for (var t2 of tool.tools) {
        this.set_tool_coll_flag(t2);
      }
    }
  }
  
  /*the undo-friendly way to set a datapath*/
  exec_datapath(Context ctx, String path, Object val, Boolean undo_push=true, 
                Boolean use_simple_undo=false, Function cls=DataPathOp) 
  {
    var api = g_app_state.api;
    
    //first, ensure we can access the data path
    var prop = api.get_prop_meta(ctx, path);
    if (prop == undefined) {
      console.trace("Error in exec_datapath", path);
      return;
    }
    
    var good = this.undostack.length > 0 && this.undostack[this.undocur-1] instanceof cls;
    good = good && this.undostack[this.undocur-1].path == path;
    var exists = false;
    
    if (undo_push || !good) {
      var op = new cls(path, use_simple_undo);
    } else {
      op = this.undostack[this.undocur-1];
      this.undo();
      exists = true;
    }
   
    //console.log("exists", exists, "undo_push", undo_push, "path, prop", path, prop);
    
    var input = op.get_prop_input(path, prop);
    input.setValue(val);
    
    if (exists) {
      this.redo();
    } else {
      this.exec_tool(op);
    }
  }

  exec_tool(tool : ToolOp) {
    console.warn("exec_tool deprecated in favor of execTool");
    return this.execTool(tool);
  }

  execToolRepeat(ctx, cls, args={}) {
    let tools = cls.getRepeat(ctx, args);

    for (let tool of tools) {
      tool.flag |= ToolFlags.USE_TOOL_CONTEXT;
    }

    let macro = new ToolMacro(cls.tooldef().apiname, cls.tooldef().uiname, tools);
    this.execTool(macro);
  }

  execTool(tool : ToolOp) {
    //flush event graph
    the_global_dag.exec(this.ctx);

    this.set_tool_coll_flag(tool);
    
    /*if (this.appstate.screen && 
        this.appstate.screen.active instanceof ScreenArea 
        && this.appstate.screen.active.area instanceof View2DHandler)
    {
      this.appstate.active_view2d = this.appstate.screen.active.area;
    }
    
    if (this.appstate.screen && this.appstate.active_view2d == undefined) {
      for (var s of this.appstate.screen.children) {
        if (s instanceof ScreenArea && s.area instanceof View2DHandler) {
          this.appstate.active_view2d = s.area;
          break;
        }
      }
    }*/
    
    var ctx = new FullContext();
    tool.ctx = ctx;

    if (tool.can_call(ctx) == false) {
      if (DEBUG.toolstack) {
        console.trace()
        console.log(tool);
      }
      
      console.log("Can not call tool '" + tool.constructor.name + "'");
      return;
    }
    
    if (!(tool.undoflag & UndoFlags.IGNORE_UNDO))
      this.undo_push(tool);
    
    for (var k in tool.inputs) {
      var p = tool.inputs[k];
      
      p.ctx = ctx;
      
      if (p.userSetData != undefined)
        p.userSetData.call(p, p.data);
    }
    
    if (tool.is_modal) {
      let modal_ctx = ctx.toLocked();

      tool.modal_ctx = modal_ctx;
      tool.modal_tctx = new BaseContext().toLocked();
      tool.saved_context = new SavedContext(tool.modal_tctx);
      
      tool.exec_pre(tool.modal_tctx);
      
      if (!(tool.undoflag & UndoFlags.IGNORE_UNDO)) {
        //some tools expect modal_running is set even for undo_pre callback
        //even though it's only valid in that case some of the time
        if (tool.is_modal)
          tool.modal_running = true;
          
        tool.undo_pre(modal_ctx);
        tool.undoflag |= UndoFlags.HAS_UNDO_DATA;
        
        //will be set again by modal_init, line after next
        if (tool.is_modal)
          tool.modal_running = false;
      }
      
      tool._start_modal(modal_ctx);
      tool.start_modal(modal_ctx);
    } else {
      var tctx = (tool.flag & ToolFlags.USE_TOOL_CONTEXT) ? new BaseContext().toLocked() : ctx.toLocked();
      tool.saved_context = new SavedContext(tctx);
      
      if (!(tool.undoflag & UndoFlags.IGNORE_UNDO)) {
        //undo callbacks, unlike .exec, get full context structure
        tool.undo_pre((tool.flag & ToolFlags.USE_TOOL_CONTEXT) ? tool.ctx : ctx);
        tool.undoflag |= UndoFlags.HAS_UNDO_DATA;
      }
      
      tool.exec_pre(tctx);
      tool.exec(tctx);
    }
    
    if (!(tool.undoflag & UndoFlags.IGNORE_UNDO)) { 
      this.rebuild_last_tool(tool);
    }
  }
  
  static fromSTRUCT(reader) {
    var ts = new ToolStack(g_app_state);
    reader(ts);
      
    ts.undostack = new GArray(ts.undostack);
    for (var i=0; i<ts.undostack.length; i++) {
      ts.undostack[i].stack_index = i;
      ts.set_tool_coll_flag(ts.undostack[i]);
    }
    
    return ts;
  }
}

ToolStack.STRUCT = """
  ToolStack {
    undocur   : int;
    undostack : array(abstract(ToolOp)) | obj.undostack.slice(0, obj.undocur);
  }
"""

