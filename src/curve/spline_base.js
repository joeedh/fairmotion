import {
  TPropFlags, PropTypes
} from '../core/toolprops.js';

var acos = Math.acos, asin = Math.asin, abs=Math.abs, log=Math.log,
    sqrt=Math.sqrt, pow=Math.pow, PI=Math.PI, floor=Math.floor, min=Math.min,
    max=Math.max, sin=Math.sin, cos=Math.cos, tan=Math.tan, atan=Math.atan,
    atan2=Math.atan2, exp=Math.exp;
    
import {STRUCT} from '../core/struct.js';
import '../util/mathlib.js';
import {DataPathNode} from '../core/eventdag.js';

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
  SELECT          : 1,
  BREAK_TANGENTS  : 2,
  USE_HANDLES     : 4,
  UPDATE          : 8,
  TEMP_TAG        : 16,
  BREAK_CURVATURES:32,
  HIDE            : 64,
  FRAME_DIRTY     : 128,
  PINNED          : 256,
  
  NO_RENDER       : 512, //used by segments
  AUTO_PAIRED_HANDLE : 1<<10,
  UPDATE_AABB     : 1<<11,
  DRAW_TEMP       : 1<<12,
  GHOST           : 1<<13,
  UI_SELECT       : 1<<14,
  FIXED_KS        : 1<<21, //internal to solver code
  REDRAW_PRE      : 1<<22,
  REDRAW          : 1<<23
};

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

export class CustomDataLayer {
  constructor() {
    this.shared = undefined;
  }
  
  segment_split(old_segment, old_v1, old_v2, new_segments) {
  }
  
  update(owner) {
  }

  post_solve(owner) {
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
  
  curve_effect(owner) {
  }
}

export class empty_class {
  static fromSTRUCT(reader) {
    var ret = new empty_class();
    reader(ret);
    return ret;
  }
}
empty_class.STRUCT = `
  empty_class {
  }
`

CustomDataLayer.layerinfo = {
  type_name : "(bad type name)",
  has_curve_effect : false,
  
  //global class, one instance is shared by all elements of same geometric 
  //type using this customdata layer
  shared_class : empty_class
};

CustomDataLayer.STRUCT = `
  CustomDataLayer {
  }
`;

export class CustomData {
  callbacks : Object
  startmap : Object;

  constructor(owner : any, layer_add_callback : function, layer_del_callback : function) {
    this.owner = owner; //owning ElementArray
    
    this.callbacks = {
      on_add : layer_add_callback,
      on_del : layer_del_callback
    }
    
    this.layers = [];
    this.shared_data = [];
    this.startmap = {};
  }
  
  load_layout(src : CustomData) {
    for (var i=0; i<src.layers.length; i++) {
      this.layers.push(src.layers[i]);
    }
    
    for (var k in src.startmap) {
      this.startmap[k] = src.startmap[k];
    }
  }
  
  add_layer(cls : LayerTypeClass, name : String) {
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
    
    var scls = templ.layerinfo.shared_class;
    scls = scls == undefined ? empty_class : scls;
    var shared = new scls;

    this.shared_data.push(shared);
    
    for (var e of this.owner) {
      e.cdata.on_add(templ, i, shared);
    }
    
    if (this.callbacks.on_add != undefined)
      this.callbacks.on_add(templ, i, shared);
  }
  
  gen_edata() {
    var ret = new CustomDataSet();
    
    for (var i=0; i<this.layers.length; i++) {
      var layer = new this.layers[i]();
      layer.shared = this.shared_data[i];
      
      ret.push(layer);
    }
    
    return ret;
  }
  
  get_shared(type : string) {
    return this.shared_data[this.get_layer_i(type, 0)];
  }
  
  get_layer_i(type : string, i=0) {
    if (!(type in this.startmap))
      return -1;
    
    return this.startmap[type]+i;
  }
  
