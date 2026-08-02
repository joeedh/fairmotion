import {IntProperty, FloatProperty, CollectionProperty,
        BoolProperty, TPropFlags, StringProperty} from '../../core/toolprops.js';
import {ToolOp, UndoFlags, ToolFlags, ModalStates, ToolMacro} from '../../core/toolops_api.js';
import {SplineFlags, SplineTypes, RecalcFlags} from '../../curve/spline_types.js';
import {RestrictFlags, Spline} from '../../curve/spline.js';
import {VDAnimFlags} from '../../core/frameset.js';
import {TPropFlags} from '../../core/toolprops.js';
import '../../path.ux/scripts/util/struct.js'; //get istruct
import {redo_draw_sort} from '../../curve/spline_draw.js';

import {FullContext} from "../../core/context.js";
import {TranslateOp} from './transform.js';

export class KeyCurrentFrame extends ToolOp {
  constructor() {
    super();
  }
  
  static tooldef() { return {
    toolpath  : "spline.key_current_frame",
    uiname   : "Key Selected",
    inputs   : {},
    outputs  : {},
    icon     : -1,
    is_modal : false
  }}
  
  exec(ctx) {
    for (let v of ctx.frameset.spline.verts.selected.editable(ctx)) {
      v.flag |= SplineFlags.FRAME_DIRTY;
    }
    
    ctx.frameset.update_frame();
    
    ctx.frameset.pathspline.resolve = 1;
    ctx.frameset.pathspline.regen_sort();
    ctx.frameset.pathspline.solve();
  }
}

export class ShiftLayerOrderOp extends ToolOp {
  constructor(layer_id, off) {
    super();
    
    if (layer_id !== undefined) {
      this.inputs.layer_id.setValue(layer_id);
    }
    
    if (off !== undefined) {
      this.inputs.off.setValue(off);
    }
  }
  
  static tooldef() { return {
    uiname   : "Shift Layer Order",
    toolpath  : "spline.shift_layer_order",
    
    inputs   : {
      layer_id : new IntProperty(0),
      off      : new IntProperty(1),
      spline_path : new StringProperty("frameset.drawspline")
    },
    outputs  : {},
    icon     : -1,
    is_modal : false
  }}
  
  exec(ctx) {
    let spline = ctx.api.getValue(ctx, this.inputs.spline_path.data);
    
    let layer = this.inputs.layer_id.data;
    layer = spline.layerset.idmap[layer];
    
    if (layer === undefined) return;
    
    let off = this.inputs.off.data;
    
    spline.layerset.change_layer_order(layer, layer.order+off);
    spline.regen_sort();
  }
}

//for tools that modify both the draw spline and the path spline
export class SplineGlobalToolOp extends ToolOp {
  constructor(apiname, uiname, description, icon) {
    super()
  }
  
  //okay, this is silly.  just rely on default undo handlers,
  //i.e. serialize entire file, which is basically what we're 
  //doing here anyway.
  /*
  undo_pre(ctx) {
    let spline = ctx.frameset.spline, pathspline = ctx.frameset.pathspline;
    
    let data1 = [], data2 = [];
    
    istruct.write_object(data1, spline);
    data1 = new DataView(new Uint8Array(data1).buffer);
    
    istruct.write_object(data2, pathspline);
    data2 = new DataView(new Uint8Array(data2).buffer);
    
    this._undo = {
      drawspline : data1,
      pathspline : data2
    };
    
    window.redraw_viewport();
  }
  
  undo(ctx) {
    let spline = ctx.frameset.spline;
    let spline2 = istruct.read_object(this._undo.drawspline, Spline);
    
    let pathspline = ctx.frameset.pathspline;
    let pathspline2 = istruct.read_object(this._undo.pathspline, Spline);
    
    let idgen1 = spline.idgen;
    let idgen2 = pathspline.idgen;
    
    for (let k in spline2) {
      spline[k] = spline2[k];
    }
    
    let max_cur = spline2.idgen.cur_id;
    spline.idgen = idgen1;
    
    console.log("Restoring IDGen; max_cur:", max_cur, "current max:", spline.idgen.cur_id);
    idgen1.max_cur(max_cur-1); //minus 1 is because idgen.max_cur adds one internally
    
    let tags = {};
    let exclude = new set(["drawlist", "_layer_maxz", "draw_layerlist"]);
    
    for (let k in pathspline) {
      if (exclude.has(k)) continue;
      
      if (!(k in pathspline2)) {
        console.log("pathspline tag-ons: ", k);
        tags[k] = pathspline[k];
      }
    }
    
    for (let k in pathspline2) {
      pathspline[k] = pathspline2[k];
    }
    
    pathspline.is_anim_path = true;
    
    pathspline.resolve = 1;
    pathspline.regen_sort();
    
    redo_draw_sort(pathspline);
    let frameset = ctx.frameset;

    frameset.update_visibility();
    
    //ensure references are sane
    for (let k in frameset.vertex_animdata) {
      console.log(frameset.vertex_animdata[k].spline === pathspline);
      frameset.vertex_animdata[k].spline = pathspline;
    }
    
    //don't mess with pathspline's idgen
    /*
    let max_cur = pathspline2.idgen.cur_id;
    pathspline.idgen = idgen2;
    idgen2.max_cur(max_cur-1);
    */
    //console.log("Restoring IDGen; max_cur:", max_cur, "current max:", spline.idgen.cur_id);
 // }
}//*/

//for tools that modify the active spline only, not both splines
//(drawspline and pathspline) at once
export class SplineLocalToolOp extends ToolOp {
  constructor(apiname, uiname, description, icon) {
    super();
  }
  
  /*
  static inputs() { return {
    datamode : new Float32Property(-1, "datamode"),
    
  }}
  */
  
  undo_pre(ctx : FullContext) {
    let spline = ctx.spline;
    
    let data = [];
    
    istruct.write_object(data, spline);
    data = new DataView(new Uint8Array(data).buffer);
    
    this._undo = {
      data : data
    };
    
    //XXX flag redraw here?
    window.redraw_viewport();
  }
  
