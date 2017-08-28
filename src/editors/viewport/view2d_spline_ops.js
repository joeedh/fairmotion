"use strict";

import {ExtrudeVertOp} from 'spline_createops';
import {toolop_menu} from 'UIMenu';
import {DeleteVertOp, DeleteSegmentOp} from 'spline_editops';
import {CreateMResPoint} from 'multires_ops';
import * as mr_selectops from 'multires_selectops';
import * as spline_selectops from 'spline_selectops';
import {WidgetResizeOp} from 'transform_ops';

import {compose_id, decompose_id, MResFlags, MultiResLayer}
        from 'spline_multires';
        
var ScreenArea, Area;

import {get_2d_canvas, get_2d_canvas_2} from 'UICanvas';

import {gen_editor_switcher} from 'UIWidgets_special';
import {DataTypes} from 'lib_api';
import {STRUCT} from 'struct';
import {EditModes} from 'view2d_editor';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, KeyHandler, 
        charmap, TouchEventManager, EventHandler} from 'events';

import {SelectLinkedOp, SelectOneOp} from 'spline_selectops';
import {TranslateOp} from 'transform';

import {SelMask, ToolModes} from 'selectmode';
import {SplineTypes, SplineFlags, SplineVertex, 
        SplineSegment, SplineFace} from 'spline_types';
import {Spline} from 'spline';

import {ColumnFrame, RowFrame} from 'UIPack';
import {UIMenuLabel, UIButtonIcon} from 'UIWidgets';
import {UIMenu} from 'UIMenu';
import {View2DEditor, SessionFlags} from 'view2d_editor';
import {DataBlock, DataTypes} from 'lib_api';
import {redraw_element} from 'spline_draw';
import {UndoFlags, ToolFlags, ModalStates, ToolOp} from 'toolops_api';
import {PackFlags, UIFlags} from 'UIElement';

import {get_vtime} from 'animdata';

window.anim_to_playback = [];

export class RenderAnimOp extends ToolOp {
  constructor() {
    ToolOp.call(this);
  }
  
  static tooldef() {return {
    uiname   : "Render",
    apiname  : "view2d.render_anim",
    is_modal : true,
    inputs   : {},
    outputs  : {},
    undoflag : UndoFlags.IGNORE_UNDO
  }}
  
  start_modal(ctx) {
    ToolOp.prototype.start_modal.call(this, ctx);
    console.log("Anim render start!");
    
    window.anim_to_playback = [];
    window.anim_to_playback.filesize = 0;

    this.viewport = {
      pos  : [ctx.view2d.abspos[0], window.innerHeight-(ctx.view2d.abspos[1]+ctx.view2d.size[1])],
      size : [ctx.view2d.size[0], ctx.view2d.size[1]]
    }
    
    window.anim_to_playback.viewport = this.viewport;
    
    var this2 = this;
    var pathspline = ctx.frameset.pathspline;
    
    var min_time = 1e17, max_time = 0;
    
    for (var v of pathspline.verts) {
      var time = get_vtime(v);
      min_time = Math.min(min_time, time);
      max_time = Math.max(max_time, time);
    }
    
    if (min_time < 0) {
      this.end(ctx);
      return;
    }
    
    ctx.scene.change_time(ctx, min_time);
    this.min_time = min_time;
    this.max_time = max_time;
    
    this.timer = window.setInterval(function() {
      this2.render_frame();
    }, 10);
  }
  
  render_frame() {
    var ctx = this.modal_ctx;
    if (ctx == undefined || !this.modal_running) {
      console.log("Timer end")
      window.clearInterval(this.timer);
      this.end();
      return;
    }
    
    var scene = ctx.scene;
    if (scene.time >= this.max_time+25) {
        this.end(ctx);
        return;
    }
    
    console.log("rendering frame", scene.time);
    
    var vd = this.viewport;
    var canvas = document.createElement("canvas");
    canvas.width = vd.size[0], canvas.height = vd.size[1];
    
    var g1 = ctx.view2d.draw_canvas_ctx;
    var idata = g1.getImageData(vd.pos[0], vd.pos[1], vd.size[0], vd.size[1]);
    
    var g2 = canvas.getContext("2d");
    g2.putImageData(idata, 0, 0);
    
    var image = canvas.toDataURL();
    
    var frame = {
      time : scene.time,
      data : idata
    }
    
    window.anim_to_playback.push(frame);
    window.anim_to_playback.filesize += image.length;
    
    scene.change_time(ctx, scene.time+1);
    window.redraw_viewport();
  }
  
