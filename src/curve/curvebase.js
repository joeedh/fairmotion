
export var CurveTypes = {
  CLOTHOID : 1,
}

export var CurveFlags = {
  SELECT : 1,
  UPDATE : 2,
};

export var CurveInterfaces = {
};

//four-parameter curves: two points, two tangents, and two (geometric) curvatures
export class CurveData {
  flag : number
  length : number;

  constructor(type : int) {
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

class CurveInterface {
  static evaluate(p1, p2, 
                  t1, t2, 
                  k1, k2, s, cdata) : Vector2
  {
  }
  
  static derivative(p1, p2, 
                  t1, t2, 
                  k1, k2, s, cdata) : Vector2
  {
    const rets = _derivative_rets;

    var df = 0.0001;

    var a = this.evaluate(p1, p2, t1, t2, k1, k2, s, cdata);
    var b = this.evaluate(p1, p2, t1, t2, k1, k2, s+df, cdata);
    
    b.sub(a).mulScalar(1.0/df);
    
    return rets.next().load(b);
  }
  
  static normal(p1, p2, 
                  t1, t2, 
                  k1, k2, s, cdata) : Vector2
  {
    const rets = _normal_rets;

    var df = 0.0001;

    var a = this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
    var b = this.derivative(p1, p2, t1, t2, k1, k2, s+df, cdata);
    
    b.sub(a).mulScalar(1.0/df);
    
    return rets.next().load(b);
  }
  
  static curvature(p1, p2, 
                  t1, t2, 
                  k1, k2, s, cdata) : double
  {
    var dv1 = this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
    var dv2 = this.normal(p1, p2, t1, t2, k1, k2, s, cdata);
    
    return (dv1[0]*dv2[1] - dv2[1]*dv1[0]) / Math.pow(dv1.dot(dv1), 3.0/2.0);
  }
  
  static curvature_dv(p1, p2, 
                  t1, t2, 
                  k1, k2, s, cdata) : double
  {
    var df = 0.0001;
    
    var a = this.curvature(p1, p2, t1, t2, k1, k2, s, cdata);
    var b = this.curvature(p1, p2, t1, t2, k1, k2, s+df, cdata);
    
    return (b-a)/df;
  }
  
  static curvature_dv2(p1, p2, 
                  t1, t2, 
                  k1, k2, s, cdata) : double
  {
    var df = 0.0001;
    
    var a = this.curvature_dv(p1, p2, t1, t2, k1, k2, s, cdata);
    var b = this.curvature_dv(p1, p2, t1, t2, k1, k2, s+df, cdata);
    
    return (b-a)/df;
  }
  
  static closest_point(p1, p2, 
                  t1, t2, 
                  k1, k2, p, cdata) : double
  {
    //need to implement this
  }
  
  static update(p1, p2, 
                  t1, t2, 
                  k1, k2, s, cdata) : double
  {
  }
}
