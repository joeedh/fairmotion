import {aabb_isect_minmax2d} from '../util/mathlib.js';
import {ENABLE_MULTIRES} from '../config/config.js';

import {SessionFlags} from '../editors/viewport/view2d_editor.js';
import {SelMask} from '../editors/viewport/selectmode.js';
import {ORDER, KSCALE, KANGLE, KSTARTX, KSTARTY, KSTARTZ, KTOTKS, INT_STEPS} from './spline_math.js';
import {get_vtime} from '../core/animdata.js';

let spline_draw_cache_vs = cachering.fromConstructor(Vector3, 64);
let spline_draw_trans_vs = cachering.fromConstructor(Vector3, 32);

let PI = Math.PI;
let pow = Math.pow, cos = Math.cos, sin = Math.sin, abs = Math.abs, floor = Math.floor,
    ceil = Math.ceil, sqrt = Math.sqrt, log = Math.log, acos = Math.acos, asin = Math.asin;

export const DRAW_MAXCURVELEN = 10000;

import {
  SplineFlags, SplineTypes, SplineElement, SplineVertex, 
  SplineSegment, SplineLoop, SplineLoopPath, SplineFace,
  RecalcFlags, MaterialFlags
} from './spline_types.js';

import {ElementArray, SplineLayerFlags} from './spline_element_array.js';

//obsolete:
//var uclr_h = "#22ff11"
//var sclr_h = "#aaffaa"
//var hclr_h = "#eeff66"

/*logical element "states" that
  are or'd together, color is looked up
  in a table*/
export const ColorFlags = {
  SELECT : 1,
  ACTIVE : 2,
  HIGHLIGHT : 4
};

export const FlagMap = {
  UNSELECT : 0,
  SELECT : ColorFlags.SELECT,
  ACTIVE : ColorFlags.ACTIVE,
  HIGHLIGHT : ColorFlags.HIGHLIGHT,
  SELECT_ACTIVE : ColorFlags.SELECT | ColorFlags.ACTIVE,
  SELECT_HIGHLIGHT : ColorFlags.SELECT | ColorFlags.HIGHLIGHT,
  HIGHLIGHT_ACTIVE : ColorFlags.HIGHLIGHT | ColorFlags.ACTIVE,
  SELECT_HIGHLIGHT_ACTIVE : ColorFlags.SELECT | ColorFlags.ACTIVE | ColorFlags.HIGHLIGHT
};

function mix(a, b, t) {
  let ret = [0, 0, 0];

  for (let i=0; i<3; i++) {
    ret[i] = a[i] + (b[i] - a[i])*t;
  }

  return ret;
}

//unnest table
export const ElementColor = {
  UNSELECT   : [1, 0.133, 0.07],
  SELECT     : [1, 0.6, 0.26],
  HIGHLIGHT  : [1, 0.93, 0.4],
  ACTIVE     : [0.3, 0.4, 1.0],
  SELECT_ACTIVE : mix([1, 0.6, 0.26], [0.1, 0.2, 1.0], 0.7),
  SELECT_HIGHLIGHT : [1, 1, 0.8],
  HIGHLIGHT_ACTIVE : mix([1, 0.93, 0.4], [0.3, 0.4, 1.0], 0.5),
  SELECT_HIGHLIGHT_ACTIVE : [0.85, 0.85, 1.0]
};

export const HandleColor = {
  UNSELECT   : [0.2, 0.7, 0.07],
  SELECT     : [0.1, 1, 0.26],
  HIGHLIGHT  : [0.2, 0.93, 0.4],
  ACTIVE     : [0.1, 1, 0.75],
  SELECT_ACTIVE : mix([1, 0.6, 0.26], [0.1, 0.2, 1.0], 0.7),
  SELECT_HIGHLIGHT : [1, 1, 0.8],
  HIGHLIGHT_ACTIVE : mix([1, 0.93, 0.4], [0.3, 0.4, 1.0], 0.5),
  SELECT_HIGHLIGHT_ACTIVE : [0.85, 0.85, 1.0]
};
HandleColor.SELECT_ACTIVE = mix(HandleColor.SELECT, HandleColor.ACTIVE, 0.5);
HandleColor.SELECT_HIGHLIGHT = mix(HandleColor.SELECT, HandleColor.HIGHLIGHT, 0.5);
HandleColor.HIGHLIGHT_ACTIVE = mix(HandleColor.HIGHLIGHT, HandleColor.ACTIVE, 0.5);
HandleColor.SELECT_HIGHLIGHT_ACTIVE = mix(mix(HandleColor.SELECT, HandleColor.ACTIVE, 0.5), HandleColor.HIGHLIGHT, 0.5);

