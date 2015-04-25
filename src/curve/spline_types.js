"use strict";







var PI = Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor,



    ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos,



    asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;







import {



  MinMax



} from 'mathlib';







import {



  TPropFlags, PropTypes



} from 'toolprops';







import {STRUCT} from 'struct';



import 'mathlib';



import {DataPathNode} from 'eventdag';







var abs=Math.abs, acos=Math.acos, asin=Math.asin, 



    atan2=Math.atan2,PI=Math.PI, sqrt=Math.sqrt,pow=Math.pow,



    log=Math.log;







export var MaterialFlags = {



  SELECT       : 1,



  MASK_TO_FACE : 2



}







export var RecalcFlags = {



  DRAWSORT : 1,



  SOLVE    : 2,



  ALL      : 1|2



}







export var SplineFlags = {



  SELECT         : 1,



  BREAK_TANGENTS : 2,



  USE_HANDLES    : 4,



  UPDATE         : 8,



  TEMP_TAG       : 16,



  BREAK_CURVATURES:32,



  HIDE           : 64,



  FRAME_DIRTY    : 128,



  PINNED         : 256,



  



  NO_RENDER      : 512, //used by segments



  AUTO_PAIRED_HANDLE : 1024,



  UPDATE_AABB    : 2048,



  DRAW_TEMP      : 2048*2,



  GHOST          : 2048*4,



  UI_SELECT      : 2048*8



}







export var SplineTypes= {



  VERTEX  : 1,



  HANDLE  : 2,



  SEGMENT : 4,



  LOOP    : 8,



  FACE    : 16,



  ALL     : 31



};







export var ClosestModes = {



  CLOSEST : 0,



  START   : 1,



  END     : 2,



  ALL     : 3



};







import {SelMask} from 'selectmode';



import {ORDER, KSCALE, KANGLE, KSTARTX, KSTARTY, KSTARTZ, KTOTKS, INT_STEPS} from 'spline_math';







import {



  eval_curve, spiraltheta, spiralcurvature,



  spiralcurvature_dv



} from 'spline_math';







export class CustomDataLayer {



  constructor() {



  }



  



  interp(srcs, ws) {



  }



  



  copy(src) {



  }



  



  static fromSTRUCT(reader) {



    var obj = new CustomDataLayer();



    



    reader(obj);



    



    return obj;



  }



}







CustomDataLayer.layerinfo = {



  type_name : "(bad type name)"



};







CustomDataLayer.STRUCT = """



  CustomDataLayer {



  }



"""







export class CustomData {



  constructor(layer_add_callback, layer_del_callback) {



    this.callbacks = {



      on_add : layer_add_callback,



      on_del : layer_del_callback



    }



    this.layers = [];



    this.startmap = {};



  }



  



  load_layout(CustomData src) {



    for (var i=0; i<src.layers.length; i++) {



      this.layers.push(src.layers[i]);



    }



    



    for (var k in src.startmap) {



      this.startmap[k] = src.startmap[k];



    }



  }



  



  add_layer(LayerTypeClass cls, String name) {



    var templ = cls



    



    var i = this.get_layer(templ.layerinfo.type_name);



    if (i != undefined) {



      var n = this.num_layers(templ.layerinfo.type_name);



      i += n;



      



      this.layers.insert(i, templ);



    } else {



      i = this.layers.length;



      



      this.startmap[templ.layerinfo.type_name] = i;



      this.layers.push(templ);



    }



    



    this.callbacks.on_add(templ, i);



  }



  



  gen_edata() {



    var ret = new CustomDataSet();



    



    for (var i=0; i<this.layers.length; i++) {



      ret.push(new this.layers[i]());



    }



    



    return ret;



  }



  



  get_layer(String type, i) {



    if (i == undefined) i = 0;



    



    return this.layers[this.startmap[type]+i];



  }



  



  num_layers(type) {



    var i = this.get_layer(type, 0);



    if (i == undefined) return 0;



    



    while (i < this.layers.length && this.layers[i++].type == type);



    



    return i;



  }



  



  static fromSTRUCT(reader) {



    var ret = new CustomData();



    



    reader(ret);



    



    //we saved instances; turn back to class constructors



    for (var i=0; i<ret.layers.length; i++) {



      ret.layers[i] = ret.layers[i].constructor;



      var l = ret.layers[i];



      



      var typename = l.layerinfo.type_name;



      if (!(typename in ret.startmap)) {



        ret.startmap[typename] = i;



      }



    }



    



    return ret;



  }



}







