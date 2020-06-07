"use strict";

import {ENABLE_MULTIRES} from '../config/config.js';

var PI = Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor,
    ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos,
    asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;

import {
  MinMax
} from '../util/mathlib.js';

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
        
import {SplineTypes, SplineFlags, ClosestModes, RecalcFlags,
        MaterialFlags, CustomDataLayer, CustomData, CustomDataSet,
        SplineElement, CurveEffect} from './spline_base.js';
        
import {SelMask} from '../editors/viewport/selectmode.js';
import {ORDER, KSCALE, KANGLE, KSTARTX, KSTARTY, KSTARTZ, KTOTKS, INT_STEPS} from './spline_math.js';

import {
  eval_curve, spiraltheta, spiralcurvature, spiralcurvature_dv
} from './spline_math.js';

let eval_ret_vs = cachering.fromConstructor(Vector2, 512);
let evaluateSide_rets = cachering.fromConstructor(Vector2, 512);

export class SplineVertex extends SplineElement {
  flag : boolean
  eid : number
  frames : Object;

  constructor(co) {
    super(SplineTypes.VERTEX);
    Vector3.prototype.initVector3.apply(this, arguments);

    if (co !== undefined) {
      this[0] = co[0];
      this[1] = co[1];
      
      if (co.length > 2) {
        this[2] = co[2];
      }
    }

    this.type = SplineTypes.VERTEX;
    this.flag = SplineFlags.FRAME_DIRTY|SplineFlags.UPDATE;
    this.segments = [];
    this.eid = 0;
    this.frames = {};
    
    //handle variables
    this.hpair = undefined; //connected handle in shared tangents mode
  }

  get width() {
    if (!this.segments) return; //happens in mixin code

    let tot = 0.0;
    let sum = 0.0;

    for (let s of this.segments) {
      tot++;
      sum += this === s.v1 ? s.w1 : s.w2;
    }

    return tot ? sum / tot : 0.0;
  }

  set width(w) {
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
  }

