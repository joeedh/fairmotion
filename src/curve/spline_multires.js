"use strict";

//XXX this file will be removed in the not-to-distant future

var acos = Math.acos, asin = Math.asin, abs=Math.abs, log=Math.log,
    sqrt=Math.sqrt, pow=Math.pow, PI=Math.PI, floor=Math.floor, min=Math.min,
    max=Math.max, sin=Math.sin, cos=Math.cos, tan=Math.tan, atan=Math.atan,
    atan2=Math.atan2, exp=Math.exp, ceil=Math.ceil;
    
//import {RestrictFlags, Spline} from 'spline';
import {STRUCT} from 'struct';

import {CustomDataLayer, SplineTypes, SplineFlags, CurveEffect} from 'spline_base';

export var MResFlags = {
  SELECT    : 1,
  ACTIVE    : 2,
  REBASE    : 4, //UNUSED calc global coordinates from curve coordinates
  UPDATE    : 8, //UNUSED calc curve coordinates from global coordinates
  HIGHLIGHT : 16,
  HIDE      : 64,
  FRAME_DIRTY : 128
}

/*
  high-level concept: users can add fine detail in a hierarchical fashion.  each level 
  in the hierarchy can have as many points as the user wants.
*/
/*
*sigh*.

in the interest of not suffering crippling performance loss from memory allocation. . .
we have to store the multi-resolution data in flattened typed arrays.  as linked lists.
*/

/*
here's an idea: save typed arrays with struct.  that way they will be versioned.
however, being clever and trying to dynamically bind the structures may not be a good
idea, might interfere with VM optimizer.

XXX or, perhaps not.  that would mean adding the concept of typed array objects to STRUCT.
    not sure I want to do that quite yet.
*/
/*
export function gen_struct(name, members) {
    var ret = name + " {\n"
    
    for (var i=0; i<members.length; i++) {
        ret += "  " + members[i] + " : double;\n";
    }
    ret += "}\n"
    
    return ret;
}

export var MRLayout = [
    "x",   "y",  //cached global space position
    "vx",  "vy", //cached offset vector
    "seg",       //owning segment's eid
    "s",   "t",  //segment space position
    "flag","id"  //flag and id of point
];

//dummy class for STRUCT
class MRData {
    static fromSTRUCT(reader) {
        var ret = {};
        
        reader(ret);
        
        return ret;
    }
}
MRData.STRUCT = gen_struct("MRData", MRLayout);
*/

var _a=0;
export var TX  = 0, TY = 1, 
           TVX = 2, TVY=3, TSEG=4, 
           TS  = 5, TT=6, TA=7,
           TFLAG=8, TID=9, 
           
           //we store the level a point belongs to inside of it,
           //in case we ever have to fix data corruption bugs
           TLEVEL=10, TSUPPORT=11, TBASIS=12, TDEGREE=13, 
           TNEXT=14, TTOT=15;

export var _format = [
  "TX", "TY", "TVX", "TVY", 
  "TSEG", "TS", "TT", "TA", "TFLAG", 
  "TID", "TLEVEL", "TSUPPORT", "TBASIS",
  "TDEGREE", "TNEXT"
];

var IHEAD=0, ITAIL=1, IFREEHEAD=2, ITOTPOINT=3, ITOT=4;

//hrm, apparently doesn't help with chrome performance bug:
//   "dont_put_props_in_prototype"
export class BoundPoint {
    constructor() {
        this.mr = undefined;
        this.i = undefined;
        this.data = undefined;
        
        this.composed_id = -1;
        
        this.offset = {}
        var this2 = this;
        
        Object.defineProperty(this.offset, "0", {
            get : function() {
                return this2.data[this2.i+TVX];
            }, set : function(val) {
                this2.data[this2.i+TVX] = val;
            }
        });
        
        Object.defineProperty(this.offset, "1", {
            get : function() {
                return this2.data[this2.i+TVY];
            }, set : function(val) {
                this2.data[this2.i+TVY] = val;
            }
        });
        
        
    }
    
    recalc_offset(spline) {
      var seg = spline.eidmap[this.seg];
      
      var co = seg._evalwrap.evaluate(this.s);
      
      this.offset[0] = this[0]-co[0];
      this.offset[1] = this[1]-co[1];
      
      static p = new Vector3([0, 0, 0]);
      
      p[0] = this[0];
      p[1] = this[1];
      
      var sta = seg._evalwrap.global_to_local(p, undefined, this.s);
      
      //this.s = sta[0];
      this.t = sta[1];
      this.a = sta[2];
    }
    
