"use strict";

//#include "src/core/utildefine.js"

import "./vectormath.js"

import type {Number3} from './vectormath.js';
import {STRUCT} from '../core/struct.js';

export var feps = 2.22e-16;

export var COLINEAR = 1;
export var LINECROSS = 2;

var _cross_vec1 = new Vector3();
var _cross_vec2 = new Vector3();

export var FLOAT_MIN = -1e21;
export var FLOAT_MAX = 1e22

/* Most of the geometry helpers below are called with both 2D and 3D vectors --
   line_isect() even branches on `v1.length === 3` at runtime to tell which it
   got -- so they take a vector union rather than a fixed width. They need real
   vector methods (vectorDistance, dot, load...), not plain number[]. */
type VecLike = Vector2 | Vector3;

/* The helpers that only *index* their arguments are additionally called with
   plain arrays and with Float32Array views. path.ux's vector classes are not
   Array subclasses, so "a thing with numeric slots" has to be spelled out.
   Only slots 0 and 1 read straight off a Coord: path.ux types a vector's slots
   above its own width as `number | undefined` on purpose, so that vectors of
   different widths cannot be mixed (see vectormath.ts). Use zof() for slot 2,
   or Coord3 where all three are always present. */
type Coord = VecLike | number[];
type Coord3 = Vector3 | number[];

/* Slot 2 of an argument that may be only 2D. Every call site below sits inside
   a `length === 3` branch, or is filling in a z the caller ignores. */
function zof(v : Coord) : number {
  return v[2] ?? 0;
}

/* Copies however many components `src` has into `dst`, which Vector3.load()
   will not do -- it only accepts 3D sources. */
function loadCoord(dst : Vector3, src : Coord) : Vector3 {
  dst.zero();

  for (let i = 0; i < src.length && i < 3; i++) {
    dst[i] = src[i] ?? 0;
  }

  return dst;
}

/* Distance across as many components as `a` carries, which is what
   a.vectorDistance(b) measured back when both were the same vector class. */
function vdist(a : Coord, b : Coord) : number {
  let sum = 0;

  for (let i = 0; i < a.length; i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    sum += d*d;
  }

  return Math.sqrt(sum);
}

/*a UI-friendly Matrix4 wrapper, that 
  likes to pretend it's a simple collection
  of [location, rotation-euler, size] 
  parameters*/

import '../path.ux/scripts/util/vectormath.js';

/* `loc` doubles as a copy-constructor argument: pass a Matrix4 and rot/size are
   ignored. */
export class Matrix4UI extends Matrix4 {
  constructor(loc : Matrix4 | Coord, rot? : Coord, size? : Coord) {
    super();

    if (loc instanceof Matrix4) {
      this.load(loc);
      return this;
    }
    
    if (rot == undefined)
      rot = [0, 0, 0];
      
    if (size == undefined)
      size = [1.0, 1.0, 1.0];
    
    this.makeIdentity();
    this.calc(loc, rot, size);
  }
  
  calc(loc : Coord, rot : Coord, size : Coord) {
    /* Exactly three arguments selects Matrix4.rotate()'s euler form. */
    this.rotate(rot[0], rot[1], zof(rot));
    this.scale(size[0], size[1], zof(size));
    this.translate(loc[0], loc[1], zof(loc));
  }
  
  get loc() {
    var t = new Vector3();
    this.decompose(t);
    
    return t;
  }
  
  set loc(loc : Coord) {
    var l = new Vector3(), r = new Vector3(), s = new Vector3();
    
    this.decompose(l, r, s);
    this.calc(loc, r, s);
  }
  
  get rot() {
    var t = new Vector3();
    this.decompose(undefined, t);
    return t;
  }
  
  set rot(rot : Coord) {
    var l = new Vector3(), r = new Vector3(), s = new Vector3();
    
    this.decompose(l, r, s);
    this.calc(l, rot, s);
  }
  
  get size() {
    var t = new Vector3()
    this.decompose(undefined, undefined, t);
    
    return t;
  }
  
  set size(size : Coord) {
    var l = new Vector3(), r = new Vector3(), s = new Vector3();
    
    this.decompose(l, r, s);
    this.calc(l, r, size);
  }
}

//check if we're on a 16-bit floating point system,
//which is thoeretically possible with mobile
//devices.  note: this is untested
if (FLOAT_MIN != FLOAT_MIN || FLOAT_MAX != FLOAT_MAX) {
  //16-bit case
  FLOAT_MIN = 1e-5;
  FLOAT_MAX = 1e6;
  console.log("Floating-point 16-bit system detected!");
}

/* Was `static` inside get_rect_points(); the transpiler hoisted these to module
   scope and they are reused across calls. */
const _get_rect_points_cs4 : Coord[] = new Array(4);
const _get_rect_points_cs8 : Coord[] = new Array(8);

/* Corners of a 2D or 3D box given as origin + size. The returned array is
   reused between calls, and slot 0 aliases `p` itself. */
