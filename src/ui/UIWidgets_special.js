import {MinMax, inrect_2d, aabb_isect_2d} from 'mathlib';
import {UIElement, UIFlags, CanvasFlags, PackFlags} from 'UIElement';
import {UIFrame} from 'UIFrame';
import {rgba_to_hsva, hsva_to_rgba} from 'colorutils';

import {KeyMap, ToolKeyHandler, FuncKeyHandler, KeyHandler, 
        charmap, TouchEventManager, EventHandler} from 'events';

import {
  UIButtonAbstract, UIButton, UIButtonIcon,
  UIMenuButton, UICheckBox, UINumBox, UILabel,
  UIMenuLabel, ScrollButton, UIVScroll, UIIconCheck
} from 'UIWidgets';

import {RowFrame, ColumnFrame, UIPackFrame} from 'UIPack';
import {UITextBox} from 'UITextBox';
import {UIMenu} from 'UIMenu';

export class UICollapseIcon extends UIButtonIcon {
  constructor(ctx, is_collapsed=false, user_callback = undefined) {
    super(ctx, "+", Icons.UI_COLLAPSE);
    
    this._collapsed = 0;
    this.collapsed = is_collapsed;
    
    /*okay.  this bit of idiotic code is used
      to implement callback chaining, which I
      need to implement properly
     */
    var this2 = this;
    this._wrapped_callback = function() {
      this2.collapsed ^= true;
    
      if (this2._callback != undefined)
        this2._callback(this2, this2.collapsed);
    };
    this._callback = user_callback;
  }
  
  //this is especially evil, returns the callback wrapper, not
  //the user callback itself
  get callback() : Function {
    return this._wrapped_callback;
  }
  
  set callback(Function callback) : Function {
    this._callback = callback;
  }
  
  get collapsed() : Boolean {
    return this._collapsed;
  }
  
  set collapsed(Boolean val) {
    if (!!val != !!this._collapsed) {
      this.icon = val ? Icons.UI_EXPAND : Icons.UI_COLLAPSE;
      this._collapsed = val;
      this.do_recalc();
    }
  }
}

export class UIPanel extends RowFrame {
  constructor(Context ctx, String name="", String id=name, is_collapsed=false) {
    super(ctx);
    
    this.permid = id;
    this.stored_children = new GArray();
    
    this.packflag |= PackFlags.ALIGN_LEFT;
    this.default_packflag |= PackFlags.INHERIT_WIDTH;
    this.state |= UIFlags.NO_FRAME_CACHE;
    
    //store whether the user manually changed
    //the collapsed state
    this.user_opened = false;
    this.user_closed = false;
    
    /*collapser triangle*/
    var this2 = this;
    function callback1(iconbut, do_collapse) {
      this2.collapsed ^= true;
      this2.user_opened = !this2.collapsed;
      this2.user_closed = this2.collapsed;
    }
    
    this.pad[1] = 1;
    
    var tri = new UICollapseIcon(ctx, is_collapsed, callback1);
    tri.small_icon = true;
    tri.bgmode = "flat";
    this.tri = tri;
    
    var col = this.col();
    
    this.packflag |= PackFlags.NO_AUTO_SPACING;
    
    col.packflag |= PackFlags.ALIGN_LEFT|PackFlags.NO_AUTO_SPACING;
    col.default_packflag &= ~PackFlags.INHERIT_WIDTH;
    if (IsMobile)
      col.label(" ");
    col.add(tri);
    
    this.text = name;
    this.title = col.label(name);
    this.title.color = uicolors["PanelText"];
    
    this._collapsed = false;
    this.collapsed = is_collapsed;
    this._color = uicolors["CollapsingPanel"];
    
    this.start_child = this.children.length;
  }
  
  on_saved_uidata(Function descend) {
    super.on_saved_uidata(descend);
    
    for (var c of this.stored_children) {
      descend(c);
    }
  }
  
  on_load_uidata(Function visit) {
    super.on_load_uidata(visit);
    
    for (var c of this.stored_children) {
      visit(c);
    }
  }
  
  get_uhash() : String {
    return super.get_uhash() + this.permid;
  }
  
  get_filedata() : ObjectMap {
    return {collapsed : this._collapsed, user_opened : this.user_opened};
  }
  
  load_filedata(ObjectMap obj) {
    this.collapsed = obj.collapsed;
    this.user_opened = obj.user_opened;
  }
  
  get collapsed() : Boolean {
    return this._collapsed;
  }
  
