import {Area} from '../../path.ux/scripts/screen/ScreenArea.js';
import {STRUCT} from '../../core/struct.js';
import {Container} from '../../path.ux/scripts/core/ui.js';
import {Editor} from '../editor_base.js';

import {PackFlags, UIBase, saveUIData, loadUIData} from '../../path.ux/scripts/core/ui_base.js';
import {ShiftLayerOrderOp} from '../viewport/spline_editops.js';
import {AddLayerOp, DeleteLayerOp, ChangeLayerOp, ChangeElementLayerOp} from '../viewport/spline_layerops.js';

import '../../path.ux/scripts/widgets/ui_table.js';
import '../../path.ux/scripts/widgets/ui_menu.js';
import '../../path.ux/scripts/widgets/ui_listbox.js';

import {LastToolPanel} from '../../path.ux/scripts/widgets/ui_lasttool.js';
import {TPropFlags} from '../../core/toolprops.js';

export class MyLastToolPanel extends LastToolPanel {
  getToolStackHead(ctx) {
    return ctx.toolstack.head;
  }

  buildTool(ctx, tool, container) {
    for (let k in tool.inputs) {
      let prop = tool.inputs[k];

      if (prop.flag & TPropFlags.PRIVATE) {
        continue;
      }

      let apiname = prop.apiname || k;
      let path = "last_tool." + apiname;

      container.prop(path);
    }
  }

  static define() {return {
    tagname : 'last-tool-panel-fairmotion-x'
  }}
}

UIBase.register(MyLastToolPanel);

function list(iter) {
  let ret = [];

  for (let item of iter) {
    ret.push(item);
  }

  return ret;
}

class LayerPanel extends Container {
  last_active_id : number
  do_rebuild : number
  delayed_recalc : number;

  constructor(ctx) {
    super(ctx);

    //this.last_spline_path = "";
    this.last_total_layers = this.last_active_id = 0;

    this.do_rebuild = 1;
    this.delayed_recalc = 0;
  }

  init() {
    super.init();
  }

  update() {
    if (this.do_rebuild) {
      this.rebuild();
      return;
    }

    super.update();

    if (this.ctx == undefined) return;

    var spline = this.ctx.frameset.spline;

    var do_rebuild = spline.layerset.length != this.last_total_layers;
    //do_rebuild = do_rebuild || this.last_spline_path != this.ctx.splinepath;
    do_rebuild = do_rebuild || spline.layerset.active.id != this.last_active_id;

    this.do_rebuild |= do_rebuild;

    if (this.delayed_recalc > 0) {
      this.delayed_recalc--;

      this.update();
    }
  }

