import {aabb_isect_minmax2d} from 'mathlib';
import {ENABLE_MULTIRES} from 'config';

import {SessionFlags} from 'view2d_editor';
import {SelMask} from 'selectmode';
import {ORDER, KSCALE, KANGLE, KSTARTX, KSTARTY, KSTARTZ, KTOTKS, INT_STEPS} from 'spline_math';
import {get_vtime} from 'animdata';

import {iterpoints, MultiResLayer, MResFlags, has_multires} from 'spline_multires';

var spline_draw_cache_vs = cachering.fromConstructor(Vector3, 64);
var spline_draw_trans_vs = cachering.fromConstructor(Vector3, 32);

var PI = Math.PI;
var pow = Math.pow, cos = Math.cos, sin = Math.sin, abs = Math.abs, floor = Math.floor,
    ceil = Math.ceil, sqrt = Math.sqrt, log = Math.log, acos = Math.acos, asin = Math.asin;

import {
  SplineFlags, SplineTypes, SplineElement, SplineVertex, 
  SplineSegment, SplineLoop, SplineLoopPath, SplineFace,
  RecalcFlags, MaterialFlags
} from 'spline_types';

import {ElementArray, SplineLayerFlags} from 'spline_element_array';

var uclr = "#ff2211"
var sclr = "#ffaa44"
var hclr = "#ffee66"
var aclr = "#ff9912";

var uclr_h = "#22ff11"
var sclr_h = "#aaffaa"
var hclr_h = "#eeff66"

var clr = "#444444";

export function calc_string_ids(spline, startid=0) {
  var string_idgen = startid;
  
  var tmp = new Array();
  var visit = new set();
  
  for (var seg of spline.segments) {
    seg.stringid = -1;
  }
  
  for (var v of spline.verts) {
    if (v.segments.length != 2) {
      continue;
    }
    
    var v2 = v, startv = v2, seg =  undefined;
    var _i = 0;
    
    for (var j=0; j<v.segments.length; j++) {
      if (!visit.has(v.segments[j].eid)) {
        seg = v.segments[j];
        break;
      }
    }
    
    if (seg == undefined) {
      continue;
    }
    
    do {
      v2 = seg.other_vert(v2);
      if (v2.segments.length != 2) {
        break;
      }
      
      seg = v2.other_segment(seg);
      if (visit.has(seg.eid)) {
        break;
      }
      
      if (_i++ > 1000) {
        console.trace("infinite loop detected!");
        break;
      }
    } while (v2 != startv);
    
    //we've found one end of string, now go through whole string
    var lastseg = undefined;
    startv = v2;
    
    _i = 0;
    do {
      if (lastseg != undefined) {
        var bad = true;
        
        //don't check z, it's implicitly set by owning
        //faces
        
        //are we in the same layer?
        for (var k1 in seg.layers) {
          for (var k2 in lastseg.layers) {
            if (k1 == k2) {
              bad = false;
              break;
            }
          }
          
          if (bad) {
            break;
          }
        }
        
        //do we have the same stroke material?
        bad = bad || !seg.mat.equals(true, lastseg.mat);
        
        if (bad) {
          string_idgen++;
        }
      }
      
      if (visit.has(seg.eid)) {
        break;
      }
      
      seg.stringid = string_idgen;
      visit.add(seg.eid);
      
      v2 = seg.other_vert(v2);
      if (v2.segments.length != 2) {
        break;
      }
      
      lastseg = seg;
      seg = v2.other_segment(seg);
      
      if (_i++ > 1000) {
        console.trace("infinite loop detected!");
        break;
      }
    } while (v2 != startv);      
  }
  
  //deal with orphaned segments
  for (var seg of spline.segments) {
    if (seg.stringid == -1) {
      seg.stringid = string_idgen++;
    }
  }
  
  return string_idgen;
}

export function sort_layer_segments(layer, spline) {
  static lists = new cachering(function() {
    return [];
  }, 2);
  
  var list = lists.next();
  list.length = 0;
  
  var visit = {};
  var layerid = layer.id;
  var topogroup_idgen = 0;
  
  function recurse(seg) {
    if (seg.eid in visit) {
      return;
    }
    
    visit[seg.eid] = 1;
    
    seg.topoid = topogroup_idgen;
    
    for (var i=0; i<2; i++) { 
      var v = i ? seg.v2 : seg.v1;
      if (v.segments.length != 2)
        continue;
          
      for (var j=0; j<v.segments.length; j++) {
        var s2 = v.segments[j];
        
          
        if (!(s2.eid in visit)) {
          recurse(s2);
        }
      }
    }
    
    if (!s.hidden || (s.flag & SplineFlags.GHOST))
      list.push(seg);
  }
  
  /*if (spline.is_anim_path) { //don't bother forming chains on animation path splines
    for (var s of layer) {
      if (s.type != SplineTypes.SEGMENT)
        continue;
      if (!(layerid in s.layers))
        continue;
        
      if (!s.hidden || (s.flag & SplineFlags.GHOST))
        list.push(s);
    }
  } else*/
  if (1) {
    for (var s of layer) {
      if (s.type != SplineTypes.SEGMENT)
        continue;
      if (!(layerid in s.layers))
        continue;
      
      //start at one-valence verts first
      if (s.v1.segments.length == 2 && s.v2.segments.length == 2)
        continue;
      
      if (!(s.eid in visit)) {
        topogroup_idgen++;
        recurse(s);
      }
    }
  
    //we should be  finished, but just in case. . .
    for (var s of layer) {
      if (s.type != SplineTypes.SEGMENT)
        continue;
      if (!(layerid in s.layers))
        continue;
      
      if (!(s.eid in visit)) {
        topogroup_idgen++;
        recurse(s);
      }
    }
  }
  
  return list;
}

