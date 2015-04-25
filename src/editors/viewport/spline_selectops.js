"use strict";







#include "src/core/utildefine.js"







var PI = Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor,



    ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos,



    asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;







import {ToolOp} from 'toolops_api';



import {IntProperty, BoolProperty} from 'toolprops';



import {SplineFlags, SplineTypes, SplineVertex,



        SplineSegment, SplineFace



       } from 'spline_types';



import {redraw_element} from 'spline_draw';



import {get_vtime} from 'animdata';







export class SelectOpBase extends ToolOp {



  constructor(datamode, do_flush) {



    ToolOp.call(this);



    



    if (datamode != undefined)



      this.inputs.datamode.set_data(datamode);



    if (do_flush != undefined)



      this.inputs.flush.set_data(do_flush);



  }



  



  undo_pre(ctx) {



    var spline = ctx.spline;



    var ud = this._undo = []



    



    for (var v in spline.verts.selected) {



      ud.push(v.eid);



    }



    



    for (var h in spline.handles.selected) {



      ud.push(h.eid);



    }



    



    for (var s in spline.segments.selected) {



      ud.push(s.eid);



    }



    



    ud.active_vert = spline.verts.active != undefined ? spline.verts.active.eid : -1;



    ud.active_handle = spline.handles.active != undefined ? spline.handles.active.eid : -1;



    ud.active_segment = spline.segments.active != undefined ? spline.segments.active.eid : -1;



  }



  



  undo(ctx) {



    var ud = this._undo;



    var spline = ctx.spline;



    



    console.log(ctx, spline);



    



    spline.clear_selection();



    var eidmap = spline.eidmap;



    



    for (var i=0; i<ud.length; i++) {



      if (!(ud[i] in eidmap)) {



        console.trace("Warning, corruption in SelectOpBase.undo(): '", ud[i], "'.");



        continue;



      }



      



      var e = eidmap[ud[i]];



      spline.setselect(e, true);



    }



    



    spline.verts.active = eidmap[ud.active_vert];



    spline.handles.active = eidmap[ud.active_vert];



    spline.segments.active = eidmap[ud.active_vert];



  }



}



SelectOpBase.inputs = {



  mode : new IntProperty(0),



  datamode : new IntProperty(0), //datamode



  flush    : new BoolProperty(false)



};







export class SelectOneOp extends SelectOpBase {



  constructor(SplineElement e=undefined, unique=true, mode=true, datamode=0, do_flush=false) {



    SelectOpBase.call(this, datamode, do_flush);



    



    this.inputs.unique.set_data(unique);



    this.inputs.state.set_data(mode);



    



    if (e != undefined)



      this.inputs.eid.set_data(e.eid);



  }



  



  exec(Context ctx) {



    var spline = ctx.spline;



    var e = spline.eidmap[this.inputs.eid.data];







    //console.log("selectone!", this.inputs.eid.data);



    



    if (e == undefined) {



      console.trace("Error in SelectOneOp", this.inputs.eid.data, this);



      return;



    }



    



    //console.log("e", e);



    



    var state = this.inputs.state.data;



    



    if (this.inputs.unique.data) {



      state = true;



      



      //XXX evil



      for (var e in spline.selected) {



        redraw_element(e);



      }



      spline.clear_selection();



    }



    



    //console.log("selectone!");



    spline.setselect(e, state);



    



    if (state && this.inputs.set_active.data) {



      spline.set_active(e);



    }



    



    if (this.inputs.flush.data) { 



      spline.select_flush(this.inputs.datamode.data);



    }



    



    //XXX evil



    redraw_element(e);



  }



}







SelectOneOp.inputs = ToolOp.inherit_inputs(SelectOpBase, {



  eid        : new IntProperty(-1),



  state      : new BoolProperty(true),



  set_active : new BoolProperty(true),



  unique     : new BoolProperty(true)



});







export class ToggleSelectAllOp extends SelectOpBase {



  constructor() {



    SelectOpBase.call(this);



  }



  



  undo_pre(ctx) {



    SelectOpBase.prototype.undo_pre.call(this, ctx);



    



    redraw_viewport();



  }



  



