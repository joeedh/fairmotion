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
    super();
    
    var first = true;
    this.start_mpos = new Vector3();
  }
  
  static tooldef() {return {
    apiname : "spline.shift_time2",
    uiname : "Shift Time2",
    
    is_modal : true,
    inputs : {
      factor       : new FloatProperty(-1, "factor", "factor", "factor"),
      vertex_eids  : new CollectionProperty([], undefined, "verts", "verts")
    },
    outputs : {},
    icon     : -1,
    description : "Move keyframes around"
  }}
  
  get_curframe_animverts(ctx) {
    var vset = new set();
    
    var spline = ctx.frameset.pathspline;
    
    for (var eid of this.inputs.vertex_eids) {
      var v = spline.eidmap[eid];
      
      if (v == undefined) {
        console.warn("ShiftTimeOp2 data corruption! v was undefined!");
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
    for (var v of this.get_curframe_animverts(ctx)) {
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
    for (var v of vset) {
      starts[v.eid] = get_vtime(v);
    }
    
    var frameset = ctx.frameset;
    var vdmap = {};
    
    for (var k in frameset.vertex_animdata) {
      var vd = frameset.vertex_animdata[k];
      
      for (var v of vd.verts) {
        vdmap[v.eid] = k;
      }
    }
    
    //console.log("time shift", off);
    
    var kcache = ctx.frameset.kcache;
    for (var v of vset) {
      var eid = vdmap[v.eid];
      var time1 = get_vtime(v);
      
      for (var i=0; i<v.segments.length; i++) {
        var s = v.segments[i], v2=s.other_vert(v),
            time2 = get_vtime(v2);
        var t1 = Math.min(time1, time2), t2 = Math.max(time1, time2);
        
        for (var j=t1; j<=t2; j++) {
          kcache.invalidate(eid, j);
        }
      }
      
      set_vtime(v, starts[v.eid]+off);
      kcache.invalidate(eid, starts[v.eid]+off);

      v.dag_update("depend");
    }
    
    for (var v of vset) {
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

export class ShiftTimeOp3 extends ToolOp {
  constructor() {
    super();
    
    var first = true;
    this.start_mpos = new Vector3();
  }
  
  static tooldef() {return {
    apiname : "spline.shift_time3",
    uiname : "Shift Time",
    
    is_modal : true,
    inputs : {
      factor: new FloatProperty(-1, "factor", "factor", "factor"),
      phantom_ids: new CollectionProperty([], undefined, "phantom_ids", "phantom_ids")
    },
    outputs : {},
    icon     : -1,
    description : "Move keyframes around"
  }}
  
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
    
    this.do_undo(this.modal_ctx, true);
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
    
    for (var id of this.inputs.phantom_ids.data) {
      ud[id] = get_time(ctx, id);
    }
  }
  
  do_undo(ctx, no_download=false) {
    for (var k in this._undo) {
      set_time(ctx, k, this._undo[k]);
    }
    
    if (!no_download)
      ctx.frameset.download();
  }
  
  undo(ctx) {
    this.do_undo(ctx);
  }
  
  exec(ctx) {
    var spline = ctx.frameset.pathspline;
    var starts = {};
    var off = this.inputs.factor.data;
    
    var ids = this.inputs.phantom_ids.data;
    for (var id of ids) {
      starts[id] = get_time(ctx, id);
    }
    
    var frameset = ctx.frameset;
    var vdmap = {};
    
    for (var k in frameset.vertex_animdata) {
      var vd = frameset.vertex_animdata[k];
      
      for (var v of vd.verts) {
        vdmap[v.eid] = k;
      }
    }
    
    //console.log("time shift", off);
    
    var kcache = ctx.frameset.kcache;
    for (var id of ids) {
      set_time(ctx, id, starts[id]+off);
    }
    
    for (var id of ids) {
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
        
        var eid = vdmap[v.eid];
        for (var j=min; j<max; j++) {
      //    kcache.invalidate(eid, j);
        }
        
        var newtime = get_vtime(v);
        
        newtime = Math.min(Math.max(newtime, min), max);
        set_vtime(v, newtime);
        
        v.dag_update("depend");
      }
    }
    
    if (!this.modal_running) {
      console.log("download");
      ctx.frameset.download();
    }
  }
}

export class SelectOpBase extends ToolOp {
  constructor() {
    super();
  }
  
  static tooldef() {return {
    inputs  : {
      phantom_ids  : new CollectionProperty([], undefined, "phantom_ids", "phantom_ids")
    },
    outputs : {}
  }}
  
  undo_pre(ctx) {
    var undo = this._undo = {};
    
    for (var id of this.inputs.phantom_ids.data) {
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

export class SelectOp extends SelectOpBase {
  constructor() {
    SelectOpBase.call(this);
    
    this.uiname = "Select";
  }
  
  static tooldef() {return {
    apiname : "spline.select_keyframe",
    uiname : "Select Keyframe",
    
    is_modal : false,
    inputs : ToolOp.inherit({
      select_ids  : new CollectionProperty([], undefined, "select_ids", "select_ids"),
      state       : new BoolProperty(true, "state"),
      unique      : new BoolProperty(true, "unique")
    }),
    
    outputs : {},
    icon     : -1,
    description : "Select keyframes"
  }}
  
  exec(ctx) {
    var state = this.inputs.state.data;
    
    if (this.inputs.unique.data) {
      for (var id of this.inputs.phantom_ids.data) {
        set_select(ctx, id, false);
      }
    }
    
    for (var id of this.inputs.select_ids.data) {
      set_select(ctx, id, state);
    }
  }
}

export class ColumnSelect extends SelectOpBase {
  constructor() {
    super();
  }
  static tooldef() {return {
    apiname : "spline.select_keyframe_column",
    uiname : "Column Select",
    
    is_modal : false,
    inputs : ToolOp.inherit({
      state       : new BoolProperty(true, "state"),
      phantom_ids  : new CollectionProperty([], undefined, "phantom_ids", "phantom_ids")
    }),
    
    outputs : {},
    icon     : -1,
    description : "Select keyframes in a single column"
  }}
  
  exec(ctx) {
    var cols = {};
    var state = this.inputs.state.data;
    
      for (var id of this.inputs.phantom_ids.data) {
      if (get_select(ctx, id))
        cols[get_time(ctx, id)] = 1;
    }
    
    for (var id of this.inputs.phantom_ids.data) {
      if (!(get_time(ctx, id) in cols))
        continue;
      
      set_select(ctx, id, state);
    }
  }
}

export class SelectKeysToSide extends SelectOpBase {
  constructor() {
    super();
  }
  
  static tooldef() {return {
    apiname : "spline.select_keys_to_side",
    uiname : "Select Keys To Side",
    
    is_modal : false,
    inputs : ToolOp.inherit({
      state       : new BoolProperty(true, "state"),
      phantom_ids  : new CollectionProperty([], undefined, "phantom_ids", "phantom_ids"),
      side        : new BoolProperty(true, "side")
    }),
    
    outputs : {},
    icon     : -1,
    description : "Select keyframes before or after the cursor"
  }}
  
  exec(ctx) {
    var state = this.inputs.state.data;
    var mintime = 1e17, maxtime = -1e17;
    
    for (var id of this.inputs.phantom_ids.data) {
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
    
    for (var id of this.inputs.phantom_ids.data) {
      var time = get_time(ctx, id);
      
      if ((side && time < maxtime) || (!side && time > mintime))
        continue;
      
      set_select(ctx, id, state);
    }
  }
}

export var mode_vals = ["select", "deselect", "auto"];

export class ToggleSelectOp extends SelectOpBase {
  constructor(mode="auto") {
    super();
    
    this.inputs.mode.set_data(mode);
  }
  
  static tooldef() {return {
    apiname : "spline.toggle_select_keys",
    uiname : "Select Keyframe Selection",
    
    is_modal : false,
    inputs : ToolOp.inherit({
      phantom_ids : new CollectionProperty([], undefined, "phantom_ids", "phantom ids"),
      mode        : new EnumProperty("auto", mode_vals, "mode", "Mode", "mode")
    }),
    
    outputs : {},
    icon     : -1,
    description : "Select all keyframes, or deselect them if already selected"
  }}
  
  exec(ctx) {
    var mode = this.inputs.mode.data;
    
    if (mode == "auto") {
      mode = "select";
      
      for (var id of this.inputs.phantom_ids.data) {
        if (get_select(ctx, id))
          mode = "deselect";
      }
    }
    
    mode = mode == "select" ? true : false;
    for (var id of this.inputs.phantom_ids.data) {
      set_select(ctx, id, mode);
    }
  }
}


export class DeleteKeyOp extends ToolOp {
  constructor() {
    super();
  }
  
  static tooldef() {return {
    apiname : "spline.delete_key",
    uiname : "Delete Keyframe",
    
    is_modal : false,
    inputs : {
      phantom_ids : new CollectionProperty([], undefined, "phantom_ids", "phantom ids")
    },
    
    outputs : {},
    icon     : -1,
    description : "Delete a keyframe"
  }}
  
  exec(ctx) {
    for (var id of this.inputs.phantom_ids.data) {
      if (get_select(ctx, id)) {
        //console.log("deleting!", id & 65535);
        delete_key(ctx, id);
      }
    }
  }
};
