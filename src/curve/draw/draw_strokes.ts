/* The stroke half of the drawer's assembly: everything between a geometry
   function and a retained path.

   None of the geometry is here.  stroker.ts builds outlines, trimmer.ts trims
   junctions, and stroke_wasm.ts runs the C++ twin of either where it can; what
   these functions do is find the group or the vertex in the StrokeScene, hand
   it over, and map what comes back onto paths -- with their colours, their
   z order, their clip paths, and the dirty checks that skip the work when
   nothing moved.

   They were methods on SplineDrawer and keep their names, so
   docs/stroking.md's walkthrough still names the step it is describing. */

import { Vector2, Vector4 } from "../../path.ux/scripts/pathux.js";

import { MaterialFlags, SplineFlags } from "../spline_types.js";
import { NO_SLOT } from "./stroke_scene.js";
import { PathRole, pathKey } from "./path_key.js";
import { OutFinish } from "./outline_buffer.js";
import { playOutline } from "./outline_play.js";
import { wasmStrokeGroup, wasmStrokeJoin, wasmTrimVertex } from "./stroke_wasm.js";
import { strokeGroup, strokeJoin } from "./stroker.js";
import { trimVertex } from "./trimmer.js";

import type { PathBase } from "../../vectordraw/vectordraw_base.js";
import type { SplineFace, SplineSegment, SplineVertex } from "../spline_types.js";
import type { SplineStrokeGroup } from "./spline_strokegroup.js";
import type { DrawParams } from "./draw_params.js";
import type { SplineDrawer } from "./spline_drawer.js";

/* The barrel picks which backend Canvas/Path pair is live, and callers pass
   whichever one they built (view2d_ops hands over a SimpleCanvasDraw2D), so the
   drawer is typed by the shared base rather than by one implementation. */
type VDPath = PathBase;

/* Fills the wedge between a segment's two stroke sides at `v`, so a
   many-valence vertex does not show a gap where the strokes were trimmed back.
   The geometry is strokeJoin(); what is here is the assembly around it -- the
   retained paths, their colours, and the dirty check that skips both when
   nothing at `v` moved. */
export function update_vertex_join(
  self: SplineDrawer,
  seg: SplineSegment,
  v: SplineVertex,
  drawparams: DrawParams
) {
  let z = drawparams.z;
  let atV1 = v === seg.v1;
  let id = pathKey(seg.eid, atV1 ? PathRole.JOIN_V1 : PathRole.JOIN_V2);
  let id2 = pathKey(seg.eid, atV1 ? PathRole.JOIN_V1_DOUBLE : PathRole.JOIN_V2_DOUBLE);

  if (
    self.has_path(id2, z + 1) &&
    self.has_path(id, z) &&
    !(v.flag & (SplineFlags.REDRAW | SplineFlags.UPDATE))
  ) {
    return;
  }

  const si = self.scene.segSlot(seg.eid);
  const vi = self.scene.vertSlot(v.eid);

  if (si === NO_SLOT || vi === NO_SLOT) {
    console.warn("join is not in the scene", seg.eid, v.eid);
    return;
  }

  let mat = seg.mat;

  let path = self.get_path(id, z);

  path.color.load(mat.strokecolor);
  path.blur = mat.blur;
  path.reset();

  let path2 = self.get_path(id2, z + 1);

  path2.reset();

  /* Wasm where it can, and the JS stroker as the reference implementation
     where it cannot; see stroke_wasm.ts for what "cannot" covers. */
  const out =
    wasmStrokeJoin(self.scene, self.trims, si, vi, self.outlines) ??
    strokeJoin(self.scene, self.trims, si, vi, self.outlines.reset()).finish();

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

/* Strokes a whole run of segments into one path, walking the run from one end
   to the other and back so the outline closes.  `path2` carries the optional
   second (outline) stroke.

   The geometry is stroker.ts's; what is left here is assembly -- find the group
   in the scene, hand it over, and map the outlines that come back onto retained
   paths, with the styles and the clipping the backend needs.

   `redraw` arrives as a bitmask from updateIntern(), hence the number. */
export function update_stroke_group(
  self: SplineDrawer,
  g: SplineStrokeGroup,
  drawparams: DrawParams,
  redraw: boolean | number
) {
  let id2 = pathKey(g.id, PathRole.DOUBLE_STROKE);
  let id1 = pathKey(g.id, PathRole.ELEMENT);
  let z = drawparams.z;

  /* All three are set together under `if (debug)` and only ever used under it. */
  let dpath!: VDPath, dpath2!: VDPath, dpath3!: VDPath;
  const debug = self.strokeDebug;

  //we put this before the branch below to avoid auto-deleting
  //debug lines
  if (debug) {
    let eid = g.id;

    dpath = self.get_path(pathKey(eid, PathRole.DEBUG_1), z + 50000);
    dpath2 = self.get_path(pathKey(eid, PathRole.DEBUG_2), z + 50001);
    dpath3 = self.get_path(pathKey(eid, PathRole.DEBUG_3), z + 60002);

    dpath.color = new Vector4([1, 0.5, 0.5, 0.9]);
    dpath2.color = new Vector4([0.25, 0.65, 1.0, 0.9]);
    dpath3.color = new Vector4([0.5, 1.0, 0.5, 0.9]);
  }

  if (self.has_path(id2, z + 1) && self.has_path(id1, z) && !redraw) {
    return;
  }

  let path = self.get_path(id1, z);
  path.reset();

  if (debug) {
    dpath.reset();
    dpath2.reset();
    dpath3.reset();
  }

  //double stroke path
  let path2 = self.get_path(id2, z + 1);
  path2.reset();
  path2.noAutoFill();

  if (g.segments.length === 0) {
    if (self.has_path(id1, z)) {
      self.get_path(id1, z).reset();
    }

    console.warn("g.segments.length was zero!");
    return;
  }

  let seg = g.segments[0];

  path.color = seg.mat.strokecolor;
  path.blur = seg.mat.blur;

  const gi = self.scene.groupMap.get(g.id);

  if (gi === undefined) {
    console.warn("stroke group is not in the scene", g.id);
    return;
  }

  const out =
    wasmStrokeGroup(self.scene, self.trims, gi, !!debug, self.outlines) ??
    strokeGroup(self.scene, self.trims, gi, !!debug, self.outlines.reset()).finish();

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
  }

  addClipPathsToStrokeGroup(self, g, drawparams, path);
}

