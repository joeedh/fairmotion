import {
  MinMax
} from '../../util/mathlib.js';

import {SelMask} from './selectmode.js';

import {SplineFlags, SplineTypes} from '../../curve/spline_types.js';
import {ToolOp, ModalStates} from '../../core/toolops_api.js';

import {TransDataItem, TransDataType} from './transdata.js';

import {clear_jobs, clear_jobs_except_latest, clear_jobs_except_first,
  JobTypes} from '../../wasm/native_api.js';
import {TransData, TransDataType} from "./transdata.js";

var _tsv_apply_tmp1 = new Vector2();
var _tsv_apply_tmp2 = new Vector2();
var post_mousemove_cachering = cachering.fromConstructor(Vector2, 64);
var mousemove_cachering = cachering.fromConstructor(Vector2, 64);

export class TransSplineVert extends TransDataType {
  static apply(ctx : ToolContext, td : TransData, item : TransDataItem, mat : Matrix4, w : float,
               scaleWidths : boolean = false) {
    var co = _tsv_apply_tmp1;
    var v = item.data;

    let lscale = 1.0;
    if (scaleWidths) {
      let xscale = Math.sqrt(mat.$matrix.m11*mat.$matrix.m11 + mat.$matrix.m12*mat.$matrix.m12);
      let yscale = Math.sqrt(mat.$matrix.m21*mat.$matrix.m21 + mat.$matrix.m22*mat.$matrix.m22);

      lscale = (xscale + yscale)*0.5;
    }

    if (w === 0.0) return;

    co.load(item.start_data.co);
    co.multVecMatrix(mat);

    v.load(co).sub(item.start_data.co).mulScalar(w).add(item.start_data.co);
    v.flag |= SplineFlags.UPDATE|SplineFlags.REDRAW|SplineFlags.FRAME_DIRTY;

    if (v.type === SplineTypes.HANDLE) {
      var seg = v.owning_segment;

      seg.update();
      seg.flag |= SplineFlags.FRAME_DIRTY;
      seg.v1.flag |= SplineFlags.UPDATE;
      seg.v2.flag |= SplineFlags.UPDATE;

      var hpair = seg.update_handle(v);

      if (hpair !== undefined) {
        hpair.flag |= SplineFlags.FRAME_DIRTY;
      }
    } else {
      //remember that SplineVertex.prototype.width is actually a dynamic property
      //that reads/modifies the widths in each segment in v.segments
      if (scaleWidths) {
        v.width = item.start_data.width;
        v.width *= lscale;
        console.log("LSCALE", lscale);
      }

      for (let s of v.segments) {
        s.flag |= SplineFlags.FRAME_DIRTY;
        s.h1.flag |= SplineFlags.FRAME_DIRTY;
        s.h2.flag |= SplineFlags.FRAME_DIRTY;

        s.update();

        let hpair = s.update_handle(s.handle(v));
        if (hpair !== undefined) {
          hpair.flag |= SplineFlags.FRAME_DIRTY;
        }
      }
    }
  }

  static getDataPath(ctx : ToolContext, td : TransData, ti : TransDataItem) {
    return `spline.verts[${ti.data.eid}]`;
  }

  static undo_pre(ctx : ToolContext, td : TransData, undo_obj : ObjLit) {
    var doneset = new set();
    var undo = [];
    let segundo = [];

    function push_vert(v : SplineVertex) {
      if (doneset.has(v))
        return;

      doneset.add(v);

      undo.push(v.eid);
      undo.push(v[0]);
      undo.push(v[1]);
    }

    //saves segment widths
    function push_seg(s : SplineSegment) {
      if (doneset.has(s)) {
        return;
      }

      doneset.add(s);
      segundo.push(s.eid);

      segundo.push(s.w1);
      segundo.push(s.w2);
    }

    for (var i=0; i<td.data.length; i++) {
      var d = td.data[i];

      if (d.type !== TransSplineVert) continue;

      var v = d.data;

      //make sure we get all handles that might be affected by this one
      if (v.type === SplineTypes.HANDLE) {
        if (v.hpair !== undefined) {
          push_vert(v.hpair);
        }

        if (v.owning_vertex !== undefined && v.owning_vertex.segments.length === 2) {
          let ov = v.owning_vertex;

          for (let s of ov.segments) {
            push_vert(s.h1);
            push_vert(s.h2);

            push_seg(s);
          }
        } else if (v.owning_vertex === undefined) {
          console.warn("Orphaned handle!", v.eid, v);
        }
      } else {
        for (let s of v.segments) {
          push_seg(s);
        }
      }

      push_vert(v);
    }

    undo_obj['sseg'] = segundo;
    undo_obj['svert'] = undo;
  }

