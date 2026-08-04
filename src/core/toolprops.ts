"use strict";

import {nstructjs} from '../path.ux/scripts/pathux.js';
import {pack_int, pack_float, pack_static_string} from './ajax.js';
import {setPropTypes, ToolProperty, FlagProperty, PropFlags} from '../path.ux/scripts/toolsys/toolprop.js';
import * as toolprop from '../path.ux/scripts/toolsys/toolprop.js';
import type {FullContext} from './context.js';

export {
  StringProperty, StringSetProperty, Vec2Property, Vec3Property, Vec4Property,
  Mat4Property, IntProperty, FloatProperty, BoolProperty, FlagProperty, EnumProperty,
  ListProperty, PropClasses, ToolProperty
} from '../path.ux/scripts/path-controller/toolsys/toolprop.js';

/* DataRef is used as a value (instanceof, new) and previously resolved only
   because lib_api.ts publishes it on window. */
import {DataBlock, DataRef} from './lib_api.js';
import type {DataBlockClass} from './lib_api.js';
/* Matrix4UI was used as a value below without ever being imported, and unlike
   DataRef it is not published on window. mathlib does not import this file back,
   so a real import is safe. */
import {Matrix4UI} from '../util/mathlib.js';
/* Type-only. DataRefList has the same missing-import bug, but lib_utils pulls in
   the editor event stack, so importing it for real would cycle. */
import type {DataRefList} from './lib_utils.js';

export let PropTypes = {
  INT        : 1,
  STRING     : 2,
  BOOL       : 4,
  ENUM       : 8,
  FLAG       : 16,
  FLOAT      : 32,
  VEC2       : 64,
  VEC3       : 128,
  VEC4       : 256,
  MATRIX4    : 512,
  QUAT       : 1024,
  PROPLIST   : 4096,
  STRSET     : 1<<13,
  CURVE      : 1<<14,
  STRUCT     : 1<<19, //internal type to data api
  DATAREF    : 1<<20,
  DATAREFLIST: 1<<21,
  TRANSFORM  : 1<<22, //ui-friendly matrix property
  COLLECTION : 1<<23,
  IMAGE      : 1<<24, //this is only a subtype, used with DataRefProperty
  ARRAYBUFFER: 1<<25,
  ITER       : 1<<28,
  INTARRAY   : 1<<29
};

setPropTypes(PropTypes);

/*
export let TPropFlags = {
  PRIVATE          : 2,
  LABEL            : 4,
  COLL_LOOSE_TYPE  : 8,
  UNDO_SIMPLE      : 32, //use simple undo implementation
  USE_ICONS        : 64,
  USE_CUSTOM_GETSET: 128,
  SAVE_LAST_VALUE  : 256,

  NEEDS_OWNING_OBJECT: 1<<13, //used by user_get_data, property needs 'this'
  NO_DEFAULT         : 1<<17,
};*/

let flagbase = 25;
export const TPropFlags = Object.assign({
  COLL_LOOSE_TYPE    : 1<<(flagbase++),
  NEEDS_OWNING_OBJECT: 1<<(flagbase++),
}, PropFlags);

export const PropSubTypes = {
  COLOR: 1
};

/*
 * Everything from here to isTypedArray() patches path.ux's ToolProperty in
 * place: the old fairmotion property API layered on top of the toolkit's. `this`
 * is typed per-function rather than by declaration-merging ToolProperty, because
 * path.ux subclasses declare some of these names themselves.
 */

/* The three deprecated aliases. `d` is whatever the property's value type is,
   so it is left to inference rather than pinned here. */
ToolProperty.prototype.set_data = function <T>(this: ToolProperty<T>, d: T) {
  console.warn("deprectaed ToolProperty.prototype.set_data called!");
  return this.setValue(d);
};
ToolProperty.prototype.get_data = function <T>(this: ToolProperty<T>): T {
  console.warn("deprectaed ToolProperty.prototype.get_data called!");
  return this.getValue();
};
ToolProperty.prototype.get_value = function <T>(this: ToolProperty<T>): T {
  console.warn("deprectaed ToolProperty.prototype.get_value called!");
  return this.getValue();
};

