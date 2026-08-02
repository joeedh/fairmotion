"use strict";

let clothoid_dv_rets = cachering.fromConstructor(Vector2, 16);
let clothoid_no_rets = cachering.fromConstructor(Vector2, 16);

class ClothoidInterface {
  static evaluate(p1: Array<double>, p2: Array<double>,
                  t1: Array<double>, t2: Array<double>,
                  k1: double, k2: double, s: double, cdata: CurveData): Vector2 {
  }

  static derivative(p1: Array<double>, p2: Array<double>,
                    t1: Array<double>, t2: Array<double>,
                    k1: double, k2: double, s: double, cdata: CurveData): Vector2 {
    let df = 0.0001;

    let a = this.evaluate(p1, p2, t1, t2, k1, k2, s, cdata);
    let b = this.evaluate(p1, p2, t1, t2, k1, k2, s + df, cdata);

    b.sub(a).mulScalar(1.0/df);

    return clothoid_dv_rets.next().load(b);
  }

  static normal(p1: Array<double>, p2: Array<double>,
                t1: Array<double>, t2: Array<double>,
                k1: double, k2: double, s: double, cdata: CurveData): Vector2 {
    let df = 0.0001;

    let a = this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
    let b = this.derivative(p1, p2, t1, t2, k1, k2, s + df, cdata);

    b.sub(a).mulScalar(1.0/df);

    return clothoid_no_rets.next().load(b);
  }

  static curvature(p1: Array<double>, p2: Array<double>,
                   t1: Array<double>, t2: Array<double>,
                   k1: double, k2: double, s: double, cdata: CurveData): double {
    let dv1 = this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
    let dv2 = this.normal(p1, p2, t1, t2, k1, k2, s, cdata);

    return (dv1[0]*dv2[1] - dv2[1]*dv1[0])/Math.pow(dv1.dot(dv1), 3.0/2.0);
  }

  static curvature_dv(p1: Array<double>, p2: Array<double>,
                      t1: Array<double>, t2: Array<double>,
                      k1: double, k2: double, s: double, cdata: CurveData): double {
    let df = 0.0001;

    let a = this.curvature(p1, p2, t1, t2, k1, k2, s, cdata);
    let b = this.curvature(p1, p2, t1, t2, k1, k2, s + df, cdata);

    return (b - a)/df;
  }

  static curvature_dv2(p1: Array<double>, p2: Array<double>,
                       t1: Array<double>, t2: Array<double>,
                       k1: double, k2: double, s: double, cdata: CurveData): double {
    let df = 0.0001;

    let a = this.curvature_dv(p1, p2, t1, t2, k1, k2, s, cdata);
    let b = this.curvature_dv(p1, p2, t1, t2, k1, k2, s + df, cdata);

    return (b - a)/df;
  }

  static closest_point(p1: Array<double>, p2: Array<double>,
                       t1: Array<double>, t2: Array<double>,
                       k1: double, k2: double, p: Array<double>, cdata: CurveData): double {
    //need to implement this
  }

  static update(p1: Array<double>, p2: Array<double>,
                t1: Array<double>, t2: Array<double>,
                k1: double, k2: double, s: double, cdata: CurveData): double {
  }
}

import {CurveInterfaces} from './curvebase.js';
import {CurveTypes} from './curvebase.js';

CurveInterfaces[CurveTypes.CLOTHOID] = ClothoidInterface;