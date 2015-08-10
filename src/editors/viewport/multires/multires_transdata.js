"use strict";

import {SelMask} from 'selectmode';
import {compose_id, decompose_id, has_multires, ensure_multires,
        MultiResLayer, iterpoints, MResFlags} from 'spline_multires';
        
import {
  MinMax
} from 'mathlib';

import {
  TransDataType, TransDataItem
} from 'transdata';

export class MResTransData extends TransDataType {
  static gen_data(ToolContext ctx, TransData td, Array<TransDataItem> data) {
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
  
  static apply(ToolContext ctx, TransData td, TransDataItem item, Matrix4 mat, float w) {
    static co = new Vector3();
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
  
  static undo_pre(ToolContext ctx, TransData td, ObjLit undo_obj) {
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
  
  static undo(ToolContext ctx, ObjLit undo_obj) {
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
  
  static update(ToolContext ctx, TransData td) {
  }
  
  static calc_prop_distances(ToolContext ctx, TransData td, Array<TransDataItem> data) {
  }
  
  //this one gets a modal context
  static calc_draw_aabb(Context ctx, TransData td, MinMax minmax) {
    static co = new Vector3();
    co.zero();
    var pad = 15;
    
    static co2 = [0, 0, 0];
    function do_minmax(co) {
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
  
  static aabb(ToolContext ctx, TransData td, TransDataItem item, MinMax minmax, selected_only) {
    static co = new Vector3();
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
