"use strict";

import {aabb_isect_minmax2d, MinMax, line_isect, line_line_cross4, COLINEAR, LINECROSS} from '../util/mathlib.js';
import {ENABLE_MULTIRES} from '../config/config.js';

import {nstructjs, Vector2} from "../path.ux/scripts/pathux.js";

import * as config from '../config/config.js';
import {ClosestModes} from './spline_base.js';

import * as vectordraw_jobs from '../vectordraw/vectordraw_jobs.js';

import {SessionFlags} from '../editors/viewport/view2d_editor.js';
import {SelMask} from '../editors/viewport/selectmode.js';
import {ORDER, KSCALE, KANGLE, KSTARTX, KSTARTY, KSTARTZ, KTOTKS, INT_STEPS} from './spline_math.js';
import {get_vtime} from '../core/animdata.js';

import {iterpoints, MultiResLayer, MResFlags, has_multires} from './spline_multires.js';

let spline_draw_cache_vs = cachering.fromConstructor(Vector2, 64);
let spline_draw_trans_vs = cachering.fromConstructor(Vector2, 32);

let PI = Math.PI;
let pow = Math.pow, cos = Math.cos, sin = Math.sin, abs = Math.abs, floor = Math.floor,
  ceil = Math.ceil, sqrt = Math.sqrt, log = Math.log, acos = Math.acos, asin = Math.asin;

import {
  SplineFlags, SplineTypes, SplineElement, SplineVertex,
  SplineSegment, SplineLoop, SplineLoopPath, SplineFace,
  RecalcFlags, MaterialFlags
} from './spline_types.js';

import {bez_self_isect4, bez4, d2bez4, dbez4, ibez4, curv4, thbez4} from "../util/bezier.js";

import {ElementArray, SplineLayerFlags} from './spline_element_array.js';

import {
  Canvas, Path, VectorFlags
} from '../vectordraw/vectordraw.js';

import {evillog} from "../core/evillog.js";

import type {VectorDraw, PathBase} from '../vectordraw/vectordraw_base.js';

import type {Material} from './spline_types.js';
import type {Spline} from './spline.js';
import type {SplineLayer} from './spline_element_array.js';
import type {View2DHandler} from '../editors/viewport/view2d.js';
import type {DrawListItem} from './spline_strokegroup.js';
import type {StrokeSide} from './spline_types.js';

/* The barrel picks which backend Canvas/Path pair is live, and callers pass
   whichever one they built (view2d_ops hands over a SimpleCanvasDraw2D), so the
   drawer is typed by the shared base rather than by one implementation. */
type VDCanvas = VectorDraw;
type VDPath = PathBase;



window.FANCY_JOINS = true;

//XXX
//import * as vectordraw from 'vectordraw';
//let VectorDraw = vectordraw.Canvas;

let update_tmps_vs = new cachering(function () {
  return new Vector2();
}, 64);

let update_tmps_mats = new cachering(function () {
  return new Matrix4();
}, 64);

let update_join_vs = cachering.fromConstructor(Vector2, 64);

let draw_face_vs = new cachering(function () {
  return new Vector2();
}, 32);

let MAXCURVELEN = 10000;

/* The per-frame draw state, bundled so the update_* methods can take one
   argument instead of ten.  Recycled through drawparam_cachering below. */
export class DrawParams {
  /* A flat run of x1, y1, x2, y2 quadruples, not a list of rects. */
  redraw_rects! : number[];
  actlayer! : SplineLayer;
  only_render! : boolean;
  selectmode! : number;
  zoom! : number;
  /* The element's index in the drawlist.  NOTE: the two init() calls pass
     undefined for this; the draw loop assigns it per element. */
  z! : number;
  /* Screen-space translation since the last frame. */
  off! : Vector2;
  spline! : Spline;
  drawlist! : DrawListItem[];
  combine_paths! : boolean;

  /* The cachering below is the only construction site and passes nothing, so
     this used to run init() with nine undefined arguments; every field is
     filled in by init() before anything reads it. */
  constructor() {
    this.combine_paths = true;
  }

  init(redraw_rects : number[], actlayer : SplineLayer, only_render : boolean,
       selectmode : number, zoom : number, z : number | undefined, off : Vector2,
       spline : Spline, drawlist : DrawListItem[]) {
    this.redraw_rects = redraw_rects, this.actlayer = actlayer,
      this.only_render = only_render, this.selectmode = selectmode, this.zoom = zoom,
      this.z = z!, this.off = off, this.spline = spline;
    this.drawlist = drawlist;

    this.combine_paths = true;

    return this;
  }
}

let drawparam_cachering = new cachering(function () {
  return new DrawParams();
}, 16);

/* update() and fastDraw() both add the "drawdata" layer before anything
   downstream runs, so every segment has one. */
function drawData(seg : SplineSegment) : SplineDrawData {
  return seg.cdata.get_layer(SplineDrawData)!;
}

import {CustomDataLayer} from "./spline_types.js";

/* Per-segment trim data: where each of the two stroke sides starts and ends
   along the segment, plus optional explicit endpoints for mitred joins.

   `mask` says which of the four sp/ep vectors are in use -- see _getmask(). */
export class SplineDrawData extends CustomDataLayer {
  static STRUCT : string;

  sp1: Vector2
  sp2: Vector2
  ep1: Vector2
  ep2: Vector2
  start1: number
  end1: number
  start2: number
  end2: number;
  mask : number;

  constructor() {
    super();

    this.start1 = 0.0;
    this.end1 = 1.0;
    this.start2 = 0.0;
    this.end2 = 1.0;

    this.sp1 = new Vector2();
    this.sp2 = new Vector2();
    this.ep1 = new Vector2();
    this.ep2 = new Vector2();

    this.mask = 0;
  }

  copy(src : SplineDrawData) {
    //this.start = src.start;
    //this.end = src.end;

    return this;
  }

  start(side : StrokeSide) {
    if (side === undefined) {
      throw new Error("side cannot be undefined");
    }

    return side ? this.start2 : this.start1;
  }

  end(side : StrokeSide) {
    if (side === undefined) {
      throw new Error("side cannot be undefined");
    }

    return side ? this.end2 : this.end1;
  }

  gets(seg : SplineSegment, v : SplineVertex, side : StrokeSide, margin = 0.0) {
    if (!(seg instanceof SplineSegment)) {
      throw new Error("invalid arguments to SplineDrawData.prototype.gets()");
    }

    /* Dead. */
    let s;

    if (v === seg.v1) {
      if (side) {
        return this.start2 - margin;
      } else {
        return this.start1 - margin;
      }
    } else if (v === seg.v2) {
      if (side) {
        return this.end2 + margin;
      } else {
        return this.end1 + margin;
      }
    } else {
      console.warn(v, seg);
      throw new Error("vertex not in segment");
    }
  }

  sets(seg : SplineSegment, v : SplineVertex, side : StrokeSide, s : number) {
    if (v === seg.v1) {
      if (side) {
        this.start2 = s;
      } else {
        this.start1 = s;
      }
    } else if (v === seg.v2) {
      if (side) {
        this.end2 = s;
      } else {
        this.end1 = s;
      }
    } else {
      throw new Error("invalid arguments to SplineDrawData.prototype.sets()");
    }

    return this;
  }

  getp(seg : SplineSegment, v : SplineVertex, side : StrokeSide, dv_out? : Vector2) {
    if (!(this.mask & this._getmask(seg, v, side))) {
      return seg.evaluateSide(this.gets(seg, v, side), side, dv_out);
    }

    if (dv_out) {
      seg.evaluateSide(this.gets(seg, v, side), side, dv_out);
    }

    if (v === seg.v1) {
      if (side) {
        return this.sp2;
      } else {
        return this.sp1;
      }
    } else if (v === seg.v2) {
      if (side) {
        return this.ep2;
      } else {
        return this.ep1;
      }
    } else {
      console.log(v, seg);
      throw new Error("vertex not in segment");
    }
  }

  _getmask(seg : SplineSegment, v : SplineVertex, side : StrokeSide) {
    if (v === seg.v1) {
      if (side) {
        return 1;
      } else {
        return 2;
      }
    } else {
      if (side) {
        return 4;
      } else {
        return 8;
      }
    }
  }

