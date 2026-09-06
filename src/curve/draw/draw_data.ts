/* Where a segment's two stroke sides start and end, plus optional explicit
   endpoints for mitred joins.

   Dead as of stage 3 of the draw refactor: trim_state.ts owns this now and
   nothing reads a loaded instance.  The class stays registered so old files
   still parse, and Spline.afterSTRUCT() drops the layer once they have -- see
   docs/plans/draw-refactor-plan-final-notes.md P4.  Nothing imports a name from
   here; spline_drawer.ts imports the module for the registration alone. */

import { nstructjs, Vector2 } from "../../path.ux/scripts/pathux.js";

import { CustomDataLayer } from "../spline_types.js";

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
