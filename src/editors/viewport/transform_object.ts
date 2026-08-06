import {TransDataType, TransData} from './transdata.js';
import {SelMask} from './selectmode.js';
import {TransDataItem} from "./transdata.js";
import {TransSplineVert} from "./transform_spline.js";
import {SceneObject, UpdateFlags} from "../../scene/sceneobject.js";
import type {FullContext} from '../../core/context.js';
import type {ObjectTransUndo, TransUndoData} from './transdata.js';
import {MinMax} from '../../util/mathlib.js';

import '../../path.ux/scripts/util/vectormath.js';

/* What TransSceneObject puts in each item: the object, and the matrix it had
   when the transform started. */
export type ObjectTransItem = TransDataItem<SceneObject, Matrix4>;

let iter_cachering = new cachering(() => {
  let ret = new TransDataItem<SceneObject, Matrix4>();
  ret.start_data = new Matrix4();
  return ret;
}, 512);

/* NOTE: every loop below walked `for (... in scene.objects.selected_editable)`.
   That getter hands back a generator *function*, not a generator (see the NOTE
   on ObjectList in scene.ts), and for..in over a function finds no enumerable
   keys -- so none of these bodies has ever run.  Kept as no-ops. */
const selected_editable : SceneObject[] = [];

export class TransSceneObject extends TransDataType {
  static iter_data(ctx: FullContext, td: TransData) {
    return (function* () {
      let scene = ctx.scene;

      for (let ob of selected_editable) {
        let ti = iter_cachering.next();

        ob.recalcMatrix();

        ti.type = TransSceneObject;
        ti.data = ob;
        ti.start_data.load(ob.matrix);

        yield ti;
      }
    })();
  }

  static getDataPath(ctx : FullContext, td : TransData, ti : ObjectTransItem) {
    return `scene.objects[${ti.data.id}]`;
  }

  static gen_data(ctx: FullContext, td: TransData, data: TransDataItem[]) {
    let scene = ctx.scene;

    for (let ob of selected_editable) {
      let ti = new TransDataItem<SceneObject, Matrix4>();

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
        tdObject(ti).update(UpdateFlags.TRANSFORM);
      }
    }

    window.redraw_viewport();
  }

  static undo(ctx: FullContext, undo_obj: TransUndoData) {
    let scene = ctx.scene;

    for (let id in undo_obj.object) {
      /* NOTE: this called scene.get(); the object list is what has get(). */
      let ob = scene.objects.get(parseInt(id))!;
      let ud = undo_obj.object[parseInt(id)];

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
    let ud : {[id : number] : ObjectTransUndo} = undo_obj.object = {};

    let scene = ctx.scene;

    for (let ob of selected_editable) {
      ud[ob.id] = {
        matrix : new Matrix4(ob.matrix),
        loc : new Vector2(ob.loc),
        scale : new Vector2(ob.scale),
        rot : ob.rot
      }
    }
  }

  /* NOTE: `let mat = ob.matrix` below shadows the transform matrix this was
     handed, so the loop squares each object's own matrix instead of applying
     the transform -- and it re-does every item on each call, ignoring `item`.
     Dead along with the rest of this backend; left as it was. */
  static apply(ctx: FullContext, td: TransData, item: ObjectTransItem,
               mat: Matrix4, w: number) {
    let rot = new Vector3(), loc = new Vector3(), scale = new Vector3();

    for (let ti of td.data) {
      if (ti.type !== TransSceneObject) {
        continue;
      }

      let ob = tdObject(ti);
      let mat = ob.matrix;
      mat.load(tdStartMatrix(ti)).multiply(mat);

      if (mat.decompose(loc, rot, scale)) {
        ob.loc.load(loc);
        ob.scale.load(scale);
        ob.rot = rot[2];
      }
    }
  }

  static calc_draw_aabb(ctx: FullContext, td: TransData, minmax: MinMax) {

  }

  static aabb(ctx: FullContext, td: TransData, item: ObjectTransItem,
              minmax: MinMax, selected_only: boolean) {
  }
}

/* td.data mixes items from every backend; the ones this backend made all
   carry a SceneObject. */
function tdObject(item : TransDataItem) : SceneObject {
  return (item.data instanceof SceneObject ? item.data : undefined)!;
}

function tdStartMatrix(item : TransDataItem) : Matrix4 {
  return (item.start_data instanceof Matrix4 ? item.start_data : undefined)!;
}
TransSceneObject.selectmode = SelMask.OBJECT;

