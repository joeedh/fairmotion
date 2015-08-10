var $init_constructor=[0, 0, 0];
var $_tmp_cross=[0, 0, 0];
var $vec_vectorDistance=new Vector3();
var $vec_vectorDotDistance=new Vector3();
var $add_static_add=new Vector3();
var $_static_sub_static_sub=new Vector3();
var $_static_mul_static_mul=new Vector3();
var $_static_divide_static_divide=new Vector3();
var $_static_addScalar_static_addScalar=new Vector3();
var $_static_subScalar_static_subScalar=new Vector3();
var $_static_mulScalar_static_mulScalar=new Vector3();
var $_static_divideScalar__static_divideScalar=new Vector3();
var $n1_normalizedDot=new Vector3();
var $_v3nd4_n1_normalizedDot4=new Vector3();
var $n1_normalizedDot3=new Vector3();
var $n2_normalizedDot=new Vector3();
var $_v3nd4_n2_normalizedDot4=new Vector3();
var $n2_normalizedDot3=new Vector3();

class Vector3 extends Array {
  constructor(vec) {
    if ($init_constructor==undefined)
      $init_constructor = [0, 0, 0];
    if (vec==undefined)
      vec = $init_constructor;
    if (vec[0]==undefined)
      vec[0] = 0;
    if (vec[1]==undefined)
      vec[1] = 0;
    if (vec[2]==undefined)
      vec[2] = 0;
    if (typeof (vec)=="number"||typeof (vec[0])!="number")
      throw new Error("Invalid argument to new Vector3(vec)");
    this.length = 3;
    this[0] = vec[0];
    this[1] = vec[1];
    this[2] = vec[2];
  }
  toJSON() {
    var arr=new Array(this.length);
    var i=0;
    for (var i=0; i<this.length; i++) {
        arr[i] = this[i];
    }
    return arr;
  }
  zero() {
    this[0] = 0.0;
    this[1] = 0.0;
    this[2] = 0.0;
    return this;
  }
  floor() {
    this[0] = Math.floor(this[0]);
    this[1] = Math.floor(this[1]);
    this[2] = Math.floor(this[2]);
    return this;
  }
  ceil() {
    this[0] = Math.ceil(this[0]);
    this[1] = Math.ceil(this[1]);
    this[2] = Math.ceil(this[2]);
    return this;
  }
  loadxy(vec2, z=0) {
    this[0] = vec2[0];
    this[1] = vec2[1];
    this[3] = z;
    return this;
  }
  load(vec3) {
    this[0] = vec3[0];
    this[1] = vec3[1];
    this[2] = vec3[2];
    return this;
  }
  loadXYZ(x, y, z) {
    this[0] = x;
    this[1] = y;
    this[2] = z;
    return this;
  }
  static temp_xyz(x, y, z) {
    var vec=_temp_xyz_vecs[_temp_xyz_cur];
    if (vec==null) {
        vec = new Vector3();
        _temp_xyz_vecs[_temp_xyz_cur] = vec;
    }
    _temp_xyz_cur = (_temp_xyz_cur+1)%_temp_xyz_vecs.length;
    vec.loadXYZ(x, y, z);
    return vec;
  }
  getAsArray() {
    return [this[0], this[1], this[2]];
  }
  min(b) {
    this[0] = Math.min(this[0], b[0]);
    this[1] = Math.min(this[1], b[1]);
    this[2] = Math.min(this[2], b[2]);
    return this;
  }
  max(b) {
    this[0] = Math.max(this[0], b[0]);
    this[1] = Math.max(this[1], b[1]);
    this[2] = Math.max(this[2], b[2]);
    return this;
  }
  floor(b) {
    this[0] = Math.floor(this[0], b[0]);
    this[1] = Math.floor(this[1], b[1]);
    this[2] = Math.floor(this[2], b[2]);
    return this;
  }
  ceil(b) {
    this[0] = Math.ceil(this[0], b[0]);
    this[1] = Math.ceil(this[1], b[1]);
    this[2] = Math.ceil(this[2], b[2]);
    return this;
  }
  round(b) {
    this[0] = Math.round(this[0], b[0]);
    this[1] = Math.round(this[1], b[1]);
    this[2] = Math.round(this[2], b[2]);
    return this;
  }
  getAsFloat32Array() {
    return new Float32Array(this.getAsArray());
  }
  vectorLength() {
    return Math.sqrt(this[0]*this[0]+this[1]*this[1]+this[2]*this[2]);
  }
  rot2d(angle) {
    angle+=PI/2;
    var x=this[0], y=this[1];
    this[0] = sin(angle)*x+cos(angle)*y;
    this[1] = sin(angle)*y-cos(angle)*x;
    return this;
  }
  normalize() {
    var len=this.vectorLength();
    if (len>FLT_EPSILON*2)
      this.mulScalar(1.0/len);
    return this;
  }
  negate() {
    this[0] = -this[0];
    this[1] = -this[1];
    this[2] = -this[2];
    return this;
  }
  fast_normalize() {
    var d=this[0]*this[0]+this[1]*this[1]+this[2]*this[2];
    var len=Math.sqrt(d);
    if (len>FLT_EPSILON)
      return 0;
    this[0]/=len;
    this[1]/=len;
    this[2]/=len;
    return this;
  }
  divideVect(v) {
    this[0]/=v[0];
    this[1]/=v[1];
    this[2]/=v[2];
    return this;
  }
  divide(divisor) {
    this[0]/=divisor;
    this[1]/=divisor;
    this[2]/=divisor;
    return this;
  }
  divideScalar(divisor) {
    this[0]/=divisor;
    this[1]/=divisor;
    this[2]/=divisor;
    return this;
  }
  divScalar(divisor) {
    this[0]/=divisor;
    this[1]/=divisor;
    this[2]/=divisor;
    return this;
  }
  divVector(vec) {
    this[0]/=vec[0];
    this[1]/=vec[1];
    this[2]/=vec[2];
    return this;
  }
  subScalar(scalar) {
    this[0]-=scalar;
    this[1]-=scalar;
    this[2]-=scalar;
    return this;
  }
  addScalar(scalar) {
    this[0]+=scalar;
    this[1]+=scalar;
    this[2]+=scalar;
    return this;
  }
  mulScalar(scalar) {
    this[0]*=scalar;
    this[1]*=scalar;
    this[2]*=scalar;
    return this;
  }
  mul(v) {
    this[0] = this[0]*v[0];
    this[1] = this[1]*v[1];
    this[2] = this[2]*v[2];
    return this;
  }
  cross(v) {
    $_tmp_cross[0] = this[1]*v[2]-this[2]*v[1];
    $_tmp_cross[1] = this[2]*v[0]-this[0]*v[2];
    $_tmp_cross[2] = this[0]*v[1]-this[1]*v[0];
    this[0] = $_tmp_cross[0];
    this[1] = $_tmp_cross[1];
    this[2] = $_tmp_cross[2];
    return this;
  }
  vectorDistance(v2) {
    $vec_vectorDistance.load(this);
    $vec_vectorDistance.sub(v2);
    return $vec_vectorDistance.vectorLength();
  }
  vectorDotDistance(v2) {
    $vec_vectorDotDistance.load(this);
    $vec_vectorDotDistance.sub(v2);
    return $vec_vectorDotDistance.dot($vec_vectorDotDistance);
  }
  sub(v) {
    if (v==null||v==undefined)
      console.trace();
    this[0] = this[0]-v[0];
    this[1] = this[1]-v[1];
    this[2] = this[2]-v[2];
    return this;
  }
  add(v) {
    this[0] = this[0]+v[0];
    this[1] = this[1]+v[1];
    this[2] = this[2]+v[2];
    return this;
  }
  static_add(v) {
    $add_static_add[0] = this[0]+v[0];
    $add_static_add[1] = this[1]+v[1];
    $add_static_add[2] = this[2]+v[2];
    return $add_static_add;
  }
  static_sub(v) {
    $_static_sub_static_sub[0] = this[0]-v[0];
    $_static_sub_static_sub[1] = this[1]-v[1];
    $_static_sub_static_sub[2] = this[2]-v[2];
    return $_static_sub_static_sub;
  }
  static_mul(v) {
    $_static_mul_static_mul[0] = this[0]*v[0];
    $_static_mul_static_mul[1] = this[1]*v[1];
    $_static_mul_static_mul[2] = this[2]*v[2];
    return $_static_mul_static_mul;
  }
  static_divide(v) {
    $_static_divide_static_divide[0] = this[0]/v[0];
    $_static_divide_static_divide[1] = this[1]/v[1];
    $_static_divide_static_divide[2] = this[2]/v[2];
    return $_static_divide_static_divide;
  }
  static_addScalar(s) {
    $_static_addScalar_static_addScalar[0] = this[0]+s;
    $_static_addScalar_static_addScalar[1] = this[1]+s;
    $_static_addScalar_static_addScalar[2] = this[2]+s;
    return $_static_addScalar_static_addScalar;
  }
  static_subScalar(s) {
    $_static_subScalar_static_subScalar[0] = this[0]-s;
    $_static_subScalar_static_subScalar[1] = this[1]-s;
    $_static_subScalar_static_subScalar[2] = this[2]-s;
    return $_static_subScalar_static_subScalar;
  }
  static_mulScalar(s) {
    $_static_mulScalar_static_mulScalar[0] = this[0]*s;
    $_static_mulScalar_static_mulScalar[1] = this[1]*s;
    $_static_mulScalar_static_mulScalar[2] = this[2]*s;
    return $_static_mulScalar_static_mulScalar;
  }
  _static_divideScalar(s) {
    $_static_divideScalar__static_divideScalar[0] = this[0]/s;
    $_static_divideScalar__static_divideScalar[1] = this[1]/s;
    $_static_divideScalar__static_divideScalar[2] = this[2]/s;
    return $_static_divideScalar__static_divideScalar;
  }
  dot(v) {
    return this[0]*v[0]+this[1]*v[1]+this[2]*v[2];
  }
  normalizedDot(v) {
    $n1_normalizedDot.load(this);
    $n2_normalizedDot.load(v);
    $n1_normalizedDot.normalize();
    $n2_normalizedDot.normalize();
    return $n1_normalizedDot.dot($n2_normalizedDot);
  }
  static normalizedDot4(v1, v2, v3, v4) {
    $_v3nd4_n1_normalizedDot4.load(v2).sub(v1).normalize();
    $_v3nd4_n2_normalizedDot4.load(v4).sub(v3).normalize();
    return $_v3nd4_n1_normalizedDot4.dot($_v3nd4_n2_normalizedDot4);
  }
  static normalizedDot3(v1, v2, v3) {
    $n1_normalizedDot3.load(v1).sub(v2).normalize();
    $n2_normalizedDot3.load(v3).sub(v2).normalize();
    return $n1_normalizedDot3.dot($n2_normalizedDot3);
  }
  preNormalizedAngle(v2) {
    if (this.dot(v2)<0.0) {
        var vec=new Vector3();
        vec[0] = -v2[0];
        vec[1] = -v2[1];
        vec[2] = -v2[2];
        return Math.pi-2.0*saasin(vec.vectorDistance(this)/2.0);
    }
    else 
      return 2.0*saasin(v2.vectorDistance(this)/2.0);
  }
  combine(v, ascl, bscl) {
    this[0] = (ascl*this[0])+(bscl*v[0]);
    this[1] = (ascl*this[1])+(bscl*v[1]);
    this[2] = (ascl*this[2])+(bscl*v[2]);
  }
  mulVecQuat(q) {
    var t0=-this[1]*this[0]-this[2]*this[1]-this[3]*this[2];
    var t1=this[0]*this[0]+this[2]*this[2]-this[3]*this[1];
    var t2=this[0]*this[1]+this[3]*this[0]-this[1]*this[2];
    this[2] = this[0]*this[2]+this[1]*this[1]-this[2]*this[0];
    this[0] = t1;
    this[1] = t2;
    t1 = t0*-this[1]+this[0]*this[0]-this[1]*this[3]+this[2]*this[2];
    t2 = t0*-this[2]+this[1]*this[0]-this[2]*this[1]+this[0]*this[3];
    this[2] = t0*-this[3]+this[2]*this[0]-this[0]*this[2]+this[1]*this[1];
    this[0] = t1;
    this[1] = t2;
  }
  multVecMatrix(matrix, ignore_w=false) {
    matrix.multVecMatrix(this, ignore_w);
  }
  interp(b, t) {
    this[0]+=(b[0]-this[0])*t;
    this[1]+=(b[1]-this[1])*t;
    this[2]+=(b[2]-this[2])*t;
  }
  toString() {
    return "["+this[0]+","+this[1]+","+this[2]+"]";
  }
}