function rgb2css(color) {
  let r = color[0], g = color[1], b = color[2];
  return "rgb(" + (~~(r*255)) + "," + (~~(g*255)) + "," + (~~(b*255)) + ")";
}

//create final lookup table
export const element_colormap = new Array(8);

for (let k in ElementColor) {
  let f = FlagMap[k];
  element_colormap[f] = rgb2css(ElementColor[k]);
}

//create final lookup table
export const handle_colormap = new Array(8);
for (let k in HandleColor) {
  let f = FlagMap[k];
  handle_colormap[f] = rgb2css(HandleColor[k]);
}

function get_element_flag(e, list) {
  let f = 0;

  f |= e.flag & SplineFlags.SELECT ? ColorFlags.SELECT : 0;
  f |= e === list.highlight ? ColorFlags.HIGHLIGHT : 0;
  f |= e === list.active ? ColorFlags.ACTIVE : 0;

  return f;
}

export function get_element_color(e, list) {
  if (e.type == SplineTypes.HANDLE)
    return handle_colormap[get_element_flag(e, list)];
  else
    return element_colormap[get_element_flag(e, list)];
}


const VERT_SIZE=3.0;
const SMALL_VERT_SIZE=1.0;

import {SplineDrawer} from './spline_draw_new.js';
import {redo_draw_sort} from './spline_draw_sort.js';
import { Vector2 } from '../util/vectormath.js';

export * from './spline_draw_sort';

export function draw_curve_normals(spline : Spline, g : CanvasRenderingContext2D, zoom : number) {
  for (let seg of spline.segments) {
    if (seg.v1.hidden || seg.v2.hidden) continue;
    //if (seg.hidden) continue;
    
    let length = seg.ks[KSCALE];
    
    if (length <= 0 || isNaN(length)) continue;
    
    //prevent infinite loops caused by degenerate infinite-length curves
    if (length > DRAW_MAXCURVELEN) length = DRAW_MAXCURVELEN;

    let ls = 0.0, dls = 5/zoom;
  
    for (ls=0; ls < length; ls += dls) {
      let s = ls / length;
      if (s > 1.0) continue;

      let co = seg.evaluate(s);
      let n = seg.normal(s).normalize();
      let k = seg.curvature(s);
      
      n.mulScalar(k*(window._d != undefined ? window._d : 1000)/zoom);
      
      g.lineWidth = 1;//*zoom;
      g.strokeColor = "%2233bb";
      
      g.beginPath();
      g.moveTo(co[0], co[1]);
      g.lineTo(co[0]+n[0], co[1]+n[1]);
      g.stroke();
    }
  }
}