  exec(ToolContext ctx) {



    console.log("toggle select!");



    



    var spline = ctx.spline;



    var mode = this.inputs.mode.data;



    



    if (mode == "auto") {



      var totsel = 0;



      



      spline.forEachPoint(function(v) {



        if (v.hidden) return;



        



        totsel += v.flag & SplineFlags.SELECT;



      });



      



      spline.faces.forEach(function(f) {



        totsel += f.flag & SplineFlags.SELECT;



      }, this);



      



      mode = totsel ? "sub" : "add";



    }



    



    if (mode == "sub") spline.verts.active = undefined;



    



    spline.forEachPoint(function(v) {



      if (v.hidden) return;



      



      if (mode == "sub") {



        spline.setselect(v, false);



      } else {



        spline.setselect(v, true);



      }



    });



    



    for (var s in spline.segments) {



      if (mode == "sub") {



        spline.setselect(s, false);



      } else {



        spline.setselect(s, true);



      }



    }



    



    spline.faces.forEach(function(f) {



      if (f.hidden) return;



      



      if (mode == "sub") {



        spline.setselect(f, false);



      } else {



        spline.setselect(f, true);



      }



    }, this);



  }



}







//var selmode_enum = selectmode_enum.copy();



//selmode_enum.flag |= PackFlags.UI_DATAPATH_IGNORE;







import {EnumProperty} from 'toolprops';







var mode_vals = ["select", "deselect", "auto"];



ToggleSelectAllOp.inputs = {



  mode: new EnumProperty("auto", mode_vals, "mode", "Mode", "mode")



  //selmode : selmode_enum



};







export class SelectLinkedOp extends SelectOpBase {



  constructor(mode, datamode) {



    SelectOpBase.call(this, datamode);



    



    if (mode != undefined)



      this.inputs.mode.set_data(mode);



  }



  



  undo_pre(ctx) {



    SelectOpBase.prototype.undo_pre.call(this, ctx);



    window.redraw_viewport();



  }



  



  exec(ToolContext ctx) {



    var spline = ctx.spline;



    



    var v = spline.eidmap[this.inputs.vertex_eid.data];



    if (v == undefined) {



      console.trace("Error in SelectLinkedOp");



      return;



    }



    



    var state = this.inputs.mode.data == "select" ? 1 : 0;



    var visit = new set();



    var verts = spline.verts;



    



    function recurse(v) {



      visit.add(v);







      verts.setselect(v, state);



      



      for (var i=0; i<v.segments.length; i++) {



        var seg = v.segments[i], v2 = seg.other_vert(v);



        if (!visit.has(v2)) {



          recurse(v2);



        }



      }



    }



    



    recurse(v);



    spline.select_flush(this.inputs.datamode.data);



  }



}







//var selmode_enum = selectmode_enum.copy();



//selmode_enum.flag |= PackFlags.UI_DATAPATH_IGNORE;







import {EnumProperty} from 'toolprops';







var mode_vals = ["select", "deselect"];



SelectLinkedOp.inputs = ToolOp.inherit_inputs(SelectOpBase, {



  vertex_eid : new IntProperty(-1),



  mode: new EnumProperty("select", mode_vals, "mode", "Mode", "mode")



  //selmode : selmode_enum



});







export class HideOp extends SelectOpBase {



  constructor(mode, ghost) {



    SelectOpBase.call(this);



    



    if (mode != undefined)



      this.inputs.selmode.set_data(mode);



    if (ghost != undefined)



      this.inputs.ghost.set_data(ghost);



  }



  



  undo_pre(ctx) {



    SelectOpBase.prototype.undo_pre.call(this, ctx);



    window.redraw_viewport();



  }



  



  undo(ctx) {



    var ud = this._undo;



    var spline = ctx.spline;



    



    for (var i=0; i<ud.length; i++) {



      var e = spline.eidmap[ud[i]];



      



      e.flag &= ~(SplineFlags.HIDE|SplineFlags.GHOST);



    }



    



    SelectOpBase.prototype.undo.call(this, ctx);



    window.redraw_viewport();



  }



  