  undo(ctx : FullContext) {
    let spline = ctx.spline;
    let spline2 = istruct.read_object(this._undo.data, Spline);
    
    let idgen = spline.idgen;
    let is_anim_path = spline.is_anim_path;

    spline.on_destroy();

    for (let k in spline2) {
      if (typeof k === "symbol")
        continue;

      //don't interfere with event dag
      if (k === "inputs" || k === "outputs" || k.startsWith("dag_")) {
        continue;
      }

      spline[k] = spline2[k];
    }
    
    let max_cur = spline.idgen.cur_id;
    spline.idgen = idgen;
    
    if (is_anim_path !== undefined)
      spline.is_anim_path = is_anim_path;
    
    console.log("Restoring IDGen; max_cur:", max_cur, "current max:", spline.idgen.cur_id);
    idgen.max_cur(max_cur-1); //minus 1 is because idgen.max_cur adds one internally

    window.redraw_viewport();
  }

  execPost(ctx) {
    window.redraw_viewport();
  }
}//*/

export class KeyEdgesOp extends SplineLocalToolOp {
  uiname : string;

  constructor() {
    super();
    this.uiname = "Key Edges";
  }
  
  static tooldef() { return {
    uiname   : "Key Edges",
    toolpath  : "spline.key_edges",
    
    inputs   : {},
    outputs  : {},
    icon     : -1,
    is_modal : false
  }}
  
  static canRun(ctx) {
    //don't call if drawspline isn't active
    return ctx.spline === ctx.frameset.spline;
  }
  
  exec(ctx) {
    let prefix = "frameset.drawspline.segments["
    let frameset = ctx.frameset;
    let spline = frameset.spline;
    
    let edge_path_keys = {
      z : 1,
    }
    
    for (let s of spline.segments) {
      let path = prefix + s.eid + "]";
      
      for (let k in edge_path_keys) {
        path += "." + k;
      }
      
      ctx.api.setAnimPathKey(ctx, frameset, path, ctx.scene.time);
    }
  }
}

let pose_clipboards = {};

export class CopyPoseOp extends SplineLocalToolOp {
  constructor() {
    super();
    
    this.undoflag |= UndoFlags.NO_UNDO;
  }
  
  static tooldef() { return {
    uiname   : "Copy Pose",
    toolpath  : "editor.copy_pose",
    undoflag : UndoFlags.NO_UNDO,
    
    inputs   : {},
    outputs  : {},
    icon     : -1,
    is_modal : false
  }}

  exec(ctx) {
    let lists = [
      ctx.spline.verts.selected.editable(ctx),
      ctx.spline.handles.selected.editable(ctx)
    ]
    
    let pose_clipboard = {};
    pose_clipboards[ctx.splinepath] = pose_clipboard;
    
    for (let i=0; i<2; i++) {
      for (let v of lists[i]) {
        pose_clipboard[v.eid] = new Vector3(v);
      }
    }
  }
}

export class PastePoseOp extends SplineLocalToolOp {
  constructor() {
    super();
  }
  
  static tooldef() { return {
    uiname   : "Paste Pose",
    toolpath  : "editor.paste_pose",
    
    inputs   : {
      //float array of 'eid; x, y, z; eid; x, y, z....
      pose : new CollectionProperty([], undefined, "pose", "pose", "pose data", TPropFlags.COLL_LOOSE_TYPE)
    },
    
    outputs  : {},
    icon     : -1,
    
    //technically, according to our architectural
    //rules anything that reads data from outside of
    //toolop slots or the data model (and thus is 
    //not determinable for undo) has to be modal.
    
    is_modal : true
  }}
  
  start_modal(ctx) {
    let spline = ctx.spline;
    
    let pose_clipboard = pose_clipboards[ctx.splinepath];
    if (pose_clipboard === undefined) {
      console.trace("No pose for splinepath", ctx.splinepath);
      this.end_modal(ctx);
      return;
    }
    
    let array = [];
    for (let k in pose_clipboard) {
      let v = spline.eidmap[k];
      
      if (v === undefined) {
        console.trace("Bad vertex");
        continue;
      }
      
      let co = pose_clipboard[k];
      
      array.push(v.eid);
      array.push(co[0]); array.push(co[1]); array.push(co[2]);
    }
    
    this.inputs.pose.flag |= TPropFlags.COLL_LOOSE_TYPE;
    this.inputs.pose.setValue(array);
    
    this.exec(ctx);
  }
  
  exec(ctx) {
    let spline = ctx.spline;

    if (this.modalRunning) {
      this.end_modal(this.modal_ctx);
    }
    
    let pose = this.inputs.pose.data;
    
    console.log("poselen", pose.length);
    
    //only paste into selected verts/handles
    let actlayer = spline.layerset.active;
    
    let i = 0;
    while (i < pose.length) {
      let eid = pose[i++];
        
      let v = spline.eidmap[eid];
      
      if (v === undefined || v.type > 2) {
        console.log("bad eid: eid, v:", eid, v);
        
        i += 3;
        continue;
      }
      
      let skip = !(v.flag & SplineFlags.SELECT);
      skip = skip || (v.flag & SplineFlags.HIDE);
      skip = skip || !(actlayer.id in v.layers);
      
      if (skip) {
        console.log("skipping vertex", eid);
        i += 3;
        continue;
      }
      
      console.log("loading. . .", v, eid, pose[i], pose[i+1], pose[i+2]);
      
      v[0] = pose[i++];
      v[1] = pose[i++];
      v[2] = pose[i++];
      //console.log("            ", v, eid, pose[i], pose[i+1], pose[i+2]);
      
      v.flag |= SplineFlags.UPDATE;
      v.flag |= SplineFlags.FRAME_DIRTY;
    }
    
    spline.resolve = 1;
    spline.regen_sort();
  }
}

export class InterpStepModeOp extends ToolOp {
  constructor() {
    super(undefined, "Toggle Step Mode", "Disable/enable smooth interpolation for animation paths");
  }
  
  static tooldef() { return {
    uiname   : "Toggle Step Mode",
    toolpath : "spline.toggle_step_mode",
    
    inputs   : {},
    
    outputs  : {},
    icon     : -1,
    is_modal : false,
    description : "Disable/enable smooth interpolation for animation paths"
  }}
  