  rebuild() {
    if (this.ctx == undefined) return;
    this.do_rebuild = false;

    console.log("layers ui rebuild!");

    var spline = this.ctx.frameset.spline;

    //this.last_spline_path = this.ctx.splinepath;
    this.last_total_layers = spline.layerset.length;
    this.last_active_id = spline.layerset.active.id;

    for (let child of this.childNodes) {
      child.remove();
    }
    for (let child of this.shadow.childNodes) {
      child.remove();
    }
    for (let child of this.children) {
      child.remove();
    }

    this.label("Layers");

    let listbox = this.listbox();

    for (var i=spline.layerset.length-1; i>= 0; i--) {
      var layer = spline.layerset[i];

      let row = listbox.addItem(layer.name, layer.id);
      console.log("Adding item", layer.name);
      //list.add_item(layer.name, layer.id);
    }

    if (spline.layerset.active !== undefined) {
      listbox.setActive(spline.layerset.active.id);
    }

    listbox.onchange = (id, item) => {
      var layer = spline.layerset.idmap[id];

      if (layer == undefined) {
        console.log("Error!", arguments);
        return;
      }

      console.log("Changing layers!", id);ChangeLayerOp
      g_app_state.toolstack.execTool(new ChangeLayerOp(id));
    }
    let row = this.row();

    row.iconbutton(Icons.SMALL_PLUS, "Add Layer", () => {
      g_app_state.toolstack.execTool(new AddLayerOp());
      this.rebuild();
    }, undefined);
    row.iconbutton(Icons.SCROLL_UP, "Move Up", () => {
      console.log("Shift layers up");
      var ctx = new Context(), spline = ctx.frameset.spline;
      var layer = spline.layerset.active;

      var tool = new ShiftLayerOrderOp(layer.id, 1);
      g_app_state.toolstack.execTool(tool);
      this.rebuild();
    }, undefined);
    row.iconbutton(Icons.SCROLL_DOWN, "Move Down", () => {
      console.log("Shift layers down");
      var ctx = new Context(), spline = ctx.frameset.spline;
      var layer = spline.layerset.active;

      var tool = new ShiftLayerOrderOp(layer.id, -1);
      g_app_state.toolstack.execTool(tool);
      this.rebuild();
    }, undefined);
    row.iconbutton(Icons.SMALL_MINUS, "Remove Layer", () => {
      var tool = new DeleteLayerOp();
      var layer = this.ctx.spline.layerset.active;

      if (layer == undefined)
        return;

      tool.inputs.layer_id.set_data(layer.id);
      g_app_state.toolstack.execTool(tool);
      this.rebuild();
    }, undefined);

    row = this.row();
    row.button("Move Up", () => {
      var lset = this.ctx.frameset.spline.layerset;
      var oldl = lset.active;

      console.log("oldl", oldl);

      if (oldl.order === lset.length-1) return;
      var newl = lset[oldl.order+1];

      var tool = new ChangeElementLayerOp(oldl.id, newl.id);

      this.ctx.toolstack.execTool(tool);

    });

    row.button("Move Down", () => {
      var lset = this.ctx.frameset.spline.layerset;
      var oldl = lset.active;

      console.log("oldl", oldl);

      if (oldl.order == 0) return;
      var newl = lset[oldl.order-1];

      var tool = new ChangeElementLayerOp(oldl.id, newl.id);

      this.ctx.toolstack.execTool(tool);
    });

    row.prop('frameset.drawspline.active_layer.flag[HIDE]');
    row.prop('frameset.drawspline.active_layer.flag[CAN_SELECT]');

    this.flushUpdate();
  }

  _old() {
    return;
    var controls = this.col();

    var add = new UIButtonIcon(this.ctx, "Add");
    var del = new UIButtonIcon(this.ctx, "Delete");
    add.icon = Icons.SMALL_PLUS;
    del.icon = Icons.SMALL_MINUS;


    var this2 = this;
    add.callback = function() {
      g_app_state.toolstack.execTool(new AddLayerOp());
    }

    del.callback = function() {
      var tool = new DeleteLayerOp();
      var layer = this.ctx.spline.layerset.active;

      if (layer == undefined)
        return;

      tool.inputs.layer_id.set_data(layer.id);
      g_app_state.toolstack.execTool(tool);
    }

    var up = new UIButtonIcon(this.ctx, "Up", 30);
    var down = new UIButtonIcon(this.ctx, "Down", 29);

    up.icon = Icons.SCROLL_UP;
    down.icon = Icons.SCROLL_DOWN;

    var this2 = this;
    down.callback = function() {
      console.log("Shift layers down");
      var ctx = new Context(), spline = ctx.frameset.spline;
      var layer = spline.layerset.active;

      var tool = new ShiftLayerOrderOp(layer.id, -1);
      g_app_state.toolstack.execTool(tool);
      this2.rebuild();
    }
    up.callback = function() {
      console.log("Shift layers up");
      var ctx = new Context(), spline = ctx.frameset.spline;
      var layer = spline.layerset.active;

      var tool = new ShiftLayerOrderOp(layer.id, 1);
      g_app_state.toolstack.execTool(tool);
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
      g_app_state.toolstack.execTool(new ChangeLayerOp(id));
    }

    var controls2 = this.col();
    let selup = new UIButton(this.ctx, "Sel Up");
    let seldown = new UIButton(this.ctx, "Sel Down");

    controls2.add(selup);
    controls2.add(seldown);

    var this2 = this;
    selup.callback = function() {
      var lset = this2.ctx.frameset.spline.layerset;
      var oldl = lset.active;

      console.log("oldl", oldl);

      if (oldl.order == lset.length-1) return;
      var newl = lset[oldl.order+1];

      var tool = new ChangeElementLayerOp(oldl.id, newl.id);

      g_app_state.toolstack.execTool(tool);
    }

    seldown.callback = function() {
      var lset = this2.ctx.frameset.spline.layerset;
      var oldl = lset.active;

      console.log("oldl", oldl);

      if (oldl.order == 0) return;
      var newl = lset[oldl.order-1];

      var tool = new ChangeElementLayerOp(oldl.id, newl.id);

      g_app_state.toolstack.execTool(tool);
    }

    var controls3 = this.col();
    controls3.prop('frameset.drawspline.active_layer.flag');

    this.delayed_recalc = 4;
  }

