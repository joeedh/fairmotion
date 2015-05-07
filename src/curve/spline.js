"use strict";

var PI = Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor,
    ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos,
    asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;

import {STRUCT} from 'struct';
import {DataBlock, DataTypes} from 'lib_api';
import {SessionFlags} from 'view2d_editor';
import {SelMask} from 'selectmode';
import {SplineQuery} from 'spline_query';
import {draw_spline, patch_canvas2d, set_rendermat} from 'spline_draw';
import {solve} from 'solver_new';
import {ModalStates} from 'toolops_api';
import {USE_NACL} from 'config';

var atan2 = Math.atan2;

if (Array.prototype.remove == undefined) {
  Array.prototype.remove = function(item, hide_error) {
    var i = this.indexOf(item);
    
    if (i < 0) {
      if (hide_error) console.trace("Error: item", item, "not in array", this);
      else throw new Error("Item " + item + " not in array");
      
      return;
    }
    
    var len = this.length;
    while (i < len) {
      this[i] = this[i+1];
      i++;
    }
    
    this.length--;
  }
}

//math globals
var FEPS = 1e-18;
var PI = Math.PI;
var sin = Math.sin, acos=Math.acos, asin=Math.asin, atan2=Math.atan2, sqrt=Math.sqrt;
var cos = Math.cos, pow=Math.pow, abs=Math.abs;
var SPI2 = Math.sqrt(PI/2);

export var _SOLVING = false;
export var INCREMENTAL = 1;

import {ORDER, KSCALE, KANGLE, KSTARTX, KSTARTY, KSTARTZ, KTOTKS, INT_STEPS} from 'spline_math';
import {solver, constraint} from "solver";
import "const";

import {
  SplineFlags, SplineTypes, SplineElement, SplineVertex, 
  SplineSegment, SplineLoop, SplineLoopPath, SplineFace} from 'spline_types';

import {ElementArraySet, ElementArray, 
        SplineLayer, SplineLayerSet} from 'spline_element_array';

#include "src/config/config_defines.js"

import {
  eval_curve,
  do_solve
} from 'spline_math';

export var RestrictFlags = {
  NO_EXTRUDE    : 1,
  NO_DELETE     : 2,
  NO_CONNECT    : 4,
  NO_DISSOLVE   : 8,
  NO_SPLIT_EDGE : 16,
  VALENCE2      : 32,
  NO_CREATE     : 64|1|4|16
};

function dom_bind(obj, name, dom_id) {
  Object.defineProperty(obj, name, {
    get : function() {
      var check = document.getElementById(dom_id);
      return check.checked;
    },
    set : function(val) {
      var check = document.getElementById(dom_id);
      check.checked = !!val;
    }
  });
}

var split_edge_rets = new cachering(function() {
  return [0, 0, 0];
}, 64);

var _elist_map = {
  "verts"   : SplineTypes.VERTEX,
  "handles" : SplineTypes.HANDLE,
  "segments" : SplineTypes.SEGMENT,
  "faces" : SplineTypes.FACE,
};

export class AllPointsIter {
  constructor(spline) {
    this.spline = spline;
    this.stage = 0;
    this.iter = spline.verts[Symbol.iterator]();
    
    this.ret = {done : false, value : undefined};
  }
  
  [Symbol.iterator]() {  
    return this;
  }
  
  next() {
    var ret = this.iter.next();
    
    this.ret.done = ret.done;
    this.ret.value = ret.value;
    
    if (ret.done && this.stage == 0) {
      this.stage = 1;
      this.iter = this.spline.handles[Symbol.iterator]();
      
      return this.next();
    }
    
    return this.ret;
  }
}

import {RecalcFlags} from 'spline_types';

export class Spline extends DataBlock {
  constructor(name=undefined) {
    super(DataTypes.SPLINE, name);
    
    static debug_id_gen=0;
    this._debug_id = debug_id_gen++;
    
    this.draw_sortlist = []; //has lines and faces mixed together
    
    this.recalc = RecalcFlags.DRAWSORT;
    this.size = [0, 0];
    
    this.restrict = 0;
    
    this.canvas = undefined;
    this.query = this.q = new SplineQuery(this);
    
    this.frame = 0;
    this.rendermat = new Matrix4();
    this.last_sim_ms = time_ms();
    this.segments = [];
    this.handles = [];
    
    this._idgen = new SDIDGen();
    
    this.last_save_time = time_ms();
    this.proportional = false;
    this.prop_radius = 100;

    this.eidmap = {};
    
    this.elist_map = {};
    this.elists = [];
    
    this.selectmode = 1;
    
    //this._resolve = false;
  
    this.layerset = new SplineLayerSet();
    this.layerset.new_layer();
    
    this.selected = new ElementArraySet();
    this.selected.layerset = this.layerset;
    
    this.draw_verts = true;
    this.draw_normals = true;
    
    this.init_elists();
  }
  
  //get resolve() {
  //  return this._resolve;
  //}
  
  //set resolve(val) {
  //  this._resolve = val;
  //}
  
  dag_get_datapath() {
    if (this.is_anim_path || (this.verts.cdata.layers.length > 0 && this.verts.cdata.layers[0].name == "TimeDataLayer"))
      return "frameset.pathspline";
    else
      return "frameset.drawspline";
  }
  
  regen_sort() {
    this.recalc |= RecalcFlags.DRAWSORT;
  }
  
  regen_render() {
    this.resolve = 1;
    this.recalc |= RecalcFlags.ALL;
  }
  
  init_elists() {
    this.elist_map = {};
    this.elists = [];
    
    for (var k in _elist_map) {
      var type = _elist_map[k];
      
      var list = new ElementArray(type, this.idgen, this.eidmap, this.selected, this.layerset);
      this[k] = list;
      this.elist_map[type] = list;
      
      this.elists.push(list);
    }
    
    this.init_sel_handlers();
  }
  
  init_sel_handlers() {
    var this2 = this;
    this.verts.on_select = function(v, state) {
      //console.log("on select!");
      
      for (var i=0; i<v.segments.length; i++) {
        var seg = v.segments[i];
        
        this2.handles.setselect(seg.handle(v), state);
      }
    }
  }
  
  get idgen() {
    return this._idgen;
  }
  
  set idgen(SDIDGen idgen) {
    this._idgen = idgen;

    //this can happen due to fromSTRUCT chaining
    if (this.elists == undefined) {
      return;
    }
    
    for (var i=0; i<this.elists.length; i++) {
      this.elists[i].idgen = idgen;
    }
  }
  
