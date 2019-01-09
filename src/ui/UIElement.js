import "../editors/viewport/events";

import {MinMax, inrect_2d, aabb_isect_2d} from 'mathlib';
import {EventHandler} from "../editors/viewport/events";
import {charmap} from "../editors/viewport/events";
import {TPropFlags} from 'toolprops';

export var UIFlags = {
  ENABLED        :  1,   HIGHLIGHT :   2, 
  FOCUS          :  4,   GREYED    :   8, 
  REDERROR       : 16,  WARNING    :  32, 
  USE_PATH       : 64,  NO_RECALC  : 128,
  FLASH     : (16|32),  SKIP_DRAW  : 256,
  
  //- has_pan flags uiframes with pan callbacks, 
  //- use_pan tells elements to use those callbacks,
  //          e.g. if a tablet user touches a button, then drags,
  //          execute pan
  //- pan_canvas_mat : change canvas global matrix, not frame position
  HAS_PAN              :  512, USE_PAN         : 1024, 
  PAN_CANVAS_MAT       : 2048, IS_CANVAS_ROOT  : 4096, 
  NO_FRAME_CACHE       : (1<<14), INVISIBLE       : (1<<15),
  IGNORE_PAN_BOUNDS    : (1<<16), BLOCK_REPAINT : (1<<17),
  NO_VELOCITY_PAN      : (1<<18), BG_EVENTS_TRANSPARENT : (1<<19),
  CLIP_CONTENTS        : (1<<20)
};

export var PackFlags = {
  INHERIT_HEIGHT :       1,   INHERIT_WIDTH  :     2, 
  ALIGN_RIGHT    :       4,   ALIGN_LEFT     :        8, 
  ALIGN_CENTER   :      16,   ALIGN_BOTTOM   :     32, 
  IGNORE_LIMIT   :      64,   NO_REPACK      :       128,
  UI_DATAPATH_IGNORE : 256,   USE_ICON       :  1024|2048,
  USE_SMALL_ICON   :  1024,   USE_LARGE_ICON : 2048,
  ENUM_STRIP       :  4096,   NO_AUTO_SPACING: 8192,
  //for colframe, center  y,  for rowframe, center x
  ALIGN_CENTER_Y   : 16384,   ALIGN_CENTER_X : 32768,
  FLIP_TABSTRIP    : 65536,   NO_LEAD_SPACING: (1<<17),
  NO_TRAIL_SPACING : (1<<18), KEEP_SIZE      : (1<<19),
  _KEEPSIZE : ((1<<19)|128),  ALIGN_TOP      : (1<<20),
  
  //these next flags are here because they affect how row/column frame
  //autogenerate .panbounds.

  //allow negative pans, needed for the header/footer bars (area.build_topbar())
  CALC_NEGATIVE_PAN : (1<<21), PAN_X_ONLY : (1<<22),
  PAN_Y_ONLY        : (1<<23), VERTICAL   : (1<<24),
  COLOR_BUTTON_ONLY : (1<<25)
}

export var CanvasFlags = {NOT_ROOT : 1, NO_PROPEGATE : 2}
window.CanvasFlags = CanvasFlags;

var _ui_element_id_gen = 1;
export function open_mobile_keyboard(e, on_close=function(){}) {
  //stupid android screen keyboard doesn't interface
  //with javascript very well, ger.
  if (IsMobile || DEBUG.screen_keyboard)
    call_keyboard(e, on_close);
 //var canvas = document.getElementById("canvas2d_work")
 //canvas.contentEditable = true
 //canvas.focus()
}

export function close_mobile_keyboard(e) {
  if (IsMobile || DEBUG.screen_keyboard)
    end_keyboard(e);
  //var  canvas = document.getElementById("canvas2d_work")
  //canvas.contentEditable = false
  //canvas.focus()
}

var _inrect_2d_button_tmps = [new Vector2(), new Vector2()];

/*utility function, expands tested rect when IsMobile is true*/
export function inrect_2d_button(p : Array<float>, pos : Array<float>, size : Array<float>) : Boolean {
  let pos2 = _inrect_2d_button_tmps[0], size2 = _inrect_2d_button_tmps[1];
  
  if (g_app_state.was_touch) {
    pos2.load(pos);
    size2.load(size);
    
    pos2.subScalar(fuzzy_ui_press_hotspot);
    size2.addScalar(fuzzy_ui_press_hotspot*2.0);
    
    return inrect_2d(p, pos2, size2);
  } else {
    return inrect_2d(p, pos, size);
  }
}

