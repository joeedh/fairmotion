import {
  MinMax
} from 'mathlib';

import {TransformOp} from 'transform';

import {SelMask} from 'selectmode';
import {MResTransData} from 'multires_transdata';

import {Vec3Property, BoolProperty, FloatProperty, IntProperty,
        CollectionProperty, TPropFlags} from 'toolprops';

import {SplineFlags, SplineTypes} from 'spline_types';
import {ToolOp, ModalStates} from 'toolops_api';

import {TransDataItem, TransDataType} from 'transdata';
import {TransDopeSheetType} from 'dopesheet_transdata';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, KeyHandler, 
        charmap, TouchEventManager, EventHandler} from 'events';

import {clear_jobs, clear_jobs_except_latest, clear_jobs_except_first, 
        JobTypes} from 'nacl_api';

export class WidgetResizeOp extends TransformOp {
  constructor(Array<float> user_start_mpos, int datamode) {
    super(user_start_mpos, datamode)
  }
  
  static tooldef() { return {
    uiname   : "Resize",
    apiname  : "spline.widget_resize",
    description : "Resize geometry",
    is_modal : true,
    
    inputs   : ToolOp.inherit({
      translation : new Vec2Property(),
      scale       : new Vec2Property(),
      rotation    : new FloatProperty(0.0),
      pivot       : new Vec2Property()
    }),
    
    outputs : {}
  }}
  
  static create_widgets(ManipulatorManager manager, Context ctx) {
    var spline = ctx.spline;
    var minmax = new MinMax(2);
    
    for (var v of spline.verts.selected.editable) {
      minmax.minmax(v);
    }
    for (var h of spline.handles.selected.editable) {
      minmax.minmax(h);
    }
    
    var cent = new Vector2(minmax.min).add(minmax.max).mulScalar(0.5);
    
    var widget = manager.create(this);
    widget.co = new Vector2(cent);
    widget.on_tick = function(ctx) {
      if (g_app_state.modalstate == ModalStates.TRANSFORMING) {
        this.hide();
        return;
      } else {
        this.unhide();
      }
      
      minmax.reset();
      var totsel=0;
      
      for (var v of spline.verts.selected.editable) {
        minmax.minmax(v);
        totsel++;
      }
      
      if (ctx.view2d.selectmode & SelMask.HANDLE) {
        for (var h of spline.handles.selected.editable) {
          minmax.minmax(h);
          totsel++;
        }
      }
      
      var update = false;
      
      if (totsel == 0) {
        this.hide();
        return;
      } else {
        update = this.hidden;  //update if not already unhidden
        this.unhide();
      }
      
      var cx = (minmax.min[0]+minmax.max[0])*0.5;
      var cy = (minmax.min[1]+minmax.max[1])*0.5;
      
      update = update || cx != this.co[0] || cy != this.co[1];
      
      if (update) {
        this.co[0] = cx;
        this.co[1] = cy;
        this.update();
        
        console.log("update widget!", cx, cy);
      }
    }
    
    var arrow = widget.arrow([1, 0], "a", [0, 0, 0, 1.0]);
    
    widget.on_click = function(id) {
      console.log("widget click!");
    }
    
    return widget;
  }
  
  static reset_widgets(ToolOp op, Context ctx) {
  }
}
