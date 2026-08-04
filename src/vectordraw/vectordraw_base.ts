"use strict";

import {Vector2, Vector3, Vector4, Quat, Matrix4} from '../path.ux/scripts/pathux.js';

/* The canvas a VectorDraw renders into: a plain canvas plus the device pixel
   ratio it was sized at. */
export type DrawCanvas = Canvas2D["canvas"];

export var VectorFlags = {
  //SELECT : 1,
  UPDATE : 2,
  TAG    : 4
};

export class VectorVertex extends Vector2 {
  static STRUCT : string;

  /* Written by nstructjs, folded into the vector and deleted by loadSTRUCT. */
  _vec? : number[];

  constructor(co? : number[]) {
    super(co);
  }

  loadSTRUCT(reader : StructReader<this>) {
    reader(this);

    this.load(this._vec);
    delete this._vec;
  }
}
VectorVertex.STRUCT = `
VectorVertex {
  _vec : vec2;
}
`;

/*
on factor;
off period;

procedure bez(a, b);
  a + (b - a)*s;

quad  := bez(bez(k1, k2), bez(k2, k3));
dquad := df(quad, s);
cubic := bez(quad, sub(k3=k4, k2=k3, k1=k2, quad));

f1 := sub(s=0, quad) - target;
f2 := sub(s=0, dquad) - dtarget;

f3 := sub(s=1, quad) - target;
f4 := sub(s=1, dquad) - dtarget;

solve({f1, f2}, {k1, k2});
solve({f3, f4}, {k2, k3});

f1 := x1 + dx1*t1 - x4 - dx2*t2;
f2 := y1 + dy1*t1 - y4 - dy2*t2;
f := solve({f1, f2}, {t1, t2});

*/
export class PathBase {
  off : Vector2
  blur : number
  color : Vector4
  /* Paths whose geometry masks this one, and the reverse index. */
  clip_paths : set<PathBase>
  clip_users : set<PathBase>;
  matrix : Matrix4;

  /* Caller-supplied key; VectorDraw.path_idmap is keyed on it. */
  id : number;
  /* Draw order within the VectorDraw; get_path() assigns it. */
  z : number | undefined;
  /* [width, height] of the path's own backing canvas, -1 until it has one. */
  size : number[];
  /* Position in VectorDraw.paths. */
  index : number;
  aabb : [Vector2, Vector2];
  /* Blur/stroke slack baked into the aabb by update_aabb(). */
  pad! : number;
  /* Non-zero when the path's cached geometry has to be rebuilt.  NOTE: the
     canvas2d backend replaces this with an accessor pair. */
  recalc! : number;
  /* Current pen position, tracked by the moveTo/lineTo/bezierTo family. */
  lastx! : number;
  lasty! : number;

  constructor() {
    this.off = new Vector2();
    this.id = -1;
    this.z = undefined;
    this.blur = 0;
    this.size = [-1, -1];
    this.index = -1;

    this.matrix = new Matrix4();

    this.color = new Vector4();
    this.aabb = [new Vector2(), new Vector2()];

    //clip_paths is list of paths used to generate stencil buffer
    this.clip_paths = new set();
    this.clip_users = new set();
  }


  add_clip_path(path : PathBase) {
    if (!this.clip_paths.has(path)) {
      this.update();
    }

    path.clip_users.add(this);
    this.clip_paths.add(path);

    this.recalc = 1;
  }

  reset_clip_paths() {
    if (this.clip_paths.length > 0) {
      //this.update();
    }

    for (var path of this.clip_paths) {
      path.clip_users.remove(this);
    }
    this.clip_paths.reset();
  }

  update_aabb(draw : VectorDraw, fast_mode = false) {
    throw new Error("implement me!");
  }

  beginPath() {
    throw new Error("implement me");
  }

  undo() { //remove last added path
    throw new Error("implement me");
  }

  moveTo(x : number, y : number) {
    this.lastx = x;
    this.lasty = y;
    throw new Error("implement me");
  }

  makeLine(x1 : number, y1 : number, x2 : number, y2 : number, w = 2.0) {
    let dx = y1-y2, dy = x2-x1;
    let l = Math.sqrt(dx*dx + dy*dy);

    if (l === 0.0) {
      return;
    }

    l = 0.5*w / l;

    dx *= l;
    dy *= l;

    this.moveTo(x1-dx, y1-dy);
    this.lineTo(x2-dx, y2-dy);
    this.lineTo(x2+dx, y2+dy);
    this.lineTo(x1+dx, y1+dy);
    this.lineTo(x1-dx, y1-dy);
  }

  bezierTo(x2 : number, y2 : number, x3 : number, y3 : number) {
    this.lastx = x3;
    this.lasty = y3;
    throw new Error("implement me");
  }