  hasp(seg : SplineSegment, v : SplineVertex, side : StrokeSide) {
    return this.mask & this._getmask(seg, v, side);
  }

  setp(seg : SplineSegment, v : SplineVertex, side : StrokeSide, p : Vector2 | undefined) {
    if (!p) {
      this.mask &= ~this._getmask(seg, v, side);
      return;
    }

    this.mask |= this._getmask(seg, v, side);

    if (v === seg.v1) {
      if (side) {
        this.sp2.load(p);
      } else {
        this.sp1.load(p);
      }
    } else if (v === seg.v2) {
      if (side) {
        this.ep2.load(p);
      } else {
        this.ep1.load(p);
      }
    } else {
      console.log(v, seg);
      throw new Error("vertex not in segment");
    }
  }

  loadSTRUCT(reader : StructReader<this>) {
    /* Handle change of start/end properties to methods: an old file writes
       numbers straight over the two methods, so read them back through an
       untyped view and put the methods back afterwards.  `end` is checked
       here as well; a file with one but not the other never existed. */
    const self : {start : unknown, end : unknown} = this;

    let start = self.start;
    let end = self.end;

    reader(this);
    super.loadSTRUCT(reader);

    if (typeof self.start === "number" && typeof self.end === "number") {
      this.start1 = this.start2 = self.start;
      this.end1 = this.end2 = self.end;
    }

    self.start = start;
    self.end = end;
  }

  static define() {
    return {
      typeName: "drawdata"
    }
  }
}

SplineDrawData.STRUCT = nstructjs.inherit(SplineDrawData, CustomDataLayer) + `
  start1: float;
  end1  : float;
  start2: float;
  end2  : float;
  sp1   : vec2;
  sp2   : vec2;
  ep1   : vec2;
  ep2   : vec2;
  mask  : int;
}
`;

/* Turns a spline's drawlist into vectordraw paths, one path per element, and
   keeps them alive between frames so an unchanged element is never rebuilt.

   `used_paths` is the set of path ids touched this frame; anything in the
   backend's id map that is missing from it gets dropped at the end of
   update(). */
export class SplineDrawer {
  spline : Spline;
  drawer : VDCanvas;
  used_paths : {[id : number] : number};
  recalc_all: boolean;
  last_totvert: number;
  last_totseg: number;
  last_totface: number;
  strokeDebug: boolean | undefined;

  drawlist! : DrawListItem[];
  drawlist_layerids! : (string | undefined)[];
  draw_faces! : boolean;
  do_blur! : boolean;
  only_render! : boolean;
  last_zoom : number | undefined;
  last_selectmode! : number;

  /* Write-only: every one of these is reset to undefined at the top of each
     update() and never read again. */
  last_3_mat : Matrix4 | undefined;
  last_stroke_z : number | undefined;
  last_stroke_eid : number | undefined;
  last_layer_id : string | undefined;
  last_stroke_stringid : string | undefined;
  last_stroke_mat : Material | undefined;

  constructor(spline : Spline, drawer : VDCanvas = new Canvas()) {
    this.strokeDebug = false;
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
    this.last_stroke_z = undefined;
    this.last_stroke_eid = undefined;
    this.last_layer_id = undefined;
    this.last_stroke_stringid = undefined;
  }

  setDrawer(drawer : VDCanvas) {
    this.used_paths = {}

    for (let k in this.drawer.path_idmap) {
      let path = this.drawer.path_idmap[k];

      this.drawer.remove(path);
    }

    this.recalc_all = true;

    this.last_zoom = undefined;
    this.last_3_mat = undefined;
    this.last_stroke_z = undefined;
    this.last_stroke_eid = undefined;
    this.last_layer_id = undefined;
    this.last_stroke_stringid = undefined;

    this.drawer = drawer;
  }

  /* Fills the wedge between a segment's two stroke sides at `v`, so a
     many-valence vertex does not show a gap where the strokes were trimmed
     back. */
  update_vertex_join(seg : SplineSegment, v : SplineVertex, drawparams : DrawParams) {
    let z = drawparams.z;
    let id = seg.eid | (v === seg.v1 ? (1<<17) : (1<<18));
    let id2 = id | (1<<19);

    if (this.has_path(id2, z + 1) && this.has_path(id, z) && !(v.flag & (SplineFlags.REDRAW | SplineFlags.UPDATE))) {
      return;
    }

    let path = this.get_path(id, z);

    let mat = seg.mat;

    path.color.load(mat.strokecolor);
    path.blur = mat.blur;

    path.reset();

    let dv0 = update_join_vs.next().zero();
    let dv1a = update_join_vs.next().zero();
    let dv1b = update_join_vs.next().zero();

    let segments = this._sortSegments(v);
    let si = segments.indexOf(seg);

    let prev = segments[(si + segments.length - 1)%segments.length];
    let next = segments[(si + 1)%segments.length];

    let side0 = prev.v1 === v ? 0 : 1;
    let side1 = seg.v1 === v ? 1 : 0;
    let side2 = next.v1 === v ? 1 : 0;

    let draw0 = drawData(prev);
    let draw1 = drawData(seg);
    let draw2 = drawData(next);

    let s0 = draw0.gets(prev, v, side0);
    let s1 = draw1.gets(seg, v, side1);

    //let p0 = prev.evaluateSide(s0, side0);
    //let p1a = seg.evaluateSide(s1, side1);

    let p0 = draw0.getp(prev, v, side0, dv0);
    let p1a = draw1.getp(seg, v, side1, dv1a);

    let p1b = draw1.getp(seg, v, side1 ^ 1, dv1b);

    let scl = 0.7;
    dv0.mulScalar(v === prev.v1 ? scl : -scl);
    dv1a.mulScalar(v === seg.v1 ? scl : -scl);
    dv1b.mulScalar(v === seg.v1 ? scl : -scl);

    /*
    if (v.segments.length > 2) {
      let th1 = thbez4(p0[0], p0[1], p0[0] + dv0[0], p0[1]+dv0[1], p1a[0]-dv1a[0], p1a[1]-dv1a[1], p1a[0], p1a[1], 0.0);
      let th2 = thbez4(p0[0], p0[1], p0[0] + dv0[0], p0[1]+dv0[1], p1a[0]-dv1a[0], p1a[1]-dv1a[1], p1a[0], p1a[1], 0.9999);

      if (Math.abs(th1 - th2) >= Math.PI*2.0) {
        //console.log("------->", th1.toFixed(3), th2.toFixed(3)); // (th1 - th2).toFixed(4));
        dv0.mulScalar(0.25);
        dv1a.mulScalar(0.25);
      }
    }//*/

    let scale1 = v.vectorDistance(p0)/Math.max(prev.length, 0.00001);
    let scale2 = v.vectorDistance(p1a)/Math.max(seg.length, 0.00001);

    scale1 /= 1.5;
    scale2 /= 1.5;

    dv0.mulScalar(-scale1);
    dv1a.mulScalar(scale2);

    path.moveTo(p0[0], p0[1]);
    path.cubicTo(p0[0] + dv0[0], p0[1] + dv0[1], p1a[0] - dv1a[0], p1a[1] - dv1a[1], p1a[0], p1a[1]);

    path.lineTo(p1b[0], p1b[1]);
    path.lineTo(v[0], v[1]);

    path.noAutoFill();
    path.pushFill();

    let path2 = this.get_path(id | (1<<19), z + 1);

    path2.reset();
    path2.moveTo(p0[0], p0[1]);

    //if (bez_self_isect4(p0[0], p0[1], p0[0] + dv0[0], p0[1]+dv0[1], p1a[0]-dv1a[0], p1a[1]-dv1a[1], p1a[0], p1a[1])) {
    //  dv0.mulScalar(0.25);
    //  dv1a.mulScalar(0.25);
    //}

    let t1 = update_join_vs.next();
    let t2 = update_join_vs.next();
    let t3 = update_join_vs.next();
    let p = update_join_vs.next();

    p[0] = bez4(p0[0], p0[0] + dv0[0], p1a[0] - dv1a[0], p1a[0], 0.5);
    p[1] = bez4(p0[1], p0[1] + dv0[1], p1a[1] - dv1a[1], p1a[1], 0.5);

    t1.load(p0).sub(p);
    t2.load(p1a).sub(p);

    let len1 = t1.vectorLength() + t2.vectorLength();
    let lw2 = seg.mat.linewidth2;

    if (seg.mat.linewidth2 === 0) {
      return;
    }

    t1.normalize();
    t2.normalize();
    let th = Math.acos(t1.dot(t2));

    //let wind = Math.asin(t1[0]*t2[1] - t1[1]*t2[0]);
    //console.log(th.toFixed(2), wind.toFixed(2));

    if (len1*0.25 > lw2 || th > Math.PI*0.2) {
      path2.cubicTo(p0[0] + dv0[0], p0[1] + dv0[1], p1a[0] - dv1a[0], p1a[1] - dv1a[1], p1a[0], p1a[1]);
      path2.pushStroke(mat.strokecolor2, mat.linewidth2);
    } else {
      let x = p[0], y = p[1];
      let dy1 = dbez4(p0[0], p0[0] + dv0[0], p1a[0] - dv1a[0], p1a[0], 0.0);
      let dx1 = -dbez4(p0[1], p0[1] + dv0[1], p1a[1] - dv1a[1], p1a[1], 0.0);
      let dy2 = dbez4(p0[0], p0[0] + dv0[0], p1a[0] - dv1a[0], p1a[0], 1.0);
      let dx2 = -dbez4(p0[1], p0[1] + dv0[1], p1a[1] - dv1a[1], p1a[1], 1.0);

      let l = Math.sqrt(dx1*dx1 + dy1*dy1);
      if (l > 0.0) {
        dx1 /= l;
        dy1 /= l;
      }
      l = Math.sqrt(dx2*dx2 + dy2*dy2);
      if (l > 0.0) {
        dx2 /= l;
        dy2 /= l;
      }

      dx1 *= mat.linewidth2*0.5;
      dy1 *= mat.linewidth2*0.5;
      dx2 *= mat.linewidth2*0.5;
      dy2 *= mat.linewidth2*0.5;

      path2.moveTo(p0[0] + dx1, p0[1] + dy1);
      path2.lineTo(x, y);
      path2.lineTo(p1a[0] + dx2, p1a[1] + dy2);

      //*
      path2.moveTo(p0[0] + dx1, p0[1] + dy1);
      path2.lineTo(p1a[0] + dx2, p1a[1] + dy2);
      path2.lineTo(p1a[0] - dx2, p1a[1] - dy2);
      path2.lineTo(p0[0] - dx1, p0[1] - dy1);
      //*/

      path2.color.load(mat.strokecolor2);
      path2.pushFill();
      //path2.pushStroke(mat.strokecolor2, mat.linewidth2);
    }
    //path2.lineTo(p1a[0], p1a[1]);

  }

