"use strict";

import {ENABLE_MULTIRES} from '../config/config.js';

var PI = Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor,
    ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos,
    asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;

import * as bspline from './bspline.js';

import {
  MinMax
} from '../util/mathlib.js';

import {Vector2} from "../path.ux/scripts/pathux.js";

import {
  TPropFlags, PropTypes
} from '../core/toolprops.js';

import {STRUCT} from '../core/struct.js';
import * as math from '../util/mathlib.js';
import {DataPathNode, NodeBase} from '../core/eventdag.js';

var abs=Math.abs, acos=Math.acos, asin=Math.asin, 
    atan2=Math.atan2,PI=Math.PI, sqrt=Math.sqrt,pow=Math.pow,
    log=Math.log;

export * from './spline_base';

import {MultiResLayer, has_multires, ensure_multires, decompose_id, compose_id}
        from './spline_multires.js';
        
import {SplineTypes, SplineFlags, ClosestModes, IsectModes, RecalcFlags,
        MaterialFlags, CustomDataLayer, CustomData, CustomDataSet,
        SplineElement, CurveEffect} from './spline_base.js';
        
import {SelMask} from '../editors/viewport/selectmode.js';
import {ORDER, KSCALE, KANGLE, KSTARTX, KSTARTY, KSTARTZ, KTOTKS, INT_STEPS} from './spline_math.js';

import {
  eval_curve, spiraltheta, spiralcurvature, spiralcurvature_dv
} from './spline_math.js';

let eval_ret_vs = cachering.fromConstructor(Vector2, 512);
let evaluateSide_rets = cachering.fromConstructor(Vector2, 512);

import {bez3, bez4} from '../util/bezier.js';

let _seg_aabb_ret = [new Vector3(), new Vector3()];


export class SplineVertex extends SplineElement {
  flag     : boolean
  eid      : number
  hpair    : SplineVertex
  frames   : Object
  segments : Array<SplineSegment>;

  constructor(co) {
    super(SplineTypes.VERTEX);
    Vector2.prototype.initVector2.apply(this, arguments);

    this._no_warning = false;

    if (co !== undefined) {
      this[0] = co[0];
      this[1] = co[1];
    }

    this.type = SplineTypes.VERTEX;
    this.flag = SplineFlags.FRAME_DIRTY|SplineFlags.UPDATE;
    this.segments = [];
    this.eid = 0;
    this.frames = {};
    
    //handle variables
    this.hpair = undefined; //connected handle in shared tangents mode
  }

  get 2() {
    return 0.0;
  }

  set 2(val) {
    console.warn("Attempt to set [2] in SplineVertex!");
  }

  get width() {
    if (this.type !== SplineTypes.VERTEX) {
      //hrm, what to do for handles?
      console.warn("Dynamic vertex width not supported for handle vertices");
      return 0.0;
    }

    if (!this.segments) return 0.0; //happens in mixin code

    let tot = 0.0;
    let sum = 0.0;

    for (let s of this.segments) {
      tot++;
      sum += this === s.v1 ? s.w1 : s.w2;
    }

    return tot ? sum / tot : 0.0;
  }

  set width(w) {
    if (this.type !== SplineTypes.VERTEX) {
      //hrm, what to do for handles?
      console.warn("Dynamic vertex width not supported for handle vertices");
      return;
    }


    if (!this.segments) return;

    let old = this.width;

    if (w === 0.0) {
      console.warn("Cannot set width to zero");
      return;
    }

    if (isNaN(old) || old === 0.0) {
      console.warn("Corrupted width data; fixing...");
      for (let s of this.segments) {
        if (isNaN(s.w1) || s.w1 === 0.0)
          s.w1 = w;
        if (isNaN(s.w2) || s.w2 === 0.0)
          s.w2 = w;

        s.mat.update();
      }

      return;
    }

    let ratio = w / old;
    for (let s of this.segments) {
      if (this === s.v1)
        s.w1 *= ratio;
      else if (this === s.v2)
        s.w2 *= ratio;
      else
        throw new Error("spline mesh integrity error");

      s.mat.update();
    }


    //don't allow independent sizing for two-valence vertices

    if (this.segments.length === 2) {
      let s1 = this.segments[0];
      let s2 = this.segments[1];

      let w1 = this === s1.v1 ? s1.w1 : s1.w2;
      let w2 = this === s2.v1 ? s2.w1 : s2.w2;
      let w = (w1 + w2)*0.5;

      s1.setVertWidth(this, w);
      s2.setVertWidth(this, w);
    }
  }

  get shift() : number {
    if (!this.segments) return;

    if (this.segments.length !== 2) {
      return 0.0;
    }

    let tot = 0.0;
    let sum = 0.0;

    if (this.segments.length === 2) {
      let s1 = this.segments[0];
      let s2 = this.segments[1];

      let shift1 = this === s1.v1 ? s1.shift1 : s1.shift2;
      let shift2 = this === s2.v1 ? s2.shift1 : s2.shift2;

      if ((this === s1.v1) === (this === s2.v1)) {
        sum = shift1 - shift2;
      } else {
        sum = shift1 + shift2;
      }

      tot = 2.0;
    } else {
      for (let s of this.segments) {
        tot++;
        sum += this === s.v1 ? -s.shift1 : s.shift2;
      }
    }

    return tot ? sum / tot : 0.0;
  }

  set shift(w : number) {
    if (!this.segments || this.segments.length !== 2) return;

    let tot = 0.0;
    let sum = 0.0;

    let old = this.shift;
    let df = w - old;

    if (this.segments.length === 2) {
      let s1 = this.segments[0];
      let s2 = this.segments[1];

      let shift1 = this === s1.v1 ? s1.shift1 : s1.shift2;
      let shift2 = this === s2.v1 ? s2.shift1 : s2.shift2;

      if ((this === s1.v1) === (this === s2.v1)) {
        shift1 += df;
        shift2 -= df;
      } else {
        shift1 += df;
        shift2 += df;
      }

      if (this === s1.v1)
        s1.shift1 = shift1;
      else
        s1.shift2 = shift1;

      if (this === s2.v1)
        s2.shift1 = shift2;
      else
        s2.shift2 = shift2;

      s1.mat.update();
      s2.mat.update();
    } else {
      for (let s of this.segments) {
        if (this === s.v1) {
          s.shift1 += df;
        } else {
          s.shift2 += df;
        }

        s.mat.update();
      }
    }
  }

  set __shift(w : number) {
    if (!this.segments) return;

    let old = this.shift;
    let df = w - old;

    for (let s of this.segments) {
      if (this === s.v1) {
        s.shift1 -= df;
      } else {
        s.shift2 += df;
      }

      s.mat.update();
    }
  }

  static nodedef() {return {
    name : "SplineVertex",
    uiName : "SplineVertex",
    inputs : {},
    outputs : NodeBase.Inherit()
  }}

  get aabb() : array<Vector3> {
    let ret = _seg_aabb_ret;

    ret[0].load(this); ret[1].load(this);
    return ret;
  }
  
