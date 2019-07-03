"not_a_module"

if (window.mobilecheck === undefined) {
  window.mobilecheck = function mobilecheck() {
    var str = navigator.userAgent + navigator.vendor;

    function test(s) {
      var ret = str.match(s)
      if (ret == null || ret == undefined) return false;
      if (ret.length == 0 || ret.length == undefined)
        return false;

      return true;
    }

    str = str.toLowerCase();
    var ret = test("android") || test("mobile") || test("blackberry") || test("iphone")

    return ret;
  }
}

// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// This function is called by common.js when the NaCl module is
// loaded.
window.moduleDidLoad = function moduleDidLoad() {
    console.log("-------Loaded NACL module!----------");
    common.hideModule();
    //common.naclModule.postMessage('hello');
}
// This function is called by common.js when a message is received from the
// NaCl module.  it's overriden by src/nacl/nacl_api.js, which is an es6 module(
window.handleMessage = function handleMessage(message) {
    //var logEl = document.getElementById('log');
    //logEl.textContent += message.data;

    console.log("NACL message!", message, message.data);
}

//localstorage variant
class MyLocalStorage_LS {
  set(key, val) {
    localStorage[key] = val;
  }
  
  getCached(key) {
    return localStorage[key];
  }
  
  getAsync(key) {
    return new Promise(function(accept, reject) {
      if (key in localStorage && localStorage[key] !== undefined) {
        accept(localStorage[key]);
      }
    });
  }
  
  hasCached(key) {
    return key in localStorage; 
  }
}

class MyLocalStorage_ChromeApp {
  constructor() {
    this.cache = {};
  }
  
  set(key, val) {
    var obj = {};
    obj[key] = val;
    
    chrome.storage.local.set(obj);
    this.cache[key] = val;
  }
  
  getCached(key) {
    return this.cache[key];
  }
  
  getAsync(key) {
    var this2 = this;
    
    return new Promise(function(accept, reject) {
      chrome.storage.local.get(key, function(value) {
        if (chrome.runtime.lastError != undefined) {
          this2.cache[key] = null;
          reject(chrome.runtime.lastError.string);
        } else {
          if (value != {} && value != undefined && key in value) {
            value = value[key];
          }
          
          if (typeof value == "object")
            value = JSON.stringify(value);
          
          this2.cache[key] = value;
          accept(value);
        }
      });
    });
  }
  
  hasCached(key) {
    return key in this.cache;
  }
}

window.startup = function startup() {
  //set up myLocalStorage
  if (window.CHROME_APP_MODE) {
    window.myLocalStorage = new MyLocalStorage_ChromeApp();
    window.myLocalStorage.getAsync("session"); //preload session data
    window.myLocalStorage.getAsync("startup_file"); //startup_file too
    window.myLocalStorage.getAsync("_settings"); //user settings
    
    //create small delay to make time for chrome.storage.local to load
    var timer = window.setInterval(function() {
      window.clearInterval(timer);
      ;
      startup_intern();
      
      //feed an on_resize event
      window.setTimeout(function() {
        //var canvas = document.getElementById("canvas2d");
  
        window._ensure_thedimens();
        g_app_state.screen.on_resize([window.theWidth, window.theHeight]);
      }, 200);
    }, 450);
  } else {
    window.myLocalStorage = new MyLocalStorage_LS();
    startup_intern();
  }
}

window._ensure_thedimens = function() {
  window.theHeight = document.documentElement.clientHeight-9;
  window.theWidth = document.documentElement.clientWidth-4;
}

