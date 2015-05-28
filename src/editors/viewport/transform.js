import {
  MinMax
} from 'mathlib';

import {USE_NACL} from 'config';

import {TPropFlags} from 'toolprops';
import {SplineFlags, SplineTypes} from 'spline_types';
import {ModalStates} from 'toolops_api';

import {TransDataItem, TransDataType} from 'transdata';
import {TransDopeSheetType} from 'dopesheet_transdata';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, KeyHandler, 
        charmap, TouchEventManager, EventHandler} from 'events';

import {clear_jobs, clear_jobs_except_latest, clear_jobs_except_first, 
        JobTypes} from 'nacl_api';

export class TransSplineVert {
  static apply(ToolContext ctx, TransData td, TransDataItem item, Matrix4 mat, float w) {
    static co = new Vector3();
    var v = item.data;

    if (w == 0.0) return;

    co.load(item.start_data);
    co[2] = 0.0;
    co.multVecMatrix(mat);
    
    v.load(co).sub(item.start_data).mulScalar(w).add(item.start_data);
    v.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
    
    if (v.type == SplineTypes.HANDLE) {
      var seg = v.owning_segment;
      
      seg.update();
      seg.flag |= SplineFlags.FRAME_DIRTY;
      seg.v1.flag |= SplineFlags.UPDATE;
      seg.v2.flag |= SplineFlags.UPDATE;
      
      var hpair = seg.update_handle(v);

      if (hpair != undefined) {
        hpair.flag |= SplineFlags.FRAME_DIRTY;
      }
    } else {
      for (var j=0; j<v.segments.length; j++) {
        v.segments[j].flag |= SplineFlags.FRAME_DIRTY;
        v.segments[j].h1.flag |= SplineFlags.FRAME_DIRTY;
        v.segments[j].h2.flag |= SplineFlags.FRAME_DIRTY;
        
        v.segments[j].update();
        var hpair = v.segments[j].update_handle(v.segments[j].handle(v));

        if (hpair != undefined) {
          hpair.flag |= SplineFlags.FRAME_DIRTY;
        }
      }
    }
    
    /*
    if (v.type == SplineTypes.HANDLE) { // && v.owning_vertex.segments.length == 2
    //          && v.use && !(v.flag & SplineFlags.BREAK_TANGENTS)) 
    //{
      var h2 = v.owning_vertex.other_segment(v.owning_segment).handle(v.owning_vertex);
      var hv = h2.owning_segment.handle_vertex(h2);
      
//      if (!(h2.flag & SplineFlags.SELECT)) {
        var len = h2.vectorDistance(hv);
        h2.load(v).sub(hv).negate().normalize().mulScalar(len).add(hv);
        h2.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
  //    }
    }*/
  }
  
  static undo_pre(ToolContext ctx, TransData td, ObjLit undo_obj) {
    var doneset = new set();
    var undo = [];
    
    function push_vert(v) {
      if (doneset.has(v))
        return;
        
      doneset.add(v);
      
      undo.push(v.eid);
      undo.push(v[0]);
      undo.push(v[1]);
      undo.push(v[2]);
    }
    
    for (var i=0; i<td.data.length; i++) {
      var d = td.data[i];
      
      if (d.type !== TransSplineVert) continue;
      
      var v = d.data;
      
      //make sure we get all handles that might be affected by this one
      if (v.type == SplineTypes.HANDLE) {
        if (v.hpair != undefined) {
          push_vert(v.hpair);
        }
        
        if (v.owning_vertex.segments.length == 2) {
          var ov = v.owning_vertex;
          for (var j=0; j<ov.segments.length; j++) {
            var s = ov.segments[j];
            
            push_vert(s.h1);
            push_vert(s.h2);
          }
        }
      }
      
      push_vert(v);
    }
    
    undo_obj['svert'] = undo;
  }
  
