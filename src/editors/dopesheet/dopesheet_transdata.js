"use strict";

import {
  MinMax
} from '../../util/mathlib.js';

import {TransDataItem, TransDataType} from '../viewport/transdata.js';
import {get_vtime, set_vtime} from '../../core/animdata.js';
//import {ScreenArea, Area} from 'ScreenArea';

class TransKey {
  constructor(v) {
    this.v = v;
    this.start_time = get_vtime(v);
  }
}

export class TransDopeSheetType {
  static apply(ToolContext ctx, TransData td, TransDataItem item, Matrix4 mat, float w) {
  }
  
  static undo_pre(ToolContext ctx, TransData td, ObjLit undo_obj) {
  }
  
  static undo(ToolContext ctx, ObjLit undo_obj) {
  }
  
  static update(ToolContext ctx, TransData td) {
    var fs = ctx.frameset;

    fs.check_vdata_integrity();
  }
  
  static calc_prop_distances(ToolContext ctx, TransData td, Array<TransDataItem> data) {
  }
  
  static gen_data(ToolContext ctx, TransData td, Array<TransDataItem> data) {
    var doprop = td.doprop;
    var proprad = td.propradius;
    
    var vs = new set();
    
    for (var eid of td.top.inputs.data) {
      var v = ctx.frameset.pathspline.eidmap[eid];
      
      if (v == undefined) {
        console.log("WARNING: transdata corruption in dopesheet!!");
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
  static find_dopesheet(ctx) {
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
  static calc_draw_aabb(ctx, TransData td, MinMax minmax) {
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
  
  static aabb(ToolContext ctx, TransData td, TransDataItem item, MinMax minmax, selected_only) {
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