  get color() : Array<float> {
    return this._color;
  }
  
  set color(Array<float> color) : Array<float> {
    for (var i=0; i<4; i++) {
      if (color[i] != this._color[i]) {
        this.do_recalc();
        break;
      }
    }
    
    this._color = color;
  }
  
  set collapsed(Boolean is_collapsed) {
    if (!!is_collapsed == this._collapsed)
      return;
    
    if (is_collapsed != this._collapsed && this.parent != undefined)
      this.parent.do_full_recalc(); //reflow
    
    this.tri.collapsed = is_collapsed;
    this._collapsed = is_collapsed;
    
    //cleared manually opened/closed flags;
    //the triangle button's callback will
    //set them again if necassary.
    this.user_opened = false;
    this.user_closed = false;
    
    if (!is_collapsed) {
      if (this.stored_children.length > 0) {
        for (var c of this.stored_children) {
          this.add(c);
        }
      
        this.stored_children = new GArray();
      }
    } else if (this.children.length > this.start_child) {
      this.stored_children = this.children.slice(this.start_child, this.children.length);
      this.children = this.children.slice(0, this.start_child);
      this.do_recalc();
    }
  }
  
  add(UIElement child, int packflag) {
    if (this._collapsed) {
      child.parent = this;
      child.packflag |= packflag|this.default_packflag;
      this.stored_children.push(child);
    } else {
      super.add(child);
    }
  }
  
  build_draw(UICanvas canvas, Boolean isVertical) {
    this.title.color = uicolors["PanelText"];
    
    canvas.simple_box([0, 0], this.size, this.color);
    
    super.build_draw(canvas, isVertical);
  }
}

function get_editor_list() : GArray<Function> {
  static ret = undefined;
  
  if (ret == undefined) {
    ret = new GArray();
    //why? -> console.log("Fix dependency here too");
    
    for (var cls of defined_classes) {
      for (var i=0; i<cls.__parents__.length; i++) {
        if (cls.__parents__[i].name == "Area") {
          ret.push(cls);
          break;
        }
      }
    }
  }
  
  return ret;
}

export function gen_editor_switcher(Context ctx, Area parent) {
  var editors = get_editor_list();
  
  var menu = new UIMenu("", undefined);
  
  var i = 0;
  for (var e of editors) {
    if (!e.debug_only || !RELEASE)
      menu.add_item(e.uiname, "", e);
    i++;
  }
  
  //stupid way to get reference to e (UIMenuButton) into callback
  var obj = {};
  function callback(entry, cls) {
    console.log("editor switcher callback", cls.name);
    
    parent.parent.switch_editor(cls);
    
    //reset label, this is necassary
    obj.e.text = parent.constructor.uiname;
  }
  
  menu.callback = callback;
  
  var e = new UIMenuButton(ctx, menu, [0,0], [1,1], undefined, "Switch editors");
  obj.e = e;
  e.text = parent.constructor.uiname;
  
  return e;
}

var _hue_field = [
  [1, 0, 0, 1], 
  [1, 1, 0, 1], 
  [0, 1, 0, 1], 
  [0, 1, 1, 1], 
  [0, 0, 1, 1], 
  [1, 0, 1, 1]
];

export class UIColorField extends UIElement {
  constructor(ctx, callback=undefined) {
    super(ctx);
    this.h = 0.0;
    this.s = 0.0;
    this.v = 1.0;
    this.huehgt = 25;
    
    this.mode = undefined; //"h" or "sv"
    this.clicked = false;
    
    this.callback = callback;
  }
  
  get_min_size(UICanvas canvas, Boolean isVertical) {
    return [150, 165];
  }
  
  do_mouse(MouseEvent event) {
    static pos = [0, 0], size=[0,0];
    static mpos = [0, 0];
    mpos[0] = event.x; mpos[1] = event.y;
    
    if (this.mode == "h") {
      this.h = (mpos[0]-7) / (this.size[0]-12-2);
      this.h = Math.min(Math.max(this.h, 0), 1.0); //clamp
      
      this.do_recalc();
      
      if (this.callback != undefined) {
        this.callback(this, this.h, this.s, this.v);
      }
    } else if (this.mode == "sv") {
      var v = mpos[0]/this.size[0];
      v = Math.sqrt(v);
      
      var s = (mpos[1]-this.huehgt+2)/(this.size[1]-this.huehgt);
      
      this.v = Math.min(Math.max(v, 0), 1.0); //clamp
      this.s = Math.min(Math.max(s, 0), 1.0); //clamp
      this.do_recalc();

      if (this.callback != undefined) {
        this.callback(this, this.h, this.s, this.v);
      }
    }
  }
  