  static undo(ToolContext ctx, ObjLit undo_obj) {
    var spline = ctx.spline;
    
    var i = 0;
    var undo = undo_obj['svert'];
    while (i < undo.length) {
      var eid = undo[i++];
      var v = spline.eidmap[eid];
      
      if (v == undefined) {
        console.log("Transform undo error!", eid);
        i += 4;
        continue;
      }
      
      v[0] = undo[i++];
      v[1] = undo[i++];
      v[2] = undo[i++];
      
       if (v.type == SplineTypes.HANDLE && !v.use) {
          var seg = v.segments[0];
          
          seg.update();
          seg.flag |= SplineFlags.FRAME_DIRTY;
          
          seg.v1.flag |= SplineFlags.UPDATE;
          seg.v2.flag |= SplineFlags.UPDATE;
      } else if (v.type == SplineTypes.VERTEX) {
        v.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
        
        for (var j=0; j<v.segments.length; j++) {
          v.segments[j].update();
          v.segments[j].flag |= SplineFlags.FRAME_DIRTY;
          v.segments[j].h1.flag |= SplineFlags.FRAME_DIRTY;
          v.segments[j].h2.flag |= SplineFlags.FRAME_DIRTY;
        }
      }
    }
    
    spline.resolve = 1;
  }
  
  static update(ToolContext ctx, TransData td) {
    var spline = ctx.spline;
    spline.resolve = 1;
  }
  
  static calc_prop_distances(ToolContext ctx, TransData td, Array<TransDataItem> data) {
    var doprop = td.doprop;
    var proprad = td.propradius;
    var spline = ctx.spline;
    var propfacs = {};
    var shash = spline.build_shash();
    var tdmap = {};
    var layer = td.layer;
    
    for (var tv of data) {
      if (tv.type !== TransSplineVert) 
        continue;
      
      tdmap[tv.data.eid] = tv;
    }
    
    for (var v of spline.verts.selected.editable) {
      shash.forEachPoint(v, proprad, function(v2, dis) {
        if (v2.flag & SplineFlags.SELECT) return;
        if (v2.hidden) return;
        if (!v2.in_layer(layer))
          return;

        if (!(v2.eid in propfacs)) {
          propfacs[v2.eid] = dis;
        }
        
        propfacs[v2.eid] = Math.min(propfacs[v2.eid], dis);
        v2.flag |= SplineFlags.UPDATE;
      });
    }
    
    for (var k in propfacs) {
      var v = spline.eidmap[k];
      var d = propfacs[k];
      var tv = tdmap[k];
      
      tv.dis = d;
    }
  }
  
  static gen_data(ToolContext ctx, TransData td, Array<TransDataItem> data) {
    var doprop = td.doprop;
    var proprad = td.propradius;
    
    var selmap = {};
    var spline = ctx.spline;
    var tdmap = {};
    var layer = td.layer;
    
    for (var i=0; i<2; i++) {
      for (var v of i ? spline.handles.selected.editable : spline.verts.selected.editable) {
        var co = new Vector3(v);
        
        if (i) {
          var ov = v.owning_segment.handle_vertex(v);
          if (ov != undefined && v.hidden && ov.hidden)
            continue;
        } else if (v.hidden) {
          continue;
        }
        
        selmap[v.eid] = 1;
        
        var td = new TransDataItem(v, TransSplineVert, co);
        
        data.push(td);
        tdmap[v.eid] = td;
      }
    }
    
    console.log("doprop", doprop);
    
    if (!doprop) return;
    
    var propfacs = {};
    var shash = spline.build_shash();
    
    for (var si=0; si<2; si++) {
      var list = si ? spline.handles : spline.verts;
      
      for (var v of list) {
        //only do active layer
        if (!v.in_layer(layer))
          continue;
          
        if (si) {
          var ov = v.owning_segment.handle_vertex(v);
          if (ov != undefined && v.hidden && ov.hidden)
            continue;
        } else if (v.hidden) {
          continue;
        }
        
        if (v.eid in selmap) continue;
        
        var co = new Vector3(v);
        var td = new TransDataItem(v, TransSplineVert, co);
        data.push(td);

        td.dis = 10000;
        tdmap[v.eid] = td;
      }
    }
    
    console.log("proprad", proprad);
    
    for (var v of spline.verts.selected.editable) {
      shash.forEachPoint(v, proprad, function(v2, dis) {
        if (v2.flag & SplineFlags.SELECT) return;
        
        if (!v2.in_layer(layer))
          return;
        
        if (v2.type == SplineTypes.HANDLE && v2.hidden && (v2.owning_vertex == undefined || v2.owning_vertex.hidden))
          return
        if (v2.type == SplineTypes.VERTEX && v2.hidden) 
          return;

        console.log("v2!", v2.eid, dis);
        
        if (!(v2.eid in propfacs)) {
          propfacs[v2.eid] = dis;
        }
        
        propfacs[v2.eid] = Math.min(propfacs[v2.eid], dis);
        v2.flag |= SplineFlags.UPDATE;
        
        for (var i=0; i<v2.segments.length; i++) {
          v2.segments[i].update();
        }
      });
    }
    
    for (var k in propfacs) {
      var v = spline.eidmap[k];
      var d = propfacs[k];
      var tv = tdmap[k];
      
      tv.dis = d;
    }
  }
  
