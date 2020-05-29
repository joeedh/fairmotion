import {
  MinMax
} from '../../util/mathlib.js';

import {SelMask} from './selectmode.js';

import {Vec3Property, BoolProperty, FloatProperty, IntProperty,
        CollectionProperty, TPropFlags, EnumProperty} from '../../core/toolprops.js';

        import {SplineFlags, SplineTypes} from '../../curve/spline_types.js';
import {ToolOp, ToolDef, ModalStates} from '../../core/toolops_api.js';

import {TransDataItem, TransDataType, TransData} from './transdata.js';
import {TransDopeSheetType} from '../dopesheet/dopesheet_transdata.js';
import {SessionFlags} from './view2d_base.js';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, HotKey,
        charmap, TouchEventManager, EventHandler} from '../events.js';

import {clear_jobs, clear_jobs_except_latest, clear_jobs_except_first, 
        JobTypes} from '../../wasm/native_api.js';

var _tsv_apply_tmp1 = new Vector3();
var _tsv_apply_tmp2 = new Vector3();
var post_mousemove_cachering = cachering.fromConstructor(Vector3, 64);
var mousemove_cachering = cachering.fromConstructor(Vector3, 64);

import {TransSplineVert} from "./transform_spline.js";


//let
export class TransformOp extends ToolOp {
 types : GArray
 first_viewport_redraw : boolean
 modaldata : Object;

  constructor(start_mpos : Array<float>, datamode : int) {
    super();
    
    this.types = new GArray([TransSplineVert]);
    this.first_viewport_redraw = true;
    
    if (start_mpos != undefined && typeof start_mpos != "number" && start_mpos instanceof Array) {
      this.user_start_mpos = start_mpos;
    }
    
    if (datamode != undefined)
      this.inputs.datamode.setValue(datamode);
    
    this.modaldata = {};
  }

  static invoke(ctx : FullContext, args : Object) {
    var op = new this();

    if ("datamode" in args) {
      op.inputs.datamode.setValue(args["datamode"]);
    }
    if ("mpos" in args) {
      this.user_start_mpos = args["mpos"];
    }

    op.inputs.edit_all_layers.setValue(ctx.view2d.edit_all_layers);

    //console.log("=====", args, ctx.view2d.session_flag, ctx.view2d.propradius);

    //op.inputs.datamode.setValue(ctx.view2d.selectmode);

    if (ctx.view2d.session_flag & SessionFlags.PROP_TRANSFORM) {
      op.inputs.proportional.setValue(true);
      op.inputs.propradius.setValue(ctx.view2d.propradius);
    }

    return op;
  }

  static tooldef() : ToolDef { return {
    inputs : {
      /* some TransData backends may use this, e.g. to store arrays of
         integer ids for visible path spline vertices in dopesheet editor */
      data         : new CollectionProperty([], [], "data", "data", "data",
                     TPropFlags.COLL_LOOSE_TYPE),
        
      proportional : new BoolProperty(false, "proportional", "proportional mode"),
      propradius   : new FloatProperty(80, "propradius", "prop radius"),
      datamode     : new IntProperty(0, "datamode", "datamode"),
      edit_all_layers : new BoolProperty(false, "Edit all layers", "Edit all layers"),
      
      pivot        : new Vec3Property(undefined, "pivot", "pivot", "pivot"),
      use_pivot    : new BoolProperty(false, "use_pivot", "use pivot", "use pivot"),
      
      constraint_axis : new Vec3Property(undefined, "constraint_axis", "Constraint Axis", "Axis to constrain"),
      constrain       : new BoolProperty(false, "constrain", "Enable Constraint", "Enable Constraint Axis")
    }
  }}

  ensure_transdata(ctx : FullContext) {
    var selmode = this.inputs.datamode.data;
    
    //console.log("SELMODE", selmode);
    
    if (this.transdata == undefined) {
      this.types = [];
      
      if (selmode & SelMask.TOPOLOGY)
        this.types.push(TransSplineVert);
        
      this.transdata = new TransData(ctx, this, this.inputs.datamode.data);
    }
    
    return this.transdata;
  }
  
