"use strict";

import {solver, constraint} from "solver";
import {ModalStates} from 'toolops_api';

/*
this is my original, "slow" research.  I ditched it 
in favor of something better, but as my company
is patenting that I can only publish this one
*/

//math globals
var FEPS = 1e-18;
var PI = Math.PI;
var sin = Math.sin, acos=Math.acos, asin=Math.asin, atan2=Math.atan2, sqrt=Math.sqrt;
var cos = Math.cos, pow=Math.pow, abs=Math.abs;
var SPI2 = Math.sqrt(PI/2);
var INCREMENTAL = true;

export var ORDER = 4;

export var KSCALE  = ORDER+1;
export var KANGLE  = ORDER+2;
export var KSTARTX = ORDER+3;
export var KSTARTY = ORDER+4;
export var KSTARTZ = ORDER+5;

export var KTOTKS  = ORDER+6;

export var INT_STEPS = 3;

export function set_int_steps(steps) {
  INT_STEPS = steps;
}

export function get_int_steps(steps) {
  return INT_STEPS;
}

var _approx_cache_vs = cachering.fromConstructor(Vector3, 32);

var mmax = Math.max, mmin = Math.min;
var mfloor = Math.floor, mceil = Math.ceil, abs = Math.abs, sqrt = Math.sqrt, sin = Math.sin, cos = Math.cos;

#define POLYTHETA_BEZ(s) (-(((3*(s)-4)*k3-k4*(s))*(s)*(s)+((s)*(s)-2*(s)+2)*((s)-2)*k1-(3*(s)*(s)-8*(s)+6)*k2*(s))*(s))*0.25

                            
#define POLYCURVATURE_BEZ(s) (-(((3*((s)-1)*k3-k4*(s))*(s)-3*((s)-1)*((s)-1)*k2)*(s)+((s)-1)*((s)-1)*((s)-1)*k1))

#define POLYCURVATURE_BEZ_DV(s) (-3*(k1*(s)*(s)-2*k1*(s)+k1-3*k2*(s)*(s)+4*k2*(s)-k2+3*k3*(s)*(s)-2*k3*(s)-k4*(s)*(s)))

var polytheta_bez = function(s, ks, order) {
  var k1 = ks[0], k2 = ks[1], k3 = ks[2], k4= ks[3];
  
  if (order == 2) {
    return (s*(-k1*s + 2*k1 + k2*s))/2.0;
  } else if (order == 3) {
    return (-(((2*s-3)*k2-k3*s)*s-(s*s-3*s+3)*k1)*s)/3.0;
  } else {
    return (-(((3*s-4)*k3-k4*s)*s*s+(s*s-2*s+2)*(s-2)*k1-(3*s*s-8*s+6)*k2*s)*s)/4.0;
  }
}

function polycurvature_bez(s, ks, order) {
  /*
  on factor;
  off period;
  procedure bez(a, b);
    a + (b - a)*s;
  
  quad := bez(bez(k1, k2), bez(k2, k3));
  cubic := bez(quad, sub(k3=k4, k2=k3, k1=k2, quad));
  
  k := cubic;
  th := int(k, s);
  dk := df(k, s);
*/
  var k1 = ks[0], k2 = ks[1], k3 = ks[2], k4= ks[3];
  
  if (order == 2) {
    return k1 + (k2 - k1)*s;
  } else if (order == 3) {
    return -((k1-k2+(k2-k3)*s-(k1-k2)*s)*s+(k1-k2)*s-k1);
  } else {
    return -(((3*(s-1)*k3-k4*s)*s-3*(s-1)*(s-1)*k2)*s+(s-1)*(s-1)*(s-1)*k1);
  }
}

function polycurvature_bez_dv(s, ks, order) {
  var k1 = ks[0], k2 = ks[1], k3 = ks[2], k4= ks[3];
  
  if (order == 2) {
    return -(k1-k2);
  } else if (order == 3) {
    return 2*(k1*s-k1-2*k2*s+k2+k3*s);
  } else {
    return -3*(k1*s*s-2*k1*s+k1-3*k2*s*s+4*k2*s-k2+3*k3*s*s-2*k3*s-k4*s*s);
  }
}


var approx_ret_cache = cachering.fromConstructor(Vector3, 42);
var abs = Math.abs;
var mmax = Math.max, mmin = Math.min;
//var ONE_INT_STEPS = 1.0/INT_STEPS;

#define FAST_INT_STEPS 3
#define ONE_INT_STEPS 0.333333333

