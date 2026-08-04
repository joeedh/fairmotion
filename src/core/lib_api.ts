"use strict";

import {STRUCT} from './struct.js';

import type {FullContext} from './context.js';
import type {Brush} from '../brush/brush.js';
import type {SplineFrameSet} from './frameset.js';
import type {Image} from './imageblock.js';
import type {Spline} from '../curve/spline.js';
import type {ImageCanvas} from '../paint/imagecanvas.js';
import type {Collection} from '../scene/collection.js';
import type {Scene} from '../scene/scene.js';
import type {SceneObject} from '../scene/sceneobject.js';

/* 
  NOTE: be careful when you assume a given datablock reference is not undefined.
*/

/*
 Important (auto-generated) globals:
 
 1. DataTypes, an enumeration mapping data type names (e.g. OBJECT)
    to integer id's.
 2. LinkOrder, a list of data type *integers* that specifies the order
    that data is re-linked after file load.
 3. DataNames, that maps datatype integer id's to UI-friendly type names
    (e.g. Object instead of 0 or OBJECT).
 
 The blockDefine() static method in each DataBlock child class is used to
 generate all three globals.
 
 DO NOT EVER EVER CHANGE blockDefine().typeIndex;  You can, however,
 change .linkOrder to manipulate the order of datablock relinking.
 */


/*
DataBlock refactor:
 - Add blockDefine static method
 - Add register static method
*/

/* Keyed by the upper-cased typeName from blockDefine(), e.g. DataTypes.SCENE. */
export const DataTypes: {[typeName: string]: int} = {};
export const LinkOrder: int[] = [];

// DataNames maps integer data types to ui-friendly names, e.g. DataNames[0] == "Object"
export const DataNames: {[typeIndex: number]: string} = {}

//other than SELECT, the first two bytes
//of block.flag are reserved for exclusive
//use by subclasses.  
export var BlockFlags = {
  SELECT   : 1,
  FAKE_USER: (1<<16),
  DELETED  : (1<<17)
};

/*
 * The two block-lookup callbacks every data_link() is handed, built by
 * wrap_getblock()/wrap_getblock_us() in lib_utils.ts. The _us variant also
 * registers `block` as a user of what it resolved, so refcounts survive a
 * load; rem_func runs when that user later unlinks.
 */
export type GetBlockFunc = (dataref?: DataRef) => DataBlock | undefined;
export type GetBlockUserFunc = (
  dataref: DataRef | undefined,
  block: DataBlock,
  fieldname: string,
  add_user?: boolean,
  refname?: string,
  rem_func?: () => void
) => DataBlock | undefined;

/*
 * A [lib_id, library_id] pair, stored as a two-element array so the `dataref`
 * STRUCT type can write it positionally. library_id is -1 for the local
 * library, which is the only one that exists -- lib linking was never
 * finished.
 */
export class DataRef extends Array<int> {
  static STRUCT: string;

  length: number;

  constructor(block_or_id?: DataBlock | DataRef | int[] | int, lib: DataLib | int | undefined = undefined) {
    super(2);
    this.length = 2;

    if (lib !== undefined && lib instanceof DataLib)
      lib = lib.id;

    if (block_or_id instanceof DataBlock) {
      var block = block_or_id;
      this[0] = block.lib_id;

      if (lib !== undefined)
        this[1] = lib ? lib.id : -1;
      else
        this[1] = block.lib_lib !== undefined ? block.lib_lib.id : -1;
    } else if (block_or_id instanceof Array) {
      this[0] = block_or_id[0];
      this[1] = block_or_id[1];
    } else {
      this[0] = block_or_id;
      this[1] = lib !== undefined ? lib : -1;
    }
  }

  /* Tolerant of everything a block reference is spelled as in old files: a
     block, an already-built ref, a bare id, or nothing at all. */
  static fromBlock(obj?: DataBlock | DataRef | int) {
    let ret = new DataRef();

    if (!obj) {
      ret[0] = -1;
      return ret;
    }

    if (typeof obj === "number") {
      ret[0] = obj;
      return ret;
    }

    if (obj instanceof DataRef) {
      obj.copyTo(ret);
      return ret;
    }

    if (obj instanceof DataBlock) {
      ret[0] = obj.lib_id;
      return ret;
    }

    ret[0] = -1;
    return ret;
  }

