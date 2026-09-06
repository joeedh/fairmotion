"use strict";

import { ENABLE_MULTIRES } from "../config/config.js";

import { nstructjs, Vector2 } from "../path.ux/scripts/pathux.js";

import * as config from "../config/config.js";

import * as vectordraw_jobs from "../vectordraw/vectordraw_jobs.js";

import { SessionFlags } from "../editors/viewport/view2d_editor.js";
import { SelMask } from "../editors/viewport/selectmode.js";
import {
  ORDER,
  KSCALE,
  KANGLE,
  KSTARTX,
  KSTARTY,
  KSTARTZ,
  KTOTKS,
  INT_STEPS,
} from "./spline_math.js";
import { get_vtime } from "../core/animdata.js";

import { iterpoints, MultiResLayer, MResFlags, has_multires } from "./spline_multires.js";

let spline_draw_cache_vs = cachering.fromConstructor(Vector2, 64);
let spline_draw_trans_vs = cachering.fromConstructor(Vector2, 32);

let PI = Math.PI;
let pow = Math.pow,
  cos = Math.cos,
  sin = Math.sin,
  abs = Math.abs,
  floor = Math.floor,
  ceil = Math.ceil,
  sqrt = Math.sqrt,
  log = Math.log,
  acos = Math.acos,
  asin = Math.asin;

import {
  SplineFlags,
  SplineTypes,
  SplineElement,
  SplineVertex,
  SplineSegment,
  SplineLoop,
  SplineLoopPath,
  SplineFace,
  RecalcFlags,
  MaterialFlags,
} from "./spline_types.js";

import { ElementArray, SplineLayerFlags } from "./spline_element_array.js";

import { Canvas, Path, VectorFlags } from "../vectordraw/vectordraw.js";

import { evillog } from "../core/evillog.js";

import type { VectorDraw, PathBase } from "../vectordraw/vectordraw_base.js";

import type { Spline } from "./spline.js";
import type { SplineLayer } from "./spline_element_array.js";
import type { View2DHandler } from "../editors/viewport/view2d.js";
import type { DrawListItem } from "./spline_strokegroup.js";

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

let draw_face_vs = new cachering(function () {
  return new Vector2();
}, 32);

let MAXCURVELEN = 10000;

/* The per-frame draw state, bundled so the update_* methods can take one
   argument instead of ten.  Recycled through drawparam_cachering below. */
export class DrawParams {
  /* A flat run of x1, y1, x2, y2 quadruples, not a list of rects. */
  redraw_rects!: number[];
  actlayer!: SplineLayer;
  only_render!: boolean;
  selectmode!: number;
  zoom!: number;
  /* The element's index in the drawlist.  NOTE: the two init() calls pass
     undefined for this; the draw loop assigns it per element. */
  z!: number;
  /* Screen-space translation since the last frame. */
  off!: Vector2;
  spline!: Spline;
  drawlist!: DrawListItem[];
  combine_paths!: boolean;
  /* Only the face colouring reads it. */
  ignore_layers!: boolean;

  /* The cachering below is the only construction site and passes nothing, so
     this used to run init() with nine undefined arguments; every field is
     filled in by init() before anything reads it. */
  constructor() {
    this.combine_paths = true;
  }

  init(
    redraw_rects: number[],
    actlayer: SplineLayer,
    only_render: boolean,
    selectmode: number,
    zoom: number,
    z: number | undefined,
    off: Vector2,
    spline: Spline,
    drawlist: DrawListItem[],
    ignore_layers?: boolean
  ) {
    (this.redraw_rects = redraw_rects),
      (this.actlayer = actlayer),
      (this.only_render = only_render),
      (this.selectmode = selectmode),
      (this.zoom = zoom),
      (this.z = z!),
      (this.off = off),
      (this.spline = spline);
    this.drawlist = drawlist;
    this.ignore_layers = !!ignore_layers;

    this.combine_paths = true;

    return this;
  }
}

let drawparam_cachering = new cachering(function () {
  return new DrawParams();
}, 16);

import { CustomDataLayer } from "./spline_types.js";
import { beginWidthChains, endWidthChains } from "./width_chain.js";
import { TrimState, trimState } from "./trim_state.js";
import { NO_SLOT, StrokeScene, strokeScene } from "./stroke_scene.js";
import { NO_PATH, PathRole, pathKey } from "./path_key.js";
import { OutCmd, OutFinish, OUTLINE_I, OutlineBuffer, OutlineI } from "./outline_buffer.js";
import { wasmStrokeGroup, wasmStrokeJoin, wasmTrimVertex } from "./stroke_wasm.js";
import { strokeGroup, strokeJoin } from "./stroker.js";
import { trimVertex } from "./trimmer.js";