  on_mousedown(MouseEvent event) {
    if (this.clicked == false) {
      this.clicked = true;
      this.mdown = true;
      this.push_modal();
      
      var pos = [1, 1];
      var size = [this.size[0]-2, this.huehgt];
      var mpos = [event.x, event.y];
      
      if (inrect_2d(mpos, pos, size)) {
        this.mode = "h"
      } else {
        this.mode = "sv";
      }
      
      this.do_mouse(event);
    }
  }
  
  on_mousemove(MouseEvent event) {
    if (this.clicked) {
      this.do_mouse(event);
    }
  }
  
  on_mouseup(MouseEvent event) {
    if (this.clicked) {
      this.clicked = false;
      this.pop_modal();
    }
  }
  
  build_draw(UICanvas canvas, Boolean isVertical) {
    global _hue_field;
    canvas.simple_box([0, 0], this.size);
    
    var cs = _hue_field;
    var segs = cs.length;
    static sz = [12, 12];
    var wid = Math.ceil((this.size[0]-2-sz[0]) / cs.length);
    static v1=new Vector2(), v2=new Vector2(), v3=new Vector2(), v4=new Vector2();
    var h = this.h, s = this.s, v = this.v;
    
    var halfx = Math.floor(sz[0]*0.5);
    
    //hue box
    canvas.box([0, 0], [this.size[0], 26], [0, 0, 0, 1], 0, true);
    var y = this.huehgt;
    var c1, c2, c3, c4;
    
    canvas.box1([1, 1], [halfx, y], cs[0]);
    
    //we "shrink in" the range a little, so the user doesn't wander
    //outside the element bounds (it shouldn't matter in production
    //situations, but it is annoying otherwise when testing with a console sidebar
    
    canvas.quad([1, 1], [1, y], [halfx+1, y], [halfx+1, 1], cs[0]);
    for (var i=0; i<segs; i++) {
      var i2 = (i+1) % cs.length;
      var c1 = cs[i], c2 = cs[i2], c3 = cs[i2], c4 = cs[i];
      
      v1[0] = i*wid+1+halfx; v1[1] = 1;
      v2[0] = i*wid+1+halfx; v2[1] = y;
      v3[0] = i*wid+wid+1+halfx; v3[1] = y;
      v4[0] = i*wid+wid+1+halfx, v4[1] = 1;
      
      canvas.quad(v2, v3, v4, v1, c1, c2, c3, c4, true);
    }
    canvas.quad(v4, v3, [this.size[0]-1, y], [this.size[0]-1, 1], cs[0]);
    
    //saturation/lightness box
    v1[0] = 0; v1[1] = y+2;
    v2[0] = 0; v2[1] = this.size[1];
    v3[0] = this.size[0]; v3[1] = this.size[1];
    v4[0] = this.size[0]; v4[1] = 27;
    
    static clr = [0, 0, 0, 1];
    
    var h1 = Math.floor(h*cs.length) % cs.length;
    var h2 = (h1+1) % cs.length;
    var t = h*cs.length - h1;
    //console.log("-", h, h1, h2, t);
    
    if (isNaN(h1)) h1 = 0;
    if (isNaN(h2)) h2 = 0;
    if (isNaN(t)) t = 0;
    
    if (t < 0 || t > 1) t = 0;
    for (var i=0; i<3; i++) {
      clr[i] = cs[h1][i] + (cs[h2][i] - cs[h1][i])*t;
    }
    
    c1 = [0, 0, 0, 1]; c2 = [0, 0, 0, 1];
    c3 = clr; c4 = [1, 1, 1, 1];
    
    canvas.colorfield([0, this.huehgt], [this.size[0], this.size[1]-this.huehgt], clr);
    //canvas.quad(v1, v2, v3, v4, c1, c2, c3, c4);
    
    //hue cursor
    static pos1 = [0, 0];
    
    pos1[0] = Math.floor(1+h*(this.size[0]-2-sz[0]));
    pos1[1] = Math.floor(y*0.5-sz[1]*0.5);
    
    //console.log("h", Math.floor(h*this.size[0]));
    canvas.box(pos1, sz);
    
    //s/v cursor
    pos1[0] = Math.floor((this.size[0]-sz[0])*v*v);
    pos1[1] = Math.floor((this.size[1]-y-4)*s + y+2 - sz[1]*0.5);
    
    canvas.box(pos1, sz);
  }
}

