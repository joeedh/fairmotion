"use strict";

//multitouch
import {ToolOp, UndoFlags, ToolFlags} from '../../core/toolops_api.js';
import {STRUCT} from '../../core/struct.js';
import {unpack_ctx} from '../../core/ajax.js';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, HotKey,
        charmap, TouchEventManager, EventHandler} from '../events.js';

import {Vec2Property, Vec3Property, IntProperty, StringProperty, TPropFlags} from "../../core/toolprops.js";
import {SceneObject, ObjectFlags} from '../../scene/sceneobject.js';

export class PanOp extends ToolOp {
  is_modal : boolean
  cameramat : Matrix4;

  mpos       : Vector2;
  start_mpos : Vector2;
  first      : boolean;

  constructor(start_mpos) {
    super();

    this.is_modal = true;
    this.undoflag |= UndoFlags.NO_UNDO;

    if (start_mpos !== undefined) {
      this.start_mpos = new Vector3(start_mpos);
      this.start_mpos[2] = 0.0;

      this.first = false;
    } else {
      this.start_mpos = new Vector3();

      this.first = true;
    }

    this.start_cameramat = undefined;
    this.cameramat = new Matrix4();
  }

  static tooldef() { return {
    uiname     : "Pan",
    toolpath    : "view2d.pan",

    undoflag   : UndoFlags.NO_UNDO,

    inputs     : {},
    outputs    : {},

    is_modal   : true
  }}

  start_modal(ctx : LockedContext) {
    this.start_cameramat = new Matrix4(ctx.view2d.cameramat);
  }

  on_mousemove(event : Object) {
    var mpos = new Vector3([event.x, event.y, 0]);

    //console.log("mousemove!");

    if (this.first) {
      this.first = false;
      this.start_mpos.load(mpos);

      return;
    }

    var ctx = this.modal_ctx;
    mpos.sub(this.start_mpos).mulScalar(1.0/ctx.view2d.zoom);

    this.cameramat.load(this.start_cameramat).translate(mpos[0], -mpos[1], 0.0);
    ctx.view2d.set_cameramat(this.cameramat);

    if (!event.touches) {
      ctx.view2d.resetVelPan();
    }
    //console.log("panning");
    window.force_viewport_redraw();
    window.redraw_viewport();
  }

  on_mouseup(event : Object) {
    this.end_modal();
  }
}

class ViewRotateZoomPanOp extends ToolOp {
  is_modal : boolean
  inputs : Object
  outputs : Object
  first_call : boolean
  start_zoom : number
  mv1 : Vector3
  mv2 : Vector3
  mv3 : Vector3
  mv4 : Vector3
  mv5 : Vector3
  mv6 : Vector3;

  constructor() {
    super();

    this.undoflag = UndoFlags.NO_UNDO;

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
  static tooldef() {return {
    toolpath : "view2d.viewrotatezoom",
    uiname : "View Rotate Zoom",
    is_modal : true,
    undoflag : UndoFlags.NO_UNDO,
    inputs : {},
    outputs : {}
  }}

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
    
    let newmat = new Matrix4(this.start_mat);
    
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
    super();

    this.transdata = null;
  }

  static tooldef() {return {
    toolpath : "view2d.orbit",
    uiname : "Orbit",
    is_modal : true,
    undoflag : UndoFlags.NO_UNDO,
    inputs : {MV1: new Vec3Property(new Vector3(), "mvector1", "mvector1", "mvector1"),
      MV2: new Vec3Property(new Vector3(), "mvector2", "mvector2", "mvector2")},
    outputs : {}
  }}

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
    
    let perp = new Vector3([-vec[1], vec[0], 0.0]);
    var q = new Quat();
    q.axisAngleToQuat(perp, vec.vectorLength()*2);
    let mat = q.toMatrix();
    
    let newmat = new Matrix4(mat);
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
  is_modal : boolean
  inputs : Object
  outputs : Object;

  static tooldef() { return {
    toolpath : "view2d.pan",
    inputs : {
      MV1: new Vec3Property(new Vector3(), "mvector1", "mvector1", "mvector1"),
      MV2: new Vec3Property(new Vector3(), "mvector2", "mvector2", "mvector2")
    },
    outputs : {

    },
    is_modal : true,
    undoflag : UndoFlags.NO_UNDO
  }}

