"use strict";

import { Vector2, Vector3, Vector4, Quat, Matrix4 } from "../path.ux/scripts/pathux.js";

/* The canvas a VectorDraw renders into: a plain canvas plus the device pixel
   ratio it was sized at. */
export type DrawCanvas = Canvas2D["canvas"];

export var VectorFlags = {
  //SELECT : 1,
  UPDATE: 2,
  TAG   : 4,
};

export class VectorVertex extends Vector2 {
  static STRUCT: string;

  /* Written by nstructjs, folded into the vector and deleted by loadSTRUCT. */
  _vec?: number[];

  constructor(co?: number[]) {
    super(co);
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);

    this.load(this._vec!);
    delete this._vec;
  }
}
VectorVertex.STRUCT = `
VectorVertex {
  _vec : vec2;
}
`;

/*
 * Derivation for approximating a cubic by quadratics: match value and tangent
 * at each end, then find the shared control point as the intersection of the
 * two end tangents. Every live backend emits a CUBICTO opcode instead, so
 * nothing here is called; it is kept as source material for any future backend
 * without native cubics.
 *
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
/* A colour, as either a path.ux Vector4 or a plain rgba array.  path.ux
   vectors deliberately have no plain index signature -- theirs yields
   `number | undefined` -- so a Vector4 is not an ArrayLike<number>. */
export type ColorLike = {
  [i: number]: number | undefined;

  length: number;
};

/* `recalc` lives on the merged interface rather than in the class body: the
   canvas2d backend replaces it with an accessor pair, which TypeScript will
   not allow over a class-declared property. */
export interface PathBase {
  /* Non-zero when the path's cached geometry has to be rebuilt. */
  recalc: number;
}

export abstract class PathBase {
  off: Vector2;
  blur: number;
  color: Vector4;
  /* Paths whose geometry masks this one, and the reverse index. */
  clip_paths: set<PathBase>;
  clip_users: set<PathBase>;
  matrix: Matrix4;

  /* Caller-supplied key; VectorDraw.path_idmap is keyed on it. */
  id: number;
  /* Draw order within the VectorDraw; get_path() assigns it. */
  z: number | undefined;
  /* [width, height] of the path's own backing canvas, -1 until it has one.
     A vector because genInto() swaps in a Vector2 and load()s through it. */
  size: Vector2;
  /* Position in VectorDraw.paths. */
  index: number;
  aabb: [Vector2, Vector2];
  /* Blur/stroke slack baked into the aabb by update_aabb(). */
  pad!: number;
  /* Current pen position, tracked by the moveTo/lineTo/bezierTo family. */
  lastx!: number;
  lasty!: number;

  /* Both are set by the spline drawer and read by nothing. */
  frame_first?: boolean;
  was_updated?: boolean;

  /* Set by the spline drawer; only the canvas2d backend honours it. */
  hidden?: boolean;

  constructor() {
    this.off = new Vector2();
    this.id = -1;
    this.z = undefined;
    this.blur = 0;
    this.size = new Vector2([-1, -1]);
    this.index = -1;

    this.matrix = new Matrix4();

    this.color = new Vector4();
    this.aabb = [new Vector2(), new Vector2()];

    //clip_paths is list of paths used to generate stencil buffer
    this.clip_paths = new set();
    this.clip_users = new set();
  }