  /* The window.DEBUG.fastDrawMode path: centre lines only, no joins, no trims
     and no faces.  `zoom` is overwritten from the matrix on entry, and
     `ignore_layers` is not read. */
  fastDraw(spline : Spline, drawlist : DrawListItem[], drawlist_layerids : (string | undefined)[],
           matrix : Matrix4, redraw_rects : number[], only_render : boolean,
           selectmode : number, master_g : Canvas2D, zoom : number,
           editor : View2DHandler, ignore_layers? : boolean) {
    //console.log("SPLINEDRAW_NEW UPDATE!", drawlist.length);
    if (!spline.segments.cdata.has_layer("drawdata")) {
      spline.segments.cdata.add_layer(SplineDrawData);
    }

    /*
    for (let seg of spline.segments) {
      let data = seg.cdata.get_layer(SplineDrawData);

      data.start1 = data.start2 = 0.0;
      data.end1 = data.end2 = 1.0;
    }*/

    let draw_normals = editor.draw_normals;

    zoom = matrix.$matrix.m11;

    this.used_paths = {};
    this.drawlist = drawlist;
    this.drawlist_layerids = drawlist_layerids;

    let actlayer = spline.layerset.active;

    let do_blur = !!(only_render || editor.enable_blur);
    let draw_faces = !!(only_render || editor.draw_faces);

    let recalc_all : number | boolean = this.recalc_all || this.draw_faces !== draw_faces || this.do_blur !== do_blur;

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
    this.last_stroke_z = undefined;
    this.last_stroke_eid = undefined;
    this.last_layer_id = undefined;
    this.last_stroke_stringid = undefined;

    let drawMatrix = matrix;

    let mat = update_tmps_mats.next();
    mat.load(matrix), matrix = mat;

    let mat2 = update_tmps_mats.next();

    mat2.makeIdentity();
    mat2.translate(0.0, -master_g.height, 0.0);
    //matrix.multiply(mat2);

    mat2.makeIdentity();
    mat2.translate(0.0, master_g.height, 0.0);
    mat2.scale(1.0, -1.0, 1.0);
    matrix.preMultiply(mat2);

    //check if matrix scale or rotation have changed
    this.drawer.do_blur = editor.enable_blur;

    let m1 = matrix.$matrix, m2 = this.drawer.matrix.$matrix;
    let off = update_tmps_vs.next().zero();

    this.recalc_all = false;

    if (m1.m11 !== m2.m11 || m1.m22 !== m2.m22) {
      //recalc_all = true;
    }

    if (!recalc_all) {
      //calculate translation offset
      let a = update_tmps_vs.next().zero(), b = update_tmps_vs.next().zero();
      a.multVecMatrix(this.drawer.matrix);
      b.multVecMatrix(matrix);

      off.load(b).sub(a);
    } else {
      off.zero();
    }


    //update pan.  clear matrice's translation
    let m = matrix.$matrix;
    this.drawer.pan[0] = m.m41;
    this.drawer.pan[1] = m.m42;
    m.m41 = m.m42 = m.m43 = 0;

    this.drawer.set_matrix(drawMatrix); //matrix);

    if (recalc_all) {
      this.drawer.recalcAll();

      if (DEBUG.trace_recalc_all) {
        console.log("%c RECALC_ALL!  ", "color:orange");
      }
    }

    let drawparams = drawparam_cachering.next().init(redraw_rects, actlayer, only_render,
      selectmode, zoom, undefined, off, spline, drawlist);

    let updateflags = (SplineFlags.REDRAW | SplineFlags.UPDATE);

    for (let i = 0; i < drawlist.length; i++) {
      let e = drawlist[i];
      //e.finalz = i;

      let z = drawparams.z = i;
      drawparams.zoom = zoom;
      drawparams.combine_paths = true;

      if (e instanceof SplineStrokeGroup) {
        let redraw = false;
        for (let seg of e.segments) {
          if ((seg.flag & updateflags) || (seg.v1.flag & updateflags) || (seg.v2.flag & updateflags)) {
            redraw = true;
            break;
          }
        }

        /* NOTE: a stroke group has no `eid` -- its own key is `id`, its members'
           eids are in `eids` -- so this lookup always misses and the group is
           always redrawn.  Kept as it runs. */
        if (!redraw && this.has_path(Reflect.get(e, "eid"), z)) {
          continue;
        }

        let path = this.get_path(e.id, z);
        path.reset();

        for (let seg of e.segments) {
          let steps = 5, ds = 1.0/(steps - 1), s = 0.0;

          for (let j = 0; j < steps; j++, s += ds) {
            let co = seg.evaluate(s);

            if (j === 0) {
              path.moveTo(co[0], co[1]);
            } else {
              path.lineTo(co[0], co[1]);
            }
          }

          path.pushStroke();
        }
      } else if (e.type === SplineTypes.FACE) {

      }
    }
  }

