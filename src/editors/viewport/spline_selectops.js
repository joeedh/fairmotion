"use strict";

#include "src/core/utildefine.js"

let PI = Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor,
    ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos,
    asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;

import {ToolOp} from '../../core/toolops_api.js';
import {IntProperty, BoolProperty, EnumProperty,
        StringProperty, FlagProperty, CollectionProperty
       } from '../../core/toolprops.js';
       
import {SplineFlags, SplineTypes, SplineVertex,
        SplineSegment, SplineFace
       } from '../../curve/spline_types.js';
import {redraw_element} from '../../curve/spline_draw.js';
import {get_vtime} from '../../core/animdata.js';

export let SelOpModes = {
  AUTO: 0,
  SELECT: 1,
  DESELECT: 2
};

export class SelectOpBase extends ToolOp {
  constructor(datamode, do_flush, uiname) {
    super(undefined, uiname);
    
    if (datamode !== undefined)
      this.inputs.datamode.set_data(datamode);
    if (do_flush !== undefined)
      this.inputs.flush.set_data(do_flush);
  }
  
  static tooldef() { return {
    inputs : {
      mode     : new EnumProperty("AUTO", SelOpModes, "mode", "mode"),
      datamode : new IntProperty(0), //datamode
      flush    : new BoolProperty(false)
    }
  }}

  static invoke(ctx, args) {
    let datamode;

    let ret = new this();

    if ("selectmode" in args) {
      datamode = args["selectmode"];
    } else {
      datamode = ctx.selectmode;
    }

    ret.inputs.datamode.set_data(datamode);

    console.log("args", args);

    if ("mode" in args) {
      let mode = args["mode"].toUpperCase().trim();
      ret.inputs.mode.set_data(mode);
    } else {
      ret.inputs.mode.set_data("AUTO");
    }

    return ret;
  }
  
  undo_pre(ctx) {
    let spline = ctx.spline;
    let ud = this._undo = []
    
    for (let v of spline.verts.selected) {
      ud.push(v.eid);
    }
    
    for (let h of spline.handles.selected) {
      ud.push(h.eid);
    }
    
    for (let s of spline.segments.selected) {
      ud.push(s.eid);
    }
    
    ud.active_vert = spline.verts.active !== undefined ? spline.verts.active.eid : -1;
    ud.active_handle = spline.handles.active !== undefined ? spline.handles.active.eid : -1;
    ud.active_segment = spline.segments.active !== undefined ? spline.segments.active.eid : -1;
    ud.active_face = spline.faces.active !== undefined ? spline.faces.active.eid : -1;
  }
  
  undo(ctx) {
    let ud = this._undo;
    let spline = ctx.spline;
    
    console.log(ctx, spline);
    
    spline.clear_selection();
    let eidmap = spline.eidmap;
    
    for (let i=0; i<ud.length; i++) {
      if (!(ud[i] in eidmap)) {
        console.trace("Warning, corruption in SelectOpBase.undo(): '", ud[i], "'.");
        continue;
      }
      
      let e = eidmap[ud[i]];
      spline.setselect(e, true);
    }
    
    spline.verts.active = eidmap[ud.active_vert];
    spline.handles.active = eidmap[ud.active_handle];
    spline.segments.active = eidmap[ud.active_segment];
    spline.faces.active = eidmap[ud.active_face];
  }
}

export class SelectOneOp extends SelectOpBase {
  constructor(SplineElement e=undefined, unique=true, mode=true, datamode=0, do_flush=false) {
    super(datamode, do_flush, "Select Element");
    
    this.inputs.unique.set_data(unique);
    this.inputs.state.set_data(mode);
    
    if (e != undefined)
      this.inputs.eid.set_data(e.eid);
  }
  
  static tooldef() { return {
    apiname : "spline.select_one",
    uiname  : "Select Element",
    inputs  : ToolOp.inherit({
      eid        : new IntProperty(-1),
      state      : new BoolProperty(true),
      set_active : new BoolProperty(true),
      unique     : new BoolProperty(true)
    }),
    description : "Select Element"
  }}
  
  exec(Context ctx) {
    let spline = ctx.spline;
    let e = spline.eidmap[this.inputs.eid.data];

    //console.log("selectone!", this.inputs.eid.data);
    
    if (e == undefined) {
      console.trace("Error in SelectOneOp", this.inputs.eid.data, this);
      return;
    }
    
    //console.log("e", e);
    
    let state = this.inputs.state.data;
    
    if (this.inputs.unique.data) {
      state = true;
      
      //XXX evil
      for (let e of spline.selected) {
        redraw_element(e);
      }
      spline.clear_selection();
    }
    
    console.log("selectone!", e, state);
    spline.setselect(e, state);
    
    if (state && this.inputs.set_active.data) {
      spline.set_active(e);
    }
    
    if (this.inputs.flush.data) { 
      console.log("flushing data!", this.inputs.datamode.data);
      spline.select_flush(this.inputs.datamode.data);
    }
    
    //XXX evil
    redraw_element(e);
  }
}

