"use strict";

import {
  MinMax
} from '../../util/mathlib.js';

export class TransDataItem {
  constructor(Object data, TransDataType type, Object start_data) {
    this.data = data;
    this.start_data = start_data;
    
    this.type = type;
    
    //for proportional transform (magnet tool)
    this.w = 1; 
    this.dis = -1;
  }
}

export class TransDataType {
  static apply(ToolContext ctx, TransData td, TransDataItem item, Matrix4 mat, float w) {
  }
  
  static undo_pre(ToolContext ctx, TransData td, ObjLit undo_obj) {
  }

  static getDataPath(ctx : ToolContext, td : TransData, ti : TransDataItem) {

  }

  static undo(ToolContext ctx, ObjLit undo_obj) {
  }
  
  static update(ToolContext ctx, TransData td) {
  }
  
  static calc_prop_distances(ToolContext ctx, TransData td, Array<TransDataItem> data) {
  }
  
  static gen_data(ToolContext ctx, TransData td, Array<TransDataItem> data) {
  }

  static iter_data(ToolContext ctx, TransData td) {
    let data = [];
    this.gen_data(ctx, td, data);

    return data;
  }

  //this one gets a modal context
  static calc_draw_aabb(Context, TransData td, MinMax minmax) {
  }
  
  static aabb(ToolContext ctx, TransData td, TransDataItem item, MinMax minmax, selected_only) {
  }
}
TransDataType.selectmode = -1;

export class TransData {
  constructor(ctx, top : TransformOp, datamode : int) {
    this.ctx = ctx;
    this.top = top;
    this.datamode = datamode;

    this.edit_all_layers = top.inputs.edit_all_layers.data;

    this.layer = ctx.spline.layerset.active;
    this.types = top.types;
    this.data = new GArray();
    this.undodata = {};

    this.doprop = top.inputs.proportional.data;
    this.propradius = top.inputs.propradius.data;

    this.center = new Vector3();
    this.start_center = new Vector3();

    this.minmax = new MinMax(3);

    for (var t of this.types) {
      if (datamode & t.selectmode) {
        t.gen_data(ctx, this, this.data);
      }
    }

    if (this.doprop)
      this.calc_propweights();

    for (var d of this.data) {
      d.type.aabb(ctx, this, d, this.minmax, true);
    }

    if (top.inputs.use_pivot.data) {
      this.center.load(top.inputs.pivot.data);
    } else {
      this.center.load(this.minmax.max).add(this.minmax.min).mulScalar(0.5);
    }

    this.start_center.load(this.center);

    if (top.modal_running) {
      this.scenter = new Vector3(this.center);
      this.start_scenter = new Vector3(this.start_center);

      ctx.view2d.project(this.scenter);
      ctx.view2d.project(this.start_scenter);
    }
  }

  calc_propweights(radius=this.propradius) {
    this.propradius = radius;

    for (var t of this.types) {
      if (t.selectmode & this.datamode)
        t.calc_prop_distances(this.ctx, this, this.data);
    }

    var r = radius;
    for (var tv of this.data) {
      if (tv.dis == -1)
        continue;

      tv.w = tv.dis > r ? 0 : 1.0 - tv.dis/r;
    }
  }
}
