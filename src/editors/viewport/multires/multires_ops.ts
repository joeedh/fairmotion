import "../../../path.ux/scripts/util/vectormath.js";

import {
  IntProperty,
  FloatProperty,
  CollectionProperty,
  BoolProperty,
  TPropFlags,
  Vec3Property,
} from "../../../core/toolprops.js";
import { ToolOp, UndoFlags, ToolFlags, ModalStates } from "../../../core/toolops_api.js";
import { SplineFlags, SplineTypes, RecalcFlags, refSeg } from "../../../curve/spline_types.js";
import type { SplineSegment } from "../../../curve/spline_types.js";
import type { FullContext } from "../../../core/context.js";
import type { ToolDef } from "../../../core/toolops_api.js";
import { RestrictFlags, Spline } from "../../../curve/spline.js";
import { redo_draw_sort } from "../../../curve/spline_draw.js";

import { SplineLocalToolOp } from "../spline_editops.js";

import {
  ensure_multires,
  MResFlags,
  BoundPoint,
  MultiResLayer,
  compose_id,
  decompose_id,
  has_multires,
  iterpoints,
  MultiResGlobal,
} from "../../../curve/spline_multires.js";

/* Was `static` inside CreateMResPoint.exec(). */
const _exec_vec = new Vector3();

export class CreateMResPoint extends SplineLocalToolOp<{
  segment: IntProperty;
  co: Vec3Property;
  level: IntProperty;
}> {
  /* NOTE: these were a `CreateMResPoint.inputs = {...}` assignment after the
     class body.  path.ux only ever reads tooldef().inputs, so this.inputs was
     empty and the constructor below threw on every run. */
  static tooldef(): ToolDef {
    return {
      inputs: {
        segment: new IntProperty(0),
        co     : new Vec3Property(),
        level  : new IntProperty(0),
      },
    };
  }

  constructor(seg?: SplineSegment | number, co?: Vector3) {
    super("create_mres_point", "Add Detail Point", "", -1);

    if (seg != undefined) {
      this.inputs.segment.set_data(typeof seg != "number" ? seg.eid : seg);
    }

    if (co != undefined) {
      this.inputs.co.set_data(co);
    }
  }

  exec(ctx: FullContext) {
    var spline = ctx.spline;
    var level = this.inputs.level.data;

    console.log("Add mres point! yay!");

    ensure_multires(spline);
    var seg = refSeg(spline.eidmap, this.inputs.segment.data);
    var co = this.inputs.co.data;

    const vec = _exec_vec;
    var flag = MResFlags.SELECT;

    var mr = seg.cdata.get_layer(MultiResLayer)!;

    //deselect existing points
    for (var seg2 of spline.segments) {
      var mr2 = seg2.cdata.get_layer(MultiResLayer)!;

      for (var p2 of mr2.points(level)) {
        p2.flag &= ~MResFlags.SELECT;
      }
    }

    /* NOTE: two leftover console.log()s of `p` and `s` sat here, above the
       `var`s that assign them, so both only ever printed undefined. */
    var p = mr.add_point(level, co);

    var cp = seg.closest_point(co);
    var t = 10.0,
      s = 0.5;
    if (cp !== undefined) {
      s = cp.s;
      t = cp.co.vectorDistance(co);

      /* NOTE: `vec` is 3d and cp.co is 2d, so subtracting one from the other
         left vec[2] NaN, which poisoned the dot product below and stored a NaN
         `t` on the point.  This op threw in its constructor before the tooldef
         fix above, so the NaN was never reachable. */
      vec.zero();
      vec[0] = co[0] - cp.co[0];
      vec[1] = co[1] - cp.co[1];

      var n = seg.normal(s);

      t *= Math.sign(n.dot(vec));

      p.offset[0] = vec[0];
      p.offset[1] = vec[1];
    } else {
      flag |= MResFlags.UPDATE;
    }

    p.flag = flag;
    p.s = s;
    p.t = t;
    p.seg = seg.eid;

    //set active
    var id = compose_id(p.seg, p.id);
    /* shared_data is a heterogeneous store keyed by layer type; the
       MultiResLayer slot always holds a MultiResGlobal. */
    let shared = spline.segments.cdata.get_shared("MultiResLayer") as MultiResGlobal;
    shared.active = id;
  }
}
