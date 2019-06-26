"use strict";

//make sure IsMobile is correct, like if DEBUG.force_is_mobile = true
import 'config';

export var BORDER_WIDTH=IsMobile ? 24 : 12;

import {login_dialog} from 'dialogs';

import {
  MinMax, get_rect_lines, get_rect_points, aabb_isect_2d,
  inrect_2d, closest_point_on_line, dist_to_line_v2, 
  aabb_isect_minmax2d
} from 'mathlib';

import {ToolOp, UndoFlags, ToolFlags} from 'toolops_api';
import {STRUCT} from 'struct';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, KeyHandler, 
        charmap, TouchEventManager, EventHandler} from "../editors/events";

import {UICanvas} from 'UICanvas';
import {UIFrame} from 'UIFrame';
import {RowFrame} from 'UIPack';
import {
  PackFlags, UIElement, UIFlags, UIHoverHint, UIHoverBox
} from 'UIElement';

import {ScreenArea, Area} from 'ScreenArea';
import {CollapseAreasTool} from 'FrameManager_ops';

export class _WrapVec {
  constructor(area, edge) {
    this.area = area;
    this.edge = (edge+1)%4;
  }
  
  /*
   v2-->v3
   ^     |
   |     v
   v1<--v4
  */
  get 0() {
    switch (this.edge) {
      case 0: //v1
        return this.area.pos[0];
      case 1: //v2
        return this.area.pos[0];
      case 2: //v3
        return this.area.pos[0]+this.area.size[0];
      case 3: //v4
        return this.area.pos[0]+this.area.size[0];
    }
  }
  
  get 1() {
    switch (this.edge) {
      case 0: //v1
        return this.area.pos[1];
      case 1: //v2
        return this.area.pos[1]+this.area.size[1];
      case 2: //v3
        return this.area.pos[1]+this.area.size[1];
      case 3: //v4
        return this.area.pos[1];
    }
  }
  
  set 0(val) {
    if (isNaN(val)) {
      console.trace("NaN!");
      return;
    }
    
    switch (this.edge) {
      case 0: //v1
        this.area.size[0] = (this.area.pos[0]+this.area.size[0]) - val;
        this.area.pos[0] = val;
        break;
      case 1: //v2
        this.area.size[0] = (this.area.pos[0]+this.area.size[0]) - val;
        this.area.pos[0] = val;
        break;
      case 2: //v3
        this.area.size[0] = val - this.area.pos[0];
        break;
      case 3: //v4 
        this.area.size[0] = val - this.area.pos[0];
        break;
    }
  }
  
  set 1(val) {
    if (isNaN(val)) {
      console.trace("NaN!");
      return;
    }
    
    switch (this.edge) {
      case 0: //v1
        this.area.size[1] = (this.area.pos[1]+this.area.size[1]) - val;
        this.area.pos[1] = val;
        break;
      case 1: //v2
        this.area.size[1] = val - this.area.pos[1];
        break;
      case 2: //v3
        this.area.size[1] = val - this.area.pos[1];
        break;
      case 3: //v4 
        this.area.size[1] = (this.area.pos[1]+this.area.size[1]) - val;
        this.area.pos[1] = val;
        break;
    }
  }
}

export class AreaEdge {
/*
     top  
  left  right
0   bottom    
 
 ^ - >
 |   |
 < - v
*/
  constructor(area, edge) {
    this.edge = edge;
    this.area = area;
    
    this._v1 = new _WrapVec(area, edge);
    this._v2 = new _WrapVec(area, (edge+1)%4);
    
  }
  
  get v1() {
    return this._v1;
  }
  
  get v2() {
    return this._v2;
  }
  
  get length() {
    var dx = this.v1[0]-this.v2[0];
    var dy = this.v1[1]-this.v2[1];
    
    return Math.sqrt(dx*dx + dy*dy);
  }
  
  get min() {
    return [Math.min(this.v1[0], this.v2[0]), Math.min(this.v1[1], this.v2[1])];
  }
  
  get max() {
    return [Math.max(this.v1[0], this.v2[0]), Math.max(this.v1[1], this.v2[1])];
  }
  
  set v1(val) {
    this._v1[0] = val[0];
    this._v1[1] = val[1];
  }
  
  set v2(val) {
    this._v2[0] = val[0];
    this._v2[1] = val[1];
  }
  
  /*
  _get(edge) {
    switch (edge) {
      case 0: //top
        return [this.area.pos[0], this.area.pos[1]+this.area.size[1]];
      case 1: //left
        return [this.area.pos[0], this.area.pos[1]];
      case 2: //bottom
        return [this.area.pos[0]+this.area.size[0], this.area.pos[1]];
      case 3: //right 
        return [this.area.pos[0]+this.area.size[0], this.area.pos[1]+this.area.size[1]];
    }
  }
  
  _set(edge, val) {
    switch (edge) {
      case 0: //top
        this.area.pos[0] = val[0];
        this.area.pos[1] = val[1]-this.area.size[1];
      case 1: //left
        this.area.pos[0] = val[0];
        this.area.pos[1] = val[1];
      case 2: //bottom
        this.area.pos[0] = val[0]-this.area.size[0];
        this.area.pos[1] = val[1];
      case 3: //right 
        this.area.pos[0] = val[0]-this.area.size[0];
        this.area.pos[1] = val[1]-this.area.size[1];
    }
  }*/
}

