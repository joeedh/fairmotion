"use strict";

import {aabb_isect_2d} from 'mathlib';
import {gen_editor_switcher} from 'UIWidgets_special';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, KeyHandler, 
        charmap, TouchEventManager, EventHandler} from 'events';

import {STRUCT} from 'struct';
import {phantom, KeyTypes, FilterModes,
        get_select, get_time, set_select, set_time
       } from 'dopesheet_phantom';
  
import {PackFlags, UIElement, UIFlags, CanvasFlags} from 'UIElement';
import {UIFrame} from 'UIFrame';
import {
  UIButtonAbstract, UIButton, UIButtonIcon,
  UIMenuButton, UICheckBox, UINumBox, UILabel,
  UIMenuLabel, ScrollButton, UIVScroll, UIIconCheck
} from 'UIWidgets';

import {RowFrame, ColumnFrame, UIPackFrame} from 'UIPack';
import {UITextBox} from 'UITextBox';
import {ToolOp, UndoFlags, ToolFlags} from 'toolops_api';
import {UITabBar} from 'UITabPanel';

import {UICollapseIcon} from 'UIWidgets_special';

import {ToolOp} from 'toolops_api';
import {RowFrame} from 'UIPack';
import {UndoFlags} from 'toolops_api';

import {Spline, RestrictFlags} from 'spline';
import {CustomDataLayer, SplineTypes, SplineFlags, SplineSegment} from 'spline_types';
import {TimeDataLayer, get_vtime, set_vtime,
        AnimKey, AnimChannel, AnimKeyFlags, AnimInterpModes
       } from 'animdata';
       
import {SplineLayerFlags, SplineLayerSet} from 'spline_element_array';

import {SplineFlags} from 'spline_types';
import {AddLayerOp, ChangeLayerOp, ChangeElementLayerOp} from 'spline_layerops';
import {DissolveVertOp} from 'spline_editops';

import {ShiftTimeOp2, ShiftTimeOp3, SelectOp, DeleteKeyOp,
        ColumnSelect, SelectKeysToSide, ToggleSelectOp
       } from 'dopesheet_ops';

/******************* main area struct ********************************/
import {Area} from 'FrameManager';

var tree_packflag = PackFlags.INHERIT_WIDTH|PackFlags.ALIGN_LEFT
                   |PackFlags.ALIGN_TOP|PackFlags.NO_AUTO_SPACING
                   |PackFlags.IGNORE_LIMIT;
          
var CHGT = 25;
          
export class TreeItem extends RowFrame {
  constructor(ctx, name) {
    RowFrame.apply(this, arguments);
    
    this.path = name;
    
    this.packflag |= tree_packflag;
    this.default_packflag |= tree_packflag;
    
    this.namemap = {};
    this.collapsed = false;
    
    this.panel = this.col();
    var this2 = this;
    this.icon = new UICollapseIcon(undefined, undefined, function(icon) {
      this2.set_collapsed(icon.collapsed)
    });
    
    this.icon.small_icon = true;
    
    this.draw_background = true;
    this.panel.add(this.icon);
    this.panel.label(name);
    
    this.stored_children = undefined;
  }
  
  get_filedata() { 
    return {collapsed : this.collapsed};
  }
  
  load_filedata(data) {
    this.set_collapsed(data.collapsed);
  }
  
  get_min_size(UICanvas canvas, Boolean isvertical) {
    var h = CHGT;
    
    var max_width = Math.min(100, this.size[0]);
    var size = [0, 0];
    for (var c of this.children) {
      var s = c.get_min_size(canvas, isvertical);
      if (c === this.panel) {
        s[1] = h;
      }
      
      max_width = Math.max(max_width, s[0]);
      var sh = s[1];
      
      if (sh % h != 0) {
        sh += h - (sh % h);
      }
      
      size[1] += sh;
    }
    
    size[0] = max_width;
    return size;
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
  
  pack(canvas) {
    var h = CHGT;
    
    var p = this;
    while (p.parent != undefined && !(p instanceof DopeSheetEditor)) {
      p = p.parent;
    }
    
    var y = this.size[1];// + p.velpan.pna[1];
    var x = 0;
    var w = this.size[0];
    var side_margin = 5;
    
    for (var c of this.children) {
      var size = c.get_min_size(canvas);
      if (c === this.panel) {
        size[1] = h;
      }
      
      c.size[0] = w - side_margin; //size[0];
      c.size[1] = size[1];
      
      y -= Math.max(c.size[1], h);

      c.pos[0] = x+side_margin;
      c.pos[1] = y;
      //c.size[0] = w;
      
      if (c instanceof UIFrame) {
        c.pack(canvas);
      }
    }
  }
  
  set_collapsed(state) {
    //console.log("set collapsed", state);
    
    this.collapsed = state;
    
    if (this.icon.collapsed != state)
      this.icon.collapsed = state;
    
    if (state && this.stored_children == undefined) {
      this.stored_children = [];
      for (var c of this._children) {
        this.stored_children.push(c);
      }
      
      this._children = [this.panel];
      
      this.do_full_recalc();
    } else if (!state && this.stored_children != undefined) {
      console.log("restore children");
      this._children = this.stored_children;
      this.stored_children = undefined;
      
      this.do_full_recalc();
    }
  } 
}

export class TreePanel extends RowFrame {
  constructor(ctx) {
    RowFrame.apply(this, arguments);
    
    this.packflag |= tree_packflag;
    this.default_packflag |= tree_packflag;
    
    this.totpath = 0;
    
    this.draw_background = true;
    
    this.tree = new TreeItem(ctx, "root");
    this.pathmap = {root : this.tree};
    
    this.add(this.tree);
  }
  
