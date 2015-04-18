"use strict";

import {
  MinMax
} from 'mathlib';

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
  
  static undo(ToolContext ctx, ObjLit undo_obj) {
  }
  
  static update(ToolContext ctx, TransData td) {
  }
  
  static calc_prop_distances(ToolContext ctx, TransData td, Array<TransDataItem> data) {
  }
  
  static gen_data(ToolContext ctx, TransData td, Array<TransDataItem> data) {
  }
  
  //this one gets a modal context
  static calc_draw_aabb(Context, TransData td, MinMax minmax) {
  }
  
  static aabb(ToolContext ctx, TransData td, TransDataItem item, MinMax minmax, selected_only) {
  }
}
