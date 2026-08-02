"use strict";

import * as math from './mathlib.js';
import {SplineFlags, MaterialFlags, SplineTypes} from '../curve/spline_base.js';
import {SplineDrawer} from "../curve/spline_draw_new.js";
import {draw_spline} from "../curve/spline_draw.js";
import {SVGDraw2D} from "../vectordraw/vectordraw_svg.js";

var cubic_rets = cachering.fromConstructor(Vector3, 64);
/*
on factor;
off period;

procedure bez(a, b);
  a + (b - a)*s;
  
quad  := bez(bez(a, b), bez(b, c));
cubic := bez(quad, sub(c=d, b=c, a=b, quad));

on fort;
cubic;
off fort;
*/
function cubic(a, b, c, d, s) {
  var ret = cubic_rets.next();
  
  for (var i=0; i<3; i++) {
    ret[i] = a[i]*s*s*s-3*a[i]*s*s+3*a[i]*s-a[i]-3*b[i]*s*s*s+6*b[i]*s*s-3*b[i]*s
    ret[i] += 3*c[i]*s*s*s-3*c[i]*s*s-d[i]*s*s*s;
    
    ret[i] = -ret[i];
  }
  
  return ret;
}

export function export_svg(spline : Spline, visible_only=false) {
  //XXX temporary auto-setter, for testing purposes
  if (spline === undefined) {
    spline = g_app_state.ctx.spline;
  }

  let drawer = new SplineDrawer(spline, new SVGDraw2D());

  spline.regen_render();
  spline.regen_sort();

  let view2d = g_app_state.ctx.view2d;
  let matrix = new Matrix4(view2d.rendermat);

  let width = 1024;
  let height = 768;

  matrix.scale(1, -1, 1);
  matrix.translate(0, -height);

  //create dummy canvas
  let canvas = document.createElement("canvas");
  let g = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;
  canvas.style["width"] = canvas.width + "px";
  canvas.style["height"] = canvas.height + "px";

  drawer.update(spline, spline.drawlist, spline.draw_layerlist, matrix,
    [], true, 1, g, 1.0, view2d, true);
  drawer.draw(g);

  let ret = drawer.drawer.svg.outerHTML;

  drawer.drawer.destroy();

  return ret;
}
