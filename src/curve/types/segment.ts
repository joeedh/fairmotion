/* SplineSegment: one clothoid arc between two vertices, plus the width and
   shift profile the stroker offsets it by.

   The geometry is spline_math.ts's -- `ks` holds the spiral coefficients and
   eval_curve() is what reads them.  What is here is the segment's view of that:
   evaluate() and derivative() for the centre line, evaluateSide() for the two
   stroke boundaries, and width()/shift() for the b-spline profile those two are
   offset by.

   EffectWrapper is the root of the CurveEffect chain.  Effects are 3D and a
   segment is 2D, so the wrapper widens the segment's result on the way out and
   is what an effect asks for its neighbours. */

import { Vector2, Vector3 } from "../../path.ux/scripts/pathux.js";

import { ENABLE_MULTIRES } from "../../config/config.js";
import * as bspline from "../bspline.js";
import { MinMax } from "../../util/mathlib.js";
import { structInherit } from "../../core/struct_facade.js";
import * as native_api from "../../wasm/native_api.js";
import {
  ClosestModes,
  CurveEffect,
  IsectModes,
  SplineElement,
  SplineFlags,
  SplineTypes,
  layerClass,
  loadVec2Into3,
  loadVec3Into2,
} from "../spline_base.js";
import { MultiResLayer } from "../spline_multires.js";
import {
  KANGLE,
  KSCALE,
  KTOTKS,
  ORDER,
  eval_curve,
  spiralcurvature,
  spiralcurvature_dv,
  spiraltheta,
} from "../spline_math.js";
import { loadWidthNet, netKnots, netShifts, netWidths } from "../draw/width_chain.js";
import { Material } from "./material.js";

import type { KsArray } from "../spline_math.js";
import type { Spline } from "../spline.js";
import type { SplineLoop } from "./loop.js";
import type { SplineVertex, StrokeSide } from "./vertex.js";
import type { CallbackThis, DataAPI, DataStruct } from "../../path.ux/scripts/pathux.js";
import type { FullContext } from "../../core/context.js";

const acos = Math.acos,
  cos = Math.cos,
  sin = Math.sin;

/* Out-params the evaluators fill in; callers hand them plain arrays and
   cachering vectors interchangeably. */
type VecOut = number[] | Vector2 | Vector3;

/* What SplineSegment.toJSON() emits; handle eids are -1 when absent. */
export interface SplineSegmentJSON {
  frames: unknown;
  ks: number[];
  v1: number;
  v2: number;
  h1: number;
  h2: number;
  flag: number;
  eid: number;
}

const eval_ret_vs = cachering.fromConstructor(Vector2, 512);
const evaluateSide_rets = cachering.fromConstructor(Vector2, 512);

/* The CurveEffect chain is 3D; EffectWrapper widens the segment's 2D result
   into one of these on the way out. */
const effwrap_ret_vs = cachering.fromConstructor(Vector3, 512);

const derivative_cache_vs = cachering.fromConstructor(Vector3, 64);
const closest_point_cache_vs = cachering.fromConstructor(Vector3, 512);

export class ClosestPointRecord {
  s: number;
  co: Vector2;
  sign: number;

  constructor() {
    this.s = 0;
    this.co = new Vector2();
    this.sign = 1.0;
  }

  /* NOTE: clears both fields to undefined even though they are declared as
     numbers; every consumer overwrites them before reading. */
  reset() {
    Reflect.set(this, "s", undefined);
    Reflect.set(this, "sign", undefined);

    return this;
  }
}

const closest_point_ret_cache = cachering.fromConstructor(ClosestPointRecord, 256);

export class EffectWrapper extends CurveEffect {
  seg: SplineSegment;

  constructor(owner: SplineSegment) {
    super();
    this.seg = owner;
  }

  /* NOTE: the chain root is always an EffectWrapper, so `ceff.seg` below is
     really there -- CurveEffect itself has no `seg`. */
  rescale(ceff: CurveEffect, width: number): number {
    //find owning segment by ascending to root curve effect
    while (ceff.prior !== undefined) {
      ceff = ceff.prior;
    }

    var seg1 = this.seg;
    var seg2: SplineSegment = Reflect.get(ceff, "seg");

    var l1 = seg1.length,
      l2 = seg2.length;

    width = (width * l2) / l1;

    return width;
  }