  finish(ctx : FullContext) {
    delete this.transdata;
    delete this.modaldata;
    
    ctx.frameset.on_ctx_update(ctx);
  }
  
  cancel() {
    var ctx = this.modal_ctx;
    this.end_modal();
    
    this.undo(ctx, true);
  }
  
  //XXX initializing this.types in ensure_transdata
  //may have broken undo invariance
  undo_pre(ctx : FullContext) {
    var td = this.ensure_transdata(ctx);
    
    var undo = this._undo = {};
    undo.edit_all_layers = this.inputs.edit_all_layers.data;

    for (var i=0; i<this.types.length; i++) {
      this.types[i].undo_pre(ctx, td, undo);
    }
  }
  
  undo(ctx : FullContext, suppress_ctx_update=false) {
    var undo = this._undo;
    
    for (var i=0; i<this.types.length; i++) {
      this.types[i].undo(ctx, undo);
    }
    
    if (!suppress_ctx_update) {
      ctx.frameset.on_ctx_update(ctx);
    }
    
    window.redraw_viewport();
  }
  
  end_modal() {
    var ctx = this.modal_ctx;
    
    //force spline solve + redraw
    this.post_mousemove(event, true);
    
    ctx.appstate.set_modalstate(0);
    ToolOp.prototype.end_modal.call(this);
    
    this.finish(ctx);
  }
  
  start_modal(ctx : FullContext) {
    super.start_modal(ctx);
    
    this.first_viewport_redraw = true;
    ctx.appstate.set_modalstate(ModalStates.TRANSFORMING);

    //do one solve
    ctx.spline.solve().then(function() {
      redraw_viewport();
    });

    this.ensure_transdata(ctx);
    this.modaldata = {};
  }
  
  on_mousemove(event : MouseEvent) {
    //ToolOp.prototype.on_mousemove.call(this, event);
    var td = this.ensure_transdata(this.modal_ctx);
    var ctx = this.modal_ctx;
    
    var mpos = new Vector3([event.x, event.y, 0]);

    var md = this.modaldata;
    
    if (md.start_mpos == undefined && this.user_start_mpos != undefined) {
      md.start_mpos = new Vector3(this.user_start_mpos);
      md.start_mpos[2] = 0.0; //ensure non-NaN z
      
      md.last_mpos = new Vector3(md.start_mpos);
      md.mpos = new Vector3(md.start_mpos);
    }
    
    if (md.start_mpos == undefined) {
      md.start_mpos = new Vector3(mpos);
      md.mpos = new Vector3(mpos);
      md.last_mpos = new Vector3(mpos);
    } else {
      mpos.load(ctx.view2d.getLocalMouse(event.original.x, event.original.y));

      md.last_mpos.load(md.mpos);
      md.mpos.load(mpos);
    }
    
    this.draw_helper_lines(md, ctx);
  }
  
  post_mousemove(event : MouseEvent, force_solve=false) {
    //window.redraw_viewport();
    //return;
    var td = this.transdata, view2d = this.modal_ctx.view2d;
    var md = this.modaldata, do_last = true;
    
    var min1 = post_mousemove_cachering.next(), max1 = post_mousemove_cachering.next();
    var min2 = post_mousemove_cachering.next(), max2 = post_mousemove_cachering.next();

    if (this.first_viewport_redraw) {
      md.draw_minmax = new MinMax(3);
      do_last = false;
    }
    
    var ctx = this.modal_ctx;
    var minmax = md.draw_minmax;
    
    min1.load(minmax.min);
    max1.load(minmax.max);
    //console.log("d", min1[0], min1[1], max1[0], max1[1]);
    //static calc_draw_aabb(Context, TransData td, MinMax minmax) {

    minmax.reset();
    for (var i=0; i<td.types.length; i++) {
      td.types[i].calc_draw_aabb(ctx, td, minmax);
    }
    
    for (var i=0; i<2; i++) {
      minmax.min[i] -= 20/view2d.zoom;
      minmax.max[i] += 20/view2d.zoom;
    }
    
    if (do_last) {
      //console.log("do last!", min1[0], min1[1], max1[0], max1[1]);
      
      for (var i=0; i<2; i++) {
        min2[i] = Math.min(min1[i], minmax.min[i]);
        max2[i] = Math.max(max1[i], minmax.max[i]);
      }
    } else {
      min2.load(minmax.min), max2.load(minmax.max);
    }
    
    var found=false;
    for (var i=0; i<this.types; i++) {
      if (this.types[i] == TransSplineVert) {
        found = true;
        break;
      }
    }
    
    var this2 = this;

    redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);

