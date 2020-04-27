import {SplineFrameSet} from './frameset.js';
import {Scene} from '../scene/scene.js';
import {DataTypes} from './lib_api.js';
import {Image} from './imageblock.js';
import {Spline} from '../curve/spline.js';

//low-level stuff

//this function shouldn't be manual; need to automate it
export var get_data_typemap = function() {
  var obj = {};
  
  obj[DataTypes.FRAMESET] = SplineFrameSet;
  obj[DataTypes.SCENE] = Scene;
  obj[DataTypes.IMAGE] = Image;
  obj[DataTypes.SPLINE] = Spline;
  
  return obj;
}
