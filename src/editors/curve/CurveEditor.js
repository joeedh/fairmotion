import {Area} from 'ScreenArea';
import {STRUCT} from 'struct';
import {UIBase} from 'ui_base';
import {Editor} from 'editor_base';

export class CurveEditor extends Editor {
  static define() { return {
    tagname : "curve-editor-x",
    areaname : "curve_editor",
    uiname : "Curve Editor",
    icon : Icons.CURVE_EDITOR
  }}

  copy() {
    return document.createElement("curve-editor-x");
  }
}

CurveEditor.STRUCT = STRUCT.inherit(CurveEditor, Area) + `
}
`;
Editor.register(CurveEditor);


#if 0
"use strict";

import {aabb_isect_2d} from 'mathlib';
import {gen_editor_switcher} from 'UIWidgets_special';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, HotKey,
  charmap, TouchEventManager, EventHandler} from '../events';

import {STRUCT} from 'struct';
import {phantom, KeyTypes, FilterModes,
  get_select, get_time, set_select, set_time
} from 'dopesheet_phantom';

import {PackFlags, UIElement, UIFlags, CanvasFlags} from 'UIElement';
import {UIFrame} from 'UIFrame';
import {
  UIButtonAbstract, UIButton, UIButtonIcon,
  UIMenuButton, UICheckBox, UINumBox, UILabel,
  UIMenuLabel, ScrollButton, UIVScroll, UIIconCheck
} from 'UIWidgets';

import {UISplitFrame} from 'UISplitFrame';

import {RowFrame, ColumnFrame, UIPackFrame} from 'UIPack';
import {UITextBox} from 'UITextBox';
import {ToolOp, UndoFlags, ToolFlags} from 'toolops_api';
import {UITabBar} from 'UITabPanel';

import {UICollapseIcon} from 'UIWidgets_special';

import {ToolOp} from 'toolops_api';
import {RowFrame} from 'UIPack';
import {UndoFlags} from 'toolops_api';

import {Spline, RestrictFlags} from 'spline';
import {CustomDataLayer, SplineTypes, SplineFlags, SplineSegment} from 'spline_types';
import {TimeDataLayer, get_vtime, set_vtime,
  AnimKey, AnimChannel, AnimKeyFlags, AnimInterpModes
} from 'animdata';

import {SplineLayerFlags, SplineLayerSet} from 'spline_element_array';

import {SplineFlags} from 'spline_base';
import {AddLayerOp, ChangeLayerOp, ChangeElementLayerOp} from 'spline_layerops';
import {DissolveVertOp} from 'spline_editops';

import {ShiftTimeOp2, ShiftTimeOp3, SelectOp, DeleteKeyOp,
  ColumnSelect, SelectKeysToSide, ToggleSelectOp
} from 'dopesheet_ops';

/******************* main area struct ********************************/
import {Area} from 'ScreenArea';
import {UISplitFrame} from "../../ui/UISplitFrame";
import {TreePanel} from "../dopesheet/DopeSheetEditor";

export class CurveEditor extends Area {
  constructor(pos, size) {
    super(CurveEditor.name, CurveEditor.uiname, new Context(), pos, size);
    
    this.pinned_ids = undefined;
  }
  
  build_layout() {
    build_layout() {
      this.channels = new TreePanel();
      this.channels.size[0] = 100;
      this.channels.size[1] = 600;
    
      //this.add(this.channels);
    
      super.build_layout(false, true);
    
      //*
      this.middlesplit.horizontal = true;
      let sidebar = this.middlesplit.initial();
      sidebar.state |= UIFlags.BG_EVENTS_TRANSPARENT;
      this.middlesplit.split(145, false, false, true).state |= UIFlags.BG_EVENTS_TRANSPARENT;
    
      sidebar.draw_background = false;
      sidebar.add(this.channels);
      //*/
    }
  }
  
  build_bottombar(the_row) {
    var ctx = new Context();
    
    this.ctx = ctx;
    
    the_row.packflag |= PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING|PackFlags.IGNORE_LIMIT;
    the_row.default_packflag = PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
    the_row.draw_background = true;
    the_row.rcorner = 100.0
    the_row.pos = [0, 2]
    the_row.size = [this.size[0], Area.get_barhgt()];
    
    var col = the_row.col();
    
    col.add(gen_editor_switcher(this.ctx, this));
    
    col.prop("editcurve.selected_only");
    col.prop("editcurve.pinned");
  }

  static fromSTRUCT(reader) {
    var ret = new CurveEditor();
  
    reader(ret);
  
    if (ret.pan != undefined) {
      ret.velpan.pan[0] = ret.pan[0];
      ret.velpan.pan[1] = ret.pan[1];
    
      delete ret.pan;
    }
  
    if (ret.pinned_ids != undefined && ret.pinned_ids.length == 0) {
      delete ret.pinned_ids;
    }
  
    return ret;
  }
}

CurveEditor.STRUCT = STRUCT.inherit(CurveEditor, Area) + `
    pan             : vec2 | obj.velpan.pan;
    zoom            : float;
    selected_only   : int;
    pinned_ids     : array(int) | obj.pinned_ids != undefined ? obj.pinned_ids : [];
}
`;

CurveEditor.uiname = "Curve Editor";
#endif