  end(ctx) {
    if (this.timer != undefined)
      window.clearInterval(this.timer);
    this.end_modal()
  }
  
  on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Escape"]:
        this.end(this.modal_ctx);
    }
  }
}


export class PlayAnimOp extends ToolOp {
  constructor() {
    ToolOp.call(this);
  }
  
  static tooldef() {return {
    uiname   : "Play",
    apiname  : "view2d.play_anim",
    is_modal : true,
    inputs   : {},
    outputs  : {},
    undoflag : UndoFlags.IGNORE_UNDO
  }}
  
  start_modal(ctx) {
    ToolOp.prototype.start_modal.call(this, ctx);
    console.log("Anim render start!");
    
    this.viewport = {
      pos  : [ctx.view2d.abspos[0], window.innerHeight-(ctx.view2d.abspos[1]+ctx.view2d.size[1])],
      size : [ctx.view2d.size[0], ctx.view2d.size[1]]
    }
    
    var this2 = this;
    var pathspline = ctx.frameset.pathspline;
    
    this.start_time = time_ms();
    
    this.timer = window.setInterval(function() {
      if (this2.doing_draw) 
        return;
      this2.render_frame();
    }, 10);
  }
  
  render_frame() {
    var ctx = this.modal_ctx;
    if (ctx == undefined || !this.modal_running) {
      console.log("Timer end")
      window.clearInterval(this.timer);
      this.end();
      return;
    }
    
    var vd = window.anim_to_playback.viewport;
    var g1 = ctx.view2d.draw_canvas_ctx;
    
    var time = time_ms() - this.start_time;
    
    time = (time / 1000.0)*24.0;
    var fi = Math.floor(time);
    
    var vd = window.anim_to_playback.viewport;
    
    var pos = ctx.view2d.abspos;
    var this2 = this;
    
    if (fi >= window.anim_to_playback.length) {
      console.log("end");
      this.end();
      window.redraw_viewport();
      
      return;
    }
    
    var frame = window.anim_to_playback[fi];
    
    this.doing_draw = true;
    var draw = function draw() {
      this2.doing_draw = false;
      
      //g1.beginPath();
      //g1._rect(pos[0], window.innerHeight-(pos[1]+vd.size[1]), vd.size[0], vd.size[1]);
      //g1.fillStyle = "red";
      //g1.fill();
      //g1.stroke();
      
      if (frame != undefined) {
        if (g1._putImageData != undefined)
          g1._putImageData(frame.data, pos[0], window.innerHeight-(pos[1]+vd.size[1]));
        else
          g1.putImageData(frame.data, pos[0], window.innerHeight-(pos[1]+vd.size[1]));
      }
    }
    
    requestAnimationFrame(draw);
  }
  
  end(ctx) {
    if (this.timer != undefined)
      window.clearInterval(this.timer);
    this.end_modal()
  }
  
  on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Escape"]:
        this.end(this.modal_ctx);
    }
  }
}

export class SplineEditor extends View2DEditor {
  constructor(view2d) {
    var keymap = new KeyMap();
    View2DEditor.call(this, "Geometry", EditModes.GEOMETRY, DataTypes.FRAMESET, keymap);
    
    this.mpos = new Vector3();
    this.start_mpos = new Vector3();
    
    this.define_keymap();
    this.vieiw3d = view2d;
    
    this.highlight_spline = undefined;
  }

  on_area_inactive(view2d) {
  }

  editor_duplicate(view2d) {
    var m = new SplineEditor(view2d);
    
    m.selectmode = this.selectmode;
    m.keymap = this.keymap;
    
    return m;
  }

