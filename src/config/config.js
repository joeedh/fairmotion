"use strict";

export var MANIPULATOR_MOUSEOVER_LIMIT = 25;

export var ELECTRON_APP_MODE = document.getElementById("ElectronAppMode") !== null;
export var CHROME_APP_MODE = document.getElementById("GoogleChromeAppMode") !== null;
export var PHONE_APP_MODE = document.getElementById("PhoneAppMode") !== null;

let platform = "web";
if (ELECTRON_APP_MODE) {
  platform = process.platform.toLowerCase();
}

export var PLATFORM = platform;
export var IS_WIN = platform.toLowerCase().search("win") >= 0;

export var ICONPATH = PHONE_APP_MODE ? "img/" : (ELECTRON_APP_MODE ? "./fcontent/" : "fcontent/");

export var USE_WASM = true;
export var USE_NACL = CHROME_APP_MODE;
export var NO_SERVER = CHROME_APP_MODE || PHONE_APP_MODE || ELECTRON_APP_MODE;

export var USE_HTML5_FILEAPI = NO_SERVER;
export var DISABLE_SOLVE=false;
export var ENABLE_MULTIRES=false;
export var HAVE_EVAL = false;

export var MAX_CANVAS2D_VECTOR_CACHE_SIZE = 1700;

export var MAX_RECENT_FILES = 12;

export var ON_TICK_TIMER_MS  150

window.RELEASE = false;

//load local configuration overrides
import * as config_local from 'config_local';
export * from 'config_local';

//debug flags
window._DEBUG = {
  degenerate_geometry : false,
  viewport_partial_update : false, //debug partial redraw rects of work canvas
  alias_g_app_state : true, //make a G alias to g_app_state at runtime
  gl_objects : false,
  Struct : false,
  ui_except_handling : false,
  modal : false, 
  datalib : false, 
  glext : false, //prints gl extensions to console on startup
  selbuf : false,
  toolstack : false,
  transform : false,
  mesh_api : false,
  keyboard : false,
  modifier_keys : false,
  mouse : false,
  touch : 1,
  mousemove : false,
  ui_datapaths : false,
  ui_menus : false,
  ui_canvas : false,
  ui_redraw : false,
  dag : false,
  icons : false,
  complex_ui_recalc : false,
  screen_keyboard : false, // !RELEASE
  data_api_timing : false,
  canvas_sep_text : true,
  disable_on_tick : false,
  octree : false,
  netio : false,
  compression : false,
  force_mobile : false,
  tesselator : false,
  use_2d_uicanvas : 1,
  trace_recalc_all : false
};

//_DEBUG["use_2d_uicanvas"] = !!parseInt(""+myLocalStorage.use_canvas2d);

//make sure debug global is declared;
if (window.DEBUG == undefined || DEBUG == undefined)
  var DEBUG = window.DEBUG = config_local.DEBUG != undefined ? config_local.DEBUG : {};
  
//set default debug flags
for (var k in _DEBUG) {
  if (!(k in DEBUG)) {
    DEBUG[k] = _DEBUG[k];
  }
}

if (DEBUG != undefined && DEBUG.force_mobile)
  window.IsMobile = true;
