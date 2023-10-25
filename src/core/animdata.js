"use strict";

import {PropTypes} from './toolprops.js';
import {STRUCT} from './struct.js';

import {CustomDataLayer, SplineTypes, SplineFlags} from '../curve/spline_base.js';
import {DataPathWrapperNode} from './eventdag.js';

/*id is an integer id,
* note that it may refer to both an AnimChannel and one
* of that channel's keys*/
export function getDataPathKey(ctx: BaseContext, id: number) {
  let datalib = ctx.datalib;

  for (let block of datalib.allBlocks) {
    if (id in block.lib_anim_idmap) {
      return block.lib_anim_idmap[id];
    }
  }
}

export const AnimKeyTypes = {
  SPLINE  : 0,
  DATAPATH: 1
};

export const AnimKeyFlags = {
  SELECT: 1
};

export let AnimInterpModes = {
  STEP   : 1,
  CATMULL: 2,
  LINEAR : 4
}

export class TimeDataLayer extends CustomDataLayer {
  time: number;

  constructor() {
    super();

    this.owning_veid = -1;
    this.time = 1.0;
  }

  interp(srcs, ws) {
    this.time = 0.0;

    if (srcs.length > 0) {
      this.owning_veid = srcs[0].owning_veid;
    }

    for (let i = 0; i < srcs.length; i++) {
      this.time += srcs[i].time*ws[i];
    }
  }

  loadSTRUCT(reader) {
    reader(this);
    super.loadSTRUCT(reader);
  }

  static define() {
    return {
      typeName: "TimeDataLayer"
    }
  }
}

TimeDataLayer.STRUCT = STRUCT.inherit(TimeDataLayer, CustomDataLayer) + `
    time         : float;
    owning_veid  : int;
  }
`;


export function get_vtime(v) {
  let ret = v.cdata.get_layer(TimeDataLayer);

  if (ret !== undefined)
    return ret.time;
  return -1;
}

export function set_vtime(spline, v, time) {
  let ret = v.cdata.get_layer(TimeDataLayer);

  if (ret !== undefined) {
    ret.time = time;

    spline.flagUpdateVertTime(v);
  }
}

import {IntProperty, FloatProperty} from './toolprops.js';
import {DataTypes, DataNames} from './lib_api.js';

/* Generic animation curve system; used for interpolating non-spatial
   stuff where tying to the pathspline vertices (as we do with time)
   is not appropriate.
 */
export class AnimKey extends DataPathWrapperNode {
  flag: number
  time: number
  handles: Array<number>;

  constructor() {
    super();

    this.id = -1;
    this.flag = 0

    this.time = 1.0;
    this.handles = [0, 0];

    this.mode = AnimInterpModes.STEP;
    this.data = undefined;

    this.owner_eid = -1; //used by spline code only

    this.channel = undefined; //owning channel
  }

  dag_get_datapath(ctx) {
    let owner = this.channel.owner;
    let path;

    if (owner.lib_id <= -1) {
      //okay, this datablock isn't actually in the datalib,
      //it's direct data of another datablock.  lets assume it
      //has a .dag_get_datapath method. :) evil!
      path = owner.dag_get_datapath();
    } else {
      let name = DataNames[owner.lib_type].toLowerCase();
      path = "datalib.items[" + owner.lib_id + "]";
    }

    path += ".animkeys[" + this.id + "]";

    return path;
  }

  set_time(time) {
    this.time = time;
    this.channel.resort = true;
  }

  static fromSTRUCT(reader) {
    let ret = new AnimKey();
    reader(ret);
    return ret;
  }

  static nodedef() {
    return {
      name   : "AnimKey",
      inputs : {},
      outputs: {
        "depend": undefined,
        "id"    : 0.0
      }
    }
  }
}


AnimKey.STRUCT = `
  AnimKey {
    owner_eid : int;
    id        : int;
    flag      : int;
    time      : float;
    mode      : int;
    handles   : array(float);
    data      : abstract(ToolProperty);
  }
`;

//import {PropTypes} from 'toolprops';

export class AnimChannel {
  resort: boolean;

  constructor(proptype, name, path) {
    this.keys = [];
    this.resort = false;
    this.proptype = proptype;
    this.name = name === undefined ? "unnamed" : name;
    this.path = path;
    this.id = -1;

    this.owner = undefined;

    //these two members are references to the owning datablock's
    //lib_anim_idgen and lib_anim_idmap members
    this.idgen = undefined; //is set by client code
    this.idmap = undefined; //is set by client code
  }

  add(key) {
    if (key.id === -1) {
      key.id = this.idgen.gen_id();
    }

    this.idmap[key.id] = key;
    this.keys.push(key);

    return this;
  }

  remove(key) {
    delete this.idmap[key.id];
    this.keys.remove(key);
    this.resort = true;

    return this;
  }

  _do_resort() {
    this.keys.sort(function (a, b) {
      return a.time - b.time;
    });

    this.resort = false;
  }

  get_propcls() {
    if (this.propcls === undefined) {
      switch (this.proptype) {
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

    for (let i = 0; i < this.keys.length; i++) {
      if (this.keys[i].time === time) {
        this.keys[i].data.setValue(val);
        return this.keys[i];
      }
    }

    let propcls = this.get_propcls();

    let key = new AnimKey();

    key.id = this.idgen.gen_id();
    this.idmap[key.id] = key;

    key.channel = this;
    key.data = new propcls();
    key.data.setValue(val);
    key.time = time;

    this.keys.push(key);
    this._do_resort();

    return key;
  }

  evaluate(time) {
    if (this.resort) {
      this._do_resort();
    }

    for (let i = 0; i < this.keys.length; i++) {
      let k = this.keys[i];
      if (k.time > time) {
        break;
      }
    }

    let prev = i === 0 ? this.keys[i] : this.keys[i - 1];
    let key = i === this.keys.length ? this.keys[this.keys.length - 1] : this.keys[i];

    let t;
    if (prev.time !== key.time) {
      t = (time - prev.time)/(key.time - prev.time);
    } else {
      t = 1.0;
    }

    //for now, just assume we're interpolating numbers
    let a = prev.data.data, b = key.data.data;

    let ret;
    if (key.mode === AnimInterpModes.STEP)
      ret = a;
    else
      ret = a + (b - a)*t;

    if (this.proptype === PropTypes.INT)
      ret = Math.floor(ret + 0.5);

    return ret;
  }

  static fromSTRUCT(reader) {
    let ret = new AnimChannel();
    reader(ret);

    for (let i = 0; i < ret.keys.length; i++) {
      ret.keys[i].channel = ret;
    }

    return ret;
  }
}

AnimChannel.STRUCT = `
  AnimChannel {
    name     : string;
    keys     : array(AnimKey);
    proptype : int;
    path     : string;
    id       : int;
  }
`