export class UIElement extends EventHandler {
  constructor(ctx, path=undefined, pos=undefined, size=undefined) {
    super();
    
    this.defunct = false;
    
    this._uiel_id = _ui_element_id_gen++;
    this.fake_push_modal = 0;
    
    this.description = "";
    
    this.dirty = [[0, 0], [0, 0]];
    this.last_dirty = [[0, 0], [0, 0]];
    this.dirty_flag = 0;
    
    this.abspos = [0, 0];
    this._minsize = [0, 0]; //cached variable;
    
    //cached hash string
    this._h12 = undefined : String;
    
    this.state = UIFlags.ENABLED;
    this.packflag = 0;
    this.data_path = path;
    this.ctx = ctx;
    this.parent = undefined;
    
    //timer for error/warning flashes
    this.flash_timer_len = 650;
    this.status_timer = undefined;
    this.flash_ival = 20;
    this.last_flash = 0;
    
    this.pos = [0, 0];
    this.size = [0, 0];
    
    if (pos != undefined) {
      this.pos[0] = pos[0];
      this.pos[1] = pos[1];
    }
    
    if (size != undefined) {
      this.size[0] = size[0];
      this.size[1] = size[1];
    }
    
    this.recalc = 0;
    this.recalc_minsize = 0;
    
    if (path != undefined) {
      this.state |= UIFlags.USE_PATH;
    }  
  }
  
  disable() {
    if ((this.state & UIFlags.ENABLED))
      this.do_recalc();
      
    this.state &= ~UIFlags.ENABLED;
  }
  
  enable() {
    if (!(this.state & UIFlags.ENABLED))
      this.do_recalc();
    
    this.state |= UIFlags.ENABLED;
  }
  
  get_keymaps() {
    static empty_arr = [];
    
    return empty_arr;
  }
  
  [Symbol.keystr]() : String {
    if (this._h12 == undefined) {
      var n = this.constructor.name;
      //XXX IE bug!
      if (n == undefined) 
        n = "evil_ie_bug";
        
      this._h12 = n[2] + n[3] + n[n.length-2] + n[n.length-1] + this._uiel_id.toString();
    }
    
    return this._h12;
  }

  set_context(ctx) {
    this.ctx = ctx;
  }

  inc_flash_timer(color) {
    if (this.status_timer == undefined) {
      this.state &= ~UIFlags.FLASH;
      return false;
    }
    
    if (this.status_timer.ready()) {
      this.status_timer = undefined;
      this.state &= ~UIFlags.FLASH;
      return false;
    }
    
    return true;
  }

  do_flash_color(color) : Array<Array<float>> {
    this.inc_flash_timer();
    if (!(this.state & UIFlags.FLASH)) return color;
    
    var color2;
    
    if (this.state & UIFlags.REDERROR)
      color2 = uicolors["ErrorBox"];
    else if (this.state & UIFlags.WARNING)
      color2 = uicolors["WarningBox"];
    
    //way to clever
    if (color == undefined)
      color = color2;
    if (color2 == undefined)
      return undefined;
    
    var f = this.status_timer.normval;
    
    if (f < 0.5) f *= 2.0;
    else (f = 1.0 - f) *2.0;
    
    //console.log("f: " + f.toString());
    
    var alen = color.length;
    
    var l1 = objcache.array(alen), l2 = objcache.array(alen);
    l1.length = 0; l2.length = 0;
    
    if (typeof(color[0]) == "number") {
      l1.push(color);
    } else {
      for (var i=0; i<color.length; i++) {
        l1.push(color[i]);
      }
    }
    
    if (typeof(color2[0]) == "number") {
      l2.push(color2);
    } else {
      for (var i=0; i<color2.length; i++) {
        l2.push(color2[i]);
      }
    }
    
    while (l1.length < l2.length) {
      l1.push(l1[l1.length-1]);
    }
    while (l2.length < l1.length) {
      l2.push(l2[l2.length-1]);
    }
    
    var l3 = objcache.array(l1.length);
    l3.length = 0;
    
    for (var i=0; i<l1.length; i++) {
      var clr = new Vector4(l1[i]);
      clr.interp(l2[i], f);
      l3.push(clr);
    }
    
    //console.log(">-->", l1, l2, l3, "<----");
    if (l3.length == 1) 
      return l3[0];
    else
      return l3;
  }

