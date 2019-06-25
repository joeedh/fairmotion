import {
  MinMax
} from 'mathlib';

import {TransformOp, ScaleOp, NonUniformScaleOp} from 'transform';

import {SelMask} from 'selectmode';
import {MResTransData} from 'multires_transdata';

import {Vec3Property, BoolProperty, FloatProperty, IntProperty,
        CollectionProperty, TPropFlags} from 'toolprops';

import {SplineFlags, SplineTypes} from 'spline_types';
import {ToolOp, ModalStates} from 'toolops_api';

import {TransDataItem, TransDataType} from 'transdata';
import {TransDopeSheetType} from 'dopesheet_transdata';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, KeyHandler, 
        charmap, TouchEventManager, EventHandler} from './events';

import {clear_jobs, clear_jobs_except_latest, clear_jobs_except_first,
        JobTypes} from 'native_api';

import {Vec2Property, FloatProperty} from 'toolprops';

export class WidgetResizeOp extends TransformOp {
  constructor(user_start_mpos : Array<float>, datamode : int) {
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
  
  static _get_bounds(minmax, spline, ctx) {
    var totsel=0;

    minmax.reset();
  
    for (var v of spline.verts.selected.editable(ctx)) {
      minmax.minmax(v);
      totsel++;
    }
  
    if (ctx.view2d.selectmode & SelMask.HANDLE) {
      for (var h of spline.handles.selected.editable(ctx)) {
        minmax.minmax(h);
        totsel++;
      }
    }
    
    for (var seg of spline.segments.selected.editable(ctx)) {
      let aabb = seg.aabb;
      minmax.minmax(aabb[0]);
      minmax.minmax(aabb[1]);
    }
    
    return totsel;
  }
  
  static create_widgets(manager : ManipulatorManager, ctx : Context) {
    var spline = ctx.spline;
    var minmax = new MinMax(2);
    
    let totsel = WidgetResizeOp._get_bounds(minmax, spline, ctx);
    
    if (totsel < 2) {
      return;
    }

    console.log(minmax.min, minmax.max);
    
    var cent = new Vector2(minmax.min).add(minmax.max).mulScalar(0.5);
    
    var widget = manager.create(this);
  
    var w = (minmax.max[0] - minmax.min[0])*0.5;
    var h = (minmax.max[1] - minmax.min[1])*0.5;
    var len = 9;
    
    var outline = widget.outline([-w, -h], [w, h], "outline", [0.4, 0.4, 0.4, 0.7]);
    
    //positions are set in set_handles below
    var larrow = widget.arrow([0,0], [0,0], "l", [0, 0, 0, 1.0]);
    var rarrow = widget.arrow([0,0], [0,0], "r", [0, 0, 0, 1.0]);
    var tarrow = widget.arrow([0,0], [0,0], "t", [0, 0, 0, 1.0]);
    var barrow = widget.arrow([0,0], [0,0], "b", [0, 0, 0, 1.0]);
    
    let corners = new Array(4);
    for (let i=0; i<4; i++) {
      corners[i] = widget.arrow([0,0],[0,0], i, [0, 0, 0, 1.0]);
    }
    
    //corner signs
    let signs = [
      [-1, -1],
      [-1, 1],
      [1, 1],
      [1, -1]
    ];
    
    let set_handles = () => {
      rarrow.v1[0] = w, rarrow.v1[1] = 0.0;
      rarrow.v2[0] = w+len, rarrow.v2[1] = 0.0;
      
      larrow.v1[0] = -w, larrow.v1[1] = 0.0;
      larrow.v2[0] = -w-len, larrow.v2[1] = 0.0;
      
      tarrow.v1[0] = 0, tarrow.v1[1] = h;
      tarrow.v2[0] = 0, tarrow.v2[1] = h+len;
      
      barrow.v1[0] = 0, barrow.v1[1] = -h;
      barrow.v2[0] = 0, barrow.v2[1] = -h-len;
  
      outline.v1[0] = -w, outline.v1[1] = -h;
      outline.v2[0] = w, outline.v2[1] = h;
      
      for (let i=0; i<4; i++) {
        let c = corners[i];
        
        c.v1[0] = w*signs[i][0], c.v1[1] = h*signs[i][1];
        c.v2[0] = (w+len)*signs[i][0], c.v2[1] = (h+len)*signs[i][1];
      }
    }
    
    set_handles();
    
    widget.co = new Vector2(cent);
    
    widget.on_tick = function(ctx) {
      /*if (g_app_state.modalstate == ModalStates.TRANSFORMING) {
        this.hide();
        return;
      } else {
        this.unhide();
      }*/
  
      var totsel = WidgetResizeOp._get_bounds(minmax, spline, ctx);
      
      var update = false;
      
      if (totsel < 2) {
        this.hide();
        return;
      } else {
        update = this.hidden;  //update if not already unhidden
        this.unhide();
      }
      
      var cx = (minmax.min[0]+minmax.max[0])*0.5;
      var cy = (minmax.min[1]+minmax.max[1])*0.5;

      var w2 = (minmax.max[0] - minmax.min[0])*0.5;
      var h2 = (minmax.max[1] - minmax.min[1])*0.5;
      
      update = update || cx != this.co[0] || cy != this.co[1];
      update = update || w2 != w || h2 != h;
      
      if (update) {
        w = w2, h = h2;
        
        this.co[0] = cx;
        this.co[1] = cy;
  
        set_handles();
        
        this.update();
        
        //console.log("update widget!", cx, cy);
      }
    }
    
    let corner_onclick = function(e, view2d, id) {
      console.log("id", id);
      let ci = id;
      let anchor = corners[(ci + 2) % 4];
      let co = new Vector3();
      
      co[0] = anchor.v1[0] + widget.co[0];
      co[1] = anchor.v1[1] + widget.co[1];
      
      let mpos = new Vector3([e.origX, e.origY, 0.0]);
      //view2d.project(mpos);
  
      let toolop = e.ctrlKey ? new ScaleOp(mpos, view2d.selectmode) : new NonUniformScaleOp(mpos, view2d.selectmode);
      
      console.log("mpos", mpos[0], mpos[1]);
      
      toolop.inputs.edit_all_layers.set_data(view2d.ctx.edit_all_layers);
      toolop.inputs.use_pivot.set_data(true);
      toolop.inputs.pivot.set_data(co);
      
      view2d.ctx.toolstack.exec_tool(toolop);
      console.log(view2d.ctx, toolop.modal_ctx.edit_all_layers);
      
      
      return true;
    }
    
    for (let i=0; i<4; i++) {
      corners[i].on_click = corner_onclick;
    }
    
    larrow.on_click = rarrow.on_click = function(e, view2d, id) {
      console.log("widget click!");
  
      let mpos = new Vector3([e.origX, e.origY, 0.0]);
      //view2d.project(mpos);
  
      console.log("mpos", mpos[0], mpos[1]);
  
      let toolop = new ScaleOp(mpos, view2d.selectmode);
      
      let co = new Vector3(widget.co);
      
      if (!e.shiftKey) {
        co[0] += id == 'l' ? w : -w;
      }
      
      toolop.inputs.use_pivot.set_data(true);
      toolop.inputs.pivot.set_data(co);
  
      toolop.inputs.edit_all_layers.set_data(view2d.ctx.edit_all_layers);
      toolop.inputs.constrain.set_data(true);
      toolop.inputs.constraint_axis.set_data(new Vector3([1, 0, 0]));
      
      view2d.ctx.toolstack.exec_tool(toolop);
      
      return true;
    }
  
    tarrow.on_click = barrow.on_click = function(e, view2d, id) {
      console.log("widget click!");
    
      let mpos = new Vector3([e.origX, e.origY, 0.0]);
      //view2d.project(mpos);
      
      console.log("mpos", mpos[0], mpos[1]);
      
      let toolop = new ScaleOp(mpos, view2d.selectmode);
  
      let co = new Vector3(widget.co);
  
      if (!e.shiftKey) {
        co[1] += id == 'b' ? h : -h;
      }
  
      toolop.inputs.edit_all_layers.set_data(view2d.ctx.edit_all_layers);
      toolop.inputs.use_pivot.set_data(true);
      toolop.inputs.pivot.set_data(co);
    
      toolop.inputs.constrain.set_data(true);
      toolop.inputs.constraint_axis.set_data(new Vector3([0, 1, 0]));
    
      view2d.ctx.toolstack.exec_tool(toolop);
    
      return true;
    }
  
    return widget;
  }
  
  static reset_widgets(op : ToolOp, ctx : Context) {
  }
}

export class WidgetRotateOp extends TransformOp {
  constructor(user_start_mpos : Array<float>, datamode : int) {
    super(user_start_mpos, datamode)
  }
  
