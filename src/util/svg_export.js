"use strict";

import * as math from './mathlib.js';
import {SplineFlags, MaterialFlags, SplineTypes} from '../curve/spline_base.js';

var cubic_rets = cachering.fromConstructor(Vector3, 64);
/*
on factor;
off period;

procedure bez(a, b);
  a + (b - a)*s;
  
quad  := bez(bez(a, b), bez(b, c));
cubic := bez(quad, sub(c=d, b=c, a=b, quad));

on fort;
cubic;
off fort;
*/
function cubic(a, b, c, d, s) {
  var ret = cubic_rets.next();
  
  for (var i=0; i<3; i++) {
    ret[i] = a[i]*s*s*s-3*a[i]*s*s+3*a[i]*s-a[i]-3*b[i]*s*s*s+6*b[i]*s*s-3*b[i]*s
    ret[i] += 3*c[i]*s*s*s-3*c[i]*s*s-d[i]*s*s*s;
    
    ret[i] = -ret[i];
  }
  
  return ret;
}

export function export_svg(spline, visible_only=false) {
  //XXX temporary auto-setter, for testing purposes
  if (spline == undefined) {
    spline = new Context().spline;
  }
  var drawlist = spline.drawlist;
  
  var minmax = new math.MinMax(2);
  for (var v of spline.verts) {
    minmax.minmax(v);
  }
  var min = minmax.min, max = minmax.max;
  
  function transform(co) {
    //co[0] = (co[0] - min[0]) / (max[0] - min[0]);
    //co[1] = 1.0 - (co[1] - min[1]) / (max[1] - min[1]);
    co[1] = (min[1]+max[1]) - co[1];
    return co;
  }
  
  function curve_dist(seg, p, s, ds) {
    var s1 = s-ds, s2 = s + ds;
    var steps = 5;
    var mindis=1e17, mins = 0.0;
    
    for (var i=0; i<steps+1; i++) {
      var segs = s1 + (s2 - s1)*(i/steps);
      
      var co = transform(seg.evaluate(segs));
      var dis = co.vectorDistance(p);
      
      if (dis < mindis) {
        mindis = dis;
        mins = s;
      }
    }
    
    if (mindis == 1e17) {
      return NaN;
    }
    
    return mindis;
  }
  
  function bezerror(seg, a, b, c, d, s1, s2) {
    var steps = 5;
    var s = 0, ds = 1.0 - (steps-1);
    var sum = 0.0;
    
    for (var i=0; i<steps; i++, s += ds) {
      var co1 = cubic(a, b, c, d, s);
      var segs = s1 + (s2 - s1)*s;
      
      //var err = curve_dist(seg, co1, segs, (s2-s1)/steps);
      //this should be symmetric, I think, so transform() is its own inverse?
      co1 = transform(co1);
      var err = seg.closest_point(co1);
      
      if (err != undefined) {
        err = err[0].vectorDistance(co1);
        sum += err;
      }
    }
    
    return sum / steps;
  }
  
  //visualization debug circles
  var circles = [];
  
  function save(seg, s1, s2, depth) {
    depth = depth == undefined ? 0 : depth;
    
    var s3 = (s1+s2)*0.5;
    
    var k = Math.abs(seg.curvature(s3) * (s2-s1));
    var dk = Math.abs(seg.curvature_dv(s3) * (s2-s1));
    var err = k * seg.length;
    
    if (depth < 0 || (depth < 5 && err > 1.0)) {
      save(seg, s1, s3, depth+1);
      save(seg, s3, s2, depth+1);
      
      return;
    }
    
    var ds = s2 - s1;
    
    var df1 = seg.derivative(s1).mulScalar(ds/3.0);
    df1[1] = -df1[1];
    var df2 = seg.derivative(s2).mulScalar(-ds/3.0);
    df2[1] = -df2[1];
    
    var co1 = transform(seg.evaluate(s1)), co2 = transform(seg.evaluate(s2));
    df1.add(co1), df2.add(co2);
    
    buf += " C" + df1[0] + " " + df1[1] + " " + df2[0] + " " + df2[1] + " " + co2[0] + " " + co2[1];
    circles.push([co2[0], co2[1]]);
    
    //var err = bezerror(seg, co1, df1, df2, co2, s1, s2);
    //console.log("error:", err);
    //buf += " L" + co2[0] + " " + co2[1];
    //circles.push([df1[0], df1[1]]);
    //circles.push([df2[0], df2[1]]);
  }
  
  //if all lines have same style, returns style
  //otherwise, return most used style?
  function segstyle(seg) {
    var r = ~~(seg.mat.strokecolor[0]*255);
    var g = ~~(seg.mat.strokecolor[1]*255);
    var b = ~~(seg.mat.strokecolor[2]*255);
    var a = seg.mat.strokecolor[3] * seg.mat.opacity;
    var wid = (seg.flag & SplineFlags.NO_RENDER) ? 0 : seg.mat.linewidth;
    
    var blur = seg.mat.blur;
   
    var ret = "stroke=\"rgb("+r+","+g+","+b+")\" stroke-opacity=\""+a+"\"";
    ret += " stroke-width=\"" + wid + "\""
    
    return ret;
  }
  
  function get_stroke(face) {
    var styles = {};
    var maxstyle=0, retstyle="";
    
    var zi = drawlist.indexOf(face);
    
    for (var list of face.paths) {
      for (var loop of list) {
        if (drawlist.indexOf(loop.s) < zi) {
          continue; //segment is underdrawn
        }
        
        var style = segstyle(loop.s);
        if (!(style in styles)) {
          styles[style] = 1;
        } else {
          styles[style]++;
        }
        
        if (styles[style] > maxstyle) {
          maxstyle = styles[style];
          retstyle = style;
        }
      }
    }
    
    return retstyle;
  }
  
  var buf = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\">\n";
  
  var face_seg_styles = {};
  
  function export_face(face) {
    var r = ~~(face.mat.fillcolor[0]*255);
    var g = ~~(face.mat.fillcolor[1]*255);
    var b = ~~(face.mat.fillcolor[2]*255);
    var a = face.mat.fillcolor[3] * face.mat.opacity;
    var strokestyle = get_stroke(face);
    
    face_seg_styles[face.eid] = strokestyle;
    
    var fill = "rgb("+r+","+g+","+b+")";
    buf += "<path " + strokestyle + " fill=\"" + fill + "\" fill-opacity=\""+a+"\" d=\"";
    
    var i = 0;
    var first = true;
    
    for (var list of face.paths) {
      list.update_winding();
      
      var j = 0;
      var lastdf = new Vector3(), lastco = new Vector3();
      
      for (var loop of list) {
        var seg = loop.s, v = loop.v;
        var dir = seg.v1 === v ? 1 : -1;
        
        var co = transform(seg.evaluate(dir < 0 ? 1 : 0));
        
        if (first)
          buf += (first ? " M" : " L") + co[0] + " " + co[1];
        first = false;
        
        save(seg, dir<0?1:0, dir<0?0:1, 0);
        var co = transform(seg.evaluate(dir < 0 ? 0 : 1));
        //buf += " L" + co[0] + " " + co[1];
        
        continue;
        /*
        var steps = 9, ds = dir / steps;
        var s = dir < 0 ? 1.0 : 0.0;
        
        if (loop.next == list.l) {
          ds = dir / (steps-1);
        }
        
        for (var k=0; k<steps; k++, s += ds) {
          var co = seg.evaluate(s);
          var df2 = seg.derivative(s).mulScalar(ds/3.0);
          df2[1] = -df2[1];
          
          transform(co);
          
          if (j == 0 && k == 0) {
            buf += "M" + co[0] + " " + co[1];
          } else {
            var df1 = lastdf;
            
            buf += " C" + (lastco[0]+df1[0]) + " " + (lastco[1]+df1[1]);
            buf += " " + (co[0]-df2[0]) + " " + (co[1]-df2[1]) + " " + co[0] + " " + co[1];
            
            if (isNaN(co.dot(co)) || isNaN(df2.dot(df2))) {
              console.log(s, ds, k, co, df2, lastco, lastdf);
              throw new Error("NaN!");
            }
            //buf += " L" + co[0] + " " + co[1]; 
          }
          
          circles.push([co[0], co[1]]);
          lastco.load(co);
          lastdf.load(df2);
        }
        
        j++;//*/
      }
      
      i++;
    }
    buf += "\" />\n"
  }
  
  function export_segment(seg) {
    var style = segstyle(seg);
    var skip = seg.flag & SplineFlags.NO_RENDER;
    
    if (!skip && seg.l != undefined) {
      skip = true;
      
      var l = seg.l;
      var zi = drawlist.indexOf(seg);
      
      var _i = 0;
      do {
        if (_i++ > 500) {
          console.trace("infinite loop detected; data corruption?");
          break;
        }
        
        var f = l.f, style2;
        if (!(f.eid in face_seg_styles)) {
          style2 = face_seg_styles[f.eid] = get_stroke(f);
        } else {
          style2 = face_seg_styles[f.eid];
        }
        
        skip = skip && style2 == style && drawlist.indexOf(f) <= zi;
        
        l = l.radial_next;
      } while (l != seg.l);
    }
    
    if (skip) return;
    
    buf += "<path fill=\"none\" " + style + " d=\"";

    var co = transform(seg.evaluate(0));
    buf += "M" + co[0] + " " + co[1];
    save(seg, 0, 1);

    buf += "\" />\n";
  }
  
  for (var item of spline.drawlist) {
    if (item.type == SplineTypes.FACE)
      export_face(item);
    else if (item.type == SplineTypes.SEGMENT)
      export_segment(item);
  }
  
  /*
  for (var i=0; i<circles.length; i++) {
    var co = circles[i];
    buf += "<circle cx=\""+co[0] + "\" cy=\"" + co[1] + "\" fill=\"orange\" r=\"2.5\"/>\n";
  }
  //*/
  
  buf += "</svg>"
  
  //var blob = new Blob([buf], {type : "image/svg+xml"});
  //var url = URL.createObjectURL(blob);
  //window.open(url);
  
  let ret = new Uint8Array(buf.length);
  for (let i=0; i<buf.length; i++) {
    ret[i] = buf.charCodeAt(i);
  }
  
  return ret;
}