  //this one gets a modal context
  static calc_draw_aabb(Context, TransData td, MinMax minmax) {
    var vset = {};
    var sset = {};
    var hset = {};

    for (var i=0; i<td.data.length; i++) {
      var d = td.data[i];
      if (d.type != TransSplineVert)
        continue;
      if (d.data.type == SplineTypes.HANDLE)
        hset[d.data.eid] = 1;
    }
    
    function rec_walk(v, depth) {
      if (depth > 2) return;
      if (v == undefined) return;
      if (v.eid in vset) return;
      
      vset[v.eid] = 1;
      minmax.minmax(v);
      
      for (var i=0; i<v.segments.length; i++) {
        var seg = v.segments[i];
        
        if (!(seg.eid in sset)) {
          sset[seg.eid] = 1;
          seg.update_aabb();
          
          minmax.minmax(seg.aabb[0]);
          minmax.minmax(seg.aabb[1]);
        }
        
        var v2 = seg.other_vert(v);
        
        //don't override roots
        if (v2 != undefined && (v2.flag & SplineFlags.SELECT))
          continue;
          
        if (v.type == SplineTypes.HANDLE && !(v.eid in hset)) {
          vset[v.eid] = 1;
        } else {
          rec_walk(seg.other_vert(v), depth+1);
        }
      }
    }
    
    for (var i=0; i<td.data.length; i++) {
      var d = td.data[i];
      if (d.type != TransSplineVert)
        continue;
      
      if (d.w <= 0.0) continue;
      
      var v = d.data;
      if (v.eid in vset) continue;
      
      if (v.type == SplineTypes.HANDLE)
        v = v.owning_vertex;
      
      rec_walk(v, 0);
    }
  }
  
  static aabb(ToolContext ctx, TransData td, TransDataItem item, MinMax minmax, selected_only) {
    static co = new Vector3();
    
    if (item.w <= 0.0) return;
    if (item.data.hidden) return;
    
    co.load(item.data);
    co[2] = 0.0;
    
    minmax.minmax(co);
    
    for (var i=0; i<item.data.segments.length; i++) {
      var seg = item.data.segments[i];
      
      if (selected_only && !(item.data.flag & SplineFlags.SELECT))
        continue;
      
      seg.update_aabb();
      
      minmax.minmax(seg.aabb[0]);
      minmax.minmax(seg.aabb[1]);
    }
  }
}

export class TransData {
  constructor(ctx, top) {
    this.ctx = ctx;
    this.top = top;
    
    this.layer = ctx.spline.layerset.active;
    this.types = top.types;
    this.data = new GArray();
    this.undodata = {};
    
    this.doprop = top.inputs.proportional.data;
    this.propradius = top.inputs.propradius.data;
        
    this.center = new Vector3();
    this.start_center = new Vector3();
    
    this.minmax = new MinMax(3);
    
    for (var t of this.types) {
      t.gen_data(ctx, this, this.data);
    }
    
    if (this.doprop)
      this.calc_propweights();
    
    for (var d of this.data) {
      d.type.aabb(ctx, this, d, this.minmax, true);
    }
    
    this.center.load(this.minmax.max).add(this.minmax.min).mulScalar(0.5);
    this.start_center.load(this.center);
    
    if (top.modal_running) {
      this.scenter = new Vector3(this.center);
      this.start_scenter = new Vector3(this.start_center);
      
      ctx.view2d.project(this.scenter);
      ctx.view2d.project(this.start_scenter);
    }
  }
  
  calc_propweights(radius=this.propradius) {
    this.propradius = radius;
    
    for (var t of this.types) {
      t.calc_prop_distances(this.ctx, this, this.data);
    }
    
    var r = radius;
    for (var tv of this.data) {
      if (tv.dis == -1)
        continue;
      
      tv.w = tv.dis > r ? 0 : 1.0 - tv.dis/r;
    }
  }
}

import {ToolOp} from 'toolops_api';

