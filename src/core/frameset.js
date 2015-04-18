"use strict";

import {STRUCT} from 'struct';
import {DataBlock, DataTypes} from 'lib_api';
import {Spline, RestrictFlags} from 'spline';
import {CustomDataLayer, SplineTypes, SplineFlags, SplineSegment} from 'spline_types';
import {TimeDataLayer, get_vtime, AnimChannel, AnimKey, 
        AnimInterpModes, AnimKeyFlags} from 'animdata';
import {SplineLayerFlags, SplineLayerSet} from 'spline_element_array';

import 'struct';

var restrictflags = RestrictFlags.NO_DELETE | RestrictFlags.NO_EXTRUDE | 
                           RestrictFlags.NO_CONNECT;
                           
var vertanimdata_eval_cache = cachering.fromConstructor(Vector3, 64);

export class VertexAnimIter {
  constructor(vd) {
    this.ret = {done : false, value : undefined};
    this.stop = false;
    
    if (vd != undefined)
      VertexAnimIter.init(this, vd);
  }
  
  init(vd) {
    this.vd = vd;
    this.v = vd.startv;
    this.stop = false;
    
    if (this.v != undefined && this.v.segments.length != 0)
      this.s = this.v.segments[0];
    else
      this.s = undefined;
    
    this.ret.done = false;
    this.ret.value = undefined;
    
    return this;
  }

  __iterator__(self) {
    return this;
  }
  
  next() {
    var ret = this.ret;
    
    if (this.vd.startv == undefined) {
      ret.done = true;
      ret.value = undefined;
      
      return ret;
    }
    
    if (this.stop && this.v == undefined) {
      ret.done = true;
      ret.value = undefined;
      
      return ret;
    }

    ret.value = this.v;
    
    if (this.stop || this.s == undefined) {
      this.v = undefined;
      if (ret.value == undefined)
        ret.done = true;
      return ret;
    }
      
    this.v = this.s.other_vert(this.v);
        
    if (this.v.segments.length < 2) {
      this.stop = true;
      return ret;
    }
    
    this.s = this.v.other_segment(this.s);
    return ret;
  }
}

export class SegmentAnimIter {
  constructor(vd) {
    this.ret = {done : false, value : undefined};
    this.stop = false;
    
    if (vd != undefined)
      SegmentAnimIter.init(this, vd);
  }
  
  init(vd) {
    this.vd = vd;
    this.v = vd.startv;
    this.stop = false;
    
    if (this.v != undefined && this.v.segments.length != 0)
      this.s = this.v.segments[0];
    else
      this.s = undefined;
    
    this.ret.done = false;
    this.ret.value = undefined;
    
    return this;
  }

  __iterator__(self) {
    return this;
  }
  
  next() {
    var ret = this.ret;
    
    if (this.stop || this.s == undefined) {
      ret.done = true;
      ret.value = undefined;
      
      return ret;
    }

    ret.value = this.s;
    this.v = this.s.other_vert(this.v);
        
    if (this.v.segments.length < 2) {
      this.stop = true;
      
      return ret;
    }
    
    this.s = this.v.other_segment(this.s);
    return ret;
  }
}

export var VDAnimFlags = {
  STEP_FUNC : 2
};

export class VertexAnimData {
  constructor(int eid, Spline pathspline) {
    this.eid = eid;
    
    this.vitercache = cachering.fromConstructor(VertexAnimIter, 4);
    this.sitercache = cachering.fromConstructor(SegmentAnimIter, 4);
    
    this.spline = pathspline;
    
    this.animflag = 0;
    this.flag = 0; //holds selection and hide flags
    this.visible = false;
    
    //maps splinevert eid's to the times they occur at?
    //hrm. . .
    this.path_times = {};
    this.startv_eid = -1; //this.spline.make_vertex(new Vector3());
    
    if (pathspline != undefined) {
      var layer = pathspline.layerset.new_layer();
      layer.flag |= SplineLayerFlags.HIDE;
      
      this.layerid = layer.id;
    }
    
    this._start_layer_id = undefined;
    this.cur_time = 0;
  }
  
  get startv() {
    if (this.startv_eid == -1) return undefined;
    return this.spline.eidmap[this.startv_eid];
  }
  
  set startv(v) {
    if (typeof v == "number") {
      this.startv_eid = v;
      return;
    }
    
    if (v != undefined) {
      this.startv_eid = v.eid;
    } else {
      this.startv_eid = -1;
    }
  }
  
  _set_layer() {
    if (this.spline.layerset.active.id != this.layerid)
      this._start_layer_id = this.spline.layerset.active.id;
    
    if (this.layerid == undefined) {
      console.log("Error in _set_layer in VertexAnimData!!!");
      return;
    }
    
    this.spline.layerset.active = this.spline.layerset.idmap[this.layerid]
  }
  
  __hash__() {
    return this.eid;
  }
  
  _unset_layer() {
    if (this._start_layer_id != undefined) {
      var layer = this.spline.layerset.idmap[this._start_layer_id];
      
      if (layer != undefined)
        this.spline.layerset.active = layer;
    }
    
    this._start_layer_id = undefined;
  }
  
  get verts() {
    return this.vitercache.next().init(this);
  }
  
  get segments() {
    return this.sitercache.next().init(this);
  }
  
