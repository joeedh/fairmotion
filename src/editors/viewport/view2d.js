import {Editor} from '../editor_base.js';
import {Area} from '../../path.ux/scripts/screen/ScreenArea.js';
import {patchMouseEvent, ToolOp, UndoFlags} from '../../core/toolops_api.js';
import {KeyMap, ToolKeyHandler, FuncKeyHandler, HotKey,
  charmap, TouchEventManager, EventHandler} from "../events.js";
import {STRUCT} from '../../core/struct.js';
import {UIBase} from '../../path.ux/scripts/core/ui_base.js';
import {createMenu, startMenu} from '../../path.ux/scripts/widgets/ui_menu.js';

import {ImageUser} from '../../core/imageblock.js';
import {SplineEditor} from './view2d_spline_ops.js';
import {Container} from '../../path.ux/scripts/core/ui.js';
import {PackFlags} from '../../path.ux/scripts/core/ui_base.js';
import {patch_canvas2d, set_rendermat} from '../../curve/spline_draw.js';
import {SelMask, ToolModes} from './selectmode.js';
import {ManipulatorManager, Manipulator,
  HandleShapes, ManipFlags, ManipHandle} from './manipulator.js';

import {EditModes} from './view2d_editor.js';
export {EditModes} from './view2d_editor.js';
import './toolmodes/all.js';

let projrets = cachering.fromConstructor(Vector3, 128);

let _v3d_unstatic_temps = cachering.fromConstructor(Vector3, 512);
let _v2d_unstatic_temps = cachering.fromConstructor(Vector2, 32);

function delay_redraw(ms : number) {
  var start_time = time_ms();
  var timer = window.setInterval(function() {
    if (time_ms() - start_time < ms)
      return;

    window.clearInterval(timer);
    window.redraw_viewport();
  }, 20);
}

class PanOp extends ToolOp {
  is_modal : boolean
  cameramat : Matrix4;

  mpos       : Vector2;
  start_mpos : Vector2;
  first      : boolean;

  constructor(start_mpos) {
    super();

    this.is_modal = true;
    this.undoflag |= UndoFlags.IGNORE_UNDO;

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
    apiname    : "view2d.pan",

    undoflag   : UndoFlags.IGNORE_UNDO,

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

    this.cameramat.load(this.start_cameramat).translate(mpos[0], mpos[1], 0.0);
    ctx.view2d.set_cameramat(this.cameramat);

    //console.log("panning");
    window.force_viewport_redraw();
    window.redraw_viewport();
  }

  on_mouseup(event : Object) {
    this.end_modal();
  }
}

class drawline {
  clr : Array<number>;

  v1 : Vector3;
  v2 : Vector3;

  constructor(co1, co2, group : string, color, width : number) {
    this.v1 = new Vector3(co1);
    this.v2 = new Vector3(co2);
    this.group = group;
    this.width = width;

    if (color !== undefined) {
      this.clr = [color[0], color[1], color[2], color[3] !== undefined ? color[3] : 1.0];
    } else {
      this.clr = [0.4, 0.4, 0.4, 1.0];
    }
  }

  set_clr(clr : Array<float>) {
    this.clr = clr;
  }
}

export class View2DHandler extends Editor {
  enable_blur : boolean
  draw_small_verts : boolean
  _can_select : number
  _only_render : number
  _selectmode : number
  _draw_normals : number
  irendermat : Matrix4
  cameramat : Matrix4
  background_image : ImageUser
  zoom : number;

  static STRUCT     : string;
  rendermat         : Matrix4;
  need_data_link    : boolean;
  widgets           : ManipulatorManager;
  dpi_scale         : number;
  draw_faces        : boolean;
  background_color  : Vector3;
  default_stroke    : Vector4;
  default_fill      : Vector4;
  default_linewidth : float;
  drawlines         : GArray<drawline>;
  drawline_groups   : Object;
  ctx               : FullContext;