  copy() : Spline {
    var ret = new Spline();
    
    ret.idgen = this.idgen.copy();
    
    for (var i=0; i<ret.elists.length; i++) {
      ret.elists[i].idgen = ret.idgen;
      ret.elists[i].cdata.load_layout(this.elists[i].cdata);
    }
    
    var eidmap = ret.eidmap;
    
    for (var si=0; si<2; si++) {
      var list1 = si ?  this.handles : this.verts;
      var list2 = si ?  ret.handles  : ret.verts;
      
      for (var i=0; i<list1.length; i++) {
        var v = list1[i];
        var v2 = new SplineVertex(v);

        if (si == 1) {
          v2.type = SplineTypes.HANDLE;
        }
        v2.flag = v.flag;
        v2.eid = v.eid;
        list2.push(v2);
        
        if (si == 1) {
          ret.copy_handle_data(v2, v);
          v2.load(v);
        } else {
          ret.copy_vert_data(v2, v);
          v2.load(v);
        }
        
        eidmap[v2.eid] = v2;
        
        if (v == list1.active)
          list2.active = v2;
      }
    }
    
    for (var i=0; i<this.segments.length; i++) {
      var s = this.segments[i];
      var s2 = new SplineSegment();
      
      s2.eid = s.eid;
      s2.flag = s.flag;
      ret.segments.push(s2);
      eidmap[s2.eid] = s2;
      
      if (s == this.segments.active)
        ret.segments.active = s;
      
      s2.h1 = eidmap[s.h1.eid];
      s2.h2 = eidmap[s.h2.eid];
      s2.h1.segments.push(s2);
      s2.h2.segments.push(s2);
      
      s2.v1 = eidmap[s.v1.eid];
      s2.v2 = eidmap[s.v2.eid];
      s2.v1.segments.push(s2);
      s2.v2.segments.push(s2);
      
      for (var j=0; j<s.ks.length; j++) {
        s2.ks[j] = s.ks[j];
      }
      
      if (s.h1.hpair != undefined)
        s2.h1.hpair = eidmap[s.h1.hpair.eid]
      if (s.h2.hpair != undefined)
        s2.h2.hpair = eidmap[s.h2.hpair.eid]
      
      ret.copy_segment_data(s2, s);
    }
    
    for (var i=0; i<this.faces.length; i++) {
      var f = this.faces[i];
      
      var vlists = [];
      for (var list in f.paths) {
        var verts = [];
        vlists.push(verts);
        
        var l = list.l;
        do {
          verts.push(eidmap[l.v.eid]);
          
          l = l.next;
        } while (l != list.l);
      }
      
      var f2 = ret.make_face(vlists, f.eid);
      
      ret.copy_face_data(f2, f);
      eidmap[f2.eid] = f2;
      
      if (f == this.faces.active)
        ret.faces.active = f2;
    }
    
    return ret;
  }
  
  copy_element_data(dst, src) {
    if (dst.flag & SplineFlags.SELECT) {
      this.setselect(dst, false);
    }  
    
    dst.cdata.copy(src);
    dst.flag = src.flag;
    
    if (dst.flag & SplineFlags.SELECT) {
      dst.flag &= ~SplineFlags.SELECT;
      this.setselect(dst, true);
    }
  }
  
  copy_vert_data(dst, src) {
    this.copy_element_data(dst, src);
  }
  
  copy_handle_data(dst, src) {
    this.copy_element_data(dst, src);
  }
  
  copy_segment_data(dst, src) {
    this.copy_element_data(dst, src);
    dst.z = src.z;
    
    dst.mat.load(src.mat);
  }
  
  copy_face_data(dst, src) {
    this.copy_element_data(dst, src);
    dst.z = src.z;
    
    dst.mat.load(src.mat);
  }

  get points() {
    return new AllPointsIter(this);
  }
  
  make_vertex(co, eid=undefined) {
    var v = new SplineVertex(co);
    v.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
    
    this.verts.push(v, eid);
    return v;
  }
  
  get_elist(type) {
    return this.elist_map[type];
  }
  
  make_handle(co, eid=undefined) {
    var h = new SplineVertex();
    
    h.flag |= SplineFlags.BREAK_TANGENTS;
    h.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
    
    h.type = SplineTypes.HANDLE;
    this.handles.push(h, eid);
    
    return h;
  }
  
  split_edge(seg) {
    var co = seg.eval(0.5);
    
    static ws = [0.5, 0.5];
    static srcs = [0, 0];
    
    var hpair = seg.h2.hpair;
    if (hpair != undefined) {
       this.disconnect_handle(seg.h2);
    }
    
    var nv = this.make_vertex(co); //XXX, this.idgen.gen_id(seg.eid, 0));
    nv.flag |= seg.v1.flag & seg.v2.flag;
    
    if (nv.flag & SplineFlags.SELECT) {
      nv.flag &= ~SplineFlags.SELECT;
      
      this.verts.setselect(nv, true);
    }
    
    var v1 = seg.v1, v2 = seg.v2;
    var nseg = this.make_segment(nv, seg.v2); //XXX, this.idgen.gen_id(seg.eid, 1));
    
    seg.v2.segments.remove(seg);
    nv.segments.push(seg);
    seg.v2 = nv;
    
    /*
    v1-->nv-->v2 : l
    v1-->nv-->v2 : e
    v2<--nv<--v1 : l
    */
    
    if (seg.l != undefined) {
      var start = seg.l;
      var l = seg.l;
      
      var i = 0;
      
      var lst = [];
      do {
        lst.push(l);
        if (i++ > 100) {
          console.trace("Infinite loop error");
          break;
        }
        
        l = l.radial_next;
      } while (l != seg.l);
      
      for (var j=0; j<lst.length; j++) {
        var l = lst[j];
        
        var newl = this.make_loop();
        newl.f = l.f, newl.p = l.p;
        
        if (l.v === v1) {
          newl.s = nseg;
          newl.v = nv;
          
          l.next.prev = newl;
          newl.next = l.next;
          l.next = newl;
          newl.prev = l;
        } else if (1) {
          /*
          v1------->v2 | l
           l-->nv-->v2 : l ->
          v1-->nv-->v2 : e
     v0<--v1<--nv<--l  : l <-
     
          v1<-------v2 | l
          */
          //console.log("EEK!!!!!!!!!!!", v1.eid, v2.eid, "|", l.v.eid, l.next.v.eid, "|", l.prev.v.eid);
          
          this._radial_loop_remove(l);
          
          newl.s = seg;
          newl.v = nv;
          
          l.s = nseg;
          
          l.next.prev = newl;
          newl.next = l.next;
          l.next = newl;
          newl.prev = l;

          /*
          l.prev.next = newl;
          newl.prev = l.prev;
          l.prev = newl;
          newl.next = l;
          //*/
          
          this._radial_loop_insert(l);
        }
        
        this._radial_loop_insert(newl);
        l.p.totvert++;
      }
    }
    
    nv.flag      |= SplineFlags.UPDATE;
    seg.v1.flag  |= SplineFlags.UPDATE;
    nseg.v2.flag |= SplineFlags.UPDATE;
    
    var ret = split_edge_rets.next();
    ret[0] = nseg;
    ret[1] = nv;
    
    if (hpair != undefined) {
      this.connect_handles(nseg.h2, hpair);
    }
    
    //deal with customdata
    this.copy_segment_data(nseg, seg);
    
    //interpolate
    srcs[0] = v1.cdata, srcs[1] = v2.cdata;
    this.copy_vert_data(nv, v1);
    nv.cdata.interp(srcs, ws);
    
    this.resolve = 1;
    return ret;
  }
  
