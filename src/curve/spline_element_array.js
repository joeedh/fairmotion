import {STRUCT} from '../core/struct.js';
import {SplineFlags, SplineTypes, CustomDataLayer,
        CustomData, CustomDataSet} from 'spline_types';

import {DataPathNode} from 'eventdag';

export var SplineLayerFlags = {
  //SELECT     : 1,
  HIDE       : 2,
  CAN_SELECT : 4,
  MASK       : 8
};

export class SplineLayer extends set {
  constructor(elements=undefined) {
    super(elements);
    
    this.id = -1;
    this.order = 0;
    this.flag = 0;
    
    this.name = "unnamed";
  }

  copyStructure() {
    let ret = new SplineLayer();

    ret.id = this.id;
    ret.order = this.order;
    ret.flag = this.flag;
    ret.name = "" + this.name;

    return ret;
  }

  add(e) {
    if (e == undefined) {
      console.trace("WARNING: e was undefined in SplineLayer.add");
      return;
    }
    
    super.add(e);
    e.layers[this.id] = 1;
  }
  
  remove(e) {
    super.remove(e);
    delete e.layers[this.id];
  }
  
  _to_EIDs() {
    var ret = [];
    
    for (var e of this) {
      ret.push(e.eid);
    }
    
    return ret;
  }
  
  static fromSTRUCT(reader) {
    var ret = new SplineLayer();
    
    reader(ret);
    
    return ret;
  }
  
  afterSTRUCT(spline) {
    if (this.eids === undefined)
      return;
    
    var corrupted = false;
    
    for (var eid of this.eids) {
      var e = spline.eidmap[eid];
      if (e === undefined) {
        corrupted = true;
        continue;
      }
      
      this.add(e);
    }
    
    if (corrupted) {
      console.trace("Warning: corrupted layerset!", this, spline, "<==");
    }
    
    delete this.eids;
  }
}

SplineLayer.STRUCT = `
SplineLayer {
  id    : int;
  order : int;
  flag  : int;
  eids  : array(int) | obj._to_EIDs();
  name  : string;
}
`;

export class SplineLayerSet extends Array {
  constructor() {
    super();
    
    this.active = undefined;
    this.namemap = {};
    this.idmap = {};
    this.idgen = new SDIDGen();
    
    this._active = undefined;
    
    this.flag = 0;
  }

  copyStructure() {
    let ret = new SplineLayerSet();

    ret.idgen = this.idgen.copy();
    ret.flag = this.flag;

    for (let layer of this) {
      let layer2 = layer.copyStructure();

      ret.namemap[layer2.name] = layer2;
      ret.idmap[layer2.id] = layer2;

      if (layer === this.active) {
        ret.active = layer2;
      }

      super.push.call(ret, layer2);
    }

    return ret;
  }

  rename(id, oldname, newname, validate=false) {
    let layer = this.idmap[id];

    if (layer === undefined) {
      console.warn("Unknown layer at id", id);
      return;
    }

    if (layer.name != old_name) {
      console.warn("old layer name doesn't match");
    }

    if (validate) {
      newname = this.validate_name(newname);
    }

    delete this.namemap[layer.name];
    layer.name = newname;
    this.namemap[newname] = layer;

    return true;
  }

  get(id) {
    if (id == undefined) {
      throw new Error("id cannot be undefined");
    }
    
    if (!(id in this.idmap)) {
      console.log("WARNING: layer ", id, "not in spline layerset!", this);
      return undefined;
    }
    
    return this.idmap[id];
  }
  
  get active() {
    if (this._active == undefined) {
      this._active = this[0];
    }
    
    return this._active;
  }
  
  set active(val) {
    this._active = val;
  }

  new_layer() {
    var ret = new SplineLayer();

    ret.name = this.new_name();
    ret.id = this.idgen.gen_id();
    
    this.push(ret);
      
    return ret;
  }
    
  new_name() {
    var name = "Layer", i = 1;
    
    while ((name + " " + i) in this.namemap) {
      i++;
    }
    
    return name + " " + i;
  }
  
  validate_name(name) {
    if (!(name in this.namemap))
      return name;

    var i = 1;
    
    while ((name + " " + i) in this.namemap) {
      i++;
    }

    return name + " " + i;
  }
  
