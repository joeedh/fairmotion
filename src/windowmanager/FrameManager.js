"use strict";

import * as config from 'config';
import {login_dialog} from 'dialogs';

import {
  MinMax, get_rect_lines, get_rect_points, aabb_isect_2d,
  inrect_2d, closest_point_on_line, dist_to_line_v2, 
  aabb_isect_minmax2d
} from 'mathlib';

import {ToolOp, UndoFlags, ToolFlags} from 'toolops_api';
import {STRUCT} from '../core/struct.js';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, KeyHandler, 
        charmap, TouchEventManager, EventHandler} from "../editors/events";

import {UICanvas} from 'UICanvas';
import {UIFrame} from 'UIFrame';
import {RowFrame} from 'UIPack';
import {
  PackFlags, UIElement, UIFlags, UIHoverHint, UIHoverBox
} from 'UIElement';

import {ScreenArea, Area} from 'ScreenArea';
import {SplitAreasTool, CollapseAreasTool, HintPickerOp} from 'FrameManager_ops';
import {ScreenBorder, BORDER_WIDTH} from 'ScreenBorder';

/*
this module cyclically refers to these two modules
at runtime (not during module loading, though).

patched by elevating UIMenu and Dialog to globals.

import {Dialog} from 'dialog';
import {UIMenu} from 'UIMenu';
*/

export class Screen extends UIFrame {
  constructor(unused, int width, 
                int height)
  {
    super();
    
    this.size = [width, height];
    this.pos = [0, 0];
    this.use_old_size = false; //use old size on next on_resize call, but only that call
    this.draw_active = undefined; //currently being drawn screenarea
    
    this.touchstate = {};
    this.touch_ms = {};
    this.tottouch = 0;
    
    this.session_timer = new Timer(60000);
    
    //this is used to delay keyup events for modifiers
    //it stores events in a queue, and delays them
    this.modup_time_ms = new GArray();
    
    var this2 = this;
    this.event_tick_ival = window.setInterval(function() {
      this2.event_tick();
      
      if (this2 !== g_app_state.screen) {
        window.clearInterval(this2.event_tick_ival);
        this2.event_tick_ival = undefined;
      }
    }, 30);
    
    this.rows = new GArray();
    this.cols = new GArray();
    
    this.last_tick = time_ms();
    this.child_borders = new hashtable();
    
    this.shift = false;
    this.alt = false;
    this.ctrl = false;
    
    this.keymap = new KeyMap();
    this.last_sync = time_ms();
    
    this.areas = new GArray();
    
    var this2 = this;
    function handle_split_areas() {
      this2.split_areas();
    }
    
    var k = this.keymap;
    k.add_tool(new KeyHandler("O", ["CTRL"], "Open File"),
               "appstate.open()");
    k.add_tool(new KeyHandler("O", ["CTRL", "SHIFT"], "Open Recent"),
               "appstate.open_recent()");
    k.add_tool(new KeyHandler("S", ["CTRL", "ALT"], "Save File"),
               "appstate.save_as()");
    k.add_tool(new KeyHandler("S", ["CTRL"], "Save File"),
               "appstate.save()");
    k.add_func(new KeyHandler("V", [], "Split Areas"), handle_split_areas)
    k.add_func(new KeyHandler("U", ["CTRL", "SHIFT"]), function() {
      console.log("saving new startup file.");
      g_app_state.set_startup_file();
    });
    
    this.canvas = new UICanvas([[0, 0], this.size]);
  }

  static fromSTRUCT(reader) {
    var ob = new Screen(0, 512, 512);
    
    reader(ob);
    
    ob.areas = new GArray(ob.areas);
    
    for (var c of ob.areas) {
      c.parent = ob;
    }
    
    return ob;
  }

  destroy() {
    this.canvas.destroy();
    
    for (var c of this.children) {
      if (c instanceof ScreenArea) {
        c.destroy();
      }
    }
  }
  