  find_seg(time) {
    var v = this.startv;
    //console.log("find_seg", v, time);
    
    if (v == undefined) return undefined;
    if (v.segments.length == 0) return undefined;
    
    var s = v.segments[0];
    var lastv = v;
    
    while (1) {
      lastv = v;
      v = s.other_vert(v);
      
      //console.log("vtime!", get_vtime(v));
      if (get_vtime(v) > time) {
        return s;
      }
      
      if (v.segments.length < 2) {
        lastv = v;
        break;
      }
      
      s = v.other_segment(s);
    }
    
    return undefined;
  }
  
  update(co, time) {
    this._set_layer();
    
    if (time < 0) {
      console.trace("ERROR! negative times not supported!");

      this._unset_layer();
      return;
    }
    
    if (this.startv == undefined) {
      this.startv = this.spline.make_vertex(co);
      this.startv.cdata.get_layer(TimeDataLayer).time = 1;
        
      this.spline.regen_sort();
      this.spline.resolve = 1;
    }
    
    var spline = this.spline;
    var seg = this.find_seg(time);
    
    if (seg == undefined) {
      var e = this.endv;
      
      if (e.cdata.get_layer(TimeDataLayer).time == time) {
        e.load(co);
        e.flag |= SplineFlags.UPDATE;
      } else {
        var nv = spline.make_vertex(co);
        
        nv.cdata.get_layer(TimeDataLayer).time = time;
        spline.make_segment(e, nv);
        
        spline.regen_sort();
      }
    } else {
      if (get_vtime(seg.v1) == time) {
        seg.v1.load(co);
        seg.v1.flag |= SplineFlags.UPDATE;
      } else if (get_vtime(seg.v2) == time) {
        seg.v2.load(co);
        seg.v2.flag |= SplineFlags.UPDATE;
      } else {
        var ret = spline.split_edge(seg);
        var nv = ret[1];
        
        spline.regen_sort();
        
        nv.cdata.get_layer(TimeDataLayer).time = time;
        nv.load(co);
      }
    }
    
    spline.resolve = 1;
    this._unset_layer();
  }
  
  get start_time() {
    var v = this.startv;
    if (v == undefined) return 0;

    return get_vtime(v);
  }
  
  get end_time() {
    var v = this.endv;
    if (v == undefined) return 0;

    return get_vtime(v);
  }
  
  draw(g, alpha, time) {
    if (!(this.visible))
      return;
      
    var step_func = this.animflag & VDAnimFlags.STEP_FUNC;
    
    var start = this.start_time, end = this.end_time;
    
    g.lineWidth = 1.0;
    g.strokeStyle = "rgba(100,100,100,"+alpha+")";
    
    var dt = 1.0;
    var lastco = undefined;
    
    for (var t = start; t<end; t += dt) {
      var co = this.eval(t);
      var dv = this.derivative(t);
      
      var tmp = dv[0]; dv[0] = -dv[1]; dv[1] = tmp;
      
      dv.normalize().mulScalar(3);
      g.beginPath();
      
      var green = Math.floor(((t - start)/(end - start))*255) ;
      g.strokeStyle = "rgba(10, "+green+",10,"+alpha+")";
      
      /*if (t == start+dt) 
        g.strokeStyle = "rgba(100, 255, 140,"+alpha+")";
      else if (t >= end-dt)
        g.strokeStyle = "rgba(255, 140, 100,"+alpha+")";
      else
        g.strokeStyle = "rgba(0.0, 0.0, 0.0,"+alpha+")";
      */
      
      g.moveTo(co[0]-dv[0], co[1]-dv[1]);
      g.lineTo(co[0], co[1]);
      g.lineTo(co[0]-dv[0], co[1]-dv[1]);
      
      g.stroke();
      
      if (lastco != undefined) {
        g.moveTo(lastco[0], lastco[1]);
        g.lineTo(co[0], co[1]);
        g.stroke();
      }
      
      lastco = co;
    }
  }
  
  derivative(time) {
    var df = 0.01;
    var a = this.eval(time);
    var b = this.eval(time+df);
    
    b.sub(a).mulScalar(1.0/df);
    return b;
  }
  
