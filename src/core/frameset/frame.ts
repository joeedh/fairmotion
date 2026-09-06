/* One topology frame: a whole Spline, stamped with the time it belongs to.

   There is only ever one today -- SplineFrameSet.insert_frame() refuses to make
   a second -- but the file format still stores a list of them, so the class
   survives as the unit of that list. */

import type { Spline } from "../../curve/spline.js";

export class SplineFrame {
  static STRUCT: string;

  spline: Spline;
  time: number;
  flag: number;

  constructor(time?: number, idgen?: EIDGen) {
    /* `!` erases at runtime; a bare new SplineFrame() still leaves these
       undefined, which fromSTRUCT and insert_frame both rely on. */
    this.time = time!;
    this.flag = 0;
    this.spline = undefined!;
  }

  static fromSTRUCT(reader: StructReader<SplineFrame>) {
    let ret = new SplineFrame();

    reader(ret);

    return ret;
  }
}

SplineFrame.STRUCT = `
  SplineFrame {
    time    : float;
    spline  : Spline;
    flag    : int;
  }
`;