  static fromSTRUCT(reader) {
    var m = new SplineEditor(undefined);
    reader(m);
    
    return m;
  }

  data_link(block, getblock, getblock_us) {
    this.ctx = new Context();
  }
  
  add_menu(View2DHandler view2d, Array<float> mpos, Boolean add_title=true) {
    this.ctx = new Context();
    
    console.log("Add menu")
     
    var oplist = [] //XXX "mesh.add_cube()", "mesh.add_circle()"]
    var menu = toolop_menu(view2d.ctx, add_title ? "Add" : "", oplist);
    
    return menu;
  }
  
  on_tick(ctx) {
    if (ctx.view2d.toolmode == ToolModes.RESIZE) {
      ctx.view2d.widgets.ensure_toolop(ctx, WidgetResizeOp);
    } else {
      ctx.view2d.widgets.ensure_not_toolop(ctx, WidgetResizeOp);
    }
  }
 
  build_sidebar1(View2DHandler view2d, RowFrame panel) {
    var ctx = new Context();
    
    var the_row = new RowFrame(ctx);

    the_row.packflag |= PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT;
    the_row.default_packflag = PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
    the_row.draw_background = true;
    the_row.rcorner = 100.0
    the_row.pos = [0, 2]
    the_row.size = [Area.get_barhgt()*2.0+16, view2d.size[1]];
    
    the_row.default_packflag |= PackFlags.USE_LARGE_ICON;
    the_row.default_packflag &= ~PackFlags.USE_SMALL_ICON;
    
    var col = the_row.col();
    col.toolop("spline.make_edge()");
    col.toolop("spline.make_edge_face()");
    
    var col = the_row.col();
    
    view2d.cols.push(the_row);
    view2d.add(the_row);
  }  
  
  build_bottombar(view2d) {
    var ctx = new Context();

    var the_row = new RowFrame(ctx);

    the_row.packflag |= PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT;
    the_row.default_packflag = PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
    
    the_row.draw_background = true;
    
    the_row.rcorner = 100.0
    the_row.size = [view2d.size[0], Area.get_barhgt() + 4];
    the_row.pos = [0, 0]; //view2d.size[0]-the_row.size[0]-Area.get_barhgt()-2]
    
    var col = the_row.col();
    
    //col.packflag |= PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT;
    //col.default_packflag = PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
    
    col.add(gen_editor_switcher(this.ctx, view2d));
    var prop = col.prop("view2d.selectmode", 
                        PackFlags.USE_SMALL_ICON|PackFlags.ENUM_STRIP);
                        
    prop.packflag |= PackFlags.USE_ICON|PackFlags.ENUM_STRIP;
    
    //col.prop("view2d.draw_video");
    
    col.prop('view2d.default_stroke', PackFlags.COLOR_BUTTON_ONLY);
    //col.prop('view2d.default_fill', PackFlags.COLOR_BUTTON_ONLY);

    col.prop('view2d.edit_all_layers');

    view2d.rows.push(the_row);
    view2d.add(the_row);
  }

