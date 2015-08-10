export var DialogFlags = {MODAL : 1, END_ON_ESCAPE : 2, DEFAULT: 2};

import {ToolFlags, UndoFlags} from 'toolops_api';

import {UIElement, PackFlags, UIFlags, CanvasFlags} from 'UIElement';
import {UIFrame} from 'UIFrame';
import {
  UIButtonAbstract, UIButton, UIButtonIcon,
  UIMenuButton, UICheckBox, UINumBox, UILabel,
  UIMenuLabel, ScrollButton, UIVScroll, UIIconCheck
} from 'UIWidgets';

import {RowFrame, ColumnFrame, UIPackFrame} from 'UIPack';
import {UITextBox} from 'UITextBox';
import {ToolOp, UndoFlags, ToolFlags} from 'toolops_api';
import {UICollapseIcon, UIPanel, UIColorField, UIColorBox,
        UIColorPicker, UIProgressBar, UIListBox, UIListEntry
       } from 'UIWidgets_special';

import {UICanvas} from 'UICanvas2D';

class _TitleBar extends UIElement {
  constructor(Context ctx)
  {
    super(ctx);
    
    this.text = ""
    this.moving = false;
    this.start_mpos = [0, 0];
  }

  build_draw(canvas, isVertical) {
    canvas.simple_box([0, 0], this.size, uicolors["DialogTitle"]);
    
    var tsize = canvas.textsize(this.text);
    canvas.text([12, (this.size[1]-tsize[1])*0.5], this.text, uicolors["DialogText"], 12.0);
  }

  on_mousedown(event) {
    this.push_modal(this);
    this.moving = true;
    this.start_mpos = [event.x, event.y]
  }

  on_mousemove(event) {
    if (this.moving) { 
      this.parent.pos[0] += event.x-this.start_mpos[0];
      this.parent.pos[1] += event.y-this.start_mpos[1];
      this.parent.do_full_recalc();
    }
  }

  on_mouseup(event) {
    this.pop_modal();
    this.moving = false;
  }
}

export class Dialog extends UIFrame {
  constructor(title, ctx, screen, flag) {
    super(ctx, screen.canvas);
    
    this.title = title;
    this.screen = screen;

    this.headersize = 33
    this.callback = undefined;
    
    if (flag == undefined)
      this.flag = DialogFlags.DEFAULT;
    else
      this.flag = flag;
      
    this.subframe = new UIFrame(ctx, screen.canvas);
    this.titlebar = new _TitleBar(ctx);
    this.titlebar.canvas = this.canvas;
    
    this.add(this.titlebar);
    this.add(this.subframe);
  }

  static cancel_button(ctx) {
    var e = new UIButton(ctx, "Cancel");
    
    e.callback = function(element) {
      var p = element.parent;
      while (p != undefined && !(p instanceof Dialog)) {
        p = p.parent;
      }
      
      if (p == undefined) {
        console.log("Yeek, couldn't find parent dialog in Dialog.cancel_button");
        console.trace();
        return;
      }
      
      p.end(true);
    }
    return e;
  }

  static okay_button(ctx) {
    var e = new UIButton(ctx, "Okay");
    
    e.callback = function(element) {
      var p = element.parent;
      while (p != undefined && !(p instanceof Dialog)) {
        p = p.parent;
      }
      
      if (p == undefined) {
        console.log("Yeek, couldn't find parent dialog in Dialog.cancel_button");
        console.trace();
        return;
      }
      
      p.end(false);
    }
    
    return e;
  }

  on_draw(gl) {
  }

  build_draw(canvas, isVertical) {
    canvas = this.canvas;
    
    if (this.state & UIFlags.IS_CANVAS_ROOT) {
      canvas.clear();
      this.do_full_recalc();
      
      canvas.push_transform();
      canvas.translate(this.pos)
    }
    
    canvas.push_scissor([0, 0], this.size);
    
    /*
    if (this.flag & DialogFlags.MODAL) {
      //dim the screen
      clr = [0.2, 0.2, 0.2, 0.4];
      
      if (0) {
        var y = this.screen.size[1] - this.pos[1] - this.size[1]
        
        var size = [this.screen.size[0], y];
        canvas.simple_box([-this.pos[0], this.size[1]], size, clr, 100);
        
        y = this.screen.size[1] - this.pos[1]
        var size = [this.pos[0], this.size[1]+2];
        canvas.simple_box([-this.pos[0], 0], size, clr, 100);
        
        y = this.screen.size[1] - this.pos[1]
        var x = this.pos[0];
        
        var size = [this.screen.size[0]-this.pos[0]+this.size[0], this.size[1]+2];
        canvas.simple_box([this.size[0], 0], size, clr, 100);
      }
      
      canvas.simple_box([-this.pos[0], -this.pos[1]], this.screen.size, clr, 100);
    }  
    // */
    
    this.titlebar.pos = [0, this.size[1]-this.headersize]
    this.titlebar.size = [this.size[0], this.headersize]
    this.titlebar.text = this.title
    
    canvas.shadow_box([5,-1], this.size);
    canvas.simple_box([0,0], this.size, uicolors["DialogBox"]);

    super.build_draw(canvas, isVertical);
    
    //outline
    canvas.box_outline([0,0], this.size, uicolors["DialogBorder"]);
    
    canvas.pop_scissor();
    if (this.state & UIFlags.IS_CANVAS_ROOT) {
      canvas.pop_transform();
    }
  }