window.startup_intern = function startup() {
  window.IsMobile = mobilecheck();
  
  /*
  try {
    if (window.localStorage == undefined) {
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

  load_modules();

  if (window.CHROME_APP_MODE) {
    //set up some chrome app settings
    var config = _es6_get_module("config");
    config.exports.HAVE_EVAL = false;
  } 
  
  init_theme();
  init_redraw_globals();
  
  //remove default mouse handlers (especially right click)
  document.onselectstart = function() { return false; };
  document.oncontextmenu = function() { return false; };
            
  //hrm, should probably remove this if check
  //it was added for allshape, which had to deal
  //with webgl context loss/regain cycles.
  if (g_app_state == undefined) {
      //initialize struct pack system
      startup_report("parsing serialization scripts...");
      init_struct_packer();

      startup_report("initializing data api...");

      init_data_api();
      
      startup_report("create event dag...")
      init_event_graph();

      var body = document.body;
      g_app_state = new AppState(undefined, undefined, undefined);
      let w = window.innerWidth, h = window.innerHeight;

      g_app_state.size = [w, h];

      startup_report("loading new scene file...");
      gen_default_file([w, h]);

      g_app_state.session.validate_session();
      init_event_system();
      init_redraw_globals_2();
  }
}

function init_event_system() {
  let eventmanager = es6_get_module_meta(_rootpath_src + "/core/eventmanager.js").exports;
  let eman = eventmanager.manager;
  
  window._stime = 10;
  
  window.setInterval(function () {
      if (window.skip_draw) return;

      var g = window.g_app_state;
      if (g == undefined) return;

      //Make sure the canvas[es] are sized correctly.
      reshape();
  }, 300);

  window.setInterval(function () {
      //deal with timeouts 
      
      //window.pop_solve(draw_id);
      if (window.redraw_start_times == undefined)
        return;
        
      for (var k in redraw_start_times) {
        var t = redraw_start_times[k];
        //don't let delayed redraw linger
        //for more than one and a half seconds
        if (time_ms() - t > 1500) {
          pop_solve(k);
        }
      }
  }, 32);
  
  var config = _es6_get_module("config");
  
  //start primary on_tick timer
  window.setInterval(function () {
    if (g_app_state != undefined && g_app_state.screen != undefined) {
      let w = window.theWidth, h = window.theHeight;

      window._ensure_thedimens();

      if (w != window.theWidth || h != window.theHeight) {
        console.log("resize!");
        g_app_state.screen.on_resize([window.theWidth, window.theHeight]);
      }

      g_app_state.screen.update();
    }
  }, config.ON_TICK_TIMER_MS);

  function stop_event_propegation(e) {
    //e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
  }

#if 0
  function handleTouchMove(e) {
      g_app_state.was_touch = true;
      stop_event_propegation(e);

      if (g_app_state.eventhandler != undefined) {
          touch_manager.owner = g_app_state.screen;
          var x, y;

          var t = e.targetTouches[0];
          if (t == undefined) {
              x = g_app_state._last_touch_mpos[0];
              y = g_app_state._last_touch_mpos[1];
          } else {
              x = t.pageX;
              y = g_app_state.screen.size[1] - t.pageY;

              g_app_state._last_touch_mpos[0] = x;
              g_app_state._last_touch_mpos[1] = y;
          }

          var e2 = new MyMouseEvent(x, y, 0, MyMouseEvent.MOUSEMOVE);
          e2.touches = do_touches(e);

          touch_manager.queue_event(e2);
      }
  }

  function handleMouseMove(e) {
      g_app_state.was_touch = false;
      if (g_app_state.eventhandler != undefined) {
          // console.log(g_app_state.eventhandler.modalhander);

          var evt = new MyMouseEvent(e.pageX, g_app_state.screen.size[1] - e.pageY, 0,
                  MyMouseEvent.MOUSEMOVE);
          g_app_state.eventhandler.on_mousemove(evt);
      }
  }

  function handleMouseWheel(event) {
      //code kindly taken from http://www.adomas.org/javascript-mouse-wheel/

      var delta = 0;
      if (!event) /* For IE. */
          event = window.event;
      if (event.wheelDelta) { /* IE/Opera. */
          delta = event.wheelDelta / 120;
      } else if (event.detail) { /** Mozilla case. */
          /** In Mozilla, sign of delta is different than in IE.
           * Also, delta is multiple of 3.
           */
          delta = -event.detail / 3;
      }

      /** If delta is nonzero, handle it.
       * Basically, delta is now positive if wheel was scrolled up,
       * and negative, if wheel was scrolled down.
       */

      /** Prevent default actions caused by mouse wheel.
       * That might be ugly, but we handle scrolls somehow
       * anyway, so don't bother here..
       */
      if (event.preventDefault)
          event.preventDefault();
      event.returnValue = false;

      if (delta && g_app_state.screen != undefined) {
          event.x = event.pageX;
          event.y = g_app_state.screen.size[1] - event.pageY;

          g_app_state.eventhandler.on_mousewheel(event, delta);
      }
  }

  function handleTouchCancel(e) {
      if (t == undefined) {
          x = e.pageX;
          y = e.pageY;
      } else {
          x = t.pageX;
          y = t.pageY;
      }

      var lst = e.changedTouches;
      var touches = {};
      for (var i = 0; i < t.length; i++) {
          touches[lst[i].identifier] = [x, y];
      }

      console.log("touch cancel");

      if (g_app_state.screen != undefined) {
          touch_manager.owner = g_app_state.screen;
          var e2 = new MyMouseEvent(x, g_app_state.screen.size[1] - y, 0, MyMouseEvent.MOUSEUP);

          e2.shiftKey = e.shiftKey;
          e2.altKey = e.altKey;
          e2.ctrlKey = e.ctrlKey;

          touch_manager.cancel(e2);
      }
  }

  function do_touches(e) {
      var ts = {};

      var in_ts = e.changedTouches.length == 0 ? e.targetTouches : e.changedTouches;
      if (in_ts == undefined || in_ts.length == 0) return [];

      for (var i = 0; i < in_ts.length; i++) {
          var id = in_ts[i].identifier;
          if (id == undefined)
              id = i;

          //console.log("-", in_ts[i]);
          ts[id] = [in_ts[i].pageX, g_app_state.screen.size[1] - in_ts[i].pageY];
      }

      return ts;
  }

  function handleTouchDown(e) {
      g_app_state.was_touch = true;
      stop_event_propegation(e);

      var x, y;

      if (DEBUG.touch == 2)
          console.log(e.targetTouches.length, e);

      var t = e.targetTouches[0];
      if (t == undefined) {
          x = g_app_state._last_touch_mpos[0];
          y = g_app_state._last_touch_mpos[1];
      } else {
          x = t.pageX;
          y = g_app_state.screen.size[1] - t.pageY;

          g_app_state._last_touch_mpos[0] = x;
          g_app_state._last_touch_mpos[1] = y;
      }

      if (g_app_state.screen != undefined) {
          touch_manager.owner = g_app_state.screen;
          var e2 = new MyMouseEvent(x, y, 0, MyMouseEvent.MOUSEDOWN);

          e2.shiftKey = e.shiftKey;
          e2.altKey = e.altKey;
          e2.ctrlKey = e.ctrlKey;
          e2.touches = do_touches(e);

          touch_manager.queue_event(e2);
      }
  }

  function handleTouchUp(e) {
      g_app_state.was_touch = true;
      stop_event_propegation(e);

      var x, y;

      if (DEBUG.touch == 2)
          console.log(e);

      var t = e.targetTouches[0];
      if (t == undefined) {
          x = g_app_state._last_touch_mpos[0];
          y = g_app_state._last_touch_mpos[1];
      } else {
          x = t.pageX;
          y = g_app_state.screen.size[1] - t.pageY;

          g_app_state._last_touch_mpos[0] = x;
          g_app_state._last_touch_mpos[1] = y;
      }

      if (g_app_state.screen != undefined) {
          touch_manager.owner = g_app_state.screen;
          var e2 = new MyMouseEvent(x, y, 0, MyMouseEvent.MOUSEUP);

          e2.shiftKey = e.shiftKey;
          e2.altKey = e.altKey;
          e2.ctrlKey = e.ctrlKey;
          e2.touches = do_touches(e);

          touch_manager.queue_event(e2);
      }
  }

  var last_mouse_down = time_ms();
  var last_mouse_pos = [0, 0];
  var last_mouse_button = 0;
  var DBCLK_THRESH = 200

  function handleMouseDown(e) {
      g_app_state.was_touch = false;
      if (g_app_state.screen != undefined) {
          var e2 = new MyMouseEvent(e.pageX, g_app_state.screen.size[1] - e.pageY,
                  e.button, MyMouseEvent.MOUSEDOWN);

          e2.shiftKey = e.shiftKey;
          e2.altKey = e.altKey;
          e2.ctrlKey = e.ctrlKey;

          //console.log("md1", e.x, e.y);
          g_app_state.eventhandler.on_mousedown(e2);

          var is_dclick = last_mouse_button == e.button && time_ms() - last_mouse_down < DBCLK_THRESH;
          var dx = last_mouse_pos[0] - e.pageX, dy = last_mouse_pos[1] - e.pageY;
          is_dclick = is_dclick && Math.sqrt(dx * dx + dy * dy) < 10; //mouse hasn't moved more than ten pixels

          last_mouse_down = time_ms();
          last_mouse_button = e.button;
          last_mouse_pos[0] = e.pageX;
          last_mouse_pos[1] = e.pageY;

          if (is_dclick) {
              e2 = new MyMouseEvent(e.pageX, g_app_state.screen.size[1] - e.pageY,
                      e.button, MyMouseEvent.MOUSEDOWN);

              e2.shiftKey = e.shiftKey;
              e2.altKey = e.altKey;
              e2.ctrlKey = e.ctrlKey;

              g_app_state.eventhandler.on_doubleclick(e2);
          }

          //console.log("md2", e.x, e.y);
      }

      if (e.button == 2) {
          stop_event_propegation(e);
          return false;
      }
  }

  function handleMouseUp(e) {
      g_app_state.was_touch = false;
      if (g_app_state.screen != undefined) {
          var e2 = new MyMouseEvent(e.pageX, g_app_state.screen.size[1] - e.pageY,
                  e.button, MyMouseEvent.MOUSEUP);

          e2.shiftKey = e.shiftKey;
          e2.altKey = e.altKey;
          e2.ctrlKey = e.ctrlKey;

          g_app_state.eventhandler.on_mouseup(e2);
      }

      if (e.button == 2) {
          stop_event_propegation(e);
          return false;
      }
  }
