import {ToolOp} from 'toolops_api';
import {SplineFlags} from 'spline_types';
import {EnumProperty, IntProperty, Vec3Property, 
        Vec4Property, StringProperty, FloatProperty} from 'toolprops';
import {RestrictFlags} from 'spline';
import {SplineLocalToolOp} from 'spline_editops';

export var ExtrudeModes = {
  SMOOTH      : 0,
  LESS_SMOOTH : 1,
  BROKEN      : 2
};

export class ExtrudeVertOp extends SplineLocalToolOp {
  constructor(co, /*ExtrudeModes*/ mode) {
    super();
    
    if (co != undefined)
      this.inputs.location.set_data(co);
    if (mode != undefined) {
      this.inputs.mode.set_data(mode);
    }
  }
  
  static tooldef() { return {
    uiname   : "Extrude Path",
    apiname  : "spline.extrude_verts",
    
    inputs   : {
      location  : new Vec3Property(undefined, "location", "location"),
      linewidth : new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500]),
      mode      : new EnumProperty(ExtrudeModes.SMOOTH, ExtrudeModes, "extrude_mode", "Smooth Mode"),
      stroke    : new Vec4Property([0, 0, 0, 1])
    },
    outputs  : {
      vertex : new IntProperty(-1, "vertex", "vertex", "new vertex")
    },
    
    icon     : -1,
    is_modal : false,
    description : "Add points to path"
  }}

  can_call(ctx) {
    return !(ctx.spline.restrict & RestrictFlags.NO_EXTRUDE);
  }
  
  /*undo_pre(ctx) {
    var spline = ctx.spline;
    
    var ud = this._undo = {
      selstate    : [],
      active_vert : undefined,
      eid_range   : [-1, -1]
    }
    
    ud.active_vert = spline.verts.active != undefined ? spline.verts.active.eid : -1;
    for (var v of spline.verts.selected) {
      ud.selstate.push(v.eid);
    }
  }
  
  undo(ctx) {
    var ud = this._undo;
    var spline = ctx.spline;
    
    var v = spline.eidmap[ud.eid];
    if (v == undefined) {
      console.trace("YEEK!");
    }
    
    console.log("USTART EID", spline.idgen.cur_id, "V.EID", v.eid);
    console.log("RANGE", ud.eid_range[0], ud.eid_range[1]);
    
    spline.kill_vertex(v);
    for (var eid in ud.selstate) {
      spline.verts.setselect(spline.eidmap[eid], true);
    }
    
    for (var i=ud.eid_range[1]; i>=ud.eid_range[0]; i--) {
      console.log("  freeing ", i);
      //spline.idgen.free_id(i);
    }
    
    console.log("UEND EID", spline.idgen.cur_id);
    
    var active = spline.eidmap[ud.active_vert];
    spline.verts.active = active;
    
    window.redraw_viewport();
  }*/
   
  exec(ctx) {
    console.log("Extrude vertex op");

    var spline = ctx.spline;
    
    var layer = spline.layerset.active;
    
    //find max z for later user
    var max_z = 1;
    for (var f of spline.faces) {
      if (!(layer.id in f.layers)) continue;
      
      max_z = Math.max(f.z, max_z);
    }
    
    var max_z_seg = max_z+1;
    for (var s of spline.segments) {
      if (!(layer.id in s.layers)) continue;
      
      max_z_seg = Math.max(max_z_seg, s.z);
    }
    
    var co = this.inputs.location.data;
    
    for (var i=0; i<spline.verts.length; i++) {
      var v = spline.verts[i];
      spline.verts.setselect(v, false);
    }
    
    var start_eid = spline.idgen.cur_id;
    
    var v = spline.make_vertex(co);
    
    var smode = this.inputs.mode.get_value();
    
    if (smode == ExtrudeModes.LESS_SMOOTH)
      v.flag |= SplineFlags.BREAK_CURVATURES;
    else if (smode == ExtrudeModes.BROKEN)
      v.flag |= SplineFlags.BREAK_TANGENTS;
      
    this.outputs.vertex.set_data(v.eid);
    
    spline.verts.setselect(v, true);
    
    if (spline.verts.active !== v && spline.verts.active != undefined && !spline.verts.active.hidden && 
        !((spline.restrict & RestrictFlags.VALENCE2) && spline.verts.active.segments.length >= 2))
    {
      if (spline.verts.active.segments.length == 2) {
        var v2 = spline.verts.active;

        //auto-pair handles on original line
        var h1 = v2.segments[0].handle(v2), h2 = v2.segments[1].handle(v2);
        spline.connect_handles(h1, h2);
        
        h1.flag |= SplineFlags.AUTO_PAIRED_HANDLE;
        h2.flag |= SplineFlags.AUTO_PAIRED_HANDLE;
        h1.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
        h2.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      }
      
      var seg = spline.make_segment(spline.verts.active, v);
      seg.z = max_z_seg;
      
      console.log("creating segment");
      
      if (spline.verts.active.segments.length > 1) {
        var seg2 = spline.verts.active.segments[0];
        seg.mat.load(seg2.mat);
        //seg.mat.linewidth = spline.verts.active.segments[0].mat.linewidth;
      } else {
        seg.mat.linewidth = this.inputs.linewidth.data;
        
        var color = this.inputs.stroke.data;
        for (var i=0; i<4; i++) {
          seg.mat.strokecolor[i] = color[i];
        }
      }
      
      v.flag |= SplineFlags.UPDATE;
      spline.verts.active.flag |= SplineFlags.UPDATE;
    }
    
    spline.verts.active = v;
    spline.regen_render();
  }
}