  constructor() {
    super();

    this.dpi_scale = 1.0;

    this.enable_blur = true;
    this.draw_small_verts = false;

    this.toolmode = ToolModes.SELECT;
    this._last_dpi = undefined;

    this.widgets = new ManipulatorManager(this);

    this.draw_faces = true;
    this.need_data_link = false;

    this._can_select = 1;
    this._only_render = 0;
    this._selectmode = 1;
    this._draw_normals = 0;
    this.rendermat = new Matrix4();
    this.irendermat = new Matrix4();
    this.cameramat = new Matrix4();
    this.editors = [];
    this.background_image = new ImageUser();
    this.pinned_paths = [];
    this.zoom = 1.0;
    this.background_color = new Vector3([1, 1, 1]);

    this.default_stroke = new Vector4([0,0,0,1]);
    this.default_fill = new Vector4([0,0,0,1]);
    this.default_linewidth = 2;

    this.drawlines = new GArray();
    this.drawline_groups = {};

    //this.editor = new SplineEditor(this);
    //this.editors = new GArray([this.editor]);

    //this.eventdiv = document.createElement("div");

    this.doOnce(this.regen_keymap);
  }

  get do_blur() {
    console.warn("evil do_blur");
    return this.enable_blur;
  }

  regen_keymap() {
    if (!this.ctx || !this.ctx.toolmode) {
      return;
    }

    this.keymap = new KeyMap();
    this.define_keymap();

    for (let map of this.ctx.toolmode.getKeyMaps()) {
      this.keymap.concat(map);
    }
  }

  getKeyMaps() {
    let ret = super.getKeyMaps() || [];
    if (this.ctx.toolmode) {
      ret = ret.concat(this.ctx.toolmode.getKeyMaps());
    }

    return ret;
  }

  tools_menu(ctx, mpos) {
    let tool = ctx.toolmode;
    if (tool) {
      tool.tools_menu(ctx, mpos, this);
    }
  }

  toolop_menu(ctx, name, ops) {
    return createMenu(ctx, name, ops);
  }

  call_menu(menu, view2d, mpos) {
    let screen = this.ctx.screen;

    startMenu(menu, screen.mpos[0], screen.mpos[1]);
  }