  eval(time) {
    var v = this.startv;
    var step_func = this.animflag & VDAnimFlags.STEP_FUNC;
    
    if (v == undefined) 
      return vertanimdata_eval_cache.next().zero();
    
    var co = vertanimdata_eval_cache.next();
    if (time <= get_vtime(v)) {
      co.load(v);
      return co;
    }
    
    //console.log("eval 1", v);
    
    if (v.segments.length == 0) {
      co.load(v);
      return co;
    }
    
    var s = v.segments[0];
    var lastv = v;
    var lasts = s;
    var lastv2 = v;
    
    //console.log("eval 2", v);
    
    while (1) {
      //console.log("  eval loop", get_vtime(v));

      lastv2 = lastv;
      lastv = v;
      v = s.other_vert(v);
      
      if (get_vtime(v) >= time) break;
      
      if (v.segments.length < 2) {
        lastv2 = lastv;
        lastv = v;
        break;
      }
      
      lasts = s;
      s = v.other_segment(s);
    }
    
    //console.log("eval 3", get_vtime(v));
    var nextv = v, nextv2 = v;
    var alen1 = s != undefined ? s.length : 1, alen2 = alen1;
    var alen0 = lasts != undefined ? lasts.length : alen1, alen3=alen1;
    
    if (v.segments.length == 2) {
      var nexts = v.other_segment(s);
      
      nextv = nexts.other_vert(v);
      alen2 = nexts.length;
      alen3 = alen2;
    }
    
    nextv2 = nextv;
    if (nextv2.segments.length == 2) {
      var nexts2 = nextv2.other_segment(nexts);
      nextv2 = nexts2.other_vert(nextv2);
      
      alen3 = nexts2.length;
    }
    
    /*
    on factor;
    off period;
    
    procedure bez(a, b);
      a + (b - a)*t;
      
    quad := bez(bez(k0, k1), bez(k1, k2));
    cubic := bez(quad, sub(k2=k3, k1=k2, k0=k1, quad));
    
    comment: unknowns: t1t2  t4t5  t7t8;
    
    comment: t1 := t0 + (t3 - t0)*(1.0/3.0);
    comment: t8 := t6 + (t9 - t6)*(2.0/3.0);
    
    t := (time-t3) / (t6 - t3);
    
    time1 := sub(k3=t3, k2=t2, k1=t1, k0=t0, cubic);
    time2 := sub(k3=t6, k2=t5, k1=t4, k0=t3, cubic);
    time3 := sub(k3=t9, k2=t8, k1=t7, k0=t6, cubic);
    
    dis1 := arclength1*((time1-t0)/(t3-t0));
    dis2 := arclength2*((time2-t3)/(t6-t3));
    dis3 := arclength3*((time3-t6)/(t9-t6));
    
    ddis1 := df(dis1, time);
    ddis2 := df(dis2, time);
    ddis3 := df(dis3, time);
    
    d2dis1 := df(dis1, time, 2);
    d2dis2 := df(dis2, time, 2);
    d2dis3 := df(dis3, time, 2);

    d3dis1 := df(dis1, time, 3);
    d3dis2 := df(dis2, time, 3);
    d3dis3 := df(dis3, time, 3);
    
    f1 := sub(time=t3, ddis1) - sub(time=t3, ddis2);
    f2 := sub(time=t6, ddis2) - sub(time=t6, ddis3);
    
    f3 := sub(time=t3, d2dis1) - sub(time=t3, d2dis2);
    f4 := sub(time=t6, d2dis2) - sub(time=t6, d2dis3);
    
    f5 := sub(time=t3, d3dis1) - sub(time=t3, d3dis2);
    f6 := sub(time=t6, d3dis2) - sub(time=t6, d3dis3);
    
    f := solve({f1, f2, f3, f4}, {t4, t5, t1, t8});
    
    on fort;
    
    finalt1 := part(f, 1, 1, 2);
    finalt2 := part(f, 1, 2, 2);
    finalt4 := part(f, 1, 3, 2);
    finalt5 := part(f, 1, 4, 2);
    finalt7 := part(f, 1, 5, 2);
    finalt8 := part(f, 1, 6, 2);
    
    off fort;
    */
    
    if (lastv == v || get_vtime(lastv) == time) {
      co.load(v);
    } else {
      var pt2 = get_vtime(lastv2), pt = get_vtime(lastv), vt = get_vtime(v);
      var nt = get_vtime(nextv), nt2 = get_vtime(nextv2);
      
      var t = (time - pt) / (vt-pt);
      
      var a=pt, b, c, d=vt;
      var arclength1 = alen0;
      var arclength2 = alen1;
      var arclength3 = alen2;
      
      var t0 = pt2, t3 = pt, t6 = vt, t9 = nt;
      
      var t1 = pt2 + (pt - pt2)*(1.0/3.0);
      var t8 = vt  + (nt -  vt)*(2.0/3.0);
      
      var b = (-(t0-t1)*(t3-t6)*arclength1+(t0-t3)*arclength2*t3)/((t0-t3)*arclength2);
      var c = ((t3-t6)*(t8-t9)*arclength3+(t6-t9)*arclength2*t6)/((t6-t9)*arclength2);
      
      var r1 = alen0/alen1;
      var r2 = alen1/alen2;
      
      //console.log("r1, r2", r1.toFixed(3), r2.toFixed(3));
      
      //b = pt + (vt-pt)*(1.0/3.0)*r1; 
      //c = pt + (vt-pt)*(2.0/3.0)*r2;
      b = pt + r1*(vt - pt2)/3.0;
      c = vt - r2*(nt - pt)/3.0;
      
      //if (b > pt-pt2) b = pt-pt2;
      //if (c > vt-pt)  c = vt-pt;
      
      var t0 = a, t1 = b, t2 = c, t3 = d;
      var tt = -(3*(t0-t1)*t - t0 + 3*(2*t1-t2-t0)*t*t + 
           (3*t2-t3-3*t1 + t0)*t*t*t);
      //*/
      
      tt = Math.abs(tt);
      //t = (tt - pt) / (vt-pt);
      
      if (step_func) {
        t = time < vt ? 0.0 : 1.0;
      }
      //t = 1.0;
      
      co.load(s.eval(lastv == s.v1 ? t : 1-t));
     }
    
    return co;
  }
  
  get endv() {
    var v = this.startv;
    
    if (v == undefined) return undefined;
    if (v.segments.length == 0) return v;
    
    var s = v.segments[0];
    while (1) {
      v = s.other_vert(v);
      
      if (v.segments.length < 2) break;
      s = v.other_segment(s);
    }
    
    return v;
  }
  
  static fromSTRUCT(reader) {
    var ret = new VertexAnimData();

    reader(ret);
    
    return ret;
  }
}