  copyTo(dst: DataRef) {
    dst[0] = this[0];
    dst[1] = this[1];
    return dst;
  }

  copy() {
    return this.copyTo(new DataRef());
  }

  get id(): int {
    return this[0];
  }

  set id(id: int) {
    this[0] = id;
  }

  get lib(): int {
    return this[1];
  }

  set lib(lib: int) {
    this[1] = lib;
  }

  equals(b?: DataRef) {
    //XXX we don't compare library id's
    //since lib linking is unimplemented/
    return b !== undefined && b[0] === this[0];
  }

  static fromSTRUCT(reader: StructReader<DataRef>) {
    var ret = new DataRef(0);

    reader(ret);

    return ret;
  }
}

window.DataRef = DataRef;

//sometimes we need to serialize DataRef
//structures themselves, as opposed to auto-generating
//them from library block references, which is what the.  
//(lowercase) dataref STRUCT type does.
DataRef.STRUCT = `
  DataRef {
    id  : int;
    lib : int;
  }
`;

/* Same payload as DataRef, registered under the lower-case `dataref` struct
   name that the auto-generated block references use. */
export class DataRefCompat extends DataRef {
  static STRUCT: string;
}

DataRefCompat.STRUCT = `
dataref {
  0 : int | obj ? obj.lib_id  : -1;
  1 : int | obj ? obj.lib_lib : 0;
}
`;
window.__dataref = DataRefCompat;

/* All the blocks of one type in a DataLib, plus that type's active block. */
export class DataList<T extends DataBlock = DataBlock> {
  list: GArray;
  namemap: {[name: string]: T};
  idmap: {[lib_id: number]: T};
  type: int;
  active?: T;

  /* hashtable keys the datalists by this. It returns the type integer rather
     than a string; the key is stringified on the way into the table anyway. */
  [Symbol.keystr](): int {
    return this.type;
  }

  constructor(type: int) {
    this.list = new GArray();

    this.namemap = {};
    this.idmap = {};

    this.type = type;
    this.active = undefined;
  }

  [Symbol.iterator]() {
    return this.list[Symbol.iterator]();
  }

  remove(block: T) {
    this.list.remove(block);

    if (block.name !== undefined && this.namemap[block.name] === block)
      delete this.namemap[block.name];

    delete this.idmap[block.lib_id];

    block.on_destroy();
    block.on_remove();
  }

  get(id: int | DataRef): T {
    if (id instanceof DataRef)
      id = id.id;

    return this.idmap[id];
  }
}

export class DataLib {
  static STRUCT: string;

  /* Always 0. Non-local libraries were never implemented. */
  id: number;
  /* typeIndex -> DataList. Keyed by DataList[Symbol.keystr](), which is the
     type integer. */
  datalists: hashtable;
  idmap: {[lib_id: number]: DataBlock};
  idgen: EIDGen;
  lib_anim_idgen: EIDGen;

  /* Set once on_destroy() has run, so a second call can warn instead of
     re-running every block's teardown. Cleared back to undefined by clear(). */
  _destroyed?: boolean;

  /*
   * One accessor per registered DataBlock subclass, installed by the
   * constructor from blockDefine().accessorName. They are plain getters onto
   * get_datalist(), so `datalib.scenes` is the DataList, not an array.
   */
  brushes!: DataList<Brush>;
  collections!: DataList<Collection>;
  framesets!: DataList<SplineFrameSet>;
  image_canvas!: DataList<ImageCanvas>;
  images!: DataList<Image>;
  object!: DataList<SceneObject>;
  scenes!: DataList<Scene>;
  splines!: DataList<Spline>;

  constructor() {
    this.id = 0;
    this.datalists = new hashtable();
    this.idmap = {};
    this.idgen = new EIDGen();
    this._destroyed = undefined;
    this.lib_anim_idgen = new EIDGen();

    for (let cls of BlockClasses) {
      let def = cls.blockDefine();
      let name = DataLib.getAccessorKey(cls);

      let typeId = def.typeIndex;

      for (let k in BlockTypeMap) {
        if (BlockTypeMap[k] === cls) {
          typeId = k;
        }
      }

      Object.defineProperty(this, name, {
        get() {
          return this.get_datalist(typeId);
        }
      });
    }
  }

