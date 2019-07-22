"use strict";

//hermite clothoid

import {SplineFlags, SplineTypes} from 'spline_base';
import {solver, constraint} from "solver";
import {ModalStates} from 'toolops_api';

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

//XXX circular dependency between solver.js and here
window.KSCALE = KSCALE;

export var KTOTKS  = ORDER+6;

export var INT_STEPS = 4;

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

#define POLYTHETA_SBEZ(s) (((((3*s-4)*dv1_k2-6*(s-2)*k2)*s+(3*s2-8*s+6)*dv1_k1)*s+6\
              *(s3-2*s2+2)*k1)*s)/12

#define POLYCURVATURE_SBEZ(s) (((s-1)*dv1_k1+dv1_k2*s)*(s-1)-(2*s-3)*k2*s)*s+(2*s+1)*(s-1)*(s-1)*k1

#define POLYCURVATURE_SBEZ_DV(s) (6*(k1-k2)*(s-1)+(3*s-2)*dv1_k2)*s+(3*s-1)*(s-1)*dv1_k1
                               
var polytheta_spower = function polytheta_spower(s, ks, order) {
  var s2 = s*s, s3=s2*s, s4=s3*s, s5=s4*s, s6=s5*s, s7=s6*s, s8=s7*s, s9=s8*s;
  
  switch (order) {
    case 2:
      var k1 = ks[0], k2 = ks[1];
      
      return (-((s-2)*k1-k2*s)*s)/2.0;
    case 4:
      var k1 = ks[0], dv1_k1 = ks[1], dv1_k2 = ks[2], k2 = ks[3];
      
      return (((((3*s-4)*dv1_k2-6*(s-2)*k2)*s+(3*s2-8*s+6)*dv1_k1)*s+6
              *(s3-2*s2+2)*k1)*s)/12;
    case 6:
      var k1 = ks[0], dv1_k1 = ks[1], dv2_k1 = ks[2], dv2_k2 = ks[3], dv1_k2 = ks[4], k2 = ks[5];
      
      return (-((((60*dv1_k2*s2-168*dv1_k2*s+120*dv1_k2-10*dv2_k2*s2
        +24*dv2_k2*s-15*dv2_k2-120*k2*s2+360*k2*s-300*k2)*s+(10*s3
        -36*s2+45*s-20)*dv2_k1)*s+12*(5*s4-16*s3+15*s2-5)*
        dv1_k1)*s+60*(2*s5-6*s4+5*s3-2)*k1)*s)/120;
  }
}

var polycurvature_spower = function polycurvature_spower(s, ks, order) {
  var k1 = ks[0], 
           dv1_k1 = ks[1], dv2_k1 = ks[2], 
           dv2_k2 = ks[3], dv1_k2 = ks[4],
      k2 = ks[5];
  
  var s2 = s*s, s3=s2*s, s4=s3*s, s5=s4*s, s6=s5*s, s7=s6*s, s8=s7*s, s9=s8*s;

  switch (order) {
    case 2:
      var k1 = ks[0], k2 = ks[1];
      
      return -((s-1)*k1-k2*s);
    case 4:
      var k1 = ks[0], dv1_k1 = ks[1], dv1_k2 = ks[2], k2 = ks[3];
      
      return (((s-1)*dv1_k1+dv1_k2*s)*(s-1)-(2*s-3)*k2*s)*s+(2*s+1)*(s-1)*(s-1)*k1;
    case 6:
      return (-((((((s-1)*dv2_k1-dv2_k2*s)*(s-1)+2*(3*s-4)*dv1_k2*s)*s+2
            *(3*s+1)*(s-1)*(s-1)*dv1_k1)*(s-1)-2*(6*s2-15*s+10)*k2*s2)*s+
            2*(6*s2+3*s+1)*(s-1)*(s-1)*(s-1)*k1))/2.0;
  }
}

