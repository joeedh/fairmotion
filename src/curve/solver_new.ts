"USE_PREPROCESSOR"

import {KSCALE, KANGLE} from './spline_math.js';
import {SplineTypes, SplineFlags} from './spline_base.js'

import type {Spline} from './spline.js';
import type {SplineSegment, SplineVertex} from './spline_types.js';

let acos                                                                = Math.acos, asin                                              = Math.asin, cos = Math.cos, sin = Math.sin,
    PI = Math.PI, pow = Math.pow, sqrt = Math.sqrt, log = Math.log, abs = Math.abs;

/* Angle between the two segments' tangents at s1 and s2. `doflip` is -1 when
   the second segment runs the other way. */
const TAN_C = (seg1 : SplineSegment, seg2 : SplineSegment, s1 : number, s2 : number,
               order : number, doflip : number) => {
  let ta = seg1.derivative(s1, order), tb = seg2.derivative(s2, order);
  if (doflip < 0.0)
    tb.negate();

  ta.normalize();
  tb.normalize();
  let _d = Math.min(Math.max(ta.dot(tb), -1.0), 1.0);
  return acos(_d);
};

/* Angle between seg1's tangent at s1 and a fixed direction. */
const HARD_TAN_C = (seg1 : SplineSegment, s1 : number, goal : Vector3,
                    order : number) => {
  let ta = seg1.derivative(s1, order).normalize();
  let _d = Math.min(Math.max(ta.dot(goal), -1.0), 1.0);
  return acos(_d);
};

/* One tangent-continuity record: the vertex, the segment(s) meeting there,
   the parameter along each, whether the second runs the other way, and how
   lopsided the two segments' lengths are. */
interface TanPair {
  v : SplineVertex;
  seg1 : SplineSegment;
  seg2 : SplineSegment | undefined;
  s1 : number;
  s2 : number;
  doflip : number;
  ratio : number;
}

let _solver_static_tan = new Vector3();
/* Dead: spline.ts imports this and never calls it. The wasm solver, and
   spline_math_hermite's JS fallback, are the live paths.

   NOTE: both reset loops indexed `edge_segs` numerically.  A set has a length
   but no numeric keys, so the first iteration read undefined and threw; they
   iterate the set directly now. */
