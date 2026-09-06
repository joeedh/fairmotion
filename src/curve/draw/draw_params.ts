/* The two argument bundles the drawer passes around.

   `DrawPass` is what one call to SplineDrawer.update() needs from its caller:
   the spline, the drawlist, the view matrix and the editor state the pass runs
   under.  It exists because the list used to be nine positional parameters wide
   and updateIntern() and fastDraw() each repeated it (P8 of
   docs/plans/draw-refactor-plan-final-notes.md).

   `DrawParams` is the per-element state derived from that pass, recycled
   through a cachering so the update_* functions take one argument rather than
   ten. */

import { Vector2 } from "../../path.ux/scripts/pathux.js";

import type { Spline } from "../spline.js";
import type { SplineLayer } from "../spline_element_array.js";
import type { View2DHandler } from "../../editors/viewport/view2d.js";
import type { DrawListItem } from "./spline_strokegroup.js";

/* One update() pass, as its caller describes it.

   `redraw_rects` is a flat run of x1, y1, x2, y2 quadruples, not a list of
   rects; see view2d.ts.  `only_render` is a view2d toggle stored as a 0/1 int
   and toggled with ^= 1, so it arrives as either.  `master_g` is read only for
   its height, which the y-flip in beginPass() needs. */
export interface DrawPass {
  spline: Spline;
  drawlist: DrawListItem[];
  drawlist_layerids: (string | undefined)[];
  matrix: Matrix4;
  redraw_rects: number[];
  only_render: number | boolean;
  selectmode: number;
  master_g: Canvas2D;
  editor: View2DHandler;
  ignore_layers?: boolean;
  draw_stroke_debug?: boolean;
}

/* The per-frame draw state, bundled so the update_* functions can take one
   argument instead of ten.  Recycled through drawParams() below. */
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

const drawparam_cachering = new cachering(function () {
  return new DrawParams();
}, 16);

/* The next recycled DrawParams, uninitialized. */
export function drawParams(): DrawParams {
  return drawparam_cachering.next();
}
