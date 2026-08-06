"use strict";

import { MinMax } from "../../util/mathlib.js";

import { TransDataItem, TransDataType } from "../viewport/transdata.js";
import { get_vtime, set_vtime } from "../../core/animdata.js";
import type { TransData, TransUndoData } from "../viewport/transdata.js";
import type { FullContext } from "../../core/context.js";
import { SplineVertex } from "../../curve/spline_types.js";

class TransKey {
  v: SplineVertex;
  /* The key's time before the transform started, for undo. */
  start_time: number;

  constructor(v: SplineVertex) {
    this.v = v;
    this.start_time = get_vtime(v);
  }
}

/* What TransDopeSheetType puts in each item: the key vertex and the time it
   sat at when the transform started. */
export type DopeTransItem = TransDataItem<SplineVertex, number>;

/* NOTE: nothing ever puts this in a TransformOp's `types` list -- see
   TransformOp.ensure_transdata(), which only ever registers TransSplineVert --
   so none of the methods below have ever run. */
export class TransDopeSheetType extends TransDataType {
  static apply(ctx: FullContext, td: TransData, item: DopeTransItem, mat: Matrix4, w: number) {}

  static undo_pre(ctx: FullContext, td: TransData, undo_obj: TransUndoData) {}

  static undo(ctx: FullContext, undo_obj: TransUndoData) {}

  static update(ctx: FullContext, td: TransData) {
    var fs = ctx.frameset;

    fs.check_vdata_integrity();
  }

  static calc_prop_distances(ctx: FullContext, td: TransData, data: TransDataItem[]) {}

  static gen_data(ctx: FullContext, td: TransData, data: TransDataItem[]) {
    var doprop = td.doprop;
    var proprad = td.propradius;

    var vs = new set<SplineVertex>();

    for (var eid of td.top.inputs.data) {
      var elem = ctx.frameset.pathspline.eidmap[eid];

      if (elem == undefined) {
        console.log("WARNING: transdata corruption in dopesheet!!");
        /* NOTE: this said `continuel`, a typo that parsed as a reference to an
           undeclared name and threw a ReferenceError instead of skipping. */
        continue;
      }

      /* The eids handed in here are pathspline keyframe vertices. */
      vs.add((elem instanceof SplineVertex ? elem : undefined)!);
    }

    for (var v of vs) {
      var titem = new TransDataItem(v, TransDopeSheetType, get_vtime(v));
      data.push(titem);
    }
  }

  /* NOTE: a find_dopesheet() sat here for the commented-out calc_draw_aabb
     below.  It had no callers and was broken three ways: neither ScreenArea
     nor DopeSheetEditor was imported (so it threw a ReferenceError), Screen
     has no `active` -- the areas live on screen.sareas, which carries its own
     `active` -- and screen.children is the DOM child list, whose entries have
     no `editor`. */

  //this one gets a modal context
  static calc_draw_aabb(ctx: FullContext, td: TransData, minmax: MinMax) {
    /*
    static vec = new Vector2();
    vec[0] = 0;

    var ds = this.get_dopesheet(ctx);

    for (var i=0; i<td.data.length; i++) {
      var d = td.data[i];
      if (d.type != TransDopeSheetType)
        continue;

      var vd = ds.vdmap[v.eid];
      var y = ds.heightmap[vd.eid];

      var keybox = ds.get_vertkey(y, v, vd);

      minmax.minmax(keybox.pos);
      vec.load(keybox.pos).add(keybox.size);
      minmax.minmax(vec);
    }*/
  }

  static aabb(
    ctx: FullContext,
    td: TransData,
    item: DopeTransItem,
    minmax: MinMax,
    selected_only: boolean
  ) {
    /*
    static vec = new Vector2();
    vec[0] = 0;

    var ds = this.get_dopesheet(ctx);

    for (var i=0; i<td.data.length; i++) {
      var d = td.data[i];
      if (d.type != TransDopeSheetType)
        continue;

      var vd = ds.vdmap[v.eid];
      var y = ds.heightmap[vd.eid];

      var keybox = ds.get_vertkey(y, v, vd);

      minmax.minmax(keybox.pos);
      vec.load(keybox.pos).add(keybox.size);
      minmax.minmax(vec);
    }*/
  }
}