CustomData.STRUCT = """



  CustomData {



    layers : array(e, abstract(CustomDataLayer)) | new e();



  }



"""







export class CustomDataSet extends Array {



  constructor() {



    Array.call(this);



  }



  



  on_add(cls, i) {



    this.insert(i, new cls());



  }



  



  get_layer(cls) {



    for (var i=0; i<this.length; i++) {



      if (this[i].constructor === cls) //.layerinfo.type_name == type_name)



        return this[i];



    }



  }



  



  on_del(cls, i) {



    this.pop_u(i);



  }



  



  get_data(layout, layer_name) {



  }



  



  interp(srcs, ws) {



    static srcs2 = [];



    while (srcs2.length < srcs.length) {



      srcs2.push(0);



    }



    



    srcs2.length = srcs.length;



    



    for (var i=0; i<this.length; i++) {



      for (var j=0; j<srcs.length; j++) {



        srcs2[j] = srcs[j][i];



      }



   



      this[i].interp(srcs2, ws);



    }



  }



  



  copy(src) {



    for (var i=0; i<this.length; i++) {



      this[i].copy(src[i]);



    }



  }



  



  static fromSTRUCT(reader) {



    var ret = new CustomDataSet();



    



    reader(ret);



    



    for (var i=0; i<ret.arr.length; i++) {



      ret.push(ret.arr[i]);



    }



    delete ret.arr;



    



    return ret;



  }



}







CustomDataSet.STRUCT = """



  CustomDataSet {



    arr : iter(abstract(CustomDataLayer)) | obj;



  }



"""







export class SplineElement extends DataPathNode {



  constructor(type) {



    this.type = type;



    this.cdata = new CustomDataSet();



    this.masklayer = 1; //blender-style bitmask layers



    this.layers = {}; //stack layers this element belongs to



  }



  



  dag_get_datapath() {



    //wells, it should end in. . .



    var suffix = ".verts[" + this.eid + "]";



    



    //hrm, prefix should be either spline.ctx.frameset.drawspline, 



    //or spline.ctx.frameset.pathspline



    



    //test for presence of customdata time layer, I guess;



    



    var name = "drawspline";



    



    for (var i=0; i<this.cdata.length; i++) {



      if (this.cdata[i].constructor.name == "TimeDataLayer")



        name = "pathspline";



    }



    



    return "frameset." + name + suffix;



  }



  



  in_layer(layer) {



    return layer != undefined && layer.id in this.layers;



  }



  



  get aabb() {



    console.trace("Implement Me!");



  }



  



  sethide(state) {



    if (state)



      this.flag |= SplineFlags.HIDE;



    else



      this.flag &= ~SplineFlags.HIDE;



  }



  



  get hidden() {



    return !!(this.flag & SplineFlags.HIDE);



  }



  



  __hash__() {



    return ""+this.eid;



  }



  



  static fromSTRUCT(reader) {



    var ret = new SplineElement();



    



    reader(ret);



    



    return ret;



  }



}







define_static(SplineElement, "dag_outputs", {



  depend    : undefined,



  on_select : 0.0,



  eid       : 0.0



});







SplineElement.STRUCT = """



  SplineElement {



    eid        : int;



    flag       : int;



    type       : int;



    cdata      : CustomDataSet;



  }



""";







export class SplineVertex extends SplineElement, Vector3 {



  constructor() {



    SplineElement.call(this, SplineTypes.VERTEX);



    Vector3.apply(this, arguments);



    



    this.type = SplineTypes.VERTEX;



    this.flag = SplineFlags.FRAME_DIRTY|SplineFlags.UPDATE;



    this.segments = [];



    this.eid = 0;



    this.frames = {};



    



    //handle variables



    this.hpair = undefined; //connected handle in shared tangents mode



  }



  



  get aabb() {



    static ret = [new Vector3(), new Vector3()];



    ret[0].load(this); ret[1].load(this);



    return ret;



  }



  



