"use strict";

import * as config from '../config/config.js';

//math globals
let FEPS = 1e-18;
let PI = Math.PI;
let sin = Math.sin, acos=Math.acos, asin=Math.asin, atan2=Math.atan2, sqrt=Math.sqrt;
let cos = Math.cos, pow=Math.pow, abs=Math.abs;
let SPI2 = Math.sqrt(PI/2);

import * as math from './spline_math_hermite.js';

export let spiraltheta = math.spiraltheta;
export let spiralcurvature = math.spiralcurvature;
export let spiralcurvature_dv = math.spiralcurvature_dv;
export let approx = math.approx;
export let INT_STEPS = math.INT_STEPS;
export let ORDER = math.ORDER;

import {DISABLE_SOLVE} from '../config/config.js';

import * as native_api from '../wasm/native_api.js';

export function do_solve() {
  if (DISABLE_SOLVE || window.DISABLE_SOLVE)
    return;

  if (!DEBUG.no_native && config.USE_WASM && native_api.isReady()) {
    return native_api.do_solve.apply(this, arguments);
  } else {
    return math.do_solve.apply(this, arguments);
  }
}

export const KSCALE  = ORDER+1;
export const KANGLE  = ORDER+2;
export const KSTARTX = ORDER+3;
export const KSTARTY = ORDER+4;
export const KSTARTZ = ORDER+5; //unused
//used by wasm solver
export const KV1X = ORDER+6;
export const KV1Y = ORDER+7;
export const KV2X = ORDER+8;
export const KV2Y = ORDER+9;

export const KTOTKS  = ORDER+10;

const eval_curve_vs = cachering.fromConstructor(Vector3, 64);

//XXX
//export let eval_curve = math.eval_curve_fast;

const eval_ret_vs = cachering.fromConstructor(Vector2, 256);

export function eval_curve(seg, s, v1, v2, ks, order, angle_only, no_update) {
  if (native_api.isReady() && !(window.DEBUG.no_native || window.DEBUG.no_nativeEval)) {
    return native_api.evalCurve(seg, s, v1, v2, ks, angle_only, no_update);
  }

  if (order === undefined) order = ORDER;
  
  s *= 0.99999999;
  
  let eps = 0.000000001;
  
  let ang, scale, start, end;
  if (!no_update) {
    start = approx(-0.5+eps, ks, order);
    end = approx(0.5-eps, ks, order);
    
    end.sub(start);
    let a1 = atan2(end[0], end[1]);
    
    let vec = eval_curve_vs.next();
    vec.load(v2).sub(v1);
    
    let a2 = atan2(vec[0], vec[1]);
    
    ang = a2-a1;
    scale = vec.vectorLength() / end.vectorLength();
    
    ks[KSCALE] = scale;
    ks[KANGLE] = ang;
    ks[KSTARTX] = start[0];
    ks[KSTARTY] = start[1];
  } else {
    ang = ks[KANGLE];
    scale = ks[KSCALE];
    
    start[0] = ks[KSTARTX];
    start[1] = ks[KSTARTY];
  }
  
  if (!angle_only) {
    let co = approx(s, ks, order);
    co.sub(start).rot2d(-ang).mulScalar(scale).add(v1);
    
    return eval_ret_vs.next().load(co);
  }
};