  push(layer) {
    layer.name = this.validate_name(layer.name);
    
    this.namemap[layer.name] = layer;
    this.idmap[layer.id] = layer;
    
    super.push(layer);

    this.update_orders();
    
    if (this.active == undefined)
      this.active = layer;
  }
  
  insert(i, layer) {
    layer.name = this.validate_name(layer.name);
    
    this.namemap[layer.name] = layer;
    this.idmap[layer.id] = layer;
    
    super.insert(i, layer);

    this.update_orders();
  }
  
  change_layer_order(layer, new_i) {
    var start = this.indexOf(layer);
    
    if (start == undefined) {
      console.trace("Evil error in change_layer_order!", layer, new_i);
      return;
    }
    
    if (new_i == start) return;
    
    var min = Math.min(new_i, start), max = Math.max(new_i, start);
    var diff = max-min;
    
    let idx = start;
    
    if (start > new_i) {
      for (var i=0; i<diff; i++) {
        if (idx < 1) break;
        
        var t = this[idx];
        this[idx] = this[idx-1];
        this[idx-1] = t;
        idx--;
      }
    } else {
      for (var i=0; i<diff; i++) {
        if (idx >= this.length-1)
          break;
        
        var t = this[idx];
        this[idx] = this[idx+1];
        this[idx+1] = t;
        idx++;
      }
    }
    
    this.update_orders();
  }
  
  update_orders() {
    for (var i=0; i<this.length; i++) {
      this[i].order = i;
    }
  }

  _new_active(i) {
    if (this.length == 0) {
      console.log("WARNING: no layers left, adding a layer!");
      this.new_layer();
      return;
    }
    
    i = Math.min(Math.max(0, i), this.length-1);
    this.active = this[i];
  }
  
  remove(layer) {
    var i = this.indexOf(layer);
    
    super.remove(layer);

    delete this.namemap[layer.name];
    delete this.idmap[layer.id];
    
    if (layer == this.active)
      this._new_active(i);
      
    this.update_orders();
  }
  
  pop_i(i) {
    var layer = this[i];

    super.pop_i(i);
    
    delete this.namemap[layer.name];
    delete this.idmap[layer.id];

    if (layer == this.active)
      this._new_active(i);
      
    this.update_orders();
  }
  
  pop() {
    var layer = super.pop();
    
    delete this.namemap[layer.name];
    delete this.idmap[layer.id];
    
    if (layer == this.active)
      this._new_active(this.length-1);
  }
  
  static fromSTRUCT(reader) {
    var ret = new SplineLayerSet();
    reader(ret);
    
    for (var i=0; i<ret._layers.length; i++) {
      if (!ret._layers[i].name) {
        console.log("Layer name corruption detected");
        ret._layers[i].name = "Layer " + (i+1);
      }

      ret._layers[i].order = i;
      ret.push(ret._layers[i]);
    }
    
    ret.active = ret.idmap[ret.active];
    
    delete ret._layers;
    return ret;
  }
  
  afterSTRUCT(spline) {
    for (var layer of this) {
      layer.afterSTRUCT(spline);
    }
  }
}
SplineLayerSet.STRUCT = """
  SplineLayerSet {
    idgen  : SDIDGen;
    active : int | obj.active != undefined ? obj.active.id : -1;
    flag   : int;
    _layers : array(SplineLayer) | obj;
  }
"""

export class IterCache {
  constructor(callback, count=8) {
    this.stack = [];
    this.free = [];
    this.cache = [];
    this.callback = callback;
    
    for (var i=0; i<count; i++) {
      this.cache.push(callback());
      this.free.push(this.cache[this.cache.length-1]);
    }
  }
  
  push() {
    if (this.free.length == 0) {
      console.log("Error in IterCache!");
      return this.callback();
    }
    
    //detect done iterators
    for (var i=0; i<this.stack.length; i++) {
      var iter = this.stack[i];
      if (iter.is_done()) {
        this.stack.remove(iter);
        i--;
        
        this.free.push(iter);
      }
    }
    
    var iter = this.free.pop();
    this.stack.push(iter);
    return iter;
  }
  
  pop() {
    this.free.push(this.stack.pop());
  }
  
  static fromConstructor(cls, count) {
    return new IterCache(function() { return new cls(); }, count);
  }
}

export class EditableIter {
  constructor(list, layerset, all_layers) {
    this.init(list, layerset, all_layers);
  }

