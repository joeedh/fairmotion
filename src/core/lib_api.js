"use strict";

import {STRUCT} from 'struct';

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
 
 _DataTypeRef is what's used to generate all three globals.
 Each of its items is of the form [TYPENAME, id].
 
 DO NOT EVER EVER CHANGE id;  You can, however,
 change the order of the items to manipulate the 
 order of datablock relinking.
 */
 
//data types, in post-fileload link order
//each item is [type, int_id]; DO NOT CHANGE INT_ID
var _DataTypeDef = [
//[enum name, type id (integer)]
  ["IMAGE", 8],
  ["SCENE", 5],
  ["SCRIPT", 4],
  ["SPLINE", 6],
  ["FRAMESET", 7]
];

//generate globals DataTypes and LinkOrder
export var DataTypes = {};
export var LinkOrder = [];

for (var i=0; i<_DataTypeDef.length; i++) {
  DataTypes[_DataTypeDef[i][0]] = _DataTypeDef[i][1];
  LinkOrder.push(_DataTypeDef[i][1]);
}

// DataNames maps integer data types to ui-friendly names, e.g. DataNames[0] == "Object"
export var DataNames = {}
for (var k in DataTypes) {
  DataNames[DataTypes[k]] = k.charAt(0) + k.slice(1, k.length).toLowerCase();
}

//other than SELECT, the first two bytes
//of block.flag are reserved for exclusive
//use by subclasses.  
export var BlockFlags = {
  SELECT : 1,
  FAKE_USER : (1<<16),
  DELETED : (1<<17)
};

export class DataRef extends Array {
  constructor(block_or_id, lib=undefined) {
    Array.call(this, 2);
    this.length = 2;
    
    if (lib != undefined && lib instanceof DataLib)
      lib = lib.id;
    
    if (block_or_id instanceof DataBlock) {
      var block = block_or_id;
      this[0] = block.lib_id;
      
      if (lib != undefined)
        this[1] = lib ? lib.id : -1;
      else
        this[1] = block.lib_lib != undefined ? block.lib_lib.id : -1;
    } else if (block_or_id instanceof Array) {
      this[0] = block_or_id[0];
      this[1] = block_or_id[1];
    } else {
      this[0] = block_or_id;
      this[1] = lib != undefined ? lib : -1;
    }
  }
  
  copyTo(DataRef dst) {
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
    return b != undefined && b[0] == this[0];
  }
  
