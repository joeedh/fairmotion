"use strict";

import {WidgetResizeOp, WidgetRotateOp} from './transform_ops.js';

import {DataTypes} from '../../core/lib_api.js';
import {EditModes} from './view2d_editor.js';

import {SelMask, ToolModes} from './selectmode.js';

import {View2DEditor, SessionFlags} from './view2d_editor.js';
import {DataBlock, DataTypes} from '../../core/lib_api.js';
import {EditorTypes} from './view2d_base.js';

export class SceneObjectEditor extends View2DEditor {
  mpos : Vector3
  start_mpos : Vector3;

  constructor(view2d : View2DHandler) {
    super("Object", EditorTypes.OBJECT, EditModes.OBJECT, DataTypes.FRAMESET, keymap);

    this.mpos = new Vector3();
    this.start_mpos = new Vector3();

    this.define_keymap();
    this.view2d = view2d;

    this.highlight_spline = undefined;
  }

  on_area_inactive(view2d : View2DHandler) {
  }

  editor_duplicate(view2d : View2DHandler) {
    var m = new SceneObjectEditor(view2d);

    m.selectmode = this.selectmode;
    m.keymap = this.keymap;

    return m;
  }

  static fromSTRUCT(reader) {
    var m = new SceneObjectEditor(undefined);
    reader(m);

    return m;
  }

  data_link(block, getblock, getblock_us) {
    this.ctx = new Context();
  }

  add_menu(view2d : View2DHandler, mpos, add_title = true) {
  }

  on_tick(ctx) {
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

  build_sidebar1(view2d : View2DHandler, col : RowFrame) {
  }

  build_bottombar(view2d : View2DHandler, col : RowFrame) {
  }

  define_keymap() {
    var k = this.keymap;
  }

  set_selectmode(mode: int) {
    this.selectmode = mode;
  }

  //returns number of selected items
  do_select(event, mpos, view2d : View2DHandler, do_multiple) {
    //console.log("XXX do_select!", mpos);

    return false;
  }

  tools_menu(ctx, mpos, view2d : View2DHandler) {
    let ops = [];

    var menu = view2d.toolop_menu(ctx, "Tools", ops);

    view2d.call_menu(menu, view2d, mpos);
  }

  on_inactive(view2d : View2DHandler) {
  }

  on_active(view2d : View2DHandler) {
  }

  rightclick_menu(event, view2d : View2DHandler) {
  }

  on_mousedown(event) {
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
  }

  on_mousemove(event) {
    this.mdown = true;
  }

  on_mouseup(event) {
    this.mdown = false;
  }

  do_alt_select(event, mpos, view2d : View2DHandler) {
  }

  gen_edit_menu(add_title = false) {
  }

  delete_menu(event) {
  }
}

SceneObjectEditor.STRUCT = `
SceneObjectEditor {
  selectmode : int;
}
`;

import {ScreenArea, Area} from '../../path.ux/scripts/screen/ScreenArea.js';