  load_collapsed(paths) {
    var cset = {};
    
    for (var i=0; i<paths.length; i++) {
      cset[paths[i]] = true;
    }
    
    for (var k in cset) {
      if (!(k in this.pathmap)) continue;

      console.log("loading collapsed state for", k);
      this.pathmap[k].set_collapsed(cset[k]);
    }
    
    this.do_full_recalc();
  }
  
  get_collapsed_paths() {
    var ret = [];
    
    function recurse(c) {
      if (c.collapsed) {
        ret.push(c.build_path());
      }
      for (var c2 in c) {
        if (c2 instanceof TreeItem) {
          recurse(c2);
        }
      }
    }
    
    for (var c in this.children) {
      if (c instanceof TreeItem) {
        recurse(c);
      }
    }
    
    return ret;
  }
  
  reset() {
    this.children = [];
    
    this.tree = new TreeItem(this.ctx, "root");
    this.add(this.tree);

    this.pathmap = {root : this.tree};
    this.totpath = 0;
    
    this.do_full_recalc();
  }
  
  is_collapsed(path) {
    path = path.trim();
    
    if (!(path in this.pathmap)) return undefined;
    var p = this.pathmap[path];
    
    return p.collapsed;
  }
  
  get_y(path) {
    path = path.trim()
    
    if (path in this.pathmap) {
      var p = this.pathmap[path];
      var hidden = false;
      var last_hidden = p;
      
      while (p.parent != undefined && !(p instanceof TreePanel)) {
        if (p.collapsed) {
          hidden = true;
          last_hidden = p;
        }
        p = p.parent;
      }
      
      var p = last_hidden; //.collapsed ? last_hidden.parent : last_hidden; //this.pathmap[path];
      //while (p.parent != undefined && p.collapsed && !(p instanceof TreePanel)) {
      //    p = p.parent;
      //}
      
      return (p.abspos[1] - this.abspos[1]) + this.pos[1] - this.parent.velpan.pan[1];
    } else {
      //console.log("not in pathmap!", path);
      return undefined;
    }
  }
  
  add_path(path) {
    path = path.trim();
    
    var paths = path.split(".")
    var tree = this.tree;
    var lasttree = undefined;
    
    if (paths[0].trim() == "root")
      paths = paths.slice(1, paths.length);
    
    var path2 = "";
    for (var i=0; i<paths.length; i++) {
      var key = paths[i].trim();
      
      if (i == 0)
        path2 = key;
      else
        path2 += "." + key;
      
      if (!(key in tree.namemap)) {
        tree.namemap[key] = new TreeItem(this.ctx, key);
        tree.add(tree.namemap[key]);
        
        this.pathmap[path2] = tree.namemap[key];
      }
      
      lasttree = tree;
      tree = tree.namemap[key];
    }
    
    if (!(path in this.pathmap)) 
      this.totpath++;
    this.pathmap[path] = tree;
  }
  
