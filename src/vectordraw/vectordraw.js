"use strict";

import {
  CanvasDraw2D, CanvasPath
} from 'vectordraw_canvas2d';

import {
  StubCanvasDraw2D,
  StubCanvasPath
} from "vectordraw_stub";

import {
  SVGDraw2D, SVGPath
} from 'vectordraw_svg';

import {
  VectorFlags
} from 'vectordraw_base';

export var VectorFlags = VectorFlags;

/*
export var Canvas = StubCanvasDraw2D;
export var Path = StubCanvasPath;
//*/

//* canvas2d
export var Canvas = CanvasDraw2D;
export var Path = CanvasPath;
//*/

/* svg
export var Canvas = SVGDraw2D;
export var Path = SVGPath;
//*/
