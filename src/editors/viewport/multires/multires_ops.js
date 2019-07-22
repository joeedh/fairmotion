import 'vectormath';

import {IntProperty, FloatProperty, CollectionProperty,
        BoolProperty, TPropFlags, Vec3Property} from 'toolprops';
import {ToolOp, UndoFlags, ToolFlags, ModalStates} from 'toolops_api';
import {SplineFlags, SplineTypes, RecalcFlags} from 'spline_types';
import {RestrictFlags, Spline} from 'spline';
import {TPropFlags} from 'toolprops';
import {redo_draw_sort} from 'spline_draw';

import {SplineLocalToolOp} from 'spline_editops';

import {ensure_multires, MResFlags, BoundPoint, MultiResLayer,
        compose_id, decompose_id, has_multires, iterpoints
       } from 'spline_multires';

export class CreateMResPoint extends SplineLocalToolOp {
  constructor(seg, co) {
    super("create_mres_point", "Add Detail Point", "", -1);
    
    if (seg != undefined) {
      this.inputs.segment.set_data(typeof seg != "number" ? seg.eid : seg);
    }
    
    if (co != undefined) {
      this.inputs.co.set_data(co);
    }
  }
  
  exec(ctx) {
    var spline = ctx.spline;
    var level = this.inputs.level.data;

    console.log("Add mres point! yay!");
    
    ensure_multires(spline);
    var seg = spline.eidmap[this.inputs.segment.data];
    var co = this.inputs.co.data;
    
    static vec = new Vector3();
    var flag = MResFlags.SELECT;
    
    var mr = seg.cdata.get_layer(MultiResLayer);
    
    //deselect existing points
    for (var seg2 of spline.segments) {
      var mr2 = seg2.cdata.get_layer(MultiResLayer);
    
      for (var p2 of mr2.points(level)) {
        p2.flag &= ~MResFlags.SELECT;
      }
    }
    
    console.log(p);
    console.log("S", s);
    
    var p = mr.add_point(level, co);

    var cp = seg.closest_point(co);
    var t=10.0, s=0.5;
    if (cp != undefined) {
      s = cp[1];
      t = cp[0].vectorDistance(co);
      
      vec.zero().load(co).sub(cp[0]);
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
    spline.segments.cdata.get_shared('MultiResLayer').active = id;
  }
}

CreateMResPoint.inputs = {
  segment : new IntProperty(0),
  co      : new Vec3Property(),
  level   : new IntProperty(0)
};

