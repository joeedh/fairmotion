"use strict";

import "../editors/events.js";
import "./toolprops_iter.js";

import { STRUCT } from "./struct.js";
import { EventHandler } from "../editors/events.js";
import { charmap } from "../editors/events.js";

/* NOTE: DataBlock was never imported here at all.  The old transpiler put every
   module in one scope so the bare name resolved; under ES modules each
   `x instanceof DataBlock` below threw a ReferenceError, which took
   DataRefList.push() and _b() with it.  lib_api imports nothing that leads back
   to this file, so a value import is safe. */
import { DataBlock } from "./lib_api.js";
import type { DataLib, GetBlockFunc, GetBlockUserFunc } from "./lib_api.js";
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

/* NOTE: a DBList class -- a GArray of datablocks with an idmap, a selection set
   and an active block -- lived here.  Nothing outside this file ever imported or
   constructed one and it was never registered with nstructjs, so neither its
   STRUCT nor its dead toJSON/fromJSON pair could run.  Its push() and select()
   also named a bare `DataBlock` and `SELECT` that resolve to nothing under ES
   modules, and its pop(i) called Array.prototype.pop, which takes no argument
   and drops the last element rather than element i. */

/* NOTE: a DataArrayRem() factory sat here, with no callers. */

/* NOTE: a SceneObjRem() factory sat here.  It had no callers and unparented
   through a bare `ASObject` that has not been in scope since the module split. */

/* The default unlink callback: the block that held the reference forgets it.
   Note the quoted "field" -- see the finding in docs/debugging.md. */
function DataRem(dst: DataBlock, field: string) {
  function rem() {
    Reflect.set(dst, "field", undefined);
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
  return function (
    dataref: DataRef | undefined,
    block: DataBlock,
    fieldname: string,
    add_user?: boolean,
    refname?: string,
    rem_func?: () => void
  ) {
    if (dataref == undefined) return;

    if (rem_func == undefined) rem_func = DataRem(block, fieldname);

    if (refname == undefined) refname = fieldname;

    var id = dataref[0];
    //var lib_id = dataref[1];

    if (id == -1) {
      return undefined;
    } else {
      var b = datalib.get(id);

      if (b != undefined) {
        if (add_user) b.lib_adduser(block, refname, rem_func);
      } else {
        warntrace(
          [
            "WARNING WARNING WARNING saved block reference isn't in database!!!",
            "  dataref: ",
          ].join("\n"),
          dataref
        );
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
        warntrace(
          [
            "WARNING WARNING WARNING saved block reference isn't in database!!!",
            "  dataref: ",
          ].join("\n"),
          dataref
        );
      }

      return b;
    }
  };
}

/*
  DataRefList.  A simple container for block references.
  Most of the API will accept either a block or a DataRef.

  The element type is the union only because pop() hands a block back; push()
  itself only ever stores DataRefs.
*/
export class DataRefList extends GArray<DataRef | DataBlock> {
  static STRUCT: string;

  /* Whose library get()/pop() resolve against. Written through the `ctx`
     setter; falls back to g_app_state.datalib while it is unset. */
  datalib: DataLib | undefined;

  constructor(
    lst: Iterable<DataBlock | DataRef> | (DataBlock | DataRef)[] | undefined = undefined
  ) {
    super();

    this.datalib = undefined;

    if (lst == undefined) return;

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

  /* NOTE: a [Symbol.iterator]() that returned `new DataRefListIter(this, new
     Context())` -- resolving each stored ref to its block as it was reached --
     sat here.  DataRefListIter was never imported, so it threw a ReferenceError
     on any for..of, and TypeScript cannot re-type Array's own iterator on a
     subclass anyway.  Iterating a DataRefList now yields the stored refs. */

  //we don't want all of ctx, just the current datalib
  set ctx(ctx: { datalib: DataLib } | undefined) {
    this.datalib = ctx!.datalib;
  }

  get ctx(): { datalib: DataLib } | undefined {
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
      /* push() only ever stores DataRefs. */
      let ref = (this[i] instanceof DataRef ? this[i] : undefined)!;
      return dl.get(ref);
    } else {
      return this[i];
    }
  }

  push(b: DataBlock | DataRef): number {
    let ref = this._b(b);
    /* NOTE: the bare `return` this replaced handed back undefined; Array.push is
       declared to return the new length, and no caller reads either. */
    if (!ref) return this.length;

    /* NOTE: _b() has already turned a block into a ref, so the
       `if (b instanceof DataBlock) b = new DataRef(b)` that sat here was dead --
       and this still re-wraps the ref a second time, as it always has. */
    return super.push(new DataRef(ref));
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

  /* `ignore_existence` is accepted only because GArray.remove() declares it;
     it has never been consulted here. */
  remove(b: DataBlock | DataRef, ignore_existence?: boolean): this {
    let ref = this._b(b);
    if (!ref) return this;

    var i = this.indexOf(ref);

    if (i < 0) {
      warntrace("WARNING: ", ref, " not found in this DataRefList");
      return this;
    }

    this.pop(i);
    return this;
  }

  pop(i = -1, return_block = true) {
    /* NOTE: GArray has never overridden pop() -- it has pop_i() -- so the
       `super.pop(i)` this replaced discarded the *last* element rather than
       element i, the argument being ignored by Array.prototype.pop. */
    let ret: DataRef | DataBlock | undefined = super.pop();

    if (return_block)
      /* NOTE: DataRef has no `id` -- its block id is ref[0] -- so this lookup
         has always been for undefined. */
      ret = new Context().datalib.get(Reflect.get(ret!, "id"));

    return ret;
  }

  replace(a: DataBlock | DataRef, b: DataBlock | DataRef) {
    let ref = this._b(b);
    if (!ref) return;

    var i = this.indexOf(a);
    if (i < 0) {
      warntrace("WARNING: ", ref, " not found in this DataRefList");
      return;
    }

    this[i] = ref;
  }

  indexOf(b: DataBlock | DataRef, fromIndex?: number): number {
    super.indexOf(b);

    let ref = this._b(b);
    /* NOTE: the bare `return` this replaced handed back undefined, which the
       callers below then tested with `< 0` -- always false -- and used as an
       index.  They all bail on a bad ref before getting here now. */
    if (!ref) return -1;

    for (var i = 0; i < this.length; i++) {
      /* NOTE: neither DataRef nor DataBlock has an `id` (a ref's is ref[0], a
         block's is lib_id), so this compares undefined with undefined and
         matches element 0 for any argument. */
      if (Reflect.get(this[i], "id") == Reflect.get(ref, "id")) return i;
    }

    return -1;
  }

  //inserts *before* index
  insert(index: int, b: DataBlock | DataRef): this {
    let ref = this._b(b);
    if (!ref) return this;

    /* NOTE: this called super.insert(b) -- one argument, where GArray.insert
       takes (index, item) -- so it stored `undefined` under a DataRef-keyed
       property and bumped length.  Nothing calls insert(); corrected. */
    super.insert(index, ref);
    return this;
  }

  prepend(b: DataBlock | DataRef) {
    let ref = this._b(b);
    if (!ref) return;

    super.prepend(ref);
  }

  static fromSTRUCT(reader: StructReader<{ list?: DataRef[] }>) {
    var ret: { list?: DataRef[] } = {};
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