export class UIColorBox extends UIElement {
  constructor(ctx, color=undefined) {
    super(ctx);
    
    if (color == undefined)
      this.color = [0, 0, 0, 1];
    else
      this.color = [color[0], color[1], color[2], color[3]];
  }
  
  get_min_size(UICanvas canvas, Boolean isVertical) {
    return [40, 40];
  }
  
  build_draw(UICanvas canvas, Boolean isVertical) {
    //console.log("c", this.color);
    static white = [1.0, 1.0, 1.0, 1.0];
    static grey  = [0.3, 0.3, 0.3, 1.0];
    
    var tot = 3, tot2=6;
    var wid = [this.size[0]/tot, this.size[1]/tot2];
    var pos = [0, 0];
    
    for (var i=0; i<tot; i++) {
      pos[1] = 0;
      for (var j=0; j<tot2; j++) {
        var k = (i+j)%2;
        
        canvas.box2(pos, wid, k ? white : grey);
        pos[1] += wid[1];
      }
      pos[0] += wid[0];
    }
    
    canvas.box2([0, 0], this.size, this.color);
  }
}

export class UIColorPicker extends RowFrame {
  constructor(Context ctx, Array<float> color=undefined, int color_length=4) {
    super(ctx);
    
    this.last_valid_hue = 0;
    this.last_valid_sat = 0;
    this.color_length = color_length;
    
    if (color == undefined) {
      this._color = color_length == 4 ? [1, 0, 0, 1] : [1, 0, 0];
    } else {
      this._color = [color[0], color[1], color[2]]
      
      if (color_length == 4)
        this._color.push(color[3]);
    }
    
    this.last_valid = [];
    for (var i=0; i<color_length; i++) {
      this.last_valid.push(this._color[i]);
    }
    
    var this2 = this;
    function hsv_callback(field, h, s, v) {
      this2.hsv_callback(field, h, s, v);
    }
    
    this.setter_path = undefined;
    this.field = new UIColorField(ctx, hsv_callback);
    this.preview = new UIColorBox(ctx, this._color)
    
    var col = this.col();
    
    this.preview.packflag |= PackFlags.INHERIT_HEIGHT;
    col.add(this.field);
    col.add(this.preview, PackFlags.INHERIT_HEIGHT);
    
    var r = new UINumBox(ctx, "R", [0, 1]);
    var g = new UINumBox(ctx, "G", [0, 1]);
    var b = new UINumBox(ctx, "B", [0, 1]);
    
    if (color_length == 4) {
      var a = new UINumBox(ctx, "A", [0, 1]);
    }
    
    r.slide_power = g.slide_power = b.slide_power = 2.0;
    if (color_length == 4)
      a.slide_power = 2.0;
    
    r.slide_mul = g.slide_mul = b.slide_mul = 4.0;
    if (color_length == 4)
      a.slide_mul = 4.0
    
    var row = this.row(undefined, PackFlags.INHERIT_WIDTH, PackFlags.INHERIT_WIDTH);
    row.add(r), row.add(g), row.add(b);
    
    if (color_length == 4) {
      row.add(a);
    }
    
    var this2 = this;
    function slider_callback(axis) {
      function callback(slider, val) {
        this2._color[axis] = val;
        this2.update_widgets();
        this2.on_colorchange();
      }
      
      return callback;
    }
    r.callback = slider_callback(0);
    g.callback = slider_callback(1);
    b.callback = slider_callback(2);
    
    if (color_length == 4) {
      a.callback = slider_callback(3);
    }
    
    this.r = r; this.g = g; this.b = b; 
    if (color_length == 4) {
      this.a = a;
    }
    
    this.update_widgets();
  }
  
  //user-overridable callback
  on_colorchange() {
  }
  
  on_tick() {
    if (this.state & UIFlags.USE_PATH) {
      window._cw = this;
      
      var color = this.get_prop_data();
      
      if (!(this.state & UIFlags.ENABLED))
        return;
      
      var same = true;
      
      for (var i=0; i<this.color_length; i++) {
        if (color[i] != this._color[i]) {
          same = false;
        }
        
        this._color[i] = color[i];
      }
      
      //avoid conflicts with widgets being manipulated
      if (!same && this.modalhandler == undefined) {
        this.update_widgets();
        this.on_colorchange();
      }
    }
  }
  
  get color() : Array<float> {
    return this._color;
  }
  