  find_segment(v1, v2) {
    for (var i=0; i<v1.segments.length; i++) {
      if (v1.segments[i].other_vert(v1) === v2) return v1.segments[i];
    }
    
    return undefined;
  }
  
  disconnect_handle(h1) {
    h1.hpair.hpair = undefined;
    h1.hpair = undefined;
  }
  
  connect_handles(h1, h2) {
    var s1 = h1.segments[0], s2 = h2.segments[0];
    if (s1.handle_vertex(h1) != s2.handle_vertex(h2)) {
      console.trace("Invalid call to connect_handles");
      return;
    }
    
    if (h1.hpair != undefined)
      this.disconnect_handle(h1);
    if (h2.hpair != undefined)
      this.disconnect_handle(h2);
    
    h1.hpair = h2;
    h2.hpair = h1;
  }

//note: INT_MAX is ((1<<30)*4-1)

#define MMLEN 8
#define UARR Uint16Array
#define UMAX ((1<<16)-1)
#define UMUL  2

  export_ks() {
    var mmlen = MMLEN;
    var size = 4/UMUL + 8/UMUL + this.segments.length*ORDER;
    
    size += this.segments.length*(4/UMUL);
    size += (8*Math.floor(this.segments.length/mmlen))/UMUL;
    
    var ret = new UARR(size);
    var view = new DataView(ret.buffer);
    
    var c = 0, d = 0
    
    //write number of bytes per integer
    view.setInt32(c*UMUL, UMUL);
    c += 4/UMUL;
    var mink, maxk;
    
    for (var i=0; i<this.segments.length; i++) {
      var s = this.segments[i];
      
      if (d == 0) {
          mink = 10000, maxk=-10000;
          
          for (var si=i; si<i+mmlen+1; si++) {
            if (si >= this.segments.length) break;
            
            var s2 = this.segments[si];
            for (var j=0; j<ORDER; j++) {
              mink = Math.min(mink, s2.ks[j]);
              maxk = Math.max(maxk, s2.ks[j]);
            }
          }
          
          //console.log("mink, maxk", mink, maxk);
          
          view.setFloat32(c*UMUL, mink);
          view.setFloat32(c*UMUL+4, maxk);
          
          c += 8/UMUL;
      }
      
      view.setInt32(c*UMUL, s.eid);
      c += 4/UMUL;
      
      for (var j=0; j<ORDER; j++) {
        var k = s.ks[j];
        
        k = (k-mink)/(maxk-mink);
        if (k < 0.0) {
          console.log("EVIL!", k, mink, maxk);
        }
        k = Math.abs(Math.floor(k*UMAX));
        
        ret[c++] = k;
      }
      
      d = (d + 1) % mmlen;
    }
    
    var ret2 = ret;
    /*
    for (var si=0; si<1; si++) {
      ret = LZString.compress(new Uint8Array(ret.buffer));

      var ret2 = new UARR(ret.length);
      
      for (var i=0; i<ret.length; i++) {
        ret2[i] = ret[i].charCodeAt(0);
      }
      
      ret = ret2;
    }
    //*/
    
    return ret2; //new Uint8Array(ret2.buffer);
  }
  
  import_ks(data) {
    data = new UARR(data.buffer);
    /*
    var s = "";
    for (var i=0; i<data.length; i++) {
      s += String.fromCharCode(data[i]);
    }
    
    var sdata = LZString.decompress(s);
    var data = new UARR(sdata.length)
    
    for (var i=0; i<sdata.length; i++) {
      data[i] = sdata[i].charCodeAt(0);
    }
    //*/
    
    var view = new DataView(data.buffer);
    var mmlen = MMLEN;
    var d = 0, i = 0;
    
    var datasize = view.getInt32(0);
    if (datasize != UMUL) {
      return undefined; //invalid
    }
    
    i += 4/UMUL;
    
    //console.log("mink, maxk", mink, maxk);
    
    while (i < data.length) {
      if (d == 0) {
        var mink = view.getFloat32(i*UMUL);
        var maxk = view.getFloat32(i*UMUL+4);
        
        //console.log("mink, maxk", mink, maxk);
        
        i += 8/UMUL;
      }
        
      d = (d + 1) % mmlen;
      
      if (i >= data.length) {
        console.log("SPLINE CACHE ERROR", i, data.length);
        break;
      }
      
      var eid = view.getInt32(i*UMUL);
      i += 4/UMUL;
      
      var s = this.eidmap[eid]
      
      if (s == undefined || !(s instanceof SplineSegment)) {
        console.log("Could not find segment", data[i-1]);
        i += ORDER;
        continue;
      }
      
      for (var j=0; j<ORDER; j++) {
        var k = data[i++]/UMAX;
        
        k = k*(maxk-mink) + mink;
        s.ks[j] = k;
      }
    }
    
    return data;
  }
  