  /* Rebuilds every path whose element changed since the last frame.  Vertices
     are trimmed first (update_vertex_strokes), then each drawlist entry is
     stroked or filled, then untouched paths are dropped.

     `zoom` is overwritten from the matrix on entry. */
  update(spline : Spline, drawlist : DrawListItem[], drawlist_layerids : (string | undefined)[],
         matrix : Matrix4, redraw_rects : number[], only_render_flag : number | boolean,
         selectmode : number, master_g : Canvas2D, zoom : number,
         editor : View2DHandler, ignore_layers? : boolean,
         draw_stroke_debug? : boolean) {
    //console.warn("SPLINEDRAW_NEW UPDATE!", drawlist.length);

    /* view2d.only_render is stored as a number and toggled with ^= 1. */
    const only_render = !!only_render_flag;

    this.strokeDebug = draw_stroke_debug;

    if (!spline.segments.cdata.has_layer("drawdata")) {
      spline.segments.cdata.add_layer(SplineDrawData);
    }

    if (window.DEBUG && window.DEBUG.fastDrawMode) {
      /* fastDraw() has no draw_stroke_debug parameter; this used to forward
         `arguments`, which handed it one extra argument to ignore. */
      return this.fastDraw(spline, drawlist, drawlist_layerids, matrix, redraw_rects,
        only_render, selectmode, master_g, zoom, editor, ignore_layers);
    }

    /*
    for (let seg of spline.segments) {
      let data = seg.cdata.get_layer(SplineDrawData);

      data.start1 = data.start2 = 0.0;
      data.end1 = data.end2 = 1.0;
    }*/

    let draw_normals = editor.draw_normals;

    zoom = matrix.$matrix.m11;

    this.used_paths = {};
    this.drawlist = drawlist;
    this.drawlist_layerids = drawlist_layerids;

    let actlayer = spline.layerset.active;

    let do_blur = !!(only_render || editor.enable_blur);
    let draw_faces = !!(only_render || editor.draw_faces);

    let recalc_all : number | boolean = this.recalc_all || this.draw_faces !== draw_faces || this.do_blur !== do_blur;
    recalc_all = recalc_all || (!!only_render !== !!this.only_render && (selectmode & SplineTypes.FACE));
    recalc_all = recalc_all || (selectmode !== this.last_selectmode && ((selectmode | this.last_selectmode) & SplineTypes.FACE));

    recalc_all = recalc_all || spline.verts.length !== this.last_totvert;
    recalc_all = recalc_all || spline.segments.length !== this.last_totseg;
    recalc_all = recalc_all || spline.faces.length !== this.last_totface;


    //console.log("all will redraw?", recalc_all);
    if (recalc_all) {
      //abort all outstanding render threads
      //vectordraw_jobs.manager.cancelAllJobs();
    }

    this.last_totvert = spline.verts.length;
    this.last_totseg = spline.segments.length;
    this.last_totface = spline.faces.length;
    this.last_selectmode = selectmode;

    this.only_render = only_render;
    this.last_zoom = zoom;
    this.draw_faces = draw_faces;
    this.do_blur = do_blur;

    this.last_stroke_mat = undefined;
    this.last_stroke_z = undefined;
    this.last_stroke_eid = undefined;
    this.last_layer_id = undefined;
    this.last_stroke_stringid = undefined;

    let drawMatrix = matrix;

    let mat = update_tmps_mats.next();
    mat.load(matrix), matrix = mat;

    let mat2 = update_tmps_mats.next();

    mat2.makeIdentity();
    mat2.translate(0.0, -master_g.height, 0.0);
    //matrix.multiply(mat2);

    mat2.makeIdentity();
    mat2.translate(0.0, master_g.height, 0.0);
    mat2.scale(1.0, -1.0, 1.0);
    matrix.preMultiply(mat2);

    //check if matrix scale or rotation have changed
    this.drawer.do_blur = editor.enable_blur;

    let m1 = matrix.$matrix, m2 = this.drawer.matrix.$matrix;
    let off = update_tmps_vs.next().zero();

    this.recalc_all = false;

    if (m1.m11 !== m2.m11 || m1.m22 !== m2.m22) {
      //recalc_all = true;
    }

    if (!recalc_all) {
      //calculate translation offset
      let a = update_tmps_vs.next().zero(), b = update_tmps_vs.next().zero();
      a.multVecMatrix(this.drawer.matrix);
      b.multVecMatrix(matrix);

      off.load(b).sub(a);
    } else {
      console.log("RECALC_ALL!");

      off.zero();
    }

    let updateflags = (SplineFlags.REDRAW | SplineFlags.UPDATE);

    //update pan.  clear matrice's translation
    let m = matrix.$matrix;
    this.drawer.pan[0] = m.m41;
    this.drawer.pan[1] = m.m42;
    m.m41 = m.m42 = m.m43 = 0;

    this.drawer.set_matrix(drawMatrix); //matrix);

    let oldcolor = new Vector4();

    if (recalc_all) {
      this.drawer.recalcAll();

      if (DEBUG.trace_recalc_all) {
        console.log("%c RECALC_ALL!  ", "color:orange");
      }
    }

    let drawparams = drawparam_cachering.next().init(redraw_rects, actlayer, only_render,
      selectmode, zoom, undefined, off, spline, drawlist);

    let vset = new set<SplineVertex>();

    for (let e of drawlist) {
      if (e instanceof SplineStrokeGroup) {
        for (let seg of e.segments) {
          if (seg.flag & updateflags) {
            vset.add(seg.v1);
            vset.add(seg.v2);
            seg.v1.flag |= SplineFlags.REDRAW;
            seg.v2.flag |= SplineFlags.REDRAW;
          }
        }
      } else if (e instanceof SplineSegment) {
        const seg = e;

        if (seg.flag & updateflags) {
          vset.add(seg.v1);
          vset.add(seg.v2);
          seg.v1.flag |= SplineFlags.REDRAW;
          seg.v2.flag |= SplineFlags.REDRAW;
        }
      }
    }

    for (let v of vset) {
      if (v.flag & updateflags) {
        this.update_vertex_strokes(v, drawparams);
      }
    }

    for (let i = 0; i < drawlist.length; i++) {
      let e = drawlist[i];
      //e.finalz = i;

      drawparams.z = i;
      drawparams.zoom = zoom;
      drawparams.combine_paths = true;

      if (e instanceof SplineStrokeGroup) {
        let redraw : number | boolean = false;

        for (let seg of e.segments) {
          redraw = redraw || (seg.flag & updateflags);
        }

        this.update_stroke_group(e, drawparams, redraw);

        if (draw_normals) {
          for (let seg of e.segments) {
            this.update_normals(seg, drawparams);
          }
        }

        continue;
      }

      let layerid = this.drawlist_layerids[i];

      let bad : number | boolean = (e.flag & SplineFlags.HIDE);
      bad = bad || ((e.flag & SplineFlags.NO_RENDER) && e.type !== SplineTypes.VERTEX && (selectmode !== e.type || only_render));

      if (bad && e.type === SplineTypes.FACE && this.has_path(e.eid, i)) {
        let path = this.get_path(e.eid, i);
        oldcolor.load(path.color);

        this.update_polygon_color(e, redraw_rects, actlayer, only_render, selectmode, zoom, i, off, spline, ignore_layers);
        if (path.color.vectorDistance(oldcolor) > 0.0001) {
          bad = false;
        }
      }
      if (bad) {
        continue;
      }

      let visible = false;

      for (let k in e.layers) {
        /* for-in hands back the id as a string, and a missing layer throws
           here exactly as it always did. */
        if (!(spline.layerset.get(+k)!.flag & SplineLayerFlags.HIDE)) {
          visible = true;
        }
      }

      if (!visible)
        continue;

      if (recalc_all) {
        e.flag |= SplineFlags.REDRAW;
      }

      if (e.type === SplineTypes.FACE) {
        this.update_polygon(e, redraw_rects, actlayer, only_render, selectmode, zoom, i, off, spline, ignore_layers);
      } else if (e.type === SplineTypes.VERTEX) {
        vset.add(e);

        if (e.segments.length > 2) {
          for (let seg of e.segments) {
            this.update_vertex_join(seg, e, drawparams);
          }
        }
      }

      this.last_layer_id = this.drawlist_layerids[i];
    }

    for (let k in this.drawer.path_idmap) {
      if (!(k in this.used_paths)) {
        let path = this.drawer.path_idmap[k];

        this.drawer.remove(path);
      }
    }

    for (let v of vset) {
      v.flag &= ~SplineFlags.REDRAW;
    }

    for (let e of drawlist) {
      if (e instanceof SplineStrokeGroup) {
        for (let seg of e.segments) {
          seg.flag &= ~SplineFlags.REDRAW;
        }
      } else {
        e.flag &= ~SplineFlags.REDRAW;
      }
    }

    //for (let seg of spline.segments.visible) {
    // seg.flag &= ~SplineFlags.REDRAW;
    //}
  }