  split_areas() {
    console.log("split areas", this);
    
    g_app_state.toolstack.exec_tool(new SplitAreasTool(this));
    
    /*
    var c = this.children[0]
    
    var oldsize = [c.size[0], c.size[1]]
    var newsize = [c.size[0]*0.5, c.size[1]]
    
    c.size[0] = c.size[0]*0.5;
    c.on_resize(oldsize, newsize);
    
    var c2 = c.area_duplicate()
    c2.size = new Vector2(c.size)
    c2.pos = [c.size[0], 0]
    this.add(c2);
    
    //c.size[0] = c.size[0]*0.5;
    //c.set_canvasbox()
    // */
  }

  set_touchstate(MouseEvent event, String type) {
    for (var k in event.touches) {
      this.touch_ms[k] = time_ms();
      
      if (type == "down" || type == "move") {
        this.touchstate[k] = event.touches[k];
      } else if (type == "up") {
        delete this.touchstate[k];
      }
    }
    
    var threshold = 4000;
    this.tottouch = 0;
    for (var k in this.touchstate) {
      if (time_ms() - this.touch_ms[k] > threshold) {
        console.log("Destroying stale touch state");
        
        var event = new MyMouseEvent(event.x, event.y, 0, MyMouseEvent.MOUSEUP);
        event.touches = {k : this.touchstate[k]};
        
        //prevent infinite recursion
        this.touch_ms[k] = time_ms();
        this.on_mouseup(event);
        delete this.touchstate[k];
      }
      this.tottouch++;
    }
  }
  
  area_event_push() {
    if (this.active instanceof ScreenArea) {
      this.active.area.push_ctx_active();
      return this.active.area;
    }
  }
  
  area_event_pop(Area area) {
    if (area != undefined) {
      area.pop_ctx_active();
    }
  }
  
  _on_mousemove(MouseEvent e)
  {
    if (DEBUG.mousemove)
      console.log("mmove", [e.x, e.y])
    
    this.mpos = [e.x, e.y];
    for (var c of this.children) {
      c.mpos = new Vector2([e.x-c.pos[0], e.y-c.pos[1]])
    }
    
    e = this.handle_event_modifiers(e);
    this.set_touchstate(e, "move");
    
    //console.log("t", e.touches, this.tottouch);
    var area = this.area_event_push();
    
    super._on_mousemove(e);
    this.area_event_pop(area);
  }
  
  get_active_view2d() {
    var view2d = undefined;
    
    if (this.active != undefined && this.active instanceof ScreenArea) {
      if (this.active.area.constructor.name == "View2DHandler") {
        view2d = this.active.area;
      }
    }
    
    //console.log("active view2d:", view2d._id, view2d);
    return view2d;
  }

  handle_active_view2d() {
    var view2d = this.get_active_view2d();
    if (view2d != undefined)
      g_app_state.active_view2d = view2d;
  }

  _on_mousedown(MouseEvent e)
  {
    this.handle_active_view2d();
    
    //console.log("alt", event.altKey);
   //console.log(e.altKey);
    //console.log(e.ctrlKey);
   // console.log(e.shiftKey);
    
    if (DEBUG.mouse)
      console.log("mdown", [e.x, e.y], e.button)
    
    this.mpos = [e.x, e.y];  
    for (var c of this.children) {
      c.mpos = new Vector2([e.x-c.pos[0], e.y-c.pos[1]])
    }
    
    this.shift = e.shiftKey;
    this.ctrl = e.ctrlKey;
    this.alt = e.altKey;

    //e = this.handle_event_modifiers(e);
    this.set_touchstate(e, "down");
    
    var area = this.area_event_push();
    super._on_mousedown(e);
    this.area_event_pop(area);
    
    //console.log("t", e.touches, this.tottouch);
  }