export function get_rect_points(p : Coord, size : Coord) : Coord[]
{
  var cs : Coord[];

  const _cs4 = _get_rect_points_cs4;
  const _cs8 = _get_rect_points_cs8;

  if (p.length == 2) {
    cs = _cs4;

    cs[0] = p;
    cs[1] = [p[0], p[1]+size[1]]
    cs[2] = [p[0]+size[0], p[1]+size[1]]
    cs[3] = [p[0]+size[0], p[1]]
  } else if (p.length == 3) {
    cs = _cs8;

    cs[0] = p;
    cs[1] = [p[0]+size[0], p[1], zof(p) ];
    cs[2] = [p[0]+size[0], p[1]+size[1], zof(p) ];
    cs[3] = [p[0], p[1]+size[0], zof(p) ];

    cs[4] = [p[0], p[1], zof(p)+zof(size) ];
    cs[5] = [p[0]+size[0], p[1], zof(p)+zof(size) ];
    cs[6] = [p[0]+size[0], p[1]+size[1], zof(p)+zof(size) ];
    cs[7] = [p[0], p[1]+size[0], zof(p)+zof(size) ];
  } else {
    throw "get_rect_points has no implementation for " + p.length + "-dimensional data";
  }

  return cs;
}

/* Broken for the 3D case: `l1.concat(l2)` does not mutate l1 and its result is
   dropped, so the second face's four edges are missing from the result. */
export function get_rect_lines(p : Coord, size : Coord) : Coord[][]
{
  var ps = get_rect_points(p, size);

  if (p.length == 2) {
    return [[ps[0], ps[1]], [ps[1], ps[2]], [ps[2], ps[3]], [ps[3], ps[0]]];
  } else if (p.length == 3) {
    var l1 = [[ps[0], ps[1]], [ps[1], ps[2]], [ps[2], ps[3]], [ps[3], ps[0]]]
    var l2 = [[ps[4], ps[5]], [ps[5], ps[6]], [ps[6], ps[7]], [ps[7], ps[4]]]

    l1.concat(l2);

    l1.push([ps[0], ps[4]])
    l1.push([ps[1], ps[5]])
    l1.push([ps[2], ps[6]])
    l1.push([ps[3], ps[7]])

    return l1;
  } else {
    throw "get_rect_points has no implementation for " + p.length + "-dimensional data";
  }
}

const _simple_tri_aabb_isect_vs : Coord3[] = [];

/* True when any of the triangle's own vertices lies inside the box; this does
   not detect a triangle that merely straddles it. */
export function simple_tri_aabb_isect(v1 : Coord3, v2 : Coord3, v3 : Coord3,
                                      min : Coord3, max : Coord3) {
  const vs = _simple_tri_aabb_isect_vs;

  vs[0] = v1; vs[1] = v2; vs[2] = v3;
  for (var i=0; i<3; i++) {
    var isect = true;

    for (var j=0; j<3; j++) {
      if ((vs[j][i] ?? 0) < (min[i] ?? 0) || (vs[j][i] ?? 0) >= (max[i] ?? 0))
        isect = false;
    }

    if (isect)
      return true;
  }

  return false;
}

/* Bounds over `totaxis` components. `min`/`max` are the public values and read
   as all-zero for the empty set; `_min`/`_max` are the working accumulators,
   seeded to FLOAT_MAX/FLOAT_MIN. */
export class MinMax {
  static STRUCT : string;

  totaxis : number;
  min : number[];
  max : number[];
  _min : number[];
  _max : number[];
  _static_mr_co : number[];
  _static_mr_cs : Coord[];

  /* NOTE: with totaxis === 1 these four fields used to hold bare numbers
     rather than one-element arrays, which made every reader's type a union.
     Nothing constructs a one-axis MinMax -- every call site passes 2 or 3 --
     and the class is never registered with nstructjs, so the two shapes have
     been collapsed into one. */
  constructor(totaxis : number = 1) {
    this.totaxis = totaxis;

    //we handle the empty set case by separating the
    //minmax arrays from the publicly available interface ,
    //such that the minmax of the empty set will always
    //be [0, 0];

    this._min = new Array(totaxis);
    this._max = new Array(totaxis);
    this.min = new Array(totaxis);
    this.max = new Array(totaxis);

    this.reset();

    this._static_mr_co = new Array(this.totaxis);
    this._static_mr_cs = new Array(this.totaxis*this.totaxis);
  }

  load(mm : MinMax) {
    for (var i=0; i<this.totaxis; i++) {
      this.min[i] = this._min[i] = mm.min[i];
      this.max[i] = this._max[i] = mm.max[i];
    }
  }

  reset() {
    var totaxis = this.totaxis;

    for (var i=0; i<totaxis; i++) {
      this._min[i] = FLOAT_MAX;
      this._max[i] = FLOAT_MIN;
      this.min[i] = 0;
      this.max[i] = 0;
    }
  }