  static tooldef() { return {
    uiname   : "Rotate",
    apiname  : "spline.widget_rotate",
    description : "Rotate geometry",
    is_modal : true,
    
    inputs   : ToolOp.inherit({
      translation : new Vec2Property(),
      scale       : new Vec2Property(),
      rotation    : new FloatProperty(0.0),
      pivot       : new Vec2Property()
    }),
    
    outputs : {}
  }}
  
  static _get_bounds(minmax, spline, ctx) {
    var totsel=0;
    
    minmax.reset();
    
    for (var v of spline.verts.selected.editable(ctx)) {
      minmax.minmax(v);
      totsel++;
    }
    
    if (ctx.view2d.selectmode & SelMask.HANDLE) {
      for (var h of spline.handles.selected.editable(ctx)) {
        minmax.minmax(h);
        totsel++;
      }
    }
    
    for (var seg of spline.segments.selected.editable(ctx)) {
      let aabb = seg.aabb;
      minmax.minmax(aabb[0]);
      minmax.minmax(aabb[1]);
    }
    
    return totsel;
  }
  
  static create_widgets(manager : ManipulatorManager, ctx : Context) {
    var spline = ctx.spline;
    var minmax = new MinMax(2);
    
    let totsel = WidgetResizeOp._get_bounds(minmax, spline, ctx);
    
    if (totsel < 2) {
      return;
    }
    
    console.log(minmax.min, minmax.max);
    
    var cent = new Vector2(minmax.min).add(minmax.max).mulScalar(0.5);
    
    var widget = manager.create(this);
    
    var w = (minmax.max[0] - minmax.min[0])*0.5;
    var h = (minmax.max[1] - minmax.min[1])*0.5;
    var len = 9;
    
    if (w == 0  & h == 0) {
      return;
    }
    
    let r = Math.sqrt(w*w + h*h)*Math.sqrt(2)*0.5;
    
    let circle = widget.circle([0, 0], r, "rotate_circle", [0.4, 0.4, 0.4, 0.7]);
    widget.co = new Vector2(cent);
    
    widget.on_tick = function(ctx) {
      /*if (g_app_state.modalstate == ModalStates.TRANSFORMING) {
        this.hide();
        return;
      } else {
        this.unhide();
      }*/
      
      var totsel = WidgetResizeOp._get_bounds(minmax, spline, ctx);
      
      var update = false;
      
      if (totsel < 2) {
        this.hide();
        return;
      } else {
        update = this.hidden;  //update if not already unhidden
        this.unhide();
      }
      
      var cx = (minmax.min[0] + minmax.max[0])*0.5;
      var cy = (minmax.min[1] + minmax.max[1])*0.5;
      
      var w2 = (minmax.max[0] - minmax.min[0])*0.5;
      var h2 = (minmax.max[1] - minmax.min[1])*0.5;
      
      update = update || cx != this.co[0] || cy != this.co[1];
      update = update || w2 != w || h2 != h;
      
      if (update) {
        this.co[0] = cx;
        this.co[1] = cy;
        
        this.update();
      }
      
      return; //XXX
      
      if (update) {
        w = w2, h = h2;
        
        this.co[0] = cx;
        this.co[1] = cy;
        
        set_handles();
        
        this.update();
        
        //console.log("update widget!", cx, cy);
      }
    }
    
    let corner_onclick = function(e, view2d, id) {
      console.log("id", id);
      let ci = id;
      let anchor = corners[(ci + 2) % 4];
      let co = new Vector3();
      
      co[0] = anchor.v1[0] + widget.co[0];
      co[1] = anchor.v1[1] + widget.co[1];
      
      let mpos = new Vector3([e.origX, e.origY, 0.0]);
      //view2d.project(mpos);
      
      let toolop = e.ctrlKey ? new ScaleOp(mpos, view2d.selectmode) : new NonUniformScaleOp(mpos, view2d.selectmode);
      
      console.log("mpos", mpos[0], mpos[1]);
      
      toolop.inputs.use_pivot.set_data(true);
      toolop.inputs.pivot.set_data(co);
      
      view2d.ctx.toolstack.exec_tool(toolop);
      
      return true;
    }
    
    circle.on_click = function(e, view2d, id) {
      console.log("widget click!");
      
      let mpos = new Vector3([e.origX, e.origY, 0.0]);
      //view2d.project(mpos);
      
      console.log("mpos", mpos[0], mpos[1]);
      
      let toolop = new ScaleOp(mpos, view2d.selectmode);
      
      let co = new Vector3(widget.co);
      
      if (!e.shiftKey) {
        co[1] += id == 'b' ? h : -h;
      }
      
      toolop.inputs.use_pivot.set_data(true);
      toolop.inputs.pivot.set_data(co);
      
      toolop.inputs.constrain.set_data(true);
      toolop.inputs.constraint_axis.set_data(new Vector3([0, 1, 0]));
      
      view2d.ctx.toolstack.exec_tool(toolop);
      
      return true;
    }
    
    return widget;
  }
  
  static reset_widgets(op : ToolOp, ctx : Context) {
  }
}