VertexAnimData.STRUCT = """
  VertexAnimData {
    eid      : int;
    flag     : int;
    animflag : int;
    cur_time : int;
    layerid  : int;
    startv_eid : int;
  }
""";

export class SplineFrame {
  constructor(time, idgen) {
    this.time = time;
    this.flag = 0;
    
    //this.spline = new Spline();
    //this.spline.idgen = idgen;
  }
  
  static fromSTRUCT(reader) {
    var ret = new SplineFrame();
    
    reader(ret);
    
    return ret;
  }
}
SplineFrame.STRUCT = """
  SplineFrame {
    time    : float;
    spline  : Spline;
    flag    : int;
  }
""";

window.obj_values_to_array = function obj_values_to_array(obj) {
  var ret = [];
  for (var k in obj) {
    ret.push(obj[k]);
  }
  
  return ret;
}

class AllSplineIter {
  constructor(f, sel_only) {
    this.f = f;
    this.iter = undefined;
    this.ret = {done : false, value : undefined};
    this.stage = 0;
    this.sel_only = sel_only;
    
    this.load_iter();
  }
  
  load_iter() {
    this.iter = undefined;
    var f = this.f;
    
    if (this.stage == 0) {
      var arr = new GArray();
      
      for (var k in f.frames) {
        var fr = f.frames[k];
        arr.push(fr.spline);
      }
      
      this.iter = arr.__iterator__();
    } else if (this.stage == 1) {
      //handle animation curves
      var arr = [];
      
      for (var k in this.f.vertex_animdata) {
        if (this.sel_only) {
          var vdata = this.f.vertex_animdata[k];
          var v = this.f.spline.eidmap[k];
          
          //if (v != undefined && (v.flag & SplineFlags.SELECT) && v.type != SplineTypes.HANDLE)
          //  console.log("EID", k, "SPLINE", this.f.vertex_animdata[k].spline._debug_id, "HIDDEN", v.hidden, "TYPE", v.type);
          
          if (v == undefined || !(v.flag & SplineFlags.SELECT) || v.hidden) { // || (v.type != SplineTypes.VERTEX)) {
            continue;
          }
        }
        
        arr.push(this.f.vertex_animdata[k].spline);
      }
      
      this.iter = arr.__iterator__();
    }
  }
  
  reset() {
    this.ret = {done : false, value : undefined};
    this.stage = 0;
    this.iter = undefined;
  }
  
  __iterator__() {
    return this;
  }
  
  next() {
    if (this.iter == undefined) {
      this.ret.done = true;
      this.ret.value = undefined;
      
      var ret = this.ret;
      this.reset();
      
      return ret;
    }
    
    var next = this.iter.next();
    var ret = this.ret;
    
    ret.value = next.value;
    ret.done = next.done;
    
    if (next.done) {
      this.stage++;
      this.load_iter();
      
      if (this.iter != undefined) {
        ret.done = false;
      }
    }
    
    if (ret.done) {
      this.reset();
    }
    
    return ret;
  }
}

class EidTimePair {
  constructor(eid, time) {
    this.eid = eid;
    this.time = time;
  }
  
  load(eid, time) {
    this.eid = eid;
    this.time = time;
  }
  
  static fromSTRUCT(reader) {
    var ret = new EidTimePair();
    reader(ret);
    return ret;
  }
  
  __hash__() {
    return ""+this.eid+"_"+this.time;
  }
}

EidTimePair.STRUCT = """
  EidTimePair {
    eid  : int;
    time : int;
  }
""";

function combine_eid_time(eid, time) {
  return new EidTimePair(eid, time);
}

var split_eid_time_rets = new cachering(function() {
  return [0, 0];
}, 64);

function split_eid_time(t) {
  var ret = split_eid_time_rets.next();
  
  ret[0] = t.eid;
  ret[1] = t.time;
  
  return ret;
}

export class SplineKCache {
  constructor() {
    this.cache = {};
    this.invalid_eids = new set();
  }
  
  set(frame, spline) {
    for (var eid in spline.eidmap) {
      this.revalidate(eid, frame);
    }
    
    this.cache[frame] = spline.export_ks();
  }
  
  invalidate(eid, time) {
    this.invalid_eids.add(combine_eid_time(eid, time));
  }
  
  revalidate(eid, time) {
    var t = combine_eid_time(time);
    this.invalid_eids.remove(t);
  }
  
  load(frame, spline) {
    if (!(frame in this.cache)) {
      console.log("warning, bad call to SplineKCache");
      return;
    }
    
    spline.import_ks(this.cache[frame]);
    
    for (var eid in spline.eidmap) {
      var t = combine_eid_time(eid, frame);
      
      //console.log(this.invalid_eids.has(t));
      
      if (!this.invalid_eids.has(t))
        continue;
      
      this.invalid_eids.remove(t);
      var e = spline.eidmap[eid];
      
      e.flag |= SplineFlags.UPDATE;
      spline.resolve = 1;
    }
  }
  
  _as_array() {
    var ret = [];
    
    for (var k in this.cache) {
      ret.push(this.cache[k]);
    }
    
    return ret;
  }
  
  _get_times() {
    var ret = [];
    
    for (var k in this.cache) {
      ret.push(k);
    }
    
    return ret;
  }
  
