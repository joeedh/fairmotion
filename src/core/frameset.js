"use strict";

import {STRUCT} from 'struct';
import {DataBlock, DataTypes} from 'lib_api';
import {Spline, RestrictFlags} from 'spline';
import {CustomDataLayer, SplineTypes, SplineFlags, SplineSegment} from 'spline_types';
import {TimeDataLayer, get_vtime, set_vtime, AnimChannel, AnimKey,
        AnimInterpModes, AnimKeyFlags} from 'animdata';
import {SplineLayerFlags, SplineLayerSet} from 'spline_element_array';

import 'struct';

import * as animspline from 'animspline';

export * from 'animspline';

var restrictflags = animspline.restrictflags;
var VertexAnimIter = animspline.VertexAnimIter;
var SegmentAnimIter = animspline.SegmentAnimIter;
var VDAnimFlags = animspline.VDAnimFlags;
var VertexAnimData = animspline.VertexAnimData;

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
      
      this.iter = arr[Symbol.iterator]();
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
      
      this.iter = arr[Symbol.iterator]();
    }
  }
  
  reset() {
    this.ret = {done : false, value : undefined};
    this.stage = 0;
    this.iter = undefined;
  }
  
  [Symbol.iterator]() {
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
  
  [Symbol.keystr]() {
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
    if (typeof frame == "string") {
      throw new Error("Got bad frame! " + frame);
    }
    
    if (!(frame in this.cache)) {
      warn("Warning, bad call to SplineKCache");
      return;
    }
    
    var ret = spline.import_ks(this.cache[frame]);
    
    if (ret == undefined) { //bad data
      delete this.cache[frame];
      
      console.log("bad kcache data for frame", frame);
      
      for (var s of spline.segments) {
        s.v1.flag |= SplineFlags.UPDATE;
        s.v2.flag |= SplineFlags.UPDATE;
        s.h1.flag |= SplineFlags.UPDATE;
        s.h2.flag |= SplineFlags.UPDATE;
        s.flag |= SplineFlags.UPDATE;
      }
      
      spline.resolve = 1;
      return;
    }
    
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
      ret.push(parseFloat(""+k));
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
    
    //delete ret.times;
    ret.cache = cache;
    
    return ret;
  }
}