import 'J3DIMath';

var acache = [new Vector3(), new Vector3(), new Vector3(), 
              new Vector3(), new Vector3(), new Vector3(), 
              new Vector3()]
var acur = 0;

#define approx_fast(ss, ks, order)\
  var s1 = ss*(1.0-0.0000001);\
  var s=0, ds=s1*ONE_INT_STEPS, mul=s1*ONE_INT_STEPS;\
  var mul2=mul*mul, mul3=mul2*mul, mul4=mul3*mul, mul5=mul4*mul, mul6=mul5*mul;\
  var ret = acache[acur]; acur = (acur+1) % 7;\
  ret[2] = 0.0;\
  var x = 0, y = 0, th, r1, dx, ky, dkt, kt2;\
  var k1 = ks[0], k2 = ks[1], k3 = ks[2], k4 = ks[3];\
    var th = POLYTHETA_BEZ(s+0.5);\
    var r1 = th - 0.1666666*th*th*th + 0.00833333*th*th*th*th*th;\
    var r2 = 1 - 0.5*th*th + 0.04166666*th*th*th*th;\
    var dx = r1, dy = r2;\
    var kt = POLYCURVATURE_BEZ(s+0.5);\
    var dkt = POLYCURVATURE_BEZ_DV(s+0.5);\
    var kt2=kt*kt;\
    x += dx + (r2*kt)*mul*0.5 + (r2*dkt - kt2*r1)*mul2*0.16666666666666;\
    y += dy + (-r1*kt)*mul*0.5 + (-(r2*kt2 + r1*dkt))*mul2*0.1666666666666;\
    s += ds;\
    var th = POLYTHETA_BEZ(s+0.5);\
    var r1 = sin(th), r2 = cos(th);\
    var dx = r1, dy = r2;\
    var kt = POLYCURVATURE_BEZ(s+0.5);\
    var dkt = POLYCURVATURE_BEZ_DV(s+0.5);\
    var kt2=kt*kt;\
    x += dx + (r2*kt)*mul*0.5 + (r2*dkt - kt2*r1)*mul2*0.16666666666666;\
    y += dy + (-r1*kt)*mul*0.5 + (-(r2*kt2 + r1*dkt))*mul2*0.1666666666666;\
    s += ds;\
    var th = POLYTHETA_BEZ(s+0.5);\
    var r1 = sin(th), r2 = cos(th);\
    var dx = r1, dy = r2;\
    var kt = POLYCURVATURE_BEZ(s+0.5);\
    var dkt = POLYCURVATURE_BEZ_DV(s+0.5);\
    var kt2=kt*kt;\
    x += dx + (r2*kt)*mul*0.5 + (r2*dkt - kt2*r1)*mul2*0.16666666666666;\
    y += dy + (-r1*kt)*mul*0.5 + (-(r2*kt2 + r1*dkt))*mul2*0.1666666666666;\
    s += ds;\
  ret[0] = x*mul;\
  ret[1] = y*mul;

var eval_curve_vs = cachering.fromConstructor(Vector3, 64);

var _eval_start = new Vector3();
export function eval_curve_fast(s11, v1, v2, ks, order, angle_only, no_update) {
  var start = _eval_start;
  if (order == undefined) order = ORDER;
  
  s11 *= 0.99999999;
  
  var eps = 0.000000001;
  
  var ang, scale, start;
  if (!no_update) {
    approx_fast(-0.5+eps, ks, order);
    var start = ret;
    
    approx_fast(0.5-eps, ks, order);
    var end = ret;
    
    end.sub(start);
    var a1 = atan2(end[0], end[1]);
    
    var vec = eval_curve_vs.next();
    vec.load(v2).sub(v1);
    
    var a2 = atan2(vec[0], vec[1]);
    
    ang = a2-a1;
    scale = vec.vectorLength() / end.vectorLength();
    
    ks[KSCALE] = scale;
    ks[KANGLE] = ang;
    ks[KSTARTX] = start[0];
    ks[KSTARTY] = start[1];
    ks[KSTARTZ] = start[2];
  } else {
    ang = ks[KANGLE];
    scale = ks[KSCALE];
    
    start[0] = ks[KSTARTX];
    start[1] = ks[KSTARTY];
    start[2] = ks[KSTARTZ];
  }
  
  if (!angle_only) {
    approx_fast(s11, ks, order);
    var co = ret;
    
    co.sub(start).rot2d(-ang).mulScalar(scale).add(v1);
    
    return co;
  }
};