  init(list, layerset, all_layers) {
    this.list = list;
    this.layerset = layerset;
    this.all_layers = all_layers;
    this.i = 0;
    this.ret = {done : false, value : undefined};

    return this;
  }

  [Symbol.iterator]() {
    return this;
  }

  reset() {
    this.ret.done = false;
    this.ret.value = undefined;
    this.i = 0;

    return this;
  }

  next() {
    let actlayer = this.layerset.active.id;

    while (this.i < this.list.length) {
      let e = this.list[this.i];

      let ok = !e.hidden;
      ok = ok && (this.all_layers || actlayer in e.layers);

      if (ok)
          break;

      this.i++;
    }

    if (this.i >= this.list.length) {
      this.ret.done = true;
      this.ret.value = undefined;

      return this.ret;
    }

    this.i++;

    this.ret.done = false;
    this.ret.value = this.list[this.i - 1];

    return this.ret;
  }
}

export class SelectedEditableIter {
  constructor(selset, layerset) {
    this.ret = {done : false, value : undefined};
    this._c = 0;
    
    if (selset != undefined) {
      this.init(selset, layerset);
    }
  }
  
  [Symbol.iterator]() {
    return this;
  }
  
  reset() {
    return this.init(this.set, this.layerset);
  }
  
  init(selset, layerset) {
    this.set = selset;
    this.iter = undefined;
    this.ret.done = false;
    this.layerset = layerset;
    this._c = 0;
    
    return this;
  }
  
  is_done() {
    return this.iter == undefined;
  }
  
  next() {
    if (this.iter == undefined) {
      this.iter = this.set[Symbol.iterator]();
      this.ret.done = false;
    }
    
    if (this._c++ > 100000) {
      console.log("infinite loop detected 2!");
      this.ret.done = true;
      this.ret.value = undefined;
      return this.ret;
    }
    
    var actlayer = this.layerset.active.id;
    
    function visible(e) {
      return !e.hidden && actlayer in e.layers;
    }
    
    var ret = undefined;
    var good = false;
    var c = 0;
    var iter = this.iter;
    do {
      ret = iter.next();
      if (ret.done) break;
      
      var e = ret.value;
      
      good = visible(e);
      if (e.type == SplineTypes.HANDLE) {
        good = good || visible(e.owning_segment);
      }
      
      if (good) {
        this.ret.value = e;
        break;
      }
      
      ret = iter.next();
      if (c++ > 100000) {
        console.log("Infinite loop detected!!", ret, iter);
        break;
      }
    } while (!good);
    
    if (good == false) {
      this.ret.done = true;
      this.ret.value = undefined;
      this.iter = undefined;
    }
    
    return this.ret;
  }
}

export class SelectedEditableAllLayersIter {
  constructor(selset, layerset) {
    this.ret = {done : false, value : undefined};
    this._c = 0;

    if (selset != undefined) {
      this.init(selset, layerset);
    }
  }

  [Symbol.iterator]() {
    return this;
  }

  reset() {
    return this.init(this.set, this.layerset);
  }

  init(selset, layerset) {
    this.set = selset;
    this.iter = undefined;
    this.ret.done = false;
    this.layerset = layerset;
    this._c = 0;

    return this;
  }

  is_done() {
    return this.iter == undefined;
  }

  next() {
    if (this.iter == undefined) {
      this.iter = this.set[Symbol.iterator]();
      this.ret.done = false;
    }

    if (this._c++ > 100000) {
      console.log("infinite loop detected 2!");
      this.ret.done = true;
      this.ret.value = undefined;
      return this.ret;
    }

    var actlayer = this.layerset.active.id;

    function visible(e) {
      return !e.hidden;
    }

    ret = undefined;
    var good = false;
    var c = 0;
    var iter = this.iter;
    do {
      ret = iter.next();
      if (ret.done) break;

      var e = ret.value;

      good = visible(e);
      if (e.type == SplineTypes.HANDLE) {
        good = good || visible(e.owning_segment);
      }

      if (good) {
        this.ret.value = e;
        break;
      }

      ret = iter.next();
      if (c++ > 100000) {
        console.log("Infinite loop detected!!", ret, iter);
        break;
      }
    } while (!good);

    if (good == false) {
      this.ret.done = true;
      this.ret.value = undefined;
      this.iter = undefined;
    }

    return this.ret;
  }
}

//note: the global sline.selected list uses this too
export class ElementArraySet extends set {
  constructor(arg) {
    super(arg);
    
    this.layerset = undefined;
  }

