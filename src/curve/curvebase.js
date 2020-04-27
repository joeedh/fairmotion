
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
  constructor(type) {
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

class CurveInterface {
  static evaluate(Array<double> p1, Array<float> p2, 
                  Array<float> t1, Array<float> t2, 
                  double k1, double k2, double s, CurveData cdata) : Vector2
  {
  }
  
  static derivative(Array<double> p1, Array<float> p2, 
                  Array<float> t1, Array<float> t2, 
                  double k1, double k2, double s, CurveData cdata) : Vector2
  {
    static rets = cachering.fromConstructor(Vector2, 16);
    
    var df = 0.0001;
    
    var a = this.evaluate(p1, p2, t1, t2, k1, k2, s, cdata);
    var b = this.evaluate(p1, p2, t1, t2, k1, k2, s+df, cdata);
    
    b.sub(a).mulScalar(1.0/df);
    
    return rets.next().load(b);
  }
  
  static normal(Array<double> p1, Array<float> p2, 
                  Array<float> t1, Array<float> t2, 
                  double k1, double k2, double s, CurveData cdata) : Vector2
  {
    static rets = cachering.fromConstructor(Vector2, 16);
    
    var df = 0.0001;
    
    var a = this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
    var b = this.derivative(p1, p2, t1, t2, k1, k2, s+df, cdata);
    
    b.sub(a).mulScalar(1.0/df);
    
    return rets.next().load(b);
  }
  
  static curvature(Array<double> p1, Array<float> p2, 
                  Array<float> t1, Array<float> t2, 
                  double k1, double k2, double s, CurveData cdata) : double
  {
    var dv1 = this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
    var dv2 = this.normal(p1, p2, t1, t2, k1, k2, s, cdata);
    
    return (dv1[0]*dv2[1] - dv2[1]*dv1[0]) / Math.pow(dv1.dot(dv1), 3.0/2.0);
  }
  
  static curvature_dv(Array<double> p1, Array<float> p2, 
                  Array<float> t1, Array<float> t2, 
                  double k1, double k2, double s, CurveData cdata) : double
  {
    var df = 0.0001;
    
    var a = this.curvature(p1, p2, t1, t2, k1, k2, s, cdata);
    var b = this.curvature(p1, p2, t1, t2, k1, k2, s+df, cdata);
    
    return (b-a)/df;
  }
  
  static curvature_dv2(Array<double> p1, Array<float> p2, 
                  Array<float> t1, Array<float> t2, 
                  double k1, double k2, double s, CurveData cdata) : double
  {
    var df = 0.0001;
    
    var a = this.curvature_dv(p1, p2, t1, t2, k1, k2, s, cdata);
    var b = this.curvature_dv(p1, p2, t1, t2, k1, k2, s+df, cdata);
    
    return (b-a)/df;
  }
  
  static closest_point(Array<double> p1, Array<float> p2, 
                  Array<float> t1, Array<float> t2, 
                  double k1, double k2, Array<float> p, CurveData cdata) : double
  {
    //need to implement this
  }
  
  static update(Array<double> p1, Array<float> p2, 
                  Array<float> t1, Array<float> t2, 
                  double k1, double k2, double s, CurveData cdata) : double
  {
  }
}
