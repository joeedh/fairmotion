/*
 * The editing overlay: segment outlines, handles, vertices and the curve-normal
 * debug draw, painted straight onto the viewport's 2D context.
 *
 * This has no relationship to the retained render pipeline below it
 * (spline_draw_sort -> SplineDrawer -> VectorDraw -> worker).  It used to share
 * a function with that pipeline's entry point -- `draw_spline()` -- only because
 * that is where the canvas context happened to be in scope.  The two are now
 * called separately: Spline.draw() renders, and whoever wants handles on top
 * calls draw_spline_overlay() afterwards.  Callers gate on `only_render`; there
 * is no such parameter here.
 *
 * The colour tables are shared with nothing else, but get_element_color() and
 * redraw_element() are used by the select/edit ops, which is why they live in a
 * module rather than inside the draw function.
 */

import { SelMask } from "../editors/viewport/selectmode.js";
import { KSCALE } from "./spline_math.js";
import { get_vtime } from "../core/animdata.js";
import { Vector2 } from "../util/vectormath.js";

import { SplineFlags, SplineTypes, SplineElement } from "./spline_types.js";
import { ElementArray } from "./spline_element_array.js";

import type { Spline } from "./spline.js";
import type { View2DHandler } from "../editors/viewport/view2d.js";

const PI = Math.PI;

export const DRAW_MAXCURVELEN = 10000;

//obsolete:
//var uclr_h = "#22ff11"
//var sclr_h = "#aaffaa"
//var hclr_h = "#eeff66"

/*logical element "states" that
  are or'd together, color is looked up
  in a table*/
export const ColorFlags = {
  SELECT   : 1,
  ACTIVE   : 2,
  HIGHLIGHT: 4,
};

/* The eight SELECT/ACTIVE/HIGHLIGHT combinations.  FlagMap and the two color
   tables below are all keyed by exactly these, which is what lets the loops
   that build the colormaps walk one and index another. */
export const ColorStates = [
  "UNSELECT",
  "SELECT",
  "ACTIVE",
  "HIGHLIGHT",
  "SELECT_ACTIVE",
  "SELECT_HIGHLIGHT",
  "HIGHLIGHT_ACTIVE",
  "SELECT_HIGHLIGHT_ACTIVE",
] as const;

export type ColorStateName = (typeof ColorStates)[number];

export const FlagMap: Record<ColorStateName, number> = {
  UNSELECT               : 0,
  SELECT                 : ColorFlags.SELECT,
  ACTIVE                 : ColorFlags.ACTIVE,
  HIGHLIGHT              : ColorFlags.HIGHLIGHT,
  SELECT_ACTIVE          : ColorFlags.SELECT | ColorFlags.ACTIVE,
  SELECT_HIGHLIGHT       : ColorFlags.SELECT | ColorFlags.HIGHLIGHT,
  HIGHLIGHT_ACTIVE       : ColorFlags.HIGHLIGHT | ColorFlags.ACTIVE,
  SELECT_HIGHLIGHT_ACTIVE: ColorFlags.SELECT | ColorFlags.ACTIVE | ColorFlags.HIGHLIGHT,
};

/* Componentwise lerp of two rgb triples. */
function mix(a: number[], b: number[], t: number) {
  let ret = [0, 0, 0];

  for (let i = 0; i < 3; i++) {
    ret[i] = a[i] + (b[i] - a[i]) * t;
  }

  return ret;
}

//unnest table
export const ElementColor: Record<ColorStateName, number[]> = {
  UNSELECT               : [1, 0.133, 0.07],
  SELECT                 : [1, 0.6, 0.26],
  HIGHLIGHT              : [1, 0.93, 0.4],
  ACTIVE                 : [0.3, 0.4, 1.0],
  SELECT_ACTIVE          : mix([1, 0.6, 0.26], [0.1, 0.2, 1.0], 0.7),
  SELECT_HIGHLIGHT       : [1, 1, 0.8],
  HIGHLIGHT_ACTIVE       : mix([1, 0.93, 0.4], [0.3, 0.4, 1.0], 0.5),
  SELECT_HIGHLIGHT_ACTIVE: [0.85, 0.85, 1.0],
};

export const HandleColor: Record<ColorStateName, number[]> = {
  UNSELECT               : [0.2, 0.7, 0.07],
  SELECT                 : [0.1, 1, 0.26],
  HIGHLIGHT              : [0.2, 0.93, 0.4],
  ACTIVE                 : [0.1, 1, 0.75],
  SELECT_ACTIVE          : mix([1, 0.6, 0.26], [0.1, 0.2, 1.0], 0.7),
  SELECT_HIGHLIGHT       : [1, 1, 0.8],
  HIGHLIGHT_ACTIVE       : mix([1, 0.93, 0.4], [0.3, 0.4, 1.0], 0.5),
  SELECT_HIGHLIGHT_ACTIVE: [0.85, 0.85, 1.0],
};
HandleColor.SELECT_ACTIVE = mix(HandleColor.SELECT, HandleColor.ACTIVE, 0.5);
HandleColor.SELECT_HIGHLIGHT = mix(HandleColor.SELECT, HandleColor.HIGHLIGHT, 0.5);
HandleColor.HIGHLIGHT_ACTIVE = mix(HandleColor.HIGHLIGHT, HandleColor.ACTIVE, 0.5);
HandleColor.SELECT_HIGHLIGHT_ACTIVE = mix(
  mix(HandleColor.SELECT, HandleColor.ACTIVE, 0.5),
  HandleColor.HIGHLIGHT,
  0.5
);

