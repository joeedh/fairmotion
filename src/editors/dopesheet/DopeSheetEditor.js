import {Area} from '../../path.ux/scripts/screen/ScreenArea.js';
import {STRUCT} from '../../core/struct.js';
import {UIBase, css2color, color2css, Icons} from '../../path.ux/scripts/core/ui_base.js';
import {Editor} from '../editor_base.js';
import {ToggleSelectAll, MoveKeyFramesOp, SelectKeysOp, SelModes2, DeleteKeysOp} from './dopesheet_ops_new.js';
import * as util from '../../path.ux/scripts/util/util.js';
import {eventWasTouch} from "../../path.ux/scripts/util/simple_events.js";

"use strict";

import {aabb_isect_2d} from '../../util/mathlib.js';
//import {gen_editor_switcher} from 'UIWidgets_special';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, HotKey,
  charmap, TouchEventManager, EventHandler} from '../events.js';

import {STRUCT} from '../../core/struct.js';

import {PackFlags, UIFlags, UIBase, color2css, _getFont_new} from '../../path.ux/scripts/core/ui_base.js';

import {ToolOp, UndoFlags, ToolFlags, ModalStates} from '../../core/toolops_api.js';

import {Spline, RestrictFlags} from '../../curve/spline.js';
import {CustomDataLayer, SplineTypes, SplineFlags, SplineSegment} from '../../curve/spline_types.js';

import {TimeDataLayer, get_vtime, set_vtime,
  AnimKey, AnimChannel, AnimKeyFlags, AnimInterpModes, AnimKeyTypes
} from '../../core/animdata.js';

let projrets = cachering.fromConstructor(Vector2, 128);

const RecalcFlags = {
  CHANNELS : 1,
  REDRAW_KEYS : 2,
  ALL : 1|2
};

let treeDebug = 0;

/******************* main area struct ********************************/
import {Area} from '../../path.ux/scripts/screen/ScreenArea.js';
import {Container, ColumnFrame, RowFrame} from '../../path.ux/scripts/core/ui.js';
import {SelectKeysToSide, ShiftTimeOp3} from "./dopesheet_ops.js";

var tree_packflag = 0;/*PackFlags.INHERIT_WIDTH|PackFlags.ALIGN_LEFT
                   |PackFlags.ALIGN_TOP|PackFlags.NO_AUTO_SPACING
                   |PackFlags.IGNORE_LIMIT;*/

var CHGT = 25;

export class TreeItem extends ColumnFrame {
  namemap : Object
  name : string
  collapsed : boolean;

  constructor() {
    super();

    this.namemap = {};
    this.name = "";
    this._collapsed = false;
    //this.collapsed = false;
    this.parent = undefined;

    this.pathid = -1;

    //bind for doOnce
    this.rebuild_intern = this.rebuild_intern.bind(this)
    this._redraw = this._redraw.bind(this);

    let row = this.widget = this.row();
    row.overrideClass("dopesheet");

    this.icon = row.iconbutton(Icons.UI_EXPAND, "", undefined, undefined, PackFlags.SMALL_ICON);
  }

  get isVisible() {
    if (this.collapsed) {
      return false;
    }

    let p = this;
    while (p) {
      if (p.collapsed)
        return false;
      p = p.parent;
    }

    return true;
  }

  //*
  init() {
    super.init();

    let row = this.widget;
    //*
    //*/

    this.icon.addEventListener("mouseup", (e2) => {
      this.setCollapsed(!this.collapsed);
      if (treeDebug) console.log("click!");

      let e = new CustomEvent("change", {target: this});
      this.dispatchEvent(e);

      if (this.onchange) {
      //  this.onchange(e);
      }

      this.setCSS();
    });

    row.overrideClass("dopesheet");
    row.label(this.name).font = this.getDefault("TreeText");

    this.setCSS();
  }//*/

  setCSS() {
    super.setCSS();

    this.style["margin-left"] = "2px";
    this.style["padding-left"] = "2px";

    if (this.widget !== undefined) {
      this.widget.remove();
      this._prepend(this.widget);
    }

    if (this.icon !== undefined) {
      let i = 0;
      for (let k in this.namemap) {
        i++;
      }

      this.icon.hidden = i == 0;
    }
  }

  build_path() {
    var path = this.path;
    var p = this;

    while (p !== undefined && !(p.parent instanceof TreePanel)) {
      p = p.parent;
      path = p.path + "." + path;
    }

    return path;
  }

  get collapsed() {
    if (treeDebug) console.warn("    get collapsed", this._id, this.pathid, this._collapsed);
    return !!this._collapsed;
  }

  set collapsed(v) {
    if (treeDebug) console.warn("    set collapsed directly", v);
    this._collapsed = v;
  }

  setCollapsed(state) {
    if (treeDebug) console.warn("setCollapsed", state, this._id);

    if (this.icon !== undefined) {
      this.icon.icon = !state ? Icons.UI_COLLAPSE : Icons.UI_EXPAND;
    }

    if (state && !this._collapsed) {
      this._collapsed = true;

      for (let k in this.namemap) {
        let child = this.namemap[k];

        if (child.parentNode) {
          child.remove();
        }
      }
    } else if (!state && this._collapsed) {
      this._collapsed = false;

      for (let k in this.namemap) {
        let child = this.namemap[k];

        this._add(child);
      }
    }
  }

  get_filedata() {
    return {collapsed : this.collapsed};
  }

  load_filedata(data) {
    this.setCollapsed(data.collapsed);
  }


  rebuild_intern() {
  }


  rebuild() {
    this.doOnce(this.rebuild_intern);
  }