  minmax_rect(p : Coord, size : Coord) {
    var totaxis = this.totaxis;

    var cs = this._static_mr_cs;

    if (totaxis === 2) {
      cs[0] = p;
      cs[1] = [p[0]+size[0], p[1]]
      cs[2] = [p[0]+size[0], p[1]+size[1]]
      cs[3] = [p[0], p[1]+size[1]]
    } else if (totaxis === 3) {
      cs[0] = p;
      cs[1] = [p[0]+size[0], p[1], zof(p) ];
      cs[2] = [p[0]+size[0], p[1]+size[1], zof(p) ];
      cs[3] = [p[0], p[1]+size[0], zof(p) ];

      cs[4] = [p[0], p[1], zof(p)+zof(size) ];
      cs[5] = [p[0]+size[0], p[1], zof(p)+zof(size) ];
      cs[6] = [p[0]+size[0], p[1]+size[1], zof(p)+zof(size) ];
      cs[7] = [p[0], p[1]+size[0], zof(p)+zof(size) ];
    } else {
      throw "Minmax.minmax_rect has no implementation for " + totaxis + "-dimensional data";
    }

    for (var i=0; i<cs.length; i++) {
      this.minmax(cs[i]);
    }
  }

  /* Takes a scalar when totaxis === 1 and a vector otherwise. */
  minmax(p : number | Coord) {
    var totaxis = this.totaxis

    for (var i=0; i<totaxis; i++) {
      var x = typeof p === "number" ? p : p[i] ?? 0;

      this._min[i] = this.min[i] = Math.min(this._min[i], x);
      this._max[i] = this.max[i] = Math.max(this._max[i], x);
    }
  }

  static fromSTRUCT(reader : StructReader<MinMax>) {
    var ret = new MinMax();

    reader(ret);

    return ret;
  }
}

MinMax.STRUCT = `
  MinMax {
    min     : vec3;
    max     : vec3;
    _min    : vec3;
    _max    : vec3;
    totaxis : int;
  }
`;

/* Sign of the 2D cross product at b; true for counter-clockwise. */
export function winding(a : Coord, b : Coord, c : Coord) {
  let dx1 = a[0]-b[0];
  let dy1 = a[1]-b[1];

  let dx2 = c[0]-b[0];
  let dy2 = c[1]-b[1];

  let r = dx1*dy2 - dy1*dx2;
  return r >= 0.0;
}

//this specifically returns true in the case where two rectangles
//share common borders
export function inrect_2d(p : Coord, pos : Coord, size : Coord) {
  if (p == undefined || pos == undefined || size == undefined) {
    console.trace();
    console.log("Bad paramters to inrect_2d()")
    console.log("p: ", p, ", pos: ", pos, ", size: ", size);
    return false;
  }
  return p[0] >= pos[0] && p[0] <= pos[0]+size[0] && p[1] >= pos[1] && p[1] <= pos[1]+size[1];
}

const _aabb_isect_line_2d_smin = new Vector2(), _aabb_isect_line_2d_smax = new Vector2();
const _aabb_isect_line_2d_ssize = new Vector2();
/* Broken: the loop below writes ps[3], but only three corners are allocated. */
const _aabb_isect_line_2d_ps : Vector2[] = [new Vector2(), new Vector2(), new Vector2()];
const _aabb_isect_line_2d_l1 : Vector2[] = [], _aabb_isect_line_2d_l2 : Vector2[] = [];

/* Dead -- nothing outside this file calls it, which is just as well given the
   missing fourth corner above. */
export function aabb_isect_line_2d(v1 : Vector2, v2 : Vector2, min : Vector2, max : Vector2) {
  const smin = _aabb_isect_line_2d_smin, smax = _aabb_isect_line_2d_smax;
  const ssize = _aabb_isect_line_2d_ssize;

  for (var i=0; i<2; i++) {
    smin[i] = Math.min(min[i] ?? 0, v1[i] ?? 0);
    smax[i] = Math.max(max[i] ?? 0, v2[i] ?? 0);
  }

  //convert to the pos, size form aabb_isect_2d can understand
  smax.sub(smin);
  ssize.load(max).sub(min);

  if (!aabb_isect_2d(smin, smax, min, ssize))
    return false;

  for (var i=0; i<4; i++) {
    if (inrect_2d(v1, min, ssize)) return true;
    if (inrect_2d(v2, min, ssize)) return true;
  }

  const ps = _aabb_isect_line_2d_ps;

  ps[0] = min;
  ps[1][0] = min[0]; ps[1][1] = max[1];
  ps[2] = max;
  ps[3][0] = max[0]; ps[3][1] = min[1];

  const l1 = _aabb_isect_line_2d_l1, l2 = _aabb_isect_line_2d_l2;
  l1[0] = v1; l1[1] = v2;

  for (var i=0; i<4; i++) {
    var a = ps[i], b = ps[(i+1)%4];

    l2[0] = a;
    l2[1] = b;

    if (line_line_cross(l1, l2)) return true;
  }

  return false;
}

