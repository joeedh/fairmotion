"use strict";

import {STRUCT} from './struct.js';

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

//a generic abstract class,
//for container types that can
//be stored directly in tool
//properties.
export class TPropIterable {
  constructor() {
  }
  
  [Symbol.iterator]() : ToolIter { }
  _is_tprop_iterable() {
  }
  
  static isTPropIterable(obj) {
    return obj !== undefined && "_is_tprop_iterable" in obj;
  }
}
window.TPropIterable = TPropIterable;

export class TCanSafeIter {
  constructor() {
  }
  
  __tooliter__() : TPropIterable {}
}

window.TCanSafeIter = TCanSafeIter;

export class ToolIter extends TPropIterable {
  ret : Object;

  constructor(itemtypes : Array<Function>) {
    super();
     
    this.itemtypes = itemtypes || [];
    this.ctx = undefined; //is set by IterProperty, which gets it from calling code
    this.ret = {done : true, value : undefined}; //might try cached_iret() later. . .
  }
  
  next() {
    //calls this.parent._iter_end at iteration end
  }
  
  reset() {
  }
  
  spawn() { //spawn a copy of this iterator
  }
  
  //a utility function for child classes
  _get_block(ref) {
    if (this.ctx !== undefined) {
      //a very paranoid test, for edge cases
      //where ctx.object is not the same as
      //ctx.datalib.get(new DataRef(ctx.object))
      //
      //I might get rid of it later.
      if (ref.lib_id === this.ctx.object.lib_id)
        return this.ctx.object;
      else
        return this.ctx.datalib.get(ref);
    }
  }
  
  [Symbol.iterator]() {
    return this;
  }
  
  //subclasses are required to implement this
  static fromSTRUCT(reader) {
    var obj = new ToolIter();
    reader(obj);
    return obj;
  }
}
ToolIter.STRUCT = `
  ToolIter {
  }
`;