export class CreateEdgeOp extends SplineLocalToolOp {
  constructor(linewidth) {
    super();
    
    if (linewidth != undefined)
      this.inputs.linewidth.set_data(linewidth);
  }
  
  static tooldef() { return {
    uiname   : "Make Segment",
    apiname  : "spline.make_edge",
    
    inputs   : {
      linewidth : new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500]),
    },
    outputs  : {},
    
    icon     : Icons.MAKE_SEGMENT,
    is_modal : false,
    description : "Create segment between two selected points"
  }}
  
  can_call(ctx) {
    return !(ctx.spline.restrict & RestrictFlags.NO_CONNECT);
  }
  
  exec(ctx) {
    console.log("create edge op!");

    var spline = ctx.spline;
    var sels = [];
    
    //find max z for later user
    var max_z = 1;
    for (var f of spline.faces) {
      max_z = Math.max(f.z, max_z);
    }
    
    var max_z_seg = max_z+1;
    for (var s of spline.segments) {
      max_z_seg = Math.max(max_z_seg, s.z);
    }
    
    for (var i=0; i<spline.verts.length; i++) {
      var v = spline.verts[i];
      
      if (v.hidden) continue;
      
      if (!(v.flag & SplineFlags.SELECT)) continue;
      sels.push(v);
    }
    
    if (sels.length != 2) return;
    
    sels[0].flag |= SplineFlags.UPDATE;      
    sels[1].flag |= SplineFlags.UPDATE;      
    
    var seg = spline.make_segment(sels[0], sels[1]);
    seg.z = max_z_seg;
    seg.mat.linewidth = this.inputs.linewidth.data;
    
    spline.regen_render();
  }
}

export class CreateEdgeFaceOp extends SplineLocalToolOp {
  constructor(linewidth) {
    super();
    
    if (linewidth != undefined)
      this.inputs.linewidth.set_data(linewidth);
  }
  
  static tooldef() { return {
    uiname   : "Make Polygon",
    apiname  : "spline.make_edge_face",
    
    inputs   : {
      linewidth : new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500]),
    },
    outputs  : {},
    