var _screenborder_id_gen = 1;
export class ScreenBorder extends UIElement {
  constructor(area, borderindex) {
    super();
    this.area = area;
    this.canvas = undefined;
    this.start_mpos = [0, 0];
    this.moving = false;
    this.bindex = borderindex;
    
    this.moving_line = [new Vector2(), new Vector2()]
    this.start_moving_line = [new Vector2(), new Vector2()]
    
    this.state |= UIFlags.INVISIBLE;
    
    this._id = _screenborder_id_gen++;
    this.edge = new AreaEdge(area, borderindex);
  }

  [Symbol.keystr]() {
    return this.constructor.name + "|" + this._id;
  }

  movable_border() : Boolean {
    var count = 0;
    for (var c of this.parent.children) {
      if (!(c instanceof ScreenArea))
        continue;
      
      if (aabb_isect_2d(this.pos, this.size, c.pos, c.size))
        count++;
    }
    
    return count > 1;
  }
  
  [Symbol.keystr]() {
    return this.constructor.name + "|" + this._id;
  }

  movable_border() : Boolean {
    var count = 0;
    for (var c of this.parent.children) {
      if (!(c instanceof ScreenArea))
        continue;
      
      if (aabb_isect_2d(this.pos, this.size, c.pos, c.size))
        count++;
    }
    
    return count > 1;
  }

  _get_edge() {
    var v1 = new Vector2(this.pos);
    var v2 = new Vector2(this.pos);
    
    if (this.size[0] > this.size[1]) {
      v2[0] += this.size[0];
      
      //v1[1] += Math.floor(BORDER_WIDTH/2.0);
      //v2[1] += Math.floor(BORDER_WIDTH/2.0);
    } else {
      v2[1] += this.size[1];
      
      //v1[0] += Math.floor(BORDER_WIDTH/2.0);
      //v2[0] += Math.floor(BORDER_WIDTH/2.0);
    }
    
    return [v1, v2];
  }

  hash_edge(v1, v2) {
    var a1 = [Math.floor(v1[0]), Math.floor(v2[0])]
    var a2 = [Math.floor(v1[1]), Math.floor(v2[1])]
    a1.sort()
    a2.sort();
    
    return ""+a1[0]+"|"+a1[1]+"|"+a2[0]+"|"+a2[1];
  }

  hash_vert(v1) {
    return ""+Math.floor((v1[0]+0.5)/2.0)+"|"+Math.floor((v1[1]+0.5)/2.0)
  }

  build_mesh() {
    this.borders = new GArray();
    var i = 0;
    for (var c of this.parent.children) {
      if (c instanceof ScreenBorder) {
        c.ci = i++;
        this.borders.push(c);
      }
    }
    
    var edges = {};
    var verts = {};
    var vert_edges = {};
    for (var b of this.borders) {
      var ret = b.get_edge();
      
      var v1 = ret[0];
      var v2 = ret[1];
      
      var h = this.hash_edge(v1, v2);
      
      if (!(h in edges)) {
        edges[h] = new GArray();
      }
      
      var hv1 = this.hash_vert(v1);
      var hv2 = this.hash_vert(v2);
      
      if (!(hv1 in verts))
        verts[hv1] = new set();
      if (!(hv2 in verts))
        verts[hv2] = new set();
      if (!(hv1 in vert_edges))
        vert_edges[hv1] = new set();
      if (!(hv2 in vert_edges))
        vert_edges[hv2] = new set();
      
      edges[h].push(b);
      
      verts[hv1].add(b);
      verts[hv2].add(b);
      
      vert_edges[hv1].add(h);
      vert_edges[hv2].add(h);
      
      b.v1 = v1;
      b.v2 = v2;
    }
    
    return [verts, edges, vert_edges];
  }

  get_edge() {
    return [new Vector2(this.edge.v1), new Vector2(this.edge.v2)]
  }

  at_screen_border(event) {
    var ret = true;
    
    //move members into local variables, to save on column space
    var size = this.size, pos=this.pos, parent=this.parent;
    
    for (var i=0; i<2; i++) {
      var ret2 = Math.abs(pos[i]) < BORDER_WIDTH*1.1;
      ret2 = ret2 || Math.abs(pos[i]+size[i] - parent.size[i]) < BORDER_WIDTH*1.1;
      
      ret = ret2 & ret;
    }
    
    return ret;
  }
    
  on_mousedown(event) {
    if (event.button == 0 
      && !this.moving 
      && !this.at_screen_border(event)) 
    {
      this.start(event);
    }
  }

  border_menu(event) {
    console.log("border menu")
    
    var this2 = this;
    function menucb(entry, id) {
      if (id == "collapse") {
        this.parent.push_modal(new CollapseAreasTool(this2.parent, this2));
      }
    }
    
    var menu = new UIMenu("", menucb);
    menu.add_item("Collapse", "", "collapse");
    menu.ignore_next_mouseup_event = 0;
    
    ui_call_menu(menu, this.parent, [event.x+this.pos[0], event.y+this.pos[1]]);
  }