  get_path(id : number, z : number, check_z = true) {
    this.used_paths[id] = 1;
    let path : VDPath;

    if (!this.has_path(id, z, check_z)) {
      path = this.drawer.get_path(id, z, check_z);
      path.frame_first = true;
    } else {
      path = this.drawer.get_path(id, z, check_z);
    }

    return path;
  }

  has_path(id : number, z : number, check_z = true) {
    this.used_paths[id] = 1;

    return this.drawer.has_path(id, z, check_z);
  }

  /* Strokes a whole run of segments into one path, walking the run from one
     end to the other and back so the outline closes.  `path2` carries the
     optional second (outline) stroke.

     `redraw` arrives as a bitmask from update(), hence the number. */
  update_stroke_group(g : SplineStrokeGroup, drawparams : DrawParams,
                      redraw : boolean | number) {
    let id2 = g.id | (1<<20);
    let z = drawparams.z;

    /* All six are set together under `if (debug)` and only ever used under it. */
    let dpath! : VDPath, dpath2! : VDPath, dpath3! : VDPath;
    let dpoint! : (x : number, y : number, w? : number, dp? : VDPath) => void;
    let dline! : (x1 : number, y1 : number, x2 : number, y2 : number, w? : number,
                  dp? : VDPath) => void;
    const debug = this.strokeDebug;

    //we put this before the branch below to avoid auto-deleting
    //debug lines
    if (debug) {
      let eid = g.id;

      dpath = this.get_path((eid<<1) | 8192, z + 50000);
      dpath2 = this.get_path((eid<<1) | 16384, z + 50001);
      dpath3 = this.get_path((eid<<1) | 8192 | 16384, z + 60002);

      //this.addClipPathsToStrokeGroup(g, drawparams, dpath);
      //this.addClipPathsToStrokeGroup(g, drawparams, dpath2);
      //this.addClipPathsToStrokeGroup(g, drawparams, dpath3);

      dpath.color = new Vector4([1, 0.5, 0.5, 0.9]);
      dpath2.color = new Vector4([0.25, 0.65, 1.0, 0.9]);
      dpath3.color = new Vector4([0.5, 1.0, 0.5, 0.9]);

      dpoint = (x : number, y : number, w = 4, dp = dpath) => {
        w *= 0.5;

        dp.moveTo(x - w, y - w);
        dp.lineTo(x - w, y + w);
        dp.lineTo(x + w, y + w);
        dp.lineTo(x + w, y - w);
        dp.lineTo(x - w, y - w);
      }

      dline = (x1 : number, y1 : number, x2 : number, y2 : number, w = 0.5,
               dp = dpath) => {
        let dx = y1 - y2, dy = x2 - x1;
        let l = Math.sqrt(dx*dx + dy*dy);
        l = 0.5*w/l;

        dx *= l;
        dy *= l;

        dp.moveTo(x1 - dx, y1 - dy);
        dp.lineTo(x2 - dx, y2 - dy);
        dp.lineTo(x2 + dx, y2 + dy);
        dp.lineTo(x1 + dx, y1 + dy);
        dp.lineTo(x1 - dx, y1 - dy);
      }
    }

    if (this.has_path(id2, z + 1) && this.has_path(g.id, z) && !redraw) {
      return;
    }

    let path = this.get_path(g.id, z);
    path.reset();

    if (debug) {
      dpath.reset();
      dpath2.reset();
      dpath3.reset();
    }

    //double stroke path
    let path2 = this.get_path(id2, z + 1);
    path2.reset();
    path2.noAutoFill();

    if (g.segments.length === 0) {
      if (this.has_path(g.id, z)) {
        this.get_path(g.id, z).reset();
      }

      console.warn("g.segments.length was zero!");
      return;
    }

    let startv : SplineVertex;
    let seg = g.segments[0];
    let seg2 = g.segments[1];

    if (seg2 && seg.v1 !== seg2.v1 && seg.v1 !== seg2.v2) {
      startv = seg.v1;
    } else if (seg2) {
      startv = seg.v2;
    } else {
      startv = seg.v1;
    }

    path.color = seg.mat.strokecolor;
    path.blur = seg.mat.blur;

    let dv2 = new Vector2();

    let lw_dlw = [0, 0, 0];
    let dv = new Vector2();
    let dvs = new Vector2();
    let lastdvs = new Vector2();
    let no = new Vector2();
    let lastp = new Vector2();
    let lastdv = new Vector2();
    let lastno = new Vector2();
    let firstp = new Vector2();
    let v = startv;
    let dobreak = false;

    for (let step = 0; step < 2; step++) {
      let totseg = g.segments.length;
      let segments = g.segments;
      let lastsign = 1;
      let first = true;

      for (let si = 0; si < segments.length; si++) {
        let seg = step ? segments[totseg - si - 1] : segments[si];
        let seglen = seg.length;
        let steps = seglen > 0.0 ? ~~(seglen/55.0 + 0.5) : 0;
        let ddata = drawData(seg);

        let lastseg = si > 0 ? segments[totseg - si - 2] : undefined;
        let flip = lastseg && (seg.v1 === lastseg.v1 || seg.v2 === lastseg.v2);

        /*stroking*/
        steps = Math.min(Math.max(steps, 7), 16);

        let dsign = v === seg.v1 ? 1.0 : -1.0;

        if (lastsign !== dsign) {
          //lastdv.negate();
        }

        //lastsign = dsign;
        let side = (dsign < 0.0);
        let start = ddata.start(side), end = ddata.end(side);

        let ds = dsign*((end - start)/steps);
        let s = dsign < 0.0 ? end : start;

        //make sure we hit endpoints
        if (si === segments.length - 1) {
          steps++;
        }

        /*handle specialy inserted point*/
        if (!v.segments) {
          console.log(v, startv);
          throw new Error();
        }

        let usepoint : number | boolean = (v.segments.length <= 2);
        usepoint = usepoint && (v.flag & SplineFlags.BREAK_TANGENTS);

        if (usepoint) {
          let hasp = ddata.hasp(seg, v, 1);
          let p;

          if (hasp) {
            p = ddata.getp(seg, v, 1);
            dv.load(seg.derivative(s));
          } else {
            let s = ddata.gets(seg, v, side);
            s = Math.min(Math.max(s, 0.0), 1.0);
            p = seg.evaluateSide(s, 1, dv);
          }

          if (debug) {
            dpoint(p[0], p[1], hasp ? 15 : 8);
          }

          dobreak = true;

          if (first) {
            first = false;

            if (!step) {
              firstp.load(p);
              path.moveTo(p[0], p[1]);
              path2.moveTo(p[0], p[1]);
            } else {
              path.lineTo(p[0], p[1]);
              path2.lineTo(p[0], p[1]);
              path2.moveTo(p[0], p[1]);
            }
          } else {
            path.lineTo(p[0], p[1]);
            path2.lineTo(p[0], p[1]);
          }

          if (v.segments.length === 2 && !hasp) {
            let seg2 = v.other_segment(seg);
            let ddata2 = drawData(seg2);

            let s = ddata2.gets(seg2, v, side);
            s = Math.min(Math.max(s, 0.0), 1.0);
            let p2 = seg2.evaluateSide(s, 1, dv2); //v === seg2.v1 ? 0.0 : 1.0, 1);

            dv.mulScalar(1.0/3.0);
            dv2.mulScalar(1.0/3.0);
            //path.cubicTo(p[0]+dv[0], p[1]+dv[1], p2[0]-dv2[0], p2[1]-dv2[1], p2[0], p2[1]);

            path.lineTo(p[0], p[1]);
            path2.lineTo(p[0], p[1]);

            if (debug) {
              dpoint(p2[0], p2[1], 15, dpath3);
            }
          }
        }

        /* Now do curve */
        for (let i = 0; i < steps; i++, s += ds) {
          if (si === segments.length - 1) {
            if (i === 0) {
              s = dsign > 0.0 ? start : end;
            } else if (i === steps - 1) {
              s = dsign < 0.0 ? start : end;
            }
          }

          let p = seg.evaluateSide(s, side, dv, no, lw_dlw);
          dv.mulScalar(dsign);

          let dfac = ds/3.0;
          if (side) {
            dfac *= -1;
            //dv.negate();
          }

          dvs.load(dv).mulScalar(dfac);
          lastdvs.load(lastdv).mulScalar(dfac);

          if (debug) {
            dline(p[0], p[1], p[0] + dvs[0], p[1] + dvs[1]);
            dpoint(p[0] + dvs[0], p[1] + dvs[1]);
          }

          if (first) {
            first = false;

            if (!step) {
              firstp.load(p);
              path.moveTo(p[0], p[1]);
              path2.moveTo(p[0], p[1]);
            } else {
              path.lineTo(p[0], p[1]);
              //path2.lineTo(p[0], p[1]);
              path2.moveTo(p[0], p[1]);
            }
          } else if (dobreak) {
            dobreak = false;
            path.lineTo(p[0], p[1]);
            path2.lineTo(p[0], p[1]);

            lastdvs.zero();
            lastno.zero();
          } else {
            if (debug) {
              dline(lastp[0] + lastdvs[0], lastp[1] + lastdvs[1], p[0] - dvs[0], p[1] - dvs[1], undefined, dpath3);
              dpoint(lastp[0] + lastdvs[0], lastp[1] + lastdvs[1], undefined, dpath3);
            }

            path.cubicTo(lastp[0] + lastdvs[0], lastp[1] + lastdvs[1], p[0] - dvs[0], p[1] - dvs[1], p[0], p[1]);
            path2.cubicTo(lastp[0] + lastdvs[0], lastp[1] + lastdvs[1], p[0] - dvs[0], p[1] - dvs[1], p[0], p[1]);
          }

          //isNaN(p.dot(p)) || isNaN(dvs.dot(dvs)) || isNaN(lastdvs.dot(lastdvs)) || isNaN(lastp.dot(lastp))
          lastdv.load(dv);
          lastno.load(no);
          lastp.load(p);
        }

        if (v !== seg.v1 && v !== seg.v2) {
          /* NOTE: this logged `i`, which is not in scope -- a ReferenceError
             every time the check tripped.  `si` is the loop counter. */
          console.log("eek!", si, seg, step);
        }

        v = seg.other_vert(v);
      }
    }

    let mat = g.segments[0].mat;
    if (mat.linewidth2 > 0) {
      path2.pushStroke(mat.strokecolor2, mat.linewidth2);
    }

    if (debug) {
      dpath.pushStroke(undefined, 2.0);
      dpath2.pushStroke(undefined, 2.0);
      dpath3.pushStroke(undefined, 2.0);

      //this.addClipPathsToStrokeGroup(g, drawparams, dpath);
      //this.addClipPathsToStrokeGroup(g, drawparams, dpath2);
      //this.addClipPathsToStrokeGroup(g, drawparams, dpath3);
    }

    this.addClipPathsToStrokeGroup(g, drawparams, path);

    //path.lineTo(firstp[0], firstp[1]);
  }

