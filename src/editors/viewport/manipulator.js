"use strict";

/*
  manipulator widget system, not just for grab, rotate, scale,
  but also extrude, inset, etc.
*/

import {dist_to_line_v2} from '../../util/mathlib.js';
import * as config from '../../config/config.js';

export let ManipFlags = {};

export let HandleShapes = {
  ARROW        : 0,
  HAMMER       : 1,
  ROTCIRCLE    : 2,
  SIMPLE_CIRCLE: 3,
  OUTLINE      : 4
};

export let HandleColors = {
  DEFAULT  : [0, 0, 0, 1],
  HIGHLIGHT: [0.4, 0.4, 0.4, 1],
  SELECT   : [1.0, 0.7, 0.3, 1]
};

var _mh_idgen = 1;

export class HandleBase {
  on_click(e, view2d, id) {

  }

  on_active() {
    this.color = HandleColors.HIGHLIGHT;
    this.update();
  }

  on_inactive() {
    this.color = HandleColors.DEFAULT;
    this.update();
  }

  distanceTo(p) {
    throw new Error("unimplemented distanceTo");
  }

  update() {
    throw new Error("unimplemented update");
  }

  [Symbol.keystr]() {
    throw new Error("unimplemented keystr");
  }

  get_render_rects(ctx, canvas, g) {
    throw new Error("unimplemented get_render_rects");
  }


  render(canvas, g) {
    throw new Error("unimplemented render");
  }

}

HandleBase;

export class ManipHandle extends HandleBase {
  transparent: boolean
  linewidth: number
  _min: Vector2
  _max: Vector2;

  constructor(v1: Vector3, v2: Vector3, id: Object, shape: int, view2d: View2DHandler, clr: Array<float>) {
    super();

    this.id = id;
    this._hid = _mh_idgen++;
    this.shape = shape;
    this.v1 = v1;
    this.v2 = v2;
    this.transparent = false; //are we transparent to events?
    this.color = clr === undefined ? [0, 0, 0, 1] : clr.slice(0, clr.length);
    this.parent = undefined;
    this.linewidth = 1.5;

    if (this.color.length === 3)
      this.color.push(1.0);

    this._min = new Vector2(v1);
    this._max = new Vector2(v2);
    this._redraw_pad = this.linewidth;
  }

  on_click(e, view2d, id) {

  }

  on_active() {
    this.color = HandleColors.HIGHLIGHT;
    this.update();
  }

  on_inactive() {
    this.color = HandleColors.DEFAULT;
    this.update();
  }

  distanceTo(p) {
    return dist_to_line_v2(p, this.v1, this.v2);
  }

  update_aabb() {
    //redraw old position from last draw
    this._min[0] = this.v1[0] + this.parent.co[0];
    this._min[1] = this.v1[1] + this.parent.co[1];

    this._max[0] = this.v2[0] + this.parent.co[0];
    this._max[1] = this.v2[1] + this.parent.co[1];

    let minx = Math.min(this._min[0], this._max[0]);
    let miny = Math.min(this._min[1], this._max[1]);
    let maxx = Math.max(this._min[0], this._max[0]);
    let maxy = Math.max(this._min[1], this._max[1]);

    this._min[0] = minx;
    this._min[1] = miny;
    this._max[0] = maxx;
    this._max[1] = maxy;
  }

  update() {
    let p = this._redraw_pad;

    static
    min = new Vector2(), max = new Vector2();

    min[0] = this._min[0] - p;
    min[1] = this._min[1] - p;
    max[0] = this._max[0] + p;
    max[1] = this._max[1] + p;

    window.redraw_viewport(min, max);

    this.update_aabb();

    min[0] = this._min[0] - p;
    min[1] = this._min[1] - p;
    max[0] = this._max[0] + p;
    max[1] = this._max[1] + p;

    //draw new position
    window.redraw_viewport(min, max);
  }

  [Symbol.keystr]() {
    return "MH" + this._hid.toString;
  }

  get_render_rects(ctx, canvas, g) {
    let p = this._redraw_pad;

    this.update_aabb();

    let xmin = this._min[0], ymin = this._min[1], xmax = this._max[0], ymax = this._max[1];
    return [[xmin - p, ymin - p, xmax - xmin + 2*p, ymax - ymin + 2*p]]
  }