  define_keymap() {
    var k = this.keymap;

    var this2 = this;
    //cycle through select modes
    k.add(new HotKey("T", [], "Cycle Select Mode"), new FuncKeyHandler(function(ctx : FullContext) {
      var s = ctx.view2d.selectmode, s2;

      let hf = s & SelMask.HANDLE;
      s2 &= ~SelMask.HANDLE;

      if (s == SelMask.VERTEX)
        s2 = SelMask.SEGMENT;
      else if (s == SelMask.SEGMENT)
        s2 = SelMask.FACE;
      else if (s == SelMask.FACE)
        s2 = SelMask.OBJECT;
      else
        s2 = SelMask.VERTEX;

      s2 |= hf;

      console.log("toggle select mode", s, s2, SelMask.SEGMENT,  SelMask.FACE);
      console.log(s == SelMask.VERTEX, s == (SelMask.VERTEX|SelMask.HANDLE), (s == SelMask.SEGMENT));
      ctx.view2d.set_selectmode(s2);
    }));

    k.add(new HotKey("Z", ["CTRL", "SHIFT"], "Redo"), new FuncKeyHandler(function(ctx : FullContext) {
      console.log("Redo")
      ctx.toolstack.redo();
    }));
    k.add(new HotKey("Y", ["CTRL"], "Redo"), new FuncKeyHandler(function(ctx : FullContext) {
      console.log("Redo")
      ctx.toolstack.redo();
    }));
    k.add(new HotKey("Z", ["CTRL"], "Undo"), new FuncKeyHandler(function(ctx : FullContext) {
      console.log("Undo");
      ctx.toolstack.undo();
    }));

    k.add(new HotKey("O", [], "Toggle Proportional Transform"), new FuncKeyHandler(function(ctx : FullContext) {
      console.log("toggling proportional transform");
      ctx.view2d.session_flag ^= SessionFlags.PROP_TRANSFORM;
    }));

    k.add(new HotKey("K", [], ""), new FuncKeyHandler(function(ctx : FullContext) {
      g_app_state.toolstack.exec_tool(new CurveRootFinderTest());
    }));

    k.add(new HotKey("Right", [], ""), new FuncKeyHandler(function(ctx : FullContext) {
      console.log("Frame Change!", ctx.scene.time+1);
      ctx.scene.change_time(ctx, ctx.scene.time+1);

      window.redraw_viewport();
      //var tool = new FrameChangeOp(ctx.scene.time+1);
    }));

    k.add(new HotKey("Left", [], ""), new FuncKeyHandler(function(ctx : FullContext) {
      console.log("Frame Change!", ctx.scene.time-1);
      ctx.scene.change_time(ctx, ctx.scene.time-1);

      window.redraw_viewport();
      //var tool = new FrameChangeOp(ctx.scene.time-1);
    }));

    /*k.add(new HotKey("I", ["CTRL"], "Toggle Generator Debug"), new FuncKeyHandler(function(ctx) {
      console.log("Toggling frame debug")
      _do_frame_debug ^= 1;
      test_nested_with();
    }));*/

    k.add(new HotKey("Up", [], "Frame Ahead 10"), new FuncKeyHandler(function(ctx : FullContext) {
      //flip_max++;

      window.debug_int_1++;

      ctx.scene.change_time(ctx, ctx.scene.time+10);

      window.force_viewport_redraw();
      window.redraw_viewport();
      console.log("debug_int_1: ", debug_int_1);
    }));
    k.add(new HotKey("Down", [], "Frame Back 10"), new FuncKeyHandler(function(ctx : FullContext) {
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

  init() {
    super.init();

    this.makeToolbars();
    this.setCSS();

    this.on_mousedown = Editor.wrapContextEvent(this.on_mousedown.bind(this));
    this.on_mousemove = Editor.wrapContextEvent(this.on_mousemove.bind(this));
    this.on_mouseup = Editor.wrapContextEvent(this.on_mouseup.bind(this));

    this.addEventListener("mousedown", this.on_mousedown.bind(this));
    this.addEventListener("mousemove", this.on_mousemove.bind(this));
    this.addEventListener("mouseup", this.on_mouseup.bind(this));

    this._i = 0;

    //this.shadow.appendChild();
    this.regen_keymap();
  }

  _mouse(e : MouseEvent) {
    let e2 = patchMouseEvent(e, this); //this.get_bg_canvas());
    let mpos = this.getLocalMouse(e.x, e.y);

    e2.x = e2.clientX = mpos[0];
    e2.y = e2.clientY = mpos[1];

    return e2;
  }

  data_link(block : DataBlock, getblock : Function, getblock_us : Function) {
    this.ctx = new Context();
    this.need_data_link = false;

    this.background_image.data_link(block, getblock, getblock_us);
  }

  set_cameramat(mat : Matrix4=undefined) {
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

  _getCanvasOff() : Vector3 {
    let off = _v3d_unstatic_temps.next().zero();

    let r1 = this.get_bg_canvas().getClientRects()[0];
    let r2 = this.getClientRects()[0];

    off[0] = r1.x - r2.x;
    off[1] = r1.y - r2.y;

    return off;
  }

  project(co : Vector3) {
    let _co = _v3d_unstatic_temps.next().zero();

    _co.load(co);
    _co[2] = 0.0;
    _co.multVecMatrix(this.rendermat);

    //let off = this._getCanvasOff();
    //_co[0] -= off[0];
    //_co[1] -= off[1];

    //_co.mulScalar(this.dpi_scale);

    co[0] = _co[0], co[1] = _co[1];
    return co;
  }

  unproject(co : Vector3) {
    let _co = _v3d_unstatic_temps.next().zero();

    _co.load(co);

    //let off = this._getCanvasOff();
    //_co[0] += off[0];
    //_co[1] += off[1];

    _co[2] = 0.0;
    _co.multVecMatrix(this.irendermat);
    //_co.mulScalar(1.0 / this.dpi_scale);
    
    co[0] = _co[0], co[1] = _co[1];
    return co;
  }

  getLocalMouse(x, y) {
    let ret = projrets.next();

    let canvas = this.get_bg_canvas();

    let rect = canvas.getClientRects()[0];

    let dpi = UIBase.getDPI();

    if (rect === undefined) {
      console.warn("error in getLocalMouse");
      ret[0] = x*dpi;
      ret[1] = y*dpi;
      return ret;
    }

    //console.log(x, rect.left);

    ret[0] = (x - rect.left) * dpi;
    ret[1] = (rect.height - (y - rect.top)) * dpi;
    ret[2] = 0.0;

    return ret;
  }

  on_resize(newsize, oldsize) {
    super.on_resize(newsize, oldsize);

    if (this.size !== undefined) {
      this.set_cameramat();

      if (!this.need_data_link) {
        this.do_draw_viewport([]);
      }
    }

    //note that file code might call this before data_link, so
    //this.image might still be a DataRef, crashing draw
    if (!this.need_data_link) {
      //force resize of canvases
      this.get_fg_canvas();
      this.get_bg_canvas();

      this.do_draw_viewport([]);
    }
  }

  do_draw_viewport(redraw_rects) {
    //console.log(this.size);

    var canvas = this.get_fg_canvas();
    var bgcanvas = this.get_bg_canvas();
    //var eventdiv = this.eventdiv;

    canvas.style["left"] = bgcanvas.style["left"] = /*eventdiv.style["left"] =*/ this.pos[0] + "px";
    canvas.style["top"] = bgcanvas.style["top"] = /*eventdiv.style["top"] =*/ this.pos[1] + "px";
    //eventdiv.style["width"] = ~~this.size[0] + "px";
    //eventdiv.style["height"] = ~~this.size[1] + "px";

    var g = this.drawg = canvas.g;
    var bg_g = bgcanvas.g;

    if (bgcanvas !== undefined && bgcanvas.style !== undefined) {
      bgcanvas.style["backgroundColor"] = this.background_color.toCSS();
    }

    var w = this.size[0];
    var h = this.size[1];

    g._irender_mat = this.irendermat;
    bg_g._irender_mat = this.irendermat;

    bg_g.width = bgcanvas.width;
    g.width = canvas.width;
    bg_g.height = bgcanvas.height;
    g.height = canvas.height;

    set_rendermat(g, this.rendermat);
    set_rendermat(bg_g, this.rendermat);

    g.save();
    bg_g.save();

    let pan = new Vector3();
    let dpi_scale = this.dpi_scale;
    
    //this.rendermat.makeIdentity();
    //this.irendermat.load(this.rendermat).invert();

    let mat = new DOMMatrix();
    let mat2 = g.getTransform();
    
    //let mx = mat2.m41, my = mat2.m42;

    //mat.scale(dpi_scale,dpi_scale);
    //mat2.multiplySelf(mat);
    //mat2.m41 = mx;
    //mat2.m42 = my;

    //g.setTransform(mat2);
    //g._scale(1/dpi_scale, 1/dpi_scale);
    //bg_g._scale(1/dpi_scale, 1/dpi_scale);
    
    //pan.multVecMatrix(this.rendermat);
    
    g.dpi_scale = this.dpi_scale;
    
    var p1 = new Vector2([0, 0]); //this.pos[0], this.pos[1]]);
    var p2 = new Vector2([this.size[0], this.size[1]]);
    this.unproject(p1), this.unproject(p2);

    var r = redraw_rects;

    //*
    g.beginPath();
    for (var i=0; i<r.length; i += 4) {
      g.moveTo(r[i], r[i+1]);
      g.lineTo(r[i], r[i+3]);
      g.lineTo(r[i+2], r[i+3]);
      g.lineTo(r[i+2], r[i+1]);

      g.closePath();
    }
    //g.clip();
    //*/

    g.beginPath();
    bg_g.beginPath();

    g._clearRect(0, 0, g.canvas.width, g.canvas.height);
    bg_g._clearRect(0, 0, bg_g.canvas.width, bg_g.canvas.height);

    this.ctx = new Context();

    //this.ctx.frameset.draw(this.ctx, g, this, redraw_rects);
    //g.restore(); return;

    if (this.ctx.frameset === undefined) {
      g.restore();
      bg_g.restore();
      return;
    }

    let matrix = new Matrix4();

    let m2 = new Matrix4();
    m2.scale(dpi_scale, dpi_scale, 1.0);

    matrix.multiply(m2);
    matrix.multiply(this.rendermat);

    set_rendermat(g, matrix);
    set_rendermat(bg_g, matrix);

    if (this.draw_video && this.video !== undefined) {
      var frame = Math.floor(this.video_time);
      var image = this.video.get(frame);
      if (image != undefined) {
        //console.log("image", image);

        bg_g.drawImage(image, 0, 0);
      }
    }

    //get_dom_image
    if (this.draw_bg_image && this.background_image.image !== undefined) {
      var img = this.background_image.image.get_dom_image();
      var iuser = this.background_image;

      bg_g.drawImage(img, iuser.off[0], iuser.off[1], img.width*iuser.scale[0], img.height*iuser.scale[1]);
    }
    
    //this.rendermat
    matrix = new Matrix4(matrix);
    let matrix2 = new Matrix4();

    matrix2.translate(0.0, g.canvas.height, 0.0);

    let mm = new Matrix4();
    mm.scale(1.0, -1.0, 1.0);
    matrix2.multiply(mm);

    matrix.preMultiply(matrix2);

    this.ctx.frameset.draw(this.ctx, g, this, matrix, redraw_rects, this.edit_all_layers);

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

          vdata.draw(g, alpha, this.ctx.frameset.time, redraw_rects);
        }

        pathspline.layerset.active = pathspline.layerset.idmap[this.ctx.frameset.templayerid];
        pathspline.draw(redraw_rects, g, this, this.selectmode, this.only_render, this.draw_normals, alpha, true, this.ctx.frameset.time, false);
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

    //r2[1][0] += r2[0][0];
    //r2[1][1] += r2[0][1];
    /*
    for (var rect of this.widgets.get_render_rects(this.ctx, canvas, g)) {
      if (aabb_isect_2d(r2[0], r2[1], rect[0], rect[1])) {
        draw_widget = true;
        break;
      }
    }
    console.log("draw widget:", draw_widget);
    //*/

    this.widgets.render(canvas, g);

    bg_g.restore();
    g.restore();
  }

  get_fg_canvas() { //XXX todo: get rid of this.drawcanvas.
    this.drawcanvas = this.getCanvas("fg", -2, undefined, this.dpi_scale);
    return this.drawcanvas;
  }

  get_bg_canvas() {
    return this.getCanvas("bg", -3, undefined, this.dpi_scale);
  }

  copy() {
    let ret = document.createElement("view2d-editor-x");

    return ret;
  }

  makeToolbars() {
    let row = this.container//.row();

    let tabs = row.tabs("right");

    //tabs.style["width"] = "300px";
    tabs.style["height"] = "400px";
    tabs.float(1, 3*25*UIBase.getDPI(), 7);

    var tools = tabs.tab("Tools");
    //*
    tools.prop("view2d.toolmode",
      PackFlags.USE_ICONS|PackFlags.VERTICAL|PackFlags.LARGE_ICON
    );
    //*/

    tools.iconbutton(Icons.UNDO, "  Hotkey : CTRL-Z", () => {
      g_app_state.toolstack.undo();
      delay_redraw(50); //stupid hack to deal with async nacl spline solve
    });

    tools.iconbutton(Icons.REDO, "  Hotkey : CTRL-SHIFT-Z", () => {
      g_app_state.toolstack.redo();
      delay_redraw(50); //stupid hack to deal with async nacl spline solve
    });


    let tool = tools.tool("view2d.circle_select(mode=select selectmode=selectmode)", PackFlags.LARGE_ICON|PackFlags.USE_ICONS);
    tool.icon = Icons.CIRCLE_SEL_ADD;
    tool.description = "Select control points in a circle";

    tool = tools.tool("view2d.circle_select(mode=deselect selectmode=selectmode)", PackFlags.LARGE_ICON|PackFlags.USE_ICONS);
    tool.icon = Icons.CIRCLE_SEL_SUB;
    tool.description = "Deselect control points in a circle";

    tools.tool("spline.toggle_select_all()", PackFlags.LARGE_ICON|PackFlags.USE_ICONS);

    this.update();
  }

  makeHeader(container) {
    let row = super.makeHeader(container);
    
    row.noMargins();

    console.log("VIEW2D ctx:", this.ctx);

    row.prop("view2d.zoom");
    row.prop("view2d.edit_all_layers");

    row = container.row();
    row.noMargins();
    container.noMargins();

    row.prop("view2d.selectmask[HANDLE]", PackFlags.USE_ICONS);
    row.prop("view2d.selectmode", PackFlags.USE_ICONS);

    row.useIcons();

    row.prop("view2d.only_render", PackFlags.USE_ICONS);
    row.prop("view2d.draw_small_verts", PackFlags.USE_ICONS);
    row.prop("view2d.draw_normals", PackFlags.USE_ICONS);
    row.prop("view2d.draw_anim_paths", PackFlags.USE_ICONS);
    row.prop("view2d.enable_blur", PackFlags.USE_ICONS);
    row.prop("view2d.draw_faces", PackFlags.USE_ICONS);
    //row.prop("view2d.extrude_mode", PackFlags.USE_ICONS);
    row.prop("spline.active_vertex.flag[BREAK_TANGENTS]");
    row.prop("spline.active_vertex.flag[BREAK_CURVATURES]");
    row.tool("spline.split_pick_edge()", PackFlags.USE_ICONS);
  }

  set_zoom(zoom) {
    this.zoom = zoom;
    window.redraw_viewport();
  }

  static define() { return {
    tagname : "view2d-editor-x",
    areaname : "view2d_editor",
    uiname : "Work Canvas",
    icon : Icons.VIEW2D_EDITOR
  }}

  static newSTRUCT() {
    return document.createElement("view2d-editor-x");
  }

  loadSTRUCT(reader) {
    this._in_from_struct = true;
    reader(this);
    super.loadSTRUCT(reader);

    this._in_from_struct = true;
    this.need_data_link = true;

    //if (isNaN(this.default_linewidth)) {
    //  this.default_linewidth = 2.0;
    //}

    if (this.pinned_paths != undefined && this.pinned_paths.length == 0)
      this.pinned_paths = undefined;

    /*
    if (this.editor == undefined) {
      console.log("WARNING: corrupted View2DHandler sturct data");
      this.editor = this.editors[0];
    } else {
      this.editor = this.editors[this.editor];
    }

    this.editor.view2d = this;
     */

    this._in_from_struct = false;

    /*
    let f = () => {
      if (this.size !== undefined) {
        this.set_cameramat(this.cameramat)
      } else {
        console.log("eek!");
        this.doOnce(f);
      }
    };
    this.doOnce(f);
    //*/
  }

  get selectmode() {
    return this.ctx && this.ctx.scene ? this.ctx.scene.selectmode : 0;
    //return this._selectmode;
  }

  set selectmode(val) {
    if (this.ctx && this.ctx.scene) {
      this.ctx.scene.selectmode = val;
      window.redraw_viewport();
    }

    //this._selectmode = val;

    //if (!this._in_from_struct)
    //  this.set_selectmode(val);
  }

  set_selectmode(mode : int) {
    console.warn("Call to view2d.set_selectmode");
    this.ctx.scene.selectmode = mode;
    //this._selectmode = mode;
    //this.editor.set_selectmode(mode);
    redraw_viewport();
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
      for (var v of spline.verts.selected.editable(this.ctx)) {
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
  _get_dl_group(group) {
    if (group == undefined)
      group = "main";

    if (!(group in this.drawline_groups)) {
      this.drawline_groups[group] = new GArray();
    }

    return this.drawline_groups[group];
  }

  make_drawline(v1, v2, group="main", color=undefined, width=2) {
    var drawlines = this._get_dl_group(group);

    var dl = new drawline(v1, v2, group, color, width);
    drawlines.push(dl);

    let min = _v2d_unstatic_temps.next(), max = _v2d_unstatic_temps.next();

    var pad = 5;

    min[0] = Math.min(v1[0], v2[0])-pad;
    min[1] = Math.min(v1[1], v2[1])-pad;
    max[0] = Math.max(v1[0], v2[0])+pad;
    max[1] = Math.max(v1[1], v2[1])+pad;

    redraw_viewport(min, max);

    return dl;
  }

  kill_drawline(dl) {
    let min = _v2d_unstatic_temps.next(), max = _v2d_unstatic_temps.next();

    var drawlines = this._get_dl_group(dl.group);
    var pad = 5;

    var v1 = dl.v1, v2 = dl.v2;

    min[0] = Math.min(v1[0], v2[0]) - pad;
    min[1] = Math.min(v1[1], v2[1]) - pad;
    max[0] = Math.max(v1[0], v2[0]) + pad;
    max[1] = Math.max(v1[1], v2[1]) + pad;

    redraw_viewport(min, max);

    drawlines.remove(dl);
  }

  reset_drawlines(group="main") {
    var drawlines = this._get_dl_group(group);

    drawlines.reset();
  }

  get editor() {
    return this.ctx.toolmode;
  }

  set editor(v) {
    console.warn("Attempt to set view2d.editor");
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

  set can_select(val) {
    this._can_select = !!val;
  }

  do_select(event : MouseEvent, mpos : Array<float>,
            view2d : View2DHandler, do_multiple=false)
  {
    return this.editor.do_select(event, mpos, view2d, do_multiple);
  }

  do_alt_select(event : MouseEvent, mpos : Array<float>, view2d : View2DHandler) {
    return this.editor.do_alt_select(event, mpos, view2d);
  }

  _widget_mouseevent(event) {
    let co = [event.x, event.y];
    //console.log("Widget event", event.x, event.y);
    this.unproject(co);

    let event2 = {
      type : event.type,

      x: co[0],
      y: co[1],

      origX : event.x,
      origY : event.y,

      shiftKey : event.shiftKey,
      ctrlKey : event.ctrlKey,
      altKey : event.altKey,
      commandKey : event.commandKey
    };

    return event2;
  }

  //is wrapped with editor.wrapContextEvent in constructor
  on_mousedown(event : MouseEvent) {
    this.editor.view2d = this;

    //are we over a ui panel?
    if (this.ctx.screen.pickElement(event.pageX, event.pageY) !== this) {
      return;
    }

    event = this._mouse(event);

    //console.trace();

    //if (this.bad_event(event))
    //  return;

    if (this.widgets.on_click(this._widget_mouseevent(event), this)) {
      return;
    }

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
        this.on_mousemove(event.original);

        this._mstart = new Vector2(this.mpos);
        selfound = this.do_alt_select(event, this.mpos, this);
      } else if (event.button == 0) {
        this.on_mousemove(event.original);

        this._mstart = new Vector2(this.mpos);
        selfound = this.do_select(event, this.mpos, this, this.shift|g_app_state.select_multiple);

        this.editor.selectmode = this.selectmode;
        this.editor.view2d = this;

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

  on_mouseup(event : MouseEvent) {
    //are we over a ui panel?
    if (this.ctx.screen.pickElement(event.pageX, event.pageY) !== this) {
      return;
    }

    event = this._mouse(event);
    //if (this.bad_event(event))
    //  return;

    this._mstart = null;

    if (this.editor.on_mouseup(event)) return;
  }

  on_mousemove(event) {
    //are we over a ui panel?
    if (this.ctx.screen.pickElement(event.pageX, event.pageY) !== this) {
      return;
    }

    event = this._mouse(event);

    //console.log(event.x, event.y);

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

    if (this.widgets.on_mousemove(this._widget_mouseevent(event), this)) {
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

  on_mousewheel(event : MouseEvent, delta : float) {
    this.change_zoom(delta)
  }

  updateDPI() {
    if (this._last_dpi != UIBase.getDPI()) {
      window.redraw_viewport();
      this.setCSS();
    }

    this._last_dpi = UIBase.getDPI();
  }

  get edit_all_layers() {
    if (this.ctx && this.ctx.scene)
      return this.ctx.scene.edit_all_layers;
  }

  set edit_all_layers(v) {
    if (this.ctx && this.ctx.scene)
      this.ctx.scene.edit_all_layers = v;
  }
  
  update() {
    let key = "" + this.enable_blur + ":" + this.only_render + ":" + this.draw_faces + ":" + this.edit_all_layers + ":" + this.draw_normals + ":" + this.draw_small_verts;
    
    if (key !== this._last_key_1) {
      this._last_key_1 = key;
      window.redraw_viewport();
    }

    this.push_ctx_active();

    super.update();
    this.updateDPI();

    
    this.widgets.on_tick(this.ctx);
    this.editor.on_tick(this.ctx);
    
    this.pop_ctx_active();

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
}

View2DHandler.STRUCT = STRUCT.inherit(View2DHandler, Area) + `
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
  default_stroke    : vec4;
  default_fill      : vec4;
  extrude_mode      : int;
  enable_blur       : int;
  draw_faces        : int;
  draw_video        : int;
  pinned_paths      : array(int) | obj.pinned_paths != undefined ? obj.pinned_paths : [];
  background_image  : ImageUser;
  background_color  : vec3;
  draw_bg_image     : int;
  toolmode          : int;
  draw_small_verts  : int;
}
`;

Editor.register(View2DHandler);
