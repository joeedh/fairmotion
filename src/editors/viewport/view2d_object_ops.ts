"use strict";

import { WidgetResizeOp, WidgetRotateOp } from "./transform_ops.js";

import { DataTypes } from "../../core/lib_api.js";
import { EditModes } from "./view2d_editor.js";

import { SelMask, ToolModes } from "./selectmode.js";

import { View2DEditor, SessionFlags } from "./view2d_editor.js";
import { DataBlock } from "../../core/lib_api.js";
import type { GetBlockFunc, GetBlockUserFunc } from "../../core/lib_api.js";
import type { ToolModeHit } from "./toolmodes/toolmode.js";
import { EditorTypes } from "./view2d_base.js";
import type { View2DHandler } from "./view2d.js";
import type { FullContext } from "../../core/context.js";
import type { RowFrame } from "../../path.ux/scripts/core/ui.js";
import type { Spline } from "../../curve/spline.js";

export class SceneObjectEditor extends View2DEditor {
  static STRUCT: string;

  mpos: Vector3;
  start_mpos: Vector3;

  /* fromSTRUCT() builds one of these with no view2d at all. */
  view2d: View2DHandler | undefined;
  /* Spline under the cursor, or undefined when nothing is. */
  highlight_spline: Spline | undefined;
  /* Only ever set by data_link(); the base class has no ctx. */
  ctx!: FullContext;

  /* NOTE: the super() call passed a fifth argument, `keymap`, which is a bare
     undeclared name here -- constructing this threw a ReferenceError.  The
     parameter it fed is ignored by View2DEditor anyway. */
  constructor(view2d?: View2DHandler) {
    super("Object", EditorTypes.OBJECT, EditModes.OBJECT, DataTypes.FRAMESET);

    this.mpos = new Vector3();
    this.start_mpos = new Vector3();

    this.define_keymap();
    this.view2d = view2d;

    this.highlight_spline = undefined;
  }

  on_area_inactive(view2d: View2DHandler) {}

  editor_duplicate(view2d: View2DHandler) {
    var m = new SceneObjectEditor(view2d);

    m.selectmode = this.selectmode;
    m.keymap = this.keymap;

    return m;
  }

  static fromSTRUCT(reader: (obj: SceneObjectEditor) => void) {
    var m = new SceneObjectEditor();
    reader(m);

    return m;
  }

  data_link(block: DataBlock, getblock: GetBlockFunc, getblock_us: GetBlockUserFunc) {
    this.ctx = new Context();
  }

  add_menu(view2d: View2DHandler, mpos: number[], add_title = true) {}

  on_tick(ctx: FullContext) {
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

  build_sidebar1(view2d: View2DHandler, col: RowFrame<FullContext>) {}

  build_bottombar(view2d: View2DHandler, col: RowFrame<FullContext>) {}

  define_keymap() {
    var k = this.keymap;
  }

  set_selectmode(mode: number) {
    this.selectmode = mode;
  }

  //returns number of selected items
  do_select(event: MouseEvent, mpos: number[], view2d: View2DHandler, do_multiple: boolean) {
    //console.log("XXX do_select!", mpos);

    return false;
  }

  tools_menu(ctx: FullContext, mpos: number[], view2d: View2DHandler) {
    let ops: string[] = [];

    var menu = view2d.toolop_menu(ctx, "Tools", ops);

    view2d.call_menu(menu, view2d, mpos);
  }

  on_inactive(view2d: View2DHandler) {}

  on_active(view2d: View2DHandler) {}

  rightclick_menu(event: MouseEvent, view2d: View2DHandler) {}

  on_mousedown(event: MouseEvent) {}

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
  findnearest(
    mpos: number[],
    selectmask: number,
    limit: number,
    ignore_layers: boolean
  ): ToolModeHit | undefined {
    return undefined;
  }

  on_mousemove(event: MouseEvent) {
    this.mdown = true;
  }

  on_mouseup(event: MouseEvent) {
    this.mdown = false;
  }

  do_alt_select(event: MouseEvent, mpos: number[], view2d: View2DHandler) {}

  gen_edit_menu(add_title = false) {}

  delete_menu(event: MouseEvent) {}
}

SceneObjectEditor.STRUCT = `
SceneObjectEditor {
  selectmode : int;
}
`;

import { ScreenArea, Area } from "../../path.ux/scripts/screen/ScreenArea.js";