  editable(ctx) {
    if (ctx === undefined) {
      console.warn("Missing ctx in editable() iterator!");
    }
    
    let ignore_layers = ctx !== undefined ? ctx.edit_all_layers : false;
    return ignore_layers ? new SelectedEditableAllLayersIter(this, this.layerset) : new SelectedEditableIter(this, this.layerset);
  }

  //get editable(ctx) {
  //  return new SelectedEditableIter(this, this.layerset);
  //}

  //SelectedEditableAllLayersIter
}

export class ElementArray extends GArray {
  constructor(type, idgen, idmap, global_sel, layerset, spline) {
    super();
    
    this.layerset = layerset;
    this.cdata = new CustomData(this); //this.on_layer_add.bind(this), this.on_layer_del.bind(this));
    
    this.type = type;
    this.spline = spline;
    this.idgen = idgen;
    this.idmap = idmap;
    this.local_idmap = {};
    this.global_sel = global_sel;
    
    this.on_select = undefined;
    this.select_listeners = new EventDispatcher("select");
    
    this.selected = new ElementArraySet();
    this.selected.layerset = layerset;

    this.active = undefined;
    this.highlight = undefined;

    //this._highlight = undefined;
  }

  /*
  get highlight() {
    return this._highlight;
  }

  set highlight(val) {
    console.trace("highlight set", val);
    this._highlight = val;
  }
  //*/

  editable(ctx) {
    if (ctx === undefined) {
      throw new Error("Missing ctx argument");
    }

    return new EditableIter(this, this.layerset, ctx.edit_all_layers);
  }

  dag_get_datapath() {
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
    
    //wells, it should end in. . .
    var suffix = "."+tname;
    
    //hrm, prefix should be either spline.ctx.frameset.drawspline, 
    //or spline.ctx.frameset.pathspline
    
    //test for presence of customdata time layer, I guess;
    
    var name = "drawspline";
    
    for (var i=0; i<this.cdata.layers.length; i++) {
      if (this.cdata.layers[i].name == "TimeDataLayer")
        name = "pathspline";
    }
    
    return "frameset." + name + suffix;
  }

  remove_undefineds() {
    for (var i=0; i<this.length; i++) {
      if (this[i] == undefined) {
        this.pop_i(this[i]);
        i--;
      }
    }
  }
  
  /*
    normally you wouldn't have a method like this
    however, in the future ElementArray will not be
    a simple array, and swapping elements by index
    will become a bit more complicated
  */
  swap(a, b) {
    if (a == undefined || b == undefined) {
      console.trace("Warning, undefined in ElementArray.swap(): a, b:", a, b);
      return;
    }
    
    var i1 = this.indexOf(a), i2 = this.indexOf(b);
    if (i1 < 0 || i2 < 0) {
      console.log(i1, i2, a, b);
      throw new Error("Elements not in list")
    }
    
    this[i2] = a;
    this[i1] = b;
  }
  
  //this is a customdata layer callbacks, not layer layer callbacks
  on_layer_add(layer, i) {
    for (var e of this) {
      e.cdata.on_add(layercls, i);
    }
  }
  
  //this is a customdata layer callbacks, not layer layer callbacks
  on_layer_del(layer, i) {
    for (var e of this) {
      e.cdata.on_del(layercls, i);
    }
  }
  
  push(e : SplineElement, custom_eid=undefined, add_to_layerset=true) {
    if (e.cdata === undefined || e.cdata.length !== this.cdata.layers.length) {
      e.cdata = this.cdata.gen_edata();
    }
    
    if (custom_eid === undefined) {
      e.eid = this.idgen.gen_id();
    } else {
      e.eid = custom_eid;
    }
    
    this.idmap[e.eid] = e;
    this.local_idmap[e.eid] = e;
    
    GArray.prototype.push.call(this, e);
    
    if (e.flag & SplineFlags.SELECT) {
      e.flag &= ~SplineFlags.SELECT;
      this.setselect(e, true);
    }

    if (add_to_layerset) {
      this.layerset.active.add(e);
      e.layers[this.layerset.active.id] = 1;
    }
  }
  
