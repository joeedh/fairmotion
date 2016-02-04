"use strict";

import {STRUCT} from 'struct';

//bitmask
//VERT/EDGE/FACE is compatible with MeshTypes, thus why we skip 4
export var EditModes = {VERT : 1, EDGE : 2, FACE : 8, OBJECT : 16, GEOMETRY : 1|2|8};

export var SessionFlags = {
  PROP_TRANSFORM : 1
}

export class View2DEditor {
  constructor(String name, int type, int lib_type, KeyMap keymap) {
    static v3d_idgen = 1;
    
    this.name = name;
    this._id = v3d_idgen++;
    this.type = type;
    this.lib_type = lib_type;
    this.keymap = keymap;
  }

  /*
    View2DEditor is an abstract class,
    but the STRUCT system does require the 
    presence of fromSTRUCT.  Need to review 
    that.
   */
  static fromSTRUCT(Function reader) {
    var obj = {};
    reader(obj);
    
    return obj;
  }
  
  get_keymaps() : Array<KeyMap> {
    return [this.keymap];
  }
  
  on_area_inactive(View2DHandler view2d) {}
  
  on_inactive(View2DHandler view2d) {}
  on_active(View2DHandler view2d) {}
  
  data_link(DataBlock block, Function getblock, Function getblock_us) {}
  
  //returns new copy
  editor_duplicate(View2DHandler view2d) {}
  render_selbuf(WebGLRenderingContext gl, View2DHandler view2d, int typemask) {}

  selbuf_changed(int typemask) {}
  reset_selbuf_changed(int typemask) {}
  add_menu(View2DHandler view2d, Array<float> mpos) {}
  draw_object(WebGLRenderingContext gl, View2DHandler view2d, ASObject object, Boolean is_active) {}
  
  build_sidebar1(View2DHandler view2d, RowFrame panel) {}
  build_bottombar(View2DHandler view2d) {}
  
  set_selectmode(int mode) {}

  //returns number of selected items
  do_select(MouseEvent event, Array<float> mpos, View2DHandler view2d) {}
  
  tools_menu(Context ctx, Array<float> mpos, View2DHandler view2d) {}
  rightclick_menu(MouseEvent event, View2DHandler view2d) {}
  
  on_mousedown(MouseEvent event) {}
  on_mousemove(MouseEvent event) {}
  on_mouseup(MouseEvent event) {}
  
  do_alt_select(MouseEvent event, Array<float> mpos, View2DHandler view2d) {}
  delete_menu(MouseEvent event) {}
  gen_delete_menu() : UIMenu {}
}

View2DEditor.STRUCT = """
  View2DEditor {
  }
""";
