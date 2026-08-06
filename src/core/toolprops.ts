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
/* NOTE: DataRefList had the same missing-import bug as DataRef, but is not
   published on window either, so RefListProperty.set_data() threw a
   ReferenceError.  lib_utils pulls in the editor event stack, hence the cycle;
   it is only used inside a method body, which ESM handles. */
import {DataRefList} from './lib_utils.js';

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
 * place: the old fairmotion property API layered on top of the toolkit's. The
 * augmentation below is what makes those names visible to the typechecker, both
 * at the patch sites and at the ~200 call sites across the app.
 */
declare module '../path.ux/scripts/path-controller/toolsys/toolprop.js' {
  interface ToolProperty<T = unknown, TYPE extends number = number> {
    /* Deprecated aliases for setValue()/getValue(). */
    set_data(d: T): void;
    get_data(): T;
    get_value(): T;

    /* Presentation fields path.ux does not carry. */
    unit?: string;
    hotkey_ref?: string;

    report(...args: unknown[]): void;
    load_ui_data(prop: ToolProperty<T, TYPE>): void;

    /* One callback per owner, keyed off a tag set on the closure itself. */
    add_listener(owner: object, callback: (...args: unknown[]) => void): void;
    remove_listener(owner: object, silent_fail?: boolean): void;

    add_icons(iconmap: {[key: string]: number}): this;

    /* Custom data-api get/set hooks; enabled by TPropFlags.USE_CUSTOM_GETSET. */
    userSetData(prop: ToolProperty<T, TYPE>, val: T): T;
    userGetData(prop: ToolProperty<T, TYPE>, val: T): T;
  }

  /* Patched onto both enum property classes below.  Nothing calls it any
     more, but it is part of the old public property API. */
  interface EnumPropertyBase<TYPE extends number, VALUE extends string | number> {
    setUINames(uinames: {[key: string]: string}): void;
  }
}

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

ToolProperty.prototype._fire = function (this: ToolProperty, type: string,
                                         arg1?: unknown, arg2?: unknown) {
  propfire.call(this, type, arg1, arg2);

  if (this.update) {
    this.update(this.dataref);
  }

  if (this.api_update) {
    this.api_update(this.dataref);
  }

  return this;
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
  /* NOTE: this read `prop.declarations`, which no property has ever had; the
     field being copied is decimalPlaces. */
  this.decimalPlaces = prop.decimalPlaces;
  this.step = prop.step;
  this.stepIsRelative = prop.stepIsRelative;
  this.expRate = prop.expRate;
};

/* NOTE: _exec_listeners() used to live here. It walked .callbacks as an array
   of [owner, fn] pairs -- a shape path.ux replaced with a Record of named
   stacks years ago -- so it threw on entry, and nothing in the tree called it.
   Removed rather than rewritten; see docs/debugging.md. */

//only one callback per owner allowed
//any existing callback will be overwritten
ToolProperty.prototype.add_listener = function add_listener(
  this: ToolProperty,
  owner: object,
  callback: (...args: unknown[]) => void
) {
  let cb = () => {
    callback(...arguments);
  };

  for (let old of this.callbacks['change'] ?? []) {
    if (Reflect.get(old, "owner") === owner) {
      console.warn("owner already added a callback");
      return;
    }
  }

  this.on('change', cb);
  Reflect.set(cb, "owner", owner);
}