export function aabb_isect_minmax2d(_min1 : Coord, _max1 : Coord,
                                    _min2 : Coord, _max2 : Coord, margin=0) {
  var ret = 0;

  for (var i=0; i<2; i++) {
    var min1 = (_min1[i] ?? 0)-margin, max1 = (_max1[i] ?? 0)+margin;
    var min2 = (_min2[i] ?? 0)-margin, max2 = (_max2[i] ?? 0)+margin;

    if (max1 >= min2 && min1 <= max2)
      ret += 1;
  }

  return ret == 2;
}

export function aabb_isect_2d(pos1 : Coord, size1 : Coord,
                              pos2 : Coord, size2 : Coord) {
  var ret = 0;

  for (var i=0; i<2; i++) {
    var a = pos1[i] ?? 0;
    var b = a + (size1[i] ?? 0);
    var c = pos2[i] ?? 0;
    var d = c + (size2[i] ?? 0);

    if (b >= c && a <= d) ret += 1;
  }

  //console.log(ret, ret==2);
  return ret == 2;
}

/* Dead. */
function expand_rect2d(pos : Coord, size : Coord, margin : Coord) {
  pos[0] -= Math.floor(margin[0]);
  pos[1] -= Math.floor(margin[1]);
  size[0] += Math.floor(margin[0]*2.0);
  size[1] += Math.floor(margin[1]*2.0);
}

/* Dead. Grows the segment by `margin` at both ends, in place. */
function expand_line(l : Vector3[], margin : number) {
    var c = new Vector3();
    c.add(l[0]);
    c.add(l[1]);
    c.mulScalar(0.5);

    l[0].sub(c);
    l[1].sub(c);

    var l1 = l[0].vectorLength();
    var l2 = l[1].vectorLength();

    l[0].normalize();
    l[1].normalize();

    l[0].mulScalar(margin + l1);
    l[1].mulScalar(margin + l2);

    l[0].add(c);
    l[1].add(c);

    return l;
}

function colinear(a : Vector3, b : Vector3, c : Vector3) {
    for (var i=0; i<3; i++) {
      _cross_vec1[i] = (b[i] ?? 0) - (a[i] ?? 0);
      _cross_vec2[i] = (c[i] ?? 0) - (a[i] ?? 0);
    }

    var limit = 2.2e-16;

    if (a.vectorDistance(b) < feps*100 && a.vectorDistance(c) < feps*100)
    {
        return true;
    }

    if (_cross_vec1.dot(_cross_vec1) < limit ||
        _cross_vec2.dot(_cross_vec2) < limit)
        return true;

   // _cross_vec1.normalize();
   // _cross_vec2.normalize();
    _cross_vec1.cross(_cross_vec2);

    return _cross_vec1.dot(_cross_vec1) < limit;
}

/* Dead -- the commented-out expand_line() calls below were their only user. */
var _llc_l1 = [new Vector3(), new Vector3()]
var _llc_l2 = [new Vector3(), new Vector3()]

/* Takes two *pairs* of points, not four points -- unlike path.ux's math.ts
   function of the same name, which takes four. */
export function line_line_cross(l1 : Coord[], l2 : Coord[]) {
    //if (margin == undefined) margin = 0;

    /*var l1 = [new Vector3(l1[0]), new Vector3(l1[1])];
    var l2 = [new Vector3(l2[0]), new Vector3(l2[1])];
    var l1 = expand_line(l1, margin);
    var l2 = expand_line(l2, margin);*/

    //if (colinear(l1[0], l1[1], l2[0])) return true;
    //if (colinear(l1[0], l1[1], l2[1])) {
    //  return true;
    //}
    // /*

    var limit = feps*1000;

    if (Math.abs(vdist(l1[0], l2[0])+vdist(l1[1], l2[0])-
        vdist(l1[0], l1[1])) < limit)
    {
      return true;
    }
    if (Math.abs(vdist(l1[0], l2[1])+vdist(l1[1], l2[1])-
        vdist(l1[0], l1[1])) < limit)
    {
      return true;
    }
    if (Math.abs(vdist(l2[0], l1[0])+vdist(l2[1], l1[0])-
        vdist(l2[0], l2[1])) < limit)
    {
      return true;
    }
    if (Math.abs(vdist(l2[0], l1[1])+vdist(l2[1], l1[1])-
        vdist(l2[0], l2[1])) < limit)
    {
      return true;
    }
    // */
    //feps*100
    //if (colinear(l2[0], l2[1], l1[0])) return true;
    //if (colinear(l2[0], l2[1], l1[1])) return true;

    var a = l1[0]; var b = l1[1];
    var c = l2[0]; var d = l2[1];

    let ok = winding(a, b, c) !== winding(a, b, d);
    ok = ok && winding(c, d, a) !== winding(c, d, b);

    return ok;
}

let _llc4_1 = [new Vector2(), new Vector2()];
let _llc4_2 = [new Vector2(), new Vector2()];

export function line_line_cross4(v1 : Vector2, v2 : Vector2, v3 : Vector2, v4 : Vector2) : boolean {
  _llc4_1[0].load(v1);
  _llc4_1[1].load(v2);
  _llc4_2[0].load(v3);
  _llc4_2[1].load(v4);

  return line_line_cross(_llc4_1, _llc4_2);
}

