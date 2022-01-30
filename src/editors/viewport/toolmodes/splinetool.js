"use strict";

import {UIBase} from "../../../path.ux/scripts/core/ui_base.js";

import {FullContext} from "../../../core/context.js";
import {ExtrudeVertOp} from '../spline_createops.js';
import {DeleteVertOp, DeleteSegmentOp} from '../spline_editops.js';
import {WidgetResizeOp, WidgetRotateOp} from '../transform_ops.js';

import {KeyMap, HotKey} from '../../../core/keymap.js';

import {SelectLinkedOp, SelectOneOp, SelOpModes} from '../spline_selectops.js';
import {TranslateOp} from '../transform.js';

import {SelMask, ToolModes} from '../selectmode.js';
import {
  SplineTypes, SplineFlags, SplineVertex,
  SplineSegment, SplineFace
} from '../../../curve/spline_types.js';

import {View2DEditor, SessionFlags} from '../view2d_editor.js';
import {redraw_element} from '../../../curve/spline_draw.js';
import {UndoFlags, ToolFlags, ModalStates, ToolOp, ToolMacro} from '../../../core/toolops_api.js';

import {
  DeleteVertOp, DeleteSegmentOp, DeleteFaceOp,
  ChangeFaceZ, SplitEdgeOp, DuplicateOp,
  DisconnectHandlesOp, SplitEdgePickOp
} from '../spline_editops.js';

import * as util from "../../../path.ux/scripts/util/util.js";

import {ToolMode} from "./toolmode.js";
import {nstructjs} from "../../../path.ux/scripts/pathux.js";
import {WidgetResizeOp, WidgetRotateOp} from "../transform_ops.js";
import {ToolModes} from "../selectmode.js";

import {PanOp} from '../view2d_ops.js';

window.anim_to_playback = [];

export class SplineToolMode extends ToolMode {
  mpos: Vector2
  last_mpos: Vector2
  start_mpos: Vector2
  _cancel_on_touch: boolean
  mdown: boolean;

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
    let panel = container.panel("Tools");

