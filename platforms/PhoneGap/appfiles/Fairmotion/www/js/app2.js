es6_module_define('spline_element_array', ["eventdag", "struct", "spline_types"], function _spline_element_array_module(_es6_module) {
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
    let actlayer=this.layerset.active.id;
    while (this.i<this.list.length) {
      let e=this.list[this.i];
      let ok=!e.hidden;
      ok = ok&&(this.all_layers||actlayer in e.layers);
      if (ok)
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
  var ElementArraySet=_ESClass("ElementArraySet", set, [function ElementArraySet(arg) {
    set.call(this, arg);
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
    if (this.active===e) {
        this.active = undefined;
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
        if (this.active===undefined)
          this.active = e;
        this.global_sel.add(e);
        this.selected.add(e);
        e.flag|=SplineFlags.SELECT;
    }
    else {
      if (this.active===e) {
          this.active = undefined;
      }
      this.global_sel.remove(e);
      this.selected.remove(e);
      e.flag&=~SplineFlags.SELECT;
    }
    if (changed&&this.on_select!==undefined) {
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
}, '/dev/fairmotion/src/curve/spline_element_array.js');
es6_module_define('spline_base', ["mathlib", "toolprops", "eventdag", "struct"], function _spline_base_module(_es6_module) {
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
  var $srcs2_ksdT_interp;
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
    while ($srcs2_ksdT_interp.length<srcs.length) {
      $srcs2_ksdT_interp.push(0);
    }
    $srcs2_ksdT_interp.length = srcs.length;
    for (var i=0; i<this.length; i++) {
        for (var j=0; j<srcs.length; j++) {
            $srcs2_ksdT_interp[j] = srcs[j][i];
        }
        this[i].interp($srcs2_ksdT_interp, ws);
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
  var $srcs2_ksdT_interp=[];
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
  var $flip_out_ix2y__get_nextprev;
  var $ret_cache_4zT4_global_to_local;
  var $_co_CMLO_global_to_local;
  var $arr_pZZD_global_to_local;
  var $_vec_iINL_global_to_local;
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
    p = p._get_nextprev(donext, $flip_out_ix2y__get_nextprev);
    var flip=$flip_out_ix2y__get_nextprev[0];
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
        $arr_pZZD_global_to_local[0] = this.evaluate(fixed_s);
        $arr_pZZD_global_to_local[1] = fixed_s;
        co = $arr_pZZD_global_to_local;
    }
    else {
      co = this.closest_point(p);
    }
    var s, t, a=0.0;
    if (co==undefined) {
        co = $_co_CMLO_global_to_local;
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
    var n2=$_vec_iINL_global_to_local.zero().load(p).sub(co).normalize();
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
    var ret=$ret_cache_4zT4_global_to_local.next();
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
  var $flip_out_ix2y__get_nextprev=[0];
  var $ret_cache_4zT4_global_to_local=cachering.fromConstructor(Vector3, 64);
  var $_co_CMLO_global_to_local=new Vector3();
  var $arr_pZZD_global_to_local=[0, 0];
  var $_vec_iINL_global_to_local=new Vector3();
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
}, '/dev/fairmotion/src/curve/spline_base.js');
es6_module_define('spline_types', ["config", "toolprops", "selectmode", "eventdag", "struct", "toolprops_iter", "mathlib", "spline_multires", "spline_math", "spline_base"], function _spline_types_module(_es6_module) {
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
  var $ret_SSdd_aabb;
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
    $ret_SSdd_aabb[0].load(this);
    $ret_SSdd_aabb[1].load(this);
    return $ret_SSdd_aabb;
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
    if (s===undefined) {
        console.warn("Corrupted handle detected", this.eid);
        return false;
    }
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
    for (let axis=0; axis<3; axis++) {
        if (isNaN(ret[axis])) {
            console.warn("NaN vertex", ret.eid);
            ret[axis] = 0;
        }
    }
    return ret;
  })]);
  var $ret_SSdd_aabb=[new Vector3(), new Vector3()];
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
  var $minmax_b8J__update_aabb;
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
        steps = 8;
    }
    this._update_has_multires();
    this.flag&=~SplineFlags.UPDATE_AABB;
    var min=this._aabb[0], max=this._aabb[1];
    $minmax_b8J__update_aabb.reset();
    min.zero();
    max.zero();
    var co=this.evaluate(0);
    $minmax_b8J__update_aabb.minmax(co);
    var ds=1.0/(steps-1);
    for (var i=0, s = 0; i<steps; i++, s+=ds) {
        var co=this.evaluate(s*0.999999999);
        $minmax_b8J__update_aabb.minmax(co);
    }
    min.load($minmax_b8J__update_aabb.min);
    max.load($minmax_b8J__update_aabb.max);
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
                console.warn("NaN!", p, co, mid, dm);
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
  var $minmax_b8J__update_aabb=new MinMax(2);
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
  var $cent_Slkx_update_winding;
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
    $cent_Slkx_update_winding.zero();
    var __iter_l=__get_iter(this);
    var l;
    while (1) {
      var __ival_l=__iter_l.next();
      if (__ival_l.done) {
          break;
      }
      l = __ival_l.value;
      $cent_Slkx_update_winding.add(l.v);
    }
    $cent_Slkx_update_winding.mulScalar(1.0/this.totvert);
    var wsum=0;
    var __iter_l=__get_iter(this);
    var l;
    while (1) {
      var __ival_l=__iter_l.next();
      if (__ival_l.done) {
          break;
      }
      l = __ival_l.value;
      wsum+=math.winding(l.v, l.next.v, $cent_Slkx_update_winding) ? 1 : -1;
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
  var $cent_Slkx_update_winding=new Vector3();
  _es6_module.add_class(SplineLoopPath);
  SplineLoopPath = _es6_module.add_export('SplineLoopPath', SplineLoopPath);
  SplineLoopPath.STRUCT = "\n  SplineLoopPath {\n    totvert : int;\n    loops   : array(SplineLoop) | obj.asArray();\n    winding : int;\n  }\n";
  var $minmax_OvN3_update_aabb;
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
    $minmax_OvN3_update_aabb.reset();
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
        $minmax_OvN3_update_aabb.minmax(l.v.aabb[0]);
        $minmax_OvN3_update_aabb.minmax(l.v.aabb[1]);
        $minmax_OvN3_update_aabb.minmax(l.s.aabb[0]);
        $minmax_OvN3_update_aabb.minmax(l.s.aabb[1]);
      }
    }
    this._aabb[0].load($minmax_OvN3_update_aabb.min);
    this._aabb[1].load($minmax_OvN3_update_aabb.max);
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
  var $minmax_OvN3_update_aabb=new MinMax(3);
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
}, '/dev/fairmotion/src/curve/spline_types.js');
es6_module_define('spline_query', ["selectmode", "spline_multires"], function _spline_query_module(_es6_module) {
  var SelMask=es6_import_item(_es6_module, 'selectmode', 'SelMask');
  var has_multires=es6_import_item(_es6_module, 'spline_multires', 'has_multires');
  var compose_id=es6_import_item(_es6_module, 'spline_multires', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, 'spline_multires', 'decompose_id');
  var MResFlags=es6_import_item(_es6_module, 'spline_multires', 'MResFlags');
  var MultiResLayer=es6_import_item(_es6_module, 'spline_multires', 'MultiResLayer');
  var PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var sqrt=Math.sqrt;
  let findnearest_segment_tmp=new Vector2();
  var $_mpos_EGtU_findnearest_mres;
  var $_mpos_FyQB_findnearest_vert;
  var $_v_e4Fg_findnearest_mres;
  var $_v_Z76z_findnearest_vert;
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
    mpos = findnearest_segment_tmp.load(mpos);
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
    mpos = $_mpos_EGtU_findnearest_mres.load(mpos), mpos[2] = 0.0;
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
        $_v_e4Fg_findnearest_mres.load(mapco);
        $_v_e4Fg_findnearest_mres[2] = 0.0;
        editor.project($_v_e4Fg_findnearest_mres);
        var dis=$_v_e4Fg_findnearest_mres.vectorDistance(mpos);
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
    mpos = $_mpos_FyQB_findnearest_vert.load(mpos), mpos[2] = 0.0;
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
      $_v_Z76z_findnearest_vert.load(co);
      $_v_Z76z_findnearest_vert[2] = 0.0;
      editor.project($_v_Z76z_findnearest_vert);
      var dis=$_v_Z76z_findnearest_vert.vectorDistance(mpos);
      if (dis<limit&&dis<min) {
          min = dis;
          ret = v;
      }
    }
    if (ret!=undefined)
      return [ret, min, do_handles ? SelMask.HANDLE : SelMask.VERTEX];
  }]);
  var $_mpos_EGtU_findnearest_mres=new Vector3();
  var $_mpos_FyQB_findnearest_vert=new Vector3();
  var $_v_e4Fg_findnearest_mres=new Vector3();
  var $_v_Z76z_findnearest_vert=new Vector3();
  _es6_module.add_class(SplineQuery);
  SplineQuery = _es6_module.add_export('SplineQuery', SplineQuery);
}, '/dev/fairmotion/src/curve/spline_query.js');
es6_module_define('spline_draw', ["mathlib", "spline_draw_sort", "view2d_editor", "selectmode", "config", "spline_types", "spline_draw_new", "spline_math", "spline_element_array", "animdata"], function _spline_draw_module(_es6_module) {
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
  var spline_draw_cache_vs=cachering.fromConstructor(Vector3, 64);
  var spline_draw_trans_vs=cachering.fromConstructor(Vector3, 32);
  var PI=Math.PI;
  var pow=Math.pow, cos=Math.cos, sin=Math.sin, abs=Math.abs, floor=Math.floor, ceil=Math.ceil, sqrt=Math.sqrt, log=Math.log, acos=Math.acos, asin=Math.asin;
  var DRAW_MAXCURVELEN=10000;
  DRAW_MAXCURVELEN = _es6_module.add_export('DRAW_MAXCURVELEN', DRAW_MAXCURVELEN);
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
  var VERT_SIZE=3.0;
  var SMALL_VERT_SIZE=1.0;
  var SplineDrawer=es6_import_item(_es6_module, 'spline_draw_new', 'SplineDrawer');
  var redo_draw_sort=es6_import_item(_es6_module, 'spline_draw_sort', 'redo_draw_sort');
  var _spline_draw_sort=es6_import(_es6_module, 'spline_draw_sort');
  for (var k in _spline_draw_sort) {
      _es6_module.add_export(k, _spline_draw_sort[k], true);
  }
  function draw_curve_normals(spline, g, zoom) {
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
      var length=seg.ks[KSCALE];
      if (length<=0||isNaN(length))
        continue;
      if (length>DRAW_MAXCURVELEN)
        length = DRAW_MAXCURVELEN;
      var ls=0.0, dls=5/zoom;
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
  draw_curve_normals = _es6_module.add_export('draw_curve_normals', draw_curve_normals);
  var $r_7jgn_draw_spline=[[0, 0], [0, 0]];
  function draw_spline(spline, redraw_rects, g, editor, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime, ignore_layers) {
    spline.canvas = g;
    if (spline.drawlist===undefined||(spline.recalc&RecalcFlags.DRAWSORT)) {
        redo_draw_sort(spline);
    }
    if (spline.drawer===undefined) {
        spline.drawer = new SplineDrawer(spline);
    }
    spline.drawer.update(spline, spline.drawlist, spline.draw_layerlist, editor.rendermat, redraw_rects, only_render, selectmode, g, editor.zoom, editor, ignore_layers);
    spline.drawer.draw(editor.drawg);
    var actlayer=spline.layerset.active;
    var zoom=editor.zoom;
    if (isNaN(zoom)) {
        zoom = 1.0;
    }
    if (!only_render&&draw_normals)
      draw_curve_normals(spline, g, zoom);
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
    var vert_size=editor.draw_small_verts ? SMALL_VERT_SIZE : VERT_SIZE;
    if (only_render)
      return ;
    g.beginPath();
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
    var last_clr=undefined;
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
    var co=new Vector3(), co2=new Vector3();
    g.moveTo = function(x, y) {
      co.zero();
      co[0] = x;
      co[1] = y;
      transform(this, co);
      g._moveTo(co[0], co[1]);
    }
    g._arc = g.arc;
    g.arc = function(x, y, r, th1, th2) {
      co[0] = x;
      co[1] = y;
      co2[0] = x+Math.sin(th1)*r;
      co2[1] = y+Math.cos(th1)*r;
      co[2] = co2[2] = 0.0;
      transform(this, co);
      transform(this, co2);
      r = co.vectorDistance(co2);
      co2.sub(co);
      let th=Math.atan2(co2[1], co2[0]);
      let dth=th-th1;
      dth = 0;
      g._arc(co[0], co[1], r, th1+dth, th2+dth);
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
  var $margin_PK_A_redraw_element=new Vector3([15, 15, 15]);
  var $aabb_gyNo_redraw_element=[new Vector3(), new Vector3()];
  function redraw_element(e, view2d) {
    e.flag|=SplineFlags.REDRAW;
    $margin_PK_A_redraw_element[0] = $margin_PK_A_redraw_element[1] = $margin_PK_A_redraw_element[2] = 15.0;
    if (view2d!=undefined)
      $margin_PK_A_redraw_element.mulScalar(1.0/view2d.zoom);
    var e_aabb=e.aabb;
    $aabb_gyNo_redraw_element[0].load(e_aabb[0]), $aabb_gyNo_redraw_element[1].load(e_aabb[1]);
    $aabb_gyNo_redraw_element[0].sub($margin_PK_A_redraw_element), $aabb_gyNo_redraw_element[1].add($margin_PK_A_redraw_element);
    window.redraw_viewport($aabb_gyNo_redraw_element[0], $aabb_gyNo_redraw_element[1]);
  }
  redraw_element = _es6_module.add_export('redraw_element', redraw_element);
}, '/dev/fairmotion/src/curve/spline_draw.js');
es6_module_define('spline_draw_sort', ["spline_element_array", "mathlib", "view2d_editor", "spline_multires", "selectmode", "animdata", "spline_math", "spline_types", "config"], function _spline_draw_sort_module(_es6_module) {
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
  var $lists_wzLY_sort_layer_segments=new cachering(function() {
    return [];
  }, 2);
  function sort_layer_segments(layer, spline) {
    var list=$lists_wzLY_sort_layer_segments.next();
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
}, '/dev/fairmotion/src/curve/spline_draw_sort.js');
es6_module_define('spline', ["selectmode", "toolops_api", "spline_draw", "solver_new", "struct", "lib_api", "config", "solver", "const", "spline_element_array", "view2d_editor", "spline_types", "spline_multires", "native_api", "eventdag", "spline_query", "spline_math"], function _spline_module(_es6_module) {
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
  var native_api=es6_import(_es6_module, 'native_api');
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
  var $debug_id_gen_3Vp3_Spline;
  var $_internal_idgen_V0AA_Spline;
  var $ws_bU8R_split_edge;
  var $lastco_RueL_trace_face;
  var $srcs_uLVm_split_edge;
  var Spline=_ESClass("Spline", DataBlock, [function Spline(name) {
    if (name==undefined) {
        name = undefined;
    }
    DataBlock.call(this, DataTypes.SPLINE, name);
    this._debug_id = $debug_id_gen_3Vp3_Spline++;
    this._pending_solve = undefined;
    this._resolve_after = undefined;
    this.solving = undefined;
    this.actlevel = 0;
    var mformat=spline_multires._format;
    this.mres_format = new Array(mformat.length);
    for (var i=0; i<mformat.length; i++) {
        this.mres_format[i] = mformat[i];
    }
    this._internal_id = $_internal_idgen_V0AA_Spline++;
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
  }, function split_edge(seg, s) {
    if (s==undefined) {
        s = 0.5;
    }
    var co=seg.evaluate(s);
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
    $srcs_uLVm_split_edge[0] = v1.cdata, $srcs_uLVm_split_edge[1] = v2.cdata;
    this.copy_vert_data(nv, v1);
    nv.cdata.interp($srcs_uLVm_split_edge, $ws_bU8R_split_edge);
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
                  console.warn("Corruption detected for element", v.eid);
                  v.segments.pop_i(j);
                  j--;
              }
          }
        }
    }
    var hset=new set();
    var __iter_s=__get_iter(this.segments);
    var s;
    while (1) {
      var __ival_s=__iter_s.next();
      if (__ival_s.done) {
          break;
      }
      s = __ival_s.value;
      hset.add(s.h1);
      hset.add(s.h2);
      for (let si=0; si<2; si++) {
          let h=si ? s.h2 : s.h1;
          if (h.segments.indexOf(s)<0) {
              console.warn("fixing segment reference for handle", h.eid);
              h.segments.length = 0;
              h.segments.push(s);
          }
      }
    }
    let delset=new set();
    var __iter_h=__get_iter(this.handles);
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
      if (!hset.has(h)) {
          delset.add(h);
      }
    }
    var __iter_h=__get_iter(delset);
    var h;
    while (1) {
      var __ival_h=__iter_h.next();
      if (__ival_h.done) {
          break;
      }
      h = __ival_h.value;
      console.log("Removing orphaned handle", h.eid, h);
      this.handles.remove(h);
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
    if (config.USE_WASM) {
        var ret=native_api.do_solve(SplineFlags, this, steps, gk, true);
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
    else 
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
    $lastco_RueL_trace_face.zero();
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
  var $debug_id_gen_3Vp3_Spline=0;
  var $_internal_idgen_V0AA_Spline=0;
  var $ws_bU8R_split_edge=[0.5, 0.5];
  var $lastco_RueL_trace_face=new Vector3();
  var $srcs_uLVm_split_edge=[0, 0];
  _es6_module.add_class(Spline);
  Spline = _es6_module.add_export('Spline', Spline);
  
  mixin(Spline, DataPathNode);
  Spline.STRUCT = STRUCT.inherit(Spline, DataBlock)+"\n    idgen    : SDIDGen;\n\n    selected : iter(e, int) | e.eid;\n\n    verts    : ElementArray;\n    handles  : ElementArray;\n    segments : ElementArray;\n    faces    : ElementArray;\n    layerset : SplineLayerSet;\n\n    restrict : int;\n    actlevel : int;\n\n    mres_format : array(string);\n}\n";
  Spline.dag_outputs = {on_solve: 0}
}, '/dev/fairmotion/src/curve/spline.js');
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
        console.log("err", err, "steps", i, "\n");
    }
    return i;
  }]);
  _es6_module.add_class(solver);
  solver = _es6_module.add_export('solver', solver);
}, '/dev/fairmotion/src/curve/solver.js');
es6_module_define('spline_multires', ["binomial_table", "spline_base", "struct"], function _spline_multires_module(_es6_module) {
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
  var $p_lqjd_recalc_offset;
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
    $p_lqjd_recalc_offset[0] = this[0];
    $p_lqjd_recalc_offset[1] = this[1];
    var sta=seg._evalwrap.global_to_local($p_lqjd_recalc_offset, undefined, this.s);
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
  var $p_lqjd_recalc_offset=new Vector3([0, 0, 0]);
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
  var $sum_0KkK_evaluate;
  var $ks_uRVc_evaluate;
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
    $sum_0KkK_evaluate.zero();
    var i=0;
    for (var p in this.mr.points(0)) {
        $ks_uRVc_evaluate[i] = p.s;
        i++;
    }
    for (var p in this.mr.points(0)) {
        var w=crappybasis(s, p.s, p.support, p.degree);
        if (isNaN(w))
          continue;
        $sum_0KkK_evaluate[0]+=p.offset[0]*w;
        $sum_0KkK_evaluate[1]+=p.offset[1]*w;
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
                $sum_0KkK_evaluate[0]+=p.offset[0]*w;
                $sum_0KkK_evaluate[1]+=p.offset[1]*w;
            }
        }
    }
    co.add($sum_0KkK_evaluate);
    return co;
  }]);
  var $sum_0KkK_evaluate=new Vector3();
  var $ks_uRVc_evaluate=new Array(2000);
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
  var $_co_lzcS_add_point;
  var $sta_1ub1_recalc_worldcos_level;
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
        co = $_co_lzcS_add_point;
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
        $sta_1ub1_recalc_worldcos_level[0] = p.s;
        $sta_1ub1_recalc_worldcos_level[1] = p.t;
        $sta_1ub1_recalc_worldcos_level[2] = p.a;
        var co=seg._evalwrap.local_to_global($sta_1ub1_recalc_worldcos_level);
        var co2=seg._evalwrap.evaluate($sta_1ub1_recalc_worldcos_level[0]);
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
  var $_co_lzcS_add_point=[0, 0];
  var $sta_1ub1_recalc_worldcos_level=[0, 0, 0];
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
  var $ret_lXmp_decompose_id=[0, 0];
  function decompose_id(id) {
    var mul=(1<<24);
    var eid=Math.floor(id/mul);
    id-=eid*mul;
    $ret_lXmp_decompose_id[0] = eid;
    $ret_lXmp_decompose_id[1] = id;
    return $ret_lXmp_decompose_id;
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
}, '/dev/fairmotion/src/curve/spline_multires.js');
es6_module_define('solver_new', ["spline_math", "spline_base"], function _solver_new_module(_es6_module) {
  var KSCALE=es6_import_item(_es6_module, 'spline_math', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, 'spline_math', 'KANGLE');
  var SplineTypes=es6_import_item(_es6_module, 'spline_base', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, 'spline_base', 'SplineFlags');
  var acos=Math.acos, asin=Math.asin, cos=Math.cos, sin=Math.sin, PI=Math.PI, pow=Math.pow, sqrt=Math.sqrt, log=Math.log, abs=Math.abs;
  var $tan_8X9v_solve=new Vector3();
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
                $tan_8X9v_solve.load(h).sub(v).normalize();
                if (v==seg1.v2)
                  $tan_8X9v_solve.negate();
                var ta=seg1.derivative(s1, order).normalize();
                var _d=Math.min(Math.max(ta.dot($tan_8X9v_solve), -1.0), 1.0);
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
                        var _d=Math.min(Math.max(ta.dot($tan_8X9v_solve), -1.0), 1.0);
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
}, '/dev/fairmotion/src/curve/solver_new.js');
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
}, '/dev/fairmotion/src/vectordraw/vectordraw_base.js');
es6_module_define('vectordraw_canvas2d', ["config", "mathlib", "vectordraw_base"], function _vectordraw_canvas2d_module(_es6_module) {
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
    this.aabb[0].floor();
    this.aabb[1].ceil();
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
  }, function genInto(draw, path, clip_mode) {
    if (clip_mode==undefined) {
        clip_mode = false;
    }
    let oldc=this.canvas, oldg=this.g, oldaabb=this.aabb, oldsize=this.size;
    this.canvas = path.canvas;
    this.g = path.g;
    this.aabb = path.aabb;
    this.size = path.size;
    this.gen(draw, undefined, clip_mode);
    this.canvas = oldc;
    this.g = oldg;
    this.aabb = oldaabb;
    this.size = oldsize;
  }, function gen(draw, _check_tag, clip_mode) {
    if (_check_tag==undefined) {
        _check_tag = 0;
    }
    if (clip_mode==undefined) {
        clip_mode = false;
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
          console.log("   clipping subgen!");
          path.gen(draw, 1);
      }
      let oldc=path.canvas, oldg=path.g, oldaabb=path.aabb, oldsize=path.size;
      path.genInto(draw, this, true);
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
    if (!clip_mode) {
        this.g.fill();
    }
    else {
      this.g.clip();
    }
    if (do_blur) {
        this.g.translate(doff, doff);
        this.g.shadowOffsetX = this.g.shadowOffsetY = 0.0;
        this.g.shadowBlur = 0.0;
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
}, '/dev/fairmotion/src/vectordraw/vectordraw_canvas2d.js');
es6_module_define('vectordraw_stub', ["mathlib", "config", "vectordraw_base"], function _vectordraw_stub_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, 'config');
  var MinMax=es6_import_item(_es6_module, 'mathlib', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, 'vectordraw_base', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, 'vectordraw_base', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, 'vectordraw_base', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, 'vectordraw_base', 'VectorDraw');
  var $_uEA5awthis_1=this;
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
  var StubCanvasPath=_ESClass("StubCanvasPath", QuadBezPath, [function StubCanvasPath() {
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
  }, function update() {
    this.recalc = 1;
  }]);
  _es6_module.add_class(StubCanvasPath);
  StubCanvasPath = _es6_module.add_export('StubCanvasPath', StubCanvasPath);
  var StubCanvasDraw2D=_ESClass("StubCanvasDraw2D", VectorDraw, [function StubCanvasDraw2D() {
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
        this.path_idmap[id] = new StubCanvasPath();
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
  }, function set_matrix(matrix) {
    VectorDraw.prototype.set_matrix.call(this, matrix);
    this.zoom = matrix.$matrix.m11;
  }]);
  _es6_module.add_class(StubCanvasDraw2D);
  StubCanvasDraw2D = _es6_module.add_export('StubCanvasDraw2D', StubCanvasDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_stub.js');
es6_module_define('vectordraw_canvas2d_simple', ["vectordraw_base", "mathlib", "config"], function _vectordraw_canvas2d_simple_module(_es6_module) {
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
}, '/dev/fairmotion/src/vectordraw/vectordraw_canvas2d_simple.js');
es6_module_define('vectordraw_svg', ["mathlib", "vectordraw_base", "config"], function _vectordraw_svg_module(_es6_module) {
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
}, '/dev/fairmotion/src/vectordraw/vectordraw_svg.js');
es6_module_define('vectordraw', ["vectordraw_canvas2d", "vectordraw_svg", "vectordraw_base", "vectordraw_stub"], function _vectordraw_module(_es6_module) {
  "use strict";
  var CanvasDraw2D=es6_import_item(_es6_module, 'vectordraw_canvas2d', 'CanvasDraw2D');
  var CanvasPath=es6_import_item(_es6_module, 'vectordraw_canvas2d', 'CanvasPath');
  var StubCanvasDraw2D=es6_import_item(_es6_module, 'vectordraw_stub', 'StubCanvasDraw2D');
  var StubCanvasPath=es6_import_item(_es6_module, 'vectordraw_stub', 'StubCanvasPath');
  var SVGDraw2D=es6_import_item(_es6_module, 'vectordraw_svg', 'SVGDraw2D');
  var SVGPath=es6_import_item(_es6_module, 'vectordraw_svg', 'SVGPath');
  var VectorFlags=es6_import_item(_es6_module, 'vectordraw_base', 'VectorFlags');
  var VectorFlags=VectorFlags;
  VectorFlags = _es6_module.add_export('VectorFlags', VectorFlags);
  var Canvas=CanvasDraw2D;
  Canvas = _es6_module.add_export('Canvas', Canvas);
  var Path=CanvasPath;
  Path = _es6_module.add_export('Path', Path);
}, '/dev/fairmotion/src/vectordraw/vectordraw.js');
es6_module_define('strokedraw', [], function _strokedraw_module(_es6_module) {
  "use strict";
}, '/dev/fairmotion/src/vectordraw/strokedraw.js');
es6_module_define('spline_draw_new', ["selectmode", "view2d_editor", "config", "spline_math", "spline_multires", "animdata", "spline_element_array", "mathlib", "vectordraw", "spline_types"], function _spline_draw_new_module(_es6_module) {
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
    this.last_3_mat = undefined;
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
        if ((e.flag&SplineFlags.NO_RENDER)&&e.type!=SplineTypes.VERTEX&&(selectmode!=e.type||only_render))
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
    var steps=7, ds=1.0/(steps-1), s=0.0;
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
    let stretch=1.015;
    s = 0;
    for (var i=0; i<steps; i++, s+=ds) {
        var dv=seg.derivative(s*stretch).normalize();
        var co=seg.evaluate(s*stretch);
        var k=-seg.curvature(s*stretch);
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
        var dv=seg.derivative(s*stretch).normalize();
        var co=seg.evaluate(s*stretch);
        var k=-seg.curvature(s*stretch);
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
}, '/dev/fairmotion/src/curve/spline_draw_new.js');
es6_module_define('license_api', ["license_electron", "config"], function _license_api_module(_es6_module) {
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
}, '/dev/fairmotion/src/license/license_api.js');
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
}, '/dev/fairmotion/src/license/license_electron.js');
es6_module_define('theplatform', ["platform_api"], function _theplatform_module(_es6_module) {
  var PlatformAPIBase=es6_import_item(_es6_module, 'platform_api', 'PlatformAPIBase');
  var ElectronPlatformAPI=_ESClass("ElectronPlatformAPI", [function ElectronPlatformAPI() {
  }, function init() {
  }, function save_file(path_handle, name, databuf, type) {
  }, function save_dialog(name, databuf, type) {
  }, function open_dialog(type) {
  }, function open_last_file() {
  }, function exit_catcher(handler) {
  }, function quit_app() {
    close();
  }]);
  _es6_module.add_class(ElectronPlatformAPI);
  ElectronPlatformAPI = _es6_module.add_export('ElectronPlatformAPI', ElectronPlatformAPI);
  var app=new ElectronPlatformAPI();
  app = _es6_module.add_export('app', app);
}, '/dev/fairmotion/platforms/Electron/theplatform.js');
es6_module_define('load_wasm', [], function _load_wasm_module(_es6_module) {
  let fs=require('fs');
  var wasm_binary=fs.readFileSync("electron_build/fcontent/built_wasm.wasm");
  wasm_binary = _es6_module.add_export('wasm_binary', wasm_binary);
}, '/dev/fairmotion/src/wasm/load_wasm.js');
es6_module_define('built_wasm', ["load_wasm"], function _built_wasm_module(_es6_module) {
  var Module={}
  Module = _es6_module.set_default_export('Module', Module);
  
  var wasm_binary=es6_import_item(_es6_module, 'load_wasm', 'wasm_binary');
  Module.wasmBinary = wasm_binary;
  Module.TOTAL_MEMORY = 67108864;
  var Module=typeof Module!=='undefined' ? Module : {}
  var moduleOverrides={}
  var key;
  for (key in Module) {
      if (Module.hasOwnProperty(key)) {
          moduleOverrides[key] = Module[key];
      }
  }
  Module['arguments'] = [];
  Module['thisProgram'] = './this.program';
  Module['quit'] = function(status, toThrow) {
    throw toThrow;
  }
  Module['preRun'] = [];
  Module['postRun'] = [];
  var ENVIRONMENT_IS_WEB=false;
  var ENVIRONMENT_IS_WORKER=false;
  var ENVIRONMENT_IS_NODE=false;
  var ENVIRONMENT_IS_SHELL=false;
  if (Module['ENVIRONMENT']) {
      if (Module['ENVIRONMENT']==='WEB') {
          ENVIRONMENT_IS_WEB = true;
      }
      else 
        if (Module['ENVIRONMENT']==='WORKER') {
          ENVIRONMENT_IS_WORKER = true;
      }
      else 
        if (Module['ENVIRONMENT']==='NODE') {
          ENVIRONMENT_IS_NODE = true;
      }
      else 
        if (Module['ENVIRONMENT']==='SHELL') {
          ENVIRONMENT_IS_SHELL = true;
      }
      else {
        throw new Error('Module[\'ENVIRONMENT\'] value is not valid. must be one of: WEB|WORKER|NODE|SHELL.');
      }
  }
  else {
    ENVIRONMENT_IS_WEB = typeof window==='object';
    ENVIRONMENT_IS_WORKER = typeof importScripts==='function';
    ENVIRONMENT_IS_NODE = typeof process==='object'&&typeof require==='function'&&!ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_WORKER;
    ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_NODE&&!ENVIRONMENT_IS_WORKER;
  }
  if (ENVIRONMENT_IS_NODE) {
      var nodeFS;
      var nodePath;
      Module['read'] = function shell_read(filename, binary) {
        var ret;
        if (!nodeFS)
          nodeFS = require('fs');
        if (!nodePath)
          nodePath = require('path');
        filename = nodePath['normalize'](filename);
        ret = nodeFS['readFileSync'](filename);
        return binary ? ret : ret.toString();
      };
      Module['readBinary'] = function readBinary(filename) {
        var ret=Module['read'](filename, true);
        if (!ret.buffer) {
            ret = new Uint8Array(ret);
        }
        assert(ret.buffer);
        return ret;
      };
      if (process['argv'].length>1) {
          Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
      }
      Module['arguments'] = process['argv'].slice(2);
      if (typeof module!=='undefined') {
          module['exports'] = Module;
      }
      process['on']('uncaughtException', function(ex) {
        if (!(__instance_of(ex, ExitStatus))) {
            throw ex;
        }
      });
      process['on']('unhandledRejection', function(reason, p) {
        Module['printErr']('node.js exiting due to unhandled promise rejection');
        process['exit'](1);
      });
      Module['inspect'] = function() {
        return '[Emscripten Module object]';
      };
  }
  else 
    if (ENVIRONMENT_IS_SHELL) {
      if (typeof read!='undefined') {
          Module['read'] = function shell_read(f) {
            return read(f);
          };
      }
      Module['readBinary'] = function readBinary(f) {
        var data;
        if (typeof readbuffer==='function') {
            return new Uint8Array(readbuffer(f));
        }
        data = read(f, 'binary');
        assert(typeof data==='object');
        return data;
      };
      if (typeof scriptArgs!='undefined') {
          Module['arguments'] = scriptArgs;
      }
      else 
        if (typeof arguments!='undefined') {
          Module['arguments'] = arguments;
      }
      if (typeof quit==='function') {
          Module['quit'] = function(status, toThrow) {
            quit(status);
          };
      }
  }
  else 
    if (ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER) {
      Module['read'] = function shell_read(url) {
        var xhr=new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.send(null);
        return xhr.responseText;
      };
      if (ENVIRONMENT_IS_WORKER) {
          Module['readBinary'] = function readBinary(url) {
            var xhr=new XMLHttpRequest();
            xhr.open('GET', url, false);
            xhr.responseType = 'arraybuffer';
            xhr.send(null);
            return new Uint8Array(xhr.response);
          };
      }
      Module['readAsync'] = function readAsync(url, onload, onerror) {
        var xhr=new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status==200||(xhr.status==0&&xhr.response)) {
              onload(xhr.response);
              return ;
          }
          onerror();
        }
        xhr.onerror = onerror;
        xhr.send(null);
      };
      Module['setWindowTitle'] = function(title) {
        document.title = title;
      };
  }
  else {
    throw new Error('unknown runtime environment');
  }
  Module['print'] = typeof console!=='undefined' ? console.log.bind(console) : (typeof print!=='undefined' ? print : null);
  Module['printErr'] = typeof printErr!=='undefined' ? printErr : ((typeof console!=='undefined'&&console.warn.bind(console))||Module['print']);
  Module.print = Module['print'];
  Module.printErr = Module['printErr'];
  for (key in moduleOverrides) {
      if (moduleOverrides.hasOwnProperty(key)) {
          Module[key] = moduleOverrides[key];
      }
  }
  moduleOverrides = undefined;
  var STACK_ALIGN=16;
  stackSave = stackRestore = stackAlloc = setTempRet0 = getTempRet0 = function() {
    abort('cannot use the stack before compiled code is ready to run, and has provided stack access');
  }
  function staticAlloc(size) {
    assert(!staticSealed);
    var ret=STATICTOP;
    STATICTOP = (STATICTOP+size+15)&-16;
    return ret;
  }
  function dynamicAlloc(size) {
    assert(DYNAMICTOP_PTR);
    var ret=HEAP32[DYNAMICTOP_PTR>>2];
    var end=(ret+size+15)&-16;
    HEAP32[DYNAMICTOP_PTR>>2] = end;
    if (end>=TOTAL_MEMORY) {
        var success=enlargeMemory();
        if (!success) {
            HEAP32[DYNAMICTOP_PTR>>2] = ret;
            return 0;
        }
    }
    return ret;
  }
  function alignMemory(size, factor) {
    if (!factor)
      factor = STACK_ALIGN;
    var ret=size = Math.ceil(size/factor)*factor;
    return ret;
  }
  function getNativeTypeSize(type) {
    switch (type) {
      case 'i1':
      case 'i8':
        return 1;
      case 'i16':
        return 2;
      case 'i32':
        return 4;
      case 'i64':
        return 8;
      case 'float':
        return 4;
      case 'double':
        return 8;
      default:
        if (type[type.length-1]==='*') {
            return 4;
        }
        else 
          if (type[0]==='i') {
            var bits=parseInt(type.substr(1));
            assert(bits%8===0);
            return bits/8;
        }
        else {
          return 0;
        }
    }
  }
  function warnOnce(text) {
    if (!warnOnce.shown)
      warnOnce.shown = {}
    if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        Module.printErr(text);
    }
  }
  var jsCallStartIndex=1;
  var functionPointers=new Array(0);
  function addFunction(func, sig) {
    if (typeof sig==='undefined') {
        Module.printErr('Warning: addFunction: Provide a wasm function signature '+'string as a second argument');
    }
    var base=0;
    for (var i=base; i<base+0; i++) {
        if (!functionPointers[i]) {
            functionPointers[i] = func;
            return jsCallStartIndex+i;
        }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  }
  function removeFunction(index) {
    functionPointers[index-jsCallStartIndex] = null;
  }
  var funcWrappers={}
  function getFuncWrapper(func, sig) {
    if (!func)
      return ;
    assert(sig);
    if (!funcWrappers[sig]) {
        funcWrappers[sig] = {};
    }
    var sigCache=funcWrappers[sig];
    if (!sigCache[func]) {
        if (sig.length===1) {
            sigCache[func] = function dynCall_wrapper() {
              return dynCall(sig, func);
            };
        }
        else 
          if (sig.length===2) {
            sigCache[func] = function dynCall_wrapper(arg) {
              return dynCall(sig, func, [arg]);
            };
        }
        else {
          sigCache[func] = function dynCall_wrapper() {
            return dynCall(sig, func, Array.prototype.slice.call(arguments));
          };
        }
    }
    return sigCache[func];
  }
  function makeBigInt(low, high, unsigned) {
    return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
  }
  function dynCall(sig, ptr, args) {
    if (args&&args.length) {
        assert(args.length==sig.length-1);
        assert(('dynCall_'+sig) in Module, 'bad function pointer type - no table for sig \''+sig+'\'');
        return Module['dynCall_'+sig].apply(null, [ptr].concat(args));
    }
    else {
      assert(sig.length==1);
      assert(('dynCall_'+sig) in Module, 'bad function pointer type - no table for sig \''+sig+'\'');
      return Module['dynCall_'+sig].call(null, ptr);
    }
  }
  function getCompilerSetting(name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for getCompilerSetting or emscripten_get_compiler_setting to work';
  }
  var Runtime={dynCall: dynCall, getTempRet0: function() {
    abort('getTempRet0() is now a top-level function, after removing the Runtime object. Remove "Runtime."');
  }, staticAlloc: function() {
    abort('staticAlloc() is now a top-level function, after removing the Runtime object. Remove "Runtime."');
  }, stackAlloc: function() {
    abort('stackAlloc() is now a top-level function, after removing the Runtime object. Remove "Runtime."');
  }}
  var GLOBAL_BASE=1024;
  var ABORT=0;
  var EXITSTATUS=0;
  function assert(condition, text) {
    if (!condition) {
        abort('Assertion failed: '+text);
    }
  }
  var globalScope=this;
  function getCFunc(ident) {
    var func=Module['_'+ident];
    assert(func, 'Cannot call unknown function '+ident+', make sure it is exported');
    return func;
  }
  var JSfuncs={'stackSave': function() {
    stackSave();
  }, 'stackRestore': function() {
    stackRestore();
  }, 'arrayToC': function(arr) {
    var ret=stackAlloc(arr.length);
    writeArrayToMemory(arr, ret);
    return ret;
  }, 'stringToC': function(str) {
    var ret=0;
    if (str!==null&&str!==undefined&&str!==0) {
        var len=(str.length<<2)+1;
        ret = stackAlloc(len);
        stringToUTF8(str, ret, len);
    }
    return ret;
  }}
  var toC={'string': JSfuncs['stringToC'], 'array': JSfuncs['arrayToC']}
  function ccall(ident, returnType, argTypes, args, opts) {
    var func=getCFunc(ident);
    var cArgs=[];
    var stack=0;
    assert(returnType!=='array', 'Return type should not be "array".');
    if (args) {
        for (var i=0; i<args.length; i++) {
            var converter=toC[argTypes[i]];
            if (converter) {
                if (stack===0)
                  stack = stackSave();
                cArgs[i] = converter(args[i]);
            }
            else {
              cArgs[i] = args[i];
            }
        }
    }
    var ret=func.apply(null, cArgs);
    if (returnType==='string')
      ret = Pointer_stringify(ret);
    else 
      if (returnType==='boolean')
      ret = Boolean(ret);
    if (stack!==0) {
        stackRestore(stack);
    }
    return ret;
  }
  function cwrap(ident, returnType, argTypes) {
    argTypes = argTypes||[];
    var cfunc=getCFunc(ident);
    var numericArgs=argTypes.every(function(type) {
      return type==='number';
    });
    var numericRet=returnType!=='string';
    if (numericRet&&numericArgs) {
        return cfunc;
    }
    return function() {
      return ccall(ident, returnType, argTypes, arguments);
    }
  }
  function setValue(ptr, value, type, noSafe) {
    type = type||'i8';
    if (type.charAt(type.length-1)==='*')
      type = 'i32';
    switch (type) {
      case 'i1':
        HEAP8[((ptr)>>0)] = value;
        break;
      case 'i8':
        HEAP8[((ptr)>>0)] = value;
        break;
      case 'i16':
        HEAP16[((ptr)>>1)] = value;
        break;
      case 'i32':
        HEAP32[((ptr)>>2)] = value;
        break;
      case 'i64':
        (tempI64 = [value>>>0, (tempDouble = value, (+(Math_abs(tempDouble)))>=1.0 ? (tempDouble>0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble-+(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[((ptr)>>2)] = tempI64[0], HEAP32[(((ptr)+(4))>>2)] = tempI64[1]);
        break;
      case 'float':
        HEAPF32[((ptr)>>2)] = value;
        break;
      case 'double':
        HEAPF64[((ptr)>>3)] = value;
        break;
      default:
        abort('invalid type for setValue: '+type);
    }
  }
  function getValue(ptr, type, noSafe) {
    type = type||'i8';
    if (type.charAt(type.length-1)==='*')
      type = 'i32';
    switch (type) {
      case 'i1':
        return HEAP8[((ptr)>>0)];
      case 'i8':
        return HEAP8[((ptr)>>0)];
      case 'i16':
        return HEAP16[((ptr)>>1)];
      case 'i32':
        return HEAP32[((ptr)>>2)];
      case 'i64':
        return HEAP32[((ptr)>>2)];
      case 'float':
        return HEAPF32[((ptr)>>2)];
      case 'double':
        return HEAPF64[((ptr)>>3)];
      default:
        abort('invalid type for getValue: '+type);
    }
    return null;
  }
  var ALLOC_NORMAL=0;
  var ALLOC_STACK=1;
  var ALLOC_STATIC=2;
  var ALLOC_DYNAMIC=3;
  var ALLOC_NONE=4;
  function allocate(slab, types, allocator, ptr) {
    var zeroinit, size;
    if (typeof slab==='number') {
        zeroinit = true;
        size = slab;
    }
    else {
      zeroinit = false;
      size = slab.length;
    }
    var singleType=typeof types==='string' ? types : null;
    var ret;
    if (allocator==ALLOC_NONE) {
        ret = ptr;
    }
    else {
      ret = [typeof _malloc==='function' ? _malloc : staticAlloc, stackAlloc, staticAlloc, dynamicAlloc][allocator===undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
    }
    if (zeroinit) {
        var stop;
        ptr = ret;
        assert((ret&3)==0);
        stop = ret+(size&~3);
        for (; ptr<stop; ptr+=4) {
            HEAP32[((ptr)>>2)] = 0;
        }
        stop = ret+size;
        while (ptr<stop) {
          HEAP8[((ptr++)>>0)] = 0;
        }
        return ret;
    }
    if (singleType==='i8') {
        if (slab.subarray||slab.slice) {
            HEAPU8.set((slab), ret);
        }
        else {
          HEAPU8.set(new Uint8Array(slab), ret);
        }
        return ret;
    }
    var i=0, type, typeSize, previousType;
    while (i<size) {
      var curr=slab[i];
      type = singleType||types[i];
      if (type===0) {
          i++;
          continue;
      }
      assert(type, 'Must know what type to store in allocate!');
      if (type=='i64')
        type = 'i32';
      setValue(ret+i, curr, type);
      if (previousType!==type) {
          typeSize = getNativeTypeSize(type);
          previousType = type;
      }
      i+=typeSize;
    }
    return ret;
  }
  function getMemory(size) {
    if (!staticSealed)
      return staticAlloc(size);
    if (!runtimeInitialized)
      return dynamicAlloc(size);
    return _malloc(size);
  }
  function Pointer_stringify(ptr, length) {
    if (length===0||!ptr)
      return '';
    var hasUtf=0;
    var t;
    var i=0;
    while (1) {
      assert(ptr+i<TOTAL_MEMORY);
      t = HEAPU8[(((ptr)+(i))>>0)];
      hasUtf|=t;
      if (t==0&&!length)
        break;
      i++;
      if (length&&i==length)
        break;
    }
    if (!length)
      length = i;
    var ret='';
    if (hasUtf<128) {
        var MAX_CHUNK=1024;
        var curr;
        while (length>0) {
          curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr+Math.min(length, MAX_CHUNK)));
          ret = ret ? ret+curr : curr;
          ptr+=MAX_CHUNK;
          length-=MAX_CHUNK;
        }
        return ret;
    }
    return UTF8ToString(ptr);
  }
  function AsciiToString(ptr) {
    var str='';
    while (1) {
      var ch=HEAP8[((ptr++)>>0)];
      if (!ch)
        return str;
      str+=String.fromCharCode(ch);
    }
  }
  function stringToAscii(str, outPtr) {
    return writeAsciiToMemory(str, outPtr, false);
  }
  var UTF8Decoder=typeof TextDecoder!=='undefined' ? new TextDecoder('utf8') : undefined;
  function UTF8ArrayToString(u8Array, idx) {
    var endPtr=idx;
    while (u8Array[endPtr]) {
      ++endPtr    }
    if (endPtr-idx>16&&u8Array.subarray&&UTF8Decoder) {
        return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
    }
    else {
      var u0, u1, u2, u3, u4, u5;
      var str='';
      while (1) {
        u0 = u8Array[idx++];
        if (!u0)
          return str;
        if (!(u0&0x80)) {
            str+=String.fromCharCode(u0);
            continue;
        }
        u1 = u8Array[idx++]&63;
        if ((u0&0xe0)==0xc0) {
            str+=String.fromCharCode(((u0&31)<<6)|u1);
            continue;
        }
        u2 = u8Array[idx++]&63;
        if ((u0&0xf0)==0xe0) {
            u0 = ((u0&15)<<12)|(u1<<6)|u2;
        }
        else {
          u3 = u8Array[idx++]&63;
          if ((u0&0xf8)==0xf0) {
              u0 = ((u0&7)<<18)|(u1<<12)|(u2<<6)|u3;
          }
          else {
            u4 = u8Array[idx++]&63;
            if ((u0&0xfc)==0xf8) {
                u0 = ((u0&3)<<24)|(u1<<18)|(u2<<12)|(u3<<6)|u4;
            }
            else {
              u5 = u8Array[idx++]&63;
              u0 = ((u0&1)<<30)|(u1<<24)|(u2<<18)|(u3<<12)|(u4<<6)|u5;
            }
          }
        }
        if (u0<0x10000) {
            str+=String.fromCharCode(u0);
        }
        else {
          var ch=u0-0x10000;
          str+=String.fromCharCode(0xd800|(ch>>10), 0xdc00|(ch&0x3ff));
        }
      }
    }
  }
  function UTF8ToString(ptr) {
    return UTF8ArrayToString(HEAPU8, ptr);
  }
  function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite>0))
      return 0;
    var startIdx=outIdx;
    var endIdx=outIdx+maxBytesToWrite-1;
    for (var i=0; i<str.length; ++i) {
        var u=str.charCodeAt(i);
        if (u>=0xd800&&u<=0xdfff)
          u = 0x10000+((u&0x3ff)<<10)|(str.charCodeAt(++i)&0x3ff);
        if (u<=0x7f) {
            if (outIdx>=endIdx)
              break;
            outU8Array[outIdx++] = u;
        }
        else 
          if (u<=0x7ff) {
            if (outIdx+1>=endIdx)
              break;
            outU8Array[outIdx++] = 0xc0|(u>>6);
            outU8Array[outIdx++] = 0x80|(u&63);
        }
        else 
          if (u<=0xffff) {
            if (outIdx+2>=endIdx)
              break;
            outU8Array[outIdx++] = 0xe0|(u>>12);
            outU8Array[outIdx++] = 0x80|((u>>6)&63);
            outU8Array[outIdx++] = 0x80|(u&63);
        }
        else 
          if (u<=0x1fffff) {
            if (outIdx+3>=endIdx)
              break;
            outU8Array[outIdx++] = 0xf0|(u>>18);
            outU8Array[outIdx++] = 0x80|((u>>12)&63);
            outU8Array[outIdx++] = 0x80|((u>>6)&63);
            outU8Array[outIdx++] = 0x80|(u&63);
        }
        else 
          if (u<=0x3ffffff) {
            if (outIdx+4>=endIdx)
              break;
            outU8Array[outIdx++] = 0xf8|(u>>24);
            outU8Array[outIdx++] = 0x80|((u>>18)&63);
            outU8Array[outIdx++] = 0x80|((u>>12)&63);
            outU8Array[outIdx++] = 0x80|((u>>6)&63);
            outU8Array[outIdx++] = 0x80|(u&63);
        }
        else {
          if (outIdx+5>=endIdx)
            break;
          outU8Array[outIdx++] = 0xfc|(u>>30);
          outU8Array[outIdx++] = 0x80|((u>>24)&63);
          outU8Array[outIdx++] = 0x80|((u>>18)&63);
          outU8Array[outIdx++] = 0x80|((u>>12)&63);
          outU8Array[outIdx++] = 0x80|((u>>6)&63);
          outU8Array[outIdx++] = 0x80|(u&63);
        }
    }
    outU8Array[outIdx] = 0;
    return outIdx-startIdx;
  }
  function stringToUTF8(str, outPtr, maxBytesToWrite) {
    assert(typeof maxBytesToWrite=='number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
  }
  function lengthBytesUTF8(str) {
    var len=0;
    for (var i=0; i<str.length; ++i) {
        var u=str.charCodeAt(i);
        if (u>=0xd800&&u<=0xdfff)
          u = 0x10000+((u&0x3ff)<<10)|(str.charCodeAt(++i)&0x3ff);
        if (u<=0x7f) {
            ++len;
        }
        else 
          if (u<=0x7ff) {
            len+=2;
        }
        else 
          if (u<=0xffff) {
            len+=3;
        }
        else 
          if (u<=0x1fffff) {
            len+=4;
        }
        else 
          if (u<=0x3ffffff) {
            len+=5;
        }
        else {
          len+=6;
        }
    }
    return len;
  }
  var UTF16Decoder=typeof TextDecoder!=='undefined' ? new TextDecoder('utf-16le') : undefined;
  function UTF16ToString(ptr) {
    assert(ptr%2==0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
    var endPtr=ptr;
    var idx=endPtr>>1;
    while (HEAP16[idx]) {
      ++idx    }
    endPtr = idx<<1;
    if (endPtr-ptr>32&&UTF16Decoder) {
        return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
    }
    else {
      var i=0;
      var str='';
      while (1) {
        var codeUnit=HEAP16[(((ptr)+(i*2))>>1)];
        if (codeUnit==0)
          return str;
        ++i;
        str+=String.fromCharCode(codeUnit);
      }
    }
  }
  function stringToUTF16(str, outPtr, maxBytesToWrite) {
    assert(outPtr%2==0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
    assert(typeof maxBytesToWrite=='number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
    if (maxBytesToWrite===undefined) {
        maxBytesToWrite = 0x7fffffff;
    }
    if (maxBytesToWrite<2)
      return 0;
    maxBytesToWrite-=2;
    var startPtr=outPtr;
    var numCharsToWrite=(maxBytesToWrite<str.length*2) ? (maxBytesToWrite/2) : str.length;
    for (var i=0; i<numCharsToWrite; ++i) {
        var codeUnit=str.charCodeAt(i);
        HEAP16[((outPtr)>>1)] = codeUnit;
        outPtr+=2;
    }
    HEAP16[((outPtr)>>1)] = 0;
    return outPtr-startPtr;
  }
  function lengthBytesUTF16(str) {
    return str.length*2;
  }
  function UTF32ToString(ptr) {
    assert(ptr%4==0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
    var i=0;
    var str='';
    while (1) {
      var utf32=HEAP32[(((ptr)+(i*4))>>2)];
      if (utf32==0)
        return str;
      ++i;
      if (utf32>=0x10000) {
          var ch=utf32-0x10000;
          str+=String.fromCharCode(0xd800|(ch>>10), 0xdc00|(ch&0x3ff));
      }
      else {
        str+=String.fromCharCode(utf32);
      }
    }
  }
  function stringToUTF32(str, outPtr, maxBytesToWrite) {
    assert(outPtr%4==0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
    assert(typeof maxBytesToWrite=='number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
    if (maxBytesToWrite===undefined) {
        maxBytesToWrite = 0x7fffffff;
    }
    if (maxBytesToWrite<4)
      return 0;
    var startPtr=outPtr;
    var endPtr=startPtr+maxBytesToWrite-4;
    for (var i=0; i<str.length; ++i) {
        var codeUnit=str.charCodeAt(i);
        if (codeUnit>=0xd800&&codeUnit<=0xdfff) {
            var trailSurrogate=str.charCodeAt(++i);
            codeUnit = 0x10000+((codeUnit&0x3ff)<<10)|(trailSurrogate&0x3ff);
        }
        HEAP32[((outPtr)>>2)] = codeUnit;
        outPtr+=4;
        if (outPtr+4>endPtr)
          break;
    }
    HEAP32[((outPtr)>>2)] = 0;
    return outPtr-startPtr;
  }
  function lengthBytesUTF32(str) {
    var len=0;
    for (var i=0; i<str.length; ++i) {
        var codeUnit=str.charCodeAt(i);
        if (codeUnit>=0xd800&&codeUnit<=0xdfff)
          ++i;
        len+=4;
    }
    return len;
  }
  function allocateUTF8(str) {
    var size=lengthBytesUTF8(str)+1;
    var ret=_malloc(size);
    if (ret)
      stringToUTF8Array(str, HEAP8, ret, size);
    return ret;
  }
  function allocateUTF8OnStack(str) {
    var size=lengthBytesUTF8(str)+1;
    var ret=stackAlloc(size);
    stringToUTF8Array(str, HEAP8, ret, size);
    return ret;
  }
  function demangle(func) {
    warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
    return func;
  }
  function demangleAll(text) {
    var regex=/__Z[\w\d_]+/g;
    return text.replace(regex, function(x) {
      var y=demangle(x);
      return x===y ? x : (x+' ['+y+']');
    });
  }
  function jsStackTrace() {
    var err=new Error();
    if (!err.stack) {
        try {
          throw new Error(0);
        }
        catch (e) {
            err = e;
        }
        if (!err.stack) {
            return '(no stack trace available)';
        }
    }
    return err.stack.toString();
  }
  function stackTrace() {
    var js=jsStackTrace();
    if (Module['extraStackTrace'])
      js+='\n'+Module['extraStackTrace']();
    return demangleAll(js);
  }
  var PAGE_SIZE=16384;
  var WASM_PAGE_SIZE=65536;
  var ASMJS_PAGE_SIZE=1024*1024*32;
  var MIN_TOTAL_MEMORY=1024*1024*32;
  function alignUp(x, multiple) {
    if (x%multiple>0) {
        x+=multiple-(x%multiple);
    }
    return x;
  }
  var HEAP, buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
  function updateGlobalBuffer(buf) {
    Module['buffer'] = buffer = buf;
  }
  function updateGlobalBufferViews() {
    Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
    Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
    Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
    Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
    Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
    Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
    Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
    Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
  }
  var STATIC_BASE, STATICTOP, staticSealed;
  var STACK_BASE, STACKTOP, STACK_MAX;
  var DYNAMIC_BASE, DYNAMICTOP_PTR;
  STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
  staticSealed = false;
  function writeStackCookie() {
    assert((STACK_MAX&3)==0);
    HEAPU32[(STACK_MAX>>2)-1] = 0x2135467;
    HEAPU32[(STACK_MAX>>2)-2] = 0x89bacdfe;
  }
  function checkStackCookie() {
    if (HEAPU32[(STACK_MAX>>2)-1]!=0x2135467||HEAPU32[(STACK_MAX>>2)-2]!=0x89bacdfe) {
        abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x02135467, but received 0x'+HEAPU32[(STACK_MAX>>2)-2].toString(16)+' '+HEAPU32[(STACK_MAX>>2)-1].toString(16));
    }
    if (HEAP32[0]!==0x63736d65)
      throw 'Runtime error: The application has corrupted its heap memory area (address zero)!';
  }
  function abortStackOverflow(allocSize) {
    abort('Stack overflow! Attempted to allocate '+allocSize+' bytes on the stack, but stack has only '+(STACK_MAX-stackSave()+allocSize)+' bytes available!');
  }
  function abortOnCannotGrowMemory() {
    abort('Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value '+TOTAL_MEMORY+', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
  }
  if (!Module['reallocBuffer'])
    Module['reallocBuffer'] = function(size) {
    var ret;
    try {
      if (ArrayBuffer.transfer) {
          ret = ArrayBuffer.transfer(buffer, size);
      }
      else {
        var oldHEAP8=HEAP8;
        ret = new ArrayBuffer(size);
        var temp=new Int8Array(ret);
        temp.set(oldHEAP8);
      }
    }
    catch (e) {
        return false;
    }
    var success=_emscripten_replace_memory(ret);
    if (!success)
      return false;
    return ret;
  }
  function enlargeMemory() {
    assert(HEAP32[DYNAMICTOP_PTR>>2]>TOTAL_MEMORY);
    var PAGE_MULTIPLE=Module["usingWasm"] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE;
    var LIMIT=2147483648-PAGE_MULTIPLE;
    if (HEAP32[DYNAMICTOP_PTR>>2]>LIMIT) {
        Module.printErr('Cannot enlarge memory, asked to go up to '+HEAP32[DYNAMICTOP_PTR>>2]+' bytes, but the limit is '+LIMIT+' bytes!');
        return false;
    }
    var OLD_TOTAL_MEMORY=TOTAL_MEMORY;
    TOTAL_MEMORY = Math.max(TOTAL_MEMORY, MIN_TOTAL_MEMORY);
    while (TOTAL_MEMORY<HEAP32[DYNAMICTOP_PTR>>2]) {
      if (TOTAL_MEMORY<=536870912) {
          TOTAL_MEMORY = alignUp(2*TOTAL_MEMORY, PAGE_MULTIPLE);
      }
      else {
        TOTAL_MEMORY = Math.min(alignUp((3*TOTAL_MEMORY+2147483648)/4, PAGE_MULTIPLE), LIMIT);
      }
    }
    var start=Date.now();
    var replacement=Module['reallocBuffer'](TOTAL_MEMORY);
    if (!replacement||replacement.byteLength!=TOTAL_MEMORY) {
        Module.printErr('Failed to grow the heap from '+OLD_TOTAL_MEMORY+' bytes to '+TOTAL_MEMORY+' bytes, not enough memory!');
        if (replacement) {
            Module.printErr('Expected to get back a buffer of size '+TOTAL_MEMORY+' bytes, but instead got back a buffer of size '+replacement.byteLength);
        }
        TOTAL_MEMORY = OLD_TOTAL_MEMORY;
        return false;
    }
    updateGlobalBuffer(replacement);
    updateGlobalBufferViews();
    if (!Module["usingWasm"]) {
        Module.printErr('Warning: Enlarging memory arrays, this is not fast! '+[OLD_TOTAL_MEMORY, TOTAL_MEMORY]);
    }
    return true;
  }
  var byteLength;
  try {
    byteLength = Function.prototype.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get);
    byteLength(new ArrayBuffer(4));
  }
  catch (e) {
      byteLength = function(buffer) {
        return buffer.byteLength;
      };
  }
  var TOTAL_STACK=Module['TOTAL_STACK']||5242880;
  var TOTAL_MEMORY=Module['TOTAL_MEMORY']||33554432;
  if (TOTAL_MEMORY<TOTAL_STACK)
    Module.printErr('TOTAL_MEMORY should be larger than TOTAL_STACK, was '+TOTAL_MEMORY+'! (TOTAL_STACK='+TOTAL_STACK+')');
  assert(typeof Int32Array!=='undefined'&&typeof Float64Array!=='undefined'&&Int32Array.prototype.subarray!==undefined&&Int32Array.prototype.set!==undefined, 'JS engine does not provide full typed array support');
  if (Module['buffer']) {
      buffer = Module['buffer'];
      assert(buffer.byteLength===TOTAL_MEMORY, 'provided buffer should be '+TOTAL_MEMORY+' bytes, but it is '+buffer.byteLength);
  }
  else {
    if (typeof WebAssembly==='object'&&typeof WebAssembly.Memory==='function') {
        assert(TOTAL_MEMORY%WASM_PAGE_SIZE===0);
        console.log("============", TOTAL_MEMORY, WASM_PAGE_SIZE);
        Module['wasmMemory'] = new WebAssembly.Memory({'initial': TOTAL_MEMORY/WASM_PAGE_SIZE});
        buffer = Module['wasmMemory'].buffer;
    }
    else {
      buffer = new ArrayBuffer(TOTAL_MEMORY);
    }
    assert(buffer.byteLength===TOTAL_MEMORY);
    Module['buffer'] = buffer;
  }
  updateGlobalBufferViews();
  function getTotalMemory() {
    return TOTAL_MEMORY;
  }
  HEAP32[0] = 0x63736d65;
  HEAP16[1] = 0x6373;
  if (HEAPU8[2]!==0x73||HEAPU8[3]!==0x63)
    throw 'Runtime error: expected the system to be little-endian!';
  function callRuntimeCallbacks(callbacks) {
    while (callbacks.length>0) {
      var callback=callbacks.shift();
      if (typeof callback=='function') {
          callback();
          continue;
      }
      var func=callback.func;
      if (typeof func==='number') {
          if (callback.arg===undefined) {
              Module['dynCall_v'](func);
          }
          else {
            Module['dynCall_vi'](func, callback.arg);
          }
      }
      else {
        func(callback.arg===undefined ? null : callback.arg);
      }
    }
  }
  var __ATPRERUN__=[];
  var __ATINIT__=[];
  var __ATMAIN__=[];
  var __ATEXIT__=[];
  var __ATPOSTRUN__=[];
  var runtimeInitialized=false;
  var runtimeExited=false;
  function preRun() {
    if (Module['preRun']) {
        if (typeof Module['preRun']=='function')
          Module['preRun'] = [Module['preRun']];
        while (Module['preRun'].length) {
          addOnPreRun(Module['preRun'].shift());
        }
    }
    callRuntimeCallbacks(__ATPRERUN__);
  }
  function ensureInitRuntime() {
    checkStackCookie();
    if (runtimeInitialized)
      return ;
    runtimeInitialized = true;
    callRuntimeCallbacks(__ATINIT__);
  }
  function preMain() {
    checkStackCookie();
    callRuntimeCallbacks(__ATMAIN__);
  }
  function exitRuntime() {
    checkStackCookie();
    callRuntimeCallbacks(__ATEXIT__);
    runtimeExited = true;
  }
  function postRun() {
    checkStackCookie();
    if (Module['postRun']) {
        if (typeof Module['postRun']=='function')
          Module['postRun'] = [Module['postRun']];
        while (Module['postRun'].length) {
          addOnPostRun(Module['postRun'].shift());
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__);
  }
  function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb);
  }
  function addOnInit(cb) {
    __ATINIT__.unshift(cb);
  }
  function addOnPreMain(cb) {
    __ATMAIN__.unshift(cb);
  }
  function addOnExit(cb) {
    __ATEXIT__.unshift(cb);
  }
  function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb);
  }
  function writeStringToMemory(string, buffer, dontAddNull) {
    warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');
    var lastChar, end;
    if (dontAddNull) {
        end = buffer+lengthBytesUTF8(string);
        lastChar = HEAP8[end];
    }
    stringToUTF8(string, buffer, Infinity);
    if (dontAddNull)
      HEAP8[end] = lastChar;
  }
  function writeArrayToMemory(array, buffer) {
    assert(array.length>=0, 'writeArrayToMemory array must have a length (should be an array or typed array)');
    HEAP8.set(array, buffer);
  }
  function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i=0; i<str.length; ++i) {
        assert(str.charCodeAt(i)===str.charCodeAt(i)&0xff);
        HEAP8[((buffer++)>>0)] = str.charCodeAt(i);
    }
    if (!dontAddNull)
      HEAP8[((buffer)>>0)] = 0;
  }
  function unSign(value, bits, ignore) {
    if (value>=0) {
        return value;
    }
    return bits<=32 ? 2*Math.abs(1<<(bits-1))+value : Math.pow(2, bits)+value;
  }
  function reSign(value, bits, ignore) {
    if (value<=0) {
        return value;
    }
    var half=bits<=32 ? Math.abs(1<<(bits-1)) : Math.pow(2, bits-1);
    if (value>=half&&(bits<=32||value>half)) {
        value = -2*half+value;
    }
    return value;
  }
  assert(Math['imul']&&Math['fround']&&Math['clz32']&&Math['trunc'], 'this is a legacy browser, build with LEGACY_VM_SUPPORT');
  var Math_abs=Math.abs;
  var Math_cos=Math.cos;
  var Math_sin=Math.sin;
  var Math_tan=Math.tan;
  var Math_acos=Math.acos;
  var Math_asin=Math.asin;
  var Math_atan=Math.atan;
  var Math_atan2=Math.atan2;
  var Math_exp=Math.exp;
  var Math_log=Math.log;
  var Math_sqrt=Math.sqrt;
  var Math_ceil=Math.ceil;
  var Math_floor=Math.floor;
  var Math_pow=Math.pow;
  var Math_imul=Math.imul;
  var Math_fround=Math.fround;
  var Math_round=Math.round;
  var Math_min=Math.min;
  var Math_max=Math.max;
  var Math_clz32=Math.clz32;
  var Math_trunc=Math.trunc;
  var runDependencies=0;
  var runDependencyWatcher=null;
  var dependenciesFulfilled=null;
  var runDependencyTracking={}
  function getUniqueRunDependency(id) {
    var orig=id;
    while (1) {
      if (!runDependencyTracking[id])
        return id;
      id = orig+Math.random();
    }
    return id;
  }
  function addRunDependency(id) {
    runDependencies++;
    if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
    }
    if (id) {
        assert(!runDependencyTracking[id]);
        runDependencyTracking[id] = 1;
        if (runDependencyWatcher===null&&typeof setInterval!=='undefined') {
            runDependencyWatcher = setInterval(function() {
              if (ABORT) {
                  clearInterval(runDependencyWatcher);
                  runDependencyWatcher = null;
                  return ;
              }
              var shown=false;
              for (var dep in runDependencyTracking) {
                  if (!shown) {
                      shown = true;
                      Module.printErr('still waiting on run dependencies:');
                  }
                  Module.printErr('dependency: '+dep);
              }
              if (shown) {
                  Module.printErr('(end of list)');
              }
            }, 10000);
        }
    }
    else {
      Module.printErr('warning: run dependency added without ID');
    }
  }
  function removeRunDependency(id) {
    runDependencies--;
    if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
    }
    if (id) {
        assert(runDependencyTracking[id]);
        delete runDependencyTracking[id];
    }
    else {
      Module.printErr('warning: run dependency removed without ID');
    }
    if (runDependencies==0) {
        if (runDependencyWatcher!==null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null;
        }
        if (dependenciesFulfilled) {
            var callback=dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback();
        }
    }
  }
  Module["preloadedImages"] = {}
  Module["preloadedAudios"] = {}
  var memoryInitializer=null;
  var FS={error: function() {
    abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with  -s FORCE_FILESYSTEM=1');
  }, init: function() {
    FS.error();
  }, createDataFile: function() {
    FS.error();
  }, createPreloadedFile: function() {
    FS.error();
  }, createLazyFile: function() {
    FS.error();
  }, open: function() {
    FS.error();
  }, mkdev: function() {
    FS.error();
  }, registerDevice: function() {
    FS.error();
  }, analyzePath: function() {
    FS.error();
  }, loadFilesFromDB: function() {
    FS.error();
  }, ErrnoError: function ErrnoError() {
    FS.error();
  }}
  Module['FS_createDataFile'] = FS.createDataFile;
  Module['FS_createPreloadedFile'] = FS.createPreloadedFile;
  var dataURIPrefix='data:application/octet-stream;base64,';
  function isDataURI(filename) {
    return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix)===0;
  }
  function integrateWasmJS() {
    var method='native-wasm';
    var wasmTextFile='_built_wasm.wast';
    var wasmBinaryFile='_built_wasm.wasm';
    var asmjsCodeFile='_built_wasm.temp.asm.js';
    if (typeof Module['locateFile']==='function') {
        if (!isDataURI(wasmTextFile)) {
            wasmTextFile = Module['locateFile'](wasmTextFile);
        }
        if (!isDataURI(wasmBinaryFile)) {
            wasmBinaryFile = Module['locateFile'](wasmBinaryFile);
        }
        if (!isDataURI(asmjsCodeFile)) {
            asmjsCodeFile = Module['locateFile'](asmjsCodeFile);
        }
    }
    var wasmPageSize=64*1024;
    var info={'global': null, 'env': null, 'asm2wasm': {"f64-rem": function(x, y) {
      return x%y;
    }, "debugger": function() {
      debugger;
    }}, 'parent': Module}
    var exports=null;
    function mergeMemory(newBuffer) {
      var oldBuffer=Module['buffer'];
      if (newBuffer.byteLength<oldBuffer.byteLength) {
          Module['printErr']('the new buffer in mergeMemory is smaller than the previous one. in native wasm, we should grow memory here');
      }
      var oldView=new Int8Array(oldBuffer);
      var newView=new Int8Array(newBuffer);
      newView.set(oldView);
      updateGlobalBuffer(newBuffer);
      updateGlobalBufferViews();
    }
    function fixImports(imports) {
      return imports;
    }
    function getBinary() {
      try {
        if (Module['wasmBinary']) {
            return new Uint8Array(Module['wasmBinary']);
        }
        if (Module['readBinary']) {
            return Module['readBinary'](wasmBinaryFile);
        }
        else {
          throw "on the web, we need the wasm binary to be preloaded and set on Module['wasmBinary']. emcc.py will do that for you when generating HTML (but not JS)";
        }
      }
      catch (err) {
          abort(err);
      }
    }
    function getBinaryPromise() {
      if (!Module['wasmBinary']&&(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER)&&typeof fetch==='function') {
          return fetch(wasmBinaryFile, {credentials: 'same-origin'}).then(function(response) {
            if (!response['ok']) {
                throw "failed to load wasm binary file at '"+wasmBinaryFile+"'";
            }
            return response['arrayBuffer']();
          }).catch(function() {
            return getBinary();
          });
      }
      return new Promise(function(resolve, reject) {
        resolve(getBinary());
      });
    }
    function doNativeWasm(global, env, providedBuffer) {
      if (typeof WebAssembly!=='object') {
          Module['printErr']('no native wasm support detected');
          return false;
      }
      console.log("============2", TOTAL_MEMORY, WASM_PAGE_SIZE);
      if (!(__instance_of(Module['wasmMemory'], WebAssembly.Memory))) {
          Module['printErr']('no native wasm Memory in use');
          return false;
      }
      env['memory'] = Module['wasmMemory'];
      info['global'] = {'NaN': NaN, 'Infinity': Infinity}
      info['global.Math'] = Math;
      info['env'] = env;
      function receiveInstance(instance, module) {
        exports = instance.exports;
        if (exports.memory)
          mergeMemory(exports.memory);
        Module['asm'] = exports;
        Module["usingWasm"] = true;
        removeRunDependency('wasm-instantiate');
      }
      addRunDependency('wasm-instantiate');
      if (Module['instantiateWasm']) {
          try {
            return Module['instantiateWasm'](info, receiveInstance);
          }
          catch (e) {
              Module['printErr']('Module.instantiateWasm callback failed with error: '+e);
              return false;
          }
      }
      var trueModule=Module;
      function receiveInstantiatedSource(output) {
        assert(Module===trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
        trueModule = null;
        receiveInstance(output['instance'], output['module']);
      }
      function instantiateArrayBuffer(receiver) {
        getBinaryPromise().then(function(binary) {
          return WebAssembly.instantiate(binary, info);
        }).then(receiver).catch(function(reason) {
          Module['printErr']('failed to asynchronously prepare wasm: '+reason);
          abort(reason);
        });
      }
      if (!Module['wasmBinary']&&typeof WebAssembly.instantiateStreaming==='function'&&!isDataURI(wasmBinaryFile)&&typeof fetch==='function') {
          WebAssembly.instantiateStreaming(fetch(wasmBinaryFile, {credentials: 'same-origin'}), info).then(receiveInstantiatedSource).catch(function(reason) {
            Module['printErr']('wasm streaming compile failed: '+reason);
            Module['printErr']('falling back to ArrayBuffer instantiation');
            instantiateArrayBuffer(receiveInstantiatedSource);
          });
      }
      else {
        instantiateArrayBuffer(receiveInstantiatedSource);
      }
      return {}
    }
    Module['asmPreload'] = Module['asm'];
    var asmjsReallocBuffer=Module['reallocBuffer'];
    var wasmReallocBuffer=function(size) {
      var PAGE_MULTIPLE=Module["usingWasm"] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE;
      size = alignUp(size, PAGE_MULTIPLE);
      var old=Module['buffer'];
      var oldSize=old.byteLength;
      if (Module["usingWasm"]) {
          try {
            var result=Module['wasmMemory'].grow((size-oldSize)/wasmPageSize);
            if (result!==(-1|0)) {
                return Module['buffer'] = Module['wasmMemory'].buffer;
            }
            else {
              return null;
            }
          }
          catch (e) {
              console.error('Module.reallocBuffer: Attempted to grow from '+oldSize+' bytes to '+size+' bytes, but got error: '+e);
              return null;
          }
      }
    }
    Module['reallocBuffer'] = function(size) {
      if (finalMethod==='asmjs') {
          return asmjsReallocBuffer(size);
      }
      else {
        return wasmReallocBuffer(size);
      }
    }
    var finalMethod='';
    Module['asm'] = function(global, env, providedBuffer) {
      env = fixImports(env);
      console.log("-----------------", env);
      if (!env['table']) {
          var TABLE_SIZE=Module['wasmTableSize'];
          if (TABLE_SIZE===undefined)
            TABLE_SIZE = 1024;
          var MAX_TABLE_SIZE=Module['wasmMaxTableSize'];
          if (typeof WebAssembly==='object'&&typeof WebAssembly.Table==='function') {
              if (MAX_TABLE_SIZE!==undefined) {
                  env['table'] = new WebAssembly.Table({'initial': TABLE_SIZE, 'maximum': MAX_TABLE_SIZE, 'element': 'anyfunc'});
              }
              else {
                env['table'] = new WebAssembly.Table({'initial': TABLE_SIZE, element: 'anyfunc'});
              }
          }
          else {
            env['table'] = new Array(TABLE_SIZE);
          }
          Module['wasmTable'] = env['table'];
      }
      if (!env['memoryBase']) {
          env['memoryBase'] = Module['STATIC_BASE'];
      }
      if (!env['tableBase']) {
          env['tableBase'] = 0;
      }
      var exports;
      exports = doNativeWasm(global, env, providedBuffer);
      if (!exports)
        abort('no binaryen method succeeded. consider enabling more options, like interpreting, if you want that: https://github.com/kripken/emscripten/wiki/WebAssembly#binaryen-methods');
      return exports;
    }
    var methodHandler=Module['asm'];
  }
  integrateWasmJS();
  var ASM_CONSTS=[];
  function _sendMessage(x, buffer, len) {
    _wasm_post_message(x, buffer, len);
  }
  STATIC_BASE = GLOBAL_BASE;
  STATICTOP = STATIC_BASE+10400;
  __ATINIT__.push();
  var STATIC_BUMP=10400;
  Module["STATIC_BASE"] = STATIC_BASE;
  Module["STATIC_BUMP"] = STATIC_BUMP;
  var tempDoublePtr=STATICTOP;
  STATICTOP+=16;
  assert(tempDoublePtr%8==0);
  function copyTempFloat(ptr) {
    HEAP8[tempDoublePtr] = HEAP8[ptr];
    HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
    HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
    HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  }
  function copyTempDouble(ptr) {
    HEAP8[tempDoublePtr] = HEAP8[ptr];
    HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
    HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
    HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
    HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
    HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
    HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
    HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
  }
  function __ZSt18uncaught_exceptionv() {
    return !!__ZSt18uncaught_exceptionv.uncaught_exception;
  }
  var EXCEPTIONS={last: 0, caught: [], infos: {}, deAdjust: function(adjusted) {
    if (!adjusted||EXCEPTIONS.infos[adjusted])
      return adjusted;
    for (var key in EXCEPTIONS.infos) {
        var ptr=+key;
        var info=EXCEPTIONS.infos[ptr];
        if (info.adjusted===adjusted) {
            return ptr;
        }
    }
    return adjusted;
  }, addRef: function(ptr) {
    if (!ptr)
      return ;
    var info=EXCEPTIONS.infos[ptr];
    info.refcount++;
  }, decRef: function(ptr) {
    if (!ptr)
      return ;
    var info=EXCEPTIONS.infos[ptr];
    assert(info.refcount>0);
    info.refcount--;
    if (info.refcount===0&&!info.rethrown) {
        if (info.destructor) {
            Module['dynCall_vi'](info.destructor, ptr);
        }
        delete EXCEPTIONS.infos[ptr];
        ___cxa_free_exception(ptr);
    }
  }, clearRef: function(ptr) {
    if (!ptr)
      return ;
    var info=EXCEPTIONS.infos[ptr];
    info.refcount = 0;
  }}
  function ___resumeException(ptr) {
    if (!EXCEPTIONS.last) {
        EXCEPTIONS.last = ptr;
    }
    throw ptr+" - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
  }
  function ___cxa_find_matching_catch() {
    var thrown=EXCEPTIONS.last;
    if (!thrown) {
        return ((setTempRet0(0), 0)|0);
    }
    var info=EXCEPTIONS.infos[thrown];
    var throwntype=info.type;
    if (!throwntype) {
        return ((setTempRet0(0), thrown)|0);
    }
    var typeArray=Array.prototype.slice.call(arguments);
    var pointer=Module['___cxa_is_pointer_type'](throwntype);
    if (!___cxa_find_matching_catch.buffer)
      ___cxa_find_matching_catch.buffer = _malloc(4);
    HEAP32[((___cxa_find_matching_catch.buffer)>>2)] = thrown;
    thrown = ___cxa_find_matching_catch.buffer;
    for (var i=0; i<typeArray.length; i++) {
        if (typeArray[i]&&Module['___cxa_can_catch'](typeArray[i], throwntype, thrown)) {
            thrown = HEAP32[((thrown)>>2)];
            info.adjusted = thrown;
            return ((setTempRet0(typeArray[i]), thrown)|0);
        }
    }
    thrown = HEAP32[((thrown)>>2)];
    return ((setTempRet0(throwntype), thrown)|0);
  }
  function ___gxx_personality_v0() {
  }
  function ___lock() {
  }
  var SYSCALLS={varargs: 0, get: function(varargs) {
    SYSCALLS.varargs+=4;
    var ret=HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
    return ret;
  }, getStr: function() {
    var ret=Pointer_stringify(SYSCALLS.get());
    return ret;
  }, get64: function() {
    var low=SYSCALLS.get(), high=SYSCALLS.get();
    if (low>=0)
      assert(high===0);
    else 
      assert(high===-1);
    return low;
  }, getZero: function() {
    assert(SYSCALLS.get()===0);
  }}
  function ___syscall140(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
      var stream=SYSCALLS.getStreamFromFD(), offset_high=SYSCALLS.get(), offset_low=SYSCALLS.get(), result=SYSCALLS.get(), whence=SYSCALLS.get();
      var offset=offset_low;
      FS.llseek(stream, offset, whence);
      HEAP32[((result)>>2)] = stream.position;
      if (stream.getdents&&offset===0&&whence===0)
        stream.getdents = null;
      return 0;
    }
    catch (e) {
        if (typeof FS==='undefined'||!(__instance_of(e, FS.ErrnoError)))
          abort(e);
        return -e.errno;
    }
  }
  function flush_NO_FILESYSTEM() {
    var fflush=Module["_fflush"];
    if (fflush)
      fflush(0);
    var printChar=___syscall146.printChar;
    if (!printChar)
      return ;
    var buffers=___syscall146.buffers;
    if (buffers[1].length)
      printChar(1, 10);
    if (buffers[2].length)
      printChar(2, 10);
  }
  function ___syscall146(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
      var stream=SYSCALLS.get(), iov=SYSCALLS.get(), iovcnt=SYSCALLS.get();
      var ret=0;
      if (!___syscall146.buffers) {
          ___syscall146.buffers = [null, [], []];
          ___syscall146.printChar = function(stream, curr) {
            var buffer=___syscall146.buffers[stream];
            assert(buffer);
            if (curr===0||curr===10) {
                (stream===1 ? Module['print'] : Module['printErr'])(UTF8ArrayToString(buffer, 0));
                buffer.length = 0;
            }
            else {
              buffer.push(curr);
            }
          };
      }
      for (var i=0; i<iovcnt; i++) {
          var ptr=HEAP32[(((iov)+(i*8))>>2)];
          var len=HEAP32[(((iov)+(i*8+4))>>2)];
          for (var j=0; j<len; j++) {
              ___syscall146.printChar(stream, HEAPU8[ptr+j]);
          }
          ret+=len;
      }
      return ret;
    }
    catch (e) {
        if (typeof FS==='undefined'||!(__instance_of(e, FS.ErrnoError)))
          abort(e);
        return -e.errno;
    }
  }
  function ___syscall54(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
      return 0;
    }
    catch (e) {
        if (typeof FS==='undefined'||!(__instance_of(e, FS.ErrnoError)))
          abort(e);
        return -e.errno;
    }
  }
  function ___syscall6(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
      var stream=SYSCALLS.getStreamFromFD();
      FS.close(stream);
      return 0;
    }
    catch (e) {
        if (typeof FS==='undefined'||!(__instance_of(e, FS.ErrnoError)))
          abort(e);
        return -e.errno;
    }
  }
  function ___unlock() {
  }
  function _clock() {
    if (_clock.start===undefined)
      _clock.start = Date.now();
    return ((Date.now()-_clock.start)*(1000000/1000))|0;
  }
  function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
    return dest;
  }
  function ___setErrNo(value) {
    if (Module['___errno_location'])
      HEAP32[((Module['___errno_location']())>>2)] = value;
    else 
      Module.printErr('failed to set errno from JS');
    return value;
  }
  DYNAMICTOP_PTR = staticAlloc(4);
  STACK_BASE = STACKTOP = alignMemory(STATICTOP);
  STACK_MAX = STACK_BASE+TOTAL_STACK;
  DYNAMIC_BASE = alignMemory(STACK_MAX);
  HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;
  staticSealed = true;
  assert(DYNAMIC_BASE<TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");
  var ASSERTIONS=true;
  function intArrayFromString(stringy, dontAddNull, length) {
    var len=length>0 ? length : lengthBytesUTF8(stringy)+1;
    var u8array=new Array(len);
    var numBytesWritten=stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull)
      u8array.length = numBytesWritten;
    return u8array;
  }
  function intArrayToString(array) {
    var ret=[];
    for (var i=0; i<array.length; i++) {
        var chr=array[i];
        if (chr>0xff) {
            if (ASSERTIONS) {
                assert(false, 'Character code '+chr+' ('+String.fromCharCode(chr)+')  at offset '+i+' not in 0x00-0xFF.');
            }
            chr&=0xff;
        }
        ret.push(String.fromCharCode(chr));
    }
    return ret.join('');
  }
  function nullFunc_ii(x) {
    Module["printErr"]("Invalid function pointer called with signature 'ii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
    Module["printErr"]("Build with ASSERTIONS=2 for more info.");
    abort(x);
  }
  function nullFunc_iiii(x) {
    Module["printErr"]("Invalid function pointer called with signature 'iiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
    Module["printErr"]("Build with ASSERTIONS=2 for more info.");
    abort(x);
  }
  Module['wasmTableSize'] = 10;
  Module['wasmMaxTableSize'] = 10;
  function invoke_ii(index, a1) {
    try {
      return Module["dynCall_ii"](index, a1);
    }
    catch (e) {
        if (typeof e!=='number'&&e!=='longjmp')
          throw e;
        Module["setThrew"](1, 0);
    }
  }
  function invoke_iiii(index, a1, a2, a3) {
    try {
      return Module["dynCall_iiii"](index, a1, a2, a3);
    }
    catch (e) {
        if (typeof e!=='number'&&e!=='longjmp')
          throw e;
        Module["setThrew"](1, 0);
    }
  }
  Module.asmGlobalArg = {}
  Module.asmLibraryArg = {"abort": abort, "assert": assert, "enlargeMemory": enlargeMemory, "getTotalMemory": getTotalMemory, "abortOnCannotGrowMemory": abortOnCannotGrowMemory, "abortStackOverflow": abortStackOverflow, "nullFunc_ii": nullFunc_ii, "nullFunc_iiii": nullFunc_iiii, "invoke_ii": invoke_ii, "invoke_iiii": invoke_iiii, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "___gxx_personality_v0": ___gxx_personality_v0, "___lock": ___lock, "___resumeException": ___resumeException, "___setErrNo": ___setErrNo, "___syscall140": ___syscall140, "___syscall146": ___syscall146, "___syscall54": ___syscall54, "___syscall6": ___syscall6, "___unlock": ___unlock, "_clock": _clock, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_sendMessage": _sendMessage, "flush_NO_FILESYSTEM": flush_NO_FILESYSTEM, "DYNAMICTOP_PTR": DYNAMICTOP_PTR, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX}
  var asm=Module["asm"](Module.asmGlobalArg, Module.asmLibraryArg, buffer);
  var real__FM_free=asm["_FM_free"];
  asm["_FM_free"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real__FM_free.apply(null, arguments);
  }
  var real__FM_malloc=asm["_FM_malloc"];
  asm["_FM_malloc"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real__FM_malloc.apply(null, arguments);
  }
  var real____em_js__sendMessage=asm["___em_js__sendMessage"];
  asm["___em_js__sendMessage"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real____em_js__sendMessage.apply(null, arguments);
  }
  var real____errno_location=asm["___errno_location"];
  asm["___errno_location"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real____errno_location.apply(null, arguments);
  }
  var real__fflush=asm["_fflush"];
  asm["_fflush"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real__fflush.apply(null, arguments);
  }
  var real__free=asm["_free"];
  asm["_free"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real__free.apply(null, arguments);
  }
  var real__gotMessage=asm["_gotMessage"];
  asm["_gotMessage"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real__gotMessage.apply(null, arguments);
  }
  var real__llvm_bswap_i32=asm["_llvm_bswap_i32"];
  asm["_llvm_bswap_i32"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real__llvm_bswap_i32.apply(null, arguments);
  }
  var real__main=asm["_main"];
  asm["_main"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real__main.apply(null, arguments);
  }
  var real__malloc=asm["_malloc"];
  asm["_malloc"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real__malloc.apply(null, arguments);
  }
  var real__sbrk=asm["_sbrk"];
  asm["_sbrk"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real__sbrk.apply(null, arguments);
  }
  var real_establishStackSpace=asm["establishStackSpace"];
  asm["establishStackSpace"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real_establishStackSpace.apply(null, arguments);
  }
  var real_getTempRet0=asm["getTempRet0"];
  asm["getTempRet0"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real_getTempRet0.apply(null, arguments);
  }
  var real_setTempRet0=asm["setTempRet0"];
  asm["setTempRet0"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real_setTempRet0.apply(null, arguments);
  }
  var real_setThrew=asm["setThrew"];
  asm["setThrew"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real_setThrew.apply(null, arguments);
  }
  var real_stackAlloc=asm["stackAlloc"];
  asm["stackAlloc"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real_stackAlloc.apply(null, arguments);
  }
  var real_stackRestore=asm["stackRestore"];
  asm["stackRestore"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real_stackRestore.apply(null, arguments);
  }
  var real_stackSave=asm["stackSave"];
  asm["stackSave"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return real_stackSave.apply(null, arguments);
  }
  Module["asm"] = asm;
  var _FM_free=Module["_FM_free"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_FM_free"].apply(null, arguments);
  }
  var _FM_malloc=Module["_FM_malloc"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_FM_malloc"].apply(null, arguments);
  }
  var ___em_js__sendMessage=Module["___em_js__sendMessage"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["___em_js__sendMessage"].apply(null, arguments);
  }
  var ___errno_location=Module["___errno_location"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["___errno_location"].apply(null, arguments);
  }
  var _emscripten_replace_memory=Module["_emscripten_replace_memory"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_emscripten_replace_memory"].apply(null, arguments);
  }
  var _fflush=Module["_fflush"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_fflush"].apply(null, arguments);
  }
  var _free=Module["_free"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_free"].apply(null, arguments);
  }
  var _gotMessage=Module["_gotMessage"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_gotMessage"].apply(null, arguments);
  }
  var _llvm_bswap_i32=Module["_llvm_bswap_i32"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_llvm_bswap_i32"].apply(null, arguments);
  }
  var _main=Module["_main"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_main"].apply(null, arguments);
  }
  var _malloc=Module["_malloc"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_malloc"].apply(null, arguments);
  }
  var _memcpy=Module["_memcpy"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_memcpy"].apply(null, arguments);
  }
  var _memset=Module["_memset"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_memset"].apply(null, arguments);
  }
  var _sbrk=Module["_sbrk"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["_sbrk"].apply(null, arguments);
  }
  var establishStackSpace=Module["establishStackSpace"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["establishStackSpace"].apply(null, arguments);
  }
  var getTempRet0=Module["getTempRet0"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["getTempRet0"].apply(null, arguments);
  }
  var runPostSets=Module["runPostSets"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["runPostSets"].apply(null, arguments);
  }
  var setTempRet0=Module["setTempRet0"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["setTempRet0"].apply(null, arguments);
  }
  var setThrew=Module["setThrew"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["setThrew"].apply(null, arguments);
  }
  var stackAlloc=Module["stackAlloc"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["stackAlloc"].apply(null, arguments);
  }
  var stackRestore=Module["stackRestore"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["stackRestore"].apply(null, arguments);
  }
  var stackSave=Module["stackSave"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["stackSave"].apply(null, arguments);
  }
  var dynCall_ii=Module["dynCall_ii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_ii"].apply(null, arguments);
  }
  var dynCall_iiii=Module["dynCall_iiii"] = function() {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiii"].apply(null, arguments);
  }
  
  Module['asm'] = asm;
  if (!Module["intArrayFromString"])
    Module["intArrayFromString"] = function() {
    abort("'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["intArrayToString"])
    Module["intArrayToString"] = function() {
    abort("'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  Module["ccall"] = ccall;
  if (!Module["cwrap"])
    Module["cwrap"] = function() {
    abort("'cwrap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["setValue"])
    Module["setValue"] = function() {
    abort("'setValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["getValue"])
    Module["getValue"] = function() {
    abort("'getValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["allocate"])
    Module["allocate"] = function() {
    abort("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  Module["getMemory"] = getMemory;
  if (!Module["Pointer_stringify"])
    Module["Pointer_stringify"] = function() {
    abort("'Pointer_stringify' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["AsciiToString"])
    Module["AsciiToString"] = function() {
    abort("'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["stringToAscii"])
    Module["stringToAscii"] = function() {
    abort("'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["UTF8ArrayToString"])
    Module["UTF8ArrayToString"] = function() {
    abort("'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["UTF8ToString"])
    Module["UTF8ToString"] = function() {
    abort("'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["stringToUTF8Array"])
    Module["stringToUTF8Array"] = function() {
    abort("'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["stringToUTF8"])
    Module["stringToUTF8"] = function() {
    abort("'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["lengthBytesUTF8"])
    Module["lengthBytesUTF8"] = function() {
    abort("'lengthBytesUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["UTF16ToString"])
    Module["UTF16ToString"] = function() {
    abort("'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["stringToUTF16"])
    Module["stringToUTF16"] = function() {
    abort("'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["lengthBytesUTF16"])
    Module["lengthBytesUTF16"] = function() {
    abort("'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["UTF32ToString"])
    Module["UTF32ToString"] = function() {
    abort("'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["stringToUTF32"])
    Module["stringToUTF32"] = function() {
    abort("'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["lengthBytesUTF32"])
    Module["lengthBytesUTF32"] = function() {
    abort("'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["allocateUTF8"])
    Module["allocateUTF8"] = function() {
    abort("'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["stackTrace"])
    Module["stackTrace"] = function() {
    abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["addOnPreRun"])
    Module["addOnPreRun"] = function() {
    abort("'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["addOnInit"])
    Module["addOnInit"] = function() {
    abort("'addOnInit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["addOnPreMain"])
    Module["addOnPreMain"] = function() {
    abort("'addOnPreMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["addOnExit"])
    Module["addOnExit"] = function() {
    abort("'addOnExit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["addOnPostRun"])
    Module["addOnPostRun"] = function() {
    abort("'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["writeStringToMemory"])
    Module["writeStringToMemory"] = function() {
    abort("'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["writeArrayToMemory"])
    Module["writeArrayToMemory"] = function() {
    abort("'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["writeAsciiToMemory"])
    Module["writeAsciiToMemory"] = function() {
    abort("'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["addRunDependency"])
    Module["addRunDependency"] = function() {
    abort("'addRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Module["removeRunDependency"])
    Module["removeRunDependency"] = function() {
    abort("'removeRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Module["FS"])
    Module["FS"] = function() {
    abort("'FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["FS_createFolder"])
    Module["FS_createFolder"] = function() {
    abort("'FS_createFolder' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Module["FS_createPath"])
    Module["FS_createPath"] = function() {
    abort("'FS_createPath' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Module["FS_createDataFile"])
    Module["FS_createDataFile"] = function() {
    abort("'FS_createDataFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Module["FS_createPreloadedFile"])
    Module["FS_createPreloadedFile"] = function() {
    abort("'FS_createPreloadedFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Module["FS_createLazyFile"])
    Module["FS_createLazyFile"] = function() {
    abort("'FS_createLazyFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Module["FS_createLink"])
    Module["FS_createLink"] = function() {
    abort("'FS_createLink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Module["FS_createDevice"])
    Module["FS_createDevice"] = function() {
    abort("'FS_createDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Module["FS_unlink"])
    Module["FS_unlink"] = function() {
    abort("'FS_unlink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Module["GL"])
    Module["GL"] = function() {
    abort("'GL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["staticAlloc"])
    Module["staticAlloc"] = function() {
    abort("'staticAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["dynamicAlloc"])
    Module["dynamicAlloc"] = function() {
    abort("'dynamicAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["warnOnce"])
    Module["warnOnce"] = function() {
    abort("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["loadDynamicLibrary"])
    Module["loadDynamicLibrary"] = function() {
    abort("'loadDynamicLibrary' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["loadWebAssemblyModule"])
    Module["loadWebAssemblyModule"] = function() {
    abort("'loadWebAssemblyModule' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["getLEB"])
    Module["getLEB"] = function() {
    abort("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["getFunctionTables"])
    Module["getFunctionTables"] = function() {
    abort("'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["alignFunctionTables"])
    Module["alignFunctionTables"] = function() {
    abort("'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["registerFunctions"])
    Module["registerFunctions"] = function() {
    abort("'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["addFunction"])
    Module["addFunction"] = function() {
    abort("'addFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["removeFunction"])
    Module["removeFunction"] = function() {
    abort("'removeFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["getFuncWrapper"])
    Module["getFuncWrapper"] = function() {
    abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["prettyPrint"])
    Module["prettyPrint"] = function() {
    abort("'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["makeBigInt"])
    Module["makeBigInt"] = function() {
    abort("'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["dynCall"])
    Module["dynCall"] = function() {
    abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["getCompilerSetting"])
    Module["getCompilerSetting"] = function() {
    abort("'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["stackSave"])
    Module["stackSave"] = function() {
    abort("'stackSave' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["stackRestore"])
    Module["stackRestore"] = function() {
    abort("'stackRestore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["stackAlloc"])
    Module["stackAlloc"] = function() {
    abort("'stackAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Module["ALLOC_NORMAL"])
    Object.defineProperty(Module, "ALLOC_NORMAL", {get: function() {
    abort("'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }});
  if (!Module["ALLOC_STACK"])
    Object.defineProperty(Module, "ALLOC_STACK", {get: function() {
    abort("'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }});
  if (!Module["ALLOC_STATIC"])
    Object.defineProperty(Module, "ALLOC_STATIC", {get: function() {
    abort("'ALLOC_STATIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }});
  if (!Module["ALLOC_DYNAMIC"])
    Object.defineProperty(Module, "ALLOC_DYNAMIC", {get: function() {
    abort("'ALLOC_DYNAMIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }});
  if (!Module["ALLOC_NONE"])
    Object.defineProperty(Module, "ALLOC_NONE", {get: function() {
    abort("'ALLOC_NONE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }});
  function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit("+status+")";
    this.status = status;
  }
  ExitStatus.prototype = new Error();
  ExitStatus.prototype.constructor = ExitStatus;
  var initialStackTop;
  var calledMain=false;
  dependenciesFulfilled = function runCaller() {
    if (!Module['calledRun'])
      run();
    if (!Module['calledRun'])
      dependenciesFulfilled = runCaller;
  }
  Module['callMain'] = function callMain(args) {
    assert(runDependencies==0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
    assert(__ATPRERUN__.length==0, 'cannot call main when preRun functions remain to be called');
    args = args||[];
    ensureInitRuntime();
    var argc=args.length+1;
    var argv=stackAlloc((argc+1)*4);
    HEAP32[argv>>2] = allocateUTF8OnStack(Module['thisProgram']);
    for (var i=1; i<argc; i++) {
        HEAP32[(argv>>2)+i] = allocateUTF8OnStack(args[i-1]);
    }
    HEAP32[(argv>>2)+argc] = 0;
    try {
      var ret=Module['_main'](argc, argv, 0);
      exit(ret, true);
    }
    catch (e) {
        if (__instance_of(e, ExitStatus)) {
            return ;
        }
        else 
          if (e=='SimulateInfiniteLoop') {
            Module['noExitRuntime'] = true;
            return ;
        }
        else {
          var toLog=e;
          if (e&&typeof e==='object'&&e.stack) {
              toLog = [e, e.stack];
          }
          Module.printErr('exception thrown: '+toLog);
          Module['quit'](1, e);
        }
    }
    finally {
        calledMain = true;
      }
  }
  function run(args) {
    args = args||Module['arguments'];
    if (runDependencies>0) {
        return ;
    }
    writeStackCookie();
    preRun();
    if (runDependencies>0)
      return ;
    if (Module['calledRun'])
      return ;
    function doRun() {
      if (Module['calledRun'])
        return ;
      Module['calledRun'] = true;
      if (ABORT)
        return ;
      ensureInitRuntime();
      preMain();
      if (Module['onRuntimeInitialized'])
        Module['onRuntimeInitialized']();
      if (Module['_main']&&shouldRunNow)
        Module['callMain'](args);
      postRun();
    }
    if (Module['setStatus']) {
        Module['setStatus']('Running...');
        setTimeout(function() {
          setTimeout(function() {
            Module['setStatus']('');
          }, 1);
          doRun();
        }, 1);
    }
    else {
      doRun();
    }
    checkStackCookie();
  }
  Module['run'] = run;
  function checkUnflushedContent() {
    var print=Module['print'];
    var printErr=Module['printErr'];
    var has=false;
    Module['print'] = Module['printErr'] = function(x) {
      has = true;
    }
    try {
      var flush=flush_NO_FILESYSTEM;
      if (flush)
        flush(0);
    }
    catch (e) {
    }
    Module['print'] = print;
    Module['printErr'] = printErr;
    if (has) {
        warnOnce('stdio streams had content in them that was not flushed. you should set NO_EXIT_RUNTIME to 0 (see the FAQ), or make sure to emit a newline when you printf etc.');
    }
  }
  function exit(status, implicit) {
    checkUnflushedContent();
    if (implicit&&Module['noExitRuntime']&&status===0) {
        return ;
    }
    if (Module['noExitRuntime']) {
        if (!implicit) {
            Module.printErr('exit('+status+') called, but NO_EXIT_RUNTIME is set, so halting execution but not exiting the runtime or preventing further async execution (build with NO_EXIT_RUNTIME=0, if you want a true shutdown)');
        }
    }
    else {
      ABORT = true;
      EXITSTATUS = status;
      STACKTOP = initialStackTop;
      exitRuntime();
      if (Module['onExit'])
        Module['onExit'](status);
    }
    if (ENVIRONMENT_IS_NODE) {
        process['exit'](status);
    }
    Module['quit'](status, new ExitStatus(status));
  }
  Module['exit'] = exit;
  var abortDecorators=[];
  function abort(what) {
    if (Module['onAbort']) {
        Module['onAbort'](what);
    }
    if (what!==undefined) {
        Module.print(what);
        Module.printErr(what);
        what = JSON.stringify(what);
    }
    else {
      what = '';
    }
    ABORT = true;
    EXITSTATUS = 1;
    var extra='';
    var output='abort('+what+') at '+stackTrace()+extra;
    if (abortDecorators) {
        abortDecorators.forEach(function(decorator) {
          output = decorator(output, what);
        });
    }
    throw output;
  }
  Module['abort'] = abort;
  if (Module['preInit']) {
      if (typeof Module['preInit']=='function')
        Module['preInit'] = [Module['preInit']];
      while (Module['preInit'].length>0) {
        Module['preInit'].pop()();
      }
  }
  var shouldRunNow=true;
  if (Module['noInitialRun']) {
      shouldRunNow = false;
  }
  Module["noExitRuntime"] = true;
  run();
}, '/dev/fairmotion/src/wasm/built_wasm.js');
