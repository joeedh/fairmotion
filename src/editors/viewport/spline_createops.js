import {util} from "../../path.ux/scripts/pathux.js";
import {ToolOp} from '../../core/toolops_api.js';
import {SplineFlags} from '../../curve/spline_types.js';
import {EnumProperty, IntProperty, Vec3Property, 
        Vec4Property, StringProperty, FloatProperty} from '../../core/toolprops.js';
import {RestrictFlags} from '../../curve/spline.js';
import {SplineLocalToolOp} from './spline_editops.js';
import {SplineDrawData} from "../../curve/spline_draw_new.js";

export var ExtrudeModes = {
  SMOOTH      : 0,
  LESS_SMOOTH : 1,
  BROKEN      : 2
};

export class ExtrudeVertOp extends SplineLocalToolOp {
  constructor(co, /*ExtrudeModes*/ mode) {
    super();
    
    if (co !== undefined)
      this.inputs.location.setValue(co);
    if (mode !== undefined) {
      this.inputs.mode.setValue(mode);
    }
  }
  
  static tooldef() { return {
    uiname   : "Extrude Path",
    toolpath  : "spline.extrude_verts",
    
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

  static canRun(ctx) {
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
    console.log("co", co);
    var actvert = spline.verts.active;
    
    for (var i=0; i<spline.verts.length; i++) {
      var v = spline.verts[i];
      spline.verts.setselect(v, false);
    }
    
    var start_eid = spline.idgen.cur_id;
    
    var v = spline.make_vertex(co);
    console.log("v", v);

    var smode = this.inputs.mode.get_value();
    
    if (smode == ExtrudeModes.LESS_SMOOTH)
      v.flag |= SplineFlags.BREAK_CURVATURES;
    else if (smode == ExtrudeModes.BROKEN)
      v.flag |= SplineFlags.BREAK_TANGENTS;
      
    this.outputs.vertex.setValue(v.eid);
    
    spline.verts.setselect(v, true);
    
    if (actvert !== v && actvert !== undefined && !actvert.hidden &&
        !((spline.restrict & RestrictFlags.VALENCE2) && actvert.segments.length >= 2))
    {
      if (actvert.segments.length === 2) {
        var v2 = actvert;

        //auto-pair handles on original line
        var h1 = v2.segments[0].handle(v2), h2 = v2.segments[1].handle(v2);
        spline.connect_handles(h1, h2);
        
        h1.flag |= SplineFlags.AUTO_PAIRED_HANDLE;
        h2.flag |= SplineFlags.AUTO_PAIRED_HANDLE;
        h1.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
        h2.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      }

      let width = actvert.segments.length > 0 ? actvert.width : 1.0;

      var seg = spline.make_segment(actvert, v);
      seg.z = max_z_seg;

      seg.w1 = width;
      seg.w2 = width;

      console.log("creating segment");
      
      if (actvert.segments.length > 1) {
        var seg2 = actvert.segments[0];
        seg.mat.load(seg2.mat);
        //seg.mat.linewidth = actvert.segments[0].mat.linewidth;
      } else {
        seg.mat.linewidth = this.inputs.linewidth.data;
        
        var color = this.inputs.stroke.data;
        for (var i=0; i<4; i++) {
          seg.mat.strokecolor[i] = color[i];
        }
      }
      
      v.flag |= SplineFlags.UPDATE;
      actvert.flag |= SplineFlags.UPDATE;
    }
    
    spline.verts.active = v;
    spline.regen_render();
  }
}

export class CreateEdgeOp extends SplineLocalToolOp {
  constructor(linewidth) {
    super();
    
    if (linewidth != undefined)
      this.inputs.linewidth.setValue(linewidth);
  }
  
  static tooldef() { return {
    uiname   : "Make Segment",
    toolpath : "spline.make_edge",
    
    inputs   : {
      linewidth : new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500]),
    },
    outputs  : {},
    
    icon     : Icons.MAKE_SEGMENT,
    is_modal : false,
    description : "Create segment between two selected points"
  }}
  
  static canRun(ctx) {
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
      this.inputs.linewidth.setValue(linewidth);
  }
  
  static tooldef() { return {
    uiname   : "Make Polygon",
    toolpath : "spline.make_edge_face",
    
    inputs   : {
      linewidth : new FloatProperty(2.0, "line width", "line width", "line width", [0.01, 500]),
    },
    outputs  : {},
    
    icon     : Icons.MAKE_POLYGON,
    is_modal : false,
    description : "Create polygon from selected points"
  }}
  
  static canRun(ctx) {
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
    
    if (str !== undefined) {
      this.inputs.strdata.setValue(str);
    }
  }
  
  static tooldef() { return {
    uiname   : "Import Old JSON",
    toolpath  : "editor.import_old_json",
    
    inputs   : {
      strdata : new StringProperty("", "JSON", "JSON", "JSON string data")
    },
    outputs  : {},
    
    icon     : -1,
    is_modal : false,
    description : "Import old json files"
  }}
  