  static getAccessorKey(cls: DataBlockClass) {
    let def = cls.blockDefine();

    return def.accessorName || def.typeName.toLowerCase();
  }


  clear() {
    this.on_destroy();

    this.datalists = new hashtable();
    this.idmap = {};
    this._destroyed = undefined;

    return this;
  }

  get allBlocks(): Generator<DataBlock> {
    let this2 = this;

    return (function* () {
      for (let k of this2.datalists) {
        let list: DataList = this2.datalists.get(k);

        for (let block of list) {
          yield block;
        }
      }
    })()
  }

  on_destroy() {
    if (this._destroyed) {
      console.log("warning, datalib.on_destroyed called twice");
      return;
    }

    this._destroyed = true;

    for (var k of this.datalists) {
      var l: DataList = this.datalists.get(k);

      for (var block of l) {
        try {
          block.on_destroy();
        } catch (err) {
          print_stack(err);
          console.trace("WARNING: failed to execute on_destroy handler for block", block.name, block);
        }
      }
    }
  }

  get_datalist(typeid: int): DataList {
    var dl: DataList;

    if (!this.datalists.has(typeid)) {
      dl = new DataList(typeid);
      this.datalists.add(typeid, dl);
    } else {
      dl = this.datalists.get(typeid);
    }

    return dl;
  }

  //tries to completely kill a datablock,
  //clearing all references to it
  kill_datablock(block: DataBlock) {
    block.unlink();

    var list: DataList = this.datalists.get(block.lib_type);
    list.remove(block);

    block.lib_flag |= BlockFlags.DELETED;
  }

  search(type: int, prefix: string): GArray {
    //this is what red-black trees are for.
    //oh well.

    var list: DataList = this.datalists.get(type);
    var ret = new GArray();

    prefix = prefix.toLowerCase();
    for (var i = 0; i < list.list.length; i++) {
      if (list.list[i].strip().toLowerCase().startsWith(prefix)) {
        ret.push(list.list[i]);
      }
    }

    return ret;
  }

  //clearly I need to write a simple string
  //processing language with regexpr's
  gen_name(block: DataBlock, name: string) {
    if (name == undefined || name.trim() == "") {
      name = DataNames[block.lib_type];
    }

    if (!this.datalists.has(block.lib_type)) {
      this.datalists.set(block.lib_type, new DataList(block.lib_type));
    }

    var list: DataList = this.datalists.get(block.lib_type);
    if (!(name in list.namemap)) {
      return name;
    }

    var i = 0;
    while (1) {
      i++;

      if (name in list.namemap) {
        var j = name.length - 1;
        for (j; j >= 0; j--) {
          if (name[j] == ".")
            break;
        }

        if (name == 0) {
          name = name + "." + i.toString();
          continue;
        }

        var s = name.slice(j, name.length);
        if (!Number.isNaN(Number.parseInt(s))) {
          name = name.slice(0, j) + "." + i.toString();
        } else {
          name = name + "." + i.toString();
        }
      } else {
        break;
      }
    }

    return name;
  }

  add(block: DataBlock, set_id?: boolean) {
    if (set_id === undefined)
      set_id = true;

    //ensure unique name
    var name = this.gen_name(block, block.name);
    block.name = name;

    if (block.lib_id === -1) {
      block.lib_id = this.idgen.gen_id();
    } else {
      this.idgen.max_cur(block.lib_id);
    }

    this.idmap[block.lib_id] = block;

    if (!this.datalists.has(block.lib_type)) {
      this.datalists.set(block.lib_type, new DataList(block.lib_type));
    }

    var dl: DataList = this.datalists.get(block.lib_type);
    if (dl.active === undefined)
      dl.active = block;

    dl.list.push(block);
    dl.namemap[block.name] = block;
    dl.idmap[block.lib_id] = block;

    block.lib_anim_idgen = this.lib_anim_idgen;
    block.on_add(this);
  }

  get_active(data_type: int): DataBlock | undefined {
    if (this.datalists.has(data_type)) {
      var lst: DataList = this.datalists.get(data_type);

      //we don't allow undefined active blocks
      if (lst.active === undefined && lst.list.length !== 0) {
        if (DEBUG.datalib)
          console.log("Initializing active block for " + get_type_names()[data_type]);

        lst.active = lst.list[0];
      }

      return lst.active;
    } else {
      return undefined;
    }
  }

