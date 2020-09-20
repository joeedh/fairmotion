import {FullContext} from "../../core/context.js";
import {Editor} from '../editor_base.js';
import {SessionFlags} from "./view2d_editor.js";
import {Area} from '../../path.ux/scripts/screen/ScreenArea.js';
import {patchMouseEvent, ToolOp, UndoFlags} from '../../core/toolops_api.js';
import {KeyMap, ToolKeyHandler, FuncKeyHandler, HotKey,
  charmap, TouchEventManager, EventHandler} from "../events.js";
import {STRUCT} from '../../core/struct.js';
import {UIBase} from '../../path.ux/scripts/core/ui_base.js';
import {createMenu, startMenu} from '../../path.ux/scripts/widgets/ui_menu.js';

import * as util from "../../path.ux/scripts/util/util.js";

import {PenToolMode} from './toolmodes/pentool.js';
import {ImageUser} from '../../core/imageblock.js';
import {SplineEditor} from './view2d_spline_ops.js';
import {Container} from '../../path.ux/scripts/core/ui.js';
import {PackFlags} from '../../path.ux/scripts/core/ui_base.js';
import {SelMask, ToolModes} from './selectmode.js';
import {ManipulatorManager, Manipulator,
  HandleShapes, ManipFlags, ManipHandle} from './manipulator.js';

import {EditModes} from './view2d_editor.js';
export {EditModes} from './view2d_editor.js';
import './toolmodes/all.js';

let projrets = cachering.fromConstructor(Vector2, 128);

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

