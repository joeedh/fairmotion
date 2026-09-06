/* A selection set that stores eids rather than elements, so it survives a
   reload and can be handed to a ToolOp as a property, plus the iterator that
   resolves those eids back to elements against a spline's eidmap. */

import { ToolIter, TPropIterable } from "../../core/toolprops_iter.js";
import { SplineTypes } from "../spline_base.js";

import type { FullContext } from "../../core/context.js";
import type { Spline } from "../spline.js";
import type { SplineElement } from "../spline_base.js";

//stores elements as eid's, for tool operators
export class ElementRefIter extends ToolIter<SplineElement> {
  static STRUCT: string;

  ret: IterRet<SplineElement>;
  eset!: ElementRefSet;
  ctx?: FullContext;
  spline: Spline | undefined;
  iter: Iterator<number> | undefined;
  nextitem: SplineElement | undefined;
  i!: number;
  /* Only exists between reader(ret) and the delete in fromSTRUCT(). */
  saved_items?: number[];

  constructor() {
    super();

    this.ret = new IterRet<SplineElement>();
    this.spline = this.ctx = this.iter = undefined;
  }

  init(eset: ElementRefSet) {
    this.ret.done = false;
    this.nextitem = undefined;

    this.eset = eset;
    this.ctx = eset != undefined ? eset.ctx : undefined;
    this.spline = this.ctx != undefined ? this.ctx.spline : undefined;

    return this;
  }

  spawn() {
    var ret = new ElementRefIter();
    ret.init(this.eset);
    return ret;
  }

  next() {
    var ret = this.ret;

    if (this.spline == undefined) this.spline = this.ctx!.spline;
    if (this.iter == undefined) this.iter = set.prototype[Symbol.iterator].call(this.eset);

    const spline = this.spline!;
    const iter = this.iter!;

    let next: IteratorResult<number> | undefined;
    let e: SplineElement | undefined = undefined;

    /* The loop breaks on `done`, so the only way back to this test is with
       a live item. */
    do {
      next = iter.next();
      if (next.done) break;

      e = spline.eidmap[next.value];
      if (e == undefined) {
        console.log("Warning, bad eid", next.value);
      }
    } while (e == undefined);

    if (e == undefined || next.done == true) {
      this.spline = undefined;
      this.iter = undefined;

      ret.done = true;
      ret.clear();
    } else {
      ret.value = e;
    }

    return ret;
  }

  reset() {
    this.i = 0;
    this.ret.done = false;
    this.spline = undefined;
    this.iter = undefined;
  }

  [Symbol.iterator]() {
    return this;
  }

  /* NOTE: `ret.add()` below is ElementRefSet's method, not ElementRefIter's --
     and the schema's `mask` field lives on the set too. This whole
     fromSTRUCT looks like it was copied from ElementRefSet. */
  static fromSTRUCT(reader: StructReader<ElementRefIter>) {
    var ret = new ElementRefIter();
    reader(ret);

    /* `saved_items` is a STRUCT field, so the reader above filled it in. */
    const items = ret.saved_items!;

    for (var i = 0; i < items.length; i++) {
      Reflect.get(ret, "add").call(ret, items[i]);
    }
    delete ret.saved_items;

    return ret;
  }
}

ElementRefIter.STRUCT = `
  ElementRefIter {
    mask        : int;
    saved_items : iter(int) | obj;
  }
`;

export class ElementRefSet extends set<SplineElement | number> {
  mask: number;
  itercaches!: cachering<ElementRefIter>;
  /* Stamped on by IterProperty (toolprops.ts) before it iterates us. */
  ctx?: FullContext;

  constructor(mask?: number) {
    super();

    this.mask = mask == undefined ? SplineTypes.ALL : mask;
  }

  add(item: SplineElement | number) {
    var start_item = item;
    if (!(typeof item == "number" || item instanceof Number)) item = item.eid;

    if (item == undefined) {
      console.trace("ERROR in ElementRefSet!!", start_item);
      return;
    }

    set.prototype.add.call(this, item);
  }

  copy() {
    var ret = new ElementRefSet(this.mask);

    for (var eid of set.prototype[Symbol.iterator].call(this)) {
      ret.add(eid);
    }

    return ret;
  }

  [Symbol.iterator]() {
    if (this.itercaches == undefined) {
      this.itercaches = cachering.fromConstructor(ElementRefIter, 8);
    }

    return this.itercaches.next().init(this);
  }
}

mixin(ElementRefSet, TPropIterable);