/* Dead. */
export function point_in_tri(p : Coord, v1 : Coord, v2 : Coord, v3 : Coord) {
    var w1 = winding(p, v1, v2);
    var w2 = winding(p, v2, v3);
    var w3 = winding(p, v3, v1);
    
    return w1 == w2 && w2 == w3;
}

/* Dead. True when the diagonals cross, i.e. the quad is not self-overlapping. */
export function convex_quad(v1 : Coord, v2 : Coord, v3 : Coord, v4 : Coord) {
    return line_line_cross([v1, v3], [v2, v4]);
}

const _normal_tri_e1 = new Vector3(), _normal_tri_e2 = new Vector3();

/* Dead. Returns a shared scratch vector; copy it before the next call.
   NOTE: the body used VSUB/VCROSS/VNORMALIZE, macros the old transpiler
   expanded inline. They no longer exist, so every call threw ReferenceError;
   restored from the equivalent longhand that sat commented out beside it. */
export function normal_tri(v1 : Vector3, v2 : Vector3, v3 : Vector3) {
  const e1 = _normal_tri_e1, e2 = _normal_tri_e2;

  e1.load(v2).sub(v1);
  e2.load(v3).sub(v1);
  e1.cross(e2);
  e1.normalize();

  return e1;
}

const _normal_quad_n2 = new Vector3();

/* Dead. Average of the two triangle normals; also a shared scratch vector.
   NOTE: used VLOAD/VADD/VNORMALIZE, gone the same way. */
export function normal_quad(v1 : Vector3, v2 : Vector3, v3 : Vector3, v4 : Vector3) {
  const n2 = _normal_quad_n2;

  n2.load(normal_tri(v1, v2, v3));
  n2.add(normal_tri(v1, v3, v4));
  n2.normalize();

  return n2;
}

var lis_rets3 = cachering.fromConstructor(Vector3, 64);
var lis_rets2 = cachering.fromConstructor(Vector2, 64);

var _li_vi = new Vector3()
/* [point, COLINEAR|LINECROSS] and, when a parameter was asked for or the
   inputs are 3D, a third element holding t along v1->v2. The point comes from
   a 64-deep ring buffer, so it survives a few calls but not forever. */
export type LineIsect<V extends VecLike = VecLike> = [V, number, number?];

/* All-3D inputs take the 3D branch below, so the point comes back as a
   Vector3; mixed or 2D inputs only promise a vector of some width. */
export function line_isect(v1 : Vector3, v2 : Vector3, v3 : Vector3, v4 : Vector3,
                           calc_t? : boolean) : LineIsect<Vector3>;
export function line_isect(v1 : VecLike, v2 : VecLike, v3 : VecLike, v4 : VecLike,
                           calc_t? : boolean) : LineIsect;
export function line_isect(v1 : VecLike, v2 : VecLike, v3 : VecLike, v4 : VecLike,
                           calc_t = false) : LineIsect {

  //code may be copyright tainted; replace
  var div = (v2[0] - v1[0]) * (v4[1] - v3[1]) - (v2[1] - v1[1]) * (v4[0] - v3[0]);
  if (div === 0.0) return [new Vector3(), COLINEAR, 0.0];

  var vi = v1.length === 3 ? lis_rets3.next().zero() : lis_rets2.next().zero();

  vi[0] = ((v3[0] - v4[0]) * (v1[0] * v2[1] - v1[1] * v2[0]) - (v1[0] - v2[0]) * (v3[0] * v4[1] - v3[1] * v4[0])) / div;
  vi[1] = ((v3[1] - v4[1]) * (v1[0] * v2[1] - v1[1] * v2[0]) - (v1[1] - v2[1]) * (v3[0] * v4[1] - v3[1] * v4[0])) / div;

  if (calc_t || v1.length === 3) {
    var n1 = new Vector2(v2).sub(v1);
    var n2 = new Vector2(vi).sub(v1);

    var t = n2.vectorLength()/n1.vectorLength();

    n1.normalize(); n2.normalize();
    if (n1.dot(n2) < 0.0) {
      t = -t;
    }

    if (v1.length === 3) {
      vi[2] = zof(v1) + (zof(v2) - zof(v1))*t;
    }

    return [vi, LINECROSS, t];
  }

  return [vi, LINECROSS];
}

var dtl_v1 = new Vector3()
var dtl_v2 = new Vector3()
var dtl_v3 = new Vector3()
var dtl_v4 = new Vector3()
var dtl_v5 = new Vector3()
var dtl_p = new Vector3()

/* Distance from p to the *segment* v1..v2, flattened to the XY plane. The
   arguments are copied into scratch vectors, so callers may pass 2D. */
