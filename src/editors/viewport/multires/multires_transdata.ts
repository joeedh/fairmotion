"use strict";

import {SelMask} from '../selectmode.js';
import {compose_id, decompose_id, has_multires, ensure_multires,
        MultiResLayer, iterpoints, MResFlags, isSegment,
        BoundPoint} from '../../../curve/spline_multires.js';

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

/* What MResTransData puts in each item: the point, and its start position. */
export type MResTransItem = TransDataItem<BoundPoint, Vector3>;

/* td.data mixes items from every backend at once; the ones this backend made
   all carry a BoundPoint. */
function tdPoint(item : TransDataItem) : BoundPoint {
  return (item.data instanceof BoundPoint ? item.data : undefined)!;
}

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

      var mr = seg.cdata.get_layer(MultiResLayer)!;
      for (var p of mr.points(actlevel)) {
        if (!(p.flag & MResFlags.SELECT))
          continue;

        p = mr.get(p.id, true); //second argument allocates fixed BoundPoint

        /* BoundPoint has only [0] and [1] accessors, so the old
           `new Vector3(p)` picked up an undefined z that became 0 anyway. */
        var co = new Vector3([p[0], p[1], 0.0]);

        var tdi = new TransDataItem(p, MResTransData, co);
        data.push(tdi);
      }
    }
  }

  static apply(ctx : FullContext, td : TransData, item : MResTransItem,
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
    var elem = ctx.spline.eidmap[p.seg];
    var seg = (isSegment(elem) ? elem : undefined)!;

    p.mr!.recalc_wordscos(seg);
  }

  static undo_pre(ctx : FullContext, td : TransData, undo_obj : TransUndoData) {
    var ud : number[] = [];
    var spline = ctx.spline;
    var actlayer = spline.layerset.active;
    var doprop = td.doprop;

    if (!has_multires(spline))
      return;

    for (var seg of spline.segments) {
      if (seg.hidden) continue;
      if (!(actlayer.id in seg.layers)) continue;

      var mr = seg.cdata.get_layer(MultiResLayer)!;

      /* NOTE: this said `of mr.points`, iterating the method object itself --
         a TypeError every time undo_pre ran.  gen_data works the active level,
         so that is the level whose points need saving. */
      for (var p of mr.points(spline.actlevel)) {
        if (!doprop && !(p.flag & MResFlags.SELECT)) continue;

        ud.push(compose_id(seg.eid, p.id));
        ud.push(p[0]);
        ud.push(p[1]);
      }
    }

    undo_obj.mr_undo = ud;
  }

  static undo(ctx : FullContext, undo_obj : TransUndoData) {
    var ud = undo_obj.mr_undo!;
    var spline = ctx.spline;

    var i = 0;
    while (i < ud.length) {
      var pid = ud[i++];
      var x = ud[i++];
      var y = ud[i++];

      var segid = decompose_id(pid)[0];
      var pointid = decompose_id(pid)[1];

      var elem = spline.eidmap[segid];
      var seg = (isSegment(elem) ? elem : undefined)!;

      var mr = seg.cdata.get_layer(MultiResLayer)!;
      var p = mr.get(pointid);

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

      var p = tdPoint(t);
      var elem = spline.eidmap[p.seg];
      var seg = (isSegment(elem) ? elem : undefined)!;

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

      co[0] = p[0];
      co[1] = p[1];

      do_minmax(co);

      co[0] -= p.offset[0];
      co[1] -= p.offset[1];

      do_minmax(co);
    }
  }

  static aabb(ctx : FullContext, td : TransData, item : MResTransItem,
              minmax : MinMax, selected_only : boolean) {
    const co = _aabb_co;
    co.zero();

    for (var i=0; i<td.data.length; i++) {
      var t = td.data[i];
      if (t.type !== MResTransData) continue;

      var p = tdPoint(t);

      co[0] = p[0];
      co[1] = p[1];

      minmax.minmax(co);
    }
  }
}
/* NOTE: SelMask.MULTIRES was commented out of selectmode.ts ("not used
   anymore, slot now used by sceneobject"), so this read undefined and every
   `datamode & t.selectmode` test came out 0 -- MResTransData has never
   contributed transform data.  0 keeps that exactly. */
MResTransData.selectmode = 0;