  _on_mouseup(MouseEvent e)
  {
    this.handle_active_view2d();
    
    if (DEBUG.mouse)
      console.log("mouseup", [e.x, e.y], e.button)
    this.mpos = [e.x, e.y];
    for (var c of this.children) {
      c.mpos = new Vector2([e.x-c.pos[0], e.y-c.pos[1]])
    }
    
    e = this.handle_event_modifiers(e);
    this.set_touchstate(e, "up");
    
    var area = this.area_event_push();
    super._on_mouseup(e);
    this.area_event_pop(area);
    
    //console.log("t", e.touches, this.tottouch);
  }

  _on_mousewheel(MouseEvent e, float delta)
  {
    this.handle_active_view2d();
    
    this.mpos = [e.x, e.y];
    for (var c of this.children) {
      c.mpos = new Vector2([e.x-c.pos[0], e.y-c.pos[1]])
    }
    
    var area = this.area_event_push();
    super._on_mousewheel(e, delta);
    this.area_event_pop(area);
  }

  handle_event_modifiers(KeyboardEvent event) {
    var copy = false;
    var event2;
    
    if (event instanceof MyMouseEvent) {
        event2 = event.copy();
        event2.keyCode = event.keyCode;
        event2.shiftKey = event.shiftKey;
        event2.ctrlKey = event.ctrlKey;
        event2.altKey = event.altKey;
    } else {
      event2 = {
          x : event.x,
          y : event.y,
          button : event.button,
          keyCode : event.keyCode,
          shiftKey : event.shiftKey,
          ctrlKey : event.ctrlKey,
          altKey : event.altKey
       };
    }
    
    event = event2;
    
    for (var item of this.modup_time_ms) {
      if (item[2] == charmap["Shift"])
        event.shiftKey = true;
      if (item[2] == charmap["Alt"])
        event.altKey = true;
      if (item[2] == charmap["Ctrl"]) {
        event.ctrlKey = true;
      }
    }
    
    return event;
  }

  _on_keyup(KeyboardEvent event) {
    this.handle_active_view2d();
    
    switch (event.keyCode) {
      case charmap["Shift"]:
      case charmap["Alt"]:
      case charmap["Ctrl"]:
        event = {
          keyCode : event.keyCode,
          shiftKey : event.shiftKey,
          altKey : event.altKey,
          ctrlKey : event.ctrlKey
        };
        this.modup_time_ms.push([time_ms(), event, event.keyCode]);
        return;
        break;
    }
    
    event = this.handle_event_modifiers(event)
    
    super._on_keyup(event);
  }


  _on_keydown(KeyboardEvent event) {
    this.handle_active_view2d();
    
    var a = event.altKey, c = event.ctrlKey, s = event.shiftKey;
    event = this.handle_event_modifiers(event);
    
    this.shift = event.shiftKey;
    this.ctrl = event.ctrlKey;
    this.alt = event.altKey;
    
    var area = this.area_event_push();
    super._on_keydown(event);
    this.area_event_pop(area);
  }
  
  on_keyup(KeyboardEvent event) {
    this.handle_active_view2d();
    
    var ctx = new Context();
    var ret = this.keymap.process_event(ctx, event);
    
    if (ret != undefined) {
      ret.handle(ctx);
    } else {
      super.on_keyup(event);
    }
  }
  
  event_tick() {
    //handle delayed touch events
    touch_manager.process();
    
    g_app_state.raster.begin_draw(undefined, this.pos, this.size);
    
    //deal with delayed modifier key events
    var mod_delay = 60;
    
    for (var s of list(this.modup_time_ms)) {
      if (time_ms() - s[0] > mod_delay) {
        if (s[1].keyCode == charmap["Shift"]) {
          s[1].altKey = this.alt;
          s[1].ctrlKey = this.ctrl;
          this.shift = false;
        }
        
        if (s[1].keyCode == charmap["Alt"]) {
          s[1].shiftKey = this.shift;
          s[1].ctrlKey = this.ctrl;
          this.alt = false;
        }
        
        if (s[1].keyCode == charmap["Ctrl"]) {
          s[1].shiftKey = this.shift;
          s[1].altKey = this.alt;
          this.ctrl = false;
        }
        
        if (DEBUG.modifier_keys)
          console.log("delayed event");
        
        this.modup_time_ms.remove(s);
        super._on_keyup(s[1]);
      }
    }
    
    
    /*if ((this.active instanceof ScreenArea) && this.active.area instanceof
        View2DHandler) 
    {
      g_app_state.active_view2d = this.active.area;
    }*/
    
    if (time_ms() - g_app_state.jobs.last_ms > g_app_state.jobs.ival) {
      g_app_state.jobs.run();
      g_app_state.jobs.last_ms = time_ms();
    }
  }
  