  fix_spline() {
    this.verts.remove_undefineds();
    this.handles.remove_undefineds();
    this.segments.remove_undefineds();
    this.faces.remove_undefineds();
    
    for (var i=0; i<2; i++) {
      var list = i ? this.handles : this.verts;
      
      for (var v in list) {
        for (var j=0; j<v.segments.length; j++) {
          if (v.segments[j] == undefined) {
            v.pop_i(j);
            j--;
          }
        }
      }
    }
    
    var delsegments = new set();
    
    for (var v in this.verts) {
      for (var i=0; i<v.segments.length; i++) {
        var s = v.segments[i];
        
        if (s.v1 !== v && s.v2 !== v) {
          console.log("Corrupted segment! Deleting!");
          //do a manual, safe removal of s
          v.segments.remove(s, true);
          i--;
          
          delsegments.add(s);
        }
      }
    }
    
    for (var s in delsegments) {
      this.kill_segment(s, true, true);
      continue;
      
      this.segments.remove(s, true);
      delete this.eidmap[s.eid];
      
      if (s.v1.indexOf(s) >= 0)
        s.v1.segments.remove(s, true);
      if (s.v2.indexOf(s) >= 0)
        s.v2.segments.remove(s, true);
        
      if (s.h1 != undefined && s.h1.type == SplineTypes.HANDLE) {
        this.handles.remove(s.h1, true);
        delete this.eidmap[s.h1.eid];
      }
      if (s.h2 != undefined && s.h2.type == SplineTypes.HANDLE) {
        this.handles.remove(s.h2, true);
        delete this.eidmap[s.h2.eid];
      }
      
      if (s.l != undefined) {
        var l = s.l, c;
        var radial_next = l.radial_next;
        
        do {
          if (c++ > 100) {
            console.log("Infinite loop (in fix_splines)!");
            break;
          }
          
          this.kill_face(l.f);
          l = l.radial_next;
          
          if (l == undefined) 
            break;
        } while (l != s.l);
      }
    }
    
    for (var s in this.segments) {
      //console.log(s);
      
      if (s.v1.segments == undefined || s.v2.segments == undefined) {
//        if (!(s.v1 instanceof SplineVertex) || !(s.v2 instanceof SplineVertex)) {
          if (s.h1 instanceof SplineVertex)
            this.handles.remove(s.h1);
          if (s.h2 instanceof SplineVertex)
            this.handles.remove(s.h2);
          
          this.segments.remove(s);
          continue;
  //      }
      }
      
      if (s.v1.segments.indexOf(s) < 0) {
        s.v1.segments.push(s);
      }
      if (s.v2.segments.indexOf(s) < 0) {
        s.v2.segments.push(s);
      }
      if (s.h1 == undefined || s.h1.type != SplineTypes.HANDLE) {
        console.log("Missing handle 1; adding. . .", s.eid, s);
        s.h1 = this.make_handle();
        s.h1.load(s.v1).interp(s.v2, 1.0/3.0);
      }
      
      if (s.h2 == undefined || s.h2.type != SplineTypes.HANDLE) {
        console.log("Missing handle 2; adding. . .", s.eid, s);
        s.h2 = this.make_handle();
        s.h2.load(s.v2).interp(s.v2, 2.0/3.0);
      }
      if (s.h1.segments[0] != s)
        s.h1.segments = [s];
      if (s.h2.segments[0] != s)
        s.h2.segments = [s];
    }
    
    var max_eid = 0;
    for (var i=0; i<this.elists.length; i++) {
      var elist = this.elists[i];
      
      for (var e in elist) {
        max_eid = Math.max(e.eid, max_eid);
      }
    }
    
    var curid = !("cur_id" in this.idgen) ? "cur_eid" : "cur_id";
    if (max_eid >= this.idgen[curid]) {
      console.trace("IDGEN ERROR! DOOM! DOOM!");
      this.idgen[curid] = max_eid+1;
    }
  }
  
  select_flush(int datamode) {
    if (datamode & (SplineTypes.VERTEX|SplineTypes.HANDLE)) {
      //flush upwards
      this.segments.clear_selection();
      this.faces.clear_selection();
      
      for (var v in this.verts.selected) {
        for (var s in v.segments) {
          if (s.other_vert(v).flag & SplineFlags.SELECT) {
            if (this.segments.active == undefined || !(this.segments.active.flag & SplineFlags.SELECT))
              this.segments.active = s;
            
            this.segments.setselect(s, true);
            console.log("selecting segment");
          }
          
          var l = s.l;
          if (l == undefined) continue;
          var c=0;
          
          do {
            if (c++ > 1000) {
              console.log("Infinite loop detected!");
              break;
            }
            
            var f = l.f;
            if (f.flag & SplineFlags.SELECT) {
              l = l.next;
              continue;
            }
            
            var good = true;
            
            for (var path in f.paths) {
              for (var l2 in path) {
                if (!(l2.v.flag & SplineFlags.SELECT)) {
                  good = false;
                  break;
                }
              }
              if (!good) 
                break;
            }
            
            if (good) {
              console.log("selecting face");
              this.faces.setselect(f, true);
            }
            
            l = l.next;
          } while (l != s.l);
        }
      }
    } else if (datamode == SplineTypes.SEGMENT) {
      this.verts.clear_selection();
      this.faces.clear_selection();
      
      for (var s in this.segments.selected) {
        this.verts.setselect(s.v1, true);
        this.verts.setselect(s.v2, true);
        
        var l = s.l;
        if (l == undefined) 
          continue;
        var c=0;
        
        do {
          if (c++ > 1000) {
            console.log("Infinite loop detected!");
            break;
          }
          
          var f = l.f;
          if (f.flag & SplineFlags.SELECT) {
            l = l.next;
            continue;
          }
          
          var good = true;
          
          for (var path in f.paths) {
            for (var l2 in path) {
              if (!(l2.s.flag & SplineFlags.SELECT)) {
                good = false;
                break;
              }
            }
            if (!good) 
              break;
          }
          
          if (good) {
            console.log("selecting face");
            this.faces.setselect(f, true);
          }
          
          l = l.next;
        } while (l != s.l);
      }
    } else if (datamode == SplineTypes.FACE) {
      this.verts.clear_selection();
      this.segments.clear_selection();
      
      for (var f in this.faces.selected) {
        for (var path in f.paths) {
          for (var l in path) {
            this.verts.setselect(l.v, true);
            this.segments.setselect(l.s, true);
          }
        }
      }
    }  
  }
  
  make_segment(v1, v2, eid=undefined, check_existing=true) {
    if (eid == undefined)
      eid = this.idgen.gen_id();
    
    if (check_existing) {
      var seg = this.find_segment(v1, v2);
      if (seg != undefined) return seg;
    }
    
    var seg = new SplineSegment(v1, v2);
    
    seg.h1 = this.make_handle();
    seg.h2 = this.make_handle();

    seg.h1.load(v1).interp(v2, 1.0/3.0);
    seg.h2.load(v1).interp(v2, 2.0/3.0);
    
    seg.h1.segments.push(seg);
    seg.h2.segments.push(seg);
    
    seg.v1.segments.push(seg);
    seg.v2.segments.push(seg);
    
    seg.v1.flag |= SplineFlags.UPDATE;
    seg.v2.flag |= SplineFlags.UPDATE;
    
    seg.h1.flag |= SplineFlags.UPDATE;
    seg.h2.flag |= SplineFlags.UPDATE;
    
    seg.flag |= SplineFlags.UPDATE;
    
    this.segments.push(seg, eid);
    return seg;
  }
  