    if (!ctx.spline.solving) {
      if (force_solve && !ctx.spline.solving) { //ha!
        redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);
      } else if (force_solve) {
        ctx.spline._pending_solve.then(function () {
          redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);
        });
      }
    } else if (force_solve) {
      ctx.spline.solve(undefined, undefined, force_solve).then(function() {
        redraw_viewport(min2, max2, undefined, !this2.first_viewport_redraw);
      });
    }
  }
  
  draw_helper_lines(md : ObjLit, ctx : Context) {
    this.reset_drawlines();
    
    //var rad = this.inputs.propradius.data;
    
    if (this.inputs.proportional.data) {
      var rad = this.inputs.propradius.data;
      
      var steps = 64, t = -Math.PI; dt = (Math.PI*2.0)/(steps-1);
      var td = this.transdata;
      
      var v1 = new Vector3(), v2 = new Vector3();
      var r = this.inputs.propradius.data;
      var cent = td.center;
      
      for (var i=0; i<steps-1; i++, t += dt) {
        v1[0] = Math.sin(t)*r + cent[0];
        v1[1] = Math.cos(t)*r + cent[1];
        
        v2[0] = Math.sin(t+dt)*r + cent[0];
        v2[1] = Math.cos(t+dt)*r + cent[1];
        
        var dl = this.new_drawline(v1, v2);
        dl.clr[0] = dl.clr[1] = dl.clr[2] = 0.1;
        dl.clr[3] = 0.01;
        
        dl.width = 2;
      }
    }
  }
  
  on_keydown(event : MouseEvent) {
    console.log(event.keyCode);
    
    var propdelta = 15;
    
    switch(event.keyCode) {
      case 88: //xkey
      case 89: //ykey
        this.inputs.constraint_axis.data.zero();
        this.inputs.constraint_axis.data[event.keyCode == 89 ? 1 : 0] = 1;
        this.inputs.constrain.setValue(true);

        this.exec(this.modal_ctx);
        window.redraw_viewport();
        break;
      case 13: //return key
        console.log("end transform!");
        this.end_modal();
        break;
      case 27: //escape
        this.cancel();
        break;
      case 189: //minus key
        if (this.inputs.proportional.data) {
          this.inputs.propradius.setValue(this.inputs.propradius.data-propdelta);
          this.transdata.propradius = this.inputs.propradius.data;
          this.transdata.calc_propweights();
          this.modal_ctx.view2d.propradius = this.inputs.propradius.data;

          this.exec(this.modal_ctx);
          this.draw_helper_lines(this.modaldata, this.modal_ctx);
          window.redraw_viewport();
        }
        break;
      case 187: //plus key
        if (this.inputs.proportional.data) {
          this.inputs.propradius.setValue(this.inputs.propradius.data+propdelta);
          this.transdata.propradius = this.inputs.propradius.data;
          this.transdata.calc_propweights();
          this.modal_ctx.view2d.propradius = this.inputs.propradius.data;

          this.exec(this.modal_ctx);
          this.draw_helper_lines(this.modaldata, this.modal_ctx);
          window.redraw_viewport();
        }
        break;
    }
  }
  
  on_mouseup(event : MouseEvent) {
    console.log("end transform!");
    this.end_modal();
  }
  
  update(ctx : FullContext) {
    for (var t of this.transdata.types) {
      t.update(ctx, this.transdata);
    }
  }
}
//import {TPropFlags} from 'toolprops';

export class TranslateOp extends TransformOp {
  constructor(user_start_mpos : Array<float>, datamode : int) {
    super(user_start_mpos, datamode);
  }
  
  static tooldef() { return {
    uiname   : "Translate",
    apiname  : "spline.translate",
    description : "Move geometry around",
    is_modal : true,
    
    inputs   : ToolOp.inherit({
      translation : new Vec3Property(undefined, "translation", "translation", "translation")
    })
  }}
  