var polycurvature_dv_spower = function polycurvature_spower(s, ks, order) {
  var s2 = s*s, s3=s2*s, s4=s3*s, s5=s4*s, s6=s5*s, s7=s6*s, s8=s7*s, s9=s8*s;
  
  switch (order) {
    case 2:
      var k1 = ks[0], k2 = ks[1];
      
      return -(k1-k2);
    case 4:
      var k1 = ks[0], dv1_k1 = ks[1], dv1_k2 = ks[2], k2 = ks[3];
      
      return (6*(k1-k2)*(s-1)+(3*s-2)*dv1_k2)*s+(3*s-1)*(s-1)*dv1_k1;
    case 6:
      var k1 = ks[0], 
               dv1_k1 = ks[1], dv2_k1 = ks[2], 
               dv2_k2 = ks[3], dv1_k2 = ks[4],
          k2 = ks[5];
          
      return (-(((2*(30*(k1-k2)*(s-1)*(s-1)+(5*s-6)*(3*s-2)*dv1_k2)-(5*s-3)*
               (s-1)*dv2_k2)*s+(5*s-2)*(s-1)*(s-1)*dv2_k1)*s+2*(5*s+1)*(3*s-1)*
               (s-1)*(s-1)*dv1_k1))/2.0;
  }
}

/*
var polycurvature_dv2_spower = function polycurvature_dv2_spower(s, ks, order) {
  var s2 = s*s, s3=s2*s, s4=s3*s, s5=s4*s, s6=s5*s, s7=s6*s, s8=s7*s, s9=s8*s;
  
  switch (order) {
    case 2:
      var k1 = ks[0], k2 = ks[1];
      
      return 0;
    case 4:
      var k1 = ks[0], dv1_k1 = ks[1], dv1_k2 = ks[2], k2 = ks[3];
      
      return 0;
    case 6:
      var k1 = ks[0], 
               dv1_k1 = ks[1], dv2_k1 = ks[2], 
               dv2_k2 = ks[3], dv1_k2 = ks[4],
          k2 = ks[5];
          
      return 0;
  }
}*/
  
export var spower_funcs = [
  polytheta_spower,
  polycurvature_spower,
  polycurvature_dv_spower
];

var approx_ret_cache = cachering.fromConstructor(Vector3, 42);
var abs = Math.abs;
var mmax = Math.max, mmin = Math.min;
//var ONE_INT_STEPS = 1.0/INT_STEPS;

#define FAST_INT_STEPS 3
#define ONE_INT_STEPS 0.333333333

import 'vectormath';

var acache = [new Vector3(), new Vector3(), new Vector3(), 
              new Vector3(), new Vector3(), new Vector3(), 
              new Vector3()]
var acur = 0;

var eval_curve_vs = cachering.fromConstructor(Vector3, 64);

var _eval_start = new Vector3();

export function approx(s1, ks, order, dis, steps) {
  s1 *= 1.0-0.0000001;
  
  if (steps == undefined)
    steps = INT_STEPS;
  
  var s=0, ds=s1/steps;
  
  var ds2=ds*ds, ds3=ds2*ds, ds4=ds3*ds;
  
  var ret = approx_ret_cache.next();
  ret[0] = ret[1] = ret[2] = 0.0;
  var x = 0, y = 0;

  var k1 = ks[0], dv1_k1 = ks[1], dv1_k2 = ks[2], k2 = ks[3];
  
  for (var i=0; i<steps; i++) {
    var st = s+0.5;
    var s2=st*st, s3=st*st*st, s4=s2*s2, s5=s4*st, s6=s5*st, s7=s6*st, s8=s7*st, s9=s8*st, s10=s9*st;
    
    var th = POLYTHETA_SBEZ(st);
    var dx = sin(th), dy = cos(th);
    
    var kt = POLYCURVATURE_SBEZ(st);
    var dkt = POLYCURVATURE_SBEZ_DV(st);
    var dk2t = POLYCURVATURE_SBEZ_DV((st+0.0001)); 
    
    dk2t = (dk2t-dkt)/(0.0001);
    
    var kt2=kt*kt, kt3 = kt*kt*kt;
    
    x += ((5*(4*((dy*dkt-kt2*dx)*ds2+3*(
          dy*kt*ds+2*dx))+((dk2t-kt3)*dy-3*
          dkt*kt*dx)*ds3)-(((4*dk2t-kt3)*kt+3*dkt*dkt)
          *dx+6*dy*dkt*kt2)*ds4)*ds)/120;
                        
    y += (-(5*(4*((dy*kt2+dkt*dx)*ds2-3*(2*
          dy-kt*dx*ds))+((dk2t-kt3)*dx+3
          *dy*dkt*kt)*ds3)+(((4*dk2t-kt3)*kt+3*dkt*dkt)
          *dy-6*dkt*kt2*dx)*ds4)*ds)/120;
    
    s += ds;
  }
  
  ret[0] = x;
  ret[1] = y;
  
  return ret;
}

