import {
  MinMax
} from 'mathlib';

import {SelMask} from 'selectmode';

import {Vec3Property, BoolProperty, FloatProperty, IntProperty,
  CollectionProperty, TPropFlags, EnumProperty} from 'toolprops';

import {SplineFlags, SplineTypes} from 'spline_types';
import {ToolOp, ModalStates} from 'toolops_api';

import {TransDataItem, TransDataType} from 'transdata';
import {TransDopeSheetType} from 'dopesheet_transdata';
import {SessionFlags} from 'view2d_base';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, HotKey,
  charmap, TouchEventManager, EventHandler} from '../events';

import {clear_jobs, clear_jobs_except_latest, clear_jobs_except_first,
  JobTypes} from 'native_api';
import {TransData, TransDataType} from "./transdata";

var _tsv_apply_tmp1 = new Vector3();
var _tsv_apply_tmp2 = new Vector3();
var post_mousemove_cachering = cachering.fromConstructor(Vector3, 64);
var mousemove_cachering = cachering.fromConstructor(Vector3, 64);

export class TransSplineVert extends TransDataType {
  static apply(ctx : ToolContext, td : TransData, item : TransDataItem, mat : Matrix4, w : float) {
    var co = _tsv_apply_tmp1;
    var v = item.data;

    if (w == 0.0) return;

    co.load(item.start_data);
    co[2] = 0.0;
    co.multVecMatrix(mat);

    v.load(co).sub(item.start_data).mulScalar(w).add(item.start_data);
    v.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;

    if (v.type == SplineTypes.HANDLE) {
      var seg = v.owning_segment;

      seg.update();
      seg.flag |= SplineFlags.FRAME_DIRTY;
      seg.v1.flag |= SplineFlags.UPDATE;
      seg.v2.flag |= SplineFlags.UPDATE;

      var hpair = seg.update_handle(v);

      if (hpair != undefined) {
        hpair.flag |= SplineFlags.FRAME_DIRTY;
      }
    } else {
      for (var j=0; j<v.segments.length; j++) {
        v.segments[j].flag |= SplineFlags.FRAME_DIRTY;
        v.segments[j].h1.flag |= SplineFlags.FRAME_DIRTY;
        v.segments[j].h2.flag |= SplineFlags.FRAME_DIRTY;

        v.segments[j].update();
        var hpair = v.segments[j].update_handle(v.segments[j].handle(v));

        if (hpair != undefined) {
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

    function push_vert(v) {
      if (doneset.has(v))
        return;

      doneset.add(v);

      undo.push(v.eid);
      undo.push(v[0]);
      undo.push(v[1]);
      undo.push(v[2]);
    }

    for (var i=0; i<td.data.length; i++) {
      var d = td.data[i];

      if (d.type !== TransSplineVert) continue;

      var v = d.data;

      //make sure we get all handles that might be affected by this one
      if (v.type == SplineTypes.HANDLE) {
        if (v.hpair != undefined) {
          push_vert(v.hpair);
        }

        if (v.owning_vertex !== undefined && v.owning_vertex.segments.length == 2) {
          var ov = v.owning_vertex;
          for (var j=0; j<ov.segments.length; j++) {
            var s = ov.segments[j];

            push_vert(s.h1);
            push_vert(s.h2);
          }
        } else if (v.owning_vertex === undefined) {
          console.warn("Orphaned handle!", v.eid, v);
        }
      }

      push_vert(v);
    }

    undo_obj['svert'] = undo;
  }

  static undo(ctx : ToolContext, undo_obj : ObjLit) {
    var spline = ctx.spline;

    var i = 0;
    var undo = undo_obj['svert'];
    var edit_all_layers = undo.edit_all_layers;

    while (i < undo.length) {
      var eid = undo[i++];
      var v = spline.eidmap[eid];

      if (v == undefined) {
        console.log("Transform undo error!", eid);
        i += 4;
        continue;
      }

      v[0] = undo[i++];
      v[1] = undo[i++];
      v[2] = undo[i++];

      if (v.type == SplineTypes.HANDLE && !v.use) {
        var seg = v.segments[0];

        seg.update();
        seg.flag |= SplineFlags.FRAME_DIRTY;

        seg.v1.flag |= SplineFlags.UPDATE;
        seg.v2.flag |= SplineFlags.UPDATE;
      } else if (v.type == SplineTypes.VERTEX) {
        v.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;

        for (var j=0; j<v.segments.length; j++) {
          v.segments[j].update();
          v.segments[j].flag |= SplineFlags.FRAME_DIRTY;
          v.segments[j].h1.flag |= SplineFlags.FRAME_DIRTY;
          v.segments[j].h2.flag |= SplineFlags.FRAME_DIRTY;
        }
      }
    }

    spline.resolve = 1;
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
        var co = new Vector3(v);

        if (i) {
          var ov = v.owning_segment.handle_vertex(v);
          if (ov != undefined && v.hidden && ov.hidden)
            continue;
        } else if (v.hidden) {
          continue;
        }

        selmap[v.eid] = 1;

        var td = new TransDataItem(v, TransSplineVert, co);

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
          if (ov != undefined && v.hidden && ov.hidden)
            continue;
        } else if (v.hidden) {
          continue;
        }

        if (v.eid in selmap) continue;

        var co = new Vector3(v);
        var td = new TransDataItem(v, TransSplineVert, co);
        data.push(td);

        td.dis = 10000;
        tdmap[v.eid] = td;
      }
    }

    console.log("proprad", proprad);

    for (var v of spline.verts.selected.editable(ctx)) {
      shash.forEachPoint(v, proprad, function(v2, dis) {
        if (v2.flag & SplineFlags.SELECT) return;

        if (!edit_all_layers && !v2.in_layer(layer))
          return;

        if (v2.type == SplineTypes.HANDLE && v2.hidden && (v2.owning_vertex == undefined || v2.owning_vertex.hidden))
          return
        if (v2.type == SplineTypes.VERTEX && v2.hidden)
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

    function rec_walk(v, depth) {
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
    co[2] = 0.0;

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