  on_draw() {
    if (this.recalc) {
      this.build_draw(this.canvas, false);
      this.recalc = false;
    }
  }
  
  _on_tick() {
    /*
    var ready = this.tick_timer.ready();
    if (!ready) {
      return;
    }//*/
    
    if (this.recalc) {
      this.build_draw(this.canvas, false);
      this.recalc = false;
    }
    
    this.last_tick = time_ms();
    this.on_tick();
    
    /*
    var ready = this.tick_timer.ready();
    for (var c of this.children) {
      if (c instanceof ScreenArea) {
        var area = this.area_event_push();
        
        if (ready) c.on_tick();
        else c.area.on_tick()
        
        this.area_event_pop(area);
      } else if (ready) {
        c.on_tick();
      }
    }//*/
  }
  
  disabledon_draw() {
    return;
    /*
   //draw editors
    for (var c of this.children) {
      //only call draw for screenarea children
      if (!(c instanceof ScreenArea)) continue;
     
      this.draw_active = c;
      
      this.recalc_child_borders(c);
      
      c.area.push_ctx_active();
      c.on_draw(undefined);
      c.area.pop_ctx_active();
      
      //g_app_state.raster.pop_scissor();
    }
    this.draw_active = undefined;
  
    super.on_draw(undefined);
    
    if (!DEBUG.disable_on_tick && time_ms() - this.last_tick > 32) { //(IsMobile ? 500 : 150)) {
      this.last_tick = time_ms();
      this.on_tick();
      
      var ready = this.tick_timer.ready();
      for (var c of this.children) {
        if (c instanceof ScreenArea) {
          if (ready) c.on_tick();
          else c.area.on_tick()
        } else if (ready) {
          c.on_tick();
        }
      }
    }
    
    if (this.modalhandler != null && !(this.modalhandler instanceof ScreenArea)) {
      this.modalhandler.on_draw(undefined);
    }
    
    //g_app_state.raster.pop_scissor();
    */
  }
  
  clear_textinput() {
    var canvas  = document.getElementById("canvas2d_work");
    
    canvas.textContent = "&nbsp";
  }
  
  on_tick()
  {
    if (window.the_global_dag != undefined) {
      if (this.ctx === undefined)
        this.ctx = new Context();
      
      the_global_dag.exec(this.ctx);
    }
    
    this.handle_active_view2d();
    
    try {
      g_app_state.session.settings.on_tick();
    } catch (_err) {
      print_stack(_err);
      console.log("settings on_tick error");
    }
    
    try {
      g_app_state.notes.on_tick();
    } catch (_err) {
      print_stack(_err);
      console.log("notes on_tick error");
    }
    
    if (time_ms() - this.last_sync > 700) {
      this.last_sync = time_ms();
    }
    
    if (!config.NO_SERVER && this.modalhandler == null && 
        !g_app_state.session.is_logged_in) 
    {
      login_dialog(new Context());
    }
    
    if (this.session_timer.ready() && g_app_state.session.is_logged_in) 
    {
      g_app_state.session.validate_session();
    }
    
    for (var c of this.children) {
      this.draw_active = c;
      
      if (c instanceof ScreenArea) {
        var area = this.area_event_push();
        c.on_tick();
        this.area_event_pop(area);
      }
    }
    
    this.draw_active = undefined;
  }