  set color(Array<float> color) {
    var do_update = false;
    
    for (var i=0; i<this.color_length; i++) {
      if (this._color[i] != color[i]) {
        this._color[i] = color[i];
        do_update = true;
      }
    }
    
    if (do_update)
      this.update_widgets();
    
    this.do_path();
    this.on_colorchange();
  }
  
  do_path() {
    if (this.state & UIFlags.USE_PATH) {
      var clr = this.get_prop_data();
      if (clr == undefined) return;
        
      for (var i=0; i<this.color_length; i++) {
        if (clr[i] != this._color[i]) {
          this.set_prop_data(this._color);
          break;
        }
      }
    }
  }
  
  update_widgets() {
    static hsva = [0, 0, 0, 0];
    
    var c = this._color, lasthue=undefined;
    
    for (var i=0; i<hsva.length; i++) {
      if (isNaN(hsva[i])) {
        console.log("Eek, NaN!");
        hsva[i] = 0.0;
      }
    }
    
    for (var i=0; i<this._color.length; i++) {
      if (isNaN(this._color[i])) {
        console.log("eek, NaN");
        this._color[i] = 0.0;
      }
    }
    
    for (var i=0; i<this.color_length; i++) {
      this.last_valid[i] = this._color[i];
    }
    
    this.last_valid_hue = rgba_to_hsva(this._color, hsva, this.last_valid_hue);
    
    if (hsva[1] < 0) {
      hsva[1] = this.last_valid_sat;
    } else {
      this.last_valid_sat = hsva[1];
    }
    
    this.field.h = hsva[0]*0.9999; this.field.s = hsva[1]; this.field.v = hsva[2];
    this.field.do_recalc();
    
    this.preview.color = this._color;
    this.preview.do_recalc();
    
    this.r.set_val(this._color[0]);
    this.g.set_val(this._color[1]);
    this.b.set_val(this._color[2]);
    
    if (isNaN(this.color[2])) {
      console.log("NaN!", this._color, hsva);
    }
    
    if (this.color_length == 4) {
      this.a.set_val(this._color[3]);
    }
    
    this.do_path();
  }
  
  hsv_callback(field, h, s, v) {
    static hsva = [0, 0, 0, 0];
    
    hsva[0] = h*0.9999; hsva[1] = s; hsva[2] = v; 
    
    if (this.color_length == 4)
      hsva[3] = this._color[3];
    else
      hsva[3] = 1.0;
    
    this.last_valid_hue = h;
    this.last_valid_sat = s;
    
    this.last_valid_hue = hsva_to_rgba(hsva, this._color, h*0.9999);
    
    this.update_widgets();
    this.on_colorchange();
  }
}

export class UIBoxWColor extends ColumnFrame {
  constructor(ctx, path) {
    super(ctx, path);
    //this.data_path = path;
    //this.state |= UIFlags.USE_PATH;
    
    try {
      this.prop("color");
      var row = this.prop("weights");
      
      row.packflag |= PackFlags.NO_AUTO_SPACING|PackFlags.ALIGN_BOTTOM;
      var i = 1;
      for (var c of row.children) {
        if (c instanceof UINumBox) {
          c.slide_power = 2.0;
          c.slide_mul = 4.0;
          c.unit = undefined;
          c.text = ""+i;
          i++;
        }
      }
      row.children.reverse();
      row.pad[0] = 20;
    } catch (_err) {
      print_stack(_err);
      console.log("failed to create UIBoxWColor with weights");
      
      try {
        this.prop("color");
      } catch (_err) {
        console.log("failed to create UIBoxWColor without weights");
      }
    }
  }
}

export class UIBoxColor extends RowFrame {
}

export class UIProgressBar extends UIElement {
  constructor(Context ctx, float value=0.0, float min=0.0, float max=1.0, int min_wid=200, int min_hgt=25) {
    super(ctx);
    
    this.value = value;
    this.min = min;
    this.max = max;
    this.min_wid = min_wid;
    this.min_hgt = min_hgt;
    this.size[1] = min_hgt;
    this.size[0] = min_wid;
    this.last_value = this.value;
  }
  
  get_min_size(UICanvas canvas, Boolean isVertical) : Array<float> {
    return [this.min_wid, this.min_hgt];
  }
  
  //we recalc draw buffers in on_tick, to avoid excessive updates per second
  on_tick() {
    super.on_tick();
    
    if (!(this.state & UIFlags.ENABLED))
      return;
    
    if (this.last_value != this.value) {
      this.do_recalc();
      this.last_value = this.value;
    }
  }
  
