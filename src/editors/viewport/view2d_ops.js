"use strict";

//multitouch
import {ToolOp, UndoFlags, ToolFlags} from 'toolops_api';

class ViewRotateZoomPanOp extends ToolOp {
  constructor() {
    ToolOp.call(this, "view2d_orbit", "Orbit");

    this.undoflag = UndoFlags.IGNORE_UNDO;

    this.transdata = null;
    this.is_modal = true;

    this.inputs = {}
                   
    this.outputs = {}
    
    this.first_call = false;
    this.start_mat = undefined;
    this.startcos = [undefined, undefined, undefined];
    this.startids = [undefined, undefined, undefined];
    this.start_zoom = 0;
    
    this.mv1 = new Vector3();
    this.mv2 = new Vector3();
    
    this.mv3 = new Vector3();
    this.mv4 = new Vector3();
    
    this.mv5 = new Vector3();
    this.mv6 = new Vector3();
  }

  can_call(Context ctx) {
    return true;
  }

  start_modal(Context ctx) {
    this.start_mat = new Matrix4(ctx.view2d.drawmats.cameramat);
    this.first_call = true;
    this.start_zoom = ctx.view2d.zoomwheel;
  }
  
  proj(Vector3 out, Array<float> mpos) {
    var size = this.modal_ctx.view2d.size;
    
    out.loadxy(mpos);
    out[0] = out[0] / (size[0]*0.5) - 1.0;
    out[1] = out[1] / (size[1]*0.5) - 1.0;
  }
  
  on_mousemove(event) {
    var ctx = this.modal_ctx;
    var view2d = ctx.view2d;
    var screen = g_app_state.screen;
    
    //sanity check for dual mouse/multitouch systems; if no touches, return
    if (screen.tottouch == 0) {
      this.end_modal();
    }
    
    //always called with at least 2 touches
    if (this.first_call == true) {
      var touches = [];
      for (var k in screen.touchstate) {
        touches.push(k);
      }
      
      this.first_call = false;
      
      var v1 = new Vector3();
      var v2 = new Vector3();
      this.proj(v1, screen.touchstate[touches[0]]);
      this.proj(v2, screen.touchstate[touches[1]]);
      
      this.startids = [touches[0], touches[1], undefined];
      this.startcos = [v1, v2, undefined];
      
      this.mv1.load(v1); this.mv2.load(v1);
      this.mv3.load(v2); this.mv4.load(v2);
      
      this.exec(this.modal_tctx);
    }
    
    if (screen.tottouch == 2 && this.startids[2] != undefined)
      this.transition("rotate");
    
    //console.log(JSON.stringify(screen.touchstate));
    
    //detect third touch hotspot
    if (this.startids[2] == undefined) {
      for (var k in screen.touchstate) {
        if (k != this.startids[0] && k != this.startids[1]) {
          this.startids[2] = k;
          this.startcos[2] = new Vector3();
          this.proj(this.startcos[2], screen.touchstate[k]);
          
          this.mv5.load(this.startcos[2]);
          
          this.transition("pan");
          break;
        }
      }
    }
    
    if (this.startids[0] in screen.touchstate) {
      this.proj(this.mv2, screen.touchstate[this.startids[0]]);
    }
    if (this.startids[1] in screen.touchstate) {
      this.proj(this.mv4, screen.touchstate[this.startids[1]]);
    }
    if (this.startids[2] != undefined && this.startids[2] in screen.touchstate) {
      this.proj(this.mv6, screen.touchstate[this.startids[2]]);
    }
    
    this.exec(this.modal_tctx);
  }