  recalc() {
    this.doOnce(this._redraw);
  }

  _redraw() {

  }

  static define() {return {
    tagname : "dopesheet-treeitem-x",
    style : "dopesheet"
  }}
}

UIBase.register(TreeItem);

export class TreePanel extends ColumnFrame {
  totpath : number
  pathmap : Object;

  constructor() {
    super();

    this.treeData = {};

    this.tree = document.createElement("dopesheet-treeitem-x");
    this.tree.path = "root";
    this.tree.pathid = -1;
    this.add(this.tree);

    this.totpath = 0;
    this.pathmap = {root: this.tree};

    this.rebuild_intern = this.rebuild_intern.bind(this)
    this._redraw = this._redraw.bind(this);

    this._onchange = this._onchange.bind(this);
    this.tree.addEventListener("change", this._onchange);
  }

  init() {
    super.init();

    this._queueDagLink = true;

    this.setCSS();
    this._redraw();
  }

  rebuild_intern() {

  }

  countPaths(visible_only=false) {
    let i = 0;

    for (let path in this.pathmap) {
      if (visible_only && this.pathmap[path].collapsed) {
        continue;
      }

      i++;
    }

    return i;
  }

  saveTreeData(existing_merge=[]) {
    let map  = {};

    let version = existing_merge[0];
    for (let i=1; i<existing_merge.length; i += 2) {
      let pathid = existing_merge[i];
      let state = existing_merge[i+1];

      //map[parseInt(pathid)] = state;
    }

    for (let k in this.pathmap) {
      let path = this.pathmap[k];

      if (treeDebug) console.log("  ", path._id, path._collapsed);
      map[parseInt(path.pathid)] = path._collapsed;
    }

    if (this.tree && !(this.tree.pathid in map)) {
      map[parseInt(this.tree.pathid)] = this.tree.collapsed;
    }

    let ret = [];

    //version
    ret.push(1);

    for (let k in map) {
      ret.push(parseInt(k));
      ret.push(map[k] ? 1 : 0);
    }

    if (treeDebug) console.log("saveTreeData", ret);
    return ret;
  }

  loadTreeData(obj) {
    //version
    let version = obj[0];

    let map = {};
    for (let k in this.pathmap) {
      let path = this.pathmap[k];

      map[path.pathid] = path;
    }

    this.treeData = {};
    if (treeDebug) console.log(map, this.pathmap);

    for (let i=1; i<obj.length; i += 2) {
      let pathid = obj[i];
      let state = obj[i+1];

      if (treeDebug) console.log("  pathid", pathid, "state", state);

      if (map[pathid] !== undefined) {
        map[pathid].setCollapsed(state);
      }

      this.treeData[pathid] = state;
    }

    if (treeDebug) console.log("loadTreeData", obj);
    this.setCSS();
  }

  is_collapsed(path) {
    return path in this.pathmap ? this.pathmap[path].collapsed : false;
  }

  rebuild() {
    this.doOnce(this.rebuild_intern());
  }

  reset() {
    if (treeDebug) console.warn("tree reset");

    this.totpath = 0;

    for (let k in this.pathmap) {
      let v = this.pathmap[k];

      v.remove();
    }

    this.pathmap = {};

    this.tree.remove();

    this.tree = document.createElement("dopesheet-treeitem-x");
    this.tree.pathid = -1;
    this.tree.path = "root";
    this.pathmap[this.tree.path] = this.tree;

    this.add(this.tree);
    this.tree.addEventListener("change", this._onchange);
  }

  _onchange(e) {
    let e2 = new CustomEvent("change", e);
    this.dispatchEvent(e2);

    //dom event system fires this for us?
    //if (this.onchange) {
      //this.onchange(e2);
    //}
  }

  _redraw() {
    this.setCSS();
  }

  _rebuild_redraw_all() {
    this._redraw(true);
  }

  recalc() {
    this.doOnce(this._rebuild_redraw_all);
  }

  get_path(path) {
    return this.pathmap[path];
  }

  has_path(path) {
    return path in this.pathmap;
  }

  add_path(path, id) {
    path = path.trim();

    if (id === undefined || typeof id !== "number") {
      throw new Error("id cannot be undefined or non-number");
    }

    var paths = path.split(".")
    var tree = this.tree;
    var lasttree = undefined;
    let idgen = ~~(id*32);

    if (paths[0].trim() === "root")
      paths = paths.slice(1, paths.length);

    //console.log("PATH", path);

    var path2 = "";
    for (var i=0; i<paths.length; i++) {
      var key = paths[i].trim();

      if (i === 0)
        path2 = key;
      else
        path2 += "." + key;

      //console.log("  KEY", key, "PATH", path2, "TREE", tree.path);

      if (!(key in tree.namemap)) {
        let tree2 = document.createElement("dopesheet-treeitem-x");
        tree2.name = key;
        tree2.path = key;
        tree2.parent = tree;

        tree._prepend(tree2);

        tree2.addEventListener("change", this._onchange);
        tree2.pathid = idgen++;

        if (tree2.ctx) {
          //tree2._init();
        }

        if (this.treeData[tree2.pathid] !== undefined) {
          tree2.setCollapsed(this.treeData[tree2.pathid]);
        }

        this.pathmap[path2] = tree2;
        tree.namemap[key] = tree2;
      }

      lasttree = tree;
      tree = tree.namemap[key];
    }

    if (!(path in this.pathmap))
      this.totpath++;

    tree.pathid = id;
    this.pathmap[path] = tree;

    this.flushUpdate();

    return tree;
  }