export class TransformOp extends ToolOp {
  constructor(start_mpos, datamode, apiname, uiname) {
    ToolOp.call(this, apiname, uiname);
    
    this.types = new GArray([TransSplineVert]);
    
    if (start_mpos != undefined && typeof start_mpos != "number" && start_mpos instanceof Array) {
      this.user_start_mpos = start_mpos;
    }
    
    if (datamode != undefined)
      this.inputs.datamode.set_data(datamode);
    
    this.is_modal = true;
    this.modaldata = {};
  }
  
  ensure_transdata(ctx) {
    if (this.transdata == undefined) {
      this.transdata = new TransData(ctx, this);
    }
    
    return this.transdata;
  }
  
  finish(ctx) {
    delete this.transdata;
    delete this.modaldata;
    
    ctx.frameset.on_ctx_update(ctx);
  }
  
  cancel() {
    var ctx = this.modal_ctx;
    this.modal_end();
    
    this.undo(ctx);
  }

  undo_pre(ctx) {
    var td = this.ensure_transdata(ctx);
    
    var undo = this._undo = {};
    for (var i=0; i<this.types.length; i++) {
      this.types[i].undo_pre(ctx, td, undo);
    }
  }
  
  undo(ctx) {
    var undo = this._undo;
    
    for (var i=0; i<this.types.length; i++) {
      this.types[i].undo(ctx, undo);
    }
    
    ctx.frameset.on_ctx_update(ctx);
    window.redraw_viewport();
  }
  
  end_modal() {
    var ctx = this.modal_ctx;
    
    ctx.appstate.set_modalstate(0);
    ToolOp.prototype.end_modal.call(this);
    
    this.finish(ctx);
  }
  
  start_modal(ctx) {
    ToolOp.prototype.start_modal.call(this);
    
    ctx.appstate.set_modalstate(ModalStates.TRANSFORMING);
    
    this.ensure_transdata(ctx);
    this.modaldata = {};
  }
  
  on_mousemove(event) {
    //ToolOp.prototype.on_mousemove.call(this, event);
    var td = this.ensure_transdata(this.modal_ctx);
    var ctx = this.modal_ctx;
    
    var mpos = new Vector3([event.x, event.y, 0]);

    var md = this.modaldata;
    md.draw_minmax = new MinMax(3);
    
    if (md.start_mpos == undefined && this.user_start_mpos != undefined) {
      md.start_mpos = new Vector3(this.user_start_mpos);
      md.start_mpos[2] = 0.0; //ensure non-NaN z
      
      md.last_mpos = new Vector3(md.start_mpos);
      md.mpos = new Vector3(md.start_mpos);
    }
    
    if (md.start_mpos == undefined) {
      md.start_mpos = new Vector3(mpos);
      md.mpos = new Vector3(mpos);
      md.last_mpos = new Vector3(mpos);
    } else {
      md.last_mpos.load(md.mpos);
      md.mpos.load(mpos);
    }
    
    this.draw_helper_lines(md, ctx);
  }
  
  post_mousemove(event) {
    //window.redraw_viewport();
    //return;
    var td = this.transdata;
    var md = this.modaldata;
    var do_last = true;
    
    static min1 = new Vector3(), max1 = new Vector3();
    
    if (md.draw_minmax == undefined) {
      md.draw_minmax = new MinMax(3);
      do_last = false;
    }
    
    var minmax = md.draw_minmax;
    
    min1.load(minmax.min);
    max1.load(minmax.max);
    //static calc_draw_aabb(Context, TransData td, MinMax minmax) {

    minmax.reset();
    
    var ctx = this.modal_ctx;
    for (var i=0; i<td.types.length; i++) {
      td.types[i].calc_draw_aabb(ctx, td, minmax);
    }
    
    for (var i=0; i<3; i++) {
      minmax.min[i] -= 10;
      minmax.max[i] += 10;
    }
    
    for (var i=0; do_last && i<3; i++) {
      min1[i] = Math.min(min1[i], minmax.min[i]);
      max1[i] = Math.max(max1[i], minmax.max[i]);
    }
    
    
    if (!USE_NACL) {
      redraw_viewport(minmax.min, minmax.max);
      return;
    } else if (this._last_solve==undefined || time_ms()-this._last_solve > 60) {
      var spline = ctx.spline;
      
      spline.solve();
      
      redraw_viewport(minmax.min, minmax.max);
      this._last_solve = time_ms();
      return;
    }
    return;
    
    //only allow two running jobs at one time
    clear_jobs_except_first(JobTypes.SOLVE);
    
    //redraw max of current and last min/max
    var promise = ctx.spline.solve_p();
    var spline = ctx.spline;
    
    //it might not be such a bad idea to use the event DAG 
    //for this.

    //redraw on rejections too
    promise.then(function () {
      //if (spline.resolve == 0)
      redraw_viewport(minmax.min, minmax.max);
    }, function() {
      //if (spline.resolve == 0)
      //redraw_viewport(minmax.min, minmax.max);
    });
    
    /*
    promise["catch"](function () {
      redraw_viewport(minmax.min, minmax.max);
      return 1;
    });
    */
  }
  
