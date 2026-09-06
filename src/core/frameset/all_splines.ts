/* Iterates every Spline a frameset owns: the frame splines first, then the
   per-vertex animation splines hanging off the pathspline.

   `sel_only` narrows the second stage to the vertices that are selected and
   visible, which is what the animation-path tools work over. */

import { SplineFlags } from "../../curve/spline_types.js";

import type { Spline } from "../../curve/spline.js";
import type { SplineFrameSet } from "./frameset.js";

export class AllSplineIter {
  /* Walks the frame splines first (stage 0), then the vertex-animation
     splines (stage 1); undefined once both are exhausted. */
  iter?: Iterator<Spline>;
  f: SplineFrameSet;
  sel_only?: boolean;
  stage: number;

  constructor(f: SplineFrameSet, sel_only?: boolean) {
    this.f = f;
    this.iter = undefined;
    this.stage = 0;
    this.sel_only = sel_only;

    this.load_iter();
  }

  load_iter() {
    this.iter = undefined;
    let f = this.f;

    if (this.stage === 0) {
      let arr = new GArray<Spline>();

      for (let k in f.frames) {
        let fr = f.frames[k];
        arr.push(fr.spline);
      }

      this.iter = arr[Symbol.iterator]();
    } else if (this.stage === 1) {
      //handle animation curves
      let arr = [];

      for (let k in this.f.vertex_animdata) {
        if (this.sel_only) {
          let v = this.f.spline.eidmap[k];

          if (v === undefined || !(v.flag & SplineFlags.SELECT) || v.hidden) {
            continue;
          }
        }

        arr.push(this.f.vertex_animdata[k].spline);
      }

      this.iter = arr[Symbol.iterator]();
    }
  }

  reset() {
    this.stage = 0;
    this.iter = undefined;
  }

  [Symbol.iterator]() {
    return this;
  }

  /* NOTE: on a stage transition this cleared `done` but handed back the
     exhausted iterator's undefined value, so every consumer saw a single
     undefined spline between the frame splines and the animation splines --
     and all three call sites dereference it directly. */
  next(): IteratorResult<Spline, undefined> {
    while (this.iter !== undefined) {
      let next = this.iter.next();

      if (!next.done) {
        return { done: false, value: next.value };
      }

      this.stage++;
      this.load_iter();
    }

    this.reset();

    return { done: true, value: undefined };
  }
}
