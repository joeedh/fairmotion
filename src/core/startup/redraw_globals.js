"not_a_module";

window.init_redraw_globals_2 = function init_redraw_globals() {
  let eventmanager = es6_get_module_meta(_rootpath_src + "/core/eventmanager.js").exports;
  let eman = eventmanager.manager;

  /*
  eman.addEventListener("draw", (e) => {
    requestAnimationFrame(e.callback[0]);
  });
  //*/
};

window.init_redraw_globals = function init_redraw_globals() {
  //let eventmanager = es6_get_module_meta(_rootpath_src + "/core/eventmanager.js").exports;
  //let eman = eventmanager.manager;
  
  //let _req_idgen = 1;

  function myrequestAnimationFrame(func1) {
    return requestAnimationFrame(func1);
  }

  function old_myrequestAnimationFrame(func1) {
    let id = _req_idgen++;
    
    if (!eman.ready) {
      requestAnimationFrame(func1);
    } else {
      window.setTimeout(() => {
        eman.fireEvent("draw", {
          type: "draw",
          callback: [func1]
        });
      }, 1);
    }
    
    
    return id;
  }
  
  window._addEventListener = window.addEventListener;
  window._removeEventListener = window.removeEventListener;
  window._killscreen_handlers = [];
  
  window._send_killscreen = function() {
    var evt = {type : 'killscreen'};
    
    for (var h of this._killscreen_handlers) {
      try {
        h(evt);
      } catch (error) {
        print_stack(error);
        console.log("Error while executing a killscreen callback");
      }
    }
  }
  
  window.removeEventListener = function(e) {
    if (e._is_killscreen) {
      this._killscreen_handlers.remove(e, false);
    } else {
      return window._removeEventListener.apply(this, arguments);
    }
  }
  
  window.addEventListener = function(name, cb) {
    cb._is_killscreen = 1;
    
    if (name != "killscreen") {
      return this._addEventListener.apply(this, arguments);
    } else {
      this._killscreen_handlers.push(cb);
    }
  }
  
  var animreq = undefined;

  var animreq_ui = undefined;
  var block_ui_draw = false;

  //this appears to do nothing now?
  window.force_viewport_redraw = function () {
    window.redraw_viewport();
  }

  window._solve_idgen = 1;
  let outstanding_solves = {};

  window.push_solve = function(spline) {
    var id = _solve_idgen++;

    if (DEBUG.solve_order) {
      console.log("push solve", id);
    }

    outstanding_solves[id] = 1;
    return id;
  }

  window.pop_solve = function(id) {
    if (DEBUG.solve_order) {
      console.log("pop solve", id);
    }
    
    if (!(id in outstanding_solves)) {
      console.warn("Warning: either pop_solve call was switched, or the system automatically called due to timeout");
      return;
    }

    delete outstanding_solves[id];

    redraw_viewport();
  }

  let redraw_viewport_promise = undefined;
  
  let animreq2;
  window._all_draw_jobs_done = function() {
    //console.log("all rendering jobs done");
    animreq2 = undefined;
  }

  window._block_drawing = false;

  //if true, draw will enter double-buffered mode
  //for one frame
  window._wait_for_draw = false;

  /** primary a debugging function, destroys all caches and draws*/
  window.complete_viewport_draw = function(tries=100) {
    if (animreq !== undefined || !window.g_app_state || !g_app_state.ctx) {
      if (tris <= 0) {
        console.log("Failed to execute complete_viewport_draw()!");
        return;
      }

      window.setTimeout(() => {
        window.complete_viewport_draw(tris--);
      }, 1);
    }

    let ctx = g_app_state.ctx;

    if (!ctx.frameset) {
      return;
    }

    let spline = ctx.frameset.spline;
    spline.drawer = new SplineDrawer(spline);

    spline = ctx.frameset.pathspline;
    spline.drawer = new SplineDrawer(spline);

    window.redraw_viewport();
  }

  window.redraw_viewport = function() {
    if (animreq !== undefined) {
      return redraw_viewport_promise;
    }

    redraw_viewport_promise = new Promise((accept, reject) => {
      animreq = requestAnimationFrame(() => {
        animreq = undefined;

        if (!g_app_state || !g_app_state.screen) {
          return;
        }

        if (window._block_drawing) {
          return;
        }

        let screen = g_app_state.screen;

        for (let sarea of screen.sareas) {
          if (sarea.area.do_draw_viewport) {
            sarea.area.do_draw_viewport();
          }
        }

        if (window._wait_for_draw) {
          window._wait_for_draw = false;
        }

        accept();
      })
    });

    return redraw_viewport_promise;
  }

  var requestId;
  window._fps = 1;

  window.reshape = function reshape(gl) {
      var g = window.g_app_state;
      if (g === undefined)
          return;

      window._ensure_thedimens();

  }
}