  sethide(state) {



    if (state)



      this.flag |= SplineFlags.HIDE;



    else



      this.flag &= ~SplineFlags.HIDE;



    



    if (this.type == SplineTypes.HANDLE)



      return;



      



    if (state) {



      for (var i=0; i<this.segments.length; i++) {



        this.segments[i].sethide(true);



      }



    } else {



      for (var i=0; i<this.segments.length; i++) {



        this.segments[i].sethide(false);



      }



    }



  }



  



  get hidden() {



    if (this.type == SplineTypes.VERTEX) {



      return !!(this.flag & SplineFlags.HIDE);



    } else {



      var s = this.owning_segment;



      



      return (this.flag & SplineFlags.HIDE) || !this.use || s.v1.hidden || s.v2.hidden;



    }



  }



  



  //get owning segment for handles



  get owning_segment() {



    return this.segments[0];



  }



  



  get owning_vertex() {



    return this.owning_segment.handle_vertex(this);



  }



  



  get use() {



    if (this.type != SplineTypes.HANDLE) return true;



    



    var s = this.owning_segment;



    var v = s.handle_vertex(this);



    



    var ret = v != undefined && (v.segments != undefined && v.segments.length > 2 || (v.flag & SplineFlags.USE_HANDLES));



    



    return ret;



  }



  



  set hidden(val) {



    if (val)



      this.flag |= SplineFlags.HIDE;



    else



      this.flag &= ~SplineFlags.HIDE;



  }







  other_segment(s) {



    if (s == this.segments[0]) return this.segments[1];



    else if (s == this.segments[1]) return this.segments[0];



    



    return undefined;



  }



  



  toJSON() {



    var ret = {};



    



    ret.frame = this.frame;



    ret.segments = [];



    ret[0] = this[0];



    ret[1] = this[1];



    ret[2] = this[2];



    ret.frames = this.frames;



    ret.length = 3;



    



    for (var i=0; i<this.segments.length; i++) {



      if (this.segments[i] != undefined)



        ret.segments.push(this.segments[i].eid);



    }



    



    ret.flag = this.flag;



    ret.eid = this.eid;



    



    return ret;



  }



  



  static fromSTRUCT(reader) {



    var ret = STRUCT.chain_fromSTRUCT(SplineVertex, reader);



    



    ret.load(ret.co);



    delete ret.co;



    



    return ret;



  }



};







SplineVertex.STRUCT = STRUCT.inherit(SplineVertex, SplineElement) + """



  co       : vec3          | obj;



  segments : array(e, int) | e.eid;



  hpair    : int           | obj.hpair != undefined? obj.hpair.eid : -1;



}



""";







var derivative_cache_vs = cachering.fromConstructor(Vector3, 64);



var closest_point_ret_cache_vs = cachering.fromConstructor(Vector3, 256);



var closest_point_ret_cache = new cachering(function() {



  return [0, 0];



}, 256);







var closest_point_cache_vs = cachering.fromConstructor(Vector3, 64);







export class SplineSegment extends SplineElement {



  constructor(SplineVertex v1, SplineVertex v2) {



    SplineElement.call(this, SplineTypes.SEGMENT);



    



    this.l = undefined;



    



    this.v1 = v1;



    this.v2 = v2;



    



    this.mat = new Material();



    



    this.z = 5;



    



    this._aabb = [new Vector3(), new Vector3()];



    



    //handles are SplineVerts too



    this.h1 = this.h2 = undefined;



    



    this.type = SplineTypes.SEGMENT;



    this.flag = 0;



    this.eid = 0;



    



    this.ks = new Array(KTOTKS);



    this._last_ks = new Array(KTOTKS);



    



    for (var i=0; i<this.ks.length; i++) {



      this.ks[i] = 0;



      this._last_ks[i] = 0;



    }



  }







  get aabb() {



    if (this.flag & SplineFlags.UPDATE_AABB)



      this.update_aabb();



      



    return this._aabb;



  }



  



  set aabb(val) {



    this._aabb = val;



  }



  



  update_aabb(steps=4) {



    this.flag &= ~SplineFlags.UPDATE_AABB;



    



    var min = this._aabb[0], max = this._aabb[1];



    static minmax = new MinMax(3);



    



    minmax.reset();



    min.zero(); max.zero();



    



    var co = this.eval(0);



    minmax.minmax(co);



    



    var ds = 1.0/(steps-1);



    for (var i=0, s=0; i<steps; i++, s += ds) {



      



      var co = this.eval(s);



      minmax.minmax(co);



    }



    



    min.load(minmax.min);



    max.load(minmax.max);



  }



  



