import {ToolOp, UndoFlags, ToolFlags} from 'toolops_api';
import {SplineFlags, SplineTypes, RecalcFlags} from 'spline_types';
import {RestrictFlags, Spline} from 'spline';
import {SplineLocalToolOp} from 'spline_editops';
import {StringProperty, IntProperty, FloatProperty, 
        BoolProperty, CollectionProperty} from 'toolprops';

export class AddLayerOp extends ToolOp {
  constructor(name) {
    ToolOp.call(this);
    
    if (name != undefined)
      this.inputs.name.set_data(name);
  }
  
  undo_pre(ctx) {
  }
  
  undo(ctx) {
    var id = this.outputs.layerid.data;
    var layer = ctx.spline.layerset.idmap[id];
    
    if (layer == undefined) {
      console.log("WARNING: could not find layer to delete!");
      return;
    }
    
    ctx.spline.layerset.remove(layer);
    ctx.spline.regen_sort();
  }
  
  exec(ctx) {
    var layer = ctx.spline.layerset.new_layer(this.inputs.name.data);
    this.outputs.layerid.set_data(layer.id);

    ctx.spline.regen_sort();
  }
}

AddLayerOp.inputs = {
  name : new StringProperty("Layer", "name", "Name", "Layer Name")
};

AddLayerOp.outputs = {
  layerid : new IntProperty(0, "layerid", "layerid", "New Layer ID")
};

export class ChangeLayerOp extends ToolOp {
  constructor(id) {
    ToolOp.call(this);
    
    if (id != undefined)
      this.inputs.layerid.set_data(id);
  }
  
  undo_pre(ctx) {
    var spline = ctx.spline;
    
    var actives = [];
    for (var list of spline.elists) {
      actives.push(list.active != undefined ? list.active.eid : -1);
    }
    
    this._undo = {
      id : ctx.spline.layerset.active.id,
      actives : actives
    }
  }
  
  undo(ctx) {
    var spline = ctx.spline;
    var layer = spline.layerset.idmap[this._undo.id];
    var actives = this._undo.actives;
    
    for (var i=0; i<actives.length; i++) {
      spline.elists[i].active = spline.eidmap[actives[i]];
    }
    
    if (layer == undefined) {
      console.log("ERROR IN CHANGELAYER UNDO!");
      return;
    }
    
    spline.layerset.active = layer;
  }
  
  exec(ctx) {
    var spline = ctx.spline;
    var layer = spline.layerset.idmap[this.inputs.layerid.data];
    
    if (layer == undefined) {
      console.log("ERROR IN CHANGELAYER!");
      return;
    }
    
    //clear actives
    for (var list of spline.elists) {
      list.active = undefined;
    }
    
    spline.layerset.active = layer;
    window.redraw_viewport();
  }
};

ChangeLayerOp.inputs = {
  layerid : new IntProperty(0, "layerid", "layerid", "Layer ID")
};

export class ChangeElementLayerOp extends SplineLocalToolOp {
  constructor(old_layer, new_layer) {
    SplineLocalToolOp.call(this);
    
    if (old_layer != undefined)
      this.inputs.old_layer.set_data(old_layer);
      
    if (new_layer != undefined)
      this.inputs.new_layer.set_data(new_layer);
  }
  
  exec(ctx) {
    var spline = ctx.spline;
    
    var oldl = this.inputs.old_layer.data;
    var newl = this.inputs.new_layer.data;
    
    var eset = new set();
    for (var e of spline.selected) {
      if (e.hidden) continue;
      if (!(oldl in e.layers)) continue;
      
      eset.add(e);
    }
    
    console.log("ids", oldl, newl);
    
    oldl = spline.layerset.idmap[oldl];
    newl = spline.layerset.idmap[newl];
    
    if (newl == undefined || oldl == undefined || oldl == newl) {
      console.log("Error in ChangeElementLayerOp!", "oldlayer", oldl, "newlayer", newl);
      return;
    }
    
    for (var e of eset) {
      oldl.remove(e);
      newl.add(e);
    }
    
    window.redraw_viewport();
    spline.regen_sort();
  }
}
ChangeElementLayerOp.inputs = {
  old_layer : new IntProperty(0),
  new_layer : new IntProperty(0)
}
