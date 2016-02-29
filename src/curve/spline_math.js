"use strict";

#include "src/config/config_defines.js"

import * as config from 'config';

//math globals
var FEPS = 1e-18;
var PI = Math.PI;
var sin = Math.sin, acos=Math.acos, asin=Math.asin, atan2=Math.atan2, sqrt=Math.sqrt;
var cos = Math.cos, pow=Math.pow, abs=Math.abs;
var SPI2 = Math.sqrt(PI/2);

import * as math from 'spline_math_hermite';

export var spiraltheta = math.spiraltheta;
export var spiralcurvature = math.spiralcurvature;
export var spiralcurvature_dv = math.spiralcurvature_dv;
export var approx = math.approx;
export var INT_STEPS = math.INT_STEPS;
export var ORDER = math.ORDER;

//import {do_solve} from 'nacl_api';

import {DISABLE_SOLVE} from 'config';

function do_solve_nacl(sflags, spline, steps, gk, return_promise) {
  if (DISABLE_SOLVE)
    return;
    
  if (window.common != undefined && window.common.naclModule != undefined) {
    var draw_id = window.push_solve(spline);
    return window.nacl_do_solve(sflags, spline, steps, gk, return_promise, draw_id);
  } else {
    return math.do_solve.apply(this, arguments);
  }
}

export function do_solve() {
  if (config.USE_NACL) {
    return do_solve_nacl.apply(this, arguments);
  } else {
    return math.do_solve.apply(this, arguments);
  }
}

export var KSCALE  = ORDER+1;
export var KANGLE  = ORDER+2;
export var KSTARTX = ORDER+3;
export var KSTARTY = ORDER+4;
export var KSTARTZ = ORDER+5;

export var KTOTKS  = ORDER+6;

var eval_curve_vs = cachering.fromConstructor(Vector3, 64);

//XXX
//export var eval_curve = math.eval_curve_fast;

var _eval_start = eval_curve_vs.next();
export function eval_curve(s, v1, v2, ks, order, angle_only, no_update) {
  var start = _eval_start;
  if (order == undefined) order = ORDER;
  
  s *= 0.99999999;
  
  var eps = 0.000000001;
  
  var ang, scale, start;
  if (!no_update) {
    var start = approx(-0.5+eps, ks, order);
    var end = approx(0.5-eps, ks, order);
    
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
    var co = approx(s, ks, order);
    co.sub(start).rot2d(-ang).mulScalar(scale).add(v1);
    
    return co;
  }
};