  static define() {return {
    tagname : "layerpanel-x"
  }}
};
UIBase.register(LayerPanel);

export class MaterialEditor extends Editor {
  constructor() {
    super();

    this._last_toolmode = undefined;
    this.define_keymap();
  }

  init() {
    if (this.ctx === undefined) {
      //this.ctx = g_app_state.screen.ctx;
      //XXX eek!
      this.ctx = new Context();
    }

    super.init();
    this.useDataPathUndo = true;

    this.inner = this.container.col();
    this.makeToolbars();

    this.setCSS();
  }

  setCSS() {
    super.setCSS();
    this.style["background-color"] = this.getDefault("DefaultPanelBG");
  }

  update() {
    super.update();

    if (!this.ctx || !this.ctx.toolmode) {
      return;
    }

    let name = this.ctx.toolmode.constructor.name;
    if (name !== this._last_toolmode) {
      this._last_toolmode = name;

      this.rebuild();
    }
  }

  rebuild() {
    let data = saveUIData(this.container, "properties");

    this.makeToolbars();

    loadUIData(this, data);

    this.flushUpdate();
    this.flushUpdate();
  }

  makeToolbars() {
    let row = this.inner;

    row.clear();

    let tabs = row.tabs("right");

    //tabs.style["width"] = "300px";
    //tabs.style["height"] = "400px";
    tabs.float(1, 35*UIBase.getDPI(), 7);

    let tab = tabs.tab("Workspace");
    let toolmode = this.ctx.toolmode;

    if (toolmode) {
      toolmode.constructor.buildProperties(tab);
    }

    this.strokePanel(tabs);
    this.fillPanel(tabs);
    this.layersPanel(tabs);
    this.vertexPanel(tabs);
    this.lastToolPanel(tabs);

    this.update();
  }

  lastToolPanel(tabs : TabContainer) {
    let tab = tabs.tab("Most Recent Command");

    let panel = document.createElement("last-tool-panel-fairmotion-x");
    tab.add(panel);
  }

  fillPanel(tabs : TabContainer) {
    var ctx = this.ctx;

    let panel = tabs.tab("Fill");
    let panel2 = panel.panel("Fill Color");

    //panel.packflag |= PackFlags.INHERIT_WIDTH;
    //panel.packflag |= PackFlags.NO_AUTO_SPACING;
    //panel.packflag |= PackFlags.IGNORE_LIMIT;

    //"spline.faces{($.flag & 1) && !$.hidden}.fillcolor"

    //let set_path = "spline.editable_faces[{(ctx.spline.layerset.active.id in $.layers) && ($.flag & 1) && !$.hidden}]";
    let set_path = "spline.editable_faces[{$.flag & 1}]";

    panel2.prop("spline.active_face.mat.fillcolor", undefined,
      set_path + ".mat.fillcolor");
    panel.prop("spline.active_face.mat.blur", undefined,
      set_path + ".mat.blur");

    return panel
  }

