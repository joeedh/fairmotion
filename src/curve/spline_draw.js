import {aabb_isect_minmax2d} from '../util/mathlib.js';
import {ENABLE_MULTIRES} from '../config/config.js';

import {SessionFlags} from '../editors/viewport/view2d_editor.js';
import {SelMask} from '../editors/viewport/selectmode.js';
import {ORDER, KSCALE, KANGLE, KSTARTX, KSTARTY, KSTARTZ, KTOTKS, INT_STEPS} from './spline_math.js';
import {get_vtime} from '../core/animdata.js';

var spline_draw_cache_vs = cachering.fromConstructor(Vector3, 64);
var spline_draw_trans_vs = cachering.fromConstructor(Vector3, 32);

var PI = Math.PI;
var pow = Math.pow, cos = Math.cos, sin = Math.sin, abs = Math.abs, floor = Math.floor,
    ceil = Math.ceil, sqrt = Math.sqrt, log = Math.log, acos = Math.acos, asin = Math.asin;

export var DRAW_MAXCURVELEN = 10000;

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
export var ColorFlags = {
  SELECT : 1,
  ACTIVE : 2,
  HIGHLIGHT : 4
};

export var FlagMap = {
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
  var ret = [0, 0, 0];

  for (var i=0; i<3; i++) {
    ret[i] = a[i] + (b[i] - a[i])*t;
  }

  return ret;
}

//unnest table
export var ElementColor = {
  UNSELECT   : [1, 0.133, 0.07],
  SELECT     : [1, 0.6, 0.26],
  HIGHLIGHT  : [1, 0.93, 0.4],
  ACTIVE     : [0.3, 0.4, 1.0],
  SELECT_ACTIVE : mix([1, 0.6, 0.26], [0.1, 0.2, 1.0], 0.7),
  SELECT_HIGHLIGHT : [1, 1, 0.8],
  HIGHLIGHT_ACTIVE : mix([1, 0.93, 0.4], [0.3, 0.4, 1.0], 0.5),
  SELECT_HIGHLIGHT_ACTIVE : [0.85, 0.85, 1.0]
};

export var HandleColor = {
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
  var r = color[0], g = color[1], b = color[2];
  return "rgb(" + (~~(r*255)) + "," + (~~(g*255)) + "," + (~~(b*255)) + ")";
}

//create final lookup table
export var element_colormap = new Array(8);

for (var k in ElementColor) {
  var f = FlagMap[k];
  element_colormap[f] = rgb2css(ElementColor[k]);
}

//create final lookup table
export var handle_colormap = new Array(8);
for (var k in HandleColor) {
  var f = FlagMap[k];
  handle_colormap[f] = rgb2css(HandleColor[k]);
}