SplineKCache.STRUCT = """
  SplineKCache {
    cache : array(array(byte))  | obj._as_array();
    times : array(float)        | obj._get_times();
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
    super(DataTypes.FRAMESET)
    
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
  
  get active_animdata() {
    if (this.spline.verts.active === undefined) {
      return undefined;
    }
    
    return this.get_vdata(this.spline.verts.active.eid, true);
  }
  
  find_orphan_pathverts() {
    var vset = new set();
    var vset2 = new set();
    
    for (var v of this.spline.verts) {
      vset2.add(""+v.eid);
    }
    
    for (var k in this.vertex_animdata) {
      var vd = this.vertex_animdata[k];
      
      if (!vset2.has(""+k)) {
        delete this.vertex_animdata[k];
        continue;
      }
      
      for (var v of vd.verts) {
        vset.add(v.eid);
      }
    }
    
    var totorphaned = 0;
    
    for (var v of this.pathspline.verts) {
      if (!vset.has(v.eid)) {
        this.pathspline.kill_vertex(v);
        totorphaned++;
      }
    }
    
    console.log("totorphaned: ", totorphaned);
  }

  //threshold defaults to 2
  //time_threshold defaults to 0
  has_coincident_verts(threshold, time_threshold) {
    threshold = threshold === undefined ? 2 : threshold;
    time_threshold = time_threshold === undefined ? 0 : time_threshold;

    var ret = new set();
    
    for (var k in this.vertex_animdata) {
      var vd = this.vertex_animdata[k];
      
      var lastv = undefined;
      var lasttime = undefined;
      for (var v of vd.verts) {
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
    for (var v of av1.verts) {
      keyframes.add(get_vtime(v));
    }
    
    for (var v of av2.verts) {
      keyframes.add(get_vtime(v));
    }
    
    var co = new Vector3();
    
    //ensure step func interpolation mode is off for this
    var oflag1 = av1.animflag, oflag2 = av2.animflag;
    
    av1.animflag &= VDAnimFlags.STEP_FUNC;
    av2.animflag &= VDAnimFlags.STEP_FUNC;
    
    for (var time of keyframes) {
      var  co1 = av1.evaluate(time), co2 = av2.evaluate(time);
      
      co.load(co1).add(co2).mulScalar(0.5);
      av3.update(co, time);
    }
    
    av3.animflag = oflag1 | oflag2;
    
    av1.animflag = oflag1;
    av2.animflag = oflag2;
  }
  
  set_visibility(vd_eid, state) {
    console.log("set called", vd_eid, state);
    
    var vd = this.vertex_animdata[vd_eid];
    if (vd == undefined) return;
    
    var layer = this.pathspline.layerset.idmap[vd.layerid];
    var drawlayer = this.pathspline.layerset.idmap[this.templayerid];

    vd.visible = !!state;
    
    for (var v of vd.verts) {
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
  
  on_destroy() {
    this.spline.on_destroy();
    this.pathspline.on_destroy();
  }
  
  on_spline_select(element, state) {
    if (!this.switch_on_select) return;
    
    //console.trace("frameset on select!", element.eid, state);
    
    var vd = this.get_vdata(element.eid, false);
    if (vd == undefined) return;
    
    var hide = !(this.selectmode & element.type);
    hide = hide || !(element.flag & SplineFlags.SELECT);
    
    if (element.type == SplineTypes.HANDLE) {
      hide = hide || !element.use;
    }
    
    //if (state) { // !!(vd.flag & SplineFlags.HIDE) != !!hide) {
      //window.redraw_viewport();
    //}
    
    //console.log("anim path status", hide);

    var layer = this.pathspline.layerset.idmap[vd.layerid];
    var drawlayer = this.pathspline.layerset.idmap[this.templayerid];
    vd.visible = !hide;
    
    for (var v of vd.verts) {
      v.sethide(hide);
      
      for (var i=0; i<v.segments.length; i++) {
        var s = v.segments[i];
        
        s.sethide(hide);
        s.flag &= ~(SplineFlags.GHOST|SplineFlags.HIDE);
        
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
    console.log("update_visibility called");
    
    if (!this.switch_on_select)
      return;
    
    var selectmode = this.selectmode, show_paths = this.draw_anim_paths;
    var drawlayer = this.pathspline.layerset.idmap[this.templayerid];

    if (drawlayer === undefined) {
      console.log("this.templayerid corruption", this.templayerid);

      this.templayerid = this.pathspline.layerset.new_layer().id;
      drawlayer = this.pathspline.layerset.idmap[this.templayerid];
    }

    for (var v of this.pathspline.verts) {
      if (!v.has_layer()) {
        drawlayer.add(v);
      }
      
      v.sethide(true);
    }
    
    for (var h of this.pathspline.handles) {
      if (!h.has_layer()) {
        drawlayer.add(h);
      }
      
      h.sethide(true);
    }
    
    for (var k in this.vertex_animdata) {
      var vd = this.vertex_animdata[k];
      var v = this.spline.eidmap[k];

      if (v === undefined) {
        //console.log("error in update_visibility:", k);
        continue;
      }

      var hide = !(vd.eid in this.spline.eidmap) || !(v.flag & SplineFlags.SELECT);
      hide = hide || !(v.type & selectmode) || !show_paths;

      vd.visible = !hide;
      
      if (!hide) {
        //XXX
        //window.redraw_viewport();
      }

      for (var v2 of vd.verts) {
        if (!hide) {
          v2.flag &= ~(SplineFlags.GHOST|SplineFlags.HIDE);
        } else {
          v2.flag |= SplineFlags.GHOST|SplineFlags.HIDE;
        }

        v2.sethide(hide);

        if (!hide) {
          drawlayer.add(v2);
        } else {
          drawlayer.remove(v2);
        }

        for (var s of v2.segments) {
          s.sethide(hide);

          if (!hide) {
            s.flag &= ~(SplineFlags.GHOST|SplineFlags.HIDE);
            drawlayer.add(s);
          } else {
            s.flag |= SplineFlags.GHOST|SplineFlags.HIDE;
            drawlayer.remove(s);
          }
        }
      }
    }

    this.pathspline.regen_sort();
  }
  
  //upload or download vertex animation data, depending on 
  //if ctx.spline refers to this.spline or not
  on_ctx_update(ctx) {
    console.trace("on_ctx_update");
    
    if (ctx.spline === this.spline) {
      //XXX leave update for frame change?
      //this.update_frame();
    } else if (ctx.spline === this.pathspline) {
      var resolve = 0;
      
      for (var v of this.spline.points) {
        if (v.eid in this.vertex_animdata) { //&& (v.flag & SplineFlags.FRAME_DIRTY)) {
          var vdata = this.get_vdata(v.eid, false);
          
          v.load(vdata.evaluate(this.time));
          v.flag &= ~SplineFlags.FRAME_DIRTY;
          v.flag |= SplineFlags.UPDATE;
          
          resolve = 1;
        }
      }
      
      this.spline.resolve = resolve;
    }
  }
  
  download() {
    console.trace("downloading. . .");
    var resolve = 0;
    
    for (var v of this.spline.points) {
      if (v.eid in this.vertex_animdata) {// && (v.flag & SplineFlags.FRAME_DIRTY)) {
        var vdata = this.get_vdata(v.eid, false);
        
        v.load(vdata.evaluate(this.time));
        v.flag &= ~SplineFlags.FRAME_DIRTY;
        v.flag |= SplineFlags.UPDATE;
        
        resolve = 1;
      }
    }
    
    this.spline.resolve = resolve;
  }
  
  update_frame(force_update) {
    this.check_vdata_integrity();

    var time = this.time;
    var spline = this.spline;
    
    if (spline == undefined) return;
    
    if (spline.resolve)
      spline.solve();
      
    this.kcache.set(time, spline);
    
    var is_first = time <= 1; //this.framelist.length == 0 || time == this.framelist[0];
    var found = false;
    
    for (var v of spline.points) {
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
    this.update_visibility();
  }
  
  insert_frame(time) {
    this.check_vdata_integrity();

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

  //off defaults to 0
  find_frame(time, off) {
    off = off === undefined ? 0 : off;

    var flist = this.framelist;
    for (var i=0; i<flist.length-1; i++) {
      if (flist[i] <= time && flist[i+1] > time) {
        break;
      }
    }
    
    if (i == flist.length) return frames[i-1]; //return undefined;
    return frames[i];
  }
  
  change_time(time, _update_animation=true) {
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
    
    for (var v of this.spline.points) {
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

      /* XXX fixme, load cached curve k parameters
      if (time in this.kcache.cache) {
        console.log("found cached k data!");
        
        this.kcache.load(time, spline);
        set_update = false;
      }
      //*/
      
      if (!set_update) {
        for (var seg of spline.segments) {
          if (seg.hidden) continue;
          
          seg.flag |= SplineFlags.REDRAW;
        }
        
        for (var face of spline.faces) {
          if (face.hidden) continue;
          
          face.flag |= SplineFlags.REDRAW;
        }
      }
      
      for (var v of spline.points) {
        var set_flag = v.eid in this.vertex_animdata;
        
        var vdata = this.get_vdata(v.eid, false);
        if (vdata == undefined) continue;
        
        //console.log("yay, vdata", vdata.evaluate(time));
        if (set_flag) {
          spline.setselect(v, vdata.flag & SplineFlags.SELECT);
          
          if (vdata.flag & SplineFlags.HIDE)
            v.flag |= SplineFlags.HIDE;
          else
            v.flag &= ~SplineFlags.HIDE;
        }
        
        v.load(vdata.evaluate(time));
        
        if (set_update) {
          v.flag |= SplineFlags.UPDATE;
        } else { //manually flag geometry for drawing
          /*
          for (var i=0; i<v.segments.length; i++) {
            var ss = v.segments[i];
            
            ss.flag |= SplineFlags.REDRAW; //redraw immediately; no need to wait for solve with REDRAW_PRE
            var l = ss.l, _i = 0;
            
            if (l == undefined)
              continue;
            
            do {
              if (_i++ > 1000) {
                console.trace("infinite loop detected");
                break;
              }
              
              l.f.flag |= SplineFlags.REDRAW;
              
              l = l.radial_next;
            } while (l != ss.l);
          }
          //*/
        }
        
        //console.log("--", vdata);
      }
      
      spline.resolve = 1;
      if (!window.inFromStruct)
        spline.solve();
    }
    
    for (var s of spline.segments) {
      if (s.hidden) continue;
      
      s.flag |= SplineFlags.UPDATE_AABB;
    }
    
    for (var f of spline.segments) {
      if (f.hidden) continue;
      
      f.flag |= SplineFlags.UPDATE_AABB;
    }
    
    this.spline = spline;
    this.time = time;
    this.frame = f;

    this.update_visibility();
  }
  
  delete_vdata() {
    this.vertex_animdata = {};
  }
  
  get_vdata(eid, auto_create=true) {
    if (typeof eid != "number") {
      throw new Error("Expected a number for eid");
    }
    
    if (auto_create && !(eid in this.vertex_animdata)) {
        this.vertex_animdata[eid] = new VertexAnimData(eid, this.pathspline);
    }
    
    return this.vertex_animdata[eid];
  }

  //checks keyframe spline data for topology errors vis-a-vis time
  //veid is optional, defaults to undefined
  check_vdata_integrity(veid) {
    var spline = this.pathspline;
    var found = false;

    if (veid === undefined) { //do all
      for (var k in this.vertex_animdata) {
        var vd = this.vertex_animdata[k];

        found |= vd.check_time_integrity();
      }
    } else {
      var vd = this.vertex_animdata[veid];

      if (vd === undefined) {
        console.log("Error: vertex ", veid, "not in frameset");
        return false;
      }

      found = vd.check_time_integrity();
    }

    if (found) {
      this.rationalize_vdata_layers();
      this.update_visibility();
      this.pathspline.regen_solve();
    }

    return found;
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
      
      for (var e of list) {
        e.layers = {};
      }
    }

    //*
    for (var k in this.vertex_animdata) {
      var vd = this.vertex_animdata[k];

      var vlayer = spline.layerset.new_layer();
      vlayer.flag |= SplineLayerFlags.HIDE;
      
      vd.layerid = vlayer.id;
      for (var v of vd.verts) {
        for (var i=0; i<v.segments.length; i++) {
          vlayer.add(v.segments[i]);
        }
        vlayer.add(v);
      }
    }
    //*/
  }
  
  draw(ctx, g, editor, redraw_rects, ignore_layers) {
    var size = editor.size, pos = editor.pos;
    
    this.draw_anim_paths = editor.draw_anim_paths;
    this.selectmode = editor.selectmode;
    
    this.spline.draw(redraw_rects, g, editor, editor.selectmode, editor.only_render, editor.draw_normals, this.spline===ctx.spline ? 1.0 : 0.3,
                     undefined, undefined, ignore_layers);
  }
  
  static fromSTRUCT(reader) {
    window.inFromStruct = true;
    var ret = STRUCT.chain_fromSTRUCT(SplineFrameSet, reader);

    //XXX kcache is being buggy, for now, don't load from disk
    ret.kcache = new SplineKCache();

    if (ret.kcache == undefined) {
      ret.kcache = new SplineKCache();
    }
    
    ret.afterSTRUCT();
    if (ret.pathspline == undefined) {
      ret.pathspline = ret.make_pathspline();
    }
    
    for (v of ret.pathspline.verts) {
     // v.flag |= SplineFlags.UPDATE;
    }
    for (var h of ret.pathspline.handles) {
     // h.flag |= SplineFlags.UPDATE;
    }
    
    for (var vd of ret.vertex_animdata) {
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
    
    //ensure owning_veid references are up to date
    for (let k in vert_animdata) {
      let vd = vert_animdata[k];
      
      for (let v of vd.verts) {
        vd._get_animdata(v).owning_veid = vd.eid;
      }
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

    ret.rationalize_vdata_layers();
    ret.update_visibility();

    //try {
      //ret.change_time(ret.time);
    /*} catch(error) {
      console.trace("\n==Error restoring frame data while loading frameset");
      print_stack();
      console.log("  Error restoring frame data while loading frameset==\n");
    }*/
    
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
}
""";
//XXX kcache            : SplineKCache;