  static fromSTRUCT(reader) {
    var ret = new SplineKCache();
    
    reader(ret);
    var cache = {};
    
    var inv = new set();

    if (ret.invalid_eids != undefined && 
       ret.invalid_eids instanceof Array)
    {
      for (var i=0; i<ret.invalid_eids.length; i++) {
        inv.add(ret.invalid_eids[i]);
      }
    }
    
    ret.invalid_eids = inv;
    for (var i=0; i<ret.cache.length; i++) {
      cache[ret.times[i]] = new Uint8Array(ret.cache[i]);
    }
    
    delete ret.times;
    ret.cache = cache;
    
    return ret;
  }
}
SplineKCache.STRUCT = """
  SplineKCache {
    cache : array(array(byte))  | obj._as_array();
    times : array(array(float)) | obj._get_times();
    invalid_eids : iter(EidTimePair);
  }
""";

/*
  there are two types of frames: the spline copies
  store in SplineFrameSet.frames, and the vertex animation
  data stored in VertexAnimData.
  
  this weirdness is due to the fact that we're really animating two
  distinct types of data: the topology of the spline paths,
  and the movement of individual points.
*/
export class SplineFrameSet extends DataBlock {
  constructor() {
    DataBlock.call(this, DataTypes.FRAMESET)
    
    this.editmode = "MAIN";
    this.editveid = -1;
    
    this.spline = undefined;
    this.kcache = new SplineKCache();
    
    this.idgen = new SDIDGen();
    this.frames = {};
    this.framelist = [];
    this.vertex_animdata = {};
    
    this.pathspline = this.make_pathspline();
    this.templayerid = this.pathspline.layerset.active.id;
    
    this.selectmode = 0;
    this.draw_anim_paths = 0;
    
    this.time = 1;
    this.insert_frame(0);
    
    this.switch_on_select = true;
  }
  
  has_coincident_verts(threshold=2, time_threshold=0) {
    var ret = new set();
    
    for (var k in this.vertex_animdata) {
      var vd = this.vertex_animdata[k];
      
      var lastv = undefined;
      var lasttime = undefined;
      for (var v in vd.verts) {
        var time = get_vtime(v);
        
        if (lastv != undefined && lastv.vectorDistance(v) < threshold && Math.abs(time-lasttime) <= time_threshold) {
          console.log("Coincident vert!", k, v.eid, lastv.vectorDistance(v));
          
          if (v.segments.length == 2)
            ret.add(v)
          else if (lastv.segments.length == 2)
            ret.add(lastv);
        }
        
        lastv = v;
        lasttime = time;
      }
    }
    
    return ret;
  }
  
  //used by SplitEdgeOp.  interpolates paths between original edge vertices
  //to create a new path for the vertex at the midpoint
  create_path_from_adjacent(v, s) { 
    if (v.segments.length < 2) {
      console.log("Invalid input to create_path_from_adjacent");
      return;
    }
    
    var v1 = s.other_vert(v), v2 = v.other_segment(s).other_vert(v);
    var av1 = this.get_vdata(v1.eid, false), av2 = this.get_vdata(v2.eid, false);
    
    if (av1 == undefined && av2 == undefined) {
      console.log("no animation data to interpolate");
      return;
    } else if (av1 == undefined) {
      av1 = av2;
    } else if (av2 == undefined) {
      av2 = av1;
    } 
    
    var av3 = this.get_vdata(v.eid, true);
    
    var keyframes = new set();
    for (var v in av1.verts) {
      keyframes.add(get_vtime(v));
    }
    
    for (var v in av2.verts) {
      keyframes.add(get_vtime(v));
    }
    
    var co = new Vector3();
    
    //ensure step func interpolation mode is off for this
    var oflag1 = av1.animflag, oflag2 = av2.animflag;
    
    av1.animflag &= VDAnimFlags.STEP_FUNC;
    av2.animflag &= VDAnimFlags.STEP_FUNC;
    
    for (var time in keyframes) {
      var  co1 = av1.eval(time), co2 = av2.eval(time);
      
      co.load(co1).add(co2).mulScalar(0.5);
      av3.update(co, time);
    }
    
    av3.animflag = oflag1 | oflag2;
    
    av1.animflag = oflag1;
    av2.animflag = oflag2;
  }
  
  set_visibility(vd_eid, state) {
    var vd = this.vertex_animdata[vd_eid];
    if (vd == undefined) return;
    
    var layer = this.pathspline.layerset.idmap[vd.layerid];
    var drawlayer = this.pathspline.layerset.idmap[this.templayerid];

    vd.visible = !!state;
    
    for (var v in vd.verts) {
      if (state) {
        layer.remove(v);
        drawlayer.add(v);
        
        v.flag &= ~(SplineFlags.GHOST|SplineFlags.HIDE);
        
        for (var i=0; i<v.segments.length; i++) {
          layer.remove(v.segments[i]);
          drawlayer.add(v.segments[i]);
          v.segments[i].flag &= ~(SplineFlags.GHOST|SplineFlags.HIDE);
        }
      } else {
        drawlayer.remove(v);
        layer.add(v);
        
        v.flag |= SplineFlags.GHOST|SplineFlags.HIDE;
        
        for (var i=0; i<v.segments.length; i++) {
          drawlayer.remove(v.segments[i]);
          layer.add(v.segments[i]);
          
          v.segments[i].flag |= SplineFlags.GHOST|SplineFlags.HIDE;
        }
      }
    }
    
    this.pathspline.regen_sort();
  }
  