#endif

  function gen_keystr(key, keystate) {
      if (typeof key == "number") {
          key = String.fromCharCode(key)
      }

      var s = key.toUpperCase()
      if (keystate.shift)
          s = "SHIFT-" + s
      if (keystate.alt)
          s = "ALT-" + s
      if (keystate.ctrl)
          s = "CTRL-" + s
      return s
  }

  var key_exclude_list = {}, ke = key_exclude_list;

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

  function handle_key_exclude(e) {
      var kc = charmap[e.keyCode];
      if (kc == undefined)
          kc = "";

      var keystr = gen_keystr(kc, {
          shift: e.shiftKey,
          alt: e.altKey, ctrl: e.ctrlKey
      })

      keystr = keystr.toString().toUpperCase()
      if (keystr in key_exclude_list) {
          stop_event_propegation(e);
      }
  }

  function handleKeyDown(e) {
      //make sure focus isn't in an embedded html control
      if (document.activeElement !== document.body && !(document.activeElement instanceof HTMLCanvasElement))
        return;

      handle_key_exclude(e);

      if (g_app_state.eventhandler !== undefined && g_app_state.eventhandler.on_keydown)
          g_app_state.eventhandler.on_keydown(e)
  }

  function handleKeyUp(e) {
      //make sure focus isn't in an embedded html control
      if (document.activeElement !== document.body && !(document.activeElement instanceof HTMLCanvasElement))
        return;

      handle_key_exclude(e);

    if (g_app_state.eventhandler !== undefined && g_app_state.eventhandler.on_keyup)
          g_app_state.eventhandler.on_keyup(e);
  }

  function handleKeyPress(e) {
      //make sure focus isn't in an embedded html control
      if (document.activeElement !== document.body && !(document.activeElement instanceof HTMLCanvasElement))
        return;
      
      handle_key_exclude(e);

      if (g_app_state.screen != undefined) {
          if (e.charCode == 0 || e.charCode == 13 || e.charCode == undefined)
              return;

          e["char"] = String.fromCharCode(e.charCode);
          if (g_app_state.eventhandler !== undefined && g_app_state.eventhandler.on_charcode) {
            g_app_state.eventhandler.on_charcode(e);
          }

      }
  }

  function handleTextInput(e, e2) {
      console.log("text input event", e, e2);
      #if 0
      uevt = e;
      if (g_app_state.screen != undefined) {
          var canvas = document.getElementById("canvas2d_work");
          var text = "" + canvas.textContent;

          //we have to maintain something in the text buffer at
          //at times for the mobile keyboard to show up.
          if (text.length == 0)
              canvas.textContent = "<TK>";

          text = text.replace(/\<TK\>/g, "");

          //console.log("textinput event");
        if (g_app_state.eventhandler !== undefined && g_app_state.eventhandler.on_textinput)
          g_app_state.eventhandler.on_textinput({text: text});
      }
      #endif
  }

  //var ce = document.getElementById("canvas2d_work");
  
  eman.init(window);
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

  eman.addEventListener("keydown", handleKeyDown, false);
  eman.addEventListener("keyup", handleKeyUp, false);
  
  eman.addEventListener("keypress", handleKeyPress, false);
  eman.addEventListener("textinput", handleTextInput);
  eman.addEventListener("input", handleTextInput);
}