export class ToggleSelectAllOp extends SelectOpBase {
  constructor() {
    super(undefined, undefined, "Toggle Select All");
  }
  
  static tooldef() { return {
    uiname  : "Toggle Select All",
    apiname : "spline.toggle_select_all",
    icon    : Icons.TOGGLE_SEL_ALL,
    
    inputs  : ToolOp.inherit({
    })
  }}
  
  undo_pre(ctx) {
    super.undo_pre(ctx);
    
    redraw_viewport();
  }

  exec(ctx) {
    console.log("toggle select!");
    
    let spline = ctx.spline;
    let mode = this.inputs.mode.get_data();
    let layerid = ctx.spline.layerset.active.id;
    let totsel = 0.0;

    //why this context override? - joeedh
    let iterctx = mode === SelOpModes.AUTO ? {edit_all_layers : false} : ctx;

    if (mode === SelOpModes.AUTO) {
      for (let v of spline.verts.editable(iterctx)) {
        totsel += v.flag & SplineFlags.SELECT;
      }

      for (let s of spline.segments.editable(iterctx)) {
        totsel += s.flag & SplineFlags.SELECT;
      }

      for (let f of spline.faces.editable(iterctx)) {
        totsel += f.flag & SplineFlags.SELECT;
      }

      mode = totsel ? SelOpModes.DESELECT : SelOpModes.SELECT;
    }

    console.log("MODE", mode);

    if (mode === SelOpModes.DESELECT) spline.verts.active = undefined;

    for (let v of spline.verts.editable(iterctx)) {
      v.flag |= SplineFlags.REDRAW;

      if (mode === SelOpModes.DESELECT) {
        spline.setselect(v, false);
      } else {
        spline.setselect(v, true);
      }
    }
    
    for (let s of spline.segments.editable(iterctx)) {
      s.flag |= SplineFlags.REDRAW;

      if (mode === SelOpModes.DESELECT) {
        spline.setselect(s, false);
      } else {
        spline.setselect(s, true);
      }
    }
    
    for (let f of spline.faces.editable(iterctx)) {
      f.flag |= SplineFlags.REDRAW;

      if (mode === SelOpModes.DESELECT) {
        spline.setselect(f, false);
      } else {
        spline.setselect(f, true);
      }
    }
  }
}

export class SelectLinkedOp extends SelectOpBase {
  constructor(mode, datamode) {
    super(datamode);
    
    if (mode != undefined)
      this.inputs.mode.set_data(mode);
  }
  
  static tooldef() { return {
    uiname  : "Select Linked",
    apiname : "spline.select_linked",
    
    inputs : ToolOp.inherit({
      vertex_eid : new IntProperty(-1),
    })
  }}
  
  undo_pre(ctx) {
    super.undo_pre(ctx);
    
    window.redraw_viewport();
  }
  
  exec(ToolContext ctx) {
    let spline = ctx.spline;
    
    let v = spline.eidmap[this.inputs.vertex_eid.data];
    if (v == undefined) {
      console.trace("Error in SelectLinkedOp");
      return;
    }
    
    let state = this.inputs.mode.get_data() != SelOpModes.AUTO ? 1 : 0;
    let visit = new set();
    let verts = spline.verts;
    
    function recurse(v) {
      visit.add(v);

      verts.setselect(v, state);
      
      for (let i=0; i<v.segments.length; i++) {
        let seg = v.segments[i], v2 = seg.other_vert(v);
        if (!visit.has(v2)) {
          recurse(v2);
        }
      }
    }
    
    recurse(v);
    spline.select_flush(this.inputs.datamode.data);
  }
}

//let selmode_enum = selectmode_enum.copy();
//selmode_enum.flag |= PackFlags.UI_DATAPATH_IGNORE;

export class HideOp extends SelectOpBase {
  constructor(mode, ghost) {
    super(undefined, undefined, "Hide");
    
    if (mode != undefined)
      this.inputs.selmode.set_data(mode);
    if (ghost != undefined)
      this.inputs.ghost.set_data(ghost);
  }

  static tooldef() {return {
    apiname : "spline.hide",
    uiname : "Hide",

    inputs : ToolOp.inherit({
      selmode : new IntProperty(1|2),
      ghost   : new BoolProperty(false)
    }),

    outputs : ToolOp.inherit({})
  }}