  on_spline_select(element, state) {
    if (!this.switch_on_select) return;
    
    //console.trace("on select!", element.eid, state);
    
    var vd = this.get_vdata(element.eid, false);
    if (vd == undefined) return;
    
    var hide = !(this.selectmode & element.type);
    hide = hide || !(element.flag & SplineFlags.SELECT);
    
    if (element.type == SplineTypes.HANDLE) {
      hide = hide || !element.use;
    }
    
    if (state) { // !!(vd.flag & SplineFlags.HIDE) != !!hide) {
      //window.redraw_viewport();
    }
    
    console.log("anim path status", hide);

    var layer = this.pathspline.layerset.idmap[vd.layerid];
    var drawlayer = this.pathspline.layerset.idmap[this.templayerid];
    vd.visible = !hide;
    
    for (var v in vd.verts) {
      v.sethide(hide);
      
      for (var i=0; i<v.segments.length; i++) {
        var s = v.segments[i];
        
        s.sethide(hide);
        s.flag &= ~SplineFlags.GHOST;
        
        if (!hide && !(drawlayer.id in s.layers)) {
          layer.remove(s);
          drawlayer.add(s);
        } else if (hide && (drawlayer.id in s.layers)) {
          drawlayer.remove(s);
          layer.add(s);
        }
      }
      
      v.flag &= ~SplineFlags.GHOST;
      if (hide) {
        drawlayer.remove(v);
        layer.add(v);
      } else {
        layer.remove(v);
        drawlayer.add(v);
      }
    }
    
    if (state)
      vd.flag |= SplineFlags.SELECT;
    else
      vd.flag &= ~SplineFlags.SELECT; 
      
    this.pathspline.regen_sort();
  }
  
  //base spline and all animation splines
  get _allsplines() {
    return new AllSplineIter(this);
  }
  
  //base spline and *selected* vertex animation splines 
  get _selected_splines() {
    return new AllSplineIter(this, true);
  }
  
  update_visibility() {
    if (!this.switch_on_select)
      return;
    
    var selectmode = this.selectmode, show_paths = this.draw_anim_paths;
    
    for (var v in this.pathspline.verts) {
      v.sethide(true);
    }
    for (var h in this.pathspline.handles) {
      h.sethide(true);
    }
    
    for (var k in this.vertex_animdata) {
      var vd = this.vertex_animdata[k];
      
      var hide = !(vd.eid in this.spline.eidmap) || !(v.flag & SplineFlags.SELECT);
      hide = hide || !(v.type & selectmode) || !show_paths;

      vd.visible = !hide;
      
      if (!hide) {
        window.redraw_viewport();
      }

      for (var v in vd.verts) {
        v.sethide(hide);
      }
    }
  }
  
  //upload or download vertex animation data, depending on 
  //if ctx.spline refers to this.spline or not
  on_ctx_update(ctx) {
    console.trace("on_ctx_update");
    
    if (ctx.spline === this.spline) {
      this.update_frame();
    } else if (ctx.spline === this.pathspline) {
      var resolve = 0;
      
      for (var v in this.spline.points) {
        if (v.eid in this.vertex_animdata) { //&& (v.flag & SplineFlags.FRAME_DIRTY)) {
          var vdata = this.get_vdata(v.eid, false);
          
          v.load(vdata.eval(this.time));
          v.flag &= ~SplineFlags.FRAME_DIRTY;
          v.flag |= SplineFlags.UPDATE;
          
          resolve = 1;
        }
      }
      
      this.spline.resolve = resolve;
    }
  }
  
  download() {
 //   console.log("uploading. . .");
    var resolve = 0;
    
    for (var v in this.spline.points) {
      if (v.eid in this.vertex_animdata) {// && (v.flag & SplineFlags.FRAME_DIRTY)) {
        var vdata = this.get_vdata(v.eid, false);
        
        v.load(vdata.eval(this.time));
        v.flag &= ~SplineFlags.FRAME_DIRTY;
        v.flag |= SplineFlags.UPDATE;
        
        resolve = 1;
      }
    }
    
    this.spline.resolve = resolve;
  }
  
  update_frame(force_update) {
    var time = this.time;
    var spline = this.spline;
    
    if (spline == undefined) return;
    
    if (spline.resolve)
      spline.solve();
      
    this.kcache.set(time, spline);
    
    var is_first = time <= 1; //this.framelist.length == 0 || time == this.framelist[0];
    var found = false;
    
    for (var v in spline.points) {
      if (!(v.eid in spline.eidmap)) {
        found = true;
      }
      
      var dofirst = is_first && !(v.eid in this.vertex_animdata);
      
      if (!(force_update || dofirst || (v.flag & SplineFlags.FRAME_DIRTY))) 
        continue;
      
      var vdata = this.get_vdata(v.eid);
      vdata.update(v, time);
      
      v.flag &= ~SplineFlags.FRAME_DIRTY;
    }
    
    if (!found) return;
    
    this.insert_frame(this.time);
  }
  