  flash(int status=UIFlags.REDERROR) {
    console.log("flash!", status);
    this.status_timer = new Timer(this.flash_timer_len);
    this.state |= status;
    
    this.do_recalc();
  }
  
  focus() {
    if (this.parent != undefined)
      this.parent.focus(this);
  }
  
  get_abs_pos() {
    static pos = [0, 0];
    
    pos[0] = this.pos[0];
    pos[1] = this.pos[1];
    
    var p = this.parent;
    while (p != undefined) {
      pos[0] += p.pos[0]
      pos[1] += p.pos[1]
      p = p.parent;
    }
    
    return pos;
  }

  //calls a menu at an element's screen position, offset by off
  call_menu(menu, off=undefined, min_width=20) { //off, min_width are optional
    if (off == undefined) {
      off = [0, 0];
    }
    
    var frame;
    if (this.parent == undefined) {
      frame = this;
    } else  {
      frame = this.parent;
    }
    
    this.abs_transform(off);
    while (frame.parent != undefined) {
      frame = frame.parent;
    }
    
    ui_call_menu(menu, frame, off, false, min_width);
  }
  
  /*undo_push is only relevent if datapaths are using
    toolstack.exec_datapath instead of api.set_prop.*/
  set_prop_data(data, undo_push=true) {
    if (this.path_is_bad) 
      return;
    
    var ctx = this.ctx;
    var setpath = this.setter_path != undefined ? this.setter_path : this.data_path;
    
    var prop = ctx.api.get_prop_meta(ctx, this.data_path);
    
    if (prop.flag & TPropFlags.USE_UNDO)
      g_app_state.toolstack.exec_datapath(ctx, setpath, data, undo_push);
    else
      ctx.api.set_prop(ctx, setpath, data);
  }

  get_prop_data() {
    var ctx = this.ctx;
    var bad = true, ret = undefined;
    
    try {
      ret = ctx.api.get_prop(ctx, this.data_path);
      bad = false;
    } catch (err) {
      //XXX?
      if (DEBUG.ui_datapaths) {
        console.trace("Got error");
        print_stack(err);
      }
      
      ret = 0;
    }
    
    if (this.path_is_bad != bad) {
      this.do_recalc();
    }
    
    this.path_is_bad = bad;
    
    if (bad)
      this.disable();
    else
      this.enable();
    
    return ret;
  }

  get_prop_meta() {
    var ctx = this.ctx;
    
    return ctx.api.get_prop_meta(ctx, this.data_path);
  }

  do_recalc() {
    window.redraw_ui();
    
    if (this.state & UIFlags.BLOCK_REPAINT)
      return;
    
    this.recalc = 1;
    this.recalc_minsize = 1;
    
    if (this.parent != undefined)
      this.parent.do_recalc();
    else if (DEBUG.complex_ui_recalc && Math.random() > 0.99)
      console.trace("leaf ui call");
  }
  
  //calculates absolute position of pos,
  //relative to this element,
  //*not* this element's parent frame
  abs_transform(Array<float> pos) {
    var e = this;
    
    while (e != undefined) {
      pos[0] += e.pos[0];
      pos[1] += e.pos[1];
      
      if ((e.state & UIFlags.HAS_PAN)) {
        pos[0] += e.velpan.pan[0];
        pos[1] += e.velpan.pan[1];
      }
      
      e = e.parent;
    }
  }
  
  push_modal(UIElement e) {
    if (e == undefined) {
      this.fake_push_modal++;
      this.parent.push_modal(this);
    } else {
      EventHandler.prototype.push_modal.call(this, e);
      
      if (this.parent != undefined) {
        this.parent.push_modal(this);
      }
    }
  }

  pop_modal() {
    if (this.fake_push_modal) {
      this.fake_push_modal--;
      this.parent.pop_modal();
      
      return;
    }
    
    EventHandler.prototype.pop_modal.call(this);
    
    if (this.parent != undefined)
      this.parent.pop_modal();
  }

  get_canvas() {
    var frame = this;
    
    while (frame.parent != undefined && frame.canvas == undefined) {
      frame = frame.parent;
    }
    
    return frame.canvas;
  }

