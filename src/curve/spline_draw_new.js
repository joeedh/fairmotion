"use strict";

import {aabb_isect_minmax2d, MinMax, line_isect, line_line_cross4, COLINEAR, LINECROSS} from '../util/mathlib.js';
import {ENABLE_MULTIRES} from '../config/config.js';

import {nstructjs} from "../path.ux/scripts/pathux.js";

import * as config from '../config/config.js';
import {ClosestModes} from './spline_base.js';

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

window.FANCY_JOINS = true;

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

import {CustomDataLayer} from "./spline_types.js";

export class SplineDrawData extends CustomDataLayer {
  start : number
  end   : number;

  constructor() {
    super();

    this.start = 0.0;
    this.end = 1.0;
  }

  copy(src) {
    //this.start = src.start;
    //this.end = src.end;

    return this;
  }

  gets(seg, v, margin=0.0) {
    if (!(seg instanceof SplineSegment)) {
      throw new Error("invalid arguments to SplineDrawData.prototype.gets()");
    }

    return v === seg.v1 ? this.start-margin : this.end+margin;
  }

  sets(seg, v, s) {
    if (v === seg.v1) {
      this.start = s;
    } else if (v === seg.v2) {
      this.end = s;
    } else {
      throw new Error("invalid arguments to SplineDrawData.prototype.sets()");
    }

    return this;
  }

  loadSTRUCT(reader) {
    reader(this);
    super.loadSTRUCT(reader);
  }

  static define() {return {
    typeName : "drawdata"
  }}
}
SplineDrawData.STRUCT = nstructjs.inherit(SplineDrawData, CustomDataLayer) + `
  start : float;
  end   : float;
}
`;

export class SplineDrawer {
  used_paths   : Object
  recalc_all   : boolean;
  last_totvert : number;
  last_totseg  : number;
  last_totface : number;

  constructor(spline, drawer=new Canvas()) {
    this.spline = spline;
    this.used_paths = {};
    this.recalc_all = false;
    //this.path_minmaxes = {};
    
    this.drawer = drawer;

    this.last_totvert = 0;
    this.last_totseg = 0;
    this.last_totface = 0;

    if (!spline.segments.cdata.has_layer("drawdata")) {
      spline.segments.cdata.add_layer(SplineDrawData);
    }

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
    if (!spline.segments.cdata.has_layer("drawdata")) {
      spline.segments.cdata.add_layer(SplineDrawData);
    }

    /*
    for (let seg of spline.segments) {
      let data = seg.cdata.get_layer(SplineDrawData);

      data.start = 0.0;
      data.end = 1.0;
    }*/

    this.used_paths = {};
    this.drawlist = drawlist;
    this.drawlist_layerids = drawlist_layerids;
    
    var actlayer = spline.layerset.active;
    
    var do_blur = !!(only_render || editor.enable_blur);
    var draw_faces = !!(only_render || editor.draw_faces);
    
    var recalc_all = this.recalc_all || this.draw_faces !== draw_faces || this.do_blur !== do_blur;

    recalc_all = recalc_all || spline.verts.length !== this.last_totvert;
    recalc_all = recalc_all || spline.segments.length !== this.last_totseg;
    recalc_all = recalc_all || spline.faces.length !== this.last_totface;

    //console.log("all will redrw?", recalc_all);
    if (recalc_all) {
      //abort all outstanding render threads
      //vectordraw_jobs.manager.cancelAllJobs();
    }

    this.last_totvert = spline.verts.length;
    this.last_totseg = spline.segments.length;
    this.last_totface = spline.faces.length;
    
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
    this.drawer.do_blur = editor.enable_blur;

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
      this.drawer.recalcAll();

      if (1||DEBUG.trace_recalc_all) {
        console.log("%c RECALC_ALL!  ", "color:orange");
      }
    }
    
    var drawparams = drawparam_cachering.next().init(redraw_rects, actlayer, only_render,
                                                 selectmode, zoom, undefined, off, spline, drawlist);

    let vset = new set();

    for (let seg of spline.segments.visible) {
      if (seg.flag & (SplineFlags.UPDATE|SplineFlags.REDRAW)) {
        vset.add(seg.v1);
        vset.add(seg.v2);
      }
    }

    for (let v of vset) {
      if (v.flag & (SplineFlags.UPDATE|SplineFlags.REDRAW)) {
        this.update_vertex_strokes(v, drawparams);
      }
    }

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
      