function get_element_flag(e, list) {
  var f = 0;

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


var VERT_SIZE=3.0;
var SMALL_VERT_SIZE=1.0;

import {SplineDrawer} from './spline_draw_new.js';
import {redo_draw_sort} from './spline_draw_sort.js';
import { Vector2 } from '../util/vectormath.js';

export * from './spline_draw_sort';

export function draw_curve_normals(spline : Spline, g : CanvasRenderingContext2D, zoom : number) {
  for (var seg of spline.segments) {
    if (seg.v1.hidden || seg.v2.hidden) continue;
    //if (seg.hidden) continue;
    
    var length = seg.ks[KSCALE];
    
    if (length <= 0 || isNaN(length)) continue;
    
    //prevent infinite loops caused by degenerate infinite-length curves
    if (length > DRAW_MAXCURVELEN) length = DRAW_MAXCURVELEN;
  
    var ls = 0.0, dls = 5/zoom;
  
    for (var ls=0; ls <length; ls += dls) {
      var s = ls / length;
      if (s > 1.0) continue;
      
      var co = seg.evaluate(s);
      var n = seg.normal(s).normalize();
      var k = seg.curvature(s);
      
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

  var zoom = editor.zoom;
  zoom = matrix.m11;

  if (isNaN(zoom)) {
    zoom = 1.0;
  }

  spline.drawer.update(spline, spline.drawlist, spline.draw_layerlist, matrix, 
                       redraw_rects, only_render, selectmode, g, zoom, editor, ignore_layers);
  spline.drawer.draw(editor.drawg);
  
  var actlayer = spline.layerset.active;


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
  
  static r = [[0, 0], [0, 0]];
  
  for (var s of spline.segments) {
    s.flag &= ~SplineFlags.DRAW_TEMP;
  }
  for (var f of spline.faces) {
    f.flag &= ~SplineFlags.DRAW_TEMP;
  }
  
  var vert_size = editor.draw_small_verts ? SMALL_VERT_SIZE : VERT_SIZE;
  
  if (only_render)
    return;
  
  //draw element handles
  
  let tmp1 = new Vector2();
  let tmp2 = new Vector2();
  
  g.beginPath();
  if (selectmode & SelMask.HANDLE) {
    var w = vert_size*g.canvas.dpi_scale/zoom;
    
    for (var i=0; i<spline.handles.length; i++) {
      var v = spline.handles[i];
      var clr = get_element_color(v, spline.handles);
      
      if (!ignore_layers && !v.owning_segment.in_layer(actlayer))
        continue;
      if (v.owning_segment != undefined && v.owning_segment.flag & SplineFlags.HIDE)
        continue;
      if (v.owning_vertex != undefined && v.owning_vertex.flag & SplineFlags.HIDE)
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

      var ov = v.owning_segment.handle_vertex(v);
      
      tmp2.load(ov).multVecMatrix(matrix);

      g.moveTo(tmp1[0], tmp1[1]);
      g.lineTo(tmp2[0], tmp2[1]);
      
      g.stroke();
    }
  }
  
  var last_clr = undefined;
  if (selectmode & SelMask.VERTEX) {
    var w = vert_size*g.canvas.dpi_scale/zoom;
    
    for (var i=0; i<spline.verts.length; i++) {
      var v = spline.verts[i];
      var clr = get_element_color(v, spline.verts);
      
      if (!ignore_layers && !v.in_layer(actlayer))
        continue;
      if (v.flag & SplineFlags.HIDE) continue;

      
      var co = tmp1.load(v);
      co.multVecMatrix(matrix);
      
      if (draw_time_helpers) {
        var time = get_vtime(v);
        
        if (curtime == time) {
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
}

export function patch_canvas2d(g) {
    var this2 = this;
    //g._is_patched = this;
    
    if (g._lineTo == undefined) {
      g._lineTo = g.lineTo;
      g._moveTo = g.moveTo;
      g._drawImage = g.drawImage;
      g._putImageData = g.putImageData;
      g._rect = g.rect;
      g._bezierCurveTo = g.bezierCurveTo;
      g._clearRect = g.clearRect;
      g._translate = g.translate;
      g._scale = g.scale;
      g._rotate = g.rotate;
    }
    return;

    var a = new Vector3(), b = new Vector3(), c = new Vector3(), d = new Vector3();
    
    function transform(g, co) {
      var rendermat = g._render_mat;
      
      if (rendermat != undefined) {
        co.multVecMatrix(rendermat);
      }

      let dpiscale = g.canvas.dpi_scale || 1.0;
      co[1] = g.canvas.height/dpiscale - co[1];
    }
    
    function untransform(g, co) {
      var rendermat = g._irender_mat;
      
      let dpiscale = g.canvas.dpi_scale || 1.0;

      co[1] = g.canvas.height/dpiscale - co[1];
      
      if (rendermat != undefined) {
        co.multVecMatrix(rendermat);
      }
    }
    
    /*g.translate = function(x, y) {
      this._render_mat.translate(x, y, 0.0);
    }
    
    g.scale = function(x, y) {
      this._render_mat.scale(x, y, 1.0);
    }*/
    
    var co = new Vector3(), co2 = new Vector3();
    
    g.moveTo = function(x, y) {
      co.zero(); co[0] = x; co[1] = y;
      transform(this, co);
      
      g._moveTo(co[0], co[1]);
    }
    
    g._arc = g.arc;
    g.arc = function(x, y, r, th1, th2) {
      co[0] = x;
      co[1] = y;
      
      co2[0] = x + Math.sin(th1)*r;
      co2[1] = y + Math.cos(th1)*r;
  
      co[2] = co2[2] = 0.0;

      transform(this, co);
      transform(this, co2);
      
      r = co.vectorDistance(co2);
      
      co2.sub(co);
      let th = Math.atan2(co2[1], co2[0]);
      
      let dth = th - th1;
      dth = 0; //XXX
      
      g._arc(co[0], co[1], r, th1 + dth, th2 + dth);
    }
    
    g.drawImage = function(image) {
      if (arguments.length == 3) {
        var x = arguments[1], y = arguments[2];
        var w = x+image.width, h = y+image.height;
        
        co.zero(); co[0] = x; co[1] = y;
        transform(this, co);
        
        x = co[0], y = co[1];
        
        co.zero(); co[0] = w; co[1] = h;
        transform(this, co);
        
        console.log(x, y, "w, h", Math.abs(co[0]-x), Math.abs(co[1]-y), w, h);
        this._drawImage(image, x, y, Math.abs(co[0]-x), Math.abs(co[1]-y));
      } else if (arguments.length == 5) {
        var x = arguments[1], y = arguments[2];
        var w = x+arguments[3], h = y+arguments[4];
        
        co.zero(); co[0] = x; co[1] = y;
        transform(this, co);
        
        x = co[0], y = co[1];
        
        co.zero(); co[0] = w; co[1] = h;
        transform(this, co);
        
        console.log(x, y, "w, h", Math.abs(co[0]-x), Math.abs(co[1]-y), w, h);
        this._drawImage(image, x, y, Math.abs(co[0]-x), Math.abs(co[1]-y));
      } else {
        throw new Error("Invalid call to drawImage")
      }
    }
    
    g.putImageData = function(imagedata) {
      if (arguments.length == 3) {
        co.zero(); co[0] = arguments[1]; co[1] = arguments[2];
        transform(this, co);
        var x = co[0], y = co[1];
        
        //co[0] = arguments[1]+imagedata.width; co[1] = arguments[1]+imagedata.height;
        //transform(this, co);
        
        //var w = co[0]-x, h = co[1]-y;
        
        this._putImageData(imagedata, x, y);
      } else if (arguments.length == 5) {
        console.trace("Unimplemented!!!!");
      } else {
        throw new Error("Invalid number of argumnets to g.putImageData()");
      }
    }
    
    g.bezierCurveTo = function(x1, y1, x2, y2, x3, y3) {
      co[0] = x1; co[1] = y1; co[2] = 0.0;
      transform(this, co);
      x1 = co[0], y1 = co[1];
      
      co[0] = x2; co[1] = y2; co[2] = 0.0;
      transform(this, co);
      x2 = co[0], y2 = co[1];
      
      co[0] = x3; co[1] = y3; co[2] = 0.0;
      transform(this, co);
      x3 = co[0], y3 = co[1];

      this._bezierCurveTo(x1, y1, x2, y2, x3, y3);
    }
    
    g.lineTo = function(x, y) {
      co.zero(); co[0] = x; co[1] = y;
      transform(this, co);
      this._lineTo(co[0], co[1]);
    }
    
    g.rect = function(x, y, wid, hgt) {
      a.loadXYZ(x, y, 0); 
      b.loadXYZ(x+wid, y+hgt, 0);
      
      transform(this, a); transform(this, b);
      
      var xmin = Math.min(a[0], b[0]), xmax = Math.max(a[0], b[0]);
      var ymin = Math.min(a[1], b[1]), ymax = Math.max(a[1], b[1]);
      
      this._rect(xmin, ymin, Math.abs(xmax-xmin), Math.abs(ymax-ymin));
    }
    
    g.clearRect = function(x, y, wid, hgt) {
      a.loadXYZ(x, y, 0); 
      b.loadXYZ(x+wid, y+hgt, 0);
      
      transform(this, a); transform(this, b);
      
      var xmin = Math.min(a[0], b[0]), xmax = Math.max(a[0], b[0]);
      var ymin = Math.min(a[1], b[1]), ymax = Math.max(a[1], b[1]);
      
      this._clearRect(xmin, ymin, Math.abs(xmax-xmin), Math.abs(ymax-ymin));
    }
}

export function set_rendermat(g, mat) {
  if (g._is_patched == undefined) {
    patch_canvas2d(g);
  }
  
  g._render_mat = mat;
  
  if (g._irender_mat === undefined) {
    g._irender_mat = new Matrix4(mat);
  }
  
  g._irender_mat.load(mat);
  g._irender_mat.invert();
}

export function redraw_element(e, view2d) {
  static margin = new Vector3([15, 15, 15]);

  e.flag |= SplineFlags.REDRAW;
  
  margin[0] = margin[1] = margin[2] = 15.0;

  if (view2d != undefined)
    margin.mulScalar(1.0/view2d.zoom);
  
  static aabb = [new Vector3(), new Vector3()];
  
  var e_aabb = e.aabb;
  
  aabb[0].load(e_aabb[0]), aabb[1].load(e_aabb[1]);
  aabb[0].sub(margin), aabb[1].add(margin);
  
  window.redraw_viewport(aabb[0], aabb[1]);
}