function rgb2css(color: number[]) {
  let r = color[0],
    g = color[1],
    b = color[2];
  return "rgb(" + ~~(r * 255) + "," + ~~(g * 255) + "," + ~~(b * 255) + ")";
}

//create final lookup table
export const element_colormap = new Array<string>(8);

for (let k of ColorStates) {
  let f = FlagMap[k];
  element_colormap[f] = rgb2css(ElementColor[k]);
}

//create final lookup table
export const handle_colormap = new Array<string>(8);
for (let k of ColorStates) {
  let f = FlagMap[k];
  handle_colormap[f] = rgb2css(HandleColor[k]);
}

/* Which of the SELECT/ACTIVE/HIGHLIGHT bits `e` has, as an index into the two
   colormaps above. */
function get_element_flag<T extends SplineElement>(e: T, list: ElementArray<T>) {
  let f = 0;

  f |= e.flag & SplineFlags.SELECT ? ColorFlags.SELECT : 0;
  f |= e === list.highlight ? ColorFlags.HIGHLIGHT : 0;
  f |= e === list.active ? ColorFlags.ACTIVE : 0;

  return f;
}

export function get_element_color<T extends SplineElement>(e: T, list: ElementArray<T>) {
  if (e.type == SplineTypes.HANDLE) return handle_colormap[get_element_flag(e, list)];
  else return element_colormap[get_element_flag(e, list)];
}

const VERT_SIZE = 3.0;
const SMALL_VERT_SIZE = 1.0;

/* NOTE: `g.strokeColor` below is not a canvas property -- the assignment is a
   no-op and the normals draw in whatever stroke style was already set.  The
   canvas spelling is strokeStyle. */
export function draw_curve_normals(spline: Spline, g: Canvas2D, zoom: number) {
  for (let seg of spline.segments) {
    if (seg.v1.hidden || seg.v2.hidden) continue;
    //if (seg.hidden) continue;

    let length = seg.ks[KSCALE];

    if (length <= 0 || isNaN(length)) continue;

    //prevent infinite loops caused by degenerate infinite-length curves
    if (length > DRAW_MAXCURVELEN) length = DRAW_MAXCURVELEN;

    let ls = 0.0,
      dls = 5 / zoom;

    for (ls = 0; ls < length; ls += dls) {
      let s = ls / length;
      if (s > 1.0) continue;

      let co = seg.evaluate(s);
      let n = seg.normal(s).normalize();
      let k = seg.curvature(s);

      n.mulScalar((k * (window._d != undefined ? window._d : 1000)) / zoom);

      g.lineWidth = 1; //*zoom;

      /* NOTE: there is no `strokeColor` on a 2d context -- it is strokeStyle --
         and "%2233bb" is not a color either, so this debug overlay has always
         drawn in whatever stroke style was already set.  Left as it stands. */
      Reflect.set(g, "strokeColor", "%2233bb");

      g.beginPath();
      g.moveTo(co[0], co[1]);
      g.lineTo(co[0] + n[0], co[1] + n[1]);
      g.stroke();
    }
  }
}

/*
 * Draws the editing overlay for `spline` onto `g`: selected segment outlines,
 * handles and their tangent lines, vertices, the proportional-edit radius, and
 * optionally the curve normals.
 *
 * Callers are responsible for the `only_render` gate -- when the viewport is in
 * render mode this function is simply not called.
 *
 * The `zoom` used below is hardcoded to 1.0.  That is not a placeholder: it is
 * what the code has always done.  The value used to be read as `matrix.m11`,
 * but a Matrix4's components live on `matrix.$matrix`, so it came out undefined
 * and an `isNaN()` reset behind it substituted 1.0 on every call.  Every vertex
 * size and handle-box size in this function is therefore in raw pixels rather
 * than screen pixels.  Correcting it would resize every overlay element at
 * every zoom level, which is a deliberate change to make on its own, not a
 * side effect of moving this code.
 */
