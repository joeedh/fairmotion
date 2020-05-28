"use strict";

import {aabb_isect_minmax2d, MinMax} from '../util/mathlib.js';
import {ENABLE_MULTIRES} from '../config/config.js';

import * as config from '../config/config.js';

import * as vectordraw_jobs from '../vectordraw/vectordraw_jobs.js';

import {SessionFlags} from '../editors/viewport/view2d_editor.js';
import {SelMask} from '../editors/viewport/selectmode.js';
import {ORDER, KSCALE, KANGLE, KSTARTX, KSTARTY, KSTARTZ, KTOTKS, INT_STEPS} from './spline_math.js';
import {get_vtime} from '../core/animdata.js';

import {iterpoints, MultiResLayer, MResFlags, has_multires} from './spline_multires.js';

var spline_draw_cache_vs = cachering.fromConstructor(Vector3, 64);
var spline_draw_trans_vs = cachering.fromConstructor(Vector3, 32);

var PI = Math.PI;
var pow = Math.pow, cos = Math.cos, sin = Math.sin, abs = Math.abs, floor = Math.floor,
    ceil = Math.ceil, sqrt = Math.sqrt, log = Math.log, acos = Math.acos, asin = Math.asin;

import {
  SplineFlags, SplineTypes, SplineElement, SplineVertex, 
  SplineSegment, SplineLoop, SplineLoopPath, SplineFace,
  RecalcFlags, MaterialFlags
} from './spline_types.js';

import {ElementArray, SplineLayerFlags} from './spline_element_array.js';

import {
  Canvas, Path, VectorFlags
} from '../vectordraw/vectordraw.js';

//XXX
//import * as vectordraw from 'vectordraw';
//var VectorDraw = vectordraw.Canvas;

var update_tmps_vs = new cachering(function() {
  return new Vector2();
}, 64);

var update_tmps_mats = new cachering(function() {
  return new Matrix4();
}, 64);


var draw_face_vs = new cachering(function() {
  return new Vector3();
}, 32);

var MAXCURVELEN = 10000;

export class DrawParams {
  constructor() {
    this.init.apply(this, arguments);
  }
  
  init(redraw_rects, actlayer, only_render, selectmode, zoom, z, off, spline, drawlist) {
    this.redraw_rects = redraw_rects, this.actlayer = actlayer, 
    this.only_render = only_render, this.selectmode = selectmode, this.zoom = zoom, this.z = z, 
    this.off = off, this.spline = spline;
    this.drawlist = drawlist;
    
    this.combine_paths = true;
    
    return this;
  }
}

var drawparam_cachering = new cachering(function() {
  return new DrawParams();
}, 16);

export class SplineDrawer {
  used_paths : Object
  recalc_all : boolean;

  constructor(spline, drawer=new Canvas()) {
    this.spline = spline;
    this.used_paths = {};
    this.recalc_all = false;
    //this.path_minmaxes = {};
    
    this.drawer = drawer;
    
    this.last_zoom = undefined;
    this.last_3_mat = undefined;
    this.last_stroke_z   = undefined;
    this.last_stroke_eid = undefined;
    this.last_layer_id = undefined;
    this.last_stroke_stringid = undefined;
  }
  
