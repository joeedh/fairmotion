"not_a_module";

window.init_redraw_globals = function init_redraw_globals() {
  window.redraw_rect_combined = [new Vector3(), new Vector3()];
  window.redraw_rect = [new Vector3(), new Vector3()]; //[[0, 0, 0], [0, 0, 0]];
  window.last_redraw_rect = [new Vector3(), new Vector3()];
  window.redraw_rect_defined = false;
  window.redraw_whole_screen = false;
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

      //console.trace("ui redraw", animreq_ui);
      if (animreq_ui == undefined) {
          animreq_ui = window.requestAnimationFrame(function () {
              animreq_ui = undefined;

              console.log("ui frame");

              if (g_app_state != undefined)
                  g_app_state.eventhandler.on_draw();
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

    console.log("push solve", id);
    var sid = spline._internal_id;
    
    redraw_queue[id] = [];
    redraw_smap[id] = sid;
    redraw_start_times[id] = time_ms();
    
    cur_redraw_queue = redraw_queue[id];
    pending_redraws++;
    
    return id;
  }

  window.pop_solve = function(id) {
    console.log("pop solve", id);
    
    if (!(id in this.redraw_queue)) {
      console.trace("Warning: either pop_solve was called switch, or the system automatically called due to timeout");
      return;
    }
    
    var queue = redraw_queue[id];
    delete redraw_start_times[id];
    delete redraw_smap[id];
    delete redraw_queue[id];
    pending_redraws--;
    
    for (var i=0; i<queue.length; i++) {
      redraw_viewport(queue[i][0], queue[i][1], true);
    }
  }

  window.redraw_viewport = function (min, max, ignore_queuing) {
      if (ignore_queuing == undefined)
        ignore_queuing = false;
      if (!ignore_queuing && pending_redraws > 0) {
        cur_redraw_queue.push([min, max]);
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
          var h = window.innerHeight;

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

      if (g_app_state == undefined || g_app_state.screen == undefined)
          return;

      var g = g_app_state;
      var cs = g.screen.children;
      for (var i = 0; i < cs.length; i++) {
          var c = cs[i];

          if (c.constructor.name == "ScreenArea" && c.area.draw_viewport != undefined) {
              c.area.draw_viewport = 1; //flag update for view2d
          }
      }

      if (animreq == undefined) {
          animreq = window.requestAnimationFrame(function () {
              animreq = undefined;

              for (var i = 0; i < g_app_state.screen.children.length; i++) {
                  var c = g_app_state.screen.children[i];

                  var is_viewport = c.constructor.name == "ScreenArea" &&
                                    c.area.constructor.name == "View2DHandler";
                  if (is_viewport) {
                      var old = g_app_state.active_view2d;
                      g_app_state.active_view2d = c.area;
                      
                      c.area.do_draw_viewport();
                      
                      g_app_state.active_view2d = old;
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

      // change the size of the canvas's backing store to match the size it is displayed.
      var canvas = document.getElementById('canvas2d_work');
      var canvas2d = document.getElementById("canvas2d")

      g.canvas = canvas;
      g.canvas2d = canvas2d;

      //ensure canvas2d'd dimensions are correct
      if (canvas2d.width != canvas.clientWidth || canvas2d.height != canvas.clientHeight) {
          canvas2d.clientWidth = canvas.clientWidth;
          canvas2d.clientHeight = canvas.clientHeight;
          canvas2d.width = canvas.clientWidth;
          canvas2d.height = canvas.clientHeight;

          window.redraw_viewport();

          if (g != undefined && g.screen != undefined) {
              g.screen.do_full_recalc();
              window.redraw_ui();
          }
      }

      var width = window.innerWidth, height = window.innerHeight;

      if (canvas.width == width && canvas.height == height)
          return;

      var oldsize = [canvas.width, canvas.height]
      var newsize = [width, height]

      canvas.width = width;
      canvas.height = height;

      g.size = new Vector2(newsize);

      if (g.screen != undefined) {
          g.screen.do_full_recalc();
          g.eventhandler.on_resize(newsize, oldsize);

          window.redraw_ui();
      }
  }
}