  get_animverts(ctx) {
    let vds = new set();
    let spline = ctx.frameset.spline, pathspline = ctx.frameset.pathspline;
    let frameset = ctx.frameset;
    
    for (let v of spline.verts.selected.editable(ctx)) {
      let vd = frameset.vertex_animdata[v.eid];
      if (vd === undefined) continue;
      
      vds.add(vd);
    }
    
    return vds;
  }
  
  //this operator is interesting, it operates on pathspline
  //but can get selection data from geometry spline
  undo_pre(ctx) {
    let undo = {};
    let pathspline = ctx.frameset.pathspline;
    
    for (let vd of this.get_animverts(ctx)) {
      undo[vd.eid] = vd.animflag;
    }
    
    this._undo = undo;
  }
  
  undo(ctx) {
    let undo = this._undo;
    let pathspline = ctx.frameset.pathspline;
    
    for (let vd of this.get_animverts(ctx)) {
      if (!(vd.eid in undo)) {
        console.log("ERROR in step function tool undo!!");
        continue;
      }
      
      vd.animflag = undo[vd.eid];
    }
  }
  
  exec(ctx) {
    let kcache = ctx.frameset.kcache;
    
    for (let vd of this.get_animverts(ctx)) {
      vd.animflag ^= VDAnimFlags.STEP_FUNC;
      
      for (let v of vd.verts) {
        let time = get_vtime(v);
        
        kcache.invalidate(v.eid, time);
      }
    }
  }
}

export class DeleteVertOp extends SplineLocalToolOp {
  constructor() {
    super();
  }
  
  static canRun(ctx) {
    return !(ctx.spline.restrict & RestrictFlags.NO_DELETE);
  }
  
  static tooldef() { return {
    uiname   : "Delete Points/Segments",
    toolpath  : "spline.delete_verts",
    
    inputs   : {},
    
    outputs  : {},
    icon     : -1,
    is_modal : false,
    description : "Remove points and segments"
  }}
  
  exec(ctx) {
    console.log("delete op!");
    let spline = ctx.spline;
    
    let dellist = [];
    
    for (let v of spline.verts.selected.editable(ctx)) {
      v.flag |= SplineFlags.UPDATE;
      
      dellist.push(v);
    }
    
    spline.propagate_update_flags();
    
    for (let i=0; i<dellist.length; i++) {
      console.log(dellist[i]);
      spline.kill_vertex(dellist[i]);
    }
    
    /*
    if (dellist.length > 0) {
      for (let i=0; i<spline.verts.length; i++) {
        let v = spline.verts[i];
        
        v.flag |= SplineFlags.UPDATE;
      }
    }
    */
    
    spline.regen_render();
  }
}

export class DeleteSegmentOp extends ToolOp {
  constructor() {
    super(undefined);
  }
  
  static tooldef() { return {
    uiname   : "Delete Segments",
    toolpath  : "spline.delete_segments",
    
    inputs   : {},
    
    outputs  : {},
    icon     : -1,
    is_modal : false,
    description : "Remove segments"
  }}

  static canRun(ctx) {
    return !(ctx.spline.restrict & RestrictFlags.NO_DELETE);
  }
  
  exec(ctx) {
    console.log("delete op!");
    let spline = ctx.spline;
    
    let dellist = [];
    
    for (let s of spline.segments.selected.editable(ctx)) {
      dellist.push(s);
    }
    
    for (let i=0; i<dellist.length; i++) {
      console.log(dellist[i]);
      spline.kill_segment(dellist[i]);
    }
    
    if (dellist.length > 0) {
      for (let i=0; i<spline.segments.length; i++) {
        let s = spline.segments[i];
        s.flag |= SplineFlags.UPDATE;
      }
    }
    
    spline.regen_render();
  }
}


export class DeleteFaceOp extends SplineLocalToolOp {
  constructor() {
    super(undefined, "Delete Faces");
  }
  
  static tooldef() { return {
    uiname   : "Delete Faces",
    toolpath  : "spline.delete_faces",
    
    inputs   : {},
    
    outputs  : {},
    icon     : -1,
    is_modal : false,
    description : "Remove faces"
  }}
  
  static canRun(ctx) {
    return !(ctx.spline.restrict & RestrictFlags.NO_DELETE);
  }
  
  exec(ctx) {
    console.log("delete op!");
    let spline = ctx.spline;
    
    let vset = new set(), sset = new set(), fset = new set();
    let dellist = [];
    
    for (let f of spline.faces.selected.editable(ctx)) {
      fset.add(f);
    }
    
    for (let f of fset) {
      for (let path of f.paths) {
        for (let l of path) {
          let l2 = l.s.l;
          let _c=0, del=true;
          
          do {
            if (_c++ > 1000) {
              console.log("Infintite loop!");
              break;
            }
            
            if (!fset.has(l2.f))
              del = false;
            l2 = l2.radial_next;
          } while (l2 !== l.s.l);
          
          if (del)
            sset.add(l.s);
        }
      }
    }
    
    for (let s of sset) {
      for (let si=0; si<2; si++) {
        let del = true;
        let v = si ? s.v2 : s.v1;
        
        for (let i=0; i<v.segments.length; i++) {
          if (!(sset.has(v.segments[i]))) {
            del = false;
            break;
          }
        }
        
        if (del)
          vset.add(v);
      }
    }
    
    for (let f of fset) {
      spline.kill_face(f);
    }
    
    for (let s of sset) {
      spline.kill_segment(s);
    }
    
    for (let v of vset) {
      spline.kill_vertex(v);
    }
    
    spline.regen_render();
    window.redraw_viewport();
  }
}


export class ChangeFaceZ extends SplineLocalToolOp {
  constructor(offset, selmode) {
    super(undefined);
    
    if (offset !== undefined)
      this.inputs.offset.setValue(offset); 
    if (selmode !== undefined)
      this.inputs.selmode.setValue(selmode);
  }
  
  static tooldef() { return {
    uiname   : "Set Order",
    toolpath  : "spline.change_face_z",
    
    inputs   : {
      offset   : new IntProperty(1),
      selmode : new IntProperty(SplineTypes.FACE)
    },
    
    outputs  : {},
    icon     : Icons.Z_UP,
    is_modal : false,
    description : "Change draw order of selected faces"
  }}

  
  static canRun(ctx) {
    return 1;// !(ctx.spline.restrict & RestrictFlags.NO_DELETE);
  }
  