  render(canvas, g) {
    let c = this.color;
    let style = "rgba(" + (~~(c[0]*255)) + "," + (~~(c[1]*255)) + "," + (~~(c[2]*255)) + "," + c[3] + ")";

    g.strokeStyle = g.fillStyle = style;
    g.lineWidth = this.linewidth;
    //g.strokeStyle = g.fillStyle = "teal";

    if (this.shape === HandleShapes.ARROW) {
      g.beginPath();
      let dx = this.v2[0] - this.v1[0], dy = this.v2[1] - this.v1[1];
      let dx2 = this.v1[1] - this.v2[1], dy2 = this.v2[0] - this.v1[0];

      let l = Math.sqrt(dx2*dx2 + dy2*dy2);
      if (l === 0.0) {
        g.beginPath();
        g.rect(this.v1[0] - 5, this.v1[1] - 5, 10, 10);
        g.fill();

        return;
      }

      dx2 *= 1.5/l;
      dy2 *= 1.5/l;

      dx *= 0.65;
      dy *= 0.65;

      let w = 3;
      let v1 = this.v1, v2 = this.v2;

      g.moveTo(v1[0] - dx2, v1[1] - dy2);
      g.lineTo(v1[0] + dx - dx2, v1[1] + dy - dy2);
      g.lineTo(v1[0] + dx - dx2*w, v1[1] + dy - dy2*w);
      g.lineTo(v2[0], v2[1]);
      g.lineTo(v1[0] + dx + dx2*w, v1[1] + dy + dy2*w);
      g.lineTo(v1[0] + dx + dx2, v1[1] + dy + dy2);
      g.lineTo(v1[0] + dx2, v1[1] + dy2);
      g.closePath();

      g.fill();
    } else if (this.shape === HandleShapes.OUTLINE) {
      g.beginPath();
      g.moveTo(this.v1[0], this.v1[1]);
      g.lineTo(this.v1[0], this.v2[1]);
      g.lineTo(this.v2[0], this.v2[1]);
      g.lineTo(this.v2[0], this.v1[1]);
      g.closePath();
      g.stroke();
    } else {
      g.beginPath();
      g.moveTo(this.v1[0], this.v1[1]);
      g.lineTo(this.v2[0], this.v2[1]);
      g.stroke();
    }
  }
}

export class ManipCircle extends HandleBase {
  p: Vector2
  transparent: boolean
  linewidth: number
  _min: Vector2
  _max: Vector2;

  constructor(p: Vector2, r: Number, id: Object, view2d: View2DHandler, clr: Array<float>) {
    super();

    this.id = id;
    this._hid = _mh_idgen++;
    this.p = new Vector2(p);
    this.r = r;
    this.transparent = false; //are we transparent to events?
    this.color = clr === undefined ? [0, 0, 0, 1] : clr.slice(0, clr.length);
    this.parent = undefined;
    this.linewidth = 1.5;

    if (this.color.length === 3)
      this.color.push(1.0);

    this._min = new Vector2();
    this._max = new Vector2();
    this._redraw_pad = this.linewidth;
  }

  on_click(e, view2d, id) {

  }

  on_active() {
    this.color = HandleColors.HIGHLIGHT;
    this.update();
  }

  on_inactive() {
    this.color = HandleColors.DEFAULT;
    this.update();
  }

  distanceTo(p) {
    let dx = this.p[0] - p[0];
    let dy = this.p[1] - p[1];
    let dis = dx*dx + dy*dy;

    dis = dis !== 0.0 ? Math.sqrt(dis) : 0.0;

    return Math.abs(dis - this.r);
  }

  update_aabb() {
    this._min[0] = this.parent.co[0] + this.p[0] - Math.sqrt(2)*this.r;
    this._min[1] = this.parent.co[1] + this.p[1] - Math.sqrt(2)*this.r;

    this._max[0] = this.parent.co[0] + this.p[0] + Math.sqrt(2)*this.r;
    this._max[1] = this.parent.co[1] + this.p[1] + Math.sqrt(2)*this.r;
  }

  update() {
    let p = this._redraw_pad;

    static
    min = new Vector2(), max = new Vector2();

    min[0] = this._min[0] - p;
    min[1] = this._min[1] - p;
    max[0] = this._max[0] + p;
    max[1] = this._max[1] + p;

    window.redraw_viewport(min, max);

    this.update_aabb();

    min[0] = this._min[0] - p;
    min[1] = this._min[1] - p;
    max[0] = this._max[0] + p;
    max[1] = this._max[1] + p;

    //draw new position
    window.redraw_viewport(min, max);
  }

  [Symbol.keystr]() {
    return "MC" + this._hid.toString;
  }

