import {MinMax, inrect_2d, aabb_isect_2d} from 'mathlib';

import {
  UIElement, UIFlags, CanvasFlags,
  open_mobile_keyboard, close_mobile_keyboard,
  PackFlags
} from 'UIElement';
import {UIFrame} from "UIFrame";

//import {KeyMap, ToolKeyHandler, FuncKeyHandler, KeyHandler,
//  charmap, TouchEventManager, EventHandler} from "../editors/viewport/events";

export class UIHTMLElement extends UIElement {
  constructor(element, ctx, path) {
    super(ctx, path);
    
    this.element = element;
    this.visible = false;
    this.abspos = [0, 0];
    this.size = [120, 20];
    this.zindex = 32;
  }
  
  on_remove() {
    this.hide();
  }
  
  updateDOM() {
    this.element.style["z-index"] = this.zindex;
    this.element.style["position"] = "absolute"
    this.element.style["left"] = this.abspos[0] + "px";
    this.element.style["top"] = (window.innerHeight-this.abspos[1]-this.size[1]) + "px";
    this.element.style["width"] = this.size[0] + "px";
    this.element.style["height"] = this.size[1] + "px";
  }
  
  hide() {
    if (this.visible)
      document.body.removeChild(this.element);
    this.visible = false;
  }
  
  show() {
    if (!this.visible)
      document.body.appendChild(this.element);
    this.visible = true;
    
    this.updateDOM();
  }
};

export class UIHTMLTextbox extends UIHTMLElement {
  constructor(ctx : Context, text : String, pos : Array<number>, size : Array<number>, path : String) {
    super(document.createElement("input"), ctx, path);
    
    this.element.type = "text";
    this.element.value = text;
    this.text = text;
    
    this.on_end_edit = undefined;
    
    this.element.onchange = (element) => {
      this.text = element.value;
      
      if (this.callback !== undefined) {
        this.callback(this, this.text);
      }
    }

    this.element.onkeydown = this.on_keydown.bind(this);
    
    this.min_width = 110;
    
    this.callback = undefined;
    this.prop = undefined;
    this.replace_mode = false;
    this.cancel_on_escape = false;
  }
  
  on_keydown(e) {
    console.log("textbox key event", e.keyCode);
    
    switch (e.keyCode) {
      case 13: //enterkey
        this.end_edit(false);
        break;
      case 27: //escapekey
        this.end_edit(true); //cancel requested
        break;
    }
  }
  
  get has_focus() {
    return document.activeElement === this.element;
  }
  
  get editing() {
    return this.has_focus;
  }
  
  set_text(text : String) {
    this.element.value = text;
    this.text = text;
  }
  
  set_cursor() {
    //do nothing?
  }
  
  find_next_textbox() {
    var p = this.parent;
    
    //console.log("Fix dependency here");
    
    while (p != undefined && p.parent != undefined) {
      //break at appropriate window boundary
      if (p.parent.constructor.name == "ScreenArea" || p instanceof Dialog) {
        break;
      }
      
      p = p.parent;
    }
    
    var root = p;
    
    p = this.parent;
    var i = this.parent.children.indexOf(this);
    var c = this;
    
    function find_textbox(e, exclude) {
      if (e instanceof UIHTMLTextBox && e != exclude)
        return e;
      
      if (e instanceof UIFrame) {
        for (var c of e.children) {
          var ret = find_textbox(c, exclude);
          if (ret != undefined)
            return ret;
        }
      }
    }
    
    var next;
    do {
      next = find_textbox(c, this);
      if (next)
        break;
      
      p = p.parent;
      c = c.parent;
      i = p.children.indexOf(c);
    } while (p != root);
    if (!next) {
      next = find_textbox(root, this);
    }
    
    if (!next) {
      console.log("Error in find_next_textbox()");
      this.end_edit();
      return;
    }
    
    if (next == this) {
      this.end_edit();
      return;
    }
    
    this.end_edit();
    next.begin_edit();
  }
  
  begin_edit() {
    this.show();
    this.editing = true;
    this.updateDOM();
    
    this.element.focus();
    this.element.click();
  }
  
  end_edit(cancel) {
    this.editing = false;
    this.text = this.element.value;
    
    document.body.focus();
    
    if (this.on_end_edit !== undefined) {
      this.on_end_edit(this, cancel);
    }
  }
  
  select_all() {
    console.warn("UIHTMLTextBox.select_all(): Implement me!");
  }
  
  replace_text(text) {
    this.set_text(text);
    this.updateDOM();
  }
  
  on_tick() {
    if (!this.has_focus && (this.state & UIFlags.USE_PATH)) {
      if (!(this.state & UIFlags.ENABLED))
        return;

      var val = this.get_prop_data();
      
      if (val != this.text) {
        this.set_text(val !== undefined ? val : "");
        this.do_recalc();
      }
    }
    
    if (this.editing && this.cursor != this.last_cursor) {
      this.do_recalc();
    }
  }
  
  build_draw(canvas : UICanvas) {
    this.show();
    this.updateDOM();
  }
  
  updateDOM() {
    super.updateDOM();
  }
  
  get_min_size(canvas: UICanvas, isvertical: Boolean) {
    return [this.min_width, 17];
  }
};