    toString() {
        var next = this.data != undefined ? this.data[this.i+TNEXT] : "(error)";
        
        return "{\n" + 
                   "\"0\"   : " + this[0] + ",\n" +
                   "\"1\"   : " + this[1] + ",\n" +
                   ".offset : ["+ this.offset[0] + ", " + this.offset[1] + "],\n" +
                   "id      : " + this.id + ",\n" +
                   "seg     : " + this.seg + ",\n" +
                   "t       : " + this.t + ",\n" +
                   "s       : " + this.s + ",\n" +
                   "flag    : " + this.flag + ",\n" +
                   "next    : " + next + "\n" +
              "}\n";
    }
    bind(mr, i) {
        this.mr = mr;
        this.i = i;
        this.data = mr.data;
        
        this.composed_id = compose_id(this.seg, this.id);
        
        return this;
    }
    
    get 0() {
        return this.data[this.i+TX];
    }
    set 0(val) {
        this.data[this.i+TX] = val;
    }
    get 1() {
        return this.data[this.i+TY];
    }
    set 1(val) {
        this.data[this.i+TY] = val;
    }
    
    get support() {
        return this.data[this.i+TSUPPORT];
    }
    set support(val) {
        this.data[this.i+TSUPPORT] = val;
    }
    
    get degree() {
        return this.data[this.i+TDEGREE];
    }
    set degree(val) {
        this.data[this.i+TDEGREE] = val;
    }
    
    get basis() {
        return this.data[this.i+TBASIS];
    }
    set basis(val) {
        this.data[this.i+TBASIS] = val;
    }

    get seg() {
        return this.data[this.i+TSEG];
    }
    set seg(val) {
        this.data[this.i+TSEG] = val;
    }
    
    get level() {
        return this.data[this.i+TLEVEL];
    }
    set level(val) {
        this.data[this.i+TLEVEL] = val;
    }

    get s() {
        return this.data[this.i+TS];
    }
    set s(val) {
        this.data[this.i+TS] = val;
    }

    get t() {
        return this.data[this.i+TT];
    }
    set t(val) {
        this.data[this.i+TT] = val;
    }

    get a() {
        return this.data[this.i+TA];
    }
    set a(val) {
        this.data[this.i+TA] = val;
    }
    
    get flag() {
        return this.data[this.i+TFLAG];
    }
    set flag(val) {
        this.data[this.i+TFLAG] = val;
    }
    
    get id() {
        return this.data[this.i+TID];
    }
    set id(val) {
        this.data[this.i+TID] = val;
    }
    
    get next() {
        return this.data[this.i+TNEXT];
    }
}

var pointiter_ret_cache = cachering.fromConstructor(BoundPoint, 12);
var add_point_cache = cachering.fromConstructor(BoundPoint, 12);
var get_point_cache = cachering.fromConstructor(BoundPoint, 12);

class point_iter {
    constructor() {
        this.ret = {done : true, value : undefined};
    }
    
    [Symbol.iterator]() {
        return this;
    }
    
    cache_init(mr, level) {
        this.mr = mr;
        this.level = level;
        this.data = mr.data;
        
        this.cur = mr.index[level*ITOT+IHEAD];
        
        this.ret.done = false;
        this.ret.value = undefined;
        
        return this;
    }
    
    next() {
        if (this.cur == -1) {
            this.ret.done = true;
            this.ret.value = undefined;
            this.mr = undefined;
            
            return this.ret;
        }
        
        var d = this.data;
        var cur = this.cur;
        
        var p = pointiter_ret_cache.next();
        p.bind(this.mr, this.cur);
        
        this.cur = d[cur+TNEXT];
        
        if (this.cur == cur) {
          console.log("EEK! bad data in mres iterator!", this, this.mr, this.cur, cur, "level:", this.level);
          this.cur = -1;
        }
        
        this.ret.value = p;
        return this.ret;
    }
}

import {
        binomial_table, bernstein_offsets
       } from 'binomial_table';

function binomial(n, k) {
  if (binomial_table.length > n) {
    return binomial_table[n][k];
  }
  
  if (k == 0.0 || k == n) {
    return 1;
  }
  
  return binomial(n-1, k-1) + binomial(n-1, k);
}