  start(event) {
    this.start_mpos = new Vector2([event.x, event.y])
    this.areas = [];
    
    this.canvas.push_layer();
    
    this.areas.push([this.edge, new Vector2(this.edge.v1), new Vector2(this.edge.v2), this.area]);
    
    //find longest contiguous border line
    var minmax = new MinMax(2);
    minmax.minmax(this.edge.v1, this.edge.v2);
    
    var areas = new set();
    
    var stop = false;
    var c = 0;
    while (!stop) {
      //console.log("iteration", c++);
      stop = true;
      
      for (var area of this.parent.children) {
        if (!(area instanceof ScreenArea))
          continue;
        if (area === this.area)
          continue;
        
        for (var i=0; i<2; i++) {
          var e2 = new AreaEdge(area, (this.bindex+i*2)%4);
          
          var margin = 9;
          var isect = aabb_isect_minmax2d(minmax.min, minmax.max, e2.min, e2.max, margin);
          
          if (isect && !areas.has(area)) {
            areas.add(area);
            this.areas.push([e2, new Vector2(e2.v1), new Vector2(e2.v2), area, new Vector2(area.size)]);
            
            minmax.minmax(e2.min);
            minmax.minmax(e2.max);
            stop = false;
          }
        }
      }
    }
    
    this.start_moving_line[0].load(minmax.min);
    this.start_moving_line[1].load(minmax.max);

    this.moving_line[0].load(this.start_moving_line[0]);
    this.moving_line[1].load(this.start_moving_line[1]);
    
    this.parent.push_modal(this);
    this.moving = true;    
  }

  on_mouseup(event) {
    if (this.moving) {
      this.finish();
    } else {
      if (event.button == 2) {
        this.border_menu(event);
      }
    }
  }

  find_bindex(pair) {
    var area = pair[0];
    var bs = this.parent.child_borders.get(area);
    
    if (area != this.area)
      return pair[1];
    else
      return this.bindex;
  }

  do_resize(delta) {
    if (isNaN(delta)) {
      console.trace("EEK! NaN in frame resize!\n", delta);
      return;
    }
    
    var axis = (this.bindex+1) % 2;
    
    for (var ed of this.areas) {
      ed[0].v1[axis] = ed[1][axis] + delta;
      
      ed[3].on_resize(ed[3].size, ed[4]);
      ed[3].do_full_recalc();
    }
  
    this.parent.snap_areas();
    window.redraw_viewport();
  }
  
  on_mousemove(event) {
    if (!this.moving)
      return;

    //console.log("BORDERINDEX", this.bindex);
    
    var mpos = new Vector2([event.x, event.y]);
    var start = new Vector2(this.start_mpos);
    var axis = (this.bindex+1) % 2;
    var delta = mpos[axis] - start[axis];
    
    this.moving_line[0].load(this.start_moving_line[0]);
    this.moving_line[1].load(this.start_moving_line[1]);
    
    this.moving_line[0][axis] += delta;
    this.moving_line[1][axis] += delta;
    
    this.delta = delta;
    
    static black = [0, 0, 0, 1];
    
    var x = this.moving_line[0][0], y = this.moving_line[0][1];
    var sx = this.moving_line[1][0], sy = this.moving_line[1][1];
    
    if (sx-x > sy-y) {
      y = sy = (y+sy)*0.5
    } else {
      x = sx = (x+sx)*0.5;
    }
    
    this.canvas.clear();
    this.canvas.line([x, y], [sx, sy], black, black);
  }
  
  finish() {
    if (this.moving) {
      this.canvas.pop_layer();
      this.parent.pop_modal();
      this.do_resize(this.delta);
    }
    
    this.parent.recalc_all_borders();
    this.parent.do_full_recalc();
    this.moving = false;
  }

  on_keydown(event) {
    if (this.moving) {
      if (event.keyCode == charmap["Escape"])
        this.finish();
      
      if (event.keyCode == charmap["Enter"])
        this.finish();
    }
  }

  on_active() {
    //console.log("border active")
    
    if (!this.movable_border())
      return;
      
    var cursor;
    if (this.size[0] > this.size[1]) {
      cursor = "n-resize"
    } else {
      cursor = "w-resize"
    }
    
    document.getElementById("canvas2d").style.cursor = cursor;
    document.getElementById("canvas2d_work").style.cursor = cursor;
  }

  on_inactive() {
    //console.log("border inactive")
    document.getElementById("canvas2d").style.cursor = "default";
    document.getElementById("canvas2d_work").style.cursor = "default";
  }

  build_draw(UICanvas canvas, Boolean isVertical)
  {
    static black = [0, 0, 0, 1];
      
    var sx = this.edge.max[0]-this.edge.min[0];
    var sy = this.edge.max[1]-this.edge.min[1];
    
    if (this.moving)
      canvas.line(this.moving_line[0], this.moving_line[1], black, black);
  }
}
