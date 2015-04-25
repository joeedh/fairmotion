import {aabb_isect_minmax2d} from 'mathlib';



import {SessionFlags} from 'view2d_editor';

import {SelMask} from 'selectmode';

import {ORDER, KSCALE, KANGLE, KSTARTX, KSTARTY, KSTARTZ, KTOTKS, INT_STEPS} from 'spline_math';

import {get_vtime} from 'animdata';



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



export function sort_layer_segments(layer, spline) {

  var list = [];

  var visit = {};

  var layerid = layer.id;

  

  function recurse(seg) {

    if (seg.eid in visit) {

      return;

    }

    

    visit[seg.eid] = 1;

    

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

    

    list.push(seg);

  }

  

  for (var s of spline.segments) {

    if (!(layerid in s.layers))

      continue;

    

    //start at one-valence verts first

    if (s.v1.segments.length == 2 && s.v2.segments.length == 2)

      continue;

      

    recurse(s);

  }

  

  //we should be  finished, but just in case. . .

  for (var s of spline.segments) {

    if (!(layerid in s.layers))

      continue;

    

    if (!(s.eid in visit))

      recurse(s);

  }

  

  return list;

}



export function redo_draw_sort(spline) {

  var min_z = 1e14;

  var max_z = -1e14;

  var layerset = spline.layerset;

  

  for (var f of spline.faces) {

    if (isNaN(f.z))

      f.z = 0;

      

    max_z = Math.max(max_z, f.z+1);

    min_z = Math.min(min_z, f.z+1);

  }

  

  for (var s of spline.segments) {

    if (isNaN(s.z))

      s.z = 0;

      

    max_z = Math.max(max_z, s.z+1);

    min_z = Math.min(min_z, s.z+1);

  }

  

  function calc_z(e) {

    if (isNaN(e.z))

      e.z = 0;

    

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

    

    console.trace("ERROR! element lives in NO LAYERS! EEK!!");

    return undefined;

  }

  

  var dl = spline.drawlist = [];

  var ll = spline.draw_layerlist = []; //layer id of which layer each draw element lives in

  spline._layer_maxz = max_z;

  

  for (var f of spline.faces) {

    dl.push(f);

  }

  //okay, build segment list by laters

  

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

    if (!(s.eid in visit)) {

      console.log("WARNING: orphaned segment", s.eid, "is not in any layer", s);

      dl.push(s);

    }

  }

  

  dl.sort(function(a, b) {

    return calc_z(a) - calc_z(b);

  });

  

  for (var i=0; i<dl.length; i++) {

    ll.push(get_layer(dl[i]));

  }

  

  spline.recalc &= ~RecalcFlags.DRAWSORT;

}



