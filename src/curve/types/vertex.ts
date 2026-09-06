/* SplineVertex: a point in the spline, and -- with `type` flipped over after
   the fact by spline.ts -- also a bezier handle.

   Width and shift are stored on the segments, not here.  The two accessors
   below are the vertex's view of them: `width` scales every segment meeting
   here by the same ratio, and `shift` moves every one of them by the same
   delta.  Both are what the data API binds a slider to. */

import { Vector2, Vector3 } from "../../path.ux/scripts/pathux.js";

import { SplineElement, SplineFlags, SplineTypes } from "../spline_base.js";
import { NodeBase } from "../../core/eventdag.js";
import { structInherit } from "../../core/struct_facade.js";

import type { Co2 } from "../spline_base.js";
import type { NodeDef } from "../../core/eventdag.js";
import type { SplineSegment } from "./segment.js";
import type { DataAPI, DataStruct } from "../../path.ux/scripts/pathux.js";
import type { FullContext } from "../../core/context.js";

const _seg_aabb_ret = [new Vector3(), new Vector3()];

/* Which of the two sides of a stroke something applies to.  Callers pass 0/1
   or the boolean they compared a direction sign with, and every use of it is a
   truthiness test. */
export type StrokeSide = number | boolean;

/* SplineVertex is not a Vector2 subclass -- mixin(SplineVertex, Vector2) at
   the bottom of this class copies the whole Vector2 prototype onto it, so
   declaration-merge that surface in rather than inheriting it. */
export interface SplineVertex extends Vector2 {}

/* What SplineVertex.toJSON() emits: an array-like of the two coordinates plus
   the topology fields. */
export interface SplineVertexJSON {
  [i: number]: number | undefined;

  length: number;
  frame: unknown;
  frames: { [time: number]: number };
  segments: number[];
  flag: number;
  eid: number;
}

export class SplineVertex extends SplineElement {
  static STRUCT: string;

  /* Handles are SplineVertexes too -- spline.ts flips `type` over after the
     fact -- so this holds either tag. */
  declare type: typeof SplineTypes.VERTEX | typeof SplineTypes.HANDLE;

  /* Stamped by redo_draw_sort() on whatever ends up in spline.drawlist; not
     serialized. */
  finalz!: number;

  /* The handle this one is paired with in shared-tangents mode. */
  hpair: SplineVertex | undefined;
  /* Never populated -- only ever `{}`, and copied straight out by toJSON(). */
  frames: { [time: number]: number };
  segments: Array<SplineSegment>;
  /* Silences the Vector2 mixin's warnings while loadSTRUCT() rebuilds us. */
  _no_warning: boolean;
  /* Only exists between reader(this) and the delete in loadSTRUCT(). */
  co?: Vector2;

  constructor(co?: Co2) {
    super(SplineTypes.VERTEX);

    /* SplineVertex is not a Vector2 subclass -- it borrows the methods through
       mixin(SplineVertex, Vector2) below and sets up the instance state itself.
       This used to call Vector2.prototype.initVector2, which path.ux dropped
       when vectormath moved to a class factory; these two lines are what it
       did. The `co` copy just below is the rest of it. */
    this.length = 2;
    this[0] = this[1] = 0.0;

    this._no_warning = false;

    if (co !== undefined) {
      /* Co2's slots carry `| undefined` only because path.ux vectors refuse a
         plain index signature; 0 and 1 are always there. */
      this[0] = co[0]!;
      this[1] = co[1]!;
    }

    this.type = SplineTypes.VERTEX;
    this.flag = SplineFlags.FRAME_DIRTY | SplineFlags.UPDATE;
    this.segments = [];
    this.eid = 0;
    this.frames = {};

    //handle variables
    this.hpair = undefined; //connected handle in shared tangents mode
  }

  get 2() {
    return 0.0;
  }

  set 2(val: number) {
    console.warn("Attempt to set [2] in SplineVertex!");
  }

  get width() {
    if (this.type !== SplineTypes.VERTEX) {
      //hrm, what to do for handles?
      console.warn("Dynamic vertex width not supported for handle vertices");
      return 0.0;
    }

    if (!this.segments) return 0.0; //happens in mixin code

    let tot = 0.0;
    let sum = 0.0;

    for (let s of this.segments) {
      tot++;
      sum += this === s.v1 ? s.w1 : s.w2;
    }

    return tot ? sum / tot : 0.0;
  }

