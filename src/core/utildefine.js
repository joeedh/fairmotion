var $_mh;

#define DECLARE_MATH_FUNCTIONS\
var PI = Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor,\
    ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos,\
    asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;


#ifdef NOCACHE
#define CACHEARR2(a, b) [a, b]
#define CACHEARR3(a, b, c) [a, b, c]
#define CACHEARR4(a, b, c, d) [a, b, c, d]
#else
#define CACHEARR2(a, b) (($_mh = objcache.array(2)), ($_mh[0] = (a)), ($_mh[1] = (b)), $_mh)
#define CACHEARR3(a, b, c) (($_mh = objcache.array(2)), ($_mh[0] = (a)), ($_mh[1] = (b)), ($_mh[2] = (c)), $_mh)
#define CACHEARR4(a, b, c, d) (($_mh = objcache.array(2)), ($_mh[0] = (a)), ($_mh[1] = (b)), ($_mh[2] = (c)), ($_mh[3] = (d)), $_mh)
#endif

var $_swapt;
#define SWAP(a, b) ($_swapt = a, a = b, b = $_swapt)

//high-performance math macros

#define VCROSS(r, a, b)\
  r[0] = a[1] * b[2] - a[2] * b[1];\
  r[1] = a[2] * b[0] - a[0] * b[2];\
  r[2] = a[0] * b[1] - a[1] * b[0];

#define VSUB(r, a, b)\
  r[0] = a[0] - b[0];\
  r[1] = a[1] - b[1];\
  r[2] = a[2] - b[2]
  
#define VADD(r, a, b)\
  r[0] = a[0] + b[0];\
  r[1] = a[1] + b[1];\
  r[2] = a[2] + b[2]

#define VDOT(a, b) (a[0]*b[0] + a[1]*b[1] + a[2]*b[2])

#define VNORMALIZE(a)\
  var _len = Math.sqrt(VDOT(a, a));\
  if (_len > 0.00001) _len = 1.0 / _len;\
  a[0] *= _len; a[1] *= _len; a[2] *= _len\

#define VLOAD(a, b) a[0] = b[0]; a[1] = b[1]; a[2] = b[2]

#define VZERO(a) a[0] = a[1] = a[2] = 0.0

#define VMULF(a, f)\
  a[0] *= f; a[1] *= f; a[2] *= f;

//var _static_byte = new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0]);
//var _static_view = new DataView(_static_byte.buffer);

/*
#define pack_int(data, i)\
  _static_view.setInt32(0, i);\
  data.push(_static_byte[0]);\
  data.push(_static_byte[1]);\
  data.push(_static_byte[2]);\
  data.push(_static_byte[3]);

#define pack_short(data, i)\
  _static_view.setInt16(0, i);\
  data.push(_static_byte[0]);\
  data.push(_static_byte[1]);

#define pack_byte(data, i) data.push(i);

#define pack_float(data, i)\
  _static_view.setFloat32(0, i);\
  data.push(_static_byte[0]);\
  data.push(_static_byte[1]);\
  data.push(_static_byte[2]);\
  data.push(_static_byte[3]);
    
#define pack_double(data, i)\
  _static_view.setFloat64(0, i);\
  data.push(_static_byte[0]);\
  data.push(_static_byte[1]);\
  data.push(_static_byte[2]);\
  data.push(_static_byte[3]);\
  data.push(_static_byte[4]);\
  data.push(_static_byte[5]);\
  data.push(_static_byte[6]);\
  data.push(_static_byte[7]);

#define pack_vec2(data, vec)\
  pack_float(data, vec[0]);\
  pack_float(data, vec[1]);

#define pack_vec3(data, vec)\
  pack_float(data, vec[0]);\
  pack_float(data, vec[1]);\
  pack_float(data, vec[2]);

#define pack_vec4(data, vec)\
  pack_float(data, vec[0]);\
  pack_float(data, vec[1]);\
  pack_float(data, vec[2]);\
  pack_float(data, vec[3]);

#define pack_quat(data, vec)\
  pack_float(data, vec[0]);\
  pack_float(data, vec[1]);\
  pack_float(data, vec[2]);\
  pack_float(data, vec[3]);

*/
