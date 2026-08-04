import {STRUCT, readSerialized} from '../core/struct.js';
import {SplineFlags, SplineTypes, CustomDataLayer,
        CustomData, CustomDataSet, SplineElement, SplineVertex} from './spline_types.js';
import type {LayerTypeClass} from './spline_base.js';

import {DataPathNode} from '../core/eventdag.js';

import type {Spline} from './spline.js';
import type {BaseContext} from '../core/context.js';

export let SplineLayerFlags = {
  //SELECT     : 1,
  HIDE       : 2,
  CAN_SELECT : 4,
  MASK       : 8
};

export class SplineLayer extends set<SplineElement> {
  static STRUCT : string;

  id : number;
  order : number
  flag : number
  name : string;
  /* Only present between loadSTRUCT()'s reader() call and afterSTRUCT(), which
     resolves the eids back to elements and deletes this. */
  eids? : number[];

  constructor(elements? : Iterable<SplineElement>) {
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

  add(e : SplineElement) {
    if (e == undefined) {
      console.trace("WARNING: e was undefined in SplineLayer.add");
      return;
    }

    super.add(e);
    e.layers[this.id] = 1;
  }

  remove(e : SplineElement) {
    let ret = super.remove(e);
    delete e.layers[this.id];

    return ret;
  }

  _to_EIDs() {
    let ret : number[] = [];

    for (let e of this) {
      ret.push(e.eid);
    }

    return ret;
  }

  loadSTRUCT(reader : StructReader<this>) {
    reader(this);
  }

  afterSTRUCT(spline : Spline) {
    if (this.eids === undefined)
      return;

    let corrupted = false;

    for (let eid of this.eids) {
      let e = spline.eidmap[eid];
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

export class SplineLayerSet extends Array<SplineLayer> {
  static STRUCT : string;

  namemap : {[name : string] : SplineLayer}
  idmap : {[id : number] : SplineLayer}
  idgen : SDIDGen
  flag : number;
  _active : SplineLayer | undefined;
  /* Only present between fromSTRUCT()'s reader() call and the delete at the
     bottom of it. */
  _layers? : SplineLayer[];

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

  /* NOTE: the mismatch check below read `old_name`, which is not bound
     anywhere -- rename() threw a ReferenceError before it renamed anything.
     Corrected to the parameter name, `oldname`. */
  rename(id : number, oldname : string, newname : string, validate = false) {
    let layer = this.idmap[id];

    if (layer === undefined) {
      console.warn("Unknown layer at id", id);
      return;
    }

    if (layer.name != oldname) {
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

  get(id : number) {
    if (id == undefined) {
      throw new Error("id cannot be undefined");
    }

    if (!(id in this.idmap)) {
      console.log("WARNING: layer ", id, "not in spline layerset!", this);
      return undefined;
    }

    return this.idmap[id];
  }

  get active() : SplineLayer {
    if (this._active == undefined) {
      this._active = this[0];
    }

    return this._active;
  }

  /* The setter accepts undefined -- the getter falls back to layer 0. */
  set active(val : SplineLayer | undefined) {
    this._active = val;
  }

  new_layer() {
    let ret = new SplineLayer();

    ret.name = this.new_name();
    ret.id = this.idgen.gen_id();

    this.push(ret);

    return ret;
  }

  new_name() {
    let name = "Layer", i = 1;

    while ((name + " " + i) in this.namemap) {
      i++;
    }

    return name + " " + i;
  }

  validate_name(name : string) {
    if (!(name in this.namemap))
      return name;

    let i = 1;

    while ((name + " " + i) in this.namemap) {
      i++;
    }

    return name + " " + i;
  }

  push(...layers : SplineLayer[]) : number {
    for (let layer of layers) {
      layer.name = this.validate_name(layer.name);

      this.namemap[layer.name] = layer;
      this.idmap[layer.id] = layer;

      super.push(layer);

      this.update_orders();

      if (this._active === undefined)
        this.active = layer;
    }

    return this.length;
  }

  insert(i : number, layer : SplineLayer) : this {
    layer.name = this.validate_name(layer.name);

    this.namemap[layer.name] = layer;
    this.idmap[layer.id] = layer;

    super.insert(i, layer);

    this.update_orders();

    return this;
  }

  change_layer_order(layer : SplineLayer, new_i : number) {
    let start = this.indexOf(layer);

    if (start == undefined) {
      console.trace("Evil error in change_layer_order!", layer, new_i);
      return;
    }

    if (new_i == start) return;

    let min = Math.min(new_i, start), max = Math.max(new_i, start);
    let diff = max-min;

    let idx = start;

    if (start > new_i) {
      for (let i=0; i<diff; i++) {
        if (idx < 1) break;

        let t = this[idx];
        this[idx] = this[idx-1];
        this[idx-1] = t;
        idx--;
      }
    } else {
      for (let i=0; i<diff; i++) {
        if (idx >= this.length-1)
          break;

        let t = this[idx];
        this[idx] = this[idx+1];
        this[idx+1] = t;
        idx++;
      }
    }

    this.update_orders();
  }

  update_orders() {
    for (let i=0; i<this.length; i++) {
      this[i].order = i;
    }
  }

  _new_active(i : number) {
    if (this.length == 0) {
      console.log("WARNING: no layers left, adding a layer!");
      this.new_layer();
      return;
    }

    i = Math.min(Math.max(0, i), this.length-1);
    this.active = this[i];
  }

  remove(layer : SplineLayer) {
    let i = this.indexOf(layer);

    super.remove(layer);

    delete this.namemap[layer.name];
    delete this.idmap[layer.id];

    if (layer == this.active)
      this._new_active(i);

    this.update_orders();
  }

  pop_i(i : number) {
    let layer = this[i];

    super.pop_i(i);

    delete this.namemap[layer.name];
    delete this.idmap[layer.id];

    if (layer == this.active)
      this._new_active(i);

    this.update_orders();
  }

  pop() : SplineLayer | undefined {
    let layer = super.pop();

    if (layer === undefined) {
      return undefined;
    }

    delete this.namemap[layer.name];
    delete this.idmap[layer.id];

    if (layer == this.active)
      this._new_active(this.length-1);

    return layer;
  }

  static fromSTRUCT(reader : StructReader<SplineLayerSet>) {
    let ret = new SplineLayerSet();
    reader(ret);

    let layers = ret._layers !== undefined ? ret._layers : [];

    for (let i=0; i<layers.length; i++) {
      if (!layers[i].name) {
        console.log("Layer name corruption detected");
        layers[i].name = "Layer " + (i+1);
      }

      layers[i].order = i;
      ret.push(layers[i]);
    }

    /* `active` is serialised as a layer id, so what reader() left on `_active`
       is an int; this line swaps it back for the layer it names. */
    const activeId = readSerialized<number>(ret, "active");
    ret.active = ret.idmap[activeId];

    delete ret._layers;
    return ret;
  }

  afterSTRUCT(spline : Spline) {
    for (let layer of this) {
      layer.afterSTRUCT(spline);
    }
  }
}
SplineLayerSet.STRUCT = `
  SplineLayerSet {
    idgen  : SDIDGen;
    active : int | obj.active != undefined ? obj.active.id : -1;
    flag   : int;
    _layers : array(SplineLayer) | obj;
  }
`

/* What IterCache needs of the iterators it pools: a way to tell whether one
   has run to completion and can be recycled. */
export interface CachedIter {
  is_done() : boolean;
}

export class IterCache<T extends CachedIter> {
  /* Handed out and not yet recycled. */
  stack : T[];
  free : T[];
  /* Every iterator this cache owns, in creation order. */
  cache : T[];
  callback : () => T;

  constructor(callback : () => T, count = 8) {
    this.stack = [];
    this.free = [];
    this.cache = [];
    this.callback = callback;

    for (let i=0; i<count; i++) {
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
    for (let i=0; i<this.stack.length; i++) {
      let iter = this.stack[i];
      if (iter.is_done()) {
        this.stack.remove(iter);
        i--;

        this.free.push(iter);
      }
    }

    let iter = this.free.pop();

    if (iter === undefined) {
      return this.callback();
    }

    this.stack.push(iter);
    return iter;
  }

  pop() {
    let iter = this.stack.pop();

    if (iter !== undefined) {
      this.free.push(iter);
    }
  }

  static fromConstructor<T extends CachedIter>(cls : new () => T, count : number) {
    return new IterCache<T>(function() { return new cls(); }, count);
  }
}

export class EditableIter<T extends SplineElement> {
  list! : ElementArray<T>;
  all_layers! : boolean;
  layerset! : SplineLayerSet;
  /* Index of the next candidate in `list`. */
  i! : number;
  /* Reused across next() calls, so callers must not hold onto it. IterRet
     declares `value : T` so `for..of` over this iterator yields T; the value is
     only ever undefined on the step that also sets done. */
  ret! : IterRet<T>;

  constructor(list : ElementArray<T>, layerset : SplineLayerSet, all_layers : boolean) {
    this.init(list, layerset, all_layers);
  }

  init(list : ElementArray<T>, layerset : SplineLayerSet, all_layers : boolean) {
    this.list = list;
    this.layerset = layerset;
    this.all_layers = all_layers;
    this.i = 0;
    this.ret = new IterRet<T>();

    return this;
  }

  [Symbol.iterator]() {
    return this;
  }

  reset() {
    this.ret.done = false;
    this.ret.clear();
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
      this.ret.clear();

      return this.ret;
    }

    this.i++;

    this.ret.done = false;
    this.ret.value = this.list[this.i - 1];

    return this.ret;
  }
}

export class SelectedEditableIter<T extends SplineElement = SplineElement> {
  /* Reused across next() calls, so callers must not hold onto it. IterRet
     declares `value : T` so `for..of` over this iterator yields T. */
  ret : IterRet<T>
  /* Runaway guard; next() bails once this passes 100000. */
  _c : number;
  set! : ElementArraySet<T>;
  layerset! : SplineLayerSet;
  /* undefined until the first next(), and again once the walk is done. */
  iter : Iterator<T> | undefined;

  constructor(selset? : ElementArraySet<T>, layerset? : SplineLayerSet) {
    this.ret = new IterRet<T>();
    this._c = 0;

    if (selset !== undefined && layerset !== undefined) {
      this.init(selset, layerset);
    }
  }

  [Symbol.iterator]() {
    return this;
  }

  reset() {
    return this.init(this.set, this.layerset);
  }

  init(selset : ElementArraySet<T>, layerset : SplineLayerSet) {
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
      this.ret.clear();
      return this.ret;
    }

    let actlayer = this.layerset.active.id;

    function visible(e : SplineElement) {
      return !e.hidden && actlayer in e.layers;
    }

    let ret = undefined;
    let good = false;
    let c = 0;
    let iter = this.iter;
    do {
      ret = iter.next();
      if (ret.done) break;

      let e = ret.value;

      good = visible(e);
      if (e instanceof SplineVertex && e.type == SplineTypes.HANDLE) {
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
      this.ret.clear();
      this.iter = undefined;
    }

    return this.ret;
  }
}

export class SelectedEditableAllLayersIter<T extends SplineElement = SplineElement> {
  /* Reused across next() calls, so callers must not hold onto it. IterRet
     declares `value : T` so `for..of` over this iterator yields T. */
  ret : IterRet<T>
  /* Runaway guard; next() bails once this passes 100000. */
  _c : number;
  set! : ElementArraySet<T>;
  layerset! : SplineLayerSet;
  /* undefined until the first next(), and again once the walk is done. */
  iter : Iterator<T> | undefined;

  constructor(selset? : ElementArraySet<T>, layerset? : SplineLayerSet) {
    this.ret = new IterRet<T>();
    this._c = 0;

    if (selset !== undefined && layerset !== undefined) {
      this.init(selset, layerset);
    }
  }

  [Symbol.iterator]() {
    return this;
  }

  reset() {
    return this.init(this.set, this.layerset);
  }

  init(selset : ElementArraySet<T>, layerset : SplineLayerSet) {
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
      this.ret.clear();
      return this.ret;
    }

    /* Read to keep the two iterators in step; this one ignores layers. */
    let actlayer = this.layerset.active.id;

    function visible(e : SplineElement) {
      return !e.hidden;
    }

    let ret = undefined;
    let good = false;
    let c = 0;
    let iter = this.iter;
    do {
      ret = iter.next();
      if (ret.done) break;

      let e = ret.value;

      good = visible(e);
      if (e instanceof SplineVertex && e.type == SplineTypes.HANDLE) {
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

    if (good === false) {
      this.ret.done = true;
      this.ret.clear();
      this.iter = undefined;
    }

    return this.ret;
  }
}

//note: the global sline.selected list uses this too
export class ElementArraySet<T extends SplineElement> extends set<T> {
  /* Left undefined by the constructor; ElementArray fills it in right after. */
  layerset : SplineLayerSet | undefined;

  constructor(arg? : Iterable<T> | ArrayLike<T>) {
    super(arg);

    this.layerset = undefined;
  }

  editable(ctx : BaseContext) {
    if (ctx === undefined) {
      console.warn("Missing ctx in editable() iterator!");
    }

    const layerset = this.layerset;
    if (layerset === undefined) {
      throw new Error("ElementArraySet.layerset was never filled in");
    }

    let ignore_layers = ctx !== undefined ? ctx.edit_all_layers : false;
    return ignore_layers ? new SelectedEditableAllLayersIter<T>(this, layerset) : new SelectedEditableIter<T>(this, layerset);
  }

  //get editable(ctx) {
  //  return new SelectedEditableIter(this, this.layerset);
  //}

  //SelectedEditableAllLayersIter
}

export class ElementArray<T extends SplineElement> extends Array<T> {
  static STRUCT : string;

  cdata : CustomData
  /* eid -> element, for this array only; `idmap` is the spline-wide one every
     ElementArray shares. */
  local_idmap : {[eid : number] : T}
  select_listeners : EventDispatcher
  selected : ElementArraySet<T>
  /* Definite-assigned: fromSTRUCT() builds an unwired instance and
     afterSTRUCT() supplies this along with the other constructor arguments. */
  spline! : Spline
  active : T | undefined
  highlight : T | undefined
  layerset : SplineLayerSet;
  /* One of SplineTypes; every element in here carries the same value. */
  type : number;
  idgen : SDIDGen;
  idmap : {[eid : number] : SplineElement};
  /* The spline-wide selection, shared with the other ElementArrays. */
  global_sel : set<SplineElement>;
  on_select : ((e : T, state : boolean) => void) | undefined;
  /* Only present between fromSTRUCT()'s reader() call and the delete at the
     bottom of it. */
  arr? : T[];

  /* Patched in by the mixin() call at the bottom of this file. */
  declare dag_update : (name : string, data? : number) => void;

  /* Every argument is optional for fromSTRUCT()'s benefit; afterSTRUCT()
     overwrites all six on that path. */
  constructor(type : number = -1, idgen : SDIDGen = new SDIDGen(),
              idmap : {[eid : number] : SplineElement} = {},
              global_sel : set<SplineElement> = new set<SplineElement>(),
              layerset : SplineLayerSet = new SplineLayerSet(),
              spline? : Spline) {
    super();

    if (spline !== undefined) {
      this.spline = spline;
    }

    this.layerset = layerset;
    this.cdata = new CustomData(this); //this.on_layer_add.bind(this), this.on_layer_del.bind(this));

    this.type = type;
    this.idgen = idgen;
    this.idmap = idmap;
    this.local_idmap = {};
    this.global_sel = global_sel;

    this.on_select = undefined;
    this.select_listeners = new EventDispatcher("select");

    this.selected = new ElementArraySet<T>();
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

  editable(ctx : BaseContext) : EditableIter<T> {
    if (ctx === undefined) {
      throw new Error("Missing ctx argument");
    }

    return new EditableIter<T>(this, this.layerset, ctx.edit_all_layers === true);
  }

  get visible() {
    let this2 = this;

    return (function*() {
      let layerset = this2.layerset;

      for (let e of this2) {
        let bad = e.flag & (SplineFlags.HIDE | SplineFlags.NO_RENDER);
        let ok = false;
        let found = false;

        for (let k in e.layers) {
          found = true;

          let l = layerset.idmap[k];
          if (!(l.flag & SplineLayerFlags.HIDE)) {
            ok = true;
          }
        }

        if (ok || !found) {
          yield e;
        }
      }
    })();
  }


  dag_get_datapath() {
    let tname : string | undefined;
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
    let suffix = "."+tname;

    //hrm, prefix should be either spline.ctx.frameset.drawspline,
    //or spline.ctx.frameset.pathspline

    //test for presence of customdata time layer, I guess;

    let name = "drawspline";

    for (let i=0; i<this.cdata.layers.length; i++) {
      if (this.cdata.layers[i].name === "TimeDataLayer")
        name = "pathspline";
    }

    return "frameset." + name + suffix;
  }

  /* NOTE: this passed `this[i]` -- undefined by construction here -- where
     pop_i() wants an index, so the element was never dropped and the `i--`
     spun forever. Corrected to the index. */
  remove_undefineds() {
    for (let i=0; i<this.length; i++) {
      if (this[i] == undefined) {
        this.pop_i(i);
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
  swap(a : T, b : T) {
    if (a == undefined || b == undefined) {
      console.trace("Warning, undefined in ElementArray.swap(): a, b:", a, b);
      return;
    }

    let i1 = this.indexOf(a), i2 = this.indexOf(b);
    if (i1 < 0 || i2 < 0) {
      console.log(i1, i2, a, b);
      throw new Error("Elements not in list")
    }

    this[i2] = a;
    this[i1] = b;
  }

  /* NOTE: both bodies below read `layercls`, which is not bound anywhere --
     the parameter is `layer`. Neither is wired up (the CustomData constructor
     call that would pass them is commented out), so neither ever ran; corrected
     to the parameter name. */
  //this is a customdata layer callbacks, not layer layer callbacks
  on_layer_add(layer : LayerTypeClass, i : number, shared : object) {
    for (let e of this) {
      e.cdata.on_add(layer, i, shared);
    }
  }

  //this is a customdata layer callbacks, not layer layer callbacks
  on_layer_del(layer : LayerTypeClass, i : number) {
    for (let e of this) {
      e.cdata.on_del(layer, i);
    }
  }

  /* push() has to keep Array's signature, so the two extra arguments live on
     pushElement(); plain push(e) still routes through it. */
  push(...items : T[]) : number {
    for (let e of items) {
      this.pushElement(e);
    }

    return this.length;
  }

  pushElement(e : T, custom_eid? : number, add_to_layerset : boolean = true) {
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

  onDestroy() {
    for (let e of this) {
      e.onDestroy();
    }
  }

  remove(e : T, soft_error=false) {
    e.onDestroy();

    let idx = this.indexOf(e);

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
    for (let k in e.layers) {
      let layer = this.layerset.idmap[k];

      if (layer != undefined) {
        layer.remove(e);
      } else {
        console.trace("Failed to find layer " + k + "!", e, this, this.layerset);
      }
    }
  }

  setselect(e : T, state : boolean) {
    if (e.type !== this.type) {
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

    let changed = !!(e.flag & SplineFlags.SELECT) != !!state;

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
    for (let i=0; i<this.length; i++) {
      this.setselect(this[i], false);
    }
  }

  select_all() {
    for (let i=0; i<this.length; i++) {
      this.setselect(this[i], true);
    }
  }

  static fromSTRUCT(reader : StructReader<ElementArray<SplineElement>>) {
    let ret = new ElementArray();

    reader(ret);

    ret.cdata.owner = ret;

    /* `active` is serialised as an eid (see the STRUCT below); the loop below
       swaps it for the element it names. */
    const active = readSerialized<number>(ret, "active");
    ret.active = undefined;

    const arr = ret.arr !== undefined ? ret.arr : [];

    for (let i=0; i<arr.length; i++) {
      GArray.prototype.push.call(ret, arr[i]);

      if (arr[i].eid == active) {
        ret.active = arr[i];
      }
    }

    delete ret.arr;
    return ret;
  }

  afterSTRUCT(type : number, idgen : SDIDGen,
              idmap : {[eid : number] : SplineElement},
              global_sel : set<SplineElement>, layerset : SplineLayerSet,
              spline : Spline) {
    this.type = type;
    this.idgen = idgen;
    this.idmap = idmap;
    this.global_sel = global_sel;
    this.local_idmap = {};
    this.layerset = layerset;
    this.spline = spline;

    let selected = new ElementArraySet<T>();
    selected.layerset = layerset;

    /* reader() leaves the serialised eids in `selected`; they become real
       elements here. */
    const sel_eids = readSerialized<number[]>(this, "selected");

    for (let i=0; i<sel_eids.length; i++) {
      let eid = sel_eids[i];

      if (!(eid in idmap)) {
        console.log("WARNING: afterSTRUCT: eid", eid, "not in eidmap!", Object.keys(idmap));
        continue;
      }

      selected.add(idmap[eid] as T);
    }

    this.selected = selected;

    //patch old files
    //console.log(this.cdata);

    for (let e of this) {
      this.local_idmap[e.eid] = e;

      if (e.cdata === undefined) {
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

ElementArray.STRUCT = `
  ElementArray {
    arr      : array(abstract(SplineElement)) | obj;
    selected : iter(e, int) | e.eid;
    active   : int | obj.active != undefined ? obj.active.eid : -1;
    cdata    : CustomData;
  }
`