export function approx(s1, ks, order, dis, steps) {
  s1 *= 1.0-0.0000001;
  
  if (steps == undefined)
    steps = INT_STEPS;
  var s=0, ds=s1/steps, mul=s1/steps;
  
  var mul2=mul*mul, mul3=mul2*mul, mul4=mul3*mul, mul5=mul4*mul, mul6=mul5*mul; //, mul7=mul6*mul, mul8=mul7*mul;
  
  var ret = approx_ret_cache.next();
  ret[0] = ret[1] = ret[2] = 0.0;
  var x = 0, y = 0;
  
  var k1 = ks[0], k2 = ks[1], k3 = ks[2], k4 = ks[3];
  
  for (var i=0; i<steps; i++) {
    //var th = polytheta_bez(s+0.5, ks, order);
    var th = POLYTHETA_BEZ(s+0.5);

    var r1 = sin(th), r2 = cos(th);
    //var r1 = th - 0.1666666*th*th*th + 0.00833333*th*th*th*th*th;
    //var r2 = 1 - 0.5*th*th + 0.04166666*th*th*th*th;
    
    var dx = r1, dy = r2;
    
    //var kt = polycurvature_bez(s+0.5, ks, order);
    //var dkt = polycurvature_bez_dv(s+0.5, ks, order); 
    
    var kt = POLYCURVATURE_BEZ(s+0.5); //polycurvature_bez(s+0.5, ks, order);
    var dkt = POLYCURVATURE_BEZ_DV(s+0.5); //polycurvature_bez_dv(s+0.5, ks, order);
    
    var kt2=kt*kt;
    
    x += dx + (r2*kt)*mul*0.5 + (r2*dkt - kt2*r1)*mul2*0.16666666666666;
    y += dy + (-r1*kt)*mul*0.5 + (-(r2*kt2 + r1*dkt))*mul2*0.1666666666666; 
    
    s += ds;
    
  }
  
  ret[0] = x*mul;
  ret[1] = y*mul;
  
  return ret;
}

export var spiraltheta = polytheta_bez;
export var spiralcurvature = polycurvature_bez;
export var spiralcurvature_dv = polycurvature_bez_dv;
export var ORDER = 4;

