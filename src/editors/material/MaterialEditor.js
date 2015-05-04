import {gen_editor_switcher} from 'UIWidgets_special';

import {
  MinMax
} from 'mathlib';

import {UICanvas} from 'UICanvas2D';
import {STRUCT} from 'struct';
import {PackFlags} from 'UIElement';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, KeyHandler, 
        charmap, TouchEventManager, EventHandler, VelocityPan
       } from 'events';

eval(es6_import_all(_es6_module, 'UIElement'));
eval(es6_import_all(_es6_module, 'UIFrame'));
eval(es6_import_all(_es6_module, 'UIPack'));
eval(es6_import_all(_es6_module, 'UIWidgets'));
eval(es6_import_all(_es6_module, 'UIWidgets_special'));
eval(es6_import_all(_es6_module, 'UITabPanel'));
eval(es6_import_all(_es6_module, 'UITextBox'));

import {ModalStates} from 'toolops_api';

import {SplineFlags} from 'spline_types';
import {ShiftLayerOrderOp} from 'spline_editops';
import {AddLayerOp, ChangeLayerOp, ChangeElementLayerOp} from 'spline_layerops';

/******************* main area struct ********************************/
import {Area} from 'FrameManager';

class LayerPanel extends RowFrame {
  constructor(ctx) {
    super(ctx);
    
    this.last_spline_path = "";
    this.last_total_layers = this.last_active_id = 0;
    
    this.do_rebuild = 1;
    this.delayed_recalc = 0;
  }
  
  build_draw(UICanvas canvas, bool is_vertical) {
    super.build_draw(canvas, is_vertical);
  }
  
  on_tick() {
    if (this.do_rebuild) {
      this.rebuild();
      return;
    }

    super.on_tick();

    if (this.ctx == undefined) return;

    var spline = this.ctx.spline;
    
    var do_rebuild = spline.layerset.length != this.last_total_layers;
    do_rebuild = do_rebuild || this.last_spline_path != this.ctx.splinepath;
    do_rebuild = do_rebuild || spline.layerset.active.id != this.last_active_id;
    
    if (!this.do_rebuild && do_rebuild) {
      this.do_recalc();
    }
    
    this.do_rebuild |= do_rebuild;
    
    if (this.delayed_recalc) {
      this.delayed_recalc--;
      
      this.do_recalc();
      this.do_full_recalc();
      window.redraw_ui();
    }
  }
  
  rebuild() {
    if (this.ctx == undefined) return;
    this.do_rebuild = false;
    
    console.log("layers ui rebuild!");
    
    var spline = this.ctx.spline;
    
    this.last_spline_path = this.ctx.splinepath;
    this.last_total_layers = spline.layerset.length;
    this.last_active_id = spline.layerset.active.id;
    
    while (this.children.length > 0) {
      this.remove(this.children[0]);
    }
    
    this.label("Layers");
    
    var controls = this.col();
    
    var add = new UIButton(this.ctx, "+");
    var this2 = this;
    add.callback = function() {
      g_app_state.toolstack.exec_tool(new AddLayerOp());
      //this2.do_rebuild = true;
      //this2.do_recalc();
    }
    
    var del = new UIButton(this.ctx, "-");
    var up = new UIButtonIcon(this.ctx, "Up", 30);
    var down = new UIButtonIcon(this.ctx, "Down", 29);
    
    var this2 = this;
    down.callback = function() {
      console.log("Shift layers down");
      var ctx = new Context(), spline = ctx.spline;
      var layer = spline.layerset.active;
      
      var tool = new ShiftLayerOrderOp(layer.id, -1);
      g_app_state.toolstack.exec_tool(tool);
      this2.rebuild();
    }
    up.callback = function() {
      console.log("Shift layers up");
      var ctx = new Context(), spline = ctx.spline;
      var layer = spline.layerset.active;
      
      var tool = new ShiftLayerOrderOp(layer.id, 1);
      g_app_state.toolstack.exec_tool(tool);
      this2.rebuild();
    }
    
    this.controls = {
      add  : add,
      del  : del,
      up   : up,
      down : down
    };
    
    for (var k in this.controls) {
      controls.add(this.controls[k]);
    }
    
    var list = this.list = new UIListBox();
    list.size = [200, 250];
    
    this.add(list);
    
    for (var i=spline.layerset.length-1; i>= 0; i--) {
      var layer = spline.layerset[i];
      
      list.add_item(layer.name, layer.id);
    }
    
    list.set_active(spline.layerset.active.id);
    list.callback = function(list, text, id) {
      var layer = spline.layerset.idmap[id];
      if (layer == undefined) {
        console.log("Error!", arguments);
        return;
      }
      
      console.log("Changing layers!");
      g_app_state.toolstack.exec_tool(new ChangeLayerOp(id));
    }
    
    var controls2 = this.col();
    controls2.add(new UIButton(this.ctx, "Sel Up"));
    controls2.add(new UIButton(this.ctx, "Sel Down"));
    
    var this2 = this;
    controls2.children[0].callback = function() {
      var lset = this2.ctx.spline.layerset;
      var oldl = lset.active;
      
      console.log("oldl", oldl);
      
      if (oldl.order == lset.length-1) return;
      var newl = lset[oldl.order+1];

      var tool = new ChangeElementLayerOp(oldl.id, newl.id);
      
      g_app_state.toolstack.exec_tool(tool);
    }
    
    controls2.children[1].callback = function() {
      var lset = this2.ctx.spline.layerset;
      var oldl = lset.active;
      
      console.log("oldl", oldl);
      
      if (oldl.order == 0) return;
      var newl = lset[oldl.order-1];

      var tool = new ChangeElementLayerOp(oldl.id, newl.id);
      
      g_app_state.toolstack.exec_tool(tool);
    }
    
    var controls3 = this.col();
    controls3.prop('spline.active_layer.flag');
    
    this.delayed_recalc = 4;
  }
}