  build_draw(canvas) {
    RowFrame.prototype.build_draw.apply(this, arguments);
  }
}

export class PanOp extends ToolOp {
  constructor(start_mpos, dopesheet) {
    ToolOp.call(this);
    
    this.ds = dopesheet;
    
    this.is_modal = true;
    this.undoflag |= UndoFlags.IGNORE_UNDO;
    this.start_pan = new Vector2(dopesheet.velpan.pan);
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
    
    //console.log("mousemove!");
    
    if (this.first) {
      this.first = false;
      this.start_mpos.load(mpos);
      
      return;
    }
    
    var ctx = this.modal_ctx;
    mpos.sub(this.start_mpos).sub(this.ds.abspos); //.mulScalar(1.0/ctx.view2d.zoom);
    
    this.ds.velpan.pan[0] = this.start_pan[0] + mpos[0];
    this.ds.velpan.pan[1] = this.start_pan[1] + mpos[1];
    
    //this.cameramat.load(this.start_cameramat).translate(mpos[0], mpos[1], 0.0);
    //ctx.view2d.set_cameramat(this.cameramat);
    
    this.ds.do_full_recalc();
    window.redraw_ui();
  }
  
  on_mouseup(event) {
    this.end_modal();
  }
}

export class DopeSheetEditor extends Area {
  constructor(pos, size) {
    Area.call(this, DopeSheetEditor.name, DopeSheetEditor.uiname, new Context(), pos, size);
    
    this.pinned_ids = undefined;
    this.nodes = [];
    this.nodemap = {};
    
    this._get_key_ret_cache = new cachering(function() {
      return [0, 0, 0];
    }, 2048);
    
    this.selected_only = true;
    this.time_zero_x = 4;
    
    this.velpan.can_coast = false;
    this.velpan.enabled = false;

    this.draw_background = false;
    
    this.first = true;
    this.groups = {}; // ?
    this._recalc_cache = {};
    
    this.vdmap = {};
    this.heightmap = {};
    this.rowmap = {};
    
    this.old_keyboxes = {}; //used to cache keybox rect to clear later, when key moves 
    this.collapsed_cache = {};
    
    this.nodemap = {};
    
    this.cameramat = new Matrix4();
    this.rendermat = new Matrix4();
    this.irendermat = new Matrix4();
    this.zoom = 1.0;
    this.timescale = 12.0;
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
    
    this.channels = new TreePanel();
    this.channels.size[0] = 180;
    this.channels.size[1] = 600;
    
    this.add(this.channels);
  }
  
  rebuild_vdmap() {
    var frameset = this.ctx.frameset;
    
    this.vdmap = {};
    
    for (var vd_eid in frameset.vertex_animdata) {
      for (var v in frameset.vertex_animdata[vd_eid].verts) {
        this.vdmap[v.eid] = vd_eid;
      }
    }
  }
  
  get_vdatas() {
    var ctx = this.ctx, frameset = ctx.frameset, spline=frameset.spline, pathspline=frameset.pathspline;
    var vset = new set();
    
    if (this.pinned_ids != undefined) {
      for (var id in this.pinned_ids) {
        if (!(id & KeyTypes.PATHSPLINE))
          continue;
          
        var id1=id;
        id = this.vdmap[id & KeyTypes.CLEARMASK];
        
        if (id == undefined) {
          if (this.ctx != undefined) {
            this.rebuild_vdmap();
            
            console.log("Warning, had to rebuild vdmap!", id1. id1 & KeyTypes.CLEARMASK, id1 & ~KeyTypes.CLEARMASK);
            id = this.vdmap[id & KeyTypes.CLEARMASK];
          } else {
            continue;
          }
        }
        
        var vd = frameset.get_vdata(id, false);
        
        if (vd != undefined)
          vset.add(vd);
      }
    } else if (this.selected_only) {
      for (var v of spline.verts.selected.editable) {
        var vd = frameset.get_vdata(v.eid, false);
        
        if (vd != undefined)
          vset.add(vd);
      }
    } else {
      for (var v in spline.verts) {
        var vd = frameset.get_vdata(v.eid, false);
        
        if (vd != undefined)
          vset.add(vd);
      }
    }
    
    return vset;
  }
  
