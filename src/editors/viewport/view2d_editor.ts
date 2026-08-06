"use strict";

import {STRUCT} from '../../core/struct.js';
import {KeyMap, HotKey} from '../../core/keymap.js';

/* NOTE: this import was commented out, so on_tick() below threw a
   ReferenceError every time it ran. */
import {WidgetResizeOp, WidgetRotateOp} from "./transform_ops.js";
import {ToolModes} from "./selectmode.js";
import type {View2DHandler} from './view2d.js';
import type {ToolModeHit} from './toolmodes/toolmode.js';
import type {FullContext} from '../../core/context.js';
import type {DataBlock, GetBlockFunc, GetBlockUserFunc} from '../../core/lib_api.js';

//bitmask
//VERT/EDGE/FACE is compatible with MeshTypes, thus why we skip 4
export {EditModes, EditorTypes, SessionFlags} from './view2d_base.js';

let v3d_idgen = 0;

export class View2DEditor {
  static STRUCT : string;

  keymap : KeyMap
  selectmode : number;

  name : string;
  _id : number;
  /* EditModes value -- which element kind this backend edits. */
  type : number;
  /* EditorTypes value. */
  editor_type : number;
  /* DataTypes value of the datablock the backend operates on. */
  lib_type : number;
  /* Set by on_mousemove/on_mouseup only; never initialised. */
  mdown! : boolean;

  /* NOTE: both subclasses build a KeyMap and pass it as a fifth argument, but
     this constructor has always ignored it and built its own. */
  constructor(name : string, editor_type : number, type : number,
              lib_type : number, _keymap? : KeyMap) {
    this.name = name;
    this._id = v3d_idgen++;
    this.type = type;
    this.editor_type = editor_type;
    this.lib_type = lib_type;
    this.keymap = new KeyMap("view2d:" + this.constructor.name);
    this.selectmode = 0;
  }

  /*
    View2DEditor is an abstract class,
    but the STRUCT system does require the
    presence of fromSTRUCT.  Need to review
    that.
   */
  static fromSTRUCT(reader : (obj : object) => void) {
    var obj = {};

    reader(obj);

    return obj;
  }

  get_keymaps() : KeyMap[] {
    return [this.keymap];
  }

  on_area_inactive(view2d : View2DHandler) {
  }

  editor_duplicate(view2d : View2DHandler) {
    throw new Error("implement me!");
  }

  data_link(block : DataBlock, getblock : GetBlockFunc,
            getblock_us : GetBlockUserFunc) {
  }

  add_menu(view2d : View2DHandler, mpos : number[], add_title = true) {
  }

  on_tick(ctx : FullContext) {
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

  define_keymap() {
    var k = this.keymap;
  }

  set_selectmode(mode : number) {
    this.selectmode = mode;
  }

  //returns number of selected items
  do_select(event : MouseEvent, mpos : number[], view2d : View2DHandler,
            do_multiple : boolean) {
    //console.log("XXX do_select!", mpos);
    return false;
  }

  tools_menu(ctx : FullContext, mpos : number[], view2d : View2DHandler) {
    //let ops = [];
    //var menu = view2d.toolop_menu(ctx, "Tools", ops);
    //view2d.call_menu(menu, view2d, mpos);
  }

  on_inactive(view2d : View2DHandler) {
  }

  on_active(view2d : View2DHandler) {
  }

  rightclick_menu(event : MouseEvent, view2d : View2DHandler) {
  }

  on_mousedown(event : MouseEvent) {
  }
  //returns [spline, element, mindis]
  findnearest(mpos : number[], selectmask : number, limit : number,
              ignore_layers : boolean) : ToolModeHit | undefined {
    return undefined;
  }

  on_mousemove(event : MouseEvent) {
    this.mdown = true;
  }

  on_mouseup(event : MouseEvent) {
    this.mdown = false;
  }

  do_alt_select(event : MouseEvent, mpos : number[], view2d : View2DHandler) {
  }

  gen_edit_menu(add_title = false) {
  }

  delete_menu(event : MouseEvent) {
  }
}

View2DEditor.STRUCT = `
  View2DEditor {
  }
`;