  exec(ctx) {
    ctx = this.modal_ctx;
    
    var v1 = new Vector3(this.mv1);
    var v2 = new Vector3(this.mv2);
    
    var newmat;
    if (this.startids[2] == undefined) {
      //console.log(v1.vectorDistance(v2), v1, v2);
      if (v1.vectorDistance(v2) < 0.01)
        return;
      
      var vec = new Vector3(v2);
      vec.sub(v1);
      
      var perp = new Vector3([-vec[1], vec[0], 0.0]);
      var q = new Quat();
      q.axisAngleToQuat(perp, vec.vectorLength()*2);
      var mat = q.toMatrix();
      
      newmat = new Matrix4(mat);
      newmat.multiply(this.start_mat);
    } else {
      newmat = ctx.view2d.drawmats.cameramat;
    }
    
    //zoom
    var v3 = this.mv3, v4 = this.mv4;
    var startdis = v3.vectorDistance(v1);
    var zoom;
    
    if (startdis > 0.01) {
      zoom = v4.vectorDistance(v2) / startdis;
    } else {
      zoom = v4.vectorDistance(v2);
    }
    
    var view2d = ctx.view2d;
    //console.log(zoom);
    
    //normalize existing zoom into 0..1 range
    var range = (view2d.zoom_wheelrange[1]-view2d.zoom_wheelrange[0]);
    var zoom2 = (this.start_zoom - view2d.zoom_wheelrange[0]) / range;
    
    //console.log("start_zoom", this.start_zoom);
    
    //multiply by touch zoom fac
    zoom2 += 0.025*(zoom-1.0);
    
    //console.log("zoomfac", zoom, startdis, v3, v4);
    //denormalize
    zoom2 = zoom2*range + view2d.zoom_wheelrange[0];
    
    view2d.drawmats.cameramat = newmat;
    
    if (this.startids[2] != undefined)
      this.exec_pan(ctx);
  }
  
  exec_pan(ctx) {
    static v1 = new Vector3(), v2 = new Vector3();
    var view2d = ctx.view2d;
    
    v1.load(this.mv5);
    v2.load(this.mv6);
    
    v1[2] = 0.9;
    v2[2] = 0.9;
    
    var iprojmat = new Matrix4(ctx.view2d.drawmats.rendermat);
    iprojmat.invert();
    
    var scenter = new Vector3(this.center);
    scenter.multVecMatrix(ctx.view2d.drawmats.rendermat);
    
    if (isNaN(scenter[2]))
      scenter[2] = 0.0;
    
    v1[2] = scenter[2];
    v2[2] = scenter[2];
    
    v1.multVecMatrix(iprojmat);
    v2.multVecMatrix(iprojmat);
    
    var vec = new Vector3(v2);
    vec.sub(v1);
    
    newmat = new Matrix4(this.start_mat);
    
    if (isNaN(vec[0]) || isNaN(vec[1]) || isNaN(vec[2]))
      return;
      
    newmat.translate(vec);  
    view2d.drawmats.cameramat = newmat;
  }
  
  transition(String mode) {
    this.start_mat = new Matrix4(this.modal_ctx.view2d.drawmats.cameramat);
    
    if (mode == "rotate") {
      this.startids[2] = undefined;
      this.startcos[0].load(this.mv2);
      this.mv1.load(this.mv2);
    }
  }
  
  on_mouseup(event) {
    if (DEBUG.modal)
      console.log("modal end");
    
    for (var k in event.touches) {
      if (this.startids[2] == k) {
        this.transition("rotate");
      }
    }
    
    if (g_app_state.screen.tottouch == 0)
      this.end_modal();
  }
}

class ViewRotateOp extends ToolOp {
  constructor() {
    ToolOp.call(this, "view2d_orbit", "Orbit");

    this.undoflag = UndoFlags.IGNORE_UNDO;

    this.transdata = null;
    this.is_modal = true;

    this.inputs = {MV1: new Vec3Property(new Vector3(), "mvector1", "mvector1", "mvector1"), 
                   MV2: new Vec3Property(new Vector3(), "mvector2", "mvector2", "mvector2")}
                   
    this.outputs = {}
  }

  can_call(Context ctx) {
    return true;
  }

  start_modal(Context ctx) {
    this.start_mat = new Matrix4(ctx.view2d.drawmats.cameramat);
    this.first_call = true;
  }

  on_mousemove(event) {
    if (this.first_call == true) {
      this.first_call = false;
      this.start_mpos = new Vector3([event.x, event.y, 0]);
      this.start_mpos[0] = this.start_mpos[0]/(this.modal_ctx.view2d.size[0]/2) - 1.0;
      this.start_mpos[1] = this.start_mpos[1]/(this.modal_ctx.view2d.size[1]/2) - 1.0;
    }
    
    var mstart = new Vector3(this.start_mpos);

    var mend = new Vector3([event.x, event.y, 0.0]);
    mend[0] = mend[0]/(this.modal_ctx.view2d.size[0]/2) - 1.0;
    mend[1] = mend[1]/(this.modal_ctx.view2d.size[1]/2) - 1.0;

    var vec = new Vector3(mend);
    vec.sub(mstart);
    
    this.inputs.MV1.data = mstart;
    this.inputs.MV2.data = mend;
    
    this.exec(this.modal_ctx);
  }