  add_clip_path(path: PathBase) {
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

  abstract update_aabb(draw: VectorDraw, fast_mode?: boolean): void;

  abstract beginPath(): void;

  //remove last added path
  abstract undo(): void;

  abstract moveTo(x: number, y: number): void;

  abstract lineTo(x2: number, y2: number): void;

  abstract bezierTo(x2: number, y2: number, x3: number, y3: number): void;

  abstract cubicTo(x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): void;

  makeLine(x1: number, y1: number, x2: number, y2: number, w = 2.0) {
    let dx = y1 - y2,
      dy = x2 - x1;
    let l = Math.sqrt(dx * dx + dy * dy);

    if (l === 0.0) {
      return;
    }

    l = (0.5 * w) / l;

    dx *= l;
    dy *= l;

    this.moveTo(x1 - dx, y1 - dy);
    this.lineTo(x2 - dx, y2 - dy);
    this.lineTo(x2 + dx, y2 + dy);
    this.lineTo(x1 + dx, y1 + dy);
    this.lineTo(x1 - dx, y1 - dy);
  }

  destroy(draw: VectorDraw) {}

  /* NOTE: the base used to zero this.pan, which lives on VectorDraw rather than
     here, so it threw for any backend that did not override reset() -- every
     backend does.  No backend reads `draw`, and every call site passes
     nothing. */
  abstract reset(draw?: VectorDraw): void;

  //called only by VectorDraw implementing class
  //args can be whatever you want
  abstract draw(...args: any[]): void;

  abstract pushStroke(color?: ColorLike, linewidth?: number): void;

  abstract pushFill(): void;

  abstract noAutoFill(): void;

  /* `draw` is accepted only because CanvasDraw2D.update() passes it; no
     backend has ever read it. */
  abstract update(draw?: VectorDraw): void;

  [Symbol.keystr]() {
    return this.id;
  }
}

var pop_transform_rets = new cachering(function () {
  return new Matrix4();
}, 32);

/* `PathType` is the concrete path class a backend hands out; the base only
   ever needs to know it is some PathBase. */
/* `regen` is on the merged interface for the same reason PathBase.recalc is. */
export interface VectorDraw<PathType extends PathBase = PathBase> {
  /* Non-zero when every path has to be re-rendered. */
  regen: number | boolean;
}

export abstract class VectorDraw<PathType extends PathBase = PathBase> {
  pan: Vector2;
  do_blur: boolean;
  /* A preallocated matrix stack; `cur` is the write head. */
  matstack: Matrix4[] & { cur: number };
  matrix: Matrix4;

  paths!: PathType[];
  path_idmap!: { [id: number]: PathType };
  /* Set when the path list is out of z order. */
  dosort!: boolean | number;
  /* Whatever the last draw() call targeted. Set for the whole of a draw and
     read unconditionally by every path renderer; only the constructors below
     leave it unset. */
  canvas!: DrawCanvas;
  g!: Canvas2D;
  zoom!: number;

  constructor() {
    this.pan = new Vector2();
    this.do_blur = true;

    this.matstack = Object.assign(new Array<Matrix4>(256), { cur: 0 });
    for (var i = 0; i < this.matstack.length; i++) {
      this.matstack[i] = new Matrix4();
    }
    this.matstack.cur = 0;

    this.matrix = new Matrix4();
  }

  recalcAll() {
    this.regen = true;
  }

  clear() {}

  //creates new path if necessary.  z is required
  abstract get_path(id: number, z: number, check_z?: boolean): PathType;

  //returns false if path with id does not exist,
  //and also false if it does, but has a different z value.
  abstract has_path(id: number, z: number, check_z?: boolean): boolean;

  remove(path: PathType) {
    for (var path2 of path.clip_users) {
      path2.clip_paths.remove(path);
      path2.update();
    }

    delete this.path_idmap[path.id];
    this.paths.remove(path);

    path.destroy(this);
  }

  abstract update(): void;

  abstract destroy(): void;

  //should return a promise
  abstract draw(g: Canvas2D): Promise<void> | void;

  push_transform(mat?: Matrix4, multiply_instead_of_load = true) {
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

  translate(x: number, y: number) {
    this.matrix.translate(x, y, 0);
  }

  scale(x: number, y: number) {
    this.matrix.scale(x, y, 1.0);
  }

  rotate(th: number) {
    this.matrix.euler_rotate(0, 0, th);
  }

  //set draw matrix
  set_matrix(matrix: Matrix4) {
    this.matrix.load(matrix);
  }
  get_matrix() {
    return this.matrix;
  }
}