export var spiraltheta = polytheta_spower;
export var spiralcurvature = polycurvature_spower;
export var spiralcurvature_dv = polycurvature_dv_spower;
export var ORDER = 4;

export function build_solver(spline, order, goal_order, gk, do_basic, update_verts) {
  static con_cache = {
    list : [],
    used : 0
  };
  
  var slv = new solver();
  con_cache.used = 0;
  
  if (order == undefined)
    order = ORDER;
  if (gk == undefined)
    gk = 1.0;
  
  var UPDATE = SplineFlags.UPDATE;
  
  for (var i=0; INCREMENTAL && i<spline.segments.length; i++) {
    var seg = spline.segments[i];
    var edge_seg = (seg.v1.flag & UPDATE) != (seg.v2.flag & UPDATE);
    
    //ensure at least one fully-updated segment surrounds seg.v1 or seg.v2.
    var ok = false;
    
    for (var j=0; j<2; j++) {
      var v = j ? seg.v2 : seg.v1;
      for (var k=0; !ok && k<v.segments.length; k++) {
        var seg2 = v.segments[k];
        
        ok = ok || ((seg2.v1.flag & UPDATE) && (seg2.v2.flag & UPDATE));
      }
    }
    
    edge_seg = edge_seg && ok;
    
    if (edge_seg) {
      for (var j=0; j<KTOTKS; j++) {
        seg._last_ks[j] = seg.ks[j];
      }
      seg.flag |= SplineFlags.TEMP_TAG;
      slv.edge_segs.push(seg);
      
      var s2=undefined, s3=undefined;
      if (seg.v1.segments.length == 2) s2 = seg.v1.other_segment(seg);
      if (seg.v2.segments.length == 2) s3 = seg.v2.other_segment(seg);
    } else {
      seg.flag &= ~SplineFlags.TEMP_TAG;
    }
  }
  
  function hard_tan_c(params) {
    var seg = params[0], tan = params[1], s = params[2];
    
    var dv = seg.derivative(s, order, undefined, true);
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
     
    var t1 = seg1.derivative(s1, order, undefined, true);
    var t2 = seg2.derivative(s2, order, undefined, true);
    
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
    
    if (isNaN(k1) || isNaN(k2)) {
      console.log("NaN 2!");
      return 0;
    }
    
    console.log(k1, k2);
   
    if (abs(seg1.ks[k1i]) < k1) seg1.ks[k1i] = k1*s1;
    if (abs(seg2.ks[k2i]) < k2) seg2.ks[k2i] = k2*s2;
    
    return 0;
  }

  function copy_c(params) {
    var v = params[1], seg = params[0];
    
    var s1 = v === seg.v1 ? 0 : order-1;
    var s2 = v === seg.v1 ? order-1 : 0;
    
    seg.ks[s1] += (seg.ks[s2]-seg.ks[s1])*gk*0.5;
    
    return 0.0;
  }
 
  function get_ratio(seg1, seg2) {
    var ratio = seg1.ks[KSCALE]/seg2.ks[KSCALE];
    
    if (seg2.ks[KSCALE] == 0.0) {
      return 100000.0;
    }
    
    if (ratio > 1.0)
      ratio = 1.0 / ratio;
      
    if (isNaN(ratio)) {
      console.log("NaN 3!");
      ratio = 0.5;
    }
    
    return Math.pow(ratio, 2.0);
  }

  function curv_c_spower(params) {
    //HARD CLAMP
    var seg1 = params[0], seg2 = params[1];
    var v, s1, s2;
    
    // /*
    seg1.evaluate(0.5);
    seg2.evaluate(0.5);
    //*/
    
    if (seg1.v1 == seg2.v1 || seg1.v1 == seg2.v2)
      v = seg1.v1;
    else if (seg1.v2 == seg2.v1 || seg1.v2 == seg2.v2)
      v = seg1.v2;
    else
      console.trace("EVIL INCARNATE!");
    
    var ratio = get_ratio(seg1, seg2);
    var mfac = ratio*gk*0.7;

    var s1 = v === seg1.v1 ? 0 : order-1;
    var s2 = v === seg2.v1 ? 0 : order-1;
    
    var sz1 = seg1.ks[KSCALE];
    var sz2 = seg2.ks[KSCALE];
    var k2sign = s1 == s2 ? -1.0 : 1.0
    
    //deg2 dk: -(k1-k2);
    
    //constrain all derivatives
    var ret = 0.0;
    for (var i=0; i<1; i++) {
      var s1 = v === seg1.v1 ? i : order-1-i;
      var s2 = v === seg2.v1 ? i : order-1-i;
      
      var k1 = seg1.ks[s1]/sz1;
      var k2 = k2sign*seg2.ks[s2]/sz2;
      
      var goalk = (k1+k2)*0.5;
      ret += abs(k1-goalk) + abs(k2-goalk);
      
      seg1.ks[s1] += (goalk*sz1 - seg1.ks[s1])*mfac;
      seg2.ks[s2] += (k2sign*goalk*sz2 - seg2.ks[s2])*mfac;
    }
    
    return ret*5.0;
  }
  
  function curv_c_spower_basic(params) {
    //HARD CLAMP
    var seg1 = params[0], seg2 = params[1];
    var v, s1=0, s2=0;
    
    // /*
    seg1.evaluate(0.5);
    seg2.evaluate(0.5);
    //*/
    
    if (seg1.v1 == seg2.v1 || seg1.v1 == seg2.v2)
      v = seg1.v1;
    else if (seg1.v2 == seg2.v1 || seg1.v2 == seg2.v2)
      v = seg1.v2;
    else
      console.trace("EVIL INCARNATE!");
    
    var ratio = get_ratio(seg1, seg2);
    var mfac = ratio*gk*0.7;

    var s1 = v === seg1.v1 ? 0 : order-1;
    var s2 = v === seg2.v1 ? 0 : order-1;
    
    var sz1 = seg1.ks[KSCALE]
    var sz2 = seg2.ks[KSCALE]
    var k2sign = s1 == s2 ? -1.0 : 1.0
    
    //deg2 dk: -(k1-k2);
    
    var ret = 0.0;
    
    //constrain all derivatives
    var len = Math.floor(order/2);
    for (var i=0; i<1; i++) {
      var s1 = v === seg1.v1 ? i : order-1-i;
      var s2 = v === seg2.v1 ? i : order-1-i;
      
      var k1 = seg1.ks[s1]/sz1;
      var k2 = k2sign*seg2.ks[s2]/sz2;
      
      var goalk = (k1+k2)*0.5;
      ret += abs(k1-goalk) + abs(k2-goalk);
      
      if (i == 0) {
        seg1.ks[s1] += (goalk*sz1 - seg1.ks[s1])*mfac;
        seg2.ks[s2] += (k2sign*goalk*sz2 - seg2.ks[s2])*mfac;
      } else if (i == 1) {
        seg1.ks[s1] = seg1.ks[order-1] - seg1.ks[0];
        seg2.ks[s2] = seg2.ks[order-1] - seg2.ks[0];
      } else {
        seg1.ks[s1] = seg2.ks[s2] = 0.0;
      }
    }
    
    return ret;
  }
   
  var curv_c = do_basic ? curv_c_spower_basic : curv_c_spower;

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
    
    if (isNaN(tan1.dot(tan1)) || tan1.dot(tan1) == 0.0) {
      console.log("NaN 4!");
      continue;
    }
    
    var s = h == seg.h1 ? 0 : 1;
    var do_curv = (v.flag & SplineFlags.BREAK_CURVATURES);
    
    if (h.owning_vertex == undefined) continue;
    
    var do_tan = !((h.flag) & SplineFlags.BREAK_TANGENTS);
    do_tan = do_tan && !(h.flag & SplineFlags.AUTO_PAIRED_HANDLE);
    
    if (do_tan) {
      var tc = new constraint("hard_tan_c", 0.25, [seg.ks], order, hard_tan_c, [seg, tan1, s]);
      tc.k2 = 1.0;
      
      if (update_verts)
        update_verts.add(h);
      slv.add(tc);
    }
    
    if (h.hpair == undefined) continue;

    var ss1 = seg, h2 = h.hpair, ss2=h2.owning_segment;

    if ((h.flag & SplineFlags.AUTO_PAIRED_HANDLE) && 
      !((seg.handle_vertex(h).flag & SplineFlags.BREAK_TANGENTS))) 
    {
      var tc = new constraint("tan_c", 0.3, [ss1.ks, ss2.ks], order, tan_c, [ss1, ss2]);
      tc.k2 = 0.8
      
      if (update_verts)
        update_verts.add(h);
      slv.add(tc);
    }
    
    /*
    var cw1 = 0.5, cw2=cw1;
    
    var cc = new constraint("handle_curv_c", cw1, [ss1.ks], order, handle_curv_c, [ss1, ss2, h, h2]);
    slv.add(cc);
    var cc = new constraint("handle_curv_c", cw2, [ss2.ks], order, handle_curv_c, [ss1, ss2, h, h2]);
    slv.add(cc);
    */
    
    var cc = new constraint("curv_c", 1, [ss1.ks], order, curv_c, [ss1, ss2, h, h2]);
    slv.add(cc);
    var cc = new constraint("curv_c", 1, [ss2.ks], order, curv_c, [ss1, ss2, h, h2]);
    slv.add(cc);
    
    if (update_verts)
      update_verts.add(h);
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
    
    var tc = new constraint("hard_tan_c", manual_w, [ss1.ks], order, hard_tan_c, [ss1, tan, s]);
    tc.k2 = manual_w_2;
    
    slv.add(tc);
    if (update_verts)
      update_verts.add(v);
  }
  
  for (var i=0; i<spline.verts.length; i++) {
    var v = spline.verts[i];
    
    if (INCREMENTAL && !(v.flag & SplineFlags.UPDATE)) continue;
    if (v.segments.length == 1 && !(v.flag & SplineFlags.BREAK_CURVATURES)) {
      var seg = v.segments[0];
      
      //evil!
      //var cc = new constraint("copy_c", 1.0, [seg.ks], order, copy_c, [seg, v]);
      //cc.k2 = 0.8
      //slv.add(cc);
    }
    
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
    
    if (bad && DEBUG.degenerate_geometry) {
      console.log("Ignoring!");
    }
    
    if (bad) continue;
    
    if (!(v.flag & (SplineFlags.BREAK_TANGENTS|SplineFlags.USE_HANDLES))) {
      var tc = new constraint("tan_c", 0.5, [ss2.ks], order, tan_c, [ss1, ss2]);
      tc.k2 = 0.8
      slv.add(tc);
      
      var tc = new constraint("tan_c", 0.5, [ss1.ks], order, tan_c, [ss2, ss1]);
      tc.k2 = 0.8
      slv.add(tc);
      
      if (update_verts)
        update_verts.add(v);
    } else if (!(v.flag & SplineFlags.BREAK_TANGENTS)) { //manual handles
      var h = ss1.handle(v);
      var tan = new Vector3(h).sub(v).normalize();
      
      var s = v === ss1.v1 ? 0.0 : 1.0;
      if (v === ss1.v2) {
        tan.negate();
      }
      
      var tc = new constraint("hard_tan_c", manual_w, [ss1.ks], order, hard_tan_c, [ss1, tan, s]);
      tc.k2 = manual_w_2;
      
      slv.add(tc);
      
      var h = ss2.handle(v);
      var tan = new Vector3(h).sub(v).normalize();
      
      var s = v === ss2.v1 ? 0.0 : 1.0;
      if (v === ss2.v2) {
        tan.negate();
      }
      
      var tc = new constraint("hard_tan_c", manual_w, [ss2.ks], order, hard_tan_c, [ss2, tan, s]);
      tc.k2 = manual_w_2;
      
      slv.add(tc);
      
      if (update_verts)
        update_verts.add(v);
    } else {
      continue;
    }
    
    if (v.flag & SplineFlags.BREAK_CURVATURES)
      continue;
    if (v.flag & SplineFlags.USE_HANDLES)
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
    
    var cc = new constraint("curv_c", 1, [ss1.ks], order, curv_c, [ss1, ss2]);
    slv.add(cc);
      
    var cc = new constraint("curv_c", 1, [ss2.ks], order, curv_c, [ss2, ss1]);
    slv.add(cc);
    
    if (update_verts)
      update_verts.add(v);
  }
  
  return slv;
}