export function redo_draw_sort(spline) {
  var min_z = 1e14;
  var max_z = -1e14;
  var layerset = spline.layerset;
  
  console.log("start sort");
  var time = time_ms();
  
  for (var f of spline.faces) {
    if (f.hidden && !(f.flag & SplineFlags.GHOST))
      continue;
      
    if (isNaN(f.z))
      f.z = 0;
      
    max_z = Math.max(max_z, f.z+1);
    min_z = Math.min(min_z, f.z+1);
  }
  
  for (var s of spline.segments) {
    if (s.hidden && !(s.flag & SplineFlags.GHOST))
      continue;
      
    if (isNaN(s.z))
      s.z = 0;
      
    max_z = Math.max(max_z, s.z+2);
    min_z = Math.min(min_z, s.z);
  }
  
  function calc_z(e) {
    if (isNaN(e.z)) {
      e.z = 0;
    }
    
    //XXX make segments always draw above their owning faces
    //giving edges their own order in this case gets too confusing
    if (e.type == SplineTypes.SEGMENT && e.l != undefined) {
      var l = e.l;
      var _i = 0;
      var f_max_z = undefined;
      
      do {
        if (_i++ > 1000) {
          console.trace("infinite loop!");
          break;
        }
        
        var fz = calc_z(l.f);
        f_max_z = f_max_z == undefined ? fz : Math.max(f_max_z, fz)
        
        l = l.radial_next;
      } while (l != e.l);
      
      //console.log("eid:", e.eid, "f_max_z:", f_max_z);
      
      return f_max_z + 1;
    }
    
    var layer = 0;
    for (var k in e.layers) {
      layer = k;
      break;
    }
    
    if (!(layer in layerset.idmap)) {
      console.log("Bad layer!", layer);
      return -1;
    }
    
    layer = layerset.idmap[layer];
    return layer.order*(max_z-min_z) + (e.z-min_z);
  }

  function get_layer(e) {
    for (var k in e.layers) {
      return k;
    }
    
    //XXX 
    //console.trace("ERROR! element lives in NO LAYERS! EEK!!");
    return undefined;
  }
  
  var dl = spline.drawlist = [];
  var ll = spline.draw_layerlist = []; //layer id of which layer each draw element lives in
  spline._layer_maxz = max_z;
  
  for (var f of spline.faces) {
    f.finalz = -1;
    
    if (f.hidden && !(f.flag & SplineFlags.GHOST))
      continue;
      
    dl.push(f);
  }
  
  //okay, build segment list by layers
  
  var visit = {};
  for (var i=0; i<spline.layerset.length; i++) {
    var layer = spline.layerset[i];
    
    var elist = sort_layer_segments(layer, spline);
    for (var j=0; j<elist.length; j++) {
      var s = elist[j];
      
      if (!(s.eid in visit))
        dl.push(elist[j]);
        
      visit[s.eid] = 1;
    }
  }
  
  //handle orphaned segments
  for (var s of spline.segments) {
    s.finalz = -1;
    
    if (s.hidden && !(s.flag & SplineFlags.GHOST))
      continue;
      
    if (!(s.eid in visit)) {
      //XXX
      //console.log("WARNING: orphaned segment", s.eid, "is not in any layer", s);
      
      dl.push(s);
    }
  }
  
  var zs = {};
  for (var e of dl) {
    zs[e.eid] = calc_z(e);
  }
  
  //no need to actually sort animation paths, which have no faces anyway
  if (!spline.is_anim_path) {
    dl.sort(function(a, b) {
      return zs[a.eid] - zs[b.eid];
    });
  }
  
  for (var i=0; i<dl.length; i++) {
    var lk = undefined;
    for (var k in dl[i].layers) {
      lk = k;
      break;
    }
    
    ll.push(lk);
  }
  
  for (var i=0; i<spline.drawlist.length; i++) {
    spline.drawlist[i].finalz = i;
  }
  
  //assign string ids, continuous string of segments connected with 2-valence vertices
  calc_string_ids(spline, spline.segments.length);
  
  spline.recalc &= ~RecalcFlags.DRAWSORT;
  
  console.log("time taken:" + (time_ms()-time).toFixed(2)+"ms");
}

