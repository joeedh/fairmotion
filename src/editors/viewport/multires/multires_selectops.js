"use strict";

import 'J3DIMath';

import {IntProperty, FloatProperty, CollectionProperty,
        BoolProperty, TPropFlags, Vec3Property} from 'toolprops';
import {ToolOp, UndoFlags, ToolFlags, ModalStates} from 'toolops_api';
import {SplineFlags, SplineTypes, RecalcFlags} from 'spline_types';
import {RestrictFlags, Spline} from 'spline';
import {TPropFlags} from 'toolprops';
import {redo_draw_sort} from 'spline_draw';

import {SplineLocalToolOp} from 'spline_editops';

import {ensure_multires, has_multires, MResFlags, 
        compose_id, decompose_id, BoundPoint, 
        MultiResLayer
       } from 'spline_multires';

class SelectOpBase extends ToolOp {
  constructor(actlevel, uiname, description, icon) {
    super(undefined, uiname, description, icon);
    
    if (actlevel != undefined)
      this.inputs.level.set_data(actlevel);
  }
  
  can_call(ctx) {
    var spline = ctx.spline;
    return has_multires(spline);
  }
  
  undo_pre(ctx) {
    var ud = this._undo = [];
    this._undo_level = this.inputs.level.data;
     
    var spline = ctx.spline;
    var actlayer = spline.layerset.active;
    var level = this.inputs.level.data;
    
    if (!has_multires(spline))
      return;
      
    //only consider visible segments inside the active layer
    for (var seg in spline.segments) {
      if (seg.hidden) continue;
      if (!(actlayer.id in seg.layers)) continue;
      
      var mr = seg.cdata.get_layer(MultiResLayer);
      for (var p in mr.points(level)) {
        if (p.flag & MResFlags.SELECT)
          ud.push(compose_id(seg.eid, p.id));
      }
    }
    
    window.redraw_viewport();
  }
  
  undo(ctx) {
    var spline = ctx.spline;
    var actlayer = spline.layerset.active;
    var level = this._undo_level;
    
    if (!has_multires(spline))
      return;
    
    //only consider visible segments inside the active layer
    for (var seg in spline.segments) {
      if (seg.hidden) continue;
      if (!(actlayer.id in seg.layers)) continue;
      
      var mr = seg.cdata.get_layer(MultiResLayer);
      for (var p in mr.points(level)) {
        p.flag &= ~MResFlags.SELECT;
        p.flag &= ~MResFlags.HIGHLIGHT;
      }
    }
    
    for (var i=0; i<this._undo.length; i++) {
      var id = this._undo[i];
      
      var seg = decompose_id(id)[0];
      var p = decompose_id(id)[1];
      
      seg = spline.eidmap[seg];
      if (seg == undefined) {
        console.trace("Eek! bad seg eid!", seg, p, id, this, this._undo);
        continue;
      }
      
      var mr = seg.cdata.get_layer(MultiResLayer);
      p = mr.get(p);
      
      p.flag |= MResFlags.SELECT;
    }
    
    window.redraw_viewport();
  }
}
SelectOpBase.inputs = {
  level : new IntProperty(0)
}

export class ToggleSelectAll extends SelectOpBase {
  constructor(int actlevel=0) {
    super(actlevel, "Select All", "Select all/none");
  }
  
  can_call(ctx) {
    var spline = ctx.spline;
    return has_multires(spline);
  }
  
  exec(ctx) {
    var spline = ctx.spline;
    var actlayer = spline.layerset.active;
    var level = this.inputs.level.data;
    
    if (!has_multires(spline))
      return;
    
    var totsel = 0;
    
    //only consider visible segments inside the active layer
    for (var seg in spline.segments) {
      if (seg.hidden) continue;
      if (!(actlayer.id in seg.layers)) continue;
      
      var mr = seg.cdata.get_layer(MultiResLayer);
      for (var p in mr.points(level)) {
        if (p.flag & MResFlags.HIDE)
          continue;
          
        totsel += p.flag & MResFlags.SELECT;
      }
    }
    
    for (var seg in spline.segments) {
      if (seg.hidden) continue;
      if (!(actlayer.id in seg.layers)) continue;
      
      var mr = seg.cdata.get_layer(MultiResLayer);
      for (var p in mr.points(level)) {
        if (p.flag & MResFlags.HIDE)
          continue;
          
        if (totsel)
          p.flag &= ~MResFlags.SELECT;
        else
          p.flag |= MResFlags.SELECT;
      }
    }
  }
}
ToggleSelectAll.inputs = {
  level : new IntProperty(0)
}

export class SelectOneOp extends SelectOpBase {
  constructor(int pid=undefined, unique=true, mode=true, int level=0) {
    super(level, "Select One", "select one element");
    
    this.inputs.unique.set_data(unique);
    this.inputs.state.set_data(mode);
    
    if (pid != undefined)
      this.inputs.pid.set_data(pid);
  }
  
  exec(ctx) {
    var spline = ctx.spline;
    var actlayer = spline.layerset.active;
    var id = this.inputs.pid.data;
    var level = this.inputs.level.data;
    
    var seg = decompose_id(id)[0];
    var p = decompose_id(id)[1];
    
    seg = spline.eidmap[seg];
    var mr = seg.cdata.get_layer(MultiResLayer);
    p = mr.get(p);
    
    if (this.inputs.unique.data) {
      //only consider visible segments inside the active layer
      for (var seg2 in spline.segments) {
        if (seg2.hidden) continue;
        if (!(actlayer.id in seg2.layers)) continue;
        
        var mr2 = seg2.cdata.get_layer(MultiResLayer);
        for (var p2 in mr2.points(level)) {
          p2.flag &= ~SplineFlags.SELECT;
        }
      }
    }
    
    var state = this.inputs.state.data;
    
    if (state && this.inputs.set_active.data) {
      var shared = spline.segments.cdata.get_shared("MultiResLayer");
      shared.active = id;
    }
    
    if (state) {
      p.flag |= SplineFlags.SELECT;
    } else {
      p.flag &= ~SplineFlags.SELECT;
    }
  }
}

SelectOneOp.inputs = ToolOp.inherit_inputs(SelectOpBase, {
  pid        : new IntProperty(-1),
  state      : new BoolProperty(true),
  set_active : new BoolProperty(true),
  unique     : new BoolProperty(true),
  level      : new IntProperty(0)
});
