"use strict";

import {SplineTypes, SplineFlags, refVert} from '../../curve/spline_types.js';

import {TimeDataLayer, get_vtime, set_vtime,
        AnimKey, AnimChannel, AnimKeyFlags, AnimInterpModes
       } from '../../core/animdata.js';
import type {DopeSheetEditor} from './DopeSheetEditor.js';
import type {SplineVertex} from '../../curve/spline_types.js';
import type {FullContext} from '../../core/context.js';

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

/* NOTE: a `phantom` class -- one drawable key box, either a pathspline vertex
   or an AnimChannel key -- sat here.  Nothing ever constructed or imported it,
   and its cached_y/oldbox getters read `heightmap` and `old_keyboxes` off the
   editor, neither of which DopeSheetEditor has. */

/* Phantom DATAPATH ids index the map channels and keys share; every id the
   dopesheet hands out in that space belongs to a key. */
function animKey(ctx : FullContext, id : number) : AnimKey {
  let k = ctx.frameset.lib_anim_idmap[id];
  return (k instanceof AnimKey ? k : undefined)!;
}

export function get_time(ctx : FullContext, id : number) {
  if (id & KeyTypes.PATHSPLINE) {
    id = id & KeyTypes.CLEARMASK;

    var v = refVert(ctx.frameset.pathspline.eidmap, id);
    return get_vtime(v);
  } else {
    id = id & KeyTypes.CLEARMASK;

    var k = animKey(ctx, id);
    return k.time;
  }
}

export function set_time(ctx : FullContext, id : number, time : number) {
  if (id & KeyTypes.PATHSPLINE) {
    id = id & KeyTypes.CLEARMASK;

    let spline = ctx.frameset.pathspline;

    var v = refVert(spline.eidmap, id);

    set_vtime(spline, v, time);
    v.dag_update("depend");
  } else {
    id = id & KeyTypes.CLEARMASK;

    var k = animKey(ctx, id);
    k.set_time(time);

    k.dag_update("depend");
  }
}
export function get_select(ctx : FullContext, id : number) {
  if (id & KeyTypes.PATHSPLINE) {
    id = id & KeyTypes.CLEARMASK;

    var v = refVert(ctx.frameset.pathspline.eidmap, id);
    return v.flag & SplineFlags.UI_SELECT;
  } else {
    id = id & KeyTypes.CLEARMASK;

    var k = animKey(ctx, id);
    return k.flag & AnimKeyFlags.SELECT;
  }
}

export function set_select(ctx : FullContext, id : number,
                           state : number | boolean) {
  if (id & KeyTypes.PATHSPLINE) {
    id = id & KeyTypes.CLEARMASK;

    var v = refVert(ctx.frameset.pathspline.eidmap, id);

    var changed = !!(v.flag & SplineFlags.UI_SELECT) != !!state;

    if (state)
      v.flag |= SplineFlags.UI_SELECT;
    else
      v.flag &= ~SplineFlags.UI_SELECT;

    if (changed)
      v.dag_update("depend");
  } else {
    id = id & KeyTypes.CLEARMASK;

    var k = animKey(ctx, id);

    var changed = !!(k.flag & AnimKeyFlags.SELECT) != !!state;

    if (state)
      k.flag |= AnimKeyFlags.SELECT;
    else
      k.flag &= ~AnimKeyFlags.SELECT;

    if (changed)
      k.dag_update("depend");
  }
}

export function delete_key(ctx : FullContext, id : number) {
  if (id & KeyTypes.PATHSPLINE) {
    id = id & KeyTypes.CLEARMASK;

    var pathspline = ctx.frameset.pathspline;
    var v = refVert(pathspline.eidmap, id);
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
    var k = animKey(ctx, id);

    k.dag_update("depend");
    k.channel!.remove(k);
  }
}