  _radial_loop_insert(l) {
    if (l.s.l == undefined) {
      l.radial_next = l.radial_prev = l;
      l.s.l = l;
      return;
    }
    
    l.radial_next = l.s.l;
    l.radial_prev = l.s.l.radial_prev;
    l.s.l.radial_prev.radial_next = l.s.l.radial_prev = l;
    
    l.s.l = l;
  }
  
  _radial_loop_remove(l) {
    l.radial_next.radial_prev = l.radial_prev;
    l.radial_prev.radial_next = l.radial_next;
    
    if (l === l.radial_next) {
      l.s.l = undefined;
    } else if (l === l.s.l) {
      l.s.l = l.radial_next;
    }
  }
  
  make_face(vlists, custom_eid=undefined) {
    var f = new SplineFace();
    
    if (custom_eid == -1) custom_eid = undefined;
    this.faces.push(f);
    
    //validate input
    for (var i=0; i<vlists.length; i++) {
      var verts = vlists[i];
      
      if (verts.length < 3) {
        throw new Error("Must have at least three vertices for face");
      }
      
      //detect duplicates
      var vset = {};
      for (var j=0; j<verts.length; j++) {
        if (verts[j].eid in vset) {
          console.log(vlists);
          throw new Error("Duplicate verts in make_face");
        }
        vset[verts[j].eid] = 1;
      }
    }
    
    for (var i=0; i<vlists.length; i++) {
      var verts = vlists[i];
      var list = new SplineLoopPath();
      
      list.f = f;
      list.totvert = verts.length;
      f.paths.push(list);
      
      var l = undefined, prevl = undefined;
      for (var j=0; j<verts.length; j++) {
        var v1 = verts[j], v2 = verts[(j+1)%verts.length];
        
        var s = this.make_segment(v1, v2, undefined, true);
        var l = this.make_loop();
        
        l.v = v1;
        l.s = s;
        l.f = f;
        l.p = list;
        
        if (prevl == undefined) {
          list.l = l;
        } else {
          l.prev = prevl;
          prevl.next = l;
        }
        
        prevl = l;
      }
      
      list.l.prev = prevl;
      prevl.next = list.l;
      
      var l = list.l;
      do {
        this._radial_loop_insert(l);
        l = l.next;
      } while (l != list.l);
    }
    
    return f;
  }
  
  make_loop() {
    var l = new SplineLoop();
    
    l.eid = this.idgen.gen_id();
    this.eidmap[l.eid] = l;
    
    return l;
  }
  
  kill_loop(l) {
    delete this.eidmap[l.eid];
  }
  
  _element_kill(e) {
  }
  
  kill_face(f) {
    for (var i=0; i<f.paths.length; i++) {
      var path = f.paths[i];
      
      for (var l in path) {
        this._radial_loop_remove(l);
        this.kill_loop(l);
      }
    }
    
    this._element_kill(f);
    this.faces.remove(f);
  }
  
  kill_segment(seg, kill_faces=true, soft_error=false) {
    var i=0;
    while (kill_faces && seg.l != undefined) {
      this.kill_face(seg.l.f);
      
      if (i++ > 1000) {
        console.trace("Infinite loop in kill_segment!!", seg);
        break;
      }
    }
    
    if (seg.v1.segments != undefined)
      seg.v1.segments.remove(seg, soft_error);
      
    if (seg.v2.segments != undefined)
      seg.v2.segments.remove(seg, soft_error);
    
    this.handles.remove(seg.h1, soft_error);
    this.handles.remove(seg.h2, soft_error);
    
    this._element_kill(seg);
    this.segments.remove(seg, soft_error);
  }
  
  do_save() {
    var obj = this.toJSON();
    var buf = JSON.stringify(obj);
    
    var blob = new Blob([buf], {type: "application/json"});
    
    var obj_url = window.URL.createObjectURL(blob);
    window.open(obj_url);
  }
  
  dissolve_vertex(v) {
    var ls2 = [];
    
    if (v.segments.length != 2) return;
    
    for (var i=0; i<v.segments.length; i++) {
      var s = v.segments[i];
      
      if (s.l == undefined) continue;
      
      var lst = [];
      var l = s.l;
      do {
        lst.push(l);
        l = l.radial_next;
      } while (l != s.l);
      
      for (var j=0; j<lst.length; j++) {
        var l = lst[j];
        
        if (l.v !== v && l.next.v !== v)
          continue;
        
        console.log("vs", v.eid, "|", l.prev.v.eid, l.v.eid, l.next.v.eid);
        if (l.v !== v) {
            l = l.next;
        }
        
        console.log("vl", v.eid, l.v.eid);
        
        if (l === l.p.l)
          l.p.l = l.next;
        
        if (l.p.totvert <= 3 || l.p.l === l) {
          console.log("DESTROYING FACE!!", l.f.eid);
          
          this.kill_face(l.f);
          continue;
        }
        
        this._radial_loop_remove(l);
          
        ls2.push(l.prev);
        
        l.prev.next = l.next;
        l.next.prev = l.prev;
        
        this.kill_loop(l);
        l.p.totvert--;
      }
    }
    
    if (v.segments.length == 2) {
      var s1 = v.segments[0], s2 = v.segments[1];
      
      var v1 = s1.other_vert(v), v2 = s2.other_vert(v);
      var existing = this.find_segment(v1, v2);
      
      if (s1.v1 == v) s1.v1 = v2;
      else s1.v2 = v2;
      
      var ci=0;
      while (s2.l != undefined) {
        this._radial_loop_remove(s2.l);
        
        if (ci++ > 100) {
          console.log("Infinite loop error!");
          break;
        }
      }
      while (s1.l != undefined) {
        this._radial_loop_remove(s1.l);
        
        if (ci++ > 100) {
          console.log("Infinite loop error!");
          break;
        }
      }
      
      this.kill_segment(s2);
      
      v2.segments.push(s1);
      v.segments.length = 0;
      
      if (existing) {
        this.kill_segment(s1);
        s1 = existing;
      }
      
      if (s1.l == undefined) {
        for (var i=0; i<ls2.length; i++) {
          var l = ls2[i];
          
          l.s = s1;
          this._radial_loop_insert(l);
          
          console.log(s1.v1.eid, s1.v2.eid, "|", l.prev.v.eid, l.v.eid, l.next.v.eid);
        }
      }
      
      v.flag |= SplineFlags.UPDATE;
      v2.flag |= SplineFlags.UPDATE;
    }
    
    this.kill_vertex(v);
    this.resolve = 1;
  }
  
