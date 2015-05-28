"use strict";

window.RELEASE=false;

//load local configuration overrides
import * as config_local from 'config_local';
export * from 'config_local';

//debug flags
window._DEBUG = {
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
  use_2d_uicanvas : 1
};

//_DEBUG["use_2d_uicanvas"] = !!parseInt(""+localStorage.use_canvas2d);

//make sure debug global is declared;
if (window.DEBUG == undefined || DEBUG == undefined)
  var DEBUG = window.DEBUG = config_local.DEBUG != undefined ? config_local.DEBUG : {};
  
//set default debug flags
for (var k in _DEBUG) {
  if (!(k in DEBUG)) {
    DEBUG[k] = _DEBUG[k];
  }
}

export var USE_NACL=false;
        
if (DEBUG != undefined && DEBUG.force_mobile)
  window.IsMobile = true;