  define_keymap() {
    var k = this.keymap;
    
    k.add_tool(new KeyHandler("PageUp", [], "Send Face Up"), 
               "spline.change_face_z(offset=1, selmode=selectmode)");
    k.add_tool(new KeyHandler("PageDown", [], "Send Face Down"), 
               "spline.change_face_z(offset=-1, selmode=selectmode)");

    k.add_tool(new KeyHandler("G", [], "Translate"), 
               "spline.translate(datamode=selectmode)");
    k.add_tool(new KeyHandler("S", [], "Scale"), 
               "spline.scale(datamode=selectmode)");
    k.add_tool(new KeyHandler("S", ["SHIFT"], "Scale Time"), 
               "spline.shift_time()");
               
    k.add_tool(new KeyHandler("R", [], "Rotate"), 
               "spline.rotate(datamode=selectmode)");
    
    k.add_tool(new KeyHandler("A", [], "Select Linked"), "spline.toggle_select_all()");
    /*
    k.add(new KeyHandler("A", [], "Toggle Select"), new FuncKeyHandler(function(ctx) {
      var view2d = ctx.view2d;
      var selectmode = view2d.selectmode;
      
      if (selectmode == SelMask.MULTIRES) {
        var tool = new mr_selectops.ToggleSelectAll();
        g_app_state.toolstack.exec_tool(tool);
      } else if (selectmode & SelMask.MULTIRES) {
        var tool = new mr_selectops.ToggleSelectAll();
        g_app_state.toolstack.exec_tool(tool);

        var tool = new spline_selectops.ToggleSelectAllOp();
        g_app_state.toolstack.exec_tool(tool);
      } else {
        var tool = new spline_selectops.ToggleSelectAllOp();
        g_app_state.toolstack.exec_tool(tool);
      }
    }));*/

    k.add_tool(new KeyHandler("A", ["ALT"], "Animation Playback"), 
               "editor.playback()");

    k.add_tool(new KeyHandler("H", [], "Hide Selection"), 
               "spline.hide(selmode=selectmode)");
    k.add_tool(new KeyHandler("H", ["ALT"], "Reveal Selection"), 
               "spline.unhide(selmode=selectmode)");

    k.add_tool(new KeyHandler("G", ["CTRL"], "Ghost Selection"), 
               "spline.hide(selmode=selectmode, ghost=1)");
    k.add_tool(new KeyHandler("G", ["ALT"], "Unghost Selection"), 
               "spline.unhide(selmode=selectmode, ghost=1)");
    
    /*k.add_tool(new KeyHandler("C", [], "Connect Handles"), 
               "spline.connect_handles()");
    k.add_tool(new KeyHandler("C", ["SHIFT"], "Disconnect Handles"), 
               "spline.disconnect_handles()");
    */

    
    k.add(new KeyHandler("L", [], "Select Linked"), new FuncKeyHandler(function(ctx) {
      var mpos = ctx.keymap_mpos;
      var ret = ctx.spline.q.findnearest_vert(ctx.view2d, mpos, 55, undefined, ctx.view2d.edit_all_layers);
      
      console.log("select linked", ret);

      if (ret != undefined) {
        var tool = new SelectLinkedOp(true, ctx.view2d.selectmode);
        tool.inputs.vertex_eid.set_data(ret[0].eid);
        tool.inputs.mode.set_data("select");
        
        ctx.appstate.toolstack.exec_tool(tool);
      }
    }));
    
    var this2 = this;
    //cycle through select modes
    k.add(new KeyHandler("T", [], "Cycle Select Mode"), new FuncKeyHandler(function(ctx) {
      var s = ctx.view2d.selectmode, s2;
      
      if (s == SelMask.VERTEX)
        s2 = SelMask.SEGMENT;
      else if (s == SelMask.SEGMENT)
        s2 = SelMask.FACE;
      else 
        s2 = SelMask.VERTEX;
      
      console.log("toggle select mode", s, s2, SelMask.SEGMENT,  SelMask.FACE);
      console.log(s == SelMask.VERTEX, s == (SelMask.VERTEX|SelMask.HANDLE), (s == SelMask.SEGMENT));
      ctx.view2d.set_selectmode(s2);
    }));
    
    k.add(new KeyHandler("L", ["SHIFT"], "Select Linked"), new FuncKeyHandler(function(ctx) {
      var mpos = ctx.keymap_mpos;
      var ret = ctx.spline.q.findnearest_vert(ctx.view2d, mpos, 55, undefined, ctx.view2d.edit_all_layers);
      
      if (ret != undefined) {
        var tool = new SelectLinkedOp(true);
        tool.inputs.vertex_eid.set_data(ret[0].eid);
        tool.inputs.mode.set_data("deselect");
        
        ctx.appstate.toolstack.exec_tool(tool);
      }
    }));
              
    k.add_tool(new KeyHandler("B", [], "Toggle Break-Tangents"),
              "spline.toggle_break_tangents()");
    k.add_tool(new KeyHandler("B", ["SHIFT"], "Toggle Break-Curvature"),
              "spline.toggle_break_curvature()");
    
    var this2 = this;
    function del_tool(ctx) {
      console.log("delete");
      
      if (this2.selectmode & SelMask.SEGMENT) {
        console.log("kill segments");
        
        var op = new DeleteSegmentOp();
        g_app_state.toolstack.exec_tool(op);
      } else if (this2.selectmode & SelMask.FACE) {
        console.log("kill faces");
        
        var op = new DeleteFaceOp();
        g_app_state.toolstack.exec_tool(op);
      } else {
        console.log("kill verts");
        
        var op = new DeleteVertOp();
        g_app_state.toolstack.exec_tool(op);
      }
    }
    
    k.add(new KeyHandler("X", [], "Delete"), new FuncKeyHandler(del_tool));
    k.add(new KeyHandler("Delete", [], "Delete"), new FuncKeyHandler(del_tool));
    k.add(new KeyHandler("Backspace", [], "Delete"), new FuncKeyHandler(del_tool));

    k.add_tool(new KeyHandler("D", [], "Dissolve Vertices"), "spline.dissolve_verts()");
    k.add_tool(new KeyHandler("D", ["SHIFT"], "Duplicate"), "spline.duplicate_transform()");
    k.add_tool(new KeyHandler("F", [], "Create Face/Edge"), "spline.make_edge_face()");
    k.add_tool(new KeyHandler("E", [], "Split Segments"), "spline.split_edges()");

    k.add_tool(new KeyHandler("M", [], "Mirror Verts"), "spline.mirror_verts()");

    k.add_tool(new KeyHandler("C", [], "Circle Select"), "view2d.circle_select()");

    k.add(new KeyHandler("Z", [], "Toggle Only Render"), new FuncKeyHandler(function(ctx) {
      ctx.view2d.only_render ^= 1;
      window.redraw_viewport();
    }));
    
    k.add(new KeyHandler("W", [], "Tools Menu"), new FuncKeyHandler(function(ctx) {
      var mpos = ctx.keymap_mpos;
      ctx.view2d.tools_menu(ctx, mpos);
    }));
  }