function bernstein(degree, s) {
  degree = Math.max(Math.floor(degree), 0.0);
  
  var half = Math.floor(degree/2);
  return binomial(degree, half)*pow(s, half)*pow(1.0-s, degree-half);
}

function bernstein2(degree, s) {
  var a = floor(degree + 1);
  var b = ceil(degree + 1);
  
  if (isNaN(a) || a <= 0) {
    return 0.0; //eek!
  }
  
  var start=0.0, mid=0.5, end=1.0;
  if (a >= 0 && a < bernstein_offsets.length) {
    start = bernstein_offsets[a][0];
    mid = bernstein_offsets[a][1];
    end = bernstein_offsets[a][2];
  }
  
  var off = 0.5 - mid;

  if (1||a < 4) {
    var t = 1.0-abs(s-0.5)*2.0;
    s -= off*t;
  } else { 
    s *= 2.0;
    s = start*(1.0-s) + mid*s;
  }
    
  var height = bernstein(a, mid, 0, a, Math.floor(a/2));
  
  return bernstein(a, s)/height;
}

function crappybasis(s, k, support, degree) {
  if (s < k-support || s >= k+support) 
    return 0.0;
  
  var start = k-support, end = k+support;
  var t = (s-start) / (end-start);
  
  var degree2 = degree-2.0;
  var sign = degree2 < 0.0 ? -1.0 : 1.0;
  degree2 = pow(degree2, 0.25)*sign + 2.0;
  
  //t = 1.0 - abs(t-0.5)*2.0;
  //t = 6*(8.0/3.0)*pow(t-1.0, 2.0)*t*t;
  t = bernstein2(degree, t);
  if (isNaN(t))
    t = 0.0;
  
  //t = 1.0 - pow(abs(1.0 - t), Math.max(degree2*0.4, 1.0));
  
  //t = t*t*(3.0 - 2*t);
 // return t;
  
  //t = t*t*(3.0 - 2*t);
  //t = 1.0 - pow(1.0-t, 2.0);
  //t = pow(t, degree);
  
  //t = t*0.5 + pow(t, degree-1.0)*0.5;
  
  /*
  if (k-support < 0.0) {
    t *= s/support;
  } else if (k+support > 1.0) {
    t *= (1.0-s)/support;
  }*/
  
  return t;
}

export class MultiResEffector extends CurveEffect {
  constructor(MultiResLayer owner) {
    super()
    this.mr = owner;
  }
  
  evaluate(s) {
    var n = this.prior.derivative(s);
    var t = n[0]; n[0] = n[1]; n[1] = t;
    n.normalize();
    n.mulScalar(10.0);
    
    var co = this.prior.evaluate(s);
    static sum = new Vector3();
    sum.zero();
    
    static ks = new Array(2000);
    var i = 0;
    
    for (var p in this.mr.points(0)) {
      ks[i] = p.s;
      i++;
    }
    
    for (var p in this.mr.points(0)) {
      var w = crappybasis(s, p.s, p.support, p.degree);
      if (isNaN(w)) continue;
      
      sum[0] += p.offset[0]*w;
      sum[1] += p.offset[1]*w;
    }
    
    for (var i=0; i<2; i++) {
      var next = i ? this.next : this.prev;
      var soff = i ? -1.0      : 1.0;
      var sign = i ? -1.0 : 1.0;
      
      if (next != undefined) {
        var mr = !(next instanceof MultiResEffector) ? next.eff.mr : next.mr;
        
        for (var p in mr.points(0)) {
          if ((!i && p.s-support >= 0) || (i && p.s+support <= 1.0))
            continue;
          
          var support = p.support;
          var ps = p.s;
          
          var s2;
          if (!i) { //prev
            s2 = next.rescale(this, s)+1.0;
          } else { //next
            s2 = -next.rescale(this, 1.0-s);
          }
          
          //support = next.rescale(this, support);
          var w = crappybasis(s2, ps, support, p.degree);
          
          sum[0] += p.offset[0]*w;
          sum[1] += p.offset[1]*w;
        }
      }
    }
    co.add(sum);
    
    return co;
  }
}

export class MultiResGlobal {
  constructor() {
    this.active = undefined; //(combined) active id
  }
  
  static fromSTRUCT(reader) {
    var ret = new MultiResGlobal();
    reader(ret);
    return ret;
  }
}
MultiResGlobal.STRUCT = """
  MultiResGlobal {
    active : double | obj.active == undefined ? -1 : obj.active;
  }
"""