  get(id: DataRef | int): DataBlock {
    if (id instanceof DataRef)
      id = id.id;

    return this.idmap[id];
  }
}

DataLib.STRUCT = `
DataLib {
  lib_anim_idgen : EIDGen;
  idgen          : EIDGen;
}
`

/*
 * One entry in a block's lib_users list: who holds the reference, and what to
 * call when it goes away. The zero initializers are placeholders -- .user is
 * always overwritten with an object and .rem_func with a function.
 */
export class UserRef {
  user: object | number;
  rem_func: ((user: object, block: DataBlock) => void) | number;
  srcname: string;
  /* lib_adduser() writes the reference name here, but lib_remuser() matches on
     .srcname. See docs/debugging.md; left as-is because fixing it changes when
     users are dropped. */
  name?: string;

  constructor() {
    this.user = 0;
    this.rem_func = 0; //is a function
    this.srcname = "";
  }
}

/* What every DataBlock subclass's static blockDefine() returns. typeIndex is
   the on-disk type tag and must never be reused; the rest is presentation. */
export interface BlockDefine {
  typeName: string;
  defaultName: string;
  uiName: string;
  typeIndex: int;
  /* Name of the DataLib accessor, defaulting to typeName.toLowerCase(). */
  accessorName?: string;
  flag?: int;
  icon?: int;
  /* Position in the file-load link order; defaults to 10000. */
  linkOrder?: int;
}

/* A registered DataBlock subclass. The constructor signature varies per
   subclass, hence never[]. */
export interface DataBlockClass {
  new (...args: never[]): DataBlock;
  blockDefine(): BlockDefine;
  STRUCT?: string;
}

export const BlockClasses: DataBlockClass[] = [];
export const BlockTypeMap: {[typeIndex: number]: DataBlockClass} = {}

/*
ADDON: 8
FRAMESET: 7
IMAGE: 8
OBJECT: 9
SCENE: 5
SCRIPT: 4
SPLINE: 6

[8, 5, 4, 6, 7, 8, 9]
*/

function regenLinkOrder() {
  LinkOrder.length = 0;

  for (let i = 0; i < BlockClasses.length; i++) {
    LinkOrder.push(i);
  }

  LinkOrder.sort((ia, ib) => {
    let da = BlockClasses[ia].blockDefine();
    let db = BlockClasses[ib].blockDefine();

    let a = da.linkOrder !== undefined ? da.linkOrder : 10000;
    let b = db.linkOrder !== undefined ? db.linkOrder : 10000;

    return a - b;
  });

  for (let i = 0; i < LinkOrder.length; i++) {
    LinkOrder[i] = BlockClasses[LinkOrder[i]].blockDefine().typeIndex;
  }
}

var _db_hash_id = 1;

import {GraphNode, mixinGraphNode} from '../graph/graph.js';

export class DataBlock {
  static STRUCT: string;

  /* Free-form per-addon storage. It is a plain map at runtime; loadSTRUCT()
     converts the _DictKey array the file carries back into one. */
  addon_data: {[key: string]: unknown};
  lib_anim_channels: GArray;
  /* Shared with the owning DataLib, and undefined until add() installs it. */
  lib_anim_idgen: EIDGen;
  lib_anim_idmap: {[id: number]: object};
  lib_anim_pathmap: {[path: string]: object};
  lib_users: GArray;
  lib_refs: number;
  flag: number;

  name: string;
  /* Process-unique counter, used only for [Symbol.keystr]. Not saved. */
  _hash_id: int;
  /* -1 until the block is added to a library. */
  lib_id: int;
  /* Which library the block came from. Always undefined -- lib linking was
     never finished -- but the STRUCT script still reads .id off it. */
  lib_lib?: DataLib;
  lib_type: int;

  static blockDefine(): BlockDefine {
    return {
      typeName    : "", //entries in DataTypes are upper-case versions of typeName
      defaultName : "",
      uiName      : "",
      accessorName: undefined, //accessor name in DataLib, defaults to typeName.toLowerCase()
      flag        : 0,
      icon        : -1,
      linkOrder   : undefined, //priority in file load linking, defaults to 10000
      typeIndex   : -1, //for compatiblity with old api, must be defined
    }
  }