    icon     : Icons.MAKE_POLYGON,
    is_modal : false,
    description : "Create polygon from selected points"
  }}
  
  can_call(ctx) {
    return !(ctx.spline.restrict & RestrictFlags.NO_CONNECT);
  }
  
  exec(ctx) {
    console.log("create edge op!");

    var spline = ctx.spline;
    var layer = spline.layerset.active;
    
    var sels = [];
    
    //find max z for later user
    var max_z = 1;
    for (var f of spline.faces) {
      if (!(layer.id in f.layers)) continue;
      
      max_z = Math.max(f.z, max_z);
    }
    
    var max_z_seg = max_z+1;
    for (var s of spline.segments) {
      if (!(layer.id in s.layers)) continue;
      
      max_z_seg = Math.max(max_z_seg, s.z);
    }
    
    var vs = [];
    var valmap = {};
    var vset = new set();
    var doneset = new set();
    
    function walk(v) {
      var stack = [v];
      var path = [];
      
      if (doneset.has(v)) return path;
      if (!vset.has(v)) return path;
      
      while (stack.length > 0) {
        var v = stack.pop();
        
        if (doneset.has(v)) break;
        
        path.push(v);
        doneset.add(v);
        
        if (valmap[v.eid] > 2) break;
        
        for (var i=0; i<v.segments.length; i++) {
          var v2 = v.segments[i].other_vert(v);
          if (!doneset.has(v2) && vset.has(v2)) {
            stack.push(v2);
          }
        }
      }
      
      return path;
    }
    
    for (var v of spline.verts.selected) {
      if (v.hidden) continue;
      
      v.flag |= SplineFlags.UPDATE;
      
      vs.push(v);
      vset.add(v);
    }
    
    for (var v of vset) {
      var valence = 0;
      
      console.log("============", v);
      
      for (var i=0; i<v.segments.length; i++) {
        var v2 = v.segments[i].other_vert(v);
        
        console.log(v.eid, v2.segments[0].v1.eid, v2.segments[0].v2.eid);
        
        if (vset.has(v2)) 
          valence++;
      }
      
      valmap[v.eid] = valence;
    }
        
    console.log("VS.LENGTH", vs.length);
    if (vs.length == 2) {
      var v = vs[0].segments.length > 0 ? vs[0] : vs[1];
      var seg2 = v.segments.length > 0 ? v.segments[0] : undefined;
      
      var e = spline.make_segment(vs[0], vs[1]);
      
      if (seg2 != undefined) {
        e.mat.load(seg2.mat);
      } else {
        e.mat.linewidth = this.inputs.linewidth.data;
      }
      
      e.z = max_z_seg;
      
      spline.regen_render();
      return;
    } else if (vs.length == 3) {
      var f = spline.make_face([vs]);
      
      f.z = max_z+1;
      max_z++;
      
      spline.regen_sort();
      spline.faces.setselect(f, true);
      spline.set_active(f);
      spline.regen_render();
      return;
    }
    
    //do 1-valence verts first
    for (var v of vset) {
      if (valmap[v.eid] != 1) continue;
      var path = walk(v);
      
      if (path.length > 2) {
        var f = spline.make_face([path]);
        
        f.z = max_z+1;
        max_z++;
        spline.regen_sort();
        
        spline.faces.setselect(f, true);
        spline.set_active(f);
        spline.regen_render();
      }
    }
    
    //now do 2-valence verts, which should only belong to closed loops now
    for (var v of vset) {
      var path = walk(v);
      
      if (path.length > 2) {
        var f = spline.make_face([path]);
      
        f.z = max_z+1;
        max_z++;
        spline.regen_sort();
        
        spline.faces.setselect(f, true);
        spline.set_active(f);
        spline.regen_render();
      }
    }
    
    spline.regen_render();
  }
}

export class ImportJSONOp extends ToolOp {
  constructor(str) {
    super();
    
    if (str != undefined) {
      this.inputs.strdata.set_data(str);
    }
  }
  
  static tooldef() { return {
    uiname   : "Import Old JSON",
    apiname  : "editor.import_old_json",
    
    inputs   : {
      strdata : new StringProperty("", "JSON", "JSON", "JSON string data")
    },
    outputs  : {},
    
    icon     : -1,
    is_modal : false,
    description : "Import old json files"
  }}
  
  can_call(ctx) {
    return !(ctx.spline.restrict & RestrictFlags.NO_CONNECT);
  }

  exec(ctx) {
    console.log("import json spline op!");

    var spline = ctx.spline;
    
    var obj = JSON.parse(this.inputs.strdata.data);
    
    spline.import_json(obj);
    spline.regen_render();
  }
}