var VERT_SIZE=3.0;
var SMALL_VERT_SIZE=1.0;
var MRES_SIZE=5.5;

function draw_mres_points(spline, g, editor, outside_selmode=false) {
  if (spline.segments.cdata.num_layers("MultiResLayer") == 0)
    return;
  
  var w = MRES_SIZE/editor.zoom;
  
  var lw = g.lineWidth;

  g.lineWidth = 1;
  g.fillStyle = "black";
  
  //console.log("draw points");
  
  var shared = spline.segments.cdata.get_shared("MultiResLayer");
  var active = shared.active;
  
  //note: we are operating on cached "dummy" variables here, these aren't real objects
  for (var p of iterpoints(spline, 0)) {
    //console.log(p[0], p[1], p.id, p.s, p.seg);
    if (p.flag & MResFlags.HIDE) continue;
    
    var seg = spline.eidmap[p.seg];
    var mapco = seg.evaluate(p.s);
    
    var clr = uclr;
    
    if (p.composed_id == active)
      clr = aclr;
    else if (p.flag & MResFlags.HIGHLIGHT)
      clr = hclr;
    else if (p.flag & MResFlags.ACTIVE)
      clr = aclr;
    else if (p.flag & MResFlags.SELECT)
      clr = sclr;
    
    g.fillStyle = clr;
    
    if (!outside_selmode) {
      g.beginPath();
      g.rect(mapco[0]-w/2, mapco[1]-w/2, w, w);
      g.fill();
    }
    
    /*
    g.beginPath();
    g.moveTo(p[0], p[1]);
    g.lineTo(p[0]-p.offset[0], p[1]-p.offset[1]);
    g.stroke();
    */
  }
  
  g.lineWidth = lw;
}

import {SplineDrawer} from 'spline_draw_new';

