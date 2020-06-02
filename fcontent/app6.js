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
es6_module_define('vectordraw_canvas2d', ["../config/config.js", "../path.ux/scripts/util/util.js", "../path.ux/scripts/util/math.js", "./vectordraw_jobs_base.js", "./vectordraw_jobs.js", "../util/mathlib.js", "./vectordraw_base.js"], function _vectordraw_canvas2d_module(_es6_module) {
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
      vectordraw_jobs.manager.postRenderJob(renderid, commands).then((data) =>        {
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
      if (g._drawImage!=undefined) {
          g.save();
          g._scale(scale, scale);
          g._translate(offx, offy);
          g._translate(this._image_off[0], this._image_off[1]);
          g._drawImage(this._image, 0, 0);
          g.restore();
      }
      else {
        g.save();
        g.scale(scale, scale);
        g.translate(this._image_off[0], this._image_off[1]);
        g.translate(offx, offy);
        g.drawImage(this._image, 0, 0);
        g.restore();
      }
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
          this.commands.push(arguments[i]);
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
      if (g._drawImage!=undefined) {
          g._drawImage(this._image, this._image_off[0]+offx, this._image_off[1]+offy);
          g.beginPath();
          g._rect(this._image_off[0]+offx, this._image_off[1]+offy, this._image.width, this._image.height);
          g.rect(this._image_off[0]+offx, this._image_off[1]+offy, this._image.width, this._image.height);
          g.fillStyle = "rgba(0,255,0,0.4)";
          g.fill();
      }
      else {
        g.drawImage(this._image, this._image_off[0]+offx, this._image_off[1]+offy);
        g.beginPath();
        g.rect(this._image_off[0]+offx, this._image_off[1]+offy, this._image.width, this._image.height);
        g.fillStyle = "rgba(0,255,255,0.4)";
        g.fill();
      }
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
     getHead() {
      if (this.drawlist.length>0) {
          return this.drawlist[this.drawlist.length-1];
      }
      return this.requestBatch();
    }
     requestBatch() {
      let ret;
      if (this.cur<this.length) {
          this.drawlist.push(this[this.cur]);
          ret = this[this.cur++];
      }
      else {
        this.cur++;
        this.push(new Batch());
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
     draw(g) {
      if (!!this.do_blur!==this._last_do_blur) {
          this._last_do_blur = !!this.do_blur;
          this.regen = 1;
          window.setTimeout(() =>            {
            window.redraw_viewport();
          }, 200);
      }
      if (this.regen) {
          this.__regen = 0;
          this.batches.destroy();
          this.update();
      }
      let batch;
      let blimit=this.paths.length<15 ? 15 : Math.ceil(this.paths.length/vectordraw_jobs.manager.max_threads);
      batch = this.batches.getHead();
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
          batch = this.batches.requestBatch();
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
                      batch = this.batches.requestBatch();
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
                  batch = this.batches.requestBatch();
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
es6_module_define('vectordraw_canvas2d_simple', ["../config/config.js", "./vectordraw_base.js", "../util/mathlib.js"], function _vectordraw_canvas2d_simple_module(_es6_module) {
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
es6_module_define('vectordraw_jobs', ["../path.ux/scripts/util/simple_events.js", "../../platforms/platform.js", "../core/eventmanager.js", "../config/config.js", "./vectordraw_jobs_base.js"], function _vectordraw_jobs_module(_es6_module) {
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
      if (!this.manager.drawing&&freeze_while_drawing) {
          this.manager.startDrawing();
      }
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
          if (this.freezelvl==0) {
              this.manager.on_thread_done(this);
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
        if (this.drawing&&time_ms()-this.start_time>250) {
            console.log("Draw timed out; aborting draw freeze");
            this.endDrawing();
        }
        return ;
      }, 150);
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
          if (!this._modalstate) {
              this._modalstate = pushModalLight({on_keydown: (e) =>                  {
                  if (e.keyCode===keymap["Escape"]) {
                      popModalLight(this._modalstate);
                      this._modalstate = undefined;
                  }
                }});
          }
      }
    }
     endDrawing() {
      this.drawing = false;
      if (freeze_while_drawing) {
          if (this._modalstate) {
              popModalLight(this._modalstate);
              this._modalstate = undefined;
          }
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
      let thread;
      if (this.threads.length==0) {
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
es6_module_define('vectordraw', ["./vectordraw_base.js", "./vectordraw_canvas2d_simple.js", "./vectordraw_svg.js", "./vectordraw_stub.js", "./vectordraw_canvas2d.js"], function _vectordraw_module(_es6_module) {
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
es6_module_define('spline_draw_new', ["../vectordraw/vectordraw_jobs.js", "../config/config.js", "../editors/viewport/view2d_editor.js", "../core/animdata.js", "./spline_element_array.js", "../vectordraw/vectordraw.js", "../editors/viewport/selectmode.js", "./spline_multires.js", "./spline_types.js", "./spline_math.js", "../util/mathlib.js"], function _spline_draw_new_module(_es6_module) {
  "use strict";
  var aabb_isect_minmax2d=es6_import_item(_es6_module, '../util/mathlib.js', 'aabb_isect_minmax2d');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var ENABLE_MULTIRES=es6_import_item(_es6_module, '../config/config.js', 'ENABLE_MULTIRES');
  var config=es6_import(_es6_module, '../config/config.js');
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
  class SplineDrawer  {
    
    
     constructor(spline, drawer=new Canvas()) {
      this.spline = spline;
      this.used_paths = {};
      this.recalc_all = false;
      this.drawer = drawer;
      this.last_zoom = undefined;
      this.last_3_mat = undefined;
      this.last_stroke_z = undefined;
      this.last_stroke_eid = undefined;
      this.last_layer_id = undefined;
      this.last_stroke_stringid = undefined;
    }
     update(spline, drawlist, drawlist_layerids, matrix, redraw_rects, only_render, selectmode, master_g, zoom, editor, ignore_layers) {
      this.used_paths = {};
      this.drawlist = drawlist;
      this.drawlist_layerids = drawlist_layerids;
      var actlayer=spline.layerset.active;
      var do_blur=!!(only_render||editor.enable_blur);
      var draw_faces=!!(only_render||editor.draw_faces);
      var recalc_all=this.recalc_all||this.draw_faces!==draw_faces||this.do_blur!==do_blur;
      if (recalc_all) {
      }
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
          if (DEBUG.trace_recalc_all) {
              console.trace("%c RECALC_ALL!  ", "color:orange");
          }
      }
      var drawparams=drawparam_cachering.next().init(redraw_rects, actlayer, only_render, selectmode, zoom, undefined, off, spline, drawlist);
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
          if (e.type==SplineTypes.FACE) {
              this.update_polygon(e, redraw_rects, actlayer, only_render, selectmode, zoom, i, off, spline, ignore_layers);
          }
          else 
            if (e.type==SplineTypes.SEGMENT) {
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
     update_stroke(seg, drawparams) {
      var redraw_rects=drawparams.redraw_rects, actlayer=drawparams.actlayer;
      var only_render=drawparams.only_render, selectmode=drawparams.selectmode;
      var zoom=drawparams.zoom, z=drawparams.z, off=drawparams.off, spline=drawparams.spline;
      var drawlist=drawparams.drawlist;
      var eid=seg.eid;
      if (this.has_path(eid, z, eid==seg.eid)&&!(seg.flag&SplineFlags.REDRAW)) {
          return ;
      }
      if (seg.eid==eid) {
          this.last_stroke_mat = seg.mat;
          this.last_stroke_eid = seg.eid;
          this.last_stroke_stringid = seg.stringid;
      }
      seg.flag&=~SplineFlags.REDRAW;
      var l=seg.ks[KSCALE]*zoom;
      let add=(Math.sqrt(l)/5);
      var steps=7+~~add;
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
          } while (l!=seg.l);
          
      }
      if (eid==seg.eid) {
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
      var lw=seg.mat.linewidth*0.5;
      var no=seg.normal(0).normalize().mulScalar(lw);
      var co=seg.evaluate(0).add(no);
      var fx=co[0], fy=co[1];
      var lastdv, lastco;
      var len=seg.length;
      let stretch=1.0;
      s = 0;
      for (var i=0; i<steps; i++, s+=ds) {
          var dv=seg.derivative(s*stretch).normalize();
          var co=seg.evaluate(s*stretch);
          var k=-seg.curvature(s*stretch);
          co[0]+=-dv[1]*lw;
          co[1]+=dv[0]*lw;
          dv[0]*=(1.0-lw*k);
          dv[1]*=(1.0-lw*k);
          dv.mulScalar(len*ds/3.0);
          if (i>0) {
              path.cubicTo(lastco[0]+lastdv[0], lastco[1]+lastdv[1], co[0]-dv[0], co[1]-dv[1], co[0], co[1], 1);
          }
          else {
            path.moveTo(co[0], co[1]);
          }
          lastdv = dv;
          lastco = co;
      }
      s = 1.0;
      lw = -lw;
      for (var i=0; i<steps; i++, s-=ds) {
          var dv=seg.derivative(s*stretch).normalize();
          var co=seg.evaluate(s*stretch);
          var k=-seg.curvature(s*stretch);
          co[0]+=-dv[1]*lw;
          co[1]+=dv[0]*lw;
          dv[0]*=-(1.0-lw*k);
          dv[1]*=-(1.0-lw*k);
          dv.mulScalar(len*ds/3.0);
          if (i>0) {
              path.cubicTo(lastco[0]+lastdv[0], lastco[1]+lastdv[1], co[0]-dv[0], co[1]-dv[1], co[0], co[1], 1);
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
      if (layer!=undefined&&(layer.flag&SplineLayerFlags.MASK)) {
          var li=spline.layerset.indexOf(layer);
          if (li<=0) {
              console.trace("Error in update_seg", layer, spline);
              return path;
          }
          var prev=spline.layerset[li-1];
          var i=drawparams.z;
          var layerid=layer.id;
          while (i>0&&layerid!=prev.id) {
            i--;
            for (var k in drawlist[i].layers) {
                layerid = k;
                if (layerid==prev.id)
                  break;
            }
          }
          while (i>=0&&layerid==prev.id) {
            var item=drawlist[i];
            if (item.type==SplineTypes.FACE) {
                var path2=this.get_path(item.eid, i);
                path.add_clip_path(path2);
            }
            i--;
            if (i<0)
              break;
            for (var k in drawlist[i].layers) {
                layerid = k;
                if (layerid==prev.id)
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
      path.color.load(f.mat.fillcolor);
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
      this.drawer.draw(g);
      return ;
    }
  }
  _ESClass.register(SplineDrawer);
  _es6_module.add_class(SplineDrawer);
  SplineDrawer = _es6_module.add_export('SplineDrawer', SplineDrawer);
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
es6_module_define('scene', ["../core/struct.js", "../curve/spline_base.js", "../core/lib_api.js", "../editors/viewport/selectmode.js", "../editors/viewport/toolmodes/toolmode.js", "../core/frameset.js", "./sceneobject.js", "../core/eventdag.js"], function _scene_module(_es6_module) {
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
      this.time = time;
      ctx.frameset.change_time(time, _update_animation);
      ctx.api.onFrameChange(ctx, time);
      this.dag_update("on_time_change", true);
      window.redraw_viewport();
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
es6_module_define('MenuBar', ["../../path.ux/scripts/widgets/ui_widgets.js", "../../core/startup/startup_file.js", "../../path.ux/scripts/core/ui_base.js", "../../../platforms/platform.js", "../../path.ux/scripts/screen/ScreenArea.js", "../../path.ux/scripts/platforms/electron/electron_api.js", "../editor_base.js", "../../core/struct.js", "../../path.ux/scripts/widgets/ui_menu.js"], function _MenuBar_module(_es6_module) {
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
      let tilesize=iconmanager.getTileSize(1);
      let h=Math.max(this.getDefault("TitleText").size, tilesize)+5;
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
    static  getHeight() {
      return ~~(UIBase.getDPI()*19);
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
es6_module_define('toolprops', ["./toolprops_iter.js", "../path.ux/scripts/util/struct.js", "./struct.js", "../path.ux/scripts/toolsys/toolprop.js", "./ajax.js"], function _toolprops_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  var nstructjs=es6_import(_es6_module, '../path.ux/scripts/util/struct.js');
  var pack_int=es6_import_item(_es6_module, './ajax.js', 'pack_int');
  var pack_float=es6_import_item(_es6_module, './ajax.js', 'pack_float');
  var pack_static_string=es6_import_item(_es6_module, './ajax.js', 'pack_static_string');
  var setPropTypes=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'setPropTypes');
  var ToolProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'ToolProperty');
  var FlagProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'FlagProperty');
  var toolprop=es6_import(_es6_module, '../path.ux/scripts/toolsys/toolprop.js');
  let _ex_StringProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'StringProperty');
  _es6_module.add_export('StringProperty', _ex_StringProperty, true);
  let _ex_StringSetProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'StringSetProperty');
  _es6_module.add_export('StringSetProperty', _ex_StringSetProperty, true);
  let _ex_Vec2Property=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'Vec2Property');
  _es6_module.add_export('Vec2Property', _ex_Vec2Property, true);
  let _ex_Vec3Property=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'Vec3Property');
  _es6_module.add_export('Vec3Property', _ex_Vec3Property, true);
  let _ex_Vec4Property=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'Vec4Property');
  _es6_module.add_export('Vec4Property', _ex_Vec4Property, true);
  let _ex_Mat4Property=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'Mat4Property');
  _es6_module.add_export('Mat4Property', _ex_Mat4Property, true);
  let _ex_IntProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'IntProperty');
  _es6_module.add_export('IntProperty', _ex_IntProperty, true);
  let _ex_FloatProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'FloatProperty');
  _es6_module.add_export('FloatProperty', _ex_FloatProperty, true);
  let _ex_BoolProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'BoolProperty');
  _es6_module.add_export('BoolProperty', _ex_BoolProperty, true);
  let _ex_FlagProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'FlagProperty');
  _es6_module.add_export('FlagProperty', _ex_FlagProperty, true);
  let _ex_EnumProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'EnumProperty');
  _es6_module.add_export('EnumProperty', _ex_EnumProperty, true);
  let _ex_ListProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'ListProperty');
  _es6_module.add_export('ListProperty', _ex_ListProperty, true);
  let _ex_PropClasses=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'PropClasses');
  _es6_module.add_export('PropClasses', _ex_PropClasses, true);
  let _ex_ToolProperty=es6_import_item(_es6_module, '../path.ux/scripts/toolsys/toolprop.js', 'ToolProperty');
  _es6_module.add_export('ToolProperty', _ex_ToolProperty, true);
  var PropTypes={INT: 1, 
   STRING: 2, 
   BOOL: 4, 
   ENUM: 8, 
   FLAG: 16, 
   FLOAT: 32, 
   VEC2: 64, 
   VEC3: 128, 
   VEC4: 256, 
   MATRIX4: 512, 
   QUAT: 1024, 
   PROPLIST: 4096, 
   STRSET: 1<<13, 
   CURVE: 1<<14, 
   STRUCT: 1<<19, 
   DATAREF: 1<<20, 
   DATAREFLIST: 1<<21, 
   TRANSFORM: 1<<22, 
   COLLECTION: 1<<23, 
   IMAGE: 1<<24, 
   ARRAYBUFFER: 1<<25, 
   ITER: 1<<28, 
   INTARRAY: 1<<29}
  PropTypes = _es6_module.add_export('PropTypes', PropTypes);
  setPropTypes(PropTypes);
  var TPropFlags={PRIVATE: 2, 
   LABEL: 4, 
   COLL_LOOSE_TYPE: 8, 
   USE_UNDO: 16, 
   UNDO_SIMPLE: 32, 
   USE_ICONS: 64, 
   USE_CUSTOM_GETSET: 128, 
   NEEDS_OWNING_OBJECT: 256}
  TPropFlags = _es6_module.add_export('TPropFlags', TPropFlags);
  const PropSubTypes={COLOR: 1}
  _es6_module.add_export('PropSubTypes', PropSubTypes);
  ToolProperty.prototype.set_data = function (d) {
    console.warn("deprectaed ToolProperty.prototype.set_data called!");
    return this.setValue(d);
  }
  ToolProperty.prototype.get_data = function (d) {
    console.warn("deprectaed ToolProperty.prototype.get_data called!");
    return this.getValue();
  }
  ToolProperty.prototype.get_value = function (d) {
    console.warn("deprectaed ToolProperty.prototype.get_value called!");
    return this.getValue();
  }
  ToolProperty.prototype.report = function () {
    let s="";
    for (let a of arguments) {
        s+=a+" ";
    }
    if (typeof g_app_state==="undefined"||!g_app_state.notes) {
        console.warn(...arguments);
        return ;
    }
    g_app_state.notes.label(s);
  }
  ToolProperty.prototype._fire = function () {
    if (this.update) {
        this.update(this.dataref);
    }
    if (this.api_update) {
        this.api_update(this.dataref);
    }
  }
  ToolProperty.prototype.load_ui_data = function (prop) {
    this.uiname = prop.uiname;
    this.apiname = prop.apiname;
    this.description = prop.description;
    this.unit = prop.unit;
    this.hotkey_ref = prop.hotkey_ref;
    this.range = prop.range;
    this.uiRange = prop.uiRange;
    this.icon = prop.icon;
    this.radix = prop.radix;
    this.decimalPlaces = prop.declarations;
    this.step = prop.step;
    this.stepIsRelative = prop.stepIsRelative;
    this.expRate = prop.expRate;
  }
  ToolProperty.prototype._exec_listeners = function (data_api_owner) {
    for (var l of this.callbacks) {
        if (RELEASE) {
            try {
              l[1](l[0], this, data_api_owner);
            }
            catch (_err) {
                print_stack(_err);
                console.log("Warning: a property event listener failed", "property:", this, "callback:", l[1], "owner:", l[0]);
            }
        }
        else {
          l[1](l[0], this, data_api_owner);
        }
    }
  }
  ToolProperty.prototype.add_listener = function add_listener(owner, callback) {
    let cb=() =>      {
      callback(...arguments);
    }
    for (let cb of this.callbacks['change']) {
        if (cb.owner===owner) {
            console.warn("owner already added a callback");
            return ;
        }
    }
    this.on('change', cb);
    cb.owner = owner;
  }
  ToolProperty.prototype.remove_listener = function (owner, silent_fail) {
    if (silent_fail===undefined) {
        silent_fail = false;
    }
    for (let cb of this.callbacks['change']) {
        if (cb.owner===owner) {
            this.off('change', cb);
        }
    }
  }
  FlagProperty.prototype.addIcons = function (iconmap) {
    this.iconmap = {}
    for (let k in iconmap) {
        this.iconmap[k] = iconmap[k];
        if (k in this.values) {
            this.iconmap[this.values[k]] = iconmap[k];
        }
    }
  }
  ToolProperty.prototype.add_icons = function (iconmap) {
    return this.addIcons(iconmap);
  }
  ToolProperty.prototype.userSetData = function (prop, val) {
    return val;
  }
  ToolProperty.prototype.userGetData = function (prop, val) {
    return val;
  }
  let _copyTo=ToolProperty.prototype.copyTo;
  ToolProperty.prototype.copyTo = function (b) {
    _copyTo.call(this, b);
    b.userSetData = this.userSetData;
    b.userGetData = this.userGetData;
    return this;
  }
  ToolProperty.prototype.update = () =>    {  }
  ToolProperty.prototype.api_update = () =>    {  }
  for (let i=0; i<2; i++) {
      let key=i ? "FlagProperty" : "EnumProperty";
      toolprop[key].prototype.setUINames = function (uinames) {
        this.ui_value_names = {}
        this.ui_key_names = {}
        for (let k in this.keys) {
            let key=k[0].toUpperCase()+k.slice(1, k.length).toLowerCase();
            key = key.replace(/_/g, " ").replace(/-/g, " ");
            this.ui_value_names[key] = k;
            this.ui_key_names[k] = key;
        }
      };
      Object.defineProperty(toolprop[key].prototype, "ui_key_names", {get: function get() {
          if (!Object.hasOwnProperty(this, "_ui_key_names")) {
              this._ui_key_names = {};
              for (let k in this.ui_value_names) {
                  this._ui_key_names[this.ui_value_names[k]] = k;
              }
          }
          return this._ui_key_names;
        }, 
     set: function set(val) {
          this._ui_key_names = val;
        }});
  }
  function isTypedArray(n) {
    if (!n||typeof n!=="object") {
        return false;
    }
    return (__instance_of(n, Int8Array)||__instance_of(n, Uint8Array)||__instance_of(n, Uint8ClampedArray)||__instance_of(n, Int16Array)||__instance_of(n, Uint16Array)||__instance_of(n, Int32Array)||__instance_of(n, Uint32Array)||__instance_of(n, Float32Array)||__instance_of(n, Float64Array));
  }
  class ArrayBufferProperty extends ToolProperty {
     constructor(data, apiname="", uiname=apiname, description="", flag=0) {
      super(PropTypes.ARRAYBUFFER, apiname, uiname, description, flag);
      if (data!==undefined) {
          this.setValue(data);
      }
    }
     setValue(d) {
      if (d.constructor.name==="ArrayBuffer") {
          d = new Uint8Array(d, 0, d.byteLength);
      }
      else 
        if (isTypedArray(d)) {
          d = d.buffer;
          d = new Uint8Array(d, 0, d.byteLength);
      }
      else 
        if (Array.isArray(d)) {
          d = new Uint8Array(d);
      }
      this.data = d;
    }
     getValue() {
      return this.data;
    }
     copyTo(dst) {
      super.copyTo(dst, false);
      if (this.data!=undefined)
        dst.setValue(this.data);
      return dst;
    }
     copy() {
      return this.copyTo(new ArrayBufferProperty());
    }
     _getDataU8() {
      return __instance_of(this.data, ArrayBuffer) ? new Uint8Array(this.data) : this.data;
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.data = new Uint8Array(this.data).buffer;
    }
  }
  _ESClass.register(ArrayBufferProperty);
  _es6_module.add_class(ArrayBufferProperty);
  ArrayBufferProperty = _es6_module.add_export('ArrayBufferProperty', ArrayBufferProperty);
  ArrayBufferProperty.STRUCT = nstructjs.inherit(ArrayBufferProperty, ToolProperty)+`
  data : array(byte) | this._getDataU8;
}`;
  nstructjs.register(ArrayBufferProperty);
  ToolProperty.register(ArrayBufferProperty);
  class IntArrayProperty extends ToolProperty {
     constructor(data, apiname, uiname, description, flag) {
      super(PropTypes.INTARRAY, undefined, apiname, uiname, description, flag);
      this.data = [];
      if (data) {
          for (let item of data) {
              this.data.push(item);
          }
      }
    }
     [Symbol.iterator]() {
      return this.data[Symbol.iterator]();
    }
     getValue() {
      return this.data;
    }
     setValue(array) {
      let data=this.data;
      super.setValue(array);
      this.data = data;
      this.data.length = 0;
      for (let item of array) {
          let old=item;
          item = ~~item;
          if (isNaN(item)) {
              console.warn("NaN warning! bad item", old, "!");
              continue;
          }
          this.data.push(item);
      }
      return this;
    }
     copyTo(b) {
      super.copyTo(b);
      b.data = this.data.concat([]);
    }
     copy() {
      let ret=new IntArrayProperty();
      this.copyTo(ret);
      return ret;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(IntArrayProperty);
  _es6_module.add_class(IntArrayProperty);
  IntArrayProperty = _es6_module.add_export('IntArrayProperty', IntArrayProperty);
  IntArrayProperty.STRUCT = nstructjs.inherit(IntArrayProperty, ToolProperty)+`
  data : array(int);
}`;
  class DataRefProperty extends ToolProperty {
    
     constructor(value, allowed_types, apiname, uiname, description, flag) {
      super(PropTypes.DATAREF, apiname, uiname, description, flag);
      if (allowed_types==undefined)
        allowed_types = new set();
      if (!(__instance_of(allowed_types, set))) {
          if (__instance_of(allowed_types, Array))
            allowed_types = new set(allowed_types);
          else 
            allowed_types = new set([allowed_types]);
      }
      this.types = new set();
      for (var val of allowed_types) {
          if (typeof val=="object") {
              val = new val().lib_type;
          }
          this.types.add(val);
      }
      if (value!=undefined)
        this.setValue(value);
    }
     get_block(ctx) {
      if (this.data==undefined)
        return undefined;
      else 
        return ctx.datalib.get(this.data);
    }
     copyTo(dst) {
      super.copyTo(dst, false);
      var data=this.data;
      if (data!=undefined)
        data = data.copy();
      dst.types = new set(this.types);
      if (data!=undefined)
        dst.setValue(data);
      return dst;
    }
     copy() {
      return this.copyTo(new DataRefProperty());
    }
     set_data(value, owner, changed, set_data) {
      if (value==undefined) {
          ToolProperty.prototype.setValue.call(this, undefined, owner, changed, set_data);
      }
      else 
        if (!(__instance_of(value, DataRef))) {
          if (!this.types.has(value.lib_type)) {
              console.trace("Invalid datablock type "+value.lib_type+" passed to DataRefProperty.set_value()");
              return ;
          }
          value = new DataRef(value);
          ToolProperty.prototype.setValue.call(this, value, owner, changed, set_data);
      }
      else {
        ToolProperty.prototype.setValue.call(this, value, owner, changed, set_data);
      }
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.types = new set(this.types);
      if (this.data!==undefined&&this.data.id<0)
        this.data = undefined;
      this.setValue(this.data);
    }
  }
  _ESClass.register(DataRefProperty);
  _es6_module.add_class(DataRefProperty);
  DataRefProperty = _es6_module.add_export('DataRefProperty', DataRefProperty);
  DataRefProperty.STRUCT = STRUCT.inherit(DataRefProperty, ToolProperty)+`
  data  : DataRef | this.data == undefined ? new DataRef(-1) : this.data;
  types : iter(int);
}`;
  
  nstructjs.register(DataRefProperty);
  ToolProperty.register(DataRefProperty);
  class RefListProperty extends ToolProperty {
     constructor(value, allowed_types, apiname, uiname, description, flag) {
      super(PropTypes.DATAREFLIST, apiname, uiname, description, flag);
      if (allowed_types===undefined)
        allowed_types = [];
      if (!(__instance_of(allowed_types, set))) {
          allowed_types = new set([allowed_types]);
      }
      this.types = allowed_types;
      if (value!==undefined) {
          this.setValue(value);
      }
    }
     copyTo(dst) {
      ToolProperty.prototype.copyTo.call(this, dst, false);
      dst.types = new set(this.types);
      if (this.data!=undefined)
        dst.setValue(this.data);
      return dst;
    }
     copy() {
      return this.copyTo(new RefListProperty());
    }
     set_data(value, owner, changed, set_data) {
      if (value!=undefined&&value.constructor.name=="Array")
        value = new GArray(value);
      if (value==undefined) {
          ToolProperty.prototype.setValue.call(this, undefined, owner, changed, set_data);
      }
      else {
        var lst=new DataRefList();
        for (var i=0; i<value.length; i++) {
            var block=value[i];
            if (block==undefined||!this.types.has(block.lib_type)) {
                console.trace();
                if (block==undefined)
                  console.log("Undefined datablock in list passed to RefListProperty.setValue");
                else 
                  console.log("Invalid datablock type "+block.lib_type+" passed to RefListProperty.set_value()");
                continue;
            }
            lst.push(block);
        }
        value = lst;
        super.setValue(this, value, owner, changed, set_data);
      }
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.types = new set(this.types);
      this.setValue(this.data);
    }
  }
  _ESClass.register(RefListProperty);
  _es6_module.add_class(RefListProperty);
  RefListProperty = _es6_module.add_export('RefListProperty', RefListProperty);
  RefListProperty.STRUCT = nstructjs.inherit(RefListProperty, ToolProperty)+`
  data  : iter(dataref);
  types : iter(int);
}
`;
  nstructjs.register(RefListProperty);
  ToolProperty.register(RefListProperty);
  class TransformProperty extends ToolProperty {
     constructor(value, apiname, uiname, description, flag) {
      super(PropTypes.TRANSFORM, apiname, uiname, description, flag);
      if (value!==undefined)
        ToolProperty.prototype.setValue.call(this, new Matrix4UI(value));
    }
     set_data(data, owner, changed, set_data) {
      this.data.load(data);
      ToolProperty.prototype.setValue.call(this, undefined, owner, changed, false);
    }
     copyTo(dst) {
      ToolProperty.prototype.copyTo.call(this, dst, false);
      dst.data = new Matrix4UI(new Matrix4());
      dst.data.load(this.data);
      return dst;
    }
     copy() {
      return this.copyTo(new TransformProperty());
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.data = new Matrix4UI(this.data);
    }
  }
  _ESClass.register(TransformProperty);
  _es6_module.add_class(TransformProperty);
  TransformProperty = _es6_module.add_export('TransformProperty', TransformProperty);
  TransformProperty.STRUCT = STRUCT.inherit(TransformProperty, ToolProperty)+`
  data : mat4;
}`;
  nstructjs.register(TransformProperty);
  ToolProperty.register(TransformProperty);
  var ToolIter=es6_import_item(_es6_module, './toolprops_iter.js', 'ToolIter');
  class type_filter_iter extends ToolIter {
    
     constructor(iter, typefilter, ctx) {
      super(iter);
      this.types = typefilter;
      this.ret = {done: false, 
     value: undefined};
      this.iter = iter;
      this._ctx = ctx;
    }
    set  ctx(ctx) {
      this._ctx = ctx;
      if (this.iter!==undefined)
        this.iter.ctx = ctx;
    }
    get  ctx() {
      return this._ctx;
    }
     reset() {
      this.iter.ctx = this.ctx;
      this.iter.reset();
    }
     next() {
      var ret=this.iter.next();
      var types=this.types;
      var tlen=this.types.length;
      var this2=this;
      function has_type(obj) {
        for (let i=0; i<tlen; i++) {
            if (__instance_of(obj, types[i]))
              return true;
        }
        return false;
      }
      while (!ret.done&&!has_type(ret.value)) {
        ret = this.iter.next();
      }
      this.ret.done = ret.done;
      this.ret.value = ret.value;
      ret = this.ret;
      if (ret.done&&this.iter.reset) {
          this.iter.reset();
      }
      return ret;
    }
  }
  _ESClass.register(type_filter_iter);
  _es6_module.add_class(type_filter_iter);
  type_filter_iter = _es6_module.add_export('type_filter_iter', type_filter_iter);
  class CollectionProperty extends ToolProperty {
     constructor(data, filter_types, apiname, uiname, description, flag) {
      super(PropTypes.COLLECTION, apiname, uiname, description, flag);
      this.flag|=TPropFlags.COLL_LOOSE_TYPE;
      this.types = filter_types;
      this._data = undefined;
      this._ctx = undefined;
      if (data!==undefined) {
          this.setValue(data);
      }
    }
     copyTo(dst) {
      ToolProperty.prototype.copyTo.call(this, dst, false);
      dst.types = this.types;
      this.setValue(this.data);
      return dst;
    }
     copy() {
      var ret=this.copyTo(new CollectionProperty());
      ret.types = this.types;
      ret._ctx = this._ctx;
      if (this._data!==undefined&&this._data.copy!==undefined)
        ret.setValue(this._data.copy());
      return ret;
    }
    get  ctx() {
      return this._ctx;
    }
    set  ctx(data) {
      this._ctx = data;
      if (this._data!==undefined)
        this._data.ctx = data;
    }
     getValue() {
      return this.data;
    }
     set_data(data, owner, changed) {
      this.setValue(data, owner, changed);
    }
     setValue(data, owner, changed) {
      if (data===undefined) {
          this._data = undefined;
          return ;
      }
      if ("__tooliter__" in data&&typeof data.__tooliter__=="function") {
          this.setValue(data.__tooliter__(), owner, changed);
          return ;
      }
      else 
        if (!(this.flag&TPropFlags.COLL_LOOSE_TYPE)&&!(TPropIterable.isTPropIterable(data))) {
          console.trace();
          console.log("ERROR: bad data '", data, "' was passed to CollectionProperty.setValue!");
          throw new Error("ERROR: bad data '", data, "' was passed to CollectionProperty.setValue!");
      }
      this._data = data;
      this._data.ctx = this.ctx;
      ToolProperty.prototype.setValue.call(this, undefined, owner, changed, false);
    }
    set  data(data) {
      this.setValue(data);
    }
    get  data() {
      return this._data;
    }
     [Symbol.iterator]() {
      if (this._data==undefined)
        return {next: function () {
          return {done: true, 
       value: undefined}
        }}
      this._data.ctx = this._ctx;
      if (this.types!=undefined&&this.types.length>0)
        return new type_filter_iter(this.data[Symbol.iterator](), this.types, this._ctx);
      else 
        return this.data[Symbol.iterator]();
    }
    static  fromSTRUCT(reader) {
      var ret=new CollectionProperty();
      reader(ret);
      return ret;
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
    }
  }
  _ESClass.register(CollectionProperty);
  _es6_module.add_class(CollectionProperty);
  CollectionProperty = _es6_module.add_export('CollectionProperty', CollectionProperty);
  CollectionProperty.STRUCT = nstructjs.inherit(CollectionProperty, ToolProperty)+`
  data : abstract(Object) | obj.data == undefined ? new BlankArray() : obj.data;
}`;
  nstructjs.register(CollectionProperty);
  ToolProperty.register(CollectionProperty);
  class BlankArray  {
    static  fromSTRUCT(reader) {
      return undefined;
    }
  }
  _ESClass.register(BlankArray);
  _es6_module.add_class(BlankArray);
  BlankArray = _es6_module.add_export('BlankArray', BlankArray);
  BlankArray.STRUCT = `
  BlankArray {
  length : int | 0;
}`;
  nstructjs.register(BlankArray);
  window.BlankArray = BlankArray;
}, '/dev/fairmotion/src/core/toolprops.js');
es6_module_define('toolprops_iter', ["./struct.js"], function _toolprops_iter_module(_es6_module) {
  "use strict";
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  class TPropIterable  {
     constructor() {

    }
     [Symbol.iterator]() {

    }
     _is_tprop_iterable() {

    }
    static  isTPropIterable(obj) {
      return obj!=undefined&&"_is_tprop_iterable" in obj;
    }
  }
  _ESClass.register(TPropIterable);
  _es6_module.add_class(TPropIterable);
  TPropIterable = _es6_module.add_export('TPropIterable', TPropIterable);
  window.TPropIterable = TPropIterable;
  class TCanSafeIter  {
     constructor() {

    }
     __tooliter__() {

    }
  }
  _ESClass.register(TCanSafeIter);
  _es6_module.add_class(TCanSafeIter);
  TCanSafeIter = _es6_module.add_export('TCanSafeIter', TCanSafeIter);
  window.TCanSafeIter = TCanSafeIter;
  class ToolIter extends TPropIterable {
    
     constructor(itemtypes=[]) {
      super();
      this.itemtypes = itemtypes;
      this.ctx = undefined;
      this.ret = {done: true, 
     value: undefined};
    }
     next() {

    }
     reset() {

    }
     spawn() {

    }
     _get_block(ref) {
      if (this.ctx!=undefined) {
          if (ref.lib_id==this.ctx.object.lib_id)
            return this.ctx.object;
          else 
            return this.ctx.datalib.get(ref);
      }
    }
     [Symbol.iterator]() {
      return this;
    }
    static  fromSTRUCT(reader) {
      var obj=new ToolIter();
      reader(obj);
      return obj;
    }
  }
  _ESClass.register(ToolIter);
  _es6_module.add_class(ToolIter);
  ToolIter = _es6_module.add_export('ToolIter', ToolIter);
  ToolIter.STRUCT = `
  ToolIter {
  }
`;
  class MSelectIter extends ToolIter {
    
    
     constructor(typemask, mesh) {
      super();
      this.meshref = new DataRef(mesh);
      this.mask = typemask;
      this.mesh = undefined;
      this.init = true;
      this.iter = undefined;
    }
     [Symbol.iterator]() {
      if (this.init) {
          return this;
      }
      else {
        return new MSelectIter(this.mask, this.meshref);
      }
    }
     reset() {
      this.init = true;
      this.mesh = undefined;
      this.iter = undefined;
    }
     next() {
      if (this.init) {
          this.mesh = this._get_block(this.meshref);
          this.init = false;
          this.iter = new selectiter(this.mesh, this.mask);
      }
      var ret=this.iter.next();
      if (ret.done) {
          this.reset();
      }
      return ret;
    }
    static  fromSTRUCT(reader) {
      var ob={};
      reader(ob);
      var ret=new MSelectIter(ob.mask, ob.meshref);
      return ret;
    }
  }
  _ESClass.register(MSelectIter);
  _es6_module.add_class(MSelectIter);
  MSelectIter.STRUCT = STRUCT.inherit(MSelectIter, ToolIter)+`
  meshref  : DataRef;
  mask     : int;
}
`;
  var $map_hILl_fromSTRUCT;
  class element_iter_convert extends ToolIter {
    
     constructor(iter, type) {
      super();
      if (!(__instance_of(iter, TPropIterable))) {
          throw new Error("element_iter_convert requires a 'safe' TPropIterable-derived iterator");
      }
      this.vset = new set();
      this.iter = iter[Symbol.iterator]();
      this.subiter = undefined;
      if (type==MeshTypes.VERT)
        this.type = Vertex;
      else 
        if (type==MeshTypes.EDGE)
        this.type = Edge;
      else 
        if (type==MeshTypes.LOOP)
        this.type = Loop;
      else 
        if (type==MeshTypes.FACE)
        this.type = Face;
    }
     reset() {
      if (this.iter.reset!=undefined)
        this.iter.reset();
      this.vset = new set();
      this.iter.ctx = this.ctx;
    }
     [Symbol.iterator]() {
      return this;
    }
     next() {
      if (this.mesh!=undefined)
        this.iter.mesh = this.mesh;
      var v=this._next();
      if (v.done)
        return v;
      var vset=this.vset;
      while ((!v.done)&&(v.value==undefined||vset.has(v.value))) {
        v = this._next();
      }
      if (!v.done)
        vset.add(v.value);
      return v;
    }
     _next() {
      if (this.subiter==undefined) {
          var next=this.iter.next();
          if (next.done) {
              this.reset();
              return next;
          }
          if (next.value.constructor.name==this.type.name)
            return next;
          this.subiter = next.value.verts[Symbol.iterator]();
      }
      var vset=this.vset;
      var v=this.subiter.next();
      if (v.done) {
          this.subiter = undefined;
          return this._next();
      }
      return v;
    }
    static  fromSTRUCT(reader) {
      var ob={};
      reader(ob);
      var type=$map_hILl_fromSTRUCT[ob.type];
      var ret=new element_iter_convert(ob._iter, type);
    }
  }
  var $map_hILl_fromSTRUCT={Vertex: 1, 
   Edge: 2, 
   Loop: 4, 
   Face: 8}
  _ESClass.register(element_iter_convert);
  _es6_module.add_class(element_iter_convert);
  element_iter_convert.STRUCT = STRUCT.inherit(element_iter_convert, ToolIter)+`
  type  : string | this.type != undefined ? this.type.constructor.name : "";
  _iter : abstract(ToolIter) | obj.iter;
}
`;
}, '/dev/fairmotion/src/core/toolprops_iter.js');
es6_module_define('toolops_api', ["./toolprops.js", "../path.ux/scripts/util/simple_events.js", "./struct.js", "../editors/events.js"], function _toolops_api_module(_es6_module) {
  "use strict";
  var PropTypes=es6_import_item(_es6_module, './toolprops.js', 'PropTypes');
  var TPropFlags=es6_import_item(_es6_module, './toolprops.js', 'TPropFlags');
  var STRUCT=es6_import_item(_es6_module, './struct.js', 'STRUCT');
  var EventHandler=es6_import_item(_es6_module, '../editors/events.js', 'EventHandler');
  var charmap=es6_import_item(_es6_module, '../editors/events.js', 'charmap');
  class ToolDef  {
    
    
    
    
    
    
    
    
    
  }
  _ESClass.register(ToolDef);
  _es6_module.add_class(ToolDef);
  ToolDef = _es6_module.add_export('ToolDef', ToolDef);
  function patchMouseEvent(e, dom) {
    dom = g_app_state.screen;
    let e2={prototype: e}
    let keys=Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e));
    for (let k in e) {
        keys.push(k);
    }
    for (let k of keys) {
        try {
          e2[k] = e[k];
        }
        catch (error) {
            console.log("failed to set property", k);
            continue;
        }
        if (typeof e2[k]=="function") {
            e2[k] = e2[k].bind(e);
        }
    }
    e2.original = e;
    return e2;
  }
  patchMouseEvent = _es6_module.add_export('patchMouseEvent', patchMouseEvent);
  var pushModalLight=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'popModalLight');
  var UndoFlags={IGNORE_UNDO: 2, 
   IS_ROOT_OPERATOR: 4, 
   UNDO_BARRIER: 8, 
   HAS_UNDO_DATA: 16}
  UndoFlags = _es6_module.add_export('UndoFlags', UndoFlags);
  var ToolFlags={HIDE_TITLE_IN_LAST_BUTTONS: 1, 
   USE_PARTIAL_UNDO: 2, 
   USE_DEFAULT_INPUT: 4, 
   USE_REPEAT_FUNCTION: 8, 
   USE_TOOL_CONTEXT: 16}
  ToolFlags = _es6_module.add_export('ToolFlags', ToolFlags);
  var ModalStates={TRANSFORMING: 1, 
   PLAYING: 2}
  ModalStates = _es6_module.add_export('ModalStates', ModalStates);
  var _tool_op_idgen=1;
  class InheritFlag  {
     constructor(val) {
      this.val = val;
    }
  }
  _ESClass.register(InheritFlag);
  _es6_module.add_class(InheritFlag);
  
  class ToolOpAbstract  {
    static  inherit(inputs_or_outputs) {
      return new InheritFlag(inputs_or_outputs);
    }
    static  invokeMultiple(ctx, args) {

    }
    static  _get_slots() {
      var ret=[{}, {}];
      var parent=this.__parent__;
      if (this.tooldef!==undefined&&(parent===undefined||this.tooldef!==parent.tooldef)) {
          var tooldef=this.tooldef();
          for (var k in tooldef) {
              if (k!=="inputs"&&k!=="outputs") {
                  continue;
              }
              var v=tooldef[k];
              if (__instance_of(v, InheritFlag)) {
                  v = v.val===undefined ? {} : v.val;
                  var slots=parent._get_slots();
                  slots = k==="inputs" ? slots[0] : slots[1];
                  v = this._inherit_slots(slots, v);
              }
              ret[k==="inputs" ? 0 : 1] = v;
          }
      }
      else 
        if (this.inputs!==undefined||this.outputs!==undefined) {
          console.trace("Deprecation warning: (second) old form\
                     of toolprop definition detected for", this);
          if (this.inputs!==undefined) {
              ret[0] = this.inputs;
          }
          if (this.outputs!==undefined) {
              ret[1] = this.outputs;
          }
      }
      else {
        console.warn("Deprecation warning: oldest (and evilest) form\
                     of toolprop detected for", this);
      }
      return ret;
    }
     constructor(apiname, uiname, description=undefined, icon=-1) {
      var parent=this.constructor.__parent__;
      var slots=this.constructor._get_slots();
      for (var i=0; i<2; i++) {
          var slots2={};
          if (i==0)
            this.inputs = slots2;
          else 
            this.outputs = slots2;
          for (var k in slots[i]) {
              slots2[k] = slots[i][k].copy();
              slots2[k].apiname = k;
          }
      }
      if (this.constructor.tooldef!==undefined&&(parent===undefined||this.constructor.tooldef!==parent.tooldef)) {
          var tooldef=this.constructor.tooldef();
          for (var k in tooldef) {
              if (k==="inputs"||k==="outputs")
                continue;
              this[k] = tooldef[k];
          }
      }
      else {
        if (this.name===undefined)
          this.name = apiname;
        if (this.uiname===undefined)
          this.uiname = uiname;
        if (this.description===undefined)
          this.description = description===undefined ? "" : description;
        if (this.icon===undefined)
          this.icon = icon;
      }
      this.apistruct = undefined;
      this.op_id = _tool_op_idgen++;
      this.stack_index = -1;
    }
    static  _inherit_slots(old, newslots) {
      if (old===undefined) {
          console.trace("Warning: old was undefined in _inherit_slots()!");
          return newslots;
      }
      for (var k in old) {
          if (!(k in newslots))
            newslots[k] = old[k];
      }
      return newslots;
    }
    static  inherit_inputs(cls, newslots) {
      if (cls.inputs===undefined)
        return newslots;
      return ToolOpAbstract._inherit_slots(cls.inputs, newslots);
    }
    static  invoke(ctx, args) {
      let ret=new this();
      for (let k in args) {
          if (k in ret.inputs) {
              ret.inputs[k].setValue(args[k]);
          }
          else {
            console.warn("Unknown tool argument "+k, ret);
          }
      }
      return ret;
    }
    static  inherit_outputs(cls, newslots) {
      if (cls.outputs===undefined)
        return newslots;
      return ToolOpAbstract._inherit_slots(cls.outputs, newslots);
    }
     get_saved_context() {
      if (this.saved_context===undefined) {
          console.log("warning : invalid saved_context in "+this.constructor.name+".get_saved_context()");
          this.saved_context = new SavedContext(new Context());
      }
      return this.saved_context;
    }
     [Symbol.keystr]() {
      return "TO"+this.op_id;
    }
     exec(tctx) {

    }
     default_inputs(ctx, get_default) {

    }
  }
  _ESClass.register(ToolOpAbstract);
  _es6_module.add_class(ToolOpAbstract);
  ToolOpAbstract = _es6_module.add_export('ToolOpAbstract', ToolOpAbstract);
  ToolOpAbstract.STRUCT = `
  ToolOpAbstract {
      flag    : int;
      saved_context  : SavedContext | obj.get_saved_context();
      inputs  : iterkeys(k, PropPair) | new PropPair(k, obj.inputs[k]);
      outputs : iterkeys(k, PropPair) | new PropPair(k, obj.outputs[k]);
  }
`;
  class PropPair  {
     constructor(key, value) {
      this.key = key;
      this.value = value;
    }
    static  fromSTRUCT(reader) {
      var obj={};
      reader(obj);
      return obj;
    }
  }
  _ESClass.register(PropPair);
  _es6_module.add_class(PropPair);
  PropPair = _es6_module.add_export('PropPair', PropPair);
  window.PropPair = PropPair;
  PropPair.STRUCT = `
  PropPair {
    key   : string;
    value : abstract(ToolProperty);
  }
`;
  let _toolop_tools=undefined;
  class ToolOp extends ToolOpAbstract {
    
    
    
    
    
     constructor(apiname="(undefined)", uiname="(undefined)", description=undefined, icon=-1) {
      super(apiname, uiname, description, icon);
      EventHandler.prototype.EventHandler_init.call(this);
      this.drawlines = new GArray();
      if (this.is_modal===undefined)
        this.is_modal = false;
      this.undoflag = 0;
      this.on_modal_end = undefined;
      this.modal_ctx = null;
      this.flag = 0;
      this.keyhandler = undefined;
      this.parent = undefined;
      this.widgets = [];
      this.modal_running = false;
      this._widget_on_tick = undefined;
    }
     modalEnd() {
      return this.end_modal(...arguments);
    }
     new_drawline(v1, v2, color, line_width) {
      var dl=this.modal_ctx.view2d.make_drawline(v1, v2, undefined, color, line_width);
      this.drawlines.push(dl);
      return dl;
    }
     reset_drawlines(ctx=this.modal_ctx) {
      var view2d=ctx.view2d;
      for (var dl of this.drawlines) {
          view2d.kill_drawline(dl);
      }
      this.drawlines.reset();
    }
    static  create_widgets(manager, ctx) {

    }
    static  reset_widgets(op, ctx) {

    }
     undo_ignore() {
      this.undoflag|=UndoFlags.IGNORE_UNDO;
    }
     on_mousemove() {
      redraw_viewport();
    }
     exec_pre(tctx) {
      for (var k in this.inputs) {
          if (this.inputs[k].type===PropTypes.COLLECTION) {
              this.inputs[k].ctx = tctx;
          }
      }
      for (var k in this.outputs) {
          if (this.outputs[k].type===PropTypes.COLLECTION) {
              this.outputs[k].ctx = tctx;
          }
      }
    }
     cancel_modal(ctx, execUndo) {
      console.log("cancel");
      ctx.toolstack.toolop_cancel(this, execUndo);
      if (this._modal_state) {
          this._end_modal();
      }
      window.redraw_viewport();
    }
     touchCancelable(callback) {
      this._touch_cancelable = true;
      this._touch_cancel_callback = callback;
    }
     modalStart(ctx) {

    }
     start_modal() {
      this.modalStart(ctx);
    }
     _start_modal(ctx) {
      this.modal_running = true;
      let active_area=ctx.active_area;
      let patch=(e) =>        {
        return patchMouseEvent(e);
      };
      let doMouse=(e, key) =>        {
        if (this._touch_cancelable&&e.touches&&e.touches.length>1) {
            this.cancel_modal(this.modal_ctx, true);
            if (this._touch_cancel_callback) {
                this._touch_cancel_callback(e);
            }
            return ;
        }
        e = patchMouseEvent(e);
        return this[key](e);
      };
      let handlers={on_mousedown: (e) =>          {
          return doMouse(e, "on_mousedown");
        }, 
     on_mousemove: (e) =>          {
          return doMouse(e, "on_mousemove");
        }, 
     on_mouseup: (e) =>          {
          return doMouse(e, "on_mouseup");
        }, 
     on_keydown: this.on_keydown.bind(this), 
     on_keyup: this.on_keyup.bind(this), 
     on_mousewheel: (e) =>          {
          return this.on_mousewheel(patchMouseEvent(e));
        }};
      this._modal_state = pushModalLight(handlers);
      this.modal_ctx = ctx;
    }
     on_mousewheel(e) {

    }
     _end_modal() {
      var ctx=this.modal_ctx;
      this.modal_running = false;
      this.saved_context = new SavedContext(this.modal_ctx);
      if (this._modal_state!==undefined) {
          popModalLight(this._modal_state);
          this._modal_state = undefined;
      }
      if (this.on_modal_end!==undefined)
        this.on_modal_end(this);
      this.reset_drawlines(ctx);
    }
     end_modal() {
      this._end_modal();
    }
     can_call(ctx) {
      return true;
    }
     exec(ctx) {

    }
     start_modal(ctx) {

    }
     redo_post(ctx) {
      window.redraw_viewport();
    }
     undo_pre(ctx) {
      this._undocpy = g_app_state.create_undo_file();
      window.redraw_viewport();
    }
     undo(ctx) {
      g_app_state.load_undo_file(this._undocpy);
    }
    static  fromSTRUCT(reader) {
      var op=new ToolOp();
      reader(op);
      var ins={};
      for (var i=0; i<op.inputs.length; i++) {
          ins[op.inputs[i].key] = op.inputs[i].value;
      }
      var outs={};
      for (var i=0; i<op.outputs.length; i++) {
          outs[op.outputs[i].key] = op.outputs[i].value;
      }
      op.inputs = ins;
      op.outputs = outs;
      return op;
    }
    static  get_constructor(name) {
      if (_toolop_tools===undefined) {
          _toolop_tools = {};
          for (let c of defined_classes) {
              if (__instance_of(c, ToolOp))
                _toolop_tools[c.name] = c;
          }
      }
      return _toolop_tools[c];
    }
  }
  _ESClass.register(ToolOp);
  _es6_module.add_class(ToolOp);
  ToolOp = _es6_module.add_export('ToolOp', ToolOp);
  ToolOp.STRUCT = `
  ToolOp {
      flag    : int;
      saved_context  : SavedContext | obj.get_saved_context();
      inputs  : iterkeys(k, PropPair) | new PropPair(k, obj.inputs[k]);
      outputs : iterkeys(k, PropPair) | new PropPair(k, obj.outputs[k]);
  }
`;
  class ToolMacro extends ToolOp {
    
    
    
     constructor(name, uiname, tools) {
      super(name, uiname);
      this.cur_modal = 0;
      this._chained_on_modal_end = false;
      if (tools===undefined)
        this.tools = new GArray();
      else 
        this.tools = new GArray(tools);
    }
     add_tool(tool) {
      tool.parent = this;
      this.tools.push(tool);
      if (tool.is_modal)
        this.is_modal = true;
    }
     connect_tools(output, input) {
      var old_set=input.userSetData;
      input.userSetData = function () {
        this.data = output.data;
        old_set.call(this, this.data);
      };
    }
     undo_pre(ctx) {

    }
     undo(ctx) {
      for (var i=this.tools.length-1; i>=0; i--) {
          if (this.tools[i].undoflag&UndoFlags.HAS_UNDO_DATA) {
              this.tools[i].undo(ctx);
          }
      }
    }
     exec(ctx) {
      for (var i=0; i<this.tools.length; i++) {
          if (!(this.tools[i].flag&ToolFlags.USE_TOOL_CONTEXT)) {
              this.tools[i].saved_context = this.saved_context;
          }
      }
      for (let op of this.tools) {
          if (op.is_modal)
            op.is_modal = this.is_modal;
          let tctx=(op.flag&ToolFlags.USE_TOOL_CONTEXT) ? op.ctx : ctx;
          for (var k in op.inputs) {
              var p=op.inputs[k];
              if (p.userSetData!=undefined)
                p.userSetData.call(p, p.data);
          }
          
          if (!(op.flag&ToolFlags.USE_TOOL_CONTEXT)) {
              op.saved_context = this.saved_context;
          }
          op.undo_pre(tctx);
          op.undoflag|=UndoFlags.HAS_UNDO_DATA;
          op.exec_pre(tctx);
          op.exec(tctx);
      }
    }
     can_call(ctx) {
      return this.tools[0].can_call(ctx);
    }
     _start_modal(ctx) {

    }
     start_modal(ctx) {
      if (!this._chained_on_modal_end) {
          let last_modal=undefined;
          for (let op of this.tools) {
              if (op.is_modal)
                last_modal = op;
          }
          console.log("last_modal", last_modal);
          if (last_modal!==undefined) {
              let on_modal_end=last_modal.on_modal_end;
              let this2=this;
              last_modal.on_modal_end = function (toolop) {
                if (on_modal_end!==undefined)
                  on_modal_end(toolop);
                if (this2.on_modal_end)
                  this2.on_modal_end(this2);
              };
              this._chained_on_modal_end = true;
          }
      }
      for (let i=0; i<this.tools.length; i++) {
          this.tools[i].saved_context = this.saved_context;
      }
      for (let i=0; i<this.tools.length; i++) {
          let op=this.tools[i];
          if (op.is_modal) {
              this.cur_modal = i;
              for (let k in op.inputs) {
                  let p=op.inputs[k];
                  if (p.userSetData!==undefined)
                    p.userSetData.call(p, p.data);
              }
              op.__end_modal = op._end_modal;
              op._end_modal = (ctx) =>                {
                op.__end_modal(ctx);
                this.next_modal(ctx ? ctx : this.modal_ctx);
              };
              op.modal_ctx = this.modal_ctx;
              op.modal_tctx = this.modal_tctx;
              op.saved_context = this.saved_context;
              op.undo_pre(ctx);
              op.undoflag|=UndoFlags.HAS_UNDO_DATA;
              op.modal_running = true;
              op._start_modal(ctx);
              return op.start_modal(ctx);
          }
          else {
            for (let k in op.inputs) {
                let p=op.inputs[k];
                if (p.userSetData!==undefined)
                  p.userSetData(p, p.data);
            }
            op.saved_context = this.saved_context;
            op.exec_pre(ctx);
            op.undo_pre(ctx);
            op.undoflag|=UndoFlags.HAS_UNDO_DATA;
            op.exec(ctx);
          }
      }
    }
     _end_modal() {
      this.next_modal(this.modal_ctx);
    }
     next_modal(ctx) {
      console.log("next_modal called");
      this.cur_modal++;
      while (this.cur_modal<this.tools.length&&!this.tools[this.cur_modal].is_modal) {
        this.cur_modal++;
      }
      if (this.cur_modal>=this.tools.length) {
          super._end_modal();
      }
      else {
        console.log("next_modal op", this.tools[this.cur_modal]);
        this.tools[this.cur_modal].undo_pre(ctx);
        this.tools[this.cur_modal].undoflag|=UndoFlags.HAS_UNDO_DATA;
        this.tools[this.cur_modal]._start_modal(ctx);
        this.tools[this.cur_modal].start_modal(ctx);
      }
    }
     on_mousemove(event) {
      this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
      this.tools[this.cur_modal].on_mousemove(event);
    }
     on_mousewheel(event) {
      this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
      this.tools[this.cur_modal].on_mousewheel(event);
    }
     on_mousedown(event) {
      this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
      this.tools[this.cur_modal].on_mousedown(event);
    }
     on_mouseup(event) {
      this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
      this.tools[this.cur_modal].on_mouseup(event);
    }
     on_keydown(event) {
      this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
      this.tools[this.cur_modal].on_keydown(event);
    }
     on_keyup(event) {
      this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
      this.tools[this.cur_modal].on_keyup(event);
    }
     on_draw(event) {
      this.tools[this.cur_modal].modal_ctx = this.modal_ctx;
      this.tools[this.cur_modal].on_draw(event);
    }
    static  fromSTRUCT(reader) {
      var ret=STRUCT.chain_fromSTRUCT(ToolMacro, reader);
      ret.tools = new GArray(ret.tools);
      for (var t of ret.tools) {
          t.parent = this;
      }
      return ret;
    }
  }
  _ESClass.register(ToolMacro);
  _es6_module.add_class(ToolMacro);
  ToolMacro = _es6_module.add_export('ToolMacro', ToolMacro);
  ToolMacro.STRUCT = STRUCT.inherit(ToolMacro, ToolOp)+`
  tools   : array(abstract(ToolOp));
  apiname : string;
  uiname  : string;
}
`;
  var StringProperty=es6_import_item(_es6_module, './toolprops.js', 'StringProperty');
  var Vec3Property=es6_import_item(_es6_module, './toolprops.js', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, './toolprops.js', 'Vec4Property');
  var IntProperty=es6_import_item(_es6_module, './toolprops.js', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, './toolprops.js', 'FloatProperty');
  var BoolProperty=es6_import_item(_es6_module, './toolprops.js', 'BoolProperty');
  var pushModalLight=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../path.ux/scripts/util/simple_events.js', 'popModalLight');
  class DataPathOp extends ToolOp {
    
    
    
     constructor(path="", use_simple_undo=false) {
      super("DataPathOp", "DataPath", "DataPath Value Set");
      this.use_simple_undo = use_simple_undo;
      this.is_modal = false;
      this.path = path;
      this.inputs = {path: new StringProperty(path, "path", "path", "path"), 
     vec3: new Vec3Property(undefined, "vec3", "vec3", "vec3"), 
     vec4: new Vec4Property(undefined, "vec4", "vec4", "vec4"), 
     pint: new IntProperty(0, "pint", "pint", "pint"), 
     pfloat: new FloatProperty(0, "pfloat", "pfloat", "pfloat"), 
     str: new StringProperty("", "str", "str", "str"), 
     bool: new BoolProperty(false, "bool", "bool", "bool"), 
     val_input: new StringProperty("", "val_input", "val_input", "val_input")};
      this.outputs = {};
      for (var k in this.inputs) {
          this.inputs[k].flag|=TPropFlags.PRIVATE;
      }
    }
     undo_pre(ctx) {
      this._undocpy = g_app_state.create_undo_file();
    }
     undo(ctx) {
      g_app_state.load_undo_file(this._undocpy);
    }
     get_prop_input(path, prop) {
      if (prop==undefined) {
          console.trace("Warning: DataPathOp failed!", path, prop);
          return ;
      }
      var input;
      if (prop.type==PropTypes.INT) {
          input = this.inputs.pint;
      }
      else 
        if (prop.type==PropTypes.FLOAT) {
          input = this.inputs.pfloat;
      }
      else 
        if (prop.type==PropTypes.VEC3) {
          input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec3;
      }
      else 
        if (prop.type==PropTypes.VEC4) {
          input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec4;
      }
      else 
        if (prop.type==PropTypes.BOOL) {
          input = this.inputs.bool;
      }
      else 
        if (prop.type==PropTypes.STR) {
          input = this.inputs.str;
      }
      else 
        if (prop.type==PropTypes.FLAG) {
          input = this.inputs.str;
      }
      else 
        if (prop.type==PropTypes.ENUM) {
          input = this.inputs.pint;
      }
      else {
        console.trace("ERROR: unimplemented prop type "+prop.type+"in DataPathOp", prop, this);
        return undefined;
      }
      return input;
    }
     exec(ctx) {
      var api=g_app_state.api;
      var path=this.inputs.path.data.trim();
      var prop=api.get_prop_meta(ctx, path);
      if (prop==undefined) {
          console.trace("Warning: DataPathOp failed!");
          return ;
      }
      var input=this.get_prop_input(path, prop);
      api.set_prop(ctx, path, input.data);
    }
  }
  _ESClass.register(DataPathOp);
  _es6_module.add_class(DataPathOp);
  mixin(ToolOp, EventHandler);
  class MassSetPathOp extends ToolOp {
    
    
    
     constructor(path="", subpath="", filterstr="", use_simple_undo=false) {
      super("DataPathOp", "DataPath", "DataPath Value Set");
      this.use_simple_undo = use_simple_undo;
      this.is_modal = false;
      this.path = path;
      this.subpath = subpath;
      this.filterstr = filterstr;
      this.inputs = {path: new StringProperty(path, "path", "path", "path"), 
     vec3: new Vec3Property(undefined, "vec3", "vec3", "vec3"), 
     vec4: new Vec4Property(undefined, "vec4", "vec4", "vec4"), 
     pint: new IntProperty(0, "pint", "pint", "pint"), 
     pfloat: new FloatProperty(0, "pfloat", "pfloat", "pfloat"), 
     str: new StringProperty("", "str", "str", "str"), 
     bool: new BoolProperty(false, "bool", "bool", "bool"), 
     val_input: new StringProperty("", "val_input", "val_input", "val_input")};
      this.outputs = {};
      for (var k in this.inputs) {
          this.inputs[k].flag|=TPropFlags.PRIVATE;
      }
    }
     _get_value(ctx) {
      var path=this.path.trim();
      var prop=api.get_prop_meta(ctx, path);
      if (prop==undefined) {
          console.trace("Warning: DataPathOp failed!");
          return ;
      }
      return this.get_prop_input(path, prop);
    }
     undo_pre(ctx) {
      var value=this._get_value(ctx);
      var paths=ctx.api.buildMassSetPaths(ctx, this.path, this.subpath, value, this.filterstr);
      var ud=this._undo = {};
      for (var i=0; i<paths.length; i++) {
          var value2=ctx.api.get_prop(paths[i]);
          ud[paths[i]] = JSON.stringify(value2);
      }
    }
     undo(ctx) {
      var value=this._get_value(ctx);
      var paths=ctx.api.buildMassSetPaths(ctx, this.path, this.subpath, value, this.filterstr);
      var ud=this._undo;
      for (var k in ud) {
          var data=JSON.parse(ud[k]);
          if (data=="undefined")
            data = undefined;
          ctx.api.set_prop(ctx, k, data);
      }
    }
     get_prop_input(path, prop) {
      if (prop==undefined) {
          console.trace("Warning: DataPathOp failed!", path, prop);
          return ;
      }
      var input;
      if (prop.type==PropTypes.INT) {
          input = this.inputs.pint;
      }
      else 
        if (prop.type==PropTypes.FLOAT) {
          input = this.inputs.pfloat;
      }
      else 
        if (prop.type==PropTypes.VEC3) {
          input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec3;
      }
      else 
        if (prop.type==PropTypes.VEC4) {
          input = path.endsWith("]") ? this.inputs.pfloat : this.inputs.vec4;
      }
      else 
        if (prop.type==PropTypes.BOOL) {
          input = this.inputs.bool;
      }
      else 
        if (prop.type==PropTypes.STR) {
          input = this.inputs.str;
      }
      else 
        if (prop.type==PropTypes.FLAG) {
          input = this.inputs.str;
      }
      else 
        if (prop.type==PropTypes.ENUM) {
          input = this.inputs.pint;
      }
      else {
        console.trace("ERROR: unimplemented prop type "+prop.type+"in DataPathOp", prop, this);
        return undefined;
      }
      return input;
    }
     exec(ctx) {
      var api=g_app_state.api;
      var path=this.inputs.path.data.trim();
      var prop=api.get_prop_meta(ctx, path);
      if (prop==undefined) {
          console.trace("Warning: DataPathOp failed!");
          return ;
      }
      var input=this.get_prop_input(path, prop);
      api.mass_set_prop(ctx, path, this.subpath, input.data, this.filterstr);
    }
  }
  _ESClass.register(MassSetPathOp);
  _es6_module.add_class(MassSetPathOp);
  window.init_toolop_structs = function () {
    
    function gen_fromSTRUCT(cls1) {
      function fromSTRUCT(reader) {
        var op=new cls1();
        var inputs=op.inputs, outputs=op.outputs;
        reader(op);
        var ins=Object.create(inputs), outs=Object.create(outputs);
        for (var i=0; i<op.inputs.length; i++) {
            var k=op.inputs[i].key;
            ins[k] = op.inputs[i].value;
            if (k in inputs) {
                ins[k].load_ui_data(inputs[k]);
            }
            else {
              ins[k].uiname = ins[k].apiname = k;
            }
        }
        for (var i=0; i<op.outputs.length; i++) {
            var k=op.outputs[i].key;
            outs[k] = op.outputs[i].value;
            if (k in outputs) {
                outs[k].load_ui_data(outputs[k]);
            }
            else {
              outs[k].uiname = outs[k].apiname = k;
            }
        }
        op.inputs = ins;
        op.outputs = outs;
        return op;
      }
      return fromSTRUCT;
    }
    for (var i=0; i<defined_classes.length; i++) {
        var cls=defined_classes[i];
        var ok=false;
        var is_toolop=false;
        var parent=cls.prototype.__proto__.constructor;
        while (parent) {
          if (parent===ToolOpAbstract) {
              ok = true;
          }
          else 
            if (parent===ToolOp) {
              ok = true;
              is_toolop = true;
              break;
          }
          parent = parent.prototype.__proto__;
          if (!parent)
            break;
          parent = parent.constructor;
          if (!parent||parent===Object)
            break;
        }
        if (!ok)
          continue;
        if (!Object.hasOwnProperty(cls, "STRUCT")) {
            cls.STRUCT = cls.name+" {"+`
        flag    : int;
        inputs  : iterkeys(k, PropPair) | new PropPair(k, obj.inputs[k]);
        outputs : iterkeys(k, PropPair) | new PropPair(k, obj.outputs[k]);
      `;
            if (is_toolop)
              cls.STRUCT+="    saved_context  : SavedContext | obj.get_saved_context();\n";
            cls.STRUCT+="  }";
        }
        if (!cls.fromSTRUCT) {
            cls.fromSTRUCT = gen_fromSTRUCT(cls);
        }
    }
  }
  class WidgetToolOp extends ToolOp {
    static  create_widgets(manager, ctx) {
      var $zaxis_2FE6;
      var widget=manager.create();
      var enabled_axes=this.widget_axes;
      var do_widget_center=this.widget_center;
      var gen_toolop=this.gen_toolop;
      var do_x=enabled_axes[0], do_y=enabled_axes[1], do_z=enabled_axes[2];
      if (do_x)
        widget.arrow([1, 0, 0], 0, [1, 0, 0, 1]);
      if (do_y)
        widget.arrow([0, 1, 0], 1, [0, 1, 0, 1]);
      if (do_z)
        widget.arrow([0, 0, 1], 2, [0, 0, 1, 1]);
      var this2=this;
      function widget_on_tick(widget) {
        var mat=widget.matrix;
        var mesh=ctx.mesh;
        var cent=new Vector3();
        var len=0;
        var v1=new Vector3();
        for (var v of mesh.verts.selected) {
            cent.add(v.co);
            v1.load(v.edges[0].v1.co).sub(v.edges[0].v2.co);
            v1.normalize();
            len++;
        }
        if (len>0)
          cent.mulScalar(1.0/len);
        mat.makeIdentity();
        mat.translate(cent[0], cent[1], cent[2]);
        if (this2.widget_align_normal) {
            var n=new Vector3();
            var tan=new Vector3();
            len = 0;
            var v1=new Vector3();
            for (var f of mesh.faces.selected) {
                var e=f.looplists[0].loop.e;
                len++;
                n.add(f.no);
            }
            n.mulScalar(1.0/len);
            n.normalize();
            if (tan.dot(tan)==0.0) {
                tan.loadXYZ(0, 0, 1);
            }
            else {
              tan.mulScalar(1.0/len);
              tan.normalize();
            }
            var angle=Math.PI-Math.acos($zaxis_2FE6.dot(n));
            if (n.dot($zaxis_2FE6)>0.9) {
            }
            if (1) {
                if (Math.abs(angle)<0.001||Math.abs(angle)>Math.PI-0.001) {
                    n.loadXYZ(1, 0, 0);
                }
                else {
                  n.cross($zaxis_2FE6);
                  n.normalize();
                }
                var q=new Quat();
                q.axisAngleToQuat(n, angle);
                var rmat=q.toMatrix();
                mat.multiply(rmat);
            }
        }
        mat.multiply(ctx.object.matrix);
      }
      widget.on_tick = widget_on_tick;
      widget.on_click = function (widget, id) {
        console.log("widget click: ", id);
        ctx.view2d._mstart = null;
        var toolop=undefined;
        if (gen_toolop!=undefined) {
            var toolop=gen_toolop(id, widget, ctx);
        }
        else {
          console.trace("IMPLEMENT ME! missing widget gen_toolop callback!");
          return ;
        }
        if (toolop==undefined) {
            console.log("Evil! Undefined toolop in WidgetToolOp.create_widgets()!");
            return ;
        }
        widget.user_data = toolop;
        toolop._widget_on_tick = widget_on_tick;
        toolop.widgets.push(widget);
        toolop.on_modal_end = function (toolop) {
          for (var w of toolop.widgets) {
              for (var k in toolop.inputs) {
                  var p=toolop.inputs[k];
                  p.remove_listener(w, true);
              }
              for (var k in toolop.outputs) {
                  var p=toolop.outputs[k];
                  p.remove_listener(w, true);
              }
          }
          console.log("widget modal end");
          toolop.widgets = new GArray();
          widget.on_tick = widget_on_tick;
        }
        if (toolop.widget_on_tick)
          widget.widget_on_tick = toolop.widget_on_tick;
        widget.on_tick = function (widget) {
          toolop.widget_on_tick.call(toolop, widget);
        }
        g_app_state.toolstack.exec_tool(toolop);
      };
      var $zaxis_2FE6=new Vector3([0, 0, -1]);
    }
     widget_on_tick(widget) {
      if (this._widget_on_tick!=undefined)
        this._widget_on_tick(widget);
    }
  }
  _ESClass.register(WidgetToolOp);
  _es6_module.add_class(WidgetToolOp);
}, '/dev/fairmotion/src/core/toolops_api.js');