  get_layer(type : string, i) {
    if (i == undefined) i = 0;
    
    return this.layers[this.startmap[type]+i];
  }
  
  num_layers(type : int) {
    var i = this.get_layer_i(type, 0);
    if (i == undefined || i == -1) return 0;
    
    while (i < this.layers.length && this.layers[i++].type == type);
    
    return i;
  }
  
  loadSTRUCT(reader : function) {
    reader(this);
    
    //we saved instances; turn back to class constructors
    for (var i=0; i<this.layers.length; i++) {
      this.layers[i] = this.layers[i].constructor;
      var l = this.layers[i];
      
      var typename = l.layerinfo.type_name;
      if (!(typename in this.startmap)) {
        this.startmap[typename] = i;
      }
    }
    
    if (this.shared_data.length != this.layers.length) {
      for (var i=0; i<this.layers.length; i++) {
        var layer = this.layers[i];
        
        var scls = layer.layerinfo.shared_class;
        scls = scls == undefined ? empty_class : scls;
        var shared = new scls;
        
        if (this.shared_data.length > i)
          this.shared_data[i] = shared;
        else
          this.shared_data.push(shared);
      }
    }
  }
   
  afterSTRUCT(element_array : SplineElementArray, cdata) {
    for (var e of element_array) {
      var i = 0;
      
      for (var layer of e.cdata) {
        layer.shared = cdata.shared_data[i];
        i++;
      }
    }
  }
}

CustomData.STRUCT = `
  CustomData {
    layers      : array(e, abstract(CustomDataLayer)) | new e();
    shared_data : array(abstract(Object));
  }
`

export class CustomDataSet extends Array {
  constructor() {
    super();
  }
  
