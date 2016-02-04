"use strict";

import {gen_editor_switcher} from 'UIWidgets_special';

import {
  MinMax
} from 'mathlib';

import {UICanvas} from 'UICanvas2D';
import {STRUCT} from 'struct';
import {PackFlags, UIElement, UIFlags, CanvasFlags} from 'UIElement';
import {UIFrame} from 'UIFrame';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, KeyHandler, 
        charmap, TouchEventManager, EventHandler, VelocityPan} from 'events';

import {
  UIButtonAbstract, UIButton, UIButtonIcon,
  UIMenuButton, UICheckBox, UINumBox, UILabel,
  UIMenuLabel, ScrollButton, UIVScroll, UIIconCheck
} from 'UIWidgets';

import {RowFrame, ColumnFrame, UIPackFrame} from 'UIPack';
import {UITextBox} from 'UITextBox';
import {ToolOp, UndoFlags, ToolFlags} from 'toolops_api';
import {UITabBar} from 'UITabPanel';
import {UICollapseIcon, UIPanel, UIColorField, UIColorBox,
        UIColorPicker, UIProgressBar, UIListBox, UIListEntry,
        UIBoxWColor
       } from 'UIWidgets_special';
import {UITabPanel} from 'UITabPanel';

/******************* main area struct ********************************/
import {Area} from 'ScreenArea';

class SettingsEditor extends Area {
  do_theme_color(int i, String prefix) : UIFrame {
    var ctx=this.ctx;
    var path = prefix + i + "]";
    
    var type = this.ctx.api.get_prop(ctx, path + ".type");
    
    if (type == "Simple") {
      var ret = new UIColorPicker(ctx);
      
      ret.state |= UIFlags.USE_PATH;
      ret.data_path = path + ".color";
      ret.on_tick(); //XXX should not need this!
      //ret.update_widgets();
      
      return ret;
    } else if (type == "Weighted") {
      var ret = new UIBoxWColor(ctx, path);
      return ret;
    } else {
      var ret = new UIBoxWColor(ctx, path);
      return ret;
      return new UILabel(ctx, "invalid theme entry");
    }
  }
  
  /*
  theme_panel() : UIFrame {
    var ret = new UITabPanel(this.ctx);
    
    var panel1 = this.colortheme_panel("theme.ui.colors[", g_theme.ui.flat_colors)
    var panel2 = this.colortheme_panel("theme.view2d.colors[", g_theme.view2d.flat_colors)
    
    ret.add_tab("Interface", panel1);
    ret.add_tab("3D Viewport", panel2);
    
    ret.packflag |= PackFlags.NO_AUTO_SPACE|PackFlags.INHERIT_WIDTH;
    
    return ret;
  }
  */
  
  colortheme_panel(String prefix, Array<float> flat_colors) : UIFrame {
    var ctx = this.ctx;
    
    var panel = new RowFrame(ctx);
    var listbox = new UIListBox(ctx, undefined, [200, 200]);
    var theme = g_theme;
    
    g_theme.ui.gen_colors();
    
    for (var j=0; j<flat_colors.length; j++) {
      listbox.add_item(flat_colors[j][0], j);
    }
    
    //XXX check if order of theme list changed for some reason
    var on_tick = listbox.on_tick;
    listbox.on_tick = function() {
      on_tick.apply(this, arguments);
      
      var update = g_theme.ui.flat_colors.length != flat_colors.length;
      for (var j=0; !update && j<g_theme.ui.flat_colors.length; j++) {
        if (g_theme.ui.flat_colors[j][0] != flat_colors[j][0]) {
          update = true;
        }
      }
      
      if (update) {
        flat_colors = g_theme.ui.flat_colors;
        
        this.reset();
        for (var j=0; j<g_theme.ui.flat_colors.length; j++) {
          this.add_item(g_theme.ui.flat_colors[j][0], j);
        }
      }
    }
    
    var this2 = this;
    function callback(listbox, text, id) {
      var e = this2.do_theme_color(id, prefix);
      console.log("ID!", id);
      
      if (panel.themebox != undefined) {
        panel.replace(panel.themebox, e);
      } else {
        panel.add(e);
      }
      
      panel.themebox = e;
    }
    
    listbox.callback = callback;
    
    panel.add(listbox);
    panel.themebox = this.do_theme_color(0, prefix);
    panel.add(panel.themebox);
    
    panel.packflag |= PackFlags.INHERIT_WIDTH;
    
    return panel;
  }
  
  units_panel() {
    var ctx = this.ctx;
    
    var panel = new RowFrame(ctx);
    panel.packflag |= PackFlags.INHERIT_WIDTH;
    panel.packflag |= PackFlags.NO_AUTO_SPACING;
    panel.packflag |= PackFlags.IGNORE_LIMIT;
    
    panel.label("Unit System");
    panel.prop("settings.unit_system");
    panel.label("Default Unit");
    panel.prop("settings.default_unit");
    
    return panel
  }
  