  remove(e : SplineElement, soft_error=false) {
    var idx = this.indexOf(e);
    
    if (idx < 0) {
      throw new Error("Element not in list");
    }
    
    if (this.active === e) {
      this.active = undefined;
    }
    
    if (this.selected.has(e))
      this.setselect(e, false);
    
    /*
    console.log(this.idmap);
    console.log(e);
    console.log(e.eid);
    //*/
    
    delete this.idmap[e.eid];    
    delete this.local_idmap[e.eid];
    
    //this.idgen.free_id(e.eid);
    
    //use swap removal method
    this[idx] = this[this.length-1];
    this.length--;
    
    //Array.prototype.remove.call(this, e, soft_error);
    
    //remove from all layer lists
    for (var k in e.layers) {
      var layer = this.layerset.idmap[k];
      
      if (layer != undefined) {
        layer.remove(e);
      } else {
        console.trace("Failed to find layer " + k + "!", e, this, this.layerset);
      }
    }
  }
  
  setselect(e : SplineElement, state : Boolean) {
    if (e.type != this.type) {
      console.trace("Warning: bad element fed to ElementArray! Got ", e.type, " but expected", this.type);
      return;
    }

    let selchange = 0;

    if (state && !(e.flag & SplineFlags.SELECT)) {
      this.dag_update("on_select_add", this.type);
      selchange = 1;
      
    } else if (!state && (e.flag & SplineFlags.SELECT)) {
      this.dag_update("on_select_sub", this.type);
      selchange = 1;
    }

    if (selchange) {
      this.dag_update("on_select_change", this.type);
    }

    var changed = !!(e.flag & SplineFlags.SELECT) != !!state;
    
    if (state) {
      if (this.active === undefined)
        this.active = e;
      
      this.global_sel.add(e);
      this.selected.add(e);
      
      e.flag |= SplineFlags.SELECT;
    } else {
      //NOTE: new behaviour, clear active on deselect!
      if (this.active === e) {
        this.active = undefined;
      }
      
      this.global_sel.remove(e);
      this.selected.remove(e);
        
      e.flag &= ~SplineFlags.SELECT;
    }
    
    if (changed && this.on_select !== undefined) {
      this.on_select(e, state);
      this.select_listeners.fire(e, state);
    }
  }
  
  clear_selection() {
    for (var i=0; i<this.length; i++) {
      this.setselect(this[i], false);
    }
  }
  
  select_all() {
    for (var i=0; i<this.length; i++) {
      this.setselect(this[i], true);
    }
  }
  
  static fromSTRUCT(reader) {
    var ret = new ElementArray();
    
    reader(ret);
    
    ret.cdata.owner = ret;
    
    var active = ret.active;
    ret.active = undefined;
    
    for (var i=0; i<ret.arr.length; i++) {
      GArray.prototype.push.call(ret, ret.arr[i]);
      
      if (ret.arr[i].eid == active) {
        ret.active = ret.arr[i];
      }
    }
    
    delete ret.arr;
    return ret;
  }
  
  afterSTRUCT(type, idgen, idmap, global_sel, layerset, spline) {
    this.type = type;
    this.idgen = idgen;
    this.idmap = idmap;
    this.global_sel = global_sel;
    this.local_idmap = {};
    this.layerset = layerset;
    this.spline = spline;
    
    var selected = new ElementArraySet();
    selected.layerset = layerset;
    
    for (var i=0; i<this.selected.length; i++) {
      var eid = this.selected[i];
      
      if (!(eid in idmap)) {
        console.log("WARNING: afterSTRUCT: eid", eid, "not in eidmap!", Object.keys(idmap));
        continue;
      }
      
      selected.add(idmap[this.selected[i]]);
    }
    
    this.selected = selected;
    
    //patch old files
    //console.log(this.cdata);
    
    for (var e of this) {
      this.local_idmap[e.eid] = e;
      
      if (e.cdata == undefined) {
        e.cdata = this.cdata.gen_edata();
      }
    }
    
    this.cdata.afterSTRUCT(this, this.cdata);
  }

  static nodedef() { return {
    inputs : {},
    outputs : {
      on_select_add : 0,  // passes type of elements this array stores
      on_select_sub : 0,  // passes type of elements this array stores
      on_select_change : 0
    }
  }}
}

mixin(ElementArray, DataPathNode);

ElementArray.STRUCT = """
  ElementArray {
    arr      : array(abstract(SplineElement)) | obj;
    selected : iter(e, int) | e.eid;
    active   : int | obj.active != undefined ? obj.active.eid : -1;
    cdata    : CustomData;
  }
"""