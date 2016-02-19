'use strict';

/*
file for widgets that import the dialog module
*/

import {PackedDialog, Dialog} from 'dialog';
import {UIElement, UIHoverHint, PackFlags, UIFlags} from 'UIElement';
import {UIColorPicker, UIColorField} from 'UIWidgets_special';
import {RowFrame, ColumnFrame, UIPackFrame} from 'UIPack';

export class UIColorButton extends RowFrame {
  constructor(ctx, packflag) {
    super(ctx);
    
    this.pad = [0, 0];
    
    var frame;
    if (!(packflag & PackFlags.VERTICAL)) {
      frame = this.col();
      
      frame.pad = [0, 0];
      frame.packflag |= packflag;
    } else {
      frame = this;
    }
    
    this.packflag |= packflag;
    
    this._label = frame.label("Color");
    this.colorb = new UIColorButtonField(ctx);
    
    frame.add(this.colorb);
  }
  
  on_tick() {
    super.on_tick();
    
    if (this.state & UIFlags.USE_PATH) {
      this.colorb.state |= UIFlags.USE_PATH;
      this.colorb.data_path = this.data_path;
      this.colorb.setter_path = this.setter_path;
      
      var prop = this.get_prop_meta();
      
      if (prop.uiname != this._label.text) {
        this._label.text = prop.uiname;
        this._label.do_recalc();
      }
    } else {
      this.colorb.state &= ~UIFlags.USE_PATH;
    }
  }
}

export class UIColorButtonField extends UIHoverHint {
  constructor(ctx, path=undefined, pos=undefined, size=undefined) {
    super(ctx, path, pos, size);
    
    this.clicked = false;
    this.mdown = false;
    this.dialog = undefined;
    
    this.title = "Color";
    this.description = this.title;
    
    this.color = [1, 0, 0, 1];
  }
  
  on_tick() {
    super.on_tick();
    
    if (this.state & UIFlags.USE_PATH) {
      var prop = this.get_prop_meta();
      
      if (prop == undefined) {
        return;
      }
      
      if (prop.description != undefined && prop.description != "") {
        this.description = prop.description;
      } else {
        this.description = prop.uiname;
      }
      this.title = prop.uiname;
      
      var color = this.get_prop_data();
      
      if (!(this.state & UIFlags.ENABLED))
        return;
      
      if (color == undefined || typeof color != "object" || typeof color.length != "number") {
        if (Math.random() > 0.99) {
          console.log("Error in UIColorButton!", color);
        }
        
        return;
      }
      
      if (this.color.length != color.length) {
        this.color.length = color.length;
      }
      
      var same = true;
      
      for (var i=0; i<this.color.length; i++) {
        if (color[i] != this.color[i]) {
          this.color[i] = color[i];
          same = false;
        }
      }
      
      if (!same) {
        this.do_recalc();
      }
    }
    
    if (this.dialog != undefined && this.dialog.closed) {
      if (this.clicked)
        this.do_recalc();
      
      this.clicked = false;
    }
  }
  
  build_draw(canvas, isVertical) {
    super.build_draw(canvas, isVertical);

    canvas.begin(this);
    
    var chksize = 10, chkpad = 3;
    var totcheck = ~~(Math.max(this.size[0], this.size[1]) / chksize + 0.5);
    var clra = [0.8, 0.8, 0.8, 1.0], clrb = [0.34, 0.34, 0.34, 1];
    
    for (var i=0; i<totcheck*totcheck;  i++) {
      var x = i % totcheck, y = ~~(i / totcheck);
      
      var x2 = (x+1)*chksize, y2 = (y+1)*chksize;
      var checkbool = (x+y) % 2 == 0;
      
      x *= chksize, y *= chksize;
      
      if (x >= this.size[0]-chkpad*2 || y >= this.size[1]-chkpad*2) {
        continue;
      }
      
      x2 = Math.min(x2, this.size[0]-chkpad*2);
      y2 = Math.min(y2, this.size[1]-chkpad*2);
      
      x += chkpad, y += chkpad;
      x2 += chkpad, y2 += chkpad;
      
      var clr = checkbool ? clra : clrb;
      canvas.quad([x, y], [x, y2], [x2, y2], [x2, y], clr, clr, clr, clr, false);
    }
    
    if (!(this.state & UIFlags.ENABLED)) {
      canvas.box([0, 0], this.size, this.do_flash_color(uicolors["DisabledBox"]));
    } else {
      canvas.box([0, 0], this.size, this.color);
    }
    
    if (this.clicked) {
      canvas.box([0, 0], this.size, [0.25, 0.25, 0.25, 0.5]);
    } else if (this.state & UIFlags.HIGHLIGHT) {
      //draw highlight as transparent overlay
      
      var highlight = uicolors["HLightBox"]
      if (typeof highlight[0] != "number") {
        highlight = highlight[0];
      }
      
      highlight = highlight.slice(0, highlight.length);
      highlight.length = 4, highlight[3] = 0.3; //reduce alpha
      
      canvas.box([0, 0], this.size, highlight);
    }
    
    canvas.end(this);
  }
  
  on_mousedown(e) {
    this.mdown = true;
    
    if (e.button == 0) {
      this.clicked ^= true;
      this.do_recalc();
      
      if (this.clicked) {
        this.spawn_colorpicker();
      } else {
        this.dialog.end(false);
        this.dialog = undefined;
      }
    }
  }
  
  spawn_colorpicker() {
    var dialog = this.dialog = new PackedDialog(this.title, this.ctx, this.ctx.screen);
    
    dialog.size = [420, 420];
    dialog.packflag |= PackFlags.KEEP_SIZE;
    
    dialog.subframe.size = [420, 420];
    dialog.subframe.packflag |= PackFlags.KEEP_SIZE;
    
    var picker = new UIColorPicker(this.ctx, this.color, this.color.length);
    dialog.subframe.add(picker);
    
    if (this.state & UIFlags.USE_PATH) {
      picker.state |= UIFlags.USE_PATH;
      picker.data_path = this.data_path;
      picker.setter_path = this.setter_path;
    }
    
    dialog.call(this.abs_pos);
    this.ctx.screen.do_full_recalc();
    
    var button = this;
    picker.on_colorchange = function() {
      var color = this.color;
      
      for (var i=0; i<button.color.length; i++) {
        button.color[i] = color[i];
      }
      
      button.do_recalc();
    }
  }
  
  on_mouseup(e) {
    this.mdown = false;
  }
  
  get_min_size(canvas, isVertical) {
    return [120, 26];
  }
}

//XXX promote to global
window.UIColorButton = UIColorButton;