ToolProperty.prototype.report = function (this: ToolProperty) {
  let s = "";
  for (let a of arguments) {
    s += a + " ";
  }

  if (typeof g_app_state === "undefined" || !g_app_state.notes) {
    console.warn(...arguments);
    return;
  }

  g_app_state.notes.label(s);
}

let propfire = ToolProperty.prototype._fire;

ToolProperty.prototype._fire = function (this: ToolProperty) {
  propfire.apply(this, arguments);

  if (this.update) {
    this.update(this.dataref);
  }

  if (this.api_update) {
    this.api_update(this.dataref);
  }
};

/* Copies only the presentation half of a property definition. Deliberately not
   symmetric with copyTo(), which copies the value too. */
ToolProperty.prototype.load_ui_data = function (this: ToolProperty, prop: ToolProperty) {
  this.uiname = prop.uiname;
  this.apiname = prop.apiname;
  this.description = prop.description;
  this.unit = prop.unit;
  this.hotkey_ref = prop.hotkey_ref;
  this.range = prop.range;
  this.uiRange = prop.uiRange;
  this.icon = prop.icon;
  this.radix = prop.radix;
  this.decimalPlaces = prop.declarations;
  this.step = prop.step;
  this.stepIsRelative = prop.stepIsRelative;
  this.expRate = prop.expRate;
};

/* Predates path.ux's own dispatcher: it expects .callbacks to be an array of
   [owner, fn] pairs, which it no longer is. See docs/debugging.md. */
ToolProperty.prototype._exec_listeners = function (this: ToolProperty, data_api_owner: object) {
  for (let l of this.callbacks) {
    if (RELEASE) {
      try {
        l[1](l[0], this, data_api_owner);
      } catch (_err) {
        print_stack(_err);
        console.log("Warning: a property event listener failed", "property:", this, "callback:", l[1], "owner:", l[0])
      }
    } else {
      l[1](l[0], this, data_api_owner);
    }
  }
};
//only one callback per owner allowed
//any existing callback will be overwritten
ToolProperty.prototype.add_listener = function add_listener(
  this: ToolProperty,
  owner: object,
  callback: (...args: unknown[]) => void
) {
  let cb: {(): void; owner?: object} = () => {
    callback(...arguments);
  };

  for (let cb of this.callbacks['change']) {
    if (cb.owner === owner) {
      console.warn("owner already added a callback");
      return;
    }
  }

  this.on('change', cb);
  cb.owner = owner;
}

ToolProperty.prototype.remove_listener = function (this: ToolProperty, owner: object, silent_fail = false) {
  for (let cb of this.callbacks['change']) {
    if (cb.owner === owner) {
      this.off('change', cb);
    }
  }
}

/* Icons are stored twice, under the flag's name and under its numeric value, so
   lookups work whichever form the caller has. */
FlagProperty.prototype.addIcons = function (this: FlagProperty, iconmap: {[key: string]: int}) {
  this.iconmap = {};

  for (let k in iconmap) {
    this.iconmap[k] = iconmap[k];

    if (k in this.values) {
      this.iconmap[this.values[k]] = iconmap[k];
    }
  }
}

ToolProperty.prototype.add_icons = function (this: FlagProperty, iconmap: {[key: string]: int}) {
  return this.addIcons(iconmap);
}


/**
 custom data api setter.  set .flag to TPRopFlags.USE_CUSTOM_GETSET
 to enable.

 this will be assigned to
 owning object by data api if prop.flag has TPropFlags.NEEDS_OWNING_OBJECT.

 prop is property definition.  val is value to set.

 returns final value that was set.
 */
ToolProperty.prototype.userSetData = function <T>(this: ToolProperty<T>, prop: ToolProperty<T>, val: T): T {
  return val;
};

/**
 custom data api getter.  set .flag to TPRopFlags.USE_CUSTOM_GETSET
 to enable.

 this will be assigned to
 owning object by data api if prop.flag has TPropFlags.NEEDS_OWNING_OBJECT.

 prop is property definition.  val is current value fetched by the data api.
 */