  exec(ctx) {
    let spline = ctx.spline;
    
    let off = this.inputs.offset.getValue();
    let selmode = this.inputs.selmode.getValue();
    
    if (isNaN(off)) off = 0.0;

    let typestr = "";

    if (selmode & SplineTypes.VERTEX) {
      selmode |=  SplineTypes.SEGMENT;
    }
    
    if (selmode & SplineTypes.FACE) {
      typestr += "face ";

      for (let f of spline.faces.selected.editable(ctx)) {
        if (isNaN(f.z)) f.z = 0.0;
        
        if (f.hidden) continue;
        
        f.z += off;
      }
    }
    
    if (selmode & (SplineTypes.SEGMENT|SplineTypes.VERTEX)) {
      typestr += "segment ";

      for (let s of spline.segments.selected.editable(ctx)) {
        if (isNaN(s.z)) s.z = 0.0;
        
        if (s.hidden) continue;
        
        s.z += off;
      }
    }

    console.log("change", typestr, "z! selmode:", selmode, "off", off);

    spline.regen_sort();
    window.redraw_viewport();
  }
}

export class DissolveVertOp extends SplineLocalToolOp {
  constructor() {
    super();
  }
  
  static tooldef() { return {
    uiname   : "Collapse Points",
    toolpath  : "spline.dissolve_verts",
    
    inputs   : {
      verts     : new CollectionProperty([], undefined, "verts", "verts"),
      use_verts : new BoolProperty(false, "use_verts")
    },
    
    outputs  : {},
    icon     : -1,
    is_modal : false,
    description : "Change draw order of selected faces"
  }}
  
  static canRun(ctx) {
    return !(ctx.spline.restrict & RestrictFlags.NO_DISSOLVE);
  }
  
  exec(ctx) {
    let spline = ctx.spline;
    let dellist = [];
    
    let verts = spline.verts.selected.editable(ctx);
    if (this.inputs.use_verts.data) {
      verts = new set();
      
      for (let eid of this.inputs.verts.data) {
        verts.add(spline.eidmap[eid]);
      }
    }
    
    for (let v of verts) {
      if (v.segments.length !== 2) continue;
      
      dellist.push(v);
    }
    
    for (let i=0; i<dellist.length; i++) {
      spline.dissolve_vertex(dellist[i]);
    }
    
    spline.regen_render();
  }
}

//XXX need to consider an API for geometric operations
//that differ between animation/draw splines
function frameset_split_edge(ctx, spline, s, t=0.5) {
  console.log("split edge op!");
  
  let interp_animdata = spline === ctx.frameset.spline;
  let frameset = interp_animdata ? ctx.frameset : undefined;
  
  if (interp_animdata) {
    console.log("interpolating animation data from adjacent vertices!");
  }
  
  let e_v = spline.split_edge(s, t);
  
  if (interp_animdata) {
    frameset.create_path_from_adjacent(e_v[1], e_v[0]);
  }
  
  spline.verts.setselect(e_v[1], true);
  spline.verts.active = e_v[1];
  
  spline.regen_sort();
  spline.regen_render();
  
  return e_v;
}

export class SplitEdgeOp extends SplineGlobalToolOp {
  constructor() {
    super();
  }
  
  static tooldef() { return {
    uiname   : "Split Segments",
    toolpath : "spline.split_edges",
    inputs   : {},
    outputs  : {},
    
    icon     : -1,
    is_modal : false,
    description : "Split selected segments"
  }}
  
  static canRun(ctx) {
    return !(ctx.spline.restrict & RestrictFlags.NO_SPLIT_EDGE);
  }
  
  exec(ctx) {
    console.log("split edge op!");

    let spline = ctx.spline;
    
    let interp_animdata = spline === ctx.frameset.spline;
    let frameset = interp_animdata ? ctx.frameset : undefined;
    
    console.log("interp_animdata: ", interp_animdata);
    
    let segs = [];
    
    if (interp_animdata) {
      console.log("interpolating animation data from adjacent vertices!");
    }
    
    for (let s of spline.segments.selected.editable(ctx)) {
      if (s.v1.hidden || s.v2.hidden) continue;
      
      if ((s.v1.flag & SplineFlags.SELECT && s.v2.flag & SplineFlags.SELECT))
        segs.push(s);
    }
    
    for (let i=0; i<segs.length; i++) {
      let e_v = frameset_split_edge(ctx, spline, segs[i]);
      spline.verts.setselect(e_v[1], true);
    }
    
    spline.regen_render();
  }
}

export class SplitPickEdgeTransformOp extends ToolMacro {
  static tooldef() {
    return {
      uiname   : "Split Segment",
      toolpath : "spline.split_pick_edge_transform"
    }
  }

  constructor() {
    super();

    let tool = new SplitEdgePickOp();
    let tool2 = new TranslateOp(undefined, 1 | 2); //XXX import SplineTypes and use instead of this dumb magic number

    ret.description = tool.description;
    ret.icon = tool.icon;

    this.add(tool);
    this.add(tool2);

    //XXX stupidly hackish way of passing last mouse position between tools
    let modalEnd = tool.modalEnd;

    tool.modalEnd = function () {
      let ctx = tool.modal_ctx;

      tool2.user_start_mpos = tool.mpos;
      console.log("                 on_modal_end successfully called", tool2.user_start_mpos);

      modalEnd.apply(tool, arguments);
    };
  }
}

export class SplitEdgePickOp extends SplineGlobalToolOp {
  mpos : Vector2;

  constructor() {
    super();
    this.mpos = new Vector2();
  }
  
  static tooldef() { return {
    uiname    : "Split Segment",
    toolpath  : "spline.split_pick_edge",
    
    inputs   : {
      segment_eid : new IntProperty(-1, "segment_eid", "segment_eid", "segment_eid"),
      segment_t   : new FloatProperty(0, "segment_t", "segment_t", "segment_t"),
      spline_path : new StringProperty("drawspline", "spline_path", "splien_path", "spline_path"),
      deselect : new BoolProperty(true, "deselect", "deselect", "deselect")
    },
    
    outputs  : {},
    
    icon     : Icons.SPLIT_EDGE,
    is_modal : true,
    description : "Split picked segment"
  }}
  