  on_keydown(event) {
    super.on_keydown(event);
    
    if (this.flag & DialogFlags.END_ON_ESCAPE) {
      if (event.keyCode == charmap["Escape"])
        this.end(true);
    }
  }
  
  call(Array<int> pos=undefined, Boolean center=false) {
    // /*
    //give dialog it's own canvas to draw on
    //this.state |= UIFlags.IS_CANVAS_ROOT;
    this.canvas = g_app_state.screen.canvas;
    
    //this.canvas = new UICanvas([new Vector2(g_app_state.screen.pos),
    //                            new Vector2(g_app_state.screen.size)])
    
    function visit(c, canvas) {
      c.canvas = canvas;
      if (c instanceof UIFrame) {
        for (var c2 of c.children) {
          visit(c2, canvas);
        }
      }
    }
    visit(this, this.canvas);
    
    //this.canvas.push_layer();
    //*/

    this.pack(this.screen.canvas, false);
    
    if (pos == undefined) {
      var screen = g_app_state.screen;
      
      if (center) {
        pos = [screen.size[0]*0.5, screen.size[1]*0.5];
      } else {
        pos = [screen.mpos[0], screen.mpos[1]];
        pos[1] -= this.size[1] + 20;
      }
    }
    
    /*clamp to screen bounds*/
    pos[0] = Math.min(pos[0]+this.size[0], this.screen.size[0]) - this.size[0];
    pos[1] = Math.min(pos[1]+this.size[1], this.screen.size[1]) - this.size[1];
    pos[0] = Math.max(pos[0], 0);
    pos[1] = Math.max(pos[1], 0);
    
    this.pos[0] = pos[0]; this.pos[1] = pos[1];
    this.screen.add(this);
    
    //create a modal dialog if MODAL flag is set, *or* a modal handler already exists
    if ((this.flag & DialogFlags.MODAL) || this.screen.modalhandler) {
      this.screen.push_modal(this);
    }
    
    //hrm, let's give the dialog it's own canvas
    
    
    this.titlebar.pos = [0, this.size[1]-this.headersize];
    this.titlebar.size = [this.size[0], this.headersize];
    
    this.subframe.pos = [0, 0];
    this.subframe.size = [this.size[0], this.size[1]-this.headersize]
    this.titlebar.do_recalc();
    this.subframe.do_recalc();
    this.do_recalc();
  }

  end(do_cancel) {
    //this.canvas.pop_layer();
    
    if (this.flag & DialogFlags.MODAL) {
      this.screen.pop_modal();
    }
    
    if (this.screen.children.has(this)) {
      this.screen.remove(this);
    }
  }
}

window.Dialog = Dialog;

export class PackedDialog extends Dialog {
  constructor(title, ctx, screen, flag) {
    super(title, ctx, screen, flag);
    
    this.remove(this.subframe);
    
    this.subframe = new RowFrame(ctx, undefined, PackFlags.ALIGN_BOTTOM|PackFlags.ALIGN_CENTER);
    this.add(this.subframe, PackFlags.INHERIT_WIDTH);
  }

  call(pos) {
    this.size = this.subframe.get_min_size(this.canvas);
    this.size[1] += this.headersize
    this.size[0] += 15
    
    super.call(pos);
    this.subframe.pack(this.canvas);
  }
}

export class OkayDialog extends PackedDialog {
  constructor(String text, Function callback) {
    var ctx = new Context();
    var screen = g_app_state.screen;
    var flag = 0;
    super("Okay?", ctx, screen, flag);
    
    this.callback = callback;
    
    var col = this.subframe.col();
    col.add(Dialog.okay_button(ctx));
    col.add(Dialog.cancel_button(ctx));
    var l = this.subframe.label(text);
    l.color = uicolors["DialogText"];
  }
  
  end(Boolean do_cancel) {
    super.end(do_cancel);
    this.callback(this, do_cancel);
  }
}

export class ErrorDialog extends PackedDialog {
  constructor(String text, Function callback) {
    var ctx = new Context();
    var screen = g_app_state.screen;
    var flag = 0;

    super("Error: ", ctx, screen, flag);
    
    this.callback = callback;
    
    var col = this.subframe;
    col.add(Dialog.okay_button(ctx), PackFlags.ALIGN_RIGHT);
    
    var c = col.label("  " + text + "    ");
    c.color = uicolors["DialogText"];
    
    c.set_color(uicolors["ErrorText"]);
    c.set_background(uicolors["ErrorTextBG"]);
  }
  
  end(Boolean do_cancel) {
    super.end(do_cancel);
    
    if (this.callback != undefined)
      this.callback(this, do_cancel);
  }
}

window.Dialog = Dialog;

