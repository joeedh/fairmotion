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

import {UICanvas} from 'UICanvas2D';
import {UIFrame} from 'UIFrame';
import {RowFrame} from 'UIPack';
import {
  PackFlags, UIElement, UIFlags, UIHoverHint, UIHoverBox
} from 'UIElement';

import {ScreenArea, Area} from 'ScreenArea';

export class SplitAreasTool extends ToolOp {
  constructor(screen) {
    ToolOp.call(this, "area_split_tool", "Split Screen", "Split a screen editor");

    this.screen = screen;
    this.canvas = screen.canvas;
    
    this.is_modal = true;
    this.undoflag = UndoFlags.IGNORE_UNDO;
    
    this.mpos = [0, 0];
    this.split = undefined : Array<Object>;
    this.lines = undefined : Array1<Array2<float>>;
    
    this.inputs = {};
    this.outputs = {};
    
    this.canvas.push_layer();
  }
    
  on_mousemove(event)
  {
    this.mpos = new Vector2([event.x, event.y])
    this.canvas.reset()
    
    var p = this.modal_ctx.view2d;
    while (p != undefined) {
      this.mpos.add(p.pos);
      p = p.parent;
    }
    
    var mpos = this.mpos;
    var active = undefined;
    for (var c of this.screen.children) {
      if (!(c instanceof ScreenArea))
        continue;
      
      if (inrect_2d(mpos, c.pos, c.size)) {
        active = c;
        break;
      }
    }
    
    if (active == undefined)
      return;
    
    var canvas = this.canvas;
    var clr = [0.1, 0.1, 0.1, 1.0];
    var rad = 15;

    var lines = [
      [c.pos, [c.pos[0], c.pos[1]+c.size[1]]],
      [c.pos, [c.pos[0]+c.size[0], c.pos[1]]],
      [[c.pos[0]+c.size[0], c.pos[1]], 
       [c.pos[0]+c.size[0], c.pos[1]+c.size[1]]],
      [[c.pos[0], c.pos[1]+c.size[1]], 
       [c.pos[0]+c.size[0], c.pos[1]+c.size[1]]]
    ];
    
    var line = undefined;
    var ldis = 0.0;
    
    for (var i=0; i<4; i++) {
      lines[i][0] = new Vector2(lines[i][0])
      lines[i][1] = new Vector2(lines[i][1])
      
      canvas.line(lines[i][0], lines[i][1], clr, clr, rad)
      
      var dis = dist_to_line_v2(mpos, lines[i][0], lines[i][1]);
      if (line == undefined || dis < ldis) {
        ldis = dis;
        line = i;
      }
    }
    
    canvas.clear();
    
    if (line == undefined)
      return;
      
    var v1 = lines[line][0]
    var v2 = lines[line][1]
    var v3 = lines[(line+2)%4][0]
    var v4 = lines[(line+2)%4][1]
    
    var ret = closest_point_on_line(mpos, v1, v2);
    var p1 = ret[0]
    var t = ret[1]/v2.vectorDistance(v1);
    
    if (isNaN(t))
      t = 0;
    
    var p2 = new Vector2(v4).sub(v3).mulScalar(t).add(v3)
    
    canvas.line(p1, p2, clr, clr, 4.0);
    
    this.lines = lines;
    this.split = [active, line, (line+2)%4, t]
  }

  finish(event)
  {
    if (this.split == undefined) {
      this.cleanup();
      return;
    }
    
    var area = this.split[0];
    var i = this.split[1]
    var t = this.split[3]
    
    var oldsize = [area.size[0], area.size[1]];
    
    var area2 = area.area_duplicate();
    if (i == 0 || i == 2) {
      //horizontal
      area2.size[0] = area.size[0];
      
      area2.size[1] = area.size[1]*(1.0 - t);
      area.size[1] *= t;
      
      area2.pos[0] = area.pos[0];
      area2.pos[1] = area.pos[1]+area.size[1];
    } else {
      area2.size[1] = area.size[1];
      
      area2.size[0] = area.size[0]*(1.0 - t);
      area.size[0] *= t;
      
      area2.pos[1] = area.pos[1];
      area2.pos[0] = area.pos[0]+area.size[0];
    }
    
    this.screen.add(area2);
    
    area.on_resize(area.size, oldsize);
    area2.on_resize(area2.size, oldsize);
    this.cleanup();
    
    this.screen.recalc_all_borders();
    this.screen.snap_areas();
  }

