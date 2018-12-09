es6_module_define('DopeSheetEditor', ["spline_base", "UIElement", "spline_editops", "spline_types", "UITextBox", "spline_layerops", "spline_element_array", "dopesheet_ops", "UIWidgets_special", "UITabPanel", "toolops_api", "UIPack", "dopesheet_phantom", "animdata", "struct", "UIWidgets", "ScreenArea", "UISplitFrame", "mathlib", "events", "spline", "../../ui/UISplitFrame", "UIFrame"], function _DopeSheetEditor_module(_es6_module) {
  "use strict";
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var gen_editor_switcher=es6_import_item(_es6_module, 'UIWidgets_special', 'gen_editor_switcher');
  var KeyMap=es6_import_item(_es6_module, 'events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, 'events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, 'events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, 'events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, 'events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, 'events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, 'events', 'EventHandler');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var phantom=es6_import_item(_es6_module, 'dopesheet_phantom', 'phantom');
  var KeyTypes=es6_import_item(_es6_module, 'dopesheet_phantom', 'KeyTypes');
  var FilterModes=es6_import_item(_es6_module, 'dopesheet_phantom', 'FilterModes');
  var get_select=es6_import_item(_es6_module, 'dopesheet_phantom', 'get_select');
  var get_time=es6_import_item(_es6_module, 'dopesheet_phantom', 'get_time');
  var set_select=es6_import_item(_es6_module, 'dopesheet_phantom', 'set_select');
  var set_time=es6_import_item(_es6_module, 'dopesheet_phantom', 'set_time');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var UIButtonAbstract=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonAbstract');
  var UIButton=es6_import_item(_es6_module, 'UIWidgets', 'UIButton');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UIMenuButton=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuButton');
  var UICheckBox=es6_import_item(_es6_module, 'UIWidgets', 'UICheckBox');
  var UINumBox=es6_import_item(_es6_module, 'UIWidgets', 'UINumBox');
  var UILabel=es6_import_item(_es6_module, 'UIWidgets', 'UILabel');
  var UIMenuLabel=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuLabel');
  var ScrollButton=es6_import_item(_es6_module, 'UIWidgets', 'ScrollButton');
  var UIVScroll=es6_import_item(_es6_module, 'UIWidgets', 'UIVScroll');
  var UIIconCheck=es6_import_item(_es6_module, 'UIWidgets', 'UIIconCheck');
  var UISplitFrame=es6_import_item(_es6_module, 'UISplitFrame', 'UISplitFrame');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var UIPackFrame=es6_import_item(_es6_module, 'UIPack', 'UIPackFrame');
  var UITextBox=es6_import_item(_es6_module, 'UITextBox', 'UITextBox');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var UITabBar=es6_import_item(_es6_module, 'UITabPanel', 'UITabBar');
  var UICollapseIcon=es6_import_item(_es6_module, 'UIWidgets_special', 'UICollapseIcon');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var Spline=es6_import_item(_es6_module, 'spline', 'Spline');
  var RestrictFlags=es6_import_item(_es6_module, 'spline', 'RestrictFlags');
  var CustomDataLayer=es6_import_item(_es6_module, 'spline_types', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineSegment=es6_import_item(_es6_module, 'spline_types', 'SplineSegment');
  var TimeDataLayer=es6_import_item(_es6_module, 'animdata', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, 'animdata', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, 'animdata', 'set_vtime');
  var AnimKey=es6_import_item(_es6_module, 'animdata', 'AnimKey');
  var AnimChannel=es6_import_item(_es6_module, 'animdata', 'AnimChannel');
  var AnimKeyFlags=es6_import_item(_es6_module, 'animdata', 'AnimKeyFlags');
  var AnimInterpModes=es6_import_item(_es6_module, 'animdata', 'AnimInterpModes');
  var SplineLayerFlags=es6_import_item(_es6_module, 'spline_element_array', 'SplineLayerFlags');
  var SplineLayerSet=es6_import_item(_es6_module, 'spline_element_array', 'SplineLayerSet');
  var SplineFlags=es6_import_item(_es6_module, 'spline_base', 'SplineFlags');
  var AddLayerOp=es6_import_item(_es6_module, 'spline_layerops', 'AddLayerOp');
  var ChangeLayerOp=es6_import_item(_es6_module, 'spline_layerops', 'ChangeLayerOp');
  var ChangeElementLayerOp=es6_import_item(_es6_module, 'spline_layerops', 'ChangeElementLayerOp');
  var DissolveVertOp=es6_import_item(_es6_module, 'spline_editops', 'DissolveVertOp');
  var ShiftTimeOp2=es6_import_item(_es6_module, 'dopesheet_ops', 'ShiftTimeOp2');
  var ShiftTimeOp3=es6_import_item(_es6_module, 'dopesheet_ops', 'ShiftTimeOp3');
  var SelectOp=es6_import_item(_es6_module, 'dopesheet_ops', 'SelectOp');
  var DeleteKeyOp=es6_import_item(_es6_module, 'dopesheet_ops', 'DeleteKeyOp');
  var ColumnSelect=es6_import_item(_es6_module, 'dopesheet_ops', 'ColumnSelect');
  var SelectKeysToSide=es6_import_item(_es6_module, 'dopesheet_ops', 'SelectKeysToSide');
  var ToggleSelectOp=es6_import_item(_es6_module, 'dopesheet_ops', 'ToggleSelectOp');
  var Area=es6_import_item(_es6_module, 'ScreenArea', 'Area');
  var UISplitFrame=es6_import_item(_es6_module, '../../ui/UISplitFrame', 'UISplitFrame');
  var tree_packflag=PackFlags.INHERIT_WIDTH|PackFlags.ALIGN_LEFT|PackFlags.ALIGN_TOP|PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT;
  var CHGT=25;
  var TreeItem=_ESClass("TreeItem", RowFrame, [function TreeItem(ctx, name) {
    RowFrame.call(this, ctx);
    this.path = name;
    this.packflag|=tree_packflag;
    this.default_packflag|=tree_packflag;
    this.namemap = {}
    this.collapsed = false;
    this.panel = this.col();
    var this2=this;
    this.icon = new UICollapseIcon(undefined, undefined, function(icon) {
      this2.set_collapsed(icon.collapsed);
    });
    this.icon.small_icon = true;
    this.draw_background = true;
    this.panel.add(this.icon);
    this.panel.label(name);
    this.stored_children = undefined;
  }, function get_filedata() {
    return {collapsed: this.collapsed}
  }, function load_filedata(data) {
    this.set_collapsed(data.collapsed);
  }, function get_min_size(canvas, isvertical) {
    var h=CHGT;
    var max_width=100;
    var size=[0, 0];
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      var s=c.get_min_size(canvas, isvertical);
      if (c===this.panel) {
          s[1] = h;
      }
      max_width = Math.max(max_width, s[0]);
      var sh=s[1];
      if (sh%h!=0) {
          sh+=h-(sh%h);
      }
      size[1]+=sh;
    }
    size[0] = max_width;
    size[0] = 120;
    return size;
  }, function build_path() {
    var path=this.path;
    var p=this;
    while (p!=undefined&&!(__instance_of(p.parent, TreePanel))) {
      p = p.parent;
      path = p.path+"."+path;
    }
    return path;
  }, function pack(canvas) {
    var h=CHGT;
    var p=this;
    while (p.parent!=undefined&&!(__instance_of(p, DopeSheetEditor))) {
      p = p.parent;
    }
    var y=this.size[1];
    var x=0;
    var w=this.size[0];
    var side_margin=5;
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      var size=c.get_min_size(canvas);
      if (c===this.panel) {
          size[1] = h;
      }
      c.size[0] = w-side_margin;
      c.size[1] = size[1];
      y-=Math.max(c.size[1], h);
      c.pos[0] = x+side_margin;
      c.pos[1] = y;
      if (__instance_of(c, UIFrame)) {
          c.pack(canvas);
      }
    }
  }, function set_collapsed(state) {
    this.collapsed = state;
    if (this.icon.collapsed!=state)
      this.icon.collapsed = state;
    if (state&&this.stored_children==undefined) {
        this.stored_children = [];
        var __iter_c=__get_iter(this._children);
        var c;
        while (1) {
          var __ival_c=__iter_c.next();
          if (__ival_c.done) {
              break;
          }
          c = __ival_c.value;
          this.stored_children.push(c);
        }
        this._children = [this.panel];
        this.do_full_recalc();
    }
    else 
      if (!state&&this.stored_children!=undefined) {
        console.log("restore children");
        this._children = this.stored_children;
        this.stored_children = undefined;
        this.do_full_recalc();
    }
  }]);
  _es6_module.add_class(TreeItem);
  TreeItem = _es6_module.add_export('TreeItem', TreeItem);
  var TreePanel=_ESClass("TreePanel", RowFrame, [function TreePanel(ctx) {
    RowFrame.call(this, ctx);
    this.packflag|=tree_packflag;
    this.default_packflag|=tree_packflag;
    this.totpath = 0;
    this.draw_background = true;
    this.tree = new TreeItem(ctx, "root");
    this.pathmap = {root: this.tree}
    this.add(this.tree);
  }, function load_collapsed(paths) {
    var cset={}
    for (var i=0; i<paths.length; i++) {
        cset[paths[i]] = true;
    }
    for (var k in cset) {
        if (!(k in this.pathmap))
          continue;
        console.log("loading collapsed state for", k);
        this.pathmap[k].set_collapsed(cset[k]);
    }
    this.do_full_recalc();
  }, function get_collapsed_paths() {
    var ret=[];
    function recurse(c) {
      if (c.collapsed) {
          ret.push(c.build_path());
      }
      var __iter_c2=__get_iter(c);
      var c2;
      while (1) {
        var __ival_c2=__iter_c2.next();
        if (__ival_c2.done) {
            break;
        }
        c2 = __ival_c2.value;
        if (__instance_of(c2, TreeItem)) {
            recurse(c2);
        }
      }
    }
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (__instance_of(c, TreeItem)) {
          recurse(c);
      }
    }
    return ret;
  }, function reset() {
    this.children = [];
    this.tree = new TreeItem(this.ctx, "root");
    this.add(this.tree);
    this.pathmap = {root: this.tree}
    this.totpath = 0;
    this.do_full_recalc();
  }, function is_collapsed(path) {
    path = path.trim();
    if (!(path in this.pathmap))
      return undefined;
    var p=this.pathmap[path];
    return p.collapsed;
  }, function get_y(path) {
    path = path.trim();
    this.abspos[0] = this.abspos[1] = 0.0;
    this.abs_transform(this.abspos);
    if (path in this.pathmap) {
        var p=this.pathmap[path];
        var hidden=false;
        var last_hidden=p;
        while (p.parent!==undefined&&!(__instance_of(p, TreePanel))) {
          if (p.collapsed) {
              hidden = true;
              last_hidden = p;
          }
          p = p.parent;
        }
        var p=last_hidden;
        p.abspos[0] = p.abspos[1] = 0.0;
        p.abs_transform(p.abspos);
        return (p.abspos[1]-this.abspos[1])+this.pos[1]-this.parent.velpan.pan[1]+this.parent.parent.pos[1];
    }
    else {
      return undefined;
    }
  }, function add_path(path) {
    path = path.trim();
    var paths=path.split(".");
    var tree=this.tree;
    var lasttree=undefined;
    if (paths[0].trim()=="root")
      paths = paths.slice(1, paths.length);
    var path2="";
    for (var i=0; i<paths.length; i++) {
        var key=paths[i].trim();
        if (i==0)
          path2 = key;
        else 
          path2+="."+key;
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
  }, function build_draw(canvas) {
    RowFrame.prototype.build_draw.apply(this, arguments);
  }]);
  _es6_module.add_class(TreePanel);
  TreePanel = _es6_module.add_export('TreePanel', TreePanel);
  var PanOp=_ESClass("PanOp", ToolOp, [function PanOp(start_mpos, dopesheet) {
    ToolOp.call(this);
    this.ds = dopesheet;
    this.is_modal = true;
    this.undoflag|=UndoFlags.IGNORE_UNDO;
    this.start_pan = new Vector2(dopesheet.velpan.pan);
    this.first_draw = true;
    if (0&&start_mpos!=undefined) {
        this.start_mpos = new Vector2(start_mpos);
        this.first = false;
    }
    else {
      this.start_mpos = new Vector2();
      this.first = true;
    }
    this.start_cameramat = undefined;
    this.cameramat = new Matrix4();
  }, function start_modal(ctx) {
    this.start_cameramat = new Matrix4(ctx.view2d.cameramat);
  }, function on_mousemove(event) {
    var mpos=new Vector3([event.x, event.y, 0]);
    if (this.first) {
        this.first = false;
        this.start_mpos.load(mpos);
        return ;
    }
    var ctx=this.modal_ctx;
    mpos.sub(this.start_mpos).sub(this.ds.abspos);
    this.ds.velpan.pan[0] = this.start_pan[0]+mpos[0];
    this.ds.velpan.pan[1] = this.start_pan[1]+mpos[1];
    this.ds.do_full_recalc();
    window.redraw_ui();
  }, function on_mouseup(event) {
    this.end_modal();
  }]);
  _es6_module.add_class(PanOp);
  PanOp = _es6_module.add_export('PanOp', PanOp);
  var DopeSheetEditor=_ESClass("DopeSheetEditor", Area, [function DopeSheetEditor(pos, size) {
    Area.call(this, DopeSheetEditor.name, DopeSheetEditor.uiname, new Context(), pos, size);
    this.pinned_ids = undefined;
    this.nodes = [];
    this.nodemap = {}
    this._get_key_ret_cache = new cachering(function() {
      return [0, 0, 0];
    }, 2048);
    this.selected_only = true;
    this.time_zero_x = 4;
    this.velpan.can_coast = false;
    this.velpan.enabled = false;
    this.draw_background = false;
    this.first = true;
    this.groups = {}
    this._recalc_cache = {}
    this.vdmap = {}
    this.heightmap = {}
    this.rowmap = {}
    this.old_keyboxes = {}
    this.collapsed_cache = {}
    this.nodemap = {}
    this.cameramat = new Matrix4();
    this.rendermat = new Matrix4();
    this.irendermat = new Matrix4();
    this.zoom = 1.0;
    this.timescale = 12.0;
    this.vmap = {}
    this.last_time = 0;
    this.phantom_cache = cachering.fromConstructor(phantom, 2048);
    this.highlight = undefined;
    this.active = undefined;
    this.collapsemap = {}
    this.mpos = new Vector3();
    this.mdown = false;
    this.start_mpos = new Vector3();
    this.CHGT = CHGT;
    this.CWID = 16;
    this.keymap = new KeyMap();
    this.define_keymap();
  }, function build_layout() {
    this.channels = new TreePanel();
    this.channels.size[0] = 100;
    this.channels.size[1] = 600;
    Area.prototype.build_layout.call(this, false, true);
    this.middlesplit.horizontal = true;
    let sidebar=this.middlesplit.initial();
    sidebar.state|=UIFlags.BG_EVENTS_TRANSPARENT;
    this.middlesplit.split(145, false, false, true).state|=UIFlags.BG_EVENTS_TRANSPARENT;
    sidebar.draw_background = false;
    sidebar.add(this.channels);
  }, function area_duplicate() {
    var ret=new DopeSheetEditor();
    ret.velpan.pan[0] = this.velpan.pan[0];
    ret.velpan.pan[1] = this.velpan.pan[1];
    ret.pinned_ids = this.pinned_ids;
    ret.selected_only = this.selected_only;
    ret.time_zero_x = this.time_zero_x;
    ret.timescale = this.timescale;
    ret.zoom = this.zoom;
    return ret;
  }, function rebuild_vdmap() {
    var frameset=this.ctx.frameset;
    this.vdmap = {}
    for (var vd_eid in frameset.vertex_animdata) {
        var __iter_v=__get_iter(frameset.vertex_animdata[vd_eid].verts);
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          this.vdmap[v.eid] = vd_eid;
        }
    }
  }, function get_vdatas() {
    var ctx=this.ctx, frameset=ctx.frameset, spline=frameset.spline, pathspline=frameset.pathspline;
    var vset=new set();
    if (this.pinned_ids!=undefined) {
        var __iter_id=__get_iter(this.pinned_ids);
        var id;
        while (1) {
          var __ival_id=__iter_id.next();
          if (__ival_id.done) {
              break;
          }
          id = __ival_id.value;
          if (!(id&KeyTypes.PATHSPLINE))
            continue;
          var id1=id;
          id = this.vdmap[id&KeyTypes.CLEARMASK];
          if (id===undefined) {
              if (this.ctx!=undefined) {
                  this.rebuild_vdmap();
                  console.warn("Warning, had to rebuild vdmap!", id1.id1&KeyTypes.CLEARMASK, id1&~KeyTypes.CLEARMASK);
                  id = this.vdmap[id&KeyTypes.CLEARMASK];
                  if (id===undefined) {
                      console.warn("  id was still undefined!");
                      continue;
                  }
              }
              else {
                continue;
              }
          }
          if (typeof id=="string") {
              id = parseInt(id);
          }
          var vd=frameset.get_vdata(id, false);
          if (vd!=undefined)
            vset.add(vd);
        }
    }
    else 
      if (this.selected_only) {
        var __iter_v=__get_iter(spline.verts.selected.editable());
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          var vd=frameset.get_vdata(v.eid, false);
          if (vd!=undefined)
            vset.add(vd);
        }
    }
    else {
      var __iter_v=__get_iter(spline.verts);
      var v;
      while (1) {
        var __ival_v=__iter_v.next();
        if (__ival_v.done) {
            break;
        }
        v = __ival_v.value;
        var vd=frameset.get_vdata(v.eid, false);
        if (vd!=undefined)
          vset.add(vd);
      }
    }
    return vset;
  }, _ESClass.static(function default_new(ctx, scr, gl, pos, size) {
    var ret=new DopeSheetEditor(pos, size);
    ret.ctx = ctx;
    return ret;
  }), function scaletime(t) {
    return this.timescale*t;
  }, function unscaletime(t) {
    return t/this.timescale;
  }, function get_datakey(keyid) {
    if (typeof keyid!="number")
      keyid = keyid.id;
    keyid = keyid&KeyTypes.CLEARMASK;
    var chgt=this.CHGT, cwid=this.CWID;
    var ph=this.phantom_cache.next();
    ph.ds = this;
    ph.type = KeyTypes.DATAPATH;
    var key=ph.key = this.ctx.frameset.lib_anim_idmap[keyid];
    var ch=ph.ch = key.channel;
    ph.path = "root."+ch.path.replace("frameset.drawspline.", "");
    ph.path = ph.path.replace("[", ".").replace("]", "").trim();
    ph.id = key.id|ph.type;
    ph.time = key.time;
    var y=-1;
    var y2=this.channels.get_y(ph.path);
    if (y2!=undefined&&!isNaN(y2))
      y = y2;
    var pan=this.velpan.pan;
    ph.pos[0] = this.time_zero_x-2+this.scaletime(ph.time)+pan[0];
    ph.pos[1] = y;
    ph.size[0] = cwid, ph.size[1] = chgt;
    if (this.old_keyboxes[ph.id]==undefined) {
        var ph2=this.old_keyboxes[ph.id] = new phantom();
        ph2.ds = this;
        ph2.load(ph);
        ph2.ch = undefined;
        ph2.key = keyid;
    }
    return ph;
  }, function get_vertkey(id) {
    if (typeof id!="number")
      id = id.eid;
    else 
      id = id&KeyTypes.CLEARMASK;
    var v=this.ctx.frameset.pathspline.eidmap[id];
    var vd_eid=this.vdmap[v.eid];
    var vd=vd_eid!=undefined ? this.ctx.frameset.vertex_animdata[vd_eid] : undefined;
    var ph=this.phantom_cache.next();
    ph.ds = this;
    ph.type = KeyTypes.PATHSPLINE;
    var chgt=this.CHGT, cwid=this.CWID;
    ph.vd = vd;
    ph.v = v;
    ph.id = v.eid|ph.type;
    ph.time = get_vtime(v);
    ph.path = "root.verts."+vd_eid;
    var y=-1;
    var y2=this.channels.get_y(ph.path);
    if (y2!=undefined)
      y = y2;
    var pan=this.velpan.pan;
    ph.pos[0] = this.time_zero_x-2+this.scaletime(ph.time)+pan[0];
    ph.pos[1] = y;
    ph.size[0] = cwid, ph.size[1] = chgt;
    if (this.old_keyboxes[ph.id]===undefined) {
        var ph2=this.old_keyboxes[ph.id] = new phantom();
        ph2.ds = this;
        ph2.load(ph);
        ph2.v = v.eid;
        ph2.vd = vd.eid;
    }
    return ph;
  }, function setselect(v, state) {
    if (typeof v=="number")
      v = this.ctx.frameset.pathspline.eidmap[veid];
    if (state)
      v.flag|=SplineFlags.UI_SELECT;
    else 
      v.flag&=~SplineFlags.UI_SELECT;
  }, function on_tick() {
    Area.prototype.on_tick.apply(this, arguments);
    if (this.ctx==undefined)
      this.ctx = new Context();
    if (this.ctx!=undefined) {
        var scene=this.ctx.scene;
        if (scene.time!=this.last_time) {
            var time_x1=this.time_zero_x+this.scaletime(this.last_time)+this.velpan.pan[0];
            var time_x=this.time_zero_x+this.scaletime(scene.time)+this.velpan.pan[0];
            if (time_x1>=0&&time_x1<=this.size[0]) {
                this.dirty_rects.push([[this.abspos[0]+time_x1-8, this.abspos[1]], [16, this.size[1]]]);
                this.do_recalc();
            }
            if (time_x>=0&&time_x<=this.size[0]) {
                this.dirty_rects.push([[this.abspos[0]+time_x-8, this.abspos[1]], [16, this.size[1]]]);
                this.do_recalc();
            }
            this.last_time = scene.time;
        }
    }
    var this2=this;
    function on_sel() {
      console.log("------------------on sel!----------------");
      return this2.on_vert_select.apply(this2, arguments);
    }
    if (this.first) {
        if (this.ctx==undefined) {
            this.ctx = new Context();
        }
        var ctx=this.ctx;
        this.first = false;
        this.nodes.push(on_sel);
        the_global_dag.link(ctx.frameset.spline.verts, ["on_select_add"], on_sel, ["eid"]);
        the_global_dag.link(ctx.frameset.spline.verts, ["on_select_sub"], on_sel, ["eid"]);
    }
  }, function on_vert_select() {
    this.do_full_recalc();
    console.log("on vert select", arguments);
  }, function update_collapsed_cache() {
    for (var path in this.collapsed_cache) {
        if (!(path in this.channels.pathmap)) {
            delete this.collapsed_cache[path];
            continue;
        }
        if (!this.channels.is_collapsed(path))
          delete this.collapsed_cache[path];
    }
    for (var path in this.channels.pathmap) {
        var ti=this.channels.pathmap[path];
        if (ti.collapsed)
          this.collapsed_cache[path] = true;
    }
  }, function _tree_collapsed_map() {
    this.update_collapsed_cache();
    var ret=[];
    for (var k in this.collapsed_cache) {
        ret.push(k);
    }
    return ret;
  }, function get_datapaths() {
    var __gen_this2=this;
    function _generator_iter() {
      this.scope = {frameset_3: undefined, spline_3: undefined, actlayer_3: undefined}
      this.ret = {done: false, value: undefined}
      this.state = 1;
      this.trystack = [];
      this.next = function() {
        var ret;
        var stack=this.trystack;
        try {
          ret = this._next();
        }
        catch (err) {
            if (stack.length>0) {
                var item=stack.pop(stack.length-1);
                this.state = item[0];
                this.scope[item[1]] = err;
                return this.next();
            }
            else {
              throw err;
            }
        }
        return ret;
      }
      this.push_trystack = function(catchstate, catchvar) {
        this.trystack.push([catchstate, catchvar]);
      }
      this.pop_trystack = function() {
        this.trystack.pop(this.trystack.length-1);
      }
      this._next = function() {
        var $__ret=undefined;
        var $__state=this.state;
        var scope=this.scope;
        while ($__state<33) {
          switch ($__state) {
            case 0:
              break;
            case 1:
              $__state = (__gen_this2.ctx==undefined) ? 2 : 3;
              break;
            case 2:
              return [];
              
              $__state = 3;
              break;
            case 3:
              scope.frameset_3=__gen_this2.ctx.frameset;
              scope.spline_3=scope.frameset_3.spline;
              scope.actlayer_3=scope.spline_3.layerset.active;
              
              $__state = 4;
              break;
            case 4:
              $__state = (__gen_this2.pinned_ids!=undefined) ? 5 : 18;
              break;
            case 5:
              scope.visit_5={};
              scope.__iter_id_5=__get_iter(__gen_this2.pinned_ids);
              scope.id_5;
              
              $__state = 6;
              break;
            case 6:
              $__state = (1) ? 7 : 33;
              break;
            case 7:
              scope.__ival_id_7=scope.__iter_id_5.next();
              
              $__state = 8;
              break;
            case 8:
              $__state = (scope.__ival_id_7.done) ? 9 : 10;
              break;
            case 9:
              $__state = 33;
              break;
              
              $__state = 10;
              break;
            case 10:
              scope.id_5 = scope.__ival_id_7.value;
              
              $__state = 11;
              break;
            case 11:
              $__state = (!(scope.id_5&KeyTypes.DATAPATH)) ? 12 : 13;
              break;
            case 12:
              $__state = 6;
              break;
              
              $__state = 13;
              break;
            case 13:
              scope.id_5 = scope.id_5&KeyTypes.CLEARMASK;
              scope.key_13=scope.frameset_3.lib_anim_idmap[scope.id_5];
              scope.ch_13=scope.key_13.channel;
              
              $__state = 14;
              break;
            case 14:
              $__state = (scope.ch_13.path in scope.visit_5) ? 15 : 16;
              break;
            case 15:
              $__state = 6;
              break;
              
              $__state = 16;
              break;
            case 16:
              scope.visit_5[scope.ch_13.path] = 1;
              
              $__state = 17;
              break;
            case 17:
              $__ret = this.ret;
              $__ret.value = scope.ch_13;
              
              $__state = 6;
              break;
            case 18:
              
              $__state = 19;
              break;
            case 19:
              scope.i_19=0;
              
              $__state = 20;
              break;
            case 20:
              $__state = (scope.i_19<scope.frameset_3.lib_anim_channels.length) ? 21 : 33;
              break;
            case 21:
              scope.ch_21=scope.frameset_3.lib_anim_channels[scope.i_19];
              scope.eid_21=scope.ch_21.path.match(/\[[0-9]+\]/);
              
              $__state = 22;
              break;
            case 22:
              $__state = (scope.eid_21==null) ? 23 : 24;
              break;
            case 23:
              console.log("Not an eid path", scope.ch_21.path, scope.eid_21);
              scope.i_19++;
              $__state = 20;
              break;
              
              $__state = 24;
              break;
            case 24:
              scope.eid_21 = scope.eid_21[scope.eid_21.length-1];
              scope.eid_21 = parseInt(scope.eid_21.slice(1, scope.eid_21.length-1));
              scope.e_24=scope.spline_3.eidmap[scope.eid_21];
              
              $__state = 25;
              break;
            case 25:
              $__state = (scope.e_24==undefined) ? 26 : 27;
              break;
            case 26:
              console.log("e was null, not an eid path?", scope.eid_21, scope.ch_21.path);
              scope.i_19++;
              $__state = 20;
              break;
              
              $__state = 27;
              break;
            case 27:
              $__state = (__gen_this2.selected_only) ? 28 : 31;
              break;
            case 28:
              scope.bad_28=!(scope.e_24.flag&SplineFlags.SELECT);
              scope.bad_28 = scope.bad_28||(scope.e_24.flag&SplineFlags.HIDE);
              scope.bad_28 = scope.bad_28||!(scope.actlayer_3.id in scope.e_24.layers);
              
              $__state = 29;
              break;
            case 29:
              $__state = (scope.bad_28) ? 30 : 31;
              break;
            case 30:
              scope.i_19++;
              $__state = 20;
              break;
              
              $__state = 31;
              break;
            case 31:
              $__ret = this.ret;
              $__ret.value = scope.ch_21;
              
              $__state = 32;
              break;
            case 32:
              scope.i_19++;
              
              $__state = 20;
              break;
            case 33:
              break;
            default:
              console.log("Generator state error");
              console.trace();
              break;
          }
          if ($__ret!=undefined) {
              break;
          }
        }
        if ($__ret!=undefined) {
            this.ret.value = $__ret.value;
        }
        else {
          this.ret.done = true;
          this.ret.value = undefined;
        }
        this.state = $__state;
        return this.ret;
      }
      this[Symbol.iterator] = function() {
        return this;
      }
      this.forEach = function(callback, thisvar) {
        if (thisvar==undefined)
          thisvar = self;
        var _i=0;
        while (1) {
          var ret=this.next();
          if (ret==undefined||ret.done||(ret._ret!=undefined&&ret._ret.done))
            break;
          callback.call(thisvar, ret.value);
          if (_i++>100) {
              console.log("inf loop", ret);
              break;
          }
        }
      }
    }
    return new _generator_iter();
  }, function _on_sel_1(vd, nothing, veid) {
    var v=this.ctx.frameset.pathspline.eidmap[veid];
    if (v==undefined) {
        
        var id=veid|KeyTypes.PATHSPLINE;
        if (id in this.old_keyboxes) {
            var key2=this.old_keyboxes[id];
            this.dirty_rects.push([[key2.pos[0]+this.abspos[0], key2.pos[1]+this.abspos[1]], [Math.abs(key2.size[0]), key2.size[1]]]);
            this.do_recalc();
        }
        return ;
    }
    this.redraw_key(this.get_vertkey(veid));
  }, function _on_sel_2(nothing, id) {
    var key=this.ctx.frameset.lib_anim_idmap[id];
    id|=KeyTypes.DATAPATH;
    if (key!=undefined) {
        this.redraw_key(this.get_datakey(id));
    }
    else {
      if (id in this.old_keyboxes) {
          var key2=this.old_keyboxes[id];
          this.dirty_rects.push([[key2.pos[0]+this.abspos[0], key2.pos[1]+this.abspos[1]], [Math.abs(key2.size[0]), key2.size[1]]]);
          this.do_recalc();
      }
    }
  }, function get_key(id_with_type) {
    var id=id_with_type;
    if (id&KeyTypes.PATHSPLINE) {
        return this.get_vertkey(id&KeyTypes.CLEARMASK);
    }
    else {
      return this.get_datakey(id&KeyTypes.CLEARMASK);
    }
  }, function get_keypaths(start_y) {
    var __gen_this2=this;
    function _generator_iter() {
      this.scope = {start_y_0: start_y, y_3: undefined, cwid_3: undefined, chgt_3: undefined, spline_3: undefined, actlayer_3: undefined, __iter_ch_3: undefined, ch_3: undefined}
      this.ret = {done: false, value: undefined}
      this.state = 1;
      this.trystack = [];
      this.next = function() {
        var ret;
        var stack=this.trystack;
        try {
          ret = this._next();
        }
        catch (err) {
            if (stack.length>0) {
                var item=stack.pop(stack.length-1);
                this.state = item[0];
                this.scope[item[1]] = err;
                return this.next();
            }
            else {
              throw err;
            }
        }
        return ret;
      }
      this.push_trystack = function(catchstate, catchvar) {
        this.trystack.push([catchstate, catchvar]);
      }
      this.pop_trystack = function() {
        this.trystack.pop(this.trystack.length-1);
      }
      this._next = function() {
        var $__ret=undefined;
        var $__state=this.state;
        var scope=this.scope;
        while ($__state<16) {
          switch ($__state) {
            case 0:
              break;
            case 1:
              $__state = (__gen_this2.ctx==undefined) ? 2 : 3;
              break;
            case 2:
              return ;
              
              $__state = 3;
              break;
            case 3:
              scope.y_3=scope.start_y_0;
              scope.cwid_3=__gen_this2.CWID, scope.chgt_3=__gen_this2.CHGT;
              scope.spline_3=__gen_this2.ctx.frameset.spline;
              scope.actlayer_3=scope.spline_3.layerset.active;
              scope.__iter_ch_3=__get_iter(__gen_this2.get_datapaths());
              scope.ch_3;
              
              $__state = 4;
              break;
            case 4:
              $__state = (1) ? 5 : 16;
              break;
            case 5:
              scope.__ival_ch_5=scope.__iter_ch_3.next();
              
              $__state = 6;
              break;
            case 6:
              $__state = (scope.__ival_ch_5.done) ? 7 : 8;
              break;
            case 7:
              $__state = 16;
              break;
              
              $__state = 8;
              break;
            case 8:
              scope.ch_3 = scope.__ival_ch_5.value;
              scope.i_8=0;
              
              $__state = 9;
              break;
            case 9:
              $__state = (scope.i_8<scope.ch_3.keys.length) ? 10 : 15;
              break;
            case 10:
              scope.ret_10=__gen_this2._get_key_ret_cache.next();
              scope.ret_10[0] = scope.ch_3.keys[scope.i_8];
              scope.ret_10[1] = scope.ch_3;
              scope.ret_10[2] = __gen_this2.get_datakey(scope.ch_3.keys[scope.i_8].id);
              scope.id_10=scope.ret_10[2].id;
              
              $__state = 11;
              break;
            case 11:
              $__state = (!(scope.id_10 in __gen_this2.nodemap)) ? 12 : 13;
              break;
            case 12:
              scope.this2_12=__gen_this2;
              scope.on_sel_12=__gen_this2._on_sel_2.bind(__gen_this2);
              __gen_this2.nodes.push(scope.on_sel_12);
              window.the_global_dag.link(scope.ret_10[0], ["depend", "id"], scope.on_sel_12, ["depend", "id"]);
              __gen_this2.nodemap[scope.id_10] = scope.on_sel_12;
              
              $__state = 13;
              break;
            case 13:
              $__ret = this.ret;
              $__ret.value = scope.ret_10;
              
              $__state = 14;
              break;
            case 14:
              scope.i_8++;
              
              $__state = 9;
              break;
            case 15:
              scope.y_3+=scope.chgt_3;
              
              $__state = 4;
              break;
            case 16:
              break;
            default:
              console.log("Generator state error");
              console.trace();
              break;
          }
          if ($__ret!=undefined) {
              break;
          }
        }
        if ($__ret!=undefined) {
            this.ret.value = $__ret.value;
        }
        else {
          this.ret.done = true;
          this.ret.value = undefined;
        }
        this.state = $__state;
        return this.ret;
      }
      this[Symbol.iterator] = function() {
        return this;
      }
      this.forEach = function(callback, thisvar) {
        if (thisvar==undefined)
          thisvar = self;
        var _i=0;
        while (1) {
          var ret=this.next();
          if (ret==undefined||ret.done||(ret._ret!=undefined&&ret._ret.done))
            break;
          callback.call(thisvar, ret.value);
          if (_i++>100) {
              console.log("inf loop", ret);
              break;
          }
        }
      }
    }
    return new _generator_iter();
  }, function get_keyboth() {
    var __gen_this2=this;
    function _generator_iter() {
      this.scope = {__iter_ret_1: undefined, ret_1: undefined}
      this.ret = {done: false, value: undefined}
      this.state = 1;
      this.trystack = [];
      this.next = function() {
        var ret;
        var stack=this.trystack;
        try {
          ret = this._next();
        }
        catch (err) {
            if (stack.length>0) {
                var item=stack.pop(stack.length-1);
                this.state = item[0];
                this.scope[item[1]] = err;
                return this.next();
            }
            else {
              throw err;
            }
        }
        return ret;
      }
      this.push_trystack = function(catchstate, catchvar) {
        this.trystack.push([catchstate, catchvar]);
      }
      this.pop_trystack = function() {
        this.trystack.pop(this.trystack.length-1);
      }
      this._next = function() {
        var $__ret=undefined;
        var $__state=this.state;
        var scope=this.scope;
        while ($__state<15) {
          switch ($__state) {
            case 0:
              break;
            case 1:
              scope.__iter_ret_1=__get_iter(__gen_this2.get_keyverts());
              scope.ret_1;
              
              $__state = 2;
              break;
            case 2:
              $__state = (1) ? 3 : 8;
              break;
            case 3:
              scope.__ival_ret_3=scope.__iter_ret_1.next();
              
              $__state = 4;
              break;
            case 4:
              $__state = (scope.__ival_ret_3.done) ? 5 : 6;
              break;
            case 5:
              $__state = 8;
              break;
              
              $__state = 6;
              break;
            case 6:
              scope.ret_1 = scope.__ival_ret_3.value;
              
              $__state = 7;
              break;
            case 7:
              $__ret = this.ret;
              $__ret.value = scope.ret_1;
              
              $__state = 2;
              break;
            case 8:
              scope.__iter_ret_1=__get_iter(__gen_this2.get_keypaths());
              scope.ret_1;
              
              $__state = 9;
              break;
            case 9:
              $__state = (1) ? 10 : 15;
              break;
            case 10:
              scope.__ival_ret_10=scope.__iter_ret_1.next();
              
              $__state = 11;
              break;
            case 11:
              $__state = (scope.__ival_ret_10.done) ? 12 : 13;
              break;
            case 12:
              $__state = 15;
              break;
              
              $__state = 13;
              break;
            case 13:
              scope.ret_1 = scope.__ival_ret_10.value;
              
              $__state = 14;
              break;
            case 14:
              $__ret = this.ret;
              $__ret.value = scope.ret_1;
              
              $__state = 9;
              break;
            case 15:
              break;
            default:
              console.log("Generator state error");
              console.trace();
              break;
          }
          if ($__ret!=undefined) {
              break;
          }
        }
        if ($__ret!=undefined) {
            this.ret.value = $__ret.value;
        }
        else {
          this.ret.done = true;
          this.ret.value = undefined;
        }
        this.state = $__state;
        return this.ret;
      }
      this[Symbol.iterator] = function() {
        return this;
      }
      this.forEach = function(callback, thisvar) {
        if (thisvar==undefined)
          thisvar = self;
        var _i=0;
        while (1) {
          var ret=this.next();
          if (ret==undefined||ret.done||(ret._ret!=undefined&&ret._ret.done))
            break;
          callback.call(thisvar, ret.value);
          if (_i++>100) {
              console.log("inf loop", ret);
              break;
          }
        }
      }
    }
    return new _generator_iter();
  }, function get_keyverts() {
    var __gen_this2=this;
    function _generator_iter() {
      this.scope = {channels_1: undefined, y_1: undefined, chgt_1: undefined, __iter_vd_1: undefined, vd_1: undefined}
      this.ret = {done: false, value: undefined}
      this.state = 1;
      this.trystack = [];
      this.next = function() {
        var ret;
        var stack=this.trystack;
        try {
          ret = this._next();
        }
        catch (err) {
            if (stack.length>0) {
                var item=stack.pop(stack.length-1);
                this.state = item[0];
                this.scope[item[1]] = err;
                return this.next();
            }
            else {
              throw err;
            }
        }
        return ret;
      }
      this.push_trystack = function(catchstate, catchvar) {
        this.trystack.push([catchstate, catchvar]);
      }
      this.pop_trystack = function() {
        this.trystack.pop(this.trystack.length-1);
      }
      this._next = function() {
        var $__ret=undefined;
        var $__state=this.state;
        var scope=this.scope;
        while ($__state<17) {
          switch ($__state) {
            case 0:
              break;
            case 1:
              scope.channels_1=__gen_this2.get_vdatas();
              scope.y_1=Area.get_barhgt()+2, scope.chgt_1=__gen_this2.CHGT;
              scope.__iter_vd_1=__get_iter(scope.channels_1);
              scope.vd_1;
              
              $__state = 2;
              break;
            case 2:
              $__state = (1) ? 3 : 17;
              break;
            case 3:
              scope.__ival_vd_3=scope.__iter_vd_1.next();
              
              $__state = 4;
              break;
            case 4:
              $__state = (scope.__ival_vd_3.done) ? 5 : 6;
              break;
            case 5:
              $__state = 17;
              break;
              
              $__state = 6;
              break;
            case 6:
              scope.vd_1 = scope.__ival_vd_3.value;
              scope.__iter_v_6=__get_iter(scope.vd_1.verts);
              scope.v_6;
              
              $__state = 7;
              break;
            case 7:
              $__state = (1) ? 8 : 16;
              break;
            case 8:
              scope.__ival_v_8=scope.__iter_v_6.next();
              
              $__state = 9;
              break;
            case 9:
              $__state = (scope.__ival_v_8.done) ? 10 : 11;
              break;
            case 10:
              $__state = 16;
              break;
              
              $__state = 11;
              break;
            case 11:
              scope.v_6 = scope.__ival_v_8.value;
              
              $__state = 12;
              break;
            case 12:
              $__state = (!(scope.v_6.eid in __gen_this2.vmap)) ? 13 : 14;
              break;
            case 13:
              scope.this2_13=__gen_this2;
              scope.on_sel_13=__gen_this2._on_sel_1.bind(__gen_this2, scope.vd_1);
              __gen_this2.nodes.push(scope.on_sel_13);
              window.the_global_dag.link(scope.v_6, ["depend", "eid"], scope.on_sel_13, ["depend", "eid"]);
              __gen_this2.vmap[scope.v_6.eid] = scope.on_sel_13;
              
              $__state = 14;
              break;
            case 14:
              __gen_this2.vdmap[scope.v_6.eid] = scope.vd_1.eid;
              scope.keybox_14=__gen_this2.get_vertkey(scope.v_6.eid);
              __gen_this2.heightmap[scope.v_6.eid] = scope.keybox_14.pos[1];
              scope.ret_14=__gen_this2._get_key_ret_cache.next();
              scope.ret_14[0] = scope.v_6;
              scope.ret_14[1] = scope.vd_1;
              scope.ret_14[2] = scope.keybox_14;
              
              $__state = 15;
              break;
            case 15:
              $__ret = this.ret;
              $__ret.value = scope.ret_14;
              
              $__state = 7;
              break;
            case 16:
              scope.y_1+=scope.chgt_1;
              
              $__state = 2;
              break;
            case 17:
              break;
            default:
              console.log("Generator state error");
              console.trace();
              break;
          }
          if ($__ret!=undefined) {
              break;
          }
        }
        if ($__ret!=undefined) {
            this.ret.value = $__ret.value;
        }
        else {
          this.ret.done = true;
          this.ret.value = undefined;
        }
        this.state = $__state;
        return this.ret;
      }
      this[Symbol.iterator] = function() {
        return this;
      }
      this.forEach = function(callback, thisvar) {
        if (thisvar==undefined)
          thisvar = self;
        var _i=0;
        while (1) {
          var ret=this.next();
          if (ret==undefined||ret.done||(ret._ret!=undefined&&ret._ret.done))
            break;
          callback.call(thisvar, ret.value);
          if (_i++>100) {
              console.log("inf loop", ret);
              break;
          }
        }
      }
    }
    return new _generator_iter();
  }, function clear_selection() {
    var __iter_v=__get_iter(this.ctx.pathspline.verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      v.flag&=~SplineFlags.UI_SELECT;
    }
  }, function findnearest(mpos, limit) {
    if (limit==undefined) {
        limit = 18;
    }
    var y=Area.get_barhgt()+2;
    var subverts=[];
    var subpathkeys=[];
    var rettype=0;
    var chgt=this.CHGT;
    var mindis=1e+18, ret=undefined;
    var co=new Vector2();
    var retv=undefined;
    var retvd=undefined;
    var rety=0, retx=0;
    var rethigh=undefined;
    var __iter_kret=__get_iter(this.get_keyboth());
    var kret;
    while (1) {
      var __ival_kret=__iter_kret.next();
      if (__ival_kret.done) {
          break;
      }
      kret = __ival_kret.value;
      var v=kret[0], vd=kret[1], keybox=kret[2];
      if (keybox.type==KeyTypes.PATHSPLINE) {
          if (keybox.id==this.highlight) {
              rethigh = {v: v, vd: vd, y: keybox.pos[1], type: keybox.type};
          }
      }
      else {
        var k=kret[0], ch=kret[1];
        if (keybox.id==this.highlight) {
            rethigh = {key: k, ch: ch, y: keybox.pos[1], type: keybox.type};
        }
      }
      co.load(keybox.size).mulScalar(0.5).add(keybox.pos);
      var dis=co.vectorDistance(mpos);
      if (dis<limit&&dis<mindis) {
          mindis = dis;
          retv = v;
          retvd = vd;
          rety = keybox.pos[1];
          retx = keybox.pos[0];
          rettype = keybox.type;
      }
    }
    if (retv!=undefined) {
        var __iter_kret=__get_iter(this.get_keyverts());
        var kret;
        while (1) {
          var __ival_kret=__iter_kret.next();
          if (__ival_kret.done) {
              break;
          }
          kret = __ival_kret.value;
          var v=kret[0], vd=kret[1], keybox=kret[2];
          if (keybox.pos[0]==retx&&keybox.pos[1]==rety) {
              subverts.push(kret[0]);
          }
        }
        var __iter_kret=__get_iter(this.get_keypaths());
        var kret;
        while (1) {
          var __ival_kret=__iter_kret.next();
          if (__ival_kret.done) {
              break;
          }
          kret = __ival_kret.value;
          var v=kret[0], vd=kret[1], keybox=kret[2];
          if (keybox.pos[0]==retx&&keybox.pos[1]==rety) {
              subpathkeys.push(kret[0]);
          }
        }
    }
    if (rethigh!=undefined) {
        if (rethigh.type==KeyTypes.PATHSPLINE)
          rethigh = this.get_vertkey(rethigh.v.eid);
        else 
          rethigh = this.get_datakey(rethigh.key);
    }
    if (retv==undefined)
      return undefined;
    return {v: retv, vd: retvd, keybox: rettype==KeyTypes.PATHSPLINE ? this.get_vertkey(retv.eid) : this.get_datakey(retv), highlight_keybox: rethigh, subverts: subverts, subpathkeys: subpathkeys}
  }, function on_mousedown(event) {
    if (Area.prototype.on_mousedown.call(this, event)) {
        return ;
    }
    if (event.button==0) {
        var nearest=this.findnearest([event.x, event.y]);
        if (nearest!=undefined) {
        }
        if (nearest!=undefined) {
            var ids=[];
            var sels=[];
            sels.push(nearest.keybox.id);
            var has_sel=get_select(this.ctx, nearest.keybox.id);
            var __iter_kret=__get_iter(this.get_keyboth());
            var kret;
            while (1) {
              var __ival_kret=__iter_kret.next();
              if (__ival_kret.done) {
                  break;
              }
              kret = __ival_kret.value;
              var keybox=kret[2];
              ids.push(keybox.id);
              if (keybox.id!=nearest.keybox.id&&keybox.pos[0]==nearest.keybox.pos[0]&&keybox.pos[1]==nearest.keybox.pos[1]) {
                  sels.push(keybox.id);
              }
            }
            var tool=new SelectOp();
            tool.inputs.phantom_ids.set_data(ids);
            tool.inputs.select_ids.set_data(sels);
            tool.inputs.unique.set_data(!event.shiftKey);
            tool.inputs.state.set_data(event.shiftKey ? !has_sel : true);
            g_app_state.toolstack.exec_tool(tool);
        }
        else {
          var ids=[];
          var __iter_kret=__get_iter(this.get_keyboth());
          var kret;
          while (1) {
            var __ival_kret=__iter_kret.next();
            if (__ival_kret.done) {
                break;
            }
            kret = __ival_kret.value;
            var keybox=kret[2];
            ids.push(keybox.id);
          }
          var tool=new SelectOp();
          tool.inputs.phantom_ids.set_data(ids);
          tool.inputs.select_ids.set_data([]);
          tool.inputs.unique.set_data(true);
          tool.inputs.state.set_data(true);
          g_app_state.toolstack.exec_tool(tool);
          var time=Math.floor(this.unscaletime(event.x-this.velpan.pan[0]-this.time_zero_x));
          this.ctx.scene.change_time(this.ctx, time);
          window.redraw_viewport();
        }
        this.start_mpos[0] = event.x;
        this.start_mpos[1] = event.y;
        this.mdown = true;
    }
    else 
      if (event.button==2) {
        var tool=new PanOp([event.x, event.y, 0], this);
        g_app_state.toolstack.exec_tool(tool);
    }
  }, function on_mousemove(event) {
    if (Area.prototype.on_mousemove.call(this, event)) {
        return ;
    }
    if (this.mdown) {
        var dx=event.x-this.start_mpos[0];
        var dy=event.y-this.start_mpos[1];
        if (dx*dx+dy*dy>1.5) {
            var op=new ShiftTimeOp3();
            var ids=[];
            var __iter_kret=__get_iter(this.get_keyboth());
            var kret;
            while (1) {
              var __ival_kret=__iter_kret.next();
              if (__ival_kret.done) {
                  break;
              }
              kret = __ival_kret.value;
              var keybox=kret[2];
              if (!keybox.select)
                continue;
              ids.push(keybox.id);
            }
            op.inputs.phantom_ids.set_data(ids);
            if (ids.length>0) {
                this.mdown = false;
                g_app_state.toolstack.exec_tool(op);
            }
            else {
              var time=Math.floor(this.unscaletime(event.x-this.velpan.pan[0]-this.time_zero_x));
              this.ctx.scene.change_time(this.ctx, time);
              window.redraw_viewport();
            }
        }
        return ;
    }
    var key=this.findnearest([event.x, event.y]);
    if (key!=undefined&&key.keybox.id!=this.highlight) {
        if (key.highlight_keybox!=undefined) {
            this.redraw_key(key.highlight_keybox);
        }
        this.highlight = key.keybox.id;
        key = key.keybox;
        this.redraw_key(key);
    }
    else 
      if (key==undefined) {
        if (this.highlight!=undefined&&(this.highlight&KeyTypes.PATHSPLINE)) {
            var v=this.ctx.frameset.pathspline.eidmap[(this.highlight&~KeyTypes.PATHSPLINE)];
            if (v!=undefined) {
                v.dag_update("depend");
            }
        }
        else 
          if (this.highlight!=undefined) {
            if (this.highlight in this.old_keyboxes) {
                this.redraw_key(this.old_keyboxes[this.highlight]);
            }
        }
        this.highlight = undefined;
    }
  }, function on_mouseup(event) {
    this.mdown = false;
  }, _ESClass.set(function pinned(state) {
    if (state) {
        this.pinned_ids = this.get_all_ids();
    }
    else {
      this.pinned_ids = undefined;
    }
    this.do_full_recalc();
  }), _ESClass.get(function pinned() {
    return this.pinned_ids!=undefined;
  }), function do_full_recalc() {
    Area.prototype.do_full_recalc.apply(this, arguments);
  }, function is_visible(key) {
    return true;
    var x=key.pos[0];
    var y=key.pos[1];
    if (x+key.size[0]<0||x>this.size[0]) {
        return false;
    }
    if (y+key.size[1]<0||y>this.size[1]) {
        return false;
    }
    return true;
  }, function redraw_key(key) {
    if (!this.is_visible(key))
      return ;
    var hash=""+Math.floor(key.pos[0])+","+Math.floor(key.pos[1]);
    if (hash in this._recalc_cache)
      return ;
    this._recalc_cache[hash] = true;
    this.dirty_rects.push([[key.pos[0]+this.abspos[0], key.pos[1]+this.abspos[1]], [Math.abs(key.size[0]), key.size[1]]]);
    if (key.id in this.old_keyboxes) {
        var key2=this.old_keyboxes[key.id];
        this.dirty_rects.push([[key2.pos[0]+this.abspos[0], key2.pos[1]+this.abspos[1]], [Math.abs(key2.size[0]), key2.size[1]]]);
    }
    this.do_recalc();
  }, function draw_grid(canvas) {
    var fsize=this.scaletime(1.0);
    var cellx=this.scaletime(2.0);
    var celly=this.CHGT;
    var totx=Math.floor(this.size[0]/cellx+0.5);
    var toty=Math.floor(this.size[1]/celly+0.5);
    var sign=this.velpan.pan[0]<0.0 ? -1.0 : 1.0;
    var offx=this.time_zero_x+(Math.abs(this.velpan.pan[0])%cellx)*sign;
    var offy=Math.abs(this.velpan.pan[1])%celly;
    var clr=[0.2, 0.9, 0.4, 1.0];
    var v1=[0, 0], v2=[0, 0];
    var alpha=[1, 0.25, 0.25, 0.5, 0.25, 0.25, 0.25, 0.25];
    var grey=[0.2, 0.2, 0.2, 1.0];
    var clrs=[clr, grey, grey, grey, grey, grey, grey, grey];
    var off2=sign*(Math.abs(this.velpan.pan[0])%(cellx*clrs.length));
    var off3=Math.abs(this.velpan.pan[0])%(cellx*8);
    var si=Math.abs(Math.floor(off2/cellx));
    for (var i=0; i<totx; i++, si++) {
        v1[0] = v2[0] = offx+i*cellx;
        v1[1] = 0, v2[1] = this.size[1];
        var clr=clrs[si%clrs.length];
        if (clr==undefined)
          clr = clrs[0];
        clr[3] = alpha[si%alpha.length];
        canvas.line(v1, v2, clr, clr);
    }
  }, function time_overlay(canvas) {
    var v1=new Vector2();
    var timeline_y=Area.get_barhgt()+1, y=timeline_y;
    var fsize=this.scaletime(1.0);
    var tclr=[1, 1, 1, 1.0];
    var clr=[0.2, 0.2, 0.2, 0.7];
    canvas.simple_box([0, Area.get_barhgt()-1], [this.size[0], Area.get_barhgt()], clr);
    var time_x=this.time_zero_x+this.scaletime(this.ctx.scene.time)+this.velpan.pan[0];
    var curclr=[0.2, 0.4, 1.0, 1.0];
    canvas.line([time_x, 0], [time_x, this.size[1]], curclr, curclr);
    canvas.line([time_x+1, 0], [time_x+1, this.size[1]], curclr, curclr);
    var timecellx=fsize*8;
    var offx2=this.time_zero_x+(this.velpan.pan[0])%timecellx;
    var totx2=Math.floor(this.size[0]/timecellx+0.5);
    for (var i=0; i<totx2; i++) {
        v1[0] = offx2+i*timecellx;
        var frame=(offx2+i*timecellx-this.velpan.pan[0])/fsize;
        v1[1] = timeline_y+5;
        canvas.text(v1, ""+Math.floor(frame), tclr);
    }
  }, function build_draw(canvas) {
    var channels=this.channels;
    if (channels===undefined) {
        this.do_full_recalc();
        return ;
    }
    window.channels = this.channels;
    window.ds = this;
    var size=this.channels.get_min_size(canvas);
    this.size[0] = this.parent.size[0];
    this.size[1] = this.parent.size[1];
    size[1] = Math.max(size[1], this.parent.size[1]-Area.get_barhgt());
    this.channels.size[1] = size[1];
    this.channels.pos[1] = Area.get_barhgt()+this.velpan.pan[1]-size[1];
    var keys=[];
    var totpath=0;
    var visit={}
    var __iter_kret=__get_iter(this.get_keyboth());
    var kret;
    while (1) {
      var __ival_kret=__iter_kret.next();
      if (__ival_kret.done) {
          break;
      }
      kret = __ival_kret.value;
      var v=kret[0], vd=kret[1], keybox=kret[2];
      var id=keybox.type==KeyTypes.PATHSPLINE ? kret[1].eid : kret[1].path;
      if (!(id in visit)) {
          totpath++;
          visit[id] = 1;
      }
      keys.push(list(kret));
    }
    if (totpath!==this.channels.totpath) {
        console.log("rebuilding channel tree", keys.length);
        var collapsed=this._tree_collapsed_map();
        this.channels.reset();
        for (var i=0; i<keys.length; i++) {
            var key=keys[i], v=key[0], vd=key[1], keybox=key[2];
            if (keybox.path==undefined) {
                throw new Error("EEK!");
                continue;
            }
            this.channels.add_path(keybox.path);
        }
        
        this.channels.load_collapsed(collapsed);
        this.channels.pack(this.get_canvas());
    }
    if (!this.first_draw)
      this.update_collapsed_cache();
    this.first_draw = false;
    for (var k in this.collapsed_cache) {
        if (k in this.channels.pathmap) {
            this.channels.pathmap[k].set_collapsed(true);
        }
    }
    canvas.simple_box([0, 0], [this.size[0], this.size[1]], [1, 1, 1, 1]);
    if (this.ctx==undefined)
      this.ctx = new Context();
    var rect=this.calc_dirty();
    this.draw_grid(canvas);
    var chgt=this.CHGT;
    var barheight=Area.get_barhgt();
    var y=barheight+2;
    this.heightmap = {}
    var cwid=this.CWID;
    var this2=this;
    var pos=[0, 0];
    var size=[0, 0];
    var highlight_color=[1, 1.0, 0.5, 1.0];
    var highlight_sel_color=[1, 1.0, 0.8, 1.0];
    var selected_color=[1, 0.8, 0.0, 1.0];
    var active_color=[1, 0.5, 0.25, 1.0];
    var borderclr=[0.3, 0.3, 0.3, 1.0];
    var __iter_kret=__get_iter(this.get_keyboth());
    var kret;
    while (1) {
      var __ival_kret=__iter_kret.next();
      if (__ival_kret.done) {
          break;
      }
      kret = __ival_kret.value;
      var v=kret[0], vd=kret[1], keybox=kret[2];
      if (keybox.id in this.old_keyboxes) {
          this.old_keyboxes[keybox.id].load(keybox);
      }
      this.heightmap[keybox.id] = keybox.pos[1];
      this.channels.add_path(keybox.path);
      pos[0] = keybox.pos[0]+this.abspos[0];
      pos[1] = keybox.pos[1]+this.abspos[1];
      if (!aabb_isect_2d(pos, keybox.size, rect[0], rect[1])) {
          continue;
      }
      var margin=2;
      pos[0] = keybox.pos[0]+margin;
      pos[1] = keybox.pos[1]+margin;
      size[0] = keybox.size[0]-margin*2;
      size[1] = keybox.size[1]-margin*2;
      var clr=undefined;
      var id=keybox.id;
      if (id==this.highlight&&keybox.select)
        clr = highlight_sel_color;
      else 
        if (id==this.highlight)
        clr = highlight_color;
      else 
        if (id==this.active)
        clr = active_color;
      else 
        if (keybox.select)
        clr = selected_color;
      canvas.box2(pos, size, clr);
      canvas.box2(pos, size, borderclr, undefined, true);
    }
    this.time_overlay(canvas);
    Area.prototype.build_draw.call(this, canvas);
    this._recalc_cache = {}
  }, function redraw_eid(eid) {
    var v=this.ctx.frameset.pathspline.eidmap[eid];
    var vd=this.vdmap[v.eid];
    var y=this.heightmap[v.eid];
    if (vd==undefined)
      return ;
    var box=this.get_vertkey(v.eid);
    this.redraw_key(box);
  }, function build_bottombar(the_row) {
    var ctx=new Context();
    this.ctx = ctx;
    the_row.packflag|=PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT;
    the_row.default_packflag = PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
    the_row.draw_background = true;
    the_row.rcorner = 100.0;
    the_row.pos = [0, 2];
    the_row.size = [this.size[0], Area.get_barhgt()];
    var col=the_row.col();
    col.add(gen_editor_switcher(this.ctx, this));
    col.prop("dopesheet.selected_only");
    col.prop("dopesheet.pinned");
  }, function dag_unlink_all() {
    var __iter_node=__get_iter(this.nodes);
    var node;
    while (1) {
      var __ival_node=__iter_node.next();
      if (__ival_node.done) {
          break;
      }
      node = __ival_node.value;
      node.dag_unlink();
    }
    this.nodes = [];
  }, function on_area_inactive() {
    Area.prototype.on_area_inactive.call(this);
    console.log("dopesheet active!");
  }, function on_area_inactive() {
    this.first_draw = true;
    console.log("dopesheet inactive!");
    this.dag_unlink_all();
    this.vdmap = {}
    this.vmap = {}
    this.old_keyboxes = {}
    this._recalc_cache = {}
    for (var i=0; i<this.phantom_cache.length; i++) {
        var ph=this.phantom_cache.next();
        ph.ds = undefined;
        ph.v = ph.vd = undefined;
    }
  }, function get_everts() {
    var verts=[];
    var __iter_kret=__get_iter(this.get_keyverts());
    var kret;
    while (1) {
      var __ival_kret=__iter_kret.next();
      if (__ival_kret.done) {
          break;
      }
      kret = __ival_kret.value;
      var v=kret[0], vd=kret[1], keybox=kret[2];
      if (!(v.flag&SplineFlags.UI_SELECT))
        continue;
      verts.push(v.eid);
    }
    return verts;
  }, function get_all_ids() {
    var ids=[];
    var __iter_kret=__get_iter(this.get_keyboth());
    var kret;
    while (1) {
      var __ival_kret=__iter_kret.next();
      if (__ival_kret.done) {
          break;
      }
      kret = __ival_kret.value;
      ids.push(kret[2].id);
    }
    return ids;
  }, function get_all_everts() {
    var verts=[];
    var __iter_kret=__get_iter(this.get_keyverts());
    var kret;
    while (1) {
      var __ival_kret=__iter_kret.next();
      if (__ival_kret.done) {
          break;
      }
      kret = __ival_kret.value;
      var v=kret[0], vd=kret[1], keybox=kret[2];
      verts.push(v.eid);
    }
    return verts;
  }, function define_keymap() {
    var k=this.keymap;
    var this2=this;
    k.add(new KeyHandler("X", [], "Delete Keyframe"), new FuncKeyHandler(function(ctx) {
      var tool=new DeleteKeyOp();
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
    }));
    k.add(new KeyHandler("Left", [], ""), new FuncKeyHandler(function(ctx) {
      console.log("Frame Change!", ctx.scene.time-1);
      ctx.scene.change_time(ctx, ctx.scene.time-1);
      window.redraw_viewport();
    }));
    k.add(new KeyHandler("Left", ["CTRL"], "Select To Left"), new FuncKeyHandler(function(ctx) {
      var tool=new SelectKeysToSide();
      tool.inputs.side.set_data(false);
      tool.inputs.phantom_ids.set_data(this2.get_all_ids());
      g_app_state.toolstack.exec_tool(tool);
    }));
    k.add(new KeyHandler("Right", ["CTRL"], "Select To Right"), new FuncKeyHandler(function(ctx) {
      var tool=new SelectKeysToSide();
      tool.inputs.side.set_data(true);
      tool.inputs.phantom_ids.set_data(this2.get_all_ids());
      g_app_state.toolstack.exec_tool(tool);
    }));
    k.add(new KeyHandler("G", [], "Translate"), new FuncKeyHandler(function(ctx) {
      console.log("translate");
      var op=new ShiftTimeOp3();
      var ids=[];
      var __iter_kret=__get_iter(this2.get_keyboth());
      var kret;
      while (1) {
        var __ival_kret=__iter_kret.next();
        if (__ival_kret.done) {
            break;
        }
        kret = __ival_kret.value;
        var keybox=kret[2];
        if (!keybox.select)
          continue;
        ids.push(keybox.id);
      }
      op.inputs.phantom_ids.set_data(ids);
      g_app_state.toolstack.exec_tool(op);
    }));
    k.add(new KeyHandler("A", [], "Toggle Select"), new FuncKeyHandler(function(ctx) {
      var tool=new ToggleSelectOp();
      var verts=[];
      tool.inputs.phantom_ids.set_data(this2.get_all_ids());
      g_app_state.toolstack.exec_tool(tool);
    }));
    k.add(new KeyHandler("K", [], "Column Select"), new FuncKeyHandler(function(ctx) {
      var tool=new ColumnSelect();
      var ids=[];
      var __iter_kret=__get_iter(this2.get_keyboth());
      var kret;
      while (1) {
        var __ival_kret=__iter_kret.next();
        if (__ival_kret.done) {
            break;
        }
        kret = __ival_kret.value;
        var keybox=kret[2];
        ids.push(keybox.id);
      }
      tool.inputs.state.set_data(true);
      tool.inputs.phantom_ids.set_data(ids);
      g_app_state.toolstack.exec_tool(tool);
    }));
    k.add(new KeyHandler("K", ["SHIFT"], "Column Select"), new FuncKeyHandler(function(ctx) {
      var tool=new ColumnSelect();
      var ids=[];
      var __iter_kret=__get_iter(this2.get_keyboth());
      var kret;
      while (1) {
        var __ival_kret=__iter_kret.next();
        if (__ival_kret.done) {
            break;
        }
        kret = __ival_kret.value;
        var keybox=kret[2];
        ids.push(keybox.id);
      }
      tool.inputs.state.set_data(false);
      tool.inputs.phantom_ids.set_data(ids);
      g_app_state.toolstack.exec_tool(tool);
    }));
    k.add(new KeyHandler("Z", ["CTRL", "SHIFT"], "Redo"), new FuncKeyHandler(function(ctx) {
      console.log("Redo");
      ctx.toolstack.redo();
    }));
    k.add(new KeyHandler("Y", ["CTRL"], "Redo"), new FuncKeyHandler(function(ctx) {
      console.log("Redo");
      ctx.toolstack.redo();
    }));
    k.add(new KeyHandler("Z", ["CTRL"], "Undo"), new FuncKeyHandler(function(ctx) {
      console.log("Undo");
      ctx.toolstack.undo();
    }));
  }, function data_link(block, getblock, getblock_us) {
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new DopeSheetEditor();
    reader(ret);
    if (ret.pan!=undefined) {
        ret.velpan.pan[0] = ret.pan[0];
        ret.velpan.pan[1] = ret.pan[1];
        delete ret.pan;
    }
    if ('collapsed_map' in ret) {
        var cache=ret.collapsed_cache;
        ret.collapsed_cache = {};
        var __iter_path=__get_iter(ret.collapsed_map);
        var path;
        while (1) {
          var __ival_path=__iter_path.next();
          if (__ival_path.done) {
              break;
          }
          path = __ival_path.value;
          ret.collapsed_cache[path] = true;
        }
    }
    if (ret.pinned_ids!=undefined&&ret.pinned_ids.length==0) {
        delete ret.pinned_ids;
    }
    return ret;
  })]);
  _es6_module.add_class(DopeSheetEditor);
  DopeSheetEditor = _es6_module.add_export('DopeSheetEditor', DopeSheetEditor);
  DopeSheetEditor.STRUCT = STRUCT.inherit(DopeSheetEditor, Area)+"\n    pan             : vec2 | obj.velpan.pan;\n    zoom            : float;\n    collapsed_map   : array(string) | obj._tree_collapsed_map();\n    selected_only   : int;\n    pinned_ids     : array(int) | obj.pinned_ids != undefined ? obj.pinned_ids : [];\n}\n";
  DopeSheetEditor.uiname = "Dopesheet";
  DopeSheetEditor.debug_only = false;
}, '/dev/fairmotion/src/editors/dopesheet/DopeSheetEditor.js');
es6_module_define('dopesheet_phantom', ["spline_types", "animdata"], function _dopesheet_phantom_module(_es6_module) {
  "use strict";
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var TimeDataLayer=es6_import_item(_es6_module, 'animdata', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, 'animdata', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, 'animdata', 'set_vtime');
  var AnimKey=es6_import_item(_es6_module, 'animdata', 'AnimKey');
  var AnimChannel=es6_import_item(_es6_module, 'animdata', 'AnimChannel');
  var AnimKeyFlags=es6_import_item(_es6_module, 'animdata', 'AnimKeyFlags');
  var AnimInterpModes=es6_import_item(_es6_module, 'animdata', 'AnimInterpModes');
  var KeyTypes={PATHSPLINE: 1<<29, DATAPATH: 1<<30, CLEARMASK: ~((1<<29)|(1<<30))}
  KeyTypes = _es6_module.add_export('KeyTypes', KeyTypes);
  var FilterModes={VERTICES: 1, SEGMENTS: 4, FACES: 16}
  FilterModes = _es6_module.add_export('FilterModes', FilterModes);
  var phantom=_ESClass("phantom", [function phantom() {
    this.flag = 0;
    this.ds = undefined;
    this.pos = new Vector2(), this.size = new Vector2();
    this.type = KeyTypes.PATHSPLINE;
    this.group = "root";
    this.id = 0;
    this.e = undefined;
    this.ch = undefined;
  }, _ESClass.get(function cached_y() {
    return this.ds.heightmap[this.id];
  }), _ESClass.get(function oldbox() {
    return this.ds.old_keyboxes[this.id];
  }), _ESClass.get(function select() {
    if (this.type==KeyTypes.PATHSPLINE) {
        return this.v.flag&SplineFlags.UI_SELECT;
    }
    else {
      return this.key.flag&AnimKeyFlags.SELECT;
    }
  }), _ESClass.set(function select(val) {
    if (this.type==KeyTypes.PATHSPLINE) {
        this.v.flag|=SplineFlags.UI_SELECT;
    }
    else {
      if (val) {
          this.key.flag|=AnimKeyFlags.SELECT;
      }
      else {
        this.key.flag&=~AnimKeyFlags.SELECT;
      }
    }
  }), function load(b) {
    for (var j=0; j<2; j++) {
        this.pos[j] = b.pos[j];
        this.size[j] = b.size[j];
    }
    this.id = b.id;
    this.type = b.type;
    this.v = b.v;
    this.vd = b.vd;
    this.key = b.key;
    this.ch = b.ch;
  }]);
  _es6_module.add_class(phantom);
  phantom = _es6_module.add_export('phantom', phantom);
  function get_time(ctx, id) {
    if (id&KeyTypes.PATHSPLINE) {
        id = id&KeyTypes.CLEARMASK;
        var v=ctx.frameset.pathspline.eidmap[id];
        return get_vtime(v);
    }
    else {
      id = id&KeyTypes.CLEARMASK;
      var k=ctx.frameset.lib_anim_idmap[id];
      return k.time;
    }
  }
  get_time = _es6_module.add_export('get_time', get_time);
  function set_time(ctx, id, time) {
    if (id&KeyTypes.PATHSPLINE) {
        id = id&KeyTypes.CLEARMASK;
        var v=ctx.frameset.pathspline.eidmap[id];
        set_vtime(v, time);
        v.dag_update("depend");
    }
    else {
      id = id&KeyTypes.CLEARMASK;
      var k=ctx.frameset.lib_anim_idmap[id];
      k.set_time(time);
      k.dag_update("depend");
    }
  }
  set_time = _es6_module.add_export('set_time', set_time);
  function get_select(ctx, id) {
    if (id&KeyTypes.PATHSPLINE) {
        id = id&KeyTypes.CLEARMASK;
        var v=ctx.frameset.pathspline.eidmap[id];
        return v.flag&SplineFlags.UI_SELECT;
    }
    else {
      id = id&KeyTypes.CLEARMASK;
      var k=ctx.frameset.lib_anim_idmap[id];
      return k.flag&AnimKeyFlags.SELECT;
    }
  }
  get_select = _es6_module.add_export('get_select', get_select);
  function set_select(ctx, id, state) {
    if (id&KeyTypes.PATHSPLINE) {
        id = id&KeyTypes.CLEARMASK;
        var v=ctx.frameset.pathspline.eidmap[id];
        var changed=!!(v.flag&SplineFlags.UI_SELECT)!=!!state;
        if (state)
          v.flag|=SplineFlags.UI_SELECT;
        else 
          v.flag&=~SplineFlags.UI_SELECT;
        if (changed)
          v.dag_update("depend");
    }
    else {
      id = id&KeyTypes.CLEARMASK;
      var k=ctx.frameset.lib_anim_idmap[id];
      var changed=!!(k.flag&AnimKeyFlags.SELECT)!=!!state;
      if (state)
        k.flag|=AnimKeyFlags.SELECT;
      else 
        k.flag&=~AnimKeyFlags.SELECT;
      if (changed)
        k.dag_update("depend");
    }
  }
  set_select = _es6_module.add_export('set_select', set_select);
  function delete_key(ctx, id) {
    if (id&KeyTypes.PATHSPLINE) {
        id = id&KeyTypes.CLEARMASK;
        var pathspline=ctx.frameset.pathspline;
        var v=pathspline.eidmap[id];
        var time=get_vtime(v);
        var kcache=ctx.frameset.kcache;
        for (var i=0; i<v.segments.length; i++) {
            var s=v.segments[i], v2=s.other_vert(v), time2=get_vtime(v2);
            var ts=Math.min(time, time2), te=Math.max(time, time2);
            for (var j=ts; j<=te; j++) {
                kcache.invalidate(v2.eid, j);
            }
        }
        v.dag_update("depend");
        pathspline.dissolve_vertex(v);
    }
    else {
      id = id&KeyTypes.CLEARMASK;
      var k=ctx.frameset.lib_anim_idmap[id];
      k.dag_update("depend");
      k.channel.remove(k);
    }
  }
  delete_key = _es6_module.add_export('delete_key', delete_key);
}, '/dev/fairmotion/src/editors/dopesheet/dopesheet_phantom.js');
es6_module_define('dopesheet_transdata', ["transdata", "animdata", "mathlib"], function _dopesheet_transdata_module(_es6_module) {
  "use strict";
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var TransDataItem=es6_import_item(_es6_module, 'transdata', 'TransDataItem');
  var TransDataType=es6_import_item(_es6_module, 'transdata', 'TransDataType');
  var get_vtime=es6_import_item(_es6_module, 'animdata', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, 'animdata', 'set_vtime');
  var TransKey=_ESClass("TransKey", [function TransKey(v) {
    this.v = v;
    this.start_time = get_vtime(v);
  }]);
  _es6_module.add_class(TransKey);
  var TransDopeSheetType=_ESClass("TransDopeSheetType", [_ESClass.static(function apply(ctx, td, item, mat, w) {
  }), _ESClass.static(function undo_pre(ctx, td, undo_obj) {
  }), _ESClass.static(function undo(ctx, undo_obj) {
  }), _ESClass.static(function update(ctx, td) {
    var fs=ctx.frameset;
    fs.check_vdata_integrity();
    window.redraw_ui();
  }), _ESClass.static(function calc_prop_distances(ctx, td, data) {
  }), _ESClass.static(function gen_data(ctx, td, data) {
    var doprop=td.doprop;
    var proprad=td.propradius;
    var vs=new set();
    var __iter_eid=__get_iter(td.top.inputs.data);
    var eid;
    while (1) {
      var __ival_eid=__iter_eid.next();
      if (__ival_eid.done) {
          break;
      }
      eid = __ival_eid.value;
      var v=ctx.frameset.pathspline.eidmap[eid];
      if (v==undefined) {
          console.log("WARNING: transdata corruption in dopesheet!!");
          continuel;
      }
      vs.add(v);
    }
    var __iter_v=__get_iter(vs);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      var titem=new TransDataItem(v, TransDopeSheetType, get_vtime(v));
      data.push(titem);
    }
  }), _ESClass.static(function find_dopesheet(ctx) {
    var active=ctx.screen.active;
    if (__instance_of(active, ScreenArea)&&__instance_of(active.editor, DopeSheetEditor)) {
        return active;
    }
    var __iter_c=__get_iter(ctx.screen.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (__instance_of(c, ScreenArea)&&__instance_of(c.editor, DopeSheetEditor))
        return c;
    }
  }), _ESClass.static(function calc_draw_aabb(ctx, td, minmax) {
  }), _ESClass.static(function aabb(ctx, td, item, minmax, selected_only) {
  }), function TransDopeSheetType() {
  }]);
  _es6_module.add_class(TransDopeSheetType);
  TransDopeSheetType = _es6_module.add_export('TransDopeSheetType', TransDopeSheetType);
}, '/dev/fairmotion/src/editors/dopesheet/dopesheet_transdata.js');
es6_module_define('dopesheet_ops', ["toolprops", "toolops_api", "animdata", "dopesheet_phantom"], function _dopesheet_ops_module(_es6_module) {
  "use strict";
  var CollectionProperty=es6_import_item(_es6_module, 'toolprops', 'CollectionProperty');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var EnumProperty=es6_import_item(_es6_module, 'toolprops', 'EnumProperty');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var TimeDataLayer=es6_import_item(_es6_module, 'animdata', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, 'animdata', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, 'animdata', 'set_vtime');
  var AnimKey=es6_import_item(_es6_module, 'animdata', 'AnimKey');
  var AnimChannel=es6_import_item(_es6_module, 'animdata', 'AnimChannel');
  var AnimKeyFlags=es6_import_item(_es6_module, 'animdata', 'AnimKeyFlags');
  var AnimInterpModes=es6_import_item(_es6_module, 'animdata', 'AnimInterpModes');
  var get_time=es6_import_item(_es6_module, 'dopesheet_phantom', 'get_time');
  var set_time=es6_import_item(_es6_module, 'dopesheet_phantom', 'set_time');
  var get_select=es6_import_item(_es6_module, 'dopesheet_phantom', 'get_select');
  var set_select=es6_import_item(_es6_module, 'dopesheet_phantom', 'set_select');
  var KeyTypes=es6_import_item(_es6_module, 'dopesheet_phantom', 'KeyTypes');
  var FilterModes=es6_import_item(_es6_module, 'dopesheet_phantom', 'FilterModes');
  var delete_key=es6_import_item(_es6_module, 'dopesheet_phantom', 'delete_key');
  var ShiftTimeOp2=_ESClass("ShiftTimeOp2", ToolOp, [function ShiftTimeOp2() {
    ToolOp.call(this);
    var first=true;
    this.start_mpos = new Vector3();
  }, _ESClass.static(function tooldef() {
    return {apiname: "spline.shift_time2", uiname: "Shift Time2", is_modal: true, inputs: {factor: new FloatProperty(-1, "factor", "factor", "factor"), vertex_eids: new CollectionProperty([], undefined, "verts", "verts")}, outputs: {}, icon: -1, description: "Move keyframes around"}
  }), function get_curframe_animverts(ctx) {
    var vset=new set();
    var spline=ctx.frameset.pathspline;
    var __iter_eid=__get_iter(this.inputs.vertex_eids);
    var eid;
    while (1) {
      var __ival_eid=__iter_eid.next();
      if (__ival_eid.done) {
          break;
      }
      eid = __ival_eid.value;
      var v=spline.eidmap[eid];
      if (v==undefined) {
          console.warn("ShiftTimeOp2 data corruption! v was undefined!");
          continue;
      }
      vset.add(v);
    }
    return vset;
  }, function start_modal(ctx) {
    this.first = true;
  }, function end_modal(ctx) {
    ToolOp.prototype.end_modal.call(this);
  }, function cancel(ctx) {
  }, function finish(ctx) {
    ctx.scene.change_time(ctx, this.start_time);
  }, function on_mousemove(event) {
    if (this.first) {
        this.start_mpos.load([event.x, event.y, 0]);
        this.first = false;
    }
    var mpos=new Vector3([event.x, event.y, 0]);
    var dx=-Math.floor(1.5*(this.start_mpos[0]-mpos[0])/20+0.5);
    this.undo(this.modal_ctx);
    this.inputs.factor.set_data(dx);
    this.exec(this.modal_ctx);
  }, function on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Escape"]:
        this.cancel(this.modal_ctx);
      case charmap["Return"]:
      case charmap["Space"]:
        this.finish(this.modal_ctx);
        this.end_modal();
    }
  }, function on_mouseup(event) {
    var ctx=this.modal_ctx;
    this.end_modal();
    ctx.frameset.download();
    window.redraw_viewport();
  }, function undo_pre(ctx) {
    var ud=this._undo = {}
    var __iter_v=__get_iter(this.get_curframe_animverts(ctx));
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      ud[v.eid] = get_vtime(v);
    }
  }, function undo(ctx) {
    var spline=ctx.frameset.pathspline;
    for (var k in this._undo) {
        var v=spline.eidmap[k], time=this._undo[k];
        set_vtime(v, time);
        v.dag_update("depend");
    }
    ctx.frameset.download();
  }, function exec(ctx) {
    var spline=ctx.frameset.pathspline;
    var starts={}
    var off=this.inputs.factor.data;
    var vset=this.get_curframe_animverts(ctx);
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      starts[v.eid] = get_vtime(v);
    }
    var frameset=ctx.frameset;
    var vdmap={}
    for (var k in frameset.vertex_animdata) {
        var vd=frameset.vertex_animdata[k];
        var __iter_v=__get_iter(vd.verts);
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          vdmap[v.eid] = k;
        }
    }
    var kcache=ctx.frameset.kcache;
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      var eid=vdmap[v.eid];
      var time1=get_vtime(v);
      for (var i=0; i<v.segments.length; i++) {
          var s=v.segments[i], v2=s.other_vert(v), time2=get_vtime(v2);
          var t1=Math.min(time1, time2), t2=Math.max(time1, time2);
          for (var j=t1; j<=t2; j++) {
              kcache.invalidate(eid, j);
          }
      }
      set_vtime(v, starts[v.eid]+off);
      kcache.invalidate(eid, starts[v.eid]+off);
      v.dag_update("depend");
    }
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      var min=undefined, max=undefined;
      if (v.segments.length==1) {
          var s=v.segments[0];
          var v2=s.other_vert(v);
          var t1=get_vtime(v), t2=get_vtime(v2);
          if (t1<t2) {
              min = 0, max = t2;
          }
          else 
            if (t1==t2) {
              min = max = t1;
          }
          else {
            min = t1, max = 100000;
          }
      }
      else 
        if (v.segments.length==2) {
          var v1=v.segments[0].other_vert(v);
          var v2=v.segments[1].other_vert(v);
          var t1=get_vtime(v1), t2=get_vtime(v2);
          min = Math.min(t1, t2), max = Math.max(t1, t2);
      }
      else {
        min = 0;
        max = 100000;
      }
      var newtime=get_vtime(v);
      newtime = Math.min(Math.max(newtime, min), max);
      set_vtime(v, newtime);
      v.dag_update("depend");
    }
    if (!this.modal_running) {
        ctx.frameset.download();
    }
  }]);
  _es6_module.add_class(ShiftTimeOp2);
  ShiftTimeOp2 = _es6_module.add_export('ShiftTimeOp2', ShiftTimeOp2);
  var ShiftTimeOp3=_ESClass("ShiftTimeOp3", ToolOp, [function ShiftTimeOp3() {
    ToolOp.call(this);
    var first=true;
    this.start_mpos = new Vector3();
  }, _ESClass.static(function tooldef() {
    return {apiname: "spline.shift_time3", uiname: "Shift Time", is_modal: true, inputs: {factor: new FloatProperty(-1, "factor", "factor", "factor"), phantom_ids: new CollectionProperty([], undefined, "phantom_ids", "phantom_ids")}, outputs: {}, icon: -1, description: "Move keyframes around"}
  }), function start_modal(ctx) {
    this.first = true;
  }, function end_modal(ctx) {
    ToolOp.prototype.end_modal.call(this);
  }, function cancel(ctx) {
  }, function finish(ctx) {
    ctx.scene.change_time(ctx, this.start_time);
  }, function on_mousemove(event) {
    if (this.first) {
        this.start_mpos.load([event.x, event.y, 0]);
        this.first = false;
    }
    var mpos=new Vector3([event.x, event.y, 0]);
    var dx=-Math.floor(1.5*(this.start_mpos[0]-mpos[0])/20+0.5);
    this.do_undo(this.modal_ctx, true);
    this.inputs.factor.set_data(dx);
    this.exec(this.modal_ctx);
  }, function on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Escape"]:
        this.cancel(this.modal_ctx);
      case charmap["Return"]:
      case charmap["Space"]:
        this.finish(this.modal_ctx);
        this.end_modal();
    }
  }, function on_mouseup(event) {
    var ctx=this.modal_ctx;
    this.end_modal();
    ctx.frameset.download();
    window.redraw_viewport();
  }, function undo_pre(ctx) {
    var ud=this._undo = {}
    var __iter_id=__get_iter(this.inputs.phantom_ids.data);
    var id;
    while (1) {
      var __ival_id=__iter_id.next();
      if (__ival_id.done) {
          break;
      }
      id = __ival_id.value;
      ud[id] = get_time(ctx, id);
    }
  }, function do_undo(ctx, no_download) {
    if (no_download==undefined) {
        no_download = false;
    }
    for (var k in this._undo) {
        set_time(ctx, k, this._undo[k]);
    }
    if (!no_download)
      ctx.frameset.download();
  }, function undo(ctx) {
    this.do_undo(ctx);
  }, function exec(ctx) {
    var spline=ctx.frameset.pathspline;
    var starts={}
    var off=this.inputs.factor.data;
    var ids=this.inputs.phantom_ids.data;
    var __iter_id=__get_iter(ids);
    var id;
    while (1) {
      var __ival_id=__iter_id.next();
      if (__ival_id.done) {
          break;
      }
      id = __ival_id.value;
      starts[id] = get_time(ctx, id);
    }
    var frameset=ctx.frameset;
    var vdmap={}
    for (var k in frameset.vertex_animdata) {
        var vd=frameset.vertex_animdata[k];
        var __iter_v=__get_iter(vd.verts);
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          vdmap[v.eid] = k;
        }
    }
    var kcache=ctx.frameset.kcache;
    var __iter_id=__get_iter(ids);
    var id;
    while (1) {
      var __ival_id=__iter_id.next();
      if (__ival_id.done) {
          break;
      }
      id = __ival_id.value;
      set_time(ctx, id, starts[id]+off);
    }
    var __iter_id=__get_iter(ids);
    var id;
    while (1) {
      var __ival_id=__iter_id.next();
      if (__ival_id.done) {
          break;
      }
      id = __ival_id.value;
      var min=undefined, max=undefined;
      if (id&KeyTypes.PATHSPLINE) {
          var v=ctx.frameset.pathspline.eidmap[id&KeyTypes.CLEARMASK];
          if (v.segments.length==1) {
              var s=v.segments[0];
              var v2=s.other_vert(v);
              var t1=get_vtime(v), t2=get_vtime(v2);
              if (t1<t2) {
                  min = 0, max = t2;
              }
              else 
                if (t1==t2) {
                  min = max = t1;
              }
              else {
                min = t1, max = 100000;
              }
          }
          else 
            if (v.segments.length==2) {
              var v1=v.segments[0].other_vert(v);
              var v2=v.segments[1].other_vert(v);
              var t1=get_vtime(v1), t2=get_vtime(v2);
              min = Math.min(t1, t2), max = Math.max(t1, t2);
          }
          else {
            min = 0;
            max = 100000;
          }
          var eid=vdmap[v.eid];
          for (var j=min; j<max; j++) {

          }
          var newtime=get_vtime(v);
          newtime = Math.min(Math.max(newtime, min), max);
          set_vtime(v, newtime);
          v.dag_update("depend");
      }
    }
    if (!this.modal_running) {
        console.log("download");
        ctx.frameset.download();
    }
  }]);
  _es6_module.add_class(ShiftTimeOp3);
  ShiftTimeOp3 = _es6_module.add_export('ShiftTimeOp3', ShiftTimeOp3);
  var SelectOpBase=_ESClass("SelectOpBase", ToolOp, [function SelectOpBase() {
    ToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {inputs: {phantom_ids: new CollectionProperty([], undefined, "phantom_ids", "phantom_ids")}, outputs: {}}
  }), function undo_pre(ctx) {
    var undo=this._undo = {}
    var __iter_id=__get_iter(this.inputs.phantom_ids.data);
    var id;
    while (1) {
      var __ival_id=__iter_id.next();
      if (__ival_id.done) {
          break;
      }
      id = __ival_id.value;
      undo[id] = get_select(ctx, id);
    }
  }, function undo(ctx) {
    var undo=this._undo;
    for (var id in undo) {
        set_select(ctx, id, undo[id]);
    }
  }]);
  _es6_module.add_class(SelectOpBase);
  SelectOpBase = _es6_module.add_export('SelectOpBase', SelectOpBase);
  var SelectOp=_ESClass("SelectOp", SelectOpBase, [function SelectOp() {
    SelectOpBase.call(this);
    this.uiname = "Select";
  }, _ESClass.static(function tooldef() {
    return {apiname: "spline.select_keyframe", uiname: "Select Keyframe", is_modal: false, inputs: ToolOp.inherit({select_ids: new CollectionProperty([], undefined, "select_ids", "select_ids"), state: new BoolProperty(true, "state"), unique: new BoolProperty(true, "unique")}), outputs: {}, icon: -1, description: "Select keyframes"}
  }), function exec(ctx) {
    var state=this.inputs.state.data;
    if (this.inputs.unique.data) {
        var __iter_id=__get_iter(this.inputs.phantom_ids.data);
        var id;
        while (1) {
          var __ival_id=__iter_id.next();
          if (__ival_id.done) {
              break;
          }
          id = __ival_id.value;
          set_select(ctx, id, false);
        }
    }
    var __iter_id=__get_iter(this.inputs.select_ids.data);
    var id;
    while (1) {
      var __ival_id=__iter_id.next();
      if (__ival_id.done) {
          break;
      }
      id = __ival_id.value;
      set_select(ctx, id, state);
    }
  }]);
  _es6_module.add_class(SelectOp);
  SelectOp = _es6_module.add_export('SelectOp', SelectOp);
  var ColumnSelect=_ESClass("ColumnSelect", SelectOpBase, [function ColumnSelect() {
    SelectOpBase.call(this);
  }, _ESClass.static(function tooldef() {
    return {apiname: "spline.select_keyframe_column", uiname: "Column Select", is_modal: false, inputs: ToolOp.inherit({state: new BoolProperty(true, "state"), phantom_ids: new CollectionProperty([], undefined, "phantom_ids", "phantom_ids")}), outputs: {}, icon: -1, description: "Select keyframes in a single column"}
  }), function exec(ctx) {
    var cols={}
    var state=this.inputs.state.data;
    var __iter_id=__get_iter(this.inputs.phantom_ids.data);
    var id;
    while (1) {
      var __ival_id=__iter_id.next();
      if (__ival_id.done) {
          break;
      }
      id = __ival_id.value;
      if (get_select(ctx, id))
        cols[get_time(ctx, id)] = 1;
    }
    var __iter_id=__get_iter(this.inputs.phantom_ids.data);
    var id;
    while (1) {
      var __ival_id=__iter_id.next();
      if (__ival_id.done) {
          break;
      }
      id = __ival_id.value;
      if (!(get_time(ctx, id) in cols))
        continue;
      set_select(ctx, id, state);
    }
  }]);
  _es6_module.add_class(ColumnSelect);
  ColumnSelect = _es6_module.add_export('ColumnSelect', ColumnSelect);
  var SelectKeysToSide=_ESClass("SelectKeysToSide", SelectOpBase, [function SelectKeysToSide() {
    SelectOpBase.call(this);
  }, _ESClass.static(function tooldef() {
    return {apiname: "spline.select_keys_to_side", uiname: "Select Keys To Side", is_modal: false, inputs: ToolOp.inherit({state: new BoolProperty(true, "state"), phantom_ids: new CollectionProperty([], undefined, "phantom_ids", "phantom_ids"), side: new BoolProperty(true, "side")}), outputs: {}, icon: -1, description: "Select keyframes before or after the cursor"}
  }), function exec(ctx) {
    var state=this.inputs.state.data;
    var mintime=1e+17, maxtime=-1e+17;
    var __iter_id=__get_iter(this.inputs.phantom_ids.data);
    var id;
    while (1) {
      var __ival_id=__iter_id.next();
      if (__ival_id.done) {
          break;
      }
      id = __ival_id.value;
      if (!get_select(ctx, id))
        continue;
      var time=get_time(ctx, id);
      mintime = Math.min(mintime, time);
      maxtime = Math.max(maxtime, time);
    }
    if (mintime==1e+17) {
        mintime = maxtime = ctx.scene.time;
    }
    var side=this.inputs.side.data;
    var __iter_id=__get_iter(this.inputs.phantom_ids.data);
    var id;
    while (1) {
      var __ival_id=__iter_id.next();
      if (__ival_id.done) {
          break;
      }
      id = __ival_id.value;
      var time=get_time(ctx, id);
      if ((side&&time<maxtime)||(!side&&time>mintime))
        continue;
      set_select(ctx, id, state);
    }
  }]);
  _es6_module.add_class(SelectKeysToSide);
  SelectKeysToSide = _es6_module.add_export('SelectKeysToSide', SelectKeysToSide);
  var mode_vals=["select", "deselect", "auto"];
  mode_vals = _es6_module.add_export('mode_vals', mode_vals);
  var ToggleSelectOp=_ESClass("ToggleSelectOp", SelectOpBase, [function ToggleSelectOp(mode) {
    if (mode==undefined) {
        mode = "auto";
    }
    SelectOpBase.call(this);
    this.inputs.mode.set_data(mode);
  }, _ESClass.static(function tooldef() {
    return {apiname: "spline.toggle_select_keys", uiname: "Select Keyframe Selection", is_modal: false, inputs: ToolOp.inherit({phantom_ids: new CollectionProperty([], undefined, "phantom_ids", "phantom ids"), mode: new EnumProperty("auto", mode_vals, "mode", "Mode", "mode")}), outputs: {}, icon: -1, description: "Select all keyframes, or deselect them if already selected"}
  }), function exec(ctx) {
    var mode=this.inputs.mode.data;
    if (mode=="auto") {
        mode = "select";
        var __iter_id=__get_iter(this.inputs.phantom_ids.data);
        var id;
        while (1) {
          var __ival_id=__iter_id.next();
          if (__ival_id.done) {
              break;
          }
          id = __ival_id.value;
          if (get_select(ctx, id))
            mode = "deselect";
        }
    }
    mode = mode=="select" ? true : false;
    var __iter_id=__get_iter(this.inputs.phantom_ids.data);
    var id;
    while (1) {
      var __ival_id=__iter_id.next();
      if (__ival_id.done) {
          break;
      }
      id = __ival_id.value;
      set_select(ctx, id, mode);
    }
  }]);
  _es6_module.add_class(ToggleSelectOp);
  ToggleSelectOp = _es6_module.add_export('ToggleSelectOp', ToggleSelectOp);
  var DeleteKeyOp=_ESClass("DeleteKeyOp", ToolOp, [function DeleteKeyOp() {
    ToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {apiname: "spline.delete_key", uiname: "Delete Keyframe", is_modal: false, inputs: {phantom_ids: new CollectionProperty([], undefined, "phantom_ids", "phantom ids")}, outputs: {}, icon: -1, description: "Delete a keyframe"}
  }), function exec(ctx) {
    var __iter_id=__get_iter(this.inputs.phantom_ids.data);
    var id;
    while (1) {
      var __ival_id=__iter_id.next();
      if (__ival_id.done) {
          break;
      }
      id = __ival_id.value;
      if (get_select(ctx, id)) {
          delete_key(ctx, id);
      }
    }
  }]);
  _es6_module.add_class(DeleteKeyOp);
  DeleteKeyOp = _es6_module.add_export('DeleteKeyOp', DeleteKeyOp);
  
}, '/dev/fairmotion/src/editors/dopesheet/dopesheet_ops.js');
es6_module_define('editcurve_ops', [], function _editcurve_ops_module(_es6_module) {
}, '/dev/fairmotion/src/editors/curve/editcurve_ops.js');
es6_module_define('editcurve_util', [], function _editcurve_util_module(_es6_module) {
}, '/dev/fairmotion/src/editors/curve/editcurve_util.js');
es6_module_define('CurveEditor', ["spline_editops", "UIWidgets_special", "UITabPanel", "UIElement", "struct", "UIPack", "../../ui/UISplitFrame", "spline_base", "animdata", "mathlib", "UIFrame", "UITextBox", "UISplitFrame", "spline_element_array", "spline_layerops", "events", "UIWidgets", "toolops_api", "dopesheet_ops", "../dopesheet/DopeSheetEditor", "spline", "spline_types", "ScreenArea", "dopesheet_phantom"], function _CurveEditor_module(_es6_module) {
  "use strict";
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var gen_editor_switcher=es6_import_item(_es6_module, 'UIWidgets_special', 'gen_editor_switcher');
  var KeyMap=es6_import_item(_es6_module, 'events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, 'events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, 'events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, 'events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, 'events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, 'events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, 'events', 'EventHandler');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var phantom=es6_import_item(_es6_module, 'dopesheet_phantom', 'phantom');
  var KeyTypes=es6_import_item(_es6_module, 'dopesheet_phantom', 'KeyTypes');
  var FilterModes=es6_import_item(_es6_module, 'dopesheet_phantom', 'FilterModes');
  var get_select=es6_import_item(_es6_module, 'dopesheet_phantom', 'get_select');
  var get_time=es6_import_item(_es6_module, 'dopesheet_phantom', 'get_time');
  var set_select=es6_import_item(_es6_module, 'dopesheet_phantom', 'set_select');
  var set_time=es6_import_item(_es6_module, 'dopesheet_phantom', 'set_time');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var UIButtonAbstract=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonAbstract');
  var UIButton=es6_import_item(_es6_module, 'UIWidgets', 'UIButton');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UIMenuButton=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuButton');
  var UICheckBox=es6_import_item(_es6_module, 'UIWidgets', 'UICheckBox');
  var UINumBox=es6_import_item(_es6_module, 'UIWidgets', 'UINumBox');
  var UILabel=es6_import_item(_es6_module, 'UIWidgets', 'UILabel');
  var UIMenuLabel=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuLabel');
  var ScrollButton=es6_import_item(_es6_module, 'UIWidgets', 'ScrollButton');
  var UIVScroll=es6_import_item(_es6_module, 'UIWidgets', 'UIVScroll');
  var UIIconCheck=es6_import_item(_es6_module, 'UIWidgets', 'UIIconCheck');
  var UISplitFrame=es6_import_item(_es6_module, 'UISplitFrame', 'UISplitFrame');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var UIPackFrame=es6_import_item(_es6_module, 'UIPack', 'UIPackFrame');
  var UITextBox=es6_import_item(_es6_module, 'UITextBox', 'UITextBox');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var UITabBar=es6_import_item(_es6_module, 'UITabPanel', 'UITabBar');
  var UICollapseIcon=es6_import_item(_es6_module, 'UIWidgets_special', 'UICollapseIcon');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var Spline=es6_import_item(_es6_module, 'spline', 'Spline');
  var RestrictFlags=es6_import_item(_es6_module, 'spline', 'RestrictFlags');
  var CustomDataLayer=es6_import_item(_es6_module, 'spline_types', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineSegment=es6_import_item(_es6_module, 'spline_types', 'SplineSegment');
  var TimeDataLayer=es6_import_item(_es6_module, 'animdata', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, 'animdata', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, 'animdata', 'set_vtime');
  var AnimKey=es6_import_item(_es6_module, 'animdata', 'AnimKey');
  var AnimChannel=es6_import_item(_es6_module, 'animdata', 'AnimChannel');
  var AnimKeyFlags=es6_import_item(_es6_module, 'animdata', 'AnimKeyFlags');
  var AnimInterpModes=es6_import_item(_es6_module, 'animdata', 'AnimInterpModes');
  var SplineLayerFlags=es6_import_item(_es6_module, 'spline_element_array', 'SplineLayerFlags');
  var SplineLayerSet=es6_import_item(_es6_module, 'spline_element_array', 'SplineLayerSet');
  var SplineFlags=es6_import_item(_es6_module, 'spline_base', 'SplineFlags');
  var AddLayerOp=es6_import_item(_es6_module, 'spline_layerops', 'AddLayerOp');
  var ChangeLayerOp=es6_import_item(_es6_module, 'spline_layerops', 'ChangeLayerOp');
  var ChangeElementLayerOp=es6_import_item(_es6_module, 'spline_layerops', 'ChangeElementLayerOp');
  var DissolveVertOp=es6_import_item(_es6_module, 'spline_editops', 'DissolveVertOp');
  var ShiftTimeOp2=es6_import_item(_es6_module, 'dopesheet_ops', 'ShiftTimeOp2');
  var ShiftTimeOp3=es6_import_item(_es6_module, 'dopesheet_ops', 'ShiftTimeOp3');
  var SelectOp=es6_import_item(_es6_module, 'dopesheet_ops', 'SelectOp');
  var DeleteKeyOp=es6_import_item(_es6_module, 'dopesheet_ops', 'DeleteKeyOp');
  var ColumnSelect=es6_import_item(_es6_module, 'dopesheet_ops', 'ColumnSelect');
  var SelectKeysToSide=es6_import_item(_es6_module, 'dopesheet_ops', 'SelectKeysToSide');
  var ToggleSelectOp=es6_import_item(_es6_module, 'dopesheet_ops', 'ToggleSelectOp');
  var Area=es6_import_item(_es6_module, 'ScreenArea', 'Area');
  var UISplitFrame=es6_import_item(_es6_module, '../../ui/UISplitFrame', 'UISplitFrame');
  var TreePanel=es6_import_item(_es6_module, '../dopesheet/DopeSheetEditor', 'TreePanel');
  var CurveEditor=_ESClass("CurveEditor", Area, [function CurveEditor(pos, size) {
    Area.call(this, CurveEditor.name, CurveEditor.uiname, new Context(), pos, size);
    this.pinned_ids = undefined;
  }, function build_layout() {
    build_layout();
    this.channels = new TreePanel();
    this.channels.size[0] = 100;
    this.channels.size[1] = 600;
    Area.prototype.build_layout.call(this, false, true);
    this.middlesplit.horizontal = true;
    let sidebar=this.middlesplit.initial();
    sidebar.state|=UIFlags.BG_EVENTS_TRANSPARENT;
    this.middlesplit.split(145, false, false, true).state|=UIFlags.BG_EVENTS_TRANSPARENT;
    sidebar.draw_background = false;
    sidebar.add(this.channels);
  }, function build_bottombar(the_row) {
    var ctx=new Context();
    this.ctx = ctx;
    the_row.packflag|=PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT;
    the_row.default_packflag = PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
    the_row.draw_background = true;
    the_row.rcorner = 100.0;
    the_row.pos = [0, 2];
    the_row.size = [this.size[0], Area.get_barhgt()];
    var col=the_row.col();
    col.add(gen_editor_switcher(this.ctx, this));
    col.prop("editcurve.selected_only");
    col.prop("editcurve.pinned");
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new CurveEditor();
    reader(ret);
    if (ret.pan!=undefined) {
        ret.velpan.pan[0] = ret.pan[0];
        ret.velpan.pan[1] = ret.pan[1];
        delete ret.pan;
    }
    if (ret.pinned_ids!=undefined&&ret.pinned_ids.length==0) {
        delete ret.pinned_ids;
    }
    return ret;
  })]);
  _es6_module.add_class(CurveEditor);
  CurveEditor = _es6_module.add_export('CurveEditor', CurveEditor);
  CurveEditor.STRUCT = STRUCT.inherit(CurveEditor, Area)+"\n    pan             : vec2 | obj.velpan.pan;\n    zoom            : float;\n    selected_only   : int;\n    pinned_ids     : array(int) | obj.pinned_ids != undefined ? obj.pinned_ids : [];\n}\n";
  CurveEditor.uiname = "Curve Editor";
}, '/dev/fairmotion/src/editors/curve/CurveEditor.js');
es6_module_define('notifications', ["UITextBox", "UIFrame", "UIWidgets_special", "UITabPanel", "ScreenArea", "UIWidgets", "UIPack", "toolops_api", "UIElement"], function _notifications_module(_es6_module) {
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var UIButtonAbstract=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonAbstract');
  var UIButton=es6_import_item(_es6_module, 'UIWidgets', 'UIButton');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UIMenuButton=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuButton');
  var UICheckBox=es6_import_item(_es6_module, 'UIWidgets', 'UICheckBox');
  var UINumBox=es6_import_item(_es6_module, 'UIWidgets', 'UINumBox');
  var UILabel=es6_import_item(_es6_module, 'UIWidgets', 'UILabel');
  var UIMenuLabel=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuLabel');
  var ScrollButton=es6_import_item(_es6_module, 'UIWidgets', 'ScrollButton');
  var UIVScroll=es6_import_item(_es6_module, 'UIWidgets', 'UIVScroll');
  var UIIconCheck=es6_import_item(_es6_module, 'UIWidgets', 'UIIconCheck');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var UIPackFrame=es6_import_item(_es6_module, 'UIPack', 'UIPackFrame');
  var UITextBox=es6_import_item(_es6_module, 'UITextBox', 'UITextBox');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var UITabBar=es6_import_item(_es6_module, 'UITabPanel', 'UITabBar');
  var UICollapseIcon=es6_import_item(_es6_module, 'UIWidgets_special', 'UICollapseIcon');
  var UIPanel=es6_import_item(_es6_module, 'UIWidgets_special', 'UIPanel');
  var UIColorField=es6_import_item(_es6_module, 'UIWidgets_special', 'UIColorField');
  var UIColorBox=es6_import_item(_es6_module, 'UIWidgets_special', 'UIColorBox');
  var UIColorPicker=es6_import_item(_es6_module, 'UIWidgets_special', 'UIColorPicker');
  var UIProgressBar=es6_import_item(_es6_module, 'UIWidgets_special', 'UIProgressBar');
  var UIListBox=es6_import_item(_es6_module, 'UIWidgets_special', 'UIListBox');
  var UIListEntry=es6_import_item(_es6_module, 'UIWidgets_special', 'UIListEntry');
  var ScreenArea, Area;
  var _id_note_gen=1;
  var Notification=_ESClass("Notification", [function Notification(apiname, uiname, description) {
    this._id = _id_note_gen++;
    this.name = apiname;
    this.uiname = uiname;
    this.description = description;
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    return ""+this._id;
  }), function gen_uielement(ctx) {
  }, function on_remove() {
  }]);
  _es6_module.add_class(Notification);
  Notification = _es6_module.add_export('Notification', Notification);
  var LabelNote=_ESClass("LabelNote", Notification, [function LabelNote(label, description, life_ms) {
    if (description==undefined) {
        description = "";
    }
    if (life_ms==undefined) {
        life_ms = 3000;
    }
    Notification.call(this, "label", "Label", description);
    this.life_ms = life_ms;
    this.last_ms = time_ms();
    this.label = label;
  }, _ESClass.get(function defunct() {
    return time_ms()-this.last_ms>=this.life_ms;
  }), function gen_uielement(ctx) {
    return new UILabel(ctx, this.label);
  }]);
  _es6_module.add_class(LabelNote);
  LabelNote = _es6_module.add_export('LabelNote', LabelNote);
  var ProgressNote=_ESClass("ProgressNote", Notification, [function ProgressNote(label, id, description, callback, progress) {
    if (description==undefined) {
        description = "";
    }
    if (callback==undefined) {
        callback = undefined;
    }
    if (progress==undefined) {
        progress = 0.0;
    }
    Notification.call(this, "progress", "Progress Bar", description);
    if (callback==undefined)
      callback = function() {
    }
    this.do_end = false;
    this.id = id;
    this.label = label;
    this.progress = progress;
    this.callback = callback;
  }, _ESClass.get(function defunct() {
    return this.progress>=1.0||this.do_end;
  }), function end() {
    this.do_end = true;
  }, function update_uielement(element) {
    var bar=element.children[1];
    bar.set_value(this.progress);
  }, function gen_uielement(ctx) {
    var c=new UIProgressBar(ctx);
    c.min_wid = 100;
    c.min_hgt = 15;
    c.set_value(this.progress);
    var r=new ColumnFrame(ctx);
    r.pad[1] = 0;
    r.packflag|=PackFlags.NO_AUTO_SPACING;
    r.label(this.label);
    r.add(c);
    return r;
  }, _ESClass.set(function value(value) {
    if (value!=this.progress)
      this.set_value(value);
  }), _ESClass.get(function value() {
    return this.progress;
  }), function set_value(value) {
    this.progress = value;
    this.callback(this);
  }]);
  _es6_module.add_class(ProgressNote);
  ProgressNote = _es6_module.add_export('ProgressNote', ProgressNote);
  var NotificationManager=_ESClass("NotificationManager", [function NotificationManager() {
    this.notes = new GArray();
    this.progbars = {}
    this.emap = {}
    this.cached_dellist = new Array();
  }, function add(note) {
    this.notes.push(note);
    if (__instance_of(note, ProgressNote)) {
        this.progbars[note.id] = note;
    }
    this.emap[note._id] = new GArray;
  }, function remove(note) {
    this.notes.remove(note);
    if (__instance_of(note, ProgressNote)) {
        delete this.progbars[note.id];
    }
    var __iter_e=__get_iter(this.emap[note._id]);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      if (__instance_of(e.parent, NoteContainer)) {
          e.parent.parent.do_full_recalc();
          e.parent.parent.remove(e);
      }
      else {
        e.parent.do_full_recalc();
        e.parent.remove(e);
      }
    }
    delete this.emap[note._id];
    note.on_remove();
  }, function ensure_uielement(note) {
    var __iter_e=__get_iter(list(this.emap[note._id]));
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      if (e.defunct)
        this.emap[note._id].remove(e);
    }
    if (this.emap[note._id].length==0) {
        var __iter_c=__get_iter(g_app_state.screen.children);
        var c;
        while (1) {
          var __ival_c=__iter_c.next();
          if (__ival_c.done) {
              break;
          }
          c = __ival_c.value;
          if (!(__instance_of(c, ScreenArea)))
            continue;
          if (c.area.note_area==undefined)
            continue;
          var area=c.area.note_area;
          var c2=note.gen_uielement(c.ctx);
          area.add(c2, undefined, note);
          this.emap[note._id].push(c2);
        }
    }
  }, function label(label, description) {
    var n=new LabelNote(label, description);
    this.add(n);
    this.ensure_uielement(n);
    return n;
  }, function progbar(label, progress, id, description) {
    if (id==undefined) {
        id = label;
    }
    if (description==undefined) {
        description = "";
    }
    var this2=this;
    function callback(note) {
      if (!(note._id in this2.emap))
        return ;
      var __iter_e=__get_iter(this2.emap[note._id]);
      var e;
      while (1) {
        var __ival_e=__iter_e.next();
        if (__ival_e.done) {
            break;
        }
        e = __ival_e.value;
        note.update_uielement(e);
      }
    }
    var progbar=new ProgressNote(label, id, description, callback, progress);
    this.add(progbar);
    this.ensure_uielement(progbar);
    return progbar;
  }, function on_tick() {
    var dellist=this.cached_dellist;
    dellist.length = 0;
    var __iter_n=__get_iter(this.notes);
    var n;
    while (1) {
      var __ival_n=__iter_n.next();
      if (__ival_n.done) {
          break;
      }
      n = __ival_n.value;
      if (n.defunct)
        dellist.push(n);
    }
    for (var i=0; i<dellist.length; i++) {
        this.remove(dellist[i]);
    }
  }]);
  _es6_module.add_class(NotificationManager);
  NotificationManager = _es6_module.add_export('NotificationManager', NotificationManager);
  var NoteContainer=_ESClass("NoteContainer", UIFrame, [function NoteContainer(ctx, child, note) {
    UIFrame.call(this, ctx);
    this.note = note;
    this.xbut = new UIButtonIcon(this.ctx, "", Icons.TINY_X);
    this.xbut.bgmode = "flat";
    var this2=this;
    this.xbut.callback = function() {
      g_app_state.notes.remove(this2.note);
    }
    this.add(child);
    this.add(this.xbut);
    this.margin = 2;
    this.child = child;
    this.iconwid = 10;
    this.xwid = 13;
  }, function pack(canvas, isVertical) {
    var size=this.child.get_min_size(canvas, isVertical);
    var margin=this.margin;
    this.child.pos[0] = this.margin+this.iconwid;
    this.child.pos[1] = Math.abs(this.size[1]-size[1])*0.5+this.margin;
    this.child.size[0] = size[0];
    this.child.size[1] = size[1];
    this.xbut.pos[0] = this.child.pos[0]+this.child.size[0];
    this.xbut.pos[1] = this.margin;
    this.xbut.size[0] = this.xbut.size[1] = this.xwid;
    this.state|=UIFlags.NO_FRAME_CACHE;
  }, function get_min_size(canvas, isVertical) {
    var s=this.child.get_min_size(canvas, isVertical);
    return [s[0]+this.margin*2+this.iconwid+this.xwid, s[1]+this.margin*2];
  }, function build_draw(canvas, isVertical) {
    var y=Math.abs(this.child.size[1]-this.size[1])*0.5;
    canvas.box([0, 0], this.size, uicolors["NoteBox"], 0.5);
    canvas.icon(Icons.NOTE_EXCL, [this.margin+2, this.margin+y], undefined, true);
    UIFrame.prototype.build_draw.call(this, canvas, isVertical);
  }]);
  _es6_module.add_class(NoteContainer);
  NoteContainer = _es6_module.add_export('NoteContainer', NoteContainer);
  var NoteFrame=_ESClass("NoteFrame", ColumnFrame, [function NoteFrame(ctx, notes) {
    ColumnFrame.call(this, ctx);
    this.notes = notes;
    this.packflag|=PackFlags.NO_AUTO_SPACING|PackFlags.INHERIT_HEIGHT;
    this.packflag|=PackFlags.IGNORE_LIMIT|PackFlags.ALIGN_LEFT;
  }, function add(e, packflag, note) {
    var c=new NoteContainer(this.ctx, e, note);
    ColumnFrame.prototype.add.call(this, c, packflag);
  }, function prepend(e, packflag, note) {
    var c=new NoteContainer(this.ctx, e, note);
    ColumnFrame.prototype.prepend.call(this, c, packflag);
  }, function remove(e) {
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      if (c.child==e) {
          ColumnFrame.prototype.remove.call(this, c);
          return ;
      }
    }
  }]);
  _es6_module.add_class(NoteFrame);
  NoteFrame = _es6_module.add_export('NoteFrame', NoteFrame);
  function test_notes() {
    g_app_state.notes.label("yay", "description!");
    g_app_state.notes.progbar("tst", 0.3, "pbar");
    console.log("Notification test");
  }
  var ScreenArea=es6_import_item(_es6_module, 'ScreenArea', 'ScreenArea');
  var Area=es6_import_item(_es6_module, 'ScreenArea', 'Area');
}, '/dev/fairmotion/src/ui/notifications.js');
es6_module_define('manipulator', ["config", "mathlib"], function _manipulator_module(_es6_module) {
  "use strict";
  var dist_to_line_v2=es6_import_item(_es6_module, 'mathlib', 'dist_to_line_v2');
  var config=es6_import(_es6_module, 'config');
  var ManipFlags={}
  ManipFlags = _es6_module.add_export('ManipFlags', ManipFlags);
  var HandleShapes={ARROW: 0, HAMMER: 1, ROTCIRCLE: 2, SIMPLE_CIRCLE: 3, OUTLINE: 4}
  HandleShapes = _es6_module.add_export('HandleShapes', HandleShapes);
  var HandleColors={DEFAULT: [0, 0, 0, 1], HIGHLIGHT: [0.4, 0.4, 0.4, 1], SELECT: [1.0, 0.7, 0.3, 1]}
  HandleColors = _es6_module.add_export('HandleColors', HandleColors);
  var _mh_idgen=1;
  var HandleBase=_ESClass("HandleBase", [function on_click(e, view2d, id) {
  }, function on_active() {
    this.color = HandleColors.HIGHLIGHT;
    this.update();
  }, function on_inactive() {
    this.color = HandleColors.DEFAULT;
    this.update();
  }, function distanceTo(p) {
    throw new Error("unimplemented distanceTo");
  }, function update() {
    throw new Error("unimplemented update");
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    throw new Error("unimplemented keystr");
  }), function get_render_rects(ctx, canvas, g) {
    throw new Error("unimplemented get_render_rects");
  }, function render(canvas, g) {
    throw new Error("unimplemented render");
  }, function HandleBase() {
  }]);
  _es6_module.add_class(HandleBase);
  HandleBase = _es6_module.add_export('HandleBase', HandleBase);
  HandleBase;
  var $min_LEI1_update;
  var $max_tS07_update;
  var ManipHandle=_ESClass("ManipHandle", HandleBase, [function ManipHandle(v1, v2, id, shape, view2d, clr) {
    HandleBase.call(this);
    this.id = id;
    this._hid = _mh_idgen++;
    this.shape = shape;
    this.v1 = v1;
    this.v2 = v2;
    this.transparent = false;
    this.color = clr===undefined ? [0, 0, 0, 1] : clr.slice(0, clr.length);
    this.parent = undefined;
    this.linewidth = 1.5;
    if (this.color.length==3)
      this.color.push(1.0);
    this._min = new Vector2(v1);
    this._max = new Vector2(v2);
    this._redraw_pad = this.linewidth;
  }, function on_click(e, view2d, id) {
  }, function on_active() {
    this.color = HandleColors.HIGHLIGHT;
    this.update();
  }, function on_inactive() {
    this.color = HandleColors.DEFAULT;
    this.update();
  }, function distanceTo(p) {
    return dist_to_line_v2(p, this.v1, this.v2);
  }, function update_aabb() {
    this._min[0] = this.v1[0]+this.parent.co[0];
    this._min[1] = this.v1[1]+this.parent.co[1];
    this._max[0] = this.v2[0]+this.parent.co[0];
    this._max[1] = this.v2[1]+this.parent.co[1];
    var minx=Math.min(this._min[0], this._max[0]);
    var miny=Math.min(this._min[1], this._max[1]);
    var maxx=Math.max(this._min[0], this._max[0]);
    var maxy=Math.max(this._min[1], this._max[1]);
    this._min[0] = minx;
    this._min[1] = miny;
    this._max[0] = maxx;
    this._max[1] = maxy;
  }, function update() {
    var p=this._redraw_pad;
    $min_LEI1_update[0] = this._min[0]-p;
    $min_LEI1_update[1] = this._min[1]-p;
    $max_tS07_update[0] = this._max[0]+p;
    $max_tS07_update[1] = this._max[1]+p;
    window.redraw_viewport($min_LEI1_update, $max_tS07_update);
    this.update_aabb();
    $min_LEI1_update[0] = this._min[0]-p;
    $min_LEI1_update[1] = this._min[1]-p;
    $max_tS07_update[0] = this._max[0]+p;
    $max_tS07_update[1] = this._max[1]+p;
    window.redraw_viewport($min_LEI1_update, $max_tS07_update);
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    return "MH"+this._hid.toString;
  }), function get_render_rects(ctx, canvas, g) {
    let p=this._redraw_pad;
    this.update_aabb();
    let xmin=this._min[0], ymin=this._min[1], xmax=this._max[0], ymax=this._max[1];
    return [[xmin-p, ymin-p, xmax-xmin+2*p, ymax-ymin+2*p]];
  }, function render(canvas, g) {
    let c=this.color;
    let style="rgba("+(~~(c[0]*255))+","+(~~(c[1]*255))+","+(~~(c[2]*255))+","+c[3]+")";
    g.strokeStyle = g.fillStyle = style;
    g.lineWidth = this.linewidth;
    if (this.shape==HandleShapes.ARROW) {
        g.beginPath();
        let dx=this.v2[0]-this.v1[0], dy=this.v2[1]-this.v1[1];
        let dx2=this.v1[1]-this.v2[1], dy2=this.v2[0]-this.v1[0];
        let l=Math.sqrt(dx2*dx2+dy2*dy2);
        if (l==0.0) {
            g.beginPath();
            g.rect(this.v1[0]-5, this.v1[1]-5, 10, 10);
            g.fill();
            return ;
        }
        dx2*=1.5/l;
        dy2*=1.5/l;
        dx*=0.65;
        dy*=0.65;
        let w=3;
        let v1=this.v1, v2=this.v2;
        g.moveTo(v1[0]-dx2, v1[1]-dy2);
        g.lineTo(v1[0]+dx-dx2, v1[1]+dy-dy2);
        g.lineTo(v1[0]+dx-dx2*w, v1[1]+dy-dy2*w);
        g.lineTo(v2[0], v2[1]);
        g.lineTo(v1[0]+dx+dx2*w, v1[1]+dy+dy2*w);
        g.lineTo(v1[0]+dx+dx2, v1[1]+dy+dy2);
        g.lineTo(v1[0]+dx2, v1[1]+dy2);
        g.closePath();
        g.fill();
    }
    else 
      if (this.shape==HandleShapes.OUTLINE) {
        g.beginPath();
        g.moveTo(this.v1[0], this.v1[1]);
        g.lineTo(this.v1[0], this.v2[1]);
        g.lineTo(this.v2[0], this.v2[1]);
        g.lineTo(this.v2[0], this.v1[1]);
        g.closePath();
        g.stroke();
    }
    else {
      g.beginPath();
      g.moveTo(this.v1[0], this.v1[1]);
      g.lineTo(this.v2[0], this.v2[1]);
      g.stroke();
    }
  }]);
  var $min_LEI1_update=new Vector2();
  var $max_tS07_update=new Vector2();
  _es6_module.add_class(ManipHandle);
  ManipHandle = _es6_module.add_export('ManipHandle', ManipHandle);
  var $min__jHk_update;
  var $max_W5hF_update;
  var ManipCircle=_ESClass("ManipCircle", HandleBase, [function ManipCircle(p, r, id, view2d, clr) {
    HandleBase.call(this);
    this.id = id;
    this._hid = _mh_idgen++;
    this.p = new Vector2(p);
    this.r = r;
    this.transparent = false;
    this.color = clr===undefined ? [0, 0, 0, 1] : clr.slice(0, clr.length);
    this.parent = undefined;
    this.linewidth = 1.5;
    if (this.color.length==3)
      this.color.push(1.0);
    this._min = new Vector2();
    this._max = new Vector2();
    this._redraw_pad = this.linewidth;
  }, function on_click(e, view2d, id) {
  }, function on_active() {
    this.color = HandleColors.HIGHLIGHT;
    this.update();
  }, function on_inactive() {
    this.color = HandleColors.DEFAULT;
    this.update();
  }, function distanceTo(p) {
    let dx=this.p[0]-p[0];
    let dy=this.p[1]-p[1];
    let dis=dx*dx+dy*dy;
    dis = dis!=0.0 ? Math.sqrt(dis) : 0.0;
    return Math.abs(dis-this.r);
  }, function update_aabb() {
    this._min[0] = this.parent.co[0]+this.p[0]-Math.sqrt(2)*this.r;
    this._min[1] = this.parent.co[1]+this.p[1]-Math.sqrt(2)*this.r;
    this._max[0] = this.parent.co[0]+this.p[0]+Math.sqrt(2)*this.r;
    this._max[1] = this.parent.co[1]+this.p[1]+Math.sqrt(2)*this.r;
  }, function update() {
    var p=this._redraw_pad;
    $min__jHk_update[0] = this._min[0]-p;
    $min__jHk_update[1] = this._min[1]-p;
    $max_W5hF_update[0] = this._max[0]+p;
    $max_W5hF_update[1] = this._max[1]+p;
    window.redraw_viewport($min__jHk_update, $max_W5hF_update);
    this.update_aabb();
    $min__jHk_update[0] = this._min[0]-p;
    $min__jHk_update[1] = this._min[1]-p;
    $max_W5hF_update[0] = this._max[0]+p;
    $max_W5hF_update[1] = this._max[1]+p;
    window.redraw_viewport($min__jHk_update, $max_W5hF_update);
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    return "MC"+this._hid.toString;
  }), function get_render_rects(ctx, canvas, g) {
    let p=this._redraw_pad;
    this.update_aabb();
    let xmin=this._min[0], ymin=this._min[1], xmax=this._max[0], ymax=this._max[1];
    return [[xmin-p, ymin-p, xmax-xmin+2*p, ymax-ymin+2*p]];
  }, function render(canvas, g) {
    let c=this.color;
    let style="rgba("+(~~(c[0]*255))+","+(~~(c[1]*255))+","+(~~(c[2]*255))+","+c[3]+")";
    g.strokeStyle = g.fillStyle = style;
    g.lineWidth = this.linewidth;
    g.beginPath();
    g.arc(this.p[0], this.p[1], this.r, -Math.PI, Math.PI);
    g.closePath();
    g.stroke();
  }]);
  var $min__jHk_update=new Vector2();
  var $max_W5hF_update=new Vector2();
  _es6_module.add_class(ManipCircle);
  ManipCircle = _es6_module.add_export('ManipCircle', ManipCircle);
  var _mh_idgen_2=1;
  var _mp_first=true;
  var Manipulator=_ESClass("Manipulator", [function Manipulator(handles) {
    this._hid = _mh_idgen_2++;
    this.handles = handles.slice(0, handles.length);
    this.recalc = 1;
    this.parent = undefined;
    this.user_data = undefined;
    var __iter_h=__get_iter(this.handles);
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
      h.parent = this;
    }
    this.handle_size = 65;
    this.co = new Vector3();
    this.hidden = false;
  }, function hide() {
    if (!this.hidden) {
        this.update();
    }
    this.hidden = true;
  }, function unhide() {
    if (this.hidden) {
        this.hidden = false;
        this.update();
    }
    else {
      this.hidden = false;
    }
  }, function update() {
    if (this.hidden)
      return ;
    var __iter_h=__get_iter(this.handles);
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
      h.update();
    }
  }, function on_tick(ctx) {
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    return "MP"+this._hid.toString;
  }), function end() {
    this.parent.remove(this);
  }, function get_render_rects(ctx, canvas, g) {
    var rects=[];
    if (this.hidden) {
        return rects;
    }
    var __iter_h=__get_iter(this.handles);
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
      var rs=h.get_render_rects(ctx, canvas, g);
      for (var i=0; i<rs.length; i++) {
          rs[i] = rs[i].slice(0, rs[i].length);
          rs[i][0]+=this.co[0];
          rs[i][1]+=this.co[1];
      }
      rects = rects.concat(rs);
    }
    return rects;
  }, function render(canvas, g) {
    if (this.hidden) {
        return ;
    }
    var __iter_h=__get_iter(this.handles);
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
      var x=this.co[0], y=this.co[1];
      g._render_mat.translate(x, y);
      h.render(canvas, g);
      g._render_mat.translate(-x, -y);
    }
  }, function outline(min, max, id, clr) {
    if (clr==undefined) {
        clr = [0, 0, 0, 1.0];
    }
    min = new Vector2(min);
    max = new Vector2(max);
    var h=new ManipHandle(min, max, id, HandleShapes.OUTLINE, this.view3d, clr);
    h.transparent = true;
    h.parent = this;
    this.handles.push(h);
    return h;
  }, function arrow(v1, v2, id, clr) {
    if (clr==undefined) {
        clr = [0, 0, 0, 1.0];
    }
    v1 = new Vector2(v1);
    v2 = new Vector2(v2);
    var h=new ManipHandle(v1, v2, id, HandleShapes.ARROW, this.view3d, clr);
    h.parent = this;
    this.handles.push(h);
    return h;
  }, function circle(p, r, id, clr) {
    if (clr==undefined) {
        clr = [0, 0, 0, 1.0];
    }
    let h=new ManipCircle(new Vector2(p), r, id, this.view3d, clr);
    h.parent = this;
    this.handles.push(h);
    return h;
  }, function findnearest(e) {
    let limit=config.MANIPULATOR_MOUSEOVER_LIMIT;
    let h=this.handles[0];
    let mpos=[e.x-this.co[0], e.y-this.co[1]];
    let mindis=undefined, minh=undefined;
    var __iter_h_0=__get_iter(this.handles);
    var h_0;
    while (1) {
      var __ival_h_0=__iter_h_0.next();
      if (__ival_h_0.done) {
          break;
      }
      h_0 = __ival_h_0.value;
      if (h_0.transparent)
        continue;
      let dis=h_0.distanceTo(mpos);
      if (dis<limit&&(mindis===undefined||dis<mindis)) {
          mindis = dis;
          minh = h_0;
      }
    }
    return minh;
  }, function on_mousemove(e, view2d) {
    let h=this.findnearest(e);
    if (h!==this.active) {
        if (this.active!==undefined) {
            this.active.on_inactive();
        }
        this.active = h;
        if (h!==undefined) {
            h.on_active();
        }
    }
    return false;
  }, function on_click(event, view2d) {
    return this.active!=undefined ? this.active.on_click(event, view2d, this.active.id) : undefined;
  }]);
  _es6_module.add_class(Manipulator);
  Manipulator = _es6_module.add_export('Manipulator', Manipulator);
  var $nil_FmfQ_get_render_rects;
  var ManipulatorManager=_ESClass("ManipulatorManager", [function ManipulatorManager(view2d) {
    this.view2d = view2d;
    this.stack = [];
    this.active = undefined;
  }, function render(canvas, g) {
    if (this.active!=undefined) {
        this.active.render(canvas, g);
    }
  }, function get_render_rects(ctx, canvas, g) {
    if (this.active!=undefined) {
        return this.active.get_render_rects(ctx, canvas, g);
    }
    else {
      return $nil_FmfQ_get_render_rects;
    }
  }, function remove(mn) {
    if (mn==this.active) {
        this.pop();
    }
    else {
      this.stack.remove(mn);
    }
  }, function push(mn) {
    mn.parent = this;
    this.stack.push(this.active);
    this.active = mn;
  }, function ensure_not_toolop(ctx, cls) {
    if (this.active!=undefined&&this.active.toolop_class===cls) {
        this.remove(this.active);
    }
  }, function ensure_toolop(ctx, cls) {
    if (this.active!=undefined&&this.active.toolop_class===cls) {
        return this.active;
    }
    if (this.active!=undefined) {
        this.remove(this.active);
    }
    this.active = cls.create_widgets(this, ctx);
    this.active.toolop_class = cls;
  }, function pop() {
    var ret=this.active;
    this.active = this.stack.pop(-1);
  }, function on_mousemove(event, view2d) {
    return this.active!=undefined ? this.active.on_mousemove(event, view2d) : undefined;
  }, function on_click(event, view2d) {
    return this.active!=undefined ? this.active.on_click(event, view2d) : undefined;
  }, function active_toolop() {
    if (this.active==undefined)
      return undefined;
    return this.active.toolop_class;
  }, function create(cls, do_push) {
    if (do_push==undefined) {
        do_push = true;
    }
    var mn=new Manipulator([]);
    mn.parent = this;
    mn.toolop_class = cls;
    if (do_push)
      this.push(mn);
    return mn;
  }, function on_tick(ctx) {
    if (this.active!=undefined&&this.active.on_tick!=undefined)
      this.active.on_tick(ctx);
  }, function circle(p, r, clr, do_push) {
    if (do_push==undefined) {
        do_push = true;
    }
    let h=new ManipCircle(p, r, id, this.view3d, clr);
    let mn=new Manipulator([h]);
    mn.parent = this;
    if (do_push) {
        this.push(mn);
    }
    return mn;
  }, function arrow(v1, v2, id, clr, do_push) {
    if (do_push==undefined) {
        do_push = true;
    }
    v1 = new Vector2(v1);
    v2 = new Vector2(v2);
    var h=new ManipHandle(v1, v2, id, HandleShapes.ARROW, this.view3d, clr);
    var mn=new Manipulator([h]);
    mn.parent = this;
    if (do_push)
      this.push(mn);
    return mn;
  }]);
  var $nil_FmfQ_get_render_rects=[];
  _es6_module.add_class(ManipulatorManager);
  ManipulatorManager = _es6_module.add_export('ManipulatorManager', ManipulatorManager);
}, '/dev/fairmotion/src/editors/viewport/manipulator.js');
es6_module_define('view2d', ["selectmode", "spline_editops", "struct", "view2d_spline_ops", "UIPack", "spline_draw", "UIWidgets_special", "UICanvas", "view2d_editor", "UIElement", "UIWidgets", "imageblock", "spline_createops", "events", "video", "mathlib", "UISplitFrame", "ScreenArea", "manipulator", "UIMenu", "RadialMenu", "toolops_api", "notifications", "UITabPanel", "UIWidgets_special2"], function _view2d_module(_es6_module) {
  "use strict";
  var toolop_menu=es6_import_item(_es6_module, 'UIMenu', 'toolop_menu');
  var uimenu=es6_import(_es6_module, 'UIMenu');
  var UISplitFrame=es6_import_item(_es6_module, 'UISplitFrame', 'UISplitFrame');
  var PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var aabb_isect_2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_2d');
  var inrect_2d=es6_import_item(_es6_module, 'mathlib', 'inrect_2d');
  var aabb_isect_minmax2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_minmax2d');
  var get_2d_canvas=es6_import_item(_es6_module, 'UICanvas', 'get_2d_canvas');
  var get_2d_canvas_2=es6_import_item(_es6_module, 'UICanvas', 'get_2d_canvas_2');
  var NoteFrame=es6_import_item(_es6_module, 'notifications', 'NoteFrame');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var Area=es6_import_item(_es6_module, 'ScreenArea', 'Area');
  var SelMask=es6_import_item(_es6_module, 'selectmode', 'SelMask');
  var ToolModes=es6_import_item(_es6_module, 'selectmode', 'ToolModes');
  var UIRadialMenu=es6_import_item(_es6_module, 'RadialMenu', 'UIRadialMenu');
  var video=es6_import(_es6_module, 'video');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var UIPanel=es6_import_item(_es6_module, 'UIWidgets_special', 'UIPanel');
  var UIColorButton=es6_import_item(_es6_module, 'UIWidgets_special2', 'UIColorButton');
  var ManipulatorManager=es6_import_item(_es6_module, 'manipulator', 'ManipulatorManager');
  var Manipulator=es6_import_item(_es6_module, 'manipulator', 'Manipulator');
  var HandleShapes=es6_import_item(_es6_module, 'manipulator', 'HandleShapes');
  var ManipFlags=es6_import_item(_es6_module, 'manipulator', 'ManipFlags');
  var ManipHandle=es6_import_item(_es6_module, 'manipulator', 'ManipHandle');
  var KeyMap=es6_import_item(_es6_module, 'events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, 'events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, 'events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, 'events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, 'events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, 'events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, 'events', 'EventHandler');
  var view2d_editor=es6_import(_es6_module, 'view2d_editor');
  var EditModes=view2d_editor.EditModes;
  EditModes = _es6_module.add_export('EditModes', EditModes);
  var ibuf_idgen=new EIDGen();
  ibuf_idgen.gen_id();
  var __v3d_g_s=[];
  var _v3d_static_mat=new Matrix4();
  var bleh_bleh=0;
  var icon_tst_k=0;
  var SessionFlags=es6_import_item(_es6_module, 'view2d_editor', 'SessionFlags');
  var CurveRootFinderTest=es6_import_item(_es6_module, 'spline_editops', 'CurveRootFinderTest');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var ExtrudeModes=es6_import_item(_es6_module, 'spline_createops', 'ExtrudeModes');
  function delay_redraw(ms) {
    var start_time=time_ms();
    var timer=window.setInterval(function() {
      if (time_ms()-start_time<ms)
        return ;
      window.clearInterval(timer);
      window.redraw_viewport();
    }, 20);
  }
  var PanOp=_ESClass("PanOp", ToolOp, [function PanOp(start_mpos) {
    ToolOp.call(this);
    this.is_modal = true;
    this.undoflag|=UndoFlags.IGNORE_UNDO;
    if (start_mpos!=undefined) {
        this.start_mpos = new Vector3(start_mpos);
        this.start_mpos[2] = 0.0;
        this.first = false;
    }
    else {
      this.start_mpos = new Vector3();
      this.first = true;
    }
    this.start_cameramat = undefined;
    this.cameramat = new Matrix4();
  }, _ESClass.static(function tooldef() {
    return {uiname: "Pan", apiname: "view2d.pan", undoflag: UndoFlags.IGNORE_UNDO, inputs: {}, outputs: {}, is_modal: true}
  }), function start_modal(ctx) {
    this.start_cameramat = new Matrix4(ctx.view2d.cameramat);
  }, function on_mousemove(event) {
    var mpos=new Vector3([event.x, event.y, 0]);
    if (this.first) {
        this.first = false;
        this.start_mpos.load(mpos);
        return ;
    }
    var ctx=this.modal_ctx;
    mpos.sub(this.start_mpos).mulScalar(1.0/ctx.view2d.zoom);
    this.cameramat.load(this.start_cameramat).translate(mpos[0], mpos[1], 0.0);
    ctx.view2d.set_cameramat(this.cameramat);
    window.force_viewport_redraw();
    window.redraw_viewport();
  }, function on_mouseup(event) {
    this.end_modal();
  }]);
  _es6_module.add_class(PanOp);
  var drawline=_ESClass("drawline", [function drawline(co1, co2, group, color, width) {
    this.v1 = new Vector3(co1);
    this.v2 = new Vector3(co2);
    this.group = group;
    this.width = width;
    if (color!==undefined) {
        this.clr = [color[0], color[1], color[2], color[3]!==undefined ? color[3] : 1.0];
    }
    else {
      this.clr = [0.4, 0.4, 0.4, 1.0];
    }
  }, function set_clr(clr) {
    this.clr = clr;
  }]);
  _es6_module.add_class(drawline);
  var IndexBufItem=_ESClass("IndexBufItem", [function IndexBufItem(id, owner) {
    this.user_id = id;
  }]);
  _es6_module.add_class(IndexBufItem);
  var patch_canvas2d=es6_import_item(_es6_module, 'spline_draw', 'patch_canvas2d');
  var set_rendermat=es6_import_item(_es6_module, 'spline_draw', 'set_rendermat');
  var SplineEditor=es6_import_item(_es6_module, 'view2d_spline_ops', 'SplineEditor');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ToolOpFrame=es6_import_item(_es6_module, 'UIPack', 'ToolOpFrame');
  var UIMenuLabel=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuLabel');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UIMenu=es6_import_item(_es6_module, 'UIMenu', 'UIMenu');
  var UITabPanel=es6_import_item(_es6_module, 'UITabPanel', 'UITabPanel');
  var ImageUser=es6_import_item(_es6_module, 'imageblock', 'ImageUser');
  var canvas_owners=0;
  var _v3d_id=0;
  var $min_yBrt_make_drawline;
  var $min_1f4k_kill_drawline;
  var $_co_M5gT_project;
  var $_co_hUbc_unproject;
  var $max_l4es_make_drawline;
  var $max_Lb0u_kill_drawline;
  var View2DHandler=_ESClass("View2DHandler", Area, [function View2DHandler(x, y, width, height) {
    Area.call(this, View2DHandler.name, "3D Viewport", new Context(), [x, y], [width, height]);
    this.edit_all_layers = false;
    this.widgets = new ManipulatorManager(this);
    this.bgcanvas_owner = "View3D_"+(canvas_owners++);
    this.fgcanvas_owner = "View3D_"+(canvas_owners++);
    this.background_color = new Vector3([1.0, 1.0, 1.0]);
    this.default_stroke = new Vector4([0, 0, 0, 1]);
    this.default_fill = new Vector4([0, 0, 0, 1]);
    this.toolmode = ToolModes.APPEND;
    this.draw_small_verts = false;
    this.pinned_paths = undefined;
    this.background_image = new ImageUser();
    this.draw_bg_image = true;
    this.work_canvas = undefined;
    this.default_linewidth = 2.0;
    this.cameramat = new Matrix4();
    this.rendermat = new Matrix4();
    this.irendermat = new Matrix4();
    this.zoom = 1;
    Object.defineProperty(this, "active_material", {configurable: true, enumerable: true, get: function() {
      var ctx=this.ctx;
      if (ctx==undefined)
        return undefined;
      var spline=ctx.spline;
      var act=this.selectmode&SelMask.SEGMENT ? spline.segments.active : spline.faces.active;
      if (act!=undefined)
        return act.mat;
    }});
    this.extrude_mode = ExtrudeModes.SMOOTH;
    this.draw_video = false;
    this.enable_blur = true;
    this.draw_faces = true;
    this._only_render = false;
    this._draw_normals = false;
    this.tweak_mode = false;
    this.draw_viewport = true;
    this.draw_anim_paths = false;
    this._id = _v3d_id++;
    this.topbar = undefined;
    this.drawlines = new GArray();
    this.drawline_groups = {}
    this._can_select = true;
    this.flagprop = 1;
    this.startup_time = time_ms();
    this.screen = undefined;
    this.ui_canvas = null;
    this.framerate = 0.1;
    this.last_selectmode = 0;
    this.session_flag = 0;
    this.propradius = 80;
    this._in_from_struct = false;
    this.use_radial_menus = false;
    this._selectmode = 1;
    this.asp = width/height;
    this.last_tick = time_ms();
    this.mpos = new Vector2([0, 0]);
    this._mstart = null;
    this.shift = false;
    this.alt = false;
    this.ctrl = false;
    this.tools_define = {}
    this.keymap = new KeyMap();
    this.define_keymap();
    this.editor = new SplineEditor(this);
    this.editors = new GArray([this.editor]);
    this.touch_delay = 80;
  }, _ESClass.get(function visible_paths() {
    if (this.pinned_paths!=undefined) {
    }
    else {
    }
  }), _ESClass.get(function pin_paths() {
    return this.pinned_paths!=undefined;
  }), _ESClass.set(function pin_paths(state) {
    if (!state) {
        this.pinned_paths = undefined;
        if (this.ctx!=undefined&&this.ctx.frameset!=undefined) {
            this.ctx.frameset.switch_on_select = true;
            this.ctx.frameset.update_visibility();
        }
    }
    else {
      var spline=this.ctx.frameset.spline;
      var eids=[];
      var __iter_v=__get_iter(spline.verts.selected.editable());
      var v;
      while (1) {
        var __ival_v=__iter_v.next();
        if (__ival_v.done) {
            break;
        }
        v = __ival_v.value;
        eids.push(v.eid);
      }
      this.pinned_paths = eids;
      this.ctx.frameset.switch_on_select = false;
    }
  }), _ESClass.get(function draw_normals() {
    return this._draw_normals;
  }), _ESClass.set(function draw_normals(val) {
    if (val!=this._draw_normals) {
        this.draw_viewport = 1;
    }
    this._draw_normals = val;
  }), _ESClass.get(function draw_anim_paths() {
    return this._draw_anim_paths;
  }), _ESClass.set(function draw_anim_paths(val) {
    if (val!=this._draw_anim_paths) {
        this.draw_viewport = 1;
    }
    this._draw_anim_paths = val;
  }), _ESClass.get(function only_render() {
    return this._only_render;
  }), _ESClass.set(function only_render(val) {
    if (val!=this._only_render) {
        this.draw_viewport = 1;
    }
    this._only_render = val;
  }), function push_modal(e) {
    this.push_touch_delay(1);
    Area.prototype.push_modal.call(this, e);
  }, function pop_modal(e) {
    if (this.modalhandler!=undefined)
      this.pop_touch_delay();
    if (this.modalhandler==undefined) {
        this.touch_delay_stack = [];
    }
    Area.prototype.pop_modal.call(this, e);
  }, function _get_dl_group(group) {
    if (group==undefined)
      group = "main";
    if (!(group in this.drawline_groups)) {
        this.drawline_groups[group] = new GArray();
    }
    return this.drawline_groups[group];
  }, function make_drawline(v1, v2, group, color, width) {
    if (group==undefined) {
        group = "main";
    }
    if (color==undefined) {
        color = undefined;
    }
    if (width==undefined) {
        width = 1;
    }
    var drawlines=this._get_dl_group(group);
    var dl=new drawline(v1, v2, group, color, width);
    drawlines.push(dl);
    var pad=5;
    $min_yBrt_make_drawline[0] = Math.min(v1[0], v2[0])-pad;
    $min_yBrt_make_drawline[1] = Math.min(v1[1], v2[1])-pad;
    $max_l4es_make_drawline[0] = Math.max(v1[0], v2[0])+pad;
    $max_l4es_make_drawline[1] = Math.max(v1[1], v2[1])+pad;
    redraw_viewport($min_yBrt_make_drawline, $max_l4es_make_drawline);
    return dl;
  }, function kill_drawline(dl) {
    var drawlines=this._get_dl_group(dl.group);
    var pad=5;
    var v1=dl.v1, v2=dl.v2;
    $min_1f4k_kill_drawline[0] = Math.min(v1[0], v2[0])-pad;
    $min_1f4k_kill_drawline[1] = Math.min(v1[1], v2[1])-pad;
    $max_Lb0u_kill_drawline[0] = Math.max(v1[0], v2[0])+pad;
    $max_Lb0u_kill_drawline[1] = Math.max(v1[1], v2[1])+pad;
    redraw_viewport($min_1f4k_kill_drawline, $max_Lb0u_kill_drawline);
    drawlines.remove(dl);
  }, function reset_drawlines(group) {
    if (group==undefined) {
        group = "main";
    }
    var drawlines=this._get_dl_group(group);
    drawlines.reset();
  }, function get_keymaps() {
    var ret=[this.keymap];
    var maps=this.editor.get_keymaps();
    for (var i=0; i<maps.length; i++) {
        ret.push(maps[i]);
    }
    return ret;
  }, _ESClass.get(function can_select() {
    return this._can_select;
  }), _ESClass.set(function can_select(val) {
    this._can_select = !!val;
  }), _ESClass.static(function fromSTRUCT(reader) {
    var v3d=new View2DHandler();
    v3d._in_from_struct = true;
    reader(v3d);
    if (v3d.pinned_paths!=undefined&&v3d.pinned_paths.length==0)
      v3d.pinned_paths = undefined;
    if (v3d.editor==undefined) {
        console.log("WARNING: corrupted View2DHandler sturct data");
        v3d.editor = v3d.editors[0];
    }
    else {
      v3d.editor = v3d.editors[v3d.editor];
    }
    v3d._in_from_struct = false;
    return v3d;
  }), _ESClass.get(function selectmode() {
    return this._selectmode;
  }), _ESClass.set(function selectmode(val) {
    this._selectmode = val;
    if (!this._in_from_struct)
      this.set_selectmode(val);
  }), function data_link(block, getblock, getblock_us) {
    this.ctx = new Context();
    this.background_image.data_link(block, getblock, getblock_us);
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    return this.constructor.name+this._id;
  }), function set_canvasbox() {
    this.asp = this.size[0]/this.size[1];
  }, function set_cameramat(mat) {
    if (mat==undefined) {
        mat = undefined;
    }
    var cam=this.cameramat, render=this.rendermat, zoom=new Matrix4();
    if (mat!=undefined)
      cam.load(mat);
    zoom.translate(this.size[0]/2, this.size[1]/2, 0);
    zoom.scale(this.zoom, this.zoom, this.zoom);
    zoom.translate(-this.size[0]/2, -this.size[1]/2, 0);
    render.makeIdentity();
    render.multiply(zoom);
    render.multiply(cam);
    this.irendermat.load(this.rendermat).invert();
  }, function project(co) {
    $_co_M5gT_project.load(co);
    $_co_M5gT_project[2] = 0.0;
    $_co_M5gT_project.multVecMatrix(this.rendermat);
    co[0] = $_co_M5gT_project[0], co[1] = $_co_M5gT_project[1];
    return co;
  }, function unproject(co) {
    $_co_hUbc_unproject.load(co);
    $_co_hUbc_unproject[2] = 0.0;
    $_co_hUbc_unproject.multVecMatrix(this.irendermat);
    co[0] = $_co_hUbc_unproject[0], co[1] = $_co_hUbc_unproject[1];
    return co;
  }, function do_select(event, mpos, view2d, do_multiple) {
    if (do_multiple==undefined) {
        do_multiple = false;
    }
    return this.editor.do_select(event, mpos, view2d, do_multiple);
  }, function do_alt_select(event, mpos, view2d) {
    return this.editor.do_alt_select(event, mpos, view2d);
  }, function tools_menu(ctx, mpos) {
    this.editor.tools_menu(ctx, mpos, this);
  }, function toolop_menu(ctx, name, ops) {
    if (ops.length>1&&this.use_radial_menus) {
        return uimenu.toolop_radial_menu(ctx, name, ops);
    }
    else {
      return uimenu.toolop_menu(ctx, name, ops);
    }
  }, function call_menu(menu, frame, pos) {
    if (__instance_of(menu, UIRadialMenu)) {
        return ui_call_radial_menu(menu, frame, pos);
    }
    else 
      if (__instance_of(menu, UIMenu)) {
        return ui_call_menu(menu, frame, pos);
    }
  }, function rightclick_menu(event) {
    this.editor.rightclick_menu(event, this);
  }, function _widget_mouseevent(event) {
    let co=[event.x, event.y];
    this.unproject(co);
    let event2={type: event.type, x: co[0], y: co[1], origX: event.x, origY: event.y, shiftKey: event.shiftKey, ctrlKey: event.ctrlKey, altKey: event.altKey, commandKey: event.commandKey}
    return event2;
  }, function on_mousedown(event) {
    if (this.bad_event(event))
      return ;
    if (Area.prototype.on_mousedown.call(this, event))
      return ;
    if (this.widgets.on_click(this._widget_mouseevent(event), this)) {
        return ;
    }
    if (event.button==0) {
        var selfound=false;
        var is_middle=event.button==1||(event.button==2&&g_app_state.screen.ctrl);
        var tottouch=g_app_state.screen.tottouch;
        if (tottouch>=2) {
            console.log("Touch screen rotate/pan/zoom combo");
        }
        else 
          if (is_middle&&this.shift) {
            console.log("Panning");
        }
        else 
          if (is_middle) {
        }
        else 
          if (event.button==0&&event.altKey) {
            this.on_mousemove(event);
            this._mstart = new Vector2(this.mpos);
            selfound = this.do_alt_select(event, this.mpos, this);
        }
        else 
          if (event.button==0) {
            this.on_mousemove(event);
            this._mstart = new Vector2(this.mpos);
            selfound = this.do_select(event, this.mpos, this, this.shift|g_app_state.select_multiple);
            this.editor.selectmode = this.selectmode;
            if (!selfound) {
                if (this.editor.on_mousedown(event))
                  return ;
            }
        }
    }
    if (event.button==2&&!g_app_state.screen.shift&&!g_app_state.screen.ctrl&&!g_app_state.screen.alt) {
        var tool=new PanOp();
        g_app_state.toolstack.exec_tool(tool);
    }
  }, function on_mouseup(event) {
    if (this.bad_event(event))
      return ;
    this._mstart = null;
    if (Area.prototype.on_mouseup.call(this, event))
      return ;
    if (this.editor.on_mouseup(event))
      return ;
  }, function on_mousemove(event) {
    var mpos=new Vector3([event.x, event.y, 0]);
    this.mpos = mpos;
    var this2=this;
    function switch_on_multitouch(op, event, cancel_func) {
      if (g_app_state.screen.tottouch>1) {
          this2._mstart = null;
          cancel_func();
      }
      if (this._mstart!=null) {
          var vec=new Vector2(this.mpos);
          vec.sub(this._mstart);
          if (vec.vectorLength()>10) {
              this._mstart = null;
              return ;
              var top=new TranslateOp(EditModes.GEOMETRY);
          }
          top.cancel_callback = switch_on_multitouch;
          g_app_state.toolstack.exec_tool(top);
          this._mstart = null;
          return ;
      }
    }
    if (Area.prototype.on_mousemove.call(this, event)) {
        return ;
    }
    if (this.widgets.on_mousemove(this._widget_mouseevent(event), this)) {
        return ;
    }
    this.editor.on_mousemove(event);
  }, function set_zoom(zoom) {
    "zoom set!";
    this.zoom = zoom;
    this.set_cameramat();
    window.redraw_viewport();
  }, function change_zoom(delta) {
  }, function on_mousewheel(event, delta) {
    this.change_zoom(delta);
  }, function on_tick() {
    this.widgets.on_tick(this.ctx);
    this.editor.on_tick(this.ctx);
    Area.prototype.on_tick.call(this);
    if (this.draw_video&&(time_ms()-this.startup_time)>300) {
        this.video = video.manager.get("/video.mp4");
        if (this.video_time!=this.ctx.scene.time) {
            this.video_time = this.ctx.scene.time;
            window.force_viewport_redraw();
        }
    }
  }, function on_view_change() {
  }, function get_fg_canvas() {
    this.drawcanvas = this.canvas.get_canvas(this, this.abspos, this.size, 2);
    return this.drawcanvas;
  }, function get_bg_canvas() {
    return this.canvas.get_canvas(this.bgcanvas_owner, this.abspos, this.size, -1);
  }, function do_draw_viewport(redraw_rects) {
    var canvas=this.get_fg_canvas();
    var bgcanvas=this.get_bg_canvas();
    var g=this.drawg = canvas.ctx;
    var bg_g=bgcanvas.ctx;
    if (bgcanvas!==undefined&&bgcanvas.style!==undefined) {
        bgcanvas.style["backgroundColor"] = this.background_color.toCSS();
    }
    var w=this.parent.size[0];
    var h=this.parent.size[1];
    g._irender_mat = this.irendermat;
    bg_g._irender_mat = this.irendermat;
    set_rendermat(g, this.rendermat);
    set_rendermat(bg_g, this.rendermat);
    g.save();
    bg_g.save();
    var p1=new Vector2([this.pos[0], this.pos[1]]);
    var p2=new Vector2([this.pos[0]+this.size[0], this.pos[1]+this.size[1]]);
    this.unproject(p1), this.unproject(p2);
    var r=redraw_rects;
    g.beginPath();
    for (var i=0; i<r.length; i+=4) {
        g.moveTo(r[i], r[i+1]);
        g.lineTo(r[i], r[i+3]);
        g.lineTo(r[i+2], r[i+3]);
        g.lineTo(r[i+2], r[i+1]);
        g.closePath();
    }
    g.beginPath();
    bg_g.beginPath();
    g._clearRect(0, 0, g.canvas.width, g.canvas.height);
    bg_g._clearRect(0, 0, bg_g.canvas.width, bg_g.canvas.height);
    this.ctx = new Context();
    if (this.ctx.frameset==undefined) {
        g.restore();
        bg_g.restore();
        return ;
    }
    if (this.draw_video&&this.video!=undefined) {
        var frame=Math.floor(this.video_time);
        var image=this.video.get(frame);
        if (image!=undefined) {
            bg_g.drawImage(image, 0, 0);
        }
    }
    if (this.draw_bg_image&&this.background_image.image!=undefined) {
        var img=this.background_image.image.get_dom_image();
        var iuser=this.background_image;
        bg_g.drawImage(img, iuser.off[0], iuser.off[1], img.width*iuser.scale[0], img.height*iuser.scale[1]);
    }
    this.ctx.frameset.draw(this.ctx, g, this, redraw_rects, this.edit_all_layers);
    var frameset=this.ctx.frameset;
    var spline=frameset.spline;
    var actspline=this.ctx.spline;
    var pathspline=this.ctx.frameset.pathspline;
    if (this.draw_anim_paths) {
        if (this.only_render&&pathspline.resolve) {
            pathspline.solve();
        }
        else 
          if (!this.only_render) {
            var __iter_v=__get_iter(spline.verts.selected);
            var v;
            while (1) {
              var __ival_v=__iter_v.next();
              if (__ival_v.done) {
                  break;
              }
              v = __ival_v.value;
              if (!(v.eid in frameset.vertex_animdata))
                continue;
              var vdata=frameset.vertex_animdata[v.eid];
              var alpha=vdata.spline===actspline ? 1.0 : 0.2;
              vdata.draw(g, alpha, this.ctx.frameset.time, redraw_rects);
            }
            pathspline.layerset.active = pathspline.layerset.idmap[this.ctx.frameset.templayerid];
            pathspline.draw(redraw_rects, g, this, this.selectmode, this.only_render, this.draw_normals, alpha, true, this.ctx.frameset.time, false);
        }
    }
    else {
      if (pathspline.resolve) {
          pathspline.solve();
          console.log("solved pathspline", pathspline.resolve);
          pathspline.resolve = 0;
      }
    }
    this.editor.ctx = this.ctx;
    var fl=Math.floor;
    for (var k in this.drawline_groups) {
        var __iter_dl=__get_iter(this.drawline_groups[k]);
        var dl;
        while (1) {
          var __ival_dl=__iter_dl.next();
          if (__ival_dl.done) {
              break;
          }
          dl = __ival_dl.value;
          var a=dl.clr[3]!=undefined ? dl.clr[3] : 1.0;
          g.strokeStyle = "rgba("+fl(dl.clr[0]*255)+","+fl(dl.clr[1]*255)+","+fl(dl.clr[2]*255)+","+a+")";
          g.lineWidth = dl.width;
          g.beginPath();
          g.moveTo(dl.v1[0], dl.v1[1]);
          g.lineTo(dl.v2[0], dl.v2[1]);
          g.stroke();
        }
    }
    var draw_widget=false;
    if (1||draw_widget) {
        this.widgets.render(canvas, g);
    }
    bg_g.restore();
    g.restore();
  }, function build_draw(canvas, isvertical) {
    Area.prototype.build_draw.call(this, canvas, isvertical);
    this.editor.view2d = this;
    this.ctx = this.editor.ctx = new Context();
    this.abspos[0] = this.abspos[1] = 0.0;
    this.abs_transform(this.abspos);
    var canvas=this.get_fg_canvas();
    this.draw_canvas = canvas;
    this.draw_canvas_ctx = canvas.ctx;
    var g=canvas.ctx;
    if (g.width!=this.size[0]||g.height!=this.size[1])
      this.draw_viewport = true;
    if (g.width!=this.size[0])
      g.width = this.size[0];
    if (g.height!=this.size[1])
      g.height = this.size[1];
    if (this.draw_viewport) {
        this.draw_viewport = false;
        this.do_draw_viewport(g);
    }
  }, function undo_redo(row) {
    var ctx=this.ctx;
    var col=row.col();
    var row2=col.row();
    var undo=new UIButtonIcon(ctx, "Undo", Icons.UNDO);
    undo.hint = "  Hotkey : CTRL-Z";
    undo.callback = function() {
      g_app_state.toolstack.undo();
    }
    row2.add(undo);
    var row2=col.row();
    var redo=new UIButtonIcon(ctx, "Redo", Icons.REDO);
    redo.hint = "  Hotkey : CTRL-SHIFT-Z";
    redo.callback = function() {
      g_app_state.toolstack.redo();
    }
    row2.add(redo);
  }, function define_keymap() {
    var k=this.keymap;
    k.add(new KeyHandler("Z", ["CTRL", "SHIFT"], "Redo"), new FuncKeyHandler(function(ctx) {
      console.log("Redo");
      ctx.toolstack.redo();
    }));
    k.add(new KeyHandler("Y", ["CTRL"], "Redo"), new FuncKeyHandler(function(ctx) {
      console.log("Redo");
      ctx.toolstack.redo();
    }));
    k.add(new KeyHandler("Z", ["CTRL"], "Undo"), new FuncKeyHandler(function(ctx) {
      console.log("Undo");
      ctx.toolstack.undo();
    }));
    k.add(new KeyHandler("O", [], "Toggle Proportional Transform"), new FuncKeyHandler(function(ctx) {
      console.log("toggling proportional transform");
      ctx.view2d.session_flag^=SessionFlags.PROP_TRANSFORM;
    }));
    k.add(new KeyHandler("K", [], ""), new FuncKeyHandler(function(ctx) {
      g_app_state.toolstack.exec_tool(new CurveRootFinderTest());
    }));
    k.add(new KeyHandler("Right", [], ""), new FuncKeyHandler(function(ctx) {
      console.log("Frame Change!", ctx.scene.time+1);
      ctx.scene.change_time(ctx, ctx.scene.time+1);
      window.redraw_viewport();
    }));
    k.add(new KeyHandler("Left", [], ""), new FuncKeyHandler(function(ctx) {
      console.log("Frame Change!", ctx.scene.time-1);
      ctx.scene.change_time(ctx, ctx.scene.time-1);
      window.redraw_viewport();
    }));
    k.add(new KeyHandler("Up", [], "Frame Ahead 10"), new FuncKeyHandler(function(ctx) {
      window.debug_int_1++;
      ctx.scene.change_time(ctx, ctx.scene.time+10);
      window.force_viewport_redraw();
      window.redraw_viewport();
      console.log("debug_int_1: ", debug_int_1);
    }));
    k.add(new KeyHandler("Down", [], "Frame Back 10"), new FuncKeyHandler(function(ctx) {
      
      debug_int_1--;
      debug_int_1 = Math.max(0, debug_int_1);
      ctx.scene.change_time(ctx, ctx.scene.time-10);
      window.force_viewport_redraw();
      window.redraw_viewport();
      console.log("debug_int_1: ", debug_int_1);
    }));
  }, function _on_keyup(event) {
    this.shift = this.editor.shift = event.shiftKey;
    this.alt = this.editor.alt = event.altKey;
    this.ctrl = this.editor.ctrl = event.ctrlKey;
    Area.prototype._on_keyup.call(this, event);
  }, _ESClass.static(function default_new(ctx, scr, unused, pos, size) {
    var ret=new View2DHandler(pos[0], pos[1], size[0], size[1]);
    return ret;
  }), function area_duplicate() {
    var cpy=new View2DHandler(undefined, undefined, undefined, undefined, undefined, 0, 0, this.size[0], this.size[1], undefined, undefined);
    cpy.ctx = new Context();
    cpy.editors = new GArray();
    cpy.editor = undefined;
    var __iter_e=__get_iter(this.editors);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      var e2=e.editor_duplicate(cpy);
      cpy.editors.push(e2);
      if (e==this.editor)
        cpy.editor = e2;
    }
    if (cpy.editor==undefined) {
        cpy.editor = cpy.editors[0];
    }
    return cpy;
  }, function gen_file_menu(ctx, uimenulabel) {
    return toolop_menu(ctx, "", ["appstate.quit()", "view2d.export_image()", "appstate.export_svg()", "sep", "appstate.save_as()", "appstate.save()", "appstate.open_recent()", "appstate.open()", "sep", "appstate.new()"]);
  }, function gen_session_menu(ctx, uimenulabel) {
    function callback(entry) {
      console.log(entry);
      if (entry.i==0) {
          if (confirm("Settings will be cleared", "Clear Settings?")) {
              console.log("clearing settings");
              ctx.appstate.session.settings.reload_defaults();
          }
      }
      else 
        if (entry.i==2) {
          g_app_state.set_startup_file();
      }
      else 
        if (entry.i==1) {
          myLocalStorage.set("startup_file", startup_file_str);
      }
    }
    var menu=new UIMenu("", callback);
    menu.add_item("Clear Settings", "");
    menu.add_item("Clear Default File");
    menu.add_item("Save Default File", "CTRL-ALT-U");
    return menu;
  }, function gen_tools_menu(ctx, uimenulabel) {
    return toolop_menu(ctx, "", []);
  }, function destroy() {
    Area.prototype.destroy.call(this);
    if (this.bgcanvas_owner!=undefined)
      this.canvas.kill_canvas(this.bgcanvas_owner);
    if (this.canvas!=undefined)
      this.canvas.kill_canvas(this);
  }, function on_area_inactive() {
    this.destroy();
    this.editor.on_area_inactive(this);
    Area.prototype.on_area_inactive.call(this);
  }, function on_area_active() {
    if (this.canvas!=undefined)
      this.canvas.reset();
    var __iter_e=__get_iter(this.editors);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      e.canvas = this.canvas;
    }
    Area.prototype.on_area_active.call(this);
  }, function build_bottombar(col) {
    this.editor.build_bottombar(this, col);
  }, function build_sidebar1(frame) {
    this.ctx = new Context();
    var panel=new RowFrame(this.ctx);
    this.sidebar1 = panel;
    panel.packflag = PackFlags.IGNORE_LIMIT|PackFlags.NO_AUTO_SPACING|PackFlags.ALIGN_LEFT|PackFlags.INHERIT_HEIGHT;
    panel.pad = [1, 1];
    panel.draw_background = true;
    panel.rcorner = 100.0;
    var tabs=new UITabPanel(this.ctx);
    tabs.packflag|=PackFlags.INHERIT_WIDTH;
    panel.add(tabs);
    tabs.pad = [1, 1];
    var tools=tabs.panel("Tools");
    tools.prop("view2d.toolmode", PackFlags.USE_LARGE_ICON|PackFlags.ENUM_STRIP|PackFlags.VERTICAL);
    var undo=new UIButtonIcon(this.ctx, "Undo", Icons.UNDO);
    undo.hint = "  Hotkey : CTRL-Z";
    undo.callback = function() {
      g_app_state.toolstack.undo();
      delay_redraw(50);
    }
    tools.add(undo);
    var redo=new UIButtonIcon(this.ctx, "Redo", Icons.REDO);
    redo.hint = "  Hotkey : CTRL-SHIFT-Z";
    redo.callback = function() {
      g_app_state.toolstack.redo();
      delay_redraw(50);
    }
    tools.add(redo);
    tools.toolop("view2d.circle_select()", PackFlags.USE_LARGE_ICON);
    tools.toolop("spline.toggle_select_all()", PackFlags.USE_LARGE_ICON);
    var display=tabs.panel("Display");
    display.packflag|=PackFlags.NO_AUTO_SPACING;
    display.default_packflag|=PackFlags.NO_AUTO_SPACING;
    display.prop("view2d.only_render");
    display.prop("view2d.draw_small_verts");
    display.prop("view2d.draw_normals");
    display.prop("view2d.draw_anim_paths");
    display.prop("view2d.extrude_mode");
    display.prop("view2d.enable_blur");
    display.prop("view2d.draw_faces");
    display.toolop("view2d.render_anim()");
    display.toolop("view2d.play_anim()");
    display.prop("view2d.selectmask[HANDLE]");
    display.prop("view2d.pin_paths");
    var img=tabs.panel("Background");
    img.packflag|=PackFlags.NO_AUTO_SPACING;
    var panel2=new UIPanel(this.ctx, "Background Image", undefined, true);
    img.add(panel2);
    panel2.prop('view2d.draw_bg_image');
    panel2.prop('view2d.background_image.image');
    panel2.toolop("image.load_image(datapath='view2d.background_image.image')");
    panel2.prop('view2d.background_image.off');
    panel2.prop('view2d.background_image.scale');
    panel2 = new UIPanel(this.ctx, "Background Color", undefined, true);
    img.add(panel2);
    panel2.prop('view2d.background_color');
    var lasttool=tabs.panel("Tool Options");
    lasttool.add(new ToolOpFrame(this.ctx, "last_tool"));
    frame.add(panel);
  }, function build_layout() {
    Area.prototype.build_layout.call(this);
    this.middlesplit.horizontal = true;
    let sidebar1=this.middlesplit.initial();
    sidebar1.state|=UIFlags.BG_EVENTS_TRANSPARENT;
    sidebar1.draw_background = false;
    this.build_sidebar1(sidebar1);
    this.middlesplit.split(0.5).state|=UIFlags.BG_EVENTS_TRANSPARENT;
    let panel=this.subframe.split(Area.get_barhgt()*2, false, true, true);
    panel.add(new ColumnFrame(this.ctx));
    panel.draw_background = true;
    this.editor.build_sidebar1(this, panel.children[0]);
  }, function build_topbar(col) {
    this.ctx = new Context();
    col.packflag|=PackFlags.ALIGN_LEFT|PackFlags.INHERIT_WIDTH|PackFlags.INHERIT_HEIGHT;
    col.packflag|=PackFlags.IGNORE_LIMIT|PackFlags.NO_AUTO_SPACING;
    col.draw_background = true;
    col.rcorner = 100.0;
    col.label("                      ");
    var iconflag=IsMobile ? PackFlags.USE_LARGE_ICON : PackFlags.USE_SMALL_ICON;
    col.toolop("screen.hint_picker()", iconflag, "?");
    col.prop("scene.frame");
    var this2=this;
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
    this.editor.build_topbar(col);
  }, function switch_editor(editortype) {
    if (editortype==undefined) {
        console.log("Undefined passed to switch_editor()");
        return ;
    }
    var editor=undefined;
    var __iter_e=__get_iter(this.editors);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      if (__instance_of(e, editortype)) {
          editor = e;
          break;
      }
    }
    if (editor==undefined) {
        editor = new editortype(this);
        this.editors.push(editor);
    }
    this.editor.on_inactive(this);
    this.editor = editor;
    editor.on_active(this);
    var __iter_c=__get_iter(list(this.cols));
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      this.remove(c);
    }
    var __iter_c=__get_iter(list(this.rows));
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      this.remove(c);
    }
    this.cols = new GArray();
    this.rows = new GArray();
    this.build_topbar();
    this.editor.build_bottombar(this);
    this.editor.build_sidebar1(this);
    this.editor.build_topbar(this);
    this.do_recalc();
    redraw_viewport();
  }, function ensure_editor(editortype) {
    if (!(__instance_of(this.editor, editortype)))
      this.switch_editor(editortype);
  }, function set_selectmode(mode) {
    this._selectmode = mode;
    this.editor.set_selectmode(mode);
    redraw_viewport();
  }]);
  var $min_yBrt_make_drawline=[0, 0];
  var $min_1f4k_kill_drawline=[0, 0];
  var $_co_M5gT_project=new Vector3();
  var $_co_hUbc_unproject=new Vector3();
  var $max_l4es_make_drawline=[0, 0];
  var $max_Lb0u_kill_drawline=[0, 0];
  _es6_module.add_class(View2DHandler);
  View2DHandler = _es6_module.add_export('View2DHandler', View2DHandler);
  View2DHandler.STRUCT = STRUCT.inherit(View2DHandler, Area)+"\n    _id             : int;\n    _selectmode     : int;\n    rendermat       : mat4;\n    irendermat      : mat4;\n    cameramat       : mat4;\n    only_render     : int;\n    draw_anim_paths : int;\n    draw_normals    : int;\n    editors         : array(abstract(View2DEditor));\n    editor          : int | obj.editors.indexOf(obj.editor);\n    zoom            : float;\n    tweak_mode        : int;\n    default_linewidth : float;\n    default_stroke    : vec4;\n    default_fill      : vec4;\n    extrude_mode      : int;\n    enable_blur       : int;\n    draw_faces        : int;\n    draw_video        : int;\n    pinned_paths      : array(int) | obj.pinned_paths != undefined ? obj.pinned_paths : [];\n    background_image  : ImageUser;\n    background_color  : vec3;\n    draw_bg_image     : int;\n    toolmode          : int;\n    draw_small_verts  : int;\n    edit_all_layers   : int;\n  }\n";
  View2DHandler.uiname = "Work Canvas";
}, '/dev/fairmotion/src/editors/viewport/view2d.js');
es6_module_define('view2d_ops', ["toolops_api", "ajax", "vectordraw_canvas2d_simple", "fileapi", "events", "spline_draw", "spline_draw_new", "toolprops", "scene", "struct", "spline", "frameset"], function _view2d_ops_module(_es6_module) {
  "use strict";
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var unpack_ctx=es6_import_item(_es6_module, 'ajax', 'unpack_ctx');
  var KeyMap=es6_import_item(_es6_module, 'events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, 'events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, 'events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, 'events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, 'events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, 'events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, 'events', 'EventHandler');
  var $v1_KyC2_exec_pan;
  var $v2_QzGR_exec_pan;
  var ViewRotateZoomPanOp=_ESClass("ViewRotateZoomPanOp", ToolOp, [function ViewRotateZoomPanOp() {
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
  }, function can_call(ctx) {
    return true;
  }, function start_modal(ctx) {
    this.start_mat = new Matrix4(ctx.view2d.drawmats.cameramat);
    this.first_call = true;
    this.start_zoom = ctx.view2d.zoomwheel;
  }, function proj(out, mpos) {
    var size=this.modal_ctx.view2d.size;
    out.loadxy(mpos);
    out[0] = out[0]/(size[0]*0.5)-1.0;
    out[1] = out[1]/(size[1]*0.5)-1.0;
  }, function on_mousemove(event) {
    var ctx=this.modal_ctx;
    var view2d=ctx.view2d;
    var screen=g_app_state.screen;
    if (screen.tottouch==0) {
        this.end_modal();
    }
    if (this.first_call==true) {
        var touches=[];
        for (var k in screen.touchstate) {
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
    if (screen.tottouch==2&&this.startids[2]!=undefined)
      this.transition("rotate");
    if (this.startids[2]==undefined) {
        for (var k in screen.touchstate) {
            if (k!=this.startids[0]&&k!=this.startids[1]) {
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
    if (this.startids[2]!=undefined&&this.startids[2] in screen.touchstate) {
        this.proj(this.mv6, screen.touchstate[this.startids[2]]);
    }
    this.exec(this.modal_tctx);
  }, function exec(ctx) {
    ctx = this.modal_ctx;
    var v1=new Vector3(this.mv1);
    var v2=new Vector3(this.mv2);
    var newmat;
    if (this.startids[2]==undefined) {
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
    if (this.startids[2]!=undefined)
      this.exec_pan(ctx);
  }, function exec_pan(ctx) {
    var view2d=ctx.view2d;
    $v1_KyC2_exec_pan.load(this.mv5);
    $v2_QzGR_exec_pan.load(this.mv6);
    $v1_KyC2_exec_pan[2] = 0.9;
    $v2_QzGR_exec_pan[2] = 0.9;
    var iprojmat=new Matrix4(ctx.view2d.drawmats.rendermat);
    iprojmat.invert();
    var scenter=new Vector3(this.center);
    scenter.multVecMatrix(ctx.view2d.drawmats.rendermat);
    if (isNaN(scenter[2]))
      scenter[2] = 0.0;
    $v1_KyC2_exec_pan[2] = scenter[2];
    $v2_QzGR_exec_pan[2] = scenter[2];
    $v1_KyC2_exec_pan.multVecMatrix(iprojmat);
    $v2_QzGR_exec_pan.multVecMatrix(iprojmat);
    var vec=new Vector3($v2_QzGR_exec_pan);
    vec.sub($v1_KyC2_exec_pan);
    newmat = new Matrix4(this.start_mat);
    if (isNaN(vec[0])||isNaN(vec[1])||isNaN(vec[2]))
      return ;
    newmat.translate(vec);
    view2d.drawmats.cameramat = newmat;
  }, function transition(mode) {
    this.start_mat = new Matrix4(this.modal_ctx.view2d.drawmats.cameramat);
    if (mode=="rotate") {
        this.startids[2] = undefined;
        this.startcos[0].load(this.mv2);
        this.mv1.load(this.mv2);
    }
  }, function on_mouseup(event) {
    if (DEBUG.modal)
      console.log("modal end");
    for (var k in event.touches) {
        if (this.startids[2]==k) {
            this.transition("rotate");
        }
    }
    if (g_app_state.screen.tottouch==0)
      this.end_modal();
  }]);
  var $v1_KyC2_exec_pan=new Vector3();
  var $v2_QzGR_exec_pan=new Vector3();
  _es6_module.add_class(ViewRotateZoomPanOp);
  var ViewRotateOp=_ESClass("ViewRotateOp", ToolOp, [function ViewRotateOp() {
    ToolOp.call(this, "view2d_orbit", "Orbit");
    this.undoflag = UndoFlags.IGNORE_UNDO;
    this.transdata = null;
    this.is_modal = true;
    this.inputs = {MV1: new Vec3Property(new Vector3(), "mvector1", "mvector1", "mvector1"), MV2: new Vec3Property(new Vector3(), "mvector2", "mvector2", "mvector2")}
    this.outputs = {}
  }, function can_call(ctx) {
    return true;
  }, function start_modal(ctx) {
    this.start_mat = new Matrix4(ctx.view2d.drawmats.cameramat);
    this.first_call = true;
  }, function on_mousemove(event) {
    if (this.first_call==true) {
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
  }, function exec(ctx) {
    ctx = this.modal_ctx;
    var v1=new Vector3(this.inputs.MV1.data);
    var v2=new Vector3(this.inputs.MV2.data);
    if (v1.vectorDistance(v2)<0.01)
      return ;
    var vec=new Vector3(v2);
    vec.sub(v1);
    perp = new Vector3([-vec[1], vec[0], 0.0]);
    var q=new Quat();
    q.axisAngleToQuat(perp, vec.vectorLength()*2);
    mat = q.toMatrix();
    newmat = new Matrix4(mat);
    newmat.multiply(this.start_mat);
    ctx.view2d.drawmats.cameramat = newmat;
    ctx.view2d.on_view_change();
  }, function on_mouseup(event) {
    if (DEBUG.modal)
      console.log("modal end");
    this.end_modal();
  }]);
  _es6_module.add_class(ViewRotateOp);
  var ViewPanOp=_ESClass("ViewPanOp", ToolOp, [function ViewPanOp() {
    ToolOp.call(this, "view2d_pan", "Pan");
    this.undoflag = UndoFlags.IGNORE_UNDO;
    this.transdata = null;
    this.is_modal = true;
    this.inputs = {MV1: new Vec3Property(new Vector3(), "mvector1", "mvector1", "mvector1"), MV2: new Vec3Property(new Vector3(), "mvector2", "mvector2", "mvector2")}
    this.outputs = {}
  }, function can_call(ctx) {
    return true;
  }, function start_modal(ctx) {
    this.start_mat = new Matrix4(ctx.view2d.drawmats.cameramat);
    this.first_call = true;
    this.center = new Vector3();
    var i=0;
    var __iter_v=__get_iter(ctx.mesh.verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      if (isNaN(v.co[0])||isNaN(v.co[1])||isNaN(v.co[2]))
        continue;
      this.center.add(v.co);
      i+=1;
      if (i>200)
        break;
    }
    if (i>0)
      this.center.mulScalar(1.0/i);
  }, function on_mousemove(event) {
    if (this.first_call==true) {
        this.first_call = false;
        this.start_mpos = new Vector3([event.x, event.y, 0]);
        this.start_mpos[0] = this.start_mpos[0]/(this.modal_ctx.view2d.size[0]/2)-1.0;
        this.start_mpos[1] = this.start_mpos[1]/(this.modal_ctx.view2d.size[1]/2)-1.0;
    }
    mstart = new Vector3(this.start_mpos);
    var mend=new Vector3([event.x, event.y, 0.0]);
    mend[0] = mend[0]/(this.modal_ctx.view2d.size[0]/2)-1.0;
    mend[1] = mend[1]/(this.modal_ctx.view2d.size[1]/2)-1.0;
    this.inputs.MV1.data = mstart;
    this.inputs.MV2.data = mend;
    this.exec(this.modal_ctx);
  }, function exec(ctx) {
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
    newmat = new Matrix4(this.start_mat);
    if (isNaN(vec[0])||isNaN(vec[1])||isNaN(vec[2]))
      return ;
    newmat.translate(vec);
    ctx.view2d.drawmats.cameramat = newmat;
    ctx.view2d.on_view_change();
  }, function on_mouseup(event) {
    if (DEBUG.modal)
      console.log("modal end");
    this.end_modal();
  }]);
  _es6_module.add_class(ViewPanOp);
  function mprop_to_tprop(props, props2) {
    if (props2==undefined) {
        props2 = {};
    }
    var __iter_k1=__get_iter(Iterator(props));
    var k1;
    while (1) {
      var __ival_k1=__iter_k1.next();
      if (__ival_k1.done) {
          break;
      }
      k1 = __ival_k1.value;
      var k=k1[0];
      var p=props[k];
      var p2;
      var name=k;
      var uiname=k;
      var descr=k;
      if (p.type==MPropTypes.ELEMENT_BUF) {
          if (p.save_in_toolops) {
              var lst=list(p);
              for (var i=0; i<lst.length; i++) {
                  lst[i] = lst[i].eid;
              }
              p2 = new ElementBufProperty(lst, name, uiname, descr);
              p2.ignore = false;
          }
          else {
            p2 = new ElementBufProperty([], name, uiname, descr);
            p2.ignore = true;
          }
      }
      else 
        if (p.type==MPropTypes.INT) {
          p2 = new IntProperty(p.data, name, uiname, descr);
          p2.ignore = false;
          if (p.range!=undefined)
            p2.range = p2.ui_range = p.range;
      }
      else 
        if (p.type==MPropTypes.FLOAT) {
          p2 = new FloatProperty(p.data, name, uiname, descr);
          p2.ignore = false;
          if (p.range!=undefined)
            p2.range = p2.ui_range = p.range;
      }
      else 
        if (p.type==MPropTypes.STRING) {
          p2 = new StringProperty(p.data, name, uiname, descr);
          p2.ignore = false;
      }
      else 
        if (p.type==MPropTypes.VEC3) {
          p2 = new Vec3Property(p.data, name, uiname, descr);
          p2.ignore = false;
      }
      else 
        if (p.type==MPropTypes.BOOL) {
          p2 = new BoolProperty(p.data, name, uiname, descr);
          p2.ignore = false;
      }
      else 
        if (p.type==PropTypes.FLAG) {
          p2 = p;
      }
      if (props2.hasOwnProperty(k)) {
          props2[k].data = p2.data;
      }
      else {
        props2[k] = p2;
      }
      props[k].flag = p.flag;
    }
    return props2;
  }
  function tprop_to_mprop(mprop, tprop) {
    var __iter_k1=__get_iter(Iterator(tprop));
    var k1;
    while (1) {
      var __ival_k1=__iter_k1.next();
      if (__ival_k1.done) {
          break;
      }
      k1 = __ival_k1.value;
      var k=k1[0];
      var p=tprop[k];
      var p2=mprop[k];
      if (p.ignore)
        continue;
      if (p.type==PropTypes.BOOL) {
          p2.data = p.data;
      }
      else 
        if (p.type==PropTypes.INT) {
          p2.data = p.data;
      }
      else 
        if (p.type==PropTypes.FLOAT) {
          p2.data = p.data;
      }
      else 
        if (p.type==PropTypes.STRING) {
          p2.data = p.data;
      }
      else 
        if (p.type==PropTypes.VEC3) {
          p2.data = p.data;
      }
      else 
        if (p.type==PropTypes.FLAG) {
          p2.set_data(p.data);
      }
      else {
        throw "Unimplemented toolop->meshop type conversion";
      }
    }
    return mprop;
  }
  var MeshToolOp=_ESClass("MeshToolOp", ToolOp, [function MeshToolOp(meshop) {
    if (meshop==undefined)
      ToolOp.call(this);
    else 
      ToolOp.call(this, meshop.name, meshop.uiname, meshop.description, meshop.icon);
    this.is_modal = false;
    this.flag|=meshop.flag;
    this.meshop = meshop;
    if (this.meshop) {
        this.inputs = meshop.inputs;
        this.outputs = meshop.outputs;
    }
    this._partial = undefined;
  }, function default_inputs(ctx, get_default) {
    this.meshop.default_inputs(ctx, get_default);
  }, function undo_pre(ctx) {
    if (this.meshop.flag&ToolFlags.USE_PARTIAL_UNDO) {
        this._partial = ctx.mesh.gen_partial(ctx.mesh.selected, this.meshop.undo_expand_lvl);
    }
    else {
      var data=[];
      ctx.mesh.pack(data);
      this._mesh = new DataView(new Uint8Array(data).buffer);
    }
  }, function undo(ctx) {
    if (this.meshop.flag&ToolFlags.USE_PARTIAL_UNDO) {
        var part=this._partial;
        var mesh=ctx.mesh;
        g_app_state.jobs.kill_owner_jobs(mesh);
        mesh.load_partial(this._partial);
        mesh.regen_render();
        this._partial = undefined;
    }
    else {
      var mesh=ctx.mesh;
      var data=this._mesh;
      g_app_state.jobs.kill_owner_jobs(mesh);
      mesh.load(new Mesh());
      mesh.unpack(data, new unpack_ctx());
      mesh.regen_render();
      this._mesh = undefined;
    }
  }, function can_call(ctx) {
    return true;
  }, function exec(ctx) {
    this.meshop.inputs = this.inputs;
    g_app_state.jobs.kill_owner_jobs(ctx.mesh);
    ctx.mesh.ops.call_op(this.meshop);
    mprop_to_tprop(this.meshop.outputs, this.outputs);
    ctx.mesh.regen_render();
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=STRUCT.chain_fromSTRUCT(MeshToolOp, reader);
    ret.name = ret.meshop.name;
    ret.description = ret.meshop.description;
    ret.uiname = ret.meshop.uiname;
    ret.icon = ret.meshop.icon;
    return ret;
  })]);
  _es6_module.add_class(MeshToolOp);
  MeshToolOp.STRUCT = STRUCT.inherit(MeshToolOp, ToolOp)+"\n  meshop : abstract(MeshOp);\n}\n";
  var ToggleSubSurfOp=_ESClass("ToggleSubSurfOp", ToolOp, [function ToggleSubSurfOp() {
    ToolOp.call(this, "subsurf_toggle", "Toggle Subsurf");
    this.undoflag = UndoFlags.IGNORE_UNDO;
    this.is_modal = false;
    this.inputs = {}
    this.outputs = {}
  }, function can_call(ctx) {
    return true;
  }, function exec(ctx) {
    console.log("subsurf");
    if (ctx.view2d.ss_mesh==null) {
        ctx.mesh.regen_render();
        ctx.view2d.ss_mesh = gpu_subsurf(ctx.view2d.gl, ctx.mesh, ctx.view2d.get_ss_steps());
    }
    else {
      destroy_subsurf_mesh(ctx.view2d.gl, ctx.view2d.ss_mesh);
      ctx.view2d.ss_mesh = null;
      ctx.mesh.regen_render();
    }
  }]);
  _es6_module.add_class(ToggleSubSurfOp);
  var BasicFileDataOp=_ESClass("BasicFileDataOp", ToolOp, [function BasicFileDataOp(data) {
    ToolOp.call(this, "basic_file_with_data", "internal op (with data)", "Root operator; creates a scene with a simple cube");
    this.is_modal = false;
    this.undoflag = UndoFlags.IGNORE_UNDO|UndoFlags.IS_ROOT_OPERATOR|UndoFlags.UNDO_BARRIER;
    this.inputs = {data: new StringProperty(data, "filedata", "file data in base64")}
    this.inputs.data.flag|=TPropFlags.PRIVATE;
    this.outputs = {}
    this.saved_context = new SavedContext();
  }, function exec(ctx) {
    var data=new DataView(b64decode(this.inputs.data.data).buffer);
    console.log(this.inputs.data.data.length, data.byteLength);
    g_app_state.load_scene_file(data);
  }]);
  _es6_module.add_class(BasicFileDataOp);
  BasicFileDataOp = _es6_module.add_export('BasicFileDataOp', BasicFileDataOp);
  var Spline=es6_import_item(_es6_module, 'spline', 'Spline');
  var SplineFrameSet=es6_import_item(_es6_module, 'frameset', 'SplineFrameSet');
  var Scene=es6_import_item(_es6_module, 'scene', 'Scene');
  var BasicFileOp=_ESClass("BasicFileOp", ToolOp, [function BasicFileOp() {
    ToolOp.call(this, "basic_file", "internal op", "Root operator; creates a scene with a simple cube");
    this.is_modal = false;
    this.undoflag = UndoFlags.IS_ROOT_OPERATOR|UndoFlags.UNDO_BARRIER;
    this.inputs = {}
    this.outputs = {}
  }, function exec(ctx) {
    var datalib=ctx.datalib;
    var splineset=new SplineFrameSet();
    splineset.set_fake_user();
    datalib.add(splineset);
    var scene=new Scene();
    scene.set_fake_user();
    datalib.add(scene);
  }]);
  _es6_module.add_class(BasicFileOp);
  BasicFileOp = _es6_module.add_export('BasicFileOp', BasicFileOp);
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var FrameChangeOp=_ESClass("FrameChangeOp", ToolOp, [function FrameChangeOp(frame) {
    ToolOp.call(this);
    this._undo = undefined;
    if (frame!=undefined)
      this.inputs.frame.set_data(frame);
  }, function undo_pre(ctx) {
    this._undo = ctx.scene.time;
  }, function undo(ctx) {
    ctx.scene.change_time(ctx, this._undo);
  }, function exec(ctx) {
    ctx.scene.change_time(ctx, this.inputs.frame.data);
  }]);
  _es6_module.add_class(FrameChangeOp);
  FrameChangeOp = _es6_module.add_export('FrameChangeOp', FrameChangeOp);
  FrameChangeOp.inputs = {frame: new FloatProperty(0, "frame", "frame", "frame")}
  var SimpleCanvasDraw2D=es6_import_item(_es6_module, 'vectordraw_canvas2d_simple', 'SimpleCanvasDraw2D');
  var draw_spline=es6_import_item(_es6_module, 'spline_draw', 'draw_spline');
  var save_file=es6_import_item(_es6_module, 'fileapi', 'save_file');
  var patch_canvas2d=es6_import_item(_es6_module, 'spline_draw', 'patch_canvas2d');
  var set_rendermat=es6_import_item(_es6_module, 'spline_draw', 'set_rendermat');
  var SplineDrawer=es6_import_item(_es6_module, 'spline_draw_new', 'SplineDrawer');
  var ExportCanvasImage=_ESClass("ExportCanvasImage", ToolOp, [_ESClass.static(function tooldef() {
    return {apiname: "view2d.export_image", uiname: "Save Canvas Image", description: "Export visible canvas", undoflag: UndoFlags.IGNORE_UNDO}
  }), function exec(ctx) {
    var view2d=g_app_state.active_view2d;
    var spline=ctx.frameset.spline;
    var canvas=document.createElement("canvas");
    canvas.width = view2d.size[0];
    canvas.height = view2d.size[1];
    var g=canvas.getContext("2d");
    patch_canvas2d(g);
    set_rendermat(g, view2d.rendermat);
    var vecdrawer=new SimpleCanvasDraw2D();
    vecdrawer.canvas = canvas;
    vecdrawer.g = g;
    var drawer=new SplineDrawer(spline, vecdrawer);
    var old=spline.drawer;
    spline.drawer = drawer;
    console.log("saving image. . .");
    drawer.recalc_all = true;
    drawer.update(spline, spline.drawlist, spline.draw_layerlist, view2d.rendermat, [], view2d.only_render, view2d.selectmode, g, view2d.zoom, view2d);
    try {
      draw_spline(spline, [], g, view2d, view2d.selectmode, view2d.only_render, view2d.draw_normals, 1.0, true, ctx.frameset.time);
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
    for (var i=0; i<data.length; i++) {
        data[i] = url.charCodeAt(i);
    }
    save_file(data, true, false, "PNG", ["png"], function() {
      console.trace("ERROR ERROR!!\n");
      g_app_state.notes.label("Error drawing canvas");
      return ;
    });
  }, function ExportCanvasImage() {
    ToolOp.apply(this, arguments);
  }]);
  _es6_module.add_class(ExportCanvasImage);
  ExportCanvasImage = _es6_module.add_export('ExportCanvasImage', ExportCanvasImage);
  
}, '/dev/fairmotion/src/editors/viewport/view2d_ops.js');
es6_module_define('view2d_spline_ops', ["spline_types", "UIWidgets_special", "UIPack", "spline_createops", "struct", "lib_api", "spline_draw", "ScreenArea", "transform_ops", "UIWidgets", "events", "multires_selectops", "UIMenu", "view2d_editor", "UIFrame", "spline_selectops", "toolops_api", "UIElement", "spline", "spline_editops", "UICanvas", "spline_multires", "transform", "selectmode", "animdata", "multires_ops"], function _view2d_spline_ops_module(_es6_module) {
  "use strict";
  var ExtrudeVertOp=es6_import_item(_es6_module, 'spline_createops', 'ExtrudeVertOp');
  var toolop_menu=es6_import_item(_es6_module, 'UIMenu', 'toolop_menu');
  var DeleteVertOp=es6_import_item(_es6_module, 'spline_editops', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, 'spline_editops', 'DeleteSegmentOp');
  var CreateMResPoint=es6_import_item(_es6_module, 'multires_ops', 'CreateMResPoint');
  var mr_selectops=es6_import(_es6_module, 'multires_selectops');
  var spline_selectops=es6_import(_es6_module, 'spline_selectops');
  var WidgetResizeOp=es6_import_item(_es6_module, 'transform_ops', 'WidgetResizeOp');
  var WidgetRotateOp=es6_import_item(_es6_module, 'transform_ops', 'WidgetRotateOp');
  var compose_id=es6_import_item(_es6_module, 'spline_multires', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, 'spline_multires', 'decompose_id');
  var MResFlags=es6_import_item(_es6_module, 'spline_multires', 'MResFlags');
  var MultiResLayer=es6_import_item(_es6_module, 'spline_multires', 'MultiResLayer');
  var ScreenArea, Area;
  var get_2d_canvas=es6_import_item(_es6_module, 'UICanvas', 'get_2d_canvas');
  var get_2d_canvas_2=es6_import_item(_es6_module, 'UICanvas', 'get_2d_canvas_2');
  var gen_editor_switcher=es6_import_item(_es6_module, 'UIWidgets_special', 'gen_editor_switcher');
  var DataTypes=es6_import_item(_es6_module, 'lib_api', 'DataTypes');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var EditModes=es6_import_item(_es6_module, 'view2d_editor', 'EditModes');
  var KeyMap=es6_import_item(_es6_module, 'events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, 'events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, 'events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, 'events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, 'events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, 'events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, 'events', 'EventHandler');
  var SelectLinkedOp=es6_import_item(_es6_module, 'spline_selectops', 'SelectLinkedOp');
  var SelectOneOp=es6_import_item(_es6_module, 'spline_selectops', 'SelectOneOp');
  var TranslateOp=es6_import_item(_es6_module, 'transform', 'TranslateOp');
  var SelMask=es6_import_item(_es6_module, 'selectmode', 'SelMask');
  var ToolModes=es6_import_item(_es6_module, 'selectmode', 'ToolModes');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineVertex=es6_import_item(_es6_module, 'spline_types', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, 'spline_types', 'SplineSegment');
  var SplineFace=es6_import_item(_es6_module, 'spline_types', 'SplineFace');
  var Spline=es6_import_item(_es6_module, 'spline', 'Spline');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var UIMenuLabel=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuLabel');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UIMenu=es6_import_item(_es6_module, 'UIMenu', 'UIMenu');
  var View2DEditor=es6_import_item(_es6_module, 'view2d_editor', 'View2DEditor');
  var SessionFlags=es6_import_item(_es6_module, 'view2d_editor', 'SessionFlags');
  var DataBlock=es6_import_item(_es6_module, 'lib_api', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, 'lib_api', 'DataTypes');
  var redraw_element=es6_import_item(_es6_module, 'spline_draw', 'redraw_element');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var get_vtime=es6_import_item(_es6_module, 'animdata', 'get_vtime');
  window.anim_to_playback = [];
  var RenderAnimOp=_ESClass("RenderAnimOp", ToolOp, [function RenderAnimOp() {
    ToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Render", apiname: "view2d.render_anim", is_modal: true, inputs: {}, outputs: {}, undoflag: UndoFlags.IGNORE_UNDO}
  }), function start_modal(ctx) {
    ToolOp.prototype.start_modal.call(this, ctx);
    console.log("Anim render start!");
    window.anim_to_playback = [];
    window.anim_to_playback.filesize = 0;
    this.viewport = {pos: [ctx.view2d.abspos[0], window.innerHeight-(ctx.view2d.abspos[1]+ctx.view2d.size[1])], size: [ctx.view2d.size[0], ctx.view2d.size[1]]}
    window.anim_to_playback.viewport = this.viewport;
    var this2=this;
    var pathspline=ctx.frameset.pathspline;
    var min_time=1e+17, max_time=0;
    var __iter_v=__get_iter(pathspline.verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
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
    this.timer = window.setInterval(function() {
      this2.render_frame();
    }, 10);
  }, function render_frame() {
    var ctx=this.modal_ctx;
    if (ctx==undefined||!this.modal_running) {
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
    var frame={time: scene.time, data: idata}
    window.anim_to_playback.push(frame);
    window.anim_to_playback.filesize+=image.length;
    scene.change_time(ctx, scene.time+1);
    window.redraw_viewport();
  }, function end(ctx) {
    if (this.timer!=undefined)
      window.clearInterval(this.timer);
    this.end_modal();
  }, function on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Escape"]:
        this.end(this.modal_ctx);
    }
  }]);
  _es6_module.add_class(RenderAnimOp);
  RenderAnimOp = _es6_module.add_export('RenderAnimOp', RenderAnimOp);
  var PlayAnimOp=_ESClass("PlayAnimOp", ToolOp, [function PlayAnimOp() {
    ToolOp.call(this);
  }, _ESClass.static(function tooldef() {
    return {uiname: "Play", apiname: "view2d.play_anim", is_modal: true, inputs: {}, outputs: {}, undoflag: UndoFlags.IGNORE_UNDO}
  }), function start_modal(ctx) {
    ToolOp.prototype.start_modal.call(this, ctx);
    console.log("Anim render start!");
    this.viewport = {pos: [ctx.view2d.abspos[0], window.innerHeight-(ctx.view2d.abspos[1]+ctx.view2d.size[1])], size: [ctx.view2d.size[0], ctx.view2d.size[1]]}
    var this2=this;
    var pathspline=ctx.frameset.pathspline;
    this.start_time = time_ms();
    this.timer = window.setInterval(function() {
      if (this2.doing_draw)
        return ;
      this2.render_frame();
    }, 10);
  }, function render_frame() {
    var ctx=this.modal_ctx;
    if (ctx==undefined||!this.modal_running) {
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
    var pos=ctx.view2d.abspos;
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
    }
    requestAnimationFrame(draw);
  }, function end(ctx) {
    if (this.timer!=undefined)
      window.clearInterval(this.timer);
    this.end_modal();
  }, function on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Escape"]:
        this.end(this.modal_ctx);
    }
  }]);
  _es6_module.add_class(PlayAnimOp);
  PlayAnimOp = _es6_module.add_export('PlayAnimOp', PlayAnimOp);
  var $ops_mgJe_tools_menu;
  var $rect_PuRg_handle_mres_mousemove;
  var SplineEditor=_ESClass("SplineEditor", View2DEditor, [function SplineEditor(view2d) {
    var keymap=new KeyMap();
    View2DEditor.call(this, "Geometry", EditModes.GEOMETRY, DataTypes.FRAMESET, keymap);
    this.mpos = new Vector3();
    this.start_mpos = new Vector3();
    this.define_keymap();
    this.vieiw3d = view2d;
    this.highlight_spline = undefined;
  }, function on_area_inactive(view2d) {
  }, function editor_duplicate(view2d) {
    var m=new SplineEditor(view2d);
    m.selectmode = this.selectmode;
    m.keymap = this.keymap;
    return m;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var m=new SplineEditor(undefined);
    reader(m);
    return m;
  }), function data_link(block, getblock, getblock_us) {
    this.ctx = new Context();
  }, function add_menu(view2d, mpos, add_title) {
    if (add_title==undefined) {
        add_title = true;
    }
    this.ctx = new Context();
    console.log("Add menu");
    var oplist=[];
    var menu=toolop_menu(view2d.ctx, add_title ? "Add" : "", oplist);
    return menu;
  }, function on_tick(ctx) {
    let widgets=[WidgetResizeOp, WidgetRotateOp];
    if (ctx.view2d.toolmode==ToolModes.RESIZE) {
        ctx.view2d.widgets.ensure_toolop(ctx, WidgetResizeOp);
    }
    else 
      if (ctx.view2d.toolmode==ToolModes.ROTATE) {
        ctx.view2d.widgets.ensure_toolop(ctx, WidgetRotateOp);
    }
    else {
      var __iter_cls=__get_iter(widgets);
      var cls;
      while (1) {
        var __ival_cls=__iter_cls.next();
        if (__ival_cls.done) {
            break;
        }
        cls = __ival_cls.value;
        ctx.view2d.widgets.ensure_not_toolop(ctx, cls);
      }
    }
  }, function build_sidebar1(view2d, col) {
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
    blank.get_min_size = function() {
      return this.size;
    }
    col.add(blank);
    col.toolop("spline.make_edge()");
    col.toolop("spline.make_edge_face()");
    col.toolop("spline.split_pick_edge()");
    col.toolop("spline.change_face_z(offset=1, selmode=selectmode)", PackFlags.USE_LARGE_ICON, "Move Up", Icons.Z_UP);
    col.toolop("spline.change_face_z(offset=-1, selmode=selectmode)", PackFlags.USE_LARGE_ICON, "Move Down", Icons.Z_DOWN);
    col.prop("view2d.draw_anim_paths");
  }, function build_bottombar(view2d, col) {
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
  }, function define_keymap() {
    var k=this.keymap;
    k.add_tool(new KeyHandler("PageUp", [], "Send Face Up"), "spline.change_face_z(offset=1, selmode=selectmode)");
    k.add_tool(new KeyHandler("PageDown", [], "Send Face Down"), "spline.change_face_z(offset=-1, selmode=selectmode)");
    k.add_tool(new KeyHandler("G", [], "Translate"), "spline.translate(datamode=selectmode)");
    k.add_tool(new KeyHandler("S", [], "Scale"), "spline.scale(datamode=selectmode)");
    k.add_tool(new KeyHandler("S", ["SHIFT"], "Scale Time"), "spline.shift_time()");
    k.add_tool(new KeyHandler("R", [], "Rotate"), "spline.rotate(datamode=selectmode)");
    k.add_tool(new KeyHandler("A", [], "Select Linked"), "spline.toggle_select_all()");
    k.add_tool(new KeyHandler("A", ["ALT"], "Animation Playback"), "editor.playback()");
    k.add_tool(new KeyHandler("H", [], "Hide Selection"), "spline.hide(selmode=selectmode)");
    k.add_tool(new KeyHandler("H", ["ALT"], "Reveal Selection"), "spline.unhide(selmode=selectmode)");
    k.add_tool(new KeyHandler("G", ["CTRL"], "Ghost Selection"), "spline.hide(selmode=selectmode, ghost=1)");
    k.add_tool(new KeyHandler("G", ["ALT"], "Unghost Selection"), "spline.unhide(selmode=selectmode, ghost=1)");
    k.add(new KeyHandler("L", [], "Select Linked"), new FuncKeyHandler(function(ctx) {
      var mpos=ctx.keymap_mpos;
      var ret=ctx.spline.q.findnearest_vert(ctx.view2d, mpos, 55, undefined, ctx.view2d.edit_all_layers);
      console.log("select linked", ret);
      if (ret!=undefined) {
          var tool=new SelectLinkedOp(true, ctx.view2d.selectmode);
          tool.inputs.vertex_eid.set_data(ret[0].eid);
          tool.inputs.mode.set_data("select");
          ctx.appstate.toolstack.exec_tool(tool);
      }
    }));
    var this2=this;
    k.add(new KeyHandler("T", [], "Cycle Select Mode"), new FuncKeyHandler(function(ctx) {
      var s=ctx.view2d.selectmode, s2;
      if (s==SelMask.VERTEX)
        s2 = SelMask.SEGMENT;
      else 
        if (s==SelMask.SEGMENT)
        s2 = SelMask.FACE;
      else 
        s2 = SelMask.VERTEX;
      console.log("toggle select mode", s, s2, SelMask.SEGMENT, SelMask.FACE);
      console.log(s==SelMask.VERTEX, s==(SelMask.VERTEX|SelMask.HANDLE), (s==SelMask.SEGMENT));
      ctx.view2d.set_selectmode(s2);
    }));
    k.add(new KeyHandler("L", ["SHIFT"], "Select Linked"), new FuncKeyHandler(function(ctx) {
      var mpos=ctx.keymap_mpos;
      var ret=ctx.spline.q.findnearest_vert(ctx.view2d, mpos, 55, undefined, ctx.view2d.edit_all_layers);
      if (ret!=undefined) {
          var tool=new SelectLinkedOp(true);
          tool.inputs.vertex_eid.set_data(ret[0].eid);
          tool.inputs.mode.set_data("deselect");
          ctx.appstate.toolstack.exec_tool(tool);
      }
    }));
    k.add_tool(new KeyHandler("B", [], "Toggle Break-Tangents"), "spline.toggle_break_tangents()");
    k.add_tool(new KeyHandler("B", ["SHIFT"], "Toggle Break-Curvature"), "spline.toggle_break_curvature()");
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
    k.add(new KeyHandler("X", [], "Delete"), new FuncKeyHandler(del_tool));
    k.add(new KeyHandler("Delete", [], "Delete"), new FuncKeyHandler(del_tool));
    k.add(new KeyHandler("Backspace", [], "Delete"), new FuncKeyHandler(del_tool));
    k.add_tool(new KeyHandler("D", [], "Dissolve Vertices"), "spline.dissolve_verts()");
    k.add_tool(new KeyHandler("D", ["SHIFT"], "Duplicate"), "spline.duplicate_transform()");
    k.add_tool(new KeyHandler("F", [], "Create Face/Edge"), "spline.make_edge_face()");
    k.add_tool(new KeyHandler("E", [], "Split Segments"), "spline.split_edges()");
    k.add_tool(new KeyHandler("M", [], "Mirror Verts"), "spline.mirror_verts()");
    k.add_tool(new KeyHandler("C", [], "Circle Select"), "view2d.circle_select()");
    k.add(new KeyHandler("Z", [], "Toggle Only Render"), new FuncKeyHandler(function(ctx) {
      ctx.view2d.only_render^=1;
      window.redraw_viewport();
    }));
    k.add(new KeyHandler("W", [], "Tools Menu"), new FuncKeyHandler(function(ctx) {
      var mpos=ctx.keymap_mpos;
      ctx.view2d.tools_menu(ctx, mpos);
    }));
  }, function set_selectmode(mode) {
    this.selectmode = mode;
  }, function do_select(event, mpos, view2d, do_multiple) {
    if (do_multiple==undefined) {
        do_multiple = false;
    }
    return false;
  }, function tools_menu(ctx, mpos, view2d) {
    var menu=view2d.toolop_menu(ctx, "Tools", $ops_mgJe_tools_menu);
    view2d.call_menu(menu, view2d, mpos);
  }, function on_inactive(view2d) {
  }, function on_active(view2d) {
  }, function rightclick_menu(event, view2d) {
  }, function _get_spline() {
    return this.ctx.spline;
  }, function on_mousedown(event) {
    var spline=this.ctx.spline;
    var toolmode=this.ctx.view2d.toolmode;
    if (this.highlight_spline!=undefined) {
    }
    if (this.highlight_spline!=undefined&&this.highlight_spline!==spline) {
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
        can_append = can_append&&spline.verts.highlight==undefined&&spline.handles.highlight==undefined;
        if (can_append) {
            var co=new Vector3([event.x, event.y, 0]);
            this.view2d.unproject(co);
            var op=new ExtrudeVertOp(co, this.ctx.view2d.extrude_mode);
            op.inputs.linewidth.set_data(this.ctx.view2d.default_linewidth);
            op.inputs.stroke.set_data(this.ctx.view2d.default_stroke);
            g_app_state.toolstack.exec_tool(op);
            redraw_viewport();
        }
        else 
          if (can_append&&(this.selectmode&SelMask.MULTIRES)) {
            var ret=this.findnearest([event.x, event.y, 0], SelMask.MULTIRES, this.ctx.view2d.edit_all_layers);
            console.log(ret);
            if (ret!=undefined) {
                var seg=decompose_id(ret[1])[0];
                var p=decompose_id(ret[1])[1];
                var spline=ret[0];
                seg = spline.eidmap[seg];
                var mr=seg.cdata.get_layer(MultiResLayer);
                p = mr.get(p);
                var tool=new mr_selectops.SelectOneOp(ret[1], !event.shiftKey, !event.shiftKey||!(p.flag&MResFlags.SELECT), spline.actlevel);
                g_app_state.toolstack.exec_tool(tool);
            }
            else {
              this.mres_make_point(event, 75);
              redraw_viewport([-1000, -1000], [1000, 1000]);
            }
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
  }, function ensure_paths_off() {
    if (g_app_state.active_splinepath!="frameset.drawspline") {
        this.highlight_spline = undefined;
        var spline=this.ctx.spline;
        g_app_state.switch_active_spline("frameset.drawspline");
        spline.clear_highlight();
        spline.solve();
        redraw_viewport();
    }
  }, _ESClass.get(function draw_anim_paths() {
    return this.ctx.view2d.draw_anim_paths;
  }), function findnearest(mpos, selectmask, limit, ignore_layers) {
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
  }, function mres_make_point(event, limit) {
    console.log("make point");
    var view2d=this.ctx.view2d;
    var co=new Vector3([event.x, event.y, 0]);
    view2d.reset_drawlines("mres");
    view2d.unproject(co);
    var ret=this.findnearest([event.x, event.y, 0], SelMask.SEGMENT, limit, this.ctx.view2d.edit_all_layers);
    if (ret==undefined)
      return ;
    var spline=ret[0];
    var seg=ret[1];
    var p=seg.closest_point(co);
    if (p==undefined)
      return ;
    console.log(p);
    var tool=new CreateMResPoint(seg, co);
    g_app_state.toolstack.exec_tool(tool);
  }, function handle_mres_mousemove(event, limit) {
    var view2d=this.ctx.view2d;
    var co=new Vector3([event.x, event.y, 0]);
    view2d.reset_drawlines("mres");
    view2d.unproject(co);
    var pid=this.findnearest([event.x, event.y, 0], SelMask.MULTIRES, limit);
    if (pid!=undefined) {
        var spline=pid[0];
        var seg=decompose_id(pid[1]), p;
        p = seg[1], seg = seg[0];
        seg = spline.eidmap[seg];
        if (seg==undefined) {
            console.log("ERROR: CORRUPTED MRES DATA!");
        }
        var mr=seg.cdata.get_layer(MultiResLayer);
        var __iter_seg2=__get_iter(spline.segments);
        var seg2;
        while (1) {
          var __ival_seg2=__iter_seg2.next();
          if (__ival_seg2.done) {
              break;
          }
          seg2 = __ival_seg2.value;
          var mr2=seg2.cdata.get_layer(MultiResLayer);
          var __iter_p2=__get_iter(mr2.points(spline.actlevel));
          var p2;
          while (1) {
            var __ival_p2=__iter_p2.next();
            if (__ival_p2.done) {
                break;
            }
            p2 = __ival_p2.value;
            p2.flag&=~MResFlags.HIGHLIGHT;
          }
        }
        p = mr.get(p);
        p.flag|=MResFlags.HIGHLIGHT;
        $rect_PuRg_handle_mres_mousemove[0].load(p).subScalar(10);
        $rect_PuRg_handle_mres_mousemove[1].load(p).addScalar(10);
        $rect_PuRg_handle_mres_mousemove[0][2] = $rect_PuRg_handle_mres_mousemove[1][2] = 0.0;
        window.redraw_viewport($rect_PuRg_handle_mres_mousemove[0], $rect_PuRg_handle_mres_mousemove[1]);
    }
    var ret=this.findnearest([event.x, event.y, 0], SelMask.SEGMENT, limit);
    if (ret!=undefined) {
        var spline=ret[0];
        var seg=ret[1];
        var p=seg.closest_point(co);
        if (p==undefined)
          return ;
        var dl=view2d.make_drawline(co, p[0], "mres");
    }
  }, function on_mousemove(event) {
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
    if (selectmode&SelMask.MULTIRES) {
        this.handle_mres_mousemove(event, 75);
    }
    if (this.mdown) {
        this.mdown = false;
        var op=new TranslateOp(this.start_mpos);
        op.inputs.datamode.set_data(this.ctx.view2d.selectmode);
        op.inputs.edit_all_layers.set_data(this.ctx.view2d.edit_all_layers);
        var ctx=new Context();
        if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
            op.inputs.proportional.set_data(true);
            op.inputs.propradius.set_data(ctx.view2d.propradius);
        }
        g_app_state.toolstack.exec_tool(op);
        return ;
    }
    if (this.mdown)
      return ;
    var ret=this.findnearest([event.x, event.y], this.ctx.view2d.selectmode, limit, this.ctx.view2d.edit_all_layers);
    if (ret!=undefined&&typeof (ret[1])!="number"&&ret[2]!=SelMask.MULTIRES) {
        if (this.highlight_spline!=undefined) {
            var __iter_list=__get_iter(this.highlight_spline.elists);
            var list;
            while (1) {
              var __ival_list=__iter_list.next();
              if (__ival_list.done) {
                  break;
              }
              list = __ival_list.value;
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
  }, function on_mouseup(event) {
    var spline=this._get_spline();
    spline.size = [window.innerWidth, window.innerHeight];
    this.mdown = false;
  }, function do_alt_select(event, mpos, view2d) {
  }, function gen_edit_menu(add_title) {
    if (add_title==undefined) {
        add_title = false;
    }
    var view2d=this.view2d;
    var ctx=new Context();
    var ops=["spline.select_linked(vertex_eid=active_vertex())", "view2d.circle_select()", "spline.toggle_select_all()", "spline.hide()", "spline.unhide()", "spline.connect_handles()", "spline.disconnect_handles()", "spline.duplicate_transform()", "spline.mirror_verts()", "spline.split_edges()", "spline.make_edge_face()", "spline.dissolve_verts()", "spline.delete_verts()", "spline.delete_segments()", "spline.delete_faces()", "spline.split_edges()", "spline.toggle_manual_handles()"];
    ops.reverse();
    var menu=view2d.toolop_menu(ctx, add_title ? "Edit" : "", ops);
    return menu;
  }, function delete_menu(event) {
    var view2d=this.view2d;
    var ctx=new Context();
    var menu=this.gen_delete_menu(true);
    menu.close_on_right = true;
    menu.swap_mouse_button = 2;
    view2d.call_menu(menu, view2d, [event.x, event.y]);
  }]);
  var $ops_mgJe_tools_menu=["spline.key_edges()", "spline.key_current_frame()", "spline.connect_handles()", "spline.disconnect_handles()", "spline.toggle_step_mode()", "spline.toggle_manual_handles()", "editor.paste_pose()", "editor.copy_pose()"];
  var $rect_PuRg_handle_mres_mousemove=[new Vector3(), new Vector3()];
  _es6_module.add_class(SplineEditor);
  SplineEditor = _es6_module.add_export('SplineEditor', SplineEditor);
  SplineEditor.STRUCT = "\n  SplineEditor {\n    selectmode : int;\n  }\n";
  var ScreenArea=es6_import_item(_es6_module, 'ScreenArea', 'ScreenArea');
  var Area=es6_import_item(_es6_module, 'ScreenArea', 'Area');
}, '/dev/fairmotion/src/editors/viewport/view2d_spline_ops.js');
es6_module_define('animspline', ["lib_api", "spline", "spline_element_array", "spline_types", "animdata", "struct", "toolprops"], function _animspline_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var DataBlock=es6_import_item(_es6_module, 'lib_api', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, 'lib_api', 'DataTypes');
  var Spline=es6_import_item(_es6_module, 'spline', 'Spline');
  var RestrictFlags=es6_import_item(_es6_module, 'spline', 'RestrictFlags');
  var CustomDataLayer=es6_import_item(_es6_module, 'spline_types', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineSegment=es6_import_item(_es6_module, 'spline_types', 'SplineSegment');
  var TimeDataLayer=es6_import_item(_es6_module, 'animdata', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, 'animdata', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, 'animdata', 'set_vtime');
  var AnimChannel=es6_import_item(_es6_module, 'animdata', 'AnimChannel');
  var AnimKey=es6_import_item(_es6_module, 'animdata', 'AnimKey');
  var AnimInterpModes=es6_import_item(_es6_module, 'animdata', 'AnimInterpModes');
  var AnimKeyFlags=es6_import_item(_es6_module, 'animdata', 'AnimKeyFlags');
  var SplineLayerFlags=es6_import_item(_es6_module, 'spline_element_array', 'SplineLayerFlags');
  var SplineLayerSet=es6_import_item(_es6_module, 'spline_element_array', 'SplineLayerSet');
  es6_import(_es6_module, 'struct');
  var restrictflags=RestrictFlags.NO_DELETE|RestrictFlags.NO_EXTRUDE|RestrictFlags.NO_CONNECT;
  var vertanimdata_eval_cache=cachering.fromConstructor(Vector3, 64);
  var AnimChannel=es6_import_item(_es6_module, 'animdata', 'AnimChannel');
  var AnimKey=es6_import_item(_es6_module, 'animdata', 'AnimKey');
  var PropTypes=es6_import_item(_es6_module, 'toolprops', 'PropTypes');
  var VertexAnimIter=_ESClass("VertexAnimIter", [function VertexAnimIter(vd) {
    this.ret = {done: false, value: undefined}
    this.stop = false;
    if (vd!=undefined)
      VertexAnimIter.init(this, vd);
  }, function init(vd) {
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
  }, _ESClass.symbol(Symbol.iterator, function iterator(self) {
    return this;
  }), function next() {
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
  }]);
  _es6_module.add_class(VertexAnimIter);
  VertexAnimIter = _es6_module.add_export('VertexAnimIter', VertexAnimIter);
  var SegmentAnimIter=_ESClass("SegmentAnimIter", [function SegmentAnimIter(vd) {
    this.ret = {done: false, value: undefined}
    this.stop = false;
    if (this.v!=undefined&&this.v.segments.length!=0)
      if (vd!=undefined)
      SegmentAnimIter.init(this, vd);
  }, function init(vd) {
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
  }, _ESClass.symbol(Symbol.iterator, function iterator(self) {
    return this;
  }), function next() {
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
  }]);
  _es6_module.add_class(SegmentAnimIter);
  SegmentAnimIter = _es6_module.add_export('SegmentAnimIter', SegmentAnimIter);
  var VDAnimFlags={STEP_FUNC: 2}
  VDAnimFlags = _es6_module.add_export('VDAnimFlags', VDAnimFlags);
  var VertexAnimData=_ESClass("VertexAnimData", [function VertexAnimData(eid, pathspline) {
    this.eid = eid;
    this.vitercache = cachering.fromConstructor(VertexAnimIter, 4);
    this.sitercache = cachering.fromConstructor(SegmentAnimIter, 4);
    this.spline = pathspline;
    this.animflag = 0;
    this.flag = 0;
    this.visible = false;
    this.path_times = {}
    this.startv_eid = -1;
    if (pathspline!=undefined) {
        var layer=pathspline.layerset.new_layer();
        layer.flag|=SplineLayerFlags.HIDE;
        this.layerid = layer.id;
    }
    this._start_layer_id = undefined;
    this.cur_time = 0;
  }, _ESClass.get(function startv() {
    if (this.startv_eid==-1)
      return undefined;
    return this.spline.eidmap[this.startv_eid];
  }), _ESClass.set(function startv(v) {
    if (typeof v=="number") {
        this.startv_eid = v;
        return ;
    }
    if (v!=undefined) {
        this.startv_eid = v.eid;
    }
    else {
      this.startv_eid = -1;
    }
  }), function _set_layer() {
    if (this.spline.layerset.active.id!=this.layerid)
      this._start_layer_id = this.spline.layerset.active.id;
    if (this.layerid==undefined) {
        console.log("Error in _set_layer in VertexAnimData!!!");
        return ;
    }
    this.spline.layerset.active = this.spline.layerset.idmap[this.layerid];
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    return this.eid;
  }), function _unset_layer() {
    if (this._start_layer_id!=undefined) {
        var layer=this.spline.layerset.idmap[this._start_layer_id];
        if (layer!=undefined)
          this.spline.layerset.active = layer;
    }
    this._start_layer_id = undefined;
  }, _ESClass.get(function verts() {
    return this.vitercache.next().init(this);
  }), _ESClass.get(function segments() {
    return this.sitercache.next().init(this);
  }), function find_seg(time) {
    var v=this.startv;
    if (v==undefined)
      return undefined;
    if (v.segments.length==0)
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
  }, function _get_animdata(v) {
    let ret=v.cdata.get_layer(TimeDataLayer);
    ret.owning_veid = this.eid;
    return ret;
  }, function update(co, time) {
    this._set_layer();
    if (time<0) {
        console.trace("ERROR! negative times not supported!");
        this._unset_layer();
        return ;
    }
    if (this.startv==undefined) {
        this.startv = this.spline.make_vertex(co);
        this._get_animdata(this.startv).time = 1;
        this.spline.regen_sort();
        this.spline.resolve = 1;
    }
    var spline=this.spline;
    var seg=this.find_seg(time);
    if (seg==undefined) {
        var e=this.endv;
        if (this._get_animdata(e).time==time) {
            e.load(co);
            e.flag|=SplineFlags.UPDATE;
        }
        else {
          var nv=spline.make_vertex(co);
          this._get_animdata(nv).time = time;
          spline.make_segment(e, nv);
          spline.regen_sort();
        }
    }
    else {
      if (get_vtime(seg.v1)==time) {
          seg.v1.load(co);
          seg.v1.flag|=SplineFlags.UPDATE;
      }
      else 
        if (get_vtime(seg.v2)==time) {
          seg.v2.load(co);
          seg.v2.flag|=SplineFlags.UPDATE;
      }
      else {
        var ret=spline.split_edge(seg);
        var nv=ret[1];
        spline.regen_sort();
        this._get_animdata(nv).time = time;
        nv.load(co);
      }
    }
    spline.resolve = 1;
    this._unset_layer();
  }, _ESClass.get(function start_time() {
    var v=this.startv;
    if (v==undefined)
      return 0;
    return get_vtime(v);
  }), _ESClass.get(function end_time() {
    var v=this.endv;
    if (v==undefined)
      return 0;
    return get_vtime(v);
  }), function draw(g, alpha, time) {
    if (!(this.visible))
      return ;
    var step_func=this.animflag&VDAnimFlags.STEP_FUNC;
    var start=this.start_time, end=this.end_time;
    g.lineWidth = 1.0;
    g.strokeStyle = "rgba(100,100,100,"+alpha+")";
    var dt=1.0;
    var lastco=undefined;
    for (var t=start; t<end; t+=dt) {
        var co=this.evaluate(t);
        var dv=this.derivative(t);
        var tmp=dv[0];
        dv[0] = -dv[1];
        dv[1] = tmp;
        dv.normalize().mulScalar(3);
        g.beginPath();
        var green=Math.floor(((t-start)/(end-start))*255);
        g.strokeStyle = "rgba(10, "+green+",10,"+alpha+")";
        g.moveTo(co[0]-dv[0], co[1]-dv[1]);
        g.lineTo(co[0], co[1]);
        g.lineTo(co[0]-dv[0], co[1]-dv[1]);
        g.stroke();
        if (lastco!=undefined) {
            g.moveTo(lastco[0], lastco[1]);
            g.lineTo(co[0], co[1]);
            g.stroke();
        }
        lastco = co;
    }
  }, function derivative(time) {
    var df=0.01;
    var a=this.evaluate(time);
    var b=this.evaluate(time+df);
    b.sub(a).mulScalar(1.0/df);
    return b;
  }, function evaluate(time) {
    var v=this.startv;
    var step_func=this.animflag&VDAnimFlags.STEP_FUNC;
    if (v==undefined)
      return vertanimdata_eval_cache.next().zero();
    var co=vertanimdata_eval_cache.next();
    if (time<=get_vtime(v)) {
        co.load(v);
        return co;
    }
    if (v.segments.length==0) {
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
    var alen1=s!=undefined ? s.length : 1, alen2=alen1;
    var alen0=lasts!=undefined ? lasts.length : alen1, alen3=alen1;
    if (v.segments.length==2) {
        var nexts=v.other_segment(s);
        nextv = nexts.other_vert(v);
        alen2 = nexts.length;
        alen3 = alen2;
    }
    nextv2 = nextv;
    if (nextv2.segments.length==2) {
        var nexts2=nextv2.other_segment(nexts);
        nextv2 = nexts2.other_vert(nextv2);
        alen3 = nexts2.length;
    }
    if (lastv==v||get_vtime(lastv)==time) {
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
      co.load(s.evaluate(lastv==s.v1 ? t : 1-t));
    }
    return co;
  }, _ESClass.get(function endv() {
    var v=this.startv;
    if (v==undefined)
      return undefined;
    if (v.segments.length==0)
      return v;
    var s=v.segments[0];
    while (1) {
      v = s.other_vert(v);
      if (v.segments.length<2)
        break;
      s = v.other_segment(s);
    }
    return v;
  }), function check_time_integrity() {
    var lasttime=-100000;
    var __iter_v=__get_iter(this.verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      var t=get_vtime(v);
      if (t<=lasttime) {
          console.log("Found timing integrity error for vertex", this.eid, "path vertex:", v.eid);
          this.regen_topology();
          return true;
      }
      lasttime = t;
    }
    return false;
  }, function regen_topology() {
    var spline=this.spline;
    var verts=[];
    var segs=new set();
    var visit=new set();
    var handles=[];
    var lastv=undefined;
    var hi=0;
    var __iter_v=__get_iter(this.verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      if (visit.has(v)) {
          continue;
      }
      visit.add(v);
      verts.push(v);
      handles.push(undefined);
      handles.push(undefined);
      hi+=2;
      v.flag|=SplineFlags.UPDATE;
      var __iter_s=__get_iter(v.segments);
      var s;
      while (1) {
        var __ival_s=__iter_s.next();
        if (__ival_s.done) {
            break;
        }
        s = __ival_s.value;
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
    verts.sort(function(a, b) {
      return get_vtime(a)-get_vtime(b);
    });
    var __iter_s=__get_iter(segs);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
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
    var __iter_v=__get_iter(verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      var __iter_s=__get_iter(v.segments);
      var s;
      while (1) {
        var __ival_s=__iter_s.next();
        if (__ival_s.done) {
            break;
        }
        s = __ival_s.value;
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
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new VertexAnimData();
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(VertexAnimData);
  VertexAnimData = _es6_module.add_export('VertexAnimData', VertexAnimData);
  VertexAnimData.STRUCT = "\nVertexAnimData {\n  eid         : int;\n  flag        : int;\n  animflag    : int;\n  cur_time    : int;\n  layerid     : int;\n  startv_eid  : int;\n}\n";
}, '/dev/fairmotion/src/core/animspline.js');
es6_module_define('frameset', ["spline_types", "animspline", "lib_api", "struct", "spline", "spline_element_array", "animdata"], function _frameset_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var DataBlock=es6_import_item(_es6_module, 'lib_api', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, 'lib_api', 'DataTypes');
  var Spline=es6_import_item(_es6_module, 'spline', 'Spline');
  var RestrictFlags=es6_import_item(_es6_module, 'spline', 'RestrictFlags');
  var CustomDataLayer=es6_import_item(_es6_module, 'spline_types', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineSegment=es6_import_item(_es6_module, 'spline_types', 'SplineSegment');
  var TimeDataLayer=es6_import_item(_es6_module, 'animdata', 'TimeDataLayer');
  var get_vtime=es6_import_item(_es6_module, 'animdata', 'get_vtime');
  var set_vtime=es6_import_item(_es6_module, 'animdata', 'set_vtime');
  var AnimChannel=es6_import_item(_es6_module, 'animdata', 'AnimChannel');
  var AnimKey=es6_import_item(_es6_module, 'animdata', 'AnimKey');
  var AnimInterpModes=es6_import_item(_es6_module, 'animdata', 'AnimInterpModes');
  var AnimKeyFlags=es6_import_item(_es6_module, 'animdata', 'AnimKeyFlags');
  var SplineLayerFlags=es6_import_item(_es6_module, 'spline_element_array', 'SplineLayerFlags');
  var SplineLayerSet=es6_import_item(_es6_module, 'spline_element_array', 'SplineLayerSet');
  es6_import(_es6_module, 'struct');
  var animspline=es6_import(_es6_module, 'animspline');
  var _animspline=es6_import(_es6_module, 'animspline');
  for (var k in _animspline) {
      _es6_module.add_export(k, _animspline[k], true);
  }
  var restrictflags=animspline.restrictflags;
  var VertexAnimIter=animspline.VertexAnimIter;
  var SegmentAnimIter=animspline.SegmentAnimIter;
  var VDAnimFlags=animspline.VDAnimFlags;
  var VertexAnimData=animspline.VertexAnimData;
  var SplineFrame=_ESClass("SplineFrame", [function SplineFrame(time, idgen) {
    this.time = time;
    this.flag = 0;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new SplineFrame();
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(SplineFrame);
  SplineFrame = _es6_module.add_export('SplineFrame', SplineFrame);
  SplineFrame.STRUCT = "\n  SplineFrame {\n    time    : float;\n    spline  : Spline;\n    flag    : int;\n  }\n";
  window.obj_values_to_array = function obj_values_to_array(obj) {
    var ret=[];
    for (var k in obj) {
        ret.push(obj[k]);
    }
    return ret;
  }
  var AllSplineIter=_ESClass("AllSplineIter", [function AllSplineIter(f, sel_only) {
    this.f = f;
    this.iter = undefined;
    this.ret = {done: false, value: undefined}
    this.stage = 0;
    this.sel_only = sel_only;
    this.load_iter();
  }, function load_iter() {
    this.iter = undefined;
    var f=this.f;
    if (this.stage==0) {
        var arr=new GArray();
        for (var k in f.frames) {
            var fr=f.frames[k];
            arr.push(fr.spline);
        }
        this.iter = arr[Symbol.iterator]();
    }
    else 
      if (this.stage==1) {
        var arr=[];
        for (var k in this.f.vertex_animdata) {
            if (this.sel_only) {
                var vdata=this.f.vertex_animdata[k];
                var v=this.f.spline.eidmap[k];
                if (v==undefined||!(v.flag&SplineFlags.SELECT)||v.hidden) {
                    continue;
                }
            }
            arr.push(this.f.vertex_animdata[k].spline);
        }
        this.iter = arr[Symbol.iterator]();
    }
  }, function reset() {
    this.ret = {done: false, value: undefined}
    this.stage = 0;
    this.iter = undefined;
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this;
  }), function next() {
    if (this.iter==undefined) {
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
        if (this.iter!=undefined) {
            ret.done = false;
        }
    }
    if (ret.done) {
        this.reset();
    }
    return ret;
  }]);
  _es6_module.add_class(AllSplineIter);
  var EidTimePair=_ESClass("EidTimePair", [function EidTimePair(eid, time) {
    this.eid = eid;
    this.time = time;
  }, function load(eid, time) {
    this.eid = eid;
    this.time = time;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new EidTimePair();
    reader(ret);
    return ret;
  }), _ESClass.symbol(Symbol.keystr, function keystr() {
    return ""+this.eid+"_"+this.time;
  })]);
  _es6_module.add_class(EidTimePair);
  EidTimePair.STRUCT = "\n  EidTimePair {\n    eid  : int;\n    time : int;\n  }\n";
  function combine_eid_time(eid, time) {
    return new EidTimePair(eid, time);
  }
  var split_eid_time_rets=new cachering(function() {
    return [0, 0];
  }, 64);
  function split_eid_time(t) {
    var ret=split_eid_time_rets.next();
    ret[0] = t.eid;
    ret[1] = t.time;
    return ret;
  }
  var SplineKCache=_ESClass("SplineKCache", [function SplineKCache() {
    this.cache = {}
    this.invalid_eids = new set();
  }, function set(frame, spline) {
    for (var eid in spline.eidmap) {
        this.revalidate(eid, frame);
    }
    this.cache[frame] = spline.export_ks();
  }, function invalidate(eid, time) {
    this.invalid_eids.add(combine_eid_time(eid, time));
  }, function revalidate(eid, time) {
    var t=combine_eid_time(time);
    this.invalid_eids.remove(t);
  }, function load(frame, spline) {
    if (typeof frame=="string") {
        throw new Error("Got bad frame! "+frame);
    }
    if (!(frame in this.cache)) {
        warn("Warning, bad call to SplineKCache");
        return ;
    }
    var ret=spline.import_ks(this.cache[frame]);
    if (ret==undefined) {
        delete this.cache[frame];
        console.log("bad kcache data for frame", frame);
        var __iter_s=__get_iter(spline.segments);
        var s;
        while (1) {
          var __ival_s=__iter_s.next();
          if (__ival_s.done) {
              break;
          }
          s = __ival_s.value;
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
  }, function _as_array() {
    var ret=[];
    for (var k in this.cache) {
        ret.push(this.cache[k]);
    }
    return ret;
  }, function _get_times() {
    var ret=[];
    for (var k in this.cache) {
        ret.push(parseFloat(""+k));
    }
    return ret;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new SplineKCache();
    reader(ret);
    var cache={}
    var inv=new set();
    if (ret.invalid_eids!=undefined&&__instance_of(ret.invalid_eids, Array)) {
        for (var i=0; i<ret.invalid_eids.length; i++) {
            inv.add(ret.invalid_eids[i]);
        }
    }
    ret.invalid_eids = inv;
    for (var i=0; i<ret.cache.length; i++) {
        cache[ret.times[i]] = new Uint8Array(ret.cache[i]);
    }
    ret.cache = cache;
    return ret;
  })]);
  _es6_module.add_class(SplineKCache);
  SplineKCache = _es6_module.add_export('SplineKCache', SplineKCache);
  SplineKCache.STRUCT = "\n  SplineKCache {\n    cache : array(array(byte))  | obj._as_array();\n    times : array(float)        | obj._get_times();\n    invalid_eids : iter(EidTimePair);\n  }\n";
  var SplineFrameSet=_ESClass("SplineFrameSet", DataBlock, [function SplineFrameSet() {
    DataBlock.call(this, DataTypes.FRAMESET);
    this.editmode = "MAIN";
    this.editveid = -1;
    this.spline = undefined;
    this.kcache = new SplineKCache();
    this.idgen = new SDIDGen();
    this.frames = {}
    this.framelist = [];
    this.vertex_animdata = {}
    this.pathspline = this.make_pathspline();
    this.templayerid = this.pathspline.layerset.active.id;
    this.selectmode = 0;
    this.draw_anim_paths = 0;
    this.time = 1;
    this.insert_frame(0);
    this.switch_on_select = true;
  }, _ESClass.get(function active_animdata() {
    if (this.spline.verts.active===undefined) {
        return undefined;
    }
    return this.get_vdata(this.spline.verts.active.eid, true);
  }), function find_orphan_pathverts() {
    var vset=new set();
    var vset2=new set();
    var __iter_v=__get_iter(this.spline.verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      vset2.add(""+v.eid);
    }
    for (var k in this.vertex_animdata) {
        var vd=this.vertex_animdata[k];
        if (!vset2.has(""+k)) {
            delete this.vertex_animdata[k];
            continue;
        }
        var __iter_v=__get_iter(vd.verts);
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          vset.add(v.eid);
        }
    }
    var totorphaned=0;
    var __iter_v=__get_iter(this.pathspline.verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      if (!vset.has(v.eid)) {
          this.pathspline.kill_vertex(v);
          totorphaned++;
      }
    }
    console.log("totorphaned: ", totorphaned);
  }, function has_coincident_verts(threshold, time_threshold) {
    threshold = threshold===undefined ? 2 : threshold;
    time_threshold = time_threshold===undefined ? 0 : time_threshold;
    var ret=new set();
    for (var k in this.vertex_animdata) {
        var vd=this.vertex_animdata[k];
        var lastv=undefined;
        var lasttime=undefined;
        var __iter_v=__get_iter(vd.verts);
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          var time=get_vtime(v);
          if (lastv!=undefined&&lastv.vectorDistance(v)<threshold&&Math.abs(time-lasttime)<=time_threshold) {
              console.log("Coincident vert!", k, v.eid, lastv.vectorDistance(v));
              if (v.segments.length==2)
                ret.add(v);
              else 
                if (lastv.segments.length==2)
                ret.add(lastv);
          }
          lastv = v;
          lasttime = time;
        }
    }
    return ret;
  }, function create_path_from_adjacent(v, s) {
    if (v.segments.length<2) {
        console.log("Invalid input to create_path_from_adjacent");
        return ;
    }
    var v1=s.other_vert(v), v2=v.other_segment(s).other_vert(v);
    var av1=this.get_vdata(v1.eid, false), av2=this.get_vdata(v2.eid, false);
    if (av1==undefined&&av2==undefined) {
        console.log("no animation data to interpolate");
        return ;
    }
    else 
      if (av1==undefined) {
        av1 = av2;
    }
    else 
      if (av2==undefined) {
        av2 = av1;
    }
    var av3=this.get_vdata(v.eid, true);
    var keyframes=new set();
    var __iter_v_0=__get_iter(av1.verts);
    var v_0;
    while (1) {
      var __ival_v_0=__iter_v_0.next();
      if (__ival_v_0.done) {
          break;
      }
      v_0 = __ival_v_0.value;
      keyframes.add(get_vtime(v_0));
    }
    var __iter_v_0=__get_iter(av2.verts);
    var v_0;
    while (1) {
      var __ival_v_0=__iter_v_0.next();
      if (__ival_v_0.done) {
          break;
      }
      v_0 = __ival_v_0.value;
      keyframes.add(get_vtime(v_0));
    }
    var co=new Vector3();
    var oflag1=av1.animflag, oflag2=av2.animflag;
    av1.animflag&=VDAnimFlags.STEP_FUNC;
    av2.animflag&=VDAnimFlags.STEP_FUNC;
    var __iter_time=__get_iter(keyframes);
    var time;
    while (1) {
      var __ival_time=__iter_time.next();
      if (__ival_time.done) {
          break;
      }
      time = __ival_time.value;
      var co1=av1.evaluate(time), co2=av2.evaluate(time);
      co.load(co1).add(co2).mulScalar(0.5);
      av3.update(co, time);
    }
    av3.animflag = oflag1|oflag2;
    av1.animflag = oflag1;
    av2.animflag = oflag2;
  }, function set_visibility(vd_eid, state) {
    console.log("set called", vd_eid, state);
    var vd=this.vertex_animdata[vd_eid];
    if (vd==undefined)
      return ;
    var layer=this.pathspline.layerset.idmap[vd.layerid];
    var drawlayer=this.pathspline.layerset.idmap[this.templayerid];
    vd.visible = !!state;
    var __iter_v=__get_iter(vd.verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
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
  }, function on_destroy() {
    this.spline.on_destroy();
    this.pathspline.on_destroy();
  }, function on_spline_select(element, state) {
    if (!this.switch_on_select)
      return ;
    var vd=this.get_vdata(element.eid, false);
    if (vd==undefined)
      return ;
    var hide=!(this.selectmode&element.type);
    hide = hide||!(element.flag&SplineFlags.SELECT);
    if (element.type==SplineTypes.HANDLE) {
        hide = hide||!element.use;
    }
    var layer=this.pathspline.layerset.idmap[vd.layerid];
    var drawlayer=this.pathspline.layerset.idmap[this.templayerid];
    vd.visible = !hide;
    var __iter_v=__get_iter(vd.verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
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
  }, _ESClass.get(function _allsplines() {
    return new AllSplineIter(this);
  }), _ESClass.get(function _selected_splines() {
    return new AllSplineIter(this, true);
  }), function update_visibility() {
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
    var __iter_v=__get_iter(this.pathspline.verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      if (!v.has_layer()) {
          drawlayer.add(v);
      }
      v.sethide(true);
    }
    var __iter_h=__get_iter(this.pathspline.handles);
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
      if (!h.has_layer()) {
          drawlayer.add(h);
      }
      h.sethide(true);
    }
    for (var k in this.vertex_animdata) {
        var vd=this.vertex_animdata[k];
        var v=this.spline.eidmap[k];
        if (v===undefined) {
            continue;
        }
        var hide=!(vd.eid in this.spline.eidmap)||!(v.flag&SplineFlags.SELECT);
        hide = hide||!(v.type&selectmode)||!show_paths;
        vd.visible = !hide;
        if (!hide) {
        }
        var __iter_v2=__get_iter(vd.verts);
        var v2;
        while (1) {
          var __ival_v2=__iter_v2.next();
          if (__ival_v2.done) {
              break;
          }
          v2 = __ival_v2.value;
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
          var __iter_s=__get_iter(v2.segments);
          var s;
          while (1) {
            var __ival_s=__iter_s.next();
            if (__ival_s.done) {
                break;
            }
            s = __ival_s.value;
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
  }, function on_ctx_update(ctx) {
    console.trace("on_ctx_update");
    if (ctx.spline===this.spline) {
    }
    else 
      if (ctx.spline===this.pathspline) {
        var resolve=0;
        var __iter_v=__get_iter(this.spline.points);
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
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
  }, function download() {
    console.trace("downloading. . .");
    var resolve=0;
    var __iter_v=__get_iter(this.spline.points);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      if (v.eid in this.vertex_animdata) {
          var vdata=this.get_vdata(v.eid, false);
          v.load(vdata.evaluate(this.time));
          v.flag&=~SplineFlags.FRAME_DIRTY;
          v.flag|=SplineFlags.UPDATE;
          resolve = 1;
      }
    }
    this.spline.resolve = resolve;
  }, function update_frame(force_update) {
    this.check_vdata_integrity();
    var time=this.time;
    var spline=this.spline;
    if (spline==undefined)
      return ;
    if (spline.resolve)
      spline.solve();
    this.kcache.set(time, spline);
    var is_first=time<=1;
    var found=false;
    var __iter_v=__get_iter(spline.points);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      if (!(v.eid in spline.eidmap)) {
          found = true;
      }
      var dofirst=is_first&&!(v.eid in this.vertex_animdata);
      if (!(force_update||dofirst||(v.flag&SplineFlags.FRAME_DIRTY)))
        continue;
      var vdata=this.get_vdata(v.eid);
      vdata.update(v, time);
      v.flag&=~SplineFlags.FRAME_DIRTY;
    }
    if (!found)
      return ;
    this.insert_frame(this.time);
    this.update_visibility();
  }, function insert_frame(time) {
    this.check_vdata_integrity();
    if (this.frame!=undefined)
      return this.frame;
    var frame=this.frame = new SplineFrame();
    var spline=this.spline==undefined ? new Spline() : this.spline.copy();
    spline.verts.select_listeners.addListener(this.on_spline_select, this);
    spline.handles.select_listeners.addListener(this.on_spline_select, this);
    spline.idgen = this.idgen;
    frame.spline = spline;
    frame.time = time;
    this.frames[time] = frame;
    if (this.spline==undefined) {
        this.spline = frame.spline;
        this.frame = frame;
    }
    return frame;
  }, function find_frame(time, off) {
    off = off===undefined ? 0 : off;
    var flist=this.framelist;
    for (var i=0; i<flist.length-1; i++) {
        if (flist[i]<=time&&flist[i+1]>time) {
            break;
        }
    }
    if (i==flist.length)
      return frames[i-1];
    return frames[i];
  }, function change_time(time, _update_animation) {
    if (_update_animation==undefined) {
        _update_animation = true;
    }
    if (!window.inFromStruct&&_update_animation) {
        this.update_frame();
    }
    var f=this.frames[0];
    var __iter_v=__get_iter(this.spline.points);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      var vd=this.get_vdata(v.eid, false);
      if (vd==undefined)
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
    if (f==undefined) {
        f = this.insert_frame(time);
    }
    var spline=f.spline;
    if (!window.inFromStruct&&_update_animation) {
        var set_update=true;
        if (!set_update) {
            var __iter_seg=__get_iter(spline.segments);
            var seg;
            while (1) {
              var __ival_seg=__iter_seg.next();
              if (__ival_seg.done) {
                  break;
              }
              seg = __ival_seg.value;
              if (seg.hidden)
                continue;
              seg.flag|=SplineFlags.REDRAW;
            }
            var __iter_face=__get_iter(spline.faces);
            var face;
            while (1) {
              var __ival_face=__iter_face.next();
              if (__ival_face.done) {
                  break;
              }
              face = __ival_face.value;
              if (face.hidden)
                continue;
              face.flag|=SplineFlags.REDRAW;
            }
        }
        var __iter_v=__get_iter(spline.points);
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          var set_flag=v.eid in this.vertex_animdata;
          var vdata=this.get_vdata(v.eid, false);
          if (vdata==undefined)
            continue;
          if (set_flag) {
              spline.setselect(v, vdata.flag&SplineFlags.SELECT);
              if (vdata.flag&SplineFlags.HIDE)
                v.flag|=SplineFlags.HIDE;
              else 
                v.flag&=~SplineFlags.HIDE;
          }
          v.load(vdata.evaluate(time));
          if (set_update) {
              v.flag|=SplineFlags.UPDATE;
          }
          else {
          }
        }
        spline.resolve = 1;
        if (!window.inFromStruct)
          spline.solve();
    }
    var __iter_s=__get_iter(spline.segments);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      if (s.hidden)
        continue;
      s.flag|=SplineFlags.UPDATE_AABB;
    }
    var __iter_f_0=__get_iter(spline.segments);
    var f_0;
    while (1) {
      var __ival_f_0=__iter_f_0.next();
      if (__ival_f_0.done) {
          break;
      }
      f_0 = __ival_f_0.value;
      if (f_0.hidden)
        continue;
      f_0.flag|=SplineFlags.UPDATE_AABB;
    }
    this.spline = spline;
    this.time = time;
    this.frame = f;
    this.update_visibility();
  }, function delete_vdata() {
    this.vertex_animdata = {}
  }, function get_vdata(eid, auto_create) {
    if (auto_create==undefined) {
        auto_create = true;
    }
    if (typeof eid!="number") {
        throw new Error("Expected a number for eid");
    }
    if (auto_create&&!(eid in this.vertex_animdata)) {
        this.vertex_animdata[eid] = new VertexAnimData(eid, this.pathspline);
    }
    return this.vertex_animdata[eid];
  }, function check_vdata_integrity(veid) {
    var spline=this.pathspline;
    var found=false;
    if (veid===undefined) {
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
    }
    return found;
  }, function rationalize_vdata_layers() {
    var spline=this.pathspline;
    spline.layerset = new SplineLayerSet();
    var templayer=spline.layerset.new_layer();
    this.templayerid = templayer.id;
    spline.layerset.active = templayer;
    for (var i=0; i<spline.elists.length; i++) {
        var list=spline.elists[i];
        list.layerset = spline.layerset;
        var __iter_e=__get_iter(list);
        var e;
        while (1) {
          var __ival_e=__iter_e.next();
          if (__ival_e.done) {
              break;
          }
          e = __ival_e.value;
          e.layers = {};
        }
    }
    for (var k in this.vertex_animdata) {
        var vd=this.vertex_animdata[k];
        var vlayer=spline.layerset.new_layer();
        vlayer.flag|=SplineLayerFlags.HIDE;
        vd.layerid = vlayer.id;
        var __iter_v=__get_iter(vd.verts);
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          for (var i=0; i<v.segments.length; i++) {
              vlayer.add(v.segments[i]);
          }
          vlayer.add(v);
        }
    }
  }, function draw(ctx, g, editor, redraw_rects, ignore_layers) {
    var size=editor.size, pos=editor.pos;
    this.draw_anim_paths = editor.draw_anim_paths;
    this.selectmode = editor.selectmode;
    this.spline.draw(redraw_rects, g, editor, editor.selectmode, editor.only_render, editor.draw_normals, this.spline===ctx.spline ? 1.0 : 0.3, undefined, undefined, ignore_layers);
  }, _ESClass.static(function fromSTRUCT(reader) {
    window.inFromStruct = true;
    var ret=STRUCT.chain_fromSTRUCT(SplineFrameSet, reader);
    ret.kcache = new SplineKCache();
    if (ret.kcache==undefined) {
        ret.kcache = new SplineKCache();
    }
    ret.afterSTRUCT();
    if (ret.pathspline==undefined) {
        ret.pathspline = ret.make_pathspline();
    }
    var __iter_v=__get_iter(ret.pathspline.verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
    }
    var __iter_h=__get_iter(ret.pathspline.handles);
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
    }
    var __iter_vd=__get_iter(ret.vertex_animdata);
    var vd;
    while (1) {
      var __ival_vd=__iter_vd.next();
      if (__ival_vd.done) {
          break;
      }
      vd = __ival_vd.value;
      vd.spline = ret.pathspline;
      if (vd.layerid==undefined) {
          var layer=ret.pathspline.layerset.new_layer();
          layer.flag|=SplineLayerFlags.HIDE;
          vd.layerid = layer.id;
          if (vd.startv_eid!=undefined) {
              var v=ret.pathspline.eidmap[vd.startv_eid];
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
                if (v==vd.startv)
                  break;
              }
          }
      }
    }
    ret.pathspline.is_anim_path = true;
    if (ret.templayerid==undefined)
      ret.templayerid = ret.pathspline.layerset.new_layer().id;
    var frames={}
    var vert_animdata={}
    var max_cur=ret.idgen.cur_id;
    var firstframe=undefined;
    for (var i=0; i<ret.frames.length; i++) {
        max_cur = Math.max(ret.frames[i].spline.idgen.cur_id, max_cur);
        if (i==0)
          firstframe = ret.frames[i];
        ret.frames[i].spline.idgen = ret.idgen;
        frames[ret.frames[i].time] = ret.frames[i];
    }
    ret.idgen.max_cur(max_cur);
    for (var i=0; i<ret.vertex_animdata.length; i++) {
        vert_animdata[ret.vertex_animdata[i].eid] = ret.vertex_animdata[i];
    }
    for (let k in vert_animdata) {
        let vd=vert_animdata[k];
        var __iter_v=__get_iter(vd.verts);
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          vd._get_animdata(v).owning_veid = vd.eid;
        }
    }
    ret.frames = frames;
    ret.pathspline.regen_sort();
    var fk=ret.cur_frame;
    delete ret.cur_frame;
    if (fk==undefined) {
        ret.frame = firstframe;
        ret.spline = firstframe.spline;
    }
    else {
      ret.frame = ret.frames[fk];
      ret.spline = ret.frames[fk].spline;
    }
    ret.vertex_animdata = vert_animdata;
    if (ret.framelist.length==0) {
        for (var k in ret.frames) {
            ret.framelist.push(parseFloat(k));
        }
    }
    for (k in ret.frames) {
        ret.frames[k].spline.verts.select_listeners.addListener(ret.on_spline_select, ret);
        ret.frames[k].spline.handles.select_listeners.addListener(ret.on_spline_select, ret);
    }
    ret.spline.fix_spline();
    ret.rationalize_vdata_layers();
    ret.update_visibility();
    window.inFromStruct = false;
    return ret;
  }), function make_pathspline() {
    var spline=new Spline();
    spline.is_anim_path = true;
    spline.restrict = restrictflags;
    spline.verts.cdata.add_layer(TimeDataLayer, "time data");
    return spline;
  }]);
  _es6_module.add_class(SplineFrameSet);
  SplineFrameSet = _es6_module.add_export('SplineFrameSet', SplineFrameSet);
  
  SplineFrameSet.STRUCT = STRUCT.inherit(SplineFrameSet, DataBlock)+"\n    idgen             : SDIDGen;\n    frames            : array(SplineFrame) | obj_values_to_array(obj.frames);\n    vertex_animdata   : array(VertexAnimData) | obj_values_to_array(obj.vertex_animdata);\n\n    cur_frame         : float | obj.frame.time;\n    editmode          : string;\n    editveid          : int;\n\n    time              : float;\n    framelist         : array(float);\n    pathspline        : Spline;\n\n    selectmode        : int;\n    draw_anim_paths   : int;\n    templayerid       : int;\n}\n";
}, '/dev/fairmotion/src/core/frameset.js');
es6_module_define('ops_editor', ["toolops_api", "events", "UICanvas", "struct", "UITextBox", "UITabPanel", "UIPack", "UIWidgets", "UIElement", "UIWidgets_special", "UIFrame", "ScreenArea"], function _ops_editor_module(_es6_module) {
  var gen_editor_switcher=es6_import_item(_es6_module, 'UIWidgets_special', 'gen_editor_switcher');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var UIButtonAbstract=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonAbstract');
  var UIButton=es6_import_item(_es6_module, 'UIWidgets', 'UIButton');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UIMenuButton=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuButton');
  var UICheckBox=es6_import_item(_es6_module, 'UIWidgets', 'UICheckBox');
  var UINumBox=es6_import_item(_es6_module, 'UIWidgets', 'UINumBox');
  var UILabel=es6_import_item(_es6_module, 'UIWidgets', 'UILabel');
  var UIMenuLabel=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuLabel');
  var ScrollButton=es6_import_item(_es6_module, 'UIWidgets', 'ScrollButton');
  var UIVScroll=es6_import_item(_es6_module, 'UIWidgets', 'UIVScroll');
  var UIIconCheck=es6_import_item(_es6_module, 'UIWidgets', 'UIIconCheck');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var UIPackFrame=es6_import_item(_es6_module, 'UIPack', 'UIPackFrame');
  var ToolOpFrame=es6_import_item(_es6_module, 'UIPack', 'ToolOpFrame');
  var UITextBox=es6_import_item(_es6_module, 'UITextBox', 'UITextBox');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var ToolMacro=es6_import_item(_es6_module, 'toolops_api', 'ToolMacro');
  var UITabBar=es6_import_item(_es6_module, 'UITabPanel', 'UITabBar');
  var UICollapseIcon=es6_import_item(_es6_module, 'UIWidgets_special', 'UICollapseIcon');
  var UIPanel=es6_import_item(_es6_module, 'UIWidgets_special', 'UIPanel');
  var UICanvas=es6_import_item(_es6_module, 'UICanvas', 'UICanvas');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var KeyMap=es6_import_item(_es6_module, 'events', 'KeyMap');
  var VelocityPan=es6_import_item(_es6_module, 'events', 'VelocityPan');
  var KeyHandler=es6_import_item(_es6_module, 'events', 'KeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, 'events', 'FuncKeyHandler');
  var OpStackFrame=_ESClass("OpStackFrame", RowFrame, [function OpStackFrame(ctx, size) {
    RowFrame.call(this, ctx);
    this.pan_bounds = [[0, 0], [0, 0]];
    this.bad = false;
    this.pos = [0, 0];
    this.size = size;
    this.build_ms = time_ms();
    this.last_undocur = g_app_state.toolstack.undocur;
    this.packflag|=PackFlags.IGNORE_LIMIT|PackFlags.ALIGN_TOP|PackFlags.NO_AUTO_SPACING;
    this.default_packflag|=PackFlags.INHERIT_WIDTH;
    this.panelmap = new hashtable();
  }, function on_mousedown(event) {
    if (event.button==1&&!g_app_state.was_touch) {
        this.start_pan([event.x, event.y], 1);
    }
    else {
      RowFrame.prototype.on_mousedown.call(this, event);
    }
  }, function pack(canvas, isVertical) {
    var minsize=this.get_min_size(canvas, isVertical);
    this.pan_bounds[1][1] = Math.max(minsize[1]-this.size[1], 0);
    RowFrame.prototype.pack.call(this, canvas, isVertical);
  }, function gen_panel(tool, path) {
    var panel=new UIPanel(this.ctx, tool.uiname, ""+tool.stack_index);
    if (!(__instance_of(tool, ToolMacro))) {
        var toolframe=new ToolOpFrame(this.ctx, path);
        toolframe.packflag|=PackFlags.INHERIT_WIDTH;
        panel.add(toolframe);
    }
    else {
      var i=0;
      var __iter_t=__get_iter(tool.tools);
      var t;
      while (1) {
        var __ival_t=__iter_t.next();
        if (__ival_t.done) {
            break;
        }
        t = __ival_t.value;
        var subpanel=this.gen_panel(t, path+".tools["+i+"]");
        var col=panel.col();
        col.default_packflag&=~PackFlags.INHERIT_WIDTH;
        col.packflag|=PackFlags.INHERIT_WIDTH|PackFlags.NO_AUTO_SPACING;
        subpanel.packflag|=PackFlags.INHERIT_WIDTH;
        col.label(" ");
        col.add(subpanel);
        i++;
      }
    }
    return panel;
  }, function get_panel(tool) {
    var undocur=g_app_state.toolstack.undocur;
    if (!this.panelmap.has(tool)) {
        var panel=this.gen_panel(tool, "operator_stack["+tool.stack_index+"]");
        this.panelmap.set(tool, panel);
        this.add(panel);
        panel.collapsed = tool.stack_index!=undocur-1;
        return panel;
    }
    return this.panelmap.get(tool);
  }, function on_tick() {
    if (time_ms()-this.build_ms>400) {
        this.build();
        this.build_ms = time_ms();
    }
    RowFrame.prototype.on_tick.call(this);
  }, function is_selop(op) {
    var ret;
    if (__instance_of(op, ToolMacro)) {
        ret = true;
        var __iter_t=__get_iter(op.tools);
        var t;
        while (1) {
          var __ival_t=__iter_t.next();
          if (__ival_t.done) {
              break;
          }
          t = __ival_t.value;
          if (!this.is_selop(t)) {
              ret = false;
              break;
          }
        }
    }
    else {
      ret = __instance_of(op, SelectOpAbstract);
      ret = ret||__instance_of(op, SelectObjAbstract);
    }
    return ret;
  }, function build() {
    if (g_app_state.toolstack.undostack.length>50) {
        this.bad = true;
        return ;
    }
    var oplist=g_app_state.toolstack.undostack;
    var pmap=this.panelmap;
    var keepset=new set();
    var undocur=g_app_state.toolstack.undocur;
    var reflow=false;
    var filter_sel=this.parent.filter_sel;
    var __iter_tool=__get_iter(oplist);
    var tool;
    while (1) {
      var __ival_tool=__iter_tool.next();
      if (__ival_tool.done) {
          break;
      }
      tool = __ival_tool.value;
      if (filter_sel&&this.is_selop(tool))
        continue;
      keepset.add(tool);
      if (!pmap.has(tool)) {
          reflow = true;
      }
      var panel=this.get_panel(tool);
      if (tool.stack_index==undocur-1) {
          panel.color = uicolors["ActivePanel"];
      }
      else {
        panel.color = uicolors["CollapsingPanel"];
      }
      if (tool.stack_index!=undocur-1&&!panel.user_opened) {
          panel.collapsed = true;
      }
      else 
        if (tool.stack_index==undocur-1&&!panel.user_closed) {
          panel.collapsed = false;
      }
    }
    var __iter_tool=__get_iter(pmap);
    var tool;
    while (1) {
      var __ival_tool=__iter_tool.next();
      if (__ival_tool.done) {
          break;
      }
      tool = __ival_tool.value;
      if (!keepset.has(tool)) {
          var panel=pmap.get(tool);
          this.remove(panel);
          pmap.remove(tool);
      }
    }
    if (reflow) {
        var __iter_k=__get_iter(pmap);
        var k;
        while (1) {
          var __ival_k=__iter_k.next();
          if (__ival_k.done) {
              break;
          }
          k = __ival_k.value;
          var panel=pmap.get(k);
          this.remove(panel);
        }
        var __iter_tool=__get_iter(oplist);
        var tool;
        while (1) {
          var __ival_tool=__iter_tool.next();
          if (__ival_tool.done) {
              break;
          }
          tool = __ival_tool.value;
          if (!pmap.has(tool))
            continue;
          var panel=pmap.get(tool);
          this.add(panel);
        }
    }
    this.parent.first_build = false;
  }, function build_draw(canvas, isVertical) {
    if (this.bad)
      canvas.text([10, this.size[1]/2], "Too many operators to list", undefined, 16);
    RowFrame.prototype.build_draw.call(this, canvas, isVertical);
  }]);
  _es6_module.add_class(OpStackFrame);
  var Area=es6_import_item(_es6_module, 'ScreenArea', 'Area');
  var OpStackEditor=_ESClass("OpStackEditor", Area, [function OpStackEditor(x, y, width, height) {
    Area.call(this, OpStackEditor.name, OpStackEditor.uiname, new Context(), [x, y], [width, height]);
    this.first_build = true;
    this.auto_load_uidata = false;
    this.keymap = new KeyMap();
    this.define_keymap();
    this.drawlines = new GArray();
    this._filter_sel = false;
    this.gl = undefined;
    this.ctx = new Context();
    this.subframe = new OpStackFrame(new Context(), this.size);
    this.subframe.pos = [0, 0];
    this.subframe.state|=UIFlags.HAS_PAN|UIFlags.IS_CANVAS_ROOT|UIFlags.PAN_CANVAS_MAT;
    this.subframe.velpan = new VelocityPan();
    this.prepend(this.subframe);
  }, _ESClass.get(function filter_sel() {
    return this._filter_sel;
  }), _ESClass.set(function filter_sel(val) {
    this._filter_sel = !!val;
    this.subframe.do_full_recalc();
  }), function define_keymap() {
    var k=this.keymap;
    k.add(new KeyHandler("Z", ["CTRL", "SHIFT"], "Redo"), new FuncKeyHandler(function(ctx) {
      console.log("Redo");
      ctx.toolstack.redo();
    }));
    k.add(new KeyHandler("Y", ["CTRL"], "Redo"), new FuncKeyHandler(function(ctx) {
      console.log("Redo");
      ctx.toolstack.redo();
    }));
    k.add(new KeyHandler("Z", ["CTRL"], "Undo"), new FuncKeyHandler(function(ctx) {
      console.log("Undo");
      ctx.toolstack.undo();
    }));
  }, _ESClass.static(function default_new(ctx, scr, gl, pos, size) {
    var ret=new OpStackEditor(pos[0], pos[1], size[0], size[1]);
    return ret;
  }), function on_area_inactive() {
    this.first_build = true;
    this.destroy();
    Area.prototype.on_area_inactive.call(this);
  }, function area_duplicate() {
    var ret=new OpStackEditor(this.pos[0], this.pos[1], this.size[0], this.size[1]);
    return ret;
  }, function destroy() {
    this.subframe.canvas.destroy();
    Area.prototype.destroy.call(this);
  }, function build_topbar(col) {
    this.ctx = new Context();
    col.packflag|=PackFlags.ALIGN_LEFT;
    this.topbar = col;
    col.packflag|=PackFlags.IGNORE_LIMIT;
    col.size = [this.size[0], Area.get_barhgt()];
    col.draw_background = true;
    col.rcorner = 100.0;
    col.pos = [0, this.size[1]-Area.get_barhgt()];
    col.prop("opseditor.filter_sel", PackFlags.USE_SMALL_ICON);
  }, function build_bottombar(col) {
    var ctx=new Context();
    col.packflag|=PackFlags.ALIGN_LEFT;
    col.default_packflag = PackFlags.ALIGN_LEFT;
    col.draw_background = true;
    col.rcorner = 100.0;
    col.pos = [0, 2];
    col.size = [this.size[0], Area.get_barhgt()];
    col.add(gen_editor_switcher(this.ctx, this));
  }, function build_draw(canvas, isVertical) {
    this.subframe.set_pan();
    var ctx=this.ctx = new Context();
    this.subframe.size[0] = this.size[0];
    this.subframe.size[1] = this.size[1]-this.subframe.pos[1]-Area.get_barhgt();
    this.subframe.canvas.viewport = this.canvas.viewport;
    Area.prototype.build_draw.call(this, canvas, isVertical);
  }, function set_canvasbox() {
    this.asp = this.size[0]/this.size[1];
  }, _ESClass.static(function fromSTRUCT(reader) {
    var obj=new OpStackEditor(0, 0, 1, 1);
    reader(obj);
    return obj;
  }), function on_tick() {
    Area.prototype.on_tick.call(this);
    if (this._saved_uidata!=undefined&&!this.first_build) {
        this.load_saved_uidata();
    }
  }, function data_link(block, getblock, getblock_us) {
  }]);
  _es6_module.add_class(OpStackEditor);
  OpStackEditor = _es6_module.add_export('OpStackEditor', OpStackEditor);
  OpStackEditor.STRUCT = STRUCT.inherit(OpStackEditor, Area)+"\n    filter_sel : int | obj._filter_sel;\n  }\n";
  OpStackEditor.uiname = "Operator Stack";
  OpStackEditor.debug_only = true;
}, '/dev/fairmotion/src/editors/ops/ops_editor.js');
es6_module_define('SettingsEditor', ["ScreenArea", "UITabPanel", "UIPack", "UIWidgets", "events", "UICanvas", "UIFrame", "UIElement", "toolops_api", "UIWidgets_special", "mathlib", "UITextBox", "struct"], function _SettingsEditor_module(_es6_module) {
  "use strict";
  var gen_editor_switcher=es6_import_item(_es6_module, 'UIWidgets_special', 'gen_editor_switcher');
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var UICanvas=es6_import_item(_es6_module, 'UICanvas', 'UICanvas');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var PackFlags=es6_import_item(_es6_module, 'UIElement', 'PackFlags');
  var UIElement=es6_import_item(_es6_module, 'UIElement', 'UIElement');
  var UIFlags=es6_import_item(_es6_module, 'UIElement', 'UIFlags');
  var CanvasFlags=es6_import_item(_es6_module, 'UIElement', 'CanvasFlags');
  var UIFrame=es6_import_item(_es6_module, 'UIFrame', 'UIFrame');
  var KeyMap=es6_import_item(_es6_module, 'events', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, 'events', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, 'events', 'FuncKeyHandler');
  var KeyHandler=es6_import_item(_es6_module, 'events', 'KeyHandler');
  var charmap=es6_import_item(_es6_module, 'events', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, 'events', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, 'events', 'EventHandler');
  var VelocityPan=es6_import_item(_es6_module, 'events', 'VelocityPan');
  var UIButtonAbstract=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonAbstract');
  var UIButton=es6_import_item(_es6_module, 'UIWidgets', 'UIButton');
  var UIButtonIcon=es6_import_item(_es6_module, 'UIWidgets', 'UIButtonIcon');
  var UIMenuButton=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuButton');
  var UICheckBox=es6_import_item(_es6_module, 'UIWidgets', 'UICheckBox');
  var UINumBox=es6_import_item(_es6_module, 'UIWidgets', 'UINumBox');
  var UILabel=es6_import_item(_es6_module, 'UIWidgets', 'UILabel');
  var UIMenuLabel=es6_import_item(_es6_module, 'UIWidgets', 'UIMenuLabel');
  var ScrollButton=es6_import_item(_es6_module, 'UIWidgets', 'ScrollButton');
  var UIVScroll=es6_import_item(_es6_module, 'UIWidgets', 'UIVScroll');
  var UIIconCheck=es6_import_item(_es6_module, 'UIWidgets', 'UIIconCheck');
  var RowFrame=es6_import_item(_es6_module, 'UIPack', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, 'UIPack', 'ColumnFrame');
  var UIPackFrame=es6_import_item(_es6_module, 'UIPack', 'UIPackFrame');
  var UITextBox=es6_import_item(_es6_module, 'UITextBox', 'UITextBox');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var UITabBar=es6_import_item(_es6_module, 'UITabPanel', 'UITabBar');
  var UICollapseIcon=es6_import_item(_es6_module, 'UIWidgets_special', 'UICollapseIcon');
  var UIPanel=es6_import_item(_es6_module, 'UIWidgets_special', 'UIPanel');
  var UIColorField=es6_import_item(_es6_module, 'UIWidgets_special', 'UIColorField');
  var UIColorBox=es6_import_item(_es6_module, 'UIWidgets_special', 'UIColorBox');
  var UIColorPicker=es6_import_item(_es6_module, 'UIWidgets_special', 'UIColorPicker');
  var UIProgressBar=es6_import_item(_es6_module, 'UIWidgets_special', 'UIProgressBar');
  var UIListBox=es6_import_item(_es6_module, 'UIWidgets_special', 'UIListBox');
  var UIListEntry=es6_import_item(_es6_module, 'UIWidgets_special', 'UIListEntry');
  var UIBoxWColor=es6_import_item(_es6_module, 'UIWidgets_special', 'UIBoxWColor');
  var UITabPanel=es6_import_item(_es6_module, 'UITabPanel', 'UITabPanel');
  var Area=es6_import_item(_es6_module, 'ScreenArea', 'Area');
  var SettingsEditor=_ESClass("SettingsEditor", Area, [function do_theme_color(i, prefix) {
    var ctx=this.ctx;
    var path=prefix+i+"]";
    var type=this.ctx.api.get_prop(ctx, path+".type");
    if (type=="Simple") {
        var ret=new UIColorPicker(ctx);
        ret.state|=UIFlags.USE_PATH;
        ret.data_path = path+".color";
        ret.on_tick();
        return ret;
    }
    else 
      if (type=="Weighted") {
        var ret=new UIBoxWColor(ctx, path);
        return ret;
    }
    else {
      var ret=new UIBoxWColor(ctx, path);
      return ret;
      return new UILabel(ctx, "invalid theme entry");
    }
  }, function colortheme_panel(prefix, flat_colors) {
    var ctx=this.ctx;
    var panel=new RowFrame(ctx);
    var listbox=new UIListBox(ctx, undefined, [200, 200]);
    var theme=g_theme;
    g_theme.ui.gen_colors();
    for (var j=0; j<flat_colors.length; j++) {
        listbox.add_item(flat_colors[j][0], j);
    }
    var on_tick=listbox.on_tick;
    listbox.on_tick = function() {
      on_tick.apply(this, arguments);
      var update=g_theme.ui.flat_colors.length!=flat_colors.length;
      for (var j=0; !update&&j<g_theme.ui.flat_colors.length; j++) {
          if (g_theme.ui.flat_colors[j][0]!=flat_colors[j][0]) {
              update = true;
          }
      }
      if (update) {
          flat_colors = g_theme.ui.flat_colors;
          this.reset();
          for (var j=0; j<g_theme.ui.flat_colors.length; j++) {
              this.add_item(g_theme.ui.flat_colors[j][0], j);
          }
      }
    }
    var this2=this;
    function callback(listbox, text, id) {
      var e=this2.do_theme_color(id, prefix);
      console.log("ID!", id);
      if (panel.themebox!=undefined) {
          panel.replace(panel.themebox, e);
      }
      else {
        panel.add(e);
      }
      panel.themebox = e;
    }
    listbox.callback = callback;
    panel.add(listbox);
    panel.themebox = this.do_theme_color(0, prefix);
    panel.add(panel.themebox);
    panel.packflag|=PackFlags.INHERIT_WIDTH;
    return panel;
  }, function units_panel() {
    var ctx=this.ctx;
    var panel=new RowFrame(ctx);
    panel.packflag|=PackFlags.INHERIT_WIDTH;
    panel.packflag|=PackFlags.NO_AUTO_SPACING;
    panel.packflag|=PackFlags.IGNORE_LIMIT;
    panel.label("Unit System");
    panel.prop("settings.unit_system");
    panel.label("Default Unit");
    panel.prop("settings.default_unit");
    return panel;
  }, function SettingsEditor(ctx, pos, size) {
    Area.call(this, SettingsEditor.name, SettingsEditor.uiname, new Context(), pos, size);
    this.mm = new MinMax(2);
    this.keymap = new KeyMap();
    this.define_keymap();
    this.drawlines = new GArray();
    this.pan_bounds = [[0, 0], [0, 0]];
    this._filter_sel = false;
    this.ctx = new Context();
    this.mainframe = new UITabPanel(new Context(), [size[0], size[1]]);
    this.mainframe.packflag|=PackFlags.NO_AUTO_SPACING|PackFlags.INHERIT_WIDTH;
    this.mainframe.size[0] = this.size[0];
    this.mainframe.size[1] = this.size[1];
    this.mainframe.pos = [0, Area.get_barhgt()];
    this.mainframe.state|=UIFlags.HAS_PAN|UIFlags.IS_CANVAS_ROOT|UIFlags.PAN_CANVAS_MAT;
    this.mainframe.velpan = new VelocityPan();
    this.mainframe.add_tab("Units", this.units_panel());
    this.mainframe.add_tab("UI Colors", this.colortheme_panel("theme.ui.colors[", g_theme.ui.flat_colors));
  }, function define_keymap() {
  }, _ESClass.static(function default_new(ctx, scr, gl, pos, size) {
    var ret=new SettingsEditor(ctx, pos, size);
    return ret;
  }), function on_mousedown(event) {
    if (event.button==1&&!g_app_state.was_touch) {
        this.mainframe.start_pan([event.x, event.y], 1);
    }
    else {
      Area.prototype.on_mousedown.call(this, event);
    }
  }, function on_area_inactive() {
    this.destroy();
    Area.prototype.on_area_inactive.call(this);
  }, function area_duplicate() {
    var ret=new SettingsEditor(this.pos[0], this.pos[1], this.size[0], this.size[1]);
    return ret;
  }, function destroy() {
    this.mainframe.canvas.destroy();
    Area.prototype.destroy.call(this);
  }, function build_layout() {
    Area.prototype.build_layout.call(this);
    this.middlesplit.add(this.mainframe);
  }, function build_topbar(col) {
    this.ctx = new Context();
    this.topbar = col;
    col.packflag|=PackFlags.IGNORE_LIMIT|PackFlags.ALIGN_LEFT;
    col.size = [this.size[0], Area.get_barhgt()];
    col.draw_background = true;
    col.rcorner = 100.0;
    col.pos = [0, this.size[1]-Area.get_barhgt()];
  }, function build_bottombar(col) {
    var ctx=new Context();
    col.packflag|=PackFlags.ALIGN_LEFT;
    col.default_packflag = PackFlags.ALIGN_LEFT;
    col.draw_background = true;
    col.rcorner = 100.0;
    col.pos = [0, 2];
    col.size = [this.size[0], Area.get_barhgt()];
    col.add(gen_editor_switcher(this.ctx, this));
  }, function build_draw(canvas, isVertical) {
    this.mainframe.set_pan();
    var ctx=this.ctx = new Context();
    var sx=this.size[0];
    var sy=this.size[1]-this.mainframe.pos[1]-Area.get_barhgt();
    var s1=this.size, s2=this.mainframe.size;
    if (s2[0]!=sx||s2[1]!=sy) {
        this.mainframe.size[0] = this.size[0];
        this.mainframe.size[1] = sy;
        this.mainframe.on_resize(this.size, this.mainframe.size);
    }
    this.mainframe.canvas.viewport = this.canvas.viewport;
    Area.prototype.build_draw.call(this, canvas, isVertical);
    this.mm.reset();
    var arr=[0, 0];
    var __iter_c=__get_iter(this.children);
    var c;
    while (1) {
      var __ival_c=__iter_c.next();
      if (__ival_c.done) {
          break;
      }
      c = __ival_c.value;
      this.mm.minmax(c.pos);
      arr[0] = c.pos[0]+c.size[0];
      arr[1] = c.pos[1]+c.size[1];
      this.mm.minmax(c.pos);
      this.mm.minmax(arr);
    }
    this.pan_bounds[1][1] = this.mm.max[1]-this.mm.min[1]-this.size[1];
  }, function set_canvasbox() {
    this.asp = this.size[0]/this.size[1];
  }, _ESClass.static(function fromSTRUCT(reader) {
    var obj=new SettingsEditor(new Context(), [0, 0], [1, 1]);
    reader(obj);
    return obj;
  }), function data_link(block, getblock, getblock_us) {
  }]);
  _es6_module.add_class(SettingsEditor);
  SettingsEditor.STRUCT = STRUCT.inherit(SettingsEditor, Area)+"\n  }\n";
  SettingsEditor.uiname = "Settings";
  SettingsEditor.debug_only = false;
}, '/dev/fairmotion/src/editors/settings/SettingsEditor.js');
var ContextStruct;
es6_module_define('data_api_define', ["units", "spline_base", "imageblock", "toolprops", "theme", "frameset", "view2d", "animdata", "toolops_api", "ops_editor", "spline_multires", "spline_element_array", "config", "data_api", "selectmode", "spline_createops", "lib_api"], function _data_api_define_module(_es6_module) {
  var DataTypes=es6_import_item(_es6_module, 'lib_api', 'DataTypes');
  var EditModes=es6_import_item(_es6_module, 'view2d', 'EditModes');
  var ENABLE_MULTIRES=es6_import_item(_es6_module, 'config', 'ENABLE_MULTIRES');
  var ImageFlags=es6_import_item(_es6_module, 'imageblock', 'ImageFlags');
  var Image=es6_import_item(_es6_module, 'imageblock', 'Image');
  var BoxColor4=es6_import_item(_es6_module, 'theme', 'BoxColor4');
  var BoxWColor=es6_import_item(_es6_module, 'theme', 'BoxWColor');
  var ColorTheme=es6_import_item(_es6_module, 'theme', 'ColorTheme');
  var ThemePair=es6_import_item(_es6_module, 'theme', 'ThemePair');
  var BoxColor=es6_import_item(_es6_module, 'theme', 'BoxColor');
  var darken=es6_import_item(_es6_module, 'theme', 'darken');
  var EnumProperty=es6_import_item(_es6_module, 'toolprops', 'EnumProperty');
  var FlagProperty=es6_import_item(_es6_module, 'toolprops', 'FlagProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var StringProperty=es6_import_item(_es6_module, 'toolprops', 'StringProperty');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var Vec2Property=es6_import_item(_es6_module, 'toolprops', 'Vec2Property');
  var DataRefProperty=es6_import_item(_es6_module, 'toolprops', 'DataRefProperty');
  var Vec3Property=es6_import_item(_es6_module, 'toolprops', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, 'toolprops', 'Vec4Property');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var PropTypes=es6_import_item(_es6_module, 'toolprops', 'PropTypes');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var SplineFlags=es6_import_item(_es6_module, 'spline_base', 'SplineFlags');
  var MaterialFlags=es6_import_item(_es6_module, 'spline_base', 'MaterialFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_base', 'SplineTypes');
  var SelMask=es6_import_item(_es6_module, 'selectmode', 'SelMask');
  var ToolModes=es6_import_item(_es6_module, 'selectmode', 'ToolModes');
  var Unit=es6_import_item(_es6_module, 'units', 'Unit');
  var ExtrudeModes=es6_import_item(_es6_module, 'spline_createops', 'ExtrudeModes');
  var DataFlags=es6_import_item(_es6_module, 'data_api', 'DataFlags');
  var DataPathTypes=es6_import_item(_es6_module, 'data_api', 'DataPathTypes');
  var OpStackEditor=es6_import_item(_es6_module, 'ops_editor', 'OpStackEditor');
  var AnimKeyFlags=es6_import_item(_es6_module, 'animdata', 'AnimKeyFlags');
  var AnimInterpModes=es6_import_item(_es6_module, 'animdata', 'AnimInterpModes');
  var VDAnimFlags=es6_import_item(_es6_module, 'frameset', 'VDAnimFlags');
  var MultiResLayer=es6_import_item(_es6_module, 'spline_multires', 'MultiResLayer');
  var MultiResEffector=es6_import_item(_es6_module, 'spline_multires', 'MultiResEffector');
  var MResFlags=es6_import_item(_es6_module, 'spline_multires', 'MResFlags');
  var has_multires=es6_import_item(_es6_module, 'spline_multires', 'has_multires');
  var ensure_multires=es6_import_item(_es6_module, 'spline_multires', 'ensure_multires');
  var iterpoints=es6_import_item(_es6_module, 'spline_multires', 'iterpoints');
  var compose_id=es6_import_item(_es6_module, 'spline_multires', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, 'spline_multires', 'decompose_id');
  var SelModes={VERTEX: SelMask.VERTEX, SEGMENT: SelMask.SEGMENT, FACE: SelMask.FACE}
  var selmask_enum=new EnumProperty(undefined, SelModes, "selmask_enum", "Selection Mode");
  selmask_enum = _es6_module.add_export('selmask_enum', selmask_enum);
  var selmask_ui_vals={}
  var __iter_k=__get_in_iter(SelModes);
  var k;
  while (1) {
    var __ival_k=__iter_k.next();
    if (__ival_k.done) {
        break;
    }
    k = __ival_k.value;
    var s=k[0].toUpperCase()+k.slice(1, k.length).toLowerCase();
    var slst=s.split("_");
    var s2="";
    for (var i=0; i<slst.length; i++) {
        s2+=slst[i][0].toUpperCase()+slst[i].slice(1, slst[i].length).toLowerCase()+" ";
    }
    s = s2.trim();
    selmask_ui_vals[k] = s;
  }
  selmask_enum.ui_value_names = selmask_ui_vals;
  selmask_enum.add_icons({VERTEX: Icons.VERT_MODE, SEGMENT: Icons.EDGE_MODE, FACE: Icons.FACE_MODE});
  var data_api=es6_import(_es6_module, 'data_api');
  var DataPath=data_api.DataPath;
  var DataStruct=data_api.DataStruct;
  var DataStructArray=data_api.DataStructArray;
  var units=Unit.units;
  var unit_enum={}
  var unit_ui_vals={}
  for (var i=0; i<units.length; i++) {
      var s=units[i].suffix_list[0];
      unit_enum[s] = s;
      unit_ui_vals[s] = s.toUpperCase();
  }
  Unit.units_enum = new EnumProperty("in", unit_enum, "unit_enum", "Units");
  Unit.units_enum.ui_value_names = unit_ui_vals;
  var SettingsUpdate=function() {
    g_app_state.session.settings.server_update();
  }
  var SettingsUpdateRecalc=function() {
    g_app_state.session.settings.server_update();
    g_app_state.screen.do_full_recalc();
  }
  var SettingsStruct=undefined;
  function api_define_settings() {
    unitsys_enum = new EnumProperty("imperial", ["imperial", "metric"], "system", "System", "Metric or Imperial");
    var units_enum=Unit.units_enum.copy();
    units_enum.apiname = "default_unit";
    units_enum.uiname = "Default Unit";
    units_enum.update = unitsys_enum.update = SettingsUpdateRecalc;
    SettingsStruct = new DataStruct([new DataPath(unitsys_enum, "unit_system", "unit_scheme", true), new DataPath(units_enum, "default_unit", "unit", true)]);
    return SettingsStruct;
  }
  var SettingsEditorStruct=undefined;
  function api_define_seditor() {
    SettingsEditorStruct = new DataStruct([]);
    return SettingsEditorStruct;
  }
  var OpsEditorStruct=undefined;
  function api_define_opseditor() {
    var filter_sel=new BoolProperty(0, "filter_sel", "Filter Sel", "Exclude selection ops");
    filter_sel.icon = Icons.FILTER_SEL_OPS;
    OpsEditorStruct = new DataStruct([new DataPath(filter_sel, "filter_sel", "filter_sel", true)]);
    return OpsEditorStruct;
  }
  var ExtrudeModes=es6_import_item(_es6_module, 'spline_createops', 'ExtrudeModes');
  var AnimKeyStruct=undefined;
  function api_define_animkey() {
    if (AnimKeyStruct!=undefined)
      return AnimKeyStruct;
    AnimKeyStruct = new DataStruct([new DataPath(new IntProperty(-1, "id", "id"), "id", "id", true)]);
    return AnimKeyStruct;
  }
  api_define_animkey();
  window.AnimKeyStruct = AnimKeyStruct;
  window.AnimKeyStruct2 = AnimKeyStruct;
  var datablock_structs={}
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
    ImageUserStruct = new DataStruct([new DataPath(image, "image", "image", true), new DataPath(off, "off", "off", true), new DataPath(scale, "scale", "scale", true)]);
    return ImageUserStruct;
  }
  function api_define_view2d() {
    var only_render=new BoolProperty(0, "only_render", "Hide Controls");
    only_render.api_update = function(ctx, path) {
      window.redraw_viewport();
    }
    var draw_small_verts=new BoolProperty(0, "draw_small_verts", "Small Points", "Draw Pointers Smaller");
    draw_small_verts.api_update = function(ctx, path) {
      window.redraw_viewport();
    }
    var extrude_mode=new EnumProperty(0, ExtrudeModes, "extrude_mode", "Extrude Mode");
    var linewidth=new FloatProperty(2.0, "default_linewidth", "Line Wid");
    linewidth.range = [0.01, 100];
    var zoomprop=new FloatProperty(1, "zoom", "Zoom");
    zoomprop.update = function(ctx, path) {
      this.ctx.view2d.set_zoom(this.data);
    }
    zoomprop.range = zoomprop.real_range = zoomprop.ui_range = [0.1, 100];
    var draw_bg_image=new BoolProperty(0, "draw_bg_image", "Draw Image");
    var draw_video=new BoolProperty(0, "draw_video", "Draw Video");
    draw_video.update = draw_bg_image.update = function() {
      window.redraw_viewport();
    }
    var tool_mode=new EnumProperty("SELECT", ToolModes, "select", "Active Tool", "Active Tool");
    tool_mode.add_icons({SELECT: Icons.CURSOR_ARROW, APPEND: Icons.APPEND_VERTEX, RESIZE: Icons.RESIZE});
    var tweak_mode=new BoolProperty(0, "tweak_mode", "Tweak Mode");
    tweak_mode.icon = Icons.CURSOR_ARROW;
    var uinames={}
    for (var key in SelMask) {
        var k2=key[0].toUpperCase()+key.slice(1, key.length).toLowerCase();
        k2 = k2.replace(/\_/g, " ");
        uinames[key] = "Show "+k2+"s";
    }
    var selmask_mask=new FlagProperty(1, SelMask, uinames, undefined, "Sel Mask");
    selmask_mask.ui_key_names = uinames;
    selmask_mask.update = function() {
      window.redraw_viewport();
    }
    var background_color=new Vec3Property(undefined, "background_color", "Background");
    background_color.subtype = PropTypes.COLOR3;
    var default_stroke=new Vec4Property(undefined, "default_stroke", "Stroke");
    var default_fill=new Vec4Property(undefined, "default_fill", "Fill");
    default_stroke.subtype = default_fill.subtype = PropTypes.COLOR4;
    background_color.update = function() {
      window.redraw_viewport();
    }
    var edit_all_layers=new BoolProperty(0, "edit_all_layers", "Edit All Layers");
    let show_animpath_prop=new BoolProperty(0, "draw_anim_paths", "Show Animation Paths", "Edit Animation Keyframe Paths");
    show_animpath_prop.icon = Icons.SHOW_ANIMPATHS;
    View2DStruct = new DataStruct([new DataPath(edit_all_layers, "edit_all_layers", "edit_all_layers", true), new DataPath(background_color, "background_color", "background_color", true), new DataPath(default_stroke, "default_stroke", "default_stroke", true), new DataPath(default_fill, "default_fill", "default_fill", true), new DataPath(tool_mode, "toolmode", "toolmode", true), new DataPath(draw_small_verts, "draw_small_verts", "draw_small_verts", true), new DataPath(selmask_enum.copy(), "selectmode", "selectmode", true), new DataPath(selmask_mask.copy(), "selectmask", "selectmode", true), new DataPath(only_render, "only_render", "only_render", true), new DataPath(draw_bg_image, "draw_bg_image", "draw_bg_image", true), new DataPath(tweak_mode, "tweak_mode", "tweak_mode", true), new DataPath(new BoolProperty(0, "enable_blur", "Blur"), "enable_blur", "enable_blur", true), new DataPath(new BoolProperty(0, "draw_faces", "Show Faces"), "draw_faces", "draw_faces", true), new DataPath(draw_video, "draw_video", "draw_video", true), new DataPath(new BoolProperty(0, "draw_normals", "Show Normals", "Show Normal Comb"), "draw_normals", "draw_normals", true), new DataPath(show_animpath_prop, "draw_anim_paths", "draw_anim_paths", true), new DataPath(zoomprop, "zoom", "zoom", true), new DataPath(api_define_material(), "active_material", "active_material", true), new DataPath(linewidth, "default_linewidth", "default_linewidth", true), new DataPath(extrude_mode, "extrude_mode", "extrude_mode", true), new DataPath(new BoolProperty(0, "pin_paths", "Pin Paths", "Remember visible animation paths"), "pin_paths", "pin_paths", true), new DataPath(api_define_imageuser(), "background_image", "background_image", true)]);
    return View2DStruct;
  }
  var MaterialStruct;
  function api_define_material() {
    var fillclr=new Vec4Property(new Vector4(), "fill", "fill", "Fill Color");
    var strokeclr=new Vec4Property(new Vector4(), "stroke", "stroke", "Stroke Color");
    var update_base=function(material) {
      material.update();
      window.redraw_viewport();
    }
    var flag=new FlagProperty(1, MaterialFlags, undefined, "material flags", "material flags");
    flag.update = update_base;
    var fillpath=new DataPath(new BoolProperty(false, "fill_over_stroke", "fill_over_stroke", "fill_over_stroke"), "fill_over_stroke", "fill_over_stroke", true);
    fillclr.subtype = strokeclr.subtype = PropTypes.COLOR4;
    var linewidth=new FloatProperty(1, "linewidth", "linewidth", "Line Width");
    linewidth.range = [0.1, 200];
    var blur=new FloatProperty(1, "blur", "blur", "Blur");
    blur.range = [0.0, 800];
    fillclr.update = strokeclr.update = linewidth.update = blur.update = update_base;
    MaterialStruct = new DataStruct([new DataPath(fillclr, "fillcolor", "fillcolor", true), new DataPath(linewidth, "linewidth", "linewidth", true), new DataPath(flag, "flag", "flag", true)]);
    MaterialStruct.Color4("strokecolor", "strokecolor", "Stroke", "Stroke color").OnUpdate(update_base);
    MaterialStruct.Float("blur", "blur", "Blur", "Amount of blur").Range(0, 800).OnUpdate(update_base);
    return MaterialStruct;
  }
  var SplineFaceStruct;
  function api_define_spline_face() {
    var flagprop=new FlagProperty(2, SplineFlags, undefined, "Flags", "Flags");
    SplineFaceStruct = new DataStruct([new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true), new DataPath(api_define_material(), "mat", "mat", true), new DataPath(flagprop, "flag", "flag", true)]);
    return SplineFaceStruct;
  }
  var SplineVertexStruct;
  function api_define_spline_vertex() {
    var flagprop=new FlagProperty(2, SplineFlags, undefined, "Flags", "Flags");
    flagprop.ui_key_names["BREAK_CURVATURES"] = "Less Smooth";
    flagprop.ui_key_names["BREAK_TANGENTS"] = "Sharp Corner";
    var coprop=new Vec3Property(undefined, "co", "Co", "Coordinates");
    flagprop.update = function(owner) {
      this.ctx.spline.regen_sort();
      console.log("vertex update", owner);
      if (owner!=undefined) {
          owner.flag|=SplineFlags.UPDATE;
      }
      this.ctx.spline.propagate_update_flags();
      this.ctx.spline.resolve = 1;
      window.redraw_viewport();
    }
    SplineVertexStruct = new DataStruct([new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true), new DataPath(flagprop, "flag", "flag", true), new DataPath(coprop, "co", "", true)]);
    return SplineVertexStruct;
  }
  var SplineSegmentStruct;
  function api_define_spline_segment() {
    var flagprop=new FlagProperty(2, SplineFlags, undefined, "Flags", "Flags");
    flagprop.update = function(segment) {
      new Context().spline.regen_sort();
      segment.flag|=SplineFlags.REDRAW;
      console.log(segment);
      window.redraw_viewport();
    }
    var zprop=new FloatProperty(0, "z", "z", "z");
    zpath = new DataPath(zprop, "z", "z", true);
    zpath.update = function(segment, old_value, changed) {
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
    SplineSegmentStruct = new DataStruct([new DataPath(new IntProperty(0, "eid", "eid", "eid"), "eid", "eid", true), new DataPath(flagprop, "flag", "flag", true), new DataPath(new BoolProperty(0, "renderable", "renderable"), "renderable", "renderable", true), new DataPath(api_define_material(), "mat", "mat", true), zpath]);
    return SplineSegmentStruct;
  }
  var SplineLayerFlags=es6_import_item(_es6_module, 'spline_element_array', 'SplineLayerFlags');
  var SplineLayerStruct;
  function api_define_spline_layer_struct() {
    var flag=new FlagProperty(2, SplineLayerFlags);
    flag.flag_descriptions = {MASK: "Use previous layer as a mask"}
    flag.ui_key_names.MASK = flag.ui_value_names[SplineLayerFlags.MASK] = "Mask To Prev";
    flag.update = function() {
      window.redraw_viewport();
    }
    SplineLayerStruct = new DataStruct([new DataPath(new IntProperty(0, "id", "id", "id"), "id", "id", true), new DataPath(new StringProperty("", "name", "name", "name"), "name", "name", true), new DataPath(flag, "flag", "flag", true)]);
    window.SplineLayerStruct = SplineLayerStruct;
  }
  function api_define_multires_struct() {
    var co=new Vec2Property(undefined, "co", "co");
    var flag=new FlagProperty(1, MResFlags, undefined, "multires flags", "multires flags");
    flag.update = function() {
      window.redraw_viewport();
    }
    var support=new FloatProperty(0, "support", "support");
    support.range = [0.0001, 2.0];
    support.update = function() {
      window.redraw_viewport();
    }
    var degree=new FloatProperty(0, "degree", "degree");
    degree.range = [0.1, 65.0];
    degree.update = function() {
      window.redraw_viewport();
    }
    var MResPointStruct=new DataStruct([new DataPath(co, "co", "", true), new DataPath(flag, "flag", "flag", true), new DataPath(support, "support", "support", true), new DataPath(degree, "degree", "degree", true)]);
    return MResPointStruct;
  }
  function api_define_multires_array() {
    var MResPointStruct=api_define_multires_struct();
    var mpoints=new DataStructArray(function getstruct(item) {
      return MResPointStruct;
    }, function itempath(key) {
      return ".idmap[decompose_id("+key+")[0]].cdata.get_layer(MultiResLayer).get(decompose_id("+key+")[1])";
    }, function getitem(key) {
      var seg=decompose_id(key)[0];
      seg = this.local_idmap[seg];
      var mr=seg.cdata.get_layer(MultiResLayer);
      var p=decompose_id(key)[1];
      return mr.get(p);
    }, function getiter() {
      return iterpoints(this.spline, this.spline.actlevel);
    }, function getkeyiter() {
      return iterpoints(this.spline, this.spline.actlevel, true);
    }, function getlength() {
      return 1;
    });
    return mpoints;
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
    function define_editable_element_array(the_struct) {
      return new DataStructArray(function getstruct(item) {
        return the_struct;
      }, function itempath(key) {
        return ".local_idmap["+key+"]";
      }, function getitem(key) {
        return this.local_idmap[key];
      }, function getiter() {
        return this[Symbol.iterator]();
      }, function getkeyiter(ctx) {
        var keys=new GArray();
        var __iter_e=__get_iter(this.editable(ctx));
        var e;
        while (1) {
          var __ival_e=__iter_e.next();
          if (__ival_e.done) {
              break;
          }
          e = __ival_e.value;
          keys.push(e.eid);
        }
        return keys;
      }, function getlength() {
        let len=0;
        var __iter_e=__get_iter(this.editable(ctx));
        var e;
        while (1) {
          var __ival_e=__iter_e.next();
          if (__ival_e.done) {
              break;
          }
          e = __ival_e.value;
          len++;
        }
        return len;
      });
    }
    function define_element_array(the_struct) {
      return new DataStructArray(function getstruct(item) {
        return the_struct;
      }, function itempath(key) {
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
    var mres_points=api_define_multires_array();
    var mres_act_id="ctx.spline.segments.cdata.get_shared('MultiResLayer').active";
    var mres_act_path="eidmap[decompose_id(ID)[0]].cdata";
    mres_act_path+=".get_layer(MultiResLayer).get(decompose_id(ID)[1])";
    mres_act_path = mres_act_path.replace(/ID/g, mres_act_id);
    var SplineStruct=new DataStruct(api_define_DataBlock().concat([new DataPath(api_define_spline_face(), "active_face", "faces.active", true), new DataPath(api_define_spline_segment(), "active_segment", "segments.active", true), new DataPath(api_define_spline_vertex(), "active_vertex", "verts.active", true), new DataPath(define_element_array(SplineFaceStruct), "faces", "faces", true), new DataPath(define_element_array(SplineSegmentStruct), "segments", "segments", true), new DataPath(define_element_array(SplineVertexStruct), "verts", "verts", true), new DataPath(define_editable_element_array(SplineFaceStruct), "editable_faces", "faces", true), new DataPath(define_editable_element_array(SplineSegmentStruct), "editable_segments", "segments", true), new DataPath(define_editable_element_array(SplineVertexStruct), "editable_verts", "verts", true), new DataPath(layerset, "layerset", "layerset", true), new DataPath(mres_points, "mres_points", "segments", true), new DataPath(api_define_multires_struct(), "active_mres_point", mres_act_path, true), new DataPath(SplineLayerStruct, "active_layer", "layerset.active", true)]));
    datablock_structs[DataTypes.SPLINE] = SplineStruct;
    return SplineStruct;
  }
  function api_define_vertex_animdata() {
    var animflags=new FlagProperty("", VDAnimFlags, undefined, "animflags", "Anim Flags");
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
        return this.vertex_animdata[key];
      }, function getiter() {
        return this[Symbol.iterator]();
      }, function getkeyiter() {
        var keys=Object.keys(this.vertex_animdata);
        var ret=new GArray();
        for (var i=0; i<keys.length; i++) {
            ret.push(keys[i]);
        }
        return ret;
      }, function getlength() {
        let i=0;
        for (let k in this.vertex_animdata) {
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
  function api_define_scene() {
    var name=new StringProperty("", "name", "name", "Name", TPropFlags.LABEL);
    var frame=new IntProperty(0, "frame", "Frame", "Frame", TPropFlags.LABEL);
    frame.range = [1, 10000];
    var SceneStruct=new DataStruct(api_define_DataBlock().concat([new DataPath(name, "name", "name", true), new DataPath(frame, "frame", "time", true)]));
    datablock_structs[DataTypes.SCENE] = SceneStruct;
    return SceneStruct;
  }
  function get_theme_color(color) {
    var st;
    var name=new StringProperty("", "name", "name", "name");
    name = new DataPath(name, "name", "[0]", true);
    if (__instance_of(color[1], BoxColor4)) {
        var type=new StringProperty("Corners", "type", "type");
        var c1=new Vec4Property(new Vector4(), "c1", "c1", "Color 1");
        var c2=new Vec4Property(new Vector4(), "c2", "c2", "Color 2");
        var c3=new Vec4Property(new Vector4(), "c3", "c3", "Color 3");
        var c4=new Vec4Property(new Vector4(), "c4", "c4", "Color 4");
        c1.subtype = c2.subtype = c3.subtype = c4.subtype = PropTypes.COLOR4;
        function gen_func(i) {
          function update() {
            g_theme.gen_globals();
            SettingsUpdate();
          }
        }
        c1.update = gen_func(0);
        c2.update = gen_func(1);
        c3.update = gen_func(2);
        c4.update = gen_func(3);
        st = new DataStruct([new DataPath(type, "type", "type", true, false), name, new DataPath(c1, "c1", "[1].colors[0]", true), new DataPath(c2, "c2", "[1].colors[1]", true), new DataPath(c3, "c3", "[1].colors[2]", true), new DataPath(c4, "c4", "[1].colors[3]", true)]);
    }
    else 
      if (__instance_of(color[1], BoxWColor)) {
        var type=new StringProperty("Weighted", "type", "type");
        var clr=new Vec4Property(new Vector4(), "color", "color", "color");
        var weights=new Vec4Property(new Vector4(), "weight", "weight", "weight");
        clr.subtype = PropTypes.COLOR4;
        clr.update = function() {
          g_theme.gen_globals();
          SettingsUpdate();
        };
        weights.update = function() {
          g_theme.gen_globals();
          SettingsUpdate();
        };
        weights.range = weights.real_range = weights.ui_range = [0, 1];
        st = new DataStruct([new DataPath(type, "type", "type", true, false), name, new DataPath(clr, "color", "[1].color", true), new DataPath(weights, "weights", "[1].weights", true)]);
    }
    else {
      var clr=new Vec4Property(new Vector4(), "color", "color", "color");
      clr.subtype = PropTypes.COLOR4;
      clr.update = function(color) {
        g_theme.gen_globals();
        SettingsUpdate();
      };
      var type=new StringProperty("Simple", "type", "type");
      st = new DataStruct([new DataPath(type, "type", "type", true, false), name, new DataPath(clr, "color", "[1]", true)]);
    }
    return st;
  }
  var ColorThemeStruct=undefined;
  function api_define_colortheme() {
    var colors=new DataStructArray(get_theme_color, function getpath(key) {
      return "["+key+"]";
    }, function getitem(key) {
      return this[key];
    }, function getiter() {
      return this[Symbol.iterator]();
    }, function getkeyiter() {
      arr = [];
      for (var i=0; i<this.length; i++) {
          arr.push(i);
      }
      return arr[Symbol.iterator]();
    }, function getlength() {
      return this.length;
    });
    ColorThemeStruct = new DataStruct([new DataPath(colors, "colors", "flat_colors", false)]);
    return ColorThemeStruct;
  }
  var ThemeStruct=undefined;
  function api_define_theme() {
    api_define_colortheme();
    ThemeStruct = new DataStruct([new DataPath(ColorThemeStruct, "ui", "ui", false), new DataPath(ColorThemeStruct, "view2d", "view2d", false)]);
    return ThemeStruct;
  }
  var DopeSheetStruct=undefined;
  function api_define_dopesheet() {
    var selected_only=new BoolProperty(false, "selected_only", "Selected Only", "Show only keys of selected vertices");
    var pinned=new BoolProperty(false, "pinned", "Pin", "Pin view");
    selected_only.update = function() {
      if (this.ctx!=undefined&&this.ctx.dopesheet!=undefined)
        this.ctx.dopesheet.do_full_recalc();
    }
    DopeSheetStruct = new DataStruct([new DataPath(selected_only, "selected_only", "selected_only", true), new DataPath(pinned, "pinned", "pinned", true)]);
    return DopeSheetStruct;
  }
  var CurveEditStruct=undefined;
  function api_define_editcurve() {
    var selected_only=new BoolProperty(false, "selected_only", "Selected Only", "Show only keys of selected vertices");
    var pinned=new BoolProperty(false, "pinned", "Pin", "Pin view");
    selected_only.update = function() {
      if (this.ctx!=undefined&&this.ctx.editcurve!=undefined)
        this.ctx.editcurve.do_full_recalc();
    }
    CurveEditStruct = new DataStruct([new DataPath(selected_only, "selected_only", "selected_only", true), new DataPath(pinned, "pinned", "pinned", true)]);
    return CurveEditStruct;
  }
  var ObjectStruct=undefined;
  function api_define_object() {
    var name=new StringProperty("", "name", "name", "Name", TPropFlags.LABEL);
    var ctx_bb=new Vec3Property(new Vector3(), "dimensions", "Dimensions", "Editable dimensions");
    ctx_bb.flag|=TPropFlags.USE_UNDO;
    ctx_bb.update = function() {
      if (this.ctx.mesh!=undefined)
        this.ctx.mesh.regen_render();
      if (this.ctx.view2d!=undefined&&this.ctx.view2d.selectmode&EditModes.GEOMETRY) {
          this.ctx.object.dag_update();
      }
    }
    ObjectStruct = new DataStruct([new DataPath(name, "name", "name", true), new DataPath(ctx_bb, "ctx_bb", "ctx_bb", true)]);
    return ObjectStruct;
  }
  var ImageStruct=undefined;
  function api_define_image() {
    var name=new StringProperty("");
    var lib_id=new IntProperty(0);
    var path=new StringProperty("");
    var flag=new FlagProperty(1, ImageFlags, undefined, "image flags", "image flags");
    ImageStruct = new DataStruct([new DataPath(name, "name", "name", true), new DataPath(lib_id, "lib_id", "lib_id", true), new DataPath(path, 'path', 'path', true), new DataPath(flag, 'flag', 'flag', true)]);
    datablock_structs[DataTypes.IMAGE] = ImageStruct;
    return ImageStruct;
  }
  function api_define_datalist(name, typeid) {
    var items=new DataStructArray(function getstruct(item) {
      return datablock_structs[item.lib_type];
    }, function itempath(key) {
      return "["+key+"]";
    }, function getitem(key) {
      return this[key];
    }, function getiter() {
      var ret=[];
      for (var k in this) {
          ret.push(this[k]);
      }
      return ret[Symbol.iterator]();
    }, function getkeyiter() {
      return list(this)[Symbol.iterator]();
    }, function getlength() {
      return list(this).length;
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
    function range(len) {
      var __gen_this2=this;
      function _generator_iter() {
        this.scope = {len_0: len, i_1: undefined}
        this.ret = {done: false, value: undefined}
        this.state = 1;
        this.trystack = [];
        this.next = function() {
          var ret;
          var stack=this.trystack;
          try {
            ret = this._next();
          }
          catch (err) {
              if (stack.length>0) {
                  var item=stack.pop(stack.length-1);
                  this.state = item[0];
                  this.scope[item[1]] = err;
                  return this.next();
              }
              else {
                throw err;
              }
          }
          return ret;
        }
        this.push_trystack = function(catchstate, catchvar) {
          this.trystack.push([catchstate, catchvar]);
        }
        this.pop_trystack = function() {
          this.trystack.pop(this.trystack.length-1);
        }
        this._next = function() {
          var $__ret=undefined;
          var $__state=this.state;
          var scope=this.scope;
          while ($__state<5) {
            switch ($__state) {
              case 0:
                break;
              case 1:
                scope.i_1=0;
                
                $__state = 2;
                break;
              case 2:
                $__state = (scope.i_1<scope.len_0) ? 3 : 5;
                break;
              case 3:
                $__ret = this.ret;
                $__ret.value = scope.i_1;
                
                $__state = 4;
                break;
              case 4:
                scope.i_1++;
                
                $__state = 2;
                break;
              case 5:
                break;
              default:
                console.log("Generator state error");
                console.trace();
                break;
            }
            if ($__ret!=undefined) {
                break;
            }
          }
          if ($__ret!=undefined) {
              this.ret.value = $__ret.value;
          }
          else {
            this.ret.done = true;
            this.ret.value = undefined;
          }
          this.state = $__state;
          return this.ret;
        }
        this[Symbol.iterator] = function() {
          return this;
        }
        this.forEach = function(callback, thisvar) {
          if (thisvar==undefined)
            thisvar = self;
          var _i=0;
          while (1) {
            var ret=this.next();
            if (ret==undefined||ret.done||(ret._ret!=undefined&&ret._ret.done))
              break;
            callback.call(thisvar, ret.value);
            if (_i++>100) {
                console.log("inf loop", ret);
                break;
            }
          }
        }
      }
      return new _generator_iter();
    }
    return range(g_app_state.toolstack.undostack.length)[Symbol.iterator]();
  }, function getlength() {
    return g_app_state.toolstack.undostack.length;
  });
  ContextStruct = undefined;
  window.test_range = function range(len) {
    var __gen_this2=this;
    function _generator_iter() {
      this.scope = {len_0: len, i_1: undefined}
      this.ret = {done: false, value: undefined}
      this.state = 1;
      this.trystack = [];
      this.next = function() {
        var ret;
        var stack=this.trystack;
        try {
          ret = this._next();
        }
        catch (err) {
            if (stack.length>0) {
                var item=stack.pop(stack.length-1);
                this.state = item[0];
                this.scope[item[1]] = err;
                return this.next();
            }
            else {
              throw err;
            }
        }
        return ret;
      }
      this.push_trystack = function(catchstate, catchvar) {
        this.trystack.push([catchstate, catchvar]);
      }
      this.pop_trystack = function() {
        this.trystack.pop(this.trystack.length-1);
      }
      this._next = function() {
        var $__ret=undefined;
        var $__state=this.state;
        var scope=this.scope;
        while ($__state<5) {
          switch ($__state) {
            case 0:
              break;
            case 1:
              scope.i_1=0;
              
              $__state = 2;
              break;
            case 2:
              $__state = (scope.i_1<scope.len_0) ? 3 : 5;
              break;
            case 3:
              $__ret = this.ret;
              $__ret.value = scope.i_1;
              
              $__state = 4;
              break;
            case 4:
              scope.i_1++;
              
              $__state = 2;
              break;
            case 5:
              break;
            default:
              console.log("Generator state error");
              console.trace();
              break;
          }
          if ($__ret!=undefined) {
              break;
          }
        }
        if ($__ret!=undefined) {
            this.ret.value = $__ret.value;
        }
        else {
          this.ret.done = true;
          this.ret.value = undefined;
        }
        this.state = $__state;
        return this.ret;
      }
      this[Symbol.iterator] = function() {
        return this;
      }
      this.forEach = function(callback, thisvar) {
        if (thisvar==undefined)
          thisvar = self;
        var _i=0;
        while (1) {
          var ret=this.next();
          if (ret==undefined||ret.done||(ret._ret!=undefined&&ret._ret.done))
            break;
          callback.call(thisvar, ret.value);
          if (_i++>100) {
              console.log("inf loop", ret);
              break;
          }
        }
      }
    }
    return new _generator_iter();
  }
  window.api_define_context = function() {
    ContextStruct = new DataStruct([new DataPath(api_define_view2d(), "view2d", "ctx.view2d", true), new DataPath(api_define_dopesheet(), "dopesheet", "ctx.dopesheet", true), new DataPath(api_define_editcurve(), "editcurve", "ctx.editcurve", true), new DataPath(api_define_frameset(), "frameset", "ctx.frameset", true), new DataPath(api_define_seditor(), "settings_editor", "ctx.settings_editor", false), new DataPath(api_define_settings(), "settings", "ctx.appstate.session.settings", false), new DataPath(api_define_object(), "object", "ctx.object", false), new DataPath(api_define_scene(), "scene", "ctx.scene", false), new DataPath(new DataStruct([]), "last_tool", "", false, false, DataFlags.RECALC_CACHE), new DataPath(api_define_appstate(), "appstate", "ctx.appstate", false), new DataPath(OpStackArray, "operator_stack", "ctx.appstate.toolstack.undostack", false, true, DataFlags.RECALC_CACHE), new DataPath(api_define_theme(), "theme", "g_theme", false), new DataPath(api_define_spline(), "spline", "ctx.spline", false), new DataPath(api_define_datalib(), "datalib", "ctx.datalib", false), new DataPath(api_define_opseditor(), "opseditor", "ctx.opseditor", false)]);
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
}, '/dev/fairmotion/src/core/data_api_define.js');
var data_ops_list;
es6_module_define('data_api_opdefine', ["spline_editops", "view2d_spline_ops", "spline_createops", "../editors/viewport/spline_editops", "view2d", "safe_eval", "spline_animops", "view2d_editor", "FrameManager_ops", "toolops_api", "FrameManager", "view2d_ops", "spline_selectops", "spline_layerops", "image_ops", "transform", "theplatform", "dialogs"], function _data_api_opdefine_module(_es6_module) {
  var FileDialog=es6_import_item(_es6_module, 'dialogs', 'FileDialog');
  var FileOpenOp=es6_import_item(_es6_module, 'dialogs', 'FileOpenOp');
  var FileSaveAsOp=es6_import_item(_es6_module, 'dialogs', 'FileSaveAsOp');
  var FileNewOp=es6_import_item(_es6_module, 'dialogs', 'FileNewOp');
  var FileSaveOp=es6_import_item(_es6_module, 'dialogs', 'FileSaveOp');
  var ProgressDialog=es6_import_item(_es6_module, 'dialogs', 'ProgressDialog');
  var LoginDialog=es6_import_item(_es6_module, 'dialogs', 'LoginDialog');
  var FileSaveSVGOp=es6_import_item(_es6_module, 'dialogs', 'FileSaveSVGOp');
  var FileSaveB64Op=es6_import_item(_es6_module, 'dialogs', 'FileSaveB64Op');
  var FileDialog=es6_import_item(_es6_module, 'dialogs', 'FileDialog');
  var error_dialog=es6_import_item(_es6_module, 'dialogs', 'error_dialog');
  var import_json=es6_import_item(_es6_module, 'dialogs', 'import_json');
  var download_file=es6_import_item(_es6_module, 'dialogs', 'download_file');
  var FileOpenRecentOp=es6_import_item(_es6_module, 'dialogs', 'FileOpenRecentOp');
  var LoadImageOp=es6_import_item(_es6_module, 'image_ops', 'LoadImageOp');
  var DeleteVertOp=es6_import_item(_es6_module, 'spline_editops', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, 'spline_editops', 'DeleteSegmentOp');
  var DeleteFaceOp=es6_import_item(_es6_module, 'spline_editops', 'DeleteFaceOp');
  var ChangeFaceZ=es6_import_item(_es6_module, 'spline_editops', 'ChangeFaceZ');
  var SplitEdgeOp=es6_import_item(_es6_module, 'spline_editops', 'SplitEdgeOp');
  var DuplicateOp=es6_import_item(_es6_module, 'spline_editops', 'DuplicateOp');
  var DisconnectHandlesOp=es6_import_item(_es6_module, 'spline_editops', 'DisconnectHandlesOp');
  var SplitEdgePickOp=es6_import_item(_es6_module, 'spline_editops', 'SplitEdgePickOp');
  var ToolOp=es6_import_item(_es6_module, 'toolops_api', 'ToolOp');
  var ToolMacro=es6_import_item(_es6_module, 'toolops_api', 'ToolMacro');
  var ToolFlags=es6_import_item(_es6_module, 'toolops_api', 'ToolFlags');
  var UndoFlags=es6_import_item(_es6_module, 'toolops_api', 'UndoFlags');
  var EditModes=es6_import_item(_es6_module, 'view2d', 'EditModes');
  var transform=es6_import(_es6_module, 'transform');
  var spline_selectops=es6_import(_es6_module, 'spline_selectops');
  var spline_createops=es6_import(_es6_module, 'spline_createops');
  var spline_editops=es6_import(_es6_module, 'spline_editops');
  var spline_animops=es6_import(_es6_module, 'spline_animops');
  var spline_layerops=es6_import(_es6_module, 'spline_layerops');
  var FrameManager=es6_import(_es6_module, 'FrameManager');
  var FrameManager_ops=es6_import(_es6_module, 'FrameManager_ops');
  var safe_eval=es6_import(_es6_module, 'safe_eval');
  var TransSplineVert=es6_import_item(_es6_module, 'transform', 'TransSplineVert');
  var TransData=es6_import_item(_es6_module, 'transform', 'TransData');
  var TransformOp=es6_import_item(_es6_module, 'transform', 'TransformOp');
  var TranslateOp=es6_import_item(_es6_module, 'transform', 'TranslateOp');
  var ScaleOp=es6_import_item(_es6_module, 'transform', 'ScaleOp');
  var RotateOp=es6_import_item(_es6_module, 'transform', 'RotateOp');
  var SelectOpBase=es6_import_item(_es6_module, 'spline_selectops', 'SelectOpBase');
  var SelectOneOp=es6_import_item(_es6_module, 'spline_selectops', 'SelectOneOp');
  var ToggleSelectAllOp=es6_import_item(_es6_module, 'spline_selectops', 'ToggleSelectAllOp');
  var SelectLinkedOp=es6_import_item(_es6_module, 'spline_selectops', 'SelectLinkedOp');
  var HideOp=es6_import_item(_es6_module, 'spline_selectops', 'HideOp');
  var UnhideOp=es6_import_item(_es6_module, 'spline_selectops', 'UnhideOp');
  var CircleSelectOp=es6_import_item(_es6_module, 'spline_selectops', 'CircleSelectOp');
  var ExtrudeModes=es6_import_item(_es6_module, 'spline_createops', 'ExtrudeModes');
  var ExtrudeVertOp=es6_import_item(_es6_module, 'spline_createops', 'ExtrudeVertOp');
  var CreateEdgeOp=es6_import_item(_es6_module, 'spline_createops', 'CreateEdgeOp');
  var CreateEdgeFaceOp=es6_import_item(_es6_module, 'spline_createops', 'CreateEdgeFaceOp');
  var ImportJSONOp=es6_import_item(_es6_module, 'spline_createops', 'ImportJSONOp');
  var KeyCurrentFrame=es6_import_item(_es6_module, 'spline_editops', 'KeyCurrentFrame');
  var ShiftLayerOrderOp=es6_import_item(_es6_module, 'spline_editops', 'ShiftLayerOrderOp');
  var SplineGlobalToolOp=es6_import_item(_es6_module, 'spline_editops', 'SplineGlobalToolOp');
  var SplineLocalToolOp=es6_import_item(_es6_module, 'spline_editops', 'SplineLocalToolOp');
  var KeyEdgesOp=es6_import_item(_es6_module, 'spline_editops', 'KeyEdgesOp');
  var CopyPoseOp=es6_import_item(_es6_module, 'spline_editops', 'CopyPoseOp');
  var PastePoseOp=es6_import_item(_es6_module, 'spline_editops', 'PastePoseOp');
  var InterpStepModeOp=es6_import_item(_es6_module, 'spline_editops', 'InterpStepModeOp');
  var DeleteVertOp=es6_import_item(_es6_module, 'spline_editops', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, 'spline_editops', 'DeleteSegmentOp');
  var DeleteFaceOp=es6_import_item(_es6_module, 'spline_editops', 'DeleteFaceOp');
  var ChangeFaceZ=es6_import_item(_es6_module, 'spline_editops', 'ChangeFaceZ');
  var DissolveVertOp=es6_import_item(_es6_module, 'spline_editops', 'DissolveVertOp');
  var SplitEdgeOp=es6_import_item(_es6_module, 'spline_editops', 'SplitEdgeOp');
  var VertPropertyBaseOp=es6_import_item(_es6_module, 'spline_editops', 'VertPropertyBaseOp');
  var ToggleBreakTanOp=es6_import_item(_es6_module, 'spline_editops', 'ToggleBreakTanOp');
  var ToggleBreakCurvOp=es6_import_item(_es6_module, 'spline_editops', 'ToggleBreakCurvOp');
  var ConnectHandlesOp=es6_import_item(_es6_module, 'spline_editops', 'ConnectHandlesOp');
  var DisconnectHandlesOp=es6_import_item(_es6_module, 'spline_editops', 'DisconnectHandlesOp');
  var AnimPlaybackOp=es6_import_item(_es6_module, 'spline_editops', 'AnimPlaybackOp');
  var ToggleManualHandlesOp=es6_import_item(_es6_module, 'spline_editops', 'ToggleManualHandlesOp');
  var ShiftTimeOp=es6_import_item(_es6_module, 'spline_editops', 'ShiftTimeOp');
  var DuplicateOp=es6_import_item(_es6_module, 'spline_editops', 'DuplicateOp');
  var SplineMirrorOp=es6_import_item(_es6_module, 'spline_editops', 'SplineMirrorOp');
  var AddLayerOp=es6_import_item(_es6_module, 'spline_layerops', 'AddLayerOp');
  var ChangeLayerOp=es6_import_item(_es6_module, 'spline_layerops', 'ChangeLayerOp');
  var ChangeElementLayerOp=es6_import_item(_es6_module, 'spline_layerops', 'ChangeElementLayerOp');
  var SplitAreasTool=es6_import_item(_es6_module, 'FrameManager_ops', 'SplitAreasTool');
  var CollapseAreasTool=es6_import_item(_es6_module, 'FrameManager_ops', 'CollapseAreasTool');
  var HintPickerOpElement=es6_import_item(_es6_module, 'FrameManager_ops', 'HintPickerOpElement');
  var HintPickerOp=es6_import_item(_es6_module, 'FrameManager_ops', 'HintPickerOp');
  var RenderAnimOp=es6_import_item(_es6_module, 'view2d_spline_ops', 'RenderAnimOp');
  var PlayAnimOp=es6_import_item(_es6_module, 'view2d_spline_ops', 'PlayAnimOp');
  var SessionFlags=es6_import_item(_es6_module, 'view2d_editor', 'SessionFlags');
  var ExportCanvasImage=es6_import_item(_es6_module, 'view2d_ops', 'ExportCanvasImage');
  var theplatform=es6_import(_es6_module, 'theplatform');
  var SplitEdgePickOp=es6_import_item(_es6_module, '../editors/viewport/spline_editops', 'SplitEdgePickOp');
  var QuitFileOp=_ESClass("QuitFileOp", ToolOp, [_ESClass.static(function tooldef() {
    return {uiname: "Quit", apiname: "appstate.quit", is_modal: true, inputs: {}, outputs: {}, undoflag: UndoFlags.IGNORE_UNDO}
  }), function start_modal(ctx) {
    ToolOp.prototype.start_modal.call(this, ctx);
    this.end_modal(ctx);
    theplatform.app.quit_app();
  }, function QuitFileOp() {
    ToolOp.apply(this, arguments);
  }]);
  _es6_module.add_class(QuitFileOp);
  data_ops_list = undefined;
  window.api_define_ops = function() {
    data_ops_list = {"mesh.subdivide": function(ctx, args) {
      if (!("faces" in args))
        throw TinyParserError;
      return new MeshToolOp(new QuadSubdOp(args["faces"], 1));
    }, "mesh.inset": function(ctx, args) {
      if (!("faces" in args))
        throw TinyParserError;
      return new MeshToolOp(new InsetRegionsOp(args["faces"]));
    }, "mesh.vertsmooth": function(ctx, args) {
      if (!("verts" in args))
        throw TinyParserError;
      return new MeshToolOp(new VertSmoothOp(args["verts"]));
    }, "spline.add_layer": function(ctx, args) {
      return new AddLayerOp(args.name);
    }, "spline.change_face_z": function(ctx, args) {
      if (!("offset" in args))
        throw new TinyParserError();
      return new ChangeFaceZ(parseInt(args["offset"]), parseInt(args["selmode"]));
    }, "spline.toggle_break_curvature": function(ctx, args) {
      return new ToggleBreakCurvOp();
    }, "spline.toggle_break_tangents": function(ctx, args) {
      return new ToggleBreakTanOp();
    }, "spline.translate": function(ctx, args) {
      var op=new TranslateOp(EditModes.GEOMETRY, ctx.object);
      if ("datamode" in args) {
          op.inputs.datamode.set_data(args["datamode"]);
      }
      op.inputs.edit_all_layers.set_data(ctx.view2d.edit_all_layers);
      console.log("=====", args, ctx.view2d.session_flag, ctx.view2d.propradius);
      if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
          op.inputs.proportional.set_data(true);
          op.inputs.propradius.set_data(ctx.view2d.propradius);
      }
      return op;
    }, "spline.rotate": function(ctx, args) {
      var op=new RotateOp(EditModes.GEOMETRY, ctx.object);
      if ("datamode" in args) {
          op.inputs.datamode.set_data(args["datamode"]);
      }
      op.inputs.edit_all_layers.set_data(ctx.view2d.edit_all_layers);
      if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
          op.inputs.proportional.set_data(true);
          op.inputs.propradius.set_data(ctx.view2d.propradius);
      }
      return op;
    }, "spline.scale": function(ctx, args) {
      var op=new ScaleOp(EditModes.GEOMETRY, ctx.object);
      if ("datamode" in args) {
          op.inputs.datamode.set_data(args["datamode"]);
      }
      op.inputs.edit_all_layers.set_data(ctx.view2d.edit_all_layers);
      if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
          op.inputs.proportional.set_data(true);
          op.inputs.propradius.set_data(ctx.view2d.propradius);
      }
      return op;
    }, "spline.key_edges": function(ctx, args) {
      return new KeyEdgesOp();
    }, "view2d.export_image": function(ctx, args) {
      return new ExportCanvasImage();
    }, "editor.copy_pose": function(ctx, args) {
      return new CopyPoseOp();
    }, "editor.paste_pose": function(ctx, args) {
      return new PastePoseOp();
    }, "editor.playback": function(ctx, args) {
      return new AnimPlaybackOp();
    }, "spline.key_current_frame": function(ctx, args) {
      return new KeyCurrentFrame();
    }, "spline.shift_time": function(ctx, args) {
      return new ShiftTimeOp();
    }, "spline.delete_faces": function(ctx, args) {
      return new DeleteFaceOp();
    }, "spline.toggle_manual_handles": function(ctx, args) {
      return new ToggleManualHandlesOp();
    }, "spline.delete_segments": function(ctx, args) {
      return new DeleteSegmentOp();
    }, "spline.delete_verts": function(ctx, args) {
      return new DeleteVertOp();
    }, "spline.dissolve_verts": function(ctx, args) {
      return new DissolveVertOp();
    }, "spline.make_edge": function(ctx, args) {
      return new CreateEdgeOp(ctx.view2d.default_linewidth);
    }, "spline.make_edge_face": function(ctx, args) {
      return new CreateEdgeFaceOp(ctx.view2d.default_linewidth);
    }, "spline.split_edges": function(ctx, args) {
      return new SplitEdgeOp();
    }, "spline.split_pick_edge": function(ctx, args) {
      return new SplitEdgePickOp();
    }, "spline.toggle_step_mode": function(ctx, args) {
      return new InterpStepModeOp();
    }, "spline.mirror_verts": function(ctx, args) {
      return new SplineMirrorOp();
    }, "spline.duplicate_transform": function(ctx, args) {
      var tool=new DuplicateOp();
      var macro=new ToolMacro("duplicate_transform", "Duplicate");
      macro.description = tool.description;
      macro.add_tool(tool);
      macro.icon = tool.icon;
      var transop=new TranslateOp(ctx.view2d.mpos, 1|2);
      macro.add_tool(transop);
      return macro;
    }, "spline.toggle_select_all": function(ctx, args) {
      var op=new ToggleSelectAllOp();
      return op;
    }, "spline.connect_handles": function(ctx, args) {
      return new ConnectHandlesOp();
    }, "spline.disconnect_handles": function(ctx, args) {
      return new DisconnectHandlesOp();
    }, "spline.hide": function(ctx, args) {
      return new HideOp(args.selmode, args.ghost);
    }, "spline.unhide": function(ctx, args) {
      return new UnhideOp(args.selmode, args.ghost);
    }, "image.load_image": function(ctx, args) {
      return new LoadImageOp(args.datapath, args.name);
    }, "spline.select_linked": function(ctx, args) {
      if (!("vertex_eid" in args)) {
          throw new Error("need a vertex_eid argument");
      }
      var op=new SelectLinkedOp();
      op.inputs.vertex_eid.set_data(args.vertex_eid);
      return op;
    }, "view2d.circle_select": function(ctx, args) {
      return new CircleSelectOp(ctx.view2d.selectmode);
    }, "view2d.render_anim": function(Ctx, args) {
      return new RenderAnimOp();
    }, "view2d.play_anim": function(Ctx, args) {
      return new PlayAnimOp();
    }, "appstate.open": function(ctx, args) {
      return new FileOpenOp();
    }, "appstate.open_recent": function(ctx, args) {
      return new FileOpenRecentOp();
    }, "appstate.export_svg": function(ctx, args) {
      return new FileSaveSVGOp();
    }, "appstate.export_al3_b64": function(ctx, args) {
      return new FileSaveB64Op();
    }, "appstate.save": function(ctx, args) {
      return new FileSaveOp();
    }, "appstate.save_as": function(ctx, args) {
      return new FileSaveAsOp();
    }, "appstate.new": function(ctx, args) {
      return new FileNewOp();
    }, "appstate.quit": function(ctx, args) {
      return new QuitFileOp();
    }, "screen.area_split_tool": function(ctx, args) {
      return new SplitAreasTool(g_app_state.screen);
    }, "screen.hint_picker": function(ctx, args) {
      return new HintPickerOp();
    }, "object.toggle_select_all": function(ctx, args) {
      return new ToggleSelectObjOp("auto");
    }, "object.translate": function(ctx, args) {
      return new TranslateOp(EditModes.OBJECT, ctx.object);
    }, "object.rotate": function(ctx, args) {
      return new RotateOp(EditModes.OBJECT);
    }, "object.scale": function(ctx, args) {
      return new ScaleOp(EditModes.OBJECT);
    }, "object.duplicate": function(ctx, args) {
      return new ObjectDuplicateOp(ctx.scene.objects.selected);
    }, "object.set_parent": function(ctx, args) {
      var op=new ObjectParentOp();
      op.flag|=ToolFlags.USE_DEFAULT_INPUT;
      return op;
    }, "object.delete_selected": function(ctx, args) {
      var op=new ObjectDeleteOp();
      op.flag|=ToolFlags.USE_DEFAULT_INPUT;
      return op;
    }}
  }
}, '/dev/fairmotion/src/core/data_api_opdefine.js');