export class MultiResLayer extends CustomDataLayer {
  constructor(size=16) {
      super(this);
      
      this._effector = new MultiResEffector(this);
      this.max_layers = 8;
      this.data = new Float64Array(size*TTOT);
      this.index = new Array(this.max_layers*ITOT);
      
      this.totpoint = 0;
      
      this._size = size;
      this._freecur = 0;
      
      //linked list entries. . .
      for (var i=0; i<this.max_layers; i++) {
          this.index[i*ITOT+IHEAD] = -1; //linked list head
          this.index[i*ITOT+ITAIL] = -1; //linked list tail
          this.index[i*ITOT+IFREEHEAD] =  0; //total points in multires level
      }
      
      this.points_iter_cache = cachering.fromConstructor(point_iter, 8);
  }
  
  _convert(formata, formatb) {
    var totp = this.data.length / formata.length;
    
    var data = new Float64Array(totp*formatb.length);
    var odata = this.data;
    var ttota = formata.length, ttotb=formatb.length;
    
    console.log("FORMATA", formata, "\n");
    console.log("FORMATB", formatb, "\n");
    
    var fa = [], fb = [];
    var fmap = {};
    
    for (var i=0; i<formata.length; i++) {
      for (var j=0; j<formatb.length; j++) {
        if (formata[i] == formatb[j]) {
          fmap[i] = j;
        }
      }
    }
    
    console.log("FMAP", fmap, "\n");
    
    for (var i=0; i<totp; i++) {
      for (var j=0; j<formata.length; j++) {
        var src = odata[i*ttota+j];
        
        if ((formata[j] == "TNEXT" || formata[j] == "TID") && src != -1) {
          //console.log(j, fmap[j], " - ", src, src/ttota, (src/ttota)*ttotb);
          src = Math.floor((src/ttota)*ttotb);
        }
        
        data[i*ttotb+fmap[j]] = src;
      }
    }
    
    //var IHEAD=0, ITAIL=1, IFREEHEAD=2, ITOTPOINT=3, ITOT=4;

    //patch index table
    for (var i=0; i<this.max_layers; i++) {
      if (this.index[i*ITOT+IHEAD] != -1)
        this.index[i*ITOT+IHEAD] = Math.floor((this.index[i*ITOT+IHEAD]/ttota)*ttotb);
        
      if (this.index[i*ITOT+ITAIL] != -1)
        this.index[i*ITOT+ITAIL] = Math.floor((this.index[i*ITOT+ITAIL]/ttota)*ttotb);
        
      if (this.index[i*ITOT+IFREEHEAD] != -1)
        this.index[i*ITOT+IFREEHEAD] = Math.floor((this.index[i*ITOT+IFREEHEAD]/ttota)*ttotb);
    }
    
    this.data = data;
    //this.fix_points();
  }
  
  fix_points(seg=undefined) {
    var index = this.index;
    
    for (var i=0; i<this.index.length; i += ITOT) {
      index[i] = index[i+1] = -1;
      index[i+2] = index[i+3] = 0;
    }
    
    var data = this.data;
    for (var i=0; i<data.length; i += TTOT) {
      if (data[i] == 0 && data[i+1] == 0 && data[i+2] == 0 && data[TNEXT] == 0)
        continue;
      
      this._freecur = i+TTOT;
      
      var lvl = data[i+TLEVEL];
      if (index[lvl*ITOT+IHEAD] == -1) {
        index[lvl*ITOT+IHEAD] = index[lvl*ITOT+ITAIL] = i;
        data[i+TNEXT] = -1;
      } else {
        var i2 = index[lvl*ITOT+ITAIL];
        
        data[i2+TNEXT] = i;
        data[i+TNEXT] = -1;
        index[lvl*ITOT+ITAIL] = i;
      }
      
      index[lvl*ITOT+ITOTPOINT]++;
    }
    
    if (seg == undefined)
      return;
      
    for (var i=0; i<this.max_layers; i++) {
      for (var p in this.points(i)) {
        p.seg = seg.eid;
      }
    }
  }
  
  points(int level) {
      return this.points_iter_cache.next().cache_init(this, level);
  }
  
