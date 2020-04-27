import {TransDataType} from './transdata.js';
import {SelMask} from './selectmode.js';
import {TransSceneObject} from './transform_object.js';
import {TransSplineVert} from './transform_spline.js';

export function getTransDataType(ctx : Context) {
  if (ctx.view2d.selectmode == SelMask.OBJECT) {
    return TransSceneObject;
  } else {
    return TransSplineVert;
  }
}