export function dist_to_line_v2(p_in : Coord, v1_in : Coord, v2_in : Coord)
{
  var v3 = dtl_v3, v4 = dtl_v4;
  var v5 = dtl_v5;
  v5[2] = 0.0;

  const v1 = loadCoord(dtl_v1, v1_in);
  const v2 = loadCoord(dtl_v2, v2_in);
  const p = loadCoord(dtl_p, p_in);

  v3.load(v1); v4.load(v2);
  v1[2] = v2[2] = v3[2] = v4[2] = p[2] = 0.0;

  v4.sub(v3);
  v5[0] = -v4[1];
  v5[1] = v4[0];

  v3 = p;
  v4.load(v5);
  v4.add(v3);

  var ret = line_isect(v1, v2, v3, v4);

  //console.log(ret)

  if (ret[1] == COLINEAR) {
    var d1 = p.vectorDistance(v1);
    var d2 = p.vectorDistance(v2);

    return Math.min(d1, d2);
  } else {
    var t1 = ret[0].vectorDistance(v1);
    var t2 = ret[0].vectorDistance(v2);
    var t3 = v1.vectorDistance(v2);

    if (t1 > t3 || t2 > t3) {
      var d1 = p.vectorDistance(v1);
      var d2 = p.vectorDistance(v2);

      return Math.min(d1, d2);
    } else {
      return p.vectorDistance(ret[0]);
    }
  }
}

/* Dead. Returns [point, distance-from-v1]. */
export function closest_point_on_line(p : Vector3, v1 : Vector3, v2 : Vector3)
{
  var v3 = dtl_v3, v4 = dtl_v4;
  var v5 = dtl_v5;

  v3.load(v1); v4.load(v2);

  v4.sub(v3);
  v5[0] = -v4[1];
  v5[1] = v4[0];

  v3 = p;
  v4.load(v5);
  v4.add(v3);

  var ret = line_isect(v1, v2, v3, v4);
  if (ret[1] == COLINEAR) {
      v3 = dtl_v3; v4 = dtl_v4;
      v5 = dtl_v5;

      p = new Vector3(p);
      v3.load(v1); v4.load(v2);

      v4.sub(v3);
      p.sub(v4)

      v5[0] = -v4[1];
      v5[1] = v4[0];

      v3 = p;
      v4.load(v5);
      v4.add(v3);
      ret = line_isect(v1, v2, v3, v4);
  }
  return [new Vector3(ret[0]), v1.vectorDistance(ret[0])];
}

//returns the circumcircle of the triangle defined by points a, b, and c.
var _gtc_e1 = new Vector3();
var _gtc_e2 = new Vector3();
var _gtc_e3 = new Vector3();
var _gtc_p1 = new Vector3();
var _gtc_p2 = new Vector3();
var _gtc_v1 = new Vector3();
var _gtc_v2 = new Vector3();

var _gtc_p12 = new Vector3()
var _gtc_p22 = new Vector3()

/* Dead. Returns [centre, radius]; see the p2 comment below -- the second
   bisector may be taken from the wrong edge midpoint. */
export function get_tri_circ(a : Coord3, b : Coord3, c : Coord3) {
    var e1 = _gtc_e1;
    var e2 = _gtc_e2;
    var e3 = _gtc_e3;

    for (var i=0; i<3; i++) {
        e1[i] = (b[i] ?? 0) - (a[i] ?? 0);
        e2[i] = (c[i] ?? 0) - (b[i] ?? 0);
        e3[i] = (a[i] ?? 0) - (c[i] ?? 0);
    }

    var p1 = _gtc_p1;
    var p2 = _gtc_p2;

    for (var i=0; i<3; i++) {
      p1[i] = ((a[i] ?? 0) + (b[i] ?? 0))*0.5;
      p2[i] = ((c[i] ?? 0) + (b[i] ?? 0))*0.5; //<- this may be wrong, use this instead?-> (c[i] + a[i])*0.5;
    }

    e1.normalize();

    var v1 = _gtc_v1;
    var v2 = _gtc_v2;

    v1[0] = -e1[1]; v1[1] = e1[0]; v1[2] = e1[2];
    v2[0] = -e2[1]; v2[1] = e2[0]; v2[2] = e2[2];

    v1.normalize();
    v2.normalize();

    for (var i=0; i<3; i++) {
      _gtc_p12[i] = (p1[i] ?? 0) + (v1[i] ?? 0);
      _gtc_p22[i] = (p2[i] ?? 0) + (v2[i] ?? 0);
    }

    var ret = line_isect(p1, _gtc_p12, p2, _gtc_p22)
    var cent = ret[0];

    e1.load(a); e2.load(b); e3.load(c);
    var r = e1.sub(cent).vectorLength()
    if (r < feps)
        r = e2.sub(cent).vectorLength()
    if (r < feps)
        r = e3.sub(cent).vectorLength()

    return [cent, r];
}

/* Dead. Returns [min, max] over the verts' coordinates. */
export function minmax_verts(verts : Iterable<{co : Coord3}>) {
  var min = new Vector3([1e12, 1e12, 1e12]);
  var max = new Vector3([-1e12, -1e12, -1e12]);

  for (var v of verts) {
    for (var i=0; i<3; i++) {
      min[i] = Math.min(min[i] ?? 0, v.co[i] ?? 0);
      max[i] = Math.max(max[i] ?? 0, v.co[i] ?? 0);
    }
  }

  return [min, max];
}

