"use strict";

import {toolop_menu} from 'UIMenu';

var PI = Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor,
    ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos,
    asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;

import {aabb_isect_2d, inrect_2d} from 'mathlib';

import {get_2d_canvas, get_2d_canvas_2} from 'UICanvas2D';
import {NoteFrame} from 'notifications';
import {STRUCT} from 'struct';
import {Area} from 'ScreenArea';
import {SelMask, ToolModes} from 'selectmode';
import {UIRadialMenu} from 'RadialMenu';
import * as video from 'video';

import {PackFlags, UIFlags} from 'UIElement';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, KeyHandler, 
        charmap, TouchEventManager, EventHandler} from 'events';

import * as view2d_editor from 'view2d_editor';
export var EditModes = view2d_editor.EditModes;

var ibuf_idgen = new EIDGen();
ibuf_idgen.gen_id();

//stupid statics
var __v3d_g_s = [];
var _v3d_static_mat = new Matrix4();
var bleh_bleh = 0;
var icon_tst_k = 0;

import {SessionFlags} from 'view2d_editor';
import {CurveRootFinderTest} from 'spline_editops';

import {ToolOp, UndoFlags, ToolFlags, ModalStates} from 'toolops_api';
import {ExtrudeModes} from 'spline_createops';

function delay_redraw(ms) {
    var start_time = time_ms();
    var timer = window.setInterval(function() {
        if (time_ms() - start_time < ms)
            return;
         
        window.clearInterval(timer);
        window.redraw_viewport();
    }, 20);
}
  
