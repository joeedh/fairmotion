"use strict";

import "../editors/events.js";
import "./toolprops_iter.js";

import {STRUCT} from "./struct.js";
import {EventHandler} from "../editors/events.js";
import {charmap} from "../editors/events.js";

/* Type-only: this file names DataBlock and DataLib without importing them --
   see the finding in docs/debugging.md. A real import would cycle through the
   editor event stack that the two imports above pull in. */
import type {
  DataBlock, DataLib, DataRefListIter, GetBlockFunc, GetBlockUserFunc
} from "./lib_api.js";
/* DataRef is not imported: lib_api.ts publishes it on window and this file
   constructs it by the bare name. See globals.d.ts. */

/*
  Some notes on undo:
  
  Undoing the deletion of a datablock is potentially
  a very complex operation.  Since deleting a block unlinks
  (unsets all references to) it, undoing back to the former state
  would require performing that unlinking in reverse.  Since we
  can't use direct references to the data model to implement undo,
  we'd have to implement something like the datapath api, but considerable
  more complicated (re-inserting DAG nodes, for example, would be really tricky).  
  Testing it would be hellish, too.
  
  So for now, all tool ops that delete datablock must serialize the entire
  app state (minus the UI) in .undo_pre(), and restore it in .undo().  

  Another alternative is to store a copy of the app state at every X
  point in the toolstack (actually, we'd store a diff to the previous copy).
  That would lessen the penalty from rebuilding the previous state by
  re-executing the tool stack.  But it would also take more memory, and would
  still be too slow to use in most cases anyhow.
*/

/* 'DataBlock List.                         *
 *  A generic container list for datablocks */
export class DBList extends GArray {
  static STRUCT: string;

  idmap: {[lib_id: number]: DataBlock}
  selected: GArray
  length: number
  selset: set<DataBlock>;
  /* Which DataBlock subtype this list holds; one of lib_api's block type ids. */
  type: number;
  active: DataBlock | undefined;
  /* Only exists between fromSTRUCT()'s reader() call and the delete below it:
     nstructjs parks the array payload here so it does not fight GArray. */
  arrdata?: DataBlock[];

  constructor(type: number) {
    super();

    this.type = type;
    this.idmap = {};
    this.selected = new GArray();
    this.active = undefined;
    this.length = 0;

    //private variable
    this.selset = new set();
  }

  static fromSTRUCT(unpacker: StructReader<DBList>) {
    var dblist = new DBList(0);

    unpacker(dblist);

    var arr = dblist.arrdata;
    dblist.length = 0;

    //note that array data is still in dataref form
    //at this point
    for (var i = 0; i < arr.length; i++) {
      GArray.prototype.push.call(dblist, arr[i]);
    }

    dblist.selected = new GArray(dblist.selected);

    //get rid of temp varable we used to store the actual
    //array data
    delete dblist.arrdata;
    return dblist;
  }

  toJSON() {
    var list: number[] = [];
    var sellist: number[] = [];

    for (var block of this) {
      list.push(block.lib_id);
    }

    for (var block of this.selected) {
      sellist.push(block.lib_id);
    }

    var obj = {
      list    : list,
      selected: sellist,
      active  : this.active != undefined ? this.active.lib_id : -1,
      length  : this.length,
      type    : this.type
    };

    return obj;
  }

  static fromJSON(obj: {type: number; list: number[]; selected: number[]; active: number; length: number}) {
    var list = new DBList(obj.type);

    list.list = new GArray(obj.list);
    list.selected = new GArray(obj.selected);
    list.active = obj.active;
    list.length = obj.length;
  }

  clear_select() {
    for (var block of this.selected) {
      block.flag &= ~SELECT;
    }

    this.selset = new set();
    this.selected = new GArray();
  }

  set_active(block: DataBlock) {
    if (block == undefined && this.length > 0) {
      console.trace();
      console.log("Undefined actives are illegal for DBLists, unless the list length is zero.");
      return;
    }

    this.active = block;
  }

  select(block: DataBlock, do_select = true) {
    if (!(block instanceof DataBlock)) {
      warntrace("WARNING: bad value ", block, " passed to DBList.select()");
      return;
    }

    if (do_select) {
      block.flag |= SELECT;

      if (this.selset.has(block)) {
        return;
      }

      this.selset.add(block);
      this.selected.push(block);
    } else {
      block.flag &= ~SELECT;

      if (!this.selset.has(block)) {
        return;
      }

      this.selset.remove(block);
      this.selected.remove(block);
    }
  }