  on_resize(Array<int> newsize, Array<int> oldsize) 
  {
    g_app_state.size = new Vector2(newsize);
    
    if (oldsize == undefined || this.use_old_size)
      oldsize = [this.size[0], this.size[1]];
    
    if (newsize[0] < 100 || newsize[1] < 100) {
      this.use_old_size = true;
      newsize[0] = 100;
      newsize[1] = 100;
    }
    
    var ratio = (new Vector2(newsize)).divide(oldsize);
    
    this.size = [newsize[0], newsize[1]];
    this.canvas.viewport = [[0,0], newsize]
    
    if (oldsize[0] == 0.0 || oldsize[1] == 0.0)
      return;
    
    for (var c of this.children) {
      c.pos[0] *= ratio[0];
      c.pos[1] *= ratio[1];
      c.pos[0] = Math.ceil(c.pos[0])
      c.pos[1] = Math.ceil(c.pos[1])
      
      /*don't resize dialogs and menus*/
      //console.log("Fix dependency here as well");
      
      if (c instanceof Dialog || c instanceof UIMenu || c instanceof window.UIRadialMenu) continue;
      c.size[0] *= ratio[0];
      c.size[1] *= ratio[1];
      c.size[0] = Math.ceil(c.size[0])
      c.size[1] = Math.ceil(c.size[1])
    }
   
    this.snap_areas();
    
    for (var c of this.children) {
      //if (c instanceof ScreenArea && c.area instanceof View2DHandler)
      //  g_app_state.active_view2d = c.area;
      
      c.on_resize(newsize, oldsize);
    }
  }

  snap_areas(force) {
    //first ensure all areas are within the screen bounds
    //return;
    
    for (var sa of this.children) {
      if (!(sa instanceof ScreenArea))
        continue;
      
      sa.pos[0] = Math.max(sa.pos[0], 0.0);
      sa.pos[1] = Math.max(sa.pos[1], 0.0);
      sa.size[0] = Math.min(sa.size[0]+sa.pos[0], this.size[0]) - sa.pos[0];
      sa.size[1] = Math.min(sa.size[1]+sa.pos[1], this.size[1]) - sa.pos[1];
    }
    
    //snapping code
    var dis = 16.0;
    for (var i=0; !found && i<128; i++) {
      var found = false;
      
      for (var c1 of this.children) {
        if (!(c1 instanceof ScreenArea))
          continue;
          
        for (var c2 of this.children) {
          if (!(c2 instanceof ScreenArea))
            continue;
            
          if (c1 == c2)
            continue;
          
          var oldsize = new Vector2(c2.size);

          var found2 = false;
          
          var abs = Math.abs;
          //    top
          //left   right 
          //   bottom 
          
          
          //top
          if (abs(c1.pos[0]-c2.pos[0]) < dis
              && abs((c1.pos[1]+c1.size[1])-c2.pos[1]) < dis)
          {
            found2 = 1;
            c1.size[1] = c2.pos[1] - c1.pos[1];
            c1.size[1] = Math.max(c1.size[1], 4);
          }
          
          if (abs(c1.pos[1]-c2.pos[1]) < dis 
              && abs((c1.pos[0]+c1.size[0])-c2.pos[0]) < dis) 
          {
            found2 = 2;
            c1.size[0] = c2.pos[0] - c1.pos[0];
            c1.size[0] = Math.max(c1.size[0], 4);
          }
          
          if (found2 && c2.size[0] != oldsize[0] && c2.size[1] != oldsize[1]) {
            found = true;
            c2.on_resize(c2.size, oldsize);
            
            console.log("SNAPPED", found2, c2.size, oldsize);
          }
          
          if (found2)
            break;
        }
      }
    }
  }

