"use strict";

import {login_dialog} from 'dialogs';

import {
  MinMax, get_rect_lines, get_rect_points, aabb_isect_2d,
  inrect_2d, closest_point_on_line, dist_to_line_v2, 
  aabb_isect_minmax2d
} from 'mathlib';

import {ToolOp, UndoFlags, ToolFlags} from 'toolops_api';
import {STRUCT} from 'struct';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, KeyHandler, 
        charmap, TouchEventManager, EventHandler} from 'events';

import {UIButton, UIButtonIcon} from 'UIWidgets';

import {UICanvas} from 'UICanvas2D';
import {UIFrame} from 'UIFrame';
import {RowFrame} from 'UIPack';
import {
  PackFlags, UIElement, UIFlags, UIHoverHint, UIHoverBox
} from 'UIElement';

var Area_Types = new set(["View2DHandler"]);
window.Area_Types = Area_Types;

var _area_active_stacks = {}
var _area_active_lasts = {};
function _get_area_stack(cls) {
  var h = cls.name;
  
  if (!(h in _area_active_stacks)) {
    _area_active_stacks[h] = new GArray();
  }
  
  return _area_active_stacks[h];
}

//this should have been named ScreenEditor, ger
export class Area extends UIFrame {
  constructor(String type, String uiname, Context ctx, Array<float> pos, Array<float> size) {
    super(ctx, undefined, undefined, pos, size);
    
    this.keymap = new KeyMap();
    
    this.auto_load_uidata = true;
    this.uiname = uiname;
    this.type = type;
    
    this.rows = new GArray();
    this.cols = new GArray();
    
    this.note_area = undefined;
    this._saved_uidata = undefined;
    
    var plus = this.plus = new UIButtonIcon(ctx, "Split Screen", Icons.SMALL_PLUS);
    this.plus.callback = function() {
      g_app_state.screen.split_areas();
    }
    
    plus.description = "Split the screen";
    this.add(plus);
    
    /*
    var minus = this.minus = new UIButtonIcon(ctx, "Collapse Screen", Icons.SMALL_MINUS);
    var this2 = this;
    this.minus.callback = function() {
      g_app_state.screen.push_modal(new CollapseAreasTool(this2.parent, this2));
    }
    
    this.add(minus);
    */
  }
  
  pack(canvas, is_vertical) {
    this.plus.size = this.plus.get_min_size(canvas, is_vertical);
    this.plus.small_icon = true;
    this.plus.pos[0] = this.size[0]-this.plus.size[0]-2;
    this.plus.pos[1] = 2;

    //ensure plus sign is at right z stack order
    this.children.remove(this.plus)
    this.children.push(this.plus)

    /*
    this.minus.size = this.minus.get_min_size(canvas, is_vertical);
    this.minus.small_icon = true;
    this.minus.pos[0] = this.size[0]-this.minus.size[0]-2;
    this.minus.pos[1] = this.size[1]-this.minus.size[1]-2;
    
    //ensure minus sign is at right z stack order
    this.children.remove(this.minus)
    this.children.push(this.minus)
    */
    
    //make sure side/top/bottom bars have correct size

    super.pack(canvas, is_vertical);
    
    function bind_size(obj) {
      return; //XXX 
      
      obj._size = obj.size;
      Object.defineProperty(obj, 'size', {
        enumerable   : true,
        configurable : true,
        get : function() {
          console.trace(".size access!", this._size[0], this._size[1]);
          return this._size;
        },
        set : function (val) {
          this._size = val;
        }
      });
    }
    
    var panx = this.velpan != undefined ? this.velpan.pan[0] : 0;
    var pany = this.velpan != undefined ? this.velpan.pan[1] : 0;
    
    var i=0;
    for (var frame of this.rows) {
      frame.state    |= UIFlags.HAS_PAN|UIFlags.USE_PAN|UIFlags.NO_VELOCITY_PAN;
      frame.packflag |= PackFlags.INHERIT_WIDTH|PackFlags.CALC_NEGATIVE_PAN|PackFlags.PAN_X_ONLY;
      
      if (i == 0)
        frame.pos[1] = this.size[1] - Area.get_barhgt() - pany;

      frame.size[0] = frame.get_min_size(this.get_canvas())[0];
        
      i++;
    }
    
    i = 0;
    for (var frame of this.cols) {
      frame.state    |= UIFlags.HAS_PAN|UIFlags.USE_PAN|UIFlags.NO_VELOCITY_PAN;
      frame.packflag |= PackFlags.INHERIT_WIDTH|PackFlags.CALC_NEGATIVE_PAN|PackFlags.PAN_X_ONLY;
      
      if (i != 0)
        frame.pos[0] = this.size[0] - frame.size[0] - panx;

      frame.size[1] = frame.get_min_size(this.get_canvas())[1];
      frame.pos[1] = this.size[1] - frame.size[1] - Area.get_barhgt();
      i++;
    }
    
    super.pack(canvas, is_vertical);
  } 
  