  //note that this doesn't set datablock user linkages.
  data_link(block: DataBlock, getblock: GetBlockFunc, getblock_us: GetBlockUserFunc) {
    for (var i = 0; i < this.length; i++) {
      this[i] = getblock(this[i]);
      this.idmap[this[i].lib_id] = this[i];
    }

    var sel = this.selected;
    for (var i = 0; i < sel.length; i++) {
      sel[i] = getblock(sel[i]);
      this.selset.add(sel[i]);
    }

    this.active = getblock(this.active);
  }

  push(block: DataBlock) {
    if (!(block instanceof DataBlock)) {
      warntrace("WARNING: bad value ", block, " passed to DBList.select()");
      return;
    }

    super.push(block);
    this.idmap[block.lib_id] = block;

    if (this.active == undefined) {
      this.active = block;
      this.select(block, true);
    }
  }

  remove(block: DataBlock) {
    var i = this.indexOf(block);

    if (i < 0 || i == undefined) {
      warn("WARNING: Could not remove block " + block.name + " from a DBList");
      return;
    }

    this.pop(i);
  }

  pop(i: int) {
    if (i < 0 || i >= this.length) {
      warn("WARNING: Invalid argument ", i, " to static pop()");
      print_stack();
      return;
    }

    var block = this[i];
    super.pop(i);
    delete this.idmap[block.lib_id];

    if (this.active == block) {
      this.select(block, false);
      this.active = this.length > 0 ? this[0] : undefined;
    }

    if (this.selset.has(block)) {
      this.selected.remove(block);
      this.selset.remove(block);
    }
  }

  idget(id: int) {
    return this.idmap[id];
  }
}

DBList.STRUCT = `
  DBList {
    type : int;
    selected : array(dataref(DataBlock));
    arrdata : array(dataref(DataBlock)) | obj;
    active : dataref(DataBlock);
  }
`;

function DataArrayRem(dst: {[field: string]: {remove(obj: unknown): void}}, field: string, obj: unknown) {
  var array = dst[field];

  function rem() {
    array.remove(obj);
  }

  return rem;
}

/* Dead: nothing calls this, and ASObject is not in scope here. */
function SceneObjRem(scene: {objects: {remove(o: object): void; length: number; [i: number]: object};
                             graph: {remove(o: object): void};
                             selection: {has(o: object): boolean; remove(o: object): void};
                             active: object | undefined},
                     obj: {dag_node: {inmap: {[k: string]: Iterable<{opposite(o: object): {node: object}}>}}}) {
  function rem() {
    /*unparent*/
    for (var e of obj.dag_node.inmap["parent"]) {
      var node = e.opposite(obj).node;

      if (node instanceof ASObject)
        node.unparent(scene);
    }

    scene.objects.remove(obj);
    scene.graph.remove(obj);

    if (scene.active == obj)
      scene.active = scene.objects.length > 0 ? scene.objects[0] : undefined;

    if (scene.selection.has(obj))
      scene.selection.remove(obj);
  }

  return rem;
}

/* The default unlink callback: the block that held the reference forgets it.
   Note the quoted "field" -- see the finding in docs/debugging.md. */
function DataRem(dst: DataBlock, field: string) {
  function rem() {
    dst["field"] = undefined;
  }

  return rem;
}

/*utility callback function used when loading files.

  dataref is a [blockid, libid] array,
  block is an optional datablock,
  fieldname is the name of the field in the datablock,
  refname is the tag name for the dataref,
  and rem_func is a function that is called
  when another object delinks itself from block
  
  refname, rem_func are optional, and default to 
  fieldname, DataRem(block, fieldname), respectively.
*/

export function wrap_getblock_us(datalib: DataLib): GetBlockUserFunc {
  return function (dataref: DataRef | undefined, block: DataBlock, fieldname: string,
                   add_user?: boolean, refname?: string, rem_func?: () => void) {
    if (dataref == undefined) return;

    if (rem_func == undefined)
      rem_func = DataRem(block, fieldname);

    if (refname == undefined)
      refname = fieldname;

    var id = dataref[0];
    //var lib_id = dataref[1];

    if (id == -1) {
      return undefined;
    } else {
      var b = datalib.get(id);

      if (b != undefined) {
        if (add_user)
          b.lib_adduser(block, refname, rem_func);
      } else {
        warntrace(["WARNING WARNING WARNING saved block reference isn't in database!!!",
                   "  dataref: "].join("\n"), dataref);

      }

      return b;
    }
  };
}

