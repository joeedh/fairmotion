"use strict";

/*
 * Backend selection for the retained vector-draw layer.
 *
 * Three backends are live: CanvasDraw2D (the batched, worker-rasterized
 * default), SimpleCanvasDraw2D (tiled mode and SVG-export scaffolding), and
 * SVGDraw2D (export). `Canvas`/`Path` name the default pair; the other two are
 * imported at their own module paths by the code that wants them.
 */
import { CanvasDraw2D, CanvasPath } from "./vectordraw_canvas2d.js";

export { VectorFlags } from "./vectordraw_base.js";

export * from "./vectordraw_canvas2d_simple.js";

export let Canvas = CanvasDraw2D;
export let Path = CanvasPath;
