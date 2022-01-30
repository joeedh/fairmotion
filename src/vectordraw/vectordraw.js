"use strict";

/* advanced batch based system with caching */
import {
  CanvasDraw2D, CanvasPath
} from './vectordraw_canvas2d.js';

import {
  StubCanvasDraw2D,
  StubCanvasPath
} from "./vectordraw_stub.js";

import {
  SVGDraw2D, SVGPath
} from './vectordraw_svg.js';


export {VectorFlags} from  './vectordraw_base.js';

import {
  SimpleCanvasPath, SimpleCanvasDraw2D
} from './vectordraw_canvas2d_simple.js';

import {Path2DPath, CanvasPath2D} from './vectordraw_canvas2d_path2d.js';

import {SimpleSkiaDraw2D, SimpleSkiaPath, loadCanvasKit} from "./vectordraw_skia_simple.js";

/*
export let Canvas = SimpleSkiaDraw2D;
export let Path = SimpleSkiaPath;
loadCanvasKit();
//*/

/*
export let Canvas = CanvasPath2D;
export let Path = Path2DPath;
//*/

/*
export let Canvas = SimpleCanvasDraw2D;
export let Path = SimpleCanvasPath;
//*/
/*
export let Canvas = StubCanvasDraw2D;
export let Path = StubCanvasPath;
//*/

//* canvas2d worker
export let Canvas = CanvasDraw2D;
export let Path = CanvasPath;
//*/

/* svg
export let Canvas = SVGDraw2D;
export let Path = SVGPath;
//*/