  static default_new(ctx, scr, gl, pos, size) {
    var ret = new DopeSheetEditor(pos, size);
    
    ret.ctx = ctx;
    
    return ret;
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
    
    var pan = this.velpan.pan;

    ph.pos[0] = this.time_zero_x-2+this.scaletime(ph.time)+pan[0];
    ph.pos[1] = y+pan[1];
    
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
    
    if (y2 != undefined)
      y = y2;
    
    var pan = this.velpan.pan;

    ph.pos[0] = this.time_zero_x-2+this.scaletime(ph.time)+pan[0];
    ph.pos[1] = y+pan[1];
    
    ph.size[0] = cwid, ph.size[1] = chgt;
        
    if (this.old_keyboxes[ph.id] == undefined) {
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
  
  on_tick() {
    Area.prototype.on_tick.apply(this, arguments);
    //console.log("on_tick");
    //this.do_full_recalc();
    if (this.ctx == undefined)
      this.ctx = new Context();
      
    if (this.ctx != undefined) {
      var scene = this.ctx.scene;
      
      if (scene.time != this.last_time) {
        //console.log("detected frame update!");
        
        var time_x1 = this.time_zero_x + this.scaletime(this.last_time) + this.velpan.pan[0];
        var time_x = this.time_zero_x + this.scaletime(scene.time) + this.velpan.pan[0];
        
        if (time_x1 >= 0 && time_x1 <= this.size[0]) {
          this.dirty_rects.push([[this.abspos[0]+time_x1-8, this.abspos[1]], [16, this.size[1]]]);
          this.do_recalc();
        }
        
        if (time_x >= 0 && time_x <= this.size[0]) {
          this.dirty_rects.push([[this.abspos[0]+time_x-8, this.abspos[1]], [16, this.size[1]]]);
          this.do_recalc();
        }
        this.last_time = scene.time;
      }
    }
    
    var this2 = this;
    function on_sel() {
      console.log("------------------on sel!----------------");
      return this2.on_vert_select.apply(this2, arguments);
    }
    
    if (this.first) {
      if (this.ctx == undefined) {
        this.ctx = new Context();
      }
      
      var ctx = this.ctx;
      this.first = false;
      
      this.nodes.push(on_sel);
      
      //on_vert_select
      the_global_dag.link(ctx.frameset.spline.verts, ["on_select_add"], on_sel, ["eid"]);
      the_global_dag.link(ctx.frameset.spline.verts, ["on_select_sub"], on_sel, ["eid"]);
    }
  }
  
  on_vert_select() {
    this.do_full_recalc();
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
    this.update_collapsed_cache();
    
    var ret = [];
    for (var k in this.collapsed_cache) {
      ret.push(k);
    }
    
    return ret;
  }
  
  //returns list of animchannels
  get_datapaths() {
    if (this.ctx == undefined) return [];
    
    var frameset = this.ctx.frameset;
    var spline = frameset.spline;
    var actlayer = spline.layerset.active;
    
    if (this.pinned_ids != undefined) {
      var visit = {};
      for (var id in this.pinned_ids) {
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
      for (var i=0; i<frameset.lib_anim_channels.length; i++) {
        //search for eid entry
        var ch = frameset.lib_anim_channels[i];
        
        var eid = ch.path.match(/\[[0-9]+\]/);
        if (eid == null) {
          console.log("Not an eid path", ch.path, eid);
          continue;
        }
        
        eid = eid[eid.length-1];
        eid = parseInt(eid.slice(1, eid.length-1));
        
        var e = spline.eidmap[eid];
        if (e == undefined) {
          console.log("e was null, not an eid path?", eid, ch.path);
          continue;
        }
        
        if (this.selected_only) {
          var bad = !(e.flag & SplineFlags.SELECT);
          bad = bad || (e.flag & SplineFlags.HIDE);
          bad = bad || !(actlayer.id in e.layers);
          
          if (bad)
            continue;
        }
        
        yield ch;
      }
    }
  }
  
  //bind feeds vd
  _on_sel_1(vd, nothing, veid) {
      //console.log(vd);
      var v = this.ctx.frameset.pathspline.eidmap[veid];
      if (v == undefined) {;
        var id = veid | KeyTypes.PATHSPLINE;
        
        if (id in this.old_keyboxes) {
          var key2 = this.old_keyboxes[id];
          
          this.dirty_rects.push([
              [key2.pos[0]+this.abspos[0], key2.pos[1]+this.abspos[1]],
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
              [key2.pos[0]+this.abspos[0], key2.pos[1]+this.abspos[1]],
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
    if (this.ctx == undefined) return;
    
    var y = start_y;
    var cwid = this.CWID, chgt = this.CHGT;
    
    var spline = this.ctx.frameset.spline;
    var actlayer = spline.layerset.active;
    
    for (var ch of this.get_datapaths()) {
      for (var i=0; i<ch.keys.length; i++) {
        var ret = this._get_key_ret_cache.next();
        
        ret[0] = ch.keys[i];
        ret[1] = ch;
        ret[2] = this.get_datakey(ch.keys[i].id);
        
        var id = ret[2].id;
        
        //make sure dag node callback exists
        if (!(id in this.nodemap)) {
          var this2 = this;
          
          var on_sel = this._on_sel_2.bind(this);
          this.nodes.push(on_sel);
          
          window.the_global_dag.link(
            ret[0], 
            ["depend", "id"],
            
            on_sel,
            ["depend", "id"]
          );
          
          this.nodemap[id] = on_sel;
        }

        yield ret;
      }
      
      y += chgt;
    }
  }

  get_keyboth() {
    for (var ret of this.get_keyverts()) {
      yield ret;
    }
    
    for (var ret of this.get_keypaths()) {
      yield ret;
    }
  }
  
  get_keyverts() {
    var channels = this.get_vdatas();
    var y = Area.get_barhgt()+2, chgt = this.CHGT;
    
    for (var vd of channels) {
      for (var v of vd.verts) {
        if (!(v.eid in this.vmap)) {
          var this2 = this;
          
          var on_sel = this._on_sel_1.bind(this, vd);
          this.nodes.push(on_sel);
          
          window.the_global_dag.link(
            v, 
            ["depend", "eid"], 
            
            on_sel,
            ["depend", "eid"]
          );
          
          this.vmap[v.eid] = on_sel;
        }
        this.vdmap[v.eid] = vd.eid;
        
        //if (!(v.eid in this.heightmap))
        //  this.heightmap[v.eid] = y+this.velpan.pan[1];
        
        //get_key might change y
        var keybox = this.get_vertkey(v.eid);
        
        this.heightmap[v.eid] = keybox.pos[1];
        
        var ret = this._get_key_ret_cache.next();
        ret[0] = v;
        ret[1] = vd;
        ret[2] = keybox;
        yield ret;
      }
      
      y += chgt;
    }
  }
 
  clear_selection() {
    for (var v in this.ctx.pathspline.verts) {
      v.flag &= ~SplineFlags.UI_SELECT;
    }
  }
  
  findnearest(mpos, limit=18) {
    var y = Area.get_barhgt()+2;
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
    
    if (rethigh != undefined) {
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
  
  on_mousedown(event) {
    if (Area.prototype.on_mousedown.call(this, event))
      return;
    
    //console.log("mousedown!", event.button, this.highlight);
    
    if (event.button == 0) {
      var nearest = this.findnearest([event.x, event.y]);
      
      if (nearest != undefined) {
        //console.log("nearest type:", nearest.keybox.type);
      }
      
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
        
        tool.inputs.phantom_ids.set_data(ids);
        tool.inputs.select_ids.set_data(sels);
        tool.inputs.unique.set_data(!event.shiftKey);
        tool.inputs.state.set_data(event.shiftKey ? !has_sel : true);
        
        g_app_state.toolstack.exec_tool(tool);
      } else {
        var ids = [];
        
        for (var kret in this.get_keyboth()) {
          var keybox = kret[2];
          ids.push(keybox.id);
        }
        
        var tool = new SelectOp();
        
        tool.inputs.phantom_ids.set_data(ids);
        tool.inputs.select_ids.set_data([]);
        tool.inputs.unique.set_data(true);
        tool.inputs.state.set_data(true);
        
        g_app_state.toolstack.exec_tool(tool);
        
        //change time
        var time = Math.floor(this.unscaletime((event.x - this.velpan.pan[0] - this.time_zero_x)));
        //console.log("chanve time!", time);
        

        this.ctx.scene.change_time(this.ctx, time);
        window.redraw_viewport();
      }
     
      this.start_mpos[0] = event.x;
      this.start_mpos[1] = event.y;
      
      this.mdown = true;
    } else if (event.button == 2) {
      var tool = new PanOp([event.x, event.y, 0], this);
      g_app_state.toolstack.exec_tool(tool);
    }
  }
  
  on_mousemove(event) {
    if (Area.prototype.on_mousemove.call(this, event)) {
      return;
    }
    
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
        
        op.inputs.phantom_ids.set_data(ids);
        if (ids.length > 0) { //move verts
          this.mdown = false;
          
          g_app_state.toolstack.exec_tool(op);
        } else { //change time
          var time = Math.floor(this.unscaletime((event.x - this.velpan.pan[0] - this.time_zero_x)));
          //console.log("chanve time!", time);
          
          this.ctx.scene.change_time(this.ctx, time);
          window.redraw_viewport();
        }
      }
      
      return;
    }
    
    //console.log("dopesheet mousemove");
    var key = this.findnearest([event.x, event.y]);
    
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
    
    this.do_full_recalc();
  }
  
  get pinned() {
    return this.pinned_ids != undefined;
  }
  
  do_full_recalc() {
    Area.prototype.do_full_recalc.apply(this, arguments);
    //console.log("full recalc!");
  }
  
  is_visible(key) {
    return true;
    
    var x = key.pos[0];// - this.velpan.pan[0];
    var y = key.pos[1];// - this.velpan.pan[1];
    
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
        [key.pos[0]+this.abspos[0], key.pos[1]+this.abspos[1]],
        [Math.abs(key.size[0]), key.size[1]]
    ]);
    
    if (key.id in this.old_keyboxes) {
      var key2 = this.old_keyboxes[key.id];
      
      this.dirty_rects.push([
          [key2.pos[0]+this.abspos[0], key2.pos[1]+this.abspos[1]],
          [Math.abs(key2.size[0]), key2.size[1]]
      ]);
    }
    
    this.do_recalc();
  }
  
  draw_grid(canvas) {
    var fsize = this.scaletime(1.0);
    
    var cellx = this.scaletime(2.0);
    var celly = this.CHGT;
    
    var totx = Math.floor(this.size[0]/cellx+0.5);
    var toty = Math.floor(this.size[1]/celly+0.5);
    
    var sign = this.velpan.pan[0] < 0.0 ? -1.0 : 1.0;
    
    var offx = this.time_zero_x + (Math.abs(this.velpan.pan[0]) % cellx)*sign;
    var offy = Math.abs(this.velpan.pan[1]) % celly;
    
    var clr = [0.2, 0.9, 0.4, 1.0];
    var v1 = [0, 0], v2 = [0, 0];
    
    var alpha = [1, 0.25, 0.25, 0.5, 0.25, 0.25, 0.25, 0.25];
    var grey = [0.2, 0.2, 0.2, 1.0];
    
    var clrs = [clr, grey, grey, grey, grey, grey, grey, grey]
    
    var off2 = sign*(Math.abs(this.velpan.pan[0]) % (cellx*clrs.length));
    var off3 = Math.abs(this.velpan.pan[0]) % (cellx*8);
    
    var si =  Math.abs(Math.floor(off2/cellx)); // Math.floor(Math.abs(this.velpan.pan[0])/cellx);
      
    for (var i=0; i<totx; i++, si++) {
      v1[0] = v2[0] = offx + i*cellx;
      v1[1] = 0, v2[1] = this.size[1];
      
      var clr = clrs[si % clrs.length];
      if (clr == undefined) clr = clrs[0];
      
      clr[3] = alpha[si % alpha.length];
      canvas.line(v1, v2, clr, clr);
      
      //  text(Array<float> pos1, String text, Array<float> color, float fontsize, 
      //       float scale, float rot, Array<float> scissor_pos, Array<float> scissor_size)
    }
  }
  
  time_overlay(canvas) {
    var v1 = new Vector2();
    var timeline_y = Area.get_barhgt()+1, y = timeline_y;
    
    var fsize = this.scaletime(1.0);
    var tclr = [1, 1, 1, 1.0];
    
    var clr = [0.2, 0.2, 0.2, 0.7];
    canvas.simple_box([0, Area.get_barhgt()-1], [this.size[0], Area.get_barhgt()], clr);
    
    var time_x = this.time_zero_x+this.scaletime(this.ctx.scene.time)+this.velpan.pan[0];
    
    var curclr = [0.2, 0.4, 1.0, 1.0];
    canvas.line([time_x, 0], [time_x, this.size[1]], curclr, curclr);
    canvas.line([time_x+1, 0], [time_x+1, this.size[1]], curclr, curclr);
    
    var timecellx = fsize*8;
    var offx2 = this.time_zero_x + (this.velpan.pan[0]) % timecellx;
    var totx2 = Math.floor(this.size[0]/timecellx+0.5);
    
    for (var i=0; i<totx2; i++) {
      v1[0] = offx2 + i*timecellx;
      
      var frame = (offx2 + i*timecellx - this.velpan.pan[0])/fsize;
      
       v1[1] = timeline_y + 5;
       canvas.text(v1, ""+Math.floor(frame), tclr);
    }
  }
  
  build_draw(canvas) {
    var channels = this.channels;
    
    window.channels = this.channels;
    window.ds = this;
    
    var size = this.channels.get_min_size(canvas);
    this.channels.size[1] = size[1];
    this.channels.pos[1] = Area.get_barhgt()+2+this.velpan.pan[1] - size[1];
    
    this.size[0] = this.parent.size[0];
    this.size[1] = this.parent.size[1];
    
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
    
    if (totpath !== this.channels.totpath) {
      console.log("rebuilding channel tree", keys.length);
      var collapsed = this._tree_collapsed_map();
      
      this.channels.reset();
      
      for (var i=0; i<keys.length; i++) {
        var key = keys[i], v = key[0], vd = key[1], keybox = key[2];
        
        if (keybox.path == undefined) {
          throw new Error("EEK!");
          continue;
        }
          
        this.channels.add_path(keybox.path);
      };
      
      this.channels.load_collapsed(collapsed);
      this.channels.pack(this.get_canvas());
      
      //console.log("    after reset", keys.length, this.channels.totpath);
    }
    
    if (!this.first_draw)
      this.update_collapsed_cache();
    this.first_draw = false;
    
    for (var k in this.collapsed_cache) {
      if (k in this.channels.pathmap) {
        this.channels.pathmap[k].set_collapsed(true);
      }
    }
    
    //this.dirty_rects.push([[this.abspos[0], this.abspos[1]], [this.size[0], this.size[1]]]);
    
    canvas.simple_box([0, 0], [this.size[0], this.size[1]], [1, 1, 1, 1]);
    
    if (this.ctx == undefined)
      this.ctx = new Context();
    
    var rect = this.calc_dirty();
    //console.log("pre", rect[0], rect[1])
    
    this.draw_grid(canvas);
    
    var chgt = this.CHGT;
    var barheight = Area.get_barhgt();
    
    var y = barheight+2;
    this.heightmap = {};
    
    var cwid = this.CWID;
    
    var this2 = this;
    
    //console.log("post", rect[0], rect[1]);
    
    var pos = [0, 0]
    var size = [0, 0];
    
    var highlight_color = [1, 1.0, 0.5, 1.0];
    var highlight_sel_color = [1, 1.0, 0.8, 1.0];
    
    var selected_color = [1, 0.8, 0.0, 1.0];
    var active_color = [1, 0.5, 0.25, 1.0];
    var borderclr = [0.3, 0.3, 0.3, 1.0];
    
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
        
        pos[0] = keybox.pos[0] + this.abspos[0];
        pos[1] = keybox.pos[1] + this.abspos[1];
        
        if (!aabb_isect_2d(pos, keybox.size, rect[0], rect[1])) {
          continue;
        }
        
        var margin = 2;
        pos[0] = keybox.pos[0] + margin;
        pos[1] = keybox.pos[1] + margin;
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
        
        canvas.box2(pos, size, clr);
        canvas.box2(pos, size, borderclr, undefined, true);
    }
    
    this.time_overlay(canvas);
    
    Area.prototype.build_draw.apply(this, arguments);
    this._recalc_cache = {};
  }
  
  redraw_eid(eid) {
    var v = this.ctx.frameset.pathspline.eidmap[eid];
    var vd = this.vdmap[v.eid];
    var y = this.heightmap[v.eid];
    
    if (vd == undefined) return;
    
    var box = this.get_vertkey(v.eid);
    this.redraw_key(box);
  }
  
  build_bottombar() {
    var ctx = new Context();
    
    this.ctx = ctx;
    var the_row = new RowFrame(ctx);

    the_row.packflag |= PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT;
    the_row.default_packflag = PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
    the_row.draw_background = true;
    the_row.rcorner = 100.0
    the_row.pos = [0, 2]
    the_row.size = [this.size[0], Area.get_barhgt()];
    
    var col = the_row.col();

    col.add(gen_editor_switcher(this.ctx, this));
    
    col.prop("dopesheet.selected_only");
    col.prop("dopesheet.pinned");
    
    this.rows.push(the_row);
    this.add(the_row);
  }
  
  dag_unlink_all() {
    for (var node in this.nodes) {
      node.dag_unlink();
    }
    
    this.nodes = [];
  }
  
  on_area_inactive() {
    Area.prototype.on_area_inactive.call(this);
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
    
    for (var kret in this.get_keyverts()) {
      var v = kret[0], vd = kret[1], keybox = kret[2];
      
      if (!(v.flag & SplineFlags.UI_SELECT))
        continue;
      
      verts.push(v.eid);
    }
    
    return verts;
  }
  
  get_all_ids() {
    var ids = [];
    for (var kret in this.get_keyboth()) {
      ids.push(kret[2].id);
    }
    
    return ids;
  }
  
  get_all_everts() {
    var verts = [];
    
    for (var kret in this.get_keyverts()) {
      var v = kret[0], vd = kret[1], keybox = kret[2];
      
      verts.push(v.eid);
    }
    
    return verts;
  }
  
  define_keymap() {
    var k = this.keymap;
    
    var this2 = this;
    
    k.add(new KeyHandler("X", [], "Delete Keyframe"), new FuncKeyHandler(function(ctx) {
      var tool = new DeleteKeyOp();
      tool.inputs.phantom_ids.set_data(this2.get_all_ids());
      
      g_app_state.toolstack.exec_tool(tool);
    }));
    
    k.add(new KeyHandler("Up", [], "Frame Ahead 10"), new FuncKeyHandler(function(ctx) {
      ctx.scene.change_time(ctx, ctx.scene.time+10);
      window.force_viewport_redraw();
      window.redraw_viewport();
    }));
    
    k.add(new KeyHandler("Down", [], "Frame Back 10"), new FuncKeyHandler(function(ctx) {
      ctx.scene.change_time(ctx, ctx.scene.time-10);
      window.force_viewport_redraw();
      window.redraw_viewport();
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

    k.add(new KeyHandler("Left", ["CTRL"], "Select To Left"), new FuncKeyHandler(function(ctx) {
      var tool = new SelectKeysToSide();
      
      tool.inputs.side.set_data(false);
      tool.inputs.phantom_ids.set_data(this2.get_all_ids());
      g_app_state.toolstack.exec_tool(tool);
    }));
    
    k.add(new KeyHandler("Right", ["CTRL"], "Select To Right"), new FuncKeyHandler(function(ctx) {
      var tool = new SelectKeysToSide();
      
      tool.inputs.side.set_data(true);
      tool.inputs.phantom_ids.set_data(this2.get_all_ids());
      g_app_state.toolstack.exec_tool(tool);
    }));
    
    k.add(new KeyHandler("G", [], "Translate"), new FuncKeyHandler(function(ctx) {
      console.log("translate")
      
      var op = new ShiftTimeOp3();
      var ids = [];
      
      for (var kret in this2.get_keyboth()) {
        var keybox = kret[2];
        
        if (!keybox.select) continue;
        ids.push(keybox.id);
      }
      
      op.inputs.phantom_ids.set_data(ids);
      g_app_state.toolstack.exec_tool(op);
    }));
    
    k.add(new KeyHandler("A", [], "Toggle Select"), new FuncKeyHandler(function(ctx) {
      var tool = new ToggleSelectOp();
      var verts = [];
      
      tool.inputs.phantom_ids.set_data(this2.get_all_ids());
      
      g_app_state.toolstack.exec_tool(tool);
    }));
    
    k.add(new KeyHandler("K", [], "Column Select"), new FuncKeyHandler(function(ctx) {
      var tool = new ColumnSelect();
      
      var ids = [];
      for (var kret in this2.get_keyboth()) {
        var keybox = kret[2];
        
        ids.push(keybox.id);
      }
      
      tool.inputs.state.set_data(true);
      tool.inputs.phantom_ids.set_data(ids);
      
      g_app_state.toolstack.exec_tool(tool);
    }));

    k.add(new KeyHandler("K", ["SHIFT"], "Column Select"), new FuncKeyHandler(function(ctx) {
      var tool = new ColumnSelect();
      
      var ids = [];
      for (var kret in this2.get_keyboth()) {
        var keybox = kret[2];
        
        ids.push(keybox.id);
      }
      
      tool.inputs.state.set_data(false);
      tool.inputs.phantom_ids.set_data(ids);
      
      g_app_state.toolstack.exec_tool(tool);
    }));
    
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
  }
  
  data_link(DataBlock block, Function getblock, Function getblock_us) {
  }
  
  static fromSTRUCT(reader) {
    var ret = new DopeSheetEditor();
    
    reader(ret);
    
    if (ret.pan != undefined) {
      ret.velpan.pan[0] = ret.pan[0];
      ret.velpan.pan[1] = ret.pan[1];
      
      delete ret.pan;
    }
    
    if ('collapsed_map' in ret) {
      var cache = ret.collapsed_cache;
      
      ret.collapsed_cache = {};
      for (var path of ret.collapsed_map) {
        ret.collapsed_cache[path] = true;
      }
      
      //delete ret.collapsed_map;
    }
    
    if (ret.pinned_ids != undefined && ret.pinned_ids.length == 0) {
      delete ret.pinned_ids;
    }
    
    return ret;
  }
}

DopeSheetEditor.STRUCT = STRUCT.inherit(DopeSheetEditor, Area) + """
    pan             : vec2 | obj.velpan.pan;
    zoom            : float;
    collapsed_map   : array(string) | obj._tree_collapsed_map();
    selected_only   : int;
    pinned_ids     : array(int) | obj.pinned_ids != undefined ? obj.pinned_ids : [];
}
""";

DopeSheetEditor.uiname = "Dopesheet";
DopeSheetEditor.debug_only = false;