  sethide(state) {
    if (state)
      this.flag |= SplineFlags.HIDE;
    else
      this.flag &= ~SplineFlags.HIDE;
    
    if (this.type === SplineTypes.HANDLE)
      return;
      
    if (state) {
      for (var i=0; i<this.segments.length; i++) {
        this.segments[i].sethide(true);
      }
    } else {
      for (var i=0; i<this.segments.length; i++) {
        this.segments[i].sethide(false);
      }
    }
  }
  
  get hidden() {
    if (this.type === SplineTypes.VERTEX) {
      return !!(this.flag & SplineFlags.HIDE);
    } else {
      var s = this.owning_segment;
      
      return (this.flag & SplineFlags.HIDE) || !this.use || s.v1.hidden || s.v2.hidden;
    }
  }
  
  //get owning segment for handles
  get owning_segment() {
    return this.segments[0];
  }
  
  get owning_vertex() {
    return this.owning_segment.handle_vertex(this);
  }
  
  get use() {
    if (this.type !== SplineTypes.HANDLE) return true;
    
    var s = this.owning_segment;
    
    if (s === undefined) {
      console.warn("Corrupted handle detected", this.eid);
      return false;
    }
    
    var v = s.handle_vertex(this);
    
    var ret = v !== undefined && (v.segments !== undefined && v.segments.length > 2 || (v.flag & SplineFlags.USE_HANDLES));
    
    return ret;
  }
  
  set hidden(value : boolean) {
    if (value)
      this.flag |= SplineFlags.HIDE;
    else
      this.flag &= ~SplineFlags.HIDE;
  }

  other_segment(s : SplineSegment) : SplineSegment {
    if (s === this.segments[0]) s = this.segments[1];
    else if (s === this.segments[1]) s = this.segments[0];

    if (!s) {
      throw new Error("bad segment in SplineVertex.prototype.other_segment()");
    }
    if (s.v1 !== this && s.v2 !== this) {
      throw new Error("mesh integrity error");
    }

    return s;
  }
  
  toJSON() : any {
    var ret = {};
    
    ret.frame = this.frame;
    ret.segments = [];
    ret[0] = this[0];
    ret[1] = this[1];
    ret.frames = this.frames;
    ret.length = 3;
    
    for (var i=0; i<this.segments.length; i++) {
      if (this.segments[i] !== undefined)
        ret.segments.push(this.segments[i].eid);
    }
    
    ret.flag = this.flag;
    ret.eid = this.eid;
    
    return ret;
  }

  loadSTRUCT(reader : Function) {
    this._no_warning = true;

    reader(this);
    super.loadSTRUCT(reader);

    this._no_warning = false;

    this.load(this.co);
    delete this.co;
    
    for (let axis=0; axis<2; axis++) {
      if (isNaN(this[axis])) {
        console.warn("NaN vertex", this.eid);
        this[axis] = 0;
      }
    }
    
    return this;
  }
};

SplineVertex.STRUCT = STRUCT.inherit(SplineVertex, SplineElement) + `
  co       : vec2          | this;
  segments : array(e, int) | e.eid;
  hpair    : int           | this.hpair != undefined? this.hpair.eid : -1;
}
`;

mixin(SplineVertex, Vector2);

export class ClosestPointRecord {
  s    : number;
  co   : Vector2;
  sign : number;

  constructor() {
    this.s = 0;
    this.co = new Vector2();
    this.sign = 1.0;
  }

  reset() {
    this.sign = this.s = undefined;
    return this;
  }
}

var derivative_cache_vs = cachering.fromConstructor(Vector3, 64);
var closest_point_ret_cache_vs = cachering.fromConstructor(Vector3, 256);
var closest_point_ret_cache = cachering.fromConstructor(ClosestPointRecord, 256);

var closest_point_cache_vs = cachering.fromConstructor(Vector3, 512);

export class EffectWrapper extends CurveEffect {
  seg : SplineSegment;

  constructor(owner : SplineSegment) {
    super();
    this.seg = owner;
  }
  
  rescale(ceff, width : number) : number {
    //find owning segment by ascending to root curve effect
    while (ceff.prior !== undefined) {
      ceff = ceff.prior;
    }
    
    var seg1 = this.seg;
    var seg2 = ceff.seg;
    
    var l1 = seg1.length, l2 = seg2.length;
    
    //console.log("l1", l1, "l2", l2, "width", width);
    
    width = (width*l2)/l1;
    
    return width;
  }
  
  _get_nextprev(donext, flip_out) {
    var seg1 = this.seg;
    
    var v = donext ? seg1.v2 : seg1.v1;
    if (v.segments.length !== 2)
      return undefined;
    
    var seg2 = v.other_segment(seg1);
    
    flip_out[0] = (donext && seg2.v1 === v) || (!donext && seg2.v2 === v);
    
    return seg2._evalwrap;
  }

  evaluate(s : float) : Vector3 {
    return this.seg.evaluate(s, undefined, undefined, undefined, true);
  }
  
  derivative(s : float) : Vector3 {
    return this.seg.derivative(s, undefined, undefined, true);
  }
}

let intersect_rets = new cachering(() => {return {
  co : new Vector2(),
  targetS  : 0,
  sourceS  : 0
}}, 512);

let __static_minmax = new MinMax(2);
let __angle_temp = cachering.fromConstructor(Vector2, 64);

let bstmp1 = new Array(32);
let bstmp2 = new Array(32);

export class SplineSegment extends SplineElement {
  _evalwrap: EffectWrapper
  has_multires : boolean
  mat      : Material
  finalz   : number
  flag     : number
  eid      : number
  v1       : SplineVertex
  v2       : SplineVertex
  h1       : SplineVertex
  h2       : SplineVertex
  w1       : number
  w2       : number
  shift1   : number
  shift2   : number
  ks       : Array
  _last_ks : Array;

  /*
  get flag() {
    return this._flag;
  }

  set flag(v) {
    if (v & SplineFlags.UPDATE) {
      try {
        throw new Error();
      } catch (error) {
        let stack = "" + error.stack;
        if (stack.search("draw_spline") < 0) {
          window.d++;
        }
      }
      window.SplineSegment = SplineSegment;
    }
    this._flag = v;
  }
  //*/

  constructor(v1 : SplineVertex, v2 : SplineVertex) {
    super(SplineTypes.SEGMENT);
    
    this._evalwrap = new EffectWrapper(this);
    
    this.l = undefined;

    this.w1 = 1.0;
    this.w2 = 1.0;

    //shift
    this.shift1 = 0.0;
    this.shift2 = 0.0;

    this.v1 = v1;
    this.v2 = v2;
    
     //set by draw code.  represents id of
     //all segments that are topologically connected
    this.topoid = -1;
    
    /*same as this.topogroup, but only includes
      segments connected with 2-valence vertices,
      that exists in the same layer, and have the
      same stroke settings.
      */
    this.stringid = -1;
    
    this.has_multires = false;
    this.mat = new Material();

    //XXX this is kind of hackish, seting a callback this way
    this.mat.update = this._material_update.bind(this);
    
    this.z = this.finalz = 5;
    
    this._aabb = [new Vector3(), new Vector3()];
    
    //handles are SplineVerts too
    this.h1 = this.h2 = undefined;

    this.type = SplineTypes.SEGMENT;
    this.flag = 0;
    this.eid = 0;
    
    this.ks = new Array(KTOTKS);
    this._last_ks = new Array(KTOTKS);
    
    for (var i=0; i<this.ks.length; i++) {
      this.ks[i] = 0;
      this._last_ks[i] = 0;
    }
  }

