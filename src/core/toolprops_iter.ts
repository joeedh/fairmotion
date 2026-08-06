"use strict";

import {STRUCT} from './struct.js';
import type {FullContext} from './context.js';
import type {DataBlock, DataRef} from './lib_api.js';

/*
  Iterator Tool property design:
  
  Fundamentally, iterator properties are collections
  whose data is resolved on access (not unlike the 
  datapath api).  The logical way to do this would be
  to implement a DataPathIterProperty class, that would
  take an arbitrary datapath to an iterator.
  
  Unfortunately, I don't really know what the rules or
  use cases are going to be, yet.  Until then, I shall
  stick with writing each iterator manually, and perhaps
  write the generic version later.
  
  So.  The single rule of iter properties is that the iterators
  they contain must not store direct references into the data 
  state *until they start iterating*.  Rather, they must store 
  lookup values like eid's, dataref's, etc.
  
  To make things even more complicated, we are not going to have
  separate iterator factory objects (e.g. with their own [Symbol.iterator] methods).
  Instead, each iter class will iterate on it own, as well as be able to 
  spawn copies of itself for nested iteration.
  
  This means iterators have to store direct references while
  iterating, but *only then*.
*/

/* The iterator protocol as the tool system uses it: next() hands back a
   reusable IterRet (see util/utils.ts) rather than TS's IteratorResult union,
   plus an optional reset() and a ctx the collection is resolved against. */
export interface ToolIterLike<T = object> {
  next() : IterRet<T>;

  reset?() : void;

  ctx? : FullContext;
}

//a generic abstract class,
//for container types that can
//be stored directly in tool
//properties.
export abstract class TPropIterable<T = object> {
  constructor() {
  }

  abstract [Symbol.iterator]() : ToolIterLike<T>;

  /* A marker, not a method. The test below is `"_is_tprop_iterable" in obj`, so
     only the name matters -- it is never called. */
  _is_tprop_iterable() {
  }

  static isTPropIterable(obj?: object): obj is TPropIterable {
    return obj !== undefined && "_is_tprop_iterable" in obj;
  }
}
window.TPropIterable = TPropIterable;

export abstract class TCanSafeIter<T = object> {
  constructor() {
  }

  abstract __tooliter__() : TPropIterable<T>;
}

window.TCanSafeIter = TCanSafeIter;

/* `ctx` is declared here rather than in the class body so type_filter_iter can
   implement it as an accessor pair; the constructor still initializes it. */
export interface ToolIter<T = object> {
  ctx? : FullContext;
}

export class ToolIter<T = object> extends TPropIterable<T> {
  static STRUCT : string;

  ret : IterRet<T>;

  /* Classes an iterated item may be an instance of. Empty means unfiltered. */
  itemtypes : Array<Function>;

  constructor(itemtypes? : Array<Function>) {
    super();

    this.itemtypes = itemtypes || [];
    this.ctx = undefined; //is set by IterProperty, which gets it from calling code
    this.ret = new IterRet<T>(); //might try cached_iret() later. . .
    this.ret.done = true;
  }

  /* NOTE: this stub used to fall off the end and return undefined; subclasses
     always override it, and the only ToolIter built directly is the empty one
     fromSTRUCT() makes, so handing back an already-done ret is safer. */
  next() : IterRet<T> {
    //calls this.parent._iter_end at iteration end
    this.ret.done = true;
    return this.ret;
  }

  reset() {
  }

  spawn() { //spawn a copy of this iterator
  }

  /* NOTE: the paranoid ctx.object shortcut that used to live here compared
     `ref.lib_id`, which DataRef has no such property for -- its id is ref[0] --
     so the test was always false and the datalib lookup always ran. */
  //a utility function for child classes
  _get_block(ref : DataRef) : DataBlock | undefined {
    if (this.ctx !== undefined) {
      return this.ctx.datalib.get(ref);
    }
  }
  
  [Symbol.iterator]() {
    return this;
  }
  
  //subclasses are required to implement this
  static fromSTRUCT(reader : StructReader<ToolIter>) {
    var obj = new ToolIter();
    reader(obj);
    return obj;
  }
}
ToolIter.STRUCT = `
  ToolIter {
  }
`;