  set width(w: number) {
    if (this.type !== SplineTypes.VERTEX) {
      //hrm, what to do for handles?
      console.warn("Dynamic vertex width not supported for handle vertices");
      return;
    }

    if (!this.segments) return;

    let old = this.width;

    if (w === 0.0) {
      console.warn("Cannot set width to zero");
      return;
    }

    if (isNaN(old) || old === 0.0) {
      console.warn("Corrupted width data; fixing...");
      for (let s of this.segments) {
        if (isNaN(s.w1) || s.w1 === 0.0) s.w1 = w;
        if (isNaN(s.w2) || s.w2 === 0.0) s.w2 = w;

        s.mat.update();
      }

      return;
    }

    let ratio = w / old;
    for (let s of this.segments) {
      if (this === s.v1) s.w1 *= ratio;
      else if (this === s.v2) s.w2 *= ratio;
      else throw new Error("spline mesh integrity error");

      s.mat.update();
    }

    //don't allow independent sizing for two-valence vertices

    if (this.segments.length === 2) {
      let s1 = this.segments[0];
      let s2 = this.segments[1];

      let w1 = this === s1.v1 ? s1.w1 : s1.w2;
      let w2 = this === s2.v1 ? s2.w1 : s2.w2;
      let w = (w1 + w2) * 0.5;

      s1.setVertWidth(this, w);
      s2.setVertWidth(this, w);
    }
  }

  /* The average shift of the segments meeting here.  Valence 2 is special:
     the two segments hold one shared shift between them, so they are read as
     a pair.  Everywhere else the segments are averaged, with the v1 side
     negated because shift1 and shift2 point in opposite directions. */
  get shift(): number {
    /* NOTE: returned undefined here, which every caller went on to do
       arithmetic with; every other exit is a number. */
    if (!this.segments) return 0.0;

    let tot = 0.0;
    let sum = 0.0;

    if (this.segments.length === 2) {
      let s1 = this.segments[0];
      let s2 = this.segments[1];

      let shift1 = this === s1.v1 ? s1.shift1 : s1.shift2;
      let shift2 = this === s2.v1 ? s2.shift1 : s2.shift2;

      if ((this === s1.v1) === (this === s2.v1)) {
        sum = shift1 - shift2;
      } else {
        sum = shift1 + shift2;
      }

      tot = 2.0;
    } else {
      for (let s of this.segments) {
        tot++;
        sum += this === s.v1 ? -s.shift1 : s.shift2;
      }
    }

    return tot ? sum / tot : 0.0;
  }

  /* Moves every segment's shift by the same delta, so that reading `shift`
     back afterwards gives `w`.  The valence-2 case redistributes the pair the
     way `get shift` reads it; the general case negates the v1 side to match.

     NOTE: this used to return early on anything but valence 2, so a slider
     bound through the data API silently wrote nothing on an endpoint or a
     junction.  The general branch below was unreachable, and its v1 sign was
     the opposite of the one `get shift` uses. */
  set shift(w: number) {
    if (!this.segments) return;

    let old = this.shift;
    let df = w - old;

    if (this.segments.length === 2) {
      let s1 = this.segments[0];
      let s2 = this.segments[1];

      let shift1 = this === s1.v1 ? s1.shift1 : s1.shift2;
      let shift2 = this === s2.v1 ? s2.shift1 : s2.shift2;

      if ((this === s1.v1) === (this === s2.v1)) {
        shift1 += df;
        shift2 -= df;
      } else {
        shift1 += df;
        shift2 += df;
      }

      if (this === s1.v1) s1.shift1 = shift1;
      else s1.shift2 = shift1;

      if (this === s2.v1) s2.shift1 = shift2;
      else s2.shift2 = shift2;

      s1.mat.update();
      s2.mat.update();
    } else {
      for (let s of this.segments) {
        if (this === s.v1) {
          s.shift1 -= df;
        } else {
          s.shift2 += df;
        }

        s.mat.update();
      }
    }
  }

  static nodedef(): NodeDef {
    return {
      name   : "SplineVertex",
      uiName : "SplineVertex",
      inputs : {},
      outputs: NodeBase.Inherit(),
    };
  }

  get aabb(): Vector3[] {
    let ret = _seg_aabb_ret;

    ret[0].load(this);
    ret[1].load(this);
    return ret;
  }

  sethide(state: boolean) {
    if (state) this.flag |= SplineFlags.HIDE;
    else this.flag &= ~SplineFlags.HIDE;

    if (this.type === SplineTypes.HANDLE) return;

    if (state) {
      for (var i = 0; i < this.segments.length; i++) {
        this.segments[i].sethide(true);
      }
    } else {
      for (var i = 0; i < this.segments.length; i++) {
        this.segments[i].sethide(false);
      }
    }
  }