  get_render_rects(ctx, canvas, g) {
    let p = this._redraw_pad;

    this.update_aabb();

    let xmin = this._min[0], ymin = this._min[1], xmax = this._max[0], ymax = this._max[1];
    return [[xmin - p, ymin - p, xmax - xmin + 2*p, ymax - ymin + 2*p]]
  }


  render(canvas, g) {
    let c = this.color;
    let style = "rgba(" + (~~(c[0]*255)) + "," + (~~(c[1]*255)) + "," + (~~(c[2]*255)) + "," + c[3] + ")";

    g.strokeStyle = g.fillStyle = style;
    g.lineWidth = this.linewidth;
    //g.strokeStyle = g.fillStyle = "teal";

    g.beginPath();
    g.arc(this.p[0], this.p[1], this.r, -Math.PI, Math.PI);
    g.closePath();
    g.stroke();

  }
}

//okay.  should modal tool ops drive the manipulator positions, or should
//the manipulator code drive modal tool ops? yeesh.  I think maybe the former
//is the way to go.

var _mh_idgen_2 = 1;
var _mp_first = true;

export class Manipulator {
  recalc: number
  handle_size: number
  co: Vector3
  hidden: boolean;
  dead: boolean;

  constructor(handles: Array<Array<ManipHandle>>, ctx : FullContext) {
    this._hid = _mh_idgen_2++;
    this.handles = handles.slice(0, handles.length); //copy handles
    this.recalc = 1;
    this.parent = undefined;
    this.user_data = undefined;
    this.dead = false;

    this.ctx = ctx;

    for (let h of this.handles) {
      h.parent = this;
    }

    /*callback is called on mouse down.  presumably.
      manipulator is passed to callback.
     */
    this.handle_size = 65;
    this.co = new Vector3();
    this.hidden = false;
  }

  static nodedef() {
    return {
      name : "manipulator",
      uiName : "Manipulator",
      inputs : {
        depend : undefined
      },
      outputs : {
        depend : undefined
      }
    }
  }

  dag_exec(ctx, inputs, outputs, graph) {
    if (this.dead || this.hidden) {
      the_global_dag.remove(this);
      return;
    }

    this.on_tick(ctx);
  }

  checkDagLink(ctx) {
    if (!window.the_global_dag.has(this)) {
      console.warn("MAKING DAG CONNECTION", this);

      this._node = window.the_global_dag.direct_node(ctx, this, true);
      window.the_global_dag.link(ctx.view2d, "onDrawPre", this, "depend");
    }
  }

  hide() {
    console.warn("hide!");
    the_global_dag.remove(this);

    if (!this.hidden) {
      this.update();
    }

    this.hidden = true;
  }

  unhide() {
    this.checkDagLink(this.ctx);

    if (this.hidden) {
      this.hidden = false;
      this.update();
    } else {
      this.hidden = false;
    }
  }

  update() {
    if (this.hidden)
      return;

    for (let h of this.handles) {
      h.update();
    }
  }

  on_tick(ctx) {
    this.checkDagLink(ctx);
  }

  [Symbol.keystr]() {
    return "MP" + this._hid.toString;
  }

  end() {
    this.dead = true;
    this.parent.remove(this);
  }

  get_render_rects(ctx, canvas, g) {
    let rects = [];

    if (this.hidden) {
      return rects;
    }

    for (let h of this.handles) {
      let rs = h.get_render_rects(ctx, canvas, g);

      for (let i = 0; i < rs.length; i++) {
        rs[i] = rs[i].slice(0, rs[i].length); //make copy
        rs[i][0] += this.co[0];
        rs[i][1] += this.co[1];
      }

      rects = rects.concat(rs);
    }

    return rects;
  }

  render(canvas, g) {
    if (this.hidden) {
      return;
    }

    for (let h of this.handles) {
      let x = this.co[0], y = this.co[1];

      g.translate(x, y);
      h.render(canvas, g);
      g.translate(-x, -y);
    }
  }

  outline(min, max, id, clr = [0, 0, 0, 1.0]) {
    min = new Vector2(min);
    max = new Vector2(max);

    let h = new ManipHandle(min, max, id, HandleShapes.OUTLINE, this.view3d, clr);

    h.transparent = true;
    h.parent = this;

    this.handles.push(h);
    return h;
  }

  //make an arror in relative coordinates to this.co
  arrow(v1, v2, id, clr = [0, 0, 0, 1.0]) {
    v1 = new Vector2(v1);
    v2 = new Vector2(v2);

    let h = new ManipHandle(v1, v2, id, HandleShapes.ARROW, this.view3d, clr);
    h.parent = this;

    this.handles.push(h);
    return h;
  }