  constructor() {
    super("view2d_pan", "Pan");
    
    this.transdata = null;
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
    for (var v of ctx.mesh.verts) {
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
    
    let mstart = new Vector3(this.start_mpos);

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
    
    let newmat = new Matrix4(this.start_mat);
    
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

import {StringProperty} from '../../core/toolprops.js';

export class BasicFileDataOp extends ToolOp {
  is_modal : boolean
  saved_context : SavedContext;

  constructor(data : String) {
    super();
    
    this.is_modal = false;
    this.undoflag = UndoFlags.NO_UNDO|UndoFlags.IS_UNDO_ROOT|UndoFlags.UNDO_BARRIER;

    if (data)
      this.inputs.data.setValue(data);

    //make empty saved_context
    this.saved_context = new SavedContext();
  }

  static tooldef() {return {
    uiname : "internal file load op",
    toolpath : "app.basic_file_with_data",
    undoflag : UndoFlags.NO_UNDO|UndoFlags.IS_UNDO_ROOT|UndoFlags.UNDO_BARRIER,

    inputs : {
      data : new StringProperty("", "filedata", "file data in base64", TPropFlags.PRIVATE)
    }
  }}

  exec(ctx : ToolContext) {
    var data = new DataView(b64decode(this.inputs.data.data).buffer);
    
    console.log(this.inputs.data.data.length, data.byteLength);
    g_app_state.load_scene_file(data);
  }
}

import {Spline} from "../../curve/spline.js";
import {SplineFrameSet} from "../../core/frameset.js";
import {Scene} from '../../scene/scene.js';

export class BasicFileOp extends ToolOp {
  constructor() {
    super();
  }

  static tooldef() {return {
    toolpath : "app.basic_file",
    uiname : "Make Basic File (internal)",
    undoflag : UndoFlags.IS_UNDO_ROOT|UndoFlags.UNDO_BARRIER,
    description : "Internal tool op; makes basic file"
  }}

  exec(ctx : ToolContext) {
    var datalib = ctx.datalib;
    
    var splineset = new SplineFrameSet();
    splineset.set_fake_user();

    datalib.add(splineset);
    
    var scene = new Scene();
    datalib.add(scene);

    scene._initCollection(datalib);

    scene.set_fake_user();
    let ob = scene.addFrameset(datalib, splineset);
    scene.setActiveObject(ob);
  }
}

import {FloatProperty} from '../../core/toolprops.js';

export class FrameChangeOp extends ToolOp {
  constructor(frame) {
    super();
    
    this._undo = undefined;
    
    if (frame != undefined)
      this.inputs.frame.setValue(frame);
  }

  static tooldef() {return {
    toolpath : "scene.change_frame",
    uiname : "Change Frame",

    inputs : {
      frame: new FloatProperty(0, "frame", "frame", "frame")
    }
  }}
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

import {SimpleCanvasDraw2D} from '../../vectordraw/vectordraw_canvas2d_simple.js';
import {draw_spline} from '../../curve/spline_draw.js';
import {save_file} from '../../core/fileapi/fileapi.js';
import {SplineDrawer} from '../../curve/spline_draw_new.js';

export class ExportCanvasImage extends ToolOp {
  static tooldef() {return {
    toolpath     : "view2d.export_image",
    uiname      : "Save Canvas Image",
    description : "Export visible canvas",
    undoflag    : UndoFlags.NO_UNDO
  }}
  
  exec(ctx) {
    var view2d = g_app_state.active_view2d;
    var spline = ctx.frameset.spline;
    
    var canvas = document.createElement("canvas");
    canvas.width = view2d.size[0];
    canvas.height = view2d.size[1];
    
    //add in custom matrix code
    var g = canvas.getContext("2d");

    var vecdrawer = new SimpleCanvasDraw2D();
    vecdrawer.canvas = canvas;
    vecdrawer.g = g;
    
    var drawer = new SplineDrawer(spline, vecdrawer);
    
    //temporarily override spline.drawer
    var old = spline.drawer;
    spline.drawer = drawer;
    
    console.log("saving image. . .");
    
    //force full update
    drawer.recalc_all = true;
    drawer.update(spline, spline.drawlist, spline.draw_layerlist, view2d.genMatrix(),
                  [], view2d.only_render, view2d.selectmode, g, view2d.zoom, view2d);
    
    try {
      draw_spline(spline, [], g, view2d, view2d.genMatrix(), view2d.selectmode,
                  view2d.only_render, view2d.draw_normals, 1.0, 
                  true, ctx.frameset.time);
    } catch (error) {
      print_stack(error);
      console.trace("Draw error");
      
      g_app_state.notes.label("Error drawing canvas");
      return;
    }
    
    //restore old spline.drawer
    spline.drawer = old;
    
    //make data url
    var url = canvas.toDataURL();

    //turn data url into binary
    url = atob(url.slice(url.search("base64,")+7, url.length));
    
    var data = new Uint8Array(url.length);
    for (var i=0; i<data.length; i++) {
      data[i] = url.charCodeAt(i);
    }
    
    save_file(data, true, false, "PNG", ["png"], function() {
      console.trace("ERROR ERROR!!\n");
      g_app_state.notes.label("Error drawing canvas");
      return;
    });
  }
};
