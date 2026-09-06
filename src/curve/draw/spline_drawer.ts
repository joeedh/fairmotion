/* Turns a spline's drawlist into vectordraw paths, one path per element, and
   keeps them alive between frames so an unchanged element is never rebuilt.

   What is here is the pass: the retained-path bookkeeping, the matrix and pan
   handling, the dirty checks that decide what a frame has to rebuild, and the
   loop over the drawlist.  The per-element work lives beside it --
   draw_strokes.ts for groups, joins, trims and the debug overlays,
   draw_faces.ts for fills -- and the geometry those call lives further down
   still, in stroker.ts, trimmer.ts and stroke_wasm.ts.

   `used_paths` is the set of path ids touched this frame; anything in the
   backend's id map that is missing from it gets dropped at the end of
   update(). */

import { Vector2, Vector4 } from "../../path.ux/scripts/pathux.js";

import { Canvas } from "../../vectordraw/vectordraw.js";
import { SplineLayerFlags } from "../spline_element_array.js";
import { SplineFlags, SplineSegment, SplineTypes } from "../spline_types.js";
import { NO_PATH, PathRole, pathKey } from "./path_key.js";
import { OutlineBuffer } from "./outline_buffer.js";
import { StrokeScene, strokeScene } from "./stroke_scene.js";
import { TrimState, trimState } from "./trim_state.js";
import { beginWidthChains, endWidthChains } from "./width_chain.js";
import { SplineStrokeGroup } from "./spline_strokegroup.js";
import { DrawParams, drawParams } from "./draw_params.js";
import {
  fast_draw_stroke_group,
  update_normals,
  update_stroke_group,
  update_vertex_join,
  update_vertex_strokes,
} from "./draw_strokes.js";
import { update_polygon, update_polygon_color } from "./draw_faces.js";

/* Imported for the side effect: SplineDrawData is a dead custom data layer that
   still has to be registered so old files parse.  See draw_data.ts. */
import "./draw_data.js";

import type { PathBase, VectorDraw } from "../../vectordraw/vectordraw_base.js";
import type { Spline } from "../spline.js";
import type { SplineVertex } from "../spline_types.js";
import type { DrawListItem } from "./spline_strokegroup.js";
import type { DrawPass } from "./draw_params.js";

/* The barrel picks which backend Canvas/Path pair is live, and callers pass
   whichever one they built (view2d_ops hands over a SimpleCanvasDraw2D), so the
   drawer is typed by the shared base rather than by one implementation. */
type VDCanvas = VectorDraw;
type VDPath = PathBase;

window.FANCY_JOINS = true;

const update_tmps_vs = new cachering(function () {
  return new Vector2();
}, 64);