export function draw_spline(spline, redraw_rects, g, editor, matrix, selectmode, only_render,
                            draw_normals, alpha, draw_time_helpers, curtime, ignore_layers)
{
  spline.canvas = g;
  
  if (spline.drawlist === undefined || (spline.recalc & RecalcFlags.DRAWSORT)) {
    redo_draw_sort(spline);
  }

  if (spline.drawer === undefined) {
    spline.drawer = new SplineDrawer(spline);
  }

  let zoom = editor.zoom;
  zoom = matrix.m11;

  if (isNaN(zoom)) {
    zoom = 1.0;
  }


  spline.drawer.update(spline, spline.drawlist, spline.draw_layerlist, matrix, 
                       redraw_rects, only_render, selectmode, g, zoom, editor, ignore_layers);
  let promise = spline.drawer.draw(editor.drawg);

  let actlayer = spline.layerset.active;


  /*
    matrix = new Matrix4(matrix);
    let matrix2 = new Matrix4();

    matrix2.translate(0.0, g.canvas.height, 0.0);
    
    let mm = new Matrix4();
    mm.scale(1.0, -1.0, 1.0);
    matrix2.multiply(mm);
    
    matrix.preMultiply(matrix2);

  //*/

  if (!only_render && draw_normals)
    draw_curve_normals(spline, g, zoom);
  
  let r = [[0, 0], [0, 0]];
  
  for (let s of spline.segments) {
    s.flag &= ~SplineFlags.DRAW_TEMP;
  }
  for (let f of spline.faces) {
    f.flag &= ~SplineFlags.DRAW_TEMP;
  }

  let vert_size = editor.draw_small_verts ? SMALL_VERT_SIZE : VERT_SIZE;
  
  if (only_render)
    return promise;
  
  //draw element handles
  
  let tmp1 = new Vector2();
  let tmp2 = new Vector2();
  let last_clr = undefined;

  g.beginPath();
  if (selectmode & SelMask.SEGMENT) {
    let dv = new Vector2();

    for (let seg of spline.segments) {
      let skip = (!ignore_layers && !seg.in_layer(actlayer));
      skip = skip || (seg.flag & SplineFlags.HIDE);
      skip = skip || (!(seg.flag & SplineFlags.SELECT) && seg !== spline.segments.active && seg !== spline.segments.highlight);

      if (skip) {
        continue;
      }

      let steps = seg.length / 24;
      steps = Math.min(Math.max(steps, 3), 64);
      steps = isNaN(steps) ? 3 : steps;

      let s = 0, ds = 1.0 / (steps - 1);

      g.beginPath();

      for (let side=0; side<2; side++) {
        let lastp = undefined;

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
    let w = vert_size*g.canvas.dpi_scale/zoom;

    for (let v of spline.handles) {
      let clr = get_element_color(v, spline.handles);
      
      if (!ignore_layers && !v.owning_segment.in_layer(actlayer))
        continue;
      if (v.owning_segment !== undefined && (v.owning_segment.flag & SplineFlags.HIDE))
        continue;
      if (v.owning_vertex !== undefined && (v.owning_vertex.flag & SplineFlags.HIDE))
        continue;
      if (!v.use) 
        continue;

      if ((v.flag & SplineFlags.AUTO_PAIRED_HANDLE) && v.hpair !== undefined && (v.segments.length > 2)) {
        continue;
      }

      if (v.flag & SplineFlags.HIDE)
        continue;


      tmp1.load(v).multVecMatrix(matrix);

      g.beginPath();
      if (clr !== last_clr)
        g.fillStyle = clr;
      last_clr = clr;
      g.rect(tmp1[0]-w, tmp1[1]-w, w*2, w*2);
      g.fill()
      
      g.beginPath();
      g.lineWidth = 1;//*zoom;

      let ov = v.owning_segment.handle_vertex(v);
      
      tmp2.load(ov).multVecMatrix(matrix);

      g.moveTo(tmp1[0], tmp1[1]);
      g.lineTo(tmp2[0], tmp2[1]);
      
      g.stroke();
    }
  }

  if (selectmode & SelMask.VERTEX) {
    let w = vert_size*g.canvas.dpi_scale/zoom;
    
    for (let i=0; i<spline.verts.length; i++) {
      let v = spline.verts[i];
      let clr = get_element_color(v, spline.verts);
      
      if (!ignore_layers && !v.in_layer(actlayer))
        continue;
      if (v.flag & SplineFlags.HIDE) continue;


      let co = tmp1.load(v);
      co.multVecMatrix(matrix);
      
      if (draw_time_helpers) {
        let time = get_vtime(v);
        
        if (curtime === time) {
          g.beginPath(  );
          g.fillStyle = "#33ffaa";
          g.rect(co[0]-w*2, co[1]-w*2, w*4, w*4);
          g.fill()
          g.fillStyle = clr;
        }
      }
      
      g.beginPath();
      if (clr !== last_clr)
        g.fillStyle = clr;

      last_clr = clr;
      g.rect(co[0]-w, co[1]-w, w*2, w*2);
      g.fill()
    }
  }
  
  //XXX this does not go here!
  if (spline.transforming && spline.proportional) {
    g.beginPath();
    g.arc(spline.trans_cent[0], spline.trans_cent[1], spline.prop_radius, -PI, PI);
    g.stroke();
  }

  return promise;
}

let __margin = new Vector2([15, 15]);
let __aabb = [new Vector2(), new Vector2()];

export function redraw_element(e, view2d) {
  let margin = __margin;
  let aabb = __aabb;

  e.flag |= SplineFlags.REDRAW;
  
  margin[0] = margin[1] = 15.0;

  if (view2d !== undefined)
    margin.mulScalar(1.0/view2d.zoom);
  
  let e_aabb = e.aabb;
  
  aabb[0].load(e_aabb[0]); aabb[1].load(e_aabb[1]);
  aabb[0].sub(margin); aabb[1].add(margin);
  
  window.redraw_viewport(aabb[0], aabb[1]);
}
