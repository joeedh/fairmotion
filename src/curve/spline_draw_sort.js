import {aabb_isect_minmax2d} from '../util/mathlib.js';
import {ENABLE_MULTIRES} from '../config/config.js';

import {SessionFlags} from '../editors/viewport/view2d_editor.js';
import {SelMask} from '../editors/viewport/selectmode.js';
import {ORDER, KSCALE, KANGLE, KSTARTX, KSTARTY, KSTARTZ, KTOTKS, INT_STEPS} from './spline_math.js';
import {get_vtime} from '../core/animdata.js';

import {iterpoints, MultiResLayer, MResFlags, has_multires} from './spline_multires.js';

var spline_draw_cache_vs = cachering.fromConstructor(Vector3, 64);
var spline_draw_trans_vs = cachering.fromConstructor(Vector3, 32);

var PI = Math.PI;
var pow = Math.pow, cos = Math.cos, sin = Math.sin, abs = Math.abs, floor = Math.floor,
  ceil = Math.ceil, sqrt = Math.sqrt, log = Math.log, acos = Math.acos, asin = Math.asin;

import {
  SplineFlags, SplineTypes, SplineElement, SplineVertex,
  SplineSegment, SplineLoop, SplineLoopPath, SplineFace,
  RecalcFlags, MaterialFlags
} from './spline_types.js';

import {ElementArray, SplineLayerFlags} from './spline_element_array.js';


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
  
  //check_face is optional, defaults to false
  function calc_z(e, check_face) {
    if (isNaN(e.z)) {
      e.z = 0;
    }
    
    //XXX make segments always draw above their owning faces
    //giving edges their own order in this case gets too confusing
    if (check_face && e.type == SplineTypes.SEGMENT && e.l !== undefined) {
      var l = e.l;
      var _i = 0;
      var f_max_z = calc_z(e, true);
      
      do {
        if (_i++ > 1000) {
          console.trace("infinite loop!");
          break;
        }
        
        var fz = calc_z(l.f);
        f_max_z = f_max_z === undefined ? fz : Math.max(f_max_z, fz)
        
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
