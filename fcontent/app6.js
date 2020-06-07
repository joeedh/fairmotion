es6_module_define('spline_multires', ["../util/binomial_table.js", "../core/struct.js", "./spline_base.js"], function _spline_multires_module(_es6_module) {
  "use strict";
  var acos=Math.acos, asin=Math.asin, abs=Math.abs, log=Math.log, sqrt=Math.sqrt, pow=Math.pow, PI=Math.PI, floor=Math.floor, min=Math.min, max=Math.max, sin=Math.sin, cos=Math.cos, tan=Math.tan, atan=Math.atan, atan2=Math.atan2, exp=Math.exp, ceil=Math.ceil;
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var CustomDataLayer=es6_import_item(_es6_module, './spline_base.js', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, './spline_base.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, './spline_base.js', 'SplineFlags');
  var CurveEffect=es6_import_item(_es6_module, './spline_base.js', 'CurveEffect');
  var MResFlags={SELECT: 1, 
   ACTIVE: 2, 
   REBASE: 4, 
   UPDATE: 8, 
   HIGHLIGHT: 16, 
   HIDE: 64, 
   FRAME_DIRTY: 128}
  MResFlags = _es6_module.add_export('MResFlags', MResFlags);
  var _a=0;
  var TX=0;
  TX = _es6_module.add_export('TX', TX);
  var TY=1;
  TY = _es6_module.add_export('TY', TY);
  var TVX=2;
  TVX = _es6_module.add_export('TVX', TVX);
  var TVY=3;
  TVY = _es6_module.add_export('TVY', TVY);
  var TSEG=4;
  TSEG = _es6_module.add_export('TSEG', TSEG);
  var TS=5;
  TS = _es6_module.add_export('TS', TS);
  var TT=6;
  TT = _es6_module.add_export('TT', TT);
  var TA=7;
  TA = _es6_module.add_export('TA', TA);
  var TFLAG=8;
  TFLAG = _es6_module.add_export('TFLAG', TFLAG);
  var TID=9;
  TID = _es6_module.add_export('TID', TID);
  var TLEVEL=10;
  TLEVEL = _es6_module.add_export('TLEVEL', TLEVEL);
  var TSUPPORT=11;
  TSUPPORT = _es6_module.add_export('TSUPPORT', TSUPPORT);
  var TBASIS=12;
  TBASIS = _es6_module.add_export('TBASIS', TBASIS);
  var TDEGREE=13;
  TDEGREE = _es6_module.add_export('TDEGREE', TDEGREE);
  var TNEXT=14;
  TNEXT = _es6_module.add_export('TNEXT', TNEXT);
  var TTOT=15;
  TTOT = _es6_module.add_export('TTOT', TTOT);
  var _format=["TX", "TY", "TVX", "TVY", "TSEG", "TS", "TT", "TA", "TFLAG", "TID", "TLEVEL", "TSUPPORT", "TBASIS", "TDEGREE", "TNEXT"];
  _format = _es6_module.add_export('_format', _format);
  var IHEAD=0, ITAIL=1, IFREEHEAD=2, ITOTPOINT=3, ITOT=4;
  var $p__Hdq_recalc_offset;
  class BoundPoint  {
    
     constructor() {
      this.mr = undefined;
      this.i = undefined;
      this.data = undefined;
      this.composed_id = -1;
      this.offset = {};
      var this2=this;
      Object.defineProperty(this.offset, "0", {get: function () {
          return this2.data[this2.i+TVX];
        }, 
     set: function (val) {
          this2.data[this2.i+TVX] = val;
        }});
      Object.defineProperty(this.offset, "1", {get: function () {
          return this2.data[this2.i+TVY];
        }, 
     set: function (val) {
          this2.data[this2.i+TVY] = val;
        }});
    }
     recalc_offset(spline) {
      var seg=spline.eidmap[this.seg];
      var co=seg._evalwrap.evaluate(this.s);
      this.offset[0] = this[0]-co[0];
      this.offset[1] = this[1]-co[1];
      $p__Hdq_recalc_offset[0] = this[0];
      $p__Hdq_recalc_offset[1] = this[1];
      var sta=seg._evalwrap.global_to_local($p__Hdq_recalc_offset, undefined, this.s);
      this.t = sta[1];
      this.a = sta[2];
    }
     toString() {
      var next=this.data!=undefined ? this.data[this.i+TNEXT] : "(error)";
      return "{\n"+"\"0\"   : "+this[0]+",\n"+"\"1\"   : "+this[1]+",\n"+".offset : ["+this.offset[0]+", "+this.offset[1]+"],\n"+"id      : "+this.id+",\n"+"seg     : "+this.seg+",\n"+"t       : "+this.t+",\n"+"s       : "+this.s+",\n"+"flag    : "+this.flag+",\n"+"next    : "+next+"\n"+"}\n";
    }
     bind(mr, i) {
      this.mr = mr;
      this.i = i;
      this.data = mr.data;
      this.composed_id = compose_id(this.seg, this.id);
      return this;
    }
    get  0() {
      return this.data[this.i+TX];
    }
    set  0(val) {
      this.data[this.i+TX] = val;
    }
    get  1() {
      return this.data[this.i+TY];
    }
    set  1(val) {
      this.data[this.i+TY] = val;
    }
    get  support() {
      return this.data[this.i+TSUPPORT];
    }
    set  support(val) {
      this.data[this.i+TSUPPORT] = val;
    }
    get  degree() {
      return this.data[this.i+TDEGREE];
    }
    set  degree(val) {
      this.data[this.i+TDEGREE] = val;
    }
    get  basis() {
      return this.data[this.i+TBASIS];
    }
    set  basis(val) {
      this.data[this.i+TBASIS] = val;
    }
    get  seg() {
      return this.data[this.i+TSEG];
    }
    set  seg(val) {
      this.data[this.i+TSEG] = val;
    }
    get  level() {
      return this.data[this.i+TLEVEL];
    }
    set  level(val) {
      this.data[this.i+TLEVEL] = val;
    }
    get  s() {
      return this.data[this.i+TS];
    }
    set  s(val) {
      this.data[this.i+TS] = val;
    }
    get  t() {
      return this.data[this.i+TT];
    }
    set  t(val) {
      this.data[this.i+TT] = val;
    }
    get  a() {
      return this.data[this.i+TA];
    }
    set  a(val) {
      this.data[this.i+TA] = val;
    }
    get  flag() {
      return this.data[this.i+TFLAG];
    }
    set  flag(val) {
      this.data[this.i+TFLAG] = val;
    }
    get  id() {
      return this.data[this.i+TID];
    }
    set  id(val) {
      this.data[this.i+TID] = val;
    }
    get  next() {
      return this.data[this.i+TNEXT];
    }
  }
  var $p__Hdq_recalc_offset=new Vector3([0, 0, 0]);
  _ESClass.register(BoundPoint);
  _es6_module.add_class(BoundPoint);
  BoundPoint = _es6_module.add_export('BoundPoint', BoundPoint);
  var pointiter_ret_cache=cachering.fromConstructor(BoundPoint, 12);
  var add_point_cache=cachering.fromConstructor(BoundPoint, 12);
  var get_point_cache=cachering.fromConstructor(BoundPoint, 12);
  class point_iter  {
    
     constructor() {
      this.ret = {done: true, 
     value: undefined};
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
      if (this.cur==-1) {
          this.ret.done = true;
          this.ret.value = undefined;
          this.mr = undefined;
          return this.ret;
      }
      var d=this.data;
      var cur=this.cur;
      var p=pointiter_ret_cache.next();
      p.bind(this.mr, this.cur);
      this.cur = d[cur+TNEXT];
      if (this.cur==cur) {
          console.log("EEK! bad data in mres iterator!", this, this.mr, this.cur, cur, "level:", this.level);
          this.cur = -1;
      }
      this.ret.value = p;
      return this.ret;
    }
  }
  _ESClass.register(point_iter);
  _es6_module.add_class(point_iter);
  var binomial_table=es6_import_item(_es6_module, '../util/binomial_table.js', 'binomial_table');
  var bernstein_offsets=es6_import_item(_es6_module, '../util/binomial_table.js', 'bernstein_offsets');
  function binomial(n, k) {
    if (binomial_table.length>n) {
        return binomial_table[n][k];
    }
    if (k==0.0||k==n) {
        return 1;
    }
    return binomial(n-1, k-1)+binomial(n-1, k);
  }
  function bernstein(degree, s) {
    degree = Math.max(Math.floor(degree), 0.0);
    var half=Math.floor(degree/2);
    return binomial(degree, half)*pow(s, half)*pow(1.0-s, degree-half);
  }
  function bernstein2(degree, s) {
    var a=floor(degree+1);
    var b=ceil(degree+1);
    if (isNaN(a)||a<=0) {
        return 0.0;
    }
    var start=0.0, mid=0.5, end=1.0;
    if (a>=0&&a<bernstein_offsets.length) {
        start = bernstein_offsets[a][0];
        mid = bernstein_offsets[a][1];
        end = bernstein_offsets[a][2];
    }
    var off=0.5-mid;
    if (1||a<4) {
        var t=1.0-abs(s-0.5)*2.0;
        s-=off*t;
    }
    else {
      s*=2.0;
      s = start*(1.0-s)+mid*s;
    }
    var height=bernstein(a, mid, 0, a, Math.floor(a/2));
    return bernstein(a, s)/height;
  }
  function crappybasis(s, k, support, degree) {
    if (s<k-support||s>=k+support)
      return 0.0;
    var start=k-support, end=k+support;
    var t=(s-start)/(end-start);
    var degree2=degree-2.0;
    var sign=degree2<0.0 ? -1.0 : 1.0;
    degree2 = pow(degree2, 0.25)*sign+2.0;
    t = bernstein2(degree, t);
    if (isNaN(t))
      t = 0.0;
    return t;
  }
  var $sum_Up2J_evaluate;
  var $ks_HtA1_evaluate;
  class MultiResEffector extends CurveEffect {
     constructor(owner) {
      super();
      this.mr = owner;
    }
     evaluate(s) {
      var n=this.prior.derivative(s);
      var t=n[0];
      n[0] = n[1];
      n[1] = t;
      n.normalize();
      n.mulScalar(10.0);
      var co=this.prior.evaluate(s);
      $sum_Up2J_evaluate.zero();
      var i=0;
      for (var p in this.mr.points(0)) {
          $ks_HtA1_evaluate[i] = p.s;
          i++;
      }
      for (var p in this.mr.points(0)) {
          var w=crappybasis(s, p.s, p.support, p.degree);
          if (isNaN(w))
            continue;
          $sum_Up2J_evaluate[0]+=p.offset[0]*w;
          $sum_Up2J_evaluate[1]+=p.offset[1]*w;
      }
      for (var i=0; i<2; i++) {
          var next=i ? this.next : this.prev;
          var soff=i ? -1.0 : 1.0;
          var sign=i ? -1.0 : 1.0;
          if (next!=undefined) {
              var mr=!(__instance_of(next, MultiResEffector)) ? next.eff.mr : next.mr;
              for (var p in mr.points(0)) {
                  if ((!i&&p.s-support>=0)||(i&&p.s+support<=1.0))
                    continue;
                  var support=p.support;
                  var ps=p.s;
                  var s2;
                  if (!i) {
                      s2 = next.rescale(this, s)+1.0;
                  }
                  else {
                    s2 = -next.rescale(this, 1.0-s);
                  }
                  var w=crappybasis(s2, ps, support, p.degree);
                  $sum_Up2J_evaluate[0]+=p.offset[0]*w;
                  $sum_Up2J_evaluate[1]+=p.offset[1]*w;
              }
          }
      }
      co.add($sum_Up2J_evaluate);
      return co;
    }
  }
  var $sum_Up2J_evaluate=new Vector3();
  var $ks_HtA1_evaluate=new Array(2000);
  _ESClass.register(MultiResEffector);
  _es6_module.add_class(MultiResEffector);
  MultiResEffector = _es6_module.add_export('MultiResEffector', MultiResEffector);
  class MultiResGlobal  {
     constructor() {
      this.active = undefined;
    }
    static  fromSTRUCT(reader) {
      var ret=new MultiResGlobal();
      reader(ret);
      return ret;
    }
  }
  _ESClass.register(MultiResGlobal);
  _es6_module.add_class(MultiResGlobal);
  MultiResGlobal = _es6_module.add_export('MultiResGlobal', MultiResGlobal);
  MultiResGlobal.STRUCT = `
  MultiResGlobal {
    active : double | obj.active == undefined ? -1 : obj.active;
  }
`;
  var $_co_9uUh_add_point;
  var $sta_JGXX_recalc_worldcos_level;
  class MultiResLayer extends CustomDataLayer {
     constructor(size=16) {
      super(this);
      this._effector = new MultiResEffector(this);
      this.max_layers = 8;
      this.data = new Float64Array(size*TTOT);
      this.index = new Array(this.max_layers*ITOT);
      this.totpoint = 0;
      this._size = size;
      this._freecur = 0;
      for (var i=0; i<this.max_layers; i++) {
          this.index[i*ITOT+IHEAD] = -1;
          this.index[i*ITOT+ITAIL] = -1;
          this.index[i*ITOT+IFREEHEAD] = 0;
      }
      this.points_iter_cache = cachering.fromConstructor(point_iter, 8);
    }
     _convert(formata, formatb) {
      var totp=this.data.length/formata.length;
      var data=new Float64Array(totp*formatb.length);
      var odata=this.data;
      var ttota=formata.length, ttotb=formatb.length;
      console.log("FORMATA", formata, "\n");
      console.log("FORMATB", formatb, "\n");
      var fa=[], fb=[];
      var fmap={};
      for (var i=0; i<formata.length; i++) {
          for (var j=0; j<formatb.length; j++) {
              if (formata[i]==formatb[j]) {
                  fmap[i] = j;
              }
          }
      }
      console.log("FMAP", fmap, "\n");
      for (var i=0; i<totp; i++) {
          for (var j=0; j<formata.length; j++) {
              var src=odata[i*ttota+j];
              if ((formata[j]=="TNEXT"||formata[j]=="TID")&&src!=-1) {
                  src = Math.floor((src/ttota)*ttotb);
              }
              data[i*ttotb+fmap[j]] = src;
          }
      }
      for (var i=0; i<this.max_layers; i++) {
          if (this.index[i*ITOT+IHEAD]!=-1)
            this.index[i*ITOT+IHEAD] = Math.floor((this.index[i*ITOT+IHEAD]/ttota)*ttotb);
          if (this.index[i*ITOT+ITAIL]!=-1)
            this.index[i*ITOT+ITAIL] = Math.floor((this.index[i*ITOT+ITAIL]/ttota)*ttotb);
          if (this.index[i*ITOT+IFREEHEAD]!=-1)
            this.index[i*ITOT+IFREEHEAD] = Math.floor((this.index[i*ITOT+IFREEHEAD]/ttota)*ttotb);
      }
      this.data = data;
    }
     fix_points(seg=undefined) {
      var index=this.index;
      for (var i=0; i<this.index.length; i+=ITOT) {
          index[i] = index[i+1] = -1;
          index[i+2] = index[i+3] = 0;
      }
      var data=this.data;
      for (var i=0; i<data.length; i+=TTOT) {
          if (data[i]==0&&data[i+1]==0&&data[i+2]==0&&data[TNEXT]==0)
            continue;
          this._freecur = i+TTOT;
          var lvl=data[i+TLEVEL];
          if (index[lvl*ITOT+IHEAD]==-1) {
              index[lvl*ITOT+IHEAD] = index[lvl*ITOT+ITAIL] = i;
              data[i+TNEXT] = -1;
          }
          else {
            var i2=index[lvl*ITOT+ITAIL];
            data[i2+TNEXT] = i;
            data[i+TNEXT] = -1;
            index[lvl*ITOT+ITAIL] = i;
          }
          index[lvl*ITOT+ITOTPOINT]++;
      }
      if (seg==undefined)
        return ;
      for (var i=0; i<this.max_layers; i++) {
          for (var p in this.points(i)) {
              p.seg = seg.eid;
          }
      }
    }
     points(level) {
      return this.points_iter_cache.next().cache_init(this, level);
    }
     add_point(level, co=$_co_9uUh_add_point) {
      this._freecur+=TTOT-(this._freecur%TTOT);
      var i=this._freecur;
      if (this._freecur+TTOT>=this._size) {
          this.resize(this._freecur+3);
      }
      var j=0;
      this.data[i+TX] = co[0];
      this.data[i+TY] = co[1];
      this.data[i+TLEVEL] = level;
      this.data[i+TID] = i;
      this.data[i+TNEXT] = -1;
      this.data[i+TSUPPORT] = 0.3;
      this.data[i+TDEGREE] = 2.0;
      this._freecur = i+TTOT;
      var head=this.index[level*ITOT+IHEAD];
      var tail=this.index[level*ITOT+ITAIL];
      if (head==-1||tail==-1) {
          this.index[level*ITOT+IHEAD] = i;
          this.index[level*ITOT+ITAIL] = i;
      }
      else {
        this.data[tail+TNEXT] = i;
        this.index[level*ITOT+ITAIL] = i;
      }
      this.index[level*ITOT+ITOTPOINT]++;
      this.totpoint++;
      return add_point_cache.next().bind(this, i);
    }
     get(id, allocate_object=false) {
      if (allocate_object)
        return new BoundPoint().bind(this, id);
      else 
        return get_point_cache.next().bind(this, id);
    }
     curve_effect() {
      return this._effector;
    }
     resize(newsize) {
      if (newsize<this._size)
        return ;
      newsize*=2.0;
      var array=new Float64Array(newsize);
      var oldsize=this.data.length;
      for (var i=0; i<oldsize; i++) {
          array[i] = this.data[i];
      }
      this._size = newsize;
      this.data = array;
    }
     segment_split(old_segment, old_v1, old_v2, new_segments) {

    }
     recalc_worldcos_level(seg, level) {
      for (var p in this.points(level)) {
          $sta_JGXX_recalc_worldcos_level[0] = p.s;
          $sta_JGXX_recalc_worldcos_level[1] = p.t;
          $sta_JGXX_recalc_worldcos_level[2] = p.a;
          var co=seg._evalwrap.local_to_global($sta_JGXX_recalc_worldcos_level);
          var co2=seg._evalwrap.evaluate($sta_JGXX_recalc_worldcos_level[0]);
          p[0] = co[0];
          p[1] = co[1];
          p.offset[0] = co[0]-co2[0];
          p.offset[1] = co[1]-co2[1];
      }
    }
     recalc_wordscos(seg) {
      for (var i=0; i<this.max_layers; i++) {
          this.recalc_worldcos_level(seg, i);
      }
    }
     post_solve(owner_segment) {
      this.recalc_wordscos(owner_segment);
    }
     interp(srcs, ws) {
      this.time = 0.0;
      for (var i=0; i<srcs.length; i++) {

      }
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(this);
      ret.max_layers = 8;
    }
    static  define() {
      return {typeName: "MultiResLayer", 
     hasCurveEffect: true, 
     sharedClass: MultiResGlobal}
    }
  }
  var $_co_9uUh_add_point=[0, 0];
  var $sta_JGXX_recalc_worldcos_level=[0, 0, 0];
  _ESClass.register(MultiResLayer);
  _es6_module.add_class(MultiResLayer);
  MultiResLayer = _es6_module.add_export('MultiResLayer', MultiResLayer);
  MultiResLayer.STRUCT = STRUCT.inherit(MultiResLayer, CustomDataLayer)+`
    data            : array(double);
    index           : array(double);
    max_layers      : int;
    totpoint        : int;
    _freecur        : int;
    _size           : int;
  }
`;
  function test_fix_points() {
    var spline=new Context().spline;
    for (var seg in spline.segments) {
        var mr=seg.cdata.get_layer(MultiResLayer);
        mr.fix_points(seg);
    }
  }
  test_fix_points = _es6_module.add_export('test_fix_points', test_fix_points);
  function test_multires(n) {
    var mr=new MultiResLayer();
    var adds=[0.5, -0.25, -1, 1, 1, -2, 4, 9, 11.3, 3, 4, 0.245345, 1.0234, 8, 7, 4, 6];
    var iadd=0.0;
    for (var i=0; i<5; i++, iadd+=0.2*(i+1)) {
        var add=iadd;
        var p=mr.add_point(0, [-4, -3]);
        var c=0;
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
    var _c=0;
    for (var p of mr.points(0)) {
        console.log(""+p);
        if (_c++>1000) {
            console.trace("Infinite loop!");
            break;
        }
    }
    return mr;
  }
  test_multires = _es6_module.add_export('test_multires', test_multires);
  function compose_id(eid, index) {
    var mul=(1<<24);
    return index+eid*mul;
  }
  compose_id = _es6_module.add_export('compose_id', compose_id);
  var $ret_dNkY_decompose_id=[0, 0];
  function decompose_id(id) {
    var mul=(1<<24);
    var eid=Math.floor(id/mul);
    id-=eid*mul;
    $ret_dNkY_decompose_id[0] = eid;
    $ret_dNkY_decompose_id[1] = id;
    return $ret_dNkY_decompose_id;
  }
  decompose_id = _es6_module.add_export('decompose_id', decompose_id);
  var _test_id_start=0;
  function test_ids(steps, start) {
    if (steps===undefined) {
        steps = 1;
    }
    if (start===undefined) {
        start = _test_id_start;
    }
    var max_mres=5000000;
    var max_seg=500000;
    console.log("starting at", start);
    for (var i=start; i<start+steps; i++) {
        for (var j=0; j<max_seg; j++) {
            var id=compose_id(i, j);
            var ret=decompose_id(id);
            if (i!=ret[0]||j!=ret[1]) {
                console.log("Found bad combination!!", ret[0], ret[1], "||", i, j);
            }
        }
    }
    console.log("finished");
    _test_id_start = i;
  }
  test_ids = _es6_module.add_export('test_ids', test_ids);
  function has_multires(spline) {
    return spline.segments.cdata.num_layers("MultiResLayer")>0;
  }
  has_multires = _es6_module.add_export('has_multires', has_multires);
  function ensure_multires(spline) {
    if (spline.segments.cdata.num_layers("MultiResLayer")==0) {
        spline.segments.cdata.add_layer(MultiResLayer);
    }
  }
  ensure_multires = _es6_module.add_export('ensure_multires', ensure_multires);
  var empty_iter={_ret: {done: true, 
    value: undefined}, 
   next: function () {
      this._ret.done = true;
      this._ret.value = undefined;
      return this._ret;
    }}
  empty_iter[Symbol.iterator] = function () {
    return this;
  }
  class GlobalIter  {
    
     constructor(spline, level, return_keys=false) {
      this.spline = spline;
      this.level = level;
      this.return_keys = return_keys;
      this.seg = undefined;
      this.segiter = spline.segments[Symbol.iterator]();
      this.pointiter = undefined;
      this.ret = {done: false, 
     value: undefined};
    }
     next() {
      if (this.pointiter==undefined) {
          this.seg = this.segiter.next();
          if (this.seg.done==true) {
              this.ret.done = true;
              this.ret.value = undefined;
              return this.ret;
          }
          this.seg = this.seg.value;
          var mr=this.seg.cdata.get_layer(MultiResLayer);
          this.pointiter = mr.points(this.level);
      }
      var p=this.pointiter.next();
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
  _ESClass.register(GlobalIter);
  _es6_module.add_class(GlobalIter);
  function iterpoints(spline, level, return_keys) {
    if (return_keys===undefined) {
        return_keys = false;
    }
    if (spline.segments.cdata.num_layers("MultiResLayer")==0)
      return empty_iter;
    return new GlobalIter(spline, level, return_keys);
  }
  iterpoints = _es6_module.add_export('iterpoints', iterpoints);
  iterpoints.selected = function (spline, level) {
  }
}, '/dev/fairmotion/src/curve/spline_multires.js');
es6_module_define('solver_new', ["./spline_math.js", "./spline_base.js"], function _solver_new_module(_es6_module) {
  var KSCALE=es6_import_item(_es6_module, './spline_math.js', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, './spline_math.js', 'KANGLE');
  var SplineTypes=es6_import_item(_es6_module, './spline_base.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, './spline_base.js', 'SplineFlags');
  var acos=Math.acos, asin=Math.asin, cos=Math.cos, sin=Math.sin, PI=Math.PI, pow=Math.pow, sqrt=Math.sqrt, log=Math.log, abs=Math.abs;
  var $tan_RUDJ_solve=new Vector3();
  function solve(spline, order, steps, gk, do_inc, edge_segs) {
    var pairs=[];
    var CBREAK=SplineFlags.BREAK_CURVATURES;
    var TBREAK=SplineFlags.BREAK_TANGENTS;
    function reset_edge_segs() {
      for (var j=0; do_inc&&j<edge_segs.length; j++) {
          var seg=edge_segs[j];
          var ks=seg.ks;
          for (var k=0; k<ks.length; k++) {
              ks[k] = seg._last_ks[k];
          }
      }
    }
    var eps=0.0001;
    for (var i=0; i<spline.handles.length; i++) {
        var h=spline.handles[i], seg1=h.owning_segment, v=h.owning_vertex;
        if (do_inc&&!((v.flag)&SplineFlags.UPDATE))
          continue;
        if (!(h.flag&SplineFlags.USE_HANDLES)&&v.segments.length<=2)
          continue;
        if (h.hpair!=undefined&&(h.flag&SplineFlags.AUTO_PAIRED_HANDLE)) {
            var seg2=h.hpair.owning_segment;
            var s1=v===seg1.v1 ? eps : 1.0-eps, s2=v==seg2.v1 ? eps : 1.0-eps;
            var thresh=5;
            if (seg1.v1.vectorDistance(seg1.v2)<thresh||seg2.v1.vectorDistance(seg2.v2)<thresh)
              continue;
            var d1=seg1.v1.vectorDistance(seg1.v2);
            var d2=seg2.v1.vectorDistance(seg2.v2);
            var ratio=Math.min(d1/d2, d2/d1);
            if (isNaN(ratio))
              ratio = 0.0;
            pairs.push(v);
            pairs.push(seg1);
            pairs.push(seg2);
            pairs.push(s1);
            pairs.push(s2);
            pairs.push((s1<0.5)==(s2<0.5) ? -1 : 1);
            pairs.push(ratio);
        }
        else 
          if (!(h.flag&SplineFlags.AUTO_PAIRED_HANDLE)) {
            var s1=v==seg1.v1 ? 0 : 1;
            pairs.push(v);
            pairs.push(seg1);
            pairs.push(undefined);
            pairs.push(s1);
            pairs.push(0.0);
            pairs.push(1);
            pairs.push(1);
        }
    }
    var PSLEN=7;
    for (var i=0; i<spline.verts.length; i++) {
        var v=spline.verts[i];
        if (do_inc&&!((v.flag)&SplineFlags.UPDATE))
          continue;
        if (v.segments.length!=2)
          continue;
        if (v.flag&TBREAK)
          continue;
        var seg1=v.segments[0], seg2=v.segments[1];
        var s1=v===seg1.v1 ? 0 : 1, s2=v==seg2.v1 ? 0 : 1;
        seg1.evaluate(0.5, order);
        seg2.evaluate(0.5, order);
        var thresh=5;
        if (seg1.v1.vectorDistance(seg1.v2)<thresh||seg2.v1.vectorDistance(seg2.v2)<thresh)
          continue;
        var d1=seg1.v1.vectorDistance(seg1.v2);
        var d2=seg2.v1.vectorDistance(seg2.v2);
        var ratio=Math.min(d1/d2, d2/d1);
        if (isNaN(ratio))
          ratio = 0.0;
        pairs.push(v);
        pairs.push(seg1);
        pairs.push(seg2);
        pairs.push(s1);
        pairs.push(s2);
        pairs.push((s1==0.0)==(s2==0.0) ? -1 : 1);
        pairs.push(ratio);
    }
    var glist=[];
    for (var i=0; i<pairs.length/PSLEN; i++) {
        glist.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
    var klist1=[];
    for (var i=0; i<pairs.length/PSLEN; i++) {
        klist1.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
    var klist2=[];
    for (var i=0; i<pairs.length/PSLEN; i++) {
        klist2.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
    var gs=new Array(order);
    var df=3e-05;
    var err=0.0;
    if (pairs.length==0)
      return ;
    for (var si=0; si<steps; si++) {
        var i=0;
        var plen=pairs.length;
        if (isNaN(err)||isNaN(plen))
          break;
        if (si>0&&err/plen<0.1)
          break;
        var di=0;
        if (si%2) {
            di = -PSLEN*2;
            i = plen-PSLEN;
        }
        reset_edge_segs();
        err = 0.0;
        while (i<plen&&i>=0) {
          var cnum=Math.floor(i/PSLEN);
          var v=pairs[i++], seg1=pairs[i++], seg2=pairs[i++];
          var s1=pairs[i++], s2=pairs[i++], doflip=pairs[i++];
          var ratio=pairs[i++];
          i+=di;
          for (var ci=0; ci<2; ci++) {
              if (0&&seg2!=undefined&&ratio>0.1&&!(v.flag&CBREAK)) {
                  var sz1=seg1.ks[KSCALE], sz2=seg2.ks[KSCALE];
                  var i1=s1*(order-1), i2=s2*(order-1);
                  var k1=seg1.ks[i1], k2=seg2.ks[i2];
                  var k=((k1/sz1)+(k2/sz2*doflip))/2.0;
                  seg1.ks[i1] = seg1.ks[i1]+(k*sz1-seg1.ks[i1])*1;
                  seg2.ks[i2] = seg2.ks[i2]+(k*doflip*sz2-seg2.ks[i2])*1;
              }
              if (seg2!=undefined) {
                  var ta=seg1.derivative(s1, order), tb=seg2.derivative(s2, order);
                  if (doflip<0.0)
                    tb.negate();
                  ta.normalize();
                  tb.normalize();
                  var _d=Math.min(Math.max(ta.dot(tb), -1.0), 1.0);
                  var r=acos(_d);
                  
              }
              else {
                var h=seg1.handle(v);
                $tan_RUDJ_solve.load(h).sub(v).normalize();
                if (v==seg1.v2)
                  $tan_RUDJ_solve.negate();
                var ta=seg1.derivative(s1, order).normalize();
                var _d=Math.min(Math.max(ta.dot($tan_RUDJ_solve), -1.0), 1.0);
                var r=acos(_d);
                
              }
              if (r<0.0001)
                continue;
              err+=r;
              var totgs=0.0;
              var gs=glist[cnum];
              var seglen=(seg2==undefined) ? 1 : 2;
              for (var sj=0; sj<seglen; sj++) {
                  var seg=sj ? seg2 : seg1;
                  for (var j=0; j<order; j++) {
                      var orig=seg.ks[j];
                      seg.ks[j]+=df;
                      if (seg2!=undefined) {
                          var ta=seg1.derivative(s1, order), tb=seg2.derivative(s2, order);
                          if (doflip<0.0)
                            tb.negate();
                          ta.normalize();
                          tb.normalize();
                          var _d=Math.min(Math.max(ta.dot(tb), -1.0), 1.0);
                          var r2=acos(_d);
                          
                      }
                      else {
                        var ta=seg1.derivative(s1, order).normalize();
                        var _d=Math.min(Math.max(ta.dot($tan_RUDJ_solve), -1.0), 1.0);
                        var r2=acos(_d);
                        
                      }
                      var g=(r2-r)/df;
                      gs[sj*order+j] = g;
                      totgs+=g*g;
                      seg.ks[j] = orig;
                  }
              }
              if (totgs==0.0)
                continue;
              r/=totgs;
              var unstable=ratio<0.1;
              for (var sj=0; sj<seglen; sj++) {
                  var seg=sj ? seg2 : seg1;
                  for (var j=0; j<order; j++) {
                      var g=gs[sj*order+j];
                      if (order>2&&unstable&&(j==0||j==order-1)) {
                      }
                      seg.ks[j]+=-r*g*gk;
                  }
              }
              if (seg2!=undefined&&ratio>0.1&&!(v.flag&CBREAK)) {
                  var sz1=seg1.ks[KSCALE], sz2=seg2.ks[KSCALE];
                  var i1=s1*(order-1), i2=s2*(order-1);
                  var k1=seg1.ks[i1], k2=seg2.ks[i2];
                  var k=((k1/sz1)+(k2/sz2*doflip))/2.0;
                  seg1.ks[i1] = seg1.ks[i1]+(k*sz1-seg1.ks[i1])*1;
                  seg2.ks[i2] = seg2.ks[i2]+(k*doflip*sz2-seg2.ks[i2])*1;
              }
          }
        }
        for (var j=0; j<edge_segs.length; j++) {
            var seg=edge_segs[j];
            var ks=seg.ks;
            for (var k=0; k<ks.length; k++) {
                seg.ks[k] = seg._last_ks[k];
            }
        }
    }
  }
  solve = _es6_module.add_export('solve', solve);
}, '/dev/fairmotion/src/curve/solver_new.js');
es6_module_define('vectordraw_base', [], function _vectordraw_base_module(_es6_module) {
  "use strict";
  var VectorFlags={UPDATE: 2, 
   TAG: 4}
  VectorFlags = _es6_module.add_export('VectorFlags', VectorFlags);
  class VectorVertex extends Vector2 {
     constructor(co) {
      super(co);
    }
     loadSTRUCT(reader) {
      reader(this);
      this.load(this._vec);
      delete this._vec;
    }
  }
  _ESClass.register(VectorVertex);
  _es6_module.add_class(VectorVertex);
  VectorVertex = _es6_module.add_export('VectorVertex', VectorVertex);
  VectorVertex.STRUCT = `
VectorVertex {
  _vec : vec2;
}
`;
  class QuadBezPath  {
    
    
    
    
    
     constructor() {
      this.off = new Vector2();
      this.id = -1;
      this.z = undefined;
      this.blur = 0;
      this.size = [-1, -1];
      this.index = -1;
      this.color = new Vector4();
      this.aabb = [new Vector2(), new Vector2()];
      this.clip_paths = new set();
      this.clip_users = new set();
    }
     add_clip_path(path) {
      if (!this.clip_paths.has(path)) {
          this.update();
      }
      path.clip_users.add(this);
      this.clip_paths.add(path);
    }
     reset_clip_paths() {
      if (this.clip_paths.length>0) {
      }
      for (var path of this.clip_paths) {
          path.clip_users.remove(this);
      }
      this.clip_paths.reset();
    }
     update_aabb(draw, fast_mode=false) {
      throw new Error("implement me!");
    }
     beginPath() {
      throw new Error("implement me");
    }
     undo() {
      throw new Error("implement me");
    }
     moveTo(x, y) {
      this.lastx = x;
      this.lasty = y;
      throw new Error("implement me");
    }
     bezierTo(x2, y2, x3, y3) {
      this.lastx = x3;
      this.lasty = y3;
      throw new Error("implement me");
    }
     cubicTo(x2, y2, x3, y3, x4, y4, subdiv=1) {
      var x1=this.lastx, y1=this.lasty;
      if (subdiv>0) {
          var dx1=(x2-x1)*0.5, dy1=(y2-y1)*0.5;
          var dx2=(x4-x3)*0.5, dy2=(y4-y3)*0.5;
          var dxmid=(x3+x4-x2-x1)*0.25;
          var dymid=(y3+y4-y2-y1)*0.25;
          var midx=(3*x3+x4+3*x2+x1)/8.0;
          var midy=(3*y3+y4+3*y2+y1)/8.0;
          this.cubicTo(x2+dx1, y2+dy1, midx-dxmid, midy-dymid, midx, midy, subdiv-1);
          this.cubicTo(midx+dxmid, midy+dymid, x4-dx2, y4-dy2, x4, y4, subdiv-1);
          return ;
      }
      var dx1=(x2-x1)*3.0, dy1=(y2-y1)*3.0;
      var dx2=(x4-x3)*3.0, dy2=(y4-y3)*3.0;
      var tdiv=(dx1*dy2-dx2*dy1);
      var t=(-(x1-x4)*dy2+(y1-y4)*dx2);
      var midx, midy;
      if (tdiv!=0.0) {
          t/=tdiv;
          midx = x1+dx1*t;
          midy = y1+dy1*t;
      }
      else {
        midx = (x2+x3)*0.5;
        midy = (y2+y3)*0.5;
      }
      this.bezierTo(midx, midy, x4, y4);
      this.lastx = x4;
      this.lasty = y4;
    }
     lineTo(x2, y2) {
      throw new Error("implement me");
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {

    }
     reset(draw) {
      this.pan.zero();
    }
     draw(draw, offx=0, offy=0) {

    }
     update() {
      throw new Error("implement me!");
    }
     [Symbol.keystr]() {
      return this.id;
    }
  }
  _ESClass.register(QuadBezPath);
  _es6_module.add_class(QuadBezPath);
  QuadBezPath = _es6_module.add_export('QuadBezPath', QuadBezPath);
  var pop_transform_rets=new cachering(function () {
    return new Matrix4();
  }, 32);
  class VectorDraw  {
    
    
    
    
     constructor() {
      this.pan = new Vector2();
      this.do_blur = true;
      this.matstack = new Array(256);
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
      this.matrix = new Matrix4();
    }
     recalcAll() {
      this.regen = true;
    }
     clear() {

    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      throw new Error("implement me");
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      throw new Error("implement me");
    }
     remove(path) {
      for (var path2 of path.clip_users) {
          path2.clip_paths.remove(path);
          path2.update();
      }
      delete this.path_idmap[path.id];
      this.paths.remove(path);
      path.destroy(this);
    }
     update() {
      throw new Error("implement me");
    }
     destroy() {
      throw new Error("implement me");
    }
     draw() {
      throw new Error("implement me");
    }
     push_transform(mat, multiply_instead_of_load=true) {
      this.matstack[this.matstack.cur++].load(this.matrix);
      if (mat!=undefined&&multiply_instead_of_load) {
          this.matrix.multiply(mat);
      }
      else 
        if (mat!=undefined) {
          this.matrix.load(mat);
      }
    }
     pop_transform() {
      var ret=pop_transform_rets.next();
      ret.load(this.matrix);
      this.matrix.load(this.matstack[--this.matstack.cur]);
      return ret;
    }
     translate(x, y) {
      this.matrix.translate(x, y);
    }
     scale(x, y) {
      this.matrix.scale(x, y, 1.0);
    }
     rotate(th) {
      this.matrix.euler_rotate(0, 0, th);
    }
     set_matrix(matrix) {
      this.matrix.load(matrix);
    }
     get_matrix() {
      return this.matrix;
    }
  }
  _ESClass.register(VectorDraw);
  _es6_module.add_class(VectorDraw);
  VectorDraw = _es6_module.add_export('VectorDraw', VectorDraw);
}, '/dev/fairmotion/src/vectordraw/vectordraw_base.js');
es6_module_define('vectordraw_canvas2d', ["./vectordraw_base.js", "./vectordraw_jobs_base.js", "./vectordraw_jobs.js", "../util/mathlib.js", "../config/config.js", "../path.ux/scripts/util/math.js", "../path.ux/scripts/util/util.js"], function _vectordraw_canvas2d_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var util=es6_import(_es6_module, '../path.ux/scripts/util/util.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var math=es6_import(_es6_module, '../path.ux/scripts/util/math.js');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, './vectordraw_base.js', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  var OPCODES=es6_import_item(_es6_module, './vectordraw_jobs_base.js', 'OPCODES');
  var vectordraw_jobs=es6_import(_es6_module, './vectordraw_jobs.js');
  let debug=0;
  var canvaspath_draw_mat_tmps=new cachering(function () {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(16);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function () {
    return new Vector2();
  }, 32);
  let MOVETO=OPCODES.MOVETO, BEZIERTO=OPCODES.QUADRATIC, LINETO=OPCODES.LINETO, BEGINPATH=OPCODES.BEGINPATH, CUBICTO=OPCODES.CUBIC, CLOSEPATH=OPCODES.CLOSEPATH;
  let arglens={}
  arglens[BEGINPATH] = 0;
  arglens[CLOSEPATH] = 0;
  arglens[MOVETO] = 2;
  arglens[LINETO] = 2;
  arglens[BEZIERTO] = 4;
  arglens[CUBICTO] = 6;
  let render_idgen=1;
  let batch_iden=1;
  class Batch  {
    
    
    
    
    
    
    
    
    
    
     constructor() {
      this._batch_id = batch_iden++;
      this.generation = 0;
      this.isBlurBatch = false;
      this.dpi_scale = 1.0;
      this.paths = [];
      this.path_idmap = {};
      this.regen = 1;
      this.gen_req = 0;
      this._last_pan = new Vector2();
      this.viewport = {pos: [0, 0], 
     size: [1, 1]};
      this.realViewport = {pos: [0, 0], 
     size: [1, 1]};
      this.patharea = 0;
    }
    set  regen(v) {
      this._regen = v;
      if (debug&&v) {
          console.warn("Regen called");
      }
    }
    get  regen() {
      return this._regen;
    }
     add(p) {
      if (this.has(p)) {
          return ;
      }
      this.generation = 0;
      let draw={matrix: new Matrix4()};
      p.update_aabb(draw);
      let min=p.aabb[0], max=p.aabb[1];
      if (p.blur>0) {
          min.addScalar(-p.blur*0.5);
          max.addScalar(p.blur*0.5);
      }
      let w=max[0]-min[0];
      let h=max[1]-min[1];
      this.patharea+=w*h;
      p._batch = this;
      this.regen = 1;
      if (!p._batch_id) {
          p._batch_id = batch_iden++;
      }
      this.path_idmap[p._batch_id] = p;
      this.paths.push(p);
    }
     remove(p) {
      p._batch = undefined;
      if (!this.has(p)) {
          return ;
      }
      this.regen = 1;
      p._batch = undefined;
      this.paths.remove(p);
      delete this.path_idmap[p._batch_id];
      return this;
    }
     destroy() {
      this.patharea = 0;
      console.warn("destroying batch", this.length);
      for (let p of this.paths) {
          p._batch = undefined;
      }
      this.paths.length = 0;
      this.path_idmap = {};
      this.regen = 1;
      this.gen_req = 0;
    }
     has(p) {
      if (!p._batch_id)
        return false;
      return p._batch_id in this.path_idmap;
    }
     checkViewport(draw) {
      let canvas=draw.canvas;
      let p=new Vector2(draw.pan);
      p[1] = draw.canvas.height-p[1];
      p.sub(this._last_pan);
      let cv={pos: new Vector2(), 
     size: new Vector2([canvas.width, canvas.height])};
      cv.pos[0]-=p[0];
      cv.pos[1]-=p[1];
      let clip1=math.aabb_intersect_2d(this.viewport.pos, this.viewport.size, cv.pos, cv.size);
      let clip2=math.aabb_intersect_2d(this.realViewport.pos, this.realViewport.size, cv.pos, cv.size);
      const debug=0;
      if (debug) {
          console.log("\n===\n");
          console.log("dpan:", p);
          console.log(cv.pos, cv.size);
          if (clip1)
            console.log("clip1", clip1.pos, clip1.size);
          if (clip2)
            console.log("clip2", clip2.pos, clip2.size);
      }
      if (!clip1||!clip2) {
          if (debug) {
              console.log("clip is bad 1:", clip1, clip2, !!clip1!==!!clip2);
          }
          return !!clip1!==!!clip2;
      }
      clip1.pos.floor();
      clip1.size.floor();
      clip2.pos.floor();
      clip2.size.floor();
      let bad=clip1.pos.vectorDistance(clip2.pos)>2;
      bad = bad||clip1.size.vectorDistance(clip2.size)>2;
      if (debug) {
          console.log("clip is bad 2:", bad);
      }
      return bad;
    }
     _getPaddedViewport(canvas, cpad=512) {
      let dpi_scale=canvas.dpi_scale*this.dpi_scale;
      cpad/=dpi_scale;
      return {pos: new Vector2([-cpad, -cpad]), 
     size: new Vector2([canvas.width*canvas.dpi_scale+cpad*2, canvas.height*canvas.dpi_scale+cpad*2])}
    }
     gen(draw) {
      if (this.gen_req-->0) {
          return ;
      }
      this.gen_req = 10;
      this.regen = false;
      if (this.isBlurBatch) {
          let matrix=new Matrix4(draw.matrix);
          matrix.scale(this.dpi_scale, this.dpi_scale);
          draw.push_transform(matrix, false);
      }
      let canvas=draw.canvas, g=draw.g;
      if (debug)
        console.warn("generating batch of size "+this.paths.length);
      let ok=false;
      let min=new Vector2([1e+17, 1e+17]);
      let max=new Vector2([-1e+17, -1e+17]);
      let startmat=new Matrix4(draw.matrix);
      let zoom=draw.matrix.$matrix.m11;
      function setMat(p, set_off) {
        if (set_off===undefined) {
            set_off = false;
        }
        let mat=new Matrix4();
        if (set_off) {
            mat.translate(-min[0], -min[1], 0.0);
        }
        let m=new Matrix4(draw.matrix);
        mat.multiply(m);
        draw.push_transform(mat, false);
        return mat;
      }
      for (let p of this.paths) {
          setMat(p);
          p.update_aabb(draw);
          draw.pop_transform();
          min.min(p.aabb[0]);
          max.max(p.aabb[1]);
      }
      this.realViewport = {pos: new Vector2(min), 
     size: new Vector2(max).sub(min)};
      let min2=new Vector2(min);
      let size2=new Vector2(max);
      size2.sub(min2);
      let cpad=512;
      let cv=this._getPaddedViewport(canvas, cpad);
      let box=math.aabb_intersect_2d(min2, size2, cv.pos, cv.size);
      min2 = min2.floor();
      size2 = size2.floor();
      if (!box) {
          if (this.isBlurBatch) {
              draw.pop_transform();
          }
          return ;
      }
      min.load(box.pos);
      max.load(min).add(box.size);
      this.viewport = {pos: new Vector2(box.pos), 
     size: new Vector2(box.size)};
      let width=~~(max[0]-min[0]);
      let height=~~(max[1]-min[1]);
      let commands=[width, height];
      for (let p of this.paths) {
          setMat(p, true);
          p.gen(draw);
          let c2=p._commands;
          draw.pop_transform();
          for (let i=0; i<c2.length; i++) {
              commands.push(c2[i]);
          }
      }
      if (this.isBlurBatch) {
          draw.pop_transform();
      }
      let renderid=render_idgen++;
      if (commands.length===0) {
          this.gen_req = 0;
          return ;
      }
      commands = new Float64Array(commands);
      min = new Vector2(min);
      let last_pan=new Vector2(draw.pan);
      last_pan[1] = draw.canvas.height-last_pan[1];
      this.pending = true;
      vectordraw_jobs.manager.postRenderJob(renderid, commands).then((data) =>        {
        this.pending = false;
        if (this.onRenderDone) {
            this.onRenderDone(this);
        }
        if (debug)
          console.warn("Got render result!");
        this.gen_req = 0;
        this._last_pan.load(last_pan);
        this._image = data;
        this._image_off = min;
        this._draw_zoom = zoom;
        window.redraw_viewport();
      });
    }
     draw(draw) {
      if (this.paths.length===0) {
          return ;
      }
      if (!this.regen&&this.checkViewport(draw)&&!this.gen_req) {
          this.regen = 1;
          console.log("bad viewport");
      }
      let canvas=draw.canvas, g=draw.g;
      var zoom=draw.matrix.$matrix.m11;
      let offx=0, offy=0;
      let scale=zoom/this._draw_zoom;
      offx = draw.pan[0]-this._last_pan[0]*scale;
      offy = (draw.canvas.height-draw.pan[1])-this._last_pan[1]*scale;
      offx/=scale;
      offy/=scale;
      if (this.regen) {
          this.pending = true;
          this.gen(draw);
      }
      if (this._image===undefined) {
          return ;
      }
      g.imageSmoothingEnabled = !!this.isBlurBatch;
      if (this.paths.length===0&&this.generation>2) {
          this._image = undefined;
          return ;
      }
      if (this.generation>0) {
          this.generation++;
      }
      g.save();
      g.scale(scale, scale);
      g.translate(offx, offy);
      g.translate(this._image_off[0], this._image_off[1]);
      g.drawImage(this._image, 0, 0);
      g.restore();
    }
  }
  _ESClass.register(Batch);
  _es6_module.add_class(Batch);
  Batch = _es6_module.add_export('Batch', Batch);
  let canvaspath_temp_vs=util.cachering.fromConstructor(Vector2, 512);
  let canvaspath_temp_mats=util.cachering.fromConstructor(Matrix4, 128);
  class CanvasPath extends QuadBezPath {
    
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.dead = false;
      this.commands = [];
      this.recalc = 1;
      this._render_id = render_idgen++;
      this._image = undefined;
      this._image_off = [0, 0];
      this.lastx = 0;
      this.lasty = 0;
      this._aabb2 = [new Vector2(), new Vector2()];
      this._size2 = new Vector2();
      this.canvas = undefined;
      this.g = undefined;
      this.path_start_i = 2;
      this.first = true;
      this._mm = new MinMax(2);
    }
     update_aabb(draw, fast_mode=false) {
      var tmp=canvaspath_temp_vs.next().zero();
      var mm=this._mm;
      var pad=this.pad = this.blur>0 ? this.blur+15 : 0;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      var prev=-1;
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=arglens[cmd];
        if (fast_mode&&prev!==BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        for (var j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++];
            tmp[1] = cs[i++];
            if (isNaN(tmp.dot(tmp))) {
                console.warn("NaN!");
                continue;
            }
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
      this.aabb[0].floor();
      this.aabb[1].ceil();
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
    }
     closePath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(CLOSEPATH);
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     _pushCmd() {
      let arglen=arguments.length;
      for (let i=0; i<arglen; i++) {
          if (isNaN(arguments[i])) {
              console.warn("NaN!");
          }
          let arg=arguments[i];
          this.commands.push(arg);
      }
      this.recalc = 1;
      this.first = false;
    }
     moveTo(x, y) {
      this._pushCmd(MOVETO, x, y);
      this.lastx = x;
      this.lasty = y;
    }
     cubicTo(x2, y2, x3, y3, x4, y4) {
      this._pushCmd(CUBICTO, x2, y2, x3, y3, x4, y4);
      this.lastx = x4;
      this.lasty = y4;
    }
     bezierTo(x2, y2, x3, y3) {
      this._pushCmd(BEZIERTO, x2, y2, x3, y3);
      this.lastx = x3;
      this.lasty = y3;
    }
     lineTo(x2, y2) {
      if (this.first) {
          this.moveTo(x2, y2);
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {
      if (this._batch) {
          this._batch.remove(this);
      }
      this.canvas = this.g = undefined;
      this._image = this.commands = undefined;
    }
     genInto(draw, path, commands, clip_mode=false) {
      let oldc=this.canvas, oldg=this.g, oldaabb=this.aabb, oldsize=this.size;
      this.aabb = this._aabb2;
      this.aabb[0].load(path.aabb[0]);
      this.aabb[1].load(path.aabb[1]);
      this.size = this._size2;
      this.size.load(path.size);
      this.gen_commands(draw, commands, undefined, true);
      this.canvas = oldc;
      this.g = oldg;
      this.aabb = oldaabb;
      this.size = oldsize;
    }
     gen_commands(draw, commands, _check_tag=0, clip_mode=false) {
      let m=this.matrix.$matrix;
      let r=~~(this.color[0]*255), g=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
      let commands2=[];
      if (!clip_mode) {
          commands2 = commands2.concat([OPCODES.FILLSTYLE, r, g, b, a]);
          commands2 = commands2.concat([OPCODES.SETBLUR, this.blur]);
      }
      commands2.push(OPCODES.BEGINPATH);
      commands2 = commands2.concat(this.commands);
      commands2.push(clip_mode ? OPCODES.CLIP : OPCODES.FILL);
      for (let c of commands2) {
          commands.push(c);
      }
      return commands;
    }
     gen(draw, _check_tag=0, clip_mode=false, independent=false) {
      if (_check_tag&&!this.recalc) {
          console.log("infinite loop in clip stack");
          return ;
      }
      this.recalc = 0;
      var do_clip=this.clip_paths.length>0;
      var do_blur=this.blur>0.0;
      var zoom=draw.matrix.$matrix.m11;
      this.update_aabb(draw);
      var w=this.size[0] = Math.ceil(this.aabb[1][0]-this.aabb[0][0]);
      var h=this.size[1] = Math.ceil(this.aabb[1][1]-this.aabb[0][1]);
      if (w>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE||h>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE) {
          var w2=Math.min(w, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
          var h2=Math.min(h, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
          var dw=w-w2, dh=h-h2;
          this.aabb[0][0]+=dw*0.5;
          this.aabb[0][1]+=dh*0.5;
          this.aabb[1][0]-=dw*0.5;
          this.aabb[1][1]-=dh*0.5;
          this.size[0] = w2;
          this.size[1] = h2;
          w = w2, h = h2;
      }
      if (1) {
          var mat=canvaspath_draw_mat_tmps.next();
          mat.load(draw.matrix);
          this.matrix = mat;
      }
      if (isNaN(w)||isNaN(h)) {
          console.log("NaN path size", w, h, this);
          if (isNaN(w))
            w = 4.0;
          if (isNaN(h))
            h = 4.0;
      }
      let commands2=independent ? [w, h] : [];
      let m=this.matrix.$matrix;
      commands2 = commands2.concat([OPCODES.SETTRANSFORM, m.m11, m.m12, m.m21, m.m22, m.m41, m.m42]);
      commands2.push(OPCODES.SAVE);
      for (var path of this.clip_paths) {
          if (path.recalc) {
              if (debug)
                console.log("   clipping subgen!");
              path.gen(draw, 1);
          }
          let oldc=path.canvas, oldg=path.g, oldaabb=path.aabb, oldsize=path.size;
          path.genInto(draw, this, commands2, true);
      }
      this.gen_commands(draw, commands2, _check_tag, clip_mode);
      commands2.push(OPCODES.RESTORE);
      this._commands = commands2;
    }
     reset(draw) {
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this.first = true;
    }
     draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g) {
      offx+=this.off[0], offy+=this.off[1];
      if (this.recalc) {
          this.recalc = 0;
          this.gen(draw);
      }
      if (this._image===undefined) {
          return ;
      }
      g.imageSmoothingEnabled = false;
      g.drawImage(this._image, this._image_off[0]+offx, this._image_off[1]+offy);
      g.beginPath();
      g.rect(this._image_off[0]+offx, this._image_off[1]+offy, this._image.width, this._image.height);
      g.rect(this._image_off[0]+offx, this._image_off[1]+offy, this._image.width, this._image.height);
      g.fillStyle = "rgba(0,255,0,0.4)";
      g.fill();
    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(CanvasPath);
  _es6_module.add_class(CanvasPath);
  CanvasPath = _es6_module.add_export('CanvasPath', CanvasPath);
  class Batches extends Array {
    
     constructor() {
      super();
      this.cur = 0;
      this.drawlist = [];
    }
     getHead(onBatchDone) {
      if (this.drawlist.length>0) {
          return this.drawlist[this.drawlist.length-1];
      }
      return this.requestBatch(onBatchDone);
    }
     requestBatch(onrenderdone) {
      let ret;
      if (this.cur<this.length) {
          this.drawlist.push(this[this.cur]);
          ret = this[this.cur++];
      }
      else {
        let b=new Batch();
        b.onRenderDone = onrenderdone;
        this.cur++;
        this.push(b);
        this.drawlist.push(this[this.length-1]);
        ret = this[this.length-1];
      }
      ret.isBlurBatch = false;
      return ret;
    }
     remove(batch) {
      let i=this.indexOf(batch);
      this.drawlist.remove(batch);
      if (this.cur>0&&this.cur<this.length-1) {
          let j=this.cur-1;
          this[i] = this[j];
          this.cur--;
      }
    }
     destroy() {
      this.drawlist.length = 0;
      this.cur = 0;
      if (debug)
        console.log("destroy batches");
      for (let b of list(this)) {
          if (b.generation>1) {
              super.remove(b);
          }
          b.generation++;
          b.destroy();
      }
    }
  }
  _ESClass.register(Batches);
  _es6_module.add_class(Batches);
  Batches = _es6_module.add_export('Batches', Batches);
  class CanvasDraw2D extends VectorDraw {
    
    
    
    
    
    
     constructor() {
      super();
      this.promise = undefined;
      this.on_batches_finish = undefined;
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      this._last_pan = new Vector2();
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
      this.canvas = undefined;
      this.g = undefined;
      this.batches = new Batches();
      this.onBatchDone = this.onBatchDone.bind(this);
    }
     onBatchDone(batch) {
      let ok=true;
      for (let b of this.batches.drawlist) {
          if (b.pending) {
              ok = false;
          }
      }
      if (ok&&this.promise) {
          this.promise = undefined;
          console.log("Draw finished!");
          this.on_batches_finish();
      }
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      var path=this.path_idmap[id];
      return check_z ? path.z==z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new CanvasPath();
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.paths.push(this.path_idmap[id]);
      }
      var ret=this.path_idmap[id];
      if (check_z&&ret.z!==z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {
      for (var path of this.paths) {
          path.update(this);
      }
    }
     destroy() {
      this.batches.destroy();
      for (var path of this.paths) {
          path.destroy(this);
      }
    }
    set  regen(v) {
      this.__regen = v;
      console.warn("regen");
    }
    get  regen() {
      return this.__regen;
    }
     clear() {
      this.recalcAll();
    }
     draw(g) {
      if (!!this.do_blur!==!!this._last_do_blur) {
          this._last_do_blur = !!this.do_blur;
          this.regen = 1;
          window.setTimeout(() =>            {
            window.redraw_viewport();
          }, 200);
      }
      if (this.regen) {
          console.log("RECALC ALL");
          this.__regen = 0;
          this.batches.destroy();
          this.update();
      }
      let batch;
      let blimit=this.paths.length<15 ? 15 : Math.ceil(this.paths.length/vectordraw_jobs.manager.max_threads);
      batch = this.batches.getHead(this.onBatchDone);
      var canvas=g.canvas;
      var off=canvaspath_draw_vs.next();
      let zoom=this.matrix.$matrix.m11;
      off.zero();
      this._last_pan.load(this.pan);
      if (this._last_zoom!==zoom) {
          this._last_zoom = zoom;
          for (let p of this.paths) {
              p.recalc = 1;
          }
      }
      for (var path of this.paths) {
          if (!path.recalc) {
              continue;
          }
          for (var path2 of path.clip_users) {
              path2.recalc = 1;
          }
      }
      for (var path of this.paths) {
          if (!path.recalc) {
              path.off.add(off);
          }
      }
      this.canvas = canvas;
      this.g = g;
      if (this.dosort) {
          if (debug)
            console.log("SORT");
          this.batches.destroy();
          batch = this.batches.requestBatch(this.onBatchDone);
          this.dosort = 0;
          this.paths.sort(function (a, b) {
            return a.z-b.z;
          });
      }
      for (var path of this.paths) {
          if (path.hidden) {
              if (path._batch) {
                  path._batch.remove(path);
              }
              continue;
          }
          let blurlimit=25;
          let needsblur=this.do_blur&&(path.blur*zoom>=blurlimit);
          needsblur = needsblur&&path.clip_paths.length===0;
          if (needsblur&&path._batch&&!path._batch.isBlurBatch) {
              this.regen = 1;
          }
          if (!needsblur&&path._batch&&path._batch.isBlurBatch) {
              this.regen = 1;
          }
          if (!path._batch) {
              let w1=batch.patharea/(canvas.width*canvas.height);
              let w2=this.batches.length>10 ? 1.0/(this.batches.length-9) : 0.0;
              if (needsblur) {
                  if (!batch.isBlurBatch) {
                      batch = this.batches.requestBatch(this.onBatchDone);
                      batch.isBlurBatch = true;
                      batch.dpi_scale = path.blur*zoom>50 ? 0.1 : 0.25;
                  }
                  else {
                    let scale=path.blur*zoom>50 ? 0.1 : 0.25;
                    batch.dpi_scale = Math.min(batch.dpi_scale, scale);
                  }
              }
              else 
                if (batch.isBlurBatch||(batch.paths.length*(1.0+w1*4.0)>blimit)) {
                  batch = this.batches.requestBatch(this.onBatchDone);
              }
              batch.add(path);
          }
          if (path.recalc&&path._batch) {
              path._batch.regen = 1;
              path.recalc = 0;
          }
          window.path1 = path;
      }
      window.batch = batch;
      window.batches = this.batches;
      for (let batch of this.batches.drawlist) {
          batch.draw(this);
      }
      if (!this.promise) {
          this.promise = new Promise((accept, reject) =>            {
            this.on_batches_finish = accept;
          });
      }
      let ok=true;
      for (let b of this.batches) {
          if (b.pending) {
              ok = false;
          }
      }
      if (ok) {
          window.setTimeout(() =>            {
            this.onBatchDone();
          });
      }
      return this.promise;
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
    }
  }
  _ESClass.register(CanvasDraw2D);
  _es6_module.add_class(CanvasDraw2D);
  CanvasDraw2D = _es6_module.add_export('CanvasDraw2D', CanvasDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_canvas2d.js');
es6_module_define('vectordraw_stub', ["../util/mathlib.js", "../config/config.js", "./vectordraw_base.js"], function _vectordraw_stub_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, './vectordraw_base.js', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  var canvaspath_draw_mat_tmps=new cachering((_) =>    {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(8);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function () {
    return new Vector2();
  }, 32);
  var CCMD=0, CARGLEN=1;
  var MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3;
  var NS="http://www.w3.org/2000/svg";
  var XLS="http://www.w3.org/1999/xlink";
  function makeElement(type, attrs) {
    if (attrs===undefined) {
        attrs = {};
    }
    var ret=document.createElementNS(NS, type);
    for (var k in attrs) {
        ret.setAttributeNS(null, k, attrs[k]);
    }
    return ret;
  }
  makeElement = _es6_module.add_export('makeElement', makeElement);
  class StubCanvasPath extends QuadBezPath {
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.commands = [];
      this.recalc = 1;
      this.lastx = 0;
      this.lasty = 0;
      this._last_z = undefined;
      this._last_off = new Vector2();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.domnode = undefined;
      this.filternode = undefined;
      this.clip_users = new set();
      this.path_start_i = 0;
      this.first = true;
      this._mm = new MinMax(2);
    }
     update_aabb(draw, fast_mode=false) {
      var tmp=new Vector2();
      var mm=this._mm;
      var pad=this.pad = this.blur>0 ? this.blur*draw.zoom+15 : 0;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      var prev=-1;
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        if (fast_mode&&prev!=BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        for (var j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++], tmp[1] = cs[i++];
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     _pushCmd() {
      var arglen=arguments.length-1;
      this.commands.push(arguments[0]);
      this.commands.push(arglen);
      for (var i=0; i<arglen; i++) {
          this.commands.push(arguments[i+1]);
      }
      this.recalc = 1;
      this.first = false;
    }
     moveTo(x, y) {
      this._pushCmd(MOVETO, x, y);
      this.lastx = x;
      this.lasty = y;
    }
     bezierTo(x2, y2, x3, y3) {
      this._pushCmd(BEZIERTO, x2, y2, x3, y3);
      this.lastx = x3;
      this.lasty = y3;
    }
     lineTo(x2, y2) {
      if (this.first) {
          this.moveTo(x2, y2);
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {

    }
     gen(draw, _check_tag=0) {

    }
     reset(draw) {
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.first = true;
    }
     draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g) {

    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(StubCanvasPath);
  _es6_module.add_class(StubCanvasPath);
  StubCanvasPath = _es6_module.add_export('StubCanvasPath', StubCanvasPath);
  class StubCanvasDraw2D extends VectorDraw {
    
    
    
    
     constructor() {
      super();
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
    }
    static  get_canvas(id, width, height, zindex) {
      var ret=document.getElementById(id);
      if (ret==undefined) {
          ret = document.createElement("canvas");
          ret.id = id;
      }
      ret.width = width;
      ret.height = height;
      if (ret.style!=undefined) {
          ret.style["z-index"] = zindex;
      }
      return ret;
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      var path=this.path_idmap[id];
      return check_z ? path.z==z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new StubCanvasPath();
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.dosort = 1;
          this.paths.push(this.path_idmap[id]);
      }
      var ret=this.path_idmap[id];
      if (check_z&&ret.z!=z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {

    }
    static  kill_canvas(svg) {

    }
     destroy() {

    }
     draw(g) {
      var canvas=g.canvas;
      canvas.style["background"] = "rgba(0,0,0,0)";
      this.canvas = canvas;
      this.g = g;
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
      this.zoom = matrix.$matrix.m11;
    }
  }
  _ESClass.register(StubCanvasDraw2D);
  _es6_module.add_class(StubCanvasDraw2D);
  StubCanvasDraw2D = _es6_module.add_export('StubCanvasDraw2D', StubCanvasDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_stub.js');
es6_module_define('vectordraw_canvas2d_simple', ["../util/mathlib.js", "./vectordraw_base.js", "../config/config.js"], function _vectordraw_canvas2d_simple_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, './vectordraw_base.js', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  var debug=0;
  window._setDebug = (d) =>    {
    debug = d;
  }
  var canvaspath_draw_mat_tmps=new cachering((_) =>    {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(8);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function () {
    return new Vector2();
  }, 32);
  var CCMD=0, CARGLEN=1;
  var MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3, CUBICTO=4;
  var NS="http://www.w3.org/2000/svg";
  var XLS="http://www.w3.org/1999/xlink";
  function makeElement(type, attrs) {
    if (attrs===undefined) {
        attrs = {};
    }
    var ret=document.createElementNS(NS, type);
    for (var k in attrs) {
        ret.setAttributeNS(null, k, attrs[k]);
    }
    return ret;
  }
  makeElement = _es6_module.add_export('makeElement', makeElement);
  let lasttime=performance.now();
  class SimpleCanvasPath extends QuadBezPath {
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.commands = [];
      this.recalc = 1;
      this.lastx = 0;
      this.lasty = 0;
      this._last_z = undefined;
      this._last_off = new Vector2();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.domnode = undefined;
      this.filternode = undefined;
      this.clip_users = new set();
      this.path_start_i = 0;
      this.first = true;
      this._mm = new MinMax(2);
    }
     update_aabb(draw, fast_mode=false) {
      var tmp=new Vector2();
      var mm=this._mm;
      var pad=this.pad = this.blur>0 ? this.blur*draw.zoom+15 : 0;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      var prev=-1;
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        if (fast_mode&&prev!=BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        for (var j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++], tmp[1] = cs[i++];
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     _pushCmd() {
      var arglen=arguments.length-1;
      this.commands.push(arguments[0]);
      this.commands.push(arglen);
      for (var i=0; i<arglen; i++) {
          this.commands.push(arguments[i+1]);
      }
      this.recalc = 1;
      this.first = false;
    }
     moveTo(x, y) {
      this._pushCmd(MOVETO, x, y);
      this.lastx = x;
      this.lasty = y;
    }
     cubicTo(x2, y2, x3, y3, x4, y4) {
      this._pushCmd(CUBICTO, x2, y2, x3, y3, x4, y4);
      this.lastx = x4;
      this.lasty = y4;
    }
     bezierTo(x2, y2, x3, y3) {
      this._pushCmd(BEZIERTO, x2, y2, x3, y3);
      this.lastx = x3;
      this.lasty = y3;
    }
     lineTo(x2, y2) {
      if (this.first) {
          this.moveTo(x2, y2);
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {

    }
     gen(draw, _check_tag=0) {

    }
     reset(draw) {
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.first = true;
    }
     draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g, clipMode=false) {
      var zoom=draw.matrix.$matrix.m11;
      offx+=this.off[0], offy+=this.off[1];
      if (isNaN(offx)||isNaN(offy)) {
          throw new Error("nan!");
      }
      this._last_z = this.z;
      var g=draw.g;
      var tmp=new Vector3();
      let debuglog=function () {
        if (debug>1) {
            let time=performance.now();
            if (time-lasttime>5) {
                console.log(...arguments);
                lasttime = time;
            }
        }
      };
      let debuglog2=function () {
        if (debug>0) {
            let time=performance.now();
            if (time-lasttime>5) {
                console.log(...arguments);
                lasttime = time;
            }
        }
      };
      debuglog2("start "+this.id);
      let matrix=draw.matrix;
      g.beginPath();
      let cmds=this.commands;
      let i;
      let mat2=new Matrix4(draw.matrix);
      mat2.invert();
      function loadtemp(off) {
        tmp[0] = cmds[i+2+off*2];
        tmp[1] = cmds[i+3+off*2];
        tmp[2] = 0.0;
        tmp.multVecMatrix(draw.matrix);
        if (isNaN(tmp.dot(tmp))) {
            throw new Error("NaN");
        }
      }
      if (!clipMode&&this.clip_paths.length>0) {
          g.beginPath();
          g.save();
          for (let path of this.clip_paths) {
              path.draw(draw, offx, offy, canvas, g, true);
          }
          g.clip();
      }
      for (i = 0; i<cmds.length; i+=cmds[i+1]+2) {
          var cmd=cmds[i];
          switch (cmd) {
            case BEGINPATH:
              debuglog("BEGINPATH");
              g.beginPath();
              break;
            case LINETO:
              debuglog("LINETO");
              loadtemp(0);
              g.lineTo(tmp[0], tmp[1]);
              break;
            case BEZIERTO:
              debuglog("BEZIERTO");
              loadtemp(0);
              var x1=tmp[0], y1=tmp[1];
              loadtemp(1);
              g.quadraticCurveTo(x1, y1, tmp[0], tmp[1]);
              break;
            case CUBICTO:
              debuglog("CUBICTO");
              loadtemp(0);
              var x1=tmp[0], y1=tmp[1];
              loadtemp(1);
              var x2=tmp[0], y2=tmp[1];
              loadtemp(2);
              g.bezierCurveTo(x1, y1, x2, y2, tmp[0], tmp[1]);
              break;
            case MOVETO:
              debuglog("MOVETO");
              loadtemp(0);
              g.moveTo(tmp[0], tmp[1]);
              break;
          }
      }
      if (clipMode) {
          return ;
      }
      var r=~~(this.color[0]*255), g1=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
      let fstyle="rgba("+r+","+g1+","+b+","+a+")";
      g.fillStyle = fstyle;
      debuglog2("g.fillStyle", g.fillStyle);
      var doff=2500;
      var do_blur=this.blur>1&&!clipMode;
      if (do_blur) {
          g.filter = "blur("+(this.blur*0.25*zoom)+"px)";
      }
      else {
        g.filter = "none";
      }
      debuglog2("fill");
      g.fill();
      if (this.clip_paths.length>0) {
          g.restore();
      }
    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(SimpleCanvasPath);
  _es6_module.add_class(SimpleCanvasPath);
  SimpleCanvasPath = _es6_module.add_export('SimpleCanvasPath', SimpleCanvasPath);
  class SimpleCanvasDraw2D extends VectorDraw {
    
    
    
    
     constructor() {
      super();
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
    }
    static  get_canvas(id, width, height, zindex) {
      var ret=document.getElementById(id);
      if (ret==undefined) {
          ret = document.createElement("canvas");
          ret.id = id;
      }
      ret.width = width;
      ret.height = height;
      if (ret.style!=undefined) {
          ret.style["z-index"] = zindex;
      }
      return ret;
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      var path=this.path_idmap[id];
      return check_z ? path.z==z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new SimpleCanvasPath();
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.dosort = 1;
          this.paths.push(this.path_idmap[id]);
      }
      var ret=this.path_idmap[id];
      if (check_z&&ret.z!=z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {
      console.warn("update called");
      for (let p of this.paths) {
          p.update();
      }
    }
    static  kill_canvas(svg) {

    }
     destroy() {

    }
     draw(g) {
      var canvas=g.canvas;
      this.canvas = canvas;
      this.g = g;
      g.save();
      g.resetTransform();
      for (var p of this.paths) {
          p.draw(this);
      }
      g.restore();
      return new Promise((accept, reject) =>        {
        accept();
      });
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
      this.zoom = matrix.$matrix.m11;
    }
  }
  _ESClass.register(SimpleCanvasDraw2D);
  _es6_module.add_class(SimpleCanvasDraw2D);
  SimpleCanvasDraw2D = _es6_module.add_export('SimpleCanvasDraw2D', SimpleCanvasDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_canvas2d_simple.js');
es6_module_define('vectordraw_svg', ["./vectordraw_base.js", "../util/mathlib.js", "../config/config.js"], function _vectordraw_svg_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  var VectorVertex=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorVertex');
  var QuadBezPath=es6_import_item(_es6_module, './vectordraw_base.js', 'QuadBezPath');
  var VectorDraw=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorDraw');
  var canvaspath_draw_mat_tmps=new cachering((_) =>    {
    return new Matrix4();
  }, 16);
  var canvaspath_draw_args_tmps=new Array(8);
  for (var i=1; i<canvaspath_draw_args_tmps.length; i++) {
      canvaspath_draw_args_tmps[i] = new Array(i);
  }
  var canvaspath_draw_vs=new cachering(function () {
    return new Vector2();
  }, 32);
  var CCMD=0, CARGLEN=1;
  var MOVETO=0, BEZIERTO=1, LINETO=2, BEGINPATH=3;
  var NS="http://www.w3.org/2000/svg";
  var XLS="http://www.w3.org/1999/xlink";
  function makeElement(type, attrs) {
    if (attrs===undefined) {
        attrs = {};
    }
    var ret=document.createElementNS(NS, type);
    for (var k in attrs) {
        ret.setAttributeNS(null, k, attrs[k]);
    }
    return ret;
  }
  makeElement = _es6_module.add_export('makeElement', makeElement);
  class SVGPath extends QuadBezPath {
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.commands = [];
      this.recalc = 1;
      this.lastx = 0;
      this.lasty = 0;
      this._last_z = undefined;
      this._last_off = new Vector2();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.domnode = undefined;
      this.filternode = undefined;
      this.clip_users = new set();
      this.path_start_i = 0;
      this.first = true;
      this._mm = new MinMax(2);
    }
     update_aabb(draw, fast_mode=false) {
      var tmp=new Vector2();
      var mm=this._mm;
      var pad=this.pad = this.blur>0 ? this.blur*draw.zoom+15 : 0;
      mm.reset();
      if (fast_mode) {
          console.trace("FAST MODE!");
      }
      var prev=-1;
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        if (fast_mode&&prev!=BEGINPATH) {
            prev = cmd;
            i+=arglen;
            continue;
        }
        for (var j=0; j<arglen; j+=2) {
            tmp[0] = cs[i++], tmp[1] = cs[i++];
            tmp.multVecMatrix(draw.matrix);
            mm.minmax(tmp);
        }
        prev = cmd;
      }
      this.aabb[0].load(mm.min).subScalar(pad);
      this.aabb[1].load(mm.max).addScalar(pad);
    }
     beginPath() {
      this.path_start_i = this.commands.length;
      this._pushCmd(BEGINPATH);
    }
     undo() {
      this.commands.length = this.path_start_i;
    }
     _pushCmd() {
      this.commands.push(arguments[0]);
      var arglen=arguments.length-1;
      this.commands.push(arglen);
      for (var i=0; i<arglen; i++) {
          this.commands.push(arguments[i+1]);
      }
      this.recalc = 1;
      this.first = false;
    }
     moveTo(x, y) {
      this._pushCmd(MOVETO, x, y);
      this.lastx = x;
      this.lasty = y;
    }
     bezierTo(x2, y2, x3, y3) {
      this._pushCmd(BEZIERTO, x2, y2, x3, y3);
      this.lastx = x3;
      this.lasty = y3;
    }
     lineTo(x2, y2) {
      if (this.first) {
          this.moveTo(x2, y2);
          return ;
      }
      this._pushCmd(LINETO, x2, y2);
      this.lastx = x2;
      this.lasty = y2;
    }
     destroy(draw) {
      if (this.domnode!=undefined) {
          this.domnode.remove();
          this.domnode = undefined;
      }
      if (this.filternode!=undefined) {
          this.filternode.remove();
          this.filternode = undefined;
      }
      if (this.usenode!=undefined) {
          this.usenode.remove();
          this.usenode = undefined;
      }
    }
     get_dom_id(draw) {
      return draw.svg.id+"_path_"+this.id;
    }
     gen(draw, _check_tag=0) {
      if (_check_tag&&!this.recalc) {
          console.log("infinite loop in clip stack");
          return ;
      }
      this.recalc = 0;
      var do_clip=this.clip_paths.length>0;
      var do_blur=this.blur>0.0;
      this.update_aabb(draw);
      var w=this.size[0] = Math.ceil(this.aabb[1][0]-this.aabb[0][0]);
      var h=this.size[1] = Math.ceil(this.aabb[1][1]-this.aabb[0][1]);
      if (w>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE||h>config.MAX_CANVAS2D_VECTOR_CACHE_SIZE) {
          var w2=Math.min(w, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
          var h2=Math.min(h, config.MAX_CANVAS2D_VECTOR_CACHE_SIZE);
          var dw=w-w2, dh=h-h2;
          this.aabb[0][0]+=dw*0.5;
          this.aabb[0][1]+=dh*0.5;
          this.aabb[1][0]-=dw*0.5;
          this.aabb[1][1]-=dh*0.5;
          this.size[0] = w2;
          this.size[1] = h2;
          w = w2, h = h2;
      }
      var domid=this.get_dom_id(draw);
      var node=this.domnode;
      if (node==undefined) {
          node = this.domnode = document.getElementById(domid);
          if (node==undefined) {
              node = this.domnode = makeElement("path");
              node.id = domid;
              node.setAttributeNS(null, "id", domid);
              draw.defs.appendChild(node);
              var useid=domid+"_use";
              var usenode=document.getElementById(useid);
              if (usenode!=undefined) {
                  usenode.remove();
              }
              usenode = makeElement("use", {"id": useid});
              usenode.setAttributeNS(XLS, "xlink:href", "#"+domid);
              draw.group.appendChild(usenode);
              this.usenode = usenode;
          }
      }
      if (this.usenode==undefined) {
          this.usenode = document.getElementById(domid+"_use");
      }
      for (var i=0; i<draw.group.childNodes.length; i++) {
          if (draw.group.childNodes[i]===this.usenode) {
              this._last_z = i;
              break;
          }
      }
      var fid=draw.svg.id+"_"+this.id+"_blur";
      var blur, filter;
      if (this.blur*draw.zoom>1) {
          if (this.filternode==undefined) {
              filter = this.filternode = document.getElementById(fid);
          }
          else {
            filter = this.filternode;
          }
          var w2=w-this.pad*2, h2=h-this.pad*2;
          var wratio=2.0*(w/w2)*100.0, hratio=2.0*(h/h2)*100.0;
          var fx=""+(-wratio/4)+"%", fy=""+(-hratio/4)+"%", fwidth=""+wratio+"%", fheight=""+hratio+"%";
          if (filter==undefined) {
              var defs=draw.defs;
              var filter=this.filternode = makeElement("filter", {id: fid, 
         x: fx, 
         y: fy, 
         width: fwidth, 
         height: fheight});
              var blur=makeElement("feGaussianBlur", {stdDeviation: ~~(this.blur*draw.zoom*0.5), 
         "in": "SourceGraphic"});
              filter.appendChild(blur);
              defs.appendChild(filter);
              node.setAttributeNS(null, "filter", "url(#"+fid+")");
          }
          else {
            if (filter.getAttributeNS(null, "x")!=fx)
              filter.setAttributeNS(null, "x", fx);
            if (filter.getAttributeNS(null, "y")!=fy)
              filter.setAttributeNS(null, "y", fy);
            if (filter.getAttributeNS(null, "width")!=fwidth)
              filter.setAttributeNS(null, "width", fwidth);
            if (filter.getAttributeNS(null, "height")!=fheight)
              filter.setAttributeNS(null, "hratio", fheight);
            blur = filter.childNodes[0];
            if (!blur.hasAttributeNS(null, "stdDeviation")||parseFloat(blur.getAttributeNS(null, "stdDeviation"))!=~~(this.blur*draw.zoom*0.5)) {
                blur.setAttributeNS(null, "stdDeviation", ~~(this.blur*draw.zoom*0.5));
            }
          }
      }
      else 
        if (this.filternode!=undefined) {
          node.removeAttributeNS(null, "filter");
          this.filternode.remove();
          this.filternode = undefined;
      }
      var clipid=draw.svg.id+"_"+this.id+"_clip";
      if (this.clip_paths.length>0) {
          var clip=this.clipnode;
          if (clip==undefined) {
              clip = this.clipnode = document.getElementById(clipid);
          }
          if (clip==undefined) {
              clip = this.clipnode = makeElement("clipPath", {id: clipid});
              draw.defs.appendChild(clip);
              for (var path of this.clip_paths) {
                  if (path.recalc) {
                      console.log("  clipping subgen!");
                      path.gen(draw, 1);
                  }
                  var usenode=makeElement("use");
                  usenode.setAttributeNS(XLS, "xlink:href", "#"+path.domnode.getAttributeNS(null, "id"));
                  clip.appendChild(usenode);
              }
          }
          node.setAttributeNS(null, "clip-path", "url(#"+clipid+")");
      }
      else 
        if (this.clipnode!=undefined) {
          node.removeAttributeNS(null, "clip-path");
          this.clipnode.remove();
          this.clipnode = undefined;
      }
      var mat=canvaspath_draw_mat_tmps.next();
      mat.load(draw.matrix);
      var co=canvaspath_draw_vs.next().zero();
      if (node==undefined) {
          node = document.getElementById(domid);
          console.log("undefined node!", this.domnode, document.getElementById(domid), domid);
          return ;
      }
      var r=~~(this.color[0]*255), g=~~(this.color[1]*255), b=~~(this.color[2]*255), a=this.color[3];
      node.setAttributeNS(null, "fill", "rgba("+r+","+g+","+b+","+a+")");
      var d="";
      var cs=this.commands, i=0;
      while (i<cs.length) {
        var cmd=cs[i++];
        var arglen=cs[i++];
        var tmp=canvaspath_draw_args_tmps[arglen];
        var h=parseFloat(draw.svg.getAttributeNS(null, "height"));
        for (var j=0; j<arglen; j+=2) {
            co[0] = cs[i++], co[1] = cs[i++];
            co.multVecMatrix(mat);
            if (isNaN(co[0])) {
                co[0] = 0;
            }
            if (isNaN(co[1])) {
                co[1] = 0;
            }
            tmp[j] = co[0], tmp[j+1] = co[1];
        }
        switch (cmd) {
          case MOVETO:
            d+="M"+tmp[0]+" "+tmp[1];
            break;
          case LINETO:
            d+="L"+tmp[0]+" "+tmp[1];
            break;
          case BEZIERTO:
            d+="Q"+tmp[0]+" "+tmp[1]+" "+tmp[2]+" "+tmp[3];
            break;
          case BEGINPATH:
            break;
        }
      }
      node.setAttributeNS(null, "d", d);
    }
     reset(draw) {
      this.commands.length = 0;
      this.path_start_i = 0;
      this.off.zero();
      this._last_off[0] = this._last_off[1] = 1e+17;
      this.first = true;
    }
     draw(draw, offx=0, offy=0, canvas=draw.canvas, g=draw.g) {
      offx+=this.off[0], offy+=this.off[1];
      this._last_z = this.z;
      if (this.recalc) {
          this.recalc = 0;
          this.gen(draw);
      }
      if (this._last_off[0]!=offx||this._last_off[1]!=offy) {
          this._last_off[0] = offx;
          this._last_off[1] = offy;
          var transform="translate("+offx+","+offy+")";
          this.usenode.setAttributeNS(null, "transform", transform);
      }
    }
     update() {
      this.recalc = 1;
    }
  }
  _ESClass.register(SVGPath);
  _es6_module.add_class(SVGPath);
  SVGPath = _es6_module.add_export('SVGPath', SVGPath);
  class SVGDraw2D extends VectorDraw {
    
    
    
    
     constructor() {
      super();
      this.paths = [];
      this.path_idmap = {};
      this.dosort = true;
      this.matstack = new Array(256);
      this.matrix = new Matrix4();
      for (var i=0; i<this.matstack.length; i++) {
          this.matstack[i] = new Matrix4();
      }
      this.matstack.cur = 0;
    }
    static  get_canvas(id, width, height, zindex) {
      var ret=document.getElementById(id);
      if (ret==undefined) {
          ret = makeElement("svg", {width: width, 
       height: height});
          ret.id = id;
          ret.setAttributeNS(null, "id", id);
          ret.style["position"] = "absolute";
          ret.style["z-index"] = zindex;
          console.trace("\tZINDEX: ", zindex);
          document.body.appendChild(ret);
      }
      if (ret.width!=width) {
          ret.setAttributeNS(null, "width", width);
      }
      if (ret.height!=height) {
          ret.setAttributeNS(null, "height", height);
      }
      return ret;
    }
     has_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          return false;
      }
      var path=this.path_idmap[id];
      return check_z ? path.z==z : true;
    }
     get_path(id, z, check_z=true) {
      if (z===undefined) {
          throw new Error("z cannot be undefined");
      }
      if (!(id in this.path_idmap)) {
          this.path_idmap[id] = new SVGPath();
          this.path_idmap[id].index = this.paths.length;
          this.path_idmap[id].id = id;
          this.paths.push(this.path_idmap[id]);
      }
      var ret=this.path_idmap[id];
      if (check_z&&ret.z!=z) {
          this.dosort = 1;
          ret.z = z;
      }
      return ret;
    }
     update() {
      for (var path of this.paths) {

      }
    }
    static  kill_canvas(svg) {
      if (svg!=undefined) {
          svg.remove();
      }
    }
     destroy() {
      return ;
      console.log("DESTROY!");
      for (var path of this.paths) {
          path.destroy(this);
      }
      this.paths.length = 0;
      this.path_idmap = {};
      if (this.svg!=undefined) {
          this.svg.remove();
          this.svg = this.defs = undefined;
      }
    }
     draw(g) {
      var canvas=g.canvas;
      if (canvas.style["background"]!="rgba(0,0,0,0)") {
          canvas.style["background"] = "rgba(0,0,0,0)";
      }
      this.svg = SVGDraw2D.get_canvas(canvas.id+"_svg", canvas.width, canvas.height, 1);
      var this2=this;
      function onkillscreen() {
        window.removeEventListener(onkillscreen);
        SVGDraw2D.kill_canvas(this2.svg);
        this2.svg = undefined;
      }
      window.addEventListener("killscreen", onkillscreen);
      var defsid=this.svg.id+"_defs";
      var defs=document.getElementById(defsid);
      if (defs==undefined) {
          defs = makeElement("defs", {id: defsid});
          defs.id = defsid;
          this.svg.appendChild(defs);
      }
      this.defs = defs;
      var groupid=this.svg.id+"_maingroup";
      var group=document.getElementById(groupid);
      if (group==undefined) {
          group = makeElement("g", {id: groupid});
          this.svg.appendChild(group);
      }
      this.group = group;
      var transform="translate("+this.pan[0]+","+this.pan[1]+")";
      if (!group.hasAttributeNS(null, "transform")||group.getAttributeNS(null, "transform")!=transform) {
          group.setAttributeNS(null, "transform", transform);
      }
      if (this.svg.style["left"]!=canvas.style["left"])
        this.svg.style["left"] = canvas.style["left"];
      if (this.svg.style["top"]!=canvas.style["top"])
        this.svg.style["top"] = canvas.style["top"];
      for (var path of this.paths) {
          if (path.z!=path._last_z) {
              this.dosort = 1;
              path.recalc = 1;
              path._last_z = path.z;
          }
      }
      for (var path of this.paths) {
          if (path.recalc) {
              path.gen(this);
          }
      }
      if (this.dosort) {
          console.log("SVG sort!");
          this.dosort = 0;
          this.paths.sort(function (a, b) {
            return a.z-b.z;
          });
          var cs=this.group.childNodes;
          for (var i=0; i<cs.length; i++) {
              var n=cs[i];
              if (n.tagName.toUpperCase()=="USE") {
                  n.remove();
                  i--;
              }
          }
          for (var path of this.paths) {
              if (path.hidden) {
                  path.usenode = undefined;
                  continue;
              }
              var useid=path.get_dom_id(this)+"_use";
              var usenode=path.usenode = makeElement("use", {"id": useid});
              usenode.setAttributeNS(XLS, "xlink:href", "#"+path.get_dom_id(this));
              path._last_off[0] = path._last_off[1] = 1e+17;
              this.group.appendChild(usenode);
          }
      }
      for (var path of this.paths) {
          if (!path.hidden)
            path.draw(this);
      }
    }
     set_matrix(matrix) {
      super.set_matrix(matrix);
      this.zoom = matrix.$matrix.m11;
    }
  }
  _ESClass.register(SVGDraw2D);
  _es6_module.add_class(SVGDraw2D);
  SVGDraw2D = _es6_module.add_export('SVGDraw2D', SVGDraw2D);
}, '/dev/fairmotion/src/vectordraw/vectordraw_svg.js');
es6_module_define('vectordraw_canvas2d_jobs', [], function _vectordraw_canvas2d_jobs_module(_es6_module) {
}, '/dev/fairmotion/src/vectordraw/vectordraw_canvas2d_jobs.js');
es6_module_define('vectordraw_jobs', ["./vectordraw_jobs_base.js", "../../platforms/platform.js", "../path.ux/scripts/util/simple_events.js", "../core/eventmanager.js", "../config/config.js"], function _vectordraw_jobs_module(_es6_module) {
  "use strict";
  var eventmanager=es6_import(_es6_module, '../core/eventmanager.js');
  var MESSAGES=es6_import_item(_es6_module, './vectordraw_jobs_base.js', 'MESSAGES');
  let MS=MESSAGES;
  let Debug=0;
  let freeze_while_drawing=false;
  var platform=es6_import(_es6_module, '../../platforms/platform.js');
  var config=es6_import(_es6_module, '../config/config.js');
  var pushModalLight=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'popModalLight');
  var keymap=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'keymap');
  let MAX_THREADS=platform.app.numberOfCPUs()+1;
  MAX_THREADS = Math.max(MAX_THREADS, 2);
  if (config.HTML5_APP_MODE) {
      MAX_THREADS = 1;
  }
  window.MAX_THREADS = MAX_THREADS;
  class Thread  {
    
    
    
    
    
    
    
    
     constructor(worker, id, manager) {
      this.id = id;
      this.manager = manager;
      this.worker = worker;
      this.dead = false;
      this.queue = [];
      this.ready = false;
      this.lock = 0;
      this.owner = undefined;
      this.msgstate = undefined;
      worker.onmessage = this.onmessage.bind(this);
      this.ondone = null;
      this.callbacks = {};
      this.ownerid_msgid_map = {};
      this.msgid_ownerid_map = {};
      this.cancelset = new Set();
      this.freezelvl = 0;
    }
     cancelRenderJob(ownerid) {
      if (this.cancelset.has(ownerid)) {
          return ;
      }
      if (ownerid in this.ownerid_msgid_map) {
          if (Debug)
            console.log("cancelling job ", ownerid, "in thread", this.manager.threads.indexOf(this), "freezelvl:", this.freezelvl);
          this.freezelvl--;
          let oldid=this.msgid_ownerid_map[ownerid];
          this.postMessage(MS.CANCEL_JOB, oldid);
          delete this.ownerid_msgid_map[ownerid];
          delete this.msgid_ownerid_map[oldid];
      }
      else {
        if (Debug)
          console.log("Bad owner id", ownerid);
      }
    }
     postRenderJob(ownerid, commands, datablocks) {
      let id=this.manager._rthread_idgen++;
      if (Debug)
        console.log("thread", this.manager.threads.indexOf(this), "freezelvl:", this.freezelvl);
      this.freezelvl++;
      this.ownerid_msgid_map[ownerid] = id;
      this.msgid_ownerid_map[id] = ownerid;
      this.postMessage(MS.NEW_JOB, id, undefined);
      this.postMessage(MS.SET_COMMANDS, id, [commands.buffer]);
      if (datablocks!==undefined) {
          for (let block of datablocks) {
              this.postMessage(MS.ADD_DATABLOCK, id, [block]);
          }
      }
      return new Promise((accept, reject) =>        {
        let callback=(data) =>          {
          accept(data);
        }
        this.callbacks[id] = callback;
        this.postMessage(MS.RUN, id);
      });
    }
     clearOutstandingJobs() {
      this.freezelvl = 0;
      this.postMessage(MS.CLEAR_QUEUE, 0);
      this.callback = {};
      this.msgid_ownerid_map = {};
      this.ownerid_msgid_map = {};
    }
     onmessage(e) {
      switch (e.data.type) {
        case MS.WORKER_READY:
          console.log("%c Vectordraw worker ready", "color: blue");
          this.ready = true;
          this.manager.has_ready_thread = true;
          break;
        case MS.RESULT:
          let id=e.data.msgid;
          if (!(id in this.callbacks)) {
              if (Debug)
                console.warn("Renderthread callback not found for: ", id);
              return ;
          }
          let ownerid=this.msgid_ownerid_map[id];
          if (ownerid===undefined) {
              if (Debug)
                console.log("failed to find owner for", id, this);
              return ;
          }
          delete this.ownerid_msgid_map[ownerid];
          delete this.msgid_ownerid_map[id];
          let cb=this.callbacks[id];
          delete this.callbacks[id];
          this.freezelvl--;
          if (Debug)
            console.log("thread", this.manager.threads.indexOf(this), "freezelvl:", this.freezelvl);
          if (Debug)
            console.log(cb, e.data.data[0]);
          cb(e.data.data[0]);
          if (this.freezelvl<=0) {
              this.manager.on_thread_done(this);
              this.freezelvl = 0;
          }
          break;
      }
      if (Debug)
        console.log("event message in main thread", e);
    }
     tryLock(owner) {
      if (this.lock==0||this.owner===owner) {
          return true;
      }
      return false;
    }
     tryUnlock(owner) {
      if (this.lock==0||this.owner!==owner) {
          return false;
      }
      this.owner = undefined;
      this.lock = 0;
      return true;
    }
     postMessage(type, msgid, transfers) {
      this.worker.postMessage({type: type, 
     msgid: msgid, 
     data: transfers}, transfers);
    }
     close() {
      if (this.worker!==undefined) {
          this.worker.terminate();
          this.worker = undefined;
      }
      else {
        console.warn("Worker already killed once", this.id);
      }
    }
  }
  _ESClass.register(Thread);
  _es6_module.add_class(Thread);
  Thread = _es6_module.add_export('Thread', Thread);
  class ThreadManager  {
    
    
    
    
     constructor() {
      this.threads = [];
      this.drawing = false;
      this.thread_idmap = {};
      this._idgen = 0;
      this._rthread_idgen = 0;
      this.max_threads = MAX_THREADS;
      this.start_time = undefined;
      window.setInterval(() =>        {
        if (this.drawing&&time_ms()-this.start_time>750) {
            console.log("Draw timed out; aborting draw freeze");
            this.endDrawing();
        }
        return ;
      }, 750);
    }
     setMaxThreads(n) {
      if (n===undefined||typeof n!="number"||n<0) {
          throw new Error("n must be a number");
      }
      this.max_threads = n;
      while (this.threads.length>n) {
        let thread=this.threads.pop();
        thread.worker.terminate();
      }
      while (this.threads.length<n) {
        if (config.HAVE_SKIA) {
            this.spawnThread("vectordraw_skia_worker.js");
        }
        else {
          this.spawnThread("vectordraw_canvas2d_worker.js");
        }
      }
    }
     startDrawing() {
      this.drawing = true;
      this.start_time = time_ms();
      if (freeze_while_drawing) {
          console.log("%cFreeze Drawing", "color : orange;");
          window._block_drawing = true;
      }
    }
     endDrawing() {
      this.drawing = false;
      if (freeze_while_drawing) {
          console.log("%cUnfreeze Drawing", "color : orange;");
          window._block_drawing = false;
      }
    }
     spawnThread(source) {
      let worker=new Worker(source);
      let thread=new Thread(worker, this._idgen++, this);
      this.thread_idmap[thread.id] = thread;
      this.threads.push(thread);
      return thread;
    }
     endThread(thread) {
      if (thread.worker===undefined) {
          console.warn("Double call to ThreadManager.endThread()");
          return ;
      }
      this.threads.remove(thread);
      delete this.thread_idmap[thread.id];
      thread.close();
    }
     getRandomThread() {
      while (1) {
        let ri=~~(Math.random()*this.threads.length*0.99999);
        if (this.threads[ri].ready)
          return this.threads[ri];
      }
    }
     postRenderJob(ownerid, commands, datablocks) {
      if (!this.drawing&&freeze_while_drawing) {
          this.startDrawing();
      }
      let thread;
      if (this.threads.length===0) {
          thread = this.spawnThread("vectordraw_canvas2d_worker.js");
          thread.ready = true;
          for (let i=0; i<this.max_threads-1; i++) {
              if (config.HAVE_SKIA) {
                  this.spawnThread("vectordraw_skia_worker.js");
              }
              else {
                this.spawnThread("vectordraw_canvas2d_worker.js");
              }
          }
      }
      else {
        thread = this.getRandomThread();
      }
      let ret=thread.postRenderJob(ownerid, commands, datablocks);
      return ret;
    }
     on_thread_done(thread) {
      let ok=true;
      for (let thread2 of this.threads) {
          if (thread2.freezelvl>0) {
              ok = false;
              break;
          }
      }
      if (ok) {
          if (Debug)
            console.warn("thread done");
          window._all_draw_jobs_done();
          if (this.drawing&&freeze_while_drawing) {
              this.endDrawing();
          }
          this.checkMemory();
      }
    }
     checkMemory() {
      let promise=platform.app.getProcessMemoryPromise();
      if (!promise)
        return ;
      promise.then((memory) =>        {      });
    }
     cancelAllJobs() {
      for (let thread of this.threads) {
          thread.clearOutstandingJobs();
          this.on_thread_done(thread);
      }
    }
     cancelRenderJob(ownerid) {
      for (let thread of this.threads) {
          if (ownerid in thread.ownerid_msgid_map) {
              thread.cancelRenderJob(ownerid);
          }
      }
    }
  }
  _ESClass.register(ThreadManager);
  _es6_module.add_class(ThreadManager);
  ThreadManager = _es6_module.add_export('ThreadManager', ThreadManager);
  var manager=new ThreadManager();
  manager = _es6_module.add_export('manager', manager);
  function test() {
    let thread=manager.spawnThread("vectordraw_canvas2d_worker.js");
    thread.postMessage("yay", [new ArrayBuffer(512)]);
    return thread;
  }
  test = _es6_module.add_export('test', test);
}, '/dev/fairmotion/src/vectordraw/vectordraw_jobs.js');
es6_module_define('vectordraw_jobs_base', [], function _vectordraw_jobs_base_module(_es6_module) {
  var OPCODES={LINESTYLE: 0, 
   LINEWIDTH: 1, 
   FILLSTYLE: 2, 
   BEGINPATH: 3, 
   CLOSEPATH: 4, 
   MOVETO: 5, 
   LINETO: 6, 
   RECT: 7, 
   ARC: 8, 
   CUBIC: 9, 
   QUADRATIC: 10, 
   STROKE: 11, 
   FILL: 12, 
   SAVE: 13, 
   RESTORE: 14, 
   TRANSLATE: 15, 
   ROTATE: 16, 
   SCALE: 17, 
   SETBLUR: 18, 
   SETCOMPOSITE: 19, 
   CLIP: 20, 
   DRAWIMAGE: 21, 
   PUTIMAGE: 22, 
   SETTRANSFORM: 23}
  OPCODES = _es6_module.add_export('OPCODES', OPCODES);
  var MESSAGES={NEW_JOB: 0, 
   ADD_DATABLOCK: 1, 
   SET_COMMANDS: 2, 
   RUN: 3, 
   ERROR: 10, 
   RESULT: 11, 
   ACK: 12, 
   CLEAR_QUEUE: 13, 
   CANCEL_JOB: 14, 
   WORKER_READY: 15}
  MESSAGES = _es6_module.add_export('MESSAGES', MESSAGES);
  var CompositeModes={"source-over": 0, 
   "source-atop": 1}
  CompositeModes = _es6_module.add_export('CompositeModes', CompositeModes);
}, '/dev/fairmotion/src/vectordraw/vectordraw_jobs_base.js');
es6_module_define('vectordraw', ["./vectordraw_stub.js", "./vectordraw_base.js", "./vectordraw_svg.js", "./vectordraw_canvas2d_simple.js", "./vectordraw_canvas2d.js"], function _vectordraw_module(_es6_module) {
  "use strict";
  var CanvasDraw2D=es6_import_item(_es6_module, './vectordraw_canvas2d.js', 'CanvasDraw2D');
  var CanvasPath=es6_import_item(_es6_module, './vectordraw_canvas2d.js', 'CanvasPath');
  var StubCanvasDraw2D=es6_import_item(_es6_module, './vectordraw_stub.js', 'StubCanvasDraw2D');
  var StubCanvasPath=es6_import_item(_es6_module, './vectordraw_stub.js', 'StubCanvasPath');
  var SVGDraw2D=es6_import_item(_es6_module, './vectordraw_svg.js', 'SVGDraw2D');
  var SVGPath=es6_import_item(_es6_module, './vectordraw_svg.js', 'SVGPath');
  let _ex_VectorFlags=es6_import_item(_es6_module, './vectordraw_base.js', 'VectorFlags');
  _es6_module.add_export('VectorFlags', _ex_VectorFlags, true);
  var SimpleCanvasPath=es6_import_item(_es6_module, './vectordraw_canvas2d_simple.js', 'SimpleCanvasPath');
  var SimpleCanvasDraw2D=es6_import_item(_es6_module, './vectordraw_canvas2d_simple.js', 'SimpleCanvasDraw2D');
  let Canvas=CanvasDraw2D;
  Canvas = _es6_module.add_export('Canvas', Canvas);
  let Path=CanvasPath;
  Path = _es6_module.add_export('Path', Path);
}, '/dev/fairmotion/src/vectordraw/vectordraw.js');
es6_module_define('strokedraw', [], function _strokedraw_module(_es6_module) {
  "use strict";
}, '/dev/fairmotion/src/vectordraw/strokedraw.js');
es6_module_define('spline_draw_new', ["../editors/viewport/selectmode.js", "./spline_base.js", "../util/mathlib.js", "./spline_types.js", "../vectordraw/vectordraw_jobs.js", "../vectordraw/vectordraw.js", "./spline_element_array.js", "../editors/viewport/view2d_editor.js", "./spline_multires.js", "../path.ux/scripts/pathux.js", "../core/animdata.js", "../config/config.js", "./spline_math.js"], function _spline_draw_new_module(_es6_module) {
  "use strict";
  var aabb_isect_minmax2d=es6_import_item(_es6_module, '../util/mathlib.js', 'aabb_isect_minmax2d');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var line_isect=es6_import_item(_es6_module, '../util/mathlib.js', 'line_isect');
  var line_line_cross4=es6_import_item(_es6_module, '../util/mathlib.js', 'line_line_cross4');
  var COLINEAR=es6_import_item(_es6_module, '../util/mathlib.js', 'COLINEAR');
  var LINECROSS=es6_import_item(_es6_module, '../util/mathlib.js', 'LINECROSS');
  var ENABLE_MULTIRES=es6_import_item(_es6_module, '../config/config.js', 'ENABLE_MULTIRES');
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var config=es6_import(_es6_module, '../config/config.js');
  var ClosestModes=es6_import_item(_es6_module, './spline_base.js', 'ClosestModes');
  var vectordraw_jobs=es6_import(_es6_module, '../vectordraw/vectordraw_jobs.js');
  var SessionFlags=es6_import_item(_es6_module, '../editors/viewport/view2d_editor.js', 'SessionFlags');
  var SelMask=es6_import_item(_es6_module, '../editors/viewport/selectmode.js', 'SelMask');
  var ORDER=es6_import_item(_es6_module, './spline_math.js', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, './spline_math.js', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, './spline_math.js', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, './spline_math.js', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, './spline_math.js', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, './spline_math.js', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, './spline_math.js', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, './spline_math.js', 'INT_STEPS');
  var get_vtime=es6_import_item(_es6_module, '../core/animdata.js', 'get_vtime');
  var iterpoints=es6_import_item(_es6_module, './spline_multires.js', 'iterpoints');
  var MultiResLayer=es6_import_item(_es6_module, './spline_multires.js', 'MultiResLayer');
  var MResFlags=es6_import_item(_es6_module, './spline_multires.js', 'MResFlags');
  var has_multires=es6_import_item(_es6_module, './spline_multires.js', 'has_multires');
  var spline_draw_cache_vs=cachering.fromConstructor(Vector3, 64);
  var spline_draw_trans_vs=cachering.fromConstructor(Vector3, 32);
  var PI=Math.PI;
  var pow=Math.pow, cos=Math.cos, sin=Math.sin, abs=Math.abs, floor=Math.floor, ceil=Math.ceil, sqrt=Math.sqrt, log=Math.log, acos=Math.acos, asin=Math.asin;
  var SplineFlags=es6_import_item(_es6_module, './spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, './spline_types.js', 'SplineTypes');
  var SplineElement=es6_import_item(_es6_module, './spline_types.js', 'SplineElement');
  var SplineVertex=es6_import_item(_es6_module, './spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, './spline_types.js', 'SplineSegment');
  var SplineLoop=es6_import_item(_es6_module, './spline_types.js', 'SplineLoop');
  var SplineLoopPath=es6_import_item(_es6_module, './spline_types.js', 'SplineLoopPath');
  var SplineFace=es6_import_item(_es6_module, './spline_types.js', 'SplineFace');
  var RecalcFlags=es6_import_item(_es6_module, './spline_types.js', 'RecalcFlags');
  var MaterialFlags=es6_import_item(_es6_module, './spline_types.js', 'MaterialFlags');
  var ElementArray=es6_import_item(_es6_module, './spline_element_array.js', 'ElementArray');
  var SplineLayerFlags=es6_import_item(_es6_module, './spline_element_array.js', 'SplineLayerFlags');
  var Canvas=es6_import_item(_es6_module, '../vectordraw/vectordraw.js', 'Canvas');
  var Path=es6_import_item(_es6_module, '../vectordraw/vectordraw.js', 'Path');
  var VectorFlags=es6_import_item(_es6_module, '../vectordraw/vectordraw.js', 'VectorFlags');
  window.FANCY_JOINS = true;
  var update_tmps_vs=new cachering(function () {
    return new Vector2();
  }, 64);
  var update_tmps_mats=new cachering(function () {
    return new Matrix4();
  }, 64);
  var draw_face_vs=new cachering(function () {
    return new Vector3();
  }, 32);
  var MAXCURVELEN=10000;
  class DrawParams  {
     constructor() {
      this.init.apply(this, arguments);
    }
     init(redraw_rects, actlayer, only_render, selectmode, zoom, z, off, spline, drawlist) {
      this.redraw_rects = redraw_rects, this.actlayer = actlayer, this.only_render = only_render, this.selectmode = selectmode, this.zoom = zoom, this.z = z, this.off = off, this.spline = spline;
      this.drawlist = drawlist;
      this.combine_paths = true;
      return this;
    }
  }
  _ESClass.register(DrawParams);
  _es6_module.add_class(DrawParams);
  DrawParams = _es6_module.add_export('DrawParams', DrawParams);
  var drawparam_cachering=new cachering(function () {
    return new DrawParams();
  }, 16);
  var CustomDataLayer=es6_import_item(_es6_module, './spline_types.js', 'CustomDataLayer');
  class SplineDrawData extends CustomDataLayer {
    
    
     constructor() {
      super();
      this.start = 0.0;
      this.end = 1.0;
    }
     copy(src) {
      return this;
    }
     gets(seg, v, margin=0.0) {
      if (!(__instance_of(seg, SplineSegment))) {
          throw new Error("invalid arguments to SplineDrawData.prototype.gets()");
      }
      return v===seg.v1 ? this.start-margin : this.end+margin;
    }
     sets(seg, v, s) {
      if (v===seg.v1) {
          this.start = s;
      }
      else 
        if (v===seg.v2) {
          this.end = s;
      }
      else {
        throw new Error("invalid arguments to SplineDrawData.prototype.sets()");
      }
      return this;
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
    }
    static  define() {
      return {typeName: "drawdata"}
    }
  }
  _ESClass.register(SplineDrawData);
  _es6_module.add_class(SplineDrawData);
  SplineDrawData = _es6_module.add_export('SplineDrawData', SplineDrawData);
  SplineDrawData.STRUCT = nstructjs.inherit(SplineDrawData, CustomDataLayer)+`
  start : float;
  end   : float;
}
`;
  class SplineDrawer  {
    
    
    
    
    
     constructor(spline, drawer=new Canvas()) {
      this.spline = spline;
      this.used_paths = {};
      this.recalc_all = false;
      this.drawer = drawer;
      this.last_totvert = 0;
      this.last_totseg = 0;
      this.last_totface = 0;
      if (!spline.segments.cdata.has_layer("drawdata")) {
          spline.segments.cdata.add_layer(SplineDrawData);
      }
      this.last_zoom = undefined;
      this.last_3_mat = undefined;
      this.last_stroke_z = undefined;
      this.last_stroke_eid = undefined;
      this.last_layer_id = undefined;
      this.last_stroke_stringid = undefined;
    }
     update(spline, drawlist, drawlist_layerids, matrix, redraw_rects, only_render, selectmode, master_g, zoom, editor, ignore_layers) {
      if (!spline.segments.cdata.has_layer("drawdata")) {
          spline.segments.cdata.add_layer(SplineDrawData);
      }
      this.used_paths = {};
      this.drawlist = drawlist;
      this.drawlist_layerids = drawlist_layerids;
      var actlayer=spline.layerset.active;
      var do_blur=!!(only_render||editor.enable_blur);
      var draw_faces=!!(only_render||editor.draw_faces);
      var recalc_all=this.recalc_all||this.draw_faces!==draw_faces||this.do_blur!==do_blur;
      recalc_all = recalc_all||spline.verts.length!==this.last_totvert;
      recalc_all = recalc_all||spline.segments.length!==this.last_totseg;
      recalc_all = recalc_all||spline.faces.length!==this.last_totface;
      if (recalc_all) {
      }
      this.last_totvert = spline.verts.length;
      this.last_totseg = spline.segments.length;
      this.last_totface = spline.faces.length;
      this.last_zoom = zoom;
      this.draw_faces = draw_faces;
      this.do_blur = do_blur;
      this.last_stroke_mat = undefined;
      this.last_stroke_z = undefined;
      this.last_stroke_eid = undefined;
      this.last_layer_id = undefined;
      this.last_stroke_stringid = undefined;
      let drawMatrix=matrix;
      var mat=update_tmps_mats.next();
      mat.load(matrix), matrix = mat;
      var mat2=update_tmps_mats.next();
      mat2.makeIdentity();
      mat2.translate(0.0, -master_g.height, 0.0);
      mat2.makeIdentity();
      mat2.translate(0.0, master_g.height, 0.0);
      mat2.scale(1.0, -1.0, 1.0);
      matrix.preMultiply(mat2);
      this.drawer.do_blur = editor.enable_blur;
      var m1=matrix.$matrix, m2=this.drawer.matrix.$matrix;
      var off=update_tmps_vs.next().zero();
      this.recalc_all = false;
      if (m1.m11!==m2.m11||m1.m22!==m2.m22) {
      }
      if (!recalc_all) {
          var a=update_tmps_vs.next().zero(), b=update_tmps_vs.next().zero();
          a.multVecMatrix(this.drawer.matrix);
          b.multVecMatrix(matrix);
          off.load(b).sub(a);
      }
      else {
        off.zero();
      }
      var m=matrix.$matrix;
      this.drawer.pan[0] = m.m41;
      this.drawer.pan[1] = m.m42;
      m.m41 = m.m42 = m.m43 = 0;
      this.drawer.set_matrix(drawMatrix);
      if (recalc_all) {
          this.drawer.recalcAll();
          if (1||DEBUG.trace_recalc_all) {
              console.log("%c RECALC_ALL!  ", "color:orange");
          }
      }
      var drawparams=drawparam_cachering.next().init(redraw_rects, actlayer, only_render, selectmode, zoom, undefined, off, spline, drawlist);
      let vset=new set();
      for (let seg of spline.segments.visible) {
          if (seg.flag&(SplineFlags.UPDATE|SplineFlags.REDRAW)) {
              vset.add(seg.v1);
              vset.add(seg.v2);
          }
      }
      for (let v of vset) {
          if (v.flag&(SplineFlags.UPDATE|SplineFlags.REDRAW)) {
              this.update_vertex_strokes(v, drawparams);
          }
      }
      for (var i=0; i<drawlist.length; i++) {
          var e=drawlist[i];
          var layerid=this.drawlist_layerids[i];
          if (e.flag&SplineFlags.HIDE)
            continue;
          if ((e.flag&SplineFlags.NO_RENDER)&&e.type!=SplineTypes.VERTEX&&(selectmode!=e.type||only_render))
            continue;
          var visible=false;
          for (var k in e.layers) {
              if (!(spline.layerset.get(k).flag&SplineLayerFlags.HIDE)) {
                  visible = true;
              }
          }
          if (!visible)
            continue;
          if (recalc_all) {
              e.flag|=SplineFlags.REDRAW;
          }
          drawparams.z = i;
          drawparams.combine_paths = true;
          if (e.type===SplineTypes.FACE) {
              this.update_polygon(e, redraw_rects, actlayer, only_render, selectmode, zoom, i, off, spline, ignore_layers);
          }
          else 
            if (e.type===SplineTypes.SEGMENT) {
              this.update_stroke(e, drawparams);
          }
          this.last_layer_id = this.drawlist_layerids[i];
      }
      for (var k in this.drawer.path_idmap) {
          if (!(k in this.used_paths)) {
              var path=this.drawer.path_idmap[k];
              this.drawer.remove(path);
          }
      }
      for (let v of vset) {
          v.flag&=~SplineFlags.REDRAW;
      }
    }
     get_path(id, z, check_z=true) {
      this.used_paths[id] = 1;
      var path;
      if (!this.has_path(id, z, check_z)) {
          path = this.drawer.get_path(id, z, check_z);
          path.frame_first = true;
      }
      else {
        path = this.drawer.get_path(id, z, check_z);
      }
      return path;
    }
     has_path(id, z, check_z=true) {
      this.used_paths[id] = 1;
      return this.drawer.has_path(id, z, check_z);
    }
     update_vertex_strokes(v, drawparams) {
      if (v.segments.length===0||!FANCY_JOINS) {
          return ;
      }
      if (!((v.flag&SplineFlags.BREAK_TANGENTS)||v.segments.length>2)) {
          for (let seg of v.segments) {
              let data=seg.cdata.get_layer(SplineDrawData);
              data.sets(seg, v, v===seg.v1 ? 0.0 : 1.0);
          }
          return ;
      }
      let debug=0;
      let dpath, dpath2, dpath3, dpoint, dline;
      if (debug) {
          dpath = this.get_path(eid|8192, z+10000);
          dpath2 = this.get_path(eid|16384, z+10001);
          dpath3 = this.get_path(eid|8192|16384, z+10002);
          dpath.color = [1, 0.25, 0.125, 0.5];
          dpath2.color = [0.25, 0.65, 1.0, 0.5];
          dpath3.color = [0.5, 1.0, 0.5, 0.5];
          dpath.reset();
          dpath2.reset();
          dpath3.reset();
          dpoint = (x, y, w, dp) =>            {
            if (w===undefined) {
                w = 4;
            }
            if (dp===undefined) {
                dp = dpath;
            }
            w*=0.5;
            dp.moveTo(x-w, y-w);
            dp.lineTo(x-w, y+w);
            dp.lineTo(x+w, y+w);
            dp.lineTo(x+w, y-w);
            dp.lineTo(x-w, y-w);
          };
          dline = (x1, y1, x2, y2, w, dp) =>            {
            if (w===undefined) {
                w = 0.5;
            }
            if (dp===undefined) {
                dp = dpath;
            }
            let dx=y1-y2, dy=x2-x1;
            let l=Math.sqrt(dx*dx+dy*dy);
            l = 0.5*w/l;
            dx*=l;
            dy*=l;
            dp.moveTo(x1-dx, y1-dy);
            dp.lineTo(x2-dx, y2-dy);
            dp.lineTo(x2+dx, y2+dy);
            dp.lineTo(x1+dx, y1+dy);
            dp.lineTo(x1-dx, y1-dy);
          };
      }
      let n1=new Vector2();
      let n2=new Vector2();
      let t1=new Vector2();
      let t2=new Vector2();
      let segments=this._sortSegments(v);
      let testIsect=() =>        {
        for (let seg1 of segments) {
            let data1=seg1.cdata.get_layer(SplineDrawData);
            let si1=segments.indexOf(seg1);
            let s1=data1.gets(seg1, v);
            for (let seg2 of segments) {
                if (seg1===seg2)
                  continue;
                let data2=seg2.cdata.get_layer(SplineDrawData);
                let si2=segments.indexOf(seg2);
                let s2=data2.gets(seg2, v);
                for (let i=0; i<2; i++) {
                    let p1a=seg1.evaluate(s1);
                    let p1b=seg1.evaluateSide(s1, i);
                    let cmode=v===seg2.v1 ? ClosestModes.START : ClosestModes.END;
                    cmode = ClosestModes.CLOSEST;
                    let p=seg2.closest_point(p1b, cmode);
                    if (p!==undefined) {
                        let lw2b=[0, 0];
                        let lw2c=[0, 0];
                        let p2b=seg2.evaluateSide(p[1], 0, undefined, n1, lw2b);
                        let p2c=seg2.evaluateSide(p[1], 1, undefined, n2, lw2c);
                        t1.load(p1b).sub(p[0]);
                        let wid;
                        let dist=t1.vectorLength();
                        t1.normalize();
                        n1.normalize();
                        if (t1.dot(n1)>=0) {
                            wid = lw2b[0]*0.5;
                        }
                        else {
                          wid = lw2c[0]*0.5;
                        }
                        if (dist<wid) {
                            return true;
                        }
                    }
                }
                for (let i=0; i<8; i++) {
                    break;
                    let side1=i%2, side2 = ~~(i/2);
                    let p1a=seg1.evaluate(s1);
                    let p1b=seg1.evaluateSide(s1, side1);
                    let p2a=seg2.evaluate(s2);
                    let p2b=seg2.evaluateSide(s2, side2);
                    if (line_line_cross4(p1a, p1b, p2a, p2b)) {
                        return true;
                    }
                }
            }
        }
        return false;
      };
      let seglen=0.0;
      for (let seg of segments) {
          seglen+=seg.length;
      }
      seglen/=segments.length;
      let a=0.0;
      let b=0.5;
      for (let i=0; i<8; i++) {
          let s=(a+b)*0.5;
          for (let seg of segments) {
              let data=seg.cdata.get_layer(SplineDrawData);
              let s2=s*seglen/seg.length;
              s2 = Math.min(Math.max(s2, 0.0), 1.0);
              data.sets(seg, v, v===seg.v1 ? s : 1.0-s);
          }
          if (testIsect()) {
              a = (a+b)*0.5;
          }
          else {
            b = (a+b)*0.5;
          }
      }
      let s=(a+b)*0.5;
      s*=1.2;
      s = Math.min(Math.max(s, 0.0), 1.0);
      for (let seg of segments) {
          let data=seg.cdata.get_layer(SplineDrawData);
          data.sets(seg, v, v===seg.v1 ? s : 1.0-s);
      }
    }
     _sortSegments(v) {
      let segments=([]).concat(v.segments);
      segments.sort((a, b) =>        {
        let dx1=a.other_vert(v)[0]-v[0];
        let dy1=a.other_vert(v)[1]-v[1];
        let dx2=b.other_vert(v)[0]-v[0];
        let dy2=b.other_vert(v)[1]-v[1];
        return Math.atan2(dy1, dx1)-Math.atan2(dy2, dx2);
      });
      let n1=new Vector2();
      let n2=new Vector2();
      let t1=new Vector2();
      let t2=new Vector2();
      let sum=0.0;
      for (let i=0; i<segments.length; i++) {
          let seg1=segments[i], seg2=segments[(i+1)%segments.length];
          t1[0] = seg1.other_vert(v)[0]-v[0];
          t1[1] = seg1.other_vert(v)[1]-v[1];
          t2[0] = seg2.other_vert(v)[0]-v[0];
          t2[1] = seg2.other_vert(v)[1]-v[1];
          t1.normalize();
          t2.normalize();
          let th=Math.abs(Math.acos(t1.dot(t2)));
          sum+=th;
      }
      let bad_corner=false;
      if (sum<Math.PI*1.99) {
          bad_corner = true;
          if (segments.length>2) {
              console.log("bad corner");
          }
      }
      segments.bad_corner = bad_corner;
      return segments;
    }
     update_stroke(seg, drawparams) {
      var redraw_rects=drawparams.redraw_rects, actlayer=drawparams.actlayer;
      var only_render=drawparams.only_render, selectmode=drawparams.selectmode;
      var zoom=drawparams.zoom, z=drawparams.z, off=drawparams.off, spline=drawparams.spline;
      var drawlist=drawparams.drawlist;
      var eid=seg.eid;
      let debug=0;
      let dpath, dpath2, dpath3, dpoint, dline;
      if (debug) {
          dpath = this.get_path(eid|8192, z+10000);
          dpath2 = this.get_path(eid|16384, z+10001);
          dpath3 = this.get_path(eid|8192|16384, z+10002);
          dpath.color = [1, 0.25, 0.125, 0.5];
          dpath2.color = [0.25, 0.65, 1.0, 0.5];
          dpath3.color = [0.5, 1.0, 0.5, 0.5];
          dpath.reset();
          dpath2.reset();
          dpath3.reset();
          dpoint = (x, y, w, dp) =>            {
            if (w===undefined) {
                w = 4;
            }
            if (dp===undefined) {
                dp = dpath;
            }
            w*=0.5;
            dp.moveTo(x-w, y-w);
            dp.lineTo(x-w, y+w);
            dp.lineTo(x+w, y+w);
            dp.lineTo(x+w, y-w);
            dp.lineTo(x-w, y-w);
          };
          dline = (x1, y1, x2, y2, w, dp) =>            {
            if (w===undefined) {
                w = 0.5;
            }
            if (dp===undefined) {
                dp = dpath;
            }
            let dx=y1-y2, dy=x2-x1;
            let l=Math.sqrt(dx*dx+dy*dy);
            if (l===0.0) {
                return ;
            }
            l = 0.5*w/l;
            dx*=l;
            dy*=l;
            dp.moveTo(x1-dx, y1-dy);
            dp.lineTo(x2-dx, y2-dy);
            dp.lineTo(x2+dx, y2+dy);
            dp.lineTo(x1+dx, y1+dy);
            dp.lineTo(x1-dx, y1-dy);
          };
      }
      if (this.has_path(eid, z, eid==seg.eid)&&!(seg.flag&SplineFlags.REDRAW)) {
          return ;
      }
      if (seg.eid===eid) {
          this.last_stroke_mat = seg.mat;
          this.last_stroke_eid = seg.eid;
          this.last_stroke_stringid = seg.stringid;
      }
      seg.flag&=~SplineFlags.REDRAW;
      var l=seg.ks[KSCALE]*zoom;
      let add=(Math.sqrt(l)/5);
      var steps=5+~~add;
      var ds=1.0/(steps-1), s=0.0;
      var path=this.get_path(eid, z, eid==seg.eid);
      path.update();
      path.was_updated = true;
      if (path.frame_first&&path.clip_paths.length>0) {
          path.reset_clip_paths();
          path.frame_first = false;
      }
      if (seg.l!==undefined&&(seg.mat.flag&MaterialFlags.MASK_TO_FACE)) {
          var l=seg.l, _i=0;
          do {
            var fz=l.f.finalz;
            if (fz>z) {
                l = l.radial_next;
                continue;
            }
            var path2=this.get_path(l.f.eid, fz);
            path.add_clip_path(path2);
            if (_i++>1000) {
                console.trace("Warning: infinite loop!");
                break;
            }
            l = l.radial_next;
          } while (l!==seg.l);
          
      }
      if (eid===seg.eid) {
          path.reset();
      }
      path.blur = seg.mat.blur*(this.do_blur ? 1 : 0);
      if (only_render) {
          path.color.load(seg.mat.strokecolor);
      }
      else {
        if ((selectmode&SelMask.SEGMENT)&&seg===spline.segments.highlight) {
            path.color[0] = 200/255, path.color[1] = 200/255, path.color[2] = 50/255, path.color[3] = 0.8;
        }
        else 
          if ((selectmode&SelMask.SEGMENT)&&seg===spline.segments.active) {
            path.color[0] = 200/255, path.color[1] = 80/255, path.color[2] = 50/255, path.color[3] = 0.8;
        }
        else 
          if ((selectmode&SelMask.SEGMENT)&&(seg.flag&SplineFlags.SELECT)) {
            path.color[0] = 250/255, path.color[1] = 140/255, path.color[2] = 50/255, path.color[3] = 0.8;
        }
        else {
          path.color.load(seg.mat.strokecolor);
        }
      }
      let lw=seg.mat.linewidth*0.5;
      var no=seg.normal(0).normalize().mulScalar(lw);
      var co=seg.evaluate(0).add(no);
      var fx=co[0], fy=co[1];
      var lastdv, lastco;
      var len=seg.length;
      let stretch=1.0075;
      let seglen=seg.length;
      let data=seg.cdata.get_layer(SplineDrawData);
      let starts=data.start, ends=data.end;
      let lwout=new Vector2();
      for (let vi=0; vi<2; vi++) {
          let v=vi ? seg.v2 : seg.v1;
          if (!FANCY_JOINS||!((v.flag&SplineFlags.BREAK_TANGENTS)||v.segments.length>2)) {
              continue;
          }
          let t0=new Vector2();
          let t1=new Vector2();
          let t2=new Vector2();
          let d0a=new Vector2();
          let d1a=new Vector2();
          let d2a=new Vector2();
          let d0b=new Vector2();
          let d1b=new Vector2();
          let d2b=new Vector2();
          let first=true;
          let fx=0, fy=0, lx=0, ly=0;
          lx = 0;
          ly = 0;
          let segments=this._sortSegments(v);
          if (segments.length>1) {
              let si=segments.indexOf(seg);
              let prev=(si+segments.length-1)%segments.length;
              let next=(si+1)%segments.length;
              prev = segments[prev];
              next = segments[next];
              let pdata=prev.cdata.get_layer(SplineDrawData);
              let ndata=next.cdata.get_layer(SplineDrawData);
              let margin=-0.001;
              let s0=pdata.gets(prev, v, margin);
              let s1=data.gets(seg, v, margin);
              let s2=ndata.gets(next, v, margin);
              let pa=prev.evaluateSide(s0, 1, d0a);
              let pb=prev.evaluateSide(s0, 0, d0b);
              let sa=seg.evaluateSide(s1, 0, d1a);
              let sb=seg.evaluateSide(s1, 1, d1b);
              let na=next.evaluateSide(s2, 1, d2a);
              let nb=next.evaluateSide(s2, 0, d2b);
              t0.load(prev.other_vert(v)).sub(v).normalize();
              t1.load(seg.other_vert(v)).sub(v).normalize();
              t2.load(next.other_vert(v)).sub(v).normalize();
              let th1=Math.abs(Math.acos(t0.dot(t1)));
              let th2=Math.abs(Math.acos(t1.dot(t2)));
              let th=th1+th2;
              sa[2] = sb[2] = pa[2] = pb[2] = na[2] = nb[2] = 0.0;
              let f0=(prev.v1===v);
              let f1=(seg.v1===v);
              let f2=(next.v1===v);
              if (f0) {
                  let t=pa;
                  pa = pb;
                  pb = t;
                  t = d0a;
                  d0a = d0b;
                  d0b = t;
                  d0a.negate();
                  d0b.negate();
              }
              if (f1) {
                  let t=sa;
                  sa = sb;
                  sb = t;
                  t = d1a;
                  d1a = d1b;
                  d1b = t;
                  d1a.negate();
                  d1b.negate();
              }
              if (f2) {
                  let t=na;
                  na = nb;
                  nb = t;
                  t = d2a;
                  d2a = d2b;
                  d2b = t;
                  d2a.negate();
                  d2b.negate();
              }
              if (isNaN(sa.dot(sa))) {
                  if (Math.random()>0.98) {
                      console.log("NaN!", sa, seg);
                  }
                  continue;
              }
              let sc=seg.evaluate(s1);
              if (segments.length===2) {
                  d0a.add(pa);
                  d0b.add(pb);
                  d1a.add(sa);
                  d1b.add(sb);
                  d2a.add(na);
                  d2b.add(nb);
                  let r=line_isect(pb, d0b, sb, d1b);
                  if (r[1]===COLINEAR) {
                      r = v;
                  }
                  else {
                    r = new Vector2(r[0]);
                    r.floor();
                  }
                  let r2=line_isect(pa, d0a, sa, d1a);
                  if (r2[1]===COLINEAR) {
                      r2 = v;
                  }
                  else {
                    r2 = new Vector2(r2[0]);
                    r2.floor();
                  }
                  path.moveTo(v[0], v[1]);
                  path.lineTo(r[0], r[1]);
                  path.lineTo(sb[0], sb[1]);
                  path.lineTo(sc[0], sc[1]);
                  path.lineTo(v[0], v[1]);
                  path.moveTo(v[0], v[1]);
                  path.lineTo(sc[0], sc[1]);
                  path.lineTo(sa[0], sa[1]);
                  path.lineTo(r2[0], r2[1]);
                  path.lineTo(v[0], v[1]);
              }
              else 
                if (1) {
                  pa.interp(sa, 0.5);
                  nb.interp(sb, 0.5);
                  if (debug) {
                  }
                  path.moveTo(sa[0], sa[1]);
                  path.lineTo(pa[0], pa[1]);
                  path.lineTo(v[0], v[1]);
                  path.lineTo(nb[0], nb[1]);
                  path.lineTo(sb[0], sb[1]);
              }
              else 
                if (0) {
                  if (segments.bad_corner&&debug&&th>Math.PI*0.5) {
                      dline(v[0], v[1], (sa[0]+sb[0])*0.5, (sa[1]+sb[1])*0.5, 4);
                  }
                  if (debug) {
                      dline(sa[0], sa[1], sb[0], sb[1], 4);
                      dpoint(sa[0], sa[1], 10, dpath3);
                      dpoint(sb[0], sb[1], 10, dpath2);
                  }
                  if (1||th>Math.PI*0.5) {
                      pa.interp(sa, 0.5);
                      nb.interp(sb, 0.5);
                      path.lineTo(sa[0], sa[1]);
                      if (th1<Math.PI*0.33333) {
                          path.lineTo(pa[0], pa[1]);
                      }
                      path.lineTo(v[0], v[1]);
                      if (th2<Math.PI*0.33333) {
                          path.lineTo(nb[0], nb[1]);
                      }
                      path.lineTo(sb[0], sb[1]);
                  }
                  else {
                    path.moveTo(pa[0], pa[1]);
                    path.lineTo(v[0], v[1]);
                    path.lineTo(nb[0], nb[1]);
                    path.lineTo(sb[0], sb[1]);
                    path.lineTo(sa[0], sa[1]);
                    path.lineTo(pa[0], pa[1]);
                  }
                  if (!first) {
                  }
                  else {
                    first = false;
                  }
                  lx = sa[0];
                  ly = sa[1];
              }
          }
          if (segments.bad_corner) {
          }
      }
      let margin=0.00125;
      starts-=margin;
      ends+=margin;
      s = starts;
      ds = (ends-starts)/(steps-1);
      for (let i=0; i<steps; i++, s+=ds) {
          let dv=seg.derivative(s);
          let co=seg.evaluateSide(s, 0, dv, undefined, lwout);
          dv.mulScalar(ds/3.0);
          if (i>0) {
              path.cubicTo(lastco[0]+lastdv[0], lastco[1]+lastdv[1], co[0]-dv[0], co[1]-dv[1], co[0], co[1], 1);
          }
          else {
            path.moveTo(co[0], co[1]);
          }
          lastdv = dv;
          lastco = co;
      }
      s = ends;
      for (let i=0; i<steps; i++, s-=ds) {
          let dv=seg.derivative(s);
          let co=seg.evaluateSide(s, 1, dv);
          dv.mulScalar(-ds/3.0);
          if (i>0) {
              path.cubicTo(lastco[0]+lastdv[0], lastco[1]+lastdv[1], co[0]-dv[0], co[1]-dv[1], co[0], co[1], 1);
          }
          else {
            path.lineTo(co[0], co[1]);
          }
          lastdv = dv;
          lastco = co;
      }
      s = ends;
      for (var i=0; i<steps; i++, s-=ds) {
          break;
          let dv=seg.derivative(s*stretch);
          let co=seg.evaluate(s*stretch);
          let k=-seglen*seg.curvature(s*stretch);
          let shift=-seg.shift(s*stretch);
          let dshift=-seg.dshift(s*stretch);
          let lw=seg.width(s*stretch);
          let dlw=seg.dwidth(s*stretch);
          dlw = dlw*shift+dlw+dshift*lw;
          lw = lw+lw*shift;
          lw = -lw;
          dlw = -dlw;
          co[0]+=-dv[1]*lw*0.5/seglen;
          co[1]+=dv[0]*lw*0.5/seglen;
          let dx=(-0.5*(dlw*dv[1]+dv[0]*k*lw-2*dv[0]*seglen))/seglen;
          let dy=(0.5*(dlw*dv[0]-dv[1]*k*lw+2*dv[1]*seglen))/seglen;
          dv[0] = dx;
          dv[1] = dy;
          dv.mulScalar(ds/3.0);
          if (debug*0) {
              dpoint(co[0], co[1], 9);
              dpoint(co[0]+dv[0], co[1]+dv[1]);
              dline(co[0], co[1], co[0]+dv[0], co[1]+dv[1]);
              if (i>0) {
                  dpoint(lastco[0], lastco[1], 9);
                  dpoint(lastco[0]-lastdv[0], lastco[1]-lastdv[1]);
                  dline(lastco[0], lastco[1], lastco[0]-lastdv[0], lastco[1]-lastdv[1]);
                  dline(co[0]+dv[0], co[1]+dv[1], lastco[0]-lastdv[0], lastco[1]-lastdv[1]);
              }
          }
          if (i>0) {
              path.cubicTo(lastco[0]-lastdv[0], lastco[1]-lastdv[1], co[0]+dv[0], co[1]+dv[1], co[0], co[1], 1);
          }
          else {
            path.lineTo(co[0], co[1]);
          }
          lastdv = dv;
          lastco = co;
      }
      var layer=undefined;
      for (var k in seg.layers) {
          layer = spline.layerset.get(k);
      }
      if (layer!==undefined&&(layer.flag&SplineLayerFlags.MASK)) {
          var li=spline.layerset.indexOf(layer);
          if (li<=0) {
              console.trace("Error in update_seg", layer, spline);
              return path;
          }
          var prev=spline.layerset[li-1];
          var i=drawparams.z;
          var layerid=layer.id;
          while (i>0&&layerid!==prev.id) {
            i--;
            for (var k in drawlist[i].layers) {
                layerid = k;
                if (layerid===prev.id)
                  break;
            }
          }
          while (i>=0&&layerid===prev.id) {
            var item=drawlist[i];
            if (item.type===SplineTypes.FACE) {
                var path2=this.get_path(item.eid, i);
                path.add_clip_path(path2);
            }
            i--;
            if (i<0)
              break;
            for (var k in drawlist[i].layers) {
                layerid = k;
                if (layerid===prev.id)
                  break;
            }
          }
      }
      return path;
    }
     update_polygon(f, redraw_rects, actlayer, only_render, selectmode, zoom, z, off, spline, ignore_layers) {
      if (this.has_path(f.eid, z)&&!(f.flag&SplineFlags.REDRAW)) {
          return ;
      }
      f.flag&=~SplineFlags.REDRAW;
      var path=this.get_path(f.eid, z);
      path.was_updated = true;
      path.hidden = !this.draw_faces;
      path.reset();
      path.blur = f.mat.blur*(this.do_blur ? 1 : 0);
      let c1=path.color;
      let c2=f.mat.fillcolor;
      if (c2===undefined) {
          f.mat.fillcolor = c2 = new Vector4([0, 0, 0, 1]);
      }
      if (c1&&c2) {
          c1[0] = c2[0];
          c1[1] = c2[1];
          c1[2] = c2[2];
          c1[3] = c2[3];
      }
      var lastco=draw_face_vs.next().zero();
      var lastdv=draw_face_vs.next().zero();
      for (var path2 of f.paths) {
          var first=true;
          for (var l of path2) {
              var seg=l.s;
              var length=seg.length;
              var flip=seg.v1!==l.v ? -1.0 : 1.0;
              var length=Math.min(seg.ks[KSCALE], MAXCURVELEN);
              var steps=6, s=flip<0.0 ? 1.0 : 0.0;
              var ds=(1.0/(steps-1))*flip;
              for (var i=0; i<steps; i++, s+=ds) {
                  var co=seg.evaluate(s*0.9998+1e-05);
                  var dv=seg.derivative(s*0.9998+1e-05);
                  var k=seg.curvature(s*0.9998+1e-05);
                  dv.mulScalar(ds/3.0);
                  if (first) {
                      first = false;
                      path.moveTo(co[0], co[1]);
                  }
                  else {
                    if (i==0||abs(k)<1e-05/zoom) {
                        path.lineTo(co[0], co[1]);
                    }
                    else {
                      var midx=(lastco[0]+lastdv[0]+co[0]-dv[0])*0.5;
                      var midy=(lastco[1]+lastdv[1]+co[1]-dv[1])*0.5;
                      path.cubicTo(lastco[0]+lastdv[0], lastco[1]+lastdv[1], co[0]-dv[0], co[1]-dv[1], co[0], co[1], 1);
                    }
                  }
                  lastco.load(co);
                  lastdv.load(dv);
              }
          }
      }
      if ((!ignore_layers&&!f.in_layer(actlayer))||only_render)
        return ;
      if ((selectmode&SelMask.FACE)&&f===spline.faces.highlight) {
          path.color[0] = 200/255, path.color[1] = 200/255, path.color[2] = 50/255, path.color[3] = 0.8;
      }
      else 
        if ((selectmode&SelMask.FACE)&&f===spline.faces.active) {
          path.color[0] = 200/255, path.color[1] = 80/255, path.color[2] = 50/255, path.color[3] = 0.8;
      }
      else 
        if ((selectmode&SelMask.FACE)&&(f.flag&SplineFlags.SELECT)) {
          path.color[0] = 250/255, path.color[1] = 140/255, path.color[2] = 50/255, path.color[3] = 0.8;
      }
      return path;
    }
     draw(g) {
      return this.drawer.draw(g);
    }
  }
  _ESClass.register(SplineDrawer);
  _es6_module.add_class(SplineDrawer);
  SplineDrawer = _es6_module.add_export('SplineDrawer', SplineDrawer);
  window._SplineDrawer = SplineDrawer;
}, '/dev/fairmotion/src/curve/spline_draw_new.js');
es6_module_define('license_api', ["../config/config.js", "./license_electron.js"], function _license_api_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  class License  {
     constructor(owner, email, issued, expiration, max_devices, used_devices, key) {
      this.owner = owner;
      this.email = email;
      this.issued = issued;
      this.expiration = expiration;
      this.max_devices = max_devices;
      this.used_devices = used_devices;
    }
  }
  _ESClass.register(License);
  _es6_module.add_class(License);
  License = _es6_module.add_export('License', License);
  var MAX_EXPIRATION_TIME=355;
  MAX_EXPIRATION_TIME = _es6_module.add_export('MAX_EXPIRATION_TIME', MAX_EXPIRATION_TIME);
  class HardwareKey  {
     constructor(deviceName, deviceKey) {
      this.deviceName = deviceName;
      this.deviceKey = deviceKey;
    }
  }
  _ESClass.register(HardwareKey);
  _es6_module.add_class(HardwareKey);
  HardwareKey = _es6_module.add_export('HardwareKey', HardwareKey);
  
  var license_electron=es6_import(_es6_module, './license_electron.js');
  function getHardwareKey() {
    if (config.ELECTRON_APP_MODE) {
        return license_electron.getHardwareKey(HardwareKey);
    }
    else {
      return new Error("can't get hardware key");
    }
  }
  getHardwareKey = _es6_module.add_export('getHardwareKey', getHardwareKey);
}, '/dev/fairmotion/src/license/license_api.js');
es6_module_define('license_electron', [], function _license_electron_module(_es6_module) {
  "use strict";
  function getHardwareKey(HardwareKeyCls) {
    var os=require('OS');
    var hostname=os.hostname();
    var platform=os.platform();
    var name=hostname;
    var key="electron_"+hostname+"_"+platform;
    return new HardwareKeyCls(name, key);
  }
  getHardwareKey = _es6_module.add_export('getHardwareKey', getHardwareKey);
}, '/dev/fairmotion/src/license/license_electron.js');
es6_module_define('theplatform', ["../common/platform_api.js"], function _theplatform_module(_es6_module) {
  var PlatformAPIBase=es6_import_item(_es6_module, '../common/platform_api.js', 'PlatformAPIBase');
  class ElectronPlatformAPI  {
     constructor() {

    }
     init() {

    }
     getProcessMemoryPromise() {
      return new Promise((accept, reject) =>        {
        require("process").getProcessMemoryInfo().then((data) =>          {
          let blink=require("process").getBlinkMemoryInfo();
          accept(data.private*1024+blink.total*1024);
        });
      });
    }
     errorDialog(title, msg) {
      alert(title+": "+msg);
    }
     saveFile(path_handle, name, databuf, type) {
      let fs=require("fs");
      console.warn("TESTME");
      return new Promise((accept, reject) =>        {
        fs.writeFile(path_handle, databuf, () =>          {
          accept();
        });
      });
    }
     openFile(path_handle) {
      let fs=require("fs");
      return new Promise((accept, reject) =>        {
        let buf;
        try {
          buf = fs.readFileSync(path_handle);
        }
        catch (error) {
            return reject(error.toString());
        }
        accept(buf);
      });
    }
     numberOfCPUs() {
      let os=require("os");
      let cpus=os.cpus();
      let tot=0;
      for (let cpu of cpus) {
          if (cpu.model.toLowerCase().search("intel")>=0) {
              tot+=0.5;
          }
          else {
            tot+=1.0;
          }
      }
      tot = ~~Math.ceil(tot);
      console.log(tot, cpus);
      return tot;
    }
     saveDialog(name, databuf, type) {

    }
     openDialog(type) {

    }
     openLastFile() {

    }
     exitCatcher(handler) {

    }
     quitApp() {
      close();
    }
     alertDialog(msg) {
      return new Promise((accept, reject) =>        {
        alert(msg);
        accept();
      });
    }
     questionDialog(msg) {
      return new Promise((accept, reject) =>        {
        let ret=confirm(msg);
        accept(ret);
      });
    }
  }
  _ESClass.register(ElectronPlatformAPI);
  _es6_module.add_class(ElectronPlatformAPI);
  ElectronPlatformAPI = _es6_module.add_export('ElectronPlatformAPI', ElectronPlatformAPI);
  var app=new ElectronPlatformAPI();
  app = _es6_module.add_export('app', app);
}, '/dev/fairmotion/platforms/Electron/theplatform.js');
es6_module_define('platform_html5', ["../common/platform_api.js"], function _platform_html5_module(_es6_module) {
  var PlatformAPIBase=es6_import_item(_es6_module, '../common/platform_api.js', 'PlatformAPIBase');
  class PlatformAPI extends PlatformAPIBase {
     constructor() {
      super();
    }
     getProcessMemoryPromise() {
      return new Promise(() =>        {      });
    }
     saveDialog() {

    }
     openDialog() {

    }
     numberOfCPUs() {
      return navigator.hardwareConcurrency;
    }
     alertDialog(msg) {
      alert(msg);
    }
     questionDialog(msg) {
      return new Promise((accept, reject) =>        {
        accept(confirm(msg));
      });
    }
  }
  _ESClass.register(PlatformAPI);
  _es6_module.add_class(PlatformAPI);
  PlatformAPI = _es6_module.add_export('PlatformAPI', PlatformAPI);
  var PlatCapab={NativeAPI: false, 
   saveFile: false, 
   saveDialog: true, 
   openDialog: true, 
   openLastFile: false, 
   exitCatcher: false}
  PlatCapab = _es6_module.add_export('PlatCapab', PlatCapab);
}, '/dev/fairmotion/platforms/html5/platform_html5.js');
es6_module_define('platform_phonegap', ["../common/platform_api.js"], function _platform_phonegap_module(_es6_module) {
  var PlatformAPIBase=es6_import_item(_es6_module, '../common/platform_api.js', 'PlatformAPIBase');
  class PlatformAPI extends PlatformAPIBase {
     constructor() {
      super();
    }
     getProcessMemoryPromise() {
      return new Promise();
    }
     saveDialog() {

    }
     openDialog() {

    }
  }
  _ESClass.register(PlatformAPI);
  _es6_module.add_class(PlatformAPI);
  PlatformAPI = _es6_module.add_export('PlatformAPI', PlatformAPI);
  var PlatCapab={NativeAPI: false, 
   saveFile: false, 
   saveDialog: true, 
   openDialog: true, 
   openLastFile: false, 
   exitCatcher: false}
  PlatCapab = _es6_module.add_export('PlatCapab', PlatCapab);
  var app=new PlatformAPI();
  app = _es6_module.add_export('app', app);
}, '/dev/fairmotion/platforms/PhoneGap/platform_phonegap.js');
es6_module_define('platform_chromeapp', ["../common/platform_api.js"], function _platform_chromeapp_module(_es6_module) {
  var PlatformAPIBase=es6_import_item(_es6_module, '../common/platform_api.js', 'PlatformAPIBase');
  class PlatformAPI extends PlatformAPIBase {
     constructor() {
      super();
    }
     save_dialog() {

    }
     open_dialog() {

    }
  }
  _ESClass.register(PlatformAPI);
  _es6_module.add_class(PlatformAPI);
  PlatformAPI = _es6_module.add_export('PlatformAPI', PlatformAPI);
  var PlatCapab={NativeAPI: false, 
   save_file: false, 
   save_dialog: true, 
   open_dialog: true, 
   open_last_file: false, 
   exit_catcher: false}
  PlatCapab = _es6_module.add_export('PlatCapab', PlatCapab);
}, '/dev/fairmotion/platforms/chromeapp/platform_chromeapp.js');
es6_module_define('load_wasm', ["../../platforms/platform.js", "../config/config.js"], function _load_wasm_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  es6_import(_es6_module, '../../platforms/platform.js');
  var wasm_binary=undefined;
  wasm_binary = _es6_module.add_export('wasm_binary', wasm_binary);
  var wasmBinaryPath="";
  wasmBinaryPath = _es6_module.add_export('wasmBinaryPath', wasmBinaryPath);
  console.log("%cLoading wasm...", "color : green;");
  if (config.IS_NODEJS) {
      let fs=require('fs');
      window.wasmBinaryFile = undefined;
      wasm_binary = window.solverwasm_binary = fs.readFileSync(config.ORIGIN+"/fcontent/built_wasm.wasm");
      _es6_module.add_export('wasm_binary', wasm_binary);
  }
  else {
    let path=config.ORIGIN+"/fcontent/built_wasm.wasm";
    exports.wasmBinaryPath = path;
    _es6_module.add_export('wasmBinaryPath', path);
  }
}, '/dev/fairmotion/src/wasm/load_wasm.js');
es6_module_define('built_wasm', ["./load_wasm.js"], function _built_wasm_module(_es6_module) {
  var Module={}
  Module = _es6_module.set_default_export('Module', Module);
  
  var wasm_binary=es6_import_item(_es6_module, './load_wasm.js', 'wasm_binary');
  var wasmBinaryPath=es6_import_item(_es6_module, './load_wasm.js', 'wasmBinaryPath');
  Module.wasmBinary = wasm_binary;
  Module.INITIAL_MEMORY = 33554432;
  var wasmBinaryFile=wasmBinaryPath;
  var Module=typeof Module!=='undefined' ? Module : {}
  var moduleOverrides={}
  var key;
  for (key in Module) {
      if (Module.hasOwnProperty(key)) {
          moduleOverrides[key] = Module[key];
      }
  }
  var arguments_=[];
  var thisProgram='./this.program';
  var quit_=function (status, toThrow) {
    throw toThrow;
  }
  var ENVIRONMENT_IS_WEB=false;
  var ENVIRONMENT_IS_WORKER=false;
  var ENVIRONMENT_IS_NODE=false;
  var ENVIRONMENT_IS_SHELL=false;
  ENVIRONMENT_IS_WEB = typeof window==='object';
  ENVIRONMENT_IS_WORKER = typeof importScripts==='function';
  ENVIRONMENT_IS_NODE = typeof process==='object'&&typeof process.versions==='object'&&typeof process.versions.node==='string';
  ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB&&!ENVIRONMENT_IS_NODE&&!ENVIRONMENT_IS_WORKER;
  if (Module['ENVIRONMENT']) {
      throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)');
  }
  var scriptDirectory='';
  function locateFile(path) {
    if (Module['locateFile']) {
        return Module['locateFile'](path, scriptDirectory);
    }
    return scriptDirectory+path;
  }
  var read_, readAsync, readBinary, setWindowTitle;
  var nodeFS;
  var nodePath;
  if (ENVIRONMENT_IS_NODE) {
      if (ENVIRONMENT_IS_WORKER) {
          scriptDirectory = require('path').dirname(scriptDirectory)+'/';
      }
      else {
        scriptDirectory = __dirname+'/';
      }
      read_ = function shell_read(filename, binary) {
        if (!nodeFS)
          nodeFS = require('fs');
        if (!nodePath)
          nodePath = require('path');
        filename = nodePath['normalize'](filename);
        return nodeFS['readFileSync'](filename, binary ? null : 'utf8');
      };
      readBinary = function readBinary(filename) {
        var ret=read_(filename, true);
        if (!ret.buffer) {
            ret = new Uint8Array(ret);
        }
        assert(ret.buffer);
        return ret;
      };
      if (process['argv'].length>1) {
          thisProgram = process['argv'][1].replace(/\\/g, '/');
      }
      arguments_ = process['argv'].slice(2);
      if (typeof module!=='undefined') {
          module['exports'] = Module;
      }
      process['on']('uncaughtException', function (ex) {
        if (!(__instance_of(ex, ExitStatus))) {
            throw ex;
        }
      });
      process['on']('unhandledRejection', abort);
      quit_ = function (status) {
        process['exit'](status);
      };
      Module['inspect'] = function () {
        return '[Emscripten Module object]';
      };
  }
  else 
    if (ENVIRONMENT_IS_SHELL) {
      if (typeof read!='undefined') {
          read_ = function shell_read(f) {
            return read(f);
          };
      }
      readBinary = function readBinary(f) {
        var data;
        if (typeof readbuffer==='function') {
            return new Uint8Array(readbuffer(f));
        }
        data = read(f, 'binary');
        assert(typeof data==='object');
        return data;
      };
      if (typeof scriptArgs!='undefined') {
          arguments_ = scriptArgs;
      }
      else 
        if (typeof arguments!='undefined') {
          arguments_ = arguments;
      }
      if (typeof quit==='function') {
          quit_ = function (status) {
            quit(status);
          };
      }
      if (typeof print!=='undefined') {
          if (typeof console==='undefined')
            console = ({});
          console.log = (print);
          console.warn = console.error = (typeof printErr!=='undefined' ? printErr : print);
      }
  }
  else 
    if (ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER) {
      if (ENVIRONMENT_IS_WORKER) {
          scriptDirectory = self.location.href;
      }
      else 
        if (document.currentScript) {
          scriptDirectory = document.currentScript.src;
      }
      if (scriptDirectory.indexOf('blob:')!==0) {
          scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/')+1);
      }
      else {
        scriptDirectory = '';
      }
      read_ = function shell_read(url) {
        var xhr=new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.send(null);
        return xhr.responseText;
      };
      if (ENVIRONMENT_IS_WORKER) {
          readBinary = function readBinary(url) {
            var xhr=new XMLHttpRequest();
            xhr.open('GET', url, false);
            xhr.responseType = 'arraybuffer';
            xhr.send(null);
            return new Uint8Array(xhr.response);
          };
      }
      readAsync = function readAsync(url, onload, onerror) {
        var xhr=new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status==200||(xhr.status==0&&xhr.response)) {
              onload(xhr.response);
              return ;
          }
          onerror();
        }
        xhr.onerror = onerror;
        xhr.send(null);
      };
      setWindowTitle = function (title) {
        document.title = title;
      };
  }
  else {
    throw new Error('environment detection error');
  }
  var out=Module['print']||console.log.bind(console);
  var err=Module['printErr']||console.warn.bind(console);
  for (key in moduleOverrides) {
      if (moduleOverrides.hasOwnProperty(key)) {
          Module[key] = moduleOverrides[key];
      }
  }
  moduleOverrides = null;
  if (Module['arguments'])
    arguments_ = Module['arguments'];
  if (!Object.getOwnPropertyDescriptor(Module, 'arguments'))
    Object.defineProperty(Module, 'arguments', {configurable: true, 
   get: function () {
      abort('Module.arguments has been replaced with plain arguments_');
    }});
  if (Module['thisProgram'])
    thisProgram = Module['thisProgram'];
  if (!Object.getOwnPropertyDescriptor(Module, 'thisProgram'))
    Object.defineProperty(Module, 'thisProgram', {configurable: true, 
   get: function () {
      abort('Module.thisProgram has been replaced with plain thisProgram');
    }});
  if (Module['quit'])
    quit_ = Module['quit'];
  if (!Object.getOwnPropertyDescriptor(Module, 'quit'))
    Object.defineProperty(Module, 'quit', {configurable: true, 
   get: function () {
      abort('Module.quit has been replaced with plain quit_');
    }});
  assert(typeof Module['memoryInitializerPrefixURL']==='undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['pthreadMainPrefixURL']==='undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['cdInitializerPrefixURL']==='undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['filePackagePrefixURL']==='undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['read']==='undefined', 'Module.read option was removed (modify read_ in JS)');
  assert(typeof Module['readAsync']==='undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
  assert(typeof Module['readBinary']==='undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
  assert(typeof Module['setWindowTitle']==='undefined', 'Module.setWindowTitle option was removed (modify setWindowTitle in JS)');
  assert(typeof Module['TOTAL_MEMORY']==='undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
  if (!Object.getOwnPropertyDescriptor(Module, 'read'))
    Object.defineProperty(Module, 'read', {configurable: true, 
   get: function () {
      abort('Module.read has been replaced with plain read_');
    }});
  if (!Object.getOwnPropertyDescriptor(Module, 'readAsync'))
    Object.defineProperty(Module, 'readAsync', {configurable: true, 
   get: function () {
      abort('Module.readAsync has been replaced with plain readAsync');
    }});
  if (!Object.getOwnPropertyDescriptor(Module, 'readBinary'))
    Object.defineProperty(Module, 'readBinary', {configurable: true, 
   get: function () {
      abort('Module.readBinary has been replaced with plain readBinary');
    }});
  if (!Object.getOwnPropertyDescriptor(Module, 'setWindowTitle'))
    Object.defineProperty(Module, 'setWindowTitle', {configurable: true, 
   get: function () {
      abort('Module.setWindowTitle has been replaced with plain setWindowTitle');
    }});
  var IDBFS='IDBFS is no longer included by default; build with -lidbfs.js';
  var PROXYFS='PROXYFS is no longer included by default; build with -lproxyfs.js';
  var WORKERFS='WORKERFS is no longer included by default; build with -lworkerfs.js';
  var NODEFS='NODEFS is no longer included by default; build with -lnodefs.js';
  var STACK_ALIGN=16;
  var stackSave;
  var stackRestore;
  var stackAlloc;
  stackSave = stackRestore = stackAlloc = function () {
    abort('cannot use the stack before compiled code is ready to run, and has provided stack access');
  }
  function staticAlloc(size) {
    abort('staticAlloc is no longer available at runtime; instead, perform static allocations at compile time (using makeStaticAlloc)');
  }
  function dynamicAlloc(size) {
    assert(DYNAMICTOP_PTR);
    var ret=HEAP32[DYNAMICTOP_PTR>>2];
    var end=(ret+size+15)&-16;
    assert(end<=HEAP8.length, 'failure to dynamicAlloc - memory growth etc. is not supported there, call malloc/sbrk directly');
    HEAP32[DYNAMICTOP_PTR>>2] = end;
    return ret;
  }
  function alignMemory(size, factor) {
    if (!factor)
      factor = STACK_ALIGN;
    return Math.ceil(size/factor)*factor;
  }
  function getNativeTypeSize(type) {
    switch (type) {
      case 'i1':
      case 'i8':
        return 1;
      case 'i16':
        return 2;
      case 'i32':
        return 4;
      case 'i64':
        return 8;
      case 'float':
        return 4;
      case 'double':
        return 8;
      default:
        if (type[type.length-1]==='*') {
            return 4;
        }
        else 
          if (type[0]==='i') {
            var bits=Number(type.substr(1));
            assert(bits%8===0, 'getNativeTypeSize invalid bits '+bits+', type '+type);
            return bits/8;
        }
        else {
          return 0;
        }
    }
  }
  function warnOnce(text) {
    if (!warnOnce.shown)
      warnOnce.shown = {}
    if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
    }
  }
  function convertJsFunctionToWasm(func, sig) {
    if (typeof WebAssembly.Function==="function") {
        var typeNames={'i': 'i32', 
      'j': 'i64', 
      'f': 'f32', 
      'd': 'f64'};
        var type={parameters: [], 
      results: sig[0]=='v' ? [] : [typeNames[sig[0]]]};
        for (var i=1; i<sig.length; ++i) {
            type.parameters.push(typeNames[sig[i]]);
        }
        return new WebAssembly.Function(type, func);
    }
    var typeSection=[0x1, 0x0, 0x1, 0x60];
    var sigRet=sig.slice(0, 1);
    var sigParam=sig.slice(1);
    var typeCodes={'i': 0x7f, 
    'j': 0x7e, 
    'f': 0x7d, 
    'd': 0x7c}
    typeSection.push(sigParam.length);
    for (var i=0; i<sigParam.length; ++i) {
        typeSection.push(typeCodes[sigParam[i]]);
    }
    if (sigRet=='v') {
        typeSection.push(0x0);
    }
    else {
      typeSection = typeSection.concat([0x1, typeCodes[sigRet]]);
    }
    typeSection[1] = typeSection.length-2;
    var bytes=new Uint8Array([0x0, 0x61, 0x73, 0x6d, 0x1, 0x0, 0x0, 0x0].concat(typeSection, [0x2, 0x7, 0x1, 0x1, 0x65, 0x1, 0x66, 0x0, 0x0, 0x7, 0x5, 0x1, 0x1, 0x66, 0x0, 0x0]));
    var module=new WebAssembly.Module(bytes);
    var instance=new WebAssembly.Instance(module, {'e': {'f': func}});
    var wrappedFunc=instance.exports['f'];
    return wrappedFunc;
  }
  var freeTableIndexes=[];
  var functionsInTableMap;
  function addFunctionWasm(func, sig) {
    var table=wasmTable;
    if (!functionsInTableMap) {
        functionsInTableMap = new WeakMap();
        for (var i=0; i<table.length; i++) {
            var item=table.get(i);
            if (item) {
                functionsInTableMap.set(item, i);
            }
        }
    }
    if (functionsInTableMap.has(func)) {
        return functionsInTableMap.get(func);
    }
    var ret;
    if (freeTableIndexes.length) {
        ret = freeTableIndexes.pop();
    }
    else {
      ret = table.length;
      try {
        table.grow(1);
      }
      catch (err) {
          if (!(__instance_of(err, RangeError))) {
              throw err;
          }
          throw 'Unable to grow wasm table. Set ALLOW_TABLE_GROWTH.';
      }
    }
    try {
      table.set(ret, func);
    }
    catch (err) {
        if (!(__instance_of(err, TypeError))) {
            throw err;
        }
        assert(typeof sig!=='undefined', 'Missing signature argument to addFunction');
        var wrapped=convertJsFunctionToWasm(func, sig);
        table.set(ret, wrapped);
    }
    functionsInTableMap.set(func, ret);
    return ret;
  }
  function removeFunctionWasm(index) {
    functionsInTableMap.delete(wasmTable.get(index));
    freeTableIndexes.push(index);
  }
  function addFunction(func, sig) {
    assert(typeof func!=='undefined');
    return addFunctionWasm(func, sig);
  }
  function removeFunction(index) {
    removeFunctionWasm(index);
  }
  var funcWrappers={}
  function getFuncWrapper(func, sig) {
    if (!func)
      return ;
    assert(sig);
    if (!funcWrappers[sig]) {
        funcWrappers[sig] = {};
    }
    var sigCache=funcWrappers[sig];
    if (!sigCache[func]) {
        if (sig.length===1) {
            sigCache[func] = function dynCall_wrapper() {
              return dynCall(sig, func);
            };
        }
        else 
          if (sig.length===2) {
            sigCache[func] = function dynCall_wrapper(arg) {
              return dynCall(sig, func, [arg]);
            };
        }
        else {
          sigCache[func] = function dynCall_wrapper() {
            return dynCall(sig, func, Array.prototype.slice.call(arguments));
          };
        }
    }
    return sigCache[func];
  }
  function makeBigInt(low, high, unsigned) {
    return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
  }
  function dynCall(sig, ptr, args) {
    if (args&&args.length) {
        assert(args.length===sig.substring(1).replace(/j/g, '--').length);
        assert(('dynCall_'+sig) in Module, 'bad function pointer type - no table for sig \''+sig+'\'');
        return Module['dynCall_'+sig].apply(null, [ptr].concat(args));
    }
    else {
      assert(sig.length==1);
      assert(('dynCall_'+sig) in Module, 'bad function pointer type - no table for sig \''+sig+'\'');
      return Module['dynCall_'+sig].call(null, ptr);
    }
  }
  var tempRet0=0;
  var setTempRet0=function (value) {
    tempRet0 = value;
  }
  var getTempRet0=function () {
    return tempRet0;
  }
  function getCompilerSetting(name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for getCompilerSetting or emscripten_get_compiler_setting to work';
  }
  var GLOBAL_BASE=1024;
  var wasmBinary;
  if (Module['wasmBinary'])
    wasmBinary = Module['wasmBinary'];
  if (!Object.getOwnPropertyDescriptor(Module, 'wasmBinary'))
    Object.defineProperty(Module, 'wasmBinary', {configurable: true, 
   get: function () {
      abort('Module.wasmBinary has been replaced with plain wasmBinary');
    }});
  var noExitRuntime;
  if (Module['noExitRuntime'])
    noExitRuntime = Module['noExitRuntime'];
  if (!Object.getOwnPropertyDescriptor(Module, 'noExitRuntime'))
    Object.defineProperty(Module, 'noExitRuntime', {configurable: true, 
   get: function () {
      abort('Module.noExitRuntime has been replaced with plain noExitRuntime');
    }});
  if (typeof WebAssembly!=='object') {
      abort('No WebAssembly support found. Build with -s WASM=0 to target JavaScript instead.');
  }
  function setValue(ptr, value, type, noSafe) {
    type = type||'i8';
    if (type.charAt(type.length-1)==='*')
      type = 'i32';
    switch (type) {
      case 'i1':
        HEAP8[((ptr)>>0)] = value;
        break;
      case 'i8':
        HEAP8[((ptr)>>0)] = value;
        break;
      case 'i16':
        HEAP16[((ptr)>>1)] = value;
        break;
      case 'i32':
        HEAP32[((ptr)>>2)] = value;
        break;
      case 'i64':
        (tempI64 = [value>>>0, (tempDouble = value, (+(Math_abs(tempDouble)))>=1.0 ? (tempDouble>0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble-+(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)], HEAP32[((ptr)>>2)] = tempI64[0], HEAP32[(((ptr)+(4))>>2)] = tempI64[1]);
        break;
      case 'float':
        HEAPF32[((ptr)>>2)] = value;
        break;
      case 'double':
        HEAPF64[((ptr)>>3)] = value;
        break;
      default:
        abort('invalid type for setValue: '+type);
    }
  }
  function getValue(ptr, type, noSafe) {
    type = type||'i8';
    if (type.charAt(type.length-1)==='*')
      type = 'i32';
    switch (type) {
      case 'i1':
        return HEAP8[((ptr)>>0)];
      case 'i8':
        return HEAP8[((ptr)>>0)];
      case 'i16':
        return HEAP16[((ptr)>>1)];
      case 'i32':
        return HEAP32[((ptr)>>2)];
      case 'i64':
        return HEAP32[((ptr)>>2)];
      case 'float':
        return HEAPF32[((ptr)>>2)];
      case 'double':
        return HEAPF64[((ptr)>>3)];
      default:
        abort('invalid type for getValue: '+type);
    }
    return null;
  }
  var wasmMemory;
  var wasmTable=new WebAssembly.Table({'initial': 6, 
   'maximum': 6+0, 
   'element': 'anyfunc'});
  var ABORT=false;
  var EXITSTATUS=0;
  function assert(condition, text) {
    if (!condition) {
        abort('Assertion failed: '+text);
    }
  }
  function getCFunc(ident) {
    var func=Module['_'+ident];
    assert(func, 'Cannot call unknown function '+ident+', make sure it is exported');
    return func;
  }
  function ccall(ident, returnType, argTypes, args, opts) {
    var toC={'string': function (str) {
        var ret=0;
        if (str!==null&&str!==undefined&&str!==0) {
            var len=(str.length<<2)+1;
            ret = stackAlloc(len);
            stringToUTF8(str, ret, len);
        }
        return ret;
      }, 
    'array': function (arr) {
        var ret=stackAlloc(arr.length);
        writeArrayToMemory(arr, ret);
        return ret;
      }}
    function convertReturnValue(ret) {
      if (returnType==='string')
        return UTF8ToString(ret);
      if (returnType==='boolean')
        return Boolean(ret);
      return ret;
    }
    var func=getCFunc(ident);
    var cArgs=[];
    var stack=0;
    assert(returnType!=='array', 'Return type should not be "array".');
    if (args) {
        for (var i=0; i<args.length; i++) {
            var converter=toC[argTypes[i]];
            if (converter) {
                if (stack===0)
                  stack = stackSave();
                cArgs[i] = converter(args[i]);
            }
            else {
              cArgs[i] = args[i];
            }
        }
    }
    var ret=func.apply(null, cArgs);
    ret = convertReturnValue(ret);
    if (stack!==0)
      stackRestore(stack);
    return ret;
  }
  function cwrap(ident, returnType, argTypes, opts) {
    return function () {
      return ccall(ident, returnType, argTypes, arguments, opts);
    }
  }
  var ALLOC_NORMAL=0;
  var ALLOC_STACK=1;
  var ALLOC_DYNAMIC=2;
  var ALLOC_NONE=3;
  function allocate(slab, types, allocator, ptr) {
    var zeroinit, size;
    if (typeof slab==='number') {
        zeroinit = true;
        size = slab;
    }
    else {
      zeroinit = false;
      size = slab.length;
    }
    var singleType=typeof types==='string' ? types : null;
    var ret;
    if (allocator==ALLOC_NONE) {
        ret = ptr;
    }
    else {
      ret = [_malloc, stackAlloc, dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length));
    }
    if (zeroinit) {
        var stop;
        ptr = ret;
        assert((ret&3)==0);
        stop = ret+(size&~3);
        for (; ptr<stop; ptr+=4) {
            HEAP32[((ptr)>>2)] = 0;
        }
        stop = ret+size;
        while (ptr<stop) {
          HEAP8[((ptr++)>>0)] = 0;
        }
        return ret;
    }
    if (singleType==='i8') {
        if (slab.subarray||slab.slice) {
            HEAPU8.set((slab), ret);
        }
        else {
          HEAPU8.set(new Uint8Array(slab), ret);
        }
        return ret;
    }
    var i=0, type, typeSize, previousType;
    while (i<size) {
      var curr=slab[i];
      type = singleType||types[i];
      if (type===0) {
          i++;
          continue;
      }
      assert(type, 'Must know what type to store in allocate!');
      if (type=='i64')
        type = 'i32';
      setValue(ret+i, curr, type);
      if (previousType!==type) {
          typeSize = getNativeTypeSize(type);
          previousType = type;
      }
      i+=typeSize;
    }
    return ret;
  }
  function getMemory(size) {
    if (!runtimeInitialized)
      return dynamicAlloc(size);
    return _malloc(size);
  }
  var UTF8Decoder=typeof TextDecoder!=='undefined' ? new TextDecoder('utf8') : undefined;
  function UTF8ArrayToString(heap, idx, maxBytesToRead) {
    var endIdx=idx+maxBytesToRead;
    var endPtr=idx;
    while (heap[endPtr]&&!(endPtr>=endIdx)) {
      ++endPtr    }
    if (endPtr-idx>16&&heap.subarray&&UTF8Decoder) {
        return UTF8Decoder.decode(heap.subarray(idx, endPtr));
    }
    else {
      var str='';
      while (idx<endPtr) {
        var u0=heap[idx++];
        if (!(u0&0x80)) {
            str+=String.fromCharCode(u0);
            continue;
        }
        var u1=heap[idx++]&63;
        if ((u0&0xe0)==0xc0) {
            str+=String.fromCharCode(((u0&31)<<6)|u1);
            continue;
        }
        var u2=heap[idx++]&63;
        if ((u0&0xf0)==0xe0) {
            u0 = ((u0&15)<<12)|(u1<<6)|u2;
        }
        else {
          if ((u0&0xf8)!=0xf0)
            warnOnce('Invalid UTF-8 leading byte 0x'+u0.toString(16)+' encountered when deserializing a UTF-8 string on the asm.js/wasm heap to a JS string!');
          u0 = ((u0&7)<<18)|(u1<<12)|(u2<<6)|(heap[idx++]&63);
        }
        if (u0<0x10000) {
            str+=String.fromCharCode(u0);
        }
        else {
          var ch=u0-0x10000;
          str+=String.fromCharCode(0xd800|(ch>>10), 0xdc00|(ch&0x3ff));
        }
      }
    }
    return str;
  }
  function UTF8ToString(ptr, maxBytesToRead) {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
  }
  function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite>0))
      return 0;
    var startIdx=outIdx;
    var endIdx=outIdx+maxBytesToWrite-1;
    for (var i=0; i<str.length; ++i) {
        var u=str.charCodeAt(i);
        if (u>=0xd800&&u<=0xdfff) {
            var u1=str.charCodeAt(++i);
            u = 0x10000+((u&0x3ff)<<10)|(u1&0x3ff);
        }
        if (u<=0x7f) {
            if (outIdx>=endIdx)
              break;
            heap[outIdx++] = u;
        }
        else 
          if (u<=0x7ff) {
            if (outIdx+1>=endIdx)
              break;
            heap[outIdx++] = 0xc0|(u>>6);
            heap[outIdx++] = 0x80|(u&63);
        }
        else 
          if (u<=0xffff) {
            if (outIdx+2>=endIdx)
              break;
            heap[outIdx++] = 0xe0|(u>>12);
            heap[outIdx++] = 0x80|((u>>6)&63);
            heap[outIdx++] = 0x80|(u&63);
        }
        else {
          if (outIdx+3>=endIdx)
            break;
          if (u>=0x200000)
            warnOnce('Invalid Unicode code point 0x'+u.toString(16)+' encountered when serializing a JS string to an UTF-8 string on the asm.js/wasm heap! (Valid unicode code points should be in range 0-0x1FFFFF).');
          heap[outIdx++] = 0xf0|(u>>18);
          heap[outIdx++] = 0x80|((u>>12)&63);
          heap[outIdx++] = 0x80|((u>>6)&63);
          heap[outIdx++] = 0x80|(u&63);
        }
    }
    heap[outIdx] = 0;
    return outIdx-startIdx;
  }
  function stringToUTF8(str, outPtr, maxBytesToWrite) {
    assert(typeof maxBytesToWrite=='number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
  }
  function lengthBytesUTF8(str) {
    var len=0;
    for (var i=0; i<str.length; ++i) {
        var u=str.charCodeAt(i);
        if (u>=0xd800&&u<=0xdfff)
          u = 0x10000+((u&0x3ff)<<10)|(str.charCodeAt(++i)&0x3ff);
        if (u<=0x7f)
          ++len;
        else 
          if (u<=0x7ff)
          len+=2;
        else 
          if (u<=0xffff)
          len+=3;
        else 
          len+=4;
    }
    return len;
  }
  function AsciiToString(ptr) {
    var str='';
    while (1) {
      var ch=HEAPU8[((ptr++)>>0)];
      if (!ch)
        return str;
      str+=String.fromCharCode(ch);
    }
  }
  function stringToAscii(str, outPtr) {
    return writeAsciiToMemory(str, outPtr, false);
  }
  var UTF16Decoder=typeof TextDecoder!=='undefined' ? new TextDecoder('utf-16le') : undefined;
  function UTF16ToString(ptr, maxBytesToRead) {
    assert(ptr%2==0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
    var endPtr=ptr;
    var idx=endPtr>>1;
    var maxIdx=idx+maxBytesToRead/2;
    while (!(idx>=maxIdx)&&HEAPU16[idx]) {
      ++idx    }
    endPtr = idx<<1;
    if (endPtr-ptr>32&&UTF16Decoder) {
        return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
    }
    else {
      var i=0;
      var str='';
      while (1) {
        var codeUnit=HEAP16[(((ptr)+(i*2))>>1)];
        if (codeUnit==0||i==maxBytesToRead/2)
          return str;
        ++i;
        str+=String.fromCharCode(codeUnit);
      }
    }
  }
  function stringToUTF16(str, outPtr, maxBytesToWrite) {
    assert(outPtr%2==0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
    assert(typeof maxBytesToWrite=='number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
    if (maxBytesToWrite===undefined) {
        maxBytesToWrite = 0x7fffffff;
    }
    if (maxBytesToWrite<2)
      return 0;
    maxBytesToWrite-=2;
    var startPtr=outPtr;
    var numCharsToWrite=(maxBytesToWrite<str.length*2) ? (maxBytesToWrite/2) : str.length;
    for (var i=0; i<numCharsToWrite; ++i) {
        var codeUnit=str.charCodeAt(i);
        HEAP16[((outPtr)>>1)] = codeUnit;
        outPtr+=2;
    }
    HEAP16[((outPtr)>>1)] = 0;
    return outPtr-startPtr;
  }
  function lengthBytesUTF16(str) {
    return str.length*2;
  }
  function UTF32ToString(ptr, maxBytesToRead) {
    assert(ptr%4==0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
    var i=0;
    var str='';
    while (!(i>=maxBytesToRead/4)) {
      var utf32=HEAP32[(((ptr)+(i*4))>>2)];
      if (utf32==0)
        break;
      ++i;
      if (utf32>=0x10000) {
          var ch=utf32-0x10000;
          str+=String.fromCharCode(0xd800|(ch>>10), 0xdc00|(ch&0x3ff));
      }
      else {
        str+=String.fromCharCode(utf32);
      }
    }
    return str;
  }
  function stringToUTF32(str, outPtr, maxBytesToWrite) {
    assert(outPtr%4==0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
    assert(typeof maxBytesToWrite=='number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
    if (maxBytesToWrite===undefined) {
        maxBytesToWrite = 0x7fffffff;
    }
    if (maxBytesToWrite<4)
      return 0;
    var startPtr=outPtr;
    var endPtr=startPtr+maxBytesToWrite-4;
    for (var i=0; i<str.length; ++i) {
        var codeUnit=str.charCodeAt(i);
        if (codeUnit>=0xd800&&codeUnit<=0xdfff) {
            var trailSurrogate=str.charCodeAt(++i);
            codeUnit = 0x10000+((codeUnit&0x3ff)<<10)|(trailSurrogate&0x3ff);
        }
        HEAP32[((outPtr)>>2)] = codeUnit;
        outPtr+=4;
        if (outPtr+4>endPtr)
          break;
    }
    HEAP32[((outPtr)>>2)] = 0;
    return outPtr-startPtr;
  }
  function lengthBytesUTF32(str) {
    var len=0;
    for (var i=0; i<str.length; ++i) {
        var codeUnit=str.charCodeAt(i);
        if (codeUnit>=0xd800&&codeUnit<=0xdfff)
          ++i;
        len+=4;
    }
    return len;
  }
  function allocateUTF8(str) {
    var size=lengthBytesUTF8(str)+1;
    var ret=_malloc(size);
    if (ret)
      stringToUTF8Array(str, HEAP8, ret, size);
    return ret;
  }
  function allocateUTF8OnStack(str) {
    var size=lengthBytesUTF8(str)+1;
    var ret=stackAlloc(size);
    stringToUTF8Array(str, HEAP8, ret, size);
    return ret;
  }
  function writeStringToMemory(string, buffer, dontAddNull) {
    warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');
    var lastChar, end;
    if (dontAddNull) {
        end = buffer+lengthBytesUTF8(string);
        lastChar = HEAP8[end];
    }
    stringToUTF8(string, buffer, Infinity);
    if (dontAddNull)
      HEAP8[end] = lastChar;
  }
  function writeArrayToMemory(array, buffer) {
    assert(array.length>=0, 'writeArrayToMemory array must have a length (should be an array or typed array)');
    HEAP8.set(array, buffer);
  }
  function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i=0; i<str.length; ++i) {
        assert(str.charCodeAt(i)===str.charCodeAt(i)&0xff);
        HEAP8[((buffer++)>>0)] = str.charCodeAt(i);
    }
    if (!dontAddNull)
      HEAP8[((buffer)>>0)] = 0;
  }
  var PAGE_SIZE=16384;
  var WASM_PAGE_SIZE=65536;
  var ASMJS_PAGE_SIZE=16777216;
  function alignUp(x, multiple) {
    if (x%multiple>0) {
        x+=multiple-(x%multiple);
    }
    return x;
  }
  var HEAP, buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
  function updateGlobalBufferAndViews(buf) {
    buffer = buf;
    Module['HEAP8'] = HEAP8 = new Int8Array(buf);
    Module['HEAP16'] = HEAP16 = new Int16Array(buf);
    Module['HEAP32'] = HEAP32 = new Int32Array(buf);
    Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
    Module['HEAPU16'] = HEAPU16 = new Uint16Array(buf);
    Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
    Module['HEAPF32'] = HEAPF32 = new Float32Array(buf);
    Module['HEAPF64'] = HEAPF64 = new Float64Array(buf);
  }
  var STATIC_BASE=1024, STACK_BASE=5254224, STACKTOP=STACK_BASE, STACK_MAX=11344, DYNAMIC_BASE=5254224, DYNAMICTOP_PTR=11184;
  assert(STACK_BASE%16===0, 'stack must start aligned');
  assert(DYNAMIC_BASE%16===0, 'heap must start aligned');
  var TOTAL_STACK=5242880;
  if (Module['TOTAL_STACK'])
    assert(TOTAL_STACK===Module['TOTAL_STACK'], 'the stack size can no longer be determined at runtime');
  var INITIAL_INITIAL_MEMORY=Module['INITIAL_MEMORY']||33554432;
  if (!Object.getOwnPropertyDescriptor(Module, 'INITIAL_MEMORY'))
    Object.defineProperty(Module, 'INITIAL_MEMORY', {configurable: true, 
   get: function () {
      abort('Module.INITIAL_MEMORY has been replaced with plain INITIAL_INITIAL_MEMORY');
    }});
  assert(INITIAL_INITIAL_MEMORY>=TOTAL_STACK, 'INITIAL_MEMORY should be larger than TOTAL_STACK, was '+INITIAL_INITIAL_MEMORY+'! (TOTAL_STACK='+TOTAL_STACK+')');
  assert(typeof Int32Array!=='undefined'&&typeof Float64Array!=='undefined'&&Int32Array.prototype.subarray!==undefined&&Int32Array.prototype.set!==undefined, 'JS engine does not provide full typed array support');
  if (Module['wasmMemory']) {
      wasmMemory = Module['wasmMemory'];
  }
  else {
    wasmMemory = new WebAssembly.Memory({'initial': INITIAL_INITIAL_MEMORY/WASM_PAGE_SIZE, 
    'maximum': 2147483648/WASM_PAGE_SIZE});
  }
  if (wasmMemory) {
      buffer = wasmMemory.buffer;
  }
  INITIAL_INITIAL_MEMORY = buffer.byteLength;
  assert(INITIAL_INITIAL_MEMORY%WASM_PAGE_SIZE===0);
  assert(65536%WASM_PAGE_SIZE===0);
  updateGlobalBufferAndViews(buffer);
  HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;
  function writeStackCookie() {
    assert((STACK_MAX&3)==0);
    HEAPU32[(STACK_MAX>>2)+1] = 0x2135467;
    HEAPU32[(STACK_MAX>>2)+2] = 0x89bacdfe;
    HEAP32[0] = 0x63736d65;
  }
  function checkStackCookie() {
    var cookie1=HEAPU32[(STACK_MAX>>2)+1];
    var cookie2=HEAPU32[(STACK_MAX>>2)+2];
    if (cookie1!=0x2135467||cookie2!=0x89bacdfe) {
        abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x2135467, but received 0x'+cookie2.toString(16)+' '+cookie1.toString(16));
    }
    if (HEAP32[0]!==0x63736d65)
      abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
  }
  function abortStackOverflow(allocSize) {
    abort('Stack overflow! Attempted to allocate '+allocSize+' bytes on the stack, but stack has only '+(STACK_MAX-stackSave()+allocSize)+' bytes available!');
  }(function () {
    var h16=new Int16Array(1);
    var h8=new Int8Array(h16.buffer);
    h16[0] = 0x6373;
    if (h8[0]!==0x73||h8[1]!==0x63)
      throw 'Runtime error: expected the system to be little-endian!';
  })();
  function abortFnPtrError(ptr, sig) {
    abort("Invalid function pointer "+ptr+" called with signature '"+sig+"'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this). Build with ASSERTIONS=2 for more info.");
  }
  function callRuntimeCallbacks(callbacks) {
    while (callbacks.length>0) {
      var callback=callbacks.shift();
      if (typeof callback=='function') {
          callback(Module);
          continue;
      }
      var func=callback.func;
      if (typeof func==='number') {
          if (callback.arg===undefined) {
              Module['dynCall_v'](func);
          }
          else {
            Module['dynCall_vi'](func, callback.arg);
          }
      }
      else {
        func(callback.arg===undefined ? null : callback.arg);
      }
    }
  }
  var __ATPRERUN__=[];
  var __ATINIT__=[];
  var __ATMAIN__=[];
  var __ATEXIT__=[];
  var __ATPOSTRUN__=[];
  var runtimeInitialized=false;
  var runtimeExited=false;
  function preRun() {
    if (Module['preRun']) {
        if (typeof Module['preRun']=='function')
          Module['preRun'] = [Module['preRun']];
        while (Module['preRun'].length) {
          addOnPreRun(Module['preRun'].shift());
        }
    }
    callRuntimeCallbacks(__ATPRERUN__);
  }
  function initRuntime() {
    checkStackCookie();
    assert(!runtimeInitialized);
    runtimeInitialized = true;
    callRuntimeCallbacks(__ATINIT__);
  }
  function preMain() {
    checkStackCookie();
    callRuntimeCallbacks(__ATMAIN__);
  }
  function exitRuntime() {
    checkStackCookie();
    runtimeExited = true;
  }
  function postRun() {
    checkStackCookie();
    if (Module['postRun']) {
        if (typeof Module['postRun']=='function')
          Module['postRun'] = [Module['postRun']];
        while (Module['postRun'].length) {
          addOnPostRun(Module['postRun'].shift());
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__);
  }
  function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb);
  }
  function addOnInit(cb) {
    __ATINIT__.unshift(cb);
  }
  function addOnPreMain(cb) {
    __ATMAIN__.unshift(cb);
  }
  function addOnExit(cb) {
  }
  function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb);
  }
  function unSign(value, bits, ignore) {
    if (value>=0) {
        return value;
    }
    return bits<=32 ? 2*Math.abs(1<<(bits-1))+value : Math.pow(2, bits)+value;
  }
  function reSign(value, bits, ignore) {
    if (value<=0) {
        return value;
    }
    var half=bits<=32 ? Math.abs(1<<(bits-1)) : Math.pow(2, bits-1);
    if (value>=half&&(bits<=32||value>half)) {
        value = -2*half+value;
    }
    return value;
  }
  assert(Math.imul, 'This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
  assert(Math.fround, 'This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
  assert(Math.clz32, 'This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
  assert(Math.trunc, 'This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
  var Math_abs=Math.abs;
  var Math_cos=Math.cos;
  var Math_sin=Math.sin;
  var Math_tan=Math.tan;
  var Math_acos=Math.acos;
  var Math_asin=Math.asin;
  var Math_atan=Math.atan;
  var Math_atan2=Math.atan2;
  var Math_exp=Math.exp;
  var Math_log=Math.log;
  var Math_sqrt=Math.sqrt;
  var Math_ceil=Math.ceil;
  var Math_floor=Math.floor;
  var Math_pow=Math.pow;
  var Math_imul=Math.imul;
  var Math_fround=Math.fround;
  var Math_round=Math.round;
  var Math_min=Math.min;
  var Math_max=Math.max;
  var Math_clz32=Math.clz32;
  var Math_trunc=Math.trunc;
  var runDependencies=0;
  var runDependencyWatcher=null;
  var dependenciesFulfilled=null;
  var runDependencyTracking={}
  function getUniqueRunDependency(id) {
    var orig=id;
    while (1) {
      if (!runDependencyTracking[id])
        return id;
      id = orig+Math.random();
    }
  }
  function addRunDependency(id) {
    runDependencies++;
    if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
    }
    if (id) {
        assert(!runDependencyTracking[id]);
        runDependencyTracking[id] = 1;
        if (runDependencyWatcher===null&&typeof setInterval!=='undefined') {
            runDependencyWatcher = setInterval(function () {
              if (ABORT) {
                  clearInterval(runDependencyWatcher);
                  runDependencyWatcher = null;
                  return ;
              }
              var shown=false;
              for (var dep in runDependencyTracking) {
                  if (!shown) {
                      shown = true;
                      err('still waiting on run dependencies:');
                  }
                  err('dependency: '+dep);
              }
              if (shown) {
                  err('(end of list)');
              }
            }, 10000);
        }
    }
    else {
      err('warning: run dependency added without ID');
    }
  }
  function removeRunDependency(id) {
    runDependencies--;
    if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
    }
    if (id) {
        assert(runDependencyTracking[id]);
        delete runDependencyTracking[id];
    }
    else {
      err('warning: run dependency removed without ID');
    }
    if (runDependencies==0) {
        if (runDependencyWatcher!==null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null;
        }
        if (dependenciesFulfilled) {
            var callback=dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback();
        }
    }
  }
  Module["preloadedImages"] = {}
  Module["preloadedAudios"] = {}
  function abort(what) {
    if (Module['onAbort']) {
        Module['onAbort'](what);
    }
    what+='';
    out(what);
    err(what);
    ABORT = true;
    EXITSTATUS = 1;
    var output='abort('+what+') at '+stackTrace();
    what = output;
    throw new WebAssembly.RuntimeError(what);
  }
  var memoryInitializer=null;
  var FS={error: function () {
      abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with  -s FORCE_FILESYSTEM=1');
    }, 
   init: function () {
      FS.error();
    }, 
   createDataFile: function () {
      FS.error();
    }, 
   createPreloadedFile: function () {
      FS.error();
    }, 
   createLazyFile: function () {
      FS.error();
    }, 
   open: function () {
      FS.error();
    }, 
   mkdev: function () {
      FS.error();
    }, 
   registerDevice: function () {
      FS.error();
    }, 
   analyzePath: function () {
      FS.error();
    }, 
   loadFilesFromDB: function () {
      FS.error();
    }, 
   ErrnoError: function ErrnoError() {
      FS.error();
    }}
  Module['FS_createDataFile'] = FS.createDataFile;
  Module['FS_createPreloadedFile'] = FS.createPreloadedFile;
  function hasPrefix(str, prefix) {
    return String.prototype.startsWith ? str.startsWith(prefix) : str.indexOf(prefix)===0;
  }
  var dataURIPrefix='data:application/octet-stream;base64,';
  function isDataURI(filename) {
    return hasPrefix(filename, dataURIPrefix);
  }
  var fileURIPrefix="file://";
  function isFileURI(filename) {
    return hasPrefix(filename, fileURIPrefix);
  }
  if (!isDataURI(wasmBinaryFile)) {
      wasmBinaryFile = locateFile(wasmBinaryFile);
  }
  function getBinary() {
    try {
      if (wasmBinary) {
          return new Uint8Array(wasmBinary);
      }
      if (readBinary) {
          return readBinary(wasmBinaryFile);
      }
      else {
        throw "both async and sync fetching of the wasm failed";
      }
    }
    catch (err) {
        abort(err);
    }
  }
  function getBinaryPromise() {
    if (!wasmBinary&&(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER)&&typeof fetch==='function'&&!isFileURI(wasmBinaryFile)) {
        return fetch(wasmBinaryFile, {credentials: 'same-origin'}).then(function (response) {
          if (!response['ok']) {
              throw "failed to load wasm binary file at '"+wasmBinaryFile+"'";
          }
          return response['arrayBuffer']();
        }).catch(function () {
          return getBinary();
        });
    }
    return new Promise(function (resolve, reject) {
      resolve(getBinary());
    });
  }
  function createWasm() {
    var info={'env': asmLibraryArg, 
    'wasi_snapshot_preview1': asmLibraryArg}
    function receiveInstance(instance, module) {
      var exports=instance.exports;
      Module['asm'] = exports;
      removeRunDependency('wasm-instantiate');
    }
    addRunDependency('wasm-instantiate');
    var trueModule=Module;
    function receiveInstantiatedSource(output) {
      assert(Module===trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
      trueModule = null;
      receiveInstance(output['instance']);
    }
    function instantiateArrayBuffer(receiver) {
      return getBinaryPromise().then(function (binary) {
        return WebAssembly.instantiate(binary, info);
      }).then(receiver, function (reason) {
        err('failed to asynchronously prepare wasm: '+reason);
        abort(reason);
      });
    }
    function instantiateAsync() {
      if (!wasmBinary&&typeof WebAssembly.instantiateStreaming==='function'&&!isDataURI(wasmBinaryFile)&&!isFileURI(wasmBinaryFile)&&typeof fetch==='function') {
          fetch(wasmBinaryFile, {credentials: 'same-origin'}).then(function (response) {
            var result=WebAssembly.instantiateStreaming(response, info);
            return result.then(receiveInstantiatedSource, function (reason) {
              err('wasm streaming compile failed: '+reason);
              err('falling back to ArrayBuffer instantiation');
              instantiateArrayBuffer(receiveInstantiatedSource);
            });
          });
      }
      else {
        return instantiateArrayBuffer(receiveInstantiatedSource);
      }
    }
    if (Module['instantiateWasm']) {
        try {
          var exports=Module['instantiateWasm'](info, receiveInstance);
          return exports;
        }
        catch (e) {
            err('Module.instantiateWasm callback failed with error: '+e);
            return false;
        }
    }
    instantiateAsync();
    return {}
  }
  var tempDouble;
  var tempI64;
  var ASM_CONSTS={}
  function sendMessage(x, buffer, len) {
    _wasm_post_message(x, buffer, len);
  }
  __ATINIT__.push({func: function () {
      ___wasm_call_ctors();
    }});
  function demangle(func) {
    warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
    return func;
  }
  function demangleAll(text) {
    var regex=/\b_Z[\w\d_]+/g;
    return text.replace(regex, function (x) {
      var y=demangle(x);
      return x===y ? x : (y+' ['+x+']');
    });
  }
  function jsStackTrace() {
    var err=new Error();
    if (!err.stack) {
        try {
          throw new Error();
        }
        catch (e) {
            err = e;
        }
        if (!err.stack) {
            return '(no stack trace available)';
        }
    }
    return err.stack.toString();
  }
  function stackTrace() {
    var js=jsStackTrace();
    if (Module['extraStackTrace'])
      js+='\n'+Module['extraStackTrace']();
    return demangleAll(js);
  }
  function ___handle_stack_overflow() {
    abort('stack overflow');
  }
  function _clock() {
    if (_clock.start===undefined)
      _clock.start = Date.now();
    return ((Date.now()-_clock.start)*(1000000/1000))|0;
  }
  function _emscripten_get_sbrk_ptr() {
    return 11184;
  }
  function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.copyWithin(dest, src, src+num);
  }
  function _emscripten_get_heap_size() {
    return HEAPU8.length;
  }
  function emscripten_realloc_buffer(size) {
    try {
      wasmMemory.grow((size-buffer.byteLength+65535)>>>16);
      updateGlobalBufferAndViews(wasmMemory.buffer);
      return 1;
    }
    catch (e) {
        console.error('emscripten_realloc_buffer: Attempted to grow heap from '+buffer.byteLength+' bytes to '+size+' bytes, but got error: '+e);
    }
  }
  function _emscripten_resize_heap(requestedSize) {
    requestedSize = requestedSize>>>0;
    var oldSize=_emscripten_get_heap_size();
    assert(requestedSize>oldSize);
    var PAGE_MULTIPLE=65536;
    var maxHeapSize=2147483648;
    if (requestedSize>maxHeapSize) {
        err('Cannot enlarge memory, asked to go up to '+requestedSize+' bytes, but the limit is '+maxHeapSize+' bytes!');
        return false;
    }
    var minHeapSize=16777216;
    for (var cutDown=1; cutDown<=4; cutDown*=2) {
        var overGrownHeapSize=oldSize*(1+0.2/cutDown);
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize+100663296);
        var newSize=Math.min(maxHeapSize, alignUp(Math.max(minHeapSize, requestedSize, overGrownHeapSize), PAGE_MULTIPLE));
        var replacement=emscripten_realloc_buffer(newSize);
        if (replacement) {
            return true;
        }
    }
    err('Failed to grow the heap from '+oldSize+' bytes to '+newSize+' bytes, not enough memory!');
    return false;
  }
  function flush_NO_FILESYSTEM() {
    if (typeof _fflush!=='undefined')
      _fflush(0);
    var buffers=SYSCALLS.buffers;
    if (buffers[1].length)
      SYSCALLS.printChar(1, 10);
    if (buffers[2].length)
      SYSCALLS.printChar(2, 10);
  }
  var PATH={splitPath: function (filename) {
      var splitPathRe=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
      return splitPathRe.exec(filename).slice(1);
    }, 
   normalizeArray: function (parts, allowAboveRoot) {
      var up=0;
      for (var i=parts.length-1; i>=0; i--) {
          var last=parts[i];
          if (last==='.') {
              parts.splice(i, 1);
          }
          else 
            if (last==='..') {
              parts.splice(i, 1);
              up++;
          }
          else 
            if (up) {
              parts.splice(i, 1);
              up--;
          }
      }
      if (allowAboveRoot) {
          for (; up; up--) {
              parts.unshift('..');
          }
      }
      return parts;
    }, 
   normalize: function (path) {
      var isAbsolute=path.charAt(0)==='/', trailingSlash=path.substr(-1)==='/';
      path = PATH.normalizeArray(path.split('/').filter(function (p) {
        return !!p;
      }), !isAbsolute).join('/');
      if (!path&&!isAbsolute) {
          path = '.';
      }
      if (path&&trailingSlash) {
          path+='/';
      }
      return (isAbsolute ? '/' : '')+path;
    }, 
   dirname: function (path) {
      var result=PATH.splitPath(path), root=result[0], dir=result[1];
      if (!root&&!dir) {
          return '.';
      }
      if (dir) {
          dir = dir.substr(0, dir.length-1);
      }
      return root+dir;
    }, 
   basename: function (path) {
      if (path==='/')
        return '/';
      var lastSlash=path.lastIndexOf('/');
      if (lastSlash===-1)
        return path;
      return path.substr(lastSlash+1);
    }, 
   extname: function (path) {
      return PATH.splitPath(path)[3];
    }, 
   join: function () {
      var paths=Array.prototype.slice.call(arguments, 0);
      return PATH.normalize(paths.join('/'));
    }, 
   join2: function (l, r) {
      return PATH.normalize(l+'/'+r);
    }}
  var SYSCALLS={mappings: {}, 
   buffers: [null, [], []], 
   printChar: function (stream, curr) {
      var buffer=SYSCALLS.buffers[stream];
      assert(buffer);
      if (curr===0||curr===10) {
          (stream===1 ? out : err)(UTF8ArrayToString(buffer, 0));
          buffer.length = 0;
      }
      else {
        buffer.push(curr);
      }
    }, 
   varargs: undefined, 
   get: function () {
      assert(SYSCALLS.varargs!=undefined);
      SYSCALLS.varargs+=4;
      var ret=HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
      return ret;
    }, 
   getStr: function (ptr) {
      var ret=UTF8ToString(ptr);
      return ret;
    }, 
   get64: function (low, high) {
      if (low>=0)
        assert(high===0);
      else 
        assert(high===-1);
      return low;
    }}
  function _fd_write(fd, iov, iovcnt, pnum) {
    var num=0;
    for (var i=0; i<iovcnt; i++) {
        var ptr=HEAP32[(((iov)+(i*8))>>2)];
        var len=HEAP32[(((iov)+(i*8+4))>>2)];
        for (var j=0; j<len; j++) {
            SYSCALLS.printChar(fd, HEAPU8[ptr+j]);
        }
        num+=len;
    }
    HEAP32[((pnum)>>2)] = num;
    return 0;
  }
  function _setTempRet0($i) {
    setTempRet0(($i)|0);
  }
  var ASSERTIONS=true;
  function intArrayFromString(stringy, dontAddNull, length) {
    var len=length>0 ? length : lengthBytesUTF8(stringy)+1;
    var u8array=new Array(len);
    var numBytesWritten=stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull)
      u8array.length = numBytesWritten;
    return u8array;
  }
  function intArrayToString(array) {
    var ret=[];
    for (var i=0; i<array.length; i++) {
        var chr=array[i];
        if (chr>0xff) {
            if (ASSERTIONS) {
                assert(false, 'Character code '+chr+' ('+String.fromCharCode(chr)+')  at offset '+i+' not in 0x00-0xFF.');
            }
            chr&=0xff;
        }
        ret.push(String.fromCharCode(chr));
    }
    return ret.join('');
  }
  var asmGlobalArg={}
  var asmLibraryArg={"__handle_stack_overflow": ___handle_stack_overflow, 
   "clock": _clock, 
   "emscripten_get_sbrk_ptr": _emscripten_get_sbrk_ptr, 
   "emscripten_memcpy_big": _emscripten_memcpy_big, 
   "emscripten_resize_heap": _emscripten_resize_heap, 
   "fd_write": _fd_write, 
   "memory": wasmMemory, 
   "sendMessage": sendMessage, 
   "setTempRet0": _setTempRet0, 
   "table": wasmTable}
  var asm=createWasm();
  Module["asm"] = asm;
  var ___wasm_call_ctors=Module["___wasm_call_ctors"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["__wasm_call_ctors"].apply(null, arguments);
  }
  var _FM_malloc=Module["_FM_malloc"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["FM_malloc"].apply(null, arguments);
  }
  var _malloc=Module["_malloc"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["malloc"].apply(null, arguments);
  }
  var _FM_free=Module["_FM_free"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["FM_free"].apply(null, arguments);
  }
  var _free=Module["_free"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["free"].apply(null, arguments);
  }
  var ___em_js__sendMessage=Module["___em_js__sendMessage"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["__em_js__sendMessage"].apply(null, arguments);
  }
  var _gotMessage=Module["_gotMessage"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["gotMessage"].apply(null, arguments);
  }
  var _main=Module["_main"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["main"].apply(null, arguments);
  }
  var ___errno_location=Module["___errno_location"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["__errno_location"].apply(null, arguments);
  }
  var _fflush=Module["_fflush"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["fflush"].apply(null, arguments);
  }
  var ___set_stack_limit=Module["___set_stack_limit"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["__set_stack_limit"].apply(null, arguments);
  }
  var stackSave=Module["stackSave"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["stackSave"].apply(null, arguments);
  }
  var stackAlloc=Module["stackAlloc"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["stackAlloc"].apply(null, arguments);
  }
  var stackRestore=Module["stackRestore"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["stackRestore"].apply(null, arguments);
  }
  var __growWasmMemory=Module["__growWasmMemory"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["__growWasmMemory"].apply(null, arguments);
  }
  var dynCall_ii=Module["dynCall_ii"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_ii"].apply(null, arguments);
  }
  var dynCall_iiii=Module["dynCall_iiii"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iiii"].apply(null, arguments);
  }
  var dynCall_jiji=Module["dynCall_jiji"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_jiji"].apply(null, arguments);
  }
  var dynCall_iidiiii=Module["dynCall_iidiiii"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_iidiiii"].apply(null, arguments);
  }
  var dynCall_vii=Module["dynCall_vii"] = function () {
    assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
    assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
    return Module["asm"]["dynCall_vii"].apply(null, arguments);
  }
  Module['asm'] = asm;
  if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromString"))
    Module["intArrayFromString"] = function () {
    abort("'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "intArrayToString"))
    Module["intArrayToString"] = function () {
    abort("'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  Module["ccall"] = ccall;
  if (!Object.getOwnPropertyDescriptor(Module, "cwrap"))
    Module["cwrap"] = function () {
    abort("'cwrap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "setValue"))
    Module["setValue"] = function () {
    abort("'setValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "getValue"))
    Module["getValue"] = function () {
    abort("'getValue' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "allocate"))
    Module["allocate"] = function () {
    abort("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  Module["getMemory"] = getMemory;
  if (!Object.getOwnPropertyDescriptor(Module, "UTF8ArrayToString"))
    Module["UTF8ArrayToString"] = function () {
    abort("'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "UTF8ToString"))
    Module["UTF8ToString"] = function () {
    abort("'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8Array"))
    Module["stringToUTF8Array"] = function () {
    abort("'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8"))
    Module["stringToUTF8"] = function () {
    abort("'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF8"))
    Module["lengthBytesUTF8"] = function () {
    abort("'lengthBytesUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stackTrace"))
    Module["stackTrace"] = function () {
    abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "addOnPreRun"))
    Module["addOnPreRun"] = function () {
    abort("'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  Module["addOnInit"] = addOnInit;
  Module["addOnPreMain"] = addOnPreMain;
  if (!Object.getOwnPropertyDescriptor(Module, "addOnExit"))
    Module["addOnExit"] = function () {
    abort("'addOnExit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "addOnPostRun"))
    Module["addOnPostRun"] = function () {
    abort("'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "writeStringToMemory"))
    Module["writeStringToMemory"] = function () {
    abort("'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "writeArrayToMemory"))
    Module["writeArrayToMemory"] = function () {
    abort("'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "writeAsciiToMemory"))
    Module["writeAsciiToMemory"] = function () {
    abort("'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "addRunDependency"))
    Module["addRunDependency"] = function () {
    abort("'addRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "removeRunDependency"))
    Module["removeRunDependency"] = function () {
    abort("'removeRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS_createFolder"))
    Module["FS_createFolder"] = function () {
    abort("'FS_createFolder' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS_createPath"))
    Module["FS_createPath"] = function () {
    abort("'FS_createPath' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS_createDataFile"))
    Module["FS_createDataFile"] = function () {
    abort("'FS_createDataFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS_createPreloadedFile"))
    Module["FS_createPreloadedFile"] = function () {
    abort("'FS_createPreloadedFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS_createLazyFile"))
    Module["FS_createLazyFile"] = function () {
    abort("'FS_createLazyFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS_createLink"))
    Module["FS_createLink"] = function () {
    abort("'FS_createLink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS_createDevice"))
    Module["FS_createDevice"] = function () {
    abort("'FS_createDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS_unlink"))
    Module["FS_unlink"] = function () {
    abort("'FS_unlink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "dynamicAlloc"))
    Module["dynamicAlloc"] = function () {
    abort("'dynamicAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "loadDynamicLibrary"))
    Module["loadDynamicLibrary"] = function () {
    abort("'loadDynamicLibrary' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "loadWebAssemblyModule"))
    Module["loadWebAssemblyModule"] = function () {
    abort("'loadWebAssemblyModule' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "getLEB"))
    Module["getLEB"] = function () {
    abort("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "getFunctionTables"))
    Module["getFunctionTables"] = function () {
    abort("'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "alignFunctionTables"))
    Module["alignFunctionTables"] = function () {
    abort("'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "registerFunctions"))
    Module["registerFunctions"] = function () {
    abort("'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "addFunction"))
    Module["addFunction"] = function () {
    abort("'addFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "removeFunction"))
    Module["removeFunction"] = function () {
    abort("'removeFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper"))
    Module["getFuncWrapper"] = function () {
    abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "prettyPrint"))
    Module["prettyPrint"] = function () {
    abort("'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "makeBigInt"))
    Module["makeBigInt"] = function () {
    abort("'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "dynCall"))
    Module["dynCall"] = function () {
    abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "getCompilerSetting"))
    Module["getCompilerSetting"] = function () {
    abort("'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "print"))
    Module["print"] = function () {
    abort("'print' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "printErr"))
    Module["printErr"] = function () {
    abort("'printErr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "getTempRet0"))
    Module["getTempRet0"] = function () {
    abort("'getTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "setTempRet0"))
    Module["setTempRet0"] = function () {
    abort("'setTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "callMain"))
    Module["callMain"] = function () {
    abort("'callMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "abort"))
    Module["abort"] = function () {
    abort("'abort' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stringToNewUTF8"))
    Module["stringToNewUTF8"] = function () {
    abort("'stringToNewUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "emscripten_realloc_buffer"))
    Module["emscripten_realloc_buffer"] = function () {
    abort("'emscripten_realloc_buffer' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "ENV"))
    Module["ENV"] = function () {
    abort("'ENV' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "setjmpId"))
    Module["setjmpId"] = function () {
    abort("'setjmpId' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_CODES"))
    Module["ERRNO_CODES"] = function () {
    abort("'ERRNO_CODES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "ERRNO_MESSAGES"))
    Module["ERRNO_MESSAGES"] = function () {
    abort("'ERRNO_MESSAGES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "setErrNo"))
    Module["setErrNo"] = function () {
    abort("'setErrNo' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "DNS"))
    Module["DNS"] = function () {
    abort("'DNS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "GAI_ERRNO_MESSAGES"))
    Module["GAI_ERRNO_MESSAGES"] = function () {
    abort("'GAI_ERRNO_MESSAGES' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "Protocols"))
    Module["Protocols"] = function () {
    abort("'Protocols' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "Sockets"))
    Module["Sockets"] = function () {
    abort("'Sockets' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "UNWIND_CACHE"))
    Module["UNWIND_CACHE"] = function () {
    abort("'UNWIND_CACHE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "readAsmConstArgs"))
    Module["readAsmConstArgs"] = function () {
    abort("'readAsmConstArgs' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "jstoi_q"))
    Module["jstoi_q"] = function () {
    abort("'jstoi_q' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "jstoi_s"))
    Module["jstoi_s"] = function () {
    abort("'jstoi_s' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "reallyNegative"))
    Module["reallyNegative"] = function () {
    abort("'reallyNegative' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "formatString"))
    Module["formatString"] = function () {
    abort("'formatString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "PATH"))
    Module["PATH"] = function () {
    abort("'PATH' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "PATH_FS"))
    Module["PATH_FS"] = function () {
    abort("'PATH_FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "SYSCALLS"))
    Module["SYSCALLS"] = function () {
    abort("'SYSCALLS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "syscallMmap2"))
    Module["syscallMmap2"] = function () {
    abort("'syscallMmap2' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "syscallMunmap"))
    Module["syscallMunmap"] = function () {
    abort("'syscallMunmap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "flush_NO_FILESYSTEM"))
    Module["flush_NO_FILESYSTEM"] = function () {
    abort("'flush_NO_FILESYSTEM' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "JSEvents"))
    Module["JSEvents"] = function () {
    abort("'JSEvents' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "specialHTMLTargets"))
    Module["specialHTMLTargets"] = function () {
    abort("'specialHTMLTargets' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "demangle"))
    Module["demangle"] = function () {
    abort("'demangle' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "demangleAll"))
    Module["demangleAll"] = function () {
    abort("'demangleAll' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "jsStackTrace"))
    Module["jsStackTrace"] = function () {
    abort("'jsStackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stackTrace"))
    Module["stackTrace"] = function () {
    abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "getEnvStrings"))
    Module["getEnvStrings"] = function () {
    abort("'getEnvStrings' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64"))
    Module["writeI53ToI64"] = function () {
    abort("'writeI53ToI64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Clamped"))
    Module["writeI53ToI64Clamped"] = function () {
    abort("'writeI53ToI64Clamped' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToI64Signaling"))
    Module["writeI53ToI64Signaling"] = function () {
    abort("'writeI53ToI64Signaling' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Clamped"))
    Module["writeI53ToU64Clamped"] = function () {
    abort("'writeI53ToU64Clamped' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "writeI53ToU64Signaling"))
    Module["writeI53ToU64Signaling"] = function () {
    abort("'writeI53ToU64Signaling' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "readI53FromI64"))
    Module["readI53FromI64"] = function () {
    abort("'readI53FromI64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "readI53FromU64"))
    Module["readI53FromU64"] = function () {
    abort("'readI53FromU64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "convertI32PairToI53"))
    Module["convertI32PairToI53"] = function () {
    abort("'convertI32PairToI53' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "convertU32PairToI53"))
    Module["convertU32PairToI53"] = function () {
    abort("'convertU32PairToI53' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "Browser"))
    Module["Browser"] = function () {
    abort("'Browser' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "FS"))
    Module["FS"] = function () {
    abort("'FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "MEMFS"))
    Module["MEMFS"] = function () {
    abort("'MEMFS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "TTY"))
    Module["TTY"] = function () {
    abort("'TTY' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "PIPEFS"))
    Module["PIPEFS"] = function () {
    abort("'PIPEFS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "SOCKFS"))
    Module["SOCKFS"] = function () {
    abort("'SOCKFS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "GL"))
    Module["GL"] = function () {
    abort("'GL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGet"))
    Module["emscriptenWebGLGet"] = function () {
    abort("'emscriptenWebGLGet' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetTexPixelData"))
    Module["emscriptenWebGLGetTexPixelData"] = function () {
    abort("'emscriptenWebGLGetTexPixelData' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetUniform"))
    Module["emscriptenWebGLGetUniform"] = function () {
    abort("'emscriptenWebGLGetUniform' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "emscriptenWebGLGetVertexAttrib"))
    Module["emscriptenWebGLGetVertexAttrib"] = function () {
    abort("'emscriptenWebGLGetVertexAttrib' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "AL"))
    Module["AL"] = function () {
    abort("'AL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "SDL_unicode"))
    Module["SDL_unicode"] = function () {
    abort("'SDL_unicode' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "SDL_ttfContext"))
    Module["SDL_ttfContext"] = function () {
    abort("'SDL_ttfContext' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "SDL_audio"))
    Module["SDL_audio"] = function () {
    abort("'SDL_audio' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "SDL"))
    Module["SDL"] = function () {
    abort("'SDL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "SDL_gfx"))
    Module["SDL_gfx"] = function () {
    abort("'SDL_gfx' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "GLUT"))
    Module["GLUT"] = function () {
    abort("'GLUT' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "EGL"))
    Module["EGL"] = function () {
    abort("'EGL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "GLFW_Window"))
    Module["GLFW_Window"] = function () {
    abort("'GLFW_Window' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "GLFW"))
    Module["GLFW"] = function () {
    abort("'GLFW' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "GLEW"))
    Module["GLEW"] = function () {
    abort("'GLEW' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "IDBStore"))
    Module["IDBStore"] = function () {
    abort("'IDBStore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "runAndAbortIfError"))
    Module["runAndAbortIfError"] = function () {
    abort("'runAndAbortIfError' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "warnOnce"))
    Module["warnOnce"] = function () {
    abort("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stackSave"))
    Module["stackSave"] = function () {
    abort("'stackSave' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stackRestore"))
    Module["stackRestore"] = function () {
    abort("'stackRestore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stackAlloc"))
    Module["stackAlloc"] = function () {
    abort("'stackAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "AsciiToString"))
    Module["AsciiToString"] = function () {
    abort("'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stringToAscii"))
    Module["stringToAscii"] = function () {
    abort("'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "UTF16ToString"))
    Module["UTF16ToString"] = function () {
    abort("'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF16"))
    Module["stringToUTF16"] = function () {
    abort("'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF16"))
    Module["lengthBytesUTF16"] = function () {
    abort("'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "UTF32ToString"))
    Module["UTF32ToString"] = function () {
    abort("'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF32"))
    Module["stringToUTF32"] = function () {
    abort("'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF32"))
    Module["lengthBytesUTF32"] = function () {
    abort("'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8"))
    Module["allocateUTF8"] = function () {
    abort("'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8OnStack"))
    Module["allocateUTF8OnStack"] = function () {
    abort("'allocateUTF8OnStack' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
  }
  Module["writeStackCookie"] = writeStackCookie;
  Module["checkStackCookie"] = checkStackCookie;
  Module["abortStackOverflow"] = abortStackOverflow;
  if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_NORMAL"))
    Object.defineProperty(Module, "ALLOC_NORMAL", {configurable: true, 
   get: function () {
      abort("'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
    }});
  if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_STACK"))
    Object.defineProperty(Module, "ALLOC_STACK", {configurable: true, 
   get: function () {
      abort("'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
    }});
  if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_DYNAMIC"))
    Object.defineProperty(Module, "ALLOC_DYNAMIC", {configurable: true, 
   get: function () {
      abort("'ALLOC_DYNAMIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
    }});
  if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_NONE"))
    Object.defineProperty(Module, "ALLOC_NONE", {configurable: true, 
   get: function () {
      abort("'ALLOC_NONE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)");
    }});
  var calledRun;
  function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit("+status+")";
    this.status = status;
  }
  var calledMain=false;
  dependenciesFulfilled = function runCaller() {
    if (!calledRun)
      run();
    if (!calledRun)
      dependenciesFulfilled = runCaller;
  }
  function callMain(args) {
    assert(runDependencies==0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
    assert(__ATPRERUN__.length==0, 'cannot call main when preRun functions remain to be called');
    var entryFunction=Module['_main'];
    args = args||[];
    var argc=args.length+1;
    var argv=stackAlloc((argc+1)*4);
    HEAP32[argv>>2] = allocateUTF8OnStack(thisProgram);
    for (var i=1; i<argc; i++) {
        HEAP32[(argv>>2)+i] = allocateUTF8OnStack(args[i-1]);
    }
    HEAP32[(argv>>2)+argc] = 0;
    try {
      Module['___set_stack_limit'](STACK_MAX);
      var ret=entryFunction(argc, argv);
      exit(ret, true);
    }
    catch (e) {
        if (__instance_of(e, ExitStatus)) {
            return ;
        }
        else 
          if (e=='unwind') {
            noExitRuntime = true;
            return ;
        }
        else {
          var toLog=e;
          if (e&&typeof e==='object'&&e.stack) {
              toLog = [e, e.stack];
          }
          err('exception thrown: '+toLog);
          quit_(1, e);
        }
    }
    finally {
        calledMain = true;
      }
  }
  function run(args) {
    args = args||arguments_;
    if (runDependencies>0) {
        return ;
    }
    writeStackCookie();
    preRun();
    if (runDependencies>0)
      return ;
    function doRun() {
      if (calledRun)
        return ;
      calledRun = true;
      Module['calledRun'] = true;
      if (ABORT)
        return ;
      initRuntime();
      preMain();
      if (Module['onRuntimeInitialized'])
        Module['onRuntimeInitialized']();
      if (shouldRunNow)
        callMain(args);
      postRun();
    }
    if (Module['setStatus']) {
        Module['setStatus']('Running...');
        setTimeout(function () {
          setTimeout(function () {
            Module['setStatus']('');
          }, 1);
          doRun();
        }, 1);
    }
    else {
      doRun();
    }
    checkStackCookie();
  }
  Module['run'] = run;
  function checkUnflushedContent() {
    var print=out;
    var printErr=err;
    var has=false;
    out = err = function (x) {
      has = true;
    }
    try {
      var flush=flush_NO_FILESYSTEM;
      if (flush)
        flush();
    }
    catch (e) {
    }
    out = print;
    err = printErr;
    if (has) {
        warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.');
        warnOnce('(this may also be due to not including full filesystem support - try building with -s FORCE_FILESYSTEM=1)');
    }
  }
  function exit(status, implicit) {
    checkUnflushedContent();
    if (implicit&&noExitRuntime&&status===0) {
        return ;
    }
    if (noExitRuntime) {
        if (!implicit) {
            var msg='program exited (with status: '+status+'), but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)';
            err(msg);
        }
    }
    else {
      ABORT = true;
      EXITSTATUS = status;
      exitRuntime();
      if (Module['onExit'])
        Module['onExit'](status);
    }
    quit_(status, new ExitStatus(status));
  }
  if (Module['preInit']) {
      if (typeof Module['preInit']=='function')
        Module['preInit'] = [Module['preInit']];
      while (Module['preInit'].length>0) {
        Module['preInit'].pop()();
      }
  }
  var shouldRunNow=true;
  if (Module['noInitialRun'])
    shouldRunNow = false;
  noExitRuntime = true;
  run();
}, '/dev/fairmotion/src/wasm/built_wasm.js');
es6_module_define('native_api', ["../curve/solver.js", "../curve/spline_math_hermite.js", "../core/toolops_api.js", "./built_wasm.js", "../core/ajax.js", "../util/typedwriter.js", "../curve/spline_base.js"], function _native_api_module(_es6_module) {
  var wasm=es6_import(_es6_module, './built_wasm.js');
  var active_solves={}
  active_solves = _es6_module.add_export('active_solves', active_solves);
  var solve_starttimes={}
  solve_starttimes = _es6_module.add_export('solve_starttimes', solve_starttimes);
  var solve_starttimes2={}
  solve_starttimes2 = _es6_module.add_export('solve_starttimes2', solve_starttimes2);
  var solve_endtimes={}
  solve_endtimes = _es6_module.add_export('solve_endtimes', solve_endtimes);
  var active_jobs={}
  active_jobs = _es6_module.add_export('active_jobs', active_jobs);
  var constraint=es6_import_item(_es6_module, '../curve/solver.js', 'constraint');
  var solver=es6_import_item(_es6_module, '../curve/solver.js', 'solver');
  var ModalStates=es6_import_item(_es6_module, '../core/toolops_api.js', 'ModalStates');
  var SplineTypes=es6_import_item(_es6_module, '../curve/spline_base.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../curve/spline_base.js', 'SplineFlags');
  var build_solver=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'build_solver');
  var solve_pre=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'solve_pre');
  var TypedWriter=es6_import_item(_es6_module, '../util/typedwriter.js', 'TypedWriter');
  var ajax=es6_import(_es6_module, '../core/ajax.js');
  function isReady() {
    return wasm.calledRun;
  }
  isReady = _es6_module.add_export('isReady', isReady);
  var mmax=Math.max, mmin=Math.min, mfloor=Math.floor;
  var abs=Math.abs, sqrt=Math.sqrt, sin=Math.sin, cos=Math.cos, pow=Math.pow, log=Math.log, acos=Math.acos, asin=Math.asin, PI=Math.PI;
  var last_call=undefined;
  var DEBUG=false;
  var FIXED_KS_FLAG=SplineFlags.FIXED_KS;
  var callbacks={}
  callbacks = _es6_module.add_export('callbacks', callbacks);
  var msg_idgen=0;
  var solve_idgen=0;
  var ORDER=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, '../curve/spline_math_hermite.js', 'INT_STEPS');
  function onMessage(type, message, ptr) {
    var iview=new Int32Array(message);
    var id=iview[1];
    if (DEBUG)
      console.log("got array buffer!", message, "ID", id);
    if (!(id in callbacks)) {
        if (DEBUG)
          console.log("Warning, dead communication callback", id);
        return ;
    }
    var job=callbacks[id], iter=job.job;
    if (DEBUG)
      console.log("job:", job);
    job.status.data = message.slice(8, message.byteLength);
    if (DEBUG)
      console.log("iter:", iter, iter.data);
    var ret=iter.next();
    if (ret.done) {
        delete callbacks[id];
        if (job.callback!=undefined)
          job.callback.call(job.thisvar, job.status.value);
    }
    wasm._free(ptr);
  }
  onMessage = _es6_module.add_export('onMessage', onMessage);
  var messageQueue=[];
  messageQueue = _es6_module.add_export('messageQueue', messageQueue);
  var queueMessages=false;
  function queueUpMessages(state) {
    queueMessages = state;
  }
  queueUpMessages = _es6_module.add_export('queueUpMessages', queueUpMessages);
  function flushQueue() {
    let queue=messageQueue.slice(0, messageQueue.length);
    messageQueue.length = 0;
    for (let msg of queue) {
        onMessage(msg.type, msg.msg, msg.ptr);
    }
  }
  flushQueue = _es6_module.add_export('flushQueue', flushQueue);
  window._wasm_post_message = function (type, ptr, len) {
    if (DEBUG)
      console.log("got wasm message", type, ptr, len);
    let message=wasm.HEAPU8.slice(ptr, ptr+len).buffer;
    if (DEBUG)
      console.log(message);
    if (!queueMessages) {
        onMessage(type, message, ptr);
    }
    else {
      if (DEBUG)
        console.log("Queuing a message!", type, message, ptr, "=======");
      messageQueue.push({type: type, 
     msg: message, 
     ptr: ptr});
    }
  }
  function postToWasm(type, msg) {
    if (!(__instance_of(msg, ArrayBuffer))) {
        throw new Error("msg must be array buffer");
    }
    let bytes=new Uint8Array(msg);
    let ptr=wasm._malloc(msg.byteLength*2);
    let mem=wasm.HEAPU8;
    for (let i=ptr; i<ptr+bytes.length; i++) {
        mem[i] = bytes[i-ptr];
    }
    wasm._gotMessage(type, ptr, msg.byteLength);
    wasm._free(ptr);
  }
  postToWasm = _es6_module.add_export('postToWasm', postToWasm);
  function test_wasm() {
    let msg=new Int32Array([0, 1, 2, 3, 2, 1, -1]);
    console.log(msg);
    postToWasm(0, msg.buffer);
  }
  test_wasm = _es6_module.add_export('test_wasm', test_wasm);
  var MessageTypes={GEN_DRAW_BEZIERS: 0, 
   REPLY: 1, 
   SOLVE: 2}
  MessageTypes = _es6_module.add_export('MessageTypes', MessageTypes);
  var ConstraintTypes={TAN_CONSTRAINT: 0, 
   HARD_TAN_CONSTRAINT: 1, 
   CURVATURE_CONSTRAINT: 2, 
   COPY_C_CONSTRAINT: 3}
  ConstraintTypes = _es6_module.add_export('ConstraintTypes', ConstraintTypes);
  var JobTypes={DRAWSOLVE: 1, 
   PATHSOLVE: 2, 
   SOLVE: 1|2}
  JobTypes = _es6_module.add_export('JobTypes', JobTypes);
  function clear_jobs_except_latest(typeid) {
    var last=undefined;
    var lastk=undefined;
    for (var k in callbacks) {
        var job=callbacks[k];
        if (job.typeid&typeid) {
            job._skip = 1;
            delete callbacks[k];
            last = job;
            lastk = k;
        }
    }
    if (last!=undefined) {
        callbacks[lastk] = last;
        delete last._skip;
    }
  }
  clear_jobs_except_latest = _es6_module.add_export('clear_jobs_except_latest', clear_jobs_except_latest);
  function clear_jobs_except_first(typeid) {
    var last=undefined;
    var lastk=undefined;
    for (var k in callbacks) {
        var job=callbacks[k];
        if (job.typeid&typeid) {
            if (last!=undefined) {
                job._skip = 1;
                delete callbacks[k];
            }
            last = job;
            lastk = k;
        }
    }
  }
  clear_jobs_except_first = _es6_module.add_export('clear_jobs_except_first', clear_jobs_except_first);
  function clear_jobs(typeid) {
    for (var k in callbacks) {
        var job=callbacks[k];
        if (job.typeid&typeid) {
            job._skip = 1;
            delete callbacks[k];
        }
    }
  }
  clear_jobs = _es6_module.add_export('clear_jobs', clear_jobs);
  function call_api(job, params) {
    if (params===undefined) {
        params = undefined;
    }
    var callback, error, thisvar, typeid, only_latest=false;
    if (params!=undefined) {
        callback = params.callback;
        thisvar = params.thisvar!=undefined ? params.thisvar : self;
        error = params.error;
        only_latest = params.only_latest!=undefined ? params.only_latest : false;
        typeid = params.typeid;
    }
    var postMessage=function (type, msg) {
      postToWasm(type, msg);
    }
    var id=msg_idgen++;
    var status={msgid: id, 
    data: undefined}
    var args=[postMessage, status];
    for (var i=2; i<arguments.length; i++) {
        args.push(arguments[i]);
    }
    queueUpMessages(true);
    var iter=job.apply(job, args);
    var ret=iter.next();
    if (ret.done) {
        callback.call(thisvar, iter.value);
        return ;
    }
    if (DEBUG)
      console.log("  SETTING CALLBACK WITH ID", id);
    callbacks[id] = {job: iter, 
    typeid: typeid, 
    only_latest: only_latest, 
    callback: callback, 
    thisvar: thisvar, 
    error: error, 
    status: status}
    queueUpMessages(false);
    flushQueue();
  }
  call_api = _es6_module.add_export('call_api', call_api);
  function start_message(type, msgid, endian) {
    var data=[];
    ajax.pack_int(data, type, endian);
    ajax.pack_int(data, msgid, endian);
    return data;
  }
  start_message = _es6_module.add_export('start_message', start_message);
  function start_message_new(writer, type, msgid, endian) {
    writer.int32(type);
    writer.int32(msgid);
  }
  start_message_new = _es6_module.add_export('start_message_new', start_message_new);
  function _unpacker(dview) {
    var b=0;
    return {getint: function getint() {
        b+=4;
        return dview.getInt32(b-4, endian);
      }, 
    getfloat: function getfloat() {
        b+=4;
        return dview.getFloat32(b-4, endian);
      }, 
    getdouble: function getdouble() {
        b+=8;
        return dview.getFloat64(b-8, endian);
      }}
  }
  function* gen_draw_cache(postMessage, status, spline) {
    var data=[];
    var msgid=status.msgid;
    var endian=ajax.little_endian;
    var data=start_message(MessageTypes.GEN_DRAW_BEZIERS, msgid, endian);
    ajax.pack_int(data, spline.segments.length, endian);
    ajax.pack_int(data, 0, endian);
    for (var s of spline.segments) {
        ajax.pack_int(data, s.eid, endian);
        ajax.pack_vec3(data, s.v1, endian);
        ajax.pack_vec3(data, s.v2, endian);
        ajax.pack_int(data, s.ks.length, endian);
        var zero_ks=((s.v1.flag&SplineFlags.BREAK_TANGENTS)||(s.v2.flag&SplineFlags.BREAK_TANGENTS));
        for (var i=0; i<s.ks.length; i++) {
            if (zero_ks&&i<ORDER)
              ajax.pack_double(data, 0.0, endian);
            else 
              ajax.pack_double(data, s.ks[i], endian);
        }
        var rem=16-s.ks.length;
        for (var i=0; i<rem; i++) {
            ajax.pack_double(data, 0.0, endian);
        }
    }
    data = new Uint8Array(data).buffer;
    postMessage(MessageTypes.GEN_DRAW_BEZIERS, data);
    yield ;
    var dview=new DataView(status.data);
    var upack=_unpacker(dview);
    var getint=upack.getint;
    var getfloat=upack.getfloat;
    var getdouble=upack.getdouble;
    var tot=getint();
    var ret=[];
    var eidmap=spline.eidmap;
    for (var i=0; i<tot; i++) {
        var eid=getint(), totseg=getint();
        var segs=[];
        var seg=eidmap[eid];
        if (seg==undefined||seg.type!=SplineTypes.SEGMENT) {
            console.log("WARNING: defunct segment in gen_draw_cache", seg);
        }
        ret.push(segs);
        for (var j=0; j<totseg; j++) {
            segs[j] = [0, 0, 0, 0];
        }
        for (var j=0; j<totseg*4; j++) {
            var p=new Vector3();
            p[0] = getdouble();
            p[1] = getdouble();
            p[2] = 0.0;
            segs[Math.floor(j/4)][j%4] = p;
        }
        if (seg!=undefined) {
            seg._draw_bzs = segs;
        }
    }
    status.value = ret;
  }
  gen_draw_cache = _es6_module.add_export('gen_draw_cache', gen_draw_cache);
  function do_solve(sflags, spline, steps, gk, return_promise) {
    if (gk===undefined) {
        gk = 0.95;
    }
    if (return_promise===undefined) {
        return_promise = false;
    }
    let draw_id=push_solve(spline);
    spline._solve_id = draw_id;
    var job_id=solve_idgen++;
    active_solves[spline._solve_id] = job_id;
    active_jobs[job_id] = spline._solve_id;
    solve_starttimes[job_id] = time_ms();
    var SplineFlags=sflags;
    spline.resolve = 1;
    solve_pre(spline);
    var on_finish, on_reject, promise;
    if (return_promise) {
        promise = new Promise(function (resolve, reject) {
          on_finish = function () {
            resolve();
          }
          on_reject = function () {
            reject();
          }
        });
    }
    function finish(unload) {
      var start_time=solve_starttimes[job_id];
      window.pop_solve(draw_id);
      var skip=solve_endtimes[spline._solve_id]>start_time;
      skip = skip&&solve_starttimes2[spline._solve_id]>start_time;
      delete active_jobs[job_id];
      delete active_solves[spline._solve_id];
      delete solve_starttimes[job_id];
      if (skip) {
          if (on_reject!=undefined) {
              on_reject();
          }
          console.log("Dropping dead solve job", job_id);
          return ;
      }
      unload();
      solve_endtimes[spline._solve_id] = time_ms();
      solve_starttimes2[spline._solve_id] = start_time;
      if (_DEBUG.solve_times) {
          console.log((solve_endtimes[spline._solve_id]-start_time).toFixed(2)+"ms");
      }
      for (var i=0; i<spline.segments.length; i++) {
          var seg=spline.segments[i];
          seg.evaluate(0.5);
          for (var j=0; j<seg.ks.length; j++) {
              if (isNaN(seg.ks[j])) {
                  console.log("NaN!", seg.ks, seg);
                  seg.ks[j] = 0;
              }
          }
          if (g_app_state.modalstate!=ModalStates.TRANSFROMING) {
              if ((seg.v1.flag&SplineFlags.UPDATE)||(seg.v2.flag&SplineFlags.UPDATE))
                seg.update_aabb();
          }
          else {
            if ((seg.v1.flag&SplineFlags.UPDATE)||(seg.v2.flag&SplineFlags.UPDATE))
              seg.flag|=SplineFlags.UPDATE_AABB;
          }
      }
      for (var f of spline.faces) {
          for (var path of f.paths) {
              for (var l of path) {
                  if (l.v.flag&SplineFlags.UPDATE)
                    f.flag|=SplineFlags.UPDATE_AABB;
              }
          }
      }
      for (let h of spline.handles) {
          h.flag&=~(SplineFlags.UPDATE|SplineFlags.TEMP_TAG);
      }
      for (let v of spline.verts) {
          v.flag&=~(SplineFlags.UPDATE|SplineFlags.TEMP_TAG);
      }
      if (spline.on_resolve!==undefined) {
          spline.on_resolve();
          spline.on_resolve = undefined;
      }
      if (on_finish!==undefined) {
          on_finish();
      }
    }
    spline.resolve = 0;
    var update_verts=new set();
    var slv=build_solver(spline, ORDER, undefined, 1, undefined, update_verts);
    var cs=slv.cs, edge_segs=slv.edge_segs;
    edge_segs = new set(edge_segs);
    call_api(nacl_solve, {callback: function (value) {
        finish(value);
      }, 
    error: function (error) {
        console.log("Nacl solve error!");
        window.pop_solve(draw_id);
      }, 
    typeid: spline.is_anim_path ? JobTypes.PATHSOLVE : JobTypes.DRAWSOLVE, 
    only_latest: true}, spline, cs, update_verts, gk, edge_segs);
    return promise;
  }
  do_solve = _es6_module.add_export('do_solve', do_solve);
  window.nacl_do_solve = do_solve;
  function write_nacl_solve_new(writer, spline, cons, update_verts, update_segs, gk, edge_segs) {
    var idxmap={}
    var i=0;
    function add_vert(v) {
      writer.int32(v.eid);
      writer.int32(v.flag);
      writer.vec3(v);
      writer.int32(0);
      idxmap[v.eid] = i++;
    }
    for (var v of update_verts) {
        add_vert(v, true);
    }
    writer.int32(update_segs.length);
    writer.int32(0);
    var i=0;
    for (var s of update_segs) {
        var flag=s.flag;
        let count=s.v1.flag&SplineFlags.UPDATE ? 1 : 0;
        count+=s.v2.flag&SplineFlags.UPDATE ? 1 : 0;
        if (count<2) {
            flag|=FIXED_KS_FLAG;
        }
        writer.int32(s.eid);
        writer.int32(flag);
        var klen=s.ks.length;
        var is_eseg=edge_segs.has(s);
        var zero_ks=((s.v1.flag&SplineFlags.BREAK_TANGENTS)||(s.v2.flag&SplineFlags.BREAK_TANGENTS));
        for (var ji=0; ji<1; ji++) {
            for (var j=0; j<klen; j++) {
                if (zero_ks&&j<ORDER)
                  writer.float64(0.0);
                else 
                  writer.float64(is_eseg ? s.ks[j] : 0.0);
            }
            for (var j=0; j<16-klen; j++) {
                writer.float64(0.0);
            }
        }
        writer.vec3(s.h1);
        writer.vec3(s.h2);
        writer.int32(idxmap[s.v1.eid]);
        writer.int32(idxmap[s.v2.eid]);
        idxmap[s.eid] = i++;
    }
    writer.int32(cons.length);
    writer.int32(0.0);
    for (var i=0; i<cons.length; i++) {
        var c=cons[i];
        var type=0, seg1=-1, seg2=-1, param1=0, param2=0, fparam1=0, fparam2=0;
        if (c.type=="tan_c") {
            type = ConstraintTypes.TAN_CONSTRAINT;
            seg1 = c.params[0];
            seg2 = c.params[1];
            var v=seg1.shared_vert(seg2);
            param1 = idxmap[seg1.eid];
            param2 = idxmap[seg2.eid];
            fparam1 = seg1.v2===v;
            fparam2 = seg2.v2===v;
            if (c.klst.length==1) {
                seg1 = c.klst[0]!==seg1.ks ? param2 : param1;
                seg2 = -1;
            }
            else {
              seg1 = param1;
              seg2 = param2;
            }
        }
        else 
          if (c.type=="hard_tan_c") {
            type = ConstraintTypes.HARD_TAN_CONSTRAINT;
            var seg=c.params[0], tan=c.params[1], s=c.params[2];
            seg1 = idxmap[seg.eid];
            seg2 = -1;
            fparam1 = Math.atan2(tan[0], tan[1]);
            fparam2 = s;
        }
        else 
          if (c.type=="curv_c") {
            type = ConstraintTypes.CURVATURE_CONSTRAINT;
            seg1 = c.params[0];
            seg2 = c.params[1];
            if (seg1.ks!==c.klst[0]) {
            }
            var v=seg1.shared_vert(seg2);
            fparam1 = seg1.v2===v;
            fparam2 = seg2.v2===v;
            param1 = idxmap[seg1.eid];
            param2 = idxmap[seg2.eid];
            seg1 = param1;
            seg2 = -1;
        }
        else 
          if (c.type=="copy_c") {
            type = ConstraintTypes.COPY_C_CONSTRAINT;
            seg1 = c.params[0];
            param1 = seg1.v1.segments.length==1;
        }
        else {
          console.trace(c, seg1, seg2);
          throw new Error("unknown constraint type "+c.type);
        }
        writer.int32(type);
        writer.float32(c.k);
        writer.float32(c.k2==undefined ? c.k : c.k2);
        writer.int32(0);
        writer.int32(seg1);
        writer.int32(seg2);
        writer.int32(param1);
        writer.int32(param2);
        writer.float32(fparam1);
        writer.float32(fparam2);
        for (var j=0; j<33; j++) {
            writer.float64(0);
        }
    }
    return idxmap;
  }
  function write_nacl_solve(data, spline, cons, update_verts, update_segs, gk, edge_segs) {
    var endian=ajax.little_endian;
    var idxmap={}
    var i=0;
    function add_vert(v) {
      ajax.pack_int(data, v.eid, endian);
      ajax.pack_int(data, v.flag, endian);
      ajax.pack_vec3(data, v, endian);
      ajax.pack_int(data, 0, endian);
      idxmap[v.eid] = i++;
    }
    for (var v of update_verts) {
        add_vert(v, true);
    }
    ajax.pack_int(data, update_segs.length, endian);
    ajax.pack_int(data, 0, endian);
    var i=0;
    for (var s of update_segs) {
        var flag=s.flag;
        if (edge_segs.has(s)) {
            flag|=FIXED_KS_FLAG;
        }
        ajax.pack_int(data, s.eid, endian);
        ajax.pack_int(data, flag, endian);
        var klen=s.ks.length;
        var is_eseg=edge_segs.has(s);
        var zero_ks=((s.v1.flag&SplineFlags.BREAK_TANGENTS)||(s.v2.flag&SplineFlags.BREAK_TANGENTS));
        for (var ji=0; ji<1; ji++) {
            for (var j=0; j<klen; j++) {
                if (zero_ks&&j<ORDER)
                  ajax.pack_double(data, 0.0, endian);
                else 
                  ajax.pack_double(data, is_eseg ? s.ks[j] : 0.0, endian);
            }
            for (var j=0; j<16-klen; j++) {
                ajax.pack_double(data, 0.0, endian);
            }
        }
        ajax.pack_vec3(data, s.h1, endian);
        ajax.pack_vec3(data, s.h2, endian);
        ajax.pack_int(data, idxmap[s.v1.eid], endian);
        ajax.pack_int(data, idxmap[s.v2.eid], endian);
        idxmap[s.eid] = i++;
    }
    ajax.pack_int(data, cons.length, endian);
    ajax.pack_int(data, 0, endian);
    for (var i=0; i<cons.length; i++) {
        var c=cons[i];
        var type=0, seg1=-1, seg2=-1, param1=0, param2=0, fparam1=0, fparam2=0;
        if (c.type=="tan_c") {
            type = ConstraintTypes.TAN_CONSTRAINT;
            seg1 = c.params[0];
            seg2 = c.params[1];
            var v=seg1.shared_vert(seg2);
            param1 = idxmap[seg1.eid];
            param2 = idxmap[seg2.eid];
            fparam1 = seg1.v2===v;
            fparam2 = seg2.v2===v;
            if (c.klst.length==1) {
                seg1 = c.klst[0]!==seg1.ks ? param2 : param1;
                seg2 = -1;
            }
            else {
              seg1 = param1;
              seg2 = param2;
            }
        }
        else 
          if (c.type=="hard_tan_c") {
            type = ConstraintTypes.HARD_TAN_CONSTRAINT;
            var seg=c.params[0], tan=c.params[1], s=c.params[2];
            seg1 = idxmap[seg.eid];
            seg2 = -1;
            fparam1 = Math.atan2(tan[0], tan[1]);
            fparam2 = s;
        }
        else 
          if (c.type=="curv_c") {
            type = ConstraintTypes.CURVATURE_CONSTRAINT;
            seg1 = c.params[0];
            seg2 = c.params[1];
            if (seg1.ks!==c.klst[0]) {
            }
            var v=seg1.shared_vert(seg2);
            fparam1 = seg1.v2===v;
            fparam2 = seg2.v2===v;
            param1 = idxmap[seg1.eid];
            param2 = idxmap[seg2.eid];
            seg1 = param1;
            seg2 = -1;
        }
        else 
          if (c.type=="copy_c") {
            type = ConstraintTypes.COPY_C_CONSTRAINT;
            seg1 = c.params[0];
            param1 = seg1.v1.segments.length==1;
        }
        ajax.pack_int(data, type, endian);
        ajax.pack_float(data, c.k*gk, endian);
        ajax.pack_float(data, c.k2==undefined ? c.k*gk : c.k2*gk, endian);
        ajax.pack_int(data, 0, endian);
        ajax.pack_int(data, seg1, endian);
        ajax.pack_int(data, seg2, endian);
        ajax.pack_int(data, param1, endian);
        ajax.pack_int(data, param2, endian);
        ajax.pack_float(data, fparam1, endian);
        ajax.pack_float(data, fparam2, endian);
        for (var j=0; j<33; j++) {
            ajax.pack_double(data, 0, endian);
        }
    }
    return idxmap;
  }
  function _unload(spline, data) {
    var _i=0;
    function getint() {
      _i+=4;
      return data.getInt32(_i-4, true);
    }
    function getfloat() {
      _i+=4;
      return data.getFloat32(_i-4, true);
    }
    function getdouble() {
      _i+=8;
      return data.getFloat64(_i-8, true);
    }
    var totvert=getint();
    getint();
    _i+=24*totvert;
    var totseg=getint();
    getint();
    if (DEBUG)
      console.log("totseg:", totseg);
    for (var i=0; i<totseg; i++) {
        var eid=getint(), flag=getint();
        var seg=spline.eidmap[eid];
        if (seg==undefined||seg.type!=SplineTypes.SEGMENT) {
            console.log("WARNING: defunct/invalid segment in nacl_solve!", eid);
            _i+=160;
            continue;
        }
        for (var j=0; j<16; j++) {
            var d=getdouble();
            if (j<seg.ks.length) {
                seg.ks[j] = d;
            }
        }
        _i+=4*6;
        _i+=4*2;
    }
  }
  function wrap_unload(spline, data) {
    return function () {
      _unload(spline, data);
    }
  }
  function nacl_solve(postMessage, status, spline, cons, update_verts, gk, edge_segs) {
    var ret={}
    ret.ret = {done: false, 
    value: undefined}
    ret.stage = 0;
    ret[Symbol.iterator] = function () {
      return this;
    }
    ret.next = function () {
      if (ret.stage==0) {
          this.stage++;
          this.stage0();
          return this.ret;
      }
      else 
        if (ret.stage==1) {
          this.stage++;
          this.stage1();
          this.ret.done = true;
          return this.ret;
      }
      else {
        this.ret.done = true;
        this.ret.value = undefined;
        return this.ret;
      }
    }
    var data;
    ret.stage0 = function () {
      var maxsize=(cons.length+1)*650+128;
      var writer=new TypedWriter(maxsize);
      var msgid=status.msgid;
      var endian=ajax.little_endian;
      var prof=false;
      start_message_new(writer, MessageTypes.SOLVE, msgid, endian);
      var timestart=time_ms();
      var update_segs=new set();
      for (var v of update_verts) {
          for (var i=0; i<v.segments.length; i++) {
              var s=v.segments[i];
              update_segs.add(s);
          }
      }
      for (var s of update_segs) {
          update_verts.add(s.v1);
          update_verts.add(s.v2);
      }
      if (prof)
        console.log("time a:", time_ms()-timestart);
      writer.int32(update_verts.length);
      writer.int32(0);
      if (prof)
        console.log("time b:", time_ms()-timestart);
      var idxmap=write_nacl_solve_new(writer, spline, cons, update_verts, update_segs, gk, edge_segs);
      var data=writer.final();
      if (prof)
        console.log("time c:", time_ms()-timestart);
      if (prof)
        console.log("time d:", time_ms()-timestart, data.byteLength);
      postMessage(MessageTypes.SOLVE, data);
      if (prof)
        console.log("time e:", time_ms()-timestart, "\n\n\n");
    }
    ret.stage1 = function () {
      let buf1=status.data;
      data = new DataView(buf1);
      status.value = wrap_unload(spline, data);
    }
    return ret;
  }
  nacl_solve = _es6_module.add_export('nacl_solve', nacl_solve);
}, '/dev/fairmotion/src/wasm/native_api.js');
es6_module_define('addon_api', [], function _addon_api_module(_es6_module) {
  "use strict";
  var modules={}
  class Addon  {
    static  define() {
      return {author: "", 
     email: "", 
     version: "", 
     tooltip: "", 
     description: "", 
     struct_classes: []}
    }
     constructor(manager) {
      this.manager = manager;
    }
     define_data_api(api) {

    }
     init_addon() {

    }
     destroy_addon() {

    }
     handle_versioning(file, oldversion) {

    }
  }
  _ESClass.register(Addon);
  _es6_module.add_class(Addon);
  Addon = _es6_module.add_export('Addon', Addon);
  class AddonManager  {
     constructor() {
      this.addons = [];
      this.datablock_types = [];
    }
     register_datablock_type(cls) {
      this.datablock_types.push(cls);
    }
     unregister_datablock_type(cls) {
      this.datablock_types.remove(cls, false);
    }
     getmodule(name) {
      return modules[name];
    }
     getmodules() {
      return Object.getOwnPropertyNames(modules);
    }
  }
  _ESClass.register(AddonManager);
  _es6_module.add_class(AddonManager);
  AddonManager = _es6_module.add_export('AddonManager', AddonManager);
}, '/dev/fairmotion/src/addon_api/addon_api.js');
es6_module_define('scene', ["./sceneobject.js", "../core/eventdag.js", "../curve/spline_base.js", "../core/struct.js", "../core/frameset.js", "../editors/viewport/selectmode.js", "../core/lib_api.js", "../editors/viewport/toolmodes/toolmode.js"], function _scene_module(_es6_module) {
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var DataBlock=es6_import_item(_es6_module, '../core/lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, '../core/lib_api.js', 'DataTypes');
  var SplineFrameSet=es6_import_item(_es6_module, '../core/frameset.js', 'SplineFrameSet');
  var SceneObject=es6_import_item(_es6_module, './sceneobject.js', 'SceneObject');
  var ObjectFlags=es6_import_item(_es6_module, './sceneobject.js', 'ObjectFlags');
  var DataPathNode=es6_import_item(_es6_module, '../core/eventdag.js', 'DataPathNode');
  var SplineElement=es6_import_item(_es6_module, '../curve/spline_base.js', 'SplineElement');
  var ToolModes=es6_import_item(_es6_module, '../editors/viewport/toolmodes/toolmode.js', 'ToolModes');
  var SelMask=es6_import_item(_es6_module, '../editors/viewport/selectmode.js', 'SelMask');
  class ObjectList extends Array {
    
    
     constructor(scene) {
      super();
      this.idmap = {};
      this.namemap = {};
      this.scene = scene;
      this.active = undefined;
    }
     get(id_or_string) {
      if (typeof id_or_string=="string") {
          return this.namemap[id_or_string];
      }
      else {
        return this.idmap[id_or_string];
      }
    }
     has(ob) {
      return ob.id in this.idmap;
    }
     push(ob) {
      this.add(ob);
    }
     add(ob) {
      this.idmap[ob.id] = ob;
      this.namemap[ob.name] = ob;
      super.push(ob);
    }
     remove(ob) {
      delete this.idmap[ob.id];
      delete this.namemap[ob.name];
      super.remove(ob);
    }
     validateName(name) {
      let i=2;
      let name2=name;
      while (name2 in this.namemap) {
        name2 = name+i;
        i++;
      }
      return name2;
    }
    get  editable() {
      let this2=this;
      return (function* () {
        for (let ob of this.objects) {
            if (ob.flag&ObjectFlags.HIDE)
              continue;
            yield ob;
        }
      });
    }
    get  visible() {
      return this.editable;
    }
    get  selected_editable() {
      return (function* () {
        for (let ob of this.objects) {
            let bad=(ob.flag&ObjectFlags.HIDE);
            bad = bad|!(ob.flag&ObjectFlags.SELECT);
            yield ob;
        }
      });
    }
  }
  _ESClass.register(ObjectList);
  _es6_module.add_class(ObjectList);
  ObjectList = _es6_module.add_export('ObjectList', ObjectList);
  class ToolModeSwitchError extends Error {
  }
  _ESClass.register(ToolModeSwitchError);
  _es6_module.add_class(ToolModeSwitchError);
  ToolModeSwitchError = _es6_module.add_export('ToolModeSwitchError', ToolModeSwitchError);
  class Scene extends DataBlock {
    
    
    
    
    
    
    
     constructor() {
      super(DataTypes.SCENE);
      this.fps = 24.0;
      this.edit_all_layers = false;
      this.objects = new ObjectList(this);
      this.objects.active = undefined;
      this.object_idgen = new EIDGen();
      this.dagnodes = [];
      this.toolmodes = [];
      this.toolmodes.map = {};
      this.toolmode_i = 0;
      this.selectmode = SelMask.VERTEX;
      for (let cls of ToolModes) {
          let mode=new cls();
          this.toolmodes.push(mode);
          this.toolmodes.map[cls.toolDefine().name] = mode;
      }
      this.active_splinepath = "frameset.drawspline";
      this.time = 1;
    }
     switchToolMode(tname) {
      let tool=this.toolmodes.map[tname];
      if (!tool) {
          throw new ToolModeSwitchError("unknown tool mode "+tname);
      }
      try {
        if (this.toolmode) {
            this.toolmode.onInactive();
        }
      }
      catch (error) {
          print_stack(error);
          throw new ToolModeSwitchError("error switchign tool mode");
      }
      this.toolmode_i = this.toolmodes.indexOf(tool);
      try {
        if (this.toolmode) {
            this.toolmode.onActive();
        }
      }
      catch (error) {
          print_stack(error);
          throw new ToolModeSwitchError("error switchign tool mode");
      }
      this.toolmode.ctx = g_app_state.ctx;
    }
    get  toolmode() {
      return this.toolmodes[this.toolmode_i];
    }
     setActiveObject(ob) {
      this.objects.active = ob;
      this.dag_update("on_active_set", true);
    }
     addFrameset(fs) {
      let ob=new SceneObject(fs);
      ob.name = this.objects.validateName(fs.name);
      ob.id = this.object_idgen.gen_id();
      fs.lib_adduser(this, this.name);
      this.objects.push(ob);
      return ob;
    }
     change_time(ctx, time, _update_animation=true) {
      if (_DEBUG.timeChange)
        console.warn("Time change!", time, this.time);
      if (isNaN(this.time)) {
          console.warn("EEK corruption!");
          this.time = ctx.frameset.time;
          if (isNaN(this.time))
            this.time = 1;
          if (isNaN(time))
            time = 1;
      }
      if (time===this.time)
        return ;
      if (isNaN(time))
        return ;
      if (time<1) {
          time = 1;
      }
      window._wait_for_draw = true;
      window.redraw_viewport();
      this.time = time;
      ctx.frameset.change_time(time, _update_animation);
      ctx.api.onFrameChange(ctx, time);
      this.dag_update("on_time_change", true);
    }
     copy() {
      var ret=new Scene();
      ret.time = this.time;
      return ret;
    }
     dag_exec() {

    }
     dag_get_datapath() {
      return "datalib.scene.items["+this.lib_id+"]";
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      let objs=new ObjectList(this);
      for (let i=0; i<this.objects.length; i++) {
          objs.add(this.objects[i]);
      }
      this.objects = objs;
      if (this.active_object>=0) {
          this.objects.active = this.objects.idmap[this.active_object];
      }
      delete this.active_object;
      this.afterSTRUCT();
      if (this.active_splinepath==="frameset.active_spline")
        this.active_splinepath = "frameset.drawspline";
      return this;
    }
     data_link(block, getblock, getblock_us) {
      super.data_link(block, getblock, getblock_us);
      for (let i=0; i<this.objects.length; i++) {
          this.objects[i].data_link(block, getblock, getblock_us);
      }
      this.toolmodes.map = {};
      for (let tool of this.toolmodes) {
          tool.dataLink(this, getblock, getblock_us);
          let def=tool.constructor.toolDefine();
          this.toolmodes.map[def.name] = tool;
      }
      for (let cls of ToolModes) {
          let def=cls.toolDefine();
          if (!(def.name in this.toolmodes)) {
              let tool=new cls();
              this.toolmodes.push(tool);
              this.toolmodes.map[def.name] = tool;
          }
      }
    }
     linkDag(ctx) {
      let on_sel=function (ctx, inputs, outputs, graph) {
        console.warn("on select called through eventdag!");
        ctx.frameset.sync_vdata_selstate(ctx);
      };
      the_global_dag.link(ctx.frameset.spline.verts, ["on_select_add"], on_sel, ["eid"]);
      the_global_dag.link(ctx.frameset.spline.verts, ["on_select_sub"], on_sel, ["eid"]);
      the_global_dag.link(ctx.frameset.spline.handles, ["on_select_add"], on_sel, ["eid"]);
      the_global_dag.link(ctx.frameset.spline.handles, ["on_select_sub"], on_sel, ["eid"]);
      this.dagnodes.push(on_sel);
    }
     on_tick(ctx) {
      if (this.dagnodes.length===0) {
          this.linkDag(ctx);
      }
    }
    static  nodedef() {
      return {name: "scene", 
     uiname: "scene", 
     outputs: {on_active_set: null, 
      on_time_change: null}, 
     inputs: {}}
    }
  }
  _ESClass.register(Scene);
  _es6_module.add_class(Scene);
  Scene = _es6_module.add_export('Scene', Scene);
  Scene.STRUCT = STRUCT.inherit(Scene, DataBlock)+`
    time              : float;
    active_splinepath : string;
    objects           : array(SceneObject);
    active_object     : int | obj.objects.active !== undefined ? obj.objects.active.id : -1;
    object_idgen      : EIDGen;
    toolmodes         : array(abstract(ToolMode));
    active_toolmode   : string | this.toolmode !== undefined ? this.toolmode.constructor.toolDefine().name : "";
    edit_all_layers   : int;
    selectmode        : int;
    fps               : float;
  }
`;
  mixin(Scene, DataPathNode);
}, '/dev/fairmotion/src/scene/scene.js');
es6_module_define('sceneobject', ["../core/lib_api.js", "../core/struct.js"], function _sceneobject_module(_es6_module) {
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var DataTypes=es6_import_item(_es6_module, '../core/lib_api.js', 'DataTypes');
  var DataBlock=es6_import_item(_es6_module, '../core/lib_api.js', 'DataBlock');
  let UpdateFlags={REDRAW: 1, 
   TRANSFORM: 1}
  UpdateFlags = _es6_module.add_export('UpdateFlags', UpdateFlags);
  let ObjectFlags={SELECT: 1, 
   HIDE: 2}
  ObjectFlags = _es6_module.add_export('ObjectFlags', ObjectFlags);
  class SceneObject extends DataBlock {
    
    
    
    
    
     constructor(data) {
      super(DataTypes.OBJECT);
      this.id = -1;
      this.data = data;
      this.matrix = new Matrix4();
      this.loc = new Vector2();
      this.scale = new Vector2();
      this.rot = 0.0;
      this.flag = 0;
      this.aabb = [new Vector2(), new Vector2()];
    }
     recalcAABB() {
      throw new Error("implement me!");
    }
     recalcMatrix() {
      this.matrix.makeIdentity();
      this.matrix.scale(this.scale[0], this.scale[1], 1.0);
      this.matrix.translate(this.loc[0], this.loc[1], 1.0);
      this.matrix.rotate(0.0, 0.0, this.rot);
      return this.matrix;
    }
     data_link(block, getblock, getblock_us) {
      this.data = getblock_us(this.data);
    }
     update(flag=UpdateFlags.REDRAW) {

    }
  }
  _ESClass.register(SceneObject);
  _es6_module.add_class(SceneObject);
  SceneObject = _es6_module.add_export('SceneObject', SceneObject);
  SceneObject.STRUCT = STRUCT.inherit(SceneObject, DataBlock)+`
  data     : dataref(DataBlock);
  matrix   : mat4;
  loc      : vec2;
  scale    : vec2;
  rot      : float;
  flag     : int;
  id       : int;
}
`;
}, '/dev/fairmotion/src/scene/sceneobject.js');
es6_module_define('velpan', ["../datafiles/icon_enum.js", "../path.ux/scripts/toolsys/simple_toolsys.js", "../util/vectormath.js", "../path.ux/scripts/toolsys/toolprop.js", "../path.ux/scripts/util/simple_events.js", "../path.ux/scripts/util/util.js"], function _velpan_module(_es6_module) {
  var Matrix4=es6_import_item(_es6_module, '../util/vectormath.js', 'Matrix4');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var ToolOp=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/simple_toolsys.js', 'ToolOp');
  var UndoFlags=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/simple_toolsys.js', 'UndoFlags');
  var keymap=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'keymap');
  var StringProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'StringProperty');
  var Vec2Property=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'Vec2Property');
  es6_import(_es6_module, '../datafiles/icon_enum.js');
  var util=es6_import(_es6_module, '../path.ux/scripts/util/util.js');
  let VelPanFlags={UNIFORM_SCALE: 1}
  VelPanFlags = _es6_module.add_export('VelPanFlags', VelPanFlags);
  class VelPan  {
    
    
    
    
    
    
    
    
    
    
    
    
    
     constructor() {
      this.bounds = [new Vector2([-2000, -2000]), new Vector2([2000, 2000])];
      this.decay = 0.995;
      this.pos = new Vector2();
      this.scale = new Vector2([1, 1]);
      this.vel = new Vector2();
      this.oldpos = new Vector2();
      this.axes = 3;
      this.flag = VelPanFlags.UNIFORM_SCALE;
      this.mat = new Matrix4();
      this.imat = new Matrix4();
      this._last_mat = new Matrix4(this.mat);
      this.onchange = null;
      this.last_update_time = util.time_ms();
      this.timer = undefined;
    }
     copy() {
      return new VelPan().load(this);
    }
    get  min() {
      return this.bounds[0];
    }
    get  max() {
      return this.bounds[1];
    }
     load(velpan) {
      this.pos.load(velpan.pos);
      this.scale.load(velpan.scale);
      this.axes = velpan.axes;
      this.bounds[0].load(velpan.bounds[0]);
      this.bounds[1].load(velpan.bounds[1]);
      this.update(false);
      return this;
    }
     startVelocity() {
      if (this.timer===undefined) {
          this.last_update_time = util.time_ms();
          this.timer = window.setInterval(this.doVelocity.bind(this), 30);
      }
    }
     doVelocity() {
      if (this.vel.dot(this.vel)<0.001) {
          console.log("removing velpan timer");
          window.clearInterval(this.timer);
          this.timer = undefined;
          return ;
      }
      let dt=util.time_ms()-this.last_update_time;
      this.pos.addFac(this.vel, dt);
      dt = Math.max(dt, 0.001);
      this.vel.mulScalar(Math.pow(this.decay, dt));
      this.last_update_time = util.time_ms();
    }
     update(fire_events=true, do_velocity=true) {
      if (do_velocity&&this.vel.dot(this.vel)>0.001) {
          this.startVelocity();
      }
      this.mat.makeIdentity();
      this.mat.scale(this.scale[0], this.scale[1], 1.0);
      this.mat.translate(this.pos[0], this.pos[1], 0.0);
      this.imat.load(this.mat).invert();
      if (fire_events&&JSON.stringify(this.mat)!=JSON.stringify(this._last_mat)) {
          this._last_mat.load(this.mat);
          if (this.onchange)
            this.onchange(this);
      }
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(VelPan);
  _es6_module.add_class(VelPan);
  VelPan = _es6_module.add_export('VelPan', VelPan);
  VelPan.STRUCT = `
VelPan {
  bounds : array(vec2); 
  pos    : vec2;
  scale  : vec2;
  axes   : int;
  mat    : mat4;
  imat   : mat4;
  flag   : int;
}
`;
  nstructjs.manager.add_class(VelPan);
  class VelPanPanOp extends ToolOp {
     constructor() {
      super();
      this.start_pan = new Vector2();
      this.first = true;
      this.last_mpos = new Vector2();
      this.start_mpos = new Vector2();
      this.start_time = this.last_time = 0;
      this._temps = util.cachering.fromConstructor(Vector2, 16);
    }
    static  tooldef() {
      return {uiname: "Pan (2d)", 
     description: "Pan 2d window", 
     toolpath: "velpan.pan", 
     undoflag: UndoFlags.NO_UNDO, 
     is_modal: true, 
     icon: -1, 
     inputs: {velpanPath: new StringProperty(), 
      pan: new Vec2Property()}}
    }
     on_mousemove(e) {
      let ctx=this.modal_ctx;
      let path=this.inputs.velpanPath.getValue();
      let velpan=ctx.api.getValue(ctx, path);
      if (velpan===undefined) {
          this.modalEnd();
          throw new Error("bad velpan path "+path+".");
      }
      let mpos=this._temps.next().zero();
      mpos[0] = e.x;
      mpos[1] = e.y;
      if (this.first) {
          this.start_mpos.load(mpos);
          this.last_mpos.load(mpos);
          this.start_pan.load(velpan.pos);
          this.start_time = util.time_ms();
          this.last_time = util.time_ms();
          this.first = false;
          return ;
      }
      let dx=mpos[0]-this.last_mpos[0];
      let dy=mpos[1]-this.last_mpos[1];
      dx/=velpan.scale[0];
      dy/=velpan.scale[1];
      let pan=this.inputs.pan.getValue();
      pan[0]+=dx;
      pan[1]+=dy;
      velpan.pos.load(this.start_pan);
      this.exec(this.modal_ctx);
      this.last_mpos.load(mpos);
    }
     exec(ctx) {
      let path=this.inputs.velpanPath.getValue();
      let velpan=ctx.api.getValue(ctx, path);
      if (velpan===undefined) {
          throw new Error("bad velpan path "+path+".");
      }
      velpan.pos.add(this.inputs.pan.getValue());
      velpan.update(undefined, false);
      let vel=new Vector2(velpan.pos).sub(velpan.oldpos);
      vel.mulScalar(1.0/(util.time_ms()-this.last_time));
      let l=vel.vectorLength();
      l = Math.min(l, 3.0);
      vel.normalize().mulScalar(l);
      velpan.vel.load(vel);
      velpan.oldpos.load(velpan.pos);
      this.last_time = util.time_ms();
      if (velpan.onchange) {
          velpan.onchange();
      }
    }
     on_mouseup(e) {
      this.modalEnd();
    }
  }
  _ESClass.register(VelPanPanOp);
  _es6_module.add_class(VelPanPanOp);
  VelPanPanOp = _es6_module.add_export('VelPanPanOp', VelPanPanOp);
  ToolOp.register(VelPanPanOp);
}, '/dev/fairmotion/src/editors/velpan.js');
es6_module_define('nodegraph', ["../../core/lib_api.js", "../../path.ux/scripts/pathux.js", "../velpan.js", "../editor_base.js"], function _nodegraph_module(_es6_module) {
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  var nstructjs=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'nstructjs');
  var util=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'util');
  var VelPan=es6_import_item(_es6_module, '../velpan.js', 'VelPan');
  var VelPanPanOp=es6_import_item(_es6_module, '../velpan.js', 'VelPanPanOp');
  var Vector2=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Vector2');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'UIBase');
  var color2css=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'color2css');
  var css2color=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'css2color');
  var DataBlock=es6_import_item(_es6_module, '../../core/lib_api.js', 'DataBlock');
  class NodeViewer extends Editor {
    
    
    
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.graphPath = "";
      this.graphClass = "";
      this._last_graph_path = undefined;
      this.velpan = new VelPan();
      this.velpan.pos[0] = 0;
      this.velpan.pos[1] = 0;
      this.velpan.onchange = this._on_velpan_change.bind(this);
      this._last_scale = new Vector2();
      this.canvases = {};
      this.nodes = {};
      this.node_idmap = {};
      this.sockSize = 20;
      this.extraNodeWidth = 155;
      this.canvas = document.createElement("canvas");
      this.g = this.canvas.getContext("2d");
      this.shadow.appendChild(this.canvas);
    }
     init() {
      super.init();
      this.velpan.onchange = this._on_velpan_change.bind(this);
      this.addEventListener("mousedown", (e) =>        {
        this.push_ctx_active();
        console.log("node viewer mousedown");
        let toolop=new VelPanPanOp();
        toolop.inputs.velpanPath.setValue("nodeViewer.velpan");
        this.ctx.toolstack.execTool(this.ctx, toolop);
        this.pop_ctx_active();
      });
      this.header.button("Arrange", () =>        {
        let graph=this.getGraph();
        console.log("Arranging graph", graph);
        if (graph) {
            sortGraphSpatially(graph, {socksize: this.sockSize, 
        steps: 45, 
        headerHeight: 75, 
        extraWidth: this.extraNodeWidth});
            this.clear();
            this.rebuild();
            this.draw();
        }
      });
      this.addEventListener("wheel", (e) =>        {
        let df=Math.sign(e.deltaY)*0.15;
        console.log("wheel in node viewer!");
        this.velpan.scale.mulScalar(1.0-df);
        this.velpan.update();
        this.rebuild();
      });
    }
     getGraph() {
      return this.ctx.api.getValue(this.ctx, this.graphPath);
    }
     getCanvas(id) {
      if (!(id in this.canvases)) {
          this.canvases[id] = document.createElement("canvas");
          this.canvases[id].g = this.canvases[id].getContext("2d");
      }
      return this.canvases[id];
    }
     hashNode(node) {
      let layout=layoutNode(node, {socksize: this.sockSize});
      let mask=(1<<19)-1;
      let mul=(1<<14)-1;
      let hash=node.graph_id;
      function dohash(n) {
        let f=((n+mask)*mul)&mask;
        hash = hash^f;
      }
      let scale=this.velpan.scale;
      dohash(layout.size[0]*scale[0]);
      dohash(layout.size[1]*scale[1]);
      for (let i=0; i<2; i++) {
          let socks=i ? layout.outputs : layout.inputs;
          let j=0;
          for (let k in socks) {
              let sock=socks[k];
              dohash(sock[0]*scale[0]);
              dohash(sock[1]*scale[1]);
              dohash(j++);
          }
      }
      return hash+":"+node.graph_id;
    }
     _on_velpan_change() {
      if (this._last_scale.vectorDistance(this.velpan.scale)>0.1) {
          this.rebuild();
      }
      else {
        this.draw();
      }
      this._last_scale.load(this.velpan.scale);
    }
     clear() {
      this.canvases = {};
      this.nodes = {};
      this.node_idmap = {};
    }
     buildNode(node) {
      let scale=this.velpan.scale;
      let layout=layoutNode(node, {socksize: this.sockSize, 
     extraWidth: this.extraNodeWidth});
      let hash=this.hashNode(node);
      layout.size = new Vector2(layout.size);
      layout.size.mulScalar(scale[0]);
      layout.size.floor();
      for (let i=0; i<2; i++) {
          let lsocks=i ? layout.outputs : layout.inputs;
          let socks=i ? node.outputs : node.inputs;
          for (let k in lsocks) {
              let sock=socks[k];
              let lsock=lsocks[k];
              lsock = new Vector2(lsock);
              let color=sock.constructor.nodedef().color;
              if (color) {
                  color = color2css(color);
              }
              else {
                color = "orange";
              }
              lsock.color = color;
              lsocks[k] = lsock;
          }
      }
      layout.canvas = this.getCanvas(hash);
      let canvas=layout.canvas;
      let g=canvas.g;
      let ts=this.getDefault("DefaultText").size*1.45;
      let header=layout.header = ts*this.velpan.scale[0]*1.3*2.5;
      layout.size[1]+=Math.ceil(header);
      canvas.width = layout.size[0];
      canvas.height = layout.size[1];
      g.font = this.getDefault("DefaultText").genCSS(ts*this.velpan.scale[0]);
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.beginPath();
      g.rect(0, 0, canvas.width, canvas.height);
      g.lineWidth = 2;
      g.fillStyle = "grey";
      g.strokeStyle = "black";
      g.fill();
      g.stroke();
      g.fillStyle = "white";
      let name=node.graphDisplayName();
      g.fillText(name, 1, ts*this.velpan.scale[0]*1.3);
      g.fillText("("+node.constructor.name+")", 45*this.velpan.scale[0], ts*this.velpan.scale[0]*1.3*1.7);
      layout.graph_id = node.graph_id;
      this.nodes[hash] = layout;
      this.node_idmap[node.graph_id] = layout;
      for (let i=0; i<2; i++) {
          let y=0.0;
          let socks=i ? layout.outputs : layout.inputs;
          for (let k in socks) {
              let sock=socks[k];
              sock[1]+=header/this.velpan.scale[0];
              let w=g.measureText(k).width;
              let x=i ? layout.size[0]-w : 0;
              let y=sock[1]*this.velpan.scale[0];
              g.fillText(k, x, y);
          }
      }
      return layout;
    }
     updateCanvaSize() {
      let canvas=this.canvas;
      let size=this.size;
      let dpi=UIBase.getDPI();
      let w=~~(size[0]*dpi);
      let h=~~(size[1]*dpi);
      canvas.width = w;
      canvas.height = h;
      canvas.style["width"] = size[0]+"px";
      canvas.style["height"] = size[1]+"px";
    }
     draw() {
      let canvas=this.canvas;
      let g=this.g;
      this.updateCanvaSize();
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.font = this.getDefault("DefaultText").genCSS();
      g.strokeStyle = "black";
      let transform=(p) =>        {
        p[0]-=canvas.width*0.5;
        p[1]-=canvas.height*0.5;
        p.multVecMatrix(this.velpan.mat);
        p[0]+=canvas.width*0.5;
        p[1]+=canvas.height*0.5;
      };
      let p=new Vector2(), p2=new Vector2(), p3=new Vector2(), p4=new Vector2();
      let s=new Vector2();
      function find_sock_key(node, sock) {
        for (let k in node.inputs) {
            if (node.inputs[k]===sock) {
                return k;
            }
        }
      }
      g.beginPath();
      let sz=this.sockSize;
      let graph=this.getGraph();
      let rebuild=false;
      for (let k1 in this.nodes) {
          let node=this.nodes[k1];
          p.load(node.pos);
          let node2=graph.node_idmap[node.graph_id];
          if (node2===undefined) {
              rebuild = true;
              continue;
          }
          for (let k in node2.inputs) {
              let sock=node2.inputs[k];
              for (let sock2 of sock.edges) {
                  let node3=this.node_idmap[sock2.node.graph_id];
                  sock2 = find_sock_key(sock2);
                  node3 = this.node_idmap[node3.graph_id];
                  let lsock1=node.inputs[k];
                  let lsock2=node3.outputs[k];
                  p2.load(node.pos).add(lsock1);
                  p3.load(node3.pos).add(lsock2);
                  transform(p2);
                  transform(p3);
                  g.moveTo(p2[0], p2[1]);
                  g.lineTo(p3[0], p3[1]);
              }
          }
      }
      if (rebuild) {
          this.rebuild();
          this.doOnce(this.draw);
          return ;
      }
      g.strokeStyle = "white";
      g.stroke();
      for (let k2 in this.nodes) {
          let node=this.nodes[k2];
          p.load(node.pos);
          for (let i=0; i<2; i++) {
              let socks=i ? node.outputs : node.inputs;
              for (let k in socks) {
                  let sock=socks[k];
                  p2.load(sock);
                  p2.add(p);
                  transform(p2);
                  g.beginPath();
                  g.fillStyle = sock.color;
                  g.moveTo(p2[0], p2[1]);
                  g.arc(p2[0], p2[1], sz*0.35, -Math.PI, Math.PI);
                  g.fill();
              }
          }
      }
      g.fill();
      g.fillStyle = "grey";
      g.beginPath();
      for (let k in this.nodes) {
          let node=this.nodes[k];
          p.load(node.pos);
          s.load(node.size);
          transform(p);
          g.drawImage(node.canvas, p[0], p[1]);
      }
      g.fill();
      g.stroke();
    }
     rebuild() {
      if (!this.ctx) {
          return ;
      }
      this._last_graph_path = this.graphPath;
      console.log("rebuilding node editor");
      this.updateCanvaSize();
      let canvas=this.canvas;
      let g=this.g;
      let size=this.size;
      let dpi=UIBase.getDPI();
      let graph=this.ctx.api.getValue(this.ctx, this.graphPath);
      if (this.graphPath===""||graph===undefined) {
          console.warn("Failed to load graph!");
          this._last_graph_path = undefined;
          return ;
      }
      let visit=new util.set();
      for (let node of graph.nodes) {
          let hash=this.hashNode(node);
          visit.add(hash);
          if (!(hash in this.nodes)) {
              this.buildNode(node);
          }
      }
      let del=[];
      for (let k in this.canvases) {
          if (!visit.has(k)) {
              del.push(k);
          }
      }
      for (let k of del) {
          delete this.canvases[k];
          delete this.nodes[k];
      }
      this.draw();
    }
     on_resize() {
      this.draw();
    }
     update() {
      if (this._last_graph_path!==this.graphPath) {
          this.clear();
          this.rebuild();
      }
      this.velpan.update();
    }
    static  define() {
      return {tagname: "nodegraph-viewer-x", 
     areaname: "nodegraph_viewer", 
     uiname: "Graph Viewer"}
    }
  }
  _ESClass.register(NodeViewer);
  _es6_module.add_class(NodeViewer);
  NodeViewer = _es6_module.add_export('NodeViewer', NodeViewer);
  NodeViewer.STRUCT = nstructjs.inherit(NodeViewer, Editor)+`
  graphPath  : string;
  graphClass : string;
  velpan     : VelPan;
}`;
  Editor.register(NodeViewer);
  nstructjs.register(NodeViewer);
}, '/dev/fairmotion/src/editors/nodegraph/nodegraph.js');
es6_module_define('nodegraph_base', [], function _nodegraph_base_module(_es6_module) {
}, '/dev/fairmotion/src/editors/nodegraph/nodegraph_base.js');
es6_module_define('nodegraph_ops', [], function _nodegraph_ops_module(_es6_module) {
}, '/dev/fairmotion/src/editors/nodegraph/nodegraph_ops.js');
es6_module_define('widgets', ["../path.ux/scripts/util/util.js", "../path.ux/scripts/util/struct.js", "../path.ux/scripts/core/ui.js", "../image/image_ops.js", "../path.ux/scripts/core/ui_base.js"], function _widgets_module(_es6_module) {
  var UIBase=es6_import_item(_es6_module, '../path.ux/scripts/core/ui_base.js', 'UIBase');
  var Icons=es6_import_item(_es6_module, '../path.ux/scripts/core/ui_base.js', 'Icons');
  var PackFlags=es6_import_item(_es6_module, '../path.ux/scripts/core/ui_base.js', 'PackFlags');
  var nstructjs=es6_import(_es6_module, '../path.ux/scripts/util/struct.js');
  var util=es6_import(_es6_module, '../path.ux/scripts/util/util.js');
  var Container=es6_import_item(_es6_module, '../path.ux/scripts/core/ui.js', 'Container');
  var LoadImageOp=es6_import_item(_es6_module, '../image/image_ops.js', 'LoadImageOp');
  class IDBrowser extends Container {
     constructor() {
      super();
      this.idlist = {};
    }
     init() {
      super.init();
      let name=undefined;
      try {
        let block=this.getPathValue(this.ctx, this.getAttribute("datapath"));
        if (block) {
            name = block.name;
        }
      }
      catch (error) {
          util.print_stack(error);
      }
      this.buildEnum();
      this.listbox = this.listenum(undefined, {enumDef: this.idlist, 
     callback: this._on_select.bind(this), 
     defaultval: name});
    }
     _on_select(lib_id) {
      let block=this.ctx.datalib.idmap[lib_id];
      if (block) {
          console.log("block:", block);
          let path=this.getAttribute("datapath");
          this.setPathValue(this.ctx, path, block);
      }
      else {
        console.warn("unknown block with id '"+lib_id+"'");
      }
    }
     buildEnum() {
      let path=this.getAttribute("datapath");
      let rdef=path ? this.ctx.api.resolvePath(this.ctx, path) : undefined;
      if (!path||!rdef||!rdef.prop) {
          console.error("Datapath error");
          return ;
      }
      let prop=rdef.prop;
      let datalib=this.ctx.datalib;
      let lst=[];
      for (let block of datalib.allBlocks) {
          if (prop.types.has(block.lib_type)) {
              lst.push(block);
          }
      }
      lst.sort((a, b) =>        {
        return (a.name.toLowerCase()<b.name.toLowerCase())*2-1;
      });
      let def={};
      this.idlist = def;
      for (let block of lst) {
          def[block.name] = block.lib_id;
      }
      return def;
    }
     updateDataPath() {
      let path=this.getAttribute("datapath");
      if (!path)
        return ;
      let value=this.getPathValue(this.ctx, path);
      let name="";
      if (value===undefined) {
          name = "";
      }
      else {
        name = value.name;
      }
      if (name!==this.listbox.value) {
          this.listbox.setAttribute("name", name);
      }
    }
     update() {
      super.update();
      this.updateDataPath();
    }
     setCSS() {
      super.setCSS();
    }
    static  define() {
      return {tagname: "id-browser-x"}
    }
  }
  _ESClass.register(IDBrowser);
  _es6_module.add_class(IDBrowser);
  IDBrowser = _es6_module.add_export('IDBrowser', IDBrowser);
  UIBase.register(IDBrowser);
  class ImageUserPanel extends Container {
     constructor() {
      super();
    }
     init() {
      super.init();
      let path=this.getAttribute("datapath");
      let row=this.row();
      let idbrowser=document.createElement("id-browser-x");
      idbrowser.setAttribute("datapath", path+".image");
      row.add(idbrowser);
      row.button("Open", () =>        {
        let toolop=new LoadImageOp(this.getAttribute("datapath")+".image");
        this.ctx.api.execTool(this.ctx, toolop);
      });
      this.prop(path+".off", PackFlags.NO_NUMSLIDER_TEXTBOX);
      this.prop(path+".scale", PackFlags.NO_NUMSLIDER_TEXTBOX);
      this.setCSS();
    }
     update() {
      super.update();
    }
     setCSS() {
      super.setCSS();
      let w=150;
      this.style["width"] = w+"px";
    }
    static  define() {
      return {tagname: "image-user-panel-x"}
    }
  }
  _ESClass.register(ImageUserPanel);
  _es6_module.add_class(ImageUserPanel);
  ImageUserPanel = _es6_module.add_export('ImageUserPanel', ImageUserPanel);
  UIBase.register(ImageUserPanel);
}, '/dev/fairmotion/src/editors/widgets.js');
es6_module_define('all', ["./viewport/view2d.js", "./settings/SettingsEditor.js", "./curve/CurveEditor.js", "./ops/ops_editor.js", "./dopesheet/DopeSheetEditor.js", "./material/MaterialEditor.js", "./console/console.js", "./menubar/MenuBar.js"], function _all_module(_es6_module) {
  es6_import(_es6_module, './viewport/view2d.js');
  es6_import(_es6_module, './dopesheet/DopeSheetEditor.js');
  es6_import(_es6_module, './ops/ops_editor.js');
  es6_import(_es6_module, './console/console.js');
  es6_import(_es6_module, './material/MaterialEditor.js');
  es6_import(_es6_module, './curve/CurveEditor.js');
  es6_import(_es6_module, './menubar/MenuBar.js');
  es6_import(_es6_module, './settings/SettingsEditor.js');
}, '/dev/fairmotion/src/editors/all.js');
es6_module_define('console', ["../../path.ux/scripts/util/html5_fileapi.js", "../editor_base.js", "../../path.ux/scripts/pathux.js", "../../path.ux/scripts/util/util.js"], function _console_module(_es6_module) {
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  var color2css=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'color2css');
  var css2color=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'css2color');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'UIBase');
  var keymap=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'keymap');
  var util=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'util');
  var cconst=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'cconst');
  var nstructjs=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'nstructjs');
  var Vector2=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Vector3');
  var Matrix4=es6_import_item(_es6_module, '../../path.ux/scripts/pathux.js', 'Matrix4');
  var termColorMap=es6_import_item(_es6_module, '../../path.ux/scripts/util/util.js', 'termColorMap');
  var loadFile=es6_import_item(_es6_module, '../../path.ux/scripts/util/html5_fileapi.js', 'loadFile');
  let g_screen=undefined;
  let _silence=() =>    {  }
  let _unsilence=() =>    {  }
  let _patched=false;
  function patch_console() {
    if (_patched) {
        return ;
    }
    _patched = true;
    let methods={}
    let ignore=0;
    _silence = () =>      {
      return ignore = 1;
    }
    _unsilence = () =>      {
      return ignore = 0;
    }
    let handlers={}
    function patch(key) {
      handlers[key] = function () {
        setTimeout(() =>          {
          if (ignore||!g_screen) {
              return ;
          }
          for (let sarea of g_screen.sareas) {
              if (__instance_of(sarea.area, ConsoleEditor)) {
                  sarea.area[key](...arguments);
              }
          }
        }, 0);
      }
      methods[key] = console[key].bind(console);
      console[key] = function () {
        methods[key](...arguments);
        handlers[key](...arguments);
      }
    }
    patch("log");
    patch("warn");
    patch("error");
    patch("trace");
  }
  const NO_CHILDREN=0x7ffff;
  const LineFlags={ACTIVE: 1, 
   TWO_LINE: 2}
  class ConsoleLineEntry  {
    
    
    
    
    
    
    
     constructor(line, loc="", fg="", bg="") {
      this.line = ""+line;
      this.loc = ""+loc;
      this.bg = ""+bg;
      this.fg = ""+fg;
      this.closed = false;
      this.parent = 0;
      this.children = NO_CHILDREN;
      this.flag = 0;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(ConsoleLineEntry);
  _es6_module.add_class(ConsoleLineEntry);
  ConsoleLineEntry = _es6_module.add_export('ConsoleLineEntry', ConsoleLineEntry);
  ConsoleLineEntry.STRUCT = `
ConsoleLineEntry {
    line     : string;
    loc      : string;
    bg       : string;
    fg       : string; 
    closed   : bool;
    parent   : int;
    children : int;
    flag     : int | this.flag & ~1;
}
`;
  nstructjs.register(ConsoleLineEntry);
  class ConsoleCommand  {
     constructor(cmd) {
      this.command = cmd;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(ConsoleCommand);
  _es6_module.add_class(ConsoleCommand);
  ConsoleCommand = _es6_module.add_export('ConsoleCommand', ConsoleCommand);
  ConsoleCommand.STRUCT = `
ConsoleCommand {
    command : string;
}
`;
  nstructjs.register(ConsoleCommand);
  const HitBoxTypes={TOGGLE_CHILDREN: 0, 
   CUSTOM: 1}
  _es6_module.add_export('HitBoxTypes', HitBoxTypes);
  class HitBox  {
    
    
     constructor(x, y, w, h) {
      this.pos = new Vector2([x, y]);
      this.size = new Vector2([w, h]);
      this.type = HitBoxTypes.TOGGLE_CHILDREN;
      this.onhit = null;
      this.lines = [];
    }
     toggle(e, editor) {
      _silence();
      for (let l of this.lines) {
          let i=editor.lines.indexOf(l);
          let starti=i;
          if (l.children===NO_CHILDREN) {
              continue;
          }
          i+=l.children;
          let j=0;
          while (j++<editor.lines.length) {
            let l2=editor.lines[i];
            if (editor.lines[i+l2.parent]!==l) {
                break;
            }
            l2.closed^=1;
            i++;
          }
      }
      editor.queueRedraw();
      _unsilence();
    }
     click(e, editor) {
      if (this.type===HitBoxTypes.TOGGLE_CHILDREN) {
          this.toggle(e, editor);
          console.log("click!");
      }
    }
  }
  _ESClass.register(HitBox);
  _es6_module.add_class(HitBox);
  HitBox = _es6_module.add_export('HitBox', HitBox);
  class ConsoleEditor extends Editor {
    
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this._animreq = 0;
      this.redraw = this.redraw.bind(this);
      this.hitboxes = [];
      this.fontsize = 12;
      this.lines = [];
      this.lines.active = undefined;
      this.history = [];
      this.history.cur = 0;
      this.head = 0;
      this.bufferSize = 512;
      this.scroll = new Vector2();
      this.colors = {error: "red", 
     error_bg: "rgb(55,55,55,1.0)", 
     warning: "yellow", 
     object: "blue", 
     loc: "blue", 
     source: "white", 
     warning_bg: "rgb(50, 50, 0)"};
      this.colormap = {"red": "rgb(255, 100, 100)", 
     "blue": "rgb(125, 125, 255)"};
    }
     on_area_active() {
      patch_console();
    }
     formatMessage() {
      let s="";
      let prev="";
      function safestr(obj) {
        if (typeof obj==="object"&&Array.isArray(obj)) {
            let s="[\n";
            let i=0;
            for (let item of obj) {
                if (i>0) {
                    s+=",\n";
                }
                s+="  "+safestr(item);
                i++;
            }
            s+="]\n";
            return s;
        }
        return typeof obj==="symbol" ? obj.toString() : ""+obj;
      }
      for (let i=0; i<arguments.length; i++) {
          let arg=safestr(arguments[i]);
          let s2=""+arg;
          let next=i<arguments.length-1 ? (safestr(arguments[i+1])).trim() : "";
          if (s2.startsWith("%c")) {
              s2 = s2.slice(2, s2.length);
              let style=next.replace(/\n/g, "").split(";");
              for (let line of style) {
                  line = (""+line).trim().split(":");
                  if (line.length===2&&(""+line[0]).trim()==="color") {
                      let color=(""+line[1]).trim().toLowerCase();
                      if (color in util.termColorMap) {
                          s2 = termColor(s2, color);
                      }
                  }
              }
              i++;
          }
          s+=s2+" ";
          prev = s2;
      }
      return (""+s).trim();
    }
     formatStackLine(stack, parts=false) {
      if (stack.search("at")<0) {
          return "";
      }
      stack = ""+stack;
      stack = stack.replace("at ", "").trim();
      let i=stack.length-1;
      while (i>0&&stack[i]!=="/"&&stack[i]!=="\\") {
        i--;
      }
      let i2=stack.search("\\(");
      let prefix=i2>=0 ? (""+stack.slice(0, i2)).trim() : "";
      if (prefix.length>0) {
          prefix+=":";
      }
      stack = stack.slice(i+1, stack.length-1);
      if (parts) {
          return [prefix, stack];
      }
      return util.termColor(prefix, this.colors["object"])+util.termColor(stack, this.colors["source"]);
    }
     push(msg, linefg="", linebg="", childafter=false) {
      let stack=""+new Error().stack;
      stack = (""+stack.split("\n")[5]).trim();
      stack = this.formatStackLine(stack);
      let ls=msg.split("\n");
      for (let i=0; i<ls.length; i++) {
          let l=ls[i];
          let loc="";
          if (i===ls.length-1) {
              loc = stack;
          }
          l = new ConsoleLineEntry(l, loc, linefg, linebg);
          if (childafter) {
              l.children = ls.length-i;
          }
          this.pushLine(l);
      }
    }
     pushLine(line) {
      if (line===undefined) {
          line = "";
      }
      if (typeof line==="string") {
          line = new ConsoleLineEntry(line, "");
      }
      if (this.lines.length>=this.bufferSize) {
          this.lines[this.head] = line;
          this.head = (this.head+1)%this.lines.length;
      }
      else {
        this.lines.push(line);
        this.head = this.lines.length;
      }
      _silence();
      this.queueRedraw();
      _unsilence();
      if (Math.abs(this.scroll[1])>10) {
      }
    }
    get  lineHeight() {
      return this.fontsize*1.3*UIBase.getDPI();
    }
     printStack(start=0, fg="", bg="", closed=true) {
      let stack=(""+new Error().stack).split("\n");
      let off=-1;
      for (let i=start; i<stack.length; i++) {
          let s=stack[i];
          let l=this.formatStackLine(s, true);
          l[0] = "  "+(""+l[0]).trim();
          l = new ConsoleLineEntry(l[0], l[1], fg, bg);
          l.closed = closed;
          l.parent = off--;
          this.pushLine(l);
      }
    }
     warn() {
      let msg=this.formatMessage(...arguments);
      msg = util.termColor(msg, 1);
      this.push(msg, this.colors["warning"], this.colors["warning_bg"], true);
      this.printStack(5, undefined, this.colors["warning_bg"], true);
    }
     error() {
      let msg=this.formatMessage(...arguments);
      msg = util.termColor(msg, 1);
      this.push(msg, this.colors["error"], this.colors["error_bg"], true);
      this.printStack(5, undefined, this.colors["error_bg"], true);
    }
     trace() {
      let msg=this.formatMessage(...arguments);
      this.push(msg);
      this.printStack(5, undefined, undefined, false);
    }
     log() {
      let msg=this.formatMessage(...arguments);
      this.push(msg);
    }
     _mouse(e) {
      let x=e.x, y=e.y;
      let rect=this.canvas.getClientRects()[0];
      let dpi=UIBase.getDPI();
      if (rect) {
          x-=rect.x;
          y-=rect.y;
          x*=dpi;
          y*=dpi;
      }
      let e2={preventDefault: e.preventDefault.bind(e), 
     stopPropagation: e.stopPropagation.bind(e), 
     buttons: e.buttons, 
     button: e.button, 
     shiftKey: e.shiftKey, 
     ctrlKey: e.ctrlKey, 
     altKey: e.altKey, 
     commandKey: e.commandKey, 
     x: x, 
     y: y, 
     pageX: x, 
     pageY: y, 
     touches: e.touches};
      return e2;
    }
     on_mousedown(e) {
      e = this._mouse(e);
      let hb=this.updateActive(e.x, e.y);
      if (hb) {
          hb.click(e, this);
      }
      _silence();
      console.log(e.x, e.y);
      _unsilence();
    }
     on_mousemove(e) {
      _silence();
      e = this._mouse(e);
      this.updateActive(e.x, e.y);
      _unsilence();
    }
     updateActive(x, y) {
      let found=0;
      for (let hb of this.hitboxes) {
          let ok=1;
          ok = ok&&(x>hb.pos[0]&&x<=hb.pos[0]+hb.size[0]);
          ok = ok&&(y>hb.pos[1]&&y<=hb.pos[1]+hb.size[1]);
          if (ok) {
              found = 1;
              if (this.lines.active!==undefined) {
                  this.lines.active.flag&=~LineFlags.ACTIVE;
              }
              if (hb.lines.length>0) {
                  if (this.lines.active!==hb.lines[0]) {
                      hb.lines[0].flag|=LineFlags.ACTIVE;
                      this.lines.active = hb.lines[0];
                      this.queueRedraw();
                  }
                  return hb;
              }
          }
      }
      if (!found&&this.lines.active) {
          this.lines.active.flag&=~LineFlags.ACTIVE;
          this.queueRedraw();
      }
    }
     on_mouseup(e) {
      e = this._mouse(e);
      _silence();
      console.log(e.x, e.y);
      _unsilence();
    }
     init() {
      super.init();
      this.addEventListener("mousewheel", (e) =>        {
        this.scroll[1]+=-e.deltaY;
        this.queueRedraw();
      });
      let header=this.header;
      let container=this.container;
      let col=container.col();
      let canvas=this.canvas = document.createElement("canvas");
      let g=this.g = canvas.getContext("2d");
      canvas.addEventListener("mousemove", this.on_mousemove.bind(this));
      canvas.addEventListener("mousedown", this.on_mousedown.bind(this));
      canvas.addEventListener("mouseup", this.on_mouseup.bind(this));
      col.shadow.appendChild(canvas);
      let textbox=this.textbox = document.createElement("input");
      textbox.type = "text";
      col.shadow.appendChild(textbox);
      textbox.style["width"] = "100%";
      textbox.style["height"] = "25px";
      textbox.style["padding-left"] = "5px";
      textbox.style["padding-top"] = "1px";
      textbox.style["padding-bottom"] = "1px";
      textbox.oninput = this._on_change.bind(this);
      textbox.onkeydown = this._on_keydown.bind(this);
      this.setCSS();
      this.update();
      this.queueRedraw();
    }
     _on_change(e) {
      _silence();
      console.log("yay", e);
      _unsilence();
    }
     pushHistory(cmd) {
      let lasti=this.history.cur-1;
      let last=this.history.length>0&&this.history.cur>0 ? this.history[lasti].command : undefined;
      if (cmd===last) {
          return ;
      }
      _silence();
      console.log("history insert");
      _unsilence();
      let command=new ConsoleCommand(cmd);
      this.history.push(command);
      this.history.cur = this.history.length;
    }
     doCommand(cmd) {
      this.scroll[1] = 0.0;
      this.pushHistory(cmd);
      let v=undefined;
      try {
        v = eval(cmd);
      }
      catch (error) {
          console.error(error);
          return ;
      }
      console.log(v);
    }
     doTab(cmd="") {
      let i=cmd.length-1;
      while (i>=0) {
        if (cmd[i]==="."||cmd[i]==="]"||cmd[i]===")") {
            break;
        }
        i--;
      }
      let prefix;
      let suffix;
      let join="";
      if (i<=0) {
          prefix = "";
          suffix = (""+cmd).trim();
      }
      else {
        prefix = cmd.slice(0, i).trim();
        suffix = cmd.slice(i+1, cmd.length).trim();
        join = cmd[i];
      }
      _silence();
      console.log("p:", prefix);
      console.log("s:", suffix);
      _unsilence();
      let obj;
      try {
        obj = prefix==="" ? window : eval(prefix);
      }
      catch (error) {
          obj = undefined;
      }
      _silence();
      console.log(obj);
      _unsilence();
      if (typeof obj!=="object"&&typeof obj!=="function") {
          return ;
      }
      let keys=Reflect.ownKeys(obj);
      keys = keys.concat(Object.keys(Object.getOwnPropertyDescriptors(obj)));
      keys = keys.concat(Object.keys(Object.getOwnPropertyDescriptors(obj.__proto__)));
      keys = new Set(keys);
      let keys2=[];
      for (let k of keys) {
          keys2.push(k);
      }
      keys = keys2;
      let list=[];
      let lsuffix=suffix.toLowerCase();
      let hit=suffix;
      let hit2=undefined;
      keys.sort((a, b) =>        {
        return a.length-b.length;
      });
      for (let k of keys) {
          if (typeof k!=="string") {
              continue;
          }
          if (suffix.length===0) {
              list.push(k);
              continue;
          }
          if (k.startsWith(suffix)&&(hit2===undefined||k.length<hit2.length)) {
              hit = k;
              hit2 = k;
          }
          if (k.toLowerCase().startsWith(lsuffix)) {
              list.push(k);
          }
      }
      _silence();
      console.log(hit);
      console.log(list);
      _unsilence();
      let printall=0;
      if (hit) {
          let s=(prefix+join+hit).trim();
          if (s===this.textbox.value) {
              printall = 1;
          }
          this.textbox.value = s;
          this.textbox.setSelectionRange(s.length, s.length);
          window.tb = this.textbox;
      }
      else {
        printall = 1;
      }
      if (printall) {
          this.scroll[1] = 0.0;
          this.pushLine(new ConsoleLineEntry(""));
          for (let k of list) {
              let l=new ConsoleLineEntry("  "+k);
              this.pushLine(l);
          }
      }
    }
     goHistory(di) {
      if (this.history.length===0) {
          return ;
      }
      let i=this.history.cur;
      let push=(this.textbox.value.trim().length>0);
      if (push) {
          this.pushHistory(this.textbox.value.trim());
      }
      i = Math.min(Math.max(i+di, 0), this.history.length-1);
      this.history.cur = i;
      let s=this.history[i].command.trim();
      this.textbox.value = s;
      this.textbox.setSelectionRange(s.length, s.length);
    }
     popup(x, y) {

    }
     _on_keydown(e) {
      _silence();
      console.log(e.keyCode);
      _unsilence();
      e.stopPropagation();
      switch (e.keyCode) {
        case keymap["R"]:
          if ((e.ctrlKey|e.commandKey)&&!e.shiftKey&&!e.altKey) {
              location.reload();
          }
          break;
        case keymap["Tab"]:
          this.doTab(this.textbox.value);
          e.preventDefault();
          e.stopPropagation();
          break;
        case keymap["Enter"]:
          this.doCommand(this.textbox.value);
          this.textbox.value = "";
          break;
        case keymap["Up"]:
          this.goHistory(-1);
          break;
        case keymap["Down"]:
          this.goHistory(1);
          break;
      }
    }
     redraw() {
      this._animreq = 0;
      this.hitboxes = [];
      if (!this.canvas||!this.g) {
          return ;
      }
      let ts=this.fontsize*UIBase.getDPI();
      let canvas=this.canvas;
      let g=this.g;
      let c=this.getDefault("DefaultText").color;
      let font=this.getDefault("DefaultText");
      c = css2color(c);
      for (let i=0; i<3; i++) {
          let f=1.0-c[i];
          c[i]+=(f-c[i])*0.75;
      }
      let bg=color2css(c);
      g.resetTransform();
      g.fillStyle = bg;
      g.rect(0, 0, canvas.width, canvas.height);
      g.fill();
      g.font = font.genCSS(ts);
      g.fillStyle = font.color;
      let width=canvas.width, height=canvas.height;
      let lh=this.lineHeight;
      let pad1=10*UIBase.getDPI();
      let scroll=this.scroll;
      let x=scroll[0];
      let y=scroll[1]+5+canvas.height-lh;
      let this2=this;
      let color=g.font.color;
      let fontcpy=font.copy();
      let stateMachine={stack: [], 
     start: function start(x, y, color) {
          this.stack.length = 0;
          this.x = x;
          this.y = y;
          this.state = this.base;
          this.d = 0;
          this.param1 = 0;
          this.param2 = 0;
          this.bgcolor = undefined;
          this.color = color;
          this.font = g.font;
        }, 
     escape: function escape(c) {
          let ci=c.charCodeAt(0);
          if (this.d===0&&c==="[") {
              this.d++;
          }
          else 
            if (this.d===1&&ci>=48&&ci<=57) {
              this.param1 = c;
              this.d++;
          }
          else 
            if (this.d===2&&ci>=48&&ci<=57) {
              this.param2 = c;
              this.d++;
          }
          else 
            if (c==="m"&&this.d>=2) {
              let tcolor=this.param1;
              if (this.d>2) {
                  tcolor+=this.param2;
              }
              tcolor = parseInt(tcolor);
              if (tcolor===0) {
                  font.copyTo(fontcpy);
                  fontcpy.color = color;
                  this.bgcolor = undefined;
                  this.color = fontcpy.color;
                  this.font = fontcpy.genCSS(ts);
              }
              else 
                if (tcolor===1) {
                  fontcpy.weight = "bold";
                  this.font = fontcpy.genCSS(ts);
              }
              else 
                if (tcolor===4) {
              }
              else 
                if (tcolor>=40) {
                  this.bgcolor = termColorMap[tcolor-10];
                  if (this.bgcolor&&this.bgcolor in this2.colormap) {
                      this.bgcolor = this2.colormap[this.bgcolor];
                  }
              }
              else {
                this.color = termColorMap[tcolor];
                if (this.color&&this.color in this2.colormap) {
                    this.color = this2.colormap[this.color];
                }
              }
              this.state = this.base;
          }
          else {
            this.state = this.base;
            return "?";
          }
          return false;
        }, 
     base: function base(c) {
          let ci=c.charCodeAt(0);
          if (ci===27) {
              this.state = this.escape;
              this.d = 0;
              this.param1 = "";
              this.param2 = "";
              return false;
          }
          if (c===" ") {
              this.x+=ts;
              return false;
          }
          else 
            if (c=="\t") {
              this.x+=ts*2.0;
              return false;
          }
          if (ci<30) {
              return "?";
          }
          return c;
        }};
      let fillText=(s, x, y, bg) =>        {
        stateMachine.start(x, y, color);
        for (let i=0; i<s.length; i++) {
            let c=s[i];
            c = stateMachine.state(c);
            if (c===false) {
                continue;
            }
            if (stateMachine.font!==g.font) {
                g.font = stateMachine.font;
            }
            let w=g.measureText(c).width;
            stateMachine.x+=w;
            if (stateMachine.bgcolor!==undefined) {
                g.beginPath();
                g.rect(stateMachine.x, stateMachine.y+2, w, ts);
                let old=g.fillStyle;
                g.fillStyle = stateMachine.bgcolor;
                g.fill();
                g.fillStyle = old;
            }
            g.fillStyle = stateMachine.color;
            g.fillText(c, stateMachine.x, stateMachine.y);
        }
      };
      let measureText=(s) =>        {
        stateMachine.start(0, 0, color);
        for (let i=0; i<s.length; i++) {
            let c=s[i];
            c = stateMachine.state(c);
            if (c===false) {
                continue;
            }
            if (stateMachine.font!==g.font) {
                g.font = stateMachine.font;
            }
            let w=g.measureText(c).width;
            stateMachine.x+=w;
            g.fillStyle = stateMachine.color;
            g.fillText(c, stateMachine.x, stateMachine.y);
        }
        return {width: stateMachine.x}
      };
      let lines=this.lines;
      for (let li2=lines.length-1; li2>=0; li2--) {
          let li=(li2+this.head)%this.lines.length;
          let l=lines[li];
          let s=l.line;
          if (l.closed||y<-lh*4||y>=canvas.height+lh*3) {
              if (!l.closed) {
                  y-=lh;
                  if (l.flag&LineFlags.TWO_LINE) {
                      y-=lh;
                  }
              }
              continue;
          }
          if (l.bg) {
              g.beginPath();
              g.fillStyle = l.bg;
              g.rect(x, y-ts+2, canvas.width, ts+3);
              g.fill();
          }
          if (l.flag&LineFlags.ACTIVE) {
              g.beginPath();
              g.fillStyle = "rgb(255,255,255,0.2)";
              g.rect(x, y-ts+2, canvas.width, ts+3);
              g.fill();
          }
          color = l.fg ? l.fg : font.color;
          g.fillStyle = font.color;
          let w1=measureText(s).width;
          if (l.loc.length>0) {
              let w2=measureText(l.loc).width;
              if (w1+w2+pad1*2<canvas.width) {
                  l.flag&=~LineFlags.TWO_LINE;
                  g.fillStyle = this.colors["loc"];
                  fillText(l.loc, canvas.width-pad1-w2, y);
              }
              else {
                l.flag|=LineFlags.TWO_LINE;
                g.fillStyle = this.colors["loc"];
                fillText(l.loc, canvas.width-pad1-w2, y);
                y-=lh;
              }
          }
          if (l.children!==NO_CHILDREN) {
              let hb=new HitBox(x, y-ts+2, canvas.width, ts+3);
              hb.lines.push(l);
              this.hitboxes.push(hb);
          }
          fillText(s, x, y);
          y-=lh;
      }
    }
     updateSize() {
      if (!this.canvas)
        return ;
      let dpi=UIBase.getDPI();
      let w1=this.size[0];
      let h1=this.size[1]-100/dpi;
      let w2=~~(w1*dpi);
      let h2=~~(h1*dpi);
      let canvas=this.canvas;
      if (w2!==canvas.width||h2!==canvas.height) {
          console.log("resizing console canvas");
          this.canvas.style["width"] = (w2/dpi)+"px";
          this.canvas.style["height"] = (h2/dpi)+"px";
          this.canvas.width = w2;
          this.canvas.height = h2;
          this.queueRedraw();
      }
    }
     queueRedraw() {
      if (this._animreq) {
          return ;
      }
      this._animreq = 1;
      requestAnimationFrame(this.redraw);
    }
     setCSS() {
      this.updateSize();
    }
     update() {
      if (!this.ctx) {
          return ;
      }
      g_screen = this.ctx.screen;
      super.update();
      this.updateSize();
    }
    static  define() {
      return {tagname: "console-editor-x", 
     areaname: "console_editor", 
     uiname: "Console", 
     icon: Icons.CONSOLE_EDITOR, 
     flag: 0, 
     style: "console"}
    }
     copy() {
      return document.createElement("console-editor-x");
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.history.cur = this.history.length;
      for (let i=0; i<this.lines.length; i++) {
          if (typeof this.lines[i]==="string") {
              this.lines[i] = new ConsoleLineEntry(this.lines[i], "");
          }
      }
    }
  }
  _ESClass.register(ConsoleEditor);
  _es6_module.add_class(ConsoleEditor);
  ConsoleEditor = _es6_module.add_export('ConsoleEditor', ConsoleEditor);
  ConsoleEditor.STRUCT = nstructjs.inherit(ConsoleEditor, Editor)+`
    fontsize    :  float;
    bufferSize  :  int;
    lines       :  array(ConsoleLineEntry);
    history     :  array(ConsoleCommand);
    head        :  int;
    scroll      :  vec2;
}`;
  Editor.register(ConsoleEditor);
}, '/dev/fairmotion/src/editors/console/console.js');
es6_module_define('theme', ["../path.ux/scripts/util/util.js", "../path.ux/scripts/core/ui_theme.js"], function _theme_module(_es6_module) {
  var CSSFont=es6_import_item(_es6_module, '../path.ux/scripts/core/ui_theme.js', 'CSSFont');
  var util=es6_import(_es6_module, '../path.ux/scripts/util/util.js');
  const theme={base: {AreaHeaderBG: 'rgba(65, 65, 65, 1.0)', 
    BasePackFlag: 0, 
    BoxBG: 'rgba(100,100,100, 0.558404961947737)', 
    BoxBorder: 'rgba(196,196,196, 1)', 
    BoxDepressed: 'rgba(43,32,27, 0.7410558240167026)', 
    BoxDrawMargin: 2, 
    BoxHighlight: 'rgba(125, 195, 225, 1.0)', 
    BoxMargin: 4, 
    BoxRadius: 12, 
    BoxSub2BG: 'rgba(55, 55, 55, 1.0)', 
    BoxSubBG: 'rgba(75, 75, 75, 1.0)', 
    DefaultPanelBG: 'rgba(75, 75, 75, 1.0)', 
    DefaultText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 10, 
     color: 'rgba(215, 215, 215, 1.0)'}), 
    Disabled: {AreaHeaderBG: 'rgb(72, 72, 72)', 
     BoxBG: 'rgb(50, 50, 50)', 
     BoxSub2BG: 'rgb(50, 50, 50)', 
     BoxSubBG: 'rgb(50, 50, 50)', 
     DefaultPanelBG: 'rgb(72, 72, 72)', 
     InnerPanelBG: 'rgb(72, 72, 72)', 
     'background-color': 'rgb(72, 72, 72)', 
     'background-size': '5px 3px', 
     'border-radius': '15px'}, 
    FocusOutline: 'rgba(100, 150, 255, 1.0)', 
    HotkeyText: new CSSFont({font: 'courier', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(230, 230, 230, 1.0)'}), 
    InnerPanelBG: 'rgba(85, 85, 85, 1.0)', 
    LabelText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(215, 215, 215, 1.0)'}), 
    NoteBG: 'rgba(220, 220, 220, 0.0)', 
    NoteText: new CSSFont({font: 'sans-serif', 
     weight: 'bold', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(235, 235, 235, 1.0)'}), 
    ProgressBar: 'rgba(75, 175, 255, 1.0)', 
    ProgressBarBG: 'rgba(110, 110, 110, 1.0)', 
    ScreenBorderInner: 'rgba(120, 120, 120, 1.0)', 
    ScreenBorderMousePadding: 5, 
    ScreenBorderOuter: 'rgba(120, 120, 120, 1.0)', 
    ScreenBorderWidth: 2, 
    TitleText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(215, 215, 215, 1.0)'}), 
    ToolTipText: new CSSFont({font: 'sans-serif', 
     weight: 'bold', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(35, 35, 35, 1.0)'}), 
    defaultHeight: 24, 
    defaultWidth: 24, 
    mobileSizeMultiplier: 2, 
    mobileTextSizeMultiplier: 1.5, 
    numslider_height: 20, 
    numslider_width: 20, 
    oneAxisMargin: 6, 
    oneAxisPadding: 6, 
    themeVersion: 0.1}, 
   button: {BoxMargin: 7.491595625232676, 
    defaultHeight: 24, 
    defaultWidth: 100}, 
   checkbox: {BoxMargin: 2, 
    CheckSide: 'left'}, 
   colorfield: {circleSize: 4, 
    colorBoxHeight: 24, 
    defaultHeight: 200, 
    defaultWidth: 200, 
    fieldsize: 32, 
    hueheight: 24}, 
   colorpickerbutton: {defaultFont: 'LabelText', 
    defaultHeight: 25, 
    defaultWidth: 100}, 
   console: {DefaultText: new CSSFont({font: 'monospace', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 18, 
     color: 'rgba(225, 225, 225, 1.0)'})}, 
   curvewidget: {CanvasBG: 'rgba(50, 50, 50, 0.75)', 
    CanvasHeight: 256, 
    CanvasWidth: 256}, 
   dopesheet: {DefaultText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 10, 
     color: 'rgba(209,209,209, 1)'}), 
    TreeText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(207,207,207, 1)'}), 
    boxSize: 14, 
    keyBorder: 'rgba(255,255,240, 0.4038793037677633)', 
    keyBorderWidth: 1.0403650286511763, 
    keyColor: 'rgba(82,82,82, 1)', 
    keyHighlight: 'rgba(195,159,136, 1)', 
    keySelect: 'rgba(83,109,255, 1)', 
    lineMajor: 'rgba(255, 255, 255, 0.5)', 
    lineMinor: 'rgba(50, 50, 50, 1.0)', 
    timeLine: "rgba(50, 150, 255, 0.75)", 
    lineWidth: 1, 
    textShadowColor: 'rgba(131,77,56, 1)', 
    textShadowSize: 5.048919110763356, 
    treeHeight: 600, 
    treeWidth: 100}, 
   dropbox: {BoxHighlight: 'rgba(155, 220, 255, 0.4)', 
    defaultHeight: 19.508909279310238, 
    dropTextBG: 'rgba(38,22,15, 0)'}, 
   iconbutton: {}, 
   iconcheck: {}, 
   listbox: {DefaultPanelBG: 'rgba(81,81,81, 1)', 
    ListActive: 'rgba(49,39,35, 1)', 
    ListHighlight: 'rgba(55,112,226, 0.3637933139143319)', 
    height: 200, 
    width: 110}, 
   menu: {MenuBG: 'rgba(40,40,40, 1)', 
    MenuBorder: '1px solid grey', 
    MenuHighlight: 'rgba(171,171,171, 0.28922413793103446)', 
    MenuSeparator: `
      width : 100%;
      height : 2px;
      padding : 0px;
      margin : 0px;
      border : none;
      background-color : grey;
    `, 
    MenuSpacing: 0, 
    MenuText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'rgba(238,238,238, 1)'})}, 
   numslider: {DefaultText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 12, 
     color: 'white'}), 
    defaultHeight: 22.76656831702612, 
    defaultWidth: 100}, 
   numslider_simple: {BoxBG: 'rgb(225, 225, 225)', 
    BoxBorder: 'rgb(75, 75, 75)', 
    BoxRadius: 5, 
    DefaultHeight: 18, 
    DefaultWidth: 135, 
    SlideHeight: 10, 
    TextBoxWidth: 45, 
    TitleText: new CSSFont({font: undefined, 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 14, 
     color: undefined}), 
    labelOnTop: false}, 
   panel: {Background: 'rgba(38,22,15, 0.2642241905475485)', 
    BoxBorder: 'rgba(91,91,91, 1)', 
    BoxLineWidth: 0.9585563201850567, 
    BoxRadius: 5, 
    TitleBackground: 'rgba(126,178,237, 0.309051618904903)', 
    TitleBorder: 'rgba(136,136,136, 1)', 
    'border-style': 'inset', 
    'padding-bottom': undefined, 
    'padding-top': undefined}, 
   richtext: {DefaultText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 16, 
     color: 'rgba(35, 35, 35, 1.0)'}), 
    'background-color': undefined}, 
   scrollbars: {border: 'rgba(125,125,125, 1)', 
    color: 'rgba(56,56,56, 1)', 
    color2: '#505050', 
    contrast: 'rgba(75,38,38, 1)', 
    width: 15}, 
   tabs: {TabHighlight: 'rgba(50, 50, 50, 0.2)', 
    TabInactive: 'rgba(130, 130, 150, 1.0)', 
    TabStrokeStyle1: 'rgba(200, 200, 200, 1.0)', 
    TabStrokeStyle2: 'rgba(255, 255, 255, 1.0)', 
    TabText: new CSSFont({font: 'sans-serif', 
     weight: 'normal', 
     variant: 'normal', 
     style: 'normal', 
     size: 18, 
     color: 'rgba(215, 215, 215, 1.0)'})}, 
   textbox: {'background-color': undefined}, 
   tooltip: {BoxBG: 'rgb(245, 245, 245, 1.0)', 
    BoxBorder: 'rgb(145, 145, 145, 1.0)'}, 
   treeview: {itemIndent: 10, 
    rowHeight: 18}}
  _es6_module.add_export('theme', theme);
}, '/dev/fairmotion/src/editors/theme.js');
es6_module_define('MenuBar', ["../../path.ux/scripts/widgets/ui_widgets.js", "../../core/startup/startup_file.js", "../../core/struct.js", "../../path.ux/scripts/platforms/electron/electron_api.js", "../../path.ux/scripts/screen/ScreenArea.js", "../editor_base.js", "../../path.ux/scripts/core/ui_base.js", "../../path.ux/scripts/widgets/ui_menu.js", "../../../platforms/platform.js"], function _MenuBar_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'Area');
  var AreaFlags=es6_import_item(_es6_module, '../../path.ux/scripts/screen/ScreenArea.js', 'AreaFlags');
  var STRUCT=es6_import_item(_es6_module, '../../core/struct.js', 'STRUCT');
  var UIBase=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var iconmanager=es6_import_item(_es6_module, '../../path.ux/scripts/core/ui_base.js', 'iconmanager');
  var Editor=es6_import_item(_es6_module, '../editor_base.js', 'Editor');
  var ui_widgets=es6_import(_es6_module, '../../path.ux/scripts/widgets/ui_widgets.js');
  var platform=es6_import(_es6_module, '../../../platforms/platform.js');
  var Menu=es6_import_item(_es6_module, '../../path.ux/scripts/widgets/ui_menu.js', 'Menu');
  var startup_file=es6_import_item(_es6_module, '../../core/startup/startup_file.js', 'startup_file');
  var electron_api=es6_import(_es6_module, '../../path.ux/scripts/platforms/electron/electron_api.js');
  class MenuBar extends Editor {
     constructor() {
      super();
      let dpi=UIBase.getDPI();
      let tilesize=iconmanager.getTileSize(0)+7;
      let h=Math.max(this.getDefault("TitleText").size, tilesize);
      this.editMenuDef = [];
      this._last_toolmode = undefined;
      this.maxSize = [undefined, h];
      this.minSize = [undefined, h];
    }
     buildRecentMenu() {
      let menu=document.createElement("menu-x");
      menu.setAttribute("title", "Recent Files");
      let paths=g_app_state.settings.recent_paths;
      for (let p of paths) {
          let name=p.displayname;
          let id=p.path;
          let i=name.length-1;
          while (i>=0&&name[i]!=="/"&&name[i]!=="\\") {
            i--;
          }
          if (i>=0) {
              i++;
          }
          name = name.slice(i, name.length).trim();
          menu.addItem(name, id);
      }
      menu.onselect = (id) =>        {
        console.warn("recent files callback!", id);
        g_app_state.load_path(id);
      };
      return menu;
    }
     init() {
      super.init();
      let row=this.header;
      let SEP=Menu.SEP;
      let menudef=["appstate.quit()", "view2d.export_image()", "appstate.export_svg()", SEP, "appstate.save_as()", "appstate.save()", this.buildRecentMenu.bind(this), "appstate.open()", SEP, ["New File", function () {
        platform.app.questionDialog("Create blank scene?\nAny unsaved changes\nwill be lost").then((val) =>          {
          if (val) {
              gen_default_file(g_app_state.screen.size);
          }
        });
      }]];
      menudef.reverse();
      row.menu("&File", menudef);
      this.genSessionMenu(row);
      let notef=document.createElement("noteframe-x");
      notef.ctx = this.ctx;
      row._add(notef);
      if (window.haveElectron) {
          electron_api.initMenuBar(this);
          this.minSize[1] = this.maxSize[1] = 1;
      }
    }
     buildEditMenu() {
      console.log("rebuilding edit menu");
      this.editMenuDef.length = 0;
      this.editMenuDef.push(["Undo", function () {
        g_app_state.toolstack.undo();
      }, "Ctrl + Z", Icons.UNDO]);
      this.editMenuDef.push(["Redo", function () {
        g_app_state.toolstack.undo();
      }, "Ctrl + Shift + Z", Icons.REDO]);
      if (!this.ctx||!this.ctx.toolmode) {
          return ;
      }
      let ret=g_app_state.ctx.toolmode.constructor.buildEditMenu();
      if (!ret)
        return ;
      for (let item of ret) {
          this.editMenuDef.push(item);
      }
    }
     genSessionMenu(row) {
      function callback(entry) {
        console.log(entry);
        if (entry.i==0) {
            if (confirm("Settings will be cleared", "Clear Settings?")) {
                console.log("clearing settings");
                ctx.appstate.session.settings.reload_defaults();
            }
        }
        else 
          if (entry.i==2) {
            g_app_state.set_startup_file();
        }
        else 
          if (entry.i==1) {
            myLocalStorage.set("startup_file", startup_file);
        }
      }
      row.dynamicMenu("&Edit", this.editMenuDef);
      this.buildEditMenu();
      row.menu("&Session", [["Save Default File", function () {
        platform.app.questionDialog("Erase default startup file?").then((val) =>          {
          if (val) {
              g_app_state.set_startup_file();
              console.log("save default file", val);
          }
        });
      }], ["Clear Default File", function () {
        platform.app.questionDialog("Erase default startup file?").then((val) =>          {
          if (val) {
              myLocalStorage.set("startup_file", startup_file);
              console.log("clear default file", val);
          }
        });
      }, "ctrl-alt-u"], ["Reset Settings", function () {
        platform.app.questionDialog("Settings will be cleared", "Clear Settings?").then((val) =>          {
          if (val) {
              console.log("clearing settings");
              ctx.appstate.session.settings.reload_defaults();
          }
        });
      }]]);
    }
     update() {
      super.update();
      if (!this.ctx||!this.ctx.scene) {
          return ;
      }
      if (this._last_toolmode!==this.ctx.scene.toolmode_i) {
          this._last_toolmode = this.ctx.scene.toolmode_i;
          this.buildEditMenu();
      }
    }
    static  getHeight() {
      let ctx=g_app_state.ctx;
      if (ctx&&ctx.menubar) {
          return ctx.menubar.minSize[1];
      }
      return 28;
    }
     makeHeader(container) {
      super.makeHeader(container, false);
    }
    static  define() {
      return {tagname: "menubar-editor-x", 
     areaname: "menubar_editor", 
     uiname: "menu", 
     icon: Icons.MENU_EDITOR, 
     flag: AreaFlags.HIDDEN|AreaFlags.NO_SWITCHER}
    }
     copy() {
      return document.createElement("menubar-editor-x");
    }
  }
  _ESClass.register(MenuBar);
  _es6_module.add_class(MenuBar);
  MenuBar = _es6_module.add_export('MenuBar', MenuBar);
  MenuBar.STRUCT = STRUCT.inherit(MenuBar, Editor)+`
}
`;
  Editor.register(MenuBar);
}, '/dev/fairmotion/src/editors/menubar/MenuBar.js');
es6_module_define('events', ["../path.ux/scripts/util/events.js", "../path.ux/scripts/util/vectormath.js"], function _events_module(_es6_module) {
  "use strict";
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/util/vectormath.js', 'Vector3');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/util/vectormath.js', 'Matrix4');
  var keymap=es6_import_item(_es6_module, '../path.ux/scripts/util/events.js', 'keymap');
  var reverse_keymap=es6_import_item(_es6_module, '../path.ux/scripts/util/events.js', 'reverse_keymap');
  let charmap=keymap;
  charmap = _es6_module.add_export('charmap', charmap);
  let charmap_rev=reverse_keymap;
  charmap_rev = _es6_module.add_export('charmap_rev', charmap_rev);
  window.charmap = charmap;
  window.charmap_rev = charmap_rev;
  class MyKeyboardEvent  {
     constructor(code, shift=false, ctrl=false, alt=false) {
      this.keyCode = code;
      this.shiftKey = shift;
      this.ctrlKey = ctrl;
      this.altKey = alt;
    }
  }
  _ESClass.register(MyKeyboardEvent);
  _es6_module.add_class(MyKeyboardEvent);
  MyKeyboardEvent = _es6_module.add_export('MyKeyboardEvent', MyKeyboardEvent);
  window.MyKeyboardEvent = MyKeyboardEvent;
  class MyMouseEvent  {
    
     constructor(x, y, button, type) {
      this.x = x;
      this.y = y;
      this.button = button;
      this.type = type;
      this.touches = {};
    }
     copy(sub_offset=undefined) {
      var ret=new MyMouseEvent(this.x, this.y, this.button, this.type);
      for (var k in this.touches) {
          var t=this.touches[k];
          var x=t[0], y=t[1];
          if (sub_offset) {
              x-=sub_offset[0];
              y-=sub_offset[1];
          }
          ret.touches[k] = [x, y];
      }
      return ret;
    }
  }
  _ESClass.register(MyMouseEvent);
  _es6_module.add_class(MyMouseEvent);
  MyMouseEvent = _es6_module.add_export('MyMouseEvent', MyMouseEvent);
  window.MyMouseEvent = MyMouseEvent;
  MyMouseEvent.MOUSEMOVE = 0;
  MyMouseEvent.MOUSEDOWN = 1;
  MyMouseEvent.MOUSEUP = 2;
  MyMouseEvent.LEFT = 0;
  MyMouseEvent.RIGHT = 1;
  var _swap_next_mouseup=false;
  var _swap_next_mouseup_button=2;
  function swap_next_mouseup_event(button) {
    _swap_next_mouseup = true;
    _swap_next_mouseup_button = button;
  }
  swap_next_mouseup_event = _es6_module.add_export('swap_next_mouseup_event', swap_next_mouseup_event);
  var _ignore_next_mouseup=false;
  var _ignore_next_mouseup_button=2;
  function ignore_next_mouseup_event(button) {
    _ignore_next_mouseup = true;
    _ignore_next_mouseup_button = button;
  }
  ignore_next_mouseup_event = _es6_module.add_export('ignore_next_mouseup_event', ignore_next_mouseup_event);
  class EventHandler  {
     constructor() {
      this.EventHandler_init();
    }
     EventHandler_init() {
      this.modalstack = new Array();
      this.modalhandler = null;
      this.keymap = null;
      this.touch_manager = undefined;
      this.touch_delay_stack = [];
    }
     push_touch_delay(delay_ms) {
      this.touch_delay_stack.push(this.touch_delay);
      this.touch_delay = delay_ms;
    }
     pop_touch_delay() {
      if (this.touch_delay_stack.length==0) {
          console.log("Invalid call to EventHandler.pop_touch_delay!");
          return ;
      }
      this.touch_delay = this.touch_delay_stack.pop();
    }
    set  touch_delay(delay_ms) {
      if (delay_ms==0) {
          this.touch_manager = undefined;
      }
      else {
        if (this.touch_manager==undefined)
          this.touch_manager = new TouchEventManager(this, delay_ms);
        else 
          this.touch_manager.delay = delay_ms;
      }
    }
    get  touch_delay() {
      if (this.touch_manager==undefined)
        return 0;
      return this.touch_manager.delay;
    }
     on_tick() {
      if (this.touch_manager!=undefined)
        this.touch_manager.process();
    }
     bad_event(event) {
      var tm=this.touch_manager;
      if (tm==undefined)
        return false;
      if (this.touch_manager!=undefined)
        this.touch_manager.process();
      if (tm!=undefined&&__instance_of(event, MyMouseEvent)) {
          var i=0;
          for (var k in event.touches) {
              i++;
          }
          if (i==0)
            return false;
          if ("_good" in event)
            return false;
          this.touch_manager.queue_event(event);
          return true;
      }
      return false;
    }
     on_textinput(event) {

    }
     on_keydown(event) {

    }
     on_charcode(event) {

    }
     on_keyinput(event) {

    }
     on_keyup(event) {

    }
     on_mousemove(event) {

    }
     on_mousedown(event) {

    }
     on_doubleclick(event) {

    }
     on_pan(pan, last_pan) {

    }
     on_gl_lost(new_gl) {

    }
     on_mouseup2(event) {

    }
     on_mouseup3(event) {

    }
     on_mousedown2(event) {

    }
     on_mousedown3(event) {

    }
     on_mousemove2(event) {

    }
     on_mousemove3(event) {

    }
     on_mousewheel(event) {

    }
     on_mouseup(event) {

    }
     on_resize(newsize) {

    }
     on_contextchange(event) {

    }
     on_draw(gl) {

    }
     has_modal() {
      return this.modalhandler!=null;
    }
     push_modal(handler) {
      if (this.modalhandler!=null) {
          this.modalstack.push(this.modalhandler);
      }
      this.modalhandler = handler;
    }
     pop_modal() {
      if (this.modalhandler!=null) {
      }
      if (this.modalstack.length>0) {
          this.modalhandler = this.modalstack.pop();
      }
      else {
        this.modalhandler = null;
      }
    }
     _on_resize(newsize) {
      this.on_resize(event);
    }
     _on_pan(pan, last_pan) {
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_pan(event);
      else 
        this.on_pan(event);
    }
     _on_textinput(event) {
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_textinput(event);
      else 
        this.on_textinput(event);
    }
     _on_keydown(event) {
      if (this.bad_event(event))
        return ;
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_keydown(event);
      else 
        this.on_keydown(event);
    }
     _on_charcode(event) {
      if (this.bad_event(event))
        return ;
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_charcode(event);
      else 
        this.on_charcode(event);
    }
     _on_keyinput(event) {
      if (this.bad_event(event))
        return ;
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_keyinput(event);
      else 
        this.on_keyinput(event);
    }
     _on_keyup(event) {
      if (this.bad_event(event))
        return ;
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_keyup(event);
      else 
        this.on_keyup(event);
    }
     _on_mousemove(event) {
      if (this.bad_event(event))
        return ;
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_mousemove(event);
      else 
        this.on_mousemove(event);
    }
     _on_doubleclick(event) {
      if (this.bad_event(event))
        return ;
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_doubleclick(event);
      else 
        this.on_doubleclick(event);
    }
     _on_mousedown(event) {
      if (this.bad_event(event))
        return ;
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_mousedown(event);
      else 
        this.on_mousedown(event);
    }
     _on_mouseup(event) {
      if (this.bad_event(event))
        return ;
      if (_swap_next_mouseup&&event.button==_swap_next_mouseup_button) {
          event.button = _swap_next_mouseup_button==2 ? 0 : 2;
          _swap_next_mouseup = false;
      }
      if (_ignore_next_mouseup&&event.button==_ignore_next_mouseup_button) {
          _ignore_next_mouseup = false;
          return ;
      }
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_mouseup(event);
      else 
        this.on_mouseup(event);
    }
     _on_mousewheel(event, delta) {
      if (this.bad_event(event))
        return ;
      if (this.modalhandler!=null&&this.modalhandler!==this)
        this.modalhandler._on_mousewheel(event, delta);
      else 
        this.on_mousewheel(event, delta);
    }
  }
  _ESClass.register(EventHandler);
  _es6_module.add_class(EventHandler);
  EventHandler = _es6_module.add_export('EventHandler', EventHandler);
  var valid_modifiers={"SHIFT": 1, 
   "CTRL": 2, 
   "ALT": 4}
  window.charmap = charmap;
  window.charmap_rev = charmap_rev;
  class HotKey  {
    
    
    
    
    
     constructor(key, modifiers, uiname, menunum, ignore_charmap_error) {
      if (!charmap.hasOwnProperty(key)) {
          if (ignore_charmap_error!=undefined&&ignore_charmap_error!=true) {
              console.trace();
              console.log("Invalid hotkey "+key+"!");
          }
          this.key = 0;
          this.keyAscii = "[corrupted hotkey]";
          this.shift = this.alt = this.ctrl = false;
          return this;
      }
      if (typeof (key)=="string") {
          if (key.length==1)
            key = key.toUpperCase();
          this.keyAscii = key;
          this.key = charmap[key];
      }
      else {
        this.key = key;
        this.keyAscii = charmap[key];
      }
      this.shift = this.alt = this.ctrl = false;
      this.menunum = menunum;
      for (var i=0; i<modifiers.length; i++) {
          if (modifiers[i]=="SHIFT") {
              this.shift = true;
          }
          else 
            if (modifiers[i]=="ALT") {
              this.alt = true;
          }
          else 
            if (modifiers[i]=="CTRL") {
              this.ctrl = true;
          }
          else {
            console.trace();
            console.log("Warning: invalid modifier "+modifiers[i]+" in KeyHandler");
          }
      }
    }
     build_str(add_menu_num) {
      var s="";
      if (this.ctrl)
        s+="CTRL-";
      if (this.alt)
        s+="ALT-";
      if (this.shift)
        s+="SHIFT-";
      s+=this.keyAscii;
      return s;
    }
     [Symbol.keystr]() {
      return this.build_str(false);
    }
  }
  _ESClass.register(HotKey);
  _es6_module.add_class(HotKey);
  HotKey = _es6_module.add_export('HotKey', HotKey);
  class KeyMap extends hashtable {
    
     constructor() {
      super();
      this.op_map = new hashtable();
    }
     concat(keymap) {
      for (let key of keymap) {
          this.add(key, keymap.get(key));
      }
      return this;
    }
     get_tool_handler(toolstr) {
      if (this.op_map.has(toolstr))
        return this.op_map.get(toolstr);
    }
     add_tool(keyhandler, toolstr) {
      this.add(keyhandler, new ToolKeyHandler(toolstr));
      this.op_map.add(toolstr, keyhandler);
    }
     add_func(keyhandler, func) {
      this.add(keyhandler, new FuncKeyHandler(func));
    }
     add(keyhandler, value) {
      if (this.has(keyhandler)) {
          console.trace();
          console.log("Duplicate hotkey definition!");
      }
      if (__instance_of(value, ToolKeyHandler)&&!(typeof value.tool=="string"||__instance_of(value.tool, String))) {
          value.tool.keyhandler = keyhandler;
      }
      super.set(keyhandler, value);
    }
     process_event(ctx, event) {
      var modlist=[];
      if (event.ctrlKey)
        modlist.push("CTRL");
      if (event.shiftKey)
        modlist.push("SHIFT");
      if (event.altKey)
        modlist.push("ALT");
      var key=new HotKey(event.keyCode, modlist, 0, 0, true);
      if (this.has(key)) {
          ctx.keymap_mpos[0] = ctx.screen.mpos[0];
          ctx.keymap_mpos[1] = ctx.screen.mpos[1];
          return this.get(key).handle(ctx);
      }
      return undefined;
    }
  }
  _ESClass.register(KeyMap);
  _es6_module.add_class(KeyMap);
  KeyMap = _es6_module.add_export('KeyMap', KeyMap);
  class KeyHandlerCls  {
     handle(ctx) {

    }
  }
  _ESClass.register(KeyHandlerCls);
  _es6_module.add_class(KeyHandlerCls);
  KeyHandlerCls = _es6_module.add_export('KeyHandlerCls', KeyHandlerCls);
  class ToolKeyHandler extends KeyHandlerCls {
     constructor(tool) {
      super();
      this.tool = tool;
    }
     handle(ctx) {
      ctx.api.execTool(ctx, this.tool);
    }
  }
  _ESClass.register(ToolKeyHandler);
  _es6_module.add_class(ToolKeyHandler);
  ToolKeyHandler = _es6_module.add_export('ToolKeyHandler', ToolKeyHandler);
  class FuncKeyHandler extends KeyHandlerCls {
     constructor(func) {
      super();
      this.handle = func;
    }
  }
  _ESClass.register(FuncKeyHandler);
  _es6_module.add_class(FuncKeyHandler);
  FuncKeyHandler = _es6_module.add_export('FuncKeyHandler', FuncKeyHandler);
  var $was_clamped_NG1c_clamp_pan;
  class VelocityPan extends EventHandler {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
     constructor() {
      super();
      this.start_mpos = new Vector2();
      this.last_mpos = new Vector2();
      this.mpos = new Vector2();
      this.start_time = 0;
      this.owner = undefined;
      this.coasting = false;
      this.panning = false;
      this.was_touch = false;
      this.enabled = true;
      this.vel = new Vector2();
      this.pan = new Vector2();
      this.damp = 0.99;
      this.can_coast = true;
      this.start_pan = new Vector2();
      this.first = false;
      this.last_ms = 0;
      this.vel = new Vector2();
    }
     on_tick() {
      if (!this.panning&&this.coasting) {
          let vel=new Vector2();
          var damp=0.99;
          vel.load(this.vel);
          vel.mulScalar(time_ms()-this.last_ms);
          this.vel.mulScalar(damp);
          this.last_ms = time_ms();
          this.pan.sub(vel);
          var was_clamped=this.clamp_pan();
          this.owner.on_pan(this.pan, this.start_pan);
          var stop=was_clamped!=undefined&&(was_clamped[0]&&was_clamped[1]);
          stop = stop||this.vel.vectorLength<1;
          if (stop)
            this.coasting = false;
      }
    }
     calc_vel() {
      let vel=new Vector2();
      if (!this.can_coast) {
          this.vel.zero();
          this.coasting = false;
          this.last_ms = time_ms();
          return ;
      }
      var t=time_ms()-this.start_time;
      if (t<10) {
          console.log("small t!!!", t);
          return ;
      }
      vel.load(this.last_mpos).sub(this.mpos).divideScalar(t);
      this.vel.add(vel);
      this.coasting = (this.vel.vectorLength()>0.25);
      this.last_ms = time_ms();
    }
     start(start_mpos, last_mpos, owner, push_modal_func, pop_modal_func) {
      if (this.panning) {
          console.trace("warning, duplicate call to VelocityPan.start()");
          return ;
      }
      this.vel.zero();
      this.pop_modal_func = pop_modal_func;
      this.coasting = false;
      this.first = false;
      this.owner = owner;
      this.panning = true;
      push_modal_func(this);
      this.start_pan.load(this.pan);
      this.last_ms = time_ms();
      this.start_time = time_ms();
      this.was_touch = g_app_state.was_touch;
      this.start_mpos.load(start_mpos);
      this.last_mpos.load(start_mpos);
      this.mpos.load(start_mpos);
      this.do_mousemove(last_mpos);
    }
     end() {
      console.log("in end");
      if (this.panning) {
          console.log("  pop modal");
          this.pop_modal_func();
      }
      this.panning = false;
    }
     do_mousemove(mpos) {
      if (DEBUG.touch) {
          console.log("py", mpos[1]);
      }
      this.last_mpos.load(this.mpos);
      this.mpos.load(mpos);
      this.pan[0] = this.start_pan[0]+mpos[0]-this.start_mpos[0];
      this.pan[1] = this.start_pan[1]+mpos[1]-this.start_mpos[1];
      this.vel.zero();
      this.calc_vel();
      this.clamp_pan();
      this.owner.on_pan(this.pan, this.start_pan);
    }
     clamp_pan() {
      var bs=this.owner.pan_bounds;
      if (this.owner.state&8192*4)
        return ;
      var p=this.pan;
      $was_clamped_NG1c_clamp_pan[0] = false;
      $was_clamped_NG1c_clamp_pan[1] = false;
      for (var i=0; i<2; i++) {
          var l=p[i];
          p[i] = Math.min(Math.max(bs[0][i], p[i]), bs[0][i]+bs[1][i]);
          if (p[i]!=l)
            $was_clamped_NG1c_clamp_pan[i] = true;
      }
      return $was_clamped_NG1c_clamp_pan;
    }
     on_mouseup(event) {
      console.log("pan mouse up!", this.panning, this.owner);
      if (this.panning) {
          this.mpos.load([event.y, event.y]);
          this.calc_vel();
          this.end();
      }
    }
     on_mousemove(event) {
      this.do_mousemove([event.x, event.y]);
    }
     set_pan(pan) {
      if (this.panning)
        this.end();
      this.pan.load(pan);
      this.coasting = false;
      this.vel.zero();
    }
  }
  var $was_clamped_NG1c_clamp_pan=[0, 0];
  _ESClass.register(VelocityPan);
  _es6_module.add_class(VelocityPan);
  VelocityPan = _es6_module.add_export('VelocityPan', VelocityPan);
  class TouchEventManager  {
     constructor(owner, delay=100) {
      this.init(owner, delay);
    }
     init(owner, delay=100) {
      this.queue = new GArray();
      this.queue_ms = new GArray();
      this.delay = delay;
      this.owner = owner;
    }
     get_last(type) {
      var i=this.queue.length;
      if (i==0)
        return undefined;
      i--;
      var q=this.queue;
      while (i>=0) {
        var e=q[i];
        if (e.type==type||e.type!=MyMouseEvent.MOUSEMOVE)
          break;
        i--;
      }
      if (i<0)
        i = 0;
      return q[i].type==type ? q[i] : undefined;
    }
     queue_event(event) {
      var last=this.get_last(event.type);
      if (DEBUG.touch&&this==touch_manager)
        console.log("touch event", event.type);
      if (last!=undefined&&last.type!=MyMouseEvent.MOUSEMOVE) {
          var dis, same=true;
          for (var k in event.touches) {
              if (!(k in last.touches)) {
              }
          }
          dis = new Vector2([event.x, event.y]).vectorDistance(new Vector2([last.x, last.y]));
          if (DEBUG.touch&&this==touch_manager)
            console.log(dis);
          if (same&&dis<50) {
              if (DEBUG.touch&&this==touch_manager)
                console.log("destroying duplicate event", last.type, event.x, event.y, event.touches);
              for (var k in event.touches) {
                  last.touches[k] = event.touches[k];
              }
              return ;
          }
      }
      this.queue.push(event);
      this.queue_ms.push(time_ms());
    }
     cancel(event) {
      var ts=event.touches;
      var dl=new GArray;
      if (DEBUG.touch&&this==touch_manager)
        console.log("touch cancel", event);
      for (var e in this.queue) {
          for (var k in ts) {
              if (k in e.touches) {
                  delete e.touches;
              }
          }
          if (list(e.touches).length==0) {
              dl.push(e);
          }
      }
      for (var e in dl) {
          var i=this.queue.indexOf(e);
          this.queue.remove(e);
          this.queue_ms.pop_i(i);
      }
    }
     process() {
      var owner=this.owner;
      var dl=new GArray();
      var q=this.queue;
      var qm=this.queue_ms;
      var delay=this.delay;
      for (var i=0; i<q.length; i++) {
          if (time_ms()-qm[i]>delay) {
              dl.push(q[i]);
          }
      }
      for (var e of dl) {
          var i=q.indexOf(e);
          q.remove(e);
          qm.pop_i(i);
      }
      for (var e of dl) {
          e._good = true;
          g_app_state.was_touch = true;
          try {
            if (e.type==MyMouseEvent.MOUSEDOWN) {
                if (DEBUG.touch)
                  console.log("td1", e.x, e.y);
                owner._on_mousedown(e);
                if (DEBUG.touch)
                  console.log("td2", e.x, e.y);
            }
            else 
              if (e.type==MyMouseEvent.MOUSEMOVE) {
                owner._on_mousemove(e);
            }
            else 
              if (e.type==MyMouseEvent.MOUSEUP) {
                owner._on_mouseup(e);
            }
          }
          catch (_err) {
              print_stack(_err);
              console.log("Error executing delayed touch event");
          }
      }
    }
     reset() {
      this.queue = new GArray();
      this.queue_ms = new GArray();
    }
  }
  _ESClass.register(TouchEventManager);
  _es6_module.add_class(TouchEventManager);
  TouchEventManager = _es6_module.add_export('TouchEventManager', TouchEventManager);
  window.TouchEventManager = TouchEventManager;
  var touch_manager=window.touch_manager = new TouchEventManager(undefined, 20);
}, '/dev/fairmotion/src/editors/events.js');
es6_module_define('touchevents', [], function _touchevents_module(_es6_module) {
  "use strict";
  class TouchManager  {
    
    
    
     constructor(event) {
      this.pattern = new set(Object.keys(event.touches));
      this.idxmap = {};
      this.tot = event.touches.length;
      this.event = event;
      this.deltas = {};
      var i=0;
      for (var k in event.touches) {
          this.idxmap[i++] = k;
          this.deltas[k] = 0.0;
      }
    }
     update(event) {
      if (this.valid(event)) {
          for (var k in event.touches) {
              var t2=event.touches[k];
              var t1=this.event.touches[k];
              var d=[t2[0]-t1[0], t2[1]-t1[1]];
              this.deltas[k] = d;
          }
      }
      this.event = event;
    }
     delta(i) {
      return this.deltas[this.idxmap[i]];
    }
     get(i) {
      return this.event.touches[this.idxmap[i]];
    }
     valid(event=this.event) {
      var keys=Object.keys(event.touches);
      if (keys.length!=this.pattern.length)
        return false;
      for (var i=0; i<keys.length; i++) {
          if (!pattern.has(keys[i]))
            return false;
      }
      return true;
    }
  }
  _ESClass.register(TouchManager);
  _es6_module.add_class(TouchManager);
}, '/dev/fairmotion/src/util/touchevents.js');