  set_value(float value) {
    this.last_value = this.value;
    this.value = value;
  }
  
  build_draw(UICanvas canvas, Boolean isVertical) {
    static zero = [0, 0];
    static one = [1, 1];
    static size2 = [0, 0];
    
    canvas.begin(this);
    var perc = (this.value / (this.max-this.min));
    
    canvas.box(zero, this.size, uicolors["ProgressBarBG"]);
    
    if (perc > 0.0) {
      perc = Math.min(Math.max(0.0, perc), 1.0);
      
      size2[1] = this.size[1]-2;
      size2[0] = Math.floor(this.size[0]*perc)-2;
      canvas.box(one, size2, uicolors["ProgressBar"]);
    }
    
    canvas.end(this);
  }
}

export class UIListEntry extends ColumnFrame {
  //id can be any arbitrary object,
  //including non-stringable types.
  constructor(ctx, text, Object id) {
    super(ctx);
    
    this.state &= ~UIFlags.USE_PAN;
    this.packflag |= PackFlags.INHERIT_WIDTH;
    this.text = text;
    this.id = id;
    this.icon = -1;
    
    this.start_mpos = new Vector2();
    this.touchdown = false;
    
    this.text_edit_mode = false;
  }
  
  begin_text_edit() {
    if (this.text_edit_mode) {
      console.log("Warning, invalid call to begin_text_edit()!");
      return;
    }
    
    var tbox = new UITextBox(this.ctx, this.text);

    this.add(tbox);
    tbox.begin_edit();
    
    var this2 = this;
    tbox.on_end_edit = function(textbox, cancel) {
      this2.end_text_edit();
      
      if (this2.on_end_edit != undefined) {
        this2.on_end_edit(textbox, cancel);
      }
    }
    
    this.text_edit_mode = true;
    this.textbox = tbox;
  }
  
  end_text_edit() {
    if (!this.text_edit_mode) {
      console.log("Warning, invalid call to end_text_edit()!");
      return;
    }
    
    this.text_edit_mode = false;
    
    if (this.textbox.editing) {
      this.textbox.end_edit();
    }
    
    this.text = this.textbox.text;
    this.remove(this.textbox);
    this.textbox = undefined;
  }
  
  get_min_size(UICanvas canvas, Boolean isvertical) {
    if (this.children.length > 0) {
      return super.get_min_size(canvas, isvertical);
    } else {
      var pad = 4;
      return [canvas.textsize(this.text)[0]+pad, 26];
    }
  }
  
  //XXX
  on_mouseup(event) {
    super.on_mouseup(event);
  }
  
  build_draw(UICanvas canvas, Boolean isVertical) {
    this.state &= ~UIFlags.USE_PAN;
    
    if (!(this.state & UIFlags.ENABLED))
        canvas.box([0, 0], this.size, this.do_flash_color(uicolors["DisabledBox"]));
    else if (this == this.parent.parent.active_entry) {
      canvas.simple_box([0,0], this.size);
      canvas.simple_box([0,0], this.size);
    } else if (this.state & UIFlags.HIGHLIGHT) {
      canvas.simple_box([0,0], this.size, uicolors["MenuHighlight"]); //[0.8, 0.8, 0.8, 0.7]);
    }
    
    super.build_draw(canvas, isVertical);
    
    if (this.icon >= 0) {
      canvas.icon(this.icon, [1, 1], undefined, true);
    }
    
    if (!this.text_edit_mode) {
      var tsize;
      
      if (this.text != undefined)
        tsize = canvas.textsize(this.text);
      else
        tsize = 50;
        
      canvas.text([22, (this.size[1]-tsize[1])*0.25], this.text, uicolors["ListBoxText"]);
    }
  }
}