  onDestroy() {
    native_api.onSegmentDestroy(this);
  }

  sinangle(v : SplineVertex) : number {
    if (v.segments.length === 2) {
      let s1 = this;
      let s2 = v.other_segment(s1);

      let t1 = __angle_temp.next();
      let t2 = __angle_temp.next();

      let v1 = s1.other_vert(v);
      let v2 = s2.other_vert(v);

      t1.load(v1).sub(v);
      t2.load(v2).sub(v);

      if (t1.dot(t1) < 0.00001 || t2.dot(t2) < 0.00001) {
        return 0.0;
      }

      t1.normalize();
      t2.normalize();

      let th = -(t1[0]*t2[1] - t1[1]*t2[0]);
      let eps = 0.0001;
      //th = t1.dot(t2);

      th = th*(1.0 - eps*2.0) + eps*Math.sign(th);

      //th = Math.sin(Math.acos(th));
      //th = 1.0 - Math.abs(th);

      return th;//Math.asin(th);
    }

    return 0.0;
  }

  shift(s : number) : number {
    s = s*s*(3.0 - 2.0*s);

    /*
    let th1 = this.sinangle(this.v1);
    let th2 = this.sinangle(this.v2);
    let th = th1 + (th1 - th2)*s;

    th *= 0.25;
    //*/

    let ret = this.shift1 + (this.shift2 - this.shift1)*s;
    //ret += th;

    return ret;
  }

  dshift(s : number) : number {
    let df = 0.0001;
    let a = this.shift(s-df);
    let b = this.shift(s+df);

    return (b - a) / (2.0*df);
  }

  dwidth(s : number) : number { //should be linear
    let df = 0.0001;
    let a = this.width(s-df);
    let b = this.width(s+df);

    return (b - a) / (2.0*df);
  }

  setVertWidth(v : SplineVertex, w : number) {
    if (w === undefined || isNaN(w)) {
      console.warn("Got bad width data", w);
    }

    if (v === this.v1) {
      this.w1 = w;
    } else if (v === this.v2) {
      this.w2 = w;
    } else {
      console.log(this, v, "bleh");
      throw new Error("vertex not in edge " + v)
    }
  }

  /*
  on factor;
  off period;

  fp := k1 + k2*s + k3*s*s + k4*s*s*s + k5*s**4 + k6*s**5;

  f1 := sub(s=0, fp);
  f2 := sub(s=1, fp) - 1.0;
  f3 := sub(s=0, df(fp, s));
  f4 := sub(s=1, df(fp, s));
  f5 := sub(s=0, df(fp, s, 2));
  f6 := sub(s=1, df(fp, s, 2));

  ff := solve({f1, f2, f3, f4, f5, f6}, {k1, k2, k3, k4, k5, k6});

  f := 10*s**3 - 15*s**4 + 6*s**5;
  **/

  widthFunction(s : number) : number {
    //if (window.dd === 1) {
    //s = (6 * s ** 2 - 15 * s + 10) * s ** 3; //degree 5 smoothstep

    //} else if (window.dd !== 2) {
    //  s = s*s*(3.0 - 2.0*s); //degree 3 smoothstep
    //}

    return s;
  }

  width2(s : number) : number {
    //return this.w1 + (this.w2 - this.w1)*s;

    let this2 = this;
    let seg = this;
    let v;
    let len;

    function walk() {
      let lastv = v;

      if (v.segments.length === 2) {
        seg = v.other_segment(seg);
        v = seg.other_vert(v);
      }

      //len = lastv.vectorDistance(v);
      len = seg.length;
      len = Math.max(len, 0.0001);

      return (v === seg.v1 ? seg.w1 : seg.w2) * seg.mat.linewidth;
    }

    v = this.v1;
    seg = this;

    let l0b, l0, l1, l2, l3, l4, l5, l6, l7, l8;


    l3 = Math.max(seg.length, 0.0001);
    l4 = l3;

    let w3 = this.w1*this.mat.linewidth;
    let w2 = walk(); l2 = len;
    let w1 = walk(); l1 = len;
    let w0 = walk(); l0 = len;
    let w0b = walk(); l0b = len;

    //let w1 = walk();


    seg = this;
    v = this.v2;

    let w4 = this.w2*this.mat.linewidth;
    let w5 = walk(); l5 = len;
    let w6 = walk(); l6 = len;
    let w7 = walk(); l7 = len;
    let w8 = walk(); l8 = len;
    seg = this;

    //let w8 = walk();

    let ks = bstmp1;
    let ws = bstmp2;

    bstmp1.length = 5;
    bstmp2.length = 5;

    ks[0] = -l0-l1-l2;
    ks[1] = -l1-l2;
    ks[2] = -l2;
    ks[3] = 0;
    ks[4] = l4;
    ks[5] = l4+l5;
    ks[6] = l4+l5+l6
    ks[7] = l4+l5+l6+l7;

    ws[0] = w2;
    ws[1] = w3;
    ws[2] = w4;
    ws[3] = w5;
    ws[4] = w6;
    ws[5] = w7;
    ws[6] = w8;
    //ws[7] = w9;

    if (l4 === 0.0) {
      return 0.0;
    }

    s *= l4;

    let sum = 0.0;

    sum = bspline.deBoor(3, s, ks, ws, 3);

    for (let i=0; i<0; i++) {
      let w =  bspline.basis(s, i, 3, ks, true);

      if (isNaN(w)) {
        console.warn(ks, ws);
        throw new Error("NaN");
      }
      sum += w*ws[i];
    }

    return sum;
    return w3 + (w4 - w3)*s;

    //k3=k4 = 0.0;
    return (w2*k2 + w3*k3 + w4*k4 + w5*k5) / (k2 + k3 + k4 + k5);


    let d1 = (w4 - w2) / l2 / (l2+l3) * 0.5;
    let d2 = (w5 - w3) / l5 / (l4+l5) * 0.5;

    d1 /= 3.0;
    d2 /= 3.0;

    return bez4(w3, w3+d1, w4-d2, w4, s);
  }

  width(s : number) : number {
    return this.width2(s);

    s = this.widthFunction(s);

    let wid1 = this.mat.linewidth;
    let wid2 = this.mat.linewidth;

    if (this.v1.segments.length === 2) {
      wid1 += (this.v1.other_segment(this).mat.linewidth*0.5+wid1*0.5 - wid1)*(1.0 - s);
    }

    if (this.v2.segments.length === 2) {
      wid2 += (this.v2.other_segment(this).mat.linewidth*0.5+wid2*0.5 - wid2)*s;
    }

    wid1 *= this.w1;
    wid2 *= this.w2;

    return wid1 + (wid2 - wid1)*s;
  }

  _material_update() {
    this.flag |= SplineFlags.REDRAW|SplineFlags.FRAME_DIRTY|SplineFlags.UPDATE;
    this.v1.flag |= SplineFlags.UPDATE;
    this.v2.flag |= SplineFlags.UPDATE;
  }