export function solve(spline: Spline, order: number, steps: number, gk: number,
                      do_inc: boolean, edge_segs: set<SplineSegment>) {
  let pairs : TanPair[] = [];

  let CBREAK = SplineFlags.BREAK_CURVATURES;
  let TBREAK = SplineFlags.BREAK_TANGENTS;

  function reset_edge_segs() {
    if (!do_inc) {
      return;
    }

    for (let seg of edge_segs) {
      let ks = seg.ks;
      for (let k = 0; k < ks.length; k++) {
        ks[k] = seg._last_ks[k];
      }
    }
  }

  let eps = 0.0001;
  for (let i = 0; i < spline.handles.length; i++) {
    let h = spline.handles[i], seg1 = h.owning_segment, v = h.owning_vertex!;

    if (do_inc && !((v.flag) & SplineFlags.UPDATE))
      continue;
    if (!(h.flag & SplineFlags.USE_HANDLES) && v.segments.length <= 2)
      continue;

    if (h.hpair !== undefined && (h.flag & SplineFlags.AUTO_PAIRED_HANDLE)) {
      let seg2 = h.hpair.owning_segment;

      let s1 = v === seg1.v1 ? eps : 1.0 - eps, s2 = v === seg2.v1 ? eps : 1.0 - eps;

      let thresh = 5;
      if (seg1.v1.vectorDistance(seg1.v2) < thresh || seg2.v1.vectorDistance(seg2.v2) < thresh)
        continue;

      //smallest distance ratio between both segments
      let d1 = seg1.v1.vectorDistance(seg1.v2);
      let d2 = seg2.v1.vectorDistance(seg2.v2);
      let ratio = Math.min(d1/d2, d2/d1);

      //console.log("ratio", ratio.toFixed(4));
      if (isNaN(ratio)) ratio = 0.0;

      pairs.push({
        v, seg1, seg2, s1, s2,
        doflip : (s1 < 0.5) === (s2 < 0.5) ? -1 : 1, //flip second derivative
        ratio
      });
    } else if (!(h.flag & SplineFlags.AUTO_PAIRED_HANDLE)) {
      let s1 = v === seg1.v1 ? 0 : 1;

      pairs.push({
        v, seg1,
        seg2   : undefined,
        s1,
        s2     : 0.0,
        doflip : 1, //flip second derivative
        ratio  : 1
      });
    }
  }

  for (let i = 0; i < spline.verts.length; i++) {
    let v = spline.verts[i];

    if (do_inc && !((v.flag) & SplineFlags.UPDATE))
      continue;

    if (v.segments.length !== 2) continue;
    if (v.flag & TBREAK) continue;

    let seg1 = v.segments[0], seg2 = v.segments[1];
    let s1 = v === seg1.v1 ? 0 : 1, s2 = v === seg2.v1 ? 0 : 1;

    seg1.evaluate(0.5, order);
    seg2.evaluate(0.5, order);

    let thresh = 5;
    if (seg1.v1.vectorDistance(seg1.v2) < thresh || seg2.v1.vectorDistance(seg2.v2) < thresh)
      continue;

    //smallest distance ratio between both segments
    let d1 = seg1.v1.vectorDistance(seg1.v2);
    let d2 = seg2.v1.vectorDistance(seg2.v2);
    let ratio = Math.min(d1/d2, d2/d1);

    //console.log("ratio", ratio.toFixed(4));
    if (isNaN(ratio)) ratio = 0.0;

    pairs.push({
      v, seg1, seg2, s1, s2,
      doflip : (s1 === 0.0) === (s2 === 0.0) ? -1 : 1, //flip second derivative
      ratio
    });
  }

  /* One gradient row per record, two segments' worth of ks each. */
  let glist : number[][] = [];
  for (let i = 0; i < pairs.length; i++) {
    glist.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }

  let klist1 : number[][] = [];
  for (let i = 0; i < pairs.length; i++) {
    klist1.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  let klist2 : number[][] = [];
  for (let i = 0; i < pairs.length; i++) {
    klist2.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }

  let gs = new Array(order);
  let df = 0.00003;
  let err = 0.0;

  if (pairs.length === 0)
    return;

  for (let si = 0; si < steps; si++) {
    let i = 0;
    let plen = pairs.length;

    if (isNaN(err) || isNaN(plen))
      break;

    //console.log(err/plen);
    if (si > 0 && err/plen < 0.1) break;

    const tan = _solver_static_tan;

    //walk backwards every other frame
    let di = 0;
    if (si%2) {
      di = -2;
      i = plen - 1;
    }

    reset_edge_segs();

    err = 0.0;
    while (i < plen && i >= 0) {
      let cnum = i;

      let {v, seg1, seg2, s1, s2, doflip, ratio} = pairs[i++];
      i += di;

      for (let ci = 0; ci < 2; ci++) {
        if (0 && seg2 !== undefined && ratio > 0.1 && !(v.flag & CBREAK)) {
          let sz1 = seg1.ks[KSCALE], sz2 = seg2.ks[KSCALE];
          let i1 = s1*(order - 1), i2 = s2*(order - 1);

          let k1 = seg1.ks[i1], k2 = seg2.ks[i2];
          let k = ((k1/sz1) + (k2/sz2*doflip))/2.0;

          seg1.ks[i1] = seg1.ks[i1] + (k*sz1 - seg1.ks[i1])*1;//0.5;
          seg2.ks[i2] = seg2.ks[i2] + (k*doflip*sz2 - seg2.ks[i2])*1;//0.5;
        }

        let r;
        if (seg2 !== undefined) {
          r = TAN_C(seg1, seg2, s1, s2, order, doflip);
        } else {
          let h = seg1.handle(v);

          /* NOTE: h and v are both 2d, so load()/sub() left z undefined and
             then NaN -- normalize() no-ops and HARD_TAN_C returns NaN.  Spelled
             out rather than fixed; nothing calls this function. */
          tan[0] = h![0] - v[0];
          tan[1] = h![1] - v[1];
          tan[2] = NaN;
          tan.normalize();

          if (v === seg1.v2)
            tan.negate();

          r = HARD_TAN_C(seg1, s1, tan, order);
        }

        if (r < 0.0001) continue;
        err += r;

        let totgs = 0.0;
        let gs = glist[cnum];
        let seglen = (seg2 === undefined) ? 1 : 2;

        for (let sj = 0; sj < seglen; sj++) {
          /* seglen is 1 unless seg2 is there. */
          let seg = sj ? seg2! : seg1;

          for (let j = 0; j < order; j++) {
            let orig = seg.ks[j];
            seg.ks[j] += df;

            let r2;
            if (seg2 !== undefined) {
              r2 = TAN_C(seg1, seg2, s1, s2, order, doflip);
            } else {
              r2 = HARD_TAN_C(seg1, s1, tan, order);
            }

            let g = (r2 - r)/df;

            gs[sj*order + j] = g; //+ (g-gs[sj*order+j])*(1.0/6.0);

            totgs += g*g;
            seg.ks[j] = orig;
          }
        }

        if (totgs === 0.0) continue;
        r /= totgs;

        let unstable = ratio < 0.1;

        for (let sj = 0; sj < seglen; sj++) {
          /* seglen is 1 unless seg2 is there. */
          let seg = sj ? seg2! : seg1;

          for (let j = 0; j < order; j++) {
            let g = gs[sj*order + j];

            if (order > 2 && unstable && (j === 0 || j === order - 1)) {
              //g *= 0.5;
            }
            /*
            if (j === 0 || j === order-1)
              g *= 0.1;
            //*/
            seg.ks[j] += -r*g*gk;
          }
        }

        // /*
        if (seg2 !== undefined && ratio > 0.1 && !(v.flag & CBREAK)) {
          let sz1 = seg1.ks[KSCALE], sz2 = seg2.ks[KSCALE];
          let i1 = s1*(order - 1), i2 = s2*(order - 1);

          let k1 = seg1.ks[i1], k2 = seg2.ks[i2];
          let k = ((k1/sz1) + (k2/sz2*doflip))/2.0;

          seg1.ks[i1] = seg1.ks[i1] + (k*sz1 - seg1.ks[i1])*1;//0.5;
          seg2.ks[i2] = seg2.ks[i2] + (k*doflip*sz2 - seg2.ks[i2])*1;//0.5;
        }
        //*/
      }
    }

    for (let seg of edge_segs) {
      let ks = seg.ks;

      for (let k = 0; k < ks.length; k++) {
        seg.ks[k] = seg._last_ks[k];
      }
    }
  }

  //console.log("err", err.toFixed(3));
}