  closest_point(p, mode, fast=false) {



    var minret = undefined, mindis = 1e18, maxdis=0;



    



    var p2 = closest_point_cache_vs.next().zero();



    for (var i=0; i<p.length; i++) {



      p2[i] = p[i];



    }



    p = p2;



    



    if (mode == undefined) mode = 0;



    var steps=5, s = 0, ds = 1.0/(steps);



    



    var n = closest_point_cache_vs.next();



    var n1 = closest_point_cache_vs.next(), n2 = closest_point_cache_vs.next();



    var n3 = closest_point_cache_vs.next(), n4 = closest_point_cache_vs.next();



    



    if (mode == ClosestModes.ALL)



      minret = [];



    



    for (var i=0; i<steps; i++, s += ds) {



      var start = s-0.00001, end = s+ds+0.00001;



      



      start = Math.min(Math.max(start, 0.0), 1.0);



      end   = Math.min(Math.max(end, 0.0), 1.0);



      



      var mid = (start+end)*0.5;



      var bad = false;



      



      var angle_limit = fast ? 0.65 : 0.2;



      



      var steps = fast ? 5 : 20;



      for (var j=0; j<steps; j++) {



        mid = (start+end)*0.5;



        



        var co = this.eval(mid);



        var sco = this.eval(start);



        var eco = this.eval(end);



        



        var d1 = this.normal(start).normalize();



        var d2 = this.normal(end).normalize();



        var dm = this.normal(mid).normalize();



        



        n1.load(sco).sub(p).normalize();



        n2.load(eco).sub(p).normalize();



        n.load(co).sub(p).normalize();







        if (n1.dot(d1) < 0.0) d1.negate();



        if (n2.dot(d2) < 0.0) d2.negate();



        if (n.dot(dm) < 0) dm.negate();



        



        var mang = acos(n.normalizedDot(dm));



        if (mang < 0.001) 



          break;



        



        var ang1 = acos(n1.normalizedDot(d1));



        var ang2 = acos(n2.normalizedDot(d2));







        var w1 = n1.cross(d1)[2] < 0.0;



        var w2 = n2.cross(d2)[2] < 0.0;



        var wm = n.cross(dm)[2] < 0.0;



        



        if (isNaN(mang)) {



          console.log(p, co, mid, dm);



        }



        



        if (j == 0 && w1 == w2) {



          bad = true;



          break



        } else if (w1 == w2) {



          //break;



        }







        if (w1 == w2) {



          //var dis1 = sco.vectorDistance(p), dis2 = eco.vectorDistance(p), dism = co.vectorDistance(p);



          var dis1, dis2;



          



          dis1 = ang1, dis2 = ang2;



          //console.log("w1==w2", w1, w2, dis1.toFixed(4), dis2.toFixed(4), dism.toFixed(4));



          



          if (dis2 < dis1) {



            start = mid;



          } else if (dis1 < dis2) {



            end = mid;



          } else {



            break;



          }



        } else if (wm == w1) {



          start = mid;



        } else {



          end = mid;



        }



      }



      



      if (bad) 



        continue;



        



      //make sure angle is close enough to 90 degrees for our purposes. . .



      var co = this.eval(mid);



      n1.load(this.normal(mid)).normalize();



      n2.load(co).sub(p).normalize();



      



      if (n2.dot(n1) < 0) {



        n2.negate();



      }



      



      var angle = acos(Math.min(Math.max(n1.dot(n2), -1), 1));



      if (angle > angle_limit)



        continue;



      



      if (mode != ClosestModes.ALL && minret == undefined) {



        var minret = closest_point_ret_cache.next();



        minret[0] = minret[1] = undefined;



      }



      



      //did we come up empty?



      var dis = co.vectorDistance(p);



      if (mode == ClosestModes.CLOSEST) {



        if (dis < mindis) {



          minret[0] = closest_point_cache_vs.next().load(co);



          minret[1] = mid;



          mindis = dis;



        }



      } else if (mode == ClosestModes.START) {



        if (mid < mindis) {



          minret[0] = closest_point_cache_vs.next().load(co);



          minret[1] = mid;



          mindis = mid;



        }



      } else if (mode == ClosestModes.END) {



        if (mid > maxdis) {



          minret[0] = closest_point_cache_vs.next().load(co);



          minret[1] = mid;



          maxdis = mid;



        }



      } else if (mode == ClosestModes.ALL) {



        var ret = closest_point_ret_cache.next();



        ret[0] = closest_point_cache_vs.next().load(co);



        ret[1] = mid;



        



        minret.push(ret);



      }



    }



    



    if (minret == undefined && mode == ClosestModes.CLOSEST) {



      var dis1 = this.v1.vectorDistance(p), dis2 = this.v2.vectorDistance(p);



      



      minret = closest_point_ret_cache.next();



      minret[0] = closest_point_cache_vs.next().load(dis1 < dis2 ? this.v1 : this.v2);



      minret[1] = dis1 < dis2 ? 0.0 : 1.0;



    } else if (minret == undefined && mode == ClosestModes.START) {



      minret = closest_point_ret_cache.next();



      minret[0] = closest_point_cache_vs.next().load(this.v1);



      minret[1] = 0.0;



    } if (minret == undefined && mode == ClosestModes.END) {



      minret = closest_point_ret_cache.next();



      minret[0] = closest_point_cache_vs.next().load(this.v2);



      minret[1] = 1.0;



    }



    



    return minret;



  }



  