  add_point(int level, Array<float> co=_co) : BoundPoint {
      static _co = [0, 0];
      
      //enforce boundary alignment
      this._freecur += TTOT - (this._freecur % TTOT);
      
      var i = this._freecur;
      
      if (this._freecur+TTOT >= this._size) {
          this.resize(this._freecur+3); //resize will double requested size, for amortization
      }
      
      var j = 0;
      this.data[i+TX] = co[0];
      this.data[i+TY] = co[1];
      this.data[i+TLEVEL] = level;
      this.data[i+TID] = i;
      this.data[i+TNEXT] = -1;
      this.data[i+TSUPPORT] = 0.3;
      this.data[i+TDEGREE] = 2.0;
      
      this._freecur = i + TTOT;
      
      var head = this.index[level*ITOT+IHEAD];
      var tail = this.index[level*ITOT+ITAIL];
      
      if (head == -1 || tail == -1) {
          this.index[level*ITOT+IHEAD] = i;
          this.index[level*ITOT+ITAIL] = i;
      } else {
          this.data[tail+TNEXT] = i;
          this.index[level*ITOT+ITAIL] = i;
      }
      
      this.index[level*ITOT+ITOTPOINT]++;
      this.totpoint++;
      
      return add_point_cache.next().bind(this, i);
  }
  
  get(int id, allocate_object=false) {
      if (allocate_object)
        return new BoundPoint().bind(this, id);
      else
        return get_point_cache.next().bind(this, id);
  }
  
  curve_effect() : MultiResEffector {
    return this._effector;
  }
  
  resize(int newsize) {
      if (newsize < this._size) return;
      newsize *= 2.0;
      
      var array = new Float64Array(newsize);
      var oldsize = this.data.length;
      
      for (var i=0; i<oldsize; i++) {
          array[i] = this.data[i];
      }
      
      this._size = newsize;
      this.data = array;
  }

  segment_split(old_segment, old_v1, old_v2, new_segments) {
  }
  
  recalc_worldcos_level(seg, level) { //seg is owning segment
    static sta = [0, 0, 0];
    
    for (var p in this.points(level)) {
      sta[0] = p.s; sta[1] = p.t; sta[2] = p.a;
      var co = seg._evalwrap.local_to_global(sta);
      var co2 = seg._evalwrap.evaluate(sta[0]);
      
      p[0] = co[0];
      p[1] = co[1];
      
      p.offset[0] = co[0] - co2[0];
      p.offset[1] = co[1] - co2[1];
    }
  }
  
  recalc_wordscos(seg) { //seg is owning segment
    for (var i=0; i<this.max_layers; i++) {
      this.recalc_worldcos_level(seg, i);
    }
  }
  
  post_solve(owner_segment) {
    //console.log("UPDATE!");
    this.recalc_wordscos(owner_segment);
  }
  
  interp(srcs, ws) {
    this.time = 0.0;
    
    for (var i=0; i<srcs.length; i++) {
      
    }
  }
  
  static fromSTRUCT(reader) {
    var ret = STRUCT.chain_fromSTRUCT(MultiResLayer, reader);
    
    //if (isNaN(ret.max_layers))
      ret.max_layers = 8;
    
    return ret;
  }
}

MultiResLayer.STRUCT = STRUCT.inherit(MultiResLayer, CustomDataLayer) + """
    data            : array(double);
    index           : array(double);
    max_layers      : int;
    totpoint        : int;
    _freecur        : int;
    _size           : int;
  }
""";
MultiResLayer.layerinfo = {
  type_name : "MultiResLayer",
  has_curve_effect : true,
  shared_class  : MultiResGlobal
};

export function test_fix_points() { 
  var spline = new Context().spline;
  
  for (var seg in spline.segments) {
    var mr = seg.cdata.get_layer(MultiResLayer);
    
    mr.fix_points(seg);
  }
}

