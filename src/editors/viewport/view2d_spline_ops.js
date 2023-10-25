"use strict";

/*** THIS FILE IS OUTDATED AND NO LONGER USED, see ./toolmodes/splinetool.js****/

import {ExtrudeVertOp} from './spline_createops.js';
import * as spline_selectops from './spline_selectops.js';
import {WidgetResizeOp, WidgetRotateOp} from './transform_ops.js';

import {DataTypes} from '../../core/lib_api.js';
import {EditModes} from './view2d_editor.js';
let EditModes2 = EditModes;

import {KeyMap, HotKey} from '../../core/keymap.js';

import {charmap} from '../events.js';

import {SelectLinkedOp, SelectOneOp} from './spline_selectops.js';
import {TranslateOp} from './transform.js';

import {SelMask, ToolModes} from './selectmode.js';
import {SplineTypes, SplineFlags} from '../../curve/spline_types.js';

import {View2DEditor, SessionFlags} from './view2d_editor.js';
import {DataBlock, DataTypes} from '../../core/lib_api.js';
import {redraw_element} from '../../curve/spline_draw.js';
import {UndoFlags, ToolFlags, ModalStates, ToolOp, ToolMacro} from '../../core/toolops_api.js';

import {get_vtime} from '../../core/animdata.js';

import {DeleteVertOp, DeleteSegmentOp, DeleteFaceOp,
  ChangeFaceZ, SplitEdgeOp, DuplicateOp,
  DisconnectHandlesOp, SplitEdgePickOp} from './spline_editops.js';

window.anim_to_playback = [];

export class DuplicateTransformMacro extends ToolMacro {
  constructor() {
    super("duplicate_transform", "Duplicate");
  }

  static invoke(ctx, args) {
    let tool = new DuplicateOp();
    let macro = new DuplicateTransformMacro();
    
    macro.add(tool);

    let transop = new TranslateOp(ctx.view2d.mpos, 1|2);
    macro.add(transop);

    return macro;
  }

  static tooldef() {return {
    uiname   : "Duplicate",
    toolpath  : "spline.duplicate_transform",
    is_modal : true,
    icon : Icons.DUPLICATE,
    description : "Duplicate geometry"
  }}
};

export class RenderAnimOp extends ToolOp {
  constructor() {
    super();
  }
  
  static tooldef() {return {
    uiname   : "Render",
    toolpath  : "view2d.render_anim",
    is_modal : true,
    inputs   : {},
    outputs  : {},
    undoflag : UndoFlags.NO_UNDO
  }}
  