  on_mousemove(event) {
    super.on_mousemove(event);

    if (this.modaldata === undefined) {
      console.trace("ERROR: corrupted modal event call in TransformOp");
      return;
    }

    var md = this.modaldata;
    var ctx = this.modal_ctx;
    var td = this.transdata;

    var start = mousemove_cachering.next(), off = mousemove_cachering.next();

    //console.log("mpos:", md.mpos, "start", md.start_mpos);

    start.load(md.start_mpos);
    off.load(md.mpos);
    
    ctx.view2d.unproject(start);
    ctx.view2d.unproject(off);
    
    off.sub(start);
    this.inputs.translation.setValue(off);

    this.exec(ctx);
    this.post_mousemove(event);
  }
  
  exec(ctx) {
    var td = this.modal_running ? this.transdata : this.ensure_transdata(ctx);
    
    var mat = new Matrix4();
    var off = this.inputs.translation.data;

    if (this.inputs.constrain.data) {
      off = new Vector3(off);
      off.mul(this.inputs.constraint_axis.data);
      //console.log(this.inputs.constraint_axis.data);
    }

    mat.makeIdentity();
    mat.translate(off[0], off[1], 0);
    
    for (var d of td.data) {
      d.type.apply(ctx, td, d, mat, d.w);
    }
    
    this.update(ctx);
    
    if (!this.modal_running) {
      ctx.frameset.on_ctx_update(ctx);
      delete this.transdata;
    }
  }
}

export class NonUniformScaleOp extends TransformOp {
  constructor(user_start_mpos : Array<float>, datamode : int) {
    super(user_start_mpos, datamode);
  }
  
  static tooldef() { return {
    uiname   : "Non-Uniform Scale",
    apiname  : "spline.nonuniform_scale",
    description : "Resize geometry",
    is_modal : true,
    
    inputs   : ToolOp.inherit({
      scale : new Vec3Property(undefined, "scale", "scale", "scale")
    })
  }}
  
  on_mousemove(event) {
    super.on_mousemove(event);
    
    var md = this.modaldata;
    var ctx = this.modal_ctx;
    var td = this.transdata;
    
    var scale = mousemove_cachering.next();
    var off1 = mousemove_cachering.next();
    var off2 = mousemove_cachering.next();
  
    off1.load(md.mpos).sub(td.scenter).vectorLength();
    off2.load(md.start_mpos).sub(td.scenter).vectorLength();
    
    scale[0] = off1[0] != off2[0] && off2[0] != 0.0 ? off1[0] / off2[0] : 1.0;
    scale[1] = off1[1] != off2[1] && off2[1] != 0.0 ? off1[1] / off2[1] : 1.0;
    scale[2] = 1.0;
    
    this.inputs.scale.setValue(scale);
    
    this.exec(ctx);
    this.post_mousemove(event);
  }
  
  exec(ctx) {
    var td = this.modal_running ? this.transdata : this.ensure_transdata(ctx);
    
    var mat = new Matrix4();
    var scale = this.inputs.scale.data;
    
    var cent = td.center;
    mat.makeIdentity();
    
    if (this.inputs.constrain.data) {
      scale = new Vector3(scale);
      let caxis = this.inputs.constraint_axis.data;
      
      for (let i=0; i<3; i++) {
        scale[i] += (1.0 - scale[i]) * (1.0 - caxis[i]);
      }
    }
    
    mat.translate(cent[0], cent[1], 0);
    mat.scale(scale[0], scale[1], scale[2]);
    mat.translate(-cent[0], -cent[1], 0);
    
    for (var d of td.data) {
      d.type.apply(ctx, td, d, mat, d.w);
    }
    
    this.update(ctx);
    
    if (!this.modal_running) {
      ctx.frameset.on_ctx_update(ctx);
      delete this.transdata;
    }
  }
}

export class ScaleOp extends TransformOp {
  constructor(user_start_mpos : Array<float>, datamode : int) {
    super(user_start_mpos, datamode);
  }
  
