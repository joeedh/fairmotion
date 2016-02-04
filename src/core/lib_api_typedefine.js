import {SplineFrameSet} from 'frameset';
import {Scene} from 'scene';
import {DataTypes} from 'lib_api';
import {Image} from 'imageblock';
import {Spline} from 'spline';

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