  on_tick() {
    if (this.auto_load_uidata && this._saved_uidata != undefined) {
      this.load_saved_uidata();
      delete this._saved_uidata;
    }

    super.on_tick();
  }
  
  get saved_uidata() : String {
    var paths = new GArray();
    
    function descend(e) {
      var data = e.get_filedata();
      if (data != undefined) {
        if (typeof(data) != "string" && !(data instanceof String)) {
          data = JSON.stringify(data);
        }
        
        paths.push([e.get_uhash(), data]);
      }
      
      if (e instanceof UIFrame) {
        e.on_saved_uidata(descend);
      }
    }
    
    descend(this);
    
    return JSON.stringify(paths);
  }
  
  //not going to use STRUCT.chain_fromSTRUCT for something
  //as important as Area structs, since that function is a 
  //possible source of bugs and type corruption
  load_saved_uidata() {
    var str = this._saved_uidata;
    
    if (str == undefined || str == "") return;
    delete this._saved_uidata; //prevent recurring exceptions
    
    var paths;
    try {
      var paths = JSON.parse(str);
    } catch (_err) {
      print_stack(_err);
      console.log("Error parsing saved uidata");
      console.log("Data: ", str);
    }
    
    var ids = {};
    
    for (var i=0; i<paths.length; i++) {
      try {
        ids[paths[i][0]] = JSON.parse(paths[i][1]);
      } catch (_err) {
        print_stack(_err);
        console.log("Could not parse ui filedata '"+paths[i][1]+"'");
        if (paths[i][0] in ids)
          delete ids[paths[i][0]];
      }
    }
    
    function recurse(e) {
      var id = e.get_uhash();
      if (id in ids) {
        try {
          //console.log("found element", id, ids[id]);
          e.load_filedata(ids[id])
        } catch (_err) {
          print_stack(_err);
          console.log("Warning, could not load filedata for element", e);
          console.log("  data: ", ids[id]);
        }
      }
      
      if (e instanceof UIFrame) {
        e.on_load_uidata(recurse);
      }
    }
    
    recurse(this);
  }
  
  set saved_uidata(String str) : String {
    this._saved_uidata = str;
  }
  
  /*stupidly, we store the "active" area (of each type)
    globally (or rather, they're accessible through the Context
    struct).  this is done to simplify the datapath api code.
    it's a bit stupid.*/
  static context_area(cls) {
    var stack = _get_area_stack(cls.name);
    
    if (stack.length == 0) 
      return _area_active_lasts[cls.name];
    else 
      return stack[stack.length-1];
  }
  push_ctx_active() {
    var stack = _get_area_stack(this.constructor);
    stack.push(this);
    _area_active_lasts[this.constructor.name] = this;
  }
  
  pop_ctx_active() {
    var stack = _get_area_stack(this.constructor);
    if (stack.length == 0 || stack[stack.length-1] != this) {
      console.trace();
      console.log("Warning: invalid Area.pop_active() call");
      return;
    }
    
    stack.pop(stack.length-1);
  }
  
  static default_new(Context ctx, ScreenArea scr, WebGLRenderingContext gl, 
                     Array<float> pos, Array<float> size) {}
  
 
  get_keymaps() {
    return [this.keymap];
  }
  
 //destroy GL data
  destroy() {
    for (var c of this.children) {
      if ("destroy" in c)
        c.destroy(g_app_state.gl);
    }
    
    this.canvas.destroy(g_app_state.gl);
  }
  
  static fromSTRUCT(reader) {
    var ob = {};
    reader(ob);
    
    return ob;
  }

  define_keymap() {
  }
  
  on_gl_lost(WebGLRenderingContext new_gl) {
    for (var c of this.cols) {
      c.on_gl_lost();
    }
    for (var c of this.rows) {
      c.on_gl_lost();
    }

    super.on_gl_lost(new_gl);
  }
  
