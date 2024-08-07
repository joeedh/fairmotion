"use strict";

import {util} from '../path.ux/scripts/pathux.js';

//note: INT_MAX is ((1<<30)*4-1)

const MMLEN = 8;
const UARR = Uint16Array
const UMAX = ((1<<16) - 1)
const UMUL = 2

const PI = Math.PI, abs = Math.abs, sqrt = Math.sqrt, floor = Math.floor,
  ceil = Math.ceil, sin = Math.sin, cos = Math.cos, acos = Math.acos,
  asin = Math.asin, tan = Math.tan, atan = Math.atan, atan2 = Math.atan2;

import * as spline_multires from './spline_multires.js';
import {STRUCT} from '../core/struct.js';
import {DataBlock, DataTypes} from '../core/lib_api.js';
import {SessionFlags} from '../editors/viewport/view2d_editor.js';
import {SelMask} from '../editors/viewport/selectmode.js';
import {SplineQuery} from './spline_query.js';
import {draw_spline, redo_draw_sort} from './spline_draw.js';
import {solve} from './solver_new.js';
import {ModalStates} from '../core/toolops_api.js';
import {DataPathNode} from '../core/eventdag.js';

import * as config from '../config/config.js';

//math globals
const FEPS = 1e-18;
const SPI2 = Math.sqrt(PI/2);

export let _SOLVING = false;
export let INCREMENTAL = 1;

import {ORDER, KSCALE, KANGLE, KSTARTX, KSTARTY, KSTARTZ, KTOTKS, INT_STEPS} from './spline_math.js';
import {solver, constraint} from "./solver.js";
import "../path.ux/scripts/config/const.js";

import * as native_api from '../wasm/native_api.js';

import {
  SplineFlags, SplineTypes, SplineElement, SplineVertex,
  SplineSegment, SplineLoop, SplineLoopPath, SplineFace
} from './spline_types.js';

import {
  ElementArraySet, ElementArray,
  SplineLayer, SplineLayerSet
} from './spline_element_array.js';

let _internal_idgen = 0;

let rect_tmp = [
  new Vector2(), new Vector2()
];

import {
  eval_curve,
  do_solve
} from './spline_math.js';

export let RestrictFlags = {
  NO_EXTRUDE   : 1,
  NO_DELETE    : 2,
  NO_CONNECT   : 4,
  NO_DISSOLVE  : 8,
  NO_SPLIT_EDGE: 16,
  VALENCE2     : 32,
  NO_CREATE    : 64 | 1 | 4 | 16
};

function dom_bind(obj, name, dom_id) {
  Object.defineProperty(obj, name, {
    get: function () {
      let check = document.getElementById(dom_id);
      return check.checked;
    },
    set: function (val) {
      let check = document.getElementById(dom_id);
      check.checked = !!val;
    }
  });
}

let split_edge_rets = new cachering(function () {
  return [0, 0, 0];
}, 64);

let _elist_map = {
  "verts"   : SplineTypes.VERTEX,
  "handles" : SplineTypes.HANDLE,
  "segments": SplineTypes.SEGMENT,
  "faces"   : SplineTypes.FACE,
};

export class AllPointsIter {
  stage: number
  ret: Object;

  constructor(spline: Spline) {
    this.spline = spline;
    this.stage = 0;
    this.iter = spline.verts[Symbol.iterator]();

    this.ret = {done: false, value: undefined};
  }

  [Symbol.iterator]() {
    return this;
  }

  next(): IteratorResult<SplineVertex> {
    let ret = this.iter.next();

    this.ret.done = ret.done;
    this.ret.value = ret.value;

    if (ret.done && this.stage === 0) {
      this.stage = 1;
      this.iter = this.spline.handles[Symbol.iterator]();

      return this.next();
    }

    return this.ret;
  }
}

import {RecalcFlags} from './spline_types.js';

let debug_id_gen = 0;
let _se_ws = [0.5, 0.5];
let _se_srcs = [0, 0];
let _trace_face_lastco = new Vector3();

export class Spline extends DataBlock {
  _vert_add_set: set
  _vert_rem_set: set
  _vert_time_set: set
  actlevel: number
  mres_format: Array
  size: Array<number>
  restrict: number
  q: SplineQuery
  frame: number
  rendermat: Matrix4
  _idgen: SDIDGen
  draw_layerlist: Array<number>;
  proportional: boolean
  prop_radius: number
  eidmap: Object
  updateGen: number
  elist_map: Object
  selectmode: number
  _drawStrokeVertSplits: Set<number>
  layerset: SplineLayerSet
  drawer: SplineDrawer
  selected: ElementArraySet
  draw_verts: boolean
  verts: ElementArray<SplineVertex>
  handles: ElementArray<SplineVertex>
  segments: ElementArray<SplineSegment>
  loops: ElementArray<SplineLoop>
  face: ElementArray<SplineFace>
  strokeGroups: Array<SplineStrokeGroup>
  _strokeGroupMap: Map<int, SplineStrokeGroup>
  drawStrokeGroups: Array<SplineStrokeGroup>
  _drawStrokeGroupMap: Map<int, SplineStrokeGroup>
  draw_normals: boolean;