ToolProperty.prototype.userGetData = function <T>(this: ToolProperty<T>, prop: ToolProperty<T>, val: T): T {
  return val;
};

/* path.ux's copyTo() does not know about the two custom get/set hooks, so carry
   them across here. */
let _copyTo = ToolProperty.prototype.copyTo;
ToolProperty.prototype.copyTo = function (this: ToolProperty, b: ToolProperty) {
  _copyTo.call(this, b);
  b.userSetData = this.userSetData;
  b.userGetData = this.userGetData;
  return this;
}
ToolProperty.prototype.update = () => {
};
ToolProperty.prototype.api_update = () => {
};

/*
 * The slice of EnumProperty/FlagProperty the patches below touch. Written out
 * locally rather than merged into path.ux's declarations, since ui_key_names is
 * added here and does not exist on the toolkit's own classes.
 */
interface EnumOrFlagProperty {
  keys: {[key: string]: int};
  ui_value_names: {[uiName: string]: string};
  ui_key_names: {[key: string]: string};
  _ui_key_names?: {[key: string]: string};
}

for (let i = 0; i < 2; i++) {
  let key = i ? "FlagProperty" : "EnumProperty";

  /* Note that `uinames` is ignored: the names are always derived from .keys.
     See docs/debugging.md. */
  toolprop[key].prototype.setUINames = function (this: EnumOrFlagProperty, uinames: {[key: string]: string}) {
    this.ui_value_names = {};
    this.ui_key_names = {};

    for (let k in this.keys) {
      let key = k[0].toUpperCase() + k.slice(1, k.length).toLowerCase();
      key = key.replace(/_/g, " ").replace(/-/g, " ");

      this.ui_value_names[key] = k;
      this.ui_key_names[k] = key;
    }
  };

  Object.defineProperty(toolprop[key].prototype, "ui_key_names", {
    get(this: EnumOrFlagProperty) {
      if (!Object.hasOwnProperty(this, "_ui_key_names")) {
        this._ui_key_names = {};

        for (let k in this.ui_value_names) {
          this._ui_key_names[this.ui_value_names[k]] = k;
        }
      }

      return this._ui_key_names;
    },

    set(this: EnumOrFlagProperty, val: {[key: string]: string}) {
      this._ui_key_names = val;
    }
  });
}

type TypedArray =
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array;

function isTypedArray(n: object): n is TypedArray {
  if (!n || typeof n !== "object") {
    return false;
  }

  return (n instanceof Int8Array || n instanceof Uint8Array ||
    n instanceof Uint8ClampedArray || n instanceof Int16Array ||
    n instanceof Uint16Array || n instanceof Int32Array || n instanceof Uint32Array ||
    n instanceof Float32Array || n instanceof Float64Array);

}

/* Raw bytes. Anything array-shaped is accepted and normalized to a Uint8Array on
   the way in; loadSTRUCT leaves an ArrayBuffer behind, hence the union. */
export type ArrayBufferPropertyValue = ArrayBuffer | TypedArray | number[];

export class ArrayBufferProperty extends ToolProperty<ArrayBufferPropertyValue> {
  static STRUCT: string;

  data: Uint8Array | ArrayBuffer;

  constructor(
    data?: ArrayBufferPropertyValue,
    apiname = "",
    uiname = apiname,
    description = "",
    flag = 0
  ) {
    super(PropTypes.ARRAYBUFFER, apiname, uiname, description, flag);

    this.flag |= TPropFlags.NO_DEFAULT;

    if (data !== undefined) {
      this.setValue(data);
    }
  }

  setValue(d: ArrayBufferPropertyValue) {
    /* Detect undefined */
    if (d.constructor.name === "ArrayBuffer") {
      d = new Uint8Array(d, 0, d.byteLength);
    } else if (isTypedArray(d)) {
      d = d.buffer;
      d = new Uint8Array(d, 0, d.byteLength);
    } else if (Array.isArray(d)) {
      d = new Uint8Array(d);
    }

    this.data = d;
  }

