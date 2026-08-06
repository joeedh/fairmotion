"use strict";

import * as math from "./mathlib.js";
import { SplineFlags, MaterialFlags, SplineTypes } from "../curve/spline_base.js";
import { SplineDrawer } from "../curve/spline_draw_new.js";
import { draw_spline } from "../curve/spline_draw.js";
import { SVGDraw2D } from "../vectordraw/vectordraw_svg.js";
import { IndexRange } from "../path.ux/scripts/path-controller/util/indexRange.js";
import type { Spline } from "../curve/spline.js";

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
/* Dead; kept for the derivation above. */
function cubic(a: Vector3, b: Vector3, c: Vector3, d: Vector3, s: number) {
  var ret = cubic_rets.next();

  /* IndexRange() yields 0|1|2, which is what indexing a Vector3 wants. */
  for (const i of IndexRange(3)) {
    ret[i] =
      a[i] * s * s * s -
      3 * a[i] * s * s +
      3 * a[i] * s -
      a[i] -
      3 * b[i] * s * s * s +
      6 * b[i] * s * s -
      3 * b[i] * s;
    ret[i] += 3 * c[i] * s * s * s - 3 * c[i] * s * s - d[i] * s * s * s;

    ret[i] = -ret[i];
  }

  return ret;
}

export function export_svg(spline: Spline, visible_only = false) {
  //XXX temporary auto-setter, for testing purposes
  if (spline === undefined) {
    spline = g_app_state.ctx.spline;
  }

  let vecdrawer = new SVGDraw2D();
  let drawer = new SplineDrawer(spline, vecdrawer);

  spline.regen_render();
  spline.regen_sort();

  let view2d = g_app_state.ctx.view2d;
  let matrix = new Matrix4(view2d.rendermat);

  let width = 1024;
  let height = 768;

  matrix.scale(1, -1, 1);
  matrix.translate(0, -height, 0);

  /* Dummy canvas, built the way Editor.getCanvas() does it: spline_draw reads
     g.canvas.dpi_scale, and SplineDrawer.update() reads g.height. */
  let canvas = Object.assign(document.createElement("canvas"), { dpi_scale: 1.0 });

  canvas.width = width;
  canvas.height = height;
  canvas.style["width"] = canvas.width + "px";
  canvas.style["height"] = canvas.height + "px";

  let g = Object.assign(canvas.getContext("2d")!, {
    dpi_scale   : 1.0,
    width       : canvas.width,
    height      : canvas.height,
    _irender_mat: new Matrix4(),
  });

  drawer.update(
    spline,
    spline.drawlist,
    spline.draw_layerlist,
    matrix,
    [],
    true,
    1,
    g,
    1.0,
    view2d,
    true
  );
  drawer.draw(g);

  /* draw() builds the svg element; it is undefined before that and again
     after destroy(). */
  let svg = vecdrawer.svg;
  let ret = svg === undefined ? "" : svg.outerHTML;

  vecdrawer.destroy();

  return ret;
}