function solve_intern(spline, order=ORDER, goal_order=ORDER, steps=65, gk=1.0, do_basic=false) {
  var start_time = time_ms();
  window._SOLVING = true;
  
  var slv = build_solver(spline, order, goal_order, gk, do_basic);
  var totsteps = slv.solve(steps, gk, order==ORDER, slv.edge_segs);
  
  window._SOLVING = false;
  
  for (var i=0; i<spline.segments.length; i++) {
    var seg = spline.segments[i];
    seg.evaluate(0.5, undefined, undefined, undefined, true);
  }
  
  var end_time = time_ms() - start_time;
  if (end_time > 50)
    console.log("solve time", end_time.toFixed(2), "ms", "steps", totsteps);
}

export function do_solve(splineflags, spline, steps, gk) {
  //if (spline === new Context().frameset.pathspline)
  //  return;
  spline.propagate_update_flags();
  
  for (var i=0; i<spline.segments.length; i++) {
    var seg = spline.segments[i];
    
    if (INCREMENTAL && (!(seg.v1.flag & SplineFlags.UPDATE) || !(seg.v2.flag & SplineFlags.UPDATE)))
      continue;
    
    for (var j=0; j<seg.ks.length; j++) {
      seg.ks[j] = 0.000001; //(j-ORDER/2)*4;
    }
    
    seg.evaluate(0.5, undefined, undefined, undefined, true);
  }
  
  spline.resolve = 0;
  //solve_intern(spline, ORDER, undefined, 10, 1, 1);
  solve_intern(spline, ORDER, undefined, 65, 1, 0);
  
  for (var i=0; i<spline.segments.length; i++) {
    var seg = spline.segments[i];
    seg.evaluate(0.5, undefined, undefined, undefined, true);
    
    for (var j=0; j<seg.ks.length; j++) {
      if (isNaN(seg.ks[j])) {
        console.log("NaN 1!");
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
  
  for (var f of spline.faces) {
    for (var path of f.paths) {
      for (var l of path) {
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