class PanOp extends ToolOp {
  constructor(start_mpos) {
    ToolOp.call(this);
    
    this.is_modal = true;
    this.undoflag |= UndoFlags.IGNORE_UNDO;
    
    if (start_mpos != undefined) {
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
  
  start_modal(ctx) {
    this.start_cameramat = new Matrix4(ctx.view2d.cameramat);
  }
  
  on_mousemove(event) {
    var mpos = new Vector3([event.x, event.y, 0]);
    
    //console.log("mousemove!");
    
    if (this.first) {
      this.first = false;
      this.start_mpos.load(mpos);
      
      return;
    }
    
    var ctx = this.modal_ctx;
    mpos.sub(this.start_mpos).mulScalar(1.0/ctx.view2d.zoom);
    
    this.cameramat.load(this.start_cameramat).translate(mpos[0], mpos[1], 0.0);
    ctx.view2d.set_cameramat(this.cameramat);
    
    //console.log("panning");
    window.force_viewport_redraw();
    window.redraw_viewport();
  }
  
  on_mouseup(event) {
    this.end_modal();
  }
}

class drawline {
  constructor(Vector3 co1, Vector3 co2, String group) {
    this.v1 = new Vector3(co1);
    this.v2 = new Vector3(co2);
    this.group = group;
    
    this.clr = [0.4, 0.4, 0.4, 1.0];
    this.width = 1;
  }

  set_clr(Array<float> clr) {
    this.clr = clr;
  }
}

class IndexBufItem {
  constructor(int id, Object owner) {
    this.user_id = id;
  }
}

import {SplineEditor} from 'view2d_spline_ops';
import {ColumnFrame, RowFrame} from 'UIPack';
import {UIMenuLabel, UIButtonIcon} from 'UIWidgets';
import {UIMenu} from 'UIMenu';
import {UITabPanel} from 'UITabPanel';

import {ImageUser} from 'imageblock';

export class View2DHandler extends Area {
   constructor(WebGLRenderingContext gl, Mesh mesh, ShaderProgram vprogram, ShaderProgram fprogram, 
               DrawMats drawmats, int x, int y, int width, 
               int height, int znear=0.75, int zfar = 200.0) 
  {
    static int v3d_id = 0;
   
    this.toolmode = ToolModes.APPEND;
    this.draw_small_verts = false;
    
    this.pinned_paths = undefined;
    
    this.background_image = new ImageUser();
    this.draw_bg_image = true;
    
    this.work_canvas = undefined;
    
    this.default_linewidth = 2.0;
    this.cameramat = new Matrix4();
    
    //final matrix, combined with zoom matrix
    this.rendermat = new Matrix4();
    this.irendermat = new Matrix4();
    
    this.zoom = 1;
    
    Object.defineProperty(this, "active_material", {
      configurable : true,
      enumerable   : true,
      get : function() {
        var ctx = this.ctx;
        if (ctx == undefined) return undefined;
        
        var spline = ctx.spline;
        var act = this.selectmode & SelMask.SEGMENT ? spline.segments.active : spline.faces.active;
        
        if (act != undefined)
          return act.mat;
      }
    });
    
    this.extrude_mode = ExtrudeModes.SMOOTH;
    
    this.draw_video = false;
    this.enable_blur = true;
    this.draw_faces = true;
    
    this._only_render = false;
    this._draw_normals = false;
    this.tweak_mode = false;
    
    this.draw_viewport = true;
    this.draw_anim_paths = false;
    
    this._id = v3d_id++;
    this.topbar = undefined;
    
    this.drawlines = new GArray();
    this.drawline_groups = {};
    
    this._can_select = true;
    this.flagprop = 1;
    
    this.startup_time = time_ms();
    
    this.screen = undefined : Screen;
    this.ui_canvas = null;
    this.framerate = 0.1;
    this.last_selectmode = 0;
    
    this.session_flag = 0;
    this.propradius = 80;
    
    this._in_from_struct = false;
    this.use_radial_menus = false;
    
    this._selectmode = 1;

    this.asp = width / height;
    this.last_tick = time_ms()
    
    this.mpos = new Vector2([0, 0]);
    this._mstart = null;
    
    this.shift = false;
    this.alt = false;
    this.ctrl = false;
    
    this.tools_define = {}
    
    Area.call(this, View2DHandler.name, "3D Viewport", new Context(), [x, y], [width, height]);
    
    this.keymap = new KeyMap()
    this.define_keymap();
    
    this.editor = new SplineEditor(this);
    this.editors = new GArray([this.editor]);
    
    this.touch_delay = 80;
  }
  
  get visible_paths() {
    if (this.pinned_paths != undefined) {
      
    } else {
      
    }
  }
  
  get pin_paths() {
    return this.pinned_paths != undefined;
  }
  
  set pin_paths(state) {
    if (!state) {
      this.pinned_paths = undefined;
      if (this.ctx != undefined && this.ctx.frameset != undefined) {
        this.ctx.frameset.switch_on_select = true;
        this.ctx.frameset.update_visibility();
      }
    } else {
      var spline = this.ctx.frameset.spline;
      
      var eids = [];
      for (var v of spline.verts.selected.editable) {
        eids.push(v.eid);
      }
      
      this.pinned_paths = eids;
      this.ctx.frameset.switch_on_select = false;
    }
  }
  get draw_normals() {
    return this._draw_normals;
  }  
  set draw_normals(val) {
    if (val != this._draw_normals) {
      this.draw_viewport = 1;
    }
    
    this._draw_normals = val;
  }
  
  get draw_anim_paths() {
    return this._draw_anim_paths;
  }  
  set draw_anim_paths(val) {
    if (val != this._draw_anim_paths) {
      this.draw_viewport = 1;
    }
    
    this._draw_anim_paths = val;
  }

  get only_render() {
    return this._only_render;
  }  
  set only_render(val) {
    if (val != this._only_render) {
      this.draw_viewport = 1;
    }
    
    this._only_render = val;
  }
  
  push_modal(EventHandler e) {
    this.push_touch_delay(1);
    
    prior(View2DHandler, this).push_modal.call(this, e);
  }
  
  pop_modal(EventHandler e) {
    if (this.modalhandler != undefined)
      this.pop_touch_delay();
    
    //paranoid check
    if (this.modalhandler == undefined) {
      this.touch_delay_stack = [];
    }
    
    prior(View2DHandler, this).pop_modal.call(this, e);
  }
  
  _get_dl_group(group) {
    if (group == undefined)
      group = "main";
      
    if (!(group in this.drawline_groups)) {
      this.drawline_groups[group] = new GArray();
    }
    
    return this.drawline_groups[group];
  }
  
  make_drawline(v1, v2, group="main") {
    var drawlines = this._get_dl_group(group);
    
    var dl = new drawline(v1, v2, group);
    drawlines.push(dl);
    
    static min = [0, 0], max = [0, 0];
    
    var pad = 5;
    
    min[0] = Math.min(v1[0], v2[0])-pad;
    min[1] = Math.min(v1[1], v2[1])-pad;
    max[0] = Math.max(v1[0], v2[0])+pad;
    max[1] = Math.max(v1[1], v2[1])+pad;
    
    redraw_viewport(min, max);
    
    return dl;
  }
  
  kill_drawline(dl) {
    var drawlines = this._get_dl_group(dl.group);
    drawlines.remove(dl);
  }
  
  reset_drawlines(group="main") {
    var drawlines = this._get_dl_group(group);
    
    drawlines.reset();
  }
  
  get_keymaps() {
    var ret = [this.keymap];
    
    var maps = this.editor.get_keymaps();
    for (var i=0; i<maps.length; i++) {
      ret.push(maps[i]);
    }
    
    return ret;
  }
  
  //XXX need to implement this still
  get can_select() {
    return this._can_select;
  }
  
  set can_select(int val) {
    this._can_select = !!val;
  }
  
  static fromSTRUCT(Function reader) {
    var v3d = new View2DHandler()
    v3d._in_from_struct = true;
    
    reader(v3d)
    
    if (v3d.pinned_paths != undefined && v3d.pinned_paths.length == 0)
      v3d.pinned_paths = undefined;
    
    if (v3d.editor == undefined) {
      console.log("WARNING: corrupted View2DHandler sturct data");
      v3d.editor = v3d.editors[0];
    } else {
      v3d.editor = v3d.editors[v3d.editor];
    }
    
    v3d._in_from_struct = false;
    
    return v3d;
  }
  
  get selectmode() {
    return this._selectmode;
  }
  
  set selectmode(Boolean val) {
    this._selectmode = val;
    
    if (!this._in_from_struct)
      this.set_selectmode(val);
  }
  
  data_link(DataBlock block, Function getblock, Function getblock_us) {
    this.ctx = new Context();
    
    this.background_image.data_link(block, getblock, getblock_us);
  }

  [Symbol.keystr]() : String {
    return this.constructor.name + this._id;
  }

  set_canvasbox() {
    this.asp = this.size[0] / this.size[1];
  }

  set_cameramat(mat=undefined) {
    var cam = this.cameramat, render = this.rendermat, zoom = new Matrix4();
    
    if (mat != undefined)
      cam.load(mat);

    zoom.translate(this.size[0]/2, this.size[1]/2, 0);
    zoom.scale(this.zoom, this.zoom, this.zoom);
    zoom.translate(-this.size[0]/2, -this.size[1]/2, 0);
    
    render.makeIdentity();
    
    render.multiply(zoom);
    render.multiply(cam);
    
    this.irendermat.load(this.rendermat).invert();
  }
  
  project(Vector3 co) {
    static _co = new Vector3();
    
    _co.load(co);
    _co[2] = 0.0;
    _co.multVecMatrix(this.rendermat);
    
    co[0] = _co[0], co[1] = _co[1];
    return co;
  }
  
  unproject(Vector3 co) {
    static _co = new Vector3();
    
    _co.load(co);
    _co[2] = 0.0;
    _co.multVecMatrix(this.irendermat);
    
    co[0] = _co[0], co[1] = _co[1];
    return co;
  }
  
  do_select(MouseEvent event, Array<float> mpos, 
            View2DHandler view2d, Boolean do_multiple=false) 
  {
    return this.editor.do_select(event, mpos, view2d, do_multiple);
  }
  
  do_alt_select(MouseEvent event, Array<float> mpos, View2DHandler view2d) {
    return this.editor.do_alt_select(event, mpos, view2d);
  }
  
  tools_menu(Context ctx, Array<float> mpos) {
    this.editor.tools_menu(ctx, mpos, this);
  }


  toolop_menu(Context ctx, String name, Array<String> ops) {
    if (ops.length > 1 && this.use_radial_menus) {
      return toolop_radial_menu(ctx, name, ops);
    } else {
      return toolop_menu(ctx, name, ops);
    }
  }

  call_menu(Object menu, UIFrame frame, Array<float> pos) {
    if (menu instanceof UIRadialMenu) {
      return ui_call_radial_menu(menu, frame, pos);
    } else if (menu instanceof UIMenu) {
      return ui_call_menu(menu, frame, pos);
    }
  }

  rightclick_menu(MouseEvent event) {
    this.editor.rightclick_menu(event, this);
  }
  
  on_mousedown(MouseEvent event) {
    if (this.bad_event(event))
      return;
    
    if (prior(View2DHandler, this).on_mousedown.call(this, event))
      return;
    
    if (event.button == 0) {
      var selfound = false;
      var is_middle = event.button == 1 || (event.button == 2 && g_app_state.screen.ctrl);
      
      var tottouch = g_app_state.screen.tottouch;
      
      if (tottouch >= 2) {
        console.log("Touch screen rotate/pan/zoom combo");
        //XXX g_app_state.toolstack.exec_tool(new ViewRotateZoomPanOp());
      } else if (is_middle && this.shift) {
        console.log("Panning");
        //XXX g_app_state.toolstack.exec_tool(new ViewPanOp());
      } else if (is_middle) { //middle mouse
        //XXX g_app_state.toolstack.exec_tool(new ViewRotateOp());
      //need to add mouse keymaps to properly handle this next one
      } else if (event.button == 0 && event.altKey) {
        this.on_mousemove(event);
        
        this._mstart = new Vector2(this.mpos);
        selfound = this.do_alt_select(event, this.mpos, this);
      } else if (event.button == 0) {
        this.on_mousemove(event);
        
        this._mstart = new Vector2(this.mpos);
        selfound = this.do_select(event, this.mpos, this, this.shift|g_app_state.select_multiple); 
        
        this.editor.selectmode = this.selectmode;
        
        if (!selfound) {
          if (this.editor.on_mousedown(event)) return;
        }
      }
    }
    
    if (event.button == 2 && !g_app_state.screen.shift && !g_app_state.screen.ctrl && !g_app_state.screen.alt) {
      var tool = new PanOp();
      
      g_app_state.toolstack.exec_tool(tool);
      //this.rightclick_menu(event);
    }
  }

  on_mouseup(MouseEvent event) {
    if (this.bad_event(event))
      return;
      
    this._mstart = null;
    
    if (prior(View2DHandler, this).on_mouseup.call(this, event))
      return;
      
    if (this.editor.on_mouseup(event)) return;
  }

  on_mousemove(MyMouseEvent event) {
    var mpos = new Vector3([event.x, event.y, 0])
    this.mpos = mpos;
      
    var this2 = this;
    function switch_on_multitouch(TranslateOp op, MouseEvent event, cancel_func) {
      if (g_app_state.screen.tottouch > 1) {
        this2._mstart = null;
        cancel_func();
        //XXX g_app_state.toolstack.exec_tool(new ViewRotateZoomPanOp());
      }
  
    if (this._mstart != null) {
      var vec = new Vector2(this.mpos);
      vec.sub(this._mstart);
    
      /*handle drag translate*/
      if (vec.vectorLength() > 10) {
        this._mstart = null;
        return; //XXX
        
        var top = new TranslateOp(EditModes.GEOMETRY);
        
        /*callback to cancel drag translate if 
          multiple touch hotspots show up.
         */
        }
        
        top.cancel_callback = switch_on_multitouch;
        g_app_state.toolstack.exec_tool(top);
        this._mstart = null;
        
        return;
      }
    }
    
    if (super.on_mousemove(event)) {
        return;
    }
    this.editor.on_mousemove(event);
  }
  
  //assumes event has had this._offset_mpos called on it
  /*
  _find_active(MouseEvent e) {
    var mpos = [e.x, e.y];
    
    static pos = [0, 0];
    
    var found = false;
    for (var i=this.children.length-1; i >= 0; i--) {
      var c = this.children[i];
      
      pos[0] = c.pos[0], pos[1] = c.pos[1];
      
      console.log((this.state & UIFlags.HAS_PAN), (c.state & UIFlags.HAS_PAN));
      
      if (c.state & UIFlags.HAS_PAN) {
        //console.trace();
  //      pos[0] += c.velpan.pan[0];
//        pos[1] += c.velpan.pan[1];
      }
      
      if (inrect_2d(mpos, pos, c.size)) {
        found = true;
        if (this.active != c && this.active != undefined) {
          this.active.state &= ~UIFlags.HIGHLIGHT;
          this.active.on_inactive();
          this.active.do_recalc();
        }
        
        if (this.active != c) {
          //console.log("active", c.constructor.name);
          
          c.state |= UIFlags.HIGHLIGHT;
          c.on_active();
          c.do_recalc();
          this.active = c;      
        }
        
        break;
      }
    }
    
    if (!found && this.active != undefined) {
      //console.log("inactive", get_type_name(this))
      this.active.state &= ~UIFlags.HIGHLIGHT;
      this.active.on_inactive();
      this.active.do_recalc();
      this.active = undefined;
    }
  }//*/
  
  set_zoom(zoom) {
     "zoom set!";

    this.zoom = zoom;
    this.set_cameramat();
    
    window.redraw_viewport();
  }
  
  change_zoom(delta) {
    
  }
  
  on_mousewheel(MouseEvent event, float delta) {
    this.change_zoom(delta)
  }

  on_tick() {
    this.editor.on_tick(this.ctx);
    prior(View2DHandler, this).on_tick.call(this);
    
    //wait 3 seconds before loading video
    if (this.draw_video && (time_ms() - this.startup_time) > 300) {
      this.video = video.manager.get("/video.mp4");
      
      if (this.video_time != this.ctx.scene.time) {
        this.video_time = this.ctx.scene.time;
        window.force_viewport_redraw();
      }
    }
  }
  
  on_view_change() {
  }

  do_draw_viewport(g) {
    if (g == undefined) {
      g = this.canvas.get_canvas(this, this.abspos, this.size, 0);
      //g = get_2d_canvas_2().ctx;
    }
    
    g._render_mat = this.rendermat;
    g._irender_mat = this.irendermat;
    
    var lr = window.last_redraw_rect;
    var r = window.redraw_rect;

    var w = this.parent.size[0];
    var h = this.parent.size[1];
    
    static r2 = [new Vector3(), new Vector3()];
    
    for (var i=0; i<3; i++) {
      if (lr[0][0] != 0.0 || lr[1][0] != w) {
        r2[0][i] = Math.min(lr[0][i], r[0][i]);
        r2[1][i] = Math.max(lr[1][i], r[1][i]);
      } else {
        r2[0][i] = r[0][i];
        r2[1][i] = r[1][i];
      }
    }
    
    /*
    g.fillStyle = "rgba(25, 25, 25, 0.1)";
    g.beginPath();
    g.clearRect(r2[0][0], r2[0][1], r2[1][0]-r2[0][0], r2[1][1]-r2[0][1]);
    */
    //g.fill();
    
    //if (window.redraw_rect != undefined)
    //  console.log(window.redraw_rect[0], window.redraw_rect[1]);
    
    //XXX clause doesn't work
    if (0 && window.redraw_whole_screen) {
      g.beginPath();
      if (g._clearRect != undefined) {
        //g._clearRect(0, 0, this.size[0], this.size[1]);
      }
    } else {
      var m = -2;
      
      g.beginPath();
      g.clearRect(r2[0][0]-m, r2[0][1]-m, r2[1][0]-r2[0][0]+m*2, r2[1][1]-r2[0][1]+m*2);
      
      if (DEBUG != undefined && DEBUG.viewport_partial_update) {
        g.beginPath();
        g.lineWidth = 2*this.zoom;
        g.rect(r2[0][0]-m, r2[0][1]-m, r2[1][0]-r2[0][0]+m*2, r2[1][1]-r2[0][1]+m*2);
        g.closePath();
        g.strokeStyle = "black";
        g.stroke();
        //*/
      }
      
      g.save();

      //make a passpart
      //this check here is evilly hackish! 
      if (r[0][0] != 0.0) { 
        g.beginPath();
        var m = 0;
        g.rect(r2[0][0]-m, r2[0][1]-m, r2[1][0]-r2[0][0]+m*2, r2[1][1]-r2[0][1]+m*2);
        g.closePath();
        g.clip();
      }
    }    
    
    for (var i=0; i<2; i++) {
      for (var j=0; j<3; j++) {
        window.redraw_rect_combined[i][j] = r2[i][j];
      }
    }
    
    this.ctx = new Context();
    
    if (this.ctx.frameset == undefined) {
      g.restore();
      return;
    }
    
    if (this.draw_video && this.video != undefined) {
      var frame = Math.floor(this.video_time);
      var image = this.video.get(frame);
      if (image != undefined) {
        //console.log("image", image);
        
        g.drawImage(image, 0, 0);
        //g.putImageData(imagedata, 0, -imagedata.height);
      }
    }
    
    //get_dom_image
    if (this.draw_bg_image && this.background_image.image != undefined) {
      var img = this.background_image.image.get_dom_image();
      var iuser = this.background_image;
      
      g.drawImage(img, iuser.off[0], iuser.off[1], img.width*iuser.scale[0], img.height*iuser.scale[1]);
    }
    
    this.ctx.frameset.draw(this.ctx, g, this);
    
    var frameset = this.ctx.frameset;
    var spline = frameset.spline;
    
    var actspline = this.ctx.spline;
    var pathspline = this.ctx.frameset.pathspline;
    
    if (this.draw_anim_paths) {
      if (this.only_render && pathspline.resolve) {
        pathspline.solve();
      } else if (!this.only_render) {
        for (var v of spline.verts.selected) {
          if (!(v.eid in frameset.vertex_animdata)) continue;
          
          var vdata = frameset.vertex_animdata[v.eid];
          var alpha = vdata.spline === actspline ? 1.0 : 0.2;
        
          vdata.draw(g, alpha, this.ctx.frameset.time);
        } 
        
        pathspline.layerset.active = pathspline.layerset.idmap[this.ctx.frameset.templayerid];
        pathspline.draw(g, this, this.selectmode, this.only_render, this.draw_normals, alpha, true, this.ctx.frameset.time);
      }
    } else {
      if (pathspline.resolve) {
        pathspline.solve();
        
        console.log("solved pathspline", pathspline.resolve);
        pathspline.resolve = 0;
      }
    }
    
    this.editor.ctx = this.ctx;
    
    var fl = Math.floor;
    for (var k in this.drawline_groups) {
      for (var dl of this.drawline_groups[k]) {
        var a = dl.clr[3] != undefined ? dl.clr[3] : 1.0;
        
        g.strokeStyle = "rgba("+fl(dl.clr[0]*255)+","+fl(dl.clr[1]*255)+","+fl(dl.clr[2]*255)+","+a+")";
        g.lineWidth = dl.width;
        
        g.beginPath()
        g.moveTo(dl.v1[0], dl.v1[1]);
        g.lineTo(dl.v2[0], dl.v2[1]);
        g.stroke();
      }
    }
    
    g.restore();
  }
  
  build_draw(canvas, isvertical) {
    Area.prototype.build_draw.call(this, canvas, isvertical);
    
    this.editor.view2d = this;
    
    this.ctx = this.editor.ctx = new Context();
    
    //var g = get_2d_canvas_2().ctx;
    this.abspos[0] = this.abspos[1] = 0.0;
    this.abs_transform(this.abspos);
    
    var g = this.canvas.get_canvas(this, this.abspos, this.size, 0);
    this.draw_canvas_ctx = g;
    
    //var g = get_2d_canvas_2().ctx;
    
    //ensure we have sane dimensions
    //*
    if (g.width != this.size[0] || g.height != this.size[1])
      this.draw_viewport = true;
    
    if (g.width != this.size[0])
      g.width = this.size[0];
    if (g.height != this.size[1]) 
      g.height = this.size[1];
    //*/
    
    //draw viewport
    if (this.draw_viewport) {
      this.draw_viewport = false;
      this.do_draw_viewport(g);
    }
  }
  
  undo_redo(RowFrame row) {
    var ctx = this.ctx;
    
    var col = row.col();
    var row2 = col.row();
    
    var undo = new UIButtonIcon(ctx, "Undo", Icons.UNDO);
    undo.hint = "  Hotkey : CTRL-Z"
    undo.callback = function() {
      g_app_state.toolstack.undo();
    }
    
    row2.add(undo);
    var row2 = col.row();
    
    var redo = new UIButtonIcon(ctx, "Redo", Icons.REDO);
    redo.hint = "  Hotkey : CTRL-SHIFT-Z"
    redo.callback = function() {
      g_app_state.toolstack.redo();
    }
    row2.add(redo);
  }
  
  define_keymap() {
    var k = this.keymap;
    
    k.add(new KeyHandler("Z", ["CTRL", "SHIFT"], "Redo"), new FuncKeyHandler(function(ctx) {
      console.log("Redo")
      ctx.toolstack.redo();
    }));
    k.add(new KeyHandler("Y", ["CTRL"], "Redo"), new FuncKeyHandler(function(ctx) {
      console.log("Redo")
      ctx.toolstack.redo();
    }));
    k.add(new KeyHandler("Z", ["CTRL"], "Undo"), new FuncKeyHandler(function(ctx) {
      console.log("Undo");
      ctx.toolstack.undo();
    }));
    
    k.add(new KeyHandler("O", [], "Toggle Proportional Transform"), new FuncKeyHandler(function(ctx) {
      console.log("toggling proportional transform");
      ctx.view2d.session_flag ^= SessionFlags.PROP_TRANSFORM;
    }));
    
    k.add(new KeyHandler("K", [], ""), new FuncKeyHandler(function(ctx) {
      g_app_state.toolstack.exec_tool(new CurveRootFinderTest());
    }));
    
    k.add(new KeyHandler("Right", [], ""), new FuncKeyHandler(function(ctx) {
      console.log("Frame Change!", ctx.scene.time+1);
      ctx.scene.change_time(ctx, ctx.scene.time+1);

      window.redraw_viewport();
      //var tool = new FrameChangeOp(ctx.scene.time+1);
    }));
    
    k.add(new KeyHandler("Left", [], ""), new FuncKeyHandler(function(ctx) {
      console.log("Frame Change!", ctx.scene.time-1);
      ctx.scene.change_time(ctx, ctx.scene.time-1);
      
      window.redraw_viewport();
      //var tool = new FrameChangeOp(ctx.scene.time-1);
    }));
    
    /*k.add(new KeyHandler("I", ["CTRL"], "Toggle Generator Debug"), new FuncKeyHandler(function(ctx) {
      console.log("Toggling frame debug")
      _do_frame_debug ^= 1;
      test_nested_with();
    }));*/
    
    k.add(new KeyHandler("Up", [], "Frame Ahead 10"), new FuncKeyHandler(function(ctx) {
      //flip_max++;
      global debug_int_1;
      
      debug_int_1++;

      ctx.scene.change_time(ctx, ctx.scene.time+10);

      window.force_viewport_redraw();
      window.redraw_viewport();
      console.log("debug_int_1: ", debug_int_1);
    }));
    k.add(new KeyHandler("Down", [], "Frame Back 10"), new FuncKeyHandler(function(ctx) {
      //flip_max--;
      global debug_int_1;
      
      debug_int_1--;
      debug_int_1 = Math.max(0, debug_int_1);

      ctx.scene.change_time(ctx, ctx.scene.time-10);

      window.force_viewport_redraw();
      window.redraw_viewport();
      console.log("debug_int_1: ", debug_int_1);
    }));
  }
  
  _on_keyup(KeyboardEvent event) {
    this.shift = this.editor.shift = event.shiftKey;
    this.alt = this.editor.alt = event.altKey;
    this.ctrl = this.editor.ctrl = event.ctrlKey;
    
    prior(View2DHandler, this)._on_keyup.call(this, event);
  }

  static default_new(Context ctx, ScreenArea scr, WebGLRenderingContext gl, 
                     Array<float> pos, Array<float> size) {
    var ret = new View2DHandler(undefined, ctx.mesh, undefined, undefined, 
                               new DrawMats(), pos[0], pos[1], size[0], 
                               size[1], 0.75, 100000);
    return ret;
  }
  
  area_duplicate()
  {
    var cpy = new View2DHandler(undefined, undefined, undefined, undefined, undefined, 0, 0, this.size[0], this.size[1], undefined, undefined);
    
    cpy.ctx = new Context();
    
    cpy.editors = new GArray();
    cpy.editor = undefined;
    for (var e of this.editors) {
      var e2 = e.editor_duplicate(cpy);
      
      cpy.editors.push(e2);
      if (e == this.editor)
        cpy.editor = e2;
    }
    
    if (cpy.editor == undefined) {
      cpy.editor = cpy.editors[0];
    }
    
    return cpy
  }

  gen_file_menu(Context ctx, uimenulabel)
  {
    return toolop_menu(ctx, "",    
      [
      "appstate.export_svg()",
      "sep",
      "appstate.save_as()", 
      "appstate.save()", 
      "appstate.open_recent()",
      "appstate.open()",
      "sep",
      "appstate.new()"
      ]);
  }
  
  gen_session_menu(Context ctx, uimenulabel)
  {
    function callback(entry) {
      console.log(entry);
      if (entry.i == 0) {
        console.log("logging out");
        g_app_state.session.logout_simple();
      } else if (entry.i == 1) {
        g_app_state.set_startup_file();
      }
    }
    
    var menu = new UIMenu("", callback);
    
    menu.add_item("Log out", "");
    menu.add_item("Save Default File", "CTRL-ALT-U");
    
    return menu;
  }
  
  gen_tools_menu(Context ctx, uimenulabel)
  {
    return toolop_menu(ctx, "", []);
  }

  destroy() 
  {
    super.destroy();
    
    if (this.canvas != undefined)
      this.canvas.kill_canvas(this);
  }
  
  on_area_inactive()
  {
    this.destroy();
    this.editor.on_area_inactive(this);
    
    Area.prototype.on_area_inactive.call(this);
  }
  
  on_area_active()
  {
    if (this.canvas != undefined)
      this.canvas.reset();
    
    for (var e of this.editors) {
      e.canvas = this.canvas;
    }
    
    Area.prototype.on_area_active.call(this);
  }

  build_bottombar() {
    this.editor.build_bottombar(this);
  }

  build_sidebar1() {
    this.ctx = new Context();
    
    var panel = new RowFrame(this.ctx);
    
    this.sidebar1 = panel;
    panel.packflag |= PackFlags.IGNORE_LIMIT|PackFlags.NO_AUTO_SPACING
                   | PackFlags.ALIGN_LEFT | PackFlags.INHERIT_WIDTH;
    panel.pad = [1, 1];
    
    panel.size = [Area.get_barhgt()*3, this.size[1]];
    panel.draw_background = true;
    panel.rcorner = 100.0;
    panel.pos = [0, Area.get_barhgt()*3];
    
    var tabs = new UITabPanel(this.ctx);
    tabs.packflag |= PackFlags.INHERIT_WIDTH;
    
    panel.add(tabs);
    tabs.pad = [1, 1];
    
    var tools = tabs.panel("Tools");
    tools.prop("view2d.toolmode", 
               PackFlags.USE_LARGE_ICON | PackFlags.ENUM_STRIP |
               PackFlags.VERTICAL_ENUM_STRIP
               );
    
    var undo = new UIButtonIcon(this.ctx, "Undo", Icons.UNDO);
    undo.hint = "  Hotkey : CTRL-Z"
    undo.callback = function() {
      g_app_state.toolstack.undo();
      delay_redraw(50); //stupid hack to deal with async nacl spline solve
    }
    tools.add(undo);

    var redo = new UIButtonIcon(this.ctx, "Redo", Icons.REDO);
    redo.hint = "  Hotkey : CTRL-SHIFT-Z"
    redo.callback = function() {
      g_app_state.toolstack.redo();
      delay_redraw(50); //stupid hack to deal with async nacl spline solve
    }
    
    tools.add(redo);
    tools.toolop("view2d.circle_select()", PackFlags.USE_LARGE_ICON);
    tools.toolop("spline.toggle_select_all()", PackFlags.USE_LARGE_ICON);
    
    var display = tabs.panel("Display");
    display.prop("view2d.only_render");
    display.prop("view2d.draw_small_verts");
    display.prop("view2d.draw_normals");
    display.prop("view2d.draw_anim_paths");
    display.prop("view2d.extrude_mode");
    display.prop("view2d.enable_blur");
    display.prop("view2d.draw_faces");
    
//    try {
    display.prop("view2d.selectmask[HANDLE]");
  //  } catch (error) {
     // print_stack(error);
   // }
    
    display.prop("view2d.pin_paths");

    var img = tabs.panel("Image");
    img.prop('view2d.draw_bg_image');
    img.prop('view2d.background_image.image');
    img.toolop("image.load_image(datapath='view2d.background_image.image')")
    img.prop('view2d.background_image.off');
    img.prop('view2d.background_image.scale');
    
    this.add(panel);
    this.cols.push(panel);
    
    this.editor.build_sidebar1(this, panel);
  }
  
  build_topbar()
  {
    this.ctx = new Context();
    
    var col = new ColumnFrame(this.ctx, undefined, PackFlags.ALIGN_LEFT);
    
    this.topbar = col;
    col.packflag |= PackFlags.IGNORE_LIMIT|PackFlags.NO_AUTO_SPACING;
    
    col.size = [this.size[0], Area.get_barhgt()];
    col.draw_background = true;
    col.rcorner = 100.0;
    col.pos = [0, this.size[1]-Area.get_barhgt()];
    
    col.label("                      ");
    var iconflag = IsMobile ? PackFlags.USE_LARGE_ICON : PackFlags.USE_SMALL_ICON;
    col.toolop("screen.hint_picker()", iconflag, "?");

    col.prop("scene.frame");
    
    var this2 = this;
    function gen_edit_menu() {
      return this2.editor.gen_edit_menu();
    }
    
    col.add(new UIMenuLabel(this.ctx, "File", undefined, this.gen_file_menu));
    col.add(new UIMenuLabel(this.ctx, "Session", undefined, this.gen_session_menu));
    col.add(new UIMenuLabel(this.ctx, "Edit", undefined, gen_edit_menu));
    
    this.note_area = new NoteFrame(this.ctx, g_app_state.notes);
    col.add(this.note_area);
    
    col.prop("view2d.zoom");
    col.prop("view2d.default_linewidth");
    
    this.rows.push(col);
    this.add(col);
  }

  switch_editor(View2DEditor editortype) {
    if (editortype == undefined) {
      console.log("Undefined passed to switch_editor()");
      return;
    }
    
    var editor = undefined;
    for (var e of this.editors) {
      if (e instanceof editortype) {
        editor = e;
        break;
      }
    }
    
    if (editor == undefined) {
      editor = new editortype(this);
      this.editors.push(editor);
    }
    
    this.editor.on_inactive(this);
    this.editor = editor;
    editor.on_active(this);
    editor.gl = this.gl;
    
    for (var c of list(this.cols)) {
      this.remove(c);
    }
    for (var c of list(this.rows)) {
      this.remove(c);
    }
    
    this.cols = new GArray();
    this.rows = new GArray();
    
    this.build_topbar();
    this.editor.build_bottombar(this);
    this.editor.build_sidebar1(this);
    
    this.do_recalc();
    redraw_viewport();
  }
  
  ensure_editor(View2DEditor editortype) {
    if (!(this.editor instanceof editortype))
      this.switch_editor(editortype);
  }
  
  set_selectmode(int mode) {
    this._selectmode = mode;
    this.editor.set_selectmode(mode);
    redraw_viewport();
  }
}

View2DHandler.STRUCT = STRUCT.inherit(View2DHandler, Area) + """
    _id             : int;
    _selectmode     : int;
    rendermat       : mat4;
    irendermat      : mat4;
    cameramat       : mat4;
    only_render     : int;
    draw_anim_paths : int;
    draw_normals    : int;
    editors         : array(abstract(View2DEditor));
    editor          : int | obj.editors.indexOf(obj.editor);
    zoom            : float;
    tweak_mode        : int;
    default_linewidth : float;
    extrude_mode      : int;
    enable_blur       : int;
    draw_faces        : int;
    draw_video        : int;
    pinned_paths      : array(int) | obj.pinned_paths != undefined ? obj.pinned_paths : [];
    background_image  : ImageUser;
    draw_bg_image     : int;
    toolmode          : int;
    draw_small_verts  : int;
  }
"""

View2DHandler.uiname = "Work Canvas";