  insert_frame(int time) {
    //for now, let's not allow multiple topologies
    if (this.frame != undefined) 
      return this.frame;
    
    var frame = this.frame = new SplineFrame();
    var spline = this.spline == undefined ? new Spline() : this.spline.copy();
    
    spline.verts.select_listeners.addListener(this.on_spline_select, this);
    spline.handles.select_listeners.addListener(this.on_spline_select, this);
    
    spline.idgen = this.idgen;
    
    frame.spline = spline;
    frame.time = time;
    
    this.frames[time] = frame;
    
    if (this.spline == undefined) {
      this.spline = frame.spline;
      this.frame = frame;
    }
    
    return frame;
    /*
    if (time in this.frames) {
      if (time == this.time) {
        var f = this.frames[time];
        
        f.spline = this.spline.copy();
        this.update_frame();
      }
      
      return this.frames[time];
    }
    
    if (this.framelist.indexOf(time) < 0) {
      this.framelist.push(time);
      this.framelist.sort();
    }
    
    var spline = this.spline == undefined ? new Spline() : this.spline.copy();
    var frame = new SplineFrame();
    
    spline.idgen = this.idgen;
    frame.spline = spline;
    frame.time = time;
    
    this.frames[time] = frame;
    
    if (this.spline == undefined) {
      this.spline = frame.spline;
      this.frame = frame;
    }
    
    return frame;*/
  }
  
  find_frame(float time, int off=0) {
    var flist = this.framelist;
    for (var i=0; i<flist.length-1; i++) {
      if (flist[i] <= time && flist[i+1] > time) {
        break;
      }
    }
    
    if (i == flist.length) return frames[i-1]; //return undefined;
    return frames[i];
  }
  
  change_time(float time, _update_animation=true) {
    if (!window.inFromStruct && _update_animation) {
      this.update_frame();
    }
    
    /*
    var flist = this.framelist;
    for (var i=0; i<flist.length-1; i++) {
      if (flist[i] <= time && flist[i+1] > time) {
        break;
      }
    }
    
    if (flist[i] != time)
      i++;
    
    if (i == flist.length) {
      console.log("Outside of frame range; inserting. . .");
      
      this.insert_frame(time);
      //this.time = time;
      //return;
    }
    
    console.log("Changing to topology frame", flist[i]);
    var f = this.frames[flist[i]];
    */
    
    var f = this.frames[0];
    
    /*
    for (var k in this.vertex_animdata) {
      var vdata = this.vertex_animdata[k];
      if (vdata.eid in this.spline.eidmap) continue;
      
      vdata.flag &= ~SplineFlags.SELECT;
    }
    //*/
    
    for (var v in this.spline.points) {
      var vd = this.get_vdata(v.eid, false);
      if (vd == undefined) continue;
      
      if (v.flag & SplineFlags.SELECT)
        vd.flag |= SplineFlags.SELECT;
      else 
        vd.flag &= ~SplineFlags.SELECT;
      
      if (v.flag & SplineFlags.HIDE)
        vd.flag |= SplineFlags.HIDE;
      else 
        vd.flag &= ~SplineFlags.HIDE;
    }
    
    if (f == undefined) {
      f = this.insert_frame(time);
    }
    
    var spline = f.spline; //.copy();
    
    if (!window.inFromStruct && _update_animation) { //time != f.time) {
      var set_update = true;
      
      if (time in this.kcache.cache) {
        console.log("found cached k data!");
        
        this.kcache.load(time, spline);
        set_update = false;
      }
      
      for (var v in spline.points) {
        var set_flag = v.eid in this.vertex_animdata;
        
        var vdata = this.get_vdata(v.eid, false);
        if (vdata == undefined) continue;
        
        //console.log("yay, vdata", vdata.eval(time));
        if (set_flag) {
          spline.setselect(v, vdata.flag & SplineFlags.SELECT);
          
          if (vdata.flag & SplineFlags.HIDE)
            v.flag |= SplineFlags.HIDE;
          else
            v.flag &= ~SplineFlags.HIDE;
        }
        
        v.load(vdata.eval(time));
        
        if (set_update)
          v.flag |= SplineFlags.UPDATE;
        //console.log("--", vdata);
      }
      
      spline.resolve = 1;
      if (!window.inFromStruct)
        spline.solve();
    }
    
    this.spline = spline;
    this.time = time;
    this.frame = f;
  }
  
  delete_vdata() {
    this.vertex_animdata = {};
  }
  
  get_vdata(eid, auto_create=true) {
    if (auto_create && !(eid in this.vertex_animdata)) {
        this.vertex_animdata[eid] = new VertexAnimData(eid, this.pathspline);
    }
    
    return this.vertex_animdata[eid];
  }
  
  rationalize_vdata_layers() {
    var spline = this.pathspline;
    
    spline.layerset = new SplineLayerSet();

    var templayer = spline.layerset.new_layer();
    this.templayerid = templayer.id;

    spline.layerset.active = templayer;
    
    for (var i=0; i<spline.elists.length; i++) {
      var list = spline.elists[i];
      
      list.layerset = spline.layerset;
      
      for (var e in list) {
        e.layers = {};
      }
    }
    
    for (var k in this.vertex_animdata) {
      var vd = this.vertex_animdata[k];
      var vlayer = spline.layerset.new_layer();
      vlayer.flag |= SplineLayerFlags.HIDE;
      
      vd.layerid = vlayer.id;
      for (var v in vd.verts) {
        for (var i=0; i<v.segments.length; i++) {
          vlayer.add(v.segments[i]);
        }
        vlayer.add(v);
      }
    }
  }
  
  draw(Context ctx, Canvas2DRenderer g, editor) {
    var size = editor.size, pos = editor.pos;
    
    this.draw_anim_paths = editor.draw_anim_paths;
    this.selectmode = editor.selectmode;
    
    this.spline.draw(g, editor, editor.selectmode, editor.only_render, editor.draw_normals, this.spline===ctx.spline ? 1.0 : 0.3);
  }
  