  getValue() {
    return this.data;
  }

  copyTo(dst: ArrayBufferProperty) {
    super.copyTo(dst, false);

    if (this.data !== undefined)
      dst.setValue(this.data);

    return dst;
  }

  copy(): ArrayBufferProperty {
    return this.copyTo(new ArrayBufferProperty());
  }

  _getDataU8() {
    return this.data instanceof ArrayBuffer ? new Uint8Array(this.data) : this.data;
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
    super.loadSTRUCT(reader);

    this.data = new Uint8Array(this.data).buffer;
  }
}

ArrayBufferProperty.STRUCT = nstructjs.inherit(ArrayBufferProperty, ToolProperty) + `
  data : array(byte) | this._getDataU8;
}`;

nstructjs.register(ArrayBufferProperty);
ToolProperty.register(ArrayBufferProperty);

export class IntArrayProperty extends ToolProperty<int[]> {
  static STRUCT: string;

  data: int[];

  /* The `undefined` in the super() call is a leftover extra argument: it shifts
     apiname into uiname and so on. See docs/debugging.md. */
  constructor(
    data?: Iterable<int>,
    apiname?: string,
    uiname?: string,
    description?: string,
    flag?: int
  ) {
    super(PropTypes.INTARRAY, undefined, apiname, uiname, description, flag);

    this.data = [];

    if (data) {
      for (let item of data) {
        this.data.push(item);
      }
    }
  }

  [Symbol.iterator]() {
    return this.data[Symbol.iterator]();
  }

  getValue() {
    return this.data;
  }

  /* Truncates to integers and drops NaNs rather than storing them. */
  setValue(array: Iterable<number>) {
    let data = this.data;

    super.setValue(array);

    this.data = data;
    this.data.length = 0;

    for (let item of array) {
      let old = item;

      item = ~~item;
      if (isNaN(item)) {
        console.warn("NaN warning! bad item", old, "!");
        continue;
      }

      this.data.push(item);
    }

    return this;
  }

  copyTo(b: IntArrayProperty) {
    super.copyTo(b);
    b.data = this.data.concat([]);
  }

  copy(): IntArrayProperty {
    let ret = new IntArrayProperty();
    this.copyTo(ret);

    return ret;
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
  }
}

IntArrayProperty.STRUCT = nstructjs.inherit(IntArrayProperty, ToolProperty) + `
  data : array(int);
}`;

/* A datablock type, spelled either as its integer lib_type or as the class
   itself. The constructors below normalize the class form to the integer. */
export type DataTypeSpec = int | DataBlockClass;

export class DataRefProperty extends ToolProperty<DataRef | undefined> {
  static STRUCT: string;

  types: set<int>;
  data?: DataRef;

  //allowed_types can be either a datablock type,
  //or a set of allowed datablock types.
  constructor(
    value?: DataBlock | DataRef,
    allowed_types?: set<DataTypeSpec> | DataTypeSpec[] | DataTypeSpec,
    apiname?: string,
    uiname?: string,
    description?: string,
    flag?: int
  ) {
    super(PropTypes.DATAREF, apiname, uiname, description, flag);

    if (allowed_types === undefined)
      allowed_types = new set();

    if (!(allowed_types instanceof set)) {
      if (allowed_types instanceof Array)
        allowed_types = new set(allowed_types);
      else
        allowed_types = new set([allowed_types]);
    }

    this.types = new set();

    /* ensure this.types stores integer type ids, not type classes */
    for (let val of allowed_types) {
      if (typeof val === "object") {
        val = new val().lib_type;
      }

      this.types.add(val);
    }

    if (value !== undefined)
      this.setValue(value);
  }

  get_block(ctx: FullContext): DataBlock | undefined {
    if (this.data === undefined)
      return undefined;
    else
      return ctx.datalib.get(this.data);
  }

  copyTo(dst: DataRefProperty) {
    super.copyTo(dst, false);

    let data = this.data;

    if (data !== undefined)
      data = data.copy();

    dst.types = new set(this.types);

    if (data !== undefined)
      dst.setValue(data);

    return dst;
  }