  set_y(path, y) {
    if (typeof path === "string") {
      path = this.pathmap[path];
    }

    if (path) {
      path.style["top"] = (y / UIBase.getDPI()) + "px";
    }
  }

  get_y(path) {
    if (typeof path === "string") {
      if (!(path in this.pathmap)) {
        return undefined;
      }

      path = this.pathmap[path];
    }

    let a = this.getClientRects()[0];
    let b = path.getClientRects()[0];
    let dpi = UIBase.getDPI();

    if (a !== undefined && b !== undefined) {
      return (b.top - a.top) * dpi;
    } else {
      return undefined;
    }
  }

  get_x(path) {
    return 0;
  }

  setCSS() {
    super.setCSS();

    this.style["width"] = "55px";
    this.style["height"] = "500px";
  }

  static define() {
    return {
      tagname: "dopesheet-treepanel-x",
      style: "dopesheet"
    }
  }
}
UIBase.register(TreePanel);

export class ChannelState {
  constructor(type, state, eid) {
    this.type = type;
    this.state = state;
    this.eid = eid;
  }
}
ChannelState.STRUCT = `
ChannelState {
  type     :  int;
  state    :  bool;
  eid      :  int;
}
`
nstructjs.register(ChannelState);

export class PanOp extends ToolOp {
  is_modal : boolean
  start_pan : Vector2
  first_draw : boolean
  start_mpos : Vector2
  first : boolean
  cameramat : Matrix4;

  constructor(dopesheet) {
    super();

    this.ds = dopesheet;

    this._last_dpi = undefined;

    this.is_modal = true;
    this.undoflag |= UndoFlags.NO_UNDO;
    this.start_pan = new Vector2(dopesheet.pan);
    this.first_draw = true;

    this.start_mpos = new Vector2();
    this.first = true;

    this.start_cameramat = undefined;
    this.cameramat = new Matrix4();
  }

  static tooldef() {return {
    is_modal : true,
    toolpath : "dopesheet.pan",
    undoflag : UndoFlags.NO_UNDO,
    inputs   : {},
    outputs  : {},
    icon     : -1
  }}

  modalStart(ctx) {
    this.start_cameramat = new Matrix4(ctx.view2d.cameramat);
  }

  on_mousemove(event) {
    var mpos = new Vector3([event.x, event.y, 0]);

    console.log(event.x, event.y);
    //console.log("mousemove!");

    if (this.first) {
      this.first = false;
      this.start_mpos.load(mpos);

      return;
    }

    var ctx = this.modal_ctx;

    this.ds.pan[0] = this.start_pan[0] + (mpos[0] - this.start_mpos[0]);
    this.ds.pan[1] = this.start_pan[1] + (mpos[1] - this.start_mpos[1]);

    //this.cameramat.load(this.start_cameramat).translate(mpos[0], mpos[1], 0.0);
    //ctx.view2d.set_cameramat(this.cameramat);

    this.ds.buildPositions();
    this.ds.redraw();
    this.ds.update();
  }

  on_mouseup(event) {
    this.modalEnd();
  }
}

const KX=0, KY=1, KW=2, KH=3, KEID=5, KTYPE=6, KFLAG=7, KTIME=9, KEID2=10, KTOT=11;

export class KeyBox {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.w = 0;
    this.h = 0;
    this.flag = 0;
    this.eid = 0;
    this.ki = -1;
  }
}

let keybox_temps = util.cachering.fromConstructor(KeyBox, 512);
let proj_temps = util.cachering.fromConstructor(Vector2, 512);

export class DopeSheetEditor extends Editor {
  posRegen      : number
  gridGen       : number
  activeBoxes   : Array<number>
  treeData      : Array<number>
  nodes         : Array<DagNode>;
  mdown         : boolean;

  constructor() {
    super()

    this.draw = this.draw.bind(this);

    this.mdown = false;
    this.gridGen = 0;
    this.posRegen = 0;

    this.nodes = [];
    this.treeData = [];
    this.activeChannels = [];
    this.activeBoxes = [];

    this.pan = new Vector2();
    this.zoom = 1.0;
    this.timescale = 1.0;

    this.canvas = this.getCanvas("bg");
    this._animreq = undefined;
    this.pinned_ids = [];

    this.keyboxes = [];
    this.keybox_eidmap = {};

    this.boxSize = 15;
    this.start_mpos = new Vector2();

    this.on_mousedown = this.on_mousedown.bind(this);
    this.on_mousemove = this.on_mousemove.bind(this);
    this.on_mouseup = this.on_mouseup.bind(this);
    this.on_keydown = this.on_keydown.bind(this);

    this.addEventListener("mousedown", this.on_mousedown);
    this.addEventListener("mousemove", this.on_mousemove);
    this.addEventListener("mouseup", this.on_mouseup);
    //this.addEventListener("keydown", this.on_keydown);

    this.channels = document.createElement("dopesheet-treepanel-x");

    this.channels.onchange = (e) => {
      //this.doOnce(() => {
        console.warn("channels flagged onchange", this.channels.saveTreeData(), this.channels.saveTreeData());

        this.rebuild();
        this.redraw();
      //});
    }

    this.define_keymap();
  }

