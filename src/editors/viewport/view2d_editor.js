"use strict";

import {STRUCT} from 'struct';
import {KeyMap, ToolKeyHandler, FuncKeyHandler, HotKey,
  charmap, TouchEventManager, EventHandler} from '../events';
//import {WidgetResizeOp, WidgetRotateOp} from "./transform_ops";
import {ToolModes} from "./selectmode";

//bitmask
//VERT/EDGE/FACE is compatible with MeshTypes, thus why we skip 4
export {EditModes, EditorTypes, SessionFlags} from 'view2d_base.js';

let v3d_idgen = 0;

export class View2DEditor {
  constructor(name : String, editor_type : int, type : int, lib_type : int) {
    this.name = name;
    this._id = v3d_idgen++;
    this.type = type;
    this.editor_type = editor_type;
    this.lib_type = lib_type;
    this.keymap = new KeyMap();
    this.selectmode = 0;
  }

  /*
    View2DEditor is an abstract class,
    but the STRUCT system does require the 
    presence of fromSTRUCT.  Need to review 
    that.
   */
  static fromSTRUCT(reader : Function) {
    var obj = {};

    reader(obj);
    
    return obj;
  }
  
  get_keymaps() : Array<KeyMap> {
    return [this.keymap];
  }

  on_area_inactive(view2d : View2DHandler) {
  }

  editor_duplicate(view2d : View2DHandler) {
    throw new Error("implement me!");
  }

  data_link(block, getblock, getblock_us) {
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
    //let ops = [];
    //var menu = view2d.toolop_menu(ctx, "Tools", ops);
    //view2d.call_menu(menu, view2d, mpos);
  }

  on_inactive(view2d : View2DHandler) {
  }

  on_active(view2d : View2DHandler) {
  }

  rightclick_menu(event, view2d : View2DHandler) {
  }

  on_mousedown(event) {
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

View2DEditor.STRUCT = """
  View2DEditor {
  }
""";