  kill_vertex(v) {
    //XXX paranoia removal from selection list, should not be necassary
    if (v.flag & SplineFlags.SELECT) {
      this.verts.setselect(v, false);
    }
    
    if (this.hpair != undefined)
      this.disconnect_handle(this);
    
    while (v.segments.length > 0) {
      var last = v.segments.length;
      this.kill_segment(v.segments[0]);
      
      if (last == v.segments.length) {
        console.log("EEK!");
        break;
      }
    }
    
    if (this.verts.active == v) this.verts.active = undefined;
    if (this.verts.highlight == v) this.verts.highlight = undefined;
    
    delete this.eidmap[v.eid];
    
    this._element_kill(v);
    this.verts.remove(v);
  }
  
  _vert_flag_update(v, depth, limit) {
    if (depth >= limit) return;
    
    v.flag |= SplineFlags.TEMP_TAG;
    
    for (var i=0; i<v.segments.length; i++) {
      var s = v.segments[i], v2 = s.other_vert(v);
      
      if (v2 == undefined || v2.segments == undefined) {
        console.trace("ERROR 1: v, s, v2:", v, s, v2);
        continue;
      }
      
      var has_tan = v2.segments.length <= 2;
      for (var j=0; j<v2.segments.length; j++) {
        var h = v2.segments[j].handle(v2);
        
        if ((v2.flag & SplineFlags.SELECT) && h.hpair != undefined) {
          has_tan = true;
        }
      }
      
      
      if (!has_tan) {
        continue;
      }
      
      //don't propegate as far after tangent breaks
      if (v2.flag & SplineFlags.BREAK_TANGENTS) {
        limit = Math.min(limit, depth+2);
      }
      
      if (!(v2.flag & SplineFlags.TEMP_TAG)) {
        this._vert_flag_update(v2, depth+1, limit);
      }
    }
    
    for (var j=0; j<v.segments.length; j++) {
      var s = v.segments[j], v2 = s.other_vert(v);
      
      if (v2.segments.length > 2 || (v2.flag & SplineFlags.BREAK_TANGENTS))
        v2.flag |= SplineFlags.TEMP_TAG;
    }
  }
  
  propagate_update_flags() {
    var verts = this.verts;
    for (var i=0; i<verts.length; i++) {
      var v = verts[i];
      v.flag &= ~SplineFlags.TEMP_TAG;
    }
    
    var limit = 5;
    
    for (var i=0; i<verts.length; i++) {
      var v = verts[i];
      if (v.flag & SplineFlags.UPDATE) {
        this._vert_flag_update(v, 0, limit);
      }
    }
    
    for (var i=0; i<verts.length; i++) {
      var v = verts[i];
      if (v.flag & SplineFlags.TEMP_TAG) {
        v.flag |= SplineFlags.UPDATE;
      }
    }
  }
  
  solve(steps, gk) {
    do_solve(SplineFlags, this, steps, gk);
  }
  
  solve_p(steps, gk) {
    if (USE_NACL && window.common != undefined && window.common.naclModule != undefined) {
      return do_solve(SplineFlags, this, steps, gk, true);
    } else {
      this.resolve = 1;
      
      var this2 = this;
      var promise = new Promise(function(resolve, reject) {
        this2.on_resolve = function() {
          console.log("Finished!");
          resolve();
        }
      });
      
      if (this._update_timer_p == undefined) {
        this._update_timer_p = window.setInterval(function() {
          window.clearInterval(this2._update_timer_p);
          this2._update_timer_p = undefined;
          
          if (this2.resolve)
            do_solve(SplineFlags, this2, steps, gk, false)
        });
      }
      
      return promise;
    }
  }
    
  trace_face(g, f) {
    g.beginPath();
    
    static lastco = new Vector3();
    lastco.zero();
    
    for (var path in f.paths) {
      var first = true;
      
      for (var l in path) {
        var seg = l.s;
        
        var flip = seg.v1 !== l.v;
        var s = flip ? seg.ks[KSCALE] : 0, ds = flip ? -2 : 2;
        
        while ((!flip && s < seg.ks[KSCALE]) || (flip && s >= 0)) {
          var co = seg.eval(s/seg.length);
          
          if (first) {
            first = false;
            g.moveTo(co[0], co[1]);
          } else {
            g.lineTo(co[0], co[1]);
          }
          
          s += ds;
        }
      }
    }
    
    g.closePath();
  }
  
  forEachPoint(cb, thisvar, immuate) {
    for (var si=0; si<2; si++) {
      var list = si ? this.handles : this.verts;
      var last_len = list.length;
      
      for (var i=0; i<list.length; i++) {
        if (thisvar != undefined)
          cb.call(thisvar, list[i]);
        else
          cb(list[i]);
        
        last_len = list.length;
      }
    }
  }
  
  build_shash() {
    var sh = {};
    var cellsize = 150;
    
    sh.cellsize = cellsize;
    
    function hash(x, y, cellsize) {
      return Math.floor(x/cellsize) + "," + Math.floor(y/cellsize);
    }
    
    for (var si=0; si<2; si++) {
      var list = si ? this.handles : this.verts;
      
      for (var v in list) {
        var h = hash(v[0], v[1], cellsize);
        
        if (!(h in sh)) {
          sh[h] = [];
        }
        
        sh[h].push(v);
      }
    }
    
    var sqrt2 = sqrt(2);
    sh.forEachPoint = function sh_lookupPoints(co, radius, callback, thisvar) {
      var cellsize = this.cellsize;
      var cellradius = Math.ceil(sqrt2*radius/cellsize);
      
      var sx = Math.floor(co[0]/cellsize)-cellradius; 
      var sy = Math.floor(co[1]/cellsize)-cellradius; 
      var ex = Math.ceil(co[0]/cellsize)+cellradius;
      var ey = Math.ceil(co[1]/cellsize)+cellradius;
      
      //console.log("| ", sx, sy, ex, ey);
      
      for (var x = sx; x <= ex; x++) {
        for (var y = sy; y <= ey; y++) {
          var h = hash(x*cellsize, y*cellsize, cellsize);
          
          if (!(h in this)) continue;
          
          var list = this[h];
          for (var i=0; i<list.length; i++) {
            var e = list[i];
            var dis = e.vectorDistance(co);
            
            if (dis < radius && co !== e) {
              callback.call(thisvar, e, dis);
            }
          }
        }
      }
    }
    
    return sh;
  }
  
  unhide_all() {
    for (var i=0; i<this.verts.length; i++) {
      var v = this.verts[i];
        if (v.flag & SplineFlags.HIDE) {
          v.flag &= ~SplineFlags.HIDE;
          v.flag |= SplineFlags.SELECT;
        }
      }
  }
  