function solve_intern(spline, order, goal_order, steps, gk) {
  static con_cache = {
    list : [],
    used : 0
  };
  
  con_cache.used = 0;
  
  function con(w, ks, order, func, params) {
    if (con_cache.used < con_cache.list.length) {
      return con_cache.list[con_cache.used++].cache_init(w, ks, order, func, params);
    } else {
      var ret = new constraint(w, ks, order, func, params);
      con_cache.list.push(ret);
      con_cache.used++;
      return ret;
    }
  }
  
  if (order == undefined)
    order = ORDER;
  if (steps == undefined)
    steps = 35;
  if (gk == undefined)
    gk = 1.0;
    
  var edge_segs = [];
  var UPDATE = SplineFlags.UPDATE;
  for (var i=0; INCREMENTAL && i<spline.segments.length; i++) {
    var seg = spline.segments[i];
    if ((seg.v1.flag & UPDATE) != (seg.v2.flag & UPDATE)) {
      for (var j=0; j<KTOTKS; j++) {
        seg._last_ks[j] = seg.ks[j];
      }
      seg.flag |= SplineFlags.TEMP_TAG;
      edge_segs.push(seg);
      
      var s2=undefined, s3=undefined;
      if (seg.v1.segments.length == 2) s2 = seg.v1.other_segment(seg);
      if (seg.v2.segments.length == 2) s3 = seg.v2.other_segment(seg);
    } else {
      seg.flag &= ~SplineFlags.TEMP_TAG;
    }
 }
    
  var start_time = time_ms();
  
  window._SOLVING = true;
  var slv = new solver();
  
  function hard_tan_c(params) {
    var seg = params[0], tan = params[1], s = params[2];
    
    var dv = seg.derivative(s, order);
    dv.normalize();
    
    var a1 = Math.atan2(tan[0], tan[1]);
    var a2 = Math.atan2(dv[0], dv[1]);
    var diff = Math.abs(a1-a2);
    
    //if (diff > Math.PI)
    //  diff -= Math.PI;
      
    //return diff;
    
    return abs(dv.vectorDistance(tan));
  }
  
  function tan_c(params) {
    var seg1 = params[0], seg2 = params[1];
    var v, s1=0, s2=0;
    
    if (seg1.v1 == seg2.v1 || seg1.v1 == seg2.v2)
      v = seg1.v1;
    else if (seg1.v2 == seg2.v1 || seg1.v2 == seg2.v2)
      v = seg1.v2;
    else
      console.trace("EVIL INCARNATE!");
      
    var eps = 0.0001;
    s1 = v == seg1.v1 ? eps : 1.0-eps;
    s2 = v == seg2.v1 ? eps : 1.0-eps;
     
    var t1 = seg1.derivative(s1, order);
    var t2 = seg2.derivative(s2, order);
    
    t1.normalize(); t2.normalize();
    
    if (seg1.v1.eid == seg2.v1.eid || seg1.v2.eid == seg2.v2.eid) {
      t1.negate();
    }
    
    /*
    if (t1[1] == 0.0) 
      return t2[1];
    if (t2[1] == 0.0)
      return t1[1];
    
    return abs(t1[0]/t1[1] - t2[0]/t2[1]);
    //return abs(atan2(t1[0], t1[1]) - atan2(t2[0], t2[1])); //abs(t1[0]/t1[1] - t2[0]/t2[1]);
    //*/
    
    var d = t1.dot(t2);
    d = mmax(mmin(d, 1.0), -1.0);
    return acos(d);
    
    var ret = abs(t1.vectorDistance(t2));
    return ret;
  }
  
  function handle_curv_c(params) {
    if (order < 4) return 0;
    
    //HARD CLAMP
    var seg1 = params[0], seg2 = params[1];
    var h1 = params[2], h2 = params[3];
    
    var len1 = seg1.ks[KSCALE] - h1.vectorDistance(seg1.handle_vertex(h1));
    var len2 = seg2.ks[KSCALE] - h2.vectorDistance(seg2.handle_vertex(h2));
    
    var k1i = h1 == seg1.h1 ? 1 : order-2;
    var k2i = h2 == seg2.h1 ? 1 : order-2;
    
    var k1 = (len1 != 0.0 ? 1.0 / len1 : 0.0) * seg1.ks[KSCALE];
    var k2 = (len2 != 0.0 ? 1.0 / len2 : 0.0) * seg2.ks[KSCALE];
    
    var s1 = seg1.ks[k1i] < 0.0 ? -1 : 1;
    var s2 = seg2.ks[k2i] < 0.0 ? -1 : 1;
    
    if (isNaN(k1) || isNaN(k2)) return 0;
    console.log(k1, k2);
   
    if (abs(seg1.ks[k1i]) < k1) seg1.ks[k1i] = k1*s1;
    if (abs(seg2.ks[k2i]) < k2) seg2.ks[k2i] = k2*s2;
    
    return 0;
  }

  function curv_c(params) {
    //HARD CLAMP
    var seg1 = params[0], seg2 = params[1];
    var v, s1=0, s2=0;
    
    //*
    seg1.eval(0.5);
    seg2.eval(0.5);
    //*/
    
    if (seg1.v1 == seg2.v1 || seg1.v1 == seg2.v2)
      v = seg1.v1;
    else if (seg1.v2 == seg2.v1 || seg1.v2 == seg2.v2)
      v = seg1.v2;
    else
      console.trace("EVIL INCARNATE!");
    
    var s1 = v == seg1.v1 ? 0 : order-1;
    var s2 = v == seg2.v1 ? 0 : order-1;
    
    var k1 = seg1.ks[s1]/seg1.ks[KSCALE];
    var k2 = seg2.ks[s2]/seg2.ks[KSCALE];

    if (seg1.v1.eid == seg2.v1.eid || seg1.v2.eid == seg2.v2.eid) {
      k1 = -k1;
    }
    
    var k3 = (k1+k2)*0.5;
    
    seg2.ks[s2] = (k3*seg2.ks[KSCALE]);//2+seg2.ks[s2]/2;
    
    if (seg1.v1.eid == seg2.v1.eid || seg1.v2.eid == seg2.v2.eid) {
      k3 = -k3;
    }
    seg1.ks[s1] = (k3*seg1.ks[KSCALE]);//2+seg1.ks[s1]/2;
    
    return 0;
  }
   
  //handle manual tangents
  for (var i=0; i<spline.handles.length; i++) {
    var h = spline.handles[i];
    
    if (!h.use) continue;

    var seg = h.segments[0];
    
    if (seg.v1.vectorDistance(seg.v2) < 2) 
      continue;
    
    var v = seg.handle_vertex(h);
    if (INCREMENTAL && !((v.flag) & SplineFlags.UPDATE))
      continue;
    
    var tan1 = new Vector3(h).sub(seg.handle_vertex(h)).normalize();
    
    if (h == seg.h2)
      tan1.negate();
    
    if (isNaN(tan1.dot(tan1)) || tan1.dot(tan1) == 0.0) continue;
    
    var s = h == seg.h1 ? 0 : 1;
    var do_curv = (v.flag & SplineFlags.BREAK_CURVATURES);
    
    if (h.owning_vertex == undefined) continue;
    
    var do_tan = !((h.flag) & SplineFlags.BREAK_TANGENTS);
    do_tan = do_tan && !(h.flag & SplineFlags.AUTO_PAIRED_HANDLE);
    
    if (do_tan) {
      var tc = new constraint(0.25, [seg.ks], order, hard_tan_c, [seg, tan1, s]);
      tc.k2 = 1.0;
      slv.add(tc);
    }
    
    if (h.hpair == undefined) continue;

    var ss1 = seg, h2 = h.hpair, ss2=h2.owning_segment;

    if ((h.flag & SplineFlags.AUTO_PAIRED_HANDLE) && 
      !((seg.handle_vertex(h).flag & SplineFlags.BREAK_TANGENTS))) 
    {
      var tc = new constraint(0.3, [ss1.ks, ss2.ks], order, tan_c, [ss1, ss2]);
      tc.k2 = 0.8
      slv.add(tc);
    }
    
    /*
    var cw1 = 0.5, cw2=cw1;
    
    var cc = new constraint(cw1, [ss1.ks], order, handle_curv_c, [ss1, ss2, h, h2]);
    slv.add(cc);
    var cc = new constraint(cw2, [ss2.ks], order, handle_curv_c, [ss1, ss2, h, h2]);
    slv.add(cc);
    */
    
    var cc = new constraint(1, [ss1.ks], order, curv_c, [ss1, ss2, h, h2]);
    slv.add(cc);
    var cc = new constraint(1, [ss2.ks], order, curv_c, [ss1, ss2, h, h2]);
    slv.add(cc);
  }
  
  var limits = {
    v_curve_limit : 12,
    v_tan_limit   : 1
  };

  var manual_w = 0.08;
  var manual_w_2 = 0.6;
  
  for (var i=0; i<spline.verts.length; i++) {
    var v = spline.verts[i];
    if (v.segments.length != 1)
      continue;
    if (!(v.flag & SplineFlags.USE_HANDLES))
      continue;
    
    var ss1 = v.segments[0];
    var h = ss1.handle(v);
    var tan = new Vector3(h).sub(v).normalize();
    
    var s = v === ss1.v1 ? 0.0 : 1.0;
    if (v === ss1.v2) {
      tan.negate();
    }
    
    var tc = new constraint(manual_w, [ss1.ks], order, hard_tan_c, [ss1, tan, s]);
    tc.k2 = manual_w_2;
    
    slv.add(tc);
  }
  
  for (var i=0; i<spline.verts.length; i++) {
    var v = spline.verts[i];
    
    if (INCREMENTAL && !(v.flag & SplineFlags.UPDATE)) continue;
    if (v.segments.length != 2) continue;
    
    var ss1 = v.segments[0], ss2 = v.segments[1];
    
    var bad = false;
    
    //ignore anything connected to a zero-length segment
    for (var j=0; j<v.segments.length; j++) {
      var seg = v.segments[j];
      if (seg.v1.vectorDistance(seg.v2) < 2) {
        bad = true;
      }
    }
    
    var mindis = Math.min(ss1.other_vert(v).vectorDistance(v), ss2.other_vert(v).vectorDistance(v));
    var maxdis = Math.max(ss1.other_vert(v).vectorDistance(v), ss2.other_vert(v).vectorDistance(v));
    
    if (mindis == 0.0) {
      //bad = true;
    } else {
      //bad = bad || maxdis/mindis > 20.0;
    }
    //bad = bad || (mindis < limits.v_tan_limit);
    
    if (bad) {
      console.log("Ignoring!");
    }
    
    if (bad) continue;
    
    if (!(v.flag & (SplineFlags.BREAK_TANGENTS|SplineFlags.USE_HANDLES))) {
      var tc = new constraint(0.2, [ss2.ks], order, tan_c, [ss1, ss2]);
      tc.k2 = 0.8
      slv.add(tc);
      
      var tc = new constraint(0.2, [ss1.ks], order, tan_c, [ss2, ss1]);
      tc.k2 = 0.8
      slv.add(tc);
    } else if (!(v.flag & SplineFlags.BREAK_TANGENTS)) { //manual handles
      var h = ss1.handle(v);
      var tan = new Vector3(h).sub(v).normalize();
      
      var s = v === ss1.v1 ? 0.0 : 1.0;
      if (v === ss1.v2) {
        tan.negate();
      }
      
      var tc = new constraint(manual_w, [ss1.ks], order, hard_tan_c, [ss1, tan, s]);
      tc.k2 = manual_w_2;
      
      slv.add(tc);
      
      var h = ss2.handle(v);
      var tan = new Vector3(h).sub(v).normalize();
      
      var s = v === ss2.v1 ? 0.0 : 1.0;
      if (v === ss2.v2) {
        tan.negate();
      }
      
      var tc = new constraint(manual_w, [ss2.ks], order, hard_tan_c, [ss2, tan, s]);
      tc.k2 = manual_w_2;
      
      slv.add(tc);
    } else {
      continue;
    }
    
    if (v.flag & SplineFlags.BREAK_CURVATURES)
      continue;
      
    if (mindis == 0.0) {
      bad = true;
    } else {
      bad = bad || maxdis/mindis > 9.0;
    }
    
    if (bad) 
      continue;
      
    //if (mindis < limits.v_curve_limit)
    //  continue;
    
    var cc = new constraint(1, [ss1.ks], order, curv_c, [ss1, ss2]);
    slv.add(cc);
      
    var cc = new constraint(1, [ss2.ks], order, curv_c, [ss2, ss1]);
    slv.add(cc);
  }
  
  var totsteps = slv.solve(steps, gk, order==ORDER, edge_segs);
  
  window._SOLVING = false;
  
  for (var i=0; i<spline.segments.length; i++) {
    var seg = spline.segments[i];
    seg.eval(0.5);
  }
  
  var end_time = time_ms() - start_time;
  if (end_time > 50 || 1)
    console.log("solve time", end_time.toFixed(2), "ms", "steps", totsteps);
}