  on_add(parent)
  {
    for (var c of this.rows) {
      this.remove(c);
    }
    for (var c of this.cols) {
      this.remove(c);
    }
    
    this.rows = new GArray();
    this.cols = new GArray();
    
    this.build_sidebar1();
    this.build_topbar();
    this.build_bottombar();
    
    
    /*
    for (var c of this.rows) {
      if (c.pos[1] > 70)
        c.pos[1] = this.size[1] - Area.get_barhgt();
    }
    
    for (var c of this.cols) {
       c.size[1] = c.get_min_size(this.get_canvas())[1]; //this.size[1]-Area.get_barhgt()*2;
    }*/
  }

  toJSON()
  {
    if (this.pos == undefined) {
      this.pos = [0,0];
    }
    if (this.size == undefined) {
      this.size = [0,0];
    }
    
    return {size : [this.size[0], this.size[1]], pos : [this.pos[0], this.pos[1]], type : this.constructor.name};  
  }

  area_duplicate()
  {
    throw new Error("Error: unimplemented area_duplicate() in editor");
  }
  
  on_resize(Array<int> newsize, Array<int> oldsize)
  {
    if (oldsize == undefined)
      oldsize = this.size;
    
    this.size = newsize;
    
    for (var c of this.children) {
      if (this.canvas != undefined && c.canvas == undefined) 
        c.canvas = this.canvas;
      
      c.on_resize(newsize, oldsize);
    }
  }

  static get_barwid() {
    if (IsMobile) {
      return 152;
    } else {
      return 148;
    }
  }
  
  static get_barhgt() {
    if (IsMobile) {
      return 45;
    } else {
      return 35;
    }
  }
  
  on_keyup(KeyboardEvent event) {
    var ctx = new Context();
    var maps = this.get_keymaps();
    
    for (var i=0; i<maps.length; i++) {
      var ret = maps[i].process_event(ctx, event);
      
      if (ret != undefined) {
        ret.handle(ctx);
        break;
      }
    }
    
    super.on_keyup(event);
  }
  
  on_keydown(Keyboard event) {
    this.shift = event.shiftKey;
    this.alt = event.altKey;
    this.ctrl = event.ctrlKey;

    super.on_keydown(event);
  }

  build_bottombar()
  {
  }

  build_topbar()
  {
  }

  build_sidebar1()
  {
  }

  on_area_inactive()
  {
  }

  on_area_active()
  {
  }
}
Area.STRUCT = """
  Area { 
    pos  : vec2;
    size : vec2;
    type : string;
    saved_uidata : string;
  }
"""

export class ScreenArea extends UIFrame {
  constructor(area, ctx, pos, size, add_area) {
    super(ctx, undefined, undefined, pos, size);
    
    if (add_area == undefined)
      add_area = true;
    
    this.editors = {}
    this.editors[area.constructor.name] = area;
    
    this.area = area;
    area.pos[0] = 0; area.pos[1] = 0;
    
    this.type = undefined;
    
    if (add_area)
      this.add(area);
  }
  
  destroy() {
    for (var k in this.editors) {
      this.editors[k].destroy();
    }
  }
  
  switch_editor(cls) {
    if (!(cls.name in this.editors)) {
      console.log("creating new editor ", cls.name);
      
      var area = cls.default_new(new Context(), this, g_app_state.gl, this.pos, this.size);
      this.editors[cls.name] = area;
      this.editors[cls.name].do_recalc();
    }
    
    var area = this.editors[cls.name];
    
    try {
      this.area.push_ctx_active(); //push
      this.area.on_area_inactive();
      this.area.pop_ctx_active(); //pop
    } catch (_err) {
      print_stack(_err);
      console.log("Error switching editor", this.area);
    }
    
    this.remove(this.area);
    
    area.push_ctx_active(); //push
    
    area.size[0] = this.size[0];
    area.size[1] = this.size[1];
    area.pos[0] = this.pos[0];
    area.pos[1] = this.pos[1];
    
    this.add(area);
    this.area = this.active = area;
    this.area.canvas = this.canvas;
    this.canvas.reset();
    
    this.area.do_full_recalc();
    this.type = cls.name;
    
    area.on_area_active();
    area.on_resize(this.size, new Vector2(area.size));
    area.pop_ctx_active(); //pop 
  }
  