  normal(s) {



    var ret = this.derivative(s);



    var t = ret[0]; ret[0] = -ret[1]; ret[1] = t;



    



    ret.normalize();



    return ret;



  }



  



  handle(v) {



    if (v === this.v1) return this.h1;



    if (v == this.v2) return this.h2;



  }



  



  handle_vertex(h) {



    if (h === this.h1) return this.v1;



    if (h === this.h2) return this.v2;



  }



  



  get is_line() {



    var r1 = (this.v1.flag & SplineFlags.BREAK_TANGENTS);// || this.v1.segments.length > 2;



    var r2 = (this.v2.flag & SplineFlags.BREAK_TANGENTS);// || this.v2.segments.length > 2;



    



    return r1 && r2;



  }



  



  get renderable() {



    return !(this.flag & SplineFlags.NO_RENDER);



  }



  



  set renderable(val) {



    if (!val)



      this.flag |= SplineFlags.NO_RENDER;



    else



      this.flag &= ~SplineFlags.NO_RENDER;



  }



  



  update_handle(h) {



    if (h.hpair != undefined) {



      var seg = h.hpair.owning_segment;



      var v = this.handle_vertex(h);



      



      var len = h.hpair.vectorDistance(v);



      



      h.hpair.load(h).sub(v).negate().normalize().mulScalar(len).add(v);



      seg.update();



    }



  }



  



  other_handle(h_or_v) {



    if (h_or_v == this.v1)



      return this.h2;



    if (h_or_v == this.v2)



      return this.h1;



    if (h_or_v == this.h1)



      return this.h2;



    if (h_or_v == this.h2)



      return this.h1;



  }



  



  get length() {



      return this.ks[KSCALE];



  }







  toJSON() {



    var ret = {};



    



    ret.frames = this.frames;



    ret.ks = []



    for (var i=0; i<this.ks.length; i++) {



      ret.ks.push(this.ks[i]);



    }



    



    ret.v1 = this.v1.eid;



    ret.v2 = this.v2.eid;



    



    ret.h1 = this.h1 != undefined ? this.h1.eid : -1;



    ret.h2 = this.h2 != undefined ? this.h2.eid : -1;



    



    ret.eid = this.eid;



    ret.flag = this.flag;



    



    return ret;



  }



  



  curvature(s, order, override_scale) {



    if (order == undefined) order = ORDER;



    



    //update ks[KSCALE], final 1 prevents final evaluation



    //to save performance



    eval_curve(0.5, this.v1, this.v2, this.ks, order, 1);



    



    var k = spiralcurvature(s, this.ks, order);



    return k/this.ks[KSCALE];



  }



  



  curvature_dv(s, order, override_scale) {



    if (order == undefined) order = ORDER;



    



    //update ks[KSCALE], final 1 prevents final evaluation



    //to save performance



    eval_curve(0.5, this.v1, this.v2, this.ks, order, 1);



    



    var k = spiralcurvature_dv(s, this.ks, order);



    return k/this.ks[KSCALE];



  }



  