  set_selectmode(int mode) {
    this.selectmode = mode;
  }

  //returns number of selected items
  do_select(event, mpos, view2d, do_multiple=false) {
    //console.log("XXX do_select!", mpos);
    
    return false;
  }

  tools_menu(ctx, mpos, view2d) {
    static ops = [
      "spline.key_edges()",
      "spline.key_current_frame()",
      "spline.connect_handles()",
      "spline.disconnect_handles()",
      "spline.toggle_step_mode()",
      "spline.toggle_manual_handles()",
      "editor.paste_pose()",
      "editor.copy_pose()"
    ];
    
    var menu = view2d.toolop_menu(ctx, "Tools", ops);
    
    view2d.call_menu(menu, view2d, mpos);
  }

  on_inactive(view2d) {
  }
  
  on_active(view2d) {
  }
  
  rightclick_menu(event, view2d) {
  }

  _get_spline() {
    return this.ctx.spline;
  }
  
  on_mousedown(event) {
    var spline = this.ctx.spline;
    var toolmode = this.ctx.view2d.toolmode;
    
    if (this.highlight_spline != undefined) {
      //console.log(this.highlight_spline, this.highlight_spline._debug_id, spline._debug_id);
    }
    
    if (this.highlight_spline != undefined && this.highlight_spline !== spline) {
      var newpath;
      
      console.log("spline switch!");
      
      if (this.highlight_spline.is_anim_path) {
        newpath = "frameset.pathspline";
      } else {
        newpath = "frameset.drawspline";
      }
      
      console.log(spline._debug_id, this.highlight_spline._debug_id);
      console.log("new path!", G.active_splinepath, newpath); //, this.highlight_spline);
      
      this.ctx.switch_active_spline(newpath);
      spline = this._get_spline();
      
      redraw_viewport();
    }
    
    //console.log("spline", spline._debug_id, this.ctx.frameset.spline._debug_id);
    
    if ("size" in spline && spline[0] != window.innerWidth && spline[1] != window.innerHeight) {
      spline.size[0] = window.innerWidth
      spline.size[1] = window.innerHeight;
      //redraw_viewport();
    }
    
    //console.log("DDD", spline.verts.highlight, G.active_splinepath);
    
    if (event.button == 0) {
      var can_append = toolmode == ToolModes.APPEND;
      
      can_append = can_append && (this.selectmode & (SelMask.VERTEX|SelMask.HANDLE));
      can_append = can_append && spline.verts.highlight == undefined && spline.handles.highlight == undefined;
      
      if (can_append) {
        var co = new Vector3([event.x, event.y, 0]);
        this.view2d.unproject(co);
        
        var op = new ExtrudeVertOp(co, this.ctx.view2d.extrude_mode);
        op.inputs.linewidth.set_data(this.ctx.view2d.default_linewidth);
        op.inputs.stroke.set_data(this.ctx.view2d.default_stroke);
        
        g_app_state.toolstack.exec_tool(op);
        redraw_viewport();
      }  else if (can_append && (this.selectmode & SelMask.MULTIRES)) {
        var ret = this.findnearest([event.x, event.y, 0], SelMask.MULTIRES, this.ctx.view2d.edit_all_layers);
        
        console.log(ret);
        
        if (ret != undefined) {
          var seg = decompose_id(ret[1])[0];
          var p = decompose_id(ret[1])[1];
          
          var spline = ret[0];
          seg = spline.eidmap[seg];
          
          var mr = seg.cdata.get_layer(MultiResLayer);
          p = mr.get(p);
          
          var tool = new mr_selectops.SelectOneOp(ret[1], !event.shiftKey, 
                            !event.shiftKey || !(p.flag & MResFlags.SELECT), 
                            spline.actlevel);
          
          g_app_state.toolstack.exec_tool(tool);
        } else {
          this.mres_make_point(event, 75);
          redraw_viewport([-1000, -1000], [1000, 1000]);
        }
      } else {
        for (var i=0; i<spline.elists.length; i++) {
          var list = spline.elists[i];
          
          //console.log("  -", list.highlight == undefined);
          
          if (list.highlight == undefined)
            continue;
            
          var op = new SelectOneOp(list.highlight, !event.shiftKey, 
                                  !(list.highlight.flag & SplineFlags.SELECT),
                                  this.selectmode, true);
          //console.log("exec selectoneop op");
          
          g_app_state.toolstack.exec_tool(op);
          break;
          //redraw_viewport();
        }
      }
      
      this.start_mpos[0] = event.x; this.start_mpos[1] = event.y; this.start_mpos[2] = 0.0;
      this.mdown = true;
    }
  }