export function draw_spline(spline, redraw_rects, g, editor, selectmode, only_render,
                            draw_normals, alpha, draw_time_helpers, curtime)
{
  spline.canvas = g;
  
  if (spline.drawlist == undefined || (spline.recalc & RecalcFlags.DRAWSORT)) {
    redo_draw_sort(spline);
  }

  if (spline.drawer == undefined) {
    spline.drawer = new SplineDrawer(spline);
  }
  
  spline.drawer.update(spline, spline.drawlist, spline.draw_layerlist, editor.rendermat, redraw_rects, only_render, selectmode, g, editor.zoom, editor);
  spline.drawer.draw(editor.drawcanvas, editor.drawg);
  
  var layerset = spline.layerset;
  var actlayer = spline.layerset.active;
  var totlayer = spline.layerset.length;
  
  var zoom = editor.zoom;
  
  if (isNaN(zoom)) {
    zoom = 1.0;
  }
  
  g.lineWidth = 2;//*zoom
  g.strokeStyle = clr;
  
  if (alpha == undefined) 
    alpha = 1.0;
    
  var lastco = spline_draw_cache_vs.next().zero();
  var b1 = spline_draw_cache_vs.next(), b2 = spline_draw_cache_vs.next();
  var b3 = spline_draw_cache_vs.next();
  var co = spline_draw_cache_vs.next();
  var dostroke = false;
  
  var lastdv = spline_draw_cache_vs.next();
  
  var mathmin = Math.min;
  var MAXCURVELEN = 10000;
  
  function draw_curve_normals() {
    for (var seg of spline.segments) {
      if (seg.v1.hidden || seg.v2.hidden) continue;
      //if (seg.hidden) continue;
      
      var ls = 0.0, dls = 80/zoom;
      var length = seg.ks[KSCALE];
      
      if (length <= 0 || isNaN(length)) continue;
      if (length < MAXCURVELEN) length = MAXCURVELEN;
      
      for (var ls=0; ls <length; ls += dls) {
        var s = ls / length;
        if (s > 1.0) continue;
        
        var co = seg.evaluate(s);
        var n = seg.normal(s).normalize();
        var k = seg.curvature(s);
        
        n.mulScalar(k*(window._d != undefined ? window._d : 1000)/zoom);
        
        g.lineWidth = 1;//*zoom;
        g.strokeColor = "%2233bb";
        
        g.beginPath();
        g.moveTo(co[0], co[1]);
        g.lineTo(co[0]+n[0], co[1]+n[1]);
        g.stroke();
      }
    }
  }
  
  if (!only_render && draw_normals)
    draw_curve_normals();
  
  static smin = new Vector3(), smax = new Vector3();
  
  function aprint(arr) {
    var s = "["
    for (var i=0; i<2; i++) {
      if (i > 0) s += ", ";
      
      s += arr[i].toFixed(1);
    }
    
    s += "]";
    return s;
  }
  
  var black = "black";
  static r = [[0, 0], [0, 0]];
  
  for (var s of spline.segments) {
    s.flag &= ~SplineFlags.DRAW_TEMP;
  }
  for (var f of spline.faces) {
    f.flag &= ~SplineFlags.DRAW_TEMP;
  }

  var ghostflag = SplineFlags.GHOST;

  for (var seg of spline.segments) {
    smin.zero().load(seg.aabb[0]);
    smax.zero().load(seg.aabb[1]);
    
    var skipdraw = true;
    
    for (var i=0; i<redraw_rects.length; i += 4) {
      r[0][0] = redraw_rects[i  ], r[0][1] = redraw_rects[i+1];
      r[1][0] = redraw_rects[i+2], r[1][1] = redraw_rects[i+3];
      
      if (aabb_isect_minmax2d(smin, smax, r[0], r[1], 2)) {
        skipdraw = false;
        break;
      }
    }
    
    if (skipdraw)
      continue;
    
    var is_ghost = (seg.v1.flag & ghostflag) || (seg.v2.flag & ghostflag) || (seg.flag & ghostflag);
    is_ghost = !only_render && is_ghost;
    
    if (!is_ghost && (seg.v1.hidden || seg.v2.hidden)) continue;
    if (!is_ghost && seg.hidden) continue;
      
    seg.flag |= SplineFlags.DRAW_TEMP;
    
    if (seg.l != undefined) {
      var l = seg.l;
      var c = 0;
      do {
        l.f.flag |= SplineFlags.DRAW_TEMP;
        l = l.radial_next;
        if (c++ > 1000) {
          break;
        }
      } while (l != seg.l);
    }
  }
  
  function draw_segment(seg, alpha2, line_width_scale, reset, reverse) {
    return; //XXX
    
    if (line_width_scale == undefined)
      line_width_scale = 1.0;
    
    var is_ghost = (seg.v1.flag & ghostflag) || (seg.v2.flag & ghostflag) || (seg.flag & ghostflag);
    is_ghost = !only_render && is_ghost;
    
    if (alpha2 == undefined) alpha2 = is_ghost ? 0.1 : alpha;
    
    if (!(seg.flag & SplineFlags.DRAW_TEMP))
      return;
    
    var USE_BEZIER = !ENABLE_MULTIRES;
      
    var s = 0, length = mathmin(seg.ks[KSCALE], MAXCURVELEN);
    var totseg = USE_BEZIER ? 7 : 172;
    var stepsize = Math.max(length/totseg, 1.0/zoom);
    if (stepsize <= 0.0 || isNaN(stepsize)) stepsize == 1.0;
    
    var lasts = 0, lasts1 = 0;
    var lastco = undefined;
    var lastdv = undefined;
    
    var color;
    if (seg.in_layer(actlayer) && !only_render && (selectmode & SelMask.SEGMENT)) {
      color = "rgba(0,0,0,"+alpha2+")";
      
      if (seg == spline.segments.highlight)
        color = hclr;
      else if (seg == spline.segments.active)
        color = aclr;
      else if (seg.flag & SplineFlags.SELECT)
        color = sclr;
      else if (seg.flag & SplineFlags.NO_RENDER)
        color = "rgba(0, 0, 0, 0)";
    } else if (seg.flag & SplineFlags.NO_RENDER) {
      return;
    } else {
      var clr = seg.mat.strokecolor;
      var r1 = ~~(clr[0]*255);
      var g1 = ~~(clr[1]*255);
      var b1 = ~~(clr[2]*255);
      
      color = "rgba("+r1+","+g1+","+b1+","+alpha2*clr[3]+")";
    }
    
    g.strokeStyle = color;
    
    g.lineWidth = seg.mat.linewidth*zoom*line_width_scale;
    var is_line = false;
    
    var df = 0.001;
    var s1 = 0.0001;
    var finals = 1.0-0.0001;
    var ds = stepsize;
    
    if (reverse) {
      s1 = length-0.0001;
      finals = 0.00001;
      ds = -ds;
      stepsize = -stepsize;
    }
    
    if (isNaN(length))
      return;
      
    var stop = false;
    
    if (seg._draw_bzs != undefined) {
      stop = true;
      
      var bzs = seg._draw_bzs;
      for (var i=0; i<bzs.length; i++) {
        var p1 = bzs[i][0];
        var p2 = bzs[i][1];
        var p3 = bzs[i][2];
        var p4 = bzs[i][3];
        
        if (i == 0) {
          g.moveTo(p1[0], p1[1]);
          g.bezierCurveTo(p2[0], p2[1], p3[0], p3[1], p4[0], p4[1]);
        } else {
          g.moveTo(p1[0], p1[1]);
          g.bezierCurveTo(p2[0], p2[1], p3[0], p3[1], p4[0], p4[1]);
        }
      }
      
      g.stroke();
    }
    
    var __c = 0;
    for (var j=0; !stop; s1 += ds, j++) {
      var s = s1/(length);
      
      if (__c++ > 2500) break;
      
      if ((!reverse && s > 1.0) || (reverse && s <= 0)) {
        stop = true;
        s = finals;
      }
      
      s = Math.max(Math.min(s, 1.0), 0.0);
      
      var co = seg.evaluate(s);
      var df = 0.0001;
      var dv2 = seg.derivative(s, undefined, true);
      var dv3 = seg.derivative(s+df, undefined, true);
      
      dv3.sub(dv2).mulScalar(1.0/df);
      if (dv3.dot(dv3) < 0.01) {
        is_line = true;
      }
      
      dv2.mulScalar(1/(3*(length/stepsize)));
      
      if (lastco == undefined && reset) {
        g.moveTo(co[0], co[1]);
      } else if (lastco == undefined) {
        g.lineTo(co[0], co[1]);
      } else {
        var dv = lastdv;
        
        if (is_line || !USE_BEZIER) {
          g.lineTo(co[0], co[1]);
        } else {
          g.bezierCurveTo( lastco[0]+dv[0], lastco[1]+dv[1], 
                        co[0]-dv2[0], co[1]-dv2[1], 
                        co[0], co[1]);
        }
      }
      
      lastco = co;
      lastdv = dv2;
    }
    
    g.stroke();
  }

  
  var drawlist = spline.drawlist;
  function draw_face(f, do_mask) {
    //if (!(f.flag & SplineFlags.DRAW_TEMP))
    //  return;
    
    g.lineWidth = 8;//*zoom;
    
    if (!do_mask) {
      g.beginPath();
    }
    
    //if (!(f.flag & SplineFlags.DRAW_TEMP))
    //  return;
    var lastco = new Vector3();
    for (var path of f.paths) {
      var first = true;
      var lastco, lastdv;
      
      for (var l of path) {
        var seg = l.s;
        var length = seg.length;
        
        var flip = seg.v1 !== l.v ? -1.0 : 1.0;
        
        var length = mathmin(seg.ks[KSCALE], MAXCURVELEN);
        var steps = 5, s = flip<0.0 ? 1.0 : 0.0;
        
        var ds = (1.0 / (steps-1))*flip;
        
        for (var i=0; i<steps; i++, s += ds) {
          var co = seg.evaluate(s*0.9998 + 0.00001);
          var dv = seg.derivative(s*0.9998 + 0.00001);
          var k = seg.curvature(s*0.9998 + 0.00001);
          
          dv.mulScalar(ds/3.0);
          
          if (first) {
            first = false;
            g.moveTo(co[0], co[1]);
          } else {
            //*
            if (i==0 || abs(k) < 0.00001/zoom) {
              g.lineTo(co[0], co[1]);
            } else {
            //*
              g.bezierCurveTo( lastco[0]+lastdv[0], lastco[1]+lastdv[1], 
                          co[0]-dv[0], co[1]-dv[1], 
                          co[0], co[1]);
            //*/
            }
          }
          
          lastco = co;
          lastdv = dv;
        }
      }
    }
    
    g.fillStyle = f.mat.css_fillcolor;

    if (!do_mask) {
      g.closePath();
      g.fill();
    }
    
    if (do_mask || !f.in_layer(actlayer) || only_render)
      return;
    
    if ((selectmode & SelMask.FACE) && f === spline.faces.highlight) {
      g.strokeStyle = "rgba(200, 200, 50, 0.8)";
      g.stroke();
    } else if ((selectmode & SelMask.FACE) && f === spline.faces.active) {
      g.strokeStyle = "rgba(200, 80, 50, 0.8)";
      g.stroke();
    } else if ((selectmode & SelMask.FACE) && (f.flag & SplineFlags.SELECT)) {
      g.strokeStyle = "rgba(250, 140, 50, 0.8)";
      g.stroke();
    }
  }
  
  var maxdim = Math.max(window.innerWidth, window.innerHeight);
  
  function draw_blur(seg, clr, func, rad) {
    var r1 = ~~(clr[0]*255);
    var g1 = ~~(clr[1]*255);
    var b1 = ~~(clr[2]*255);
    
    color = "rgba("+r1+","+g1+","+b1+","+1.0+")";
    
    var d = maxdim/zoom*1.5;
    g._render_mat.translate(-d, -d, 0);
    g.shadowOffsetX = d*zoom;
    g.shadowOffsetY = -d*zoom;
    
    g.shadowBlur = rad*zoom;
    g.shadowColor = color; //"#000000";
    
    func(seg);
    g.shadowBlur = 0.0;
    
    g._render_mat.translate(d, d, 0);
    g.shadowOffsetX = g.shadowOffsetY = 0.0;
  }
  
  //draw lines
  var layerlist = spline.draw_layerlist;
  var last_layer = undefined, did_mask = false;
  
  var clip_stack = 0;
  var do_blur = only_render || editor.enable_blur;
  var draw_faces = only_render || editor.draw_faces;
  var last_segment = undefined;
  var reverse = 0;
  var vert_size = editor.draw_small_verts ? SMALL_VERT_SIZE : VERT_SIZE;
  
  g.beginPath();
  
  for (var i=0; i<drawlist.length; i++) {
    break; //destroy this loop
    
    var layer = layerset.idmap[layerlist[i]];
    
    if (layer != undefined && layer != last_layer) {
      var prevlayer = layerset[layer.order-1];
      var nextlayer = layerset[layer.order+1];
      
      if (nextlayer != undefined && (nextlayer.flag & SplineLayerFlags.MASK)) {
        if (clip_stack == 0) {
          clip_stack++;
          g.save();
        }
        
        did_mask = true;
      } else if (layer.flag & SplineLayerFlags.MASK) {
        var j = i-1;
        while (j >=0 && prevlayer != undefined && layerlist[j] == prevlayer.id) {
          j--;
        }
        j++;
        
        g.beginPath();
        while (layerlist[j] == prevlayer.id) {
          var e2 = drawlist[j];
          
          if (e2.type == SplineTypes.FACE) {
            draw_face(e2, true);
            g.closePath();
          }
          j++;
        }
        
        g.clip();
      } else if (!(layer.flag & SplineLayerFlags.MASK) && did_mask) {
        clip_stack--;
        g.restore();
        
        did_mask = clip_stack <= 0;
      }
      
      last_layer = layer;
    }
    
    var e = drawlist[i];
    
    for (var j=0; j<4; j++) {
      if (isNaN(e.mat.fillcolor[j]))
        e.mat.fillcolor[j] = 0;
      if (isNaN(e.mat.strokecolor[j]))
        e.mat.strokecolor[j] = 0;
    }
    
    if (layer == undefined)
      layer = spline.layerset.active;
    
    if (layer == undefined) {
      console.log("Error in draw");
      continue;
    }
    
    if (layer.flag & SplineLayerFlags.HIDE) 
      continue;
    
    if (e.type == SplineTypes.SEGMENT) {
      if (e.l != undefined && (e.mat.flag & MaterialFlags.MASK_TO_FACE)) {
        var l = e.l;
        var _c = 0;
        
        clip_stack++;
        g.save();
        
        do {
          g.beginPath();
          draw_face(l.f, 1);
          g.closePath();
          g.clip();
          
          if (c > 1000) break;
          
          l = l.radial_next;
        } while (l != e.l);
      }

      var reset = 1;
      
      if (last_segment != undefined) {
        var v1 = e.v1, v2 = e.v2, v3 = last_segment.v1, v4 = last_segment.v2, v;
        
        reset = v1 != v3 && v1 != v4 && v2 != v3 && v2 != v4;
        
        if (!reset) {
          var v = v1 == v3 || v1 == v4 ? v1 : v2;
          
          if ((v == last_segment.v2) ^ reverse) {
            reset = 1;
          } else if ((v == last_segment.v1) == (v == e.v1)) {
            reverse ^= 1;
          }
        }
      }
      
      //XXX disable miter joining for now
      reset = 1;
      reverse = 0;
      //g.lineJoin = "round"
      //g.lineCap = "square"
      /*
      if (reset) {
        //if (dostroke)
        //  g.stroke();
        
        //dostroke = true;
        reverse = (e.v1.segments.length == 2)
      }*/
      
      if (do_blur && e.mat.blur != 0.0) {
        g.beginPath();
        draw_blur(e, e.mat.strokecolor, draw_segment, e.mat.blur);
      } else {
        g.beginPath();
        draw_segment(e, undefined, undefined, 0, 0);
        g.stroke();
      }
      
      last_segment = e;
      if (e.l != undefined && (e.mat.flag & MaterialFlags.MASK_TO_FACE)) {
        clip_stack--;
        g.restore();
      }
    } else if (draw_faces && e.type == SplineTypes.FACE) {
      if (dostroke)
        g.stroke();
      g.beginPath();
      
      last_segment = undefined;
      reverse = reset = 0;
      dostroke = false;
      
      if (do_blur && e.mat.blur != 0.0) {
        draw_blur(e, e.mat.fillcolor, draw_face, e.mat.blur);
      } else {
        draw_face(e);
      }
    }
  }
  
  while (clip_stack > 0) {
    clip_stack--;
    g.restore();
  }
  
  g.beginPath();
  
  if (!only_render && (selectmode & SelMask.SEGMENT)) {
    for (var s of spline.segments.selected) {
      draw_segment(s, 0.1);
    }
  
    if (spline.segments.highlight != undefined) {
      draw_segment(spline.segments.highlight);
    }
  }
  
  if (only_render)
    return;
    
  if (selectmode & SelMask.HANDLE) {
    var w = vert_size/editor.zoom;
    
    for (var i=0; i<spline.handles.length; i++) {
      var v = spline.handles[i];
      var clr = uclr_h;
      
      if (!v.owning_segment.in_layer(actlayer))
        continue;
      if (v.owning_segment != undefined && v.owning_segment.flag & SplineFlags.HIDE)
        continue;
      if (v.owning_vertex != undefined && v.owning_vertex.flag & SplineFlags.HIDE)
        continue;
      if (!v.use) 
        continue;
      if ((v.flag & SplineFlags.AUTO_PAIRED_HANDLE) && v.hpair != undefined) {
        continue;
      }
      
      if (v.flag & SplineFlags.HIDE) 
        continue;
      
      if (v == spline.handles.highlight)
        clr = hclr_h;
      else if (v.flag & SplineFlags.SELECT)
        clr = sclr_h;
      
      g.beginPath();
      if (clr !== last_clr)
        g.fillStyle = clr;
      last_clr = clr;
      g.rect(v[0]-w, v[1]-w, w*2, w*2);
      g.fill()
      
      g.beginPath();
      g.lineWidth = 1;//*zoom;
      
      var ov = v.owning_segment.handle_vertex(v);
      g.moveTo(v[0], v[1]);
      g.lineTo(ov[0], ov[1]);
      
      g.stroke();
    }
  }
  
  if (!only_render && (selectmode & SelMask.MULTIRES)) {
    draw_mres_points(spline, g, editor);
  } else if (!only_render) {
    draw_mres_points(spline, g, editor, true);
  }
  
  var hasmres = has_multires(spline);
  
  var last_clr = undefined;
  if (selectmode & SelMask.VERTEX) {
    var w = vert_size/editor.zoom;
    
    for (var i=0; i<spline.verts.length; i++) {
      var v = spline.verts[i];
      var clr = uclr;
      
      if (!v.in_layer(actlayer))
        continue;
      if (v.flag & SplineFlags.HIDE) continue;
      
      if (v == spline.verts.highlight)
        clr = hclr;
      else if (v.flag & SplineFlags.SELECT)
        clr = sclr;
      
      var co = v;
      if (hasmres && v.segments.length > 0) {
        co = v.segments[0].evaluate(v.segments[0].ends(v));
      }
      
      if (draw_time_helpers) {
        var time = get_vtime(v);
        
        if (curtime == time) {
          g.beginPath(  );
          g.fillStyle = "#33ffaa";
          g.rect(co[0]-w*2, co[1]-w*2, w*4, w*4);
          g.fill()
          g.fillStyle = clr;
        }
      }
      
      g.beginPath();
      if (clr !== last_clr)
        g.fillStyle = clr;
      last_clr = clr;
      g.rect(co[0]-w, co[1]-w, w*2, w*2);
      g.fill()
    }
  }
  
  if (spline.sim != undefined)
    spline.sim.on_draw(g, spline);
  
  if (spline.transforming && spline.proportional) {
    g.beginPath();
    g.arc(spline.trans_cent[0], spline.trans_cent[1], spline.prop_radius, -PI, PI);
    g.stroke();
  }
}

