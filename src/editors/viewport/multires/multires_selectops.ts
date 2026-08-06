"use strict";

import '../../../path.ux/scripts/util/vectormath.js';

import {IntProperty, FloatProperty, CollectionProperty,
        BoolProperty, TPropFlags, Vec3Property} from '../../../core/toolprops.js';
import {ToolOp, UndoFlags, ToolFlags, ModalStates} from '../../../core/toolops_api.js';
import {SplineFlags, SplineTypes, RecalcFlags} from '../../../curve/spline_types.js';
import {RestrictFlags, Spline} from '../../../curve/spline.js';
import {redo_draw_sort} from '../../../curve/spline_draw.js';

import {SplineLocalToolOp} from '../spline_editops.js';

import {ensure_multires, has_multires, MResFlags,
        compose_id, decompose_id, BoundPoint,
        MultiResLayer, MultiResGlobal
       } from '../../../curve/spline_multires.js';
import type {FullContext} from '../../../core/context.js';
import type {ToolDef} from '../../../core/toolops_api.js';
import type {PropertySlots} from '../../../path.ux/scripts/pathux.js';

class SelectOpBase<
  InputSlots extends PropertySlots = PropertySlots,
  OutputSlots extends PropertySlots = PropertySlots,
> extends ToolOp<InputSlots & {level : IntProperty}, OutputSlots> {
  /* Composed point ids (see compose_id) that were selected before the op ran. */
  declare _undo : number[];
  /* Multires level _undo was taken at; the op's `level` input may change. */
  _undo_level! : number;

  constructor(actlevel? : number, uiname? : string, description? : string,
              icon? : number) {
    super();

    if (actlevel != undefined)
      this.inputs.level.set_data(actlevel);
  }

  /* NOTE: `level` was declared by a `SelectOpBase.inputs = {...}` assignment
     after the class body.  path.ux only ever reads tooldef().inputs, so
     this.inputs.level was undefined and the constructor above threw on every
     multires select op. */
  static tooldef() : ToolDef {
    return {
      inputs : {
        level : new IntProperty(0)
      }
    }
  }

  static canRun(ctx : FullContext) {
    var spline = ctx.spline;
    return has_multires(spline);
  }

  undo_pre(ctx : FullContext) {
    var ud : number[] = this._undo = [];
    this._undo_level = this.inputs.level.data;

    var spline = ctx.spline;
    var actlayer = spline.layerset.active;
    var level = this.inputs.level.data;

    if (!has_multires(spline))
      return;

    //only consider visible segments inside the active layer
    for (var seg of spline.segments) {
      if (seg.hidden) continue;
      if (!(actlayer.id in seg.layers)) continue;

      /* has_multires() above guarantees the layer is present. */
      var mr = seg.cdata.get_layer(MultiResLayer)!;
      for (var p of mr.points(level)) {
        if (p.flag & MResFlags.SELECT)
          ud.push(compose_id(seg.eid, p.id));
      }
    }

    window.redraw_viewport();
  }

  undo(ctx : FullContext) {
    var spline = ctx.spline;
    var actlayer = spline.layerset.active;
    var level = this._undo_level;

    if (!has_multires(spline))
      return;

    //only consider visible segments inside the active layer
    for (var seg of spline.segments) {
      if (seg.hidden) continue;
      if (!(actlayer.id in seg.layers)) continue;

      var mr = seg.cdata.get_layer(MultiResLayer)!;
      for (var p of mr.points(level)) {
        p.flag &= ~MResFlags.SELECT;
        p.flag &= ~MResFlags.HIGHLIGHT;
      }
    }

    for (var i=0; i<this._undo.length; i++) {
      var id = this._undo[i];

      let eid = decompose_id(id)[0];
      let pid = decompose_id(id)[1];

      let useg = spline.eidmap[eid];
      if (useg == undefined) {
        console.trace("Eek! bad seg eid!", useg, pid, id, this, this._undo);
        continue;
      }

      let umr = useg.cdata.get_layer(MultiResLayer)!;

      umr.get(pid).flag |= MResFlags.SELECT;
    }

    window.redraw_viewport();
  }
}

/*
export class ToggleSelectAll extends SelectOpBase {
  constructor(actlevel : int=0) {
    super(actlevel, "Select All", "Select all/none");
  }

  static canRun(ctx) {
    var spline = ctx.spline;
    return has_multires(spline);
  }

  exec(ctx) {
    var spline = ctx.spline;
    var actlayer = spline.layerset.active;
    var level = this.inputs.level.data;

    if (!has_multires(spline))
      return;

    var totsel = 0;

    //only consider visible segments inside the active layer
    for (var seg of spline.segments) {
      if (seg.hidden) continue;
      if (!(actlayer.id in seg.layers)) continue;

      var mr = seg.cdata.get_layer(MultiResLayer);
      for (var p of mr.points(level)) {
        if (p.flag & MResFlags.HIDE)
          continue;

        totsel += p.flag & MResFlags.SELECT;
      }
    }

    for (var seg of spline.segments) {
      if (seg.hidden) continue;
      if (!(actlayer.id in seg.layers)) continue;

      var mr = seg.cdata.get_layer(MultiResLayer);
      for (var p of mr.points(level)) {
        if (p.flag & MResFlags.HIDE)
          continue;

        if (totsel)
          p.flag &= ~MResFlags.SELECT;
        else
          p.flag |= MResFlags.SELECT;
      }
    }
  }
}
ToggleSelectAll.inputs = {
  level : new IntProperty(0)
}
 */

export class SelectOneOp extends SelectOpBase<{
  pid        : IntProperty,
  state      : BoolProperty,
  set_active : BoolProperty,
  unique     : BoolProperty
}> {
  static tooldef() : ToolDef {
    return {
      inputs : ToolOp.inherit({
        pid       : new IntProperty(-1),
        state     : new BoolProperty(true),
        set_active: new BoolProperty(true),
        unique    : new BoolProperty(true),
        level     : new IntProperty(0)
      })
    }
  }

  constructor(pid? : number, unique = true, mode = true, level = 0) {
    super(level, "Select One", "select one element");

    this.inputs.unique.set_data(unique);
    this.inputs.state.set_data(mode);

    if (pid != undefined)
      this.inputs.pid.set_data(pid);
  }

  exec(ctx : FullContext) {
    var spline = ctx.spline;
    var actlayer = spline.layerset.active;
    var id = this.inputs.pid.data;
    var level = this.inputs.level.data;

    let eid = decompose_id(id)[0];
    let pid = decompose_id(id)[1];

    let seg = spline.eidmap[eid];
    let mr = seg.cdata.get_layer(MultiResLayer)!;
    let p = mr.get(pid);

    if (this.inputs.unique.data) {
      //only consider visible segments inside the active layer
      for (var seg2 of spline.segments) {
        if (seg2.hidden) continue;
        if (!(actlayer.id in seg2.layers)) continue;

        var mr2 = seg2.cdata.get_layer(MultiResLayer)!;
        for (var p2 of mr2.points(level)) {
          p2.flag &= ~SplineFlags.SELECT;
        }
      }
    }

    var state = this.inputs.state.data;

    if (state && this.inputs.set_active.data) {
      /* shared_data is a heterogeneous store keyed by layer type; the
         MultiResLayer slot always holds a MultiResGlobal. */
      var shared = spline.segments.cdata.get_shared("MultiResLayer") as MultiResGlobal;
      shared.active = id;
    }

    if (state) {
      p.flag |= SplineFlags.SELECT;
    } else {
      p.flag &= ~SplineFlags.SELECT;
    }
  }
}