  ensure_paths_off() {
    if (g_app_state.active_splinepath != "frameset.drawspline") {
      this.highlight_spline = undefined;
      var spline = this.ctx.spline;
      
      g_app_state.switch_active_spline("frameset.drawspline");
      
      spline.clear_highlight();
      spline.solve();
      redraw_viewport();
    }
  }
  
  get draw_anim_paths() {
    return this.ctx.view2d.draw_anim_paths;
  }
  
  //returns [spline, element, mindis]
  findnearest(mpos, selectmask, limit, ignore_layers) {
    var frameset = this.ctx.frameset;
    var editor = this.ctx.view2d;
    
    var closest = [0, 0, 0];
    var mindis = 1e17;
    
    var found = false;
    
    //note that limit parameter (maximum distance from mpos) is enforced
    //by spline.q.findnearest (see spline_query.js)
    
    if (!this.draw_anim_paths) {
      this.ensure_paths_off();
      
      var ret = this.ctx.spline.q.findnearest(editor, mpos, selectmask, limit, ignore_layers);
      if (ret != undefined) {
        return [this.ctx.spline, ret[0], ret[1]];
      } else {
        return undefined;
      }
    }
    
    //console.log("\n");
    
    var actspline = this.ctx.spline;
    var pathspline = this.ctx.frameset.pathspline;
    var drawspline = this.ctx.frameset.spline;
    
    var ret = drawspline.q.findnearest(editor, mpos, selectmask, limit, ignore_layers);
    if (ret != undefined && ret[1] < limit) {
      mindis = ret[1] - (drawspline === actspline ? 3 : 0);
      found = true;
      
      closest[0] = drawspline;
      closest[1] = ret[0];
      closest[2] = mindis;
    }
    
    //for (var spline in frameset._selected_splines) {
    var ret = frameset.pathspline.q.findnearest(editor, mpos, selectmask, limit, false);
    if (ret != undefined) {
      ret[1] -= pathspline === actspline ? 2 : 0;
      
      if (ret[1] < limit && ret[1] < mindis) {
        closest[0] = pathspline;
        closest[1] = ret[0];
        closest[2] = ret[1] - (pathspline === actspline ? 3 : 0);
        
        mindis = ret[1];
        found = true;
      }
    }
    
    if (!found)
      return undefined;
    
    return closest;
  }
  