  copy(): DataRefProperty {
    return this.copyTo(new DataRefProperty());
  }

  set_data(value?: DataBlock | DataRef, owner?: object, changed?: boolean, set_data?: boolean) {
    if (value === undefined) {
      ToolProperty.prototype.setValue.call(this, undefined, owner, changed, set_data);
    } else if (!(value instanceof DataRef)) {
      if (!this.types.has(value.lib_type)) {
        console.trace("Invalid datablock type " + value.lib_type + " passed to DataRefProperty.set_value()");
        return;
      }

      value = new DataRef(value);
      ToolProperty.prototype.setValue.call(this, value, owner, changed, set_data);
    } else {
      ToolProperty.prototype.setValue.call(this, value, owner, changed, set_data);
    }
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
    super.loadSTRUCT(reader);

    this.types = new set(this.types);

    if (this.data !== undefined && this.data.id < 0)
      this.data = undefined;
    this.setValue(this.data);
  }
}

DataRefProperty.STRUCT = nstructjs.inherit(DataRefProperty, ToolProperty) + `
  data  : DataRef | this.data === undefined ? new DataRef(-1) : this.data;
  types : iter(int);
}`;
;

nstructjs.register(DataRefProperty);
ToolProperty.register(DataRefProperty);

export class RefListProperty extends ToolProperty<DataRefList | undefined> {
  static STRUCT: string;

  types: set<int>;
  data?: DataRefList;

  //allowed_types can be either a datablock integer type id,
  //or a set of allowed datablock integer types.
  constructor(
    value?: DataBlock[],
    allowed_types?: set<int> | int[] | int,
    apiname?: string,
    uiname?: string,
    description?: string,
    flag?: int
  ) {
    super(PropTypes.DATAREFLIST, apiname, uiname, description, flag);


    if (allowed_types === undefined)
      allowed_types = [];

    if (!(allowed_types instanceof set)) {
      allowed_types = new set([allowed_types]);
    }

    this.types = allowed_types;

    if (value !== undefined) {
      this.setValue(value);
    }
  }

  copyTo(dst: RefListProperty) {
    ToolProperty.prototype.copyTo.call(this, dst, false);

    dst.types = new set(this.types);
    if (this.data !== undefined)
      dst.setValue(this.data);

    return dst;
  }

  copy(): RefListProperty {
    return this.copyTo(new RefListProperty());
  }

  set_data(value?: DataBlock[] | GArray, owner?: object, changed?: boolean, set_data?: boolean) {
    if (value !== undefined && value.constructor.name === "Array")
      value = new GArray(value);

    if (value === undefined) {
      ToolProperty.prototype.setValue.call(this, undefined, owner, changed, set_data);
    } else {
      let lst = new DataRefList();
      for (let i = 0; i < value.length; i++) {
        let block = value[i];

        if (block === undefined || !this.types.has(block.lib_type)) {
          console.trace();
          if (block === undefined)
            console.log("Undefined datablock in list passed to RefListProperty.setValue");
          else
            console.log("Invalid datablock type " + block.lib_type + " passed to RefListProperty.set_value()");
          continue;
        }
        lst.push(block);
      }

      value = lst;
      super.setValue(this, value, owner, changed, set_data);
    }
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
    super.loadSTRUCT(reader);

    this.types = new set(this.types);
    this.setValue(this.data);
  }
}


RefListProperty.STRUCT = nstructjs.inherit(RefListProperty, ToolProperty) + `
  data  : iter(dataref);
  types : iter(int);
}
`;
nstructjs.register(RefListProperty);
ToolProperty.register(RefListProperty);

/* A Matrix4 exposed to the UI as loc/rot/scale channels rather than 16 numbers;
   Matrix4UI is the decomposing wrapper in src/util/mathlib.ts. */
export class TransformProperty extends ToolProperty<Matrix4UI> {
  static STRUCT: string;

  data: Matrix4UI;