  cancel(event)
  {
    this.cleanup();
  }

  cleanup(event)
  {
    this.end_modal();
    this.canvas.pop_layer();
  }

  on_mouseup(event)
  {
    if (event.button == 0)
      this.finish(); 
    else if (event.button == 2)
      this.cancel();
  }
  on_keydown(event)
  {
    if (event.keyCode == charmap["Escape"])
      this.cancel();  
    if (event.keyCode == charmap["Enter"])
      this.finish();   
  }
}

export class CollapseAreasTool extends EventHandler {
  constructor(screen, border) {
    EventHandler.call(this);
    this.border = border;
    this.screen = screen;
    this.canvas = screen.canvas;
    
    this.mpos = [0, 0];
    this.active = undefined : ScreenArea;
    
    this.mesh = border.build_mesh();
    this.areas = this.mesh[1][border.hash_edge(border.v1, border.v2)];
    
    for (var i=0; i<this.areas.length; i++) {
      this.areas[i] = this.areas[i].area;
    }
    
    this.canvas.push_layer();
  }
  
  on_mousemove(event)
  {
    this.mpos = new Vector2([event.x, event.y])
    this.canvas.reset()
    
    var mpos = this.mpos;
    var active = undefined;
    for (var c of this.areas) {
      if (inrect_2d(mpos, c.pos, c.size)) {
        active = c;
        break;
      }
    }
    
    if (active == undefined)
      return;
    
    this.active = active;
    
    var canvas = this.canvas;
    var clr1 = [0.1, 0.1, 0.1, 0.1];
    var clr2 = [0.1, 0.1, 0.1, 1.0];
    var rad = 15;

    var ps = get_rect_points(new Vector2(active.pos), active.size);
    
    canvas.clear();
    canvas.quad(ps[0], ps[1], ps[2], ps[3], clr1, clr1, clr1, clr1);
    canvas.line(ps[0], ps[2], clr2, undefined, 6.0);
    canvas.line(ps[1], ps[3], clr2, undefined, 6.0);
  }

  finish(event)
  {
    this.cleanup();
    
    if (this.active == undefined)
      return;
    
    var keep = undefined;
    for (var area of this.areas) {
      if (area != this.active) {
        keep = area;
        break;
      }
    }
    
    if (keep == undefined) {
      console.log("eek! error in CollapseAreasTool.finish!")
      return;
    }
    
    var mm = new MinMax(2);
    
    var ps1 = get_rect_points(this.active.pos, this.active.size);
    for (var i=0; i<4; i++) {
      mm.minmax(ps1[i]);
    }
    
    var ps2 = get_rect_points(keep.pos, keep.size);
    for (var i=0; i<4; i++) {
      mm.minmax(ps2[i]);
    }
    
    mm.minmax(this.active.pos);  
    
    this.active.on_close();
    this.screen.remove(this.active);
    var oldsize = new Vector2(keep.size);
    
    keep.pos[0] = mm.min[0];
    keep.pos[1] = mm.min[1];
    keep.size[0] = mm.max[0] - mm.min[0];
    keep.size[1] = mm.max[1] - mm.min[1];
    
    for (var i=0; i<2; i++) {
      keep.size[i] = Math.ceil(keep.size[i]);
      keep.pos[i] = Math.floor(keep.pos[i]);
    }
    
    keep.on_resize(keep.size, oldsize);
    keep.do_recalc();
    
    this.screen.recalc_all_borders();
    this.screen.snap_areas();
    this.canvas.reset();
  }

  cancel(event)
  {
    this.cleanup();
  }

  cleanup(event)
  {
    this.canvas.pop_layer();
    this.screen.pop_modal();
  }

  on_mouseup(event)
  {
    if (event.button == 0)
      this.finish(); 
    else if (event.button == 2)
      this.cancel();
  }
  on_keydown(event)
  {
    if (event.keyCode == charmap["Escape"])
      this.cancel();  
    if (event.keyCode == charmap["Enter"])
      this.finish();   
  }
}