  exec(ctx) {



    var spline = ctx.spline;



    



    var mode = this.inputs.selmode.data;



    var ghost = this.inputs.ghost.data;



    var layer = spline.layerset.active;



    



    for (var elist in spline.elists) {



      if (!(elist.type & mode)) continue;



      



      for (var e in elist.selected) {



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



HideOp.inputs = {



  selmode : new IntProperty(1|2),



  ghost   : new BoolProperty(false)



}







export class UnhideOp extends ToolOp {



  constructor(mode, ghost) {



    ToolOp.call(this);



    



    if (mode != undefined)



      this.inputs.selmode.set_data(mode);



    if (ghost != undefined)



      this.inputs.ghost.set_data(ghost);



      



    this._undo = undefined;



  }



  



  undo_pre(ctx) {



    var ud = this._undo = [];



    var spline = ctx.spline;



     



    for (var elist in spline.elists) {



      for (var e in elist) {



        //don't use .hidden here, SplineVertex overrides it



        if (e.flag & SplineFlags.HIDE) {



          ud.push(e.eid);



          ud.push(e.flag & SplineFlags.SELECT);



        }



      }



    }



    window.redraw_viewport();



  }



  



  undo(ctx) {



    var ud = this._undo;



    var spline = ctx.spline;



    



    var i = 0;



    while (i < ud.length) {



      var e = spline.eidmap[ud[i++]];



      var selstate = ud[i++];



      



      e.flag |= SplineFlags.HIDE;



      spline.setselect(e, selstate);



    }



    



    window.redraw_viewport();



  }



  



  exec(ctx) {



    var spline = ctx.spline;



    var layer = spline.layerset.active;



    



    var mode = this.inputs.selmode.data;



    var ghost = this.inputs.ghost.data;



    



    console.log("mode!", mode);



    for (var elist in spline.elists) {



      if (!(mode & elist.type))



        continue;



        



      for (var e in elist) {



          if (!(layer.id in e.layers))



            continue;



        //if (e.hidden) { //flag & SplineFlags.HIDE) {



          if (!ghost && (e.flag & SplineFlags.GHOST))



            continue;



          



          var was_hidden = e.flag & SplineFlags.HIDE;



          



          e.flag &= ~(SplineFlags.HIDE|SplineFlags.GHOST);



          e.sethide(false);



          



          if (was_hidden)



            spline.setselect(e, true);



        //}



      }



    }



  }



}







UnhideOp.inputs = {



  selmode : new IntProperty(1|2),



  ghost   : new BoolProperty(false)



}







import {CollectionProperty} from 'toolprops';



import {ElementRefSet} from 'spline_types';







var _last_radius = 45;



export class CircleSelectOp extends SelectOpBase {



  constructor(datamode, do_flush=true) {



    SelectOpBase.call(this, datamode, do_flush);



    



    if (isNaN(_last_radius) || _last_radius <= 0)



      _last_radius = 45;



      



    this.mpos = new Vector3();



    this.is_modal = true;



    this.mdown = false;



    this.sel_or_unsel = true;



    this.radius = _last_radius;



  }



  



  start_modal(ctx) {



    this.radius = _last_radius;



    



    var mpos = ctx.view2d.mpos;



    if (mpos != undefined)



      this.on_mousemove({x : mpos[0], y : mpos[1]});



  }



  



  _draw_circle() {



    var ctx = this.modal_ctx;



    var editor = ctx.view2d;



    



    this.reset_drawlines();



    



    var steps = 64;



    var t = -Math.PI, dt = (Math.PI*2.0)/steps;



    var lastco = new Vector3();



    var co = new Vector3();



    



    var mpos = this.mpos;



    var radius = this.radius;



    



    for (var i=0; i<steps; i++, t += dt) {



      co[0] = sin(t)*radius + mpos[0];



      co[1] = cos(t)*radius + mpos[1];



      



      editor.unproject(co);



      



      if (i > 0) {



        var dl = this.new_drawline(lastco, co);



      }



      



      lastco.load(co);



    }







    window.redraw_viewport();



  }



  



  exec(ctx) {



    var spline=ctx.spline;



    var eset_add = this.inputs.add_elements;



    var eset_sub = this.inputs.sub_elements;



    



    console.log("exec!");



    



    for (var e in eset_add) {



      spline.setselect(e, true);



    }



    



    for (var e in eset_sub) {



      spline.setselect(e, false);



    }



    



    if (this.inputs.flush.data) {



      spline.select_flush(this.inputs.datamode.data);



    }



  }



  



  do_sel(sel_or_unsel) {



    var datamode = this.inputs.datamode.data;



    var ctx = this.modal_ctx, spline = ctx.spline;



    var editor = ctx.view2d;



    



    var co = new Vector3();



    var eset_add = this.inputs.add_elements.data;



    var eset_sub = this.inputs.sub_elements.data;



    



    if (datamode & SplineTypes.VERTEX) {



      for (var v in spline.verts) {



        if (v.hidden) continue;



        



        co.load(v);



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



    var ctx = this.modal_ctx;



    var spline = ctx.spline;



    var editor = ctx.view2d;



    



    this.mpos[0] = event.x;



    this.mpos[1] = event.y;



    



    this._draw_circle();



    //console.log("mousemove!");



    



    if (this.mdown) {



      this.do_sel(this.sel_or_unsel);



    }



    



    this.exec(ctx);



  }



  



  end_modal() {



    SelectOpBase.prototype.end_modal.apply(this, arguments);



    _last_radius = this.radius;



  }



  



  on_keydown(event) {



    console.log(event.keyCode);



    var ctx = this.modal_ctx;



    var spline = ctx.spline;



    var view2d = ctx.view2d;



    



    var radius_inc = 10;



    



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



    }



  }



  



  on_mousedown(event) {



    if (event.button == 0) {



      this.sel_or_unsel = true;



      this.mdown = true;



    } else {



      this.sel_or_unsel = false;



      this.mdown = true;



    }



  }



  



  on_mouseup(event) {



    console.log("modal end!");



    this.mdown = false;



    this.end_modal();



  }



}







CircleSelectOp.prototype.is_modal = true;







CircleSelectOp.inputs = ToolOp.inherit_inputs(SelectOpBase, {



  add_elements : new CollectionProperty(new ElementRefSet(SplineTypes.ALL), [SplineVertex, SplineSegment, SplineFace],



                                  "elements", "Elements", "Elements"),



  sub_elements : new CollectionProperty(new ElementRefSet(SplineTypes.ALL), [SplineVertex, SplineSegment, SplineFace],



                                  "elements", "Elements", "Elements")



});











/*UI select flags, used so dopesheet can have independent selection from



  in-viewport geometry*/







//verts only?



export class UISelectBase extends ToolOp {



  constructor() {



    ToolOp.call(this);



  }



  



  undo_pre(ctx) {



    var spline = ctx.frameset.pathspline;



    



    var ud = this._undo = {};



    



    for (var v in spline.verts) { 



      ud[v.eid] = v.flag & SplineFlags.UI_SELECT;



    }



    



    window.redraw_ui();



  }



  



  undo(ctx) {



    var spline = ctx.frameset.pathspline;



    



    var ud = this._undo;



    for (var eid in ud) {



      var state = ud[eid];



      



      if (!!state != !!(spline.eidmap[eid].flag & SplineFlags.UI_SELECT))



        spline.eidmap[eid].dag_update("depend");



        



      if (state)



        spline.eidmap[eid].flag |= SplineFlags.UI_SELECT;



      else



        spline.eidmap[eid].flag &= ~SplineFlags.UI_SELECT;



    }



    



    window.redraw_ui();



  }



}







export class UISelectOneOp extends UISelectBase {



  constructor(v, unique=true, state=true) {



    UISelectBase.call(this);



    



    if (v != undefined)



      this.inputs.vert_eid.set_data(v.eid);



      



    this.inputs.state.set_data(state);



    this.inputs.unique.set_data(unique);



  }



  



  exec(ctx) {



    var spline = ctx.frameset.pathspline;



    



    var v = spline.eidmap[this.inputs.vert_eid.data];



    if (v == undefined) {



      console.log("v was undefined in uiselectoneop", this.inputs.vert_eid.data, this);



      return;



    }



    



    if (this.inputs.unique.data) {



      for (var v2 in spline.verts) {



        if (v2.flag & SplineFlags.UI_SELECT) {



          v2.dag_update("depend");



        }



        



        v2.flag &= ~SplineFlags.UI_SELECT;



      }



      



      v.flag |= SplineFlags.UI_SELECT;



    } else {



      if (this.inputs.state.data)



        v.flag |= SplineFlags.UI_SELECT;



      else



        v.flag &= ~SplineFlags.UI_SELECT;



    }



    



    v.dag_update("depend");



  }



}



UISelectOneOp.inputs = {



  vert_eid : new IntProperty(-1, "vert_eid"),



  state    : new BoolProperty(true, "state"),



  unique   : new BoolProperty(true, "unique")



}







export class UIColumnSelect extends UISelectBase {



  constructor() {



    UISelectBase.call(this);



  }



  



  exec(ctx) {



    var spline = ctx.frameset.pathspline;



    



    var cols = {};



    var state = this.inputs.state.data;



    



    for (var eid in this.inputs.vertex_eids.data) {



      var v = spline.eidmap[eid];



      



      if (v.flag & SplineFlags.UI_SELECT)



        cols[get_vtime(v)] = 1;



    }



    



    for (var eid in this.inputs.vertex_eids.data) {



      var v = spline.eidmap[eid];



      if (!(get_vtime(v) in cols))



        continue;



      



      if (!!state != !!(v.flag & SplineFlags.UI_SELECT))



        v.dag_update("depend");



      



      if (state)



        v.flag |= SplineFlags.UI_SELECT;



      else



        v.flag &= ~SplineFlags.UI_SELECT;



    }



  }



}







UIColumnSelect.inputs = ToolOp.inherit_inputs(UISelectBase, {



  vertex_eids : new CollectionProperty([], undefined, "vertex eids", "vertex eids"),



  state       : new BoolProperty(true, "state"),



});







export class UISelect extends UISelectBase {



  constructor() {



    UISelectBase.call(this);



  }



  



  exec(ctx) {



    var spline = ctx.frameset.pathspline;



    var state = this.inputs.state.data;



    



    if (this.inputs.unique.data) {



      for (var eid in this.inputs.vertex_eids.data) {



        var v = spline.eidmap[eid];



        



        if (v.flag & SplineFlags.UI_SELECT)



          v.dag_update("depend");



          



        v.flag &= ~SplineFlags.UI_SELECT;



      }



    }



    



    for (var eid in this.inputs.select_eids.data) {



      var v = spline.eidmap[eid];







      if (!!state != !!(v.flag & SplineFlags.UI_SELECT))



        v.dag_update("depend");



      



      if (state)



        v.flag |= SplineFlags.UI_SELECT;



      else



        v.flag &= ~SplineFlags.UI_SELECT;



    }



  }



}







UISelect.inputs = ToolOp.inherit_inputs(UISelectBase, {



  vertex_eids : new CollectionProperty([], undefined, "vertex eids", "vertex eids"),



  select_eids : new CollectionProperty([], undefined, "select eids", "select eids"),



  state       : new BoolProperty(true, "state"),



  unique   : new BoolProperty(true, "unique")



});











export class UIToggleSelectOp extends UISelectBase {



  constructor(mode="auto") {



    UISelectBase.call(this);



    



    this.inputs.mode.set_data(mode);



  }



  



  exec(ctx) {



    var pathspline = ctx.frameset.pathspline;



    var mode = this.inputs.mode.data;



    var vset = new set();



    



    for (var eid in this.inputs.vertex_eids.data) {



      vset.add(pathspline.eidmap[eid]);



    }    



    



    if (mode == "auto") {



      mode = "select";



      



      for (var v in vset) {



        if (v.flag & SplineFlags.UI_SELECT)



          mode = "deselect";



      }



    }



    



    mode = mode == "select" ? true : false;



    for (var v in vset) {



      if (!!(v.flag & SplineFlags.UI_SELECT) != mode) {



        v.dag_update("depend");



      }



      



      if (mode)



        v.flag |= SplineFlags.UI_SELECT;



      else



        v.flag &= ~SplineFlags.UI_SELECT;



    }



  }



}







UIToggleSelectOp.inputs = ToolOp.inherit_inputs(UISelectBase, {



  vertex_eids : new CollectionProperty([], undefined, "vertex eids", "vertex eids"),



  mode   : new EnumProperty("auto", mode_vals, "mode", "Mode", "mode")



});







export class UISelectKeysToSide extends UISelectBase {



  constructor() {



    UISelectBase.call(this);



  }



  



  exec(ctx) {



    var spline = ctx.frameset.pathspline;



    



    var state = this.inputs.state.data;



    var mintime = 1e17, maxtime = -1e17;



    



    console.log("Select Side");



    



    for (var eid in this.inputs.vertex_eids.data) {



      var v = spline.eidmap[eid];



      



      if (!(v.flag & SplineFlags.UI_SELECT))



        continue;







      var time = get_vtime(v);



      mintime = Math.min(mintime, time);



      maxtime = Math.max(maxtime, time);



    }



    



    console.log("Min/max time:", mintime, maxtime);



    



    if (mintime == 1e17) return;



    var side = this.inputs.side.data;



    



    for (var eid in this.inputs.vertex_eids.data) {



      var v = spline.eidmap[eid];



      var time = get_vtime(v);



      



      if ((side && time < maxtime) || (!side && time > mintime))



        continue;



      



      if (!!state != !!(v.flag & SplineFlags.UI_SELECT))



        v.dag_update("depend");



      



      if (state)



        v.flag |= SplineFlags.UI_SELECT;



      else



        v.flag &= ~SplineFlags.UI_SELECT;



    }



  }



}







UISelectKeysToSide.inputs = ToolOp.inherit_inputs(UISelectBase, {



  vertex_eids : new CollectionProperty([], undefined, "vertex eids", "vertex eids"),



  state       : new BoolProperty(true, "state"),



  side        : new BoolProperty(true, "side")



});