/* Dead, and module-local. */
function unproject(vec : Coord3, ipers : Matrix4, iview : Matrix4) {
  var newvec = new Vector3(vec);

  newvec.multVecMatrix(ipers);
  newvec.multVecMatrix(iview);

  return newvec;
}

/* Dead, and module-local. */
function project(vec : Coord3, pers : Matrix4, view : Matrix4) {
  var newvec = new Vector3(vec);

  newvec.multVecMatrix(pers);
  newvec.multVecMatrix(view);

  return newvec;
}

const _get_boundary_winding_cent = new Vector3();

/* Dead. True when the polygon winds counter-clockwise about its centroid;
   colinear spans are skipped so they cannot bias the average. */
function get_boundary_winding(points : Vector3[]) {
  const _cent = _get_boundary_winding_cent;

  var cent = _cent.zero();

  if (points.length == 0)
    return false; /*if no points, just return an arbitrary winding*/

  for (var i=0; i<points.length; i++) {
      cent.add(points[i]);
  }

  cent.divScalar(points.length); /* NOTE: was divideScalar(); it threw. */

  var w = 0, totw=0;
  for (var i=0; i<points.length; i++) {
    var v1 = points[i];
    var v2 = points[(i+1) % points.length];

    if (!colinear(v1, v2, cent)) {
      w += winding(v1, v2, cent) ? 1 : 0;
      totw += 1;
    }
  }

  if (totw > 0)
    w /= totw;

  return Math.round(w) == 1;
}

/*
  if (convex_quad(v1.co, v2.co, v3.co, v4.co)) {
    //make_tri_safe(m, v1, v2, v3);
    //make_tri_safe(m, v1, v3, v4);
  } else if (convex_quad(v1.co, v2.co, v4.co, v3.co)) {
    //make_tri_safe(m, v1, v2, v4);
    //make_tri_safe(m, v1, v4, v3);
  } else if (convex_quad(v2.co, v1.co, v3.co, v4.co)) {
    //make_tri_safe(m, v2, v1, v3);
    //make_tri_safe(m, v2, v3, v4);
  } else if (convex_quad(v2.co, v1.co, v4.co, v3.co)) {
    //make_tri_safe(m, v2, v1, v4);
   // make_tri_safe(m, v2, v4, v3);
  }
*/

const _po_gbw_p = new Vector3();

/*2 dimensional operation class; note that this is too slow
  for use on large, real-time operations like tesselation of
  complex polygons*/
export class PlaneOps {
  /* A permutation of [0, 1, 2] that maps the plane's two dominant axes onto
     x and y, so the flat 2D helpers above can be reused on a tilted plane. */
  axis : Number3[];

  constructor(normal : Coord3) {
    this.axis = [0, 0, 0];

    this.reset_axis(normal);
  }

  reset_axis(no : Coord3) {
    var ax : Number3, ay : Number3, az : Number3;
    var nx=Math.abs(no[0] ?? 0), ny=Math.abs(no[1] ?? 0), nz=Math.abs(no[2] ?? 0);

    if (nz > nx && nz > ny) {
      ax = 0; ay = 1; az = 2;
    } else if (nx > ny && nx > nz) {
      ax = 2; ay = 1; az = 0;
    } else {
      ax = 0; ay = 2; az = 1;
    }

    this.axis = [ax, ay, az];
  }

  convex_quad(v1 : Coord3, v2 : Coord3, v3 : Coord3, v4 : Coord3) {
    var ax = this.axis;

    return convex_quad(new Vector3([v1[ax[0]], v1[ax[1]], v1[ax[2]]]),
                       new Vector3([v2[ax[0]], v2[ax[1]], v2[ax[2]]]),
                       new Vector3([v3[ax[0]], v3[ax[1]], v3[ax[2]]]),
                       new Vector3([v4[ax[0]], v4[ax[1]], v4[ax[2]]]));
  }

  line_isect(v1 : Coord3, v2 : Coord3,
             v3 : Coord3, v4 : Coord3)
  {
    var ax = this.axis;
    var orig1 = new Vector3(v1), orig2 = new Vector3(v2);

    var ret = line_isect(new Vector3([v1[ax[0]], v1[ax[1]], v1[ax[2]]]),
                         new Vector3([v2[ax[0]], v2[ax[1]], v2[ax[2]]]),
                         new Vector3([v3[ax[0]], v3[ax[1]], v3[ax[2]]]),
                         new Vector3([v4[ax[0]], v4[ax[1]], v4[ax[2]]]), true);

    if (ret[1] == LINECROSS) {
      ret[0].load(orig2).sub(orig1).mulScalar(ret[2] ?? 0).add(orig1);
    }

    return ret;
  }