  define_keymap() {
    this.keymap = new KeyMap("dopesheet");

    let k = this.keymap;

    k.add(new HotKey("A", [], "Toggle Select All"), new FuncKeyHandler(function(ctx) {
      console.log("Dopesheet toggle select all!");

      let tool = new ToggleSelectAll();
      ctx.api.execTool(ctx, tool);

      window.force_viewport_redraw();
      window.redraw_viewport();
    }));

    //DeleteKeysOp
    k.add_tool(new HotKey("X", [], "Delete"), "anim.delete_keys()");
    k.add_tool(new HotKey("Delete", [], "Delete"), "anim.delete_keys()");

    k.add(new HotKey("G", [], "Move Keyframes"), new FuncKeyHandler(function(ctx) {
      console.log("Dopesheet toggle select all!");

      let tool = new MoveKeyFramesOp();
      ctx.api.execTool(ctx, tool);

      window.force_viewport_redraw();
      window.redraw_viewport();
    }));

    k.add(new HotKey("Z", ["CTRL"], "Undo"), new FuncKeyHandler(function(ctx) {
      g_app_state.toolstack.undo();
    }));

    k.add(new HotKey("Z", ["CTRL", "SHIFT"], "Redo"), new FuncKeyHandler(function(ctx) {
      g_app_state.toolstack.redo();
    }));

    k.add(new HotKey("Up", [], "Frame Ahead 10"), new FuncKeyHandler(function(ctx) {
      ctx.scene.change_time(ctx, ctx.scene.time+10);
      window.force_viewport_redraw();
      window.redraw_viewport();
    }));

    k.add(new HotKey("Down", [], "Frame Back 10"), new FuncKeyHandler(function(ctx) {
      ctx.scene.change_time(ctx, ctx.scene.time-10);
      window.force_viewport_redraw();
      window.redraw_viewport();
    }));

    k.add(new HotKey("Right", [], ""), new FuncKeyHandler(function(ctx) {
      console.log("Frame Change!", ctx.scene.time+1);
      ctx.scene.change_time(ctx, ctx.scene.time+1);

      window.redraw_viewport();
      //var tool = new FrameChangeOp(ctx.scene.time+1);
    }));

    k.add(new HotKey("Left", [], ""), new FuncKeyHandler(function(ctx) {
      console.log("Frame Change!", ctx.scene.time-1);
      ctx.scene.change_time(ctx, ctx.scene.time-1);

      window.redraw_viewport();
      //var tool = new FrameChangeOp(ctx.scene.time-1);
    }));
  }

  get_keymaps() {
    return [
      this.keymap
    ];
  }

  init() {
    super.init();

    this.channels.float(0, 0);

    this.channels.style["overflow"] = "hidden";
    this.style["overflow"] = "hidden";

    //row.add(this.channels);
    this.shadow.appendChild(this.channels);

    this.startbutton = this.header.iconbutton(Icons.ANIM_START, "Animation Playback", () => {
      console.log("playback");
    });
    this.startbutton.iconsheet = 0;

    let prev = this.header.tool("anim.nextprev(dir=-1)", PackFlags.USE_ICONS);
    prev.icon = Icons.ANIM_PREV;
    prev.iconsheet = 0;

    /*
    this.prevbutton = this.header.iconbutton(Icons.ANIM_PREV, "Previous Keyframe", () => {
      console.log("playback");
    });
    this.prevbutton.iconsheet = 0;*/

    this.playbutton = this.header.iconbutton(Icons.ANIM_PLAY, "Animation Playback", () => {
      console.log("playback");
      this.ctx.screen.togglePlayback();
    });
    this.playbutton.iconsheet = 0;

    let next = this.header.tool("anim.nextprev(dir=1)", PackFlags.USE_ICONS);
    next.icon = Icons.ANIM_NEXT;
    next.iconsheet = 0;

    this.endbutton = this.header.iconbutton(Icons.ANIM_END, "Animation Playback", () => {
      console.log("playback");
    });
    this.endbutton.iconsheet = 0;


    this.header.prop("scene.frame");
    this.header.prop("dopesheet.timescale");

    this._queueDagLink = true;

    this.rebuild();
    this.redraw();

    this.define_keymap();
  }

  dag_unlink_all() {
    for (var node of this.nodes) {
      node.dag_unlink();
    }

    this.nodes = [];
  }

  calcUpdateHash() {
    let hash = 0;
    let add = 0;

    function dohash(h) {
      h = ((h + add)*((1<<19)-1)) & ((1<<19)-1);
      add = (add + (1<<25)) & ((1<<19)-1);

      hash = hash ^ h;
    }

    let ctx = this.ctx;
    if (!ctx) {
      return 0;
    }

    let spline = ctx.frameset ? ctx.frameset.spline : undefined
    if (!spline) {
      return 1;
    }

    dohash(spline.verts.selected.length);
    dohash(spline.handles.selected.length);
    dohash(spline.updateGen);

    if (this.canvas) {
      dohash(this.canvas.width);
      dohash(this.canvas.height);
    }

    return hash;
  }

  get treeData() {
    if (treeDebug) console.warn("treeData get", this._treeData);
    return this._treeData;
  }

  set treeData(v) {
    this._treeData = v;
    if (treeDebug) console.warn("treeData set", this._treeData, v);
  }