  _get_nextprev(donext: number, flip_out?: (number | boolean)[]): CurveEffect | undefined {
    var seg1 = this.seg;

    var v = donext ? seg1.v2 : seg1.v1;
    if (v.segments.length !== 2) return undefined;

    var seg2 = v.other_segment(seg1);

    /* The base class always hands its scratch array down. */
    flip_out![0] = (donext && seg2.v1 === v) || (!donext && seg2.v2 === v);

    return seg2._evalwrap;
  }

  evaluate(s: number): Vector3 {
    return loadVec2Into3(
      effwrap_ret_vs.next(),
      this.seg.evaluate(s, undefined, undefined, undefined, true)
    );
  }

  derivative(s: number): Vector3 {
    return this.seg.derivative(s, undefined, undefined, true);
  }
}

const intersect_rets = new cachering(() => {
  return {
    co     : new Vector2(),
    targetS: 0,
    sourceS: 0,
  };
}, 512);

const __static_minmax = new MinMax(2);
const __angle_temp = cachering.fromConstructor(Vector2, 64);

const bstmp1 = new Array(32);
const bstmp2 = new Array(32);
const bstmp3 = new Array(32);
const bstmpb = [0, 0];
const shiftout = [0];

export class SplineSegment extends SplineElement {
  static STRUCT: string;

  declare type: typeof SplineTypes.SEGMENT;

  _evalwrap: EffectWrapper;
  has_multires: boolean;
  mat: Material;
  finalz: number;
  v1: SplineVertex;
  v2: SplineVertex;
  /* Absent on segments with no handles; the constructor left both undefined,
     which a bare declaration says without emitting an assignment. */
  h1!: SplineVertex;
  h2!: SplineVertex;
  w1: number;
  w2: number;
  shift1: number;
  shift2: number;
  /* The curvature vector: KTOTKS slots whose meaning depends on the order --
     see spline_math.ts. ks[KSCALE] is the arc length. */
  ks: KsArray;
  _last_ks: number[];

  /* One of the loops using this segment; the rest are reachable through
     radial_next. */
  l: SplineLoop | undefined;
  /* Set by the draw code: the id shared by every topologically connected
     segment, and the narrower id shared only across two-valence joins within
     one layer and stroke style. */
  topoid: number;
  stringid: number;
  z: number;
  _aabb: Vector3[];

  /* Pass-scoped scratch owned by width_chain.ts: where this segment's width
     net lives in the current chain set, and which set that was. */
  _widthSlot = -1;
  _widthGen = -1;

  /* Scratch owned by trim_state.ts: where this segment's trims live in its
     spline's TrimState, and which renumbering of it that slot belongs to. */
  _trimSlot = -1;
  _trimGen = -1;

  /* copy() and fromJSON() build bare segments and fill v1/v2 in themselves. */
  constructor(v1?: SplineVertex, v2?: SplineVertex) {
    super(SplineTypes.SEGMENT);

    this._evalwrap = new EffectWrapper(this);

    this.l = undefined;

    this.w1 = 1.0;
    this.w2 = 1.0;

    //shift
    this.shift1 = 0.0;
    this.shift2 = 0.0;

    this.v1 = v1!;
    this.v2 = v2!;

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

    this.type = SplineTypes.SEGMENT;
    this.flag = 0;
    this.eid = 0;

    this.ks = new Array(KTOTKS);
    this._last_ks = new Array(KTOTKS);

    for (var i = 0; i < this.ks.length; i++) {
      this.ks[i] = 0;
      this._last_ks[i] = 0;
    }
  }

  onDestroy() {
    native_api.onSegmentDestroy(this);
  }

  sinangle(v: SplineVertex): number {
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

      let th = -(t1[0] * t2[1] - t1[1] * t2[0]);
      let eps = 0.0001;

      th = th * (1.0 - eps * 2.0) + eps * Math.sign(th);

      return th;
    }