  derivative(s, order, no_update_curve) {



    if (order == undefined) order = ORDER;







    var ret = derivative_cache_vs.next().zero();







    //update ks[KANGLE], final '1' argument prevents final evaluation



    //to save performance



    var ks = this.ks;



    



    if (!no_update_curve)



      eval_curve(0.5, this.v1, this.v2, ks, order, 1);



    



    var th = spiraltheta(s, ks, order);



    var k = spiralcurvature(s, ks, order);



    



    var ang = ks[KANGLE];



    



    ret[0] = sin(th+ang)*ks[KSCALE];



    ret[1] = cos(th+ang)*ks[KSCALE];



    ret[2] = 0.0;



    



    return ret;



  }



  



  theta(s, order) {



    if (order == undefined) order = ORDER;



    return spiraltheta(s, this.ks, order)*this.ks[KSCALE];



  }



  



  offset_eval(s, offset, order, no_update) {



    if (order == undefined) order = ORDER;



    



    var ret = this.eval(s, order, undefined, no_update);



    if (offset == 0.0) return ret;



    



    var tan = this.derivative(s, order, no_update);



    



    var t = tan[0]; tan[0] = -tan[1]; tan[1] = t;



    



    tan.normalize().mulScalar(offset);



    



    ret.add(tan);



    return ret;



  }



  



  eval(s, order, override_scale, no_update) {



    if (order == undefined) order = ORDER;



    



    //check if scale is invalid



    //if (this.ks[KSCALE] == undefined || this.ks[KSCALE] == 0)



    //  eval_curve(1, this.v1, this.v2, this.ks, order, undefined, no_update);



    //s /= this.ks[KSCALE];



    



    s = (s + 0.00000001) * (1.0 - 0.00000002);



    s -= 0.5;



    



    var co = eval_curve(s, this.v1, this.v2, this.ks, order, undefined, no_update);



    //var co = new Vector3(this.v2).sub(this.v1).mulScalar(t).add(this.v1);



    



    return co;



  }



  



  update() {



    this.flag |= SplineFlags.UPDATE|SplineFlags.UPDATE_AABB;



    this.h1.flag |= SplineFlags.UPDATE;



    this.h2.flag |= SplineFlags.UPDATE;



    



    var l = this.l;



    if (l == undefined) return;



    



    var c = 0;



    do {



      if (c++ > 10000) {



        console.log("Infinte loop detected!");



        break;



      }



      



      l.f.update();



      l = l.radial_next;



    } while (l != undefined && l != this.l);



  }



  



  other_vert(v) {



    if (v == this.v1) return this.v2;



    if (v == this.v2) return this.v1;



  }



  



  static fromSTRUCT(reader) {



    var ret = new SplineSegment();



    reader(ret);



    return ret;



  }



}







SplineSegment.STRUCT = STRUCT.inherit(SplineSegment, SplineElement) + """



  ks   : array(float);



  



  v1   : int | obj.v1.eid;



  v2   : int | obj.v2.eid;



  



  h1   : int | obj.h1 != undefined ? obj.h1.eid : -1;



  h2   : int | obj.h2 != undefined ? obj.h2.eid : -1;



  



  l    : int | obj.l != undefined  ? obj.l.eid : -1;



  



  mat  : Material;







  aabb : array(vec3);



  z    : float;



}



""";







export class SplineLoop extends SplineElement {



  constructor(f, s, v) {



    SplineElement.call(this, SplineTypes.LOOP);



    



    this.f = f, this.s = s, this.v = v;



    



    this.next = this.prev = undefined;



    this.radial_next = this.radial_prev = undefined;



  }



  



  static fromSTRUCT(reader) {



    var ret = new SplineLoop();



    reader(ret);



    return ret;



  }



}



SplineLoop.STRUCT = STRUCT.inherit(SplineLoop, SplineElement) + """



    f    : int | obj.f.eid;



    s    : int | obj.s.eid;



    v    : int | obj.v.eid;



    next : int | obj.next.eid;



    prev : int | obj.prev.eid;



    radial_next : int | obj.radial_next != undefined ? obj.radial_next.eid : -1;



    radial_prev : int | obj.radial_prev != undefined ? obj.radial_prev.eid : -1;



  }



"""







class SplineLoopPathIter {