const update_tmps_mats = new cachering(function () {
  return new Matrix4();
}, 64);

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

  /* Everything both passes do before they touch a path: fold the y-flip into
     the draw matrix, extract the pan out of it, and measure how far the view
     moved since the last frame.  updateIntern() and fastDraw() ran identical
     copies of this; what they decide differently is `recalc_all`, so that
     comes in already computed.  Returns the pan delta. */
  beginPass(pass: DrawPass, recalc_all: boolean | number): Vector2 {
    const master_g = pass.master_g;
    let drawMatrix = pass.matrix;

    let matrix = update_tmps_mats.next();
    matrix.load(pass.matrix);

    let mat2 = update_tmps_mats.next();

    mat2.makeIdentity();
    mat2.translate(0.0, master_g.height, 0.0);
    mat2.scale(1.0, -1.0, 1.0);
    matrix.preMultiply(mat2);

    this.drawer.do_blur = pass.editor.enable_blur;

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

  /* Whether the whole frame has to be rebuilt rather than patched: a change to
     what is drawn at all, or to how many elements there are.  Records the
     counts it compared against, so calling it twice in one frame answers false
     the second time. */
  private checkRecalcAll(pass: DrawPass, faces: boolean, blur: boolean): boolean {
    const spline = pass.spline;
    const only_render = !!pass.only_render;

    let recalc: number | boolean =
      this.recalc_all || this.draw_faces !== faces || this.do_blur !== blur;

    recalc = recalc || (only_render !== !!this.only_render && pass.selectmode & SplineTypes.FACE);
    recalc =
      recalc ||
      (pass.selectmode !== this.last_selectmode &&
        (pass.selectmode | this.last_selectmode) & SplineTypes.FACE);

    recalc = recalc || spline.verts.length !== this.last_totvert;
    recalc = recalc || spline.segments.length !== this.last_totseg;
    recalc = recalc || spline.faces.length !== this.last_totface;

    this.last_totvert = spline.verts.length;
    this.last_totseg = spline.segments.length;
    this.last_totface = spline.faces.length;
    this.last_selectmode = pass.selectmode;

    this.draw_faces = faces;
    this.do_blur = blur;

    return !!recalc;
  }

  /* The DrawParams every element of this pass is drawn with, minus `z`, which
     the draw loop assigns per element. */
  private passParams(pass: DrawPass, off: Vector2): DrawParams {
    return drawParams().init(
      pass.redraw_rects,
      pass.spline.layerset.active,
      !!pass.only_render,
      pass.selectmode,
      pass.matrix.$matrix.m11,
      undefined,
      off,
      pass.spline,
      pass.drawlist,
      pass.ignore_layers
    );
  }

  /* The window.DEBUG.fastDrawMode path: centre lines only, no joins, no trims
     and no faces.  `pass.ignore_layers` is not read. */
  fastDraw(pass: DrawPass) {
    const spline = pass.spline;
    const drawlist = pass.drawlist;

    this.used_paths = {};
    this.drawlist = drawlist;
    this.drawlist_layerids = pass.drawlist_layerids;

    const do_blur = !!(pass.only_render || pass.editor.enable_blur);
    const draw_faces = !!(pass.only_render || pass.editor.draw_faces);

    /* fastDraw's own check, which unlike updateIntern's does not look at
       selectmode; the counts and the two toggles are all it has ever read. */
    let recalc_all: number | boolean =
      this.recalc_all || this.draw_faces !== draw_faces || this.do_blur !== do_blur;

    recalc_all = recalc_all || spline.verts.length !== this.last_totvert;
    recalc_all = recalc_all || spline.segments.length !== this.last_totseg;
    recalc_all = recalc_all || spline.faces.length !== this.last_totface;

    this.last_totvert = spline.verts.length;
    this.last_totseg = spline.segments.length;
    this.last_totface = spline.faces.length;

    this.draw_faces = draw_faces;
    this.do_blur = do_blur;

    const off = this.beginPass(pass, recalc_all);
    const drawparams = this.passParams(pass, off);

    const updateflags = SplineFlags.REDRAW | SplineFlags.UPDATE;

    for (let i = 0; i < drawlist.length; i++) {
      let e = drawlist[i];

      let z = (drawparams.z = i);
      drawparams.combine_paths = true;

      if (e instanceof SplineStrokeGroup) {
        let redraw = false;
        for (let seg of e.segments) {
          if (seg.flag & updateflags || seg.v1.flag & updateflags || seg.v2.flag & updateflags) {
            redraw = true;
            break;
          }
        }

        if (!redraw && this.has_path(NO_PATH, z)) {
          continue;
        }

        fast_draw_stroke_group(this, e, drawparams);
      }
    }
  }

  /* Rebuilds every path whose element changed since the last frame.  Vertices
     are trimmed first (update_vertex_strokes), then each drawlist entry is
     stroked or filled, then untouched paths are dropped.

     The width nets live exactly as long as one update pass -- everything
     inside reads them, everything outside falls back to walking the chain --
     so the pair has to survive an exception escaping the body. */
  update(pass: DrawPass) {
    const spline = pass.spline;

    this.trims = trimState(spline);
    this.trims.begin(spline);

    beginWidthChains(spline);

    /* Extract, in the four-stage sense: the flat view of the spline the stroker
       reads.  Patched here so it is current for the whole pass, and inside the
       chain set so a topology rebuild borrows it. */
    this.scene = strokeScene(spline).begin(spline, this.trims);

    try {
      return this.updateIntern(pass);
    } finally {
      endWidthChains();
    }
  }

  updateIntern(pass: DrawPass) {
    const spline = pass.spline;
    const drawlist = pass.drawlist;
    const selectmode = pass.selectmode;

    /* view2d.only_render is stored as a number and toggled with ^= 1. */
    const only_render = !!pass.only_render;

    this.strokeDebug = pass.draw_stroke_debug;

    if (window.DEBUG && window.DEBUG.fastDrawMode) {
      return this.fastDraw(pass);
    }

    const draw_normals = pass.editor.draw_normals;

    this.used_paths = {};
    this.drawlist = drawlist;
    this.drawlist_layerids = pass.drawlist_layerids;

    const do_blur = !!(only_render || pass.editor.enable_blur);
    const draw_faces = !!(only_render || pass.editor.draw_faces);

    const recalc_all = this.checkRecalcAll(pass, draw_faces, do_blur);

    this.only_render = only_render;

    if (recalc_all) {
      console.log("RECALC_ALL!");
    }

    const off = this.beginPass(pass, recalc_all);

    const updateflags = SplineFlags.REDRAW | SplineFlags.UPDATE;
    const oldcolor = new Vector4();

    const drawparams = this.passParams(pass, off);

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
        update_vertex_strokes(this, v, drawparams);
      }
    }

    for (let i = 0; i < drawlist.length; i++) {
      let e = drawlist[i];

      drawparams.z = i;
      drawparams.combine_paths = true;

      if (e instanceof SplineStrokeGroup) {
        let redraw: number | boolean = false;

        for (let seg of e.segments) {
          redraw = redraw || seg.flag & updateflags;
        }

        update_stroke_group(this, e, drawparams, redraw);

        if (draw_normals) {
          for (let seg of e.segments) {
            update_normals(this, seg, drawparams);
          }
        }

        continue;
      }

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

        update_polygon_color(this, e, drawparams);

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
        update_polygon(this, e, drawparams);
      } else if (e.type === SplineTypes.VERTEX) {
        vset.add(e);

        if (e.segments.length > 2) {
          for (let seg of e.segments) {
            update_vertex_join(this, seg, e, drawparams);
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
  }

  draw(g: Canvas2D) {
    return this.drawer.draw(g);
  }
}

window._SplineDrawer = SplineDrawer;
