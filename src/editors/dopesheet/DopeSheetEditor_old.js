import {Area} from '../../path.ux/scripts/screen/ScreenArea.js';
import {STRUCT} from '../../core/struct.js';
import {UIBase} from '../../path.ux/scripts/core/ui_base.js';
import {Editor} from '../editor_base.js';

"use strict";

import {aabb_isect_2d} from '../../util/mathlib.js';
//import {gen_editor_switcher} from 'UIWidgets_special';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, HotKey,
  charmap, TouchEventManager, EventHandler} from '../events.js';

import {STRUCT} from '../../core/struct.js';
import {phantom, KeyTypes, FilterModes,
  get_select, get_time, set_select, set_time
} from './dopesheet_phantom.js';

import {PackFlags, UIFlags, UIBase, color2css, _getFont_new} from '../../path.ux/scripts/core/ui_base.js';

import {ToolOp, UndoFlags, ToolFlags} from '../../core/toolops_api.js';

import {ToolOp} from '../../core/toolops_api.js';
import {UndoFlags} from '../../core/toolops_api.js';

import {Spline, RestrictFlags} from '../../curve/spline.js';
import {CustomDataLayer, SplineTypes, SplineFlags, SplineSegment} from '../../curve/spline_types.js';
import {TimeDataLayer, get_vtime, set_vtime,
  AnimKey, AnimChannel, AnimKeyFlags, AnimInterpModes
} from '../../core/animdata.js';

import {SplineLayerFlags, SplineLayerSet} from '../../curve/spline_element_array.js';

import {SplineFlags} from '../../curve/spline_base.js';
import {AddLayerOp, ChangeLayerOp, ChangeElementLayerOp} from '../viewport/spline_layerops.js';
import {DissolveVertOp} from '../viewport/spline_editops.js';

import {ShiftTimeOp2, ShiftTimeOp3, SelectOp, DeleteKeyOp,
  ColumnSelect, SelectKeysToSide, ToggleSelectOp
} from './dopesheet_ops.js';

let projrets = cachering.fromConstructor(Vector2, 128);

const RecalcFlags = {
  CHANNELS : 1,
  REDRAW_KEYS : 2,
  ALL : 1|2
};