/* Replays one of the stroker's outlines onto a retained path.  The buffer holds
   the same commands the path takes, so this is a copy and nothing more; it is
   the only place that knows both sides of the boundary. */
function playOutline(out: OutlineBuffer, i: number, path: VDPath) {
  const o = i * OUTLINE_I;
  const cmd1 = out.outlines[o + OutlineI.CMD1];
  const pts = out.pts;

  let p = out.outlines[o + OutlineI.PT0];

  for (let c = out.outlines[o + OutlineI.CMD0]; c < cmd1; c++) {
    switch (out.cmds[c]) {
      case OutCmd.MOVE:
        path.moveTo(pts[p], pts[p + 1]);
        p += 2;
        break;
      case OutCmd.LINE:
        path.lineTo(pts[p], pts[p + 1]);
        p += 2;
        break;
      case OutCmd.CUBIC:
        path.cubicTo(pts[p], pts[p + 1], pts[p + 2], pts[p + 3], pts[p + 4], pts[p + 5]);
        p += 6;
        break;
    }
  }
}

/* Where a segment's two stroke sides start and end, plus optional explicit
   endpoints for mitred joins.

   Dead as of stage 3 of the draw refactor: trim_state.ts owns this now and
   nothing reads a loaded instance.  The class stays registered so old files
   still parse, and Spline.afterSTRUCT() drops the layer once they have --
   see docs/plans/draw-refactor-plan-final-notes.md P4. */
export class SplineDrawData extends CustomDataLayer {
  static STRUCT: string;

  sp1: Vector2;
  sp2: Vector2;
  ep1: Vector2;
  ep2: Vector2;
  start1: number;
  end1: number;
  start2: number;
  end2: number;
  mask: number;

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

  static define() {
    return {
      typeName: "drawdata",
    };
  }
}