  update(spline, drawlist, drawlist_layerids, matrix, redraw_rects, only_render, 
         selectmode, master_g, zoom, editor, ignore_layers)
  {
    //console.log("SPLINEDRAW_NEW UPDATE!", drawlist.length);
    
    this.used_paths = {};
    this.drawlist = drawlist;
    this.drawlist_layerids = drawlist_layerids;
    
    var actlayer = spline.layerset.active;
    
    var do_blur = !!(only_render || editor.enable_blur);
    var draw_faces = !!(only_render || editor.draw_faces);
    
    var recalc_all = this.recalc_all || this.draw_faces !== draw_faces || this.do_blur !== do_blur;
    //recalc_all = recalc_all || zoom !== this.last_zoom;

    //console.log("all will redrw?", recalc_all);
    if (recalc_all) {
      //abort all outstanding render threads
      //vectordraw_jobs.manager.cancelAllJobs();
    }
    
    this.last_zoom = zoom;
    this.draw_faces = draw_faces;
    this.do_blur = do_blur;
    
    this.last_stroke_mat = undefined;
    this.last_stroke_z   = undefined;
    this.last_stroke_eid = undefined;
    this.last_layer_id = undefined;
    this.last_stroke_stringid = undefined;

    let drawMatrix = matrix;

    var mat = update_tmps_mats.next();
    mat.load(matrix), matrix = mat;
    
    var mat2 = update_tmps_mats.next();
    
    mat2.makeIdentity();
    mat2.translate(0.0, -master_g.height, 0.0);
    //matrix.multiply(mat2);
    
    mat2.makeIdentity();
    mat2.translate(0.0, master_g.height, 0.0);
    mat2.scale(1.0, -1.0, 1.0);
    matrix.preMultiply(mat2);
    
    //check if matrix scale or rotation have changed
    var m1 = matrix.$matrix, m2 = this.drawer.matrix.$matrix;
    var off = update_tmps_vs.next().zero();
    
    this.recalc_all = false;
    
    if (m1.m11 !== m2.m11 || m1.m22 !== m2.m22) {
      //recalc_all = true;
    }
    
    if (!recalc_all) {
      //calculate translation offset
      var a = update_tmps_vs.next().zero(), b = update_tmps_vs.next().zero();
      a.multVecMatrix(this.drawer.matrix);
      b.multVecMatrix(matrix);
      
      off.load(b).sub(a);
    } else {
      off.zero();
    }
    
    
    //update pan.  clear matrice's translation
    var m = matrix.$matrix;
    this.drawer.pan[0] = m.m41;
    this.drawer.pan[1] = m.m42;
    m.m41 = m.m42 = m.m43 = 0;
    
    this.drawer.set_matrix(drawMatrix); //matrix);

    if (recalc_all) {
      if (DEBUG.trace_recalc_all) {
        console.trace("%c RECALC_ALL!  ", "color:orange");
      }
    }
    
    var drawparams = drawparam_cachering.next().init(redraw_rects, actlayer, only_render,
                                                 selectmode, zoom, undefined, off, spline, drawlist);
                                                 
    for (var i=0; i<drawlist.length; i++) {
      var e = drawlist[i];
      //e.finalz = i;
      
      var layerid = this.drawlist_layerids[i];
      
      if (e.flag & SplineFlags.HIDE)
        continue;
      
      if ((e.flag & SplineFlags.NO_RENDER) && e.type != SplineTypes.VERTEX && (selectmode != e.type || only_render))
        continue;
      
      var visible = false;
      
      for (var k in e.layers) {
        if (!(spline.layerset.get(k).flag & SplineLayerFlags.HIDE)) {
          visible = true;
        }
      }
      
      if (!visible)
        continue;
      
      if (recalc_all) {
        e.flag |= SplineFlags.REDRAW;
      }
    
      drawparams.z = i;
      drawparams.combine_paths = true;
      
      if (e.type == SplineTypes.FACE) {
        this.update_polygon(e, redraw_rects, actlayer, only_render, selectmode, zoom, i, off, spline, ignore_layers);
      } else if (e.type == SplineTypes.SEGMENT) {
        this.update_stroke(e, drawparams);
      }
      
      this.last_layer_id = this.drawlist_layerids[i];
    }
    
    for (var k in this.drawer.path_idmap) {
      if (!(k in this.used_paths)) {
        var path = this.drawer.path_idmap[k];
        
        this.drawer.remove(path);
      }
    }
  }
  
  get_path(id, z, check_z=true) {
    this.used_paths[id] = 1;
    var path;
    
    if (!this.has_path(id, z, check_z)) {
      path = this.drawer.get_path(id, z, check_z);
      path.frame_first = true;
    } else {
      path = this.drawer.get_path(id, z, check_z);
    }
    
    return path;
  }
  
  has_path(id, z, check_z=true) {
    this.used_paths[id] = 1;
    
    return this.drawer.has_path(id, z, check_z);
  }
  