export class UIListBox extends ColumnFrame {
  constructor(ctx, pos, size, callback) {
    super(ctx);
    
    if (size != undefined && size[0]+size[1] != 0.0)
      this.size = size;
    else
      this.size = [500, 350]; //default size;
    
    if (pos != undefined) {
      this.pos[0] = pos[0];
      this.pos[1] = pos[1];
    }
    
    var pflag = PackFlags.IGNORE_LIMIT | PackFlags.NO_AUTO_SPACING;
    pflag |= PackFlags.INHERIT_WIDTH|PackFlags.ALIGN_LEFT;

    this.listbox = new RowFrame(ctx);
    
    //no spacing allowed; messes up velocity pan
    this.listbox.packflag |= PackFlags.NO_AUTO_SPACING;
    this.listbox.pad[1] = 0;
    
    this.listbox.state |= UIFlags.HAS_PAN;
    this.add(this.listbox, pflag);
    
    this.active_entry = undefined : UIListEntry;
    this.callback = callback;
    this.go_callback = undefined;
    
    this.mdown = false;
    
    this.vscroll = new UIVScroll(ctx, [0, 0])
    this.vscroll.packflag |= PackFlags.INHERIT_HEIGHT;
    
    this.scrollx = 0;
    this.scrolly = 0;
    
    var this2=this;
    this.vscroll.callback = function(vscroll, value) {
      if (!this2.listbox.velpan.panning)
        this2._vscroll_callback(vscroll, value);
    }
    this.vscroll.step = 26;
    this.add(this.vscroll);
    
    this.packflag |= PackFlags.ALIGN_LEFT;
    this.state |= UIFlags.NO_FRAME_CACHE;
  }
  
  on_tick() {
    prior(UIListBox, this).on_tick.call(this);
    
    if (this.vscroll.val != this.listbox.velpan.pan[1]) {
      //console.log("=>", this.vscroll.val, this.listbox.velpan.pan[1]);
      this.vscroll.set_value(this.listbox.velpan.pan[1]);
    }
  }
  
  load_filedata(ObjectMap map) {
    super.load_filedata(map);
    
    if ("active_entry" in map) {
      var act = map["active_entry"];
      var i = 0;
      
      for (var c of this.listbox.children) {
        if (c.text == act) {
          this._set_active(c);
          break;
        }
      }
    }
  }
  
  get_filedata() : ObjectMap {
    var ret = prior(UIListBox, this).get_filedata.call(this);
    if (ret == undefined) ret = {};
    
    if (this.active_entry != undefined)
      ret["active_entry"] = this.active_entry.text;
    
    return ret;
  }
  
   _vscroll_callback(vscroll, value)
  {
    static pan = [0, 0];
    pan[1] = value;
    
    this.listbox.velpan.set_pan(pan);
    this.listbox.do_full_recalc();
    this.do_full_recalc();
  }
  
  on_doubleclick(event) {
    console.log("LISTBOX double click!");
    
    if (event.button == 0 && this.go_callback != undefined) {
        this.go_callback(this, this.active_entry.text, this.active_entry.id);
    }
  }
  
  on_mousedown(event) {
    super.on_mousedown(event);
    
    this.mstart = new Vector2([event.x, event.y]);
    this.mdown = true;
    this.mtime = time_ms();
  }
  
  handle_clicked(MouseEvent event) {
  }
  
  on_mousemove(MouseEvent event) {
    super.on_mousemove(event);
    
    if (!this.listbox.velpan.panning && this.mdown && this.mstart.vectorDistance([event.x, event.y]) > 25) {
      //console.log("PAN!");
      //this.listbox.start_pan([this.mstart[0]-this.listbox.pos[0], this.mstart[1]-this.listbox.pos[1]], 0,
      //                       [event.x-this.listbox.pos[0], event.y-this.listbox.pos[1]]);
    }
    
  }
  on_mouseup(event) {
    super.on_mouseup(event);
    this.mdown = false;
    
    this.listbox.velpan.can_coast = true;
    console.log("  PANNING: ", this.listbox.velpan.panning);
    
    if (this.listbox.velpan.panning)
      return;
    
    if (this.listbox.active != undefined && 
        this.listbox.active instanceof UIListEntry)
    {
      this._set_active(this.listbox.active);
    }
  }
  
  jump(int off, boolean absolute=false) {
    var i;
    
    if (absolute) {
      i = off < 0 ? this.listbox.children.length + off : off;
    } else {
      if (this.active_entry == undefined) return;
      i = this.listbox.children.indexOf(this.active_entry) + off;
    }
    
    i = Math.min(Math.max(0, i), this.listbox.children.length-1);
    
    var active = this.listbox.children[i];
    if (active == undefined)
      return;
    
    this._set_active(active);
    
    active.abspos[0] = 0;
    active.abspos[1] = 0;
    active.abs_transform(active.abspos);
    
    var y = active.abspos[1] - (this.abspos[1] + this.listbox.pos[1]);
    y += this.listbox.velpan.pan[1];
    
    console.log("y", y, this.listbox.size[1]);
    if (y < 0 || y > this.listbox.size[1]) {
      var pan = [this.listbox.velpan.pan[0], this.listbox.velpan.pan[1]];
      
      if (y > this.listbox.size[1]) {
        pan[1] = -(active.pos[1] - this.size[1] + active.size[1]);
      } else {
        pan[1] = -active.pos[1];
      }
      
      //pan[1] = Math.min(Math.max(0, pan[1]), this.listbox.pan_bounds[1][1]);
      this.vscroll.set_value(pan[1]);
      this.listbox.velpan.set_pan(pan);
      this.listbox.do_full_recalc();
      this.do_full_recalc();
      
      for (var j=0; j<this.listbox.children.length; j++) {
        this.listbox.children[j].abspos[0] = 0;
        this.listbox.children[j].abspos[1] = 0;
        this.listbox.children[j].abs_transform(this.listbox.children[j].abspos);
      }
    }
  }
  
