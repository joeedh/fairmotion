"use strict";

/*
  manipulator widget system, not just for grab, rotate, scale,
  but also extrude, inset, etc.
*/

export var ManipFlags = {
};

export var HandleShapes = {
  ARROW         : 0,
  HAMMER        : 1,
  ROTCIRCLE     : 2,
  SIMEPL_CIRCLE : 3
};

var _mh_idgen = 1;

export class ManipHandle {
  constructor(Vector3 v1, Vector3 v2, Object id, int shape, view2d, Array<float> clr) {
    this.id = id;
    this._hid = _mh_idgen++;
    this.shape = shape;
    this.v1 = v1;
    this.v2 = v2;
    this.color = clr;
    this.parent = undefined;
    this.linewidth = 15;
    
    this._min = new Vector2(v1);
    this._max = new Vector2(v2);
    this._redraw_pad = this.linewidth;
  }
  
  update() {
    this._min[0] = this.v1[0] + this.parent.co[0];
    this._min[1] = this.v1[1] + this.parent.co[1];
    
    this._max[0] = this.v2[0] + this.parent.co[0];
    this._max[1] = this.v2[1] + this.parent.co[1];
    
    var minx = Math.min(this._min[0], this._max[0]);
    var miny = Math.min(this._min[1], this._max[1]);
    var maxx = Math.max(this._min[0], this._max[0]);
    var maxy = Math.max(this._min[1], this._max[1]);
    
    var p = this._redraw_pad;
    
    //redraw old position from last draw
    window.redraw_viewport(this._min, this._max);
    
    this._min[0] = minx-p, this._min[1] = miny-p;
    this._max[0] = maxx+p, this._max[1] = maxy+p;
    
    console.log("update", this._min[0], this._min[1], this._max[0], this._max[1]);
    
    //draw new position
    window.redraw_viewport(this._min, this._max);
  }
  
  [Symbol.keystr]() {
    return "MH" + this._hid.toString;
  }
  
  get_render_rects(ctx, canvas, g) {
    var p = this._redraw_pad;
    
    var xmin = Math.min(this.v1[0], this.v2[0])-p;
    var xmax = Math.max(this.v1[0], this.v2[0])+p;
    
    var ymin = Math.min(this.v1[1], this.v2[1])-p;
    var ymax = Math.max(this.v1[1], this.v2[1])+p;
    
    return [[xmin, ymin, xmax-xmin, ymax-ymin]]
  }
  
  render(canvas, g) {
    g.lineWidth = this.linewidth;
    g.strokeStyle = "teal";
    
    g.beginPath();
    g.moveTo(this.v1[0], this.v1[1]);
    g.lineTo(this.v2[0], this.v2[1]);
    g.stroke();
  }  
}

//okay.  should modal tool ops drive the manipulator positions, or should
//the manipulator code drive modal tool ops? yeesh.  I think maybe the former
//is the way to go.

var _mh_idgen_2 = 1;
var _mp_first = true;

export class Manipulator {
  constructor(Array<Array<ManipHandle>> handles) {
    this._hid = _mh_idgen_2++;
    this.handles = handles.slice(0, handles.length); //copy handles
    this.recalc = 1;
    this.parent = undefined;
    this.user_data = undefined;
    
    for (var h of this.handles) {
      h.parent = this;
    }
    
    /*callback is called on mouse down.  presumably.
      manipulator is passed to callback.
     */
    this.handle_size = 65;
    this.co = new Vector3();
    this.hidden = false;
  }
  
  hide() {
    if (!this.hidden) {
      this.update();
    }
    
    this.hidden = true;
  }
  
  unhide() {
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
    
    for (var h of this.handles) {
      h.update();
    }
  }
  
  on_tick(ctx) {
  }
  
  on_click() {
  }
  
  [Symbol.keystr]() {
    return "MP" + this._hid.toString;
  }
  
  end() {
    this.parent.remove(this);
  }
  
  get_render_rects(ctx, canvas, g) {
    var rects = [];
    
    if (this.hidden) {
      return rects;
    }
    
    for (var h of this.handles) {
      var rs = h.get_render_rects(ctx, canvas, g);
      
      for (var i=0; i<rs.length; i++) {
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
    
    for (var h of this.handles) {
      //XXX need to refactor how viewport canvas transformations work

      var x = this.co[0], y = this.co[1];
      
      g._render_mat.translate(x, y);
      h.render(canvas, g);
      g._render_mat.translate(-x, -y);
    }
  }
  
  arrow(normal, id, clr=[1, 1, 1, 0.5]) {
    normal = new Vector2(normal);
    normal.normalize().mulScalar(25.0);
    
    var h = new ManipHandle(new Vector2(), normal, id, HandleShapes.ARROW, this.view3d, clr);
    h.parent = this;
    
    this.handles.push(h);
  }
  
  /*returns true if handle hit*/
  do_click(MouseEvent e, View2DHandler view2d) : Boolean {
    return false;
  }
}

export class ManipulatorManager {
  constructor(view2d) {
    this.view2d = view2d;
    this.stack = [];
    this.active = undefined;
  }
  
  render(canvas, g) {
    if (this.active != undefined) {
      this.active.render(canvas, g);
    }
  }
  
  get_render_rects(ctx, canvas, g) {
    static nil = [];
    
    if (this.active != undefined) {
      return this.active.get_render_rects(ctx, canvas, g);
    } else {
      return nil;
    }
  }
  
  remove(mn) {
    if (mn == this.active) {
      this.pop();
    } else {
      this.stack.remove(mn);
    }
  }
  
  push(mn) {
    mn.parent = this;
    
    this.stack.push(this.active);
    this.active = mn;
  }
  
  ensure_not_toolop(ctx, cls) {
    if (this.active != undefined && this.active.toolop_class === cls) {
      this.remove(this.active);
    }
  }
  
  ensure_toolop(ctx, cls) {
    if (this.active != undefined && this.active.toolop_class === cls) {
      return this.active;
    }
    
    if (this.active != undefined) {
      this.remove(this.active);
    }
    
    this.active = cls.create_widgets(this, ctx);
    this.active.toolop_class = cls;
  }
  
  pop() {
    var ret = this.active;
    this.active = this.stack.pop(-1);
  }
  
  do_click(MouseEvent event, View2DHandler view2d) : Boolean {
    return this.active != undefined ? this.active.do_click(event, view2d) : undefined;
  }
  
  active_toolop() {
    if (this.active == undefined)
      return undefined;
    
    return this.active.toolop_class;
  }
  
  create(cls, do_push = true) {
    var mn = new Manipulator([]);
    
    mn.parent = this;
    mn.toolop_class = cls;
    
    if (do_push)
      this.push(mn);
    
    return mn;
  }
  
  on_tick(ctx) {
    if (this.active != undefined && this.active.on_tick != undefined)
      this.active.on_tick(ctx);
  }
  
  arrow(normal, id, clr, do_push=true) {
    normal = new Vector3(normal);
    normal.normalize().mulScalar(25.0);
    
    var h = new ManipHandle(new Vector3(), normal, id, HandleShapes.ARROW, this.view3d, clr);
    var mn = new Manipulator([h]);
    mn.parent = this;
    
    if (do_push)
      this.push(mn);
    
    return mn;
  }
}
