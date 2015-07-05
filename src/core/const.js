"use strict";

//make sure config is loaded first, so we don't override anything
import 'config';

/* various constant (except for DEBUG) globals */

//my own, personal source tree uses a patent-pending
//curve that's much faster.  I'll try and convince my
//company to let me use it here.
window.USE_BETTER_CURVE = true;

//file extension
window.allshape_file_ext = ".fmo";
window.allshape_settings_filename = ".settings.bin";

//application version
window.g_app_version = 0.050;

/*all selection bitflags flags must use this value, even if they define
  their own enumeration member, e.g. MeshFlags.SELECT*/
window.SELECT = 1;

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

if (localStorage.use_canvas2d == undefined)
  localStorage.use_canvas2d = true;

//private macro helper global for utildefine.js
var $_mh = undefined;

//debug globals
if (!RELEASE && !("M" in this) && !("O" in this)) {
  Object.defineProperty(this, "M", {get : function() {
    return new Context().mesh;
  }});
  Object.defineProperty(this, "O", {get : function() {
    return new Context().object;
  }});
  Object.defineProperty(this, "S", {get : function() {
    return new Context().scene;
  }});
  Object.defineProperty(this, "G", {get : function() {
    return g_app_state;
  }});
  Object.defineProperty(this, "V3D", {get : function() {
    return g_app_state.active_view2d;
  }});
  Object.defineProperty(this, "API", {get : function() {
    return g_app_state.api;
  }});
}
