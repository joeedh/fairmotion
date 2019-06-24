"not_a_module";

window.init_redraw_globals_2 = function init_redraw_globals() {
  let eventmanager = es6_get_module_meta(_rootpath_src + "/core/eventmanager.js").exports;
  let eman = eventmanager.manager;
  
  eman.addEventListener("draw", (e) => {
    requestAnimationFrame(e.callback[0]);
  });
};

window.init_redraw_globals = function init_redraw_globals() {
  let eventmanager = es6_get_module_meta(_rootpath_src + "/core/eventmanager.js").exports;
  let eman = eventmanager.manager;
  
  let _req_idgen = 1;
  function myrequestAnimationFrame(func1) {
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
  
  window.redraw_rect_combined = [new Vector3(), new Vector3()];
  window.redraw_rect = [new Vector3(), new Vector3()]; //[[0, 0, 0], [0, 0, 0]];
  window.last_redraw_rect = [new Vector3(), new Vector3()];
  window.redraw_rect_defined = false;
  window.redraw_whole_screen = false;
  
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

  window.block_redraw_ui = function () {
      var oldval = block_ui_draw;
      block_ui_draw = true;
      return oldval;
  }

  window.unblock_redraw_ui = function () {
      var oldval = block_ui_draw;
      block_ui_draw = false;
      return oldval;
  }

  window.redraw_ui = function () {
      if (block_ui_draw) return;

      //if (DEBUG.ui_redraw && Math.random() > 0.99)
      //  console.trace("ui redraw", animreq_ui);
      
      if (animreq_ui == undefined) {
          animreq_ui = myrequestAnimationFrame(function () {
              animreq_ui = undefined;

              if (DEBUG.ui_redraw)
                console.log("ui frame");

              if (window.g_app_state != undefined && window.g_app_state.eventhandler.on_draw)
                  window.g_app_state.eventhandler.on_draw();
          });
      }
  }

  window.redraw_viewport_p = function(min, max, promise) {
    promise.then(function() {
      window.redraw_viewport(min, max);
    });
  }

  window.force_viewport_redraw = function () {
      redraw_whole_screen = true;
      window.redraw_whole_screen = true;
  }

  window._solve_idgen = 1;
  window.redraw_queue = {};
  window.redraw_smap = {};
  window.redraw_start_times = {};
  window.cur_redraw_queue = undefined;
  window.pending_redraws = 0;

  window.push_solve = function(spline) {
    var id = _solve_idgen++;

    //console.log("push solve", id);
    var sid = spline._internal_id;
    
    redraw_queue[id] = [];
    redraw_smap[id] = sid;
    redraw_start_times[id] = time_ms();
    
    cur_redraw_queue = redraw_queue[id];
    pending_redraws++;
    
    return id;
  }

  var _popsolve_min = [0, 0];
  var _popsolve_max = [0, 0];
  
  window.pop_solve = function(id) {
    //console.log("pop solve", id);
    
    if (!(id in this.redraw_queue)) {
      console.warn("Warning: either pop_solve call was switched, or the system automatically called due to timeout");
      return;
    }
    
    var queue = redraw_queue[id];
    delete redraw_start_times[id];
    delete redraw_smap[id];
    delete redraw_queue[id];
    pending_redraws--;
    
    var min = _popsolve_min, max = _popsolve_max;
    for (var i=0; i<queue.length; i += 5) {
      min[0] = queue[i], min[1] = queue[i+1];
      max[0] = queue[i+2], max[1] = queue[i+3];
      
      redraw_viewport(min, max, true, queue[i+4]);
    }
  }

  //redraw rects in workcanvas space
  window.workcanvas_redraw_rects = [];
  window.workcanvas_redraw_rects2 = [];
  
  let redraw_viewport_promise = undefined;
  
  //combine_mode is optional, false.  used by e.g. transform code.
  window.redraw_viewport = function(min, max, ignore_queuing, combine_mode) {
    //console.trace("redraw_viewport");
    
    if (ignore_queuing == undefined)
      ignore_queuing = false;
    
    if (!ignore_queuing && pending_redraws > 0) {
      var q = cur_redraw_queue;
      
      if (min != undefined && max != undefined) {
        /*if (combine_mode && q.length > 0) {
          var i = q.length - 4;
          
          q[i]   = Math.min(q[i]  , min[0]);
          q[i+1] = Math.min(q[i+1], min[1]);
          
          q[i+2] = Math.max(q[i+2], max[0]);
          q[i+3] = Math.max(q[i+3], max[1]);
        } else {*/
          q.push(min[0]);
          q.push(min[1]);
          q.push(max[0]);
          q.push(max[1]);
          q.push(combine_mode);
        //}
      } else { //whole screen
        var w = 50000;
        q.length = 0;
        q.push(-w), q.push(-w), q.push(w), q.push(w);
      }
      return;
    }
    
    //console.log("redraw viewport", animreq);
    
    var r = workcanvas_redraw_rects;
    
    if (min != undefined && max != undefined) {
      if (combine_mode && r.length > 0) {
          var i = r.length - 4;

          r[i]   = Math.min(r[i]  , min[0]);
          r[i+1] = Math.min(r[i+1], min[1]);
          
          r[i+2] = Math.max(r[i+2], max[0]);
          r[i+3] = Math.max(r[i+3], max[1]);
      } else {
        r.push(min[0]);
        r.push(min[1]);
        r.push(max[0]);
        r.push(max[1]);
      }
    } else {
      //do whole screen
      var w = 50000;

      r.length = 0;
      r.push(-w), r.push(-w), r.push(w), r.push(w);
    }
    
    if (animreq == undefined) {
      redraw_viewport_promise = new Promise((accept, reject) => {
          animreq = myrequestAnimationFrame(function () {
            animreq = undefined;
    
            var rects = workcanvas_redraw_rects;
    
            workcanvas_redraw_rects = workcanvas_redraw_rects2;
            workcanvas_redraw_rects.length = 0;
            workcanvas_redraw_rects2 = rects;
    
            for (var i = 0; i < window.g_app_state.screen.children.length; i++) {
              var c = window.g_app_state.screen.children[i];
      
              var is_viewport = c.constructor.name == "ScreenArea" &&
                c.area.constructor.name == "View2DHandler";
              if (is_viewport) {
                var old = window.g_app_state.active_view2d;
                window.g_app_state.active_view2d = c.area;
        
                c.area.do_draw_viewport(rects);
        
                window.g_app_state.active_view2d = old;
                accept();
              }
            }
          });
        });
      
      return redraw_viewport_promise
    } else {
      return redraw_viewport_promise;
    }
  };
  
  
  /*
  min/max are optional, whole screen
  ignore_queuing is optional, false
  */
  window.rffedraw_viewport = function (min, max, ignore_queuing) {
      if (ignore_queuing == undefined)
        ignore_queuing = false;
      
      if (!ignore_queuing && pending_redraws > 0) {
        var q = cur_redraw_queue;
        
        q.push(min[0]);
        q.push(min[1]);
        q.push(max[0]);
        q.push(max[1]);
        return;
      }
      
      if (DEBUG != undefined && DEBUG.viewport_partial_update) {
        console.trace("\n\n\n==Viewport Redraw==:", redraw_whole_screen, 
                      min, max, "||", redraw_rect[0], redraw_rect[1], "\n\n\n");
      }
      if (window.redraw_whole_screen)
          min = max = undefined;
        
      if (window._trace) {
          console.trace();
      }

      if (min == undefined) {
          window.redraw_whole_screen = true;

          if (!window.redraw_rect_defined) {
              window.redraw_rect[0].zero();
              window.redraw_rect[1].zero();
              
              //XXX hackish! need to pass min/max properly
              //to individual work canvases, so they can 
              //multiply with their inverse matrices
              window.redraw_rect[0][0] = window.redraw_rect[0][1] = -15000;
              window.redraw_rect[1][0] = 15000;
              window.redraw_rect[1][1] = 15000;
          }
      } else if (!window.redraw_whole_screen && window.redraw_rect_defined) {
          var h = window.theHeight;

          window.redraw_rect[0][0] = Math.min(min[0], window.redraw_rect[0][0]);
          window.redraw_rect[0][1] = Math.min(min[1], window.redraw_rect[0][1]);

          window.redraw_rect[1][0] = Math.max(max[0], window.redraw_rect[1][0]);
          window.redraw_rect[1][1] = Math.max(max[1], window.redraw_rect[1][1]);
      } else if (!redraw_whole_screen) {
          window.redraw_rect[0][0] = min[0];
          window.redraw_rect[0][1] = min[1];
          window.redraw_rect[1][0] = max[0];
          window.redraw_rect[1][1] = max[1];
          window.redraw_rect_defined = true;
      }

      if (window.g_app_state == undefined || window.g_app_state.screen == undefined)
          return;

      var g = window.g_app_state;
      var cs = window.g_app_state.screen.children;
      
      for (var i = 0; i < cs.length; i++) {
          var c = cs[i];

          if (c.constructor.name == "ScreenArea" && c.area.draw_viewport != undefined) {
              c.area.draw_viewport = 1; //flag update for view2d
          }
      }

      if (animreq == undefined) {
          animreq = myrequestAnimationFrame(function () {
              animreq = undefined;

              for (var i = 0; i < window.g_app_state.screen.children.length; i++) {
                  var c = window.g_app_state.screen.children[i];

                  var is_viewport = c.constructor.name == "ScreenArea" &&
                                    c.area.constructor.name == "View2DHandler";
                  if (is_viewport) {
                      var old = window.g_app_state.active_view2d;
                      window.g_app_state.active_view2d = c.area;
                      
                      c.area.do_draw_viewport();
                      
                      window.g_app_state.active_view2d = old;
                  }
              }

             for (var i=0; i<2; i++) {
                for (var j=0; j<3; j++) {
                  window.last_redraw_rect[i][j] = window.redraw_rect[i][j];
                }
              }

              window.redraw_rect[0].zero();
              window.redraw_rect[1].zero();
              window.redraw_whole_screen = false;
              window.redraw_rect_defined = false;
          });
      }
  }
  
  var requestId;
  window._fps = 1;

  window.reshape = function reshape(gl) {
      var g = window.g_app_state;
      if (g == undefined)
          return;

      window._ensure_thedimens();

      // change the size of the canvas's backing store to match the size it is displayed.
      //var canvas = document.getElementById('canvas2d_work');
      //var canvas2d = document.getElementById("canvas2d")

      //g.canvas = canvas;
      //g.canvas2d = canvas2d;

      let screen = g.screen;

      /*
      if (canvas2d.width != canvas.clientWidth || canvas2d.height != canvas.clientHeight) {
          canvas2d.width = canvas.clientWidth;
          canvas2d.height = canvas.clientHeight;

          window.redraw_viewport();

          if (g != undefined && g.screen != undefined) {
              //g.screen.do_full_recalc();
              g.screen.update();
              window.redraw_ui();
          }
      }//*/
  }
}