  cubicTo(x2 : number, y2 : number, x3 : number, y3 : number, x4 : number,
          y4 : number, subdiv = 1) {
    var x1 = this.lastx, y1 = this.lasty;

    if (subdiv > 0) {
      var dx1 = (x2-x1)*0.5, dy1 = (y2-y1)*0.5;
      var dx2 = (x4-x3)*0.5, dy2 = (y4-y3)*0.5;

      var dxmid = (x3 + x4 - x2 - x1)*0.25;
      var dymid = (y3 + y4 - y2 - y1)*0.25;

      var midx = (3*x3 + x4 + 3*x2 + x1)/8.0;
      var midy = (3*y3 + y4 + 3*y2 + y1)/8.0;

      this.cubicTo(x2+dx1, y2+dy1, midx-dxmid, midy-dymid, midx, midy, subdiv-1);
      this.cubicTo(midx+dxmid, midy+dymid, x4-dx2, y4-dy2, x4, y4, subdiv-1);
      return;
    }

    var dx1 = (x2-x1)*3.0, dy1 = (y2-y1)*3.0;
    var dx2 = (x4-x3)*3.0, dy2 = (y4-y3)*3.0;

    var tdiv = (dx1*dy2 - dx2*dy1);
    var t = (-(x1-x4)*dy2+(y1-y4)*dx2);
    var midx, midy;

    if (tdiv !== 0.0) {
      t /= tdiv;

      midx = x1 + dx1*t;
      midy = y1 + dy1*t;
    } else {
      midx = (x2 + x3)*0.5;
      midy = (y2 + y3)*0.5;
    }

    this.bezierTo(midx, midy, x4, y4);

    this.lastx = x4;
    this.lasty = y4;
  }

  lineTo(x2 : number, y2 : number) {
    throw new Error("implement me");
    this.lastx = x2;
    this.lasty = y2;
  }

  destroy(draw : VectorDraw) {
  }

  /* NOTE: PathBase has no `pan` -- that lives on VectorDraw -- so this throws
     for every backend that does not override reset(). */
  reset(draw : VectorDraw) {
    this.pan.zero();
  }

  //called only by VectorDraw implementing class
  //args can be whatever you want
  draw() {
    throw new Error("implement me!");
  }

  pushStroke(color? : number[], linewidth? : number) {
    throw new Error("implement me!");
  }

  pushFill() {
    throw new Error("implement me!");
  }

  noAutoFill() {
    throw new Error("implement me!");
  }

  update() {
    throw new Error("implement me!");
  }

  [Symbol.keystr]() {
    return this.id;
  }
}

var pop_transform_rets = new cachering(function() {
  return new Matrix4();
}, 32);

export class VectorDraw {
  pan : Vector2
  do_blur : boolean
  /* A preallocated matrix stack; `cur` is the write head. */
  matstack : Matrix4[] & {cur : number}
  matrix : Matrix4;

  paths! : PathBase[];
  path_idmap! : {[id : number] : PathBase};
  /* Set when the path list is out of z order. */
  dosort! : boolean | number;
  /* Non-zero when every path has to be re-rendered. */
  regen! : number | boolean;
  /* Whatever the last draw() call targeted. */
  canvas : DrawCanvas | undefined;
  g : Canvas2D | undefined;
  zoom! : number;

  constructor() {
    this.pan = new Vector2();
    this.do_blur = true;

    this.matstack = new Array(256);
    for (var i=0; i<this.matstack.length; i++) {
      this.matstack[i] = new Matrix4();
    }
    this.matstack.cur = 0;

    this.matrix = new Matrix4();
  }

  recalcAll() {
    this.regen = true;
  }

  clear() {

  }

  //creates new path if necessary.  z is required
  get_path(id : number, z : number, check_z = true) : PathBase {
    if (z === undefined) {
      throw new Error("z cannot be undefined");
    }

    throw new Error("implement me");
  }

  //returns false if path with id does not exist,
  //and also false if it does, but has a different z value.
  has_path(id : number, z : number, check_z = true) : boolean {
    if (z === undefined) {
      throw new Error("z cannot be undefined");
    }
    throw new Error("implement me");
  }

  remove(path : PathBase) {
    for (var path2 of path.clip_users) {
      path2.clip_paths.remove(path);
      path2.update();
    }

    delete this.path_idmap[path.id];
    this.paths.remove(path);

    path.destroy(this);
  }

  update() {
    throw new Error("implement me");
  }

  destroy() {
    throw new Error("implement me");
  }

  draw(g : Canvas2D) : Promise<void> {
    //should return a promise
    throw new Error("implement me");
  }

  push_transform(mat? : Matrix4, multiply_instead_of_load = true) {
    this.matstack[this.matstack.cur++].load(this.matrix);

    if (mat != undefined && multiply_instead_of_load) {
      this.matrix.multiply(mat);
    } else if (mat != undefined) {
      this.matrix.load(mat);
    }
  }

  //returns popped matrix
  pop_transform() {
    var ret = pop_transform_rets.next();
    ret.load(this.matrix);

    this.matrix.load(this.matstack[--this.matstack.cur]);
    return ret;
  }

  translate(x : number, y : number) {
    this.matrix.translate(x, y);
  }

  scale(x : number, y : number) {
    this.matrix.scale(x, y, 1.0);
  }

  rotate(th : number) {
    this.matrix.euler_rotate(0, 0, th);
  }

  //set draw matrix
  set_matrix(matrix : Matrix4) {
    this.matrix.load(matrix);
  }
  get_matrix() {
    return this.matrix;
  }
}
