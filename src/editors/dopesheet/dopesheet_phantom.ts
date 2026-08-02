"use strict";

import {SplineTypes, SplineFlags} from '../../curve/spline_types.js';

import {TimeDataLayer, get_vtime, set_vtime,
        AnimKey, AnimChannel, AnimKeyFlags, AnimInterpModes
       } from '../../core/animdata.js';

export var KeyTypes = {
  PATHSPLINE : 1<<29,
  DATAPATH   : 1<<30,
  CLEARMASK  : ~((1<<29)|(1<<30))
};

export var FilterModes = {
  VERTICES : 1,
  SEGMENTS : 4,
  FACES    : 16
};

export class phantom {
  flag : number
  size : Vector2
  group : string
  id : number;

  constructor() {
    this.flag = 0;

    this.ds = undefined; //dopesheet reference
    
    this.pos = new Vector2(), this.size = new Vector2();
    this.type = KeyTypes.PATHSPLINE;
    this.group = "root";
    
    /*id of element, e.g. splinevertex.eid, animkey.id,
       OR'd with .type, so we can use it as a unique id and
       not have collisions between pathspline and datapath
       keys
    */
    this.id = 0; 
    
    this.e = undefined;
    this.ch = undefined;
  }
  
  get cached_y() {
      return this.ds.heightmap[this.id];
  }
  
  get oldbox() {
      return this.ds.old_keyboxes[this.id];
  }
  
  get select() {
    if (this.type == KeyTypes.PATHSPLINE) {
      return this.v.flag & SplineFlags.UI_SELECT;
    } else {
      return this.key.flag & AnimKeyFlags.SELECT;
    }
  }
  
  set select(val) {
    if (this.type == KeyTypes.PATHSPLINE) {
      this.v.flag |= SplineFlags.UI_SELECT;
    } else {
      if (val) {
        this.key.flag |= AnimKeyFlags.SELECT;
      } else {
        this.key.flag &= ~AnimKeyFlags.SELECT;
      }
    }
  }
  
  load(b) {
    for (var j=0; j<2; j++) {
      this.pos[j] = b.pos[j];
      this.size[j] = b.size[j];
    }
    
    this.id = b.id;
    this.type = b.type;
    this.v = b.v;
    this.vd = b.vd;
    
    //for AnimChannel keys
    this.key = b.key;
    this.ch = b.ch;
  }
}

export function get_time(ctx, id) {
  if (id & KeyTypes.PATHSPLINE) {
    id = id & KeyTypes.CLEARMASK;
    
    var v = ctx.frameset.pathspline.eidmap[id];
    return get_vtime(v);
  } else {
    id = id & KeyTypes.CLEARMASK;
    
    var k = ctx.frameset.lib_anim_idmap[id];
    return k.time;
  }
}

export function set_time(ctx, id, time) {
  if (id & KeyTypes.PATHSPLINE) {
    id = id & KeyTypes.CLEARMASK;

    let spline = ctx.frameset.pathspline;

    var v = spline.eidmap[id];

    set_vtime(spline, v, time);
    v.dag_update("depend");
  } else {
    id = id & KeyTypes.CLEARMASK;
    
    var k = ctx.frameset.lib_anim_idmap[id];
    k.set_time(time);
    
    k.dag_update("depend");
  }
}
export function get_select(ctx, id) {
  if (id & KeyTypes.PATHSPLINE) {
    id = id & KeyTypes.CLEARMASK;
    
    var v = ctx.frameset.pathspline.eidmap[id];
    return v.flag & SplineFlags.UI_SELECT;
  } else {
    id = id & KeyTypes.CLEARMASK;
    
    var k = ctx.frameset.lib_anim_idmap[id];
    return k.flag & AnimKeyFlags.SELECT;
  }
}

export function set_select(ctx, id, state) {
  if (id & KeyTypes.PATHSPLINE) {
    id = id & KeyTypes.CLEARMASK;
    
    var v = ctx.frameset.pathspline.eidmap[id];

    var changed = !!(v.flag & SplineFlags.UI_SELECT) != !!state;
    
    if (state)
      v.flag |= SplineFlags.UI_SELECT;
    else
      v.flag &= ~SplineFlags.UI_SELECT;
    
    if (changed)
      v.dag_update("depend");
  } else {
    id = id & KeyTypes.CLEARMASK;
    
    var k = ctx.frameset.lib_anim_idmap[id];
    
    var changed = !!(k.flag & AnimKeyFlags.SELECT) != !!state;
    
    if (state)
      k.flag |= AnimKeyFlags.SELECT;
    else
      k.flag &= ~AnimKeyFlags.SELECT;
    
    if (changed)
      k.dag_update("depend");
  }
}

export function delete_key(ctx, id) {
  if (id & KeyTypes.PATHSPLINE) {
    id = id & KeyTypes.CLEARMASK;
    
    var pathspline = ctx.frameset.pathspline;
    var v = pathspline.eidmap[id];
    var time = get_vtime(v);
    var kcache = ctx.frameset.kcache;
    
    for (var i=0; i<v.segments.length; i++) {
      var s = v.segments[i], v2 = s.other_vert(v),
              time2 = get_vtime(v2);
      var ts = Math.min(time, time2), te = Math.max(time, time2);
      
      for (var j=ts; j<=te; j++) {
        kcache.invalidate(v2.eid, j);
      }
    }
    
    v.dag_update("depend");
    pathspline.dissolve_vertex(v);
  } else {
    id = id & KeyTypes.CLEARMASK;
    var k = ctx.frameset.lib_anim_idmap[id];
    
    k.dag_update("depend");
    k.channel.remove(k);
  }
}