  get aabb() : Array<Vector3> {
    if (this.flag & SplineFlags.UPDATE_AABB)
      this.update_aabb();
      
    return this._aabb;
  }
  
  set aabb(val : Array<Vector3>) {
    this._aabb = val;
  }
  
  _update_has_multires() {  
    this.has_multires = false;
    
    for (var i=0; i<this.cdata.length; i++) {
      if (this.cdata[i] instanceof MultiResLayer) {
        this.has_multires = true;
        break;
      }
    }
  }
  
  update_aabb(steps : number = 8) {
    this._update_has_multires();
    
    this.flag &= ~SplineFlags.UPDATE_AABB;
    
    var min = this._aabb[0], max = this._aabb[1];
    let minmax = __static_minmax;

    minmax.reset();
    min.zero(); max.zero();
    
    var co = this.evaluate(0);
    minmax.minmax(co);
    
    var ds = 1.0/(steps-1);
    for (let i=0, s=0; i<steps; i++, s += ds) {
      
      var co = this.evaluate(s*0.999999999);
      minmax.minmax(co);
    }
    
    min.load(minmax.min);
    max.load(minmax.max);
  }

  intersect(seg : SplineSegment, side1 : boolean = false, side2 : boolean = false, mode : number = IsectModes.CLOSEST) {
    if (this.flag & SplineFlags.COINCIDENT) {
      return undefined;
    }


    let steps = 5;
    let lastco = undefined, lastno;

    let p1 = new Vector2();
    let p2 = new Vector2();
    let p3 = new Vector2();
    let p4 = new Vector2();

    let mindis = undefined;
    let minret = new Vector2();
    let mins, mins2;

    let s = 0, ds = 1.0 / (steps-1);

    for (let i=0; i<steps; i++, s += ds) {
      let s1 = s, s2 = s + ds;

      let co1 = this.evaluateSide(s1, side1);
      let co2 = this.evaluateSide(s2, side1);

      let cl1 = seg.closest_point(co1, ClosestModes.CLOSEST, undefined, side2);
      let cl2 = seg.closest_point(co2, ClosestModes.CLOSEST, undefined, side2);

      let p1 = cl1.co;
      let p2 = cl2.co;
      if (cl1.sign !== cl2.sign) {
        for (let bi=0; bi<2; bi++) {
          let s3 = (s1 + s) * 0.5;
          let s4 = (s2 + s) * 0.5;

          for (let j = 0; j < 2; j++) {
            let s5 = j ? s4 : s3;

            let co3 = this.evaluateSide(s5, side1);
            let cl3 = seg.closest_point(co3, ClosestModes.CLOSEST, undefined, side2);

            if (cl3.sign !== cl1.sign) {
              s2 = s5;
              break;
            } else if (cl3.sign !== cl2.sign) {
              s1 = s5;
              break;
            }
          }

          s = (s1 + s2) * 0.5;
        }

        co1 = this.evaluateSide(s1, side1);
        cl1 = seg.closest_point(co1, ClosestModes.CLOSEST, undefined, side2);
        let dis1

        if (mode === IsectModes.START) {
          dis1 = cl1.s;
        } else if (mode === IsectModes.END) {
          dis1 = 1.0 - cl1.s;
        } else if (mode === IsectModes.ENDSTART) {
          dis1 = 1.0 - Math.abs(cl1.s - 0.5)*2.0;
        } else {
          dis1 = co1.vectorDistance(cl1.co);
        }

        if (mindis === undefined || dis1 < mindis) {
          minret.load(co1);
          mins = cl1.s;
          mins2 = s1;
          mindis = dis1;
        }
      }
    }

    if (mindis !== undefined) {
      let ret = intersect_rets.next();

      ret.co.load(minret);
      ret.targetS = mins;
      ret.sourceS = mins2;

      return ret;
    }

    return undefined;
  }