  static fromSTRUCT(reader) {
    var ob = Object.create(ScreenArea.prototype);
    
    reader(ob);
    
    var act = ob.area;
    var editarr = new GArray(ob.editors);
    
    var screens2 = {}
    for (var scr of editarr) {
      if (scr.constructor.name == ob.area) {
        ob.area = scr;
      }
      
      screens2[scr.constructor.name] = scr;
    }
    
    if (!(ob.area instanceof Area))
      ob.area = editarr[0];
    
    ScreenArea.call(ob, ob.area, new Context(), ob.pos, ob.size, false);
    ob.editors = screens2;
    
    return ob;
  }

  data_link(block, getblock, getblock_us) {
    this.ctx = new Context();
    this.area.ctx = new Context();
    this.active = this.area;
    
    for (var k in this.editors) {
      var area = this.editors[k];
      
      area.data_link(block, getblock, getblock_us);
      area.set_context(this.ctx);
    }
    
    this.add(this.area);
  }

  on_add(parent)
  {
    this.active = this.area;
    
    for (var c of this.children) {
      c.on_add(this);
    }
  }

  on_close()
  {
    this.area.on_area_inactive();
  }

  area_duplicate()
  {
    var screens = {}
    
    for (var k in this.editors) {
      var area = this.editors[k];
      screens[k] = area.area_duplicate();
    }
    
    var scr = new ScreenArea(screens[this.area.constructor.name], this.ctx, new Vector2(this.pos), new Vector2(this.size));
    scr.editors = screens;
    
    return scr;
  }
  
  on_tick() {
    this.area.push_ctx_active();
    super.on_tick();
    this.area.pop_ctx_active();
  }
  
  build_draw(canvas, isVertical) {
    this.active = this.area;
    
    g_app_state.size = new Vector2(this.size);
    
    this.area.pos[0] = this.area.pos[1] = 0;
    this.area.size[0] = this.size[0];
    this.area.size[1] = this.size[1];
      
    //console.log("Area:", this.area.constructor.name);
    
    this.area.push_ctx_active();
    this.canvas.push_scissor([2, 2], [this.size[0]-4, this.size[1]-4]);
    
    super.build_draw(canvas, isVertical);
    
    this.canvas.pop_scissor();
    this.area.pop_ctx_active();
    
    var border = [0, 0, 0, 1];
    var border2 = [0.8, 0.8, 0.8, 1];
    var border3 = [0.0, 0.0, 0.0, 1];
    
    canvas.line([0, 1], [this.size[0], 1], border, border);
    canvas.line([0, 1], [this.size[0], 1], border2, border2);
    canvas.line([0, 2], [this.size[0], 2], border3, border3);

    canvas.line([1, 0], [1, this.size[1]], border, border);
    canvas.line([1, 0], [1, this.size[1]], border2, border2);
  }
  
  on_draw(WebGLRenderingContext g)
  {
    return;
    /*
    g_app_state.size = new Vector2(this.size);
    
    this.area.pos[0] = 0; this.area.pos[1] = 0;
    this.area.size[0] = this.size[0];
    this.area.size[1] = this.size[1];
    
    this.canvas.push_scissor([2, 2], [this.size[0]-4, this.size[1]-4]);
    g_app_state.raster.push_viewport(this.abspos, this.size);
    
    this.area.on_draw(g);
    
    g_app_state.raster.pop_viewport();
    this.canvas.pop_scissor();
    
    //super.on_draw(gl);
    */
  }

  add(child, packflag) {
    if (child instanceof Area) {
      if (this.type == undefined) {
        //XXX probably need more boilerplate code than this
        this.type = child.constructor.name;
      }
    }
    
    super.add(child, packflag);
  }
  
  /*on_mousedown(MouseEvent event) {
    this.area._on_mousedown(event);
  }
  
  on_mousemove(MouseEvent event) {
    this.area._on_mousemove(event);
  }
  
  on_mouseup(MouseEvent event) {
    this.area._on_mouseup(event);
  }*/
  
  on_resize(Array<int> newsize, Array<int> oldsize)
  {
    var oldsize = new Vector2(this.area.size);
    
    this.area.pos[0] = 0; this.area.pos[1] = 0;
    this.area.size[0] = this.size[0];
    this.area.size[1] = this.size[1];
    
    this.area.on_resize(this.area.size, oldsize);
    
    for (var c of this.children) {
      if (c != this.area)
        c.on_resize(newsize, oldsize);
    }
  }
}


ScreenArea.STRUCT = """
  ScreenArea {
    pos     : vec2;
    size    : vec2;
    type    : string;
    editors : iter(k, abstract(Area)) | obj.editors[k];
    area    : string | obj.area.constructor.name;
  }
"""