export function draw_spline_overlay(
  spline: Spline,
  g: Canvas2D,
  editor: View2DHandler,
  matrix: Matrix4,
  selectmode: number,
  draw_normals: number | boolean,
  draw_time_helpers?: boolean,
  curtime?: number,
  ignore_layers?: boolean
) {
  const zoom = 1.0;

  let actlayer = spline.layerset.active;

  if (draw_normals) {
    draw_curve_normals(spline, g, zoom);
  }

  let vert_size = editor.draw_small_verts ? SMALL_VERT_SIZE : VERT_SIZE;

  //draw element handles

  let tmp1 = new Vector2();
  let tmp2 = new Vector2();
  let last_clr: string | undefined = undefined;

  g.beginPath();
  if (selectmode & SelMask.SEGMENT) {
    let dv = new Vector2();

    for (let seg of spline.segments) {
      let skip = !ignore_layers && !seg.in_layer(actlayer);
      skip = skip || (seg.flag & SplineFlags.HIDE) !== 0;
      skip =
        skip ||
        (!(seg.flag & SplineFlags.SELECT) &&
          seg !== spline.segments.active &&
          seg !== spline.segments.highlight);

      if (skip) {
        continue;
      }

      let steps = seg.length / 24;
      steps = Math.min(Math.max(steps, 3), 64);
      steps = isNaN(steps) ? 3 : steps;

      let s = 0,
        ds = 1.0 / (steps - 1);

      g.beginPath();

      for (let side = 0; side < 2; side++) {
        /* Written but never read. */
        let lastp: Vector2 | undefined = undefined;

        for (let i = 0; i < steps; i++, s += ds) {
          let p = seg.evaluateSide(s, side, dv);

          tmp1.load(p).multVecMatrix(matrix);

          if (side === 0 && i === 0) {
            g.moveTo(tmp1[0], tmp1[1]);
          } else {
            g.lineTo(tmp1[0], tmp1[1]);
          }
          lastp = p;
        }

        s -= ds;
        ds *= -1;
      }

      let clr = get_element_color(seg, spline.segments);

      g.fillStyle = clr;
      g.fill();
    }
  }

  g.beginPath();
  if (selectmode & SelMask.HANDLE) {
    let w = (vert_size * g.canvas.dpi_scale) / zoom;

    for (let v of spline.handles) {
      let clr = get_element_color(v, spline.handles);

      if (!ignore_layers && !v.owning_segment.in_layer(actlayer)) continue;
      if (v.owning_segment !== undefined && v.owning_segment.flag & SplineFlags.HIDE) continue;
      if (v.owning_vertex !== undefined && v.owning_vertex.flag & SplineFlags.HIDE) continue;
      if (!v.use) continue;

      if (
        v.flag & SplineFlags.AUTO_PAIRED_HANDLE &&
        v.hpair !== undefined &&
        v.segments.length > 2
      ) {
        continue;
      }

      if (v.flag & SplineFlags.HIDE) continue;

      tmp1.load(v).multVecMatrix(matrix);

      g.beginPath();
      if (clr !== last_clr) g.fillStyle = clr;
      last_clr = clr;
      g.rect(tmp1[0] - w, tmp1[1] - w, w * 2, w * 2);
      g.fill();

      g.beginPath();
      g.lineWidth = 1; //*zoom;

      let ov = v.owning_segment.handle_vertex(v);

      /* A handle whose segment does not claim it has nothing to draw a line to;
         this used to throw on the load() below. */
      if (ov === undefined) {
        continue;
      }

      tmp2.load(ov).multVecMatrix(matrix);

      g.moveTo(tmp1[0], tmp1[1]);
      g.lineTo(tmp2[0], tmp2[1]);

      g.stroke();
    }
  }

  if (selectmode & SelMask.VERTEX) {
    let w = (vert_size * g.canvas.dpi_scale) / zoom;

    for (let i = 0; i < spline.verts.length; i++) {
      let v = spline.verts[i];
      let clr = get_element_color(v, spline.verts);

      if (!ignore_layers && !v.in_layer(actlayer)) continue;
      if (v.flag & SplineFlags.HIDE) continue;

      let co = tmp1.load(v);
      co.multVecMatrix(matrix);

      if (draw_time_helpers) {
        let time = get_vtime(v);

        if (curtime === time) {
          g.beginPath();
          g.fillStyle = "#33ffaa";
          g.rect(co[0] - w * 2, co[1] - w * 2, w * 4, w * 4);
          g.fill();
          g.fillStyle = clr;
        }
      }

      g.beginPath();
      if (clr !== last_clr) g.fillStyle = clr;

      last_clr = clr;
      g.rect(co[0] - w, co[1] - w, w * 2, w * 2);
      g.fill();
    }
  }

  //XXX this does not go here!
  if (spline.transforming && spline.proportional && spline.trans_cent !== undefined) {
    g.beginPath();
    g.arc(spline.trans_cent[0], spline.trans_cent[1], spline.prop_radius, -PI, PI);
    g.stroke();
  }
}

let __margin = new Vector2([15, 15]);
let __aabb = [new Vector2(), new Vector2()];

/* Flags `e` for redraw and tells the viewport to repaint its bounding box,
   grown by a fixed screen-space margin. */
export function redraw_element(e: SplineElement, view2d?: View2DHandler) {
  let margin = __margin;
  let aabb = __aabb;

  e.flag |= SplineFlags.REDRAW;

  margin[0] = margin[1] = 15.0;

  if (view2d !== undefined) margin.mulScalar(1.0 / view2d.zoom);

  let e_aabb = e.aabb;

  aabb[0].load(e_aabb[0]);
  aabb[1].load(e_aabb[1]);
  aabb[0].sub(margin);
  aabb[1].add(margin);

  window.redraw_viewport(aabb[0], aabb[1]);
}