SplineDrawData.STRUCT =
  nstructjs.inherit(SplineDrawData, CustomDataLayer) +
  `
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
  spline: Spline;
  drawer: VDCanvas;
  used_paths: { [id: number]: number };
  recalc_all: boolean;
  last_totvert: number;
  last_totseg: number;
  last_totface: number;
  strokeDebug: boolean | undefined;

  /* Reseated at the top of every update() to the state of the spline being
     drawn; see trim_state.ts. */
  trims = new TrimState();

  /* Likewise, but persistent across passes: the flat scene the stroker reads.
     See stroke_scene.ts. */
  scene = new StrokeScene();

  /* What it writes back, reused group by group; nothing outlives the playback
     loop that copies it onto paths. */
  outlines = new OutlineBuffer();

  drawlist!: DrawListItem[];
  drawlist_layerids!: (string | undefined)[];
  draw_faces!: boolean;
  do_blur!: boolean;
  only_render!: boolean;
  last_selectmode!: number;

  constructor(spline: Spline, drawer: VDCanvas = new Canvas()) {
    this.strokeDebug = false;
    this.spline = spline;
    this.used_paths = {};
    this.recalc_all = false;
    //this.path_minmaxes = {};

    this.drawer = drawer;

    this.last_totvert = 0;
    this.last_totseg = 0;
    this.last_totface = 0;
  }

  setDrawer(drawer: VDCanvas) {
    this.used_paths = {};

    for (let k in this.drawer.path_idmap) {
      let path = this.drawer.path_idmap[k];

      this.drawer.remove(path);
    }

    this.recalc_all = true;

    this.drawer = drawer;
  }

  /* Fills the wedge between a segment's two stroke sides at `v`, so a
     many-valence vertex does not show a gap where the strokes were trimmed
     back.  The geometry is strokeJoin(); what is here is the assembly around
     it -- the retained paths, their colours, and the dirty check that skips
     both when nothing at `v` moved. */
  update_vertex_join(seg: SplineSegment, v: SplineVertex, drawparams: DrawParams) {
    let z = drawparams.z;
    let atV1 = v === seg.v1;
    let id = pathKey(seg.eid, atV1 ? PathRole.JOIN_V1 : PathRole.JOIN_V2);
    let id2 = pathKey(seg.eid, atV1 ? PathRole.JOIN_V1_DOUBLE : PathRole.JOIN_V2_DOUBLE);

    if (
      this.has_path(id2, z + 1) &&
      this.has_path(id, z) &&
      !(v.flag & (SplineFlags.REDRAW | SplineFlags.UPDATE))
    ) {
      return;
    }

    const si = this.scene.segSlot(seg.eid);
    const vi = this.scene.vertSlot(v.eid);

    if (si === NO_SLOT || vi === NO_SLOT) {
      console.warn("join is not in the scene", seg.eid, v.eid);
      return;
    }

    let mat = seg.mat;

    let path = this.get_path(id, z);

    path.color.load(mat.strokecolor);
    path.blur = mat.blur;
    path.reset();

    let path2 = this.get_path(id2, z + 1);

    path2.reset();

    /* Wasm where it can, and the JS stroker as the reference implementation
       where it cannot; see stroke_wasm.ts for what "cannot" covers. */
    const out =
      wasmStrokeJoin(this.scene, this.trims, si, vi, this.outlines) ??
      strokeJoin(this.scene, this.trims, si, vi, this.outlines.reset()).finish();

    for (let i = 0; i < out.count; i++) {
      const role = out.role(i);
      const dbl = role === PathRole.JOIN_V1_DOUBLE || role === PathRole.JOIN_V2_DOUBLE;
      const dest = dbl ? path2 : path;

      playOutline(out, i, dest);

      /* Which colour a fill takes follows from the role; only the double
         stroke ever asks for a stroke, and it brings its own width. */
      switch (out.finishOf(i)) {
        case OutFinish.FILL:
          if (dbl) {
            dest.color.load(mat.strokecolor2);
          } else {
            dest.noAutoFill();
          }

          dest.pushFill();
          break;
        case OutFinish.STROKE:
          dest.pushStroke(mat.strokecolor2, mat.linewidth2);
          break;
      }
    }
  }

  /* Everything both passes do before they touch a path: fold the y-flip into
     the draw matrix, extract the pan out of it, and measure how far the view
     moved since the last frame.  updateIntern() and fastDraw() ran identical
     copies of this; what they decide differently is `recalc_all`, so that
     comes in already computed.  Returns the pan delta.

     Dropped along the way: both copies took `matrix.$matrix` and the drawer's
     into `m1`/`m2` for an `if` whose body is entirely commented out. */
  beginPass(
    matrix: Matrix4,
    master_g: Canvas2D,
    editor: View2DHandler,
    recalc_all: boolean | number
  ): Vector2 {
    let drawMatrix = matrix;

    let mat = update_tmps_mats.next();
    mat.load(matrix), (matrix = mat);

    let mat2 = update_tmps_mats.next();

    mat2.makeIdentity();
    mat2.translate(0.0, -master_g.height, 0.0);
    //matrix.multiply(mat2);

    mat2.makeIdentity();
    mat2.translate(0.0, master_g.height, 0.0);
    mat2.scale(1.0, -1.0, 1.0);
    matrix.preMultiply(mat2);

    this.drawer.do_blur = editor.enable_blur;

    let off = update_tmps_vs.next().zero();

    this.recalc_all = false;

    if (!recalc_all) {
      //calculate translation offset
      let a = update_tmps_vs.next().zero(),
        b = update_tmps_vs.next().zero();
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

    return off;
  }

  /* The window.DEBUG.fastDrawMode path: centre lines only, no joins, no trims
     and no faces.  `ignore_layers` is not read. */
  fastDraw(
    spline: Spline,
    drawlist: DrawListItem[],
    drawlist_layerids: (string | undefined)[],
    matrix: Matrix4,
    redraw_rects: number[],
    only_render: boolean,
    selectmode: number,
    master_g: Canvas2D,
    editor: View2DHandler,
    ignore_layers?: boolean
  ) {
    //console.log("SPLINEDRAW_NEW UPDATE!", drawlist.length);
    const zoom = matrix.$matrix.m11;

    this.used_paths = {};
    this.drawlist = drawlist;
    this.drawlist_layerids = drawlist_layerids;

    let actlayer = spline.layerset.active;

    let do_blur = !!(only_render || editor.enable_blur);
    let draw_faces = !!(only_render || editor.draw_faces);

    let recalc_all: number | boolean =
      this.recalc_all || this.draw_faces !== draw_faces || this.do_blur !== do_blur;

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

    this.draw_faces = draw_faces;
    this.do_blur = do_blur;

    const off = this.beginPass(matrix, master_g, editor, recalc_all);

    let drawparams = drawparam_cachering
      .next()
      .init(
        redraw_rects,
        actlayer,
        only_render,
        selectmode,
        zoom,
        undefined,
        off,
        spline,
        drawlist,
        ignore_layers
      );

    let updateflags = SplineFlags.REDRAW | SplineFlags.UPDATE;

    for (let i = 0; i < drawlist.length; i++) {
      let e = drawlist[i];
      //e.finalz = i;

      let z = (drawparams.z = i);
      drawparams.zoom = zoom;
      drawparams.combine_paths = true;

      if (e instanceof SplineStrokeGroup) {
        let redraw = false;
        for (let seg of e.segments) {
          if (seg.flag & updateflags || seg.v1.flag & updateflags || seg.v2.flag & updateflags) {
            redraw = true;
            break;
          }
        }

        /* NOTE: a stroke group has no `eid` -- its own key is `id`, its members'
           eids are in `eids` -- so this lookup always misses and the group is
           always redrawn.  Kept as it runs. */
        if (!redraw && this.has_path(NO_PATH, z)) {
          continue;
        }

        let path = this.get_path(pathKey(e.id, PathRole.ELEMENT), z);
        path.reset();

        for (let seg of e.segments) {
          let steps = 5,
            ds = 1.0 / (steps - 1),
            s = 0.0;

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

     The width nets live exactly as long as one update pass -- everything
     inside reads them, everything outside falls back to walking the chain --
     so the pair has to survive an exception escaping the body. */
  update(
    spline: Spline,
    drawlist: DrawListItem[],
    drawlist_layerids: (string | undefined)[],
    matrix: Matrix4,
    redraw_rects: number[],
    only_render_flag: number | boolean,
    selectmode: number,
    master_g: Canvas2D,
    editor: View2DHandler,
    ignore_layers?: boolean,
    draw_stroke_debug?: boolean
  ) {
    this.trims = trimState(spline);
    this.trims.begin(spline);

    beginWidthChains(spline);

    /* Extract, in the four-stage sense: the flat view of the spline the stroker
       reads.  Patched here so it is current for the whole pass, and inside the
       chain set so a topology rebuild borrows it. */
    this.scene = strokeScene(spline).begin(spline, this.trims);

    try {
      return this.updateIntern(
        spline,
        drawlist,
        drawlist_layerids,
        matrix,
        redraw_rects,
        only_render_flag,
        selectmode,
        master_g,
        editor,
        ignore_layers,
        draw_stroke_debug
      );
    } finally {
      endWidthChains();
    }
  }

  updateIntern(
    spline: Spline,
    drawlist: DrawListItem[],
    drawlist_layerids: (string | undefined)[],
    matrix: Matrix4,
    redraw_rects: number[],
    only_render_flag: number | boolean,
    selectmode: number,
    master_g: Canvas2D,
    editor: View2DHandler,
    ignore_layers?: boolean,
    draw_stroke_debug?: boolean
  ) {
    //console.warn("SPLINEDRAW_NEW UPDATE!", drawlist.length);

    /* view2d.only_render is stored as a number and toggled with ^= 1. */
    const only_render = !!only_render_flag;

    this.strokeDebug = draw_stroke_debug;

    if (window.DEBUG && window.DEBUG.fastDrawMode) {
      /* fastDraw() has no draw_stroke_debug parameter; this used to forward
         `arguments`, which handed it one extra argument to ignore. */
      return this.fastDraw(
        spline,
        drawlist,
        drawlist_layerids,
        matrix,
        redraw_rects,
        only_render,
        selectmode,
        master_g,
        editor,
        ignore_layers
      );
    }

    let draw_normals = editor.draw_normals;

    const zoom = matrix.$matrix.m11;

    this.used_paths = {};
    this.drawlist = drawlist;
    this.drawlist_layerids = drawlist_layerids;

    let actlayer = spline.layerset.active;

    let do_blur = !!(only_render || editor.enable_blur);
    let draw_faces = !!(only_render || editor.draw_faces);

    let recalc_all: number | boolean =
      this.recalc_all || this.draw_faces !== draw_faces || this.do_blur !== do_blur;
    recalc_all =
      recalc_all || (!!only_render !== !!this.only_render && selectmode & SplineTypes.FACE);
    recalc_all =
      recalc_all ||
      (selectmode !== this.last_selectmode &&
        (selectmode | this.last_selectmode) & SplineTypes.FACE);

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
    this.draw_faces = draw_faces;
    this.do_blur = do_blur;

    if (recalc_all) {
      console.log("RECALC_ALL!");
    }

    const off = this.beginPass(matrix, master_g, editor, recalc_all);

    let updateflags = SplineFlags.REDRAW | SplineFlags.UPDATE;
    let oldcolor = new Vector4();

    let drawparams = drawparam_cachering
      .next()
      .init(
        redraw_rects,
        actlayer,
        only_render,
        selectmode,
        zoom,
        undefined,
        off,
        spline,
        drawlist,
        ignore_layers
      );

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
        let redraw: number | boolean = false;

        for (let seg of e.segments) {
          redraw = redraw || seg.flag & updateflags;
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

      let bad: number | boolean = e.flag & SplineFlags.HIDE;
      bad =
        bad ||
        (e.flag & SplineFlags.NO_RENDER &&
          e.type !== SplineTypes.VERTEX &&
          (selectmode !== e.type || only_render));

      if (
        bad &&
        e.type === SplineTypes.FACE &&
        this.has_path(pathKey(e.eid, PathRole.ELEMENT), i)
      ) {
        let path = this.get_path(pathKey(e.eid, PathRole.ELEMENT), i);
        oldcolor.load(path.color);

        this.update_polygon_color(e, drawparams);

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

      if (!visible) continue;

      if (recalc_all) {
        e.flag |= SplineFlags.REDRAW;
      }

      if (e.type === SplineTypes.FACE) {
        this.update_polygon(e, drawparams);
      } else if (e.type === SplineTypes.VERTEX) {
        vset.add(e);

        if (e.segments.length > 2) {
          for (let seg of e.segments) {
            this.update_vertex_join(seg, e, drawparams);
          }
        }
      }
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

  get_path(id: number, z: number, check_z = true) {
    this.used_paths[id] = 1;
    let path: VDPath;

    if (!this.has_path(id, z, check_z)) {
      path = this.drawer.get_path(id, z, check_z);
      path.frame_first = true;
    } else {
      path = this.drawer.get_path(id, z, check_z);
    }

    return path;
  }

  has_path(id: number, z: number, check_z = true) {
    this.used_paths[id] = 1;

    return this.drawer.has_path(id, z, check_z);
  }

  /* Strokes a whole run of segments into one path, walking the run from one
     end to the other and back so the outline closes.  `path2` carries the
     optional second (outline) stroke.

     The geometry is stroker.ts's; what is left here is assembly -- find the
     group in the scene, hand it over, and map the outlines that come back onto
     retained paths, with the styles and the clipping the backend needs.

     `redraw` arrives as a bitmask from update(), hence the number. */
  update_stroke_group(g: SplineStrokeGroup, drawparams: DrawParams, redraw: boolean | number) {
    let id2 = pathKey(g.id, PathRole.DOUBLE_STROKE);
    let id1 = pathKey(g.id, PathRole.ELEMENT);
    let z = drawparams.z;

    /* All three are set together under `if (debug)` and only ever used under it. */
    let dpath!: VDPath, dpath2!: VDPath, dpath3!: VDPath;
    const debug = this.strokeDebug;

    //we put this before the branch below to avoid auto-deleting
    //debug lines
    if (debug) {
      let eid = g.id;

      dpath = this.get_path(pathKey(eid, PathRole.DEBUG_1), z + 50000);
      dpath2 = this.get_path(pathKey(eid, PathRole.DEBUG_2), z + 50001);
      dpath3 = this.get_path(pathKey(eid, PathRole.DEBUG_3), z + 60002);

      //this.addClipPathsToStrokeGroup(g, drawparams, dpath);
      //this.addClipPathsToStrokeGroup(g, drawparams, dpath2);
      //this.addClipPathsToStrokeGroup(g, drawparams, dpath3);

      dpath.color = new Vector4([1, 0.5, 0.5, 0.9]);
      dpath2.color = new Vector4([0.25, 0.65, 1.0, 0.9]);
      dpath3.color = new Vector4([0.5, 1.0, 0.5, 0.9]);
    }

    if (this.has_path(id2, z + 1) && this.has_path(id1, z) && !redraw) {
      return;
    }

    let path = this.get_path(id1, z);
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
      if (this.has_path(id1, z)) {
        this.get_path(id1, z).reset();
      }

      console.warn("g.segments.length was zero!");
      return;
    }

    let seg = g.segments[0];

    path.color = seg.mat.strokecolor;
    path.blur = seg.mat.blur;

    const gi = this.scene.groupMap.get(g.id);

    if (gi === undefined) {
      console.warn("stroke group is not in the scene", g.id);
      return;
    }

    const out =
      wasmStrokeGroup(this.scene, this.trims, gi, !!debug, this.outlines) ??
      strokeGroup(this.scene, this.trims, gi, !!debug, this.outlines.reset()).finish();

    for (let i = 0; i < out.count; i++) {
      let dest: VDPath | undefined;

      switch (out.role(i)) {
        case PathRole.ELEMENT:
          dest = path;
          break;
        case PathRole.DOUBLE_STROKE:
          dest = path2;
          break;
        case PathRole.DEBUG_1:
          dest = dpath;
          break;
        case PathRole.DEBUG_2:
          dest = dpath2;
          break;
        case PathRole.DEBUG_3:
          dest = dpath3;
          break;
      }

      if (dest) {
        playOutline(out, i, dest);
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
  }

  /* Clips the group's stroke against every face it is masked to, so a stroke
     flagged MASK_TO_FACE cannot bleed outside the fill it belongs to. */
  addClipPathsToStrokeGroup(g: SplineStrokeGroup, drawparams: DrawParams, path: VDPath) {
    let fs = new Set<SplineFace>();
    let z = drawparams.z;
    let fz: number;

    for (let seg of g.segments) {
      if (!(seg.flag & SplineFlags.NO_RENDER) && seg.mat.flag & MaterialFlags.MASK_TO_FACE) {
        let l = seg.l,
          _i = 0;

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
        let path2 = this.get_path(pathKey(f.eid, PathRole.ELEMENT), fz);
        path.add_clip_path(path2);
      }
    }
  }

  /* Trims every stroke meeting at `v` back far enough that none of them
     overlaps another.  The geometry is in trimmer.ts; what is left here is the
     graph side of it -- the FANCY_JOINS switch, and the debug paths, which are
     created and left empty for the group pass to draw into. */
  update_vertex_strokes(v: SplineVertex, drawparams: DrawParams) {
    if (v.segments.length === 0 || !FANCY_JOINS) {
      return;
    }

    if (this.strokeDebug && (v.flag & SplineFlags.BREAK_TANGENTS || v.segments.length > 2)) {
      let eid = v.eid;
      let z = 1000.0;

      let dpath = this.get_path(pathKey(eid, PathRole.DEBUG_1), z + 10000);
      let dpath2 = this.get_path(pathKey(eid, PathRole.DEBUG_2), z + 10001);
      let dpath3 = this.get_path(pathKey(eid, PathRole.DEBUG_3), z + 10002);

      dpath.color = new Vector4([1, 0.25, 0.125, 0.5]);
      dpath2.color = new Vector4([0.25, 0.65, 1.0, 0.5]);
      dpath3.color = new Vector4([0.5, 1.0, 0.5, 0.5]);

      dpath.reset();
      dpath2.reset();
      dpath3.reset();
    }

    const vi = this.scene.vertSlot(v.eid);

    if (vi === NO_SLOT) {
      console.warn("vertex is not in the scene", v.eid);
      return;
    }

    if (!wasmTrimVertex(this.scene, this.trims, vi)) {
      trimVertex(this.scene, this.trims, vi);
    }
  }

  /* The last geometry in this file that still evaluates the spline directly.
     It is the draw_normals debug view, off by default and not in the scene's
     evaluator (nothing else needs curvatureSide), so it stayed behind. */
  update_normals(seg: SplineSegment, drawparams: DrawParams) {
    let eid = seg.eid,
      z = seg.z;

    let path1 = this.get_path(pathKey(eid, PathRole.DEBUG_1), z + 10000);
    let path2 = this.get_path(pathKey(eid, PathRole.DEBUG_2), z + 10001);
    let steps = 40;
    let trims = this.trims;

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
    let dv = new Vector2(),
      lastdv = new Vector2();
    let no = new Vector2(),
      lastno = new Vector2();

    let wid = 1.5 / drawparams.zoom;

    for (let side = 0; side < 2; side++) {
      let starts = trims.start(seg, side),
        ends = trims.end(seg, side);
      let ds = (ends - starts) / (steps - 1);

      let s = starts;
      let lastco: Vector2 | undefined = undefined;

      let path = side ? path1 : path2;

      for (let i = 0; i < steps; i++, s += ds) {
        let co = seg.evaluateSide(s, side, dv, no, lwdlw);
        let k = seg.curvatureSide(s, side, no) * (side * 2.0 - 1.0);

        no.normalize().mulScalar(17000.0 * k);

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
  update_polygon_color(f: SplineFace, drawparams: DrawParams) {
    const { actlayer, only_render, selectmode, z, spline } = drawparams;

    if (!this.has_path(pathKey(f.eid, PathRole.ELEMENT), z)) {
      return;
    }

    let path = this.get_path(pathKey(f.eid, PathRole.ELEMENT), z);

    function setElemColor() {
      /*if ((selectmode & SelMask.FACE) && f === spline.faces.highlight) {
        path.color[0] = 200/255, path.color[1] = 200/255, path.color[2] = 50/255, path.color[3] = 0.8;
        //g.strokeStyle = "rgba(200, 200, 50, 0.8)";
      } else*/
      if (selectmode & SelMask.FACE && f === spline.faces.active) {
        (path.color[0] = 200 / 255),
          (path.color[1] = 80 / 255),
          (path.color[2] = 50 / 255),
          (path.color[3] = 0.8);
        //g.strokeStyle = "rgba(200, 80, 50, 0.8)";
      } else if (selectmode & SelMask.FACE && f.flag & SplineFlags.SELECT) {
        (path.color[0] = 250 / 255),
          (path.color[1] = 140 / 255),
          (path.color[2] = 50 / 255),
          (path.color[3] = 0.8);
        //g.strokeStyle = "rgba(250, 140, 50, 0.8)";
      } else {
        path.color[0] = f.mat.fillcolor[0];
        path.color[1] = f.mat.fillcolor[1];
        path.color[2] = f.mat.fillcolor[2];
        path.color[3] = f.mat.fillcolor[3];
      }
    }

    let inlayer = drawparams.ignore_layers || f.in_layer(actlayer);

    if (!only_render && selectmode & SelMask.FACE && inlayer) {
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
  update_polygon(f: SplineFace, drawparams: DrawParams) {
    const { zoom, z } = drawparams;

    let path: VDPath;

    if (this.has_path(pathKey(f.eid, PathRole.ELEMENT), z) && !(f.flag & SplineFlags.REDRAW)) {
      path = this.get_path(pathKey(f.eid, PathRole.ELEMENT), z);

      this.update_polygon_color(f, drawparams);
      return;
    }

    f.flag &= ~SplineFlags.REDRAW;
    path = this.get_path(pathKey(f.eid, PathRole.ELEMENT), z);
    path.was_updated = true;

    path.hidden = !this.draw_faces;

    path.reset();
    path.blur = f.mat.blur * (this.do_blur ? 1 : 0);

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
        let steps = 6,
          s = flip < 0.0 ? 1.0 : 0.0;

        let ds = (1.0 / (steps - 1)) * flip;

        for (let i = 0; i < steps; i++, s += ds) {
          let co = seg.evaluate(s * 0.9998 + 0.00001);
          let dv = seg.derivative(s * 0.9998 + 0.00001);
          let k = seg.curvature(s * 0.9998 + 0.00001);

          dv.mulScalar(ds / 3.0);

          if (first) {
            first = false;
            path.moveTo(co[0], co[1]);
          } else {
            //*
            if (i === 0 || abs(k) < 0.00001 / zoom) {
              path.lineTo(co[0], co[1]);
            } else {
              path.cubicTo(
                lastco[0] + lastdv[0],
                lastco[1] + lastdv[1],
                co[0] - dv[0],
                co[1] - dv[1],
                co[0],
                co[1]
              );
            }
          }

          lastco.load(co);
          lastdv.load(dv);
        }
      }
    }

    this.update_polygon_color(f, drawparams);

    return path;
  }

  draw(g: Canvas2D) {
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

window._SplineDrawer = SplineDrawer;

import { SplineStrokeGroup } from "./spline_strokegroup.js";