var SplineFlags = undefined;
export function do_solve(sflags, spline, steps, gk) {
  //if (spline === new Context().frameset.pathspline)
  //  return;
  SplineFlags = sflags;
  spline.propagate_update_flags();
  
  for (var i=0; i<spline.segments.length; i++) {
    var seg = spline.segments[i];
    
    if (INCREMENTAL && (!(seg.v1.flag & SplineFlags.UPDATE) || !(seg.v2.flag & SplineFlags.UPDATE)))
      continue;
    
    for (var j=0; j<seg.ks.length; j++) {
      seg.ks[j] = 0.000001; //(j-ORDER/2)*4;
    }
    
    seg.eval(0.5);
  }
  
  spline.resolve = 0;
  solve_intern(spline, ORDER, undefined, 70, 1);
  
  for (var i=0; i<spline.segments.length; i++) {
    var seg = spline.segments[i];
    seg.eval(0.5);
    
    for (var j=0; j<seg.ks.length; j++) {
      if (isNaN(seg.ks[j])) {
        seg.ks[j] = 0;
      }
    }
    
    //don't need to do spline here
    //want to avoid per-frame updates of spline sort
    if (g_app_state.modalstate != ModalStates.TRANSFROMING) {
      if ((seg.v1.flag & SplineFlags.UPDATE) || (seg.v2.flag & SplineFlags.UPDATE))
        seg.update_aabb();
    }
  }
  
  for (var f in spline.faces) {
    for (var path in f.paths) {
      for (var l in path) {
        if (l.v.flag & SplineFlags.UPDATE)
          f.flag |= SplineFlags.UPDATE_AABB;
      }
    }
  }
  
  if (!spline.is_anim_path) {
    for (var i=0; i<spline.handles.length; i++) {
      var h = spline.handles[i];
      h.flag &= ~(SplineFlags.UPDATE|SplineFlags.TEMP_TAG);
    }
    
    for (var i=0; i<spline.verts.length; i++) {
      var v = spline.verts[i];
      v.flag &= ~(SplineFlags.UPDATE|SplineFlags.TEMP_TAG);
    }
  }
  
  if (spline.on_resolve != undefined) {
    spline.on_resolve();
    spline.on_resolve = undefined;
  }
}

