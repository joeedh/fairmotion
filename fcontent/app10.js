
es6_module_define('view2d_ops', ["../../core/toolprops.js", "../../core/frameset.js", "../../curve/spline.js", "../../core/struct.js", "../../core/toolops_api.js", "../../curve/spline_draw_new.js", "../../vectordraw/vectordraw_canvas2d_simple.js", "../../core/fileapi/fileapi.js", "../../core/ajax.js", "../../scene/sceneobject.js", "../../curve/spline_draw.js", "../events.js", "../../path.ux/scripts/pathux.js", "../../scene/scene.js"], function _view2d_ops_module(_es6_module) {
  "use strict";
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolFlags');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var unpack_ctx=es6_import_item(_es6_module, '../../core/ajax.js', 'unpack_ctx');
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var Vec2Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec2Property');
  var Vec3Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec3Property');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var StringProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'StringProperty');
  var TPropFlags=es6_import_item(_es6_module, '../../core/toolprops.js', 'TPropFlags');
  var SceneObject=es6_import_item(_es6_module, '../../scene/sceneobject.js', 'SceneObject');
  var ObjectFlags=es6_import_item(_es6_module, '../../scene/sceneobject.js', 'ObjectFlags');
  var Vector2=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Vector3');
  var Matrix4=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Matrix4');
  var Vector4=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Quat');
  class View2dOp extends ToolOp {
     constructor() {
      super();
      this.tempLines = [];
    }
     makeTempLine(v1, v2, color) {
      return this.new_drawline(v1, v2, color);
    }
     resetTempGeom() {
      return super.reset_drawlines();
    }
  }
  _ESClass.register(View2dOp);
  _es6_module.add_class(View2dOp);
  View2dOp = _es6_module.add_export('View2dOp', View2dOp);
  class PanOp extends ToolOp {
    
    
    
    
    
     constructor(start_mpos) {
      super();
      this.is_modal = true;
      this.undoflag|=UndoFlags.NO_UNDO;
      if (start_mpos!==undefined) {
          this.start_mpos = new Vector2(start_mpos);
          this.start_mpos[2] = 0.0;
          this.first = false;
      }
      else {
        this.start_mpos = new Vector2();
        this.first = true;
      }
      this.start_cameramat = new Matrix4();
      this.cameramat = new Matrix4();
    }
    static  tooldef() {
      return {uiname: "Pan", 
     toolpath: "view2d.pan", 
     undoflag: UndoFlags.NO_UNDO, 
     inputs: {}, 
     outputs: {}, 
     is_modal: true}
    }
     on_mousemove(event) {
      var mpos=new Vector2([event.x, event.y, 0]);
      var ctx=this.modal_ctx;
      mpos = new Vector2(ctx.view2d.getLocalMouse(event.x, event.y));
      if (this.first) {
          this.first = false;
          this.start_cameramat.load(ctx.view2d.cameramat);
          this.start_mpos.load(mpos);
          return ;
      }
      mpos.sub(this.start_mpos).mulScalar(1.0/ctx.view2d.zoom);
      mpos[1] = -mpos[1];
      console.log("mpos", mpos[0], mpos[1]);
      this.cameramat.load(this.start_cameramat).translate(mpos[0], -mpos[1], 0.0);
      ctx.view2d.set_cameramat(this.cameramat);
      if (!event.touches) {
          ctx.view2d.resetVelPan();
      }
      window.force_viewport_redraw();
      window.redraw_viewport();
    }
     on_mouseup(event) {
      this.end_modal();
    }
  }
  _ESClass.register(PanOp);
  _es6_module.add_class(PanOp);
  PanOp = _es6_module.add_export('PanOp', PanOp);
  var $v1_yKWE_exec_pan;
  var $v2_ewQp_exec_pan;
  class ViewRotateZoomPanOp extends ToolOp {
    
    
    
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.undoflag = UndoFlags.NO_UNDO;
      this.transdata = null;
      this.is_modal = true;
      this.inputs = {};
      this.outputs = {};
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
    static  tooldef() {
      return {toolpath: "view2d.viewrotatezoom", 
     uiname: "View Rotate Zoom", 
     is_modal: true, 
     undoflag: UndoFlags.NO_UNDO, 
     inputs: {}, 
     outputs: {}}
    }
     can_call(ctx) {
      return true;
    }
     start_modal(ctx) {
      this.start_mat = new Matrix4(ctx.view2d.drawmats.cameramat);
      this.first_call = true;
      this.start_zoom = ctx.view2d.zoomwheel;
    }
     proj(out, mpos) {
      var size=this.modal_ctx.view2d.size;
      out.loadxy(mpos);
      out[0] = out[0]/(size[0]*0.5)-1.0;
      out[1] = out[1]/(size[1]*0.5)-1.0;
    }
     on_mousemove(event) {
      var ctx=this.modal_ctx;
      var view2d=ctx.view2d;
      var screen=g_app_state.screen;
      if (screen.tottouch===0) {
          this.end_modal();
      }
      if (this.first_call===true) {
          var touches=[];
          for (let k in screen.touchstate) {
              touches.push(k);
          }
          this.first_call = false;
          var v1=new Vector3();
          var v2=new Vector3();
          this.proj(v1, screen.touchstate[touches[0]]);
          this.proj(v2, screen.touchstate[touches[1]]);
          this.startids = [touches[0], touches[1], undefined];
          this.startcos = [v1, v2, undefined];
          this.mv1.load(v1);
          this.mv2.load(v1);
          this.mv3.load(v2);
          this.mv4.load(v2);
          this.exec(this.modal_tctx);
      }
      if (screen.tottouch===2&&this.startids[2]!==undefined)
        this.transition("rotate");
      if (this.startids[2]===undefined) {
          for (let k in screen.touchstate) {
              if (k!==this.startids[0]&&k!==this.startids[1]) {
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
      if (this.startids[2]!==undefined&&this.startids[2] in screen.touchstate) {
          this.proj(this.mv6, screen.touchstate[this.startids[2]]);
      }
      this.exec(this.modal_tctx);
    }
     exec(ctx) {
      ctx = this.modal_ctx;
      var v1=new Vector3(this.mv1);
      var v2=new Vector3(this.mv2);
      var newmat;
      if (this.startids[2]===undefined) {
          if (v1.vectorDistance(v2)<0.01)
            return ;
          var vec=new Vector3(v2);
          vec.sub(v1);
          var perp=new Vector3([-vec[1], vec[0], 0.0]);
          var q=new Quat();
          q.axisAngleToQuat(perp, vec.vectorLength()*2);
          var mat=q.toMatrix();
          newmat = new Matrix4(mat);
          newmat.multiply(this.start_mat);
      }
      else {
        newmat = ctx.view2d.drawmats.cameramat;
      }
      var v3=this.mv3, v4=this.mv4;
      var startdis=v3.vectorDistance(v1);
      var zoom;
      if (startdis>0.01) {
          zoom = v4.vectorDistance(v2)/startdis;
      }
      else {
        zoom = v4.vectorDistance(v2);
      }
      var view2d=ctx.view2d;
      var range=(view2d.zoom_wheelrange[1]-view2d.zoom_wheelrange[0]);
      var zoom2=(this.start_zoom-view2d.zoom_wheelrange[0])/range;
      zoom2+=0.025*(zoom-1.0);
      zoom2 = zoom2*range+view2d.zoom_wheelrange[0];
      view2d.drawmats.cameramat = newmat;
      if (this.startids[2]!==undefined)
        this.exec_pan(ctx);
    }
     exec_pan(ctx) {
      var view2d=ctx.view2d;
      $v1_yKWE_exec_pan.load(this.mv5);
      $v2_ewQp_exec_pan.load(this.mv6);
      $v1_yKWE_exec_pan[2] = 0.9;
      $v2_ewQp_exec_pan[2] = 0.9;
      var iprojmat=new Matrix4(ctx.view2d.drawmats.rendermat);
      iprojmat.invert();
      var scenter=new Vector3(this.center);
      scenter.multVecMatrix(ctx.view2d.drawmats.rendermat);
      if (isNaN(scenter[2]))
        scenter[2] = 0.0;
      $v1_yKWE_exec_pan[2] = scenter[2];
      $v2_ewQp_exec_pan[2] = scenter[2];
      $v1_yKWE_exec_pan.multVecMatrix(iprojmat);
      $v2_ewQp_exec_pan.multVecMatrix(iprojmat);
      var vec=new Vector3($v2_ewQp_exec_pan);
      vec.sub($v1_yKWE_exec_pan);
      var newmat=new Matrix4(this.start_mat);
      if (isNaN(vec[0])||isNaN(vec[1])||isNaN(vec[2]))
        return ;
      newmat.translate(vec);
      view2d.drawmats.cameramat = newmat;
    }
     transition(mode) {
      this.start_mat = new Matrix4(this.modal_ctx.view2d.drawmats.cameramat);
      if (mode==="rotate") {
          this.startids[2] = undefined;
          this.startcos[0].load(this.mv2);
          this.mv1.load(this.mv2);
      }
    }
     on_mouseup(event) {
      if (DEBUG.modal)
        console.log("modal end");
      for (let k in event.touches) {
          if (this.startids[2]===k) {
              this.transition("rotate");
          }
      }
      if (g_app_state.screen.tottouch===0)
        this.end_modal();
    }
  }
  var $v1_yKWE_exec_pan=new Vector3();
  var $v2_ewQp_exec_pan=new Vector3();
  _ESClass.register(ViewRotateZoomPanOp);
  _es6_module.add_class(ViewRotateZoomPanOp);
  class ViewRotateOp extends ToolOp {
     constructor() {
      super();
      this.transdata = null;
    }
    static  tooldef() {
      return {toolpath: "view2d.orbit", 
     uiname: "Orbit", 
     is_modal: true, 
     undoflag: UndoFlags.NO_UNDO, 
     inputs: {MV1: new Vec3Property(new Vector3(), "mvector1", "mvector1", "mvector1"), 
      MV2: new Vec3Property(new Vector3(), "mvector2", "mvector2", "mvector2")}, 
     outputs: {}}
    }
     can_call(ctx) {
      return true;
    }
     start_modal(ctx) {
      this.start_mat = new Matrix4(ctx.view2d.drawmats.cameramat);
      this.first_call = true;
    }
     on_mousemove(event) {
      if (this.first_call===true) {
          this.first_call = false;
          this.start_mpos = new Vector3([event.x, event.y, 0]);
          this.start_mpos[0] = this.start_mpos[0]/(this.modal_ctx.view2d.size[0]/2)-1.0;
          this.start_mpos[1] = this.start_mpos[1]/(this.modal_ctx.view2d.size[1]/2)-1.0;
      }
      var mstart=new Vector3(this.start_mpos);
      var mend=new Vector3([event.x, event.y, 0.0]);
      mend[0] = mend[0]/(this.modal_ctx.view2d.size[0]/2)-1.0;
      mend[1] = mend[1]/(this.modal_ctx.view2d.size[1]/2)-1.0;
      var vec=new Vector3(mend);
      vec.sub(mstart);
      this.inputs.MV1.data = mstart;
      this.inputs.MV2.data = mend;
      this.exec(this.modal_ctx);
    }
     exec(ctx) {
      ctx = this.modal_ctx;
      var v1=new Vector3(this.inputs.MV1.data);
      var v2=new Vector3(this.inputs.MV2.data);
      if (v1.vectorDistance(v2)<0.01)
        return ;
      var vec=new Vector3(v2);
      vec.sub(v1);
      var perp=new Vector3([-vec[1], vec[0], 0.0]);
      var q=new Quat();
      q.axisAngleToQuat(perp, vec.vectorLength()*2);
      var mat=q.toMatrix();
      var newmat=new Matrix4(mat);
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
  _ESClass.register(ViewRotateOp);
  _es6_module.add_class(ViewRotateOp);
  class ViewPanOp extends ToolOp {
    
    
    
    static  tooldef() {
      return {toolpath: "view2d.pan", 
     inputs: {MV1: new Vec3Property(new Vector3(), "mvector1", "mvector1", "mvector1"), 
      MV2: new Vec3Property(new Vector3(), "mvector2", "mvector2", "mvector2")}, 
     outputs: {}, 
     is_modal: true, 
     undoflag: UndoFlags.NO_UNDO}
    }
     constructor() {
      super("view2d_pan", "Pan");
      this.transdata = null;
      this.outputs = {};
    }
     can_call(ctx) {
      return true;
    }
     start_modal(ctx) {
      this.start_mat = new Matrix4(ctx.view2d.drawmats.cameramat);
      this.first_call = true;
      this.center = new Vector3();
      var i=0;
      for (let v of ctx.mesh.verts) {
          if (isNaN(v.co[0])||isNaN(v.co[1])||isNaN(v.co[2]))
            continue;
          this.center.add(v.co);
          i+=1;
          if (i>200)
            break;
      }
      if (i>0)
        this.center.mulScalar(1.0/i);
    }
     on_mousemove(event) {
      if (this.first_call===true) {
          this.first_call = false;
          this.start_mpos = new Vector3([event.x, event.y, 0]);
          this.start_mpos[0] = this.start_mpos[0]/(this.modal_ctx.view2d.size[0]/2)-1.0;
          this.start_mpos[1] = this.start_mpos[1]/(this.modal_ctx.view2d.size[1]/2)-1.0;
      }
      var mstart=new Vector3(this.start_mpos);
      var mend=new Vector3([event.x, event.y, 0.0]);
      mend[0] = mend[0]/(this.modal_ctx.view2d.size[0]/2)-1.0;
      mend[1] = mend[1]/(this.modal_ctx.view2d.size[1]/2)-1.0;
      this.inputs.MV1.data = mstart;
      this.inputs.MV2.data = mend;
      this.exec(this.modal_ctx);
    }
     exec(ctx) {
      ctx = this.modal_ctx;
      var v1=new Vector3(this.inputs.MV1.data);
      var v2=new Vector3(this.inputs.MV2.data);
      if (v1.vectorDistance(v2)<0.01)
        return ;
      v1[2] = 0.9;
      v2[2] = 0.9;
      var iprojmat=new Matrix4(ctx.view2d.drawmats.rendermat);
      iprojmat.invert();
      var scenter=new Vector3(this.center);
      scenter.multVecMatrix(ctx.view2d.drawmats.rendermat);
      if (isNaN(scenter[2]))
        scenter[2] = 0.0;
      v1[2] = scenter[2];
      v2[2] = scenter[2];
      v1.multVecMatrix(iprojmat);
      v2.multVecMatrix(iprojmat);
      var vec=new Vector3(v2);
      vec.sub(v1);
      var newmat=new Matrix4(this.start_mat);
      if (isNaN(vec[0])||isNaN(vec[1])||isNaN(vec[2]))
        return ;
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
  _ESClass.register(ViewPanOp);
  _es6_module.add_class(ViewPanOp);
  var StringProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'StringProperty');
  class BasicFileDataOp extends ToolOp {
    
    
     constructor(data) {
      super();
      this.is_modal = false;
      this.undoflag = UndoFlags.NO_UNDO|UndoFlags.IS_UNDO_ROOT|UndoFlags.UNDO_BARRIER;
      if (data)
        this.inputs.data.setValue(data);
      this.saved_context = new SavedContext();
    }
    static  tooldef() {
      return {uiname: "internal file load op", 
     toolpath: "app.basic_file_with_data", 
     undoflag: UndoFlags.NO_UNDO|UndoFlags.IS_UNDO_ROOT|UndoFlags.UNDO_BARRIER, 
     inputs: {data: new StringProperty("", "filedata", "file data in base64", TPropFlags.PRIVATE)}}
    }
     exec(ctx) {
      var data=new DataView(b64decode(this.inputs.data.data).buffer);
      console.log(this.inputs.data.data.length, data.byteLength);
      g_app_state.load_scene_file(data);
    }
  }
  _ESClass.register(BasicFileDataOp);
  _es6_module.add_class(BasicFileDataOp);
  BasicFileDataOp = _es6_module.add_export('BasicFileDataOp', BasicFileDataOp);
  var Spline=es6_import_item(_es6_module, '../../curve/spline.js', 'Spline');
  var SplineFrameSet=es6_import_item(_es6_module, '../../core/frameset.js', 'SplineFrameSet');
  var Scene=es6_import_item(_es6_module, '../../scene/scene.js', 'Scene');
  class BasicFileOp extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {toolpath: "app.basic_file", 
     uiname: "Make Basic File (internal)", 
     undoflag: UndoFlags.IS_UNDO_ROOT|UndoFlags.UNDO_BARRIER, 
     description: "Internal tool op; makes basic file"}
    }
     exec(ctx) {
      var datalib=ctx.datalib;
      var splineset=new SplineFrameSet();
      splineset.set_fake_user();
      datalib.add(splineset);
      var scene=new Scene();
      datalib.add(scene);
      scene._initCollection(datalib);
      scene.set_fake_user();
      var ob=scene.addFrameset(datalib, splineset);
      scene.setActiveObject(ob);
    }
  }
  _ESClass.register(BasicFileOp);
  _es6_module.add_class(BasicFileOp);
  BasicFileOp = _es6_module.add_export('BasicFileOp', BasicFileOp);
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  class FrameChangeOp extends ToolOp {
     constructor(frame) {
      super();
      this._undo = undefined;
      if (frame!==undefined)
        this.inputs.frame.setValue(frame);
    }
    static  tooldef() {
      return {toolpath: "scene.change_frame", 
     uiname: "Change Frame", 
     inputs: {frame: new FloatProperty(0, "frame", "frame", "frame")}}
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
  _ESClass.register(FrameChangeOp);
  _es6_module.add_class(FrameChangeOp);
  FrameChangeOp = _es6_module.add_export('FrameChangeOp', FrameChangeOp);
  var SimpleCanvasDraw2D=es6_import_item(_es6_module, '../../vectordraw/vectordraw_canvas2d_simple.js', 'SimpleCanvasDraw2D');
  var draw_spline=es6_import_item(_es6_module, '../../curve/spline_draw.js', 'draw_spline');
  var save_file=es6_import_item(_es6_module, '../../core/fileapi/fileapi.js', 'save_file');
  var SplineDrawer=es6_import_item(_es6_module, '../../curve/spline_draw_new.js', 'SplineDrawer');
  class ExportCanvasImage extends ToolOp {
    static  tooldef() {
      return {toolpath: "view2d.export_image", 
     uiname: "Save Canvas Image", 
     description: "Export visible canvas", 
     undoflag: UndoFlags.NO_UNDO}
    }
     exec(ctx) {
      var view2d=g_app_state.active_view2d;
      var spline=ctx.frameset.spline;
      var canvas=document.createElement("canvas");
      canvas.width = view2d.size[0];
      canvas.height = view2d.size[1];
      var g=canvas.getContext("2d");
      var vecdrawer=new SimpleCanvasDraw2D();
      vecdrawer.canvas = canvas;
      vecdrawer.g = g;
      var drawer=new SplineDrawer(spline, vecdrawer);
      var old=spline.drawer;
      spline.drawer = drawer;
      console.log("saving image. . .");
      drawer.recalc_all = true;
      drawer.update(spline, spline.drawlist, spline.draw_layerlist, view2d.genMatrix(), [], view2d.only_render, view2d.selectmode, g, view2d.zoom, view2d);
      try {
        draw_spline(spline, [], g, view2d, view2d.genMatrix(), view2d.selectmode, view2d.only_render, view2d.draw_normals, 1.0, true, ctx.frameset.time);
      }
      catch (error) {
          print_stack(error);
          console.trace("Draw error");
          g_app_state.notes.label("Error drawing canvas");
          return ;
      }
      spline.drawer = old;
      var url=canvas.toDataURL();
      url = atob(url.slice(url.search("base64,")+7, url.length));
      var data=new Uint8Array(url.length);
      for (let i=0; i<data.length; i++) {
          data[i] = url.charCodeAt(i);
      }
      save_file(data, true, false, "PNG", ["png"], function () {
        console.trace("ERROR ERROR!!\n");
        g_app_state.notes.label("Error drawing canvas");
        return ;
      });
    }
  }
  _ESClass.register(ExportCanvasImage);
  _es6_module.add_class(ExportCanvasImage);
  ExportCanvasImage = _es6_module.add_export('ExportCanvasImage', ExportCanvasImage);
  
}, '/dev/fairmotion/src/editors/viewport/view2d_ops.js');


es6_module_define('view2d_spline_ops', ["../events.js", "./transform_ops.js", "../../curve/spline_types.js", "../../path.ux/scripts/screen/ScreenArea.js", "./transform.js", "./view2d_editor.js", "./spline_selectops.js", "./spline_editops.js", "../../core/animdata.js", "../../core/toolops_api.js", "./selectmode.js", "./view2d_base.js", "../../core/lib_api.js", "../../core/struct.js", "./spline_createops.js", "../../curve/spline_draw.js", "../../curve/spline.js"], function _view2d_spline_ops_module(_es6_module) {
  "use strict";
  var ExtrudeVertOp=es6_import_item(_es6_module, './spline_createops.js', 'ExtrudeVertOp');
  var DeleteVertOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteSegmentOp');
  var spline_selectops=es6_import(_es6_module, './spline_selectops.js');
  var WidgetResizeOp=es6_import_item(_es6_module, './transform_ops.js', 'WidgetResizeOp');
  var WidgetRotateOp=es6_import_item(_es6_module, './transform_ops.js', 'WidgetRotateOp');
  var ScreenArea, Area;
  var DataTypes=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataTypes');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var EditModes=es6_import_item(_es6_module, './view2d_editor.js', 'EditModes');
  let EditModes2=EditModes;
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var SelectLinkedOp=es6_import_item(_es6_module, './spline_selectops.js', 'SelectLinkedOp');
  var SelectOneOp=es6_import_item(_es6_module, './spline_selectops.js', 'SelectOneOp');
  var TranslateOp=es6_import_item(_es6_module, './transform.js', 'TranslateOp');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var ToolModes=es6_import_item(_es6_module, './selectmode.js', 'ToolModes');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineVertex=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineSegment');
  var SplineFace=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFace');
  var Spline=es6_import_item(_es6_module, '../../curve/spline.js', 'Spline');
  var View2DEditor=es6_import_item(_es6_module, './view2d_editor.js', 'View2DEditor');
  var SessionFlags=es6_import_item(_es6_module, './view2d_editor.js', 'SessionFlags');
  var DataBlock=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataTypes');
  var redraw_element=es6_import_item(_es6_module, '../../curve/spline_draw.js', 'redraw_element');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ModalStates');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var ToolMacro=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolMacro');
  var get_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'get_vtime');
  var DeleteVertOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteSegmentOp');
  var DeleteFaceOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteFaceOp');
  var ChangeFaceZ=es6_import_item(_es6_module, './spline_editops.js', 'ChangeFaceZ');
  var SplitEdgeOp=es6_import_item(_es6_module, './spline_editops.js', 'SplitEdgeOp');
  var DuplicateOp=es6_import_item(_es6_module, './spline_editops.js', 'DuplicateOp');
  var DisconnectHandlesOp=es6_import_item(_es6_module, './spline_editops.js', 'DisconnectHandlesOp');
  var SplitEdgePickOp=es6_import_item(_es6_module, './spline_editops.js', 'SplitEdgePickOp');
  window.anim_to_playback = [];
  class DuplicateTransformMacro extends ToolMacro {
     constructor() {
      super("duplicate_transform", "Duplicate");
    }
    static  invoke(ctx, args) {
      var tool=new DuplicateOp();
      let macro=new DuplicateTransformMacro();
      macro.add(tool);
      var transop=new TranslateOp(ctx.view2d.mpos, 1|2);
      macro.add(transop);
      return macro;
    }
    static  tooldef() {
      return {uiname: "Duplicate", 
     toolpath: "spline.duplicate_transform", 
     is_modal: true, 
     icon: Icons.DUPLICATE, 
     description: "Duplicate geometry"}
    }
  }
  _ESClass.register(DuplicateTransformMacro);
  _es6_module.add_class(DuplicateTransformMacro);
  DuplicateTransformMacro = _es6_module.add_export('DuplicateTransformMacro', DuplicateTransformMacro);
  
  class RenderAnimOp extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Render", 
     toolpath: "view2d.render_anim", 
     is_modal: true, 
     inputs: {}, 
     outputs: {}, 
     undoflag: UndoFlags.NO_UNDO}
    }
     start_modal(ctx) {
      super.start_modal(ctx);
      console.log("Anim render start!");
      window.anim_to_playback = [];
      window.anim_to_playback.filesize = 0;
      this.viewport = {pos: [ctx.view2d.pos[0], window.innerHeight-(ctx.view2d.pos[1]+ctx.view2d.size[1])], 
     size: [ctx.view2d.size[0], ctx.view2d.size[1]]};
      window.anim_to_playback.viewport = this.viewport;
      var this2=this;
      var pathspline=ctx.frameset.pathspline;
      var min_time=1e+17, max_time=0;
      for (var v of pathspline.verts) {
          var time=get_vtime(v);
          min_time = Math.min(min_time, time);
          max_time = Math.max(max_time, time);
      }
      if (min_time<0) {
          this.end(ctx);
          return ;
      }
      ctx.scene.change_time(ctx, min_time);
      this.min_time = min_time;
      this.max_time = max_time;
      this.timer = window.setInterval(function () {
        this2.render_frame();
      }, 10);
    }
     render_frame() {
      var ctx=this.modal_ctx;
      if (ctx==undefined||!this.modalRunning) {
          console.log("Timer end");
          window.clearInterval(this.timer);
          this.end();
          return ;
      }
      var scene=ctx.scene;
      if (scene.time>=this.max_time+25) {
          this.end(ctx);
          return ;
      }
      console.log("rendering frame", scene.time);
      var vd=this.viewport;
      var canvas=document.createElement("canvas");
      canvas.width = vd.size[0], canvas.height = vd.size[1];
      var g1=ctx.view2d.draw_canvas_ctx;
      var idata=g1.getImageData(vd.pos[0], vd.pos[1], vd.size[0], vd.size[1]);
      var g2=canvas.getContext("2d");
      g2.putImageData(idata, 0, 0);
      var image=canvas.toDataURL();
      var frame={time: scene.time, 
     data: idata};
      window.anim_to_playback.push(frame);
      window.anim_to_playback.filesize+=image.length;
      scene.change_time(ctx, scene.time+1);
      window.redraw_viewport();
    }
     end(ctx) {
      if (this.timer!=undefined)
        window.clearInterval(this.timer);
      this.end_modal();
    }
     on_keydown(event) {
      switch (event.keyCode) {
        case charmap["Escape"]:
          this.end(this.modal_ctx);
      }
    }
  }
  _ESClass.register(RenderAnimOp);
  _es6_module.add_class(RenderAnimOp);
  RenderAnimOp = _es6_module.add_export('RenderAnimOp', RenderAnimOp);
  class PlayAnimOp extends ToolOp {
     constructor() {
      super();
    }
    static  tooldef() {
      return {uiname: "Play", 
     toolpath: "view2d.play_anim", 
     is_modal: true, 
     inputs: {}, 
     outputs: {}, 
     undoflag: UndoFlags.NO_UNDO}
    }
     start_modal(ctx) {
      super.start_modal(ctx);
      console.log("Anim render start!");
      this.viewport = {pos: [ctx.view2d.pos[0], window.innerHeight-(ctx.view2d.pos[1]+ctx.view2d.size[1])], 
     size: [ctx.view2d.size[0], ctx.view2d.size[1]]};
      var this2=this;
      var pathspline=ctx.frameset.pathspline;
      this.start_time = time_ms();
      this.timer = window.setInterval(function () {
        if (this2.doing_draw)
          return ;
        this2.render_frame();
      }, 10);
    }
     render_frame() {
      var ctx=this.modal_ctx;
      if (ctx==undefined||!this.modalRunning) {
          console.log("Timer end");
          window.clearInterval(this.timer);
          this.end();
          return ;
      }
      var vd=window.anim_to_playback.viewport;
      var g1=ctx.view2d.draw_canvas_ctx;
      var time=time_ms()-this.start_time;
      time = (time/1000.0)*24.0;
      var fi=Math.floor(time);
      var vd=window.anim_to_playback.viewport;
      var pos=ctx.view2d.pos;
      var this2=this;
      if (fi>=window.anim_to_playback.length) {
          console.log("end");
          this.end();
          window.redraw_viewport();
          return ;
      }
      var frame=window.anim_to_playback[fi];
      this.doing_draw = true;
      var draw=function draw() {
        this2.doing_draw = false;
        if (frame!=undefined) {
            if (g1._putImageData!=undefined)
              g1._putImageData(frame.data, pos[0], window.innerHeight-(pos[1]+vd.size[1]));
            else 
              g1.putImageData(frame.data, pos[0], window.innerHeight-(pos[1]+vd.size[1]));
        }
      };
      requestAnimationFrame(draw);
    }
     end(ctx) {
      if (this.timer!=undefined)
        window.clearInterval(this.timer);
      this.end_modal();
    }
     on_keydown(event) {
      switch (event.keyCode) {
        case charmap["Escape"]:
          this.end(this.modal_ctx);
      }
    }
  }
  _ESClass.register(PlayAnimOp);
  _es6_module.add_class(PlayAnimOp);
  PlayAnimOp = _es6_module.add_export('PlayAnimOp', PlayAnimOp);
  var EditorTypes=es6_import_item(_es6_module, './view2d_base.js', 'EditorTypes');
  var $ops_vP9R_tools_menu;
  class SplineEditor extends View2DEditor {
    
    
     constructor(view2d) {
      var keymap=new KeyMap("view2d:splinetool2");
      super("Geometry", EditorTypes.SPLINE, EditModes2.GEOMETRY, DataTypes.FRAMESET, keymap);
      this.mpos = new Vector3();
      this.start_mpos = new Vector3();
      this.define_keymap();
      this.vieiw3d = view2d;
      this.highlight_spline = undefined;
    }
     on_area_inactive(view2d) {

    }
     editor_duplicate(view2d) {
      var m=new SplineEditor(view2d);
      m.selectmode = this.selectmode;
      m.keymap = this.keymap;
      return m;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
    static  fromSTRUCT(reader) {
      var m=new SplineEditor(undefined);
      reader(m);
      return m;
    }
     data_link(block, getblock, getblock_us) {
      this.ctx = new Context();
    }
     add_menu(view2d, mpos, add_title=true) {
      this.ctx = new Context();
      console.log("Add menu");
      var oplist=[];
      var menu=toolop_menu(view2d.ctx, add_title ? "Add" : "", oplist);
      return menu;
    }
     on_tick(ctx) {
      let widgets=[WidgetResizeOp, WidgetRotateOp];
      if (ctx.view2d.toolmode==ToolModes.RESIZE) {
          ctx.view2d.widgets.ensure_toolop(ctx, WidgetResizeOp);
      }
      else 
        if (ctx.view2d.toolmode==ToolModes.ROTATE) {
          ctx.view2d.widgets.ensure_toolop(ctx, WidgetRotateOp);
      }
      else {
        for (let cls of widgets) {
            ctx.view2d.widgets.ensure_not_toolop(ctx, cls);
        }
      }
    }
     build_sidebar1(view2d, col) {
      console.trace("build_sidebar1");
      var ctx=new Context();
      col.packflag|=PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT|PackFlags.INHERIT_WIDTH;
      col.default_packflag = PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
      col.draw_background = true;
      col.rcorner = 100.0;
      col.default_packflag|=PackFlags.USE_LARGE_ICON;
      col.default_packflag&=~PackFlags.USE_SMALL_ICON;
      let blank=new UIFrame(this.ctx);
      blank.size[0] = 70;
      blank.size[1] = 1;
      blank.get_min_size = function () {
        return this.size;
      };
      col.add(blank);
      col.toolop("spline.make_edge()");
      col.toolop("spline.make_edge_face()");
      col.toolop("spline.split_pick_edge_transform()");
      col.toolop("spline.change_face_z(offset=1, selmode='selectmode')", PackFlags.USE_LARGE_ICON, "Move Up", Icons.Z_UP);
      col.toolop("spline.change_face_z(offset=-1, selmode='selectmode')", PackFlags.USE_LARGE_ICON, "Move Down", Icons.Z_DOWN);
      col.prop("view2d.draw_anim_paths");
    }
     build_bottombar(view2d, col) {
      var ctx=new Context();
      col.packflag|=PackFlags.ALIGN_LEFT|PackFlags.INHERIT_WIDTH|PackFlags.INHERIT_HEIGHT;
      col.packflag|=PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT;
      col.default_packflag = PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
      col.rcorner = 100.0;
      col.add(gen_editor_switcher(this.ctx, view2d));
      var prop=col.prop("view2d.selectmode", PackFlags.USE_SMALL_ICON|PackFlags.ENUM_STRIP);
      prop.packflag|=PackFlags.USE_ICON|PackFlags.ENUM_STRIP;
      col.prop('view2d.default_stroke', PackFlags.COLOR_BUTTON_ONLY);
      col.prop('view2d.edit_all_layers');
    }
     define_keymap() {
      var k=this.keymap;
      k.add_tool(new HotKey("PageUp", [], "Send Face Up"), "spline.change_face_z(offset=1 selmode='selectmode')");
      k.add_tool(new HotKey("PageDown", [], "Send Face Down"), "spline.change_face_z(offset=-1 selmode='selectmode')");
      k.add_tool(new HotKey("G", [], "Translate"), "spline.translate(datamode='selectmode')");
      k.add_tool(new HotKey("S", [], "Scale"), "spline.scale(datamode='selectmode')");
      k.add_tool(new HotKey("S", ["SHIFT"], "Scale Time"), "spline.shift_time()");
      k.add_tool(new HotKey("R", [], "Rotate"), "spline.rotate(datamode='selectmode')");
      k.add_tool(new HotKey("A", [], "Select Linked"), "spline.toggle_select_all()");
      k.add_tool(new HotKey("A", ["ALT"], "Animation Playback"), "editor.playback()");
      k.add_tool(new HotKey("H", [], "Hide Selection"), "spline.hide(selmode='selectmode')");
      k.add_tool(new HotKey("H", ["ALT"], "Reveal Selection"), "spline.unhide(selmode='selectmode')");
      k.add_tool(new HotKey("G", ["CTRL"], "Ghost Selection"), "spline.hide(selmode='selectmode', ghost=1)");
      k.add_tool(new HotKey("G", ["ALT"], "Unghost Selection"), "spline.unhide(selmode='selectmode', ghost=1)");
      k.add(new HotKey("L", [], "Select Linked"), new FuncKeyHandler(function (ctx) {
        var mpos=ctx.keymap_mpos;
        var ret=ctx.spline.q.findnearest_vert(ctx.view2d, mpos, 55, undefined, ctx.view2d.edit_all_layers);
        console.log("select linked", ret);
        if (ret!==undefined) {
            var tool=new SelectLinkedOp(true, ctx.view2d.selectmode);
            tool.inputs.vertex_eid.setValue(ret[0].eid);
            tool.inputs.mode.setValue("SELECT");
            ctx.appstate.toolstack.exec_tool(tool);
        }
      }));
      k.add(new HotKey("L", ["SHIFT"], "Select Linked"), new FuncKeyHandler(function (ctx) {
        var mpos=ctx.keymap_mpos;
        var ret=ctx.spline.q.findnearest_vert(ctx.view2d, mpos, 55, undefined, ctx.view2d.edit_all_layers);
        if (ret!=undefined) {
            var tool=new SelectLinkedOp(true);
            tool.inputs.vertex_eid.setValue(ret[0].eid);
            tool.inputs.mode.setValue("deselect");
            ctx.appstate.toolstack.exec_tool(tool);
        }
      }));
      k.add_tool(new HotKey("B", [], "Toggle Break-Tangents"), "spline.toggle_break_tangents()");
      k.add_tool(new HotKey("B", ["SHIFT"], "Toggle Break-Curvature"), "spline.toggle_break_curvature()");
      var this2=this;
      function del_tool(ctx) {
        console.log("delete");
        if (this2.selectmode&SelMask.SEGMENT) {
            console.log("kill segments");
            var op=new DeleteSegmentOp();
            g_app_state.toolstack.exec_tool(op);
        }
        else 
          if (this2.selectmode&SelMask.FACE) {
            console.log("kill faces");
            var op=new DeleteFaceOp();
            g_app_state.toolstack.exec_tool(op);
        }
        else {
          console.log("kill verts");
          var op=new DeleteVertOp();
          g_app_state.toolstack.exec_tool(op);
        }
      }
      k.add(new HotKey("X", [], "Delete"), new FuncKeyHandler(del_tool));
      k.add(new HotKey("Delete", [], "Delete"), new FuncKeyHandler(del_tool));
      k.add(new HotKey("Backspace", [], "Delete"), new FuncKeyHandler(del_tool));
      k.add_tool(new HotKey("D", [], "Dissolve Vertices"), "spline.dissolve_verts()");
      k.add_tool(new HotKey("D", ["SHIFT"], "Duplicate"), "spline.duplicate_transform()");
      k.add_tool(new HotKey("F", [], "Create Face/Edge"), "spline.make_edge_face()");
      k.add_tool(new HotKey("E", [], "Split Segments"), "spline.split_edges()");
      k.add_tool(new HotKey("M", [], "Mirror Verts"), "spline.mirror_verts()");
      k.add_tool(new HotKey("C", [], "Circle Select"), "view2d.circle_select()");
      k.add(new HotKey("Z", [], "Toggle Only Render"), new FuncKeyHandler(function (ctx) {
        ctx.view2d.only_render^=1;
        window.redraw_viewport();
      }));
      k.add(new HotKey("W", [], "Tools Menu"), new FuncKeyHandler(function (ctx) {
        var mpos=ctx.keymap_mpos;
        ctx.view2d.tools_menu(ctx, mpos);
      }));
    }
     set_selectmode(mode) {
      this.selectmode = mode;
    }
     do_select(event, mpos, view2d, do_multiple=false) {
      return false;
    }
     tools_menu(ctx, mpos, view2d) {
      var menu=view2d.toolop_menu(ctx, "Tools", $ops_vP9R_tools_menu);
      view2d.call_menu(menu, view2d, mpos);
    }
     on_inactive(view2d) {

    }
     on_active(view2d) {

    }
     rightclick_menu(event, view2d) {

    }
     _get_spline() {
      return this.ctx.spline;
    }
     on_mousedown(event) {
      var spline=this.ctx.spline;
      var toolmode=this.ctx.view2d.toolmode;
      if (this.highlight_spline!==undefined) {
      }
      if (this.highlight_spline!==undefined&&this.highlight_spline!==spline) {
          var newpath;
          console.log("spline switch!");
          if (this.highlight_spline.is_anim_path) {
              newpath = "frameset.pathspline";
          }
          else {
            newpath = "frameset.drawspline";
          }
          console.log(spline._debug_id, this.highlight_spline._debug_id);
          console.log("new path!", G.active_splinepath, newpath);
          this.ctx.switch_active_spline(newpath);
          spline = this._get_spline();
          redraw_viewport();
      }
      if ("size" in spline&&spline[0]!=window.innerWidth&&spline[1]!=window.innerHeight) {
          spline.size[0] = window.innerWidth;
          spline.size[1] = window.innerHeight;
      }
      if (event.button==0) {
          var can_append=toolmode==ToolModes.APPEND;
          can_append = can_append&&(this.selectmode&(SelMask.VERTEX|SelMask.HANDLE));
          can_append = can_append&&spline.verts.highlight===undefined&&spline.handles.highlight===undefined;
          if (can_append) {
              var co=new Vector3([event.x, event.y, 0]);
              this.view2d.unproject(co);
              console.log(co);
              var op=new ExtrudeVertOp(co, this.ctx.view2d.extrude_mode);
              op.inputs.location.setValue(co);
              op.inputs.linewidth.setValue(this.ctx.view2d.default_linewidth);
              op.inputs.stroke.setValue(this.ctx.view2d.default_stroke);
              g_app_state.toolstack.exec_tool(op);
              redraw_viewport();
          }
          else {
            for (var i=0; i<spline.elists.length; i++) {
                var list=spline.elists[i];
                if (!(this.selectmode&list.type))
                  continue;
                
                if (list.highlight==undefined)
                  continue;
                var op=new SelectOneOp(list.highlight, !event.shiftKey, !(list.highlight.flag&SplineFlags.SELECT), this.selectmode, true);
                g_app_state.toolstack.exec_tool(op);
            }
          }
          this.start_mpos[0] = event.x;
          this.start_mpos[1] = event.y;
          this.start_mpos[2] = 0.0;
          this.mdown = true;
      }
    }
     ensure_paths_off() {
      if (g_app_state.active_splinepath!="frameset.drawspline") {
          this.highlight_spline = undefined;
          var spline=this.ctx.spline;
          g_app_state.switch_active_spline("frameset.drawspline");
          spline.clear_highlight();
          spline.solve();
          redraw_viewport();
      }
    }
    get  draw_anim_paths() {
      return this.ctx.view2d.draw_anim_paths;
    }
     findnearest(mpos, selectmask, limit, ignore_layers) {
      var frameset=this.ctx.frameset;
      var editor=this.ctx.view2d;
      var closest=[0, 0, 0];
      var mindis=1e+17;
      var found=false;
      if (!this.draw_anim_paths) {
          this.ensure_paths_off();
          var ret=this.ctx.spline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, ignore_layers);
          if (ret!=undefined) {
              return [this.ctx.spline, ret[0], ret[1]];
          }
          else {
            return undefined;
          }
      }
      var actspline=this.ctx.spline;
      var pathspline=this.ctx.frameset.pathspline;
      var drawspline=this.ctx.frameset.spline;
      var ret=drawspline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, ignore_layers);
      if (ret!=undefined&&ret[1]<limit) {
          mindis = ret[1]-(drawspline===actspline ? 3 : 0);
          found = true;
          closest[0] = drawspline;
          closest[1] = ret[0];
          closest[2] = mindis;
      }
      var ret=frameset.pathspline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, false);
      if (ret!=undefined) {
          ret[1]-=pathspline===actspline ? 2 : 0;
          if (ret[1]<limit&&ret[1]<mindis) {
              closest[0] = pathspline;
              closest[1] = ret[0];
              closest[2] = ret[1]-(pathspline===actspline ? 3 : 0);
              mindis = ret[1];
              found = true;
          }
      }
      if (!found)
        return undefined;
      return closest;
    }
     on_mousemove(event) {
      if (this.ctx==undefined)
        return ;
      var toolmode=this.ctx.view2d.toolmode;
      var selectmode=this.selectmode;
      var limit=selectmode&SelMask.SEGMENT ? 55 : 12;
      if (toolmode==ToolModes.SELECT)
        limit*=3;
      var spline=this.ctx.spline;
      spline.size = [window.innerWidth, window.innerHeight];
      this.mpos[0] = event.x, this.mpos[1] = event.y, this.mpos[2] = 0.0;
      var selectmode=this.selectmode;
      if (this.mdown) {
          this.mdown = false;
          let mpos=new Vector2();
          mpos.load(this.start_mpos);
          var op=new TranslateOp(mpos);
          console.log("start_mpos:", mpos);
          op.inputs.datamode.setValue(this.ctx.view2d.selectmode);
          op.inputs.edit_all_layers.setValue(this.ctx.view2d.edit_all_layers);
          var ctx=new Context();
          if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
              op.inputs.proportional.setValue(true);
              op.inputs.propradius.setValue(ctx.view2d.propradius);
          }
          g_app_state.toolstack.exec_tool(op);
          return ;
      }
      if (this.mdown)
        return ;
      var ret=this.findnearest([event.x, event.y], this.ctx.view2d.selectmode, limit, this.ctx.view2d.edit_all_layers);
      if (ret!=undefined&&typeof (ret[1])!="number"&&ret[2]!=SelMask.MULTIRES) {
          if (this.highlight_spline!=undefined) {
              for (var list of this.highlight_spline.elists) {
                  if (list.highlight!=undefined) {
                      redraw_element(list.highlight, this.view2d);
                  }
              }
          }
          if (ret[0]!==this.highlight_spline&&this.highlight_spline!=undefined) {
              this.highlight_spline.clear_highlight();
          }
          this.highlight_spline = ret[0];
          this.highlight_spline.clear_highlight();
          var list=this.highlight_spline.get_elist(ret[1].type);
          list.highlight = ret[1];
          redraw_element(list.highlight, this.view2d);
      }
      else {
        if (this.highlight_spline!=undefined) {
            for (var i=0; i<this.highlight_spline.elists.length; i++) {
                var list=this.highlight_spline.elists[i];
                if (list.highlight!=undefined) {
                    redraw_element(list.highlight, this.view2d);
                }
            }
            this.highlight_spline.clear_highlight();
        }
      }
    }
     on_mouseup(event) {
      var spline=this._get_spline();
      spline.size = [window.innerWidth, window.innerHeight];
      this.mdown = false;
    }
     do_alt_select(event, mpos, view2d) {

    }
     gen_edit_menu(add_title=false) {
      var view2d=this.view2d;
      var ctx=new Context();
      var ops=["spline.select_linked(vertex_eid=active_vertex())", "view2d.circle_select()", "spline.toggle_select_all()", "spline.hide()", "spline.unhide()", "spline.connect_handles()", "spline.disconnect_handles()", "spline.duplicate_transform()", "spline.mirror_verts()", "spline.split_edges()", "spline.make_edge_face()", "spline.dissolve_verts()", "spline.delete_verts()", "spline.delete_segments()", "spline.delete_faces()", "spline.split_edges()", "spline.toggle_manual_handles()"];
      ops.reverse();
      var menu=view2d.toolop_menu(ctx, add_title ? "Edit" : "", ops);
      return menu;
    }
     delete_menu(event) {
      var view2d=this.view2d;
      var ctx=new Context();
      var menu=this.gen_delete_menu(true);
      menu.close_on_right = true;
      menu.swap_mouse_button = 2;
      view2d.call_menu(menu, view2d, [event.x, event.y]);
    }
  }
  var $ops_vP9R_tools_menu=["spline.key_edges()", "spline.key_current_frame()", "spline.connect_handles()", "spline.disconnect_handles()", "spline.toggle_step_mode()", "spline.toggle_manual_handles()", "editor.paste_pose()", "editor.copy_pose()"];
  _ESClass.register(SplineEditor);
  _es6_module.add_class(SplineEditor);
  SplineEditor = _es6_module.add_export('SplineEditor', SplineEditor);
  SplineEditor.STRUCT = `
  SplineEditor {
    selectmode : int;
  }
`;
  var ScreenArea=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'ScreenArea');
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
}, '/dev/fairmotion/src/editors/viewport/view2d_spline_ops.js');


es6_module_define('view2d_object_ops', ["./transform.js", "../../curve/spline_multires.js", "../../path.ux/scripts/screen/ScreenArea.js", "./view2d_base.js", "./view2d_editor.js", "../../curve/spline_types.js", "../../core/toolops_api.js", "./transform_ops.js", "./multires/multires_ops.js", "../../core/animdata.js", "./multires/multires_selectops.js", "../../core/struct.js", "../../curve/spline.js", "../../core/lib_api.js", "../events.js", "../../curve/spline_draw.js", "./spline_createops.js", "./spline_editops.js", "./spline_selectops.js", "./selectmode.js"], function _view2d_object_ops_module(_es6_module) {
  "use strict";
  var ExtrudeVertOp=es6_import_item(_es6_module, './spline_createops.js', 'ExtrudeVertOp');
  var DeleteVertOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, './spline_editops.js', 'DeleteSegmentOp');
  var CreateMResPoint=es6_import_item(_es6_module, './multires/multires_ops.js', 'CreateMResPoint');
  var mr_selectops=es6_import(_es6_module, './multires/multires_selectops.js');
  var spline_selectops=es6_import(_es6_module, './spline_selectops.js');
  var WidgetResizeOp=es6_import_item(_es6_module, './transform_ops.js', 'WidgetResizeOp');
  var WidgetRotateOp=es6_import_item(_es6_module, './transform_ops.js', 'WidgetRotateOp');
  var compose_id=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'decompose_id');
  var MResFlags=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'MResFlags');
  var MultiResLayer=es6_import_item(_es6_module, '../../curve/spline_multires.js', 'MultiResLayer');
  var ScreenArea, Area;
  var DataTypes=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataTypes');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var EditModes=es6_import_item(_es6_module, './view2d_editor.js', 'EditModes');
  var KeyMap=es6_import_item(_es6_module, '../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../events.js', 'EventHandler');
  var SelectLinkedOp=es6_import_item(_es6_module, './spline_selectops.js', 'SelectLinkedOp');
  var SelectOneOp=es6_import_item(_es6_module, './spline_selectops.js', 'SelectOneOp');
  var TranslateOp=es6_import_item(_es6_module, './transform.js', 'TranslateOp');
  var SelMask=es6_import_item(_es6_module, './selectmode.js', 'SelMask');
  var ToolModes=es6_import_item(_es6_module, './selectmode.js', 'ToolModes');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFlags');
  var SplineVertex=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineSegment');
  var SplineFace=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFace');
  var Spline=es6_import_item(_es6_module, '../../curve/spline.js', 'Spline');
  var View2DEditor=es6_import_item(_es6_module, './view2d_editor.js', 'View2DEditor');
  var SessionFlags=es6_import_item(_es6_module, './view2d_editor.js', 'SessionFlags');
  var DataBlock=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataTypes');
  var redraw_element=es6_import_item(_es6_module, '../../curve/spline_draw.js', 'redraw_element');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ModalStates');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var get_vtime=es6_import_item(_es6_module, '../../core/animdata.js', 'get_vtime');
  var EditorTypes=es6_import_item(_es6_module, './view2d_base.js', 'EditorTypes');
  class SceneObjectEditor extends View2DEditor {
    
    
     constructor(view2d) {
      super("Object", EditorTypes.OBJECT, EditModes.OBJECT, DataTypes.FRAMESET, keymap);
      this.mpos = new Vector3();
      this.start_mpos = new Vector3();
      this.define_keymap();
      this.view2d = view2d;
      this.highlight_spline = undefined;
    }
     on_area_inactive(view2d) {

    }
     editor_duplicate(view2d) {
      var m=new SceneObjectEditor(view2d);
      m.selectmode = this.selectmode;
      m.keymap = this.keymap;
      return m;
    }
    static  fromSTRUCT(reader) {
      var m=new SceneObjectEditor(undefined);
      reader(m);
      return m;
    }
     data_link(block, getblock, getblock_us) {
      this.ctx = new Context();
    }
     add_menu(view2d, mpos, add_title=true) {

    }
     on_tick(ctx) {
      let widgets=[WidgetResizeOp, WidgetRotateOp];
      if (ctx.view2d.toolmode==ToolModes.RESIZE) {
          ctx.view2d.widgets.ensure_toolop(ctx, WidgetResizeOp);
      }
      else 
        if (ctx.view2d.toolmode==ToolModes.ROTATE) {
          ctx.view2d.widgets.ensure_toolop(ctx, WidgetRotateOp);
      }
      else {
        for (let cls of widgets) {
            ctx.view2d.widgets.ensure_not_toolop(ctx, cls);
        }
      }
    }
     build_sidebar1(view2d, col) {

    }
     build_bottombar(view2d, col) {

    }
     define_keymap() {
      var k=this.keymap;
    }
     set_selectmode(mode) {
      this.selectmode = mode;
    }
     do_select(event, mpos, view2d, do_multiple) {
      return false;
    }
     tools_menu(ctx, mpos, view2d) {
      let ops=[];
      var menu=view2d.toolop_menu(ctx, "Tools", ops);
      view2d.call_menu(menu, view2d, mpos);
    }
     on_inactive(view2d) {

    }
     on_active(view2d) {

    }
     rightclick_menu(event, view2d) {

    }
     on_mousedown(event) {

    }
     ensure_paths_off() {
      if (g_app_state.active_splinepath!="frameset.drawspline") {
          this.highlight_spline = undefined;
          var spline=this.ctx.spline;
          g_app_state.switch_active_spline("frameset.drawspline");
          spline.clear_highlight();
          spline.solve();
          redraw_viewport();
      }
    }
    get  draw_anim_paths() {
      return this.ctx.view2d.draw_anim_paths;
    }
     findnearest(mpos, selectmask, limit, ignore_layers) {

    }
     on_mousemove(event) {
      this.mdown = true;
    }
     on_mouseup(event) {
      this.mdown = false;
    }
     do_alt_select(event, mpos, view2d) {

    }
     gen_edit_menu(add_title=false) {

    }
     delete_menu(event) {

    }
  }
  _ESClass.register(SceneObjectEditor);
  _es6_module.add_class(SceneObjectEditor);
  SceneObjectEditor = _es6_module.add_export('SceneObjectEditor', SceneObjectEditor);
  SceneObjectEditor.STRUCT = `
SceneObjectEditor {
  selectmode : int;
}
`;
  var ScreenArea=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'ScreenArea');
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
}, '/dev/fairmotion/src/editors/viewport/view2d_object_ops.js');


es6_module_define('sceneobject_ops', ["../../core/struct.js", "../../core/toolprops.js", "../../core/toolops_api.js"], function _sceneobject_ops_module(_es6_module) {
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var Vec2Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec2Property');
  var Vec3Property=es6_import_item(_es6_module, '../../core/toolprops.js', 'Vec3Property');
  var EnumProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'EnumProperty');
  var FlagProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FlagProperty');
  var StringProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'StringProperty');
  var IntProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../core/toolprops.js', 'FloatProperty');
  var TPropFlags=es6_import_item(_es6_module, '../../core/toolprops.js', 'TPropFlags');
  var PropTypes=es6_import_item(_es6_module, '../../core/toolprops.js', 'PropTypes');
  var PropSubTypes=es6_import_item(_es6_module, '../../core/toolprops.js', 'PropSubTypes');
  var ToolOp=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolFlags');
  var ToolMacro=es6_import_item(_es6_module, '../../core/toolops_api.js', 'ToolMacro');
}, '/dev/fairmotion/src/editors/viewport/sceneobject_ops.js');


es6_module_define('view2d_base', [], function _view2d_base_module(_es6_module) {
  var EditModes={VERT: 1, 
   EDGE: 2, 
   HANDLE: 4, 
   FACE: 16, 
   OBJECT: 32, 
   GEOMETRY: 1|2|4|16}
  EditModes = _es6_module.add_export('EditModes', EditModes);
  var EditorTypes={SPLINE: 1, 
   OBJECT: 32}
  EditorTypes = _es6_module.add_export('EditorTypes', EditorTypes);
  var SessionFlags={PROP_TRANSFORM: 1}
  SessionFlags = _es6_module.add_export('SessionFlags', SessionFlags);
}, '/dev/fairmotion/src/editors/viewport/view2d_base.js');


es6_module_define('animspline', ["../path.ux/scripts/util/struct.js", "./struct.js", "./lib_api.js", "./toolprops.js", "../curve/spline.js", "../curve/spline_element_array.js", "../curve/spline_types.js", "./animdata.js"], function _animspline_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  var DataBlock=es6_import_item(_es6_module, './lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, './lib_api.js', 'DataTypes');
  var Spline=es6_import_item(_es6_module, '../curve/spline.js', 'Spline');
  var RestrictFlags=es6_import_item(_es6_module, '../curve/spline.js', 'RestrictFlags');
  var CustomDataLayer=es6_import_item(_es6_module, '../curve/spline_types.js', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineFlags');
  var SplineSegment=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineSegment');
  var TimeDataLayer=es6_import_item(_es6_module, './animdata.js', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, './animdata.js', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, './animdata.js', 'set_vtime');
  var AnimChannel=es6_import_item(_es6_module, './animdata.js', 'AnimChannel');
  var AnimKey=es6_import_item(_es6_module, './animdata.js', 'AnimKey');
  var AnimInterpModes=es6_import_item(_es6_module, './animdata.js', 'AnimInterpModes');
  var AnimKeyFlags=es6_import_item(_es6_module, './animdata.js', 'AnimKeyFlags');
  var SplineLayerFlags=es6_import_item(_es6_module, '../curve/spline_element_array.js', 'SplineLayerFlags');
  var SplineLayerSet=es6_import_item(_es6_module, '../curve/spline_element_array.js', 'SplineLayerSet');
  es6_import(_es6_module, '../path.ux/scripts/util/struct.js');
  var restrictflags=RestrictFlags.NO_DELETE|RestrictFlags.NO_EXTRUDE|RestrictFlags.NO_CONNECT;
  var vertanimdata_eval_cache=cachering.fromConstructor(Vector2, 512);
  var AnimChannel=es6_import_item(_es6_module, './animdata.js', 'AnimChannel');
  var AnimKey=es6_import_item(_es6_module, './animdata.js', 'AnimKey');
  var PropTypes=es6_import_item(_es6_module, './toolprops.js', 'PropTypes');
  class VertexAnimIter  {
    
    
     constructor(vd) {
      this.ret = {done: false, 
     value: undefined};
      this.stop = false;
      if (vd!=undefined)
        VertexAnimIter.init(this, vd);
    }
     init(vd) {
      this.vd = vd;
      this.v = vd.startv;
      this.stop = false;
      if (this.v!=undefined&&this.v.segments.length!=0)
        this.s = this.v.segments[0];
      else 
        this.s = undefined;
      this.ret.done = false;
      this.ret.value = undefined;
      return this;
    }
     [Symbol.iterator](self) {
      return this;
    }
     next() {
      var ret=this.ret;
      if (this.vd.startv==undefined) {
          ret.done = true;
          ret.value = undefined;
          return ret;
      }
      if (this.stop&&this.v==undefined) {
          ret.done = true;
          ret.value = undefined;
          return ret;
      }
      ret.value = this.v;
      if (this.stop||this.s==undefined) {
          this.v = undefined;
          if (ret.value==undefined)
            ret.done = true;
          return ret;
      }
      this.v = this.s.other_vert(this.v);
      if (this.v.segments.length<2) {
          this.stop = true;
          return ret;
      }
      this.s = this.v.other_segment(this.s);
      return ret;
    }
  }
  _ESClass.register(VertexAnimIter);
  _es6_module.add_class(VertexAnimIter);
  VertexAnimIter = _es6_module.add_export('VertexAnimIter', VertexAnimIter);
  class SegmentAnimIter  {
    
    
     constructor(vd) {
      this.ret = {done: false, 
     value: undefined};
      this.stop = false;
      if (this.v!=undefined&&this.v.segments.length!=0)
        if (vd!=undefined)
        SegmentAnimIter.init(this, vd);
    }
     init(vd) {
      this.vd = vd;
      this.v = vd.startv;
      this.stop = false;
      if (this.v!==undefined)
        this.s = this.v.segments[0];
      else 
        this.s = undefined;
      this.ret.done = false;
      this.ret.value = undefined;
      return this;
    }
     [Symbol.iterator](self) {
      return this;
    }
     next() {
      var ret=this.ret;
      if (this.stop||this.s==undefined) {
          ret.done = true;
          ret.value = undefined;
          return ret;
      }
      ret.value = this.s;
      this.v = this.s.other_vert(this.v);
      if (this.v.segments.length<2) {
          this.stop = true;
          return ret;
      }
      this.s = this.v.other_segment(this.s);
      return ret;
    }
  }
  _ESClass.register(SegmentAnimIter);
  _es6_module.add_class(SegmentAnimIter);
  SegmentAnimIter = _es6_module.add_export('SegmentAnimIter', SegmentAnimIter);
  var VDAnimFlags={SELECT: 1, 
   STEP_FUNC: 2, 
   HIDE: 4, 
   OWNER_IS_EDITABLE: 8}
  VDAnimFlags = _es6_module.add_export('VDAnimFlags', VDAnimFlags);
  let dvcache=cachering.fromConstructor(Vector2, 256);
  class VertexAnimData  {
    
    
    
    
    
     constructor(eid, pathspline) {
      this.eid = eid;
      this.dead = false;
      this.vitercache = cachering.fromConstructor(VertexAnimIter, 4);
      this.sitercache = cachering.fromConstructor(SegmentAnimIter, 4);
      this.spline = pathspline;
      this.animflag = 0;
      this.flag = 0;
      this.visible = false;
      this.path_times = {};
      this.startv_eid = -1;
      if (pathspline!==undefined) {
          var layer=pathspline.layerset.new_layer();
          layer.flag|=SplineLayerFlags.HIDE;
          this.layerid = layer.id;
      }
      this._start_layer_id = undefined;
      this.cur_time = 0;
    }
    get  startv() {
      if (this.startv_eid===-1)
        return undefined;
      return this.spline.eidmap[this.startv_eid];
    }
    set  startv(v) {
      if (typeof v=="number") {
          this.startv_eid = v;
          return ;
      }
      if (v!==undefined) {
          this.startv_eid = v.eid;
      }
      else {
        this.startv_eid = -1;
      }
    }
     _set_layer() {
      if (this.spline.layerset.active.id!==this.layerid)
        this._start_layer_id = this.spline.layerset.active.id;
      if (this.layerid===undefined) {
          console.log("Error in _set_layer in VertexAnimData!!!");
          return ;
      }
      this.spline.layerset.active = this.spline.layerset.idmap[this.layerid];
    }
     [Symbol.keystr]() {
      return this.eid;
    }
     _unset_layer() {
      if (this._start_layer_id!==undefined) {
          var layer=this.spline.layerset.idmap[this._start_layer_id];
          if (layer!==undefined)
            this.spline.layerset.active = layer;
      }
      this._start_layer_id = undefined;
    }
     remove(v) {
      if (v===this.startv) {
          let startv=undefined;
          for (let v2 of this.verts) {
              if (v2!==v) {
                  startv = v2;
                  break;
              }
          }
          if (startv) {
              this.startv_eid = startv.eid;
              this.spline.remove(v);
          }
          else {
            this.dead = true;
            this.spline.remove(v);
          }
      }
      else {
        let ok=false;
        for (let v2 of this.verts) {
            if (v===v2) {
                ok = true;
                break;
            }
        }
        if (!ok) {
            console.error("Key not in this anim spline", v);
            return ;
        }
        if (v.segments.length===2) {
            this.spline.dissolve_vertex(v);
        }
        else {
          this.spline.kill_vertex(v);
        }
      }
    }
    get  verts() {
      return this.vitercache.next().init(this);
    }
    get  segments() {
      return this.sitercache.next().init(this);
    }
     find_seg(time) {
      var v=this.startv;
      if (v===undefined)
        return undefined;
      if (v.segments.length===0)
        return undefined;
      var s=v.segments[0];
      var lastv=v;
      while (1) {
        lastv = v;
        v = s.other_vert(v);
        if (get_vtime(v)>time) {
            return s;
        }
        if (v.segments.length<2) {
            lastv = v;
            break;
        }
        s = v.other_segment(s);
      }
      return undefined;
    }
     _get_animdata(v) {
      let ret=v.cdata.get_layer(TimeDataLayer);
      ret.owning_veid = this.eid;
      return ret;
    }
     update(co, time) {
      this._set_layer();
      let update=false;
      if (time<0) {
          console.trace("ERROR! negative times not supported!");
          this._unset_layer();
          return false;
      }
      if (this.startv===undefined) {
          this.startv = this.spline.make_vertex(co);
          this._get_animdata(this.startv).time = 1;
          update = true;
          this.spline.regen_sort();
          this.spline.resolve = 1;
      }
      var spline=this.spline;
      var seg=this.find_seg(time);
      if (seg===undefined) {
          var e=this.endv;
          if (this._get_animdata(e).time===time) {
              update = update||e.vectorDistance(co)>0.01;
              e.load(co);
              e.flag|=SplineFlags.UPDATE;
          }
          else {
            var nv=spline.make_vertex(co);
            this._get_animdata(nv).time = time;
            spline.make_segment(e, nv);
            spline.regen_sort();
            update = true;
          }
      }
      else {
        if (get_vtime(seg.v1)===time) {
            update = update||seg.v1.vectorDistance(co)>0.01;
            seg.v1.load(co);
            seg.v1.flag|=SplineFlags.UPDATE;
        }
        else 
          if (get_vtime(seg.v2)===time) {
            update = update||seg.v2.vectorDistance(co)>0.01;
            seg.v2.load(co);
            seg.v2.flag|=SplineFlags.UPDATE;
        }
        else {
          var ret=spline.split_edge(seg);
          var nv=ret[1];
          spline.regen_sort();
          this._get_animdata(nv).time = time;
          update = true;
          nv.load(co);
        }
      }
      spline.resolve = 1;
      this._unset_layer();
      return update;
    }
    get  start_time() {
      var v=this.startv;
      if (v===undefined)
        return 0;
      return get_vtime(v);
    }
    get  end_time() {
      var v=this.endv;
      if (v===undefined)
        return 0;
      return get_vtime(v);
    }
     draw(g, matrix, alpha, time) {
      if (!(this.visible))
        return ;
      var step_func=this.animflag&VDAnimFlags.STEP_FUNC;
      var start=this.start_time, end=this.end_time;
      g.lineWidth = 2.0;
      g.strokeStyle = "rgba(100,100,100,"+alpha+")";
      var dt=1.0;
      var lastco=undefined;
      let dv=new Vector4();
      for (var t=start; t<end; t+=dt) {
          var co=this.evaluate(t);
          dv.load(this.derivative(t));
          co.multVecMatrix(matrix);
          dv.multVecMatrix(matrix);
          dv.normalize().mulScalar(5);
          let tmp=dv[0];
          dv[0] = -dv[1];
          dv[1] = tmp;
          g.beginPath();
          let green=Math.floor(((t-start)/(end-start))*255);
          g.strokeStyle = "rgba(10, "+green+",10,"+alpha+")";
          g.moveTo(co[0]-dv[0], co[1]-dv[1]);
          g.lineTo(co[0]+dv[0], co[1]+dv[1]);
          g.stroke();
          if (lastco!==undefined) {
              g.moveTo(lastco[0], lastco[1]);
              g.lineTo(co[0], co[1]);
              g.stroke();
          }
          lastco = co;
      }
    }
     derivative(time) {
      var df=0.001;
      var a=this.evaluate(time);
      var b=this.evaluate(time+df);
      b.sub(a).mulScalar(1.0/df);
      return dvcache.next().load(b);
    }
     evaluate(time) {
      if (this.dead) {
          console.error("dead vertex anim key");
          return ;
      }
      var v=this.startv;
      var step_func=this.animflag&VDAnimFlags.STEP_FUNC;
      if (v===undefined)
        return vertanimdata_eval_cache.next().zero();
      var co=vertanimdata_eval_cache.next();
      if (time<=get_vtime(v)) {
          co.load(v);
          return co;
      }
      if (v.segments.length===0) {
          co.load(v);
          return co;
      }
      var s=v.segments[0];
      var lastv=v;
      var lasts=s;
      var lastv2=v;
      while (1) {
        lastv2 = lastv;
        lastv = v;
        v = s.other_vert(v);
        if (get_vtime(v)>=time)
          break;
        if (v.segments.length<2) {
            lastv2 = lastv;
            lastv = v;
            break;
        }
        lasts = s;
        s = v.other_segment(s);
      }
      var nextv=v, nextv2=v;
      var alen1=s!==undefined ? s.length : 1, alen2=alen1;
      var alen0=lasts!==undefined ? lasts.length : alen1, alen3=alen1;
      if (v.segments.length===2) {
          var nexts=v.other_segment(s);
          nextv = nexts.other_vert(v);
          alen2 = nexts.length;
          alen3 = alen2;
      }
      nextv2 = nextv;
      if (nextv2.segments.length===2) {
          var nexts2=nextv2.other_segment(nexts);
          nextv2 = nexts2.other_vert(nextv2);
          alen3 = nexts2.length;
      }
      if (lastv===v||get_vtime(lastv)===time) {
          co.load(v);
      }
      else {
        var pt2=get_vtime(lastv2), pt=get_vtime(lastv), vt=get_vtime(v);
        var nt=get_vtime(nextv), nt2=get_vtime(nextv2);
        var t=(time-pt)/(vt-pt);
        var a=pt, b, c, d=vt;
        var arclength1=alen0;
        var arclength2=alen1;
        var arclength3=alen2;
        var t0=pt2, t3=pt, t6=vt, t9=nt;
        var t1=pt2+(pt-pt2)*(1.0/3.0);
        var t8=vt+(nt-vt)*(2.0/3.0);
        var b=(-(t0-t1)*(t3-t6)*arclength1+(t0-t3)*arclength2*t3)/((t0-t3)*arclength2);
        var c=((t3-t6)*(t8-t9)*arclength3+(t6-t9)*arclength2*t6)/((t6-t9)*arclength2);
        var r1=alen0/alen1;
        var r2=alen1/alen2;
        b = pt+r1*(vt-pt2)/3.0;
        c = vt-r2*(nt-pt)/3.0;
        var t0=a, t1=b, t2=c, t3=d;
        var tt=-(3*(t0-t1)*t-t0+3*(2*t1-t2-t0)*t*t+(3*t2-t3-3*t1+t0)*t*t*t);
        tt = Math.abs(tt);
        if (step_func) {
            t = time<vt ? 0.0 : 1.0;
        }
        co.load(s.evaluate(lastv===s.v1 ? t : 1-t));
      }
      return co;
    }
    get  endv() {
      var v=this.startv;
      if (v===undefined)
        return undefined;
      if (v.segments.length===0)
        return v;
      var s=v.segments[0];
      while (1) {
        v = s.other_vert(v);
        if (v.segments.length<2)
          break;
        s = v.other_segment(s);
      }
      return v;
    }
     check_time_integrity() {
      var lasttime=-100000;
      for (var v of this.verts) {
          var t=get_vtime(v);
          if (t<lasttime) {
              console.log("Found timing integrity error for vertex", this.eid, "path vertex:", v.eid);
              this.regen_topology();
              return true;
          }
          lasttime = t;
      }
      return false;
    }
     regen_topology() {
      var spline=this.spline;
      var verts=[];
      var segs=new set();
      var visit=new set();
      var handles=[];
      var lastv=undefined;
      var hi=0;
      for (var v of this.verts) {
          if (visit.has(v)) {
              continue;
          }
          visit.add(v);
          verts.push(v);
          handles.push(undefined);
          handles.push(undefined);
          hi+=2;
          v.flag|=SplineFlags.UPDATE;
          for (var s of v.segments) {
              segs.add(s);
              var v2=s.other_vert(v);
              var h2=s.other_handle(s.handle(v));
              if (v2===lastv) {
                  handles[hi-2] = h2;
              }
              else {
                handles[hi-1] = h2;
              }
          }
          lastv = v;
      }
      if (verts.length==0) {
          return ;
      }
      verts.sort(function (a, b) {
        return get_vtime(a)-get_vtime(b);
      });
      for (var s of segs) {
          spline.kill_segment(s);
      }
      this.startv_eid = verts[0].eid;
      for (var i=1; i<verts.length; i++) {
          var s=spline.make_segment(verts[i-1], verts[i]);
          s.flag|=SplineFlags.UPDATE;
          s.h1.flag|=SplineFlags.UPDATE;
          s.h2.flag|=SplineFlags.UPDATE;
          for (var k in s.v1.layers) {
              spline.layerset.idmap[k].add(s);
          }
      }
      var hi=0;
      var lastv=undefined;
      for (var v of verts) {
          for (var s of v.segments) {
              var v2=s.other_vert(v);
              var h2=s.other_handle(s.handle(v));
              if (v2===lastv&&handles[hi]!==undefined) {
                  h2.load(handles[hi]);
              }
              else 
                if (v2!==lastv&&handles[hi+1]!==undefined) {
                  h2.load(handles[hi+1]);
              }
          }
          lastv = v;
          hi+=2;
      }
    }
    static  fromSTRUCT(reader) {
      var ret=new VertexAnimData();
      reader(ret);
      return ret;
    }
  }
  _ESClass.register(VertexAnimData);
  _es6_module.add_class(VertexAnimData);
  VertexAnimData = _es6_module.add_export('VertexAnimData', VertexAnimData);
  VertexAnimData.STRUCT = `
VertexAnimData {
  eid         : int;
  flag        : int;
  animflag    : int;
  cur_time    : int;
  layerid     : int;
  startv_eid  : int;
  dead        : bool;
}
`;
}, '/dev/fairmotion/src/core/animspline.js');


es6_module_define('frameset', ["../curve/spline.js", "../curve/spline_element_array.js", "./animspline.js", "./animdata.js", "./animspline", "./lib_api.js", "../curve/spline_types.js", "./struct.js"], function _frameset_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  var DataBlock=es6_import_item(_es6_module, './lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, './lib_api.js', 'DataTypes');
  var Spline=es6_import_item(_es6_module, '../curve/spline.js', 'Spline');
  var RestrictFlags=es6_import_item(_es6_module, '../curve/spline.js', 'RestrictFlags');
  var CustomDataLayer=es6_import_item(_es6_module, '../curve/spline_types.js', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineFlags');
  var SplineSegment=es6_import_item(_es6_module, '../curve/spline_types.js', 'SplineSegment');
  var TimeDataLayer=es6_import_item(_es6_module, './animdata.js', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, './animdata.js', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, './animdata.js', 'set_vtime');
  var AnimChannel=es6_import_item(_es6_module, './animdata.js', 'AnimChannel');
  var AnimKey=es6_import_item(_es6_module, './animdata.js', 'AnimKey');
  var AnimInterpModes=es6_import_item(_es6_module, './animdata.js', 'AnimInterpModes');
  var AnimKeyFlags=es6_import_item(_es6_module, './animdata.js', 'AnimKeyFlags');
  var SplineLayerFlags=es6_import_item(_es6_module, '../curve/spline_element_array.js', 'SplineLayerFlags');
  var SplineLayerSet=es6_import_item(_es6_module, '../curve/spline_element_array.js', 'SplineLayerSet');
  var animspline=es6_import(_es6_module, './animspline.js');
  var ___animspline=es6_import(_es6_module, './animspline');
  for (let k in ___animspline) {
      _es6_module.add_export(k, ___animspline[k], true);
  }
  var restrictflags=animspline.restrictflags;
  var VertexAnimIter=animspline.VertexAnimIter;
  var SegmentAnimIter=animspline.SegmentAnimIter;
  var VDAnimFlags=animspline.VDAnimFlags;
  var VertexAnimData=animspline.VertexAnimData;
  class SplineFrame  {
    
    
    
     constructor(time, idgen) {
      this.time = time;
      this.flag = 0;
      this.spline = undefined;
    }
    static  fromSTRUCT(reader) {
      var ret=new SplineFrame();
      reader(ret);
      return ret;
    }
  }
  _ESClass.register(SplineFrame);
  _es6_module.add_class(SplineFrame);
  SplineFrame = _es6_module.add_export('SplineFrame', SplineFrame);
  SplineFrame.STRUCT = `
  SplineFrame {
    time    : float;
    spline  : Spline;
    flag    : int;
  }
`;
  window.obj_values_to_array = function obj_values_to_array(obj) {
    var ret=[];
    for (var k in obj) {
        ret.push(obj[k]);
    }
    return ret;
  }
  class AllSplineIter  {
    
    
    
    
    
     constructor(f, sel_only) {
      this.f = f;
      this.iter = undefined;
      this.ret = {done: false, 
     value: undefined};
      this.stage = 0;
      this.sel_only = sel_only;
      this.load_iter();
    }
     load_iter() {
      this.iter = undefined;
      var f=this.f;
      if (this.stage===0) {
          var arr=new GArray();
          for (var k in f.frames) {
              var fr=f.frames[k];
              arr.push(fr.spline);
          }
          this.iter = arr[Symbol.iterator]();
      }
      else 
        if (this.stage===1) {
          var arr=[];
          for (var k in this.f.vertex_animdata) {
              if (this.sel_only) {
                  var vdata=this.f.vertex_animdata[k];
                  var v=this.f.spline.eidmap[k];
                  if (v===undefined||!(v.flag&SplineFlags.SELECT)||v.hidden) {
                      continue;
                  }
              }
              arr.push(this.f.vertex_animdata[k].spline);
          }
          this.iter = arr[Symbol.iterator]();
      }
    }
     reset() {
      this.ret = {done: false, 
     value: undefined};
      this.stage = 0;
      this.iter = undefined;
    }
     [Symbol.iterator]() {
      return this;
    }
     next() {
      if (this.iter===undefined) {
          this.ret.done = true;
          this.ret.value = undefined;
          var ret=this.ret;
          this.reset();
          return ret;
      }
      var next=this.iter.next();
      var ret=this.ret;
      ret.value = next.value;
      ret.done = next.done;
      if (next.done) {
          this.stage++;
          this.load_iter();
          if (this.iter!==undefined) {
              ret.done = false;
          }
      }
      if (ret.done) {
          this.reset();
      }
      return ret;
    }
  }
  _ESClass.register(AllSplineIter);
  _es6_module.add_class(AllSplineIter);
  class EidTimePair  {
     constructor(eid, time) {
      this.eid = eid;
      this.time = time;
    }
     load(eid, time) {
      this.eid = eid;
      this.time = time;
    }
    static  fromSTRUCT(reader) {
      var ret=new EidTimePair();
      reader(ret);
      return ret;
    }
     [Symbol.keystr]() {
      return ""+this.eid+"_"+this.time;
    }
  }
  _ESClass.register(EidTimePair);
  _es6_module.add_class(EidTimePair);
  EidTimePair.STRUCT = `
  EidTimePair {
    eid  : int;
    time : int;
  }
`;
  function combine_eid_time(eid, time) {
    return new EidTimePair(eid, time);
  }
  var split_eid_time_rets=new cachering(function () {
    return [0, 0];
  }, 64);
  function split_eid_time(t) {
    var ret=split_eid_time_rets.next();
    ret[0] = t.eid;
    ret[1] = t.time;
    return ret;
  }
  class SplineKCacheItem  {
     constructor(data, time, hash) {
      this.data = data;
      this.time = time;
      this.hash = hash;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(SplineKCacheItem);
  _es6_module.add_class(SplineKCacheItem);
  SplineKCacheItem = _es6_module.add_export('SplineKCacheItem', SplineKCacheItem);
  SplineKCacheItem.STRUCT = `
SplineKCacheItem {
  data : array(byte);
  time : float;
  hash : int;
}
`;
  class SplineKCache  {
    
    
    
     constructor() {
      this.cache = {};
      this.invalid_eids = new set();
      this.hash = 0;
    }
     has(frame, spline) {
      if (!this.cache[frame]) {
          return false;
      }
      let hash=this.calchash(spline);
      if (_DEBUG.timeChange)
        console.log("hash", hash, "should be", this.cache[frame].hash);
      return this.cache[frame].hash===hash;
    }
     set(frame, spline) {
      for (var eid in spline.eidmap) {
          this.revalidate(eid, frame);
      }
      let hash=this.calchash(spline);
      this.cache[frame] = new SplineKCacheItem(spline.export_ks(), frame, hash);
    }
     invalidate(eid, time) {
      this.invalid_eids.add(combine_eid_time(eid, time));
    }
     revalidate(eid, time) {
      var t=combine_eid_time(time);
      this.invalid_eids.remove(t);
    }
     calchash(spline) {
      let hash=0;
      let mul1=Math.sqrt(3.0), mul2=Math.sqrt(17.0);
      for (let v of spline.points) {
          hash = Math.fract(hash*mul1+v[0]*mul2);
          hash = Math.fract(hash*mul1+v[1]*mul2);
      }
      return ~~(hash*1024*1024);
    }
     load(frame, spline) {
      if (typeof frame==="string") {
          throw new Error("Got bad frame! "+frame);
      }
      if (!(frame in this.cache)) {
          warn("Warning, bad call to SplineKCache");
          return ;
      }
      var ret=spline.import_ks(this.cache[frame].data);
      if (ret===undefined) {
          delete this.cache[frame];
          console.log("bad kcache data for frame", frame);
          for (var s of spline.segments) {
              s.v1.flag|=SplineFlags.UPDATE;
              s.v2.flag|=SplineFlags.UPDATE;
              s.h1.flag|=SplineFlags.UPDATE;
              s.h2.flag|=SplineFlags.UPDATE;
              s.flag|=SplineFlags.UPDATE;
          }
          spline.resolve = 1;
          return ;
      }
      for (var eid in spline.eidmap) {
          var t=combine_eid_time(eid, frame);
          if (!this.invalid_eids.has(t))
            continue;
          this.invalid_eids.remove(t);
          var e=spline.eidmap[eid];
          e.flag|=SplineFlags.UPDATE;
          spline.resolve = 1;
      }
    }
     _as_array() {
      var ret=[];
      for (var k in this.cache) {
          ret.push(this.cache[k].data);
      }
      return ret;
    }
    static  fromSTRUCT(reader) {
      var ret=new SplineKCache();
      reader(ret);
      var cache={};
      var inv=new set();
      if (ret.invalid_eids!=undefined&&__instance_of(ret.invalid_eids, Array)) {
          for (var i=0; i<ret.invalid_eids.length; i++) {
              inv.add(ret.invalid_eids[i]);
          }
      }
      if (ret.times) {
          ret.invalid_eids = inv;
          for (var i=0; i<ret.cache.length; i++) {
              cache[ret.times[i]] = new Uint8Array(ret.cache[i]);
          }
          delete ret.times;
          ret.cache = cache;
      }
      else {
        for (let item of ret.cache) {
            cache[item.time] = item;
        }
        ret.cache = cache;
      }
      return ret;
    }
  }
  _ESClass.register(SplineKCache);
  _es6_module.add_class(SplineKCache);
  SplineKCache = _es6_module.add_export('SplineKCache', SplineKCache);
  SplineKCache.STRUCT = `
  SplineKCache {
    cache : array(SplineKCacheItem) | obj._as_array();
    invalid_eids : iter(EidTimePair);
  }
`;
  class SplineFrameSet extends DataBlock {
    
    
    
    
    
    
    
    
    
    
    
    static  blockDefine() {
      return {typeName: "frameset", 
     defaultName: "Frameset", 
     uiName: "Frameset", 
     typeIndex: 7, 
     linkOrder: 4}
    }
     constructor() {
      super(DataTypes.FRAMESET);
      this.editmode = "MAIN";
      this.editveid = -1;
      this.spline = undefined;
      this.kcache = new SplineKCache();
      this.idgen = new SDIDGen();
      this.frames = {};
      this.framelist = [];
      this.vertex_animdata = {};
      this.pathspline = this.make_pathspline();
      this.templayerid = this.pathspline.layerset.active.id;
      this.selectmode = 0;
      this.draw_anim_paths = 0;
      this.time = 1;
      this.insert_frame(0);
      this.switch_on_select = true;
    }
     fix_anim_paths() {
      this.find_orphan_pathverts();
    }
    get  active_animdata() {
      if (this.spline.verts.active===undefined) {
          return undefined;
      }
      return this.get_vdata(this.spline.verts.active.eid, true);
    }
     find_orphan_pathverts() {
      var vset=new set();
      var vset2=new set();
      for (var v of this.spline.verts) {
          vset2.add(v.eid);
      }
      for (var k in this.vertex_animdata) {
          var vd=this.vertex_animdata[k];
          if (!vset2.has(k)) {
              delete this.vertex_animdata[k];
              continue;
          }
          for (var v of vd.verts) {
              vset.add(v.eid);
          }
      }
      var totorphaned=0;
      for (var v of this.pathspline.verts) {
          if (!vset.has(v.eid)) {
              this.pathspline.kill_vertex(v);
              totorphaned++;
          }
      }
      console.log("totorphaned: ", totorphaned);
    }
     has_coincident_verts(threshold, time_threshold) {
      threshold = threshold===undefined ? 2 : threshold;
      time_threshold = time_threshold===undefined ? 0 : time_threshold;
      var ret=new set();
      for (var k in this.vertex_animdata) {
          var vd=this.vertex_animdata[k];
          var lastv=undefined;
          var lasttime=undefined;
          for (var v of vd.verts) {
              var time=get_vtime(v);
              if (lastv!==undefined&&lastv.vectorDistance(v)<threshold&&Math.abs(time-lasttime)<=time_threshold) {
                  console.log("Coincident vert!", k, v.eid, lastv.vectorDistance(v));
                  if (v.segments.length===2)
                    ret.add(v);
                  else 
                    if (lastv.segments.length===2)
                    ret.add(lastv);
              }
              lastv = v;
              lasttime = time;
          }
      }
      return ret;
    }
     create_path_from_adjacent(v, s) {
      if (v.segments.length<2) {
          console.log("Invalid input to create_path_from_adjacent");
          return ;
      }
      var v1=s.other_vert(v), v2=v.other_segment(s).other_vert(v);
      var av1=this.get_vdata(v1.eid, false), av2=this.get_vdata(v2.eid, false);
      if (av1===undefined&&av2===undefined) {
          console.log("no animation data to interpolate");
          return ;
      }
      else 
        if (av1===undefined) {
          av1 = av2;
      }
      else 
        if (av2===undefined) {
          av2 = av1;
      }
      var av3=this.get_vdata(v.eid, true);
      var keyframes=new set();
      for (var v of av1.verts) {
          keyframes.add(get_vtime(v));
      }
      for (var v of av2.verts) {
          keyframes.add(get_vtime(v));
      }
      var co=new Vector2();
      var oflag1=av1.animflag, oflag2=av2.animflag;
      av1.animflag&=VDAnimFlags.STEP_FUNC;
      av2.animflag&=VDAnimFlags.STEP_FUNC;
      for (var time of keyframes) {
          var co1=av1.evaluate(time), co2=av2.evaluate(time);
          co.load(co1).add(co2).mulScalar(0.5);
          av3.update(co, time);
      }
      av3.animflag = oflag1|oflag2;
      av1.animflag = oflag1;
      av2.animflag = oflag2;
    }
     set_visibility(vd_eid, state) {
      console.log("set called", vd_eid, state);
      var vd=this.vertex_animdata[vd_eid];
      if (vd===undefined)
        return ;
      var layer=this.pathspline.layerset.idmap[vd.layerid];
      var drawlayer=this.pathspline.layerset.idmap[this.templayerid];
      vd.visible = !!state;
      for (var v of vd.verts) {
          if (state) {
              layer.remove(v);
              drawlayer.add(v);
              v.flag&=~(SplineFlags.GHOST|SplineFlags.HIDE);
              for (var i=0; i<v.segments.length; i++) {
                  layer.remove(v.segments[i]);
                  drawlayer.add(v.segments[i]);
                  v.segments[i].flag&=~(SplineFlags.GHOST|SplineFlags.HIDE);
              }
          }
          else {
            drawlayer.remove(v);
            layer.add(v);
            v.flag|=SplineFlags.GHOST|SplineFlags.HIDE;
            for (var i=0; i<v.segments.length; i++) {
                drawlayer.remove(v.segments[i]);
                layer.add(v.segments[i]);
                v.segments[i].flag|=SplineFlags.GHOST|SplineFlags.HIDE;
            }
          }
      }
      this.pathspline.regen_sort();
    }
     on_destroy() {
      this.spline.on_destroy();
      this.pathspline.on_destroy();
    }
     on_spline_select(element, state) {
      if (!this.switch_on_select)
        return ;
      var vd=this.get_vdata(element.eid, false);
      if (vd===undefined)
        return ;
      var hide=!(this.selectmode&element.type);
      hide = hide||!(element.flag&SplineFlags.SELECT);
      if (element.type===SplineTypes.HANDLE) {
          hide = hide||!element.use;
      }
      var layer=this.pathspline.layerset.idmap[vd.layerid];
      var drawlayer=this.pathspline.layerset.idmap[this.templayerid];
      vd.visible = !hide;
      for (var v of vd.verts) {
          v.sethide(hide);
          for (var i=0; i<v.segments.length; i++) {
              var s=v.segments[i];
              s.sethide(hide);
              s.flag&=~(SplineFlags.GHOST|SplineFlags.HIDE);
              if (!hide&&!(drawlayer.id in s.layers)) {
                  layer.remove(s);
                  drawlayer.add(s);
              }
              else 
                if (hide&&(drawlayer.id in s.layers)) {
                  drawlayer.remove(s);
                  layer.add(s);
              }
          }
          v.flag&=~SplineFlags.GHOST;
          if (hide) {
              drawlayer.remove(v);
              layer.add(v);
          }
          else {
            layer.remove(v);
            drawlayer.add(v);
          }
      }
      if (state)
        vd.flag|=SplineFlags.SELECT;
      else 
        vd.flag&=~SplineFlags.SELECT;
      this.pathspline.regen_sort();
    }
    get  _allsplines() {
      return new AllSplineIter(this);
    }
    get  _selected_splines() {
      return new AllSplineIter(this, true);
    }
     sync_vdata_selstate(ctx) {
      for (let k in this.vertex_animdata) {
          let vd=this.vertex_animdata[k];
          if (!vd) {
              continue;
          }
          vd.animflag&=~VDAnimFlags.OWNER_IS_EDITABLE;
      }
      for (let i=0; i<2; i++) {
          let list=i ? this.spline.handles : this.spline.verts;
          for (let v of list.selected.editable(ctx)) {
              let vd=this.vertex_animdata[v.eid];
              if (!vd) {
                  continue;
              }
              vd.animflag|=VDAnimFlags.OWNER_IS_EDITABLE;
          }
      }
    }
     update_visibility() {
      if (_DEBUG.timeChange)
        console.log("update_visibility called");
      if (!this.switch_on_select)
        return ;
      var selectmode=this.selectmode, show_paths=this.draw_anim_paths;
      var drawlayer=this.pathspline.layerset.idmap[this.templayerid];
      if (drawlayer===undefined) {
          console.log("this.templayerid corruption", this.templayerid);
          this.templayerid = this.pathspline.layerset.new_layer().id;
          drawlayer = this.pathspline.layerset.idmap[this.templayerid];
      }
      for (var v of this.pathspline.verts) {
          if (!v.has_layer()) {
              drawlayer.add(v);
          }
          v.sethide(true);
      }
      for (var h of this.pathspline.handles) {
          if (!h.has_layer()) {
              drawlayer.add(h);
          }
          h.sethide(true);
      }
      for (var k in this.vertex_animdata) {
          var vd=this.vertex_animdata[k];
          var v=this.spline.eidmap[k];
          if (vd.dead) {
              delete this.vertex_animdata[k];
              continue;
          }
          if (v===undefined) {
              continue;
          }
          var hide=!(vd.eid in this.spline.eidmap)||!(v.flag&SplineFlags.SELECT);
          hide = hide||!(v.type&selectmode)||!show_paths;
          vd.visible = !hide;
          if (!hide) {
          }
          for (var v2 of vd.verts) {
              if (!hide) {
                  v2.flag&=~(SplineFlags.GHOST|SplineFlags.HIDE);
              }
              else {
                v2.flag|=SplineFlags.GHOST|SplineFlags.HIDE;
              }
              v2.sethide(hide);
              if (!hide) {
                  drawlayer.add(v2);
              }
              else {
                drawlayer.remove(v2);
              }
              for (var s of v2.segments) {
                  s.sethide(hide);
                  if (!hide) {
                      s.flag&=~(SplineFlags.GHOST|SplineFlags.HIDE);
                      drawlayer.add(s);
                  }
                  else {
                    s.flag|=SplineFlags.GHOST|SplineFlags.HIDE;
                    drawlayer.remove(s);
                  }
              }
          }
      }
      this.pathspline.regen_sort();
    }
     on_ctx_update(ctx) {
      console.trace("on_ctx_update");
      if (ctx.spline===this.spline) {
      }
      else 
        if (ctx.spline===this.pathspline) {
          var resolve=0;
          for (var v of this.spline.points) {
              if (v.eid in this.vertex_animdata) {
                  var vdata=this.get_vdata(v.eid, false);
                  v.load(vdata.evaluate(this.time));
                  v.flag&=~SplineFlags.FRAME_DIRTY;
                  v.flag|=SplineFlags.UPDATE;
                  resolve = 1;
              }
          }
          this.spline.resolve = resolve;
      }
    }
     download() {
      console.trace("downloading. . .");
      var resolve=0;
      for (var v of this.spline.points) {
          if (v.eid in this.vertex_animdata) {
              var vdata=this.get_vdata(v.eid, false);
              v.load(vdata.evaluate(this.time));
              v.flag&=~SplineFlags.FRAME_DIRTY;
              v.flag|=SplineFlags.UPDATE;
              resolve = 1;
          }
      }
      this.spline.resolve = resolve;
    }
     update_frame(force_update) {
      this.check_vdata_integrity();
      var time=this.time;
      var spline=this.spline;
      if (spline===undefined)
        return ;
      if (spline.resolve)
        spline.solve();
      this.kcache.set(time, spline);
      var is_first=time<=1;
      var found=false;
      for (var v of spline.points) {
          if (!(v.eid in spline.eidmap)) {
              found = true;
          }
          var dofirst=is_first&&!(v.eid in this.vertex_animdata);
          if (!(force_update||dofirst||(v.flag&SplineFlags.FRAME_DIRTY)))
            continue;
          var vdata=this.get_vdata(v.eid);
          let update=vdata.update(v, time);
          v.flag&=~SplineFlags.FRAME_DIRTY;
          if (update) {
              spline.flagUpdateKeyframes(v);
          }
      }
      if (!found)
        return ;
      this.insert_frame(this.time);
      this.update_visibility();
    }
     insert_frame(time) {
      this.check_vdata_integrity();
      if (this.frame!=undefined)
        return this.frame;
      var frame=this.frame = new SplineFrame();
      var spline=this.spline===undefined ? new Spline() : this.spline.copy();
      spline.verts.select_listeners.addListener(this.on_spline_select, this);
      spline.handles.select_listeners.addListener(this.on_spline_select, this);
      spline.idgen = this.idgen;
      frame.spline = spline;
      frame.time = time;
      this.frames[time] = frame;
      if (this.spline===undefined) {
          this.spline = frame.spline;
          this.frame = frame;
      }
      return frame;
    }
     find_frame(time, off) {
      off = off===undefined ? 0 : off;
      var flist=this.framelist;
      for (var i=0; i<flist.length-1; i++) {
          if (flist[i]<=time&&flist[i+1]>time) {
              break;
          }
      }
      if (i===flist.length)
        return frames[i-1];
      return frames[i];
    }
     change_time(time, _update_animation=true) {
      if (!window.inFromStruct&&_update_animation) {
          this.update_frame();
      }
      var f=this.frames[0];
      for (var v of this.spline.points) {
          var vd=this.get_vdata(v.eid, false);
          if (vd===undefined)
            continue;
          if (v.flag&SplineFlags.SELECT)
            vd.flag|=SplineFlags.SELECT;
          else 
            vd.flag&=~SplineFlags.SELECT;
          if (v.flag&SplineFlags.HIDE)
            vd.flag|=SplineFlags.HIDE;
          else 
            vd.flag&=~SplineFlags.HIDE;
      }
      if (f===undefined) {
          f = this.insert_frame(time);
      }
      var spline=f.spline;
      if (!window.inFromStruct&&_update_animation) {
          for (var v of spline.points) {
              var set_flag=v.eid in this.vertex_animdata;
              var vdata=this.get_vdata(v.eid, false);
              if (vdata===undefined)
                continue;
              if (set_flag) {
                  spline.setselect(v, vdata.flag&SplineFlags.SELECT);
                  if (vdata.flag&SplineFlags.HIDE)
                    v.flag|=SplineFlags.HIDE;
                  else 
                    v.flag&=~SplineFlags.HIDE;
              }
              v.load(vdata.evaluate(time));
              if (0&&set_update) {
                  v.flag|=SplineFlags.UPDATE;
              }
              else {
              }
          }
          var set_update=true;
          if (this.kcache.has(time, spline)) {
              if (_DEBUG.timeChange)
                console.log("found cached k data!");
              this.kcache.load(time, spline);
              set_update = false;
          }
          if (!set_update) {
              for (var seg of spline.segments) {
                  if (seg.hidden)
                    continue;
                  seg.flag|=SplineFlags.REDRAW;
              }
              for (var face of spline.faces) {
                  if (face.hidden)
                    continue;
                  face.flag|=SplineFlags.REDRAW;
              }
          }
          else {
            for (let v of spline.points) {
                v.flag|=SplineFlags.UPDATE;
            }
          }
          spline.resolve = 1;
          if (!window.inFromStruct)
            spline.solve();
      }
      for (var s of spline.segments) {
          if (s.hidden)
            continue;
          s.flag|=SplineFlags.UPDATE_AABB;
      }
      for (var f of spline.segments) {
          if (f.hidden)
            continue;
          f.flag|=SplineFlags.UPDATE_AABB;
      }
      this.spline = spline;
      this.time = time;
      this.frame = f;
      this.update_visibility();
    }
     delete_vdata() {
      this.vertex_animdata = {};
    }
     get_vdata(eid, auto_create=true) {
      if (typeof eid!="number") {
          throw new Error("Expected a number for eid");
      }
      if (auto_create&&!(eid in this.vertex_animdata)) {
          this.vertex_animdata[eid] = new VertexAnimData(eid, this.pathspline);
      }
      return this.vertex_animdata[eid];
    }
     check_vdata_integrity(veid) {
      var spline=this.pathspline;
      var found=false;
      if (veid===undefined) {
          this.check_paths();
          for (var k in this.vertex_animdata) {
              var vd=this.vertex_animdata[k];
              found|=vd.check_time_integrity();
          }
      }
      else {
        var vd=this.vertex_animdata[veid];
        if (vd===undefined) {
            console.log("Error: vertex ", veid, "not in frameset");
            return false;
        }
        found = vd.check_time_integrity();
      }
      if (found) {
          this.rationalize_vdata_layers();
          this.update_visibility();
          this.pathspline.regen_solve();
          window.redraw_viewport();
      }
      return found;
    }
     check_paths() {
      let update=false;
      for (var k in this.vertex_animdata) {
          var vd=this.vertex_animdata[k];
          if (vd.dead||!vd.startv) {
              delete this.vertex_animdata[k];
              update = true;
          }
      }
      if (update) {
          console.warn("pathspline update");
          this.rationalize_vdata_layers();
          this.update_visibility();
          this.pathspline.regen_render();
          this.pathspline.regen_sort();
          this.pathspline.regen_solve();
          window.redraw_viewport();
      }
      return update;
    }
     rationalize_vdata_layers() {
      this.fix_anim_paths();
      var spline=this.pathspline;
      spline.layerset = new SplineLayerSet();
      var templayer=spline.layerset.new_layer();
      this.templayerid = templayer.id;
      spline.layerset.active = templayer;
      for (var i=0; i<spline.elists.length; i++) {
          var list=spline.elists[i];
          list.layerset = spline.layerset;
          for (var e of list) {
              e.layers = {};
          }
      }
      for (var k in this.vertex_animdata) {
          var vd=this.vertex_animdata[k];
          var vlayer=spline.layerset.new_layer();
          vlayer.flag|=SplineLayerFlags.HIDE;
          vd.layerid = vlayer.id;
          for (var v of vd.verts) {
              for (var i=0; i<v.segments.length; i++) {
                  vlayer.add(v.segments[i]);
              }
              vlayer.add(v);
          }
      }
    }
     draw(ctx, g, editor, matrix, redraw_rects, ignore_layers) {
      var size=editor.size, pos=editor.pos;
      this.draw_anim_paths = editor.draw_anim_paths;
      this.selectmode = editor.selectmode;
      g.save();
      let dpi=window.devicePixelRatio;
      let promise=this.spline.draw(redraw_rects, g, editor, matrix, editor.selectmode, editor.only_render, editor.draw_normals, this.spline===ctx.spline ? 1.0 : 0.3, undefined, undefined, ignore_layers);
      g.restore();
      return promise;
    }
     loadSTRUCT(reader) {
      window.inFromStruct = true;
      reader(this);
      super.loadSTRUCT(reader);
      this.kcache = new SplineKCache();
      if (this.kcache===undefined) {
          this.kcache = new SplineKCache();
      }
      this.afterSTRUCT();
      if (this.pathspline===undefined) {
          this.pathspline = this.make_pathspline();
      }
      for (v of this.pathspline.verts) {

      }
      for (var h of this.pathspline.handles) {

      }
      for (var vd of this.vertex_animdata) {
          vd.spline = this.pathspline;
          if (vd.layerid===undefined) {
              var layer=this.pathspline.layerset.new_layer();
              layer.flag|=SplineLayerFlags.HIDE;
              vd.layerid = layer.id;
              if (vd.startv_eid!=undefined) {
                  var v=this.pathspline.eidmap[vd.startv_eid];
                  var s=v.segments[0];
                  v.layers = {};
                  v.layers[vd.layerid] = 1;
                  var _c1=0;
                  while (v.segments.length>0) {
                    v.layers = {};
                    v.layers[vd.layerid] = 1;
                    s.layers = {};
                    s.layers[vd.layerid] = 1;
                    v = s.other_vert(v);
                    if (v.segments.length<2) {
                        v.layers = {};
                        v.layers[vd.layerid] = 1;
                        break;
                    }
                    if (_c1++>100000) {
                        console.log("Infinite loop detected!");
                        break;
                    }
                    s = v.other_segment(s);
                    s.layers = {};
                    s.layers[vd.layerid] = 1;
                    if (v===vd.startv)
                      break;
                  }
              }
          }
      }
      this.pathspline.is_anim_path = true;
      if (this.templayerid===undefined)
        this.templayerid = this.pathspline.layerset.new_layer().id;
      var frames={};
      var vert_animdata={};
      var max_cur=this.idgen.cur_id;
      var firstframe=undefined;
      for (var i=0; i<this.frames.length; i++) {
          max_cur = Math.max(this.frames[i].spline.idgen.cur_id, max_cur);
          if (i===0)
            firstframe = this.frames[i];
          this.frames[i].spline.idgen = this.idgen;
          frames[this.frames[i].time] = this.frames[i];
      }
      this.idgen.max_cur(max_cur);
      for (var i=0; i<this.vertex_animdata.length; i++) {
          vert_animdata[this.vertex_animdata[i].eid] = this.vertex_animdata[i];
      }
      for (let k in vert_animdata) {
          let vd=vert_animdata[k];
          for (let v of vd.verts) {
              vd._get_animdata(v).owning_veid = vd.eid;
          }
      }
      this.frames = frames;
      this.pathspline.regen_sort();
      var fk=this.cur_frame||0;
      delete this.cur_frame;
      if (fk===undefined) {
          this.frame = firstframe;
          this.spline = firstframe.spline;
      }
      else {
        this.frame = this.frames[fk];
        this.spline = this.frames[fk].spline;
      }
      this.vertex_animdata = vert_animdata;
      if (this.framelist.length===0) {
          for (var k in this.frames) {
              this.framelist.push(parseFloat(k));
          }
      }
      for (k in this.frames) {
          this.frames[k].spline.verts.select_listeners.addListener(this.on_spline_select, this);
          this.frames[k].spline.handles.select_listeners.addListener(this.on_spline_select, this);
      }
      this.spline.fix_spline();
      this.rationalize_vdata_layers();
      this.update_visibility();
      window.inFromStruct = false;
    }
     make_pathspline() {
      var spline=new Spline();
      spline.is_anim_path = true;
      spline.restrict = restrictflags;
      spline.verts.cdata.add_layer(TimeDataLayer, "time data");
      return spline;
    }
  }
  _ESClass.register(SplineFrameSet);
  _es6_module.add_class(SplineFrameSet);
  SplineFrameSet = _es6_module.add_export('SplineFrameSet', SplineFrameSet);
  
  SplineFrameSet.STRUCT = STRUCT.inherit(SplineFrameSet, DataBlock)+`
    idgen             : SDIDGen;
    frames            : array(SplineFrame) | obj_values_to_array(obj.frames);
    vertex_animdata   : array(VertexAnimData) | obj_values_to_array(obj.vertex_animdata);
    
    cur_frame         : float | obj.frame.time;
    editmode          : string;
    editveid          : int;
    
    time              : float;
    framelist         : array(float);
    pathspline        : Spline;
    
    selectmode        : int;
    draw_anim_paths   : int;
    templayerid       : int;
}
`;
  DataBlock.register(SplineFrameSet);
}, '/dev/fairmotion/src/core/frameset.js');


es6_module_define('ops_editor', ["../../path.ux/scripts/core/ui_base.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../core/struct.js", "../editor_base.js"], function _ops_editor_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  class OpStackEditor extends Editor {
     constructor() {
      super();
      this._last_toolstack_hash = "";
    }
     rebuild() {
      let ctx=this.ctx;
      this.frame.clear();
      let stack=ctx.toolstack;
      let frame=this.frame;
      for (let i=0; i<stack.undostack.length; i++) {
          let tool=stack.undostack[i];
          let cls=tool.constructor;
          let name;
          if (cls.tooldef) {
              name = cls.tooldef().uiname;
          }
          if (!name) {
              name = tool.uiname||tool.name||cls.name||"(error)";
          }
          let panel=frame.panel(name);
          for (let k in tool.inputs) {
              let path=`operator_stack[${i}].${k}`;
              try {
                panel.prop(path);
              }
              catch (error) {
                  print_stack(error);
                  continue;
              }
          }
          panel.closed = true;
      }
    }
     update() {
      let ctx=this.ctx;
      if (!ctx||!ctx.toolstack) {
          return ;
      }
      let stack=ctx.toolstack;
      let key=""+stack.undostack.length+":"+stack.cur;
      if (key!==this._last_toolstack_hash) {
          this._last_toolstack_hash = key;
          this.rebuild();
      }
    }
     init() {
      super.init();
      this.frame = this.container.col();
    }
    static  define() {
      return {tagname: "opstack-editor-x", 
     areaname: "opstack_editor", 
     uiname: "Operator Stack", 
     hidden: true}
    }
     copy() {
      return document.createElement("opstack-editor-x");
    }
  }
  _ESClass.register(OpStackEditor);
  _es6_module.add_class(OpStackEditor);
  OpStackEditor = _es6_module.add_export('OpStackEditor', OpStackEditor);
  OpStackEditor.STRUCT = STRUCT.inherit(OpStackEditor, Area)+`
}
`;
  Editor.register(OpStackEditor);
}, '/dev/fairmotion/src/editors/ops/ops_editor.js');


es6_module_define('SettingsEditor', ["../editor_base.js", "../events.js", "../../core/struct.js", "../../path.ux/scripts/core/ui_theme.js", "../../path.ux/scripts/core/ui_base.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../path.ux/scripts/core/ui.js", "../../path.ux/scripts/pathux.js"], function _SettingsEditor_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var theme=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'theme');
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  var Container=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui.js', 'Container');
  var color2css=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_theme.js', 'color2css');
  var css2color=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_theme.js', 'css2color');
  var CSSFont=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_theme.js', 'CSSFont');
  var ToolKeyHandler=es6_import_item(_es6_module, '../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../events.js', 'FuncKeyHandler');
  var pushModalLight=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'popModalLight');
  var exportTheme=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'exportTheme');
  let basic_colors={'white': [1, 1, 1], 
   'grey': [0.5, 0.5, 0.5], 
   'gray': [0.5, 0.5, 0.5], 
   'black': [0, 0, 0], 
   'red': [1, 0, 0], 
   'yellow': [1, 1, 0], 
   'green': [0, 1, 0], 
   'teal': [0, 1, 1], 
   'cyan': [0, 1, 1], 
   'blue': [0, 0, 1], 
   'orange': [1, 0.5, 0.25], 
   'brown': [0.5, 0.4, 0.3], 
   'purple': [1, 0, 1], 
   'pink': [1, 0.5, 0.5]}
  class SettingsEditor extends Editor {
     constructor() {
      super();
    }
     init() {
      super.init();
      let col=this.container.col();
      let tabs=col.tabs("left");
      let tab;
      tab = tabs.tab("General");
      let panel=tab.panel("Units");
      panel.prop("settings.unit_scheme");
      panel.prop("settings.default_unit");
      tab = tabs.tab("Theme");
      tab.button("Export Theme", () =>        {
        let theme=exportTheme();
        theme = theme.replace(/var theme/, "export const theme");
        theme = `import {CSSFont} from '../path.ux/scripts/pathux.js';\n\n`+theme;
        theme = `
/*
 * WARNING: AUTO-GENERATED FILE
 * 
 * Copy to scripts/editors/theme.js
 */
      `.trim()+"\n\n"+theme+"\n";
        console.log(theme);
        let blob=new Blob([theme], {mime: "application/javascript"});
        let url=URL.createObjectURL(blob);
        console.log("url", url);
        window.open(url);
      });
      this.style["overflow-y"] = "scroll";
      let th=document.createElement("theme-editor-x");
      th.onchange = () =>        {
        console.log("settings change");
        g_app_state.settings.save();
      };
      let row=tab.row();
      row.button("Reload Defaults", () =>        {
        g_app_state.settings.reloadDefaultTheme();
        g_app_state.settings.save();
        th.remove();
        th = document.createElement("theme-editor-x");
        tab.add(th);
      });
      tab.add(th);
      window.th = th;
      tab = this.hotkeyTab = tabs.tab("Hotkeys");
      this.buildHotKeys(tab);
    }
     buildHotKeys(tab=this.hotkeyTab) {
      if (!this.ctx||!this.ctx.screen) {
          this.doOnce(this.buildHotKeys);
          return ;
      }
      tab.clear();
      let row=tab.row();
      row.button("Reload", () =>        {
        this.buildHotKeys(tab);
      });
      let build=(tab, label, keymaps) =>        {
        let panel=tab.panel(label);
        function changePre(hk, handler, keymap) {
          keymap.remove(hk);
        }
        function changePost(hk, handler, keymap) {
          keymap.set(hk, handler);
        }
        function makeKeyPanel(panel2, hk, handler, keymap) {
          panel2.clear();
          let row=panel2.row();
          let key=hk[Symbol.keystr]();
          let name=hk.uiName;
          if (!name&&__instance_of(handler, ToolKeyHandler)) {
              name = ""+handler.tool;
          }
          else 
            if (!name) {
              name = "(error)";
          }
          panel2.title = key+" "+name;
          function setPanel2Title() {
            key = hk[Symbol.keystr]();
            panel2.title = key+" "+name;
          }
          function makeModifier(mod) {
            row.button(mod, () =>              {
              changePre(hk, handler, keymap);
              hk[mod]^=true;
              console.log(mod, "change", hk, hk[Symbol.keystr]());
              changePost(hk, handler, keymap);
              setPanel2Title();
              console.log("PANEL LABEL:", panel2.label);
            });
          }
          makeModifier("ctrl");
          makeModifier("shift");
          makeModifier("alt");
          let keyButton=row.button(hk.keyAscii, () =>            {
            let modaldata;
            let start_time;
            let checkEnd=() =>              {
              if (!modaldata||time_ms()-start_time<500) {
                  return ;
              }
              popModalLight(modaldata);
              modaldata = undefined;
            }
            start_time = time_ms();
            modaldata = pushModalLight({on_keydown: function on_keydown(e) {
                console.log("Got hotkey!", e.keyCode);
                if (modaldata) {
                    popModalLight(modaldata);
                    modaldata = undefined;
                }
                changePre(hk, handler, keymap);
                hk.key = e.keyCode;
                keyButton.setAttribute("name", hk.keyAscii);
                changePost(hk, handler, keymap);
                setPanel2Title();
              }, 
        on_mousedown: function on_mousedown(e) {
                checkEnd();
              }, 
        on_mouseup: function on_mouseup(e) {
                checkEnd();
              }});
          });
        }
        for (let keymap of keymaps) {
            for (let key of keymap) {
                let panel2=panel.panel(key);
                let handler=keymap.get(key);
                let hk=keymap.getKey(key);
                makeKeyPanel(panel2, hk, handler, keymap);
                panel2.closed = true;
            }
        }
        panel.closed = true;
      };
      for (let kmset of this.ctx.screen.getKeySets()) {
          build(tab, kmset.name, kmset);
      }
    }
    static  define() {
      return {tagname: "settings-editor-x", 
     areaname: "settings_editor", 
     uiname: "Settings", 
     icon: Icons.SETTINGS_EDITOR}
    }
     copy() {
      return document.createElement("settings-editor-x");
    }
  }
  _ESClass.register(SettingsEditor);
  _es6_module.add_class(SettingsEditor);
  SettingsEditor = _es6_module.add_export('SettingsEditor', SettingsEditor);
  SettingsEditor.STRUCT = STRUCT.inherit(SettingsEditor, Area)+`
}
`;
  Editor.register(SettingsEditor);
}, '/dev/fairmotion/src/editors/settings/SettingsEditor.js');


var ContextStruct;
es6_module_define('data_api_define', ["../../editors/viewport/selectmode.js", "../../editors/viewport/spline_createops.js", "../const.js", "../../curve/spline_base.js", "../../path.ux/scripts/pathux.js", "./data_api.js", "../../editors/settings/SettingsEditor.js", "../frameset.js", "../../editors/viewport/view2d_base.js", "../toolprops.js", "../../editors/ops/ops_editor.js", "../lib_api.js", "../imageblock.js", "../../scene/sceneobject.js", "../../editors/viewport/view2d.js", "../animdata.js", "../units.js", "../../editors/curve/CurveEditor.js", "../../editors/dopesheet/DopeSheetEditor.js", "../context.js", "../../curve/spline_types.js", "../toolops_api.js", "../UserSettings.js", "../../curve/spline_element_array.js", "../../editors/viewport/toolmodes/toolmode.js"], function _data_api_define_module(_es6_module) {
  var DataTypes=es6_import_item(_es6_module, '../lib_api.js', 'DataTypes');
  var View2DHandler=es6_import_item(_es6_module, '../../editors/viewport/view2d.js', 'View2DHandler');
  var EditModes=es6_import_item(_es6_module, '../../editors/viewport/view2d_base.js', 'EditModes');
  var SessionFlags=es6_import_item(_es6_module, '../../editors/viewport/view2d_base.js', 'SessionFlags');
  var ImageFlags=es6_import_item(_es6_module, '../imageblock.js', 'ImageFlags');
  var Image=es6_import_item(_es6_module, '../imageblock.js', 'Image');
  var ImageUser=es6_import_item(_es6_module, '../imageblock.js', 'ImageUser');
  var AppSettings=es6_import_item(_es6_module, '../UserSettings.js', 'AppSettings');
  var FullContext=es6_import_item(_es6_module, '../context.js', 'FullContext');
  var toolmode=es6_import(_es6_module, '../../editors/viewport/toolmodes/toolmode.js');
  var cconst=es6_import(_es6_module, '../const.js');
  var EnumProperty=es6_import_item(_es6_module, '../toolprops.js', 'EnumProperty');
  var FlagProperty=es6_import_item(_es6_module, '../toolprops.js', 'FlagProperty');
  var FloatProperty=es6_import_item(_es6_module, '../toolprops.js', 'FloatProperty');
  var StringProperty=es6_import_item(_es6_module, '../toolprops.js', 'StringProperty');
  var BoolProperty=es6_import_item(_es6_module, '../toolprops.js', 'BoolProperty');
  var Vec2Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec2Property');
  var DataRefProperty=es6_import_item(_es6_module, '../toolprops.js', 'DataRefProperty');
  var Vec3Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec4Property');
  var IntProperty=es6_import_item(_es6_module, '../toolprops.js', 'IntProperty');
  var TPropFlags=es6_import_item(_es6_module, '../toolprops.js', 'TPropFlags');
  var PropTypes=es6_import_item(_es6_module, '../toolprops.js', 'PropTypes');
  var PropSubTypes=es6_import_item(_es6_module, '../toolprops.js', 'PropSubTypes');
  var ModalStates=es6_import_item(_es6_module, '../toolops_api.js', 'ModalStates');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_base.js', 'SplineFlags');
  var MaterialFlags=es6_import_item(_es6_module, '../../curve/spline_base.js', 'MaterialFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_base.js', 'SplineTypes');
  var SelMask=es6_import_item(_es6_module, '../../editors/viewport/selectmode.js', 'SelMask');
  var ToolModes=es6_import_item(_es6_module, '../../editors/viewport/selectmode.js', 'ToolModes');
  var Unit=es6_import_item(_es6_module, '../units.js', 'Unit');
  var ExtrudeModes=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ExtrudeModes');
  var DataFlags=es6_import_item(_es6_module, './data_api.js', 'DataFlags');
  var DataPathTypes=es6_import_item(_es6_module, './data_api.js', 'DataPathTypes');
  var OpStackEditor=es6_import_item(_es6_module, '../../editors/ops/ops_editor.js', 'OpStackEditor');
  var AnimKeyFlags=es6_import_item(_es6_module, '../animdata.js', 'AnimKeyFlags');
  var AnimInterpModes=es6_import_item(_es6_module, '../animdata.js', 'AnimInterpModes');
  var AnimKey=es6_import_item(_es6_module, '../animdata.js', 'AnimKey');
  var VDAnimFlags=es6_import_item(_es6_module, '../frameset.js', 'VDAnimFlags');
  var ExtrudeModes=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ExtrudeModes');
  var SplineLayerFlags=es6_import_item(_es6_module, '../../curve/spline_element_array.js', 'SplineLayerFlags');
  var Material=es6_import_item(_es6_module, '../../curve/spline_types.js', 'Material');
  var SplineFace=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFace');
  var SplineSegment=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineSegment');
  var SplineVertex=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineVertex');
  var CurveEditor=es6_import_item(_es6_module, '../../editors/curve/CurveEditor.js', 'CurveEditor');
  var SceneObject=es6_import_item(_es6_module, '../../scene/sceneobject.js', 'SceneObject');
  var DopeSheetEditor=es6_import_item(_es6_module, '../../editors/dopesheet/DopeSheetEditor.js', 'DopeSheetEditor');
  var SettingsEditor=es6_import_item(_es6_module, '../../editors/settings/SettingsEditor.js', 'SettingsEditor');
  var SelModes={VERTEX: SelMask.VERTEX, 
   SEGMENT: SelMask.SEGMENT, 
   FACE: SelMask.FACE, 
   OBJECT: SelMask.OBJECT}
  var selmask_enum=new EnumProperty(undefined, SelModes, "selmask_enum", "Selection Mode");
  selmask_enum = _es6_module.add_export('selmask_enum', selmask_enum);
  var selmask_ui_vals={}
  for (var k in SelModes) {
      var s=k[0].toUpperCase()+k.slice(1, k.length).toLowerCase();
      var slst=s.split("_");
      var s2="";
      for (var i=0; i<slst.length; i++) {
          s2+=slst[i][0].toUpperCase()+slst[i].slice(1, slst[i].length).toLowerCase()+" ";
      }
      s = s2.trim();
      selmask_ui_vals[k] = s;
  }
  selmask_enum.flag|=TPropFlags.USE_CUSTOM_GETSET|TPropFlags.NEEDS_OWNING_OBJECT;
  selmask_enum.ui_value_names = selmask_ui_vals;
  selmask_enum.add_icons({VERTEX: Icons.VERT_MODE, 
   SEGMENT: Icons.EDGE_MODE, 
   FACE: Icons.FACE_MODE, 
   OBJECT: Icons.OBJECT_MODE});
  selmask_enum.userGetData = function (prop, val, val2) {
    return this.selectmode&(~SelMask.HANDLE);
  }
  selmask_enum.userSetData = function (prop, val) {
    console.log("selmask_enum.userSetData", this, prop, val);
    this.selectmode = val|(this.selectmode&SelMask.HANDLE);
    return this.selectmode;
  }
  var data_api=es6_import(_es6_module, './data_api.js');
  var PropFlags=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'PropFlags');
  var DataPath=data_api.DataPath;
  var DataStruct=data_api.DataStruct;
  var DataStructArray=data_api.DataStructArray;
  var units=Unit.units;
  var unit_enum={}
  var unit_ui_vals={}
  for (var i=0; i<units.length; i++) {
      var s=units[i].suffix_list[0];
      unit_enum[s] = s;
      unit_ui_vals[s] = s;
  }
  Unit.units_enum = new EnumProperty("in", unit_enum, "unit_enum", "Units");
  Unit.units_enum.ui_value_names = unit_ui_vals;
  var SettingsUpdate=function () {
    g_app_state.session.settings.save();
  }
  var SettingsUpdateRecalc=function () {
    g_app_state.session.settings.save();
  }
  var SettingsStruct=undefined;
  function api_define_settings() {
    unitsys_enum = new EnumProperty("imperial", ["imperial", "metric"], "system", "System", "Metric or Imperial");
    var units_enum=Unit.units_enum.copy();
    units_enum.apiname = "default_unit";
    units_enum.uiname = "Default Unit";
    units_enum.update = unitsys_enum.update = SettingsUpdateRecalc;
    SettingsStruct = new DataStruct([new DataPath(unitsys_enum, "unit_system", "unit_scheme", true), new DataPath(units_enum, "default_unit", "unit", true)], AppSettings);
    return SettingsStruct;
  }
  var SettingsEditorStruct=undefined;
  function api_define_seditor() {
    SettingsEditorStruct = new DataStruct([], SettingsEditor);
    return SettingsEditorStruct;
  }
  var OpsEditorStruct=undefined;
  function api_define_opseditor() {
    var filter_sel=new BoolProperty(0, "filter_sel", "Filter Sel", "Exclude selection ops");
    filter_sel.icon = Icons.FILTER_SEL_OPS;
    OpsEditorStruct = new DataStruct([new DataPath(filter_sel, "filter_sel", "filter_sel", true)], OpStackEditor);
    return OpsEditorStruct;
  }
  var AnimKeyStruct=undefined;
  function api_define_animkey() {
    if (AnimKeyStruct!=undefined)
      return AnimKeyStruct;
    AnimKeyStruct = new DataStruct([new DataPath(new IntProperty(-1, "id", "id"), "id", "id", true)], AnimKey);
    return AnimKeyStruct;
  }
  api_define_animkey();
  window.AnimKeyStruct = AnimKeyStruct;
  window.AnimKeyStruct2 = AnimKeyStruct;
  var datablock_structs={}
  var spline_flagprop=new FlagProperty(2, SplineFlags, undefined, "Flags", "Flags");
  spline_flagprop["BREAK_CURVATURES"] = "Less Smooth";
  spline_flagprop.descriptions["BREAK_CURVATURES"] = "Allows curve to more tightly bend at this point";
  spline_flagprop.ui_key_names["BREAK_TANGENTS"] = "Sharp Corner";
  spline_flagprop.addIcons({BREAK_TANGENTS: Icons.EXTRUDE_MODE_G0, 
   BREAK_CURVATURES: Icons.EXTRUDE_MODE_G1});
  function api_define_DataBlock() {
    api_define_animkey();
    var array=new DataStructArray(function getstruct(item) {
      return AnimKeyStruct2;
    }, function itempath(key) {
      return "["+key+"]";
    }, function getitem(key) {
      console.log("get key", key, this);
      return this[key];
    }, function getiter() {
      return new obj_value_iter(this);
    }, function getkeyiter() {
      return new obj_key_iter(this);
    }, function getlength() {
      var tot=0.0;
      for (var k in this) {
          tot++;
      }
      return tot;
    });
    return [new DataPath(array, "animkeys", "lib_anim_idmap", true)];
  }
  var ImageUserStruct=undefined;
  function api_define_imageuser() {
    var image=new DataRefProperty(undefined, [DataTypes.IMAGE], "image", "Image");
    var off=new Vec2Property(undefined, "offset", "Offset");
    var scale=new Vec2Property(undefined, "scale", "Scale");
    scale.range = [0.0001, 90.0];
    off.api_update = scale.api_update = function api_update(ctx, path) {
      window.redraw_viewport();
    }
    ImageUserStruct = new DataStruct([new DataPath(image, "image", "image", true), new DataPath(off, "off", "off", true), new DataPath(scale, "scale", "scale", true)], ImageUser);
    return ImageUserStruct;
  }
  function api_define_view2d() {
    var half_pix_size=new BoolProperty(0, "half_pix_size", "half_pix_size", "Half Resolution (faster)");
    half_pix_size.icon = Icons.HALF_PIXEL_SIZE;
    var only_render=new BoolProperty(0, "only_render", "Hide Controls", "Hide Controls");
    only_render.api_update = function (ctx, path) {
      window.redraw_viewport();
    }
    only_render.icon = Icons.ONLY_RENDER;
    var draw_small_verts=new BoolProperty(0, "draw_small_verts", "Small Points", "Small Control Points");
    draw_small_verts.api_update = function (ctx, path) {
      window.redraw_viewport();
    }
    draw_small_verts.icon = Icons.DRAW_SMALL_VERTS;
    var extrude_mode=new EnumProperty(0, ExtrudeModes, "extrude_mode", "New Line Mode", "New Line Mode");
    extrude_mode.add_icons({SMOOTH: Icons.EXTRUDE_MODE_G2, 
    LESS_SMOOTH: Icons.EXTRUDE_MODE_G1, 
    BROKEN: Icons.EXTRUDE_MODE_G0});
    for (let k in ExtrudeModes) {
        extrude_mode.descriptions[k] = extrude_mode.description;
    }
    var linewidth=new FloatProperty(2.0, "default_linewidth", "Line Wid");
    linewidth.range = [0.01, 100];
    var zoomprop=new FloatProperty(1, "zoom", "Zoom");
    zoomprop.update = function (ctx, path) {
      this.ctx.view2d.set_zoom(this.data);
    }
    zoomprop.range = zoomprop.real_range = zoomprop.ui_range = [0.1, 100];
    zoomprop.expRate = 1.2;
    zoomprop.step = 0.1;
    zoomprop.decimalPlaces = 3;
    var draw_bg_image=new BoolProperty(0, "draw_bg_image", "Draw Image");
    var draw_video=new BoolProperty(0, "draw_video", "Draw Video");
    draw_video.update = draw_bg_image.update = function () {
      window.redraw_viewport();
    }
    var tool_mode=new EnumProperty("SELECT", ToolModes, "select", "Active Tool", "Active Tool");
    tool_mode.add_icons({SELECT: Icons.CURSOR_ARROW, 
    APPEND: Icons.APPEND_VERTEX, 
    RESIZE: Icons.RESIZE, 
    ROTATE: Icons.ROTATE, 
    PEN: Icons.PEN_TOOL});
    var tweak_mode=new BoolProperty(0, "tweak_mode", "Tweak Mode");
    tweak_mode.icon = Icons.CURSOR_ARROW;
    var uinames={}
    for (var key in SelMask) {
        var k2=key[0].toUpperCase()+key.slice(1, key.length).toLowerCase();
        k2 = k2.replace(/\_/g, " ");
        uinames[key] = "Show "+k2+"s";
    }
    var selmask_mask=new FlagProperty(1, SelMask, uinames, undefined, "Sel Mask");
    selmask_mask.addIcons({VERTEX: Icons.VERT_MODE, 
    HANDLE: Icons.SHOW_HANDLES, 
    SEGMENT: Icons.EDGE_MODE, 
    FACE: Icons.FACE_MODE, 
    OBJECT: Icons.OBJECT_MODE});
    selmask_mask.ui_key_names = uinames;
    selmask_mask.update = function () {
      window.redraw_viewport();
    }
    var background_color=new Vec3Property(undefined, "background_color", "Background");
    background_color.subtype = PropSubTypes.COLOR;
    var default_stroke=new Vec4Property(undefined, "default_stroke", "Stroke");
    var default_fill=new Vec4Property(undefined, "default_fill", "Fill");
    default_stroke.subtype = default_fill.subtype = PropSubTypes.COLOR;
    background_color.update = function () {
      window.redraw_viewport();
    }
    let draw_faces=new BoolProperty(0, "draw_faces", "Show Faces");
    draw_faces.icon = Icons.MAKE_POLYGON;
    let enable_blur=new BoolProperty(0, "enable_blur", "Blur");
    enable_blur.icon = Icons.ENABLE_BLUR;
    draw_faces.update = enable_blur.update = function () {
      this.ctx.spline.regen_sort();
      redraw_viewport();
    }
    let edit_all_layers=new BoolProperty(0, "edit_all_layers", "Edit All Layers");
    let show_animpath_prop=new BoolProperty(0, "draw_anim_paths", "Show Animation Paths", "Edit Animation Keyframe Paths");
    show_animpath_prop.icon = Icons.SHOW_ANIMPATHS;
    let draw_normals=new BoolProperty(0, "draw_normals", "Show Normals", "Show Normal Comb");
    draw_normals.icon = Icons.DRAW_NORMALS;
    draw_normals.update = edit_all_layers.update = function () {
      redraw_viewport();
    }
    let sessionflags=new FlagProperty(undefined, SessionFlags, "session_flag", "Session Flags");
    sessionflags.addIcons({PROP_TRANSFORM: Icons.PROP_TRANSFORM});
    let proprad=new FloatProperty(0, "propradius", "Magnet Radius", "Magnet Radius");
    proprad.baseUnit = proprad.displayUnit = "none";
    proprad.range = [0.1, 1024];
    proprad.expRate = 1.75;
    proprad.step = 0.5;
    proprad.decimalPlaces = 2;
    proprad.flag&=~PropFlags.SIMPLE_SLIDER;
    proprad.flag|=PropFlags.FORCE_ROLLER_SLIDER;
    window.View2DStruct = new DataStruct([new DataPath(proprad, "propradius", "propradius", true), new DataPath(edit_all_layers, "edit_all_layers", "edit_all_layers", true), new DataPath(half_pix_size, "half_pix_size", "half_pix_size", true), new DataPath(background_color, "background_color", "background_color", true), new DataPath(default_stroke, "default_stroke", "default_stroke", true), new DataPath(default_fill, "default_fill", "default_fill", true), new DataPath(tool_mode, "toolmode", "toolmode", true), new DataPath(draw_small_verts, "draw_small_verts", "draw_small_verts", true), new DataPath(selmask_enum.copy(), "selectmode", "selectmode", true), new DataPath(selmask_mask.copy(), "selectmask", "selectmode", true), new DataPath(only_render, "only_render", "only_render", true), new DataPath(draw_bg_image, "draw_bg_image", "draw_bg_image", true), new DataPath(sessionflags, "session_flag", "session_flag", true), new DataPath(tweak_mode, "tweak_mode", "tweak_mode", true), new DataPath(enable_blur, "enable_blur", "enable_blur", true), new DataPath(draw_faces, "draw_faces", "draw_faces", true), new DataPath(draw_video, "draw_video", "draw_video", true), new DataPath(draw_normals, "draw_normals", "draw_normals", true), new DataPath(show_animpath_prop, "draw_anim_paths", "draw_anim_paths", true), new DataPath(zoomprop, "zoom", "zoom", true), new DataPath(api_define_material(), "active_material", "active_material", true), new DataPath(linewidth, "default_linewidth", "default_linewidth", true), new DataPath(extrude_mode, "extrude_mode", "extrude_mode", true), new DataPath(new BoolProperty(0, "pin_paths", "Pin Paths", "Remember visible animation paths"), "pin_paths", "pin_paths", true), new DataPath(api_define_imageuser(), "background_image", "background_image", true)], View2DHandler);
    return View2DStruct;
  }
  var MaterialStruct;
  function api_define_material() {
    var fillclr=new Vec4Property(new Vector4(), "fill", "fill", "Fill Color");
    var strokeclr=new Vec4Property(new Vector4(), "stroke", "stroke", "Stroke Color");
    var update_base=function (material) {
      material.update();
      window.redraw_viewport();
    }
    var flag=new FlagProperty(1, MaterialFlags, undefined, "material flags", "material flags");
    flag.update = update_base;
    var fillpath=new DataPath(new BoolProperty(false, "fill_over_stroke", "fill_over_stroke", "fill_over_stroke"), "fill_over_stroke", "fill_over_stroke", true);
    fillclr.subtype = strokeclr.subtype = PropSubTypes.COLOR;
    var linewidth=new FloatProperty(1, "linewidth", "linewidth", "Line Width");
    linewidth.range = [0.1, 2500];
    linewidth.expRate = 1.75;
    linewidth.step = 0.25;
    var linewidth2=new FloatProperty(1, "linewidth2", "linewidth2", "Double Stroke Width");
    linewidth2.range = [0.0, 2500];
    linewidth2.expRate = 1.75;
    linewidth2.step = 0.25;
    fillclr.update = strokeclr.update = linewidth.update = linewidth2.update = blur.update = update_base;
    MaterialStruct = new DataStruct([new DataPath(fillclr, "fillcolor", "fillcolor", true), new DataPath(linewidth, "linewidth", "linewidth", true), new DataPath(linewidth2, "linewidth2", "linewidth2", true), new DataPath(flag, "flag", "flag", true)], Material);
    MaterialStruct.Color4("strokecolor", "strokecolor", "Stroke", "Stroke color").OnUpdate(update_base);
    MaterialStruct.Float("blur", "blur", "Blur", "Amount of blur").Range(0, 800).Step(0.5).OnUpdate(update_base);
    MaterialStruct.Color4("strokecolor2", "strokecolor2", "Double Stroke", "Stroke color").OnUpdate(update_base);
    return MaterialStruct;
  }
  var SplineFaceStruct;
  function api_define_spline_face() {
    let flagprop=spline_flagprop.copy();
    SplineFaceStruct = new DataStruct([new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true), new DataPath(api_define_material(), "mat", "mat", true), new DataPath(flagprop, "flag", "flag", true)], SplineFace);
    return SplineFaceStruct;
  }
  var SplineVertexStruct;
  function api_define_spline_vertex() {
    var coprop=new Vec3Property(undefined, "co", "Co", "Coordinates");
    let flagprop=spline_flagprop.copy();
    flagprop.update = function (owner) {
      this.ctx.spline.regen_sort();
      if (owner!==undefined) {
          owner.flag|=SplineFlags.UPDATE;
      }
      this.ctx.spline.propagate_update_flags();
      this.ctx.spline.resolve = 1;
      window.redraw_viewport();
    }
    let width=new FloatProperty(0, "width", "width", "Width");
    width.baseUnit = width.displayUnit = "none";
    let shift=new FloatProperty(0, "shift", "shift", "Shift");
    shift.baseUnit = shift.displayUnit = "none";
    width.setRange(-50, 200.0);
    width.update = function (vert) {
      vert.flag|=SplineFlags.REDRAW;
      window.redraw_viewport();
    }
    shift.setRange(-2.0, 2.0);
    shift.update = function (vert) {
      vert.flag|=SplineFlags.REDRAW;
      window.redraw_viewport();
    }
    SplineVertexStruct = new DataStruct([new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true), new DataPath(flagprop, "flag", "flag", true), new DataPath(coprop, "co", "", true), new DataPath(width, "width", "width", true), new DataPath(shift, "shift", "shift", true)], SplineVertex);
    return SplineVertexStruct;
  }
  var SplineSegmentStruct;
  function api_define_spline_segment() {
    let flagprop=spline_flagprop.copy();
    flagprop.update = function (segment) {
      new Context().spline.regen_sort();
      segment.flag|=SplineFlags.REDRAW;
      console.log(segment);
      window.redraw_viewport();
    }
    var zprop=new FloatProperty(0, "z", "z", "z");
    let zpath=new DataPath(zprop, "z", "z", true);
    zpath.update = function (segment, old_value, changed) {
      if (segment!=undefined&&old_value!=undefined) {
          changed = segment.z!=old_value;
      }
      if (!changed) {
          return ;
      }
      if (!(g_app_state.modalstate&ModalStates.PLAYING)) {
          this.ctx.frameset.spline.regen_sort();
          this.ctx.frameset.pathspline.regen_sort();
      }
      segment.flag|=SplineFlags.REDRAW;
    }
    let w1=new FloatProperty(0, "w1", "w1", "Width 1");
    let shift1=new FloatProperty(0, "w1", "w1", "Width 1");
    let w2=new FloatProperty(0, "w2", "w2", "Width 2");
    let shift2=new FloatProperty(0, "w2", "w2", "Width 2");
    w1.baseUnit = w2.baseUnit = shift1.baseUnit = shift2.baseUnit = "none";
    w1.displayUnit = w2.displayUnit = shift1.displayUnit = shift2.displayUnit = "none";
    w1.update = shift1.update = w2.update = shift2.update = function (segment) {
      g_app_state.ctx.spline.regen_sort();
      segment.mat.update();
      segment.flag|=SplineFlags.REDRAW;
      window.redraw_viewport();
    }
    SplineSegmentStruct = new DataStruct([new DataPath(w1, "w1", "w1", true), new DataPath(w2, "w2", "w2", true), new DataPath(shift1, "shift1", "shift1", true), new DataPath(shift2, "shift2", "shift2", true), new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true), new DataPath(flagprop, "flag", "flag", true), new DataPath(new BoolProperty(0, "renderable", "renderable"), "renderable", "renderable", true), new DataPath(api_define_material(), "mat", "mat", true), zpath], SplineSegment);
    return SplineSegmentStruct;
  }
  var SplineLayerStruct;
  function api_define_spline_layer_struct() {
    var flag=new FlagProperty(2, SplineLayerFlags);
    flag.descriptions = {MASK: "Use previous layer as a mask"}
    flag.ui_key_names.MASK = flag.ui_value_names[SplineLayerFlags.MASK] = "Mask To Prev";
    flag.update = function () {
      window.redraw_viewport();
    }
    SplineLayerStruct = new DataStruct([new DataPath(new IntProperty(0, "id", "id", "id"), "id", "id", true), new DataPath(new StringProperty("", "name", "name", "name"), "name", "name", true), new DataPath(flag, "flag", "flag", true)]);
    window.SplineLayerStruct = SplineLayerStruct;
  }
  function api_define_spline() {
    api_define_spline_layer_struct();
    var layerset=new DataStructArray(function getstruct(item) {
      return SplineLayerStruct;
    }, function itempath(key) {
      return ".idmap["+key+"]";
    }, function getitem(key) {
      return this.idmap[key];
    }, function getiter() {
      return this[Symbol.iterator]();
    }, function getkeyiter() {
      var keys=Object.keys(this.idmap);
      var ret=new GArray();
      for (var i=0; i<keys.length; i++) {
          ret.push(keys[i]);
      }
      return ret;
    }, function getlength() {
      return this.length;
    });
    function define_editable_element_array(the_struct, name) {
      window.getstruct1 = undefined;
      eval(`
    window.getstruct1 = function getstruct(item) {
    
      return ${name};
      
    } 
    `);
      return new DataStructArray(getstruct1, function itempath(key) {
        return ".local_idmap["+key+"]";
      }, function getitem(key) {
        return this.local_idmap[key];
      }, function getiter() {
        return this.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function getkeyiter(ctx) {
        var keys=new GArray();
        for (let e of this.editable(ctx)) {
            keys.push(e.eid);
        }
        return keys;
      }, function getlength() {
        let len=0;
        for (let e of this.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      });
    }
    function define_selected_element_array(the_struct, name) {
      window.getstruct1 = undefined;
      eval(`
    window.getstruct1 = function getstruct(item) {
    
      return ${name};
      
    } 
    `);
      return new DataStructArray(getstruct1, function itempath(key) {
        return ".local_idmap["+key+"]";
      }, function getitem(key) {
        return this.local_idmap[key];
      }, function getiter() {
        return this.selected.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function getkeyiter(ctx) {
        var keys=new GArray();
        for (let e of this.editable(ctx)) {
            keys.push(e.eid);
        }
        return keys;
      }, function getlength() {
        let len=0;
        for (let e of this.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      });
    }
    function define_element_array(the_struct, name) {
      window.getstruct1 = undefined;
      eval(`
    window.getstruct1 = function getstruct(item) {
    
      return ${name};
      
    } 
    `);
      return new DataStructArray(getstruct1, function itempath(key) {
        return ".local_idmap["+key+"]";
      }, function getitem(key) {
        return this.local_idmap[key];
      }, function getiter() {
        return this[Symbol.iterator]();
      }, function getkeyiter() {
        var keys=Object.keys(this.local_idmap);
        var ret=new GArray();
        for (var i=0; i<keys.length; i++) {
            ret.push(keys[i]);
        }
        return ret;
      }, function getlength() {
        return this.length;
      });
    }
    var SplineStruct=new DataStruct(api_define_DataBlock().concat([new DataPath(api_define_spline_face(), "active_face", "faces.active", true), new DataPath(api_define_spline_segment(), "active_segment", "segments.active", true), new DataPath(api_define_spline_vertex(), "active_vertex", "verts.active", true), new DataPath(define_element_array(SplineFaceStruct, "SplineFaceStruct"), "faces", "faces", true), new DataPath(define_element_array(SplineSegmentStruct, "SplineSegmentStruct"), "segments", "segments", true), new DataPath(define_element_array(SplineVertexStruct, "SplineVertexStruct"), "verts", "verts", true), new DataPath(define_element_array(SplineVertexStruct, "SplineVertexStruct"), "handles", "handles", true), new DataPath(define_editable_element_array(SplineFaceStruct, "SplineFaceStruct"), "editable_faces", "faces", true), new DataPath(define_editable_element_array(SplineSegmentStruct, "SplineSegmentStruct"), "editable_segments", "segments", true), new DataPath(define_editable_element_array(SplineVertexStruct, "SplineVertexStruct"), "editable_verts", "verts", true), new DataPath(define_editable_element_array(SplineVertexStruct, "SplineVertexStruct"), "editable_handles", "handles", true), new DataPath(define_selected_element_array(SplineFaceStruct, "SplineFaceStruct"), "selected_facese", "faces", true), new DataPath(define_selected_element_array(SplineSegmentStruct, "SplineSegmentStruct"), "selected_segments", "segments", true), new DataPath(define_selected_element_array(SplineVertexStruct, "SplineVertexStruct"), "selected_verts", "verts", true), new DataPath(define_selected_element_array(SplineVertexStruct, "SplineVertexStruct"), "selected_handles", "handles", true), new DataPath(layerset, "layerset", "layerset", true), new DataPath(SplineLayerStruct, "active_layer", "layerset.active", true)]));
    datablock_structs[DataTypes.SPLINE] = SplineStruct;
    return SplineStruct;
  }
  function api_define_vertex_animdata() {
    var VertexAnimData=new DataStruct([]);
    VertexAnimData.Flags(VDAnimFlags, "animflag", "animflag", "Animation Flags", "Keyframe Settings");
    VertexAnimData.Int("owning_vertex", "eid", "Owning Vertex", "Vertex in drawspline that owns this animation path");
    return VertexAnimData;
  }
  function api_define_frameset() {
    let animdata_struct=api_define_vertex_animdata();
    function define_animdata_array() {
      return new DataStructArray(function getstruct(item) {
        return animdata_struct;
      }, function itempath(key) {
        return "["+key+"]";
      }, function getitem(key) {
        return this[key];
      }, function getiter() {
        let this2=this;
        return (function* () {
          for (let k in this2) {
              yield this2[k];
          }
        })();
      }, function getkeyiter() {
        var keys=Object.keys(this);
        var ret=new GArray();
        for (var i=0; i<keys.length; i++) {
            ret.push(keys[i]);
        }
        return ret;
      }, function getlength() {
        let i=0;
        for (let k in this) {
            i++;
        }
        return i;
      });
    }
    var FrameSetStruct=new DataStruct(api_define_DataBlock().concat([new DataPath(api_define_spline(), "drawspline", "spline", true), new DataPath(api_define_spline(), "pathspline", "pathspline", true), new DataPath(define_animdata_array(), "keypaths", "vertex_animdata", true), new DataPath(animdata_struct, "active_keypath", "active_animdata", true)]));
    datablock_structs[DataTypes.FRAMESET] = FrameSetStruct;
    return FrameSetStruct;
  }
  var SceneStruct=undefined;
  function api_define_sceneobject() {
    var SceneObjectStruct=new DataStruct();
    SceneObjectStruct.Vector2("loc", "loc", "Position", "Position");
    SceneObjectStruct.Vector2("scale", "scale", "Scale", "Scale");
    SceneObjectStruct.Float("rot", "rot", "Rotation", "Rotation");
    SceneObjectStruct.add(new DataPath(api_define_frameset(), "frameset", "data", true));
    SceneObjectStruct.Bool("edit_all_layers", "edit_all_layers", "Edit All Layers", "Edit All Layers");
    return SceneObjectStruct;
  }
  function api_define_sceneobjects() {
    let SceneObjectStruct=api_define_sceneobject();
    let objectarray=new DataStructArray(function getstruct(item) {
      return SceneObjectStruct;
    }, function itempath(key) {
      return ".object_idmap["+key+"]";
    }, function getitem(key) {
      console.log("get key", key, this);
      return this.object_idmap[key];
    }, function getiter() {
      return new obj_value_iter(this.object_idmap);
    }, function getkeyiter() {
      return new obj_key_iter(this.object_idmap);
    }, function getlength() {
      return this.objects.length;
    });
    return objectarray;
  }
  function api_define_scene() {
    var name=new StringProperty("", "name", "name", "Name", TPropFlags.LABEL);
    var frame=new IntProperty(0, "frame", "Frame", "Frame", TPropFlags.LABEL);
    frame.range = [1, 10000];
    frame.step = 1;
    frame.expRate = 1.5;
    frame.update = (owner, old) =>      {
      let time=owner.time;
      owner.time = old;
      owner.change_time(g_app_state.ctx, time);
      window.redraw_viewport();
    }
    var SceneStruct=new DataStruct(api_define_DataBlock().concat([new DataPath(name, "name", "name", true), new DataPath(frame, "frame", "time", true), new DataPath(api_define_sceneobjects(), "objects", "objects", true), new DataPath(api_define_sceneobject(), "active_object", "objects.active", true)]));
    datablock_structs[DataTypes.SCENE] = SceneStruct;
    return SceneStruct;
  }
  var DopeSheetStruct=undefined;
  function api_define_dopesheet() {
    var selected_only=new BoolProperty(false, "selected_only", "Selected Only", "Show only keys of selected vertices");
    var pinned=new BoolProperty(false, "pinned", "Pin", "Pin view");
    selected_only.update = function (owner) {
      owner.rebuild();
    }
    let timescale=new FloatProperty(1.0, "timescale", "timescale", "timescale");
    timescale.update = function (owner) {
      owner.updateKeyPositions();
    }
    DopeSheetStruct = new DataStruct([new DataPath(selected_only, "selected_only", "selected_only", true), new DataPath(pinned, "pinned", "pinned", true), new DataPath(timescale, "timescale", "timescale")], DopeSheetEditor);
    return DopeSheetStruct;
  }
  var CurveEditStruct=undefined;
  function api_define_editcurve() {
    var selected_only=new BoolProperty(false, "selected_only", "Selected Only", "Show only keys of selected vertices");
    var pinned=new BoolProperty(false, "pinned", "Pin", "Pin view");
    selected_only.update = function () {
      if (this.ctx!=undefined&&this.ctx.editcurve!=undefined)
        this.ctx.editcurve.do_full_recalc();
    }
    CurveEditStruct = new DataStruct([new DataPath(selected_only, "selected_only", "selected_only", true), new DataPath(pinned, "pinned", "pinned", true)], CurveEditor);
    return CurveEditStruct;
  }
  var ObjectStruct=undefined;
  function api_define_object() {
    var name=new StringProperty("", "name", "name", "Name", TPropFlags.LABEL);
    var ctx_bb=new Vec3Property(new Vector3(), "dimensions", "Dimensions", "Editable dimensions");
    ctx_bb.flag|=TPropFlags.USE_UNDO;
    ctx_bb.update = function () {
      if (this.ctx.mesh!==undefined)
        this.ctx.mesh.regen_render();
      if (this.ctx.view2d!==undefined&&this.ctx.view2d.selectmode&EditModes.GEOMETRY) {
          this.ctx.object.dag_update();
      }
    }
    ObjectStruct = new DataStruct([new DataPath(name, "name", "name", true), new DataPath(ctx_bb, "ctx_bb", "ctx_bb", true)], SceneObject);
    return ObjectStruct;
  }
  var ImageStruct=undefined;
  function api_define_image() {
    var name=new StringProperty("");
    var lib_id=new IntProperty(0);
    var path=new StringProperty("");
    var flag=new FlagProperty(1, ImageFlags, undefined, "image flags", "image flags");
    ImageStruct = new DataStruct([new DataPath(name, "name", "name", true), new DataPath(lib_id, "lib_id", "lib_id", true), new DataPath(path, 'path', 'path', true), new DataPath(flag, 'flag', 'flag', true)], Image);
    datablock_structs[DataTypes.IMAGE] = ImageStruct;
    return ImageStruct;
  }
  function toArray(list) {
    let ret=[];
    for (let item of list) {
        ret.push(item);
    }
    return ret;
  }
  function api_define_datalist(name, typeid) {
    var items=new DataStructArray(function getstruct(item) {
      return datablock_structs[item.lib_type];
    }, function itempath(key) {
      return "["+key+"]";
    }, function getitem(key) {
      return this[key];
    }, function getiter() {
      let ret=[];
      for (var k in this) {
          ret.push(this[k]);
      }
      return ret[Symbol.iterator]();
    }, function getkeyiter() {
      let ret=[];
      for (var k in this) {
          ret.push(k);
      }
      return ret[Symbol.iterator]();
    }, function getlength() {
      let count=0;
      for (let k in this) {
          count++;
      }
      return count;
    });
    return new DataStruct([new DataPath(new StringProperty(name, "name"), "name", "name", false), new DataPath(new IntProperty(typeid, "typeid"), "typeid", "typeid", false), new DataPath(items, "items", "idmap", true)]);
  }
  var DataLibStruct=undefined;
  function api_define_datalib() {
    var paths=[];
    if (DataLibStruct!=undefined)
      return DataLibStruct;
    for (var k in DataTypes) {
        var v=DataTypes[k];
        var name=k.toLowerCase();
        paths.push(new DataPath(api_define_datalist(name, v), name, "datalists.items["+v+"]", false));
    }
    DataLibStruct = new DataStruct(paths);
    return DataLibStruct;
  }
  api_define_datalib();
  window.DataLibStruct2 = DataLibStruct;
  var AppStateStruct=undefined;
  function api_define_appstate() {
    var sel_multiple_mode=new BoolProperty(false, "select_multiple", "Multiple", "Select multiple elements");
    var sel_inverse_mode=new BoolProperty(false, "select_inverse", "Deselect", "Deselect Elements");
    AppStateStruct = new DataStruct([new DataPath(sel_multiple_mode, "select_multiple", "select_multiple", true), new DataPath(sel_inverse_mode, "select_inverse", "select_inverse", true)]);
    return AppStateStruct;
  }
  function get_tool_struct(tool) {
    OpStackArray.flag|=DataFlags.RECALC_CACHE;
    if (tool.apistruct!=undefined) {
        tool.apistruct.flag|=DataFlags.RECALC_CACHE;
        return tool.apistruct;
    }
    tool.apistruct = g_app_state.toolstack.gen_tool_datastruct(tool);
    tool.apistruct.flag|=DataFlags.RECALC_CACHE;
    return tool.apistruct;
  }
  get_tool_struct = _es6_module.add_export('get_tool_struct', get_tool_struct);
  var OpStackArray=new DataStructArray(get_tool_struct, function getitempath(key) {
    return "["+key+"]";
  }, function getitem(key) {
    return g_app_state.toolstack.undostack[key];
  }, function getiter() {
    return g_app_state.toolstack.undostack[Symbol.iterator]();
  }, function getkeyiter() {
    function* range(len) {
      for (var i=0; i<len; i++) {
          yield i;
      }
    }
    return range(g_app_state.toolstack.undostack.length)[Symbol.iterator]();
  }, function getlength() {
    return g_app_state.toolstack.undostack.length;
  });
  ContextStruct = undefined;
  window.test_range = function* range(len) {
    for (var i=0; i<len; i++) {
        yield i;
    }
  }
  function updateActiveToolApi(ctx) {
    if (cconst.USE_PATHUX_API) {
        return ;
    }
    let p=ContextStruct.pathmap.active_tool;
    let update=false;
    let toolcls=ctx.toolmode.constructor;
    if (!toolcls) {
        return ;
    }
    if (p&&p.data!==toolcls._apiStruct) {
        update = true;
        ContextStruct.remove(p);
    }
    else 
      if (!p) {
        update = true;
    }
    if (update) {
        console.log("Updating data API for toolmode "+toolcls.name);
        ContextStruct.add(new DataPath(toolcls._apiStruct, "active_tool", "ctx.toolmode", true));
    }
  }
  updateActiveToolApi = _es6_module.add_export('updateActiveToolApi', updateActiveToolApi);
  window.updateActiveToolApi = updateActiveToolApi;
  window.api_define_context = function () {
    ContextStruct = new DataStruct([new DataPath(api_define_view2d(), "view2d", "ctx.view2d", true), new DataPath(api_define_dopesheet(), "dopesheet", "ctx.dopesheet", true), new DataPath(api_define_editcurve(), "editcurve", "ctx.editcurve", true), new DataPath(api_define_frameset(), "frameset", "ctx.frameset", true), new DataPath(api_define_seditor(), "settings_editor", "ctx.settings_editor", false), new DataPath(api_define_settings(), "settings", "ctx.appstate.session.settings", false), new DataPath(api_define_object(), "object", "ctx.object", false), new DataPath(api_define_scene(), "scene", "ctx.scene", false), new DataPath(new DataStruct([]), "last_tool", "", false, false, DataFlags.RECALC_CACHE), new DataPath(api_define_appstate(), "appstate", "ctx.appstate", false), new DataPath(OpStackArray, "operator_stack", "ctx.appstate.toolstack.undostack", false, true, DataFlags.RECALC_CACHE), new DataPath(api_define_spline(), "spline", "ctx.spline", false), new DataPath(api_define_datalib(), "datalib", "ctx.datalib", false), new DataPath(api_define_opseditor(), "opseditor", "ctx.opseditor", false), new DataPath(new DataStruct([]), "active_tool", "ctx.toolmode", false, false, DataFlags.RECALC_CACHE)], Context);
    toolmode.defineAPI();
  }
  window.init_data_api = function () {
    if (cconst.USE_PATHUX_API) {
        return ;
    }
    api_define_ops();
    api_define_context();
  }
  function gen_path_maps(strct, obj, path1, path2) {
    if (obj==undefined)
      obj = {}
    if (path1==undefined) {
        path1 = "";
        path2 = "";
    }
    if (path1!="")
      obj[path1] = strct;
    for (var p in strct.paths) {
        if (!(__instance_of(p.data, DataStruct))) {
            if (p.use_path) {
                obj[path1+"."+p.path] = "r = "+path2+"."+p.path+"; obj["+path1+"].pathmap["+p.path+"]";
            }
            else {
              obj[path1+"."+p.path] = "r = undefined; obj["+path1+"].pathmap["+p.path+"]";
            }
        }
        else {
          gen_path_maps(p, obj, path1+p.name, path2+p.path);
        }
    }
  }
  gen_path_maps = _es6_module.add_export('gen_path_maps', gen_path_maps);
  let _prefix=`"use strict";
import {DataAPI, buildToolSysAPI} from '../../path.ux/scripts/pathux.js';
import {DataTypes} from '../lib_api.js';
import {EditModes, View2DHandler} from '../../editors/viewport/view2d.js';
import {ImageFlags, Image, ImageUser} from '../imageblock.js';
import {AppSettings} from '../UserSettings.js';
import {FullContext} from "../context.js";
import {SplineToolMode} from '../../editors/viewport/toolmodes/splinetool.js';
import {SessionFlags} from '../../editors/viewport/view2d_base.js';

import {VertexAnimData} from "../frameset.js";
import {SplineLayer} from "../../curve/spline_element_array.js";

import {
  EnumProperty, FlagProperty,
  FloatProperty, StringProperty,
  BoolProperty, Vec2Property,
  DataRefProperty,
  Vec3Property, Vec4Property, IntProperty,
  TPropFlags, PropTypes, PropSubTypes
} from '../toolprops.js';

import {ModalStates} from '../toolops_api.js';

import {SplineFlags, MaterialFlags, SplineTypes} from '../../curve/spline_base.js';
import {SelMask, ToolModes} from '../../editors/viewport/selectmode.js';
import {Unit} from '../units.js';

import {ExtrudeModes} from '../../editors/viewport/spline_createops.js';
import {DataFlags, DataPathTypes} from './data_api.js';
import {OpStackEditor} from '../../editors/ops/ops_editor.js';

import {AnimKeyFlags, AnimInterpModes, AnimKey} from '../animdata.js';
import {VDAnimFlags, SplineFrameSet} from '../frameset.js';

import {ExtrudeModes} from '../../editors/viewport/spline_createops.js';
import {SplineLayerFlags} from '../../curve/spline_element_array.js';
import {Material, SplineFace, SplineSegment, SplineVertex} from "../../curve/spline_types.js";
import {CurveEditor} from "../../editors/curve/CurveEditor.js";
import {SceneObject} from "../../scene/sceneobject.js";
import {DopeSheetEditor} from "../../editors/dopesheet/DopeSheetEditor.js";
import {SettingsEditor} from "../../editors/settings/SettingsEditor.js";
import {Scene} from "../../scene/scene.js";
import {Spline} from "../../curve/spline.js";
import {DataLib, DataBlock, DataList} from "../lib_api.js";

`;
  window.genNewDataAPI = () =>    {
    let out="";
    let ctx=g_app_state.ctx;
    let getClass=(dstruct, path) =>      {
      if (dstruct.dataClass)
        return dstruct.dataClass;
      console.log(path);
      window.ctx = CTX;
      let val;
      try {
        val = eval(path);
      }
      catch (error) {
          print_stack(error);
          console.warn("failed");
      }
      if (!val||!(typeof val==="object")) {
          console.warn("Failed to resovle a class", dstruct, "at", path);
          return undefined;
      }
      return val.constructor;
    }
    let structs={}
    let genStruct=(cls, dstruct, path) =>      {
      if (!cls) {
          console.warn("Failed to resolve a class", dstruct, path);
          return ;
      }
      let name=cls.name;
      out+=`var ${name}Struct = api.mapStruct(${cls.name}, true);\n\n`;
      out+="function api_define_"+name+"(api) {\n";
      name = name+"Struct";
      for (let dpath of dstruct.paths) {
          let name2=dpath.name;
          let path2=path.trim();
          if (path2.length>0) {
              path2+=".";
          }
          path2+=dpath.path;
          let checkenum=(a, def) =>            {
            if (!a)
              return false;
            let ok=false;
            for (let k in def) {
                if (a[k]!==k) {
                    ok = true;
                }
            }
            return ok;
          };
          let format_obj=(obj) =>            {
            for (let k in _es6_module.imports) {
                let v=_es6_module.imports[k].value;
                if (typeof v!=="object"||v===null)
                  continue;
                let ok=true;
                for (let k2 in obj) {
                    if (v[k2]===undefined||v[k2]!==obj[k2]) {
                        ok = false;
                    }
                }
                if (ok) {
                    return k;
                }
            }
            let def="{\n";
            let keys=Object.keys(obj);
            let maxwid=0;
            for (let i=0; i<keys.length; i++) {
                maxwid = Math.max(maxwid, keys[i].length);
            }
            for (let i=0; i<keys.length; i++) {
                let k=""+keys[i];
                let v=obj[keys[i]];
                if (k.search(" ")>=0||k==="in"||k==="of"||k==="if")
                  k = `"${k}"`;
                if (typeof v!=="number"&&!(typeof v==="string"&&v.startsWith("Icons.")))
                  v = `"${v}"`;
                def+="      "+k;
                let wid=k.length;
                for (let j=0; j<maxwid-wid; j++) {
                    def+=" ";
                }
                def+=" : "+v;
                if (i<keys.length-1) {
                    def+=",";
                }
                def+="\n";
            }
            def+="    }";
            return def;
          };
          let path3=dpath.path;
          if (path3.startsWith("ctx.")) {
              path3 = path3.slice(4, path3.length);
          }
          if (dpath.type===DataPathTypes.STRUCT) {
              let stt="undefined";
              let cls2=getClass(dpath.data, path2);
              if (cls2!==undefined) {
                  stt = `api.mapStruct(${cls2.name}, true)`;
              }
              else {
                out+=`  /*WARNING: failed to resolve a class: ${path2} ${dpath.name} ${dpath.path} */\n`;
              }
              out+=`  ${name}.struct("${path3}", "${dpath.name}", "${dpath.uiname}", ${stt});\n`;
          }
          else 
            if (dpath.type===DataPathTypes.STRUCT_ARRAY) {
              function process(func) {
                let s=(""+func).trim();
                s = s.slice(0, s.length-1);
                s = s.split("\n");
                s = s.slice(1, s.length);
                s = s.join("\n").trim();
                s = s.replace(/this/g, "list");
                return s;
              }
              let list=dpath.data;
              out+=`  ${name}.list("${path3}", "${dpath.name}", [\n`;
              if (list.getiter) {
                  out+=`    function getIter(api, list) {\n      ${process(list.getiter)}\n    },\n`;
              }
              if (list.getitem) {
                  out+=`    function get(api, list, key) {\n      ${process(list.getitem)}\n    },\n`;
              }
              if (list.getter) {
                  out+=`    function getStruct(api, list, key) {\n      ${process(list.getter)}\n    },\n`;
              }
              if (list.getlength) {
                  out+=`    function getLength(api, list) {\n      ${process(list.getlength)}\n    },\n`;
              }
              if (list.getkeyiter) {
                  out+="/*"+list.getkeyiter+"*/\n";
              }
              if (list.getitempath) {
                  out+="/*"+list.getitempath+"*/\n";
              }
              out+="  ]);\n";
          }
          else {
            let prop=dpath.data;
            let name2=dpath.name;
            out+=`  `;
            let uiname=dpath.uiname||prop.uiname||dpath.name;
            let numprop=(prop, isint) =>              {
              s = "";
              if (prop.range&&prop.range[0]&&prop.range[1]) {
                  s+=`.range(${prop.range[0]}, ${prop.range[1]})`;
              }
              if (prop.ui_range&&prop.ui_range[0]&&prop.ui_range[1]) {
                  s+=`.uiRange(${prop.ui_range[0]}, ${prop.ui_range[1]})`;
              }
              if (prop.step!==undefined) {
                  s+=`.step(${prop.step})`;
              }
              if (prop.expRate!==undefined) {
                  s+=`.expRate(${prop.expRate})`;
              }
              if (!isint&&prop.decimalPlaces!==undefined) {
                  s+=`.decimalPlaces(${prop.decimalPlaces})`;
              }
              return s;
            };
            let path3=dpath.path;
            if (path3.startsWith("ctx.")) {
                path3 = path3.slice(4, path3.length);
            }
            switch (prop.type) {
              case PropTypes.BOOL:
                out+=`${name}.bool("${path3}", "${dpath.name}", "${uiname}")`;
                break;
              case PropTypes.INT:
                out+=`${name}.int("${path3}", "${dpath.name}", "${uiname}")`;
                out+=numprop(prop, true);
                break;
              case PropTypes.FLOAT:
                out+=`${name}.float("${path3}", "${dpath.name}", "${uiname}")`;
                out+=numprop(prop);
                break;
              case PropTypes.VEC2:
                out+=`${name}.vec2("${path3}", "${dpath.name}", "${uiname}")`;
                out+=numprop(prop);
                break;
              case PropTypes.VEC3:
                out+=`${name}.vec3("${path3}", "${dpath.name}", "${uiname}")`;
                out+=numprop(prop);
                break;
              case PropTypes.VEC4:
                out+=`${name}.vec2("${path3}", "${dpath.name}", "${uiname}")`;
                out+=numprop(prop);
                break;
              case PropTypes.ENUM:
              case PropTypes.FLAG:
                let key=prop.type===PropTypes.ENUM ? "enum" : "flags";
                let def=format_obj(prop.type===PropTypes.FLAG ? prop.values : prop.values);
                out+=`${name}.${key}("${path3}", "${dpath.name}", ${def}, "${uiname}")`;
                if (prop.type===PropTypes.ENUM) {
                    if (checkenum(prop.ui_value_names, prop.values)) {
                        out+=`.uiNames(${format_obj(prop.ui_value_names)})`;
                    }
                }
                else {
                  if (checkenum(prop.ui_value_names, prop.values)) {
                      out+=`.uiNames(${format_obj(prop.ui_value_names)})`;
                  }
                }
                if (checkenum(prop.descriptions, prop.values)) {
                    out+=`.descriptions(${format_obj(prop.descriptions)})`;
                }
                if (checkenum(prop.iconmap, prop.values)) {
                    let iconmap2={};
                    for (let k in prop.iconmap) {
                        let v=prop.iconmap[k];
                        for (let k2 in Icons) {
                            if (Icons[k2]===v) {
                                iconmap2[k] = "Icons."+k2;
                            }
                        }
                    }
                    out+=`.icons(${format_obj(iconmap2)})`;
                }
                break;
            }
            if (prop.userSetData&&prop.userSetData!==prop.prototype.userSetData) {
                out+=".customSet("+prop.userSetData+")";
            }
            if (prop.update&&prop.update!==prop.prototype.update) {
                out+=`.on("change", function(old) {return (${""+prop.update}).call(this.dataref, old)})`;
            }
            out+=";\n";
          }
      }
      out+="}\n\n";
    }
    let recurse=(dstruct, path) =>      {
      let cls=getClass(dstruct, path);
      if (cls===undefined) {
          console.warn("failed to resolve class for path", path, dstruct);
          return ;
      }
      if (!(cls.name in structs)) {
          genStruct(cls, dstruct, path);
          structs[cls.name] = cls;
      }
      if (path.length>0) {
          path+=".";
      }
      for (let dpath of dstruct.paths) {
          if (dpath.type===DataPathTypes.STRUCT) {
              recurse(dpath.data, path+dpath.path);
          }
      }
    }
    console.warn("ContextStruct:", ContextStruct);
    recurse(ContextStruct, "");
    console.log(structs);
    console.log(out);
    for (let k in structs) {
        out+=`  api_define_${k}(api);\n`;
    }
    let lines=out.split("\n");
    out = "export function makeAPI(api = new DataAPI()) {\n";
    for (let l of lines) {
        out+="  "+l+"\n";
    }
    out+=`
  api.rootContextStruct = FullContextStruct;

  FullContextStruct.struct("last_tool", "last_tool");
  buildToolSysAPI(api, true, FullContextStruct);
  
  return api;
}\n`;
    return _prefix+out;
  }
}, '/dev/fairmotion/src/core/data_api/data_api_define.js');


es6_module_define('data_api_new', ["../context.js", "../../editors/viewport/selectmode.js", "../../editors/settings/SettingsEditor.js", "../../scene/scene.js", "../toolprops.js", "../../editors/curve/CurveEditor.js", "../../curve/spline_base.js", "../../path.ux/scripts/pathux.js", "../toolops_api.js", "./data_api.js", "../../editors/ops/ops_editor.js", "../frameset.js", "../UserSettings.js", "../animdata.js", "../../editors/viewport/view2d.js", "../../curve/spline.js", "../lib_api.js", "../../scene/sceneobject.js", "../../editors/dopesheet/DopeSheetEditor.js", "../imageblock.js", "../../curve/spline_types.js", "../../editors/viewport/spline_createops.js", "../../curve/spline_element_array.js", "../../editors/viewport/toolmodes/toolmode.js", "../../editors/viewport/view2d_base.js", "../units.js", "../../editors/viewport/toolmodes/splinetool.js"], function _data_api_new_module(_es6_module) {
  "use strict";
  var DataAPI=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'DataAPI');
  var buildToolSysAPI=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'buildToolSysAPI');
  var DataTypes=es6_import_item(_es6_module, '../lib_api.js', 'DataTypes');
  var EditModes=es6_import_item(_es6_module, '../../editors/viewport/view2d.js', 'EditModes');
  var View2DHandler=es6_import_item(_es6_module, '../../editors/viewport/view2d.js', 'View2DHandler');
  var ImageFlags=es6_import_item(_es6_module, '../imageblock.js', 'ImageFlags');
  var Image=es6_import_item(_es6_module, '../imageblock.js', 'Image');
  var ImageUser=es6_import_item(_es6_module, '../imageblock.js', 'ImageUser');
  var AppSettings=es6_import_item(_es6_module, '../UserSettings.js', 'AppSettings');
  var FullContext=es6_import_item(_es6_module, '../context.js', 'FullContext');
  var SplineToolMode=es6_import_item(_es6_module, '../../editors/viewport/toolmodes/splinetool.js', 'SplineToolMode');
  var SessionFlags=es6_import_item(_es6_module, '../../editors/viewport/view2d_base.js', 'SessionFlags');
  var VertexAnimData=es6_import_item(_es6_module, '../frameset.js', 'VertexAnimData');
  var SplineLayer=es6_import_item(_es6_module, '../../curve/spline_element_array.js', 'SplineLayer');
  var EnumProperty=es6_import_item(_es6_module, '../toolprops.js', 'EnumProperty');
  var FlagProperty=es6_import_item(_es6_module, '../toolprops.js', 'FlagProperty');
  var FloatProperty=es6_import_item(_es6_module, '../toolprops.js', 'FloatProperty');
  var StringProperty=es6_import_item(_es6_module, '../toolprops.js', 'StringProperty');
  var BoolProperty=es6_import_item(_es6_module, '../toolprops.js', 'BoolProperty');
  var Vec2Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec2Property');
  var DataRefProperty=es6_import_item(_es6_module, '../toolprops.js', 'DataRefProperty');
  var Vec3Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, '../toolprops.js', 'Vec4Property');
  var IntProperty=es6_import_item(_es6_module, '../toolprops.js', 'IntProperty');
  var TPropFlags=es6_import_item(_es6_module, '../toolprops.js', 'TPropFlags');
  var PropTypes=es6_import_item(_es6_module, '../toolprops.js', 'PropTypes');
  var PropSubTypes=es6_import_item(_es6_module, '../toolprops.js', 'PropSubTypes');
  var ModalStates=es6_import_item(_es6_module, '../toolops_api.js', 'ModalStates');
  var SplineFlags=es6_import_item(_es6_module, '../../curve/spline_base.js', 'SplineFlags');
  var MaterialFlags=es6_import_item(_es6_module, '../../curve/spline_base.js', 'MaterialFlags');
  var SplineTypes=es6_import_item(_es6_module, '../../curve/spline_base.js', 'SplineTypes');
  var SelMask=es6_import_item(_es6_module, '../../editors/viewport/selectmode.js', 'SelMask');
  var ToolModes=es6_import_item(_es6_module, '../../editors/viewport/selectmode.js', 'ToolModes');
  var Unit=es6_import_item(_es6_module, '../units.js', 'Unit');
  var ExtrudeModes=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ExtrudeModes');
  var DataFlags=es6_import_item(_es6_module, './data_api.js', 'DataFlags');
  var DataPathTypes=es6_import_item(_es6_module, './data_api.js', 'DataPathTypes');
  var OpStackEditor=es6_import_item(_es6_module, '../../editors/ops/ops_editor.js', 'OpStackEditor');
  var AnimKeyFlags=es6_import_item(_es6_module, '../animdata.js', 'AnimKeyFlags');
  var AnimInterpModes=es6_import_item(_es6_module, '../animdata.js', 'AnimInterpModes');
  var AnimKey=es6_import_item(_es6_module, '../animdata.js', 'AnimKey');
  var VDAnimFlags=es6_import_item(_es6_module, '../frameset.js', 'VDAnimFlags');
  var SplineFrameSet=es6_import_item(_es6_module, '../frameset.js', 'SplineFrameSet');
  var ExtrudeModes=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ExtrudeModes');
  var SplineLayerFlags=es6_import_item(_es6_module, '../../curve/spline_element_array.js', 'SplineLayerFlags');
  var Material=es6_import_item(_es6_module, '../../curve/spline_types.js', 'Material');
  var SplineFace=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineFace');
  var SplineSegment=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineSegment');
  var SplineVertex=es6_import_item(_es6_module, '../../curve/spline_types.js', 'SplineVertex');
  var CurveEditor=es6_import_item(_es6_module, '../../editors/curve/CurveEditor.js', 'CurveEditor');
  var SceneObject=es6_import_item(_es6_module, '../../scene/sceneobject.js', 'SceneObject');
  var DopeSheetEditor=es6_import_item(_es6_module, '../../editors/dopesheet/DopeSheetEditor.js', 'DopeSheetEditor');
  var SettingsEditor=es6_import_item(_es6_module, '../../editors/settings/SettingsEditor.js', 'SettingsEditor');
  var Scene=es6_import_item(_es6_module, '../../scene/scene.js', 'Scene');
  var Spline=es6_import_item(_es6_module, '../../curve/spline.js', 'Spline');
  var DataLib=es6_import_item(_es6_module, '../lib_api.js', 'DataLib');
  var DataBlock=es6_import_item(_es6_module, '../lib_api.js', 'DataBlock');
  var DataList=es6_import_item(_es6_module, '../lib_api.js', 'DataList');
  var initToolModeAPI=es6_import_item(_es6_module, '../../editors/viewport/toolmodes/toolmode.js', 'initToolModeAPI');
  function makeAPI(api) {
    if (api===undefined) {
        api = new DataAPI();
    }
    var FullContextStruct=api.mapStruct(FullContext, true);
    function api_define_FullContext(api) {
      FullContextStruct.struct("view2d", "view2d", "undefined", api.mapStruct(View2DHandler, true));
      FullContextStruct.struct("dopesheet", "dopesheet", "undefined", api.mapStruct(DopeSheetEditor, true));
      FullContextStruct.struct("editcurve", "editcurve", "undefined", api.mapStruct(CurveEditor, true));
      FullContextStruct.struct("frameset", "frameset", "undefined", api.mapStruct(SplineFrameSet, true));
      FullContextStruct.struct("settings_editor", "settings_editor", "undefined", api.mapStruct(SettingsEditor, true));
      FullContextStruct.struct("appstate.session.settings", "settings", "undefined", api.mapStruct(AppSettings, true));
      FullContextStruct.struct("object", "object", "undefined", api.mapStruct(SceneObject, true));
      FullContextStruct.struct("scene", "scene", "undefined", api.mapStruct(Scene, true));
      FullContextStruct.struct("", "last_tool", "undefined", undefined);
      FullContextStruct.struct("appstate", "appstate", "undefined", api.mapStruct(AppState, true));
      FullContextStruct.list("appstate.toolstack.undostack", "operator_stack", [function getIter(api, list) {
        return g_app_state.toolstack.undostack[Symbol.iterator]();
      }, function get(api, list, key) {
        return g_app_state.toolstack.undostack[key];
      }, function getStruct(api, list, key) {
        OpStackArray.flag|=DataFlags.RECALC_CACHE;
        if (tool.apistruct!=undefined) {
            tool.apistruct.flag|=DataFlags.RECALC_CACHE;
            return tool.apistruct;
        }
        tool.apistruct = g_app_state.toolstack.gen_tool_datastruct(tool);
        tool.apistruct.flag|=DataFlags.RECALC_CACHE;
        return tool.apistruct;
      }, function getLength(api, list) {
        return g_app_state.toolstack.undostack.length;
      }]);
      FullContextStruct.struct("spline", "spline", "undefined", api.mapStruct(Spline, true));
      FullContextStruct.struct("datalib", "datalib", "undefined", api.mapStruct(DataLib, true));
      FullContextStruct.struct("opseditor", "opseditor", "undefined", api.mapStruct(OpStackEditor, true));
      FullContextStruct.dynamicStruct("toolmode", "active_tool", "undefined", api.mapStruct(SplineToolMode, true));
    }
    var View2DHandlerStruct=api.mapStruct(View2DHandler, true);
    function api_define_View2DHandler(api) {
      View2DHandlerStruct.float("propradius", "propradius", "Magnet Radius").range(0.1, 1024).step(0.5).expRate(1.75).decimalPlaces(2);
      View2DHandlerStruct.bool("edit_all_layers", "edit_all_layers", "Edit All Layers").on("change", function (old) {
        return (function () {
          redraw_viewport();
        }).call(this.dataref, old);
      });
      View2DHandlerStruct.bool("half_pix_size", "half_pix_size", "half_pix_size").icon(Icons.HALF_PIXEL_SIZE);
      View2DHandlerStruct.color4("background_color", "background_color", "Background").on("change", function (old) {
        return (function () {
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
      View2DHandlerStruct.color4("default_stroke", "default_stroke", "Stroke");
      View2DHandlerStruct.color4("default_fill", "default_fill", "Fill");
      View2DHandlerStruct.enum("toolmode", "toolmode", ToolModes, "Active Tool").uiNames({SELECT: "Select", 
     APPEND: "Append", 
     RESIZE: "Resize", 
     ROTATE: "Rotate", 
     PEN: "Pen"}).descriptions({SELECT: "Select", 
     APPEND: "Append", 
     RESIZE: "Resize", 
     ROTATE: "Rotate", 
     PEN: "Pen"}).icons({SELECT: Icons.CURSOR_ARROW, 
     APPEND: Icons.APPEND_VERTEX, 
     RESIZE: Icons.RESIZE, 
     ROTATE: Icons.ROTATE, 
     PEN: Icons.PEN_TOOL});
      View2DHandlerStruct.bool("draw_small_verts", "draw_small_verts", "Small Points").icon(Icons.DRAW_SMALL_VERTS);
      View2DHandlerStruct.enum("selectmode", "selectmode", {VERTEX: SelMask.VERTEX, 
     SEGMENT: SelMask.SEGMENT, 
     FACE: SelMask.FACE, 
     OBJECT: SelMask.OBJECT}, "Selection Mode").uiNames({VERTEX: "Vertex", 
     SEGMENT: "Segment", 
     FACE: "Face", 
     OBJECT: "Object"}).descriptions({VERTEX: "Vertex", 
     SEGMENT: "Segment", 
     FACE: "Face", 
     OBJECT: "Object"}).icons({VERTEX: Icons.VERT_MODE, 
     SEGMENT: Icons.EDGE_MODE, 
     FACE: Icons.FACE_MODE, 
     OBJECT: Icons.OBJECT_MODE, 
     HANDLE: Icons.SHOW_HANDLES}).customGetSet(function () {
        return this.ctx.scene.selectmode;
      }, function (val) {
        let scene=this.ctx.scene;
        console.log("selmask_enum.userSetData", scene, val);
        scene.selectmode = val|(scene.selectmode&SelMask.HANDLE);
      });
      View2DHandlerStruct.bool("draw_stroke_debug", "draw_stroke_debug", "Stroke Debug").on('change', function () {
        this.ctx.spline.regen_sort();
        this.ctx.spline.regen_render();
        window.redraw_viewport();
      });
      View2DHandlerStruct.flags("selectmode", "selectmask", SelMask, "[object Object]").uiNames({VERTEX: "Vertex", 
     HANDLE: "Handle", 
     SEGMENT: "Segment", 
     FACE: "Face", 
     TOPOLOGY: "Topology", 
     OBJECT: "Object"}).descriptions({VERTEX: "Vertex", 
     HANDLE: "Handle", 
     SEGMENT: "Segment", 
     FACE: "Face", 
     TOPOLOGY: "Topology", 
     OBJECT: "Object"}).icons({1: Icons.VERT_MODE, 
     2: Icons.SHOW_HANDLES, 
     4: Icons.EDGE_MODE, 
     16: Icons.FACE_MODE, 
     32: Icons.OBJECT_MODE, 
     VERTEX: Icons.VERT_MODE, 
     HANDLE: Icons.SHOW_HANDLES, 
     SEGMENT: Icons.EDGE_MODE, 
     FACE: Icons.FACE_MODE, 
     OBJECT: Icons.OBJECT_MODE}).on("change", function (old) {
        return (function () {
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
      View2DHandlerStruct.bool("only_render", "only_render", "Hide Controls").icon(Icons.ONLY_RENDER);
      View2DHandlerStruct.bool("draw_bg_image", "draw_bg_image", "Draw Image").on("change", function (old) {
        return (function () {
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
      View2DHandlerStruct.flags("session_flag", "session_flag", SessionFlags, "Session Flags").uiNames({PROP_TRANSFORM: "Prop Transform"}).descriptions({PROP_TRANSFORM: "Prop Transform"}).icons({1: Icons.PROP_TRANSFORM, 
     PROP_TRANSFORM: Icons.PROP_TRANSFORM});
      View2DHandlerStruct.bool("tweak_mode", "tweak_mode", "Tweak Mode").icon(Icons.CURSOR_ARROW);
      View2DHandlerStruct.bool("enable_blur", "enable_blur", "Blur").on("change", function (old) {
        return (function () {
          this.ctx.spline.regen_sort();
          redraw_viewport();
        }).call(this.dataref, old);
      }).icon(Icons.ENABLE_BLUR);
      View2DHandlerStruct.bool("draw_faces", "draw_faces", "Show Faces").on("change", function (old) {
        return (function () {
          this.ctx.spline.regen_sort();
          redraw_viewport();
        }).call(this.dataref, old);
      }).icon(Icons.MAKE_POLYGON);
      View2DHandlerStruct.bool("draw_video", "draw_video", "Draw Video").on("change", function (old) {
        return (function () {
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
      View2DHandlerStruct.bool("draw_normals", "draw_normals", "Show Normals").on("change", function (old) {
        return (function () {
          redraw_viewport();
        }).call(this.dataref, old);
      }).icon(Icons.DRAW_NORMALS);
      View2DHandlerStruct.bool("draw_anim_paths", "draw_anim_paths", "Show Animation Paths").icon(Icons.SHOW_ANIMPATHS);
      View2DHandlerStruct.float("zoom", "zoom", "Zoom").range(0.1, 100).uiRange(0.1, 100).step(0.1).expRate(1.2).decimalPlaces(3).customGetSet(function () {
        if (!this.dataref) {
            return 0;
        }
        return this.dataref.zoom;
      }, function (val) {
        if (this.dataref) {
            this.dataref.set_zoom(val);
        }
      });
      View2DHandlerStruct.struct("active_material", "active_material", "undefined", api.mapStruct(Material, true));
      View2DHandlerStruct.float("default_linewidth", "default_linewidth", "Line Wid").range(0.01, 100).step(0.1).expRate(1.33).decimalPlaces(4);
      View2DHandlerStruct.enum("extrude_mode", "extrude_mode", ExtrudeModes, "New Line Mode").uiNames({SMOOTH: "Smooth", 
     LESS_SMOOTH: "Less Smooth", 
     BROKEN: "Broken"}).descriptions({SMOOTH: "New Line Mode", 
     LESS_SMOOTH: "New Line Mode", 
     BROKEN: "New Line Mode"}).icons({SMOOTH: Icons.EXTRUDE_MODE_G2, 
     LESS_SMOOTH: Icons.EXTRUDE_MODE_G1, 
     BROKEN: Icons.EXTRUDE_MODE_G0});
      View2DHandlerStruct.bool("pin_paths", "pin_paths", "Pin Paths");
      View2DHandlerStruct.struct("background_image", "background_image", "undefined", api.mapStruct(ImageUser, true));
    }
    var MaterialStruct=api.mapStruct(Material, true);
    function api_define_Material(api) {
      MaterialStruct.color4("fillcolor", "fillcolor", "fill").on("change", function (old) {
        this.dataref.update();
        window.redraw_viewport();
      });
      MaterialStruct.float("linewidth", "linewidth", "linewidth").range(0.1, 2500).step(0.25).expRate(1.75).decimalPlaces(4).on("change", function (old) {
        this.dataref.update();
        window.redraw_viewport();
      });
      MaterialStruct.float("linewidth2", "linewidth2", "linewidth2").step(0.25).expRate(1.75).decimalPlaces(4).on("change", function (old) {
        this.dataref.update();
        window.redraw_viewport();
      });
      MaterialStruct.flags("flag", "flag", MaterialFlags, "material flags").uiNames({SELECT: "Select", 
     MASK_TO_FACE: "Mask To Face"}).descriptions({SELECT: "Select", 
     MASK_TO_FACE: "Mask To Face"}).icons(DataTypes).on("change", function (old) {
        this.dataref.update();
        window.redraw_viewport();
      });
      MaterialStruct.color4("strokecolor", "strokecolor", "Stroke").on("change", function (old) {
        this.dataref.update();
        window.redraw_viewport();
      });
      MaterialStruct.float("blur", "blur", "Blur").step(0.5).expRate(1.33).decimalPlaces(4).on("change", function (old) {
        this.dataref.update();
        window.redraw_viewport();
      });
      MaterialStruct.color4("strokecolor2", "strokecolor2", "Double Stroke").on("change", function (old) {
        this.dataref.update();
        window.redraw_viewport();
      });
    }
    var ImageUserStruct=api.mapStruct(ImageUser, true);
    function api_define_ImageUser(api) {
      
      ImageUserStruct.vec2("off", "off", "Offset").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4);
      ImageUserStruct.vec2("scale", "scale", "Scale").range(0.0001, 90).step(0.1).expRate(1.33).decimalPlaces(4);
    }
    var DopeSheetEditorStruct=api.mapStruct(DopeSheetEditor, true);
    function api_define_DopeSheetEditor(api) {
      DopeSheetEditorStruct.bool("selected_only", "selected_only", "Selected Only").on("change", function (old) {
        return (function (owner) {
          owner.rebuild();
        }).call(this.dataref, old);
      });
      DopeSheetEditorStruct.bool("pinned", "pinned", "Pin");
      DopeSheetEditorStruct.float("timescale", "timescale", "timescale").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4).on("change", function (old) {
        return (function (owner) {
          owner.updateKeyPositions();
        }).call(this.dataref, old);
      });
    }
    var CurveEditorStruct=api.mapStruct(CurveEditor, true);
    function api_define_CurveEditor(api) {
      CurveEditorStruct.bool("selected_only", "selected_only", "Selected Only").on("change", function (old) {
        return (function () {
          if (this.ctx!=undefined&&this.ctx.editcurve!=undefined)
            this.ctx.editcurve.do_full_recalc();
        }).call(this.dataref, old);
      });
      CurveEditorStruct.bool("pinned", "pinned", "Pin");
    }
    var SplineFrameSetStruct=api.mapStruct(SplineFrameSet, true);
    function api_define_SplineFrameSet(api) {
      SplineFrameSetStruct.list("lib_anim_idmap", "animkeys", [function getIter(api, list) {
        return new obj_value_iter(list);
      }, function get(api, list, key) {
        console.log("get key", key, list);
        return list[key];
      }, function getStruct(api, list, key) {
        return AnimKeyStruct2;
      }, function getLength(api, list) {
        var tot=0.0;
        for (var k in list) {
            tot++;
        }
        return tot;
      }]);
      SplineFrameSetStruct.struct("spline", "drawspline", "undefined", api.mapStruct(Spline, true));
      SplineFrameSetStruct.struct("pathspline", "pathspline", "undefined", api.mapStruct(Spline, true));
      SplineFrameSetStruct.list("vertex_animdata", "keypaths", [function getIter(api, list) {
        let list2=list;
        return (function* () {
          for (let k in list2) {
              yield list2[k];
          }
        })();
      }, function get(api, list, key) {
        return list[key];
      }, function getStruct(api, list, key) {
        return animdata_struct;
      }, function getLength(api, list) {
        let i=0;
        for (let k in list) {
            i++;
        }
        return i;
      }]);
      SplineFrameSetStruct.struct("active_animdata", "active_keypath", "undefined", api.mapStruct(VertexAnimData, true));
    }
    var SplineStruct=api.mapStruct(Spline, true);
    function api_define_Spline(api) {
      SplineStruct.list("lib_anim_idmap", "animkeys", [function getIter(api, list) {
        return new obj_value_iter(list);
      }, function get(api, list, key) {
        console.log("get key", key, list);
        return list[key];
      }, function getStruct(api, list, key) {
        return AnimKeyStruct2;
      }, function getLength(api, list) {
        var tot=0.0;
        for (var k in list) {
            tot++;
        }
        return tot;
      }]);
      SplineStruct.struct("faces.active", "active_face", "undefined", api.mapStruct(SplineFace, true));
      SplineStruct.struct("segments.active", "active_segment", "undefined", api.mapStruct(SplineSegment, true));
      SplineStruct.struct("verts.active", "active_vertex", "undefined", api.mapStruct(SplineVertex, true));
      SplineStruct.list("faces", "faces", [function getIter(api, list) {
        return list[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getActive(api, list) {
        return list.active;
      }, function getStruct(api, list, key) {
        return SplineFaceStruct;
      }, function getLength(api, list) {
        return list.length;
      }]);
      SplineStruct.list("segments", "segments", [function getIter(api, list) {
        return list[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineSegmentStruct;
      }, function getActive(api, list) {
        return list.active;
      }, function getLength(api, list) {
        return list.length;
      }, function getKey(api, list, obj) {
        return obj.eid;
      }]);
      SplineStruct.list("verts", "verts", [function getIter(api, list) {
        return list[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineVertexStruct;
      }, function getActive(api, list) {
        return list.active;
      }, function getKey(api, list, obj) {
        return obj.eid;
      }, function getLength(api, list) {
        return list.length;
      }]);
      SplineStruct.list("handles", "handles", [function getIter(api, list) {
        return list[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getActive(api, list) {
        return list.active;
      }, function getStruct(api, list, key) {
        return SplineVertexStruct;
      }, function getKey(api, list, obj) {
        return obj.eid;
      }, function getLength(api, list) {
        return list.length;
      }]);
      SplineStruct.list("faces", "editable_faces", [function getIter(api, list) {
        return list.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getActive(api, list) {
        return list.active;
      }, function getStruct(api, list, key) {
        return SplineFaceStruct;
      }, function getKey(api, list, obj) {
        return obj.eid;
      }, function getLength(api, list) {
        let len=0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      }]);
      SplineStruct.list("segments", "editable_segments", [function getIter(api, list) {
        return list.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineSegmentStruct;
      }, function getKey(api, list, obj) {
        return obj.eid;
      }, function getLength(api, list) {
        let len=0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      }]);
      SplineStruct.list("verts", "editable_verts", [function getIter(api, list) {
        return list.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineVertexStruct;
      }, function getKey(api, list, obj) {
        return obj.eid;
      }, function getLength(api, list) {
        let len=0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      }]);
      SplineStruct.list("handles", "editable_handles", [function getIter(api, list) {
        return list.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineVertexStruct;
      }, function getKey(api, list, obj) {
        return obj.eid;
      }, function getLength(api, list) {
        let len=0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      }]);
      SplineStruct.list("faces", "selected_facese", [function getIter(api, list) {
        return list.selected.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineFaceStruct;
      }, function getKey(api, list, obj) {
        return obj.eid;
      }, function getLength(api, list) {
        let len=0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      }]);
      SplineStruct.list("segments", "selected_segments", [function getIter(api, list) {
        return list.selected.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineSegmentStruct;
      }, function getKey(api, list, obj) {
        return obj.eid;
      }, function getLength(api, list) {
        let len=0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      }]);
      SplineStruct.list("verts", "selected_verts", [function getIter(api, list) {
        return list.selected.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineVertexStruct;
      }, function getKey(api, list, obj) {
        return obj.eid;
      }, function getLength(api, list) {
        let len=0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      }]);
      SplineStruct.list("handles", "selected_handles", [function getIter(api, list) {
        return list.selected.editable(g_app_state.ctx)[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.local_idmap[key];
      }, function getStruct(api, list, key) {
        return SplineVertexStruct;
      }, function getKey(api, list, obj) {
        return obj.eid;
      }, function getLength(api, list) {
        let len=0;
        for (let e of list.selected.editable(g_app_state.ctx)) {
            len++;
        }
        return len;
      }]);
      SplineStruct.list("layerset", "layerset", [function getIter(api, list) {
        return list[Symbol.iterator]();
      }, function get(api, list, key) {
        return list.idmap[key];
      }, function getStruct(api, list, key) {
        return SplineLayerStruct;
      }, function getKey(api, list, obj) {
        return obj.id;
      }, function getLength(api, list) {
        return list.length;
      }]);
      SplineStruct.struct("layerset.active", "active_layer", "undefined", api.mapStruct(SplineLayer, true));
    }
    var SplineFaceStruct=api.mapStruct(SplineFace, true);
    function api_define_SplineFace(api) {
      SplineFaceStruct.int("eid", "eid", "eid").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
      SplineFaceStruct.struct("mat", "mat", "undefined", api.mapStruct(Material, true));
      SplineFaceStruct.flags("flag", "flag", SplineFlags, "Flags").uiNames({SELECT: "Select", 
     BREAK_TANGENTS: "Break Tangents", 
     USE_HANDLES: "Use Handles", 
     UPDATE: "Update", 
     TEMP_TAG: "Temp Tag", 
     BREAK_CURVATURES: "Break Curvatures", 
     HIDE: "Hide", 
     FRAME_DIRTY: "Frame Dirty", 
     PINNED: "Pinned", 
     NO_RENDER: "No Render", 
     AUTO_PAIRED_HANDLE: "Auto Paired Handle", 
     UPDATE_AABB: "Update Aabb", 
     DRAW_TEMP: "Draw Temp", 
     GHOST: "Ghost", 
     UI_SELECT: "Ui Select", 
     FIXED_KS: "Fixed Ks", 
     REDRAW_PRE: "Redraw Pre", 
     REDRAW: "Redraw", 
     COINCIDENT: "Coincident"}).descriptions({SELECT: "Select", 
     BREAK_TANGENTS: "Break Tangents", 
     USE_HANDLES: "Use Handles", 
     UPDATE: "Update", 
     TEMP_TAG: "Temp Tag", 
     BREAK_CURVATURES: "Allows curve to more tightly bend at this point", 
     HIDE: "Hide", 
     FRAME_DIRTY: "Frame Dirty", 
     PINNED: "Pinned", 
     NO_RENDER: "No Render", 
     AUTO_PAIRED_HANDLE: "Auto Paired Handle", 
     UPDATE_AABB: "Update Aabb", 
     DRAW_TEMP: "Draw Temp", 
     GHOST: "Ghost", 
     UI_SELECT: "Ui Select", 
     FIXED_KS: "Fixed Ks", 
     REDRAW_PRE: "Redraw Pre", 
     REDRAW: "Redraw", 
     COINCIDENT: "Coincident"}).icons({2: Icons.EXTRUDE_MODE_G0, 
     32: Icons.EXTRUDE_MODE_G1, 
     BREAK_TANGENTS: Icons.EXTRUDE_MODE_G0, 
     BREAK_CURVATURES: Icons.EXTRUDE_MODE_G1});
    }
    var SplineSegmentStruct=api.mapStruct(SplineSegment, true);
    function api_define_SplineSegment(api) {
      SplineSegmentStruct.bool("editable", "editable", "Element is visible and can be edited").customGet(function () {
        let seg=this.dataref;
        let ctx=window.g_app_state.ctx;
        let ok=seg.flag&SplineFlags.SELECT;
        ok = ok&&!(seg.flag&SplineFlags.HIDE);
        if (!ok) {
            return false;
        }
        if (!ctx.edit_all_layers) {
            let spline=ctx.spline;
            ok = ok&&spline.layerset.active.id in seg.layers;
        }
        return ok;
      });
      let segment_update=function () {
        let segment=this.dataref;
        segment.mat.update();
        segment.flag|=SplineFlags.REDRAW;
        segment.v1.flag|=SplineFlags.REDRAW;
        segment.v2.flag|=SplineFlags.REDRAW;
        g_app_state.ctx.spline.regen_sort();
        window.redraw_viewport();
      }
      SplineSegmentStruct.float("w1", "w1", "w1").range(0.001, 10000).noUnits().step(0.1).expRate(1.33).decimalPlaces(4).on("change", segment_update);
      SplineSegmentStruct.float("w2", "w2", "w2").range(0.001, 10000).noUnits().step(0.1).expRate(1.33).decimalPlaces(4).on("change", segment_update);
      SplineSegmentStruct.float("shift1", "shift1", "shift1").range(-100, 100).noUnits().step(0.1).expRate(1.33).decimalPlaces(4).on("change", segment_update);
      SplineSegmentStruct.float("shift2", "shift2", "shift2").range(-100, 100).noUnits().step(0.1).expRate(1.33).decimalPlaces(4).on("change", segment_update);
      SplineSegmentStruct.int("eid", "eid", "eid").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
      SplineSegmentStruct.flags("flag", "flag", SplineFlags, "Flags").uiNames({SELECT: "Select", 
     BREAK_TANGENTS: "Break Tangents", 
     USE_HANDLES: "Use Handles", 
     UPDATE: "Update", 
     TEMP_TAG: "Temp Tag", 
     BREAK_CURVATURES: "Break Curvatures", 
     HIDE: "Hide", 
     FRAME_DIRTY: "Frame Dirty", 
     PINNED: "Pinned", 
     NO_RENDER: "No Render", 
     AUTO_PAIRED_HANDLE: "Auto Paired Handle", 
     UPDATE_AABB: "Update Aabb", 
     DRAW_TEMP: "Draw Temp", 
     GHOST: "Ghost", 
     UI_SELECT: "Ui Select", 
     FIXED_KS: "Fixed Ks", 
     REDRAW_PRE: "Redraw Pre", 
     REDRAW: "Redraw", 
     COINCIDENT: "Coincident"}).descriptions({SELECT: "Select", 
     BREAK_TANGENTS: "Break Tangents", 
     USE_HANDLES: "Use Handles", 
     UPDATE: "Update", 
     TEMP_TAG: "Temp Tag", 
     BREAK_CURVATURES: "Allows curve to more tightly bend at this point", 
     HIDE: "Hide", 
     FRAME_DIRTY: "Frame Dirty", 
     PINNED: "Pinned", 
     NO_RENDER: "No Render", 
     AUTO_PAIRED_HANDLE: "Auto Paired Handle", 
     UPDATE_AABB: "Update Aabb", 
     DRAW_TEMP: "Draw Temp", 
     GHOST: "Ghost", 
     UI_SELECT: "Ui Select", 
     FIXED_KS: "Fixed Ks", 
     REDRAW_PRE: "Redraw Pre", 
     REDRAW: "Redraw", 
     COINCIDENT: "Coincident"}).icons({2: Icons.EXTRUDE_MODE_G0, 
     32: Icons.EXTRUDE_MODE_G1, 
     BREAK_TANGENTS: Icons.EXTRUDE_MODE_G0, 
     BREAK_CURVATURES: Icons.EXTRUDE_MODE_G1}).on("change", function (old) {
        let segment=this.dataref;
        segment.flag|=SplineFlags.REDRAW;
        this.ctx.spline.regen_sort();
        window.redraw_viewport();
      });
      SplineSegmentStruct.bool("renderable", "renderable", "renderable");
      SplineSegmentStruct.struct("mat", "mat", "undefined", api.mapStruct(Material, true));
      SplineSegmentStruct.float("z", "z", "z").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4);
    }
    var SplineVertexStruct=api.mapStruct(SplineVertex, true);
    function api_define_SplineVertex(api) {
      SplineVertexStruct.int("eid", "eid", "eid").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
      SplineVertexStruct.flags("flag", "flag", SplineFlags, "Flags").uiNames({SELECT: "Select", 
     BREAK_TANGENTS: "Break Tangents", 
     USE_HANDLES: "Use Handles", 
     UPDATE: "Update", 
     TEMP_TAG: "Temp Tag", 
     BREAK_CURVATURES: "Break Curvatures", 
     HIDE: "Hide", 
     FRAME_DIRTY: "Frame Dirty", 
     PINNED: "Pinned", 
     NO_RENDER: "No Render", 
     AUTO_PAIRED_HANDLE: "Auto Paired Handle", 
     UPDATE_AABB: "Update Aabb", 
     DRAW_TEMP: "Draw Temp", 
     GHOST: "Ghost", 
     UI_SELECT: "Ui Select", 
     FIXED_KS: "Fixed Ks", 
     REDRAW_PRE: "Redraw Pre", 
     REDRAW: "Redraw", 
     COINCIDENT: "Coincident"}).descriptions({SELECT: "Select", 
     BREAK_TANGENTS: "Break Tangents", 
     USE_HANDLES: "Use Handles", 
     UPDATE: "Update", 
     TEMP_TAG: "Temp Tag", 
     BREAK_CURVATURES: "Allows curve to more tightly bend at this point", 
     HIDE: "Hide", 
     FRAME_DIRTY: "Frame Dirty", 
     PINNED: "Pinned", 
     NO_RENDER: "No Render", 
     AUTO_PAIRED_HANDLE: "Auto Paired Handle", 
     UPDATE_AABB: "Update Aabb", 
     DRAW_TEMP: "Draw Temp", 
     GHOST: "Ghost", 
     UI_SELECT: "Ui Select", 
     FIXED_KS: "Fixed Ks", 
     REDRAW_PRE: "Redraw Pre", 
     REDRAW: "Redraw", 
     COINCIDENT: "Coincident"}).icons({2: Icons.EXTRUDE_MODE_G0, 
     32: Icons.EXTRUDE_MODE_G1, 
     BREAK_TANGENTS: Icons.EXTRUDE_MODE_G0, 
     BREAK_CURVATURES: Icons.EXTRUDE_MODE_G1}).on("change", function (old) {
        this.ctx.spline.regen_sort();
        if (this.dataref!==undefined) {
            this.dataref.flag|=SplineFlags.UPDATE;
        }
        this.ctx.spline.resolve = 1;
        window.redraw_viewport();
      });
      SplineVertexStruct.vec3("", "co", "Co").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4);
      SplineVertexStruct.float("width", "width", "width").range(-50, 200).step(0.1).expRate(1.33).decimalPlaces(4).on("change", function (old) {
        this.dataref.flag|=SplineFlags.REDRAW;
        window.redraw_viewport();
      });
      SplineVertexStruct.float("shift", "shift", "shift").range(-5, 5).noUnits().step(0.1).expRate(1.33).decimalPlaces(4).on("change", function (old) {
        this.dataref.flag|=SplineFlags.REDRAW;
        window.redraw_viewport();
      });
    }
    var SplineLayerStruct=api.mapStruct(SplineLayer, true);
    function api_define_SplineLayer(api) {
      SplineLayerStruct.int("id", "id", "id").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
      
      SplineLayerStruct.flags("flag", "flag", SplineLayerFlags, "flag").uiNames({8: "Mask To Prev", 
     HIDE: "Hide", 
     CAN_SELECT: "Can Select", 
     MASK: "Mask"}).descriptions({MASK: "Use previous layer as a mask"}).icons(DataTypes).on("change", function (old) {
        return (function () {
          window.redraw_viewport();
        }).call(this.dataref, old);
      });
    }
    var VertexAnimDataStruct=api.mapStruct(VertexAnimData, true);
    function api_define_VertexAnimData(api) {
      VertexAnimDataStruct.flags("animflag", "animflag", VDAnimFlags, "animflag").uiNames({SELECT: "Select", 
     STEP_FUNC: "Step Func", 
     HIDE: "Hide", 
     OWNER_IS_EDITABLE: "Owner Is Editable"}).descriptions({SELECT: "Select", 
     STEP_FUNC: "Step Func", 
     HIDE: "Hide", 
     OWNER_IS_EDITABLE: "Owner Is Editable"}).icons(DataTypes);
      VertexAnimDataStruct.int("eid", "owning_vertex", "Owning Vertex").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
    }
    var SettingsEditorStruct=api.mapStruct(SettingsEditor, true);
    function api_define_SettingsEditor(api) {
    }
    var AppSettingsStruct=api.mapStruct(AppSettings, true);
    function api_define_AppSettings(api) {
      AppSettingsStruct.enum("unit_scheme", "unit_system", {imperial: "imperial", 
     metric: "metric"}, "System").uiNames({imperial: "Imperial", 
     metric: "Metric"}).descriptions({imperial: "Imperial", 
     metric: "Metric"}).icons(DataTypes).on("change", function (old) {
        return (function () {
          g_app_state.session.settings.save();
        }).call(this.dataref, old);
      });
      AppSettingsStruct.enum("unit", "default_unit", {cm: "cm", 
     "in": "in", 
     ft: "ft", 
     m: "m", 
     mm: "mm", 
     km: "km", 
     mile: "mile"}, "Default Unit").descriptions({cm: "Cm", 
     "in": "In", 
     ft: "Ft", 
     m: "M", 
     mm: "Mm", 
     km: "Km", 
     mile: "Mile"}).icons(DataTypes).on("change", function (old) {
        return (function () {
          g_app_state.session.settings.save();
        }).call(this.dataref, old);
      });
    }
    var SceneObjectStruct=api.mapStruct(SceneObject, true);
    function api_define_SceneObject(api) {
      
      SceneObjectStruct.vec3("ctx_bb", "ctx_bb", "Dimensions").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33).decimalPlaces(4).on("change", function (old) {
        if (this.ctx.mesh!==undefined)
          this.ctx.mesh.regen_render();
        if (this.ctx.view2d!==undefined&&this.ctx.view2d.selectmode&EditModes.GEOMETRY) {
            this.ctx.object.dag_update();
        }
      });
    }
    var SceneStruct=api.mapStruct(Scene, true);
    function api_define_Scene(api) {
      SceneStruct.list("lib_anim_idmap", "animkeys", [function getIter(api, list) {
        return new obj_value_iter(list);
      }, function get(api, list, key) {
        console.log("get key", key, list);
        return list[key];
      }, function getStruct(api, list, key) {
        return AnimKeyStruct2;
      }, function getLength(api, list) {
        var tot=0.0;
        for (var k in list) {
            tot++;
        }
        return tot;
      }]);
      
      SceneStruct.int("time", "frame", "Frame").range(1, 10000).step(1).expRate(1.5).on("change", function (old) {
        let time=this.dataref.time;
        this.dataref.time = old;
        this.dataref.change_time(g_app_state.ctx, time);
        window.redraw_viewport();
      });
      SceneStruct.list("objects", "objects", [function getIter(api, list) {
        return new obj_value_iter(list.object_idmap);
      }, function get(api, list, key) {
        console.log("get key", key, list);
        return list.object_idmap[key];
      }, function getStruct(api, list, key) {
        return SceneObjectStruct;
      }, function getLength(api, list) {
        return list.objects.length;
      }]);
      SceneStruct.struct("objects.active", "active_object", "undefined", api.mapStruct(SceneObject, true));
    }
    var AppStateStruct=api.mapStruct(AppState, true);
    function api_define_AppState(api) {
      AppStateStruct.bool("select_multiple", "select_multiple", "Multiple");
      AppStateStruct.bool("select_inverse", "select_inverse", "Deselect");
    }
    var DataLibStruct=api.mapStruct(DataLib, true);
    function api_define_DataLib(api) {
      DataLibStruct.struct("datalists.items[6]", "spline", "undefined", undefined);
      DataLibStruct.struct("datalists.items[7]", "frameset", "undefined", api.mapStruct(DataList, true));
      DataLibStruct.struct("datalists.items[9]", "object", "undefined", api.mapStruct(DataList, true));
      DataLibStruct.struct("datalists.items[13]", "collection", "undefined", api.mapStruct(DataList, true));
      DataLibStruct.struct("datalists.items[5]", "scene", "undefined", api.mapStruct(DataList, true));
      DataLibStruct.struct("datalists.items[8]", "image", "undefined", undefined);
    }
    var DataListStruct=api.mapStruct(DataList, true);
    function api_define_DataList(api) {
      
      DataListStruct.int("typeid", "typeid", "typeid").range(-100000000000000000, 100000000000000000).step(0.1).expRate(1.33);
      DataListStruct.list("idmap", "items", [function getIter(api, list) {
        let ret=[];
        for (var k in list) {
            ret.push(list[k]);
        }
        return ret[Symbol.iterator]();
      }, function get(api, list, key) {
        return list[key];
      }, function getStruct(api, list, key) {
        return datablock_structs[item.lib_type];
      }, function getLength(api, list) {
        let count=0;
        for (let k in list) {
            count++;
        }
        return count;
      }]);
    }
    var OpStackEditorStruct=api.mapStruct(OpStackEditor, true);
    function api_define_OpStackEditor(api) {
      OpStackEditorStruct.bool("filter_sel", "filter_sel", "Filter Sel").icon(Icons.FILTER_SEL_OPS);
    }
    var SplineToolModeStruct=api.mapStruct(SplineToolMode, true);
    function api_define_SplineToolMode(api) {
      
    }
    api_define_FullContext(api);
    api_define_View2DHandler(api);
    api_define_Material(api);
    api_define_ImageUser(api);
    api_define_DopeSheetEditor(api);
    api_define_CurveEditor(api);
    api_define_SplineFrameSet(api);
    api_define_Spline(api);
    api_define_SplineFace(api);
    api_define_SplineSegment(api);
    api_define_SplineVertex(api);
    api_define_SplineLayer(api);
    api_define_VertexAnimData(api);
    api_define_SettingsEditor(api);
    api_define_AppSettings(api);
    api_define_SceneObject(api);
    api_define_Scene(api);
    api_define_AppState(api);
    api_define_DataLib(api);
    api_define_DataList(api);
    api_define_OpStackEditor(api);
    api_define_SplineToolMode(api);
    initToolModeAPI(api);
    api.rootContextStruct = FullContextStruct;
    FullContextStruct.struct("last_tool", "last_tool");
    buildToolSysAPI(api, true, FullContextStruct);
    return api;
  }
  makeAPI = _es6_module.add_export('makeAPI', makeAPI);
}, '/dev/fairmotion/src/core/data_api/data_api_new.js');


es6_module_define('data_api_base', ["../../path.ux/scripts/controller/controller.js"], function _data_api_base_module(_es6_module) {
  var DataPathTypes={PROP: 0, 
   STRUCT: 1, 
   STRUCT_ARRAY: 2}
  DataPathTypes = _es6_module.add_export('DataPathTypes', DataPathTypes);
  var DataFlags={NO_CACHE: 1, 
   RECALC_CACHE: 2}
  DataFlags = _es6_module.add_export('DataFlags', DataFlags);
  var DataPathError=es6_import_item(_es6_module, '../../path.ux/scripts/controller/controller.js', 'DataPathError');
  let DataAPIError=DataPathError;
  DataAPIError = _es6_module.add_export('DataAPIError', DataAPIError);
  window.DataAPIError = DataAPIError;
}, '/dev/fairmotion/src/core/data_api/data_api_base.js');


es6_module_define('data_api_pathux', ["../../path.ux/scripts/path-controller/controller.js", "../../editors/events.js", "../../path.ux/scripts/util/simple_events.js", "./data_api_base.js", "../../path.ux/scripts/core/ui_base.js", "../toolprops.js", "../toolops_api.js", "../../editors/editor_base.js"], function _data_api_pathux_module(_es6_module) {
  var ModelInterface=es6_import_item(_es6_module, '../../path.ux/scripts/path-controller/controller.js', 'ModelInterface');
  var DataPathError=es6_import_item(_es6_module, '../../path.ux/scripts/path-controller/controller.js', 'DataPathError');
  var ToolOpAbstract=es6_import_item(_es6_module, '../toolops_api.js', 'ToolOpAbstract');
  var ToolOp=es6_import_item(_es6_module, '../toolops_api.js', 'ToolOp');
  var ToolMacro=es6_import_item(_es6_module, '../toolops_api.js', 'ToolMacro');
  var ToolProperty=es6_import_item(_es6_module, '../toolprops.js', 'ToolProperty');
  var PropTypes=es6_import_item(_es6_module, '../toolprops.js', 'PropTypes');
  var toolmap={}
  toolmap = _es6_module.add_export('toolmap', toolmap);
  var toollist=[];
  toollist = _es6_module.add_export('toollist', toollist);
  var DataPathTypes=es6_import_item(_es6_module, './data_api_base.js', 'DataPathTypes');
  var DataAPIError=es6_import_item(_es6_module, './data_api_base.js', 'DataAPIError');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var Editor=es6_import_item(_es6_module, '../../editors/editor_base.js', 'Editor');
  var ToolKeyHandler=es6_import_item(_es6_module, '../../editors/events.js', 'ToolKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../../path.ux/scripts/util/simple_events.js', 'HotKey');
  let resolvepath_rets=new cachering(() =>    {
    return {parent: undefined, 
    obj: undefined, 
    key: undefined, 
    subkey: undefined, 
    value: undefined, 
    prop: undefined, 
    struct: undefined, 
    mass_set: undefined}
  }, 32);
  function register_toolops() {
    function isTool(t) {
      if (t.tooldef===undefined||!t.hasOwnProperty("tooldef")||t.tooldef===ToolOp.tooldef)
        return false;
      if (!t.tooldef().toolpath) {
          return false;
      }
      if (t===ToolOpAbstract||t===ToolOp||t===ToolMacro)
        return false;
      let p=t, lastp;
      while (p&&p.prototype&&p.prototype.__proto__&&p!==lastp) {
        lastp = p;
        p = p.prototype.__proto__.constructor;
        if (p!==undefined&&p===ToolOpAbstract)
          return true;
      }
      return false;
    }
    for (let cls of defined_classes) {
        if (!isTool(cls))
          continue;
        let def=cls.tooldef();
        if (def.apiname===undefined) {
        }
        if (def.apiname)
          toolmap[def.apiname] = cls;
        if (def.toolpath)
          toolmap[def.toolpath] = cls;
        toollist.push(cls);
        ToolOp.register(cls);
    }
  }
  register_toolops = _es6_module.add_export('register_toolops', register_toolops);
  class PathUXInterface extends ModelInterface {
    
     constructor(api, ctx=undefined) {
      super();
      this.prefix = "";
      this.api = api;
      this.ctx = ctx;
    }
     _getToolHotkey(screen, toolstring) {
      if (!screen) {
          return "";
      }
      let ctx=this.ctx;
      let ret;
      function processKeymap(keymap) {
        for (let k of keymap) {
            let v=keymap.get(k);
            if (__instance_of(v, ToolKeyHandler)&&v.tool===toolstring) {
                let ws=k.split("-");
                let s="";
                let i=0;
                for (let w of ws) {
                    w = w[0].toUpperCase()+w.slice(1, w.length).toLowerCase();
                    if (i>0) {
                        s+=" + ";
                    }
                    s+=w;
                    i++;
                }
                return s;
            }
            else 
              if (__instance_of(v, HotKey)&&v.action===toolstring) {
                return v.buildString();
            }
            else 
              if (__instance_of(k, HotKey)&&k.action===toolstring) {
                return k.buildString();
            }
        }
      }
      for (let sarea of screen.sareas) {
          for (let keymap of sarea.area.getKeyMaps()) {
              ret = processKeymap(keymap);
              if (ret) {
                  return ret;
              }
          }
      }
      if (ret===undefined&&screen.keymap!==undefined) {
          ret = processKeymap(screen.keymap);
      }
      return ret;
    }
     setContext(ctx) {
      this.ctx = ctx;
    }
     getObject(ctx, path) {
      return this.api.get_object(ctx, path);
    }
     getToolDef(path) {
      let uiname=undefined;
      let hotkey=undefined;
      if (path.search(/\)\|/)>0) {
          path = path.split("|");
          uiname = path[1].trim();
          if (path.length>1) {
              hotkey = path[2].trim();
          }
          path = path[0].trim();
      }
      let ret=this.api.get_opclass(this.ctx, path);
      if (ret===undefined) {
          throw new DataAPIError("bad toolop path", path);
      }
      ret = ret.tooldef();
      ret = Object.assign({}, ret);
      ret.hotkey = hotkey ? hotkey : this._getToolHotkey(this.ctx.screen, path);
      ret.uiname = uiname ? uiname : ret.uiname;
      return ret;
    }
     getToolPathHotkey(ctx, path) {
      return this.getToolDef(path).hotkey;
    }
     buildMassSetPaths(ctx, listpath, subpath, value, filterstr) {
      return this.api.build_mass_set_paths(ctx, listpath, subpath, value, filterstr);
    }
     resolveMassSetPaths(ctx, mass_set_path) {
      if (!ctx||!mass_set_path||typeof mass_set_path!=="string") {
          throw new Error("invalid call to resolveMassSetPaths");
      }
      let path=mass_set_path.trim();
      let filter, listpath, subpath;
      let start=path.search("{");
      if (start<0) {
          throw new Error("invalid mass set path in resolveMassSetPaths "+path);
      }
      let end=path.slice(start, path.end).search("}")+start;
      if (end<0) {
          throw new Error("invalid mass set path in resolveMassSetPaths "+path);
      }
      filter = path.slice(start+1, end).trim();
      listpath = path.slice(0, start).trim();
      subpath = path.slice(end+2, path.length).trim();
      return this.api.build_mass_set_paths(ctx, listpath, subpath, undefined, filter);
    }
     massSetProp(ctx, mass_set_path, value) {
      let path=mass_set_path;
      let i1=path.search(/\{/);
      let i2=path.search(/\}/);
      let filterpath=path.slice(i1+1, i2);
      let listpath=path.slice(0, i1);
      let subpath=path.slice(i2+2, path.length);
      return this.api.mass_set_prop(ctx, listpath, subpath, value, filterpath);
    }
     on_frame_change(ctx, newtime) {
      return this.api.on_frame_change(ctx, newtime);
    }
     onFrameChange(ctx, newtime) {
      return this.api.on_frame_change(ctx, newtime);
    }
     createTool(ctx, path, inputs={}, constructor_argument=undefined) {
      let tool=this.api.get_op(this.ctx, path);
      for (let k in inputs) {
          if (!(k in tool.inputs)) {
              console.warn("Unknown input", k, "for tool", tool);
              continue;
          }
          let v=inputs[k];
          if (__instance_of(v, ToolProperty)) {
              v = v.data;
          }
          tool.inputs[k].setValue(v);
      }
      return tool;
    }
     setAnimPathKey(ctx, owner, path, time) {
      return this.api.key_animpath(ctx, owner, path, time);
    }
     getObject(ctx, path) {
      return this.api.get_object(ctx, path);
    }
     parseToolPath(path) {
      return this.api.get_opclass(this.ctx, path);
    }
     execTool(ctx, path_or_toolop, inputs={}, constructor_argument=undefined) {
      return new Promise((accept, reject) =>        {
        let tool;
        if (typeof path_or_toolop=="object") {
            tool = path_or_toolop;
        }
        else {
          try {
            tool = this.createTool(ctx, path_or_toolop, inputs, constructor_argument);
          }
          catch (error) {
              print_stack(error);
              reject(error);
              return ;
          }
        }
        accept(tool);
        try {
          g_app_state.toolstack.execTool(ctx, tool);
        }
        catch (error) {
            console.warn("Error executing tool");
            print_stack(error);
        }
      });
    }
    static  toolRegistered(cls) {
      return cls.tooldef().apiname in toolmap;
    }
    static  registerTool(cls) {
      let tdef=cls.tooldef();
      if (tdef.apiname in toolmap) {
          console.log(cls);
          console.warn(tdef+" is already registered");
          return ;
      }
      toolmap[tdef.apiname] = cls;
      toollist.push(cls);
    }
     resolvePath(ctx, path) {
      let rp=this.api.resolve_path_intern(ctx, path);
      if (rp===undefined||rp[0]===undefined) {
          return undefined;
      }
      let ret=resolvepath_rets.next();
      try {
        ret.value = this.api.get_prop(ctx, path);
      }
      catch (error) {
          if (__instance_of(error, DataAPIError)) {
              ret.value = undefined;
          }
          else {
            throw error;
          }
      }
      ret.mass_set = rp[3];
      ret.key = rp[0].path;
      ret.subkey = undefined;
      ret.parent = undefined;
      ret.obj = undefined;
      ret.prop = undefined;
      ret.struct = undefined;
      if (rp[4]) {
          try {
            ret.obj = this.api.evaluate(this.ctx, rp[4]);
          }
          catch (error) {
              if (__instance_of(error, DataAPIError)) {
                  ret.obj = undefined;
              }
              else {
                throw error;
              }
          }
      }
      if (rp[0].type===DataPathTypes.PROP) {
          ret.prop = rp[0].data;
      }
      else 
        if (rp[0].type===DataPathTypes.STRUCT) {
          ret.struct = rp[0].data;
      }
      let found=0;
      if (ret.prop!==undefined&&ret.prop.type&(PropTypes.FLAG|PropTypes.ENUM)) {
          let prop=ret.prop;
          let p=path.trim();
          if (p.match(/\]$/)&&p.search(/\[/)>=0) {
              let i=p.length-1;
              while (p[i]!=="[") {
                i--;
              }
              let key=p.slice(i+1, p.length-1);
              if (key in prop.values) {
                  key = prop.values[key];
                  found = 1;
              }
              else {
                for (let k in prop.values) {
                    if (prop.values[k]===key) {
                        found = 1;
                    }
                    else 
                      if (prop.values[k]===parseInt(key)) {
                        key = parseInt(key);
                        found = 1;
                    }
                }
              }
              if (!found) {
                  throw new DataPathError(path+": Unknown enum/flag key: "+key);
              }
              else {
                ret.subkey = key;
              }
          }
      }
      if (!found&&ret.prop!==undefined&&ret.prop.type===PropTypes.FLAG) {
          let s=""+rp[1];
          if (s.search(/\&/)>=0) {
              let i=s.search(/\&/);
              s = parseInt(s.slice(i+1, s.length).trim());
          }
          ret.subkey = parseInt(s);
          for (let k in ret.prop.keys) {
              if (ret.prop.keys[k]==ret.subkey) {
                  ret.subkey = k;
                  break;
              }
          }
      }
      return ret;
    }
     setValue(ctx, path, val) {
      return this.api.set_prop(ctx, path, val);
    }
     getValue(ctx, path) {
      return this.api.get_prop(ctx, path);
    }
  }
  _ESClass.register(PathUXInterface);
  _es6_module.add_class(PathUXInterface);
  PathUXInterface = _es6_module.add_export('PathUXInterface', PathUXInterface);
}, '/dev/fairmotion/src/core/data_api/data_api_pathux.js');


var data_ops_list;
es6_module_define('data_api_opdefine', ["../../editors/dopesheet/dopesheet_ops_new.js", "../../editors/viewport/view2d.js", "../../../platforms/Electron/theplatform.js", "../../editors/viewport/transform.js", "../../editors/viewport/view2d_ops.js", "../../editors/viewport/transdata.js", "../../editors/viewport/transform_spline.js", "./data_api_pathux.js", "../../image/image_ops.js", "../../editors/viewport/view2d_spline_ops.js", "../../editors/viewport/spline_selectops.js", "../../editors/viewport/view2d_editor.js", "../../editors/viewport/spline_layerops.js", "../../path.ux/scripts/screen/FrameManager.js", "../../editors/viewport/spline_editops.js", "../../editors/viewport/spline_createops.js", "../../path.ux/scripts/screen/FrameManager_ops.js", "../../editors/viewport/spline_animops.js", "../safe_eval.js", "../toolops_api.js"], function _data_api_opdefine_module(_es6_module) {
  var LoadImageOp=es6_import_item(_es6_module, '../../image/image_ops.js', 'LoadImageOp');
  var DeleteVertOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteSegmentOp');
  var DeleteFaceOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteFaceOp');
  var ChangeFaceZ=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ChangeFaceZ');
  var SplitEdgeOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplitEdgeOp');
  var DuplicateOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DuplicateOp');
  var DisconnectHandlesOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DisconnectHandlesOp');
  var SplitEdgePickOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplitEdgePickOp');
  var DeleteKeysOp=es6_import_item(_es6_module, '../../editors/dopesheet/dopesheet_ops_new.js', 'DeleteKeysOp');
  var ToolOp=es6_import_item(_es6_module, '../toolops_api.js', 'ToolOp');
  var ToolMacro=es6_import_item(_es6_module, '../toolops_api.js', 'ToolMacro');
  var ToolFlags=es6_import_item(_es6_module, '../toolops_api.js', 'ToolFlags');
  var UndoFlags=es6_import_item(_es6_module, '../toolops_api.js', 'UndoFlags');
  var EditModes=es6_import_item(_es6_module, '../../editors/viewport/view2d.js', 'EditModes');
  var transform=es6_import(_es6_module, '../../editors/viewport/transform.js');
  var spline_selectops=es6_import(_es6_module, '../../editors/viewport/spline_selectops.js');
  var spline_createops=es6_import(_es6_module, '../../editors/viewport/spline_createops.js');
  var spline_editops=es6_import(_es6_module, '../../editors/viewport/spline_editops.js');
  var spline_animops=es6_import(_es6_module, '../../editors/viewport/spline_animops.js');
  var spline_layerops=es6_import(_es6_module, '../../editors/viewport/spline_layerops.js');
  var FrameManager=es6_import(_es6_module, '../../path.ux/scripts/screen/FrameManager.js');
  var FrameManager_ops=es6_import(_es6_module, '../../path.ux/scripts/screen/FrameManager_ops.js');
  var safe_eval=es6_import(_es6_module, '../safe_eval.js');
  var TransformOp=es6_import_item(_es6_module, '../../editors/viewport/transform.js', 'TransformOp');
  var TranslateOp=es6_import_item(_es6_module, '../../editors/viewport/transform.js', 'TranslateOp');
  var ScaleOp=es6_import_item(_es6_module, '../../editors/viewport/transform.js', 'ScaleOp');
  var RotateOp=es6_import_item(_es6_module, '../../editors/viewport/transform.js', 'RotateOp');
  var TransSplineVert=es6_import_item(_es6_module, '../../editors/viewport/transform_spline.js', 'TransSplineVert');
  var TransData=es6_import_item(_es6_module, '../../editors/viewport/transdata.js', 'TransData');
  var SelectOpBase=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'SelectOpBase');
  var SelectOneOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'SelectOneOp');
  var ToggleSelectAllOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'ToggleSelectAllOp');
  var SelectLinkedOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'SelectLinkedOp');
  var HideOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'HideOp');
  var UnhideOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'UnhideOp');
  var CircleSelectOp=es6_import_item(_es6_module, '../../editors/viewport/spline_selectops.js', 'CircleSelectOp');
  var ExtrudeModes=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ExtrudeModes');
  var ExtrudeVertOp=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ExtrudeVertOp');
  var CreateEdgeOp=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'CreateEdgeOp');
  var CreateEdgeFaceOp=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'CreateEdgeFaceOp');
  var ImportJSONOp=es6_import_item(_es6_module, '../../editors/viewport/spline_createops.js', 'ImportJSONOp');
  var KeyCurrentFrame=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'KeyCurrentFrame');
  var ShiftLayerOrderOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ShiftLayerOrderOp');
  var SplineGlobalToolOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplineGlobalToolOp');
  var SplineLocalToolOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplineLocalToolOp');
  var KeyEdgesOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'KeyEdgesOp');
  var CopyPoseOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'CopyPoseOp');
  var PastePoseOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'PastePoseOp');
  var InterpStepModeOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'InterpStepModeOp');
  var DeleteVertOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteSegmentOp');
  var DeleteFaceOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DeleteFaceOp');
  var ChangeFaceZ=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ChangeFaceZ');
  var DissolveVertOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DissolveVertOp');
  var SplitEdgeOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplitEdgeOp');
  var VertPropertyBaseOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'VertPropertyBaseOp');
  var ToggleBreakTanOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ToggleBreakTanOp');
  var ToggleBreakCurvOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ToggleBreakCurvOp');
  var ConnectHandlesOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ConnectHandlesOp');
  var DisconnectHandlesOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DisconnectHandlesOp');
  var ToggleManualHandlesOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ToggleManualHandlesOp');
  var ShiftTimeOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'ShiftTimeOp');
  var DuplicateOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'DuplicateOp');
  var SplineMirrorOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplineMirrorOp');
  var AddLayerOp=es6_import_item(_es6_module, '../../editors/viewport/spline_layerops.js', 'AddLayerOp');
  var ChangeLayerOp=es6_import_item(_es6_module, '../../editors/viewport/spline_layerops.js', 'ChangeLayerOp');
  var ChangeElementLayerOp=es6_import_item(_es6_module, '../../editors/viewport/spline_layerops.js', 'ChangeElementLayerOp');
  var RenderAnimOp=es6_import_item(_es6_module, '../../editors/viewport/view2d_spline_ops.js', 'RenderAnimOp');
  var PlayAnimOp=es6_import_item(_es6_module, '../../editors/viewport/view2d_spline_ops.js', 'PlayAnimOp');
  var SessionFlags=es6_import_item(_es6_module, '../../editors/viewport/view2d_editor.js', 'SessionFlags');
  var ExportCanvasImage=es6_import_item(_es6_module, '../../editors/viewport/view2d_ops.js', 'ExportCanvasImage');
  var theplatform=es6_import(_es6_module, '../../../platforms/Electron/theplatform.js');
  var SplitEdgePickOp=es6_import_item(_es6_module, '../../editors/viewport/spline_editops.js', 'SplitEdgePickOp');
  class QuitFileOp extends ToolOp {
    static  tooldef() {
      return {uiname: "Quit", 
     toolpath: "appstate.quit", 
     is_modal: true, 
     inputs: {}, 
     outputs: {}, 
     undoflag: UndoFlags.NO_UNDO}
    }
     start_modal(ctx) {
      super.start_modal(ctx);
      this.end_modal(ctx);
      theplatform.app.quitApp();
    }
  }
  _ESClass.register(QuitFileOp);
  _es6_module.add_class(QuitFileOp);
  data_ops_list = undefined;
  var register_toolops=es6_import_item(_es6_module, './data_api_pathux.js', 'register_toolops');
  window.api_define_ops = function () {
    window.data_ops_list = {"spline.add_layer": function (ctx, args) {
        return new AddLayerOp(args.name);
      }, 
    "spline.change_face_z": function (ctx, args) {
        if (!("offset" in args))
          throw new TinyParserError();
        return new ChangeFaceZ(parseInt(args["offset"]), parseInt(args["selmode"]));
      }, 
    "spline.toggle_break_curvature": function (ctx, args) {
        return new ToggleBreakCurvOp();
      }, 
    "spline.toggle_break_tangents": function (ctx, args) {
        return new ToggleBreakTanOp();
      }, 
    "spline.translate": function (ctx, args) {
        var op=new TranslateOp(EditModes.GEOMETRY, ctx.object);
        if ("datamode" in args) {
            op.inputs.datamode.setValue(args["datamode"]);
        }
        op.inputs.edit_all_layers.setValue(ctx.view2d.edit_all_layers);
        console.log("=====", args, ctx.view2d.session_flag, ctx.view2d.propradius);
        if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
            op.inputs.proportional.setValue(true);
            op.inputs.propradius.setValue(ctx.view2d.propradius);
        }
        return op;
      }, 
    "spline.rotate": function (ctx, args) {
        var op=new RotateOp(EditModes.GEOMETRY, ctx.object);
        if ("datamode" in args) {
            op.inputs.datamode.setValue(args["datamode"]);
        }
        op.inputs.edit_all_layers.setValue(ctx.view2d.edit_all_layers);
        if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
            op.inputs.proportional.setValue(true);
            op.inputs.propradius.setValue(ctx.view2d.propradius);
        }
        return op;
      }, 
    "spline.scale": function (ctx, args) {
        var op=new ScaleOp(EditModes.GEOMETRY, ctx.object);
        if ("datamode" in args) {
            op.inputs.datamode.setValue(args["datamode"]);
        }
        op.inputs.edit_all_layers.setValue(ctx.view2d.edit_all_layers);
        if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
            op.inputs.proportional.setValue(true);
            op.inputs.propradius.setValue(ctx.view2d.propradius);
        }
        return op;
      }, 
    "spline.key_edges": function (ctx, args) {
        return new KeyEdgesOp();
      }, 
    "view2d.export_image": function (ctx, args) {
        return new ExportCanvasImage();
      }, 
    "editor.copy_pose": function (ctx, args) {
        return new CopyPoseOp();
      }, 
    "editor.paste_pose": function (ctx, args) {
        return new PastePoseOp();
      }, 
    "spline.key_current_frame": function (ctx, args) {
        return new KeyCurrentFrame();
      }, 
    "spline.shift_time": function (ctx, args) {
        return new ShiftTimeOp();
      }, 
    "spline.delete_faces": function (ctx, args) {
        return new DeleteFaceOp();
      }, 
    "spline.toggle_manual_handles": function (ctx, args) {
        return new ToggleManualHandlesOp();
      }, 
    "spline.delete_segments": function (ctx, args) {
        return new DeleteSegmentOp();
      }, 
    "spline.delete_verts": function (ctx, args) {
        return new DeleteVertOp();
      }, 
    "spline.dissolve_verts": function (ctx, args) {
        return new DissolveVertOp();
      }, 
    "spline.make_edge": function (ctx, args) {
        return new CreateEdgeOp(ctx.view2d.default_linewidth);
      }, 
    "spline.make_edge_face": function (ctx, args) {
        return new CreateEdgeFaceOp(ctx.view2d.default_linewidth);
      }, 
    "spline.split_edges": function (ctx, args) {
        return new SplitEdgeOp();
      }, 
    "spline.split_pick_edge": function (ctx, args) {
        return new SplitEdgePickOp();
      }, 
    "spline.split_pick_edge_transform": function (ctx, args) {
        let ret=new ToolMacro("spline.split_pick_edge_transform", "Split Segment");
        let tool=new SplitEdgePickOp();
        let tool2=new TranslateOp(undefined, 1|2);
        ret.description = tool.description;
        ret.icon = tool.icon;
        ret.add_tool(tool);
        ret.add_tool(tool2);
        tool.on_modal_end = () =>          {
          let ctx=tool.modal_ctx;
          tool2.user_start_mpos = tool.mpos;
          console.log("                 on_modal_end successfully called", tool2.user_start_mpos);
        }
        return ret;
      }, 
    "spline.toggle_step_mode": function (ctx, args) {
        return new InterpStepModeOp();
      }, 
    "spline.mirror_verts": function (ctx, args) {
        return new SplineMirrorOp();
      }, 
    "spline.duplicate_transform": function (ctx, args) {
        var tool=new DuplicateOp();
        var macro=new ToolMacro("duplicate_transform", "Duplicate");
        macro.description = tool.description;
        macro.add(tool);
        macro.icon = tool.icon;
        var transop=new TranslateOp(ctx.view2d.mpos, 1|2);
        macro.add(transop);
        return macro;
      }, 
    "spline.toggle_select_all": function (ctx, args) {
        var op=new ToggleSelectAllOp();
        return op;
      }, 
    "spline.connect_handles": function (ctx, args) {
        return new ConnectHandlesOp();
      }, 
    "spline.disconnect_handles": function (ctx, args) {
        return new DisconnectHandlesOp();
      }, 
    "spline.hide": function (ctx, args) {
        return new HideOp(args.selmode, args.ghost);
      }, 
    "spline.unhide": function (ctx, args) {
        return new UnhideOp(args.selmode, args.ghost);
      }, 
    "image.load_image": function (ctx, args) {
        return new LoadImageOp(args.datapath, args.name);
      }, 
    "spline.select_linked": function (ctx, args) {
        if (!("vertex_eid" in args)) {
            throw new Error("need a vertex_eid argument");
        }
        var op=new SelectLinkedOp();
        op.inputs.vertex_eid.setValue(args.vertex_eid);
        return op;
      }, 
    "anim.delete_keys": function (ctx, args) {
        return new DeleteKeysOp();
      }, 
    "view2d.circle_select": function (ctx, args) {
        return new CircleSelectOp(ctx.view2d.selectmode);
      }, 
    "view2d.render_anim": function (Ctx, args) {
        return new RenderAnimOp();
      }, 
    "view2d.play_anim": function (Ctx, args) {
        return new PlayAnimOp();
      }, 
    "appstate.open": function (ctx, args) {
        return new FileOpenOp();
      }, 
    "appstate.open_recent": function (ctx, args) {
        return new FileOpenRecentOp();
      }, 
    "appstate.export_svg": function (ctx, args) {
        return new FileSaveSVGOp();
      }, 
    "appstate.export_al3_b64": function (ctx, args) {
        return new FileSaveB64Op();
      }, 
    "appstate.save": function (ctx, args) {
        return new FileSaveOp();
      }, 
    "appstate.save_as": function (ctx, args) {
        return new FileSaveAsOp();
      }, 
    "appstate.quit": function (ctx, args) {
        return new QuitFileOp();
      }, 
    "screen.area_split_tool": function (ctx, args) {
        return new SplitAreasTool(g_app_state.screen);
      }, 
    "screen.hint_picker": function (ctx, args) {
        return new HintPickerOp();
      }, 
    "object.toggle_select_all": function (ctx, args) {
        return new ToggleSelectObjOp("auto");
      }, 
    "object.translate": function (ctx, args) {
        return new TranslateOp(EditModes.OBJECT, ctx.object);
      }, 
    "object.rotate": function (ctx, args) {
        return new RotateOp(EditModes.OBJECT);
      }, 
    "object.scale": function (ctx, args) {
        return new ScaleOp(EditModes.OBJECT);
      }, 
    "object.duplicate": function (ctx, args) {
        return new ObjectDuplicateOp(ctx.scene.objects.selected);
      }, 
    "object.set_parent": function (ctx, args) {
        var op=new ObjectParentOp();
        op.flag|=ToolFlags.USE_DEFAULT_INPUT;
        return op;
      }, 
    "object.delete_selected": function (ctx, args) {
        var op=new ObjectDeleteOp();
        op.flag|=ToolFlags.USE_DEFAULT_INPUT;
        return op;
      }}
  }
}, '/dev/fairmotion/src/core/data_api/data_api_opdefine.js');


es6_module_define('graph', ["../path.ux/scripts/pathux.js"], function _graph_module(_es6_module) {
  let _graph=undefined;
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Matrix4');
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector4');
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  let STRUCT=nstructjs.STRUCT;
  class GraphCycleError extends Error {
  }
  _ESClass.register(GraphCycleError);
  _es6_module.add_class(GraphCycleError);
  GraphCycleError = _es6_module.add_export('GraphCycleError', GraphCycleError);
  
  const SocketTypes={INPUT: 0, 
   OUTPUT: 1}
  _es6_module.add_export('SocketTypes', SocketTypes);
  const SocketFlags={SELECT: 1, 
   UPDATE: 2, 
   MULTI: 4, 
   NO_MULTI_OUTPUTS: 8, 
   PRIVATE: 16, 
   NO_UNITS: 32, 
   INSTANCE_API_DEFINE: 64}
  _es6_module.add_export('SocketFlags', SocketFlags);
  const NodeFlags={SELECT: 1, 
   UPDATE: 2, 
   SORT_TAG: 4, 
   CYCLE_TAG: 8, 
   DISABLED: 16, 
   ZOMBIE: 32, 
   SAVE_PROXY: 64, 
   FORCE_SOCKET_INHERIT: 128, 
   FORCE_FLAG_INHERIT: 256, 
   FORCE_INHERIT: 128|256}
  _es6_module.add_export('NodeFlags', NodeFlags);
  const GraphFlags={SELECT: 1, 
   RESORT: 2, 
   CYCLIC_ALLOWED: 4, 
   CYCLIC: 8}
  _es6_module.add_export('GraphFlags', GraphFlags);
  class InheritFlag  {
     constructor(data) {
      this.data = data;
    }
  }
  _ESClass.register(InheritFlag);
  _es6_module.add_class(InheritFlag);
  
  let NodeSocketClasses=[];
  NodeSocketClasses = _es6_module.add_export('NodeSocketClasses', NodeSocketClasses);
  class NodeSocketType  {
     constructor(uiname=undefined, flag=0) {
      if (uiname===undefined) {
          uiname = this.constructor.nodedef().uiname;
      }
      this.uiname = uiname;
      this.name = this.constructor.nodedef().name;
      let def=this.constructor.nodedef();
      if (def.graph_flag!==undefined) {
          flag|=def.graph_flag;
      }
      if (!def.name||typeof def.name!=="string") {
          throw new Error("nodedef must have a .name member");
      }
      this.socketName = undefined;
      this.socketType = undefined;
      this.edges = [];
      this._node = undefined;
      this.graph_flag = flag;
      this.graph_id = -1;
    }
    static  _api_uiname() {
      return this.dataref.uiname;
    }
     graphDataLink(ownerBlock, getblock, getblock_addUser) {

    }
     onFileLoad(templateInstance) {
      this.graph_flag|=templateInstance.graph_flag;
    }
     needInstanceAPI() {
      this.graph_flag|=SocketFlags.INSTANCE_API_DEFINE;
      return this;
    }
     noUnits() {
      this.graph_flag|=SocketFlags.NO_UNITS;
      return this;
    }
     setAndUpdate(val, updateParentNode=false) {
      this.setValue(val);
      this.graphUpdate(updateParentNode);
      return this;
    }
    static  apiDefine(api, sockstruct) {

    }
     has(node_or_socket) {
      for (let socket of this.edges) {
          if (socket===node_or_socket)
            return true;
          if (socket.node===node_or_socket)
            return true;
      }
      return false;
    }
     buildUI(container, onchange) {
      if (this.edges.length===0) {
          let ret=container.prop("value");
          if (ret) {
              ret.setAttribute("name", this.uiname);
              ret.onchange = onchange;
          }
          else {
            container.label(this.uiname);
          }
      }
      else {
        container.label(this.uiname);
      }
    }
    static  register(cls) {
      NodeSocketClasses.push(cls);
    }
     copyValue() {
      throw new Error("implement me");
    }
     cmpValue(b) {
      throw new Error("implement me");
    }
     diffValue(b) {
      throw new Error("implement me");
    }
     connect(sock) {
      if (this.edges.indexOf(sock)>=0) {
          console.warn("Already have socket connected");
          return ;
      }
      for (let s of this.edges) {
          if (s.node===sock.node&&s.name===sock.name) {
              console.warn("Possible duplicate socket add", s, sock);
          }
      }
      this.edges.push(sock);
      sock.edges.push(this);
      if (!sock.node) {
          console.warn("graph corruption");
      }
      else {
        sock.node.graphUpdate();
      }
      if (!this.node) {
          console.warn("graph corruption");
      }
      else {
        this.node.graphUpdate();
        this.node.graph_graph.flagResort();
      }
      return this;
    }
     disconnect(sock) {
      if (sock===undefined) {
          let _i=0;
          while (this.edges.length>0) {
            if (_i++>10000) {
                console.warn("infinite loop detected in graph code");
                break;
            }
            this.disconnect(this.edges[0]);
          }
          return ;
      }
      this.edges.remove(sock, true);
      sock.edges.remove(this, true);
      this.node.graphUpdate();
      sock.node.graphUpdate();
      this.node.graph_graph.flagResort();
      return this;
    }
    static  nodedef() {
      return {name: "name", 
     uiname: "uiname", 
     color: undefined, 
     flag: 0}
    }
     getValue() {
      throw new Error("implement me!");
    }
     setValue(val) {
      throw new Error("implement me!");
    }
     copyTo(b) {
      b.graph_flag = this.graph_flag;
      b.name = this.name;
      b.uiname = this.uiname;
      b.socketName = this.socketName;
      return this;
    }
    get  hasEdges() {
      return this.edges.length>0;
    }
     immediateUpdate() {
      this.graphUpdate();
      if (this.edges.length>0) {
          window.updateDataGraph(true);
      }
    }
     update() {
      console.warn("NodeSocketType.prototype.update() is deprecated; use .graphUpdate instead");
      return this.graphUpdate();
    }
     graphUpdate(updateParentNode=false, _exclude=undefined) {
      if (this.graph_id===-1) {
          console.warn("graphUpdate called on non-node", this);
          return ;
      }
      if (this===_exclude)
        return ;
      this.graph_flag|=NodeFlags.UPDATE;
      if (updateParentNode) {
          this.node.graphUpdate();
      }
      window.updateDataGraph();
      for (let sock of this.edges) {
          sock.setValue(this.getValue());
          if (sock.node)
            sock.node.graphUpdate();
      }
      return this;
    }
     copy() {
      let ret=new this.constructor();
      this.copyTo(ret);
      ret.graph_flag = this.graph_flag;
      return ret;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(NodeSocketType);
  _es6_module.add_class(NodeSocketType);
  NodeSocketType = _es6_module.add_export('NodeSocketType', NodeSocketType);
  NodeSocketType.STRUCT = `
graph.NodeSocketType {
  graph_id   : int;
  node       : int | obj.node !== undefined ? obj.node.graph_id : -1;
  edges      : array(e, int) | e.graph_id;
  uiname     : string;
  name       : string;
  socketName : string;
  graph_flag : int;
  socketType : int;
}
`;
  nstructjs.manager.add_class(NodeSocketType);
  class KeyValPair  {
     constructor(key, val) {
      this.key = key;
      this.val = val;
    }
  }
  _ESClass.register(KeyValPair);
  _es6_module.add_class(KeyValPair);
  KeyValPair = _es6_module.add_export('KeyValPair', KeyValPair);
  KeyValPair.STRUCT = `
graph.KeyValPair {
  key : string;
  val : abstract(Object);
}
`;
  nstructjs.manager.add_class(KeyValPair);
  function mixinGraphNode(parent, structName) {
    if (structName===undefined) {
        structName = parent.constructor.name+"GraphNode";
    }
    class GraphNode  {
      
      
      
      
      
      
      
       constructor(flag=0) {
        let def=this.constructor.nodedef();
        if (!def.name||typeof def.name!=="string") {
            throw new Error("nodedef must have a .name member");
        }
        let graph_uiname=def.uiname||def.name;
        this.graph_uiname = graph_uiname;
        this.graph_name = def.name;
        this.graph_ui_pos = new Vector2();
        this.graph_ui_size = new Vector2([235, 200]);
        this.graph_ui_flag = 0;
        this.graph_id = -1;
        this.graph_graph = undefined;
        let getflag=() =>          {
          let inherit=typeof def.flag==="object"&&def.flag!==null&&__instance_of(def.flag, InheritFlag);
          let p=this.constructor;
          let def2=def;
          while (p!==null&&p!==undefined&&p!==Object&&p!==Node) {
            if (p.nodedef) {
                def2 = p.nodedef();
                inherit = inherit||(def2.flag&NodeFlags.FORCE_FLAG_INHERIT);
            }
            p = p.prototype.__proto__.constructor;
          }
          if (inherit) {
              let flag=def.flag!==undefined ? def.flag : 0;
              let p=this.constructor;
              while (p!==null&&p!==undefined&&p!==Object&&p!==Node) {
                if (p.nodedef) {
                    def2 = p.nodedef();
                    if (def2.flag) {
                        flag|=def2.flag;
                    }
                }
                p = p.prototype.__proto__.constructor;
              }
              return flag;
          }
          else {
            return def.flag===undefined ? 0 : def.flag;
          }
        };
        this.graph_flag = flag|getflag()|NodeFlags.UPDATE;
        let getsocks=(key) =>          {
          let obj=def[key];
          let ret={}
          let inherit=__instance_of(obj, InheritFlag);
          inherit = inherit||(flag&NodeFlags.FORCE_SOCKET_INHERIT);
          let p=this.constructor;
          while (p!==null&&p!==undefined&&p!==Object&&p!==Node) {
            if (p.nodedef) {
                let def=p.nodedef();
                inherit = inherit||(def.flag&NodeFlags.FORCE_SOCKET_INHERIT);
            }
            p = p.prototype.__proto__.constructor;
          }
          if (inherit) {
              let p=this.constructor;
              while (p!==null&&p!==undefined&&p!==Object&&p!==Node) {
                if (p.nodedef===undefined)
                  continue;
                let obj2=p.nodedef()[key];
                if (__instance_of(obj2, InheritFlag)) {
                    obj2 = obj2.data;
                }
                if (obj2!==undefined) {
                    for (let k in obj2) {
                        let sock2=obj2[k];
                        if (__instance_of(sock2, InheritFlag)) {
                            sock2 = sock2.data;
                        }
                        if (!(k in ret)) {
                            ret[k] = sock2.copy();
                        }
                    }
                }
                p = p.prototype.__proto__.constructor;
              }
          }
          else 
            if (obj!==undefined) {
              for (let k in obj) {
                  ret[k] = obj[k].copy();
              }
          }
          for (let k in ret) {
              ret[k].node = this;
          }
          return ret;
        };
        this.inputs = getsocks("inputs");
        this.outputs = getsocks("outputs");
        for (let sock of this.allsockets) {
            sock.node = this;
        }
        for (let i=0; i<2; i++) {
            let socks=i ? this.outputs : this.inputs;
            for (let k in socks) {
                let sock=socks[k];
                sock.socketType = i ? SocketTypes.OUTPUT : SocketTypes.INPUT;
                sock.node = this;
                sock.name = sock.name!==undefined ? sock.name : k;
                sock.socketName = k;
                if (sock.uiname===undefined||sock.uiname===sock.constructor.nodedef().uiname) {
                    sock.uiname = k;
                }
            }
        }
        for (let k in this.outputs) {
            let sock=this.outputs[k];
            if (!(sock.graph_flag&SocketFlags.NO_MULTI_OUTPUTS)) {
                sock.graph_flag|=SocketFlags.MULTI;
            }
        }
        this.icon = -1;
      }
      static  isGraphNode(ob) {
        if (!ob||typeof ob!=="object") {
            return false;
        }
        return ob.constructor.isGraphNode!==undefined;
      }
      static  defineAPI(nodeStruct) {

      }
      static  getFinalNodeDef() {
        let def=this.nodedef();
        let def2=Object.assign({}, def);
        let getsocks=(key) =>          {
          let obj=def[key];
          let ret={}
          if (__instance_of(obj, InheritFlag)) {
              let p=this;
              while (p!==null&&p!==undefined&&p!==Object&&p!==Node) {
                if (p.nodedef===undefined)
                  continue;
                let obj2=p.nodedef()[key];
                let inherit=obj2&&__instance_of(obj2, InheritFlag);
                if (inherit) {
                    obj2 = obj2.data;
                }
                if (obj2) {
                    for (let k in obj2) {
                        if (!(k in ret)) {
                            ret[k] = obj2[k];
                        }
                    }
                }
                if (!inherit) {
                    break;
                }
                p = p.prototype.__proto__.constructor;
              }
          }
          else 
            if (obj!==undefined) {
              for (let k in obj) {
                  ret[k] = obj[k];
              }
          }
          return ret;
        };
        def2.inputs = getsocks("inputs");
        def2.outputs = getsocks("outputs");
        return def2;
      }
      static  nodedef() {
        return {name: "name", 
      uiname: "uiname", 
      flag: 0, 
      inputs: {}, 
      outputs: {}}
      }
      static  inherit(obj={}) {
        return new InheritFlag(obj);
      }
       graphDataLink(ownerBlock, getblock, getblock_addUser) {

      }
      get  allsockets() {
        let this2=this;
        return (function* () {
          for (let k in this2.inputs) {
              yield this2.inputs[k];
          }
          for (let k in this2.outputs) {
              yield this2.outputs[k];
          }
        })();
      }
       copyTo(b) {
        b.graph_name = this.graph_name;
        b.uiname = this.uiname;
        b.icon = this.icon;
        b.graph_flag = this.graph_flag;
        for (let i=0; i<2; i++) {
            let sockets1=i ? this.outputs : this.inputs;
            let sockets2=i ? b.outputs : b.inputs;
            for (let k in sockets1) {
                let sock1=sockets1[k];
                if (!k in sockets2) {
                    sockets2[k] = sock1.copy();
                }
                let sock2=sockets2[k];
                sock2.node = b;
                sock2.setValue(sock1.getValue());
            }
        }
      }
       copy() {
        let ret=new this.constructor();
        this.copyTo(ret);
        return ret;
      }
       exec(state) {
        for (let k in this.outputs) {
            this.outputs[k].graphUpdate();
        }
      }
       update() {
        this.graphUpdate();
        console.warn("deprecated call to graph.GraphNode.prototype.update(); use graphUpdate instead");
        return this;
      }
       graphUpdate() {
        this.graph_flag|=NodeFlags.UPDATE;
        return this;
      }
       afterSTRUCT() {

      }
       loadSTRUCT(reader) {
        reader(this);
        if (Array.isArray(this.inputs)) {
            let ins={};
            for (let pair of this.inputs) {
                ins[pair.key] = pair.val;
                pair.val.socketType = SocketTypes.INPUT;
                pair.val.socketName = pair.key;
                pair.val.node = this;
            }
            this.inputs = ins;
        }
        if (Array.isArray(this.outputs)) {
            let outs={};
            for (let pair of this.outputs) {
                outs[pair.key] = pair.val;
                pair.val.socketType = SocketTypes.OUTPUT;
                pair.val.socketName = pair.key;
                pair.val.node = this;
            }
            this.outputs = outs;
        }
        let def=this.constructor.getFinalNodeDef();
        for (let i=0; i<2; i++) {
            let socks1=i ? this.outputs : this.inputs;
            let socks2=i ? def.outputs : def.inputs;
            for (let k in socks2) {
                if (!(k in socks1)) {
                    socks1[k] = socks2[k].copy();
                    socks1[k].graph_id = -1;
                }
            }
            for (let k in socks1) {
                if (!(k in socks2)) {
                    continue;
                }
                let s1=socks1[k];
                let s2=socks2[k];
                if (s1.constructor!==s2.constructor) {
                    console.warn("==========================Node patch!", s1, s2);
                    if ((__instance_of(s2, s1.constructor))||(__instance_of(s1, s2.constructor))) {
                        console.log("Inheritance");
                        s2 = s2.copy();
                        s1.copyTo(s2);
                        s2.edges = s1.edges;
                        s2.node = this;
                        s2.graph_id = s1.graph_id;
                        socks1[k] = s2;
                    }
                }
                socks1[k].node = this;
            }
        }
        for (let i=0; i<2; i++) {
            let socks1=i ? this.outputs : this.inputs;
            let socks2=i ? def.outputs : def.inputs;
            for (let k in socks1) {
                let sock=socks1[k];
                if (!sock.socketName) {
                    sock.socketName = k;
                }
                if (!(k in socks2)) {
                    continue;
                }
                sock.onFileLoad(socks2[k]);
            }
        }
        return this;
      }
       graphDisplayName() {
        return this.constructor.name+this.graph_id;
      }
       _save_map(map) {
        let ret=[];
        for (let k in map) {
            ret.push(new KeyValPair(k, map[k]));
        }
        return ret;
      }
    }
    _ESClass.register(GraphNode);
    _es6_module.add_class(GraphNode);
    GraphNode.STRUCT = `
graph.${structName} {
  graph_name    : string;
  graph_uiname  : string;
  graph_id      : int;
  graph_flag    : int;
  inputs        : array(graph.KeyValPair) | obj._save_map(obj.inputs);
  outputs       : array(graph.KeyValPair) | obj._save_map(obj.outputs);
  graph_ui_pos  : vec2;
  graph_ui_size : vec2;
  graph_ui_flag : int;
}
`;
    nstructjs.register(GraphNode);
    return GraphNode;
  }
  mixinGraphNode = _es6_module.add_export('mixinGraphNode', mixinGraphNode);
  const GraphNode=mixinGraphNode(Object);
  _es6_module.add_export('GraphNode', GraphNode);
  class ProxyNode extends GraphNode {
     constructor() {
      super();
      this.className = "";
    }
     nodedef() {
      return {inputs: {}, 
     outputs: {}, 
     flag: NodeFlags.SAVE_PROXY}
    }
    static  fromNode(node) {
      let ret=new ProxyNode();
      ret.graph_id = node.graph_id;
      for (let i=0; i<2; i++) {
          let socks1=i ? node.outputs : node.inputs;
          let socks2=i ? ret.outputs : ret.inputs;
          for (let k in socks1) {
              let s1=socks1[k];
              let s2=s1.copy();
              s2.graph_id = s1.graph_id;
              for (let e of s1.edges) {
                  s2.edges.push(e);
              }
              socks2[k] = s2;
              s2.node = ret;
          }
      }
      return ret;
    }
  }
  _ESClass.register(ProxyNode);
  _es6_module.add_class(ProxyNode);
  ProxyNode = _es6_module.add_export('ProxyNode', ProxyNode);
  ProxyNode.STRUCT = STRUCT.inherit(ProxyNode, GraphNode, "graph.ProxyNode")+`
  className : string; 
}
`;
  nstructjs.manager.add_class(ProxyNode);
  class CallbackNode extends GraphNode {
     constructor() {
      super();
      this.callback = undefined;
      this.graph_flag|=NodeFlags.ZOMBIE;
    }
     exec(ctx) {
      if (this.callback!==undefined) {
          this.callback(ctx, this);
      }
    }
     graphDisplayName() {
      return this.constructor.name+"("+this.name+")"+this.graph_id;
    }
    static  nodedef() {
      return {name: "callback node", 
     inputs: {}, 
     outputs: {}, 
     flag: NodeFlags.ZOMBIE}
    }
    static  create(name, callback, inputs={}, outputs={}) {
      let ret=new CallbackNode();
      ret.name = name;
      ret.callback = callback;
      ret.inputs = inputs;
      ret.outputs = outputs;
      for (let k in inputs) {
          ret.inputs[k].node = this;
      }
      for (let k in outputs) {
          ret.outputs[k].node = this;
      }
      return ret;
    }
  }
  _ESClass.register(CallbackNode);
  _es6_module.add_class(CallbackNode);
  CallbackNode = _es6_module.add_export('CallbackNode', CallbackNode);
  CallbackNode.STRUCT = STRUCT.inherit(CallbackNode, Node, "graph.CallbackNode")+`
}
`;
  nstructjs.manager.add_class(CallbackNode);
  class GraphNodes extends Array {
     constructor(graph, list) {
      super();
      this.graph = graph;
      if (list!==undefined) {
          for (let l of list) {
              this.push(l);
          }
      }
      this.active = undefined;
      this.highlight = undefined;
    }
     setSelect(node, state) {
      if (state) {
          node.graph_flag|=GraphFlags.SELECT;
      }
      else {
        node.graph_flag&=~GraphFlags.SELECT;
      }
    }
    get  selected() {
      let this2=this;
      let ret=function* () {
        for (let node of this2.graph.nodes) {
            if (node.graph_flag&NodeFlags.SELECT) {
                yield node;
            }
        }
      };
      ret = ret();
      ret.editable = ret;
      return ret;
    }
     pushToFront(node) {
      let i=this.indexOf(node);
      if (i<0) {
          throw new Error("node not in list");
      }
      if (this.length===1) {
          return ;
      }
      while (i>0) {
        this[i] = this[i-1];
        i--;
      }
      this[0] = node;
      return this;
    }
  }
  _ESClass.register(GraphNodes);
  _es6_module.add_class(GraphNodes);
  GraphNodes = _es6_module.add_export('GraphNodes', GraphNodes);
  class Graph  {
     constructor() {
      this.updateGen = Math.random();
      this.onFlagResort = undefined;
      this.nodes = new GraphNodes(this);
      this.sortlist = [];
      this.graph_flag = 0;
      this.max_cycle_steps = 64;
      this.cycle_stop_threshold = 0.0005;
      this.graph_idgen = new util.IDGen();
      this.node_idmap = {};
      this.sock_idmap = {};
    }
     clear() {
      let nodes=this.nodes.concat([]);
      for (let n of nodes) {
          this.remove(n);
      }
      return this;
    }
     load(graph) {
      this.graph_idgen = graph.graph_idgen;
      this.node_idmap = graph.node_idmap;
      this.sock_idmap = graph.sock_idmap;
      this.graph_flag = graph.graph_flag;
      this.sortlist = graph.sortlist;
      this.nodes = graph.nodes;
      this.max_cycle_steps = graph.max_cycle_steps;
      this.cycle_stop_threshold = graph.cycle_stop_threshold;
      return this;
    }
     signalUI() {
      this.updateGen = Math.random();
    }
     flagResort() {
      if (this.onFlagResort) {
          this.onFlagResort(this);
      }
      this.graph_flag|=GraphFlags.RESORT;
    }
     sort() {
      let sortlist=this.sortlist;
      let nodes=this.nodes;
      this.graph_flag&=~NodeFlags.CYCLIC;
      sortlist.length = 0;
      for (let n of nodes) {
          n.graph_flag&=~(NodeFlags.SORT_TAG|NodeFlags.CYCLE_TAG);
      }
      let dosort=(n) =>        {
        if (n.graph_flag&NodeFlags.CYCLE_TAG) {
            console.warn("Warning: graph cycle detected!");
            this.graph_flag|=GraphFlags.CYCLIC;
            n.graph_flag&=~NodeFlags.CYCLE_TAG;
            return ;
        }
        if (n.graph_flag&NodeFlags.SORT_TAG) {
            return ;
        }
        n.graph_flag|=NodeFlags.SORT_TAG;
        n.graph_flag|=NodeFlags.CYCLE_TAG;
        for (let k in n.inputs) {
            let s1=n.inputs[k];
            for (let s2 of s1.edges) {
                let n2=s2.node;
                if (!(n2.graph_flag&NodeFlags.SORT_TAG)) {
                    dosort(n2);
                }
            }
        }
        sortlist.push(n);
        n.graph_flag&=~NodeFlags.CYCLE_TAG;
      };
      for (let n of nodes) {
          dosort(n);
      }
      let cyclesearch=(n) =>        {
        if (n.graph_flag&NodeFlags.CYCLE_TAG) {
            console.warn("Warning: graph cycle detected!");
            this.graph_flag|=GraphFlags.CYCLIC;
            return true;
        }
        for (let k in n.outputs) {
            let s1=n.outputs[k];
            n.graph_flag|=NodeFlags.CYCLE_TAG;
            for (let s2 of s1.edges) {
                if (s2.node===undefined) {
                    console.warn("Dependency graph corruption detected", s1, s2, n);
                    continue;
                }
                let ret=cyclesearch(s2.node);
                if (ret) {
                    n.graph_flag&=~NodeFlags.CYCLE_TAG;
                    return ret;
                }
            }
            n.graph_flag&=~NodeFlags.CYCLE_TAG;
        }
      };
      for (let n of this.nodes) {
          if (cyclesearch(n))
            break;
      }
      this.graph_flag&=~GraphFlags.RESORT;
    }
     _cyclic_step(context) {
      let sortlist=this.sortlist;
      for (let n of sortlist) {
          if (n.graph_flag&NodeFlags.DISABLED) {
              continue;
          }
          if (!(n.graph_flag&NodeFlags.UPDATE)) {
              continue;
          }
          n.graph_flag&=~NodeFlags.UPDATE;
          n.exec(context);
      }
      let change=0.0;
      for (let n of sortlist) {
          if (n.graph_flag&NodeFlags.DISABLED) {
              continue;
          }
          if (!(n.graph_flag&NodeFlags.UPDATE)) {
              continue;
          }
          for (let sock of n.allsockets) {
              let diff=Math.abs(sock.diffValue(sock._old));
              if (isNaN(diff)) {
                  console.warn("Got NaN from a socket's diffValue method!", sock);
                  continue;
              }
              change+=diff;
              sock._old = sock.copyValue();
          }
      }
      return change;
    }
     _cyclic_exec(context) {
      let sortlist=this.sortlist;
      for (let n of sortlist) {
          if (n.graph_flag&NodeFlags.DISABLED) {
              continue;
          }
          for (let sock of n.allsockets) {
              sock._old = sock.copyValue();
          }
      }
      for (let i=0; i<this.max_cycle_steps; i++) {
          let limit=this.cycle_stop_threshold;
          let change=this._cyclic_step(context);
          if (Math.abs(change)<limit) {
              break;
          }
      }
    }
     exec(context, force_single_solve=false) {
      if (this.graph_flag&GraphFlags.RESORT) {
          console.log("resorting graph");
          this.sort();
      }
      if ((this.graph_flag&GraphFlags.CYCLIC)&&!(this.graph_flag&GraphFlags.CYCLIC_ALLOWED)) {
          throw new Error("cycles in graph now allowed");
      }
      else 
        if (!force_single_solve&&(this.graph_flag&GraphFlags.CYCLIC)) {
          return this._cyclic_exec(context);
      }
      let sortlist=this.sortlist;
      for (let node of sortlist) {
          if (node.graph_flag&NodeFlags.DISABLED) {
              continue;
          }
          node.graph_flag&=~NodeFlags.CYCLE_TAG;
          if (node.graph_flag&NodeFlags.UPDATE) {
              node.graph_flag&=~NodeFlags.UPDATE;
              node.exec(context);
          }
      }
    }
     update() {
      console.warn("Graph.prototype.update() called; use .graphUpdate instead");
      return this.graphUpdate();
    }
     graphUpdate() {
      if (this.graph_flag&GraphFlags.RESORT) {
          console.log("resorting graph");
          this.sort();
      }
    }
     remove(node) {
      if (node.graph_id===-1) {
          console.warn("Warning, twiced to remove node not in graph (double remove?)", node.graph_id, node);
          return ;
      }
      for (let s of node.allsockets) {
          let _i=0;
          while (s.edges.length>0) {
            s.disconnect(s.edges[0]);
            if (_i++>10000) {
                console.warn("infinite loop detected");
                break;
            }
          }
          delete this.sock_idmap[s.graph_id];
      }
      delete this.node_idmap[node.graph_id];
      this.nodes.remove(node);
      node.graph_id = -1;
    }
     has(node) {
      let ok=node!==undefined;
      ok = ok&&node.graph_id!==undefined;
      ok = ok&&node===this.node_idmap[node.graph_id];
      return ok;
    }
     add(node) {
      if (node.graph_id!==-1) {
          console.warn("Warning, tried to add same node twice", node.graph_id, node);
          return ;
      }
      node.graph_graph = this;
      node.graph_id = this.graph_idgen.next();
      for (let k in node.inputs) {
          let sock=node.inputs[k];
          sock.node = node;
          sock.graph_id = this.graph_idgen.next();
          this.sock_idmap[sock.graph_id] = sock;
      }
      for (let k in node.outputs) {
          let sock=node.outputs[k];
          sock.node = node;
          sock.graph_id = this.graph_idgen.next();
          this.sock_idmap[sock.graph_id] = sock;
      }
      this.node_idmap[node.graph_id] = node;
      this.nodes.push(node);
      this.flagResort();
      node.graph_flag|=NodeFlags.UPDATE;
      return this;
    }
     dataLink(owner, getblock, getblock_addUser) {
      for (let node of this.nodes) {
          node.graphDataLink(owner, getblock, getblock_addUser);
          for (let sock of node.allsockets) {
              sock.graphDataLink(owner, getblock, getblock_addUser);
          }
      }
    }
     loadSTRUCT(reader) {
      reader(this);
      this.nodes = new GraphNodes(this, this.nodes);
      let node_idmap=this.node_idmap;
      let sock_idmap=this.sock_idmap;
      for (let n of this.nodes) {
          n.afterSTRUCT();
      }
      for (let n of this.nodes) {
          node_idmap[n.graph_id] = n;
          n.graph_graph = this;
          for (let s of n.allsockets) {
              if (s.graph_id===-1) {
                  console.warn("Found patched socket from old file; fixing.", s);
                  s.graph_id = this.graph_idgen.next();
              }
              s.node = n;
              sock_idmap[s.graph_id] = s;
          }
      }
      for (let n of this.nodes) {
          for (let s of n.allsockets) {
              for (let i=0; i<s.edges.length; i++) {
                  s.edges[i] = sock_idmap[s.edges[i]];
                  if (!s.edges[i]) {
                      let j=i;
                      while (j<s.edges.length-1) {
                        s.edges[j] = s.edges[j+1];
                        j++;
                      }
                      s.edges[s.edges.length-1] = undefined;
                      s.edges.length--;
                      i--;
                  }
              }
              sock_idmap[s.graph_id] = s;
          }
      }
      for (let node of this.nodes.slice(0, this.nodes.length)) {
          if (node.graph_flag&NodeFlags.ZOMBIE) {
              this.remove(node);
          }
      }
      for (let node of this.nodes) {
          for (let sock of node.allsockets) {
              for (let i=0; i<sock.edges.length; i++) {
                  let e=sock.edges[i];
                  if (typeof e==="number") {
                      e = this.sock_idmap[e];
                  }
                  if (!e) {
                      console.warn("pruning dead graph connection", sock);
                      sock.edges.remove(sock.edges[i]);
                      i--;
                  }
              }
          }
      }
      this.flagResort();
      return this;
    }
     relinkProxyOwner(n) {
      let ok=n!==undefined&&n.graph_id in this.node_idmap;
      ok = ok&&__instance_of(this.node_idmap[n.graph_id], ProxyNode);
      if (!ok) {
          console.warn("structural error in Graph: relinkProxyOwner was called in error", n, this.node_idmap[n.graph_id], this);
          return ;
      }
      let n2=this.node_idmap[n.graph_id];
      let node_idmap=this.node_idmap;
      let sock_idmap=this.sock_idmap;
      n.graph_graph = this;
      this.nodes.replace(n2, n);
      node_idmap[n2.graph_id] = n;
      for (let i=0; i<2; i++) {
          let socks1=i ? n.outputs : n.inputs;
          let socks2=i ? n2.outputs : n2.inputs;
          for (let k in socks2) {
              if (typeof socks2[k]==="number") {
                  socks2[k] = sock_idmap[socks2[k]];
              }
              let s1=socks1[k];
              let s2=socks2[k];
              if (s1.constructor!==s2.constructor) {
                  try {
                    s1.setValue(s2.getValue());
                  }
                  catch (error) {
                      console.warn("Failed to load data from old file "+s2.constructor.name+" to "+s1.constructor.name);
                  }
                  s1.edges = s2.edges;
                  for (let s3 of s2.edges) {
                      if (s3.edges.indexOf(s2)>=0) {
                          if (s3.edges.indexOf(s1)>=0) {
                              s3.edges.remove(s2);
                          }
                          else {
                            s3.edges.replace(s2, s1);
                          }
                      }
                  }
                  if (s1.graph_id<0) {
                      s1.graph_id = s2.graph_id;
                      sock_idmap[s1.graph_id] = s1;
                  }
                  else {
                    delete sock_idmap[s2.graph_id];
                    sock_idmap[s1.graph_id] = s1;
                  }
              }
              else {
                if (socks1[k]) {
                    socks2[k].onFileLoad(socks1[k]);
                }
                socks1[k] = s2;
                socks1[k].node = n;
              }
          }
      }
      this.flagResort();
      n.graphUpdate();
      if (window.updateDataGraph) {
          window.updateDataGraph();
      }
    }
     execSubtree(startnode, context, checkStartParents=true) {
      if (this.graph_flag&GraphFlags.RESORT) {
          console.log("resorting graph");
          this.sort();
      }
      function visit(node) {
        if (node.graph_flag&NodeFlags.CYCLE_TAG) {
            throw new GraphCycleError("Cycle error");
        }
        node.graph_flag|=NodeFlags.CYCLE_TAG;
        let found_parent=false;
        for (let k in node.inputs) {
            if (node===startnode&&!checkStartParents) {
                break;
            }
            let sock=node.inputs[k];
            for (let e of sock.edges) {
                let n=e.node;
                if (n.graph_flag&NodeFlags.UPDATE) {
                    node.graph_flag&=~NodeFlags.CYCLE_TAG;
                    visit(n);
                    found_parent = true;
                }
            }
        }
        if (found_parent) {
            return ;
        }
        if (node.graph_flag&NodeFlags.UPDATE) {
            node.graph_flag&=~NodeFlags.UPDATE;
            try {
              node.exec(context);
            }
            catch (error) {
                node.graph_flag&=~NodeFlags.CYCLE_TAG;
                throw error;
            }
            for (let k in node.outputs) {
                let sock=node.outputs[k];
                for (let e of sock.edges) {
                    let n=e.node;
                    if (n.graph_flag&NodeFlags.UPDATE) {
                        visit(n);
                    }
                }
            }
        }
        node.graph_flag&=~NodeFlags.CYCLE_TAG;
      }
      visit(startnode);
    }
     _save_nodes() {
      let ret=[];
      for (let n of this.nodes) {
          for (let s of n.allsockets) {
              if (s.graph_id<0) {
                  console.warn("graph corruption", s);
                  s.graph_id = this.graph_idgen.next();
                  this.sock_idmap[s.graph_id] = s;
              }
          }
      }
      for (let n of this.nodes) {
          if (n.graph_flag&NodeFlags.ZOMBIE) {
              continue;
          }
          if (n.graph_flag&NodeFlags.SAVE_PROXY) {
              n = ProxyNode.fromNode(n);
          }
          ret.push(n);
      }
      return ret;
    }
  }
  _ESClass.register(Graph);
  _es6_module.add_class(Graph);
  Graph = _es6_module.add_export('Graph', Graph);
  Graph.STRUCT = `
graph.Graph {
  graph_idgen : IDGen; 
  nodes       : iter(abstract(Object)) | obj._save_nodes();
}
`;
  nstructjs.manager.add_class(Graph);
  function test(exec_cycles) {
    if (exec_cycles===undefined) {
        exec_cycles = true;
    }
    let ob1, ob2;
    class SceneObject extends GraphNode {
       constructor(mesh) {
        super();
        this.mesh = mesh;
      }
      static  nodedef() {
        return {inputs: {depend: new DependSocket("depend", SocketFlags.MULTI), 
       matrix: new Matrix4Socket("matrix"), 
       color: new Vec4Socket("color"), 
       loc: new Vec3Socket("loc")}, 
      outputs: {color: new Vec4Socket("color"), 
       matrix: new Matrix4Socket("matrix"), 
       depend: new DependSocket("depend")}}
      }
       getLoc() {
        let p=new Vector3();
        p.multVecMatrix(this.outputs.matrix.getValue());
        return p;
      }
       exec() {
        let pmat=this.inputs.matrix.getValue();
        if (this.inputs.matrix.edges.length>0) {
            pmat = this.inputs.matrix.edges[0].getValue();
        }
        let loc=this.inputs.loc.getValue();
        let mat=this.outputs.matrix.getValue();
        mat.makeIdentity();
        mat.translate(loc[0], loc[1], loc[2]);
        mat.multiply(pmat);
        this.outputs.matrix.setValue(mat);
        this.outputs.depend.setValue(true);
        this.outputs.matrix.graphUpdate();
        this.outputs.depend.graphUpdate();
        let color=this.inputs.color.getValue();
        if (this.inputs.color.edges.length>0) {
            let ob1=this, ob2=this.inputs.color.edges[0].node;
            let p1=ob1.getLoc(), p2=ob2.getLoc();
            let f=p1.vectorDistance(p2);
            color[0] = color[1] = f;
            color[3] = 1.0;
        }
        this.outputs.color.setValue(color);
        this.outputs.color.graphUdate();
        this.mesh.uniforms.objectMatrix = this.outputs.matrix.getValue();
      }
    }
    _ESClass.register(SceneObject);
    _es6_module.add_class(SceneObject);
    let mesh=new simplemesh.SimpleMesh();
    let gl=_appstate.gl;
    mesh.program = gl.program;
    let m1=mesh.island;
    let m2=mesh.add_island();
    m1.tri([-1, -1, 0], [0, 1, 0], [1, -1, 0]);
    m2.tri([-1, -1, 0.1], [0, 1, 0.1], [1, -1, 0.1]);
    m1.uniforms = {}
    m2.uniforms = {}
    ob1 = new SceneObject(m1);
    ob2 = new SceneObject(m2);
    let graph=new Graph();
    graph.graph_flag|=GraphFlags.CYCLIC_ALLOWED;
    graph.add(ob1);
    graph.add(ob2);
    ob1.inputs.color.setValue(new Vector4([0, 0, 0, 1]));
    ob2.inputs.color.setValue(new Vector4([1, 0.55, 0.25, 1]));
    ob1.outputs.matrix.connect(ob2.inputs.matrix);
    ob2.outputs.color.connect(ob1.inputs.color);
    let last=ob2;
    let x=1.0;
    let z=0.2;
    for (let i=0; i<35; i++) {
        let m2=mesh.add_island();
        m2.tri([-1, -1, z], [0, 1, z], [1, -1, z]);
        z+=0.001;
        m2.uniforms = {};
        let ob=new SceneObject(m2);
        graph.add(ob);
        ob.inputs.loc.setValue(new Vector3([x-0.3, i*0.01, 0.0]));
        last.inputs.color.connect(ob.outputs.color);
        last.outputs.matrix.connect(ob.inputs.matrix);
        last = ob;
        m2.uniforms.objectMatrix = ob.outputs.matrix.getValue();
        m2.uniforms.uColor = ob.outputs.color.getValue();
        x+=0.001;
    }
    _appstate.mesh = mesh;
    let loc=new Vector3();
    let t=0.0;
    ob2.inputs.loc.setValue(new Vector3([0.5, 0.0, 0.0]));
    window.d = 0;
    window.setInterval(() =>      {
      loc[0] = Math.cos(t+window.d)*0.95+window.d;
      loc[1] = Math.sin(t)*0.95;
      ob1.inputs.loc.setValue(loc);
      ob1.graphUpdate();
      graph.max_cycle_steps = 128;
      graph.exec(undefined, !exec_cycles);
      m1.uniforms.objectMatrix = ob1.outputs.matrix.getValue();
      m2.uniforms.objectMatrix = ob2.outputs.matrix.getValue();
      m1.uniforms.uColor = ob1.outputs.color.getValue();
      m2.uniforms.uColor = [0, 0, 0, 1];
      t+=0.05;
      window.redraw_all();
    }, 10);
  }
  test = _es6_module.add_export('test', test);
}, '/dev/fairmotion/src/graph/graph.js');


es6_module_define('graphsockets', ["./graph.js", "../path.ux/scripts/pathux.js"], function _graphsockets_module(_es6_module) {
  var EnumKeyPair=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'EnumKeyPair');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Matrix4');
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector4');
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var NodeSocketType=es6_import_item(_es6_module, './graph.js', 'NodeSocketType');
  var NodeFlags=es6_import_item(_es6_module, './graph.js', 'NodeFlags');
  var SocketFlags=es6_import_item(_es6_module, './graph.js', 'SocketFlags');
  class Matrix4Socket extends NodeSocketType {
     constructor(uiname, flag, default_value) {
      super(uiname, flag);
      this.value = new Matrix4(default_value);
      if (default_value===undefined) {
          this.value.makeIdentity();
      }
    }
     addToUpdateHash(digest) {
      digest.add(this.value);
    }
    static  apiDefine(api, sockstruct) {
      let def=sockstruct.struct("value", "value", "Value", api.mapStruct(Matrix4));
    }
    static  nodedef() {
      return {name: "mat4", 
     uiname: "Matrix", 
     color: [1, 0.5, 0.25, 1]}
    }
     copy() {
      let ret=new Matrix4Socket(this.uiname, this.flag);
      this.copyTo(ret);
      return ret;
    }
     copyTo(b) {
      super.copyTo(b);
      b.value.load(this.value);
    }
     cmpValue(b) {
      return -1;
    }
     copyValue() {
      return new Matrix4(this.value);
    }
     diffValue(b) {
      let m1=this.value.$matrix;
      let m2=b.$matrix;
      let diff=0.0, tot=0.0;
      for (let k in m1) {
          let a=m1[k], b=m2[k];
          diff+=Math.abs(a-b);
          tot+=1.0;
      }
      return tot!=0.0 ? diff/tot : 0.0;
    }
     getValue() {
      return this.value;
    }
     setValue(val) {
      this.value.load(val);
    }
  }
  _ESClass.register(Matrix4Socket);
  _es6_module.add_class(Matrix4Socket);
  Matrix4Socket = _es6_module.add_export('Matrix4Socket', Matrix4Socket);
  
  Matrix4Socket.STRUCT = nstructjs.inherit(Matrix4Socket, NodeSocketType, "graph.Matrix4Socket")+`
  value : mat4;
}
`;
  nstructjs.register(Matrix4Socket);
  NodeSocketType.register(Matrix4Socket);
  class DependSocket extends NodeSocketType {
     constructor(uiname, flag) {
      super(uiname, flag);
      this.value = false;
    }
     addToUpdateHash(digest) {

    }
    static  nodedef() {
      return {name: "dep", 
     uiname: "Dependency", 
     color: [0.0, 0.75, 0.25, 1]}
    }
     diffValue(b) {
      return (!!this.value!=!!b)*0.001;
    }
     copyValue() {
      return this.value;
    }
     getValue() {
      return this.value;
    }
     setValue(b) {
      this.value = !!b;
    }
     cmpValue(b) {
      return !!this.value==!!b;
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.value = !!this.value;
    }
  }
  _ESClass.register(DependSocket);
  _es6_module.add_class(DependSocket);
  DependSocket = _es6_module.add_export('DependSocket', DependSocket);
  
  DependSocket.STRUCT = nstructjs.inherit(DependSocket, NodeSocketType, "graph.DependSocket")+`
  value : int;
}
`;
  nstructjs.register(DependSocket);
  NodeSocketType.register(DependSocket);
  class IntSocket extends NodeSocketType {
     constructor(uiname, flag) {
      super(uiname, flag);
      this.value = 0;
    }
    static  apiDefine(api, sockstruct) {
      let def=sockstruct.int("value", "value", "value").noUnits();
      def.on('change', function () {
        this.dataref.graphUpdate(true);
      });
      if (this.graph_flag&SocketFlags.NO_UNITS) {
          def.noUnits();
      }
    }
    static  nodedef() {
      return {name: "int", 
     uiname: "Integer", 
     color: [0.0, 0.75, 0.25, 1]}
    }
     diffValue(b) {
      return (this.value-b);
    }
     copyValue() {
      return ~~this.value;
    }
     getValue() {
      return ~~this.value;
    }
     setValue(b) {
      this.value = ~~b;
    }
     cmpValue(b) {
      return ~~this.value!==~~b;
    }
     addToUpdateHash(digest) {
      digest.add(this.value);
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.value = ~~this.value;
    }
  }
  _ESClass.register(IntSocket);
  _es6_module.add_class(IntSocket);
  IntSocket = _es6_module.add_export('IntSocket', IntSocket);
  
  IntSocket.STRUCT = nstructjs.inherit(IntSocket, NodeSocketType, "graph.IntSocket")+`
  value : int;
}
`;
  nstructjs.register(IntSocket);
  NodeSocketType.register(IntSocket);
  class Vec2Socket extends NodeSocketType {
     constructor(uiname, flag, default_value) {
      super(uiname, flag);
      this.value = new Vector2(default_value);
    }
    static  apiDefine(api, sockstruct) {
      let def=sockstruct.vec2('value', 'value', 'value').noUnits();
      def.on('change', function () {
        this.dataref.graphUpdate(true);
      });
      if (this.graph_flag&SocketFlags.NO_UNITS) {
          def.noUnits();
      }
    }
    static  nodedef() {
      return {name: "Vec2", 
     uiname: "Vector", 
     color: [0.25, 0.45, 1.0, 1]}
    }
     addToUpdateHash(digest) {
      digest.add(this.value[0]);
      digest.add(this.value[1]);
    }
     copyTo(b) {
      super.copyTo(b);
      b.value.load(this.value);
    }
     diffValue(b) {
      return this.value.vectorDistance(b);
    }
     copyValue() {
      return new Vector2(this.value);
    }
     getValue() {
      return this.value;
    }
     setValue(b) {
      this.value.load(b);
    }
     cmpValue(b) {
      return this.value.dot(b);
    }
  }
  _ESClass.register(Vec2Socket);
  _es6_module.add_class(Vec2Socket);
  Vec2Socket = _es6_module.add_export('Vec2Socket', Vec2Socket);
  
  Vec2Socket.STRUCT = nstructjs.inherit(Vec2Socket, NodeSocketType, "graph.Vec2Socket")+`
  value : vec2;
}
`;
  nstructjs.register(Vec2Socket);
  NodeSocketType.register(Vec2Socket);
  class VecSocket extends NodeSocketType {
     buildUI(container) {
      if (this.edges.length===0) {
          container.vecpopup("value");
      }
      else {
        container.label(this.uiname);
      }
    }
  }
  _ESClass.register(VecSocket);
  _es6_module.add_class(VecSocket);
  VecSocket = _es6_module.add_export('VecSocket', VecSocket);
  class Vec3Socket extends VecSocket {
     constructor(uiname, flag, default_value) {
      super(uiname, flag);
      this.value = new Vector3(default_value);
    }
    static  apiDefine(api, sockstruct) {
      let cb=NodeSocketType._api_uiname;
      let def=sockstruct.vec3('value', 'value', 'value').uiNameGetter(cb).noUnits();
      def.on('change', function () {
        this.dataref.graphUpdate(true);
      });
      def.noUnits();
    }
    static  nodedef() {
      return {name: "vec3", 
     uiname: "Vector", 
     color: [0.25, 0.45, 1.0, 1]}
    }
     addToUpdateHash(digest) {
      digest.add(this.value[0]);
      digest.add(this.value[1]);
      digest.add(this.value[2]);
    }
     copyTo(b) {
      super.copyTo(b);
      b.value.load(this.value);
    }
     diffValue(b) {
      return this.value.vectorDistance(b);
    }
     copyValue() {
      return new Vector3(this.value);
    }
     getValue() {
      return this.value;
    }
     setValue(b) {
      this.value.load(b);
    }
     cmpValue(b) {
      return this.value.dot(b);
    }
  }
  _ESClass.register(Vec3Socket);
  _es6_module.add_class(Vec3Socket);
  Vec3Socket = _es6_module.add_export('Vec3Socket', Vec3Socket);
  
  Vec3Socket.STRUCT = nstructjs.inherit(Vec3Socket, NodeSocketType, "graph.Vec3Socket")+`
  value : vec3;
}
`;
  nstructjs.register(Vec3Socket);
  NodeSocketType.register(Vec3Socket);
  class Vec4Socket extends NodeSocketType {
     constructor(uiname, flag, default_value) {
      super(uiname, flag);
      this.value = new Vector4(default_value);
    }
    static  nodedef() {
      return {name: "vec4", 
     uiname: "Vector4", 
     color: [0.25, 0.45, 1.0, 1]}
    }
    static  apiDefine(api, sockstruct) {
      let def=sockstruct.vec4('value', 'value', 'value').noUnits();
      def.on('change', function () {
        this.dataref.graphUpdate(true);
      });
      if (this.graph_flag&SocketFlags.NO_UNITS) {
          def.noUnits();
      }
    }
     addToUpdateHash(digest) {
      digest.add(this.value[0]);
      digest.add(this.value[1]);
      digest.add(this.value[2]);
      digest.add(this.value[3]);
    }
     diffValue(b) {
      return this.value.vectorDistance(b);
    }
     copyValue() {
      return new Vector4(this.value);
    }
     getValue() {
      return this.value;
    }
     copyTo(b) {
      super.copyTo(b);
      b.value.load(this.value);
    }
     setValue(b) {
      if (isNaN(this.value.dot(b))) {
          console.warn(this, b);
          throw new Error("NaN!");
      }
      this.value.load(b);
    }
     cmpValue(b) {
      return this.value.dot(b);
    }
  }
  _ESClass.register(Vec4Socket);
  _es6_module.add_class(Vec4Socket);
  Vec4Socket = _es6_module.add_export('Vec4Socket', Vec4Socket);
  
  Vec4Socket.STRUCT = nstructjs.inherit(Vec4Socket, NodeSocketType, "graph.Vec4Socket")+`
  value : vec4;
}
`;
  nstructjs.register(Vec4Socket);
  NodeSocketType.register(Vec4Socket);
  class RGBSocket extends Vec3Socket {
     constructor(uiname, flag, default_value=[0.5, 0.5, 0.5]) {
      super(uiname, flag, default_value);
    }
    static  nodedef() {
      return {name: "rgb", 
     uiname: "Color", 
     color: [1.0, 0.7, 0.7, 1]}
    }
    static  apiDefine(api, sockstruct) {
      let def=sockstruct.color3('value', 'value', 'value').uiNameGetter(NodeSocketType._api_uiname).noUnits();
      def.on('change', function () {
        this.dataref.graphUpdate(true);
      });
    }
     buildUI(container, onchange) {
      if (this.edges.length===0) {
          container.colorbutton("value");
      }
      else {
        container.label(this.uiname);
      }
    }
  }
  _ESClass.register(RGBSocket);
  _es6_module.add_class(RGBSocket);
  RGBSocket = _es6_module.add_export('RGBSocket', RGBSocket);
  RGBSocket.STRUCT = nstructjs.inherit(RGBSocket, Vec3Socket, 'graph.RGBSocket')+`
}
`;
  nstructjs.register(RGBSocket);
  NodeSocketType.register(RGBSocket);
  class RGBASocket extends Vec4Socket {
     constructor(uiname, flag, default_value=[0.5, 0.5, 0.5, 1.0]) {
      super(uiname, flag, default_value);
    }
    static  nodedef() {
      return {name: "rgba", 
     uiname: "Color", 
     color: [1.0, 0.7, 0.4, 1]}
    }
    static  apiDefine(api, sockstruct) {
      let def=sockstruct.color4('value', 'value', 'value').uiNameGetter(NodeSocketType._api_uiname).noUnits();
      def.on('change', function () {
        this.dataref.graphUpdate(true);
      });
    }
     buildUI(container, onchange) {
      if (this.edges.length===0) {
          container.colorbutton("value");
      }
      else {
        container.label(this.uiname);
      }
    }
  }
  _ESClass.register(RGBASocket);
  _es6_module.add_class(RGBASocket);
  RGBASocket = _es6_module.add_export('RGBASocket', RGBASocket);
  RGBASocket.STRUCT = nstructjs.inherit(RGBASocket, Vec4Socket, 'graph.RGBASocket')+`
}
`;
  nstructjs.register(RGBASocket);
  NodeSocketType.register(RGBASocket);
  class FloatSocket extends NodeSocketType {
     constructor(uiname, flag, default_value=0.0) {
      super(uiname, flag);
      this.value = default_value;
    }
     addToUpdateHash(digest) {
      digest.add(this.value);
    }
    static  apiDefine(api, sockstruct) {
      let def=sockstruct.float('value', 'value', 'value').noUnits();
      if (this.graph_flag&SocketFlags.NO_UNITS) {
          def.noUnits();
      }
      def.on('change', function () {
        this.dataref.graphUpdate(true);
      });
    }
    static  nodedef() {
      return {name: "float", 
     uiname: "Value", 
     color: [1.25, 0.45, 1.0, 1]}
    }
     buildUI(container, onchange) {
      if (this.edges.length===0) {
          let ret=container.prop("value");
          ret.setAttribute("name", this.uiname);
          ret.onchange = onchange;
      }
      else {
        container.label(this.uiname);
      }
    }
     diffValue(b) {
      return Math.abs(this.value-b);
    }
     copyValue() {
      return this.value;
    }
     getValue() {
      return this.value;
    }
     copyTo(b) {
      super.copyTo(b);
      b.value = this.value;
    }
     setValue(b) {
      if (isNaN(b)) {
          console.warn(this, b);
          throw new Error("NaN!");
      }
      this.value = b;
    }
     cmpValue(b) {
      return this.value-b;
    }
  }
  _ESClass.register(FloatSocket);
  _es6_module.add_class(FloatSocket);
  FloatSocket = _es6_module.add_export('FloatSocket', FloatSocket);
  
  FloatSocket.STRUCT = nstructjs.inherit(FloatSocket, NodeSocketType, "graph.FloatSocket")+`
  value : float;
}
`;
  nstructjs.register(FloatSocket);
  NodeSocketType.register(FloatSocket);
  class EnumSocket extends IntSocket {
     constructor(uiname, items={}, flag, default_value=undefined) {
      super(uiname, flag);
      this.graph_flag|=SocketFlags.INSTANCE_API_DEFINE;
      this.items = {};
      this.value = 0;
      if (items!==undefined) {
          for (let k in items) {
              this.items[k] = items[k];
          }
      }
      if (default_value!==undefined) {
          this.value = default_value;
      }
      this.uimap = {};
      for (let k in this.items) {
          let k2=k.split("-_ ");
          let uiname="";
          for (let item of k2) {
              uiname+=k[0].toUpperCase()+k.slice(1, k.length).toLowerCase()+" ";
          }
          let v=this.items[k];
          this.uimap[k] = uiname.trim();
      }
    }
     addToUpdateHash(digest) {
      digest.add(this.value);
    }
     apiDefine(api, sockstruct) {
      let def;
      def = sockstruct.enum('value', 'value', this.items, this.uiname).uiNames(this.uimap);
      def.on('change', function () {
        this.dataref.graphUpdate(true);
      });
    }
     addUiItems(items) {
      for (let k in items) {
          this.uimap[k] = items[k];
      }
    }
    static  nodedef() {
      return {name: "enum", 
     uiname: "Enumeration", 
     graph_flag: SocketFlags.INSTANCE_API_DEFINE, 
     color: [0.0, 0.75, 0.25, 1]}
    }
     diffValue(b) {
      return (this.value-b);
    }
     copyValue() {
      return ~~this.value;
    }
     copyTo(b) {
      super.copyTo(b);
      b.items = Object.assign({}, this.items);
      b.uimap = Object.assign({}, this.uimap);
      return this;
    }
     getValue() {
      return ~~this.value;
    }
     setValue(b) {
      if (b===undefined||b==="") {
          return ;
      }
      if (typeof b==="string") {
          if (b in this.items) {
              b = this.items[b];
          }
          else {
            throw new Error("bad enum item"+b);
          }
      }
      this.value = ~~b;
    }
     _saveMap(obj) {
      obj = obj===undefined ? {} : obj;
      let ret=[];
      for (let k in obj) {
          ret.push(new EnumKeyPair(k, obj[k]));
      }
      return ret;
    }
     onFileLoad(socketTemplate) {
      this.items = Object.assign({}, socketTemplate.items);
      this.uimap = Object.assign({}, socketTemplate.uimap);
    }
     _loadMap(obj) {
      if (!obj||!Array.isArray(obj)) {
          return {}
      }
      let ret={};
      for (let k of obj) {
          ret[k.key] = k.val;
      }
      return ret;
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.items = this._loadMap(this.items);
      this.uimap = this._loadMap(this.uimap);
      this.graph_flag|=SocketFlags.INSTANCE_API_DEFINE;
    }
     cmpValue(b) {
      return ~~this.value!==~~b;
    }
  }
  _ESClass.register(EnumSocket);
  _es6_module.add_class(EnumSocket);
  EnumSocket = _es6_module.add_export('EnumSocket', EnumSocket);
  
  EnumSocket.STRUCT = nstructjs.inherit(EnumSocket, IntSocket, "graph.EnumSocket")+`
  items : array(EnumKeyPair) | this._saveMap(this.items);
  uimap : array(EnumKeyPair) | this._saveMap(this.uimap);
}
`;
  nstructjs.register(EnumSocket);
  NodeSocketType.register(EnumSocket);
  class BoolSocket extends NodeSocketType {
     constructor(uiname, flag) {
      super(uiname, flag);
      this.value = 0;
    }
    static  apiDefine(api, sockstruct) {
      sockstruct.bool("value", "value", "value");
    }
    static  nodedef() {
      return {name: "bool", 
     uiname: "Boolean", 
     color: [0.0, 0.75, 0.25, 1]}
    }
     addToUpdateHash(digest) {
      digest.add(this.value);
    }
     diffValue(b) {
      return (this.value-b);
    }
     copyValue() {
      return ~~this.value;
    }
     getValue() {
      return !!this.value;
    }
     setValue(b) {
      this.value = !!b;
    }
     cmpValue(b) {
      return !!this.value!==!!b;
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.value = !!this.value;
    }
  }
  _ESClass.register(BoolSocket);
  _es6_module.add_class(BoolSocket);
  BoolSocket = _es6_module.add_export('BoolSocket', BoolSocket);
  
  BoolSocket.STRUCT = nstructjs.inherit(BoolSocket, NodeSocketType, "graph.BoolSocket")+`
  value : bool;
}
`;
  nstructjs.register(BoolSocket);
  NodeSocketType.register(BoolSocket);
}, '/dev/fairmotion/src/graph/graphsockets.js');


es6_module_define('brush_base', [], function _brush_base_module(_es6_module) {
  const DynamicInputs={PRESSURE: 1, 
   X_TILT: 2, 
   Y_TILT: 4, 
   ANGLE: 8, 
   SPEED: 16}
  _es6_module.add_export('DynamicInputs', DynamicInputs);
  const DynamicFlags={}
  _es6_module.add_export('DynamicFlags', DynamicFlags);
  const BrushFlags={USE_UNIFIED_SETTINGS: 1}
  _es6_module.add_export('BrushFlags', BrushFlags);
}, '/dev/fairmotion/src/brush/brush_base.js');


es6_module_define('brush_types', ["../path.ux/scripts/pathux.js", "../core/lib_api.js", "./brush_base.js"], function _brush_types_module(_es6_module) {
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var Curve1D=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Curve1D');
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  var FloatProperty=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'FloatProperty');
  var DataBlock=es6_import_item(_es6_module, '../core/lib_api.js', 'DataBlock');
  var DynamicFlags=es6_import_item(_es6_module, './brush_base.js', 'DynamicFlags');
  var DynamicInputs=es6_import_item(_es6_module, './brush_base.js', 'DynamicInputs');
  const BrushTypes={}
  _es6_module.add_export('BrushTypes', BrushTypes);
  class NoInheritFlag  {
     constructor(def) {
      this.def = def;
    }
  }
  _ESClass.register(NoInheritFlag);
  _es6_module.add_class(NoInheritFlag);
  function buildSlots(cls) {
    let ins={}
    let p=cls;
    while (p&&p!==Object) {
      let def=p.brushDefine();
      let ins2=def.inputs||{};
      for (let k in ins2) {
          if (!(k in ins)) {
              ins[k] = ins2[k];
          }
      }
      if (__instance_of(ins2, NoInheritFlag)) {
          return ins;
      }
      p = p.__proto__;
    }
    return ins;
  }
  buildSlots = _es6_module.add_export('buildSlots', buildSlots);
  const BrushToolClasses=[];
  _es6_module.add_export('BrushToolClasses', BrushToolClasses);
  class DynamicsCurve  {
     constructor() {
      this.inputType = DynamicInputs.PRESSURE;
      this.curve = new Curve1D();
      this.enabled = false;
    }
     load(b) {
      b.copyTo(this);
      return this;
    }
     copy() {
      return new DynamicsCurve().load(this);
    }
     copyTo(b) {
      b.enabled = this.enabled;
      b.inputType = this.inputType;
      this.curve.copyTo(b.curve);
    }
  }
  _ESClass.register(DynamicsCurve);
  _es6_module.add_class(DynamicsCurve);
  DynamicsCurve = _es6_module.add_export('DynamicsCurve', DynamicsCurve);
  DynamicsCurve.STRUCT = `
brush.DynamicsCurve {
  inputType : int;
  curve     : Curve1D;
  enabled   : bool;
}
`;
  nstructjs.register(DynamicsCurve);
  class DynamicsChannel  {
     constructor(name) {
      this.inputs = new Map();
      this._inputs = undefined;
      this.name = ""+name;
      this.min = 0;
      this.max = 1.0;
      this.flag = 0;
    }
     get(type) {
      let ch=this.inputs.get(type);
      if (ch) {
          return ch;
      }
      ch = new DynamicsCurve();
      ch.inputType = type;
      this.inputs.set(type, ch);
      return ch;
    }
     _saveInputs() {
      let ret=[];
      for (let val of this.inputs.values()) {
          ret.push(val);
      }
      return ret;
    }
     copyTo(b) {
      b.min = this.min;
      b.max = this.max;
      b.flag = this.flag;
      for (let ch of this.inputs.values()) {
          ch.copyTo(b.get(ch.name));
      }
    }
     load(b) {
      b.copyTo(this);
      return this;
    }
     copy() {
      return new DynamicsChannel().load(this);
    }
     loadSTRUCT(reader) {
      reader(this);
      this.inputs = new Map();
      for (let ch of this._inputs) {
          this.inputs.set(ch.inputType, ch);
      }
      this._inputs = undefined;
    }
  }
  _ESClass.register(DynamicsChannel);
  _es6_module.add_class(DynamicsChannel);
  DynamicsChannel = _es6_module.add_export('DynamicsChannel', DynamicsChannel);
  DynamicsChannel.STRUCT = `
brush.DynamicsChannel {
  name    : string;
  min     : float;
  max     : float;
  flag    : int;
  _inputs : array(brush.DynamicsCurve) | this._saveInputs(); 
}
`;
  nstructjs.register(DynamicsChannel);
  class BrushDynamics  {
     constructor() {
      this.channels = new Map();
      this._channels = undefined;
    }
     get(name) {
      let ch=this.channels.get(name);
      if (ch) {
          return ch;
      }
      ch = new DynamicsChannel(name);
    }
     _saveChannels() {
      return util.list(this.channels.values());
    }
     dataLink(block, getblock, getblock_adduser) {

    }
     copyTo(b) {
      for (let ch of this.channels.values()) {
          ch.copyTo(b.get(ch.name));
      }
    }
     load(b) {
      b.copyTo(this);
      return this;
    }
     copy() {
      return new BrushDynamics().load(this);
    }
     loadSTRUCT(reader) {
      reader(this);
      this.channels = new Map();
      for (let ch of this._channels) {
          this.channels.set(ch.name, ch);
      }
      this._channels = undefined;
    }
  }
  _ESClass.register(BrushDynamics);
  _es6_module.add_class(BrushDynamics);
  BrushDynamics = _es6_module.add_export('BrushDynamics', BrushDynamics);
  BrushDynamics.STRUCT = `
brush.BrushDynamics {
  _channels : iter(brush.DynamicsChannel) | this._saveChannels();
}
`;
  nstructjs.register(BrushDynamics);
  class BrushTool  {
     constructor() {
      this.inputs = buildSlots(this.constructor);
      for (let k in this.inputs) {
          let prop=this.inputs[k];
          prop = prop.copy();
          prop.apiname = k;
          this.inputs[k] = prop;
      }
      this._inputs = undefined;
      let def=this.constructor.brushDefine();
      this.name = def.defaultName||def.uiName||def.typeName;
      this.flag = 0;
      this.dynamics = new BrushDynamics();
      console.log("brush inputs", this.inputs);
    }
    static  noInherit(def) {
      return new NoInheritFlag(def);
    }
    static  register(cls) {
      let def=cls.brushDefine();
      if (cls.brushDefine===BrushTool.brushDefine) {
          throw new Error("missing brushDefine");
      }
      if (BrushTool.getBrushTool(def.typeName)) {
          throw new Error("brush name "+def.typeName+" is already registered");
      }
      if (!def.typeName) {
          throw new Error("missing typeName in brushDefine");
      }
      BrushTypes[def.typeName.toUpperCase()] = BrushToolClasses.length;
      BrushToolClasses.push(cls);
    }
    static  getBrushTool(name) {
      for (let cls of BrushToolClasses) {
          if (cls.brushDefine().typeName===name) {
              return cls;
          }
      }
    }
    static  brushDefine() {
      return {typeName: "brush", 
     uiName: "Brush", 
     defaultName: "Brush", 
     inputs: {radius: new FloatProperty(15.0).setRange(0.0, 1024).noUnits(), 
      strength: new FloatProperty(1.0).setRange(0.0, 1.0)}, 
     flag: 0}
    }
    static  defineAPI(api) {
      let st=api.mapStruct(this, true);
      return st;
    }
     copyTo(b) {
      b.flag = this.flag;
      b.name = this.name;
      this.dynamics.copyTo(b);
      for (let k in this.inputs) {
          let prop1=this.inputs[k];
          let prop2=b.inputs[k];
          if (!prop2) {
              console.error("b lacks tool property "+k, prop1, this);
              continue;
          }
          prop2.setValue(prop1.getValue());
      }
    }
     load(b) {
      b.copyTo(this);
      return this;
    }
     copy() {
      return new this.constructor().load(this);
    }
     dataLink(block, getblock, getblock_adduser) {
      this.dynamics.dataLink(block, getblock, getblock_adduser);
    }
     loadSTRUCT(reader) {
      reader();
      super.loadSTRUCT(reader);
      let ins=this._inputs;
      for (let prop of ins) {
          let prop2=this.inputs[prop.apiname];
          if (prop2) {
              try {
                prop2.setValue(prop.getValue());
              }
              catch (error) {
                  util.print_stack(error);
                  console.error("Error loading tool property; copying instance instead. . .");
                  ins[prop.apiname] = prop;
              }
          }
          else {
            this.inputs[prop.apiname] = prop;
          }
      }
      this._inputs = undefined;
    }
  }
  _ESClass.register(BrushTool);
  _es6_module.add_class(BrushTool);
  BrushTool = _es6_module.add_export('BrushTool', BrushTool);
  BrushTool.STRUCT = `
brush.BrushTool {
  flag       : int;
  dynamics   : brush.BrushDynamics;
  _inputs     : array(abstract(ToolProperty)) | this._save_inputs; 
}
`;
  nstructjs.register(BrushTool);
}, '/dev/fairmotion/src/brush/brush_types.js');


es6_module_define('brush', ["./brush_types.js", "../path.ux/scripts/pathux.js", "../core/lib_api.js"], function _brush_module(_es6_module) {
  var DataBlock=es6_import_item(_es6_module, '../core/lib_api.js', 'DataBlock');
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  var BrushTool=es6_import_item(_es6_module, './brush_types.js', 'BrushTool');
  var BrushToolClasses=es6_import_item(_es6_module, './brush_types.js', 'BrushToolClasses');
  class Brush extends DataBlock {
     constructor() {
      super();
      this.flag = BrushFlags.USE_UNIFIED_SETTINGS;
      this.tool = new BrushTool();
    }
    static  blockDefine() {
      return {typeName: "brush", 
     uiName: "Brush", 
     defaultName: "Brush", 
     typeIndex: 10}
    }
     copyTo(b) {
      b.flag = this.flag;
      b.tool = this.tool.copy();
    }
     load(b) {
      b.copyTo(this);
      return this;
    }
     data_link(block, getblock, getblock_us) {
      block = block||this;
      this.tool.dataLink(this, getblock, getblock_us);
    }
     copy() {
      return new this.constructor().load(this);
    }
  }
  _ESClass.register(Brush);
  _es6_module.add_class(Brush);
  Brush = _es6_module.add_export('Brush', Brush);
  Brush.STRUCT = nstructjs.inherit(Brush, DataBlock)+`
  flag : int;
  tool : abstract(brush.BrushTool);
}
`;
  DataBlock.register(Brush);
  function buildBrushAPI(api) {
    let st=api.mapStruct(Brush, true);
    for (let cls of BrushToolClasses) {
        cls.defineAPI(api);
    }
  }
  buildBrushAPI = _es6_module.add_export('buildBrushAPI', buildBrushAPI);
}, '/dev/fairmotion/src/brush/brush.js');


es6_module_define('imagecanvas', ["../graph/graph.js", "../path.ux/scripts/pathux.js", "../core/eventdag.js", "./imagecanvas_base.js", "../core/lib_api.js"], function _imagecanvas_module(_es6_module) {
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var Curve1D=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Curve1D');
  var Vector4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector4');
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  var FloatProperty=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'FloatProperty');
  var DataBlock=es6_import_item(_es6_module, '../core/lib_api.js', 'DataBlock');
  var NodeBase=es6_import_item(_es6_module, '../core/eventdag.js', 'NodeBase');
  var Graph=es6_import_item(_es6_module, '../graph/graph.js', 'Graph');
  var GraphNode=es6_import_item(_es6_module, '../graph/graph.js', 'GraphNode');
  var NodeSocketType=es6_import_item(_es6_module, '../graph/graph.js', 'NodeSocketType');
  var TILESIZE=es6_import_item(_es6_module, './imagecanvas_base.js', 'TILESIZE');
  const ImageDataClasses=[];
  _es6_module.add_export('ImageDataClasses', ImageDataClasses);
  class ImageDataType  {
     constructor(width=1, height=1) {
      this.width = width;
      this.height = height;
      this.x = 0;
      this.y = 0;
      this.compressedData = [];
    }
    static  imageDataDefine() {
      return {typeName: ""}
    }
    static  register(cls) {
      ImageDataClasses.push(cls);
    }
    static  getClass(name) {
      for (let cls of ImageDataClasses) {
          if (cls.imageDataDefine().typeName===name) {
              return cls;
          }
      }
    }
     flagUpdate(x, y, w, h) {

    }
     toUint8() {
      throw new Error("implement me");
    }
     fromUint8(data) {
      throw new Error("implement me");
    }
     toFloat32() {
      throw new Error("implement me");
    }
     copyTo(b) {
      b.width = this.width;
      b.height = this.height;
    }
     fromFloat32(data) {
      throw new Error("implement me");
    }
     copy() {
      return new Promise((accept, reject) =>        {
        return this.toFloat32();
      }).then((f32) =>        {
        let ret=new this.constructor();
        this.copyTo(ret);
        return ret.fromFloat32(f32);
      });
    }
     compress() {

    }
     decompress(data) {
      return new Promise((accept, reject) =>        {      });
    }
     loadSTRUCT(reader) {
      reader(this);
      if (this.compressedData.length>0) {
      }
    }
  }
  _ESClass.register(ImageDataType);
  _es6_module.add_class(ImageDataType);
  ImageDataType = _es6_module.add_export('ImageDataType', ImageDataType);
  ImageDataType.STRUCT = `
imagecanvas.ImageDataType {
  compressedData : array(byte) | this.compress();
  width          : int;
  height         : int;
  x              : int;
  y              : int;
}
`;
  nstructjs.register(ImageDataType);
  const IRecalcFlags={UPDATE: 1, 
   COMPRESS_DATA: 2}
  _es6_module.add_export('IRecalcFlags', IRecalcFlags);
  class SimpleImageData extends ImageDataType {
     constructor() {
      super();
      this.glTex = undefined;
      this.data = undefined;
      this.ready = false;
      this.recalcFlag = IRecalcFlags.UPDATE;
    }
     getData() {
      if (!this.data) {
          this.data = new ImageData(this.width, this.height);
      }
      return this.data;
    }
     toUint8() {
      return new Promise((accept, reject) =>        {
        if (this.data) {
            accept(this.data.data);
        }
      });
    }
     fromUint8(data) {
      return new Promise((accept, reject) =>        {
        let data2=this.getData();
        data2.data.set(data);
        accept(this);
      });
    }
     toFloat32() {
      return new Promise((accept, reject) =>        {
        if (!this.data) {
            return ;
        }
        let data=this.data.data;
        let fdata=new Float32Array(data.length);
        let mul=1.0/255.0;
        for (let i=0; i<data.length; i++) {
            fdata[i] = data[i]*mul;
        }
        accept(fdata);
      });
    }
     fromFloat32(fdata) {
      return new Promise((accept, reject) =>        {
        let data=this.getData().data;
        for (let i=0; i<fdata.length; i++) {
            data[i] = ~~(fdata[i]*255);
        }
        accept(this);
      });
    }
     flagUpdate() {
      this.recalcFlag|=IRecalcFlags.UPDATE|IRecalcFlags.COMPRESS_DATA;
    }
     compress() {
      if (!(this.recalcFlag&IRecalcFlags.COMPRESS_DATA)&&this.compressedData&&this.compressedData.length>0) {
          return this.compressedData;
      }
      let canvas=document.createElement("canvas");
      let g=canvas.getContext("2d");
      canvas.width = this.width;
      canvas.height = this.height;
      g.putImageData(this.getData());
      let data=canvas.toDataURL("image/png");
      let i=data.search("base64,");
      let header=data.slice(0, i);
      data = data.slice(7, data.length).trim();
      data = atob(data);
      let bytes=new Uint8Array(data.length+header.length+1);
      let bi=0;
      bytes[bi++] = header.length;
      for (let i=0; i<header.length; i++) {
          bytes[bi++] = header.charCodeAt(i);
      }
      for (let i=0; i<data.length; i++) {
          bytes[bi++] = data.charCodeAt(i);
      }
      this.recalcFlag&=~IRecalcFlags.COMPRESS_DATA;
      this.compressedData = bytes;
    }
     decompress() {
      this.ready = false;
      let data=this.compressedData;
      let s='';
      let bi=0;
      let header='';
      let tot=data[bi++];
      for (let i=0; i<tot; i++) {
          header+=String.fromCharCode(data[bi++]);
      }
      header+='base64,';
      for (let i=0; i<data.length; i++) {
          s+=String.fromCharCode(data[bi++]);
      }
      data = s;
      data = btoa(data);
      data = header+data;
      return new Promise((accept, reject) =>        {
        let img=document.createElement("img");
        img.src = data;
        img.onload = () =>          {
          if (this.ready) {
              return ;
          }
          let canvas=document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          let g=canvas.getContext("2d");
          g.drawImage(img, 0, 0);
          let data=g.getImageData(0, 0, canvas.width, canvas.height);
          this.data = data;
          this.ready = true;
          accept(this);
        }
      });
    }
    static  imageDataDefine() {
      return {typeName: "simple"}
    }
  }
  _ESClass.register(SimpleImageData);
  _es6_module.add_class(SimpleImageData);
  SimpleImageData = _es6_module.add_export('SimpleImageData', SimpleImageData);
  SimpleImageData.STRUCT = nstructjs.inherit(SimpleImageData, ImageDataType, 'imagecanvas.SimpleImageData')+`
}`;
  nstructjs.register(SimpleImageData);
  ImageDataType.register(SimpleImageData);
  let fillcache=new Map();
  class FillColorImage extends ImageDataType {
     constructor(width, height) {
      super(width, height);
      this.color = new Vector4([1.0, 1.0, 1.0, 1.0]);
    }
     toUint8() {
      return new Promise((accept, reject) =>        {
        let key=this.width+":"+this.height+":";
        for (let i=0; i<4; i++) {
            let f=this.color.toFixed(4);
            key+=f+":";
        }
        let ret=fillcache.get(key);
        if (ret) {
            accept(ret);
        }
        ret = new Uint8ClampedArray(this.width*this.height*4);
        fillcache.set(key, ret);
        let r=~~(this.color[0]*255);
        let g=~~(this.color[1]*255);
        let b=~~(this.color[2]*255);
        let a=~~(this.color[3]*255);
        for (let i=0; i<ret.length; i+=4) {
            ret[i] = r;
            ret[i+1] = g;
            ret[i+2] = b;
            ret[i+3] = b;
        }
        accept(ret);
      });
    }
     fromUint8(u8) {
      this.color[0] = u8[0]/255;
      this.color[1] = u8[1]/255;
      this.color[2] = u8[2]/255;
      this.color[3] = u8[3]/255;
      return new Promise((accept, reject) =>        {
        accept(this);
      });
    }
  }
  _ESClass.register(FillColorImage);
  _es6_module.add_class(FillColorImage);
  FillColorImage = _es6_module.add_export('FillColorImage', FillColorImage);
  FillColorImage.STRUCT = nstructjs.inherit(FillColorImage, ImageDataType, "imagecanvas.FillColorImage")+`
  color : vec4;
}
`;
  const DataTypes={UINT8: 0, 
   UINT16: 1, 
   UINT32: 2, 
   FLOAT16: 3, 
   FLOAT32: 4}
  _es6_module.add_export('DataTypes', DataTypes);
  class TiledImage extends ImageDataType {
     constructor(width, height, tilesize=TILESIZE) {
      super();
      this.tiles = [];
      this.tilesize = tilesize;
      this.width = width;
      this.height = height;
      this.bgcolor = new Vector4([1, 1, 1, 0]);
    }
    static  imageDataDefine() {
      return {typeName: "tiled_image"}
    }
     initTiles() {
      let tilex=Math.ceil(this.width/this.tilesize);
      let tiley=Math.ceil(this.height/this.tilesize);
      let size=this.tilesize;
      for (let y=0; y<tiley; y++) {
          for (let x=0; x<tilex; x++) {
              let x2=x*size;
              let y2=y*size;
              let tile=new FillColorImage(size, size);
              tile.color.load(this.bgcolor);
              tile.x = x2;
              tile.y = y2;
              this.tiles.push(tile);
          }
      }
    }
     toUint8() {
      let canvas=document.createElement("canvas");
      let g=canvas.getContext("2d");
      canvas.width = this.width;
      canvas.height = this.height;
      let count=0;
      let tot=this.tiles.length;
      return new Promise((accept, reject) =>        {
        let doTile=(tile) =>          {
          tile.toUint8().then((u8) =>            {
            let im=new ImageData(u8, tile.width, tile.height);
            g.putImageData(im, tile.x, tile.y);
            if (count++===tot) {
                accept(g.getImageData(0, 0, canvas.width, canvas.height).data);
            }
          });
        }
        for (let tile of this.tiles) {
            doTile(tile);
        }
      });
    }
     fromUint8(u8) {
      let canvas=document.createElement("canvas");
      let g=canvas.getContext("2d");
      canvas.width = this.width;
      canvas.height = this.height;
      let im=new ImageData(u8, this.width, this.height);
      g.putImageData(im, 0, 0);
      if (this.tiles.length===0) {
          return new Promise((accept, reject) =>            {
            return accept(this);
          });
      }
      let count=0;
      let tot=this.tiles.length;
      return new Promise((accept, reject) =>        {
        for (let tile of this.tiles) {
            let data=g.getImageData(tile.x, tile.y, tile.width, tile.height);
            tile.fromUint8(data).then(() =>              {
              tot++;
              if (tot===count) {
                  accept(this);
              }
            });
        }
      });
    }
     flagUpdate(x, y, w, h) {
      for (let tile of this.tiles) {
          tile.flagUpdate(x, y, w, h);
      }
    }
     compress() {
      for (let tile of this.tiles) {
          tile.compress();
      }
    }
     decompress() {
      let tot=0;
      return new Promise((accept, reject) =>        {
        let finish=() =>          {
          tot++;
          if (tot===this.tiles.length) {
              accept(this);
          }
        }
        for (let tile of this.tiles) {
            tile.decompress().then(finish);
        }
      });
    }
  }
  _ESClass.register(TiledImage);
  _es6_module.add_class(TiledImage);
  TiledImage = _es6_module.add_export('TiledImage', TiledImage);
  TiledImage.STRUCT = nstructjs.inherit(TiledImage, ImageDataType)+`
  tiles    : abstract(imagecanvas.ImageDataType);
  tilesize : int;
  bgcolor  : vec4;
}
`;
  ImageDataType.register(TiledImage);
  class ImageDataSocket extends NodeSocketType {
     constructor() {
      super();
      this.image = new TiledImage();
    }
    static  nodedef() {
      return {name: "image", 
     uiname: "Image"}
    }
     setValue(image) {
      this.image = image;
    }
     getValue() {
      return this.image;
    }
     copyTo(b) {
      b.image = this.image;
    }
  }
  _ESClass.register(ImageDataSocket);
  _es6_module.add_class(ImageDataSocket);
  ImageDataSocket = _es6_module.add_export('ImageDataSocket', ImageDataSocket);
  NodeSocketType.register(ImageDataType);
  class ImageNode extends GraphNode {
    static  nodedef() {
      return {name: "", 
     uiName: "", 
     inputs: {}, 
     outputs: {}, 
     flag: 0, 
     icon: -1}
    }
  }
  _ESClass.register(ImageNode);
  _es6_module.add_class(ImageNode);
  ImageNode = _es6_module.add_export('ImageNode', ImageNode);
  class ImageGraph  {
     constructor() {
      this.graph = new Graph();
    }
  }
  _ESClass.register(ImageGraph);
  _es6_module.add_class(ImageGraph);
  ImageGraph = _es6_module.add_export('ImageGraph', ImageGraph);
  class ImageCanvas extends DataBlock {
     constructor() {
      super();
      this.width = 512;
      this.height = 512;
      this.dataType = DataTypes.UINT16;
      this.dpi = undefined;
      this.x = 0;
      this.y = 0;
      this.layers = [];
    }
    static  blockDefine() {
      return {typeName: "image_canvas", 
     uiName: "Image Canvas", 
     defaultName: "Image Canvas", 
     typeIndex: 11}
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      if (this.dpi===-1) {
          this.dpi = undefined;
      }
    }
  }
  _ESClass.register(ImageCanvas);
  _es6_module.add_class(ImageCanvas);
  ImageCanvas = _es6_module.add_export('ImageCanvas', ImageCanvas);
  ImageCanvas.STRUCT = nstructjs.inherit(ImageCanvas, DataBlock)+`
  width    : int;
  height   : int;
  x        : float;
  y        : float;
  dataType : int;
  dpi      : float | this.dpi === undefined ? -1 : this.dpi;
}
`;
  nstructjs.register(ImageCanvas);
  DataBlock.register(ImageCanvas);
}, '/dev/fairmotion/src/paint/imagecanvas.js');


es6_module_define('imagecanvas_draw', ["../path.ux/scripts/pathux.js"], function _imagecanvas_draw_module(_es6_module) {
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector2');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Matrix4');
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  class ImageCanvasDrawer  {
     constructor(canvas) {
      this.canvas = canvas;
      this.matstack = [];
      this.matrix = new Matrix4();
    }
     beginPath() {

    }
     moveTo(x, y) {

    }
     lineTo(x, y) {

    }
     closePath() {

    }
     stroke() {

    }
     fill() {

    }
     bezierCurveTo(x2, y2, x3, y3, x4, y4) {

    }
     quadraticCurveTo(x2, y2, x3, y3) {

    }
     arcTo(x, y, r, th1, th2) {

    }
     rect(x, y, w, h) {

    }
     drawImage(img, dx, dy, dw, dh) {

    }
     blit(img, dx, dy) {

    }
  }
  _ESClass.register(ImageCanvasDrawer);
  _es6_module.add_class(ImageCanvasDrawer);
  ImageCanvasDrawer = _es6_module.add_export('ImageCanvasDrawer', ImageCanvasDrawer);
}, '/dev/fairmotion/src/paint/imagecanvas_draw.js');


es6_module_define('imagecanvas_webgl', ["../webgl/simplemesh.js", "../webgl/shaders.js", "./imagecanvas.js", "../path.ux/scripts/pathux.js", "../webgl/fbo.js", "../webgl/webgl.js", "./imagecanvas_base.js"], function _imagecanvas_webgl_module(_es6_module) {
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector4');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Matrix4');
  var Quat=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Quat');
  var addFastParameterGet=es6_import_item(_es6_module, '../webgl/webgl.js', 'addFastParameterGet');
  var ShaderProgram=es6_import_item(_es6_module, '../webgl/webgl.js', 'ShaderProgram');
  var Texture=es6_import_item(_es6_module, '../webgl/webgl.js', 'Texture');
  var VBO=es6_import_item(_es6_module, '../webgl/webgl.js', 'VBO');
  var gl=undefined;
  gl = _es6_module.add_export('gl', gl);
  var canvas=undefined;
  canvas = _es6_module.add_export('canvas', canvas);
  var ImageDataType=es6_import_item(_es6_module, './imagecanvas.js', 'ImageDataType');
  var TiledImage=es6_import_item(_es6_module, './imagecanvas.js', 'TiledImage');
  var FBO=es6_import_item(_es6_module, '../webgl/fbo.js', 'FBO');
  const DataTypes={HALF_FLOAT: 36193, 
   FLOAT: 5126, 
   UNSIGNED_BYTE: 5121, 
   UNSIGNED_SHORT: 5123, 
   UNSIGNED_INT: 5125}
  _es6_module.add_export('DataTypes', DataTypes);
  const TypeArrays={[DataTypes.HALF_FLOAT]: Uint16Array, 
   [DataTypes.FLOAT]: Float32Array, 
   [DataTypes.UNSIGNED_BYTE]: Uint8Array, 
   [DataTypes.UNSIGNED_SHORT]: Uint16Array, 
   [DataTypes.UNSIGNED_INT]: Uint32Array}
  _es6_module.add_export('TypeArrays', TypeArrays);
  const TypeMuls={[DataTypes.HALF_FLOAT]: 1, 
   [DataTypes.FLOAT]: 1, 
   [DataTypes.UNSIGNED_BYTE]: 255, 
   [DataTypes.UNSIGNED_SHORT]: 65535, 
   [DataTypes.UNSIGNED_INT]: (1<<32)-1}
  _es6_module.add_export('TypeMuls', TypeMuls);
  const GPURecalcFlags={PULL_FROM_GPU: 1}
  _es6_module.add_export('GPURecalcFlags', GPURecalcFlags);
  class ImageMapping  {
     constructor(min, max, bits) {
      let mul=(1<<bits)-1;
      this.min = min;
      this.max = max;
      this.mul = (max-min)/mul;
    }
     map(f) {
      return ~~((f-this.min)*this.mul);
    }
     unmap(f) {
      return f/this.mul+this.min;
    }
  }
  _ESClass.register(ImageMapping);
  _es6_module.add_class(ImageMapping);
  ImageMapping = _es6_module.add_export('ImageMapping', ImageMapping);
  ImageMapping.STRUCT = `
ImageMapping {
  min : float;
  max : float;
  mul : float; 
}
`;
  class FBOCache  {
     constructor() {
      this.cache = new Map();
    }
     get(gl, width, height, type) {
      let key=""+width+":"+height+":"+type;
      let ring=this.cache.get(key);
      if (ring) {
          return ring.next();
      }
      ring = new util.cachering(() =>        {
        return new FBO(gl, width, height);
      }, 4);
    }
     purge(gl=window._gl) {
      for (let ring of this.cache.values()) {
          for (let fbo of ring) {
              fbo.destroy(gl);
          }
      }
      this.cache = new Map();
      return this;
    }
  }
  _ESClass.register(FBOCache);
  _es6_module.add_class(FBOCache);
  FBOCache = _es6_module.add_export('FBOCache', FBOCache);
  const fboCache=new FBOCache();
  _es6_module.add_export('fboCache', fboCache);
  var TILESIZE=es6_import_item(_es6_module, './imagecanvas_base.js', 'TILESIZE');
  var SimpleMesh=es6_import_item(_es6_module, '../webgl/simplemesh.js', 'SimpleMesh');
  var LayerTypes=es6_import_item(_es6_module, '../webgl/simplemesh.js', 'LayerTypes');
  var PrimitiveTypes=es6_import_item(_es6_module, '../webgl/simplemesh.js', 'PrimitiveTypes');
  class GPUImageTile extends ImageDataType {
     constructor(width=TILESIZE, height=TILESIZE) {
      super(width, height);
      this.glType = DataTypes.UNSIGNED_SHORT;
      this.glTex = undefined;
      this.ready = false;
      this.mapping = new ImageMapping(0.0, 4.0, 16);
      this.recalcFlag = 0;
      this.data = undefined;
      this.glTex2 = undefined;
      this.smesh = undefined;
      this.sm_screenCo = undefined;
      this.sm_params = undefined;
    }
     getQuad() {
      if (this.smesh) {
          return this.smesh;
      }
      let lf=LayerTypes;
      let layerflag=lf.LOC|lf.UV|lf.CUSTOM;
      let sm=this.smesh = new SimpleMesh(layerflag);
      this.sm_screenCo = sm.addDataLayer(PrimitiveTypes.TRIS, LayerTypes.CUSTOM, 2, "sm_screenCo");
      this.sm_params = sm.addDataLayer(PrimitiveTypes.TRIS, LayerTypes.CUSTOM, 4, "sm_params");
      let quad=sm.quad([-1, -1, 0], [-1, 1, 0], [1, 1, 0], [1, -1, 0]);
      quad.uvs([0, 0], [0, 1], [1, 1], [1, 0]);
      quad.custom(this.sm_screenCo, [0, 0], [0, this.height], [this.width, this.height], [this.width, 0]);
    }
     _makeTex(gl) {
      let tex=gl.createTexture();
      tex = new Texture(undefined, tex);
      gl.bindTexture(tex.texture);
      let format;
      switch (this.glType) {
        case DataTypes.HALF_FLOAT:
          format = gl.RGBA16F;
          break;
        case DataTypes.FLOAT:
          format = gl.RGBA32F;
          break;
        case DataTypes.UNSIGNED_BYTE:
          format = gl.RGBA8UI;
          break;
        case DataTypes.UNSIGNED_SHORT:
          format = gl.RGBA16UI;
          break;
        case DataTypes.UNSIGNED_INT:
          format = gl.RGBA32I;
          break;
      }
      gl.texStorage2D(tex.target, 0, format, this.width, this.height);
      tex.texParameteri(gl, tex.target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      tex.texParameteri(gl, tex.target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      tex.texParameteri(gl, tex.target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      tex.texParameteri(gl, tex.target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindTexture(null);
      return tex;
    }
     destroy(gl=window._gl) {
      if (this.glTex) {
          this.glTex.destroy(gl);
          this.glTex = undefined;
      }
      if (this.glTex2) {
          this.glTex2.destroy(gl);
          this.glTex2 = undefined;
      }
      this.ready = false;
    }
     init(gl) {
      if (this.ready) {
          return ;
      }
      this.glTex = this._makeTex(gl);
      this.glTex2 = this._makeTex(gl);
      this.ready = true;
    }
     getData() {
      if (this.data) {
          return this.data;
      }
      let cls=TypeArrays[this.glType];
      this.data = new cls(this.width*this.height*4);
      return this.data;
    }
     flagUpdate() {
      this.recalcFlag|=GPURecalcFlags.PULL_FROM_GPU;
    }
     downloadFromGPU(gl=window._gl) {
      if (this.data&&!(this.recalcFlag&GPURecalcFlags.PULL_FROM_GPU)) {
          return ;
      }
      let fbo=fboCache.get(gl, this.width, this.height, this.type);
      fbo.bind(gl);
      gl.clearColor(0, 0, 0, 0);
      gl.clearDepth(1.0);
      gl.disable(gl.BLEND);
      gl.disable(gl.DITHER);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.SCISSOR_TEST);
      gl.depthMask(false);
      fbo.drawQuad(gl, undefined, undefined, this.glTex);
      gl.finish();
      if (this.data===undefined) {
          let cls=TypeArrays[this.glType];
          this.data = new cls(this.width*this.height*4);
      }
      gl.readPixels(0, 0, this.width, this.height, gl.RGBA, this.glType, this.data);
      this.flag&=~GPURecalcFlags.PULL_FROM_GPU;
      fbo.unbind(gl);
    }
     uploadToGPU(gl=window._gl) {
      let data=this.data;
      if (!data) {
          throw new Error("missing image data");
      }
      gl.bindTexture(this.glTex.texture);
      gl.texImage2D(this.glTex.texture, 0, gl.RGBA, this.width, this.height, 0, gl.RGBA, this.glType, this.data);
      gl.bindTexture(null);
    }
     compress() {
      this.downloadFromGPU();
      let data=new Uint8Array(this.data.buffer);
      data = data.slice(0, data.length);
      this.compressedData = data;
      return data;
    }
     decompress(data) {
      return new Promise((accept, reject) =>        {
        if (!(__instance_of(this.compressedData, Uint8Array))) {
            this.data = new Uint8Array(this.compressedData);
        }
        else {
          this.data = this.compressedData.slice(0, this.compressedData.length);
        }
        let cls=TypeArrays[this.glType];
        this.data = new cls(this.data.buffer);
        this.uploadToGPU();
        accept(this);
      });
    }
     swapBuffers() {
      let t=this.glTex;
      this.glTex = this.glTex2;
      this.glTex2 = t;
      return this;
    }
    static  imageDataDefine() {
      return {typeName: "gpu"}
    }
  }
  _ESClass.register(GPUImageTile);
  _es6_module.add_class(GPUImageTile);
  GPUImageTile = _es6_module.add_export('GPUImageTile', GPUImageTile);
  GPUImageTile.STRUCT = nstructjs.inherit(GPUImageTile, ImageDataType, 'imagecanvas.GPUImageTile')+`
  mapping : ImageMapping;
  glType  : int;
}
`;
  nstructjs.register(GPUImageTile);
  ImageDataType.register(GPUImageTile);
  class GPUTiledImage extends TiledImage {
     constructor(width, height) {
      super(width, height);
    }
     checkTiles(gl, tiles) {
      let newtiles=[];
      for (let t of tiles) {
          if (!(__instance_of(t, GPUImageTile))) {
              let t2=new GPUImageTile(t.width, t.height);
              let data=t2.data;
              let color=t.color;
              let r=t2.mapping.map(color[0]);
              let g=t2.mapping.map(color[1]);
              let b=t2.mapping.map(color[2]);
              let a=t2.mapping.map(color[3]);
              for (let i=0; i<data.length; i+=4) {
                  data[i] = r;
                  data[i+1] = g;
                  data[i+2] = b;
                  data[i+3] = a;
              }
              t2.flagUpdate();
              this.tiles.replace(t, t2);
              newtiles.push(t2);
          }
          else {
            newtiles.push(t);
          }
      }
      return newtiles;
    }
     gatherGPUTiles(x, y, r) {
      return this.checkTiles(this.gatherTiles(x, y, r));
    }
     gatherTiles(x, y, r) {
      let rsqr=r*r;
      let ret=[];
      for (let t of this.tiles) {
          let dx=Math.abs(x-t.x);
          dx = Math.min(dx, Math.abs(x-t.x-t.width*0.5));
          let dy=Math.abs(y-t.y);
          dy = Math.min(dy, Math.abs(y-t.y-t.height*0.5));
          let dis=dx*dx+dy*dy;
          if (dis<=rsqr) {
              ret.push(t);
          }
      }
      return ret;
    }
  }
  _ESClass.register(GPUTiledImage);
  _es6_module.add_class(GPUTiledImage);
  GPUTiledImage = _es6_module.add_export('GPUTiledImage', GPUTiledImage);
  var loadShaders=es6_import_item(_es6_module, '../webgl/shaders.js', 'loadShaders');
  function initWebGL() {
    canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    canvas.style["position"] = "fixed";
    canvas.style["z-index"] = "100";
    canvas.style["pointer-events"] = "none";
    gl = window._gl = canvas.getContext("webgl", {alpha: true, 
    desynchronized: true, 
    antialias: false, 
    premultipliedAlpha: false, 
    powerPreference: "high-performance", 
    preserveDrawingBuffer: true, 
    stencil: true, 
    depth: true});
    gl.canvas = canvas;
    let ext=gl.getExtension("OES_texture_half_float");
    gl.getExtension("OES_texture_half_float_linear");
    if (ext) {
        gl.HALF_FLOAT = ext.HALF_FLOAT_OES;
    }
    ext = gl.getExtension("EXT_blend_minmax");
    if (ext) {
        gl.MIN = ext.MIN_EXT;
        gl.MAX = ext.MAX_EXT;
    }
    gl.getExtension("OES_standard_derivatives");
    gl.getExtension('EXT_shader_texture_lod');
    gl.getExtension("OES_texture_float");
    gl.getExtension("OES_texture_float_linear");
    gl.getExtension("EXT_frag_depth");
    ext = gl.getExtension("WEBGL_depth_texture");
    if (ext) {
        gl.UNSIGNED_INT_24_8 = ext.UNSIGNED_INT_24_8_WEBGL;
    }
    ext = gl.getExtension("WEBGL_draw_buffers");
    if (ext) {
        for (let k in ext) {
            let v=ext[k];
            if (k.endsWith("_WEBGL")) {
                k = k.slice(0, k.length-6);
                gl[k] = v;
            }
        }
        gl._drawbuf = ext;
        gl.drawBuffers = function (buffers) {
          return gl._drawbuf.drawBuffersWEBGL(buffers);
        };
    }
    ext = gl.getExtension("OES_vertex_array_object");
    if (ext) {
        gl._vbo = ext;
        gl.createVertexArray = function () {
          return gl._vbo.createVertexArrayOES(...arguments);
        };
        gl.deleteVertexArray = function () {
          return gl._vbo.deleteVertexArrayOES(...arguments);
        };
        gl.isVertexArray = function () {
          return gl._vbo.isVertexArrayOES(...arguments);
        };
        gl.bindVertexArray = function () {
          return gl._vbo.bindVertexArrayOES(...arguments);
        };
    }
    gl.ctxloss = gl.getExtension("WEBGL_lose_context");
    ext = gl.getExtension("EXT_texture_filter_anisotropic");
    if (ext) {
        gl.MAX_TEXTURE_MAX_ANISOTROPY = ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT;
        gl.TEXTURE_MAX_ANISOTROPY = ext.TEXTURE_MAX_ANISOTROPY_EXT;
    }
    gl.srgb = gl.getExtension("EXT_sRGB");
    addFastParameterGet(gl);
    loadShaders(gl);
  }
  initWebGL = _es6_module.add_export('initWebGL', initWebGL);
  let size_update_key="";
  function updateSize() {
    let dpi=devicePixelRatio;
    let w=~~(window.innerWidth*dpi);
    let h=~~(window.innerHeight*dpi);
    let key=w+":"+h+":"+dpi;
    if (size_update_key===key) {
        return ;
    }
    console.log("Updating size", key);
    size_update_key = key;
    canvas.width = w;
    canvas.height = h;
    canvas.style["width"] = (w/dpi)+"px";
    canvas.style["height"] = (h/dpi)+"px";
  }
  updateSize = _es6_module.add_export('updateSize', updateSize);
  let animreq=undefined;
  function draw() {
    animreq = undefined;
    if (!window.g_app_state||!window.g_app_state.screen) {
        return ;
    }
    updateSize();
    console.log("webgl draw!");
    let screen=g_app_state.screen;
    for (let sarea of screen.sareas) {
        let area=sarea.area;
        if (area.constructor.define().hasWebgl) {
            area.drawWebgl(gl, canvas);
        }
    }
  }
  window.redraw_webgl = function () {
    if (animreq!==undefined) {
        return ;
    }
    animreq = requestAnimationFrame(draw);
  }
}, '/dev/fairmotion/src/paint/imagecanvas_webgl.js');


es6_module_define('imagecanvas_base', [], function _imagecanvas_base_module(_es6_module) {
  const TILESIZE=512;
  _es6_module.add_export('TILESIZE', TILESIZE);
}, '/dev/fairmotion/src/paint/imagecanvas_base.js');


es6_module_define('paint_base', [], function _paint_base_module(_es6_module) {
}, '/dev/fairmotion/src/paint/paint_base.js');


es6_module_define('paint_op_base', [], function _paint_op_base_module(_es6_module) {
}, '/dev/fairmotion/src/paint/paint_op_base.js');

