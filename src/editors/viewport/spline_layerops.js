import {ToolOp, UndoFlags, ToolFlags} from 'toolops_api';
import {SplineFlags, SplineTypes, RecalcFlags} from 'spline_types';
import {RestrictFlags, Spline} from 'spline';
import {SplineLocalToolOp} from 'spline_editops';
import {StringProperty, IntProperty, FloatProperty, 
        BoolProperty, CollectionProperty} from 'toolprops';

export class AddLayerOp extends SplineLocalToolOp {
  constructor(name) {
    super(undefined, "Add Layer");
    
    if (name != undefined)
      this.inputs.name.set_data(name);
  }
  
  can_call(ctx) {
    return ctx.spline === ctx.frameset.spline; //only allow on drawspline
  }
  /*
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
  }//*/
  
  exec(ctx) {
    var layer = ctx.spline.layerset.new_layer(this.inputs.name.data);
    this.outputs.layerid.set_data(layer.id);
    
    if (this.inputs.make_active.data) {
      ctx.spline.layerset.active = layer;
      
      //clear actives
      for (var list of ctx.spline.elists) {
        list.active = undefined;
      }
    }
    
    ctx.spline.regen_sort();
  }
}

AddLayerOp.inputs = {
  name        : new StringProperty("Layer", "name", "Name", "Layer Name"),
  make_active : new BoolProperty(true, "Make Active")
};

AddLayerOp.outputs = {
  layerid : new IntProperty(0, "layerid", "layerid", "New Layer ID")
};

export class ChangeLayerOp extends ToolOp {
  static tooldef() {return {
    uiname   : "Change Layer",
    apiname  : "spline.layers.set",
  
    inputs   : {
      layerid : new IntProperty(0, "layerid", "layerid", "Layer ID")
    },
    is_modal : false
  };}
  
  constructor(id) {
    super(undefined);
    
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

export class ChangeElementLayerOp extends SplineLocalToolOp {
  constructor(old_layer, new_layer) {
    super(undefined, "Move to Layer");
    
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

export class DeleteLayerOp extends SplineLocalToolOp {
  constructor() {
    super(undefined);
  }
  
  static tooldef() {return {
    uiname   : "Delete Layer",
    apiname  : "spline.layers.remove",
    
    inputs   : {
      layer_id : new IntProperty(-1)
    },
    is_modal : false
  }}
  
  exec(ctx) {
    var spline = ctx.spline;
    var layer = spline.layerset.idmap[this.inputs.layer_id.data];
    
    if (layer == undefined) {
      console.trace("Warning, bad data passed to DeleteLayerOp()");
      return;
    }
    
    if (spline.layerset.length < 2) {
      console.trace("DeleteLayerOp(): Must have at least one layer at all times");
      return;
    }
    
    var orphaned = new set();
    
    for (var k in spline.eidmap) {
      var e = spline.eidmap[k];
      
      if (layer.id in e.layers) {
        delete e.layers[layer.id];
      }
      
      var exist = false;
      for (var id in e.layers) {
        exist = true;
        break;
      }
      
      if (!exist) {
        orphaned.add(e);
      }
    }
    
    spline.layerset.remove(layer);
    var layer = spline.layerset.active;
    
    for (var e of orphaned) {
      e.layers[layer.id] = 1;
    }
  }
}
