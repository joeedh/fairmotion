"use strict";

import {PropTypes} from 'toolprops';
import {STRUCT} from 'struct';

import {CustomDataLayer, SplineTypes, SplineFlags} from 'spline_types';
import {DataPathNode} from 'eventdag';

import 'struct';

/*okay.  spline frame define geometry per-frame,
  but not *animation*
 */

export class TimeDataLayer extends CustomDataLayer {
  constructor() {
    CustomDataLayer.call(this);
    
    this.time = 1.0;
  }
  
  interp(srcs, ws) {
    this.time = 0.0;
    
    for (var i=0; i<srcs.length; i++) {
      this.time += srcs[i].time*ws[i];
    }
  }
  
  static fromSTRUCT(reader) {
    var ret = STRUCT.chain_fromSTRUCT(TimeDataLayer, reader);
    
    return ret;
  }
}

TimeDataLayer.STRUCT = STRUCT.inherit(TimeDataLayer, CustomDataLayer) + """
    time : float;
  }
""";
TimeDataLayer.layerinfo = {
  type_name : "TimeDataLayer"
};

export function get_vtime(v) {
  var ret = v.cdata.get_layer(TimeDataLayer);
  
  if (ret != undefined)
    return ret.time;
  return -1;
}

export function set_vtime(v, time) {
  var ret = v.cdata.get_layer(TimeDataLayer);
  
  if (ret != undefined) {
    ret.time = time;
  }
}

export var AnimKeyFlags = {
  SELECT : 1
}

export var AnimInterpModes = {
  STEP    : 1,
  CATMULL : 2,
  LINEAR  : 4
}

import {IntProperty, FloatProperty} from 'toolprops';
import {DataTypes, DataNames} from 'lib_api';

//generic animation curve system, used for interpolating non-spatial stuff
//where tying to the pathspline vertices (as we do with time) is not appropriate
export class AnimKey extends DataPathNode {
  constructor() {
    this.id = -1;
    this.flag = 0
    this.time = 1.0;
    this.mode = AnimInterpModes.STEP;
    this.data = undefined;
    
    this.channel = undefined; //owning channel
  }
  
  dag_get_datapath(ctx) {
    var owner = this.channel.owner;
    var path;
    
    if (owner.lib_id <= -1) {
      //okay, this datablock isn't actually in the datalib,
      //it's direct data of another datablock.  lets assume it
      //has a .dag_get_datapath method. :) evil!
      path = owner.dag_get_datapath();
    } else {
      var name = DataNames[owner.lib_type].toLowerCase();
      path = "datalib." + name + ".items[" + owner.lib_id + "]";
    }
    
    path += ".animkeys[" + this.id + "]";
    
    return path;
  }
  
  set_time(time) {
    this.time = time;
    this.channel.resort = true;
  }
  
  static fromSTRUCT(reader) {
    var ret = new AnimKey();
    reader(ret);
    return ret;
  }
}

define_static(AnimKey, "dag_inputs", {
});

define_static(AnimKey, "dag_outputs", {
  "depend" : undefined,
  "id"     : 0.0
});

AnimKey.STRUCT = """
  AnimKey {
    id   : int;
    flag : int;
    time : float;
    mode : int;
    data : abstract(ToolProperty);
  }
""";

//import {PropTypes} from 'toolprops';

export class AnimChannel {
    constructor(proptype, name, path) {
      this.keys = [];
      this.resort = false;
      this.proptype = proptype;
      this.name = name == undefined ? "unnamed" : name;
      this.path = path;
      
      this.owner = undefined;
      
      //these two members are references to the owning datablock's 
      //lib_anim_idgen and lib_anim_idmap members
      this.idgen = undefined; //is set by client code
      this.idmap = undefined; //is set by client code
    }
    
    remove(key) {
      delete this.idmap[key.id];
      this.keys.remove(key);
      this.resort = true;
    }
    
    _do_resort() {
      this.keys.sort(function(a, b) {
        return a.time - b.time;
      });
      
      this.resort = false;
    }
    
    get_propcls() {
      if (this.propcls == undefined) {
        switch(this.proptype) {
          case PropTypes.INT:
            this.propcls = IntProperty;
            break;
          case PropTypes.FLOAT:
            this.propcls = FloatProperty;
            break;
        }
      }
      
      return this.propcls;
    }
    
    update(time, val) {
      if (this.resort) {
        this._do_resort();
      }
      
      for (var i=0; i<this.keys.length; i++) {
        if (this.keys[i].time == time) {
          this.keys[i].data.set_data(val);
          return;
        }
      }
      
      var propcls = this.get_propcls();
      
      var key = new AnimKey();

      key.id = this.idgen.gen_id();
      this.idmap[key.id] = key;
      
      key.channel = this;
      key.data = new propcls();
      key.data.set_data(val);
      key.time = time;
      
      this.keys.push(key);
      
      this._do_resort();
    }
    
    eval(time) {
      if (this.resort) {
        this._do_resort();
      }
      
      for (var i=0; i<this.keys.length; i++) {
        var k = this.keys[i];
        if (k.time > time) {
          break;
        }
      }
      
      var prev = i == 0 ? this.keys[i] : this.keys[i-1];
      var key = i == this.keys.length ? this.keys[this.keys.length-1] : this.keys[i];
      
      var t;
      if (prev.time != key.time) {
        t = (time - prev.time) / (key.time - prev.time);
      } else {
        t = 1.0;
      }
      
      //for now, just assume we're interpolating numbers
      var a = prev.data.data, b = key.data.data;
      
      var ret;
      if (key.mode == AnimInterpModes.STEP)
        ret = a;
      else
        ret = a + (b - a)*t;
      
      if (this.proptype == PropTypes.INT)
        ret = Math.floor(ret+0.5);
      
      return ret;
    }
    
    static fromSTRUCT(reader) {
      var ret = new AnimChannel();
      reader(ret);
      
      for (var i=0; i<ret.keys.length; i++) {
        ret.keys[i].channel = ret;
      }
      
      return ret;
    }
}
AnimChannel.STRUCT = """
  AnimChannel {
    name     : string;
    keys     : array(AnimKey);
    proptype : int;
    path     : string;
  }
"""