  line_line_cross(l1 : Coord3[], l2 : Coord3[]) {
    var ax = this.axis;

    var v1=l1[0], v2=l1[1], v3=l2[0], v4=l2[1];

    return line_line_cross([new Vector3([v1[ax[0]], v1[ax[1]], 0.0]),
                            new Vector3([v2[ax[0]], v2[ax[1]], 0.0])],
                           [new Vector3([v3[ax[0]], v3[ax[1]], 0.0]),
                            new Vector3([v4[ax[0]], v4[ax[1]], 0.0])]);
  }

  winding(v1 : Coord3, v2 : Coord3, v3 : Coord3) {
    var ax = this.axis

    if (v1 == undefined)
      console.trace();

    return winding(new Vector3([v1[ax[0]], v1[ax[1]], 0.0]),
                   new Vector3([v2[ax[0]], v2[ax[1]], 0.0]),
                   new Vector3([v3[ax[0]], v3[ax[1]], 0.0]));
  }

  colinear(v1 : Coord3, v2 : Coord3, v3 : Coord3) {
    var ax = this.axis

    return colinear(new Vector3([v1[ax[0]], v1[ax[1]], 0.0]),
                    new Vector3([v2[ax[0]], v2[ax[1]], 0.0]),
                    new Vector3([v3[ax[0]], v3[ax[1]], 0.0]));
  }

  get_boundary_winding(points : Coord3[]) {
    var cent = new Vector3();

    if (points.length == 0)
      return false; /*if no points, just return an arbitrary winding*/

    for (var i=0; i<points.length; i++) {
        cent.add(_po_gbw_p.load(points[i]));
    }

    cent.divScalar(points.length); /* NOTE: was divideScalar(); it threw. */

    var w = 0, totw=0;
    for (var i=0; i<points.length; i++) {
      var v1 = points[i];
      var v2 = points[(i+1) % points.length];

      if (!this.colinear(v1, v2, cent)) {
        w += this.winding(v1, v2, cent) ? 1 : 0;
        totw += 1;
      }
    }

    if (totw > 0)
      w /= totw;

    return Math.round(w) == 1;
  }
}

var _isrp_ret = new Vector3();
/* Dead. `d` is computed and never used, and the plane is treated as passing
   through planeorigin rather than at distance |planeorigin| along n. */
function isect_ray_plane(planeorigin : Vector3, planenormal : Vector3,
                         rayorigin : Vector3, raynormal : Vector3)
{
  var p = planeorigin, n = planenormal;
  var r = rayorigin, v = raynormal;
  var d = p.vectorLength();
  
  var t = -(r.dot(n) - p.dot(n)) / v.dot(n);
  
  _isrp_ret.load(v);
  _isrp_ret.mulScalar(t);
  _isrp_ret.add(r);
  
  return _isrp_ret;
}

/* Dead. `matrix` may be an externally-owned Matrix4 handed over by
   set_internal_matrix(), in which case update_func() notifies its owner. */
class Mat4Stack {
  stack : Matrix4[];
  matrix : Matrix4;
  update_func : (() => void) | undefined;

  constructor() {
    this.stack = []
    this.matrix = new Matrix4();
    this.matrix.makeIdentity();
    this.update_func = undefined;
  }

  set_internal_matrix(mat : Matrix4, update_func : () => void) {
    this.update_func = update_func;
    this.matrix = mat;
  }

  reset(mat : Matrix4) {
    this.matrix.load(mat);
    this.stack = [];
    
    if (this.update_func != undefined)
      this.update_func();
  }

  load(mat : Matrix4) {
    this.matrix.load(mat);
    if (this.update_func != undefined)
      this.update_func();
  }

  multiply(mat : Matrix4) {
    this.matrix.multiply(mat);
    if (this.update_func != undefined)
      this.update_func();
  }

  identity() {
    /* NOTE: was loadIdentity(), which Matrix4 has never had; the call threw. */
    this.matrix.makeIdentity();
    if (this.update_func != undefined)
      this.update_func();
  }

  //mat2 is optional
  push(mat2? : Matrix4) {
    this.stack.push(new Matrix4(this.matrix));
    
    if (mat2 != undefined) {
      this.matrix.load(mat2);
      
      if (this.update_func != undefined)
        this.update_func();
    }
  }

  /* NOTE: an empty stack used to reach load(undefined) and throw. */
  pop() {
    var mat = this.stack.pop();

    if (mat !== undefined) {
      this.matrix.load(mat);
    }

    if (this.update_func != undefined)
      this.update_func();

    return mat;
  }
}

var cos = Math.cos;
var sin = Math.sin;

/* Rotates in place by A radians; `axis` 1 reverses the direction. */
export function rot2d(vec : Coord, A : number, axis=0) {
  var x = vec[0];
  var y = vec[1];
  
  if (axis == 1) {
    vec[0] = x * cos(A) + y*sin(A);
    vec[1] = y * cos(A) - x*sin(A);
  } else {
    vec[0] = x * cos(A) - y*sin(A);
    vec[1] = y * cos(A) + x*sin(A);
  }
  
  return vec;
}