  update_stroke(seg, drawparams) {
    var redraw_rects = drawparams.redraw_rects, actlayer = drawparams.actlayer;
    var only_render = drawparams.only_render, selectmode = drawparams.selectmode;
    var zoom = drawparams.zoom, z = drawparams.z, off = drawparams.off, spline = drawparams.spline;
    var drawlist = drawparams.drawlist;
    
    var eid = seg.eid; 
    
    /*
    if (drawparams.combine_paths && this.last_stroke_mat != undefined) {
      var keep = this.last_stroke_stringid == seg.stringid;
      keep = keep && this.last_stroke_mat.equals(true, seg.mat);
      keep = keep && this.has_path(this.last_stroke_eid, z, false) && this.get_path(this.last_stroke_eid, z, false).was_updated;
      
      if (keep) {
        eid = this.last_stroke_eid;
      }
    }
    //*/
    
    if (this.has_path(eid, z, eid==seg.eid) && !(seg.flag & SplineFlags.REDRAW)) {
      return;
    }
    
    if (seg.eid == eid) {
      this.last_stroke_mat = seg.mat;
      this.last_stroke_eid = seg.eid;
      this.last_stroke_stringid = seg.stringid;
    }
    
    
    seg.flag &= ~SplineFlags.REDRAW;
    
    var l = seg.ks[KSCALE] * zoom;
    let add = (Math.sqrt(l) / 5);
    var steps = 7 + ~~add;
    
    //console.log("STEPS", "l", l, "add", add, "steps", steps);
    var ds = 1.0 / (steps - 1), s = 0.0;
    
    
    /*
    on factor;
    off period;
    
    operator x, y, k;
    
    forall s let df(x(s), s, 2) = -df(y(s), s)*k(s);
    forall s let df(y(s), s, 2) = df(x(s), s)*k(s);
    
    offx := x(s) - df(y(s), s)*lw;
    offy := y(s) + df(x(s), s)*lw;
    
    df(offx, s);
    df(offy, s);
    */
    
    var path = this.get_path(eid, z, eid == seg.eid);
    path.update();
    
    path.was_updated = true;
    
    if (path.frame_first && path.clip_paths.length > 0) {
      path.reset_clip_paths();
      path.frame_first = false;
    }
    
    //path.beginPath();
    
    if (seg.l !== undefined && (seg.mat.flag & MaterialFlags.MASK_TO_FACE)) {
      var l = seg.l, _i = 0;
      
      do {
        var fz = l.f.finalz;
        
        //is face in front of segment, or not in drawlist (hidden)?
        if (fz > z) {
          l = l.radial_next;
          continue;
        }
        
        var path2 = this.get_path(l.f.eid, fz);
        path.add_clip_path(path2);
        
        if (_i++ > 1000) {
          console.trace("Warning: infinite loop!");
          break;
        }
        l = l.radial_next;
      } while (l != seg.l);
    }
    
    if (eid == seg.eid) {
      path.reset();
    }
    
    path.blur = seg.mat.blur * (this.do_blur ? 1 : 0);

    //XXX evil hard-coded colors, see update_polygon too
    if (only_render) {
      path.color.load(seg.mat.strokecolor);
    } else {
      if ((selectmode & SelMask.SEGMENT) && seg === spline.segments.highlight) {
        path.color[0] = 200 / 255, path.color[1] = 200 / 255, path.color[2] = 50 / 255, path.color[3] = 0.8;
        //g.strokeStyle = "rgba(200, 200, 50, 0.8)";
      } else if ((selectmode & SelMask.SEGMENT) && seg === spline.segments.active) {
        path.color[0] = 200 / 255, path.color[1] = 80 / 255, path.color[2] = 50 / 255, path.color[3] = 0.8;
        //g.strokeStyle = "rgba(200, 80, 50, 0.8)";
      } else if ((selectmode & SelMask.SEGMENT) && (seg.flag & SplineFlags.SELECT)) {
        path.color[0] = 250 / 255, path.color[1] = 140 / 255, path.color[2] = 50 / 255, path.color[3] = 0.8;
        //g.strokeStyle = "rgba(250, 140, 50, 0.8)";
      } else {
        path.color.load(seg.mat.strokecolor);
      }
    }

    var lw = seg.mat.linewidth*0.5;
    
    
    var no = seg.normal(0).normalize().mulScalar(lw);
    var co = seg.evaluate(0).add(no);
    var fx=co[0], fy = co[1];
    var lastdv, lastco;
    
    var len = seg.length;
    
    let stretch = 1.0//15;
    
    s = 0;
    for (var i=0; i<steps; i++, s += ds) {
      var dv = seg.derivative(s*stretch).normalize();
      var co = seg.evaluate(s*stretch);
      var k = -seg.curvature(s*stretch);
      
      co[0] += -dv[1]*lw;
      co[1] += dv[0]*lw;
      
      dv[0] *= (1.0 - lw*k);
      dv[1] *= (1.0 - lw*k);
      dv.mulScalar(len*ds/3.0);
      
      if (i > 0) {
        path.cubicTo(lastco[0]+lastdv[0], lastco[1]+lastdv[1], co[0]-dv[0], co[1]-dv[1], co[0], co[1], 1);
      } else {
        path.moveTo(co[0], co[1]);
      }
      
      lastdv = dv;
      lastco = co;
    }
    
    s = 1.0;
    lw = -lw;
    
    for (var i=0; i<steps; i++, s -= ds) {
      var dv = seg.derivative(s*stretch).normalize();
      var co = seg.evaluate(s*stretch);
      var k = -seg.curvature(s*stretch);
      
      co[0] += -dv[1]*lw;
      co[1] +=  dv[0]*lw;
      
      dv[0] *= -(1.0 - lw*k);
      dv[1] *= -(1.0 - lw*k);
      
      dv.mulScalar(len*ds/3.0);
      
      if (i > 0) {
        path.cubicTo(lastco[0]+lastdv[0], lastco[1]+lastdv[1], co[0]-dv[0], co[1]-dv[1], co[0], co[1], 1);
      } else {
        path.lineTo(co[0], co[1]);
      }
      
      lastdv = dv;
      lastco = co;
    }
    
    /*
    if (eid != seg.eid) {
      path.update_aabb(this);
      var max = config.MAX_CANVAS2D_VECTOR_CACHE_SIZE;
      
      if (path.aabb[1][0]-path.aabb[0][0] > max || path.aabb[1][1]-path.aabb[0][1] > max) {
        path.undo();
        drawparams.combine_paths = false;
        
        this.update_stroke(seg, drawparams);
      }
    }//*/
    
    //deal with layerflags.mask, mask to previous layer
    var layer = undefined;
    for (var k in seg.layers) {
      layer = spline.layerset.get(k);
    }
    
    if (layer != undefined && (layer.flag & SplineLayerFlags.MASK)) {
      //find previous layer;
      var li = spline.layerset.indexOf(layer);
      if (li <= 0) {
        console.trace("Error in update_seg", layer, spline);
        return path;
      }
      
      var prev = spline.layerset[li-1];
      
      //drawparams.z is position within drawlist, not seg.z
      //find elements in previous layer, that are drawn (are inside the drawlist)
      var i = drawparams.z;
      var layerid = layer.id;
      
      while (i > 0 && layerid != prev.id) {
        i--;
        for (var k in drawlist[i].layers) {
          layerid = k;
          
          if (layerid == prev.id)
            break;
        }
      }
      
      while (i >= 0 && layerid == prev.id) {
        var item = drawlist[i];
        
        //console.log("TYPE:", item.type, item);
        
        if (item.type == SplineTypes.FACE) {
          var path2 = this.get_path(item.eid, i);
          path.add_clip_path(path2);
        }
        
        i--;
        if (i < 0)
          break;
        
        for (var k in drawlist[i].layers) {
          layerid = k;
          
          if (layerid == prev.id)
            break;
        }
      }
    }
    
    return path;
  }
  