  /**
   @widthSide if undefined, stroke boundary with be evaluated; should be 0 or 1 (or undefined)
   */
  closest_point(p : Vector2, mode : ClosestModes, fast : boolean=false,
                widthSide=undefined) : ClosestPointRecord
  {
    if (this.flag & SplineFlags.COINCIDENT) {
      return undefined;
    }

    var minret = undefined, mindis = 1e18, maxdis=0;
    
    var p2 = closest_point_cache_vs.next().zero();
    for (var i=0; i<p.length; i++) {
      p2[i] = p[i];
    }
    p = p2;
    
    if (mode === undefined) mode = 0;
    var steps=5, s = 0, ds = 1.0/(steps);
    
    var n = closest_point_cache_vs.next();
    var n1 = closest_point_cache_vs.next(), n2 = closest_point_cache_vs.next();
    var n3 = closest_point_cache_vs.next(), n4 = closest_point_cache_vs.next();
    
    if (mode === ClosestModes.ALL)
      minret = [];

    let d1 = closest_point_cache_vs.next();
    let d2 = closest_point_cache_vs.next();
    let dm = closest_point_cache_vs.next();

    for (var i=0; i<steps; i++, s += ds) {
      var start = s-0.00001, end = s+ds+0.00001;
      
      start = Math.min(Math.max(start, 0.0), 1.0);
      end   = Math.min(Math.max(end, 0.0), 1.0);
      
      var mid = (start+end)*0.5;
      var bad = false;
      
      var angle_limit = fast ? 0.65 : 0.2;
      
      var steps = fast ? 5 : 20;
      for (var j=0; j<steps; j++) {
        mid = (start+end)*0.5;

        let co, sco, eco;

        if (widthSide !== undefined) {
          co = this.evaluateSide(start, widthSide, undefined, d1);
          sco = this.evaluateSide(mid, widthSide, undefined, dm);
          eco = this.evaluateSide(end, widthSide, undefined, d2);

          d1.normalize();
          d2.normalize();
          dm.normalize();
        } else {
          co = this.evaluate(mid, undefined, undefined, undefined, true);
          sco = this.evaluate(start, undefined, undefined, undefined, true);
          eco = this.evaluate(end, undefined, undefined, undefined, true);

          d1.load(this.normal(start, true).normalize());
          dm.load(this.normal(mid, true).normalize());
          d2.load(this.normal(end, true).normalize());
        }

        sco[2] = eco[2] = co[2] = 0.0;

        n1.load(sco).sub(p).normalize();
        n2.load(eco).sub(p).normalize();
        n.load(co).sub(p);
        n[2] = 0.0;
        n.normalize();

        if (n1.dot(d1) < 0.0) d1.negate();
        if (n2.dot(d2) < 0.0) d2.negate();
        if (n.dot(dm) < 0) dm.negate();
        
        var mang = acos(n.normalizedDot(dm));
        if (mang < 0.001) 
          break;
        
        var ang1 = acos(n1.normalizedDot(d1));
        var ang2 = acos(n2.normalizedDot(d2));

        var w1 = n1.cross(d1)[2] < 0.0;
        var w2 = n2.cross(d2)[2] < 0.0;
        var wm = n.cross(dm)[2] < 0.0;
        
        if (isNaN(mang)) {
          if (!window.__adssad)
            window.__adssad = 0;

          if (time_ms() - window.__adssad > 500) {
            console.warn("NaN!", p, co, mid, dm, n, mang);
            window.__adssad = time_ms();

            mang = 0.0;
            n.zero();
          }
          //throw new Error("NaN!");
        }
        
        if (j === 0 && w1 === w2) {
          bad = true;
          break
        } else if (w1 === w2) {
          //break;
        }

        if (w1 === w2) {
          //var dis1 = sco.vectorDistance(p), dis2 = eco.vectorDistance(p), dism = co.vectorDistance(p);
          var dis1, dis2;
          
          dis1 = ang1, dis2 = ang2;
          //console.log("w1===w2", w1, w2, dis1.toFixed(4), dis2.toFixed(4), dism.toFixed(4));
          
          if (dis2 < dis1) {
            start = mid;
          } else if (dis1 < dis2) {
            end = mid;
          } else {
            break;
          }
        } else if (wm === w1) {
          start = mid;
        } else {
          end = mid;
        }
      }
      
      if (bad) 
        continue;
        
      //make sure angle is close enough to 90 degrees for our purposes. . .
      let co;

      if (widthSide) {
        co = this.evaluateSide(mid, widthSide, undefined, n1);
        n1.normalize();
      } else {
        co = this.evaluate(mid, undefined, undefined, undefined, true);
        n1.load(this.normal(mid, true)).normalize();
      }

      n2.load(co).sub(p).normalize();
      let sign = 1.0;

      if (n2.dot(n1) < 0) {
        sign = -1.0;
        n2.negate();
      }
      
      var angle = acos(Math.min(Math.max(n1.dot(n2), -1), 1));
      if (angle > angle_limit)
        continue;
      
      if (mode !== ClosestModes.ALL && minret === undefined) {
        minret = closest_point_ret_cache.next().reset();
      }
      
      //did we come up empty?
      var dis = co.vectorDistance(p);

      if (mode === ClosestModes.CLOSEST) {
        if (dis < mindis) {
          minret.co.load(co);
          minret.s = mid;
          minret.sign = sign;
          mindis = dis;
        }
      } else if (mode === ClosestModes.START) {
        if (mid < mindis) {
          minret.co.load(co);
          minret.s = mid;
          minret.sign = sign;
          mindis = mid;
        }
      } else if (mode === ClosestModes.END) {
        if (mid > maxdis) {
          minret.co.load(co);
          minret.s = mid;
          minret.sign = sign;
          maxdis = mid;
        }
      } else if (mode === ClosestModes.ALL) {
        let ret = closest_point_ret_cache.next().reset();
        ret.co.load(co);
        ret.s = mid;
        ret.sign = sign;

        minret.push(ret);
      }
    }
    
    if (minret === undefined && mode === ClosestModes.CLOSEST) {
      var dis1 = this.v1.vectorDistance(p), dis2 = this.v2.vectorDistance(p);
      
      minret = closest_point_ret_cache.next().reset();
      minret.co.load(dis1 < dis2 ? this.v1 : this.v2);
      minret.s = dis1 < dis2 ? 0.0 : 1.0;
      minret.sign = 1.0;
    } else if (minret === undefined && mode === ClosestModes.START) {
      minret = closest_point_ret_cache.next();
      minret.co.load(this.v1);
      minret.s = 0.0;
      minret.sign = 1.0;
    } if (minret === undefined && mode === ClosestModes.END) {
      minret = closest_point_ret_cache.next();
      minret.co.load(this.v2);
      minret.s = 1.0;
      minret.sign = 1.0;
    }


    return minret;
  }
  
  normal(s : number, no_effects : boolean=!ENABLE_MULTIRES) {
    if (this.flag & SplineFlags.COINCIDENT) {
      return derivative_cache_vs.next().zero();
    }

    var ret = this.derivative(s, undefined, undefined, no_effects);
    var t = ret[0]; ret[0] = -ret[1]; ret[1] = t;
    
    ret.normalize();
    return ret;
  }
  
  ends(v : SplineVertex) : number {
    if (v === this.v1) return 0.0;
    if (v === this.v2) return 1.0;
  }
  
  handle(v : SplineVertex) : SplineVertex {
    if (v === this.v1) return this.h1;
    if (v === this.v2) return this.h2;
  }
  
  handle_vertex(h : SplineVertex) : SplineVertex {
    if (h === this.h1) return this.v1;
    if (h === this.h2) return this.v2;
  }
  
  get is_line() {
    var r1 = (this.v1.flag & SplineFlags.BREAK_TANGENTS);// || this.v1.segments.length > 2;
    var r2 = (this.v2.flag & SplineFlags.BREAK_TANGENTS);// || this.v2.segments.length > 2;
    
    return r1 && r2;
  }
  
  get renderable() : boolean {
    return !(this.flag & SplineFlags.NO_RENDER);
  }
  
  set renderable(val : boolean) {
    if (!val)
      this.flag |= SplineFlags.NO_RENDER;
    else
      this.flag &= ~SplineFlags.NO_RENDER;
  }
  
  update_handle(h : SplineVertex) {
    var ov = this.handle_vertex(h);
    
    if (h.hpair !== undefined) {
      var seg = h.hpair.owning_segment;
      var v = this.handle_vertex(h);
      
      var len = h.hpair.vectorDistance(v);
      
      h.hpair.load(h).sub(v).negate().normalize().mulScalar(len).add(v);
      seg.update();
      
      return h.hpair;
    } else if (ov.segments.length === 2 && h.use && !(ov.flag & SplineFlags.BREAK_TANGENTS)) {
      var h2 = h.owning_vertex.other_segment(h.owning_segment).handle(h.owning_vertex);
      var hv = h2.owning_segment.handle_vertex(h2), len = h2.vectorDistance(hv);
      
      h2.load(h).sub(hv).negate().normalize().mulScalar(len).add(hv);
      
      h2.owning_segment.update();
      
      return h2;
    }
  }
  
  other_handle(h_or_v : SplineVertex) : SplineVertex {
    if (h_or_v === this.v1)
      return this.h2;
    if (h_or_v === this.v2)
      return this.h1;
    if (h_or_v === this.h1)
      return this.h2;
    if (h_or_v === this.h2)
      return this.h1;
  }
  
  get length() : number {
      return this.ks[KSCALE];
  }

  toJSON() {
    var ret = {};
    
    ret.frames = this.frames;
    ret.ks = []
    for (var i=0; i<this.ks.length; i++) {
      ret.ks.push(this.ks[i]);
    }
    
    ret.v1 = this.v1.eid;
    ret.v2 = this.v2.eid;
    
    ret.h1 = this.h1 !== undefined ? this.h1.eid : -1;
    ret.h2 = this.h2 !== undefined ? this.h2.eid : -1;
    
    ret.eid = this.eid;
    ret.flag = this.flag;
    
    return ret;
  }
  
  curvature(s : number, order : int, override_scale : number) {
    if (order === undefined) order = ORDER;

    if (this.flag & SplineFlags.COINCIDENT) {
      return 0.0;
    }

    /*
    let df = 0.0001;
    let dv = this.derivative(s);
    let dv2 = this.derivative(s+df);

    dv2.sub(dv).mulScalar(1.0 / df);

    return (dv[0]*dv2[1] - dv[1]*dv2[0]) / Math.pow(dv[0]*dv[0] + dv[1]*dv[1], 3.0/2.0);
    //*/

    //update ks[KSCALE], final 1 prevents final evaluation
    //to save performance
    eval_curve(this,0.5, this.v1, this.v2, this.ks, order, 1);
    
    var k = spiralcurvature(s, this.ks, order);
    return k/(0.00001 + this.ks[KSCALE]);
  }
  
