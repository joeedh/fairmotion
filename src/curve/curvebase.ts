export var CurveTypes = {
  CLOTHOID: 1,
};

export var CurveFlags = {
  SELECT: 1,
  UPDATE: 2,
};

/* CurveTypes value -> the class implementing it. Nothing registers into this
   yet, so CurveData.cfi is always undefined. */
export var CurveInterfaces: { [type: number]: typeof CurveInterface } = {};

//four-parameter curves: two points, two tangents, and two (geometric) curvatures
export class CurveData {
  flag: number;
  length: number;
  /* One of CurveTypes. */
  type: number;
  /* The curve interface for `type`; see CurveInterfaces above. */
  cfi: typeof CurveInterface;

  constructor(type: number) {
    this.type = type;
    this.flag = 0;
    this.length = 0;
    this.cfi = CurveInterfaces[type]; //curve interface
  }

  update() {
    this.flag |= CurveFlags.UPDATE;
  }

  copy() {
    var ret = new CurveData(this.type);
    ret.flag = this.flag;
    ret.length = this.length;
    ret.cfi = this.cfi;
    ret.update();

    return ret;
  }
}

/* Were `static` inside CurveInterface.derivative()/normal(). Each method had its
   own cachering, so they stay separate. */
const _derivative_rets = cachering.fromConstructor(Vector2, 16);
const _normal_rets = cachering.fromConstructor(Vector2, 16);

/* A four-parameter curve: two endpoints, two tangents, two geometric
   curvatures. Every method below takes that description plus the arc-length
   parameter `s` and the shared CurveData.

   Subclasses supply evaluate(); everything else is a finite difference off it.
   The base evaluate(), closest_point() and update() are unimplemented stubs;
   they used to fall off the end and return undefined, and now throw the same
   way ClothoidInterface's do. */
class CurveInterface {
  static evaluate(
    p1: Vector2,
    p2: Vector2,
    t1: Vector2,
    t2: Vector2,
    k1: number,
    k2: number,
    s: number,
    cdata: CurveData
  ): Vector2 {
    throw new Error("evaluate: implement me");
  }

  static derivative(
    p1: Vector2,
    p2: Vector2,
    t1: Vector2,
    t2: Vector2,
    k1: number,
    k2: number,
    s: number,
    cdata: CurveData
  ): Vector2 {
    const rets = _derivative_rets;

    var df = 0.0001;

    var a = this.evaluate(p1, p2, t1, t2, k1, k2, s, cdata);
    var b = this.evaluate(p1, p2, t1, t2, k1, k2, s + df, cdata);

    b.sub(a).mulScalar(1.0 / df);

    return rets.next().load(b);
  }

  static normal(
    p1: Vector2,
    p2: Vector2,
    t1: Vector2,
    t2: Vector2,
    k1: number,
    k2: number,
    s: number,
    cdata: CurveData
  ): Vector2 {
    const rets = _normal_rets;

    var df = 0.0001;

    var a = this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
    var b = this.derivative(p1, p2, t1, t2, k1, k2, s + df, cdata);

    b.sub(a).mulScalar(1.0 / df);

    return rets.next().load(b);
  }

  static curvature(
    p1: Vector2,
    p2: Vector2,
    t1: Vector2,
    t2: Vector2,
    k1: number,
    k2: number,
    s: number,
    cdata: CurveData
  ): number {
    var dv1 = this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
    var dv2 = this.normal(p1, p2, t1, t2, k1, k2, s, cdata);

    return (dv1[0] * dv2[1] - dv2[1] * dv1[0]) / Math.pow(dv1.dot(dv1), 3.0 / 2.0);
  }

  static curvature_dv(
    p1: Vector2,
    p2: Vector2,
    t1: Vector2,
    t2: Vector2,
    k1: number,
    k2: number,
    s: number,
    cdata: CurveData
  ): number {
    var df = 0.0001;

    var a = this.curvature(p1, p2, t1, t2, k1, k2, s, cdata);
    var b = this.curvature(p1, p2, t1, t2, k1, k2, s + df, cdata);

    return (b - a) / df;
  }

  static curvature_dv2(
    p1: Vector2,
    p2: Vector2,
    t1: Vector2,
    t2: Vector2,
    k1: number,
    k2: number,
    s: number,
    cdata: CurveData
  ): number {
    var df = 0.0001;

    var a = this.curvature_dv(p1, p2, t1, t2, k1, k2, s, cdata);
    var b = this.curvature_dv(p1, p2, t1, t2, k1, k2, s + df, cdata);

    return (b - a) / df;
  }

  static closest_point(
    p1: Vector2,
    p2: Vector2,
    t1: Vector2,
    t2: Vector2,
    k1: number,
    k2: number,
    p: Vector2,
    cdata: CurveData
  ): number {
    //need to implement this
    throw new Error("closest_point: implement me");
  }

  static update(
    p1: Vector2,
    p2: Vector2,
    t1: Vector2,
    t2: Vector2,
    k1: number,
    k2: number,
    s: number,
    cdata: CurveData
  ): number {
    throw new Error("update: implement me");
  }
}