import {PanOp} from './view2d_ops.js';

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
  draw_bg_image : boolean
  _can_select   : number
  _only_render  : number
  _selectmode   : number
  _vel          : Vector2
  _draw_normals : number
  _last_rendermat : Matrix4
  _last_dv        : number
  _last_rendermat_time : number
  irendermat  : Matrix4
  cameramat   : Matrix4
  background_image : ImageUser
  zoom : number;
  propradius        : number;

  static STRUCT     : string
  rendermat         : Matrix4
  need_data_link    : boolean
  widgets           : ManipulatorManager
  dpi_scale         : number
  draw_faces        : boolean
  background_color  : Vector3
  half_pix_size     : boolean
  default_stroke    : Vector4
  default_fill      : Vector4
  default_linewidth : float
  drawlines         : GArray<drawline>
  drawline_groups   : Object
  _last_mpos        : Vector2
  _last_toolmode    : any
  ctx               : FullContext;

  constructor() {
    super();

    this.propradius = 35;

    this._last_toolmode = undefined;

    this._last_mpos = new Vector2();

    this.dpi_scale = 1.0;
    this._last_rendermat = new Matrix4();
    this._last_dv = new Vector2();
    this._last_rendermat_time = util.time_ms();
    this._vel = new Vector2();

    this._flip = 0;

    this.enable_blur = true;
    this.draw_small_verts = false;
    this.half_pix_size = false;

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

    this.keymap = new KeyMap("view2d");
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

      if (s === SelMask.VERTEX)
        s2 = SelMask.SEGMENT;
      else if (s === SelMask.SEGMENT)
        s2 = SelMask.FACE;
      else if (s === SelMask.FACE)
        s2 = SelMask.OBJECT;
      else
        s2 = SelMask.VERTEX;

      s2 |= hf;

      console.log("toggle select mode", s, s2, SelMask.SEGMENT,  SelMask.FACE);
      console.log(s === SelMask.VERTEX, s === (SelMask.VERTEX|SelMask.HANDLE), (s === SelMask.SEGMENT));
      ctx.view2d.set_selectmode(s2);
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

    if (mat !== undefined)
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

  project(co : Vector2) {
    let _co = _v3d_unstatic_temps.next().zero();

    _co.load(co);
    _co[2] = 0.0;
    _co.multVecMatrix(this.rendermat);
    //_co.mulScalar(1.0/this.dpi_scale);

    co[0] = _co[0], co[1] = _co[1];

    return co;
  }

  unproject(co : Vector3) {
    let _co = _v3d_unstatic_temps.next().zero();

    _co.load(co);

    _co[2] = 0.0;
    _co.multVecMatrix(this.irendermat);
    //_co.mulScalar(this.dpi_scale);

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
    //ret[2] = 0.0;

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

  genMatrix() {
    let g = this.drawg;
    let dpi_scale = this.dpi_scale;

    let matrix = new Matrix4();

    let m2 = new Matrix4();
    m2.scale(dpi_scale, dpi_scale, 1.0);

    matrix.multiply(m2);
    matrix.multiply(this.rendermat);

    //this.rendermat
    matrix = new Matrix4(matrix);
    let matrix2 = new Matrix4();

    matrix2.translate(0.0, g.canvas.height, 0.0);

    let mm = new Matrix4();
    mm.scale(1.0, -1.0, 1.0);
    matrix2.multiply(mm);

    matrix.preMultiply(matrix2);

    return matrix;
  }

  do_draw_viewport(redraw_rects=[]) {
    if (this._draw_promise) {
      return;
    }

    //console.log(this.size);
    let buffer = window._wait_for_draw;

    var canvas = this.get_fg_canvas();
    var bgcanvas = this.get_bg_canvas();

    if (buffer) {
      canvas = this.get_fg_canvas(this._flip ^ 1);
      bgcanvas = this.get_bg_canvas(this._flip ^ 1);
    }


    var g = this.drawg = canvas.g;
    var bg_g = bgcanvas.g;

    if (bgcanvas !== undefined) {
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

    g.save();
    bg_g.save();

    let matrix = this.genMatrix();

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

    g.clearRect(0, 0, g.canvas.width, g.canvas.height);
    bg_g.clearRect(0, 0, bg_g.canvas.width, bg_g.canvas.height);

    this.ctx = new Context();

    //this.ctx.frameset.draw(this.ctx, g, this, redraw_rects);
    //g.restore(); return;

    if (this.ctx.frameset === undefined) {
      console.warn("EEK!");
      g.restore();
      bg_g.restore();
      return;
    }



    if (this.draw_video && this.video !== undefined) {
      var frame = Math.floor(this.video_time);
      var image = this.video.get(frame);
      if (image !== undefined) {
        //console.log("image", image);

        bg_g.drawImage(image, 0, 0);
      }
    }

    //get_dom_image
    if (this.draw_bg_image && this.background_image.image !== undefined) {
      var img = this.background_image.image.get_dom_image();
      var iuser = this.background_image;

      let off = new Vector2(iuser.off);
      let scale = new Vector2(iuser.scale);

      let m = matrix.$matrix;

      off.multVecMatrix(matrix);

      scale[0] *= m.m11;
      scale[1] *= m.m22;

      g.drawImage(img, off[0], off[1], img.width*scale[0], img.height*scale[1]);
    }

    let promise = this.ctx.frameset.draw(this.ctx, g, this, matrix, redraw_rects, this.edit_all_layers);

    if (buffer) {
      promise.then(() => {
        this._draw_promise = undefined;
        this.flip_canvases();
      });

      this._draw_promise = promise;
    }

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

          vdata.draw(g, matrix, alpha, this.ctx.frameset.time, redraw_rects);
        }

        pathspline.layerset.active = pathspline.layerset.idmap[this.ctx.frameset.templayerid];
        pathspline.draw(redraw_rects, g, this, matrix, this.selectmode, this.only_render, this.draw_normals, alpha, true, this.ctx.frameset.time, false);
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
        var a = dl.clr[3] !== undefined ? dl.clr[3] : 1.0;

        g.strokeStyle = "rgba("+fl(dl.clr[0]*255)+","+fl(dl.clr[1]*255)+","+fl(dl.clr[2]*255)+","+a+")";
        g.lineWidth = dl.width;

        g.beginPath()
        g.moveTo(dl.v1[0], canvas.height - dl.v1[1]);
        g.lineTo(dl.v2[0], canvas.height - dl.v2[1]);
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

    let m = matrix.$matrix;
    g.setTransform(m.m11, m.m12, m.m21, m.m22, m.m41, m.m42);

    this.widgets.render(canvas, g, matrix);

    bg_g.restore();
    g.restore();
  }

  flip_canvases() {
    let fg = this.get_fg_canvas();
    let bg = this.get_bg_canvas();

    fg.hidden = true;
    bg.hidden = true;

    this._flip ^= 1;

    fg = this.get_fg_canvas();
    bg = this.get_bg_canvas();

    fg.hidden = false;
    bg.hidden = false;
  }

  get_fg_canvas(flip:number = this._flip) { //XXX todo: get rid of this.drawcanvas.
    if (flip) {
      this.drawcanvas = this.getCanvas("fg2", -2, undefined, this.dpi_scale);
    } else {
      this.drawcanvas = this.getCanvas("fg", -2, undefined, this.dpi_scale);
    }

    if (flip !== this._flip) {
      this.drawcanvas.hidden = true;
    }

    return this.drawcanvas;
  }

  get_bg_canvas(flip:number = this._flip) {
    let ret;

    if (flip) {
      ret = this.getCanvas("bg2", -3, undefined, this.dpi_scale);
    } else {
      ret = this.getCanvas("bg", -3, undefined, this.dpi_scale);
    }

    if (flip !== this._flip) {
      ret.hidden = true;
    }

    return ret;
  }

  copy() {
    let ret = document.createElement("view2d-editor-x");

    return ret;
  }

  makeToolbars() {
    if (!this.container) {
      this.doOnce(this.makeToolbars);
      return;
    }

    if (this._makingToolBars) {
      return;
    }

    this._makingToolBars = true; //prevent infinite recursion

    let row = this.container;//.row();

    if (this.sidebar) {
      this.sidebar.remove();
    }

    let tabs = this.sidebar = row.tabs("right");

    //tabs.style["width"] = "300px";
    tabs.style["height"] = "400px";
    tabs.float(1, 3*25*UIBase.getDPI(), 7);

    var tools = tabs.tab("Tools", "Tools");
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

    this.flushUpdate();

    if (this.ctx && this.ctx.toolmode) {
      let tooltab = tabs.tab("Tool Settings");

      this.doOnce(() => {
        this.ctx.toolmode.constructor.buildSideBar(tooltab);
      });
    }

    let tab = tabs.tab("Background");
    let panel = tab.panel("Image");
    panel.prop("view2d.draw_bg_image");

    let iuser = document.createElement("image-user-panel-x");
    iuser.setAttribute("datapath", "view2d.background_image");

    panel.add(iuser);

    panel = tab.panel("Background Color");
    panel.prop("view2d.background_color");

    tabs.setActive("Tools");

    this._makingToolBars = false;
  }

  makeHeader(container) {
    let row = super.makeHeader(container);
    
    row.noMargins();

    console.log("VIEW2D ctx:", this.ctx);

    row.prop("view2d.zoom");
    row.prop("view2d.edit_all_layers");
    row.prop("view2d.default_linewidth");
    row.prop("view2d.default_stroke");
    row.prop("view2d.propradius");

    row = container.row();
    row.noMargins();
    container.noMargins();

    row.useIcons();

    row.prop("view2d.selectmask[HANDLE]");
    row.prop("view2d.selectmode");

    row.prop("view2d.only_render");
    row.prop("view2d.draw_small_verts");
    row.prop("view2d.session_flag[PROP_TRANSFORM]");
    row.prop("view2d.draw_normals");
    row.prop("view2d.draw_anim_paths");
    row.prop("view2d.enable_blur");
    row.prop("view2d.draw_faces");
    //row.prop("view2d.extrude_mode");

    let strip = row.strip();
    strip.useDataPathUndo = true;

    let mass_set_path = "spline.selected_verts{$.flag & 1}";
    strip.prop("spline.active_vertex.flag[BREAK_TANGENTS]", undefined, mass_set_path + ".flag[BREAK_TANGENTS]");
    strip.prop("spline.active_vertex.flag[BREAK_CURVATURES]", undefined, mass_set_path + ".flag[BREAK_CURVATURES]");
    strip.prop("view2d.half_pix_size");

    strip = row.strip();
    strip.tool("spline.split_pick_edge()");
    strip.tool("spline.stroke()");
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

    this._last_rendermat.load(this.cameramat);

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
    if (this.ctx.screen.pickElement(event.x, event.y) !== this) {
      return;
    }

    event = this._mouse(event);

    //console.trace();

    //if (this.bad_event(event))
    //  return;

    if (this.widgets.on_click(this._widget_mouseevent(event), this)) {
      return;
    }

    console.log(event.touches);

    if (event.button === 0) {
      this.editor.selectmode = this.selectmode;
      this.editor.view2d = this;

      if (this.editor.on_mousedown(event)) return;

      var selfound = false;
      var is_middle = event.button === 1 || (event.button === 2 && g_app_state.screen.ctrl);

      var tottouch = event.touches ? event.touches.length : 0;

      if (tottouch >= 2) {
        var tool = new PanOp();

        g_app_state.toolstack.exec_tool(tool);
      } else if (is_middle && this.shift) {
        console.log("Panning");
      } else if (event.button == 0) {
        this._mstart = new Vector2(this.mpos);
      }
    }

    if (event.button === 2 && !g_app_state.screen.shift && !g_app_state.screen.ctrl && !g_app_state.screen.alt) {
      var tool = new PanOp();

      g_app_state.toolstack.exec_tool(tool);
      //this.rightclick_menu(event);
    }
  }

  on_mouseup(event : MouseEvent) {
    //if (event.was_touch && event.touches && event.touches.length === 0) {
      //let x = this._last_mpos[0];
      //let y = this._last_mpos[0];
    //}
    //console.warn("View3d mouseup", event.x, event.y, this.ctx.screen.pickElement(event.x, event.y), event);

    //BAD! -> are we over a ui panel?
    //if (this.ctx.screen.pickElement(event.x, event.y) !== this) {
    //  return;
    //}

    event = this._mouse(event);
    //if (this.bad_event(event))
    //  return;

    this._mstart = null;

    if (this.editor.on_mouseup(event))
      return;
  }

  on_mousemove(event) {
    this._last_mpos[0] = event.x;
    this._last_mpos[1] = event.y;

    if (!event.touches) {
      this.resetVelPan();
    }

    //are we over a ui panel?
    if (this.ctx.screen.pickElement(event.x, event.y) !== this) {
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

  updateVelPan() {
    let m1 = this._last_rendermat.$matrix;
    let m2 = this.cameramat.$matrix;

    let pos1 = new Vector2();
    let scale1 = 1.0;
    let pos2 = new Vector2();
    let scale2 = 1.0;

    pos1[0] = m1.m41;
    pos1[1] = m1.m42;

    pos2[0] = m2.m41;
    pos2[1] = m2.m42;

    let dv = new Vector2(pos2).sub(pos1);


    let time = util.time_ms - this._last_rendermat_time;

    this._last_rendermat.load(this.cameramat);
    this._last_rendermat_time = util.time_ms();

    //dv.divScalar(time);
    let acc = new Vector2(dv).sub(this._last_dv);//.divScalar(time/1000.0);

    //this._vel.addFac(acc, 1.0/this.zoom);
    this._vel.interp(dv, 0.25);
    this._vel.mulScalar(0.9);

    this._last_dv.load(dv);

    if (this._vel.dot(this._vel) > 0.01) {
      if (Math.random() > 0.95) {
        console.log(this._vel);
      }
      this.cameramat.translate(this._vel[0], this._vel[1]);
      this.set_cameramat(this.cameramat);
      //this.irendermat.load(this.rendermat).invert();
      window.redraw_viewport();
    }
  }

  resetVelPan() {
    this._last_rendermat.load(this.cameramat);
    this._vel.zero();
  }

  updateToolMode() {
    if (!this.ctx || !this.ctx.scene) {
      return;
    }
    let scene = this.ctx.scene;

    if (this.toolmode === ToolModes.PEN && !(scene.toolmode instanceof PenToolMode)) {
      console.log("switching toolmode to pen");
      scene.switchToolMode("pen");
      this.regen_keymap();
    } else if (this.toolmode !== ToolModes.PEN && scene.toolmode instanceof PenToolMode) {
      console.log("switching toolmode to spline");
      scene.switchToolMode("spline");
      this.regen_keymap();
    }


    if (this._last_toolmode !== scene.toolmode) {
      this.makeToolbars();
    }

    this._last_toolmode = scene.toolmode;
  }

  update() {
    this.updateToolMode();
    this.updateVelPan();

    let key = "" + this.half_pix_size + ":" + this.enable_blur + ":" + this.only_render + ":" + this.draw_faces + ":" + this.edit_all_layers + ":" + this.draw_normals + ":" + this.draw_small_verts;
    
    if (key !== this._last_key_1) {
      this._last_key_1 = key;

      this.dpi_scale = this.half_pix_size ? 0.5 : 1.0;

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
  propradius      : float;
  session_flag    : int;
  rendermat       : mat4;
  irendermat      : mat4;
  half_pix_size   : bool;
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