  static canRun(ctx) {
    return !(ctx.spline.restrict & RestrictFlags.NO_SPLIT_EDGE);
  }

  on_pointerdown(e) {
    console.log("mdown", e);
    this.finish(e.button !== 0);
  }
  
  on_pointerup(e) {
    console.log("mup");
    this.finish(e.button !== 0);
  }

  on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Enter"]:
      case charmap["Escape"]:
        this.finish(event.keyCode === charmap["Escape"]);
        break;
    }
  }
  
  on_pointermove(e) {
    let ctx = this.modal_ctx;

    let mpos = [e.x, e.y];
    mpos = ctx.view2d.getLocalMouse(mpos[0], mpos[1]);

    this.mpos.load(mpos);
    
    let ret = ctx.view2d.editor.findnearest(mpos, SplineTypes.SEGMENT, 105, ctx.view2d.edit_all_layers);
    
    if (ret === undefined) {
      this.reset_drawlines();
      this.inputs.segment_eid.setValue(-1);
      
      return;
    }
    
    let seg = ret[1];
    let spline = ret[0];
    
    if (spline === ctx.frameset.pathspline) {
      this.inputs.spline_path.setValue("pathspline");
      //console.log("pathspline");
    } else {
      this.inputs.spline_path.setValue("spline");
      //console.log("drawspline");
    }
    
    this.reset_drawlines(ctx);
    
    let steps = Math.min(Math.max(seg.length / 20, 3, 18));
    let ds = 1.0 / (steps - 1), s = 0;
    let lastco;

    let view2d = ctx.view2d;
    let canvas = view2d.get_bg_canvas();

    for (let i=0; i<steps; i++, s += ds) {
      let co = seg.evaluate(s);

      view2d.project(co);

      if (i > 0) {
        this.new_drawline(lastco, co, [1, 0.3, 0.0, 1.0], 2);
      }
      lastco = co;
    }
    
    this.inputs.segment_eid.setValue(seg.eid);
    this.inputs.segment_t.setValue(0.5);
  
    ctx.view2d.unproject(mpos);
    //console.log("pmpos", mpos);
    
    let p = seg.closest_point(mpos, ClosestModes.CLOSEST);
    
    if (p !== undefined) {
      this.inputs.segment_t.setValue(p.s);
      
      //console.log("  p", p[1].toFixed(4), p[0]);
      
      p = new Vector2(p.co);
      view2d.project(p);

      let y = p[1];
      let w = 4;
      
      this.new_drawline([p[0]-w, y-w], [p[0]-w, y+w], "blue");
      this.new_drawline([p[0]-w, y+w], [p[0]+w, y+w], "blue");
      this.new_drawline([p[0]+w, y+w], [p[0]+w, y-w], "blue");
      this.new_drawline([p[0]+w, y-w], [p[0]-w, y-w], "blue");
    }
  }
  
  finish(do_cancel) {
    if (do_cancel || this.inputs.segment_eid.data === -1) {
      this.modalEnd(do_cancel);
    } else {
      this.exec(this.modal_ctx);
      this.modalEnd(false);
    }
  }
  
  exec(ctx : ToolContext) {
    let spline = this.inputs.spline_path.data;
    
    spline = spline === "pathspline" ? ctx.frameset.pathspline : ctx.frameset.spline;
    
    if (this.inputs.deselect.data) {
      spline.select_none(ctx, SplineTypes.ALL);
    }
    
    let seg = spline.eidmap[this.inputs.segment_eid.data];
    let t = this.inputs.segment_t.data;
    
    if (seg === undefined) {
      console.warn("Unknown segment", this.inputs.segment_eid.data);
      return;
    }
  
    frameset_split_edge(ctx, spline, seg, t);
  }
}

export class VertPropertyBaseOp extends ToolOp {
  undo_pre(ctx) {
    let spline = ctx.spline;
    let vdata = {};
    
    for (let v of spline.verts.selected.editable(ctx)) {
      vdata[v.eid] = v.flag;
    }
    
    this._undo = vdata;
    
    window.redraw_viewport();
  }
  
  undo(ctx) {
    let spline = ctx.spline;
    
    for (let k in this._undo) {
      let v = spline.eidmap[k];
      
      v.flag = this._undo[k];
      v.flag |= SplineFlags.UPDATE;
    }
    
    spline.resolve = 1;
  }
}

export class ToggleBreakTanOp extends VertPropertyBaseOp {
  constructor() {
    super();
  }
  
  static tooldef() { return {
    uiname   : "Toggle Sharp Corners",
    toolpath  : "spline.toggle_break_tangents",
    
    inputs   : {},
    outputs  : {},
    
    icon     : -1,
    is_modal : false,
    description : "Toggle Sharp Corners"
  }}
  
  exec(ctx) {
    let spline = ctx.spline;
    let actlayer = spline.layerset.active.id;
    
    for (let si=0; si<2; si++) {
      let list = si ? spline.handles : spline.verts;
      
      for (let v of list.selected.editable(ctx)) {
        if (v.type === SplineTypes.HANDLE && !v.use) continue;
        
        //don't let owning vertex cancel out toggling of handle, if
        //both are selected
        if (v.type === SplineTypes.HANDLE && 
            (v.owning_vertex !== undefined && (v.owning_vertex.flag & SplineFlags.SELECT))) 
        {
          if (v.owning_vertex.flag & SplineFlags.BREAK_TANGENTS)
            v.flag |= SplineFlags.BREAK_TANGENTS;
          else
            v.flag &= ~SplineFlags.BREAK_TANGENTS;
        }
        
        v.flag ^=  SplineFlags.BREAK_TANGENTS; //event.shiftKey ? SplineFlags.BREAK_CURVATURES : SplineFlags.BREAK_TANGENTS;
        v.flag |= SplineFlags.UPDATE;
      }
    }
    
    spline.resolve = 1;
  }
}

export class ToggleBreakCurvOp extends VertPropertyBaseOp {
  constructor() {
    super();
  }
  