  pop_modal()
  {
    super.pop_modal();
    
    if (this.modalhandler == null) {
      var e = new MyMouseEvent(this.mpos[0], this.mpos[1], 0, 0);
      e.shiftKey = this.shiftKey;
      e.altKey = this.altKey;
      e.ctrlKey = this.ctrlKey;
      
      //this._on_mousemove(e);
    }
  }
  
  recalc_all_borders() 
  {
    for (var c of this.children) { 
      if (c instanceof ScreenArea) {
        this.recalc_child_borders(c);
      }
    }
  }
  
  recalc_child_borders(ScreenArea child)
  {
    var bs = this.child_borders.get(child);
    
    for (var i=0; i<4; i++) {
      var border = bs[i];
      
      border.pos[0] = border.edge.min[0];
      border.pos[1] = border.edge.min[1];
      
      if (i%2 == 0) {
        border.pos[1] -= BORDER_WIDTH*0.5;
        border.size[0] = (border.edge.max[0]-border.edge.min[0]);
        border.size[1] = BORDER_WIDTH;
      } else {
        border.pos[0] -= BORDER_WIDTH*0.5;
        border.size[1] = border.edge.max[1]-border.edge.min[1];
        border.size[0] = BORDER_WIDTH;
      }
    }
  }

  remove(UIElement child) {
    super.remove(child);
    
    if (child instanceof ScreenArea) {
      this.areas.remove(child);
      
      var bs = this.child_borders.get(child);
      for (var i=0; i<4; i++) {
        this.remove(bs[i]);
      }
      
      this.child_borders.remove(child);
    }
  }

  add(UIElement child, packflag) { //packflag is optional
    var view2d;
    
    if (child instanceof ScreenArea) {
      this.areas.push(child);
      
      for (var k in child.editors) {
        var area = child.editors[k];
        if (area.constructor.name == "View2DHandler")
          view2d = area;
      }
    }
    
    if (view2d == undefined) {
      for (var c of this.children) {
        if (!(c instanceof ScreenArea))
          continue;
        
        if ("View2DHandler" in c.editors) {
          view2d = c.editors["View2DHandler"];
          break;
        }
      }
    }
    
    if (child instanceof ScreenArea) {
      //var canvas = new UICanvas([child.pos, child.size]);
      
      child.canvas = this.canvas; //canvas;
      for (var k in child.editors) {
        child.editors[k].canvas  = this.canvas;
      }
    } else if (child.canvas == undefined) {
      child.canvas = this.canvas;
    }

    super.add(child, packflag);
    
    if (child instanceof ScreenArea) {
      var bs = []
      for (var i=0; i<4; i++) {
        bs.push(new ScreenBorder(child, i));
        this.add(bs[bs.length-1]);
      }
      
      this.child_borders.set(child, bs);
      this.recalc_child_borders(child);
    }
  }

  toJSON() {
    var scrareas = new GArray();
    
    for (var c of this.children) {
      if (c instanceof ScreenArea)
        scrareas.push(c);
    }
    
    var ret = {scrareas : [], size : [this.size[0], this.size[1]]}
    for (var a of scrareas) {
      ret.scrareas.push(a.toJSON());
    }
    
    return ret;
  }

  do_partial_clip() {
    var canvas = this.canvas;
    var this2 = this;
    
    function clear_recalc(e, d) {
      for (var c of e.children) {
        //c.recalc = 0;
        //if (canvas != undefined && c.canvas == undefined)
        //  c.canvas = canvas;
        
        c.abspos[0] = 0; c.abspos[1] = 0;
        c.abs_transform(c.abspos);
          
        var t = c.dirty;
        //c.dirty = c.last_dirty;
        //c.last_dirty = t;
        
        if (!(c instanceof UIFrame)) {
          /*c.dirty[0][0] = c.abspos[0];
          c.dirty[0][1] = c.abspos[1];
          c.dirty[1][0] = c.size[0];
          c.dirty[1][1] = c.size[1];*/
        }
        
        c.abspos[0] = 0; c.abspos[1] = 0;
        c.abs_transform(c.abspos);
        
        if (aabb_isect_2d(c.abspos, c.size, d[0], d[1]) || c.is_canvas_root()) {
          c.do_recalc();
        }
        
        if (c instanceof UIFrame) {
          clear_recalc(c, d);
        } else {
          if (c.recalc) {
          //  canvas.clip(c.dirty);
          }
        }
      }
    }
    
    this.pack(canvas, false);
    this.pack(canvas, false);
    
    var d = this.calc_dirty();
    this.dirty_rects.reset();
    
    this.canvas.root_start();
    
    this.canvas.clip(d);
    this.canvas.clear(d[0], d[1]);
    
    clear_recalc(this, d);
  }