/******************* main area struct ********************************/
import {Area} from '../../path.ux/scripts/screen/ScreenArea.js';
import {Container, ColumnFrame, RowFrame} from '../../path.ux/scripts/core/ui.js';

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
    this.collapsed = false;

    //bind for doOnce
    this.rebuild_intern = this.rebuild_intern.bind(this)
    this._redraw = this._redraw.bind(this);
  }

  //*
  init() {
    super.init();

    let row = this.widget = this.row();

    //*
    this.icon = row.iconbutton(Icons.UI_EXPAND, "", () => {
      this.set_collapsed(!this.collapsed);

      this.setCSS();
    }, undefined, PackFlags.SMALL_ICON);
    //*/

    row.label(this.name);

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

    while (p != undefined && !(p.parent instanceof TreePanel)) {
      p = p.parent;
      path = p.path + "." + path;
    }

    return path;
  }

  set_collapsed(state) {
    if (this.icon !== undefined) {
      this.icon.icon = !state ? Icons.UI_COLLAPSE : Icons.UI_EXPAND;
    }

    if (state && !this.collapsed) {
      this.collapsed = true;

      for (let k in this.namemap) {
        let child = this.namemap[k];

        if (child.parentNode) {
          child.remove();
        }
      }
    } else if (this.collapsed) {
      this.collapsed = false;

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
    this.set_collapsed(data.collapsed);
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

    this.tree = document.createElement("dopesheet-treeitem-x");
    this.tree.path = "root";
    this.add(this.tree);

    this.totpath = 0;
    this.pathmap = {root: this.tree};

    this.rebuild_intern = this.rebuild_intern.bind(this)
    this._redraw = this._redraw.bind(this);
  }

  init() {
    super.init();

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

  load_collapsed(map) {
    for (let path in map) {
      let child = this.pathmap[path];

      if (child) {
        child.set_collapsed(map[path]);
      }
    }

    this.setCSS();
  }

  is_collapsed(path) {
    return path in this.pathmap ? this.pathmap[path].collapsed : false;
  }

  rebuild() {
    this.doOnce(this.rebuild_intern());
  }

  reset() {
    this.totpath = 0;

    for (let k in this.pathmap) {
      let v = this.pathmap[k];

      v.remove();
    }

    this.pathmap = {};

    this.tree.remove();

    this.tree = document.createElement("dopesheet-treeitem-x");
    this.tree.path = "root";
    this.add(this.tree);
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

  has_path(path) {
    return path in this.pathmap;
  }

  add_path(path) {
    path = path.trim();

    var paths = path.split(".")
    var tree = this.tree;
    var lasttree = undefined;

    if (paths[0].trim() == "root")
      paths = paths.slice(1, paths.length);

    //console.log("PATH", path);

    var path2 = "";
    for (var i=0; i<paths.length; i++) {
      var key = paths[i].trim();

      if (i == 0)
        path2 = key;
      else
        path2 += "." + key;

      //console.log("  KEY", key, "PATH", path2, "TREE", tree.path);

      if (!(key in tree.namemap)) {
        let tree2 = document.createElement("dopesheet-treeitem-x");
        tree2.name = key;
        tree2.path = key;
        tree._prepend(tree2);

        this.pathmap[path2] = tree2;
        tree.namemap[key] = tree2;
      }

      lasttree = tree;
      tree = tree.namemap[key];
    }

    if (!(path in this.pathmap))
      this.totpath++;
    this.pathmap[path] = tree;
  }

  get_y(path) {
    if (!(path in this.pathmap)) {
      return undefined;
    }

    let item = this.pathmap[path];
    let a = this.getClientRects()[0];
    let b = item.getClientRects()[0];
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

export class PanOp extends ToolOp {
  is_modal : boolean
  start_pan : Vector2
  first_draw : boolean
  start_mpos : Vector2
  first : boolean
  cameramat : Matrix4;

  constructor(start_mpos, dopesheet) {
    super();

    this.ds = dopesheet;

    this._last_dpi = undefined;

    this.is_modal = true;
    this.undoflag |= UndoFlags.NO_UNDO;
    this.start_pan = new Vector2(dopesheet.pan);
    this.first_draw = true;

    if (0 && start_mpos != undefined) {
      this.start_mpos = new Vector2(start_mpos);

      this.first = false;
    } else {
      this.start_mpos = new Vector2();

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

    console.log(event.x, event.y);
    //console.log("mousemove!");

    if (this.first) {
      this.first = false;
      this.start_mpos.load(mpos);

      return;
    } else {

    }

    var ctx = this.modal_ctx;

    this.ds.pan[0] = this.start_pan[0] + (mpos[0] - this.start_mpos[0]);
    this.ds.pan[1] = this.start_pan[1] + -(mpos[1] - this.start_mpos[1]);

    //this.cameramat.load(this.start_cameramat).translate(mpos[0], mpos[1], 0.0);
    //ctx.view2d.set_cameramat(this.cameramat);

    this.ds._redraw(RecalcFlags.REDRAW_KEYS);
  }

  on_mouseup(event) {
    this.end_modal();
  }
}


export class DopeSheetEditor extends Editor {
  _queue_full_recalc : boolean
  _queueDagLink : boolean
  _last_sel_ctx_key : string
  nodemap : Object
  _get_key_ret_cache : cachering
  selected_only : boolean
  time_zero_x : number
  pan : Vector2
  first : boolean
  groups : Object
  _recalc_cache : Object
  vdmap : Object
  heightmap : Object
  rowmap : Object
  totchannel : number
  old_keyboxes : Object
  collapsed_cache : Object
  cameramat : Matrix4
  rendermat : Matrix4
  irendermat : Matrix4
  zoom : number
  timescale : number
  vmap : Object
  last_time : number
  collapsemap : Object
  mpos : Vector3
  mdown : boolean
  start_mpos : Vector3
  CWID : number
  keymap : KeyMap;

  constructor(pos, size) {
    super();

    this.rebuild_intern = this.rebuild_intern.bind(this)
    this._redraw = this._redraw.bind(this);

    this._queue_full_recalc = true;
    this._queueDagLink = true;
    this._last_sel_ctx_key = "";

    this.pinned_ids = undefined;
    this.nodes = [];
    this.nodemap = {};
    this._last_path_count = undefined;

    this._get_key_ret_cache = new cachering(function () {
      return [0, 0, 0];
    }, 2048);

    this.selected_only = true;
    this.time_zero_x = 4;
    this.pan = new Vector2([0, 0]);
    this.dirty_rects = [];

    this.first = true;
    this.groups = {}; // ?
    this._recalc_cache = {};

    this.vdmap = {};
    this.heightmap = {};
    this.rowmap = {};
    this.totchannel = 0;

    this.old_keyboxes = {}; //used to cache keybox rect to clear later, when key moves
    this.collapsed_cache = {};

    this.nodemap = {};

    this.cameramat = new Matrix4();
    this.rendermat = new Matrix4();
    this.irendermat = new Matrix4();
    this.zoom = 1.0;
    this.timescale = 24.0;
    this.vmap = {};
    this.last_time = 0;

    this.phantom_cache = cachering.fromConstructor(phantom, 2048);

    this.highlight = undefined;
    this.active = undefined;
    this.collapsemap = {};

    this.mpos = new Vector3();
    this.mdown = false;
    this.start_mpos = new Vector3();

    this.CHGT = CHGT;
    this.CWID = 16;

    this.keymap = new KeyMap();
    this.define_keymap();

    //this.on_mousedown = Editor.wrapContextEvent(this.on_mousedown.bind(this));
    //this.on_mousemove = Editor.wrapContextEvent(this.on_mousemove.bind(this));
    //this.on_mouseup = Editor.wrapContextEvent(this.on_mouseup.bind(this));
  }

  makeHeader(container) {
    let row = super.makeHeader(container);
    row.noMargins();

    row.prop("scene.frame");
    return row;
  }
  init() {
    super.init();

    this.addEventListener("mousedown", this.on_mousedown.bind(this), false);
    this.addEventListener("mousemove", this.on_mousemove.bind(this), false);
    this.addEventListener("mouseup", this.on_mouseup.bind(this), false);

    let canvas = this.canvas = this.getCanvas("bg", 0, false); //document.createElement("canvas");
    let g = this.g = canvas.g; //canvas.getContext("2d");

    let fgcanvas = this.fgcanvas = this.getCanvas("fg", 1, false);

    //let row = this.container.row();

    this.channels = document.createElement("dopesheet-treepanel-x");
    this.channels.float(0, 0);

    this.channels.style["overflow"] = "hidden";
    this.style["overflow"] = "hidden";

    //row.add(this.channels);
    this.shadow.appendChild(this.channels);
    //this.channels.float(this.pos[0], 0.0);

    //row.add(canvas);
    //row.label("yay");
  }

  get abspos() {
    let rect = this.getClientRects()[0];

    return new Vector2([rect.x, rect.y]);
  }

  _redraw(full_recalc=0) {
    //make sure canvas styling is up to date
    this.getCanvas("bg");
    this.getCanvas("fg");
    this.getCanvas("grid");

    if (full_recalc) {
      let canvas = this.fgcanvas;
      canvas.g.clearRect(0, 0, canvas.width, canvas.height);
    }

    this.drawGrid();

    if (full_recalc) {
      this.dirty_rects.length = 0;
      this.rebuild_intern(full_recalc);
    }
  }

  setCSS() {
    super.setCSS();

    if (this.canvas === undefined) {
      return;
    }

    //this.style["background-color"] = "rgba(0,0,0,0)";

    let rect = this.canvas.getClientRects()[0];
    if (rect !== undefined) {
      let rect2 = this.getClientRects()[0];
      let dpi = UIBase.getDPI();

      this.channels.float(0.0, rect.top - rect2.top + this.pan[1]/dpi);
    }
  }

  rebuild_vdmap() {
    var frameset = this.ctx.frameset;

    this.vdmap = {};

    for (var vd_eid in frameset.vertex_animdata) {
      for (var v of frameset.vertex_animdata[vd_eid].verts) {
        this.vdmap[v.eid] = vd_eid;
      }
    }
  }

  get_vdatas() {
    var ctx = this.ctx, frameset = ctx.frameset, spline=frameset.spline, pathspline=frameset.pathspline;
    var vset = new set();

    if (this.pinned_ids != undefined) {
      for (var id of this.pinned_ids) {
        if (!(id & KeyTypes.PATHSPLINE))
          continue;

        var id1=id;
        id = this.vdmap[id & KeyTypes.CLEARMASK];

        if (id === undefined) {
          if (this.ctx != undefined) {
            this.rebuild_vdmap();

            console.warn("Warning, had to rebuild vdmap!", id1. id1 & KeyTypes.CLEARMASK, id1 & ~KeyTypes.CLEARMASK);
            id = this.vdmap[id & KeyTypes.CLEARMASK];

            if (id === undefined) {
              console.warn("  id was still undefined!");
              continue;
            }
          } else {
            continue;
          }
        }

        if (typeof id == "string") {
          id = parseInt(id);
        }

        var vd = frameset.get_vdata(id, false);

        if (vd != undefined)
          vset.add(vd);
      }
    } else if (this.selected_only) {
      for (var v of spline.verts.selected.editable(ctx)) {
        var vd = frameset.get_vdata(v.eid, false);

        if (vd != undefined)
          vset.add(vd);
      }
    } else {
      for (var v of spline.verts) {
        var vd = frameset.get_vdata(v.eid, false);

        if (vd != undefined)
          vset.add(vd);
      }
    }

    return vset;
  }

  scaletime(t) {
    return this.timescale*t;
  }

  unscaletime(t) {
    return t/this.timescale;
  }

  get_datakey(keyid) {
    if (typeof keyid != "number")
      keyid = keyid.id;

    keyid = keyid & KeyTypes.CLEARMASK;

    var chgt = this.CHGT, cwid = this.CWID;

    var ph = this.phantom_cache.next();

    ph.ds = this;
    ph.type = KeyTypes.DATAPATH;

    var key = ph.key = this.ctx.frameset.lib_anim_idmap[keyid];

    var ch = ph.ch = key.channel;
    ph.path = "root." + ch.path.replace("frameset.drawspline.", "");
    ph.path = ph.path.replace("[", ".").replace("]", "").trim();
    ph.id = key.id | ph.type;

    ph.time = key.time;

    var y = -1;

    var y2 = this.channels.get_y(ph.path);
    if (y2 != undefined && !isNaN(y2))
      y = y2;

    var pan = this.pan;

    ph.pos[0] = this.time_zero_x-2+this.scaletime(ph.time) + pan[0];
    ph.pos[1] = y + pan[1]; //TreePanel.get_y takes this into account: + pan[1];

    ph.size[0] = cwid, ph.size[1] = chgt;

    if (this.old_keyboxes[ph.id] == undefined) {
      var ph2 = this.old_keyboxes[ph.id] = new phantom();
      ph2.ds = this;

      ph2.load(ph);
      ph2.ch = undefined;
      ph2.key = keyid;
    }

    return ph;
  }

  get_vertkey(id) {
    if (typeof id != "number")
      id = id.eid;
    else
      id = id & KeyTypes.CLEARMASK;

    var v = this.ctx.frameset.pathspline.eidmap[id];
    var vd_eid = this.vdmap[v.eid];
    var vd = vd_eid != undefined ? this.ctx.frameset.vertex_animdata[vd_eid] : undefined;

    var ph = this.phantom_cache.next();
    ph.ds = this;
    ph.type = KeyTypes.PATHSPLINE;

    var chgt = this.CHGT, cwid = this.CWID;

    ph.vd = vd;
    ph.v = v;
    ph.id = v.eid | ph.type;
    ph.time = get_vtime(v);

    ph.path = "root.verts." + vd_eid;

    var y = -1;
    var y2 = this.channels.get_y(ph.path);

    //console.log("Channel y:", y2, ph.path);

    if (y2 != undefined)
      y = y2;

    var pan = this.pan;

    ph.pos[0] = this.time_zero_x-2+this.scaletime(ph.time)+pan[0];
    ph.pos[1] = y+pan[1];

    ph.size[0] = cwid, ph.size[1] = chgt;

    if (this.old_keyboxes[ph.id] === undefined) {
      var ph2 = this.old_keyboxes[ph.id] = new phantom();
      ph2.ds = this;

      ph2.load(ph);
      ph2.v = v.eid; ph2.vd = vd.eid;
    }

    return ph;
  }

  setselect(v, state) {
    if (typeof v == "number")
      v = this.ctx.frameset.pathspline.eidmap[veid];

    if (state)
      v.flag |= SplineFlags.UI_SELECT;
    else
      v.flag &= ~SplineFlags.UI_SELECT;
  }

  recalc(flag=RecalcFlags.REDRAW_KEYS) {
    console.warn("dopesheet recalc called");
    this._queue_full_recalc = flag;
  }

  updateDPI() {
    let dpi = UIBase.getDPI();

    if (dpi != this._last_dpi) {
      console.warn("dopesheet recalc dpi");

      this._last_dpi = dpi;
      this.setCSS();
      this._redraw(RecalcFlags.ALL);
    }
  }

  update() {
    super.update();

    this.updateDPI();

    if (this.ctx == undefined)
      return;

    let selctx = this.ctx.spline.buildSelCtxKey();

    if (selctx != this._last_sel_ctx_key) {
      this._last_sel_ctx_key = selctx;
      this.recalc();
    }

    if (this._queue_full_recalc) {
      let flag = this._queue_full_recalc;

      this._queue_full_recalc = false;

      this._redraw(flag);
    }

    var scene = this.ctx.scene;

    if (scene.time != this.last_time) {
      //console.log("detected frame update!");
      this._redraw(false);

      this.last_time = scene.time;
    }

    this.first = false;
    var this2 = this;


    if (this._queueDagLink) {
      this.linkEventDag();
    }

    let pathcount = this.channels.countPaths(true);

    if (this._last_path_count != pathcount) {
      this._last_path_count = pathcount;
      this.recalc();
    }
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

    function on_sel() {
      console.log("------------------on sel!----------------");
      return this2.on_vert_select.apply(this2, arguments);
    }

    let on_vert_change = (ctx, inputs, outputs, graph) => {
      this.recalc();
    };

    let on_vert_time_change = (ctx, inputs, outputs, graph) => {
      console.log(inputs, inputs ? Object.keys(inputs) : inputs);

      let verts = inputs.verts.data;
      let spline = ctx.frameset.spline;

      for (let eid of verts) {
        let v = spline.eidmap[eid];

        if (v === undefined || v.type != SplineTypes.VERTEX) {
          console.log("error in dopesheet on_vert_time_change node");
          continue;
        }

        this._on_sel_1(eid);
      }
    };

    this.nodes.push(on_sel);
    this.nodes.push(on_vert_change);

    //on_vert_select
    the_global_dag.link(ctx.frameset.spline.verts, ["on_select_add"], on_sel, ["eid"]);
    the_global_dag.link(ctx.frameset.spline.verts, ["on_select_sub"], on_sel, ["eid"]);

    //callback for when verts are added and removed
    the_global_dag.link(ctx.frameset.spline, ["on_vert_change"], on_vert_change, ["verts"]);

    the_global_dag.link(ctx.frameset.spline, ["on_vert_time_change"], on_vert_time_change, ["verts"]);
  }

  on_vert_select() {
    this.rebuild();
    console.log("on vert select", arguments);
  }

  update_collapsed_cache() {
    for (var path in this.collapsed_cache) {
      if (!(path in this.channels.pathmap)) {
        delete this.collapsed_cache[path];
        continue;
      }

      if (!this.channels.is_collapsed(path))
        delete this.collapsed_cache[path];
    }

    for (var path in this.channels.pathmap) {
      var ti = this.channels.pathmap[path];

      //if (!path.startsWith("root."))
      //  path = "root." + path;

      if (ti.collapsed)
        this.collapsed_cache[path] = true;
    }
  }

  _tree_collapsed_map() {
    //this.update_collapsed_cache();

    var ret = [];
    for (var k in this.collapsed_cache) {
      ret.push(k);
    }

    return ret;
  }

  //returns list of animchannels
  get_datapaths() {
    "use strict";

    let this2 = this;

    return (function* () {
      if (this2.ctx == undefined) return ([])[Symbol.iterator];

      var frameset = this2.ctx.frameset;
      var spline = frameset.spline;
      var actlayer = spline.layerset.active;

      if (this2.pinned_ids != undefined) {
        var visit = {};
        for (var id of this2.pinned_ids) {
          if (!(id & KeyTypes.DATAPATH))
            continue;

          id = id & KeyTypes.CLEARMASK;

          var key = frameset.lib_anim_idmap[id];
          var ch = key.channel;

          if (ch.path in visit) continue;

          visit[ch.path] = 1;
          yield ch;
        }
      } else {
        for (var i = 0; i < frameset.lib_anim_channels.length; i++) {
          //search for eid entry
          var ch = frameset.lib_anim_channels[i];

          var eid = ch.path.match(/\[[0-9]+\]/);
          if (eid == null) {
            console.log("Not an eid path", ch.path, eid);
            continue;
          }

          eid = eid[eid.length - 1];
          eid = parseInt(eid.slice(1, eid.length - 1));

          var e = spline.eidmap[eid];
          if (e == undefined) {
            console.log("e was null, not an eid path?", eid, ch.path);
            continue;
          }

          if (this2.selected_only) {
            var bad = !(e.flag & SplineFlags.SELECT);
            bad = bad || (e.flag & SplineFlags.HIDE);
            bad = bad || !(actlayer.id in e.layers);

            if (bad)
              continue;
          }

          yield ch;
        }
      }
    })();
  }

  //bind feeds vd
  _on_sel_1(veid) {
    //console.log(vd);
    var v = this.ctx.frameset.pathspline.eidmap[veid];
    if (v === undefined) {
      var id = veid | KeyTypes.PATHSPLINE;

      if (id in this.old_keyboxes) {
        var key2 = this.old_keyboxes[id];

        this.dirty_rects.push([
          [key2.pos[0], key2.pos[1]],
          [Math.abs(key2.size[0]), key2.size[1]]
        ]);

        this.do_recalc();
      }

      return;
    }

    this.redraw_key(this.get_vertkey(veid));
    //this.on_vert_select(v, state);
  }

  _on_sel_2(nothing, id) {
    var key = this.ctx.frameset.lib_anim_idmap[id];
    id |= KeyTypes.DATAPATH;

    if (key != undefined) {
      this.redraw_key(this.get_datakey(id));
    } else {
      if (id in this.old_keyboxes) {
        var key2 = this.old_keyboxes[id];

        this.dirty_rects.push([
          [key2.pos[0], key2.pos[1]],
          [Math.abs(key2.size[0]), key2.size[1]]
        ]);

        this.do_recalc();
      }
    }
  }

  //id_with_type is keybox id, client id OR'd with appropriate KeyTypes bitmask
  get_key(id_with_type) {
    var id = id_with_type;

    if (id & KeyTypes.PATHSPLINE) {
      return this.get_vertkey(id & KeyTypes.CLEARMASK);
    } else {
      return this.get_datakey(id & KeyTypes.CLEARMASK);
    }
  }

  //get datapath keyframes
  get_keypaths(start_y) {
    let this2 = this;
    return (function* () {
      if (this2.ctx == undefined) return;

      var y = start_y;
      var cwid = this2.CWID, chgt = this2.CHGT;

      var spline = this2.ctx.frameset.spline;
      var actlayer = spline.layerset.active;

      for (var ch of this2.get_datapaths()) {
        for (var i = 0; i < ch.keys.length; i++) {
          var ret = this2._get_key_ret_cache.next();

          ret[0] = ch.keys[i];
          ret[1] = ch;
          ret[2] = this2.get_datakey(ch.keys[i].id);

          var id = ret[2].id;

          //make sure dag node callback exists
          if (!(id in this2.nodemap)) {
            var on_sel = this2._on_sel_2.bind(this2);
            this2.nodes.push(on_sel);

            window.the_global_dag.link(
              ret[0],
              ["depend", "id"],

              on_sel,
              ["depend", "id"]
            );

            this2.nodemap[id] = on_sel;
          }

          yield ret;
        }

        y += chgt;
      }
    })();
  }

  get_keyboth() {
    let this2 = this;

    return (function*() {
      for (var ret of this2.get_keyverts()) {
        yield ret;
      }

      for (var ret of this2.get_keypaths()) {
        yield ret;
      }
    })();
  }

  get_keyverts() {
    var this2 = this;

    return (function*() {
      var channels = this2.get_vdatas();
      var y = 2, chgt = this2.CHGT;

      for (var vd of channels) {
        for (var v of vd.verts) {
          //let's not use individual vertex nodes in the event graph after all
          /*
          if (!(v.eid in this2.vmap)) {
            var on_sel = this2._on_sel_1.bind(this2, vd);
            this2.nodes.push(on_sel);

            window.the_global_dag.link(
              v,
              ["depend", "eid"],

              on_sel,
              ["depend", "eid"]
            );

            this2.vmap[v.eid] = on_sel;
          }
          //*/
          this2.vdmap[v.eid] = vd.eid;

          //if (!(v.eid in this2.heightmap))
          //  this2.heightmap[v.eid] = y+this2.pan[1];

          //get_key might change y
          var keybox = this2.get_vertkey(v.eid);

          this2.heightmap[v.eid] = keybox.pos[1];

          var ret = this2._get_key_ret_cache.next();
          ret[0] = v;
          ret[1] = vd;
          ret[2] = keybox;
          yield ret;
        }

        y += chgt;
      }
    })();
  }

  clear_selection() {
    for (var v of this.ctx.pathspline.verts) {
      v.flag &= ~SplineFlags.UI_SELECT;
    }
  }

  getLocalMouse(x, y) {
    let ret = projrets.next();

    let dpi = UIBase.getDPI();

    //x -= this.pan[0]/dpi;
    //y -= this.pan[1]/dpi;

    let canvas = this.get_bg_canvas();
    let rect = canvas.getClientRects()[0];

    if (rect === undefined) {
      console.warn("error in getLocalMouse");
      ret[0] = (x - this.pos[0])*dpi;
      ret[1] = (y - this.pos[1])*dpi;
      return ret;
    }

    //console.log(x, rect.left);

    ret[0] = (x - rect.left) * dpi;
    ret[1] = (y - rect.top) * dpi;
    ret[2] = 0.0;

    return ret;
  }

  findnearest(mpos, limit=48) {
    mpos = this.getLocalMouse(mpos[0], mpos[1]);

    var y = 0; //this.getBarHeight()+2;
    var subverts = [];
    var subpathkeys = [];
    var rettype = 0;

    var chgt = this.CHGT;

    var mindis = 1e18, ret = undefined;
    var co = new Vector2();

    var retv = undefined;
    var retvd = undefined;
    var rety = 0, retx=0;
    var rethigh = undefined;

    for (var kret of this.get_keyboth()) {
      var v = kret[0], vd = kret[1], keybox = kret[2];

      if (keybox.type == KeyTypes.PATHSPLINE) {
        if (keybox.id == this.highlight) {
          rethigh = {v : v, vd : vd, y : keybox.pos[1], type : keybox.type};
        }
      } else {
        var k = kret[0], ch = kret[1];

        if (keybox.id == this.highlight) {
          rethigh = {key : k, ch : ch, y : keybox.pos[1], type : keybox.type};
        }
      }

      co.load(keybox.size).mulScalar(0.5).add(keybox.pos);
      var dis = co.vectorDistance(mpos);

      if (dis < limit && dis < mindis) {
        mindis = dis;

        retv = v;
        retvd = vd;

        rety = keybox.pos[1];
        retx = keybox.pos[0];
        rettype = keybox.type;
      }
    }

    if (retv != undefined) {
      for (var kret of this.get_keyverts()) {
        var v = kret[0], vd = kret[1], keybox = kret[2];

        if (keybox.pos[0] == retx && keybox.pos[1] == rety) {
          subverts.push(kret[0]);
        }
      }

      for (var kret of this.get_keypaths()) {
        var v = kret[0], vd = kret[1], keybox = kret[2];

        if (keybox.pos[0] == retx && keybox.pos[1] == rety) {
          subpathkeys.push(kret[0]);
        }
      }
    }

    if (rethigh !== undefined) {
      if (rethigh.type == KeyTypes.PATHSPLINE)
        rethigh = this.get_vertkey(rethigh.v.eid);
      else
        rethigh = this.get_datakey(rethigh.key);
    }

    if (retv == undefined) return undefined;

    return {
      v      : retv,
      vd     : retvd,
      keybox : rettype == KeyTypes.PATHSPLINE ? this.get_vertkey(retv.eid) :
        this.get_datakey(retv),
      highlight_keybox : rethigh,
      subverts : subverts,
      subpathkeys : subpathkeys
    };
  }


  isEventUI(event) {
    return this.ctx.screen.pickElement(event.x, event.y) !== this
  }

  on_mousedown(event) {
    if (this.isEventUI(event)) return;

    console.log("dopesheet mousedown!");

    if (event.button == 0) {
      var nearest = this.findnearest([event.x, event.y]);

      if (nearest != undefined) {
        var ids = [];
        var sels = [];

        sels.push(nearest.keybox.id);
        var has_sel = get_select(this.ctx, nearest.keybox.id);

        for (var kret of this.get_keyboth()) {
          var keybox = kret[2];

          ids.push(keybox.id);

          if (keybox.id != nearest.keybox.id &&
            keybox.pos[0] == nearest.keybox.pos[0] && keybox.pos[1] == nearest.keybox.pos[1])
          {
            sels.push(keybox.id);
          }
        }

        var tool = new SelectOp();

        tool.inputs.phantom_ids.setValue(ids);
        tool.inputs.select_ids.setValue(sels);
        tool.inputs.unique.setValue(!event.shiftKey);
        tool.inputs.state.setValue(event.shiftKey ? !has_sel : true);

        g_app_state.toolstack.execTool(this.ctx, tool);
      } else {
        var ids = [];

        for (var kret of this.get_keyboth()) {
          var keybox = kret[2];
          ids.push(keybox.id);
        }

        var tool = new SelectOp();

        tool.inputs.phantom_ids.setValue(ids);
        tool.inputs.select_ids.setValue([]);
        tool.inputs.unique.setValue(true);
        tool.inputs.state.setValue(true);

        g_app_state.toolstack.execTool(this.ctx, tool);

        //change time
        var time = Math.floor(this.unscaletime((event.x - this.pan[0] - this.time_zero_x)));
        //console.log("chanve time!", time);


        this.ctx.scene.change_time(this.ctx, time);
        window.redraw_viewport();
      }

      this.start_mpos[0] = event.x;
      this.start_mpos[1] = event.y;

      this.mdown = true;
    } else if (event.button == 2) {
      console.log(event.x, event.y);
      var tool = new PanOp([event.x, event.y, 0], this);
      g_app_state.toolstack.execTool(this.ctx, tool);
    }
  }

  on_mousemove(event) {
    if (this.isEventUI(event)) return;

    if (this.mdown) {
      var dx = event.x - this.start_mpos[0];
      var dy = event.y - this.start_mpos[1];

      if (dx*dx + dy*dy > 1.5) {
        var op = new ShiftTimeOp3();
        var ids = [];

        for (var kret of this.get_keyboth()) {
          var keybox = kret[2];

          if (!keybox.select) continue;
          ids.push(keybox.id);
        }

        op.inputs.phantom_ids.setValue(ids);
        if (ids.length > 0) { //move verts
          this.mdown = false;

          g_app_state.toolstack.execTool(this.ctx, op);
        } else { //change time
          var time = Math.floor(this.unscaletime((event.x - this.pan[0] - this.time_zero_x)));
          //console.log("chanve time!", time);

          this.ctx.scene.change_time(this.ctx, time);
          window.redraw_viewport();
        }
      }

      return;
    }

    //console.log("dopesheet mousemove", this.getLocalMouse(event.x, event.y));
    var key = this.findnearest([event.x, event.y]);

    //console.log("nearest: ", key, event.x, event.y);

    if (key != undefined && key.keybox.id != this.highlight) {
      if (key.highlight_keybox != undefined) {
        //undraw old key
        this.redraw_key(key.highlight_keybox);
      }

      this.highlight = key.keybox.id;
      key = key.keybox;

      this.redraw_key(key);
    } else if (key == undefined) {
      if (this.highlight != undefined && (this.highlight & KeyTypes.PATHSPLINE)) {
        var v = this.ctx.frameset.pathspline.eidmap[(this.highlight & ~KeyTypes.PATHSPLINE)];

        //fyi, v.dag_update will redraw old key
        if (v != undefined) {
          v.dag_update("depend");
        }
      } else if (this.highlight != undefined) {
        if (this.highlight in this.old_keyboxes) {
          this.redraw_key(this.old_keyboxes[this.highlight]);
        }
      }

      this.highlight = undefined;
    }
  }

  on_mouseup(event) {
    //console.log("mouseup!");
    this.mdown = false;
  }

  set pinned(state) {
    if (state) {
      this.pinned_ids = this.get_all_ids();
    } else {
      this.pinned_ids = undefined;
    }

    this.rebuild();
  }

  get pinned() {
    return this.pinned_ids != undefined;
  }

  is_visible(key) {
    return true;

    var x = key.pos[0];// - this.pan[0];
    var y = key.pos[1];// - this.pan[1];

    if (x+key.size[0] < 0 || x > this.size[0]) {
      return false;
    }
    if (y+key.size[1] < 0 || y > this.size[1]) {
      return false;
    }

    return true;
  }

  redraw_key(key) {
    if (!this.is_visible(key))
      return;

    var hash = ""+Math.floor(key.pos[0])+","+Math.floor(key.pos[1]);
    if (hash in this._recalc_cache) return;

    this._recalc_cache[hash] = true;

    this.dirty_rects.push([
      [key.pos[0], key.pos[1]],
      [Math.abs(key.size[0]), key.size[1]]
    ]);

    if (key.id in this.old_keyboxes) {
      var key2 = this.old_keyboxes[key.id];

      this.dirty_rects.push([
        [key2.pos[0], key2.pos[1]],
        [Math.abs(key2.size[0]), key2.size[1]]
      ]);
    }

    this.rebuild_intern(RecalcFlags.REDRAW_KEYS);
  }

  drawGrid() {
    let canvas = this.getCanvas("grid", -1, false);
    let g = canvas.g

    var fsize = this.scaletime(1.0);

    var cellx = this.scaletime(1.0);
    var celly = this.CHGT;

    var totx = Math.floor(canvas.width/cellx+0.5);
    var toty = Math.floor(canvas.height/celly+0.5);

    var sign = this.pan[0] < 0.0 ? -1.0 : 1.0;

    var offx = this.time_zero_x + (Math.abs(this.pan[0]) % cellx)*sign;
    var offy = Math.abs(this.pan[1]) % celly;

    var clr = [0.2, 0.9, 0.4, 1.0];
    var v1 = [0, 0], v2 = [0, 0];

    var alpha = [1, 0.25, 0.25, 0.5, 0.25, 0.25, 0.25, 0.25];
    var grey = [0.2, 0.2, 0.2, 1.0];

    var clrs = [clr, grey, grey, grey, grey, grey, grey, grey]

    var off2 = sign*(Math.abs(this.pan[0]) % (cellx*clrs.length));
    var off3 = Math.abs(this.pan[0]) % (cellx*8);

    var si =  Math.abs(Math.floor(off2/cellx)); // Math.floor(Math.abs(this.pan[0])/cellx);

    g.clearRect(0, 0, canvas.width, canvas.height);
    g.lineWidth = 1;

    for (var i=0; i<totx; i++, si++) {
      v1[0] = v2[0] = offx + i*cellx;
      v1[1] = 0, v2[1] = canvas.height;

      let frame = Math.floor(this.pan[0] / cellx) + i;

      var clr = clrs[si % clrs.length];
      if (clr == undefined) clr = clrs[0];

      clr[3] = alpha[si % alpha.length];
      g.beginPath();
      g.strokeStyle = color2css(clr);

      g.moveTo(v1[0], v1[1]);
      g.lineTo(v2[0], v2[1]);
      g.stroke();

      //this.line(v1, v2, clr, clr);
      let dpi = UIBase.getDPI();

      g.font = _getFont_new(this, 14*dpi);

      g.fillStyle = "black"; //this.getDefault("DefaultTextColor");

      g.fillText(""+frame, v1[0], v1[1]+15);

      //  text(Array<float> pos1, String text, Array<float> color, float fontsize,
      //       float scale, float rot, Array<float> scissor_pos, Array<float> scissor_size)
    }

    /*
    if (this.ctx === undefined || this.ctx.scene === undefined) {
      console.log("dopesheet ERROR");
      return;
    }//*/

    let frame = this.ctx.scene.time;
    let x = offx + frame*cellx;

    if (x >= 0 && x < this.canvas.width) {
      g.strokeStyle = "orange";
      g.lineWidth = 2;

      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, canvas.height);
      g.stroke();
    }
  }

  getCanvas() {
    let ret = super.getCanvas(...arguments);

    ret.visibleToPick = false;
    ret.style["pointer-events"] = "none";

    return ret;
  }

  get_bg_canvas() {
    return this.getCanvas("bg", 0, false);
  }

  simple_box(p, size, clr) {
    let canvas = this.fgcanvas; //this.get_bg_canvas();
    let g = canvas.g;

    g.lineWidth = 1;

    if (clr !== undefined) {
      g.fillStyle = color2css(clr);
    } else {
      g.fillStyle = "orange";
    }

    g.strokeStyle = g.fillStyle;

    g.beginPath();

    /*
    g.moveTo(p[0], p[1]);
    g.lineTo(p[0], p[1]+size[1]);
    g.lineTo(p[0]+size[0], p[1]+size[1]);
    g.lineTo(p[0]+size[0], p[1]);
    g.closePath();
    //*/

    let dpi = UIBase.getDPI();

    g.rect(p[0], p[1], size[0], size[1]);
    //g.rect(p[0]*dpi, p[1]*dpi, size[0]*dpi, size[1]*dpi);

    g.fill();
    g.lineWidth = 1;
    g.stroke();
  }

  line(v1, v2, c1, c2) {
    let canvas = this.get_bg_canvas();
    let g = canvas.g;

    g.beginPath();
    g.moveTo(v1[0], v1[1]);
    g.lineTo(v1[0], v1[1]);

    g.lineWidth = 1;
    g.strokeStyle = color2CSS(c1);
    g.stroke();
  }

  time_overlay(canvas) {
    var v1 = new Vector2();
    var timeline_y = 0, y = timeline_y;

    var fsize = this.scaletime(1.0);
    var tclr = [1, 1, 1, 1.0];

    var clr = [0.2, 0.2, 0.2, 0.7];
    this.simple_box([0, 0-1], [this.size[0], 0], clr);

    var time_x = this.time_zero_x+this.scaletime(this.ctx.scene.time)+this.pan[0];

    var curclr = [0.2, 0.4, 1.0, 1.0];
    canvas.line([time_x, 0], [time_x, this.size[1]], curclr, curclr);
    canvas.line([time_x+1, 0], [time_x+1, this.size[1]], curclr, curclr);

    var timecellx = fsize*8;
    var offx2 = this.time_zero_x + (this.pan[0]) % timecellx;
    var totx2 = Math.floor(this.size[0]/timecellx+0.5);

    for (var i=0; i<totx2; i++) {
      v1[0] = offx2 + i*timecellx;

      var frame = (offx2 + i*timecellx - this.pan[0])/fsize;

      v1[1] = timeline_y + 5;
      canvas.text(v1, ""+Math.floor(frame), tclr);
    }
  }

  rebuild() {
    this.doOnce(this.rebuild_intern);
  }

  calc_dirty() {
    return [
      0, 0, this.size[0], this.size[1]
    ]
  }

  rebuild_intern(do_full_rebuild=0) {
    console.warn("Dopesheet rebuild!!");

    if (do_full_rebuild) {
      this.rebuild_vdmap();
    }

    var channels = this.channels;

    let barheight = this.getBarHeight();

    var keys = [];
    var totpath = 0;
    var visit = {};

    for (var kret of this.get_keyboth()) {
      var v = kret[0], vd = kret[1], keybox = kret[2];

      var id = keybox.type == KeyTypes.PATHSPLINE ? kret[1].eid : kret[1].path;

      if (!(id in visit)) { // !(vd.eid in visit)) {
        totpath++;
        visit[id] = 1;
      }

      keys.push(list(kret));
    }

    this.totchannel = totpath;

    this.update_collapsed_cache();
    var collapsed = this._tree_collapsed_map();
    let channel_regen = false;

    channel_regen = do_full_rebuild & RecalcFlags.CHANNELS;
    channel_regen = channel_regen || totpath !== this.channels.totpath;

    if (channel_regen) {
      console.log("rebuilding channel tree", totpath, this.channels.totpath);

      this.channels.reset();

      for (var i = 0; i < keys.length; i++) {
        var key = keys[i], v = key[0], vd = key[1], keybox = key[2];

        if (keybox.path == undefined) {
          throw new Error("EEK!");
          continue;
        }

        if (!this.channels.has_path(keybox.path)) {
          this.channels.add_path(keybox.path);
        }
      }
      ;

      //this.channels.rebuild();
      this.channels.load_collapsed(collapsed);
      this.channels.update();

      //console.log("    after reset", keys.length, this.channels.totpath);

      this.update_collapsed_cache();

      this.channels.load_collapsed(collapsed);
      this.channels.update();
    }

    /*
    for (var k in this.collapsed_cache) {
      if (k in this.channels.pathmap) {
        this.channels.pathmap[k].set_collapsed(true);
      }
    }*/

    //this.dirty_rects.push([[this.abspos[0], this.abspos[1]], [this.size[0], this.size[1]]]);

    //this.simple_box([0, 0], [this.size[0], this.size[1]], [1, 1, 1, 1]);
    //give channel boxes time to layout
    if (channel_regen) {
      this.setCSS();

      this.doOnce(() => {
        this.rebuild_intern_2();
      }, 330);
    } else {
      this.rebuild_intern_2();
    }
  }

  rebuild_intern_2() {
    var channels = this.channels;
    let barheight = this.getBarHeight();

    var rect = this.calc_dirty();
    //console.log("pre", rect[0], rect[1])

    var chgt = this.CHGT;

    var y = 0;
    this.heightmap = {};

    var cwid = this.CWID;

    var this2 = this;

    //console.log("post", rect[0], rect[1]);

    var margin = 2;

    var pos = [0, 0]
    var size = [0, 0];

    var highlight_color = [1, 1.0, 0.5, 1.0];
    var highlight_sel_color = [1, 1.0, 0.8, 1.0];

    var selected_color = [1, 0.8, 0.0, 1.0];
    var active_color = [1, 0.5, 0.25, 1.0];
    var borderclr = [0.3, 0.3, 0.3, 1.0];
    var unselclr = [0.3, 0.3, 0.3, 1.0];

    let dpi = UIBase.getDPI();

    //for (var i=0; i<keys.length; i++) {
    for (var kret of this.get_keyboth()) {
      var v = kret[0], vd = kret[1], keybox = kret[2];
      //var key = keys[i], v = key[0], vd = key[1], keybox = key[2];

      //update old keybox position
      if (keybox.id in this.old_keyboxes) {
        this.old_keyboxes[keybox.id].load(keybox);
      }

      this.heightmap[keybox.id] = keybox.pos[1];
      this.channels.add_path(keybox.path);

      //pos[0] = keybox.pos[0];// + this.abspos[0];
      //pos[1] = keybox.pos[1];// + this.abspos[1];
      pos[0] = keybox.pos[0] + margin;
      pos[1] = keybox.pos[1] + margin;

      //if (!aabb_isect_2d(pos, keybox.size, rect[0], rect[1])) {
      //continue;
      //}

      var margin = 2;
      size[0] = keybox.size[0] - margin*2;
      size[1] = keybox.size[1] - margin*2;

      var clr = undefined;

      var id = keybox.id;

      if (id == this.highlight && keybox.select)
        clr = highlight_sel_color;
      else if (id == this.highlight)
        clr = highlight_color;
      else if (id == this.active)
        clr = active_color;
      else if (keybox.select)
        clr = selected_color;
      else
        clr = unselclr;

      //console.log("drawing key", pos, size, clr);

      this.simple_box(pos, size, clr);
      //this.simple_box(pos, size, borderclr, undefined, true);
    }

    //this.time_overlay(canvas);
    //super.build_draw(canvas);
    this._recalc_cache = {};
    this.setCSS();
  }

  redraw_eid(eid) {
    var v = this.ctx.frameset.pathspline.eidmap[eid];
    var vd = this.vdmap[v.eid];
    var y = this.heightmap[v.eid];

    if (vd == undefined) return;

    var box = this.get_vertkey(v.eid);
    this.redraw_key(box);
  }

  build_bottombar(the_row) {
    //XXX implement me
    var ctx = new Context();

    this.ctx = ctx;

    the_row.packflag |= PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT;
    the_row.default_packflag = PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
    the_row.draw_background = true;
    the_row.rcorner = 100.0
    the_row.pos = [0, 2]
    the_row.size = [this.size[0], this.getBarHeight()];

    var col = the_row.col();

    col.add(gen_editor_switcher(this.ctx, this));

    col.prop("dopesheet.selected_only");
    col.prop("dopesheet.pinned");
  }

  dag_unlink_all() {
    for (var node of this.nodes) {
      node.dag_unlink();
    }

    this.nodes = [];
  }

  _ondestroy() {
    super._ondestroy();
    this.on_area_inactive();
  }

  on_area_active() {
    super.on_area_active();
    this._queueDagLink = true;
    console.log("dopesheet active!");
  }

  on_area_inactive() {
    this.first_draw = true;

    console.log("dopesheet inactive!");
    this.dag_unlink_all();

    this.vdmap = {};
    this.vmap = {};
    this.old_keyboxes = {};
    this._recalc_cache = {};

    for (var i=0; i<this.phantom_cache.length; i++) {
      var ph = this.phantom_cache.next();

      ph.ds = undefined;
      //prevent evil hanging references
      ph.v = ph.vd = undefined;
    }
  }

  get_everts() {
    var verts = [];

    for (var kret of this.get_keyverts()) {
      var v = kret[0], vd = kret[1], keybox = kret[2];

      if (!(v.flag & SplineFlags.UI_SELECT))
        continue;

      verts.push(v.eid);
    }

    return verts;
  }

  get_all_ids() {
    var ids = [];
    for (var kret of this.get_keyboth()) {
      ids.push(kret[2].id);
    }

    return ids;
  }

  get_all_everts() {
    var verts = [];

    for (var kret of this.get_keyverts()) {
      var v = kret[0], vd = kret[1], keybox = kret[2];

      verts.push(v.eid);
    }

    return verts;
  }

  define_keymap() {
    var k = this.keymap;

    var this2 = this;

    k.add(new HotKey("X", [], "Delete Keyframe"), new FuncKeyHandler(function(ctx) {
      var tool = new DeleteKeyOp();
      tool.inputs.phantom_ids.setValue(this2.get_all_ids());

      g_app_state.toolstack.execTool(this.ctx, tool);
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

    k.add(new HotKey("Left", ["CTRL"], "Select To Left"), new FuncKeyHandler(function(ctx) {
      var tool = new SelectKeysToSide();

      tool.inputs.side.setValue(false);
      tool.inputs.phantom_ids.setValue(this2.get_all_ids());
      g_app_state.toolstack.execTool(this.ctx, tool);
    }));

    k.add(new HotKey("Right", ["CTRL"], "Select To Right"), new FuncKeyHandler(function(ctx) {
      var tool = new SelectKeysToSide();

      tool.inputs.side.setValue(true);
      tool.inputs.phantom_ids.setValue(this2.get_all_ids());
      g_app_state.toolstack.execTool(this.ctx, tool);
    }));

    k.add(new HotKey("G", [], "Translate"), new FuncKeyHandler(function(ctx) {
      console.log("translate")

      var op = new ShiftTimeOp3();
      var ids = [];

      for (var kret of this2.get_keyboth()) {
        var keybox = kret[2];

        if (!keybox.select) continue;
        ids.push(keybox.id);
      }

      op.inputs.phantom_ids.setValue(ids);
      g_app_state.toolstack.execTool(this.ctx, op);
    }));

    k.add(new HotKey("A", [], "Toggle Select"), new FuncKeyHandler(function(ctx) {
      var tool = new ToggleSelectOp();
      var verts = [];

      tool.inputs.phantom_ids.setValue(this2.get_all_ids());

      g_app_state.toolstack.execTool(this.ctx, tool);
    }));

    k.add(new HotKey("K", [], "Column Select"), new FuncKeyHandler(function(ctx) {
      var tool = new ColumnSelect();

      var ids = [];
      for (var kret of this2.get_keyboth()) {
        var keybox = kret[2];

        ids.push(keybox.id);
      }

      tool.inputs.state.setValue(true);
      tool.inputs.phantom_ids.setValue(ids);

      g_app_state.toolstack.execTool(this.ctx, tool);
    }));

    k.add(new HotKey("K", ["SHIFT"], "Column Select"), new FuncKeyHandler(function(ctx) {
      var tool = new ColumnSelect();

      var ids = [];
      for (var kret of this2.get_keyboth()) {
        var keybox = kret[2];

        ids.push(keybox.id);
      }

      tool.inputs.state.setValue(false);
      tool.inputs.phantom_ids.setValue(ids);

      g_app_state.toolstack.execTool(this.ctx, tool);
    }));

    k.add(new HotKey("Z", ["CTRL", "SHIFT"], "Redo"), new FuncKeyHandler(function(ctx) {
      console.log("Redo")
      ctx.toolstack.redo();
    }));
    k.add(new HotKey("Y", ["CTRL"], "Redo"), new FuncKeyHandler(function(ctx) {
      console.log("Redo")
      ctx.toolstack.redo();
    }));
    k.add(new HotKey("Z", ["CTRL"], "Undo"), new FuncKeyHandler(function(ctx) {
      console.log("Undo");
      ctx.toolstack.undo();
    }));
  }

  data_link(block : DataBlock, getblock : Function, getblock_us : Function) {

  }

  on_fileload(ctx) {
    console.log("relinking dopesheet editor in event dag after file-based undo");
    this._queueDagLink = true;
    this.recalc();
  }

  loadSTRUCT(reader) {
    reader(this);
    super.loadSTRUCT(reader);

    if ('collapsed_map' in this) {
      var cache = this.collapsed_cache;

      this.collapsed_cache = {};
      for (var path of this.collapsed_map) {
        this.collapsed_cache[path] = true;
      }

      //delete this.collapsed_map;
    }

    if (this.pinned_ids != undefined && this.pinned_ids.length == 0) {
      delete this.pinned_ids;
    }

    return this;
  }

  static define() { return {
    tagname : "dopesheet-editor-x",
    areaname : "dopesheet_editor",
    uiname : "Animation Keys",
    icon : Icons.DOPESHEET_EDITOR,
    style : "dopesheet"
  }}

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
}

DopeSheetEditor.STRUCT = STRUCT.inherit(DopeSheetEditor, Editor) + `
    pan             : vec2 | obj.pan;
    zoom            : float;
    timescale       : float;
    collapsed_map   : array(string) | obj._tree_collapsed_map();
    selected_only   : int;
    pinned_ids      : array(int) | obj.pinned_ids != undefined ? obj.pinned_ids : [];
}
`;

Editor.register(DopeSheetEditor);

//DopeSheetEditor.uiname = "Dopesheet";
DopeSheetEditor.debug_only = false;