  duplicate_verts() {
    var newvs = [];
    var idmap = {};
      
    for (var i=0; i<this.verts.length; i++) {
      var v = this.verts[i];

      if (!(v.flag & SplineFlags.SELECT)) continue;
      if (v.hidden) continue;
      
      var nv = this.make_vertex(v);
      idmap[v.eid] = nv;
      idmap[nv.eid] = v;
      
      nv.flag = v.flag & ~SplineFlags.SELECT;
      newvs.push(nv);
    }
    
    for (var i=0; i<this.segments.length; i++) {
      var seg = this.segments[i];
      if ((seg.v1.flag & SplineFlags.SELECT) && (seg.v2.flag & SplineFlags.SELECT)) {
        var v1 = idmap[seg.v1.eid], v2 = idmap[seg.v2.eid];
        
        if (v1 == undefined || v2 == undefined || v1 == v2) continue;
        
        this.make_segment(v1, v2);
      }
    }
    
    for (var i=0; i<this.verts.length; i++) {
      var v = this.verts[i];
      this.verts.setselect(v, false);
    }
    
    for (var i=0; i<newvs.length; i++) {
      this.verts.setselect(newvs[i], true);
    }
    
    this.start_mpos[0] = this.mpos[0];
    this.start_mpos[1] = this.mpos[1];
    
    this.start_transform();
    
    this.resolve = 1;
  }
  
  clear_highlight() {
    for (var i=0; i<this.elists.length; i++) {
      this.elists[i].highlight = undefined;
    }
  }
  
  validate_active() {
    for (var i=0; i<this.elists.length; i++) {
      var elist = this.elists[i];
      
      if (elist.active != undefined && elist.active.hidden)
        elist.active = undefined;
    }
  }
  
  clear_active(e) {
    this.set_active(undefined);
  }
  
  set_active(SplineElement e) {
    if (e == undefined) {
      for (var i=0; i<this.elists.length; i++) {
        this.elists[i].active = undefined;
      }
      return;
    }
    
    var elist = this.get_elist(e.type);
    elist.active = e;
  }
  
  setselect(SplineElement e, Boolean state) { 
    var elist = this.get_elist(e.type);
    elist.setselect(e, state);
  }
  
  clear_selection(SplineElement e) {
    for (var i=0; i<this.elists.length; i++) {
      this.elists[i].clear_selection();
    }
  }

  do_mirror() {
    this.start_transform('s');
    for (var i=0; i<this.transdata.length; i++) {
      var start = this.transdata[i][0], v = this.transdata[i][1];
      if (v.flag & SplineFlags.HIDE) continue;
      
      v.sub(this.trans_cent); v[0] = -v[0]; v.add(this.trans_cent);
      
    }
    
    this.end_transform();
    this.resolve = 1;
  }
  
  toJSON(self) {
    var ret = {};
    
    ret.frame = this.frame;
    ret.verts = {length : this.verts.length};
    ret.segments = [];
    
    ret.handles = [];
    ret.draw_verts = this.draw_verts;
    ret.draw_normals = this.draw_normals;
    ret._cur_id = this.idgen.cur_id;
    
    for (var i=0; i<this.verts.length; i++) {
      ret.verts[i] = this.verts[i].toJSON();
    }
    
    if (this.verts.active != undefined)
      ret.verts.active = this.verts.active.eid;
    else
      ret.verts.active = undefined;
      
    if (this.handles.active != undefined)
      ret.handles.active = this.handles.active.eid;
      
    if (this.segments.active != undefined)
      ret.segments.active = this.segments.active.eid;
    
    for (var i=0; i<this.segments.length; i++) {
      ret.segments.push(this.segments[i].toJSON());
    }
    
    for (var i=0; i<this.handles.length; i++) {
      ret.handles.push(this.handles[i].toJSON());
    }
    
    return ret;
  }
  
  reset() {
    this.idgen = new SDIDGen();
    
    this.init_elists();
  }
  
  import_json(obj) {
    var spline2 = Spline.fromJSON(obj);
    
    var miny = 1e18, maxy = 1e-18;
    
    var newmap = {};
    for (var i=0; i<spline2.verts.length; i++) {
      var v = spline2.verts[i];
      
      var nv = this.make_vertex(v, v.eid);
      nv.flag = v.flag;
      nv.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
    
      miny = Math.min(miny, nv[1]);
      maxy = Math.max(maxy, nv[1]);
      newmap[v.eid] = nv;
    }
    
    for (var i=0; i<spline2.verts.length; i++) {
      var v = spline2.verts[i], nv = newmap[v.eid];
      
      nv[1] = ((maxy-miny) - (nv[1] - miny)) + miny;
    }
    
    for (var i=0; i<spline2.segments.length; i++) {
      var seg = spline2.segments[i];
      
      var v1 = newmap[seg.v1.eid], v2 = newmap[seg.v2.eid];
      var nseg = this.make_segment(v1, v2);
      
      nseg.flag = seg.flag | SplineFlags.UPDATE | SplineFlags.FRAME_DIRTY;
      newmap[seg.eid] = nseg;
    }
    
    this.resolve = 1;
  }
  
  static fromJSON(obj) {
    var spline = new Spline();
    
    spline.idgen.cur_id = obj._cur_id;
    
    spline.draw_verts = obj.draw_verts;
    spline.draw_normals = obj.draw_normals;
    
    var eidmap = {};
    
    for (var i=0; i<obj.verts.length; i++) {
      var cv = obj.verts[i];
      
      var v = spline.make_vertex(cv);
      v.flag |= SplineFlags.FRAME_DIRTY;
      
      v.flag = cv.flag;
      v.eid = cv.eid;
      v.segments = cv.segments;
      eidmap[v.eid] = v;
    }

    for (var i=0; i<obj.handles.length; i++) {
      var cv = obj.handles[i];
      
      var v = spline.make_handle(cv);
      
      v.flag = cv.flag;
      v.eid = cv.eid;
      v.segments = cv.segments;
      
      eidmap[v.eid] = v;
    }
    
    for (var i=0; i<obj.segments.length; i++) {
      var s = obj.segments[i];
      var segments = obj.segments;
      
      var v1 = eidmap[s.v1], v2 = eidmap[s.v2];
      var h1 = eidmap[s.h1], h2 = eidmap[s.h2];
      
      var seg = new SplineSegment();
      
      seg.eid = s.eid; seg.flag = s.flag;
      
      if (seg.ks.length == s.ks.length) {
        seg.ks = s.ks;
      } else {
        spline.resolve = true;
        
        for (var j=0; j<spline.verts.length; j++) {
          spline.verts[j].flag |= SplineFlags.UPDATE;
        }
      }
      
      for (var j=0; j<seg.ks.length; j++) {
        if (isNaN(seg.ks[j])) {
          seg.ks[j] = 0.0;
        }
      }
      
      seg.v1 = v1, seg.v2 = v2, seg.h1 = h1, seg.h2 = h2;
      
      spline.segments.push(seg);
      eidmap[seg.eid] = seg;
    }
    
    for (var i=0; i<obj.verts.length; i++) {
      var v = obj.verts[i];
      
      for (var j=0; j<v.segments.length; j++) {
        v.segments[j] = eidmap[v.segments[j]];
      }
    }
    
    for (var i=0; i<obj.handles.length; i++) {
      var v = obj.handles[i];
      
      for (var j=0; j<v.segments.length; j++) {
        v.segments[j] = eidmap[v.segments[j]];
      }
    }
    
    if (obj.verts.active != undefined)
      spline.verts.active = eidmap[obj.verts.active];
    
    if (obj.handles.active != undefined)
      spline.handles.active = eidmap[obj.handles.active];
      
    if (obj.segments.active != undefined)
      spline.segments.active = eidmap[obj.segments.active];
    
    spline.eidmap = eidmap;
    
    return spline;
  }
  