  update() {
    if (!window.g_app_state) return;

    super.update();

    if (g_app_state.modalstate & ModalStates.PLAYING) {
      this.playbutton.icon = Icons.ANIM_PAUSE;
    } else {
      this.playbutton.icon = Icons.ANIM_PLAY;
    }

    let hash = this.calcUpdateHash();
    if (hash !== this._last_hash1) {
      console.log("dopesheet hash rebuild update", hash);
      this._last_hash1 = hash;
      this.rebuild();
      this.redraw();
    }

    if (this.regen) {
      this.redraw();
    }

    this.channels.style["top"] = (this.pan[1]*this.zoom/UIBase.getDPI()) + "px";

    if (this._queueDagLink) {
      this.linkEventDag();
    }

    if (this.boxSize !== this.getDefault("boxSize")) {
      this.boxSize = this.getDefault("boxSize");
      this.rebuild();
      return;
    }

    let panupdate = "" + this.pan[0] + ":" + this.pan[1];
    panupdate += "" + this.zoom + ":" + this.timescale;

    if (panupdate !== this._last_panupdate_key) {
      console.log("dopesheet key shape style change detected");
      this._last_panupdate_key = panupdate;

      this.updateKeyPositions();
    }

    let stylekey = "" + this.getDefault("lineWidth");
    stylekey += this.getDefault("lineMajor")
    stylekey += this.getDefault("lineMinor")
    stylekey += this.getDefault("keyColor");
    stylekey += this.getDefault("keySelect");
    stylekey += this.getDefault("keyHighlight");
    stylekey += this.getDefault("keyBorder");
    stylekey += this.getDefault("keyBorderWidth");
    stylekey += this.getDefault("textShadowColor");
    stylekey += this.getDefault("textShadowSize");
    stylekey += this.getDefault("DefaultText").color;
    stylekey += this.getDefault("DefaultText").size;
    stylekey += this.getDefault("DefaultText").font;


    if (stylekey !== this._last_style_key_1) {
      console.log("dopesheet style change detected");
      this._last_style_key_1 = stylekey;
      this.redraw();
    }
  }

  project(p) {
    //p[0] = p[0]*this.zoom*this.timescale + this.pan[0];
    //p[1] = p[1]*this.zoom*this.timescale + this.pan[1];

    p[0] = (p[0] + this.pan[0]) * this.zoom;
    p[1] = (p[1] + this.pan[1]) * this.zoom;
  }

  unproject(p) {
    //p[0] = (p[0]-this.pan[0])/this.zoom/this.timescale;
    //p[1] = (p[1]-this.pan[1])/this.zoom/this.timescale;

    p[0] = (p[0]/this.zoom) - this.pan[0];
    p[1] = (p[1]/this.zoom) - this.pan[1];
  }

  rebuild() {
    this.regen = 1;
    this.redraw();
  }

  get verts() {
    let this2 = this;

    if (!this.ctx) {
      this.rebuild();
      return [];
    }

    return (function* () {
      let ctx = this2.ctx;
      if (!ctx) return;

      let spline = ctx.frameset ? ctx.frameset.spline : undefined;
      if (!spline) return;

      for (let v of spline.verts.selected.editable(ctx)) {
        yield v;
      }
      for (let h of spline.handles.selected.editable(ctx)) {
        yield h;
      }
    })();
  }

  on_mousedown(e) {
    this.updateHighlight(e);

    if (!e.button) {
      this.mdown = true;
      this.start_mpos[0] = e.x;
      this.start_mpos[1] = e.y;
    }

    if (!e.button && this.activeBoxes.highlight !== undefined) {
      let ks = this.keyboxes;
      let ki1 = this.activeBoxes.highlight;
      let list = [];

      let x1 = ks[ki1+KX], y1 = ks[ki1+KY], t1 = ks[ki1+KTIME];
      let count=0;

      for (let ki2=0; ki2<ks.length; ki2 += KTOT) {
        let x2 = ks[ki2+KX], y2 = ks[ki2+KY], t2 = ks[ki2+KTIME];
        let eid2 = ks[ki2+KEID2];

        if (Math.abs(t2-t1) < 1 && Math.abs(y2-y1) < 1) {
          list.push(AnimKeyTypes.SPLINE);
          list.push(eid2);

          let flag = ks[ki2+KFLAG];
          if (flag & AnimKeyFlags.SELECT) {
            count++;
          }
        }
      }

      let mode = SelModes2.UNIQUE;
      if (e.shiftKey) {
        mode = count > 0 ? SelModes2.SUB : SelModes2.ADD;
      }

      //clear highlight after click for touch events
      if (eventWasTouch(e)) {
        this.activeBoxes.highlight = undefined;
      }

      let tool = new SelectKeysOp();
      console.log(tool);

      tool.inputs.mode.setValue(mode);
      tool.inputs.keyList.setValue(list);
      this.ctx.toolstack.execTool(this.ctx, tool);

      return;
    } else if (e.button === 0 && !e.altKey && !e.shiftKey && !e.ctrlKey && !e.commandKey) {
      let p1 = new Vector2(this.getLocalMouse(e.x, e.y));
      this.unproject(p1);
      let time1 = ~~(p1[0]/this.timescale/this.boxSize+0.5);

      this.ctx.scene.change_time(this.ctx, time1);
      console.log("time", time1);
    }

    if (e.button > 0 || e.altKey) {
      this.ctx.toolstack.execTool(this.ctx, new PanOp(this));
    }
  }

  getLocalMouse(x, y) {
    let r = this.canvas.getClientRects()[0];
    let dpi = UIBase.getDPI();

    let ret = new Vector2();
    if (!r) return ret;

    x -= r.x;
    y -= r.y;
    x *= dpi;
    y *= dpi;

    ret[0] = x;
    ret[1] = y;

    return ret;
  }

  findnearest(mpos, limit = 25) {
    this.getGrid();

    limit *= UIBase.getDPI();

    let ks = this.keyboxes;
    let p = new Vector2();
    let mindis = 1e17, minret;

    for (let ki of this.activeBoxes) {
      let x = ks[ki+KX], y = ks[ki+KY];

      p[0] = x;
      p[1] = y;

      this.project(p);

      let dist = p.vectorDistance(mpos);
      if (dist < mindis && dist < limit) {
        minret = ki;
        mindis = dist;
      }
    }

    return minret;
  }