  static register(cls: DataBlockClass) {
    if (cls.blockDefine === DataBlock.blockDefine) {
      throw new Error("Missing blockDefine");
    }

    let def = cls.blockDefine();
    if (def.typeIndex === undefined) {
      throw new Error("typeIndex cannot be undefined in blockDefine");
    }

    if (typeof def.typeIndex !== "number") {
      throw new Error("typeIndex must be a number in blockDefine");
    }

    if (def.typeIndex in BlockTypeMap) {
      console.warn(BlockTypeMap[def.typeIndex]);
      throw new Error("" + def.typeIndex + " is already in use");
    }

    if (!def.typeName) {
      throw new Error("typeName cannot be undefined in blockDefine");
    }

    if (!def.uiName) {
      throw new Error("uiName cannot be undefined in blockDefine");
    }

    if (!def.defaultName) {
      throw new Error("defaultName cannot be undefined in blockDefine");
    }

    //DataTypes2[def.typeName.toUpperCase()] = def.typeIndex;
    //return;

    let typeid = def.typeName.toUpperCase();

    BlockClasses.push(cls);
    BlockTypeMap[def.typeIndex] = cls;
    DataTypes[typeid] = def.typeIndex;

    DataNames[DataTypes[typeid]] = typeid.charAt(0).toUpperCase() + typeid.slice(1, typeid.length).toLowerCase();

    regenLinkOrder();
  }

  /* Stamped onto the subclass by the constructor. Nothing reads it. */
  static datablock_type: int;

  //type is an integer, name is a string
  constructor(type?: number, name?: string) {
    if (type === undefined) {
      let key = this.constructor.blockDefine().typeName.toUpperCase();
      type = DataTypes[key];
    }

    this.constructor.datablock_type = type;

    this.addon_data = {};

    //name is optional
    if (name === undefined)
      name = "unnamed";

    this.lib_anim_channels = new GArray();
    //this.lib_anim_idgen = new EIDGen();
    this.lib_anim_idgen = undefined; //is set by global DataLib now
    this.lib_anim_idmap = {};

    this.lib_anim_pathmap = {};

    this.name = name;
    this._hash_id = _db_hash_id++;
    this.lib_id = -1;
    this.lib_lib = undefined; //this will be used for library linking

    this.lib_type = type;
    this.lib_users = new GArray();

    //regardless of whether we continue using ref counting
    //internally, the users do need to know how many users a given
    //block has.
    this.lib_refs = 0;
    this.flag = 0;
  }

  on_add(lib: DataLib) {
  }

  on_remove() {
  }

  on_destroy() {
  }

  copy() {
  }

  copyTo(b: DataBlock) {
  }

  set_fake_user(val: boolean) {
    if ((this.flag & BlockFlags.FAKE_USER) && !val) {
      this.flag &= ~BlockFlags.FAKE_USER;
      this.lib_refs -= 1;
    } else if (!(this.flag & BlockFlags.FAKE_USER) && val) {
      this.flag |= BlockFlags.FAKE_USER;
      this.lib_refs += 1;
    }
  }

  //getblock fetchs a datablock from a reference, but doesn't
  //make add user references.
  //
  //the block parameter is there so block substructs
  //can know which block they belong too.
  //
  //getblock_us does add a user reference automatically.
  //see _Lib_GetBlock and _Lib_GetBlock_us in lib_utils.js.
  data_link(block: DataBlock, getblock: GetBlockFunc, getblock_us: GetBlockUserFunc) {
    for (let ch of this.lib_anim_channels) {
      ch.idgen = this.lib_anim_idgen; //DataLib sets this for DataBlock
      ch.idmap = this.lib_anim_idmap;
      ch.owner = this;

      if (ch.id < 0) {
        console.warn("old file?");
        ch.id = this.lib_anim_idgen.gen_id();
      }

      this.lib_anim_idmap[ch.id] = ch;

      for (var j = 0; j < ch.keys.length; j++) {
        this.lib_anim_idmap[ch.keys[j].id] = ch.keys[j];
      }

      this.lib_anim_pathmap[ch.path] = ch;
    }
  }