  curvature_dv(s : number, order : int, override_scale : number) : number {
    if (order === undefined) order = ORDER;

    if (this.flag & SplineFlags.COINCIDENT) {
      return 0.0;
    }

    //update ks[KSCALE], final 1 prevents final evaluation
    //to save performance
    eval_curve(this, 0.5, this.v1, this.v2, this.ks, order, 1);
    
    var k = spiralcurvature_dv(s, this.ks, order);
    return k/(0.00001 + this.ks[KSCALE]);
  }
  
  derivative(s : number, order : int, no_update_curve : boolean, no_effects : boolean) : Vector2 {
    if (this.flag & SplineFlags.COINCIDENT) {
      return derivative_cache_vs.next().zero();
    }

    /*
    let df = 0.0001;
    if (s < 1.0 - df) {
      let a = this.evaluate(s);
      let b = this.evaluate(s+df);
      
      return b.sub(a).mulScalar(1.0 / df);
    } else {
      let a = this.evaluate(s-df);
      let b = this.evaluate(s);
  
      return b.sub(a).mulScalar(1.0 / df);
    }
    //*/
    if (order === undefined) order = ORDER;

    var ret = derivative_cache_vs.next().zero();

    //update ks[KANGLE], final '1' argument prevents final evaluation
    //to save performance
    var ks = this.ks;
    
    if (!no_update_curve)
      eval_curve(this, 0.5, this.v1, this.v2, ks, order, 1);
    
    var th = spiraltheta(s, ks, order);
    var k = spiralcurvature(s, ks, order);
    
    var ang = ks[KANGLE];
    
    ret[0] = sin(th+ang)*ks[KSCALE];
    ret[1] = cos(th+ang)*ks[KSCALE];
    if (ret.length > 2)
      ret[2] = 0.0;
    
    return ret;
  }
  
  theta(s : number, order : int, no_effects : boolean) {
    if (order === undefined) order = ORDER;
    return spiraltheta(s, this.ks, order)*this.ks[KSCALE];
  }
  
  offset_eval(s : number, offset, order : int, no_update : boolean) {
    if (order === undefined) order = ORDER;
    
    var ret = this.evaluate(s, order, undefined, no_update);
    if (offset === 0.0) return ret;
    
    var tan = this.derivative(s, order, no_update);
    
    var t = tan[0]; tan[0] = -tan[1]; tan[1] = t;
    
    tan.normalize().mulScalar(offset);
    
    ret.add(tan);
    return ret;
  }

  curvatureSide(s : number, side : int, no_out : Vector2) {
    let df = 0.0001;
    let dv0 = this.evaluateSide(s, side);
    let dv1 = this.evaluateSide(s+df, side);
    let dv2 = this.evaluateSide(s+df*2, side);

    dv2.sub(dv1).mulScalar(1.0 / df);
    dv1.sub(dv0).mulScalar(1.0 / df);
    dv2.sub(dv1).mulScalar(1.0 / df);

    let k = (dv1[0]*dv2[1] - dv1[1]*dv2[0]) / Math.pow(dv1.dot(dv1), 3.0/2.0);

    if (no_out) {
      dv1.normalize();
      let t = dv1[0];
      dv1[0] = -dv1[1];
      dv1[1] = t;

      no_out[0] = dv1[0];
      no_out[1] = dv1[1];
    }

    return k;
  }

  /*
  on factor;
  on rounded;
  off period;

  operator x, y, k, lw;

  forall s let df(x(s), s, 2) = -df(y(s), s)*k(s);
  forall s let df(y(s), s, 2) = df(x(s), s)*k(s);

  offx := x(s) - df(y(s), s)*lw(s)*0.5/seglen;
  offy := y(s) + df(x(s), s)*lw(s)*0.5/seglen;


  df(offx, s);
  df(offy, s);
  */
  evaluateSide(s, side=0, dv_out, normal_out, lw_dlw_out) {
    if (this.flag & SplineFlags.COINCIDENT) {
      if (dv_out) {
        dv_out[0] = dv_out[1] = 0.0;
      }

      if (normal_out) {
        normal_out[0] = normal_out[1] = 0.0;
      }

      if (lw_dlw_out) {
        lw_dlw_out[0] = lw_dlw_out[1] = 0.0;
      }

      return evaluateSide_rets.next().load(this.v1);
    }

    side = -(side*2.0 - 1.0);

    let co = evaluateSide_rets.next().load(this.evaluate(s));

    let dv = this.derivative(s);
    let shift = this.shift(s)*side;
    let dshift = this.dshift(s)*side;

    let lw = this.width(s)*side;
    let dlw = this.dwidth(s)*side;

    dlw = dlw*shift + dlw + dshift*lw;
    lw = lw + lw*shift;

    let dx = -dv[1]*lw*0.5/this.length;
    let dy = dv[0]*lw*0.5/this.length;

    if (normal_out) {
      normal_out[0] = dx;
      normal_out[1] = dy;
    }

    if (lw_dlw_out) {
      lw_dlw_out[0] = lw;
      lw_dlw_out[1] = dlw;
    }

    if (dv_out) {
      let seglen = this.length;

      let k = -seglen*this.curvature(s);
      let dx2 = (-0.5*(dlw*dv[1] + dv[0]*k*lw - 2*dv[0]*seglen)) / seglen;
      let dy2 = ( 0.5*(dlw*dv[0] - dv[1]*k*lw + 2*dv[1]*seglen)) / seglen;
      dv_out[0] = dx2;
      dv_out[1] = dy2;
    }

    co[0] += dx;
    co[1] += dy;

    return co;
  }

  evaluate(s : number, order, override_scale, no_update, no_effects=!ENABLE_MULTIRES) : Vector2 {
    if (this.flag & SplineFlags.COINCIDENT) {
      return eval_ret_vs.next().load(this.v1);
    }

    if (no_effects) {
      if (order === undefined) order = ORDER;
      
      //check if scale is invalid
      //if (this.ks[KSCALE] == undefined || this.ks[KSCALE] == 0)
      //  eval_curve(this, 1, this.v1, this.v2, this.ks, order, undefined, no_update);
      //s /= this.ks[KSCALE];
      
      s = (s + 0.00000001) * (1.0 - 0.00000002);
      s -= 0.5;
      
      var co = eval_curve(this, s, this.v1, this.v2, this.ks, order, undefined, no_update);
      //var co = new Vector3(this.v2).sub(this.v1).mulScalar(t).add(this.v1);
      
      return eval_ret_vs.next().load(co);
    } else {
      var wrap = this._evalwrap;
      var last = wrap;
      
      for (var i=0; i<this.cdata.length; i++) {
        if (this.cdata[i].constructor._getDef().hasCurveEffect) {
          var eff = this.cdata[i].curve_effect(this);
          eff.set_parent(last);
          
          last = eff;
        }
      }
      
      return eval_ret_vs.next().load(last.evaluate(s));
    }
  }
  