  updateHighlight(e) {
    let mpos = this.getLocalMouse(e.x, e.y);

    let ret = this.findnearest(mpos);

    if (ret !== this.activeBoxes.highlight) {
      this.activeBoxes.highlight = ret;
      this.redraw();
    }
  }

  on_mousemove(e) {
    if (!this.mdown) {
      this.updateHighlight(e);
    } else if (this.activeBoxes.highlight) {
      let mpos = new Vector2([e.x, e.y]);
      let dist = this.start_mpos.vectorDistance(mpos);

      console.log(dist.toFixed(2));

      if (dist > 10) {
        this.mdown = false;
        console.log("Tool exec!");

        let tool = new MoveKeyFramesOp();
        this.ctx.api.execTool(this.ctx, tool);
      }
    } else {
      let p1 = new Vector2(this.getLocalMouse(e.x, e.y));
      this.unproject(p1);
      let time1 = ~~(p1[0]/this.timescale/this.boxSize+0.5);

      if (time1 !== this.ctx.scene.time) {
        this.ctx.scene.change_time(this.ctx, time1);
        console.log("time", time1);
      }
    }
  }

  on_mouseup(e) {
    this.mdown = false;
  }

  on_keydown(e) {

  }

  build() {
    if (this.regen === 2) {
      return;
    }

    let timescale = this.timescale;
    let boxsize = this.boxSize;

    let cellwid = boxsize*this.zoom*this.timescale;


    console.warn("rebuilding dopesheet");
    let canvas = this.canvas;

    function getVPath(eid) {
      if (typeof eid !== "number") {
        throw new Error("expected a number for eid " + eid);
      }
      return "spline." + eid;
    }

    let gw = canvas.width>>2;
    let gh = canvas.height>>2;
    let grid = this.grid = new Float64Array(gw*gh);
    grid.width = gw;
    grid.height = gh;
    grid.ratio = 4.0;

    for (let i=0; i<grid.length; i++) {
      grid[i] = -1;
    }

    this.treeData = this.channels.saveTreeData(this.treeData);

    this.channels.reset();
    this.activeChannels = [];
    this.activeBoxes = [];
    this.activeBoxes.highlight = undefined;
    let paths = {};

    //this.channels.loadTreeData(this.treeData);

    for (let v of this.verts) {
      let path = this.channels.add_path(getVPath(v.eid), v.eid);
      let key = v.eid;

      paths[v.eid] = path;

      this.activeChannels.push(path);
    }

    this.channels.loadTreeData(this.treeData);
    this.regen = 2;

    this.doOnce(() => {
      this.channels.flushUpdate();
    });

    let co1 = new Vector2(), co2 = new Vector2();

    let stage2 = () => {
      this.channels.loadTreeData(this.treeData);
      this.regen = 0;
      this.keybox_eidmap = {};
      this.keyboxes.length = 0;

      let frameset = this.ctx.frameset;
      let spline = frameset.spline;
      let keys = this.keyboxes;

      let ts = this.getDefault("DefaultText").size*UIBase.getDPI();
      let lineh = ts*1.5; //Math.max(ts*1.5, this.boxSize);
      let y = lineh*0.5;

      for (let k in paths) {
        let v = spline.eidmap[k];

        if (!v) {
          console.warn("missing vertex", k);
          this.rebuild();
          return;
        }

        let path = paths[v.eid];
        if (!path) continue;
        if (path.isVisible) {
          y = this.channels.get_y(path) / this.zoom;
          //y += lineh;
          //this.channels.set_y(path, y / this.zoom);

          if (y === undefined) {
            this.regen = 2;
            window.setTimeout(stage2, 155);
            return;
          }
        }

        let vd = frameset.vertex_animdata[v.eid];
        if (!vd) {
          continue;
        }

        timescale = this.timescale;
        boxsize = this.boxSize;

        for (let v2 of vd.verts) {
          let ki = keys.length;

          this.keybox_eidmap[v2.eid] = ki;

          for (let i=0; i<KTOT; i++) {
            keys.push(0.0);
          }

          keys[ki+KTIME] = get_vtime(v2);
          keys[ki+KEID] = v.eid;
          keys[ki+KEID2] = v2.eid;
          keys[ki+KFLAG] = v2.flag & SplineFlags.UI_SELECT ? AnimKeyFlags.SELECT : 0;

          let time = get_vtime(v2);

          co1[0] = this.timescale * time * boxsize;
          co1[1] = y;

          keys[ki+KX] = co1[0];
          keys[ki+KY] = co1[1];
          keys[ki+KW] = boxsize;
          keys[ki+KH] = boxsize;

          this.project(co1);
          let ix = ~~((co1[0]+boxsize*0.5)/grid.ratio);
          let iy = ~~((co1[1]+boxsize*0.5)/grid.ratio);

          if (ix >= 0 && iy >= 0 && ix <= grid.width && iy <= grid.height) {
            let gi = iy*grid.width + ix;

            if (grid[gi] < 0) {
              grid[gi] = ki;
              this.activeBoxes.push(ki);
            }
          }
          //let x = time*this.timescale*
        }
      }

      this.redraw();
    }

    window.setTimeout(stage2, 155);
  }

