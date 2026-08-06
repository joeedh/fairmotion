"use strict";

import { MinMax } from "../../util/mathlib.js";

import type { FullContext } from "../../core/context.js";
import type { TransformOp } from "./transform.js";
import type { SplineLayer } from "../../curve/spline_element_array.js";

/* What TransSceneObject remembers about one object. */
export interface ObjectTransUndo {
  matrix: Matrix4;
  loc: Vector2;
  scale: Vector2;
  rot: number;
}

/* Scratch object a TransformOp hands to every TransDataType's undo_pre(),
   then back to its undo().  Each type namespaces its own entries by key, and
   only the type that wrote a key ever reads it -- hence all optional. */
export type TransUndoData = {
  /* Written by TransformOp.undo_pre() itself, before any backend runs. */
  edit_all_layers?: boolean;
  /* TransSplineVert: flat [eid, w1, w2] and [eid, x, y] records. */
  sseg?: number[];
  svert?: number[];
  /* TransSceneObject, keyed by object id. */
  object?: { [id: number]: ObjectTransUndo };
  /* TransMultiRes: flat [composed point id, x, y] records. */
  mr_undo?: number[];
};

export class TransDataItem<Data = unknown, StartData = unknown> {
  w: number;
  /* The element being transformed -- a SplineVertex, a SceneObject, a
     dopesheet key -- and whatever snapshot its type took of it.  Each
     TransDataType names its own payload; the shared bag leaves them unknown
     and recovers the kind with instanceof. */
  data: Data;
  start_data: StartData;
  type: typeof TransDataType;
  /* Distance to the nearest selected element, for proportional edit; -1
     means "not a proportional-falloff participant". */
  dis: number;

  constructor(data?: Data, type?: typeof TransDataType, start_data?: StartData) {
    /* `!` erases at runtime, so a bare new TransDataItem() still leaves these
       undefined exactly as it did before -- transform_object relies on it. */
    this.data = data!;
    this.start_data = start_data!;

    this.type = type!;

    //for proportional transform (magnet tool)
    this.w = 1;
    this.dis = -1;
  }
}

export class TransDataType {
  /* Which SelMask bits this backend handles; set on each subclass below the
     class body. */
  static selectmode: number;

  static apply(
    ctx: FullContext,
    td: TransData,
    item: TransDataItem,
    mat: Matrix4,
    w: number,
    scaleWidths?: boolean
  ) {}

  static undo_pre(ctx: FullContext, td: TransData, undo_obj: TransUndoData) {}

  static getDataPath(ctx: FullContext, td: TransData, ti: TransDataItem): string | undefined {
    return undefined;
  }

  static undo(ctx: FullContext, undo_obj: TransUndoData) {}

  static update(ctx: FullContext, td: TransData) {}

  static calc_prop_distances(ctx: FullContext, td: TransData, data: TransDataItem[]) {}

  static gen_data(ctx: FullContext, td: TransData, data: TransDataItem[]) {}

  static iter_data(ctx: FullContext, td: TransData): Iterable<TransDataItem> {
    let data: TransDataItem[] = [];
    this.gen_data(ctx, td, data);

    return data;
  }

  //this one gets a modal context
  static calc_draw_aabb(ctx: FullContext, td: TransData, minmax: MinMax) {}

  static aabb(
    ctx: FullContext,
    td: TransData,
    item: TransDataItem,
    minmax: MinMax,
    selected_only: boolean
  ) {}
}
TransDataType.selectmode = -1;

export class TransData {
  data: GArray<TransDataItem>;
  undodata: TransUndoData;
  center: Vector2;
  start_center: Vector2;
  minmax: MinMax;
  /* Screen-space copies of center/start_center; only filled in while the
     owning op is running modally. */
  scenter: Vector2;
  start_scenter!: Vector2;

  ctx: FullContext;
  top: TransformOp;
  /* SelMask bits this transform is editing. */
  datamode: number;
  edit_all_layers: boolean;
  layer: SplineLayer;
  types: (typeof TransDataType)[];
  /* Proportional (magnet) edit state, copied off the op's inputs. */
  doprop: boolean;
  propradius: number;

  constructor(ctx: FullContext, top: TransformOp, datamode: number) {
    this.ctx = ctx;
    this.top = top;
    this.datamode = datamode;

    this.edit_all_layers = top.inputs.edit_all_layers.data;

    this.layer = ctx.spline.layerset.active;
    this.types = top.types;
    this.data = new GArray();
    this.undodata = {};

    this.doprop = top.inputs.proportional.data;
    this.propradius = top.inputs.propradius.data;

    this.center = new Vector2();
    this.scenter = new Vector2(); //screen center
    this.start_center = new Vector2();

    this.minmax = new MinMax(2);

    for (let t of this.types) {
      if (datamode & t.selectmode) {
        t.gen_data(ctx, this, this.data);
      }
    }

    if (this.doprop) this.calc_propweights();

    for (let d of this.data) {
      d.type.aabb(ctx, this, d, this.minmax, true);
    }

    if (top.inputs.use_pivot.data) {
      this.center.load(top.inputs.pivot.data);
    } else {
      this.center.load(this.minmax.max).add(new Vector2(this.minmax.min)).mulScalar(0.5);
    }

    this.start_center.load(this.center);

    if (top.modalRunning) {
      /* These were Vector3s; view2d.project() and every scenter consumer only
         ever touch indices 0 and 1, so the z slot was always a dead zero. */
      this.scenter = new Vector2(this.center);
      this.start_scenter = new Vector2(this.start_center);

      ctx.view2d.project(this.scenter);
      ctx.view2d.project(this.start_scenter);
    }
  }

  calc_propweights(radius: number = this.propradius) {
    this.propradius = radius;

    for (let t of this.types) {
      if (t.selectmode & this.datamode) t.calc_prop_distances(this.ctx, this, this.data);
    }

    let r = radius;
    for (let tv of this.data) {
      if (tv.dis === -1) continue;

      tv.w = tv.dis > r ? 0 : 1.0 - tv.dis / r;
    }
  }
}
