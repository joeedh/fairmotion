"use strict";

import type {FullContext} from './context.js';

export var AnimTypes = {
  SPLINE_PATH_TIME : 1,
  DATABLOCK_PATH   : 2,
  ALL              : 1|2
};

/* Stub -- never implemented, and nothing calls it. `types` is a mask of
   AnimTypes. */
export function iterAnimCurves(ctx: FullContext, types: number) {

}
