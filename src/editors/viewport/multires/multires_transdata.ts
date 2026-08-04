"use strict";

import {SelMask} from '../selectmode.js';
import {compose_id, decompose_id, has_multires, ensure_multires,
        MultiResLayer, iterpoints, MResFlags} from '../../../curve/spline_multires.js';

import {
  MinMax
} from '../../../util/mathlib.js';

import {
  TransDataType, TransDataItem
} from '../transdata.js';
import type {TransData, TransUndoData} from '../transdata.js';
import type {FullContext} from '../../../core/context.js';

/* Were `static` inside MResTransData's static methods; each method had its own,
   so they stay separate here. */
const _apply_co = new Vector3();
const _calc_draw_aabb_co = new Vector3();
const _calc_draw_aabb_co2 = [0, 0, 0];
const _aabb_co = new Vector3();

export class MResTransData extends TransDataType {
  static gen_data(ctx : FullContext, td : TransData, data : TransDataItem[]) {
    var doprop = td.doprop;
    var proprad = td.propradius;

    var spline = ctx.spline;
    var actlayer = spline.layerset.active;

    if (!has_multires(spline))
      return;

    var actlevel = spline.actlevel;

    for (var seg of spline.segments) {
      if (!(actlayer.id in seg.layers))
        continue;
      if (seg.hidden)
        continue;

      var mr = seg.cdata.get_layer(MultiResLayer);
      for (var p of mr.points(actlevel)) {
        if (!(p.flag & MResFlags.SELECT))
          continue;

        p = mr.get(p.id, true); //second argument allocates fixed BoundPoint

        var co = new Vector3(p);
        co[2] = 0.0;

        var td = new TransDataItem(p, MResTransData, co);
        data.push(td);
      }
    }
  }

  static apply(ctx : FullContext, td : TransData, item : TransDataItem,
               mat : Matrix4, w : number) {
    const co = _apply_co;
    var p = item.data;

    if (w == 0.0) return;

    co.load(item.start_data);
    co[2] = 0.0;
    co.multVecMatrix(mat);

    co.sub(item.start_data).mulScalar(w).add(item.start_data);

    p[0] = co[0];
    p[1] = co[1];

    p.recalc_offset(ctx.spline);

    //XXX test recalc_offset
    var seg = ctx.spline.eidmap[p.seg];
    p.mr.recalc_wordscos(seg);
  }

  static undo_pre(ctx : FullContext, td : TransData, undo_obj : TransUndoData) {
    var ud = [];
    var spline = ctx.spline;
    var actlayer = spline.layerset.active;
    var doprop = td.doprop;

    if (!has_multires(spline))
      return;

    for (var seg of spline.segments) {
      if (seg.hidden) continue;
      if (!(actlayer.id in seg.layers)) continue;

      var mr = seg.cdata.get_layer(MultiResLayer);
      for (var p of mr.points) {
        if (!doprop && !(p.flag & MResFlags.SELECT)) continue;

        ud.push(compose_id(seg.eid, p.id));
        ud.push(p[0]);
        ud.push(p[1]);
      }
    }

    undo_obj.mr_undo = ud;
  }

  static undo(ctx : FullContext, undo_obj : TransUndoData) {
    var ud = undo_obj.mr_undo;
    var spline = ctx.spline;

    var i = 0;
    while (i < ud.length) {
      var pid = ud[i++];
      var x = ud[i++];
      var y = ud[i++];

      var seg = decompose_id(pid)[0];
      var p = decompose_id(pid)[1];

      seg = spline.eidmap[seg];
      var mr = seg.cdata.get_layer(MultiResLayer);
      p = mr.get(p);

      p[0] = x;
      p[1] = y;
    }
  }

  static update(ctx : FullContext, td : TransData) {
  }

  static calc_prop_distances(ctx : FullContext, td : TransData,
                             data : TransDataItem[]) {
  }

  //this one gets a modal context
  static calc_draw_aabb(ctx : FullContext, td : TransData, minmax : MinMax) {
    const co = _calc_draw_aabb_co;
    co.zero();
    var pad = 15;

    const co2 = _calc_draw_aabb_co2;
    function do_minmax(co : Vector3) {
      co2[0] = co[0]-pad;
      co2[1] = co[1]-pad;

      minmax.minmax(co2);
      co2[0] += pad*2.0;
      co2[1] += pad*2.0;

      minmax.minmax(co2);
    }

    var spline = ctx.spline;

    for (var i=0; i<td.data.length; i++) {
      var t = td.data[i];
      if (t.type !== MResTransData) continue;

      var seg = spline.eidmap[t.data.seg];
      if (seg != undefined) {
        seg.update_aabb();

        minmax.minmax(seg.aabb[0]);
        minmax.minmax(seg.aabb[1]);
      }
      if (seg.v1.segments.length == 2) {
        var seg2 = seg.v1.other_segment(seg);
        seg2.update_aabb();
        minmax.minmax(seg2.aabb[0]);
        minmax.minmax(seg2.aabb[1]);
      }

      if (seg.v2.segments.length == 2) {
        var seg2 = seg.v2.other_segment(seg);
        seg2.update_aabb();
        minmax.minmax(seg2.aabb[0]);
        minmax.minmax(seg2.aabb[1]);
      }

      co[0] = t.data[0];
      co[1] = t.data[1];

      do_minmax(co);

      co[0] -= t.data.offset[0];
      co[1] -= t.data.offset[1];

      do_minmax(co);
    }
  }

  static aabb(ctx : FullContext, td : TransData, item : TransDataItem,
              minmax : MinMax, selected_only : boolean) {
    const co = _aabb_co;
    co.zero();

    for (var i=0; i<td.data.length; i++) {
      var t = td.data[i];
      if (t.type !== MResTransData) continue;

      co[0] = t.data[0];
      co[1] = t.data[1];

      minmax.minmax(co);
    }
  }
}
MResTransData.selectmode = SelMask.MULTIRES;