  is_canvas_root() : Boolean {
    var ret = this.parent == undefined || (this.canvas != undefined && this.parent.get_canvas() != this.canvas);
    
    ret = ret || this.state & UIFlags.IS_CANVAS_ROOT;
    ret = ret || this instanceof ScreenArea;
    ret = ret || this instanceof Area;
    ret = ret && this.canvas != undefined;
    ret = ret && !(this.canvas.flag & CanvasFlags.NOT_ROOT);
    
    return ret;
  }
  
  get_hint() : String {
    if (this.description == "" && (this.state & UIFlags.USE_PATH)) {
      var prop = this.get_prop_meta();
      return prop.description != "" ? prop.description : undefined;
    } else {
      return this.description;
    }
  }
  
  start_pan(Array<float> start_mpos, int button=0, Array<float> last_mpos=undefined) {
    if (!(this.state & UIFlags.HAS_PAN)) {
      if (this.parent == undefined) {
        console.trace();
        console.log("Warning: UIFrame.start_pan: no parent frame with pan support");
      } else {
        if (start_mpos != undefined) {
          start_mpos[0] += this.pos[0];
          start_mpos[1] += this.pos[1];
        }
        if (last_mpos != undefined) {
          last_mpos[0] += this.pos[0];
          last_mpos[1] += this.pos[1];
        }
        this.parent.start_pan(start_mpos, button, last_mpos);
      }
    }
  }
  
  //simple filedata
  get_filedata() : Object {
      return undefined; //default behavior, won't save anything
  }
  
  load_filedata(ObjectMap map) {
  }
  
  /*get non-numeric unique hash
    used for saving basic settings, like
    collapsed panels, active tabs, pan positions,
    etc, in files.*/
  get_uhash() : String {
    var s = this.constructor.name;
    
    //XXX IE bug!
    if (s == undefined) 
      s = "";
      
    if (this.data_path != undefined) {
      s += this.data_path;
    }
    
    if (this.parent != undefined) {
      s = this.parent.get_uhash() + s;
    }
    
    return s;
    //return CryptoJS.enc.Base64.stringify(CryptoJS.SHA1(s));
  }
  
  on_tick() { 
    if (time_ms() - this.last_flash > this.flash_ival && (this.state & UIFlags.FLASH)) {
      //console.log("flash");
      this.do_recalc();
      this.last_flash = time_ms();
      this.inc_flash_timer();
    }
    
    EventHandler.prototype.on_tick.call(this);
  }
  
  on_keydown(KeyboardEvent event) { }
  on_keyup(KeyboardEvent event) { }
  on_mousemove(MouseEvent event) { }
  on_mousedown(MouseEvent event) { }
  on_mousewheel(MouseEvent event) { }
  on_mouseup(MouseEvent event) { }
  on_contextchange(Object event) { }
  update_data(Context ctx) { }
  
  /* maintains a cached minimum size, updated when this.recalc is true */
  cached_min_size(UICanvas canvas, Boolean isVertical) {
    if (this.recalc_minsize) {
      this.recalc_minsize = 0;
      var ret = this.get_min_size(canvas, isVertical);
      
      this._minsize[0] = ret[0];
      this._minsize[1] = ret[1];
    }
    
    return this._minsize;
  }
  
  get_min_size(UICanvas canvas, Boolean isvertical) 
  {
    static ret = [1, 1];
    
    return ret;
  }
  build_draw(UICanvas canvas, Boolean isvertical) { }
  on_active() {}
  on_inactive() {}
  pack(UICanvas canvas, Boolean isvertical) {}
  gen_tooltip() : String {}
  on_add(parent) {}
  on_remove(parent) {}
}

export class UIHoverBox extends UIElement {
  constructor(Context ctx, String text, Boolean is_modal, Array<float> pos, Array<float> size) {
    UIElement.call(this, ctx, undefined, pos, size);
    
    this.is_modal = is_modal;
    this.text = text;
    
    this.packflag |= PackFlags.NO_REPACK;
  }
  
  get_min_size(UICanvas, Boolean isVertical) {
    return this.size;
  }
  
  on_mousedown(event) {
    if (this.is_modal) {
      //pop modal
      this.pop_modal();
      
      //pass event through
      var mpos = [event.x, event.y];
      
      var p = this, lastp;
      while (p != undefined) {
        lastp = p;
       
        mpos[0] += p.pos[0];
        mpos[1] += p.pos[1];
        
        p = p.parent;
      }
      
      //make sure to remove prior to sending the passthrough event
      this.parent.remove(this);
      this.parent.do_recalc();
      
      //console.log(mpos, this.pos, this.parent.parent);
      event.x = mpos[0]; event.y = mpos[1];
      lastp._on_mousedown(event);
    }
  }
  