  exec(ctx) {
    ctx = this.modal_ctx;
    
    var v1 = new Vector3(this.inputs.MV1.data);
    var v2 = new Vector3(this.inputs.MV2.data);
    
    if (v1.vectorDistance(v2) < 0.01)
      return;
    
    var vec = new Vector3(v2);
    vec.sub(v1);
    
    perp = new Vector3([-vec[1], vec[0], 0.0]);
    var q = new Quat();
    q.axisAngleToQuat(perp, vec.vectorLength()*2);
    mat = q.toMatrix();
    
    newmat = new Matrix4(mat);
    newmat.multiply(this.start_mat);
    
    ctx.view2d.drawmats.cameramat = newmat;
    ctx.view2d.on_view_change();
  }

  on_mouseup(event) {
    if (DEBUG.modal)
      console.log("modal end");
    this.end_modal();
  }
}

class ViewPanOp extends ToolOp {
  constructor() {
    ToolOp.call(this, "view2d_pan", "Pan");
    
    this.undoflag = UndoFlags.IGNORE_UNDO;
    
    this.transdata = null;
    this.is_modal = true;

    this.inputs = {MV1: new Vec3Property(new Vector3(), "mvector1", "mvector1", "mvector1"), 
                   MV2: new Vec3Property(new Vector3(), "mvector2", "mvector2", "mvector2")}
                   
    this.outputs = {}
  }

  can_call(ctx) {
    return true;
  }

  start_modal(ctx) {
    this.start_mat = new Matrix4(ctx.view2d.drawmats.cameramat);
    this.first_call = true;
    
    this.center = new Vector3();
    
    var i = 0;
    for (var v in ctx.mesh.verts) {
      if (isNaN(v.co[0]) || isNaN(v.co[1]) || isNaN(v.co[2]))
        continue;
      
      this.center.add(v.co);
      i += 1;
      if (i > 200) 
        break;
    }
    
    if (i > 0)
      this.center.mulScalar(1.0/i);
  }

  on_mousemove(event) {
    if (this.first_call == true) {
      this.first_call = false;
      this.start_mpos = new Vector3([event.x, event.y, 0]);
      this.start_mpos[0] = this.start_mpos[0]/(this.modal_ctx.view2d.size[0]/2) - 1.0;
      this.start_mpos[1] = this.start_mpos[1]/(this.modal_ctx.view2d.size[1]/2) - 1.0;
    }
    
    mstart = new Vector3(this.start_mpos);

    var mend = new Vector3([event.x, event.y, 0.0]);
    mend[0] = mend[0]/(this.modal_ctx.view2d.size[0]/2) - 1.0;
    mend[1] = mend[1]/(this.modal_ctx.view2d.size[1]/2) - 1.0;

    this.inputs.MV1.data = mstart;
    this.inputs.MV2.data = mend;
    this.exec(this.modal_ctx);
  }

  exec(ctx) {
    ctx = this.modal_ctx;
    
    var v1 = new Vector3(this.inputs.MV1.data);
    var v2 = new Vector3(this.inputs.MV2.data);
    
    if (v1.vectorDistance(v2) < 0.01)
      return;
    
    v1[2] = 0.9;
    v2[2] = 0.9;
    
    var iprojmat = new Matrix4(ctx.view2d.drawmats.rendermat);
    iprojmat.invert();
    
    var scenter = new Vector3(this.center);
    scenter.multVecMatrix(ctx.view2d.drawmats.rendermat);
    
    if (isNaN(scenter[2]))
      scenter[2] = 0.0;
    
    v1[2] = scenter[2];
    v2[2] = scenter[2];
    
    v1.multVecMatrix(iprojmat);
    v2.multVecMatrix(iprojmat);
    
    var vec = new Vector3(v2);
    vec.sub(v1);
    
    newmat = new Matrix4(this.start_mat);
    
    if (isNaN(vec[0]) || isNaN(vec[1]) || isNaN(vec[2]))
      return;
      
    newmat.translate(vec);
    
    ctx.view2d.drawmats.cameramat = newmat;
    ctx.view2d.on_view_change();
  }

  on_mouseup(event) {
    if (DEBUG.modal)
      console.log("modal end");
    
    this.end_modal();
  }
}

