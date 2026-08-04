import {TransDataType, TransData} from './transdata.js';
import {SelMask} from './selectmode.js';
import {TransDataItem} from "./transdata.js";
import {TransSplineVert} from "./transform_spline.js";
import {UpdateFlags} from "../../scene/sceneobject.js";
import type {FullContext} from '../../core/context.js';
import type {TransUndoData} from './transdata.js';

import '../../path.ux/scripts/util/vectormath.js';

let iter_cachering = new cachering(() => {
  let ret = new TransDataItem();
  ret.start_data = new Matrix4();
  return ret;
}, 512);

export class TransSceneObject extends TransDataType {
  static iter_data(ctx: FullContext, td: TransData) {
    return (function* () {
      let scene = ctx.scene;

      for (let ob in scene.objects.selected_editable) {
        let ti = iter_cachering.next();

        ob.recalcMatrix();

        ti.type = TransSceneObject;
        ti.data = ob;
        ti.start_data.load(ob.matrix);

        yield ti;
      }
    })();
  }

  static getDataPath(ctx : FullContext, td : TransData, ti : TransDataItem) {
    return `scene.objects[${ti.data.id}]`;
  }

  static gen_data(ctx: FullContext, td: TransData, data: TransDataItem[]) {
    let scene = ctx.scene;

    for (let ob in scene.objects.selected_editable) {
      let ti = new TransDataItem();

      ob.recalcMatrix();

      ti.type = TransSceneObject;
      ti.data = ob;
      ti.start_data = new Matrix4(ob.matrix);

      data.push(ti);
    }
  }

  static calc_prop_distances(ctx: FullContext, td: TransData, data: TransDataItem[]) {

  }

  static update(ctx: FullContext, td: TransData) {
    for (let ti of td.data) {
      if (ti.type === TransSceneObject) {
        ti.data.update(UpdateFlags.TRANSFORM);
      }
    }

    window.redraw_viewport();
  }

  static undo(ctx: FullContext, undo_obj: TransUndoData) {
    let scene = ctx.scene;

    for (let id in undo_obj.object) {
      let ob = scene.get(id);
      let ud = undo_obj.object[id];

      ob.loc.load(ud.loc);
      ob.scale.load(ud.scale);
      ob.rot = ud.rot;
      ob.matrix.load(ud.matrix);
      ob.update();

      ob.recalcAABB();
    }

    window.redraw_viewport();
  }

  static undo_pre(ctx: FullContext, td: TransData, undo_obj: TransUndoData) {
    let ud = undo_obj["object"] = {};

    let scene = ctx.scene;

    for (let ob in scene.objects.selected_editable) {
      ud[ob.id] = {
        matrix : new Matrix4(ob.matrix),
        loc : new Vector2(ob.loc),
        scale : new Vector2(ob.scale),
        rot : ob.rot
      }
    }
  }

  static apply(ctx: FullContext, td: TransData, item: TransDataItem,
               mat: Matrix4, w: number) {
    let rot = new Vector3(), loc = new Vector3(), scale = new Vector3();

    for (let ti of td.data) {
      if (ti.type !== TransSceneObject) {
        continue;
      }

      let ob = ti.data;
      let mat = ob.matrix;
      mat.load(ti.start_data).multiply(mat);

      if (mat.decompose(loc, rot, scale)) {
        ob.loc.load(loc);
        ob.scale.load(scale);
        ob.rot = rot[2];
      }
    }
  }

  static calc_draw_aabb(ctx: FullContext, td: TransData, minmax: MinMax) {

  }

  static aabb(ctx: FullContext, td: TransData, item: TransDataItem,
              minmax: MinMax, selected_only: boolean) {
  }
}
TransSceneObject.selectmode = SelMask.OBJECT;