  constructor(path) {



    this.path = path;



    this.ret = {done : false, value : undefined};



    this.l = path != undefined ? path.l : undefined;



  }



  



  init(path) {



    this.path = path;



    this.l = path.l;



    this.ret.done = false;



    this.ret.value = undefined;



    



    return this;



  }



  



  next() {



    var ret = this.ret;



    



    if (this.l == undefined) {



      ret.done = true;



      ret.value = undefined;



      return ret;



    }



    



    ret.value = this.l;



    this.l = this.l.next;



    



    if (this.l === this.path.l)



      this.l = undefined;



    



    return ret;



  }



  



  reset() {



    this.l = this.path.l;



    this.ret.done = false;



    this.ret.value = undefined;



  }



}







export class SplineLoopPath {



  constructor(l, f) {



    this.l = l;



    this.f = f;



    this.totvert = undefined;



    this.winding = 0;



  }



  



  __iterator__() {



    if (this.itercache == undefined) {



      this.itercache = cachering.fromConstructor(SplineLoopPathIter, 4);



    }



    



    return this.itercache.next().init(this);



  }



  



  update_winding() {



    static cent = new Vector3();



    



    cent.zero();



    for (var l in this) {



      cent.add(l.v);



    }



    



    cent.mulScalar(1.0/this.totvert);



    



    var wsum = 0;



    for (var l in this) {



      wsum += winding(l.v, l.next.v, cent) ? 1 : -1; 



    }



    



    this.winding = wsum >= 0;



  }



  



  asArray() {



    var l = this.l;



    var ret = [];



    



    do {



      ret.push(l);



      l = l.next;



    } while (l !== this.l);



    



    return ret;



  }



  



  static fromSTRUCT(reader) {



    var ret = new SplineLoopPath();



    reader(ret);



    



    var l = ret.l = ret.loops[0];



    l.p = ret;



    



    for (var i=1; i<ret.loops.length; i++) {



      l.next = ret.loops[i];



      ret.loops[i].prev = l;



      



      ret.loops[i].p = ret;



      l = ret.loops[i];



    }



    



    ret.loops[0].prev = ret.loops[ret.loops.length-1];



    ret.loops[ret.loops.length-1].next = ret.loops[0];



    



    delete ret.loops;



    return ret;



  }



}



SplineLoopPath.STRUCT = """



  SplineLoopPath {



    totvert : int;



    loops   : array(SplineLoop) | obj.asArray();



    winding : int;



  }



"""







export class SplineFace extends SplineElement {



  constructor() {



    SplineElement.call(this, SplineTypes.FACE);



   



    this.z = 0;



    this.mat = new Material();



    this.paths = new GArray();



    this.flag |= SplineFlags.UPDATE_AABB;



    



    this._aabb = [new Vector3(), new Vector3()];



  }



  



  update() {



    this.flag |= SplineFlags.UPDATE_AABB;



  }



  



  update_aabb() {



    this.flag &= ~SplineFlags.UPDATE_AABB;



    



    static minmax = new MinMax(3);



    



    minmax.reset();



    for (var path of this.paths) {



      for (var l of path) {



        minmax.minmax(l.v.aabb[0]);



        minmax.minmax(l.v.aabb[1]);



        minmax.minmax(l.s.aabb[0]);



        minmax.minmax(l.s.aabb[1]);



      }



    }



    



    this._aabb[0].load(minmax.min);



    this._aabb[1].load(minmax.max);



  }



  



  get aabb() {



    if (this.flag & SplineFlags.UPDATE_AABB)



      this.update_aabb();



      



    return this._aabb;



  }



  



  set aabb(val) {



    this._aabb = val;



  }



    



  static fromSTRUCT(reader) {



    var ret = new SplineFace();



    ret.flag |= SplineFlags.UPDATE_AABB;



    



    reader(ret);



     



    return ret;



  }



}







SplineFace.STRUCT = STRUCT.inherit(SplineFace, SplineElement) + """



    paths : array(SplineLoopPath);



    mat   : Material;



    aabb  : array(vec3);



    z     : float;



  }



""";







export class Material {



  constructor() {



    this.fillcolor = [0, 0, 0, 1];



    this.strokecolor = [0, 0, 0, 1];



    this.linewidth = 2.0;



    



    this.flag = 0;



    



    this.opacity = 1.0; //multiplied with both fillcolor and strokecolor's alpha



    this.fill_over_stroke = false;



    



    this.blur = 0.0;



  }



  