  start_modal(ctx) {
    super.start_modal(ctx);
    console.log("Anim render start!");
    
    window.anim_to_playback = [];
    window.anim_to_playback.filesize = 0;

    this.viewport = {
      pos  : [ctx.view2d.pos[0], window.innerHeight-(ctx.view2d.pos[1]+ctx.view2d.size[1])],
      size : [ctx.view2d.size[0], ctx.view2d.size[1]]
    }
    
    window.anim_to_playback.viewport = this.viewport;
    
    let this2 = this;
    let pathspline = ctx.frameset.pathspline;
    
    let min_time = 1e17, max_time = 0;
    
    for (let v of pathspline.verts) {
      let time = get_vtime(v);
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
    let ctx = this.modal_ctx;
    if (ctx === undefined || !this.modalRunning) {
      console.log("Timer end")
      window.clearInterval(this.timer);
      this.end();
      return;
    }
    
    let scene = ctx.scene;
    if (scene.time >= this.max_time+25) {
        this.end(ctx);
        return;
    }
    
    console.log("rendering frame", scene.time);
    
    let vd = this.viewport;
    let canvas = document.createElement("canvas");
    canvas.width = vd.size[0], canvas.height = vd.size[1];
    
    let g1 = ctx.view2d.draw_canvas_ctx;
    let idata = g1.getImageData(vd.pos[0], vd.pos[1], vd.size[0], vd.size[1]);
    
    let g2 = canvas.getContext("2d");
    g2.putImageData(idata, 0, 0);
    
    let image = canvas.toDataURL();
    
    let frame = {
      time : scene.time,
      data : idata
    }
    
    window.anim_to_playback.push(frame);
    window.anim_to_playback.filesize += image.length;
    
    scene.change_time(ctx, scene.time+1);
    window.redraw_viewport();
  }
  
  end(ctx) {
    if (this.timer !== undefined)
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
    super();
  }
  
  static tooldef() {return {
    uiname   : "Play",
    toolpath  : "view2d.play_anim",
    is_modal : true,
    inputs   : {},
    outputs  : {},
    undoflag : UndoFlags.NO_UNDO
  }}
  
  start_modal(ctx) {
    super.start_modal(ctx);
    console.log("Anim render start!");
    
    this.viewport = {
      pos  : [ctx.view2d.pos[0], window.innerHeight-(ctx.view2d.pos[1]+ctx.view2d.size[1])],
      size : [ctx.view2d.size[0], ctx.view2d.size[1]]
    }
    
    let this2 = this;
    let pathspline = ctx.frameset.pathspline;
    
    this.start_time = time_ms();
    
    this.timer = window.setInterval(function() {
      if (this2.doing_draw)
        return;
      this2.render_frame();
    }, 10);
  }
  
  render_frame() {
    let ctx = this.modal_ctx;
    if (ctx === undefined || !this.modalRunning) {
      console.log("Timer end")
      window.clearInterval(this.timer);
      this.end();
      return;
    }
    
    let vd = window.anim_to_playback.viewport;
    let g1 = ctx.view2d.draw_canvas_ctx;
    
    let time = time_ms() - this.start_time;
    
    time = (time / 1000.0)*24.0;
    let fi = Math.floor(time);
    
    vd = window.anim_to_playback.viewport;
    
    let pos = ctx.view2d.pos;
    let this2 = this;
    
    if (fi >= window.anim_to_playback.length) {
      console.log("end");
      this.end();
      window.redraw_viewport();
      
      return;
    }
    
    let frame = window.anim_to_playback[fi];
    
    this.doing_draw = true;
    let draw = function draw() {
      this2.doing_draw = false;
      
      //g1.beginPath();
      //g1._rect(pos[0], window.innerHeight-(pos[1]+vd.size[1]), vd.size[0], vd.size[1]);
      //g1.fillStyle = "red";
      //g1.fill();
      //g1.stroke();
      
      if (frame !== undefined) {
        if (g1._putImageData !== undefined)
          g1._putImageData(frame.data, pos[0], window.innerHeight-(pos[1]+vd.size[1]));
        else
          g1.putImageData(frame.data, pos[0], window.innerHeight-(pos[1]+vd.size[1]));
      }
    }
    
    requestAnimationFrame(draw);
  }
  
  end(ctx) {
    if (this.timer !== undefined)
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

import {EditorTypes} from './view2d_base.js';

export class SplineEditor extends View2DEditor {
  mpos : Vector3
  start_mpos : Vector3;

  constructor(view2d) {
    let keymap = new KeyMap("view2d:splinetool2");
    super("Geometry", EditorTypes.SPLINE, EditModes2.GEOMETRY, DataTypes.FRAMESET, keymap);
    
    this.mpos = new Vector3();
    this.start_mpos = new Vector3();
    
    this.define_keymap();
    this.vieiw3d = view2d;
    
    this.highlight_spline = undefined;
  }

  on_area_inactive(view2d) {
  }

  editor_duplicate(view2d) {
    let m = new SplineEditor(view2d);
    
    m.selectmode = this.selectmode;
    m.keymap = this.keymap;
    
    return m;
  }

  loadSTRUCT(reader) {
    reader(this);

  }

  static fromSTRUCT(reader) {
    let m = new SplineEditor(undefined);
    reader(m);
    
    return m;
  }

  data_link(block, getblock, getblock_us) {
    this.ctx = new Context();
  }
  
  add_menu( view2d : View2DHandler,  mpos : Array<float>,  add_title : Boolean=true) {
    this.ctx = new Context();
    
    console.log("Add menu")
    
    let oplist = [] //XXX "mesh.add_cube()", "mesh.add_circle()"]
    let menu = toolop_menu(view2d.ctx, add_title ? "Add" : "", oplist);
    
    return menu;
  }
  
  on_tick(ctx) {
    let widgets = [WidgetResizeOp, WidgetRotateOp];
    
    if (ctx.view2d.toolmode === ToolModes.RESIZE) {
      ctx.view2d.widgets.ensure_toolop(ctx, WidgetResizeOp);
    } else if (ctx.view2d.toolmode === ToolModes.ROTATE) {
      ctx.view2d.widgets.ensure_toolop(ctx, WidgetRotateOp);
    } else {
      for (let cls of widgets) {
        ctx.view2d.widgets.ensure_not_toolop(ctx, cls);
      }
    }
  }

  build_sidebar1(view2d : View2DHandler, col : RowFrame) {
    console.trace("build_sidebar1");
    
    let ctx = new Context();
  
    col.packflag |= PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT|PackFlags.INHERIT_WIDTH;
    col.default_packflag = PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
    col.draw_background = true;
    col.rcorner = 100.0
    
    col.default_packflag |= PackFlags.USE_LARGE_ICON;
    col.default_packflag &= ~PackFlags.USE_SMALL_ICON;
    
    //stupid blank spacer hack
    let blank = new UIFrame(this.ctx);
    blank.size[0] = 70;
    blank.size[1] = 1;
    blank.get_min_size = function() { return this.size;};
    
    col.add(blank)
  
    //col.default_packflag |= PackFlags.USE_ICON;
    
    col.toolop("spline.make_edge()");
    col.toolop("spline.make_edge_face()");
    
    col.toolop("spline.split_pick_edge_transform()");
  
    col.toolop("spline.change_face_z(offset=1, selmode='selectmode')", PackFlags.USE_LARGE_ICON, "Move Up", Icons.Z_UP);
    col.toolop("spline.change_face_z(offset=-1, selmode='selectmode')", PackFlags.USE_LARGE_ICON, "Move Down", Icons.Z_DOWN);

    col.prop("view2d.draw_anim_paths");
    
  }
  
  build_bottombar(view2d, col) {
    let ctx = new Context();
  
    col.packflag |= PackFlags.ALIGN_LEFT | PackFlags.INHERIT_WIDTH | PackFlags.INHERIT_HEIGHT;
    col.packflag |= PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT;
    
    col.default_packflag = PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
    
    col.rcorner = 100.0
    
    //col.packflag |= PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT;
    //col.default_packflag = PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
    
    col.add(gen_editor_switcher(this.ctx, view2d));
    let prop = col.prop("view2d.selectmode",
                        PackFlags.USE_SMALL_ICON|PackFlags.ENUM_STRIP);
                        
    prop.packflag |= PackFlags.USE_ICON|PackFlags.ENUM_STRIP;
    
    //col.prop("view2d.draw_video");
    
    col.prop('view2d.default_stroke', PackFlags.COLOR_BUTTON_ONLY);
    //col.prop('view2d.default_fill', PackFlags.COLOR_BUTTON_ONLY);

    col.prop('view2d.edit_all_layers');
  }

  define_keymap() {
    let k = this.keymap;
    
    k.add(new HotKey("PageUp", [], "spline.change_face_z(offset=1 selmode='selectmode')|Send Face Up"));
    k.add(new HotKey("PageDown", [], "spline.change_face_z(offset=-1 selmode='selectmode')|Send Face Down"));

    k.add(new HotKey("G", [], "spline.translate(datamode='selectmode')|Translate"));
    k.add(new HotKey("S", [], "spline.scale(datamode='selectmode')|Scale"));
    k.add(new HotKey("S", ["SHIFT"], "spline.shift_time()|Scale Time"));
               
    k.add(new HotKey("R", [], "spline.rotate(datamode='selectmode')|Rotate"));
    
    k.add(new HotKey("A", [], "spline.toggle_select_all()|Select Linked"));
    /*
    k.add(new HotKey("A", [], "Toggle Select"), new FuncKeyHandler(function(ctx) {
      let view2d = ctx.view2d;
      let selectmode = view2d.selectmode;
      
      if (selectmode === SelMask.MULTIRES) {
        let tool = new mr_selectops.ToggleSelectAll();
        g_app_state.toolstack.execTool(ctx, tool);
      } else if (selectmode & SelMask.MULTIRES) {
        let tool = new mr_selectops.ToggleSelectAll();
        g_app_state.toolstack.execTool(ctx, tool);

        let tool = new spline_selectops.ToggleSelectAllOp();
        g_app_state.toolstack.execTool(ctx, tool);
      } else {
        let tool = new spline_selectops.ToggleSelectAllOp();
        g_app_state.toolstack.execTool(ctx, tool);
      }
    }));*/

    k.add(new HotKey("A", ["ALT"], "editor.playback()|Animation Playback"));

    k.add(new HotKey("H", [], "spline.hide(selmode='selectmode')|Hide Selection"));
    k.add(new HotKey("H", ["ALT"], "spline.unhide(selmode='selectmode')|Reveal Selection"));

    k.add(new HotKey("G", ["CTRL"], "spline.hide(selmode='selectmode', ghost=1)|Ghost Selection"));
    k.add(new HotKey("G", ["ALT"], "spline.unhide(selmode='selectmode', ghost=1)|Unghost Selection"));
    
    /*k.add(new HotKey("C", [], "Connect Handles"),
               "spline.connect_handles()");
    k.add(new HotKey("C", ["SHIFT"], "Disconnect Handles"),
               "spline.disconnect_handles()");
    */

    
    k.add(new HotKey("L", [], function(ctx) {
      let mpos = ctx.keymap_mpos;
      let ret = ctx.spline.q.findnearest_vert(ctx.view2d, mpos, 55, undefined, ctx.view2d.edit_all_layers);
      
      console.log("select linked", ret);

      if (ret !== undefined) {
        let tool = new SelectLinkedOp(true, ctx.view2d.selectmode);
        tool.inputs.vertex_eid.setValue(ret[0].eid);
        tool.inputs.mode.setValue("SELECT");
        
        ctx.appstate.toolstack.execTool(ctx, tool);
      }
    }, "Select Linked"));
    
    k.add(new HotKey("L", ["SHIFT"], function(ctx) {
      let mpos = ctx.keymap_mpos;
      let ret = ctx.spline.q.findnearest_vert(ctx.view2d, mpos, 55, undefined, ctx.view2d.edit_all_layers);
      
      if (ret !== undefined) {
        let tool = new SelectLinkedOp(true);
        tool.inputs.vertex_eid.setValue(ret[0].eid);
        tool.inputs.mode.setValue("deselect");
        
        ctx.appstate.toolstack.execTool(ctx, tool);
      }
    }, "Select Linked"));
    
    k.add(new HotKey("B", [], "spline.toggle_break_tangents()|Toggle Break-Tangents"));
    k.add(new HotKey("B", ["SHIFT"], "spline.toggle_break_curvature()|Toggle Break-Curvature"));
    
    let this2 = this;
    function del_tool(ctx) {
      console.log("delete");
      
      if (this2.selectmode & SelMask.SEGMENT) {
        console.log("kill segments");
        
        let op = new DeleteSegmentOp();
        g_app_state.toolstack.execTool(ctx, op);
      } else if (this2.selectmode & SelMask.FACE) {
        console.log("kill faces");
        
        let op = new DeleteFaceOp();
        g_app_state.toolstack.execTool(ctx, op);
      } else {
        console.log("kill verts");
        
        let op = new DeleteVertOp();
        g_app_state.toolstack.execTool(ctx, op);
      }
    }
    
    k.add(new HotKey("X", [], del_tool, "Delete"));
    k.add(new HotKey("Delete", [], del_tool, "Delete"));
    k.add(new HotKey("Backspace", [], del_tool, "Delete"));

    k.add(new HotKey("D", [], "spline.dissolve_verts()"));
    k.add(new HotKey("D", ["SHIFT"], "spline.duplicate_transform()|Duplicate"));
    k.add(new HotKey("F", [], "spline.make_edge_face()"));
    k.add(new HotKey("E", [], "spline.split_edges()"));

    k.add(new HotKey("M", [], "spline.mirror_verts()"));

    k.add(new HotKey("C", [], "view2d.circle_select()"));

    k.add(new HotKey("Z", [], function(ctx) {
      ctx.view2d.only_render ^= 1;
      window.redraw_viewport();
    }, "Toggle Only Render"));
    
    k.add(new HotKey("W", [], function(ctx) {
      let mpos = ctx.keymap_mpos;
      ctx.view2d.tools_menu(ctx, mpos);
    }, "Tools Menu"));
  }

  set_selectmode(mode : int) {
    this.selectmode = mode;
  }

  //returns number of selected items
  do_select(event, mpos : Array<number>, view2d : View2DHandler, do_multiple=false) {
    //console.log("XXX do_select!", mpos);
    
    return false;
  }

  tools_menu(ctx, mpos, view2d : View2DHandler) {
    const ops = [
      "spline.key_edges()",
      "spline.key_current_frame()",
      "spline.connect_handles()",
      "spline.disconnect_handles()",
      "spline.toggle_step_mode()",
      "spline.toggle_manual_handles()",
      "editor.paste_pose()",
      "editor.copy_pose()"
    ];
    
    let menu = view2d.toolop_menu(ctx, "Tools", ops);
    
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
    let spline = this.ctx.spline;
    let toolmode = this.ctx.view2d.toolmode;
    
    if (this.highlight_spline !== undefined) {
      //console.log(this.highlight_spline, this.highlight_spline._debug_id, spline._debug_id);
    }
    
    if (this.highlight_spline !== undefined && this.highlight_spline !== spline) {
      let newpath;
      
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
    
    if ("size" in spline && spline[0] !== window.innerWidth && spline[1] !== window.innerHeight) {
      spline.size[0] = window.innerWidth
      spline.size[1] = window.innerHeight;
      //redraw_viewport();
    }
    
    //console.log("DDD", spline.verts.highlight, G.active_splinepath);
    
    if (event.button === 0) {
      let can_append = toolmode === ToolModes.APPEND;
      
      can_append = can_append && (this.selectmode & (SelMask.VERTEX|SelMask.HANDLE));
      can_append = can_append && spline.verts.highlight === undefined && spline.handles.highlight === undefined;
      
      if (can_append) {
        let co = new Vector3([event.x, event.y, 0]);
        //co = this.view2d.getLocalMouse(co[0], co[1]);

        this.view2d.unproject(co);
        console.log(co);

        let op = new ExtrudeVertOp(co, this.ctx.view2d.extrude_mode);
        op.inputs.location.setValue(co);
        op.inputs.linewidth.setValue(this.ctx.view2d.default_linewidth);
        op.inputs.stroke.setValue(this.ctx.view2d.default_stroke);
        
        g_app_state.toolstack.execTool(this.ctx, op);
        redraw_viewport();
      }  else {
        for (let i=0; i<spline.elists.length; i++) {
          let list = spline.elists[i];

          if (!(this.selectmode & list.type))
              continue;;
          if (list.highlight === undefined)
            continue;

          let op = new SelectOneOp(list.highlight, !event.shiftKey,
                                  !(list.highlight.flag & SplineFlags.SELECT),
                                  this.selectmode, true);
          //console.log("exec selectoneop op");
          
          g_app_state.toolstack.execTool(this.ctx, op);
        }
      }
      
      this.start_mpos[0] = event.x; this.start_mpos[1] = event.y; this.start_mpos[2] = 0.0;
      this.mdown = true;
    }
  }

  ensure_paths_off() {
    if (g_app_state.active_splinepath !== "frameset.drawspline") {
      this.highlight_spline = undefined;
      let spline = this.ctx.spline;
      
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
    let frameset = this.ctx.frameset;
    let editor = this.ctx.view2d;
    
    let closest = [0, 0, 0];
    let mindis = 1e17;
    
    let found = false;
    
    //note that limit parameter (maximum distance from mpos) is enforced
    //by spline.q.findnearest (see spline_query.js)
    
    if (!this.draw_anim_paths) {
      this.ensure_paths_off();
      
      //XXXXX FIXME: spline.q.findnearest modifies mpos!!
      let ret = this.ctx.spline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, ignore_layers);
      if (ret !== undefined) {
        return [this.ctx.spline, ret[0], ret[1]];
      } else {
        return undefined;
      }
    }
    
    //console.log("\n");
    
    let actspline = this.ctx.spline;
    
    let pathspline = this.ctx.frameset.pathspline;
    let drawspline = this.ctx.frameset.spline;
    
    let ret = drawspline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, ignore_layers);
    if (ret !== undefined && ret[1] < limit) {
      mindis = ret[1] - (drawspline === actspline ? 3 : 0);
      found = true;
      
      closest[0] = drawspline;
      closest[1] = ret[0];
      closest[2] = mindis;
    }
    
    //for (let spline in frameset._selected_splines) {
    ret = frameset.pathspline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, false);
    if (ret !== undefined) {
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
  
  on_mousemove(event) {
    if (this.ctx === undefined) return;

    let toolmode = this.ctx.view2d.toolmode;
    
    let selectmode = this.selectmode;
    let limit = selectmode & SelMask.SEGMENT ? 55 : 12;

    if (toolmode === ToolModes.SELECT) limit *= 3;
    
    let spline = this.ctx.spline;
    spline.size = [window.innerWidth, window.innerHeight];
    
    this.mpos[0] = event.x, this.mpos[1] = event.y, this.mpos[2] = 0.0;
    
    selectmode = this.selectmode;

    if (this.mdown) { // && this.mpos.vectorDistance(this.start_mpos) > 2) {
      this.mdown = false;

      let mpos = new Vector2();
      mpos.load(this.start_mpos);
      //this.ctx.view2d.project(mpos);

      let op = new TranslateOp(mpos);

      console.log("start_mpos:", mpos);

      op.inputs.datamode.setValue(this.ctx.view2d.selectmode);
      op.inputs.edit_all_layers.setValue(this.ctx.view2d.edit_all_layers);

      let ctx = new Context();
      
      if (ctx.view2d.session_flag & SessionFlags.PROP_TRANSFORM) {
        op.inputs.proportional.setValue(true);
        op.inputs.propradius.setValue(ctx.view2d.propradius);
      }
      
      g_app_state.toolstack.execTool(ctx, op);
      return;
    }
    
    if (this.mdown)
      return;
    
    let ret = this.findnearest([event.x, event.y], this.ctx.view2d.selectmode, limit, this.ctx.view2d.edit_all_layers);

    //console.log(ret, this.ctx.view2d.selectmode);
    
    
    if (ret !== undefined && typeof(ret[1]) !== "number" && ret[2] !== SelMask.MULTIRES) {
      //console.log(ret[1].type);
      
      if (this.highlight_spline !== undefined) {
        for (let list of this.highlight_spline.elists) {
          if (list.highlight !== undefined) {
            redraw_element(list.highlight, this.view2d);
          }
        }
      }
      
      if (ret[0] !== this.highlight_spline && this.highlight_spline !== undefined) {
        this.highlight_spline.clear_highlight();
      }
      
      this.highlight_spline = ret[0];
      this.highlight_spline.clear_highlight();
      
      let list = this.highlight_spline.get_elist(ret[1].type);
      /*
      if (!list._has_d) {
        Object.defineProperty(list, "highlight", {
          enumerable : true,
          get : function() {
            return this._highlight;
          },
          
          set : function(val) {
            if (val === undefined && this._highlight !== undefined) {
              console.log("  off");
            }
            if (val !== undefined && this._highlight === undefined) {
              console.log("  on");
            }
            this._highlight = val;
          }
        });
        list._has_d = true;
      }
       */

      //console.log("SPLINE", ret[0]._debug_id, "PARENTV", ret[0].parent_veid);

      list.highlight = ret[1];
      redraw_element(list.highlight, this.view2d);
      
      //redraw_viewport();
      //console.log(list === ret[0].verts);
    } else {
      if (this.highlight_spline !== undefined) {
        for (let i=0; i<this.highlight_spline.elists.length; i++) {
          let list = this.highlight_spline.elists[i];
          if (list.highlight !== undefined) {
            redraw_element(list.highlight, this.view2d);
          }
        }
        
        this.highlight_spline.clear_highlight();
      }
    }
  }

  on_mouseup(event) {
    let spline = this._get_spline();
    spline.size = [window.innerWidth, window.innerHeight];
    
    this.mdown = false;
  }

  do_alt_select(event, mpos, view2d) {
  }

  gen_edit_menu(Boolean add_title=false) {
    let view2d = this.view2d;
    let ctx = new Context();
    
    let ops = [
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
    
    let menu = view2d.toolop_menu(ctx, add_title ? "Edit" : "", ops);
    return menu;
  }
  
  delete_menu(event) {
    let view2d = this.view2d;
    let ctx = new Context();
    
    let menu = this.gen_delete_menu(true);
    
    menu.close_on_right = true
    menu.swap_mouse_button = 2;
    
    view2d.call_menu(menu, view2d, [event.x, event.y]);
  }
}

SplineEditor.STRUCT = `
  SplineEditor {
    selectmode : int;
  }
`