  static fromSTRUCT(reader) {
    window.inFromStruct = true;
    var ret = STRUCT.chain_fromSTRUCT(SplineFrameSet, reader);
    
    if (ret.kcache == undefined) {
      ret.kcache = new SplineKCache();
    }
    
    ret.afterSTRUCT();
    if (ret.pathspline == undefined) {
      ret.pathspline = ret.make_pathspline();
    }
    
    for (v in ret.pathspline.verts) {
     // v.flag |= SplineFlags.UPDATE;
    }
    for (var h in ret.pathspline.handles) {
     // h.flag |= SplineFlags.UPDATE;
    }
    
    for (var vd in ret.vertex_animdata) {
      vd.spline = ret.pathspline;
      
      if (vd.layerid == undefined) {
        var layer = ret.pathspline.layerset.new_layer();
        layer.flag |= SplineLayerFlags.HIDE;
        
        vd.layerid  = layer.id;
        
        if (vd.startv_eid != undefined) {
          var v = ret.pathspline.eidmap[vd.startv_eid];
          var s = v.segments[0];
          
          v.layers = {};
          v.layers[vd.layerid] = 1;
          var _c1 = 0;
          
          while (v.segments.length > 0) {
            v.layers = {};
            v.layers[vd.layerid] = 1;
            
            s.layers = {};
            s.layers[vd.layerid] = 1;
            
            v = s.other_vert(v);
            if (v.segments.length < 2) {
              v.layers = {};
              v.layers[vd.layerid] = 1;
              break;
            }
            
            if (_c1++ > 100000) {
              console.log("Infinite loop detected!");
              break;
            }
            
            s = v.other_segment(s);
            s.layers = {};
            s.layers[vd.layerid] = 1;
            
            if (v == vd.startv)
              break;
          }
        }
      }
    }
    
    //console.log("PARENTV", ret.eid);
    ret.pathspline.is_anim_path = true;
    if (ret.templayerid == undefined)
      ret.templayerid = ret.pathspline.layerset.new_layer().id;
    //ret.pathspline.solve();
    
    var frames = {};
    var vert_animdata = {};
    
    //ensure sane id generator
    var max_cur = ret.idgen.cur_id;
    var firstframe = undefined;
    for (var i=0; i<ret.frames.length; i++) {
      console.log(ret, ret.frames);
      //if (ret.frames[i].spline.idgen == undefined)
      //  ret.frames[i].spline.idgen = ret.idgen;
        
      max_cur = Math.max(ret.frames[i].spline.idgen.cur_id, max_cur);
      
      if (i == 0) firstframe = ret.frames[i];
      
      ret.frames[i].spline.idgen = ret.idgen;
      frames[ret.frames[i].time] = ret.frames[i];
    }
    ret.idgen.max_cur(max_cur);
    
    for (var i=0; i<ret.vertex_animdata.length; i++) {
      vert_animdata[ret.vertex_animdata[i].eid] = ret.vertex_animdata[i];
    }
    
    ret.frames = frames;
    //ret.pathspline.resolve = 1;
    ret.pathspline.regen_sort();
    
    var fk = ret.cur_frame;
    delete ret.cur_frame;
    
    if (fk == undefined) {
      ret.frame = firstframe;
      ret.spline = firstframe.spline;
    } else {
      ret.frame = ret.frames[fk];
      ret.spline = ret.frames[fk].spline;
    }
    
    ret.vertex_animdata = vert_animdata;
    ret.rationalize_vdata_layers();
    
    if (ret.framelist.length == 0) {
      for (var k in ret.frames) {
        ret.framelist.push(parseFloat(k));
      }
    }
    
    for (k in ret.frames) {
      ret.frames[k].spline.verts.select_listeners.addListener(ret.on_spline_select, ret);
      ret.frames[k].spline.handles.select_listeners.addListener(ret.on_spline_select, ret);
    }
    
    ret.spline.fix_spline(); //XXX
    
    //try {
      //ret.change_time(ret.time);
    /*} catch(error) {
      console.trace("\n==Error restoring frame data while loading frameset");
      print_stack();
      console.log("  Error restoring frame data while loading frameset==\n");
    }*/
    
    //ret.update_visibility();
    window.inFromStruct = false;
    
    return ret;
  }
  
  make_pathspline() {
    var spline = new Spline();
    
    spline.is_anim_path = true;

    //don't allow (the users) to delete or extrude the curve,
    //or make independent points, or connect anything
    spline.restrict = restrictflags;
    spline.verts.cdata.add_layer(TimeDataLayer, "time data");

    return spline;
  }
};

SplineFrameSet.STRUCT = STRUCT.inherit(SplineFrameSet, DataBlock) + """
    idgen             : SDIDGen;
    frames            : array(SplineFrame) | obj_values_to_array(obj.frames);
    vertex_animdata   : array(VertexAnimData) | obj_values_to_array(obj.vertex_animdata);
    
    cur_frame         : float | obj.frame.time;
    editmode          : string;
    editveid          : int;
    
    time              : float;
    framelist         : array(float);
    pathspline        : Spline;
    
    selectmode        : int;
    draw_anim_paths   : int;
    templayerid       : int;
    
    kcache            : SplineKCache;
}
""";
