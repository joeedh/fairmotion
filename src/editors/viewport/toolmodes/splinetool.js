"use strict";

import {ExtrudeVertOp} from '../spline_createops.js';
import {DeleteVertOp, DeleteSegmentOp} from '../spline_editops.js';
import {WidgetResizeOp, WidgetRotateOp} from '../transform_ops.js';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, HotKey,
  charmap, TouchEventManager, EventHandler} from '../../events.js';

import {SelectLinkedOp, SelectOneOp} from '../spline_selectops.js';
import {TranslateOp} from '../transform.js';

import {SelMask, ToolModes} from '../selectmode.js';
import {SplineTypes, SplineFlags, SplineVertex,
  SplineSegment, SplineFace} from '../../../curve/spline_types.js';

import {View2DEditor, SessionFlags} from '../view2d_editor.js';
import {redraw_element} from '../../../curve/spline_draw.js';
import {UndoFlags, ToolFlags, ModalStates, ToolOp, ToolMacro} from '../../../core/toolops_api.js';

import {DeleteVertOp, DeleteSegmentOp, DeleteFaceOp,
  ChangeFaceZ, SplitEdgeOp, DuplicateOp,
  DisconnectHandlesOp, SplitEdgePickOp} from '../spline_editops.js';


//import {KeyMap} from "../../../path.ux/scripts/util/simple_events.js";
import {ToolMode} from "./toolmode.js";
import {nstructjs} from "../../../path.ux/scripts/pathux.js";
import {WidgetResizeOp, WidgetRotateOp} from "../transform_ops.js";
import {ToolModes} from "../selectmode.js";

window.anim_to_playback = [];

export class SplineToolMode extends ToolMode {
  constructor() {
    super();

    this.keymap = undefined;

    this.mpos = new Vector2();
    this.last_mpos = new Vector2();
    this.start_mpos = new Vector2();
    this.mdown = false;

  }

  rightClickMenu(e, localX, localY, view2d) {

  }

  draw(view2d) {
    super.draw(view2d);
  }


  duplicate() {
    return new this.constructor();
  }

  static contextOverride() {

  }

  static buildSideBar(container) {

  }

  static buildHeader(container) {

  }

  static buildProperties(container) {

  }

  on_tick() {
    if (!this.ctx) {
      return;
    }

    let ctx = this.ctx;

    let widgets = [WidgetResizeOp, WidgetRotateOp];

    if (ctx.view2d.toolmode == ToolModes.RESIZE) {
      ctx.view2d.widgets.ensure_toolop(ctx, WidgetResizeOp);
    } else if (ctx.view2d.toolmode == ToolModes.ROTATE) {
      ctx.view2d.widgets.ensure_toolop(ctx, WidgetRotateOp);
    } else {
      for (let cls of widgets) {
        ctx.view2d.widgets.ensure_not_toolop(ctx, cls);
      }
    }

  }

  static toolDefine() {
    return {
      name: "spline",
      uiName: "Spline",
      flag: 0,
      icon: -1,
      nodeInputs: {},
      nodeOutputs: {},
      nodeFlag: 0
    }
  }