  static tooldef() { return {
    uiname   : "Toggle Broken Curvatures",
    toolpath  : "spline.toggle_break_curvature",
    
    inputs   : {},
    outputs  : {},
    
    icon     : -1,
    is_modal : false,
    description : "Toggle Break Curvatures, enable 'draw normals'\n in display panel to\n see what this does"
  }}
  
  exec(ctx) {
    let spline = ctx.spline;
    
    for (let v of spline.verts.selected.editable(ctx)) {
      v.flag ^=  SplineFlags.BREAK_CURVATURES;
      v.flag |= SplineFlags.UPDATE;
    }
    
    spline.resolve = 1;
  }
}

export class ConnectHandlesOp extends ToolOp {
  constructor() {
    super();
  }
  
  static tooldef() { return {
    uiname   : "Connect Handles",
    toolpath : "spline.connect_handles",
    
    inputs   : {},
    outputs  : {},
    
    icon     : -1,
    is_modal : false,
    description : "Pairs adjacent handles together to make a smooth curve"
  }}
  
  exec(ctx) {
    let spline = ctx.spline;
    
    let h1 = undefined, h2 = undefined;
    
    for (let h of spline.handles.selected.editable(ctx)) {
      if (h1 === undefined)
        h1 = h;
      else if (h2 === undefined)
        h2 = h;
      else 
        break;
    }
    
    if (h1 === undefined || h2 === undefined) return;
    
    let s1 = h1.segments[0], s2 = h2.segments[0];
    if (s1.handle_vertex(h1) !== s2.handle_vertex(h2)) return;
    
    console.log("Connecting handles", h1.eid, h2.eid);
    
    //make handles auto to start with
    h1.flag |= SplineFlags.AUTO_PAIRED_HANDLE;
    h2.flag |= SplineFlags.AUTO_PAIRED_HANDLE;
    
    h1.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
    h2.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
    
    let v = s1.handle_vertex(h1);
    v.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
    
    spline.connect_handles(h1, h2);
    spline.resolve = 1;
  }
}

export class DisconnectHandlesOp extends ToolOp {
  constructor() {
    super();
  }
  
  static tooldef() { return {
    uiname   : "Disconnect Handles",
    toolpath  : "spline.disconnect_handles",
    
    inputs   : {},
    outputs  : {},
    
    icon     : -1,
    is_modal : false,
    description : "Disconnects all handles around a point.\n  Point must have more than two segments"
  }}
  
  exec(ctx) {
    let spline = ctx.spline;
    console.log("Disconnect handles");
    
    for (let h of spline.handles.selected.editable(ctx)) {
      let v = h.owning_segment.handle_vertex(h);
      if (h.hpair === undefined)
        continue;
        
      //make handles auto to start with
      h.flag &= ~SplineFlags.AUTO_PAIRED_HANDLE;
      h.hpair.flag &= ~SplineFlags.AUTO_PAIRED_HANDLE;
      
      h.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      h.hpair.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      v.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      
      spline.disconnect_handle(h);
      spline.resolve = 1;
    }
  }
}

export class CurveRootFinderTest extends ToolOp {
  constructor() {
    super("curverootfinder", "curverootfinder", "curverootfinder");
  }
  
  static tooldef() { return {
    uiname   : "Test Closest Point Finder",
    toolpath  : "spline._test_closest_points",
    
    inputs   : {},
    outputs  : {},
    undoflag : UndoFlags.NO_UNDO,
    
    icon     : -1,
    is_modal : true,
    description : "Test closest-point-to-curve functionality"
  }}
  
  on_mousemove(event) {
    let mpos = [event.x, event.y];
    
    let ctx = this.modal_ctx;
    let spline = ctx.spline;
    
    this.reset_drawlines();

    for (let seg of spline.segments) {
      let ret = seg.closest_point(mpos, 0);
      if (ret === undefined) continue;
      
      let dl = this.new_drawline(ret.co, mpos);
      dl.clr[3] = 0.1;
      
      continue;

      ret = seg.closest_point(mpos, 3);
      for (let p of ret) {
        this.new_drawline(p.co, mpos);
      }
    }
  }
  
  end_modal() {
    this.reset_drawlines();
    this._end_modal();
  }
  
  on_mousedown(event) {
    this.end_modal();
  }
  
  on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Enter"]:
      case charmap["Escape"]:
        this.end_modal();
        break;
    }
  }
}

/*
export class DelVertFrame extends ToolOp {
  constructor() {
    super();
  }
  
  static tooldef() { return {
    uiname   : "Test Closest Point Finder",
    toolpath  : "spline._test_closest_points",
    
    inputs   : {},
    outputs  : {},
    undoflag : UndoFlags.NO_UNDO,
    
    icon     : -1,
    is_modal : true,
    description : "Test closest-point-to-curve functionality"
  }}
  
  exec(ctx) {
    
  }
}


DelVertFrame.inputs = {
  vertex_eid : new IntProperty(-1, "vertex_eid", "vertex_eid", "vertex_eid"),
  time       : new FloatProperty(-1, "time", "time", "time")
}
*/

export class ToggleManualHandlesOp extends ToolOp {
  constructor() {
    super();
  }
  
  static tooldef() { return {
    uiname   : "Toggle Manual Handles",
    toolpath  : "spline.toggle_manual_handles",
    
    inputs   : {},
    outputs  : {},
    
    icon     : -1,
    is_modal : false,
    description : "Toggle Manual Handles"
  }}
  
  undo_pre(ctx) {
    let spline = ctx.spline;
    let ud = this._undo = {};
    
    for (let v of spline.verts.selected.editable(ctx)) {
      ud[v.eid] = v.flag & SplineFlags.USE_HANDLES;
    }
  }
  
  undo(ctx) {
    let spline = ctx.spline;
    let ud = this._undo;
    
    for (let k in ud) {
      let v = spline.eidmap[k];
      
      if (v === undefined || v.type !== SplineTypes.VERTEX) {
        console.log("WARNING: bad v in toggle manual handles op's undo handler!", v);
        continue;
      }
      
      v.flag = (v.flag&~SplineFlags.USE_HANDLES) | ud[k] | SplineFlags.UPDATE;
    }
    
    spline.resolve = 1;
  }
  