  mres_make_point(event, limit) {
    console.log("make point");
     
    var view2d = this.ctx.view2d;
    var co = new Vector3([event.x, event.y, 0]);
    
    view2d.reset_drawlines("mres")
    view2d.unproject(co);
    
    var ret = this.findnearest([event.x, event.y, 0], SelMask.SEGMENT, limit, this.ctx.view2d.edit_all_layers);
    if (ret == undefined) return;
    
    var spline = ret[0];
    var seg = ret[1];
    
    var p = seg.closest_point(co);
    
    if (p == undefined) 
      return;
      
    console.log(p);
    
    var tool = new CreateMResPoint(seg, co);
    g_app_state.toolstack.exec_tool(tool);
  }
  
  handle_mres_mousemove(event, limit) {
    var view2d = this.ctx.view2d;
    var co = new Vector3([event.x, event.y, 0]);
    
    view2d.reset_drawlines("mres")
    view2d.unproject(co);
    
    var pid = this.findnearest([event.x, event.y, 0], SelMask.MULTIRES, limit);
    
    static rect = [new Vector3(), new Vector3()];
    
    if (pid != undefined) {
      var spline = pid[0];
      var seg = decompose_id(pid[1]), p;
      p = seg[1], seg = seg[0];
      
      seg = spline.eidmap[seg];
      
      if (seg == undefined) {
        console.log("ERROR: CORRUPTED MRES DATA!");
      }
      
      var mr = seg.cdata.get_layer(MultiResLayer);
      
      for (var seg2 of spline.segments) {
        var mr2 = seg2.cdata.get_layer(MultiResLayer);
        
        for (var p2 of mr2.points(spline.actlevel)) {
          p2.flag &= ~MResFlags.HIGHLIGHT;
        }
      }
      
      p = mr.get(p);
      p.flag |= MResFlags.HIGHLIGHT;
      
      rect[0].load(p).subScalar(10);
      rect[1].load(p).addScalar(10);
      rect[0][2] = rect[1][2] = 0.0;
      
      window.redraw_viewport(rect[0], rect[1]);
    }
    
    var ret = this.findnearest([event.x, event.y, 0], SelMask.SEGMENT, limit);

    if (ret != undefined) {
      var spline = ret[0];
      var seg = ret[1];
      
      var p = seg.closest_point(co);
      if (p == undefined) 
        return;
        
      var dl = view2d.make_drawline(co, p[0], "mres");
    }
    
   // window.redraw_viewport();
  }
  
