import {KSCALE, KANGLE} from './spline_math.js';
import {SplineTypes, SplineFlags} from './spline_base.js'
var acos = Math.acos, asin = Math.asin, cos = Math.cos, sin=Math.sin, 
    PI=Math.PI, pow = Math.pow, sqrt=Math.sqrt, log=Math.log, abs=Math.abs;

#define TAN_C(seg1, sege2, s1, s2, ret) \
          var ta = seg1.derivative(s1, order), tb = seg2.derivative(s2, order);\
          if (doflip < 0.0)\
            tb.negate();\
          \
          ta.normalize(); tb.normalize();\
          var _d = Math.min(Math.max(ta.dot(tb), -1.0), 1.0);\
          var ret = acos(_d);

#define HARD_TAN_C(seg1, s1, goal, ret) \
          var ta = seg1.derivative(s1, order).normalize();\
          var _d = Math.min(Math.max(ta.dot(goal), -1.0), 1.0);\
          var ret = acos(_d);
    
export function solve(spline : Spline, order : int, steps : int, gk : number, do_inc : boolean, edge_segs : set<SplineSegment>) {
  var pairs = [];
  
  var CBREAK = SplineFlags.BREAK_CURVATURES;
  var TBREAK = SplineFlags.BREAK_TANGENTS;

  function reset_edge_segs() {
    for (var j=0; do_inc && j<edge_segs.length; j++) {
      var seg = edge_segs[j];
      var ks = seg.ks;
      for (var k=0; k<ks.length; k++) {
        ks[k] = seg._last_ks[k];
      }
    }
  }
  
  var eps = 0.0001;
  for (var i=0; i<spline.handles.length; i++) {
    var h = spline.handles[i], seg1 = h.owning_segment, v = h.owning_vertex;

    if (do_inc && !((v.flag) & SplineFlags.UPDATE))
        continue;
    if (!(h.flag & SplineFlags.USE_HANDLES) && v.segments.length <= 2)
      continue;
    
    if (h.hpair != undefined && (h.flag & SplineFlags.AUTO_PAIRED_HANDLE)) {
      var seg2 = h.hpair.owning_segment;
      
      var s1 = v === seg1.v1 ? eps : 1.0 - eps, s2 = v == seg2.v1 ? eps : 1.0 - eps;
      
      var thresh = 5;
      if (seg1.v1.vectorDistance(seg1.v2) < thresh || seg2.v1.vectorDistance(seg2.v2) < thresh)
        continue;
        
      //smallest distance ratio between both segments
      var d1 = seg1.v1.vectorDistance(seg1.v2);
      var d2 = seg2.v1.vectorDistance(seg2.v2);
      var ratio = Math.min(d1/d2, d2/d1);
      
      //console.log("ratio", ratio.toFixed(4));
      if (isNaN(ratio)) ratio = 0.0;
      
      pairs.push(v);
      pairs.push(seg1);
      pairs.push(seg2);
      
      pairs.push(s1);
      pairs.push(s2);
      pairs.push((s1 < 0.5) == (s2 < 0.5) ? -1 : 1); //flip second derivative

      pairs.push(ratio);
    } else if (!(h.flag & SplineFlags.AUTO_PAIRED_HANDLE)) {
      var s1 = v == seg1.v1 ? 0 : 1;
      
      pairs.push(v);
      pairs.push(seg1);
      pairs.push(undefined);
      
      pairs.push(s1);
      pairs.push(0.0);
      pairs.push(1); //flip second derivative

      pairs.push(1);
    }
  }
  
  var PSLEN = 7
  for (var i=0; i<spline.verts.length; i++) {
    var v = spline.verts[i];
    
    if (do_inc && !((v.flag) & SplineFlags.UPDATE))
        continue;

    if (v.segments.length != 2) continue;
    if (v.flag & TBREAK) continue;

    var seg1 = v.segments[0], seg2 = v.segments[1];
    var s1 = v === seg1.v1 ? 0 : 1, s2 = v == seg2.v1 ? 0 : 1;
    
    seg1.evaluate(0.5, order); seg2.evaluate(0.5, order);
    
    var thresh = 5;
    if (seg1.v1.vectorDistance(seg1.v2) < thresh || seg2.v1.vectorDistance(seg2.v2) < thresh)
      continue;
      
    //smallest distance ratio between both segments
    var d1 = seg1.v1.vectorDistance(seg1.v2);
    var d2 = seg2.v1.vectorDistance(seg2.v2);
    var ratio = Math.min(d1/d2, d2/d1);
    
    //console.log("ratio", ratio.toFixed(4));
    if (isNaN(ratio)) ratio = 0.0;
    
    pairs.push(v);
    pairs.push(seg1);
    pairs.push(seg2);
    
    pairs.push(s1);
    pairs.push(s2);
    pairs.push((s1 == 0.0) == (s2 == 0.0) ? -1 : 1); //flip second derivative

    pairs.push(ratio);
  }
  
  var glist = [];
  for (var i=0; i<pairs.length/PSLEN; i++) {
    glist.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  
  var klist1 = [];
  for (var i=0; i<pairs.length/PSLEN; i++) {
    klist1.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  var klist2 = [];
  for (var i=0; i<pairs.length/PSLEN; i++) {
    klist2.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  }
  
  var gs = new Array(order);
  var df = 0.00003;
  var err = 0.0;
  
  if (pairs.length == 0)
    return;
  
  for (var si=0; si<steps; si++) {
    var i = 0;
    var plen = pairs.length;
    
    if (isNaN(err) || isNaN(plen))
      break;
    
    //console.log(err/plen);
    if (si > 0 && err/plen < 0.1) break;
    
    static tan = new Vector3();
    
    //walk backwards every other frame
    var di = 0;
    if (si%2) {
      di = -PSLEN*2;
      i = plen-PSLEN;
    }
    
    reset_edge_segs();
    
    err = 0.0;
    while (i < plen && i >= 0) {
      var cnum = Math.floor(i / PSLEN);
      
      var v = pairs[i++], seg1 = pairs[i++], seg2 = pairs[i++];
      var s1 = pairs[i++], s2 = pairs[i++], doflip = pairs[i++];
      var ratio = pairs[i++];
      i += di;
      
      for (var ci=0; ci<2; ci++) {
        if (0 && seg2 != undefined && ratio > 0.1 && !(v.flag & CBREAK)) {
          var sz1 = seg1.ks[KSCALE], sz2 = seg2.ks[KSCALE];
          var i1 = s1*(order-1), i2 = s2*(order-1);
          
          var k1 = seg1.ks[i1], k2 = seg2.ks[i2];
          var k = ((k1/sz1) + (k2/sz2*doflip))/2.0;
          
          seg1.ks[i1] = seg1.ks[i1] + (k*sz1 - seg1.ks[i1])*1;//0.5;
          seg2.ks[i2] = seg2.ks[i2] + (k*doflip*sz2 - seg2.ks[i2])*1;//0.5;
        }

        if (seg2 != undefined) {
          TAN_C(seg1, seg2, s1, s2, r);
        } else {
          var h = seg1.handle(v);
          
          tan.load(h).sub(v).normalize();
          if (v == seg1.v2)
            tan.negate();
            
          HARD_TAN_C(seg1, s1, tan, r);
        }
        
        if (r < 0.0001) continue;
        err += r;
        
        var totgs = 0.0;
        var gs = glist[cnum];
        var seglen = (seg2==undefined) ? 1 : 2;
        
        for (var sj=0; sj<seglen; sj++) {
          var seg = sj ? seg2 : seg1;
          
          for (var j=0; j<order; j++) {
            var orig = seg.ks[j];
            seg.ks[j] += df;
            
            if (seg2 != undefined) {
              TAN_C(seg1, seg2, s1, s2, r2);
            } else {
              HARD_TAN_C(seg1, s1, tan, r2);
            }
            
            var g = (r2-r)/df;
            
            gs[sj*order+j] = g; //+ (g-gs[sj*order+j])*(1.0/6.0);
            
            totgs += g*g;
            seg.ks[j] = orig;
          }
        }
        
        if (totgs == 0.0) continue;
        r /= totgs;
        
        var unstable = ratio < 0.1;
        
        for (var sj=0; sj<seglen; sj++) {
          var seg = sj ? seg2 : seg1;
          
          for (var j=0; j<order; j++) {
            var g = gs[sj*order+j];
            
            if (order > 2 && unstable && (j == 0 || j == order-1)) {
              //g *= 0.5;
            }
            /*
            if (j == 0 || j == order-1)
              g *= 0.1;
            //*/
            seg.ks[j] += -r*g*gk;
          }
        }
       
        // /*
        if (seg2 != undefined && ratio > 0.1 && !(v.flag & CBREAK)) {
          var sz1 = seg1.ks[KSCALE], sz2 = seg2.ks[KSCALE];
          var i1 = s1*(order-1), i2 = s2*(order-1);
          
          var k1 = seg1.ks[i1], k2 = seg2.ks[i2];
          var k = ((k1/sz1) + (k2/sz2*doflip))/2.0;
          
          seg1.ks[i1] = seg1.ks[i1] + (k*sz1 - seg1.ks[i1])*1;//0.5;
          seg2.ks[i2] = seg2.ks[i2] + (k*doflip*sz2 - seg2.ks[i2])*1;//0.5;
        }
        //*/
      }
    }
    
    for (var j=0; j<edge_segs.length; j++) {
      var seg = edge_segs[j];
      var ks = seg.ks;
      
      for (var k=0; k<ks.length; k++) {
        seg.ks[k] = seg._last_ks[k];
      }
    }
  }
  
  //console.log("err", err.toFixed(3));
}