  get shift() {
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

  set shift(w) {
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

  set __shift(w) {
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

  get aabb() {
    static ret = [new Vector3(), new Vector3()];
    ret[0].load(this); ret[1].load(this);
    return ret;
  }
  
  sethide(state) {
    if (state)
      this.flag |= SplineFlags.HIDE;
    else
      this.flag &= ~SplineFlags.HIDE;
    
    if (this.type == SplineTypes.HANDLE)
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
    if (this.type == SplineTypes.VERTEX) {
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
    if (this.type != SplineTypes.HANDLE) return true;
    
    var s = this.owning_segment;
    
    if (s === undefined) {
      console.warn("Corrupted handle detected", this.eid);
      return false;
    }
    
    var v = s.handle_vertex(this);
    
    var ret = v != undefined && (v.segments != undefined && v.segments.length > 2 || (v.flag & SplineFlags.USE_HANDLES));
    
    return ret;
  }
  
  set hidden(val) {
    if (val)
      this.flag |= SplineFlags.HIDE;
    else
      this.flag &= ~SplineFlags.HIDE;
  }

  other_segment(s) {
    if (s == this.segments[0]) return this.segments[1];
    else if (s == this.segments[1]) return this.segments[0];
    
    return undefined;
  }
  
  toJSON() {
    var ret = {};
    
    ret.frame = this.frame;
    ret.segments = [];
    ret[0] = this[0];
    ret[1] = this[1];
    ret[2] = this[2];
    ret.frames = this.frames;
    ret.length = 3;
    
    for (var i=0; i<this.segments.length; i++) {
      if (this.segments[i] != undefined)
        ret.segments.push(this.segments[i].eid);
    }
    
    ret.flag = this.flag;
    ret.eid = this.eid;
    
    return ret;
  }

  loadSTRUCT(reader) {
    reader(this);
    super.loadSTRUCT(reader);

    this.load(this.co);
    delete this.co;
    
    for (let axis=0; axis<3; axis++) {
      if (isNaN(this[axis])) {
        console.warn("NaN vertex", this.eid);
        this[axis] = 0;
      }
    }
    
    return this;
  }
};

SplineVertex.STRUCT = STRUCT.inherit(SplineVertex, SplineElement) + `
  co       : vec3          | obj;
  segments : array(e, int) | e.eid;
  hpair    : int           | obj.hpair != undefined? obj.hpair.eid : -1;
}
`;

mixin(SplineVertex, Vector3);

var derivative_cache_vs = cachering.fromConstructor(Vector3, 64);
var closest_point_ret_cache_vs = cachering.fromConstructor(Vector3, 256);
var closest_point_ret_cache = new cachering(function() {
  return [0, 0];
}, 256);

var closest_point_cache_vs = cachering.fromConstructor(Vector3, 64);

export class EffectWrapper extends CurveEffect {
  constructor(owner : SplineSegment) {
    super();
    this.seg = owner;
  }
  
  rescale(ceff, width) {
    //find owning segment by ascending to root curve effect
    while (ceff.prior != undefined) {
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
    if (v.segments.length != 2)
      return undefined;
    
    var seg2 = v.other_segment(seg1);
    
    flip_out[0] = (donext && seg2.v1 == v) || (!donext && seg2.v2 == v);
    
    return seg2._evalwrap;
  }

  evaluate(s : float) : Vector3 {
    return this.seg.evaluate(s, undefined, undefined, undefined, true);
  }
  
  derivative(s : float) : Vector3 {
    return this.seg.derivative(s, undefined, undefined, true);
  }
}

export class SplineSegment extends SplineElement {
  _evalwrap: EffectWrapper
  has_multires : boolean
  mat      : Material
  finalz   : number
  flag     : number
  eid      : number
  v1       : SplineVertex;
  v2       : SplineVertex;
  h1       : SplineVertex;
  h2       : SplineVertex;
  w1       : number;
  w2       : number;

  ks       : Array
  _last_ks : Array;

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

  shift(s) {
    s = s*s*(3.0 - 2.0*s);

    return this.shift1 + (this.shift2 - this.shift1)*s;
  }

  dshift(s) {
    let df = 0.0001;
    let a = this.shift(s-df);
    let b = this.shift(s+df);

    return (b - a) / (2.0*df);
  }

  dwidth(s) { //should be linear
    let df = 0.0001;
    let a = this.width(s-df);
    let b = this.width(s+df);

    return (b - a) / (2.0*df);
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

  widthFunction(s) {
    //if (window.dd === 1) {
    s = (6 * s ** 2 - 15 * s + 10) * s ** 3; //degree 5 smoothstep

    //} else if (window.dd !== 2) {
    //  s = s*s*(3.0 - 2.0*s); //degree 3 smoothstep
    //}

    return s;
  }

  width(s) {
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

  get aabb() {
    if (this.flag & SplineFlags.UPDATE_AABB)
      this.update_aabb();
      
    return this._aabb;
  }
  
  set aabb(val) {
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
  
  update_aabb(steps=8) {
    this._update_has_multires();
    
    this.flag &= ~SplineFlags.UPDATE_AABB;
    
    var min = this._aabb[0], max = this._aabb[1];
    static minmax = new MinMax(2);
    
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
    
    min[2] = max[2] = 0.0; //XXX need to get rid of z
  }
  
  closest_point(p : Vector2, mode : ClosestModes, fast : boolean=false) {
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
        
        var co = this.evaluate(mid, undefined, undefined, undefined, true);
        var sco = this.evaluate(start, undefined, undefined, undefined, true);
        var eco = this.evaluate(end, undefined, undefined, undefined, true);

        sco[2] = eco[2] = co[2] = 0.0;

        var d1 = this.normal(start, true).normalize();
        var d2 = this.normal(end, true).normalize();
        var dm = this.normal(mid, true).normalize();
        
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
      var co = this.evaluate(mid, undefined, undefined, undefined, true);
      n1.load(this.normal(mid, true)).normalize();
      n2.load(co).sub(p).normalize();
      
      if (n2.dot(n1) < 0) {
        n2.negate();
      }
      
      var angle = acos(Math.min(Math.max(n1.dot(n2), -1), 1));
      if (angle > angle_limit)
        continue;
      
      if (mode !== ClosestModes.ALL && minret === undefined) {
        minret = closest_point_ret_cache.next();
        minret[0] = minret[1] = undefined;
      }
      
      //did we come up empty?
      var dis = co.vectorDistance(p);
      if (mode === ClosestModes.CLOSEST) {
        if (dis < mindis) {
          minret[0] = closest_point_cache_vs.next().load(co);
          minret[1] = mid;
          mindis = dis;
        }
      } else if (mode === ClosestModes.START) {
        if (mid < mindis) {
          minret[0] = closest_point_cache_vs.next().load(co);
          minret[1] = mid;
          mindis = mid;
        }
      } else if (mode === ClosestModes.END) {
        if (mid > maxdis) {
          minret[0] = closest_point_cache_vs.next().load(co);
          minret[1] = mid;
          maxdis = mid;
        }
      } else if (mode === ClosestModes.ALL) {
        var ret = closest_point_ret_cache.next();
        ret[0] = closest_point_cache_vs.next().load(co);
        ret[1] = mid;
        
        minret.push(ret);
      }
    }
    
    if (minret === undefined && mode === ClosestModes.CLOSEST) {
      var dis1 = this.v1.vectorDistance(p), dis2 = this.v2.vectorDistance(p);
      
      minret = closest_point_ret_cache.next();
      minret[0] = closest_point_cache_vs.next().load(dis1 < dis2 ? this.v1 : this.v2);
      minret[1] = dis1 < dis2 ? 0.0 : 1.0;
    } else if (minret === undefined && mode === ClosestModes.START) {
      minret = closest_point_ret_cache.next();
      minret[0] = closest_point_cache_vs.next().load(this.v1);
      minret[1] = 0.0;
    } if (minret === undefined && mode === ClosestModes.END) {
      minret = closest_point_ret_cache.next();
      minret[0] = closest_point_cache_vs.next().load(this.v2);
      minret[1] = 1.0;
    }
    
    return minret;
  }
  
  normal(s, no_effects=!ENABLE_MULTIRES) {
    var ret = this.derivative(s, undefined, undefined, no_effects);
    var t = ret[0]; ret[0] = -ret[1]; ret[1] = t;
    
    ret.normalize();
    return ret;
  }
  
  ends(v) {
    if (v === this.v1) return 0.0;
    if (v === this.v2) return 1.0;
  }
  
  handle(v) {
    if (v === this.v1) return this.h1;
    if (v === this.v2) return this.h2;
  }
  
  handle_vertex(h) {
    if (h === this.h1) return this.v1;
    if (h === this.h2) return this.v2;
  }
  
  get is_line() {
    var r1 = (this.v1.flag & SplineFlags.BREAK_TANGENTS);// || this.v1.segments.length > 2;
    var r2 = (this.v2.flag & SplineFlags.BREAK_TANGENTS);// || this.v2.segments.length > 2;
    
    return r1 && r2;
  }
  
  get renderable() {
    return !(this.flag & SplineFlags.NO_RENDER);
  }
  
  set renderable(val) {
    if (!val)
      this.flag |= SplineFlags.NO_RENDER;
    else
      this.flag &= ~SplineFlags.NO_RENDER;
  }
  
  update_handle(h) {
    var ov = this.handle_vertex(h);
    
    if (h.hpair != undefined) {
      var seg = h.hpair.owning_segment;
      var v = this.handle_vertex(h);
      
      var len = h.hpair.vectorDistance(v);
      
      h.hpair.load(h).sub(v).negate().normalize().mulScalar(len).add(v);
      seg.update();
      
      return h.hpair;
    } else if (ov.segments.length == 2 && h.use && !(ov.flag & SplineFlags.BREAK_TANGENTS)) {
      var h2 = h.owning_vertex.other_segment(h.owning_segment).handle(h.owning_vertex);
      var hv = h2.owning_segment.handle_vertex(h2), len = h2.vectorDistance(hv);
      
      h2.load(h).sub(hv).negate().normalize().mulScalar(len).add(hv);
      
      h2.owning_segment.update();
      
      return h2;
    }
  }
  
  other_handle(h_or_v) {
    if (h_or_v == this.v1)
      return this.h2;
    if (h_or_v == this.v2)
      return this.h1;
    if (h_or_v == this.h1)
      return this.h2;
    if (h_or_v == this.h2)
      return this.h1;
  }
  
  get length() {
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
  
  curvature(s, order, override_scale) {
    if (order === undefined) order = ORDER;

    /*
    let df = 0.0001;
    let dv = this.derivative(s);
    let dv2 = this.derivative(s+df);

    dv2.sub(dv).mulScalar(1.0 / df);

    return (dv[0]*dv2[1] - dv[1]*dv2[0]) / Math.pow(dv[0]*dv[0] + dv[1]*dv[1], 3.0/2.0);
    //*/

    //update ks[KSCALE], final 1 prevents final evaluation
    //to save performance
    eval_curve(0.5, this.v1, this.v2, this.ks, order, 1);
    
    var k = spiralcurvature(s, this.ks, order);
    return k/(0.00001 + this.ks[KSCALE]);
  }
  
  curvature_dv(s, order, override_scale) {
    if (order == undefined) order = ORDER;
    
    //update ks[KSCALE], final 1 prevents final evaluation
    //to save performance
    eval_curve(0.5, this.v1, this.v2, this.ks, order, 1);
    
    var k = spiralcurvature_dv(s, this.ks, order);
    return k/(0.00001 + this.ks[KSCALE]);
  }
  
  derivative(s, order, no_update_curve, no_effects) {
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
    if (order == undefined) order = ORDER;

    var ret = derivative_cache_vs.next().zero();

    //update ks[KANGLE], final '1' argument prevents final evaluation
    //to save performance
    var ks = this.ks;
    
    if (!no_update_curve)
      eval_curve(0.5, this.v1, this.v2, ks, order, 1);
    
    var th = spiraltheta(s, ks, order);
    var k = spiralcurvature(s, ks, order);
    
    var ang = ks[KANGLE];
    
    ret[0] = sin(th+ang)*ks[KSCALE];
    ret[1] = cos(th+ang)*ks[KSCALE];
    ret[2] = 0.0;
    
    return ret;
  }
  
  theta(s, order, no_effects) {
    if (order == undefined) order = ORDER;
    return spiraltheta(s, this.ks, order)*this.ks[KSCALE];
  }
  
  offset_eval(s, offset, order, no_update) {
    if (order == undefined) order = ORDER;
    
    var ret = this.evaluate(s, order, undefined, no_update);
    if (offset == 0.0) return ret;
    
    var tan = this.derivative(s, order, no_update);
    
    var t = tan[0]; tan[0] = -tan[1]; tan[1] = t;
    
    tan.normalize().mulScalar(offset);
    
    ret.add(tan);
    return ret;
  }

  evaluateSide(s, side=0, dv_out, normal_out, lw_dlw_out) {
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
    if (no_effects) {
      if (order === undefined) order = ORDER;
      
      //check if scale is invalid
      //if (this.ks[KSCALE] == undefined || this.ks[KSCALE] == 0)
      //  eval_curve(1, this.v1, this.v2, this.ks, order, undefined, no_update);
      //s /= this.ks[KSCALE];
      
      s = (s + 0.00000001) * (1.0 - 0.00000002);
      s -= 0.5;
      
      var co = eval_curve(s, this.v1, this.v2, this.ks, order, undefined, no_update);
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
  
  update() {
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
    if (this.v1 === s.v1 || this.v1 == s.v2) return this.v1;
    if (this.v2 === s.v1 || this.v2 == s.v2) return this.v2;
  }
  
  other_vert(v) {
    if (v == this.v1) return this.v2;
    if (v == this.v2) return this.v1;
  }

  loadSTRUCT(reader) {
    reader(this);
    super.loadSTRUCT(reader);

    //XXX this is kind of hackish, seting a callback this way
    this.mat.update = this._material_update.bind(this);
  }
}

SplineSegment.STRUCT = STRUCT.inherit(SplineSegment, SplineElement) + `
  ks   : array(float);
  
  v1   : int | obj.v1.eid;
  v2   : int | obj.v2.eid;
  
  h1   : int | obj.h1 != undefined ? obj.h1.eid : -1;
  h2   : int | obj.h2 != undefined ? obj.h2.eid : -1;
  
  w1   : float;
  w2   : float;
  
  l    : int | obj.l != undefined  ? obj.l.eid : -1;
  
  mat  : Material;

  aabb   : array(vec3);
  z      : float;
  finalz : float;
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
    if (this.itercache == undefined) {
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
    this._aabb[0][2] = this._aabb[1][2] = 0.0; //XXX need to get rid of z
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
  fillcolor : Array<number>
  strokecolor : Array<number>
  linewidth : number
  flag : number
  opacity : number
  fill_over_stroke : boolean
  blur : number;

  constructor() {
    this.fillcolor = [0, 0, 0, 1];
    this.strokecolor = [0, 0, 0, 1];
    this.linewidth = 2.0;
    
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
    }
    
    this.opacity = mat.opacity;
    this.linewidth = mat.linewidth;
    this.fill_over_stroke = mat.fill_over_stroke;
    this.blur = mat.blur;
    
    this.flag = mat.flag;
    
    return this;
  }
  
  get css_fillcolor() {
    var r = Math.floor(this.fillcolor[0]*255);
    var g = Math.floor(this.fillcolor[1]*255);
    var b = Math.floor(this.fillcolor[2]*255);
    
    return "rgba("+r+","+g+","+b+","+this.fillcolor[3]+")";
  }

  static fromSTRUCT(reader) {
    var ret = new Material();
    
    reader(ret);
    
    return ret;
  }
}

Material.STRUCT = `
  Material {
    fillcolor        : array(float);
    strokecolor      : array(float);
    opacity          : float;
    fill_over_stroke : int;
    linewidth        : float;
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