  _on_mousedown(event) {
    if (this.state & UIFlags.ENABLED)
      this.on_mousedown(event);
  }

  _on_mousemove(event) {
    if (this.state & UIFlags.ENABLED)
      this.on_mousemove(event);
  }

  _on_mouseup(event) {
    if (this.state & UIFlags.ENABLED)
      this.on_mouseup(event);
  }
  
  _on_keydown(event) {
    if (this.state & UIFlags.ENABLED)
      this.on_keydown(event);
  }
  
  _on_keyup(event) {
    if (this.state & UIFlags.ENABLED)
      this.on_keyup(event);
  }
  
  on_mousemove(event) {
    if (this.is_modal && !inrect_2d([event.x, event.y], [0, 0], this.size)) {
      this.pop_modal();
      this.parent.remove(this);
      this.parent.do_recalc();
    }
  }
  
  build_draw(UICanvas canvas, Boolean isVertical) {
    canvas.begin(this);
    
    canvas.shadow_box([0, 0], this.size);
    
    //hrm, something is wrong with canvas.box1, which is used
    //to draw rounded boxes on desktops.  box2, used on tablets,
    //works correctly.  this size offset shouln't be necassary.
    var size = IsMobile ? this.size : [this.size[0], this.size[1]];

    canvas.box([0, 0], size, uicolors["HoverHint"]);
    canvas.text([4, 7], this.text, uicolors["BoxText"]);
    
    canvas.end(this);
  }
}

export class UIHoverHint extends UIElement {
  constructor(Context ctx, String path=undefined, Array<float> pos=undefined, Array<float> size=undefined) {
    global ui_hover_time;
    
    UIElement.call(this, ctx, path, pos, size);
    
    this.start_time = 0;
    this.hover_time = ui_hover_time;
    this.hovering = false;
  }
  
  start_hover() {
    this.start_time = time_ms();
    this.hovering = true;
//    console.log("start hover");
  }
  
  stop_hover() {
    this.hovering = false;
  }
  
  on_hint(Boolean is_modal=true) : UIElement {
    var hint = this.get_hint();
    
    console.log("hint: ", hint);
    if (!hint) return;
    
    if (this.ctx == undefined)
      this.ctx = new Context();
    
    if (this.get_canvas() == undefined) return;
    
    var size = new Vector2(this.get_canvas().textsize(hint));
    size.add([8.0, 12.0]);
    
    var pos = new Vector2([this.pos[0]+4, this.pos[1]-size[1]]);
    var hintbox = new UIHoverBox(this.ctx, hint, is_modal, pos, size);
    
    /*ensure hint is fully within view*/
    var abspos = [0, -size[1]];
    this.abs_transform(abspos);
    
    var screen = g_app_state.screen;
    var abspos2 = [abspos[0], abspos[1]];
    
    //move above element, if necassary
    //console.log("hint y", abspos[1], "x", abspos[0]);
    if (abspos[1] < 0) {
      abspos[1] += size[1] + this.size[1];
    }
    
    //clamp to within view, in case above code failed
    abspos[0] = Math.min(Math.max(0, abspos[0]), screen.size[0]-hintbox.size[0]);
    abspos[1] = Math.min(Math.max(0, abspos[1]), screen.size[1]-hintbox.size[1]);
    
    hintbox.pos[0] += abspos[0] - abspos2[0];
    hintbox.pos[1] += abspos[1] - abspos2[1];
    
    //hintbox.pos[0] = hintbox.pos[1] = 10.0;
    
    //don't interfere with other modal stuff
    is_modal = is_modal && (g_app_state.screen.modalhandler == undefined);
    this.parent.add_floating(hintbox, is_modal);
    
    return hintbox;
  }
  
  on_active() {
    if (this.hovering) {
      this.start_hover();
    }
  }
  
  on_inactive() {
    this.hovering = false;
  }
  
  on_tick() {
    if (this.hovering && time_ms()-this.start_time >= this.hover_time) {
      this.hovering = false;
      console.log("hint!");
      this.on_hint();
    }
  }
}