  buildPositions() {
    this.posRegen = 0;
    let ks = this.keyboxes;

    let pathspline = this.ctx.frameset.pathspline;
    let boxsize = this.boxSize;

    for (let ki=0; ki<ks.length; ki += KTOT) {
      let type = ks[ki+KTYPE], eid = ks[ki+KEID], eid2=ks[ki+KEID2]

      if (type === AnimKeyTypes.SPLINE) {
        let v = pathspline.eidmap[eid2];

        if (!v) {
          console.warn("Missing vertex animkey in dopesheet; rebuilding. . .");
          this.rebuild();
          return;
        }

        let time = get_vtime(v);
        let x = this.timescale * time * boxsize;
        let flag = 0;

        if (v.flag & SplineFlags.UI_SELECT) {
          flag |= AnimKeyFlags.SELECT;
        }

        ks[ki+KW] = boxsize;
        ks[ki+KH] = boxsize;
        ks[ki+KX] = x;
        ks[ki+KFLAG] = flag;
        ks[ki+KTIME] = get_vtime(v);
      } else {
        throw new Error("implement me! '" + type + "'");
      }
    }

    this.updateGrid();
  }

  updateKeyPositions() {
    this.posRegen = 1;
    this.redraw();
  }

  updateGrid() {
    this.gridGen++;
  }

  getGrid() {
    if (!this.grid || this.grid.gen !== this.gridGen) {
      this.recalcGrid();
    }

    return this.grid;
  }

  recalcGrid() {
    console.log("rebuilding grid");

    if (!this.grid) {
      let ratio = 4;
      let gw = this.canvas.width>>2, gh = this.canvas.height>>2;
      this.grid = new Float64Array(gw*gh);
      this.grid.width = gw;
      this.grid.height = gh;
      this.grid.ratio = ratio;
    }

    let grid = this.grid;
    grid.gen = this.gridGen;

    let gw = grid.width, gh = grid.height;
    for (let i=0; i<grid.length; i++) {
      grid[i] = -1;
    }

    this.activeBoxes = [];
    let p = new Vector2();

    let ks = this.keyboxes;
    for (let ki=0; ki<ks.length; ki += KTOT) {
      let x = ks[ki+KX], y = ks[ki+KY], w = ks[ki+KW], h = ks[ki+KH];

      p[0] = x + w*0.5;
      p[1] = y + h*0.5;

      this.project(p);

      let ix = ~~(p[0]/grid.ratio);
      let iy = ~~(p[1]/grid.ratio);

      if (ix >= 0 && iy >= 0 && ix <= gw && iy <= gh) {
        let gi = iy*gw + ix;

        if (grid[gi] < 0) {
          grid[gi] = ki;
          this.activeBoxes.push(ki);
        }
      }

    }
  }

  getKeyBox(ki) {
    let kd = this.keyboxes;
    let ret = keybox_temps.next();
    
    ret.x = kd[ki+KX];
    ret.y = kd[ki+KY];
    ret.w = kd[ki+KH];
    ret.h = kd[ki+KW];
    ret.flag = kd[ki+KFLAG];
    ret.eid = kd[ki+KEID];

    return ret;
  }
  
  redraw() {
    if (!this.isConnected && this.nodes.length > 0) {
      console.warn("Dopesheet editor failed to clean up properly; fixing. . .");
      this.dag_unlink_all();
      return;
    }

    if (this._animreq !== undefined) {
      return;
    }

    this._animreq = requestAnimationFrame(this.draw);
  }

  draw() {
    this._animreq = undefined;

    if (this.regen) {
      this.build();
      this.posRegen = 0;
      this.doOnce(this.draw);
      return;
    } else if (this.posRegen) {
      this.buildPositions();
    }

    let boxsize = this.boxSize, timescale = this.timescale;
    let zoom = this.zoom, pan = this.pan;

    let canvas = this.canvas = this.getCanvas("bg", "-1");
    let g = this.canvas.g;

    if (_DEBUG.timeChange)
      console.log("dopesheet draw!");

    //g.clearRect(0, 0, canvas.width, canvas.height);
    g.beginPath()
    g.rect(0, 0, canvas.width, canvas.height);
    g.fillStyle = "rgb(55,55,55,1.0)";
    g.fill();

    let bwid = ~~(boxsize*zoom*timescale);
    let time = ~~(-pan[0] / bwid);

    let off = this.pan[0] % bwid;
    let tot = ~~(canvas.width / bwid) + 1;

    let major = this.getDefault("lineMajor");
    let minor = this.getDefault("lineMinor");
    let lw1 = g.lineWidth;

    g.lineWidth = this.getDefault("lineWidth");

    for (let i=0; i<tot; i++) {
      let x = i*bwid + off;

      let t = ~~(time + i);

      if (t % 8 === 0) {
        g.strokeStyle = major;
      } else {
        g.strokeStyle = minor;
      }

      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, canvas.height);
      g.stroke();
    }

    g.lineWidth = lw1;

    let ks = this.keyboxes;
    g.beginPath();

    for (let ki=0; ki<ks.length; ki += KTOT) {
      let x = ks[ki], y = ks[ki+KY], w = ks[ki+KW], h = ks[ki+KH];

      x = (x*zoom) + pan[0];
      y = (y*zoom) + pan[1];

      g.rect(x, y, w, h);
    }

    g.fillStyle = "rgba(125, 125, 125, 1.0)";
    g.fill();

    g.fillStyle = "rgba(250, 250, 250, 0.5)";
    g.beginPath()

    let highlight = this.activeBoxes.highlight;

    let bs = this.boxSize*2;
    let width = canvas.width;
    let height = canvas.height;

    let colors = {
      0  : this.getDefault("keyColor"),
      [AnimKeyFlags.SELECT]  : this.getDefault("keySelect")
    };

    let highColor = this.getDefault("keyHighlight");
    let border = this.getDefault("keyBorder");
    g.strokeStyle = border;
    let lw2 = g.lineWidth;
    g.lineWidth = this.getDefault("keyBorderWidth");

    border = css2color(border)[3] < 0.01 ? undefined : border;

