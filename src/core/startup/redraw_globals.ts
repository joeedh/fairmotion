"not_a_module";

window.init_redraw_globals_2 = function init_redraw_globals() {

  /*
  eman.addEventListener("draw", (e) => {
    requestAnimationFrame(e.callback[0]);
  });
  //*/
};

window.init_redraw_globals = function init_redraw_globals() {

  /* NOTE: an old_myrequestAnimationFrame() sat here.  It had no callers and
     referenced _req_idgen (declared only in the commented-out line above it)
     and an `eman` that exists nowhere in the tree. */

  window._addEventListener = window.addEventListener;
  window._removeEventListener = window.removeEventListener;
  window._killscreen_handlers = [];

  window._send_killscreen = function () {
    var evt: KillscreenEvent = {type: 'killscreen'};

    for (var h of this._killscreen_handlers) {
      try {
        h(evt);
      } catch (error) {
        print_stack(error);
        console.log("Error while executing a killscreen callback");
      }
    }
  }

  /* NOTE: this had a killscreen branch guarded by `e._is_killscreen`, but the
     DOM passes the event *name* as the first argument, so the flag was always
     undefined and the branch never ran -- killscreen handlers have never been
     removable.  Only the forwarding path is left. */
  window.removeEventListener = function (this: Window, name: string,
                                         cb: EventListenerOrEventListenerObject,
                                         options?: boolean | EventListenerOptions) {
    return window._removeEventListener(name, cb, options);
  }

  window.addEventListener = function (this: Window, name: string,
                                      cb: EventListenerOrEventListenerObject,
                                      options?: boolean | AddEventListenerOptions) {
    Reflect.set(cb, "_is_killscreen", 1);

    if (name != "killscreen") {
      return this._addEventListener(name, cb, options);
    } else {
      /* The killscreen channel is ours, not the DOM's, and every listener on it
         is a plain function taking a KillscreenEvent. */
      this._killscreen_handlers.push(cb as KillscreenCallback);
    }
  }

  var animreq: number | undefined = undefined;

  var animreq_ui: number | undefined = undefined;
  var block_ui_draw = false;

  //this appears to do nothing now?
  window.force_viewport_redraw = function () {
    window.redraw_viewport();
  }

  window._solve_idgen = 1;
  /* A set of live solve ids; the value is always 1. */
  let outstanding_solves: {[id: number]: number} = {};

  window.push_solve = function (spline) {
    var id = window._solve_idgen++;

    if (DEBUG.solve_order) {
      console.log("push solve", id);
    }

    outstanding_solves[id] = 1;
    return id;
  }

  window.pop_solve = function (id) {
    if (DEBUG.solve_order) {
      console.log("pop solve", id);
    }

    if (!(id in outstanding_solves)) {
      console.warn("Warning: either pop_solve call was switched, or the system automatically called due to timeout");
      return;
    }

    delete outstanding_solves[id];

    //redraw_viewport();
  }

  let redraw_viewport_promise: Promise<void> | undefined = undefined;

  let animreq2: number | undefined;
  window._all_draw_jobs_done = function () {
    //console.log("all rendering jobs done");
    animreq2 = undefined;
  }

  if (0) {
    let block: number | undefined;
    Object.defineProperty(window, "_block_drawing", {
      get() {
        return block;
      },
      set(v: number) {
        if (v === 0) {
          console.warn("redraw block clear");
        } else {
          console.warn("redraw block set", v);
        }
        block = v;
      }
    });
  }

  window._block_drawing = 0;

  //if true, draw will enter double-buffered mode
  //for one frame
  window._wait_for_draw = false;

  /** primary a debugging function, destroys all caches and draws*/
  window.complete_viewport_draw = function (tries = 100) {
    if (animreq !== undefined || !window.g_app_state || !g_app_state.ctx) {
      /* NOTE: both tests named `tris`, so this guard threw a ReferenceError
         every time it ran; the retry passed `tries--`, which decrements a local
         the next call never sees; and the fall-through had no `return`, so a
         retry went straight on to dereference the ctx it had just found missing. */
      if (tries <= 0) {
        console.log("Failed to execute complete_viewport_draw()!");
        return;
      }

      window.setTimeout(() => {
        window.complete_viewport_draw(tries - 1);
      }, 1);

      return;
    }

    let ctx = g_app_state.ctx;

    if (!ctx.frameset) {
      return;
    }

    let spline = ctx.frameset.spline;
    spline.drawer = new _SplineDrawer(spline);

    spline = ctx.frameset.pathspline;
    spline.drawer = new _SplineDrawer(spline);

    window.redraw_viewport();
  }

  window.redraw_viewport_lock = 0;

  window.redraw_viewport = function () {
    if (animreq !== undefined) {
      return redraw_viewport_promise;
    }

    redraw_viewport_promise = new Promise((accept, reject) => {
      animreq = requestAnimationFrame(() => {
        animreq = undefined;

        if (!g_app_state || !g_app_state.screen) {
          return;
        }
        if (window._block_drawing > 0) {
          window.redraw_viewport();
          return;
        }

        /* NOTE: an `if (0)` block sat here that pre-updated the spline draw
           batches for every view2d_editor area before the real draw pass, then
           re-checked window._block_drawing.  It has always been switched off. */

        let screen = g_app_state.screen;

        for (let sarea of screen.sareas) {
          /* Only fairmotion's viewport editors define this; path.ux's Area
             base class knows nothing about it. */
          let draw = sarea.area && Reflect.get(sarea.area, "do_draw_viewport");

          if (typeof draw === "function") {
            draw.call(sarea.area);
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

  var requestId: number | undefined;
  window._fps = 1;

  window.reshape = function reshape(gl: WebGLRenderingContext) {
    var g = window.g_app_state;
    if (g === undefined)
      return;

    window._ensure_thedimens();

  }
}