  exec(ctx) {
    let spline = ctx.spline;
    
    for (let v of spline.verts.selected.editable(ctx)) {
      v.flag ^= SplineFlags.USE_HANDLES;
      v.flag |= SplineFlags.UPDATE;
    }
    
    spline.resolve = 1;
  }
}


import {TimeDataLayer, get_vtime, set_vtime} from '../../core/animdata.js';
import {ClosestModes} from "../../curve/spline_base.js";

export class ShiftTimeOp extends ToolOp {
  start_mpos : Vector3;

  constructor() {
    super();
    
    this.start_mpos = new Vector3();
  }
  
  static tooldef() { return {
    uiname   : "Move Keyframes",
    toolpath  : "spline.shift_time",
    
    inputs   : {
      factor : new FloatProperty(-1, "factor", "factor", "factor")
    },
    outputs  : {},
    
    icon     : -1,
    is_modal : true,
    description : "Move keyframes"
  }}

  get_curframe_animverts(ctx) {
    let vset = new set();
    let spline = ctx.frameset.spline, pathspline = ctx.frameset.pathspline;
    let frameset = ctx.frameset;
    
    for (let v of pathspline.verts.selected.editable(ctx)) {
      vset.add(v);
    }
    
    if (vset.length === 0) {
      for (let v of spline.verts.selected.editable(ctx)) {
        let vd = frameset.vertex_animdata[v.eid];
        if (vd === undefined) continue;
        
        for (let v2 of vd.verts) {
          let vtime = get_vtime(v2);
          
          if (vtime === ctx.scene.time) {
            vset.add(v2);
          }
        }
      }
    }
    
    return vset;
  }
  
  start_modal(ctx) {
    this.first = true;
  }
  
  end_modal(ctx) {
    super.end_modal(ctx);
  }
  
  cancel(ctx) {
  }
  
  finish(ctx) {
    ctx.scene.change_time(ctx, this.start_time);
  }
  
  on_mousemove(event) {
    //console.log("mousemove!");
    
    if (this.first) {
      this.start_mpos.load([event.x, event.y, 0]);
      this.first = false;
    }
    
    let mpos = new Vector3([event.x, event.y, 0]);
    let dx = -Math.floor((this.start_mpos[0] - mpos[0])/20+0.5);
    
    //console.log("time offset", dx);
    
    this.undo(this.modal_ctx);
    this.inputs.factor.setValue(dx);
    
    this.exec(this.modal_ctx);
    
    window.redraw_viewport();
  }
  
  on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Escape"]:
        this.cancel(this.modal_ctx);
      case charmap["Return"]:
      case charmap["Space"]:
        this.finish(this.modal_ctx);
        this.end_modal();
    }
  }
  
  on_mouseup(event) {
    this.end_modal();
  }
  
  undo_pre(ctx) {
    let ud = this._undo = {};
    for (let v of this.get_curframe_animverts(ctx)) {
      ud[v.eid] = get_vtime(v);
    }
  }
  
  undo(ctx) {
    let spline = ctx.frameset.pathspline;
    
    for (let k in this._undo) {
      let v = spline.eidmap[k], time = this._undo[k];
      
      set_vtime(spline, v, time);
      v.dag_update("depend");
    }
    
    ctx.frameset.download();
  }
  
  exec(ctx) {
    let spline = ctx.frameset.pathspline;
    let starts = {};
    let off = this.inputs.factor.data;
    
    let vset = this.get_curframe_animverts(ctx);
    for (let v of vset) {
      starts[v.eid] = get_vtime(v);
    }
    
    //console.log("time shift", off);
    
    let kcache = ctx.frameset.kcache;
    for (let v of vset) {
      kcache.invalidate(v.eid, get_vtime(v));
      set_vtime(spline, v, starts[v.eid]+off);

      kcache.invalidate(v.eid, get_vtime(v));
      v.dag_update("depend");
    }
    
    for (let v of vset) {
      let min=undefined, max=undefined;
      
      if (v.segments.length === 1) {
        let s = v.segments[0];
        let v2 = s.other_vert(v);
        let t1 =  get_vtime(v), t2 = get_vtime(v2);
        
        if (t1 < t2) {
          min = 0, max = t2;
        } else if (t1 === t2) {
          min = max = t1;
        } else {
          min = t1, max = 100000;
        }
      } else if (v.segments.length === 2) {
        let v1 = v.segments[0].other_vert(v);
        let v2 = v.segments[1].other_vert(v);
        
        let t1 = get_vtime(v1), t2 = get_vtime(v2);
        min = Math.min(t1, t2), max = Math.max(t1, t2);
      } else {
        min = 0;
        max = 100000;
      }
      
      let newtime = get_vtime(v);
      
      newtime = Math.min(Math.max(newtime, min), max);
      set_vtime(spline, v, newtime);
      
      v.dag_update("depend");
    }
    
    ctx.frameset.download();
  }
}

/*
export class DuplicateTransform extends ToolMacro {
  static tooldef() {
    return {
      uiname : "Duplicate",
      toolpath : "spline.duplicate_transform",
      description : "Make a duplicate of selected geometry.",
      icon : Icons.DUPLICATE
    }
  }

  constructor() {
    super();

    let tool = new DuplicateOp();
    this.add(tool);

    let transop = new TranslateOp(ctx.view2d.mpos, 1|2);
    this.add(transop);
  }
}*/

export class DuplicateOp extends SplineLocalToolOp {
  constructor() {
    super(undefined, "Duplicate");
  }
  
  static tooldef() { return {
    uiname   : "Duplicate Geometry",
    toolpath : "spline.duplicate",
    
    inputs   : {},
    outputs  : {},
    
    icon     : Icons.DUPLICATE,
    is_modal : false,
    description : "Make a duplicate of selected geometry."
  }}
  
  static canRun(ctx) {
    return !(ctx.spline.restrict & RestrictFlags.NO_CREATE);
  }
  