export class HintPickerOpElement extends UIElement {
  constructor(ctx, HintPickerOp op) {
    UIElement.call(this, ctx);
    this.op = op;
  }
  
  build_draw(UICanvas canvas, Boolean isVertical) {
    this.op.canvas = canvas;
    
    this.op.build_draw();
  }
}

export class HintPickerOp extends ToolOp {
  constructor() {
    ToolOp.call(this);
    
    this.canvas = g_app_state.screen.canvas;
    
    this.mup_count = 0; //we count the number of mouseups to implement touch tablet mode
    this.active = undefined;
    this.hintbox = undefined;
    this.last_mpos = new Vector2([0, 0]);
  }
  
  static tooldef() {return {
    uiname   : "Hint Picker",
    apiname  : "screen.hint_picker",
    undoflag : UndoFlags.IGNORE_UNDO,
    is_modal : true,
    inputs   : {},
    outputs  : {},
    description : "Helper to show tooltips on tablets",
    icon     : Icons.HELP_PICKER
  }}
  
  can_call(Context ctx) {
    return true; //g_app_state.modalhandler == undefined;
  }
  
  find_element(MouseEvent event, Array<float> mpos) {
    function descend(e, mpos) {
      if (e instanceof UIHoverHint) {
        return e;
      } else if (!(e instanceof UIFrame)) {
        return undefined;
      }
      
      mpos = [mpos[0]-e.pos[0], mpos[1]-e.pos[1]];
      for (var c of e.children) {
        if (inrect_2d(mpos, c.pos, c.size))
          return descend(c, mpos);
      }
    }
    
    var ret;
    for (var c of g_app_state.screen.children) {
      if (!(c instanceof ScreenArea)) continue;
      if (!inrect_2d(mpos, c.pos, c.size)) continue;
      
      ret = descend(c, mpos);
      if (ret != undefined)
        break;
    }
    
    this.active = ret;
    
    return ret;
  }
  
  on_mousemove(MouseEvent event) {
    this.canvas = g_app_state.screen.canvas;
    
    var ctx = this.modal_ctx;
    var mpos = [event.x, event.y];
    
    var old = this.active;
    this.find_element(event, mpos);
    
    if (old != this.active && this.active != undefined) {
      if (this.hintbox != undefined) {
        this.hintbox.parent.remove(this.hintbox);
        this.hintbox.parent.do_recalc();
      }
      
      this.helper.do_recalc();
      this.hintbox = this.active.on_hint(false);
      
      console.log("active change");
    } else if (old != this.active && this.active == undefined) {
      this.helper.do_recalc();
    }

    //console.log("active: ", this.active);
    //g_app_state.build_draw(this.canvas, false);
  }
  
  start_modal(Context ctx) {
    console.log("helper tool");
    var helper = new HintPickerOpElement(ctx, this);
    
    g_app_state.screen.add(helper);
    this.helper = helper;
  }
  
  finish() {
    this.canvas.reset();
    this.end_modal();
    
    g_app_state.screen.remove(this.helper);
    
    if (this.hintbox != undefined) {
      this.hintbox.parent.remove(this.hintbox);
      this.hintbox.parent.do_recalc();
    }
  }
  
  on_mousedown(MouseEvent event) {
    this.on_mousemove(event);
  }
  
  on_mouseup(MouseEvent event) {
    console.log("was_touch", this.active, (this.active && g_app_state.was_touch && this.mup_count < 1));
    
    if (g_app_state.was_touch && this.active != undefined) {
      return;
    }
    
    this.finish();
  }
  
  on_keyup(KeyboardEvent event) {
    if (event.keyCode == 27) { //escape key
      this.canvas.reset();
      this.finish();
    }
  }
  
  build_draw() {
    //console.log("rebuilding draw...");
    
    //this.canvas.reset();
    var clr = [0, 0, 0, 0.35];
    
    if (this.active == undefined) {
      //this.canvas.simple_box([0, 0], g_app_state.screen.size, clr);
    } else {
      var pos = this.active.get_abs_pos();
      //this.canvas.passpart(pos, this.active.size, clr);
    }
  }
}
