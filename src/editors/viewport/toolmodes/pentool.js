"use strict";

import {UIBase} from "../../../path.ux/scripts/core/ui_base.js";

import {FullContext} from "../../../core/context.js";
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

import * as util from "../../../path.ux/scripts/util/util.js";

//import {KeyMap} from "../../../path.ux/scripts/util/simple_events.js";
import {ToolMode} from "./toolmode.js";
import {nstructjs} from "../../../path.ux/scripts/pathux.js";
import {WidgetResizeOp, WidgetRotateOp} from "../transform_ops.js";
import {ToolModes} from "../selectmode.js";

import {PanOp} from '../view2d_ops.js';
import {ListProperty, Vec3Property, Vec4Property, BoolProperty,
        IntProperty, FloatProperty, StringProperty} from "../../../path.ux/scripts/pathux.js";

window.anim_to_playback = [];

export class StrokeOp extends ToolOp {
  constructor() {
    super();

    this._start = 0; //used for incremental build of op, without using undo
    this._verts = [];
  }

  static tooldef() {return {
    uiname   : "Add Stroke",
    toolpath : "pen.stroke",
    inputs   : {
      points : new ListProperty(Vec3Property),
      lineWidth : new FloatProperty(),
      strokeColor : new Vec4Property([0,0,0,1])
    }
  }}

  exec(ctx : FullContext) {
    let spline = ctx.frameset.spline;

    let lastv = undefined;

    let arr = this.inputs.points.value;

    lastv = this._verts[this._start-1];
    let lastp = arr[this._start-1];
    lastp = lastp ? lastp.getValue() : undefined;

    let n1 = new Vector2();
    let n2 = new Vector2();
    let n3 = new Vector2();

    let lwid = this.inputs.lineWidth.getValue();
    let color = this.inputs.strokeColor.getValue();

    for (let i=this._start; i<arr.length; i++) {
      let v = arr[i];
      v = v.getValue();

      let x = v[0], y = v[1], p = v[2];

      let v2 = spline.make_vertex(v);
      if (lastv) {
        let s = spline.make_segment(lastv, v2);

        s.mat.linewidth = lwid;
        for (let j=0; j<4; j++) {
          s.mat.strokecolor[j] = color[j];
        }

        if (s.v1 === lastv) {
          s.w1 = lastp[2] || 1.0;
          s.w2 = v[2] || 1.0;
        } else {
          s.w1 = v[2] || 1.0;
          s.w2 = lastp[2] || 1.0;
        }
      }

      if (lastv && lastv.segments.length === 2) {
        let s1 = lastv.segments[0];
        let s2 = lastv.segments[1];

        let a = s1.other_vert(lastv);
        let b = lastv;
        let c = s2.other_vert(lastv);

        n1.load(a).sub(b);
        n2.load(c).sub(b);

        let bad = n1.dot(n1) < 0.001 || n2.dot(n2) < 0.001;

        n1.normalize();
        n2.normalize();

        bad = bad || Math.acos(n1.dot(n2)) < Math.PI*0.25;

        if (bad) {
          //lastv.flag |= SplineFlags.BREAK_CURVATURES;
          lastv.flag |= SplineFlags.BREAK_TANGENTS;
        }
      }

      lastv = v2;
      lastp = v;

      this._verts.push(v2);
    }

    spline.regen_sort();
    spline.regen_render();
    spline.regen_solve();
  }

  undoPre(ctx) {
    return this.undo_pre(ctx);
  }

  undo_pre(ctx) {
    this._start = 0;
    this._verts = [];

    let spline = ctx.frameset.spline;

    this._undo = {
      start_eid : spline.idgen.cur_id
    }
  }

  undo(ctx) {
    this._start = 0;
    this._verts = [];

    let spline = ctx.frameset.spline;
    let a = this._undo.start_eid;
    let b = spline.idgen.cur_id;

    for (let i=a; i<=b; i++) {
      let e = spline.eidmap[i];
      if (e !== undefined && e.type === SplineTypes.VERTEX) {
        spline.kill_vertex(e);
      }
    }

    spline.idgen.cur_id = a;

    spline.regen_sort();
    spline.regen_render();
    spline.regen_solve();
    window.redraw_viewport();
  }
}