  defineKeyMap() {
    let k = this.keymap = new KeyMap([]);


    k.add_tool(new HotKey("PageUp", [], "Send Face Up"),
      "spline.change_face_z(offset=1, selmode=selectmode)");
    k.add_tool(new HotKey("PageDown", [], "Send Face Down"),
      "spline.change_face_z(offset=-1, selmode=selectmode)");

    k.add_tool(new HotKey("G", [], "Translate"),
      "spline.translate(datamode=selectmode)");
    k.add_tool(new HotKey("S", [], "Scale"),
      "spline.scale(datamode=selectmode)");
    k.add_tool(new HotKey("S", ["SHIFT"], "Scale Time"),
      "spline.shift_time()");

    k.add_tool(new HotKey("R", [], "Rotate"),
      "spline.rotate(datamode=selectmode)");

    k.add_tool(new HotKey("A", [], "Select Linked"), "spline.toggle_select_all()");
    /*
    k.add(new HotKey("A", [], "Toggle Select"), new FuncKeyHandler(function(ctx) {
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

    k.add_tool(new HotKey("A", ["ALT"], "Animation Playback"),
      "editor.playback()");

    k.add_tool(new HotKey("H", [], "Hide Selection"),
      "spline.hide(selmode=selectmode)");
    k.add_tool(new HotKey("H", ["ALT"], "Reveal Selection"),
      "spline.unhide(selmode=selectmode)");

    k.add_tool(new HotKey("G", ["CTRL"], "Ghost Selection"),
      "spline.hide(selmode=selectmode, ghost=1)");
    k.add_tool(new HotKey("G", ["ALT"], "Unghost Selection"),
      "spline.unhide(selmode=selectmode, ghost=1)");

    /*k.add_tool(new HotKey("C", [], "Connect Handles"),
               "spline.connect_handles()");
    k.add_tool(new HotKey("C", ["SHIFT"], "Disconnect Handles"),
               "spline.disconnect_handles()");
    */


    k.add(new HotKey("L", [], "Select Linked"), new FuncKeyHandler(function (ctx) {
      var mpos = ctx.keymap_mpos;
      var ret = ctx.spline.q.findnearest_vert(ctx.view2d, mpos, 55, undefined, ctx.view2d.edit_all_layers);

      console.log("select linked", ret);

      if (ret != undefined) {
        var tool = new SelectLinkedOp(true, ctx.view2d.selectmode);
        tool.inputs.vertex_eid.setValue(ret[0].eid);
        tool.inputs.mode.setValue("SELECT");

        ctx.appstate.toolstack.exec_tool(tool);
      }
    }));

    k.add(new HotKey("L", ["SHIFT"], "Select Linked"), new FuncKeyHandler(function (ctx) {
      var mpos = ctx.keymap_mpos;
      var ret = ctx.spline.q.findnearest_vert(ctx.view2d, mpos, 55, undefined, ctx.view2d.edit_all_layers);

      if (ret != undefined) {
        var tool = new SelectLinkedOp(true);
        tool.inputs.vertex_eid.setValue(ret[0].eid);
        tool.inputs.mode.setValue("deselect");

        ctx.appstate.toolstack.exec_tool(tool);
      }
    }));

    k.add_tool(new HotKey("B", [], "Toggle Break-Tangents"),
      "spline.toggle_break_tangents()");
    k.add_tool(new HotKey("B", ["SHIFT"], "Toggle Break-Curvature"),
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

    k.add(new HotKey("X", [], "Delete"), new FuncKeyHandler(del_tool));
    k.add(new HotKey("Delete", [], "Delete"), new FuncKeyHandler(del_tool));
    k.add(new HotKey("Backspace", [], "Delete"), new FuncKeyHandler(del_tool));

    k.add_tool(new HotKey("D", [], "Dissolve Vertices"), "spline.dissolve_verts()");
    k.add_tool(new HotKey("D", ["SHIFT"], "Duplicate"), "spline.duplicate_transform()");
    k.add_tool(new HotKey("F", [], "Create Face/Edge"), "spline.make_edge_face()");
    k.add_tool(new HotKey("E", [], "Split Segments"), "spline.split_edges()");

    k.add_tool(new HotKey("M", [], "Mirror Verts"), "spline.mirror_verts()");

    k.add_tool(new HotKey("C", [], "Circle Select"), "view2d.circle_select()");

    k.add(new HotKey("Z", [], "Toggle Only Render"), new FuncKeyHandler(function (ctx) {
      ctx.view2d.only_render ^= 1;
      window.redraw_viewport();
    }));

    k.add(new HotKey("W", [], "Tools Menu"), new FuncKeyHandler(function (ctx) {
      var mpos = ctx.keymap_mpos;
      mpos = ctx.screen.mpos;
      ctx.view2d.tools_menu(ctx, mpos);
    }));
  }

  tools_menu(ctx, mpos, view2d) {
    let ops = [
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

  _get_spline() {
    return this.ctx.spline;
  }

  on_mousedown(event, localX, localY) {
    var spline = this.ctx.spline;
    var toolmode = this.ctx.view2d.toolmode;

    if (this.highlight_spline !== undefined) {
      //console.log(this.highlight_spline, this.highlight_spline._debug_id, spline._debug_id);
    }

    if (this.highlight_spline !== undefined && this.highlight_spline !== spline) {
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

      can_append = can_append && (this.selectmode & (SelMask.VERTEX | SelMask.HANDLE));
      can_append = can_append && spline.verts.highlight === undefined && spline.handles.highlight === undefined;

      if (can_append) {
        var co = new Vector3([event.x, event.y, 0]);
        //co = this.view2d.getLocalMouse(co[0], co[1]);

        this.view2d.unproject(co);
        console.log(co);

        var op = new ExtrudeVertOp(co, this.ctx.view2d.extrude_mode);
        op.inputs.location.setValue(co);
        op.inputs.linewidth.setValue(this.ctx.view2d.default_linewidth);
        op.inputs.stroke.setValue(this.ctx.view2d.default_stroke);

        g_app_state.toolstack.exec_tool(op);
        redraw_viewport();
      } else {
        for (var i = 0; i < spline.elists.length; i++) {
          var list = spline.elists[i];

          if (!(this.selectmode & list.type))
            continue;
          ;
          if (list.highlight == undefined)
            continue;

          var op = new SelectOneOp(list.highlight, !event.shiftKey,
            !(list.highlight.flag & SplineFlags.SELECT),
            this.selectmode, true);
          //console.log("exec selectoneop op");

          g_app_state.toolstack.exec_tool(op);
        }
      }

      this.start_mpos[0] = event.x;
      this.start_mpos[1] = event.y;
      this.start_mpos[2] = 0.0;
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

      //XXXXX FIXME: spline.q.findnearest modifies mpos!!
      var ret = this.ctx.spline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, ignore_layers);
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

    var ret = drawspline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, ignore_layers);
    if (ret != undefined && ret[1] < limit) {
      mindis = ret[1] - (drawspline === actspline ? 3 : 0);
      found = true;

      closest[0] = drawspline;
      closest[1] = ret[0];
      closest[2] = mindis;
    }

    //for (var spline in frameset._selected_splines) {
    var ret = frameset.pathspline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, false);
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

    if (this.mdown) { // && this.mpos.vectorDistance(this.start_mpos) > 2) {
      this.mdown = false;

      let mpos = new Vector2();
      mpos.load(this.start_mpos);
      //this.ctx.view2d.project(mpos);

      var op = new TranslateOp(mpos);

      console.log("start_mpos:", mpos);

      op.inputs.datamode.setValue(this.ctx.view2d.selectmode);
      op.inputs.edit_all_layers.setValue(this.ctx.view2d.edit_all_layers);

      var ctx = new Context();

      if (ctx.view2d.session_flag & SessionFlags.PROP_TRANSFORM) {
        op.inputs.proportional.setValue(true);
        op.inputs.propradius.setValue(ctx.view2d.propradius);
      }

      g_app_state.toolstack.exec_tool(op);
      return;
    }

    if (this.mdown)
      return;

    var ret = this.findnearest([event.x, event.y], this.ctx.view2d.selectmode, limit, this.ctx.view2d.edit_all_layers);

    //console.log(ret, this.ctx.view2d.selectmode);


    if (ret != undefined && typeof (ret[1]) != "number" && ret[2] != SelMask.MULTIRES) {
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
      /*
      if (!list._has_d) {
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
      }
       */

      //console.log("SPLINE", ret[0]._debug_id, "PARENTV", ret[0].parent_veid);

      list.highlight = ret[1];
      redraw_element(list.highlight, this.view2d);

      //redraw_viewport();
      //console.log(list === ret[0].verts);
    } else {
      if (this.highlight_spline !== undefined) {
        for (var i = 0; i < this.highlight_spline.elists.length; i++) {
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

  getKeyMaps() {
    if (this.keymap === undefined) {
      this.defineKeyMap();
    }
    return [this.keymap]
  }

  static buildEditMenu() {
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

    return ops;
  }

  delete_menu(event) {
    var view2d = this.view2d;
    var ctx = new Context();

    var menu = this.gen_delete_menu(true);

    menu.close_on_right = true
    menu.swap_mouse_button = 2;

    view2d.call_menu(menu, view2d, [event.x, event.y]);
  }


  dataLink(scene, getblock, getblock_us) {
    this.ctx = g_app_state.ctx;
  }

  loadSTRUCT(reader) {
    reader(this);
  }
}

SplineToolMode.STRUCT = nstructjs.inherit(SplineToolMode, ToolMode) + `
}`;

ToolMode.register(SplineToolMode);