  static undo(ctx : ToolContext, undo_obj : ObjLit) {
    var spline = ctx.spline;

    let segundo = undo_obj['sseg'];
    for (let i=0; i < segundo.length; ) {
      let eid = segundo[i++], w1 = segundo[i++], w2 = segundo[i++];

      let seg = spline.eidmap[eid];
      if (!seg) {
        console.warn("Data corruption in transform undo! Missing segment " + eid);
        continue;
      }

      let update = seg.w1 !== w1 || seg.w2 !== w2;

      if (update) {
        seg.w1 = w1;
        seg.w2 = w2;

        seg.update();
      }
    }

    let undo = undo_obj['svert'];
    let edit_all_layers = undo.edit_all_layers;

    for (let i=0; i < undo.length; ) {
      var eid = undo[i++];
      var v = spline.eidmap[eid];

      if (v === undefined) {
        console.log("Transform undo error!", eid);
        i += 4;
        continue;
      }

      v[0] = undo[i++];
      v[1] = undo[i++];

      if (v.type === SplineTypes.HANDLE && !v.use) {
        var seg = v.segments[0];

        seg.update();
        seg.flag |= SplineFlags.FRAME_DIRTY;

        seg.v1.flag |= SplineFlags.UPDATE;
        seg.v2.flag |= SplineFlags.UPDATE;
      } else if (v.type === SplineTypes.VERTEX) {
        v.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;

        for (let s of v.segments) {
          s.update();
          s.flag |= SplineFlags.FRAME_DIRTY|SplineFlags.UPDATE;
          s.h1.flag |= SplineFlags.FRAME_DIRTY|SplineFlags.UPDATE;
          s.h2.flag |= SplineFlags.FRAME_DIRTY|SplineFlags.UPDATE;
        }
      }
    }

    spline.resolve = 1;
    window.redraw_viewport();
  }

  static update(ctx : ToolContext, td : TransData) {
    var spline = ctx.spline;
    spline.resolve = 1;
  }

  static calc_prop_distances(ctx : ToolContext, td : TransData, data : Array<TransDataItem>) {
    var doprop = td.doprop;
    var proprad = td.propradius;
    var spline = ctx.spline;
    var propfacs = {};
    var shash = spline.build_shash();
    var tdmap = {};
    var layer = td.layer;
    var edit_all_layers = td.edit_all_layers;

    for (var tv of data) {
      if (tv.type !== TransSplineVert)
        continue;

      tdmap[tv.data.eid] = tv;
    }

    for (var v of spline.verts.selected.editable(ctx)) {
      shash.forEachPoint(v, proprad, function(v2, dis) {
        if (v2.flag & SplineFlags.SELECT) return;
        if (v2.hidden) return;
        if (!v2.in_layer(layer))
          return;

        if (!(v2.eid in propfacs)) {
          propfacs[v2.eid] = dis;
        }

        propfacs[v2.eid] = Math.min(propfacs[v2.eid], dis);
        v2.flag |= SplineFlags.UPDATE;
      });
    }

    for (var k in propfacs) {
      var v = spline.eidmap[k];
      var d = propfacs[k];
      var tv = tdmap[k];

      tv.dis = d;
    }
  }