class MaterialEditor extends Area {
  fill_panel() {
    var ctx = this.ctx;
    
    var panel = new RowFrame(ctx);
    panel.packflag |= PackFlags.INHERIT_WIDTH;
    panel.packflag |= PackFlags.NO_AUTO_SPACING;
    panel.packflag |= PackFlags.IGNORE_LIMIT;
    
    //"spline.faces{($.flag & 1) && !$.hidden}.fillcolor"
    
    panel.label("Fill Color");
    panel.prop("spline.active_face.mat.fillcolor", undefined, 
               "spline.faces{(ctx.spline.layerset.active.id in $.layers) && ($.flag & 1) && !$.hidden}.mat.fillcolor");
    panel.prop("spline.active_face.mat.blur", undefined, 
               "spline.faces{(ctx.spline.layerset.active.id in $.layers) && ($.flag & 1) && !$.hidden}.mat.blur");
    
    return panel
  }
  
  stroke_panel() {
    var ctx = this.ctx;
    
    var panel = new RowFrame(ctx);
    panel.packflag |= PackFlags.INHERIT_WIDTH;
    panel.packflag |= PackFlags.NO_AUTO_SPACING;
    panel.packflag |= PackFlags.IGNORE_LIMIT;
    
    var set_prefix = "spline.segments{(ctx.spline.layerset.active.id in $.layers) && ($.flag & 1) && !$.hidden}.mat";
    
    panel.label("Stroke Color");
    panel.prop("spline.active_segment.mat.strokecolor", undefined, 
               set_prefix + ".strokecolor");
    panel.prop("spline.active_segment.mat.linewidth", undefined, 
               set_prefix + ".linewidth");
    panel.prop("spline.active_segment.mat.blur", undefined, 
               set_prefix + ".blur");
    panel.prop("spline.active_segment.renderable", undefined,
               "spline.segments{($.flag & 1) && !$.hidden}.renderable");
    
    panel.prop("spline.active_segment.mat.flag[MASK_TO_FACE]", undefined, 
               set_prefix + ".flag[MASK_TO_FACE]");
    
    return panel
  }
  
  layers_panel() {
    return new LayerPanel(new Context());
  }
  
  constructor(Context ctx, Array<float> pos, Array<float> size) {
    super(MaterialEditor.name, MaterialEditor.uiname, new Context(), pos, size);
    
    this.mm = new MinMax(2);
    this.keymap = new KeyMap();
    this.define_keymap();
    
    this.drawlines = new GArray<drawlines>();
    this.pan_bounds = [[0, 0], [0, 0]];
    
    this._filter_sel = false;
    this.ctx = new Context();
    
    if (size == undefined)
      size = [1, 1];
    
    this.subframe = new UITabPanel(new Context(), [size[0], size[1]]);
    this.subframe.packflag |= PackFlags.NO_AUTO_SPACE|PackFlags.INHERIT_WIDTH;
    this.subframe.size[0] = this.size[0];
    this.subframe.size[1] = this.size[1];
    this.subframe.pos = [0, Area.get_barhgt()];
    this.subframe.state |= 0; //UIFlags.HAS_PAN|UIFlags.IS_CANVAS_ROOT|UIFlags.PAN_CANVAS_MAT;
    this.subframe.velpan = new VelocityPan();
    
    this.subframe.add_tab("Fill", this.fill_panel());
    this.subframe.add_tab("Stroke", this.stroke_panel());
    this.subframe.add_tab("Layers", this.layers_panel());
    
    this.add(this.subframe);
  }
  
  define_keymap() {
  }
  
  on_tick() {
    if (g_app_state.modalstate & ModalStates.PLAYING) {
      this.state |= UIFlags.BLOCK_REPAINT;
      return;
    } else {
      this.state &= ~UIFlags.BLOCK_REPAINT;
    }
    
    Area.prototype.on_tick.call(this);
  }
  
  static default_new(Context ctx, ScreenArea scr, WebGLRenderingContext gl, 
                     Array<float> pos, Array<float> size) : MaterialEditor
  {
    var ret = new MaterialEditor(ctx, pos, size);
    return ret;
  }
  
  on_mousedown(MouseEvent event) {
    if (event.button == 1 && !g_app_state.was_touch) {
      this.subframe.start_pan([event.x, event.y], 1);
    } else {
      super.on_mousedown(event);
    }
  }

  on_area_inactive() {
    this.destroy();
    prior(MaterialEditor, this).on_area_inactive.call(this);
  }
    
  area_duplicate() : MaterialEditor {
    var ret = new MaterialEditor(this.pos[0], this.pos[1], this.size[0], this.size[1]);
    
    return ret;
  } 
  
  destroy() {
    //this.subframe.canvas.destroy(g_app_state.gl);
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
      console.log("resizing subframe");
      
      this.subframe.size[0] = this.size[0];
      this.subframe.size[1] = sy;
      this.subframe.on_resize(this.size, this.subframe.size);
    }
    
    this.subframe.canvas.viewport = this.canvas.viewport;
  
    super.build_draw(canvas, isVertical);
    
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
   
  data_link(DataBlock block, Function getblock, Function getblock_us) {
    
  }
  
  static fromSTRUCT(reader) {
    var ret = new MaterialEditor();
    reader(ret);
    return ret;
  }
}

MaterialEditor.STRUCT = STRUCT.inherit(MaterialEditor, Area) + """
  }
"""
MaterialEditor.uiname = "Materials";
MaterialEditor.debug_only = false;