  /* Clips the group's stroke against every face it is masked to, so a stroke
     flagged MASK_TO_FACE cannot bleed outside the fill it belongs to. */
  addClipPathsToStrokeGroup(g : SplineStrokeGroup, drawparams : DrawParams,
                            path : VDPath) {
    let fs = new Set<SplineFace>();
    let z = drawparams.z;
    let fz : number;

    for (let seg of g.segments) {
      if (!(seg.flag & SplineFlags.NO_RENDER) && (seg.mat.flag & MaterialFlags.MASK_TO_FACE)) {
        let l = seg.l, _i = 0;

        if (!l) {
          continue;
        }

        fz = seg.finalz;

        do {
          fs.add(l.f);

          /* Is face in front of segment, or not in drawlist (hidden)? */
          if (fz > z) {
            l = l.radial_next;
            continue;
          }

          if (_i++ > 1000) {
            console.trace("Warning: infinite loop!");
            break;
          }
          l = l.radial_next;
        } while (l !== seg.l);
      } else {
        path.reset_clip_paths();
      }

      for (let f of fs) {
        fz = f.finalz;
        let path2 = this.get_path(f.eid, fz);
        path.add_clip_path(path2);
      }
    }

  }

  /* Sets the explicit mitre points at `v` for the two-segment case: where the
     two strokes' outer edges actually cross.  Higher valences fall through to
     the plain trim set by update_vertex_strokes(). */
  update_stroke_points(v : SplineVertex) {
    if (v.segments.length === 2 && !(v.flag & SplineFlags.BREAK_TANGENTS)) {
      return;
    }
    //if (!FANCY_JOINS || !((v.flag & SplineFlags.BREAK_TANGENTS) || v.segments.length > 2)) {
    //  return;
    //}

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

    let fx = 0, fy = 0, lx = 0, ly = 0;
    lx = 0;
    ly = 0;

    let segments = this._sortSegments(v);

    for (let si = 0; si < segments.length; si++) {
      let seg = segments[si];
      let prev = segments[(si + segments.length - 1)%segments.length];
      let next = segments[(si + 1)%segments.length];

      let data = drawData(seg);

      let pdata = drawData(prev);
      let ndata = drawData(next);

      let margin = 0.0; //-0.001;

      let s0a = pdata.gets(prev, v, 0, margin);
      let s0b = pdata.gets(prev, v, 1, margin);

      let s1a = data.gets(seg, v, 0, margin);
      let s1b = data.gets(seg, v, 1, margin);

      let s2a = ndata.gets(next, v, 0, margin);
      let s2b = ndata.gets(next, v, 1, margin);

      let pa = prev.evaluateSide(s0b, 1, d0a);
      let pb = prev.evaluateSide(s0a, 0, d0b);

      let sa = seg.evaluateSide(s1a, 0, d1a);
      let sb = seg.evaluateSide(s1b, 1, d1b);

      let na = next.evaluateSide(s2b, 1, d2a);
      let nb = next.evaluateSide(s2a, 0, d2b);

      t0.load(prev.other_vert(v)).sub(v).normalize();
      t1.load(seg.other_vert(v)).sub(v).normalize();
      t2.load(next.other_vert(v)).sub(v).normalize();

      //t0.load(prev.derivative(s0)).mulScalar(v === prev.v1 ? -1.0 : 1.0).normalize();
      //t1.load(seg.derivative(s1)).mulScalar(v === seg.v1 ? -1.0 : 1.0).normalize();
      //t2.load(next.derivative(s2)).mulScalar(v === next.v1 ? -1.0 : 1.0).normalize();

      let th1 = Math.abs(Math.acos(t0.dot(t1)));
      let th2 = Math.abs(Math.acos(t1.dot(t2)));
      let th = th1 + th2;

      //sa[2] = sb[2] = pa[2] = pb[2] = na[2] = nb[2] = 0.0;

      let f0 = (prev.v1 === v)
      let f1 = (seg.v1 === v)
      let f2 = (next.v1 === v)

      if (f0) {
        let t = pa;
        pa = pb;
        pb = t;
        t = d0a;
        d0a = d0b;
        d0b = t;
        d0a.negate();
        d0b.negate();
      }
      if (f1) {
        let t = sa;
        sa = sb;
        sb = t;
        t = d1a;
        d1a = d1b;
        d1b = t;
        d1a.negate();
        d1b.negate();
      }
      if (f2) {
        let t = na;
        na = nb;
        nb = t;
        t = d2a;
        d2a = d2b;
        d2b = t;
        d2a.negate();
        d2b.negate();
      }

      if (isNaN(sa.dot(sa))) {
        if (Math.random() > 0.98) {
          console.log("NaN!", sa, seg);
        }
        continue;
        //throw new Error("nan!");
      }

      let sc = seg.evaluate(s1a);

      if (segments.length === 2) {
        d0b.normalize();
        d1b.normalize();
        let th1 = Math.acos(d0b.dot(d1b));

        let doIsect1 = Math.abs(th1) > Math.PI*0.3;

        d0a.normalize();
        d1a.normalize();
        let th2 = Math.acos(d0a.dot(d1a));
        let doIsect2 = Math.abs(th2) > Math.PI*0.3;

        doIsect1 = doIsect1 && doIsect2;
        doIsect2 = doIsect1;

        d0a.add(pa);
        d0b.add(pb);
        d1a.add(sa);
        d1b.add(sb);
        d2a.add(na);
        d2b.add(nb);

        /* line_isect() returns a [point, status] pair; what goes into the draw
           data is the point itself, or `v` when the lines are colinear. */
        if (doIsect1) {
          let isect = line_isect(pb, d0b, sb, d1b);
          let r : Vector2;

          if (isect[1] === COLINEAR) {
            r = v;
          } else {
            r = new Vector2(isect[0]);
            r.floor();
          }

          data.setp(seg, v, 1, r);
        } else {
          data.setp(seg, v, 1, undefined);
          data.sets(seg, v, 1, v === seg.v1 ? 0.0 : 1.0);
        }

        if (doIsect2) {
          let isect2 = line_isect(pa, d0a, sa, d1a);
          let r2 : Vector2;

          if (isect2[1] === COLINEAR) {
            r2 = v;
          } else {
            r2 = new Vector2(isect2[0]);
            r2.floor();
          }

          data.setp(seg, v, 0, r2);
        } else {
          data.setp(seg, v, 0, undefined);
          data.sets(seg, v, 0, v === seg.v1 ? 0.0 : 1.0);
        }
      } else if (0) {//!segments.bad_corner) {
        pa.interp(sa, 0.5);
        nb.interp(sb, 0.5);

        /* NOTE: this branch is dead (`else if (0)`) and its body was a
           `if (debug)` around three commented-out calls -- `debug` is not in
           scope here, so it would have thrown a ReferenceError. */
        //if (debug) {
        //dline(sa[0], sa[1], pa[0], pa[1], 4);
        //dline(sb[0], sb[1], nb[0], nb[1], 4);
        //dpoint(sb[0], sb[1], 5, dpath3);
        //}

        data.setp(seg, v, 0, sa);
        data.setp(seg, v, 1, sb);
      } else if (0) {
        data.setp(seg, v, 0, sa);
        data.setp(seg, v, 1, sb);
      } else {
        data.setp(seg, v, 0, undefined);
        data.setp(seg, v, 1, undefined);
      }
    }
  }

