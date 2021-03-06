"use strict";

import {STRUCT} from './struct.js';

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

export const DataTypes = {};
export const LinkOrder = [];

// DataNames maps integer data types to ui-friendly names, e.g. DataNames[0] == "Object"
export const DataNames = {}

//other than SELECT, the first two bytes
//of block.flag are reserved for exclusive
//use by subclasses.  
export var BlockFlags = {
  SELECT   : 1,
  FAKE_USER: (1<<16),
  DELETED  : (1<<17)
};

export class DataRef extends Array {
  length: number;

  constructor(block_or_id, lib = undefined) {
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

  static fromBlock(obj: DataBlock) {
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

  get id() {
    return this[0];
  }

  set id(id) {
    this[0] = id;
  }

  get lib() {
    return this[1];
  }

  set lib(lib) {
    this[1] = lib;
  }

  equals(b) {
    //XXX we don't compare library id's
    //since lib linking is unimplemented/
    return b !== undefined && b[0] === this[0];
  }

  static fromSTRUCT(reader: function) {
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

export class DataRefCompat extends DataRef {
}

DataRefCompat.STRUCT = `
dataref {
  0 : int | obj ? obj.lib_id  : -1;
  1 : int | obj ? obj.lib_lib : 0;
}
`;
window.__dataref = DataRefCompat;

export class DataList<T> {
  list: GArray
  namemap: Object
  idmap: Object;

  [Symbol.keystr](): String {
    return this.type;
  }

  constructor(type: int) {
    this.list = new GArray();

    this.namemap = {};
    this.idmap = {};

    this.type = type;
    this.active = undefined;
  }

  [Symbol.iterator](): GArrayIter {
    return this.list[Symbol.iterator]();
  }

  remove(block: DataBlock) {
    this.list.remove(block);

    if (block.name !== undefined && this.namemap[block.name] === block)
      delete this.namemap[block.name];

    delete this.idmap[block];

    block.on_destroy();
    block.on_remove();
  }

  get(id: int) {
    if (id instanceof DataRef)
      id = id.id;

    return this.idmap[id];
  }
}

export class DataLib {
  id: number
  datalists: hashtable
  idmap: Object
  idgen: EIDGen;
  lib_anim_idgen: EIDGen;

  constructor() {
    this.id = 0;
    this.datalists = new hashtable();
    this.idmap = {};
    this.idgen = new EIDGen();
    this._destroyed = undefined;
    this.lib_anim_idgen = new EIDGen();
  }

  clear() {
    this.on_destroy();

    this.datalists = new hashtable();
    this.idmap = {};
    this._destroyed = undefined;

    return this;
  }

  get allBlocks() {
    let this2 = this;

    return (function* () {
      for (let k of this2.datalists) {
        let list = this2.datalists.get(k);

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
      var l = this.datalists.get(k);

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
    var dl;

    if (!this.datalists.has(typeid)) {
      dl = new DataList(typeid);
      this.datalists.add(typeid, dl);
    } else {
      dl = this.datalists.get(typeid);
    }

    return dl;
  }

  get images(): DataList<Scene> {
    return this.get_datalist(DataTypes.IMAGE);
  }

  get scenes(): DataList<Scene> {
    return this.get_datalist(DataTypes.SCENE);
  }

  get framesets(): DataList<SplineFrameSet> {
    return this.get_datalist(DataTypes.FRAMESET);
  }

  //tries to completely kill a datablock,
  //clearing all references to it
  kill_datablock(block: DataBlock) {
    block.unlink();

    var list = this.datalists.get(block.lib_type);
    list.remove(block);

    block.lib_flag |= BlockFlags.DELETED;
  }

  search(type: int, prefix: string): GArray<DataBlock> {
    //this is what red-black trees are for.
    //oh well.

    var list = this.datalists.get(type);
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

    var list = this.datalists.get(block.lib_type);
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

  add(block: DataBlock, set_id: Boolean) {
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

    var dl = this.datalists.get(block.lib_type);
    if (dl.active === undefined)
      dl.active = block;

    dl.list.push(block);
    dl.namemap[block.name] = block;
    dl.idmap[block.lib_id] = block;

    block.lib_anim_idgen = this.lib_anim_idgen;
    block.on_add(this);
  }

  get_active(data_type: int) {
    if (this.datalists.has(data_type)) {
      var lst = this.datalists.get(data_type);

      //we don't allow undefined active blocks
      if (lst.active === undefined && lst.list.length !== 0) {
        if (DEBUG.datalib)
          console.log("Initializing active block for " + get_type_names()[data_type]);

        lst.active = lst.list[0];
      }

      return this.datalists.get(data_type).active;
    } else {
      return undefined;
    }
  }

  get(id: DataRef) {
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

export class UserRef {
  user: number
  rem_func: number
  srcname: string;

  constructor() {
    this.user = 0;
    this.rem_func = 0; //is a function
    this.srcname = "";
  }
}

export const BlockClasses = [];
export const BlockTypeMap = {}

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

  LinkOrder.sort((a, b) => {
    a = BlockClasses[a].blockDefine();
    b = BlockClasses[b].blockDefine();

    a = a.linkOrder !== undefined ? a.linkOrder : 10000;
    b = b.linkOrder !== undefined ? b.linkOrder : 10000;

    return a - b;
  });

  for (let i = 0; i < LinkOrder.length; i++) {
    LinkOrder[i] = BlockClasses[LinkOrder[i]].blockDefine().typeIndex;
  }
}

var _db_hash_id = 1;

import {GraphNode, mixinGraphNode} from '../graph/graph.js';

export class DataBlock {
  addon_data: Object
  lib_anim_channels: GArray
  lib_anim_idgen: EIDGen
  lib_anim_idmap: Object
  lib_anim_pathmap: Object
  lib_users: GArray
  lib_refs: number
  flag: number;

  static blockDefine() {
    return {
      typeName   : "", //entries in DataTypes are upper-case versions of typeName
      defaultName: "",
      uiName     : "",
      flag       : 0,
      icon       : -1,
      linkOrder  : undefined, //priority in file load linking, defaults to 10000
      typeIndex  : -1, //for compatiblity with old api, must be defined
    }
  }

  static register(cls) {
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

  //type is an integer, name is a string
  constructor(type: number, name: string) {
    if (type === undefined) {
      type = this.constructor.blockDefine().typeName.toUpperCase();
      type = DataTypes[type];
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

  copyTo(b) {
  }

  set_fake_user(val: Boolean) {
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
  data_link(block, getblock, getblock_us) {
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

  lib_adduser(user: Object, name: string, remfunc: function) {
    //remove_lib should be optional?

    var ref = new UserRef()
    ref.user = user;
    ref.name = name;
    if (remfunc)
      ref.rem_func = remfunc;

    this.lib_users.push(ref);
    this.lib_refs++;
  }

  lib_remuser(user: DataBlock, refname: string) {
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

  loadSTRUCT(reader: function) {
    reader(this);

    var map = {};

    if (this.addon_data === undefined || !(this.addon_data instanceof Array)) {
      this.addon_data = [];
    }

    for (var dk of this.addon_data) {
      map[dk.key] = dk.val;
    }

    this.addon_data = map;

    return this;
  }

  _addon_data_save(): Array<_DictKey> {
    var ret = [];

    if (this.addon_data === undefined) {
      return ret;
    }

    for (var k in this.addon_data) {
      ret.push(new _DictKey(k, this.addon_data[k]));
    }

    return ret;
  }
}

export class _DictKey {
  constructor(key: string, val: any) {
    this.key = key;
    this.val = val;
  }

  static fromSTRUCT(reader: function) {
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

export class DataRefListIter<T> extends ToolIter {
  i: number
  init: boolean;

  constructor(lst: Array, ctx: Context) {
    super();

    this.lst = lst;
    this.i = 0;
    this.datalib = ctx.datalib;
    this.ret = undefined
  :
    IterRet<T>;
    this.init = true;
  }

  next(): IterRet<T> {
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