/* Clips the group's stroke against every face it is masked to, so a stroke
   flagged MASK_TO_FACE cannot bleed outside the fill it belongs to. */
export function addClipPathsToStrokeGroup(
  self: SplineDrawer,
  g: SplineStrokeGroup,
  drawparams: DrawParams,
  path: VDPath
) {
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
      let path2 = self.get_path(pathKey(f.eid, PathRole.ELEMENT), fz);
      path.add_clip_path(path2);
    }
  }
}

/* Trims every stroke meeting at `v` back far enough that none of them overlaps
   another.  The geometry is in trimmer.ts; what is left here is the graph side
   of it -- the FANCY_JOINS switch, and the debug paths, which are created and
   left empty for the group pass to draw into. */
export function update_vertex_strokes(self: SplineDrawer, v: SplineVertex, drawparams: DrawParams) {
  if (v.segments.length === 0 || !FANCY_JOINS) {
    return;
  }

  if (self.strokeDebug && (v.flag & SplineFlags.BREAK_TANGENTS || v.segments.length > 2)) {
    let eid = v.eid;
    let z = 1000.0;

    let dpath = self.get_path(pathKey(eid, PathRole.DEBUG_1), z + 10000);
    let dpath2 = self.get_path(pathKey(eid, PathRole.DEBUG_2), z + 10001);
    let dpath3 = self.get_path(pathKey(eid, PathRole.DEBUG_3), z + 10002);

    dpath.color = new Vector4([1, 0.25, 0.125, 0.5]);
    dpath2.color = new Vector4([0.25, 0.65, 1.0, 0.5]);
    dpath3.color = new Vector4([0.5, 1.0, 0.5, 0.5]);

    dpath.reset();
    dpath2.reset();
    dpath3.reset();
  }

  const vi = self.scene.vertSlot(v.eid);

  if (vi === NO_SLOT) {
    console.warn("vertex is not in the scene", v.eid);
    return;
  }

  if (!wasmTrimVertex(self.scene, self.trims, vi)) {
    trimVertex(self.scene, self.trims, vi);
  }
}

/* The last geometry in the drawer that still evaluates the spline directly.  It
   is the draw_normals debug view, off by default and not in the scene's
   evaluator (nothing else needs curvatureSide), so it stayed behind. */
export function update_normals(self: SplineDrawer, seg: SplineSegment, drawparams: DrawParams) {
  let eid = seg.eid,
    z = seg.z;

  let path1 = self.get_path(pathKey(eid, PathRole.DEBUG_1), z + 10000);
  let path2 = self.get_path(pathKey(eid, PathRole.DEBUG_2), z + 10001);
  let steps = 40;
  let trims = self.trims;

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
  let dv = new Vector2();
  let no = new Vector2();

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

/* The centre-line-only path fastDraw() takes for one stroke group: five samples
   a segment, no joins, no trims.

   NOTE: a stroke group has no `eid` -- its own key is `id`, its members' eids
   are in `eids` -- so the NO_PATH lookup fastDraw() makes before calling this
   always misses and the group is always redrawn.  Kept as it runs. */
export function fast_draw_stroke_group(
  self: SplineDrawer,
  g: SplineStrokeGroup,
  drawparams: DrawParams
) {
  let path = self.get_path(pathKey(g.id, PathRole.ELEMENT), drawparams.z);
  path.reset();

  for (let seg of g.segments) {
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
}