  constructor(
    value?: Matrix4,
    apiname?: string,
    uiname?: string,
    description?: string,
    flag?: int
  ) {
    super(PropTypes.TRANSFORM, apiname, uiname, description, flag)

    if (value !== undefined)
      ToolProperty.prototype.setValue.call(this, new Matrix4UI(value));
  }

  set_data(data: Matrix4, owner?: object, changed?: boolean, set_data?: boolean) {
    this.data.load(data);
    ToolProperty.prototype.setValue.call(this, undefined, owner, changed, false);
  }

  copyTo(dst: TransformProperty) {
    ToolProperty.prototype.copyTo.call(this, dst, false);

    dst.data = new Matrix4UI(new Matrix4());
    dst.data.load(this.data);

    return dst;
  }

  copy(): TransformProperty {
    return this.copyTo(new TransformProperty());
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
    super.loadSTRUCT(reader);

    this.data = new Matrix4UI(this.data);
  }

}

TransformProperty.STRUCT = nstructjs.inherit(TransformProperty, ToolProperty) + `
  data : mat4;
}`;

nstructjs.register(TransformProperty);
ToolProperty.register(TransformProperty);

/*
  A (very) generic container property.
  Internally, it stores references to special
  iterable objects that implements the TPropIterable
  interface (which we do via the multiple inheritance
  system), not arrays.

  e.g. you might pass an eid_list, a DataRefList,
  a TMeshSelectedIter, etc.
*/

/* TPropIterable is used as a value below and previously resolved only via
   window; it comes from the same module as ToolIter. */
import {ToolIter, TPropIterable} from './toolprops_iter.js';

/* The iterator protocol as the tool system uses it: a reusable object with a
   reset(), and an optional ctx the collection is resolved against. */
export interface ToolIterLike<T = object> {
  next(): {done: boolean; value: T | undefined};
  reset?(): void;
  ctx?: FullContext;
}

/* Wraps another iterator, dropping anything that is not an instance of one of
   the filter classes. */
export class type_filter_iter extends ToolIter {
  ret: {done: boolean; value: object | undefined};
  types: Function[];
  iter: ToolIterLike;
  _ctx: FullContext;

  /* super(iter) passes the iterator where ToolIter wants its itemtypes array;
     .types is overwritten on the next line, so only ToolIter's own bookkeeping
     sees the wrong value. */
  constructor(iter: ToolIterLike, typefilter: Function[], ctx: FullContext) {
    //super(iter, typefilter);
    super(iter);

    this.types = typefilter;
    this.ret = {done: false, value: undefined};
    this.iter = iter;
    this._ctx = ctx;
  }

  set ctx(ctx: FullContext) {
    this._ctx = ctx;

    if (this.iter !== undefined)
      this.iter.ctx = ctx;
  }

  get ctx(): FullContext {
    return this._ctx;
  }

  reset() {
    this.iter.ctx = this.ctx;
    this.iter.reset();
  }

  next() {
    let ret = this.iter.next();
    let types = this.types;
    let tlen = this.types.length;
    let this2 = this;

    function has_type(obj: object) {
      for (let i = 0; i < tlen; i++) {
        if (obj instanceof types[i]) return true;
      }

      return false;
    }

    while (!ret.done && !has_type(ret.value)) {
      ret = this.iter.next();
    }

    this.ret.done = ret.done;
    this.ret.value = ret.value;
    ret = this.ret;

    if (ret.done && this.iter.reset) {
      this.iter.reset();
    }

    return ret;
  }
}

/* Anything that can hand the property an iterator: a TPropIterable, or an object
   with a __tooliter__() that produces one. */
export interface CollectionData extends ToolIterLike {
  reset(): void;
  copy?(): CollectionData;
  [Symbol.iterator](): ToolIterLike;
}

export class CollectionProperty extends ToolProperty<CollectionData | undefined> {
  static STRUCT: string;

  /* Empty or undefined means "accept anything"; otherwise the iterator filters
     to instances of these classes. */
  types: Function[];
  _data?: CollectionData;
  _ctx?: FullContext;