  static fromSTRUCT(reader) {
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
DataRef.STRUCT = """
  DataRef {
    id  : int;
    lib : int;
  }
"""

export class DataList<T> {
  GArray<T> list;
  ObjectMap<String,T> namemap;
  ObjectMap<Int,T> idmap;
  int type;
  T active;
  
  [Symbol.keystr]() : String {
    return this.type;
  }
  
  constructor(int type) {
    this.list = new GArray();
    
    this.namemap = {};
    this.idmap = {};
    
    this.type = type;
    this.active = undefined;
  }

  [Symbol.iterator]() : GArrayIter {
    return this.list[Symbol.iterator]();
  }
  
  remove(block) {
    this.list.remove(block);
    
    if (block.name != undefined && this.namemap[block.name] == block)
      delete this.namemap[block.name];
      
    delete this.idmap[block];
    
    block.on_destroy();
    block.on_remove();
  }
  
  get(id) {
    if (id instanceof DataRef) 
      id = id.id;
    
    return this.idmap[id];
  }
}

export class DataLib {
  hashtable<int,DataList>  datalists;
  ObjectMap<int,DataBlock> idmap;
  EIDGen idgen;
  
  int id;
  
  constructor() {
    this.id = 0;
    this.datalists = new hashtable();
    this.idmap = {};
    this.idgen = new EIDGen();
    this._destroyed = undefined;
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
        } catch(err) {
          print_stack(err);
          console.trace("WARNING: failed to execute on_destroy handler for block", block.name, block);
        }
      }
    }
  }
  
  get_datalist(int typeid) : DataList {
    var dl;
    
    if (!this.datalists.has(typeid)) {
      dl = new DataList(typeid);
      this.datalists.add(typeid, dl);
    } else {
      dl = this.datalists.get(typeid);
    }
    
    return dl;
  }
  
  get images() : DataList<Scene> {
    return this.get_datalist(DataTypes.IMAGE);
  }
  
  get scenes() : DataList<Scene> {
    return this.get_datalist(DataTypes.SCENE);
  }
  
  get framesets() : DataList<SplineFrameSet> {
    return this.get_datalist(DataTypes.FRAMESET);
  }
  
  //tries to completely kill a datablock,
  //clearing all references to it
  kill_datablock(DataBlock block) {
    block.unlink();
    
    var list = this.datalists.get(block.lib_type);
    list.remove(block);
    
    block.lib_flag |= BlockFlags.DELETED;
  }
  
  search(int type, String prefix) : GArray<DataBlock> {
    //this is what red-black trees are for.
    //oh well.
    
    var list = this.datalists.get(type);
    var ret = new GArray();
    
    prefix = prefix.toLowerCase();
    for (var i=0; i<list.list.length; i++) {
      if (list.list[i].strip().toLowerCase().startsWith(prefix)) {
        ret.push(list.list[i]);
      }
    }
    
    return ret;
  }

  //clearly I need to write a simple string
  //processing language with regexpr's
  gen_name(DataBlock block, String name) {
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
        var j = name.length-1;
        for (j; j>=0; j--) {
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

  add(DataBlock block, Boolean set_id) {
    if (set_id == undefined)
      set_id = true;
    
    //ensure unique name
    var name = this.gen_name(block, block.name);
    block.name = name;
    
    if (block.lib_id == -1) {
      block.lib_id = this.idgen.gen_id();
    } else {
      this.idgen.max_cur(block.lib_id);
    }
    
    this.idmap[block.lib_id] = block;
    
    if (!this.datalists.has(block.lib_type)) {
      this.datalists.set(block.lib_type, new DataList(block.lib_type));
    }
    
    var dl = this.datalists.get(block.lib_type);
    if (dl.active == undefined)
      dl.active = block;
      
    dl.list.push(block);
    dl.namemap[block.name] = block;
    dl.idmap[block.lib_id] = block;
    
    block.on_add(this);
  }

  get_active(int data_type) {
    if (this.datalists.has(data_type)) {
      var lst = this.datalists.get(data_type);
      
      //we don't allow undefined active blocks
      if (lst.active == undefined && lst.list.length != 0) {
        if (DEBUG.datalib)
          console.log("Initializing active block for " + get_type_names()[data_type]);
        
        lst.active = lst.list[0];
      }
      
      return this.datalists.get(data_type).active;
    } else {
      return undefined;
    }
  }

  get(DataRef id) {
    if (id instanceof DataRef)
      id = id.id;
    
    return this.idmap[id];
  }
}

export class UserRef {
  String user, srcname;
  Function rem_func;
  
  constructor() {
    this.user = 0;
    this.rem_func = 0;
    this.srcname = "";
  }
}

var _db_hash_id = 1;
export class DataBlock {
  String name;
  DataLib lib_lib;
  GArray lib_users;
  GArray lib_anim_channels;
  
  int flag, lib_type;
  int lib_refs, lib_id;
  int _hash_id;
  
  constructor(int type, String name) {
    this.constructor.datablock_type = type;
    
    //name is optional
    if (name == undefined)
      name = "unnnamed";
      
    this.lib_anim_channels = new GArray();
    this.lib_anim_idgen = new EIDGen();
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
  
  on_gl_lost(WebGLRenderingContext new_gl) { }
  on_add(DataLib lib) { }
  on_remove() { }
  on_destroy() { }
  
  copy() { }

  set_fake_user(Boolean val) {
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
  }
  
  [Symbol.keystr]() : String {
    return "DB" + this._hash_id;
  }

  lib_adduser(Object user, String name, Function remfunc) {
    //remove_lib should be optional?
    
    var ref = new UserRef()
    ref.user = user;
    ref.name = name;
    if (remfunc)
      ref.rem_func = remfunc;
    
    this.lib_users.push(ref);
    this.lib_refs++;
  }

  lib_remuser(Object user, String refname) {
    var newusers = new GArray();
    
    for (var i=0; i<this.lib_users.length; i++) {
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
    
    for (var i=0; i<users.length; i++) {
      if (users[i].rem_func != undefined) {
        users[i].rem_func(users[i].user, this);
      }
      
      this.user_rem(users[i]);
    }
    
    if (this.lib_refs != 0) {
      console.log("Ref count error when deleting a datablock!", this.lib_refs,  this);
    }
  }

  afterSTRUCT() {
    for (var i=0; i<this.lib_anim_channels.length; i++) {
      var ch = this.lib_anim_channels[i];
      ch.idgen = this.lib_anim_idgen;
      ch.idmap = this.lib_anim_idmap;
      ch.owner = this;
      
      for (var j=0; j<ch.keys.length; j++) {
        this.lib_anim_idmap[ch.keys[j].id] = ch.keys[j];
      }
      
      this.lib_anim_pathmap[ch.path] = ch;
    }
  }
  
  static fromSTRUCT(reader) {
    var ret = new DataBlock();
    
    reader(ret);
    
    return ret;
  }
}

//'name' and 'flag' are deliberately not
//prefixed with 'lib_'
DataBlock.STRUCT = """
  DataBlock {
    name     : string;
    lib_type : int;
    lib_id   : int;
    lib_lib  : int | obj.lib_lib != undefined ? obj.lib_lib.id : -1;

    lib_refs : int;
    flag     : int;
    
    lib_anim_channels : array(AnimChannel);
    lib_anim_idgen    : EIDGen;
  }
""";

import {ToolIter} from 'toolprops_iter';

export class DataRefListIter<T> extends ToolIter {
  Array lst;
  
  DataLib datalib;
  IterRet<T> ret;
  Boolean init;
  int i;
  
  constructor(Array lst, Context ctx) {
    this.lst = lst;
    this.i = 0;
    this.datalib = ctx.datalib;
    this.ret = undefined : IterRet<T>;
    this.init = true;
  }
  
  next() : IterRet<T> {
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