  draw_helper_lines(ObjLit md, Context ctx) {
    this.reset_drawlines();
    
    //var rad = this.inputs.propradius.data;
    
    if (this.inputs.proportional.data) {
      var rad = this.inputs.propradius.data;
      
      var steps = 64, t = -Math.PI; dt = (Math.PI*2.0)/(steps-1);
      var td = this.transdata;
      
      var v1 = new Vector3(), v2 = new Vector3();
      var r = this.inputs.propradius.data;
      var cent = td.center;
      
      for (var i=0; i<steps-1; i++, t += dt) {
        v1[0] = Math.sin(t)*r + cent[0];
        v1[1] = Math.cos(t)*r + cent[1];
        
        v2[0] = Math.sin(t+dt)*r + cent[0];
        v2[1] = Math.cos(t+dt)*r + cent[1];
        
        var dl = this.new_drawline(v1, v2);
        dl.clr[0] = dl.clr[1] = dl.clr[2] = 0.1;
        dl.clr[3] = 0.01;
        
        dl.width = 2;
      }
    }
  }
  
  on_keydown(event) {
    console.log(event.keyCode);
    
    var propdelta = 15;
    
    switch(event.keyCode) {
      case 189: //minus key
        if (this.inputs.proportional.data) {
          this.inputs.propradius.set_data(this.inputs.propradius.data-propdelta);
          this.transdata.propradius = this.inputs.propradius.data;
          this.transdata.calc_propweights();
          this.modal_ctx.view2d.propradius = this.inputs.propradius.data;

          this.exec(this.modal_ctx);
          this.draw_helper_lines(this.modaldata, this.modal_ctx);
          window.redraw_viewport();
        }
        break;
      case 187: //plus key
        if (this.inputs.proportional.data) {
          this.inputs.propradius.set_data(this.inputs.propradius.data+propdelta);
          this.transdata.propradius = this.inputs.propradius.data;
          this.transdata.calc_propweights();
          this.modal_ctx.view2d.propradius = this.inputs.propradius.data;

          this.exec(this.modal_ctx);
          this.draw_helper_lines(this.modaldata, this.modal_ctx);
          window.redraw_viewport();
        }
        break;
    }
  }
  
  on_mouseup(event) {
    console.log("end transform!");
    this.end_modal();
  }
  
  update(ctx) {
    for (var t of this.transdata.types) {
      t.update(ctx, this.transdata);
    }
  }
}
import {Vec3Property, BoolProperty, FloatProperty, IntProperty,
        CollectionProperty} from 'toolprops';
//import {TPropFlags} from 'toolprops';

TransformOp.inputs = {
  //some TransData backends may use this, e.g. to store integer arrays of
  //visible pathspline vertices in dopesheet editor
  data         : new CollectionProperty([], [], "data", "data", "data", TPropFlags.COLL_LOOSE_TYPE),
    
  proportional : new BoolProperty(false, "proportional", "proportional mode"),
  propradius   : new FloatProperty(80, "propradius", "prop radius"),
  datamode     : new IntProperty(0, "datamode", "datamode")
}

export class TranslateOp extends TransformOp {
  constructor(Array<float> user_start_mpos, datamode) {
    super(user_start_mpos, datamode, "translate", "Translate");
  }
  
  on_mousemove(event) {
    super.on_mousemove(event);

    var md = this.modaldata;
    var ctx = this.modal_ctx;
    var td = this.transdata;
    
    static start = new Vector3();
    static off = new Vector3();
    
    start.load(md.start_mpos);
    off.load(md.mpos);
    
    ctx.view2d.unproject(start);
    ctx.view2d.unproject(off);
    
    off.sub(start);
    this.inputs.translation.set_data(off);
    
    this.exec(ctx);
    this.post_mousemove(event);
  }
  