  undo_pre(ctx) {
    super.undo_pre(ctx);
    window.redraw_viewport();
  }
  
  undo(ctx) {
    let ud = this._undo;
    let spline = ctx.spline;
    
    for (let i=0; i<ud.length; i++) {
      let e = spline.eidmap[ud[i]];
      
      e.flag &= ~(SplineFlags.HIDE|SplineFlags.GHOST);
    }
    
    super.undo(ctx);
    window.redraw_viewport();
  }
  
  exec(ctx) {
    let spline = ctx.spline;
    
    let mode = this.inputs.selmode.data;
    let ghost = this.inputs.ghost.data;
    let layer = spline.layerset.active;
    
    for (let elist of spline.elists) {
      if (!(elist.type & mode)) continue;
      
      for (let e of elist.selected) {
        if (!(layer.id in e.layers))
          continue;
          
        e.sethide(true);
        
        if (ghost) {
          e.flag |= SplineFlags.GHOST;
        }
        
        elist.setselect(e, false);
      }
    }
    
    //clear actives and selection
    spline.clear_selection();
    spline.validate_active();
  }
}

export class UnhideOp extends ToolOp {
  constructor(mode, ghost) {
    super(undefined, "Unhide");
    
    if (mode != undefined)
      this.inputs.selmode.set_data(mode);
    if (ghost != undefined)
      this.inputs.ghost.set_data(ghost);
      
    this._undo = undefined;
  }

  static tooldef() {return {
    apiname : "spline.unhide",
    uiname : "Unhide",

    inputs : ToolOp.inherit({
      selmode : new IntProperty(1|2),
      ghost   : new BoolProperty(false)
    }),

    outputs : ToolOp.inherit({})
  }}

  undo_pre(ctx) {
    let ud = this._undo = [];
    let spline = ctx.spline;
     
    for (let elist of spline.elists) {
      for (let e of elist) {
        //don't use .hidden here, SplineVertex overrides it
        if (e.flag & SplineFlags.HIDE) {
          ud.push(e.eid);
          ud.push(e.flag & (SplineFlags.SELECT|SplineFlags.HIDE|SplineFlags.GHOST));
        }
      }
    }
    window.redraw_viewport();
  }
  
  undo(ctx) {
    let ud = this._undo;
    let spline = ctx.spline;
    
    let i = 0;
    while (i < ud.length) {
      let e = spline.eidmap[ud[i++]];
      let flag = ud[i++];
      
      e.flag |= flag;
      
      if (flag & SplineFlags.SELECT) 
        spline.setselect(e, selstate);
    }
    
    window.redraw_viewport();
  }
  
  exec(ctx) {
    let spline = ctx.spline;
    let layer = spline.layerset.active;
    
    let mode = this.inputs.selmode.data;
    let ghost = this.inputs.ghost.data;
    
    for (let elist of spline.elists) {
      if (!(mode & elist.type))
        continue;
        
      for (let e of elist) {
          if (!(layer.id in e.layers))
            continue;
        //if (e.hidden) { //flag & SplineFlags.HIDE) {
          if (!ghost && (e.flag & SplineFlags.GHOST))
            continue;
          
          let was_hidden = e.flag & SplineFlags.HIDE;
          
          e.flag &= ~(SplineFlags.HIDE|SplineFlags.GHOST);
          e.sethide(false);
          
          if (was_hidden)
            spline.setselect(e, true);
        //}
      }
    }
  }
}

import {CollectionProperty} from '../../core/toolprops.js';
import {ElementRefSet} from '../../curve/spline_types.js';

let _last_radius = 45;
export class CircleSelectOp extends SelectOpBase {
  constructor(datamode, do_flush=true) {
    super(datamode, do_flush, "Circle Select");
    
    if (isNaN(_last_radius) || _last_radius <= 0)
      _last_radius = 45;
    
    this.mpos = new Vector3();
    this.mdown = false;
    this.sel_or_unsel = true;
    this.radius = _last_radius;
  }

  static tooldef() { return {
    apiname  : "view2d.circle_select",
    uiname   : "Circle Select",

    //note that for the inherited mode property,
    //tablets need to ability to only add or subtract, don't switch between doing both with e.g. shift or right mouse
    inputs : ToolOp.inherit({
      add_elements : new CollectionProperty(new ElementRefSet(SplineTypes.ALL), [               SplineVertex, SplineSegment, SplineFace],
                     "elements", "Elements", "Elements"),
      sub_elements : new CollectionProperty(new ElementRefSet(SplineTypes.ALL), [               SplineVertex, SplineSegment, SplineFace],
                    "elements", "Elements", "Elements"),
    }),
  
    outputs  : ToolOp.inherit({}),
    icon     : Icons.CIRCLE_SEL,
    is_modal : true,
    description : "Select in a circle.\nRight click to deselect."
  }}
  