  prune_singles() {
    var del = [];
    
    for (var i=0; i<this.verts.length; i++) {
      var v = this.verts[i];
      
      if (v.segments.length == 0) {
        del.push(v);
      }
    }
    
    for (var i=0; i<del.length; i++) {
      this.kill_vertex(del[i]);
    }
  }
  
  draw(g, editor, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime) {
    this.canvas = g;
    this.selectmode = selectmode;
    
    if (g._is_patched == undefined) {
      patch_canvas2d(g);
    }
    
    g._is_patched = this;
    
    g.lineWidth = 1;
    if (this.resolve) {
      this.solve();
    }
    
     draw_spline(this, g, editor, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime);
  }
  
  static fromSTRUCT(reader) {
    var ret = STRUCT.chain_fromSTRUCT(Spline, reader);
    
    ret.afterSTRUCT();

    //chain_fromSTRUCT corrupts this, argh!
    ret.query = ret.q = new SplineQuery(ret);
    
    var eidmap = {};
    
    ret.elists = [];
    ret.elist_map = {};
    
    //restore elist stuff
    for (var k in _elist_map) {
      var type = _elist_map[k];
      var v = ret[k];
      
      if (v == undefined) continue;
      
      ret.elists.push(v);
      ret.elist_map[type] = v;
    }
    
    ret.init_sel_handlers();
    
    for (var si=0; si<2; si++) {
      var list = si ? ret.handles : ret.verts;
      
      for (var i=0; i<list.length; i++) {  
        var v = list[i];
        
        eidmap[v.eid] = v;
        if (v.type == SplineTypes.VERTEX)
          v.hpair = undefined;
      }
    }
    
    for (var h in ret.handles) {
      h.hpair = eidmap[h.hpair];
    }
    
    for (var i=0; i<ret.segments.length; i++) {
      var s = ret.segments[i];
      
      s.v1 = eidmap[s.v1];
      s.v2 = eidmap[s.v2];
      
      s.h1 = eidmap[s.h1];
      s.h2 = eidmap[s.h2];
      
      eidmap[s.eid] = s;
    }
    
    for (var si=0; si<2; si++) {
      var list = si ? ret.handles : ret.verts;
      
      for (var i=0; i<list.length; i++) {  
        var v = list[i];
        
        for (var j=0; j<v.segments.length; j++) {
          v.segments[j] = eidmap[v.segments[j]];
        }
      }
    }
    
    for (var i=0; i<ret.faces.length; i++) {
      var f = ret.faces[i];
      
      f.flag |= SplineFlags.UPDATE_AABB;
      
      eidmap[f.eid] = f;
      for (var path in f.paths) {
        path.f = f;
        
        var l = path.l;
        
        do {
          eidmap[l.eid] = l;
          
          l.f = f;
          l.s = eidmap[l.s];
          l.v = eidmap[l.v];
          
          l = l.next;
        } while (l != path.l);
      }
    }
    
    for (var i=0; i<ret.faces.length; i++) {
      var f = ret.faces[i];
      
      for (var path in f.paths) {
        var l = path.l;
        do {
          //console.log("doing loop ", l.eid, l.f.eid);
          //console.log("radial next/prev:", l.radial_next, l.radial_prev, l.eid);
          
          //if (typeof(l.radial_next) == "number")
            l.radial_next = eidmap[l.radial_next];
          //if (typeof(l.radial_prev) == "number")
            l.radial_prev = eidmap[l.radial_prev];
          
          l = l.next;
        } while (l != path.l);
      }
      //console.log("\n");
    }
    
    for (var i=0; i<ret.segments.length; i++) {
      var s = ret.segments[i];
      
      s.l = eidmap[s.l];
    }
    
    ret.eidmap = eidmap;
    
    var selected = new ElementArraySet();
    selected.layerset = ret.layerset;
    
    for (var i=0; i<ret.selected.length; i++) {
      var eid = ret.selected[i];
      
      if (!(eid in eidmap)) {
        console.log("WARNING! eid", eid, "not in eidmap!", Object.keys(eidmap));
        continue;
      }
      
      selected.add(eidmap[ret.selected[i]]);
    }
    
    ret.selected = selected;
    
    ret.verts.afterSTRUCT(SplineTypes.VERTEX, ret.idgen, ret.eidmap, ret.selected, ret.layerset);
    ret.handles.afterSTRUCT(SplineTypes.HANDLE, ret.idgen, ret.eidmap, ret.selected, ret.layerset);
    ret.segments.afterSTRUCT(SplineTypes.SEGMENT, ret.idgen, ret.eidmap, ret.selected, ret.layerset);
    ret.faces.afterSTRUCT(SplineTypes.FACE, ret.idgen, ret.eidmap, ret.selected, ret.layerset);
    
    if (ret.layerset == undefined) {
      ret.layerset = new SplineLayerSet();
      ret.layerset.new_layer();
    } else {
      ret.layerset.afterSTRUCT(ret);
    }
    
    ret.regen_sort();
    
    return ret;
  }
};

Spline.STRUCT = STRUCT.inherit(Spline, DataBlock) + """
    idgen    : SDIDGen;
    
    selected : iter(e, int) | e.eid;
    
    verts    : ElementArray;
    handles  : ElementArray;
    segments : ElementArray;
    faces    : ElementArray;
    layerset : SplineLayerSet;
    
    restrict : int;
}
"""