    panel.toolPanel("spline.vertex_smooth()");
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
      name       : "spline",
      uiName     : "Spline",
      flag       : 0,
      icon       : -1,
      nodeInputs : {},
      nodeOutputs: {},
      nodeFlag   : 0
    }
  }

  defineKeyMap() {
    var this2 = this;

    function del_tool(ctx) {
      console.log("delete");

      if (this2.selectmode & SelMask.SEGMENT) {
        console.log("kill segments");

        let op = new DeleteSegmentOp();
        g_app_state.toolstack.exec_tool(op);
      } else if (this2.selectmode & SelMask.FACE) {
        console.log("kill faces");

        let op = new DeleteFaceOp();
        g_app_state.toolstack.exec_tool(op);
      } else {
        console.log("kill verts");

        let op = new DeleteVertOp();
        g_app_state.toolstack.exec_tool(op);
      }
    }

    this.keymap = new KeyMap("view2d:spline", [
      new HotKey("PageUp", [], "spline.change_face_z(offset=1 selmode='selectmode')|Move Up"),
      new HotKey("PageDown", [], "spline.change_face_z(offset=-1 selmode='selectmode')|Move Down"),
      new HotKey("G", [], "spline.translate(datamode='selectmode')"),
      new HotKey("S", [], "spline.scale(datamode='selectmode')"),
      new HotKey("R", [], "spline.rotate(datamode='selectmode')"),
      new HotKey("S", ["SHIFT"], "spline.shift_time()"),
      new HotKey("A", [], "spline.toggle_select_all(mode='SELECT')|Select All"),
      new HotKey("A", ["ALT"], "spline.toggle_select_all(mode='DESELECT')|Select None"),
      new HotKey("H", [], "spline.hide(selmode='selectmode')|Hide Selection"),
      new HotKey("H", ["ALT"], "spline.unhide(selmode='selectmode')|Reveal Selection"),
      new HotKey("G", [], "spline.hide(selmode='selectmode' ghost=1)|Ghost Selection"),
      new HotKey("G", [], "spline.unhide(selmode='selectmode' ghost=1)|Unghost Selection"),
      new HotKey("L", [], "spline.select_linked_pick(mode='SELECT')|Select Linked"),
      new HotKey("L", [], "spline.select_linked_pick(mode='SELECT')|Select Linked"),
      new HotKey("L", ["SHIFT"], "spline.select_linked_pick(mode='DESELECT')|Deselect Linked"),
      new HotKey("B", [], "spline.toggle_break_tangents()|Toggle Break-Tangents"),
      new HotKey("B", ["SHIFT"], "spline.toggle_break_curvature()|Toggle Break-Curvature"),
      new HotKey("X", [], del_tool, "Delete"),
      new HotKey("Delete", [], del_tool, "Delete"),
      new HotKey("Backspace", [], del_tool, "Delete"),
      new HotKey("D", [], "spline.dissolve_verts()|Dissolve Vertices"),
      new HotKey("D", ["SHIFT"], "spline.duplicate_transform()|Duplicate"),
      new HotKey("F", [], "spline.make_edge_face()|Create Face/Edge"),
      new HotKey("E", [], "spline.split_edges()|Split Segments"),
      new HotKey("M", [], "spline.mirror_verts()|Mirror Verts"),
      new HotKey("C", [], "view2d.circle_select()|Circle Select"),
      new HotKey("Z", [], function (ctx) {
        console.warn("ZKEY", arguments, this);

        ctx.view2d.only_render ^= 1;
        window.redraw_viewport();
      }, "Toggle Only Render"),
      new HotKey("W", [], function (ctx) {
        var mpos = ctx.keymap_mpos;
        mpos = ctx.screen.mpos;
        ctx.view2d.tools_menu(ctx, mpos);
      }, "Tools Menu")
    ]);
    return;
    let k = this.keymap = new KeyMap("view2d:splinetool");


    /*k.add_tool(new HotKey("C", [], "Connect Handles"),
               "spline.connect_handles()");
    k.add_tool(new HotKey("C", ["SHIFT"], "Disconnect Handles"),
               "spline.disconnect_handles()");
    */

  }

  tools_menu(ctx, mpos, view2d) {
    let ops = [
      "spline.flip_segments()",
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

  on_mousedown(event: Object, localX, localY) {
    if (this._do_touch_undo(event)) {
      return true;
    }

    var spline = this.ctx.spline;
    var toolmode = this.ctx.view2d.toolmode;

    this.start_mpos[0] = event.x;
    this.start_mpos[1] = event.y;

    this.updateHighlight(event.x, event.y, !!event.touches);

    if (this.highlight_spline !== undefined && this.highlight_spline !== spline) {
      this._cancel_on_touch = false;

      console.log("spline switch!");

      var newpath;
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
      return true;
    }

    let ret = false;

    if (event.button === 0) {
      var can_append = toolmode === ToolModes.APPEND;

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

        this._cancel_on_touch = true;
        g_app_state.toolstack.exec_tool(op);
        redraw_viewport();

        ret = true;
      } else {
        this._cancel_on_touch = false;

        for (var i = 0; i < spline.elists.length; i++) {
          var list = spline.elists[i];

          if (!(this.selectmode & list.type))
            continue;
          ;
          if (list.highlight === undefined)
            continue;

          var op = new SelectOneOp(list.highlight, !event.shiftKey,
            !(list.highlight.flag & SplineFlags.SELECT),
            this.selectmode, true);
          //console.log("exec selectoneop op");

          g_app_state.toolstack.exec_tool(op);

          ret = true;
          break;
        }
      }

      this.start_mpos[0] = event.x;
      this.start_mpos[1] = event.y;
      this.mdown = true;
    }

    return ret;
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
  findnearest(mpos: Array, selectmask: number, limit: number, ignore_layers) {
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

  updateHighlight(x, y, was_touch) {
    let toolmode = this.ctx.view2d.toolmode;
    let limit;

    if (this.ctx.view2d.selectmode & SelMask.SEGMENT) {
      limit = 55;
    } else {

      limit = (util.isMobile() || was_touch) ? 55 : 15;
    }

    limit /= UIBase.getDPI();
    if (toolmode === ToolModes.SELECT) limit *= 3;

    let ret = this.findnearest([x, y], this.ctx.view2d.selectmode, limit, this.ctx.view2d.edit_all_layers);

    //console.log(ret, this.ctx.view2d.selectmode);


    if (ret !== undefined) {
      //console.log(ret[1].type);

      if (ret[0] !== this.highlight_spline && this.highlight_spline !== undefined) {
        this.highlight_spline.clear_highlight();

        /*
        for (var list of this.highlight_spline.elists) {
          if (list.highlight != undefined) {
            redraw_element(list.highlight, this.view2d);
          }
        }//*/
      }

      this.highlight_spline = ret[0];
      this.highlight_spline.clear_highlight();
      window.redraw_viewport();

      /*
      for (var list of this.highlight_spline.elists) {
        if (list.highlight != undefined) {
          redraw_element(list.highlight, this.view2d);
        }
      }//*/
    } else {
      if (this.highlight_spline !== undefined) {
        this.highlight_spline.clear_highlight();
        window.redraw_viewport();
      }

      this.highlight_spline = undefined;
    }

    if (this.highlight_spline && ret && ret[1]) {
      let list = this.highlight_spline.get_elist(ret[1].type);

      let redraw = list.highlight !== ret[1];

      list.highlight = ret[1];

      if (redraw) {
        window.redraw_viewport();
      }
      //redraw_element(ret[1]);
    }
  }

  _do_touch_undo(event) {
    //console.log(event.touches && event.touches.length > 1, this._cancel_on_touch, "<---");

    if (event.touches && event.touches.length > 1 && this._cancel_on_touch) {
      console.log("touch undo!");

      this.ctx.toolstack.undo();
      this._cancel_on_touch = false;
      this.ctx.toolstack.execTool(this.ctx, new PanOp());

      window.redraw_viewport();
      return true;
    }
  }

  on_mousemove(event: Object) {
    if (this.ctx === undefined) return;
    this.mpos[0] = event.x, this.mpos[1] = event.y, this.mpos[2] = 0.0;
    var selectmode = this.selectmode;

    if (this._do_touch_undo(event)) {
      return;
    }

    this.updateHighlight(event.x, event.y, !!event.touches);

    let translate = (this.mdown && this.start_mpos.vectorDistance(this.mpos) > 15/UIBase.getDPI());
    //translate = translate && !this._cancel_on_touch;
    //translate = translate && (!this.highlight_spline || !this.highlight_spline.has_highlight());

    if (translate) {
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

      let _cancel_on_touch = this._cancel_on_touch;
      this._cancel_on_touch = false;

      op.touchCancelable(() => {
        console.log("touch-induced cancel!");
        this.ctx.toolstack.execTool(this.ctx, new PanOp());

        if (_cancel_on_touch) {
          //undo again
          this.ctx.toolstack.undo();
        }
      });

      g_app_state.toolstack.exec_tool(op);
    }
  }

  on_mouseup(event: Object) {
    this._cancel_on_touch = false;
    this.start_mpos[0] = event.x;
    this.start_mpos[1] = event.y;
    this.mdown = true;

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
      "spline.toggle_manual_handles()",
      "spline.split_edges()",
      "spline.delete_faces()",
      "spline.delete_segments()",
      "spline.delete_verts()",
      "spline.dissolve_verts()",
      "spline.make_edge_face()",
      "spline.split_edges()",
      "spline.mirror_verts()",
      "spline.duplicate_transform()",
      "spline.disconnect_handles()",
      "spline.connect_handles()",
      "spline.unhide()",
      "spline.hide()",
      "spline.toggle_select_all(mode='SELECT')|Select All|A",
      "spline.toggle_select_all(mode='DESELECT')|Deselect All|Alt-A",
      "view2d.circle_select()",
      "spline.select_linked(vertex_eid='active_vertex' mode='SELECT')|Select Linked|L",
      "spline.select_linked(vertex_eid='active_vertex' mode='DESELECT')|Deselect Linked|Shift+L"
    ];

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


  dataLink(scene: Scene, getblock: function, getblock_us: function) {
    this.ctx = g_app_state.ctx;
  }

  loadSTRUCT(reader: function) {
    reader(this);
  }
}

SplineToolMode.STRUCT = nstructjs.inherit(SplineToolMode, ToolMode) + `
}`;

ToolMode.register(SplineToolMode);