  on_mousemove(event) {
    if (this.ctx == undefined) return;

    var toolmode = this.ctx.view2d.toolmode;
    
    var selectmode = this.selectmode;
    var limit = selectmode & SelMask.SEGMENT ? 55 : 12;

    if (toolmode == ToolModes.SELECT) limit *= 3;
    
    var spline = this.ctx.spline;
    spline.size = [window.innerWidth, window.innerHeight];
    
    this.mpos[0] = event.x, this.mpos[1] = event.y, this.mpos[2] = 0.0;
    
    var selectmode = this.selectmode;
    
    //find closest
    if (selectmode & SelMask.MULTIRES) {
       this.handle_mres_mousemove(event, 75);
    }
    
    if (this.mdown) { // && this.mpos.vectorDistance(this.start_mpos) > 2) {
      this.mdown = false;

      var op = new TranslateOp(this.start_mpos);
      op.inputs.datamode.set_data(this.ctx.view2d.selectmode);
      op.inputs.edit_all_layers.set_data(this.ctx.view2d.edit_all_layers);

      var ctx = new Context();
      
      if (ctx.view2d.session_flag & SessionFlags.PROP_TRANSFORM) {
        op.inputs.proportional.set_data(true);
        op.inputs.propradius.set_data(ctx.view2d.propradius);
      }
      
      g_app_state.toolstack.exec_tool(op);
      return;
    }
    
    if (this.mdown)
      return;
    
    var ret = this.findnearest([event.x, event.y], this.ctx.view2d.selectmode, limit, this.ctx.view2d.edit_all_layers);
    //console.log(ret);
    
    
    if (ret != undefined && typeof(ret[1]) != "number" && ret[2] != SelMask.MULTIRES) {
      //console.log(ret[1].type);
      
      if (this.highlight_spline != undefined) {
        for (var list of this.highlight_spline.elists) {
          if (list.highlight != undefined) {
            redraw_element(list.highlight, this.view2d);
          }
        }
      }
      
      if (ret[0] !== this.highlight_spline && this.highlight_spline != undefined) {
        this.highlight_spline.clear_highlight();
      }
      
      this.highlight_spline = ret[0];
      this.highlight_spline.clear_highlight();
      
      var list = this.highlight_spline.get_elist(ret[1].type);
      if (!list._has_d) {
        /*
        Object.defineProperty(list, "highlight", {
          enumerable : true,
          get : function() {
            return this._highlight;
          },
          
          set : function(val) {
            if (val == undefined && this._highlight != undefined) {
              console.log("  off");
            }
            if (val != undefined && this._highlight == undefined) {
              console.log("  on");
            }
            this._highlight = val;
          }
        });
        list._has_d = true;
        */
      }
      
      //console.log("SPLINE", ret[0]._debug_id, "PARENTV", ret[0].parent_veid);
      
      list.highlight = ret[1];
      redraw_element(list.highlight, this.view2d);
      
      //redraw_viewport();
      //console.log(list === ret[0].verts);
    } else {
      if (this.highlight_spline != undefined) {
        for (var i=0; i<this.highlight_spline.elists.length; i++) {
          var list = this.highlight_spline.elists[i];
          if (list.highlight != undefined) {
            redraw_element(list.highlight, this.view2d);
          }
        }
        
        this.highlight_spline.clear_highlight();
      }
    }
  }

  on_mouseup(event) {
    var spline = this._get_spline();
    spline.size = [window.innerWidth, window.innerHeight];
    
    this.mdown = false;
  }

  do_alt_select(event, mpos, view2d) {
  }

  gen_edit_menu(Boolean add_title=false) {
    var view2d = this.view2d;
    var ctx = new Context();
    
    var ops = [
      "spline.select_linked(vertex_eid=active_vertex())",
      "view2d.circle_select()",
      "spline.toggle_select_all()",
      "spline.hide()",
      "spline.unhide()",
      "spline.connect_handles()",
      "spline.disconnect_handles()",
      "spline.duplicate_transform()",
      "spline.mirror_verts()",
      "spline.split_edges()",
      "spline.make_edge_face()",
      "spline.dissolve_verts()",
      "spline.delete_verts()",
      "spline.delete_segments()",
      "spline.delete_faces()",
      "spline.split_edges()",
      "spline.toggle_manual_handles()"
    ];
    ops.reverse();
    
    var menu = view2d.toolop_menu(ctx, add_title ? "Edit" : "", ops);
    return menu;
  }
  
  delete_menu(event) {
    var view2d = this.view2d;
    var ctx = new Context();
    
    var menu = this.gen_delete_menu(true);
    
    menu.close_on_right = true
    menu.swap_mouse_button = 2;
    
    view2d.call_menu(menu, view2d, [event.x, event.y]);
  }
}

SplineEditor.STRUCT = """
  SplineEditor {
    selectmode : int;
  }
"""

import {ScreenArea, Area} from 'ScreenArea';