  exec(ctx) {
    let vset = new set();
    let sset = new set();
    let fset = new set();
    let hset = new set();
    
    let spline = ctx.spline;
    
    let eidmap = {};
    for (let v of spline.verts.selected.editable(ctx)) {
      vset.add(v);
    }
    
    for (let s of spline.segments.selected.editable(ctx)) {
      sset.add(s);
      
      vset.add(s.v1);
      vset.add(s.v2);
    }
    
    for (let f of spline.faces.selected.editable(ctx)) {
      fset.add(f);
      
      for (let path of f.paths) {
        for (let l of path) {
          sset.add(l.s);
          vset.add(l.s.v1);
          vset.add(l.s.v2);
        }
      }
    }
    
    for (let v of vset) {
      let nv = spline.make_vertex(v);
      spline.copy_vert_data(nv, v);
      
      eidmap[v.eid] = nv;
      spline.verts.setselect(v, false);      
      spline.verts.setselect(nv, true);
    }
    
    for (let s of sset) {
      let v1 = eidmap[s.v1.eid], v2 = eidmap[s.v2.eid];
      let ns = spline.make_segment(v1, v2);
      
      ns._aabb[0].load(s._aabb[0]);
      ns._aabb[1].load(s._aabb[1]);
      
      spline.copy_segment_data(ns, s);
      spline.copy_handle_data(ns.h1, s.h1);
      spline.copy_handle_data(ns.h2, s.h2);
      
      eidmap[s.h1.eid] = ns.h1;
      eidmap[s.h2.eid] = ns.h2;
      
      ns.h1.load(s.h1);
      ns.h2.load(s.h2);
      
      hset.add(s.h1);
      hset.add(s.h2);
      
      eidmap[ns.eid] = ns;
      spline.segments.setselect(s, false);
      spline.segments.setselect(ns, true);
      
      spline.handles.setselect(s.h1, false);
      spline.handles.setselect(s.h2, false);
      spline.handles.setselect(ns.h1, true);
      spline.handles.setselect(ns.h2, true);
    }
    
    for (let h of hset) {
      let nh = eidmap[h.eid];
      if (h.pair !== undefined && h.pair.eid in eidmap) {
        spline.connect_handles(nh, eidmap[h.pair.eid]);
      }
    }
    
    for (let f of fset) {
      let vlists = [];
      for (let path of f.paths) {
        let verts = []
        vlists.push(verts);
        
        for (let l of path) {
          verts.push(eidmap[l.v.eid]);
        }
      }
      
      console.log("duplicate");
      
      let nf = spline.make_face(vlists);

      nf._aabb[0].load(f._aabb[0]);
      nf._aabb[1].load(f._aabb[1]);

      spline.copy_face_data(nf, f);
      
      spline.faces.setselect(f, false);
      spline.faces.setselect(nf, true);
    }
    
    spline.regen_render();
    spline.regen_sort();
    spline.regen_solve();
  }
}

export class SplineFlipSegments extends SplineLocalToolOp {
  static tooldef() {return {
    uiname       : "Flip Segments",
    toolpath     : "spline.flip_segments",
    description  : "Flip vertex order"
  }}

  exec(ctx : FullContext) {
    let spline = ctx.spline;

    for (let s of spline.segments.selected.editable(ctx)) {
      spline.flip_segment(s);
    }

    spline.regen_sort();
    spline.regen_render();
    spline.regen_solve();

    spline.force_full_resolve();

    //XXX here for debugging, remove
    //window.complete_viewport_draw();

    //this next line is the correct one
    window.redraw_viewport();
  }
}

export class SplineMirrorOp extends SplineLocalToolOp {
    constructor() {
      super()
    }
    
    static tooldef() { return {
      uiname   : "Flip Horizontally",
      toolpath : "spline.mirror_verts",
      
      inputs   : {},
      outputs  : {},
      
      icon     : -1,
      is_modal : false,
      description : "Flip selected points horizontally"
    }}
    
    exec(ctx : FullContext) {
      let spline = ctx.spline;
      
      let points = new set();
      let cent = new Vector3();
      
      for (let i=0; i<2; i++) {
        let list = i ? spline.handles : spline.verts;
        
        for (let v of list.selected.editable(ctx)) {
          if (i===1 && v.owning_vertex !== undefined && v.owning_vertex.hidden)
            continue;
          if (i === 0 && v.hidden)
            continue;
          
          points.add(v);
          cent.add(v);
        }
      }
      
      if (points.length === 0) return;
      
      cent.mulScalar(1.0 / points.length);
      
      for (let v of points) {
        v.sub(cent);
        v[0] = -v[0];
        v.add(cent);
        
        v.flag |= SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      }
      
      spline.resolve = 1;
    }
}

export class VertexSmoothOp extends SplineLocalToolOp {
  static tooldef() {return {
    uiname : "Smooth Control Points",
    toolpath : "spline.vertex_smooth",
    inputs : ToolOp.inherit({
      repeat : new IntProperty(1).saveLastValue().setRange(1, 1024).saveLastValue(),
      factor : new FloatProperty(0.5).noUnits().setRange(0.0, 1.0).saveLastValue(),
      projection : new FloatProperty(0.0).noUnits().setRange(0.0, 1.0).saveLastValue()
    }),
    outputs : ToolOp.inherit({})
  }}

  exec(ctx) {
    let spline = ctx.spline;

    let vs = new Set(spline.verts.selected.editable(ctx));

    let co = new Vector2();
    let fac = this.inputs.factor.getValue();
    let proj = this.inputs.projection.getValue();
    let t = new Vector2();

    console.log("proj", proj);

    proj = 1.0 - proj;

    function vsmooth(v) {
      co.zero();
      let tot = 0.0;

      for (let e of v.segments) {
        let v2 = e.other_vert(v);
        let w = e.length;

        let s = v2 === e.v1 ? 0.0 : 1.0;
        let n = e.normal(s);

        t.load(v2).sub(v);
        let d = t.dot(n);
        t.addFac(n, d).add(v);

        //console.log("d", d, n);

        t.interp(v2, proj);

        co.addFac(t, w);
        tot += w;
      }

      if (!tot) {
        return;
      }

      co.mulScalar(1.0 / tot);
      v.interp(co, fac);

      v.flag |= SplineFlags.UPDATE;
    }

    let repeat = this.inputs.repeat.getValue();

    for (let i=0; i<repeat; i++) {
      for (let v of vs) {
        if (v.valence > 1) {
          vsmooth(v);
        }
      }
    }

    spline.regen_render();
    spline.checkSolve();

    window.redraw_viewport();
  }
}