  post_solve() {
    super.post_solve();
  }

  updateCoincident() {
    if (this.v1.vectorDistance(this.v2) < 0.001) {
      this.flag |= SplineFlags.COINCIDENT;
    } else {
      this.flag &= ~SplineFlags.COINCIDENT;
    }
  }

  update() {
    this.updateCoincident();
    this._update_has_multires();
    
    this.flag |= SplineFlags.UPDATE|SplineFlags.UPDATE_AABB;
    this.h1.flag |= SplineFlags.UPDATE;
    this.h2.flag |= SplineFlags.UPDATE;
    
    //need to code a post_solve_update type method
    //update cdata
    for (var i=0; i<this.cdata.length; i++) {
      this.cdata[i].update(this);
    }
    
    var l = this.l;
    if (l == undefined) return;
    
    var c = 0;
    do {
      if (c++ > 10000) {
        console.log("Infinte loop detected!");
        break;
      }
      
      l.f.update();
      l = l.radial_next;
    } while (l != undefined && l != this.l);
  }
  
  global_to_local(s, fixed_s=undefined) {
    return this._evalwrap.global_to_local(s, fixed_s);
  }
  
  local_to_global(p) {
    return this._evalwrap.local_to_global(p);
  }
  
  shared_vert(s) {
    if (this.v1 === s.v1 || this.v1 === s.v2) return this.v1;
    if (this.v2 === s.v1 || this.v2 === s.v2) return this.v2;
  }
  
  other_vert(v) {
    if (v === this.v1) return this.v2;
    if (v === this.v2) return this.v1;

    console.log(this.v1.eid, this.v2.eid, v ? v.eid : v, this.eid, v);

    throw new Error("vertex not in segment: " + (v ? v.eid : v));
  }

  loadSTRUCT(reader) {
    reader(this);
    super.loadSTRUCT(reader);

    this.flag &= ~(SplineFlags.UPDATE|SplineFlags.REDRAW);

    //XXX this is kind of hackish, seting a callback this way
    this.mat.update = this._material_update.bind(this);
  }
}

SplineSegment.STRUCT = STRUCT.inherit(SplineSegment, SplineElement) + `
  ks       : array(float);
  
  v1       : int | obj.v1.eid;
  v2       : int | obj.v2.eid;
  
  h1       : int | obj.h1 != undefined ? obj.h1.eid : -1;
  h2       : int | obj.h2 != undefined ? obj.h2.eid : -1;
  
  w1       : float;
  w2       : float;
  
  shift1   : float;
  shift2   : float;
  
  l        : int | obj.l != undefined  ? obj.l.eid : -1;
  
  mat      : Material;

  aabb     : array(vec3);
  z        : float;
  finalz   : float;
  has_multires : int;
  
  topoid   : int;
  stringid : int;
}
`;

export class SplineLoop extends SplineElement {
  constructor(f, s, v) {
    super(SplineTypes.LOOP);
    
    this.f = f, this.s = s, this.v = v;
    
    this.next = this.prev = undefined;
    this.radial_next = this.radial_prev = undefined;
  }
  
  static fromSTRUCT(reader) {
    var ret = new SplineLoop();
    reader(ret);
    return ret;
  }
}
SplineLoop.STRUCT = STRUCT.inherit(SplineLoop, SplineElement) + `
    f    : int | obj.f.eid;
    s    : int | obj.s.eid;
    v    : int | obj.v.eid;
    next : int | obj.next.eid;
    prev : int | obj.prev.eid;
    radial_next : int | obj.radial_next != undefined ? obj.radial_next.eid : -1;
    radial_prev : int | obj.radial_prev != undefined ? obj.radial_prev.eid : -1;
  }
`;

class SplineLoopPathIter {
  ret : Object;

  constructor(path) {
    this.path = path;
    this.ret = {done : false, value : undefined};
    this.l = path != undefined ? path.l : undefined;
  }
  
  init(path) {
    this.path = path;
    this.l = path.l;
    this.ret.done = false;
    this.ret.value = undefined;
    
    return this;
  }
  
  next() {
    var ret = this.ret;
    
    if (this.l == undefined) {
      ret.done = true;
      ret.value = undefined;
      return ret;
    }
    
    ret.value = this.l;
    this.l = this.l.next;
    
    if (this.l === this.path.l)
      this.l = undefined;
    
    return ret;
  }
  
  reset() {
    this.l = this.path.l;
    this.ret.done = false;
    this.ret.value = undefined;
  }
}

export class SplineLoopPath {
  winding : number;

  constructor(l, f) {
    this.l = l;
    this.f = f;
    this.totvert = undefined;
    this.winding = 0;
  }
  
  [Symbol.iterator]() {
    if (this.itercache === undefined) {
      this.itercache = cachering.fromConstructor(SplineLoopPathIter, 4);
    }
    
    return this.itercache.next().init(this);
  }
  
  update_winding() {
    static cent = new Vector3();
    
    cent.zero();
    for (var l of this) {
      cent.add(l.v);
    }
    
    cent.mulScalar(1.0/this.totvert);
    
    var wsum = 0;
    for (var l of this) {
      wsum += math.winding(l.v, l.next.v, cent) ? 1 : -1; 
    }
    
    this.winding = wsum >= 0;
  }
  
  asArray() {
    var l = this.l;
    var ret = [];
    
    do {
      ret.push(l);
      l = l.next;
    } while (l !== this.l);
    
    return ret;
  }
  
  static fromSTRUCT(reader) {
    var ret = new SplineLoopPath();
    reader(ret);
    
    var l = ret.l = ret.loops[0];
    l.p = ret;
    
    for (var i=1; i<ret.loops.length; i++) {
      l.next = ret.loops[i];
      ret.loops[i].prev = l;
      
      ret.loops[i].p = ret;
      l = ret.loops[i];
    }
    
    ret.loops[0].prev = ret.loops[ret.loops.length-1];
    ret.loops[ret.loops.length-1].next = ret.loops[0];
    
    delete ret.loops;
    return ret;
  }
}
SplineLoopPath.STRUCT = ` 
  SplineLoopPath {
    totvert : int;
    loops   : array(SplineLoop) | obj.asArray();
    winding : int;
  }
`;

export class SplineFace extends SplineElement {
  finalz : number
  mat : Material
  paths : GArray;

  constructor() {
    super(SplineTypes.FACE);
   
    this.z = this.finalz = 0;
    this.mat = new Material();
    this.paths = new GArray();
    this.flag |= SplineFlags.UPDATE_AABB;
    
    this._aabb = [new Vector3(), new Vector3()];
    
    var this2 = this;
    
    this.mat.update = this._mat_update.bind(this);
  }
  
  _mat_update() {
    this.flag |= SplineFlags.REDRAW;
  }

  update() {
    this.flag |= SplineFlags.UPDATE_AABB|SplineFlags.REDRAW;
  }
  
