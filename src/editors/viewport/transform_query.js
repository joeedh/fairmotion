import {TransDataType} from 'transdata';
import {SelMask} from 'selectmode';
import {TransSceneObject} from 'transform_object';
import {TransSplineVert} from 'transform_spline';

export function getTransDataType(ctx : Context) {
  if (ctx.view2d.selectmode == SelMask.OBJECT) {
    return TransSceneObject;
  } else {
    return TransSplineVert;
  }
}

