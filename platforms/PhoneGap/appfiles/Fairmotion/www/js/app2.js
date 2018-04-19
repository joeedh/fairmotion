es6_module_define('spline_element_array', ["struct", "eventdag", "spline_types"], function _spline_element_array_module(_es6_module) {
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var CustomDataLayer=es6_import_item(_es6_module, 'spline_types', 'CustomDataLayer');
  var CustomData=es6_import_item(_es6_module, 'spline_types', 'CustomData');
  var CustomDataSet=es6_import_item(_es6_module, 'spline_types', 'CustomDataSet');
  var DataPathNode=es6_import_item(_es6_module, 'eventdag', 'DataPathNode');
  var SplineLayerFlags={HIDE: 2, CAN_SELECT: 4, MASK: 8}
  SplineLayerFlags = _es6_module.add_export('SplineLayerFlags', SplineLayerFlags);
  var SplineLayer=_ESClass("SplineLayer", set, [function SplineLayer(elements) {
    if (elements==undefined) {
        elements = undefined;
    }
    set.call(this, elements);
    this.id = -1;
    this.order = 0;
    this.flag = 0;
    this.name = "unnamed";
  }, function add(e) {
    if (e==undefined) {
        console.trace("WARNING: e was undefined in SplineLayer.add");
        return ;
    }
    set.prototype.add.call(this, e);
    e.layers[this.id] = 1;
  }, function remove(e) {
    set.prototype.remove.call(this, e);
    delete e.layers[this.id];
  }, function _to_EIDs() {
    var ret=[];
    var __iter_e=__get_iter(this);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      ret.push(e.eid);
    }
    return ret;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new SplineLayer();
    reader(ret);
    return ret;
  }), function afterSTRUCT(spline) {
    if (this.eids===undefined)
      return ;
    var corrupted=false;
    var __iter_eid=__get_iter(this.eids);
    var eid;
    while (1) {
      var __ival_eid=__iter_eid.next();
      if (__ival_eid.done) {
          break;
      }
      eid = __ival_eid.value;
      var e=spline.eidmap[eid];
      if (e===undefined) {
          corrupted = true;
          continue;
      }
      this.add(e);
    }
    if (corrupted) {
        console.trace("Warning: corrupted layerset!", this, spline, "<==");
    }
    delete this.eids;
  }]);
  _es6_module.add_class(SplineLayer);
  SplineLayer = _es6_module.add_export('SplineLayer', SplineLayer);
  SplineLayer.STRUCT = "\nSplineLayer {\n  id    : int;\n  order : int;\n  flag  : int;\n  eids  : array(int) | obj._to_EIDs();\n  name  : string;\n}\n";
  var SplineLayerSet=_ESClass("SplineLayerSet", Array, [function SplineLayerSet() {
    Array.call(this);
    this.active = undefined;
    this.namemap = {}
    this.idmap = {}
    this.idgen = new SDIDGen();
    this._active = undefined;
    this.flag = 0;
  }, function get(id) {
    if (id==undefined) {
        throw new Error("id cannot be undefined");
    }
    if (!(id in this.idmap)) {
        console.log("WARNING: layer ", id, "not in spline layerset!", this);
        return undefined;
    }
    return this.idmap[id];
  }, _ESClass.get(function active() {
    if (this._active==undefined) {
        this._active = this[0];
    }
    return this._active;
  }), _ESClass.set(function active(val) {
    this._active = val;
  }), function new_layer() {
    var ret=new SplineLayer();
    ret.name = this.new_name();
    ret.id = this.idgen.gen_id();
    this.push(ret);
    return ret;
  }, function new_name() {
    var name="Layer", i=1;
    while ((name+" "+i) in this.namemap) {
      i++;
    }
    return name+" "+i;
  }, function validate_name(layer) {
    if (!(name in this.namemap))
      return ;
    var i=1;
    while ((name+" "+i) in this.namemap) {
      i++;
    }
    layer.name = name+" "+i;
  }, function push(layer) {
    this.validate_name(layer.name);
    this.namemap[layer.name] = layer;
    this.idmap[layer.id] = layer;
    Array.prototype.push.call(this, layer);
    this.update_orders();
    if (this.active==undefined)
      this.active = layer;
  }, function insert(i, layer) {
    this.validate_name(layer.name);
    this.namemap[layer.name] = layer;
    this.idmap[layer.id] = layer;
    Array.prototype.insert.call(this, i, layer);
    this.update_orders();
  }, function change_layer_order(layer, new_i) {
    var start=this.indexOf(layer);
    if (start==undefined) {
        console.trace("Evil error in change_layer_order!", layer, new_i);
        return ;
    }
    if (new_i==start)
      return ;
    var min=Math.min(new_i, start), max=Math.max(new_i, start);
    var diff=max-min;
    idx = start;
    if (start>new_i) {
        for (var i=0; i<diff; i++) {
            if (idx<1)
              break;
            var t=this[idx];
            this[idx] = this[idx-1];
            this[idx-1] = t;
            idx--;
        }
    }
    else {
      for (var i=0; i<diff; i++) {
          if (idx>=this.length-1)
            break;
          var t=this[idx];
          this[idx] = this[idx+1];
          this[idx+1] = t;
          idx++;
      }
    }
    this.update_orders();
  }, function update_orders() {
    for (var i=0; i<this.length; i++) {
        this[i].order = i;
    }
  }, function _new_active(i) {
    if (this.length==0) {
        console.log("WARNING: no layers left, adding a layer!");
        this.new_layer();
        return ;
    }
    i = Math.min(Math.max(0, i), this.length-1);
    this.active = this[i];
  }, function remove(layer) {
    var i=this.indexOf(layer);
    Array.prototype.remove.call(this, layer);
    delete this.namemap[layer.name];
    delete this.idmap[layer.id];
    if (layer==this.active)
      this._new_active(i);
    this.update_orders();
  }, function pop_i(i) {
    var layer=this[i];
    Array.prototype.pop_i.call(this, i);
    delete this.namemap[layer.name];
    delete this.idmap[layer.id];
    if (layer==this.active)
      this._new_active(i);
    this.update_orders();
  }, function pop() {
    var layer=Array.prototype.pop.call(this);
    delete this.namemap[layer.name];
    delete this.idmap[layer.id];
    if (layer==this.active)
      this._new_active(this.length-1);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new SplineLayerSet();
    reader(ret);
    for (var i=0; i<ret._layers.length; i++) {
        ret.push(ret._layers[i]);
        ret._layers[i].order = i;
    }
    ret.active = ret.idmap[ret.active];
    delete ret._layers;
    return ret;
  }), function afterSTRUCT(spline) {
    var __iter_layer=__get_iter(this);
    var layer;
    while (1) {
      var __ival_layer=__iter_layer.next();
      if (__ival_layer.done) {
          break;
      }
      layer = __ival_layer.value;
      layer.afterSTRUCT(spline);
    }
  }]);
  _es6_module.add_class(SplineLayerSet);
  SplineLayerSet = _es6_module.add_export('SplineLayerSet', SplineLayerSet);
  SplineLayerSet.STRUCT = "\n  SplineLayerSet {\n    idgen  : SDIDGen;\n    active : int | obj.active != undefined ? obj.active.id : -1;\n    flag   : int;\n    _layers : array(SplineLayer) | obj;\n  }\n";
  var IterCache=_ESClass("IterCache", [function IterCache(callback, count) {
    if (count==undefined) {
        count = 8;
    }
    this.stack = [];
    this.free = [];
    this.cache = [];
    this.callback = callback;
    for (var i=0; i<count; i++) {
        this.cache.push(callback());
        this.free.push(this.cache[this.cache.length-1]);
    }
  }, function push() {
    if (this.free.length==0) {
        console.log("Error in IterCache!");
        return this.callback();
    }
    for (var i=0; i<this.stack.length; i++) {
        var iter=this.stack[i];
        if (iter.is_done()) {
            this.stack.remove(iter);
            i--;
            this.free.push(iter);
        }
    }
    var iter=this.free.pop();
    this.stack.push(iter);
    return iter;
  }, function pop() {
    this.free.push(this.stack.pop());
  }, _ESClass.static(function fromConstructor(cls, count) {
    return new IterCache(function() {
      return new cls();
    }, count);
  })]);
  _es6_module.add_class(IterCache);
  IterCache = _es6_module.add_export('IterCache', IterCache);
  var EditableIter=_ESClass("EditableIter", [function EditableIter(list, layerset, all_layers) {
    this.init(list, layerset, all_layers);
  }, function init(list, layerset, all_layers) {
    this.list = list;
    this.layerset = layerset;
    this.all_layers = all_layers;
    this.i = 0;
    this.ret = {done: false, value: undefined}
    return this;
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this;
  }), function reset() {
    this.ret.done = false;
    this.ret.value = undefined;
    this.i = 0;
    return this;
  }, function next() {
    var $_let_actlayer1=this.layerset.active.id;
    while (this.i<this.list.length) {
      var $_let_e3=this.list[this.i];
      var $_let_ok4=!$_let_e3.hidden;
      $_let_ok4 = $_let_ok4&&(this.all_layers||$_let_actlayer1 in $_let_e3.layers);
      if ($_let_ok4)
        break;
      this.i++;
    }
    if (this.i>=this.list.length) {
        this.ret.done = true;
        this.ret.value = undefined;
        return this.ret;
    }
    this.i++;
    this.ret.done = false;
    this.ret.value = this.list[this.i-1];
    return this.ret;
  }]);
  _es6_module.add_class(EditableIter);
  EditableIter = _es6_module.add_export('EditableIter', EditableIter);
  var SelectedEditableIter=_ESClass("SelectedEditableIter", [function SelectedEditableIter(selset, layerset) {
    this.ret = {done: false, value: undefined}
    this._c = 0;
    if (selset!=undefined) {
        this.init(selset, layerset);
    }
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this;
  }), function reset() {
    return this.init(this.set, this.layerset);
  }, function init(selset, layerset) {
    this.set = selset;
    this.iter = undefined;
    this.ret.done = false;
    this.layerset = layerset;
    this._c = 0;
    return this;
  }, function is_done() {
    return this.iter==undefined;
  }, function next() {
    if (this.iter==undefined) {
        this.iter = this.set[Symbol.iterator]();
        this.ret.done = false;
    }
    if (this._c++>100000) {
        console.log("infinite loop detected 2!");
        this.ret.done = true;
        this.ret.value = undefined;
        return this.ret;
    }
    var actlayer=this.layerset.active.id;
    function visible(e) {
      return !e.hidden&&actlayer in e.layers;
    }
    ret = undefined;
    var good=false;
    var c=0;
    var iter=this.iter;
    do {
      ret = iter.next();
      if (ret.done)
        break;
      var e=ret.value;
      good = visible(e);
      if (e.type==SplineTypes.HANDLE) {
          good = good||visible(e.owning_segment);
      }
      if (good) {
          this.ret.value = e;
          break;
      }
      ret = iter.next();
      if (c++>100000) {
          console.log("Infinite loop detected!!", ret, iter);
          break;
      }
    } while (!good);
    
    if (good==false) {
        this.ret.done = true;
        this.ret.value = undefined;
        this.iter = undefined;
    }
    return this.ret;
  }]);
  _es6_module.add_class(SelectedEditableIter);
  SelectedEditableIter = _es6_module.add_export('SelectedEditableIter', SelectedEditableIter);
  var SelectedEditableAllLayersIter=_ESClass("SelectedEditableAllLayersIter", [function SelectedEditableAllLayersIter(selset, layerset) {
    this.ret = {done: false, value: undefined}
    this._c = 0;
    if (selset!=undefined) {
        this.init(selset, layerset);
    }
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this;
  }), function reset() {
    return this.init(this.set, this.layerset);
  }, function init(selset, layerset) {
    this.set = selset;
    this.iter = undefined;
    this.ret.done = false;
    this.layerset = layerset;
    this._c = 0;
    return this;
  }, function is_done() {
    return this.iter==undefined;
  }, function next() {
    if (this.iter==undefined) {
        this.iter = this.set[Symbol.iterator]();
        this.ret.done = false;
    }
    if (this._c++>100000) {
        console.log("infinite loop detected 2!");
        this.ret.done = true;
        this.ret.value = undefined;
        return this.ret;
    }
    var actlayer=this.layerset.active.id;
    function visible(e) {
      return !e.hidden;
    }
    ret = undefined;
    var good=false;
    var c=0;
    var iter=this.iter;
    do {
      ret = iter.next();
      if (ret.done)
        break;
      var e=ret.value;
      good = visible(e);
      if (e.type==SplineTypes.HANDLE) {
          good = good||visible(e.owning_segment);
      }
      if (good) {
          this.ret.value = e;
          break;
      }
      ret = iter.next();
      if (c++>100000) {
          console.log("Infinite loop detected!!", ret, iter);
          break;
      }
    } while (!good);
    
    if (good==false) {
        this.ret.done = true;
        this.ret.value = undefined;
        this.iter = undefined;
    }
    return this.ret;
  }]);
  _es6_module.add_class(SelectedEditableAllLayersIter);
  SelectedEditableAllLayersIter = _es6_module.add_export('SelectedEditableAllLayersIter', SelectedEditableAllLayersIter);
  var ElementArraySet=_ESClass("ElementArraySet", set, [function ElementArraySet() {
    set.apply(this, arguments);
    this.layerset = undefined;
  }, function editable(ignore_layers) {
    return ignore_layers ? new SelectedEditableAllLayersIter(this, this.layerset) : new SelectedEditableIter(this, this.layerset);
  }]);
  _es6_module.add_class(ElementArraySet);
  ElementArraySet = _es6_module.add_export('ElementArraySet', ElementArraySet);
  var ElementArray=_ESClass("ElementArray", GArray, [function ElementArray(type, idgen, idmap, global_sel, layerset, spline) {
    GArray.call(this);
    this.layerset = layerset;
    this.cdata = new CustomData(this);
    this.type = type;
    this.spline = spline;
    this.idgen = idgen;
    this.idmap = idmap;
    this.local_idmap = {}
    this.global_sel = global_sel;
    this.on_select = undefined;
    this.select_listeners = new EventDispatcher("select");
    this.selected = new ElementArraySet();
    this.selected.layerset = layerset;
  }, function editable(ctx) {
    if (ctx===undefined) {
        throw new Error("Missing ctx argument");
    }
    return new EditableIter(this, this.layerset, ctx.edit_all_layers);
  }, function dag_get_datapath() {
    var tname;
    switch (this.type) {
      case SplineTypes.VERTEX:
        tname = "verts";
        break;
      case SplineTypes.HANDLE:
        tname = "handles";
        break;
      case SplineTypes.SEGMENT:
        tname = "segments";
        break;
      case SplineTypes.FACE:
        tname = "faces";
        break;
    }
    var suffix="."+tname;
    var name="drawspline";
    for (var i=0; i<this.cdata.layers.length; i++) {
        if (this.cdata.layers[i].name=="TimeDataLayer")
          name = "pathspline";
    }
    return "frameset."+name+suffix;
  }, function remove_undefineds() {
    for (var i=0; i<this.length; i++) {
        if (this[i]==undefined) {
            this.pop_i(this[i]);
            i--;
        }
    }
  }, function swap(a, b) {
    if (a==undefined||b==undefined) {
        console.trace("Warning, undefined in ElementArray.swap(): a, b:", a, b);
        return ;
    }
    var i1=this.indexOf(a), i2=this.indexOf(b);
    if (i1<0||i2<0) {
        console.log(i1, i2, a, b);
        throw new Error("Elements not in list");
    }
    this[i2] = a;
    this[i1] = b;
  }, function on_layer_add(layer, i) {
    var __iter_e=__get_iter(this);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      e.cdata.on_add(layercls, i);
    }
  }, function on_layer_del(layer, i) {
    var __iter_e=__get_iter(this);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      e.cdata.on_del(layercls, i);
    }
  }, function push(e, custom_eid) {
    if (custom_eid==undefined) {
        custom_eid = undefined;
    }
    if (e.cdata==undefined||e.cdata.length!=this.cdata.layers.length) {
        e.cdata = this.cdata.gen_edata();
    }
    if (custom_eid==undefined) {
        e.eid = this.idgen.gen_id();
    }
    else {
      e.eid = custom_eid;
    }
    this.idmap[e.eid] = e;
    this.local_idmap[e.eid] = e;
    GArray.prototype.push.call(this, e);
    if (e.flag&SplineFlags.SELECT) {
        e.flag&=~SplineFlags.SELECT;
        this.setselect(e, true);
    }
    this.layerset.active.add(e);
    e.layers[this.layerset.active.id] = 1;
  }, function remove(e, soft_error) {
    if (soft_error==undefined) {
        soft_error = false;
    }
    var idx=this.indexOf(e);
    if (idx<0) {
        throw new Error("Element not in list");
    }
    if (this.selected.has(e))
      this.setselect(e, false);
    delete this.idmap[e.eid];
    delete this.local_idmap[e.eid];
    this[idx] = this[this.length-1];
    this.length--;
    for (var k in e.layers) {
        var layer=this.layerset.idmap[k];
        if (layer!=undefined) {
            layer.remove(e);
        }
        else {
          console.trace("Failed to find layer "+k+"!", e, this, this.layerset);
        }
    }
  }, function setselect(e, state) {
    if (state&&!(e.flag&SplineFlags.SELECT)) {
        this.dag_update("on_select_add", this.type);
    }
    else 
      if (!state&&(e.flag&SplineFlags.SELECT)) {
        this.dag_update("on_select_sub", this.type);
    }
    if (e.type!=this.type) {
        console.trace("Warning: bad element fed to ElementArray! Got ", e.type, " but expected", this.type);
        return ;
    }
    var changed=!!(e.flag&SplineFlags.SELECT)!=!!state;
    if (state) {
        if (this.active==undefined)
          this.active = e;
        this.global_sel.add(e);
        this.selected.add(e);
        e.flag|=SplineFlags.SELECT;
    }
    else {
      this.global_sel.remove(e);
      this.selected.remove(e);
      e.flag&=~SplineFlags.SELECT;
    }
    if (changed&&this.on_select!=undefined) {
        this.on_select(e, state);
        this.select_listeners.fire(e, state);
    }
  }, function clear_selection() {
    for (var i=0; i<this.length; i++) {
        this.setselect(this[i], false);
    }
  }, function select_all() {
    for (var i=0; i<this.length; i++) {
        this.setselect(this[i], true);
    }
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new ElementArray();
    reader(ret);
    ret.cdata.owner = ret;
    var active=ret.active;
    ret.active = undefined;
    for (var i=0; i<ret.arr.length; i++) {
        GArray.prototype.push.call(ret, ret.arr[i]);
        if (ret.arr[i].eid==active) {
            ret.active = ret.arr[i];
        }
    }
    delete ret.arr;
    return ret;
  }), function afterSTRUCT(type, idgen, idmap, global_sel, layerset, spline) {
    this.type = type;
    this.idgen = idgen;
    this.idmap = idmap;
    this.global_sel = global_sel;
    this.local_idmap = {}
    this.layerset = layerset;
    this.spline = spline;
    var selected=new ElementArraySet();
    selected.layerset = layerset;
    for (var i=0; i<this.selected.length; i++) {
        var eid=this.selected[i];
        if (!(eid in idmap)) {
            console.log("WARNING: afterSTRUCT: eid", eid, "not in eidmap!", Object.keys(idmap));
            continue;
        }
        selected.add(idmap[this.selected[i]]);
    }
    this.selected = selected;
    var __iter_e=__get_iter(this);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      this.local_idmap[e.eid] = e;
      if (e.cdata==undefined) {
          e.cdata = this.cdata.gen_edata();
      }
    }
    this.cdata.afterSTRUCT(this, this.cdata);
  }]);
  _es6_module.add_class(ElementArray);
  ElementArray = _es6_module.add_export('ElementArray', ElementArray);
  mixin(ElementArray, DataPathNode);
  ElementArray.STRUCT = "\n  ElementArray {\n    arr      : array(abstract(SplineElement)) | obj;\n    selected : iter(e, int) | e.eid;\n    active   : int | obj.active != undefined ? obj.active.eid : -1;\n    cdata    : CustomData;\n  }\n";
  ElementArray.dag_outputs = {on_select_add: 0, on_select_sub: 0}
});
es6_module_define('spline_base', ["toolprops", "struct", "mathlib", "eventdag"], function _spline_base_module(_es6_module) {
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var PropTypes=es6_import_item(_es6_module, 'toolprops', 'PropTypes');
  var acos=Math.acos, asin=Math.asin, abs=Math.abs, log=Math.log, sqrt=Math.sqrt, pow=Math.pow, PI=Math.PI, floor=Math.floor, min=Math.min, max=Math.max, sin=Math.sin, cos=Math.cos, tan=Math.tan, atan=Math.atan, atan2=Math.atan2, exp=Math.exp;
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  es6_import(_es6_module, 'mathlib');
  var DataPathNode=es6_import_item(_es6_module, 'eventdag', 'DataPathNode');
  var MaterialFlags={SELECT: 1, MASK_TO_FACE: 2}
  MaterialFlags = _es6_module.add_export('MaterialFlags', MaterialFlags);
  var RecalcFlags={DRAWSORT: 1, SOLVE: 2, ALL: 1|2}
  RecalcFlags = _es6_module.add_export('RecalcFlags', RecalcFlags);
  var SplineFlags={SELECT: 1, BREAK_TANGENTS: 2, USE_HANDLES: 4, UPDATE: 8, TEMP_TAG: 16, BREAK_CURVATURES: 32, HIDE: 64, FRAME_DIRTY: 128, PINNED: 256, NO_RENDER: 512, AUTO_PAIRED_HANDLE: 1<<10, UPDATE_AABB: 1<<11, DRAW_TEMP: 1<<12, GHOST: 1<<13, UI_SELECT: 1<<14, FIXED_KS: 1<<21, REDRAW_PRE: 1<<22, REDRAW: 1<<23}
  SplineFlags = _es6_module.add_export('SplineFlags', SplineFlags);
  var SplineTypes={VERTEX: 1, HANDLE: 2, SEGMENT: 4, LOOP: 8, FACE: 16, ALL: 31}
  SplineTypes = _es6_module.add_export('SplineTypes', SplineTypes);
  var ClosestModes={CLOSEST: 0, START: 1, END: 2, ALL: 3}
  ClosestModes = _es6_module.add_export('ClosestModes', ClosestModes);
  var CustomDataLayer=_ESClass("CustomDataLayer", [function CustomDataLayer() {
    this.shared = undefined;
  }, function segment_split(old_segment, old_v1, old_v2, new_segments) {
  }, function update(owner) {
  }, function post_solve(owner) {
  }, function interp(srcs, ws) {
  }, function copy(src) {
  }, _ESClass.static(function fromSTRUCT(reader) {
    var obj=new CustomDataLayer();
    reader(obj);
    return obj;
  }), function curve_effect(owner) {
  }]);
  _es6_module.add_class(CustomDataLayer);
  CustomDataLayer = _es6_module.add_export('CustomDataLayer', CustomDataLayer);
  var empty_class=_ESClass("empty_class", [_ESClass.static(function fromSTRUCT(reader) {
    var ret=new empty_class();
    reader(ret);
    return ret;
  }), function empty_class() {
  }]);
  _es6_module.add_class(empty_class);
  empty_class = _es6_module.add_export('empty_class', empty_class);
  empty_class.STRUCT = "\n  empty_class {\n  }\n";
  CustomDataLayer.layerinfo = {type_name: "(bad type name)", has_curve_effect: false, shared_class: empty_class}
  CustomDataLayer.STRUCT = "\n  CustomDataLayer {\n  }\n";
  var CustomData=_ESClass("CustomData", [function CustomData(owner, layer_add_callback, layer_del_callback) {
    this.owner = owner;
    this.callbacks = {on_add: layer_add_callback, on_del: layer_del_callback}
    this.layers = [];
    this.shared_data = [];
    this.startmap = {}
  }, function load_layout(src) {
    for (var i=0; i<src.layers.length; i++) {
        this.layers.push(src.layers[i]);
    }
    for (var k in src.startmap) {
        this.startmap[k] = src.startmap[k];
    }
  }, function add_layer(cls, name) {
    var templ=cls;
    var i=this.get_layer(templ.layerinfo.type_name);
    if (i!=undefined) {
        var n=this.num_layers(templ.layerinfo.type_name);
        i+=n;
        this.layers.insert(i, templ);
    }
    else {
      i = this.layers.length;
      this.startmap[templ.layerinfo.type_name] = i;
      this.layers.push(templ);
    }
    var scls=templ.layerinfo.shared_class;
    scls = scls==undefined ? empty_class : scls;
    var shared=new scls;
    this.shared_data.push(shared);
    var __iter_e=__get_iter(this.owner);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      e.cdata.on_add(templ, i, shared);
    }
    if (this.callbacks.on_add!=undefined)
      this.callbacks.on_add(templ, i, shared);
  }, function gen_edata() {
    var ret=new CustomDataSet();
    for (var i=0; i<this.layers.length; i++) {
        var layer=new this.layers[i]();
        layer.shared = this.shared_data[i];
        ret.push(layer);
    }
    return ret;
  }, function get_shared(type) {
    return this.shared_data[this.get_layer_i(type, 0)];
  }, function get_layer_i(type, i) {
    if (i==undefined) {
        i = 0;
    }
    if (!(type in this.startmap))
      return -1;
    return this.startmap[type]+i;
  }, function get_layer(type, i) {
    if (i==undefined)
      i = 0;
    return this.layers[this.startmap[type]+i];
  }, function num_layers(type) {
    var i=this.get_layer_i(type, 0);
    if (i==undefined||i==-1)
      return 0;
    while (i<this.layers.length&&this.layers[i++].type==type) {
      ;    }
    return i;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new CustomData();
    reader(ret);
    for (var i=0; i<ret.layers.length; i++) {
        ret.layers[i] = ret.layers[i].constructor;
        var l=ret.layers[i];
        var typename=l.layerinfo.type_name;
        if (!(typename in ret.startmap)) {
            ret.startmap[typename] = i;
        }
    }
    if (ret.shared_data.length!=ret.layers.length) {
        for (var i=0; i<ret.layers.length; i++) {
            var layer=ret.layers[i];
            var scls=layer.layerinfo.shared_class;
            scls = scls==undefined ? empty_class : scls;
            var shared=new scls;
            if (ret.shared_data.length>i)
              ret.shared_data[i] = shared;
            else 
              ret.shared_data.push(shared);
        }
    }
    return ret;
  }), function afterSTRUCT(element_array, cdata) {
    var __iter_e=__get_iter(element_array);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      var i=0;
      var __iter_layer=__get_iter(e.cdata);
      var layer;
      while (1) {
        var __ival_layer=__iter_layer.next();
        if (__ival_layer.done) {
            break;
        }
        layer = __ival_layer.value;
        layer.shared = cdata.shared_data[i];
        i++;
      }
    }
  }]);
  _es6_module.add_class(CustomData);
  CustomData = _es6_module.add_export('CustomData', CustomData);
  CustomData.STRUCT = "\n  CustomData {\n    layers      : array(e, abstract(CustomDataLayer)) | new e();\n    shared_data : array(abstract(Object));\n  }\n";
  var $srcs2_jZbz_interp;
  var CustomDataSet=_ESClass("CustomDataSet", Array, [function CustomDataSet() {
    Array.call(this);
  }, function on_add(cls, i, shared) {
    var layer=new cls();
    layer.shared = shared;
    this.insert(i, layer);
  }, function get_layer(cls) {
    for (var i=0; i<this.length; i++) {
        if (this[i].constructor===cls)
          return this[i];
    }
  }, function on_del(cls, i) {
    this.pop_u(i);
  }, function get_data(layout, layer_name) {
  }, function on_segment_split(old_segment, old_v1, old_v2, new_segments) {
  }, function interp(srcs, ws) {
    while ($srcs2_jZbz_interp.length<srcs.length) {
      $srcs2_jZbz_interp.push(0);
    }
    $srcs2_jZbz_interp.length = srcs.length;
    for (var i=0; i<this.length; i++) {
        for (var j=0; j<srcs.length; j++) {
            $srcs2_jZbz_interp[j] = srcs[j][i];
        }
        this[i].interp($srcs2_jZbz_interp, ws);
    }
  }, function copy(src) {
    for (var i=0; i<this.length; i++) {
        this[i].copy(src[i]);
    }
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new CustomDataSet();
    reader(ret);
    for (var i=0; i<ret.arr.length; i++) {
        ret.push(ret.arr[i]);
    }
    delete ret.arr;
    return ret;
  })]);
  var $srcs2_jZbz_interp=[];
  _es6_module.add_class(CustomDataSet);
  CustomDataSet = _es6_module.add_export('CustomDataSet', CustomDataSet);
  CustomDataSet.STRUCT = "\n  CustomDataSet {\n    arr : iter(abstract(CustomDataLayer)) | obj;\n  }\n";
  var SplineElement=_ESClass("SplineElement", DataPathNode, [function SplineElement(type) {
    DataPathNode.call(this);
    this.type = type;
    this.cdata = new CustomDataSet();
    this.masklayer = 1;
    this.layers = {}
  }, function has_layer() {
    for (var k in this.layers) {
        return true;
    }
    return false;
  }, function dag_get_datapath() {
    var suffix=".verts["+this.eid+"]";
    var name="drawspline";
    for (var i=0; i<this.cdata.length; i++) {
        if (this.cdata[i].constructor.name=="TimeDataLayer")
          name = "pathspline";
    }
    return "frameset."+name+suffix;
  }, function in_layer(layer) {
    return layer!=undefined&&layer.id in this.layers;
  }, _ESClass.get(function aabb() {
    console.trace("Implement Me!");
  }), function sethide(state) {
    if (state)
      this.flag|=SplineFlags.HIDE;
    else 
      this.flag&=~SplineFlags.HIDE;
  }, _ESClass.set(function hidden(state) {
    if (state)
      this.flag|=SplineFlags.HIDE;
    else 
      this.flag&=~SplineFlags.HIDE;
  }), _ESClass.get(function hidden() {
    return !!(this.flag&SplineFlags.HIDE);
  }), _ESClass.symbol(Symbol.keystr, function keystr() {
    return ""+this.eid;
  }), function post_solve() {
    for (var i=0; i<this.cdata.length; i++) {
        this.cdata[i].post_solve(this);
    }
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new SplineElement();
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(SplineElement);
  SplineElement = _es6_module.add_export('SplineElement', SplineElement);
  var derivative_cache_vs=cachering.fromConstructor(Vector3, 64);
  var closest_point_ret_cache_vs=cachering.fromConstructor(Vector3, 256);
  var closest_point_ret_cache=new cachering(function() {
    return [0, 0];
  }, 256);
  var closest_point_cache_vs=cachering.fromConstructor(Vector3, 64);
  var flip_wrapper_cache;
  var $flip_out_BU8T__get_nextprev;
  var $ret_cache_LQzS_global_to_local;
  var $_co_qLyK_global_to_local;
  var $arr_Zve0_global_to_local;
  var $_vec_hvbX_global_to_local;
  var CurveEffect=_ESClass("CurveEffect", [function CurveEffect() {
    this.child = undefined;
    this.prior = undefined;
  }, function rescale(ceff, width) {
    if (this.prior!=undefined)
      return this.prior.rescale(ceff, width);
    return width;
  }, _ESClass.get(function reversed() {
    return flip_wrapper_cache.next().bind(this);
  }), function set_parent(p) {
    this.prior = p;
    p.child = this;
  }, function _get_nextprev(donext, _flip_out) {
    var i=0, p=this;
    while (p.prior!=undefined) {
      p = p.prior;
      i++;
    }
    p = p._get_nextprev(donext, $flip_out_BU8T__get_nextprev);
    var flip=$flip_out_BU8T__get_nextprev[0];
    if (p==undefined) {
        return undefined;
    }
    while (i>0) {
      p = p.child;
      i--;
    }
    if (p==undefined) {
        console.log("EVIL! no MultiResEffector!", this);
        return undefined;
    }
    if (flip)
      p = p.reversed;
    return p;
  }, _ESClass.get(function next() {
    return this._get_nextprev(1);
  }), _ESClass.get(function prev() {
    return this._get_nextprev(0);
  }), function evaluate(s) {
    if (this.prior!=undefined) {
        return this.prior.evaluate(s);
    }
  }, function derivative(s) {
    var df=0.001;
    var a, b;
    if (s<0.5) {
        a = this.evaluate(s);
        b = this.evaluate(s+df);
    }
    else {
      a = this.evaluate(s-df);
      b = this.evaluate(s);
    }
    b.sub(a).mulScalar(1.0/df);
    return b;
  }, function derivative2(s, funcs) {
    var df=0.001;
    var a, b;
    if (s<0.5) {
        a = this.derivative(s);
        b = this.derivative(s+df);
    }
    else {
      a = this.derivative(s-df);
      b = this.derivative(s);
    }
    b.sub(a).mulScalar(1.0/df);
    return b;
  }, function curvature(s, prior) {
    var dv1=this.derivative(s);
    var dv2=this.derivative(s);
    return (dv2[0]*dv1[1]-dv2[1]*dv1[0])/Math.pow(dv1[0]*dv1[0]+dv1[1]*dv1[1], 3.0/2.0);
  }, function closest_point(p, mode, fast) {
    if (fast==undefined) {
        fast = false;
    }
    var minret=undefined, mindis=1e+18, maxdis=0;
    var p2=closest_point_cache_vs.next().zero();
    for (var i=0; i<p.length; i++) {
        p2[i] = p[i];
    }
    p = p2;
    if (mode==undefined)
      mode = 0;
    var steps=5, s=0, ds=1.0/(steps);
    var n=closest_point_cache_vs.next();
    var n1=closest_point_cache_vs.next(), n2=closest_point_cache_vs.next();
    var n3=closest_point_cache_vs.next(), n4=closest_point_cache_vs.next();
    if (mode==ClosestModes.ALL)
      minret = [];
    for (var i=0; i<steps; i++, s+=ds) {
        var start=s-1e-05, end=s+ds+1e-05;
        start = Math.min(Math.max(start, 0.0), 1.0);
        end = Math.min(Math.max(end, 0.0), 1.0);
        var mid=(start+end)*0.5;
        var bad=false;
        var angle_limit=fast ? 0.65 : 0.2;
        var steps=fast ? 5 : 20;
        for (var j=0; j<steps; j++) {
            mid = (start+end)*0.5;
            var co=this.evaluate(mid);
            var sco=this.evaluate(start);
            var eco=this.evaluate(end);
            var d1=this.normal(start).normalize();
            var d2=this.normal(end).normalize();
            var dm=this.normal(mid).normalize();
            n1.load(sco).sub(p).normalize();
            n2.load(eco).sub(p).normalize();
            n.load(co).sub(p).normalize();
            if (n1.dot(d1)<0.0)
              d1.negate();
            if (n2.dot(d2)<0.0)
              d2.negate();
            if (n.dot(dm)<0)
              dm.negate();
            var mang=acos(n.normalizedDot(dm));
            if (mang<0.001)
              break;
            var ang1=acos(n1.normalizedDot(d1));
            var ang2=acos(n2.normalizedDot(d2));
            var w1=n1.cross(d1)[2]<0.0;
            var w2=n2.cross(d2)[2]<0.0;
            var wm=n.cross(dm)[2]<0.0;
            if (isNaN(mang)) {
                console.log(p, co, mid, dm);
            }
            if (j==0&&w1==w2) {
                bad = true;
                break;
            }
            else 
              if (w1==w2) {
            }
            if (w1==w2) {
                var dis1, dis2;
                dis1 = ang1, dis2 = ang2;
                if (dis2<dis1) {
                    start = mid;
                }
                else 
                  if (dis1<dis2) {
                    end = mid;
                }
                else {
                  break;
                }
            }
            else 
              if (wm==w1) {
                start = mid;
            }
            else {
              end = mid;
            }
        }
        if (bad)
          continue;
        var co=this.evaluate(mid);
        n1.load(this.normal(mid)).normalize();
        n2.load(co).sub(p).normalize();
        if (n2.dot(n1)<0) {
            n2.negate();
        }
        var angle=acos(Math.min(Math.max(n1.dot(n2), -1), 1));
        if (angle>angle_limit)
          continue;
        if (mode!=ClosestModes.ALL&&minret==undefined) {
            var minret=closest_point_ret_cache.next();
            minret[0] = minret[1] = undefined;
        }
        var dis=co.vectorDistance(p);
        if (mode==ClosestModes.CLOSEST) {
            if (dis<mindis) {
                minret[0] = closest_point_cache_vs.next().load(co);
                minret[1] = mid;
                mindis = dis;
            }
        }
        else 
          if (mode==ClosestModes.START) {
            if (mid<mindis) {
                minret[0] = closest_point_cache_vs.next().load(co);
                minret[1] = mid;
                mindis = mid;
            }
        }
        else 
          if (mode==ClosestModes.END) {
            if (mid>maxdis) {
                minret[0] = closest_point_cache_vs.next().load(co);
                minret[1] = mid;
                maxdis = mid;
            }
        }
        else 
          if (mode==ClosestModes.ALL) {
            var ret=closest_point_ret_cache.next();
            ret[0] = closest_point_cache_vs.next().load(co);
            ret[1] = mid;
            minret.push(ret);
        }
    }
    if (minret==undefined&&mode==ClosestModes.CLOSEST) {
        var v1=this.evaluate(0), v2=this.evaluate(1);
        var dis1=v1.vectorDistance(p), dis2=v2.vectorDistance(p);
        minret = closest_point_ret_cache.next();
        minret[0] = closest_point_cache_vs.next().load(dis1<dis2 ? v1 : v2);
        minret[1] = dis1<dis2 ? 0.0 : 1.0;
    }
    else 
      if (minret==undefined&&mode==ClosestModes.START) {
        minret = closest_point_ret_cache.next();
        minret[0] = closest_point_cache_vs.next().load(this.v1);
        minret[1] = 0.0;
    }
    if (minret==undefined&&mode==ClosestModes.END) {
        minret = closest_point_ret_cache.next();
        minret[0] = closest_point_cache_vs.next().load(this.v2);
        minret[1] = 1.0;
    }
    return minret;
  }, function normal(s) {
    var ret=this.derivative(s);
    var t=ret[0];
    ret[0] = -ret[1];
    ret[1] = t;
    ret.normalize();
    return ret;
  }, function global_to_local(p, no_effects, fixed_s) {
    if (no_effects==undefined) {
        no_effects = false;
    }
    if (fixed_s==undefined) {
        fixed_s = undefined;
    }
    var co;
    if (fixed_s!=undefined) {
        $arr_Zve0_global_to_local[0] = this.evaluate(fixed_s);
        $arr_Zve0_global_to_local[1] = fixed_s;
        co = $arr_Zve0_global_to_local;
    }
    else {
      co = this.closest_point(p);
    }
    var s, t, a=0.0;
    if (co==undefined) {
        co = $_co_qLyK_global_to_local;
        if (p.vectorDistance(this.v1)<p.vectorDistance(this.v2)) {
            co.load(this.v1);
            s = 0;
            t = p.vectorDistance(this.v1);
        }
        else {
          co.load(this.v2);
          s = 1.0;
          t = p.vectorDistance(this.v2);
        }
    }
    else {
      s = co[1];
      co = co[0];
      t = p.vectorDistance(co)*0.15;
    }
    var n1=this.normal(s).normalize();
    var n2=$_vec_hvbX_global_to_local.zero().load(p).sub(co).normalize();
    n1[2] = n2[2] = 0.0;
    a = asin(n1[0]*n2[1]-n1[1]*n2[0]);
    var dot=n1.dot(n2);
    co.sub(p);
    co[2] = 0.0;
    t = co.vectorLength();
    if (dot<0.0) {
        t = -t;
        a = 2.0*Math.PI-a;
    }
    var ret=$ret_cache_LQzS_global_to_local.next();
    ret[0] = s;
    ret[1] = t;
    ret[2] = a;
    return ret;
  }, function local_to_global(p) {
    var s=p[0], t=p[1], a=p[2];
    var co=this.evaluate(s);
    var no=this.normal(s).normalize();
    no.mulScalar(t);
    no.rot2d(a);
    co.add(no);
    return co;
  }]);
  var $flip_out_BU8T__get_nextprev=[0];
  var $ret_cache_LQzS_global_to_local=cachering.fromConstructor(Vector3, 64);
  var $_co_qLyK_global_to_local=new Vector3();
  var $arr_Zve0_global_to_local=[0, 0];
  var $_vec_hvbX_global_to_local=new Vector3();
  _es6_module.add_class(CurveEffect);
  CurveEffect = _es6_module.add_export('CurveEffect', CurveEffect);
  var FlipWrapper=_ESClass("FlipWrapper", CurveEffect, [function FlipWrapper() {
    this.eff = undefined;
    this.depth = 0;
  }, function rescale(eff, width) {
    return this.eff.rescale(eff, width);
  }, _ESClass.get(function reversed() {
    return this.eff;
  }), function bind(eff) {
    this.eff = eff;
    return this;
  }, _ESClass.get(function next() {
    return this.eff.next;
  }), _ESClass.get(function prev() {
    return this.eff.prev;
  }), function push(s) {
    if (this.depth==0) {
        s = 1.0-s;
    }
    this.depth++;
    return s;
  }, function pop(value) {
    this.depth--;
    return value;
  }, function evaluate(s) {
    s = this.push(s);
    return this.pop(this.eff.evaluate(s));
  }, function derivative(s) {
    s = this.push(s);
    return this.pop(this.eff.derivative(s));
  }, function normal(s) {
    s = this.push(s);
    return this.pop(this.eff.normal(s));
  }, function curvature(s) {
    s = this.push(s);
    return this.pop(this.eff.curvature(s));
  }]);
  _es6_module.add_class(FlipWrapper);
  FlipWrapper = _es6_module.add_export('FlipWrapper', FlipWrapper);
  flip_wrapper_cache = cachering.fromConstructor(FlipWrapper, 32);
  define_static(SplineElement, "dag_outputs", {depend: undefined, on_select: 0.0, eid: 0.0});
  SplineElement.STRUCT = "\n  SplineElement {\n    eid        : int;\n    flag       : int;\n    type       : int;\n    cdata      : CustomDataSet;\n  }\n";
});
es6_module_define('spline_types', ["selectmode", "config", "struct", "eventdag", "mathlib", "spline_base", "toolprops_iter", "spline_multires", "spline_math", "toolprops"], function _spline_types_module(_es6_module) {
  "use strict";
  var ENABLE_MULTIRES=es6_import_item(_es6_module, 'config', 'ENABLE_MULTIRES');
  var PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var PropTypes=es6_import_item(_es6_module, 'toolprops', 'PropTypes');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var math=es6_import(_es6_module, 'mathlib');
  var DataPathNode=es6_import_item(_es6_module, 'eventdag', 'DataPathNode');
  var abs=Math.abs, acos=Math.acos, asin=Math.asin, atan2=Math.atan2, PI=Math.PI, sqrt=Math.sqrt, pow=Math.pow, log=Math.log;
  var _spline_base=es6_import(_es6_module, 'spline_base');
  for (var k in _spline_base) {
      _es6_module.add_export(k, _spline_base[k], true);
  }
  var MultiResLayer=es6_import_item(_es6_module, 'spline_multires', 'MultiResLayer');
  var has_multires=es6_import_item(_es6_module, 'spline_multires', 'has_multires');
  var ensure_multires=es6_import_item(_es6_module, 'spline_multires', 'ensure_multires');
  var decompose_id=es6_import_item(_es6_module, 'spline_multires', 'decompose_id');
  var compose_id=es6_import_item(_es6_module, 'spline_multires', 'compose_id');
  var SplineTypes=es6_import_item(_es6_module, 'spline_base', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, 'spline_base', 'SplineFlags');
  var ClosestModes=es6_import_item(_es6_module, 'spline_base', 'ClosestModes');
  var RecalcFlags=es6_import_item(_es6_module, 'spline_base', 'RecalcFlags');
  var MaterialFlags=es6_import_item(_es6_module, 'spline_base', 'MaterialFlags');
  var CustomDataLayer=es6_import_item(_es6_module, 'spline_base', 'CustomDataLayer');
  var CustomData=es6_import_item(_es6_module, 'spline_base', 'CustomData');
  var CustomDataSet=es6_import_item(_es6_module, 'spline_base', 'CustomDataSet');
  var SplineElement=es6_import_item(_es6_module, 'spline_base', 'SplineElement');
  var CurveEffect=es6_import_item(_es6_module, 'spline_base', 'CurveEffect');
  var SelMask=es6_import_item(_es6_module, 'selectmode', 'SelMask');
  var ORDER=es6_import_item(_es6_module, 'spline_math', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, 'spline_math', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, 'spline_math', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, 'spline_math', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, 'spline_math', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, 'spline_math', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, 'spline_math', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, 'spline_math', 'INT_STEPS');
  var eval_curve=es6_import_item(_es6_module, 'spline_math', 'eval_curve');
  var spiraltheta=es6_import_item(_es6_module, 'spline_math', 'spiraltheta');
  var spiralcurvature=es6_import_item(_es6_module, 'spline_math', 'spiralcurvature');
  var spiralcurvature_dv=es6_import_item(_es6_module, 'spline_math', 'spiralcurvature_dv');
  var $ret_Ykhh_aabb;
  var SplineVertex=_ESClass("SplineVertex", SplineElement, [function SplineVertex() {
    SplineElement.call(this, SplineTypes.VERTEX);
    Vector3.apply(this, arguments);
    this.type = SplineTypes.VERTEX;
    this.flag = SplineFlags.FRAME_DIRTY|SplineFlags.UPDATE;
    this.segments = [];
    this.eid = 0;
    this.frames = {}
    this.hpair = undefined;
  }, _ESClass.get(function aabb() {
    $ret_Ykhh_aabb[0].load(this);
    $ret_Ykhh_aabb[1].load(this);
    return $ret_Ykhh_aabb;
  }), function sethide(state) {
    if (state)
      this.flag|=SplineFlags.HIDE;
    else 
      this.flag&=~SplineFlags.HIDE;
    if (this.type==SplineTypes.HANDLE)
      return ;
    if (state) {
        for (var i=0; i<this.segments.length; i++) {
            this.segments[i].sethide(true);
        }
    }
    else {
      for (var i=0; i<this.segments.length; i++) {
          this.segments[i].sethide(false);
      }
    }
  }, _ESClass.get(function hidden() {
    if (this.type==SplineTypes.VERTEX) {
        return !!(this.flag&SplineFlags.HIDE);
    }
    else {
      var s=this.owning_segment;
      return (this.flag&SplineFlags.HIDE)||!this.use||s.v1.hidden||s.v2.hidden;
    }
  }), _ESClass.get(function owning_segment() {
    return this.segments[0];
  }), _ESClass.get(function owning_vertex() {
    return this.owning_segment.handle_vertex(this);
  }), _ESClass.get(function use() {
    if (this.type!=SplineTypes.HANDLE)
      return true;
    var s=this.owning_segment;
    var v=s.handle_vertex(this);
    var ret=v!=undefined&&(v.segments!=undefined&&v.segments.length>2||(v.flag&SplineFlags.USE_HANDLES));
    return ret;
  }), _ESClass.set(function hidden(val) {
    if (val)
      this.flag|=SplineFlags.HIDE;
    else 
      this.flag&=~SplineFlags.HIDE;
  }), function other_segment(s) {
    if (s==this.segments[0])
      return this.segments[1];
    else 
      if (s==this.segments[1])
      return this.segments[0];
    return undefined;
  }, function toJSON() {
    var ret={}
    ret.frame = this.frame;
    ret.segments = [];
    ret[0] = this[0];
    ret[1] = this[1];
    ret[2] = this[2];
    ret.frames = this.frames;
    ret.length = 3;
    for (var i=0; i<this.segments.length; i++) {
        if (this.segments[i]!=undefined)
          ret.segments.push(this.segments[i].eid);
    }
    ret.flag = this.flag;
    ret.eid = this.eid;
    return ret;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=STRUCT.chain_fromSTRUCT(SplineVertex, reader);
    ret.load(ret.co);
    delete ret.co;
    return ret;
  })]);
  var $ret_Ykhh_aabb=[new Vector3(), new Vector3()];
  _es6_module.add_class(SplineVertex);
  SplineVertex = _es6_module.add_export('SplineVertex', SplineVertex);
  
  SplineVertex.STRUCT = STRUCT.inherit(SplineVertex, SplineElement)+"\n  co       : vec3          | obj;\n  segments : array(e, int) | e.eid;\n  hpair    : int           | obj.hpair != undefined? obj.hpair.eid : -1;\n}\n";
  mixin(SplineVertex, Vector3);
  var derivative_cache_vs=cachering.fromConstructor(Vector3, 64);
  var closest_point_ret_cache_vs=cachering.fromConstructor(Vector3, 256);
  var closest_point_ret_cache=new cachering(function() {
    return [0, 0];
  }, 256);
  var closest_point_cache_vs=cachering.fromConstructor(Vector3, 64);
  var EffectWrapper=_ESClass("EffectWrapper", CurveEffect, [function EffectWrapper(owner) {
    this.seg = owner;
  }, function rescale(ceff, width) {
    while (ceff.prior!=undefined) {
      ceff = ceff.prior;
    }
    var seg1=this.seg;
    var seg2=ceff.seg;
    var l1=seg1.length, l2=seg2.length;
    width = (width*l2)/l1;
    return width;
  }, function _get_nextprev(donext, flip_out) {
    var seg1=this.seg;
    var v=donext ? seg1.v2 : seg1.v1;
    if (v.segments.length!=2)
      return undefined;
    var seg2=v.other_segment(seg1);
    flip_out[0] = (donext&&seg2.v1==v)||(!donext&&seg2.v2==v);
    return seg2._evalwrap;
  }, function evaluate(s) {
    return this.seg.evaluate(s, undefined, undefined, undefined, true);
  }, function derivative(s) {
    return this.seg.derivative(s, undefined, undefined, true);
  }]);
  _es6_module.add_class(EffectWrapper);
  EffectWrapper = _es6_module.add_export('EffectWrapper', EffectWrapper);
  var $minmax_nKgE_update_aabb;
  var SplineSegment=_ESClass("SplineSegment", SplineElement, [function SplineSegment(v1, v2) {
    SplineElement.call(this, SplineTypes.SEGMENT);
    this._evalwrap = new EffectWrapper(this);
    this.l = undefined;
    this.v1 = v1;
    this.v2 = v2;
    this.topoid = -1;
    this.stringid = -1;
    this.has_multires = false;
    this.mat = new Material();
    var this2=this;
    this.mat.update = function() {
      this2.flag|=SplineFlags.REDRAW;
    }
    this.z = this.finalz = 5;
    this._aabb = [new Vector3(), new Vector3()];
    this.h1 = this.h2 = undefined;
    this.type = SplineTypes.SEGMENT;
    this.flag = 0;
    this.eid = 0;
    this.ks = new Array(KTOTKS);
    this._last_ks = new Array(KTOTKS);
    for (var i=0; i<this.ks.length; i++) {
        this.ks[i] = 0;
        this._last_ks[i] = 0;
    }
  }, _ESClass.get(function aabb() {
    if (this.flag&SplineFlags.UPDATE_AABB)
      this.update_aabb();
    return this._aabb;
  }), _ESClass.set(function aabb(val) {
    this._aabb = val;
  }), function _update_has_multires() {
    this.has_multires = false;
    for (var i=0; i<this.cdata.length; i++) {
        if (__instance_of(this.cdata[i], MultiResLayer)) {
            this.has_multires = true;
            break;
        }
    }
  }, function update_aabb(steps) {
    if (steps==undefined) {
        steps = 6;
    }
    this._update_has_multires();
    this.flag&=~SplineFlags.UPDATE_AABB;
    var min=this._aabb[0], max=this._aabb[1];
    $minmax_nKgE_update_aabb.reset();
    min.zero();
    max.zero();
    var co=this.evaluate(0);
    $minmax_nKgE_update_aabb.minmax(co);
    var ds=1.0/(steps-1);
    for (var i=0, s = 0; i<steps; i++, s+=ds) {
        var co=this.evaluate(s*0.999999999);
        $minmax_nKgE_update_aabb.minmax(co);
    }
    min.load($minmax_nKgE_update_aabb.min);
    max.load($minmax_nKgE_update_aabb.max);
    min[2] = max[2] = 0.0;
  }, function closest_point(p, mode, fast) {
    if (fast==undefined) {
        fast = false;
    }
    var minret=undefined, mindis=1e+18, maxdis=0;
    var p2=closest_point_cache_vs.next().zero();
    for (var i=0; i<p.length; i++) {
        p2[i] = p[i];
    }
    p = p2;
    if (mode==undefined)
      mode = 0;
    var steps=5, s=0, ds=1.0/(steps);
    var n=closest_point_cache_vs.next();
    var n1=closest_point_cache_vs.next(), n2=closest_point_cache_vs.next();
    var n3=closest_point_cache_vs.next(), n4=closest_point_cache_vs.next();
    if (mode==ClosestModes.ALL)
      minret = [];
    for (var i=0; i<steps; i++, s+=ds) {
        var start=s-1e-05, end=s+ds+1e-05;
        start = Math.min(Math.max(start, 0.0), 1.0);
        end = Math.min(Math.max(end, 0.0), 1.0);
        var mid=(start+end)*0.5;
        var bad=false;
        var angle_limit=fast ? 0.65 : 0.2;
        var steps=fast ? 5 : 20;
        for (var j=0; j<steps; j++) {
            mid = (start+end)*0.5;
            var co=this.evaluate(mid, undefined, undefined, undefined, true);
            var sco=this.evaluate(start, undefined, undefined, undefined, true);
            var eco=this.evaluate(end, undefined, undefined, undefined, true);
            var d1=this.normal(start, true).normalize();
            var d2=this.normal(end, true).normalize();
            var dm=this.normal(mid, true).normalize();
            n1.load(sco).sub(p).normalize();
            n2.load(eco).sub(p).normalize();
            n.load(co).sub(p).normalize();
            if (n1.dot(d1)<0.0)
              d1.negate();
            if (n2.dot(d2)<0.0)
              d2.negate();
            if (n.dot(dm)<0)
              dm.negate();
            var mang=acos(n.normalizedDot(dm));
            if (mang<0.001)
              break;
            var ang1=acos(n1.normalizedDot(d1));
            var ang2=acos(n2.normalizedDot(d2));
            var w1=n1.cross(d1)[2]<0.0;
            var w2=n2.cross(d2)[2]<0.0;
            var wm=n.cross(dm)[2]<0.0;
            if (isNaN(mang)) {
                console.log(p, co, mid, dm);
            }
            if (j==0&&w1==w2) {
                bad = true;
                break;
            }
            else 
              if (w1==w2) {
            }
            if (w1==w2) {
                var dis1, dis2;
                dis1 = ang1, dis2 = ang2;
                if (dis2<dis1) {
                    start = mid;
                }
                else 
                  if (dis1<dis2) {
                    end = mid;
                }
                else {
                  break;
                }
            }
            else 
              if (wm==w1) {
                start = mid;
            }
            else {
              end = mid;
            }
        }
        if (bad)
          continue;
        var co=this.evaluate(mid, undefined, undefined, undefined, true);
        n1.load(this.normal(mid, true)).normalize();
        n2.load(co).sub(p).normalize();
        if (n2.dot(n1)<0) {
            n2.negate();
        }
        var angle=acos(Math.min(Math.max(n1.dot(n2), -1), 1));
        if (angle>angle_limit)
          continue;
        if (mode!=ClosestModes.ALL&&minret==undefined) {
            var minret=closest_point_ret_cache.next();
            minret[0] = minret[1] = undefined;
        }
        var dis=co.vectorDistance(p);
        if (mode==ClosestModes.CLOSEST) {
            if (dis<mindis) {
                minret[0] = closest_point_cache_vs.next().load(co);
                minret[1] = mid;
                mindis = dis;
            }
        }
        else 
          if (mode==ClosestModes.START) {
            if (mid<mindis) {
                minret[0] = closest_point_cache_vs.next().load(co);
                minret[1] = mid;
                mindis = mid;
            }
        }
        else 
          if (mode==ClosestModes.END) {
            if (mid>maxdis) {
                minret[0] = closest_point_cache_vs.next().load(co);
                minret[1] = mid;
                maxdis = mid;
            }
        }
        else 
          if (mode==ClosestModes.ALL) {
            var ret=closest_point_ret_cache.next();
            ret[0] = closest_point_cache_vs.next().load(co);
            ret[1] = mid;
            minret.push(ret);
        }
    }
    if (minret==undefined&&mode==ClosestModes.CLOSEST) {
        var dis1=this.v1.vectorDistance(p), dis2=this.v2.vectorDistance(p);
        minret = closest_point_ret_cache.next();
        minret[0] = closest_point_cache_vs.next().load(dis1<dis2 ? this.v1 : this.v2);
        minret[1] = dis1<dis2 ? 0.0 : 1.0;
    }
    else 
      if (minret==undefined&&mode==ClosestModes.START) {
        minret = closest_point_ret_cache.next();
        minret[0] = closest_point_cache_vs.next().load(this.v1);
        minret[1] = 0.0;
    }
    if (minret==undefined&&mode==ClosestModes.END) {
        minret = closest_point_ret_cache.next();
        minret[0] = closest_point_cache_vs.next().load(this.v2);
        minret[1] = 1.0;
    }
    return minret;
  }, function normal(s, no_effects) {
    if (no_effects==undefined) {
        no_effects = !ENABLE_MULTIRES;
    }
    var ret=this.derivative(s, undefined, undefined, no_effects);
    var t=ret[0];
    ret[0] = -ret[1];
    ret[1] = t;
    ret.normalize();
    return ret;
  }, function ends(v) {
    if (v===this.v1)
      return 0.0;
    if (v===this.v2)
      return 1.0;
  }, function handle(v) {
    if (v===this.v1)
      return this.h1;
    if (v===this.v2)
      return this.h2;
  }, function handle_vertex(h) {
    if (h===this.h1)
      return this.v1;
    if (h===this.h2)
      return this.v2;
  }, _ESClass.get(function is_line() {
    var r1=(this.v1.flag&SplineFlags.BREAK_TANGENTS);
    var r2=(this.v2.flag&SplineFlags.BREAK_TANGENTS);
    return r1&&r2;
  }), _ESClass.get(function renderable() {
    return !(this.flag&SplineFlags.NO_RENDER);
  }), _ESClass.set(function renderable(val) {
    if (!val)
      this.flag|=SplineFlags.NO_RENDER;
    else 
      this.flag&=~SplineFlags.NO_RENDER;
  }), function update_handle(h) {
    var ov=this.handle_vertex(h);
    if (h.hpair!=undefined) {
        var seg=h.hpair.owning_segment;
        var v=this.handle_vertex(h);
        var len=h.hpair.vectorDistance(v);
        h.hpair.load(h).sub(v).negate().normalize().mulScalar(len).add(v);
        seg.update();
        return h.hpair;
    }
    else 
      if (ov.segments.length==2&&h.use&&!(ov.flag&SplineFlags.BREAK_TANGENTS)) {
        var h2=h.owning_vertex.other_segment(h.owning_segment).handle(h.owning_vertex);
        var hv=h2.owning_segment.handle_vertex(h2), len=h2.vectorDistance(hv);
        h2.load(h).sub(hv).negate().normalize().mulScalar(len).add(hv);
        h2.owning_segment.update();
        return h2;
    }
  }, function other_handle(h_or_v) {
    if (h_or_v==this.v1)
      return this.h2;
    if (h_or_v==this.v2)
      return this.h1;
    if (h_or_v==this.h1)
      return this.h2;
    if (h_or_v==this.h2)
      return this.h1;
  }, _ESClass.get(function length() {
    return this.ks[KSCALE];
  }), function toJSON() {
    var ret={}
    ret.frames = this.frames;
    ret.ks = [];
    for (var i=0; i<this.ks.length; i++) {
        ret.ks.push(this.ks[i]);
    }
    ret.v1 = this.v1.eid;
    ret.v2 = this.v2.eid;
    ret.h1 = this.h1!=undefined ? this.h1.eid : -1;
    ret.h2 = this.h2!=undefined ? this.h2.eid : -1;
    ret.eid = this.eid;
    ret.flag = this.flag;
    return ret;
  }, function curvature(s, order, override_scale) {
    if (order==undefined)
      order = ORDER;
    eval_curve(0.5, this.v1, this.v2, this.ks, order, 1);
    var k=spiralcurvature(s, this.ks, order);
    return k/this.ks[KSCALE];
  }, function curvature_dv(s, order, override_scale) {
    if (order==undefined)
      order = ORDER;
    eval_curve(0.5, this.v1, this.v2, this.ks, order, 1);
    var k=spiralcurvature_dv(s, this.ks, order);
    return k/this.ks[KSCALE];
  }, function derivative(s, order, no_update_curve, no_effects) {
    if (order==undefined)
      order = ORDER;
    var ret=derivative_cache_vs.next().zero();
    var ks=this.ks;
    if (!no_update_curve)
      eval_curve(0.5, this.v1, this.v2, ks, order, 1);
    var th=spiraltheta(s, ks, order);
    var k=spiralcurvature(s, ks, order);
    var ang=ks[KANGLE];
    ret[0] = sin(th+ang)*ks[KSCALE];
    ret[1] = cos(th+ang)*ks[KSCALE];
    ret[2] = 0.0;
    return ret;
  }, function theta(s, order, no_effects) {
    if (order==undefined)
      order = ORDER;
    return spiraltheta(s, this.ks, order)*this.ks[KSCALE];
  }, function offset_eval(s, offset, order, no_update) {
    if (order==undefined)
      order = ORDER;
    var ret=this.evaluate(s, order, undefined, no_update);
    if (offset==0.0)
      return ret;
    var tan=this.derivative(s, order, no_update);
    var t=tan[0];
    tan[0] = -tan[1];
    tan[1] = t;
    tan.normalize().mulScalar(offset);
    ret.add(tan);
    return ret;
  }, function evaluate(s, order, override_scale, no_update, no_effects) {
    if (no_effects==undefined) {
        no_effects = !ENABLE_MULTIRES;
    }
    if (no_effects) {
        if (order==undefined)
          order = ORDER;
        s = (s+1e-08)*(1.0-2e-08);
        s-=0.5;
        var co=eval_curve(s, this.v1, this.v2, this.ks, order, undefined, no_update);
        return co;
    }
    else {
      var wrap=this._evalwrap;
      var last=wrap;
      for (var i=0; i<this.cdata.length; i++) {
          if (this.cdata[i].constructor.layerinfo.has_curve_effect) {
              var eff=this.cdata[i].curve_effect(this);
              eff.set_parent(last);
              last = eff;
          }
      }
      return last.evaluate(s);
    }
  }, function post_solve() {
    SplineElement.prototype.post_solve.call(this);
  }, function update() {
    this._update_has_multires();
    this.flag|=SplineFlags.UPDATE|SplineFlags.UPDATE_AABB;
    this.h1.flag|=SplineFlags.UPDATE;
    this.h2.flag|=SplineFlags.UPDATE;
    for (var i=0; i<this.cdata.length; i++) {
        this.cdata[i].update(this);
    }
    var l=this.l;
    if (l==undefined)
      return ;
    var c=0;
    do {
      if (c++>10000) {
          console.log("Infinte loop detected!");
          break;
      }
      l.f.update();
      l = l.radial_next;
    } while (l!=undefined&&l!=this.l);
    
  }, function global_to_local(s, fixed_s) {
    if (fixed_s==undefined) {
        fixed_s = undefined;
    }
    return this._evalwrap.global_to_local(s, fixed_s);
  }, function local_to_global(p) {
    return this._evalwrap.local_to_global(p);
  }, function shared_vert(s) {
    if (this.v1===s.v1||this.v1==s.v2)
      return this.v1;
    if (this.v2===s.v1||this.v2==s.v2)
      return this.v2;
  }, function other_vert(v) {
    if (v==this.v1)
      return this.v2;
    if (v==this.v2)
      return this.v1;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new SplineSegment();
    reader(ret);
    ret.mat.update = function() {
      ret.flag|=SplineFlags.REDRAW;
    }
    return ret;
  })]);
  var $minmax_nKgE_update_aabb=new MinMax(2);
  _es6_module.add_class(SplineSegment);
  SplineSegment = _es6_module.add_export('SplineSegment', SplineSegment);
  SplineElement.STRUCT = "\n  SplineElement {\n    eid        : int;\n    flag       : int;\n    type       : int;\n    cdata      : CustomDataSet;\n  }\n";
  SplineSegment.STRUCT = STRUCT.inherit(SplineSegment, SplineElement)+"\n  ks   : array(float);\n\n  v1   : int | obj.v1.eid;\n  v2   : int | obj.v2.eid;\n\n  h1   : int | obj.h1 != undefined ? obj.h1.eid : -1;\n  h2   : int | obj.h2 != undefined ? obj.h2.eid : -1;\n\n  l    : int | obj.l != undefined  ? obj.l.eid : -1;\n\n  mat  : Material;\n\n  aabb   : array(vec3);\n  z      : float;\n  finalz : float;\n  has_multires : int;\n\n  topoid   : int;\n  stringid : int;\n}\n";
  var SplineLoop=_ESClass("SplineLoop", SplineElement, [function SplineLoop(f, s, v) {
    SplineElement.call(this, SplineTypes.LOOP);
    this.f = f, this.s = s, this.v = v;
    this.next = this.prev = undefined;
    this.radial_next = this.radial_prev = undefined;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new SplineLoop();
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(SplineLoop);
  SplineLoop = _es6_module.add_export('SplineLoop', SplineLoop);
  SplineLoop.STRUCT = STRUCT.inherit(SplineLoop, SplineElement)+"\n    f    : int | obj.f.eid;\n    s    : int | obj.s.eid;\n    v    : int | obj.v.eid;\n    next : int | obj.next.eid;\n    prev : int | obj.prev.eid;\n    radial_next : int | obj.radial_next != undefined ? obj.radial_next.eid : -1;\n    radial_prev : int | obj.radial_prev != undefined ? obj.radial_prev.eid : -1;\n  }\n";
  var SplineLoopPathIter=_ESClass("SplineLoopPathIter", [function SplineLoopPathIter(path) {
    this.path = path;
    this.ret = {done: false, value: undefined}
    this.l = path!=undefined ? path.l : undefined;
  }, function init(path) {
    this.path = path;
    this.l = path.l;
    this.ret.done = false;
    this.ret.value = undefined;
    return this;
  }, function next() {
    var ret=this.ret;
    if (this.l==undefined) {
        ret.done = true;
        ret.value = undefined;
        return ret;
    }
    ret.value = this.l;
    this.l = this.l.next;
    if (this.l===this.path.l)
      this.l = undefined;
    return ret;
  }, function reset() {
    this.l = this.path.l;
    this.ret.done = false;
    this.ret.value = undefined;
  }]);
  _es6_module.add_class(SplineLoopPathIter);
  var $cent_cEIJ_update_winding;
  var SplineLoopPath=_ESClass("SplineLoopPath", [function SplineLoopPath(l, f) {
    this.l = l;
    this.f = f;
    this.totvert = undefined;
    this.winding = 0;
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    if (this.itercache==undefined) {
        this.itercache = cachering.fromConstructor(SplineLoopPathIter, 4);
    }
    return this.itercache.next().init(this);
  }), function update_winding() {
    $cent_cEIJ_update_winding.zero();
    var __iter_l=__get_iter(this);
    var l;
    while (1) {
      var __ival_l=__iter_l.next();
      if (__ival_l.done) {
          break;
      }
      l = __ival_l.value;
      $cent_cEIJ_update_winding.add(l.v);
    }
    $cent_cEIJ_update_winding.mulScalar(1.0/this.totvert);
    var wsum=0;
    var __iter_l=__get_iter(this);
    var l;
    while (1) {
      var __ival_l=__iter_l.next();
      if (__ival_l.done) {
          break;
      }
      l = __ival_l.value;
      wsum+=math.winding(l.v, l.next.v, $cent_cEIJ_update_winding) ? 1 : -1;
    }
    this.winding = wsum>=0;
  }, function asArray() {
    var l=this.l;
    var ret=[];
    do {
      ret.push(l);
      l = l.next;
    } while (l!==this.l);
    
    return ret;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new SplineLoopPath();
    reader(ret);
    var l=ret.l = ret.loops[0];
    l.p = ret;
    for (var i=1; i<ret.loops.length; i++) {
        l.next = ret.loops[i];
        ret.loops[i].prev = l;
        ret.loops[i].p = ret;
        l = ret.loops[i];
    }
    ret.loops[0].prev = ret.loops[ret.loops.length-1];
    ret.loops[ret.loops.length-1].next = ret.loops[0];
    delete ret.loops;
    return ret;
  })]);
  var $cent_cEIJ_update_winding=new Vector3();
  _es6_module.add_class(SplineLoopPath);
  SplineLoopPath = _es6_module.add_export('SplineLoopPath', SplineLoopPath);
  SplineLoopPath.STRUCT = "\n  SplineLoopPath {\n    totvert : int;\n    loops   : array(SplineLoop) | obj.asArray();\n    winding : int;\n  }\n";
  var $minmax_BGUo_update_aabb;
  var SplineFace=_ESClass("SplineFace", SplineElement, [function SplineFace() {
    SplineElement.call(this, SplineTypes.FACE);
    this.z = this.finalz = 0;
    this.mat = new Material();
    this.paths = new GArray();
    this.flag|=SplineFlags.UPDATE_AABB;
    this._aabb = [new Vector3(), new Vector3()];
    var this2=this;
    this.mat.update = function() {
      this2.flag|=SplineFlags.REDRAW;
    }
  }, function update() {
    this.flag|=SplineFlags.UPDATE_AABB|SplineFlags.REDRAW;
  }, function update_aabb() {
    this.flag&=~SplineFlags.UPDATE_AABB;
    $minmax_BGUo_update_aabb.reset();
    var __iter_path=__get_iter(this.paths);
    var path;
    while (1) {
      var __ival_path=__iter_path.next();
      if (__ival_path.done) {
          break;
      }
      path = __ival_path.value;
      var __iter_l=__get_iter(path);
      var l;
      while (1) {
        var __ival_l=__iter_l.next();
        if (__ival_l.done) {
            break;
        }
        l = __ival_l.value;
        $minmax_BGUo_update_aabb.minmax(l.v.aabb[0]);
        $minmax_BGUo_update_aabb.minmax(l.v.aabb[1]);
        $minmax_BGUo_update_aabb.minmax(l.s.aabb[0]);
        $minmax_BGUo_update_aabb.minmax(l.s.aabb[1]);
      }
    }
    this._aabb[0].load($minmax_BGUo_update_aabb.min);
    this._aabb[1].load($minmax_BGUo_update_aabb.max);
    this._aabb[0][2] = this._aabb[1][2] = 0.0;
  }, _ESClass.get(function aabb() {
    if (this.flag&SplineFlags.UPDATE_AABB)
      this.update_aabb();
    return this._aabb;
  }), _ESClass.set(function aabb(val) {
    this._aabb = val;
  }), _ESClass.static(function fromSTRUCT(reader) {
    var ret=new SplineFace();
    ret.flag|=SplineFlags.UPDATE_AABB;
    reader(ret);
    ret.mat.update = function() {
      ret.flag|=SplineFlags.REDRAW;
    }
    return ret;
  })]);
  var $minmax_BGUo_update_aabb=new MinMax(3);
  _es6_module.add_class(SplineFace);
  SplineFace = _es6_module.add_export('SplineFace', SplineFace);
  SplineFace.STRUCT = STRUCT.inherit(SplineFace, SplineElement)+"\n    paths  : array(SplineLoopPath);\n    mat    : Material;\n    aabb   : array(vec3);\n    z      : float;\n    finalz : float;\n  }\n";
  var Material=_ESClass("Material", [function Material() {
    this.fillcolor = [0, 0, 0, 1];
    this.strokecolor = [0, 0, 0, 1];
    this.linewidth = 2.0;
    this.flag = 0;
    this.opacity = 1.0;
    this.fill_over_stroke = false;
    this.blur = 0.0;
  }, function update() {
    throw new Error("override me! should have happened in splinesegment or splineface constructors!");
  }, function equals(is_stroke, mat) {
    var color1=is_stroke ? this.strokecolor : this.fillcolor;
    var color2=is_stroke ? mat.strokecolor : mat.fillcolor;
    for (var i=0; i<4; i++) {
        if (color1[i]!=color2[i])
          return false;
    }
    if (this.flag!=mat.flag)
      return false;
    if (this.opacity!=mat.opacity)
      return false;
    if (this.blur!=mat.blur)
      return false;
    if (is_stroke&&this.linewidth!=mat.linewidth)
      return false;
    return true;
  }, function load(mat) {
    for (var i=0; i<4; i++) {
        this.fillcolor[i] = mat.fillcolor[i];
        this.strokecolor[i] = mat.strokecolor[i];
    }
    this.opacity = mat.opacity;
    this.linewidth = mat.linewidth;
    this.fill_over_stroke = mat.fill_over_stroke;
    this.blur = mat.blur;
    this.flag = mat.flag;
    return this;
  }, _ESClass.get(function css_fillcolor() {
    var r=Math.floor(this.fillcolor[0]*255);
    var g=Math.floor(this.fillcolor[1]*255);
    var b=Math.floor(this.fillcolor[2]*255);
    return "rgba("+r+","+g+","+b+","+this.fillcolor[3]+")";
  }), _ESClass.static(function fromSTRUCT(reader) {
    var ret=new Material();
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(Material);
  Material = _es6_module.add_export('Material', Material);
  Material.STRUCT = "\n  Material {\n    fillcolor        : array(float);\n    strokecolor      : array(float);\n    opacity          : float;\n    fill_over_stroke : int;\n    linewidth        : float;\n    blur             : float;\n    flag             : int;\n  }\n";
  var ToolIter=es6_import_item(_es6_module, 'toolprops_iter', 'ToolIter');
  var TPropIterable=es6_import_item(_es6_module, 'toolprops_iter', 'TPropIterable');
  var ElementRefIter=_ESClass("ElementRefIter", ToolIter, [function ElementRefIter() {
    ToolIter.call(this);
    this.ret = {done: false, value: undefined}
    this.spline = this.ctx = this.iter = undefined;
  }, function init(eset) {
    this.ret.done = false;
    this.nextitem = undefined;
    this.eset = eset;
    this.ctx = eset!=undefined ? eset.ctx : undefined;
    this.spline = this.ctx!=undefined ? this.ctx.spline : undefined;
    return this;
  }, function spawn() {
    var ret=new ElementRefIter();
    ret.init(this.eset);
    return ret;
  }, function next() {
    var ret=this.ret;
    if (this.spline==undefined)
      this.spline = this.ctx.spline;
    if (this.iter==undefined)
      this.iter = set.prototype[Symbol.iterator].call(this.eset);
    var spline=this.spline;
    var next, e=undefined;
    do {
      var next=this.iter.next();
      if (next.done)
        break;
      e = spline.eidmap[next.value];
      if (e==undefined) {
          console.log("Warning, bad eid", next.value);
      }
    } while (next.done!=true&&e==undefined);
    
    if (e==undefined||next.done==true) {
        this.spline = undefined;
        this.iter = undefined;
        ret.done = true;
        ret.value = undefined;
    }
    else {
      ret.value = e;
    }
    return ret;
  }, function reset() {
    this.i = 0;
    this.ret.done = false;
    this.spline = undefined;
    this.iter = undefined;
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this;
  }), _ESClass.static(function fromSTRUCT(reader) {
    var ret=new ElementRefIter();
    reader(ret);
    for (var i=0; i<ret.saved_items.length; i++) {
        ret.add(ret.saved_items[i]);
    }
    delete ret.saved_items;
    return ret;
  })]);
  _es6_module.add_class(ElementRefIter);
  ElementRefIter = _es6_module.add_export('ElementRefIter', ElementRefIter);
  ElementRefIter.STRUCT = "\n  ElementRefIter {\n    mask        : int;\n    saved_items : iter(int) | obj;\n  }\n";
  var ElementRefSet=_ESClass("ElementRefSet", set, [function ElementRefSet(mask) {
    set.call(this);
    this.mask = mask==undefined ? SplineTypes.ALL : mask;
  }, function add(item) {
    var start_item=item;
    if (!(typeof item=="number"||__instance_of(item, Number)))
      item = item.eid;
    if (item==undefined) {
        console.trace("ERROR in ElementRefSet!!", start_item);
        return ;
    }
    set.prototype.add.call(this, item);
  }, function copy() {
    var ret=new ElementRefSet(this.mask);
    var __iter_eid=__get_iter(set.prototype[Symbol.iterator].call(this));
    var eid;
    while (1) {
      var __ival_eid=__iter_eid.next();
      if (__ival_eid.done) {
          break;
      }
      eid = __ival_eid.value;
      ret.add(eid);
    }
    return ret;
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    if (this.itercaches==undefined) {
        this.itercaches = cachering.fromConstructor(ElementRefIter, 8);
    }
    return this.itercaches.next().init(this);
  })]);
  _es6_module.add_class(ElementRefSet);
  ElementRefSet = _es6_module.add_export('ElementRefSet', ElementRefSet);
  
  mixin(ElementRefSet, TPropIterable);
});
es6_module_define('spline_query', ["spline_multires", "selectmode"], function _spline_query_module(_es6_module) {
  var SelMask=es6_import_item(_es6_module, 'selectmode', 'SelMask');
  var has_multires=es6_import_item(_es6_module, 'spline_multires', 'has_multires');
  var compose_id=es6_import_item(_es6_module, 'spline_multires', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, 'spline_multires', 'decompose_id');
  var MResFlags=es6_import_item(_es6_module, 'spline_multires', 'MResFlags');
  var MultiResLayer=es6_import_item(_es6_module, 'spline_multires', 'MultiResLayer');
  var PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var sqrt=Math.sqrt;
  var $_mpos_pBfs_findnearest_mres;
  var $_mpos_E9s1_findnearest_vert;
  var $_v_E29t_findnearest_mres;
  var $_v_r2pN_findnearest_vert;
  var SplineQuery=_ESClass("SplineQuery", [function SplineQuery(spline) {
    this.spline = spline;
  }, function findnearest(editor, mpos, selectmask, limit, ignore_layers) {
    if (limit==undefined)
      limit = 15;
    var dis=1e+18;
    var data=undefined;
    if (selectmask&SelMask.VERTEX) {
        var ret=this.findnearest_vert(editor, mpos, limit, undefined, ignore_layers);
        if (ret!=undefined&&ret[1]<dis) {
            data = ret;
            dis = ret[1];
        }
    }
    if (selectmask&SelMask.MULTIRES) {
        var ret=this.findnearest_mres(editor, mpos, limit, ignore_layers);
        if (ret!=undefined&&ret[1]<dis) {
            data = ret;
            dis = ret[1];
        }
    }
    if (selectmask&SelMask.HANDLE) {
        var ret=this.findnearest_vert(editor, mpos, limit, true, ignore_layers);
        if (ret!=undefined&&ret[1]<dis) {
            data = ret;
            dis = ret[1];
        }
    }
    if (selectmask&SelMask.SEGMENT) {
        var ret=this.findnearest_segment(editor, mpos, limit, ignore_layers);
        if (ret!=undefined&&ret[1]<dis) {
            data = ret;
            dis = ret[1];
        }
    }
    if (selectmask&SelMask.FACE) {
        mpos = [mpos[0], mpos[1]];
        mpos[0]+=editor.abspos[0];
        mpos[1]+=editor.abspos[1];
        var ret=this.findnearest_face(editor, mpos, limit, ignore_layers);
        if (ret!=undefined&&ret[1]<dis) {
            data = ret;
            dis = ret[1];
        }
    }
    return data;
  }, function findnearest_segment(editor, mpos, limit, ignore_layers) {
    var spline=this.spline;
    var actlayer=spline.layerset.active;
    var sret=undefined, mindis=limit;
    editor.unproject(mpos);
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      var ret=seg.closest_point(mpos, undefined, true);
      if (ret==undefined)
        continue;
      ret = ret[0];
      if (seg.hidden||seg.v1.hidden||seg.v2.hidden)
        continue;
      if (!ignore_layers&&!seg.in_layer(actlayer))
        continue;
      var dis=sqrt((ret[0]-mpos[0])*(ret[0]-mpos[0])+(ret[1]-mpos[1])*(ret[1]-mpos[1]));
      if (dis<mindis) {
          sret = seg;
          mindis = dis;
      }
    }
    if (sret!=undefined)
      return [sret, mindis, SelMask.SEGMENT];
  }, function findnearest_face(editor, mpos, limit, ignore_layers) {
    var spline=this.spline;
    var actlayer=spline.layerset.active;
    var g=spline.canvas;
    var dis=0, closest=undefined;
    if (g==undefined)
      return ;
    for (var i=0; i<spline.faces.length; i++) {
        var f=spline.faces[i];
        if ((!ignore_layers&&!f.in_layer(actlayer))||f.hidden)
          continue;
        spline.trace_face(g, f);
        if (g.isPointInPath(mpos[0], window.innerHeight-mpos[1])) {
            closest = f;
        }
    }
    g.beginPath();
    if (closest!=undefined)
      return [closest, dis, SelMask.FACE];
  }, function findnearest_mres(editor, mpos, limit, do_handles, ignore_layers) {
    var spline=this.spline;
    var actlayer=spline.layerset.active;
    mpos = $_mpos_pBfs_findnearest_mres.load(mpos), mpos[2] = 0.0;
    if (!has_multires(spline))
      return undefined;
    if (limit==undefined)
      limit = 15;
    var min=1e+17, ret=undefined;
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      if (seg.hidden||seg.v1.hidden||seg.v2.hidden)
        continue;
      if (!ignore_layers&&!seg.in_layer(actlayer))
        continue;
      var mr=seg.cdata.get_layer(MultiResLayer);
      var __iter_p=__get_iter(mr.points(spline.actlevel));
      var p;
      while (1) {
        var __ival_p=__iter_p.next();
        if (__ival_p.done) {
            break;
        }
        p = __ival_p.value;
        if (p.flag&MResFlags.HIDE)
          continue;
        var seg=spline.eidmap[p.seg];
        var mapco=seg.evaluate(p.s);
        $_v_E29t_findnearest_mres.load(mapco);
        $_v_E29t_findnearest_mres[2] = 0.0;
        editor.project($_v_E29t_findnearest_mres);
        var dis=$_v_E29t_findnearest_mres.vectorDistance(mpos);
        if (dis<limit&&dis<min) {
            min = dis;
            ret = compose_id(p.seg, p.id);
        }
      }
    }
    if (ret!=undefined)
      return [ret, min, SelMask.MULTIRES];
  }, function findnearest_vert(editor, mpos, limit, do_handles, ignore_layers) {
    var spline=this.spline;
    var actlayer=spline.layerset.active;
    if (limit==undefined)
      limit = 15;
    var min=1e+17;
    var ret=undefined;
    mpos = $_mpos_E9s1_findnearest_vert.load(mpos), mpos[2] = 0.0;
    var hasmres=has_multires(spline);
    var list=do_handles ? spline.handles : spline.verts;
    var __iter_v=__get_iter(list);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      if (v.hidden)
        continue;
      if (!ignore_layers&&!v.in_layer(actlayer))
        continue;
      var co=v;
      if (hasmres&&v.segments.length>0) {
          co = v.segments[0].evaluate(v.segments[0].ends(v));
      }
      $_v_r2pN_findnearest_vert.load(co);
      $_v_r2pN_findnearest_vert[2] = 0.0;
      editor.project($_v_r2pN_findnearest_vert);
      var dis=$_v_r2pN_findnearest_vert.vectorDistance(mpos);
      if (dis<limit&&dis<min) {
          min = dis;
          ret = v;
      }
    }
    if (ret!=undefined)
      return [ret, min, do_handles ? SelMask.HANDLE : SelMask.VERTEX];
  }]);
  var $_mpos_pBfs_findnearest_mres=new Vector3();
  var $_mpos_E9s1_findnearest_vert=new Vector3();
  var $_v_E29t_findnearest_mres=new Vector3();
  var $_v_r2pN_findnearest_vert=new Vector3();
  _es6_module.add_class(SplineQuery);
  SplineQuery = _es6_module.add_export('SplineQuery', SplineQuery);
});
es6_module_define('spline_draw', ["mathlib", "spline_types", "spline_element_array", "spline_draw_new", "spline_math", "selectmode", "animdata", "view2d_editor", "config", "spline_multires"], function _spline_draw_module(_es6_module) {
  var aabb_isect_minmax2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_minmax2d');
  var ENABLE_MULTIRES=es6_import_item(_es6_module, 'config', 'ENABLE_MULTIRES');
  var SessionFlags=es6_import_item(_es6_module, 'view2d_editor', 'SessionFlags');
  var SelMask=es6_import_item(_es6_module, 'selectmode', 'SelMask');
  var ORDER=es6_import_item(_es6_module, 'spline_math', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, 'spline_math', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, 'spline_math', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, 'spline_math', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, 'spline_math', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, 'spline_math', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, 'spline_math', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, 'spline_math', 'INT_STEPS');
  var get_vtime=es6_import_item(_es6_module, 'animdata', 'get_vtime');
  var iterpoints=es6_import_item(_es6_module, 'spline_multires', 'iterpoints');
  var MultiResLayer=es6_import_item(_es6_module, 'spline_multires', 'MultiResLayer');
  var MResFlags=es6_import_item(_es6_module, 'spline_multires', 'MResFlags');
  var has_multires=es6_import_item(_es6_module, 'spline_multires', 'has_multires');
  var spline_draw_cache_vs=cachering.fromConstructor(Vector3, 64);
  var spline_draw_trans_vs=cachering.fromConstructor(Vector3, 32);
  var PI=Math.PI;
  var pow=Math.pow, cos=Math.cos, sin=Math.sin, abs=Math.abs, floor=Math.floor, ceil=Math.ceil, sqrt=Math.sqrt, log=Math.log, acos=Math.acos, asin=Math.asin;
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var SplineElement=es6_import_item(_es6_module, 'spline_types', 'SplineElement');
  var SplineVertex=es6_import_item(_es6_module, 'spline_types', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, 'spline_types', 'SplineSegment');
  var SplineLoop=es6_import_item(_es6_module, 'spline_types', 'SplineLoop');
  var SplineLoopPath=es6_import_item(_es6_module, 'spline_types', 'SplineLoopPath');
  var SplineFace=es6_import_item(_es6_module, 'spline_types', 'SplineFace');
  var RecalcFlags=es6_import_item(_es6_module, 'spline_types', 'RecalcFlags');
  var MaterialFlags=es6_import_item(_es6_module, 'spline_types', 'MaterialFlags');
  var ElementArray=es6_import_item(_es6_module, 'spline_element_array', 'ElementArray');
  var SplineLayerFlags=es6_import_item(_es6_module, 'spline_element_array', 'SplineLayerFlags');
  var ColorFlags={SELECT: 1, ACTIVE: 2, HIGHLIGHT: 4}
  ColorFlags = _es6_module.add_export('ColorFlags', ColorFlags);
  var FlagMap={UNSELECT: 0, SELECT: ColorFlags.SELECT, ACTIVE: ColorFlags.ACTIVE, HIGHLIGHT: ColorFlags.HIGHLIGHT, SELECT_ACTIVE: ColorFlags.SELECT|ColorFlags.ACTIVE, SELECT_HIGHLIGHT: ColorFlags.SELECT|ColorFlags.HIGHLIGHT, HIGHLIGHT_ACTIVE: ColorFlags.HIGHLIGHT|ColorFlags.ACTIVE, SELECT_HIGHLIGHT_ACTIVE: ColorFlags.SELECT|ColorFlags.ACTIVE|ColorFlags.HIGHLIGHT}
  FlagMap = _es6_module.add_export('FlagMap', FlagMap);
  function mix(a, b, t) {
    var ret=[0, 0, 0];
    for (var i=0; i<3; i++) {
        ret[i] = a[i]+(b[i]-a[i])*t;
    }
    return ret;
  }
  var ElementColor={UNSELECT: [1, 0.133, 0.07], SELECT: [1, 0.6, 0.26], HIGHLIGHT: [1, 0.93, 0.4], ACTIVE: [0.3, 0.4, 1.0], SELECT_ACTIVE: mix([1, 0.6, 0.26], [0.1, 0.2, 1.0], 0.7), SELECT_HIGHLIGHT: [1, 1, 0.8], HIGHLIGHT_ACTIVE: mix([1, 0.93, 0.4], [0.3, 0.4, 1.0], 0.5), SELECT_HIGHLIGHT_ACTIVE: [0.85, 0.85, 1.0]}
  ElementColor = _es6_module.add_export('ElementColor', ElementColor);
  function rgb2css(color) {
    var r=color[0], g=color[1], b=color[2];
    return "rgb("+(~~(r*255))+","+(~~(g*255))+","+(~~(b*255))+")";
  }
  var element_colormap=new Array(8);
  element_colormap = _es6_module.add_export('element_colormap', element_colormap);
  for (var k in ElementColor) {
      var f=FlagMap[k];
      element_colormap[f] = rgb2css(ElementColor[k]);
  }
  function get_element_flag(e, list) {
    var f=0;
    f|=e.flag&SplineFlags.SELECT ? ColorFlags.SELECT : 0;
    f|=e===list.highlight ? ColorFlags.HIGHLIGHT : 0;
    f|=e===list.active ? ColorFlags.ACTIVE : 0;
    return f;
  }
  function get_element_color(e, list) {
    return element_colormap[get_element_flag(e, list)];
  }
  get_element_color = _es6_module.add_export('get_element_color', get_element_color);
  function calc_string_ids(spline, startid) {
    if (startid==undefined) {
        startid = 0;
    }
    var string_idgen=startid;
    var tmp=new Array();
    var visit=new set();
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      seg.stringid = -1;
    }
    var __iter_v=__get_iter(spline.verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      if (v.segments.length!=2) {
          continue;
      }
      var v2=v, startv=v2, seg=undefined;
      var _i=0;
      for (var j=0; j<v.segments.length; j++) {
          if (!visit.has(v.segments[j].eid)) {
              seg = v.segments[j];
              break;
          }
      }
      if (seg==undefined) {
          continue;
      }
      do {
        v2 = seg.other_vert(v2);
        if (v2.segments.length!=2) {
            break;
        }
        seg = v2.other_segment(seg);
        if (visit.has(seg.eid)) {
            break;
        }
        if (_i++>1000) {
            console.trace("infinite loop detected!");
            break;
        }
      } while (v2!=startv);
      
      var lastseg=undefined;
      startv = v2;
      _i = 0;
      do {
        if (lastseg!=undefined) {
            var bad=true;
            for (var k1 in seg.layers) {
                for (var k2 in lastseg.layers) {
                    if (k1==k2) {
                        bad = false;
                        break;
                    }
                }
                if (bad) {
                    break;
                }
            }
            bad = bad||!seg.mat.equals(true, lastseg.mat);
            if (bad) {
                string_idgen++;
            }
        }
        if (visit.has(seg.eid)) {
            break;
        }
        seg.stringid = string_idgen;
        visit.add(seg.eid);
        v2 = seg.other_vert(v2);
        if (v2.segments.length!=2) {
            break;
        }
        lastseg = seg;
        seg = v2.other_segment(seg);
        if (_i++>1000) {
            console.trace("infinite loop detected!");
            break;
        }
      } while (v2!=startv);
      
    }
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      if (seg.stringid==-1) {
          seg.stringid = string_idgen++;
      }
    }
    return string_idgen;
  }
  calc_string_ids = _es6_module.add_export('calc_string_ids', calc_string_ids);
  var $lists_QeAa_sort_layer_segments=new cachering(function() {
    return [];
  }, 2);
  function sort_layer_segments(layer, spline) {
    var list=$lists_QeAa_sort_layer_segments.next();
    list.length = 0;
    var visit={}
    var layerid=layer.id;
    var topogroup_idgen=0;
    function recurse(seg) {
      if (seg.eid in visit) {
          return ;
      }
      visit[seg.eid] = 1;
      seg.topoid = topogroup_idgen;
      for (var i=0; i<2; i++) {
          var v=i ? seg.v2 : seg.v1;
          if (v.segments.length!=2)
            continue;
          for (var j=0; j<v.segments.length; j++) {
              var s2=v.segments[j];
              if (!(s2.eid in visit)) {
                  recurse(s2);
              }
          }
      }
      if (!s.hidden||(s.flag&SplineFlags.GHOST))
        list.push(seg);
    }
    if (1) {
        var __iter_s=__get_iter(layer);
        var s;
        while (1) {
          var __ival_s=__iter_s.next();
          if (__ival_s.done) {
              break;
          }
          s = __ival_s.value;
          if (s.type!=SplineTypes.SEGMENT)
            continue;
          if (!(layerid in s.layers))
            continue;
          if (s.v1.segments.length==2&&s.v2.segments.length==2)
            continue;
          if (!(s.eid in visit)) {
              topogroup_idgen++;
              recurse(s);
          }
        }
        var __iter_s=__get_iter(layer);
        var s;
        while (1) {
          var __ival_s=__iter_s.next();
          if (__ival_s.done) {
              break;
          }
          s = __ival_s.value;
          if (s.type!=SplineTypes.SEGMENT)
            continue;
          if (!(layerid in s.layers))
            continue;
          if (!(s.eid in visit)) {
              topogroup_idgen++;
              recurse(s);
          }
        }
    }
    return list;
  }
  sort_layer_segments = _es6_module.add_export('sort_layer_segments', sort_layer_segments);
  function redo_draw_sort(spline) {
    var min_z=100000000000000.0;
    var max_z=-100000000000000.0;
    var layerset=spline.layerset;
    console.log("start sort");
    var time=time_ms();
    var __iter_f=__get_iter(spline.faces);
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      if (f.hidden&&!(f.flag&SplineFlags.GHOST))
        continue;
      if (isNaN(f.z))
        f.z = 0;
      max_z = Math.max(max_z, f.z+1);
      min_z = Math.min(min_z, f.z+1);
    }
    var __iter_s=__get_iter(spline.segments);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      if (s.hidden&&!(s.flag&SplineFlags.GHOST))
        continue;
      if (isNaN(s.z))
        s.z = 0;
      max_z = Math.max(max_z, s.z+2);
      min_z = Math.min(min_z, s.z);
    }
    function calc_z(e, check_face) {
      if (isNaN(e.z)) {
          e.z = 0;
      }
      if (check_face&&e.type==SplineTypes.SEGMENT&&e.l!==undefined) {
          var l=e.l;
          var _i=0;
          var f_max_z=calc_z(e, true);
          do {
            if (_i++>1000) {
                console.trace("infinite loop!");
                break;
            }
            var fz=calc_z(l.f);
            f_max_z = f_max_z===undefined ? fz : Math.max(f_max_z, fz);
            l = l.radial_next;
          } while (l!=e.l);
          
          return f_max_z+1;
      }
      var layer=0;
      for (var k in e.layers) {
          layer = k;
          break;
      }
      if (!(layer in layerset.idmap)) {
          console.log("Bad layer!", layer);
          return -1;
      }
      layer = layerset.idmap[layer];
      return layer.order*(max_z-min_z)+(e.z-min_z);
    }
    function get_layer(e) {
      for (var k in e.layers) {
          return k;
      }
      return undefined;
    }
    var dl=spline.drawlist = [];
    var ll=spline.draw_layerlist = [];
    spline._layer_maxz = max_z;
    var __iter_f=__get_iter(spline.faces);
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      f.finalz = -1;
      if (f.hidden&&!(f.flag&SplineFlags.GHOST))
        continue;
      dl.push(f);
    }
    var visit={}
    for (var i=0; i<spline.layerset.length; i++) {
        var layer=spline.layerset[i];
        var elist=sort_layer_segments(layer, spline);
        for (var j=0; j<elist.length; j++) {
            var s=elist[j];
            if (!(s.eid in visit))
              dl.push(elist[j]);
            visit[s.eid] = 1;
        }
    }
    var __iter_s=__get_iter(spline.segments);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      s.finalz = -1;
      if (s.hidden&&!(s.flag&SplineFlags.GHOST))
        continue;
      if (!(s.eid in visit)) {
          dl.push(s);
      }
    }
    var zs={}
    var __iter_e=__get_iter(dl);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      zs[e.eid] = calc_z(e);
    }
    if (!spline.is_anim_path) {
        dl.sort(function(a, b) {
          return zs[a.eid]-zs[b.eid];
        });
    }
    for (var i=0; i<dl.length; i++) {
        var lk=undefined;
        for (var k in dl[i].layers) {
            lk = k;
            break;
        }
        ll.push(lk);
    }
    for (var i=0; i<spline.drawlist.length; i++) {
        spline.drawlist[i].finalz = i;
    }
    calc_string_ids(spline, spline.segments.length);
    spline.recalc&=~RecalcFlags.DRAWSORT;
    console.log("time taken:"+(time_ms()-time).toFixed(2)+"ms");
  }
  redo_draw_sort = _es6_module.add_export('redo_draw_sort', redo_draw_sort);
  var VERT_SIZE=3.0;
  var SMALL_VERT_SIZE=1.0;
  var MRES_SIZE=5.5;
  function draw_mres_points(spline, g, editor, outside_selmode) {
    if (outside_selmode==undefined) {
        outside_selmode = false;
    }
    if (spline.segments.cdata.num_layers("MultiResLayer")==0)
      return ;
    var w=MRES_SIZE/editor.zoom;
    var lw=g.lineWidth;
    g.lineWidth = 1;
    g.fillStyle = "black";
    var shared=spline.segments.cdata.get_shared("MultiResLayer");
    var active=shared.active;
    var __iter_p=__get_iter(iterpoints(spline, 0));
    var p;
    while (1) {
      var __ival_p=__iter_p.next();
      if (__ival_p.done) {
          break;
      }
      p = __ival_p.value;
      if (p.flag&MResFlags.HIDE)
        continue;
      var seg=spline.eidmap[p.seg];
      var mapco=seg.evaluate(p.s);
      var clr=uclr;
      if (p.composed_id==active)
        clr = aclr;
      else 
        if (p.flag&MResFlags.HIGHLIGHT)
        clr = hclr;
      else 
        if (p.flag&MResFlags.ACTIVE)
        clr = aclr;
      else 
        if (p.flag&MResFlags.SELECT)
        clr = sclr;
      g.fillStyle = clr;
      if (!outside_selmode) {
          g.beginPath();
          g.rect(mapco[0]-w/2, mapco[1]-w/2, w, w);
          g.fill();
      }
    }
    g.lineWidth = lw;
  }
  var SplineDrawer=es6_import_item(_es6_module, 'spline_draw_new', 'SplineDrawer');
  var $smin_8L0X_draw_spline=new Vector3();
  var $r_1zWe_draw_spline=[[0, 0], [0, 0]];
  var $smax_YQhS_draw_spline=new Vector3();
  function draw_spline(spline, redraw_rects, g, editor, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime, ignore_layers) {
    spline.canvas = g;
    if (spline.drawlist==undefined||(spline.recalc&RecalcFlags.DRAWSORT)) {
        redo_draw_sort(spline);
    }
    if (spline.drawer==undefined) {
        spline.drawer = new SplineDrawer(spline);
    }
    spline.drawer.update(spline, spline.drawlist, spline.draw_layerlist, editor.rendermat, redraw_rects, only_render, selectmode, g, editor.zoom, editor, ignore_layers);
    spline.drawer.draw(editor.drawg);
    var layerset=spline.layerset;
    var actlayer=spline.layerset.active;
    var totlayer=spline.layerset.length;
    var zoom=editor.zoom;
    if (isNaN(zoom)) {
        zoom = 1.0;
    }
    g.lineWidth = 2;
    g.strokeStyle = clr;
    if (alpha==undefined)
      alpha = 1.0;
    var lastco=spline_draw_cache_vs.next().zero();
    var b1=spline_draw_cache_vs.next(), b2=spline_draw_cache_vs.next();
    var b3=spline_draw_cache_vs.next();
    var co=spline_draw_cache_vs.next();
    var dostroke=false;
    var lastdv=spline_draw_cache_vs.next();
    var mathmin=Math.min;
    var MAXCURVELEN=10000;
    function draw_curve_normals() {
      var __iter_seg=__get_iter(spline.segments);
      var seg;
      while (1) {
        var __ival_seg=__iter_seg.next();
        if (__ival_seg.done) {
            break;
        }
        seg = __ival_seg.value;
        if (seg.v1.hidden||seg.v2.hidden)
          continue;
        var ls=0.0, dls=80/zoom;
        var length=seg.ks[KSCALE];
        if (length<=0||isNaN(length))
          continue;
        if (length<MAXCURVELEN)
          length = MAXCURVELEN;
        for (var ls=0; ls<length; ls+=dls) {
            var s=ls/length;
            if (s>1.0)
              continue;
            var co=seg.evaluate(s);
            var n=seg.normal(s).normalize();
            var k=seg.curvature(s);
            n.mulScalar(k*(window._d!=undefined ? window._d : 1000)/zoom);
            g.lineWidth = 1;
            g.strokeColor = "%2233bb";
            g.beginPath();
            g.moveTo(co[0], co[1]);
            g.lineTo(co[0]+n[0], co[1]+n[1]);
            g.stroke();
        }
      }
    }
    if (!only_render&&draw_normals)
      draw_curve_normals();
    function aprint(arr) {
      var s="[";
      for (var i=0; i<2; i++) {
          if (i>0)
            s+=", ";
          s+=arr[i].toFixed(1);
      }
      s+="]";
      return s;
    }
    var black="black";
    var __iter_s=__get_iter(spline.segments);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      s.flag&=~SplineFlags.DRAW_TEMP;
    }
    var __iter_f=__get_iter(spline.faces);
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      f.flag&=~SplineFlags.DRAW_TEMP;
    }
    var ghostflag=SplineFlags.GHOST;
    var __iter_seg=__get_iter(spline.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      $smin_8L0X_draw_spline.zero().load(seg.aabb[0]);
      $smax_YQhS_draw_spline.zero().load(seg.aabb[1]);
      var skipdraw=true;
      for (var i=0; i<redraw_rects.length; i+=4) {
          $r_1zWe_draw_spline[0][0] = redraw_rects[i], $r_1zWe_draw_spline[0][1] = redraw_rects[i+1];
          $r_1zWe_draw_spline[1][0] = redraw_rects[i+2], $r_1zWe_draw_spline[1][1] = redraw_rects[i+3];
          if (aabb_isect_minmax2d($smin_8L0X_draw_spline, $smax_YQhS_draw_spline, $r_1zWe_draw_spline[0], $r_1zWe_draw_spline[1], 2)) {
              skipdraw = false;
              break;
          }
      }
      if (skipdraw)
        continue;
      var is_ghost=(seg.v1.flag&ghostflag)||(seg.v2.flag&ghostflag)||(seg.flag&ghostflag);
      is_ghost = !only_render&&is_ghost;
      if (!is_ghost&&(seg.v1.hidden||seg.v2.hidden))
        continue;
      if (!is_ghost&&seg.hidden)
        continue;
      seg.flag|=SplineFlags.DRAW_TEMP;
      if (seg.l!=undefined) {
          var l=seg.l;
          var c=0;
          do {
            l.f.flag|=SplineFlags.DRAW_TEMP;
            l = l.radial_next;
            if (c++>1000) {
                break;
            }
          } while (l!=seg.l);
          
      }
    }
    function draw_segment(seg, alpha2, line_width_scale, reset, reverse) {
      return ;
      if (line_width_scale==undefined)
        line_width_scale = 1.0;
      var is_ghost=(seg.v1.flag&ghostflag)||(seg.v2.flag&ghostflag)||(seg.flag&ghostflag);
      is_ghost = !only_render&&is_ghost;
      if (alpha2==undefined)
        alpha2 = is_ghost ? 0.1 : alpha;
      if (!(seg.flag&SplineFlags.DRAW_TEMP))
        return ;
      var USE_BEZIER=!ENABLE_MULTIRES;
      var s=0, length=mathmin(seg.ks[KSCALE], MAXCURVELEN);
      var totseg=USE_BEZIER ? 7 : 172;
      var stepsize=Math.max(length/totseg, 1.0/zoom);
      if (stepsize<=0.0||isNaN(stepsize))
        stepsize==1.0;
      var lasts=0, lasts1=0;
      var lastco=undefined;
      var lastdv=undefined;
      var color;
      if ((ignore_layers||seg.in_layer(actlayer))&&!only_render&&(selectmode&SelMask.SEGMENT)) {
          if (get_element_flag(seg, spline.segments))
            color = get_element_color(seg, spline.segments);
          else 
            if (seg.flag&SplineFlags.NO_RENDER)
            color = "rgba(0, 0, 0, 0)";
          else 
            color = "rgba(0,0,0,"+alpha2+")";
      }
      else 
        if (seg.flag&SplineFlags.NO_RENDER) {
          return ;
      }
      else {
        var clr=seg.mat.strokecolor;
        var r1=~~(clr[0]*255);
        var g1=~~(clr[1]*255);
        var b1=~~(clr[2]*255);
        color = "rgba("+r1+","+g1+","+b1+","+alpha2*clr[3]+")";
      }
      g.strokeStyle = color;
      g.lineWidth = seg.mat.linewidth*zoom*line_width_scale;
      var is_line=false;
      var df=0.001;
      var s1=0.0001;
      var finals=1.0-0.0001;
      var ds=stepsize;
      if (reverse) {
          s1 = length-0.0001;
          finals = 1e-05;
          ds = -ds;
          stepsize = -stepsize;
      }
      if (isNaN(length))
        return ;
      var stop=false;
      if (seg._draw_bzs!=undefined) {
          stop = true;
          var bzs=seg._draw_bzs;
          for (var i=0; i<bzs.length; i++) {
              var p1=bzs[i][0];
              var p2=bzs[i][1];
              var p3=bzs[i][2];
              var p4=bzs[i][3];
              if (i==0) {
                  g.moveTo(p1[0], p1[1]);
                  g.bezierCurveTo(p2[0], p2[1], p3[0], p3[1], p4[0], p4[1]);
              }
              else {
                g.moveTo(p1[0], p1[1]);
                g.bezierCurveTo(p2[0], p2[1], p3[0], p3[1], p4[0], p4[1]);
              }
          }
          g.stroke();
      }
      var __c=0;
      for (var j=0; !stop; s1+=ds, j++) {
          var s=s1/(length);
          if (__c++>2500)
            break;
          if ((!reverse&&s>1.0)||(reverse&&s<=0)) {
              stop = true;
              s = finals;
          }
          s = Math.max(Math.min(s, 1.0), 0.0);
          var co=seg.evaluate(s);
          var df=0.0001;
          var dv2=seg.derivative(s, undefined, true);
          var dv3=seg.derivative(s+df, undefined, true);
          dv3.sub(dv2).mulScalar(1.0/df);
          if (dv3.dot(dv3)<0.01) {
              is_line = true;
          }
          dv2.mulScalar(1/(3*(length/stepsize)));
          if (lastco==undefined&&reset) {
              g.moveTo(co[0], co[1]);
          }
          else 
            if (lastco==undefined) {
              g.lineTo(co[0], co[1]);
          }
          else {
            var dv=lastdv;
            if (is_line||!USE_BEZIER) {
                g.lineTo(co[0], co[1]);
            }
            else {
              g.bezierCurveTo(lastco[0]+dv[0], lastco[1]+dv[1], co[0]-dv2[0], co[1]-dv2[1], co[0], co[1]);
            }
          }
          lastco = co;
          lastdv = dv2;
      }
      g.stroke();
    }
    var drawlist=spline.drawlist;
    function draw_face(f, do_mask) {
      g.lineWidth = 8;
      if (!do_mask) {
          g.beginPath();
      }
      var lastco=new Vector3();
      var __iter_path=__get_iter(f.paths);
      var path;
      while (1) {
        var __ival_path=__iter_path.next();
        if (__ival_path.done) {
            break;
        }
        path = __ival_path.value;
        var first=true;
        var lastco, lastdv;
        var __iter_l=__get_iter(path);
        var l;
        while (1) {
          var __ival_l=__iter_l.next();
          if (__ival_l.done) {
              break;
          }
          l = __ival_l.value;
          var seg=l.s;
          var length=seg.length;
          var flip=seg.v1!==l.v ? -1.0 : 1.0;
          var length=mathmin(seg.ks[KSCALE], MAXCURVELEN);
          var steps=5, s=flip<0.0 ? 1.0 : 0.0;
          var ds=(1.0/(steps-1))*flip;
          for (var i=0; i<steps; i++, s+=ds) {
              var co=seg.evaluate(s*0.9998+1e-05);
              var dv=seg.derivative(s*0.9998+1e-05);
              var k=seg.curvature(s*0.9998+1e-05);
              dv.mulScalar(ds/3.0);
              if (first) {
                  first = false;
                  g.moveTo(co[0], co[1]);
              }
              else {
                if (i==0||abs(k)<1e-05/zoom) {
                    g.lineTo(co[0], co[1]);
                }
                else {
                  g.bezierCurveTo(lastco[0]+lastdv[0], lastco[1]+lastdv[1], co[0]-dv[0], co[1]-dv[1], co[0], co[1]);
                }
              }
              lastco = co;
              lastdv = dv;
          }
        }
      }
      g.fillStyle = f.mat.css_fillcolor;
      if (!do_mask) {
          g.closePath();
          g.fill();
      }
      if (do_mask||(!ignore_layers&&!f.in_layer(actlayer))||only_render)
        return ;
      if ((selectmode&SelMask.FACE)&&f===spline.faces.highlight) {
          g.strokeStyle = "rgba(200, 200, 50, 0.8)";
          g.stroke();
      }
      else 
        if ((selectmode&SelMask.FACE)&&f===spline.faces.active) {
          g.strokeStyle = "rgba(200, 80, 50, 0.8)";
          g.stroke();
      }
      else 
        if ((selectmode&SelMask.FACE)&&(f.flag&SplineFlags.SELECT)) {
          g.strokeStyle = "rgba(250, 140, 50, 0.8)";
          g.stroke();
      }
    }
    var maxdim=Math.max(window.innerWidth, window.innerHeight);
    function draw_blur(seg, clr, func, rad) {
      var r1=~~(clr[0]*255);
      var g1=~~(clr[1]*255);
      var b1=~~(clr[2]*255);
      color = "rgba("+r1+","+g1+","+b1+","+1.0+")";
      var d=maxdim/zoom*1.5;
      g._render_mat.translate(-d, -d, 0);
      g.shadowOffsetX = d*zoom;
      g.shadowOffsetY = -d*zoom;
      g.shadowBlur = rad*zoom;
      g.shadowColor = color;
      func(seg);
      g.shadowBlur = 0.0;
      g._render_mat.translate(d, d, 0);
      g.shadowOffsetX = g.shadowOffsetY = 0.0;
    }
    var layerlist=spline.draw_layerlist;
    var last_layer=undefined, did_mask=false;
    var clip_stack=0;
    var do_blur=only_render||editor.enable_blur;
    var draw_faces=only_render||editor.draw_faces;
    var last_segment=undefined;
    var reverse=0;
    var vert_size=editor.draw_small_verts ? SMALL_VERT_SIZE : VERT_SIZE;
    g.beginPath();
    for (var i=0; i<drawlist.length; i++) {
        break;
        var layer=layerset.idmap[layerlist[i]];
        if (layer!=undefined&&layer!=last_layer) {
            var prevlayer=layerset[layer.order-1];
            var nextlayer=layerset[layer.order+1];
            if (nextlayer!=undefined&&(nextlayer.flag&SplineLayerFlags.MASK)) {
                if (clip_stack==0) {
                    clip_stack++;
                    g.save();
                }
                did_mask = true;
            }
            else 
              if (layer.flag&SplineLayerFlags.MASK) {
                var j=i-1;
                while (j>=0&&prevlayer!=undefined&&layerlist[j]==prevlayer.id) {
                  j--;
                }
                j++;
                g.beginPath();
                while (layerlist[j]==prevlayer.id) {
                  var e2=drawlist[j];
                  if (e2.type==SplineTypes.FACE) {
                      draw_face(e2, true);
                      g.closePath();
                  }
                  j++;
                }
                g.clip();
            }
            else 
              if (!(layer.flag&SplineLayerFlags.MASK)&&did_mask) {
                clip_stack--;
                g.restore();
                did_mask = clip_stack<=0;
            }
            last_layer = layer;
        }
        var e=drawlist[i];
        for (var j=0; j<4; j++) {
            if (isNaN(e.mat.fillcolor[j]))
              e.mat.fillcolor[j] = 0;
            if (isNaN(e.mat.strokecolor[j]))
              e.mat.strokecolor[j] = 0;
        }
        if (layer==undefined)
          layer = spline.layerset.active;
        if (layer==undefined) {
            console.log("Error in draw");
            continue;
        }
        if (layer.flag&SplineLayerFlags.HIDE)
          continue;
        if (e.type==SplineTypes.SEGMENT) {
            if (e.l!=undefined&&(e.mat.flag&MaterialFlags.MASK_TO_FACE)) {
                var l=e.l;
                var _c=0;
                clip_stack++;
                g.save();
                do {
                  g.beginPath();
                  draw_face(l.f, 1);
                  g.closePath();
                  g.clip();
                  if (c>1000)
                    break;
                  l = l.radial_next;
                } while (l!=e.l);
                
            }
            var reset=1;
            if (last_segment!=undefined) {
                var v1=e.v1, v2=e.v2, v3=last_segment.v1, v4=last_segment.v2, v;
                reset = v1!=v3&&v1!=v4&&v2!=v3&&v2!=v4;
                if (!reset) {
                    var v=v1==v3||v1==v4 ? v1 : v2;
                    if ((v==last_segment.v2)^reverse) {
                        reset = 1;
                    }
                    else 
                      if ((v==last_segment.v1)==(v==e.v1)) {
                        reverse^=1;
                    }
                }
            }
            reset = 1;
            reverse = 0;
            if (do_blur&&e.mat.blur!=0.0) {
                g.beginPath();
                draw_blur(e, e.mat.strokecolor, draw_segment, e.mat.blur);
            }
            else {
              g.beginPath();
              draw_segment(e, undefined, undefined, 0, 0);
              g.stroke();
            }
            last_segment = e;
            if (e.l!=undefined&&(e.mat.flag&MaterialFlags.MASK_TO_FACE)) {
                clip_stack--;
                g.restore();
            }
        }
        else 
          if (draw_faces&&e.type==SplineTypes.FACE) {
            if (dostroke)
              g.stroke();
            g.beginPath();
            last_segment = undefined;
            reverse = reset = 0;
            dostroke = false;
            if (do_blur&&e.mat.blur!=0.0) {
                draw_blur(e, e.mat.fillcolor, draw_face, e.mat.blur);
            }
            else {
              draw_face(e);
            }
        }
    }
    while (clip_stack>0) {
      clip_stack--;
      g.restore();
    }
    g.beginPath();
    if (!only_render&&(selectmode&SelMask.SEGMENT)) {
        var __iter_s=__get_iter(spline.segments.selected);
        var s;
        while (1) {
          var __ival_s=__iter_s.next();
          if (__ival_s.done) {
              break;
          }
          s = __ival_s.value;
          draw_segment(s, 0.1);
        }
        if (spline.segments.highlight!=undefined) {
            draw_segment(spline.segments.highlight);
        }
    }
    if (only_render)
      return ;
    
    if (selectmode&SelMask.HANDLE) {
        var w=vert_size/editor.zoom;
        for (var i=0; i<spline.handles.length; i++) {
            var v=spline.handles[i];
            var clr=get_element_color(v, spline.handles);
            if (!ignore_layers&&!v.owning_segment.in_layer(actlayer))
              continue;
            if (v.owning_segment!=undefined&&v.owning_segment.flag&SplineFlags.HIDE)
              continue;
            if (v.owning_vertex!=undefined&&v.owning_vertex.flag&SplineFlags.HIDE)
              continue;
            if (!v.use)
              continue;
            if ((v.flag&SplineFlags.AUTO_PAIRED_HANDLE)&&v.hpair!==undefined&&(v.segments.length>2)) {
                continue;
            }
            if (v.flag&SplineFlags.HIDE)
              continue;
            g.beginPath();
            if (clr!==last_clr)
              g.fillStyle = clr;
            last_clr = clr;
            g.rect(v[0]-w, v[1]-w, w*2, w*2);
            g.fill();
            g.beginPath();
            g.lineWidth = 1;
            var ov=v.owning_segment.handle_vertex(v);
            g.moveTo(v[0], v[1]);
            g.lineTo(ov[0], ov[1]);
            g.stroke();
        }
    }
    if (!only_render&&(selectmode&SelMask.MULTIRES)) {
        draw_mres_points(spline, g, editor);
    }
    else 
      if (!only_render) {
        draw_mres_points(spline, g, editor, true);
    }
    var hasmres=has_multires(spline);
    var last_clr=undefined;
    function draw_verts() {
      var w=vert_size/editor.zoom;
      for (var i=0; i<spline.verts.length; i++) {
          var v=spline.verts[i];
          var clr=get_element_color(v, spline.verts);
          if (!ignore_layers&&!v.in_layer(actlayer))
            continue;
          if (v.flag&SplineFlags.HIDE)
            continue;
          var co=v;
          if (hasmres&&v.segments.length>0) {
              co = v.segments[0].evaluate(v.segments[0].ends(v));
          }
          if (draw_time_helpers) {
              var time=get_vtime(v);
              if (curtime==time) {
                  g.beginPath();
                  g.fillStyle = "#33ffaa";
                  g.rect(co[0]-w*2, co[1]-w*2, w*4, w*4);
                  g.fill();
                  g.fillStyle = clr;
              }
          }
          g.beginPath();
          if (clr!==last_clr)
            g.fillStyle = clr;
          last_clr = clr;
          g.rect(co[0]-w, co[1]-w, w*2, w*2);
          g.fill();
      }
    }
    if (selectmode&SelMask.VERTEX) {
        var w=vert_size/editor.zoom;
        for (var i=0; i<spline.verts.length; i++) {
            var v=spline.verts[i];
            var clr=get_element_color(v, spline.verts);
            if (!ignore_layers&&!v.in_layer(actlayer))
              continue;
            if (v.flag&SplineFlags.HIDE)
              continue;
            var co=v;
            if (hasmres&&v.segments.length>0) {
                co = v.segments[0].evaluate(v.segments[0].ends(v));
            }
            if (draw_time_helpers) {
                var time=get_vtime(v);
                if (curtime==time) {
                    g.beginPath();
                    g.fillStyle = "#33ffaa";
                    g.rect(co[0]-w*2, co[1]-w*2, w*4, w*4);
                    g.fill();
                    g.fillStyle = clr;
                }
            }
            g.beginPath();
            if (clr!==last_clr)
              g.fillStyle = clr;
            last_clr = clr;
            g.rect(co[0]-w, co[1]-w, w*2, w*2);
            g.fill();
        }
    }
    if (spline.sim!=undefined)
      spline.sim.on_draw(g, spline);
    if (spline.transforming&&spline.proportional) {
        g.beginPath();
        g.arc(spline.trans_cent[0], spline.trans_cent[1], spline.prop_radius, -PI, PI);
        g.stroke();
    }
  }
  draw_spline = _es6_module.add_export('draw_spline', draw_spline);
  function patch_canvas2d(g) {
    var this2=this;
    g._is_patched = this;
    if (g._lineTo==undefined) {
        g._lineTo = g.lineTo;
        g._moveTo = g.moveTo;
        g._drawImage = g.drawImage;
        g._putImageData = g.putImageData;
        g._rect = g.rect;
        g._bezierCurveTo = g.bezierCurveTo;
        g._clearRect = g.clearRect;
        g._translate = g.translate;
        g._scale = g.scale;
        g._rotate = g.rotate;
    }
    var a=new Vector3(), b=new Vector3(), c=new Vector3(), d=new Vector3();
    function transform(g, co) {
      var rendermat=g._render_mat;
      if (rendermat!=undefined) {
          co.multVecMatrix(rendermat);
      }
      co[1] = g.canvas.height-co[1];
    }
    function untransform(g, co) {
      var rendermat=g._irender_mat;
      co[1] = g.canvas.height-co[1];
      if (rendermat!=undefined) {
          co.multVecMatrix(rendermat);
      }
    }
    var co=new Vector3();
    g.moveTo = function(x, y) {
      co.zero();
      co[0] = x;
      co[1] = y;
      transform(this, co);
      g._moveTo(co[0], co[1]);
    }
    g.drawImage = function(image) {
      if (arguments.length==3) {
          var x=arguments[1], y=arguments[2];
          var w=x+image.width, h=y+image.height;
          co.zero();
          co[0] = x;
          co[1] = y;
          transform(this, co);
          x = co[0], y = co[1];
          co.zero();
          co[0] = w;
          co[1] = h;
          transform(this, co);
          console.log(x, y, "w, h", Math.abs(co[0]-x), Math.abs(co[1]-y), w, h);
          this._drawImage(image, x, y, Math.abs(co[0]-x), Math.abs(co[1]-y));
      }
      else 
        if (arguments.length==5) {
          var x=arguments[1], y=arguments[2];
          var w=x+arguments[3], h=y+arguments[4];
          co.zero();
          co[0] = x;
          co[1] = y;
          transform(this, co);
          x = co[0], y = co[1];
          co.zero();
          co[0] = w;
          co[1] = h;
          transform(this, co);
          console.log(x, y, "w, h", Math.abs(co[0]-x), Math.abs(co[1]-y), w, h);
          this._drawImage(image, x, y, Math.abs(co[0]-x), Math.abs(co[1]-y));
      }
      else {
        throw new Error("Invalid call to drawImage");
      }
    }
    g.putImageData = function(imagedata) {
      if (arguments.length==3) {
          co.zero();
          co[0] = arguments[1];
          co[1] = arguments[2];
          transform(this, co);
          var x=co[0], y=co[1];
          this._putImageData(imagedata, x, y);
      }
      else 
        if (arguments.length==5) {
          console.trace("Unimplemented!!!!");
      }
      else {
        throw new Error("Invalid number of argumnets to g.putImageData()");
      }
    }
    g.bezierCurveTo = function(x1, y1, x2, y2, x3, y3) {
      co[0] = x1;
      co[1] = y1;
      co[2] = 0.0;
      transform(this, co);
      x1 = co[0], y1 = co[1];
      co[0] = x2;
      co[1] = y2;
      co[2] = 0.0;
      transform(this, co);
      x2 = co[0], y2 = co[1];
      co[0] = x3;
      co[1] = y3;
      co[2] = 0.0;
      transform(this, co);
      x3 = co[0], y3 = co[1];
      this._bezierCurveTo(x1, y1, x2, y2, x3, y3);
    }
    g.lineTo = function(x, y) {
      co.zero();
      co[0] = x;
      co[1] = y;
      transform(this, co);
      this._lineTo(co[0], co[1]);
    }
    g.rect = function(x, y, wid, hgt) {
      a.loadXYZ(x, y, 0);
      b.loadXYZ(x+wid, y+hgt, 0);
      transform(this, a);
      transform(this, b);
      var xmin=Math.min(a[0], b[0]), xmax=Math.max(a[0], b[0]);
      var ymin=Math.min(a[1], b[1]), ymax=Math.max(a[1], b[1]);
      this._rect(xmin, ymin, Math.abs(xmax-xmin), Math.abs(ymax-ymin));
    }
    g.clearRect = function(x, y, wid, hgt) {
      a.loadXYZ(x, y, 0);
      b.loadXYZ(x+wid, y+hgt, 0);
      transform(this, a);
      transform(this, b);
      var xmin=Math.min(a[0], b[0]), xmax=Math.max(a[0], b[0]);
      var ymin=Math.min(a[1], b[1]), ymax=Math.max(a[1], b[1]);
      this._clearRect(xmin, ymin, Math.abs(xmax-xmin), Math.abs(ymax-ymin));
    }
  }
  patch_canvas2d = _es6_module.add_export('patch_canvas2d', patch_canvas2d);
  function set_rendermat(g, mat) {
    if (g._is_patched==undefined) {
        patch_canvas2d(g);
    }
    g._render_mat = mat;
    if (g._irender_mat===undefined) {
        g._irender_mat = new Matrix4(mat);
    }
    g._irender_mat.load(mat);
    g._irender_mat.invert();
  }
  set_rendermat = _es6_module.add_export('set_rendermat', set_rendermat);
  var $margin_7HFl_redraw_element=new Vector3([15, 15, 15]);
  var $aabb_Rtfz_redraw_element=[new Vector3(), new Vector3()];
  function redraw_element(e, view2d) {
    e.flag|=SplineFlags.REDRAW;
    $margin_7HFl_redraw_element[0] = $margin_7HFl_redraw_element[1] = $margin_7HFl_redraw_element[2] = 15.0;
    if (view2d!=undefined)
      $margin_7HFl_redraw_element.mulScalar(1.0/view2d.zoom);
    var e_aabb=e.aabb;
    $aabb_Rtfz_redraw_element[0].load(e_aabb[0]), $aabb_Rtfz_redraw_element[1].load(e_aabb[1]);
    $aabb_Rtfz_redraw_element[0].sub($margin_7HFl_redraw_element), $aabb_Rtfz_redraw_element[1].add($margin_7HFl_redraw_element);
    window.redraw_viewport($aabb_Rtfz_redraw_element[0], $aabb_Rtfz_redraw_element[1]);
  }
  redraw_element = _es6_module.add_export('redraw_element', redraw_element);
});
es6_module_define('spline', ["selectmode", "spline_element_array", "toolops_api", "view2d_editor", "spline_draw", "spline_query", "solver", "const", "solver_new", "eventdag", "config", "spline_math", "spline_types", "struct", "spline_multires", "lib_api"], function _spline_module(_es6_module) {
  "use strict";
  var PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var spline_multires=es6_import(_es6_module, 'spline_multires');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var DataBlock=es6_import_item(_es6_module, 'lib_api', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, 'lib_api', 'DataTypes');
  var SessionFlags=es6_import_item(_es6_module, 'view2d_editor', 'SessionFlags');
  var SelMask=es6_import_item(_es6_module, 'selectmode', 'SelMask');
  var SplineQuery=es6_import_item(_es6_module, 'spline_query', 'SplineQuery');
  var draw_spline=es6_import_item(_es6_module, 'spline_draw', 'draw_spline');
  var patch_canvas2d=es6_import_item(_es6_module, 'spline_draw', 'patch_canvas2d');
  var set_rendermat=es6_import_item(_es6_module, 'spline_draw', 'set_rendermat');
  var solve=es6_import_item(_es6_module, 'solver_new', 'solve');
  var ModalStates=es6_import_item(_es6_module, 'toolops_api', 'ModalStates');
  var DataPathNode=es6_import_item(_es6_module, 'eventdag', 'DataPathNode');
  var config=es6_import(_es6_module, 'config');
  var atan2=Math.atan2;
  var FEPS=1e-18;
  var PI=Math.PI;
  var sin=Math.sin, acos=Math.acos, asin=Math.asin, atan2=Math.atan2, sqrt=Math.sqrt;
  var cos=Math.cos, pow=Math.pow, abs=Math.abs;
  var SPI2=Math.sqrt(PI/2);
  var _SOLVING=false;
  _SOLVING = _es6_module.add_export('_SOLVING', _SOLVING);
  var INCREMENTAL=1;
  INCREMENTAL = _es6_module.add_export('INCREMENTAL', INCREMENTAL);
  var ORDER=es6_import_item(_es6_module, 'spline_math', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, 'spline_math', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, 'spline_math', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, 'spline_math', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, 'spline_math', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, 'spline_math', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, 'spline_math', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, 'spline_math', 'INT_STEPS');
  var solver=es6_import_item(_es6_module, 'solver', 'solver');
  var constraint=es6_import_item(_es6_module, 'solver', 'constraint');
  es6_import(_es6_module, 'const');
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var SplineElement=es6_import_item(_es6_module, 'spline_types', 'SplineElement');
  var SplineVertex=es6_import_item(_es6_module, 'spline_types', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, 'spline_types', 'SplineSegment');
  var SplineLoop=es6_import_item(_es6_module, 'spline_types', 'SplineLoop');
  var SplineLoopPath=es6_import_item(_es6_module, 'spline_types', 'SplineLoopPath');
  var SplineFace=es6_import_item(_es6_module, 'spline_types', 'SplineFace');
  var ElementArraySet=es6_import_item(_es6_module, 'spline_element_array', 'ElementArraySet');
  var ElementArray=es6_import_item(_es6_module, 'spline_element_array', 'ElementArray');
  var SplineLayer=es6_import_item(_es6_module, 'spline_element_array', 'SplineLayer');
  var SplineLayerSet=es6_import_item(_es6_module, 'spline_element_array', 'SplineLayerSet');
  var rect_tmp=[new Vector2(), new Vector2()];
  var eval_curve=es6_import_item(_es6_module, 'spline_math', 'eval_curve');
  var do_solve=es6_import_item(_es6_module, 'spline_math', 'do_solve');
  var RestrictFlags={NO_EXTRUDE: 1, NO_DELETE: 2, NO_CONNECT: 4, NO_DISSOLVE: 8, NO_SPLIT_EDGE: 16, VALENCE2: 32, NO_CREATE: 64|1|4|16}
  RestrictFlags = _es6_module.add_export('RestrictFlags', RestrictFlags);
  function dom_bind(obj, name, dom_id) {
    Object.defineProperty(obj, name, {get: function() {
      var check=document.getElementById(dom_id);
      return check.checked;
    }, set: function(val) {
      var check=document.getElementById(dom_id);
      check.checked = !!val;
    }});
  }
  var split_edge_rets=new cachering(function() {
    return [0, 0, 0];
  }, 64);
  var _elist_map={"verts": SplineTypes.VERTEX, "handles": SplineTypes.HANDLE, "segments": SplineTypes.SEGMENT, "faces": SplineTypes.FACE}
  var AllPointsIter=_ESClass("AllPointsIter", [function AllPointsIter(spline) {
    this.spline = spline;
    this.stage = 0;
    this.iter = spline.verts[Symbol.iterator]();
    this.ret = {done: false, value: undefined}
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this;
  }), function next() {
    var ret=this.iter.next();
    this.ret.done = ret.done;
    this.ret.value = ret.value;
    if (ret.done&&this.stage==0) {
        this.stage = 1;
        this.iter = this.spline.handles[Symbol.iterator]();
        return this.next();
    }
    return this.ret;
  }]);
  _es6_module.add_class(AllPointsIter);
  AllPointsIter = _es6_module.add_export('AllPointsIter', AllPointsIter);
  var RecalcFlags=es6_import_item(_es6_module, 'spline_types', 'RecalcFlags');
  var $debug_id_gen_8m8A_Spline;
  var $_internal_idgen_O4_S_Spline;
  var $ws_0yfY_split_edge;
  var $lastco_ZNsh_trace_face;
  var $srcs_cNIi_split_edge;
  var Spline=_ESClass("Spline", DataBlock, [function Spline(name) {
    if (name==undefined) {
        name = undefined;
    }
    DataBlock.call(this, DataTypes.SPLINE, name);
    this._debug_id = $debug_id_gen_8m8A_Spline++;
    this._pending_solve = undefined;
    this._resolve_after = undefined;
    this.solving = undefined;
    this.actlevel = 0;
    var mformat=spline_multires._format;
    this.mres_format = new Array(mformat.length);
    for (var i=0; i<mformat.length; i++) {
        this.mres_format[i] = mformat[i];
    }
    this._internal_id = $_internal_idgen_O4_S_Spline++;
    this.drawlist = [];
    this.recalc = RecalcFlags.DRAWSORT;
    this.size = [0, 0];
    this.restrict = 0;
    this.canvas = undefined;
    this.query = this.q = new SplineQuery(this);
    this.frame = 0;
    this.rendermat = new Matrix4();
    this.last_sim_ms = time_ms();
    this.segments = [];
    this.handles = [];
    this._idgen = new SDIDGen();
    this.last_save_time = time_ms();
    this.proportional = false;
    this.prop_radius = 100;
    this.eidmap = {}
    this.elist_map = {}
    this.elists = [];
    this.selectmode = 1;
    this.layerset = new SplineLayerSet();
    this.layerset.new_layer();
    this.selected = new ElementArraySet();
    this.selected.layerset = this.layerset;
    this.draw_verts = true;
    this.draw_normals = true;
    this.init_elists();
  }, function dag_get_datapath() {
    if (this.is_anim_path||(this.verts.cdata.layers.length>0&&this.verts.cdata.layers[0].name=="TimeDataLayer"))
      return "frameset.pathspline";
    else 
      return "frameset.drawspline";
  }, function force_full_resolve() {
    this.resolve = 1;
    var __iter_seg=__get_iter(this.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      seg.flag|=SplineFlags.UPDATE;
    }
    var __iter_v=__get_iter(this.verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      v.flag|=SplineFlags.UPDATE;
    }
    var __iter_h=__get_iter(this.handles);
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
      h.flag|=SplineFlags.UPDATE;
    }
  }, function regen_sort() {
    this.recalc|=RecalcFlags.DRAWSORT;
  }, function regen_solve() {
    this.resolve = 1;
    this.recalc|=RecalcFlags.SOLVE;
  }, function regen_render() {
    this.resolve = 1;
    this.recalc|=RecalcFlags.ALL;
  }, function init_elists() {
    this.elist_map = {}
    this.elists = [];
    for (var k in _elist_map) {
        var type=_elist_map[k];
        var list=new ElementArray(type, this.idgen, this.eidmap, this.selected, this.layerset, this);
        this[k] = list;
        this.elist_map[type] = list;
        this.elists.push(list);
    }
    this.init_sel_handlers();
  }, function init_sel_handlers() {
    var this2=this;
    this.verts.on_select = function(v, state) {
      for (var i=0; i<v.segments.length; i++) {
          var seg=v.segments[i];
          this2.handles.setselect(seg.handle(v), state);
      }
    }
  }, _ESClass.get(function idgen() {
    return this._idgen;
  }), _ESClass.set(function idgen(idgen) {
    this._idgen = idgen;
    if (this.elists==undefined) {
        return ;
    }
    for (var i=0; i<this.elists.length; i++) {
        this.elists[i].idgen = idgen;
    }
  }), function copy() {
    var ret=new Spline();
    ret.idgen = this.idgen.copy();
    for (var i=0; i<ret.elists.length; i++) {
        ret.elists[i].idgen = ret.idgen;
        ret.elists[i].cdata.load_layout(this.elists[i].cdata);
    }
    var eidmap=ret.eidmap;
    for (var si=0; si<2; si++) {
        var list1=si ? this.handles : this.verts;
        var list2=si ? ret.handles : ret.verts;
        for (var i=0; i<list1.length; i++) {
            var v=list1[i];
            var v2=new SplineVertex(v);
            if (si==1) {
                v2.type = SplineTypes.HANDLE;
            }
            v2.flag = v.flag;
            v2.eid = v.eid;
            list2.push(v2);
            if (si==1) {
                ret.copy_handle_data(v2, v);
                v2.load(v);
            }
            else {
              ret.copy_vert_data(v2, v);
              v2.load(v);
            }
            eidmap[v2.eid] = v2;
            if (v==list1.active)
              list2.active = v2;
        }
    }
    for (var i=0; i<this.segments.length; i++) {
        var s=this.segments[i];
        var s2=new SplineSegment();
        s2.eid = s.eid;
        s2.flag = s.flag;
        ret.segments.push(s2);
        eidmap[s2.eid] = s2;
        if (s==this.segments.active)
          ret.segments.active = s;
        s2.h1 = eidmap[s.h1.eid];
        s2.h2 = eidmap[s.h2.eid];
        s2.h1.segments.push(s2);
        s2.h2.segments.push(s2);
        s2.v1 = eidmap[s.v1.eid];
        s2.v2 = eidmap[s.v2.eid];
        s2.v1.segments.push(s2);
        s2.v2.segments.push(s2);
        for (var j=0; j<s.ks.length; j++) {
            s2.ks[j] = s.ks[j];
        }
        if (s.h1.hpair!=undefined)
          s2.h1.hpair = eidmap[s.h1.hpair.eid];
        if (s.h2.hpair!=undefined)
          s2.h2.hpair = eidmap[s.h2.hpair.eid];
        ret.copy_segment_data(s2, s);
    }
    for (var i=0; i<this.faces.length; i++) {
        var f=this.faces[i];
        var vlists=[];
        var __iter_list=__get_iter(f.paths);
        var list;
        while (1) {
          var __ival_list=__iter_list.next();
          if (__ival_list.done) {
              break;
          }
          list = __ival_list.value;
          var verts=[];
          vlists.push(verts);
          var l=list.l;
          do {
            verts.push(eidmap[l.v.eid]);
            l = l.next;
          } while (l!=list.l);
          
        }
        var f2=ret.make_face(vlists, f.eid);
        ret.copy_face_data(f2, f);
        eidmap[f2.eid] = f2;
        if (f==this.faces.active)
          ret.faces.active = f2;
    }
    return ret;
  }, function copy_element_data(dst, src) {
    if (dst.flag&SplineFlags.SELECT) {
        this.setselect(dst, false);
    }
    dst.cdata.copy(src);
    dst.flag = src.flag;
    if (dst.flag&SplineFlags.SELECT) {
        dst.flag&=~SplineFlags.SELECT;
        this.setselect(dst, true);
    }
  }, function copy_vert_data(dst, src) {
    this.copy_element_data(dst, src);
  }, function copy_handle_data(dst, src) {
    this.copy_element_data(dst, src);
  }, function copy_segment_data(dst, src) {
    this.copy_element_data(dst, src);
    dst.z = src.z;
    dst.mat.load(src.mat);
  }, function copy_face_data(dst, src) {
    this.copy_element_data(dst, src);
    dst.z = src.z;
    dst.mat.load(src.mat);
  }, _ESClass.get(function points() {
    return new AllPointsIter(this);
  }), function make_vertex(co, eid) {
    if (eid==undefined) {
        eid = undefined;
    }
    var v=new SplineVertex(co);
    v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
    this.verts.push(v, eid);
    return v;
  }, function get_elist(type) {
    return this.elist_map[type];
  }, function make_handle(co, eid) {
    if (eid==undefined) {
        eid = undefined;
    }
    var h=new SplineVertex();
    h.flag|=SplineFlags.BREAK_TANGENTS;
    h.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
    h.type = SplineTypes.HANDLE;
    this.handles.push(h, eid);
    return h;
  }, function split_edge(seg) {
    var co=seg.evaluate(0.5);
    var hpair=seg.h2.hpair;
    if (hpair!=undefined) {
        this.disconnect_handle(seg.h2);
    }
    var nv=this.make_vertex(co);
    nv.flag|=seg.v1.flag&seg.v2.flag;
    if (nv.flag&SplineFlags.SELECT) {
        nv.flag&=~SplineFlags.SELECT;
        this.verts.setselect(nv, true);
    }
    var v1=seg.v1, v2=seg.v2;
    var nseg=this.make_segment(nv, seg.v2);
    seg.v2.segments.remove(seg);
    nv.segments.push(seg);
    seg.v2 = nv;
    if (seg.l!=undefined) {
        var start=seg.l;
        var l=seg.l;
        var i=0;
        var lst=[];
        do {
          lst.push(l);
          if (i++>100) {
              console.trace("Infinite loop error");
              break;
          }
          l = l.radial_next;
        } while (l!=seg.l);
        
        for (var j=0; j<lst.length; j++) {
            var l=lst[j];
            var newl=this.make_loop();
            newl.f = l.f, newl.p = l.p;
            if (l.v===v1) {
                newl.s = nseg;
                newl.v = nv;
                l.next.prev = newl;
                newl.next = l.next;
                l.next = newl;
                newl.prev = l;
            }
            else 
              if (1) {
                this._radial_loop_remove(l);
                newl.s = seg;
                newl.v = nv;
                l.s = nseg;
                l.next.prev = newl;
                newl.next = l.next;
                l.next = newl;
                newl.prev = l;
                this._radial_loop_insert(l);
            }
            this._radial_loop_insert(newl);
            l.p.totvert++;
        }
    }
    nv.flag|=SplineFlags.UPDATE;
    seg.v1.flag|=SplineFlags.UPDATE;
    nseg.v2.flag|=SplineFlags.UPDATE;
    var ret=split_edge_rets.next();
    ret[0] = nseg;
    ret[1] = nv;
    if (hpair!=undefined) {
        this.connect_handles(nseg.h2, hpair);
    }
    this.copy_segment_data(nseg, seg);
    $srcs_cNIi_split_edge[0] = v1.cdata, $srcs_cNIi_split_edge[1] = v2.cdata;
    this.copy_vert_data(nv, v1);
    nv.cdata.interp($srcs_cNIi_split_edge, $ws_0yfY_split_edge);
    this.resolve = 1;
    return ret;
  }, function find_segment(v1, v2) {
    for (var i=0; i<v1.segments.length; i++) {
        if (v1.segments[i].other_vert(v1)===v2)
          return v1.segments[i];
    }
    return undefined;
  }, function disconnect_handle(h1) {
    h1.hpair.hpair = undefined;
    h1.hpair = undefined;
  }, function connect_handles(h1, h2) {
    var s1=h1.segments[0], s2=h2.segments[0];
    if (s1.handle_vertex(h1)!=s2.handle_vertex(h2)) {
        console.trace("Invalid call to connect_handles");
        return ;
    }
    if (h1.hpair!=undefined)
      this.disconnect_handle(h1);
    if (h2.hpair!=undefined)
      this.disconnect_handle(h2);
    h1.hpair = h2;
    h2.hpair = h1;
  }, function export_ks() {
    var mmlen=8;
    var size=4/2+8/2+this.segments.length*ORDER;
    size+=this.segments.length*(4/2);
    size+=(8*Math.floor(this.segments.length/mmlen))/2;
    var ret=new Uint16Array(size);
    var view=new DataView(ret.buffer);
    var c=0, d=0;
    view.setInt32(c*2, 2);
    c+=4/2;
    var mink, maxk;
    for (var i=0; i<this.segments.length; i++) {
        var s=this.segments[i];
        if (d==0) {
            mink = 10000, maxk = -10000;
            for (var si=i; si<i+mmlen+1; si++) {
                if (si>=this.segments.length)
                  break;
                var s2=this.segments[si];
                for (var j=0; j<ORDER; j++) {
                    mink = Math.min(mink, s2.ks[j]);
                    maxk = Math.max(maxk, s2.ks[j]);
                }
            }
            view.setFloat32(c*2, mink);
            view.setFloat32(c*2+4, maxk);
            c+=8/2;
        }
        view.setInt32(c*2, s.eid);
        c+=4/2;
        for (var j=0; j<ORDER; j++) {
            var k=s.ks[j];
            k = (k-mink)/(maxk-mink);
            if (k<0.0) {
                console.log("EVIL!", k, mink, maxk);
            }
            k = Math.abs(Math.floor(k*((1<<16)-1)));
            ret[c++] = k;
        }
        d = (d+1)%mmlen;
    }
    var ret2=ret;
    return ret2;
  }, function import_ks(data) {
    data = new Uint16Array(data.buffer);
    var view=new DataView(data.buffer);
    var mmlen=8;
    var d=0, i=0;
    var datasize=view.getInt32(0);
    if (datasize!=2) {
        return undefined;
    }
    i+=4/2;
    while (i<data.length) {
      if (d==0) {
          var mink=view.getFloat32(i*2);
          var maxk=view.getFloat32(i*2+4);
          i+=8/2;
      }
      d = (d+1)%mmlen;
      if (i>=data.length) {
          console.log("SPLINE CACHE ERROR", i, data.length);
          break;
      }
      var eid=view.getInt32(i*2);
      i+=4/2;
      var s=this.eidmap[eid];
      if (s==undefined||!(__instance_of(s, SplineSegment))) {
          console.log("Could not find segment", data[i-1]);
          i+=ORDER;
          continue;
      }
      for (var j=0; j<ORDER; j++) {
          var k=data[i++]/((1<<16)-1);
          k = k*(maxk-mink)+mink;
          s.ks[j] = k;
      }
    }
    return data;
  }, function fix_spline() {
    this.verts.remove_undefineds();
    this.handles.remove_undefineds();
    this.segments.remove_undefineds();
    this.faces.remove_undefineds();
    for (var i=0; i<2; i++) {
        var list=i ? this.handles : this.verts;
        var __iter_v=__get_iter(list);
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          for (var j=0; j<v.segments.length; j++) {
              if (v.segments[j]==undefined) {
                  v.pop_i(j);
                  j--;
              }
          }
        }
    }
    var delsegments=new set();
    var __iter_v=__get_iter(this.verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      for (var i=0; i<v.segments.length; i++) {
          var s=v.segments[i];
          if (s.v1!==v&&s.v2!==v) {
              console.log("Corrupted segment! Deleting!");
              v.segments.remove(s, true);
              i--;
              delsegments.add(s);
          }
      }
    }
    var __iter_s=__get_iter(delsegments);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      this.kill_segment(s, true, true);
      continue;
      this.segments.remove(s, true);
      delete this.eidmap[s.eid];
      if (s.v1.indexOf(s)>=0)
        s.v1.segments.remove(s, true);
      if (s.v2.indexOf(s)>=0)
        s.v2.segments.remove(s, true);
      if (s.h1!=undefined&&s.h1.type==SplineTypes.HANDLE) {
          this.handles.remove(s.h1, true);
          delete this.eidmap[s.h1.eid];
      }
      if (s.h2!=undefined&&s.h2.type==SplineTypes.HANDLE) {
          this.handles.remove(s.h2, true);
          delete this.eidmap[s.h2.eid];
      }
      if (s.l!=undefined) {
          var l=s.l, c;
          var radial_next=l.radial_next;
          do {
            if (c++>100) {
                console.log("Infinite loop (in fix_splines)!");
                break;
            }
            this.kill_face(l.f);
            l = l.radial_next;
            if (l==undefined)
              break;
          } while (l!=s.l);
          
      }
    }
    var __iter_s=__get_iter(this.segments);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      if (s.v1.segments==undefined||s.v2.segments==undefined) {
          if (__instance_of(s.h1, SplineVertex))
            this.handles.remove(s.h1);
          if (__instance_of(s.h2, SplineVertex))
            this.handles.remove(s.h2);
          this.segments.remove(s);
          continue;
      }
      if (s.v1.segments.indexOf(s)<0) {
          s.v1.segments.push(s);
      }
      if (s.v2.segments.indexOf(s)<0) {
          s.v2.segments.push(s);
      }
      if (s.h1==undefined||s.h1.type!=SplineTypes.HANDLE) {
          console.log("Missing handle 1; adding. . .", s.eid, s);
          s.h1 = this.make_handle();
          s.h1.load(s.v1).interp(s.v2, 1.0/3.0);
      }
      if (s.h2==undefined||s.h2.type!=SplineTypes.HANDLE) {
          console.log("Missing handle 2; adding. . .", s.eid, s);
          s.h2 = this.make_handle();
          s.h2.load(s.v2).interp(s.v2, 2.0/3.0);
      }
      if (s.h1.segments[0]!=s)
        s.h1.segments = [s];
      if (s.h2.segments[0]!=s)
        s.h2.segments = [s];
    }
    var max_eid=0;
    for (var i=0; i<this.elists.length; i++) {
        var elist=this.elists[i];
        var __iter_e=__get_iter(elist);
        var e;
        while (1) {
          var __ival_e=__iter_e.next();
          if (__ival_e.done) {
              break;
          }
          e = __ival_e.value;
          max_eid = Math.max(e.eid, max_eid);
        }
    }
    var curid=!("cur_id" in this.idgen) ? "cur_eid" : "cur_id";
    if (max_eid>=this.idgen[curid]) {
        console.trace("IDGEN ERROR! DOOM! DOOM!");
        this.idgen[curid] = max_eid+1;
    }
  }, function select_flush(datamode) {
    if (datamode&(SplineTypes.VERTEX|SplineTypes.HANDLE)) {
        var fset=new set();
        var sset=new set();
        var fact=this.faces.active, sact=this.segments.active;
        var __iter_v=__get_iter(this.verts.selected);
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
            if (sset.has(s))
              continue;
            if (s.other_vert(v).flag&SplineFlags.SELECT) {
                sset.add(s);
                console.log("selecting segment");
            }
            var l=s.l;
            if (l==undefined)
              continue;
            var c=0;
            do {
              if (c++>1000) {
                  console.log("Infinite loop detected!");
                  break;
              }
              var f=l.f;
              if (f.flag&SplineFlags.SELECT) {
                  l = l.next;
                  continue;
              }
              var good=true;
              var __iter_path=__get_iter(f.paths);
              var path;
              while (1) {
                var __ival_path=__iter_path.next();
                if (__ival_path.done) {
                    break;
                }
                path = __ival_path.value;
                var __iter_l2=__get_iter(path);
                var l2;
                while (1) {
                  var __ival_l2=__iter_l2.next();
                  if (__ival_l2.done) {
                      break;
                  }
                  l2 = __ival_l2.value;
                  if (!(l2.v.flag&SplineFlags.SELECT)) {
                      good = false;
                      break;
                  }
                }
                if (!good)
                  break;
              }
              if (good) {
                  console.log("selecting face");
                  fset.add(f);
              }
              l = l.next;
            } while (l!=s.l);
            
          }
        }
        this.segments.clear_selection();
        this.faces.clear_selection();
        if (sact==undefined||!sset.has(sact)) {
            var __iter_s=__get_iter(sset);
            var s;
            while (1) {
              var __ival_s=__iter_s.next();
              if (__ival_s.done) {
                  break;
              }
              s = __ival_s.value;
              sact = s;
              break;
            }
        }
        if (fact==undefined||!fset.has(fact)) {
            var __iter_f=__get_iter(fset);
            var f;
            while (1) {
              var __ival_f=__iter_f.next();
              if (__ival_f.done) {
                  break;
              }
              f = __ival_f.value;
              fact = f;
              break;
            }
        }
        this.segments.active = sact;
        this.faces.active = fact;
        var __iter_s=__get_iter(sset);
        var s;
        while (1) {
          var __ival_s=__iter_s.next();
          if (__ival_s.done) {
              break;
          }
          s = __ival_s.value;
          this.segments.setselect(s, true);
        }
        var __iter_f=__get_iter(fset);
        var f;
        while (1) {
          var __ival_f=__iter_f.next();
          if (__ival_f.done) {
              break;
          }
          f = __ival_f.value;
          this.faces.setselect(f, true);
        }
    }
    else 
      if (datamode==SplineTypes.SEGMENT) {
        this.verts.clear_selection();
        this.faces.clear_selection();
        var __iter_s=__get_iter(this.segments.selected);
        var s;
        while (1) {
          var __ival_s=__iter_s.next();
          if (__ival_s.done) {
              break;
          }
          s = __ival_s.value;
          this.verts.setselect(s.v1, true);
          this.verts.setselect(s.v2, true);
          var l=s.l;
          if (l==undefined)
            continue;
          var c=0;
          do {
            if (c++>1000) {
                console.log("Infinite loop detected!");
                break;
            }
            var f=l.f;
            if (f.flag&SplineFlags.SELECT) {
                l = l.next;
                continue;
            }
            var good=true;
            var __iter_path=__get_iter(f.paths);
            var path;
            while (1) {
              var __ival_path=__iter_path.next();
              if (__ival_path.done) {
                  break;
              }
              path = __ival_path.value;
              var __iter_l2=__get_iter(path);
              var l2;
              while (1) {
                var __ival_l2=__iter_l2.next();
                if (__ival_l2.done) {
                    break;
                }
                l2 = __ival_l2.value;
                if (!(l2.s.flag&SplineFlags.SELECT)) {
                    good = false;
                    break;
                }
              }
              if (!good)
                break;
            }
            if (good) {
                console.log("selecting face");
                this.faces.setselect(f, true);
            }
            l = l.next;
          } while (l!=s.l);
          
        }
    }
    else 
      if (datamode==SplineTypes.FACE) {
        this.verts.clear_selection();
        this.segments.clear_selection();
        var __iter_f=__get_iter(this.faces.selected);
        var f;
        while (1) {
          var __ival_f=__iter_f.next();
          if (__ival_f.done) {
              break;
          }
          f = __ival_f.value;
          var __iter_path=__get_iter(f.paths);
          var path;
          while (1) {
            var __ival_path=__iter_path.next();
            if (__ival_path.done) {
                break;
            }
            path = __ival_path.value;
            var __iter_l=__get_iter(path);
            var l;
            while (1) {
              var __ival_l=__iter_l.next();
              if (__ival_l.done) {
                  break;
              }
              l = __ival_l.value;
              this.verts.setselect(l.v, true);
              this.segments.setselect(l.s, true);
            }
          }
        }
    }
  }, function make_segment(v1, v2, eid, check_existing) {
    if (eid==undefined) {
        eid = undefined;
    }
    if (check_existing==undefined) {
        check_existing = true;
    }
    if (eid==undefined)
      eid = this.idgen.gen_id();
    if (check_existing) {
        var seg=this.find_segment(v1, v2);
        if (seg!=undefined)
          return seg;
    }
    var seg=new SplineSegment(v1, v2);
    seg.h1 = this.make_handle();
    seg.h2 = this.make_handle();
    seg.h1.load(v1).interp(v2, 1.0/3.0);
    seg.h2.load(v1).interp(v2, 2.0/3.0);
    seg.h1.segments.push(seg);
    seg.h2.segments.push(seg);
    seg.v1.segments.push(seg);
    seg.v2.segments.push(seg);
    seg.v1.flag|=SplineFlags.UPDATE;
    seg.v2.flag|=SplineFlags.UPDATE;
    seg.h1.flag|=SplineFlags.UPDATE;
    seg.h2.flag|=SplineFlags.UPDATE;
    seg.flag|=SplineFlags.UPDATE;
    this.segments.push(seg, eid);
    return seg;
  }, function _radial_loop_insert(l) {
    if (l.s.l==undefined) {
        l.radial_next = l.radial_prev = l;
        l.s.l = l;
        return ;
    }
    l.radial_next = l.s.l;
    l.radial_prev = l.s.l.radial_prev;
    l.s.l.radial_prev.radial_next = l.s.l.radial_prev = l;
    l.s.l = l;
  }, function _radial_loop_remove(l) {
    l.radial_next.radial_prev = l.radial_prev;
    l.radial_prev.radial_next = l.radial_next;
    if (l===l.radial_next) {
        l.s.l = undefined;
    }
    else 
      if (l===l.s.l) {
        l.s.l = l.radial_next;
    }
  }, function make_face(vlists, custom_eid) {
    if (custom_eid==undefined) {
        custom_eid = undefined;
    }
    var f=new SplineFace();
    if (custom_eid==-1)
      custom_eid = undefined;
    this.faces.push(f);
    for (var i=0; i<vlists.length; i++) {
        var verts=vlists[i];
        if (verts.length<3) {
            throw new Error("Must have at least three vertices for face");
        }
        var vset={};
        for (var j=0; j<verts.length; j++) {
            if (verts[j].eid in vset) {
                console.log(vlists);
                throw new Error("Duplicate verts in make_face");
            }
            vset[verts[j].eid] = 1;
        }
    }
    for (var i=0; i<vlists.length; i++) {
        var verts=vlists[i];
        var list=new SplineLoopPath();
        list.f = f;
        list.totvert = verts.length;
        f.paths.push(list);
        var l=undefined, prevl=undefined;
        for (var j=0; j<verts.length; j++) {
            var v1=verts[j], v2=verts[(j+1)%verts.length];
            var s=this.make_segment(v1, v2, undefined, true);
            var l=this.make_loop();
            l.v = v1;
            l.s = s;
            l.f = f;
            l.p = list;
            if (prevl==undefined) {
                list.l = l;
            }
            else {
              l.prev = prevl;
              prevl.next = l;
            }
            prevl = l;
        }
        list.l.prev = prevl;
        prevl.next = list.l;
        var l=list.l;
        do {
          this._radial_loop_insert(l);
          l = l.next;
        } while (l!=list.l);
        
    }
    return f;
  }, function make_loop() {
    var l=new SplineLoop();
    l.eid = this.idgen.gen_id();
    this.eidmap[l.eid] = l;
    return l;
  }, function kill_loop(l) {
    delete this.eidmap[l.eid];
  }, function _element_kill(e) {
  }, function kill_face(f) {
    for (var i=0; i<f.paths.length; i++) {
        var path=f.paths[i];
        var __iter_l=__get_iter(path);
        var l;
        while (1) {
          var __ival_l=__iter_l.next();
          if (__ival_l.done) {
              break;
          }
          l = __ival_l.value;
          this._radial_loop_remove(l);
          this.kill_loop(l);
        }
    }
    this._element_kill(f);
    this.faces.remove(f);
  }, function kill_segment(seg, kill_faces, soft_error) {
    if (kill_faces==undefined) {
        kill_faces = true;
    }
    if (soft_error==undefined) {
        soft_error = false;
    }
    var i=0;
    while (kill_faces&&seg.l!=undefined) {
      this.kill_face(seg.l.f);
      if (i++>1000) {
          console.trace("Infinite loop in kill_segment!!", seg);
          break;
      }
    }
    if (seg.v1.segments!=undefined)
      seg.v1.segments.remove(seg, soft_error);
    if (seg.v2.segments!=undefined)
      seg.v2.segments.remove(seg, soft_error);
    this.handles.remove(seg.h1, soft_error);
    this.handles.remove(seg.h2, soft_error);
    this._element_kill(seg);
    this.segments.remove(seg, soft_error);
  }, function do_save() {
    var obj=this.toJSON();
    var buf=JSON.stringify(obj);
    var blob=new Blob([buf], {type: "application/json"});
    var obj_url=window.URL.createObjectURL(blob);
    window.open(obj_url);
  }, function dissolve_vertex(v) {
    var ls2=[];
    if (v.segments.length!=2)
      return ;
    for (var i=0; i<v.segments.length; i++) {
        var s=v.segments[i];
        if (s.l==undefined)
          continue;
        var lst=[];
        var l=s.l;
        do {
          lst.push(l);
          l = l.radial_next;
        } while (l!=s.l);
        
        for (var j=0; j<lst.length; j++) {
            var l=lst[j];
            if (l.v!==v&&l.next.v!==v)
              continue;
            console.log("vs", v.eid, "|", l.prev.v.eid, l.v.eid, l.next.v.eid);
            if (l.v!==v) {
                l = l.next;
            }
            console.log("vl", v.eid, l.v.eid);
            if (l===l.p.l)
              l.p.l = l.next;
            if (l.p.totvert<=3||l.p.l===l) {
                console.log("DESTROYING FACE!!", l.f.eid);
                this.kill_face(l.f);
                continue;
            }
            this._radial_loop_remove(l);
            ls2.push(l.prev);
            l.prev.next = l.next;
            l.next.prev = l.prev;
            this.kill_loop(l);
            l.p.totvert--;
        }
    }
    if (v.segments.length==2) {
        var s1=v.segments[0], s2=v.segments[1];
        var v1=s1.other_vert(v), v2=s2.other_vert(v);
        var existing=this.find_segment(v1, v2);
        if (s1.v1==v)
          s1.v1 = v2;
        else 
          s1.v2 = v2;
        var ci=0;
        while (s2.l!=undefined) {
          this._radial_loop_remove(s2.l);
          if (ci++>100) {
              console.log("Infinite loop error!");
              break;
          }
        }
        while (s1.l!=undefined) {
          this._radial_loop_remove(s1.l);
          if (ci++>100) {
              console.log("Infinite loop error!");
              break;
          }
        }
        this.kill_segment(s2);
        v2.segments.push(s1);
        v.segments.length = 0;
        if (existing) {
            this.kill_segment(s1);
            s1 = existing;
        }
        if (s1.l==undefined) {
            for (var i=0; i<ls2.length; i++) {
                var l=ls2[i];
                l.s = s1;
                this._radial_loop_insert(l);
                console.log(s1.v1.eid, s1.v2.eid, "|", l.prev.v.eid, l.v.eid, l.next.v.eid);
            }
        }
        v.flag|=SplineFlags.UPDATE;
        v2.flag|=SplineFlags.UPDATE;
    }
    this.kill_vertex(v);
    this.resolve = 1;
  }, function kill_vertex(v) {
    if (v.flag&SplineFlags.SELECT) {
        this.verts.setselect(v, false);
    }
    if (this.hpair!=undefined)
      this.disconnect_handle(this);
    while (v.segments.length>0) {
      var last=v.segments.length;
      this.kill_segment(v.segments[0]);
      if (last==v.segments.length) {
          console.log("EEK!");
          break;
      }
    }
    if (this.verts.active==v)
      this.verts.active = undefined;
    if (this.verts.highlight==v)
      this.verts.highlight = undefined;
    delete this.eidmap[v.eid];
    this._element_kill(v);
    this.verts.remove(v);
  }, function _vert_flag_update(v, depth, limit) {
    if (depth>=limit)
      return ;
    v.flag|=SplineFlags.TEMP_TAG;
    for (var i=0; i<v.segments.length; i++) {
        var s=v.segments[i], v2=s.other_vert(v);
        if (v2==undefined||v2.segments==undefined) {
            console.trace("ERROR 1: v, s, v2:", v, s, v2);
            continue;
        }
        var has_tan=v2.segments.length<=2;
        for (var j=0; j<v2.segments.length; j++) {
            var h=v2.segments[j].handle(v2);
            if ((v2.flag&SplineFlags.SELECT)&&h.hpair!=undefined) {
                has_tan = true;
            }
        }
        if (!has_tan) {
        }
        if (!(v2.flag&SplineFlags.TEMP_TAG)) {
            this._vert_flag_update(v2, depth+1, limit);
        }
    }
    for (var j=0; j<v.segments.length; j++) {
        var s=v.segments[j], v2=s.other_vert(v);
        if (v2.segments.length>2||(v2.flag&SplineFlags.BREAK_TANGENTS))
          v2.flag|=SplineFlags.TEMP_TAG;
    }
  }, function propagate_draw_flags(repeat) {
    if (repeat==undefined) {
        repeat = 2;
    }
    var __iter_seg=__get_iter(this.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      seg.flag&=~SplineFlags.TEMP_TAG;
    }
    var __iter_seg=__get_iter(this.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      if (!(seg.flag&SplineFlags.REDRAW_PRE))
        continue;
      for (var i=0; i<2; i++) {
          var v=i ? seg.v2 : seg.v1;
          for (var j=0; j<v.segments.length; j++) {
              var seg2=v.segments[j];
              seg2.flag|=SplineFlags.TEMP_TAG;
              var l=seg2.l;
              if (l==undefined)
                continue;
              var _i=0;
              do {
                if (_i++>1000) {
                    console.log("infinite loop!");
                    break;
                }
                l.f.flag|=SplineFlags.REDRAW_PRE;
                l = l.radial_next;
              } while (l!=seg2.l);
              
          }
      }
    }
    var __iter_seg=__get_iter(this.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      if (seg.flag&SplineFlags.TEMP_TAG) {
          seg.flag|=SplineFlags.REDRAW_PRE;
      }
    }
    if (repeat!=undefined&&repeat>0) {
        this.propagate_draw_flags(repeat-1);
    }
  }, function propagate_update_flags() {
    var verts=this.verts;
    for (var i=0; i<verts.length; i++) {
        var v=verts[i];
        v.flag&=~SplineFlags.TEMP_TAG;
    }
    var limit=5;
    for (var i=0; i<verts.length; i++) {
        var v=verts[i];
        if (v.flag&SplineFlags.UPDATE) {
            this._vert_flag_update(v, 0, limit);
        }
    }
    for (var i=0; i<verts.length; i++) {
        var v=verts[i];
        if (v.flag&SplineFlags.TEMP_TAG) {
            v.flag|=SplineFlags.UPDATE;
        }
    }
  }, function solve(steps, gk, force_queue) {
    if (force_queue==undefined) {
        force_queue = false;
    }
    var this2=this;
    var dag_trigger=function() {
      this2.dag_update("on_solve", true);
    }
    if (this._pending_solve!==undefined&&force_queue) {
        var this2=this;
        this._pending_solve = this._pending_solve.then(function() {
          this2.solve();
        });
        this.solving = true;
        return this._pending_solve;
    }
    else 
      if (this._pending_solve!==undefined) {
        var do_accept;
        var promise=new Promise(function(accept, reject) {
          do_accept = function() {
            accept();
          }
        });
        this._resolve_after = function() {
          do_accept();
        };
        return promise;
    }
    else {
      this._pending_solve = this.solve_intern(steps, gk);
      this.solving = true;
      return this._pending_solve;
    }
  }, function solve_intern(steps, gk) {
    var this2=this;
    var dag_trigger=function() {
      this2.dag_update("on_solve", true);
      the_global_dag.exec(g_app_state.screen.ctx);
    }
    var __iter_v=__get_iter(this.verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      if (v.flag&SplineFlags.UPDATE) {
          for (var i=0; i<v.segments.length; i++) {
              var seg=v.segments[i];
              seg.flag|=SplineFlags.REDRAW_PRE;
              var l=seg.l;
              if (!l)
                continue;
              var _i=0;
              do {
                if (_i++>5000) {
                    console.log("infinite loop!");
                    break;
                }
                l.f.flag|=SplineFlags.REDRAW_PRE;
                l = l.radial_next;
              } while (l!=seg.l);
              
          }
      }
    }
    this.propagate_draw_flags();
    var this2=this;
    if (config.USE_NACL&&window.common!=undefined&&window.common.naclModule!=undefined) {
        var ret=do_solve(SplineFlags, this, steps, gk, true);
        ret.then(function() {
          this2._pending_solve = undefined;
          this2.solving = false;
          this2._do_post_solve();
          dag_trigger();
          if (this2._resolve_after) {
              var cb=this2._resolve_after;
              this2._resolve_after = undefined;
              this2._pending_solve = this2.solve_intern().then(function() {
                cb.call(this2);
              });
              this2.solving = true;
          }
        });
        return ret;
    }
    else {
      var do_accept;
      var promise=new Promise(function(accept, reject) {
        do_accept = function() {
          accept();
        }
      });
      var this2=this;
      var timer=window.setInterval(function() {
        window.clearInterval(timer);
        do_solve(SplineFlags, this2, steps, gk);
        this2._pending_solve = undefined;
        this2.solving = false;
        do_accept();
        this2._do_post_solve();
        dag_trigger();
        if (this2._resolve_after) {
            var cb=this2._resolve_after;
            this2._resolve_after = undefined;
            this2._pending_solve = this2.solve_intern().then(function() {
              cb.call(this2);
            });
            this2.solving = true;
        }
      }, 10);
      return promise;
    }
  }, function _do_post_solve() {
    var __iter_seg=__get_iter(this.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      if (seg.flag&SplineFlags.REDRAW_PRE) {
          seg.flag&=~SplineFlags.REDRAW_PRE;
          seg.flag|=SplineFlags.REDRAW;
      }
    }
    var __iter_f=__get_iter(this.faces);
    var f;
    while (1) {
      var __ival_f=__iter_f.next();
      if (__ival_f.done) {
          break;
      }
      f = __ival_f.value;
      if (f.flag&SplineFlags.REDRAW_PRE) {
          f.flag&=~SplineFlags.REDRAW_PRE;
          f.flag|=SplineFlags.REDRAW;
      }
    }
    var __iter_seg=__get_iter(this.segments);
    var seg;
    while (1) {
      var __ival_seg=__iter_seg.next();
      if (__ival_seg.done) {
          break;
      }
      seg = __ival_seg.value;
      seg.post_solve();
    }
  }, function solve_p(steps, gk) {
    console.trace("solve_p: DEPRECATED");
    return this.solve(steps, gk);
  }, function trace_face(g, f) {
    g.beginPath();
    $lastco_ZNsh_trace_face.zero();
    var __iter_path=__get_iter(f.paths);
    var path;
    while (1) {
      var __ival_path=__iter_path.next();
      if (__ival_path.done) {
          break;
      }
      path = __ival_path.value;
      var first=true;
      var __iter_l=__get_iter(path);
      var l;
      while (1) {
        var __ival_l=__iter_l.next();
        if (__ival_l.done) {
            break;
        }
        l = __ival_l.value;
        var seg=l.s;
        var flip=seg.v1!==l.v;
        var s=flip ? seg.ks[KSCALE] : 0, ds=flip ? -2 : 2;
        while ((!flip&&s<seg.ks[KSCALE])||(flip&&s>=0)) {
          var co=seg.evaluate(s/seg.length);
          if (first) {
              first = false;
              g.moveTo(co[0], co[1]);
          }
          else {
            g.lineTo(co[0], co[1]);
          }
          s+=ds;
        }
      }
    }
    g.closePath();
  }, function forEachPoint(cb, thisvar, immuate) {
    for (var si=0; si<2; si++) {
        var list=si ? this.handles : this.verts;
        var last_len=list.length;
        for (var i=0; i<list.length; i++) {
            if (thisvar!=undefined)
              cb.call(thisvar, list[i]);
            else 
              cb(list[i]);
            last_len = list.length;
        }
    }
  }, function build_shash() {
    var sh={}
    var cellsize=150;
    sh.cellsize = cellsize;
    function hash(x, y, cellsize) {
      return Math.floor(x/cellsize)+","+Math.floor(y/cellsize);
    }
    for (var si=0; si<2; si++) {
        var list=si ? this.handles : this.verts;
        var __iter_v=__get_iter(list);
        var v;
        while (1) {
          var __ival_v=__iter_v.next();
          if (__ival_v.done) {
              break;
          }
          v = __ival_v.value;
          var h=hash(v[0], v[1], cellsize);
          if (!(h in sh)) {
              sh[h] = [];
          }
          sh[h].push(v);
        }
    }
    var sqrt2=sqrt(2);
    sh.forEachPoint = function sh_lookupPoints(co, radius, callback, thisvar) {
      var cellsize=this.cellsize;
      var cellradius=Math.ceil(sqrt2*radius/cellsize);
      var sx=Math.floor(co[0]/cellsize)-cellradius;
      var sy=Math.floor(co[1]/cellsize)-cellradius;
      var ex=Math.ceil(co[0]/cellsize)+cellradius;
      var ey=Math.ceil(co[1]/cellsize)+cellradius;
      for (var x=sx; x<=ex; x++) {
          for (var y=sy; y<=ey; y++) {
              var h=hash(x*cellsize, y*cellsize, cellsize);
              if (!(h in this))
                continue;
              var list=this[h];
              for (var i=0; i<list.length; i++) {
                  var e=list[i];
                  var dis=e.vectorDistance(co);
                  if (dis<radius&&co!==e) {
                      callback.call(thisvar, e, dis);
                  }
              }
          }
      }
    }
    return sh;
  }, function unhide_all() {
    for (var i=0; i<this.verts.length; i++) {
        var v=this.verts[i];
        if (v.flag&SplineFlags.HIDE) {
            v.flag&=~SplineFlags.HIDE;
            v.flag|=SplineFlags.SELECT;
        }
    }
  }, function duplicate_verts() {
    var newvs=[];
    var idmap={}
    for (var i=0; i<this.verts.length; i++) {
        var v=this.verts[i];
        if (!(v.flag&SplineFlags.SELECT))
          continue;
        if (v.hidden)
          continue;
        var nv=this.make_vertex(v);
        idmap[v.eid] = nv;
        idmap[nv.eid] = v;
        nv.flag = v.flag&~SplineFlags.SELECT;
        newvs.push(nv);
    }
    for (var i=0; i<this.segments.length; i++) {
        var seg=this.segments[i];
        if ((seg.v1.flag&SplineFlags.SELECT)&&(seg.v2.flag&SplineFlags.SELECT)) {
            var v1=idmap[seg.v1.eid], v2=idmap[seg.v2.eid];
            if (v1==undefined||v2==undefined||v1==v2)
              continue;
            this.make_segment(v1, v2);
        }
    }
    for (var i=0; i<this.verts.length; i++) {
        var v=this.verts[i];
        this.verts.setselect(v, false);
    }
    for (var i=0; i<newvs.length; i++) {
        this.verts.setselect(newvs[i], true);
    }
    this.start_mpos[0] = this.mpos[0];
    this.start_mpos[1] = this.mpos[1];
    this.start_transform();
    this.resolve = 1;
  }, function clear_highlight() {
    for (var i=0; i<this.elists.length; i++) {
        this.elists[i].highlight = undefined;
    }
  }, function validate_active() {
    for (var i=0; i<this.elists.length; i++) {
        var elist=this.elists[i];
        if (elist.active!=undefined&&elist.active.hidden)
          elist.active = undefined;
    }
  }, function clear_active(e) {
    this.set_active(undefined);
  }, function set_active(e) {
    if (e==undefined) {
        for (var i=0; i<this.elists.length; i++) {
            this.elists[i].active = undefined;
        }
        return ;
    }
    var elist=this.get_elist(e.type);
    elist.active = e;
  }, function setselect(e, state) {
    var elist=this.get_elist(e.type);
    elist.setselect(e, state);
  }, function clear_selection(e) {
    for (var i=0; i<this.elists.length; i++) {
        this.elists[i].clear_selection();
    }
  }, function do_mirror() {
    this.start_transform('s');
    for (var i=0; i<this.transdata.length; i++) {
        var start=this.transdata[i][0], v=this.transdata[i][1];
        if (v.flag&SplineFlags.HIDE)
          continue;
        v.sub(this.trans_cent);
        v[0] = -v[0];
        v.add(this.trans_cent);
    }
    this.end_transform();
    this.resolve = 1;
  }, function toJSON(self) {
    var ret={}
    ret.frame = this.frame;
    ret.verts = {length: this.verts.length}
    ret.segments = [];
    ret.handles = [];
    ret.draw_verts = this.draw_verts;
    ret.draw_normals = this.draw_normals;
    ret._cur_id = this.idgen.cur_id;
    for (var i=0; i<this.verts.length; i++) {
        ret.verts[i] = this.verts[i].toJSON();
    }
    if (this.verts.active!=undefined)
      ret.verts.active = this.verts.active.eid;
    else 
      ret.verts.active = undefined;
    if (this.handles.active!=undefined)
      ret.handles.active = this.handles.active.eid;
    if (this.segments.active!=undefined)
      ret.segments.active = this.segments.active.eid;
    for (var i=0; i<this.segments.length; i++) {
        ret.segments.push(this.segments[i].toJSON());
    }
    for (var i=0; i<this.handles.length; i++) {
        ret.handles.push(this.handles[i].toJSON());
    }
    return ret;
  }, function reset() {
    this.idgen = new SDIDGen();
    this.init_elists();
  }, function import_json(obj) {
    var spline2=Spline.fromJSON(obj);
    var miny=1e+18, maxy=1e-18;
    var newmap={}
    for (var i=0; i<spline2.verts.length; i++) {
        var v=spline2.verts[i];
        var nv=this.make_vertex(v, v.eid);
        nv.flag = v.flag;
        nv.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
        miny = Math.min(miny, nv[1]);
        maxy = Math.max(maxy, nv[1]);
        newmap[v.eid] = nv;
    }
    for (var i=0; i<spline2.verts.length; i++) {
        var v=spline2.verts[i], nv=newmap[v.eid];
        nv[1] = ((maxy-miny)-(nv[1]-miny))+miny;
    }
    for (var i=0; i<spline2.segments.length; i++) {
        var seg=spline2.segments[i];
        var v1=newmap[seg.v1.eid], v2=newmap[seg.v2.eid];
        var nseg=this.make_segment(v1, v2);
        nseg.flag = seg.flag|SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
        newmap[seg.eid] = nseg;
    }
    this.resolve = 1;
  }, _ESClass.static(function fromJSON(obj) {
    var spline=new Spline();
    spline.idgen.cur_id = obj._cur_id;
    spline.draw_verts = obj.draw_verts;
    spline.draw_normals = obj.draw_normals;
    var eidmap={}
    for (var i=0; i<obj.verts.length; i++) {
        var cv=obj.verts[i];
        var v=spline.make_vertex(cv);
        v.flag|=SplineFlags.FRAME_DIRTY;
        v.flag = cv.flag;
        v.eid = cv.eid;
        v.segments = cv.segments;
        eidmap[v.eid] = v;
    }
    for (var i=0; i<obj.handles.length; i++) {
        var cv=obj.handles[i];
        var v=spline.make_handle(cv);
        v.flag = cv.flag;
        v.eid = cv.eid;
        v.segments = cv.segments;
        eidmap[v.eid] = v;
    }
    for (var i=0; i<obj.segments.length; i++) {
        var s=obj.segments[i];
        var segments=obj.segments;
        var v1=eidmap[s.v1], v2=eidmap[s.v2];
        var h1=eidmap[s.h1], h2=eidmap[s.h2];
        var seg=new SplineSegment();
        seg.eid = s.eid;
        seg.flag = s.flag;
        if (seg.ks.length==s.ks.length) {
            seg.ks = s.ks;
        }
        else {
          spline.resolve = true;
          for (var j=0; j<spline.verts.length; j++) {
              spline.verts[j].flag|=SplineFlags.UPDATE;
          }
        }
        for (var j=0; j<seg.ks.length; j++) {
            if (isNaN(seg.ks[j])) {
                seg.ks[j] = 0.0;
            }
        }
        seg.v1 = v1, seg.v2 = v2, seg.h1 = h1, seg.h2 = h2;
        spline.segments.push(seg);
        eidmap[seg.eid] = seg;
    }
    for (var i=0; i<obj.verts.length; i++) {
        var v=obj.verts[i];
        for (var j=0; j<v.segments.length; j++) {
            v.segments[j] = eidmap[v.segments[j]];
        }
    }
    for (var i=0; i<obj.handles.length; i++) {
        var v=obj.handles[i];
        for (var j=0; j<v.segments.length; j++) {
            v.segments[j] = eidmap[v.segments[j]];
        }
    }
    if (obj.verts.active!=undefined)
      spline.verts.active = eidmap[obj.verts.active];
    if (obj.handles.active!=undefined)
      spline.handles.active = eidmap[obj.handles.active];
    if (obj.segments.active!=undefined)
      spline.segments.active = eidmap[obj.segments.active];
    spline.eidmap = eidmap;
    return spline;
  }), function prune_singles() {
    var del=[];
    for (var i=0; i<this.verts.length; i++) {
        var v=this.verts[i];
        if (v.segments.length==0) {
            del.push(v);
        }
    }
    for (var i=0; i<del.length; i++) {
        this.kill_vertex(del[i]);
    }
  }, function draw(redraw_rects, g, editor, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime, ignore_layers) {
    this.canvas = g;
    this.selectmode = selectmode;
    if (g._is_patched==undefined) {
        patch_canvas2d(g);
    }
    g._is_patched = this;
    g.lineWidth = 1;
    if (this.resolve) {
        this.solve().then(function() {
          for (var i=0; i<redraw_rects.length; i++) {
              var rr=redraw_rects[i];
              window.redraw_viewport(rr[0], rr[1]);
          }
        });
    }
    draw_spline(this, redraw_rects, g, editor, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime, ignore_layers);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=STRUCT.chain_fromSTRUCT(Spline, reader);
    ret.afterSTRUCT();
    ret.query = ret.q = new SplineQuery(ret);
    var eidmap={}
    ret.elists = [];
    ret.elist_map = {}
    for (var k in _elist_map) {
        var type=_elist_map[k];
        var v=ret[k];
        if (v==undefined)
          continue;
        ret.elists.push(v);
        ret.elist_map[type] = v;
    }
    ret.init_sel_handlers();
    for (var si=0; si<2; si++) {
        var list=si ? ret.handles : ret.verts;
        for (var i=0; i<list.length; i++) {
            var v=list[i];
            eidmap[v.eid] = v;
            if (v.type==SplineTypes.VERTEX)
              v.hpair = undefined;
        }
    }
    var __iter_h=__get_iter(ret.handles);
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
      h.hpair = eidmap[h.hpair];
    }
    for (var i=0; i<ret.segments.length; i++) {
        var s=ret.segments[i];
        s.v1 = eidmap[s.v1];
        s.v2 = eidmap[s.v2];
        s.h1 = eidmap[s.h1];
        s.h2 = eidmap[s.h2];
        eidmap[s.eid] = s;
    }
    for (var si=0; si<2; si++) {
        var list=si ? ret.handles : ret.verts;
        for (var i=0; i<list.length; i++) {
            var v=list[i];
            for (var j=0; j<v.segments.length; j++) {
                v.segments[j] = eidmap[v.segments[j]];
            }
        }
    }
    for (var i=0; i<ret.faces.length; i++) {
        var f=ret.faces[i];
        f.flag|=SplineFlags.UPDATE_AABB;
        eidmap[f.eid] = f;
        var __iter_path=__get_iter(f.paths);
        var path;
        while (1) {
          var __ival_path=__iter_path.next();
          if (__ival_path.done) {
              break;
          }
          path = __ival_path.value;
          path.f = f;
          var l=path.l;
          do {
            eidmap[l.eid] = l;
            l.f = f;
            l.s = eidmap[l.s];
            l.v = eidmap[l.v];
            l = l.next;
          } while (l!=path.l);
          
        }
    }
    for (var i=0; i<ret.faces.length; i++) {
        var f=ret.faces[i];
        var __iter_path=__get_iter(f.paths);
        var path;
        while (1) {
          var __ival_path=__iter_path.next();
          if (__ival_path.done) {
              break;
          }
          path = __ival_path.value;
          var l=path.l;
          do {
            l.radial_next = eidmap[l.radial_next];
            l.radial_prev = eidmap[l.radial_prev];
            l = l.next;
          } while (l!=path.l);
          
        }
    }
    for (var i=0; i<ret.segments.length; i++) {
        var s=ret.segments[i];
        s.l = eidmap[s.l];
    }
    ret.eidmap = eidmap;
    var selected=new ElementArraySet();
    selected.layerset = ret.layerset;
    for (var i=0; i<ret.selected.length; i++) {
        var eid=ret.selected[i];
        if (!(eid in eidmap)) {
            console.log("WARNING! eid", eid, "not in eidmap!", Object.keys(eidmap));
            continue;
        }
        selected.add(eidmap[ret.selected[i]]);
    }
    ret.selected = selected;
    ret.verts.afterSTRUCT(SplineTypes.VERTEX, ret.idgen, ret.eidmap, ret.selected, ret.layerset, ret);
    ret.handles.afterSTRUCT(SplineTypes.HANDLE, ret.idgen, ret.eidmap, ret.selected, ret.layerset, ret);
    ret.segments.afterSTRUCT(SplineTypes.SEGMENT, ret.idgen, ret.eidmap, ret.selected, ret.layerset, ret);
    ret.faces.afterSTRUCT(SplineTypes.FACE, ret.idgen, ret.eidmap, ret.selected, ret.layerset, ret);
    if (ret.layerset==undefined) {
        ret.layerset = new SplineLayerSet();
        ret.layerset.new_layer();
    }
    else {
      ret.layerset.afterSTRUCT(ret);
    }
    ret.regen_sort();
    if (spline_multires.has_multires(ret)&&ret.mres_format!=undefined) {
        console.log("Converting old multires layout. . .");
        var __iter_seg=__get_iter(ret.segments);
        var seg;
        while (1) {
          var __ival_seg=__iter_seg.next();
          if (__ival_seg.done) {
              break;
          }
          seg = __ival_seg.value;
          var mr=seg.cdata.get_layer(spline_multires.MultiResLayer);
          mr._convert(ret.mres_format, spline_multires._format);
        }
    }
    var arr=[];
    for (var i=0; i<spline_multires._format.length; i++) {
        arr.push(spline_multires._format[i]);
    }
    ret.mres_format = arr;
    return ret;
  })]);
  var $debug_id_gen_8m8A_Spline=0;
  var $_internal_idgen_O4_S_Spline=0;
  var $ws_0yfY_split_edge=[0.5, 0.5];
  var $lastco_ZNsh_trace_face=new Vector3();
  var $srcs_cNIi_split_edge=[0, 0];
  _es6_module.add_class(Spline);
  Spline = _es6_module.add_export('Spline', Spline);
  
  mixin(Spline, DataPathNode);
  Spline.STRUCT = STRUCT.inherit(Spline, DataBlock)+"\n    idgen    : SDIDGen;\n\n    selected : iter(e, int) | e.eid;\n\n    verts    : ElementArray;\n    handles  : ElementArray;\n    segments : ElementArray;\n    faces    : ElementArray;\n    layerset : SplineLayerSet;\n\n    restrict : int;\n    actlevel : int;\n\n    mres_format : array(string);\n}\n";
  Spline.dag_outputs = {on_solve: 0}
});
es6_module_define('solver', [], function _solver_module(_es6_module) {
  var SQRT2=Math.sqrt(2.0);
  var FEPS=1e-17;
  var PI=Math.PI;
  var sin=Math.sin, cos=Math.cos, atan2=Math.atan2;
  var sqrt=Math.sqrt, pow=Math.pow, log=Math.log, abs=Math.abs;
  var SPI2=Math.sqrt(PI/2);
  var constraint=_ESClass("constraint", [function constraint(typename, k, klst, klen, ceval, params, limit) {
    if (limit==undefined)
      limit = 0.001;
    this.type = typename;
    this.klst = klst;
    this.ceval = ceval;
    this.params = params;
    this.klen = [];
    if (!(__instance_of(klen, Array))) {
        for (var i=0; i<klst.length; i++) {
            this.klen.push(klen);
        }
    }
    else {
      this.klen = klen;
    }
    this.glst = [];
    for (var i=0; i<klst.length; i++) {
        var gs=[];
        this.glst.push(gs);
        for (var j=0; j<klen; j++) {
            gs.push(0);
        }
    }
    this.k = k;
  }, function exec(do_gs) {
    if (do_gs==undefined)
      do_gs = true;
    var r1=this.ceval(this.params);
    if (abs(r1)<=this.limit)
      return 0.0;
    if (!do_gs)
      return r1;
    var df=3e-06;
    for (var ki=0; ki<this.klst.length; ki++) {
        var ks=this.klst[ki];
        var gs=this.glst[ki];
        for (var i=0; i<this.klen[ki]; i++) {
            var orig=ks[i];
            ks[i]+=df;
            var r2=this.ceval(this.params);
            gs[i] = (r2-r1)/df;
            ks[i] = orig;
            if (ks.length>5) {
            }
        }
    }
    return r1;
  }]);
  _es6_module.add_class(constraint);
  constraint = _es6_module.add_export('constraint', constraint);
  var solver=_ESClass("solver", [function solver() {
    this.cs = [];
    this.threshold = 0.001;
    this.edge_segs = [];
  }, function add(c) {
    this.cs.push(c);
  }, function solve(steps, gk, final_solve, edge_segs) {
    if (gk==undefined)
      gk = 1.0;
    var err=0.0;
    var clen=this.cs.length;
    for (var i=0; i<steps; i++) {
        for (var j=0; j<edge_segs.length; j++) {
            var seg=edge_segs[j];
            var ks=seg.ks;
            for (var k=0; k<ks.length; k++) {
                ks[k] = seg._last_ks[k];
            }
        }
        err/=this.cs.length;
        if (i>0&&err<this.threshold)
          break;
        if (isNaN(err))
          break;
        err = 0.0;
        var cs=this.cs;
        var visit={};
        for (var j=0; j<cs.length; j++) {
            var j2=i%2 ? clen-j-1 : j;
            var c=cs[j2];
            var r=c.exec(true);
            err+=abs(r);
            if (r==0.0)
              continue;
            var klst=c.klst, glst=c.glst;
            var totgs=0.0;
            for (var ki=0; ki<klst.length; ki++) {
                var klen=c.klen[ki];
                var gs=glst[ki];
                totgs = 0.0;
                for (var k=0; k<klen; k++) {
                    totgs+=gs[k]*gs[k];
                }
                if (totgs==0.0)
                  continue;
                var rmul=r/totgs;
                ks = klst[ki];
                gs = glst[ki];
                var ck=i>8&&c.k2!=undefined ? c.k2 : c.k;
                for (var k=0; k<klen; k++) {
                    ks[k]+=-rmul*gs[k]*ck*gk;
                }
            }
        }
    }
    for (var j=0; j<edge_segs.length; j++) {
        var seg=edge_segs[j];
        var ks=seg.ks;
        for (var k=0; k<ks.length; k++) {
            seg.ks[k] = seg._last_ks[k];
        }
    }
    if (final_solve||isNaN(err)) {
    }
    return i;
  }]);
  _es6_module.add_class(solver);
  solver = _es6_module.add_export('solver', solver);
});
es6_module_define('spline_multires', ["struct", "spline_base", "binomial_table"], function _spline_multires_module(_es6_module) {
  "use strict";
  var acos=Math.acos, asin=Math.asin, abs=Math.abs, log=Math.log, sqrt=Math.sqrt, pow=Math.pow, PI=Math.PI, floor=Math.floor, min=Math.min, max=Math.max, sin=Math.sin, cos=Math.cos, tan=Math.tan, atan=Math.atan, atan2=Math.atan2, exp=Math.exp, ceil=Math.ceil;
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var CustomDataLayer=es6_import_item(_es6_module, 'spline_base', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, 'spline_base', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, 'spline_base', 'SplineFlags');
  var CurveEffect=es6_import_item(_es6_module, 'spline_base', 'CurveEffect');
  var MResFlags={SELECT: 1, ACTIVE: 2, REBASE: 4, UPDATE: 8, HIGHLIGHT: 16, HIDE: 64, FRAME_DIRTY: 128}
  MResFlags = _es6_module.add_export('MResFlags', MResFlags);
  var _a=0;
  var TX=0;
  TX = _es6_module.add_export('TX', TX);
  var TY=1;
  TY = _es6_module.add_export('TY', TY);
  var TVX=2;
  TVX = _es6_module.add_export('TVX', TVX);
  var TVY=3;
  TVY = _es6_module.add_export('TVY', TVY);
  var TSEG=4;
  TSEG = _es6_module.add_export('TSEG', TSEG);
  var TS=5;
  TS = _es6_module.add_export('TS', TS);
  var TT=6;
  TT = _es6_module.add_export('TT', TT);
  var TA=7;
  TA = _es6_module.add_export('TA', TA);
  var TFLAG=8;
  TFLAG = _es6_module.add_export('TFLAG', TFLAG);
  var TID=9;
  TID = _es6_module.add_export('TID', TID);
  var TLEVEL=10;
  TLEVEL = _es6_module.add_export('TLEVEL', TLEVEL);
  var TSUPPORT=11;
  TSUPPORT = _es6_module.add_export('TSUPPORT', TSUPPORT);
  var TBASIS=12;
  TBASIS = _es6_module.add_export('TBASIS', TBASIS);
  var TDEGREE=13;
  TDEGREE = _es6_module.add_export('TDEGREE', TDEGREE);
  var TNEXT=14;
  TNEXT = _es6_module.add_export('TNEXT', TNEXT);
  var TTOT=15;
  TTOT = _es6_module.add_export('TTOT', TTOT);
  var _format=["TX", "TY", "TVX", "TVY", "TSEG", "TS", "TT", "TA", "TFLAG", "TID", "TLEVEL", "TSUPPORT", "TBASIS", "TDEGREE", "TNEXT"];
  _format = _es6_module.add_export('_format', _format);
  var IHEAD=0, ITAIL=1, IFREEHEAD=2, ITOTPOINT=3, ITOT=4;
  var $p_Xkht_recalc_offset;
  var BoundPoint=_ESClass("BoundPoint", [function BoundPoint() {
    this.mr = undefined;
    this.i = undefined;
    this.data = undefined;
    this.composed_id = -1;
    this.offset = {}
    var this2=this;
    Object.defineProperty(this.offset, "0", {get: function() {
      return this2.data[this2.i+TVX];
    }, set: function(val) {
      this2.data[this2.i+TVX] = val;
    }});
    Object.defineProperty(this.offset, "1", {get: function() {
      return this2.data[this2.i+TVY];
    }, set: function(val) {
      this2.data[this2.i+TVY] = val;
    }});
  }, function recalc_offset(spline) {
    var seg=spline.eidmap[this.seg];
    var co=seg._evalwrap.evaluate(this.s);
    this.offset[0] = this[0]-co[0];
    this.offset[1] = this[1]-co[1];
    $p_Xkht_recalc_offset[0] = this[0];
    $p_Xkht_recalc_offset[1] = this[1];
    var sta=seg._evalwrap.global_to_local($p_Xkht_recalc_offset, undefined, this.s);
    this.t = sta[1];
    this.a = sta[2];
  }, function toString() {
    var next=this.data!=undefined ? this.data[this.i+TNEXT] : "(error)";
    return "{\n"+"\"0\"   : "+this[0]+",\n"+"\"1\"   : "+this[1]+",\n"+".offset : ["+this.offset[0]+", "+this.offset[1]+"],\n"+"id      : "+this.id+",\n"+"seg     : "+this.seg+",\n"+"t       : "+this.t+",\n"+"s       : "+this.s+",\n"+"flag    : "+this.flag+",\n"+"next    : "+next+"\n"+"}\n";
  }, function bind(mr, i) {
    this.mr = mr;
    this.i = i;
    this.data = mr.data;
    this.composed_id = compose_id(this.seg, this.id);
    return this;
  }, _ESClass.get(_ESClass.symbol(0, function() {
    return this.data[this.i+TX];
  })), _ESClass.set(_ESClass.symbol(0, function(val) {
    this.data[this.i+TX] = val;
  })), _ESClass.get(_ESClass.symbol(1, function() {
    return this.data[this.i+TY];
  })), _ESClass.set(_ESClass.symbol(1, function(val) {
    this.data[this.i+TY] = val;
  })), _ESClass.get(function support() {
    return this.data[this.i+TSUPPORT];
  }), _ESClass.set(function support(val) {
    this.data[this.i+TSUPPORT] = val;
  }), _ESClass.get(function degree() {
    return this.data[this.i+TDEGREE];
  }), _ESClass.set(function degree(val) {
    this.data[this.i+TDEGREE] = val;
  }), _ESClass.get(function basis() {
    return this.data[this.i+TBASIS];
  }), _ESClass.set(function basis(val) {
    this.data[this.i+TBASIS] = val;
  }), _ESClass.get(function seg() {
    return this.data[this.i+TSEG];
  }), _ESClass.set(function seg(val) {
    this.data[this.i+TSEG] = val;
  }), _ESClass.get(function level() {
    return this.data[this.i+TLEVEL];
  }), _ESClass.set(function level(val) {
    this.data[this.i+TLEVEL] = val;
  }), _ESClass.get(function s() {
    return this.data[this.i+TS];
  }), _ESClass.set(function s(val) {
    this.data[this.i+TS] = val;
  }), _ESClass.get(function t() {
    return this.data[this.i+TT];
  }), _ESClass.set(function t(val) {
    this.data[this.i+TT] = val;
  }), _ESClass.get(function a() {
    return this.data[this.i+TA];
  }), _ESClass.set(function a(val) {
    this.data[this.i+TA] = val;
  }), _ESClass.get(function flag() {
    return this.data[this.i+TFLAG];
  }), _ESClass.set(function flag(val) {
    this.data[this.i+TFLAG] = val;
  }), _ESClass.get(function id() {
    return this.data[this.i+TID];
  }), _ESClass.set(function id(val) {
    this.data[this.i+TID] = val;
  }), _ESClass.get(function next() {
    return this.data[this.i+TNEXT];
  })]);
  var $p_Xkht_recalc_offset=new Vector3([0, 0, 0]);
  _es6_module.add_class(BoundPoint);
  BoundPoint = _es6_module.add_export('BoundPoint', BoundPoint);
  var pointiter_ret_cache=cachering.fromConstructor(BoundPoint, 12);
  var add_point_cache=cachering.fromConstructor(BoundPoint, 12);
  var get_point_cache=cachering.fromConstructor(BoundPoint, 12);
  var point_iter=_ESClass("point_iter", [function point_iter() {
    this.ret = {done: true, value: undefined}
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this;
  }), function cache_init(mr, level) {
    this.mr = mr;
    this.level = level;
    this.data = mr.data;
    this.cur = mr.index[level*ITOT+IHEAD];
    this.ret.done = false;
    this.ret.value = undefined;
    return this;
  }, function next() {
    if (this.cur==-1) {
        this.ret.done = true;
        this.ret.value = undefined;
        this.mr = undefined;
        return this.ret;
    }
    var d=this.data;
    var cur=this.cur;
    var p=pointiter_ret_cache.next();
    p.bind(this.mr, this.cur);
    this.cur = d[cur+TNEXT];
    if (this.cur==cur) {
        console.log("EEK! bad data in mres iterator!", this, this.mr, this.cur, cur, "level:", this.level);
        this.cur = -1;
    }
    this.ret.value = p;
    return this.ret;
  }]);
  _es6_module.add_class(point_iter);
  var binomial_table=es6_import_item(_es6_module, 'binomial_table', 'binomial_table');
  var bernstein_offsets=es6_import_item(_es6_module, 'binomial_table', 'bernstein_offsets');
  function binomial(n, k) {
    if (binomial_table.length>n) {
        return binomial_table[n][k];
    }
    if (k==0.0||k==n) {
        return 1;
    }
    return binomial(n-1, k-1)+binomial(n-1, k);
  }
  function bernstein(degree, s) {
    degree = Math.max(Math.floor(degree), 0.0);
    var half=Math.floor(degree/2);
    return binomial(degree, half)*pow(s, half)*pow(1.0-s, degree-half);
  }
  function bernstein2(degree, s) {
    var a=floor(degree+1);
    var b=ceil(degree+1);
    if (isNaN(a)||a<=0) {
        return 0.0;
    }
    var start=0.0, mid=0.5, end=1.0;
    if (a>=0&&a<bernstein_offsets.length) {
        start = bernstein_offsets[a][0];
        mid = bernstein_offsets[a][1];
        end = bernstein_offsets[a][2];
    }
    var off=0.5-mid;
    if (1||a<4) {
        var t=1.0-abs(s-0.5)*2.0;
        s-=off*t;
    }
    else {
      s*=2.0;
      s = start*(1.0-s)+mid*s;
    }
    var height=bernstein(a, mid, 0, a, Math.floor(a/2));
    return bernstein(a, s)/height;
  }
  function crappybasis(s, k, support, degree) {
    if (s<k-support||s>=k+support)
      return 0.0;
    var start=k-support, end=k+support;
    var t=(s-start)/(end-start);
    var degree2=degree-2.0;
    var sign=degree2<0.0 ? -1.0 : 1.0;
    degree2 = pow(degree2, 0.25)*sign+2.0;
    t = bernstein2(degree, t);
    if (isNaN(t))
      t = 0.0;
    return t;
  }
  var $sum_sJTF_evaluate;
  var $ks_VdNb_evaluate;
  var MultiResEffector=_ESClass("MultiResEffector", CurveEffect, [function MultiResEffector(owner) {
    this.mr = owner;
  }, function evaluate(s) {
    var n=this.prior.derivative(s);
    var t=n[0];
    n[0] = n[1];
    n[1] = t;
    n.normalize();
    n.mulScalar(10.0);
    var co=this.prior.evaluate(s);
    $sum_sJTF_evaluate.zero();
    var i=0;
    for (var p in this.mr.points(0)) {
        $ks_VdNb_evaluate[i] = p.s;
        i++;
    }
    for (var p in this.mr.points(0)) {
        var w=crappybasis(s, p.s, p.support, p.degree);
        if (isNaN(w))
          continue;
        $sum_sJTF_evaluate[0]+=p.offset[0]*w;
        $sum_sJTF_evaluate[1]+=p.offset[1]*w;
    }
    for (var i=0; i<2; i++) {
        var next=i ? this.next : this.prev;
        var soff=i ? -1.0 : 1.0;
        var sign=i ? -1.0 : 1.0;
        if (next!=undefined) {
            var mr=!(__instance_of(next, MultiResEffector)) ? next.eff.mr : next.mr;
            for (var p in mr.points(0)) {
                if ((!i&&p.s-support>=0)||(i&&p.s+support<=1.0))
                  continue;
                var support=p.support;
                var ps=p.s;
                var s2;
                if (!i) {
                    s2 = next.rescale(this, s)+1.0;
                }
                else {
                  s2 = -next.rescale(this, 1.0-s);
                }
                var w=crappybasis(s2, ps, support, p.degree);
                $sum_sJTF_evaluate[0]+=p.offset[0]*w;
                $sum_sJTF_evaluate[1]+=p.offset[1]*w;
            }
        }
    }
    co.add($sum_sJTF_evaluate);
    return co;
  }]);
  var $sum_sJTF_evaluate=new Vector3();
  var $ks_VdNb_evaluate=new Array(2000);
  _es6_module.add_class(MultiResEffector);
  MultiResEffector = _es6_module.add_export('MultiResEffector', MultiResEffector);
  var MultiResGlobal=_ESClass("MultiResGlobal", [function MultiResGlobal() {
    this.active = undefined;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=new MultiResGlobal();
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(MultiResGlobal);
  MultiResGlobal = _es6_module.add_export('MultiResGlobal', MultiResGlobal);
  MultiResGlobal.STRUCT = "\n  MultiResGlobal {\n    active : double | obj.active == undefined ? -1 : obj.active;\n  }\n";
  var $_co_BAPF_add_point;
  var $sta_Tyv9_recalc_worldcos_level;
  var MultiResLayer=_ESClass("MultiResLayer", CustomDataLayer, [function MultiResLayer(size) {
    if (size==undefined) {
        size = 16;
    }
    CustomDataLayer.call(this, this);
    this._effector = new MultiResEffector(this);
    this.max_layers = 8;
    this.data = new Float64Array(size*TTOT);
    this.index = new Array(this.max_layers*ITOT);
    this.totpoint = 0;
    this._size = size;
    this._freecur = 0;
    for (var i=0; i<this.max_layers; i++) {
        this.index[i*ITOT+IHEAD] = -1;
        this.index[i*ITOT+ITAIL] = -1;
        this.index[i*ITOT+IFREEHEAD] = 0;
    }
    this.points_iter_cache = cachering.fromConstructor(point_iter, 8);
  }, function _convert(formata, formatb) {
    var totp=this.data.length/formata.length;
    var data=new Float64Array(totp*formatb.length);
    var odata=this.data;
    var ttota=formata.length, ttotb=formatb.length;
    console.log("FORMATA", formata, "\n");
    console.log("FORMATB", formatb, "\n");
    var fa=[], fb=[];
    var fmap={}
    for (var i=0; i<formata.length; i++) {
        for (var j=0; j<formatb.length; j++) {
            if (formata[i]==formatb[j]) {
                fmap[i] = j;
            }
        }
    }
    console.log("FMAP", fmap, "\n");
    for (var i=0; i<totp; i++) {
        for (var j=0; j<formata.length; j++) {
            var src=odata[i*ttota+j];
            if ((formata[j]=="TNEXT"||formata[j]=="TID")&&src!=-1) {
                src = Math.floor((src/ttota)*ttotb);
            }
            data[i*ttotb+fmap[j]] = src;
        }
    }
    for (var i=0; i<this.max_layers; i++) {
        if (this.index[i*ITOT+IHEAD]!=-1)
          this.index[i*ITOT+IHEAD] = Math.floor((this.index[i*ITOT+IHEAD]/ttota)*ttotb);
        if (this.index[i*ITOT+ITAIL]!=-1)
          this.index[i*ITOT+ITAIL] = Math.floor((this.index[i*ITOT+ITAIL]/ttota)*ttotb);
        if (this.index[i*ITOT+IFREEHEAD]!=-1)
          this.index[i*ITOT+IFREEHEAD] = Math.floor((this.index[i*ITOT+IFREEHEAD]/ttota)*ttotb);
    }
    this.data = data;
  }, function fix_points(seg) {
    if (seg==undefined) {
        seg = undefined;
    }
    var index=this.index;
    for (var i=0; i<this.index.length; i+=ITOT) {
        index[i] = index[i+1] = -1;
        index[i+2] = index[i+3] = 0;
    }
    var data=this.data;
    for (var i=0; i<data.length; i+=TTOT) {
        if (data[i]==0&&data[i+1]==0&&data[i+2]==0&&data[TNEXT]==0)
          continue;
        this._freecur = i+TTOT;
        var lvl=data[i+TLEVEL];
        if (index[lvl*ITOT+IHEAD]==-1) {
            index[lvl*ITOT+IHEAD] = index[lvl*ITOT+ITAIL] = i;
            data[i+TNEXT] = -1;
        }
        else {
          var i2=index[lvl*ITOT+ITAIL];
          data[i2+TNEXT] = i;
          data[i+TNEXT] = -1;
          index[lvl*ITOT+ITAIL] = i;
        }
        index[lvl*ITOT+ITOTPOINT]++;
    }
    if (seg==undefined)
      return ;
    for (var i=0; i<this.max_layers; i++) {
        for (var p in this.points(i)) {
            p.seg = seg.eid;
        }
    }
  }, function points(level) {
    return this.points_iter_cache.next().cache_init(this, level);
  }, function add_point(level, co) {
    if (co==undefined) {
        co = $_co_BAPF_add_point;
    }
    this._freecur+=TTOT-(this._freecur%TTOT);
    var i=this._freecur;
    if (this._freecur+TTOT>=this._size) {
        this.resize(this._freecur+3);
    }
    var j=0;
    this.data[i+TX] = co[0];
    this.data[i+TY] = co[1];
    this.data[i+TLEVEL] = level;
    this.data[i+TID] = i;
    this.data[i+TNEXT] = -1;
    this.data[i+TSUPPORT] = 0.3;
    this.data[i+TDEGREE] = 2.0;
    this._freecur = i+TTOT;
    var head=this.index[level*ITOT+IHEAD];
    var tail=this.index[level*ITOT+ITAIL];
    if (head==-1||tail==-1) {
        this.index[level*ITOT+IHEAD] = i;
        this.index[level*ITOT+ITAIL] = i;
    }
    else {
      this.data[tail+TNEXT] = i;
      this.index[level*ITOT+ITAIL] = i;
    }
    this.index[level*ITOT+ITOTPOINT]++;
    this.totpoint++;
    return add_point_cache.next().bind(this, i);
  }, function get(id, allocate_object) {
    if (allocate_object==undefined) {
        allocate_object = false;
    }
    if (allocate_object)
      return new BoundPoint().bind(this, id);
    else 
      return get_point_cache.next().bind(this, id);
  }, function curve_effect() {
    return this._effector;
  }, function resize(newsize) {
    if (newsize<this._size)
      return ;
    newsize*=2.0;
    var array=new Float64Array(newsize);
    var oldsize=this.data.length;
    for (var i=0; i<oldsize; i++) {
        array[i] = this.data[i];
    }
    this._size = newsize;
    this.data = array;
  }, function segment_split(old_segment, old_v1, old_v2, new_segments) {
  }, function recalc_worldcos_level(seg, level) {
    for (var p in this.points(level)) {
        $sta_Tyv9_recalc_worldcos_level[0] = p.s;
        $sta_Tyv9_recalc_worldcos_level[1] = p.t;
        $sta_Tyv9_recalc_worldcos_level[2] = p.a;
        var co=seg._evalwrap.local_to_global($sta_Tyv9_recalc_worldcos_level);
        var co2=seg._evalwrap.evaluate($sta_Tyv9_recalc_worldcos_level[0]);
        p[0] = co[0];
        p[1] = co[1];
        p.offset[0] = co[0]-co2[0];
        p.offset[1] = co[1]-co2[1];
    }
  }, function recalc_wordscos(seg) {
    for (var i=0; i<this.max_layers; i++) {
        this.recalc_worldcos_level(seg, i);
    }
  }, function post_solve(owner_segment) {
    this.recalc_wordscos(owner_segment);
  }, function interp(srcs, ws) {
    this.time = 0.0;
    for (var i=0; i<srcs.length; i++) {

    }
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=STRUCT.chain_fromSTRUCT(MultiResLayer, reader);
    ret.max_layers = 8;
    return ret;
  })]);
  var $_co_BAPF_add_point=[0, 0];
  var $sta_Tyv9_recalc_worldcos_level=[0, 0, 0];
  _es6_module.add_class(MultiResLayer);
  MultiResLayer = _es6_module.add_export('MultiResLayer', MultiResLayer);
  MultiResLayer.STRUCT = STRUCT.inherit(MultiResLayer, CustomDataLayer)+"\n    data            : array(double);\n    index           : array(double);\n    max_layers      : int;\n    totpoint        : int;\n    _freecur        : int;\n    _size           : int;\n  }\n";
  MultiResLayer.layerinfo = {type_name: "MultiResLayer", has_curve_effect: true, shared_class: MultiResGlobal}
  function test_fix_points() {
    var spline=new Context().spline;
    for (var seg in spline.segments) {
        var mr=seg.cdata.get_layer(MultiResLayer);
        mr.fix_points(seg);
    }
  }
  test_fix_points = _es6_module.add_export('test_fix_points', test_fix_points);
  function test_multires(n) {
    var mr=new MultiResLayer();
    var adds=[0.5, -0.25, -1, 1, 1, -2, 4, 9, 11.3, 3, 4, 0.245345, 1.0234, 8, 7, 4, 6];
    var iadd=0.0;
    for (var i=0; i<5; i++, iadd+=0.2*(i+1)) {
        var add=iadd;
        var p=mr.add_point(0, [-4, -3]);
        var c=0;
        p.id = adds[c++]+add++;
        p.offset[0] = adds[c++]+add++;
        p.offset[1] = adds[c++]+add++;
        p.flag = adds[c++]+add++;
        p.seg = adds[c++]+add++;
        p.t = adds[c++]+add++;
        p.s = adds[c++]+add++;
        p[0] = adds[c++]+add++;
        p[1] = adds[c++]+add++;
        add = iadd;
        c = 0;
        console.log(p.id==adds[c++]+add++, adds[c-1]+add-1, p.id, "id");
        console.log(p.offset[0]==adds[c++]+add++, adds[c-1]+add-1, p.offset[0], "offset[0]");
        console.log(p.offset[1]==adds[c++]+add++, adds[c-1]+add-1, p.offset[1], "offset[1]");
        console.log(p.flag==adds[c++]+add++, adds[c-1]+add-1, p.flag, "flag");
        console.log(p.seg==adds[c++]+add++, adds[c-1]+add-1, p.seg, "seg");
        console.log(p.t==adds[c++]+add++, adds[c-1]+add-1, p.t, "t");
        console.log(p.s==adds[c++]+add++, adds[c-1]+add-1, p.s, "s");
        console.log(p[0]==adds[c++]+add++, adds[c-1]+add-1, p[0], "[0]");
        console.log(p[1]==adds[c++]+add++, adds[c-1]+add-1, p[1], "[1]");
    }
    var _c=0;
    var __iter_p=__get_iter(mr.points(0));
    var p;
    while (1) {
      var __ival_p=__iter_p.next();
      if (__ival_p.done) {
          break;
      }
      p = __ival_p.value;
      console.log(""+p);
      if (_c++>1000) {
          console.trace("Infinite loop!");
          break;
      }
    }
    return mr;
  }
  test_multires = _es6_module.add_export('test_multires', test_multires);
  function compose_id(eid, index) {
    var mul=(1<<24);
    return index+eid*mul;
  }
  compose_id = _es6_module.add_export('compose_id', compose_id);
  var $ret_1aUv_decompose_id=[0, 0];
  function decompose_id(id) {
    var mul=(1<<24);
    var eid=Math.floor(id/mul);
    id-=eid*mul;
    $ret_1aUv_decompose_id[0] = eid;
    $ret_1aUv_decompose_id[1] = id;
    return $ret_1aUv_decompose_id;
  }
  decompose_id = _es6_module.add_export('decompose_id', decompose_id);
  var _test_id_start=0;
  function test_ids(steps, start) {
    if (steps==undefined) {
        steps = 1;
    }
    if (start==undefined) {
        start = _test_id_start;
    }
    var max_mres=5000000;
    var max_seg=500000;
    console.log("starting at", start);
    for (var i=start; i<start+steps; i++) {
        for (var j=0; j<max_seg; j++) {
            var id=compose_id(i, j);
            var ret=decompose_id(id);
            if (i!=ret[0]||j!=ret[1]) {
                console.log("Found bad combination!!", ret[0], ret[1], "||", i, j);
            }
        }
    }
    console.log("finished");
    _test_id_start = i;
  }
  test_ids = _es6_module.add_export('test_ids', test_ids);
  function has_multires(spline) {
    return spline.segments.cdata.num_layers("MultiResLayer")>0;
  }
  has_multires = _es6_module.add_export('has_multires', has_multires);
  function ensure_multires(spline) {
    if (spline.segments.cdata.num_layers("MultiResLayer")==0) {
        spline.segments.cdata.add_layer(MultiResLayer);
    }
  }
  ensure_multires = _es6_module.add_export('ensure_multires', ensure_multires);
  var empty_iter={_ret: {done: true, value: undefined}, next: function() {
    this._ret.done = true;
    this._ret.value = undefined;
    return this._ret;
  }}
  empty_iter[Symbol.iterator] = function() {
    return this;
  }
  var GlobalIter=_ESClass("GlobalIter", [function GlobalIter(spline, level, return_keys) {
    if (return_keys==undefined) {
        return_keys = false;
    }
    this.spline = spline;
    this.level = level;
    this.return_keys = return_keys;
    this.seg = undefined;
    this.segiter = spline.segments[Symbol.iterator]();
    this.pointiter = undefined;
    this.ret = {done: false, value: undefined}
  }, function next() {
    if (this.pointiter==undefined) {
        this.seg = this.segiter.next();
        if (this.seg.done==true) {
            this.ret.done = true;
            this.ret.value = undefined;
            return this.ret;
        }
        this.seg = this.seg.value;
        var mr=this.seg.cdata.get_layer(MultiResLayer);
        this.pointiter = mr.points(this.level);
    }
    var p=this.pointiter.next();
    if (p.done) {
        this.pointiter = undefined;
        return this.next();
    }
    p = p.value;
    this.ret.value = this.return_keys ? compose_id(p.seg, p.id) : p;
    return this.ret;
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this;
  })]);
  _es6_module.add_class(GlobalIter);
  function iterpoints(spline, level, return_keys) {
    if (return_keys==undefined) {
        return_keys = false;
    }
    if (spline.segments.cdata.num_layers("MultiResLayer")==0)
      return empty_iter;
    return new GlobalIter(spline, level, return_keys);
  }
  iterpoints = _es6_module.add_export('iterpoints', iterpoints);
  iterpoints.selected = function(spline, level) {
  }
});
es6_module_define('solver_new', ["spline_base", "spline_math"], function _solver_new_module(_es6_module) {
  var KSCALE=es6_import_item(_es6_module, 'spline_math', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, 'spline_math', 'KANGLE');
  var SplineTypes=es6_import_item(_es6_module, 'spline_base', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, 'spline_base', 'SplineFlags');
  var acos=Math.acos, asin=Math.asin, cos=Math.cos, sin=Math.sin, PI=Math.PI, pow=Math.pow, sqrt=Math.sqrt, log=Math.log, abs=Math.abs;
  var $tan_kYgY_solve=new Vector3();
  function solve(spline, order, steps, gk, do_inc, edge_segs) {
    var pairs=[];
    var CBREAK=SplineFlags.BREAK_CURVATURES;
    var TBREAK=SplineFlags.BREAK_TANGENTS;
    function reset_edge_segs() {
      for (var j=0; do_inc&&j<edge_segs.length; j++) {
          var seg=edge_segs[j];
          var ks=seg.ks;
          for (var k=0; k<ks.length; k++) {
              ks[k] = seg._last_ks[k];
          }
      }
    }
    var eps=0.0001;
    for (var i=0; i<spline.handles.length; i++) {
        var h=spline.handles[i], seg1=h.owning_segment, v=h.owning_vertex;
        if (do_inc&&!((v.flag)&SplineFlags.UPDATE))
          continue;
        if (!(h.flag&SplineFlags.USE_HANDLES)&&v.segments.length<=2)
          continue;
        if (h.hpair!=undefined&&(h.flag&SplineFlags.AUTO_PAIRED_HANDLE)) {
            var seg2=h.hpair.owning_segment;
            var s1=v===seg1.v1 ? eps : 1.0-eps, s2=v==seg2.v1 ? eps : 1.0-eps;
            var thresh=5;
            if (seg1.v1.vectorDistance(seg1.v2)<thresh||seg2.v1.vectorDistance(seg2.v2)<thresh)
              continue;
            var d1=seg1.v1.vectorDistance(seg1.v2);
            var d2=seg2.v1.vectorDistance(seg2.v2);
            var ratio=Math.min(d1/d2, d2/d1);
            if (isNaN(ratio))
              ratio = 0.0;
            pairs.push(v);
            pairs.push(seg1);
            pairs.push(seg2);
            pairs.push(s1);
            pairs.push(s2);
            pairs.push((s1<0.5)==(s2<0.5) ? -1 : 1);
            pairs.push(ratio);
        }
        else 
          if (!(h.flag&SplineFlags.AUTO_PAIRED_HANDLE)) {
            var s1=v==seg1.v1 ? 0 : 1;
            pairs.push(v);
            pairs.push(seg1);
            pairs.push(undefined);
            pairs.push(s1);
            pairs.push(0.0);
            pairs.push(1);
            pairs.push(1);
        }
    }
    var PSLEN=7;
    for (var i=0; i<spline.verts.length; i++) {
        var v=spline.verts[i];
        if (do_inc&&!((v.flag)&SplineFlags.UPDATE))
          continue;
        if (v.segments.length!=2)
          continue;
        if (v.flag&TBREAK)
          continue;
        var seg1=v.segments[0], seg2=v.segments[1];
        var s1=v===seg1.v1 ? 0 : 1, s2=v==seg2.v1 ? 0 : 1;
        seg1.evaluate(0.5, order);
        seg2.evaluate(0.5, order);
        var thresh=5;
        if (seg1.v1.vectorDistance(seg1.v2)<thresh||seg2.v1.vectorDistance(seg2.v2)<thresh)
          continue;
        var d1=seg1.v1.vectorDistance(seg1.v2);
        var d2=seg2.v1.vectorDistance(seg2.v2);
        var ratio=Math.min(d1/d2, d2/d1);
        if (isNaN(ratio))
          ratio = 0.0;
        pairs.push(v);
        pairs.push(seg1);
        pairs.push(seg2);
        pairs.push(s1);
        pairs.push(s2);
        pairs.push((s1==0.0)==(s2==0.0) ? -1 : 1);
        pairs.push(ratio);
    }
    var glist=[];
    for (var i=0; i<pairs.length/PSLEN; i++) {
        glist.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
    var klist1=[];
    for (var i=0; i<pairs.length/PSLEN; i++) {
        klist1.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
    var klist2=[];
    for (var i=0; i<pairs.length/PSLEN; i++) {
        klist2.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
    var gs=new Array(order);
    var df=3e-05;
    var err=0.0;
    if (pairs.length==0)
      return ;
    for (var si=0; si<steps; si++) {
        var i=0;
        var plen=pairs.length;
        if (isNaN(err)||isNaN(plen))
          break;
        if (si>0&&err/plen<0.1)
          break;
        var di=0;
        if (si%2) {
            di = -PSLEN*2;
            i = plen-PSLEN;
        }
        reset_edge_segs();
        err = 0.0;
        while (i<plen&&i>=0) {
          var cnum=Math.floor(i/PSLEN);
          var v=pairs[i++], seg1=pairs[i++], seg2=pairs[i++];
          var s1=pairs[i++], s2=pairs[i++], doflip=pairs[i++];
          var ratio=pairs[i++];
          i+=di;
          for (var ci=0; ci<2; ci++) {
              if (0&&seg2!=undefined&&ratio>0.1&&!(v.flag&CBREAK)) {
                  var sz1=seg1.ks[KSCALE], sz2=seg2.ks[KSCALE];
                  var i1=s1*(order-1), i2=s2*(order-1);
                  var k1=seg1.ks[i1], k2=seg2.ks[i2];
                  var k=((k1/sz1)+(k2/sz2*doflip))/2.0;
                  seg1.ks[i1] = seg1.ks[i1]+(k*sz1-seg1.ks[i1])*1;
                  seg2.ks[i2] = seg2.ks[i2]+(k*doflip*sz2-seg2.ks[i2])*1;
              }
              if (seg2!=undefined) {
                  var ta=seg1.derivative(s1, order), tb=seg2.derivative(s2, order);
                  if (doflip<0.0)
                    tb.negate();
                  ta.normalize();
                  tb.normalize();
                  var _d=Math.min(Math.max(ta.dot(tb), -1.0), 1.0);
                  var r=acos(_d);
                  
              }
              else {
                var h=seg1.handle(v);
                $tan_kYgY_solve.load(h).sub(v).normalize();
                if (v==seg1.v2)
                  $tan_kYgY_solve.negate();
                var ta=seg1.derivative(s1, order).normalize();
                var _d=Math.min(Math.max(ta.dot($tan_kYgY_solve), -1.0), 1.0);
                var r=acos(_d);
                
              }
              if (r<0.0001)
                continue;
              err+=r;
              var totgs=0.0;
              var gs=glist[cnum];
              var seglen=(seg2==undefined) ? 1 : 2;
              for (var sj=0; sj<seglen; sj++) {
                  var seg=sj ? seg2 : seg1;
                  for (var j=0; j<order; j++) {
                      var orig=seg.ks[j];
                      seg.ks[j]+=df;
                      if (seg2!=undefined) {
                          var ta=seg1.derivative(s1, order), tb=seg2.derivative(s2, order);
                          if (doflip<0.0)
                            tb.negate();
                          ta.normalize();
                          tb.normalize();
                          var _d=Math.min(Math.max(ta.dot(tb), -1.0), 1.0);
                          var r2=acos(_d);
                          
                      }
                      else {
                        var ta=seg1.derivative(s1, order).normalize();
                        var _d=Math.min(Math.max(ta.dot($tan_kYgY_solve), -1.0), 1.0);
                        var r2=acos(_d);
                        
                      }
                      var g=(r2-r)/df;
                      gs[sj*order+j] = g;
                      totgs+=g*g;
                      seg.ks[j] = orig;
                  }
              }
              if (totgs==0.0)
                continue;
              r/=totgs;
              var unstable=ratio<0.1;
              for (var sj=0; sj<seglen; sj++) {
                  var seg=sj ? seg2 : seg1;
                  for (var j=0; j<order; j++) {
                      var g=gs[sj*order+j];
                      if (order>2&&unstable&&(j==0||j==order-1)) {
                      }
                      seg.ks[j]+=-r*g*gk;
                  }
              }
              if (seg2!=undefined&&ratio>0.1&&!(v.flag&CBREAK)) {
                  var sz1=seg1.ks[KSCALE], sz2=seg2.ks[KSCALE];
                  var i1=s1*(order-1), i2=s2*(order-1);
                  var k1=seg1.ks[i1], k2=seg2.ks[i2];
                  var k=((k1/sz1)+(k2/sz2*doflip))/2.0;
                  seg1.ks[i1] = seg1.ks[i1]+(k*sz1-seg1.ks[i1])*1;
                  seg2.ks[i2] = seg2.ks[i2]+(k*doflip*sz2-seg2.ks[i2])*1;
              }
          }
        }
        for (var j=0; j<edge_segs.length; j++) {
            var seg=edge_segs[j];
            var ks=seg.ks;
            for (var k=0; k<ks.length; k++) {
                seg.ks[k] = seg._last_ks[k];
            }
        }
    }
  }
  solve = _es6_module.add_export('solve', solve);
});
es6_module_define('vectordraw_base', [], function _vectordraw_base_module(_es6_module) {
  "use strict";
  var VectorFlags={UPDATE: 2, TAG: 4}
  VectorFlags = _es6_module.add_export('VectorFlags', VectorFlags);
  var VectorVertex=_ESClass("VectorVertex", Vector2, [function VectorVertex(co) {
    Vector2.call(this, co);
  }]);
  _es6_module.add_class(VectorVertex);
  VectorVertex = _es6_module.add_export('VectorVertex', VectorVertex);
  var QuadBezPath=_ESClass("QuadBezPath", [function QuadBezPath() {
    this.off = new Vector2();
    this.id = -1;
    this.z = undefined;
    this.blur = 0;
    this.size = [-1, -1];
    this.index = -1;
    this.color = new Vector4();
    this.aabb = [new Vector2(), new Vector2()];
    this.clip_paths = new set();
    this.clip_users = new set();
  }, function add_clip_path(path) {
    if (!this.clip_paths.has(path)) {
        this.update();
    }
    path.clip_users.add(this);
    this.clip_paths.add(path);
  }, function reset_clip_paths() {
    if (this.clip_paths.length>0) {
    }
    var __iter_path=__get_iter(this.clip_paths);
    var path;
    while (1) {
      var __ival_path=__iter_path.next();
      if (__ival_path.done) {
          break;
      }
      path = __ival_path.value;
      path.clip_users.remove(this);
    }
    this.clip_paths.reset();
  }, function update_aabb(draw, fast_mode) {
    if (fast_mode==undefined) {
        fast_mode = false;
    }
    throw new Error("implement me!");
  }, function beginPath() {
    throw new Error("implement me");
  }, function undo() {
    throw new Error("implement me");
  }, function moveTo(x, y) {
    this.lastx = x;
    this.lasty = y;
  }, function bezierTo(x2, y2, x3, y3) {
    this.lastx = x3;
    this.lasty = y3;
  }, function cubicTo(x2, y2, x3, y3, x4, y4, subdiv) {
    if (subdiv==undefined) {
        subdiv = 1;
    }
    var x1=this.lastx, y1=this.lasty;
    if (subdiv>0) {
        var dx1=(x2-x1)*0.5, dy1=(y2-y1)*0.5;
        var dx2=(x4-x3)*0.5, dy2=(y4-y3)*0.5;
        var dxmid=(x3+x4-x2-x1)*0.25;
        var dymid=(y3+y4-y2-y1)*0.25;
        var midx=(3*x3+x4+3*x2+x1)/8.0;
        var midy=(3*y3+y4+3*y2+y1)/8.0;
        this.cubicTo(x2+dx1, y2+dy1, midx-dxmid, midy-dymid, midx, midy, subdiv-1);
        this.cubicTo(midx+dxmid, midy+dymid, x4-dx2, y4-dy2, x4, y4, subdiv-1);
        return ;
    }
    var dx1=(x2-x1)*3.0, dy1=(y2-y1)*3.0;
    var dx2=(x4-x3)*3.0, dy2=(y4-y3)*3.0;
    var tdiv=(dx1*dy2-dx2*dy1);
    var t=(-(x1-x4)*dy2+(y1-y4)*dx2);
    var midx, midy;
    if (tdiv!=0.0) {
        t/=tdiv;
        midx = x1+dx1*t;
        midy = y1+dy1*t;
    }
    else {
      midx = (x2+x3)*0.5;
      midy = (y2+y3)*0.5;
    }
    this.bezierTo(midx, midy, x4, y4);
    this.lastx = x4;
    this.lasty = y4;
  }, function lineTo(x2, y2) {
    this.lastx = x2;
    this.lasty = y2;
  }, function destroy(draw) {
  }, function reset(draw) {
    this.pan.zero();
  }, function draw(draw, offx, offy) {
    if (offx==undefined) {
        offx = 0;
    }
    if (offy==undefined) {
        offy = 0;
    }
  }, function update() {
    throw new Error("implement me!");
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    return this.id;
  })]);
  _es6_module.add_class(QuadBezPath);
  QuadBezPath = _es6_module.add_export('QuadBezPath', QuadBezPath);
  var pop_transform_rets=new cachering(function() {
    return new Matrix4();
  }, 32);
  var VectorDraw=_ESClass("VectorDraw", [function VectorDraw() {
    this.pan = new Vector2();
    this.do_blur = true;
    this.matstack = new Array(256);
    for (var i=0; i<this.matstack.length; i++) {
        this.matstack[i] = new Matrix4();
    }
    this.matstack.cur = 0;
    this.matrix = new Matrix4();
  }, function get_path(id, z, check_z) {
    if (check_z==undefined) {
        check_z = true;
    }
    if (z===undefined) {
        throw new Error("z cannot be undefined");
    }
    throw new Error("implement me");
  }, function has_path(id, z, check_z) {
    if (check_z==undefined) {
        check_z = true;
    }
    if (z===undefined) {
        throw new Error("z cannot be undefined");
    }
    throw new Error("implement me");
  }, function remove(path) {
    var __iter_path2=__get_iter(path.clip_users);
    var path2;
    while (1) {
      var __ival_path2=__iter_path2.next();
      if (__ival_path2.done) {
          break;
      }
      path2 = __ival_path2.value;
      path2.clip_paths.remove(path);
      path2.update();
    }
    delete this.path_idmap[path.id];
    this.paths.remove(path);
    path.destroy(this);
  }, function update() {
    throw new Error("implement me");
  }, function destroy() {
    throw new Error("implement me");
  }, function draw() {
    throw new Error("implement me");
  }, function push_transform(mat, multiply_instead_of_load) {
    if (multiply_instead_of_load==undefined) {
        multiply_instead_of_load = true;
    }
    this.matstack[this.matstack.cur++].load(this.matrix);
    if (mat!=undefined&&multiply_instead_of_load) {
        this.matrix.multiply(mat);
    }
    else 
      if (mat!=undefined) {
        this.matrix.load(mat);
    }
  }, function pop_transform() {
    var ret=pop_transform_rets.next();
    ret.load(this.matrix);
    this.matrix.load(this.matstack[--this.matstack.cur]);
    return ret;
  }, function translate(x, y) {
    this.matrix.translate(x, y);
  }, function scale(x, y) {
    this.matrix.scale(x, y, 1.0);
  }, function rotate(th) {
    this.matrix.euler_rotate(0, 0, th);
  }, function set_matrix(matrix) {
    this.matrix.load(matrix);
  }, function get_matrix() {
    return this.matrix;
  }]);
  _es6_module.add_class(VectorDraw);
  VectorDraw = _es6_module.add_export('VectorDraw', VectorDraw);
});
es6_module_define('vectordraw_canvas2d', ["vectordraw_base", "mathlib", "config"], function _vectordraw_canvas2d_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, 'config');
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, 'vectordraw_base', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, 'vectordraw_base', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, 'vectordraw_base', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, 'vectordraw_base', 'VectorDraw');
  var canvaspath_draw_mat_tmps=new cachering(function() {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(8);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function() {
    return new Vector2();
  }, 32);
  var CCMD=0, CARGLEN=1;
  var MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3;
  var CanvasPath=_ESClass("CanvasPath", QuadBezPath, [function CanvasPath() {
    QuadBezPath.call(this);
    this.commands = [];
    this.recalc = 1;
    this.lastx = 0;
    this.lasty = 0;
    this.canvas = undefined;
    this.g = undefined;
    this.path_start_i = 0;
    this.first = true;
    this._mm = new MinMax(2);
  }, function update_aabb(draw, fast_mode) {
    if (fast_mode==undefined) {
        fast_mode = false;
    }
    var tmp=new Vector2();
    var mm=this._mm;
    var pad=this.pad = this.blur>0 ? this.blur+15 : 0;
    mm.reset();
    if (fast_mode) {
        console.trace("FAST MODE!");
    }
    var prev=-1;
    var cs=this.commands, i=0;
    while (i<cs.length) {
      var cmd=cs[i++];
      var arglen=cs[i++];
      if (fast_mode&&prev!=BEGINPATH) {
          prev = cmd;
          i+=arglen;
          continue;
      }
      for (var j=0; j<arglen; j+=2) {
          tmp[0] = cs[i++], tmp[1] = cs[i++];
          tmp.multVecMatrix(draw.matrix);
          tmp.add(draw.pan);
          mm.minmax(tmp);
      }
      prev = cmd;
    }
    this.aabb[0].load(mm.min).subScalar(pad);
    this.aabb[1].load(mm.max).addScalar(pad);
  }, function beginPath() {
    this.path_start_i = this.commands.length;
    this._pushCmd(BEGINPATH);
  }, function undo() {
    this.commands.length = this.path_start_i;
  }, function _pushCmd() {
    this.commands.push(arguments[0]);
    var arglen=arguments.length-1;
    this.commands.push(arglen);
    for (var i=0; i<arglen; i++) {
        this.commands.push(arguments[i+1]);
    }
    this.recalc = 1;
    this.first = false;
  }, function moveTo(x, y) {
    this._pushCmd(MOVETO, x, y);
    this.lastx = x;
    this.lasty = y;
  }, function bezierTo(x2, y2, x3, y3) {
    this._pushCmd(BEZIERTO, x2, y2, x3, y3);
    this.lastx = x3;
    this.lasty = y3;
  }, function lineTo(x2, y2) {
    if (this.first) {
        this.moveTo(x2, y2);
        return ;
    }
    this._pushCmd(LINETO, x2, y2);
    this.lastx = x2;
    this.lasty = y2;
  }, function destroy(draw) {
    this.canvas = this.g = undefined;
  }, function gen(draw, _check_tag) {
    if (_check_tag==undefined) {
        _check_tag = 0;
    }
    if (_check_tag&&!this.recalc) {
        console.log("infinite loop in clip stack");
        return ;
    }
    this.recalc = 0;
    var do_clip=this.clip_paths.length>0;
    var do_blur=this.blur>0.0;
    this.update_aabb(draw);
    var w=this.size[0] = Math.ceil(this.aabb[1][0]-this.aabb[0][0]);
    var h=this.size[1] = Math.ceil(this.aabb[1][1]-this.aabb[0][1]);
    if (w>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE||h>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE) {
        var w2=Math.min(w, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
        var h2=Math.min(h, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
        var dw=w-w2, dh=h-h2;
        this.aabb[0][0]+=dw*0.5;
        this.aabb[0][1]+=dh*0.5;
        this.aabb[1][0]-=dw*0.5;
        this.aabb[1][1]-=dh*0.5;
        this.size[0] = w2;
        this.size[1] = h2;
        w = w2, h = h2;
    }
    if (this.canvas==undefined) {
        this.canvas = document.createElement("canvas");
        this.canvas.style.background = "rgba(0.0, 0.0, 0.0, 0.0)";
        this.g = this.canvas.getContext("2d");
    }
    if (this.g==undefined) {
        console.log("render error!", this.id, this.size[0], this.size[1], this.canvas, this);
        return ;
    }
    if (this.canvas.width!=w||this.canvas.height!=h) {
        this.canvas.width = w;
        this.canvas.height = h;
    }
    this.g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.g.globalCompositeOperation = "source-over";
    var __iter_path=__get_iter(this.clip_paths);
    var path;
    while (1) {
      var __ival_path=__iter_path.next();
      if (__ival_path.done) {
          break;
      }
      path = __ival_path.value;
      if (path.recalc) {
          console.log("  clipping subgen!");
          path.gen(draw, 1);
      }
      path.draw(draw, -this.aabb[0][0], -this.aabb[0][1], this.canvas, this.g);
    }
    if (do_clip) {
        this.g.oldGlobalCompositeOperation = this.g.globalCompositeOperation;
        this.g.globalCompositeOperation = "source-atop";
    }
    var mat1=canvaspath_draw_mat_tmps.next();
    var mat=canvaspath_draw_mat_tmps.next();
    mat1.makeIdentity(), mat.makeIdentity();
    mat1.translate(-this.aabb[0][0], -this.aabb[0][1]);
    mat.makeIdentity();
    mat.load(draw.matrix);
    mat.preMultiply(mat1);
    var co=canvaspath_draw_vs.next().zero();
    var r=~~(this.color[0]*255), g=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
    this.g.fillStyle = "rgba("+r+","+g+","+b+","+a+")";
    if (do_blur) {
        var doff=25000;
        this.g.translate(-doff, -doff);
        this.g.shadowOffsetX = doff;
        this.g.shadowOffsetY = doff;
        this.g.shadowColor = "rgba("+r+","+g+","+b+","+a+")";
        this.g.shadowBlur = this.blur;
    }
    this.g.beginPath();
    var cs=this.commands, i=0;
    while (i<cs.length) {
      var cmd=cs[i++];
      var arglen=cs[i++];
      var tmp=canvaspath_draw_args_tmps[arglen];
      for (var j=0; j<arglen; j+=2) {
          co[0] = cs[i++], co[1] = cs[i++];
          co.multVecMatrix(mat);
          co.add(draw.pan);
          tmp[j] = co[0], tmp[j+1] = co[1];
      }
      switch (cmd) {
        case MOVETO:
          this.g.moveTo(tmp[0], tmp[1]);
          break;
        case LINETO:
          this.g.lineTo(tmp[0], tmp[1]);
          break;
        case BEZIERTO:
          this.g.quadraticCurveTo(tmp[0], tmp[1], tmp[2], tmp[3]);
          break;
        case BEGINPATH:
          this.g.beginPath();
          break;
      }
    }
    this.g.fill();
    if (do_blur) {
        this.g.translate(doff, doff);
        this.g.shadowOffsetX = this.g.shadowOffsetY = 0.0;
        this.g.shadowBlur = 0.0;
    }
    if (do_clip) {
        this.g.globalCompositeOperation = this.g.oldGlobalCompositeOperation;
    }
  }, function reset(draw) {
    this.commands.length = 0;
    this.path_start_i = 0;
    this.off.zero();
    this.first = true;
  }, function draw(draw, offx, offy, canvas, g) {
    if (offx==undefined) {
        offx = 0;
    }
    if (offy==undefined) {
        offy = 0;
    }
    if (canvas==undefined) {
        canvas = draw.canvas;
    }
    if (g==undefined) {
        g = draw.g;
    }
    offx+=this.off[0], offy+=this.off[1];
    if (this.recalc) {
        this.recalc = 0;
        this.gen(draw);
    }
    g.imageSmoothingEnabled = false;
    if (g._drawImage!=undefined) {
        g._drawImage(this.canvas, this.aabb[0][0]+offx, this.aabb[0][1]+offy);
    }
    else {
      g.drawImage(this.canvas, this.aabb[0][0]+offx, this.aabb[0][1]+offy);
    }
  }, function update() {
    this.recalc = 1;
  }]);
  _es6_module.add_class(CanvasPath);
  CanvasPath = _es6_module.add_export('CanvasPath', CanvasPath);
  var CanvasDraw2D=_ESClass("CanvasDraw2D", VectorDraw, [function CanvasDraw2D() {
    VectorDraw.call(this);
    this.paths = [];
    this.path_idmap = {}
    this.dosort = true;
    this.matstack = new Array(256);
    this.matrix = new Matrix4();
    this._last_pan = new Vector2();
    for (var i=0; i<this.matstack.length; i++) {
        this.matstack[i] = new Matrix4();
    }
    this.matstack.cur = 0;
    this.canvas = undefined;
    this.g = undefined;
  }, function has_path(id, z, check_z) {
    if (check_z==undefined) {
        check_z = true;
    }
    if (z===undefined) {
        throw new Error("z cannot be undefined");
    }
    if (!(id in this.path_idmap)) {
        return false;
    }
    var path=this.path_idmap[id];
    return check_z ? path.z==z : true;
  }, function get_path(id, z, check_z) {
    if (check_z==undefined) {
        check_z = true;
    }
    if (z===undefined) {
        throw new Error("z cannot be undefined");
    }
    if (!(id in this.path_idmap)) {
        this.path_idmap[id] = new CanvasPath();
        this.path_idmap[id].index = this.paths.length;
        this.path_idmap[id].id = id;
        this.paths.push(this.path_idmap[id]);
    }
    var ret=this.path_idmap[id];
    if (check_z&&ret.z!=z) {
        this.dosort = 1;
        ret.z = z;
    }
    return ret;
  }, function update() {
    var __iter_path=__get_iter(this.paths);
    var path;
    while (1) {
      var __ival_path=__iter_path.next();
      if (__ival_path.done) {
          break;
      }
      path = __ival_path.value;
      path.update(this);
    }
  }, function destroy() {
    var __iter_path=__get_iter(this.paths);
    var path;
    while (1) {
      var __ival_path=__iter_path.next();
      if (__ival_path.done) {
          break;
      }
      path = __ival_path.value;
      path.destroy(this);
    }
  }, function draw(g) {
    var canvas=g.canvas;
    var off=canvaspath_draw_vs.next();
    off.load(this.pan).sub(this._last_pan);
    this._last_pan.load(this.pan);
    var __iter_path=__get_iter(this.paths);
    var path;
    while (1) {
      var __ival_path=__iter_path.next();
      if (__ival_path.done) {
          break;
      }
      path = __ival_path.value;
      if (!path.recalc) {
          continue;
      }
      var __iter_path2=__get_iter(path.clip_users);
      var path2;
      while (1) {
        var __ival_path2=__iter_path2.next();
        if (__ival_path2.done) {
            break;
        }
        path2 = __ival_path2.value;
        path2.recalc = 1;
      }
    }
    var __iter_path=__get_iter(this.paths);
    var path;
    while (1) {
      var __ival_path=__iter_path.next();
      if (__ival_path.done) {
          break;
      }
      path = __ival_path.value;
      if (!path.recalc) {
          path.off.add(off);
      }
    }
    this.canvas = canvas;
    this.g = g;
    if (this.dosort) {
        console.log("SORT");
        this.dosort = 0;
        this.paths.sort(function(a, b) {
          return a.z-b.z;
        });
    }
    var __iter_path=__get_iter(this.paths);
    var path;
    while (1) {
      var __ival_path=__iter_path.next();
      if (__ival_path.done) {
          break;
      }
      path = __ival_path.value;
      if (path.hidden) {
          continue;
      }
      path.draw(this);
    }
  }, function set_matrix(matrix) {
    VectorDraw.prototype.set_matrix.call(this, matrix);
  }]);
  _es6_module.add_class(CanvasDraw2D);
  CanvasDraw2D = _es6_module.add_export('CanvasDraw2D', CanvasDraw2D);
});
es6_module_define('vectordraw_canvas2d_simple', ["vectordraw_base", "config", "mathlib"], function _vectordraw_canvas2d_simple_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, 'config');
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, 'vectordraw_base', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, 'vectordraw_base', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, 'vectordraw_base', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, 'vectordraw_base', 'VectorDraw');
  var $_Tzv_awthis_1=this;
  var canvaspath_draw_mat_tmps=new cachering(function(_) {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(8);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function() {
    return new Vector2();
  }, 32);
  var CCMD=0, CARGLEN=1;
  var MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3;
  var NS="http://www.w3.org/2000/svg";
  var XLS="http://www.w3.org/1999/xlink";
  function makeElement(type, attrs) {
    if (attrs==undefined) {
        attrs = {};
    }
    var ret=document.createElementNS(NS, type);
    for (var k in attrs) {
        ret.setAttributeNS(null, k, attrs[k]);
    }
    return ret;
  }
  makeElement = _es6_module.add_export('makeElement', makeElement);
  var SimpleCanvasPath=_ESClass("SimpleCanvasPath", QuadBezPath, [function SimpleCanvasPath() {
    QuadBezPath.call(this);
    this.commands = [];
    this.recalc = 1;
    this.lastx = 0;
    this.lasty = 0;
    this._last_z = undefined;
    this._last_off = new Vector2();
    this._last_off[0] = this._last_off[1] = 1e+17;
    this.domnode = undefined;
    this.filternode = undefined;
    this.clip_users = new set();
    this.path_start_i = 0;
    this.first = true;
    this._mm = new MinMax(2);
  }, function update_aabb(draw, fast_mode) {
    if (fast_mode==undefined) {
        fast_mode = false;
    }
    var tmp=new Vector2();
    var mm=this._mm;
    var pad=this.pad = this.blur>0 ? this.blur*draw.zoom+15 : 0;
    mm.reset();
    if (fast_mode) {
        console.trace("FAST MODE!");
    }
    var prev=-1;
    var cs=this.commands, i=0;
    while (i<cs.length) {
      var cmd=cs[i++];
      var arglen=cs[i++];
      if (fast_mode&&prev!=BEGINPATH) {
          prev = cmd;
          i+=arglen;
          continue;
      }
      for (var j=0; j<arglen; j+=2) {
          tmp[0] = cs[i++], tmp[1] = cs[i++];
          tmp.multVecMatrix(draw.matrix);
          mm.minmax(tmp);
      }
      prev = cmd;
    }
    this.aabb[0].load(mm.min).subScalar(pad);
    this.aabb[1].load(mm.max).addScalar(pad);
  }, function beginPath() {
    this.path_start_i = this.commands.length;
    this._pushCmd(BEGINPATH);
  }, function undo() {
    this.commands.length = this.path_start_i;
  }, function _pushCmd() {
    var arglen=arguments.length-1;
    this.commands.push(arguments[0]);
    this.commands.push(arglen);
    for (var i=0; i<arglen; i++) {
        this.commands.push(arguments[i+1]);
    }
    this.recalc = 1;
    this.first = false;
  }, function moveTo(x, y) {
    this._pushCmd(MOVETO, x, y);
    this.lastx = x;
    this.lasty = y;
  }, function bezierTo(x2, y2, x3, y3) {
    this._pushCmd(BEZIERTO, x2, y2, x3, y3);
    this.lastx = x3;
    this.lasty = y3;
  }, function lineTo(x2, y2) {
    if (this.first) {
        this.moveTo(x2, y2);
        return ;
    }
    this._pushCmd(LINETO, x2, y2);
    this.lastx = x2;
    this.lasty = y2;
  }, function destroy(draw) {
  }, function gen(draw, _check_tag) {
    if (_check_tag==undefined) {
        _check_tag = 0;
    }
  }, function reset(draw) {
    this.commands.length = 0;
    this.path_start_i = 0;
    this.off.zero();
    this._last_off[0] = this._last_off[1] = 1e+17;
    this.first = true;
  }, function draw(draw, offx, offy, canvas, g) {
    if (offx==undefined) {
        offx = 0;
    }
    if (offy==undefined) {
        offy = 0;
    }
    if (canvas==undefined) {
        canvas = draw.canvas;
    }
    if (g==undefined) {
        g = draw.g;
    }
    offx+=this.off[0], offy+=this.off[1];
    this._last_z = this.z;
    var g=draw.g;
    var tmp=new Vector3();
    g.beginPath();
    for (var i=0; i<this.commands.length; i+=this.commands[i+1]+2) {
        var cmd=this.commands[i];
        switch (cmd) {
          case BEGINPATH:
            g.beginPath();
            break;
          case LINETO:
            tmp[0] = cmd[i+2], tmp[1] = cmd[i+3], tmp[2] = 0.0;
            tmp.multVecMatrix(draw.matrix);
            g.lineTo(tmp[0], tmp[1]);
            break;
          case BEZIERTO:
            tmp[0] = cmd[i+2], tmp[1] = cmd[i+3], tmp[2] = 0.0;
            tmp.multVecMatrix(draw.matrix);
            var x1=tmp[0], y1=tmp[1];
            tmp[0] = cmd[i+4], tmp[1] = cmd[i+5], tmp[2] = 0.0;
            tmp.multVecMatrix(draw.matrix);
            g.quadraticCurveTo(x1, y1, tmp[0], tmp[1]);
            break;
          case MOVETO:
            tmp[0] = cmd[i+2], tmp[1] = cmd[i+3], tmp[2] = 0.0;
            tmp.multVecMatrix(draw.matrix);
            g.moveTo(tmp[0], tmp[1]);
            break;
        }
    }
    var r=~~(this.color[0]*255), g1=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
    g.fillStyle = "rgba("+r+","+g1+","+b+","+a+")";
    var doff=25000;
    var do_blur=this.blur>1;
    if (do_blur) {
        g.translate(-doff, -doff);
        g.shadowOffsetX = doff;
        g.shadowOffsetY = doff;
        g.shadowColor = "rgba("+r+","+g+","+b+","+a+")";
        g.shadowBlur = this.blur;
    }
    else {
      g.shadowOffsetX = 0;
      g.shadowOffsetY = 0;
      g.shadowBlur = 0;
    }
    g.fill();
    if (do_blur) {
        g.translate(doff, doff);
    }
  }, function update() {
    this.recalc = 1;
  }]);
  _es6_module.add_class(SimpleCanvasPath);
  SimpleCanvasPath = _es6_module.add_export('SimpleCanvasPath', SimpleCanvasPath);
  var SimpleCanvasDraw2D=_ESClass("SimpleCanvasDraw2D", VectorDraw, [function SimpleCanvasDraw2D() {
    VectorDraw.call(this);
    this.paths = [];
    this.path_idmap = {}
    this.dosort = true;
    this.matstack = new Array(256);
    this.matrix = new Matrix4();
    for (var i=0; i<this.matstack.length; i++) {
        this.matstack[i] = new Matrix4();
    }
    this.matstack.cur = 0;
  }, _ESClass.static(function get_canvas(id, width, height, zindex) {
    var ret=document.getElementById(id);
    if (ret==undefined) {
        ret = document.createElement("canvas");
        ret.id = id;
    }
    ret.width = width;
    ret.height = height;
    if (ret.style!=undefined) {
        ret.style["z-index"] = zindex;
    }
    return ret;
  }), function has_path(id, z, check_z) {
    if (check_z==undefined) {
        check_z = true;
    }
    if (z===undefined) {
        throw new Error("z cannot be undefined");
    }
    if (!(id in this.path_idmap)) {
        return false;
    }
    var path=this.path_idmap[id];
    return check_z ? path.z==z : true;
  }, function get_path(id, z, check_z) {
    if (check_z==undefined) {
        check_z = true;
    }
    if (z===undefined) {
        throw new Error("z cannot be undefined");
    }
    if (!(id in this.path_idmap)) {
        this.path_idmap[id] = new SimpleCanvasPath();
        this.path_idmap[id].index = this.paths.length;
        this.path_idmap[id].id = id;
        this.dosort = 1;
        this.paths.push(this.path_idmap[id]);
    }
    var ret=this.path_idmap[id];
    if (check_z&&ret.z!=z) {
        this.dosort = 1;
        ret.z = z;
    }
    return ret;
  }, function update() {
  }, _ESClass.static(function kill_canvas(svg) {
  }), function destroy() {
  }, function draw(g) {
    var canvas=g.canvas;
    canvas.style["background"] = "rgba(0,0,0,0)";
    this.canvas = canvas;
    this.g = g;
    var __iter_p=__get_iter(this.paths);
    var p;
    while (1) {
      var __ival_p=__iter_p.next();
      if (__ival_p.done) {
          break;
      }
      p = __ival_p.value;
      p.draw(this);
    }
  }, function set_matrix(matrix) {
    VectorDraw.prototype.set_matrix.call(this, matrix);
    this.zoom = matrix.$matrix.m11;
  }]);
  _es6_module.add_class(SimpleCanvasDraw2D);
  SimpleCanvasDraw2D = _es6_module.add_export('SimpleCanvasDraw2D', SimpleCanvasDraw2D);
});
es6_module_define('vectordraw_svg', ["vectordraw_base", "config", "mathlib"], function _vectordraw_svg_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, 'config');
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, 'vectordraw_base', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, 'vectordraw_base', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, 'vectordraw_base', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, 'vectordraw_base', 'VectorDraw');
  var $_ykuJawthis_1=this;
  var canvaspath_draw_mat_tmps=new cachering(function(_) {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(8);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function() {
    return new Vector2();
  }, 32);
  var CCMD=0, CARGLEN=1;
  var MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3;
  var NS="http://www.w3.org/2000/svg";
  var XLS="http://www.w3.org/1999/xlink";
  function makeElement(type, attrs) {
    if (attrs==undefined) {
        attrs = {};
    }
    var ret=document.createElementNS(NS, type);
    for (var k in attrs) {
        ret.setAttributeNS(null, k, attrs[k]);
    }
    return ret;
  }
  makeElement = _es6_module.add_export('makeElement', makeElement);
  var SVGPath=_ESClass("SVGPath", QuadBezPath, [function SVGPath() {
    QuadBezPath.call(this);
    this.commands = [];
    this.recalc = 1;
    this.lastx = 0;
    this.lasty = 0;
    this._last_z = undefined;
    this._last_off = new Vector2();
    this._last_off[0] = this._last_off[1] = 1e+17;
    this.domnode = undefined;
    this.filternode = undefined;
    this.clip_users = new set();
    this.path_start_i = 0;
    this.first = true;
    this._mm = new MinMax(2);
  }, function update_aabb(draw, fast_mode) {
    if (fast_mode==undefined) {
        fast_mode = false;
    }
    var tmp=new Vector2();
    var mm=this._mm;
    var pad=this.pad = this.blur>0 ? this.blur*draw.zoom+15 : 0;
    mm.reset();
    if (fast_mode) {
        console.trace("FAST MODE!");
    }
    var prev=-1;
    var cs=this.commands, i=0;
    while (i<cs.length) {
      var cmd=cs[i++];
      var arglen=cs[i++];
      if (fast_mode&&prev!=BEGINPATH) {
          prev = cmd;
          i+=arglen;
          continue;
      }
      for (var j=0; j<arglen; j+=2) {
          tmp[0] = cs[i++], tmp[1] = cs[i++];
          tmp.multVecMatrix(draw.matrix);
          mm.minmax(tmp);
      }
      prev = cmd;
    }
    this.aabb[0].load(mm.min).subScalar(pad);
    this.aabb[1].load(mm.max).addScalar(pad);
  }, function beginPath() {
    this.path_start_i = this.commands.length;
    this._pushCmd(BEGINPATH);
  }, function undo() {
    this.commands.length = this.path_start_i;
  }, function _pushCmd() {
    this.commands.push(arguments[0]);
    var arglen=arguments.length-1;
    this.commands.push(arglen);
    for (var i=0; i<arglen; i++) {
        this.commands.push(arguments[i+1]);
    }
    this.recalc = 1;
    this.first = false;
  }, function moveTo(x, y) {
    this._pushCmd(MOVETO, x, y);
    this.lastx = x;
    this.lasty = y;
  }, function bezierTo(x2, y2, x3, y3) {
    this._pushCmd(BEZIERTO, x2, y2, x3, y3);
    this.lastx = x3;
    this.lasty = y3;
  }, function lineTo(x2, y2) {
    if (this.first) {
        this.moveTo(x2, y2);
        return ;
    }
    this._pushCmd(LINETO, x2, y2);
    this.lastx = x2;
    this.lasty = y2;
  }, function destroy(draw) {
    if (this.domnode!=undefined) {
        this.domnode.remove();
        this.domnode = undefined;
    }
    if (this.filternode!=undefined) {
        this.filternode.remove();
        this.filternode = undefined;
    }
    if (this.usenode!=undefined) {
        this.usenode.remove();
        this.usenode = undefined;
    }
  }, function get_dom_id(draw) {
    return draw.svg.id+"_path_"+this.id;
  }, function gen(draw, _check_tag) {
    if (_check_tag==undefined) {
        _check_tag = 0;
    }
    if (_check_tag&&!this.recalc) {
        console.log("infinite loop in clip stack");
        return ;
    }
    this.recalc = 0;
    var do_clip=this.clip_paths.length>0;
    var do_blur=this.blur>0.0;
    this.update_aabb(draw);
    var w=this.size[0] = Math.ceil(this.aabb[1][0]-this.aabb[0][0]);
    var h=this.size[1] = Math.ceil(this.aabb[1][1]-this.aabb[0][1]);
    if (w>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE||h>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE) {
        var w2=Math.min(w, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
        var h2=Math.min(h, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
        var dw=w-w2, dh=h-h2;
        this.aabb[0][0]+=dw*0.5;
        this.aabb[0][1]+=dh*0.5;
        this.aabb[1][0]-=dw*0.5;
        this.aabb[1][1]-=dh*0.5;
        this.size[0] = w2;
        this.size[1] = h2;
        w = w2, h = h2;
    }
    var domid=this.get_dom_id(draw);
    var node=this.domnode;
    if (node==undefined) {
        node = this.domnode = document.getElementById(domid);
        if (node==undefined) {
            node = this.domnode = makeElement("path");
            node.id = domid;
            node.setAttributeNS(null, "id", domid);
            draw.defs.appendChild(node);
            var useid=domid+"_use";
            var usenode=document.getElementById(useid);
            if (usenode!=undefined) {
                usenode.remove();
            }
            usenode = makeElement("use", {"id": useid});
            usenode.setAttributeNS(XLS, "xlink:href", "#"+domid);
            draw.group.appendChild(usenode);
            this.usenode = usenode;
        }
    }
    if (this.usenode==undefined) {
        this.usenode = document.getElementById(domid+"_use");
    }
    for (var i=0; i<draw.group.childNodes.length; i++) {
        if (draw.group.childNodes[i]===this.usenode) {
            this._last_z = i;
            break;
        }
    }
    var fid=draw.svg.id+"_"+this.id+"_blur";
    var blur, filter;
    if (this.blur*draw.zoom>1) {
        if (this.filternode==undefined) {
            filter = this.filternode = document.getElementById(fid);
        }
        else {
          filter = this.filternode;
        }
        var w2=w-this.pad*2, h2=h-this.pad*2;
        var wratio=2.0*(w/w2)*100.0, hratio=2.0*(h/h2)*100.0;
        var fx=""+(-wratio/4)+"%", fy=""+(-hratio/4)+"%", fwidth=""+wratio+"%", fheight=""+hratio+"%";
        if (filter==undefined) {
            var defs=draw.defs;
            var filter=this.filternode = makeElement("filter", {id: fid, x: fx, y: fy, width: fwidth, height: fheight});
            var blur=makeElement("feGaussianBlur", {stdDeviation: ~~(this.blur*draw.zoom*0.5), "in": "SourceGraphic"});
            filter.appendChild(blur);
            defs.appendChild(filter);
            node.setAttributeNS(null, "filter", "url(#"+fid+")");
        }
        else {
          if (filter.getAttributeNS(null, "x")!=fx)
            filter.setAttributeNS(null, "x", fx);
          if (filter.getAttributeNS(null, "y")!=fy)
            filter.setAttributeNS(null, "y", fy);
          if (filter.getAttributeNS(null, "width")!=fwidth)
            filter.setAttributeNS(null, "width", fwidth);
          if (filter.getAttributeNS(null, "height")!=fheight)
            filter.setAttributeNS(null, "hratio", fheight);
          blur = filter.childNodes[0];
          if (!blur.hasAttributeNS(null, "stdDeviation")||parseFloat(blur.getAttributeNS(null, "stdDeviation"))!=~~(this.blur*draw.zoom*0.5)) {
              blur.setAttributeNS(null, "stdDeviation", ~~(this.blur*draw.zoom*0.5));
          }
        }
    }
    else 
      if (this.filternode!=undefined) {
        node.removeAttributeNS(null, "filter");
        this.filternode.remove();
        this.filternode = undefined;
    }
    var clipid=draw.svg.id+"_"+this.id+"_clip";
    if (this.clip_paths.length>0) {
        var clip=this.clipnode;
        if (clip==undefined) {
            clip = this.clipnode = document.getElementById(clipid);
        }
        if (clip==undefined) {
            clip = this.clipnode = makeElement("clipPath", {id: clipid});
            draw.defs.appendChild(clip);
            var __iter_path=__get_iter(this.clip_paths);
            var path;
            while (1) {
              var __ival_path=__iter_path.next();
              if (__ival_path.done) {
                  break;
              }
              path = __ival_path.value;
              if (path.recalc) {
                  console.log("  clipping subgen!");
                  path.gen(draw, 1);
              }
              var usenode=makeElement("use");
              usenode.setAttributeNS(XLS, "xlink:href", "#"+path.domnode.getAttributeNS(null, "id"));
              clip.appendChild(usenode);
            }
        }
        node.setAttributeNS(null, "clip-path", "url(#"+clipid+")");
    }
    else 
      if (this.clipnode!=undefined) {
        node.removeAttributeNS(null, "clip-path");
        this.clipnode.remove();
        this.clipnode = undefined;
    }
    var mat=canvaspath_draw_mat_tmps.next();
    mat.load(draw.matrix);
    var co=canvaspath_draw_vs.next().zero();
    if (node==undefined) {
        node = document.getElementById(domid);
        console.log("undefined node!", this.domnode, document.getElementById(domid), domid);
        return ;
    }
    var r=~~(this.color[0]*255), g=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
    node.setAttributeNS(null, "fill", "rgba("+r+","+g+","+b+","+a+")");
    var d="";
    var cs=this.commands, i=0;
    while (i<cs.length) {
      var cmd=cs[i++];
      var arglen=cs[i++];
      var tmp=canvaspath_draw_args_tmps[arglen];
      var h=parseFloat(draw.svg.getAttributeNS(null, "height"));
      for (var j=0; j<arglen; j+=2) {
          co[0] = cs[i++], co[1] = cs[i++];
          co.multVecMatrix(mat);
          if (isNaN(co[0])) {
              co[0] = 0;
          }
          if (isNaN(co[1])) {
              co[1] = 0;
          }
          tmp[j] = co[0], tmp[j+1] = co[1];
      }
      switch (cmd) {
        case MOVETO:
          d+="M"+tmp[0]+" "+tmp[1];
          break;
        case LINETO:
          d+="L"+tmp[0]+" "+tmp[1];
          break;
        case BEZIERTO:
          d+="Q"+tmp[0]+" "+tmp[1]+" "+tmp[2]+" "+tmp[3];
          break;
        case BEGINPATH:
          break;
      }
    }
    node.setAttributeNS(null, "d", d);
  }, function reset(draw) {
    this.commands.length = 0;
    this.path_start_i = 0;
    this.off.zero();
    this._last_off[0] = this._last_off[1] = 1e+17;
    this.first = true;
  }, function draw(draw, offx, offy, canvas, g) {
    if (offx==undefined) {
        offx = 0;
    }
    if (offy==undefined) {
        offy = 0;
    }
    if (canvas==undefined) {
        canvas = draw.canvas;
    }
    if (g==undefined) {
        g = draw.g;
    }
    offx+=this.off[0], offy+=this.off[1];
    this._last_z = this.z;
    if (this.recalc) {
        this.recalc = 0;
        this.gen(draw);
    }
    if (this._last_off[0]!=offx||this._last_off[1]!=offy) {
        this._last_off[0] = offx;
        this._last_off[1] = offy;
        var transform="translate("+offx+","+offy+")";
        this.usenode.setAttributeNS(null, "transform", transform);
    }
  }, function update() {
    this.recalc = 1;
  }]);
  _es6_module.add_class(SVGPath);
  SVGPath = _es6_module.add_export('SVGPath', SVGPath);
  var SVGDraw2D=_ESClass("SVGDraw2D", VectorDraw, [function SVGDraw2D() {
    VectorDraw.call(this);
    this.paths = [];
    this.path_idmap = {}
    this.dosort = true;
    this.matstack = new Array(256);
    this.matrix = new Matrix4();
    for (var i=0; i<this.matstack.length; i++) {
        this.matstack[i] = new Matrix4();
    }
    this.matstack.cur = 0;
  }, _ESClass.static(function get_canvas(id, width, height, zindex) {
    var ret=document.getElementById(id);
    if (ret==undefined) {
        ret = makeElement("svg", {width: width, height: height});
        ret.id = id;
        ret.setAttributeNS(null, "id", id);
        ret.style["position"] = "absolute";
        ret.style["z-index"] = zindex;
        console.trace("\tZINDEX: ", zindex);
        document.body.appendChild(ret);
    }
    if (ret.width!=width) {
        ret.setAttributeNS(null, "width", width);
    }
    if (ret.height!=height) {
        ret.setAttributeNS(null, "height", height);
    }
    return ret;
  }), function has_path(id, z, check_z) {
    if (check_z==undefined) {
        check_z = true;
    }
    if (z===undefined) {
        throw new Error("z cannot be undefined");
    }
    if (!(id in this.path_idmap)) {
        return false;
    }
    var path=this.path_idmap[id];
    return check_z ? path.z==z : true;
  }, function get_path(id, z, check_z) {
    if (check_z==undefined) {
        check_z = true;
    }
    if (z===undefined) {
        throw new Error("z cannot be undefined");
    }
    if (!(id in this.path_idmap)) {
        this.path_idmap[id] = new SVGPath();
        this.path_idmap[id].index = this.paths.length;
        this.path_idmap[id].id = id;
        this.paths.push(this.path_idmap[id]);
    }
    var ret=this.path_idmap[id];
    if (check_z&&ret.z!=z) {
        this.dosort = 1;
        ret.z = z;
    }
    return ret;
  }, function update() {
    var __iter_path=__get_iter(this.paths);
    var path;
    while (1) {
      var __ival_path=__iter_path.next();
      if (__ival_path.done) {
          break;
      }
      path = __ival_path.value;
    }
  }, _ESClass.static(function kill_canvas(svg) {
    if (svg!=undefined) {
        svg.remove();
    }
  }), function destroy() {
    return ;
    console.log("DESTROY!");
    var __iter_path=__get_iter(this.paths);
    var path;
    while (1) {
      var __ival_path=__iter_path.next();
      if (__ival_path.done) {
          break;
      }
      path = __ival_path.value;
      path.destroy(this);
    }
    this.paths.length = 0;
    this.path_idmap = {}
    if (this.svg!=undefined) {
        this.svg.remove();
        this.svg = this.defs = undefined;
    }
  }, function draw(g) {
    var canvas=g.canvas;
    if (canvas.style["background"]!="rgba(0,0,0,0)") {
        canvas.style["background"] = "rgba(0,0,0,0)";
    }
    this.svg = SVGDraw2D.get_canvas(canvas.id+"_svg", canvas.width, canvas.height, 1);
    var this2=this;
    function onkillscreen() {
      window.removeEventListener(onkillscreen);
      SVGDraw2D.kill_canvas(this2.svg);
      this2.svg = undefined;
    }
    window.addEventListener("killscreen", onkillscreen);
    var defsid=this.svg.id+"_defs";
    var defs=document.getElementById(defsid);
    if (defs==undefined) {
        defs = makeElement("defs", {id: defsid});
        defs.id = defsid;
        this.svg.appendChild(defs);
    }
    this.defs = defs;
    var groupid=this.svg.id+"_maingroup";
    var group=document.getElementById(groupid);
    if (group==undefined) {
        group = makeElement("g", {id: groupid});
        this.svg.appendChild(group);
    }
    this.group = group;
    var transform="translate("+this.pan[0]+","+this.pan[1]+")";
    if (!group.hasAttributeNS(null, "transform")||group.getAttributeNS(null, "transform")!=transform) {
        group.setAttributeNS(null, "transform", transform);
    }
    if (this.svg.style["left"]!=canvas.style["left"])
      this.svg.style["left"] = canvas.style["left"];
    if (this.svg.style["top"]!=canvas.style["top"])
      this.svg.style["top"] = canvas.style["top"];
    var __iter_path=__get_iter(this.paths);
    var path;
    while (1) {
      var __ival_path=__iter_path.next();
      if (__ival_path.done) {
          break;
      }
      path = __ival_path.value;
      if (path.z!=path._last_z) {
          this.dosort = 1;
          path.recalc = 1;
          path._last_z = path.z;
      }
    }
    var __iter_path=__get_iter(this.paths);
    var path;
    while (1) {
      var __ival_path=__iter_path.next();
      if (__ival_path.done) {
          break;
      }
      path = __ival_path.value;
      if (path.recalc) {
          path.gen(this);
      }
    }
    if (this.dosort) {
        console.log("SVG sort!");
        this.dosort = 0;
        this.paths.sort(function(a, b) {
          return a.z-b.z;
        });
        var cs=this.group.childNodes;
        for (var i=0; i<cs.length; i++) {
            var n=cs[i];
            if (n.tagName.toUpperCase()=="USE") {
                n.remove();
                i--;
            }
        }
        var __iter_path=__get_iter(this.paths);
        var path;
        while (1) {
          var __ival_path=__iter_path.next();
          if (__ival_path.done) {
              break;
          }
          path = __ival_path.value;
          if (path.hidden) {
              path.usenode = undefined;
              continue;
          }
          var useid=path.get_dom_id(this)+"_use";
          var usenode=path.usenode = makeElement("use", {"id": useid});
          usenode.setAttributeNS(XLS, "xlink:href", "#"+path.get_dom_id(this));
          path._last_off[0] = path._last_off[1] = 1e+17;
          this.group.appendChild(usenode);
        }
    }
    var __iter_path=__get_iter(this.paths);
    var path;
    while (1) {
      var __ival_path=__iter_path.next();
      if (__ival_path.done) {
          break;
      }
      path = __ival_path.value;
      if (!path.hidden)
        path.draw(this);
    }
  }, function set_matrix(matrix) {
    VectorDraw.prototype.set_matrix.call(this, matrix);
    this.zoom = matrix.$matrix.m11;
  }]);
  _es6_module.add_class(SVGDraw2D);
  SVGDraw2D = _es6_module.add_export('SVGDraw2D', SVGDraw2D);
});
es6_module_define('vectordraw', ["vectordraw_svg", "vectordraw_base", "vectordraw_canvas2d"], function _vectordraw_module(_es6_module) {
  "use strict";
  var CanvasDraw2D=es6_import_item(_es6_module, 'vectordraw_canvas2d', 'CanvasDraw2D');
  var CanvasPath=es6_import_item(_es6_module, 'vectordraw_canvas2d', 'CanvasPath');
  var SVGDraw2D=es6_import_item(_es6_module, 'vectordraw_svg', 'SVGDraw2D');
  var SVGPath=es6_import_item(_es6_module, 'vectordraw_svg', 'SVGPath');
  var VectorFlags=es6_import_item(_es6_module, 'vectordraw_base', 'VectorFlags');
  var VectorFlags=VectorFlags;
  VectorFlags = _es6_module.add_export('VectorFlags', VectorFlags);
  var Canvas=CanvasDraw2D;
  Canvas = _es6_module.add_export('Canvas', Canvas);
  var Path=CanvasPath;
  Path = _es6_module.add_export('Path', Path);
});
es6_module_define('strokedraw', [], function _strokedraw_module(_es6_module) {
  "use strict";
});
es6_module_define('spline_draw_new', ["mathlib", "spline_math", "selectmode", "config", "spline_element_array", "vectordraw", "spline_types", "spline_multires", "animdata", "view2d_editor"], function _spline_draw_new_module(_es6_module) {
  "use strict";
  var aabb_isect_minmax2d=es6_import_item(_es6_module, 'mathlib', 'aabb_isect_minmax2d');
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var ENABLE_MULTIRES=es6_import_item(_es6_module, 'config', 'ENABLE_MULTIRES');
  var config=es6_import(_es6_module, 'config');
  var SessionFlags=es6_import_item(_es6_module, 'view2d_editor', 'SessionFlags');
  var SelMask=es6_import_item(_es6_module, 'selectmode', 'SelMask');
  var ORDER=es6_import_item(_es6_module, 'spline_math', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, 'spline_math', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, 'spline_math', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, 'spline_math', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, 'spline_math', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, 'spline_math', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, 'spline_math', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, 'spline_math', 'INT_STEPS');
  var get_vtime=es6_import_item(_es6_module, 'animdata', 'get_vtime');
  var iterpoints=es6_import_item(_es6_module, 'spline_multires', 'iterpoints');
  var MultiResLayer=es6_import_item(_es6_module, 'spline_multires', 'MultiResLayer');
  var MResFlags=es6_import_item(_es6_module, 'spline_multires', 'MResFlags');
  var has_multires=es6_import_item(_es6_module, 'spline_multires', 'has_multires');
  var spline_draw_cache_vs=cachering.fromConstructor(Vector3, 64);
  var spline_draw_trans_vs=cachering.fromConstructor(Vector3, 32);
  var PI=Math.PI;
  var pow=Math.pow, cos=Math.cos, sin=Math.sin, abs=Math.abs, floor=Math.floor, ceil=Math.ceil, sqrt=Math.sqrt, log=Math.log, acos=Math.acos, asin=Math.asin;
  var SplineFlags=es6_import_item(_es6_module, 'spline_types', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, 'spline_types', 'SplineTypes');
  var SplineElement=es6_import_item(_es6_module, 'spline_types', 'SplineElement');
  var SplineVertex=es6_import_item(_es6_module, 'spline_types', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, 'spline_types', 'SplineSegment');
  var SplineLoop=es6_import_item(_es6_module, 'spline_types', 'SplineLoop');
  var SplineLoopPath=es6_import_item(_es6_module, 'spline_types', 'SplineLoopPath');
  var SplineFace=es6_import_item(_es6_module, 'spline_types', 'SplineFace');
  var RecalcFlags=es6_import_item(_es6_module, 'spline_types', 'RecalcFlags');
  var MaterialFlags=es6_import_item(_es6_module, 'spline_types', 'MaterialFlags');
  var ElementArray=es6_import_item(_es6_module, 'spline_element_array', 'ElementArray');
  var SplineLayerFlags=es6_import_item(_es6_module, 'spline_element_array', 'SplineLayerFlags');
  var Canvas=es6_import_item(_es6_module, 'vectordraw', 'Canvas');
  var Path=es6_import_item(_es6_module, 'vectordraw', 'Path');
  var VectorFlags=es6_import_item(_es6_module, 'vectordraw', 'VectorFlags');
  var update_tmps_vs=new cachering(function() {
    return new Vector2();
  }, 64);
  var update_tmps_mats=new cachering(function() {
    return new Matrix4();
  }, 64);
  var draw_face_vs=new cachering(function() {
    return new Vector3();
  }, 32);
  var MAXCURVELEN=10000;
  var DrawParams=_ESClass("DrawParams", [function DrawParams() {
    this.init.apply(this, arguments);
  }, function init(redraw_rects, actlayer, only_render, selectmode, zoom, z, off, spline, drawlist) {
    this.redraw_rects = redraw_rects, this.actlayer = actlayer, this.only_render = only_render, this.selectmode = selectmode, this.zoom = zoom, this.z = z, this.off = off, this.spline = spline;
    this.drawlist = drawlist;
    this.combine_paths = true;
    return this;
  }]);
  _es6_module.add_class(DrawParams);
  DrawParams = _es6_module.add_export('DrawParams', DrawParams);
  var drawparam_cachering=new cachering(function() {
    return new DrawParams();
  }, 16);
  var SplineDrawer=_ESClass("SplineDrawer", [function SplineDrawer(spline, drawer) {
    if (drawer==undefined) {
        drawer = new Canvas();
    }
    this.spline = spline;
    this.used_paths = {}
    this.recalc_all = false;
    this.drawer = drawer;
    this.last_stroke_mat = undefined;
    this.last_stroke_z = undefined;
    this.last_stroke_eid = undefined;
    this.last_layer_id = undefined;
    this.last_stroke_stringid = undefined;
  }, function update(spline, drawlist, drawlist_layerids, matrix, redraw_rects, only_render, selectmode, master_g, zoom, editor, ignore_layers) {
    this.used_paths = {}
    this.drawlist = drawlist;
    this.drawlist_layerids = drawlist_layerids;
    var actlayer=spline.layerset.active;
    var do_blur=!!(only_render||editor.enable_blur);
    var draw_faces=!!(only_render||editor.draw_faces);
    var recalc_all=this.recalc_all||this.draw_faces!==draw_faces||this.do_blur!==do_blur;
    this.draw_faces = draw_faces;
    this.do_blur = do_blur;
    this.last_stroke_mat = undefined;
    this.last_stroke_z = undefined;
    this.last_stroke_eid = undefined;
    this.last_layer_id = undefined;
    this.last_stroke_stringid = undefined;
    var mat=update_tmps_mats.next();
    mat.load(matrix), matrix = mat;
    var mat2=update_tmps_mats.next();
    mat2.makeIdentity();
    mat2.translate(0.0, -master_g.height, 0.0);
    mat2.makeIdentity();
    mat2.translate(0.0, master_g.height, 0.0);
    mat2.scale(1.0, -1.0, 1.0);
    matrix.preMultiply(mat2);
    var m1=matrix.$matrix, m2=this.drawer.matrix.$matrix;
    var off=update_tmps_vs.next().zero();
    this.recalc_all = false;
    if (m1.m11!=m2.m11||m1.m22!=m2.m22) {
        recalc_all = true;
    }
    if (!recalc_all) {
        var a=update_tmps_vs.next().zero(), b=update_tmps_vs.next().zero();
        a.multVecMatrix(this.drawer.matrix);
        b.multVecMatrix(matrix);
        off.load(b).sub(a);
    }
    else {
      off.zero();
    }
    var m=matrix.$matrix;
    this.drawer.pan[0] = m.m41;
    this.drawer.pan[1] = m.m42;
    m.m41 = m.m42 = m.m43 = 0;
    this.drawer.set_matrix(matrix);
    if (recalc_all) {
        if (DEBUG.trace_recalc_all) {
            console.trace("%c RECALC_ALL!  ", "color:orange");
        }
    }
    var drawparams=drawparam_cachering.next().init(redraw_rects, actlayer, only_render, selectmode, zoom, undefined, off, spline, drawlist);
    for (var i=0; i<drawlist.length; i++) {
        var e=drawlist[i];
        var layerid=this.drawlist_layerids[i];
        if (e.flag&SplineFlags.HIDE)
          continue;
        var visible=false;
        for (var k in e.layers) {
            if (!(spline.layerset.get(k).flag&SplineLayerFlags.HIDE)) {
                visible = true;
            }
        }
        if (!visible)
          continue;
        if (recalc_all) {
            e.flag|=SplineFlags.REDRAW;
        }
        drawparams.z = i;
        drawparams.combine_paths = true;
        if (e.type==SplineTypes.FACE) {
            this.update_polygon(e, redraw_rects, actlayer, only_render, selectmode, zoom, i, off, spline, ignore_layers);
        }
        else 
          if (e.type==SplineTypes.SEGMENT) {
            this.update_stroke(e, drawparams);
        }
        this.last_layer_id = this.drawlist_layerids[i];
    }
    for (var k in this.drawer.path_idmap) {
        if (!(k in this.used_paths)) {
            var path=this.drawer.path_idmap[k];
            this.drawer.remove(path);
        }
    }
  }, function get_path(id, z, check_z) {
    if (check_z==undefined) {
        check_z = true;
    }
    this.used_paths[id] = 1;
    var path;
    if (!this.has_path(id, z, check_z)) {
        path = this.drawer.get_path(id, z, check_z);
        path.frame_first = true;
    }
    else {
      path = this.drawer.get_path(id, z, check_z);
    }
    return path;
  }, function has_path(id, z, check_z) {
    if (check_z==undefined) {
        check_z = true;
    }
    this.used_paths[id] = 1;
    return this.drawer.has_path(id, z, check_z);
  }, function update_stroke(seg, drawparams) {
    var redraw_rects=drawparams.redraw_rects, actlayer=drawparams.actlayer;
    var only_render=drawparams.only_render, selectmode=drawparams.selectmode;
    var zoom=drawparams.zooom, z=drawparams.z, off=drawparams.off, spline=drawparams.spline;
    var drawlist=drawparams.drawlist;
    var eid=seg.eid;
    if (this.has_path(eid, z, eid==seg.eid)&&!(seg.flag&SplineFlags.REDRAW)) {
        return ;
    }
    if (seg.eid==eid) {
        this.last_stroke_mat = seg.mat;
        this.last_stroke_eid = seg.eid;
        this.last_stroke_stringid = seg.stringid;
    }
    seg.flag&=~SplineFlags.REDRAW;
    var steps=6, ds=1.0/(steps-1), s=0.0;
    var path=this.get_path(eid, z, eid==seg.eid);
    path.update();
    path.was_updated = true;
    if (path.frame_first&&path.clip_paths.length>0) {
        path.reset_clip_paths();
        path.frame_first = false;
    }
    if (seg.l!==undefined&&(seg.mat.flag&MaterialFlags.MASK_TO_FACE)) {
        var l=seg.l, _i=0;
        do {
          var fz=l.f.finalz;
          if (fz>z) {
              l = l.radial_next;
              continue;
          }
          var path2=this.get_path(l.f.eid, fz);
          path.add_clip_path(path2);
          if (_i++>1000) {
              console.trace("Warning: infinite loop!");
              break;
          }
          l = l.radial_next;
        } while (l!=seg.l);
        
    }
    if (eid==seg.eid) {
        path.reset();
    }
    path.blur = seg.mat.blur*(this.do_blur ? 1 : 0);
    if (only_render) {
        path.color.load(seg.mat.strokecolor);
    }
    else {
      if ((selectmode&SelMask.SEGMENT)&&seg===spline.segments.highlight) {
          path.color[0] = 200/255, path.color[1] = 200/255, path.color[2] = 50/255, path.color[3] = 0.8;
      }
      else 
        if ((selectmode&SelMask.SEGMENT)&&seg===spline.segments.active) {
          path.color[0] = 200/255, path.color[1] = 80/255, path.color[2] = 50/255, path.color[3] = 0.8;
      }
      else 
        if ((selectmode&SelMask.SEGMENT)&&(seg.flag&SplineFlags.SELECT)) {
          path.color[0] = 250/255, path.color[1] = 140/255, path.color[2] = 50/255, path.color[3] = 0.8;
      }
      else {
        path.color.load(seg.mat.strokecolor);
      }
    }
    var lw=seg.mat.linewidth*0.5;
    var no=seg.normal(0).normalize().mulScalar(lw);
    var co=seg.evaluate(0).add(no);
    var fx=co[0], fy=co[1];
    var lastdv, lastco;
    var len=seg.length;
    s = 0;
    for (var i=0; i<steps; i++, s+=ds) {
        var dv=seg.derivative(s).normalize();
        var co=seg.evaluate(s);
        var k=-seg.curvature(s);
        co[0]+=-dv[1]*lw;
        co[1]+=dv[0]*lw;
        dv[0]*=(1.0-lw*k);
        dv[1]*=(1.0-lw*k);
        dv.mulScalar(len*ds/3.0);
        if (i>0) {
            path.cubicTo(lastco[0]+lastdv[0], lastco[1]+lastdv[1], co[0]-dv[0], co[1]-dv[1], co[0], co[1], 1);
        }
        else {
          path.moveTo(co[0], co[1]);
        }
        lastdv = dv;
        lastco = co;
    }
    s = 1.0;
    lw = -lw;
    for (var i=0; i<steps; i++, s-=ds) {
        var dv=seg.derivative(s).normalize();
        var co=seg.evaluate(s);
        var k=-seg.curvature(s);
        co[0]+=-dv[1]*lw;
        co[1]+=dv[0]*lw;
        dv[0]*=-(1.0-lw*k);
        dv[1]*=-(1.0-lw*k);
        dv.mulScalar(len*ds/3.0);
        if (i>0) {
            path.cubicTo(lastco[0]+lastdv[0], lastco[1]+lastdv[1], co[0]-dv[0], co[1]-dv[1], co[0], co[1], 1);
        }
        else {
          path.lineTo(co[0], co[1]);
        }
        lastdv = dv;
        lastco = co;
    }
    var layer=undefined;
    for (var k in seg.layers) {
        layer = spline.layerset.get(k);
    }
    if (layer!=undefined&&(layer.flag&SplineLayerFlags.MASK)) {
        var li=spline.layerset.indexOf(layer);
        if (li<=0) {
            console.trace("Error in update_seg", layer, spline);
            return path;
        }
        var prev=spline.layerset[li-1];
        var i=drawparams.z;
        var layerid=layer.id;
        while (i>0&&layerid!=prev.id) {
          i--;
          for (var k in drawlist[i].layers) {
              layerid = k;
              if (layerid==prev.id)
                break;
          }
        }
        while (i>=0&&layerid==prev.id) {
          var item=drawlist[i];
          if (item.type==SplineTypes.FACE) {
              var path2=this.get_path(item.eid, i);
              path.add_clip_path(path2);
          }
          i--;
          if (i<0)
            break;
          for (var k in drawlist[i].layers) {
              layerid = k;
              if (layerid==prev.id)
                break;
          }
        }
    }
    return path;
  }, function update_polygon(f, redraw_rects, actlayer, only_render, selectmode, zoom, z, off, spline, ignore_layers) {
    if (this.has_path(f.eid, z)&&!(f.flag&SplineFlags.REDRAW)) {
        return ;
    }
    f.flag&=~SplineFlags.REDRAW;
    var path=this.get_path(f.eid, z);
    path.was_updated = true;
    path.hidden = !this.draw_faces;
    path.reset();
    path.blur = f.mat.blur*(this.do_blur ? 1 : 0);
    path.color.load(f.mat.fillcolor);
    var lastco=draw_face_vs.next().zero();
    var lastdv=draw_face_vs.next().zero();
    var __iter_path2=__get_iter(f.paths);
    var path2;
    while (1) {
      var __ival_path2=__iter_path2.next();
      if (__ival_path2.done) {
          break;
      }
      path2 = __ival_path2.value;
      var first=true;
      var __iter_l=__get_iter(path2);
      var l;
      while (1) {
        var __ival_l=__iter_l.next();
        if (__ival_l.done) {
            break;
        }
        l = __ival_l.value;
        var seg=l.s;
        var length=seg.length;
        var flip=seg.v1!==l.v ? -1.0 : 1.0;
        var length=Math.min(seg.ks[KSCALE], MAXCURVELEN);
        var steps=6, s=flip<0.0 ? 1.0 : 0.0;
        var ds=(1.0/(steps-1))*flip;
        for (var i=0; i<steps; i++, s+=ds) {
            var co=seg.evaluate(s*0.9998+1e-05);
            var dv=seg.derivative(s*0.9998+1e-05);
            var k=seg.curvature(s*0.9998+1e-05);
            dv.mulScalar(ds/3.0);
            if (first) {
                first = false;
                path.moveTo(co[0], co[1]);
            }
            else {
              if (i==0||abs(k)<1e-05/zoom) {
                  path.lineTo(co[0], co[1]);
              }
              else {
                var midx=(lastco[0]+lastdv[0]+co[0]-dv[0])*0.5;
                var midy=(lastco[1]+lastdv[1]+co[1]-dv[1])*0.5;
                path.cubicTo(lastco[0]+lastdv[0], lastco[1]+lastdv[1], co[0]-dv[0], co[1]-dv[1], co[0], co[1], 1);
              }
            }
            lastco.load(co);
            lastdv.load(dv);
        }
      }
    }
    if ((!ignore_layers&&!f.in_layer(actlayer))||only_render)
      return ;
    if ((selectmode&SelMask.FACE)&&f===spline.faces.highlight) {
        path.color[0] = 200/255, path.color[1] = 200/255, path.color[2] = 50/255, path.color[3] = 0.8;
    }
    else 
      if ((selectmode&SelMask.FACE)&&f===spline.faces.active) {
        path.color[0] = 200/255, path.color[1] = 80/255, path.color[2] = 50/255, path.color[3] = 0.8;
    }
    else 
      if ((selectmode&SelMask.FACE)&&(f.flag&SplineFlags.SELECT)) {
        path.color[0] = 250/255, path.color[1] = 140/255, path.color[2] = 50/255, path.color[3] = 0.8;
    }
    return path;
  }, function draw(g) {
    this.drawer.draw(g);
    return ;
  }]);
  _es6_module.add_class(SplineDrawer);
  SplineDrawer = _es6_module.add_export('SplineDrawer', SplineDrawer);
});
es6_module_define('license_api', ["config", "license_electron"], function _license_api_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, 'config');
  var License=_ESClass("License", [function License(owner, email, issued, expiration, max_devices, used_devices, key) {
    this.owner = owner;
    this.email = email;
    this.issued = issued;
    this.expiration = expiration;
    this.max_devices = max_devices;
    this.used_devices = used_devices;
  }]);
  _es6_module.add_class(License);
  License = _es6_module.add_export('License', License);
  var MAX_EXPIRATION_TIME=355;
  MAX_EXPIRATION_TIME = _es6_module.add_export('MAX_EXPIRATION_TIME', MAX_EXPIRATION_TIME);
  var HardwareKey=_ESClass("HardwareKey", [function HardwareKey(deviceName, deviceKey) {
    this.deviceName = deviceName;
    this.deviceKey = deviceKey;
  }]);
  _es6_module.add_class(HardwareKey);
  HardwareKey = _es6_module.add_export('HardwareKey', HardwareKey);
  
  var license_electron=es6_import(_es6_module, 'license_electron');
  function getHardwareKey() {
    if (config.ELECTRON_APP_MODE) {
        return license_electron.getHardwareKey(HardwareKey);
    }
    else {
      return new Error("can't get hardware key");
    }
  }
  getHardwareKey = _es6_module.add_export('getHardwareKey', getHardwareKey);
});
es6_module_define('license_electron', [], function _license_electron_module(_es6_module) {
  "use strict";
  function getHardwareKey(HardwareKeyCls) {
    var os=require('OS');
    var hostname=os.hostname();
    var platform=os.platform();
    var name=hostname;
    var key="electron_"+hostname+"_"+platform;
    return new HardwareKeyCls(name, key);
  }
  getHardwareKey = _es6_module.add_export('getHardwareKey', getHardwareKey);
});
es6_module_define('addon_api', [], function _addon_api_module(_es6_module) {
  "use strict";
  var modules={}
  var Addon=_ESClass("Addon", [_ESClass.static(function define() {
    return {author: "", email: "", version: "", tooltip: "", description: "", struct_classes: []}
  }), function Addon(manager) {
    this.manager = manager;
  }, function define_data_api(api) {
  }, function init_addon() {
  }, function destroy_addon() {
  }, function handle_versioning(file, oldversion) {
  }]);
  _es6_module.add_class(Addon);
  Addon = _es6_module.add_export('Addon', Addon);
  var AddonManager=_ESClass("AddonManager", [function AddonManager() {
    this.addons = [];
    this.datablock_types = [];
  }, function register_datablock_type(cls) {
    this.datablock_types.push(cls);
  }, function unregister_datablock_type(cls) {
    this.datablock_types.remove(cls, false);
  }, function getmodule(name) {
    return modules[name];
  }, function getmodules() {
    return Object.getOwnPropertyNames(modules);
  }]);
  _es6_module.add_class(AddonManager);
  AddonManager = _es6_module.add_export('AddonManager', AddonManager);
});
es6_module_define('scene', ["lib_api", "struct"], function _scene_module(_es6_module) {
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var DataBlock=es6_import_item(_es6_module, 'lib_api', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, 'lib_api', 'DataTypes');
  var Scene=_ESClass("Scene", DataBlock, [function Scene() {
    DataBlock.call(this, DataTypes.SCENE);
    this.active_splinepath = "frameset.drawspline";
    this.time = 1;
  }, function change_time(ctx, time, _update_animation) {
    if (_update_animation==undefined) {
        _update_animation = true;
    }
    if (isNaN(this.time)) {
        console.log("EEK corruption!");
        this.time = ctx.frameset.time;
        if (isNaN(this.time))
          this.time = 0;
        if (isNaN(time))
          time = 0;
    }
    if (isNaN(time))
      return ;
    if (time==this.time)
      return ;
    if (time<1) {
        time = 1;
    }
    this.time = time;
    ctx.frameset.change_time(time, _update_animation);
    ctx.api.on_frame_change(ctx, time);
  }, function copy() {
    var ret=new Scene();
    ret.time = this.time;
    return ret;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=STRUCT.chain_fromSTRUCT(Scene, reader);
    ret.afterSTRUCT();
    if (ret.active_splinepath=="frameset.active_spline")
      ret.active_splinepath = "frameset.drawspline";
    return ret;
  }), function data_link(block, getblock, getblock_us) {
    DataBlock.prototype.data_link.apply(this, arguments);
  }]);
  _es6_module.add_class(Scene);
  Scene = _es6_module.add_export('Scene', Scene);
  Scene.STRUCT = STRUCT.inherit(Scene, DataBlock)+"\n    time              : float;\n    active_splinepath : string;\n  }\n";
});
es6_module_define('events', [], function _events_module(_es6_module) {
  "use strict";
  var MyKeyboardEvent=_ESClass("MyKeyboardEvent", [function MyKeyboardEvent(code, shift, ctrl, alt) {
    if (shift==undefined) {
        shift = false;
    }
    if (ctrl==undefined) {
        ctrl = false;
    }
    if (alt==undefined) {
        alt = false;
    }
    this.keyCode = code;
    this.shiftKey = shift;
    this.ctrlKey = ctrl;
    this.altKey = alt;
  }]);
  _es6_module.add_class(MyKeyboardEvent);
  MyKeyboardEvent = _es6_module.add_export('MyKeyboardEvent', MyKeyboardEvent);
  window.MyKeyboardEvent = MyKeyboardEvent;
  var MyMouseEvent=_ESClass("MyMouseEvent", [function MyMouseEvent(x, y, button, type) {
    this.x = x;
    this.y = y;
    this.button = button;
    this.type = type;
    this.touches = {}
  }, function copy(sub_offset) {
    if (sub_offset==undefined) {
        sub_offset = undefined;
    }
    var ret=new MyMouseEvent(this.x, this.y, this.button, this.type);
    for (var k in this.touches) {
        var t=this.touches[k];
        var x=t[0], y=t[1];
        if (sub_offset) {
            x-=sub_offset[0];
            y-=sub_offset[1];
        }
        ret.touches[k] = [x, y];
    }
    return ret;
  }]);
  _es6_module.add_class(MyMouseEvent);
  MyMouseEvent = _es6_module.add_export('MyMouseEvent', MyMouseEvent);
  window.MyMouseEvent = MyMouseEvent;
  MyMouseEvent.MOUSEMOVE = 0;
  MyMouseEvent.MOUSEDOWN = 1;
  MyMouseEvent.MOUSEUP = 2;
  MyMouseEvent.LEFT = 0;
  MyMouseEvent.RIGHT = 1;
  var _swap_next_mouseup=false;
  var _swap_next_mouseup_button=2;
  function swap_next_mouseup_event(button) {
    _swap_next_mouseup = true;
    _swap_next_mouseup_button = button;
  }
  swap_next_mouseup_event = _es6_module.add_export('swap_next_mouseup_event', swap_next_mouseup_event);
  var _ignore_next_mouseup=false;
  var _ignore_next_mouseup_button=2;
  function ignore_next_mouseup_event(button) {
    _ignore_next_mouseup = true;
    _ignore_next_mouseup_button = button;
  }
  ignore_next_mouseup_event = _es6_module.add_export('ignore_next_mouseup_event', ignore_next_mouseup_event);
  var EventHandler=_ESClass("EventHandler", [function EventHandler() {
    this.modalstack = new Array();
    this.modalhandler = null;
    this.keymap = null;
    this.touch_manager = undefined;
    this.touch_delay_stack = [];
  }, function push_touch_delay(delay_ms) {
    this.touch_delay_stack.push(this.touch_delay);
    this.touch_delay = delay_ms;
  }, function pop_touch_delay() {
    if (this.touch_delay_stack.length==0) {
        console.log("Invalid call to EventHandler.pop_touch_delay!");
        return ;
    }
    this.touch_delay = this.touch_delay_stack.pop();
  }, _ESClass.set(function touch_delay(delay_ms) {
    if (delay_ms==0) {
        this.touch_manager = undefined;
    }
    else {
      if (this.touch_manager==undefined)
        this.touch_manager = new TouchEventManager(this, delay_ms);
      else 
        this.touch_manager.delay = delay_ms;
    }
  }), _ESClass.get(function touch_delay() {
    if (this.touch_manager==undefined)
      return 0;
    return this.touch_manager.delay;
  }), function on_tick() {
    if (this.touch_manager!=undefined)
      this.touch_manager.process();
  }, function bad_event(event) {
    var tm=this.touch_manager;
    if (tm==undefined)
      return false;
    if (this.touch_manager!=undefined)
      this.touch_manager.process();
    if (tm!=undefined&&__instance_of(event, MyMouseEvent)) {
        var i=0;
        for (var k in event.touches) {
            i++;
        }
        if (i==0)
          return false;
        if ("_good" in event)
          return false;
        this.touch_manager.queue_event(event);
        return true;
    }
    return false;
  }, function on_textinput(event) {
  }, function on_keydown(event) {
  }, function on_charcode(event) {
  }, function on_keyinput(event) {
  }, function on_keyup(event) {
  }, function on_mousemove(event) {
  }, function on_mousedown(event) {
  }, function on_doubleclick(event) {
  }, function on_pan(pan, last_pan) {
  }, function on_gl_lost(new_gl) {
  }, function on_mouseup2(event) {
  }, function on_mouseup3(event) {
  }, function on_mousedown2(event) {
  }, function on_mousedown3(event) {
  }, function on_mousemove2(event) {
  }, function on_mousemove3(event) {
  }, function on_mousewheel(event) {
  }, function on_mouseup(event) {
  }, function on_resize(newsize) {
  }, function on_contextchange(event) {
  }, function on_draw(gl) {
  }, function has_modal() {
    return this.modalhandler!=null;
  }, function push_modal(handler) {
    if (this.modalhandler!=null) {
        this.modalstack.push(this.modalhandler);
    }
    this.modalhandler = handler;
  }, function pop_modal() {
    if (this.modalhandler!=null) {
    }
    if (this.modalstack.length>0) {
        this.modalhandler = this.modalstack.pop();
    }
    else {
      this.modalhandler = null;
    }
  }, function _on_resize(newsize) {
    this.on_resize(event);
  }, function _on_pan(pan, last_pan) {
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_pan(event);
    else 
      this.on_pan(event);
  }, function _on_textinput(event) {
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_textinput(event);
    else 
      this.on_textinput(event);
  }, function _on_keydown(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_keydown(event);
    else 
      this.on_keydown(event);
  }, function _on_charcode(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_charcode(event);
    else 
      this.on_charcode(event);
  }, function _on_keyinput(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_keyinput(event);
    else 
      this.on_keyinput(event);
  }, function _on_keyup(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_keyup(event);
    else 
      this.on_keyup(event);
  }, function _on_mousemove(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_mousemove(event);
    else 
      this.on_mousemove(event);
  }, function _on_doubleclick(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_doubleclick(event);
    else 
      this.on_doubleclick(event);
  }, function _on_mousedown(event) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_mousedown(event);
    else 
      this.on_mousedown(event);
  }, function _on_mouseup(event) {
    if (this.bad_event(event))
      return ;
    if (_swap_next_mouseup&&event.button==_swap_next_mouseup_button) {
        event.button = _swap_next_mouseup_button==2 ? 0 : 2;
        _swap_next_mouseup = false;
    }
    if (_ignore_next_mouseup&&event.button==_ignore_next_mouseup_button) {
        _ignore_next_mouseup = false;
        return ;
    }
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_mouseup(event);
    else 
      this.on_mouseup(event);
  }, function _on_mousewheel(event, delta) {
    if (this.bad_event(event))
      return ;
    if (this.modalhandler!=null&&this.modalhandler!==this)
      this.modalhandler._on_mousewheel(event, delta);
    else 
      this.on_mousewheel(event, delta);
  }]);
  _es6_module.add_class(EventHandler);
  EventHandler = _es6_module.add_export('EventHandler', EventHandler);
  var valid_modifiers={"SHIFT": 1, "CTRL": 2, "ALT": 4}
  var charmap_latin_1={"Space": 32, "Escape": 27, "Enter": 13, "Up": 38, "Down": 40, "Left": 37, "Right": 39, "Num0": 96, "Num1": 97, "Num2": 98, "Num3": 99, "Num4": 100, "Num5": 101, "Num6": 102, "Num7": 103, "Num8": 104, "Num9": 105, "Home": 36, "End": 35, "Delete": 46, "Backspace": 8, "Insert": 45, "PageUp": 33, "PageDown": 34, "Tab": 9, "-": 189, "=": 187, "NumPlus": 107, "NumMinus": 109, "Shift": 16, "Ctrl": 17, "Control": 17, "Alt": 18}
  charmap_latin_1 = _es6_module.add_export('charmap_latin_1', charmap_latin_1);
  for (var i=0; i<26; i++) {
      charmap_latin_1[String.fromCharCode(i+65)] = i+65;
  }
  for (var i=0; i<10; i++) {
      charmap_latin_1[String.fromCharCode(i+48)] = i+48;
  }
  for (var k in charmap_latin_1) {
      charmap_latin_1[charmap_latin_1[k]] = k;
  }
  var charmap_latin_1_rev={}
  for (var k in charmap_latin_1) {
      charmap_latin_1_rev[charmap_latin_1[k]] = k;
  }
  var charmap=charmap_latin_1;
  charmap = _es6_module.add_export('charmap', charmap);
  var charmap_rev=charmap_latin_1_rev;
  charmap_rev = _es6_module.add_export('charmap_rev', charmap_rev);
  window.charmap = charmap;
  window.charmap_rev = charmap_rev;
  var KeyHandler=_ESClass("KeyHandler", [function KeyHandler(key, modifiers, uiname, menunum, ignore_charmap_error) {
    if (!charmap.hasOwnProperty(key)) {
        if (ignore_charmap_error!=undefined&&ignore_charmap_error!=true) {
            console.trace();
            console.log("Invalid hotkey "+key+"!");
        }
        this.key = 0;
        this.keyAscii = "[corrupted hotkey]";
        this.shift = this.alt = this.ctrl = false;
        return ;
    }
    if (typeof (key)=="string") {
        if (key.length==1)
          key = key.toUpperCase();
        this.keyAscii = key;
        this.key = charmap[key];
    }
    else {
      this.key = key;
      this.keyAscii = charmap[key];
    }
    this.shift = this.alt = this.ctrl = false;
    this.menunum = menunum;
    for (var i=0; i<modifiers.length; i++) {
        if (modifiers[i]=="SHIFT") {
            this.shift = true;
        }
        else 
          if (modifiers[i]=="ALT") {
            this.alt = true;
        }
        else 
          if (modifiers[i]=="CTRL") {
            this.ctrl = true;
        }
        else {
          console.trace();
          console.log("Warning: invalid modifier "+modifiers[i]+" in KeyHandler");
        }
    }
  }, function build_str(add_menu_num) {
    var s="";
    if (this.ctrl)
      s+="CTRL-";
    if (this.alt)
      s+="ALT-";
    if (this.shift)
      s+="SHIFT-";
    s+=this.keyAscii;
    return s;
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    return this.build_str(false);
  })]);
  _es6_module.add_class(KeyHandler);
  KeyHandler = _es6_module.add_export('KeyHandler', KeyHandler);
  var KeyMap=_ESClass("KeyMap", hashtable, [function KeyMap() {
    hashtable.call(this);
    this.op_map = new hashtable();
  }, function get_tool_handler(toolstr) {
    if (this.op_map.has(toolstr))
      return this.op_map.get(toolstr);
  }, function add_tool(keyhandler, toolstr) {
    this.add(keyhandler, new ToolKeyHandler(toolstr));
    this.op_map.add(toolstr, keyhandler);
  }, function add_func(keyhandler, func) {
    this.add(keyhandler, new FuncKeyHandler(func));
  }, function add(keyhandler, value) {
    if (this.has(keyhandler)) {
        console.trace();
        console.log("Duplicate hotkey definition!");
    }
    if (__instance_of(value, ToolKeyHandler)&&!(typeof value.tool=="string"||__instance_of(value.tool, String))) {
        value.tool.keyhandler = keyhandler;
    }
    hashtable.prototype.add.call(this, keyhandler, value);
  }, function process_event(ctx, event) {
    var modlist=[];
    if (event.ctrlKey)
      modlist.push("CTRL");
    if (event.shiftKey)
      modlist.push("SHIFT");
    if (event.altKey)
      modlist.push("ALT");
    var key=new KeyHandler(event.keyCode, modlist, 0, 0, true);
    if (this.has(key)) {
        ctx.keymap_mpos = ctx.view2d.mpos;
        return this.get(key);
    }
    return undefined;
  }]);
  _es6_module.add_class(KeyMap);
  KeyMap = _es6_module.add_export('KeyMap', KeyMap);
  var KeyHandlerCls=_ESClass("KeyHandlerCls", [function handle(ctx) {
  }, function KeyHandlerCls() {
  }]);
  _es6_module.add_class(KeyHandlerCls);
  KeyHandlerCls = _es6_module.add_export('KeyHandlerCls', KeyHandlerCls);
  var ToolKeyHandler=_ESClass("ToolKeyHandler", KeyHandlerCls, [function ToolKeyHandler(tool) {
    this.tool = tool;
  }, function handle(ctx) {
    var tool=this.tool;
    ctx.api.call_op(ctx, tool);
  }]);
  _es6_module.add_class(ToolKeyHandler);
  ToolKeyHandler = _es6_module.add_export('ToolKeyHandler', ToolKeyHandler);
  var FuncKeyHandler=_ESClass("FuncKeyHandler", KeyHandlerCls, [function FuncKeyHandler(func) {
    this.handle = func;
  }]);
  _es6_module.add_class(FuncKeyHandler);
  FuncKeyHandler = _es6_module.add_export('FuncKeyHandler', FuncKeyHandler);
  var $vel_k3fK_on_tick;
  var $vel_gLOA_calc_vel;
  var $was_clamped_uWUP_clamp_pan;
  var VelocityPan=_ESClass("VelocityPan", EventHandler, [function VelocityPan() {
    this.start_mpos = new Vector2();
    this.last_mpos = new Vector2();
    this.mpos = new Vector2();
    this.start_time = 0;
    this.owner = undefined;
    this.coasting = false;
    this.panning = false;
    this.was_touch = false;
    this.enabled = true;
    this.vel = new Vector2();
    this.pan = new Vector2();
    this.damp = 0.99;
    this.can_coast = true;
    this.start_pan = new Vector2();
    this.first = false;
    this.last_ms = 0;
    this.vel = new Vector2();
  }, function on_tick() {
    if (!this.panning&&this.coasting) {
        var damp=0.99;
        $vel_k3fK_on_tick.load(this.vel);
        $vel_k3fK_on_tick.mulScalar(time_ms()-this.last_ms);
        this.vel.mulScalar(damp);
        this.last_ms = time_ms();
        this.pan.sub($vel_k3fK_on_tick);
        var was_clamped=this.clamp_pan();
        this.owner.on_pan(this.pan, this.start_pan);
        var stop=was_clamped!=undefined&&(was_clamped[0]&&was_clamped[1]);
        stop = stop||this.vel.vectorLength<1;
        if (stop)
          this.coasting = false;
    }
  }, function calc_vel() {
    if (!this.can_coast) {
        this.vel.zero();
        this.coasting = false;
        this.last_ms = time_ms();
        return ;
    }
    var t=time_ms()-this.start_time;
    if (t<10) {
        console.log("small t!!!", t);
        return ;
    }
    $vel_gLOA_calc_vel.load(this.last_mpos).sub(this.mpos).divideScalar(t);
    this.vel.add($vel_gLOA_calc_vel);
    this.coasting = (this.vel.vectorLength()>0.25);
    this.last_ms = time_ms();
  }, function start(start_mpos, last_mpos, owner, push_modal_func, pop_modal_func) {
    if (this.panning) {
        console.trace("warning, duplicate call to VelocityPan.start()");
        return ;
    }
    this.vel.zero();
    this.pop_modal_func = pop_modal_func;
    this.coasting = false;
    this.first = false;
    this.owner = owner;
    this.panning = true;
    push_modal_func(this);
    this.start_pan.load(this.pan);
    this.last_ms = time_ms();
    this.start_time = time_ms();
    this.was_touch = g_app_state.was_touch;
    this.start_mpos.load(start_mpos);
    this.last_mpos.load(start_mpos);
    this.mpos.load(start_mpos);
    this.do_mousemove(last_mpos);
  }, function end() {
    console.log("in end");
    if (this.panning) {
        console.log("  pop modal");
        this.pop_modal_func();
    }
    this.panning = false;
  }, function do_mousemove(mpos) {
    if (DEBUG.touch) {
        console.log("py", mpos[1]);
    }
    this.last_mpos.load(this.mpos);
    this.mpos.load(mpos);
    this.pan[0] = this.start_pan[0]+mpos[0]-this.start_mpos[0];
    this.pan[1] = this.start_pan[1]+mpos[1]-this.start_mpos[1];
    this.vel.zero();
    this.calc_vel();
    this.clamp_pan();
    this.owner.on_pan(this.pan, this.start_pan);
  }, function clamp_pan() {
    var bs=this.owner.pan_bounds;
    if (this.owner.state&8192*4)
      return ;
    var p=this.pan;
    $was_clamped_uWUP_clamp_pan[0] = false;
    $was_clamped_uWUP_clamp_pan[1] = false;
    for (var i=0; i<2; i++) {
        var l=p[i];
        p[i] = Math.min(Math.max(bs[0][i], p[i]), bs[0][i]+bs[1][i]);
        if (p[i]!=l)
          $was_clamped_uWUP_clamp_pan[i] = true;
    }
    return $was_clamped_uWUP_clamp_pan;
  }, function on_mouseup(event) {
    console.log("pan mouse up!", this.panning, this.owner);
    if (this.panning) {
        this.mpos.load([event.y, event.y]);
        this.calc_vel();
        this.end();
    }
  }, function on_mousemove(event) {
    this.do_mousemove([event.x, event.y]);
  }, function set_pan(pan) {
    if (this.panning)
      this.end();
    this.pan.load(pan);
    this.coasting = false;
    this.vel.zero();
  }]);
  var $vel_k3fK_on_tick=new Vector2();
  var $vel_gLOA_calc_vel=new Vector2();
  var $was_clamped_uWUP_clamp_pan=[0, 0];
  _es6_module.add_class(VelocityPan);
  VelocityPan = _es6_module.add_export('VelocityPan', VelocityPan);
  var TouchEventManager=_ESClass("TouchEventManager", [function TouchEventManager(owner, delay) {
    if (delay==undefined) {
        delay = 100;
    }
    this.queue = new GArray();
    this.queue_ms = new GArray();
    this.delay = delay;
    this.owner = owner;
  }, function get_last(type) {
    var i=this.queue.length;
    if (i==0)
      return undefined;
    i--;
    var q=this.queue;
    while (i>=0) {
      var e=q[i];
      if (e.type==type||e.type!=MyMouseEvent.MOUSEMOVE)
        break;
      i--;
    }
    if (i<0)
      i = 0;
    return q[i].type==type ? q[i] : undefined;
  }, function queue_event(event) {
    var last=this.get_last(event.type);
    if (DEBUG.touch&&this==touch_manager)
      console.log("touch event", event.type);
    if (last!=undefined&&last.type!=MyMouseEvent.MOUSEMOVE) {
        var dis, same=true;
        for (var k in event.touches) {
            if (!(k in last.touches)) {
            }
        }
        dis = new Vector2([event.x, event.y]).vectorDistance(new Vector2([last.x, last.y]));
        if (DEBUG.touch&&this==touch_manager)
          console.log(dis);
        if (same&&dis<50) {
            if (DEBUG.touch&&this==touch_manager)
              console.log("destroying duplicate event", last.type, event.x, event.y, event.touches);
            for (var k in event.touches) {
                last.touches[k] = event.touches[k];
            }
            return ;
        }
    }
    this.queue.push(event);
    this.queue_ms.push(time_ms());
  }, function cancel(event) {
    var ts=event.touches;
    var dl=new GArray;
    if (DEBUG.touch&&this==touch_manager)
      console.log("touch cancel", event);
    for (var e in this.queue) {
        for (var k in ts) {
            if (k in e.touches) {
                delete e.touches;
            }
        }
        if (list(e.touches).length==0) {
            dl.push(e);
        }
    }
    for (var e in dl) {
        var i=this.queue.indexOf(e);
        this.queue.remove(e);
        this.queue_ms.pop_i(i);
    }
  }, function process() {
    var owner=this.owner;
    var dl=new GArray();
    var q=this.queue;
    var qm=this.queue_ms;
    var delay=this.delay;
    for (var i=0; i<q.length; i++) {
        if (time_ms()-qm[i]>delay) {
            dl.push(q[i]);
        }
    }
    var __iter_e=__get_iter(dl);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      var i=q.indexOf(e);
      q.remove(e);
      qm.pop_i(i);
    }
    var __iter_e=__get_iter(dl);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      e._good = true;
      g_app_state.was_touch = true;
      try {
        if (e.type==MyMouseEvent.MOUSEDOWN) {
            if (DEBUG.touch)
              console.log("td1", e.x, e.y);
            owner._on_mousedown(e);
            if (DEBUG.touch)
              console.log("td2", e.x, e.y);
        }
        else 
          if (e.type==MyMouseEvent.MOUSEMOVE) {
            owner._on_mousemove(e);
        }
        else 
          if (e.type==MyMouseEvent.MOUSEUP) {
            owner._on_mouseup(e);
        }
      }
      catch (_err) {
          print_stack(_err);
          console.log("Error executing delayed touch event");
      }
    }
  }, function reset() {
    this.queue = new GArray();
    this.queue_ms = new GArray();
  }]);
  _es6_module.add_class(TouchEventManager);
  TouchEventManager = _es6_module.add_export('TouchEventManager', TouchEventManager);
  window.TouchEventManager = TouchEventManager;
  var touch_manager=window.touch_manager = new TouchEventManager(undefined, 20);
});
es6_module_define('touchevents', [], function _touchevents_module(_es6_module) {
  "use strict";
  var TouchManager=_ESClass("TouchManager", [function TouchManager(event) {
    this.pattern = new set(Object.keys(event.touches));
    this.idxmap = {}
    this.tot = event.touches.length;
    this.event = event;
    this.deltas = {}
    var i=0;
    for (var k in event.touches) {
        this.idxmap[i++] = k;
        this.deltas[k] = 0.0;
    }
  }, function update(event) {
    if (this.valid(event)) {
        for (var k in event.touches) {
            var t2=event.touches[k];
            var t1=this.event.touches[k];
            var d=[t2[0]-t1[0], t2[1]-t1[1]];
            this.deltas[k] = d;
        }
    }
    this.event = event;
  }, function delta(i) {
    return this.deltas[this.idxmap[i]];
  }, function get(i) {
    return this.event.touches[this.idxmap[i]];
  }, function valid(event) {
    if (event==undefined) {
        event = this.event;
    }
    var keys=Object.keys(event.touches);
    if (keys.length!=this.pattern.length)
      return false;
    for (var i=0; i<keys.length; i++) {
        if (!pattern.has(keys[i]))
          return false;
    }
    return true;
  }]);
  _es6_module.add_class(TouchManager);
});
es6_module_define('toolprops', ["ajax", "toolprops_iter", "struct"], function _toolprops_module(_es6_module) {
  "use strict";
  
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var pack_int=es6_import_item(_es6_module, 'ajax', 'pack_int');
  var pack_float=es6_import_item(_es6_module, 'ajax', 'pack_float');
  var pack_static_string=es6_import_item(_es6_module, 'ajax', 'pack_static_string');
  var PropTypes={INT: 0, FLOAT: 1, STRING: 4, VEC3: 6, VEC4: 7, BOOL: 8, MATRIX3: 12, MATRIX4: 13, ENUM: 14, STRUCT: 15, FLAG: 16, DATAREF: 17, DATAREFLIST: 18, TRANSFORM: 19, COLLECTION: 20, VEC2: 21, IMAGE: 22, ARRAYBUFFER: 23, COLOR3: 24, COLOR4: 25}
  PropTypes = _es6_module.add_export('PropTypes', PropTypes);
  var TPropFlags={PRIVATE: 1, LABEL: 2, COLL_LOOSE_TYPE: 4, USE_UNDO: 8, UNDO_SIMPLE: 16}
  TPropFlags = _es6_module.add_export('TPropFlags', TPropFlags);
  var ToolProperty=_ESClass("ToolProperty", [function ToolProperty(type, apiname, uiname, description, flag) {
    if (apiname==undefined) {
        apiname = "";
    }
    if (uiname==undefined) {
        uiname = apiname;
    }
    if (description==undefined) {
        description = "";
    }
    if (flag==undefined) {
        flag = 0;
    }
    this.type = type;
    this.data = null;
    this.apiname = apiname;
    if (uiname==undefined)
      uiname = apiname;
    this.listeners = new GArray();
    this.uiname = uiname;
    this.flag = flag;
    this.description = description;
    this.userdata = undefined;
    this.ctx = undefined;
    this.path = undefined;
    this.hotkey_ref = undefined;
    this.unit = undefined;
    this.icon = -1;
  }, function copyTo(dst, copy_data) {
    if (copy_data==undefined) {
        copy_data = false;
    }
    dst.flag = this.flag;
    dst.icon = this.icon;
    dst.unit = this.unit;
    dst.hotkey_ref = this.hotkey_ref;
    dst.uiname = this.uiname;
    dst.apiname = this.apiname;
    if (copy_data)
      dst.data = this.data;
    return dst;
  }, function add_listener(owner, callback) {
    var __iter_l=__get_iter(this.listeners);
    var l;
    while (1) {
      var __ival_l=__iter_l.next();
      if (__ival_l.done) {
          break;
      }
      l = __ival_l.value;
      if (l[0]==owner) {
          l[1] = callback;
          return ;
      }
    }
    this.listeners.push([owner, callback]);
  }, function remove_listener(owner, silent_fail) {
    if (silent_fail==undefined) {
        silent_fail = false;
    }
    var __iter_l=__get_iter(this.listeners);
    var l;
    while (1) {
      var __ival_l=__iter_l.next();
      if (__ival_l.done) {
          break;
      }
      l = __ival_l.value;
      if (l[0]==owner) {
          console.log("removing listener");
          this.listeners.remove(l);
          return ;
      }
    }
    if (!silent_fail)
      console.trace("warning: remove_listener called for unknown owner:", owner);
  }, function _exec_listeners(data_api_owner) {
    var __iter_l=__get_iter(this.listeners);
    var l;
    while (1) {
      var __ival_l=__iter_l.next();
      if (__ival_l.done) {
          break;
      }
      l = __ival_l.value;
      if (RELEASE) {
          try {
            l[1](l[0], this, data_api_owner);
          }
          catch (_err) {
              print_stack(_err);
              console.log("Warning: a property event listener failed", "property:", this, "callback:", l[1], "owner:", l[0]);
          }
      }
      else {
        l[1](l[0], this, data_api_owner);
      }
    }
  }, function load_ui_data(prop) {
    this.uiname = prop.uiname;
    this.apiname = prop.apiname;
    this.description = prop.description;
    this.unit = prop.unit;
    this.hotkey_ref = prop.hotkey_ref;
  }, function user_set_data(this_input) {
  }, function update(owner_obj, old_value, has_changed) {
  }, function api_update(ctx, path) {
  }, function pack(data) {
    pack_int(data, this.type);
    var unit=this.unit!=undefined ? "" : this.unit;
    pack_static_string(data, unit, 16);
  }, function unpack(data, uctx) {
    this.unit = unpack_static_string(data, 16);
    if (this.unit=="")
      this.unit = undefined;
  }, function set_data(data, owner, changed, set_data) {
    if (changed==undefined) {
        changed = true;
    }
    if (set_data==undefined) {
        set_data = true;
    }
    if (set_data)
      this.data = data;
    this.api_update(this.ctx, this.path, owner);
    this.update.call(this, owner, undefined, changed);
    this._exec_listeners(owner);
  }, function toJSON() {
    return {type: this.type, data: this.data}
  }, function loadJSON(prop, json) {
    switch (json.type) {
      case PropTypes.INT:
      case PropTypes.FLOAT:
      case PropTypes.STRING:
      case PropTypes.BOOL:
      case PropTypes.FLOAT_ARRAY:
      case PropTypes.INT_ARRAY:
      case PropTypes.ENUM:
      case PropTypes.FLAG:
        prop.set_data(json.data);
        break;
      case PropTypes.ELEMENTS:
        prop.set_data(new GArray(json.data));
        break;
      case PropTypes.VEC3:
        prop.set_data(new Vector3(json.data));
        break;
      case PropTypes.VEC4:
        prop.set_data(new Vector4(json.data));
        break;
    }
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ob=new ToolProperty();
    reader(ob);
    return ob;
  })]);
  _es6_module.add_class(ToolProperty);
  ToolProperty = _es6_module.add_export('ToolProperty', ToolProperty);
  ToolProperty.STRUCT = "\n  ToolProperty {\n    type : int;\n    flag : int;\n  }\n";
  var ArrayBufferProperty=_ESClass("ArrayBufferProperty", ToolProperty, [function ArrayBufferProperty(data, apiname, uiname, description, flag) {
    if (apiname==undefined) {
        apiname = "";
    }
    if (uiname==undefined) {
        uiname = apiname;
    }
    if (description==undefined) {
        description = "";
    }
    if (flag==undefined) {
        flag = 0;
    }
    ToolProperty.call(this, PropTypes.ARRAYBUFFER, apiname, uiname, description, flag);
    if (data!=undefined) {
        this.set_data(data);
    }
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    if (this.data!=undefined)
      dst.set_data(this.data);
    return dst;
  }, function copy() {
    return this.copyTo(new ArrayBufferProperty());
  }]);
  _es6_module.add_class(ArrayBufferProperty);
  ArrayBufferProperty = _es6_module.add_export('ArrayBufferProperty', ArrayBufferProperty);
  ArrayBufferProperty.STRUCT = STRUCT.inherit(ArrayBufferProperty, ToolProperty)+"\n  data : arraybuffer;\n}\n";
  var DataRefProperty=_ESClass("DataRefProperty", ToolProperty, [function DataRefProperty(value, allowed_types, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.DATAREF, apiname, uiname, description, flag);
    if (allowed_types==undefined)
      allowed_types = new set();
    if (!(__instance_of(allowed_types, set))) {
        if (__instance_of(allowed_types, Array))
          allowed_types = new set(allowed_types);
        else 
          allowed_types = new set([allowed_types]);
    }
    this.types = new set();
    var __iter_val=__get_iter(allowed_types);
    var val;
    while (1) {
      var __ival_val=__iter_val.next();
      if (__ival_val.done) {
          break;
      }
      val = __ival_val.value;
      if (typeof val=="object") {
          val = new val().lib_type;
      }
      this.types.add(val);
    }
    if (value!=undefined)
      this.set_data(value);
  }, function get_block(ctx) {
    if (this.data==undefined)
      return undefined;
    else 
      return ctx.datalib.get(this.data);
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    var data=this.data;
    if (data!=undefined)
      data = data.copy();
    dst.types = new set(this.types);
    if (data!=undefined)
      dst.set_data(data);
    return dst;
  }, function copy() {
    return this.copyTo(new DataRefProperty());
  }, function set_data(value, owner, changed, set_data) {
    if (value==undefined) {
        ToolProperty.prototype.set_data.call(this, undefined, owner, changed, set_data);
    }
    else 
      if (!(__instance_of(value, DataRef))) {
        if (!this.types.has(value.lib_type)) {
            console.trace("Invalid datablock type "+value.lib_type+" passed to DataRefProperty.set_value()");
            return ;
        }
        value = new DataRef(value);
        ToolProperty.prototype.set_data.call(this, value, owner, changed, set_data);
    }
    else {
      ToolProperty.prototype.set_data.call(this, value, owner, changed, set_data);
    }
  }, _ESClass.static(function fromSTRUCT(reader) {
    var l=new DataRefProperty();
    
    reader(l);
    l.types = new set(l.types);
    if (l.data!=undefined&&l.data.id<0)
      l.data = undefined;
    l.set_data(l.data);
    return l;
  })]);
  _es6_module.add_class(DataRefProperty);
  DataRefProperty = _es6_module.add_export('DataRefProperty', DataRefProperty);
  DataRefProperty.STRUCT = STRUCT.inherit(DataRefProperty, ToolProperty)+"\n  data : DataRef | obj.data == undefined ? new DataRef(-1) : obj.data;\n  types : iter(int);\n}\n";
  var RefListProperty=_ESClass("RefListProperty", ToolProperty, [function RefListProperty(value, allowed_types, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.DATAREFLIST, apiname, uiname, description, flag);
    if (allowed_types==undefined)
      allowed_types = [];
    if (!(__instance_of(allowed_types, set))) {
        allowed_types = new set([allowed_types]);
    }
    this.types = allowed_types;
    this.set_data(value);
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    dst.types = new set(this.types);
    if (this.data!=undefined)
      dst.set_data(this.data);
    return dst;
  }, function copy() {
    return this.copyTo(new RefListProperty());
  }, function set_data(value, owner, changed, set_data) {
    if (value!=undefined&&value.constructor.name=="Array")
      value = new GArray(value);
    if (value==undefined) {
        ToolProperty.prototype.set_data.call(this, undefined, owner, changed, set_data);
    }
    else {
      var lst=new DataRefList();
      for (var i=0; i<value.length; i++) {
          var block=value[i];
          if (block==undefined||!this.types.has(block.lib_type)) {
              console.trace();
              if (block==undefined)
                console.log("Undefined datablock in list passed to RefListProperty.set_data");
              else 
                console.log("Invalid datablock type "+block.lib_type+" passed to RefListProperty.set_value()");
              continue;
          }
          lst.push(block);
      }
      value = lst;
      ToolProperty.prototype.set_data.call(this, this, value, owner, changed, set_data);
    }
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new RefListProperty();
    reader(t);
    t.types = new set(t.types);
    t.set_data(t.data);
    return t;
  })]);
  _es6_module.add_class(RefListProperty);
  RefListProperty = _es6_module.add_export('RefListProperty', RefListProperty);
  RefListProperty.STRUCT = STRUCT.inherit(RefListProperty, ToolProperty)+"\n  data : iter(dataref(DataBlock));\n  types : iter(int);\n}\n";
  var FlagProperty=_ESClass("FlagProperty", ToolProperty, [function FlagProperty(value, maskmap, uinames, apiname, uiname, description, range, uirange, flag) {
    ToolProperty.call(this, PropTypes.FLAG, apiname, uiname, description, flag);
    if (value==undefined&&maskmap==undefined) {
        this.ui_value_names = {};
        this.ui_key_names = {};
        this.flag_descriptions = {};
        this.keys = {};
        this.values = {};
        return ;
    }
    this.data = 0;
    this.ui_key_names = {}
    this.flag_descriptions = {}
    if (uinames==undefined) {
        this.setUINames(uinames);
    }
    else {
      this.ui_value_names = uinames;
      for (var k in uinames) {
          this.ui_key_names[uinames[k]] = k;
      }
    }
    this.keys = {}
    this.values = {}
    for (var k in maskmap) {
        this.values[maskmap[k]] = maskmap[k];
        this.keys[k] = maskmap[k];
    }
    this.set_flag(value);
  }, function setUINames(uinames) {
    this.ui_value_names = {}
    this.ui_key_names = {}
    for (var k in this.keys) {
        var key=k[0].toUpperCase()+k.slice(1, k.length).toLowerCase();
        key = key.replace(/\_/g, " ").replace(/\-/g, " ");
        this.ui_value_names[key] = k;
        this.ui_key_names[k] = key;
    }
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    for (var k in this.flag_descriptions) {
        dst.flag_descriptions[k] = this.flag_descriptions[k];
    }
    for (var k in this.keys) {
        dst.keys[k] = this.keys[k];
    }
    for (var k in this.values) {
        dst.values[k] = this.values[k];
    }
    for (var k in this.ui_value_names) {
        dst.ui_value_names[k] = this.ui_value_names[k];
    }
    dst.ui_key_names = {}
    for (var k in this.ui_key_names) {
        dst.ui_key_names[k] = this.ui_key_names[k];
    }
    return dst;
  }, function copy() {
    return this.copyTo(new FlagProperty());
  }, function pack(data) {
    pack_int(this.data);
  }, function set_flag(value) {
    var flag;
    if (this.values.hasOwnProperty(value)) {
        flag = value;
    }
    else 
      if (this.keys.hasOwnProperty(value)) {
        flag = this.keys[value];
    }
    else {
      console.trace("WARNING: bad flag value!", value, this.values);
    }
    this.data|=flag;
  }, function unset_flag(value) {
    var flag;
    if (this.values.hasOwnProperty(value)) {
        flag = value;
    }
    else 
      if (this.keys.hasOwnProperty(value)) {
        flag = this.keys[value];
    }
    else {
      console.log(value, this.values);
      console.trace();
      throw new Error("Bad flag value");
    }
    this.data&=~flag;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new FlagProperty();
    reader(t);
    return t;
  })]);
  _es6_module.add_class(FlagProperty);
  FlagProperty = _es6_module.add_export('FlagProperty', FlagProperty);
  FlagProperty.STRUCT = STRUCT.inherit(FlagProperty, ToolProperty)+"\n  data : int;\n}\n";
  var FloatProperty=_ESClass("FloatProperty", ToolProperty, [function FloatProperty(i, apiname, uiname, description, range, uirange, flag) {
    ToolProperty.call(this, PropTypes.FLOAT, apiname, uiname, description, flag);
    if (uirange==undefined) {
        uirange = range;
    }
    this.ui_range = uirange;
    this.range = range;
    this.data = i;
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    dst.ui_range = this.ui_range;
    dst.range = this.range;
    return dst;
  }, function copy() {
    return this.copyTo(new FloatProperty());
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new FloatProperty();
    reader(t);
    return t;
  })]);
  _es6_module.add_class(FloatProperty);
  FloatProperty = _es6_module.add_export('FloatProperty', FloatProperty);
  FloatProperty.STRUCT = STRUCT.inherit(FloatProperty, ToolProperty)+"\n  data : float;\n}\n";
  var IntProperty=_ESClass("IntProperty", ToolProperty, [function IntProperty(i, apiname, uiname, description, range, uirange, flag) {
    ToolProperty.call(this, PropTypes.INT, apiname, uiname, description, flag);
    if (uirange==undefined) {
        uirange = range;
    }
    this.ui_range = uirange;
    this.range = range;
    this.data = i;
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    dst.ui_range = this.ui_range;
    dst.range = this.range;
    return dst;
  }, function copy() {
    return this.copyTo(new IntProperty());
  }, function pack(data) {
    pack_int(this.data);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new IntProperty();
    reader(t);
    return t;
  })]);
  _es6_module.add_class(IntProperty);
  IntProperty = _es6_module.add_export('IntProperty', IntProperty);
  IntProperty.STRUCT = STRUCT.inherit(IntProperty, ToolProperty)+"\n  data : int;\n}\n";
  var BoolProperty=_ESClass("BoolProperty", ToolProperty, [function BoolProperty(bool, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.BOOL, apiname, uiname, description, flag);
    this.data = bool ? true : false;
  }, function pack(data) {
    pack_int(this.data);
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    dst.ui_range = this.ui_range;
    dst.range = this.range;
    return dst;
  }, function copy() {
    return this.copyTo(new BoolProperty());
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new BoolProperty();
    reader(t);
    t.data = !!t.data;
    return t;
  })]);
  _es6_module.add_class(BoolProperty);
  BoolProperty = _es6_module.add_export('BoolProperty', BoolProperty);
  BoolProperty.STRUCT = STRUCT.inherit(BoolProperty, ToolProperty)+"\n  data : int;\n}\n";
  var StringProperty=_ESClass("StringProperty", ToolProperty, [function StringProperty(string, apiname, uiname, description, flag) {
    if (string==undefined)
      string = "";
    ToolProperty.call(this, PropTypes.STRING, apiname, uiname, description, flag);
    this.data = string;
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    dst.ui_range = this.ui_range;
    dst.range = this.range;
    return dst;
  }, function copy() {
    return this.copyTo(new StringProperty());
  }, function pack(data) {
    pack_string(this.data);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new StringProperty();
    reader(t);
    return t;
  })]);
  _es6_module.add_class(StringProperty);
  StringProperty = _es6_module.add_export('StringProperty', StringProperty);
  StringProperty.STRUCT = STRUCT.inherit(StringProperty, ToolProperty)+"\n  data : string;\n}\n";
  var TransformProperty=_ESClass("TransformProperty", ToolProperty, [function TransformProperty(value, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.TRANSFORM, apiname, uiname, description, flag);
    if (value!=undefined)
      ToolProperty.prototype.set_data.call(this, new Matrix4UI(value));
  }, function set_data(data, owner, changed, set_data) {
    this.data.load(data);
    ToolProperty.prototype.set_data.call(this, undefined, owner, changed, false);
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    dst.data = new Matrix4UI(new Matrix4());
    dst.data.load(this.data);
    return dst;
  }, function copy() {
    return this.copyTo(new TransformProperty());
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new TransformProperty();
    reader(t);
    t.data = new Matrix4UI(t.data);
    return t;
  })]);
  _es6_module.add_class(TransformProperty);
  TransformProperty = _es6_module.add_export('TransformProperty', TransformProperty);
  TransformProperty.STRUCT = STRUCT.inherit(TransformProperty, ToolProperty)+"\n  data : mat4;\n}\n";
  var EnumProperty=_ESClass("EnumProperty", ToolProperty, [function EnumProperty(string, valid_values, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.ENUM, apiname, uiname, description, flag);
    this.values = {}
    this.keys = {}
    this.ui_value_names = {}
    if (valid_values==undefined)
      return ;
    if (__instance_of(valid_values, Array)||__instance_of(valid_values, String)) {
        for (var i=0; i<valid_values.length; i++) {
            this.values[valid_values[i]] = valid_values[i];
            this.keys[valid_values[i]] = valid_values[i];
        }
    }
    else {
      for (var k in valid_values) {
          this.values[k] = valid_values[k];
          this.keys[valid_values[k]] = k;
      }
    }
    if (string==undefined) {
        this.data = Iterator(valid_values).next();
    }
    else {
      this.set_value(string);
    }
    for (var k in this.values) {
        var uin=k[0].toUpperCase()+k.slice(1, k.length);
        uin = uin.replace(/\_/g, " ");
        this.ui_value_names[k] = uin;
    }
    this.iconmap = {}
  }, function load_ui_data(prop) {
    ToolProperty.prototype.load_ui_data.call(this, prop);
    this.ui_value_names = Object.create(prop.ui_value_names);
    this.iconmap = Object.create(prop.iconmap);
    this.values = Object.create(prop.values);
    this.keys = Object.create(prop.keys);
  }, function add_icons(iconmap) {
    for (var k in iconmap) {
        this.iconmap[k] = iconmap[k];
    }
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, true);
    p.keys = Object.create(this.keys);
    p.values = Object.create(this.values);
    p.data = this.data;
    p.ui_value_names = this.ui_value_names;
    p.update = this.update;
    p.api_update = this.api_update;
    for (var k in this.iconmap) {
        p.iconmap[k] = this.iconmap[k];
    }
    return p;
  }, function copy() {
    var p=new EnumProperty("dummy", {"dummy": 0}, this.apiname, this.uiname, this.description, this.flag);
    p.keys = Object.create(this.keys);
    p.values = Object.create(this.values);
    p.data = this.data;
    p.ui_value_names = this.ui_value_names;
    p.update = this.update;
    p.api_update = this.api_update;
    for (var k in this.iconmap) {
        p.iconmap[k] = this.iconmap[k];
    }
    return p;
  }, function pack(data) {
    pack_string(this.data);
  }, function get_value() {
    if (this.data in this.values)
      return this.values[this.data];
    else 
      return this.data;
  }, function set_value(val) {
    if (!(val in this.values)&&(val in this.keys))
      val = this.keys[val];
    if (!(val in this.values)) {
        console.trace("Invalid value for enum!");
        console.log("Invalid value for enum!", val, this.values);
        return ;
    }
    this.data = new String(val);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new EnumProperty();
    reader(t);
    return t;
  })]);
  _es6_module.add_class(EnumProperty);
  EnumProperty = _es6_module.add_export('EnumProperty', EnumProperty);
  EnumProperty.STRUCT = STRUCT.inherit(EnumProperty, ToolProperty)+"\n  data : string | obj.data.toString();\n}\n";
  var Vec2Property=_ESClass("Vec2Property", ToolProperty, [function Vec2Property(vec2, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.VEC2, apiname, uiname, description, flag);
    this.unit = undefined;
    this.range = [undefined, undefined];
    this.real_range = [undefined, undefined];
    this.data = new Vector3(vec2);
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    dst.data = new Vector3(this.data);
    dst.real_range = this.real_range;
    dst.range = this.range;
    return dst;
  }, function set_data(data, owner, changed) {
    this.data.load(data);
    ToolProperty.prototype.set_data.call(this, undefined, owner, changed, false);
  }, function copy() {
    return this.copyTo(new Vec2Property());
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new Vec2Property();
    reader(t);
    return t;
  })]);
  _es6_module.add_class(Vec2Property);
  Vec2Property = _es6_module.add_export('Vec2Property', Vec2Property);
  Vec2Property.STRUCT = STRUCT.inherit(Vec2Property, ToolProperty)+"\n  data : array(float);\n}\n";
  var Vec3Property=_ESClass("Vec3Property", ToolProperty, [function Vec3Property(vec3, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.VEC3, apiname, uiname, description, flag);
    this.unit = "default";
    this.range = [undefined, undefined];
    this.real_range = [undefined, undefined];
    this.data = new Vector3(vec3);
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    dst.data = new Vector3(this.data);
    dst.real_range = this.real_range;
    dst.range = this.range;
    return dst;
  }, function set_data(data, owner, changed) {
    this.data.load(data);
    ToolProperty.prototype.set_data.call(this, undefined, owner, changed, false);
  }, function copy() {
    return this.copyTo(new Vec3Property());
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new Vec3Property();
    reader(t);
    return t;
  })]);
  _es6_module.add_class(Vec3Property);
  Vec3Property = _es6_module.add_export('Vec3Property', Vec3Property);
  Vec3Property.STRUCT = STRUCT.inherit(Vec3Property, ToolProperty)+"\n  data : vec3;\n}\n";
  var Vec4Property=_ESClass("Vec4Property", ToolProperty, [function Vec4Property(vec4, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.VEC4, apiname, uiname, description, flag);
    this.subtype==PropTypes.VEC4;
    this.unit = "default";
    this.range = [undefined, undefined];
    this.real_range = [undefined, undefined];
    this.data = new Vector4(vec4);
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    dst.data = new Vector4();
    dst.real_range = this.real_range;
    dst.range = this.range;
    dst.data.load(this.data);
    return dst;
  }, function set_data(data, owner, changed) {
    this.data.load(data);
    ToolProperty.prototype.set_data.call(this, undefined, owner, changed, false);
  }, function copy() {
    return this.copyTo(new Vec4Property());
  }, _ESClass.static(function fromSTRUCT(reader) {
    var t=new Vec4Property();
    reader(t);
    return t;
  })]);
  _es6_module.add_class(Vec4Property);
  Vec4Property = _es6_module.add_export('Vec4Property', Vec4Property);
  Vec4Property.STRUCT = STRUCT.inherit(Vec4Property, ToolProperty)+"\n  data : vec4;\n}\n";
  var ToolIter=es6_import_item(_es6_module, 'toolprops_iter', 'ToolIter');
  var type_filter_iter=_ESClass("type_filter_iter", ToolIter, [function type_filter_iter(iter, typefilter, ctx) {
    this.types = typefilter;
    this.ret = {done: false, value: undefined}
    this.iter = iter;
    this._ctx = ctx;
  }, _ESClass.set(function ctx(ctx) {
    this._ctx = ctx;
    this.iter.ctx = ctx;
  }), _ESClass.get(function ctx() {
    return this._ctx;
  }), function reset() {
    this.iter.ctx = this.ctx;
    this.iter.reset();
  }, function next() {
    var ret=this.iter.next();
    var types=this.types;
    var tlen=this.types.length;
    var this2=this;
    function has_type(obj) {
      for (i = 0; i<tlen; i++) {
          if (__instance_of(obj, types[i]))
            return true;
      }
      return false;
    }
    while (!ret.done&&!has_type(ret.value)) {
      ret = this.iter.next();
    }
    this.ret.done = ret.done;
    this.ret.value = ret.value;
    ret = this.ret;
    if (ret.done&&this.iter.reset) {
        this.iter.reset();
    }
    return ret;
  }]);
  _es6_module.add_class(type_filter_iter);
  type_filter_iter = _es6_module.add_export('type_filter_iter', type_filter_iter);
  var CollectionProperty=_ESClass("CollectionProperty", ToolProperty, [function CollectionProperty(data, filter_types, apiname, uiname, description, flag) {
    ToolProperty.call(this, PropTypes.COLLECTION, apiname, uiname, description, flag);
    this.flag|=TPropFlags.COLL_LOOSE_TYPE;
    this.types = filter_types;
    this._data = undefined;
    this._ctx = undefined;
    this.set_data(data);
  }, function copyTo(dst) {
    ToolProperty.prototype.copyTo.call(this, dst, false);
    dst.types = this.types;
    this.set_data(this.data);
    return dst;
  }, function copy() {
    var ret=this.copyTo(new CollectionProperty());
    ret.types = this.types;
    ret._ctx = this._ctx;
    if (this._data!=undefined&&this._data.copy!=undefined)
      ret.set_data(this._data.copy());
    return ret;
  }, _ESClass.get(function ctx() {
    return this._ctx;
  }), _ESClass.set(function ctx(data) {
    this._ctx = data;
    if (this._data!=undefined)
      this._data.ctx = data;
  }), function set_data(data, owner, changed) {
    if (data==undefined) {
        this._data = undefined;
        return ;
    }
    if ("__tooliter__" in data&&typeof data.__tooliter__=="function") {
        this.set_data(data.__tooliter__(), owner, changed);
        return ;
    }
    else 
      if (!(this.flag&TPropFlags.COLL_LOOSE_TYPE)&&!(TPropIterable.isTPropIterable(data))) {
        console.trace();
        console.log("ERROR: bad data '", data, "' was passed to CollectionProperty.set_data!");
        throw new Error("ERROR: bad data '", data, "' was passed to CollectionProperty.set_data!");
    }
    this._data = data;
    this._data.ctx = this.ctx;
    ToolProperty.prototype.set_data.call(this, undefined, owner, changed, false);
  }, _ESClass.set(function data(data) {
    this.set_data(data);
  }), _ESClass.get(function data() {
    return this._data;
  }), _ESClass.symbol(Symbol.iterator, function iterator() {
    if (this._data==undefined)
      return {next: function() {
      return {done: true, value: undefined}
    }}
    this._data.ctx = this._ctx;
    if (this.types!=undefined&&this.types.length>0)
      return new type_filter_iter(this.data[Symbol.iterator](), this.types, this._ctx);
    else 
      return this.data[Symbol.iterator]();
  }), _ESClass.static(function fromSTRUCT(reader) {
    var ret=new CollectionProperty();
    reader(ret);
    return ret;
  })]);
  _es6_module.add_class(CollectionProperty);
  CollectionProperty = _es6_module.add_export('CollectionProperty', CollectionProperty);
  CollectionProperty.STRUCT = STRUCT.inherit(CollectionProperty, ToolProperty)+"\n    data : abstract(Object) | obj.data == undefined ? new BlankArray() : obj.data;\n  }\n";
  var BlankArray=_ESClass("BlankArray", [_ESClass.static(function fromSTRUCT(reader) {
    return undefined;
  }), function BlankArray() {
  }]);
  _es6_module.add_class(BlankArray);
  BlankArray = _es6_module.add_export('BlankArray', BlankArray);
  BlankArray.STRUCT = "\n  BlankArray {\n    length : int | 0;\n  }\n";
  window.BlankArray = BlankArray;
});
es6_module_define('toolprops_iter', ["struct"], function _toolprops_iter_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var TPropIterable=_ESClass("TPropIterable", [function TPropIterable() {
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
  }), function _is_tprop_iterable() {
  }, _ESClass.static(function isTPropIterable(obj) {
    return obj!=undefined&&"_is_tprop_iterable" in obj;
  })]);
  _es6_module.add_class(TPropIterable);
  TPropIterable = _es6_module.add_export('TPropIterable', TPropIterable);
  window.TPropIterable = TPropIterable;
  var TCanSafeIter=_ESClass("TCanSafeIter", [function TCanSafeIter() {
  }, function __tooliter__() {
  }]);
  _es6_module.add_class(TCanSafeIter);
  TCanSafeIter = _es6_module.add_export('TCanSafeIter', TCanSafeIter);
  window.TCanSafeIter = TCanSafeIter;
  var ToolIter=_ESClass("ToolIter", TPropIterable, [function ToolIter(itemtypes) {
    if (itemtypes==undefined) {
        itemtypes = [];
    }
    TPropIterable.call(this);
    this.itemtypes = itemtypes;
    this.ctx = undefined;
    this.ret = {done: true, value: undefined}
  }, function next() {
  }, function reset() {
  }, function spawn() {
  }, function _get_block(ref) {
    if (this.ctx!=undefined) {
        if (ref.lib_id==this.ctx.object.lib_id)
          return this.ctx.object;
        else 
          return this.ctx.datalib.get(ref);
    }
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this;
  }), _ESClass.static(function fromSTRUCT(reader) {
    var obj=new ToolIter();
    reader(obj);
    return obj;
  })]);
  _es6_module.add_class(ToolIter);
  ToolIter = _es6_module.add_export('ToolIter', ToolIter);
  ToolIter.STRUCT = "\n  ToolIter {\n  }\n";
  var MSelectIter=_ESClass("MSelectIter", ToolIter, [function MSelectIter(typemask, mesh) {
    ToolIter.call(this);
    this.meshref = new DataRef(mesh);
    this.mask = typemask;
    this.mesh = undefined;
    this.init = true;
    this.iter = undefined;
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    if (this.init) {
        return this;
    }
    else {
      return new MSelectIter(this.mask, this.meshref);
    }
  }), function reset() {
    this.init = true;
    this.mesh = undefined;
    this.iter = undefined;
  }, function next() {
    if (this.init) {
        this.mesh = this._get_block(this.meshref);
        this.init = false;
        this.iter = new selectiter(this.mesh, this.mask);
    }
    var ret=this.iter.next();
    if (ret.done) {
        this.reset();
    }
    return ret;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ob={}
    reader(ob);
    var ret=new MSelectIter(ob.mask, ob.meshref);
    return ret;
  })]);
  _es6_module.add_class(MSelectIter);
  MSelectIter.STRUCT = STRUCT.inherit(MSelectIter, ToolIter)+"\n  meshref  : DataRef;\n  mask     : int;\n}\n";
  var $map_UObt_fromSTRUCT;
  var element_iter_convert=_ESClass("element_iter_convert", ToolIter, [function element_iter_convert(iter, type) {
    ToolIter.call(this);
    if (!(__instance_of(iter, TPropIterable))) {
        throw new Error("element_iter_convert requires a 'safe' TPropIterable-derived iterator");
    }
    this.vset = new set();
    this.iter = iter[Symbol.iterator]();
    this.subiter = undefined;
    if (type==MeshTypes.VERT)
      this.type = Vertex;
    else 
      if (type==MeshTypes.EDGE)
      this.type = Edge;
    else 
      if (type==MeshTypes.LOOP)
      this.type = Loop;
    else 
      if (type==MeshTypes.FACE)
      this.type = Face;
  }, function reset() {
    if (this.iter.reset!=undefined)
      this.iter.reset();
    this.vset = new set();
    this.iter.ctx = this.ctx;
  }, _ESClass.symbol(Symbol.iterator, function iterator() {
    return this;
  }), function next() {
    if (this.mesh!=undefined)
      this.iter.mesh = this.mesh;
    var v=this._next();
    if (v.done)
      return v;
    var vset=this.vset;
    while ((!v.done)&&(v.value==undefined||vset.has(v.value))) {
      v = this._next();
    }
    if (!v.done)
      vset.add(v.value);
    return v;
  }, function _next() {
    if (this.subiter==undefined) {
        var next=this.iter.next();
        if (next.done) {
            this.reset();
            return next;
        }
        if (next.value.constructor.name==this.type.name)
          return next;
        this.subiter = next.value.verts[Symbol.iterator]();
    }
    var vset=this.vset;
    var v=this.subiter.next();
    if (v.done) {
        this.subiter = undefined;
        return this._next();
    }
    return v;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ob={}
    reader(ob);
    var type=$map_UObt_fromSTRUCT[ob.type];
    var ret=new element_iter_convert(ob._iter, type);
  })]);
  var $map_UObt_fromSTRUCT={Vertex: 1, Edge: 2, Loop: 4, Face: 8}
  _es6_module.add_class(element_iter_convert);
  element_iter_convert.STRUCT = STRUCT.inherit(element_iter_convert, ToolIter)+"\n  type  : string | this.type != undefined ? this.type.constructor.name : \"\";\n  _iter : abstract(ToolIter) | obj.iter;\n}\n";
});
es6_module_define('toolops_api', ["toolprops", "events", "struct"], function _toolops_api_module(_es6_module) {
  "use strict";
  var PropTypes=es6_import_item(_es6_module, 'toolprops', 'PropTypes');
  var TPropFlags=es6_import_item(_es6_module, 'toolprops', 'TPropFlags');
  var STRUCT=es6_import_item(_es6_module, 'struct', 'STRUCT');
  var EventHandler=es6_import_item(_es6_module, 'events', 'EventHandler');
  var charmap=es6_import_item(_es6_module, 'events', 'charmap');
  var UndoFlags={IGNORE_UNDO: 2, IS_ROOT_OPERATOR: 4, UNDO_BARRIER: 8, HAS_UNDO_DATA: 16}
  UndoFlags = _es6_module.add_export('UndoFlags', UndoFlags);
  var ToolFlags={HIDE_TITLE_IN_LAST_BUTTONS: 1, USE_PARTIAL_UNDO: 2, USE_DEFAULT_INPUT: 4}
  ToolFlags = _es6_module.add_export('ToolFlags', ToolFlags);
  var ModalStates={TRANSFORMING: 1, PLAYING: 2}
  ModalStates = _es6_module.add_export('ModalStates', ModalStates);
  var _tool_op_idgen=1;
  var InheritFlag=_ESClass("InheritFlag", [function InheritFlag(val) {
    this.val = val;
  }]);
  _es6_module.add_class(InheritFlag);
  
  var ToolOpAbstract=_ESClass("ToolOpAbstract", [_ESClass.static(function inherit(inputs_or_outputs) {
    return new InheritFlag(inputs_or_outputs);
  }), _ESClass.static(function _get_slots() {
    var ret=[{}, {}];
    var parent=this.__parent__;
    if (this.tooldef!=undefined&&(parent==undefined||this.tooldef!==parent.tooldef)) {
        var tooldef=this.tooldef();
        for (var k in tooldef) {
            if (k!="inputs"&&k!="outputs") {
                continue;
            }
            var v=tooldef[k];
            if (__instance_of(v, InheritFlag)) {
                v = v.val==undefined ? {} : v.val;
                var slots=parent._get_slots();
                slots = k=="inputs" ? slots[0] : slots[1];
                v = this._inherit_slots(slots, v);
            }
            ret[k=="inputs" ? 0 : 1] = v;
        }
    }
    else 
      if (this.inputs!=undefined||this.outputs!=undefined) {
        console.trace("Deprecation warning: (second) old form                     of toolprop definition detected for", this);
        if (this.inputs!=undefined) {
            ret[0] = this.inputs;
        }
        if (this.outputs!=undefined) {
            ret[1] = this.outputs;
        }
    }
    else {
      console.trace("Deprecation warning: oldest (and evilest) form                     of toolprop detected for", this);
    }
    return ret;
  }), function ToolOpAbstract(apiname, uiname, description, icon) {
    if (description==undefined) {
        description = undefined;
    }
    if (icon==undefined) {
        icon = -1;
    }
    var parent=this.constructor.__parent__;
    var slots=this.constructor._get_slots();
    for (var i=0; i<2; i++) {
        var slots2={};
        if (i==0)
          this.inputs = slots2;
        else 
          this.outputs = slots2;
        for (var k in slots[i]) {
            slots2[k] = slots[i][k].copy();
            slots2[k].apiname = k;
        }
    }
    if (this.constructor.tooldef!=undefined&&(parent==undefined||this.constructor.tooldef!==parent.tooldef)) {
        var tooldef=this.constructor.tooldef();
        for (var k in tooldef) {
            if (k=="inputs"||k=="outputs")
              continue;
            this[k] = tooldef[k];
        }
    }
    else {
      if (this.name==undefined)
        this.name = apiname;
      if (this.uiname==undefined)
        this.uiname = uiname;
      if (this.description==undefined)
        this.description = description==undefined ? "" : description;
      if (this.icon==undefined)
        this.icon = icon;
    }
    this.apistruct = undefined;
    this.op_id = _tool_op_idgen++;
    this.stack_index = -1;
  }, _ESClass.static(function _inherit_slots(old, newslots) {
    if (old==undefined) {
        console.trace("Warning: old was undefined in _inherit_slots()!");
        return newslots;
    }
    for (var k in old) {
        if (!(k in newslots))
          newslots[k] = old[k];
    }
    return newslots;
  }), _ESClass.static(function inherit_inputs(cls, newslots) {
    if (cls.inputs==undefined)
      return newslots;
    return ToolOpAbstract._inherit_slots(cls.inputs, newslots);
  }), _ESClass.static(function inherit_outputs(cls, newslots) {
    if (cls.outputs==undefined)
      return newslots;
    return ToolOpAbstract._inherit_slots(cls.outputs, newslots);
  }), function get_saved_context() {
    if (this.saved_context==undefined) {
        console.log("warning : invalid saved_context in "+this.constructor.name+".get_saved_context()");
        this.saved_context = new SavedContext(new Context());
    }
    return this.saved_context;
  }, _ESClass.symbol(Symbol.keystr, function keystr() {
    return "TO"+this.op_id;
  }), function exec(tctx) {
  }, function default_inputs(ctx, get_default) {
  }]);
  _es6_module.add_class(ToolOpAbstract);
  ToolOpAbstract = _es6_module.add_export('ToolOpAbstract', ToolOpAbstract);
  ToolOpAbstract.STRUCT = "\n  ToolOpAbstract {\n      flag    : int;\n      saved_context  : SavedContext | obj.get_saved_context();\n      inputs  : iter(k, PropPair) | new PropPair(k, obj.inputs[k]);\n      outputs : iter(k, PropPair) | new PropPair(k, obj.outputs[k]);\n  }\n";
  var PropPair=_ESClass("PropPair", [function PropPair(key, value) {
    this.key = key;
    this.value = value;
  }, _ESClass.static(function fromSTRUCT(reader) {
    var obj={}
    reader(obj);
    return obj;
  })]);
  _es6_module.add_class(PropPair);
  PropPair.STRUCT = "\n  PropPair {\n    key   : string;\n    value : abstract(ToolProperty);\n  }\n";
  var $toolops_6mJM_get_constructor;
  var ToolOp=_ESClass("ToolOp", ToolOpAbstract, [function ToolOp(apiname, uiname, description, icon) {
    if (apiname==undefined) {
        apiname = "(undefined)";
    }
    if (uiname==undefined) {
        uiname = "(undefined)";
    }
    if (description==undefined) {
        description = undefined;
    }
    if (icon==undefined) {
        icon = -1;
    }
    ToolOpAbstract.call(this, apiname, uiname, description, icon);
    EventHandler.call(this);
    this.drawlines = new GArray();
    if (this.is_modal==undefined)
      this.is_modal = false;
    this.undoflag = 0;
    this.on_modal_end = undefined;
    this.modal_ctx = null;
    this.flag = 0;
    this.keyhandler = undefined;
    this.parent = undefined;
    this.widgets = [];
    this.modal_running = false;
    this._widget_on_tick = undefined;
  }, function new_drawline(v1, v2) {
    var dl=this.modal_ctx.view2d.make_drawline(v1, v2);
    this.drawlines.push(dl);
    return dl;
  }, function reset_drawlines(ctx) {
    if (ctx==undefined) {
        ctx = this.modal_ctx;
    }
    var view2d=ctx.view2d;
    var __iter_dl=__get_iter(this.drawlines);
    var dl;
    while (1) {
      var __ival_dl=__iter_dl.next();
      if (__ival_dl.done) {
          break;
      }
      dl = __ival_dl.value;
      view2d.kill_drawline(dl);
    }
    this.drawlines.reset();
  }, _ESClass.static(function create_widgets(manager, ctx) {
  }), _ESClass.static(function reset_widgets(op, ctx) {
  }), function undo_ignore() {
    this.undoflag|=UndoFlags.IGNORE_UNDO;
  }, function on_mousemove() {
    redraw_viewport();
  }, function exec_pre(tctx) {
    for (var k in this.inputs) {
        if (this.inputs[k].type==PropTypes.COLLECTION) {
            this.inputs[k].ctx = tctx;
        }
    }
    for (var k in this.outputs) {
        if (this.outputs[k].type==PropTypes.COLLECTION) {
            this.outputs[k].ctx = tctx;
        }
    }
  }, function start_modal(ctx) {
  }, function _start_modal(ctx) {
    this.modal_running = true;
    ctx.view2d.push_modal(this);
    this.modal_ctx = ctx;
  }, function _end_modal() {
    var ctx=this.modal_ctx;
    this.modal_running = false;
    this.saved_context = new SavedContext(this.modal_ctx);
    this.modal_ctx.view2d.pop_modal();
    if (this.on_modal_end!=undefined)
      this.on_modal_end(this);
    this.reset_drawlines(ctx);
  }, function end_modal() {
    this._end_modal();
  }, function can_call(ctx) {
    return true;
  }, function exec(ctx) {
  }, function start_modal(ctx) {
  }, function redo_post(ctx) {
    window.redraw_viewport();
  }, function undo_pre(ctx) {
    this._undocpy = g_app_state.create_undo_file();
    window.redraw_viewport();
  }, function undo(ctx) {
    g_app_state.load_undo_file(this._undocpy);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var op=new ToolOp();
    reader(op);
    var ins={}
    for (var i=0; i<op.inputs.length; i++) {
        ins[op.inputs[i].key] = op.inputs[i].value;
    }
    var outs={}
    for (var i=0; i<op.outputs.length; i++) {
        outs[op.outputs[i].key] = op.outputs[i].value;
    }
    op.inputs = ins;
    op.outputs = outs;
    return op;
  }), _ESClass.static(function get_constructor(name) {
    if ($toolops_6mJM_get_constructor==undefined) {
        $toolops_6mJM_get_constructor = {};
        for (var c in defined_classes) {
            if (__instance_of(c, ToolOp))
              $toolops_6mJM_get_constructor[c.name] = c;
        }
    }
    return $toolops_6mJM_get_constructor[c];
  })]);
  var $toolops_6mJM_get_constructor=undefined;
  _es6_module.add_class(ToolOp);
  ToolOp = _es6_module.add_export('ToolOp', ToolOp);
  ToolOp.STRUCT = "\n  ToolOp {\n      flag    : int;\n      saved_context  : SavedContext | obj.get_saved_context();\n      inputs  : iter(k, PropPair) | new PropPair(k, obj.inputs[k]);\n      outputs : iter(k, PropPair) | new PropPair(k, obj.outputs[k]);\n  }\n";
  var ToolMacro=_ESClass("ToolMacro", ToolOp, [function ToolMacro(name, uiname, tools) {
    if (tools==undefined) {
        tools = undefined;
    }
    ToolOp.call(this, name, uiname);
    this.cur_modal = 0;
    this._chained_on_modal_end = false;
    if (tools==undefined)
      this.tools = new GArray();
    else 
      this.tools = new GArray(tools);
  }, function add_tool(tool) {
    tool.parent = this;
    this.tools.push(tool);
    if (tool.is_modal)
      this.is_modal = true;
  }, function connect_tools(output, input) {
    var old_set=input.user_set_data;
    input.user_set_data = function() {
      this.data = output.data;
      old_set.call(this);
    }
  }, function undo_pre(ctx) {
  }, function undo(ctx) {
    for (var i=this.tools.length-1; i>=0; i--) {
        this.tools[i].undo(ctx);
    }
  }, function exec(ctx) {
    for (var i=0; i<this.tools.length; i++) {
        this.tools[i].saved_context = this.saved_context;
    }
    for (var op in this.tools) {
        if (op.is_modal)
          op.is_modal = this.is_modal;
        for (var k in op.inputs) {
            var p=op.inputs[k];
            if (p.user_set_data!=undefined)
              p.user_set_data.call(p);
        }
        op.saved_context = this.saved_context;
        op.undo_pre(ctx);
        op.undoflag|=UndoFlags.HAS_UNDO_DATA;
        op.exec_pre(ctx);
        op.exec(ctx);
    }
  }, function can_call(ctx) {
    return this.tools[0].can_call(ctx);
  }, function start_modal(ctx) {
    if (!this._chained_on_modal_end) {
        var last_modal=undefined;
        for (var op in this.tools) {
            if (op.is_modal)
              last_modal = op;
        }
        console.log("last_modal", last_modal);
        if (last_modal!=undefined) {
            console.log("yay, found last modal");
            var on_modal_end=last_modal.on_modal_end;
            var this2=this;
            last_modal.on_modal_end = function(toolop) {
              if (on_modal_end!=undefined)
                on_modal_end(toolop);
              if (this2.on_modal_end)
                this2.on_modal_end(this2);
            };
            this._chained_on_modal_end = true;
        }
    }
    for (var i=0; i<this.tools.length; i++) {
        this.tools[i].saved_context = this.saved_context;
    }
    for (var i=0; i<this.tools.length; i++) {
        var op=this.tools[i];
        if (op.is_modal) {
            this.cur_modal = i;
            for (var k in op.inputs) {
                var p=op.inputs[k];
                if (p.user_set_data!=undefined)
                  p.user_set_data.call(p);
            }
            op.modal_ctx = this.modal_ctx;
            op.modal_tctx = this.modal_tctx;
            op.saved_context = this.saved_context;
            op.undo_pre(ctx);
            op.undoflag|=UndoFlags.HAS_UNDO_DATA;
            op.modal_running = true;
            return op.start_modal(ctx);
        }
        else {
          for (var k in op.inputs) {
              var p=op.inputs[k];
              if (p.user_set_data!=undefined)
                p.user_set_data.call(p);
          }
          op.saved_context = this.saved_context;
          op.exec_pre(ctx);
          op.undo_pre(ctx);
          op.undoflag|=UndoFlags.HAS_UNDO_DATA;
          op.exec(ctx);
        }
    }
  }, function _end_modal() {
    var ctx=this.modal_ctx;
    this.next_modal(ctx);
  }, function next_modal(ctx) {
    this.tools[this.cur_modal].end_modal(ctx);
    this.cur_modal++;
    while (this.cur_modal<this.tools.length&&!this.tools[this.cur_modal].is_modal) {
      this.cur_modal++    }
    if (this.cur_modal>=this.tools.length) {
        ToolOp.prototype._end_modal.call(this);
    }
    else {
      this.tools[this.cur_modal].undo_pre(ctx);
      this.tools[this.cur_modal].undoflag|=UndoFlags.HAS_UNDO_DATA;
      this.tools[this.cur_modal].start_modal(ctx);
    }
  }, function on_mousemove(event) {
    this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
    this.tools[this.cur_modal].on_mousemove(event);
  }, function on_mousedown(event) {
    this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
    this.tools[this.cur_modal].on_mousedown(event);
  }, function on_mouseup(event) {
    this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
    this.tools[this.cur_modal].on_mouseup(event);
  }, function on_keydown(event) {
    this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
    this.tools[this.cur_modal].on_keydown(event);
  }, function on_keyup(event) {
    this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
    this.tools[this.cur_modal].on_keyup(event);
  }, function on_draw(event) {
    this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
    this.tools[this.cur_modal].on_draw(event);
  }, _ESClass.static(function fromSTRUCT(reader) {
    var ret=STRUCT.chain_fromSTRUCT(ToolMacro, reader);
    ret.tools = new GArray(ret.tools);
    var __iter_t=__get_iter(ret.tools);
    var t;
    while (1) {
      var __ival_t=__iter_t.next();
      if (__ival_t.done) {
          break;
      }
      t = __ival_t.value;
      t.parent = this;
    }
    return ret;
  })]);
  _es6_module.add_class(ToolMacro);
  ToolMacro = _es6_module.add_export('ToolMacro', ToolMacro);
  ToolMacro.STRUCT = STRUCT.inherit(ToolMacro, ToolOp)+"\n  tools   : array(abstract(ToolOp));\n  apiname : string;\n  uiname  : string;\n}\n";
  var StringProperty=es6_import_item(_es6_module, 'toolprops', 'StringProperty');
  var Vec3Property=es6_import_item(_es6_module, 'toolprops', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, 'toolprops', 'Vec4Property');
  var IntProperty=es6_import_item(_es6_module, 'toolprops', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, 'toolprops', 'FloatProperty');
  var BoolProperty=es6_import_item(_es6_module, 'toolprops', 'BoolProperty');
  var DataPathOp=_ESClass("DataPathOp", ToolOp, [function DataPathOp(path, use_simple_undo) {
    if (path==undefined) {
        path = "";
    }
    if (use_simple_undo==undefined) {
        use_simple_undo = false;
    }
    ToolOpAbstract.call(this, "DataPathOp", "DataPath", "DataPath Value Set");
    this.use_simple_undo = use_simple_undo;
    this.is_modal = false;
    this.path = path;
    this.inputs = {path: new StringProperty(path, "path", "path", "path"), vec3: new Vec3Property(undefined, "vec3", "vec3", "vec3"), vec4: new Vec4Property(undefined, "vec4", "vec4", "vec4"), pint: new IntProperty(0, "pint", "pint", "pint"), pfloat: new FloatProperty(0, "pfloat", "pfloat", "pfloat"), str: new StringProperty("", "str", "str", "str"), bool: new BoolProperty(false, "bool", "bool", "bool"), val_input: new StringProperty("", "val_input", "val_input", "val_input")}
    this.outputs = {}
    for (var k in this.inputs) {
        this.inputs[k].flag|=TPropFlags.PRIVATE;
    }
  }, function undo_pre(ctx) {
    this._undocpy = g_app_state.create_undo_file();
  }, function undo(ctx) {
    g_app_state.load_undo_file(this._undocpy);
  }, function get_prop_input(path, prop) {
    if (prop==undefined) {
        console.trace("Warning: DataPathOp failed!", path, prop);
        return ;
    }
    var input;
    if (prop.type==PropTypes.INT) {
        input = this.inputs.pint;
    }
    else 
      if (prop.type==PropTypes.FLOAT) {
        input = this.inputs.pfloat;
    }
    else 
      if (prop.type==PropTypes.VEC3) {
        input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec3;
    }
    else 
      if (prop.type==PropTypes.VEC4) {
        input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec4;
    }
    else 
      if (prop.type==PropTypes.BOOL) {
        input = this.inputs.bool;
    }
    else 
      if (prop.type==PropTypes.STR) {
        input = this.inputs.str;
    }
    else 
      if (prop.type==PropTypes.FLAG) {
        input = this.inputs.str;
    }
    else 
      if (prop.type==PropTypes.ENUM) {
        input = this.inputs.pint;
    }
    else {
      console.trace("ERROR: unimplemented prop type "+prop.type+"in DataPathOp", prop, this);
      return undefined;
    }
    return input;
  }, function exec(ctx) {
    var api=g_app_state.api;
    var path=this.inputs.path.data.trim();
    var prop=api.get_prop_meta(ctx, path);
    if (prop==undefined) {
        console.trace("Warning: DataPathOp failed!");
        return ;
    }
    var input=this.get_prop_input(path, prop);
    api.set_prop(ctx, path, input.data);
  }]);
  _es6_module.add_class(DataPathOp);
  mixin(ToolOp, EventHandler);
  var MassSetPathOp=_ESClass("MassSetPathOp", ToolOp, [function MassSetPathOp(path, subpath, filterstr, use_simple_undo) {
    if (path==undefined) {
        path = "";
    }
    if (subpath==undefined) {
        subpath = "";
    }
    if (filterstr==undefined) {
        filterstr = "";
    }
    if (use_simple_undo==undefined) {
        use_simple_undo = false;
    }
    ToolOpAbstract.call(this, "DataPathOp", "DataPath", "DataPath Value Set");
    this.use_simple_undo = use_simple_undo;
    this.is_modal = false;
    this.path = path;
    this.subpath = subpath;
    this.filterstr = filterstr;
    this.inputs = {path: new StringProperty(path, "path", "path", "path"), vec3: new Vec3Property(undefined, "vec3", "vec3", "vec3"), vec4: new Vec4Property(undefined, "vec4", "vec4", "vec4"), pint: new IntProperty(0, "pint", "pint", "pint"), pfloat: new FloatProperty(0, "pfloat", "pfloat", "pfloat"), str: new StringProperty("", "str", "str", "str"), bool: new BoolProperty(false, "bool", "bool", "bool"), val_input: new StringProperty("", "val_input", "val_input", "val_input")}
    this.outputs = {}
    for (var k in this.inputs) {
        this.inputs[k].flag|=TPropFlags.PRIVATE;
    }
  }, function _get_value(ctx) {
    var path=this.path.trim();
    var prop=api.get_prop_meta(ctx, path);
    if (prop==undefined) {
        console.trace("Warning: DataPathOp failed!");
        return ;
    }
    return this.get_prop_input(path, prop);
  }, function undo_pre(ctx) {
    var value=this._get_value(ctx);
    var paths=ctx.api.build_mass_set_paths(ctx, this.path, this.subpath, value, this.filterstr);
    var ud=this._undo = {}
    for (var i=0; i<paths.length; i++) {
        var value2=ctx.api.get_prop(paths[i]);
        ud[paths[i]] = JSON.stringify(value2);
    }
  }, function undo(ctx) {
    var value=this._get_value(ctx);
    var paths=ctx.api.build_mass_set_paths(ctx, this.path, this.subpath, value, this.filterstr);
    var ud=this._undo;
    for (var k in ud) {
        var data=JSON.parse(ud[k]);
        if (data=="undefined")
          data = undefined;
        ctx.api.set_prop(ctx, k, data);
    }
  }, function get_prop_input(path, prop) {
    if (prop==undefined) {
        console.trace("Warning: DataPathOp failed!", path, prop);
        return ;
    }
    var input;
    if (prop.type==PropTypes.INT) {
        input = this.inputs.pint;
    }
    else 
      if (prop.type==PropTypes.FLOAT) {
        input = this.inputs.pfloat;
    }
    else 
      if (prop.type==PropTypes.VEC3) {
        input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec3;
    }
    else 
      if (prop.type==PropTypes.VEC4) {
        input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec4;
    }
    else 
      if (prop.type==PropTypes.BOOL) {
        input = this.inputs.bool;
    }
    else 
      if (prop.type==PropTypes.STR) {
        input = this.inputs.str;
    }
    else 
      if (prop.type==PropTypes.FLAG) {
        input = this.inputs.str;
    }
    else 
      if (prop.type==PropTypes.ENUM) {
        input = this.inputs.pint;
    }
    else {
      console.trace("ERROR: unimplemented prop type "+prop.type+"in DataPathOp", prop, this);
      return undefined;
    }
    return input;
  }, function exec(ctx) {
    var api=g_app_state.api;
    var path=this.inputs.path.data.trim();
    var prop=api.get_prop_meta(ctx, path);
    if (prop==undefined) {
        console.trace("Warning: DataPathOp failed!");
        return ;
    }
    var input=this.get_prop_input(path, prop);
    api.mass_set_prop(ctx, path, this.subpath, input.data, this.filterstr);
  }]);
  _es6_module.add_class(MassSetPathOp);
  window.init_toolop_structs = function() {
    
    function gen_fromSTRUCT(cls1) {
      function fromSTRUCT(reader) {
        var op=new cls1();
        var inputs=op.inputs, outputs=op.outputs;
        reader(op);
        var ins=Object.create(inputs), outs=Object.create(outputs);
        for (var i=0; i<op.inputs.length; i++) {
            var k=op.inputs[i].key;
            ins[k] = op.inputs[i].value;
            if (k in inputs) {
                ins[k].load_ui_data(inputs[k]);
            }
            else {
              ins[k].uiname = ins[k].apiname = k;
            }
        }
        for (var i=0; i<op.outputs.length; i++) {
            var k=op.outputs[i].key;
            outs[k] = op.outputs[i].value;
            if (k in outputs) {
                outs[k].load_ui_data(outputs[k]);
            }
            else {
              outs[k].uiname = outs[k].apiname = k;
            }
        }
        op.inputs = ins;
        op.outputs = outs;
        return op;
      }
      return fromSTRUCT;
    }
    for (var i=0; i<defined_classes.length; i++) {
        var cls=defined_classes[i];
        var ok=false;
        var is_toolop=false;
        var parent=cls.__parent__;
        while (parent!==undefined) {
          if (parent===ToolOpAbstract) {
              ok = true;
          }
          else 
            if (parent===ToolOp) {
              ok = true;
              is_toolop = true;
              break;
          }
          parent = parent.__parent__;
        }
        if (!ok)
          continue;
        if (!("STRUCT" in cls)) {
            cls.STRUCT = cls.name+" {"+"\n        flag    : int;\n        inputs  : iter(k, PropPair) | new PropPair(k, obj.inputs[k]);\n        outputs : iter(k, PropPair) | new PropPair(k, obj.outputs[k]);\n      ";
            if (is_toolop)
              cls.STRUCT+="    saved_context  : SavedContext | obj.get_saved_context();\n";
            cls.STRUCT+="  }";
        }
        if (!("fromSTRUCT" in cls.__statics__)) {
            cls.fromSTRUCT = gen_fromSTRUCT(cls);
            define_static(cls, "fromSTRUCT", cls.fromSTRUCT);
        }
    }
  }
  var WidgetToolOp=_ESClass("WidgetToolOp", ToolOp, [_ESClass.static(function create_widgets(manager, ctx) {
    var widget=manager.create();
    var enabled_axes=this.widget_axes;
    var do_widget_center=this.widget_center;
    var gen_toolop=this.gen_toolop;
    var do_x=enabled_axes[0], do_y=enabled_axes[1], do_z=enabled_axes[2];
    if (do_x)
      widget.arrow([1, 0, 0], 0, [1, 0, 0, 1]);
    if (do_y)
      widget.arrow([0, 1, 0], 1, [0, 1, 0, 1]);
    if (do_z)
      widget.arrow([0, 0, 1], 2, [0, 0, 1, 1]);
    var this2=this;
    var $zaxis_bThP;
    function widget_on_tick(widget) {
      var mat=widget.matrix;
      var mesh=ctx.mesh;
      var cent=new Vector3();
      var len=0;
      var v1=new Vector3();
      var __iter_v=__get_iter(mesh.verts.selected);
      var v;
      while (1) {
        var __ival_v=__iter_v.next();
        if (__ival_v.done) {
            break;
        }
        v = __ival_v.value;
        cent.add(v.co);
        v1.load(v.edges[0].v1.co).sub(v.edges[0].v2.co);
        v1.normalize();
        len++;
      }
      if (len>0)
        cent.mulScalar(1.0/len);
      mat.makeIdentity();
      mat.translate(cent[0], cent[1], cent[2]);
      if (this2.widget_align_normal) {
          var n=new Vector3();
          var tan=new Vector3();
          len = 0;
          var v1=new Vector3();
          var __iter_f=__get_iter(mesh.faces.selected);
          var f;
          while (1) {
            var __ival_f=__iter_f.next();
            if (__ival_f.done) {
                break;
            }
            f = __ival_f.value;
            var e=f.looplists[0].loop.e;
            len++;
            n.add(f.no);
          }
          n.mulScalar(1.0/len);
          n.normalize();
          if (tan.dot(tan)==0.0) {
              tan.loadXYZ(0, 0, 1);
          }
          else {
            tan.mulScalar(1.0/len);
            tan.normalize();
          }
          var angle=Math.PI-Math.acos($zaxis_bThP.dot(n));
          if (n.dot($zaxis_bThP)>0.9) {
          }
          if (1) {
              if (Math.abs(angle)<0.001||Math.abs(angle)>Math.PI-0.001) {
                  n.loadXYZ(1, 0, 0);
              }
              else {
                n.cross($zaxis_bThP);
                n.normalize();
              }
              var q=new Quat();
              q.axisAngleToQuat(n, angle);
              var rmat=q.toMatrix();
              mat.multiply(rmat);
          }
      }
      mat.multiply(ctx.object.matrix);
    }
    var $zaxis_bThP=new Vector3([0, 0, -1]);
    widget.on_tick = widget_on_tick;
    widget.on_click = function(widget, id) {
      console.log("widget click: ", id);
      ctx.view2d._mstart = null;
      var toolop=undefined;
      if (gen_toolop!=undefined) {
          var toolop=gen_toolop(id, widget, ctx);
      }
      else {
        console.trace("IMPLEMENT ME! missing widget gen_toolop callback!");
        return ;
      }
      if (toolop==undefined) {
          console.log("Evil! Undefined toolop in WidgetToolOp.create_widgets()!");
          return ;
      }
      widget.user_data = toolop;
      toolop._widget_on_tick = widget_on_tick;
      toolop.widgets.push(widget);
      toolop.on_modal_end = function(toolop) {
        var __iter_w=__get_iter(toolop.widgets);
        var w;
        while (1) {
          var __ival_w=__iter_w.next();
          if (__ival_w.done) {
              break;
          }
          w = __ival_w.value;
          for (var k in toolop.inputs) {
              var p=toolop.inputs[k];
              p.remove_listener(w, true);
          }
          for (var k in toolop.outputs) {
              var p=toolop.outputs[k];
              p.remove_listener(w, true);
          }
        }
        console.log("widget modal end");
        toolop.widgets = new GArray();
        widget.on_tick = widget_on_tick;
      }
      if (toolop.widget_on_tick)
        widget.widget_on_tick = toolop.widget_on_tick;
      widget.on_tick = function(widget) {
        toolop.widget_on_tick.call(toolop, widget);
      }
      g_app_state.toolstack.exec_tool(toolop);
    }
  }), function widget_on_tick(widget) {
    if (this._widget_on_tick!=undefined)
      this._widget_on_tick(widget);
  }, function WidgetToolOp() {
    ToolOp.apply(this, arguments);
  }]);
  _es6_module.add_class(WidgetToolOp);
});