  circle(p, r, id, clr = [0, 0, 0, 1.0]) {
    let h = new ManipCircle(new Vector2(p), r, id, this.view3d, clr);

    h.parent = this;

    this.handles.push(h);
    return h;
  }

  findnearest(e) {
    let limit = config.MANIPULATOR_MOUSEOVER_LIMIT;

    let h = this.handles[0];
    let mpos = [e.x - this.co[0], e.y - this.co[1]];
    let mindis = undefined, minh = undefined;

    for (let h of this.handles) {
      if (h.transparent)
        continue;

      let dis = h.distanceTo(mpos);

      if (dis < limit && (mindis === undefined || dis < mindis)) {
        mindis = dis;
        minh = h;
      }
    }

    return minh;
  }

  on_mousemove(e: MouseEvent, view2d: View2DHandler): Boolean {
    //console.log("handle", e.x.toFixed(3), e.y.toFixed(3), ":", (this.co[0]+h.v1[0]).toFixed(3), (this.co[1]+h.v1[1]).toFixed(3));
    let h = this.findnearest(e);

    //console.log("handle:", h);

    if (h !== this.active) {
      if (this.active !== undefined) {
        this.active.on_inactive();
      }

      this.active = h;

      if (h !== undefined) {
        h.on_active();
      }
    }

    return false;
  }

  /*returns true if handle hit*/
  on_click(event: MouseEvent, view2d: View2DHandler): Boolean {
    return this.active !== undefined ? this.active.on_click(event, view2d, this.active.id) : undefined;
  }
}

export class ManipulatorManager {
  view2d: View2DHandler
  stack: array<Manipulator>
  active: Manipulator;

  constructor(view2d, ctx) {
    this.view2d = view2d;
    this.ctx = ctx;
    this.stack = [];
    this.active = undefined;
  }

  render(canvas, g) {
    if (this.active !== undefined) {
      this.active.render(canvas, g);
    }
  }

  get_render_rects(ctx, canvas, g) {
    static
    nil = [];

    if (this.active !== undefined) {
      return this.active.get_render_rects(ctx, canvas, g);
    } else {
      return nil;
    }
  }

  remove(mn) {
    mn.dead = true;

    if (mn === this.active) {
      this.pop();
    } else {
      this.stack.remove(mn);
    }
  }

  push(mn) {
    mn.dead = false;
    mn.parent = this;
    mn.ctx = this.ctx;

    this.stack.push(this.active);
    this.active = mn;
  }

  ensure_not_toolop(ctx, cls) {
    if (this.active !== undefined && this.active.toolop_class === cls) {
      this.remove(this.active);
    }
  }

  ensure_toolop(ctx, cls) {
    if (this.active !== undefined && this.active.toolop_class === cls) {
      return this.active;
    }

    if (this.active !== undefined) {
      this.remove(this.active);
    }

    this.active = cls.create_widgets(this, ctx);
    if (this.active !== undefined) {
      this.active.toolop_class = cls;
    }
  }

  pop() {
    let ret = this.active;
    this.active = this.stack.pop(-1);
  }

  on_mousemove(event: MouseEvent, view2d: View2DHandler) {
    return this.active !== undefined ? this.active.on_mousemove(event, view2d) : undefined;
  }

  on_click(event: MouseEvent, view2d: View2DHandler): Boolean {
    return this.active !== undefined ? this.active.on_click(event, view2d) : undefined;
  }

  active_toolop() {
    if (this.active === undefined)
      return undefined;

    return this.active.toolop_class;
  }

  create(cls, do_push = true, ctx=this.ctx) {
    let mn = new Manipulator([], ctx);

    mn.parent = this;
    mn.toolop_class = cls;

    if (do_push)
      this.push(mn);

    return mn;
  }

  on_tick(ctx) {
    if (this.active !== undefined && this.active.on_tick !== undefined)
      this.active.on_tick(ctx);
  }

  circle(p, r, clr, do_push = true, ctx=this.ctx) {
    let h = new ManipCircle(p, r, id, this.view3d, clr);
    let mn = new Manipulator([h], ctx);
    mn.parent = this;

    if (do_push) {
      this.push(mn);
    }

    return mn;
  }

  arrow(v1, v2, id, clr, do_push = true, ctx=this.ctx) {
    v1 = new Vector2(v1);
    v2 = new Vector2(v2);

    let h = new ManipHandle(v1, v2, id, HandleShapes.ARROW, this.view3d, clr);
    let mn = new Manipulator([h], ctx);
    mn.parent = this;

    if (do_push)
      this.push(mn);

    return mn;
  }
}
