"use strict";

/*
SCRAPPED
*/

import {STRUCT} from '../../core/struct.js';
import {SelMask} from './selectmode.js';
import {SplineTypes} from '../../curve/spline_base.js';
import type {FullContext} from '../../core/context.js';

/*
* note to self: DONT ACCESS VIEW2D IN THESE CLASSES
* */

/*After my experience with using direct property wrapper for the dopesheet editior,
* I'm going to try an indexed approach
*
* ei = element identifier
* */

/* Uniform read/write surface over one kind of editable element, addressed by
   an "element identifier" (ei) -- for splines, the eid. */
export class WorkObjectType {
  ctx : FullContext;
  /* SelMask bits limiting which element kinds this view exposes. */
  selmode : number;

  constructor(ctx : FullContext, selmode : number) {
    this.ctx = ctx;
    this.selmode = selmode;
  }

  setSelMode(mode : number) {
    this.selmode = mode;
  }

  findnearest(ctx : FullContext, p : Vector2) {
    throw new Error("implement findnearest!");
  }

  iterKeys() {
    throw new Error("want element key iter");
  }

  get length() {
    throw new Error("need length");
  }

  setCtx(ctx : FullContext) {
    this.ctx = ctx;
    return this;
  }

  //allowed to return temporary (cachering) values
  getPos(ei : number) {
    throw new Error("want a Vector2 for pos");
  }

  setPos(ei : number, pos : Vector3) {
    throw new Error("want to set pos");
  }

  //allowed to return temporary (cachering) values
  getBounds(ei : number) {
    throw new Error("want [Vector2, Vector2], min/max bounds")
  }

  getSelect(ei : number) {
    throw new Error("want boolean");
  }

  setSelect(ei : number, state : boolean) {
    throw new Error("want to set selection");
  }

  getVisible(ei : number) {
    return this.getHide(ei);
  }

  getHide(ei : number) {
    throw new Error("want to get hide");
  }

  setHide(e1 : number, state : boolean) {
    throw new Error("want to set hide");
  }
};

let pos_tmps = cachering.fromConstructor(Vector3, 64);

function concat_iterator<T>(iter1 : Iterable<T> | undefined,
                            iter2 : Iterable<T> | undefined) {
  if (iter2 === undefined) {
    return iter1;
  } else if (iter1 === undefined) {
    return iter2;
  }

  return (function*() {
    for (let item of iter1) {
      yield item;
    }

    for (let item of iter2) {
      yield item;
    }
  })();
}

export class WorkSpline extends WorkObjectType {
  /* When false, iterKeys() is limited to the active layer. */
  edit_all_layers : boolean;

  constructor(ctx : FullContext, selmode : number, edit_all_layers : boolean) {
    super(ctx, selmode);

    this.edit_all_layers = edit_all_layers;
  }

  iterKeys() {
    let ctx = this.ctx;
    let selmode = this.selmode;
    let spline = ctx.spline;

    let iter = undefined;
    if (selmode & SelMask.VERTEX) {
      iter = concat_iterator(iter, spline.verts.editable(ctx));
    }
    if (selmode & SelMask.HANDLE) {
      iter = concat_iterator(iter, spline.handles.editable(ctx));
    }
    if (selmode & SelMask.SEGMENT) {
      iter = concat_iterator(iter, spline.segments.editable(ctx));
    }
    if (selmode & SelMask.FACE) {
      iter = concat_iterator(iter, spline.faces.editable(ctx));
    }

    return (function*() {
      for (let item of iter) {
        yield item.eid;
      }
    })();
  }

  iterSelectedKeys() {
    let ctx = this.ctx;
    let selmode = this.selmode;
    let spline = ctx.spline;

    let iter = undefined;
    if (selmode & SelMask.VERTEX) {
      iter = concat_iterator(iter, spline.verts.selected.editable(ctx));
    }
    if (selmode & SelMask.HANDLE) {
      iter = concat_iterator(iter, spline.handles.selected.editable(ctx));
    }
    if (selmode & SelMask.SEGMENT) {
      iter = concat_iterator(iter, spline.segments.selected.editable(ctx));
    }
    if (selmode & SelMask.FACE) {
      iter = concat_iterator(iter, spline.faces.selected.editable(ctx));
    }

    return (function*() {
      for (let item of iter) {
        yield item.eid;
      }
    })();
  }

  get length() {
    throw new Error("need length");
  }

  findnearest(ctx : FullContext, p : Vector2) {
    throw new Error("implement findnearest!");
  }

  //allowed to return temporary (cachering) values
  getPos(ei : number) {
    let spline = this.ctx.spline;
    let e = spline.eidmap[ei];

    if (e === undefined) {
      console.warn("Bad element index", ei, "for spline", spline);
      return undefined; //bad ei
    }

    if (e.type == SplineTypes.VERTEX || e.type == SplineTypes.HANDLE) {
      //return straight reference, verts/handles have Vector mixin
      return e;
    } else if (e.type == SplineTypes.SEGMENT) {
      let p = pos_tmps.next().zero();

      p.load(e.evaluate(0.5));

      return p;
    } else if (e.type == SplineTypes.FACE) {
      let p = pos_tmps.next().zero();

      return p.load(e.aabb[0]).interp(e.aabb[1], 0.5);
    } else {
      console.warn("bad element type for", e, "type at error time was:", e.type);
      throw new Error("bad element type" + e.type)
    }

    throw new Error("want a Vector2 for pos");
  }

  setPos(ei : number, pos : Vector3) {
    let spline = this.ctx.spline;
    let e = spline.eidmap[ei];

    if (e === undefined) {
      console.warn("Bad element index", ei, "for spline", spline);
      return false;
    }

    if (e.type == SplineTypes.VERTEX || e.type == SplineTypes.HANDLE) {
      e.load(pos);

      return true;
    } else if (e.type == SplineTypes.SEGMENT) {
      let p = this.getPos(ei);
      p.sub(pos).negate();

      e.v1.add(p);
      e.v2.add(p);

      return true;
    } else if (e.type == SplineTypes.FACE) {
      /* NOTE: `p` is undeclared here (the SEGMENT branch above declares its
         own with `let`), so this writes a global. */
      p = this.getPos(ei);
      p.sub(pos).negate();

      for (let v of e.verts) {
        v.add(p);
      }

      return true;
    } else {
      console.warn("bad element type for", e, "type at error time was:", e.type);
      throw new Error("bad element type" + e.type)
    }

    return false;
  }

  getBounds(ei : number) {
    throw new Error("want [Vector2, Vector2], min/max bounds")
  }

  getSelect(ei : number) {
    throw new Error("want boolean");
  }

  setSelect(ei : number, state : boolean) {
    throw new Error("want to set selection");
  }

  getVisible(ei : number) {
    throw new Error("implement me");
  }

  getHide(ei : number) {
    throw new Error("want to hide");
  }

  setHide(e1 : number, state : boolean) {
    throw new Error("want to set hide");
  }
};

