"use strict";

import * as config from '../../config/config.js';
import * as imagecanvas_webgl from '../../paint/imagecanvas_webgl.js';
import {register_toolops} from '../data_api/data_api.js';
import {theme} from '../../editors/theme.js';
import {charmap} from '../../editors/events.js';
import {AppState} from '../AppState.js';

import {iconmanager, setTheme, setIconMap} from '../../path.ux/scripts/core/ui_base.js';
import cconst from '../../path.ux/scripts/config/const.js';
import * as FrameManager from '../../path.ux/scripts/screen/FrameManager.js';

Object.defineProperty(window, "CTX", {
  get: function () {
    return g_app_state.ctx;
  }
});

document.body.style["margin"] = document.body.style["padding"] = "0px";

/*
if (window.mobilecheck === undefined) {
  window.mobilecheck = function mobilecheck() {
    let str = navigator.userAgent + navigator.vendor;

    function test(s) {
      let ret = str.match(s)
      if (ret === null || ret === undefined) return false;
      if (ret.length === 0 || ret.length === undefined)
        return false;

      return true;
    }

    str = str.toLowerCase();
    let ret = test("android") || test("mobile") || test("blackberry") || test("iphone")

    return ret;
  }
}
//*/

window.startup = function startup() {
  /* window.myLocalStorage is installed by the pre-bundle classic script
     src/core/startup/localstorage.ts — config.ts reads it at module scope. */
  if (window.CHROME_APP_MODE) {
    window.myLocalStorage.getAsync("session"); //preload session data
    window.myLocalStorage.getAsync("startup_file"); //startup_file too
    window.myLocalStorage.getAsync("_settings"); //user settings

    //create small delay to make time for chrome.storage.local to load
    window.setTimeout(function () {
      startup_intern();

      //feed an on_resize event
      window.setTimeout(function () {
        //let canvas = document.getElementById("canvas2d");

        window._ensure_thedimens();
        g_app_state.screen.on_resize([window.theWidth, window.theHeight]);
      }, 200);
    }, 450);
  } else {
    startup_intern();
  }
}

window._ensure_thedimens = function () {
  //window.theHeight = document.documentElement.clientHeight-9;
  //window.theWidth = document.documentElement.clientWidth-4;
}

window.startup_intern = function startup() {
  //window.IsMobile = mobilecheck();

  /*
  try {
    if (window.localStorage === undefined) {
      window.myLocalStorage = {};
    } else {
      window.myLocalStorage = window.localStorage;
    }
  } catch(error) {
    //print_stack(error);
    console.log("failed to find localstorage");
    window.myLocalStorage = {};
  }//*/

  //return;

  window.imagecanvas_webgl = imagecanvas_webgl;
  imagecanvas_webgl.initWebGL();

  window.setTimeout(() => {
    window.redraw_webgl();
  }, 500);

  window.init_theme();
  window.init_redraw_globals();

  //remove default mouse handlers (especially right click)
  document.onselectstart = function () {
    return false;
  };
  document.oncontextmenu = function () {
    return false;
  };

  register_toolops();

  //initialize struct pack system
  startup_report("parsing serialization scripts...");
  window.init_struct_packer();

  startup_report("loading icons and theme...");
  init_pathux();

  startup_report("initializing data api...");

  window.g_app_state = new AppState(undefined, undefined, undefined);
  let w = window.innerWidth, h = window.innerHeight;

  g_app_state.size = [w, h];

  startup_report("create event dag...");
  window.init_event_graph(g_app_state.ctx);

  startup_report("loading new scene file...");
  window.gen_default_file([w, h]);

  g_app_state.session.validate_session();
  init_event_system();
  window.init_redraw_globals_2();
}