  static tooldef() { return {
    uiname   : "Scale",
    apiname  : "spline.scale",
    description : "Resize geometry",
    is_modal : true,
    
    inputs   : ToolOp.inherit({
      scale : new Vec3Property(undefined, "scale", "scale", "scale")
    })
  }}
  
  on_mousemove(event) {
    super.on_mousemove(event);

    var md = this.modaldata;
    var ctx = this.modal_ctx;
    var td = this.transdata;
    
    var scale = mousemove_cachering.next();
    var off = mousemove_cachering.next();
    
    var l1 = off.load(md.mpos).sub(td.scenter).vectorLength();
    var l2 = off.load(md.start_mpos).sub(td.scenter).vectorLength();
    
    //console.log(event.x, event.y);
    
    scale[0] = scale[1] = l1/l2;
    scale[2] = 1.0;
    
    this.inputs.scale.setValue(scale);
    
    this.exec(ctx);
    this.post_mousemove(event);
  }
  
  exec(ctx) {
    var td = this.modal_running ? this.transdata : this.ensure_transdata(ctx);
    
    var mat = new Matrix4();
    var scale = this.inputs.scale.data;
    
    var cent = td.center;
    mat.makeIdentity();
    
    if (this.inputs.constrain.data) {
      scale = new Vector3(scale);
      let caxis = this.inputs.constraint_axis.data;
      
      for (let i=0; i<3; i++) {
        scale[i] += (1.0 - scale[i]) * (1.0 - caxis[i]);
      }
    }
    
    mat.translate(cent[0], cent[1], 0);
    mat.scale(scale[0], scale[1], scale[2]);
    mat.translate(-cent[0], -cent[1], 0);
    
    for (var d of td.data) {
      d.type.apply(ctx, td, d, mat, d.w);
    }
    
    this.update(ctx);
    
    if (!this.modal_running) {
      ctx.frameset.on_ctx_update(ctx);
      delete this.transdata;
    }
  }
}

export class RotateOp extends TransformOp {
  angle_sum : number;

  constructor(user_start_mpos : Array<float>, datamode : int) {
    super(user_start_mpos, datamode);
    this.angle_sum = 0.0;
  }
  
  static tooldef() { return {
    uiname   : "Rotate",
    apiname  : "spline.rotate",
    description : "Rotate geometry",
    is_modal : true,
    
    inputs  : ToolOp.inherit({
      angle : new FloatProperty(undefined, "angle", "angle", "angle")
    })
  }}

  on_mousemove(event) {
    super.on_mousemove(event);

    var md = this.modaldata;
    var ctx = this.modal_ctx;
    var td = this.transdata;
    
    var off = mousemove_cachering.next();
    
    this.reset_drawlines();
    
    var l1 = off.load(md.mpos).sub(td.scenter).vectorLength();
    var l2 = off.load(md.start_mpos).sub(td.scenter).vectorLength();
    
    var dl = this.new_drawline(md.mpos, td.scenter);
    ctx.view2d.unproject(dl.v1), ctx.view2d.unproject(dl.v2);
    
    var angle = Math.atan2(md.start_mpos[0]-td.scenter[0], md.start_mpos[1]-td.scenter[1]) 
                          - Math.atan2(md.mpos[0]-td.scenter[0], md.mpos[1]-td.scenter[1]);

    this.angle_sum += angle;
    md.start_mpos.load(md.mpos);
    
    this.inputs.angle.setValue(this.angle_sum);
    
    this.exec(ctx);
    this.post_mousemove(event);
  }
  
  exec(ctx) {
    var td = this.modal_running ? this.transdata : this.ensure_transdata(ctx);
    
    var mat = new Matrix4();
    
    var cent = td.center;
    mat.makeIdentity();
    
    mat.translate(cent[0], cent[1], 0);
    //mat.scale(scale[0], scale[1], scale[2]);
    mat.rotate(this.inputs.angle.data, 0, 0, 1);
    mat.translate(-cent[0], -cent[1], 0);
    
    for (var d of td.data) {
      d.type.apply(ctx, td, d, mat, d.w);
    }
    
    this.update(ctx);
    
    if (!this.modal_running) {
      ctx.frameset.on_ctx_update(ctx);
      delete this.transdata;
    }
  }
}
