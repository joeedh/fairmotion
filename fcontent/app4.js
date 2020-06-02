es6_module_define('math', ["./vectormath.js", "./util.js"], function _math_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, './util.js');
  var vectormath=es6_import(_es6_module, './vectormath.js');
  var Vector2=es6_import_item(_es6_module, './vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, './vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, './vectormath.js', 'Vector4');
  var Matrix4=es6_import_item(_es6_module, './vectormath.js', 'Matrix4');
  var Quat=es6_import_item(_es6_module, './vectormath.js', 'Quat');
  function aabb_overlap_area(pos1, size1, pos2, size2) {
    let r1=0.0, r2=0.0;
    for (let i=0; i<2; i++) {
        let a1=pos1[i], a2=pos2[i];
        let b1=pos1[i]+size1[i];
        let b2=pos2[i]+size2[i];
        if (b1>=a2&&a1<=b2) {
            let r=a2-b1;
            if (i) {
                r2 = r;
            }
            else {
              r1 = r;
            }
        }
    }
    return r1*r2;
  }
  aabb_overlap_area = _es6_module.add_export('aabb_overlap_area', aabb_overlap_area);
  function aabb_isect_2d(pos1, size1, pos2, size2) {
    var ret=0;
    for (var i=0; i<2; i++) {
        var a=pos1[i];
        var b=pos1[i]+size1[i];
        var c=pos2[i];
        var d=pos2[i]+size2[i];
        if (b>=c&&a<=d)
          ret+=1;
    }
    return ret==2;
  }
  aabb_isect_2d = _es6_module.add_export('aabb_isect_2d', aabb_isect_2d);
  
  let aabb_intersect_vs=util.cachering.fromConstructor(Vector2, 32);
  let aabb_intersect_rets=new util.cachering(() =>    {
    return {pos: new Vector2(), 
    size: new Vector2()}
  }, 512);
  function aabb_intersect_2d(pos1, size1, pos2, size2) {
    let v1=aabb_intersect_vs.next().load(pos1);
    let v2=aabb_intersect_vs.next().load(pos1).add(size1);
    let v3=aabb_intersect_vs.next().load(pos2);
    let v4=aabb_intersect_vs.next().load(pos2).add(size2);
    let min=aabb_intersect_vs.next().zero();
    let max=aabb_intersect_vs.next().zero();
    let tot=0;
    for (let i=0; i<2; i++) {
        if (v2[i]>=v3[i]&&v1[i]<=v4[i]) {
            tot++;
            min[i] = Math.max(v3[i], v1[i]);
            max[i] = Math.min(v2[i], v4[i]);
        }
    }
    if (tot!==2) {
        return undefined;
    }
    let ret=aabb_intersect_rets.next();
    ret.pos.load(min);
    ret.size.load(max).sub(min);
    return ret;
  }
  aabb_intersect_2d = _es6_module.add_export('aabb_intersect_2d', aabb_intersect_2d);
  window.test_aabb_intersect_2d = function () {
    let canvas=document.getElementById("test_canvas");
    if (!canvas) {
        canvas = document.createElement("canvas");
        canvas.setAttribute("id", "test_canvas");
        canvas.g = canvas.getContext("2d");
        document.body.appendChild(canvas);
    }
    canvas.width = ~~(window.innerWidth*devicePixelRatio);
    canvas.height = ~~(window.innerHeight*devicePixelRatio);
    canvas.style.width = (canvas.width/devicePixelRatio)+"px";
    canvas.style.height = (canvas.height/devicePixelRatio)+"px";
    canvas.style.position = "absolute";
    canvas.style["z-index"] = "1000";
    let g=canvas.g;
    g.clearRect(0, 0, canvas.width, canvas.height);
    let sz=800;
    let a1=new Vector2([Math.random()*sz, Math.random()*sz]).floor();
    let a2=new Vector2([Math.random()*sz, Math.random()*sz]).floor();
    let b1=new Vector2([Math.random()*sz, Math.random()*sz]).floor();
    let b2=new Vector2([Math.random()*sz, Math.random()*sz]).floor();
    let p1=new Vector2();
    let s1=new Vector2();
    let p2=new Vector2();
    let s2=new Vector2();
    p1.load(a1).min(a2);
    s1.load(a1).max(a2);
    p2.load(b1).min(b2);
    s2.load(b1).max(b2);
    s1.sub(p1);
    s2.sub(p1);
    console.log(p1, s1);
    console.log(p2, s2);
    g.beginPath();
    g.rect(0, 0, canvas.width, canvas.height);
    g.fillStyle = "white";
    g.fill();
    g.beginPath();
    g.rect(p1[0], p1[1], s1[0], s1[1]);
    g.fillStyle = "rgba(255, 100, 75, 1.0)";
    g.fill();
    g.beginPath();
    g.rect(p2[0], p2[1], s2[0], s2[1]);
    g.fillStyle = "rgba(75, 100, 255, 1.0)";
    g.fill();
    let ret=aabb_intersect_2d(p1, s1, p2, s2);
    if (ret) {
        g.beginPath();
        g.rect(ret.pos[0], ret.pos[1], ret.size[0], ret.size[1]);
        g.fillStyle = "rgba(0, 0, 0, 1.0)";
        g.fill();
    }
    return {end: test_aabb_intersect_2d.end, 
    timer: test_aabb_intersect_2d.timer}
  }
  test_aabb_intersect_2d.stop = function stop() {
    if (test_aabb_intersect_2d._timer) {
        console.log("stopping timer");
        window.clearInterval(test_aabb_intersect_2d._timer);
        test_aabb_intersect_2d._timer = undefined;
    }
  }
  test_aabb_intersect_2d.end = function end() {
    test_aabb_intersect_2d.stop();
    let canvas=document.getElementById("test_canvas");
    if (canvas) {
        canvas.remove();
    }
  }
  test_aabb_intersect_2d.timer = function timer(rate) {
    if (rate===undefined) {
        rate = 500;
    }
    if (test_aabb_intersect_2d._timer) {
        window.clearInterval(test_aabb_intersect_2d._timer);
        test_aabb_intersect_2d._timer = undefined;
        console.log("stopping timer");
        return ;
    }
    console.log("starting timer");
    test_aabb_intersect_2d._timer = window.setInterval(() =>      {
      test_aabb_intersect_2d();
    }, rate);
  }
  function aabb_union_2d(pos1, size1, pos2, size2) {
    let v1=aabb_intersect_vs.next();
    let v2=aabb_intersect_vs.next();
    let min=aabb_intersect_vs.next();
    let max=aabb_intersect_vs.next();
    v1.load(pos1).add(size1);
    v2.load(pos2).add(size2);
    min.load(v1).min(v2);
    max.load(v1).max(v2);
    max.sub(min);
    let ret=aabb_intersect_rets.next();
    ret.pos.load(min);
    ret.pos.load(max);
    return ret;
  }
  aabb_union_2d = _es6_module.add_export('aabb_union_2d', aabb_union_2d);
  function init_prototype(cls, proto) {
    for (var k in proto) {
        cls.prototype[k] = proto[k];
    }
    return cls.prototype;
  }
  function inherit(cls, parent, proto) {
    cls.prototype = Object.create(parent.prototype);
    for (var k in proto) {
        cls.prototype[k] = proto[k];
    }
    return cls.prototype;
  }
  var set=util.set;
  var $_mh, $_swapt;
  const feps=2.22e-16;
  _es6_module.add_export('feps', feps);
  const COLINEAR=1;
  _es6_module.add_export('COLINEAR', COLINEAR);
  const LINECROSS=2;
  _es6_module.add_export('LINECROSS', LINECROSS);
  const COLINEAR_ISECT=3;
  _es6_module.add_export('COLINEAR_ISECT', COLINEAR_ISECT);
  var _cross_vec1=new Vector3();
  var _cross_vec2=new Vector3();
  const SQRT2=Math.sqrt(2.0);
  _es6_module.add_export('SQRT2', SQRT2);
  const FEPS_DATA={F16: 1.11e-16, 
   F32: 5.96e-08, 
   F64: 0.000488}
  _es6_module.add_export('FEPS_DATA', FEPS_DATA);
  const FEPS=FEPS_DATA.F32;
  _es6_module.add_export('FEPS', FEPS);
  const FLOAT_MIN=-1e+21;
  _es6_module.add_export('FLOAT_MIN', FLOAT_MIN);
  const FLOAT_MAX=1e+22;
  _es6_module.add_export('FLOAT_MAX', FLOAT_MAX);
  const Matrix4UI=Matrix4;
  _es6_module.add_export('Matrix4UI', Matrix4UI);
  if (FLOAT_MIN!=FLOAT_MIN||FLOAT_MAX!=FLOAT_MAX) {
      FLOAT_MIN = 1e-05;
      FLOAT_MAX = 1000000.0;
      console.log("Floating-point 16-bit system detected!");
  }
  var _static_grp_points4=new Array(4);
  var _static_grp_points8=new Array(8);
  function get_rect_points(p, size) {
    var cs;
    if (p.length==2) {
        cs = _static_grp_points4;
        cs[0] = p;
        cs[1] = [p[0]+size[0], p[1]];
        cs[2] = [p[0]+size[0], p[1]+size[1]];
        cs[3] = [p[0], p[1]+size[1]];
    }
    else 
      if (p.length==3) {
        cs = _static_grp_points8;
        cs[0] = p;
        cs[1] = [p[0]+size[0], p[1], p[2]];
        cs[2] = [p[0]+size[0], p[1]+size[1], p[2]];
        cs[3] = [p[0], p[1]+size[0], p[2]];
        cs[4] = [p[0], p[1], p[2]+size[2]];
        cs[5] = [p[0]+size[0], p[1], p[2]+size[2]];
        cs[6] = [p[0]+size[0], p[1]+size[1], p[2]+size[2]];
        cs[7] = [p[0], p[1]+size[0], p[2]+size[2]];
    }
    else {
      throw "get_rect_points has no implementation for "+p.length+"-dimensional data";
    }
    return cs;
  }
  get_rect_points = _es6_module.add_export('get_rect_points', get_rect_points);
  
  function get_rect_lines(p, size) {
    var ps=get_rect_points(p, size);
    if (p.length==2) {
        return [[ps[0], ps[1]], [ps[1], ps[2]], [ps[2], ps[3]], [ps[3], ps[0]]];
    }
    else 
      if (p.length==3) {
        var l1=[[ps[0], ps[1]], [ps[1], ps[2]], [ps[2], ps[3]], [ps[3], ps[0]]];
        var l2=[[ps[4], ps[5]], [ps[5], ps[6]], [ps[6], ps[7]], [ps[7], ps[4]]];
        l1.concat(l2);
        l1.push([ps[0], ps[4]]);
        l1.push([ps[1], ps[5]]);
        l1.push([ps[2], ps[6]]);
        l1.push([ps[3], ps[7]]);
        return l1;
    }
    else {
      throw "get_rect_points has no implementation for "+p.length+"-dimensional data";
    }
  }
  get_rect_lines = _es6_module.add_export('get_rect_lines', get_rect_lines);
  
  var $vs_simple_tri_aabb_isect=[0, 0, 0];
  function simple_tri_aabb_isect(v1, v2, v3, min, max) {
    $vs_simple_tri_aabb_isect[0] = v1;
    $vs_simple_tri_aabb_isect[1] = v2;
    $vs_simple_tri_aabb_isect[2] = v3;
    for (var i=0; i<3; i++) {
        var isect=true;
        for (var j=0; j<3; j++) {
            if ($vs_simple_tri_aabb_isect[j][i]<min[i]||$vs_simple_tri_aabb_isect[j][i]>=max[i])
              isect = false;
        }
        if (isect)
          return true;
    }
    return false;
  }
  simple_tri_aabb_isect = _es6_module.add_export('simple_tri_aabb_isect', simple_tri_aabb_isect);
  
  class MinMax  {
     constructor(totaxis) {
      if (totaxis==undefined) {
          totaxis = 1;
      }
      this.totaxis = totaxis;
      if (totaxis!=1) {
          let cls;
          switch (totaxis) {
            case 2:
              cls = Vector2;
              break;
            case 3:
              cls = Vector3;
              break;
            case 4:
              cls = Vector4;
              break;
            default:
              cls = Array;
              break;
          }
          this._min = new cls(totaxis);
          this._max = new cls(totaxis);
          this.min = new cls(totaxis);
          this.max = new cls(totaxis);
      }
      else {
        this.min = this.max = 0;
        this._min = FLOAT_MAX;
        this._max = FLOAT_MIN;
      }
      this.reset();
      this._static_mr_co = new Array(this.totaxis);
      this._static_mr_cs = new Array(this.totaxis*this.totaxis);
    }
     load(mm) {
      if (this.totaxis==1) {
          this.min = mm.min;
          this.max = mm.max;
          this._min = mm.min;
          this._max = mm.max;
      }
      else {
        this.min = new Vector3(mm.min);
        this.max = new Vector3(mm.max);
        this._min = new Vector3(mm._min);
        this._max = new Vector3(mm._max);
      }
    }
     reset() {
      var totaxis=this.totaxis;
      if (totaxis==1) {
          this.min = this.max = 0;
          this._min = FLOAT_MAX;
          this._max = FLOAT_MIN;
      }
      else {
        for (var i=0; i<totaxis; i++) {
            this._min[i] = FLOAT_MAX;
            this._max[i] = FLOAT_MIN;
            this.min[i] = 0;
            this.max[i] = 0;
        }
      }
    }
     minmax_rect(p, size) {
      var totaxis=this.totaxis;
      var cs=this._static_mr_cs;
      if (totaxis==2) {
          cs[0] = p;
          cs[1] = [p[0]+size[0], p[1]];
          cs[2] = [p[0]+size[0], p[1]+size[1]];
          cs[3] = [p[0], p[1]+size[1]];
      }
      else 
        if (totaxis = 3) {
          cs[0] = p;
          cs[1] = [p[0]+size[0], p[1], p[2]];
          cs[2] = [p[0]+size[0], p[1]+size[1], p[2]];
          cs[3] = [p[0], p[1]+size[0], p[2]];
          cs[4] = [p[0], p[1], p[2]+size[2]];
          cs[5] = [p[0]+size[0], p[1], p[2]+size[2]];
          cs[6] = [p[0]+size[0], p[1]+size[1], p[2]+size[2]];
          cs[7] = [p[0], p[1]+size[0], p[2]+size[2]];
      }
      else {
        throw "Minmax.minmax_rect has no implementation for "+totaxis+"-dimensional data";
      }
      for (var i=0; i<cs.length; i++) {
          this.minmax(cs[i]);
      }
    }
     minmax(p) {
      var totaxis=this.totaxis;
      if (totaxis==1) {
          this._min = this.min = Math.min(this._min, p);
          this._max = this.max = Math.max(this._max, p);
      }
      else 
        if (totaxis==2) {
          this._min[0] = this.min[0] = Math.min(this._min[0], p[0]);
          this._min[1] = this.min[1] = Math.min(this._min[1], p[1]);
          this._max[0] = this.max[0] = Math.max(this._max[0], p[0]);
          this._max[1] = this.max[1] = Math.max(this._max[1], p[1]);
      }
      else 
        if (totaxis==3) {
          this._min[0] = this.min[0] = Math.min(this._min[0], p[0]);
          this._min[1] = this.min[1] = Math.min(this._min[1], p[1]);
          this._min[2] = this.min[2] = Math.min(this._min[2], p[2]);
          this._max[0] = this.max[0] = Math.max(this._max[0], p[0]);
          this._max[1] = this.max[1] = Math.max(this._max[1], p[1]);
          this._max[2] = this.max[2] = Math.max(this._max[2], p[2]);
      }
      else {
        for (var i=0; i<totaxis; i++) {
            this._min[i] = this.min[i] = Math.min(this._min[i], p[i]);
            this._max[i] = this.max[i] = Math.max(this._max[i], p[i]);
        }
      }
    }
    static  fromSTRUCT(reader) {
      var ret=new MinMax();
      reader(ret);
      return ret;
    }
  }
  _ESClass.register(MinMax);
  _es6_module.add_class(MinMax);
  MinMax = _es6_module.add_export('MinMax', MinMax);
  
  MinMax.STRUCT = "\n  math.MinMax {\n    min     : vec3;\n    max     : vec3;\n    _min    : vec3;\n    _max    : vec3;\n    totaxis : int;\n  }\n";
  function winding(a, b, c, zero_z, tol) {
    if (tol==undefined)
      tol = 0.0;
    for (var i=0; i<a.length; i++) {
        _cross_vec1[i] = b[i]-a[i];
        _cross_vec2[i] = c[i]-a[i];
    }
    if (a.length==2||zero_z) {
        _cross_vec1[2] = 0.0;
        _cross_vec2[2] = 0.0;
    }
    _cross_vec1.cross(_cross_vec2);
    return _cross_vec1[2]>tol;
  }
  winding = _es6_module.add_export('winding', winding);
  
  function inrect_2d(p, pos, size) {
    if (p==undefined||pos==undefined||size==undefined) {
        console.trace();
        console.log("Bad paramters to inrect_2d()");
        console.log("p: ", p, ", pos: ", pos, ", size: ", size);
        return false;
    }
    return p[0]>=pos[0]&&p[0]<=pos[0]+size[0]&&p[1]>=pos[1]&&p[1]<=pos[1]+size[1];
  }
  inrect_2d = _es6_module.add_export('inrect_2d', inrect_2d);
  
  var $smin_aabb_isect_line_2d=new Vector2();
  var $ssize_aabb_isect_line_2d=new Vector2();
  var $sv1_aabb_isect_line_2d=new Vector2();
  var $ps_aabb_isect_line_2d=[new Vector2(), new Vector2(), new Vector2()];
  var $l1_aabb_isect_line_2d=[0, 0];
  var $smax_aabb_isect_line_2d=new Vector2();
  var $sv2_aabb_isect_line_2d=new Vector2();
  var $l2_aabb_isect_line_2d=[0, 0];
  function aabb_isect_line_2d(v1, v2, min, max) {
    for (var i=0; i<2; i++) {
        $smin_aabb_isect_line_2d[i] = Math.min(min[i], v1[i]);
        $smax_aabb_isect_line_2d[i] = Math.max(max[i], v2[i]);
    }
    $smax_aabb_isect_line_2d.sub($smin_aabb_isect_line_2d);
    $ssize_aabb_isect_line_2d.load(max).sub(min);
    if (!aabb_isect_2d($smin_aabb_isect_line_2d, $smax_aabb_isect_line_2d, min, $ssize_aabb_isect_line_2d))
      return false;
    for (var i=0; i<4; i++) {
        if (inrect_2d(v1, min, $ssize_aabb_isect_line_2d))
          return true;
        if (inrect_2d(v2, min, $ssize_aabb_isect_line_2d))
          return true;
    }
    $ps_aabb_isect_line_2d[0] = min;
    $ps_aabb_isect_line_2d[1][0] = min[0];
    $ps_aabb_isect_line_2d[1][1] = max[1];
    $ps_aabb_isect_line_2d[2] = max;
    $ps_aabb_isect_line_2d[3][0] = max[0];
    $ps_aabb_isect_line_2d[3][1] = min[1];
    $l1_aabb_isect_line_2d[0] = v1;
    $l1_aabb_isect_line_2d[1] = v2;
    for (var i=0; i<4; i++) {
        var a=$ps_aabb_isect_line_2d[i], b=$ps_aabb_isect_line_2d[(i+1)%4];
        $l2_aabb_isect_line_2d[0] = a;
        $l2_aabb_isect_line_2d[1] = b;
        if (line_line_cross($l1_aabb_isect_line_2d, $l2_aabb_isect_line_2d))
          return true;
    }
    return false;
  }
  aabb_isect_line_2d = _es6_module.add_export('aabb_isect_line_2d', aabb_isect_line_2d);
  
  function expand_rect2d(pos, size, margin) {
    pos[0]-=Math.floor(margin[0]);
    pos[1]-=Math.floor(margin[1]);
    size[0]+=Math.floor(margin[0]*2.0);
    size[1]+=Math.floor(margin[1]*2.0);
  }
  expand_rect2d = _es6_module.add_export('expand_rect2d', expand_rect2d);
  
  function expand_line(l, margin) {
    var c=new Vector3();
    c.add(l[0]);
    c.add(l[1]);
    c.mulScalar(0.5);
    l[0].sub(c);
    l[1].sub(c);
    var l1=l[0].vectorLength();
    var l2=l[1].vectorLength();
    l[0].normalize();
    l[1].normalize();
    l[0].mulScalar(margin+l1);
    l[1].mulScalar(margin+l2);
    l[0].add(c);
    l[1].add(c);
    return l;
  }
  expand_line = _es6_module.add_export('expand_line', expand_line);
  
  function colinear(a, b, c) {
    for (var i=0; i<3; i++) {
        _cross_vec1[i] = b[i]-a[i];
        _cross_vec2[i] = c[i]-a[i];
    }
    var limit=2.2e-16;
    if (a.vectorDistance(b)<feps*100&&a.vectorDistance(c)<feps*100) {
        return true;
    }
    if (_cross_vec1.dot(_cross_vec1)<limit||_cross_vec2.dot(_cross_vec2)<limit)
      return true;
    _cross_vec1.cross(_cross_vec2);
    return _cross_vec1.dot(_cross_vec1)<limit;
  }
  colinear = _es6_module.add_export('colinear', colinear);
  
  var _llc_l1=[new Vector3(), new Vector3()];
  var _llc_l2=[new Vector3(), new Vector3()];
  var _llc_l3=[new Vector3(), new Vector3()];
  var _llc_l4=[new Vector3(), new Vector3()];
  var lli_v1=new Vector3(), lli_v2=new Vector3(), lli_v3=new Vector3(), lli_v4=new Vector3();
  var _zero_cn=new Vector3();
  var _tmps_cn=util.cachering.fromConstructor(Vector3, 64);
  var _rets_cn=util.cachering.fromConstructor(Vector3, 64);
  function corner_normal(vec1, vec2, width) {
    var ret=_rets_cn.next().zero();
    var vec=_tmps_cn.next().zero();
    vec.load(vec1).add(vec2).normalize();
    if (Math.abs(vec1.normalizedDot(vec2))>0.9999) {
        if (vec1.dot(vec2)>0.0001) {
            ret.load(vec1).add(vec2).normalize();
        }
        else {
          ret.load(vec1).normalize();
        }
        ret.mulScalar(width);
        return ret;
    }
    else {
    }
    vec1 = _tmps_cn.next().load(vec1).mulScalar(width);
    vec2 = _tmps_cn.next().load(vec2).mulScalar(width);
    var p1=_tmps_cn.next().load(vec1);
    var p2=_tmps_cn.next().load(vec2);
    vec1.addFac(vec1, 0.01);
    vec2.addFac(vec2, 0.01);
    var sc=1.0;
    p1[0]+=vec1[1]*sc;
    p1[1]+=-vec1[0]*sc;
    p2[0]+=-vec2[1]*sc;
    p2[1]+=vec2[0]*sc;
    var p=line_line_isect(vec1, p1, vec2, p2, false);
    if (p==undefined||p===COLINEAR_ISECT||p.dot(p)<1e-06) {
        ret.load(vec1).add(vec2).normalize().mulScalar(width);
    }
    else {
      ret.load(p);
      if (vec.dot(vec)>0&&vec.dot(ret)<0) {
          ret.load(vec).mulScalar(width);
      }
    }
    return ret;
  }
  corner_normal = _es6_module.add_export('corner_normal', corner_normal);
  function line_line_isect(v1, v2, v3, v4, test_segment) {
    test_segment = test_segment===undefined ? true : test_segment;
    if (!line_line_cross(v1, v2, v3, v4)) {
        return undefined;
    }
    var xa1=v1[0], xa2=v2[0], ya1=v1[1], ya2=v2[1];
    var xb1=v3[0], xb2=v4[0], yb1=v3[1], yb2=v4[1];
    var div=((xa1-xa2)*(yb1-yb2)-(xb1-xb2)*(ya1-ya2));
    if (div<1e-08) {
        return COLINEAR_ISECT;
    }
    else {
      var t1=(-((ya1-yb2)*xb1-(yb1-yb2)*xa1-(ya1-yb1)*xb2))/div;
      return lli_v1.load(v1).interp(v2, t1);
    }
  }
  line_line_isect = _es6_module.add_export('line_line_isect', line_line_isect);
  function line_line_cross(v1, v2, v3, v4) {
    var l1=_llc_l3, l2=_llc_l4;
    l1[0].load(v1), l1[1].load(v2), l2[0].load(v3), l2[1].load(v4);
    var a=l1[0];
    var b=l1[1];
    var c=l2[0];
    var d=l2[1];
    var w1=winding(a, b, c);
    var w2=winding(c, a, d);
    var w3=winding(a, b, d);
    var w4=winding(c, b, d);
    return (w1==w2)&&(w3==w4)&&(w1!=w3);
  }
  line_line_cross = _es6_module.add_export('line_line_cross', line_line_cross);
  
  var _asi_v1=new Vector3();
  var _asi_v2=new Vector3();
  var _asi_v3=new Vector3();
  var _asi_v4=new Vector3();
  var _asi_v5=new Vector3();
  var _asi_v6=new Vector3();
  function point_in_aabb_2d(p, min, max) {
    return p[0]>=min[0]&&p[0]<=max[0]&&p[1]>=min[1]&&p[1]<=max[1];
  }
  point_in_aabb_2d = _es6_module.add_export('point_in_aabb_2d', point_in_aabb_2d);
  var _asi2d_v1=new Vector2();
  var _asi2d_v2=new Vector2();
  var _asi2d_v3=new Vector2();
  var _asi2d_v4=new Vector2();
  var _asi2d_v5=new Vector2();
  var _asi2d_v6=new Vector2();
  function aabb_sphere_isect_2d(p, r, min, max) {
    var v1=_asi2d_v1, v2=_asi2d_v2, v3=_asi2d_v3, mvec=_asi2d_v4;
    var v4=_asi2d_v5;
    p = _asi2d_v6.load(p);
    v1.load(p);
    v2.load(p);
    min = _asi_v5.load(min);
    max = _asi_v6.load(max);
    mvec.load(max).sub(min).normalize().mulScalar(r+0.0001);
    v1.sub(mvec);
    v2.add(mvec);
    v3.load(p);
    var ret=point_in_aabb_2d(v1, min, max)||point_in_aabb_2d(v2, min, max)||point_in_aabb_2d(v3, min, max);
    if (ret)
      return ret;
    v1.load(min);
    v2[0] = min[0];
    v2[1] = max[1];
    ret = ret||dist_to_line_2d(p, v1, v2)<r;
    v1.load(max);
    v2[0] = max[0];
    v2[1] = max[1];
    ret = ret||dist_to_line_2d(p, v1, v2)<r;
    v1.load(max);
    v2[0] = max[0];
    v2[1] = min[1];
    ret = ret||dist_to_line_2d(p, v1, v2)<r;
    v1.load(max);
    v2[0] = min[0];
    v2[1] = min[1];
    ret = ret||dist_to_line_2d(p, v1, v2)<r;
    return ret;
  }
  aabb_sphere_isect_2d = _es6_module.add_export('aabb_sphere_isect_2d', aabb_sphere_isect_2d);
  
  function point_in_aabb(p, min, max) {
    return p[0]>=min[0]&&p[0]<=max[0]&&p[1]>=min[1]&&p[1]<=max[1]&&p[2]>=min[2]&&p[2]<=max[2];
  }
  point_in_aabb = _es6_module.add_export('point_in_aabb', point_in_aabb);
  function aabb_sphere_isect(p, r, min, max) {
    var v1=_asi_v1, v2=_asi_v2, v3=_asi_v3, mvec=_asi_v4;
    min = _asi_v5.load(min);
    max = _asi_v6.load(max);
    if (min.length==2) {
        min[2] = max[2] = 0.0;
    }
    mvec.load(max).sub(min).normalize().mulScalar(r+0.0001);
    v1.sub(mvec);
    v2.add(mvec);
    v3.load(p);
    if (p.length==2) {
        mvec[2] = v1[2] = v2[2] = v3[2] = 0.0;
    }
    return point_in_aabb(v1, min, max)||point_in_aabb(v2, min, max)||point_in_aabb(v3, min, max);
  }
  aabb_sphere_isect = _es6_module.add_export('aabb_sphere_isect', aabb_sphere_isect);
  
  function point_in_tri(p, v1, v2, v3) {
    var w1=winding(p, v1, v2);
    var w2=winding(p, v2, v3);
    var w3=winding(p, v3, v1);
    return w1==w2&&w2==w3;
  }
  point_in_tri = _es6_module.add_export('point_in_tri', point_in_tri);
  
  function convex_quad(v1, v2, v3, v4) {
    return line_line_cross([v1, v3], [v2, v4]);
  }
  convex_quad = _es6_module.add_export('convex_quad', convex_quad);
  
  var $e1_normal_tri=new Vector3();
  var $e3_normal_tri=new Vector3();
  var $e2_normal_tri=new Vector3();
  function normal_tri(v1, v2, v3) {
    $e1_normal_tri[0] = v2[0]-v1[0];
    $e1_normal_tri[1] = v2[1]-v1[1];
    $e1_normal_tri[2] = v2[2]-v1[2];
    $e2_normal_tri[0] = v3[0]-v1[0];
    $e2_normal_tri[1] = v3[1]-v1[1];
    $e2_normal_tri[2] = v3[2]-v1[2];
    $e3_normal_tri[0] = $e1_normal_tri[1]*$e2_normal_tri[2]-$e1_normal_tri[2]*$e2_normal_tri[1];
    $e3_normal_tri[1] = $e1_normal_tri[2]*$e2_normal_tri[0]-$e1_normal_tri[0]*$e2_normal_tri[2];
    $e3_normal_tri[2] = $e1_normal_tri[0]*$e2_normal_tri[1]-$e1_normal_tri[1]*$e2_normal_tri[0];
    var _len=Math.sqrt($e3_normal_tri[0]*$e3_normal_tri[0]+$e3_normal_tri[1]*$e3_normal_tri[1]+$e3_normal_tri[2]*$e3_normal_tri[2]);
    if (_len>1e-05)
      _len = 1.0/_len;
    $e3_normal_tri[0]*=_len;
    $e3_normal_tri[1]*=_len;
    $e3_normal_tri[2]*=_len;
    return $e3_normal_tri;
  }
  normal_tri = _es6_module.add_export('normal_tri', normal_tri);
  
  var $n2_normal_quad=new Vector3();
  function normal_quad(v1, v2, v3, v4) {
    var n=normal_tri(v1, v2, v3);
    $n2_normal_quad[0] = n[0];
    $n2_normal_quad[1] = n[1];
    $n2_normal_quad[2] = n[2];
    n = normal_tri(v1, v3, v4);
    $n2_normal_quad[0] = $n2_normal_quad[0]+n[0];
    $n2_normal_quad[1] = $n2_normal_quad[1]+n[1];
    $n2_normal_quad[2] = $n2_normal_quad[2]+n[2];
    var _len=Math.sqrt($n2_normal_quad[0]*$n2_normal_quad[0]+$n2_normal_quad[1]*$n2_normal_quad[1]+$n2_normal_quad[2]*$n2_normal_quad[2]);
    if (_len>1e-05)
      _len = 1.0/_len;
    $n2_normal_quad[0]*=_len;
    $n2_normal_quad[1]*=_len;
    $n2_normal_quad[2]*=_len;
    return $n2_normal_quad;
  }
  normal_quad = _es6_module.add_export('normal_quad', normal_quad);
  
  var _li_vi=new Vector3();
  function line_isect(v1, v2, v3, v4, calc_t) {
    if (calc_t==undefined) {
        calc_t = false;
    }
    var div=(v2[0]-v1[0])*(v4[1]-v3[1])-(v2[1]-v1[1])*(v4[0]-v3[0]);
    if (div==0.0)
      return [new Vector3(), COLINEAR, 0.0];
    var vi=_li_vi;
    vi[0] = 0;
    vi[1] = 0;
    vi[2] = 0;
    vi[0] = ((v3[0]-v4[0])*(v1[0]*v2[1]-v1[1]*v2[0])-(v1[0]-v2[0])*(v3[0]*v4[1]-v3[1]*v4[0]))/div;
    vi[1] = ((v3[1]-v4[1])*(v1[0]*v2[1]-v1[1]*v2[0])-(v1[1]-v2[1])*(v3[0]*v4[1]-v3[1]*v4[0]))/div;
    if (calc_t||v1.length==3) {
        var n1=new Vector2(v2).sub(v1);
        var n2=new Vector2(vi).sub(v1);
        var t=n2.vectorLength()/n1.vectorLength();
        n1.normalize();
        n2.normalize();
        if (n1.dot(n2)<0.0) {
            t = -t;
        }
        if (v1.length==3) {
            vi[2] = v1[2]+(v2[2]-v1[2])*t;
        }
        return [vi, LINECROSS, t];
    }
    return [vi, LINECROSS];
  }
  line_isect = _es6_module.add_export('line_isect', line_isect);
  
  var dt2l_v1=new Vector2();
  var dt2l_v2=new Vector2();
  var dt2l_v3=new Vector2();
  var dt2l_v4=new Vector2();
  var dt2l_v5=new Vector2();
  function dist_to_line_2d(p, v1, v2, clip, closest_co_out, t_out) {
    if (closest_co_out===undefined) {
        closest_co_out = undefined;
    }
    if (t_out===undefined) {
        t_out = undefined;
    }
    if (clip==undefined) {
        clip = true;
    }
    v1 = dt2l_v4.load(v1);
    v2 = dt2l_v5.load(v2);
    var n=dt2l_v1;
    var vec=dt2l_v3;
    n.load(v2).sub(v1).normalize();
    vec.load(p).sub(v1);
    var t=vec.dot(n);
    if (clip) {
        t = Math.min(Math.max(t, 0.0), v1.vectorDistance(v2));
    }
    n.mulScalar(t).add(v1);
    if (closest_co_out) {
        closest_co_out[0] = n[0];
        closest_co_out[1] = n[1];
    }
    if (t_out!==undefined) {
        t_out = t;
    }
    return n.vectorDistance(p);
  }
  dist_to_line_2d = _es6_module.add_export('dist_to_line_2d', dist_to_line_2d);
  var dt3l_v1=new Vector3();
  var dt3l_v2=new Vector3();
  var dt3l_v3=new Vector3();
  var dt3l_v4=new Vector3();
  var dt3l_v5=new Vector3();
  function dist_to_line(p, v1, v2, clip) {
    if (clip==undefined) {
        clip = true;
    }
    v1 = dt3l_v4.load(v1);
    v2 = dt3l_v5.load(v2);
    var n=dt3l_v1;
    var vec=dt3l_v3;
    n.load(v2).sub(v1).normalize();
    vec.load(p).sub(v1);
    var t=vec.dot(n);
    if (clip) {
        t = Math.min(Math.max(t, 0.0), v1.vectorDistance(v2));
    }
    n.mulScalar(t).add(v1);
    return n.vectorDistance(p);
  }
  dist_to_line = _es6_module.add_export('dist_to_line', dist_to_line);
  var _cplw_vs4=util.cachering.fromConstructor(Vector4, 64);
  var _cplw_vs3=util.cachering.fromConstructor(Vector3, 64);
  var _cplw_vs2=util.cachering.fromConstructor(Vector2, 64);
  function wclip(x1, x2, w1, w2, near) {
    var r1=near*w1-x1;
    var r2=(w1-w2)*near-(x1-x2);
    if (r2==0.0)
      return 0.0;
    return r1/r2;
  }
  function clip(a, b, znear) {
    if (a-b==0.0)
      return 0.0;
    return (a-znear)/(a-b);
  }
  function clip_line_w(_v1, _v2, znear, zfar) {
    var v1=_cplw_vs4.next().load(_v1);
    var v2=_cplw_vs4.next().load(_v2);
    if ((v1[2]<1.0&&v2[2]<1.0))
      return false;
    function doclip1(v1, v2, axis) {
      if (v1[axis]/v1[3]<-1) {
          var t=wclip(v1[axis], v2[axis], v1[3], v2[3], -1);
          v1.interp(v2, t);
      }
      else 
        if (v1[axis]/v1[3]>1) {
          var t=wclip(v1[axis], v2[axis], v1[3], v2[3], 1);
          v1.interp(v2, t);
      }
    }
    function doclip(v1, v2, axis) {
      doclip1(v1, v2, axis);
      doclip1(v2, v1, axis);
    }
    function dozclip(v1, v2) {
      if (v1[2]<1) {
          var t=clip(v1[2], v2[2], 1);
          v1.interp(v2, t);
      }
      else 
        if (v2[2]<1) {
          var t=clip(v2[2], v1[2], 1);
          v2.interp(v1, t);
      }
    }
    dozclip(v1, v2, 1);
    doclip(v1, v2, 0);
    doclip(v1, v2, 1);
    for (var i=0; i<4; i++) {
        _v1[i] = v1[i];
        _v2[i] = v2[i];
    }
    return !(v1[0]/v1[3]==v2[0]/v2[3]||v1[1]/v2[3]==v2[1]/v2[3]);
  }
  clip_line_w = _es6_module.add_export('clip_line_w', clip_line_w);
  
  var _closest_point_on_line_cache=util.cachering.fromConstructor(Vector3, 64);
  var _closest_point_rets=new util.cachering(function () {
    return [0, 0];
  }, 64);
  var _closest_tmps=[new Vector3(), new Vector3(), new Vector3()];
  function closest_point_on_line(p, v1, v2, clip) {
    if (clip==undefined)
      clip = true;
    var l1=_closest_tmps[0], l2=_closest_tmps[1];
    l1.load(v2).sub(v1).normalize();
    l2.load(p).sub(v1);
    var t=l2.dot(l1);
    if (clip) {
        t = t*(t<0.0)+t*(t>1.0)+(t>1.0);
    }
    var p=_closest_point_on_line_cache.next();
    p.load(l1).mulScalar(t).add(v1);
    var ret=_closest_point_rets.next();
    ret[0] = p;
    ret[1] = t;
    return ret;
  }
  closest_point_on_line = _es6_module.add_export('closest_point_on_line', closest_point_on_line);
  
  var _circ_from_line_tan_vs=util.cachering.fromConstructor(Vector3, 32);
  var _circ_from_line_tan_ret=new util.cachering(function () {
    return [new Vector3(), 0];
  });
  function circ_from_line_tan(a, b, t) {
    var p1=_circ_from_line_tan_vs.next();
    var t2=_circ_from_line_tan_vs.next();
    var n1=_circ_from_line_tan_vs.next();
    p1.load(a).sub(b);
    t2.load(t).normalize();
    n1.load(p1).normalize().cross(t2).cross(t2).normalize();
    var ax=p1[0], ay=p1[1], az=p1[2], nx=n1[0], ny=n1[1], nz=n1[2];
    var r=-(ax*ax+ay*ay+az*az)/(2*(ax*nx+ay*ny+az*nz));
    var ret=_circ_from_line_tan_ret.next();
    ret[0].load(n1).mulScalar(r).add(a);
    ret[1] = r;
    return ret;
  }
  circ_from_line_tan = _es6_module.add_export('circ_from_line_tan', circ_from_line_tan);
  var _gtc_e1=new Vector3();
  var _gtc_e2=new Vector3();
  var _gtc_e3=new Vector3();
  var _gtc_p1=new Vector3();
  var _gtc_p2=new Vector3();
  var _gtc_v1=new Vector3();
  var _gtc_v2=new Vector3();
  var _gtc_p12=new Vector3();
  var _gtc_p22=new Vector3();
  var _get_tri_circ_ret=new util.cachering(function () {
    return [0, 0];
  });
  function get_tri_circ(a, b, c) {
    var v1=_gtc_v1;
    var v2=_gtc_v2;
    var e1=_gtc_e1;
    var e2=_gtc_e2;
    var e3=_gtc_e3;
    var p1=_gtc_p1;
    var p2=_gtc_p2;
    for (var i=0; i<3; i++) {
        e1[i] = b[i]-a[i];
        e2[i] = c[i]-b[i];
        e3[i] = a[i]-c[i];
    }
    for (var i=0; i<3; i++) {
        p1[i] = (a[i]+b[i])*0.5;
        p2[i] = (c[i]+b[i])*0.5;
    }
    e1.normalize();
    v1[0] = -e1[1];
    v1[1] = e1[0];
    v1[2] = e1[2];
    v2[0] = -e2[1];
    v2[1] = e2[0];
    v2[2] = e2[2];
    v1.normalize();
    v2.normalize();
    var cent;
    var type;
    for (var i=0; i<3; i++) {
        _gtc_p12[i] = p1[i]+v1[i];
        _gtc_p22[i] = p2[i]+v2[i];
    }
    var ret=line_isect(p1, _gtc_p12, p2, _gtc_p22);
    cent = ret[0];
    type = ret[1];
    e1.load(a);
    e2.load(b);
    e3.load(c);
    var r=e1.sub(cent).vectorLength();
    if (r<feps)
      r = e2.sub(cent).vectorLength();
    if (r<feps)
      r = e3.sub(cent).vectorLength();
    var ret=_get_tri_circ_ret.next();
    ret[0] = cent;
    ret[1] = r;
    return ret;
  }
  get_tri_circ = _es6_module.add_export('get_tri_circ', get_tri_circ);
  
  function gen_circle(m, origin, r, stfeps) {
    var pi=Math.PI;
    var f=-pi/2;
    var df=(pi*2)/stfeps;
    var verts=new Array();
    for (var i=0; i<stfeps; i++) {
        var x=origin[0]+r*Math.sin(f);
        var y=origin[1]+r*Math.cos(f);
        var v=m.make_vert(new Vector3([x, y, origin[2]]));
        verts.push(v);
        f+=df;
    }
    for (var i=0; i<verts.length; i++) {
        var v1=verts[i];
        var v2=verts[(i+1)%verts.length];
        m.make_edge(v1, v2);
    }
    return verts;
  }
  gen_circle = _es6_module.add_export('gen_circle', gen_circle);
  
  var cos=Math.cos;
  var sin=Math.sin;
  function rot2d(v1, A, axis) {
    var x=v1[0];
    var y=v1[1];
    if (axis==1) {
        v1[0] = x*cos(A)+y*sin(A);
        v1[2] = y*cos(A)-x*sin(A);
    }
    else {
      v1[0] = x*cos(A)-y*sin(A);
      v1[1] = y*cos(A)+x*sin(A);
    }
  }
  rot2d = _es6_module.add_export('rot2d', rot2d);
  function makeCircleMesh(gl, radius, stfeps) {
    var mesh=new Mesh();
    var verts1=gen_circle(mesh, new Vector3(), radius, stfeps);
    var verts2=gen_circle(mesh, new Vector3(), radius/1.75, stfeps);
    mesh.make_face_complex([verts1, verts2]);
    return mesh;
  }
  makeCircleMesh = _es6_module.add_export('makeCircleMesh', makeCircleMesh);
  
  function minmax_verts(verts) {
    var min=new Vector3([1000000000000.0, 1000000000000.0, 1000000000000.0]);
    var max=new Vector3([-1000000000000.0, -1000000000000.0, -1000000000000.0]);
    var __iter_v=__get_iter(verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      for (var i=0; i<3; i++) {
          min[i] = Math.min(min[i], v.co[i]);
          max[i] = Math.max(max[i], v.co[i]);
      }
    }
    return [min, max];
  }
  minmax_verts = _es6_module.add_export('minmax_verts', minmax_verts);
  
  function unproject(vec, ipers, iview) {
    var newvec=new Vector3(vec);
    newvec.multVecMatrix(ipers);
    newvec.multVecMatrix(iview);
    return newvec;
  }
  unproject = _es6_module.add_export('unproject', unproject);
  
  function project(vec, pers, view) {
    var newvec=new Vector3(vec);
    newvec.multVecMatrix(pers);
    newvec.multVecMatrix(view);
    return newvec;
  }
  project = _es6_module.add_export('project', project);
  
  var _sh_minv=new Vector3();
  var _sh_maxv=new Vector3();
  var _sh_start=[];
  var _sh_end=[];
  var static_cent_gbw=new Vector3();
  function get_boundary_winding(points) {
    var cent=static_cent_gbw.zero();
    if (points.length==0)
      return false;
    for (var i=0; i<points.length; i++) {
        cent.add(points[i]);
    }
    cent.divideScalar(points.length);
    var w=0, totw=0;
    for (var i=0; i<points.length; i++) {
        var v1=points[i];
        var v2=points[(i+1)%points.length];
        if (!colinear(v1, v2, cent)) {
            w+=winding(v1, v2, cent);
            totw+=1;
        }
    }
    if (totw>0)
      w/=totw;
    return Math.round(w)==1;
  }
  get_boundary_winding = _es6_module.add_export('get_boundary_winding', get_boundary_winding);
  
  class PlaneOps  {
     constructor(normal) {
      var no=normal;
      this.axis = [0, 0, 0];
      this.reset_axis(normal);
    }
     reset_axis(no) {
      var ax, ay, az;
      var nx=Math.abs(no[0]), ny=Math.abs(no[1]), nz=Math.abs(no[2]);
      if (nz>nx&&nz>ny) {
          ax = 0;
          ay = 1;
          az = 2;
      }
      else 
        if (nx>ny&&nx>nz) {
          ax = 2;
          ay = 1;
          az = 0;
      }
      else {
        ax = 0;
        ay = 2;
        az = 1;
      }
      this.axis = [ax, ay, az];
    }
     convex_quad(v1, v2, v3, v4) {
      var ax=this.axis;
      v1 = new Vector3([v1[ax[0]], v1[ax[1]], v1[ax[2]]]);
      v2 = new Vector3([v2[ax[0]], v2[ax[1]], v2[ax[2]]]);
      v3 = new Vector3([v3[ax[0]], v3[ax[1]], v3[ax[2]]]);
      v4 = new Vector3([v4[ax[0]], v4[ax[1]], v4[ax[2]]]);
      return convex_quad(v1, v2, v3, v4);
    }
     line_isect(v1, v2, v3, v4) {
      var ax=this.axis;
      var orig1=v1, orig2=v2;
      v1 = new Vector3([v1[ax[0]], v1[ax[1]], v1[ax[2]]]);
      v2 = new Vector3([v2[ax[0]], v2[ax[1]], v2[ax[2]]]);
      v3 = new Vector3([v3[ax[0]], v3[ax[1]], v3[ax[2]]]);
      v4 = new Vector3([v4[ax[0]], v4[ax[1]], v4[ax[2]]]);
      var ret=line_isect(v1, v2, v3, v4, true);
      var vi=ret[0];
      if (ret[1]==LINECROSS) {
          ret[0].load(orig2).sub(orig1).mulScalar(ret[2]).add(orig1);
      }
      return ret;
    }
     line_line_cross(l1, l2) {
      var ax=this.axis;
      var v1=l1[0], v2=l1[1], v3=l2[0], v4=l2[1];
      v1 = new Vector3([v1[ax[0]], v1[ax[1]], 0.0]);
      v2 = new Vector3([v2[ax[0]], v2[ax[1]], 0.0]);
      v3 = new Vector3([v3[ax[0]], v3[ax[1]], 0.0]);
      v4 = new Vector3([v4[ax[0]], v4[ax[1]], 0.0]);
      return line_line_cross([v1, v2], [v3, v4]);
    }
     winding(v1, v2, v3) {
      var ax=this.axis;
      if (v1==undefined)
        console.trace();
      v1 = new Vector3([v1[ax[0]], v1[ax[1]], 0.0]);
      v2 = new Vector3([v2[ax[0]], v2[ax[1]], 0.0]);
      v3 = new Vector3([v3[ax[0]], v3[ax[1]], 0.0]);
      return winding(v1, v2, v3);
    }
     colinear(v1, v2, v3) {
      var ax=this.axis;
      v1 = new Vector3([v1[ax[0]], v1[ax[1]], 0.0]);
      v2 = new Vector3([v2[ax[0]], v2[ax[1]], 0.0]);
      v3 = new Vector3([v3[ax[0]], v3[ax[1]], 0.0]);
      return colinear(v1, v2, v3);
    }
     get_boundary_winding(points) {
      var ax=this.axis;
      var cent=new Vector3();
      if (points.length==0)
        return false;
      for (var i=0; i<points.length; i++) {
          cent.add(points[i]);
      }
      cent.divideScalar(points.length);
      var w=0, totw=0;
      for (var i=0; i<points.length; i++) {
          var v1=points[i];
          var v2=points[(i+1)%points.length];
          if (!this.colinear(v1, v2, cent)) {
              w+=this.winding(v1, v2, cent);
              totw+=1;
          }
      }
      if (totw>0)
        w/=totw;
      return Math.round(w)==1;
    }
  }
  _ESClass.register(PlaneOps);
  _es6_module.add_class(PlaneOps);
  PlaneOps = _es6_module.add_export('PlaneOps', PlaneOps);
  var _isrp_ret=new Vector3();
  function isect_ray_plane(planeorigin, planenormal, rayorigin, raynormal) {
    let po=planeorigin, pn=planenormal, ro=rayorigin, rn=raynormal;
    let div=(pn[1]*rn[1]+pn[2]*rn[2]+pn[0]*rn[0]);
    if (Math.abs(div)<1e-06) {
        return undefined;
    }
    let t=((po[1]-ro[1])*pn[1]+(po[2]-ro[2])*pn[2]+(po[0]-ro[0])*pn[0])/div;
    _isrp_ret.load(ro).addFac(rn, t);
    return _isrp_ret;
  }
  isect_ray_plane = _es6_module.add_export('isect_ray_plane', isect_ray_plane);
  function _old_isect_ray_plane(planeorigin, planenormal, rayorigin, raynormal) {
    var p=planeorigin, n=planenormal;
    var r=rayorigin, v=raynormal;
    var d=p.vectorLength();
    var t=-(r.dot(n)-p.dot(n))/v.dot(n);
    _isrp_ret.load(v);
    _isrp_ret.mulScalar(t);
    _isrp_ret.add(r);
    return _isrp_ret;
  }
  _old_isect_ray_plane = _es6_module.add_export('_old_isect_ray_plane', _old_isect_ray_plane);
  
  function mesh_find_tangent(mesh, viewvec, offvec, projmat, verts) {
    if (verts==undefined)
      verts = mesh.verts.selected;
    var vset=new set();
    var eset=new set();
    var __iter_v=__get_iter(verts);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      vset.add(v);
    }
    var __iter_v=__get_iter(vset);
    var v;
    while (1) {
      var __ival_v=__iter_v.next();
      if (__ival_v.done) {
          break;
      }
      v = __ival_v.value;
      var __iter_e=__get_iter(v.edges);
      var e;
      while (1) {
        var __ival_e=__iter_e.next();
        if (__ival_e.done) {
            break;
        }
        e = __ival_e.value;
        if (vset.has(e.other_vert(v))) {
            eset.add(e);
        }
      }
    }
    if (eset.length==0) {
        return new Vector3(offvec);
    }
    var tanav=new Vector3();
    var evec=new Vector3();
    var tan=new Vector3();
    var co2=new Vector3();
    var __iter_e=__get_iter(eset);
    var e;
    while (1) {
      var __ival_e=__iter_e.next();
      if (__ival_e.done) {
          break;
      }
      e = __ival_e.value;
      evec.load(e.v1.co).multVecMatrix(projmat);
      co2.load(e.v2.co).multVecMatrix(projmat);
      evec.sub(co2);
      evec.normalize();
      tan[0] = evec[1];
      tan[1] = -evec[0];
      tan[2] = 0.0;
      if (tan.dot(offvec)<0.0)
        tan.mulScalar(-1.0);
      tanav.add(tan);
    }
    tanav.normalize();
    return tanav;
  }
  mesh_find_tangent = _es6_module.add_export('mesh_find_tangent', mesh_find_tangent);
  
  class Mat4Stack  {
     constructor() {
      this.stack = [];
      this.matrix = new Matrix4();
      this.matrix.makeIdentity();
      this.update_func = undefined;
    }
     set_internal_matrix(mat, update_func) {
      this.update_func = update_func;
      this.matrix = mat;
    }
     reset(mat) {
      this.matrix.load(mat);
      this.stack = [];
      if (this.update_func!=undefined)
        this.update_func();
    }
     load(mat) {
      this.matrix.load(mat);
      if (this.update_func!=undefined)
        this.update_func();
    }
     multiply(mat) {
      this.matrix.multiply(mat);
      if (this.update_func!=undefined)
        this.update_func();
    }
     identity() {
      this.matrix.loadIdentity();
      if (this.update_func!=undefined)
        this.update_func();
    }
     push(mat2) {
      this.stack.push(new Matrix4(this.matrix));
      if (mat2!=undefined) {
          this.matrix.load(mat2);
          if (this.update_func!=undefined)
            this.update_func();
      }
    }
     pop() {
      var mat=this.stack.pop(this.stack.length-1);
      this.matrix.load(mat);
      if (this.update_func!=undefined)
        this.update_func();
      return mat;
    }
  }
  _ESClass.register(Mat4Stack);
  _es6_module.add_class(Mat4Stack);
  Mat4Stack = _es6_module.add_export('Mat4Stack', Mat4Stack);
}, '/dev/fairmotion/src/path.ux/scripts/util/math.js');
es6_module_define('mobile-detect', [], function _mobile_detect_module(_es6_module) {
  (function (define, undefined) {
    define(function () {
      'use strict';
      var impl={}
      impl.mobileDetectRules = {"phones": {"iPhone": "\\biPhone\\b|\\biPod\\b", 
      "BlackBerry": "BlackBerry|\\bBB10\\b|rim[0-9]+|\\b(BBA100|BBB100|BBD100|BBE100|BBF100|STH100)\\b-[0-9]+", 
      "HTC": "HTC|HTC.*(Sensation|Evo|Vision|Explorer|6800|8100|8900|A7272|S510e|C110e|Legend|Desire|T8282)|APX515CKT|Qtek9090|APA9292KT|HD_mini|Sensation.*Z710e|PG86100|Z715e|Desire.*(A8181|HD)|ADR6200|ADR6400L|ADR6425|001HT|Inspire 4G|Android.*\\bEVO\\b|T-Mobile G1|Z520m|Android [0-9.]+; Pixel", 
      "Nexus": "Nexus One|Nexus S|Galaxy.*Nexus|Android.*Nexus.*Mobile|Nexus 4|Nexus 5|Nexus 6", 
      "Dell": "Dell[;]? (Streak|Aero|Venue|Venue Pro|Flash|Smoke|Mini 3iX)|XCD28|XCD35|\\b001DL\\b|\\b101DL\\b|\\bGS01\\b", 
      "Motorola": "Motorola|DROIDX|DROID BIONIC|\\bDroid\\b.*Build|Android.*Xoom|HRI39|MOT-|A1260|A1680|A555|A853|A855|A953|A955|A956|Motorola.*ELECTRIFY|Motorola.*i1|i867|i940|MB200|MB300|MB501|MB502|MB508|MB511|MB520|MB525|MB526|MB611|MB612|MB632|MB810|MB855|MB860|MB861|MB865|MB870|ME501|ME502|ME511|ME525|ME600|ME632|ME722|ME811|ME860|ME863|ME865|MT620|MT710|MT716|MT720|MT810|MT870|MT917|Motorola.*TITANIUM|WX435|WX445|XT300|XT301|XT311|XT316|XT317|XT319|XT320|XT390|XT502|XT530|XT531|XT532|XT535|XT603|XT610|XT611|XT615|XT681|XT701|XT702|XT711|XT720|XT800|XT806|XT860|XT862|XT875|XT882|XT883|XT894|XT901|XT907|XT909|XT910|XT912|XT928|XT926|XT915|XT919|XT925|XT1021|\\bMoto E\\b|XT1068|XT1092|XT1052", 
      "Samsung": "\\bSamsung\\b|SM-G950F|SM-G955F|SM-G9250|GT-19300|SGH-I337|BGT-S5230|GT-B2100|GT-B2700|GT-B2710|GT-B3210|GT-B3310|GT-B3410|GT-B3730|GT-B3740|GT-B5510|GT-B5512|GT-B5722|GT-B6520|GT-B7300|GT-B7320|GT-B7330|GT-B7350|GT-B7510|GT-B7722|GT-B7800|GT-C3010|GT-C3011|GT-C3060|GT-C3200|GT-C3212|GT-C3212I|GT-C3262|GT-C3222|GT-C3300|GT-C3300K|GT-C3303|GT-C3303K|GT-C3310|GT-C3322|GT-C3330|GT-C3350|GT-C3500|GT-C3510|GT-C3530|GT-C3630|GT-C3780|GT-C5010|GT-C5212|GT-C6620|GT-C6625|GT-C6712|GT-E1050|GT-E1070|GT-E1075|GT-E1080|GT-E1081|GT-E1085|GT-E1087|GT-E1100|GT-E1107|GT-E1110|GT-E1120|GT-E1125|GT-E1130|GT-E1160|GT-E1170|GT-E1175|GT-E1180|GT-E1182|GT-E1200|GT-E1210|GT-E1225|GT-E1230|GT-E1390|GT-E2100|GT-E2120|GT-E2121|GT-E2152|GT-E2220|GT-E2222|GT-E2230|GT-E2232|GT-E2250|GT-E2370|GT-E2550|GT-E2652|GT-E3210|GT-E3213|GT-I5500|GT-I5503|GT-I5700|GT-I5800|GT-I5801|GT-I6410|GT-I6420|GT-I7110|GT-I7410|GT-I7500|GT-I8000|GT-I8150|GT-I8160|GT-I8190|GT-I8320|GT-I8330|GT-I8350|GT-I8530|GT-I8700|GT-I8703|GT-I8910|GT-I9000|GT-I9001|GT-I9003|GT-I9010|GT-I9020|GT-I9023|GT-I9070|GT-I9082|GT-I9100|GT-I9103|GT-I9220|GT-I9250|GT-I9300|GT-I9305|GT-I9500|GT-I9505|GT-M3510|GT-M5650|GT-M7500|GT-M7600|GT-M7603|GT-M8800|GT-M8910|GT-N7000|GT-S3110|GT-S3310|GT-S3350|GT-S3353|GT-S3370|GT-S3650|GT-S3653|GT-S3770|GT-S3850|GT-S5210|GT-S5220|GT-S5229|GT-S5230|GT-S5233|GT-S5250|GT-S5253|GT-S5260|GT-S5263|GT-S5270|GT-S5300|GT-S5330|GT-S5350|GT-S5360|GT-S5363|GT-S5369|GT-S5380|GT-S5380D|GT-S5560|GT-S5570|GT-S5600|GT-S5603|GT-S5610|GT-S5620|GT-S5660|GT-S5670|GT-S5690|GT-S5750|GT-S5780|GT-S5830|GT-S5839|GT-S6102|GT-S6500|GT-S7070|GT-S7200|GT-S7220|GT-S7230|GT-S7233|GT-S7250|GT-S7500|GT-S7530|GT-S7550|GT-S7562|GT-S7710|GT-S8000|GT-S8003|GT-S8500|GT-S8530|GT-S8600|SCH-A310|SCH-A530|SCH-A570|SCH-A610|SCH-A630|SCH-A650|SCH-A790|SCH-A795|SCH-A850|SCH-A870|SCH-A890|SCH-A930|SCH-A950|SCH-A970|SCH-A990|SCH-I100|SCH-I110|SCH-I400|SCH-I405|SCH-I500|SCH-I510|SCH-I515|SCH-I600|SCH-I730|SCH-I760|SCH-I770|SCH-I830|SCH-I910|SCH-I920|SCH-I959|SCH-LC11|SCH-N150|SCH-N300|SCH-R100|SCH-R300|SCH-R351|SCH-R400|SCH-R410|SCH-T300|SCH-U310|SCH-U320|SCH-U350|SCH-U360|SCH-U365|SCH-U370|SCH-U380|SCH-U410|SCH-U430|SCH-U450|SCH-U460|SCH-U470|SCH-U490|SCH-U540|SCH-U550|SCH-U620|SCH-U640|SCH-U650|SCH-U660|SCH-U700|SCH-U740|SCH-U750|SCH-U810|SCH-U820|SCH-U900|SCH-U940|SCH-U960|SCS-26UC|SGH-A107|SGH-A117|SGH-A127|SGH-A137|SGH-A157|SGH-A167|SGH-A177|SGH-A187|SGH-A197|SGH-A227|SGH-A237|SGH-A257|SGH-A437|SGH-A517|SGH-A597|SGH-A637|SGH-A657|SGH-A667|SGH-A687|SGH-A697|SGH-A707|SGH-A717|SGH-A727|SGH-A737|SGH-A747|SGH-A767|SGH-A777|SGH-A797|SGH-A817|SGH-A827|SGH-A837|SGH-A847|SGH-A867|SGH-A877|SGH-A887|SGH-A897|SGH-A927|SGH-B100|SGH-B130|SGH-B200|SGH-B220|SGH-C100|SGH-C110|SGH-C120|SGH-C130|SGH-C140|SGH-C160|SGH-C170|SGH-C180|SGH-C200|SGH-C207|SGH-C210|SGH-C225|SGH-C230|SGH-C417|SGH-C450|SGH-D307|SGH-D347|SGH-D357|SGH-D407|SGH-D415|SGH-D780|SGH-D807|SGH-D980|SGH-E105|SGH-E200|SGH-E315|SGH-E316|SGH-E317|SGH-E335|SGH-E590|SGH-E635|SGH-E715|SGH-E890|SGH-F300|SGH-F480|SGH-I200|SGH-I300|SGH-I320|SGH-I550|SGH-I577|SGH-I600|SGH-I607|SGH-I617|SGH-I627|SGH-I637|SGH-I677|SGH-I700|SGH-I717|SGH-I727|SGH-i747M|SGH-I777|SGH-I780|SGH-I827|SGH-I847|SGH-I857|SGH-I896|SGH-I897|SGH-I900|SGH-I907|SGH-I917|SGH-I927|SGH-I937|SGH-I997|SGH-J150|SGH-J200|SGH-L170|SGH-L700|SGH-M110|SGH-M150|SGH-M200|SGH-N105|SGH-N500|SGH-N600|SGH-N620|SGH-N625|SGH-N700|SGH-N710|SGH-P107|SGH-P207|SGH-P300|SGH-P310|SGH-P520|SGH-P735|SGH-P777|SGH-Q105|SGH-R210|SGH-R220|SGH-R225|SGH-S105|SGH-S307|SGH-T109|SGH-T119|SGH-T139|SGH-T209|SGH-T219|SGH-T229|SGH-T239|SGH-T249|SGH-T259|SGH-T309|SGH-T319|SGH-T329|SGH-T339|SGH-T349|SGH-T359|SGH-T369|SGH-T379|SGH-T409|SGH-T429|SGH-T439|SGH-T459|SGH-T469|SGH-T479|SGH-T499|SGH-T509|SGH-T519|SGH-T539|SGH-T559|SGH-T589|SGH-T609|SGH-T619|SGH-T629|SGH-T639|SGH-T659|SGH-T669|SGH-T679|SGH-T709|SGH-T719|SGH-T729|SGH-T739|SGH-T746|SGH-T749|SGH-T759|SGH-T769|SGH-T809|SGH-T819|SGH-T839|SGH-T919|SGH-T929|SGH-T939|SGH-T959|SGH-T989|SGH-U100|SGH-U200|SGH-U800|SGH-V205|SGH-V206|SGH-X100|SGH-X105|SGH-X120|SGH-X140|SGH-X426|SGH-X427|SGH-X475|SGH-X495|SGH-X497|SGH-X507|SGH-X600|SGH-X610|SGH-X620|SGH-X630|SGH-X700|SGH-X820|SGH-X890|SGH-Z130|SGH-Z150|SGH-Z170|SGH-ZX10|SGH-ZX20|SHW-M110|SPH-A120|SPH-A400|SPH-A420|SPH-A460|SPH-A500|SPH-A560|SPH-A600|SPH-A620|SPH-A660|SPH-A700|SPH-A740|SPH-A760|SPH-A790|SPH-A800|SPH-A820|SPH-A840|SPH-A880|SPH-A900|SPH-A940|SPH-A960|SPH-D600|SPH-D700|SPH-D710|SPH-D720|SPH-I300|SPH-I325|SPH-I330|SPH-I350|SPH-I500|SPH-I600|SPH-I700|SPH-L700|SPH-M100|SPH-M220|SPH-M240|SPH-M300|SPH-M305|SPH-M320|SPH-M330|SPH-M350|SPH-M360|SPH-M370|SPH-M380|SPH-M510|SPH-M540|SPH-M550|SPH-M560|SPH-M570|SPH-M580|SPH-M610|SPH-M620|SPH-M630|SPH-M800|SPH-M810|SPH-M850|SPH-M900|SPH-M910|SPH-M920|SPH-M930|SPH-N100|SPH-N200|SPH-N240|SPH-N300|SPH-N400|SPH-Z400|SWC-E100|SCH-i909|GT-N7100|GT-N7105|SCH-I535|SM-N900A|SGH-I317|SGH-T999L|GT-S5360B|GT-I8262|GT-S6802|GT-S6312|GT-S6310|GT-S5312|GT-S5310|GT-I9105|GT-I8510|GT-S6790N|SM-G7105|SM-N9005|GT-S5301|GT-I9295|GT-I9195|SM-C101|GT-S7392|GT-S7560|GT-B7610|GT-I5510|GT-S7582|GT-S7530E|GT-I8750|SM-G9006V|SM-G9008V|SM-G9009D|SM-G900A|SM-G900D|SM-G900F|SM-G900H|SM-G900I|SM-G900J|SM-G900K|SM-G900L|SM-G900M|SM-G900P|SM-G900R4|SM-G900S|SM-G900T|SM-G900V|SM-G900W8|SHV-E160K|SCH-P709|SCH-P729|SM-T2558|GT-I9205|SM-G9350|SM-J120F|SM-G920F|SM-G920V|SM-G930F|SM-N910C|SM-A310F|GT-I9190|SM-J500FN|SM-G903F|SM-J330F", 
      "LG": "\\bLG\\b;|LG[- ]?(C800|C900|E400|E610|E900|E-900|F160|F180K|F180L|F180S|730|855|L160|LS740|LS840|LS970|LU6200|MS690|MS695|MS770|MS840|MS870|MS910|P500|P700|P705|VM696|AS680|AS695|AX840|C729|E970|GS505|272|C395|E739BK|E960|L55C|L75C|LS696|LS860|P769BK|P350|P500|P509|P870|UN272|US730|VS840|VS950|LN272|LN510|LS670|LS855|LW690|MN270|MN510|P509|P769|P930|UN200|UN270|UN510|UN610|US670|US740|US760|UX265|UX840|VN271|VN530|VS660|VS700|VS740|VS750|VS910|VS920|VS930|VX9200|VX11000|AX840A|LW770|P506|P925|P999|E612|D955|D802|MS323|M257)|LM-G710", 
      "Sony": "SonyST|SonyLT|SonyEricsson|SonyEricssonLT15iv|LT18i|E10i|LT28h|LT26w|SonyEricssonMT27i|C5303|C6902|C6903|C6906|C6943|D2533", 
      "Asus": "Asus.*Galaxy|PadFone.*Mobile", 
      "NokiaLumia": "Lumia [0-9]{3,4}", 
      "Micromax": "Micromax.*\\b(A210|A92|A88|A72|A111|A110Q|A115|A116|A110|A90S|A26|A51|A35|A54|A25|A27|A89|A68|A65|A57|A90)\\b", 
      "Palm": "PalmSource|Palm", 
      "Vertu": "Vertu|Vertu.*Ltd|Vertu.*Ascent|Vertu.*Ayxta|Vertu.*Constellation(F|Quest)?|Vertu.*Monika|Vertu.*Signature", 
      "Pantech": "PANTECH|IM-A850S|IM-A840S|IM-A830L|IM-A830K|IM-A830S|IM-A820L|IM-A810K|IM-A810S|IM-A800S|IM-T100K|IM-A725L|IM-A780L|IM-A775C|IM-A770K|IM-A760S|IM-A750K|IM-A740S|IM-A730S|IM-A720L|IM-A710K|IM-A690L|IM-A690S|IM-A650S|IM-A630K|IM-A600S|VEGA PTL21|PT003|P8010|ADR910L|P6030|P6020|P9070|P4100|P9060|P5000|CDM8992|TXT8045|ADR8995|IS11PT|P2030|P6010|P8000|PT002|IS06|CDM8999|P9050|PT001|TXT8040|P2020|P9020|P2000|P7040|P7000|C790", 
      "Fly": "IQ230|IQ444|IQ450|IQ440|IQ442|IQ441|IQ245|IQ256|IQ236|IQ255|IQ235|IQ245|IQ275|IQ240|IQ285|IQ280|IQ270|IQ260|IQ250", 
      "Wiko": "KITE 4G|HIGHWAY|GETAWAY|STAIRWAY|DARKSIDE|DARKFULL|DARKNIGHT|DARKMOON|SLIDE|WAX 4G|RAINBOW|BLOOM|SUNSET|GOA(?!nna)|LENNY|BARRY|IGGY|OZZY|CINK FIVE|CINK PEAX|CINK PEAX 2|CINK SLIM|CINK SLIM 2|CINK +|CINK KING|CINK PEAX|CINK SLIM|SUBLIM", 
      "iMobile": "i-mobile (IQ|i-STYLE|idea|ZAA|Hitz)", 
      "SimValley": "\\b(SP-80|XT-930|SX-340|XT-930|SX-310|SP-360|SP60|SPT-800|SP-120|SPT-800|SP-140|SPX-5|SPX-8|SP-100|SPX-8|SPX-12)\\b", 
      "Wolfgang": "AT-B24D|AT-AS50HD|AT-AS40W|AT-AS55HD|AT-AS45q2|AT-B26D|AT-AS50Q", 
      "Alcatel": "Alcatel", 
      "Nintendo": "Nintendo (3DS|Switch)", 
      "Amoi": "Amoi", 
      "INQ": "INQ", 
      "OnePlus": "ONEPLUS", 
      "GenericPhone": "Tapatalk|PDA;|SAGEM|\\bmmp\\b|pocket|\\bpsp\\b|symbian|Smartphone|smartfon|treo|up.browser|up.link|vodafone|\\bwap\\b|nokia|Series40|Series60|S60|SonyEricsson|N900|MAUI.*WAP.*Browser"}, 
     "tablets": {"iPad": "iPad|iPad.*Mobile", 
      "NexusTablet": "Android.*Nexus[\\s]+(7|9|10)", 
      "GoogleTablet": "Android.*Pixel C", 
      "SamsungTablet": "SAMSUNG.*Tablet|Galaxy.*Tab|SC-01C|GT-P1000|GT-P1003|GT-P1010|GT-P3105|GT-P6210|GT-P6800|GT-P6810|GT-P7100|GT-P7300|GT-P7310|GT-P7500|GT-P7510|SCH-I800|SCH-I815|SCH-I905|SGH-I957|SGH-I987|SGH-T849|SGH-T859|SGH-T869|SPH-P100|GT-P3100|GT-P3108|GT-P3110|GT-P5100|GT-P5110|GT-P6200|GT-P7320|GT-P7511|GT-N8000|GT-P8510|SGH-I497|SPH-P500|SGH-T779|SCH-I705|SCH-I915|GT-N8013|GT-P3113|GT-P5113|GT-P8110|GT-N8010|GT-N8005|GT-N8020|GT-P1013|GT-P6201|GT-P7501|GT-N5100|GT-N5105|GT-N5110|SHV-E140K|SHV-E140L|SHV-E140S|SHV-E150S|SHV-E230K|SHV-E230L|SHV-E230S|SHW-M180K|SHW-M180L|SHW-M180S|SHW-M180W|SHW-M300W|SHW-M305W|SHW-M380K|SHW-M380S|SHW-M380W|SHW-M430W|SHW-M480K|SHW-M480S|SHW-M480W|SHW-M485W|SHW-M486W|SHW-M500W|GT-I9228|SCH-P739|SCH-I925|GT-I9200|GT-P5200|GT-P5210|GT-P5210X|SM-T311|SM-T310|SM-T310X|SM-T210|SM-T210R|SM-T211|SM-P600|SM-P601|SM-P605|SM-P900|SM-P901|SM-T217|SM-T217A|SM-T217S|SM-P6000|SM-T3100|SGH-I467|XE500|SM-T110|GT-P5220|GT-I9200X|GT-N5110X|GT-N5120|SM-P905|SM-T111|SM-T2105|SM-T315|SM-T320|SM-T320X|SM-T321|SM-T520|SM-T525|SM-T530NU|SM-T230NU|SM-T330NU|SM-T900|XE500T1C|SM-P605V|SM-P905V|SM-T337V|SM-T537V|SM-T707V|SM-T807V|SM-P600X|SM-P900X|SM-T210X|SM-T230|SM-T230X|SM-T325|GT-P7503|SM-T531|SM-T330|SM-T530|SM-T705|SM-T705C|SM-T535|SM-T331|SM-T800|SM-T700|SM-T537|SM-T807|SM-P907A|SM-T337A|SM-T537A|SM-T707A|SM-T807A|SM-T237|SM-T807P|SM-P607T|SM-T217T|SM-T337T|SM-T807T|SM-T116NQ|SM-T116BU|SM-P550|SM-T350|SM-T550|SM-T9000|SM-P9000|SM-T705Y|SM-T805|GT-P3113|SM-T710|SM-T810|SM-T815|SM-T360|SM-T533|SM-T113|SM-T335|SM-T715|SM-T560|SM-T670|SM-T677|SM-T377|SM-T567|SM-T357T|SM-T555|SM-T561|SM-T713|SM-T719|SM-T813|SM-T819|SM-T580|SM-T355Y?|SM-T280|SM-T817A|SM-T820|SM-W700|SM-P580|SM-T587|SM-P350|SM-P555M|SM-P355M|SM-T113NU|SM-T815Y|SM-T585|SM-T285|SM-T825|SM-W708|SM-T835|SM-T830|SM-T837V|SM-T720|SM-T510|SM-T387V", 
      "Kindle": "Kindle|Silk.*Accelerated|Android.*\\b(KFOT|KFTT|KFJWI|KFJWA|KFOTE|KFSOWI|KFTHWI|KFTHWA|KFAPWI|KFAPWA|WFJWAE|KFSAWA|KFSAWI|KFASWI|KFARWI|KFFOWI|KFGIWI|KFMEWI)\\b|Android.*Silk\/[0-9.]+ like Chrome\/[0-9.]+ (?!Mobile)", 
      "SurfaceTablet": "Windows NT [0-9.]+; ARM;.*(Tablet|ARMBJS)", 
      "HPTablet": "HP Slate (7|8|10)|HP ElitePad 900|hp-tablet|EliteBook.*Touch|HP 8|Slate 21|HP SlateBook 10", 
      "AsusTablet": "^.*PadFone((?!Mobile).)*$|Transformer|TF101|TF101G|TF300T|TF300TG|TF300TL|TF700T|TF700KL|TF701T|TF810C|ME171|ME301T|ME302C|ME371MG|ME370T|ME372MG|ME172V|ME173X|ME400C|Slider SL101|\\bK00F\\b|\\bK00C\\b|\\bK00E\\b|\\bK00L\\b|TX201LA|ME176C|ME102A|\\bM80TA\\b|ME372CL|ME560CG|ME372CG|ME302KL| K010 | K011 | K017 | K01E |ME572C|ME103K|ME170C|ME171C|\\bME70C\\b|ME581C|ME581CL|ME8510C|ME181C|P01Y|PO1MA|P01Z|\\bP027\\b|\\bP024\\b|\\bP00C\\b", 
      "BlackBerryTablet": "PlayBook|RIM Tablet", 
      "HTCtablet": "HTC_Flyer_P512|HTC Flyer|HTC Jetstream|HTC-P715a|HTC EVO View 4G|PG41200|PG09410", 
      "MotorolaTablet": "xoom|sholest|MZ615|MZ605|MZ505|MZ601|MZ602|MZ603|MZ604|MZ606|MZ607|MZ608|MZ609|MZ615|MZ616|MZ617", 
      "NookTablet": "Android.*Nook|NookColor|nook browser|BNRV200|BNRV200A|BNTV250|BNTV250A|BNTV400|BNTV600|LogicPD Zoom2", 
      "AcerTablet": "Android.*; \\b(A100|A101|A110|A200|A210|A211|A500|A501|A510|A511|A700|A701|W500|W500P|W501|W501P|W510|W511|W700|G100|G100W|B1-A71|B1-710|B1-711|A1-810|A1-811|A1-830)\\b|W3-810|\\bA3-A10\\b|\\bA3-A11\\b|\\bA3-A20\\b|\\bA3-A30", 
      "ToshibaTablet": "Android.*(AT100|AT105|AT200|AT205|AT270|AT275|AT300|AT305|AT1S5|AT500|AT570|AT700|AT830)|TOSHIBA.*FOLIO", 
      "LGTablet": "\\bL-06C|LG-V909|LG-V900|LG-V700|LG-V510|LG-V500|LG-V410|LG-V400|LG-VK810\\b", 
      "FujitsuTablet": "Android.*\\b(F-01D|F-02F|F-05E|F-10D|M532|Q572)\\b", 
      "PrestigioTablet": "PMP3170B|PMP3270B|PMP3470B|PMP7170B|PMP3370B|PMP3570C|PMP5870C|PMP3670B|PMP5570C|PMP5770D|PMP3970B|PMP3870C|PMP5580C|PMP5880D|PMP5780D|PMP5588C|PMP7280C|PMP7280C3G|PMP7280|PMP7880D|PMP5597D|PMP5597|PMP7100D|PER3464|PER3274|PER3574|PER3884|PER5274|PER5474|PMP5097CPRO|PMP5097|PMP7380D|PMP5297C|PMP5297C_QUAD|PMP812E|PMP812E3G|PMP812F|PMP810E|PMP880TD|PMT3017|PMT3037|PMT3047|PMT3057|PMT7008|PMT5887|PMT5001|PMT5002", 
      "LenovoTablet": "Lenovo TAB|Idea(Tab|Pad)( A1|A10| K1|)|ThinkPad([ ]+)?Tablet|YT3-850M|YT3-X90L|YT3-X90F|YT3-X90X|Lenovo.*(S2109|S2110|S5000|S6000|K3011|A3000|A3500|A1000|A2107|A2109|A1107|A5500|A7600|B6000|B8000|B8080)(-|)(FL|F|HV|H|)|TB-X103F|TB-X304X|TB-X304F|TB-X304L|TB-X505F|TB-X505L|TB-X505X|TB-X605F|TB-X605L|TB-8703F|TB-8703X|TB-8703N|TB-8704N|TB-8704F|TB-8704X|TB-8704V|TB-7304F|TB-7304I|TB-7304X|Tab2A7-10F|Tab2A7-20F|TB2-X30L|YT3-X50L|YT3-X50F|YT3-X50M|YT-X705F|YT-X703F|YT-X703L|YT-X705L|YT-X705X|TB2-X30F|TB2-X30L|TB2-X30M|A2107A-F|A2107A-H|TB3-730F|TB3-730M|TB3-730X|TB-7504F|TB-7504X", 
      "DellTablet": "Venue 11|Venue 8|Venue 7|Dell Streak 10|Dell Streak 7", 
      "YarvikTablet": "Android.*\\b(TAB210|TAB211|TAB224|TAB250|TAB260|TAB264|TAB310|TAB360|TAB364|TAB410|TAB411|TAB420|TAB424|TAB450|TAB460|TAB461|TAB464|TAB465|TAB467|TAB468|TAB07-100|TAB07-101|TAB07-150|TAB07-151|TAB07-152|TAB07-200|TAB07-201-3G|TAB07-210|TAB07-211|TAB07-212|TAB07-214|TAB07-220|TAB07-400|TAB07-485|TAB08-150|TAB08-200|TAB08-201-3G|TAB08-201-30|TAB09-100|TAB09-211|TAB09-410|TAB10-150|TAB10-201|TAB10-211|TAB10-400|TAB10-410|TAB13-201|TAB274EUK|TAB275EUK|TAB374EUK|TAB462EUK|TAB474EUK|TAB9-200)\\b", 
      "MedionTablet": "Android.*\\bOYO\\b|LIFE.*(P9212|P9514|P9516|S9512)|LIFETAB", 
      "ArnovaTablet": "97G4|AN10G2|AN7bG3|AN7fG3|AN8G3|AN8cG3|AN7G3|AN9G3|AN7dG3|AN7dG3ST|AN7dG3ChildPad|AN10bG3|AN10bG3DT|AN9G2", 
      "IntensoTablet": "INM8002KP|INM1010FP|INM805ND|Intenso Tab|TAB1004", 
      "IRUTablet": "M702pro", 
      "MegafonTablet": "MegaFon V9|\\bZTE V9\\b|Android.*\\bMT7A\\b", 
      "EbodaTablet": "E-Boda (Supreme|Impresspeed|Izzycomm|Essential)", 
      "AllViewTablet": "Allview.*(Viva|Alldro|City|Speed|All TV|Frenzy|Quasar|Shine|TX1|AX1|AX2)", 
      "ArchosTablet": "\\b(101G9|80G9|A101IT)\\b|Qilive 97R|Archos5|\\bARCHOS (70|79|80|90|97|101|FAMILYPAD|)(b|c|)(G10| Cobalt| TITANIUM(HD|)| Xenon| Neon|XSK| 2| XS 2| PLATINUM| CARBON|GAMEPAD)\\b", 
      "AinolTablet": "NOVO7|NOVO8|NOVO10|Novo7Aurora|Novo7Basic|NOVO7PALADIN|novo9-Spark", 
      "NokiaLumiaTablet": "Lumia 2520", 
      "SonyTablet": "Sony.*Tablet|Xperia Tablet|Sony Tablet S|SO-03E|SGPT12|SGPT13|SGPT114|SGPT121|SGPT122|SGPT123|SGPT111|SGPT112|SGPT113|SGPT131|SGPT132|SGPT133|SGPT211|SGPT212|SGPT213|SGP311|SGP312|SGP321|EBRD1101|EBRD1102|EBRD1201|SGP351|SGP341|SGP511|SGP512|SGP521|SGP541|SGP551|SGP621|SGP641|SGP612|SOT31|SGP771|SGP611|SGP612|SGP712", 
      "PhilipsTablet": "\\b(PI2010|PI3000|PI3100|PI3105|PI3110|PI3205|PI3210|PI3900|PI4010|PI7000|PI7100)\\b", 
      "CubeTablet": "Android.*(K8GT|U9GT|U10GT|U16GT|U17GT|U18GT|U19GT|U20GT|U23GT|U30GT)|CUBE U8GT", 
      "CobyTablet": "MID1042|MID1045|MID1125|MID1126|MID7012|MID7014|MID7015|MID7034|MID7035|MID7036|MID7042|MID7048|MID7127|MID8042|MID8048|MID8127|MID9042|MID9740|MID9742|MID7022|MID7010", 
      "MIDTablet": "M9701|M9000|M9100|M806|M1052|M806|T703|MID701|MID713|MID710|MID727|MID760|MID830|MID728|MID933|MID125|MID810|MID732|MID120|MID930|MID800|MID731|MID900|MID100|MID820|MID735|MID980|MID130|MID833|MID737|MID960|MID135|MID860|MID736|MID140|MID930|MID835|MID733|MID4X10", 
      "MSITablet": "MSI \\b(Primo 73K|Primo 73L|Primo 81L|Primo 77|Primo 93|Primo 75|Primo 76|Primo 73|Primo 81|Primo 91|Primo 90|Enjoy 71|Enjoy 7|Enjoy 10)\\b", 
      "SMiTTablet": "Android.*(\\bMID\\b|MID-560|MTV-T1200|MTV-PND531|MTV-P1101|MTV-PND530)", 
      "RockChipTablet": "Android.*(RK2818|RK2808A|RK2918|RK3066)|RK2738|RK2808A", 
      "FlyTablet": "IQ310|Fly Vision", 
      "bqTablet": "Android.*(bq)?.*\\b(Elcano|Curie|Edison|Maxwell|Kepler|Pascal|Tesla|Hypatia|Platon|Newton|Livingstone|Cervantes|Avant|Aquaris ([E|M]10|M8))\\b|Maxwell.*Lite|Maxwell.*Plus", 
      "HuaweiTablet": "MediaPad|MediaPad 7 Youth|IDEOS S7|S7-201c|S7-202u|S7-101|S7-103|S7-104|S7-105|S7-106|S7-201|S7-Slim|M2-A01L|BAH-L09|BAH-W09|AGS-L09|CMR-AL19", 
      "NecTablet": "\\bN-06D|\\bN-08D", 
      "PantechTablet": "Pantech.*P4100", 
      "BronchoTablet": "Broncho.*(N701|N708|N802|a710)", 
      "VersusTablet": "TOUCHPAD.*[78910]|\\bTOUCHTAB\\b", 
      "ZyncTablet": "z1000|Z99 2G|z930|z990|z909|Z919|z900", 
      "PositivoTablet": "TB07STA|TB10STA|TB07FTA|TB10FTA", 
      "NabiTablet": "Android.*\\bNabi", 
      "KoboTablet": "Kobo Touch|\\bK080\\b|\\bVox\\b Build|\\bArc\\b Build", 
      "DanewTablet": "DSlide.*\\b(700|701R|702|703R|704|802|970|971|972|973|974|1010|1012)\\b", 
      "TexetTablet": "NaviPad|TB-772A|TM-7045|TM-7055|TM-9750|TM-7016|TM-7024|TM-7026|TM-7041|TM-7043|TM-7047|TM-8041|TM-9741|TM-9747|TM-9748|TM-9751|TM-7022|TM-7021|TM-7020|TM-7011|TM-7010|TM-7023|TM-7025|TM-7037W|TM-7038W|TM-7027W|TM-9720|TM-9725|TM-9737W|TM-1020|TM-9738W|TM-9740|TM-9743W|TB-807A|TB-771A|TB-727A|TB-725A|TB-719A|TB-823A|TB-805A|TB-723A|TB-715A|TB-707A|TB-705A|TB-709A|TB-711A|TB-890HD|TB-880HD|TB-790HD|TB-780HD|TB-770HD|TB-721HD|TB-710HD|TB-434HD|TB-860HD|TB-840HD|TB-760HD|TB-750HD|TB-740HD|TB-730HD|TB-722HD|TB-720HD|TB-700HD|TB-500HD|TB-470HD|TB-431HD|TB-430HD|TB-506|TB-504|TB-446|TB-436|TB-416|TB-146SE|TB-126SE", 
      "PlaystationTablet": "Playstation.*(Portable|Vita)", 
      "TrekstorTablet": "ST10416-1|VT10416-1|ST70408-1|ST702xx-1|ST702xx-2|ST80208|ST97216|ST70104-2|VT10416-2|ST10216-2A|SurfTab", 
      "PyleAudioTablet": "\\b(PTBL10CEU|PTBL10C|PTBL72BC|PTBL72BCEU|PTBL7CEU|PTBL7C|PTBL92BC|PTBL92BCEU|PTBL9CEU|PTBL9CUK|PTBL9C)\\b", 
      "AdvanTablet": "Android.* \\b(E3A|T3X|T5C|T5B|T3E|T3C|T3B|T1J|T1F|T2A|T1H|T1i|E1C|T1-E|T5-A|T4|E1-B|T2Ci|T1-B|T1-D|O1-A|E1-A|T1-A|T3A|T4i)\\b ", 
      "DanyTechTablet": "Genius Tab G3|Genius Tab S2|Genius Tab Q3|Genius Tab G4|Genius Tab Q4|Genius Tab G-II|Genius TAB GII|Genius TAB GIII|Genius Tab S1", 
      "GalapadTablet": "Android.*\\bG1\\b(?!\\))", 
      "MicromaxTablet": "Funbook|Micromax.*\\b(P250|P560|P360|P362|P600|P300|P350|P500|P275)\\b", 
      "KarbonnTablet": "Android.*\\b(A39|A37|A34|ST8|ST10|ST7|Smart Tab3|Smart Tab2)\\b", 
      "AllFineTablet": "Fine7 Genius|Fine7 Shine|Fine7 Air|Fine8 Style|Fine9 More|Fine10 Joy|Fine11 Wide", 
      "PROSCANTablet": "\\b(PEM63|PLT1023G|PLT1041|PLT1044|PLT1044G|PLT1091|PLT4311|PLT4311PL|PLT4315|PLT7030|PLT7033|PLT7033D|PLT7035|PLT7035D|PLT7044K|PLT7045K|PLT7045KB|PLT7071KG|PLT7072|PLT7223G|PLT7225G|PLT7777G|PLT7810K|PLT7849G|PLT7851G|PLT7852G|PLT8015|PLT8031|PLT8034|PLT8036|PLT8080K|PLT8082|PLT8088|PLT8223G|PLT8234G|PLT8235G|PLT8816K|PLT9011|PLT9045K|PLT9233G|PLT9735|PLT9760G|PLT9770G)\\b", 
      "YONESTablet": "BQ1078|BC1003|BC1077|RK9702|BC9730|BC9001|IT9001|BC7008|BC7010|BC708|BC728|BC7012|BC7030|BC7027|BC7026", 
      "ChangJiaTablet": "TPC7102|TPC7103|TPC7105|TPC7106|TPC7107|TPC7201|TPC7203|TPC7205|TPC7210|TPC7708|TPC7709|TPC7712|TPC7110|TPC8101|TPC8103|TPC8105|TPC8106|TPC8203|TPC8205|TPC8503|TPC9106|TPC9701|TPC97101|TPC97103|TPC97105|TPC97106|TPC97111|TPC97113|TPC97203|TPC97603|TPC97809|TPC97205|TPC10101|TPC10103|TPC10106|TPC10111|TPC10203|TPC10205|TPC10503", 
      "GUTablet": "TX-A1301|TX-M9002|Q702|kf026", 
      "PointOfViewTablet": "TAB-P506|TAB-navi-7-3G-M|TAB-P517|TAB-P-527|TAB-P701|TAB-P703|TAB-P721|TAB-P731N|TAB-P741|TAB-P825|TAB-P905|TAB-P925|TAB-PR945|TAB-PL1015|TAB-P1025|TAB-PI1045|TAB-P1325|TAB-PROTAB[0-9]+|TAB-PROTAB25|TAB-PROTAB26|TAB-PROTAB27|TAB-PROTAB26XL|TAB-PROTAB2-IPS9|TAB-PROTAB30-IPS9|TAB-PROTAB25XXL|TAB-PROTAB26-IPS10|TAB-PROTAB30-IPS10", 
      "OvermaxTablet": "OV-(SteelCore|NewBase|Basecore|Baseone|Exellen|Quattor|EduTab|Solution|ACTION|BasicTab|TeddyTab|MagicTab|Stream|TB-08|TB-09)|Qualcore 1027", 
      "HCLTablet": "HCL.*Tablet|Connect-3G-2.0|Connect-2G-2.0|ME Tablet U1|ME Tablet U2|ME Tablet G1|ME Tablet X1|ME Tablet Y2|ME Tablet Sync", 
      "DPSTablet": "DPS Dream 9|DPS Dual 7", 
      "VistureTablet": "V97 HD|i75 3G|Visture V4( HD)?|Visture V5( HD)?|Visture V10", 
      "CrestaTablet": "CTP(-)?810|CTP(-)?818|CTP(-)?828|CTP(-)?838|CTP(-)?888|CTP(-)?978|CTP(-)?980|CTP(-)?987|CTP(-)?988|CTP(-)?989", 
      "MediatekTablet": "\\bMT8125|MT8389|MT8135|MT8377\\b", 
      "ConcordeTablet": "Concorde([ ]+)?Tab|ConCorde ReadMan", 
      "GoCleverTablet": "GOCLEVER TAB|A7GOCLEVER|M1042|M7841|M742|R1042BK|R1041|TAB A975|TAB A7842|TAB A741|TAB A741L|TAB M723G|TAB M721|TAB A1021|TAB I921|TAB R721|TAB I720|TAB T76|TAB R70|TAB R76.2|TAB R106|TAB R83.2|TAB M813G|TAB I721|GCTA722|TAB I70|TAB I71|TAB S73|TAB R73|TAB R74|TAB R93|TAB R75|TAB R76.1|TAB A73|TAB A93|TAB A93.2|TAB T72|TAB R83|TAB R974|TAB R973|TAB A101|TAB A103|TAB A104|TAB A104.2|R105BK|M713G|A972BK|TAB A971|TAB R974.2|TAB R104|TAB R83.3|TAB A1042", 
      "ModecomTablet": "FreeTAB 9000|FreeTAB 7.4|FreeTAB 7004|FreeTAB 7800|FreeTAB 2096|FreeTAB 7.5|FreeTAB 1014|FreeTAB 1001 |FreeTAB 8001|FreeTAB 9706|FreeTAB 9702|FreeTAB 7003|FreeTAB 7002|FreeTAB 1002|FreeTAB 7801|FreeTAB 1331|FreeTAB 1004|FreeTAB 8002|FreeTAB 8014|FreeTAB 9704|FreeTAB 1003", 
      "VoninoTablet": "\\b(Argus[ _]?S|Diamond[ _]?79HD|Emerald[ _]?78E|Luna[ _]?70C|Onyx[ _]?S|Onyx[ _]?Z|Orin[ _]?HD|Orin[ _]?S|Otis[ _]?S|SpeedStar[ _]?S|Magnet[ _]?M9|Primus[ _]?94[ _]?3G|Primus[ _]?94HD|Primus[ _]?QS|Android.*\\bQ8\\b|Sirius[ _]?EVO[ _]?QS|Sirius[ _]?QS|Spirit[ _]?S)\\b", 
      "ECSTablet": "V07OT2|TM105A|S10OT1|TR10CS1", 
      "StorexTablet": "eZee[_']?(Tab|Go)[0-9]+|TabLC7|Looney Tunes Tab", 
      "VodafoneTablet": "SmartTab([ ]+)?[0-9]+|SmartTabII10|SmartTabII7|VF-1497|VFD 1400", 
      "EssentielBTablet": "Smart[ ']?TAB[ ]+?[0-9]+|Family[ ']?TAB2", 
      "RossMoorTablet": "RM-790|RM-997|RMD-878G|RMD-974R|RMT-705A|RMT-701|RME-601|RMT-501|RMT-711", 
      "iMobileTablet": "i-mobile i-note", 
      "TolinoTablet": "tolino tab [0-9.]+|tolino shine", 
      "AudioSonicTablet": "\\bC-22Q|T7-QC|T-17B|T-17P\\b", 
      "AMPETablet": "Android.* A78 ", 
      "SkkTablet": "Android.* (SKYPAD|PHOENIX|CYCLOPS)", 
      "TecnoTablet": "TECNO P9|TECNO DP8D", 
      "JXDTablet": "Android.* \\b(F3000|A3300|JXD5000|JXD3000|JXD2000|JXD300B|JXD300|S5800|S7800|S602b|S5110b|S7300|S5300|S602|S603|S5100|S5110|S601|S7100a|P3000F|P3000s|P101|P200s|P1000m|P200m|P9100|P1000s|S6600b|S908|P1000|P300|S18|S6600|S9100)\\b", 
      "iJoyTablet": "Tablet (Spirit 7|Essentia|Galatea|Fusion|Onix 7|Landa|Titan|Scooby|Deox|Stella|Themis|Argon|Unique 7|Sygnus|Hexen|Finity 7|Cream|Cream X2|Jade|Neon 7|Neron 7|Kandy|Scape|Saphyr 7|Rebel|Biox|Rebel|Rebel 8GB|Myst|Draco 7|Myst|Tab7-004|Myst|Tadeo Jones|Tablet Boing|Arrow|Draco Dual Cam|Aurix|Mint|Amity|Revolution|Finity 9|Neon 9|T9w|Amity 4GB Dual Cam|Stone 4GB|Stone 8GB|Andromeda|Silken|X2|Andromeda II|Halley|Flame|Saphyr 9,7|Touch 8|Planet|Triton|Unique 10|Hexen 10|Memphis 4GB|Memphis 8GB|Onix 10)", 
      "FX2Tablet": "FX2 PAD7|FX2 PAD10", 
      "XoroTablet": "KidsPAD 701|PAD[ ]?712|PAD[ ]?714|PAD[ ]?716|PAD[ ]?717|PAD[ ]?718|PAD[ ]?720|PAD[ ]?721|PAD[ ]?722|PAD[ ]?790|PAD[ ]?792|PAD[ ]?900|PAD[ ]?9715D|PAD[ ]?9716DR|PAD[ ]?9718DR|PAD[ ]?9719QR|PAD[ ]?9720QR|TelePAD1030|Telepad1032|TelePAD730|TelePAD731|TelePAD732|TelePAD735Q|TelePAD830|TelePAD9730|TelePAD795|MegaPAD 1331|MegaPAD 1851|MegaPAD 2151", 
      "ViewsonicTablet": "ViewPad 10pi|ViewPad 10e|ViewPad 10s|ViewPad E72|ViewPad7|ViewPad E100|ViewPad 7e|ViewSonic VB733|VB100a", 
      "VerizonTablet": "QTAQZ3|QTAIR7|QTAQTZ3|QTASUN1|QTASUN2|QTAXIA1", 
      "OdysTablet": "LOOX|XENO10|ODYS[ -](Space|EVO|Xpress|NOON)|\\bXELIO\\b|Xelio10Pro|XELIO7PHONETAB|XELIO10EXTREME|XELIOPT2|NEO_QUAD10", 
      "CaptivaTablet": "CAPTIVA PAD", 
      "IconbitTablet": "NetTAB|NT-3702|NT-3702S|NT-3702S|NT-3603P|NT-3603P|NT-0704S|NT-0704S|NT-3805C|NT-3805C|NT-0806C|NT-0806C|NT-0909T|NT-0909T|NT-0907S|NT-0907S|NT-0902S|NT-0902S", 
      "TeclastTablet": "T98 4G|\\bP80\\b|\\bX90HD\\b|X98 Air|X98 Air 3G|\\bX89\\b|P80 3G|\\bX80h\\b|P98 Air|\\bX89HD\\b|P98 3G|\\bP90HD\\b|P89 3G|X98 3G|\\bP70h\\b|P79HD 3G|G18d 3G|\\bP79HD\\b|\\bP89s\\b|\\bA88\\b|\\bP10HD\\b|\\bP19HD\\b|G18 3G|\\bP78HD\\b|\\bA78\\b|\\bP75\\b|G17s 3G|G17h 3G|\\bP85t\\b|\\bP90\\b|\\bP11\\b|\\bP98t\\b|\\bP98HD\\b|\\bG18d\\b|\\bP85s\\b|\\bP11HD\\b|\\bP88s\\b|\\bA80HD\\b|\\bA80se\\b|\\bA10h\\b|\\bP89\\b|\\bP78s\\b|\\bG18\\b|\\bP85\\b|\\bA70h\\b|\\bA70\\b|\\bG17\\b|\\bP18\\b|\\bA80s\\b|\\bA11s\\b|\\bP88HD\\b|\\bA80h\\b|\\bP76s\\b|\\bP76h\\b|\\bP98\\b|\\bA10HD\\b|\\bP78\\b|\\bP88\\b|\\bA11\\b|\\bA10t\\b|\\bP76a\\b|\\bP76t\\b|\\bP76e\\b|\\bP85HD\\b|\\bP85a\\b|\\bP86\\b|\\bP75HD\\b|\\bP76v\\b|\\bA12\\b|\\bP75a\\b|\\bA15\\b|\\bP76Ti\\b|\\bP81HD\\b|\\bA10\\b|\\bT760VE\\b|\\bT720HD\\b|\\bP76\\b|\\bP73\\b|\\bP71\\b|\\bP72\\b|\\bT720SE\\b|\\bC520Ti\\b|\\bT760\\b|\\bT720VE\\b|T720-3GE|T720-WiFi", 
      "OndaTablet": "\\b(V975i|Vi30|VX530|V701|Vi60|V701s|Vi50|V801s|V719|Vx610w|VX610W|V819i|Vi10|VX580W|Vi10|V711s|V813|V811|V820w|V820|Vi20|V711|VI30W|V712|V891w|V972|V819w|V820w|Vi60|V820w|V711|V813s|V801|V819|V975s|V801|V819|V819|V818|V811|V712|V975m|V101w|V961w|V812|V818|V971|V971s|V919|V989|V116w|V102w|V973|Vi40)\\b[\\s]+|V10 \\b4G\\b", 
      "JaytechTablet": "TPC-PA762", 
      "BlaupunktTablet": "Endeavour 800NG|Endeavour 1010", 
      "DigmaTablet": "\\b(iDx10|iDx9|iDx8|iDx7|iDxD7|iDxD8|iDsQ8|iDsQ7|iDsQ8|iDsD10|iDnD7|3TS804H|iDsQ11|iDj7|iDs10)\\b", 
      "EvolioTablet": "ARIA_Mini_wifi|Aria[ _]Mini|Evolio X10|Evolio X7|Evolio X8|\\bEvotab\\b|\\bNeura\\b", 
      "LavaTablet": "QPAD E704|\\bIvoryS\\b|E-TAB IVORY|\\bE-TAB\\b", 
      "AocTablet": "MW0811|MW0812|MW0922|MTK8382|MW1031|MW0831|MW0821|MW0931|MW0712", 
      "MpmanTablet": "MP11 OCTA|MP10 OCTA|MPQC1114|MPQC1004|MPQC994|MPQC974|MPQC973|MPQC804|MPQC784|MPQC780|\\bMPG7\\b|MPDCG75|MPDCG71|MPDC1006|MP101DC|MPDC9000|MPDC905|MPDC706HD|MPDC706|MPDC705|MPDC110|MPDC100|MPDC99|MPDC97|MPDC88|MPDC8|MPDC77|MP709|MID701|MID711|MID170|MPDC703|MPQC1010", 
      "CelkonTablet": "CT695|CT888|CT[\\s]?910|CT7 Tab|CT9 Tab|CT3 Tab|CT2 Tab|CT1 Tab|C820|C720|\\bCT-1\\b", 
      "WolderTablet": "miTab \\b(DIAMOND|SPACE|BROOKLYN|NEO|FLY|MANHATTAN|FUNK|EVOLUTION|SKY|GOCAR|IRON|GENIUS|POP|MINT|EPSILON|BROADWAY|JUMP|HOP|LEGEND|NEW AGE|LINE|ADVANCE|FEEL|FOLLOW|LIKE|LINK|LIVE|THINK|FREEDOM|CHICAGO|CLEVELAND|BALTIMORE-GH|IOWA|BOSTON|SEATTLE|PHOENIX|DALLAS|IN 101|MasterChef)\\b", 
      "MediacomTablet": "M-MPI10C3G|M-SP10EG|M-SP10EGP|M-SP10HXAH|M-SP7HXAH|M-SP10HXBH|M-SP8HXAH|M-SP8MXA", 
      "MiTablet": "\\bMI PAD\\b|\\bHM NOTE 1W\\b", 
      "NibiruTablet": "Nibiru M1|Nibiru Jupiter One", 
      "NexoTablet": "NEXO NOVA|NEXO 10|NEXO AVIO|NEXO FREE|NEXO GO|NEXO EVO|NEXO 3G|NEXO SMART|NEXO KIDDO|NEXO MOBI", 
      "LeaderTablet": "TBLT10Q|TBLT10I|TBL-10WDKB|TBL-10WDKBO2013|TBL-W230V2|TBL-W450|TBL-W500|SV572|TBLT7I|TBA-AC7-8G|TBLT79|TBL-8W16|TBL-10W32|TBL-10WKB|TBL-W100", 
      "UbislateTablet": "UbiSlate[\\s]?7C", 
      "PocketBookTablet": "Pocketbook", 
      "KocasoTablet": "\\b(TB-1207)\\b", 
      "HisenseTablet": "\\b(F5281|E2371)\\b", 
      "Hudl": "Hudl HT7S3|Hudl 2", 
      "TelstraTablet": "T-Hub2", 
      "GenericTablet": "Android.*\\b97D\\b|Tablet(?!.*PC)|BNTV250A|MID-WCDMA|LogicPD Zoom2|\\bA7EB\\b|CatNova8|A1_07|CT704|CT1002|\\bM721\\b|rk30sdk|\\bEVOTAB\\b|M758A|ET904|ALUMIUM10|Smartfren Tab|Endeavour 1010|Tablet-PC-4|Tagi Tab|\\bM6pro\\b|CT1020W|arc 10HD|\\bTP750\\b|\\bQTAQZ3\\b|WVT101|TM1088|KT107"}, 
     "oss": {"AndroidOS": "Android", 
      "BlackBerryOS": "blackberry|\\bBB10\\b|rim tablet os", 
      "PalmOS": "PalmOS|avantgo|blazer|elaine|hiptop|palm|plucker|xiino", 
      "SymbianOS": "Symbian|SymbOS|Series60|Series40|SYB-[0-9]+|\\bS60\\b", 
      "WindowsMobileOS": "Windows CE.*(PPC|Smartphone|Mobile|[0-9]{3}x[0-9]{3})|Windows Mobile|Windows Phone [0-9.]+|WCE;", 
      "WindowsPhoneOS": "Windows Phone 10.0|Windows Phone 8.1|Windows Phone 8.0|Windows Phone OS|XBLWP7|ZuneWP7|Windows NT 6.[23]; ARM;", 
      "iOS": "\\biPhone.*Mobile|\\biPod|\\biPad|AppleCoreMedia", 
      "iPadOS": "CPU OS 13", 
      "MeeGoOS": "MeeGo", 
      "MaemoOS": "Maemo", 
      "JavaOS": "J2ME\/|\\bMIDP\\b|\\bCLDC\\b", 
      "webOS": "webOS|hpwOS", 
      "badaOS": "\\bBada\\b", 
      "BREWOS": "BREW"}, 
     "uas": {"Chrome": "\\bCrMo\\b|CriOS|Android.*Chrome\/[.0-9]* (Mobile)?", 
      "Dolfin": "\\bDolfin\\b", 
      "Opera": "Opera.*Mini|Opera.*Mobi|Android.*Opera|Mobile.*OPR\/[0-9.]+$|Coast\/[0-9.]+", 
      "Skyfire": "Skyfire", 
      "Edge": "Mobile Safari\/[.0-9]* Edge", 
      "IE": "IEMobile|MSIEMobile", 
      "Firefox": "fennec|firefox.*maemo|(Mobile|Tablet).*Firefox|Firefox.*Mobile|FxiOS", 
      "Bolt": "bolt", 
      "TeaShark": "teashark", 
      "Blazer": "Blazer", 
      "Safari": "Version.*Mobile.*Safari|Safari.*Mobile|MobileSafari", 
      "WeChat": "\\bMicroMessenger\\b", 
      "UCBrowser": "UC.*Browser|UCWEB", 
      "baiduboxapp": "baiduboxapp", 
      "baidubrowser": "baidubrowser", 
      "DiigoBrowser": "DiigoBrowser", 
      "Mercury": "\\bMercury\\b", 
      "ObigoBrowser": "Obigo", 
      "NetFront": "NF-Browser", 
      "GenericBrowser": "NokiaBrowser|OviBrowser|OneBrowser|TwonkyBeamBrowser|SEMC.*Browser|FlyFlow|Minimo|NetFront|Novarra-Vision|MQQBrowser|MicroMessenger", 
      "PaleMoon": "Android.*PaleMoon|Mobile.*PaleMoon"}, 
     "props": {"Mobile": "Mobile\/[VER]", 
      "Build": "Build\/[VER]", 
      "Version": "Version\/[VER]", 
      "VendorID": "VendorID\/[VER]", 
      "iPad": "iPad.*CPU[a-z ]+[VER]", 
      "iPhone": "iPhone.*CPU[a-z ]+[VER]", 
      "iPod": "iPod.*CPU[a-z ]+[VER]", 
      "Kindle": "Kindle\/[VER]", 
      "Chrome": ["Chrome\/[VER]", "CriOS\/[VER]", "CrMo\/[VER]"], 
      "Coast": ["Coast\/[VER]"], 
      "Dolfin": "Dolfin\/[VER]", 
      "Firefox": ["Firefox\/[VER]", "FxiOS\/[VER]"], 
      "Fennec": "Fennec\/[VER]", 
      "Edge": "Edge\/[VER]", 
      "IE": ["IEMobile\/[VER];", "IEMobile [VER]", "MSIE [VER];", "Trident\/[0-9.]+;.*rv:[VER]"], 
      "NetFront": "NetFront\/[VER]", 
      "NokiaBrowser": "NokiaBrowser\/[VER]", 
      "Opera": [" OPR\/[VER]", "Opera Mini\/[VER]", "Version\/[VER]"], 
      "Opera Mini": "Opera Mini\/[VER]", 
      "Opera Mobi": "Version\/[VER]", 
      "UCBrowser": ["UCWEB[VER]", "UC.*Browser\/[VER]"], 
      "MQQBrowser": "MQQBrowser\/[VER]", 
      "MicroMessenger": "MicroMessenger\/[VER]", 
      "baiduboxapp": "baiduboxapp\/[VER]", 
      "baidubrowser": "baidubrowser\/[VER]", 
      "SamsungBrowser": "SamsungBrowser\/[VER]", 
      "Iron": "Iron\/[VER]", 
      "Safari": ["Version\/[VER]", "Safari\/[VER]"], 
      "Skyfire": "Skyfire\/[VER]", 
      "Tizen": "Tizen\/[VER]", 
      "Webkit": "webkit[ \/][VER]", 
      "PaleMoon": "PaleMoon\/[VER]", 
      "Gecko": "Gecko\/[VER]", 
      "Trident": "Trident\/[VER]", 
      "Presto": "Presto\/[VER]", 
      "Goanna": "Goanna\/[VER]", 
      "iOS": " \\bi?OS\\b [VER][ ;]{1}", 
      "Android": "Android [VER]", 
      "BlackBerry": ["BlackBerry[\\w]+\/[VER]", "BlackBerry.*Version\/[VER]", "Version\/[VER]"], 
      "BREW": "BREW [VER]", 
      "Java": "Java\/[VER]", 
      "Windows Phone OS": ["Windows Phone OS [VER]", "Windows Phone [VER]"], 
      "Windows Phone": "Windows Phone [VER]", 
      "Windows CE": "Windows CE\/[VER]", 
      "Windows NT": "Windows NT [VER]", 
      "Symbian": ["SymbianOS\/[VER]", "Symbian\/[VER]"], 
      "webOS": ["webOS\/[VER]", "hpwOS\/[VER];"]}, 
     "utils": {"Bot": "Googlebot|facebookexternalhit|Google-AMPHTML|s~amp-validator|AdsBot-Google|Google Keyword Suggestion|Facebot|YandexBot|YandexMobileBot|bingbot|ia_archiver|AhrefsBot|Ezooms|GSLFbot|WBSearchBot|Twitterbot|TweetmemeBot|Twikle|PaperLiBot|Wotbox|UnwindFetchor|Exabot|MJ12bot|YandexImages|TurnitinBot|Pingdom|contentkingapp", 
      "MobileBot": "Googlebot-Mobile|AdsBot-Google-Mobile|YahooSeeker\/M1A1-R2D2", 
      "DesktopMode": "WPDesktop", 
      "TV": "SonyDTV|HbbTV", 
      "WebKit": "(webkit)[ \/]([\\w.]+)", 
      "Console": "\\b(Nintendo|Nintendo WiiU|Nintendo 3DS|Nintendo Switch|PLAYSTATION|Xbox)\\b", 
      "Watch": "SM-V700"}}
      impl.detectMobileBrowsers = {fullPattern: /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i, 
     shortPattern: /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i, 
     tabletPattern: /android|ipad|playbook|silk/i}
      var hasOwnProp=Object.prototype.hasOwnProperty, isArray;
      impl.FALLBACK_PHONE = 'UnknownPhone';
      impl.FALLBACK_TABLET = 'UnknownTablet';
      impl.FALLBACK_MOBILE = 'UnknownMobile';
      isArray = ('isArray' in Array) ? Array.isArray : function (value) {
        return Object.prototype.toString.call(value)==='[object Array]';
      }
      function equalIC(a, b) {
        return a!=null&&b!=null&&a.toLowerCase()===b.toLowerCase();
      }
      function containsIC(array, value) {
        var valueLC, i, len=array.length;
        if (!len||!value) {
            return false;
        }
        valueLC = value.toLowerCase();
        for (i = 0; i<len; ++i) {
            if (valueLC===array[i].toLowerCase()) {
                return true;
            }
        }
        return false;
      }
      function convertPropsToRegExp(object) {
        for (var key in object) {
            if (hasOwnProp.call(object, key)) {
                object[key] = new RegExp(object[key], 'i');
            }
        }
      }
      function prepareUserAgent(userAgent) {
        return (userAgent||'').substr(0, 500);
      }(function init() {
        var key, values, value, i, len, verPos, mobileDetectRules=impl.mobileDetectRules;
        for (key in mobileDetectRules.props) {
            if (hasOwnProp.call(mobileDetectRules.props, key)) {
                values = mobileDetectRules.props[key];
                if (!isArray(values)) {
                    values = [values];
                }
                len = values.length;
                for (i = 0; i<len; ++i) {
                    value = values[i];
                    verPos = value.indexOf('[VER]');
                    if (verPos>=0) {
                        value = value.substring(0, verPos)+'([\\w._\\+]+)'+value.substring(verPos+5);
                    }
                    values[i] = new RegExp(value, 'i');
                }
                mobileDetectRules.props[key] = values;
            }
        }
        convertPropsToRegExp(mobileDetectRules.oss);
        convertPropsToRegExp(mobileDetectRules.phones);
        convertPropsToRegExp(mobileDetectRules.tablets);
        convertPropsToRegExp(mobileDetectRules.uas);
        convertPropsToRegExp(mobileDetectRules.utils);
        mobileDetectRules.oss0 = {WindowsPhoneOS: mobileDetectRules.oss.WindowsPhoneOS, 
      WindowsMobileOS: mobileDetectRules.oss.WindowsMobileOS}
      }());
      impl.findMatch = function (rules, userAgent) {
        for (var key in rules) {
            if (hasOwnProp.call(rules, key)) {
                if (rules[key].test(userAgent)) {
                    return key;
                }
            }
        }
        return null;
      }
      impl.findMatches = function (rules, userAgent) {
        var result=[];
        for (var key in rules) {
            if (hasOwnProp.call(rules, key)) {
                if (rules[key].test(userAgent)) {
                    result.push(key);
                }
            }
        }
        return result;
      }
      impl.getVersionStr = function (propertyName, userAgent) {
        var props=impl.mobileDetectRules.props, patterns, i, len, match;
        if (hasOwnProp.call(props, propertyName)) {
            patterns = props[propertyName];
            len = patterns.length;
            for (i = 0; i<len; ++i) {
                match = patterns[i].exec(userAgent);
                if (match!==null) {
                    return match[1];
                }
            }
        }
        return null;
      }
      impl.getVersion = function (propertyName, userAgent) {
        var version=impl.getVersionStr(propertyName, userAgent);
        return version ? impl.prepareVersionNo(version) : NaN;
      }
      impl.prepareVersionNo = function (version) {
        var numbers;
        numbers = version.split(/[a-z._ \/\-]/i);
        if (numbers.length===1) {
            version = numbers[0];
        }
        if (numbers.length>1) {
            version = numbers[0]+'.';
            numbers.shift();
            version+=numbers.join('');
        }
        return Number(version);
      }
      impl.isMobileFallback = function (userAgent) {
        return impl.detectMobileBrowsers.fullPattern.test(userAgent)||impl.detectMobileBrowsers.shortPattern.test(userAgent.substr(0, 4));
      }
      impl.isTabletFallback = function (userAgent) {
        return impl.detectMobileBrowsers.tabletPattern.test(userAgent);
      }
      impl.prepareDetectionCache = function (cache, userAgent, maxPhoneWidth) {
        if (cache.mobile!==undefined) {
            return ;
        }
        var phone, tablet, phoneSized;
        tablet = impl.findMatch(impl.mobileDetectRules.tablets, userAgent);
        if (tablet) {
            cache.mobile = cache.tablet = tablet;
            cache.phone = null;
            return ;
        }
        phone = impl.findMatch(impl.mobileDetectRules.phones, userAgent);
        if (phone) {
            cache.mobile = cache.phone = phone;
            cache.tablet = null;
            return ;
        }
        if (impl.isMobileFallback(userAgent)) {
            phoneSized = MobileDetect.isPhoneSized(maxPhoneWidth);
            if (phoneSized===undefined) {
                cache.mobile = impl.FALLBACK_MOBILE;
                cache.tablet = cache.phone = null;
            }
            else 
              if (phoneSized) {
                cache.mobile = cache.phone = impl.FALLBACK_PHONE;
                cache.tablet = null;
            }
            else {
              cache.mobile = cache.tablet = impl.FALLBACK_TABLET;
              cache.phone = null;
            }
        }
        else 
          if (impl.isTabletFallback(userAgent)) {
            cache.mobile = cache.tablet = impl.FALLBACK_TABLET;
            cache.phone = null;
        }
        else {
          cache.mobile = cache.tablet = cache.phone = null;
        }
      }
      impl.mobileGrade = function (t) {
        var $isMobile=t.mobile()!==null;
        if (t.os('iOS')&&t.version('iPad')>=4.3||t.os('iOS')&&t.version('iPhone')>=3.1||t.os('iOS')&&t.version('iPod')>=3.1||(t.version('Android')>2.1&&t.is('Webkit'))||t.version('Windows Phone OS')>=7.0||t.is('BlackBerry')&&t.version('BlackBerry')>=6.0||t.match('Playbook.*Tablet')||(t.version('webOS')>=1.4&&t.match('Palm|Pre|Pixi'))||t.match('hp.*TouchPad')||(t.is('Firefox')&&t.version('Firefox')>=12)||(t.is('Chrome')&&t.is('AndroidOS')&&t.version('Android')>=4.0)||(t.is('Skyfire')&&t.version('Skyfire')>=4.1&&t.is('AndroidOS')&&t.version('Android')>=2.3)||(t.is('Opera')&&t.version('Opera Mobi')>11&&t.is('AndroidOS'))||t.is('MeeGoOS')||t.is('Tizen')||t.is('Dolfin')&&t.version('Bada')>=2.0||((t.is('UC Browser')||t.is('Dolfin'))&&t.version('Android')>=2.3)||(t.match('Kindle Fire')||t.is('Kindle')&&t.version('Kindle')>=3.0)||t.is('AndroidOS')&&t.is('NookTablet')||t.version('Chrome')>=11&&!$isMobile||t.version('Safari')>=5.0&&!$isMobile||t.version('Firefox')>=4.0&&!$isMobile||t.version('MSIE')>=7.0&&!$isMobile||t.version('Opera')>=10&&!$isMobile) {
            return 'A';
        }
        if (t.os('iOS')&&t.version('iPad')<4.3||t.os('iOS')&&t.version('iPhone')<3.1||t.os('iOS')&&t.version('iPod')<3.1||t.is('Blackberry')&&t.version('BlackBerry')>=5&&t.version('BlackBerry')<6||(t.version('Opera Mini')>=5.0&&t.version('Opera Mini')<=6.5&&(t.version('Android')>=2.3||t.is('iOS')))||t.match('NokiaN8|NokiaC7|N97.*Series60|Symbian/3')||t.version('Opera Mobi')>=11&&t.is('SymbianOS')) {
            return 'B';
        }
        if (t.version('BlackBerry')<5.0||t.match('MSIEMobile|Windows CE.*Mobile')||t.version('Windows Mobile')<=5.2) {
            return 'C';
        }
        return 'C';
      }
      impl.detectOS = function (ua) {
        return impl.findMatch(impl.mobileDetectRules.oss0, ua)||impl.findMatch(impl.mobileDetectRules.oss, ua);
      }
      impl.getDeviceSmallerSide = function () {
        return window.screen.width<window.screen.height ? window.screen.width : window.screen.height;
      }
      function MobileDetect(userAgent, maxPhoneWidth) {
        this.ua = prepareUserAgent(userAgent);
        this._cache = {}
        this.maxPhoneWidth = maxPhoneWidth||600;
      }
      MobileDetect.prototype = {constructor: MobileDetect, 
     mobile: function () {
          impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
          return this._cache.mobile;
        }, 
     phone: function () {
          impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
          return this._cache.phone;
        }, 
     tablet: function () {
          impl.prepareDetectionCache(this._cache, this.ua, this.maxPhoneWidth);
          return this._cache.tablet;
        }, 
     userAgent: function () {
          if (this._cache.userAgent===undefined) {
              this._cache.userAgent = impl.findMatch(impl.mobileDetectRules.uas, this.ua);
          }
          return this._cache.userAgent;
        }, 
     userAgents: function () {
          if (this._cache.userAgents===undefined) {
              this._cache.userAgents = impl.findMatches(impl.mobileDetectRules.uas, this.ua);
          }
          return this._cache.userAgents;
        }, 
     os: function () {
          if (this._cache.os===undefined) {
              this._cache.os = impl.detectOS(this.ua);
          }
          return this._cache.os;
        }, 
     version: function (key) {
          return impl.getVersion(key, this.ua);
        }, 
     versionStr: function (key) {
          return impl.getVersionStr(key, this.ua);
        }, 
     is: function (key) {
          return containsIC(this.userAgents(), key)||equalIC(key, this.os())||equalIC(key, this.phone())||equalIC(key, this.tablet())||containsIC(impl.findMatches(impl.mobileDetectRules.utils, this.ua), key);
        }, 
     match: function (pattern) {
          if (!(__instance_of(pattern, RegExp))) {
              pattern = new RegExp(pattern, 'i');
          }
          return pattern.test(this.ua);
        }, 
     isPhoneSized: function (maxPhoneWidth) {
          return MobileDetect.isPhoneSized(maxPhoneWidth||this.maxPhoneWidth);
        }, 
     mobileGrade: function () {
          if (this._cache.grade===undefined) {
              this._cache.grade = impl.mobileGrade(this);
          }
          return this._cache.grade;
        }}
      if (typeof window!=='undefined'&&window.screen) {
          MobileDetect.isPhoneSized = function (maxPhoneWidth) {
            return maxPhoneWidth<0 ? undefined : impl.getDeviceSmallerSide()<=maxPhoneWidth;
          };
      }
      else {
        MobileDetect.isPhoneSized = function () {
        };
      }
      MobileDetect._impl = impl;
      MobileDetect.version = '1.4.4 2019-09-21';
      return MobileDetect;
    });
  })((function (undefined) {
    if (typeof module!=='undefined'&&module.exports) {
        return function (factory) {
          module.exports = factory();
        }
    }
    else 
      if (typeof define==='function'&&define.amd) {
        return define;
    }
    else 
      if (typeof window!=='undefined') {
        return function (factory) {
          window.MobileDetect = factory();
        }
    }
    else {
      throw new Error('unknown environment');
    }
  })());
}, '/dev/fairmotion/src/path.ux/scripts/util/mobile-detect.js');
es6_module_define('nstructjs', [], function _nstructjs_module(_es6_module) {
  (function () {
    if (typeof window==="undefined"&&typeof global!="undefined") {
        global._nGlobal = global;
    }
    else 
      if (typeof self!=="undefined") {
        self._nGlobal = self;
    }
    else {
      window._nGlobal = window;
    }
    let exports;
    if (typeof window==="undefined"&&typeof global!=="undefined") {
        console.log("Nodejs!");
    }
    else {
      exports = {};
      _nGlobal.module = {};
    }
    'use strict';
    "use strict";
    function ClassGetter(func) {
      this.func = func;
    }
    function ClassSetter(func) {
      this.func = func;
    }
    var prototype_idgen=1;
    var defined_classes=[];
    var StaticMethod=function StaticMethod(func) {
      this.func = func;
    }
    var handle_statics=function (cls, methods, parent) {
      for (var i=0; i<methods.length; i++) {
          var m=methods[i];
          if (__instance_of(m, StaticMethod)) {
              cls[m.func.name] = m.func;
          }
      }
      if (parent!=undefined) {
          for (var k in parent) {
              var v=parent[k];
              if ((typeof v=="object"||typeof v=="function")&&"_is_static_method" in v&&!(k in cls)) {
                  cls[k] = v;
              }
          }
      }
    }
    var Class=function Class(methods) {
      var construct=undefined;
      var parent=undefined;
      if (arguments.length>1) {
          parent = methods;
          methods = arguments[1];
      }
      for (var i=0; i<methods.length; i++) {
          var f=methods[i];
          if (f.name=="constructor") {
              construct = f;
              break;
          }
      }
      if (construct==undefined) {
          console.trace("Warning, constructor was not defined", methods);
          if (parent!=undefined) {
              construct = function () {
                parent.apply(this, arguments);
              };
          }
          else {
            construct = function () {
            };
          }
      }
      if (parent!=undefined) {
          construct.prototype = Object.create(parent.prototype);
      }
      construct.prototype.__prototypeid__ = prototype_idgen++;
      construct.__keystr__ = function () {
        return this.prototype.__prototypeid__;
      }
      construct.__parent__ = parent;
      construct.__statics__ = [];
      var getters={}
      var setters={}
      var getset={}
      for (var i=0; i<methods.length; i++) {
          var f=methods[i];
          if (__instance_of(f, ClassSetter)) {
              setters[f.func.name] = f.func;
              getset[f.func.name] = 1;
          }
          else 
            if (__instance_of(f, ClassGetter)) {
              getters[f.func.name] = f.func;
              getset[f.func.name] = 1;
          }
      }
      for (var k in getset) {
          var def={enumerable: true, 
       configurable: true, 
       get: getters[k], 
       set: setters[k]};
          Object.defineProperty(construct.prototype, k, def);
      }
      handle_statics(construct, methods, parent);
      if (parent!=undefined)
        construct.__parent__ = parent;
      for (var i=0; i<methods.length; i++) {
          var f=methods[i];
          if (__instance_of(f, StaticMethod)||__instance_of(f, ClassGetter)||__instance_of(f, ClassSetter))
            continue;
          construct.prototype[f.name] = f;
      }
      return construct;
    }
    Class.getter = function (func) {
      return new ClassGetter(func);
    }
    Class.setter = function (func) {
      return new ClassSetter(func);
    }
    Class.static_method = function (func) {
      func._is_static_method = true;
      return new StaticMethod(func);
    }
    var EmptySlot={}
    var set$1=Class([function constructor(input) {
      this.items = [];
      this.keys = {}
      this.freelist = [];
      this.length = 0;
      if (input!=undefined) {
          input.forEach(function (item) {
            this.add(item);
          }, this);
      }
    }, function add(item) {
      var key=item.__keystr__();
      if (key in this.keys)
        return ;
      if (this.freelist.length>0) {
          var i=this.freelist.pop();
          this.keys[key] = i;
          items[i] = i;
      }
      else {
        var i=this.items.length;
        this.keys[key] = i;
        this.items.push(item);
      }
      this.length++;
    }, function remove(item) {
      var key=item.__keystr__();
      if (!(key in this.keys)) {
          console.trace("Warning, item", item, "is not in set");
          return ;
      }
      var i=this.keys[key];
      this.freelist.push(i);
      this.items[i] = EmptySlot;
      delete this.items[i];
      this.length--;
    }, function has(item) {
      return item.__keystr__() in this.keys;
    }, function forEach(func, thisvar) {
      for (var i=0; i<this.items.length; i++) {
          var item=this.items[i];
          if (item===EmptySlot)
            continue;
          thisvar!=undefined ? func.call(thisvar, time) : func(item);
      }
    }]);
    var struct_typesystem=Object.freeze({__proto__: null, 
    defined_classes: defined_classes, 
    Class: Class, 
    set: set$1});
    var Class$1=Class;
    var _o_basic_types={"String": 0, 
    "Number": 0, 
    "Array": 0, 
    "Function": 0}
    function isNodeJS() {
      ret = typeof process!=="undefined";
      ret = ret&&process.release;
      ret = ret&&process.release.name==="node";
      ret = ret&&process.version;
      return !!ret;
    }
    let is_obj_lit=function is_obj_lit(obj) {
      if (typeof obj!=="object") {
          return false;
      }
      let good=obj.__proto__&&obj.__proto__.constructor&&obj.__proto__.constructor===Object;
      if (good) {
          return true;
      }
      let bad=typeof obj!=="object";
      bad = bad||obj.constructor.name in _o_basic_types;
      bad = bad||__instance_of(obj, String);
      bad = bad||__instance_of(obj, Number);
      bad = bad||__instance_of(obj, Boolean);
      bad = bad||__instance_of(obj, Function);
      bad = bad||__instance_of(obj, Array);
      bad = bad||__instance_of(obj, Set);
      bad = bad||(obj.__proto__.constructor&&obj.__proto__.constructor!==Object);
      return !bad;
    }
    _nGlobal.is_obj_lit = is_obj_lit;
    function set_getkey(obj) {
      if (typeof obj=="number"||typeof obj=="boolean")
        return ""+obj;
      else 
        if (typeof obj=="string")
        return obj;
      else 
        return obj.__keystr__();
    }
    const _export_get_callstack_=function get_callstack(err) {
      var callstack=[];
      var isCallstackPopulated=false;
      var err_was_undefined=err==undefined;
      if (err==undefined) {
          try {
            _idontexist.idontexist+=0;
          }
          catch (err1) {
              err = err1;
          }
      }
      if (err!=undefined) {
          if (err.stack) {
              var lines=err.stack.split('\n');
              var len=lines.length;
              for (var i=0; i<len; i++) {
                  if (1) {
                      lines[i] = lines[i].replace(/@http\:\/\/.*\//, "|");
                      var l=lines[i].split("|");
                      lines[i] = l[1]+": "+l[0];
                      lines[i] = lines[i].trim();
                      callstack.push(lines[i]);
                  }
              }
              if (err_was_undefined) {
              }
              isCallstackPopulated = true;
          }
          else 
            if (window.opera&&e.message) {
              var lines=err.message.split('\n');
              var len=lines.length;
              for (var i=0; i<len; i++) {
                  if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
                      var entry=lines[i];
                      if (lines[i+1]) {
                          entry+=' at '+lines[i+1];
                          i++;
                      }
                      callstack.push(entry);
                  }
              }
              if (err_was_undefined) {
                  callstack.shift();
              }
              isCallstackPopulated = true;
          }
      }
      var limit=24;
      if (!isCallstackPopulated) {
          var currentFunction=arguments.callee.caller;
          var i=0;
          while (currentFunction&&i<24) {
            var fn=currentFunction.toString();
            var fname=fn.substring(fn.indexOf("function")+8, fn.indexOf(''))||'anonymous';
            callstack.push(fname);
            currentFunction = currentFunction.caller;
            i++;
          }
      }
      return callstack;
    }
    const _export_print_stack_=function print_stack(err) {
      try {
        var cs=_export_get_callstack_(err);
      }
      catch (err2) {
          console.log("Could not fetch call stack.");
          return ;
      }
      console.log("Callstack:");
      for (var i=0; i<cs.length; i++) {
          console.log(cs[i]);
      }
    }
    var set$2=Class$1([function constructor(input) {
      this.items = [];
      this.keys = {}
      this.freelist = [];
      this.length = 0;
      if (input!=undefined&&__instance_of(input, Array)) {
          for (var i=0; i<input.length; i++) {
              this.add(input[i]);
          }
      }
      else 
        if (input!=undefined&&input.forEach!=undefined) {
          input.forEach(function (item) {
            this.add(input[i]);
          }, this);
      }
    }, function add(obj) {
      var key=set_getkey(obj);
      if (key in this.keys)
        return ;
      if (this.freelist.length>0) {
          var i=this.freelist.pop();
          this.keys[key] = i;
          this.items[i] = obj;
      }
      else {
        this.keys[key] = this.items.length;
        this.items.push(obj);
      }
      this.length++;
    }, function remove(obj, raise_error) {
      var key=set_getkey(obj);
      if (!(keystr in this.keys)) {
          if (raise_error)
            throw new Error("Object not in set");
          else 
            console.trace("Object not in set", obj);
          return ;
      }
      var i=this.keys[keystr];
      this.freelist.push(i);
      this.items[i] = undefined;
      delete this.keys[keystr];
      this.length--;
    }, function has(obj) {
      return set_getkey(obj) in this.keys;
    }, function forEach(func, thisvar) {
      for (var i=0; i<this.items.length; i++) {
          var item=this.items[i];
          if (item==undefined)
            continue;
          if (thisvar!=undefined)
            func.call(thisvar, item);
          else 
            func(item);
      }
    }]);
    var IDGen=Class$1([function constructor() {
      this.cur_id = 1;
    }, function gen_id() {
      return this.cur_id++;
    }, Class$1.static_method(function fromSTRUCT(reader) {
      var ret=new IDGen();
      reader(ret);
      return ret;
    })]);
    IDGen.STRUCT = ["struct_util.IDGen {", "  cur_id : int;", "}"].join("\n");
    var struct_util=Object.freeze({__proto__: null, 
    is_obj_lit: is_obj_lit, 
    get_callstack: _export_get_callstack_, 
    print_stack: _export_print_stack_, 
    set: set$2, 
    IDGen: IDGen});
    const _module_exports_={}
    _module_exports_.STRUCT_ENDIAN = true;
    var Class$2=Class;
    var temp_dataview=new DataView(new ArrayBuffer(16));
    var uint8_view=new Uint8Array(temp_dataview.buffer);
    var unpack_context=_module_exports_.unpack_context = Class$2([function constructor() {
      this.i = 0;
    }]);
    var pack_byte=_module_exports_.pack_byte = function (array, val) {
      array.push(val);
    }
    var pack_bytes=_module_exports_.pack_bytes = function (array, bytes) {
      for (var i=0; i<bytes.length; i++) {
          array.push(bytes[i]);
      }
    }
    var pack_int=_module_exports_.pack_int = function (array, val) {
      temp_dataview.setInt32(0, val, _module_exports_.STRUCT_ENDIAN);
      array.push(uint8_view[0]);
      array.push(uint8_view[1]);
      array.push(uint8_view[2]);
      array.push(uint8_view[3]);
    }
    _module_exports_.pack_float = function (array, val) {
      temp_dataview.setFloat32(0, val, _module_exports_.STRUCT_ENDIAN);
      array.push(uint8_view[0]);
      array.push(uint8_view[1]);
      array.push(uint8_view[2]);
      array.push(uint8_view[3]);
    }
    _module_exports_.pack_double = function (array, val) {
      temp_dataview.setFloat64(0, val, _module_exports_.STRUCT_ENDIAN);
      array.push(uint8_view[0]);
      array.push(uint8_view[1]);
      array.push(uint8_view[2]);
      array.push(uint8_view[3]);
      array.push(uint8_view[4]);
      array.push(uint8_view[5]);
      array.push(uint8_view[6]);
      array.push(uint8_view[7]);
    }
    _module_exports_.pack_short = function (array, val) {
      temp_dataview.setInt16(0, val, _module_exports_.STRUCT_ENDIAN);
      array.push(uint8_view[0]);
      array.push(uint8_view[1]);
    }
    var encode_utf8=_module_exports_.encode_utf8 = function encode_utf8(arr, str) {
      for (var i=0; i<str.length; i++) {
          var c=str.charCodeAt(i);
          while (c!=0) {
            var uc=c&127;
            c = c>>7;
            if (c!=0)
              uc|=128;
            arr.push(uc);
          }
      }
    }
    var decode_utf8=_module_exports_.decode_utf8 = function decode_utf8(arr) {
      var str="";
      var i=0;
      while (i<arr.length) {
        var c=arr[i];
        var sum=c&127;
        var j=0;
        var lasti=i;
        while (i<arr.length&&(c&128)) {
          j+=7;
          i++;
          c = arr[i];
          c = (c&127)<<j;
          sum|=c;
        }
        if (sum==0)
          break;
        str+=String.fromCharCode(sum);
        i++;
      }
      return str;
    }
    var test_utf8=_module_exports_.test_utf8 = function test_utf8() {
      var s="a"+String.fromCharCode(8800)+"b";
      var arr=[];
      encode_utf8(arr, s);
      var s2=decode_utf8(arr);
      if (s!=s2) {
          throw new Error("UTF-8 encoding/decoding test failed");
      }
      return true;
    }
    function truncate_utf8(arr, maxlen) {
      var len=Math.min(arr.length, maxlen);
      var last_codepoint=0;
      var last2=0;
      var incode=false;
      var i=0;
      var code=0;
      while (i<len) {
        incode = arr[i]&128;
        if (!incode) {
            last2 = last_codepoint+1;
            last_codepoint = i+1;
        }
        i++;
      }
      if (last_codepoint<maxlen)
        arr.length = last_codepoint;
      else 
        arr.length = last2;
      return arr;
    }
    var _static_sbuf_ss=new Array(2048);
    var pack_static_string=_module_exports_.pack_static_string = function pack_static_string(data, str, length) {
      if (length==undefined)
        throw new Error("'length' paremter is not optional for pack_static_string()");
      var arr=length<2048 ? _static_sbuf_ss : new Array();
      arr.length = 0;
      encode_utf8(arr, str);
      truncate_utf8(arr, length);
      for (var i=0; i<length; i++) {
          if (i>=arr.length) {
              data.push(0);
          }
          else {
            data.push(arr[i]);
          }
      }
    }
    var _static_sbuf=new Array(32);
    var pack_string=_module_exports_.pack_string = function pack_string(data, str) {
      _static_sbuf.length = 0;
      encode_utf8(_static_sbuf, str);
      pack_int(data, _static_sbuf.length);
      for (var i=0; i<_static_sbuf.length; i++) {
          data.push(_static_sbuf[i]);
      }
    }
    var unpack_bytes=_module_exports_.unpack_bytes = function unpack_bytes(dview, uctx, len) {
      var ret=new DataView(dview.buffer.slice(uctx.i, uctx.i+len));
      uctx.i+=len;
      return ret;
    }
    var unpack_byte=_module_exports_.unpack_byte = function (dview, uctx) {
      return dview.getUint8(uctx.i++);
    }
    var unpack_int=_module_exports_.unpack_int = function (dview, uctx) {
      uctx.i+=4;
      return dview.getInt32(uctx.i-4, _module_exports_.STRUCT_ENDIAN);
    }
    _module_exports_.unpack_float = function (dview, uctx) {
      uctx.i+=4;
      return dview.getFloat32(uctx.i-4, _module_exports_.STRUCT_ENDIAN);
    }
    _module_exports_.unpack_double = function (dview, uctx) {
      uctx.i+=8;
      return dview.getFloat64(uctx.i-8, _module_exports_.STRUCT_ENDIAN);
    }
    _module_exports_.unpack_short = function (dview, uctx) {
      uctx.i+=2;
      return dview.getInt16(uctx.i-2, _module_exports_.STRUCT_ENDIAN);
    }
    var _static_arr_us=new Array(32);
    _module_exports_.unpack_string = function (data, uctx) {
      var str="";
      var slen=unpack_int(data, uctx);
      var arr=slen<2048 ? _static_arr_us : new Array(slen);
      arr.length = slen;
      for (var i=0; i<slen; i++) {
          arr[i] = unpack_byte(data, uctx);
      }
      return decode_utf8(arr);
    }
    var _static_arr_uss=new Array(2048);
    _module_exports_.unpack_static_string = function unpack_static_string(data, uctx, length) {
      var str="";
      if (length==undefined)
        throw new Error("'length' cannot be undefined in unpack_static_string()");
      var arr=length<2048 ? _static_arr_uss : new Array(length);
      arr.length = 0;
      var done=false;
      for (var i=0; i<length; i++) {
          var c=unpack_byte(data, uctx);
          if (c==0) {
              done = true;
          }
          if (!done&&c!=0) {
              arr.push(c);
          }
      }
      truncate_utf8(arr, length);
      return decode_utf8(arr);
    }
    let _export_parser_;
    "use strict";
    var t;
    var Class$3=Class;
    const _export_token_=class token  {
       constructor(type, val, lexpos, lineno, lexer, parser) {
        this.type = type;
        this.value = val;
        this.lexpos = lexpos;
        this.lineno = lineno;
        this.lexer = lexer;
        this.parser = parser;
      }
       toString() {
        if (this.value!=undefined)
          return "token(type="+this.type+", value='"+this.value+"')";
        else 
          return "token(type="+this.type+")";
      }
    }
    _ESClass.register(_export_token_);
    const _export_tokdef_=class tokdef  {
       constructor(name, regexpr, func) {
        this.name = name;
        this.re = regexpr;
        this.func = func;
      }
    }
    _ESClass.register(_export_tokdef_);
    var PUTIL_ParseError=class PUTIL_ParseError extends Error {
       constructor(msg) {
        super();
      }
    }
    _ESClass.register(PUTIL_ParseError);
    const _export_lexer_=class lexer  {
       constructor(tokdef, errfunc) {
        this.tokdef = tokdef;
        this.tokens = new Array();
        this.lexpos = 0;
        this.lexdata = "";
        this.lineno = 0;
        this.errfunc = errfunc;
        this.tokints = {};
        for (var i=0; i<tokdef.length; i++) {
            this.tokints[tokdef[i].name] = i;
        }
        this.statestack = [["__main__", 0]];
        this.states = {"__main__": [tokdef, errfunc]};
        this.statedata = 0;
      }
       add_state(name, tokdef, errfunc) {
        if (errfunc==undefined) {
            errfunc = function (lexer) {
              return true;
            };
        }
        this.states[name] = [tokdef, errfunc];
      }
       tok_int(name) {

      }
       push_state(state, statedata) {
        this.statestack.push([state, statedata]);
        state = this.states[state];
        this.statedata = statedata;
        this.tokdef = state[0];
        this.errfunc = state[1];
      }
       pop_state() {
        var item=this.statestack[this.statestack.length-1];
        var state=this.states[item[0]];
        this.tokdef = state[0];
        this.errfunc = state[1];
        this.statedata = item[1];
      }
       input(str) {
        while (this.statestack.length>1) {
          this.pop_state();
        }
        this.lexdata = str;
        this.lexpos = 0;
        this.lineno = 0;
        this.tokens = new Array();
        this.peeked_tokens = [];
      }
       error() {
        if (this.errfunc!=undefined&&!this.errfunc(this))
          return ;
        console.log("Syntax error near line "+this.lineno);
        var next=Math.min(this.lexpos+8, this.lexdata.length);
        console.log("  "+this.lexdata.slice(this.lexpos, next));
        throw new PUTIL_ParseError("Parse error");
      }
       peek() {
        var tok=this.next(true);
        if (tok==undefined)
          return undefined;
        this.peeked_tokens.push(tok);
        return tok;
      }
       peeknext() {
        if (this.peeked_tokens.length>0) {
            return this.peeked_tokens[0];
        }
        return this.peek();
      }
       at_end() {
        return this.lexpos>=this.lexdata.length&&this.peeked_tokens.length==0;
      }
       next(ignore_peek) {
        if (!ignore_peek&&this.peeked_tokens.length>0) {
            var tok=this.peeked_tokens[0];
            this.peeked_tokens.shift();
            return tok;
        }
        if (this.lexpos>=this.lexdata.length)
          return undefined;
        var ts=this.tokdef;
        var tlen=ts.length;
        var lexdata=this.lexdata.slice(this.lexpos, this.lexdata.length);
        var results=[];
        for (var i=0; i<tlen; i++) {
            var t=ts[i];
            if (t.re==undefined)
              continue;
            var res=t.re.exec(lexdata);
            if (res!=null&&res!=undefined&&res.index==0) {
                results.push([t, res]);
            }
        }
        var max_res=0;
        var theres=undefined;
        for (var i=0; i<results.length; i++) {
            var res=results[i];
            if (res[1][0].length>max_res) {
                theres = res;
                max_res = res[1][0].length;
            }
        }
        if (theres==undefined) {
            this.error();
            return ;
        }
        var def=theres[0];
        var token=new _export_token_(def.name, theres[1][0], this.lexpos, this.lineno, this, undefined);
        this.lexpos+=token.value.length;
        if (def.func) {
            token = def.func(token);
            if (token==undefined) {
                return this.next();
            }
        }
        return token;
      }
    }
    _ESClass.register(_export_lexer_);
    const parser=_export_parser_ = class parser  {
       constructor(lexer, errfunc) {
        this.lexer = lexer;
        this.errfunc = errfunc;
        this.start = undefined;
      }
       parse(data, err_on_unconsumed) {
        if (err_on_unconsumed==undefined)
          err_on_unconsumed = true;
        if (data!=undefined)
          this.lexer.input(data);
        var ret=this.start(this);
        if (err_on_unconsumed&&!this.lexer.at_end()&&this.lexer.next()!=undefined) {
            this.error(undefined, "parser did not consume entire input");
        }
        return ret;
      }
       input(data) {
        this.lexer.input(data);
      }
       error(token, msg) {
        if (msg==undefined)
          msg = "";
        if (token==undefined)
          var estr="Parse error at end of input: "+msg;
        else 
          estr = "Parse error at line "+(token.lineno+1)+": "+msg;
        var buf="1| ";
        var ld=this.lexer.lexdata;
        var l=1;
        for (var i=0; i<ld.length; i++) {
            var c=ld[i];
            if (c=='\n') {
                l++;
                buf+="\n"+l+"| ";
            }
            else {
              buf+=c;
            }
        }
        console.log("------------------");
        console.log(buf);
        console.log("==================");
        console.log(estr);
        if (this.errfunc&&!this.errfunc(token)) {
            return ;
        }
        throw new PUTIL_ParseError(estr);
      }
       peek() {
        var tok=this.lexer.peek();
        if (tok!=undefined)
          tok.parser = this;
        return tok;
      }
       peeknext() {
        var tok=this.lexer.peeknext();
        if (tok!=undefined)
          tok.parser = this;
        return tok;
      }
       next() {
        var tok=this.lexer.next();
        if (tok!=undefined)
          tok.parser = this;
        return tok;
      }
       optional(type) {
        var tok=this.peek();
        if (tok==undefined)
          return false;
        if (tok.type==type) {
            this.next();
            return true;
        }
        return false;
      }
       at_end() {
        return this.lexer.at_end();
      }
       expect(type, msg) {
        var tok=this.next();
        if (msg==undefined)
          msg = type;
        if (tok==undefined||tok.type!=type) {
            this.error(tok, "Expected "+msg);
        }
        return tok.value;
      }
    }
    _ESClass.register(_export_parser_);
    function test_parser() {
      var basic_types=new set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string"]);
      var reserved_tokens=new set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string", "static_string", "array"]);
      function tk(name, re, func) {
        return new _export_tokdef_(name, re, func);
      }
      var tokens=[tk("ID", /[a-zA-Z]+[a-zA-Z0-9_]*/, function (t) {
        if (reserved_tokens.has(t.value)) {
            t.type = t.value.toUpperCase();
        }
        return t;
      }), tk("OPEN", /\{/), tk("CLOSE", /}/), tk("COLON", /:/), tk("JSCRIPT", /\|/, function (t) {
        var js="";
        var lexer=t.lexer;
        while (lexer.lexpos<lexer.lexdata.length) {
          var c=lexer.lexdata[lexer.lexpos];
          if (c=="\n")
            break;
          js+=c;
          lexer.lexpos++;
        }
        if (js.endsWith(";")) {
            js = js.slice(0, js.length-1);
            lexer.lexpos--;
        }
        t.value = js;
        return t;
      }), tk("LPARAM", /\(/), tk("RPARAM", /\)/), tk("COMMA", /,/), tk("NUM", /[0-9]/), tk("SEMI", /;/), tk("NEWLINE", /\n/, function (t) {
        t.lexer.lineno+=1;
      }), tk("SPACE", / |\t/, function (t) {
      })];
      var __iter_rt=__get_iter(reserved_tokens);
      var rt;
      while (1) {
        var __ival_rt=__iter_rt.next();
        if (__ival_rt.done) {
            break;
        }
        rt = __ival_rt.value;
        tokens.push(tk(rt.toUpperCase()));
      }
      var a="\n  Loop {\n    eid : int;\n    flag : int;\n    index : int;\n    type : int;\n\n    co : vec3;\n    no : vec3;\n    loop : int | eid(loop);\n    edges : array(e, int) | e.eid;\n\n    loops : array(Loop);\n  }\n  ";
      function errfunc(lexer) {
        return true;
      }
      var lex=new _export_lexer_(tokens, errfunc);
      console.log("Testing lexical scanner...");
      lex.input(a);
      var token;
      while (token = lex.next()) {
        console.log(token.toString());
      }
      var parser=new _export_parser_(lex);
      parser.input(a);
      function p_Array(p) {
        p.expect("ARRAY");
        p.expect("LPARAM");
        var arraytype=p_Type(p);
        var itername="";
        if (p.optional("COMMA")) {
            itername = arraytype;
            arraytype = p_Type(p);
        }
        p.expect("RPARAM");
        return {type: "array", 
      data: {type: arraytype, 
       iname: itername}}
      }
      function p_Type(p) {
        var tok=p.peek();
        if (tok.type=="ID") {
            p.next();
            return {type: "struct", 
        data: "\""+tok.value+"\""}
        }
        else 
          if (basic_types.has(tok.type.toLowerCase())) {
            p.next();
            return {type: tok.type.toLowerCase()}
        }
        else 
          if (tok.type=="ARRAY") {
            return p_Array(p);
        }
        else {
          p.error(tok, "invalid type "+tok.type);
        }
      }
      function p_Field(p) {
        var field={}
        console.log("-----", p.peek().type);
        field.name = p.expect("ID", "struct field name");
        p.expect("COLON");
        field.type = p_Type(p);
        field.set = undefined;
        field.get = undefined;
        var tok=p.peek();
        if (tok.type=="JSCRIPT") {
            field.get = tok.value;
            p.next();
        }
        tok = p.peek();
        if (tok.type=="JSCRIPT") {
            field.set = tok.value;
            p.next();
        }
        p.expect("SEMI");
        return field;
      }
      function p_Struct(p) {
        var st={}
        st.name = p.expect("ID", "struct name");
        st.fields = [];
        p.expect("OPEN");
        while (1) {
          if (p.at_end()) {
              p.error(undefined);
          }
          else 
            if (p.optional("CLOSE")) {
              break;
          }
          else {
            st.fields.push(p_Field(p));
          }
        }
        return st;
      }
      var ret=p_Struct(parser);
      console.log(JSON.stringify(ret));
    }
    var struct_parseutil=Object.freeze({__proto__: null, 
    get parser() {
        return _export_parser_;
      }, 
    token: _export_token_, 
    tokdef: _export_tokdef_, 
    PUTIL_ParseError: PUTIL_ParseError, 
    lexer: _export_lexer_});
    "use strict";
    var StructEnum={T_INT: 0, 
    T_FLOAT: 1, 
    T_DOUBLE: 2, 
    T_STRING: 7, 
    T_STATIC_STRING: 8, 
    T_STRUCT: 9, 
    T_TSTRUCT: 10, 
    T_ARRAY: 11, 
    T_ITER: 12, 
    T_SHORT: 13, 
    T_BYTE: 14, 
    T_BOOL: 15, 
    T_ITERKEYS: 16}
    var StructTypes={"int": StructEnum.T_INT, 
    "float": StructEnum.T_FLOAT, 
    "double": StructEnum.T_DOUBLE, 
    "string": StructEnum.T_STRING, 
    "static_string": StructEnum.T_STATIC_STRING, 
    "struct": StructEnum.T_STRUCT, 
    "abstract": StructEnum.T_TSTRUCT, 
    "array": StructEnum.T_ARRAY, 
    "iter": StructEnum.T_ITER, 
    "short": StructEnum.T_SHORT, 
    "byte": StructEnum.T_BYTE, 
    "bool": StructEnum.T_BOOL, 
    "iterkeys": StructEnum.T_ITERKEYS}
    var StructTypeMap={}
    for (var k in StructTypes) {
        StructTypeMap[StructTypes[k]] = k;
    }
    function gen_tabstr(t) {
      var s="";
      for (var i=0; i<t; i++) {
          s+="  ";
      }
      return s;
    }
    function StructParser() {
      var basic_types=new set$2(["int", "float", "double", "string", "short", "byte", "bool"]);
      var reserved_tokens=new set$2(["int", "float", "double", "string", "static_string", "array", "iter", "abstract", "short", "byte", "bool", "iterkeys"]);
      function tk(name, re, func) {
        return new _export_tokdef_(name, re, func);
      }
      var tokens=[tk("ID", /[a-zA-Z_]+[a-zA-Z0-9_\.]*/, function (t) {
        if (reserved_tokens.has(t.value)) {
            t.type = t.value.toUpperCase();
        }
        return t;
      }), tk("OPEN", /\{/), tk("EQUALS", /=/), tk("CLOSE", /}/), tk("COLON", /:/), tk("SOPEN", /\[/), tk("SCLOSE", /\]/), tk("JSCRIPT", /\|/, function (t) {
        var js="";
        var lexer=t.lexer;
        while (lexer.lexpos<lexer.lexdata.length) {
          var c=lexer.lexdata[lexer.lexpos];
          if (c=="\n")
            break;
          js+=c;
          lexer.lexpos++;
        }
        while (js.trim().endsWith(";")) {
          js = js.slice(0, js.length-1);
          lexer.lexpos--;
        }
        t.value = js.trim();
        return t;
      }), tk("LPARAM", /\(/), tk("RPARAM", /\)/), tk("COMMA", /,/), tk("NUM", /[0-9]+/), tk("SEMI", /;/), tk("NEWLINE", /\n/, function (t) {
        t.lexer.lineno+=1;
      }), tk("SPACE", / |\t/, function (t) {
      })];
      reserved_tokens.forEach(function (rt) {
        tokens.push(tk(rt.toUpperCase()));
      });
      function errfunc(lexer) {
        return true;
      }
      var lex=new _export_lexer_(tokens, errfunc);
      var parser=new _export_parser_(lex);
      function p_Static_String(p) {
        p.expect("STATIC_STRING");
        p.expect("SOPEN");
        var num=p.expect("NUM");
        p.expect("SCLOSE");
        return {type: StructEnum.T_STATIC_STRING, 
      data: {maxlength: num}}
      }
      function p_DataRef(p) {
        p.expect("DATAREF");
        p.expect("LPARAM");
        var tname=p.expect("ID");
        p.expect("RPARAM");
        return {type: StructEnum.T_DATAREF, 
      data: tname}
      }
      function p_Array(p) {
        p.expect("ARRAY");
        p.expect("LPARAM");
        var arraytype=p_Type(p);
        var itername="";
        if (p.optional("COMMA")) {
            itername = arraytype.data.replace(/"/g, "");
            arraytype = p_Type(p);
        }
        p.expect("RPARAM");
        return {type: StructEnum.T_ARRAY, 
      data: {type: arraytype, 
       iname: itername}}
      }
      function p_Iter(p) {
        p.expect("ITER");
        p.expect("LPARAM");
        var arraytype=p_Type(p);
        var itername="";
        if (p.optional("COMMA")) {
            itername = arraytype.data.replace(/"/g, "");
            arraytype = p_Type(p);
        }
        p.expect("RPARAM");
        return {type: StructEnum.T_ITER, 
      data: {type: arraytype, 
       iname: itername}}
      }
      function p_IterKeys(p) {
        p.expect("ITERKEYS");
        p.expect("LPARAM");
        var arraytype=p_Type(p);
        var itername="";
        if (p.optional("COMMA")) {
            itername = arraytype.data.replace(/"/g, "");
            arraytype = p_Type(p);
        }
        p.expect("RPARAM");
        return {type: StructEnum.T_ITERKEYS, 
      data: {type: arraytype, 
       iname: itername}}
      }
      function p_Abstract(p) {
        p.expect("ABSTRACT");
        p.expect("LPARAM");
        var type=p.expect("ID");
        p.expect("RPARAM");
        return {type: StructEnum.T_TSTRUCT, 
      data: type}
      }
      function p_Type(p) {
        var tok=p.peek();
        if (tok.type=="ID") {
            p.next();
            return {type: StructEnum.T_STRUCT, 
        data: tok.value}
        }
        else 
          if (basic_types.has(tok.type.toLowerCase())) {
            p.next();
            return {type: StructTypes[tok.type.toLowerCase()]}
        }
        else 
          if (tok.type=="ARRAY") {
            return p_Array(p);
        }
        else 
          if (tok.type=="ITER") {
            return p_Iter(p);
        }
        else 
          if (tok.type=="ITERKEYS") {
            return p_IterKeys(p);
        }
        else 
          if (tok.type=="STATIC_STRING") {
            return p_Static_String(p);
        }
        else 
          if (tok.type=="ABSTRACT") {
            return p_Abstract(p);
        }
        else 
          if (tok.type=="DATAREF") {
            return p_DataRef(p);
        }
        else {
          p.error(tok, "invalid type "+tok.type);
        }
      }
      function p_ID_or_num(p) {
        let t=p.peeknext();
        if (t.type=="NUM") {
            p.next();
            return t.value;
        }
        else {
          return p.expect("ID", "struct field name");
        }
      }
      function p_Field(p) {
        var field={}
        field.name = p_ID_or_num(p);
        p.expect("COLON");
        field.type = p_Type(p);
        field.set = undefined;
        field.get = undefined;
        let check=0;
        var tok=p.peek();
        if (tok.type=="JSCRIPT") {
            field.get = tok.value;
            check = 1;
            p.next();
        }
        tok = p.peek();
        if (tok.type=="JSCRIPT") {
            check = 1;
            field.set = tok.value;
            p.next();
        }
        p.expect("SEMI");
        return field;
      }
      function p_Struct(p) {
        var st={}
        st.name = p.expect("ID", "struct name");
        st.fields = [];
        st.id = -1;
        var tok=p.peek();
        var id=-1;
        if (tok.type=="ID"&&tok.value=="id") {
            p.next();
            p.expect("EQUALS");
            st.id = p.expect("NUM");
        }
        p.expect("OPEN");
        while (1) {
          if (p.at_end()) {
              p.error(undefined);
          }
          else 
            if (p.optional("CLOSE")) {
              break;
          }
          else {
            st.fields.push(p_Field(p));
          }
        }
        return st;
      }
      parser.start = p_Struct;
      return parser;
    }
    const _export_struct_parse_=StructParser();
    var struct_parser=Object.freeze({__proto__: null, 
    StructEnum: StructEnum, 
    StructTypes: StructTypes, 
    StructTypeMap: StructTypeMap, 
    struct_parse: _export_struct_parse_});
    let _export_manager_;
    "use strict";
    let warninglvl=2;
    var StructTypeMap$1=StructTypeMap;
    var StructTypes$1=StructTypes;
    var Class$4=Class;
    var struct_parse=_export_struct_parse_;
    var StructEnum$1=StructEnum;
    var _static_envcode_null="";
    var debug_struct=0;
    var packdebug_tablevel=0;
    function gen_tabstr$1(tot) {
      var ret="";
      for (var i=0; i<tot; i++) {
          ret+=" ";
      }
      return ret;
    }
    let packer_debug, packer_debug_start, packer_debug_end;
    if (debug_struct) {
        packer_debug = function (msg) {
          if (msg!==undefined) {
              var t=gen_tabstr$1(packdebug_tablevel);
              console.log(t+msg);
          }
          else {
            console.log("Warning: undefined msg");
          }
        };
        packer_debug_start = function (funcname) {
          packer_debug("Start "+funcname);
          packdebug_tablevel++;
        };
        packer_debug_end = function (funcname) {
          packdebug_tablevel--;
          packer_debug("Leave "+funcname);
        };
    }
    else {
      packer_debug = function () {
      };
      packer_debug_start = function () {
      };
      packer_debug_end = function () {
      };
    }
    const _export_setWarningMode_=(t) =>      {
      if (typeof t!=="number"||isNaN(t)) {
          throw new Error("Expected a single number (>= 0) argument to setWarningMode");
      }
      warninglvl = t;
    }
    const _export_setDebugMode_=(t) =>      {
      debug_struct = t;
      if (debug_struct) {
          packer_debug = function (msg) {
            if (msg!=undefined) {
                var t=gen_tabstr$1(packdebug_tablevel);
                console.log(t+msg);
            }
            else {
              console.log("Warning: undefined msg");
            }
          };
          packer_debug_start = function (funcname) {
            packer_debug("Start "+funcname);
            packdebug_tablevel++;
          };
          packer_debug_end = function (funcname) {
            packdebug_tablevel--;
            packer_debug("Leave "+funcname);
          };
      }
      else {
        packer_debug = function () {
        };
        packer_debug_start = function () {
        };
        packer_debug_end = function () {
        };
      }
    }
    var _ws_env=[[undefined, undefined]];
    var pack_callbacks=[function pack_int(data, val) {
      packer_debug("int "+val);
      _module_exports_.pack_int(data, val);
    }, function pack_float(data, val) {
      packer_debug("float "+val);
      _module_exports_.pack_float(data, val);
    }, function pack_double(data, val) {
      packer_debug("double "+val);
      _module_exports_.pack_double(data, val);
    }, 0, 0, 0, 0, function pack_string(data, val) {
      if (val==undefined)
        val = "";
      packer_debug("string: "+val);
      packer_debug("int "+val.length);
      _module_exports_.pack_string(data, val);
    }, function pack_static_string(data, val, obj, thestruct, field, type) {
      if (val==undefined)
        val = "";
      packer_debug("static_string: '"+val+"' length="+type.data.maxlength);
      _module_exports_.pack_static_string(data, val, type.data.maxlength);
    }, function pack_struct(data, val, obj, thestruct, field, type) {
      packer_debug_start("struct "+type.data);
      thestruct.write_struct(data, val, thestruct.get_struct(type.data));
      packer_debug_end("struct");
    }, function pack_tstruct(data, val, obj, thestruct, field, type) {
      var cls=thestruct.get_struct_cls(type.data);
      var stt=thestruct.get_struct(type.data);
      if (val.constructor.structName!=type.data&&(__instance_of(val, cls))) {
          stt = thestruct.get_struct(val.constructor.structName);
      }
      else 
        if (val.constructor.structName==type.data) {
          stt = thestruct.get_struct(type.data);
      }
      else {
        console.trace();
        throw new Error("Bad struct "+val.constructor.structName+" passed to write_struct");
      }
      if (stt.id==0) {
      }
      packer_debug_start("tstruct '"+stt.name+"'");
      packer_debug("int "+stt.id);
      _module_exports_.pack_int(data, stt.id);
      thestruct.write_struct(data, val, stt);
      packer_debug_end("tstruct");
    }, function pack_array(data, val, obj, thestruct, field, type) {
      packer_debug_start("array");
      if (val==undefined) {
          console.trace();
          console.log("Undefined array fed to struct struct packer!");
          console.log("Field: ", field);
          console.log("Type: ", type);
          console.log("");
          packer_debug("int 0");
          _module_exports_.pack_int(data, 0);
          return ;
      }
      packer_debug("int "+val.length);
      _module_exports_.pack_int(data, val.length);
      var d=type.data;
      var itername=d.iname;
      var type2=d.type;
      var env=_ws_env;
      for (var i=0; i<val.length; i++) {
          var val2=val[i];
          if (itername!=""&&itername!=undefined&&field.get) {
              env[0][0] = itername;
              env[0][1] = val2;
              val2 = thestruct._env_call(field.get, obj, env);
          }
          var f2={type: type2, 
       get: undefined, 
       set: undefined};
          do_pack(data, val2, obj, thestruct, f2, type2);
      }
      packer_debug_end("array");
    }, function pack_iter(data, val, obj, thestruct, field, type) {
      packer_debug_start("iter");
      function forEach(cb, thisvar) {
        if (val&&val[Symbol.iterator]) {
            for (let item of val) {
                cb.call(thisvar, item);
            }
        }
        else 
          if (val&&val.forEach) {
            val.forEach(function (item) {
              cb.call(thisvar, item);
            });
        }
        else {
          console.trace();
          console.log("Undefined iterable list fed to struct struct packer!", val);
          console.log("Field: ", field);
          console.log("Type: ", type);
          console.log("");
        }
      }
      let len=0.0;
      forEach(() =>        {
        len++;
      });
      packer_debug("int "+len);
      _module_exports_.pack_int(data, len);
      var d=type.data, itername=d.iname, type2=d.type;
      var env=_ws_env;
      var i=0;
      forEach(function (val2) {
        if (i>=len) {
            if (warninglvl>0)
              console.trace("Warning: iterator returned different length of list!", val, i);
            return ;
        }
        if (itername!=""&&itername!=undefined&&field.get) {
            env[0][0] = itername;
            env[0][1] = val2;
            val2 = thestruct._env_call(field.get, obj, env);
        }
        var f2={type: type2, 
      get: undefined, 
      set: undefined}
        do_pack(data, val2, obj, thestruct, f2, type2);
        i++;
      }, this);
      packer_debug_end("iter");
    }, function pack_short(data, val) {
      packer_debug("short "+val);
      _module_exports_.pack_short(data, Math.floor(val));
    }, function pack_byte(data, val) {
      packer_debug("byte "+val);
      _module_exports_.pack_byte(data, Math.floor(val));
    }, function pack_bool(data, val) {
      packer_debug("bool "+val);
      _module_exports_.pack_byte(data, !!val);
    }, function pack_iterkeys(data, val, obj, thestruct, field, type) {
      packer_debug_start("iterkeys");
      if ((typeof val!=="object"&&typeof val!=="function")||val===null) {
          console.warn("Bad object fed to iterkeys in struct packer!", val);
          console.log("Field: ", field);
          console.log("Type: ", type);
          console.log("");
          _module_exports_.pack_int(data, 0);
          packer_debug_end("iterkeys");
          return ;
      }
      let len=0.0;
      for (let k in val) {
          len++;
      }
      packer_debug("int "+len);
      _module_exports_.pack_int(data, len);
      var d=type.data, itername=d.iname, type2=d.type;
      var env=_ws_env;
      var i=0;
      for (let val2 in val) {
          if (i>=len) {
              if (warninglvl>0)
                console.warn("Warning: object keys magically replaced on us", val, i);
              return ;
          }
          if (itername&&itername.trim().length>0&&field.get) {
              env[0][0] = itername;
              env[0][1] = val2;
              val2 = thestruct._env_call(field.get, obj, env);
          }
          else {
            val2 = val[val2];
          }
          var f2={type: type2, 
       get: undefined, 
       set: undefined};
          do_pack(data, val2, obj, thestruct, f2, type2);
          i++;
      }
      packer_debug_end("iterkeys");
    }];
    function do_pack(data, val, obj, thestruct, field, type) {
      pack_callbacks[field.type.type](data, val, obj, thestruct, field, type);
    }
    function define_empty_class(name) {
      var cls=function () {
      }
      cls.prototype = Object.create(Object.prototype);
      cls.constructor = cls.prototype.constructor = cls;
      cls.STRUCT = name+" {\n  }\n";
      cls.structName = name;
      cls.prototype.loadSTRUCT = function (reader) {
        reader(this);
      }
      cls.newSTRUCT = function () {
        return new this();
      }
      return cls;
    }
    var STRUCT=class STRUCT  {
       constructor() {
        this.idgen = new IDGen();
        this.structs = {};
        this.struct_cls = {};
        this.struct_ids = {};
        this.compiled_code = {};
        this.null_natives = {};
        function define_null_native(name, cls) {
          var obj=define_empty_class(name);
          var stt=struct_parse.parse(obj.STRUCT);
          stt.id = this.idgen.gen_id();
          this.structs[name] = stt;
          this.struct_cls[name] = cls;
          this.struct_ids[stt.id] = stt;
          this.null_natives[name] = 1;
        }
        define_null_native.call(this, "Object", Object);
      }
       forEach(func, thisvar) {
        for (var k in this.structs) {
            var stt=this.structs[k];
            if (thisvar!=undefined)
              func.call(thisvar, stt);
            else 
              func(stt);
        }
      }
       parse_structs(buf, defined_classes) {
        if (defined_classes===undefined) {
            defined_classes = _export_manager_;
        }
        if (__instance_of(defined_classes, STRUCT)) {
            var struct2=defined_classes;
            defined_classes = [];
            for (var k in struct2.struct_cls) {
                defined_classes.push(struct2.struct_cls[k]);
            }
        }
        if (defined_classes==undefined) {
            defined_classes = [];
            for (var k in _export_manager_.struct_cls) {
                defined_classes.push(_export_manager_.struct_cls[k]);
            }
        }
        var clsmap={};
        for (var i=0; i<defined_classes.length; i++) {
            var cls=defined_classes[i];
            if (cls.structName==undefined&&cls.STRUCT!=undefined) {
                var stt=struct_parse.parse(cls.STRUCT.trim());
                cls.structName = stt.name;
            }
            else 
              if (cls.structName==undefined&&cls.name!="Object") {
                if (warninglvl>0)
                  console.log("Warning, bad class in registered class list", cls.name, cls);
                continue;
            }
            clsmap[cls.structName] = defined_classes[i];
        }
        struct_parse.input(buf);
        while (!struct_parse.at_end()) {
          var stt=struct_parse.parse(undefined, false);
          if (!(stt.name in clsmap)) {
              if (!(stt.name in this.null_natives))
                if (warninglvl>0)
                console.log("WARNING: struct "+stt.name+" is missing from class list.");
              var dummy=define_empty_class(stt.name);
              dummy.STRUCT = STRUCT.fmt_struct(stt);
              dummy.structName = stt.name;
              dummy.prototype.structName = dummy.name;
              this.struct_cls[dummy.structName] = dummy;
              this.structs[dummy.structName] = stt;
              if (stt.id!=-1)
                this.struct_ids[stt.id] = stt;
          }
          else {
            this.struct_cls[stt.name] = clsmap[stt.name];
            this.structs[stt.name] = stt;
            if (stt.id!=-1)
              this.struct_ids[stt.id] = stt;
          }
          var tok=struct_parse.peek();
          while (tok!=undefined&&(tok.value=="\n"||tok.value=="\r"||tok.value=="\t"||tok.value==" ")) {
            tok = struct_parse.peek();
          }
        }
      }
       register(cls, structName) {
        return this.add_class(cls, structName);
      }
       add_class(cls, structName) {
        if (cls.STRUCT) {
            let bad=false;
            let p=cls;
            while (p) {
              p = p.__proto__;
              if (p&&p.STRUCT&&p.STRUCT===cls.STRUCT) {
                  bad = true;
                  break;
              }
            }
            if (bad) {
                console.warn("Generating STRUCT script for derived class "+cls.name);
                if (!structName) {
                    structName = cls.name;
                }
                cls.STRUCT = STRUCT.inherit(cls, p)+`\n}`;
            }
        }
        if (!cls.STRUCT) {
            throw new Error("class "+cls.name+" has no STRUCT script");
        }
        var stt=struct_parse.parse(cls.STRUCT);
        cls.structName = stt.name;
        if (cls.newSTRUCT===undefined) {
            cls.newSTRUCT = function () {
              return new this();
            };
        }
        if (structName!==undefined) {
            stt.name = cls.structName = structName;
        }
        else 
          if (cls.structName===undefined) {
            cls.structName = stt.name;
        }
        else 
          if (cls.structName!==undefined) {
            stt.name = cls.structName;
        }
        else {
          throw new Error("Missing structName parameter");
        }
        if (stt.id==-1)
          stt.id = this.idgen.gen_id();
        this.structs[cls.structName] = stt;
        this.struct_cls[cls.structName] = cls;
        this.struct_ids[stt.id] = stt;
      }
       get_struct_id(id) {
        return this.struct_ids[id];
      }
       get_struct(name) {
        if (!(name in this.structs)) {
            console.trace();
            throw new Error("Unknown struct "+name);
        }
        return this.structs[name];
      }
       get_struct_cls(name) {
        if (!(name in this.struct_cls)) {
            console.trace();
            throw new Error("Unknown struct "+name);
        }
        return this.struct_cls[name];
      }
      static  inherit(child, parent, structName=child.name) {
        if (!parent.STRUCT) {
            return structName+"{\n";
        }
        var stt=struct_parse.parse(parent.STRUCT);
        var code=structName+"{\n";
        code+=STRUCT.fmt_struct(stt, true);
        return code;
      }
      static  Super(obj, reader) {
        if (warninglvl>0)
          console.warn("deprecated");
        reader(obj);
        function reader2(obj) {
        }
        let cls=obj.constructor;
        let bad=cls===undefined||cls.prototype===undefined||cls.prototype.__proto__===undefined;
        if (bad) {
            return ;
        }
        let parent=cls.prototype.__proto__.constructor;
        bad = bad||parent===undefined;
        if (!bad&&parent.prototype.loadSTRUCT&&parent.prototype.loadSTRUCT!==obj.loadSTRUCT) {
            parent.prototype.loadSTRUCT.call(obj, reader2);
        }
      }
      static  chain_fromSTRUCT(cls, reader) {
        if (warninglvl>0)
          console.warn("Using deprecated (and evil) chain_fromSTRUCT method, eek!");
        var proto=cls.prototype;
        var parent=cls.prototype.prototype.constructor;
        var obj=parent.fromSTRUCT(reader);
        let obj2=new cls();
        let keys=Object.keys(obj).concat(Object.getOwnPropertySymbols(obj));
        for (var i=0; i<keys.length; i++) {
            let k=keys[i];
            try {
              obj2[k] = obj[k];
            }
            catch (error) {
                if (warninglvl>0)
                  console.warn("  failed to set property", k);
            }
        }
        return obj2;
      }
      static  formatStruct(stt, internal_only, no_helper_js) {
        return this.fmt_struct(stt, internal_only, no_helper_js);
      }
      static  fmt_struct(stt, internal_only, no_helper_js) {
        if (internal_only==undefined)
          internal_only = false;
        if (no_helper_js==undefined)
          no_helper_js = false;
        var s="";
        if (!internal_only) {
            s+=stt.name;
            if (stt.id!=-1)
              s+=" id="+stt.id;
            s+=" {\n";
        }
        var tab="  ";
        function fmt_type(type) {
          if (type.type==StructEnum$1.T_ARRAY||type.type==StructEnum$1.T_ITER||type.type===StructEnum$1.T_ITERKEYS) {
              if (type.data.iname!=""&&type.data.iname!=undefined) {
                  return "array("+type.data.iname+", "+fmt_type(type.data.type)+")";
              }
              else {
                return "array("+fmt_type(type.data.type)+")";
              }
          }
          else 
            if (type.type==StructEnum$1.T_STATIC_STRING) {
              return "static_string["+type.data.maxlength+"]";
          }
          else 
            if (type.type==StructEnum$1.T_STRUCT) {
              return type.data;
          }
          else 
            if (type.type==StructEnum$1.T_TSTRUCT) {
              return "abstract("+type.data+")";
          }
          else {
            return StructTypeMap$1[type.type];
          }
        }
        var fields=stt.fields;
        for (var i=0; i<fields.length; i++) {
            var f=fields[i];
            s+=tab+f.name+" : "+fmt_type(f.type);
            if (!no_helper_js&&f.get!=undefined) {
                s+=" | "+f.get.trim();
            }
            s+=";\n";
        }
        if (!internal_only)
          s+="}";
        return s;
      }
       _env_call(code, obj, env) {
        var envcode=_static_envcode_null;
        if (env!=undefined) {
            envcode = "";
            for (var i=0; i<env.length; i++) {
                envcode = "var "+env[i][0]+" = env["+i.toString()+"][1];\n"+envcode;
            }
        }
        var fullcode="";
        if (envcode!==_static_envcode_null)
          fullcode = envcode+code;
        else 
          fullcode = code;
        var func;
        if (!(fullcode in this.compiled_code)) {
            var code2="func = function(obj, env) { "+envcode+"return "+code+"}";
            try {
              func = _structEval(code2);
            }
            catch (err) {
                _export_print_stack_(err);
                console.log(code2);
                console.log(" ");
                throw err;
            }
            this.compiled_code[fullcode] = func;
        }
        else {
          func = this.compiled_code[fullcode];
        }
        try {
          return func.call(obj, obj, env);
        }
        catch (err) {
            _export_print_stack_(err);
            var code2="func = function(obj, env) { "+envcode+"return "+code+"}";
            console.log(code2);
            console.log(" ");
            throw err;
        }
      }
       write_struct(data, obj, stt) {
        function use_helper_js(field) {
          if (field.type.type==StructEnum$1.T_ARRAY||field.type.type==StructEnum$1.T_ITER||field.type.type==StructEnum$1.T_ITERKEYS) {
              return field.type.data.iname==undefined||field.type.data.iname=="";
          }
          return true;
        }
        var fields=stt.fields;
        var thestruct=this;
        for (var i=0; i<fields.length; i++) {
            var f=fields[i];
            var t1=f.type;
            var t2=t1.type;
            if (use_helper_js(f)) {
                var val;
                var type=t2;
                if (f.get!=undefined) {
                    val = thestruct._env_call(f.get, obj);
                }
                else {
                  val = obj[f.name];
                }
                do_pack(data, val, obj, thestruct, f, t1);
            }
            else {
              var val=obj[f.name];
              do_pack(data, val, obj, thestruct, f, t1);
            }
        }
      }
       write_object(data, obj) {
        var cls=obj.constructor.structName;
        var stt=this.get_struct(cls);
        if (data===undefined) {
            data = [];
        }
        this.write_struct(data, obj, stt);
        return data;
      }
       read_object(data, cls_or_struct_id, uctx) {
        var cls, stt;
        if (__instance_of(data, Array)) {
            data = new DataView(new Uint8Array(data).buffer);
        }
        if (typeof cls_or_struct_id=="number") {
            cls = this.struct_cls[this.struct_ids[cls_or_struct_id].name];
        }
        else {
          cls = cls_or_struct_id;
        }
        if (cls===undefined) {
            throw new Error("bad cls_or_struct_id "+cls_or_struct_id);
        }
        stt = this.structs[cls.structName];
        if (uctx==undefined) {
            uctx = new _module_exports_.unpack_context();
            packer_debug("\n\n=Begin reading "+cls.structName+"=");
        }
        var thestruct=this;
        var unpack_funcs=[function t_int(type) {
          var ret=_module_exports_.unpack_int(data, uctx);
          packer_debug("-int "+(debug_struct>1 ? ret : ""));
          return ret;
        }, function t_float(type) {
          var ret=_module_exports_.unpack_float(data, uctx);
          packer_debug("-float "+(debug_struct>1 ? ret : ""));
          return ret;
        }, function t_double(type) {
          var ret=_module_exports_.unpack_double(data, uctx);
          packer_debug("-double "+(debug_struct>1 ? ret : ""));
          return ret;
        }, 0, 0, 0, 0, function t_string(type) {
          packer_debug_start("string");
          var s=_module_exports_.unpack_string(data, uctx);
          packer_debug("data: '"+s+"'");
          packer_debug_end("string");
          return s;
        }, function t_static_string(type) {
          packer_debug_start("static_string");
          var s=_module_exports_.unpack_static_string(data, uctx, type.data.maxlength);
          packer_debug("data: '"+s+"'");
          packer_debug_end("static_string");
          return s;
        }, function t_struct(type) {
          packer_debug_start("struct "+type.data);
          var cls2=thestruct.get_struct_cls(type.data);
          var ret=thestruct.read_object(data, cls2, uctx);
          packer_debug_end("struct");
          return ret;
        }, function t_tstruct(type) {
          packer_debug_start("tstruct");
          var id=_module_exports_.unpack_int(data, uctx);
          packer_debug("-int "+id);
          if (!(id in thestruct.struct_ids)) {
              packer_debug("struct id: "+id);
              console.trace();
              console.log(id);
              console.log(thestruct.struct_ids);
              packer_debug_end("tstruct");
              throw new Error("Unknown struct type "+id+".");
          }
          var cls2=thestruct.get_struct_id(id);
          packer_debug("struct name: "+cls2.name);
          cls2 = thestruct.struct_cls[cls2.name];
          var ret=thestruct.read_object(data, cls2, uctx);
          packer_debug_end("tstruct");
          return ret;
        }, function t_array(type) {
          packer_debug_start("array");
          var len=_module_exports_.unpack_int(data, uctx);
          packer_debug("-int "+len);
          var arr=new Array(len);
          for (var i=0; i<len; i++) {
              arr[i] = unpack_field(type.data.type);
          }
          packer_debug_end("array");
          return arr;
        }, function t_iter(type) {
          packer_debug_start("iter");
          var len=_module_exports_.unpack_int(data, uctx);
          packer_debug("-int "+len);
          var arr=new Array(len);
          for (var i=0; i<len; i++) {
              arr[i] = unpack_field(type.data.type);
          }
          packer_debug_end("iter");
          return arr;
        }, function t_short(type) {
          var ret=_module_exports_.unpack_short(data, uctx);
          packer_debug("-short "+ret);
          return ret;
        }, function t_byte(type) {
          var ret=_module_exports_.unpack_byte(data, uctx);
          packer_debug("-byte "+ret);
          return ret;
        }, function t_bool(type) {
          var ret=_module_exports_.unpack_byte(data, uctx);
          packer_debug("-bool "+ret);
          return !!ret;
        }, function t_iterkeys(type) {
          packer_debug_start("iterkeys");
          var len=_module_exports_.unpack_int(data, uctx);
          packer_debug("-int "+len);
          var arr=new Array(len);
          for (var i=0; i<len; i++) {
              arr[i] = unpack_field(type.data.type);
          }
          packer_debug_end("iterkeys");
          return arr;
        }];
        function unpack_field(type) {
          return unpack_funcs[type.type](type);
        }
        let was_run=false;
        function load(obj) {
          if (was_run) {
              return ;
          }
          was_run = true;
          var fields=stt.fields;
          var flen=fields.length;
          for (var i=0; i<flen; i++) {
              var f=fields[i];
              var val=unpack_field(f.type);
              obj[f.name] = val;
          }
        }
        if (cls.prototype.loadSTRUCT!==undefined) {
            let obj;
            if (cls.newSTRUCT!==undefined) {
                obj = cls.newSTRUCT();
            }
            else {
              obj = new cls();
            }
            obj.loadSTRUCT(load);
            return obj;
        }
        else 
          if (cls.fromSTRUCT!==undefined) {
            if (warninglvl>1)
              console.warn("Warning: class "+cls.name+" is using deprecated fromSTRUCT interface; use newSTRUCT/loadSTRUCT instead");
            return cls.fromSTRUCT(load);
        }
        else {
          let obj;
          if (cls.newSTRUCT!==undefined) {
              obj = cls.newSTRUCT();
          }
          else {
            obj = new cls();
          }
          load(obj);
          return obj;
        }
      }
    }
    _ESClass.register(STRUCT);
    var manager=_export_manager_ = new STRUCT();
    var write_scripts=function write_scripts(manager, include_code) {
      if (include_code===undefined) {
          include_code = false;
      }
      if (manager===undefined)
        manager = _export_manager_;
      var buf="";
      manager.forEach(function (stt) {
        buf+=STRUCT.fmt_struct(stt, false, !include_code)+"\n";
      });
      var buf2=buf;
      buf = "";
      for (var i=0; i<buf2.length; i++) {
          var c=buf2[i];
          if (c==="\n") {
              buf+="\n";
              var i2=i;
              while (i<buf2.length&&(buf2[i]===" "||buf2[i]==="\t"||buf2[i]==="\n")) {
                i++;
              }
              if (i!==i2)
                i--;
          }
          else {
            buf+=c;
          }
      }
      return buf;
    }
    var struct_intern=Object.freeze({__proto__: null, 
    get manager() {
        return _export_manager_;
      }, 
    setWarningMode: _export_setWarningMode_, 
    setDebugMode: _export_setDebugMode_, 
    STRUCT: STRUCT, 
    write_scripts: write_scripts});
    "use strict";
    if (typeof btoa==="undefined") {
        _nGlobal.btoa = function btoa(str) {
          let buffer=new Buffer(""+str, 'binary');
          return buffer.toString('base64');
        };
        _nGlobal.atob = function atob(str) {
          return new Buffer(str, 'base64').toString('binary');
        };
    }
    const _export_versionToInt_=function (v) {
      v = _export_versionCoerce_(v);
      let mul=64;
      return ~~(v.major*mul*mul*mul+v.minor*mul*mul+v.micro*mul);
    }
    let ver_pat=/[0-9]+\.[0-9]+\.[0-9]+$/;
    const _export_versionCoerce_=function (v) {
      if (!v) {
          throw new Error("empty version: "+v);
      }
      if (typeof v==="string") {
          if (!ver_pat.exec(v)) {
              throw new Error("invalid version string "+v);
          }
          let ver=v.split(".");
          return {major: parseInt(ver[0]), 
       minor: parseInt(ver[1]), 
       micro: parseInt(ver[2])}
      }
      else 
        if (Array.isArray(v)) {
          return {major: v[0], 
       minor: v[1], 
       micro: v[2]}
      }
      else 
        if (typeof v==="object") {
          let test=(k) =>            {
            return k in v&&typeof v[k]==="number";
          };
          if (!test("major")||!test("minor")||!test("micro")) {
              throw new Error("invalid version object: "+v);
          }
          return v;
      }
      else {
        throw new Error("invalid version "+v);
      }
    }
    const _export_versionLessThan_=function (a, b) {
      return _export_versionToInt_(a)<_export_versionToInt_(b);
    }
    let versionLessThan=_export_versionLessThan_;
    let FileParams=class FileParams  {
       constructor() {
        this.magic = "STRT";
        this.ext = ".bin";
        this.blocktypes = ["DATA"];
        this.version = {major: 0, 
      minor: 0, 
      micro: 1};
      }
    }
    _ESClass.register(FileParams);
    let Block=class Block  {
       constructor(type_magic, data) {
        this.type = type_magic;
        this.data = data;
      }
    }
    _ESClass.register(Block);
    let FileError=class FileeError extends Error {
    }
    _ESClass.register(FileError);
    let FileHelper=class FileHelper  {
       constructor(params) {
        if (params===undefined) {
            params = new FileParams();
        }
        else {
          let fp=new FileParams();
          for (let k in params) {
              fp[k] = params[k];
          }
          params = fp;
        }
        this.version = params.version;
        this.blocktypes = params.blocktypes;
        this.magic = params.magic;
        this.ext = params.ext;
        this.struct = undefined;
        this.unpack_ctx = undefined;
      }
       read(dataview) {
        this.unpack_ctx = new _module_exports_.unpack_context();
        let magic=_module_exports_.unpack_static_string(dataview, this.unpack_ctx, 4);
        if (magic!==this.magic) {
            throw new FileError("corrupted file");
        }
        this.version = {};
        this.version.major = _module_exports_.unpack_short(dataview, this.unpack_ctx);
        this.version.minor = _module_exports_.unpack_byte(dataview, this.unpack_ctx);
        this.version.micro = _module_exports_.unpack_byte(dataview, this.unpack_ctx);
        let struct=this.struct = new STRUCT();
        let scripts=_module_exports_.unpack_string(dataview, this.unpack_ctx);
        this.struct.parse_structs(scripts, _export_manager_);
        let blocks=[];
        let dviewlen=dataview.buffer.byteLength;
        while (this.unpack_ctx.i<dviewlen) {
          let type=_module_exports_.unpack_static_string(dataview, this.unpack_ctx, 4);
          let datalen=_module_exports_.unpack_int(dataview, this.unpack_ctx);
          let bstruct=_module_exports_.unpack_int(dataview, this.unpack_ctx);
          let bdata;
          if (bstruct==-2) {
              bdata = _module_exports_.unpack_static_string(dataview, this.unpack_ctx, datalen);
          }
          else {
            bdata = _module_exports_.unpack_bytes(dataview, this.unpack_ctx, datalen);
            bdata = struct.read_object(bdata, bstruct, new _module_exports_.unpack_context());
          }
          let block=new Block();
          block.type = type;
          block.data = bdata;
          blocks.push(block);
        }
        this.blocks = blocks;
        return blocks;
      }
       doVersions(old) {
        let blocks=this.blocks;
        if (versionLessThan(old, "0.0.1")) {
        }
      }
       write(blocks) {
        this.struct = _export_manager_;
        this.blocks = blocks;
        let data=[];
        _module_exports_.pack_static_string(data, this.magic, 4);
        _module_exports_.pack_short(data, this.version.major);
        _module_exports_.pack_byte(data, this.version.minor&255);
        _module_exports_.pack_byte(data, this.version.micro&255);
        let scripts=write_scripts();
        _module_exports_.pack_string(data, scripts);
        let struct=this.struct;
        for (let block of blocks) {
            if (typeof block.data==="string") {
                _module_exports_.pack_static_string(data, block.type, 4);
                _module_exports_.pack_int(data, block.data.length);
                _module_exports_.pack_int(data, -2);
                _module_exports_.pack_static_string(data, block.data, block.data.length);
                continue;
            }
            let structName=block.data.constructor.structName;
            if (structName===undefined||!(structName in struct.structs)) {
                throw new Error("Non-STRUCTable object "+block.data);
            }
            let data2=[];
            let stt=struct.structs[structName];
            struct.write_object(data2, block.data);
            _module_exports_.pack_static_string(data, block.type, 4);
            _module_exports_.pack_int(data, data2.length);
            _module_exports_.pack_int(data, stt.id);
            _module_exports_.pack_bytes(data, data2);
        }
        return new DataView(new Uint8Array(data).buffer);
      }
       writeBase64(blocks) {
        let dataview=this.write(blocks);
        let str="";
        let bytes=new Uint8Array(dataview.buffer);
        for (let i=0; i<bytes.length; i++) {
            str+=String.fromCharCode(bytes[i]);
        }
        return btoa(str);
      }
       makeBlock(type, data) {
        return new Block(type, data);
      }
       readBase64(base64) {
        let data=atob(base64);
        let data2=new Uint8Array(data.length);
        for (let i=0; i<data.length; i++) {
            data2[i] = data.charCodeAt(i);
        }
        return this.read(new DataView(data2.buffer));
      }
    }
    _ESClass.register(FileHelper);
    var struct_filehelper=Object.freeze({__proto__: null, 
    versionToInt: _export_versionToInt_, 
    versionCoerce: _export_versionCoerce_, 
    versionLessThan: _export_versionLessThan_, 
    FileParams: FileParams, 
    Block: Block, 
    FileError: FileError, 
    FileHelper: FileHelper});
    if (typeof window!=="undefined") {
        window._nGlobal = window;
    }
    else 
      if (typeof self!=="undefined") {
        self._nGlobal = self;
    }
    else {
      global._nGlobal = global;
    }
    _nGlobal._structEval = eval;
    const _module_exports_$1={}
    Object.defineProperty(_module_exports_$1, "STRUCT_ENDIAN", {get: function () {
        return _module_exports_.STRUCT_ENDIAN;
      }, 
    set: function (val) {
        _module_exports_.STRUCT_ENDIAN = val;
      }});
    for (let k in struct_intern) {
        _module_exports_$1[k] = struct_intern[k];
    }
    var StructTypeMap$2=StructTypeMap;
    var StructTypes$2=StructTypes;
    var Class$5=Class;
    for (var k$1 in struct_intern) {
        _module_exports_$1[k$1] = struct_intern[k$1];
    }
    _module_exports_$1.register = function register(cls, structName) {
      return _module_exports_$1.manager.register(cls, structName);
    }
    _module_exports_$1.inherit = function (child, parent, structName) {
      if (structName===undefined) {
          structName = child.name;
      }
      return _module_exports_$1.STRUCT.inherit(...arguments);
    }
    _module_exports_$1.setDebugMode = _export_setDebugMode_;
    _module_exports_$1.setWarningMode = _export_setWarningMode_;
    _module_exports_$1.useTinyEval = () =>      {    }
    _module_exports_$1.binpack = _module_exports_;
    _module_exports_$1.util = struct_util;
    _module_exports_$1.typesystem = struct_typesystem;
    _module_exports_$1.parseutil = struct_parseutil;
    _module_exports_$1.parser = struct_parser;
    _module_exports_$1.filehelper = struct_filehelper;
    module.exports = _module_exports_$1;
    if (!(typeof window==="undefined"&&typeof global!=="undefined")) {
        _nGlobal.nstructjs = module.exports;
        _nGlobal.module = undefined;
    }
    return exports;
  })();
}, '/dev/fairmotion/src/path.ux/scripts/util/nstructjs.js');
es6_module_define('parseutil', [], function _parseutil_module(_es6_module) {
  class token  {
     constructor(type, val, lexpos, lexlen, lineno, lexer, parser) {
      this.type = type;
      this.value = val;
      this.lexpos = lexpos;
      this.lexlen = lexlen;
      this.lineno = lineno;
      this.lexer = lexer;
      this.parser = parser;
    }
     toString() {
      if (this.value!=undefined)
        return "token(type="+this.type+", value='"+this.value+"')";
      else 
        return "token(type="+this.type+")";
    }
  }
  _ESClass.register(token);
  _es6_module.add_class(token);
  token = _es6_module.add_export('token', token);
  class tokdef  {
     constructor(name, regexpr, func) {
      this.name = name;
      this.re = regexpr;
      this.func = func;
    }
  }
  _ESClass.register(tokdef);
  _es6_module.add_class(tokdef);
  tokdef = _es6_module.add_export('tokdef', tokdef);
  class PUTLParseError extends Error {
  }
  _ESClass.register(PUTLParseError);
  _es6_module.add_class(PUTLParseError);
  PUTLParseError = _es6_module.add_export('PUTLParseError', PUTLParseError);
  class lexer  {
     constructor(tokdef, errfunc) {
      this.tokdef = tokdef;
      this.tokens = new Array();
      this.lexpos = 0;
      this.lexdata = "";
      this.lineno = 0;
      this.errfunc = errfunc;
      this.tokints = {};
      for (var i=0; i<tokdef.length; i++) {
          this.tokints[tokdef[i].name] = i;
      }
      this.statestack = [["__main__", 0]];
      this.states = {"__main__": [tokdef, errfunc]};
      this.statedata = 0;
    }
     add_state(name, tokdef, errfunc) {
      if (errfunc==undefined) {
          errfunc = function (lexer) {
            return true;
          };
      }
      this.states[name] = [tokdef, errfunc];
    }
     tok_int(name) {

    }
     push_state(state, statedata) {
      this.statestack.push([state, statedata]);
      state = this.states[state];
      this.statedata = statedata;
      this.tokdef = state[0];
      this.errfunc = state[1];
    }
     pop_state() {
      var item=this.statestack[this.statestack.length-1];
      var state=this.states[item[0]];
      this.tokdef = state[0];
      this.errfunc = state[1];
      this.statedata = item[1];
    }
     input(str) {
      while (this.statestack.length>1) {
        this.pop_state();
      }
      this.lexdata = str;
      this.lexpos = 0;
      this.lineno = 0;
      this.tokens = new Array();
      this.peeked_tokens = [];
    }
     error() {
      if (this.errfunc!=undefined&&!this.errfunc(this))
        return ;
      console.log("Syntax error near line "+this.lineno);
      var next=Math.min(this.lexpos+8, this.lexdata.length);
      console.log("  "+this.lexdata.slice(this.lexpos, next));
      throw new PUTLParseError("Parse error");
    }
     peek() {
      var tok=this.next(true);
      if (tok==undefined)
        return undefined;
      this.peeked_tokens.push(tok);
      return tok;
    }
     peek_i(i) {
      while (this.peeked_tokens.length<=i) {
        var t=this.peek();
        if (t==undefined)
          return undefined;
      }
      return this.peeked_tokens[i];
    }
     at_end() {
      return this.lexpos>=this.lexdata.length&&this.peeked_tokens.length==0;
    }
     next(ignore_peek) {
      if (ignore_peek!=true&&this.peeked_tokens.length>0) {
          var tok=this.peeked_tokens[0];
          this.peeked_tokens.shift();
          return tok;
      }
      if (this.lexpos>=this.lexdata.length)
        return undefined;
      var ts=this.tokdef;
      var tlen=ts.length;
      var lexdata=this.lexdata.slice(this.lexpos, this.lexdata.length);
      var results=[];
      for (var i=0; i<tlen; i++) {
          var t=ts[i];
          if (t.re==undefined)
            continue;
          var res=t.re.exec(lexdata);
          if (res!=null&&res!=undefined&&res.index==0) {
              results.push([t, res]);
          }
      }
      var max_res=0;
      var theres=undefined;
      for (var i=0; i<results.length; i++) {
          var res=results[i];
          if (res[1][0].length>max_res) {
              theres = res;
              max_res = res[1][0].length;
          }
      }
      if (theres==undefined) {
          this.error();
          return ;
      }
      var def=theres[0];
      var lexlen=max_res;
      var tok=new token(def.name, theres[1][0], this.lexpos, lexlen, this.lineno, this, undefined);
      this.lexpos+=max_res;
      if (def.func) {
          tok = def.func(tok);
          if (tok==undefined) {
              return this.next();
          }
      }
      return tok;
    }
  }
  _ESClass.register(lexer);
  _es6_module.add_class(lexer);
  lexer = _es6_module.add_export('lexer', lexer);
  class parser  {
     constructor(lexer, errfunc) {
      this.lexer = lexer;
      this.errfunc = errfunc;
      this.start = undefined;
    }
     parse(data, err_on_unconsumed) {
      if (err_on_unconsumed==undefined)
        err_on_unconsumed = true;
      if (data!=undefined)
        this.lexer.input(data);
      var ret=this.start(this);
      if (err_on_unconsumed&&!this.lexer.at_end()&&this.lexer.next()!=undefined) {
          this.error(undefined, "parser did not consume entire input");
      }
      return ret;
    }
     input(data) {
      this.lexer.input(data);
    }
     error(tok, msg) {
      if (msg==undefined)
        msg = "";
      if (tok==undefined)
        var estr="Parse error at end of input: "+msg;
      else 
        estr = "Parse error at line "+(tok.lineno+1)+": "+msg;
      var buf="1| ";
      var ld=this.lexer.lexdata;
      var l=1;
      for (var i=0; i<ld.length; i++) {
          var c=ld[i];
          if (c=='\n') {
              l++;
              buf+="\n"+l+"| ";
          }
          else {
            buf+=c;
          }
      }
      console.log("------------------");
      console.log(buf);
      console.log("==================");
      console.log(estr);
      if (this.errfunc&&!this.errfunc(tok)) {
          return ;
      }
      throw new PUTLParseError(estr);
    }
     peek() {
      var tok=this.lexer.peek();
      if (tok!=undefined)
        tok.parser = this;
      return tok;
    }
     peek_i(i) {
      var tok=this.lexer.peek_i(i);
      if (tok!=undefined)
        tok.parser = this;
      return tok;
    }
     peeknext() {
      return this.peek_i(0);
    }
     next() {
      var tok=this.lexer.next();
      if (tok!=undefined)
        tok.parser = this;
      return tok;
    }
     optional(type) {
      var tok=this.peek_i(0);
      if (tok==undefined)
        return false;
      if (tok.type==type) {
          this.next();
          return true;
      }
      return false;
    }
     at_end() {
      return this.lexer.at_end();
    }
     expect(type, msg) {
      var tok=this.next();
      if (msg==undefined)
        msg = type;
      if (tok==undefined||tok.type!=type) {
          this.error(tok, "Expected "+msg+", not "+tok.type);
      }
      return tok.value;
    }
  }
  _ESClass.register(parser);
  _es6_module.add_class(parser);
  parser = _es6_module.add_export('parser', parser);
  function test_parser() {
    var basic_types=new set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string"]);
    var reserved_tokens=new set(["int", "float", "double", "vec2", "vec3", "vec4", "mat4", "string", "static_string", "array"]);
    function tk(name, re, func) {
      return new tokdef(name, re, func);
    }
    var tokens=[tk("ID", /[a-zA-Z]+[a-zA-Z0-9_]*/, function (t) {
      if (reserved_tokens.has(t.value)) {
          t.type = t.value.toUpperCase();
      }
      return t;
    }), tk("OPEN", /\{/), tk("CLOSE", /}/), tk("COLON", /:/), tk("JSCRIPT", /\|/, function (t) {
      var js="";
      var lexer=t.lexer;
      while (lexer.lexpos<lexer.lexdata.length) {
        var c=lexer.lexdata[lexer.lexpos];
        if (c=="\n")
          break;
        js+=c;
        lexer.lexpos++;
      }
      if (js.endsWith(";")) {
          js = js.slice(0, js.length-1);
          lexer.lexpos--;
      }
      t.value = js;
      return t;
    }), tk("LPARAM", /\(/), tk("RPARAM", /\)/), tk("COMMA", /,/), tk("NUM", /[0-9]/), tk("SEMI", /;/), tk("NEWLINE", /\n/, function (t) {
      t.lexer.lineno+=1;
    }), tk("SPACE", / |\t/, function (t) {
    })];
    for (var rt in reserved_tokens) {
        tokens.push(tk(rt.toUpperCase()));
    }
    function errfunc(lexer) {
      return true;
    }
    var lex=new lexer(tokens, errfunc);
    console.log("Testing lexical scanner...");
    lex.input(a);
    var tok;
    while (tok = lex.next()) {
      console.log(tok.toString());
    }
    var parser=new parser(lex);
    parser.input(a);
    function p_Array(p) {
      p.expect("ARRAY");
      p.expect("LPARAM");
      var arraytype=p_Type(p);
      var itername="";
      if (p.optional("COMMA")) {
          itername = arraytype;
          arraytype = p_Type(p);
      }
      p.expect("RPARAM");
      return {type: "array", 
     data: {type: arraytype, 
      iname: itername}}
    }
    function p_Type(p) {
      var tok=p.peek();
      if (tok.type=="ID") {
          p.next();
          return {type: "struct", 
       data: "\""+tok.value+"\""}
      }
      else 
        if (basic_types.has(tok.type.toLowerCase())) {
          p.next();
          return {type: tok.type.toLowerCase()}
      }
      else 
        if (tok.type=="ARRAY") {
          return p_Array(p);
      }
      else {
        p.error(tok, "invalid type "+tok.type);
      }
    }
    function p_Field(p) {
      var field={}
      console.log("-----", p.peek().type);
      field.name = p.expect("ID", "struct field name");
      p.expect("COLON");
      field.type = p_Type(p);
      field.set = undefined;
      field.get = undefined;
      var tok=p.peek();
      if (tok.type=="JSCRIPT") {
          field.get = tok.value;
          p.next();
      }
      tok = p.peek();
      if (tok.type=="JSCRIPT") {
          field.set = tok.value;
          p.next();
      }
      p.expect("SEMI");
      return field;
    }
    function p_Struct(p) {
      var st={}
      st.name = p.expect("ID", "struct name");
      st.fields = [];
      p.expect("OPEN");
      while (1) {
        if (p.at_end()) {
            p.error(undefined);
        }
        else 
          if (p.optional("CLOSE")) {
            break;
        }
        else {
          st.fields.push(p_Field(p));
        }
      }
      return st;
    }
    var ret=p_Struct(parser);
    console.log(JSON.stringify(ret));
  }
}, '/dev/fairmotion/src/path.ux/scripts/util/parseutil.js');
es6_module_define('ScreenOverdraw', ["../core/ui.js", "./vectormath.js", "./util.js", "./math.js", "../core/ui_base.js", "./events.js"], function _ScreenOverdraw_module(_es6_module) {
  "use strict";
  let SVG_URL='http://www.w3.org/2000/svg';
  var util=es6_import(_es6_module, './util.js');
  var vectormath=es6_import(_es6_module, './vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var ui=es6_import(_es6_module, '../core/ui.js');
  var events=es6_import(_es6_module, './events.js');
  var math=es6_import(_es6_module, './math.js');
  let Vector2=vectormath.Vector2;
  class Overdraw extends ui_base.UIBase {
     constructor() {
      super();
      this.visibleToPick = false;
      this.screen = undefined;
      this.shapes = [];
      this.otherChildren = [];
      this.font = undefined;
      let style=document.createElement("style");
      style.textContent = `
      .overdrawx {
        pointer-events : none;
      }
    `;
      this.shadow.appendChild(style);
      this.zindex_base = 1000;
    }
     startNode(node, screen) {
      if (screen) {
          this.screen = screen;
          this.ctx = screen.ctx;
      }
      if (!this.parentNode) {
          node.appendChild(this);
      }
      this.style["display"] = "float";
      this.style["z-index"] = this.zindex_base;
      this.style["position"] = "absolute";
      this.style["left"] = "0px";
      this.style["top"] = "0px";
      this.style["width"] = "100%";
      this.style["height"] = "100%";
      this.style["pointer-events"] = "none";
      this.svg = document.createElementNS(SVG_URL, "svg");
      this.svg.style["width"] = "100%";
      this.svg.style["height"] = "100%";
      this.svg.style["pointer-events"] = "none";
      this.shadow.appendChild(this.svg);
    }
     start(screen) {
      this.screen = screen;
      this.ctx = screen.ctx;
      screen.parentNode.appendChild(this);
      this.style["display"] = "float";
      this.style["z-index"] = this.zindex_base;
      this.style["position"] = "absolute";
      this.style["left"] = "0px";
      this.style["top"] = "0px";
      this.style["width"] = screen.size[0]+"px";
      this.style["height"] = screen.size[1]+"px";
      this.style["pointer-events"] = "none";
      this.svg = document.createElementNS(SVG_URL, "svg");
      this.svg.style["width"] = "100%";
      this.svg.style["height"] = "100%";
      this.shadow.appendChild(this.svg);
    }
     clear() {
      for (let child of list(this.svg.childNodes)) {
          child.remove();
      }
      for (let child of this.otherChildren) {
          child.remove();
      }
      this.otherChildren.length = 0;
    }
     drawTextBubbles(texts, cos, colors) {
      let boxes=[];
      let elems=[];
      let cent=new Vector2();
      for (let i=0; i<texts.length; i++) {
          let co=cos[i];
          let text=texts[i];
          let color;
          if (colors!==undefined) {
              color = colors[i];
          }
          cent.add(co);
          let box=this.text(texts[i], co[0], co[1], {color: color});
          boxes.push(box);
          let font=box.style["font"];
          let pat=/[0-9]+px/;
          let size=font.match(pat)[0];
          if (size===undefined) {
              size = this.getDefault("DefaultText").size;
          }
          else {
            size = ui_base.parsepx(size);
          }
          let tsize=ui_base.measureTextBlock(this, text, undefined, undefined, size, font);
          box.minsize = [~~tsize.width, ~~tsize.height];
          let pad=ui_base.parsepx(box.style["padding"]);
          box.minsize[0]+=pad*2;
          box.minsize[1]+=pad*2;
          let x=ui_base.parsepx(box.style["left"]);
          let y=ui_base.parsepx(box.style["top"]);
          box.grads = new Array(4);
          box.params = [x, y, box.minsize[0], box.minsize[1]];
          box.startpos = new Vector2([x, y]);
          box.setCSS = function () {
            this.style["padding"] = "0px";
            this.style["margin"] = "0px";
            this.style["left"] = ~~this.params[0]+"px";
            this.style["top"] = ~~this.params[1]+"px";
            this.style["width"] = ~~this.params[2]+"px";
            this.style["height"] = ~~this.params[3]+"px";
          };
          box.setCSS();
          elems.push(box);
      }
      if (boxes.length===0) {
          return ;
      }
      cent.mulScalar(1.0/boxes.length);
      function error() {
        let p1=[0, 0], p2=[0, 0];
        let s1=[0, 0], s2=[0, 0];
        let ret=0.0;
        for (let box1 of boxes) {
            for (let box2 of boxes) {
                if (box2===box1) {
                    continue;
                }
                s1[0] = box1.params[2];
                s1[1] = box1.params[3];
                s2[0] = box2.params[2];
                s2[1] = box2.params[3];
                let overlap=math.aabb_overlap_area(box1.params, s1, box2.params, s2);
                ret+=overlap;
            }
            ret+=box1.startpos.vectorDistance(box1.params)*0.25;
        }
        return ret;
      }
      function solve() {
        let r1=error();
        if (r1===0.0) {
            return ;
        }
        let df=0.0001;
        let totgs=0.0;
        for (let box of boxes) {
            for (let i=0; i<box.params.length; i++) {
                let orig=box.params[i];
                box.params[i]+=df;
                let r2=error();
                box.params[i] = orig;
                box.grads[i] = (r2-r1)/df;
                totgs+=box.grads[i]**2;
            }
        }
        if (totgs===0.0) {
            return ;
        }
        r1/=totgs;
        let k=0.4;
        for (let box of boxes) {
            for (let i=0; i<box.params.length; i++) {
                box.params[i]+=-r1*box.grads[i]*k;
            }
            box.params[2] = Math.max(box.params[2], box.minsize[0]);
            box.params[3] = Math.max(box.params[3], box.minsize[1]);
            box.setCSS();
        }
      }
      for (let i=0; i<15; i++) {
          solve();
      }
      for (let box of boxes) {
          elems.push(this.line(box.startpos, box.params));
      }
      return elems;
    }
     text(text, x, y, args={}) {
      args = Object.assign({}, args);
      if (args.font===undefined) {
          if (this.font!==undefined)
            args.font = this.font;
          else 
            args.font = this.getDefault("DefaultText").genCSS();
      }
      if (!args["background-color"]) {
          args["background-color"] = "rgba(75, 75, 75, 0.75)";
      }
      args.color = args.color ? args.color : "white";
      if (typeof args.color==="object") {
          args.color = ui_base.color2css(args.color);
      }
      args["padding"] = args["padding"]===undefined ? "5px" : args["padding"];
      args["border-color"] = args["border-color"] ? args["border-color"] : "grey";
      args["border-radius"] = args["border-radius"] ? args["border-radius"] : "25px";
      args["border-width"] = args["border-width"]!==undefined ? args["border-width"] : "2px";
      if (typeof args["border-width"]==="number") {
          args["border-width"] = ""+args["border-width"]+"px";
      }
      if (typeof args["border-radius"]==="number") {
          args["border-radius"] = ""+args["border-radius"]+"px";
      }
      let box=document.createElement("div");
      box.setAttribute("class", "overdrawx");
      box.style["position"] = "absolute";
      box.style["width"] = "min-contents";
      box.style["height"] = "min-contents";
      box.style["border-width"] = args["border-width"];
      box.style["border-radius"] = "25px";
      box.style["pointer-events"] = "none";
      box.style["z-index"] = this.zindex_base+1;
      box.style["background-color"] = args["background-color"];
      box.style["padding"] = args["padding"];
      box.style["left"] = x+"px";
      box.style["top"] = y+"px";
      box.style["display"] = "flex";
      box.style["justify-content"] = "center";
      box.style["align-items"] = "center";
      box.innerText = text;
      box.style["font"] = args.font;
      box.style["color"] = args.color;
      this.otherChildren.push(box);
      this.shadow.appendChild(box);
      return box;
    }
     circle(p, r, stroke="black", fill="none") {
      let circle=document.createElementNS(SVG_URL, "circle");
      circle.setAttribute("cx", p[0]);
      circle.setAttribute("cy", p[1]);
      circle.setAttribute("r", r);
      if (fill) {
          circle.setAttribute("style", `stroke:${stroke};stroke-width:2;fill:${fill}`);
      }
      else {
        circle.setAttribute("style", `stroke:${stroke};stroke-width:2`);
      }
      this.svg.appendChild(circle);
      return circle;
    }
     line(v1, v2, color="black") {
      let line=document.createElementNS(SVG_URL, "line");
      line.setAttribute("x1", v1[0]);
      line.setAttribute("y1", v1[1]);
      line.setAttribute("x2", v2[0]);
      line.setAttribute("y2", v2[1]);
      line.setAttribute("style", `stroke:${color};stroke-width:2`);
      this.svg.appendChild(line);
      return line;
    }
     rect(p, size, color="black") {
      let line=document.createElementNS(SVG_URL, "rect");
      line.setAttribute("x", p[0]);
      line.setAttribute("y", p[1]);
      line.setAttribute("width", size[0]);
      line.setAttribute("height", size[1]);
      line.setAttribute("style", `fill:${color};stroke-width:2`);
      line.setColor = (color) =>        {
        line.setAttribute("style", `fill:${color};stroke-width:2`);
      };
      this.svg.appendChild(line);
      return line;
    }
     end() {
      this.clear();
      this.remove();
    }
    static  define() {
      return {tagname: "overdraw-x"}
    }
  }
  _ESClass.register(Overdraw);
  _es6_module.add_class(Overdraw);
  Overdraw = _es6_module.add_export('Overdraw', Overdraw);
  ui_base.UIBase.register(Overdraw);
}, '/dev/fairmotion/src/path.ux/scripts/util/ScreenOverdraw.js');
es6_module_define('simple_events', ["./util.js", "./vectormath.js", "../config/const.js"], function _simple_events_module(_es6_module) {
  var util=es6_import(_es6_module, './util.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var Vector2=es6_import_item(_es6_module, './vectormath.js', 'Vector2');
  let modalstack=[];
  modalstack = _es6_module.add_export('modalstack', modalstack);
  let singleMouseCBs={}
  function singletonMouseEvents() {
    let keys=["mousedown", "mouseup", "mousemove"];
    for (let k of keys) {
        singleMouseCBs[k] = new Set();
    }
    let ddd=-1.0;
    window.testSingleMouseUpEvent = (type) =>      {
      if (type===undefined) {
          type = "mousedown";
      }
      let id=ddd++;
      singleMouseEvent(() =>        {
        console.log("mouse event", id);
      }, type);
    }
    let _mpos=new Vector2();
    function doSingleCbs(e, type) {
      let list=singleMouseCBs[type];
      singleMouseCBs[type] = new Set();
      if (e.type!=="touchend"&&e.type!=="touchcancel") {
          _mpos[0] = e.touches&&e.touches.length>0 ? e.touches[0].pageX : e.x;
          _mpos[1] = e.touches&&e.touches.length>0 ? e.touches[0].pageY : e.y;
      }
      if (e.touches) {
          e = copyEvent(e);
          e.type = type;
          if (e.touches.length>0) {
              e.x = e.pageX = e.touches[0].pageX;
              e.y = e.pageY = e.touches[0].pageY;
          }
          else {
            e.x = _mpos[0];
            e.y = _mpos[1];
          }
      }
      for (let cb of list) {
          try {
            cb(e);
          }
          catch (error) {
              util.print_stack(error);
              console.warn("Error in event callback");
          }
      }
    }
    window.addEventListener("mouseup", (e) =>      {
      doSingleCbs(e, "mouseup");
    }, {capture: true});
    window.addEventListener("touchcancel", (e) =>      {
      doSingleCbs(e, "mouseup");
    }, {capture: true});
    document.addEventListener("touchend", (e) =>      {
      doSingleCbs(e, "mouseup");
    }, {capture: true});
    document.addEventListener("mousedown", (e) =>      {
      doSingleCbs(e, "mousedown");
    }, {capture: true});
    document.addEventListener("touchstart", (e) =>      {
      doSingleCbs(e, "mousedown");
    }, {capture: true});
    document.addEventListener("mousemove", (e) =>      {
      doSingleCbs(e, "mousemove");
    }, {capture: true});
    document.addEventListener("touchmove", (e) =>      {
      doSingleCbs(e, "mousemove");
    }, {capture: true});
    return {singleMouseEvent: function singleMouseEvent(cb, type) {
        if (!(type in singleMouseCBs)) {
            throw new Error("not a mouse event");
        }
        singleMouseCBs[type].add(cb);
      }}
  }
  singletonMouseEvents = singletonMouseEvents();
  function singleMouseEvent(cb, type) {
    return singletonMouseEvents.singleMouseEvent(cb, type);
  }
  singleMouseEvent = _es6_module.add_export('singleMouseEvent', singleMouseEvent);
  function isLeftClick(e) {
    if (e.touches!==undefined) {
        return e.touches.length===1;
    }
    return e.button===0;
  }
  isLeftClick = _es6_module.add_export('isLeftClick', isLeftClick);
  class DoubleClickHandler  {
     constructor() {
      this.down = 0;
      this.last = 0;
      this.dblEvent = undefined;
      this.start_mpos = new Vector2();
      this._on_mouseup = this._on_mouseup.bind(this);
      this._on_mousemove = this._on_mousemove.bind(this);
    }
     _on_mouseup(e) {
      this.mdown = false;
    }
     _on_mousemove(e) {
      let mpos=new Vector2();
      mpos[0] = e.x;
      mpos[1] = e.y;
      let dist=mpos.vectorDistance(this.start_mpos)*devicePixelRatio;
      if (dist>11) {
          this.mdown = false;
      }
      if (this.mdown) {
          singleMouseEvent(this._on_mousemove, "mousemove");
      }
      this.update();
    }
     mousedown(e) {
      if (!this.last) {
          this.last = 0;
      }
      if (!this.down) {
          this.down = 0;
      }
      if (!this.up) {
          this.up = 0;
      }
      if (isMouseDown(e)) {
          this.mdown = true;
          let cpy=Object.assign({}, e);
          this.start_mpos[0] = e.x;
          this.start_mpos[1] = e.y;
          singleMouseEvent(this._on_mousemove, "mousemove");
          if (e.type.search("touch")>=0&&e.touches.length>0) {
              cpy.x = cpy.pageX = e.touches[0].pageX;
              cpy.y = cpy.pageY = e.touches[1].pageY;
          }
          else {
            cpy.x = cpy.pageX = e.x;
            cpy.y = cpy.pageY = e.y;
          }
          this.dblEvent = copyEvent(e);
          this.dblEvent.type = "dblclick";
          this.last = this.down;
          this.down = util.time_ms();
          if (this.down-this.last<cconst.doubleClickTime) {
              this.mdown = false;
              this.ondblclick(this.dblEvent);
              this.down = this.last = 0.0;
          }
          else {
            singleMouseEvent(this._on_mouseup, "mouseup");
          }
      }
      else {
        this.mdown = false;
      }
    }
     ondblclick(e) {

    }
     update() {
      if (modalstack.length>0) {
          this.mdown = false;
      }
      if (this.mdown&&util.time_ms()-this.down>cconst.doubleClickHoldTime) {
          this.mdown = false;
          this.ondblclick(this.dblEvent);
      }
    }
     abort() {
      this.last = this.down = 0;
    }
  }
  _ESClass.register(DoubleClickHandler);
  _es6_module.add_class(DoubleClickHandler);
  DoubleClickHandler = _es6_module.add_export('DoubleClickHandler', DoubleClickHandler);
  function isMouseDown(e) {
    let mdown=0;
    if (e.touches!==undefined) {
        mdown = e.touches.length>0;
    }
    else {
      mdown = e.buttons;
    }
    mdown = mdown&1;
    return mdown;
  }
  isMouseDown = _es6_module.add_export('isMouseDown', isMouseDown);
  function pathDebugEvent(e, extra) {
    e.__prevdef = e.preventDefault;
    e.__stopprop = e.stopPropagation;
    e.preventDefault = function () {
      console.warn("preventDefault", extra);
      return this.__prevdef();
    }
    e.stopPropagation = function () {
      console.warn("stopPropagation", extra);
      return this.__stopprop();
    }
  }
  pathDebugEvent = _es6_module.add_export('pathDebugEvent', pathDebugEvent);
  function eventWasTouch(e) {
    let ret=e.sourceCapabilities&&e.sourceCapabilities.firesTouchEvents;
    ret = ret||e.was_touch;
    ret = ret||e.touches!==undefined;
    return ret;
  }
  eventWasTouch = _es6_module.add_export('eventWasTouch', eventWasTouch);
  function copyEvent(e) {
    let ret={}
    let keys=[];
    for (let k in e) {
        keys.push(k);
    }
    keys = keys.concat(Object.getOwnPropertySymbols(e));
    keys = keys.concat(Object.getOwnPropertyNames(e));
    for (let k of keys) {
        let v;
        try {
          v = e[k];
        }
        catch (error) {
            console.warn("read error for event key", k);
            continue;
        }
        if (typeof v=="function") {
            ret[k] = v.bind(e);
        }
        else {
          ret[k] = v;
        }
    }
    ret.original = e;
    return ret;
  }
  copyEvent = _es6_module.add_export('copyEvent', copyEvent);
  let Screen;
  function _setScreenClass(cls) {
    Screen = cls;
  }
  _setScreenClass = _es6_module.add_export('_setScreenClass', _setScreenClass);
  function findScreen() {
    let rec=(n) =>      {
      for (let n2 of n.childNodes) {
          if (n2&&typeof n2==="object"&&__instance_of(n2, Screen)) {
              return n2;
          }
      }
      for (let n2 of n.childNodes) {
          let ret=rec(n2);
          if (ret) {
              return ret;
          }
      }
    }
    return rec(document.body);
  }
  window._findScreen = findScreen;
  function pushModalLight(obj, autoStopPropagation) {
    if (autoStopPropagation===undefined) {
        autoStopPropagation = true;
    }
    if (cconst.DEBUG.modalEvents) {
        console.warn("pushModalLight");
    }
    let keys=new Set(["keydown", "keyup", "keypress", "mousedown", "mouseup", "touchstart", "touchend", "touchcancel", "mousewheel", "mousemove", "mouseover", "mouseout", "mouseenter", "mouseleave", "dragstart", "drag", "dragend", "dragexit", "dragleave", "dragover", "dragenter", "drop", "pointerdown", "pointermove", "pointerup", "pointercancel"]);
    let ret={keys: keys, 
    handlers: {}, 
    last_mpos: [0, 0]}
    let touchmap={"touchstart": "mousedown", 
    "touchmove": "mousemove", 
    "touchend": "mouseup", 
    "touchcancel": "mouseup"}
    let mpos=[0, 0];
    let screen=findScreen();
    if (screen) {
        mpos[0] = screen.mpos[0];
        mpos[1] = screen.mpos[1];
        screen = undefined;
    }
    function handleAreaContext() {
      let screen=findScreen();
      if (screen) {
          let sarea=screen.findScreenArea(mpos[0], mpos[1]);
          if (sarea&&sarea.area) {
              sarea.area.push_ctx_active();
              sarea.area.pop_ctx_active();
          }
      }
    }
    function make_default_touchhandler(type, state) {
      return function (e) {
        if (cconst.DEBUG.domEvents) {
            pathDebugEvent(e);
        }
        if (touchmap[type] in ret.handlers) {
            let type2=touchmap[type];
            let e2=copyEvent(e);
            e2.was_touch = true;
            e2.type = type2;
            e2.button = type=="touchcancel" ? 1 : 0;
            e2.touches = e.touches;
            if (e.touches.length>0) {
                let dpi=window.devicePixelRatio;
                let t=e.touches[0];
                mpos[0] = t.pageX;
                mpos[1] = t.pageY;
                e2.pageX = e2.x = t.pageX;
                e2.pageY = e2.y = t.pageY;
                e2.clientX = t.clientX;
                e2.clientY = t.clientY;
                e2.x = t.clientX;
                e2.y = t.clientY;
                ret.last_mpos[0] = e2.x;
                ret.last_mpos[1] = e2.y;
            }
            else {
              e2.x = e2.clientX = e2.pageX = e2.screenX = ret.last_mpos[0];
              e2.y = e2.clientY = e2.pageY = e2.screenY = ret.last_mpos[1];
            }
            e2.was_touch = true;
            handleAreaContext();
            ret.handlers[type2](e2);
        }
        if (autoStopPropagation) {
            e.preventDefault();
            e.stopPropagation();
        }
      }
    }
    function make_handler(type, key) {
      return function (e) {
        if (cconst.DEBUG.domEvents) {
            pathDebugEvent(e);
        }
        if (typeof key!=="string") {
            console.warn("key was undefined", key);
            return ;
        }
        if (key.startsWith("mouse")) {
            mpos[0] = e.pageX;
            mpos[1] = e.pageY;
        }
        handleAreaContext();
        if (key!==undefined)
          obj[key](e);
        if (autoStopPropagation) {
            e.preventDefault();
            e.stopPropagation();
        }
      }
    }
    let found={}
    for (let k of keys) {
        let key;
        if (obj[k])
          key = k;
        else 
          if (obj["on"+k])
          key = "on"+k;
        else 
          if (obj["on_"+k])
          key = "on_"+k;
        else 
          if (k in touchmap)
          continue;
        else 
          key = undefined;
        if (key===undefined&&k.search("pointer")===0) {
            continue;
        }
        if (key!==undefined) {
            found[k] = 1;
        }
        let handler=make_handler(k, key);
        ret.handlers[k] = handler;
        let settings=handler.settings = {passive: false, 
      capture: true};
        window.addEventListener(k, handler, settings);
    }
    for (let k in touchmap) {
        if (!(k in found)) {
            ret.handlers[k] = make_default_touchhandler(k, ret);
            let settings=ret.handlers[k].settings = {passive: false, 
        capture: true};
            window.addEventListener(k, ret.handlers[k], settings);
        }
    }
    modalstack.push(ret);
    return ret;
  }
  pushModalLight = _es6_module.add_export('pushModalLight', pushModalLight);
  function popModalLight(state) {
    if (cconst.DEBUG.modalEvents) {
        console.warn("popModalLight");
    }
    if (state===undefined) {
        console.warn("Bad call to popModalLight: state was undefined");
        return ;
    }
    if (state!==modalstack[modalstack.length-1]) {
        if (modalstack.indexOf(state)<0) {
            console.warn("Error in popModalLight; modal handler not found");
            return ;
        }
        else {
          console.warn("Error in popModalLight; called in wrong order");
        }
    }
    for (let k in state.handlers) {
        window.removeEventListener(k, state.handlers[k], state.handlers[k].settings);
    }
    state.handlers = {}
    modalstack.remove(state);
  }
  popModalLight = _es6_module.add_export('popModalLight', popModalLight);
  function haveModal() {
    return modalstack.length>0;
  }
  haveModal = _es6_module.add_export('haveModal', haveModal);
  window._haveModal = haveModal;
  var keymap_latin_1={"Space": 32, 
   "Escape": 27, 
   "Enter": 13, 
   "Return": 13, 
   "Up": 38, 
   "Down": 40, 
   "Left": 37, 
   "Right": 39, 
   "Num0": 96, 
   "Num1": 97, 
   "Num2": 98, 
   "Num3": 99, 
   "Num4": 100, 
   "Num5": 101, 
   "Num6": 102, 
   "Num7": 103, 
   "Num8": 104, 
   "Num9": 105, 
   "Home": 36, 
   "End": 35, 
   "Delete": 46, 
   "Backspace": 8, 
   "Insert": 45, 
   "PageUp": 33, 
   "PageDown": 34, 
   "Tab": 9, 
   "-": 189, 
   "=": 187, 
   ".": 190, 
   "/": 191, 
   ",": 188, 
   ";": 186, 
   "'": 222, 
   "[": 219, 
   "]": 221, 
   "NumPlus": 107, 
   "NumMinus": 109, 
   "Shift": 16, 
   "Ctrl": 17, 
   "Control": 17, 
   "Alt": 18}
  keymap_latin_1 = _es6_module.add_export('keymap_latin_1', keymap_latin_1);
  for (var i=0; i<26; i++) {
      keymap_latin_1[String.fromCharCode(i+65)] = i+65;
  }
  for (var i=0; i<10; i++) {
      keymap_latin_1[String.fromCharCode(i+48)] = i+48;
  }
  for (var k in keymap_latin_1) {
      keymap_latin_1[keymap_latin_1[k]] = k;
  }
  var keymap_latin_1_rev={}
  for (var k in keymap_latin_1) {
      keymap_latin_1_rev[keymap_latin_1[k]] = k;
  }
  var keymap=keymap_latin_1;
  keymap = _es6_module.add_export('keymap', keymap);
  var reverse_keymap=keymap_latin_1_rev;
  reverse_keymap = _es6_module.add_export('reverse_keymap', reverse_keymap);
  class HotKey  {
     constructor(key, modifiers, action, uiname) {
      this.action = action;
      this.mods = modifiers;
      this.key = keymap[key];
      this.uiname = uiname;
    }
     exec(ctx) {
      if (typeof this.action=="string") {
          ctx.api.execTool(ctx, this.action);
      }
      else {
        this.action(ctx);
      }
    }
     buildString() {
      let s="";
      for (let i=0; i<this.mods.length; i++) {
          if (i>0) {
              s+=" + ";
          }
          let k=this.mods[i].toLowerCase();
          k = k[0].toUpperCase()+k.slice(1, k.length).toLowerCase();
          s+=k;
      }
      if (this.mods.length>0) {
          s+="+";
      }
      s+=reverse_keymap[this.key];
      return s.trim();
    }
  }
  _ESClass.register(HotKey);
  _es6_module.add_class(HotKey);
  HotKey = _es6_module.add_export('HotKey', HotKey);
  class KeyMap extends Array {
     constructor(hotkeys=[]) {
      super();
      for (let hk of hotkeys) {
          this.add(hk);
      }
    }
     handle(ctx, e) {
      let mods=new util.set();
      if (e.shiftKey)
        mods.add("shift");
      if (e.altKey)
        mods.add("alt");
      if (e.ctrlKey) {
          mods.add("ctrl");
      }
      if (e.commandKey) {
          mods.add("command");
      }
      for (let hk of this) {
          let ok=e.keyCode==hk.key;
          if (!ok)
            continue;
          let count=0;
          for (let m of hk.mods) {
              m = m.toLowerCase().trim();
              if (!mods.has(m)) {
                  ok = false;
                  break;
              }
              count++;
          }
          if (count!=mods.length) {
              ok = false;
          }
          if (ok) {
              try {
                hk.exec(ctx);
              }
              catch (error) {
                  util.print_stack(error);
                  console.log("failed to execute a hotkey", keymap[e.keyCode]);
              }
              return true;
          }
      }
    }
     add(hk) {
      this.push(hk);
    }
     push(hk) {
      super.push(hk);
    }
  }
  _ESClass.register(KeyMap);
  _es6_module.add_class(KeyMap);
  KeyMap = _es6_module.add_export('KeyMap', KeyMap);
}, '/dev/fairmotion/src/path.ux/scripts/util/simple_events.js');
es6_module_define('solver', ["./math.js", "./util.js", "./vectormath.js"], function _solver_module(_es6_module) {
  var Vector2=es6_import_item(_es6_module, './vectormath.js', 'Vector2');
  var math=es6_import(_es6_module, './math.js');
  var util=es6_import(_es6_module, './util.js');
  class Constraint  {
     constructor(name, func, klst, params, k=1.0) {
      this.glst = [];
      this.klst = klst;
      this.k = k;
      this.params = params;
      this.name = name;
      for (let ks of klst) {
          this.glst.push(new Float64Array(ks.length));
      }
      this.df = 0.0005;
      this.threshold = 0.0001;
      this.func = func;
    }
     evaluate(no_dvs=false) {
      let r1=this.func(this.params);
      if (Math.abs(r1)<this.threshold)
        return 0.0;
      let df=this.df;
      if (no_dvs)
        return r1;
      for (let i=0; i<this.klst.length; i++) {
          let gs=this.glst[i];
          let ks=this.klst[i];
          for (let j=0; j<ks.length; j++) {
              let orig=ks[j];
              ks[j]+=df;
              let r2=this.func(this.params);
              ks[j] = orig;
              gs[j] = (r2-r1)/df;
          }
      }
      return r1;
    }
  }
  _ESClass.register(Constraint);
  _es6_module.add_class(Constraint);
  Constraint = _es6_module.add_export('Constraint', Constraint);
  class Solver  {
     constructor() {
      this.constraints = [];
      this.gk = 0.99;
    }
     add(con) {
      this.constraints.push(con);
    }
     solveStep(gk=this.gk) {
      let err=0.0;
      for (let con of this.constraints) {
          let r1=con.evaluate();
          if (r1===0.0)
            continue;
          err+=Math.abs(r1);
          let totgs=0.0;
          for (let i=0; i<con.klst.length; i++) {
              let ks=con.klst[i], gs=con.glst[i];
              for (let j=0; j<ks.length; j++) {
                  totgs+=gs[j]*gs[j];
              }
          }
          if (totgs===0.0) {
              continue;
          }
          r1/=totgs;
          for (let i=0; i<con.klst.length; i++) {
              let ks=con.klst[i], gs=con.glst[i];
              for (let j=0; j<ks.length; j++) {
                  ks[j]+=-r1*gs[j]*con.k*gk;
              }
          }
      }
      return err;
    }
     solve(steps, gk=this.gk) {
      let err=0.0;
      for (let i=0; i<steps; i++) {
          err = this.solveStep(gk);
          if (err<0.01/this.constraints.length) {
              break;
          }
      }
      return err;
    }
  }
  _ESClass.register(Solver);
  _es6_module.add_class(Solver);
  Solver = _es6_module.add_export('Solver', Solver);
}, '/dev/fairmotion/src/path.ux/scripts/util/solver.js');
es6_module_define('struct', ["./nstructjs.js"], function _struct_module(_es6_module) {
  es6_import(_es6_module, './nstructjs.js');
  let nstructjs=window.nstructjs;
  nstructjs = _es6_module.add_export('nstructjs', nstructjs);
  const STRUCT=nstructjs.STRUCT;
  _es6_module.add_export('STRUCT', STRUCT);
  const manager=nstructjs.manager;
  _es6_module.add_export('manager', manager);
  const write_scripts=nstructjs.write_scripts;
  _es6_module.add_export('write_scripts', write_scripts);
  const inherit=nstructjs.inherit;
  _es6_module.add_export('inherit', inherit);
  const setDebugMode=nstructjs.setDebugMode;
  _es6_module.add_export('setDebugMode', setDebugMode);
  function register(cls) {
    manager.add_class(cls);
  }
  register = _es6_module.add_export('register', register);
}, '/dev/fairmotion/src/path.ux/scripts/util/struct.js');
es6_module_define('vectormath', ["./util.js", "./struct.js"], function _vectormath_module(_es6_module) {
  var util=es6_import(_es6_module, './util.js');
  es6_import(_es6_module, './struct.js');
  window.makeCompiledVectormathCode = function (mode) {
    if (mode===undefined) {
        mode = "es";
    }
    let s="";
    let es6exports=mode==="es";
    function doExports(name) {
      if (es6exports) {
          return "export";
      }
      else {
        return `var ${name} = exports.${name} =`;
      }
    }
    let classes=[Vector2, Vector3, Vector4, Quat];
    let lens={Vector2: 2, 
    Vector3: 3, 
    Vector4: 4, 
    Quat: 4}
    let modecode="";
    let nstructjscode=`
  let g = typeof window != "undefined" ? window : "undefined";
  
  g = g || (typeof global != "undefined" ? global : "undefined");
  g = g || (typeof self != "undefined" ? self : "undefined");
  g = g || (typeof globals != "undefined" ? globals : "undefined");

  if (typeof nstructjs === "undefined") {
    //add nstructjs stub
    g.nstructjs = {
      register : function() {}
    }
  }
  `;
    if (mode!=="rjs") {
        if (mode==="commonjs") {
            modecode = `if (typeof module !== "undefined" && typeof exports === "undefined") {
      if (module.exports === undefined) {
        module.exports = {};
      }
      
      g.exports = module.exports;
    } else if (typeof module === "undefined") {
      g.exports = g.vectormath = {};
    }\n`;
        }
        s+=`{
      ${nstructjscode}
    ${modecode}
  }`;
    }
    s+=`
class cachering extends Array {
  constructor(func, size) {
    super()

    this.cur = 0;

    for (var i=0; i<size; i++) {
      this.push(func());
    }
  }

  static fromConstructor(cls, size) {
    var func = function() {
      return new cls();
    }

    return new cachering(func, size);
  }

  next() {
    var ret = this[this.cur];
    this.cur = (this.cur+1)%this.length;

    return ret;
  }
}
`;
    s+=`

var M_SQRT2 = Math.sqrt(2.0);
var FLT_EPSILON = 2.22e-16;  
var sin=Math.sin, cos=Math.cos, abs=Math.abs, log=Math.log,
    asin=Math.asin, exp=Math.exp, acos=Math.acos, fract=Math.fract,
    sign=Math.sign, tent=Math.tent, atan2=Math.atan2, atan=Math.atan,
    pow=Math.pow, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil,
    min=Math.min, max=Math.max, PI=Math.PI, E=2.718281828459045;

var DOT_NORM_SNAP_LIMIT = 0.00000000001;

${doExports("BaseVector")} class BaseVector extends Array {
  constructor() {
    super();
  }

  copy() {
    return new this.constructor(this);
  }

  load(data) {
    throw new Error("Implement me!");
  }
  
  vectorLength() {
    return sqrt(this.dot(this));
  }
  
  normalize() {
    var l = this.vectorLength();
    if (l > 0.00000001) {
      this.mulScalar(1.0/l);
    }
    
    return this;
  }
}
  
`;
    function indent(s, pad) {
      if (pad===undefined) {
          pad = "  ";
      }
      let l=s.split("\n");
      let s2="";
      for (let l2 of l) {
          s2+=pad+l2+"\n";
      }
      return s2;
    }
    let i=0;
    for (let cls of classes) {
        s+=doExports(cls.name)+" class "+cls.name+" extends BaseVector {\n";
        let keys=Reflect.ownKeys(cls.prototype);
        for (let k of keys) {
            let v=cls.prototype[k];
            if (typeof v!=="function") {
                continue;
            }
            if (typeof k==="symbol") {
                k = "  ["+k.toString()+"]";
            }
            v = (""+v).trim();
            if (v.startsWith("function(")||v.startsWith("function (")) {
                v = k+v.slice(8, v.length).trim();
            }
            else 
              if (v.startsWith("function")) {
                v = v.slice(8, v.length).trim();
            }
            if (v.endsWith(";}")) {
                v = v.slice(0, v.length-1)+"\n  }\n";
            }
            let zero="";
            let l=lens[cls.name];
            for (let j=0; j<l; j++) {
                if (j>0) {
                    zero+=" = ";
                }
                zero+=`this[${j}]`;
            }
            zero+=" = 0.0";
            if (k==="constructor") {
                s+=`  constructor(data) {
    super();
        
    if (arguments.length > 1) {
      throw new Error("unexpected argument");
    }

    this.length = ${l};
    ${zero};

    if (data != undefined) {
      this.load(data);
    }
  }
`;
            }
            else {
              s+=indent(v);
            }
            s+="\n";
            i++;
        }
        s+="}\n\n";
        s+=`${cls.name}.STRUCT = \`${cls.STRUCT}\`;\n`;
        s+=`nstructjs.register(${cls.name});\n\n`;
    }
    s+="\n\n"+(""+internal_matrix).trim()+"\n";
    s+="\n"+doExports("Matrix4")+Matrix4;
    s+=`\n  Matrix4.STRUCT = \`${Matrix4.STRUCT}\`;\n`;
    s+="nstructjs.register(Matrix4)\n";
    s+=`
  var _quat_vs3_temps = cachering.fromConstructor(Vector3, 64);
  var _v3nd4_n1_normalizedDot4 = new Vector3();
  var _v3nd4_n2_normalizedDot4 = new Vector3();
  var _v3nd_n1_normalizedDot = new Vector3();
  var _v3nd_n2_normalizedDot = new Vector3();

  var $_v3nd4_n1_normalizedDot4 = new Vector3();
  var $_v3nd4_n2_normalizedDot4 = new Vector3();
  var $_v3nd_n1_normalizedDot = new Vector3();
  var $_v3nd_n2_normalizedDot = new Vector3();

  var lookat_cache_vs3 = cachering.fromConstructor(Vector3, 64);
  var lookat_cache_vs4 = cachering.fromConstructor(Vector4, 64);

  var makenormalcache = cachering.fromConstructor(Vector3, 64);
`;
    if (mode==="rjs") {
        s = `define([], function() {
  "use strict";

  let exports = {};

  {
    ${nstructjscode}
  }
  ${indent(s)}

  return exports;
});
`;
    }
    return s;
  }
  var sin=Math.sin, cos=Math.cos, abs=Math.abs, log=Math.log, asin=Math.asin, exp=Math.exp, acos=Math.acos, fract=Math.fract, sign=Math.sign, tent=Math.tent, atan2=Math.atan2, atan=Math.atan, pow=Math.pow, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, min=Math.min, max=Math.max, PI=Math.PI, E=2.718281828459045;
  var DOT_NORM_SNAP_LIMIT=1e-11;
  var M_SQRT2=Math.sqrt(2.0);
  var FLT_EPSILON=2.22e-16;
  var basic_funcs={equals: [["b"], "this[X] == b[X]", "&&"], 
   zero: [[], "0.0;"], 
   negate: [[], "-this[X];"], 
   combine: [["b", "u", "v"], "this[X]*u + this[X]*v;"], 
   interp: [["b", "t"], "this[X] + (b[X] - this[X])*t;"], 
   add: [["b"], "this[X] + b[X];"], 
   addFac: [["b", "F"], "this[X] + b[X]*F;"], 
   fract: [[], "Math.fract(this[X]);"], 
   sub: [["b"], "this[X] - b[X];"], 
   mul: [["b"], "this[X] * b[X];"], 
   div: [["b"], "this[X] / b[X];"], 
   mulScalar: [["b"], "this[X] * b;"], 
   divScalar: [["b"], "this[X] / b;"], 
   addScalar: [["b"], "this[X] + b;"], 
   subScalar: [["b"], "this[X] - b;"], 
   ceil: [[], "Math.ceil(this[X])"], 
   floor: [[], "Math.floor(this[X])"], 
   abs: [[], "Math.abs(this[X])"], 
   min: [["b"], "Math.min(this[X], b[X])"], 
   max: [["b"], "Math.max(this[X], b[X])"], 
   clamp: [["MIN", "MAX"], "min(max(this[X], MAX), MIN)"]}
  function bounded_acos(fac) {
    if (fac<=-1.0)
      return Math.pi;
    else 
      if (fac>=1.0)
      return 0.0;
    else 
      return Math.acos(fac);
  }
  function saasin(fac) {
    if (fac<=-1.0)
      return -Math.pi/2.0;
    else 
      if (fac>=1.0)
      return Math.pi/2.0;
    else 
      return Math.asin(fac);
  }
  function make_norm_safe_dot(cls) {
    var _dot=cls.prototype.dot;
    cls.prototype._dot = _dot;
    cls.prototype.dot = function (b) {
      var ret=_dot.call(this, b);
      if (ret>=1.0-DOT_NORM_SNAP_LIMIT&&ret<=1.0+DOT_NORM_SNAP_LIMIT)
        return 1.0;
      if (ret>=-1.0-DOT_NORM_SNAP_LIMIT&&ret<=-1.0+DOT_NORM_SNAP_LIMIT)
        return -1.0;
      return ret;
    }
  }
  class BaseVector extends Array {
     constructor() {
      super();
    }
     copy() {
      return new this.constructor(this);
    }
     load(data) {
      throw new Error("Implement me!");
    }
     init_swizzle(size) {
      var ret={};
      var cls=size==4 ? Vector4 : (size==3 ? Vector3 : Vector2);
      for (var k in cls.prototype) {
          var v=cls.prototype[k];
          if (typeof v!="function"&&!(__instance_of(v, Function)))
            continue;
          ret[k] = v.bind(this);
      }
      return ret;
    }
     vectorLength() {
      return sqrt(this.dot(this));
    }
     normalize() {
      var l=this.vectorLength();
      if (l>1e-08) {
          this.mulScalar(1.0/l);
      }
      return this;
    }
    static  inherit(cls, vectorsize) {
      make_norm_safe_dot(cls);
      var f;
      var vectorDotDistance="f = function vectorDotDistance(b) {\n";
      for (var i=0; i<vectorsize; i++) {
          vectorDotDistance+="  let d"+i+" = this["+i+"]-b["+i+"];\n\n  ";
      }
      vectorDotDistance+="  return ";
      for (var i=0; i<vectorsize; i++) {
          if (i>0)
            vectorDotDistance+=" + ";
          vectorDotDistance+="d"+i+"*d"+i;
      }
      vectorDotDistance+=";\n";
      vectorDotDistance+="};";
      cls.prototype.vectorDotDistance = eval(vectorDotDistance);
      var f;
      var vectorDistance="f = function vectorDistance(b) {\n";
      for (var i=0; i<vectorsize; i++) {
          vectorDistance+="  let d"+i+" = this["+i+"]-b["+i+"];\n\n  ";
      }
      vectorDistance+="  return Math.sqrt(";
      for (var i=0; i<vectorsize; i++) {
          if (i>0)
            vectorDistance+=" + ";
          vectorDistance+="d"+i+"*d"+i;
      }
      vectorDistance+=");\n";
      vectorDistance+="};";
      cls.prototype.vectorDistance = eval(vectorDistance);
      for (var k in basic_funcs) {
          var func=basic_funcs[k];
          var args=func[0];
          var line=func[1];
          var f;
          var code="f = function "+k+"(";
          for (var i=0; i<args.length; i++) {
              if (i>0)
                code+=", ";
              line = line.replace(args[i], args[i].toLowerCase());
              code+=args[i].toLowerCase();
          }
          code+=") {\n";
          if (func.length>2) {
              code+="  return ";
              for (var i=0; i<vectorsize; i++) {
                  if (i>0)
                    code+=func[2];
                  code+="("+line.replace(/X/g, ""+i)+")";
              }
              code+=";\n";
          }
          else {
            for (var i=0; i<vectorsize; i++) {
                var line2=line.replace(/X/g, ""+i);
                code+="  this["+i+"] = "+line2+";\n";
            }
            code+="  return this;\n";
          }
          code+="}\n";
          var f=eval(code);
          cls.prototype[k] = f;
      }
    }
  }
  _ESClass.register(BaseVector);
  _es6_module.add_class(BaseVector);
  BaseVector = _es6_module.add_export('BaseVector', BaseVector);
  class Vector4 extends BaseVector {
     constructor(data) {
      super();
      if (arguments.length>1) {
          throw new Error("unexpected argument");
      }
      this.length = 4;
      this[0] = this[1] = this[2] = this[3] = 0.0;
      if (data!=undefined) {
          this.load(data);
      }
    }
     toCSS() {
      let r=~~(this[0]*255);
      let g=~~(this[1]*255);
      let b=~~(this[2]*255);
      let a=this[3];
      return `rgba(${r},${g},${b},${a})`;
    }
     loadXYZW(x, y, z, w) {
      this[0] = x;
      this[1] = y;
      this[2] = z;
      this[3] = w;
      return this;
    }
     loadXYZ(x, y, z) {
      this[0] = x;
      this[1] = y;
      this[2] = z;
      return this;
    }
     load(data) {
      if (data==undefined)
        return this;
      this[0] = data[0];
      this[1] = data[1];
      this[2] = data[2];
      this[3] = data[3];
      return this;
    }
     dot(b) {
      return this[0]*b[0]+this[1]*b[1]+this[2]*b[2]+this[3]*b[3];
    }
     mulVecQuat(q) {
      var t0=-this[1]*this[0]-this[2]*this[1]-this[3]*this[2];
      var t1=this[0]*this[0]+this[2]*this[2]-this[3]*this[1];
      var t2=this[0]*this[1]+this[3]*this[0]-this[1]*this[2];
      this[2] = this[0]*this[2]+this[1]*this[1]-this[2]*this[0];
      this[0] = t1;
      this[1] = t2;
      t1 = t0*-this[1]+this[0]*this[0]-this[1]*this[3]+this[2]*this[2];
      t2 = t0*-this[2]+this[1]*this[0]-this[2]*this[1]+this[0]*this[3];
      this[2] = t0*-this[3]+this[2]*this[0]-this[0]*this[2]+this[1]*this[1];
      this[0] = t1;
      this[1] = t2;
      return this;
    }
     multVecMatrix(matrix) {
      var x=this[0];
      var y=this[1];
      var z=this[2];
      var w=this[3];
      this[0] = w*matrix.$matrix.m41+x*matrix.$matrix.m11+y*matrix.$matrix.m21+z*matrix.$matrix.m31;
      this[1] = w*matrix.$matrix.m42+x*matrix.$matrix.m12+y*matrix.$matrix.m22+z*matrix.$matrix.m32;
      this[2] = w*matrix.$matrix.m43+x*matrix.$matrix.m13+y*matrix.$matrix.m23+z*matrix.$matrix.m33;
      this[3] = w*matrix.$matrix.m44+x*matrix.$matrix.m14+y*matrix.$matrix.m24+z*matrix.$matrix.m34;
      return this[3];
    }
     cross(v) {
      var x=this[1]*v[2]-this[2]*v[1];
      var y=this[2]*v[0]-this[0]*v[2];
      var z=this[0]*v[1]-this[1]*v[0];
      this[0] = x;
      this[1] = y;
      this[2] = z;
      return this;
    }
     preNormalizedAngle(v2) {
      if (this.dot(v2)<0.0) {
          var vec=new Vector4();
          vec[0] = -v2[0];
          vec[1] = -v2[1];
          vec[2] = -v2[2];
          vec[3] = -v2[3];
          return Math.pi-2.0*saasin(vec.vectorDistance(this)/2.0);
      }
      else 
        return 2.0*saasin(v2.vectorDistance(this)/2.0);
    }
     loadSTRUCT(reader) {
      reader(this);
      this.load(this.vec);
      delete this.vec;
    }
  }
  _ESClass.register(Vector4);
  _es6_module.add_class(Vector4);
  Vector4 = _es6_module.add_export('Vector4', Vector4);
  
  Vector4.STRUCT = `
vec4 {
  vec : array(float) | obj;
}
`;
  nstructjs.manager.add_class(Vector4);
  var _v3nd_n1_normalizedDot, _v3nd_n2_normalizedDot;
  var _v3nd4_n1_normalizedDot4, _v3nd4_n2_normalizedDot4;
  class Vector3 extends BaseVector {
     constructor(data) {
      super();
      if (arguments.length>1) {
          throw new Error("unexpected argument");
      }
      this.length = 3;
      this[0] = this[1] = this[2] = 0.0;
      if (data!=undefined) {
          this.load(data);
      }
    }
     toCSS() {
      let r=~~(this[0]*255);
      let g=~~(this[1]*255);
      let b=~~(this[2]*255);
      return `rgb(${r},${g},${b})`;
    }
     loadXYZ(x, y, z) {
      this[0] = x;
      this[1] = y;
      this[2] = z;
      return this;
    }
     toJSON() {
      return [this[0], this[1], this[2]];
    }
     loadJSON(obj) {
      return this.load(obj);
    }
     initVector3() {
      this.length = 3;
      this[0] = this[1] = this[2] = 0;
      return this;
    }
     load(data) {
      if (data==undefined)
        return this;
      this[0] = data[0];
      this[1] = data[1];
      this[2] = data[2];
      return this;
    }
     dot(b) {
      return this[0]*b[0]+this[1]*b[1]+this[2]*b[2];
    }
     normalizedDot(v) {
      $_v3nd_n1_normalizedDot.load(this);
      $_v3nd_n2_normalizedDot.load(v);
      $_v3nd_n1_normalizedDot.normalize();
      $_v3nd_n2_normalizedDot.normalize();
      return $_v3nd_n1_normalizedDot.dot($_v3nd_n2_normalizedDot);
    }
    static  normalizedDot4(v1, v2, v3, v4) {
      $_v3nd4_n1_normalizedDot4.load(v2).sub(v1).normalize();
      $_v3nd4_n2_normalizedDot4.load(v4).sub(v3).normalize();
      return $_v3nd4_n1_normalizedDot4.dot($_v3nd4_n2_normalizedDot4);
    }
     multVecMatrix(matrix, ignore_w) {
      if (ignore_w==undefined) {
          ignore_w = false;
      }
      var x=this[0];
      var y=this[1];
      var z=this[2];
      this[0] = matrix.$matrix.m41+x*matrix.$matrix.m11+y*matrix.$matrix.m21+z*matrix.$matrix.m31;
      this[1] = matrix.$matrix.m42+x*matrix.$matrix.m12+y*matrix.$matrix.m22+z*matrix.$matrix.m32;
      this[2] = matrix.$matrix.m43+x*matrix.$matrix.m13+y*matrix.$matrix.m23+z*matrix.$matrix.m33;
      var w=matrix.$matrix.m44+x*matrix.$matrix.m14+y*matrix.$matrix.m24+z*matrix.$matrix.m34;
      if (!ignore_w&&w!=1&&w!=0&&matrix.isPersp) {
          this[0]/=w;
          this[1]/=w;
          this[2]/=w;
      }
      return w;
    }
     cross(v) {
      var x=this[1]*v[2]-this[2]*v[1];
      var y=this[2]*v[0]-this[0]*v[2];
      var z=this[0]*v[1]-this[1]*v[0];
      this[0] = x;
      this[1] = y;
      this[2] = z;
      return this;
    }
     rot2d(A, axis) {
      var x=this[0];
      var y=this[1];
      if (axis==1) {
          this[0] = x*cos(A)+y*sin(A);
          this[1] = y*cos(A)-x*sin(A);
      }
      else {
        this[0] = x*cos(A)-y*sin(A);
        this[1] = y*cos(A)+x*sin(A);
      }
      return this;
    }
     preNormalizedAngle(v2) {
      if (this.dot(v2)<0.0) {
          var vec=new Vector3();
          vec[0] = -v2[0];
          vec[1] = -v2[1];
          vec[2] = -v2[2];
          return Math.pi-2.0*saasin(vec.vectorDistance(this)/2.0);
      }
      else 
        return 2.0*saasin(v2.vectorDistance(this)/2.0);
    }
     loadSTRUCT(reader) {
      reader(this);
      this.load(this.vec);
      delete this.vec;
    }
  }
  _ESClass.register(Vector3);
  _es6_module.add_class(Vector3);
  Vector3 = _es6_module.add_export('Vector3', Vector3);
  Vector3.STRUCT = `
vec3 {
  vec : array(float) | obj;
}
`;
  nstructjs.manager.add_class(Vector3);
  class Vector2 extends BaseVector {
     constructor(data) {
      super();
      if (arguments.length>1) {
          throw new Error("unexpected argument");
      }
      this.length = 2;
      this[0] = this[1] = 0.0;
      if (data!=undefined) {
          this.load(data);
      }
    }
     loadXY(x, y) {
      this[0] = x;
      this[1] = y;
      return this;
    }
     toJSON() {
      return [this[0], this[1]];
    }
     loadJSON(obj) {
      return this.load(obj);
    }
     load(data) {
      if (data==undefined)
        return this;
      this[0] = data[0];
      this[1] = data[1];
      return this;
    }
     rot2d(A, axis) {
      var x=this[0];
      var y=this[1];
      if (axis==1) {
          this[0] = x*cos(A)+y*sin(A);
          this[1] = y*cos(A)-x*sin(A);
      }
      else {
        this[0] = x*cos(A)-y*sin(A);
        this[1] = y*cos(A)+x*sin(A);
      }
      return this;
    }
     dot(b) {
      return this[0]*b[0]+this[1]*b[1];
    }
     multVecMatrix(matrix) {
      var x=this[0];
      var y=this[1];
      var w=1.0;
      this[0] = w*matrix.$matrix.m41+x*matrix.$matrix.m11+y*matrix.$matrix.m21;
      this[1] = w*matrix.$matrix.m42+x*matrix.$matrix.m12+y*matrix.$matrix.m22;
      if (matrix.isPersp) {
          let w2=w*matrix.$matrix.m44+x*matrix.$matrix.m14+y*matrix.$matrix.m24;
          if (w2!=0.0) {
              this[0]/=w2;
              this[1]/=w2;
          }
      }
      return this;
    }
     mulVecQuat(q) {
      let w=1.0;
      let z=0.0;
      var t0=-this[1]*this[0]-z*this[1]-w*z;
      var t1=this[0]*this[0]+z*z-w*this[1];
      var t2=this[0]*this[1]+w*this[0]-this[1]*z;
      z = this[0]*z+this[1]*this[1]-z*this[0];
      this[0] = t1;
      this[1] = t2;
      t1 = t0*-this[1]+this[0]*this[0]-this[1]*w+z*z;
      t2 = t0*-z+this[1]*this[0]-z*this[1]+this[0]*w;
      z = t0*-w+z*this[0]-this[0]*z+this[1]*this[1];
      this[0] = t1;
      this[1] = t2;
      return this;
    }
     loadSTRUCT(reader) {
      reader(this);
      this.load(this.vec);
      delete this.vec;
    }
  }
  _ESClass.register(Vector2);
  _es6_module.add_class(Vector2);
  Vector2 = _es6_module.add_export('Vector2', Vector2);
  
  Vector2.STRUCT = `
vec2 {
  vec : array(float) | obj;
}
`;
  nstructjs.manager.add_class(Vector2);
  let _quat_vs3_temps=util.cachering.fromConstructor(Vector3, 64);
  class Quat extends Vector4 {
     makeUnitQuat() {
      this[0] = 1.0;
      this[1] = this[2] = this[3] = 0.0;
    }
     isZero() {
      return (this[0]==0&&this[1]==0&&this[2]==0&&this[3]==0);
    }
     mulQuat(qt) {
      var a=this[0]*qt[0]-this[1]*qt[1]-this[2]*qt[2]-this[3]*qt[3];
      var b=this[0]*qt[1]+this[1]*qt[0]+this[2]*qt[3]-this[3]*qt[2];
      var c=this[0]*qt[2]+this[2]*qt[0]+this[3]*qt[1]-this[1]*qt[3];
      this[3] = this[0]*qt[3]+this[3]*qt[0]+this[1]*qt[2]-this[2]*qt[1];
      this[0] = a;
      this[1] = b;
      this[2] = c;
    }
     conjugate() {
      this[1] = -this[1];
      this[2] = -this[2];
      this[3] = -this[3];
    }
     dotWithQuat(q2) {
      return this[0]*q2[0]+this[1]*q2[1]+this[2]*q2[2]+this[3]*q2[3];
    }
     invert() {
      var f=this.dot(this);
      if (f==0.0)
        return ;
      conjugate_qt(q);
      this.mulscalar(1.0/f);
    }
     sub(q2) {
      var nq2=new Quat();
      nq2[0] = -q2[0];
      nq2[1] = q2[1];
      nq2[2] = q2[2];
      nq2[3] = q2[3];
      this.mul(nq2);
    }
     mulScalarWithFactor(fac) {
      var angle=fac*bounded_acos(this[0]);
      var co=Math.cos(angle);
      var si=Math.sin(angle);
      this[0] = co;
      var last3=Vector3([this[1], this[2], this[3]]);
      last3.normalize();
      last3.mulScalar(si);
      this[1] = last3[0];
      this[2] = last3[1];
      this[3] = last3[2];
      return this;
    }
     toMatrix(m) {
      if (m==undefined) {
          m = new Matrix4();
      }
      var q0=M_SQRT2*this[0];
      var q1=M_SQRT2*this[1];
      var q2=M_SQRT2*this[2];
      var q3=M_SQRT2*this[3];
      var qda=q0*q1;
      var qdb=q0*q2;
      var qdc=q0*q3;
      var qaa=q1*q1;
      var qab=q1*q2;
      var qac=q1*q3;
      var qbb=q2*q2;
      var qbc=q2*q3;
      var qcc=q3*q3;
      m.$matrix.m11 = (1.0-qbb-qcc);
      m.$matrix.m12 = (qdc+qab);
      m.$matrix.m13 = (-qdb+qac);
      m.$matrix.m14 = 0.0;
      m.$matrix.m21 = (-qdc+qab);
      m.$matrix.m22 = (1.0-qaa-qcc);
      m.$matrix.m23 = (qda+qbc);
      m.$matrix.m24 = 0.0;
      m.$matrix.m31 = (qdb+qac);
      m.$matrix.m32 = (-qda+qbc);
      m.$matrix.m33 = (1.0-qaa-qbb);
      m.$matrix.m34 = 0.0;
      m.$matrix.m41 = m.$matrix.m42 = m.$matrix.m43 = 0.0;
      m.$matrix.m44 = 1.0;
      return m;
    }
     matrixToQuat(wmat) {
      var mat=new Matrix4(wmat);
      mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
      mat.$matrix.m44 = 1.0;
      var r1=new Vector3([mat.$matrix.m11, mat.$matrix.m12, mat.$matrix.m13]);
      var r2=new Vector3([mat.$matrix.m21, mat.$matrix.m22, mat.$matrix.m23]);
      var r3=new Vector3([mat.$matrix.m31, mat.$matrix.m32, mat.$matrix.m33]);
      r1.normalize();
      r2.normalize();
      r3.normalize();
      mat.$matrix.m11 = r1[0];
      mat.$matrix.m12 = r1[1];
      mat.$matrix.m13 = r1[2];
      mat.$matrix.m21 = r2[0];
      mat.$matrix.m22 = r2[1];
      mat.$matrix.m23 = r2[2];
      mat.$matrix.m31 = r3[0];
      mat.$matrix.m32 = r3[1];
      mat.$matrix.m33 = r3[2];
      var tr=0.25*(1.0+mat.$matrix.m11+mat.$matrix.m22+mat.$matrix.m33);
      var s=0;
      if (tr>FLT_EPSILON) {
          s = Math.sqrt(tr);
          this[0] = s;
          s = 1.0/(4.0*s);
          this[1] = ((mat.$matrix.m23-mat.$matrix.m32)*s);
          this[2] = ((mat.$matrix.m31-mat.$matrix.m13)*s);
          this[3] = ((mat.$matrix.m12-mat.$matrix.m21)*s);
      }
      else {
        if (mat.$matrix.m11>mat.$matrix.m22&&mat.$matrix.m11>mat.$matrix.m33) {
            s = 2.0*Math.sqrt(1.0+mat.$matrix.m11-mat.$matrix.m22-mat.$matrix.m33);
            this[1] = (0.25*s);
            s = 1.0/s;
            this[0] = ((mat.$matrix.m32-mat.$matrix.m23)*s);
            this[2] = ((mat.$matrix.m21+mat.$matrix.m12)*s);
            this[3] = ((mat.$matrix.m31+mat.$matrix.m13)*s);
        }
        else 
          if (mat.$matrix.m22>mat.$matrix.m33) {
            s = 2.0*Math.sqrt(1.0+mat.$matrix.m22-mat.$matrix.m11-mat.$matrix.m33);
            this[2] = (0.25*s);
            s = 1.0/s;
            this[0] = ((mat.$matrix.m31-mat.$matrix.m13)*s);
            this[1] = ((mat.$matrix.m21+mat.$matrix.m12)*s);
            this[3] = ((mat.$matrix.m32+mat.$matrix.m23)*s);
        }
        else {
          s = 2.0*Math.sqrt(1.0+mat.$matrix.m33-mat.$matrix.m11-mat.$matrix.m22);
          this[3] = (0.25*s);
          s = 1.0/s;
          this[0] = ((mat.$matrix.m21-mat.$matrix.m12)*s);
          this[1] = ((mat.$matrix.m31+mat.$matrix.m13)*s);
          this[2] = ((mat.$matrix.m32+mat.$matrix.m23)*s);
        }
      }
      this.normalize();
    }
     normalize() {
      var len=Math.sqrt(this.dot(this));
      if (len!=0.0) {
          this.mulScalar(1.0/len);
      }
      else {
        this[1] = 1.0;
        this[0] = this[2] = this[3] = 0.0;
      }
      return this;
    }
     axisAngleToQuat(axis, angle) {
      let nor=_quat_vs3_temps.next().load(axis);
      nor.normalize();
      if (nor.dot(nor)!=0.0) {
          var phi=angle/2.0;
          var si=Math.sin(phi);
          this[0] = Math.cos(phi);
          this[1] = nor[0]*si;
          this[2] = nor[1]*si;
          this[3] = nor[2]*si;
      }
      else {
        this.makeUnitQuat();
      }
      return this;
    }
     rotationBetweenVecs(v1, v2) {
      v1 = new Vector3(v1);
      v2 = new Vector3(v2);
      v1.normalize();
      v2.normalize();
      var axis=new Vector3(v1);
      axis.cross(v2);
      var angle=v1.preNormalizedAngle(v2);
      this.axisAngleToQuat(axis, angle);
    }
     quatInterp(quat2, t) {
      var quat=new Quat();
      var cosom=this[0]*quat2[0]+this[1]*quat2[1]+this[2]*quat2[2]+this[3]*quat2[3];
      if (cosom<0.0) {
          cosom = -cosom;
          quat[0] = -this[0];
          quat[1] = -this[1];
          quat[2] = -this[2];
          quat[3] = -this[3];
      }
      else {
        quat[0] = this[0];
        quat[1] = this[1];
        quat[2] = this[2];
        quat[3] = this[3];
      }
      var omega, sinom, sc1, sc2;
      if ((1.0-cosom)>0.0001) {
          omega = Math.acos(cosom);
          sinom = Math.sin(omega);
          sc1 = Math.sin((1.0-t)*omega)/sinom;
          sc2 = Math.sin(t*omega)/sinom;
      }
      else {
        sc1 = 1.0-t;
        sc2 = t;
      }
      this[0] = sc1*quat[0]+sc2*quat2[0];
      this[1] = sc1*quat[1]+sc2*quat2[1];
      this[2] = sc1*quat[2]+sc2*quat2[2];
      this[3] = sc1*quat[3]+sc2*quat2[3];
      return this;
    }
     loadSTRUCT(reader) {
      reader(this);
      this.load(this.vec);
      delete this.vec;
    }
  }
  _ESClass.register(Quat);
  _es6_module.add_class(Quat);
  Quat = _es6_module.add_export('Quat', Quat);
  
  Quat.STRUCT = `
quat {
  vec : array(float) | obj;
}
`;
  nstructjs.manager.add_class(Quat);
  _v3nd4_n1_normalizedDot4 = new Vector3();
  _v3nd4_n2_normalizedDot4 = new Vector3();
  _v3nd_n1_normalizedDot = new Vector3();
  _v3nd_n2_normalizedDot = new Vector3();
  BaseVector.inherit(Vector4, 4);
  BaseVector.inherit(Vector3, 3);
  BaseVector.inherit(Vector2, 2);
  lookat_cache_vs3 = util.cachering.fromConstructor(Vector3, 64);
  lookat_cache_vs4 = util.cachering.fromConstructor(Vector4, 64);
  makenormalcache = util.cachering.fromConstructor(Vector3, 64);
  var $_v3nd_n1_normalizedDot=new Vector3();
  var $_v3nd_n2_normalizedDot=new Vector3();
  var $_v3nd4_n1_normalizedDot4=new Vector3();
  var $_v3nd4_n2_normalizedDot4=new Vector3();
  var M_SQRT2=Math.sqrt(2.0);
  var FLT_EPSILON=2.22e-16;
  class internal_matrix  {
     constructor() {
      this.m11 = 1.0;
      this.m12 = 0.0;
      this.m13 = 0.0;
      this.m14 = 0.0;
      this.m21 = 0.0;
      this.m22 = 1.0;
      this.m23 = 0.0;
      this.m24 = 0.0;
      this.m31 = 0.0;
      this.m32 = 0.0;
      this.m33 = 1.0;
      this.m34 = 0.0;
      this.m41 = 0.0;
      this.m42 = 0.0;
      this.m43 = 0.0;
      this.m44 = 1.0;
    }
  }
  _ESClass.register(internal_matrix);
  _es6_module.add_class(internal_matrix);
  var lookat_cache_vs3;
  var lookat_cache_vs4;
  var makenormalcache;
  class Matrix4  {
     constructor(m) {
      this.$matrix = new internal_matrix();
      this.isPersp = false;
      if (typeof m==='object') {
          if ("length" in m&&m.length>=16) {
              this.load(m);
          }
          else 
            if (__instance_of(m, Matrix4)) {
              this.load(m);
          }
      }
    }
     clone() {
      return new Matrix4(this);
    }
     equals(m) {
      let m1=this.$matrix;
      let m2=m.$matrix;
      let ok=1;
      ok = ok&&m1.m11==m2.m11;
      ok = ok&&m1.m12==m2.m12;
      ok = ok&&m1.m13==m2.m13;
      ok = ok&&m1.m14==m2.m14;
      ok = ok&&m1.m21==m2.m21;
      ok = ok&&m1.m22==m2.m22;
      ok = ok&&m1.m23==m2.m23;
      ok = ok&&m1.m24==m2.m24;
      ok = ok&&m1.m31==m2.m31;
      ok = ok&&m1.m32==m2.m32;
      ok = ok&&m1.m33==m2.m33;
      ok = ok&&m1.m34==m2.m34;
      ok = ok&&m1.m41==m2.m41;
      ok = ok&&m1.m42==m2.m42;
      ok = ok&&m1.m43==m2.m43;
      ok = ok&&m1.m44==m2.m44;
      return ok;
    }
     load() {
      if (arguments.length==1&&typeof arguments[0]=='object') {
          var matrix;
          if (__instance_of(arguments[0], Matrix4)) {
              matrix = arguments[0].$matrix;
              this.isPersp = arguments[0].isPersp;
              this.$matrix.m11 = matrix.m11;
              this.$matrix.m12 = matrix.m12;
              this.$matrix.m13 = matrix.m13;
              this.$matrix.m14 = matrix.m14;
              this.$matrix.m21 = matrix.m21;
              this.$matrix.m22 = matrix.m22;
              this.$matrix.m23 = matrix.m23;
              this.$matrix.m24 = matrix.m24;
              this.$matrix.m31 = matrix.m31;
              this.$matrix.m32 = matrix.m32;
              this.$matrix.m33 = matrix.m33;
              this.$matrix.m34 = matrix.m34;
              this.$matrix.m41 = matrix.m41;
              this.$matrix.m42 = matrix.m42;
              this.$matrix.m43 = matrix.m43;
              this.$matrix.m44 = matrix.m44;
              return this;
          }
          else 
            matrix = arguments[0];
          if ("length" in matrix&&matrix.length>=16) {
              this.$matrix.m11 = matrix[0];
              this.$matrix.m12 = matrix[1];
              this.$matrix.m13 = matrix[2];
              this.$matrix.m14 = matrix[3];
              this.$matrix.m21 = matrix[4];
              this.$matrix.m22 = matrix[5];
              this.$matrix.m23 = matrix[6];
              this.$matrix.m24 = matrix[7];
              this.$matrix.m31 = matrix[8];
              this.$matrix.m32 = matrix[9];
              this.$matrix.m33 = matrix[10];
              this.$matrix.m34 = matrix[11];
              this.$matrix.m41 = matrix[12];
              this.$matrix.m42 = matrix[13];
              this.$matrix.m43 = matrix[14];
              this.$matrix.m44 = matrix[15];
              return this;
          }
      }
      this.makeIdentity();
      return this;
    }
     toJSON() {
      return {isPersp: this.isPersp, 
     items: this.getAsArray()}
    }
    static  fromJSON() {
      var mat=new Matrix4();
      mat.load(json.items);
      mat.isPersp = json.isPersp;
      return mat;
    }
     getAsArray() {
      return [this.$matrix.m11, this.$matrix.m12, this.$matrix.m13, this.$matrix.m14, this.$matrix.m21, this.$matrix.m22, this.$matrix.m23, this.$matrix.m24, this.$matrix.m31, this.$matrix.m32, this.$matrix.m33, this.$matrix.m34, this.$matrix.m41, this.$matrix.m42, this.$matrix.m43, this.$matrix.m44];
    }
     getAsFloat32Array() {
      return new Float32Array(this.getAsArray());
    }
     setUniform(ctx, loc, transpose) {
      if (Matrix4.setUniformArray==undefined) {
          Matrix4.setUniformWebGLArray = new Float32Array(16);
          Matrix4.setUniformArray = new Array(16);
      }
      Matrix4.setUniformArray[0] = this.$matrix.m11;
      Matrix4.setUniformArray[1] = this.$matrix.m12;
      Matrix4.setUniformArray[2] = this.$matrix.m13;
      Matrix4.setUniformArray[3] = this.$matrix.m14;
      Matrix4.setUniformArray[4] = this.$matrix.m21;
      Matrix4.setUniformArray[5] = this.$matrix.m22;
      Matrix4.setUniformArray[6] = this.$matrix.m23;
      Matrix4.setUniformArray[7] = this.$matrix.m24;
      Matrix4.setUniformArray[8] = this.$matrix.m31;
      Matrix4.setUniformArray[9] = this.$matrix.m32;
      Matrix4.setUniformArray[10] = this.$matrix.m33;
      Matrix4.setUniformArray[11] = this.$matrix.m34;
      Matrix4.setUniformArray[12] = this.$matrix.m41;
      Matrix4.setUniformArray[13] = this.$matrix.m42;
      Matrix4.setUniformArray[14] = this.$matrix.m43;
      Matrix4.setUniformArray[15] = this.$matrix.m44;
      Matrix4.setUniformWebGLArray.set(Matrix4.setUniformArray);
      ctx.uniformMatrix4fv(loc, transpose, Matrix4.setUniformWebGLArray);
    }
     makeIdentity() {
      this.$matrix.m11 = 1;
      this.$matrix.m12 = 0;
      this.$matrix.m13 = 0;
      this.$matrix.m14 = 0;
      this.$matrix.m21 = 0;
      this.$matrix.m22 = 1;
      this.$matrix.m23 = 0;
      this.$matrix.m24 = 0;
      this.$matrix.m31 = 0;
      this.$matrix.m32 = 0;
      this.$matrix.m33 = 1;
      this.$matrix.m34 = 0;
      this.$matrix.m41 = 0;
      this.$matrix.m42 = 0;
      this.$matrix.m43 = 0;
      this.$matrix.m44 = 1;
      this.isPersp = false;
    }
     transpose() {
      var tmp=this.$matrix.m12;
      this.$matrix.m12 = this.$matrix.m21;
      this.$matrix.m21 = tmp;
      tmp = this.$matrix.m13;
      this.$matrix.m13 = this.$matrix.m31;
      this.$matrix.m31 = tmp;
      tmp = this.$matrix.m14;
      this.$matrix.m14 = this.$matrix.m41;
      this.$matrix.m41 = tmp;
      tmp = this.$matrix.m23;
      this.$matrix.m23 = this.$matrix.m32;
      this.$matrix.m32 = tmp;
      tmp = this.$matrix.m24;
      this.$matrix.m24 = this.$matrix.m42;
      this.$matrix.m42 = tmp;
      tmp = this.$matrix.m34;
      this.$matrix.m34 = this.$matrix.m43;
      this.$matrix.m43 = tmp;
    }
     determinant() {
      return this._determinant4x4();
    }
     invert() {
      var det=this._determinant4x4();
      if (Math.abs(det)<1e-08)
        return null;
      this._makeAdjoint();
      this.$matrix.m11/=det;
      this.$matrix.m12/=det;
      this.$matrix.m13/=det;
      this.$matrix.m14/=det;
      this.$matrix.m21/=det;
      this.$matrix.m22/=det;
      this.$matrix.m23/=det;
      this.$matrix.m24/=det;
      this.$matrix.m31/=det;
      this.$matrix.m32/=det;
      this.$matrix.m33/=det;
      this.$matrix.m34/=det;
      this.$matrix.m41/=det;
      this.$matrix.m42/=det;
      this.$matrix.m43/=det;
      this.$matrix.m44/=det;
    }
     translate(x, y, z) {
      if (typeof x=='object'&&"length" in x) {
          var t=x;
          x = t[0];
          y = t[1];
          z = t[2];
      }
      x = x===undefined ? 0 : x;
      y = y===undefined ? 0 : y;
      z = z===undefined ? 0 : z;
      var matrix=new Matrix4();
      matrix.$matrix.m41 = x;
      matrix.$matrix.m42 = y;
      matrix.$matrix.m43 = z;
      this.multiply(matrix);
      return this;
    }
     preTranslate(x, y, z) {
      if (typeof x=='object'&&"length" in x) {
          var t=x;
          x = t[0];
          y = t[1];
          z = t[2];
      }
      x = x===undefined ? 0 : x;
      y = y===undefined ? 0 : y;
      z = z===undefined ? 0 : z;
      var matrix=new Matrix4();
      matrix.$matrix.m41 = x;
      matrix.$matrix.m42 = y;
      matrix.$matrix.m43 = z;
      this.preMultiply(matrix);
      return this;
    }
     scale(x, y, z, w=1.0) {
      if (typeof x=='object'&&"length" in x) {
          var t=x;
          x = t[0];
          y = t[1];
          z = t[2];
      }
      else {
        if (x===undefined)
          x = 1;
        if (z===undefined) {
            if (y===undefined) {
                y = x;
                z = x;
            }
            else {
              z = x;
            }
        }
        else 
          if (y===undefined) {
            y = x;
        }
      }
      var matrix=new Matrix4();
      matrix.$matrix.m11 = x;
      matrix.$matrix.m22 = y;
      matrix.$matrix.m33 = z;
      matrix.$matrix.m44 = w;
      this.multiply(matrix);
      return this;
    }
     preScale(x, y, z, w=1.0) {
      let mat=new Matrix4();
      mat.scale(x, y, z, w);
      this.preMultiply(mat);
      return this;
    }
     euler_rotate(x, y, z) {
      if (y===undefined) {
          y = 0.0;
      }
      if (z===undefined) {
          z = 0.0;
      }
      window.Matrix4 = Matrix4;
      var xmat=new Matrix4();
      var m=xmat.$matrix;
      var c=Math.cos(x), s=Math.sin(x);
      m.m22 = c;
      m.m23 = s;
      m.m32 = -s;
      m.m33 = c;
      var ymat=new Matrix4();
      c = Math.cos(y);
      s = Math.sin(y);
      var m=ymat.$matrix;
      m.m11 = c;
      m.m13 = -s;
      m.m31 = s;
      m.m33 = c;
      ymat.multiply(xmat);
      var zmat=new Matrix4();
      c = Math.cos(z);
      s = Math.sin(z);
      var m=zmat.$matrix;
      m.m11 = c;
      m.m12 = s;
      m.m21 = -s;
      m.m22 = c;
      zmat.multiply(ymat);
      this.preMultiply(zmat);
      return this;
    }
     toString() {
      var s="";
      var m=this.$matrix;
      function dec(d) {
        var ret=d.toFixed(3);
        if (ret[0]!="-")
          ret = " "+ret;
        return ret;
      }
      s = dec(m.m11)+", "+dec(m.m12)+", "+dec(m.m13)+", "+dec(m.m14)+"\n";
      s+=dec(m.m21)+", "+dec(m.m22)+", "+dec(m.m23)+", "+dec(m.m24)+"\n";
      s+=dec(m.m31)+", "+dec(m.m32)+", "+dec(m.m33)+", "+dec(m.m34)+"\n";
      s+=dec(m.m41)+", "+dec(m.m42)+", "+dec(m.m43)+", "+dec(m.m44)+"\n";
      return s;
    }
     rotate(angle, x, y, z) {
      if (typeof x=='object'&&"length" in x) {
          var t=x;
          x = t[0];
          y = t[1];
          z = t[2];
      }
      else {
        if (arguments.length==1) {
            x = y = 0;
            z = 1;
        }
        else 
          if (arguments.length==3) {
            this.rotate(angle, 1, 0, 0);
            this.rotate(x, 0, 1, 0);
            this.rotate(y, 0, 0, 1);
            return ;
        }
      }
      angle/=2;
      var sinA=Math.sin(angle);
      var cosA=Math.cos(angle);
      var sinA2=sinA*sinA;
      var len=Math.sqrt(x*x+y*y+z*z);
      if (len==0) {
          x = 0;
          y = 0;
          z = 1;
      }
      else 
        if (len!=1) {
          x/=len;
          y/=len;
          z/=len;
      }
      var mat=new Matrix4();
      if (x==1&&y==0&&z==0) {
          mat.$matrix.m11 = 1;
          mat.$matrix.m12 = 0;
          mat.$matrix.m13 = 0;
          mat.$matrix.m21 = 0;
          mat.$matrix.m22 = 1-2*sinA2;
          mat.$matrix.m23 = 2*sinA*cosA;
          mat.$matrix.m31 = 0;
          mat.$matrix.m32 = -2*sinA*cosA;
          mat.$matrix.m33 = 1-2*sinA2;
          mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
          mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
          mat.$matrix.m44 = 1;
      }
      else 
        if (x==0&&y==1&&z==0) {
          mat.$matrix.m11 = 1-2*sinA2;
          mat.$matrix.m12 = 0;
          mat.$matrix.m13 = -2*sinA*cosA;
          mat.$matrix.m21 = 0;
          mat.$matrix.m22 = 1;
          mat.$matrix.m23 = 0;
          mat.$matrix.m31 = 2*sinA*cosA;
          mat.$matrix.m32 = 0;
          mat.$matrix.m33 = 1-2*sinA2;
          mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
          mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
          mat.$matrix.m44 = 1;
      }
      else 
        if (x==0&&y==0&&z==1) {
          mat.$matrix.m11 = 1-2*sinA2;
          mat.$matrix.m12 = 2*sinA*cosA;
          mat.$matrix.m13 = 0;
          mat.$matrix.m21 = -2*sinA*cosA;
          mat.$matrix.m22 = 1-2*sinA2;
          mat.$matrix.m23 = 0;
          mat.$matrix.m31 = 0;
          mat.$matrix.m32 = 0;
          mat.$matrix.m33 = 1;
          mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
          mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
          mat.$matrix.m44 = 1;
      }
      else {
        var x2=x*x;
        var y2=y*y;
        var z2=z*z;
        mat.$matrix.m11 = 1-2*(y2+z2)*sinA2;
        mat.$matrix.m12 = 2*(x*y*sinA2+z*sinA*cosA);
        mat.$matrix.m13 = 2*(x*z*sinA2-y*sinA*cosA);
        mat.$matrix.m21 = 2*(y*x*sinA2-z*sinA*cosA);
        mat.$matrix.m22 = 1-2*(z2+x2)*sinA2;
        mat.$matrix.m23 = 2*(y*z*sinA2+x*sinA*cosA);
        mat.$matrix.m31 = 2*(z*x*sinA2+y*sinA*cosA);
        mat.$matrix.m32 = 2*(z*y*sinA2-x*sinA*cosA);
        mat.$matrix.m33 = 1-2*(x2+y2)*sinA2;
        mat.$matrix.m14 = mat.$matrix.m24 = mat.$matrix.m34 = 0;
        mat.$matrix.m41 = mat.$matrix.m42 = mat.$matrix.m43 = 0;
        mat.$matrix.m44 = 1;
      }
      this.multiply(mat);
      return this;
    }
     normalize() {
      let m=this.$matrix;
      let v1=new Vector4([m.m11, m.m12, m.m13, m.m14]);
      let v2=new Vector4([m.m21, m.m22, m.m23, m.m24]);
      let v3=new Vector4([m.m31, m.m32, m.m33, m.m34]);
      let v4=new Vector4([m.m41, m.m42, m.m43, m.m44]);
      v1.normalize();
      v2.normalize();
      v3.normalize();
      let flat=new Array().concat(v1).concat(v2).concat(v3).concat(v4);
      this.load(flat);
      return this;
    }
     clearTranslation(set_w_to_one=false) {
      let m=this.$matrix;
      m.m41 = m.m42 = m.m43 = 0.0;
      if (set_w_to_one) {
          m.m44 = 1.0;
      }
      return this;
    }
     makeNormalMatrix(normal, up=undefined) {
      let n=makenormalcache.next().load(normal).normalize();
      if (up===undefined) {
          up = makenormalcache.next().zero();
          if (Math.abs(n[2])>0.95) {
              up[1] = 1.0;
          }
          else {
            up[2] = 1.0;
          }
      }
      let x=makenormalcache.next();
      let y=makenormalcache.next();
      x.load(n).cross(up).normalize();
      y.load(x).cross(n).normalize();
      this.makeIdentity();
      let m=this.$matrix;
      m.m11 = x[0];
      m.m12 = x[1];
      m.m13 = x[2];
      m.m21 = y[0];
      m.m22 = y[1];
      m.m23 = y[2];
      m.m31 = n[0];
      m.m32 = n[1];
      m.m33 = n[2];
      m.m44 = 1.0;
      return this;
    }
     preMultiply(mat) {
      var tmp=new Matrix4();
      tmp.load(mat);
      tmp.multiply(this);
      this.load(tmp);
      return this;
    }
     multiply(mat) {
      let mm=this.$matrix;
      let mm2=mat.$matrix;
      let m11=(mm2.m11*mm.m11+mm2.m12*mm.m21+mm2.m13*mm.m31+mm2.m14*mm.m41);
      let m12=(mm2.m11*mm.m12+mm2.m12*mm.m22+mm2.m13*mm.m32+mm2.m14*mm.m42);
      let m13=(mm2.m11*mm.m13+mm2.m12*mm.m23+mm2.m13*mm.m33+mm2.m14*mm.m43);
      let m14=(mm2.m11*mm.m14+mm2.m12*mm.m24+mm2.m13*mm.m34+mm2.m14*mm.m44);
      let m21=(mm2.m21*mm.m11+mm2.m22*mm.m21+mm2.m23*mm.m31+mm2.m24*mm.m41);
      let m22=(mm2.m21*mm.m12+mm2.m22*mm.m22+mm2.m23*mm.m32+mm2.m24*mm.m42);
      let m23=(mm2.m21*mm.m13+mm2.m22*mm.m23+mm2.m23*mm.m33+mm2.m24*mm.m43);
      let m24=(mm2.m21*mm.m14+mm2.m22*mm.m24+mm2.m23*mm.m34+mm2.m24*mm.m44);
      let m31=(mm2.m31*mm.m11+mm2.m32*mm.m21+mm2.m33*mm.m31+mm2.m34*mm.m41);
      let m32=(mm2.m31*mm.m12+mm2.m32*mm.m22+mm2.m33*mm.m32+mm2.m34*mm.m42);
      let m33=(mm2.m31*mm.m13+mm2.m32*mm.m23+mm2.m33*mm.m33+mm2.m34*mm.m43);
      let m34=(mm2.m31*mm.m14+mm2.m32*mm.m24+mm2.m33*mm.m34+mm2.m34*mm.m44);
      let m41=(mm2.m41*mm.m11+mm2.m42*mm.m21+mm2.m43*mm.m31+mm2.m44*mm.m41);
      let m42=(mm2.m41*mm.m12+mm2.m42*mm.m22+mm2.m43*mm.m32+mm2.m44*mm.m42);
      let m43=(mm2.m41*mm.m13+mm2.m42*mm.m23+mm2.m43*mm.m33+mm2.m44*mm.m43);
      let m44=(mm2.m41*mm.m14+mm2.m42*mm.m24+mm2.m43*mm.m34+mm2.m44*mm.m44);
      mm.m11 = m11;
      mm.m12 = m12;
      mm.m13 = m13;
      mm.m14 = m14;
      mm.m21 = m21;
      mm.m22 = m22;
      mm.m23 = m23;
      mm.m24 = m24;
      mm.m31 = m31;
      mm.m32 = m32;
      mm.m33 = m33;
      mm.m34 = m34;
      mm.m41 = m41;
      mm.m42 = m42;
      mm.m43 = m43;
      mm.m44 = m44;
      return this;
    }
     divide(divisor) {
      this.$matrix.m11/=divisor;
      this.$matrix.m12/=divisor;
      this.$matrix.m13/=divisor;
      this.$matrix.m14/=divisor;
      this.$matrix.m21/=divisor;
      this.$matrix.m22/=divisor;
      this.$matrix.m23/=divisor;
      this.$matrix.m24/=divisor;
      this.$matrix.m31/=divisor;
      this.$matrix.m32/=divisor;
      this.$matrix.m33/=divisor;
      this.$matrix.m34/=divisor;
      this.$matrix.m41/=divisor;
      this.$matrix.m42/=divisor;
      this.$matrix.m43/=divisor;
      this.$matrix.m44/=divisor;
      return this;
    }
     ortho(left, right, bottom, top, near, far) {
      console.warn("Matrix4.ortho() is deprecated, use .orthographic() instead");
      var tx=(left+right)/(left-right);
      var ty=(top+bottom)/(top-bottom);
      var tz=(far+near)/(far-near);
      var matrix=new Matrix4();
      matrix.$matrix.m11 = 2/(left-right);
      matrix.$matrix.m12 = 0;
      matrix.$matrix.m13 = 0;
      matrix.$matrix.m14 = 0;
      matrix.$matrix.m21 = 0;
      matrix.$matrix.m22 = 2/(top-bottom);
      matrix.$matrix.m23 = 0;
      matrix.$matrix.m24 = 0;
      matrix.$matrix.m31 = 0;
      matrix.$matrix.m32 = 0;
      matrix.$matrix.m33 = -2/(far-near);
      matrix.$matrix.m34 = 0;
      matrix.$matrix.m41 = tx;
      matrix.$matrix.m42 = ty;
      matrix.$matrix.m43 = tz;
      matrix.$matrix.m44 = 1;
      this.multiply(matrix);
      return this;
    }
     frustum(left, right, bottom, top, near, far) {
      var matrix=new Matrix4();
      var A=(right+left)/(right-left);
      var B=(top+bottom)/(top-bottom);
      var C=-(far+near)/(far-near);
      var D=-(2*far*near)/(far-near);
      matrix.$matrix.m11 = (2*near)/(right-left);
      matrix.$matrix.m12 = 0;
      matrix.$matrix.m13 = 0;
      matrix.$matrix.m14 = 0;
      matrix.$matrix.m21 = 0;
      matrix.$matrix.m22 = 2*near/(top-bottom);
      matrix.$matrix.m23 = 0;
      matrix.$matrix.m24 = 0;
      matrix.$matrix.m31 = A;
      matrix.$matrix.m32 = B;
      matrix.$matrix.m33 = C;
      matrix.$matrix.m34 = -1;
      matrix.$matrix.m41 = 0;
      matrix.$matrix.m42 = 0;
      matrix.$matrix.m43 = D;
      matrix.$matrix.m44 = 0;
      this.isPersp = true;
      this.multiply(matrix);
      return this;
    }
     orthographic(scale, aspect, near, far) {
      let mat=new Matrix4();
      let zscale=far-near;
      mat.scale(2.0/aspect, 2.0, -1.0/scale/zscale, 1.0/scale);
      mat.translate(0.0, 0.0, 0.5*zscale-near);
      this.isPersp = true;
      this.multiply(mat);
      return mat;
    }
     perspective(fovy, aspect, zNear, zFar) {
      var top=Math.tan(fovy*Math.PI/360)*zNear;
      var bottom=-top;
      var left=aspect*bottom;
      var right=aspect*top;
      this.frustum(left, right, bottom, top, zNear, zFar);
      return this;
    }
     lookat(pos, target, up) {
      var matrix=new Matrix4();
      var vec=lookat_cache_vs3.next().load(pos).sub(target);
      var len=vec.vectorLength();
      vec.normalize();
      var zvec=vec;
      var yvec=lookat_cache_vs3.next().load(up).normalize();
      var xvec=lookat_cache_vs3.next().load(yvec).cross(zvec).normalize();
      let mm=matrix.$matrix;
      mm.m11 = xvec[0];
      mm.m12 = yvec[0];
      mm.m13 = zvec[0];
      mm.m14 = 0;
      mm.m21 = xvec[1];
      mm.m22 = yvec[1];
      mm.m23 = zvec[1];
      mm.m24 = 0;
      mm.m31 = xvec[2];
      mm.m32 = yvec[2];
      mm.m33 = zvec[2];
      mm.m11 = xvec[0];
      mm.m12 = xvec[1];
      mm.m13 = xvec[2];
      mm.m14 = 0;
      mm.m21 = yvec[0];
      mm.m22 = yvec[1];
      mm.m23 = yvec[2];
      mm.m24 = 0;
      mm.m31 = zvec[0];
      mm.m32 = zvec[1];
      mm.m33 = zvec[2];
      mm.m34 = 0;
      mm.m41 = pos[0];
      mm.m42 = pos[1];
      mm.m43 = pos[2];
      mm.m44 = 1;
      this.multiply(matrix);
      return this;
    }
     makeRotationOnly() {
      var m=this.$matrix;
      m.m41 = m.m42 = m.m43 = 0.0;
      m.m44 = 1.0;
      let l1=Math.sqrt(m.m11*m.m11+m.m12*m.m12+m.m13*m.m13);
      let l2=Math.sqrt(m.m21*m.m21+m.m22*m.m22+m.m23*m.m23);
      let l3=Math.sqrt(m.m31*m.m31+m.m32*m.m32+m.m33*m.m33);
      if (l1) {
          m.m11/=l1;
          m.m12/=l1;
          m.m13/=l1;
      }
      if (l2) {
          m.m21/=l2;
          m.m22/=l2;
          m.m23/=l2;
      }
      if (l3) {
          m.m31/=l3;
          m.m32/=l3;
          m.m33/=l3;
      }
      return this;
    }
     decompose(_translate, _rotate, _scale, _skew, _perspective) {
      if (this.$matrix.m44==0)
        return false;
      let mat=new Matrix4(this);
      let m=mat.$matrix;
      let t=_translate, r=_rotate, s=_scale;
      if (t) {
          t[0] = m.m41;
          t[1] = m.m42;
          t[2] = m.m43;
      }
      let l1=Math.sqrt(m.m11*m.m11+m.m12*m.m12+m.m13*m.m13);
      let l2=Math.sqrt(m.m21*m.m21+m.m22*m.m22+m.m23*m.m23);
      let l3=Math.sqrt(m.m31*m.m31+m.m32*m.m32+m.m33*m.m33);
      if (l1) {
          m.m11/=l1;
          m.m12/=l1;
          m.m13/=l1;
      }
      if (l2) {
          m.m21/=l2;
          m.m22/=l2;
          m.m23/=l2;
      }
      if (l3) {
          m.m31/=l3;
          m.m32/=l3;
          m.m33/=l3;
      }
      if (s) {
          s[0] = l1;
          s[1] = l2;
          s[2] = l3;
      }
      if (r) {
          r[0] = Math.atan2(m.m23, m.m33);
          r[1] = Math.atan2(-m.m13, Math.sqrt(m.m23*m.m23+m.m33*m.m33));
          r[2] = Math.atan2(m.m12, m.m11);
      }
    }
     _determinant2x2(a, b, c, d) {
      return a*d-b*c;
    }
     _determinant3x3(a1, a2, a3, b1, b2, b3, c1, c2, c3) {
      return a1*this._determinant2x2(b2, b3, c2, c3)-b1*this._determinant2x2(a2, a3, c2, c3)+c1*this._determinant2x2(a2, a3, b2, b3);
    }
     determinant() {
      return this._determinant4x4();
    }
     _determinant4x4() {
      var a1=this.$matrix.m11;
      var b1=this.$matrix.m12;
      var c1=this.$matrix.m13;
      var d1=this.$matrix.m14;
      var a2=this.$matrix.m21;
      var b2=this.$matrix.m22;
      var c2=this.$matrix.m23;
      var d2=this.$matrix.m24;
      var a3=this.$matrix.m31;
      var b3=this.$matrix.m32;
      var c3=this.$matrix.m33;
      var d3=this.$matrix.m34;
      var a4=this.$matrix.m41;
      var b4=this.$matrix.m42;
      var c4=this.$matrix.m43;
      var d4=this.$matrix.m44;
      return a1*this._determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4)-b1*this._determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4)+c1*this._determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4)-d1*this._determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
    }
     _makeAdjoint() {
      var a1=this.$matrix.m11;
      var b1=this.$matrix.m12;
      var c1=this.$matrix.m13;
      var d1=this.$matrix.m14;
      var a2=this.$matrix.m21;
      var b2=this.$matrix.m22;
      var c2=this.$matrix.m23;
      var d2=this.$matrix.m24;
      var a3=this.$matrix.m31;
      var b3=this.$matrix.m32;
      var c3=this.$matrix.m33;
      var d3=this.$matrix.m34;
      var a4=this.$matrix.m41;
      var b4=this.$matrix.m42;
      var c4=this.$matrix.m43;
      var d4=this.$matrix.m44;
      this.$matrix.m11 = this._determinant3x3(b2, b3, b4, c2, c3, c4, d2, d3, d4);
      this.$matrix.m21 = -this._determinant3x3(a2, a3, a4, c2, c3, c4, d2, d3, d4);
      this.$matrix.m31 = this._determinant3x3(a2, a3, a4, b2, b3, b4, d2, d3, d4);
      this.$matrix.m41 = -this._determinant3x3(a2, a3, a4, b2, b3, b4, c2, c3, c4);
      this.$matrix.m12 = -this._determinant3x3(b1, b3, b4, c1, c3, c4, d1, d3, d4);
      this.$matrix.m22 = this._determinant3x3(a1, a3, a4, c1, c3, c4, d1, d3, d4);
      this.$matrix.m32 = -this._determinant3x3(a1, a3, a4, b1, b3, b4, d1, d3, d4);
      this.$matrix.m42 = this._determinant3x3(a1, a3, a4, b1, b3, b4, c1, c3, c4);
      this.$matrix.m13 = this._determinant3x3(b1, b2, b4, c1, c2, c4, d1, d2, d4);
      this.$matrix.m23 = -this._determinant3x3(a1, a2, a4, c1, c2, c4, d1, d2, d4);
      this.$matrix.m33 = this._determinant3x3(a1, a2, a4, b1, b2, b4, d1, d2, d4);
      this.$matrix.m43 = -this._determinant3x3(a1, a2, a4, b1, b2, b4, c1, c2, c4);
      this.$matrix.m14 = -this._determinant3x3(b1, b2, b3, c1, c2, c3, d1, d2, d3);
      this.$matrix.m24 = this._determinant3x3(a1, a2, a3, c1, c2, c3, d1, d2, d3);
      this.$matrix.m34 = -this._determinant3x3(a1, a2, a3, b1, b2, b3, d1, d2, d3);
      this.$matrix.m44 = this._determinant3x3(a1, a2, a3, b1, b2, b3, c1, c2, c3);
    }
     loadSTRUCT(reader) {
      reader(this);
      this.load(this.mat);
      this.__mat = this.mat;
    }
  }
  _ESClass.register(Matrix4);
  _es6_module.add_class(Matrix4);
  Matrix4 = _es6_module.add_export('Matrix4', Matrix4);
  Matrix4.STRUCT = `
mat4 {
  mat      : array(float) | this.getAsArray();
  isPersp  : int          | this.isPersp;
}
`;
  nstructjs.register(Matrix4);
  window.testmat = (x, y, z) =>    {
    if (x===undefined) {
        x = 0;
    }
    if (y===undefined) {
        y = 0;
    }
    if (z===undefined) {
        z = Math.PI*0.5;
    }
    let m1=new Matrix4();
    m1.euler_rotate(x, y, z);
    let t=[0, 0, 0], r=[0, 0, 0], s=[0, 0, 0];
    m1.decompose(t, r, s);
    window.console.log("\n");
    window.console.log(t);
    window.console.log(r);
    window.console.log(s);
    let mat=m1.clone();
    mat.transpose();
    mat.multiply(m1);
    console.log(mat.toString());
    return r;
  }
}, '/dev/fairmotion/src/path.ux/scripts/util/vectormath.js');
es6_module_define('dragbox', ["../core/ui_theme.js", "../util/simple_events.js", "../core/ui.js", "../core/ui_base.js"], function _dragbox_module(_es6_module) {
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var Icons=es6_import_item(_es6_module, '../core/ui_base.js', 'Icons');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var pushModalLight=es6_import_item(_es6_module, '../util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../util/simple_events.js', 'popModalLight');
  var keymap=es6_import_item(_es6_module, '../util/simple_events.js', 'keymap');
  var parsepx=es6_import_item(_es6_module, '../core/ui_theme.js', 'parsepx');
  function startDrag(box) {
    if (box._modal) {
        popModalLight(box._modal);
        box._modal = undefined;
        return ;
    }
    let first=true;
    let lastx=0;
    let lasty=0;
    let handlers={on_mousemove: function on_mousemove(e) {
        let x=e.x, y=e.y;
        if (first) {
            lastx = x;
            lasty = y;
            first = false;
            return ;
        }
        let dx=x-lastx;
        let dy=y-lasty;
        let hx=parsepx(box.style["left"]);
        let hy=parsepx(box.style["top"]);
        hx+=dx;
        hy+=dy;
        console.log(hx, hy);
        box.style["left"] = hx+"px";
        box.style["top"] = hy+"px";
        lastx = x;
        lasty = y;
      }, 
    end: function end() {
        if (box._modal) {
            popModalLight(box._modal);
            box._modal = undefined;
        }
      }, 
    on_mouseup: function on_mouseup(e) {
        this.end();
      }, 
    on_keydown: function on_keydown(e) {
        switch (e.keyCode) {
          case keymap["Escape"]:
          case keymap["Return"]:
            this.end();
            break;
        }
      }}
    box._modal = pushModalLight(handlers);
  }
  class DragBox extends Container {
     constructor() {
      super();
      this._done = false;
      this.header = document.createElement("rowframe-x");
      this.contents = document.createElement("container-x");
      this.header.style["border-radius"] = "20px";
      this.header.parentWidget = this;
      this.contents.parentWidget = this;
      this.shadow.appendChild(this.header);
      this.shadow.appendChild(this.contents);
    }
     init() {
      super.init();
      let header=this.header;
      header.ctx = this.ctx;
      this.contents.ctx = this.ctx;
      header._init();
      this.contents._init();
      this.style["min-width"] = "350px";
      header.style["height"] = "35px";
      let icon=header.iconbutton(Icons.DELETE, "Hide", () =>        {
        this.end();
      });
      icon.iconsheet = 0;
      this.addEventListener("mousedown", (e) =>        {
        console.log("start drag");
        startDrag(this);
      }, {capture: false});
      header.background = this.getDefault("Background");
      this.setCSS();
    }
     add() {
      return this.contents.add(...arguments);
    }
     prepend(n) {
      return this.contents.prepend(n);
    }
     appendChild(n) {
      return this.contents.appendChild(n);
    }
     col() {
      return this.contents.col(...arguments);
    }
     row() {
      return this.contents.row(...arguments);
    }
     strip() {
      return this.contents.strip(...arguments);
    }
     button() {
      return this.contents.button(...arguments);
    }
     iconbutton() {
      return this.contents.iconbutton(...arguments);
    }
     iconcheck() {
      return this.contents.iconcheck(...arguments);
    }
     tool() {
      return this.contents.tool(...arguments);
    }
     menu() {
      return this.contents.menu(...arguments);
    }
     prop() {
      return this.contents.prop(...arguments);
    }
     listenum() {
      return this.contents.listenum(...arguments);
    }
     check() {
      return this.contents.check(...arguments);
    }
     iconenum() {
      return this.contents.iconenum(...arguments);
    }
     slider() {
      return this.contents.slider(...arguments);
    }
     simpleslider() {
      return this.contents.simpleslider(...arguments);
    }
     curve() {
      return this.contents.curve(...arguments);
    }
     textbox() {
      return this.contents.textbox(...arguments);
    }
     textarea() {
      return this.contents.textarea(...arguments);
    }
     viewer() {
      return this.contents.viewer(...arguments);
    }
     panel() {
      return this.contents.panel(...arguments);
    }
     tabs() {
      return this.contents.tabs(...arguments);
    }
     table() {
      return this.contents.table(...arguments);
    }
     end() {
      if (this._done) {
          return ;
      }
      this.remove();
      if (this._onend) {
          this._onend();
      }
      if (this.onend) {
          this.onend();
      }
    }
     setCSS() {
      super.setCSS();
      this.background = this.getDefault("Background");
    }
    static  define() {
      return {tagname: "drag-box-x", 
     style: "panel"}
    }
  }
  _ESClass.register(DragBox);
  _es6_module.add_class(DragBox);
  DragBox = _es6_module.add_export('DragBox', DragBox);
  UIBase.register(DragBox);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/dragbox.js');
es6_module_define('theme_editor', ["../core/ui.js", "../core/ui_theme.js", "../util/struct.js", "../core/ui_base.js", "../screen/ScreenArea.js"], function _theme_editor_module(_es6_module) {
  var Area=es6_import_item(_es6_module, '../screen/ScreenArea.js', 'Area');
  var nstructjs=es6_import(_es6_module, '../util/struct.js');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var theme=es6_import_item(_es6_module, '../core/ui_base.js', 'theme');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var color2css=es6_import_item(_es6_module, '../core/ui_theme.js', 'color2css');
  var css2color=es6_import_item(_es6_module, '../core/ui_theme.js', 'css2color');
  var CSSFont=es6_import_item(_es6_module, '../core/ui_theme.js', 'CSSFont');
  let basic_colors={'white': [1, 1, 1], 
   'grey': [0.5, 0.5, 0.5], 
   'gray': [0.5, 0.5, 0.5], 
   'black': [0, 0, 0], 
   'red': [1, 0, 0], 
   'yellow': [1, 1, 0], 
   'green': [0, 1, 0], 
   'teal': [0, 1, 1], 
   'cyan': [0, 1, 1], 
   'blue': [0, 0, 1], 
   'orange': [1, 0.5, 0.25], 
   'brown': [0.5, 0.4, 0.3], 
   'purple': [1, 0, 1], 
   'pink': [1, 0.5, 0.5]}
  class ThemeEditor extends Container {
     constructor() {
      super();
    }
     init() {
      super.init();
      this.build();
    }
     doFolder(key, obj) {
      let panel=this.panel(key);
      panel.style["margin-left"] = "15px";
      let row=panel.row();
      let col1=row.col();
      let col2=row.col();
      let do_onchange=(key, k) =>        {
        if (this.onchange) {
            this.onchange(key, k);
        }
      };
      let ok=false;
      let _i=0;
      let dokey=(k, v) =>        {
        let col=_i%2==0 ? col1 : col2;
        if (k.toLowerCase().search("flag")>=0) {
            return ;
        }
        if (typeof v==="string") {
            let v2=v.toLowerCase().trim();
            let iscolor=v2 in basic_colors;
            iscolor = iscolor||v2.search("rgb")>=0;
            iscolor = iscolor||v2[0]==="#";
            if (iscolor) {
                let cw=col.colorbutton();
                ok = true;
                _i++;
                try {
                  cw.setRGBA(css2color(v2));
                }
                catch (error) {
                    console.warn("Failed to set color "+k, v2);
                }
                cw.onchange = () =>                  {
                  console.log("setting '"+k+"' to "+color2css(cw.rgba), key);
                  theme[key][k] = color2css(cw.rgba);
                  do_onchange(key, k);
                };
                cw.label = k;
            }
            else {
              let box=col.textbox();
              box.onchange = () =>                {
                theme[key][k] = box.text;
                do_onchange(key, k);
              };
              box.text = v;
            }
        }
        else 
          if (typeof v==="number") {
            let slider=col.slider(undefined, k, v, 0, 256, 0.01, false);
            ok = true;
            _i++;
            slider.onchange = () =>              {
              theme[key][k] = slider.value;
              do_onchange(key, k);
            };
        }
        else 
          if (typeof v==="object"&&__instance_of(v, CSSFont)) {
            let panel2=col.panel(k);
            ok = true;
            _i++;
            let textbox=(key) =>              {
              panel2.label(key);
              panel2.textbox(undefined, v[key]).onchange = function () {
                v[key] = this.text;
                do_onchange(key, k);
              }
            };
            textbox("font");
            textbox("variant");
            textbox("weight");
            textbox("style");
            let cw=panel2.colorbutton();
            cw.label = "color";
            cw.setRGBA(css2color(v.color));
            cw.onchange = () =>              {
              v.color = color2css(cw.rgba);
              do_onchange(key, k);
            };
            let slider=panel2.slider(undefined, "size", v.size);
            slider.onchange = () =>              {
              v.size = slider.value;
              do_onchange(key, k);
            };
        }
      };
      for (let k in obj) {
          let v=obj[k];
          dokey(k, v);
      }
      if (!ok) {
          panel.remove();
      }
      else {
        panel.closed = true;
      }
    }
     build() {
      let keys=Object.keys(theme);
      keys.sort();
      for (let k of keys) {
          let v=theme[k];
          if (typeof v==="object") {
              this.doFolder(k, v);
          }
      }
    }
    static  define() {
      return {tagname: "theme-editor-x", 
     style: "theme-editor"}
    }
  }
  _ESClass.register(ThemeEditor);
  _es6_module.add_class(ThemeEditor);
  ThemeEditor = _es6_module.add_export('ThemeEditor', ThemeEditor);
  UIBase.register(ThemeEditor);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/theme_editor.js');
es6_module_define('ui_button', ["../controller/simple_controller.js", "../util/util.js", "../util/events.js", "../toolsys/toolprop.js", "../util/vectormath.js", "../core/ui_base.js", "../toolsys/simple_toolsys.js", "../config/const.js"], function _ui_button_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../util/events.js');
  var simple_toolsys=es6_import(_es6_module, '../toolsys/simple_toolsys.js');
  var toolprop=es6_import(_es6_module, '../toolsys/toolprop.js');
  var DataPathError=es6_import_item(_es6_module, '../controller/simple_controller.js', 'DataPathError');
  var Vector3=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../util/vectormath.js', 'Quat');
  var Matrix4=es6_import_item(_es6_module, '../util/vectormath.js', 'Matrix4');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  let keymap=events.keymap;
  let EnumProperty=toolprop.EnumProperty, PropTypes=toolprop.PropTypes;
  let UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, IconSheets=ui_base.IconSheets;
  let parsepx=ui_base.parsepx;
  class Button extends UIBase {
     constructor() {
      super();
      let dpi=this.getDPI();
      this._last_update_key = "";
      this._name = "";
      this._namePad = undefined;
      this._last_w = 0;
      this._last_h = 0;
      this._last_dpi = dpi;
      this._lastw = undefined;
      this._lasth = undefined;
      this.dom = document.createElement("canvas");
      this.g = this.dom.getContext("2d");
      this.dom.setAttribute("class", "canvas1");
      this.dom.tabIndex = 0;
      this._last_bg = undefined;
      this.addEventListener("keydown", (e) =>        {
        if (this.disabled)
          return ;
        if (cconst.DEBUG.buttonEvents)
          console.log(e.keyCode);
        switch (e.keyCode) {
          case 27:
            this.blur();
            e.preventDefault();
            e.stopPropagation();
            break;
          case 32:
          case 13:
            this.click();
            e.preventDefault();
            e.stopPropagation();
            break;
        }
      });
      this.addEventListener("focusin", () =>        {
        if (this.disabled)
          return ;
        this._focus = 1;
        this._redraw();
        this.focus();
      });
      this.addEventListener("blur", () =>        {
        if (this.disabled)
          return ;
        this._focus = 0;
        this._redraw();
      });
      this._last_disabled = false;
      this._auto_depress = true;
      let style=document.createElement("style");
      style.textContent = `.canvas1 {
      -moz-user-focus: normal;
      moz-user-focus: normal;
      user-focus: normal;
      padding : 0px;
      margin : 0px;
    }
    `;
      this.shadow.appendChild(style);
      let form=this._div = document.createElement("div");
      form.style["tabindex"] = 4;
      form.tabIndex = 4;
      form.setAttribute("type", "hidden");
      form.type = "hidden";
      form.style["-moz-user-focus"] = "normal";
      form.setAttribute("class", "canvas1");
      form.style["padding"] = form.style["margin"] = "0px";
      form.appendChild(this.dom);
      this.shadow.appendChild(form);
    }
    get  tabIndex() {
      return this._div.tabIndex;
    }
    set  tabIndex(val) {
      this._div.tabIndex = val;
    }
    get  boxpad() {
      throw new Error("Button.boxpad is deprecated");
      return this.getDefault("BoxMargin");
    }
     click() {
      if (this._onpress) {
          let rect=this.getClientRects();
          let x=rect.x+rect.width*0.5;
          let y=rect.y+rect.height*0.5;
          let e={x: x, 
       y: y, 
       stopPropagation: () =>              {            }, 
       preventDefault: () =>              {            }};
          this._onpress(e);
      }
      super.click();
    }
    set  boxpad(val) {
      throw new Error("Deprecated call to Button.boxpad setter");
    }
     init() {
      let dpi=this.getDPI();
      let width=~~(this.getDefault("defaultWidth"));
      let height=~~(this.getDefault("defaultHeight"));
      this.dom.style["width"] = width+"px";
      this.dom.style["height"] = height+"px";
      this.dom.style["padding"] = this.dom.style["margin"] = "0px";
      this.dom.width = Math.ceil(width*dpi);
      this.dom.height = Math.ceil(parsepx(this.dom.style["height"])*dpi);
      this._name = undefined;
      this.updateName();
      this.bindEvents();
      this._redraw();
    }
     setAttribute(key, val) {
      super.setAttribute(key, val);
      if (key=="name") {
          this.updateName();
          this.updateWidth();
      }
    }
    get  r() {
      return this.getDefault("BoxRadius");
    }
    set  r(val) {
      this.overrideDefault("BoxRadius", val);
    }
     bindEvents() {
      let press_gen=0;
      let press=(e) =>        {
        e.stopPropagation();
        if (cconst.DEBUG.buttonEvents)
          console.log("button press", this._pressed, this.disabled, e.button);
        if (this.disabled)
          return ;
        this._pressed = true;
        if (util.isMobile()&&this.onclick&&e.button===0) {
            this.onclick();
        }
        if (this._onpress) {
            this._onpress(this);
        }
        this._redraw();
        e.preventDefault();
      };
      let depress=(e) =>        {
        if (cconst.DEBUG.buttonEvents)
          console.log("button depress", e.button, e.was_touch);
        if (this._auto_depress) {
            this._pressed = false;
            if (this.disabled)
              return ;
            this._redraw();
        }
        e.preventDefault();
        e.stopPropagation();
        if (util.isMobile()||e.type==="mouseup"&&e.button) {
            return ;
        }
        this._redraw();
        if (cconst.DEBUG.buttonEvents)
          console.log("button click callback:", this.onclick, this._onpress, this.onpress);
        if (this.onclick&&e.touches!==undefined) {
            this.onclick(this);
        }
      };
      this.addEventListener("mousedown", press, {captured: true, 
     passive: false});
      this.addEventListener("mouseup", depress, {captured: true, 
     passive: false});
      this.addEventListener("mouseover", (e) =>        {
        if (this.disabled)
          return ;
        this._highlight = true;
        this._repos_canvas();
        this._redraw();
      });
      this.addEventListener("mouseout", (e) =>        {
        if (this.disabled)
          return ;
        this._highlight = false;
        this._repos_canvas();
        this._redraw();
      });
    }
     updateDisabled() {
      if (this._last_disabled!=this.disabled) {
          this._last_disabled = this.disabled;
          this.dom._background = this.getDefault("BoxBG");
          this._repos_canvas();
          this._redraw();
          if (cconst.DEBUG.buttonEvents)
            console.log("disabled update!", this.disabled, this.style["background-color"]);
      }
    }
     updateDefaultSize() {
      let height=~~(this.getDefault("defaultHeight"))+this.getDefault("BoxMargin");
      let size=this.getDefault("DefaultText").size*1.33;
      height = ~~Math.max(height, size);
      height = height+"px";
      if (height!==this.style["height"]) {
          this.style["height"] = height;
          this.dom.style["height"] = height;
          this._repos_canvas();
          this._redraw();
      }
    }
     _calcUpdateKey() {
      let ret=this.getDefault("BoxBG")+":"+this.getDefault("BoxHighlight")+":";
      ret+=this.style["background-color"]+":";
      ret+=this.getDefault("BoxRadius")+":"+this.getDefault("BoxMargin")+":";
      ret+=this.getAttribute("name")+":";
      return ret;
    }
     update() {
      super.update();
      this.style["user-select"] = "none";
      this.dom.style["user-select"] = "none";
      this.updateDefaultSize();
      this.updateWidth();
      this.updateDPI();
      this.updateName();
      this.updateDisabled();
      if (this.background!==this._last_bg) {
          this._last_bg = this.background;
          this._repos_canvas();
          this._redraw();
      }
      let key=this._calcUpdateKey();
      if (key!==this._last_update_key) {
          this._last_update_key = key;
          this.setCSS();
          this._repos_canvas();
          this._redraw();
      }
    }
     setCSS() {
      super.setCSS();
      let name=this._name;
      if (name===undefined) {
          return ;
      }
      let dpi=this.getDPI();
      let pad=this.getDefault("BoxMargin");
      let ts=this.getDefault("DefaultText").size;
      let tw=ui_base.measureText(this, this._genLabel()).width/dpi+8+pad;
      if (this._namePad!==undefined) {
          tw+=this._namePad;
      }
      let w=this.getDefault("numslider_width")/dpi;
      w = Math.max(w, tw);
      w = ~~w;
      this.dom.style["width"] = w+"px";
    }
     updateName() {
      if (!this.hasAttribute("name")) {
          return ;
      }
      let name=this.getAttribute("name");
      if (name!==this._name) {
          this._name = name;
          this.setCSS();
          this._repos_canvas();
          this._redraw();
      }
    }
     updateWidth(w_add=0) {

    }
     _repos_canvas() {
      let dpi=this.getDPI();
      let w=parsepx(this.dom.style["width"]);
      let h=parsepx(this.dom.style["height"]);
      let w2=~~(w*dpi);
      let h2=~~(h*dpi);
      w = w2/dpi;
      h = h2/dpi;
      this.dom.width = w2;
      this.dom.style["width"] = w+"px";
      this.dom.height = h2;
      this.dom.style["height"] = h+"px";
    }
     updateDPI() {
      let dpi=this.getDPI();
      if (this._last_dpi!=dpi) {
          this._last_dpi = dpi;
          this.g.font = undefined;
          this.setCSS();
          this._repos_canvas();
          this._redraw();
      }
      if (this.style["background-color"]) {
          this.dom._background = this.style["background-color"];
          this.style["background-color"] = "";
      }
    }
     _genLabel() {
      let text=""+this._name;
      return text;
    }
     _redraw(draw_text=true) {
      let dpi=this.getDPI();
      if (this._pressed) {
          this.dom._background = this.getDefault("BoxDepressed");
      }
      else 
        if (this._highlight) {
          this.dom._background = this.getDefault("BoxHighlight");
      }
      else {
        this.dom._background = this.getDefault("BoxBG");
      }
      ui_base.drawRoundBox(this, this.dom, this.g, undefined, undefined, undefined, undefined);
      if (this._focus) {
          let w=this.dom.width, h=this.dom.height;
          let p=1/dpi;
          this.g.translate(p, p);
          let lw=this.g.lineWidth;
          this.g.lineWidth = 2*dpi;
          ui_base.drawRoundBox(this, this.dom, this.g, w-p*2, h-p*2, this.r, "stroke", this.getDefault("BoxHighlight"));
          this.g.lineWidth = lw;
          this.g.translate(-p, -p);
      }
      if (draw_text) {
          this._draw_text();
      }
    }
     _draw_text() {
      let dpi=this.getDPI();
      if (util.isMobile()) {
          dpi = dpi;
      }
      let pad=this.getDefault("BoxMargin")*dpi;
      let ts=this.getDefault("DefaultText").size*dpi;
      let text=this._genLabel();
      let font=this.getDefault("DefaultText");
      let w=this.dom.width, h=this.dom.height;
      let tw=ui_base.measureText(this, text, undefined, undefined, ts, font).width;
      let cx=pad*0.5;
      let cy=h*0.5+ts*0.5;
      let g=this.g;
      ui_base.drawText(this, ~~cx, ~~cy, text, {canvas: this.dom, 
     g: this.g, 
     size: ts/dpi, 
     font: font});
    }
    static  define() {
      return {tagname: "button-x", 
     style: "button"}
    }
  }
  _ESClass.register(Button);
  _es6_module.add_class(Button);
  Button = _es6_module.add_export('Button', Button);
  UIBase.register(Button);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_button.js');
es6_module_define('ui_colorpicker', ["../util/events.js", "../toolsys/toolprop.js", "../util/vectormath.js", "../core/ui.js", "../core/ui_base.js", "../util/util.js"], function _ui_colorpicker_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../util/events.js');
  var ui=es6_import(_es6_module, '../core/ui.js');
  var PropTypes=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropTypes');
  let rgb_to_hsv_rets=new util.cachering(() =>    {
    return [0, 0, 0];
  }, 64);
  let Vector2=vectormath.Vector2, Vector3=vectormath.Vector3, Vector4=vectormath.Vector4, Matrix4=vectormath.Matrix4;
  function rgb_to_hsv(r, g, b) {
    var computedH=0;
    var computedS=0;
    var computedV=0;
    if (r==null||g==null||b==null||isNaN(r)||isNaN(g)||isNaN(b)) {
        throw new Error('Please enter numeric RGB values!');
        return ;
    }
    var minRGB=Math.min(r, Math.min(g, b));
    var maxRGB=Math.max(r, Math.max(g, b));
    if (minRGB==maxRGB) {
        computedV = minRGB;
        let ret=rgb_to_hsv_rets.next();
        ret[0] = 0, ret[1] = 0, ret[2] = computedV;
        return ret;
    }
    var d=(r==minRGB) ? g-b : ((b==minRGB) ? r-g : b-r);
    var h=(r==minRGB) ? 3 : ((b==minRGB) ? 1 : 5);
    computedH = (60*(h-d/(maxRGB-minRGB)))/360.0;
    computedS = (maxRGB-minRGB)/maxRGB;
    computedV = maxRGB;
    let ret=rgb_to_hsv_rets.next();
    ret[0] = computedH, ret[1] = computedS, ret[2] = computedV;
    return ret;
  }
  rgb_to_hsv = _es6_module.add_export('rgb_to_hsv', rgb_to_hsv);
  let hsv_to_rgb_rets=new util.cachering(() =>    {
    return [0, 0, 0];
  }, 64);
  function hsv_to_rgb(h, s, v) {
    let c=0, m=0, x=0;
    let ret=hsv_to_rgb_rets.next();
    ret[0] = ret[1] = ret[2] = 0.0;
    h*=360.0;
    c = v*s;
    x = c*(1.0-Math.abs(((h/60.0)%2)-1.0));
    m = v-c;
    let color;
    function RgbF_Create(r, g, b) {
      ret[0] = r;
      ret[1] = g;
      ret[2] = b;
      return ret;
    }
    if (h>=0.0&&h<60.0) {
        color = RgbF_Create(c+m, x+m, m);
    }
    else 
      if (h>=60.0&&h<120.0) {
        color = RgbF_Create(x+m, c+m, m);
    }
    else 
      if (h>=120.0&&h<180.0) {
        color = RgbF_Create(m, c+m, x+m);
    }
    else 
      if (h>=180.0&&h<240.0) {
        color = RgbF_Create(m, x+m, c+m);
    }
    else 
      if (h>=240.0&&h<300.0) {
        color = RgbF_Create(x+m, m, c+m);
    }
    else 
      if (h>=300.0&&h<360.0) {
        color = RgbF_Create(c+m, m, x+m);
    }
    else {
      color = RgbF_Create(m, m, m);
    }
    return color;
  }
  hsv_to_rgb = _es6_module.add_export('hsv_to_rgb', hsv_to_rgb);
  let UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, IconSheets=ui_base.IconSheets;
  let UPW=1.25, VPW=0.75;
  let sample_rets=new util.cachering(() =>    {
    return [0, 0];
  }, 64);
  function inv_sample(u, v) {
    let ret=sample_rets.next();
    ret[0] = Math.pow(u, UPW);
    ret[1] = Math.pow(v, VPW);
    return ret;
  }
  inv_sample = _es6_module.add_export('inv_sample', inv_sample);
  function sample(u, v) {
    let ret=sample_rets.next();
    ret[0] = Math.pow(u, 1.0/UPW);
    ret[1] = Math.pow(v, 1.0/VPW);
    return ret;
  }
  sample = _es6_module.add_export('sample', sample);
  let fieldrand=new util.MersenneRandom(0);
  let fields={}
  function getFieldImage(size, hsva) {
    fieldrand.seed(0);
    let hue=hsva[0];
    let hue_rgb=hsv_to_rgb(hue, 1.0, 1.0);
    let key=size+":"+hue.toFixed(4);
    if (key in fields)
      return fields[key];
    let size2=128;
    let image={width: size, 
    height: size, 
    image: new ImageData(size2, size2)}
    let scale=size2/size;
    let idata=image.image.data;
    let dpi=this.getDPI();
    let band=ui_base.IsMobile() ? 35 : 20;
    let r2=Math.ceil(size*0.5), r1=r2-band*dpi;
    let pad=5*dpi;
    let px1=size*0.5-r1/Math.sqrt(2.0)+pad;
    let py1=size*0.5-r1/Math.sqrt(2.0)+pad;
    let pw=r1/Math.sqrt(2)*2-pad*2, ph=pw;
    image.params = {r1: r1, 
    r2: r2, 
    box: {x: px1, 
     y: py1, 
     width: pw, 
     height: ph}}
    for (let i=0; i<size2*size2; i++) {
        let x=i%size2, y = ~~(i/size2);
        let idx=i*4;
        let alpha=0.0;
        let r=Math.sqrt((x-size2*0.5)**2+(y-size2*0.5)**2);
        if (r<r2*scale&&r>r1*scale) {
            let th=Math.atan2(y-size2*0.5, x-size2*0.5)/(2*Math.PI)+0.5;
            let eps=0.001;
            th = th*(1.0-eps*2)+eps;
            let r=0, g=0, b=0;
            if (th<1.0/6.0) {
                r = 1.0;
                g = th*6.0;
            }
            else 
              if (th<2.0/6.0) {
                th-=1.0/6.0;
                r = 1.0-th*6.0;
                g = 1.0;
            }
            else 
              if (th<3.0/6.0) {
                th-=2.0/6.0;
                g = 1.0;
                b = th*6.0;
            }
            else 
              if (th<4.0/6.0) {
                th-=3.0/6.0;
                b = 1.0;
                g = 1.0-th*6.0;
            }
            else 
              if (th<5.0/6.0) {
                th-=4.0/6.0;
                r = th*6.0;
                b = 1.0;
            }
            else 
              if (th<6.0/6.0) {
                th-=5.0/6.0;
                r = 1.0;
                b = 1.0-th*6.0;
            }
            r = r*255+(fieldrand.random()-0.5);
            g = g*255+(fieldrand.random()-0.5);
            b = b*255+(fieldrand.random()-0.5);
            idata[idx] = r;
            idata[idx+1] = g;
            idata[idx+2] = b;
            alpha = 1.0;
        }
        let px2=(px1+pw)*scale, py2=(py1+ph)*scale;
        if (x>px1*scale&&y>py1*scale&&x<px2&&y<py2) {
            let u=1.0-(x-px1*scale)/(px2-px1*scale);
            let v=1.0-(y-py1*scale)/(py2-py1*scale);
            u = Math.pow(u, UPW);
            v = Math.pow(v, VPW);
            let r=0, g=0, b=0;
            r = hue_rgb[0]*(1.0-u)+u;
            g = hue_rgb[1]*(1.0-u)+u;
            b = hue_rgb[2]*(1.0-u)+u;
            let fac=1.0;
            idata[idx+0] = r*v*255+(fieldrand.random()-0.5)*fac;
            idata[idx+1] = g*v*255+(fieldrand.random()-0.5)*fac;
            idata[idx+2] = b*v*255+(fieldrand.random()-0.5)*fac;
            alpha = 1.0;
        }
        idata[idx+3] = alpha*255;
    }
    let image2=document.createElement("canvas");
    image2.width = size2;
    image2.height = size2;
    let g=image2.getContext("2d");
    g.putImageData(image.image, 0, 0);
    image.canvas = image2;
    image.scale = size/size2;
    fields[key] = image;
    return image;
  }
  getFieldImage = _es6_module.add_export('getFieldImage', getFieldImage);
  let _update_temp=new Vector4();
  class SimpleBox  {
     constructor(pos=[0, 0], size=[1, 1]) {
      this.pos = new Vector2(pos);
      this.size = new Vector2(size);
      this.r = 0;
    }
  }
  _ESClass.register(SimpleBox);
  _es6_module.add_class(SimpleBox);
  SimpleBox = _es6_module.add_export('SimpleBox', SimpleBox);
  class ColorField extends UIBase {
     constructor() {
      super();
      this.hsva = [0.05, 0.6, 0.15, 1.0];
      this.rgba = new Vector4([0, 0, 0, 0]);
      this._recalcRGBA();
      this._last_dpi = undefined;
      let canvas=this.canvas = document.createElement("canvas");
      let g=this.g = canvas.getContext("2d");
      this.shadow.appendChild(canvas);
      let mx, my;
      let do_mouse=(e) =>        {
        let r=this.canvas.getClientRects()[0];
        let dpi=this.getDPI();
        mx = (e.pageX-r.x)*dpi;
        my = (e.pageY-r.y)*dpi;
      };
      let do_touch=(e) =>        {
        if (e.touches.length==0) {
            mx = my = undefined;
            return ;
        }
        let r=this.canvas.getClientRects()[0];
        let dpi=this.getDPI();
        let t=e.touches[0];
        mx = (t.pageX-r.x)*dpi;
        my = (t.pageY-r.y)*dpi;
      };
      this.canvas.addEventListener("mousedown", (e) =>        {
        do_mouse(e);
        return this.on_mousedown(e, mx, my, e.button);
      });
      this.canvas.addEventListener("mousemove", (e) =>        {
        do_mouse(e);
        return this.on_mousemove(e, mx, my, e.button);
      });
      this.canvas.addEventListener("mouseup", (e) =>        {
        do_mouse(e);
        return this.on_mouseup(e, mx, my, e.button);
      });
      this.canvas.addEventListener("touchstart", (e) =>        {
        do_touch(e);
        if (mx!==undefined)
          return this.on_mousedown(e, mx, my, 0);
      });
      this.canvas.addEventListener("touchmove", (e) =>        {
        do_touch(e);
        if (mx!==undefined)
          return this.on_mousemove(e, mx, my, 0);
      });
      this.canvas.addEventListener("touchend", (e) =>        {
        do_touch(e);
        if (mx!==undefined)
          return this.on_mouseup(e, mx, my, 0);
      });
      this.canvas.addEventListener("touchcancel", (e) =>        {
        do_touch(e);
        if (mx!==undefined)
          return this.on_mouseup(e, mx, my, 0);
      });
      this.updateCanvas(true);
    }
     pick_h(x, y) {
      let field=this._field;
      let size=field.width;
      let dpi=this.getDPI();
      if (field===undefined) {
          console.error("no field in colorpicker");
          return ;
      }
      let th=Math.atan2(y-size/2, x-size/2)/(2*Math.PI)+0.5;
      this.hsva[0] = th;
      this.update(true);
      this._recalcRGBA();
      if (this.onchange) {
          this.onchange(this.hsva, this.rgba);
      }
    }
     setHSVA(h, s, v, a=1.0, fire_onchange=true) {
      this.hsva[0] = h;
      this.hsva[1] = s;
      this.hsva[2] = v;
      this.hsva[3] = a;
      this._recalcRGBA();
      this.update(true);
      if (this.onchange&&fire_onchange) {
          this.onchange(this.hsva, this.rgba);
      }
    }
     setRGBA(r, g, b, a=1.0, fire_onchange=true) {
      let ret=rgb_to_hsv(r, g, b);
      this.hsva[0] = ret[0];
      this.hsva[1] = ret[1];
      this.hsva[2] = ret[2];
      this.hsva[3] = a;
      this._recalcRGBA();
      this.update(true);
      if (this.onchange&&fire_onchange) {
          this.onchange(this.hsva, this.rgba);
      }
    }
     _recalcRGBA() {
      let ret=hsv_to_rgb(this.hsva[0], this.hsva[1], this.hsva[2]);
      this.rgba[0] = ret[0];
      this.rgba[1] = ret[1];
      this.rgba[2] = ret[2];
      this.rgba[3] = this.hsva[3];
      return this;
    }
     on_mousedown(e, x, y, button) {
      if (button!=0)
        return ;
      let field=this._field;
      if (field===undefined)
        return ;
      let size=field.width;
      let dpi=this.getDPI();
      let r=Math.sqrt((x-size/2)**2+(y-size/2)**2);
      let pad=5*dpi;
      let px1=field.params.box.x, py1=field.params.box.y, px2=px1+field.params.box.width, py2=py1+field.params.box.height;
      px1-=pad*0.5;
      py1-=pad*0.5;
      px2+=pad*0.5;
      py2+=pad*0.5;
      if (r>field.params.r1-pad&&r<field.params.r2+pad) {
          this.pick_h(x, y);
          this._mode = "h";
      }
      else 
        if (x>=px1&&x<=px2&&y>=py1&&y<=py2) {
          this.pick_sv(x, y);
          console.log("in box");
          this._mode = "sv";
      }
      e.preventDefault();
      e.stopPropagation();
      console.log(x, y);
    }
     pick_sv(x, y) {
      let sv=this._sample_box(x, y);
      this.hsva[1] = sv[0];
      this.hsva[2] = sv[1];
      this._recalcRGBA();
      this.update(true);
      if (this.onchange) {
          this.onchange(this.hsva, this.rgba);
      }
    }
     _sample_box(x, y) {
      let field=this._field;
      if (field===undefined) {
          return [-1, -1];
      }
      let px=field.params.box.x, py=field.params.box.y, pw=field.params.box.width, ph=field.params.box.height;
      let u=(x-px)/pw;
      let v=1.0-(y-py)/ph;
      u = Math.min(Math.max(u, 0.0), 1.0);
      v = Math.min(Math.max(v, 0.0), 1.0);
      let ret=sample(u, 1.0-v);
      u = ret[0], v = 1.0-ret[1];
      return [u, v];
    }
     on_mousemove(e, x, y, button) {
      if (this._mode=="h") {
          this.pick_h(x, y);
      }
      else 
        if (this._mode=="sv") {
          this.pick_sv(x, y);
      }
      e.preventDefault();
      e.stopPropagation();
    }
     on_mouseup(e, x, y, button) {
      this._mode = undefined;
      e.preventDefault();
      e.stopPropagation();
      console.log(x, y);
    }
     updateCanvas(force_update=false, _in_update=false) {
      let canvas=this.canvas;
      let update=force_update;
      if (update) {
          let size=this.getDefault("fieldsize");
          let dpi=this.getDPI();
          canvas.style["width"] = size+"px";
          canvas.style["height"] = size+"px";
          canvas.width = canvas.height = Math.ceil(size*dpi);
          if (!_in_update)
            this._redraw();
          return true;
      }
    }
     _redraw() {
      let canvas=this.canvas, g=this.g;
      let dpi=this.getDPI();
      let size=canvas.width;
      let field=this._field = getFieldImage(size, this.hsva);
      let w=size, h=size*field.height/field.width;
      g.clearRect(0, 0, w, h);
      g.drawImage(field.canvas, 0, 0, field.width, field.height);
      g.lineWidth = 2.0;
      function circle(x, y, r) {
        g.strokeStyle = "white";
        g.beginPath();
        g.arc(x, y, r, -Math.PI, Math.PI);
        g.stroke();
        g.strokeStyle = "grey";
        g.beginPath();
        g.arc(x, y, r-1, -Math.PI, Math.PI);
        g.stroke();
        g.fillStyle = "black";
        g.beginPath();
        g.arc(x, y, 2*dpi, -Math.PI, Math.PI);
        g.fill();
      }
      let hsva=this.hsva;
      let r=(field.params.r2-field.params.r1)*0.7;
      let bandr=(field.params.r2+field.params.r1)*0.5;
      let th=Math.fract(1.0-hsva[0]-0.25);
      let x=Math.sin(th*Math.PI*2)*bandr+size/2;
      let y=Math.cos(th*Math.PI*2)*bandr+size/2;
      circle(x, y, r);
      let u=this.hsva[1], v=1.0-this.hsva[2];
      let ret=inv_sample(u, v);
      u = ret[0], v = ret[1];
      x = field.params.box.x+u*field.params.box.width;
      y = field.params.box.y+v*field.params.box.height;
      circle(x, y, r);
    }
     updateDPI(force_update=false, _in_update=false) {
      let dpi=this.getDPI();
      let update=force_update;
      update = update||dpi!=this._last_dpi;
      if (update) {
          this._last_dpi = dpi;
          this.updateCanvas(true);
          if (!_in_update)
            this._redraw();
          return true;
      }
    }
     update(force_update=false) {
      super.update();
      let redraw=false;
      redraw = redraw||this.updateCanvas(force_update, true);
      redraw = redraw||this.updateDPI(force_update, true);
      if (redraw) {
          this._redraw();
      }
    }
    static  define() {
      return {tagname: "colorfield0-x", 
     style: "colorfield"}
    }
  }
  _ESClass.register(ColorField);
  _es6_module.add_class(ColorField);
  ColorField = _es6_module.add_export('ColorField', ColorField);
  UIBase.register(ColorField);
  class ColorPicker extends ui.ColumnFrame {
     constructor() {
      super();
      this.field = document.createElement("colorfield-x");
      this.field.setAttribute("class", "colorpicker");
      this.field.onchange = (hsva, rgba) =>        {
        if (this.onchange) {
            this.onchange(hsva, rgba);
        }
        this._setDataPath();
        this._setSliders();
      };
      let style=document.createElement("style");
      style.textContent = `
      .colorpicker {
        background-color : ${ui_base.getDefault("InnerPanelBG")};
      }
    `;
      this._style = style;
      this.shadow.appendChild(style);
      this.field.ctx = this.ctx;
      this.shadow.appendChild(this.field);
    }
    static  setDefault(node) {
      let tabs=node.tabs();
      let tab=tabs.tab("HSV");
      node.h = tab.slider(undefined, "Hue", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let hsva=node.hsva;
        node.setHSVA(e.value, hsva[1], hsva[2], hsva[3]);
      });
      node.s = tab.slider(undefined, "Saturation", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let hsva=node.hsva;
        node.setHSVA(hsva[0], e.value, hsva[2], hsva[3]);
      });
      node.v = tab.slider(undefined, "Value", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let hsva=node.hsva;
        node.setHSVA(hsva[0], hsva[1], e.value, hsva[3]);
      });
      node.a = tab.slider(undefined, "Alpha", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let hsva=node.hsva;
        node.setHSVA(hsva[0], hsva[1], hsva[2], e.value);
      });
      tab = tabs.tab("RGB");
      node.r = tab.slider(undefined, "R", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let rgba=node.rgba;
        node.setRGBA(e.value, rgba[1], rgba[2], rgba[3]);
      });
      node.g = tab.slider(undefined, "G", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let rgba=node.rgba;
        node.setRGBA(rgba[0], e.value, rgba[2], rgba[3]);
      });
      node.b = tab.slider(undefined, "B", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let rgba=node.rgba;
        node.setRGBA(rgba[0], rgba[1], e.value, rgba[3]);
      });
      node.a2 = tab.slider(undefined, "Alpha", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let rgba=node.rgba;
        node.setRGBA(rgba[0], rgba[1], rgba[2], e.value);
      });
      node._setSliders();
    }
     _setSliders() {
      if (this.h===undefined) {
          console.warn("colorpicker ERROR");
          return ;
      }
      let hsva=this.hsva;
      this.h.setValue(hsva[0], false);
      this.s.setValue(hsva[1], false);
      this.v.setValue(hsva[2], false);
      this.a.setValue(hsva[3], false);
      let rgba=this.rgba;
      this.r.setValue(rgba[0], false);
      this.g.setValue(rgba[1], false);
      this.b.setValue(rgba[2], false);
      this.a2.setValue(rgba[3], false);
    }
    get  hsva() {
      return this.field.hsva;
    }
    get  rgba() {
      return this.field.rgba;
    }
     updateDataPath() {
      if (!this.hasAttribute("datapath")) {
          return ;
      }
      let prop=this.getPathMeta(this.ctx, this.getAttribute("datapath"));
      let val=this.getPathValue(this.ctx, this.getAttribute("datapath"));
      if (val===undefined) {
          this.disabled = true;
          return ;
      }
      this.disabled = false;
      _update_temp.load(val);
      if (prop.type==PropTypes.VEC3) {
          _update_temp[3] = 1.0;
      }
      if (_update_temp.vectorDistance(this.field.rgba)>0.01) {
          console.log("VAL", val);
          console.log("color changed!");
          this.setRGBA(_update_temp[0], _update_temp[1], _update_temp[2], _update_temp[3]);
      }
    }
     update() {
      if (this.hasAttribute("datapath")) {
          this.updateDataPath();
      }
      super.update();
    }
     _setDataPath() {
      if (this.hasAttribute("datapath")) {
          this.setPathValue(this.ctx, this.getAttribute("datapath"), this.field.rgba);
      }
    }
     setHSVA(h, s, v, a) {
      this.field.setHSVA(h, s, v, a);
      this._setDataPath();
    }
     setRGBA(r, g, b, a) {
      this.field.setRGBA(r, g, b, a);
      this._setDataPath();
    }
    static  define() {
      return {tagname: "colorpicker0-x"}
    }
  }
  _ESClass.register(ColorPicker);
  _es6_module.add_class(ColorPicker);
  ColorPicker = _es6_module.add_export('ColorPicker', ColorPicker);
  UIBase.register(ColorPicker);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_colorpicker.js');
es6_module_define('ui_colorpicker2', ["../util/colorutils.js", "../toolsys/toolprop.js", "../util/vectormath.js", "../util/events.js", "../util/util.js", "../core/ui_base.js", "../config/const.js", "../util/simple_events.js", "../core/ui.js"], function _ui_colorpicker2_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../util/events.js');
  var ui=es6_import(_es6_module, '../core/ui.js');
  var PropTypes=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropTypes');
  var keymap=es6_import_item(_es6_module, '../util/simple_events.js', 'keymap');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var color2web=es6_import_item(_es6_module, '../core/ui_base.js', 'color2web');
  var web2color=es6_import_item(_es6_module, '../core/ui_base.js', 'web2color');
  var validateWebColor=es6_import_item(_es6_module, '../core/ui_base.js', 'validateWebColor');
  let Vector2=vectormath.Vector2, Vector3=vectormath.Vector3, Vector4=vectormath.Vector4, Matrix4=vectormath.Matrix4;
  let _ex_rgb_to_hsv=es6_import_item(_es6_module, '../util/colorutils.js', 'rgb_to_hsv');
  _es6_module.add_export('rgb_to_hsv', _ex_rgb_to_hsv, true);
  let _ex_hsv_to_rgb=es6_import_item(_es6_module, '../util/colorutils.js', 'hsv_to_rgb');
  _es6_module.add_export('hsv_to_rgb', _ex_hsv_to_rgb, true);
  var rgb_to_hsv=es6_import_item(_es6_module, '../util/colorutils.js', 'rgb_to_hsv');
  var hsv_to_rgb=es6_import_item(_es6_module, '../util/colorutils.js', 'hsv_to_rgb');
  let UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, IconSheets=ui_base.IconSheets;
  let UPW=1.25, VPW=0.75;
  let sample_rets=new util.cachering(() =>    {
    return [0, 0];
  }, 64);
  function inv_sample(u, v) {
    let ret=sample_rets.next();
    ret[0] = Math.pow(u, UPW);
    ret[1] = Math.pow(v, VPW);
    return ret;
  }
  inv_sample = _es6_module.add_export('inv_sample', inv_sample);
  function sample(u, v) {
    let ret=sample_rets.next();
    ret[0] = Math.pow(u, 1.0/UPW);
    ret[1] = Math.pow(v, 1.0/VPW);
    return ret;
  }
  sample = _es6_module.add_export('sample', sample);
  let fieldrand=new util.MersenneRandom(0);
  let huefields={}
  function getHueField(width, height, dpi) {
    let key=width+":"+height+":"+dpi.toFixed(4);
    if (key in huefields) {
        return huefields[key];
    }
    let field=new ImageData(width, height);
    let idata=field.data;
    for (let i=0; i<width*height; i++) {
        let ix=i%width, iy = ~~(i/width);
        let idx=i*4;
        let rgb=hsv_to_rgb(ix/width, 1, 1);
        idata[idx] = rgb[0]*255;
        idata[idx+1] = rgb[1]*255;
        idata[idx+2] = rgb[2]*255;
        idata[idx+3] = 255;
    }
    let canvas=document.createElement("canvas");
    canvas.width = field.width;
    canvas.height = field.height;
    let g=canvas.getContext("2d");
    g.putImageData(field, 0, 0);
    field = canvas;
    huefields[key] = field;
    return field;
  }
  getHueField = _es6_module.add_export('getHueField', getHueField);
  let fields={}
  function getFieldImage(fieldsize, width, height, hsva) {
    fieldrand.seed(0);
    let hue=hsva[0];
    let hue_rgb=hsv_to_rgb(hue, 1.0, 1.0);
    let key=fieldsize+":"+width+":"+height+":"+hue.toFixed(5);
    if (key in fields)
      return fields[key];
    let size2=fieldsize;
    let valpow=0.75;
    let image={width: width, 
    height: height, 
    image: new ImageData(fieldsize, fieldsize), 
    x2sat: (x) =>        {
        return Math.min(Math.max(x/width, 0), 1);
      }, 
    y2val: (y) =>        {
        y = 1.0-Math.min(Math.max(y/height, 0), 1);
        return y===0.0 ? 0.0 : y**valpow;
      }, 
    sat2x: (s) =>        {
        return s*width;
      }, 
    val2y: (v) =>        {
        if (v==0)
          return height;
        v = v**(1.0/valpow);
        return (1.0-v)*height;
      }}
    image.params = {box: {x: 0, 
     y: 0, 
     width: width, 
     height: height}}
    let idata=image.image.data;
    for (let i=0; i<idata.length; i+=4) {
        let i2=i/4;
        let x=i2%size2, y = ~~(i2/size2);
        let v=1.0-(y/size2);
        let s=(x/size2);
        let rgb=hsv_to_rgb(hsva[0], s, v**valpow);
        idata[i] = rgb[0]*255;
        idata[i+1] = rgb[1]*255;
        idata[i+2] = rgb[2]*255;
        idata[i+3] = 255;
    }
    let image2=document.createElement("canvas");
    image2.width = size2;
    image2.height = size2;
    let g=image2.getContext("2d");
    g.putImageData(image.image, 0, 0);
    image.canvas = image2;
    image.scale = width/size2;
    fields[key] = image;
    return image;
  }
  getFieldImage = _es6_module.add_export('getFieldImage', getFieldImage);
  let _update_temp=new Vector4();
  class SimpleBox  {
     constructor(pos=[0, 0], size=[1, 1]) {
      this.pos = new Vector2(pos);
      this.size = new Vector2(size);
      this.r = 0;
    }
  }
  _ESClass.register(SimpleBox);
  _es6_module.add_class(SimpleBox);
  SimpleBox = _es6_module.add_export('SimpleBox', SimpleBox);
  class HueField extends UIBase {
     constructor() {
      super();
      this.canvas = document.createElement("canvas");
      this.g = this.canvas.getContext("2d");
      this.shadow.appendChild(this.canvas);
      let setFromXY=(x, y) =>        {
        let dpi=this.getDPI();
        let r=this.getDefault("circleSize");
        let h=x/((this.canvas.width-r*4)/dpi);
        h = Math.min(Math.max(h, 0.0), 1.0);
        this.hsva[0] = h;
        if (this.onchange!==undefined) {
            this.onchange(this.hsva);
        }
        this._redraw();
      };
      this.addEventListener("mousedown", (e) =>        {
        let rect=this.canvas.getClientRects()[0];
        let x=e.clientX-rect.x, y=e.clientY-rect.y;
        setFromXY(x, y);
        setTimeout(() =>          {
          this.pushModal({on_mousemove: (e) =>              {
              let rect=this.canvas.getClientRects()[0];
              let x=e.clientX-rect.x, y=e.clientY-rect.y;
              setFromXY(x, y);
            }, 
       on_mousedown: (e) =>              {
              this.popModal();
            }, 
       on_mouseup: (e) =>              {
              this.popModal();
            }, 
       on_keydown: (e) =>              {
              if (e.keyCode==keymap["Enter"]||e.keyCode==keymap["Escape"]||e.keyCode==keymap["Space"]) {
                  this.popModal();
              }
            }});
        }, 1);
      });
    }
     _redraw() {
      let g=this.g, canvas=this.canvas;
      let dpi=this.getDPI();
      let w=this.getDefault("defaultWidth");
      let h=this.getDefault("hueheight");
      canvas.width = ~~(w*dpi);
      canvas.height = ~~(h*dpi);
      canvas.style["width"] = w+"px";
      canvas.style["height"] = h+"px";
      let rselector=~~(this.getDefault("circleSize")*dpi);
      let w2=canvas.width-rselector*4, h2=canvas.height;
      g.drawImage(getHueField(w2, h2, dpi), 0, 0, w2, h2, rselector*2, 0, w2, h2);
      let x=this.hsva[0]*(canvas.width-rselector*4)+rselector*2;
      let y=canvas.height*0.5;
      g.beginPath();
      g.arc(x, y, rselector, -Math.PI, Math.PI);
      g.closePath();
      g.strokeStyle = "white";
      g.lineWidth = 3*dpi;
      g.stroke();
      g.strokeStyle = "grey";
      g.lineWidth = 1*dpi;
      g.stroke();
      if (this.disabled) {
          g.beginPath();
          g.fillStyle = "rgba(25,25,25,0.75)";
          g.rect(0, 0, this.canvas.width, this.canvas.height);
          g.fill();
      }
    }
     on_disabled() {
      this._redraw();
    }
     on_enabled() {
      this._redraw();
    }
    static  define() {
      return {tagname: "huefield-x", 
     style: "colorfield"}
    }
  }
  _ESClass.register(HueField);
  _es6_module.add_class(HueField);
  HueField = _es6_module.add_export('HueField', HueField);
  UIBase.register(HueField);
  class SatValField extends UIBase {
     constructor() {
      super();
      this.hsva = [0, 0, 0, 1];
      this.canvas = document.createElement("canvas");
      this.g = this.canvas.getContext("2d");
      this.shadow.appendChild(this.canvas);
      this.onchange = undefined;
      let setFromXY=(x, y) =>        {
        let field=this._getField();
        let r=~~(this.getDefault("circleSize")*this.getDPI());
        let sat=field.x2sat(x-r);
        let val=field.y2val(y-r);
        this.hsva[1] = sat;
        this.hsva[2] = val;
        if (this.onchange) {
            this.onchange(this.hsva);
        }
        this._redraw();
      };
      this.canvas.addEventListener("mousedown", (e) =>        {
        let rect=this.canvas.getClientRects()[0];
        let x=e.clientX-rect.x, y=e.clientY-rect.y;
        setFromXY(x, y);
        setTimeout(() =>          {
          this.pushModal({on_mousemove: (e) =>              {
              let rect=this.canvas.getClientRects()[0];
              if (rect===undefined) {
                  return ;
              }
              let x=e.clientX-rect.x, y=e.clientY-rect.y;
              setFromXY(x, y);
            }, 
       on_mousedown: (e) =>              {
              this.popModal();
            }, 
       on_mouseup: (e) =>              {
              this.popModal();
            }, 
       on_keydown: (e) =>              {
              if (e.keyCode==keymap["Enter"]||e.keyCode==keymap["Escape"]||e.keyCode==keymap["Space"]) {
                  this.popModal();
              }
            }});
        }, 1);
      });
      this.canvas.addEventListener("touchstart", (e) =>        {
        console.log("touch start");
        let rect=this.canvas.getClientRects()[0];
        let x=e.touches[0].clientX-rect.x, y=e.touches[0].clientY-rect.y;
        setFromXY(x, y);
        setTimeout(() =>          {
          this.pushModal({on_mousemove: (e) =>              {
              let rect=this.canvas.getClientRects()[0];
              let x, y;
              if (e.touches&&e.touches.length) {
                  x = e.touches[0].clientX-rect.x;
                  y = e.touches[0].clientY-rect.y;
              }
              else {
                x = e.x;
                y = e.y;
              }
              setFromXY(x, y);
            }, 
       on_touchmove: (e) =>              {
              let rect=this.canvas.getClientRects()[0];
              let x=e.touches[0].clientX-rect.x, y=e.touches[0].clientY-rect.y;
              setFromXY(x, y);
            }, 
       on_mousedown: (e) =>              {
              this.popModal();
            }, 
       on_touchcancel: (e) =>              {
              this.popModal();
            }, 
       on_touchend: (e) =>              {
              this.popModal();
            }, 
       on_mouseup: (e) =>              {
              this.popModal();
            }, 
       on_keydown: (e) =>              {
              if (e.keyCode==keymap["Enter"]||e.keyCode==keymap["Escape"]||e.keyCode==keymap["Space"]) {
                  this.popModal();
              }
            }});
        }, 1);
      });
    }
     _getField() {
      let dpi=this.getDPI();
      let canvas=this.canvas;
      let r=this.getDefault("circleSize");
      let w=this.getDefault("defaultWidth");
      let h=this.getDefault("defaultHeight");
      return getFieldImage(this.getDefault("fieldsize"), w-r*2, h-r*2, this.hsva);
    }
     update(force_update=false) {
      super.update();
      if (force_update) {
          this._redraw();
      }
    }
     _redraw() {
      let g=this.g, canvas=this.canvas;
      let dpi=this.getDPI();
      let w=this.getDefault("defaultWidth");
      let h=this.getDefault("defaultHeight");
      canvas.width = ~~(w*dpi);
      canvas.height = ~~(h*dpi);
      canvas.style["width"] = w+"px";
      canvas.style["height"] = h+"px";
      let rselector=~~(this.getDefault("circleSize")*dpi);
      let field=this._getField();
      let image=field.canvas;
      g.globalAlpha = 1.0;
      g.beginPath();
      g.rect(0, 0, canvas.width, canvas.height);
      g.fillStyle = "rgb(200, 200, 200)";
      g.fill();
      g.beginPath();
      let steps=17;
      let dx=canvas.width/steps;
      let dy=canvas.height/steps;
      for (let i=0; i<steps*steps; i++) {
          let x=(i%steps)*dx, y=(~~(i/steps))*dy;
          if (i%2==0) {
              continue;
          }
          g.rect(x, y, dx, dy);
      }
      g.fillStyle = "rgb(110, 110, 110)";
      g.fill();
      g.globalAlpha = this.hsva[3];
      g.drawImage(image, 0, 0, image.width, image.height, rselector, rselector, canvas.width-rselector*2, canvas.height-rselector*2);
      let hsva=this.hsva;
      let x=field.sat2x(hsva[1])*dpi+rselector;
      let y=field.val2y(hsva[2])*dpi+rselector;
      let r=rselector;
      g.beginPath();
      g.arc(x, y, r, -Math.PI, Math.PI);
      g.closePath();
      g.strokeStyle = "white";
      g.lineWidth = 3*dpi;
      g.stroke();
      g.strokeStyle = "grey";
      g.lineWidth = 1*dpi;
      g.stroke();
      if (this.disabled) {
          g.beginPath();
          g.fillStyle = "rgba(25,25,25,0.75)";
          g.rect(0, 0, this.canvas.width, this.canvas.height);
          g.fill();
      }
    }
     on_disabled() {
      this._redraw();
    }
     on_enabled() {
      this._redraw();
    }
    static  define() {
      return {tagname: "satvalfield-x", 
     style: "colorfield"}
    }
  }
  _ESClass.register(SatValField);
  _es6_module.add_class(SatValField);
  SatValField = _es6_module.add_export('SatValField', SatValField);
  UIBase.register(SatValField);
  class ColorField extends ui.ColumnFrame {
     constructor() {
      super();
      this.hsva = new Vector4([0.05, 0.6, 0.15, 1.0]);
      this.rgba = new Vector4([0, 0, 0, 0]);
      this._recalcRGBA();
      this._last_dpi = undefined;
      let satvalfield=this.satvalfield = document.createElement("satvalfield-x");
      satvalfield.hsva = this.hsva;
      let huefield=this.huefield = document.createElement("huefield-x");
      huefield.hsva = this.hsva;
      huefield.onchange = (e) =>        {
        this.satvalfield._redraw();
        this._recalcRGBA();
        if (this.onchange) {
            this.onchange(this.rgba);
        }
      };
      satvalfield.onchange = (e) =>        {
        this._recalcRGBA();
        if (this.onchange) {
            this.onchange(this.rgba);
        }
      };
      this._add(satvalfield);
      this._add(huefield);
    }
     setHSVA(h, s, v, a=1.0, fire_onchange=true) {
      this.hsva[0] = h;
      this.hsva[1] = s;
      this.hsva[2] = v;
      this.hsva[3] = a;
      this._recalcRGBA();
      this.update(true);
      if (this.onchange&&fire_onchange) {
          this.onchange(this.hsva, this.rgba);
      }
    }
     setRGBA(r, g, b, a=1.0, fire_onchange=true) {
      let hsv=rgb_to_hsv(r, g, b);
      this.hsva[0] = hsv[0];
      this.hsva[1] = hsv[1];
      this.hsva[2] = hsv[2];
      this.hsva[3] = a;
      this._recalcRGBA();
      this.update(true);
      if (this.onchange&&fire_onchange) {
          this.onchange(this.hsva, this.rgba);
      }
    }
     _recalcRGBA() {
      let ret=hsv_to_rgb(this.hsva[0], this.hsva[1], this.hsva[2]);
      this.rgba[0] = ret[0];
      this.rgba[1] = ret[1];
      this.rgba[2] = ret[2];
      this.rgba[3] = this.hsva[3];
      return this;
    }
     updateDPI(force_update=false, _in_update=false) {
      let dpi=this.getDPI();
      let update=force_update;
      update = update||dpi!=this._last_dpi;
      if (update) {
          this._last_dpi = dpi;
          if (!_in_update)
            this._redraw();
          return true;
      }
    }
     setRGBA(r, g, b, a=1.0, fire_onchange=true) {
      if (bad(r)||bad(g)||bad(b)||bad(a)) {
          console.warn("Invalid value!");
          return ;
      }
      let ret=rgb_to_hsv(r, g, b);
      function bad(f) {
        return typeof f!=="number"||isNaN(f);
      }
      this.hsva[0] = ret[0];
      this.hsva[1] = ret[1];
      this.hsva[2] = ret[2];
      this.hsva[3] = a;
      this._recalcRGBA();
      this.update(true);
      if (this.onchange&&fire_onchange) {
          this.onchange(this.hsva, this.rgba);
      }
    }
     update(force_update=false) {
      super.update();
      let redraw=false;
      redraw = redraw||this.updateDPI(force_update, true);
      if (redraw) {
          this.satvalfield.update(true);
          this._redraw();
      }
    }
    static  define() {
      return {tagname: "colorfield-x", 
     style: "colorfield"}
    }
     _redraw() {
      this.satvalfield._redraw();
      this.huefield._redraw();
    }
  }
  _ESClass.register(ColorField);
  _es6_module.add_class(ColorField);
  ColorField = _es6_module.add_export('ColorField', ColorField);
  UIBase.register(ColorField);
  class ColorPicker extends ui.ColumnFrame {
     constructor() {
      super();
    }
     init() {
      super.init();
      this.field = document.createElement("colorfield-x");
      this.field.setAttribute("class", "colorpicker");
      this.field.packflag|=this.inherit_packflag;
      this.field.packflag|=this.packflag;
      this.field.onchange = () =>        {
        this._setDataPath();
        this._setSliders();
        if (this.onchange) {
            this.onchange(this.field.rgba);
        }
      };
      let style=document.createElement("style");
      style.textContent = `
      .colorpicker {
        background-color : ${this.getDefault("BoxBG")};
      }
    `;
      this._style = style;
      let cb=this.colorbox = document.createElement("div");
      cb.style["width"] = "100%";
      cb.style["height"] = this.getDefault("colorBoxHeight")+"px";
      cb.style["background-color"] = "black";
      this.shadow.appendChild(style);
      this.field.ctx = this.ctx;
      this.add(this.colorbox);
      this.add(this.field);
      this.style["width"] = this.getDefault("defaultWidth")+"px";
    }
     updateColorBox() {
      let r=this.field.rgba[0], g=this.field.rgba[1], b=this.field.rgba[2];
      r = ~~(r*255);
      g = ~~(g*255);
      b = ~~(b*255);
      let css=`rgb(${r},${g},${b})`;
      this.colorbox.style["background-color"] = css;
    }
    static  setDefault(node) {
      let tabs=node.tabs();
      node.cssText = node.textbox();
      node.cssText.onchange = (val) =>        {
        let ok=validateWebColor(val);
        if (!ok) {
            node.cssText.flash("red");
            return ;
        }
        else {
          node.cssText.flash("green");
        }
        val = val.trim();
        let color=web2color(val);
        console.log(color);
        node._no_update_textbox = true;
        console.log(color);
        node.field.setRGBA(color[0], color[1], color[2], color[3]);
        node._setSliders();
        node._no_update_textbox = false;
      };
      let tab=tabs.tab("HSV");
      node.h = tab.slider(undefined, "Hue", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let hsva=node.hsva;
        node.setHSVA(e.value, hsva[1], hsva[2], hsva[3]);
      });
      node.s = tab.slider(undefined, "Saturation", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let hsva=node.hsva;
        node.setHSVA(hsva[0], e.value, hsva[2], hsva[3]);
      });
      node.v = tab.slider(undefined, "Value", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let hsva=node.hsva;
        node.setHSVA(hsva[0], hsva[1], e.value, hsva[3]);
      });
      node.a = tab.slider(undefined, "Alpha", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let hsva=node.hsva;
        node.setHSVA(hsva[0], hsva[1], hsva[2], e.value);
      });
      tab = tabs.tab("RGB");
      node.r = tab.slider(undefined, "R", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let rgba=node.rgba;
        node.setRGBA(e.value, rgba[1], rgba[2], rgba[3]);
      });
      node.g = tab.slider(undefined, "G", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let rgba=node.rgba;
        node.setRGBA(rgba[0], e.value, rgba[2], rgba[3]);
      });
      node.b = tab.slider(undefined, "B", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let rgba=node.rgba;
        node.setRGBA(rgba[0], rgba[1], e.value, rgba[3]);
      });
      node.a2 = tab.slider(undefined, "Alpha", 0.0, 0.0, 1.0, 0.001, false, true, (e) =>        {
        let rgba=node.rgba;
        node.setRGBA(rgba[0], rgba[1], rgba[2], e.value);
      });
      node._setSliders();
    }
     _setSliders() {
      if (this.h===undefined) {
          console.warn("colorpicker ERROR");
          return ;
      }
      let hsva=this.field.hsva;
      this.h.setValue(hsva[0], false);
      this.s.setValue(hsva[1], false);
      this.v.setValue(hsva[2], false);
      this.a.setValue(hsva[3], false);
      let rgba=this.field.rgba;
      this.r.setValue(rgba[0], false);
      this.g.setValue(rgba[1], false);
      this.b.setValue(rgba[2], false);
      this.a2.setValue(rgba[3], false);
      this.updateColorBox();
      if (!this._no_update_textbox) {
          this.cssText.text = color2web(this.field.rgba);
      }
    }
    get  hsva() {
      return this.field.hsva;
    }
    get  rgba() {
      return this.field.rgba;
    }
     updateDataPath() {
      if (!this.hasAttribute("datapath")) {
          return ;
      }
      let prop=this.getPathMeta(this.ctx, this.getAttribute("datapath"));
      let val=this.getPathValue(this.ctx, this.getAttribute("datapath"));
      if (val===undefined) {
          this.disabled = true;
          return ;
      }
      this.disabled = false;
      _update_temp.load(val);
      if (prop.type==PropTypes.VEC3) {
          _update_temp[3] = 1.0;
      }
      if (_update_temp.vectorDistance(this.field.rgba)>0.01) {
          this.field.setRGBA(_update_temp[0], _update_temp[1], _update_temp[2], _update_temp[3], false);
          this._setSliders();
          this.field.update(true);
      }
    }
     update() {
      if (this.hasAttribute("datapath")) {
          this.updateDataPath();
      }
      super.update();
    }
     _setDataPath() {
      if (this.hasAttribute("datapath")) {
          let prop=this.getPathMeta(this.ctx, this.getAttribute("datapath"));
          if (prop===undefined) {
              console.warn("Bad data path for color field:", this.getAttribute("datapath"));
          }
          let val=this.field.rgba;
          if (prop!==undefined&&prop.type==PropTypes.VEC3) {
              val = new Vector3();
              val.load(this.field.rgba);
          }
          this.setPathValue(this.ctx, this.getAttribute("datapath"), val);
      }
    }
     setHSVA(h, s, v, a) {
      this.field.setHSVA(h, s, v, a);
      this._setSliders();
      this._setDataPath();
    }
     setRGBA(r, g, b, a) {
      this.field.setRGBA(r, g, b, a);
      this._setSliders();
      this._setDataPath();
    }
    static  define() {
      return {tagname: "colorpicker-x", 
     style: "colorfield"}
    }
  }
  _ESClass.register(ColorPicker);
  _es6_module.add_class(ColorPicker);
  ColorPicker = _es6_module.add_export('ColorPicker', ColorPicker);
  UIBase.register(ColorPicker);
  class ColorPickerButton extends UIBase {
     constructor() {
      super();
      this._highlight = false;
      this._depress = false;
      this._label = "";
      this.rgba = new Vector4([1, 1, 1, 1]);
      this.labelDom = document.createElement("span");
      this.labelDom.textContent = "error";
      this.dom = document.createElement("canvas");
      this.g = this.dom.getContext("2d");
      this.shadow.appendChild(this.labelDom);
      this.shadow.appendChild(this.dom);
    }
    set  label(val) {
      this._label = val;
      this.labelDom.textContent = val;
    }
    get  label() {
      return this._label;
    }
     init() {
      super.init();
      this._font = "DefaultText";
      let enter=(e) =>        {
        console.log(e.type);
        this._highlight = true;
        this._redraw();
      };
      let leave=(e) =>        {
        console.log(e.type);
        this._highlight = false;
        this._redraw();
      };
      this.addEventListener("mousedown", (e) =>        {
        this.click(e);
      });
      this.addEventListener("mouseover", enter);
      this.addEventListener("mouseleave", leave);
      this.addEventListener("mousein", enter);
      this.addEventListener("mouseout", leave);
      this.addEventListener("focus", enter);
      this.addEventListener("blur", leave);
      this.setCSS();
    }
     click(e) {
      if (this.onclick) {
          this.onclick(e);
      }
      let colorpicker=this.ctx.screen.popup(this, this);
      colorpicker.useDataPathUndo = this.useDataPathUndo;
      let path=this.hasAttribute("datapath") ? this.getAttribute("datapath") : undefined;
      let widget=colorpicker.colorPicker(path, undefined, this.getAttribute("mass_set_path"));
      widget._init();
      widget.setRGBA(this.rgba[0], this.rgba[1], this.rgba[2], this.rgba[3]);
      widget.style["padding"] = "20px";
      let onchange=() =>        {
        this.rgba.load(widget.rgba);
        this.redraw();
        if (this.onchange) {
            this.onchange(this);
        }
      };
      widget.onchange = onchange;
      colorpicker.style["background-color"] = widget.getDefault("DefaultPanelBG");
      colorpicker.style["border-radius"] = "25px";
      colorpicker.style["border"] = widget.getDefault("border");
    }
     setRGBA(val) {
      let a=this.rgba[3];
      this.rgba.load(val);
      if (val.length<4) {
          this.rgba[3] = a;
      }
      return this;
    }
    get  font() {
      return this._font;
    }
    set  font(val) {
      this._font = val;
      this.setCSS();
    }
     on_disabled() {
      this.setCSS();
      this._redraw();
    }
     _redraw() {
      let canvas=this.dom, g=this.g;
      g.clearRect(0, 0, canvas.width, canvas.height);
      if (this.disabled) {
          let color="rgb(55, 55, 55)";
          g.save();
          ui_base.drawRoundBox(this, canvas, g, canvas.width, canvas.height, undefined, "fill", color);
          ui_base.drawRoundBox(this, canvas, g, canvas.width, canvas.height, undefined, "clip");
          let steps=5;
          let dt=canvas.width/steps, t=0;
          g.beginPath();
          g.lineWidth = 2;
          g.strokeStyle = "black";
          for (let i=0; i<steps; i++, t+=dt) {
              g.moveTo(t, 0);
              g.lineTo(t+dt, canvas.height);
              g.moveTo(t+dt, 0);
              g.lineTo(t, canvas.height);
          }
          g.stroke();
          g.restore();
          return ;
      }
      g.save();
      let grid1="rgb(100, 100, 100)";
      let grid2="rgb(175, 175, 175)";
      ui_base.drawRoundBox(this, canvas, g, canvas.width, canvas.height, undefined, "clip");
      ui_base.drawRoundBox(this, canvas, g, canvas.width, canvas.height, undefined, "fill", grid1);
      let cellsize=10;
      let totx=Math.ceil(canvas.width/cellsize), toty=Math.ceil(canvas.height/cellsize);
      ui_base.drawRoundBox(this, canvas, g, canvas.width, canvas.height, undefined, "clip", undefined, undefined, true);
      g.clip();
      g.beginPath();
      for (let x=0; x<totx; x++) {
          for (let y=0; y<toty; y++) {
              if ((x+y)&1) {
                  continue;
              }
              g.rect(x*cellsize, y*cellsize, cellsize, cellsize);
          }
      }
      g.fillStyle = grid2;
      g.fill();
      let color=color2css(this.rgba);
      ui_base.drawRoundBox(this, canvas, g, canvas.width, canvas.height, undefined, "fill", color, undefined, true);
      if (this._highlight) {
          let color=this.getDefault("BoxHighlight");
          ui_base.drawRoundBox(this, canvas, g, canvas.width, canvas.height, undefined, "fill", color);
      }
      g.restore();
    }
     setCSS() {
      super.setCSS();
      let w=this.getDefault("defaultWidth");
      let h=this.getDefault("defaultHeight");
      let dpi=this.getDPI();
      this.style["width"] = "min-contents"+"px";
      this.style["height"] = h+"px";
      this.style["flex-direction"] = "row";
      this.style["display"] = "flex";
      this.labelDom.style["color"] = this.getDefault(this._font).color;
      this.labelDom.style["font"] = ui_base.getFont(this, undefined, this._font, false);
      let canvas=this.dom;
      canvas.style["width"] = w+"px";
      canvas.style["height"] = h+"px";
      canvas.width = ~~(w*dpi);
      canvas.height = ~~(h*dpi);
      this.style["background-color"] = "rgba(0,0,0,0)";
      this._redraw();
    }
    static  define() {
      return {tagname: "color-picker-button-x", 
     style: "colorpickerbutton"}
    }
     updateDataPath() {
      if (!(this.hasAttribute("datapath"))) {
          return ;
      }
      let path=this.getAttribute("datapath");
      let prop=this.getPathMeta(this.ctx, path);
      if ((prop===undefined||prop.data===undefined)&&cconst.DEBUG.verboseDataPath) {
          console.log("bad path", path);
          return ;
      }
      else 
        if (prop===undefined) {
          this.disabled = true;
          return ;
      }
      this.disabled = false;
      prop = prop;
      if (prop.uiname!==this._label) {
          this.label = prop.uiname;
      }
      let val=this.getPathValue(this.ctx, path);
      if (val===undefined) {
          let redraw=this.disabled!==true;
          this.disabled = true;
          if (redraw) {
              this._redraw();
          }
          return ;
      }
      else {
        let redraw=this.disabled;
        this.disabled = false;
        if (redraw) {
            this._redraw();
        }
      }
      if (this.rgba.vectorDistance(val)>0.0001) {
          if (prop.type==PropTypes.VEC3) {
              this.rgba.load(val);
              this.rgba[3] = 1.0;
          }
          else {
            this.rgba.load(val);
          }
          this._redraw();
      }
    }
     update() {
      super.update();
      let key=""+this.rgba[0].toFixed(4)+" "+this.rgba[1].toFixed(4)+" "+this.rgba[2].toFixed(4)+" "+this.rgba[3].toFixed(4);
      if (key!==this._last_key) {
          this._last_key = key;
          this.redraw();
      }
      if (this.hasAttribute("datapath")) {
          this.updateDataPath();
      }
    }
     redraw() {
      this._redraw();
    }
  }
  _ESClass.register(ColorPickerButton);
  _es6_module.add_class(ColorPickerButton);
  ColorPickerButton = _es6_module.add_export('ColorPickerButton', ColorPickerButton);
  
  UIBase.register(ColorPickerButton);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_colorpicker2.js');
es6_module_define('ui_container', ["../core/ui.js", "../controller/simple_controller.js", "../core/ui_base.js"], function _ui_container_module(_es6_module) {
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var DataAPI=es6_import_item(_es6_module, '../controller/simple_controller.js', 'DataAPI');
  let api=new DataAPI();
  api = _es6_module.add_export('api', api);
  function setRootStruct(val) {
    return api.setRoot(val);
  }
  setRootStruct = _es6_module.add_export('setRootStruct', setRootStruct);
  class ContainerIF  {
     beginPath(path, cls) {

    }
     endPath() {

    }
     prop(path, args) {

    }
     tool(path, args) {

    }
     menu(title, definition, args) {

    }
     slider(path, args) {

    }
     simpleslider(path, args) {

    }
     textbox(path, args) {

    }
     vector(path, args) {

    }
     colorpicker(path, args) {

    }
     colorbutton(path, args) {

    }
     iconenum(path, args) {

    }
     iconcheck(path, args) {

    }
     button(name, tooltip, args) {

    }
     iconbutton(icon, tooltip, args) {

    }
     listenum(path, args) {

    }
     table() {

    }
     row() {

    }
     col() {

    }
     strip() {

    }
     useIcons() {

    }
     useSimpleSliders() {

    }
  }
  _ESClass.register(ContainerIF);
  _es6_module.add_class(ContainerIF);
  ContainerIF = _es6_module.add_export('ContainerIF', ContainerIF);
  class BuilderContainer extends Container {
     constructor() {
      super();
      this.pathPrefix = "";
      this.pathstack = [];
      this._class = undefined;
      this._struct = undefined;
    }
     init() {
      super.init();
    }
     _buildPath() {
      let path="";
      for (let p of this.pathstack) {
          if (p[0].trim()==="") {
              continue;
          }
          if (path.length>0)
            path+=".";
          path+=p[0];
      }
      if (this.pathstack.length>0) {
          this._class = this.pathstack[this.pathstack.length-1][1];
          this._struct = this.pathstack[this.pathstack.length-1][2];
      }
      else {
        this._class = undefined;
        this._struct = undefined;
      }
      this.pathPrefix = path;
      return path;
    }
     beginPath(path, cls) {
      this.pathstack.push([path, cls, api.mapStruct(cls, true)]);
      this._buildPath();
    }
     popPath(path, cls) {
      this.pathstack.pop();
      this._buildPath();
    }
     joinPath(path) {
      if (this.pathPrefix.trim().length>0) {
          return this.pathPrefix+"."+path;
      }
      else {
        return path.trim();
      }
    }
     _makeAPI(path) {
      if (!path) {
          return false;
      }
      if (!this._struct) {
          console.warn("No struct");
          return false;
      }
      return !(path in this._struct.pathmap);
    }
    static  define() {
      return {tagname: "container-builder-x"}
    }
     _args(args={}) {
      if (args.packflag===undefined)
        args.packflag = 0;
      args.packflag|=this.inherit_packflag;
      return args;
    }
     prop(path, args) {
      args = this._args(args);
      return super.prop(path, args.packflag, args.mass_set_path);
    }
     tool(path, args) {
      args = this._args(args);
      return super.tool(path, args.packflag, args.create_cb);
    }
     menu(title, definition, args) {
      args = this._args(args);
      return super.menu(title, definition, args.packflag);
    }
     _wrapElem(e, dpath) {
      return {widget: e, 
     range: (min, max) =>          {
          return dpath.range(min, max);
        }, 
     description: (d) =>          {
          return dpath.description(d);
        }, 
     on: () =>          {
          return dpath.on(...arguments);
        }, 
     off: () =>          {
          return dpath.off(...arguments);
        }, 
     simpleSlider: () =>          {
          return dpath.simpleSlider();
        }, 
     rollerSlider: () =>          {
          return dpath.rollerSlider();
        }, 
     uiRange: (min, max) =>          {
          return dpath.uiRange();
        }, 
     decimalPlaces: (p) =>          {
          return dpath.decimalPlaces();
        }, 
     expRate: (p) =>          {
          return dpath.expRate(p);
        }, 
     radix: (p) =>          {
          return dpath.radix(p);
        }, 
     step: (p) =>          {
          return dpath.step(p);
        }, 
     icon: (icon) =>          {
          return dpath.icon(icon);
        }, 
     icons: (iconmap) =>          {
          return dpath.icons(iconmap);
        }, 
     descriptions: (ds) =>          {
          return dpath.descriptions(ds);
        }, 
     customGetSet: () =>          {
          return dpath.customGetSet.apply(...arguments);
        }}
    }
     slider(path, args) {
      args = this._args(args);
      let dopatch=false, dpath;
      if (this._makeAPI(path)) {
          let path2=args.apiname ? args.apiname : path;
          let uiname=args.uiName ? args.uiName : path2;
          if (args.is_int||args.isInt) {
              dpath = this._struct.int(path, path2, uiname, args.description);
          }
          else {
            dpath = this._struct.float(path, path2, uiname, args.description);
          }
          if (args.min&&args.max) {
              dpath.range(args.min, args.max);
          }
      }
      let ret=super.slider(this.joinPath(path), args.name, args.defaultval, args.min, args.max, args.step, args.is_int, args.do_redraw, args.callback, args.packflag);
      if (dopatch) {
          this._wrapElem(ret, dpath);
      }
      return ret;
    }
     simpleslider(path, args) {
      args = this._args(args);
      args.packflag|=PackFlags.SIMPLE_NUMSLIDERS;
      return this.slider(path, args);
    }
     textbox(path, args) {
      args = this._args(args);
      let dopatch=false, dpath;
      if (this._makeAPI(path)) {
          let path2=args.apiname ? args.apiname : path;
          let uiname=args.uiName ? args.uiName : path2;
          if (args.type==="int") {
              dpath = this._struct.int(path, path2, uiname, args.description);
          }
          else 
            if (args.type==="float") {
              dpath = this._struct.float(path, path2, uiname, args.description);
          }
          else {
            dpath = this._struct.string(path, path2, uiname, args.description);
          }
          if ((args.type==="int"||args.type==="float")&&args.min&&args.max) {
              dpath.range(args.min, args.max);
          }
      }
      let ret=super.textbox(this.joinPath(path), args.text, args.callback, args.packflag);
      if (dopatch) {
          this._wrapElem(ret, dpath);
      }
      return ret;
    }
     vector(path, args) {

    }
     colorpicker(path, args) {

    }
     colorbutton(path, args) {

    }
     iconenum(path, args) {

    }
     iconcheck(path, args) {

    }
     button(name, tooltip, args) {

    }
     iconbutton(icon, tooltip, args) {

    }
     listenum(path, args) {

    }
     table() {

    }
     row() {

    }
     col() {

    }
     strip() {

    }
     useIcons() {

    }
     useSimpleSliderS() {

    }
  }
  _ESClass.register(BuilderContainer);
  _es6_module.add_class(BuilderContainer);
  BuilderContainer = _es6_module.add_export('BuilderContainer', BuilderContainer);
  class BuilderRow extends BuilderContainer {
     init() {
      super.init();
      this.style["flex-direction"] = "row";
    }
    static  define() {
      return {tagname: "row-builder-x"}
    }
  }
  _ESClass.register(BuilderRow);
  _es6_module.add_class(BuilderRow);
  BuilderRow = _es6_module.add_export('BuilderRow', BuilderRow);
  UIBase.register(BuilderRow);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_container.js');
es6_module_define('ui_curvewidget', ["../util/util.js", "../curve/curve1d.js", "../util/vectormath.js", "../toolsys/toolprop.js", "../curve/curve1d_utils.js", "../core/ui_base.js", "../core/ui.js"], function _ui_curvewidget_module(_es6_module) {
  var Curve1DProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'Curve1DProperty');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var Icons=es6_import_item(_es6_module, '../core/ui_base.js', 'Icons');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var RowFrame=es6_import_item(_es6_module, '../core/ui.js', 'RowFrame');
  var util=es6_import(_es6_module, '../util/util.js');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector3');
  var Curve1D=es6_import_item(_es6_module, '../curve/curve1d.js', 'Curve1D');
  var mySafeJSONStringify=es6_import_item(_es6_module, '../curve/curve1d.js', 'mySafeJSONStringify');
  var makeGenEnum=es6_import_item(_es6_module, '../curve/curve1d_utils.js', 'makeGenEnum');
  class Curve1DWidget extends ColumnFrame {
     constructor() {
      super();
      this.useDataPathUndo = false;
      this._on_draw = this._on_draw.bind(this);
      this.drawTransform = [1.0, [0, 0]];
      this._value = new Curve1D();
      this._value.on("draw", this._on_draw);
      this._value._on_change = (msg) =>        {
        console.warn("value on change");
        if (this.onchange) {
            this.onchange(this._value);
        }
        if (this.hasAttribute("datapath")) {
            let path=this.getAttribute("datapath");
            if (this._value!==undefined) {
                let val=this.getPathValue(this.ctx, path);
                if (val) {
                    val.load(this._value);
                    this.setPathValue(this.ctx, path, val);
                }
                else {
                  val = this._value.copy();
                  this.setPathValue(this.ctx, path, val);
                }
            }
        }
      };
      this._gen_type = undefined;
      this._lastGen = undefined;
      this._last_dpi = undefined;
      this.canvas = document.createElement("canvas");
      this.g = this.canvas.getContext("2d");
      this.canvas.g = this.g;
      window.cw = this;
      this.shadow.appendChild(this.canvas);
    }
    get  value() {
      return this._value;
    }
     _on_draw(e) {
      let curve=e.data;
      this._redraw();
    }
    set  value(val) {
      this._value.load(val);
      this.update();
      this._redraw();
    }
     _on_change() {
      if (this.onchange) {
          this.onchange(this);
      }
    }
     init() {
      super.init();
      this.useDataPathUndo = false;
      let row=this.row();
      let prop=makeGenEnum();
      prop.setValue(this.value.generatorType);
      this.dropbox = row.listenum(undefined, "Type", prop, this.value.generatorType, (id) =>        {
        console.warn("SELECT", id, prop.keys[id]);
        this.value.setGenerator(id);
        this.value._on_change("curve type change");
      });
      this.dropbox._init();
      row.iconbutton(Icons.ZOOM_OUT, "Zoom Out", () =>        {
        let curve=this._value;
        if (!curve)
          return ;
        curve.uiZoom*=0.9;
        if (this.getAttribute("datapath")) {
            this.setPathValue(this.ctx, this.getAttribute("datapath"), curve);
        }
        this._redraw();
      }).iconsheet = 0;
      row.iconbutton(Icons.ZOOM_IN, "Zoom In", () =>        {
        let curve=this._value;
        if (!curve)
          return ;
        curve.uiZoom*=1.1;
        if (this.getAttribute("datapath")) {
            this.setPathValue(this.ctx, this.getAttribute("datapath"), curve);
        }
        this._redraw();
      }).iconsheet = 0;
      this.container = this.col();
    }
     setCSS() {
      super.setCSS();
      this.style["width"] = "min-contents";
      this.style["heizght"] = "min-contents";
      this.updateSize();
    }
     updateSize() {
      let dpi=UIBase.getDPI();
      let w=~~(this.getDefault("CanvasWidth")*dpi);
      let h=~~(this.getDefault("CanvasHeight")*dpi);
      let bad=w!==this.canvas.width||h!==this.canvas.height;
      bad = bad||dpi!==this._last_dpi;
      if (!bad) {
          return ;
      }
      this._last_dpi = true;
      this.canvas.width = w;
      this.canvas.height = h;
      this.canvas.style["width"] = (w/dpi)+"px";
      this.canvas.style["height"] = (h/dpi)+"px";
      this._redraw();
    }
     _redraw() {
      let canvas=this.canvas, g=this.g;
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.beginPath();
      g.rect(0, 0, canvas.width, canvas.height);
      g.fillStyle = this.getDefault("CanvasBG");
      g.fill();
      g.save();
      let zoom=this._value.uiZoom;
      let scale=Math.max(canvas.width, canvas.height);
      g.lineWidth/=scale;
      this.drawTransform[0] = scale*zoom;
      this.drawTransform[1][0] = 0.0;
      this.drawTransform[1][1] = -1.0;
      this.drawTransform[1][0]-=0.5-0.5/zoom;
      this.drawTransform[1][1]+=0.5-0.5/zoom;
      g.scale(this.drawTransform[0], -this.drawTransform[0]);
      g.translate(this.drawTransform[1][0], this.drawTransform[1][1]);
      g.lineWidth/=zoom;
      this._value.draw(this.canvas, this.g, this.drawTransform);
      g.restore();
    }
     rebuild() {
      let ctx=this.ctx;
      if (ctx===undefined||this.container===undefined) {
          return ;
      }
      this._gen_type = this.value.generatorType;
      let col=this.container;
      if (this._lastGen!==undefined) {
          this._lastGen.killGUI(col, this.canvas);
      }
      let onchange=this.dropbox.onchange;
      this.dropbox.onchange = undefined;
      this.dropbox.setValue(this.value.generatorType);
      this.dropbox.onchange = onchange;
      console.log("new curve type", this.value.generatorType, this._gen_type);
      col.clear();
      let gen=this.value.generators.active;
      gen.makeGUI(col, this.canvas);
      this._lastGen = gen;
      this._redraw();
    }
     updateDataPath() {
      if (!this.hasAttribute("datapath")) {
          return ;
      }
      let path=this.getAttribute("datapath");
      let val=this.getPathValue(this.ctx, path);
      if (this._lastu===undefined) {
          this._lastu = 0;
      }
      if (val&&!val.equals(this._value)&&util.time_ms()-this._lastu>200) {
          this._lastu = util.time_ms();
          this._value.load(val);
          this.update();
          this._redraw();
      }
    }
     updateGenUI() {
      let bad=this._lastGen!==this.value.generators.active;
      if (bad) {
          this.rebuild();
          this._redraw();
      }
    }
     update() {
      super.update();
      this.updateDataPath();
      this.updateSize();
      this.updateGenUI();
    }
    static  define() {
      return {tagname: "curve-widget-x", 
     style: "curvewidget"}
    }
  }
  _ESClass.register(Curve1DWidget);
  _es6_module.add_class(Curve1DWidget);
  Curve1DWidget = _es6_module.add_export('Curve1DWidget', Curve1DWidget);
  UIBase.register(Curve1DWidget);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_curvewidget.js');
es6_module_define('ui_dialog', ["../util/simple_events.js", "../screen/ScreenArea.js"], function _ui_dialog_module(_es6_module) {
  var AreaFlags=es6_import_item(_es6_module, '../screen/ScreenArea.js', 'AreaFlags');
  var keymap=es6_import_item(_es6_module, '../util/simple_events.js', 'keymap');
  function makePopupArea(area_class, screen, args) {
    if (args===undefined) {
        args = {};
    }
    let sarea=document.createElement("screenarea-x");
    let width=args.width||(screen.size[0]*0.7);
    let height=args.height||(screen.size[1]*0.7);
    let addEscapeKeyHandler=args.addEscapeKeyHandler!==undefined ? args.addEscapeKeyHandler : true;
    sarea.ctx = screen.ctx;
    sarea.size[0] = width;
    sarea.size[1] = height;
    sarea.pos[0] = 100;
    sarea.pos[1] = 100;
    sarea.pos[0] = Math.min(sarea.pos[0], screen.size[0]-sarea.size[0]-2);
    sarea.pos[1] = Math.min(sarea.pos[1], screen.size[1]-sarea.size[1]-2);
    sarea.switch_editor(area_class);
    sarea.style["background-color"] = sarea.getDefault("DefaultPanelBG");
    sarea.area.flag|=AreaFlags.FLOATING|AreaFlags.INDEPENDENT;
    screen.appendChild(sarea);
    sarea.setCSS();
    if (addEscapeKeyHandler) {
        sarea.on_keydown = (e) =>          {
          if (e.keyCode===keymap.Escape) {
              screen.removeArea(sarea);
          }
        };
    }
    sarea.bringToFront();
    return sarea;
  }
  makePopupArea = _es6_module.add_export('makePopupArea', makePopupArea);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_dialog.js');
es6_module_define('ui_lasttool', ["../core/ui.js", "../config/const.js", "../toolsys/simple_toolsys.js", "../toolsys/toolprop.js", "../core/ui_base.js", "../controller/simple_controller.js", "../util/util.js"], function _ui_lasttool_module(_es6_module) {
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var PropTypes=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropTypes');
  var PropFlags=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropFlags');
  var UndoFlags=es6_import_item(_es6_module, '../toolsys/simple_toolsys.js', 'UndoFlags');
  var DataPath=es6_import_item(_es6_module, '../controller/simple_controller.js', 'DataPath');
  var DataTypes=es6_import_item(_es6_module, '../controller/simple_controller.js', 'DataTypes');
  var util=es6_import(_es6_module, '../util/util.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  const LastKey=Symbol("LastToolPanelId");
  let tool_idgen=0;
  class LastToolPanel extends ColumnFrame {
     constructor() {
      super();
      this._tool_id = undefined;
      this.useDataPathUndo = false;
    }
     init() {
      super.init();
      this.useDataPathUndo = false;
      this.rebuild();
    }
     rebuild() {
      let ctx=this.ctx;
      if (ctx===undefined) {
          this._tool_id = -1;
          return ;
      }
      this.clear();
      this.label("Recent Command Settings");
      let bad=ctx.toolstack.length===0;
      bad = bad||ctx.toolstack[ctx.toolstack.cur].undoflag&UndoFlags.IS_UNDO_ROOT;
      if (bad) {
          this.setCSS();
          return ;
      }
      let tool=ctx.toolstack[ctx.toolstack.cur];
      let def=tool.constructor.tooldef();
      let name=def.uiname!==undefined ? def.uiname : def.name;
      let panel=this.panel(def.uiname);
      let fakecls={};
      fakecls.constructor = fakecls;
      this.ctx.state._last_tool = fakecls;
      let lastkey=tool[LastKey];
      let getTool=() =>        {
        let tool=this.ctx.toolstack[this.ctx.toolstack.cur];
        if (!tool||tool[LastKey]!==lastkey) {
            return undefined;
        }
        return tool;
      };
      let st=this.ctx.api.mapStruct(fakecls, true);
      let paths=[];
      function defineProp(k, key) {
        Object.defineProperty(fakecls, key, {get: function () {
            let tool=getTool();
            if (tool) {
                return tool.inputs[k].getValue();
            }
          }, 
      set: function (val) {
            let tool=getTool();
            if (tool) {
                tool.inputs[k].setValue(val);
                ctx.toolstack.rerun(tool);
                window.redraw_viewport();
            }
          }});
      }
      for (let k in tool.inputs) {
          let prop=tool.inputs[k];
          console.log("PROP FLAG", prop.flag, k);
          if (prop.flag&(PropFlags.PRIVATE|PropFlags.READ_ONLY)) {
              continue;
          }
          let uiname=prop.uiname!==undefined ? prop.uiname : k;
          prop.uiname = uiname;
          let apikey=k.replace(/[\t ]/g, "_");
          let dpath=new DataPath(apikey, apikey, prop, DataTypes.PROP);
          st.add(dpath);
          paths.push(dpath);
          defineProp(k, apikey);
      }
      for (let dpath of paths) {
          let path="last_tool."+dpath.path;
          panel.label(dpath.data.uiname);
          panel.prop(path);
      }
      this.setCSS();
      console.log("Building last tool settings");
    }
     update() {
      super.update();
      let ctx=this.ctx;
      if (ctx.toolstack.length==0) {
          return ;
      }
      let tool=ctx.toolstack[ctx.toolstack.cur];
      if (!(LastKey in tool)||tool[LastKey]!==this._tool_id) {
          tool[LastKey] = tool_idgen++;
          this._tool_id = tool[LastKey];
          this.rebuild();
      }
    }
    static  define() {
      return {tagname: "last-tool-panel-x"}
    }
  }
  _ESClass.register(LastToolPanel);
  _es6_module.add_class(LastToolPanel);
  LastToolPanel = _es6_module.add_export('LastToolPanel', LastToolPanel);
  UIBase.register(LastToolPanel);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_lasttool.js');
es6_module_define('ui_listbox', ["../util/util.js", "./ui_table.js", "../toolsys/simple_toolsys.js", "../toolsys/toolprop.js", "../core/ui.js", "../util/vectormath.js", "../core/ui_base.js", "../util/events.js"], function _ui_listbox_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../util/events.js');
  var simple_toolsys=es6_import(_es6_module, '../toolsys/simple_toolsys.js');
  var toolprop=es6_import(_es6_module, '../toolsys/toolprop.js');
  var TableFrame=es6_import_item(_es6_module, './ui_table.js', 'TableFrame');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var RowFrame=es6_import_item(_es6_module, '../core/ui.js', 'RowFrame');
  var keymap=es6_import_item(_es6_module, '../util/events.js', 'keymap');
  let EnumProperty=toolprop.EnumProperty, PropTypes=toolprop.PropTypes;
  let UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, IconSheets=ui_base.IconSheets;
  function getpx(css) {
    return parseFloat(css.trim().replace("px", ""));
  }
  class ListItem extends RowFrame {
     constructor() {
      super();
      let highlight=() =>        {
        console.log("listitem mouseover");
        this.highlight = true;
        this.setBackground();
      };
      let unhighlight=() =>        {
        console.log("listitem mouseleave");
        this.highlight = false;
        this.setBackground();
      };
      this.addEventListener("mouseover", highlight);
      this.addEventListener("mousein", highlight);
      this.addEventListener("mouseleave", unhighlight);
      this.addEventListener("mouseout", unhighlight);
      this.addEventListener("blur", unhighlight);
      this.addEventListener("click", (e) =>        {
        console.log("click!");
        if (this.onclick) {
            this.onclick();
        }
      });
      let style=document.createElement("style");
      style.textContent = `
      .listitem {
        -moz-user-focus: normal;
        moz-user-focus: normal;
        user-focus: normal;
      }
    `;
      this.shadowRoot.prepend(style);
    }
     init() {
      super.init();
      this.setAttribute("class", "listitem");
      this.style["width"] = "100%";
      this.setCSS();
    }
     setBackground() {
      if (this.highlight) {
          this.background = this.getDefault("ListHighlight");
      }
      else 
        if (this.is_active) {
          this.background = this.getDefault("ListActive");
      }
      else {
        this.background = this.getDefault("DefaultPanelBG");
      }
    }
    static  define() {
      return {tagname: "listitem-x", 
     style: "listbox"}
    }
  }
  _ESClass.register(ListItem);
  _es6_module.add_class(ListItem);
  UIBase.register(ListItem);
  class ListBox extends Container {
     constructor() {
      super();
      this.items = [];
      this.idmap = {};
      this.items.active = undefined;
      this.highlight = false;
      this.is_active = false;
      let style=document.createElement("style");
      style.textContent = `
      .listbox {
        -moz-user-focus: normal;
        moz-user-focus: normal;
        user-focus: normal;
      }
    `;
      this.shadow.prepend(style);
      this.onkeydown = (e) =>        {
        console.log("yay", e.keyCode);
        switch (e.keyCode) {
          case keymap["Up"]:
          case keymap["Down"]:
            if (this.items.length==0)
              return ;
            if (this.items.active===undefined) {
                this.setActive(this.items[0]);
                return ;
            }
            let i=this.items.indexOf(this.items.active);
            let dir=e.keyCode==keymap["Up"] ? -1 : 1;
            i = Math.max(Math.min(i+dir, this.items.length-1), 0);
            this.setActive(this.items[i]);
            break;
        }
      };
    }
     setCSS() {
      super.setCSS();
    }
     init() {
      super.init();
      this.setCSS();
      this.style["width"] = this.getDefault("width")+"px";
      this.style["height"] = this.getDefault("height")+"px";
      this.style["overflow"] = "scroll";
    }
     addItem(name, id) {
      let item=document.createElement("listitem-x");
      item._id = id===undefined ? this.items.length : id;
      this.idmap[item._id] = item;
      this.tabIndex = 1;
      this.setAttribute("tabindex", 1);
      this.add(item);
      this.items.push(item);
      item.label(name);
      let this2=this;
      item.onclick = function () {
        this2.setActive(this);
        this.setBackground();
      };
      return item;
    }
     removeItem(item) {
      if (typeof item=="number") {
          item = this.idmap[item];
      }
      item.remove();
      delete this.idmap[item._id];
      this.items.remove(item);
    }
     setActive(item) {
      if (typeof item=="number") {
          item = this.idmap[item];
      }
      console.log("set active!");
      if (item===this.items.active) {
          return ;
      }
      if (this.items.active!==undefined) {
          this.items.active.highlight = false;
          this.items.active.is_active = false;
          this.items.active.setBackground();
      }
      item.is_active = true;
      this.items.active = item;
      if (item!==undefined) {
          item.setBackground();
          item.scrollIntoViewIfNeeded();
      }
      if (this.onchange) {
          this.onchange(item._id, item);
      }
    }
     clear() {

    }
    static  define() {
      return {tagname: "listbox-x", 
     style: "listbox"}
    }
  }
  _ESClass.register(ListBox);
  _es6_module.add_class(ListBox);
  UIBase.register(ListBox);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_listbox.js');
es6_module_define('ui_menu', ["../util/util.js", "../toolsys/simple_toolsys.js", "../util/vectormath.js", "../config/const.js", "../util/events.js", "./ui_button.js", "../core/ui_base.js", "../util/simple_events.js", "../toolsys/toolprop.js"], function _ui_menu_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../util/util.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../util/events.js');
  var simple_toolsys=es6_import(_es6_module, '../toolsys/simple_toolsys.js');
  var toolprop=es6_import(_es6_module, '../toolsys/toolprop.js');
  var Button=es6_import_item(_es6_module, './ui_button.js', 'Button');
  var DomEventTypes=es6_import_item(_es6_module, '../util/events.js', 'DomEventTypes');
  var HotKey=es6_import_item(_es6_module, '../util/simple_events.js', 'HotKey');
  var keymap=es6_import_item(_es6_module, '../util/simple_events.js', 'keymap');
  let EnumProperty=toolprop.EnumProperty, PropTypes=toolprop.PropTypes;
  let UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, IconSheets=ui_base.IconSheets;
  function getpx(css) {
    return parseFloat(css.trim().replace("px", ""));
  }
  class Menu extends UIBase {
     constructor() {
      super();
      this.items = [];
      this.autoSearchMode = true;
      this._ignoreFocusEvents = false;
      this.closeOnMouseUp = true;
      this.itemindex = 0;
      this.closed = false;
      this.started = false;
      this.activeItem = undefined;
      this.overrideDefault("DefaultText", this.getDefault("MenuText"));
      this.container = document.createElement("span");
      this.container.style["display"] = "flex";
      this.container.style["color"] = this.getDefault("MenuText").color;
      this.container.setAttribute("class", "menucon");
      this.dom = document.createElement("ul");
      this.dom.setAttribute("class", "menu");
      let style=this.menustyle = document.createElement("style");
      this.buildStyle();
      this.dom.setAttribute("tabindex", -1);
      this.container.addEventListener("mouseleave", (e) =>        {
        console.log("menu out");
        this.close();
      }, false);
      this.shadow.appendChild(style);
      this.shadow.appendChild(this.container);
    }
     float(x, y, zindex=undefined) {
      console.log("menu test!");
      let dpi=this.getDPI();
      let rect=this.dom.getClientRects();
      let maxx=this.getWinWidth()-10;
      let maxy=this.getWinHeight()-10;
      console.log(rect.length>0 ? rect[0] : undefined);
      if (rect.length>0) {
          rect = rect[0];
          console.log(y+rect.height);
          if (y+rect.height>maxy) {
              console.log("greater");
              y = maxy-rect.height-1;
          }
          if (x+rect.width>maxx) {
              console.log("greater");
              x = maxx-rect.width-1;
          }
      }
      super.float(x, y, 50);
    }
     click() {
      if (this.activeItem==undefined)
        return ;
      if (this.activeItem!==undefined&&this.activeItem._isMenu)
        return ;
      if (this.onselect) {
          try {
            console.log(this.activeItem._id, "-----");
            this.onselect(this.activeItem._id);
          }
          catch (error) {
              util.print_stack(error);
              console.log("Error in menu callback");
          }
      }
      console.log("menu select");
      this.close();
    }
     _ondestroy() {
      if (this.started) {
          menuWrangler.popMenu(this);
          if (this.onclose) {
              this.onclose();
          }
      }
    }
     init() {
      super.init();
      this.setCSS();
    }
     close() {
      if (this.closed) {
          return ;
      }
      this.closed = true;
      if (this.started) {
          menuWrangler.popMenu(this);
      }
      this.started = false;
      if (this._popup) {
          this._popup.end();
          this._popup = undefined;
      }
      this.remove();
      this.dom.remove();
      if (this.onclose) {
          this.onclose(this);
      }
    }
     _select(dir, focus=true) {
      if (this.activeItem===undefined) {
          for (let item of this.items) {
              if (!item.hidden) {
                  this.setActive(item, focus);
                  break;
              }
          }
      }
      else {
        let i=this.items.indexOf(this.activeItem);
        let item=this.activeItem;
        do {
          i = (i+dir+this.items.length)%this.items.length;
          item = this.items[i];
          if (!item.hidden) {
              break;
          }
        } while (item!==this.activeItem);
        
        this.setActive(item, focus);
      }
      if (this.hasSearchBox) {
          this.activeItem.scrollIntoView();
      }
    }
     selectPrev(focus=true) {
      return this._select(-1, focus);
    }
     selectNext(focus=true) {
      return this._select(1, focus);
    }
    static  define() {
      return {tagname: "menu-x", 
     style: "menu"}
    }
     start_fancy(prepend, setActive=true) {
      return this.startFancy(prepend, setActive);
    }
     setActive(item, focus=true) {
      if (this.activeItem===item) {
          return ;
      }
      if (this.activeItem) {
          this.activeItem.style["background-color"] = this.getDefault("MenuBG");
          if (focus) {
              this.activeItem.blur();
          }
      }
      if (item) {
          item.style["background-color"] = this.getDefault("MenuHighlight");
          if (focus) {
              item.focus();
          }
      }
      this.activeItem = item;
    }
     startFancy(prepend, setActive=true) {
      console.warn("menu searchbox mode start");
      this.hasSearchBox = true;
      this.started = true;
      menuWrangler.pushMenu(this);
      let dom2=document.createElement("div");
      this.dom.setAttribute("class", "menu");
      dom2.setAttribute("class", "menu");
      let sbox=this.textbox = document.createElement("textbox-x");
      this.textbox.parentWidget = this;
      dom2.appendChild(sbox);
      dom2.appendChild(this.dom);
      dom2.style["height"] = "300px";
      this.dom.style["height"] = "300px";
      this.dom.style["overflow"] = "scroll";
      if (prepend) {
          this.container.prepend(dom2);
      }
      else {
        this.container.appendChild(dom2);
      }
      dom2.parentWidget = this.container;
      sbox.focus();
      sbox.onchange = () =>        {
        let t=sbox.text.trim().toLowerCase();
        console.log("applying search", t);
        for (let item of this.items) {
            item.hidden = true;
            item.remove();
        }
        for (let item of this.items) {
            let ok=t=="";
            ok = ok||item.innerHTML.toLowerCase().search(t)>=0;
            if (ok) {
                item.hidden = false;
                this.dom.appendChild(item);
            }
            else 
              if (item===this.activeItem) {
                this.selectNext(false);
            }
        }
      };
      sbox.addEventListener("keydown", (e) =>        {
        console.log(e.keyCode);
        switch (e.keyCode) {
          case 27:
            this.close();
            break;
          case 13:
            this.click(this.activeItem);
            this.close();
            break;
        }
      });
    }
     start(prepend=false, setActive=true) {
      this.started = true;
      this.focus();
      menuWrangler.pushMenu(this);
      if (this.items.length>15&&this.autoSearchMode) {
          return this.start_fancy(prepend, setActive);
      }
      if (prepend) {
          this.container.prepend(this.dom);
      }
      else {
        this.container.appendChild(this.dom);
      }
      if (!setActive)
        return ;
      console.log(this.container, "container?");
      this.setCSS();
      this.flushUpdate();
      window.setTimeout(() =>        {
        this.flushUpdate();
        if (this.activeItem===undefined) {
            this.activeItem = this.dom.childNodes[0];
        }
        if (this.activeItem===undefined) {
            return ;
        }
        this.activeItem.focus();
      }, 0);
    }
     addItemExtra(text, id=undefined, hotkey, icon=-1, add=true, tooltip=undefined) {
      let dom=document.createElement("span");
      dom.style["display"] = "inline-flex";
      dom.hotkey = hotkey;
      dom.icon = icon;
      let icon_div;
      if (1) {
          icon_div = ui_base.makeIconDiv(icon, IconSheets.SMALL);
      }
      else {
        let tilesize=ui_base.iconmanager.getTileSize(IconSheets.SMALL);
        icon_div = document.createElement("span");
        icon_div.style["padding"] = icon_div.style["margin"] = "0px";
        icon_div.style["width"] = tilesize+"px";
        icon_div.style["height"] = tilesize+"px";
      }
      icon_div.style["display"] = "inline-flex";
      icon_div.style["margin-right"] = "1px";
      icon_div.style["align"] = "left";
      let span=document.createElement("span");
      span.style["font"] = ui_base.getFont(this, undefined, "MenuText");
      let dpi=this.getDPI();
      let tsize=this.getDefault("MenuText").size;
      let canvas=document.createElement("canvas");
      let g=canvas.getContext("2d");
      g.font = span.style["font"];
      let rect=span.getClientRects();
      let twid=Math.ceil(g.measureText(text).width);
      let hwid;
      if (hotkey) {
          dom.hotkey = hotkey;
          g.font = ui_base.getFont(this, undefined, "HotkeyText");
          hwid = Math.ceil(g.measureText(hotkey).width);
          twid+=hwid+8;
      }
      span.innerText = text;
      span.style["word-wrap"] = "none";
      span.style["white-space"] = "pre";
      span.style["overflow"] = "hidden";
      span.style["text-overflow"] = "clip";
      span.style["width"] = ~~(twid)+"px";
      span.style["padding"] = "0px";
      span.style["margin"] = "0px";
      dom.style["width"] = "100%";
      dom.appendChild(icon_div);
      dom.appendChild(span);
      if (hotkey) {
          let hotkey_span=document.createElement("span");
          hotkey_span.innerText = hotkey;
          hotkey_span.style["margin-left"] = "0px";
          hotkey_span.style["margin-right"] = "0px";
          hotkey_span.style["margin"] = "0px";
          hotkey_span.style["padding"] = "0px";
          let al="right";
          hotkey_span.style["font"] = ui_base.getFont(this, undefined, "HotkeyText");
          hotkey_span.style["color"] = this.getDefault("HotkeyTextColor");
          hotkey_span.style["width"] = "100%";
          hotkey_span.style["text-align"] = al;
          hotkey_span.style["flex-align"] = al;
          hotkey_span.style["float"] = "right";
          hotkey_span["flex-wrap"] = "nowrap";
          dom.appendChild(hotkey_span);
      }
      let ret=this.addItem(dom, id, add);
      ret.hotkey = hotkey;
      ret.icon = icon;
      ret.label = text ? text : ret.innerText;
      if (tooltip) {
          ret.title = tooltip;
      }
      return ret;
    }
     addItem(item, id, add=true) {
      id = id===undefined ? item : id;
      let text=item;
      if (typeof item==="string"||__instance_of(item, String)) {
          let dom=document.createElement("dom");
          dom.textContent = item;
          item = dom;
      }
      else {
        text = item.textContent;
      }
      let li=document.createElement("li");
      li.setAttribute("tabindex", this.itemindex++);
      li.setAttribute("class", "menuitem");
      if (__instance_of(item, Menu)) {
          console.log("submenu!");
          let dom=this.addItemExtra(""+item.title, id, "", -1, false);
          li.style["width"] = "100%";
          li.appendChild(dom);
          li._isMenu = true;
          li._menu = item;
          item.hidden = false;
          item.container = this.container;
      }
      else {
        li._isMenu = false;
        li.appendChild(item);
      }
      li._id = id;
      this.items.push(li);
      li.label = text ? text : li.innerText.trim();
      if (add) {
          li.addEventListener("click", (e) =>            {
            if (this.activeItem!==undefined&&this.activeItem._isMenu) {
                return n;
            }
            this.click();
          });
          li.addEventListener("blur", (e) =>            {
            if (this._ignoreFocusEvents) {
                return ;
            }
            if (this.activeItem&&!this.activeItem._isMenu) {
                this.setActive(undefined, false);
            }
          });
          let onfocus=(e) =>            {
            if (this._ignoreFocusEvents) {
                return ;
            }
            if (this.activeItem!==undefined&&this.activeItem._isMenu) {
                let active=this.activeItem;
                window.setTimeout(() =>                  {
                  if (this.activeItem&&this.activeItem!==active) {
                      active._menu.close();
                  }
                }, 10);
            }
            if (li._isMenu) {
                li._menu.onselect = (item) =>                  {
                  this.onselect(item);
                  this.close();
                };
                li._menu.start(false, false);
            }
            this.setActive(li, false);
          };
          li.addEventListener("touchend", (e) =>            {
            onfocus(e);
            if (this.activeItem!==undefined&&this.activeItem._isMenu) {
                console.log("menu ignore");
                return ;
            }
            this.click();
          });
          li.addEventListener("focus", (e) =>            {
            onfocus(e);
          });
          li.addEventListener("touchmove", (e) =>            {
            onfocus(e);
            li.focus();
          });
          li.addEventListener("mouseenter", (e) =>            {
            li.focus();
          });
          this.dom.appendChild(li);
      }
      return li;
    }
     buildStyle() {
      let pad1=util.isMobile() ? 2 : 0;
      pad1+=this.getDefault("MenuSpacing");
      this.menustyle.textContent = `
        .menucon {
          position:absolute;
          float:left;
          
          display: block;
          -moz-user-focus: normal;
        }
        
        ul.menu {
          display        : flex;
          flex-direction : column;
          flex-wrap      : nowrap;
          width          : max-content;
          
          margin : 0px;
          padding : 0px;
          border : ${this.getDefault("MenuBorder")};
          -moz-user-focus: normal;
          background-color: ${this.getDefault("MenuBG")};
          color : ${this.getDefault("MenuText").color};
        }
        
        .menuitem {
          display : flex;
          flex-wrap : nowrap;
          flex-direction : row;          
          
          list-style-type:none;
          -moz-user-focus: normal;
          
          margin : 0;
          padding : 0px;
          padding-right: 16px;
          padding-left: 16px;
          padding-top : ${pad1}px;
          padding-bottom : ${pad1}px;
          color : ${this.getDefault("MenuText").color};
          font : ${this.getDefault("MenuText").genCSS()};
          background-color: ${this.getDefault("MenuBG")};
        }
        
        .menuseparator {
          ${this.getDefault("MenuSeparator")}
        }
        
        .menuitem:focus {
          display : flex;
          flex-wrap : nowrap;
          
          border : none;
          outline : none;
          
          background-color: ${this.getDefault("MenuHighlight")};
          color : ${this.getDefault("MenuText").color};
          -moz-user-focus: normal;
        }
      `;
    }
     setCSS() {
      super.setCSS();
      this.buildStyle();
      this.container.style["color"] = this.getDefault("MenuText").color;
      this.style["color"] = this.getDefault("MenuText").color;
    }
     seperator() {
      let bar=document.createElement("div");
      bar.setAttribute("class", "menuseparator");
      this.dom.appendChild(bar);
      return this;
    }
     menu(title) {
      let ret=document.createElement("menu-x");
      ret.setAttribute("title", title);
      this.addItem(ret);
      return ret;
    }
     calcSize() {

    }
  }
  _ESClass.register(Menu);
  _es6_module.add_class(Menu);
  Menu = _es6_module.add_export('Menu', Menu);
  Menu.SEP = Symbol("menu seperator");
  UIBase.register(Menu);
  class DropBox extends Button {
     constructor() {
      super();
      this._searchMenuMode = false;
      this.altKey = undefined;
      this.r = 5;
      this._menu = undefined;
      this._auto_depress = false;
      this._onpress = this._onpress.bind(this);
    }
     init() {
      super.init();
      this.updateWidth();
    }
    get  searchMenuMode() {
      return this._searchMenuMode;
    }
    set  searchMenuMode(v) {
      this._searchMenuMode = v;
      console.warn("searchMenuMode was set", this);
    }
     setCSS() {
      this.style["user-select"] = "none";
      this.dom.style["user-select"] = "none";
    }
     _genLabel() {
      let s=super._genLabel();
      let ret="";
      if (s.length===0) {
          s = "(error)";
      }
      this.altKey = s[0].toUpperCase().charCodeAt(0);
      for (let i=0; i<s.length; i++) {
          if (s[i]==="&"&&i<s.length-1&&s[i+1]!=="&") {
              this.altKey = s[i+1].toUpperCase().charCodeAt(0);
          }
          else 
            if (s[i]==="&"&&i<s.length-1&&s[i+1]==="&") {
              continue;
          }
          else {
            ret+=s[i];
          }
      }
      return ret;
    }
     updateWidth() {
      let dpi=this.getDPI();
      let ts=this.getDefault("DefaultText").size;
      let tw=this.g.measureText(this._genLabel()).width/dpi;
      tw = ~~tw;
      tw+=15;
      if (!this.getAttribute("simple")) {
          tw+=35;
      }
      if (tw!==this._last_w) {
          this._last_w = tw;
          this.dom.style["width"] = tw+"px";
          this.style["width"] = tw+"px";
          this.width = tw;
          this.overrideDefault("defaultWidth", tw);
          this._repos_canvas();
          this._redraw();
      }
      return 0;
    }
     updateDataPath() {
      if (!this.ctx||!this.hasAttribute("datapath")) {
          return ;
      }
      let prop=this.getPathMeta(this.ctx, this.getAttribute("datapath"));
      let val=this.getPathValue(this.ctx, this.getAttribute("datapath"));
      if (val===undefined) {
          this.disabled = true;
          return ;
      }
      else {
        this.disabled = false;
      }
      if (this.prop!==undefined) {
          prop = this.prop;
      }
      let name=this.getAttribute("name");
      if (prop.type&(PropTypes.ENUM|PropTypes.FLAG)) {
          name = prop.ui_value_names[prop.keys[val]];
      }
      else {
        name = ""+val;
      }
      if (name!=this.getAttribute("name")) {
          this.setAttribute("name", name);
          this.updateName();
      }
    }
     update() {
      super.update();
      let key=this.getDefault("dropTextBG");
      if (key!==this._last_dbox_key) {
          this._last_dbox_key = key;
          this.setCSS();
          this._redraw();
      }
      if (this.hasAttribute("datapath")) {
          this.updateDataPath();
      }
    }
     _build_menu() {
      let prop=this.prop;
      if (this.prop===undefined) {
          return ;
      }
      if (this._menu!==undefined&&this._menu.parentNode!==undefined) {
          this._menu.remove();
      }
      let menu=this._menu = document.createElement("menu-x");
      menu.setAttribute("title", name);
      menu._dropbox = this;
      let valmap={};
      let enummap=prop.values;
      let iconmap=prop.iconmap;
      let uimap=prop.ui_value_names;
      for (let k in enummap) {
          let uk=k;
          valmap[enummap[k]] = k;
          if (uimap!==undefined&&k in uimap) {
              uk = uimap[k];
          }
          if (iconmap&&iconmap[k]) {
              menu.addItemExtra(uk, enummap[k], undefined, iconmap[k]);
          }
          else {
            menu.addItem(uk, enummap[k]);
          }
      }
      menu.onselect = (id) =>        {
        this._pressed = false;
        this._pressed = false;
        this._redraw();
        this._menu = undefined;
        this.prop.setValue(id);
        this.setAttribute("name", this.prop.ui_value_names[valmap[id]]);
        if (this.onselect) {
            this.onselect(id);
        }
        if (this.hasAttribute("datapath")&&this.ctx) {
            console.log("setting data api value", id, this.getAttribute("datapath"));
            this.setPathValue(this.ctx, this.getAttribute("datapath"), id);
        }
      };
    }
     _onpress(e) {
      console.warn("menu dropbox click", this._menu, e);
      if (this._menu!==undefined) {
          this._pressed = false;
          this._redraw();
          let menu=this._menu;
          this._menu = undefined;
          menu.close();
          return ;
      }
      this._build_menu();
      if (this._menu===undefined) {
          return ;
      }
      this._menu.autoSearchMode = false;
      this._menu._dropbox = this;
      this.dom._background = this.getDefault("BoxDepressed");
      this._background = this.getDefault("BoxDepressed");
      this._redraw();
      this._pressed = true;
      this.setCSS();
      let onclose=this._menu.onclose;
      this._menu.onclose = () =>        {
        console.log("menu onclose");
        this._pressed = false;
        this._redraw();
        let menu=this._menu;
        if (menu) {
            this._menu = undefined;
            menu._dropbox = undefined;
        }
        if (onclose) {
            onclose.call(menu);
        }
      };
      let menu=this._menu;
      let screen=this.getScreen();
      let dpi=this.getDPI();
      let x=e.x, y=e.y;
      let rects=this.dom.getBoundingClientRect();
      x = rects.x-window.scrollX;
      y = rects.y+rects.height-window.scrollY;
      if (!window.haveElectron) {
      }
      let con=this._popup = menu._popup = screen.popup(this, x, y, false, 0);
      con.noMarginsOrPadding();
      con.add(menu);
      if (this.searchMenuMode) {
          menu.startFancy();
      }
      else {
        menu.start();
      }
    }
     _redraw() {
      if (this.getAttribute("simple")) {
          let color;
          if (this._highlight) {
              ui_base.drawRoundBox2(this, {canvas: this.dom, 
         g: this.g, 
         color: this.getDefault("BoxHighlight")});
          }
          if (this._focus) {
              ui_base.drawRoundBox2(this, {canvas: this.dom, 
         g: this.g, 
         color: this.getDefault("BoxHighlight"), 
         op: "stroke", 
         no_clear: true});
              ui_base.drawRoundBox(this, this.dom, this.g, undefined, undefined, 2, "stroke");
          }
          this._draw_text();
          return ;
      }
      super._redraw(false);
      let g=this.g;
      let w=this.dom.width, h=this.dom.height;
      let dpi=this.getDPI();
      let p=10*dpi;
      let p2=4*dpi;
      let bg=this.getDefault("dropTextBG");
      if (bg!==undefined) {
          g.fillStyle = bg;
          g.beginPath();
          g.rect(p2, p2, this.dom.width-p2-h, this.dom.height-p2*2);
          g.fill();
      }
      g.fillStyle = "rgba(50, 50, 50, 0.2)";
      g.strokeStyle = "rgba(50, 50, 50, 0.8)";
      g.beginPath();
      let sz=0.3;
      g.moveTo(w-h*0.5-p, p);
      g.lineTo(w-p, p);
      g.moveTo(w-h*0.5-p, p+sz*h/3);
      g.lineTo(w-p, p+sz*h/3);
      g.moveTo(w-h*0.5-p, p+sz*h*2/3);
      g.lineTo(w-p, p+sz*h*2/3);
      g.lineWidth = 1;
      g.stroke();
      this._draw_text();
    }
    set  menu(val) {
      this._menu = val;
      if (val!==undefined) {
          this._name = val.title;
          this.updateName();
      }
    }
     setValue(val) {
      if (this.prop!==undefined) {
          this.prop.setValue(val);
          let val2=val;
          if (val2 in this.prop.keys)
            val2 = this.prop.keys[val2];
          val2 = this.prop.ui_value_names[val2];
          this.setAttribute("name", ""+val2);
          this._name = ""+val2;
      }
      else {
        this.setAttribute("name", ""+val);
        this._name = ""+val;
      }
      if (this.onchange) {
          this.onchange(val);
      }
      this.setCSS();
      this.update();
      this._redraw();
    }
    get  menu() {
      return this._menu;
    }
    static  define() {
      return {tagname: "dropbox-x", 
     style: "dropbox"}
    }
  }
  _ESClass.register(DropBox);
  _es6_module.add_class(DropBox);
  DropBox = _es6_module.add_export('DropBox', DropBox);
  UIBase.register(DropBox);
  class MenuWrangler  {
     constructor() {
      this.screen = undefined;
      this.menustack = [];
      this.closetimer = 0;
      this.closeOnMouseUp = undefined;
    }
    get  menu() {
      return this.menustack.length>0 ? this.menustack[this.menustack.length-1] : undefined;
    }
     pushMenu(menu) {
      if (this.menustack.length===0&&menu.closeOnMouseUp) {
          this.closeOnMouseUp = true;
      }
      this.menustack.push(menu);
    }
     popMenu(menu) {
      return this.menustack.pop();
    }
     endMenus() {
      for (let menu of this.menustack) {
          menu.close();
      }
      this.menustack = [];
    }
     searchKeyDown(e) {
      let menu=this.menu;
      console.log("s", e.keyCode);
      e.stopPropagation();
      menu._ignoreFocusEvents = true;
      menu.textbox.focus();
      menu._ignoreFocusEvents = false;
      switch (e.keyCode) {
        case keymap["Enter"]:
          menu.click(menu.activeItem);
          break;
        case keymap["Escape"]:
          menu.close();
          break;
        case keymap["Up"]:
          console.log("Up");
          menu.selectPrev(false);
          break;
        case keymap["Down"]:
          console.log("Down");
          menu.selectNext(false);
          break;
      }
    }
     on_keydown(e) {
      window.menu = this.menu;
      if (this.menu===undefined) {
          return ;
      }
      if (this.menu.hasSearchBox) {
          return this.searchKeyDown(e);
      }
      console.log("key", e.keyCode);
      let menu=this.menu;
      switch (e.keyCode) {
        case keymap["Left"]:
        case keymap["Right"]:
          if (menu._dropbox) {
              let dropbox=menu._dropbox;
              if (e.keyCode===keymap["Left"]) {
                  dropbox = dropbox.previousElementSibling;
              }
              else {
                dropbox = dropbox.nextElementSibling;
              }
              if (dropbox!==undefined&&__instance_of(dropbox, DropBox)) {
                  this.endMenus();
                  dropbox._onpress(e);
              }
          }
          break;
        case keymap["Up"]:
          menu.selectPrev();
          break;
        case keymap["Down"]:
          menu.selectNext();
          break;
        case 13:
        case 32:
          menu.click(menu.activeItem);
          break;
        case 27:
          menu.close();
          break;
      }
    }
     on_mousedown(e) {
      if (this.menu===undefined||this.screen===undefined) {
          this.closetimer = util.time_ms();
          return ;
      }
      let screen=this.screen;
      let x=e.pageX, y=e.pageY;
      let element=screen.pickElement(x, y);
      console.log("wrangler mousedown", element);
      if (element!==undefined&&(__instance_of(element, DropBox)||util.isMobile())) {
          this.endMenus();
          e.preventDefault();
          e.stopPropagation();
      }
    }
     on_mouseup(e) {
      if (this.menu===undefined||this.screen===undefined) {
          this.closetimer = util.time_ms();
          return ;
      }
      let screen=this.screen;
      let x=e.pageX, y=e.pageY;
      let element=screen.pickElement(x, y, undefined, undefined, DropBox);
      if (element!==undefined) {
          this.closeOnMouseUp = false;
      }
      else {
        element = screen.pickElement(x, y, undefined, undefined, Menu);
        if (element&&this.closeOnMouseUp) {
            element.click();
        }
      }
    }
     on_mousemove(e) {
      if (this.menu&&this.menu.hasSearchBox) {
          this.closetimer = util.time_ms();
          return ;
      }
      if (this.menu===undefined||this.screen===undefined) {
          this.closetimer = util.time_ms();
          return ;
      }
      let screen=this.screen;
      let x=e.pageX, y=e.pageY;
      let element=screen.pickElement(x, y);
      if (element===undefined) {
          return ;
      }
      if (__instance_of(element, DropBox)&&element.menu!==this.menu&&element.getAttribute("simple")) {
          this.endMenus();
          this.closetimer = util.time_ms();
          element._onpress(e);
          return ;
      }
      let ok=false;
      let w=element;
      while (w) {
        if (w===this.menu) {
            ok = true;
            break;
        }
        if (__instance_of(w, DropBox)&&w.menu===this.menu) {
            ok = true;
            break;
        }
        w = w.parentWidget;
      }
      if (!ok&&(util.time_ms()-this.closetimer>cconst.menu_close_time)) {
          this.endMenus();
      }
      else 
        if (ok) {
          this.closetimer = util.time_ms();
      }
    }
  }
  _ESClass.register(MenuWrangler);
  _es6_module.add_class(MenuWrangler);
  MenuWrangler = _es6_module.add_export('MenuWrangler', MenuWrangler);
  let menuWrangler=new MenuWrangler();
  menuWrangler = _es6_module.add_export('menuWrangler', menuWrangler);
  let wrangerStarted=false;
  function startMenuEventWrangling(screen) {
    menuWrangler.screen = screen;
    if (wrangerStarted) {
        return ;
    }
    wrangerStarted = true;
    for (let k in DomEventTypes) {
        if (menuWrangler[k]===undefined) {
            continue;
        }
        let dom=k.search("key")>=0 ? window : document.body;
        dom = window;
        dom.addEventListener(DomEventTypes[k], menuWrangler[k].bind(menuWrangler), {passive: false, 
      capture: true});
    }
    menuWrangler.screen = screen;
  }
  startMenuEventWrangling = _es6_module.add_export('startMenuEventWrangling', startMenuEventWrangling);
  function setWranglerScreen(screen) {
    startMenuEventWrangling(screen);
  }
  setWranglerScreen = _es6_module.add_export('setWranglerScreen', setWranglerScreen);
  function getWranglerScreen() {
    return menuWrangler.screen;
  }
  getWranglerScreen = _es6_module.add_export('getWranglerScreen', getWranglerScreen);
  function createMenu(ctx, title, templ) {
    let menu=document.createElement("menu-x");
    menu.ctx = ctx;
    menu.setAttribute("name", title);
    let SEP=menu.constructor.SEP;
    let id=0;
    let cbs={}
    let doItem=(item) =>      {
      if (item!==undefined&&__instance_of(item, Menu)) {
          menu.addItem(item);
      }
      else 
        if (typeof item=="string") {
          let def;
          try {
            def = ctx.api.getToolDef(item);
          }
          catch (error) {
              menu.addItem("(tool path error)", id++);
              return ;
          }
          menu.addItemExtra(def.uiname, id, def.hotkey, def.icon);
          cbs[id] = (function (toolpath) {
            return function () {
              ctx.api.execTool(ctx, toolpath);
            }
          })(item);
          id++;
      }
      else 
        if (item===SEP) {
          menu.seperator();
      }
      else 
        if (typeof item==="function"||__instance_of(item, Function)) {
          doItem(item());
      }
      else 
        if (__instance_of(item, Array)) {
          let hotkey=item.length>2 ? item[2] : undefined;
          let icon=item.length>3 ? item[3] : undefined;
          let tooltip=item.length>4 ? item[4] : undefined;
          if (hotkey!==undefined&&__instance_of(hotkey, HotKey)) {
              hotkey = hotkey.buildString();
          }
          menu.addItemExtra(item[0], id, hotkey, icon, undefined, tooltip);
          cbs[id] = (function (cbfunc, arg) {
            return function () {
              cbfunc(arg);
            }
          })(item[1], item[2]);
          id++;
      }
    }
    for (let item of templ) {
        doItem(item);
    }
    menu.onselect = (id) =>      {
      cbs[id]();
    }
    return menu;
  }
  createMenu = _es6_module.add_export('createMenu', createMenu);
  function startMenu(menu, x, y, searchMenuMode, safetyDelay) {
    if (searchMenuMode===undefined) {
        searchMenuMode = false;
    }
    if (safetyDelay===undefined) {
        safetyDelay = 55;
    }
    let screen=menu.ctx.screen;
    let con=menu._popup = screen.popup(undefined, x, y, false, safetyDelay);
    con.noMarginsOrPadding();
    con.add(menu);
    if (searchMenuMode) {
        menu.startFancy();
    }
    else {
      menu.start();
    }
  }
  startMenu = _es6_module.add_export('startMenu', startMenu);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_menu.js');
es6_module_define('ui_noteframe', ["../core/ui.js", "../util/util.js", "../core/ui_base.js"], function _ui_noteframe_module(_es6_module) {
  var util=es6_import(_es6_module, '../util/util.js');
  var ui=es6_import(_es6_module, '../core/ui.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var Icons=es6_import_item(_es6_module, '../core/ui_base.js', 'Icons');
  var css2color=es6_import_item(_es6_module, '../core/ui_base.js', 'css2color');
  var color2css=es6_import_item(_es6_module, '../core/ui_base.js', 'color2css');
  let UIBase=ui_base.UIBase;
  class Note extends ui_base.UIBase {
     constructor() {
      super();
      let style=document.createElement("style");
      this._noteid = undefined;
      this.height = 20;
      style.textContent = `
    .notex {
      display : flex;
      flex-direction : row;
      flex-wrap : nowrap;
      height : {this.height}px;
      padding : 0px;
      margin : 0px;
    }
    `;
      this.dom = document.createElement("div");
      this.dom.setAttribute("class", "notex");
      this.color = "red";
      this.shadow.appendChild(style);
      this.shadow.append(this.dom);
      this.setLabel("");
    }
     setLabel(s) {
      let color=this.color;
      if (this.mark===undefined) {
          this.mark = document.createElement("div");
          this.mark.style["display"] = "flex";
          this.mark.style["flex-direction"] = "row";
          this.mark.style["flex-wrap"] = "nowrap";
          let sheet=0;
          let size=ui_base.iconmanager.getTileSize(sheet);
          this.mark.style["width"] = ""+size+"px";
          this.mark.style["height"] = ""+size+"px";
          this.dom.appendChild(this.mark);
          this.ntext = document.createElement("div");
          this.ntext.style["display"] = "inline-flex";
          this.ntext.style["flex-wrap"] = "nowrap";
          this.dom.appendChild(this.ntext);
          ui_base.iconmanager.setCSS(Icons.NOTE_EXCL, this.mark, sheet);
      }
      let mark=this.mark, ntext=this.ntext;
      ntext.innerText = " "+s;
    }
     init() {
      super.init();
      this.setAttribute("class", "notex");
      this.style["display"] = "flex";
      this.style["flex-wrap"] = "nowrap";
      this.style["flex-direction"] = "row";
      this.style["border-radius"] = "7px";
      this.style["padding"] = "2px";
      this.style["color"] = this.getDefault("NoteText").color;
      let clr=css2color(this.color);
      clr = color2css([clr[0], clr[1], clr[2], 0.25]);
      this.style["background-color"] = clr;
      this.setCSS();
    }
    static  define() {
      return {tagname: "note-x"}
    }
  }
  _ESClass.register(Note);
  _es6_module.add_class(Note);
  Note = _es6_module.add_export('Note', Note);
  UIBase.register(Note);
  class ProgBarNote extends Note {
     constructor() {
      super();
      this._percent = 0.0;
      this.barWidth = 100;
      let bar=this.bar = document.createElement("div");
      bar.style["display"] = "flex";
      bar.style["flex-direction"] = "row";
      bar.style["width"] = this.barWidth+"px";
      bar.style["height"] = this.height+"px";
      bar.style["background-color"] = this.getDefault("ProgressBarBG");
      bar.style["border-radius"] = "12px";
      bar.style["align-items"] = "center";
      bar.style["padding"] = bar.style["margin"] = "0px";
      let bar2=this.bar2 = document.createElement("div");
      let w=50.0;
      bar2.style["display"] = "flex";
      bar2.style["flex-direction"] = "row";
      bar2.style["height"] = this.height+"px";
      bar2.style["background-color"] = this.getDefault("ProgressBar");
      bar2.style["border-radius"] = "12px";
      bar2.style["align-items"] = "center";
      bar2.style["padding"] = bar2.style["margin"] = "0px";
      this.bar.appendChild(bar2);
      this.dom.appendChild(this.bar);
    }
     setCSS() {
      super.setCSS();
      let w=~~(this.percent*this.barWidth+0.5);
      this.bar2.style["width"] = w+"px";
    }
    set  percent(val) {
      this._percent = val;
      this.setCSS();
    }
    get  percent() {
      return this._percent;
    }
     init() {
      super.init();
    }
    static  define() {
      return {tagname: "note-progress-x"}
    }
  }
  _ESClass.register(ProgBarNote);
  _es6_module.add_class(ProgBarNote);
  ProgBarNote = _es6_module.add_export('ProgBarNote', ProgBarNote);
  UIBase.register(ProgBarNote);
  class NoteFrame extends ui.RowFrame {
     constructor() {
      super();
      this._h = 20;
    }
     init() {
      super.init();
      this.noMarginsOrPadding();
      noteframes.push(this);
      this.background = this.getDefault("NoteBG");
    }
     setCSS() {
      super.setCSS();
      this.style["width"] = "min-contents";
      this.style["height"] = this._h+"px";
    }
     _ondestroy() {
      if (noteframes.indexOf(this)>=0) {
          noteframes.remove(this);
      }
      super._ondestroy();
    }
     progbarNote(msg, percent, color="rgba(255,0,0,0.2)", timeout=700, id=msg) {
      let note;
      for (let child of this.children) {
          if (child._noteid===id) {
              note = child;
              break;
          }
      }
      let f=(100.0*Math.min(percent, 1.0)).toFixed(1);
      if (note===undefined) {
          note = this.addNote(msg, color, -1, "note-progress-x");
          note._noteid = id;
      }
      note.percent = percent;
      if (percent>=1.0) {
          window.setTimeout(() =>            {
            note.remove();
          }, timeout);
      }
      return note;
    }
     addNote(msg, color="rgba(255,0,0,0.2)", timeout=1200, tagname="note-x") {
      let note=document.createElement(tagname);
      note.color = color;
      note.setLabel(msg);
      note.style["text-align"] = "center";
      note.style["font"] = ui_base.getFont(note, "NoteText");
      note.style["color"] = this.getDefault("NoteText").color;
      this.add(note);
      this.noMarginsOrPadding();
      note.noMarginsOrPadding();
      note.style["height"] = this._h+"px";
      note.height = this._h;
      if (timeout!=-1) {
          window.setTimeout(() =>            {
            note.remove();
          }, timeout);
      }
      return note;
    }
    static  define() {
      return {tagname: "noteframe-x"}
    }
  }
  _ESClass.register(NoteFrame);
  _es6_module.add_class(NoteFrame);
  NoteFrame = _es6_module.add_export('NoteFrame', NoteFrame);
  UIBase.register(NoteFrame);
  function getNoteFrames(screen) {
    let ret=[];
    let rec=(n) =>      {
      if (__instance_of(n, NoteFrame)) {
          ret.push(n);
      }
      if (n.childNodes!==undefined) {
          for (let node of n.childNodes) {
              rec(node);
          }
      }
      if (__instance_of(n, ui_base.UIBase)&&n.shadow!==undefined&&n.shadow.childNodes) {
          for (let node of n.shadow.childNodes) {
              rec(node);
          }
      }
    }
    rec(screen);
    return ret;
  }
  getNoteFrames = _es6_module.add_export('getNoteFrames', getNoteFrames);
  let noteframes=[];
  noteframes = _es6_module.add_export('noteframes', noteframes);
  function progbarNote(screen, msg, percent, color, timeout) {
    noteframes = getNoteFrames(screen);
    for (let frame of noteframes) {
        try {
          frame.progbarNote(msg, percent, color, timeout);
        }
        catch (error) {
            print_stack(error);
            console.log("bad notification frame");
        }
    }
  }
  progbarNote = _es6_module.add_export('progbarNote', progbarNote);
  function sendNote(screen, msg, color, timeout) {
    if (timeout===undefined) {
        timeout = 3000;
    }
    noteframes = getNoteFrames(screen);
    for (let frame of noteframes) {
        try {
          frame.addNote(msg, color, timeout);
        }
        catch (error) {
            print_stack(error);
            console.log("bad notification frame");
        }
    }
  }
  sendNote = _es6_module.add_export('sendNote', sendNote);
  window._sendNote = sendNote;
  function error(screen, msg, timeout) {
    return sendNote(screen, msg, ui_base.color2css([1.0, 0.0, 0.0, 1.0]), timeout);
  }
  error = _es6_module.add_export('error', error);
  function warning(screen, msg, timeout) {
    return sendNote(screen, msg, ui_base.color2css([0.78, 0.78, 0.2, 1.0]), timeout);
  }
  warning = _es6_module.add_export('warning', warning);
  function message(screen, msg, timeout) {
    return sendNote(screen, msg, ui_base.color2css([0.4, 1.0, 0.5, 1.0]), timeout);
  }
  message = _es6_module.add_export('message', message);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_noteframe.js');