    for (let ki of this.activeBoxes) {
      let x = ks[ki], y = ks[ki+KY], w = ks[ki+KW], h = ks[ki+KH];

      x = (x*zoom) + pan[0];
      y = (y*zoom) + pan[1];

      let flag = ks[ki+KFLAG] & AnimKeyFlags.SELECT;
      let color = colors[flag];

      g.fillStyle = color;
      g.beginPath();
      g.rect(x, y, w, h);
      g.fill();

      if (border) {
        g.stroke();
      }

      if (x < -bs || y < -bs || x >= width+bs || y >= height+bs) {
        continue;
      }

      if (ki === highlight) {
        g.fillStyle = highColor;
        g.beginPath();
        g.rect(x, y, w, h);
        g.fill();

        if (border) {
          g.stroke();
        }
      }
    }

    g.lineWidth = lw2;

    //g.fill();

    if (_DEBUG.timeChange)
      console.log("D", off, tot, bwid);

    let ts = this.getDefault("DefaultText").size*UIBase.getDPI();
    g.fillStyle = this.getDefault("DefaultText").color;
    g.font = this.getDefault("DefaultText").genCSS(ts);

    g.strokeStyle = "rgba(0,0,0, 0.5)";


    let lw = g.lineWidth;

    let curtime = this.ctx.scene.time;
    let tx = curtime*this.zoom*this.timescale*boxsize + this.pan[0];
    if (tx >= 0 && tx <= this.canvas.width) {
      g.lineWidth = 3;
      g.strokeStyle = this.getDefault("timeLine");
      g.moveTo(tx, 0);
      g.lineTo(tx, this.canvas.height);
      g.stroke();
    }

    g.lineWidth = this.getDefault("textShadowSize");
    g.strokeStyle = this.getDefault("textShadowColor");

    let spacing = Math.floor((ts*4) / bwid);

    for (let i=0; i<tot; i++) {
      let x = i*bwid + off;
      let t = time + i;

      g.shadowBlur = 3.5;
      g.shadowColor = "black";
      g.shadowOffsetX=2;
      g.shadowOffsetY=2;

      if (spacing && ((~~t) % spacing) !== 0) {
        continue;
      }

      g.strokeText(""+t, x, canvas.height-ts*1.15);
      g.fillText(""+t, x, canvas.height-ts*1.15);

      g.shadowColor = "";
    }

    g.lineWidth = lw;
  }

  static define() { return {
    tagname : "dopesheet-editor-x",
    areaname : "dopesheet_editor",
    uiname : "Animation Keys",
    icon : Icons.DOPESHEET_EDITOR,
    style : "dopesheet"
  }}

  on_area_inactive() {
    this.dag_unlink_all();
  }

  on_area_active() {
    this._queueDagLink = true;
    this.doOnce(this.linkEventDag);
  }

  linkEventDag() {
    var ctx = this.ctx;

    if (ctx === undefined) {
      console.log("No ctx for dopesheet editor linkEventDag")
      //wait for ctx
      return;
    }

    if (this.nodes.length > 0) {
      this.dag_unlink_all();
    }

    this._queueDagLink = false;

    let on_sel = () => {
      console.log("------------------on sel!----------------");
      return this.on_vert_select(...arguments);
    }

    let on_vert_change = (ctx, inputs, outputs, graph) => {
      this.rebuild();
    };

    let on_vert_time_change = (ctx, inputs, outputs, graph) => {
      this.updateKeyPositions();
    };

    let on_time_change = (ctx, inputs, outputs, graph) => {
      if (_DEBUG.timeChange)
        console.log("dopesheet time change callback");
      this.redraw();
    };

    this.nodes.push(on_sel);
    this.nodes.push(on_vert_change);
    this.nodes.push(on_time_change);


    the_global_dag.link(ctx.scene, ["on_time_change"], on_time_change, ["on_time_change"]);

    //on_vert_select
    the_global_dag.link(ctx.frameset.spline.verts, ["on_select_add"], on_sel, ["eid"]);
    the_global_dag.link(ctx.frameset.spline.verts, ["on_select_sub"], on_sel, ["eid"]);

    //callback for when verts are added and removed
    the_global_dag.link(ctx.frameset.spline, ["on_vert_change"], on_vert_change, ["verts"]);
    the_global_dag.link(ctx.frameset.spline, ["on_keyframe_insert"], on_vert_change, ["verts"]);

    the_global_dag.link(ctx.frameset.pathspline, ["on_vert_time_change"], on_vert_time_change, ["verts"]);
  }

  on_vert_select() {
    this.rebuild();
    console.log("on vert select", arguments);
  }

  copy() {
    let ret = document.createElement("dopesheet-editor-x");

    ret.pan[0] = this.pan[0];
    ret.pan[1] = this.pan[1];

    ret.pinned_ids = this.pinned_ids;
    ret.selected_only = this.selected_only;

    ret.time_zero_x = this.time_zero_x;
    ret.timescale = this.timescale;

    ret.zoom = this.zoom;

    return ret;
  }

  loadSTRUCT(reader) {
    reader(this);
    super.loadSTRUCT(reader);

    this.channels.loadTreeData(this.treeData);
  }
}

DopeSheetEditor.STRUCT = STRUCT.inherit(DopeSheetEditor, Editor) + `
    pan             : vec2 | this.pan;
    zoom            : float;
    timescale       : float;
    selected_only   : int;
    pinned_ids      : array(int) | this.pinned_ids != undefined ? this.pinned_ids : [];
    treeData        : array(int) | this.channels.saveTreeData();
}
`;

Editor.register(DopeSheetEditor);

//DopeSheetEditor.uiname = "Dopesheet";
DopeSheetEditor.debug_only = false;