  start_modal(ctx) {
    this.radius = _last_radius;
    
    let mpos = ctx.view2d.mpos;
    if (mpos != undefined)
      this.on_mousemove({x : mpos[0], y : mpos[1]});
  }
  
  _draw_circle() {
    let ctx = this.modal_ctx;
    let editor = ctx.view2d;
    
    this.reset_drawlines();

    let steps = 64;
    let t = -Math.PI, dt = (Math.PI*2.0)/steps;
    let lastco = new Vector3();
    let co = new Vector3();
    
    let mpos = this.mpos;
    let radius = this.radius;
    
    for (let i=0; i<steps; i++, t += dt) {
      co[0] = sin(t)*radius + mpos[0];
      co[1] = cos(t)*radius + mpos[1];
      
      editor.unproject(co);
      
      if (i > 0) {
        let dl = this.new_drawline(lastco, co);
      }
      
      lastco.load(co);
    }

    window.redraw_viewport();
  }
  
  exec(ctx) {
    let spline=ctx.spline;
    let eset_add = this.inputs.add_elements;
    let eset_sub = this.inputs.sub_elements;
    
    eset_add.ctx = ctx;
    eset_sub.ctx = ctx;
    eset_add.data.ctx = ctx;
    eset_sub.data.ctx = ctx;
    
    //console.log("exec!");
    
    for (let e of eset_add) {
      spline.setselect(e, true);
    }
    
    for (let e of eset_sub) {
      spline.setselect(e, false);
    }
    
    if (this.inputs.flush.data) {
      spline.select_flush(this.inputs.datamode.data);
    }
  }
  
  do_sel(sel_or_unsel) {
    let datamode = this.inputs.datamode.data;
    let ctx = this.modal_ctx, spline = ctx.spline;
    let editor = ctx.view2d;
    
    let co = new Vector3();
    let eset_add = this.inputs.add_elements.data;
    let eset_sub = this.inputs.sub_elements.data;
    let actlayer = spline.layerset.active.id;

    if (datamode & SplineTypes.VERTEX) {
      for (let v of spline.verts) {
        if (v.hidden) 
          continue;
        if (!(actlayer in v.layers))
          continue;
        
        co.load(v);
        co[2] = 0.0;
        editor.project(co);

        if (co.vectorDistance(this.mpos) < this.radius) {
          if (sel_or_unsel) {
            eset_sub.remove(v);
            eset_add.add(v);
          } else {
            eset_add.remove(v);
            eset_sub.add(v);
          }
        }
      }
    } else if (datamode & SplineTypes.SEGMENT) {
    } else if (datamode & SplineTypes.FACE) {
    }
  }
  
  on_mousemove(event) {
    let ctx = this.modal_ctx;
    let spline = ctx.spline;
    let editor = ctx.view2d;
    
    this.mpos[0] = event.x;
    this.mpos[1] = event.y;

    this._draw_circle();
    //console.log("mousemove!");

    if (this.inputs.mode.get_data() != SelOpModes.AUTO) {
      this.sel_or_unsel = this.inputs.mode.get_data() == SelOpModes.SELECT;
    }

    if (this.mdown) {
      this.do_sel(this.sel_or_unsel);
      window.redraw_viewport();
    }
    
    this.exec(ctx);
  }
  
  end_modal(ctx) {
    super.end_modal(ctx);
    
    _last_radius = this.radius;
  }
  
  on_keydown(event) {
    console.log(event.keyCode);
    let ctx = this.modal_ctx;
    let spline = ctx.spline;
    let view2d = ctx.view2d;

    let radius_inc = 10;
    
    switch (event.keyCode) {
      case charmap["="]:
      case charmap["NumPlus"]:
        this.radius += radius_inc;
        this._draw_circle();
        break;
      case charmap["-"]:
      case charmap["NumMinus"]:
        this.radius -= radius_inc;
        this._draw_circle();
        break;
      case charmap["Escape"]:
      case charmap["Enter"]:
      case charmap["Space"]:
        this.end_modal();
        break;
    }
  }
  
  on_mousedown(event) {
    let auto = this.inputs.mode.get_data() == SelOpModes.AUTO;

    console.log("auto", auto);

    if (auto) {
      this.sel_or_unsel = (event.button == 0) ^ event.shiftKey;
    }

    this.mdown = true;
  }
  
  on_mouseup(event) {
    console.log("modal end!");
    this.mdown = false;
    this.end_modal();
  }
}

