"use strict";

let clothoid_dv_rets = cachering.fromConstructor(Vector2, 16);
let clothoid_no_rets = cachering.fromConstructor(Vector2, 16);

import type {CurveData} from './curvebase.js';

/* The clothoid (Euler spiral) implementation of the CurveInterface shape in
   curvebase.ts: two endpoints, two tangents, two geometric curvatures.
   evaluate() and update() are still unimplemented stubs, so everything derived
   from them -- which is every other method here -- throws. */
class ClothoidInterface {
  static evaluate(p1: Vector2, p2: Vector2,
                  t1: Vector2, t2: Vector2,
                  k1: number, k2: number, s: number, cdata: CurveData): Vector2 {
    throw new Error("clothoid evaluate: implement me");
  }

  static derivative(p1: Vector2, p2: Vector2,
                    t1: Vector2, t2: Vector2,
                    k1: number, k2: number, s: number, cdata: CurveData): Vector2 {
    let df = 0.0001;

    let a = this.evaluate(p1, p2, t1, t2, k1, k2, s, cdata);
    let b = this.evaluate(p1, p2, t1, t2, k1, k2, s + df, cdata);

    b.sub(a).mulScalar(1.0/df);

    return clothoid_dv_rets.next().load(b);
  }

  static normal(p1: Vector2, p2: Vector2,
                t1: Vector2, t2: Vector2,
                k1: number, k2: number, s: number, cdata: CurveData): Vector2 {
    let df = 0.0001;

    let a = this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
    let b = this.derivative(p1, p2, t1, t2, k1, k2, s + df, cdata);

    b.sub(a).mulScalar(1.0/df);

    return clothoid_no_rets.next().load(b);
  }

  static curvature(p1: Vector2, p2: Vector2,
                   t1: Vector2, t2: Vector2,
                   k1: number, k2: number, s: number, cdata: CurveData): number {
    let dv1 = this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
    let dv2 = this.normal(p1, p2, t1, t2, k1, k2, s, cdata);

    return (dv1[0]*dv2[1] - dv2[1]*dv1[0])/Math.pow(dv1.dot(dv1), 3.0/2.0);
  }

  static curvature_dv(p1: Vector2, p2: Vector2,
                      t1: Vector2, t2: Vector2,
                      k1: number, k2: number, s: number, cdata: CurveData): number {
    let df = 0.0001;

    let a = this.curvature(p1, p2, t1, t2, k1, k2, s, cdata);
    let b = this.curvature(p1, p2, t1, t2, k1, k2, s + df, cdata);

    return (b - a)/df;
  }

  static curvature_dv2(p1: Vector2, p2: Vector2,
                       t1: Vector2, t2: Vector2,
                       k1: number, k2: number, s: number, cdata: CurveData): number {
    let df = 0.0001;

    let a = this.curvature_dv(p1, p2, t1, t2, k1, k2, s, cdata);
    let b = this.curvature_dv(p1, p2, t1, t2, k1, k2, s + df, cdata);

    return (b - a)/df;
  }

  static closest_point(p1: Vector2, p2: Vector2,
                       t1: Vector2, t2: Vector2,
                       k1: number, k2: number, p: Vector2, cdata: CurveData): number {
    //need to implement this
    throw new Error("clothoid closest_point: implement me");
  }

  static update(p1: Vector2, p2: Vector2,
                t1: Vector2, t2: Vector2,
                k1: number, k2: number, s: number, cdata: CurveData): number {
    throw new Error("clothoid update: implement me");
  }
}

import {CurveInterfaces} from './curvebase.js';
import {CurveTypes} from './curvebase.js';

CurveInterfaces[CurveTypes.CLOTHOID] = ClothoidInterface;