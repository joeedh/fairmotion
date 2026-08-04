"use strict";

import {
  MinMax
} from '../../util/mathlib.js';

import {TransDataItem, TransDataType} from '../viewport/transdata.js';
import {get_vtime, set_vtime} from '../../core/animdata.js';
import type {TransData, TransUndoData} from '../viewport/transdata.js';
import type {FullContext} from '../../core/context.js';
import type {SplineVertex} from '../../curve/spline_types.js';
//import {ScreenArea, Area} from 'ScreenArea';

class TransKey {
  v : SplineVertex;
  /* The key's time before the transform started, for undo. */
  start_time : number;

  constructor(v : SplineVertex) {
    this.v = v;
    this.start_time = get_vtime(v);
  }
}

export class TransDopeSheetType {
  static apply(ctx : FullContext, td : TransData, item : TransDataItem,
               mat : Matrix4, w : number) {
  }

  static undo_pre(ctx : FullContext, td : TransData, undo_obj : TransUndoData) {
  }

  static undo(ctx : FullContext, undo_obj : TransUndoData) {
  }

  static update(ctx : FullContext, td : TransData) {
    var fs = ctx.frameset;

    fs.check_vdata_integrity();
  }

  static calc_prop_distances(ctx : FullContext, td : TransData,
                             data : TransDataItem[]) {
  }

  static gen_data(ctx : FullContext, td : TransData, data : TransDataItem[]) {
    var doprop = td.doprop;
    var proprad = td.propradius;

    var vs = new set();

    for (var eid of td.top.inputs.data) {
      var v = ctx.frameset.pathspline.eidmap[eid];

      if (v == undefined) {
        console.log("WARNING: transdata corruption in dopesheet!!");
        /* NOTE: `continuel` is a typo for `continue` -- it parses as a
           reference to an undeclared name and throws a ReferenceError. */
        continuel
      }

      vs.add(v);
    }

    for (var v of vs) {
      var titem = new TransDataItem(v, TransDopeSheetType, get_vtime(v));
      data.push(titem);
    }
  }

  //for calc_draw_aabb()
  /* NOTE: neither ScreenArea nor DopeSheetEditor is imported in this file
     (the ScreenArea import is commented out above), so this throws. */
  static find_dopesheet(ctx : FullContext) {
    var active = ctx.screen.active;
    if (active instanceof ScreenArea && active.editor instanceof DopeSheetEditor) {
      return active;
    }

    for (var c of ctx.screen.children) {
      if (c instanceof ScreenArea && c.editor instanceof DopeSheetEditor)
        return c;
    }
  }

  //this one gets a modal context
  static calc_draw_aabb(ctx : FullContext, td : TransData, minmax : MinMax) {
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

  static aabb(ctx : FullContext, td : TransData, item : TransDataItem,
              minmax : MinMax, selected_only : boolean) {
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
