import {ToolOp, UndoFlags, ToolFlags} from '../../core/toolops_api.js';
import {SplineFlags, SplineTypes, RecalcFlags} from '../../curve/spline_types.js';
import {RestrictFlags, Spline} from '../../curve/spline.js';
import {SplineLocalToolOp} from './spline_editops.js';
import {
  StringProperty, IntProperty, FloatProperty,
  BoolProperty, CollectionProperty
} from '../../core/toolprops.js';

export class SplineLayerOp extends SplineLocalToolOp {
  static tooldef() {
    return {
      inputs: ToolOp.inherit({
        spline_path: new StringProperty("frameset.drawspline")
      })
    }
  }

  get_spline(ctx) {
    return ctx.api.getValue(ctx, this.inputs.spline_path.data);
  }
}

export class AddLayerOp extends SplineLayerOp {
  constructor(name) {
    super(undefined, "Add Layer");

    if (name !== undefined)
      this.inputs.name.set_data(name);
  }

  static tooldef() {
    return {
      uiname  : "Add Layer",
      toolpath: "spline.layers.add",

      inputs: ToolOp.inherit({
        name       : new StringProperty("Layer", "name", "Name", "Layer Name"),
        make_active: new BoolProperty(true, "Make Active"),
      }),

      outputs : ToolOp.inherit({
        layerid: new IntProperty(0, "layerid", "layerid", "New Layer ID")
      }),
      is_modal: false
    };
  }

  static canRun(ctx) {
    return this;
    //let spline = ctx.api.getValue(ctx, this.inputs.spline_path.data);
    //return spline !== undefined;
  }

  /*
  undo_pre(ctx) {
  }
  
  undo(ctx) {
    let id = this.outputs.layerid.data;
    let layer = this.get_spline(ctx).layerset.idmap[id];
    
    if (layer === undefined) {
      console.log("WARNING: could not find layer to delete!");
      return;
    }
    
    this.get_spline(ctx).layerset.remove(layer);
    this.get_spline(ctx).regen_sort();
  }//*/

  exec(ctx) {
    console.warn(ctx, ctx.api);
    let spline = ctx.api.getValue(ctx, this.inputs.spline_path.data);

    let layer = spline.layerset.new_layer(this.inputs.name.data);
    this.outputs.layerid.set_data(layer.id);

    if (this.inputs.make_active.data) {
      spline.layerset.active = layer;

      //clear actives
      for (let list of spline.elists) {
        list.active = undefined;
      }
    }

    spline.regen_sort();
  }
}

export class ChangeLayerOp extends SplineLayerOp {
  static tooldef() {
    return {
      uiname  : "Change Layer",
      toolpath: "spline.layers.set",

      inputs  : ToolOp.inherit({
        layerid: new IntProperty(0, "layerid", "layerid", "Layer ID")
      }),
      is_modal: false
    };
  }

  constructor(id) {
    super(undefined);

    if (id !== undefined)
      this.inputs.layerid.set_data(id);
  }

  undo_pre(ctx) {
    let spline = this.get_spline(ctx);

    let actives = [];
    for (let list of spline.elists) {
      actives.push(list.active !== undefined ? list.active.eid : -1);
    }

    this._undo = {
      id     : this.get_spline(ctx).layerset.active.id,
      actives: actives
    }
  }

  undo(ctx) {
    let spline = this.get_spline(ctx);
    let layer = spline.layerset.idmap[this._undo.id];
    let actives = this._undo.actives;

    for (let i = 0; i < actives.length; i++) {
      spline.elists[i].active = spline.eidmap[actives[i]];
    }

    if (layer === undefined) {
      console.log("ERROR IN CHANGELAYER UNDO!");
      return;
    }

    spline.layerset.active = layer;
  }

  exec(ctx) {
    let spline = this.get_spline(ctx);
    let layer = spline.layerset.idmap[this.inputs.layerid.data];

    if (layer === undefined) {
      console.log("ERROR IN CHANGELAYER!");
      return;
    }

    //clear actives
    for (let list of spline.elists) {
      list.active = undefined;
    }

    spline.layerset.active = layer;
    window.redraw_viewport();
  }
};

export class ChangeElementLayerOp extends SplineLayerOp {
  constructor(old_layer, new_layer) {
    super(undefined, "Move to Layer");

    if (old_layer !== undefined)
      this.inputs.old_layer.set_data(old_layer);

    if (new_layer !== undefined)
      this.inputs.new_layer.set_data(new_layer);
  }

  static tooldef() {
    return {
      toolpath: "spline.move_to_layer",
      uiname  : "Move To Layer",
      path    : "spline.move_to_layer",
      inputs  : ToolOp.inherit({
        old_layer: new IntProperty(0),
        new_layer: new IntProperty(0)
      }),
      outputs : {}
    }
  }

  exec(ctx) {
    let spline = this.get_spline(ctx);

    let oldl = this.inputs.old_layer.data;
    let newl = this.inputs.new_layer.data;

    let eset = new set();
    for (let e of spline.selected) {
      if (e.hidden) continue;
      if (!(oldl in e.layers)) continue;

      eset.add(e);
    }

    console.log("ids", oldl, newl);

    oldl = spline.layerset.idmap[oldl];
    newl = spline.layerset.idmap[newl];

    if (newl === undefined || oldl === undefined || oldl === newl) {
      console.log("Error in ChangeElementLayerOp!", "oldlayer", oldl, "newlayer", newl);
      return;
    }

    for (let e of eset) {
      oldl.remove(e);
      newl.add(e);
    }

    window.redraw_viewport();
    spline.regen_sort();
  }
}

export class DeleteLayerOp extends SplineLayerOp {
  constructor() {
    super(undefined);
  }

  static tooldef() {
    return {
      uiname  : "Delete Layer",
      toolpath: "spline.layers.remove",

      inputs  : ToolOp.inherit({
        layer_id: new IntProperty(-1)
      }),
      is_modal: false
    }
  }

  exec(ctx) {
    let spline = this.get_spline(ctx);
    let layer = spline.layerset.idmap[this.inputs.layer_id.data];

    if (layer === undefined) {
      console.trace("Warning, bad data passed to DeleteLayerOp()");
      return;
    }

    if (spline.layerset.length < 2) {
      console.trace("DeleteLayerOp(): Must have at least one layer at all times");
      return;
    }

    let orphaned = new set();

    for (let k in spline.eidmap) {
      let e = spline.eidmap[k];

      if (layer.id in e.layers) {
        delete e.layers[layer.id];
      }

      let exist = false;
      for (let id in e.layers) {
        exist = true;
        break;
      }

      if (!exist) {
        orphaned.add(e);
      }
    }

    spline.layerset.remove(layer);
    layer = spline.layerset.active;

    for (let e of orphaned) {
      e.layers[layer.id] = 1;
    }
  }
}