  constructor(name: string = undefined) {
    super(DataTypes.SPLINE, name);

    this.updateGen = 0;
    this.draw_layerlist = [];

    this.solvePromise = undefined;
    this.solveTimeout = undefined;

    /**
     strings of 2-valence strokes.  we deliberately cache
     instances of SplineStrokeGroups with the same set of SplineSegments,
     so draw code can attach various bits of draw state.
     */
    this.strokeGroups = [];
    this._strokeGroupMap = new Map();

    /* Used to keep track of which verts are at group
       boundaries */
    this._drawStrokeVertSplits = new Set();

    //this.strokeGroups broken up according to color/material settings
    //this is a seperate property because we'll need the originall groups
    //for topological queries
    //
    //also, drawStrokeGroups is not saved in faces, unlike strokeGroups which is
    this.drawStrokeGroups = [];
    this._drawStrokeGroupMap = new Map();

    //used for eventdag.  stores eids.
    this._vert_add_set = new set();
    this._vert_rem_set = new set();
    this._vert_time_set = new set();

    this._debug_id = debug_id_gen++;

    this.pending_solve = undefined;
    this._resolve_after = undefined;
    this.solving = undefined;

    this.actlevel = 0; //active multires level for editing
    let mformat = spline_multires._format;
    this.mres_format = new Array(mformat.length);

    for (let i = 0; i < mformat.length; i++) {
      this.mres_format[i] = mformat[i];
    }

    this._internal_id = _internal_idgen++;

    this.drawlist = []; //has lines and faces mixed together

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

  static blockDefine() {
    return {
      typeName    : "spline",
      defaultName : "Spline",
      uiName      : "Spline",
      typeIndex   : 6,
      linkOrder   : 3,
      accessorName: "splines",
    }
  }

  //get resolve() {
  //  return this._resolve;
  //}

  //set resolve(val) {
  //  this._resolve = val;
  //}

  dag_get_datapath(): string {
    if (this.is_anim_path || (this.verts.cdata.layers.length > 0 && this.verts.cdata.layers[0].name === "TimeDataLayer"))
      return "frameset.pathspline";
    else
      return "frameset.drawspline";
  }

  force_full_resolve() {
    this.resolve = 1;

    for (let seg of this.segments) {
      seg.flag |= SplineFlags.UPDATE;
    }
    for (let v of this.verts) {
      v.flag |= SplineFlags.UPDATE;
    }
    for (let h of this.handles) {
      h.flag |= SplineFlags.UPDATE;
    }
  }

  check_sort() {
    if (!this.drawlist || (this.recalc & RecalcFlags.DRAWSORT)) {
      redo_draw_sort(this);
    }
  }

  queue_redraw() {
    window.redraw_viewport();
  }

  regen_sort() {
    this.updateGen++;
    this.recalc |= RecalcFlags.DRAWSORT;
  }

  regen_solve() {
    this.resolve = 1;
    this.updateGen++;
    this.recalc |= RecalcFlags.SOLVE;
  }

  regen_render() {
    this.resolve = 1;
    this.updateGen++;
    this.recalc |= RecalcFlags.ALL;
  }

  init_elists() {
    for (let list of this.elists) {
      list.onDestroy();
    }

    this.elist_map = {};
    this.elists = [];

    for (let k in _elist_map) {
      let type = _elist_map[k];

      let list = new ElementArray(type, this.idgen, this.eidmap, this.selected,
        this.layerset, this);
      this[k] = list;
      this.elist_map[type] = list;

      this.elists.push(list);
    }

    this.init_sel_handlers();
  }

  init_sel_handlers() {
    let this2 = this;
    this.verts.on_select = function (v, state) {
      //console.log("on select!");

      for (let i = 0; i < v.segments.length; i++) {
        let seg = v.segments[i];

        this2.handles.setselect(seg.handle(v), state);
      }
    }
  }

  get idgen(): SDIDGen {
    return this._idgen;
  }

  set idgen(idgen: SDIDGen) {
    this._idgen = idgen;

    //this can happen due to fromSTRUCT chaining
    if (this.elists === undefined) {
      return;
    }

    for (let i = 0; i < this.elists.length; i++) {
      this.elists[i].idgen = idgen;
    }
  }

  copy(): Spline {
    let ret = new Spline();

    ret.idgen = this.idgen.copy();
    ret.layerset = this.layerset.copyStructure();

    for (let i = 0; i < ret.elists.length; i++) {
      ret.elists[i].idgen = ret.idgen;
      ret.elists[i].cdata.load_layout(this.elists[i].cdata);
    }

    let eidmap = ret.eidmap;

    for (let si = 0; si < 2; si++) {
      let list1 = si ? this.handles : this.verts;
      let list2 = si ? ret.handles : ret.verts;

      for (let i = 0; i < list1.length; i++) {
        let v = list1[i];
        let v2 = new SplineVertex(v);

        if (si === 1) {
          v2.type = SplineTypes.HANDLE;
        }

        v2.load(v);
        v2.flag = v.flag;
        v2.eid = v.eid;
        list2.push(v2, v2.eid, false);

        for (let layeri in v.layers) {
          ret.layerset.idmap[layeri].add(v2);
        }

        if (si === 1) {
          ret.copy_handle_data(v2, v);
        } else {
          ret.copy_vert_data(v2, v);
        }

        eidmap[v.eid] = v2;

        if (v === list1.active)
          list2.active = v2;
      }
    }

    for (let i = 0; i < this.segments.length; i++) {
      let s = this.segments[i];
      let s2 = new SplineSegment();

      s2.eid = s.eid;
      s2.flag = s.flag;
      ret.segments.push(s2);
      eidmap[s2.eid] = s2;

      if (s === this.segments.active)
        ret.segments.active = s;

      s2.h1 = eidmap[s.h1.eid];
      s2.h2 = eidmap[s.h2.eid];
      s2.h1.segments.push(s2);
      s2.h2.segments.push(s2);

      s2.v1 = eidmap[s.v1.eid];
      s2.v2 = eidmap[s.v2.eid];
      s2.v1.segments.push(s2);
      s2.v2.segments.push(s2);

      for (let j = 0; j < s.ks.length; j++) {
        s2.ks[j] = s.ks[j];
      }

      if (s.h1.hpair !== undefined)
        s2.h1.hpair = eidmap[s.h1.hpair.eid]

      if (s.h2.hpair !== undefined)
        s2.h2.hpair = eidmap[s.h2.hpair.eid]

      ret.copy_segment_data(s2, s);

      for (let layeri in s.layers) {
        ret.layerset.idmap[layeri].add(s2);
      }
    }

    for (let i = 0; i < this.faces.length; i++) {
      let f = this.faces[i];

      let vlists = [];
      for (let list of f.paths) {
        let verts = [];
        vlists.push(verts);

        let l = list.l;
        do {
          verts.push(eidmap[l.v.eid]);

          l = l.next;
        } while (l !== list.l);
      }

      let f2 = ret.make_face(vlists, f.eid);

      ret.copy_face_data(f2, f);
      eidmap[f2.eid] = f2;

      if (f === this.faces.active)
        ret.faces.active = f2;

      for (let layeri in f.layers) {
        ret.layerset.idmap[layeri].add(f2);
      }
    }

    return ret;
  }

  copy_element_data(dst: SplineElement, src: SplineElement) {
    if (dst.flag & SplineFlags.SELECT) {
      this.setselect(dst, false);
    }

    dst.cdata.copy(src.cdata);
    dst.flag = src.flag;

    if (dst.flag & SplineFlags.SELECT) {
      dst.flag &= ~SplineFlags.SELECT;
      this.setselect(dst, true);
    }
  }

  copy_vert_data(dst: SplineVertex, src: SplineVertex) {
    this.copy_element_data(dst, src);
  }

  copy_handle_data(dst: SplineVertex, src: SplineVertex) {
    this.copy_element_data(dst, src);
  }

  copy_segment_data(dst: SplineSegment, src: SplineSegment) {
    this.copy_element_data(dst, src);

    dst.z = src.z;

    dst.w1 = src.w1;
    dst.w2 = src.w2;

    dst.shift1 = src.shift1;
    dst.shift2 = src.shift2;

    dst.mat.load(src.mat);
  }

  copy_face_data(dst: SplineFace, src: SplineFace) {
    this.copy_element_data(dst, src);

    dst.z = src.z;
    dst.mat.load(src.mat);
  }

  get points(): Iterable<SplineVertex> {
    return new AllPointsIter(this);
  }

  make_vertex(co: Array<float>, eid: number = undefined): SplineVertex {
    let v = new SplineVertex(co);

    v.flag |= SplineFlags.UPDATE | SplineFlags.FRAME_DIRTY;

    this.verts.push(v, eid);
    this._vert_add_set.add(v.eid);

    this.dag_update("on_vert_add", this._vert_add_set);
    this.dag_update("on_vert_change");

    return v;
  }

  get_elist(type) {
    return this.elist_map[type];
  }

  make_handle(co, __eid: number = undefined): SplineVertex {
    let h = new SplineVertex();

    h.flag |= SplineFlags.BREAK_TANGENTS;
    h.flag |= SplineFlags.UPDATE | SplineFlags.FRAME_DIRTY;

    h.type = SplineTypes.HANDLE;
    this.handles.push(h, __eid);

    return h;
  }

  split_edge(seg: SplineSegment, s: number = 0.5): Array<SplineElement> {
    let co = seg.evaluate(s);

    let ws = _se_ws;
    let srcs = _se_srcs;

    let hpair = seg.h2.hpair;
    if (hpair !== undefined) {
      this.disconnect_handle(seg.h2);
    }

    let nv = this.make_vertex(co); //XXX, this.idgen.gen_id(seg.eid, 0));
    nv.flag |= seg.v1.flag & seg.v2.flag;

    if (nv.flag & SplineFlags.SELECT) {
      nv.flag &= ~SplineFlags.SELECT;

      this.verts.setselect(nv, true);
    }

    let v1 = seg.v1, v2 = seg.v2;
    let nseg = this.make_segment(nv, seg.v2); //XXX, this.idgen.gen_id(seg.eid, 1));

    let w1 = seg.w1 + (seg.w2 - seg.w1)*s//seg.widthFunction(s);
    let w2 = seg.w2;
    let shift1 = seg.shift1 + (seg.shift2 - seg.shift1)*s//seg.widthFunction(s);
    let shift2 = seg.shift2;

    seg.w2 = w1;
    seg.shift2 = shift1;

    seg.v2.segments.remove(seg);
    nv.segments.push(seg);
    seg.v2 = nv;

    /*
    v1-->nv-->v2 : l
    v1-->nv-->v2 : e
    v2<--nv<--v1 : l
    */

    if (seg.l !== undefined) {
      let start = seg.l;
      let l = seg.l;

      let i = 0;

      let lst = [];
      do {
        lst.push(l);
        if (i++ > 100) {
          console.trace("Infinite loop error");
          break;
        }

        l = l.radial_next;
      } while (l !== seg.l);

      for (let j = 0; j < lst.length; j++) {
        let l = lst[j];

        let newl = this.make_loop();
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

    nv.flag |= SplineFlags.UPDATE;
    seg.v1.flag |= SplineFlags.UPDATE;
    nseg.v2.flag |= SplineFlags.UPDATE;

    let ret = split_edge_rets.next();
    ret[0] = nseg;
    ret[1] = nv;

    if (hpair !== undefined) {
      this.connect_handles(nseg.h2, hpair);
    }

    //deal with customdata
    this.copy_segment_data(nseg, seg);

    nseg.w1 = w1;
    nseg.w2 = w2;
    nseg.shift1 = shift1;
    nseg.shift2 = shift2;

    //interpolate
    srcs[0] = v1.cdata, srcs[1] = v2.cdata;
    this.copy_vert_data(nv, v1);
    nv.cdata.interp(srcs, ws);

    this.resolve = 1;
    return ret;
  }

  find_segment(v1: SplineVertex, v2: SplineVertex) {
    for (let i = 0; i < v1.segments.length; i++) {
      if (v1.segments[i].other_vert(v1) === v2) return v1.segments[i];
    }

    return undefined;
  }

  disconnect_handle(h1) {
    h1.hpair.hpair = undefined;
    h1.hpair = undefined;
  }

  connect_handles(h1: SplineVertex, h2: SplineVertex) {
    let s1 = h1.segments[0], s2 = h2.segments[0];
    if (s1.handle_vertex(h1) !== s2.handle_vertex(h2)) {
      console.trace("Invalid call to connect_handles");
      return;
    }

    if (h1.hpair !== undefined)
      this.disconnect_handle(h1);
    if (h2.hpair !== undefined)
      this.disconnect_handle(h2);

    h1.hpair = h2;
    h2.hpair = h1;
  }

  export_ks(): Uint8Array {
    let size = this.segments.length*ORDER + 1;
    let ret = new Float32Array(size);
    let i = 1;

    ret[0] = 0; //version

    for (let seg of this.segments) {
      for (let j = 0; j < ORDER; j++) {
        ret[i++] = seg.ks[j];
      }
    }

    return new Uint8Array(ret.buffer);
  }

  import_ks(data: Uint8Array) {
    let i = 1;

    data = new Float32Array(data.buffer);

    let version = data[0];

    for (let seg of this.segments) {
      for (let j = 0; j < ORDER; j++) {
        seg.ks[j] = data[i++];
      }
    }

    return true;
  }

  export_ks_old(): Uint16Array {
    //XXX
    let mmlen = MMLEN;
    let size = 4/UMUL + 8/UMUL + this.segments.length*ORDER;

    size += this.segments.length*(4/UMUL);
    size += (8*Math.floor(this.segments.length/mmlen))/UMUL;

    let ret = new UARR(size);
    let view = new DataView(ret.buffer);

    let c = 0, d = 0

    //write number of bytes per integer
    view.setInt32(c*UMUL, UMUL);
    c += 4/UMUL;
    let mink, maxk;

    for (let i = 0; i < this.segments.length; i++) {
      let s = this.segments[i];

      if (d === 0) {
        mink = 10000, maxk = -10000;

        for (let si = i; si < i + mmlen + 1; si++) {
          if (si >= this.segments.length) break;

          let s2 = this.segments[si];
          for (let j = 0; j < ORDER; j++) {
            mink = Math.min(mink, s2.ks[j]);
            maxk = Math.max(maxk, s2.ks[j]);
          }
        }

        view.setFloat32(c*UMUL, mink);
        view.setFloat32(c*UMUL + 4, maxk);

        c += 8/UMUL;
      }

      view.setInt32(c*UMUL, s.eid);
      c += 4/UMUL;

      for (let j = 0; j < ORDER; j++) {
        let k = s.ks[j];

        k = (k - mink)/(maxk - mink);
        if (k < 0.0) {
          console.log("EVIL!", k, mink, maxk);
        }
        k = Math.abs(Math.floor(k*UMAX));

        ret[c++] = k;
      }

      d = (d + 1)%mmlen;
    }

    let ret2 = ret;
    /*
    for (let si=0; si<1; si++) {
      ret = LZString.compress(new Uint8Array(ret.buffer));

      let ret2 = new UARR(ret.length);
      
      for (let i=0; i<ret.length; i++) {
        ret2[i] = ret[i].charCodeAt(0);
      }
      
      ret = ret2;
    }
    //*/

    return ret2; //new Uint8Array(ret2.buffer);
  }

  import_ks_old(data: Uint16Array) {
    data = new UARR(data.buffer);
    /*
    let s = "";
    for (let i=0; i<data.length; i++) {
      s += String.fromCharCode(data[i]);
    }
    
    let sdata = LZString.decompress(s);
    let data = new UARR(sdata.length)
    
    for (let i=0; i<sdata.length; i++) {
      data[i] = sdata[i].charCodeAt(0);
    }
    //*/

    let view = new DataView(data.buffer);
    let mmlen = MMLEN;
    let d = 0, i = 0;

    let datasize = view.getInt32(0);
    if (datasize !== UMUL) {
      return undefined; //invalid
    }

    i += 4/UMUL;

    while (i < data.length) {
      let mink, maxk;

      if (d === 0) {
        mink = view.getFloat32(i*UMUL);
        maxk = view.getFloat32(i*UMUL + 4);

        i += 8/UMUL;
      }

      d = (d + 1)%mmlen;

      if (i >= data.length) {
        console.log("SPLINE CACHE ERROR", i, data.length);
        break;
      }

      let eid = view.getInt32(i*UMUL);
      i += 4/UMUL;

      let s = this.eidmap[eid]

      if (s === undefined || !(s instanceof SplineSegment)) {
        console.log("Could not find segment", data[i - 1]);
        i += ORDER;
        continue;
      }

      for (let j = 0; j < ORDER; j++) {
        let k = data[i++]/UMAX;

        k = k*(maxk - mink) + mink;
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

    for (let i = 0; i < 2; i++) {
      let list = i ? this.handles : this.verts;

      for (let v of list) {
        for (let j = 0; j < v.segments.length; j++) {
          if (v.segments[j] === undefined) {
            console.warn("Corruption detected for element", v.eid);
            v.segments.pop_i(j);
            j--;
          }
        }
      }
    }

    //destroy orphaned handles
    let hset = new set();
    for (let s of this.segments) {
      hset.add(s.h1);
      hset.add(s.h2);

      for (let si = 0; si < 2; si++) {
        let h = si ? s.h2 : s.h1;

        if (h.segments.indexOf(s) < 0) {
          console.warn("fixing segment reference for handle", h.eid);
          h.segments.length = 0;
          h.segments.push(s);
        }
      }
    }

    let delset = new set();

    for (let h of this.handles) {
      if (!hset.has(h)) {
        delset.add(h);
      }
    }

    for (let h of delset) {
      console.log("Removing orphaned handle", h.eid, h);
      this.handles.remove(h);
    }

    let delsegments = new set();

    for (let v of this.verts) {
      for (let i = 0; i < v.segments.length; i++) {
        let s = v.segments[i];

        if (s.v1 !== v && s.v2 !== v) {
          console.log("Corrupted segment! Deleting!");
          //do a manual, safe removal of s
          v.segments.remove(s, true);
          i--;

          delsegments.add(s);
        }
      }
    }

    for (let s of delsegments) {
      this.kill_segment(s, true, true);
      continue;

      this.segments.remove(s, true);
      delete this.eidmap[s.eid];

      if (s.v1.indexOf(s) >= 0)
        s.v1.segments.remove(s, true);
      if (s.v2.indexOf(s) >= 0)
        s.v2.segments.remove(s, true);

      if (s.h1 !== undefined && s.h1.type === SplineTypes.HANDLE) {
        this.handles.remove(s.h1, true);
        delete this.eidmap[s.h1.eid];
      }
      if (s.h2 !== undefined && s.h2.type === SplineTypes.HANDLE) {
        this.handles.remove(s.h2, true);
        delete this.eidmap[s.h2.eid];
      }

      if (s.l !== undefined) {
        let l = s.l, c;
        let radial_next = l.radial_next;

        do {
          if (c++ > 100) {
            console.log("Infinite loop (in fix_splines)!");
            break;
          }

          this.kill_face(l.f);
          l = l.radial_next;

          if (l === undefined)
            break;
        } while (l !== s.l);
      }
    }

    for (let s of this.segments) {
      if (s.v1.segments === undefined || s.v2.segments === undefined) {
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
      if (s.h1 === undefined || s.h1.type !== SplineTypes.HANDLE) {
        console.log("Missing handle 1; adding. . .", s.eid, s);
        s.h1 = this.make_handle();
        s.h1.load(s.v1).interp(s.v2, 1.0/3.0);
      }

      if (s.h2 === undefined || s.h2.type !== SplineTypes.HANDLE) {
        console.log("Missing handle 2; adding. . .", s.eid, s);
        s.h2 = this.make_handle();
        s.h2.load(s.v2).interp(s.v2, 2.0/3.0);
      }
      if (s.h1.segments[0] !== s)
        s.h1.segments = [s];
      if (s.h2.segments[0] !== s)
        s.h2.segments = [s];
    }

    let max_eid = 0;
    for (let i = 0; i < this.elists.length; i++) {
      let elist = this.elists[i];

      for (let e of elist) {
        max_eid = Math.max(e.eid, max_eid);
      }
    }

    let curid = !("cur_id" in this.idgen) ? "cur_eid" : "cur_id";
    if (max_eid >= this.idgen[curid]) {
      console.trace("IDGEN ERROR! DOOM! DOOM!");
      this.idgen[curid] = max_eid + 1;
    }
  }

  select_none(ctx: ToolContext, datamode: int) {
    if (ctx === undefined) {
      throw new Error("ctx cannot be undefined");
    }

    if (datamode === undefined) {
      throw new Error("datamode cannot be undefined");
    }

    for (let elist of this.elists) {
      if (!(datamode & elist.type)) {
        continue;
      }

      for (let e of elist.selected.editable(ctx)) {
        this.setselect(e, false);
      }
    }
  }

  select_flush(datamode: int) {
    if (datamode & (SplineTypes.VERTEX | SplineTypes.HANDLE)) {
      //flush upwards
      let fset = new set();
      let sset = new set();
      let fact = this.faces.active, sact = this.segments.active;

      for (let v of this.verts.selected) {
        for (let s of v.segments) {
          if (sset.has(s))
            continue;

          if (s.other_vert(v).flag & SplineFlags.SELECT) {
            sset.add(s);
          }

          let l = s.l;
          if (l === undefined) continue;
          let c = 0;

          do {
            if (c++ > 1000) {
              console.warn("Infinite loop detected!");
              break;
            }

            let f = l.f;
            if (f.flag & SplineFlags.SELECT) {
              l = l.next;
              continue;
            }

            let good = true;

            for (let path of f.paths) {
              for (let l2 of path) {
                if (!(l2.v.flag & SplineFlags.SELECT)) {
                  good = false;
                  break;
                }
              }
              if (!good)
                break;
            }

            if (good) {
              fset.add(f);
            }

            l = l.next;
          } while (l !== s.l);
        }
      }

      this.segments.clear_selection();
      this.faces.clear_selection();

      //select first if necassary
      if (sact === undefined || !sset.has(sact)) {
        for (let s of sset) {
          sact = s;
          break;
        }
      }

      //select first if necassary
      if (fact === undefined || !fset.has(fact)) {
        for (let f of fset) {
          fact = f;
          break;
        }
      }

      this.segments.active = sact;
      this.faces.active = fact;

      for (let s of sset) {
        this.segments.setselect(s, true);
      }

      for (let f of fset) {
        this.faces.setselect(f, true);
      }

    } else if (datamode === SplineTypes.SEGMENT) {
      this.verts.clear_selection();
      this.faces.clear_selection();

      for (let s of this.segments.selected) {
        this.verts.setselect(s.v1, true);
        this.verts.setselect(s.v2, true);

        let l = s.l;
        if (l === undefined)
          continue;
        let c = 0;

        do {
          if (c++ > 1000) {
            console.warn("Infinite loop detected!");
            break;
          }

          let f = l.f;
          if (f.flag & SplineFlags.SELECT) {
            l = l.next;
            continue;
          }

          let good = true;

          for (let path of f.paths) {
            for (let l2 of path) {
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
        } while (l !== s.l);
      }
    } else if (datamode === SplineTypes.FACE) {
      this.verts.clear_selection();
      this.segments.clear_selection();

      for (let f of this.faces.selected) {
        for (let path of f.paths) {
          for (let l of path) {
            this.verts.setselect(l.v, true);
            this.segments.setselect(l.s, true);
          }
        }
      }
    }
  }

  make_segment(v1: SplineVertex, v2: SplineVertex, __eid: number, check_existing = true) {
    if (__eid === undefined)
      __eid = this.idgen.gen_id();

    if (check_existing) {
      let seg = this.find_segment(v1, v2);
      if (seg !== undefined) return seg;
    }

    let seg = new SplineSegment(v1, v2);

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

    this.segments.push(seg, __eid);
    return seg;
  }

  flip_segment(seg) {
    let v = seg.v1;
    let t = seg.v1;
    seg.v1 = seg.v2;
    seg.v2 = t;

    t = seg.h1;
    seg.h1 = seg.h2;
    seg.h2 = t;
    t = seg.w1;
    seg.w1 = seg.w2;
    seg.w2 = t;
    t = seg.shift1;
    seg.shift1 = seg.shift2;
    seg.shift2 = t;

    return this;
  }

  _radial_loop_insert(l: SplineLoop) {
    if (l.s.l === undefined) {
      l.radial_next = l.radial_prev = l;
      l.s.l = l;
      return;
    }

    l.radial_next = l.s.l;
    l.radial_prev = l.s.l.radial_prev;
    l.s.l.radial_prev.radial_next = l.s.l.radial_prev = l;

    l.s.l = l;
  }

  _radial_loop_remove(l: SplineLoop) {
    l.radial_next.radial_prev = l.radial_prev;
    l.radial_prev.radial_next = l.radial_next;

    if (l === l.radial_next) {
      l.s.l = undefined;
    } else if (l === l.s.l) {
      l.s.l = l.radial_next;
    }
  }

  make_face(vlists: Array<Array<SplineVertex>>, custom_eid = undefined): SplineFace {
    let f = new SplineFace();

    if (custom_eid === -1) custom_eid = undefined;
    this.faces.push(f);

    //validate input
    for (let i = 0; i < vlists.length; i++) {
      let verts = vlists[i];

      if (verts.length < 3) {
        throw new Error("Must have at least three vertices for face");
      }

      //detect duplicates
      let vset = {};
      for (let j = 0; j < verts.length; j++) {
        if (verts[j].eid in vset) {
          console.log(vlists);
          throw new Error("Duplicate verts in make_face");
        }
        vset[verts[j].eid] = 1;
      }
    }

    let min_z;

    for (let i = 0; i < vlists.length; i++) {
      let verts = vlists[i];
      let list = new SplineLoopPath();

      list.f = f;
      list.totvert = verts.length;
      f.paths.push(list);

      let l = undefined, prevl = undefined;
      for (let j = 0; j < verts.length; j++) {
        let v1 = verts[j], v2 = verts[(j + 1)%verts.length];

        let exists = this.find_segment(v1, v2);

        let s = this.make_segment(v1, v2, undefined, true);
        let l = this.make_loop();

        /* Propagate selection flags. */
        if (!exists) {
          let select = false;

          outer: for (let i = 0; i < 2; i++) {
            let v = i ? s.v2 : s.v1;
            for (let s2 of v.segments) {
              if (s2.flag & SplineFlags.SELECT) {
                select = true;
                break outer;
              }
            }
          }

          if (select) {
            this.setselect(s, true);
          }
        }

        min_z = Math.min(min_z, s.z);

        l.v = v1;
        l.s = s;
        l.f = f;
        l.p = list;

        if (prevl === undefined) {
          list.l = l;
        } else {
          l.prev = prevl;
          prevl.next = l;
        }

        prevl = l;
      }

      list.l.prev = prevl;
      prevl.next = list.l;

      l = list.l;
      do {
        this._radial_loop_insert(l);
        l = l.next;
      } while (l !== list.l);
    }

    /* Always put faces behind their segments. */
    f.z = min_z - 1;

    return f;
  }

  make_loop(): SplineLoop {
    let l = new SplineLoop();

    l.eid = this.idgen.gen_id();
    this.eidmap[l.eid] = l;

    return l;
  }

  kill_loop(l: SplineLoop) {
    delete this.eidmap[l.eid];
  }

  _element_kill(e) {
  }

  kill_face(f: SplineFace) {
    for (let i = 0; i < f.paths.length; i++) {
      let path = f.paths[i];

      for (let l of path) {
        this._radial_loop_remove(l);
        this.kill_loop(l);
      }
    }

    this._element_kill(f);
    this.faces.remove(f);
  }

  kill_segment(seg: SplineSegment, kill_faces = true, soft_error = false) {
    let i = 0;
    while (kill_faces && seg.l !== undefined) {
      this.kill_face(seg.l.f);

      if (i++ > 1000) {
        console.trace("Infinite loop in kill_segment!!", seg);
        break;
      }
    }

    if (seg.v1.segments !== undefined)
      seg.v1.segments.remove(seg, soft_error);

    if (seg.v2.segments !== undefined)
      seg.v2.segments.remove(seg, soft_error);

    this.handles.remove(seg.h1, soft_error);
    this.handles.remove(seg.h2, soft_error);

    this._element_kill(seg);
    this.segments.remove(seg, soft_error);
  }

  do_save() {
    let obj = this.toJSON();
    let buf = JSON.stringify(obj);

    let blob = new Blob([buf], {type: "application/json"});

    let obj_url = window.URL.createObjectURL(blob);
    window.open(obj_url);
  }

  dissolve_vertex(v: SplineVertex) {
    if (!(v.eid in this.eidmap)) {
      throw new Error("spline.dissolve_vertex called in error");
    }

    let ls2 = [];

    if (v.segments.length !== 2) return;

    for (let i = 0; i < v.segments.length; i++) {
      let s = v.segments[i];

      if (s.l === undefined) continue;

      let lst = [];
      let l = s.l;
      let _i = 0;
      do {
        lst.push(l);
        l = l.radial_next;

        if (_i++ > 10000) {
          console.warn("infinite loop detected in dissolve_vertex");
          break;
        }
      } while (l !== s.l);

      for (let j = 0; j < lst.length; j++) {
        let l = lst[j];

        if (l.v !== v && l.next.v !== v)
          continue;

        if (l.v !== v) {
          l = l.next;
        }

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

    if (v.segments.length === 2) {
      let s1 = v.segments[0], s2 = v.segments[1];

      let v1 = s1.other_vert(v), v2 = s2.other_vert(v);
      let existing = this.find_segment(v1, v2);
      let w1 = v === s1.v1 ? s1.w2 : s1.w1;
      let w2 = v === s2.v1 ? s2.w2 : s2.w1;
      let shift1 = v === s1.v1 ? s1.shift2 : s1.shift1;
      let shift2 = v === s2.v1 ? s2.shift2 : s2.shift1;

      if (s1.v1 === v) s1.v1 = v2;
      else s1.v2 = v2;

      let ci = 0;
      while (s2.l !== undefined) {
        this._radial_loop_remove(s2.l);

        if (ci++ > 100) {
          console.warn("Infinite loop error!");
          break;
        }
      }
      while (s1.l !== undefined) {
        this._radial_loop_remove(s1.l);

        if (ci++ > 100) {
          console.warn("Infinite loop error!");
          break;
        }
      }

      this.kill_segment(s2);

      v2.segments.push(s1);
      v.segments.length = 0;
      let flip = false;

      if (existing) {
        flip = existing.v1 !== s1.v1;
        this.kill_segment(s1);
        s1 = existing;
      }

      if (!flip) {
        s1.w1 = w1;
        s1.w2 = w2;
        s1.shift1 = shift1;
        s1.shift2 = shift2;
      } else {
        s1.w1 = w2;
        s1.w2 = w1;
        s1.shift1 = shift2;
        s1.shift2 = shift1;
      }

      if (s1.l === undefined) {
        for (let i = 0; i < ls2.length; i++) {
          let l = ls2[i];

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

  //used by dopesheet editor to detect things like
  //active layer changes
  buildSelCtxKey(): string {
    let key = "";

    key += this.layerset.active.id;
    return key;
  }

  kill_vertex(v: SplineVertex) {
    if (!(v.eid in this.eidmap)) {
      throw new Error("spline.kill_vertex called in error");
    }

    this._vert_rem_set.add(v.eid);

    this.dag_update("on_vert_add", this._vert_rem_set);
    this.dag_update("on_vert_change");

    //XXX paranoia removal from selection list, should not be necassary
    if (v.flag & SplineFlags.SELECT) {
      this.verts.setselect(v, false);
    }

    if (this.hpair !== undefined)
      this.disconnect_handle(this);

    while (v.segments.length > 0) {
      let last = v.segments.length;
      this.kill_segment(v.segments[0]);

      if (last === v.segments.length) {
        console.log("EEK!");
        break;
      }
    }

    if (this.verts.active === v) this.verts.active = undefined;
    if (this.verts.highlight === v) this.verts.highlight = undefined;

    delete this.eidmap[v.eid];

    this._element_kill(v);
    this.verts.remove(v);
  }

  _vert_flag_update(v, depth, limit) {
    if (depth >= limit) return;

    v.flag |= SplineFlags.TEMP_TAG;

    for (let i = 0; i < v.segments.length; i++) {
      let s = v.segments[i], v2 = s.other_vert(v);

      if (v2 === undefined || v2.segments === undefined) {
        console.trace("ERROR 1: v, s, v2:", v, s, v2);
        continue;
      }

      let has_tan = v2.segments.length <= 2;

      for (let j = 0; j < v2.segments.length; j++) {
        let h = v2.segments[j].handle(v2);

        if (h.hpair !== undefined) {
          has_tan = true;
        }
      }


      if (!has_tan) {
        //continue;
      }

      //don't propegate as far after tangent breaks
      //XXX causes bugs
      //if (v2.flag & SplineFlags.BREAK_TANGENTS) {
      //  limit = Math.min(limit-1, depth+2);
      //}

      if (!(v2.flag & SplineFlags.TEMP_TAG)) {
        this._vert_flag_update(v2, depth + 1, limit);
      }
    }

    for (let j = 0; j < v.segments.length; j++) {
      let s = v.segments[j], v2 = s.other_vert(v);

      if (v2.segments.length > 2 || (v2.flag & SplineFlags.BREAK_TANGENTS))
        v2.flag |= SplineFlags.TEMP_TAG;
    }
  }

  propagate_draw_flags(repeat = 2) {
    for (let seg of this.segments) {
      seg.flag &= ~SplineFlags.TEMP_TAG;
    }

    for (let seg of this.segments) {
      if (!(seg.flag & SplineFlags.REDRAW_PRE))
        continue;

      for (let i = 0; i < 2; i++) {
        let v = i ? seg.v2 : seg.v1;

        for (let j = 0; j < v.segments.length; j++) {
          let seg2 = v.segments[j];

          seg2.flag |= SplineFlags.TEMP_TAG;
          let l = seg2.l;

          if (l === undefined)
            continue;

          let _i = 0;
          do {
            if (_i++ > 1000) {
              console.warn("infinite loop!");
              break;
            }

            l.f.flag |= SplineFlags.REDRAW_PRE;
            l = l.radial_next;
          } while (l !== seg2.l);
        }
      }
    }

    for (let seg of this.segments) {
      if (seg.flag & SplineFlags.TEMP_TAG) {
        seg.flag |= SplineFlags.REDRAW_PRE;
      }
    }

    if (repeat !== undefined && repeat > 0) {
      this.propagate_draw_flags(repeat - 1);
    }
  }

  propagate_update_flags() {
    for (let seg of this.segments) {
      if ((seg.v1.flag & SplineFlags.UPDATE) && (seg.v1.flag & SplineFlags.BREAK_TANGENTS)) {
        seg.v2.flag |= SplineFlags.UPDATE;
      }
      if ((seg.v2.flag & SplineFlags.UPDATE) && (seg.v2.flag & SplineFlags.BREAK_TANGENTS)) {
        seg.v1.flag |= SplineFlags.UPDATE;
      }
    }

    let verts = this.verts;
    for (let i = 0; i < verts.length; i++) {
      let v = verts[i];
      v.flag &= ~SplineFlags.TEMP_TAG;
    }

    let limit = 5;

    for (let i = 0; i < verts.length; i++) {
      let v = verts[i];
      if (v.flag & SplineFlags.UPDATE) {
        this._vert_flag_update(v, 0, limit);
      }
    }

    for (let i = 0; i < verts.length; i++) {
      let v = verts[i];
      if (v.flag & SplineFlags.TEMP_TAG) {
        v.flag |= SplineFlags.UPDATE;
      }
    }
  }

  /*NOTE: we override any pre-existing this._resolve_after callback.
          this is to avoid excessive queueing*/
  solve(steps, gk, force_queue = false): Promise {
    let this2 = this;

    let dag_trigger = function () {
      this2.dag_update("on_solve", true);
    }

    if (this.pending_solve !== undefined && force_queue) {
      let this2 = this;

      this.pending_solve = this.pending_solve.then(function () {
        this2.solve();
      });
      this.solving = true;

      return this.pending_solve;
    } else if (this.pending_solve !== undefined) {
      let do_accept;

      let promise = new Promise(function (accept, reject) {
        do_accept = function () {
          accept();
        }
      });

      this._resolve_after = function () {
        do_accept();
      }

      return promise;
    } else {
      this.pending_solve = this.solve_intern(steps, gk);
      this.solving = true;

      return this.pending_solve;
    }
  }

  on_destroy() {
    for (let elist of this.elists) {
      elist.onDestroy();
    }
  }

  //XXX: get rid of steps, gk
  solve_intern(steps: number, gk: number) {
    let this2 = this;

    let dag_trigger = function () {
      this2.dag_update("on_solve", true);

      //XXX hack, need to fix windowmanager.js to call this more often
      the_global_dag.exec(g_app_state.screen.ctx);
    }

    //propagate update flags to draw flags
    for (let v of this.verts) {
      if (v.flag & SplineFlags.UPDATE) {
        for (let i = 0; i < v.segments.length; i++) {
          let seg = v.segments[i];

          seg.flag |= SplineFlags.REDRAW_PRE;

          let l = seg.l;
          if (!l)
            continue;

          let _i = 0;
          do {
            if (_i++ > 5000) {
              console.warn("infinite loop!");
              break;
            }

            l.f.flag |= SplineFlags.REDRAW_PRE;
            l = l.radial_next;
          } while (l !== seg.l);
        }
      }
    }

    this.propagate_draw_flags();

    if (window.DISABLE_SOLVE || config.DISABLE_SOLVE) {
      return new Promise((accept, reject) => {
        accept();
      });
    }

    if (!DEBUG.no_native && config.USE_WASM && native_api.isReady()) {
      window._block_drawing++;
      let ret = native_api.do_solve(SplineFlags, this, steps, gk, true);

      ret.then(function () {
        window._block_drawing--;

        this2.pending_solve = undefined;
        this2.solving = false;
        this2._do_post_solve();

        dag_trigger();

        if (this2._resolve_after) {
          let cb = this2._resolve_after;
          this2._resolve_after = undefined;

          this2.pending_solve = this2.solve_intern().then(function () {
            cb.call(this2);
          });
          this2.solving = true;
        }
      }).catch(error => {
        window._block_drawing--;

        console.error(error.stack);
        console.error(error.message);
      });

      return ret;
    } else {
      let do_accept;

      let promise = new Promise(function (accept, reject) {
        do_accept = function () {
          accept();
        }
      });

      window._block_drawing++;

      let this2 = this;
      window.setTimeout(function () {
        window._block_drawing--;

        do_solve(SplineFlags, this2, steps, gk);
        this2.pending_solve = undefined;
        this2.solving = false;

        do_accept();
        this2._do_post_solve();

        dag_trigger();

        if (this2._resolve_after) {
          let cb = this2._resolve_after;
          this2._resolve_after = undefined;

          this2.pending_solve = this2.solve_intern().then(function () {
            cb.call(this2);
          });
          this2.solving = true;
        }

      }, 10);

      return promise;
    }
  }

  _do_post_solve() {
    for (let seg of this.segments) {
      if (seg.flag & SplineFlags.REDRAW_PRE) {
        seg.flag &= ~SplineFlags.REDRAW_PRE;
        seg.flag |= SplineFlags.REDRAW;
      }
    }

    for (let f of this.faces) {
      if (f.flag & SplineFlags.REDRAW_PRE) {
        f.flag &= ~SplineFlags.REDRAW_PRE;
        f.flag |= SplineFlags.REDRAW;
      }
    }

    //call post_solve for segments.
    //other types are ignored, for now.
    for (let seg of this.segments) {
      seg.post_solve();
    }
  }

  solve_p(steps: number, gk: number) {
    console.trace("solve_p: DEPRECATED");

    return this.solve(steps, gk);
  }

  trace_face(g: CanvasRenderingContext2D, f: SplineFace) {
    g.beginPath();

    let lastco = _trace_face_lastco;

    lastco.zero();

    for (let path of f.paths) {
      let first = true;

      for (let l of path) {
        let seg = l.s;

        let flip = seg.v1 !== l.v;
        let s = flip ? seg.ks[KSCALE] : 0, ds = flip ? -2 : 2;

        while ((!flip && s < seg.ks[KSCALE]) || (flip && s >= 0)) {
          let co = seg.evaluate(s/seg.length);

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

  forEachPoint(cb: function, thisvar: any) {
    for (let si = 0; si < 2; si++) {
      let list = si ? this.handles : this.verts;
      let last_len = list.length;

      for (let i = 0; i < list.length; i++) {
        if (thislet !== undefined)
          cb.call(thisvar, list[i]);
        else
          cb(list[i]);

        last_len = list.length;
      }
    }
  }

  build_shash(): Object {
    let sh = {};
    let cellsize = 150;

    sh.cellsize = cellsize;

    function hash(x, y, cellsize) {
      return Math.floor(x/cellsize) + "," + Math.floor(y/cellsize);
    }

    for (let si = 0; si < 2; si++) {
      let list = si ? this.handles : this.verts;

      for (let v of list) {
        let h = hash(v[0], v[1], cellsize);

        if (!(h in sh)) {
          sh[h] = [];
        }

        sh[h].push(v);
      }
    }

    let sqrt2 = sqrt(2);
    sh.forEachPoint = function sh_lookupPoints(co, radius, callback, thisvar) {
      let cellsize = this.cellsize;
      let cellradius = Math.ceil(sqrt2*radius/cellsize);

      let sx = Math.floor(co[0]/cellsize) - cellradius;
      let sy = Math.floor(co[1]/cellsize) - cellradius;
      let ex = Math.ceil(co[0]/cellsize) + cellradius;
      let ey = Math.ceil(co[1]/cellsize) + cellradius;

      for (let x = sx; x <= ex; x++) {
        for (let y = sy; y <= ey; y++) {
          let h = hash(x*cellsize, y*cellsize, cellsize);

          if (!(h in this)) continue;

          let list = this[h];
          for (let i = 0; i < list.length; i++) {
            let e = list[i];
            let dis = e.vectorDistance(co);

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
    for (let i = 0; i < this.verts.length; i++) {
      let v = this.verts[i];
      if (v.flag & SplineFlags.HIDE) {
        v.flag &= ~SplineFlags.HIDE;
        v.flag |= SplineFlags.SELECT;
      }
    }
  }

  duplicate_verts() {
    let newvs = [];
    let idmap = {};

    for (let i = 0; i < this.verts.length; i++) {
      let v = this.verts[i];

      if (!(v.flag & SplineFlags.SELECT)) continue;
      if (v.hidden) continue;

      let nv = this.make_vertex(v);
      idmap[v.eid] = nv;
      idmap[nv.eid] = v;

      nv.flag = v.flag & ~SplineFlags.SELECT;
      newvs.push(nv);
    }

    for (let i = 0; i < this.segments.length; i++) {
      let seg = this.segments[i];
      if ((seg.v1.flag & SplineFlags.SELECT) && (seg.v2.flag & SplineFlags.SELECT)) {
        let v1 = idmap[seg.v1.eid], v2 = idmap[seg.v2.eid];

        if (v1 === undefined || v2 === undefined || v1 === v2) continue;

        this.make_segment(v1, v2);
      }
    }

    for (let i = 0; i < this.verts.length; i++) {
      let v = this.verts[i];
      this.verts.setselect(v, false);
    }

    for (let i = 0; i < newvs.length; i++) {
      this.verts.setselect(newvs[i], true);
    }

    this.start_mpos[0] = this.mpos[0];
    this.start_mpos[1] = this.mpos[1];

    this.start_transform();

    this.resolve = 1;
  }

  has_highlight(selmask = 255) {
    for (let list of this.elists) {
      if ((list.type & selmask) && list.highlight)
        return true;
    }

    return false;
  }

  clear_highlight() {
    for (let i = 0; i < this.elists.length; i++) {
      this.elists[i].highlight = undefined;
    }
  }

  validate_active() {
    for (let i = 0; i < this.elists.length; i++) {
      let elist = this.elists[i];

      if (elist.active !== undefined && elist.active.hidden)
        elist.active = undefined;
    }
  }

  clear_active(e) {
    this.set_active(undefined);
  }

  set_active(e: SplineElement) {
    if (e === undefined) {
      for (let i = 0; i < this.elists.length; i++) {
        this.elists[i].active = undefined;
      }
      return;
    }

    let elist = this.get_elist(e.type);
    elist.active = e;
  }

  setselect(e: SplineElement, state: Boolean) {
    let elist = this.get_elist(e.type);
    elist.setselect(e, state);
  }

  clear_selection(e: SplineElement) {
    for (let i = 0; i < this.elists.length; i++) {
      this.elists[i].clear_selection();
    }
  }

  do_mirror() {
    this.start_transform('s');
    for (let i = 0; i < this.transdata.length; i++) {
      let start = this.transdata[i][0], v = this.transdata[i][1];
      if (v.flag & SplineFlags.HIDE) continue;

      v.sub(this.trans_cent);
      v[0] = -v[0];
      v.add(this.trans_cent);

    }

    this.end_transform();
    this.resolve = 1;
  }

  toJSON(self): Object {
    let ret = {};

    ret.frame = this.frame;
    ret.verts = {length: this.verts.length};
    ret.segments = [];

    ret.handles = [];
    ret.draw_verts = this.draw_verts;
    ret.draw_normals = this.draw_normals;
    ret._cur_id = this.idgen.cur_id;

    for (let i = 0; i < this.verts.length; i++) {
      ret.verts[i] = this.verts[i].toJSON();
    }

    if (this.verts.active !== undefined)
      ret.verts.active = this.verts.active.eid;
    else
      ret.verts.active = undefined;

    if (this.handles.active !== undefined)
      ret.handles.active = this.handles.active.eid;

    if (this.segments.active !== undefined)
      ret.segments.active = this.segments.active.eid;

    for (let i = 0; i < this.segments.length; i++) {
      ret.segments.push(this.segments[i].toJSON());
    }

    for (let i = 0; i < this.handles.length; i++) {
      ret.handles.push(this.handles[i].toJSON());
    }

    return ret;
  }

  reset() {
    this.idgen = new SDIDGen();

    this.strokeGroups = [];
    this._strokeGroupMap = new Map();
    this.init_elists();
    this.updateGen++;
  }

  import_json(obj: Object) {
    let spline2 = Spline.fromJSON(obj);

    let miny = 1e18, maxy = 1e-18;

    let newmap = {};
    for (let i = 0; i < spline2.verts.length; i++) {
      let v = spline2.verts[i];

      let nv = this.make_vertex(v, v.eid);
      nv.flag = v.flag;
      nv.flag |= SplineFlags.UPDATE | SplineFlags.FRAME_DIRTY;

      miny = Math.min(miny, nv[1]);
      maxy = Math.max(maxy, nv[1]);
      newmap[v.eid] = nv;
    }

    for (let i = 0; i < spline2.verts.length; i++) {
      let v = spline2.verts[i], nv = newmap[v.eid];

      nv[1] = ((maxy - miny) - (nv[1] - miny)) + miny;
    }

    for (let i = 0; i < spline2.segments.length; i++) {
      let seg = spline2.segments[i];

      let v1 = newmap[seg.v1.eid], v2 = newmap[seg.v2.eid];
      let nseg = this.make_segment(v1, v2);

      nseg.flag = seg.flag | SplineFlags.UPDATE | SplineFlags.FRAME_DIRTY;
      newmap[seg.eid] = nseg;
    }

    this.resolve = 1;
  }

  segmentNeedsResort(seg) {
    let sliced;

    let resort1 = vertexIsSplit(this, seg.v1);
    let resort2 = vertexIsSplit(this, seg.v2);

    //console.log(seg.eid, "SORTS", resort1, resort2, this._drawStrokeVertSplits.has(seg.v1.eid), this._drawStrokeVertSplits.has(seg.v2.eid));

    if (!!resort1 !== !!this._drawStrokeVertSplits.has(seg.v1.eid)) {
      return true;
    }
    if (!!resort2 !== !!this._drawStrokeVertSplits.has(seg.v2.eid)) {
      return true;
    }

    return false;

    outer: for (let v of [seg.v1, seg.v2]) {
      for (let seg1 of v.segments) {
        for (let seg2 of v.segments) {
          if (seg1 === seg2) {
            continue;
          }

          if (!seg1.mat.equals(true, seg2.mat)) {
            sliced = v;
            break outer;
          }
        }
      }
    }

    if (sliced && !this._drawStrokeVertSplits.has(sliced.eid)) {
      return true;
    }

    return false;
  }

  redoSegGroups() {
    buildSegmentGroups(this);
    splitSegmentGroups(this);
  }

  static fromJSON(obj: Object) {
    let spline = new Spline();

    spline.idgen.cur_id = obj._cur_id;

    spline.draw_verts = obj.draw_verts;
    spline.draw_normals = obj.draw_normals;

    let eidmap = {};

    for (let i = 0; i < obj.verts.length; i++) {
      let cv = obj.verts[i];

      let v = spline.make_vertex(cv);
      v.flag |= SplineFlags.FRAME_DIRTY;

      v.flag = cv.flag;
      v.eid = cv.eid;
      v.segments = cv.segments;
      eidmap[v.eid] = v;
    }

    for (let i = 0; i < obj.handles.length; i++) {
      let cv = obj.handles[i];

      let v = spline.make_handle(cv);

      v.flag = cv.flag;
      v.eid = cv.eid;
      v.segments = cv.segments;

      eidmap[v.eid] = v;
    }

    for (let i = 0; i < obj.segments.length; i++) {
      let s = obj.segments[i];
      let segments = obj.segments;

      let v1 = eidmap[s.v1], v2 = eidmap[s.v2];
      let h1 = eidmap[s.h1], h2 = eidmap[s.h2];

      let seg = new SplineSegment();

      seg.eid = s.eid;
      seg.flag = s.flag;

      if (seg.ks.length === s.ks.length) {
        seg.ks = s.ks;
      } else {
        spline.resolve = true;

        for (let j = 0; j < spline.verts.length; j++) {
          spline.verts[j].flag |= SplineFlags.UPDATE;
        }
      }

      for (let j = 0; j < seg.ks.length; j++) {
        if (isNaN(seg.ks[j])) {
          seg.ks[j] = 0.0;
        }
      }

      seg.v1 = v1, seg.v2 = v2, seg.h1 = h1, seg.h2 = h2;

      spline.segments.push(seg);
      eidmap[seg.eid] = seg;
    }

    for (let i = 0; i < obj.verts.length; i++) {
      let v = obj.verts[i];

      for (let j = 0; j < v.segments.length; j++) {
        v.segments[j] = eidmap[v.segments[j]];
      }
    }

    for (let i = 0; i < obj.handles.length; i++) {
      let v = obj.handles[i];

      for (let j = 0; j < v.segments.length; j++) {
        v.segments[j] = eidmap[v.segments[j]];
      }
    }

    if (obj.verts.active !== undefined)
      spline.verts.active = eidmap[obj.verts.active];

    if (obj.handles.active !== undefined)
      spline.handles.active = eidmap[obj.handles.active];

    if (obj.segments.active !== undefined)
      spline.segments.active = eidmap[obj.segments.active];

    spline.eidmap = eidmap;

    return spline;
  }

  prune_singles() {
    let del = [];

    for (let i = 0; i < this.verts.length; i++) {
      let v = this.verts[i];

      if (v.segments.length === 0) {
        del.push(v);
      }
    }

    for (let i = 0; i < del.length; i++) {
      this.kill_vertex(del[i]);
    }
  }

  checkSolve() {
    if (this.resolve) {
      if (this.solvePromise && util.time_ms() - this.solveTimeout < 1000) {
        return;
      } else {
        this.solvePromise = this.solve().then(() => {
          this.solvePromise = undefined;
          this.queue_redraw();
        });

        this.solveTimeout = util.time_ms();
      }
    }
  }

  draw(redraw_rects: Array<Array<number>>, g: CanvasRenderingContext2D,
       editor: HTMLCanvas, matrix: Matrix4, selectmode: number,
       only_render: boolean, draw_normals: boolean, alpha: number,
       draw_time_helpers: boolean, curtime: number, ignore_layers: boolean) {
    this.canvas = g;
    this.selectmode = selectmode;

    g.lineWidth = 1;

    this.checkSolve();

    return draw_spline(this, redraw_rects, g, editor, matrix, selectmode, only_render,
      draw_normals, alpha, draw_time_helpers, curtime, ignore_layers);
  }

  loadSTRUCT(reader: function) {
    reader(this);
    super.loadSTRUCT(reader);

    this.afterSTRUCT();

    //chain_fromSTRUCT corrupts this, argh!
    // -- okay, now that we're using loadSTRUCT, is this line still necassary?
    this.query = this.q = new SplineQuery(this);

    let eidmap = {};

    this.elists = [];
    this.elist_map = {};

    //restore elist stuff
    for (let k in _elist_map) {
      let type = _elist_map[k];
      let v = this[k];

      if (v === undefined) continue;

      this.elists.push(v);
      this.elist_map[type] = v;
    }

    this.init_sel_handlers();

    for (let si = 0; si < 2; si++) {
      let list = si ? this.handles : this.verts;

      for (let i = 0; i < list.length; i++) {
        let v = list[i];

        eidmap[v.eid] = v;
        if (v.type === SplineTypes.VERTEX)
          v.hpair = undefined;
      }
    }

    for (let h of this.handles) {
      h.hpair = eidmap[h.hpair];
    }

    for (let i = 0; i < this.segments.length; i++) {
      let s = this.segments[i];

      s.v1 = eidmap[s.v1];
      s.v2 = eidmap[s.v2];

      s.h1 = eidmap[s.h1];
      s.h2 = eidmap[s.h2];

      eidmap[s.eid] = s;
    }

    for (let si = 0; si < 2; si++) {
      let list = si ? this.handles : this.verts;

      for (let i = 0; i < list.length; i++) {
        let v = list[i];

        for (let j = 0; j < v.segments.length; j++) {
          v.segments[j] = eidmap[v.segments[j]];
        }
      }
    }

    for (let i = 0; i < this.faces.length; i++) {
      let f = this.faces[i];

      f.flag |= SplineFlags.UPDATE_AABB;

      eidmap[f.eid] = f;
      for (let path of f.paths) {
        path.f = f;

        let l = path.l;

        do {
          eidmap[l.eid] = l;

          l.f = f;
          l.s = eidmap[l.s];
          l.v = eidmap[l.v];

          l = l.next;
        } while (l !== path.l);
      }
    }

    for (let i = 0; i < this.faces.length; i++) {
      let f = this.faces[i];

      for (let path of f.paths) {
        let l = path.l;
        do {
          l.radial_next = eidmap[l.radial_next];
          l.radial_prev = eidmap[l.radial_prev];

          l = l.next;
        } while (l !== path.l);
      }
    }

    for (let i = 0; i < this.segments.length; i++) {
      let s = this.segments[i];

      s.l = eidmap[s.l];
    }

    this.eidmap = eidmap;

    let selected = new ElementArraySet();
    selected.layerset = this.layerset;

    for (let i = 0; i < this.selected.length; i++) {
      let eid = this.selected[i];

      if (!(eid in eidmap)) {
        console.log("WARNING! eid", eid, "not in eidmap!", Object.keys(eidmap));
        continue;
      }

      selected.add(eidmap[this.selected[i]]);
    }

    this.selected = selected;

    this.verts.afterSTRUCT(SplineTypes.VERTEX, this.idgen, this.eidmap,
      this.selected, this.layerset, this);
    this.handles.afterSTRUCT(SplineTypes.HANDLE, this.idgen, this.eidmap,
      this.selected, this.layerset, this);
    this.segments.afterSTRUCT(SplineTypes.SEGMENT, this.idgen, this.eidmap,
      this.selected, this.layerset, this);
    this.faces.afterSTRUCT(SplineTypes.FACE, this.idgen, this.eidmap, this.selected,
      this.layerset, this);

    if (this.layerset === undefined) {
      this.layerset = new SplineLayerSet();
      this.layerset.new_layer();
    } else {
      this.layerset.afterSTRUCT(this);
    }

    this._strokeGroupMap = new Map();
    for (let group of this.strokeGroups) {
      this._strokeGroupMap.set(group.hash, group);
      group.afterSTRUCT(this);
    }

    this.regen_sort();

    if (spline_multires.has_multires(this) && this.mres_format !== undefined) {
      console.log("Converting old multires layout. . .");

      for (let seg of this.segments) {
        let mr = seg.cdata.get_layer(spline_multires.MultiResLayer);

        mr._convert(this.mres_format, spline_multires._format);
      }
    }

    let arr = [];
    for (let i = 0; i < spline_multires._format.length; i++) {
      arr.push(spline_multires._format[i]);
    }
    this.mres_format = arr;

    for (let seg of this.segments) {
      seg.updateCoincident();
    }

    return this;
  }

  //v is optional
  flagUpdateVertTime(v: SplineVertex) {
    if (v) {
      this._vert_time_set.add(v.eid);
    }

    this.dag_update("on_vert_time_change", this._vert_time_set);
  }

  flagUpdateKeyframes(v) {
    this.dag_update("on_keyframe_insert", 1);
  }

  dag_exec(ctx: FullContext, inputs: Object, outputs: Object, graph) {
    outputs.on_vert_add.loadData(this._vert_add_set);

    this._vert_add_set = new set();
    this._vert_rem_set = new set();
    this._vert_time_set = new set();
  }

  static nodedef() {
    return {
      name   : "Spline",
      uiName : "Spline",
      outputs: {
        on_keyframe_insert : null,
        on_solve           : null, //null means depend socket type
        on_vert_time_change: new set(),  //set of eids
        on_vert_add        : new set(), //set of eids
        on_vert_remove     : new set(), //set of eids
        on_vert_change     : null //simple event, not a set
      },
      inputs : {}
    }
  }
}
;

mixin(Spline, DataPathNode);

//on_solve : 0

Spline.STRUCT = STRUCT.inherit(Spline, DataBlock) + `
    idgen    : SDIDGen;
    
    selected : iter(e, int) | e.eid;
    
    verts    : ElementArray;
    handles  : ElementArray;
    segments : ElementArray;
    faces    : ElementArray;
    layerset : SplineLayerSet;
    
    restrict : int;
    actlevel : int;
    
    mres_format : array(string);
    strokeGroups : array(SplineStrokeGroup);
}
`
DataBlock.register(Spline);

import {SplineStrokeGroup, buildSegmentGroups, splitSegmentGroups, vertexIsSplit} from "./spline_strokegroup.js";