      if (e.type === SplineTypes.FACE) {
        this.update_polygon(e, redraw_rects, actlayer, only_render, selectmode, zoom, i, off, spline, ignore_layers);
      } else if (e.type === SplineTypes.SEGMENT) {
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

    for (let v of vset) {
      v.flag &= ~SplineFlags.REDRAW;
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

  update_vertex_strokes(v : SplineVertex, drawparams) {
    if (v.segments.length === 0 || !FANCY_JOINS) {
      return;
    }

    if (!((v.flag & SplineFlags.BREAK_TANGENTS) || v.segments.length > 2)) {
      for (let seg of v.segments) {
        let data = seg.cdata.get_layer(SplineDrawData);
        data.sets(seg, v, v === seg.v1 ? 0.0 : 1.0);
      }

      return;
    }

    let debug = 0;
    let dpath, dpath2, dpath3, dpoint, dline;

    if (debug) {
      dpath = this.get_path(eid | 8192, z+10000);
      dpath2 = this.get_path(eid | 16384 , z+10001);
      dpath3 = this.get_path(eid | 8192 | 16384 , z+10002);

      dpath.color = [1, 0.25, 0.125, 0.5];
      dpath2.color = [0.25, 0.65, 1.0, 0.5];
      dpath3.color = [0.5, 1.0, 0.5, 0.5];

      dpath.reset();
      dpath2.reset();
      dpath3.reset();

      dpoint = (x, y, w=4, dp=dpath) => {
        w *= 0.5;

        dp.moveTo(x-w, y-w);
        dp.lineTo(x-w, y+w);
        dp.lineTo(x+w, y+w);
        dp.lineTo(x+w, y-w);
        dp.lineTo(x-w, y-w);
      }

      dline = (x1, y1, x2, y2, w= 0.5, dp=dpath) => {
        let dx = y1-y2, dy = x2-x1;
        let l = Math.sqrt(dx*dx + dy*dy);
        l = 0.5*w / l;

        dx *= l;
        dy *= l;

        dp.moveTo(x1-dx, y1-dy);
        dp.lineTo(x2-dx, y2-dy);
        dp.lineTo(x2+dx, y2+dy);
        dp.lineTo(x1+dx, y1+dy);
        dp.lineTo(x1-dx, y1-dy);
      }
    }

    let n1 = new Vector2();
    let n2 = new Vector2();
    let t1 = new Vector2();
    let t2 = new Vector2();

    let segments = this._sortSegments(v);

    let testIsect = () => {
      for (let seg1 of segments) {
        let data1 = seg1.cdata.get_layer(SplineDrawData);
        let si1 = segments.indexOf(seg1);
        let s1 = data1.gets(seg1, v);

        for (let seg2 of segments) {
          if (seg1 === seg2) continue;

          let data2 = seg2.cdata.get_layer(SplineDrawData);
          let si2 = segments.indexOf(seg2);
          let s2 = data2.gets(seg2, v);

          for (let i=0; i<2; i++) {
            let p1a = seg1.evaluate(s1);
            let p1b = seg1.evaluateSide(s1, i);
            let cmode = v===seg2.v1 ? ClosestModes.START : ClosestModes.END;
            cmode = ClosestModes.CLOSEST;
            let p = seg2.closest_point(p1b, cmode);

            if (p !== undefined) {
              let lw2b = [0, 0];
              let lw2c = [0, 0];

              let p2b = seg2.evaluateSide(p[1], 0, undefined, n1, lw2b);
              let p2c = seg2.evaluateSide(p[1], 1, undefined, n2, lw2c);

              t1.load(p1b).sub(p[0]);
              let wid;

              //n1 = seg2.derivative(p[1]);
              //let t = n1[0]; n1[0] = -n1[1]; n1[1] = t;
              //n1.negate();

              let dist = t1.vectorLength();

              t1.normalize();
              n1.normalize();

              if (t1.dot(n1) >= 0) {
                wid = lw2b[0]*0.5;
              } else {
                wid = lw2c[0]*0.5;
              }

              if (dist < wid) {
                return true;
              }
            }
          }
          for (let i = 0; i < 8; i++) {
            break;
            let side1 = i % 2, side2 = ~~(i / 2);

            let p1a = seg1.evaluate(s1);
            let p1b = seg1.evaluateSide(s1, side1);

            let p2a = seg2.evaluate(s2);
            let p2b = seg2.evaluateSide(s2, side2);

            if (line_line_cross4(p1a, p1b, p2a, p2b)) {
              return true;
            }
          }
        }
      }

      return false;
    }

    let seglen = 0.0;
    for (let seg of segments) {
      seglen += seg.length;
    }

    seglen /= segments.length;

    let a = 0.0;
    let b = 0.5;
    for (let i=0; i<8; i++) {
      let s = (a + b)*0.5;

      for (let seg of segments) {
        let data = seg.cdata.get_layer(SplineDrawData);
        let s2 = s * seglen / seg.length;
        s2 = Math.min(Math.max(s2, 0.0), 1.0);

        data.sets(seg, v, v === seg.v1 ? s : 1.0-s);
      }

      if (testIsect()) {
        a = (a + b) * 0.5;
      } else {
        b = (a + b) * 0.5;
      }
    }

    let s = (a + b)*0.5;
    s *= 1.2;
    s = Math.min(Math.max(s, 0.0), 1.0);

    for (let seg of segments) {
      let data = seg.cdata.get_layer(SplineDrawData);
      data.sets(seg, v, v === seg.v1 ? s : 1.0 - s);
    }
  }

  _sortSegments(v) {
    let segments = ([]).concat(v.segments);

    segments.sort((a, b) => {
      let dx1 = a.other_vert(v)[0] - v[0];
      let dy1 = a.other_vert(v)[1] - v[1];
      let dx2 = b.other_vert(v)[0] - v[0];
      let dy2 = b.other_vert(v)[1] - v[1];

      return Math.atan2(dy1, dx1) - Math.atan2(dy2, dx2);
    });

    let n1 = new Vector2();
    let n2 = new Vector2();
    let t1 = new Vector2();
    let t2 = new Vector2();
    let sum = 0.0;

    for (let i=0; i<segments.length; i++) {
      let seg1 = segments[i], seg2 = segments[(i+1) % segments.length];

      t1[0] = seg1.other_vert(v)[0] - v[0];
      t1[1] = seg1.other_vert(v)[1] - v[1];
      t2[0] = seg2.other_vert(v)[0] - v[0];
      t2[1] = seg2.other_vert(v)[1] - v[1];

      t1.normalize();
      t2.normalize();

      let th = Math.abs(Math.acos(t1.dot(t2)));
      sum += th;
    }

    let bad_corner = false;

    if (sum < Math.PI*1.99) {
      bad_corner = true;

      if (segments.length > 2) {
        console.log("bad corner");
      }
    }

    segments.bad_corner = bad_corner;

    return segments;
  }

  update_stroke(seg : SplineSegment, drawparams) {
    var redraw_rects = drawparams.redraw_rects, actlayer = drawparams.actlayer;
    var only_render = drawparams.only_render, selectmode = drawparams.selectmode;
    var zoom = drawparams.zoom, z = drawparams.z, off = drawparams.off, spline = drawparams.spline;
    var drawlist = drawparams.drawlist;

    var eid = seg.eid;

    let debug = 0;
    let dpath, dpath2, dpath3, dpoint, dline;

    if (debug) {
      dpath = this.get_path(eid | 8192, z+10000);
      dpath2 = this.get_path(eid | 16384 , z+10001);
      dpath3 = this.get_path(eid | 8192 | 16384 , z+10002);

      dpath.color = [1, 0.25, 0.125, 0.5];
      dpath2.color = [0.25, 0.65, 1.0, 0.5];
      dpath3.color = [0.5, 1.0, 0.5, 0.5];

      dpath.reset();
      dpath2.reset();
      dpath3.reset();

      dpoint = (x, y, w=4, dp=dpath) => {
        w *= 0.5;

        dp.moveTo(x-w, y-w);
        dp.lineTo(x-w, y+w);
        dp.lineTo(x+w, y+w);
        dp.lineTo(x+w, y-w);
        dp.lineTo(x-w, y-w);
      }

      dline = (x1, y1, x2, y2, w= 0.5, dp=dpath) => {
        let dx = y1-y2, dy = x2-x1;
        let l = Math.sqrt(dx*dx + dy*dy);

        if (l === 0.0) {
          return;
        }

        l = 0.5*w / l;

        dx *= l;
        dy *= l;

        dp.moveTo(x1-dx, y1-dy);
        dp.lineTo(x2-dx, y2-dy);
        dp.lineTo(x2+dx, y2+dy);
        dp.lineTo(x1+dx, y1+dy);
        dp.lineTo(x1-dx, y1-dy);
      }
    }


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
    
    if (seg.eid === eid) {
      this.last_stroke_mat = seg.mat;
      this.last_stroke_eid = seg.eid;
      this.last_stroke_stringid = seg.stringid;
    }


    seg.flag &= ~SplineFlags.REDRAW;
    
    var l = seg.ks[KSCALE] * zoom;
    let add = (Math.sqrt(l) / 5);
    var steps = 5 + ~~add;
    
    //console.log("STEPS", "l", l, "add", add, "steps", steps);
    var ds = 1.0 / (steps - 1), s = 0.0;

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
      } while (l !== seg.l);
    }
    
    if (eid === seg.eid) {
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

    let lw = seg.mat.linewidth*0.5;

    var no = seg.normal(0).normalize().mulScalar(lw);
    var co = seg.evaluate(0).add(no);
    var fx=co[0], fy = co[1];
    var lastdv, lastco;
    
    var len = seg.length;

    let stretch = 1.0075;
    let seglen = seg.length;

    let data = seg.cdata.get_layer(SplineDrawData);
    let starts = data.start, ends = data.end;
    let lwout = new Vector2();

    for (let vi=0; vi<2; vi++) {
      let v = vi ? seg.v2 : seg.v1;

      if (!FANCY_JOINS || !((v.flag & SplineFlags.BREAK_TANGENTS) || v.segments.length > 2)) {
        continue;
      }

      let t0 = new Vector2();
      let t1 = new Vector2();
      let t2 = new Vector2();
      let d0a = new Vector2();
      let d1a = new Vector2();
      let d2a = new Vector2();
      let d0b = new Vector2();
      let d1b = new Vector2();
      let d2b = new Vector2();

      let first = true;

      let fx = 0, fy = 0, lx=0, ly=0;
      lx=0;
      ly=0;

      let segments = this._sortSegments(v);
      if (segments.length > 1) {
        let si = segments.indexOf(seg);
        let prev = (si + segments.length - 1) % segments.length;
        let next = (si + 1) % segments.length;

        prev = segments[prev];
        next = segments[next];

        let pdata = prev.cdata.get_layer(SplineDrawData);
        let ndata = next.cdata.get_layer(SplineDrawData);

        let margin = -0.001;

        let s0 = pdata.gets(prev, v, margin);
        let s1 = data.gets(seg, v, margin);
        let s2 = ndata.gets(next, v, margin);

        let pa = prev.evaluateSide(s0, 1, d0a);
        let pb = prev.evaluateSide(s0, 0, d0b);

        let sa = seg.evaluateSide(s1, 0, d1a);
        let sb = seg.evaluateSide(s1, 1, d1b);

        let na = next.evaluateSide(s2, 1, d2a);
        let nb = next.evaluateSide(s2, 0, d2b);

        t0.load(prev.other_vert(v)).sub(v).normalize();
        t1.load(seg.other_vert(v)).sub(v).normalize();
        t2.load(next.other_vert(v)).sub(v).normalize();

        //t0.load(prev.derivative(s0)).mulScalar(v === prev.v1 ? -1.0 : 1.0).normalize();
        //t1.load(seg.derivative(s1)).mulScalar(v === seg.v1 ? -1.0 : 1.0).normalize();
        //t2.load(next.derivative(s2)).mulScalar(v === next.v1 ? -1.0 : 1.0).normalize();

        let th1 = Math.abs(Math.acos(t0.dot(t1)));
        let th2 = Math.abs(Math.acos(t1.dot(t2)));
        let th = th1 + th2;

        sa[2] = sb[2] = pa[2] = pb[2] = na[2] = nb[2] = 0.0;

        let f0 = (prev.v1 === v)
        let f1 = (seg.v1 === v)
        let f2 = (next.v1 === v)

        if (f0) {
          let t = pa;
          pa = pb;
          pb = t;
          t = d0a; d0a = d0b; d0b = t;
          d0a.negate(); d0b.negate();
        }
        if (f1) {
          let t = sa;
          sa = sb;
          sb = t;
          t = d1a; d1a = d1b; d1b = t;
          d1a.negate(); d1b.negate();
        }
        if (f2) {
          let t = na;
          na = nb;
          nb = t;
          t = d2a; d2a = d2b; d2b = t;
          d2a.negate(); d2b.negate();
        }

        if (isNaN(sa.dot(sa))) {
          if (Math.random() > 0.98) {
            console.log("NaN!", sa, seg);
          }
          continue;
          //throw new Error("nan!");
        }

        let sc = seg.evaluate(s1);

        if (segments.length === 2) {
          d0a.add(pa);
          d0b.add(pb);
          d1a.add(sa);
          d1b.add(sb);
          d2a.add(na);
          d2b.add(nb);

          let r = line_isect(pb, d0b, sb, d1b);
          if (r[1] === COLINEAR) {
            r = v;
          } else {
            r = new Vector2(r[0]);
            r.floor();
          }

          let r2 = line_isect(pa, d0a, sa, d1a);
          if (r2[1] === COLINEAR) {
            r2 = v;
          } else {
            r2 = new Vector2(r2[0]);
            r2.floor();
          }

          //*
          path.moveTo(v[0], v[1]);
          path.lineTo(r[0], r[1]);
          path.lineTo(sb[0], sb[1]);
          path.lineTo(sc[0], sc[1]);
          path.lineTo(v[0], v[1]);
          //*/

          path.moveTo(v[0], v[1]);
          path.lineTo(sc[0], sc[1]);
          path.lineTo(sa[0], sa[1]);
          path.lineTo(r2[0], r2[1]);
          path.lineTo(v[0], v[1]);
        } else if (1) {//!segments.bad_corner) {
          pa.interp(sa, 0.5);
          nb.interp(sb, 0.5);

          if (debug) {
            //dline(sa[0], sa[1], pa[0], pa[1], 4);
            //dline(sb[0], sb[1], nb[0], nb[1], 4);
            //dpoint(sb[0], sb[1], 5, dpath3);
          }

          path.moveTo(sa[0], sa[1]);
          path.lineTo(pa[0], pa[1]);
          path.lineTo( v[0],  v[1]);
          path.lineTo(nb[0], nb[1]);
          path.lineTo(sb[0], sb[1]);
          //path.lineTo(sa[0], sa[1]);
        } else if (0) {
          if (segments.bad_corner && debug && th > Math.PI*0.5) {
            dline(v[0], v[1], (sa[0]+sb[0])*0.5, (sa[1]+sb[1])*0.5, 4);
          }

          if (debug) {
            dline(sa[0], sa[1], sb[0], sb[1], 4);
            dpoint(sa[0], sa[1], 10, dpath3);
            dpoint(sb[0], sb[1], 10, dpath2);
          }

          if (1||th > Math.PI*0.5) {
            pa.interp(sa, 0.5);
            nb.interp(sb, 0.5);

            path.lineTo(sa[0], sa[1]);
            if (th1 < Math.PI*0.33333) {
              path.lineTo(pa[0], pa[1]);
            }
            path.lineTo(v[0], v[1]);
            if (th2 < Math.PI*0.33333) {
              path.lineTo(nb[0], nb[1]);
            }
            path.lineTo(sb[0], sb[1]);
          } else {
            path.moveTo(pa[0], pa[1]);
            path.lineTo(v[0], v[1]);
            path.lineTo(nb[0], nb[1]);
            path.lineTo(sb[0], sb[1]);
            path.lineTo(sa[0], sa[1]);
            path.lineTo(pa[0], pa[1]);
          }


          if (!first) {//debug && !isNaN(lx) && !isNaN(ly) && !isNaN(sa[0]) && !isNaN(sa[1])) {
          //  dline(lx, ly, sa[0], sa[1], 2, dpath2);
          } else {
            first = false;
          }

          lx = sa[0];
          ly = sa[1];
        }
      }

      if (segments.bad_corner) {
        //path.lineTo(fx, fy);
      }
    }


    /*
    on factor;
    on rounded;
    off period;

    operator x, y, k, lw;

    forall s let df(x(s), s, 2) = -df(y(s), s)*k(s);
    forall s let df(y(s), s, 2) = df(x(s), s)*k(s);

    offx := x(s) - df(y(s), s)*lw(s)*0.5/seglen;
    offy := y(s) + df(x(s), s)*lw(s)*0.5/seglen;


    df(offx, s);
    df(offy, s);
    */


    let margin = 0.00125;
    starts -= margin;
    ends += margin;

    s = starts;
    ds = (ends-starts) / (steps - 1);

    for (let i=0; i<steps; i++, s += ds) {
      let dv = seg.derivative(s);
      let co = seg.evaluateSide(s, 0,dv, undefined, lwout);

      dv.mulScalar(ds/3.0);

      if (i > 0) {
        path.cubicTo(lastco[0]+lastdv[0], lastco[1]+lastdv[1], co[0]-dv[0], co[1]-dv[1], co[0], co[1], 1);
      } else {
        path.moveTo(co[0], co[1]);
      }
      
      lastdv = dv;
      lastco = co;
    }

    s = ends;
    for (let i=0; i<steps; i++, s -= ds) {
      let dv = seg.derivative(s);
      let co = seg.evaluateSide(s, 1, dv);

      dv.mulScalar(-ds/3.0);

      if (i > 0) {
        path.cubicTo(lastco[0]+lastdv[0], lastco[1]+lastdv[1], co[0]-dv[0], co[1]-dv[1], co[0], co[1], 1);
      } else {
        path.lineTo(co[0], co[1]);
      }

      lastdv = dv;
      lastco = co;
    }

    s = ends;
    for (var i=0; i<steps; i++, s -= ds) {
      break
      let dv = seg.derivative(s*stretch);
      let co = seg.evaluate(s*stretch);
      let k = -seglen*seg.curvature(s*stretch);
      let shift = -seg.shift(s*stretch);
      let dshift = -seg.dshift(s*stretch);
      let lw = seg.width(s*stretch);
      let dlw = seg.dwidth(s*stretch);

      dlw = dlw*shift + dlw + dshift*lw;
      lw = lw + lw*shift;

      lw = -lw;
      dlw = -dlw;

      co[0] += -dv[1]*lw*0.5/seglen;
      co[1] += dv[0]*lw*0.5/seglen;

      let dx = (-0.5*(dlw*dv[1] + dv[0]*k*lw - 2*dv[0]*seglen)) / seglen;
      let dy = ( 0.5*(dlw*dv[0] - dv[1]*k*lw + 2*dv[1]*seglen)) / seglen;
      dv[0] = dx;
      dv[1] = dy;

      dv.mulScalar(ds/3.0);

      if (debug*0) {
        dpoint(co[0], co[1], 9);
        dpoint(co[0]+dv[0], co[1]+dv[1]);

        dline(co[0], co[1], co[0]+dv[0], co[1]+dv[1]);
        if (i > 0) {
          dpoint(lastco[0], lastco[1], 9);
          dpoint(lastco[0]-lastdv[0], lastco[1]-lastdv[1]);

          dline(lastco[0], lastco[1], lastco[0] - lastdv[0], lastco[1] - lastdv[1]);
          dline(co[0] + dv[0], co[1] + dv[1], lastco[0] - lastdv[0], lastco[1] - lastdv[1]);
        }
      }

      if (i > 0) {
        path.cubicTo(lastco[0]-lastdv[0], lastco[1]-lastdv[1], co[0]+dv[0], co[1]+dv[1], co[0], co[1], 1);
      } else {
        path.lineTo(co[0], co[1]);
      }

      lastdv = dv;
      lastco = co;
      /*
      break;
      var dv = seg.derivative(s).normalize();
      var co = seg.evaluate(s*stretch);
      var k = -seg.curvature(s*stretch);

      lw = -seg.width(s)*0.5;

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
      lastco = co;//*/
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
    
    if (layer !== undefined && (layer.flag & SplineLayerFlags.MASK)) {
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
      
      while (i > 0 && layerid !== prev.id) {
        i--;
        for (var k in drawlist[i].layers) {
          layerid = k;
          
          if (layerid === prev.id)
            break;
        }
      }
      
      while (i >= 0 && layerid === prev.id) {
        var item = drawlist[i];
        
        //console.log("TYPE:", item.type, item);
        
        if (item.type === SplineTypes.FACE) {
          var path2 = this.get_path(item.eid, i);
          path.add_clip_path(path2);
        }
        
        i--;
        if (i < 0)
          break;
        
        for (var k in drawlist[i].layers) {
          layerid = k;
          
          if (layerid === prev.id)
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
    { //XXX fixme, path.color wasn't a vector4 but an array, so .load didn't work
      let c1 = path.color;
      let c2 = f.mat.fillcolor;

      if (c2 === undefined) {
        f.mat.fillcolor = c2 = new Vector4([0,0,0,1]);
      }
      if (c1 && c2) {
        c1[0] = c2[0];
        c1[1] = c2[1];
        c1[2] = c2[2];
        c1[3] = c2[3];
      }
    }

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
    return this.drawer.draw(g);
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

window._SplineDrawer = SplineDrawer;