function mprop_to_tprop(props, props2) {
  if (props2 == undefined) {
    props2 = {}
  }
  
  for (var k1 in Iterator(props)) {
    var k = k1[0]
    var p = props[k];
    var p2;
    
    var name = k; var uiname = k; var descr = k;
    if (p.type == MPropTypes.ELEMENT_BUF) {
      if (p.save_in_toolops) {
        var lst = list(p);
        for (var i=0; i<lst.length; i++) {
          lst[i] = lst[i].eid;
        }
        p2 = new ElementBufProperty(lst, name, uiname, descr);
        p2.ignore = false;
      } else {
        p2 = new ElementBufProperty([], name, uiname, descr);
        p2.ignore = true;
      }
    } else if (p.type == MPropTypes.INT) {
      p2 = new IntProperty(p.data, name, uiname, descr);
      p2.ignore = false;
      if (p.range != undefined)
        p2.range = p2.ui_range = p.range;
    } else if (p.type == MPropTypes.FLOAT) {
      p2 = new FloatProperty(p.data, name, uiname, descr);
      p2.ignore = false;
      if (p.range != undefined)
        p2.range = p2.ui_range = p.range;
    } else if (p.type == MPropTypes.STRING) {
      p2 = new StringProperty(p.data, name, uiname, descr);
      p2.ignore = false;
    } else if (p.type == MPropTypes.VEC3) {
      p2 = new Vec3Property(p.data, name, uiname, descr);
      p2.ignore = false;
    } else if (p.type == MPropTypes.BOOL) {
      p2 = new BoolProperty(p.data, name, uiname, descr);
      p2.ignore = false;
    } else if (p.type == PropTypes.FLAG) {
      p2 = p;
    }
    
    if (props2.hasOwnProperty(k)) {
      props2[k].data = p2.data;
    } else {
      props2[k] = p2;
    }
    
    props[k].flag = p.flag;
  }
  
  return props2;
}

function tprop_to_mprop(mprop, tprop) {
  for (var k1 in Iterator(tprop)) {
    var k = k1[0]
    var p = tprop[k];
    var p2 = mprop[k];
    
    if (p.ignore) 
      continue;
    
    if (p.type == PropTypes.BOOL) {
      p2.data = p.data;
    } else if (p.type == PropTypes.INT) {
      p2.data = p.data;
    } else if (p.type == PropTypes.FLOAT) {
      p2.data = p.data;
    } else if (p.type == PropTypes.STRING) {
      p2.data = p.data;
    } else if (p.type == PropTypes.VEC3) {
      p2.data = p.data;
    } else if (p.type == PropTypes.FLAG) {
      p2.set_data(p.data);
    } else {
      throw "Unimplemented toolop->meshop type conversion";
    }
  }
  
  return mprop;
}

class MeshToolOp extends ToolOp {
  constructor(meshop) {
    if (meshop == undefined)
      ToolOp.call(this);
    else
      ToolOp.call(this, meshop.name, meshop.uiname, meshop.description, meshop.icon);
    
    this.is_modal = false;
    
    this.flag |= meshop.flag;
    this.meshop = meshop;
    
    if (this.meshop) {
      this.inputs = meshop.inputs;
      this.outputs = meshop.outputs;
    }
    
    this._partial = undefined : Mesh;
  }
  
  default_inputs(Context ctx, ToolGetDefaultFunc get_default) {  
    this.meshop.default_inputs(ctx, get_default);
  }

  undo_pre(ctx) {
    if (this.meshop.flag & ToolFlags.USE_PARTIAL_UNDO) {
      this._partial = ctx.mesh.gen_partial(ctx.mesh.selected, this.meshop.undo_expand_lvl);
    } else {
      var data = [];
      
      ctx.mesh.pack(data);
      this._mesh = new DataView(new Uint8Array(data).buffer);
    }
  }

  undo(ctx) {
    if (this.meshop.flag & ToolFlags.USE_PARTIAL_UNDO) {
      var part = this._partial;
      var mesh = ctx.mesh;
      
      g_app_state.jobs.kill_owner_jobs(mesh);

      mesh.load_partial(this._partial);
      mesh.regen_render();
      
      this._partial = undefined;
    } else {
      var mesh = ctx.mesh;
      var data = this._mesh;
      
      g_app_state.jobs.kill_owner_jobs(mesh);
      
      //use STRUCT system for this?
      mesh.load(new Mesh());
      mesh.unpack(data, new unpack_ctx());
      
      mesh.regen_render();
      this._mesh = undefined;
    }
  }

