import {SelMask} from 'selectmode';
import {
        has_multires, compose_id, decompose_id,
        MResFlags, MultiResLayer
       } from 'spline_multires';

var PI = Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor,
    ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos,
    asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;

var sqrt = Math.sqrt;

export class SplineQuery {
  constructor(spline) {
    this.spline = spline;
  }
  
  findnearest(editor, mpos, selectmask, limit) {
    if (limit == undefined) limit = 15;
    var dis = 1e18;
    var data = undefined;
    
    //[data, distance, type]
    if (selectmask & SelMask.VERTEX) {
      var ret = this.findnearest_vert(editor, mpos, limit);
      if (ret != undefined && ret[1] < dis) {
        data = ret;
        dis = ret[1];
      }
    }
    
    //[data, distance, type]
    if (selectmask & SelMask.MULTIRES) {
      var ret = this.findnearest_mres(editor, mpos, limit);
      if (ret != undefined && ret[1] < dis) {
        data = ret;
        dis = ret[1];
      }
    }
    
    if (selectmask & SelMask.HANDLE) {
      var ret = this.findnearest_vert(editor, mpos, limit, true);
      if (ret != undefined && ret[1] < dis) {
        data = ret;
        dis = ret[1];
      }
    }    
      
    if (selectmask & SelMask.SEGMENT) {
      var ret = this.findnearest_segment(editor, mpos, limit);
      
      if (ret != undefined && ret[1] < dis) {
        data = ret;
        dis = ret[1];
      }
    }
    
    if (selectmask & SelMask.FACE) {
      mpos = [mpos[0], mpos[1]];
      
      mpos[0] += editor.abspos[0];
      mpos[1] += editor.abspos[1];
      
      var ret = this.findnearest_face(editor, mpos, limit);
      
      if (ret != undefined && ret[1] < dis) {
        data = ret;
        dis = ret[1];
      }
    }
    
    return data;
  }
  
  findnearest_segment(editor, mpos, limit) {
    var spline = this.spline;
    var actlayer = spline.layerset.active;
    var sret = undefined, mindis=limit;
    
    editor.unproject(mpos);
    
    for (var seg of spline.segments) {
      var ret = seg.closest_point(mpos, undefined, true);
      if (ret == undefined) continue;
      ret = ret[0];

      if (seg.hidden || seg.v1.hidden || seg.v2.hidden) continue;
      if (!seg.in_layer(actlayer)) continue;
      
      var dis = sqrt((ret[0]-mpos[0])*(ret[0]-mpos[0]) + (ret[1]-mpos[1])*(ret[1]-mpos[1]));
      if (dis < mindis) {
        sret = seg;
        mindis = dis;
      }
    }
    
    if (sret != undefined)
      return [sret, mindis, SelMask.SEGMENT];
  }
  
  findnearest_face(editor, mpos, limit) {
    var spline = this.spline;
    var actlayer = spline.layerset.active;
    
    var g = spline.canvas;
    var dis = 0, closest = undefined;
   
    if (g == undefined) return;
    
    for (var i=0; i<spline.faces.length; i++) {
      var f = spline.faces[i];
      if (!f.in_layer(actlayer) || f.hidden) continue;
      
      spline.trace_face(g, f);
      
      if (g.isPointInPath(mpos[0], window.innerHeight-mpos[1])) {
        closest = f;
      }
    }
    
    g.beginPath();
    if (closest != undefined)
      return [closest, dis, SelMask.FACE];
  }
  
  findnearest_mres(editor, mpos, limit, do_handles) {
    var spline = this.spline;
    var actlayer = spline.layerset.active;
    
    static _mpos = new Vector3();
    static _v = new Vector3();
    mpos = _mpos.load(mpos), mpos[2] = 0.0;
    
    if (!has_multires(spline))
      return undefined;
      
    if (limit == undefined) limit = 15;
    var min = 1e17, ret = undefined;
    
    for (var seg of spline.segments) {
      if (seg.hidden || seg.v1.hidden || seg.v2.hidden) continue;
      if (!seg.in_layer(actlayer)) continue;
      
      var mr = seg.cdata.get_layer(MultiResLayer);
      for (var p of mr.points(spline.actlevel)) {
        if (p.flag & MResFlags.HIDE)
          continue;
        
        var seg = spline.eidmap[p.seg];
        var mapco = seg.evaluate(p.s);
  
        _v.load(mapco); _v[2] = 0.0;
        editor.project(_v);
        
        var dis = _v.vectorDistance(mpos);
        if (dis < limit && dis < min) {
          min = dis;
          ret = compose_id(p.seg, p.id);
        }
      }
    }
    
    if (ret != undefined)
      return [ret, min, SelMask.MULTIRES];
  }
  
  findnearest_vert(editor, mpos, limit, do_handles) {
    var spline = this.spline;
    var actlayer = spline.layerset.active;
    
    if (limit == undefined) limit = 15;
    var min = 1e17;
    
    var ret = undefined;
    
    static _mpos = new Vector3();
    static _v = new Vector3();
    mpos = _mpos.load(mpos), mpos[2] = 0.0;
    
    var hasmres = has_multires(spline);
    var list = do_handles ? spline.handles : spline.verts;
    for (var v of list) {
        if (v.hidden) continue;
        if (!v.in_layer(actlayer)) continue;
        
        var co = v;
        if (hasmres && v.segments.length > 0) {
          co = v.segments[0].evaluate(v.segments[0].ends(v));
        }
        
        _v.load(co); _v[2] = 0.0;
        editor.project(_v);
        
        var dis = _v.vectorDistance(mpos);
        if (dis < limit && dis < min) {
          min = dis;
          ret = v;
        }
    }
    
    if (ret != undefined)
      return [ret, min, do_handles ? SelMask.HANDLE : SelMask.VERTEX];
  }
}