  load(mat) {



    for (var i=0; i<4; i++) {



      this.fillcolor[i] = mat.fillcolor[i];



      this.strokecolor[i] = mat.strokecolor[i];



    }



    



    this.opacity = mat.opacity;



    this.linewidth = mat.linewidth;



    this.fill_over_stroke = mat.fill_over_stroke;



    this.blur = mat.blur;



    



    this.flag = mat.flag;



    



    return this;



  }



  



  get css_fillcolor() {



    var r = Math.floor(this.fillcolor[0]*255);



    var g = Math.floor(this.fillcolor[1]*255);



    var b = Math.floor(this.fillcolor[2]*255);



    



    return "rgba("+r+","+g+","+b+","+this.fillcolor[3]+")";



  }







  static fromSTRUCT(reader) {



    var ret = new Material();



    



    reader(ret);



    



    return ret;



  }



}







Material.STRUCT = """



  Material {



    fillcolor        : array(float);



    strokecolor      : array(float);



    opacity          : float;



    fill_over_stroke : int;



    linewidth        : float;



    blur             : float;



    flag             : int;



  }



""";







import {ToolIter, TPropIterable} from 'toolprops_iter';







//stores elements as eid's, for tool operators



export class ElementRefIter extends ToolIter, TPropIterable {



  constructor() {



    ToolIter.call(this);



    TPropIterable.call(this);



    



    this.ret = {done : false, value : undefined};



    this.spline = this.ctx = this.iter = undefined;



  }



  



  init(eset) {



    this.ret.done = false;



    this.nextitem = undefined;



    



    this.eset = eset;



    this.ctx = eset != undefined ? eset.ctx : undefined;



    this.spline = this.ctx != undefined ? this.ctx.spline : undefined;



    



    return this;



  }



  



  spawn() {



    var ret = new ElementRefIter();



    ret.init(this.eset);



    return ret;



  }



  



  next() {



    var ret = this.ret;



    



    if (this.spline == undefined)



      this.spline = this.ctx.spline;



    if (this.iter == undefined)



      this.iter = set.prototype.__iterator__.call(this.eset);



    



    var spline = this.spline;



    var next, e = undefined;



    do {



      var next = this.iter.next();



      if (next.done) break;



      



      e = spline.eidmap[next.value];



      if (e == undefined) {



        console.log("Warning, bad eid", next.value);



      }



    } while (next.done != true && e == undefined);



    



    if (e == undefined || next.done == true) {



      this.spline = undefined;



      this.iter = undefined;



      



      ret.done = true;



      ret.value = undefined;



    } else {



      ret.value = e;



    }



    



    return ret;



  }



  



  reset() {



    this.i = 0;



    this.ret.done = false;



    this.spline = undefined;



    this.iter = undefined;



  }



  



  __iterator__() {



    return this;



  }



  



  static fromSTRUCT(reader) {



    var ret = new ElementRefIter();



    reader(ret);



    



    for (var i=0; i<ret.saved_items.length; i++) {



      ret.add(ret.saved_items[i]);



    }



    delete ret.saved_items;



    



    return ret;



  }



}



ElementRefIter.STRUCT = """



  ElementRefIter {



    mask        : int;



    saved_items : iter(int) | obj;



  }



"""







export class ElementRefSet extends set, TPropIterable {



  constructor(mask) {



    set.call(this);



    



    this.mask = mask == undefined ? SplineTypes.ALL : mask;



  }



  



  add(item) {



    var start_item = item;



    if (!(typeof item == "number" || item instanceof Number))



      item = item.eid;



      



    if (item == undefined) {



      console.trace("ERROR in ElementRefSet!!", start_item);



      return;



    }



    



    set.prototype.add.call(this, item);



  }



  



  copy() {



    var ret = new ElementRefSet(this.mask);



    



    for (var eid of set.prototype.__iterator__.call(this)) {



      ret.add(eid);



    }



    



    return ret;



  }



  



  __iterator__() {



    if (this.itercaches == undefined) {



      this.itercaches = cachering.fromConstructor(ElementRefIter, 8);



    }



    



    return this.itercaches.next().init(this);



  }



};