ToolProperty.prototype.remove_listener = function (this: ToolProperty, owner: object, silent_fail = false) {
  for (let cb of this.callbacks['change'] ?? []) {
    if (Reflect.get(cb, "owner") === owner && typeof cb === "function") {
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

  return this;
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
  let cls = i ? toolprop.FlagProperty : toolprop.EnumProperty;

  /* Note that `uinames` is ignored: the names are always derived from .keys.
     See docs/debugging.md. */
  cls.prototype.setUINames = function (this: EnumOrFlagProperty, uinames: {[key: string]: string}) {
    this.ui_value_names = {};
    this.ui_key_names = {};

    for (let k in this.keys) {
      let key = k[0].toUpperCase() + k.slice(1, k.length).toLowerCase();
      key = key.replace(/_/g, " ").replace(/-/g, " ");

      this.ui_value_names[key] = k;
      this.ui_key_names[k] = key;
    }
  };

  Object.defineProperty(cls.prototype, "ui_key_names", {
    /* NOTE: the rebuild below used to be guarded by
       `!Object.hasOwnProperty(this, "_ui_key_names")`, i.e. Object's own
       hasOwnProperty with the key ignored -- always false.  The map was
       rebuilt on every read, and still is. */
    get(this: EnumOrFlagProperty) {
      this._ui_key_names = {};

      for (let k in this.ui_value_names) {
        this._ui_key_names[this.ui_value_names[k]] = k;
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

  data!: Uint8Array | ArrayBuffer;

  constructor(
    data?: ArrayBufferPropertyValue,
    apiname = "",
    uiname = apiname,
    description = "",
    flag = 0
  ) {
    /* NOTE: this call used to omit the `undefined` subtype, so apiname landed
       in subtype, description in uiname, and the caller's flag was dropped. */
    super(PropTypes.ARRAYBUFFER, undefined, apiname, uiname, description, flag);

    this.flag |= TPropFlags.NO_DEFAULT;

    if (data !== undefined) {
      this.setValue(data);
    }
  }

  setValue(d: ArrayBufferPropertyValue) {
    let data: Uint8Array | ArrayBuffer;

    /* Detect undefined */
    if (d instanceof ArrayBuffer) {
      data = new Uint8Array(d, 0, d.byteLength);
    } else if (isTypedArray(d)) {
      data = new Uint8Array(d.buffer, 0, d.buffer.byteLength);
    } else if (Array.isArray(d)) {
      data = new Uint8Array(d);
    } else {
      data = d;
    }

    this.data = data;
  }

  getValue() {
    return this.data;
  }

  copyTo(dst: ArrayBufferProperty) {
    super.copyTo(dst);

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

/* The value type is the iterable setValue() accepts; the stored form is
   always an int[]. */
export class IntArrayProperty extends ToolProperty<Iterable<int>> {
  static STRUCT: string;

  data: int[];

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

  /* Truncates to integers and drops NaNs rather than storing them.
     NOTE: calling this with no argument used to throw a TypeError, after the
     clear below had already emptied the property. */
  setValue(array?: Iterable<number>) {
    let data = this.data;

    super.setValue(array);

    this.data = data;
    this.data.length = 0;

    if (array === undefined) {
      return this;
    }

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
    ToolProperty.prototype.copyTo.call(this, b);
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

/* setValue() is handed either form; only set_data() normalizes to a DataRef. */
export class DataRefProperty extends ToolProperty<DataBlock | DataRef | undefined> {
  static STRUCT: string;

  /* NOTE: these are meant to be integer lib_type ids, but see the loop in the
     constructor -- class ids get stored as the class. */
  types: set<DataTypeSpec>;
  declare data: DataRef | undefined;

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
    /* NOTE: the `undefined` subtype was missing here; apiname landed in
       subtype, description in uiname, and the caller's flag was dropped. */
    super(PropTypes.DATAREF, undefined, apiname, uiname, description, flag);

    if (allowed_types === undefined)
      allowed_types = new set();

    if (!(allowed_types instanceof set)) {
      if (allowed_types instanceof Array)
        allowed_types = new set(allowed_types);
      else
        allowed_types = new set([allowed_types]);
    }

    this.types = new set();

    /* ensure this.types stores integer type ids, not type classes
       NOTE: the class-to-id conversion here tested `typeof val === "object"`,
       but a class is a function, so it never ran and the class itself was
       stored.  Preserved rather than fixed -- the callers that pass classes
       would start matching different ids. */
    for (let val of allowed_types) {
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
    super.copyTo(dst);

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

  /* owner/changed/set_data are accepted for the old call signature; the base
     setValue() has never looked at them. */
  set_data(value?: DataBlock | DataRef, owner?: object, changed?: boolean, set_data?: boolean) {
    if (value === undefined) {
      ToolProperty.prototype.setValue.call(this, undefined);
    } else if (!(value instanceof DataRef)) {
      if (!this.types.has(value.lib_type)) {
        console.trace("Invalid datablock type " + value.lib_type + " passed to DataRefProperty.set_value()");
        return;
      }

      ToolProperty.prototype.setValue.call(this, new DataRef(value));
    } else {
      ToolProperty.prototype.setValue.call(this, value);
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

export class RefListProperty extends ToolProperty<DataRefList | DataBlock[] | undefined> {
  static STRUCT: string;

  /* NOTE: an int[] of allowed types is stored as a single set item, not
     unwrapped the way DataRefProperty does it. */
  types: set<int | int[]>;
  declare data: DataRefList | undefined;

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
    /* NOTE: the `undefined` subtype was missing here; apiname landed in
       subtype, description in uiname, and the caller's flag was dropped. */
    super(PropTypes.DATAREFLIST, undefined, apiname, uiname, description, flag);

    if (allowed_types === undefined)
      allowed_types = [];

    this.types = allowed_types instanceof set ? allowed_types : new set([allowed_types]);

    if (value !== undefined) {
      this.setValue(value);
    }
  }

  copyTo(dst: RefListProperty) {
    ToolProperty.prototype.copyTo.call(this, dst);

    dst.types = new set(this.types);
    if (this.data !== undefined)
      dst.setValue(this.data);

    return dst;
  }

  copy(): RefListProperty {
    return this.copyTo(new RefListProperty());
  }

  /* owner/changed/set_data are accepted for the old call signature; the base
     setValue() has never looked at them. */
  set_data(value?: DataBlock[] | GArray<DataBlock>, owner?: object, changed?: boolean, set_data?: boolean) {
    if (value !== undefined && value.constructor.name === "Array")
      value = new GArray(value);

    if (value === undefined) {
      ToolProperty.prototype.setValue.call(this, undefined);
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

      /* NOTE: this passed `this` as the value -- the property itself, not the
         list it had just built. */
      super.setValue(lst);
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

  data!: Matrix4UI;

  constructor(
    value?: Matrix4,
    apiname?: string,
    uiname?: string,
    description?: string,
    flag?: int
  ) {
    /* NOTE: the `undefined` subtype was missing here; apiname landed in
       subtype, description in uiname, and the caller's flag was dropped. */
    super(PropTypes.TRANSFORM, undefined, apiname, uiname, description, flag)

    if (value !== undefined)
      ToolProperty.prototype.setValue.call(this, new Matrix4UI(value));
  }

  /* owner/changed/set_data are accepted for the old call signature; the base
     setValue() has never looked at them. */
  set_data(data: Matrix4, owner?: object, changed?: boolean, set_data?: boolean) {
    this.data.load(data);
    ToolProperty.prototype.setValue.call(this, undefined);
  }

  copyTo(dst: TransformProperty) {
    ToolProperty.prototype.copyTo.call(this, dst);

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
import type {ToolIterLike} from './toolprops_iter.js';

export type {ToolIterLike};

/* Adapts a plain JS iterator -- an array's, in practice -- to the reusable-ret
   protocol above.  reset() re-fetches the iterator from the source. */
class array_tool_iter<T> implements ToolIterLike<T> {
  ret: IterRet<T>;
  source: Iterable<T>;
  iter: Iterator<T>;

  constructor(source: Iterable<T>) {
    this.source = source;
    this.iter = source[Symbol.iterator]();
    this.ret = new IterRet<T>();
  }

  reset(): void {
    this.iter = this.source[Symbol.iterator]();
    this.ret.done = false;
    this.ret.clear();
  }

  next(): IterRet<T> {
    let item = this.iter.next();

    if (item.done) {
      this.ret.done = true;
      this.ret.clear();
    } else {
      this.ret.done = false;
      this.ret.value = item.value;
    }

    return this.ret;
  }
}

/* Wraps another iterator, dropping anything that is not an instance of one of
   the filter classes. */
export class type_filter_iter<T = object> extends ToolIter<T> {
  ret: IterRet<T>;
  types: Function[];
  iter: ToolIterLike<T>;
  _ctx?: FullContext;

  /* NOTE: this passed `iter` where ToolIter wants its itemtypes array.  Nothing
     ever reads ToolIter.itemtypes, and .types below is the list this class
     actually filters on, so handing up the type list changes no behavior. */
  constructor(iter: ToolIterLike<T>, typefilter: Function[], ctx?: FullContext) {
    //super(iter, typefilter);
    super(typefilter);

    this.types = typefilter;
    this.ret = new IterRet<T>();
    this.iter = iter;
    this._ctx = ctx;
  }

  set ctx(ctx: FullContext | undefined) {
    this._ctx = ctx;

    if (this.iter !== undefined)
      this.iter.ctx = ctx;
  }

  get ctx(): FullContext | undefined {
    return this._ctx;
  }

  /* NOTE: the reset() call was unguarded, so resetting a filter over an
     iterator without one -- a plain array's, before array_tool_iter -- threw. */
  reset() {
    this.iter.ctx = this.ctx;

    if (this.iter.reset) {
      this.iter.reset();
    }
  }

  next() {
    let ret = this.iter.next();
    let types = this.types;
    let tlen = this.types.length;
    let this2 = this;

    function has_type(obj: T) {
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

/* Anything that can hand the property an iterator: a TPropIterable, or an
   object with a __tooliter__() that produces one. */
export interface CollectionIterable<T = object> {
  reset?(): void;
  copy?(): CollectionData<T>;
  __tooliter__?(): CollectionData<T>;
  ctx?: FullContext;

  [Symbol.iterator](): ToolIterLike<T>;
}

/* The constructor unconditionally sets COLL_LOOSE_TYPE, so a plain array is
   just as valid a collection as a TPropIterable. */
export type CollectionData<T = object> = CollectionIterable<T> | T[];

export class CollectionProperty<T = object>
  extends ToolProperty<CollectionData<T> | undefined> {
  static STRUCT: string;

  /* Empty or undefined means "accept anything"; otherwise the iterator filters
     to instances of these classes. */
  types?: Function[];
  _data?: CollectionData<T>;
  _ctx?: FullContext;

  constructor(
    data?: CollectionData<T>,
    filter_types?: Array<Function>,
    apiname?: string,
    uiname?: string,
    description?: string,
    flag?: int
  ) {
    /* NOTE: the `undefined` subtype was missing here; apiname landed in
       subtype, description in uiname, and the caller's flag was dropped. */
    super(PropTypes.COLLECTION, undefined, apiname, uiname, description, flag);

    this.flag |= TPropFlags.COLL_LOOSE_TYPE;

    this.types = filter_types;
    this._data = undefined;
    this._ctx = undefined;

    if (data !== undefined) {
      this.setValue(data);
    }
  }

  copyTo(dst: CollectionProperty<T>): CollectionProperty<T> {
    ToolProperty.prototype.copyTo.call(this, dst);

    dst.types = this.types;
    this.setValue(this.data);

    return dst;
  }

  copy(): CollectionProperty<T> {
    let ret = this.copyTo(new CollectionProperty<T>());
    ret.types = this.types;
    ret._ctx = this._ctx;

    if (this._data !== undefined && !Array.isArray(this._data) && this._data.copy !== undefined)
      ret.setValue(this._data.copy());

    return ret;
  }

  get ctx(): FullContext | undefined {
    return this._ctx;
  }

  set ctx(data: FullContext | undefined) {
    this._ctx = data;

    /* Arrays get a ctx stamped on them too; that is how the original ran. */
    if (this._data !== undefined)
      Reflect.set(this._data, "ctx", data);
  }

  getValue(): CollectionData<T> | undefined {
    return this.data;
  }

  set_data(data?: CollectionData<T>, owner?: object, changed?: boolean) {
    this.setValue(data, owner, changed);
  }

  setValue(data?: CollectionData<T>, owner?: object, changed?: boolean) {
    if (data === undefined) {
      this._data = undefined;
      return;
    }

    if (!Array.isArray(data) && typeof data.__tooliter__ === "function") {
      this.setValue(data.__tooliter__(), owner, changed);
      return;
    } else if (!(this.flag & TPropFlags.COLL_LOOSE_TYPE) && !(TPropIterable.isTPropIterable(data))) {
      console.trace();
      console.log("ERROR: bad data '", data, "' was passed to CollectionProperty.setValue!");

      /* NOTE: the data and the tail of the message used to be passed as extra
         Error() arguments, which Error drops. */
      //this is, sadly, an unrecoverable error.
      throw new Error("ERROR: bad data '" + data + "' was passed to CollectionProperty.setValue!");
    }

    this._data = data;
    Reflect.set(this._data, "ctx", this.ctx);

    ToolProperty.prototype.setValue.call(this, undefined);
  }

//tool props are not supposed to use setters
//for .data, but since we need one for .get
//(and since that meant renaming an inherited
//member), we add a setter here for the sake of
//robustness.

//XXX: except. . .now you can't pass owner into it

  set data(data: CollectionData<T> | undefined) {
    this.setValue(data);
  }

  get data(): CollectionData<T> | undefined {
    return this._data;
  }

  [Symbol.iterator](): ToolIterLike<T> {
    if (this._data === undefined) { //return empty iterator if no data
      let done = new IterRet<T>();
      done.done = true;

      return {
        next: function () {
          return done;
        }
      };
    }

    Reflect.set(this._data, "ctx", this._ctx);

    let iter = Array.isArray(this._data)
               ? new array_tool_iter<T>(this._data)
               : this._data[Symbol.iterator]();

    if (this.types !== undefined && this.types.length > 0)
      return new type_filter_iter<T>(iter, this.types, this._ctx);
    else
      return iter;
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