export class PenToolMode extends ToolMode {
  mpos : Vector2
  last_mpos : Vector2
  start_mpos : Vector2
  _cancel_on_touch : boolean
  mdown : boolean;

  constructor() {
    super();

    this.keymap = undefined;

    this.mpos = new Vector2();
    this.last_mpos = new Vector2();
    this.start_mpos = new Vector2();
    this.mdown = false;

    this.stroke = [];
    this.smoothness = 1.0;
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
  }

  static toolDefine() {
    return {
      name: "pen",
      uiName: "Pen",
      flag: 0,
      icon: Icons.PEN_TOOL,
      nodeInputs: {},
      nodeOutputs: {},
      nodeFlag: 0
    }
  }

  defineKeyMap() {
    let k = this.keymap = new KeyMap("view2d:pentool");
    return k;
  }

  tools_menu(ctx, mpos, view2d) {
    let ops = [
    ];

    var menu = view2d.toolop_menu(ctx, "Tools", ops);

    view2d.call_menu(menu, view2d, mpos);
  }

  getSpline() {
    return this.ctx.frameset.spline;
  }

  getMouse(event) {
    let view2d = this.ctx.view2d;

    let p = new Vector3([event.x, event.y, 0.0]); //view2d.getLocalMouse(event.x, event.y);
    //p[1] = view2d.size[1] - p[1];
    view2d.unproject(p);

    p = new Vector3(p);

    if (event.touches && event.touches.length > 0) {
      let f = event.touches[0];

      f = f.force || f.pressure || 1.0;
      p[2]  = f;
    } else {
      p[2] = 1.0;
    }

    return p;
  }

  addPoint(mpos) {
    let spline = this.getSpline();

    let v3 = new Vec3Property();
    v3.setValue(mpos);

    if (this.tool === this.ctx.toolstack.head) {
      //console.log("found undo");
      //this.ctx.toolstack.undo();
    } else {
      this.ctx.toolstack.execTool(this.ctx, this.tool);
      this.tool = new StrokeOp();

      this.tool.inputs.lineWidth.setValue(this.ctx.view2d.default_linewidth);
      this.tool.inputs.strokeColor.setValue(this.ctx.view2d.default_stroke);
      this.ctx.toolstack.execTool(this.ctx, this.tool);
    }

    this.tool._start = this.tool.inputs.points.value.length;

    this.tool.inputs.points.value.push(v3);
    this.tool.exec(this.ctx);

    this.stroke.push(mpos);

    window.redraw_viewport();
  }

  on_mousedown(event : Object, localX, localY) {
    if (event.altKey || event.shiftKey || event.ctrlKey || event.commandKey) {
      return;
    }

    this.start_mpos[0] = event.x;
    this.start_mpos[1] = event.y;

    let mpos = this.getMouse(event);

    this.tool = new StrokeOp();
    this.tool.inputs.lineWidth.setValue(this.ctx.view2d.default_linewidth);
    this.tool.inputs.strokeColor.setValue(this.ctx.view2d.default_stroke);
    this.ctx.toolstack.execTool(this.ctx, this.tool); //set undo checkpoint

    this.addPoint(mpos);

    this.mdown = true;
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
  findnearest(mpos : Array, selectmask : number, limit : number, ignore_layers) {
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
  }

  on_mousemove(event : Object) {
    if (!this.mdown) {
      return;
    }

    let mpos = this.getMouse(event);
    this.addPoint(mpos);
  }

  on_mouseup(event : Object) {
    this.mdown = false;

    console.log("%cMOUSE UP", "color : yellow;");

    this.tool = undefined;
    this._cancel_on_touch = false;
    this.start_mpos[0] = event.x;
    this.start_mpos[1] = event.y;

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
    return [];
  }

  delete_menu(event) {
  }


  dataLink(scene : Scene, getblock : function, getblock_us : function) {
    this.ctx = g_app_state.ctx;
  }

  loadSTRUCT(reader : function) {
    reader(this);
  }
}

PenToolMode.STRUCT = nstructjs.inherit(PenToolMode, ToolMode) + `
}`;

ToolMode.register(PenToolMode);