  constructor(
    data?: CollectionData,
    filter_types?: Array<Function>,
    apiname?: string,
    uiname?: string,
    description?: string,
    flag?: int
  ) {
    super(PropTypes.COLLECTION, apiname, uiname, description, flag);

    this.flag |= TPropFlags.COLL_LOOSE_TYPE;

    this.types = filter_types;
    this._data = undefined;
    this._ctx = undefined;

    if (data !== undefined) {
      this.setValue(data);
    }
  }

  copyTo(dst: CollectionProperty): CollectionProperty {
    ToolProperty.prototype.copyTo.call(this, dst, false);

    dst.types = this.types;
    this.setValue(this.data);

    return dst;
  }

  copy(): CollectionProperty {
    let ret = this.copyTo(new CollectionProperty());
    ret.types = this.types;
    ret._ctx = this._ctx;

    if (this._data !== undefined && this._data.copy !== undefined)
      ret.setValue(this._data.copy());

    return ret;
  }

  get ctx(): FullContext | undefined {
    return this._ctx;
  }

  set ctx(data: FullContext | undefined) {
    this._ctx = data;

    if (this._data !== undefined)
      this._data.ctx = data;
  }

  getValue(): CollectionData | undefined {
    return this.data;
  }

  set_data(data?: CollectionData, owner?: object, changed?: boolean) {
    this.setValue(data, owner, changed);
  }

  setValue(data?: CollectionData, owner?: object, changed?: boolean) {
    if (data === undefined) {
      this._data = undefined;
      return;
    }

    if ("__tooliter__" in data && typeof data.__tooliter__ === "function") {
      this.setValue(data.__tooliter__(), owner, changed);
      return;
    } else if (!(this.flag & TPropFlags.COLL_LOOSE_TYPE) && !(TPropIterable.isTPropIterable(data))) {
      console.trace();
      console.log("ERROR: bad data '", data, "' was passed to CollectionProperty.setValue!");

      //this is, sadly, an unrecoverable error.
      throw new Error("ERROR: bad data '", data, "' was passed to CollectionProperty.setValue!");
    }

    this._data = data;
    this._data.ctx = this.ctx;

    ToolProperty.prototype.setValue.call(this, undefined, owner, changed, false);
  }

//tool props are not supposed to use setters
//for .data, but since we need one for .get
//(and since that meant renaming an inherited
//member), we add a setter here for the sake of
//robustness.

//XXX: except. . .now you can't pass owner into it

  set data(data: CollectionData | undefined) {
    this.setValue(data);
  }

  get data(): CollectionData | undefined {
    return this._data;
  }

  [Symbol.iterator]() {
    if (this._data === undefined) //return empty iterator if no data
      return {
        next: function () {
          return {done: true, value: undefined};
        }
      };

    this._data.ctx = this._ctx;

    if (this.types !== undefined && this.types.length > 0)
      return new type_filter_iter(this.data[Symbol.iterator](), this.types, this._ctx);
    else
      return this.data[Symbol.iterator]();
  }

  static fromSTRUCT(reader: StructReader<CollectionProperty>) {
    let ret = new CollectionProperty();

    reader(ret);

    return ret;
  }

  loadSTRUCT(reader: StructReader<this>) {
    reader(this);
    super.loadSTRUCT(reader);
  }
}

CollectionProperty.STRUCT = nstructjs.inherit(CollectionProperty, ToolProperty) + `
  data : abstract(Object) | obj.data === undefined ? new BlankArray() : obj.data;
}`;
nstructjs.register(CollectionProperty);
ToolProperty.register(CollectionProperty);

/* Placeholder written in place of an empty CollectionProperty; it deserializes
   back to undefined rather than to an object. */
export class BlankArray {
  static STRUCT: string;

  static fromSTRUCT(reader: StructReader<BlankArray>) {
    return undefined;
  }
}

BlankArray.STRUCT = `
  BlankArray {
  length : int | 0;
}`;
nstructjs.register(BlankArray);
window.BlankArray = BlankArray;