  [Symbol.keystr](): string {
    return "DB" + this._hash_id;
  }

  lib_adduser(user: object, name: string, remfunc?: (user: object, block: DataBlock) => void) {
    //remove_lib should be optional?

    var ref = new UserRef()
    ref.user = user;
    ref.name = name;
    if (remfunc)
      ref.rem_func = remfunc;

    this.lib_users.push(ref);
    this.lib_refs++;
  }

  lib_remuser(user: object, refname?: string) {
    var newusers = new GArray();

    for (var i = 0; i < this.lib_users.length; i++) {
      if (this.lib_users[i].user != user && this.lib_users[i].srcname != refname) {
        newusers.push(this.lib_users[i]);
      }
    }

    this.lib_users = newusers;
    this.lib_refs--;
  }

  //removes all references to a datablock from referencing objects
  unlink() {
    var users = this.lib_users;

    for (var i = 0; i < users.length; i++) {
      if (users[i].rem_func !== undefined) {
        users[i].rem_func(users[i].user, this);
      }

      this.lib_remuser(users[i]);
    }

    if (this.lib_refs !== 0) {
      console.log("Ref count error when deleting a datablock!", this.lib_refs, this);
    }
  }

  afterSTRUCT() {
  }

  /* The file carries addon_data as an array of _DictKey; flatten it back into
     the map the rest of the code expects. */
  loadSTRUCT(reader: StructReader<this>) {
    reader(this);

    var map: {[key: string]: unknown} = {};

    if (this.addon_data === undefined || !(this.addon_data instanceof Array)) {
      this.addon_data = [];
    }

    for (var dk of this.addon_data) {
      map[dk.key] = dk.val;
    }

    this.addon_data = map;

    return this;
  }

  _addon_data_save(): _DictKey[] {
    var ret: _DictKey[] = [];

    if (this.addon_data === undefined) {
      return ret;
    }

    for (var k in this.addon_data) {
      ret.push(new _DictKey(k, this.addon_data[k]));
    }

    return ret;
  }
}

/* One addon_data entry, so the map can be written as an array. */
export class _DictKey {
  static STRUCT: string;

  key: string;
  /* Whatever the addon put there; nothing in-tree constrains it. */
  val: unknown;

  constructor(key?: string, val?: unknown) {
    this.key = key;
    this.val = val;
  }

  static fromSTRUCT(reader: StructReader<_DictKey>) {
    let ret = new _DictKey();
    reader(ret);
    return ret;
  }
}

_DictKey.STRUCT = `
  _DictKey {
    key : string;
    val : abstract(Object);
  }
`;

//'name' and 'flag' are deliberately not
//prefixed with 'lib_'
DataBlock.STRUCT = `
  DataBlock {
    name              : string;
    lib_type          : int;
    lib_id            : int;
    lib_lib           : int | obj.lib_lib != undefined ? obj.lib_lib.id : -1;

    addon_data        : array(_DictKey) | obj._addon_data_save();

    lib_refs          : int;
    flag              : int;
    
    lib_anim_channels : array(AnimChannel);
  }
`;

import {ToolIter} from './toolprops_iter.js';

export const NodeDataBlock = mixinGraphNode(DataBlock, "NodeDataBlock");

/*
 * Iterates a list of DataRefs, resolving each against the library only as it
 * is reached -- the rule for tool-property iterators, which must not hold live
 * block references between runs.
 */
export class DataRefListIter<T extends DataBlock = DataBlock> extends ToolIter {
  lst: DataRef[];
  datalib: DataLib;
  ret: {done: boolean; value: T | undefined};
  i: number;
  init: boolean;

  constructor(lst: DataRef[], ctx: FullContext) {
    super();

    this.lst = lst;
    this.i = 0;
    this.datalib = ctx.datalib;
    this.ret = undefined;
    this.init = true;
  }

  next(): {done: boolean; value: T | undefined} {
    if (this.init) {
      this.ret = cached_iret();
      this.init = false;
    }

    if (this.i < this.lst.length) {
      this.ret.value = this.datalib.get(this.lst[this.i].id);
    } else {
      this.ret.value = undefined;
      this.ret.done = true;
    }

    this.i++;

    return this.ret;
  }

  reset() {
    this.i = 0;
    this.init = true;
  }
}