function init_pathux() {
  let cfg = Object.assign({}, config.PathUXConstants);
  if (config.DEBUG) {
    cfg = Object.assign(cfg, config.DEBUG);
  }

  cconst.loadConstants(cfg);

  //set iconsheets, need to find proper place for it other than here in AppState.js
  iconmanager.reset(16);

  setTheme(theme.theme);
  setIconMap(window.Icons);

  iconmanager.add(document.getElementById("iconsheet"), 32, 16);
  iconmanager.add(document.getElementById("iconsheet"), 32, 32);
  iconmanager.add(document.getElementById("iconsheet"), 32, 50);
}

function init_event_system() {
  FrameManager.startEvents(() => {
    return g_app_state ? g_app_state.screen : undefined;
  });

  window._stime = 10;

  window.setInterval(function () {
    /* deal with timeouts */

    /* window.pop_solve(draw_id); */
    if (window.redraw_start_times === undefined)
      return;

    for (let k in window.redraw_start_times) {
      let t = window.redraw_start_times[k];
      /* don't let delayed redraw linger
         for more than one and a half seconds */
      if (time_ms() - t > 1500) {
        pop_solve(k);
      }
    }
  }, 32);


  //if (g_app_state !== undefined && g_app_state.screen !== undefined) {
  //  if (!g_app_state.screen.listening) {
  //    g_app_state.screen.listen();
  //  }
  //}

  //start primary on_tick timer

  function gen_keystr(key, keystate) {
    if (typeof key === "number") {
      key = String.fromCharCode(key)
    }

    let s = key.toUpperCase()
    if (keystate.shift)
      s = "SHIFT-" + s
    if (keystate.alt)
      s = "ALT-" + s
    if (keystate.ctrl)
      s = "CTRL-" + s
    return s
  }

  let key_exclude_list = {}, ke = key_exclude_list;

  ke[gen_keystr("O", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("R", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("N", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("S", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("S", {shift: false, alt: true, ctrl: true})] = 0;
  ke[gen_keystr("P", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("A", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("BACKSPACE", {shift: false, alt: false, ctrl: false})] = 0;
  ke[gen_keystr("TAB", {shift: false, alt: false, ctrl: false})] = 0;
  ke[gen_keystr("V", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("E", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("F", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("G", {shift: false, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("G", {shift: true, alt: false, ctrl: true})] = 0;
  ke[gen_keystr("G", {shift: false, alt: true, ctrl: false})] = 0;
  ke[gen_keystr("O", {shift: true, alt: false, ctrl: true})] = 0;

  window._handle_key_exclude = function handle_key_exclude(e) {
    let kc = charmap[e.keyCode];
    if (kc === undefined)
      kc = "";

    let keystr = gen_keystr(kc, {
      shift: e.shiftKey,
      alt  : e.altKey, ctrl: e.ctrlKey
    })

    keystr = keystr.toString().toUpperCase()
    if (keystr in key_exclude_list) {
      e.preventDefault();
    }
  }

  //let ce = document.getElementById("canvas2d_work");

  window.addEventListener("keydown", (e) => {
    _handle_key_exclude(e);
  });

  /*
  eman.addEventListener("mousemove", handleMouseMove, false);
  eman.addEventListener("mousedown", handleMouseDown, false);
  eman.addEventListener("touchstart", handleTouchDown, false);
  eman.addEventListener("touchmove", handleTouchMove, false);
  eman.addEventListener("mouseup", handleMouseUp, false);
  eman.addEventListener("touchend", handleTouchUp, false);
  eman.addEventListener("touchcancel", handleTouchCancel, false);
  
  eman.addEventListener("DOMMouseScroll", handleMouseWheel, false);
  eman.addEventListener("mousewheel", handleMouseWheel, false);
  //*/
//*

  //eman.addEventListener("keydown", handleKeyDown, false);
  //eman.addEventListener("keyup", handleKeyUp, false);

  //eman.addEventListener("keypress", handleKeyPress, false);
  //eman.addEventListener("textinput", handleTextInput);
  //eman.addEventListener("input", handleTextInput);
//*/
}