  strokePanel(tabs : TabContainer) {
    let panel = tabs.tab("Stroke");

    var ctx = this.ctx;

    //panel.packflag |= PackFlags.INHERIT_WIDTH;
    //panel.packflag |= PackFlags.NO_AUTO_SPACING;
    //panel.packflag |= PackFlags.IGNORE_LIMIT;

    let set_prefix = `spline.editable_segments[{$.flag & 1}]`;

    //panel.label("Stroke Color");
    let panel2 = panel.panel("Stroke Color");

    panel2.prop("spline.active_segment.mat.strokecolor", undefined,
      set_prefix + ".mat.strokecolor");

    panel.prop("spline.active_segment.mat.linewidth", undefined,
      set_prefix + ".mat.linewidth");
    panel.prop("spline.active_segment.mat.blur", undefined,
      set_prefix + ".mat.blur");
    panel.prop("spline.active_segment.renderable", undefined,
      set_prefix + ".mat.renderable");

    panel.prop("spline.active_segment.mat.flag[MASK_TO_FACE]", undefined,
      set_prefix + ".mat.flag[MASK_TO_FACE]");


    panel2 = panel2.panel("Double Stroking");
    panel2.prop("spline.active_segment.mat.strokecolor2", undefined,
      set_prefix + ".mat.strokecolor2");

    panel2.prop("spline.active_segment.mat.linewidth2", undefined,
      set_prefix + ".mat.linewidth2");

    panel2 = panel.panel("Vertex Width");
    panel2.prop("spline.active_vertex.width", undefined, set_prefix+".width");
    panel2.prop("spline.active_vertex.shift", undefined, set_prefix+".shift");

    panel2 = panel.panel("Segment Width");
    panel2.prop("spline.active_segment.w1", undefined, set_prefix + ".w1");
    panel2.prop("spline.active_segment.w2", undefined, set_prefix + ".w2");
    panel2.prop("spline.active_segment.shift1", undefined, set_prefix + ".shift1");
    panel2.prop("spline.active_segment.shift2", undefined, set_prefix + ".shift2");

    return panel
  }

  layersPanel(tabs : TabContainer) {
    var ctx = this.ctx;
    var panel = tabs.tab("Layers");

    panel.add(document.createElement("layerpanel-x"));
    //return new LayerPanel(new Context());
  }

  vertexPanel(tabs : TabContainer) {
    let ctx = this.ctx;
    let tab = tabs.tab("Control Point");

    let set_prefix = "spline.editable_verts[{$.flag & 1}]";

    let panel = tab.panel("Vertex");
    panel.prop("spline.active_vertex.flag[BREAK_TANGENTS]", undefined, set_prefix + ".flag[BREAK_TANGENTS]");
    panel.prop("spline.active_vertex.flag[BREAK_CURVATURES]", undefined, set_prefix + ".flag[BREAK_CURVATURES]");
    panel.prop("spline.active_vertex.flag[USE_HANDLES]", undefined, set_prefix + ".flag[USE_HANDLES]");
    panel.prop("spline.active_vertex.flag[GHOST]", undefined, set_prefix + ".flag[GHOST]");

    panel.prop("spline.active_vertex.width", undefined, set_prefix+".width");
    panel.prop("spline.active_vertex.shift", undefined, set_prefix+".shift");

    panel = tab.panel("Animation Settings")

    set_prefix = "frameset.keypaths[{$.animflag & 8}]";
    panel.prop("frameset.active_keypath.animflag[STEP_FUNC]", undefined, set_prefix + ".animflag[STEP_FUNC]");
    return panel;
  }


  define_keymap() {
    let k = this.keymap;
  }

  copy() {
    return document.createElement("material-editor-x");
  }

  static define() { return {
    tagname : "material-editor-x",
    areaname : "material_editor",
    uiname : "Properties",
    icon : Icons.MATERIAL_EDITOR
  }}
}
MaterialEditor.STRUCT = STRUCT.inherit(MaterialEditor, Area) + `
}
`;
Editor.register(MaterialEditor);
