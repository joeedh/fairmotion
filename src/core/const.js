"use strict";

//make sure config is loaded first, so we don't override anything
import '../config/config.js';

/* various constant (except for DEBUG) globals */

export const USE_PATHUX_API = false;

//file extension
window.fairmotion_file_ext = ".fmo";
window.fairmotion_settings_filename = ".settings.bin";

//application version
window.g_app_version = 0.053;

/*all selection bitflags flags must use this value, 
  e.g. SplineFlags.SELECT*/
//SELECT = 1;

//release mode
//var RELEASE = false;
//now defined in src/config/config.js

//need to design new unit tester, never even implemented this one.
//it will probably work by saving tool stacks of some real-world
//user doing stuff.

window.UNIT_TESTER = false;
window.FEATURES = {
  save_toolstack : false //(RELEASE ? false : true)
}

//need a struct to contain constants I'm not compiling in with the preprocessor
window.use_octree_select = true;
window.fuzzy_ui_press_hotspot = 25;

window.new_api_parser = true;

if (myLocalStorage.use_canvas2d == undefined)
  myLocalStorage.use_canvas2d = true;

//private macro helper global for utildefine.js
var $_mh = undefined;

//debug globals
if (!RELEASE && !("M" in window) && !("O" in window)) {
  Object.defineProperty(window, "G", {get : function() {
    return g_app_state;
  }});
  Object.defineProperty(window, "V2D", {get : function() {
    return g_app_state.active_view2d;
  }});
  Object.defineProperty(window, "API", {get : function() {
    return g_app_state.api;
  }});
}
