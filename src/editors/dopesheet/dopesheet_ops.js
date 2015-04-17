"use strict";

import {
  CollectionProperty, IntProperty, FloatProperty, BoolProperty,
  EnumProperty
} from 'toolprops';

import {ToolOp, UndoFlags} from 'toolops_api';

import {TimeDataLayer, get_vtime, set_vtime,
        AnimKey, AnimChannel, AnimKeyFlags, AnimInterpModes
       } from 'animdata';
       
import {
  get_time, set_time, get_select, set_select, KeyTypes, FilterModes,
  delete_key
} from 'dopesheet_phantom';
    
export class ShiftTimeOp2 extends ToolOp {
  constructor() {
    ToolOp.call(this, "shift_time", "shift time", "shift time");
    
    this.is_modal = true;
    var first = true;
    this.start_mpos = new Vector3();
  }
  
  get_curframe_animverts(ctx) {
    var vset = new set();
    
    var spline = ctx.frameset.pathspline;
    
    for (var eid in this.inputs.vertex_eids) {
      var v = spline.eidmap[eid];
      
      if (v == undefined) {
        console.log("ShiftTimeOp2 data corruption! v was undefined!");
        continue;
      }
      
      vset.add(v);
    }
    
    return vset;
  }
  
  start_modal(ctx) {
    this.first = true;
  }
  
  end_modal(ctx) {
    ToolOp.prototype.end_modal.call(this);
  }
  
  cancel(ctx) {
  }
  
  finish(ctx) {
    ctx.scene.change_time(ctx, this.start_time);
  }
  
  on_mousemove(event) {
    //console.log("mousemove!");
    
    if (this.first) {
      this.start_mpos.load([event.x, event.y, 0]);
      this.first = false;
    }
    
    var mpos = new Vector3([event.x, event.y, 0]);
    var dx = -Math.floor(1.5*(this.start_mpos[0] - mpos[0])/20+0.5);
    
    //console.log("time offset", dx);
    
    this.undo(this.modal_ctx);
    this.inputs.factor.set_data(dx);
    
    this.exec(this.modal_ctx);
  }
  
  on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Escape"]:
        this.cancel(this.modal_ctx);
      case charmap["Return"]:
      case charmap["Space"]:
        this.finish(this.modal_ctx);
        this.end_modal();
    }
  }
  
  on_mouseup(event) {
   var ctx = this.modal_ctx;

   this.end_modal();
   
   ctx.frameset.download();
   window.redraw_viewport();
  }
  
  undo_pre(ctx) {
    var ud = this._undo = {};
    for (var v in this.get_curframe_animverts(ctx)) {
      ud[v.eid] = get_vtime(v);
    }
  }
  
  undo(ctx) {
    var spline = ctx.frameset.pathspline;
    
    for (var k in this._undo) {
      var v = spline.eidmap[k], time = this._undo[k];
      
      set_vtime(v, time);
      v.dag_update("depend");
    }
    
    ctx.frameset.download();
  }
  
  exec(ctx) {
    var spline = ctx.frameset.pathspline;
    var starts = {};
    var off = this.inputs.factor.data;
    
    var vset = this.get_curframe_animverts(ctx);
    for (var v in vset) {
      starts[v.eid] = get_vtime(v);
    }
    
    //console.log("time shift", off);
    
    for (var v in vset) {
      set_vtime(v, starts[v.eid]+off);
      
      v.dag_update("depend");
    }
    
    for (var v in vset) {
      var min=undefined, max=undefined;
      
      if (v.segments.length == 1) {
        var s = v.segments[0];
        var v2 = s.other_vert(v);
        var t1 =  get_vtime(v), t2 = get_vtime(v2);
        
        if (t1 < t2) {
          min = 0, max = t2;
        } else if (t1 == t2) {
          min = max = t1;
        } else {
          min = t1, max = 100000;
        }
      } else if (v.segments.length == 2) {
        var v1 = v.segments[0].other_vert(v);
        var v2 = v.segments[1].other_vert(v);
        
        var t1 = get_vtime(v1), t2 = get_vtime(v2);
        min = Math.min(t1, t2), max = Math.max(t1, t2);
      } else {
        min = 0;
        max = 100000;
      }
      
      var newtime = get_vtime(v);
      
      newtime = Math.min(Math.max(newtime, min), max);
      set_vtime(v, newtime);
      
      v.dag_update("depend");
    }
    
    if (!this.modal_running) {
      ctx.frameset.download();
    }
  }
}

