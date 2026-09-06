/* Faces are bounded by rings of loops.  A SplineLoop is one use of a segment by
   a face; SplineLoopPath is one closed boundary, as a ring of them.

   Two rings run through every loop.  next/prev walk around one boundary, and
   radial_next/radial_prev walk around one segment across every face using it. */

import { Vector2 } from "../../path.ux/scripts/pathux.js";

import { SplineElement, SplineTypes } from "../spline_base.js";
import { structInherit } from "../../core/struct_facade.js";
import * as math from "../../util/mathlib.js";

import type { SplineFace } from "./face.js";
import type { SplineSegment } from "./segment.js";
import type { SplineVertex } from "./vertex.js";

export class SplineLoop extends SplineElement {
  static STRUCT: string;

  declare type: typeof SplineTypes.LOOP;

  /* Every loop is created through SplineFace.make_path(), which passes all
     three; the ring links are stitched up right after. */
  f!: SplineFace;
  s!: SplineSegment;
  v!: SplineVertex;
  next!: SplineLoop;
  prev!: SplineLoop;
  radial_next!: SplineLoop;
  radial_prev!: SplineLoop;
  /* The path this loop is part of; assigned by SplineLoopPath.fromSTRUCT(). */
  p!: SplineLoopPath;

  constructor(f?: SplineFace, s?: SplineSegment, v?: SplineVertex) {
    super(SplineTypes.LOOP);

    (this.f = f!), (this.s = s!), (this.v = v!);
  }

  static fromSTRUCT(reader: StructReader<SplineLoop>) {
    var ret = new SplineLoop();
    reader(ret);
    return ret;
  }
}

SplineLoop.STRUCT =
  structInherit(SplineLoop, SplineElement) +
  `
    f    : int | obj.f.eid;
    s    : int | obj.s.eid;
    v    : int | obj.v.eid;
    next : int | obj.next.eid;
    prev : int | obj.prev.eid;
    radial_next : int | obj.radial_next != undefined ? obj.radial_next.eid : -1;
    radial_prev : int | obj.radial_prev != undefined ? obj.radial_prev.eid : -1;
  }
`;

class SplineLoopPathIter {
  ret: IterRet<SplineLoop>;
  path!: SplineLoopPath;
  l: SplineLoop | undefined;

  constructor(path?: SplineLoopPath) {
    this.path = path!;
    this.ret = new IterRet<SplineLoop>();
    this.l = path != undefined ? path.l : undefined;
  }

  init(path: SplineLoopPath) {
    this.path = path;
    this.l = path.l;
    this.ret.done = false;
    this.ret.clear();

    return this;
  }

  next() {
    var ret = this.ret;

    if (this.l == undefined) {
      ret.done = true;
      ret.clear();
      return ret;
    }

    ret.value = this.l;
    this.l = this.l.next;

    if (this.l === this.path.l) this.l = undefined;

    return ret;
  }

  reset() {
    this.l = this.path.l;
    this.ret.done = false;
    this.ret.clear();
  }
}

/* Was `static` inside SplineLoopPath.update_winding(). */
const _SplineLoopPath_update_winding_cent = new Vector2();

/* One closed boundary of a face, as a ring of loops starting at `l`. */
export class SplineLoopPath {
  static STRUCT: string;

  l!: SplineLoop;
  f!: SplineFace;
  totvert!: number;
  /* NOTE: update_winding() assigns a boolean here, and the nstructjs schema
     writes it as an int. */
  winding: number | boolean;
  itercache!: cachering<SplineLoopPathIter>;
  /* Only exists between reader(ret) and the delete in fromSTRUCT(). */
  loops?: SplineLoop[];

  constructor(l?: SplineLoop, f?: SplineFace) {
    this.l = l!;
    this.f = f!;
    this.winding = 0;
  }

  [Symbol.iterator]() {
    if (this.itercache === undefined) {
      this.itercache = cachering.fromConstructor(SplineLoopPathIter, 4);
    }

    return this.itercache.next().init(this);
  }

  update_winding() {
    const cent = _SplineLoopPath_update_winding_cent;

    cent.zero();
    for (var l of this) {
      cent.add(l.v);
    }

    cent.mulScalar(1.0 / this.totvert);

    var wsum = 0;
    for (var l of this) {
      wsum += math.winding(l.v, l.next.v, cent) ? 1 : -1;
    }

    this.winding = wsum >= 0;
  }

  asArray() {
    var l = this.l;
    var ret = [];

    do {
      ret.push(l);
      l = l.next;
    } while (l !== this.l);

    return ret;
  }

  /* Rebuilds the next/prev ring from the flat `loops` array the schema
     stores. */
  static fromSTRUCT(reader: StructReader<SplineLoopPath>) {
    var ret = new SplineLoopPath();
    reader(ret);

    /* `loops` is a STRUCT field, so the reader above always filled it in. */
    const loops = ret.loops!;

    var l = (ret.l = loops[0]);
    l.p = ret;

    for (var i = 1; i < loops.length; i++) {
      l.next = loops[i];
      loops[i].prev = l;

      loops[i].p = ret;
      l = loops[i];
    }

    loops[0].prev = loops[loops.length - 1];
    loops[loops.length - 1].next = loops[0];

    delete ret.loops;
    return ret;
  }
}

SplineLoopPath.STRUCT = `
  SplineLoopPath {
    totvert : int;
    loops   : array(SplineLoop) | obj.asArray();
    winding : int;
  }
`;
