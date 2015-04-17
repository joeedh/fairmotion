import {SplineFrameSet} from 'frameset';
import {Scene} from 'scene';
import {DataTypes} from 'lib_api';

//low-level stuff

//this function shouldn't be manual; need to automate it
export var get_data_typemap = function() {
  var obj = {};
  
  obj[DataTypes.FRAMESET] = SplineFrameSet;
  obj[DataTypes.SCENE] = Scene;
  
  return obj;
}