  get hidden() {
    if (this.type === SplineTypes.VERTEX) {
      return !!(this.flag & SplineFlags.HIDE);
    } else {
      var s = this.owning_segment;

      return !!(this.flag & SplineFlags.HIDE) || !this.use || s.v1.hidden || s.v2.hidden;
    }
  }

  //get owning segment for handles
  get owning_segment() {
    return this.segments[0];
  }

  get owning_vertex() {
    return this.owning_segment.handle_vertex(this);
  }

  get use() {
    if (this.type !== SplineTypes.HANDLE) return true;

    var s = this.owning_segment;

    if (s === undefined) {
      console.warn("Corrupted handle detected", this.eid);
      return false;
    }

    var v = s.handle_vertex(this);

    var ret =
      v !== undefined &&
      ((v.segments !== undefined && v.segments.length > 2) || v.flag & SplineFlags.USE_HANDLES);

    return ret;
  }

  set hidden(value: boolean) {
    if (value) this.flag |= SplineFlags.HIDE;
    else this.flag &= ~SplineFlags.HIDE;
  }

  get valence() {
    return this.segments.length;
  }

  other_segment(s: SplineSegment): SplineSegment {
    if (s === this.segments[0]) s = this.segments[1];
    else if (s === this.segments[1]) s = this.segments[0];

    if (!s) {
      throw new Error("bad segment in SplineVertex.prototype.other_segment()");
    }
    if (s.v1 !== this && s.v2 !== this) {
      throw new Error("mesh integrity error");
    }

    return s;
  }

  /* NOTE: `this.frame` does not exist on SplineVertex -- ret.frame is always
     undefined. */
  toJSON(): SplineVertexJSON {
    const self: SplineVertex = this;
    let segments: number[] = [];

    for (var i = 0; i < this.segments.length; i++) {
      if (this.segments[i] !== undefined) segments.push(this.segments[i].eid);
    }

    return {
      frame   : Reflect.get(self, "frame"),
      segments: segments,
      0       : this[0],
      1       : this[1],
      frames  : this.frames,
      length  : 3,
      flag    : this.flag,
      eid     : this.eid,
    };
  }

  loadSTRUCT(reader: StructReader<this>) {
    this._no_warning = true;

    reader(this);
    super.loadSTRUCT(reader);

    this._no_warning = false;

    /* `co` is a STRUCT field, so the reader above always filled it in. */
    this.load(this.co!);
    delete this.co;

    for (let axis = 0; axis < 2; axis++) {
      if (isNaN(this[axis]!)) {
        console.warn("NaN vertex", this.eid);
        this[axis] = 0;
      }
    }

    return this;
  }

  static defineAPI(api: DataAPI<FullContext>, struct = api.mapStruct(this, true)) {
    super.defineAPI(api, struct);

    struct
      .vec3("", "co", "Co")
      .range(-100000000000000000, 100000000000000000)
      .step(0.1)
      .expRate(1.33)
      .decimalPlaces(4);
    struct
      .float("width", "width", "width")
      .range(-50, 200)
      .step(0.75)
      .expRate(2.5)
      .decimalPlaces(4)
      .on("change", function () {
        this.dataref.flag |= SplineFlags.REDRAW;
        window.redraw_viewport();
      });
    struct
      .float("shift", "shift", "shift")
      .range(-5, 5)
      .noUnits()
      .step(0.1)
      .expRate(1.33)
      .decimalPlaces(4)
      .on("change", function () {
        this.dataref.flag |= SplineFlags.REDRAW;
        window.redraw_viewport();
      });

    return struct;
  }

  static defineFlagsAPI(struct: DataStruct<FullContext, SplineElement>) {
    return super.defineFlagsAPI(struct).on("change", function () {
      this.ctx.spline.regen_sort();

      if (this.dataref !== undefined) {
        this.dataref.flag |= SplineFlags.UPDATE;
      }

      this.ctx.spline.resolve = 1;
      window.redraw_viewport();
    });
  }
}

SplineVertex.STRUCT =
  structInherit(SplineVertex, SplineElement) +
  `
  co       : vec2          | this;
  segments : array(e, int) | e.eid;
  hpair    : int           | this.hpair != undefined? this.hpair.eid : -1;
}
`;

mixin(SplineVertex, Vector2);