  constructor(Context ctx, Array<float> pos, Array<float> size) {
    Area.call(this, SettingsEditor.name, SettingsEditor.uiname, new Context(), pos, size);
    
    this.mm = new MinMax(2);
    this.keymap = new KeyMap();
    this.define_keymap();
    
    this.drawlines = new GArray<drawlines>();
    this.pan_bounds = [[0, 0], [0, 0]];

    this._filter_sel = false;
    this.ctx = new Context();
    
    this.subframe = new UITabPanel(new Context(), [size[0], size[1]]);
    this.subframe.packflag |= PackFlags.NO_AUTO_SPACE|PackFlags.INHERIT_WIDTH;
    this.subframe.size[0] = this.size[0];
    this.subframe.size[1] = this.size[1];
    this.subframe.pos = [0, Area.get_barhgt()];
    this.subframe.state |= UIFlags.HAS_PAN|UIFlags.IS_CANVAS_ROOT|UIFlags.PAN_CANVAS_MAT;
    this.subframe.velpan = new VelocityPan();
    
    this.subframe.add_tab("Units", this.units_panel());
    this.subframe.add_tab("UI Colors", this.colortheme_panel("theme.ui.colors[", g_theme.ui.flat_colors));
    //this.subframe.add_tab("View2D Colors", this.colortheme_panel("theme.view2d.colors[", g_theme.view2d.flat_colors));
    
    this.add(this.subframe);
  }
  
  define_keymap() {
  }
  
  static default_new(Context ctx, ScreenArea scr, WebGLRenderingContext gl, 
                     Array<float> pos, Array<float> size) : SettingsEditor
  {
    var ret = new SettingsEditor(ctx, pos, size);
    return ret;
  }
  
  on_mousedown(MouseEvent event) {
    if (event.button == 1 && !g_app_state.was_touch) {
      this.subframe.start_pan([event.x, event.y], 1);
    } else {
      prior(SettingsEditor, this).on_mousedown.call(this, event);
    }
  }

  on_area_inactive() {
    this.destroy();
    prior(SettingsEditor, this).on_area_inactive.call(this);
  }
    
  area_duplicate() : SettingsEditor {
    var ret = new SettingsEditor(this.pos[0], this.pos[1], this.size[0], this.size[1]);
    
    return ret;
  } 
  
  destroy() {
    this.subframe.canvas.destroy();
    Area.prototype.destroy.call(this);
  }
  
  build_topbar()
  {
    this.ctx = new Context();
    
    var col = new ColumnFrame(this.ctx, undefined, PackFlags.ALIGN_LEFT);
    
    this.topbar = col;
    col.packflag |= PackFlags.IGNORE_LIMIT;
    
    col.size = [this.size[0], Area.get_barhgt()];
    col.draw_background = true
    col.rcorner = 100.0
    col.pos = [0, this.size[1]-Area.get_barhgt()]
    
    //add items here
    
    this.rows.push(col);
    this.add(col);
  }
  
  build_bottombar() {
    var ctx = new Context();
    var col = new ColumnFrame(ctx);
    
    col.packflag |= PackFlags.ALIGN_LEFT;
    col.default_packflag = PackFlags.ALIGN_LEFT;
    
    col.draw_background = true;
    col.rcorner = 100.0
    col.pos = [0, 2]
    col.size = [this.size[0], Area.get_barhgt()];
    
    col.add(gen_editor_switcher(this.ctx, this));
    
    this.rows.push(col);
    this.add(col);
  }
  
  build_draw(UICanvas canvas, Boolean isVertical) {
    this.subframe.set_pan();
    var ctx = this.ctx = new Context();
    
    //paranoid check
    var sx = this.size[0];
    var sy = this.size[1]-this.subframe.pos[1]-Area.get_barhgt();
    var s1 = this.size, s2=this.subframe.size;
    
    if (s2[0] != sx || s2[1] != sy) {
      //console.log("resizing subframe");
      this.subframe.size[0] = this.size[0];
      this.subframe.size[1] = sy;
      this.subframe.on_resize(this.size, this.subframe.size);
    }
    
    this.subframe.canvas.viewport = this.canvas.viewport;
    
    prior(SettingsEditor, this).build_draw.call(this, canvas, isVertical);
    
    this.mm.reset();
    var arr = [0, 0];
    for (var c of this.children) {
      this.mm.minmax(c.pos);
      arr[0] = c.pos[0]+c.size[0];
      arr[1] = c.pos[1]+c.size[1];
      
      this.mm.minmax(c.pos);
      this.mm.minmax(arr);
    }
    
    this.pan_bounds[1][1] = this.mm.max[1]-this.mm.min[1]-this.size[1];
  }
  
  set_canvasbox() {
    this.asp = this.size[0] / this.size[1];
  }
  
  static fromSTRUCT(reader) {
    var obj = new SettingsEditor(new Context(), [0,0], [1,1]);
    reader(obj);
    
    /*if (obj.pan != undefined) {
      obj.subframe.velpan = new VelocityPan();
      obj.subframe.velpan.pan = new Vector2(obj.pan);
    }*/
    
    return obj;
  }
  
  data_link(DataBlock block, Function getblock, Function getblock_us) {
    
  }
}

SettingsEditor.STRUCT = STRUCT.inherit(SettingsEditor, Area) + """
  }
"""
SettingsEditor.uiname = "Settings";
SettingsEditor.debug_only = false;