"not_a_module"

Object.defineProperty(window, "CTX", {
  get: function () {
    return g_app_state.ctx;
  }
});

document.body.style["margin"] = document.body.style["padding"] = "0px";

/*
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
//*/

//localstorage variant
class MyLocalStorage_LS {
  set(key: string, val: string) {
    localStorage[key] = val;
  }

  getCached(key) {
    return localStorage[key];
  }

  getAsync(key) {
    return new Promise(function (accept, reject) {
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

    return new Promise(function (accept, reject) {
      chrome.storage.local.get(key, function (value) {
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
    window.setTimeout(function () {
      startup_intern();

      //feed an on_resize event
      window.setTimeout(function () {
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

window._ensure_thedimens = function () {
  //window.theHeight = document.documentElement.clientHeight-9;
  //window.theWidth = document.documentElement.clientWidth-4;
}

window.startup_intern = function startup() {
  //window.IsMobile = mobilecheck();

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
    var config = _es6_get_module("config", true);
    config.exports.HAVE_EVAL = false;
  }

  window.imagecanvas_webgl = _es6_get_module("imagecanvas_webgl", true);
  imagecanvas_webgl.exports.initWebGL();

  window.setTimeout(() => {
    window.redraw_webgl();
  }, 500);

  init_theme();
  init_redraw_globals();

  //remove default mouse handlers (especially right click)
  document.onselectstart = function () {
    return false;
  };
  document.oncontextmenu = function () {
    return false;
  };

  //hrm, should probably remove this if check
  //it was added for allshape, which had to deal
  //with webgl context loss/regain cycles.
  if (window.g_app_state === undefined) {
    console.log(_es6_get_module(_rootpath_src + "src/core/data_api/data_api.js").exports);

    let {register_toolops} = _es6_get_module(_rootpath_src + "src/core/data_api/data_api.js").exports;
    register_toolops();

    //initialize struct pack system
    startup_report("parsing serialization scripts...");
    init_struct_packer();

    startup_report("loading icons and theme...");
    init_pathux();

    startup_report("initializing data api...");

    let body = document.body;

    window.g_app_state = new AppState(undefined, undefined, undefined);
    let w = window.innerWidth, h = window.innerHeight;

    g_app_state.size = [w, h];

    startup_report("create event dag...");
    init_event_graph(g_app_state.ctx);

    startup_report("loading new scene file...");
    gen_default_file([w, h]);

    g_app_state.session.validate_session();
    init_event_system();
    init_redraw_globals_2();
  }
}

function init_pathux() {
  let ui_base = _es6_get_module("ui_base", true).exports;
  let {iconmanager, setTheme, setIconMap} = ui_base;

  let theme = _es6_get_module(_rootpath_src + "src/editors/theme.js").exports.theme;
  let config = _es6_get_module(_rootpath_src + "src/config/config.js").exports;
  let cconst = _es6_get_module(_rootpath_src + "src/path.ux/scripts/config/const.js").default_export;

  console.error("THEME", theme);

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
  let FrameManager = es6_get_module_meta(_rootpath_src + "src/path.ux/scripts/screen/FrameManager.js").exports;

  FrameManager.startEvents(() => {
    return g_app_state ? g_app_state.screen : undefined;
  });

  window._stime = 10;

  window.setInterval(function () {
    /* deal with timeouts */

    /* window.pop_solve(draw_id); */
    if (window.redraw_start_times === undefined)
      return;

    for (var k in window.redraw_start_times) {
      var t = window.redraw_start_times[k];
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

  var config = _es6_get_module(_rootpath_src + "src/config/config.js");

  //start primary on_tick timer

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

  window._handle_key_exclude = function handle_key_exclude(e) {
    var kc = charmap[e.keyCode];
    if (kc === undefined)
      kc = "";

    var keystr = gen_keystr(kc, {
      shift: e.shiftKey,
      alt  : e.altKey, ctrl: e.ctrlKey
    })

    keystr = keystr.toString().toUpperCase()
    if (keystr in key_exclude_list) {
      e.preventDefault();
    }
  }

  //var ce = document.getElementById("canvas2d_work");

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