  /* Trims every stroke meeting at `v` back far enough that none of them
     overlaps another, by bisecting on the trim distance until the outlines stop
     intersecting, then hands off to update_stroke_points(). */
  update_vertex_strokes(v : SplineVertex, drawparams : DrawParams) {
    if (v.segments.length === 0 || !FANCY_JOINS) {
      return;
    }

    if (!((v.flag & SplineFlags.BREAK_TANGENTS) || v.segments.length > 2)) {
      for (let seg of v.segments) {
        let data = drawData(seg);
        data.sets(seg, v, 0, v === seg.v1 ? 0.0 : 1.0);
        data.sets(seg, v, 1, v === seg.v1 ? 0.0 : 1.0);
      }

      return;
    }

    let startv = v;

    let debug = this.strokeDebug;
    /* All six are set together under `if (debug)` and only ever used under it. */
    let dpath! : VDPath, dpath2! : VDPath, dpath3! : VDPath;
    let dpoint! : (x : number, y : number, w? : number, dp? : VDPath) => void;
    let dline! : (x1 : number, y1 : number, x2 : number, y2 : number, w? : number,
                  dp? : VDPath) => void;

    if (debug) {
      let eid = v.eid;
      let z = 1000.0;

      dpath = this.get_path(eid | 8192, z + 10000);
      dpath2 = this.get_path(eid | 16384, z + 10001);
      dpath3 = this.get_path(eid | 8192 | 16384, z + 10002);

      dpath.color = new Vector4([1, 0.25, 0.125, 0.5]);
      dpath2.color = new Vector4([0.25, 0.65, 1.0, 0.5]);
      dpath3.color = new Vector4([0.5, 1.0, 0.5, 0.5]);

      dpath.reset();
      dpath2.reset();
      dpath3.reset();

      dpoint = (x : number, y : number, w = 4, dp = dpath) => {
        w *= 0.5;

        dp.moveTo(x - w, y - w);
        dp.lineTo(x - w, y + w);
        dp.lineTo(x + w, y + w);
        dp.lineTo(x + w, y - w);
        dp.lineTo(x - w, y - w);
      }

      dline = (x1 : number, y1 : number, x2 : number, y2 : number, w = 0.5,
               dp = dpath) => {
        let dx = y1 - y2, dy = x2 - x1;
        let l = Math.sqrt(dx*dx + dy*dy);
        l = 0.5*w/l;

        dx *= l;
        dy *= l;

        dp.moveTo(x1 - dx, y1 - dy);
        dp.lineTo(x2 - dx, y2 - dy);
        dp.lineTo(x2 + dx, y2 + dy);
        dp.lineTo(x1 + dx, y1 + dy);
        dp.lineTo(x1 - dx, y1 - dy);
      }
    }

    let n1 = new Vector2();
    let n2 = new Vector2();
    let t1 = new Vector2();
    let t2 = new Vector2();

    let segments = this._sortSegments(v);

    let testIsect = () => {
      for (let seg1 of segments) {
        let data1 = drawData(seg1);
        let s1 = data1.gets(seg1, v, 0);

        for (let seg2 of segments) {
          if (seg1 === seg2) continue;

          let data2 = drawData(seg2);
          let s2 = data2.gets(seg2, v, 0);

          for (let i = 0; i < 2; i++) {
            break;
            //let p1a = seg1.evaluate(s1);
            let p1b = seg1.evaluateSide(s1, i);
            let cmode = v === seg2.v1 ? ClosestModes.START : ClosestModes.END;
            cmode = ClosestModes.CLOSEST;
            let p = seg2.closest_point(p1b, cmode);

            if (p !== undefined) {
              let lw2b = [0, 0];
              let lw2c = [0, 0];

              //let p2b = seg2.evaluateSide(p.s, 0, undefined, n1, lw2b);
              //let p2c = seg2.evaluateSide(p.s, 1, undefined, n2, lw2c);

              /* The `break` at the top of this loop makes everything below it
                 unreachable, so the `p !== undefined` test above narrows
                 nothing. */
              t1.load(p1b).sub(p!.co);
              let wid;

              //n1 = seg2.derivative(p.s);
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
            //break;
            let side1 = i%2, side2 = ~~(i/2);

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
    let s = 0.0;

    for (let seg of segments) {
      seglen += seg.length;
    }

    seglen /= segments.length;


    if (0) {
      for (let i = 0; i < segments.length; i++) {
        let seg1 = segments[i], seg2 = segments[(i + 1)%segments.length];

        let ret = seg1.intersect(seg2, 0, 1);
        let s = !ret ? (v === seg1.v1 ? 0.0 : 1.0) : ret.sourceS;

        if (ret) {
          //console.warn("RETRET!", ret);
        }

        let data = drawData(seg1);
        data.sets(seg1, v, 0, s);
        data.sets(seg1, v, 1, s);
      }
    }

    let setSegments = (s : number) => {
      //s = Math.floor(s*8.0)/8.0;
      for (let seg of segments) {
        let data = drawData(seg);
        let s2 = s*seglen/seg.length;
        s2 = Math.min(Math.max(s2, 0.0), 1.0);

        data.sets(seg, v, 0, v === seg.v1 ? s2 : 1.0 - s2);
        data.sets(seg, v, 1, v === seg.v1 ? s2 : 1.0 - s2);
      }
    }

    if (1) {
      let a = 0.0;
      let b = 0.65;
      for (let i = 0; i < 8; i++) {
        let s = (a + b)*0.5;

        setSegments(s);

        if (testIsect()) {
          a = (a + b)*0.5;
        } else {
          b = (a + b)*0.5;
        }
      }

      s = (a + b)*0.5;
      s = Math.min(Math.max(s, 0.0), 1.0);

      setSegments(s);

      let w = 0.0;
      let tot = 0.0;

      for (let seg of segments) {
        let data = drawData(seg);
        let s1 = data.gets(seg, v, 0);
        let w2 = seg.width(s1);

        //w = Math.max(w, w2);
        w += w2*0.1 + seg.mat.linewidth2*1.0;
        tot++;
      }

      if (tot && w && seglen) {
        w /= tot;

        s += w/seglen;
        s = Math.min(Math.max(s, 0.0), 0.5);

        setSegments(s);
      }
    }

    this.update_stroke_points(startv);
  }

  /* `v`'s segments in angular order around it, tagged with whether they span
     less than a full turn (a "bad corner"). */
  _sortSegments(v : SplineVertex) : SortedSegments {
    let segments : SortedSegments = ([] as SplineSegment[]).concat(v.segments);

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

    for (let i = 0; i < segments.length; i++) {
      let seg1 = segments[i], seg2 = segments[(i + 1)%segments.length];

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
        //console.log("bad corner");
      }
    }

    segments.bad_corner = bad_corner;

    return segments;
  }

  update_normals(seg: SplineSegment, drawparams: DrawParams) {
    let eid = seg.eid, z = seg.z;

    let path1 = this.get_path(eid | 8192, z + 10000);
    let path2 = this.get_path(eid | 8192 | (8192<<1), z + 10001);
    let steps = 40;
    let data = drawData(seg);

    path1.reset();

    path1.color[0] = 0.25;
    path1.color[1] = 0.5;
    path1.color[2] = 1.0;
    path1.color[3] = 0.9;

    path2.reset();

    path2.color[0] = 0.85;
    path2.color[1] = 0.5;
    path2.color[2] = 0.25;
    path2.color[3] = 0.9;

    let lwdlw = new Vector2();
    let dv = new Vector2(), lastdv = new Vector2();
    let no = new Vector2(), lastno = new Vector2();

    let wid = 1.5/drawparams.zoom;

    for (let side = 0; side < 2; side++) {
      let starts = data.start(side), ends = data.end(side);
      let ds = (ends - starts)/(steps - 1);

      let s = starts;
      let lastco : Vector2 | undefined = undefined;

      let path = side ? path1 : path2;

      for (let i = 0; i < steps; i++, s += ds) {
        let co = seg.evaluateSide(s, side, dv, no, lwdlw)
        let k = seg.curvatureSide(s, side, no)*(side*2.0 - 1.0);

        no.normalize().mulScalar(17000.0*k);

        if (i > 0) {
          path.makeLine(lastco![0], lastco![1], co[0], co[1], wid + side);
          path.makeLine(co[0], co[1], co[0] + no[0], co[1] + no[1], wid + side);
        }

        lastco = co;
      }
    }
  }

  /* Recolours an already-built face path in place -- selection tint when the
     face is pickable, its own fill colour otherwise. */
  update_polygon_color(f : SplineFace, redraw_rects : number[], actlayer : SplineLayer,
                       only_render : boolean, selectmode : number, zoom : number,
                       z : number, off : Vector2, spline : Spline,
                       ignore_layers? : boolean) {
    if (!this.has_path(f.eid, z)) {
      return;
    }

    let path = this.get_path(f.eid, z);

    function setElemColor() {
      /*if ((selectmode & SelMask.FACE) && f === spline.faces.highlight) {
        path.color[0] = 200/255, path.color[1] = 200/255, path.color[2] = 50/255, path.color[3] = 0.8;
        //g.strokeStyle = "rgba(200, 200, 50, 0.8)";
      } else*/
      if ((selectmode & SelMask.FACE) && f === spline.faces.active) {
        path.color[0] = 200/255, path.color[1] = 80/255, path.color[2] = 50/255, path.color[3] = 0.8;
        //g.strokeStyle = "rgba(200, 80, 50, 0.8)";
      } else if ((selectmode & SelMask.FACE) && (f.flag & SplineFlags.SELECT)) {
        path.color[0] = 250/255, path.color[1] = 140/255, path.color[2] = 50/255, path.color[3] = 0.8;
        //g.strokeStyle = "rgba(250, 140, 50, 0.8)";
      } else {
        path.color[0] = f.mat.fillcolor[0];
        path.color[1] = f.mat.fillcolor[1];
        path.color[2] = f.mat.fillcolor[2];
        path.color[3] = f.mat.fillcolor[3];
      }
    }

    let inlayer = ignore_layers || f.in_layer(actlayer);

    if (!only_render && (selectmode & SelMask.FACE) && inlayer) {
      setElemColor();
    } else {
      if (f.mat.fillcolor === undefined) {
        evillog("DATA CORRUPTION! f.mat.fillcolor was undefined!", f.eid);
        /* NOTE: this also assigned the new colour to `c2`, which is declared
           below -- a temporal-dead-zone ReferenceError every time the branch
           ran.  The `let c2` below reads it straight back. */
        f.mat.fillcolor = new Vector4([0, 0, 0, 1]);
      }

      let c1 = path.color;
      let c2 = f.mat.fillcolor;

      if (c1 && c2) {
        c1[0] = c2[0];
        c1[1] = c2[1];
        c1[2] = c2[2];
        c1[3] = c2[3];
      }
    }
  }

  /* Builds the face's outline as a cubic path, one bezier per sample of each
     boundary segment, then colours it. */
  update_polygon(f : SplineFace, redraw_rects : number[], actlayer : SplineLayer,
                 only_render : boolean, selectmode : number, zoom : number,
                 z : number, off : Vector2, spline : Spline,
                 ignore_layers? : boolean) {
    let path : VDPath;

    if (this.has_path(f.eid, z) && !(f.flag & SplineFlags.REDRAW)) {
      path = this.get_path(f.eid, z);

      let c2 = f.mat.fillcolor;

      this.update_polygon_color(f, redraw_rects, actlayer, only_render, selectmode,
        zoom, z, off, spline, ignore_layers);
      return;
    }

    f.flag &= ~SplineFlags.REDRAW;
    path = this.get_path(f.eid, z);
    path.was_updated = true;

    path.hidden = !this.draw_faces;

    path.reset();
    path.blur = f.mat.blur*(this.do_blur ? 1 : 0);

    //g.lineWidth = 8;//*zoom;

    //if (!do_mask) {
    //  g.beginPath();
    //}

    //if (!(f.flag & SplineFlags.DRAW_TEMP))
    //  return;
    let lastco = draw_face_vs.next().zero();
    let lastdv = draw_face_vs.next().zero();

    for (let path2 of f.paths) {
      let first = true;

      for (let l of path2) {
        let seg = l.s;

        let flip = seg.v1 !== l.v ? -1.0 : 1.0;

        let length = Math.min(seg.ks[KSCALE], MAXCURVELEN);
        let steps = 6, s = flip < 0.0 ? 1.0 : 0.0;

        let ds = (1.0/(steps - 1))*flip;

        for (let i = 0; i < steps; i++, s += ds) {
          let co = seg.evaluate(s*0.9998 + 0.00001);
          let dv = seg.derivative(s*0.9998 + 0.00001);
          let k = seg.curvature(s*0.9998 + 0.00001);

          dv.mulScalar(ds/3.0);

          if (first) {
            first = false;
            path.moveTo(co[0], co[1]);
          } else {
            //*
            if (i === 0 || abs(k) < 0.00001/zoom) {
              path.lineTo(co[0], co[1]);
            } else {
              let midx = (lastco[0] + lastdv[0] + co[0] - dv[0])*0.5;
              let midy = (lastco[1] + lastdv[1] + co[1] - dv[1])*0.5;

              path.cubicTo(lastco[0] + lastdv[0], lastco[1] + lastdv[1],
                co[0] - dv[0], co[1] - dv[1],
                co[0], co[1], 1);
              //path.bezierTo( midx, midy, co[0], co[1]);
            }
          }

          lastco.load(co);
          lastdv.load(dv);
        }
      }
    }

    this.update_polygon_color(f, redraw_rects, actlayer, only_render, selectmode,
      zoom, z, off, spline, ignore_layers);

    return path;
  }

  draw(g : Canvas2D) {
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

        for (let path of this.paths) {
          if (path.hidden) {
            continue; //XXX eek!
          }
          path.draw(this);
        }*/
  }
}

/* _sortSegments() tags its result; the array never leaves this file. */
interface SortedSegments extends Array<SplineSegment> {
  bad_corner? : boolean;
}

window._SplineDrawer = SplineDrawer;

import {SplineStrokeGroup} from './spline_strokegroup.js';
