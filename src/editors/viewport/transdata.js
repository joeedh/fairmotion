"use strict";

import {
  MinMax
} from '../../util/mathlib.js';

export class TransDataItem {
  w : number;

  constructor(data : any, type : TransDataType, start_data : any) {
    this.data = data;
    this.start_data = start_data;
    
    this.type = type;
    
    //for proportional transform (magnet tool)
    this.w = 1; 
    this.dis = -1;
  }
}

export class TransDataType {
  static apply(ctx : ToolContext, td : TransData, item : TransDataItem,
               mat : Matrix4, w : number, scaleWidths : boolean) {
  }
  
  static undo_pre(ctx : ToolContext, td : TransData, undo_obj : ObjLit) {
  }

  static getDataPath(ctx : ToolContext, td : TransData, ti : TransDataItem) {

  }

  static undo(ctx : ToolContext, undo_obj : ObjLit) {
  }
  
  static update(ctx : ToolContext, td : TransData) {
  }
  
  static calc_prop_distances(ctx : ToolContext, td : TransData, data : Array<TransDataItem>) {
  }
  
  static gen_data(ctx : ToolContext, td : TransData, data: Array<TransDataItem>) {
  }

  static iter_data(ctx : ToolContext, td : TransData) {
    let data = [];
    this.gen_data(ctx, td, data);

    return data;
  }

  //this one gets a modal context
  static calc_draw_aabb(ctx : FullContext, td : TransData, minmax : MinMax) {
  }
  
  static aabb(ctx : ToolContext, td : TransData, item : TransDataItem, minmax : MinMax, selected_only) {
  }
}
TransDataType.selectmode = -1;

export class TransData {
  data : GArray
  undodata : Object
  center : Vector2
  start_center : Vector2
  minmax : MinMax
  scenter : Vector2
  start_scenter : Vector2;

  constructor(ctx : FullContext, top : TransformOp, datamode : int) {
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

    this.center = new Vector2();
    this.scenter = new Vector2(); //screen center
    this.start_center = new Vector2();

    this.minmax = new MinMax(2);

    for (let t of this.types) {
      if (datamode & t.selectmode) {
        t.gen_data(ctx, this, this.data);
      }
    }

    if (this.doprop)
      this.calc_propweights();

    for (let d of this.data) {
      d.type.aabb(ctx, this, d, this.minmax, true);
    }

    if (top.inputs.use_pivot.data) {
      this.center.load(top.inputs.pivot.data);
    } else {
      this.center.load(this.minmax.max).add(this.minmax.min).mulScalar(0.5);
    }

    this.start_center.load(this.center);

    if (top.modalRunning) {
      this.scenter = new Vector3(this.center);
      this.start_scenter = new Vector3(this.start_center);

      ctx.view2d.project(this.scenter);
      ctx.view2d.project(this.start_scenter);
    }
  }

  calc_propweights(radius : number = this.propradius) {
    this.propradius = radius;

    for (let t of this.types) {
      if (t.selectmode & this.datamode)
        t.calc_prop_distances(this.ctx, this, this.data);
    }

    let r = radius;
    for (let tv of this.data) {
      if (tv.dis === -1)
        continue;

      tv.w = tv.dis > r ? 0 : 1.0 - tv.dis/r;
    }
  }
}