    return 0.0;
  }

  shift(s: number): number {
    this.width(s, shiftout);
    return shiftout[0];
  }

  dshift(s: number): number {
    let df = 0.0001;
    let a = this.shift(s - df);
    let b = this.shift(s + df);

    return (b - a) / (2.0 * df);
  }

  dwidth(s: number): number {
    //should be linear
    let df = 0.0001;
    let a = this.width(s - df);
    let b = this.width(s + df);

    return (b - a) / (2.0 * df);
  }

  setVertWidth(v: SplineVertex, w: number) {
    if (w === undefined || isNaN(w)) {
      console.warn("Got bad width data", w);
    }

    if (v === this.v1) {
      this.w1 = w;
    } else if (v === this.v2) {
      this.w2 = w;
    } else {
      console.log(this, v, "bleh");
      throw new Error("vertex not in edge " + v);
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

  widthFunction(s: number): number {
    return s;
  }

  /* Evaluates the stroke width at `s` as a cubic B-spline through this
     segment's width samples and its neighbours', so width stays smooth across
     two-valence joins. Writes the matching shift into outShift[0]. */
  width(s: number, outShift?: number[]): number {
    /* Inside a draw pass the net was built for the whole chain already. */
    const span = loadWidthNet(this);
    if (span >= 0.0) {
      const ss = s * span;

      if (outShift) {
        outShift[0] = bspline.deBoor(3, ss, netKnots, netShifts, 3);
      }

      return bspline.deBoor(3, ss, netKnots, netWidths, 3);
    }

    return this.widthWalk(s, outShift);
  }

  /* The reference implementation: builds this segment's own eight-knot window
     by stepping outward through two-valence vertices, four segments each way.
     width_chain.ts caches exactly this, one chain at a time. */
  widthWalk(s: number, outShift?: number[]): number {
    let seg: SplineSegment = this;
    let v: SplineVertex;
    let len = 0;

    function walk() {
      let lastv = v;

      if (v.segments.length === 2) {
        seg = v.other_segment(seg);
        v = seg.other_vert(v);
      }

      len = seg.length;
      len = Math.max(len, 0.0001);

      bstmpb[0] = (v === seg.v1 ? seg.w1 : seg.w2) * seg.mat.linewidth;
      bstmpb[1] = v === seg.v1 ? seg.shift1 : seg.shift2;

      return bstmpb;
    }

    v = this.v1;
    seg = this;

    let l0, l1, l2, l3, l4, l5, l6, l7, l8;

    l3 = Math.max(seg.length, 0.0001);
    l4 = l3;

    let w3 = this.w1 * this.mat.linewidth;
    let s3 = this.shift1;

    let [w2, s2] = walk();
    l2 = len;
    let [w1, s1] = walk();
    l1 = len;
    let [w0, s0] = walk();
    l0 = len;

    seg = this;
    v = this.v2;

    let w4 = this.w2 * this.mat.linewidth;
    let s4 = this.shift2;

    let [w5, s5] = walk();
    l5 = len;
    let [w6, s6] = walk();
    l6 = len;
    let [w7, s7] = walk();
    l7 = len;
    let [w8, s8] = walk();
    l8 = len;
    seg = this;

    let ks = bstmp1;
    let ws = bstmp2;
    let ss = bstmp3;

    bstmp1.length = 5;
    bstmp2.length = 5;

    ks[0] = -l0 - l1 - l2;
    ks[1] = -l1 - l2;
    ks[2] = -l2;
    ks[3] = 0;
    ks[4] = l4;
    ks[5] = l4 + l5;
    ks[6] = l4 + l5 + l6;
    ks[7] = l4 + l5 + l6 + l7;

    ws[0] = w2;
    ws[1] = w3;
    ws[2] = w4;
    ws[3] = w5;
    ws[4] = w6;
    ws[5] = w7;
    ws[6] = w8;

    ss[0] = s2;
    ss[1] = s3;
    ss[2] = s4;
    ss[3] = s5;
    ss[4] = s6;
    ss[5] = s7;
    ss[6] = s8;

    if (l4 === 0.0) {
      return 0.0;
    }

    s *= l4;

    if (outShift) {
      outShift[0] = bspline.deBoor(3, s, ks, ss, 3);
    }

    return bspline.deBoor(3, s, ks, ws, 3);
  }

  _material_update(spline?: Spline) {
    if (spline && spline.segmentNeedsResort(this)) {
      console.log("segment material flagged resort!");
      spline.regen_sort();
    }

    this.flag |= SplineFlags.REDRAW | SplineFlags.FRAME_DIRTY | SplineFlags.UPDATE;
    this.v1.flag |= SplineFlags.UPDATE;
    this.v2.flag |= SplineFlags.UPDATE;
  }

  get aabb(): Vector3[] {
    if (this.flag & SplineFlags.UPDATE_AABB) this.update_aabb();

    return this._aabb;
  }

  set aabb(val: Vector3[]) {
    this._aabb = val;
  }

  _update_has_multires() {
    this.has_multires = false;

    for (var i = 0; i < this.cdata.length; i++) {
      if (this.cdata[i] instanceof MultiResLayer) {
        this.has_multires = true;
        break;
      }
    }
  }

  update_aabb(steps: number = 8) {
    this._update_has_multires();

    this.flag &= ~SplineFlags.UPDATE_AABB;

    var min = this._aabb[0],
      max = this._aabb[1];
    let minmax = __static_minmax;

    minmax.reset();
    min.zero();
    max.zero();

    var co = this.evaluate(0);
    minmax.minmax(co);

    var ds = 1.0 / (steps - 1);
    for (let i = 0, s = 0; i < steps; i++, s += ds) {
      var co = this.evaluate(s * 0.999999999);
      minmax.minmax(co);
    }

    min.load(minmax.min);
    max.load(minmax.max);
  }

  intersect(
    seg: SplineSegment,
    side1: number = 0,
    side2: number = 0,
    mode: number = IsectModes.CLOSEST
  ) {
    if (this.flag & SplineFlags.COINCIDENT) {
      return undefined;
    }

    let steps = 5;

    let mindis: number | undefined = undefined;
    let minret = new Vector2();
    let mins = 0,
      mins2 = 0;

    let s = 0,
      ds = 1.0 / (steps - 1);

    for (let i = 0; i < steps; i++, s += ds) {
      let s1 = s,
        s2 = s + ds;

      let co1 = this.evaluateSide(s1, side1);
      let co2 = this.evaluateSide(s2, side1);

      let cl1 = seg.closest_point(co1, ClosestModes.CLOSEST, undefined, side2)!;
      let cl2 = seg.closest_point(co2, ClosestModes.CLOSEST, undefined, side2)!;

      if (cl1.sign !== cl2.sign) {
        for (let bi = 0; bi < 2; bi++) {
          let s3 = (s1 + s) * 0.5;
          let s4 = (s2 + s) * 0.5;

          for (let j = 0; j < 2; j++) {
            let s5 = j ? s4 : s3;

            let co3 = this.evaluateSide(s5, side1);
            let cl3 = seg.closest_point(co3, ClosestModes.CLOSEST, undefined, side2)!;

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
        cl1 = seg.closest_point(co1, ClosestModes.CLOSEST, undefined, side2)!;
        let dis1;

        if (mode === IsectModes.START) {
          dis1 = cl1.s;
        } else if (mode === IsectModes.END) {
          dis1 = 1.0 - cl1.s;
        } else if (mode === IsectModes.ENDSTART) {
          dis1 = 1.0 - Math.abs(cl1.s - 0.5) * 2.0;
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
  closest_point(
    p: Vector2 | Vector3,
    mode: 3,
    fast?: boolean,
    widthSide?: number
  ): ClosestPointRecord[] | undefined;
  closest_point(
    p: Vector2 | Vector3,
    mode?: number,
    fast?: boolean,
    widthSide?: number
  ): ClosestPointRecord | undefined;

  closest_point(
    p: Vector2 | Vector3,
    mode: number = 0,
    fast: boolean = false,
    widthSide?: number
  ): ClosestPointRecord | ClosestPointRecord[] | undefined {
    if (this.flag & SplineFlags.COINCIDENT) {
      return undefined;
    }

    var minret: ClosestPointRecord | undefined = undefined;
    var allret: ClosestPointRecord[] | undefined = undefined;
    var mindis = 1e18,
      maxdis = 0;

    /* The 3D scratch vectors below all subtract this one; the 2D distances
       further down read the caller's `p` directly, which holds the same two
       components. */
    var p3 = closest_point_cache_vs.next().zero();
    for (var i = 0; i < p.length; i++) {
      p3[i] = p[i];
    }

    if (mode === undefined) mode = 0;
    var steps = 5,
      s = 0,
      ds = 1.0 / steps;

    var n = closest_point_cache_vs.next();
    var n1 = closest_point_cache_vs.next(),
      n2 = closest_point_cache_vs.next();

    if (mode === ClosestModes.ALL) allret = [];

    let d1 = closest_point_cache_vs.next();
    let d2 = closest_point_cache_vs.next();
    let dm = closest_point_cache_vs.next();

    for (var i = 0; i < steps; i++, s += ds) {
      var start = s - 0.00001,
        end = s + ds + 0.00001;

      start = Math.min(Math.max(start, 0.0), 1.0);
      end = Math.min(Math.max(end, 0.0), 1.0);

      var mid = (start + end) * 0.5;
      var bad = false;

      var angle_limit = fast ? 0.65 : 0.2;

      var steps = fast ? 5 : 20;
      for (var j = 0; j < steps; j++) {
        mid = (start + end) * 0.5;

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

        loadVec2Into3(n1, sco).sub(p3).normalize();
        loadVec2Into3(n2, eco).sub(p3).normalize();
        loadVec2Into3(n, co).sub(p3);
        n[2] = 0.0;
        n.normalize();

        if (n1.dot(d1) < 0.0) d1.negate();
        if (n2.dot(d2) < 0.0) d2.negate();
        if (n.dot(dm) < 0) dm.negate();

        var mang = acos(n.normalizedDot(dm));
        if (mang < 0.001) break;

        var ang1 = acos(n1.normalizedDot(d1));
        var ang2 = acos(n2.normalizedDot(d2));

        var w1 = n1.cross(d1)[2] < 0.0;
        var w2 = n2.cross(d2)[2] < 0.0;
        var wm = n.cross(dm)[2] < 0.0;

        if (isNaN(mang)) {
          if (!window.__adssad) window.__adssad = 0;

          if (time_ms() - window.__adssad > 500) {
            console.warn("NaN!", p, co, mid, dm, n, mang);
            window.__adssad = time_ms();

            mang = 0.0;
            n.zero();
          }
        }

        if (j === 0 && w1 === w2) {
          bad = true;
          break;
        }

        if (w1 === w2) {
          let dis1 = ang1,
            dis2 = ang2;

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

      if (bad) continue;

      //make sure angle is close enough to 90 degrees for our purposes. . .
      let co;

      if (widthSide) {
        co = this.evaluateSide(mid, widthSide, undefined, n1);
        n1.normalize();
      } else {
        co = this.evaluate(mid, undefined, undefined, undefined, true);
        n1.load(this.normal(mid, true)).normalize();
      }

      loadVec2Into3(n2, co).sub(p3).normalize();
      let sign = 1.0;

      if (n2.dot(n1) < 0) {
        sign = -1.0;
        n2.negate();
      }

      var angle = acos(Math.min(Math.max(n1.dot(n2), -1), 1));
      if (angle > angle_limit) continue;

      if (mode !== ClosestModes.ALL && minret === undefined) {
        minret = closest_point_ret_cache.next().reset();
      }

      /* Either the guard just above filled this in, or we are in the ALL
         branch below, which does not touch it. */
      const cur = minret!;

      //did we come up empty?
      var dis = co.vectorDistance(p);

      if (mode === ClosestModes.CLOSEST) {
        if (dis < mindis) {
          cur.co.load(co);
          cur.s = mid;
          cur.sign = sign;
          mindis = dis;
        }
      } else if (mode === ClosestModes.START) {
        if (mid < mindis) {
          cur.co.load(co);
          cur.s = mid;
          cur.sign = sign;
          mindis = mid;
        }
      } else if (mode === ClosestModes.END) {
        if (mid > maxdis) {
          cur.co.load(co);
          cur.s = mid;
          cur.sign = sign;
          maxdis = mid;
        }
      } else if (mode === ClosestModes.ALL) {
        let ret = closest_point_ret_cache.next().reset();
        ret.co.load(co);
        ret.s = mid;
        ret.sign = sign;

        allret!.push(ret);
      }
    }

    if (minret === undefined && mode === ClosestModes.CLOSEST) {
      var dis1 = this.v1.vectorDistance(p),
        dis2 = this.v2.vectorDistance(p);

      minret = closest_point_ret_cache.next().reset();
      minret.co.load(dis1 < dis2 ? this.v1 : this.v2);
      minret.s = dis1 < dis2 ? 0.0 : 1.0;
      minret.sign = 1.0;
    } else if (minret === undefined && mode === ClosestModes.START) {
      minret = closest_point_ret_cache.next();
      minret.co.load(this.v1);
      minret.s = 0.0;
      minret.sign = 1.0;
    }
    if (minret === undefined && mode === ClosestModes.END) {
      minret = closest_point_ret_cache.next();
      minret.co.load(this.v2);
      minret.s = 1.0;
      minret.sign = 1.0;
    }

    return mode === ClosestModes.ALL ? allret : minret;
  }

  normal(s: number, no_effects: boolean = !ENABLE_MULTIRES) {
    if (this.flag & SplineFlags.COINCIDENT) {
      return derivative_cache_vs.next().zero();
    }

    var ret = this.derivative(s, undefined, undefined, no_effects);
    var t = ret[0];
    ret[0] = -ret[1];
    ret[1] = t;

    ret.normalize();
    return ret;
  }

  /* NOTE: all four of these fall off the end -- and hand back undefined --
     when asked about a vertex or handle that is not on this segment. */
  ends(v: SplineVertex): number | undefined {
    if (v === this.v1) return 0.0;
    if (v === this.v2) return 1.0;
  }

  handle(v: SplineVertex): SplineVertex | undefined {
    if (v === this.v1) return this.h1;
    if (v === this.v2) return this.h2;
  }

  handle_vertex(h: SplineVertex): SplineVertex | undefined {
    if (h === this.h1) return this.v1;
    if (h === this.h2) return this.v2;
  }

  get is_line() {
    var r1 = this.v1.flag & SplineFlags.BREAK_TANGENTS; // || this.v1.segments.length > 2;
    var r2 = this.v2.flag & SplineFlags.BREAK_TANGENTS; // || this.v2.segments.length > 2;

    return r1 && r2;
  }

  get renderable(): boolean {
    return !(this.flag & SplineFlags.NO_RENDER);
  }

  set renderable(val: boolean) {
    if (!val) this.flag |= SplineFlags.NO_RENDER;
    else this.flag &= ~SplineFlags.NO_RENDER;
  }

  /* `h` is one of this segment's own handles, so every lookup below finds its
     vertex or its opposite handle. */
  update_handle(h: SplineVertex) {
    var ov = this.handle_vertex(h)!;

    if (h.hpair !== undefined) {
      var seg = h.hpair.owning_segment;
      var v = ov;

      var len = h.hpair.vectorDistance(v);

      h.hpair.load(h).sub(v).negate().normalize().mulScalar(len).add(v);
      seg.update();

      return h.hpair;
    } else if (ov.segments.length === 2 && h.use && !(ov.flag & SplineFlags.BREAK_TANGENTS)) {
      var ownv = h.owning_vertex!;
      var h2 = ownv.other_segment(h.owning_segment).handle(ownv)!;
      var hv = h2.owning_segment.handle_vertex(h2)!,
        len = h2.vectorDistance(hv);

      h2.load(h).sub(hv).negate().normalize().mulScalar(len).add(hv);

      h2.owning_segment.update();

      return h2;
    }
  }

  other_handle(h_or_v: SplineVertex): SplineVertex | undefined {
    if (h_or_v === this.v1) return this.h2;
    if (h_or_v === this.v2) return this.h1;
    if (h_or_v === this.h1) return this.h2;
    if (h_or_v === this.h2) return this.h1;
  }

  get length(): number {
    return this.ks[KSCALE];
  }

  /* NOTE: `this.frames` does not exist on SplineSegment -- ret.frames is
     always undefined. */
  toJSON(): SplineSegmentJSON {
    const self: SplineSegment = this;
    let ks: number[] = [];

    for (var i = 0; i < this.ks.length; i++) {
      ks.push(this.ks[i]);
    }

    return {
      frames: Reflect.get(self, "frames"),
      ks    : ks,
      v1    : this.v1.eid,
      v2    : this.v2.eid,
      h1    : this.h1 !== undefined ? this.h1.eid : -1,
      h2    : this.h2 !== undefined ? this.h2.eid : -1,
      eid   : this.eid,
      flag  : this.flag,
    };
  }

  curvature(s: number, order?: number, override_scale?: number) {
    if (order === undefined) order = ORDER;

    if (this.flag & SplineFlags.COINCIDENT) {
      return 0.0;
    }

    //update ks[KSCALE], final 1 prevents final evaluation
    //to save performance
    eval_curve(this, 0.5, this.v1, this.v2, this.ks, order, 1);

    var k = spiralcurvature(s, this.ks, order);
    return k / (0.0000001 + this.ks[KSCALE]);
  }

  curvature_dv(s: number, order?: number, override_scale?: number): number {
    if (order === undefined) order = ORDER;

    if (this.flag & SplineFlags.COINCIDENT) {
      return 0.0;
    }

    //update ks[KSCALE], final 1 prevents final evaluation
    //to save performance
    eval_curve(this, 0.5, this.v1, this.v2, this.ks, order, 1);

    var k = spiralcurvature_dv(s, this.ks, order);
    return k / (0.00001 + this.ks[KSCALE]);
  }

  derivative(s: number, order?: number, no_update_curve?: boolean, no_effects?: boolean): Vector3 {
    if (this.flag & SplineFlags.COINCIDENT) {
      return derivative_cache_vs.next().zero();
    }

    if (order === undefined) order = ORDER;

    var ret = derivative_cache_vs.next().zero();

    //update ks[KANGLE], final '1' argument prevents final evaluation
    //to save performance
    var ks = this.ks;

    if (!no_update_curve) eval_curve(this, 0.5, this.v1, this.v2, ks, order, 1);

    var th = spiraltheta(s, ks, order);
    var k = spiralcurvature(s, ks, order);

    var ang = ks[KANGLE];

    ret[0] = sin(th + ang) * ks[KSCALE];
    ret[1] = cos(th + ang) * ks[KSCALE];
    if (ret.length > 2) ret[2] = 0.0;

    return ret;
  }

  theta(s: number, order?: number, no_effects?: boolean) {
    if (order === undefined) order = ORDER;
    return spiraltheta(s, this.ks, order) * this.ks[KSCALE];
  }

  offset_eval(s: number, offset: number, order?: number, no_update?: boolean) {
    if (order === undefined) order = ORDER;

    var ret = this.evaluate(s, order, undefined, no_update);
    if (offset === 0.0) return ret;

    var tan = this.derivative(s, order, no_update);

    var t = tan[0];
    tan[0] = -tan[1];
    tan[1] = t;

    tan.normalize().mulScalar(offset);

    ret.add(tan);
    return ret;
  }

  curvatureSide(s: number, side: number, no_out?: VecOut) {
    let df = 0.0001;
    let dv0 = this.evaluateSide(s, side);
    let dv1 = this.evaluateSide(s + df, side);
    let dv2 = this.evaluateSide(s + df * 2, side);

    dv2.sub(dv1).mulScalar(1.0 / df);
    dv1.sub(dv0).mulScalar(1.0 / df);
    dv2.sub(dv1).mulScalar(1.0 / df);

    let k = (dv1[0] * dv2[1] - dv1[1] * dv2[0]) / Math.pow(dv1.dot(dv1), 3.0 / 2.0);

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
  /* The point on one of the two stroke boundaries: the centre line offset by
     half the local width, adjusted by the local shift. `side` picks which
     boundary; the three out params receive the boundary's derivative, its
     normal, and [width, dwidth]. */
  evaluateSide(
    s: number,
    side: StrokeSide = 0,
    dv_out?: VecOut,
    normal_out?: VecOut,
    lw_dlw_out?: VecOut
  ) {
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

    let sidesign = side ? 1.0 : -1.0;

    let co = evaluateSide_rets.next().load(this.evaluate(s));

    let dv = this.derivative(s);
    let shift = this.shift(s) * sidesign;
    let dshift = this.dshift(s) * sidesign;

    let lw = this.width(s) * sidesign;
    let dlw = this.dwidth(s) * sidesign;

    dlw = dlw * shift + dlw + dshift * lw;
    lw = lw + lw * shift;

    let dx = (-dv[1] * lw * 0.5) / this.length;
    let dy = (dv[0] * lw * 0.5) / this.length;

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

      let k = -seglen * this.curvature(s);
      let dx2 = (-0.5 * (dlw * dv[1] + dv[0] * k * lw - 2 * dv[0] * seglen)) / seglen;
      let dy2 = (0.5 * (dlw * dv[0] - dv[1] * k * lw + 2 * dv[1] * seglen)) / seglen;

      dv_out[0] = dx2;
      dv_out[1] = dy2;
    }

    co[0] += dx;
    co[1] += dy;

    return co;
  }

  evaluate(
    s: number,
    order?: number,
    override_scale?: number,
    no_update?: boolean,
    no_effects = !ENABLE_MULTIRES
  ): Vector2 {
    if (this.flag & SplineFlags.COINCIDENT) {
      return eval_ret_vs.next().load(this.v1);
    }

    if (no_effects) {
      if (order === undefined) order = ORDER;

      s = (s + 0.00000001) * (1.0 - 0.00000002);
      s -= 0.5;

      var co = eval_curve(this, s, this.v1, this.v2, this.ks, order, undefined, no_update);

      /* eval_curve() only comes back empty on its angle_only path, which this
         call does not take. */
      return eval_ret_vs.next().load(co!);
    } else {
      var wrap = this._evalwrap;
      var last: CurveEffect = wrap;

      for (var i = 0; i < this.cdata.length; i++) {
        if (layerClass(this.cdata[i])._getDef().hasCurveEffect) {
          var eff = this.cdata[i].curve_effect(this);
          eff.set_parent(last);

          last = eff;
        }
      }

      return loadVec3Into2(eval_ret_vs.next(), last.evaluate(s));
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

    this.flag |= SplineFlags.UPDATE | SplineFlags.UPDATE_AABB;
    this.h1.flag |= SplineFlags.UPDATE;
    this.h2.flag |= SplineFlags.UPDATE;

    //need to code a post_solve_update type method
    //update cdata
    for (var i = 0; i < this.cdata.length; i++) {
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

  /* NOTE: CurveEffect.global_to_local() takes (p, no_effects, fixed_s), so
     `fixed_s` is being passed as `no_effects` here. */
  global_to_local(s: Vector3, fixed_s?: number) {
    return this._evalwrap.global_to_local(s, fixed_s);
  }

  local_to_global(p: Vector3) {
    return this._evalwrap.local_to_global(p);
  }

  shared_vert(s: SplineSegment) {
    if (this.v1 === s.v1 || this.v1 === s.v2) return this.v1;
    if (this.v2 === s.v1 || this.v2 === s.v2) return this.v2;
  }

  other_vert(v: SplineVertex) {
    if (v === this.v1) return this.v2;
    if (v === this.v2) return this.v1;

    console.log(this.v1.eid, this.v2.eid, v ? v.eid : v, this.eid, v);

    throw new Error("vertex not in segment: " + (v ? v.eid : v));
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
    super.loadSTRUCT(reader);

    this.flag &= ~(SplineFlags.UPDATE | SplineFlags.REDRAW);

    //XXX this is kind of hackish, seting a callback this way
    this.mat.update = this._material_update.bind(this);
  }

  static defineAPI(api: DataAPI<FullContext>, struct = api.mapStruct(this, true)) {
    super.defineAPI(api, struct);

    struct
      .bool("editable", "editable", "Element is visible and can be edited")
      .customGet(function () {
        let seg = this.dataref;
        //XXX mass set path code will sometimes set
        //this.ctx to seg.

        //let ctx = this.ctx;
        let ctx = window.g_app_state.ctx;

        /* was a number, and so returned 0 rather than false when unselected. */
        let ok = !!(seg.flag & SplineFlags.SELECT);
        ok = ok && !(seg.flag & SplineFlags.HIDE);

        if (!ok) {
          return false;
        }

        if (!ctx.edit_all_layers) {
          let spline = ctx.spline;
          ok = ok && spline.layerset.active.id in seg.layers;
        }

        return ok;
      });

    let segment_update = function (this: CallbackThis<SplineSegment, FullContext>) {
      let segment = this.dataref;
      segment.mat.update();

      segment.flag |= SplineFlags.REDRAW;
      segment.v1.flag |= SplineFlags.REDRAW;
      segment.v2.flag |= SplineFlags.REDRAW;

      g_app_state.ctx.spline.regen_sort();
      window.redraw_viewport();
    };

    for (let name of ["w1", "w2"]) {
      struct
        .float(name, name, name)
        .range(0.001, 10000)
        .noUnits()
        .step(0.1)
        .expRate(1.33)
        .decimalPlaces(4)
        .on("change", segment_update);
    }

    for (let name of ["shift1", "shift2"]) {
      struct
        .float(name, name, name)
        .range(-100, 100)
        .noUnits()
        .step(0.1)
        .expRate(1.33)
        .decimalPlaces(4)
        .on("change", segment_update);
    }

    struct.bool("renderable", "renderable", "renderable");
    struct.struct("mat", "mat", "undefined", api.mapStruct(Material, true));
    struct
      .float("z", "z", "z")
      .range(-100000000000000000, 100000000000000000)
      .step(0.1)
      .expRate(1.33)
      .decimalPlaces(4);

    return struct;
  }

  static defineFlagsAPI(struct: DataStruct<FullContext, SplineElement>) {
    return super.defineFlagsAPI(struct).on("change", function () {
      let segment = this.dataref as SplineSegment;

      segment.flag |= SplineFlags.REDRAW;

      this.ctx.spline.regen_sort();
      window.redraw_viewport();
    });
  }
}

SplineSegment.STRUCT =
  structInherit(SplineSegment, SplineElement) +
  `
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