ShiftTimeOp2.inputs = {
  factor       : new FloatProperty(-1, "factor", "factor", "factor"),
  vertex_eids  : new CollectionProperty([], undefined, "verts", "verts")
}

export class ShiftTimeOp3 extends ToolOp {
  constructor() {
    ToolOp.call(this, "shift_time", "shift time", "shift time");
    
    this.is_modal = true;
    var first = true;
    this.start_mpos = new Vector3();
  }
  
  
  start_modal(ctx) {
    this.first = true;
  }
  
  end_modal(ctx) {
    ToolOp.prototype.end_modal.call(this);
  }
  
  cancel(ctx) {
  }
  
  finish(ctx) {
    ctx.scene.change_time(ctx, this.start_time);
  }
  
  on_mousemove(event) {
    //console.log("mousemove!");
    
    if (this.first) {
      this.start_mpos.load([event.x, event.y, 0]);
      this.first = false;
    }
    
    var mpos = new Vector3([event.x, event.y, 0]);
    var dx = -Math.floor(1.5*(this.start_mpos[0] - mpos[0])/20+0.5);
    
    //console.log("time offset", dx);
    
    this.undo(this.modal_ctx);
    this.inputs.factor.set_data(dx);
    
    this.exec(this.modal_ctx);
  }
  
  on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Escape"]:
        this.cancel(this.modal_ctx);
      case charmap["Return"]:
      case charmap["Space"]:
        this.finish(this.modal_ctx);
        this.end_modal();
    }
  }
  
  on_mouseup(event) {
   var ctx = this.modal_ctx;

   this.end_modal();
   
   ctx.frameset.download();
   window.redraw_viewport();
  }
  
  undo_pre(ctx) {
    var ud = this._undo = {};
    
    for (var id in this.inputs.phantom_ids.data) {
      ud[id] = get_time(ctx, id);
    }
  }
  
  undo(ctx) {
    for (var k in this._undo) {
      set_time(ctx, k, this._undo[k]);
    }
    
    ctx.frameset.download();
  }
  
  exec(ctx) {
    var spline = ctx.frameset.pathspline;
    var starts = {};
    var off = this.inputs.factor.data;
    
    var ids = this.inputs.phantom_ids.data;
    for (var id in ids) {
      starts[id] = get_time(ctx, id);
    }
    
    //console.log("time shift", off);
    
    for (var id in ids) {
      set_time(ctx, id, starts[id]+off);
    }
    
    for (var id in ids) {
      var min=undefined, max=undefined;
      
      if (id & KeyTypes.PATHSPLINE) {
        var v = ctx.frameset.pathspline.eidmap[id & KeyTypes.CLEARMASK];
        
        if (v.segments.length == 1) {
          var s = v.segments[0];
          var v2 = s.other_vert(v);
          var t1 =  get_vtime(v), t2 = get_vtime(v2);
          
          if (t1 < t2) {
            min = 0, max = t2;
          } else if (t1 == t2) {
            min = max = t1;
          } else {
            min = t1, max = 100000;
          }
        } else if (v.segments.length == 2) {
          var v1 = v.segments[0].other_vert(v);
          var v2 = v.segments[1].other_vert(v);
          
          var t1 = get_vtime(v1), t2 = get_vtime(v2);
          min = Math.min(t1, t2), max = Math.max(t1, t2);
        } else {
          min = 0;
          max = 100000;
        }
        
        var newtime = get_vtime(v);
        
        newtime = Math.min(Math.max(newtime, min), max);
        set_vtime(v, newtime);
        
        v.dag_update("depend");
      }
    }
    
    if (!this.modal_running) {
      ctx.frameset.download();
    }
  }
}

ShiftTimeOp3.inputs = {
  factor       : new FloatProperty(-1, "factor", "factor", "factor"),
  phantom_ids  : new CollectionProperty([], undefined, "phantom_ids", "phantom_ids")
}

export class SelectOpBase extends ToolOp {
  constructor() {
    ToolOp.call(this);
  }
  
  undo_pre(ctx) {
    var undo = this._undo = {};
    
    for (var id in this.inputs.phantom_ids.data) {
      undo[id] = get_select(ctx, id);
    }
  }
  
