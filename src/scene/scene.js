import {STRUCT} from 'struct';
import {DataBlock, DataTypes} from 'lib_api';
import {SplineFrameSet} from "../core/frameset";

export class Scene extends DataBlock {
  constructor() {
    super(DataTypes.SCENE);

    this.framesets = [];

    this.active_splinepath = "frameset.drawspline";
    this.time = 1;
  }
  
  change_time(ctx, time, _update_animation=true) {
    if (isNaN(this.time)) {
      console.log("EEK corruption!");
      this.time = ctx.frameset.time;
      
      if (isNaN(this.time))
        this.time = 0;
        
      if (isNaN(time))
        time = 0;
    }
    
    if (isNaN(time)) return;
    
    if (time == this.time)
      return;
      
    if (time < 1) {
       time = 1;
    }
    
    //console.log("Time change! Old time: ", this.time, ", new time: ", time);
    this.time = time;
    
    ctx.frameset.change_time(time, _update_animation);
    
    //handle datapath keyframes
    ctx.api.onFrameChange(ctx, time);
  }
  
  copy() : Scene {
    var ret = new Scene();
    
    ret.time = this.time;
    
    return ret;
  }
  
  static fromSTRUCT(reader) {
    var ret = STRUCT.chain_fromSTRUCT(Scene, reader);

    ret.afterSTRUCT();
    
    if (ret.active_splinepath == "frameset.active_spline")
      ret.active_splinepath = "frameset.drawspline";
      
    return ret;
  }
  
  data_link(block, getblock, getblock_us) {
    DataBlock.prototype.data_link.apply(this, arguments);

    for (let i=0; i<this.framesets.length; i++) {
      this.framesets[i] = getblock_us(this.framesets[i]);
    }
    //if (this.active_splinepath != undefined)
    //  g_app_state.switch_active_spline(this.active_splinepath);
  }
}

Scene.STRUCT = STRUCT.inherit(Scene, DataBlock) + `
    time              : float;
    active_splinepath : string;
    framesets         : array(dataref(SplineFrameSet));
  }
`;
