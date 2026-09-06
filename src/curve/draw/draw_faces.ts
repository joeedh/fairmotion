/* The face half of the drawer's assembly: a face's outline as a retained path,
   and the colour that path takes.

   Unlike the stroke side, the geometry is still here.  A face outline is a
   sample of the boundary segments' own evaluate()/derivative()/curvature(), and
   nothing in the StrokeScene describes a face; stage 4 of the draw refactor did
   not extract it.

   Both functions were methods on SplineDrawer and keep their names, so
   docs/rendering.md's walkthrough still names the step it is describing. */

import { Vector2, Vector4 } from "../../path.ux/scripts/pathux.js";

import { SelMask } from "../../editors/viewport/selectmode.js";
import { evillog } from "../../core/evillog.js";
import { SplineFlags } from "../spline_types.js";
import { PathRole, pathKey } from "./path_key.js";

import type { PathBase } from "../../vectordraw/vectordraw_base.js";
import type { SplineFace } from "../spline_types.js";
import type { DrawParams } from "./draw_params.js";
import type { SplineDrawer } from "./spline_drawer.js";

const abs = Math.abs;

const draw_face_vs = new cachering(function () {
  return new Vector2();
}, 32);

/* Recolours an already-built face path in place -- selection tint when the face
   is pickable, its own fill colour otherwise. */
export function update_polygon_color(self: SplineDrawer, f: SplineFace, drawparams: DrawParams) {
  const { actlayer, only_render, selectmode, z, spline } = drawparams;

  if (!self.has_path(pathKey(f.eid, PathRole.ELEMENT), z)) {
    return;
  }

  let path = self.get_path(pathKey(f.eid, PathRole.ELEMENT), z);

  function setElemColor() {
    if (selectmode & SelMask.FACE && f === spline.faces.active) {
      (path.color[0] = 200 / 255),
        (path.color[1] = 80 / 255),
        (path.color[2] = 50 / 255),
        (path.color[3] = 0.8);
    } else if (selectmode & SelMask.FACE && f.flag & SplineFlags.SELECT) {
      (path.color[0] = 250 / 255),
        (path.color[1] = 140 / 255),
        (path.color[2] = 50 / 255),
        (path.color[3] = 0.8);
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
export function update_polygon(
  self: SplineDrawer,
  f: SplineFace,
  drawparams: DrawParams
): PathBase | undefined {
  const { zoom, z } = drawparams;

  let path: PathBase;

  if (self.has_path(pathKey(f.eid, PathRole.ELEMENT), z) && !(f.flag & SplineFlags.REDRAW)) {
    path = self.get_path(pathKey(f.eid, PathRole.ELEMENT), z);

    update_polygon_color(self, f, drawparams);
    return;
  }

  f.flag &= ~SplineFlags.REDRAW;
  path = self.get_path(pathKey(f.eid, PathRole.ELEMENT), z);
  path.was_updated = true;

  path.hidden = !self.draw_faces;

  path.reset();
  path.blur = f.mat.blur * (self.do_blur ? 1 : 0);

  let lastco = draw_face_vs.next().zero();
  let lastdv = draw_face_vs.next().zero();

  for (let path2 of f.paths) {
    let first = true;

    for (let l of path2) {
      let seg = l.s;

      let flip = seg.v1 !== l.v ? -1.0 : 1.0;

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

  update_polygon_color(self, f, drawparams);

  return path;
}