  static canRun(ctx) {
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

export function strokeSegments(spline, segments, width=2.0, color=[0,0,0,1]) {
  segments = new util.set(segments);

  let verts = new util.set();

  for (let seg of segments) {
    verts.add(seg.v1);
    verts.add(seg.v2);
  }

  let doneset = new util.set();

  function angle(v, seg) {
    let v2 = seg.other_vert(v);
    let dx = v2[0] - v[0];
    let dy = v2[1] - v[1];

    return Math.atan2(dy, dx);
  }

  for (let v of verts) {
    v.segments.sort((a, b) => {
      return angle(v, a) - angle(v, b);
    });
  }

  let ekey = function(e, side) {
    return ""+e.eid+":"+side;
  }

  let doneset2 = new util.set();

  for (let v of verts) {
    let side = 0;
    let startside = side;

    if (doneset.has(ekey(v, side))) {
      continue;
    }

    let startv = v;
    let seg;
    let found=0;
    for (seg of v.segments) {
      let realside = side ^ (seg.v1 === v ? 0 : 1);
      if (segments.has(seg) && !doneset.has(ekey(seg, realside))) {
        found = 1;
        break;
      }
    }

    if (!found) {
      continue;
    }

    let vcurs = {};
    let vstarts = {};

    let lastco = undefined;
    let firstp = undefined;
    let lastp = undefined;
    let lastv = v;
    let lastseg = undefined;

    let widthscale = 1.0;

    let _i = 0;
    do {
      let realside = side ^ (seg.v1 === v ? 0 : 1);

      if (doneset.has(ekey(seg, realside))) {
        break;
      }

      doneset.add(ekey(seg, realside));

      let data = seg.cdata.get_layer(SplineDrawData);
      if (!data) {
        throw new Error("data was not defined");
      }

      let s = data.gets(seg, v);
      let p = seg.evaluateSide(s, realside);
      p = spline.make_vertex(p);

      if ((v.flag & SplineFlags.BREAK_TANGENTS) || v.segments.length !== 2) {
        p.flag |= SplineFlags.BREAK_TANGENTS;

        if (v.segments.length === 2) {
          p.load(data.getp(seg, v, side ^ 1));
          p[2] = 0.0;
        }
      }

      if (v.flag & SplineFlags.BREAK_CURVATURES) {
        p.flag |= SplineFlags.BREAK_CURVATURES;
      }


      if (lastco === undefined) {
        lastco = new Vector2(p);
        lastp = p;
        firstp = p;
      } else {
        let seg2 = spline.make_segment(lastp, p);


        lastp.width = widthscale;
        widthscale += 0.025;

        seg2.mat.strokecolor.load(color);
        seg2.mat.linewidth = width;
        seg2.mat.update();

        lastco.load(p);
//*
        let nev = spline.split_edge(seg2, 0.5);
        let pn = seg.evaluateSide(0.5, realside);
        pn[2] = 0.0;
        nev[1].load(pn);

 //*/
      }

      lastp = p;

      if (v.segments.length === 2) {
        seg = v.other_segment(seg);
        v = seg.other_vert(v);

      } else if (v.segments.length > 2) {
        if (!vcurs[v.eid]) {
          vcurs[v.eid] = vstarts[v.eid] = v.segments.indexOf(v.seg);
        }

        let side2 = seg.v1 === v ? 1 : 0;
        side2 = side2 ^ side;

        let dir = realside ? -1 : 1;

        vcurs[v.eid] = (vcurs[v.eid] + dir + v.segments.length) % v.segments.length;
        if (vcurs[v.eid] === vstarts[v.eid]) {
          break;
        }

        seg = v.segments[vcurs[v.eid]];

        v = seg.other_vert(v);
      } else {
        v = seg.other_vert(v);

        let co = seg.evaluateSide(s, realside^1);
        let v2 = spline.make_vertex(co);

        let seg2 = spline.make_segment(lastp, v2);
        seg2.mat.strokecolor.load(color);
        seg2.mat.linewidth = width;
        seg2.mat.update();

        v2.flag |= SplineFlags.BREAK_TANGENTS;
        lastp.flag |= SplineFlags.BREAK_TANGENTS;

        lastp = v2;


        //side ^= 1;

        /*
          if (doneset2.has(ekey(seg, realside))) {
            doneset.remove(ekey(seg, realside));

            v = seg.other_vert(v);
            side ^= 1;
          } else {
            doneset.remove(ekey(seg, realside));
            doneset2.add(ekey(seg, realside))
            doneset2.add(ekey(seg, realside^1));
            side ^= 1;
          }*/
      }

      lastv = v;
      lastseg = seg;

      if (_i++ > 1000) {
        console.warn("Infinite loop detected!");
        break;
      }
    } while (ekey(v, side) !== ekey(startv, startside));

    if (v === startv) {
      let seg2 = spline.make_segment(lastp, firstp);
      lastp.width = widthscale;

      seg2.mat.strokecolor.load(color);
      seg2.mat.linewidth = width;
      seg2.mat.update();
    }
  }
}

export class StrokePathOp extends SplineLocalToolOp {
  constructor() {
    super();
  }

  static invoke(ctx, args) {
    let tool = new StrokePathOp();

    if ("color" in args) {
      tool.inputs.color.setValue(args.color);
    } else if (ctx.view2d) {
      tool.inputs.color.setValue(ctx.view2d.default_stroke);
    }

    if ("width" in args) {
      tool.inputs.width.setValue(args.width);
    } else if (ctx.view2d) {
      tool.inputs.width.setValue(ctx.view2d.default_linewidth);
    }

    return tool;
  }

  static tooldef() {return {
    name        : "Stroke Path",
    description : "Stroke Path",
    toolpath    : "spline.stroke",
    inputs      : {
      color     : new Vec4Property([0,0,0,1]),
      width     : new FloatProperty(1.0)
    },
    outputs     : {},
    icon        : Icons.STROKE_TOOL
  }}

  exec(ctx) {
    let spline = ctx.frameset.spline;

    let width = this.inputs.width.getValue();
    let color = this.inputs.color.getValue();

    strokeSegments(spline, spline.segments.selected.editable(ctx), width, color);

    spline.regen_render();
    spline.regen_solve();
    spline.regen_sort();
    window.redraw_viewport();
  }
}