  on_add(cls, i, shared) {
    var layer = new cls();
    layer.shared = shared;
    
    this.insert(i, layer);
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
  
  //note that old_segment will not be valid, so you can only 
  //access things like flags.  ditto for new_segments.
  on_segment_split(old_segment : SplineSegment, old_v1 : SplineVertex,
                   old_v2 : SplineVertex, new_segments : SplineSegment) {
  }

  interp(srcs : Array<CustomDataSet>, ws : Array<float>) {
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
  
  copy(src : CustomDataSet) {
    for (var i=0; i<this.length; i++) {
      this[i].copy(src[i]);
    }
  }

  loadSTRUCT(reader : function) {
    reader(this);
    
    for (var i=0; i<this.arr.length; i++) {
      this.push(this.arr[i]);
    }
    delete this.arr;
  }
}

CustomDataSet.STRUCT = `
  CustomDataSet {
    arr : iter(abstract(CustomDataLayer)) | obj;
  }
`;

export class SplineElement extends DataPathNode {
  cdata : CustomDataSet
  masklayer : number
  layers : Object;

  constructor(type : int) {
    super();
    
    this.type = type;
    this.cdata = new CustomDataSet();
    
    //eek.  this .masklayer shouldn't be here.
    this.masklayer = 1; //blender-style bitmask layers
    this.layers = {}; //stack layers this element belongs to
  }
  
  has_layer() {
    for (var k in this.layers) {
      return true;
    }

    return false;
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
  
  in_layer(layer) : boolean {
    return layer != undefined && layer.id in this.layers;
  }
  
  get aabb() {
    console.trace("Implement Me!");
  }
  
  sethide(state : boolean) {
    if (state)
      this.flag |= SplineFlags.HIDE;
    else
      this.flag &= ~SplineFlags.HIDE;
  }
  
  set hidden(state : boolean) {
    if (state)
      this.flag |= SplineFlags.HIDE;
    else
      this.flag &= ~SplineFlags.HIDE;
  }
  
  get hidden() : boolean {
    return !!(this.flag & SplineFlags.HIDE);
  }

  valueOf() : number {
    return this.eid;
  }

  [Symbol.keystr]() : string {
    return ""+this.eid;
  }
  
  post_solve() {
    for (var i=0; i<this.cdata.length; i++) {
      this.cdata[i].post_solve(this);
    }
  }
  
  loadSTRUCT(reader : function) {
    reader(this);
  }

  static nodedef() {return {
    name : "SplineElement",
    uiName : "SplineElement",
    outputs : {
      depend    : undefined,
      on_select : 0.0,
      eid       : 0.0
    }
  }}
}

SplineElement.STRUCT = `
SplineElement {
  eid        : int;
  flag       : int;
  type       : int;
  cdata      : CustomDataSet;
}
`;

var derivative_cache_vs = cachering.fromConstructor(Vector3, 64);
var closest_point_ret_cache_vs = cachering.fromConstructor(Vector3, 256);
var closest_point_ret_cache = new cachering(function() {
  return [0, 0];
}, 256);

var closest_point_cache_vs = cachering.fromConstructor(Vector3, 64);

//forward declaration
var flip_wrapper_cache;

//prior is a CurveEffect instance
export class CurveEffect {
  constructor() {
    this.child = undefined;
    this.prior = undefined;
  }
  
  //rescale parameter-space interval 'width' from ceff to have same roughly the same size
  rescale(ceff, width) {
    if (this.prior != undefined)
      return this.prior.rescale(ceff, width);
    
    return width;
  }
  
  get reversed() {
    return flip_wrapper_cache.next().bind(this);
  }
  
  set_parent(p) {
    this.prior = p;
    p.child = this;
  }
  
  //previous segment's effect renderer, if one exists
  //flip_out is private parameter
  
  _get_nextprev(donext, _flip_out) {
    //find how deep we are in chain
    var i = 0, p = this;
    static flip_out = [0];
    
    while (p.prior != undefined) {
      p = p.prior;
      i++;
    }
    
    //get next segment from root parent
    //console.log("p", p);
    
    p = p._get_nextprev(donext, flip_out);
    var flip = flip_out[0];
      
    //console.log("p", p, i);
    
    if (p == undefined) {
      return undefined;
    }
    
    //descend to same level in other segment
    while (i > 0) {
      p = p.child;
      i--;
    }
    
    if (p == undefined) {
      console.log("EVIL! no MultiResEffector!", this);
      return undefined;
    }
    
    if (flip)
      p = p.reversed;
    
    return p;
  }
  
  /*
    Get next or previous segment.  Returned CurveEffect will
    be at the same depth in the chain (hopefully two segments
    will never have chains of different depth).
    
    Note that the returned CurveEffect is guaranted to have 
    s behave as if the segments go seg1.v1->seg1.v2->seg2.v1->seg2.v2.
    
    in other words, the parameterization always runs in the same direction.
    we do this with a special spline_types.EffectWrapper.
    
    WARNING: try to avoid overriding these in child classes.
  */
  get next() {
    return this._get_nextprev(1);
  }
  
  get prev() {
    return this._get_nextprev(0);
  }
  
  evaluate(s) {
    if (this.prior != undefined) {
      return this.prior.evaluate(s);
    }
  }
  
  derivative(s) {
    var df = 0.001;
    var a, b;
    
    if (s < 0.5) {
      a = this.evaluate(s);
      b = this.evaluate(s+df);
    } else {
      a = this.evaluate(s-df);
      b = this.evaluate(s);
    }
    
    b.sub(a).mulScalar(1.0/df);
    return b;
  }
  
  derivative2(s, funcs) {
    var df = 0.001;
    var a, b;
    
    if (s < 0.5) {
      a = this.derivative(s);
      b = this.derivative(s+df);
    } else {
      a = this.derivative(s-df);
      b = this.derivative(s);
    }
    
    b.sub(a).mulScalar(1.0/df);
    return b;
  }
  
  curvature(s, prior) {
    var dv1 = this.derivative(s);
    var dv2 = this.derivative(s);
    
    return (dv2[0]*dv1[1] - dv2[1]*dv1[0]) / Math.pow(dv1[0]*dv1[0] + dv1[1]*dv1[1], 3.0/2.0);
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
        
        var co = this.evaluate(mid);
        var sco = this.evaluate(start);
        var eco = this.evaluate(end);
        
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
      var co = this.evaluate(mid);
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
      var v1 = this.evaluate(0), v2 = this.evaluate(1);
      
      var dis1 = v1.vectorDistance(p), dis2 = v2.vectorDistance(p);
      
      minret = closest_point_ret_cache.next();
      minret[0] = closest_point_cache_vs.next().load(dis1 < dis2 ? v1 : v2);
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
  
  global_to_local(p, no_effects=false, fixed_s=undefined) {
    static ret_cache = cachering.fromConstructor(Vector3, 64);
    
    static arr = [0, 0];
    var co;
    
    if (fixed_s != undefined) {
      arr[0] = this.evaluate(fixed_s);
      arr[1] = fixed_s;
      
      co = arr;
    } else {
      co = this.closest_point(p);
    }
    
    static _co = new Vector3();
    static _vec = new Vector3();
    
    var s, t, a=0.0;
    
    if (co == undefined) {
      co = _co;
      if (p.vectorDistance(this.v1) < p.vectorDistance(this.v2)) {
        co.load(this.v1);
        s = 0;
        t = p.vectorDistance(this.v1);
      } else {
        co.load(this.v2);
        s = 1.0;
        t = p.vectorDistance(this.v2);
      }
    } else {
      s = co[1];
      co = co[0];
      
      t = p.vectorDistance(co)*0.15;
    }
    
    var n1 = this.normal(s).normalize();
    var n2 = _vec.zero().load(p).sub(co).normalize();
    n1[2] = n2[2] = 0.0;
    
    a = asin(n1[0]*n2[1] - n1[1]*n2[0]);
    var dot = n1.dot(n2);
    
    //console.log("dot", dot, "a", a, cos(a));
    
    co.sub(p);
    co[2] = 0.0;
    t = co.vectorLength();
    
    if (dot < 0.0) {
       t = -t;
       a = 2.0*Math.PI - a;
    }
   
    var ret = ret_cache.next();
    
    ret[0] = s;
    ret[1] = t;
    ret[2] = a;
    
    return ret;
  }
  
  local_to_global(p) {
    var s = p[0], t = p[1], a = p[2];
    
    var co = this.evaluate(s);
    var no = this.normal(s).normalize();
    
    no.mulScalar(t);
    no.rot2d(a);
    
    co.add(no);
    return co;
  }
}

export class FlipWrapper extends CurveEffect {
  depth : number;

  constructor() {
    super();
    this.eff = undefined;
    this.depth = 0;
  }
  
  rescale(eff, width) {
    return this.eff.rescale(eff, width);
  }
  
  get reversed() {
    return this.eff;
  }
  
  bind(CurveEffect eff) : FlipWrapper {
    this.eff = eff;
    
    return this;
  }
  
  get next() : CurveEffect {
    return this.eff.next;
  }
  
  get prev() : CurveEffect {
    return this.eff.prev;
  }
  
  push(float s) : float{
    if (this.depth == 0) {
      s = 1.0 - s;
    }
    
    this.depth++;
    
    return s;
  }
  
  pop(Object value) : Object {
    this.depth--;
    
    return value;
  }
  
  evaluate(float s) : Vector3 {
    s = this.push(s);
    return this.pop(this.eff.evaluate(s));
  }
  
  derivative(float s) : Vector3 {
    s = this.push(s);
    return this.pop(this.eff.derivative(s));
  }
  
  normal(float s) : Vector3 {
    s = this.push(s);
    return this.pop(this.eff.normal(s));
  }
  
  curvature(float s) : Vector3 {
    s = this.push(s);
    return this.pop(this.eff.curvature(s));
  }
}

flip_wrapper_cache = cachering.fromConstructor(FlipWrapper, 32);