  static gen_data(ctx : ToolContext, td : TransData, data : Array<TransDataItem> ) {
    var doprop = td.doprop;
    var proprad = td.propradius;

    var selmap = {};
    var spline = ctx.spline;
    var tdmap = {};
    var layer = td.layer;
    var edit_all_layers = td.edit_all_layers;

    for (var i=0; i<2; i++) {
      for (var v of i ? spline.handles.selected.editable(ctx) : spline.verts.selected.editable(ctx)) {
        var co = new Vector2(v);

        if (i) {
          var ov = v.owning_segment.handle_vertex(v);
          if (ov !== undefined && v.hidden && ov.hidden)
            continue;
        } else if (v.hidden) {
          continue;
        }

        selmap[v.eid] = 1;

        let width = i ? 0.0 : v.width;

        var td = new TransDataItem(v, TransSplineVert, {co : co, width : width});

        data.push(td);
        tdmap[v.eid] = td;
      }
    }

    if (!doprop) return;

    var propfacs = {};
    var shash = spline.build_shash();

    for (var si=0; si<2; si++) {
      var list = si ? spline.handles : spline.verts;

      for (var v of list) {
        //only do active layer
        if (!edit_all_layers && !v.in_layer(layer))
          continue;

        if (si) {
          var ov = v.owning_segment.handle_vertex(v);
          if (ov !== undefined && v.hidden && ov.hidden)
            continue;
        } else if (v.hidden) {
          continue;
        }

        if (v.eid in selmap) continue;

        var co = new Vector2(v);
        let width = si ? 0.0 : v.width;

        var td = new TransDataItem(v, TransSplineVert, {co, width});
        data.push(td);

        td.dis = 10000;
        tdmap[v.eid] = td;
      }
    }

    for (var v of spline.verts.selected.editable(ctx)) {
      shash.forEachPoint(v, proprad, function(v2, dis) {
        if (v2.flag & SplineFlags.SELECT) return;

        if (!edit_all_layers && !v2.in_layer(layer))
          return;

        if (v2.type === SplineTypes.HANDLE && v2.hidden && (v2.owning_vertex === undefined || v2.owning_vertex.hidden))
          return
        if (v2.type === SplineTypes.VERTEX && v2.hidden)
          return;

        //console.log("v2!", v2.eid, dis);

        if (!(v2.eid in propfacs)) {
          propfacs[v2.eid] = dis;
        }

        propfacs[v2.eid] = Math.min(propfacs[v2.eid], dis);
        v2.flag |= SplineFlags.UPDATE;

        for (var i=0; i<v2.segments.length; i++) {
          v2.segments[i].update();
        }
      });
    }

    for (var k in propfacs) {
      var v = spline.eidmap[k];
      var d = propfacs[k];
      var tv = tdmap[k];

      tv.dis = d;
    }
  }

  //this one gets a modal context
  static calc_draw_aabb(ctx : Context, td : TransData, minmax : MinMax) {
    var vset = {};
    var sset = {};
    var hset = {};

    for (var i=0; i<td.data.length; i++) {
      var d = td.data[i];
      if (d.type != TransSplineVert)
        continue;

      if (d.data.type == SplineTypes.HANDLE)
        hset[d.data.eid] = 1;
    }

    function rec_walk(v : SplineVertex, depth : number) {
      if (depth > 2) return;
      if (v == undefined) return;
      if (v.eid in vset) return;

      vset[v.eid] = 1;
      minmax.minmax(v);

      for (var i=0; i<v.segments.length; i++) {
        var seg = v.segments[i];

        if (!(seg.eid in sset)) {
          sset[seg.eid] = 1;
          seg.update_aabb();

          minmax.minmax(seg._aabb[0]);
          minmax.minmax(seg._aabb[1]);
        }

        var v2 = seg.other_vert(v);

        //don't override roots
        if (v2 != undefined && (v2.flag & SplineFlags.SELECT))
          continue;

        if (v.type == SplineTypes.HANDLE && !(v.eid in hset)) {
          vset[v.eid] = 1;
        } else {
          rec_walk(seg.other_vert(v), depth+1);
        }
      }
    }

    for (var i=0; i<td.data.length; i++) {
      var d = td.data[i];
      if (d.type != TransSplineVert)
        continue;

      if (d.w <= 0.0) continue;

      var v = d.data;
      if (v.eid in vset) continue;

      if (v.type == SplineTypes.HANDLE)
        v = v.owning_vertex;

      for (var j=0; j<v.segments.length; j++) {
        var seg = v.segments[j];
        if (!seg.l)
          continue;

        var _i1=0, l = seg.l;

        do {
          var faabb = l.f._aabb;

          minmax.minmax(faabb[0]);
          minmax.minmax(faabb[1]);

          if (_i1++ > 100) {
            console.log("infinite loop!");
            break;
          }
          l = l.radial_next;
        } while (l != seg.l);
      }

      rec_walk(v, 0);
    }
  }

  static aabb(ctx : ToolContext, td : TransData, item : TransDataItem, minmax : MinMax, selected_only : bool) {
    var co = _tsv_apply_tmp2;

    if (item.w <= 0.0) return;
    if (item.data.hidden) return;

    co.load(item.data);

    minmax.minmax(co);

    for (var i=0; i<item.data.segments.length; i++) {
      var seg = item.data.segments[i];

      if (selected_only && !(item.data.flag & SplineFlags.SELECT))
        continue;

      seg.update_aabb();

      minmax.minmax(seg.aabb[0]);
      minmax.minmax(seg.aabb[1]);
    }
  }
}
TransSplineVert.selectmode = SelMask.TOPOLOGY;