export function test_multires(n) {
    var mr = new MultiResLayer();
    
    var adds = [0.5, -0.25, -1, 1, 1, -2, 4, 9, 11.3, 3, 4, 0.245345, 1.0234, 8, 7, 4, 6];
    var iadd = 0.0;
    
    for (var i=0; i<5; i++, iadd += 0.2*(i+1)) {
        var add = iadd;
        var p = mr.add_point(0, [-4, -3]);

        var c = 0;
        p.id = adds[c++]+add++;
        p.offset[0] = adds[c++]+add++;
        p.offset[1] = adds[c++]+add++;
        p.flag = adds[c++]+add++;
        p.seg = adds[c++]+add++;
        p.t = adds[c++]+add++;
        p.s = adds[c++]+add++;
        p[0] = adds[c++]+add++;
        p[1] = adds[c++]+add++;

        add = iadd;
        c = 0;
        console.log(p.id==adds[c++]+add++, adds[c-1]+add-1, p.id, "id");

        console.log(p.offset[0]==adds[c++]+add++, adds[c-1]+add-1, p.offset[0], "offset[0]");
        console.log(p.offset[1]==adds[c++]+add++, adds[c-1]+add-1, p.offset[1], "offset[1]");

        console.log(p.flag==adds[c++]+add++, adds[c-1]+add-1, p.flag, "flag");
        console.log(p.seg==adds[c++]+add++, adds[c-1]+add-1, p.seg, "seg");

        console.log(p.t==adds[c++]+add++, adds[c-1]+add-1, p.t, "t");
        console.log(p.s==adds[c++]+add++, adds[c-1]+add-1, p.s, "s");

        console.log(p[0]==adds[c++]+add++, adds[c-1]+add-1, p[0], "[0]");
        console.log(p[1]==adds[c++]+add++, adds[c-1]+add-1, p[1], "[1]");
    }
    
    var _c = 0;
    for (var p of mr.points(0)) {
        console.log(""+p);
        if (_c++ > 1000) {
            console.trace("Infinite loop!");
            break;
        }
    }
    
    return mr;
}

export function compose_id(eid, index) {
  //need to avoid JS's implicit conversion to ints here
  //to get advantage of large capacity of doubles
  var mul = (1<<24);
  
  return index + eid*mul;
}

export function decompose_id(id) {
  static ret = [0, 0];
  
  var mul = (1<<24);
  //gah can't use bit operators here
  var eid = Math.floor(id/mul);
  
  id -= eid*mul;
  
  ret[0] = eid;
  ret[1] = id;
  
  return ret;
}

var _test_id_start = 0;

export function test_ids(steps=1, start=_test_id_start) {
  var max_mres=5000000;
  var max_seg = 500000;
  
  console.log("starting at", start);
  
  for (var i=start; i<start+steps; i++) {
    for (var j=0; j<max_seg; j++) {
      var id = compose_id(i, j);
      var ret = decompose_id(id);
      
      if (i != ret[0] || j != ret[1]) {
        console.log("Found bad combination!!", ret[0], ret[1], "||", i, j);
      }
    }
  }
  
  console.log("finished");
  _test_id_start = i;
}

export function has_multires(spline) {
  return spline.segments.cdata.num_layers("MultiResLayer") > 0;
}

export function ensure_multires(spline) {
  if (spline.segments.cdata.num_layers("MultiResLayer") == 0) {
    spline.segments.cdata.add_layer(MultiResLayer);
  }
}

var empty_iter = {
  _ret : {done : true, value : undefined},
  
  next : function() {
    this._ret.done = true;
    this._ret.value = undefined;
    
    return this._ret;
  }
};
empty_iter[Symbol.iterator] = function() {
  return this;
};

class GlobalIter {
  constructor(spline, level, return_keys=false) {
    this.spline = spline;
    this.level = level;
    this.return_keys = return_keys;
    
    this.seg = undefined;
    this.segiter = spline.segments[Symbol.iterator]();
    this.pointiter = undefined;
    
    this.ret = {done : false, value : undefined};
  }
  
  next() {
    if (this.pointiter == undefined) {
      this.seg = this.segiter.next();
      
      if (this.seg.done == true) {
        this.ret.done = true;
        this.ret.value = undefined;
        
        return this.ret;
      }
      
      this.seg = this.seg.value;
      
      var mr = this.seg.cdata.get_layer(MultiResLayer);
      this.pointiter = mr.points(this.level);
    }
    
    var p = this.pointiter.next();
    if (p.done) {
      this.pointiter = undefined;
      return this.next();
    }
    
    p = p.value;
    this.ret.value = this.return_keys ? compose_id(p.seg, p.id) : p;
    
    return this.ret;
  }
  
  [Symbol.iterator]() { 
    return this;
  }
}

//hrm, level=-1 should iterate all points?
export function iterpoints(spline, level, return_keys=false) {
  if (spline.segments.cdata.num_layers("MultiResLayer") == 0)
    return empty_iter;
    
  return new GlobalIter(spline, level, return_keys);
}

iterpoints.selected = function(spline, level) {
}