export function draw_spline(spline, g, editor, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime) {

  spline.canvas = g;



  if (spline.recalc & RecalcFlags.DRAWSORT) {

    redo_draw_sort(spline);

    console.log("do sort!");

  }

  

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

    for (var seg in spline.segments) {

      if (seg.v1.hidden || seg.v2.hidden) continue;

      //if (seg.hidden) continue;

      

      var ls = 0.0, dls = 10;

      var length = seg.ks[KSCALE];

      

      if (length <= 0 || isNaN(length)) continue;

      if (length < MAXCURVELEN) length = MAXCURVELEN;

      

      for (var ls=0; ls <length; ls += dls) {

        var s = ls / length;

        if (s > 1.0) continue;

        

        var co = seg.eval(s);

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

  var r = window.redraw_rect_combined;

  

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

    

    if (!aabb_isect_minmax2d(smin, smax, r[0], r[1], 2))

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

    if (line_width_scale == undefined)

      line_width_scale = 1.0;

    var pixel_off = 0.0;



    var is_ghost = (seg.v1.flag & ghostflag) || (seg.v2.flag & ghostflag) || (seg.flag & ghostflag);

    is_ghost = !only_render && is_ghost;

    

    if (alpha2 == undefined) alpha2 = is_ghost ? 0.1 : alpha;

    

    if (!(seg.flag & SplineFlags.DRAW_TEMP))

      return;

    

    var USE_BEZIER = true;

      

    var s = 0, length = mathmin(seg.ks[KSCALE], MAXCURVELEN);

    var totseg = USE_BEZIER ? 5 : 64;

    var stepsize = Math.max(length/totseg, 4);

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

    var is_line = false; //seg.is_line;

    

    var df = 0.001;

    var s1 = seg.v1.segments.length < 2 ? pixel_off : 0.0;

    var finals = seg.v2.segments.length < 2 ? Math.min((length - pixel_off) / length, 1.0) : 1.0;

    var ds = stepsize;

    

    if (reverse) {

      s1 = seg.length - s1;

      finals = 1.0 - finals;

      ds = -ds;

      stepsize = -stepsize;

    }

    

    if (isNaN(length))

      return;

      

    var stop = false;

    var __c = 0;

    for (var j=0; !stop; s1 += ds, j++) {

      var s = s1/(length);

      

      if (__c++ > 100) break;

      

      if ((!reverse && s > 1.0) || (reverse && s <= 0)) {

        stop = true;

        s = finals;

      }

      

      var co = seg.eval(s);

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

        // /*

        if (is_line || !USE_BEZIER) {

          g.lineTo(co[0], co[1]);

        } else {

          if (0) { //lastco.vectorDistance(co) < 5) {

            g.lineTo(co[0], co[1]);

          } else {

          // /*

            g.bezierCurveTo( lastco[0]+dv[0], lastco[1]+dv[1], 

                          co[0]-dv2[0], co[1]-dv2[1], 

                          co[0], co[1]);

          }

          //*/

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

          var co = seg.eval(s*0.9998 + 0.00001);

          var dv = seg.derivative(s*0.9998 + 0.00001);

          var k = seg.curvature(s*0.9998 + 0.00001);

          

          dv.mulScalar(ds/3.0);

          

          if (first) {

            first = false;

            g.moveTo(co[0], co[1]);

          } else {

            //*

            if (i==0 || abs(k) < 0.001/zoom) {

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

  

  for (var i=0; i<drawlist.length; i++) {

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

      

      if (reset) {

        if (dostroke)

          g.stroke();

        

        dostroke = true;

        g.beginPath();

        reverse = (e.v1.segments.length == 2)

      }

      

      if (do_blur && e.mat.blur != 0.0) {

        draw_blur(e, e.mat.strokecolor, draw_segment, e.mat.blur);

      } else {

        draw_segment(e, undefined, undefined, reset, !reverse);

      }

      

      last_segment = e;

      if (e.l != undefined && (e.mat.flag & MaterialFlags.MASK_TO_FACE)) {

        g.restore();

      }

    } else if (draw_faces && e.type == SplineTypes.FACE) {

      g.beginPath();

      last_segment = undefined;

      reverse = 0;

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

    for (var s in spline.segments.selected) {

      draw_segment(s, 0.1);

    }

  

    if (spline.segments.highlight != undefined) {

      draw_segment(spline.segments.highlight);

    }

  }

  

  if (only_render)

    return;

    

  if (selectmode & SelMask.HANDLE) {

    var w = 3.5/editor.zoom;

    

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

  

  var last_clr = undefined;

  if (selectmode & SelMask.VERTEX) {

    var w = 1.5/editor.zoom;

    

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

      

      if (draw_time_helpers) {

        var time = get_vtime(v);

        

        if (curtime == time) {

          g.beginPath(  );

          g.fillStyle = "#33ffaa";

          g.rect(v[0]-w*2, v[1]-w*2, w*4, w*4);

          g.fill()

          g.fillStyle = clr;

        }

      }

      

      g.beginPath();

      if (clr !== last_clr)

        g.fillStyle = clr;

      last_clr = clr;

      g.rect(v[0]-w, v[1]-w, w*2, w*2);

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

    }



    var a = new Vector3(), b = new Vector3(), c = new Vector3(), d = new Vector3();

    

    function transform(g, co) {

      var rendermat = g._render_mat;

      

      if (rendermat != undefined) {

        co.multVecMatrix(rendermat);

      }

      co[1] = g.height - co[1];

    }

    

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

        

        console.log(x, y, "w, h", co[0]-x, co[1]-y, w, h);

        this._drawImage(image, x, y, Math.abs(co[0]-x), Math.abs(co[1]-y));

      } else if (arguments.length == 5) {

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

      a.loadXYZ(x, y, 0);      //,b.loadXYZ(x, y+hgt, 0);

      d.loadXYZ(x+wid, y+hgt, 0);//, c.loadXYZ(x+wid, y+hgt);

      

      transform(this, a); /*transform(this, b); transform(this, c);*/ transform(this, d);

      

      this._rect(a[0], a[1], d[0]-a[0], d[1]-a[1]);



    }

    

    g.clearRect = function(x, y, wid, hgt) {

      a.loadXYZ(x, y, 0);      //,b.loadXYZ(x, y+hgt, 0);

      d.loadXYZ(x+wid, y+hgt, 0);//, c.loadXYZ(x+wid, y+hgt);

      

      transform(this, a); /*transform(this, b); transform(this, c);*/ transform(this, d);

      

      this._clearRect(a[0], a[1], d[0]-a[0], d[1]-a[1]);

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



export function redraw_element(e) {

  static margin = new Vector3([15, 15, 15]);

  static aabb = [new Vector3(), new Vector3()];

  

  var e_aabb = e.aabb;

  

  aabb[0].load(e_aabb[0]), aabb[1].load(e_aabb[1]);

  aabb[0].sub(margin);

  aabb[1].add(margin);

  

  aabb[0][2] = aabb[1][2] = 0.0;

  

  window.redraw_viewport(aabb[0], aabb[1]);

}