  exec(ctx) {
    var td = this.modal_running ? this.transdata : this.ensure_transdata(ctx);
    
    static mat = new Matrix4();
    var off = this.inputs.translation.data;
    
    mat.makeIdentity();
    mat.translate(off[0], off[1], 0);
    
    for (var d of td.data) {
      d.type.apply(ctx, td, d, mat, d.w);
    }
    
    this.update(ctx);
    
    if (!this.modal_running) {
      ctx.frameset.on_ctx_update(ctx);
      delete this.transdata;
    }
  }
}

TranslateOp.inputs = ToolOp.inherit_inputs(TransformOp, {
  translation : new Vec3Property(undefined, "translation", "translation", "translation")
});

export class ScaleOp extends TransformOp {
  constructor(Array<float> user_start_mpos, datamode) {
    super(user_start_mpos, datamode, "scale", "Scale");
  }
  
  on_mousemove(event) {
    super.on_mousemove(event);

    var md = this.modaldata;
    var ctx = this.modal_ctx;
    var td = this.transdata;
    
    static scale = new Vector3();
    static off = new Vector3();
    
    var l1 = off.load(md.mpos).sub(td.scenter).vectorLength();
    var l2 = off.load(md.start_mpos).sub(td.scenter).vectorLength();
    
    scale[0] = scale[1] = l1/l2;
    scale[2] = 1.0;
    
    this.inputs.scale.set_data(scale);
    
    this.exec(ctx);
    this.post_mousemove(event);
  }
  
  exec(ctx) {
    var td = this.modal_running ? this.transdata : this.ensure_transdata(ctx);
    
    static mat = new Matrix4();
    var scale = this.inputs.scale.data;
    
    var cent = td.center;
    mat.makeIdentity();
    
    mat.translate(cent[0], cent[1], 0);
    mat.scale(scale[0], scale[1], scale[2]);
    mat.translate(-cent[0], -cent[1], 0);
    
    for (var d of td.data) {
      d.type.apply(ctx, td, d, mat, d.w);
    }
    
    this.update(ctx);
    
    if (!this.modal_running) {
      ctx.frameset.on_ctx_update(ctx);
      delete this.transdata;
    }
  }
}

ScaleOp.inputs = ToolOp.inherit_inputs(TransformOp, {
  scale : new Vec3Property(undefined, "scale", "scale", "scale")
});


export class RotateOp extends TransformOp {
  constructor(Array<float> user_start_mpos, datamode) {
    this.angle_sum = 0.0;
    
    super(user_start_mpos, datamode, "rotate", "Rotate");
  }
  
  on_mousemove(event) {
    super.on_mousemove(event);

    var md = this.modaldata;
    var ctx = this.modal_ctx;
    var td = this.transdata;
    
    static off = new Vector3();
    
    this.reset_drawlines();
    
    var l1 = off.load(md.mpos).sub(td.scenter).vectorLength();
    var l2 = off.load(md.start_mpos).sub(td.scenter).vectorLength();
    
    var dl = this.new_drawline(md.mpos, td.scenter);
    ctx.view2d.unproject(dl.v1), ctx.view2d.unproject(dl.v2);
    
    var angle = Math.atan2(md.start_mpos[0]-td.scenter[0], md.start_mpos[1]-td.scenter[1]) 
                          - Math.atan2(md.mpos[0]-td.scenter[0], md.mpos[1]-td.scenter[1]);

    this.angle_sum += angle;
    md.start_mpos.load(md.mpos);
    
    this.inputs.angle.set_data(this.angle_sum);
    
    this.exec(ctx);
    this.post_mousemove(event);
  }
  
  exec(ctx) {
    var td = this.modal_running ? this.transdata : this.ensure_transdata(ctx);
    
    static mat = new Matrix4();
    
    var cent = td.center;
    mat.makeIdentity();
    
    mat.translate(cent[0], cent[1], 0);
    //mat.scale(scale[0], scale[1], scale[2]);
    mat.rotate(this.inputs.angle.data, 0, 0, 1);
    mat.translate(-cent[0], -cent[1], 0);
    
    for (var d of td.data) {
      d.type.apply(ctx, td, d, mat, d.w);
    }
    
    this.update(ctx);
    
    if (!this.modal_running) {
      ctx.frameset.on_ctx_update(ctx);
      delete this.transdata;
    }
  }
}

RotateOp.inputs = ToolOp.inherit_inputs(TransformOp, {
  angle : new FloatProperty(undefined, "angle", "angle", "angle")
});