  set_active(id) {
    var entry;
    
    for (var i=0; i<this.listbox.children.length; i++) {
      var entry2 = this.listbox.children[i];
      
      if (entry2.id == id) {
        entry = entry2;
        break;
      }
    }
    
    this._set_active(entry);
  }
  
  _set_active(entry, suppress_callback=false) {
    if (this.active_entry != entry && this.active_entry != undefined) {
      this.active_entry.do_recalc();
    }
    
    this.active_entry = entry;
    this.do_full_recalc();
    
    if (entry != undefined) {
      entry.do_recalc();
      
      if (this.callback != undefined && !suppress_callback) {
        this.callback(this, this.active_entry.text, this.active_entry.id);
      }
    }
  }
  
  on_keydown(event) {
    switch (event.keyCode) {
      case charmap["Enter"]:
        console.log("Enter go_callback");
        if (this.go_callback != undefined) {
          this.go_callback(this, this.active_entry.text, this.active_entry.id);
        }
        break;
      case charmap["Up"]:
        this.jump(-1);
        this.do_full_recalc();
        break;
      case charmap["Down"]:
        this.jump(1);
        this.do_full_recalc();
        break;
    }
  }
  
  add_item(str, id) {
    var entry = new UIListEntry(this.ctx, str, id);
    
    entry.packflag |= PackFlags.ALIGN_LEFT|PackFlags.INHERIT_WIDTH;
    
    var this2 = this;
    entry.callback = function(entry) {
      this2._set_active(entry);
    }
    
    this.listbox.add(entry, PackFlags.ALIGN_LEFT);
    this.do_recalc();
    
    var canvas = this.get_canvas();
    var hgt = canvas != undefined ? entry.get_min_size(canvas) : 18;

    //temporarily listbox height, since we may need it before next repaint, when repack happens
    this.listbox.size[1] += hgt;
    this.listbox.pan_bounds[1][1] += hgt;
    this.vscroll.set_range([0, this.listbox.pan_bounds[1][1]]);
    
    if (canvas != undefined)
      this.pack(this.get_canvas());
    
    return entry;
  }

  build_draw(UICanvas canvas, Boolean isVertical) {
    canvas.push_scissor([0,0], this.size);
    
    canvas.simple_box([0,0], this.size, uicolors["ListBoxBG"]);
    super.build_draw(canvas, isVertical);
    
    canvas.pop_scissor();
  }

  reset()
  {
    this.listbox.children = new GArray();
    this.listbox.velpan.pan[0] = this.listbox.velpan.pan[1] = 0.0;
    
    this.vscroll.set_value(0.0);
    
    this.do_recalc();
  }

  pack(UICanvas canvas, Boolean is_vertical)
  {
    this.listbox.size[0] = this.size[0]-26;
    this.listbox.size[1] = this.size[1];
    this.listbox.packflag |= PackFlags.KEEP_SIZE;
    
    super.pack(canvas, is_vertical);
    
    //paranoid check. . .this should not be necassary, but it is.
    //ger!
    this.listbox.pan_bounds[0][0] = 0;
    this.listbox.pan_bounds[0][1] = 0;
    
    this.vscroll.pos[1] = 0;
    this.vscroll.size[1] = this.size[1];
    
    this.vscroll.set_range([0, this.listbox.pan_bounds[1][1]]);
  }

  get_min_size(UICanvas canvas, Boolean isVertical) {

    if (this.size != undefined && this.size[0]+this.size[1] != 0.0) {
      return this.size;
    } else {
      return CACHEARR2(500, 300);
    }
  }
}

//evil global
window.UIColorPicker = UIColorPicker;