  build_draw(canvas, isVertical) {
    window.block_redraw_ui();
    
    //calls this.canvas.root_start()
    this.do_partial_clip();
    
    function descend(n, canvas, ctx) {
      for (var c of n.children) {
        if (c.canvas == undefined)
          c.canvas = n.get_canvas();
        
        c.ctx = ctx;
        
        if (c instanceof UIFrame)
          descend(c, canvas, ctx);
      }
    }

    if (this.ctx == undefined)
      this.ctx = new Context();
    
    if (this.canvas == undefined)
      this.canvas = this.get_canvas();
      
    descend(this, this.canvas, this.ctx);
      
    if (DEBUG.ui_canvas)
      console.log("------------->Build draw call " + this.constructor.name + ".on_draw()");

    this.snap_areas();
    
    super.build_draw(canvas, isVertical);
    
    window.unblock_redraw_ui();
    this.canvas.root_end();
  }

  data_link(block, getblock, getblock_us)
  {
    //have got to decouple context from View2DHandler
    this.ctx = new Context();
    
    for (var c of this.areas) {
      c.data_link(block, getblock, getblock_us);
    }
    
    var areas = this.areas;
    this.areas = new GArray()
    
    for (var a of areas) {
      this.add(a);
    }
  }
}

Screen.STRUCT = """
  Screen { 
    pos   : vec2;
    size  : vec2;
    areas : array(abstract(ScreenArea));
  }
"""

function load_screen(Screen scr, json_obj)
{
  var newsize = [scr.size[0], scr.size[1]]
  
  var obj = json_obj
  
  for (var c of list(scr.children)) {
    if (!(c instanceof ScreenBorder)) {
      console.log(c);
      scr.remove(c);
    }
  }
  scr.children = new GArray();
  
  var scrareas = obj.scrareas;
  for (var i=0; i<scrareas.length; i++) {
    var area = ScreenArea.fromJSON(scrareas[i]);
    scr.add(area);
    
    if (area.area.constructor.name == "View2DHandler") {
      scr.view2d = area.area;
      //scr.ctx.view2d = area.area;
      //g_app_state.active_view2d = area.area;
    }
  }
  
  //scale to current window size
  scr.size[0] = obj.size[0]; scr.size[1] = obj.size[1];
  scr.on_resize(newsize, obj.size);
  
  scr.size[0] = newsize[0]; scr.size[1] = newsize[1];
  scr.snap_areas();
}

export function gen_screen(WebGLRenderingContext gl, View2DHandler view2d, int width, int height)
{
  var scr = new Screen(view2d, width, height);
  view2d.screen = scr;
  
  g_app_state.screen = scr;
  g_app_state.eventhandler = scr;
  
  g_app_state.active_view2d = view2d;
  
  view2d.size = [width, height]
  view2d.pos = [0, 0];
  
  scr.ctx = new Context();
  scr.canvas = new UICanvas([[0, 0], [width, height]]);
  
  scr.add(new ScreenArea(view2d, scr.ctx, view2d.pos, view2d.size));

  return scr;
}

//argh! evil globals!
window.Screen = Screen;
window.ScreenArea = ScreenArea;
window.Area = Area;