export function patch_canvas2d(g) {
    var this2 = this;
    g._is_patched = this;
    
    if (g._lineTo == undefined) {
      g._lineTo = g.lineTo;
      g._moveTo = g.moveTo;
      g._drawImage = g.drawImage;
      g._putImageData = g.putImageData;
      g._rect = g.rect;
      g._bezierCurveTo = g.bezierCurveTo;
      g._clearRect = g.clearRect;
      g._translate = g.translate;
      g._scale = g.scale;
      g._rotate = g.rotate;
    }

    var a = new Vector3(), b = new Vector3(), c = new Vector3(), d = new Vector3();
    
    function transform(g, co) {
      var rendermat = g._render_mat;
      
      if (rendermat != undefined) {
        co.multVecMatrix(rendermat);
      }
      co[1] = g.height - co[1];
    }
    
    function untransform(g, co) {
      var rendermat = g._irender_mat;
      
      co[1] = g.height - co[1];
      
      if (rendermat != undefined) {
        co.multVecMatrix(rendermat);
      }
    }
    
    /*g.translate = function(x, y) {
      this._render_mat.translate(x, y, 0.0);
    }
    
    g.scale = function(x, y) {
      this._render_mat.scale(x, y, 1.0);
    }*/
    
    var co = new Vector3();
    g.moveTo = function(x, y) {
      co.zero(); co[0] = x; co[1] = y;
      transform(this, co);
      
      g._moveTo(co[0], co[1]);
    }
    
    g.drawImage = function(image) {
      if (arguments.length == 3) {
        var x = arguments[1], y = arguments[2];
        var w = x+image.width, h = y+image.height;
        
        co.zero(); co[0] = x; co[1] = y;
        transform(this, co);
        
        x = co[0], y = co[1];
        
        co.zero(); co[0] = w; co[1] = h;
        transform(this, co);
        
        console.log(x, y, "w, h", Math.abs(co[0]-x), Math.abs(co[1]-y), w, h);
        this._drawImage(image, x, y, Math.abs(co[0]-x), Math.abs(co[1]-y));
      } else if (arguments.length == 5) {
        var x = arguments[1], y = arguments[2];
        var w = x+arguments[3], h = y+arguments[4];
        
        co.zero(); co[0] = x; co[1] = y;
        transform(this, co);
        
        x = co[0], y = co[1];
        
        co.zero(); co[0] = w; co[1] = h;
        transform(this, co);
        
        console.log(x, y, "w, h", Math.abs(co[0]-x), Math.abs(co[1]-y), w, h);
        this._drawImage(image, x, y, Math.abs(co[0]-x), Math.abs(co[1]-y));
      } else {
        throw new Error("Invalid call to drawImage")
      }
    }
    
    g.putImageData = function(imagedata) {
      if (arguments.length == 3) {
        co.zero(); co[0] = arguments[1]; co[1] = arguments[2];
        transform(this, co);
        var x = co[0], y = co[1];
        
        //co[0] = arguments[1]+imagedata.width; co[1] = arguments[1]+imagedata.height;
        //transform(this, co);
        
        //var w = co[0]-x, h = co[1]-y;
        
        this._putImageData(imagedata, x, y);
      } else if (arguments.length == 5) {
        console.trace("Unimplemented!!!!");
      } else {
        throw new Error("Invalid number of argumnets to g.putImageData()");
      }
    }
    
    g.bezierCurveTo = function(x1, y1, x2, y2, x3, y3) {
      co[0] = x1; co[1] = y1; co[2] = 0.0;
      transform(this, co);
      x1 = co[0], y1 = co[1];
      
      co[0] = x2; co[1] = y2; co[2] = 0.0;
      transform(this, co);
      x2 = co[0], y2 = co[1];
      
      co[0] = x3; co[1] = y3; co[2] = 0.0;
      transform(this, co);
      x3 = co[0], y3 = co[1];

      this._bezierCurveTo(x1, y1, x2, y2, x3, y3);
    }
    
    g.lineTo = function(x, y) {
      co.zero(); co[0] = x; co[1] = y;
      transform(this, co);
      this._lineTo(co[0], co[1]);
    }
    
    g.rect = function(x, y, wid, hgt) {
      a.loadXYZ(x, y, 0); 
      b.loadXYZ(x+wid, y+hgt, 0);
      
      transform(this, a); transform(this, b);
      
      var xmin = Math.min(a[0], b[0]), xmax = Math.max(a[0], b[0]);
      var ymin = Math.min(a[1], b[1]), ymax = Math.max(a[1], b[1]);
      
      this._rect(xmin, ymin, Math.abs(xmax-xmin), Math.abs(ymax-ymin));
    }
    
    g.clearRect = function(x, y, wid, hgt) {
      a.loadXYZ(x, y, 0); 
      b.loadXYZ(x+wid, y+hgt, 0);
      
      transform(this, a); transform(this, b);
      
      var xmin = Math.min(a[0], b[0]), xmax = Math.max(a[0], b[0]);
      var ymin = Math.min(a[1], b[1]), ymax = Math.max(a[1], b[1]);
      
      this._clearRect(xmin, ymin, Math.abs(xmax-xmin), Math.abs(ymax-ymin));
    }
}

export function set_rendermat(g, mat) {
  if (g._is_patched == undefined) {
    patch_cancas2d(g);
  }
  
  g._render_mat = mat;
  g._irender_mat = new Matrix4(mat);
  
  g._irender_mat.invert();
}

export function redraw_element(e, view2d) {
  static margin = new Vector3([15, 15, 15]);

  margin[0] = margin[1] = margin[2] = 15.0;

  if (view2d != undefined)
    margin.mulScalar(1.0/view2d.zoom);
  
  static aabb = [new Vector3(), new Vector3()];
  
  var e_aabb = e.aabb;
  
  aabb[0].load(e_aabb[0]), aabb[1].load(e_aabb[1]);
  aabb[0].sub(margin), aabb[1].add(margin);
  
  window.redraw_viewport(aabb[0], aabb[1]);
}