  undo(ctx) {
    var undo = this._undo;
    
    for (var id in undo) {
      set_select(ctx, id, undo[id]);
    }
  }
}
SelectOpBase.inputs = {
  phantom_ids  : new CollectionProperty([], undefined, "phantom_ids", "phantom_ids")
}

export class SelectOp extends SelectOpBase {
  constructor() {
    SelectOpBase.call(this);
    
    this.uiname = "Select";
  }
  
  exec(ctx) {
    var state = this.inputs.state.data;
    
    if (this.inputs.unique.data) {
      for (var id in this.inputs.phantom_ids.data) {
        set_select(ctx, id, false);
      }
    }
    
    for (var id in this.inputs.select_ids.data) {
      set_select(ctx, id, state);
    }
  }
}

SelectOp.inputs = ToolOp.inherit_inputs(SelectOpBase, {
  select_ids  : new CollectionProperty([], undefined, "select_ids", "select_ids"),
  state       : new BoolProperty(true, "state"),
  unique      : new BoolProperty(true, "unique")
});

export class ColumnSelect extends SelectOpBase {
  constructor() {
    SelectOpBase.call(this);
  }
  
  exec(ctx) {
    var cols = {};
    var state = this.inputs.state.data;
    
      for (var id in this.inputs.phantom_ids.data) {
      if (get_select(ctx, id))
        cols[get_time(ctx, id)] = 1;
    }
    
    for (var id in this.inputs.phantom_ids.data) {
      if (!(get_time(ctx, id) in cols))
        continue;
      
      set_select(ctx, id, state);
    }
  }
}

ColumnSelect.inputs = ToolOp.inherit_inputs(SelectOpBase, {
  state       : new BoolProperty(true, "state"),
  phantom_ids  : new CollectionProperty([], undefined, "phantom_ids", "phantom_ids")
});

export class SelectKeysToSide extends SelectOpBase {
  constructor() {
    SelectOpBase.call(this);
  }
  
  exec(ctx) {
    var state = this.inputs.state.data;
    var mintime = 1e17, maxtime = -1e17;
    
    for (var id in this.inputs.phantom_ids.data) {
      if (!get_select(ctx, id))
        continue;
      
      var time = get_time(ctx, id);
      
      mintime = Math.min(mintime, time);
      maxtime = Math.max(maxtime, time);
    }
    
    if (mintime == 1e17) {
      mintime = maxtime = ctx.scene.time;
    }
    
    var side = this.inputs.side.data;
    
    for (var id in this.inputs.phantom_ids.data) {
      var time = get_time(ctx, id);
      
      if ((side && time < maxtime) || (!side && time > mintime))
        continue;
      
      set_select(ctx, id, state);
    }
  }
}

SelectKeysToSide.inputs = ToolOp.inherit_inputs(SelectOpBase, {
  state       : new BoolProperty(true, "state"),
  phantom_ids  : new CollectionProperty([], undefined, "phantom_ids", "phantom_ids"),
  side        : new BoolProperty(true, "side")
});

export class ToggleSelectOp extends SelectOpBase {
  constructor(mode="auto") {
    SelectOpBase.call(this);
    
    this.inputs.mode.set_data(mode);
  }
  
  exec(ctx) {
    var mode = this.inputs.mode.data;
    
    if (mode == "auto") {
      mode = "select";
      
      for (var id in this.inputs.phantom_ids.data) {
        if (get_select(ctx, id))
          mode = "deselect";
      }
    }
    
    mode = mode == "select" ? true : false;
    for (var id in this.inputs.phantom_ids.data) {
      set_select(ctx, id, mode);
    }
  }
}

export var mode_vals = ["select", "deselect", "auto"];
ToggleSelectOp.inputs = ToolOp.inherit_inputs(SelectOpBase, {
  phantom_ids : new CollectionProperty([], undefined, "phantom_ids", "phantom ids"),
  mode        : new EnumProperty("auto", mode_vals, "mode", "Mode", "mode")
});


export class DeleteKeyOp extends ToolOp {
  constructor() {
    ToolOp.call(this);
  }
  
  exec(ctx) {
    for (var id in this.inputs.phantom_ids.data) {
      if (get_select(ctx, id)) {
        console.log("deleting!", id & 65535);
        delete_key(ctx, id);
      }
    }
  }
};

DeleteKeyOp.inputs = ToolOp.inherit_inputs(ToolOp, {
  phantom_ids : new CollectionProperty([], undefined, "phantom_ids", "phantom ids")
});