  can_call(ctx) {
    return true;
  }

  exec(ctx) {
    this.meshop.inputs = this.inputs;
    g_app_state.jobs.kill_owner_jobs(ctx.mesh);
    
    ctx.mesh.ops.call_op(this.meshop);
    
    mprop_to_tprop(this.meshop.outputs, this.outputs);
    ctx.mesh.regen_render();
  }
  
  static fromSTRUCT(reader) {
    var ret = STRUCT.chain_fromSTRUCT(MeshToolOp, reader);
    
    ret.name = ret.meshop.name;
    ret.description = ret.meshop.description;
    ret.uiname = ret.meshop.uiname;
    ret.icon = ret.meshop.icon;
    
    return ret;
  }
}

MeshToolOp.STRUCT = STRUCT.inherit(MeshToolOp, ToolOp) + """
  meshop : abstract(MeshOp);
}
""";

class ToggleSubSurfOp extends ToolOp {
  constructor() {
    ToolOp.call(this, "subsurf_toggle", "Toggle Subsurf");
    
    this.undoflag = UndoFlags.IGNORE_UNDO;
    
    this.is_modal = false;
    
    this.inputs = {}                 
    this.outputs = {}
  }
  
  can_call(ctx) {
    return true;
  }

  exec(ctx) {
    console.log("subsurf");
    
    if (ctx.view2d.ss_mesh == null) {
      ctx.mesh.regen_render();
      ctx.view2d.ss_mesh = gpu_subsurf(ctx.view2d.gl, ctx.mesh, ctx.view2d.get_ss_steps());
    } else {
      destroy_subsurf_mesh(ctx.view2d.gl, ctx.view2d.ss_mesh);
      ctx.view2d.ss_mesh = null;
      ctx.mesh.regen_render();
    }
  }
}

class BasicFileDataOp extends ToolOp {
  constructor(String data) {
    ToolOp.call(this, "basic_file_with_data", "internal op (with data)", "Root operator; creates a scene with a simple cube");
    
    this.is_modal = false;
    this.undoflag = UndoFlags.IGNORE_UNDO|UndoFlags.IS_ROOT_OPERATOR|UndoFlags.UNDO_BARRIER;
    
    this.inputs = {
      data : new StringProperty(data, "filedata", "file data in base64")
    };
    
    this.inputs.data.flag |= TPropFlags.PRIVATE;
    this.outputs = {};
    
    //make empty saved_context
    this.saved_context = new SavedContext();
  }
  
  exec(ToolContext ctx) {
    var data = new DataView(b64decode(this.inputs.data.data).buffer);
    
    console.log(this.inputs.data.data.length, data.byteLength);
    g_app_state.load_scene_file(data);
  }
}

import {Spline} from "spline";
import {SplineFrameSet} from "frameset";
import {Scene} from 'scene';

class BasicFileOp extends ToolOp {
  constructor() {
    ToolOp.call(this, "basic_file", "internal op", "Root operator; creates a scene with a simple cube");
    
    this.is_modal = false;
    this.undoflag = UndoFlags.IS_ROOT_OPERATOR|UndoFlags.UNDO_BARRIER;
    
    this.inputs = {};
    this.outputs = {};
  }
  
  exec(ToolContext ctx) {
    var datalib = ctx.datalib;
    
    var splineset = new SplineFrameSet();
    splineset.set_fake_user();

    datalib.add(splineset);
    
    var scene = new Scene();
    scene.set_fake_user();
    
    datalib.add(scene);
  }
}

import {FloatProperty} from 'toolprops';

class FrameChangeOp extends ToolOp {
  constructor(frame) {
    ToolOp.call(this);
    
    this._undo = undefined;
    
    if (frame != undefined)
      this.inputs.frame.set_data(frame);
  }
  
  undo_pre(ctx) {
    this._undo = ctx.scene.time;
  }
  
  undo(ctx) {
    ctx.scene.change_time(ctx, this._undo);
  }
  
  exec(ctx) {
    ctx.scene.change_time(ctx, this.inputs.frame.data);
  }
}

FrameChangeOp.inputs = {
  frame : new FloatProperty(0, "frame", "frame", "frame")
};