  update_polygon(f, redraw_rects, actlayer, only_render, selectmode, zoom, z, off, spline, ignore_layers) {
    if (this.has_path(f.eid, z) && !(f.flag & SplineFlags.REDRAW)) {
      return;
    }
    
    f.flag &= ~SplineFlags.REDRAW;
    var path = this.get_path(f.eid, z);
    path.was_updated = true;
    
    path.hidden = !this.draw_faces;
    
    path.reset();
    path.blur = f.mat.blur * (this.do_blur ? 1 : 0);
    path.color.load(f.mat.fillcolor);
    
    //g.lineWidth = 8;//*zoom;
    
    //if (!do_mask) {
    //  g.beginPath();
    //}
    
    //if (!(f.flag & SplineFlags.DRAW_TEMP))
    //  return;
    var lastco = draw_face_vs.next().zero();
    var lastdv = draw_face_vs.next().zero();
    
    for (var path2 of f.paths) {
      var first = true;
      
      for (var l of path2) {
        var seg = l.s;
        var length = seg.length;
        
        var flip = seg.v1 !== l.v ? -1.0 : 1.0;
        
        var length = Math.min(seg.ks[KSCALE], MAXCURVELEN);
        var steps = 6, s = flip<0.0 ? 1.0 : 0.0;
        
        var ds = (1.0 / (steps-1))*flip;
        
        for (var i=0; i<steps; i++, s += ds) {
          var co = seg.evaluate(s*0.9998 + 0.00001);
          var dv = seg.derivative(s*0.9998 + 0.00001);
          var k = seg.curvature(s*0.9998 + 0.00001);
          
          dv.mulScalar(ds/3.0);
          
          if (first) {
            first = false;
            path.moveTo(co[0], co[1]);
          } else {
            //*
            if (i==0 || abs(k) < 0.00001/zoom) {
              path.lineTo(co[0], co[1]);
            } else {
              var midx = (lastco[0]+lastdv[0] + co[0]-dv[0])*0.5;
              var midy = (lastco[1]+lastdv[1] + co[1]-dv[1])*0.5;
              
              path.cubicTo(lastco[0]+lastdv[0], lastco[1]+lastdv[1], 
                           co[0]-dv[0], co[1]-dv[1], 
                           co[0], co[1], 1);
              //path.bezierTo( midx, midy, co[0], co[1]);
            }
          }
          
          lastco.load(co);
          lastdv.load(dv);
        }
      }
    }
    
    if (/*do_mask ||*/ (!ignore_layers && !f.in_layer(actlayer)) || only_render)
      return;
    
    if ((selectmode & SelMask.FACE) && f === spline.faces.highlight) {
      path.color[0] = 200/255, path.color[1] = 200/255, path.color[2] = 50/255, path.color[3] = 0.8;
      //g.strokeStyle = "rgba(200, 200, 50, 0.8)";
    } else if ((selectmode & SelMask.FACE) && f === spline.faces.active) {
      path.color[0] = 200/255, path.color[1] = 80/255, path.color[2] = 50/255, path.color[3] = 0.8;
      //g.strokeStyle = "rgba(200, 80, 50, 0.8)";
    } else if ((selectmode & SelMask.FACE) && (f.flag & SplineFlags.SELECT)) {
      path.color[0] = 250/255, path.color[1] = 140/255, path.color[2] = 50/255, path.color[3] = 0.8;
      //g.strokeStyle = "rgba(250, 140, 50, 0.8)";
    }
    
    return path;
  }
  
  draw(g) {
    //console.log("DRAWDRAW!", canvas, g, this, Canvas, Canvas.prototype.draw);
    
    this.drawer.draw(g);
    return; //XXX
/*    
    this.canvas = canvas;
    this.g = g;
    
    if (this.dosort) {
      this.dosort = 0;
      
      this.paths.sort(function(a, b) {
        return a.z - b.z;
      });
    }
    
    for (var path of this.paths) {
      if (path.hidden) {
        continue; //XXX eek!
      }
      path.draw(this);
    }*/
  }
}