export function wrap_getblock(datalib: DataLib): GetBlockFunc {
  return function (dataref?: DataRef) {
    if (dataref == undefined) return;

    var id = dataref[0];
    //var lib_id = dataref[1];

    if (id == -1) {
      return undefined;
    } else {
      var b = datalib.get(id);

      if (b != undefined) {
      } else {
        warntrace(["WARNING WARNING WARNING saved block reference isn't in database!!!",
                   "  dataref: "].join("\n"), dataref);
      }

      return b;
    }
  }
}


/*
  DataRefList.  A simple container for block references.
  Most of the API will accept either a block or a DataRef.
  
  [Symbol.iterator] will use the ids to fetch and return blocks,
  though.
*/
export class DataRefList extends GArray {
  static STRUCT: string;

  /* Whose library get()/pop() resolve against. Written through the `ctx`
     setter; falls back to g_app_state.datalib while it is unset. */
  datalib: DataLib | undefined;

  constructor(lst: Iterable<DataBlock | DataRef> | (DataBlock | DataRef)[] | undefined = undefined) {
    super();

    this.datalib = undefined;

    if (lst == undefined)
      return;

    if (lst instanceof Array) {
      for (var i = 0; i < lst.length; i++) {
        if (lst[i] == undefined) continue;

        this.push(lst[i]);
      }
    } else if (Symbol.iterator in lst) {
      for (var b of lst) {
        this.push(b);
      }
    }
  }

  [Symbol.iterator](): DataRefListIter {
    return new DataRefListIter(this, new Context());
  }

  //we don't want all of ctx, just the current datalib
  set ctx(ctx: {datalib: DataLib} | undefined) {
    this.datalib = ctx.datalib;
  }

  get ctx(): {datalib: DataLib} | undefined {
    return undefined;
  }

  /*funnily enough, I didn't realize until now that my grammar
    can handle methods named 'get' or 'set'.  I didn't make
    them keywords because I didn't want to lose those two names
    for variables, but it's kindof cool I can use them for methods,
    too*/
  get(i: int, return_block = true) {
    if (return_block) {
      var dl = this.datalib != undefined ? this.datalib : g_app_state.datalib;
      return dl.get(this[i]);
    } else {
      return this[i];
    }
  }

  push(b: DataBlock | DataRef) {
    if (!(b = this._b(b))) return;

    if (b instanceof DataBlock)
      b = new DataRef(b);

    super.push(new DataRef(b));
  }

  /* Coerces a block or a ref to a ref, or warns and returns undefined. */
  _b(b: DataBlock | DataRef | undefined) {
    if (b == undefined) {
      warntrace("WARNING: undefined passed to DataRefList.push()");
      return;
    }

    if (b instanceof DataBlock) {
      return new DataRef(b);
    } else if (b instanceof DataRef) {
      return b;
    } else {
      warntrace("WARNING: bad value ", b, " passed to DataRefList._b()");
    }
  }

  remove(b: DataBlock | DataRef) {
    if (!(b = this._b(b))) return;
    var i = this.indexOf(b);

    if (i < 0) {
      warntrace("WARNING: ", b, " not found in this DataRefList");
      return;
    }

    this.pop(i);
  }

  pop(i: int, return_block = true) {
    var ret = super.pop(i);

    if (return_block)
      ret = new Context().datalib.get(ret.id);

    return ret;
  }

  replace(a: DataBlock | DataRef, b: DataBlock | DataRef) {
    if (!(b = this._b(b))) return;

    var i = this.indexOf(a);
    if (i < 0) {
      warntrace("WARNING: ", b, " not found in this DataRefList");
      return;
    }

    this[i] = b;
  }

  indexOf(b: DataBlock | DataRef) {
    super.indexOf(b);

    if (!(b = this._b(b))) return;

    for (var i = 0; i < this.length; i++) {
      if (this[i].id == b.id)
        return i;
    }

    return -1;
  }

  //inserts *before* index
  insert(index: int, b: DataBlock | DataRef) {
    if (!(b = this._b(b))) return;

    super.insert(b);
  }

  prepend(b: DataBlock | DataRef) {
    if (!(b = this._b(b))) return;

    super.prepend(b);
  }

  static fromSTRUCT(reader: StructReader<{list?: DataRef[]}>) {
    var ret: {list?: DataRef[]} = {};
    reader(ret);

    return new DataRefList(ret.list);
  }
}

mixin(DataRefList, TPropIterable);

DataRefList.STRUCT = `
  DataRefList {
    list : array(i, dataref(DataBlock)) | this[i];
  }
`;