  update_aabb() {
    this.flag &= ~SplineFlags.UPDATE_AABB;
    
    static minmax = new MinMax(3);
    
    minmax.reset();
    for (var path of this.paths) {
      for (var l of path) {
        minmax.minmax(l.v.aabb[0]);
        minmax.minmax(l.v.aabb[1]);
        minmax.minmax(l.s.aabb[0]);
        minmax.minmax(l.s.aabb[1]);
      }
    }
    
    this._aabb[0].load(minmax.min);
    this._aabb[1].load(minmax.max);
  }
  
  get aabb() {
    if (this.flag & SplineFlags.UPDATE_AABB)
      this.update_aabb();
      
    return this._aabb;
  }
  
  set aabb(val) {
    this._aabb = val;
  }
    
  loadSTRUCT(reader) {
    reader(this);

    super.loadSTRUCT(reader);
    this.flag |= SplineFlags.UPDATE_AABB;
    this.mat.update = this._mat_update.bind(this);
  }
}

SplineFace.STRUCT = STRUCT.inherit(SplineFace, SplineElement) + `
    paths  : array(SplineLoopPath);
    mat    : Material;
    aabb   : array(vec3);
    z      : float;
    finalz : float;
  }
`;

export class Material {
  fillcolor : Vector4
  strokecolor : Vector4
  strokecolor2 : Vector4
  linewidth : number
  flag : number
  opacity : number
  fill_over_stroke : boolean
  blur : number;

  constructor() {
    this.fillcolor = new Vector4([0, 0, 0, 1]);
    this.strokecolor = new Vector4([0, 0, 0, 1]);
    this.strokecolor2 = new Vector4([0, 0, 0, 1]);
    this.linewidth = 2.0;
    this.linewidth2 = 0.0;
    
    this.flag = 0;
    
    this.opacity = 1.0; //multiplied with both fillcolor and strokecolor's alpha
    this.fill_over_stroke = false;
    
    this.blur = 0.0;
  }
  
  update() {
    throw new Error("override me! should have happened in splinesegment or splineface constructors!");
  }
  
  equals(is_stroke, mat) {
    var color1 = is_stroke ? this.strokecolor : this.fillcolor;
    var color2 = is_stroke ? mat.strokecolor : mat.fillcolor;
    
    for (var i=0; i<4; i++) {
      if (color1[i] != color2[i])
        return false;
    }
    
    if (this.flag != mat.flag) 
      return false;
    
    if (this.opacity != mat.opacity)
      return false;
    
    if (this.blur != mat.blur)
      return false;
    
    if (is_stroke && this.linewidth != mat.linewidth)
      return false;
    
    return true;
  }
  
  load(mat) {
    for (var i=0; i<4; i++) {
      this.fillcolor[i] = mat.fillcolor[i];
      this.strokecolor[i] = mat.strokecolor[i];
      this.strokecolor2[i] = mat.strokecolor2[i];
    }
    
    this.opacity = mat.opacity;
    this.linewidth = mat.linewidth;
    this.fill_over_stroke = mat.fill_over_stroke;
    this.blur = mat.blur;
    this.linewidth2 = mat.linewidth2;
    
    this.flag = mat.flag;
    
    return this;
  }
  
  get css_fillcolor() {
    var r = Math.floor(this.fillcolor[0]*255);
    var g = Math.floor(this.fillcolor[1]*255);
    var b = Math.floor(this.fillcolor[2]*255);
    
    return "rgba("+r+","+g+","+b+","+this.fillcolor[3]+")";
  }

  loadSTRUCT(reader) {
    reader(this);

    this.fillcolor = new Vector4(this.fillcolor);
    if (isNaN(this.fillcolor[3])) {
      this.fillcolor[3] = 1.0;
    }

    this.strokecolor = new Vector4(this.strokecolor);
    if (isNaN(this.strokecolor[3])) {
      this.strokecolor[3] = 1.0;
    }
  }
  static fromSTRUCT(reader) {
    var ret = new Material();
    
    reader(ret);
    
    return ret;
  }
}

Material.STRUCT = `
  Material {
    fillcolor        : vec4;
    strokecolor      : vec4;
    strokecolor2     : vec4;
    opacity          : float;
    fill_over_stroke : int;
    linewidth        : float;
    linewidth2       : float;
    blur             : float;
    flag             : int;
  }
`;

import {ToolIter, TPropIterable} from '../core/toolprops_iter.js';

//stores elements as eid's, for tool operators
export class ElementRefIter extends ToolIter {
  ret : Object;

  constructor() {
    super();
    
    this.ret = {done : false, value : undefined};
    this.spline = this.ctx = this.iter = undefined;
  }
  
  init(eset) {
    this.ret.done = false;
    this.nextitem = undefined;
    
    this.eset = eset;
    this.ctx = eset != undefined ? eset.ctx : undefined;
    this.spline = this.ctx != undefined ? this.ctx.spline : undefined;
    
    return this;
  }
  
  spawn() {
    var ret = new ElementRefIter();
    ret.init(this.eset);
    return ret;
  }
  
  next() {
    var ret = this.ret;
    
    if (this.spline == undefined)
      this.spline = this.ctx.spline;
    if (this.iter == undefined)
      this.iter = set.prototype[Symbol.iterator].call(this.eset);
    
    var spline = this.spline;
    var next, e = undefined;
    do {
      var next = this.iter.next();
      if (next.done) break;
      
      e = spline.eidmap[next.value];
      if (e == undefined) {
        console.log("Warning, bad eid", next.value);
      }
    } while (next.done != true && e == undefined);
    
    if (e == undefined || next.done == true) {
      this.spline = undefined;
      this.iter = undefined;
      
      ret.done = true;
      ret.value = undefined;
    } else {
      ret.value = e;
    }
    
    return ret;
  }
  
  reset() {
    this.i = 0;
    this.ret.done = false;
    this.spline = undefined;
    this.iter = undefined;
  }
  
  [Symbol.iterator]() {
    return this;
  }
  
  static fromSTRUCT(reader) {
    var ret = new ElementRefIter();
    reader(ret);
    
    for (var i=0; i<ret.saved_items.length; i++) {
      ret.add(ret.saved_items[i]);
    }
    delete ret.saved_items;
    
    return ret;
  }
}
ElementRefIter.STRUCT = `
  ElementRefIter {
    mask        : int;
    saved_items : iter(int) | obj;
  }
`;

export class ElementRefSet extends set {
  constructor(mask) {
    super();
    
    this.mask = mask == undefined ? SplineTypes.ALL : mask;
  }
  
  add(item) {
    var start_item = item;
    if (!(typeof item == "number" || item instanceof Number))
      item = item.eid;
      
    if (item == undefined) {
      console.trace("ERROR in ElementRefSet!!", start_item);
      return;
    }
    
    set.prototype.add.call(this, item);
  }
  
  copy() {
    var ret = new ElementRefSet(this.mask);
    
    for (var eid of set.prototype[Symbol.iterator].call(this)) {
      ret.add(eid);
    }
    
    return ret;
  }
  
  [Symbol.iterator]() {
    if (this.itercaches == undefined) {
      this.itercaches = cachering.fromConstructor(ElementRefIter, 8);
    }
    
    return this.itercaches.next().init(this);
  }
};

mixin(ElementRefSet, TPropIterable);

import * as native_api from '../wasm/native_api.js';
