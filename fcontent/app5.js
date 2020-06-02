es6_module_define('ui_numsliders', ["../core/ui_base.js", "../util/util.js", "../toolsys/toolprop.js", "../util/simple_events.js", "./ui_widgets.js", "../util/vectormath.js", "../core/units.js", "../core/ui.js"], function _ui_numsliders_module(_es6_module) {
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var drawText=es6_import_item(_es6_module, '../core/ui_base.js', 'drawText');
  var ValueButtonBase=es6_import_item(_es6_module, './ui_widgets.js', 'ValueButtonBase');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var units=es6_import(_es6_module, '../core/units.js');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var util=es6_import(_es6_module, '../util/util.js');
  var PropTypes=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropTypes');
  var PropSubTypes=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropSubTypes');
  var PropFlags=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropFlags');
  var pushModalLight=es6_import_item(_es6_module, '../util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../util/simple_events.js', 'popModalLight');
  var KeyMap=es6_import_item(_es6_module, '../util/simple_events.js', 'KeyMap');
  var keymap=es6_import_item(_es6_module, '../util/simple_events.js', 'keymap');
  class NumSlider extends ValueButtonBase {
     constructor() {
      super();
      this._last_label = undefined;
      this._name = "";
      this._step = 0.1;
      this._value = 0.0;
      this._expRate = 1.333;
      this.decimalPlaces = 4;
      this.radix = 10;
      this.vertical = false;
      this.range = [-1e+17, 1e+17];
      this.isInt = false;
      this._redraw();
    }
    get  step() {
      return this._step;
    }
    set  step(v) {
      this._step = v;
    }
    get  expRate() {
      return this._expRate;
    }
    set  expRate(v) {
      this._expRate = v;
    }
     updateDataPath() {
      if (!this.hasAttribute("datapath")) {
          return ;
      }
      let rdef=this.ctx.api.resolvePath(this.ctx, this.getAttribute("datapath"));
      let prop=rdef ? rdef.prop : undefined;
      if (!prop)
        return ;
      if (prop.expRate) {
          this._expRate = prop.expRate;
      }
      if (prop.radix!==undefined) {
          this.radix = prop.radix;
      }
      if (prop.step) {
          this._step = prop.getStep(rdef.value);
      }
      if (prop.decimalPlaces!==undefined) {
          this.decimalPlaces = prop.decimalPlaces;
      }
      if (prop.baseUnit!==undefined) {
          this.baseUnit = prop.baseUnit;
      }
      if (prop.displayUnit!==undefined) {
          this.displayUnit = prop.displayUnit;
      }
      super.updateDataPath();
    }
     update() {
      super.update();
      this.updateDataPath();
    }
     swapWithTextbox() {
      let tbox=document.createElement("textbox-x");
      tbox.ctx = this.ctx;
      tbox._init();
      tbox.decimalPlaces = this.decimalPlaces;
      tbox.isInt = this.isInt;
      if (this.isInt&&this.radix!=10) {
          let text=this.value.toString(this.radix);
          if (this.radix===2)
            text = "0b"+text;
          else 
            if (this.radix===16)
            text+="h";
          tbox.text = text;
      }
      else {
        tbox.text = units.buildString(this.value, this.baseUnit, this.decimalPlaces, this.displayUnit);
      }
      this.parentNode.insertBefore(tbox, this);
      this.hidden = true;
      let finish=(ok) =>        {
        tbox.remove();
        this.hidden = false;
        if (ok) {
            let val=tbox.text.trim();
            if (this.isInt&&this.radix!==10) {
                val = parseInt(val);
            }
            else {
              val = units.parseValue(val, this.baseUnit);
            }
            if (isNaN(val)) {
                console.log("EEK!");
                this.flash(ui_base.ErrorColors.ERROR);
            }
            else {
              this.setValue(val);
              if (this.onchange) {
                  this.onchange(this);
              }
            }
        }
      };
      tbox.onend = finish;
      tbox.focus();
      tbox.select();
      return ;
    }
     bindEvents() {
      let dir=this.range&&this.range[0]>this.range[1] ? -1 : 1;
      this.addEventListener("keydown", (e) =>        {
        switch (e.keyCode) {
          case keymap["Left"]:
          case keymap["Down"]:
            this.setValue(this.value-dir*5*this.step);
            break;
          case keymap["Up"]:
          case keymap["Right"]:
            this.setValue(this.value+dir*5*this.step);
            break;
        }
      });
      let onmousedown=(e) =>        {
        if (this.disabled) {
            e.preventDefault();
            e.stopPropagation();
            return ;
        }
        let r=this.getClientRects()[0];
        let x=e.x;
        if (r) {
            x-=r.x;
            let sz=this._getArrowSize();
            let v=this.value;
            let step=this.step||0.01;
            if (this.isInt) {
                step = Math.max(step, 1);
            }
            else {
              step*=5.0;
            }
            if (x<sz*1.5) {
                this.setValue(v-step);
            }
            else 
              if (x>r.width-sz*1.5) {
                this.setValue(v+step);
            }
        }
        if (e.button==0&&e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            this.swapWithTextbox();
        }
        else 
          if (!e.button) {
            this.dragStart(e);
            e.preventDefault();
            e.stopPropagation();
        }
      };
      this.addEventListener("dblclick", (e) =>        {
        if (this.disabled) {
            e.preventDefault();
            e.stopPropagation();
            return ;
        }
        e.preventDefault();
        e.stopPropagation();
        this.swapWithTextbox();
      });
      this.addEventListener("mousedown", (e) =>        {
        if (this.disabled)
          return ;
        onmousedown(e);
      });
      this.addEventListener("mouseover", (e) =>        {
        if (this.disabled)
          return ;
        this.dom._background = this.getDefault("BoxHighlight");
        this._repos_canvas();
        this._redraw();
      });
      this.addEventListener("mouseout", (e) =>        {
        if (this.disabled)
          return ;
        this.dom._background = this.getDefault("BoxBG");
        this._repos_canvas();
        this._redraw();
      });
    }
     doRange() {
      if (this.hasAttribute("min")) {
          this.range[0] = parseFloat(this.getAttribute("min"));
      }
      if (this.hasAttribute("max")) {
          this.range[1] = parseFloat(this.getAttribute("max"));
      }
      this._value = Math.min(Math.max(this._value, this.range[0]), this.range[1]);
    }
    get  value() {
      return this._value;
    }
    set  value(val) {
      this.setValue(val, true, false);
    }
     setValue(value, fire_onchange=true) {
      this._value = value;
      if (this.hasAttribute("integer")) {
          this.isInt = true;
      }
      if (this.isInt) {
          this._value = Math.floor(this._value);
      }
      this.doRange();
      if (this.ctx&&this.hasAttribute("datapath")) {
          this.setPathValue(this.ctx, this.getAttribute("datapath"), this._value);
      }
      if (fire_onchange&&this.onchange) {
          this.onchange(this.value);
      }
      this._redraw();
    }
     dragStart(e) {
      if (this.disabled)
        return ;
      let last_background=this.dom._background;
      let cancel;
      let startvalue=this.value;
      let value=startvalue;
      let startx=this.vertical ? e.y : e.x, starty=this.vertical ? e.x : e.y;
      this.dom._background = this.getDefault("BoxDepressed");
      let fire=() =>        {
        if (this.onchange) {
            this.onchange(this);
        }
      };
      let handlers={on_keydown: (e) =>          {
          switch (e.keyCode) {
            case 27:
              cancel(true);
            case 13:
              cancel(false);
              break;
          }
          e.preventDefault();
          e.stopPropagation();
        }, 
     on_mousemove: (e) =>          {
          if (this.disabled)
            return ;
          e.preventDefault();
          e.stopPropagation();
          let dx=(this.vertical ? e.y : e.x)-startx;
          startx = (this.vertical ? e.y : e.x);
          if (e.shiftKey) {
              dx*=0.1;
          }
          dx*=this.vertical ? -1 : 1;
          value+=dx*this._step*0.1;
          let dvalue=value-startvalue;
          let dsign=Math.sign(dvalue);
          if (!this.hasAttribute("linear")) {
              dvalue = Math.pow(Math.abs(dvalue), this._expRate)*dsign;
          }
          this.value = startvalue+dvalue;
          this.doRange();
          this.updateWidth();
          this._redraw();
          fire();
        }, 
     on_mouseup: (e) =>          {
          cancel(false);
          e.preventDefault();
          e.stopPropagation();
        }, 
     on_mouseout: (e) =>          {
          last_background = this.getDefault("BoxBG");
          e.preventDefault();
          e.stopPropagation();
        }, 
     on_mouseover: (e) =>          {
          last_background = this.getDefault("BoxHighlight");
          e.preventDefault();
          e.stopPropagation();
        }, 
     on_mousedown: (e) =>          {
          this.popModal();
        }};
      this.pushModal(handlers);
      cancel = (restore_value) =>        {
        if (restore_value) {
            this.value = startvalue;
            this.updateWidth();
            fire();
        }
        this.dom._background = last_background;
        this._redraw();
        console.trace("end");
        this.popModal();
      };
    }
     setCSS() {
      let dpi=this.getDPI();
      let ts=this.getDefault("DefaultText").size*UIBase.getDPI();
      let dd=this.isInt ? 5 : this.decimalPlaces+8;
      let label=this._genLabel();
      let tw=ui_base.measureText(this, label, {size: ts, 
     font: this.getDefault("DefaultText")}).width;
      tw = Math.max(tw, this.getDefault("defaultWidth"));
      tw+=this._getArrowSize()*4+ts;
      tw = ~~tw;
      if (this.vertical) {
          this.style["width"] = this.dom.style["width"] = this.getDefault("defaultHeight")+"px";
          this.style["height"] = tw+"px";
          this.dom.style["height"] = tw+"px";
      }
      else {
        this.style["height"] = this.dom.style["height"] = this.getDefault("defaultHeight")+"px";
        this.style["width"] = tw+"px";
        this.dom.style["width"] = tw+"px";
      }
      this._repos_canvas();
      this._redraw();
    }
     updateName(force) {
      let name=this.getAttribute("name");
      if (force||name!==this._name) {
          this._name = name;
          this.setCSS();
      }
      let label=this._genLabel();
      if (label!==this._last_label) {
          this._last_label = label;
          this.setCSS();
      }
    }
     _genLabel() {
      let val=this.value;
      let text;
      if (val===undefined) {
          text = "error";
      }
      else {
        val = val===undefined ? 0.0 : val;
        val = units.buildString(val, this.baseUnit, this.decimalPlaces, this.displayUnit);
        text = val;
        if (this._name) {
            text = this._name+": "+text;
        }
      }
      return text;
    }
     updateDefaultSize() {
      let height=~~(this.getDefault("defaultHeight"))+this.getDefault("BoxMargin");
      let size=this.getDefault("DefaultText").size*1.33;
      height = ~~Math.max(height, size);
      height = height+"px";
      if (height!==this.style["height"]) {
          this.setCSS();
          this._repos_canvas();
          this._redraw();
      }
    }
     _redraw() {
      let g=this.g;
      let canvas=this.dom;
      let dpi=this.getDPI();
      let disabled=this.disabled;
      let r=this.getDefault("BoxRadius");
      if (this.isInt) {
          r*=0.25;
      }
      ui_base.drawRoundBox(this, this.dom, this.g, undefined, undefined, r, undefined, disabled ? this.getDefault("DisabledBG") : undefined);
      r*=dpi;
      let pad=this.getDefault("BoxMargin");
      let ts=this.getDefault("DefaultText").size;
      let text=this._genLabel();
      let tw=ui_base.measureText(this, text, this.dom, this.g).width;
      let cx=ts+this._getArrowSize();
      let cy=this.dom.height/2;
      this.dom.font = undefined;
      g.save();
      if (!window._d) {
          window._d = Math.PI*0.5;
      }
      if (this.vertical) {
          g.rotate(_d);
          ui_base.drawText(this, cx, -ts*0.5, text, {canvas: this.dom, 
       g: this.g, 
       size: ts});
          g.restore();
      }
      else {
        ui_base.drawText(this, cx, cy+ts/2, text, {canvas: this.dom, 
      g: this.g, 
      size: ts});
      }
      let c=css2color(this.getDefault("BoxBG"));
      let f=1.0-(c[0]+c[1]+c[2])*0.33;
      f = ~~(f*255);
      g.fillStyle = `rgba(${f},${f},${f},0.95)`;
      let d=7, w=canvas.width, h=canvas.height;
      let sz=this._getArrowSize();
      if (this.vertical) {
          g.beginPath();
          g.moveTo(w*0.5, d);
          g.lineTo(w*0.5+sz*0.5, d+sz);
          g.lineTo(w*0.5-sz*0.5, d+sz);
          g.moveTo(w*0.5, h-d);
          g.lineTo(w*0.5+sz*0.5, h-sz-d);
          g.lineTo(w*0.5-sz*0.5, h-sz-d);
      }
      else {
        g.beginPath();
        g.moveTo(d, h*0.5);
        g.lineTo(d+sz, h*0.5+sz*0.5);
        g.lineTo(d+sz, h*0.5-sz*0.5);
        g.moveTo(w-d, h*0.5);
        g.lineTo(w-sz-d, h*0.5+sz*0.5);
        g.lineTo(w-sz-d, h*0.5-sz*0.5);
      }
      g.fill();
    }
     _getArrowSize() {
      return UIBase.getDPI()*10;
    }
    static  define() {
      return {tagname: "numslider-x", 
     style: "numslider"}
    }
  }
  _ESClass.register(NumSlider);
  _es6_module.add_class(NumSlider);
  NumSlider = _es6_module.add_export('NumSlider', NumSlider);
  UIBase.register(NumSlider);
  class NumSliderSimpleBase extends UIBase {
     constructor() {
      super();
      this.baseUnit = undefined;
      this.displayUnit = undefined;
      this.canvas = document.createElement("canvas");
      this.g = this.canvas.getContext("2d");
      this.canvas.style["width"] = this.getDefault("DefaultWidth")+"px";
      this.canvas.style["height"] = this.getDefault("DefaultHeight")+"px";
      this.canvas.style["pointer-events"] = "none";
      this.highlight = false;
      this.isInt = false;
      this.shadow.appendChild(this.canvas);
      this.range = [0, 1];
      this.step = 0.1;
      this._value = 0.5;
      this._focus = false;
      this.modal = undefined;
    }
     setValue(val, fire_onchange=true) {
      val = Math.min(Math.max(val, this.range[0]), this.range[1]);
      if (this.isInt) {
          val = Math.floor(val);
      }
      if (this._value!==val) {
          this._value = val;
          this._redraw();
          if (this.onchange&&fire_onchange) {
              this.onchange(val);
          }
          if (this.getAttribute("datapath")) {
              let path=this.getAttribute("datapath");
              this.setPathValue(this.ctx, path, this._value);
          }
      }
    }
    get  value() {
      return this._value;
    }
    set  value(val) {
      this.setValue(val);
    }
     updateDataPath() {
      if (!this.hasAttribute("datapath")) {
          return ;
      }
      let path=this.getAttribute("datapath");
      if (!path||path==="null"||path==="undefined") {
          return ;
      }
      let val=this.getPathValue(this.ctx, path);
      if (this.isInt) {
          val = Math.floor(val);
      }
      if (val!==this._value) {
          let prop=this.getPathMeta(this.ctx, path);
          if (!prop) {
              return ;
          }
          this.isInt = prop.type===PropTypes.INT;
          if (prop.range!==undefined) {
              this.range[0] = prop.range[0];
              this.range[1] = prop.range[1];
          }
          if (prop.uiRange!==undefined) {
              this.uiRange = new Array(2);
              this.uiRange[0] = prop.uiRange[0];
              this.uiRange[1] = prop.uiRange[1];
          }
          this.value = val;
      }
    }
     _setFromMouse(e) {
      let rect=this.getClientRects()[0];
      if (rect===undefined) {
          return ;
      }
      let x=e.x-rect.left;
      let dpi=UIBase.getDPI();
      let co=this._getButtonPos();
      let val=this._invertButtonX(x*dpi);
      this.value = val;
    }
     _startModal(e) {
      if (e!==undefined) {
          this._setFromMouse(e);
      }
      let dom=window;
      let evtargs={capture: false};
      if (this.modal) {
          console.warn("Double call to _startModal!");
          return ;
      }
      console.log("start simple numslider modal");
      let end=() =>        {
        console.log("end simple numslider modal");
        if (this._modal===undefined) {
            console.warn("end called twiced");
            return ;
        }
        popModalLight(this._modal);
        this._modal = undefined;
        this.modal = undefined;
      };
      this.modal = {mousemove: (e) =>          {
          this._setFromMouse(e);
        }, 
     mouseover: (e) =>          {        }, 
     mouseout: (e) =>          {        }, 
     mouseleave: (e) =>          {        }, 
     mouseenter: (e) =>          {        }, 
     blur: (e) =>          {        }, 
     focus: (e) =>          {        }, 
     mouseup: (e) =>          {
          end();
        }, 
     keydown: (e) =>          {
          switch (e.keyCode) {
            case keymap["Enter"]:
            case keymap["Space"]:
            case keymap["Escape"]:
              end();
          }
        }};
      function makefunc(f) {
        return (e) =>          {
          e.stopPropagation();
          e.preventDefault();
          return f(e);
        }
      }
      for (let k in this.modal) {
          this.modal[k] = makefunc(this.modal[k]);
      }
      this._modal = pushModalLight(this.modal);
    }
     init() {
      super.init();
      if (!this.hasAttribute("tab-index")) {
          this.setAttribute("tab-index", 0);
      }
      this.updateSize();
      this.addEventListener("keydown", (e) =>        {
        console.log("yay keydown", e.keyCode);
        let dt=this.range[1]>this.range[0] ? 1 : -1;
        switch (e.keyCode) {
          case keymap["Left"]:
          case keymap["Right"]:
            let fac=this.step;
            if (e.shiftKey) {
                fac*=0.1;
            }
            if (this.isInt) {
                fac = Math.max(fac, 1);
            }
            this.value+=e.keyCode===keymap["Left"] ? -dt*fac : dt*fac;
            break;
        }
      });
      this.addEventListener("focusin", () =>        {
        if (this.disabled)
          return ;
        this._focus = 1;
        this._redraw();
        this.focus();
      });
      this.addEventListener("mousedown", (e) =>        {
        this._startModal(e);
      });
      this.addEventListener("mousein", (e) =>        {
        this.setHighlight(e);
        this._redraw();
      });
      this.addEventListener("mouseout", (e) =>        {
        this.highlight = false;
        this._redraw();
      });
      this.addEventListener("mouseover", (e) =>        {
        this.setHighlight(e);
        this._redraw();
      });
      this.addEventListener("mousemove", (e) =>        {
        this.setHighlight(e);
        this._redraw();
      });
      this.addEventListener("mouseleave", (e) =>        {
        this.highlight = false;
        this._redraw();
      });
      this.addEventListener("blur", (e) =>        {
        this._focus = 0;
        this.highlight = false;
        this._redraw();
      });
      this.setCSS();
    }
     setHighlight(e) {
      this.highlight = this.isOverButton(e) ? 2 : 1;
    }
     _redraw() {
      let g=this.g, canvas=this.canvas;
      let w=canvas.width, h=canvas.height;
      let dpi=UIBase.getDPI();
      let color=this.getDefault("BoxBG");
      let sh=~~(this.getDefault("SlideHeight")*dpi+0.5);
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.fillStyle = color;
      let y=(h-sh)*0.5;
      let r=this.getDefault("BoxRadius");
      r = 3;
      g.translate(0, y);
      ui_base.drawRoundBox(this, this.canvas, g, w, sh, r, "fill", color, undefined, true);
      g.translate(0, -y);
      if (this.highlight===1) {
          color = this.getDefault("BoxHighlight");
      }
      else {
        color = this.getDefault("BoxBorder");
      }
      g.strokeStyle = color;
      g.stroke();
      let co=this._getButtonPos();
      g.beginPath();
      if (this.highlight===2) {
          color = this.getDefault("BoxHighlight");
      }
      else {
        color = this.getDefault("BoxBorder");
      }
      g.arc(co[0], co[1], Math.abs(co[2]), -Math.PI, Math.PI);
      g.fill();
      g.strokeStyle = color;
      g.stroke();
      g.beginPath();
      g.setLineDash([4, 4]);
      if (this._focus) {
          g.strokeStyle = this.getDefault("BoxHighlight");
          g.arc(co[0], co[1], co[2]-4, -Math.PI, Math.PI);
          g.stroke();
      }
      g.setLineDash([]);
    }
     isOverButton(e) {
      let x=e.x, y=e.y;
      let rect=this.getClientRects()[0];
      if (!rect) {
          return false;
      }
      x-=rect.left;
      y-=rect.top;
      let co=this._getButtonPos();
      let dpi=UIBase.getDPI();
      let dv=new Vector2([co[0]/dpi-x, co[1]/dpi-y]);
      let dis=dv.vectorLength();
      return dis<co[2]/dpi;
    }
     _invertButtonX(x) {
      let w=this.canvas.width;
      let dpi=UIBase.getDPI();
      let sh=~~(this.getDefault("SlideHeight")*dpi+0.5);
      let boxw=this.canvas.height-4;
      let w2=w-boxw;
      x = (x-boxw*0.5)/w2;
      x = x*(this.range[1]-this.range[0])+this.range[0];
      return x;
    }
     _getButtonPos() {
      let w=this.canvas.width;
      let dpi=UIBase.getDPI();
      let sh=~~(this.getDefault("SlideHeight")*dpi+0.5);
      let x=this._value;
      x = (x-this.range[0])/(this.range[1]-this.range[0]);
      let boxw=this.canvas.height-4;
      let w2=w-boxw;
      x = x*w2+boxw*0.5;
      return [x, boxw*0.5, boxw*0.5];
    }
     setCSS() {
      super.setCSS();
      this.canvas.style["width"] = "min-contents";
      this.canvas.style["min-width"] = this.getDefault("DefaultWidth")+"px";
      this.style["min-width"] = this.getDefault("DefaultWidth")+"px";
      this._redraw();
    }
     updateSize() {
      if (this.canvas===undefined) {
          return ;
      }
      let rect=this.getClientRects()[0];
      if (rect===undefined) {
          return ;
      }
      let dpi=UIBase.getDPI();
      let w=~~(rect.width*dpi), h=~~(rect.height*dpi);
      let canvas=this.canvas;
      if (w!==canvas.width||h!==canvas.height) {
          this.canvas.width = w;
          this.canvas.height = h;
          this.setCSS();
          this._redraw();
      }
    }
     _ondestroy() {
      if (this._modal) {
          popModalLight(this._modal);
          this._modal = undefined;
      }
    }
     update() {
      super.update();
      if (this.getAttribute("tab-index")!==this.tabIndex) {
          this.tabIndex = this.getAttribute("tab-index");
      }
      this.updateSize();
      this.updateDataPath();
    }
    static  define() {
      return {tagname: "numslider-simple-base-x", 
     style: "numslider_simple"}
    }
  }
  _ESClass.register(NumSliderSimpleBase);
  _es6_module.add_class(NumSliderSimpleBase);
  NumSliderSimpleBase = _es6_module.add_export('NumSliderSimpleBase', NumSliderSimpleBase);
  UIBase.register(NumSliderSimpleBase);
  class SliderWithTextbox extends ColumnFrame {
     constructor() {
      super();
      this._value = 0;
      this._name = undefined;
      this._lock_textbox = false;
      this.labelOnTop = undefined;
      this._last_label_on_top = undefined;
      this.styletag.textContent = `
    .numslider_simple_textbox {
      padding : 0px;
      margin  : 0px;
      height  : 15px;
    }
    `;
      this.container = this;
      this.textbox = document.createElement("textbox-x");
      this.textbox.width = 55;
      this._numslider = undefined;
      this.textbox.setAttribute("class", "numslider_simple_textbox");
    }
    get  numslider() {
      return this._numslider;
    }
    set  numslider(v) {
      this._numslider = v;
      this.textbox.range = this._numslider.range;
    }
    set  range(v) {
      this.numslider.range = v;
    }
    get  range() {
      return this.numslider.range;
    }
    get  step() {
      return this.numslider.step;
    }
    set  step(v) {
      this.numslider.step = v;
    }
    get  expRate() {
      return this.numslider.expRate;
    }
    set  expRate(v) {
      this.numslider.expRate = v;
    }
    get  decimalPlaces() {
      return this.numslider.decimalPlaces;
    }
    set  decimalPlaces(v) {
      this.numslider.decimalPlaces = v;
    }
    get  isInt() {
      return this.numslider.isInt;
    }
    set  isInt(v) {
      this.numslider.isInt = v;
    }
    get  radix() {
      return this.numslider.radix;
    }
    set  radix(v) {
      this.numslider.radix = v;
    }
    get  stepIsRelative() {
      return this.numslider.stepIsRelative;
    }
    set  stepIsRelative(v) {
      this.numslider.stepIsRelative = v;
    }
    get  displayUnit() {
      return this.textbox.displayUnit;
    }
    set  displayUnit(val) {
      let update=val!==this.displayUnit;
      this.numslider.displayUnit = this.textbox.displayUnit = val;
      if (update) {
          this.updateTextBox();
      }
    }
    get  baseUnit() {
      return this.textbox.baseUnit;
    }
    set  baseUnit(val) {
      let update=val!==this.baseUnit;
      this.numslider.baseUnit = this.textbox.baseUnit = val;
      if (update) {
          console.log(this.slider);
          this.updateTextBox();
      }
    }
     init() {
      super.init();
      if (this.hasAttribute("labelOnTop")) {
          this.labelOnTop = this.getAttribute("labelOnTop");
      }
      else {
        this.labelOnTop = this.getDefault("labelOnTop");
      }
      this.rebuild();
    }
     rebuild() {
      this._last_label_on_top = this.labelOnTop;
      this.container.clear();
      if (!this.labelOnTop) {
          this.container = this.row();
      }
      else {
        this.container = this;
      }
      if (this.hasAttribute("name")) {
          this._name = this.hasAttribute("name");
      }
      else {
        this._name = "slider";
      }
      this.l = this.container.label(this._name);
      this.l.font = "TitleText";
      this.l.overrideClass("numslider_simple");
      this.l.style["display"] = "float";
      this.l.style["position"] = "relative";
      if (!this.labelOnTop&&!(__instance_of(this.numslider, NumSlider))) {
          this.l.style["left"] = "8px";
          this.l.style["top"] = "5px";
      }
      let strip=this.container.row();
      strip.add(this.numslider);
      let path=this.hasAttribute("datapath") ? this.getAttribute("datapath") : undefined;
      let textbox=this.textbox;
      textbox.onchange = () =>        {
        let text=textbox.text;
        if (!isNumber(text)) {
            textbox.flash("red");
            return ;
        }
        else {
          textbox.flash("green");
          let f=units.parseValue(text, this.baseUnit);
          if (isNaN(f)) {
              this.flash("red");
              return ;
          }
          if (this.isInt) {
              f = Math.floor(f);
          }
          this._lock_textbox = 1;
          this.setValue(f);
          this._lock_textbox = 0;
        }
      };
      textbox.ctx = this.ctx;
      textbox.packflag|=this.inherit_packflag;
      textbox._width = this.getDefault("TextBoxWidth")+"px";
      textbox.style["height"] = (this.getDefault("DefaultHeight")-2)+"px";
      textbox._init();
      strip.add(textbox);
      textbox.setCSS();
      this.linkTextBox();
      let in_onchange=0;
      this.numslider.onchange = (val) =>        {
        this._value = this.numslider.value;
        this.updateTextBox();
        if (in_onchange) {
            return ;
        }
        if (this.onchange!==undefined) {
            in_onchange++;
            try {
              if (this.onchange) {
                  this.onchange(this);
              }
            }
            catch (error) {
                util.print_stack(error);
            }
        }
        in_onchange--;
      };
    }
     updateTextBox() {
      if (!this._init_done) {
          return ;
      }
      if (this._lock_textbox>0)
        return ;
      this.textbox.text = this.formatNumber(this._value);
      this.textbox.update();
    }
     linkTextBox() {
      this.updateTextBox();
      let onchange=this.numslider.onchange;
      this.numslider.onchange = (e) =>        {
        this._value = e.value;
        this.updateTextBox();
        onchange(e);
      };
    }
     setValue(val, fire_onchange=true) {
      this._value = val;
      this.numslider.setValue(val, fire_onchange);
      this.updateTextBox();
    }
    get  value() {
      return this._value;
    }
    set  value(val) {
      this.setValue(val);
    }
     updateName() {
      let name=this.getAttribute("name");
      if (!name&&this.hasAttribute("datapath")) {
          let prop=this.getPathMeta(this.ctx, this.getAttribute("datapath"));
          if (prop) {
              name = prop.uiname;
          }
      }
      if (!name) {
          name = "[error]";
      }
      if (name!==this._name) {
          this._name = name;
          this.l.text = name;
      }
    }
     updateLabelOnTop() {
      if (this.labelOnTop!==this._last_label_on_top) {
          this._last_label_on_top = this.labelOnTop;
          this.rebuild();
      }
    }
     updateDataPath() {
      if (!this.ctx||!this.getAttribute("datapath")) {
          return ;
      }
      let prop=this.getPathMeta(this.ctx, this.getAttribute("datapath"));
      if (prop!==undefined&&!this.baseUnit&&prop.baseUnit) {
          this.baseUnit = prop.baseUnit;
      }
      if (prop!==undefined&&!this.displayUnit&&prop.displayUnit) {
          this.displayUnit = prop.displayUnit;
      }
    }
     update() {
      this.updateLabelOnTop();
      super.update();
      this.updateDataPath();
      let redraw=false;
      if (this.hasAttribute("min")) {
          let r=this.range[0];
          this.range[0] = parseFloat(this.getAttribute("min"));
          redraw = Math.abs(this.range[0]-r)>0.0001;
      }
      if (this.hasAttribute("max")) {
          let r=this.range[1];
          this.range[1] = parseFloat(this.getAttribute("max"));
          redraw = redraw||Math.abs(this.range[1]-r)>0.0001;
      }
      if (this.hasAttribute("integer")) {
          let val=this.getAttribute("integer");
          val = val||val===null;
          redraw = redraw||!!val!==this.isInt;
          this.isInt = !!val;
          this.numslider.isInt = !!val;
          this.textbox.isInt = !!val;
      }
      if (redraw) {
          console.log("numslider draw");
          this.setCSS();
          this.numslider.setCSS();
          this.numslider._redraw();
      }
      this.updateName();
      this.numslider.description = this.description;
      this.textbox.description = this.title;
      if (this.hasAttribute("datapath")) {
          this.numslider.setAttribute("datapath", this.getAttribute("datapath"));
      }
      if (this.hasAttribute("mass_set_path")) {
          this.numslider.setAttribute("mass_set_path", this.getAttribute("mass_set_path"));
      }
    }
     setCSS() {
      super.setCSS();
      this.textbox.setCSS();
    }
  }
  _ESClass.register(SliderWithTextbox);
  _es6_module.add_class(SliderWithTextbox);
  SliderWithTextbox = _es6_module.add_export('SliderWithTextbox', SliderWithTextbox);
  class NumSliderSimple extends SliderWithTextbox {
     constructor() {
      super();
      this.numslider = document.createElement("numslider-simple-base-x");
    }
    static  define() {
      return {tagname: "numslider-simple-x", 
     style: "numslider_simple"}
    }
  }
  _ESClass.register(NumSliderSimple);
  _es6_module.add_class(NumSliderSimple);
  NumSliderSimple = _es6_module.add_export('NumSliderSimple', NumSliderSimple);
  UIBase.register(NumSliderSimple);
  class NumSliderWithTextBox extends SliderWithTextbox {
     constructor() {
      super();
      this.numslider = document.createElement("numslider-x");
    }
     _redraw() {
      this.numslider._redraw();
    }
    static  define() {
      return {tagname: "numslider-textbox-x", 
     style: "numslider-textbox-x"}
    }
  }
  _ESClass.register(NumSliderWithTextBox);
  _es6_module.add_class(NumSliderWithTextBox);
  NumSliderWithTextBox = _es6_module.add_export('NumSliderWithTextBox', NumSliderWithTextBox);
  UIBase.register(NumSliderWithTextBox);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_numsliders.js');
es6_module_define('ui_panel', ["../core/ui.js", "../util/util.js", "./ui_widgets.js", "../util/vectormath.js", "../toolsys/toolprop.js", "../util/html5_fileapi.js", "../core/ui_base.js"], function _ui_panel_module(_es6_module) {
  var _ui=undefined;
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var ui_widgets=es6_import(_es6_module, './ui_widgets.js');
  var toolprop=es6_import(_es6_module, '../toolsys/toolprop.js');
  es6_import(_es6_module, '../util/html5_fileapi.js');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var RowFrame=es6_import_item(_es6_module, '../core/ui.js', 'RowFrame');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  let PropFlags=toolprop.PropFlags;
  let PropSubTypes=toolprop.PropSubTypes;
  let EnumProperty=toolprop.EnumProperty;
  let Vector2=vectormath.Vector2, UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, PropTypes=toolprop.PropTypes;
  class PanelFrame extends ColumnFrame {
     constructor() {
      super();
      this.contents = document.createElement("colframe-x");
      this.iconcheck = document.createElement("iconcheck-x");
      Object.defineProperty(this.contents, "closed", {get: () =>          {
          return this.closed;
        }, 
     set: (v) =>          {
          this.closed = v;
        }});
      this.packflag = this.inherit_packflag = 0;
      this._closed = false;
    }
     saveData() {
      let ret={_closed: this._closed};
      return Object.assign(super.saveData(), ret);
    }
     loadData(obj) {
      this.closed = obj._closed;
    }
     clear() {
      this.clear();
      this.add(this.titleframe);
    }
    get  inherit_packflag() {
      if (!this.contents)
        return ;
      return this.contents.inherit_packflag;
    }
    set  inherit_packflag(val) {
      if (!this.contents)
        return ;
      this.contents.inherit_packflag = val;
    }
    get  packflag() {
      if (!this.contents)
        return ;
      return this.contents.packflag;
    }
    set  packflag(val) {
      if (!this.contents)
        return ;
      this.contents.packflag = val;
    }
     init() {
      super.init();
      let con=this.titleframe = this.row();
      this.setCSS();
      let row=con;
      let iconcheck=this.iconcheck;
      this.style["width"] = "100%";
      this.overrideDefault("BoxMargin", 0);
      iconcheck.overrideDefault("BoxMargin", 0);
      iconcheck.noMarginsOrPadding();
      iconcheck.overrideDefault("BoxBG", "rgba(0,0,0,0)");
      iconcheck.overrideDefault("BoxSubBG", "rgba(0,0,0,0)");
      iconcheck.overrideDefault("BoxDepressed", "rgba(0,0,0,0)");
      iconcheck.overrideDefault("BoxBorder", "rgba(0,0,0,0)");
      iconcheck.ctx = this.ctx;
      iconcheck._icon_pressed = ui_base.Icons.UI_EXPAND;
      iconcheck._icon = ui_base.Icons.UI_COLLAPSE;
      iconcheck.drawCheck = false;
      iconcheck.iconsheet = ui_base.IconSheets.SMALL;
      iconcheck.checked = this._closed;
      this.iconcheck.onchange = (e) =>        {
        this.closed = this.iconcheck.checked;
      };
      row._add(iconcheck);
      let onclick=(e) =>        {
        console.log("panel header click");
        iconcheck.checked = !iconcheck.checked;
      };
      let label=this.__label = row.label(this.getAttribute("title"));
      this.__label.font = "TitleText";
      label._updateFont();
      label.noMarginsOrPadding();
      label.addEventListener("mousedown", onclick);
      label.addEventListener("touchdown", onclick);
      let bs=this.getDefault("border-style");
      row.background = this.getDefault("TitleBackground");
      row.style["border-radius"] = this.getDefault("BoxRadius")+"px";
      row.style["border"] = `${this.getDefault("BoxLineWidth")}px ${bs} ${this.getDefault("BoxBorder")}`;
      this.background = this.getDefault("Background");
      row.style["padding-right"] = "20px";
      row.style["padding-left"] = "5px";
      row.style["padding-top"] = this.getDefault("padding-top")+"px";
      row.style["padding-bottom"] = this.getDefault("padding-bottom")+"px";
      this.contents.ctx = this.ctx;
      if (!this._closed) {
          this.add(this.contents);
          this.contents.flushUpdate();
      }
      this.setCSS();
    }
    get  label() {
      return this.__label.text;
    }
    set  label(v) {
      this.__label.text = v;
    }
     setCSS() {
      super.setCSS();
      if (!this.titleframe||!this.__label) {
          return ;
      }
      let bs=this.getDefault("border-style");
      this.titleframe.background = this.getDefault("TitleBackground");
      this.titleframe.style["border-radius"] = this.getDefault("BoxRadius")+"px";
      this.titleframe.style["border"] = `${this.getDefault("BoxLineWidth")}px ${bs} ${this.getDefault("TitleBorder")}`;
      this.style["border"] = `${this.getDefault("BoxLineWidth")}px ${bs} ${this.getDefault("BoxBorder")}`;
      this.titleframe.style["padding-top"] = this.getDefault("padding-top")+"px";
      this.titleframe.style["padding-bottom"] = this.getDefault("padding-bottom")+"px";
      let bg=this.getDefault("Background");
      this.background = bg;
      this.contents.background = bg;
      this.contents.style["background-color"] = bg;
      this.style["background-color"] = bg;
      this.__label._updateFont();
    }
     on_disabled() {
      super.on_disabled();
      this.__label._updateFont();
      this.setCSS();
    }
     on_enabled() {
      super.on_enabled();
      this.__label.setCSS();
      this.__label.style["color"] = this.style["color"];
      this.setCSS();
    }
    static  define() {
      return {tagname: "panelframe-x", 
     style: "panel"}
    }
     update() {
      let key=this.getDefault("background-color")+this.getDefault("TitleBackground");
      key+=this.getDefault("BoxBorder")+this.getDefault("BoxLineWidth");
      key+=this.getDefault("BoxRadius")+this.getDefault("padding-top");
      key+=this.getDefault("padding-bottom")+this.getDefault("TitleBorder");
      key+=this.getDefault("Background")+this.getDefault("border-style");
      if (key!==this._last_key) {
          this._last_key = key;
          this.setCSS();
      }
      super.update();
    }
     _setVisible(state) {
      if (state) {
          this.contents.remove();
      }
      else {
        this.add(this.contents, false);
        this.contents.parentWidget = this;
        this.contents.flushUpdate();
      }
      this.contents.hidden = state;
      if (this.parentWidget) {
          this.parentWidget.flushUpdate();
      }
      else {
        this.flushUpdate();
      }
      return ;
      for (let c of this.shadow.childNodes) {
          if (c!==this.titleframe) {
              c.hidden = state;
          }
      }
    }
     _updateClosed() {
      this._setVisible(this._closed);
      this.iconcheck.checked = this._closed;
    }
    get  closed() {
      return this._closed;
    }
    set  closed(val) {
      let update=!!val!=!!this.closed;
      this._closed = val;
      if (update) {
          this._updateClosed();
      }
    }
  }
  _ESClass.register(PanelFrame);
  _es6_module.add_class(PanelFrame);
  PanelFrame = _es6_module.add_export('PanelFrame', PanelFrame);
  UIBase.register(PanelFrame);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_panel.js');
es6_module_define('ui_richedit', ["../util/simple_events.js", "./ui_textbox.js", "../core/ui.js", "../util/util.js", "../core/ui_base.js"], function _ui_richedit_module(_es6_module) {
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var util=es6_import(_es6_module, '../util/util.js');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var RowFrame=es6_import_item(_es6_module, '../core/ui.js', 'RowFrame');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  let UIBase=ui_base.UIBase, Icons=ui_base.Icons;
  var TextBoxBase=es6_import_item(_es6_module, './ui_textbox.js', 'TextBoxBase');
  var keymap=es6_import_item(_es6_module, '../util/simple_events.js', 'keymap');
  class RichEditor extends TextBoxBase {
     constructor() {
      super();
      this._disabled = false;
      this._value = "";
      this.textOnlyMode = false;
      this.styletag = document.createElement("style");
      this.styletag.textContent = `
      div.rich-text-editor-x {
        width        :   100%;
        height       :   100%;
        min-height   :   150px;
        overflow     :   scroll;
        padding      :   5px;
        white-space  :   pre-wrap;
      }
      
      rich-text-editor-x {
        display        : flex;
        flex-direction : column;
      }
    `;
      this.shadow.appendChild(this.styletag);
      let controls=this.controls = document.createElement("rowframe-x");
      let makeicon=(icon, description, cb) =>        {
        icon = controls.iconbutton(icon, description, cb);
        icon.iconsheet = 1;
        icon.overrideDefault("BoxMargin", 3);
        return icon;
      };
      makeicon(Icons.BOLD, "Bold", () =>        {
        document.execCommand("bold");
      });
      makeicon(Icons.ITALIC, "Italic", () =>        {
        document.execCommand("italic");
      });
      makeicon(Icons.UNDERLINE, "Underline", () =>        {
        document.execCommand("underline");
      });
      makeicon(Icons.STRIKETHRU, "Strikethrough", () =>        {
        document.execCommand("strikeThrough");
      });
      controls.background = this.getDefault("DefaultPanelBG");
      this.shadow.appendChild(controls);
      this.textarea = document.createElement("div");
      this.textarea.contentEditable = true;
      this.textarea.setAttribute("class", "rich-text-editor-x");
      this.textarea.style["font"] = this.getDefault("DefaultText").genCSS();
      this.textarea.style["background-color"] = this.getDefault("background-color");
      this.textarea.setAttribute("white-space", "pre-wrap");
      this.textarea.addEventListener("keydown", (e) =>        {
        if (e.keyCode===keymap["S"]&&e.shiftKey&&(e.ctrlKey||e.commandKey)) {
            this.toggleStrikeThru();
            e.preventDefault();
            e.stopPropagation();
        }
      });
      this.textarea.addEventListener("focus", (e) =>        {
        this._focus = 1;
        this.setCSS();
      });
      this.textarea.addEventListener("blur", (e) =>        {
        this._focus = 0;
        this.setCSS();
      });
      document.execCommand("styleWithCSS", true);
      window.ta = this;
      this.textarea.addEventListener("selectionchange", (e) =>        {
        console.log("sel1");
      });
      document.addEventListener("selectionchange", (e, b) =>        {
        console.log("sel2", document.getSelection().startNode, b);
      });
      this.textarea.addEventListener("input", (e) =>        {
        if (this.disabled) {
            return ;
        }
        console.log("text input", e);
        let text;
        if (this.textOnlyMode) {
            text = this.textarea.innerText;
        }
        else {
          text = this.textarea.innerHTML;
        }
        if (this.textOnlyMode&&text===this._value) {
            console.log("detected formatting change");
            return ;
        }
        let sel=document.getSelection();
        let range=sel.getRangeAt(0);
        let node=sel.anchorNode;
        let off=sel.anchorOffset;
        this._value = text;
        if (this.hasAttribute("datapath")) {
            let path=this.getAttribute("datapath");
            this.setPathValue(this.ctx, path, this.value);
        }
        if (this.onchange) {
            this.onchange(this._value);
        }
        if (this.oninput) {
            this.oninput(this._value);
        }
        this.dispatchEvent(new InputEvent(this));
        this.dispatchEvent(new CustomEvent('change'));
      });
      this.shadow.appendChild(this.textarea);
    }
     formatStart() {

    }
     formatLine(line, text) {
      return line;
    }
     toggleStrikeThru() {
      console.log("strike thru!");
      document.execCommand("strikeThrough");
    }
     formatEnd() {

    }
     init() {
      super.init();
      window.rc = this;
      document.execCommand("defaultParagraphSeparator", false, "div");
      this.setCSS();
    }
    get  disabled() {
      return this._disabled;
    }
    set  disabled(val) {
      let changed=!!this._disabled!=!!val;
      if (changed||1) {
          this._disabled = !!val;
          super.disabled = val;
          this.textarea.disabled = val;
          this.textarea.contentEditable = !val;
          this.setCSS();
      }
    }
    set  value(val) {
      this._value = val;
      if (this.textOnlyMode) {
          let val2="";
          for (let l of val.split("\n")) {
              val2+=l+"<br>";
          }
          val = val2;
      }
      this.textarea.innerHTML = val;
    }
    get  value() {
      return this._value;
    }
     setCSS() {
      super.setCSS();
      this.controls.background = this.getDefault("DefaultPanelBG");
      if (this._focus) {
          this.textarea.style["border"] = `2px dashed ${this.getDefault('FocusOutline')}`;
      }
      else {
        this.textarea.style["border"] = "none";
      }
      if (this.style["font"]) {
          this.textarea.style["font"] = this.style["font"];
      }
      else {
        this.textarea.style["font"] = this.getDefault("DefaultText").genCSS();
      }
      if (this.style["color"]) {
          this.textarea.style["color"] = this.style["color"];
      }
      else {
        this.textarea.style["color"] = this.getDefault("DefaultText").color;
      }
      if (this.disabled) {
          this.textarea.style["background-color"] = this.getDefault("DisabledBG");
      }
      else {
        this.textarea.style["background-color"] = this.getDefault("background-color");
      }
    }
     updateDataPath() {
      if (!this.hasAttribute("datapath")) {
          return ;
      }
      let path=this.getAttribute("datapath");
      let prop=this.getPathMeta(this.ctx, path);
      if (prop===undefined) {
          console.warn("invalid datapath "+path);
          this.disabled = true;
          return ;
      }
      this.disabled = false;
      let value=this.getPathValue(this.ctx, path);
      if (value!==this._value) {
          console.log("text change");
          this.value = value;
      }
    }
     update() {
      super.update();
      this.updateDataPath();
    }
    static  define() {
      return {tagname: "rich-text-editor-x", 
     style: "richtext"}
    }
  }
  _ESClass.register(RichEditor);
  _es6_module.add_class(RichEditor);
  RichEditor = _es6_module.add_export('RichEditor', RichEditor);
  UIBase.register(RichEditor);
  class RichViewer extends UIBase {
     constructor() {
      super();
      this.contents = document.createElement("div");
      this.contents.style["padding"] = "10px";
      this.contents.style["margin"] = "10px";
      this.contents.style["overflow"] = "scroll";
      this.shadow.appendChild(this.contents);
      this._value = "";
    }
     hideScrollBars() {
      this.contents.style["overflow"] = "hidden";
    }
     showScrollBars() {
      this.contents.style["overflow"] = "scroll";
    }
     textTransform(text) {
      return text;
    }
    set  value(val) {
      this._value = val;
      this.contents.innerHTML = this.textTransform(val);
    }
    get  value() {
      return this._value;
    }
     updateDataPath() {
      if (!this.hasAttribute("datapath")) {
          return ;
      }
      let path=this.getAttribute("datapath");
      let prop=this.getPathMeta(this.ctx, path);
      if (prop===undefined) {
          console.warn("invalid datapath "+path);
          this.disabled = true;
          return ;
      }
      this.disabled = false;
      let value=this.getPathValue(this.ctx, path);
      if (value!==this.value) {
          this.value = value;
      }
    }
     update() {
      super.update();
      this.updateDataPath();
    }
    static  define() {
      return {tagname: "html-viewer-x", 
     style: "html_viewer"}
    }
  }
  _ESClass.register(RichViewer);
  _es6_module.add_class(RichViewer);
  RichViewer = _es6_module.add_export('RichViewer', RichViewer);
  UIBase.register(RichViewer);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_richedit.js');
es6_module_define('ui_table', ["../toolsys/toolprop.js", "./ui_curvewidget.js", "../util/util.js", "../core/ui.js", "../core/ui_base.js", "./ui_widgets.js", "../util/vectormath.js"], function _ui_table_module(_es6_module) {
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var _ui=undefined;
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_curvewidget=es6_import(_es6_module, './ui_curvewidget.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var ui_widgets=es6_import(_es6_module, './ui_widgets.js');
  var toolprop=es6_import(_es6_module, '../toolsys/toolprop.js');
  let PropFlags=toolprop.PropFlags;
  let PropSubTypes=toolprop.PropSubTypes;
  let EnumProperty=toolprop.EnumProperty;
  let Vector2=vectormath.Vector2, UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, PropTypes=toolprop.PropTypes;
  const DataPathError=ui_base.DataPathError;
  _es6_module.add_export('DataPathError', DataPathError);
  var list=function list(iter) {
    let ret=[];
    for (let item of iter) {
        ret.push(item);
    }
    return ret;
  }
  class TableRow extends Container {
     constructor() {
      super();
      this.dom.remove();
      this.dom = document.createElement("tr");
      this.dom.setAttribute("class", "containerx");
    }
    static  define() {
      return {tagname: "tablerow-x"}
    }
     _add(child) {
      child.ctx = this.ctx;
      child.parentWidget = this;
      let td=document.createElement("td");
      td.appendChild(child);
      this.dom.appendChild(td);
      child.onadd();
    }
  }
  _ESClass.register(TableRow);
  _es6_module.add_class(TableRow);
  TableRow = _es6_module.add_export('TableRow', TableRow);
  
  UIBase.register(TableRow);
  class TableFrame extends Container {
     constructor() {
      super();
      this.dom = document.createElement("table");
      this.shadow.appendChild(this.dom);
      this.dom.setAttribute("class", "containerx");
    }
     update() {
      this.style["display"] = "inline-block";
      super.update();
    }
     _add(child) {
      child.ctx = this.ctx;
      child.parentWidget = this;
      this.dom.appendChild(child);
      child.onadd();
    }
     row() {
      let tr=document.createElement("tr");
      let cls="table-tr";
      tr.setAttribute("class", cls);
      this.dom.appendChild(tr);
      let this2=this;
      function maketd() {
        let td=document.createElement("td");
        tr.appendChild(td);
        td.style["margin"] = tr.style["margin"];
        td.style["padding"] = tr.style["padding"];
        let container=document.createElement("rowframe-x");
        container.ctx = this2.ctx;
        container.setAttribute("class", cls);
        td.setAttribute("class", cls);
        td.appendChild(container);
        return container;
      }
      let ret={_tr: tr, 
     style: tr.style, 
     focus: function (args) {
          tr.focus(args);
        }, 
     blur: function (args) {
          tr.blur(args);
        }, 
     remove: () =>          {
          tr.remove();
        }, 
     addEventListener: function (type, cb, arg) {
          tr.addEventListener(type, cb, arg);
        }, 
     removeEventListener: function (type, cb, arg) {
          tr.removeEventListener(type, cb, arg);
        }, 
     setAttribute: function (attr, val) {
          if (attr=="class") {
              cls = val;
          }
          tr.setAttribute(attr, val);
        }, 
     scrollTo: function () {
          return this._tr.scrollTo(...arguments);
        }, 
     scrollIntoView: function () {
          return this._tr.scrollIntoView(...arguments);
        }, 
     clear: function () {
          for (let node of list(tr.childNodes)) {
              tr.removeChild(node);
          }
        }};
      function makefunc(f) {
        ret[f] = function () {
          let container=maketd();
          container.background = tr.style["background-color"];
          return container[f].apply(container, arguments);
        }
      }
      let _bg="";
      Object.defineProperty(ret, "tabIndex", {set: function (f) {
          tr.tabIndex = f;
        }, 
     get: function (f) {
          return tr.tabIndex;
        }});
      Object.defineProperty(ret, "background", {set: function (bg) {
          _bg = bg;
          tr.style["background-color"] = bg;
          for (let node of tr.childNodes) {
              if (node.childNodes.length>0) {
                  node.childNodes[0].background = bg;
                  node.style["background-color"] = bg;
              }
          }
        }, 
     get: function () {
          return _bg;
        }});
      ret.cell = () =>        {
        let container=maketd();
        container.background = tr.style["background-color"];
        return container;
      };
      makefunc("label");
      makefunc("tool");
      makefunc("prop");
      makefunc("pathlabel");
      makefunc("button");
      makefunc("iconbutton");
      makefunc("textbox");
      makefunc("col");
      makefunc("row");
      makefunc("table");
      makefunc("listenum");
      makefunc("check");
      return ret;
    }
     update() {
      super.update();
    }
     clear() {
      super.clear();
      for (let child of list(this.dom.childNodes)) {
          child.remove();
      }
    }
    static  define() {
      return {tagname: "tableframe-x"}
    }
  }
  _ESClass.register(TableFrame);
  _es6_module.add_class(TableFrame);
  TableFrame = _es6_module.add_export('TableFrame', TableFrame);
  UIBase.register(TableFrame);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_table.js');
es6_module_define('ui_tabs', ["../core/ui_base.js", "../util/events.js", "../util/vectormath.js", "../core/ui.js", "../util/util.js"], function _ui_tabs_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../util/events.js');
  var ui=es6_import(_es6_module, '../core/ui.js');
  let UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, IconSheets=ui_base.IconSheets, iconmanager=ui_base.iconmanager;
  let tab_idgen=1;
  tab_idgen = _es6_module.add_export('tab_idgen', tab_idgen);
  let debug=false;
  let Vector2=vectormath.Vector2;
  function getpx(css) {
    return parseFloat(css.trim().replace("px", ""));
  }
  let FAKE_TAB_ID=Symbol("fake_tab_id");
  class TabItem  {
     constructor(name, id, tooltip="", tbar) {
      this.name = name;
      this.icon = undefined;
      this.id = id;
      this.tooltip = tooltip;
      this.movable = true;
      this.tbar = tbar;
      this.dom = undefined;
      this.extra = undefined;
      this.extraSize = undefined;
      this.size = new Vector2();
      this.pos = new Vector2();
      this.abssize = new Vector2();
      this.abspos = new Vector2();
    }
     getClientRects() {
      let r=this.tbar.getClientRects()[0];
      let s=this.abssize, p=this.abspos;
      s.load(this.size);
      p.load(this.pos);
      if (r) {
          p[0]+=r.x;
          p[1]+=r.y;
      }
      return [{x: p[0], 
     y: p[1], 
     width: s[0], 
     height: s[1], 
     left: p[0], 
     top: p[1], 
     right: p[0]+s[0], 
     bottom: p[1]+s[1]}];
    }
  }
  _ESClass.register(TabItem);
  _es6_module.add_class(TabItem);
  TabItem = _es6_module.add_export('TabItem', TabItem);
  class ModalTabMove extends events.EventHandler {
     constructor(tab, tbar, dom) {
      super();
      this.dom = dom;
      this.tab = tab;
      this.tbar = tbar;
      this.first = true;
      this.droptarget = undefined;
      this.start_mpos = new Vector2();
      this.mpos = undefined;
      this.dragtab = undefined;
      this.dragstate = false;
    }
     finish() {
      if (debug)
        if (debug)
        console.log("finish");
      this.tbar.tool = undefined;
      this.popModal(this.dom);
      this.tbar.update(true);
    }
     popModal() {
      if (this.dragcanvas!==undefined) {
          this.dragcanvas.remove();
      }
      return super.popModal(...arguments);
    }
     on_mousedown(e) {
      if (debug)
        console.log("yay");
      this.finish();
    }
     on_touchstart(e) {
      this.finish();
    }
     on_touchend(e) {
      this.finish();
    }
     on_mouseup(e) {
      this.finish();
    }
     on_mousemove(e) {
      return this._on_move(e, e.x, e.y);
    }
     on_touchmove(e) {
      if (e.touches.length==0)
        return ;
      let x=e.touches[0].pageX;
      let y=e.touches[0].pageY;
      return this._on_move(e, x, y);
    }
     _dragstate(e, x, y) {
      this.dragcanvas.style["left"] = x+"px";
      this.dragcanvas.style["top"] = y+"px";
      let ctx=this.tbar.ctx;
      let screen=ctx.screen;
      let elem=screen.pickElement(x, y);
      let e2=new DragEvent("dragenter", this.dragevent);
      if (elem!==this.droptarget) {
          let e2=new DragEvent("dragexit", this.dragevent);
          if (this.droptarget) {
              this.droptarget.dispatchEvent(e2);
          }
          e2 = new DragEvent("dragover", this.dragevent);
          this.droptarget = elem;
          if (elem) {
              elem.dispatchEvent(e2);
          }
      }
    }
     _on_move(e, x, y) {
      let r=this.tbar.getClientRects()[0];
      let dpi=UIBase.getDPI();
      if (r===undefined) {
          this.finish();
          return ;
      }
      if (this.dragstate) {
          this._dragstate(e, x, y);
          return ;
      }
      x-=r.x;
      y-=r.y;
      let dx, dy;
      x*=dpi;
      y*=dpi;
      if (this.first) {
          this.first = false;
          this.start_mpos[0] = x;
          this.start_mpos[1] = y;
      }
      if (this.mpos===undefined) {
          this.mpos = [0, 0];
          dx = dy = 0;
      }
      else {
        dx = x-this.mpos[0];
        dy = y-this.mpos[1];
      }
      if (debug)
        console.log(x, y, dx, dy);
      let tab=this.tab, tbar=this.tbar;
      let axis=tbar.horiz ? 0 : 1;
      let distx, disty;
      if (tbar.horiz) {
          tab.pos[0]+=dx;
          disty = Math.abs(y-this.start_mpos[1]);
      }
      else {
        tab.pos[1]+=dy;
        disty = Math.abs(x-this.start_mpos[0]);
      }
      let limit=50;
      let csize=tbar.horiz ? this.tbar.canvas.width : this.tbar.canvas.height;
      let dragok=tab.pos[axis]+tab.size[axis]<-limit||tab.pos[axis]>=csize+limit;
      dragok = dragok||disty>limit*1.5;
      dragok = dragok&&(this.tbar.draggable||this.tbar.getAttribute("draggable"));
      console.log(dragok, disty, this.tbar.draggable);
      if (dragok) {
          this.dragstate = true;
          this.dragevent = new DragEvent("dragstart", {dataTransfer: new DataTransfer()});
          this.dragtab = tab;
          let g=this.tbar.g;
          this.dragimg = g.getImageData(~~tab.pos[0], ~~tab.pos[1], ~~tab.size[0], ~~tab.size[1]);
          this.dragcanvas = document.createElement("canvas");
          let g2=this.drag_g = this.dragcanvas.getContext("2d");
          this.dragcanvas.visibleToPick = false;
          this.dragcanvas.width = ~~tab.size[0];
          this.dragcanvas.height = ~~tab.size[1];
          this.dragcanvas.style["width"] = (tab.size[0]/dpi)+"px";
          this.dragcanvas.style["height"] = (tab.size[1]/dpi)+"px";
          this.dragcanvas.style["position"] = "absolute";
          this.dragcanvas.style["left"] = e.x+"px";
          this.dragcanvas.style["top"] = e.y+"px";
          this.dragcanvas.style["z-index"] = "500";
          document.body.appendChild(this.dragcanvas);
          g2.putImageData(this.dragimg, 0, 0);
          this.tbar.dispatchEvent(this.dragevent);
          return ;
      }
      let ti=tbar.tabs.indexOf(tab);
      let next=ti<tbar.tabs.length-1 ? tbar.tabs[ti+1] : undefined;
      let prev=ti>0 ? tbar.tabs[ti-1] : undefined;
      if (next!==undefined&&tab.pos[axis]>next.pos[axis]) {
          tbar.swapTabs(tab, next);
      }
      else 
        if (prev!==undefined&&tab.pos[axis]<prev.pos[axis]+prev.size[axis]*0.5) {
          tbar.swapTabs(tab, prev);
      }
      tbar.update(true);
      this.mpos[0] = x;
      this.mpos[1] = y;
    }
     on_keydown(e) {
      if (debug)
        console.log(e.keyCode);
      switch (e.keyCode) {
        case 27:
        case 32:
        case 13:
        case 9:
          this.finish();
          break;
      }
    }
  }
  _ESClass.register(ModalTabMove);
  _es6_module.add_class(ModalTabMove);
  ModalTabMove = _es6_module.add_export('ModalTabMove', ModalTabMove);
  class TabBar extends UIBase {
     constructor() {
      super();
      let style=document.createElement("style");
      let canvas=document.createElement("canvas");
      this.iconsheet = 0;
      this.tabs = [];
      this.tabs.active = undefined;
      this.tabs.highlight = undefined;
      this._last_bgcolor = undefined;
      canvas.style["width"] = "145px";
      canvas.style["height"] = "45px";
      this.r = 8;
      this.canvas = canvas;
      this.g = canvas.getContext("2d");
      style.textContent = `
    `;
      this.shadow.appendChild(style);
      this.shadow.appendChild(canvas);
      this._last_dpi = undefined;
      this._last_pos = undefined;
      this.horiz = true;
      this.onchange = undefined;
      let mx, my;
      let do_element=(e) =>        {
        for (let tab of this.tabs) {
            let ok;
            if (this.horiz) {
                ok = mx>=tab.pos[0]&&mx<=tab.pos[0]+tab.size[0];
            }
            else {
              ok = my>=tab.pos[1]&&my<=tab.pos[1]+tab.size[1];
            }
            if (ok&&this.tabs.highlight!==tab) {
                this.tabs.highlight = tab;
                this.update(true);
            }
        }
      };
      let do_mouse=(e) =>        {
        let r=this.canvas.getClientRects()[0];
        mx = e.x-r.x;
        my = e.y-r.y;
        let dpi=this.getDPI();
        mx*=dpi;
        my*=dpi;
        do_element(e);
      };
      let do_touch=(e) =>        {
        let r=this.canvas.getClientRects()[0];
        if (debug)
          console.log(e.touches);
        mx = e.touches[0].pageX-r.x;
        my = e.touches[0].pageY-r.y;
        let dpi=this.getDPI();
        mx*=dpi;
        my*=dpi;
        do_element(e);
      };
      this.canvas.addEventListener("mousemove", (e) =>        {
        if (debug)
          console.log("yay");
        let r=this.canvas.getClientRects()[0];
        do_mouse(e);
        e.preventDefault();
        e.stopPropagation();
      }, false);
      this.canvas.addEventListener("touchstart", (e) =>        {
        if (e.touches.length==0) {
            return ;
        }
        do_touch(e);
        let ht=this.tabs.highlight;
        if (ht!==undefined&&this.tool===undefined) {
            this.setActive(ht);
            let edom=this.getScreen();
            let tool=new ModalTabMove(ht, this, edom);
            this.tool = tool;
            tool.pushModal(edom, false);
        }
        e.preventDefault();
        e.stopPropagation();
      }, false);
      this.canvas.addEventListener("mousedown", (e) =>        {
        do_mouse(e);
        if (debug)
          console.log("mdown");
        if (e.button!==0) {
            return ;
        }
        let ht=this.tabs.highlight;
        if (ht!==undefined&&this.tool===undefined) {
            this.setActive(ht);
            if (this.ctx===undefined) {
                return ;
            }
            let edom=this.getScreen();
            let tool=new ModalTabMove(ht, this, edom);
            this.tool = tool;
            tool.pushModal(edom, false);
        }
        e.preventDefault();
        e.stopPropagation();
      }, false);
    }
     getTab(name_or_id) {
      for (let tab of this.tabs) {
          if (tab.id===name_or_id||tab.name===name_or_id)
            return tab;
      }
      return undefined;
    }
     clear() {
      for (let t of this.tabs) {
          if (t.dom) {
              t.dom.remove();
              t.dom = undefined;
          }
      }
      this.tabs = [];
      this.setCSS();
      this._redraw();
    }
     saveData() {
      let taborder=[];
      for (let tab of this.tabs) {
          taborder.push(tab.name);
      }
      let act=this.tabs.active!==undefined ? this.tabs.active.name : "null";
      return {taborder: taborder, 
     active: act}
    }
     loadData(obj) {
      if (!obj.taborder) {
          return ;
      }
      let tabs=this.tabs;
      let active=undefined;
      let ntabs=[];
      ntabs.active = undefined;
      ntabs.highlight = undefined;
      for (let tname of obj.taborder) {
          let tab=this.getTab(tname);
          if (tab===undefined) {
              continue;
          }
          if (tab.name===obj.active) {
              active = tab;
          }
          ntabs.push(tab);
      }
      for (let tab of tabs) {
          if (ntabs.indexOf(tab)<0) {
              ntabs.push(tab);
          }
      }
      this.tabs = ntabs;
      if (active!==undefined) {
          this.setActive(active);
      }
      else {
        this.setActive(this.tabs[0]);
      }
      this.update(true);
      return this;
    }
    static  setDefault(e) {
      e.setAttribute("bar_pos", "top");
      e.updatePos(true);
      return e;
    }
     swapTabs(a, b) {
      let tabs=this.tabs;
      let ai=tabs.indexOf(a);
      let bi=tabs.indexOf(b);
      tabs[ai] = b;
      tabs[bi] = a;
      this.update(true);
    }
     addIconTab(icon, id, tooltip, movable=true) {
      let tab=this.addTab("", id, tooltip, movable);
      tab.icon = icon;
      return tab;
    }
     addTab(name, id, tooltip="", movable) {
      let tab=new TabItem(name, id, tooltip, this);
      tab.movable = movable;
      this.tabs.push(tab);
      this.update(true);
      if (this.tabs.length==1) {
          this.setActive(this.tabs[0]);
      }
      return tab;
    }
     updatePos(force_update=false) {
      let pos=this.getAttribute("bar_pos");
      if (pos!=this._last_pos||force_update) {
          this._last_pos = pos;
          this.horiz = pos=="top"||pos=="bottom";
          if (debug)
            console.log("tab bar position update", this.horiz);
          if (this.horiz) {
              this.style["width"] = "100%";
              delete this.style["height"];
          }
          else {
            this.style["height"] = "100%";
            delete this.style["width"];
          }
          this._redraw();
      }
    }
     updateDPI(force_update=false) {
      let dpi=this.getDPI();
      if (dpi!==this._last_dpi) {
          if (debug)
            console.log("DPI update!");
          this._last_dpi = dpi;
          this.updateCanvas(true);
      }
    }
     updateCanvas(force_update=false) {
      let canvas=this.canvas;
      let dpi=this.getDPI();
      let rwidth=getpx(this.canvas.style["width"]);
      let rheight=getpx(this.canvas.style["height"]);
      let width=Math.ceil(rwidth*dpi);
      let height=Math.ceil(rheight*dpi);
      let update=force_update;
      if (this.horiz) {
          update = update||canvas.width!=width;
      }
      else {
        update = update||canvas.height!=height;
      }
      if (update) {
          canvas.width = width;
          canvas.height = height;
          this._redraw();
      }
    }
     _layout() {
      if ((!this.ctx||!this.ctx.screen)&&!this.isDead()) {
          this.doOnce(this._layout);
      }
      let g=this.g;
      if (debug)
        console.log("tab layout");
      let dpi=this.getDPI();
      let tsize=this.getDefault("TabText").size*dpi;
      g.font = ui_base.getFont(this, tsize, "TabText");
      let axis=this.horiz ? 0 : 1;
      let pad=4*dpi+Math.ceil(tsize*0.25);
      let x=pad;
      let y=0;
      let h=tsize+Math.ceil(tsize*0.5);
      let iconsize=iconmanager.getTileSize(this.iconsheet);
      let have_icons=false;
      for (let tab of this.tabs) {
          if (tab.icon!==undefined) {
              have_icons = true;
              h = Math.max(h, iconsize+4);
              break;
          }
      }
      let r1=this.parentWidget ? this.parentWidget.getClientRects()[0] : undefined;
      let r2=this.canvas.getClientRects()[0];
      let rx=0, ry=0;
      if (r1&&r2) {
          rx = r2.x;
          ry = r2.y;
      }
      let ti=-1;
      let makeTabWatcher=(tab) =>        {
        if (tab.watcher) {
            clearInterval(tab.watcher.timer);
        }
        let watcher=() =>          {
          let dead=this.tabs.indexOf(tab)<0;
          dead = dead||this.isDead();
          if (dead) {
              if (tab.dom)
                tab.dom.remove();
              tab.dom = undefined;
              if (tab.watcher.timer)
                clearInterval(tab.watcher.timer);
          }
        }
        tab.watcher = watcher;
        tab.watcher.timer = window.setInterval(watcher, 750);
        return tab.watcher.timer;
      };
      let haveTabDom=false;
      for (let tab of this.tabs) {
          if (tab.extra) {
              haveTabDom = true;
          }
      }
      if (haveTabDom&&this.ctx&&this.ctx.screen&&!this._size_cb) {
          this._size_cb = () =>            {
            if (this.isDead()) {
                this.ctx.screen.removeEventListener("resize", this._size_cb);
                this._size_cb = undefined;
                return ;
            }
            if (!this.ctx)
              return ;
            this._layout();
            this._redraw();
          };
          this.ctx.screen.addEventListener("resize", this._size_cb);
      }
      for (let tab of this.tabs) {
          ti++;
          if (tab.extra&&!tab.dom) {
              tab.dom = document.createElement("div");
              tab.dom.style["margin"] = tab.dom.style["padding"] = "0px";
              let z=this.calcZ();
              tab.dom.style["z-index"] = z+1+ti;
              document.body.appendChild(tab.dom);
              tab.dom.style["position"] = "fixed";
              tab.dom.style["display"] = "flex";
              tab.dom.style["flex-direction"] = this.horiz ? "row" : "column";
              tab.dom.style["pointer-events"] = "none";
              if (!this.horiz) {
                  tab.dom.style["width"] = (tab.size[0]/dpi)+"px";
                  tab.dom.style["height"] = (tab.size[1]/dpi)+"px";
                  tab.dom.style["left"] = (rx+tab.pos[0]/dpi)+"px";
                  tab.dom.style["top"] = (ry+tab.pos[1]/dpi)+"px";
              }
              else {
                tab.dom.style["width"] = (tab.size[0]/dpi)+"px";
                tab.dom.style["height"] = (tab.size[1]/dpi)+"px";
                tab.dom.style["left"] = (rx+tab.pos[0]/dpi)+"px";
                tab.dom.style["top"] = (ry+tab.pos[1]/dpi)+"px";
              }
              tab.dom.style["font"] = this.getDefault("TabText").genCSS();
              tab.dom.style["color"] = this.getDefault("TabText").color;
              tab.dom.appendChild(tab.extra);
              makeTabWatcher(tab);
          }
          let w=g.measureText(tab.name).width;
          if (tab.extra) {
              w+=tab.extraSize||tab.extra.getClientRects()[0].width;
          }
          if (tab.icon!==undefined) {
              w+=iconsize;
          }
          let bad=this.tool!==undefined&&tab===this.tabs.active;
          if (!bad) {
              tab.pos[axis] = x;
              tab.pos[axis^1] = y;
          }
          tab.size[axis] = w+pad*2;
          tab.size[axis^1] = h;
          x+=w+pad*2;
      }
      if (this.horiz) {
          this.canvas.style["width"] = Math.ceil(x/dpi+pad/dpi)+"px";
          this.canvas.style["height"] = Math.ceil(h/dpi)+"px";
      }
      else {
        this.canvas.style["height"] = Math.ceil(x/dpi+pad/dpi)+"px";
        this.canvas.style["width"] = Math.ceil(h/dpi)+"px";
      }
    }
     setActive(tab) {
      let update=tab!==this.tabs.active;
      this.tabs.active = tab;
      if (update) {
          if (this.onchange)
            this.onchange(tab);
          this.update(true);
      }
    }
     _redraw() {
      let g=this.g;
      let bgcolor=this.getDefault("DefaultPanelBG");
      let inactive=this.getDefault("TabInactive");
      if (debug)
        console.log("tab draw");
      g.clearRect(0, 0, this.canvas.width, this.canvas.height);
      g.beginPath();
      g.rect(0, 0, this.canvas.width, this.canvas.height);
      g.fillStyle = inactive;
      g.fill();
      let dpi=this.getDPI();
      let font=this.getDefault("TabText");
      let tsize=font.size;
      let iconsize=iconmanager.getTileSize(this.iconsheet);
      tsize*=dpi;
      g.font = font.genCSS(tsize);
      g.lineWidth = 2;
      g.strokeStyle = this.getDefault("TabStrokeStyle1");
      let r=this.r*dpi;
      this._layout();
      let tab;
      let ti=-1;
      for (tab of this.tabs) {
          ti++;
          if (tab===this.tabs.active)
            continue;
          let x=tab.pos[0], y=tab.pos[1];
          let w=tab.size[0], h=tab.size[1];
          let tw=ui_base.measureText(this, tab.name, this.canvas, g, tsize).width;
          let x2=x+(tab.size[this.horiz^1]-tw)*0.5;
          let y2=y+tsize*1.0;
          if (tab===this.tabs.highlight) {
              let p=2;
              g.beginPath();
              g.rect(x+p, y+p, w-p*2, h-p*2);
              g.fillStyle = this.getDefault("TabHighlight");
              g.fill();
          }
          g.fillStyle = this.getDefault("TabText").color;
          if (!this.horiz) {
              let x3=0, y3=y2;
              g.save();
              g.translate(x3, y3);
              g.rotate(Math.PI/2);
              g.translate(x3-tsize, -y3-tsize*0.5);
          }
          if (tab.icon!==undefined) {
              iconmanager.canvasDraw(this, this.canvas, g, tab.icon, x, y, this.iconsheet);
              x2+=iconsize+4;
          }
          g.fillText(tab.name, x2, y2);
          if (!this.horiz) {
              g.restore();
          }
          let prev=this.tabs[Math.max(ti-1+this.tabs.length, 0)];
          let next=this.tabs[Math.min(ti+1, this.tabs.length-1)];
          if (tab!==this.tabs[this.tabs.length-1]&&prev!==this.tabs.active&&next!==this.tabs.active) {
              g.beginPath();
              if (this.horiz) {
                  g.moveTo(x+w, h-5);
                  g.lineTo(x+w, 5);
              }
              else {
                g.moveTo(w-5, y+h);
                g.lineTo(5, y+h);
              }
              g.strokeStyle = this.getDefault("TabStrokeStyle1");
              g.stroke();
          }
      }
      let th=tsize;
      tab = this.tabs.active;
      if (tab) {
          let x=tab.pos[0], y=tab.pos[1];
          let w=tab.size[0], h=tab.size[1];
          let tw=ui_base.measureText(this, tab.name, this.canvas, g, tsize).width;
          if (this.horiz) {
              h+=2;
          }
          else {
            w+=2;
          }
          let x2=x+(tab.size[this.horiz^1]-tw)*0.5;
          let y2=y+tsize;
          g.beginPath();
          g.rect(x, y, w, h);
          g.fillStyle = "black";
          if (tab===this.tabs.active) {
              g.beginPath();
              let ypad=2;
              g.strokeStyle = this.getDefault("TabStrokeStyle2");
              g.fillStyle = bgcolor;
              let r2=r*1.5;
              if (this.horiz) {
                  g.moveTo(x-r, h);
                  g.quadraticCurveTo(x, h, x, h-r);
                  g.lineTo(x, r2);
                  g.quadraticCurveTo(x, ypad, x+r2, ypad);
                  g.lineTo(x+w-r2, ypad);
                  g.quadraticCurveTo(x+w, 0, x+w, r2);
                  g.lineTo(x+w, h-r2);
                  g.quadraticCurveTo(x+w, h, x+w+r, h);
                  g.stroke();
                  g.closePath();
              }
              else {
                g.moveTo(w, y-r);
                g.quadraticCurveTo(w, y, w-r, y);
                g.lineTo(r2, y);
                g.quadraticCurveTo(ypad, y, ypad, y+r2);
                g.lineTo(ypad, y+h-r2);
                g.quadraticCurveTo(0, y+h, r2, y+h);
                g.lineTo(w-r2, y+h);
                g.quadraticCurveTo(w, y+h, w, y+h+r);
                g.stroke();
                g.closePath();
              }
              let cw=this.horiz ? this.canvas.width : this.canvas.height;
              let worig=g.lineWidth;
              g.lineWidth*=0.5;
              g.fill();
              g.lineWidth = worig;
              if (!this.horiz) {
                  let x3=0, y3=y2;
                  g.save();
                  g.translate(x3, y3);
                  g.rotate(Math.PI/2);
                  g.translate(-x3-tsize, -y3-tsize*0.5);
              }
              g.fillStyle = this.getDefault("TabText").color;
              g.fillText(tab.name, x2, y2);
              if (!this.horiz) {
                  g.restore();
              }
              if (!this.horiz) {
              }
          }
      }
    }
     removeTab(tab) {
      this.tabs.remove(tab);
      if (tab===this.tabs.active) {
          this.tabs.active = this.tabs[0];
      }
      this._layout();
      this._redraw();
      this.setCSS();
    }
     updateStyle() {
      if (this._last_bgcolor!=this.getDefault("DefaultPanelBG")) {
          this._last_bgcolor = this.getDefault("DefaultPanelBG");
          this._redraw();
      }
    }
     update(force_update=false) {
      let rect=this.getClientRects()[0];
      if (rect) {
          let key=Math.floor(rect.x*4.0)+":"+Math.floor(rect.y*4.0);
          if (key!==this._last_p_key) {
              this._last_p_key = key;
              this._layout();
          }
      }
      super.update();
      this.updateStyle();
      this.updatePos(force_update);
      this.updateDPI(force_update);
      this.updateCanvas(force_update);
    }
    static  define() {
      return {tagname: "tabbar-x", 
     style: "tabs"}
    }
  }
  _ESClass.register(TabBar);
  _es6_module.add_class(TabBar);
  TabBar = _es6_module.add_export('TabBar', TabBar);
  UIBase.register(TabBar);
  class TabContainer extends UIBase {
     constructor() {
      super();
      this.inherit_packflag = 0;
      this.packflag = 0;
      this.tbar = document.createElement("tabbar-x");
      this.tbar.parentWidget = this;
      this.tbar.setAttribute("class", "_tbar_"+this._id);
      this.tbar.constructor.setDefault(this.tbar);
      this._remakeStyle();
      this.tabs = {};
      this._last_horiz = undefined;
      this._last_bar_pos = undefined;
      this._tab = undefined;
      let div=document.createElement("div");
      div.setAttribute("class", `_tab_${this._id}`);
      div.appendChild(this.tbar);
      this.shadow.appendChild(div);
      this.tbar.parentWidget = this;
      this.tbar.onchange = (tab) =>        {
        if (this._tab) {
            HTMLElement.prototype.remove.call(this._tab);
        }
        this._tab = this.tabs[tab.id];
        this._tab.parentWidget = this;
        this._tab.update();
        let div=document.createElement("div");
        this.tbar.setCSS.once(() =>          {
          return div.style["background-color"] = this.getDefault("DefaultPanelBG");
        }, div);
        div.setAttribute("class", `_tab_${this._id}`);
        div.appendChild(this._tab);
        this.shadow.appendChild(div);
        if (this.onchange) {
            this.onchange(tab);
        }
      };
    }
     enableDrag() {
      this.tbar.draggable = this.draggable = true;
      this.tbar.addEventListener("dragstart", (e) =>        {
        this.dispatchEvent(new DragEvent("dragstart", e));
      });
      this.tbar.addEventListener("dragover", (e) =>        {
        this.dispatchEvent(new DragEvent("dragover", e));
      });
      this.tbar.addEventListener("dragexit", (e) =>        {
        this.dispatchEvent(new DragEvent("dragexit", e));
      });
    }
     clear() {
      this.tbar.clear();
      if (this._tab!==undefined) {
          HTMLElement.prototype.remove.call(this._tab);
          this._tab = undefined;
      }
      this.tabs = {};
    }
     init() {
      super.init();
      this.background = this.getDefault("DefaultPanelBG");
    }
     setCSS() {
      super.setCSS();
      this.background = this.getDefault("DefaultPanelBG");
      this._remakeStyle();
    }
    static  setDefault(e) {
      e.setAttribute("bar_pos", "top");
      return e;
    }
     _remakeStyle() {
      let horiz=this.tbar.horiz;
      let display="flex";
      let flexDir=!horiz ? "row" : "column";
      let bgcolor=this.__background;
      let style=document.createElement("style");
      style.textContent = `
      ._tab_${this._id} {
        display : ${display};
        flex-direction : ${flexDir};
        margin : 0px;
        padding : 0px;
        align-self : flex-start;
        ${!horiz ? "vertical-align : top;" : ""}
      }
      
      ._tbar_${this._id} {
        list-style-type : none;
        align-self : flex-start;
        background-color : ${bgcolor};
        flex-direction : ${flexDir};
        ${!horiz ? "vertical-align : top;" : ""}
      }
    `;
      if (this._style)
        this._style.remove();
      this._style = style;
      this.shadow.prepend(style);
    }
     icontab(icon, id, tooltip) {
      let t=this.tab("", id, tooltip);
      t._tab.icon = icon;
      return t;
    }
     removeTab(tab) {
      let tab2=tab._tab;
      this.tbar.removeTab(tab2);
      tab.remove();
    }
     tab(name, id=undefined, tooltip=undefined, movable=true) {
      if (id===undefined) {
          id = tab_idgen++;
      }
      let col=document.createElement("colframe-x");
      this.tabs[id] = col;
      col.ctx = this.ctx;
      col._tab = this.tbar.addTab(name, id, tooltip, movable);
      col.inherit_packflag|=this.inherit_packflag;
      col.packflag|=this.packflag;
      col.parentWidget = this;
      col.setCSS();
      if (this._tab===undefined) {
          this.setActive(col);
      }
      return col;
    }
     setActive(tab) {
      if (typeof tab==="string") {
          tab = this.getTab(tab);
      }
      if (tab._tab!==this.tbar.tabs.active) {
          this.tbar.setActive(tab._tab);
      }
    }
     getTabCount() {
      return this.tbar.tabs.length;
    }
     moveTab(tab, i) {
      tab = tab._tab;
      let tab2=this.tbar.tabs[i];
      if (tab!==tab2) {
          this.tbar.swapTabs(tab, tab2);
      }
      this.tbar.setCSS();
      this.tbar._layout();
      this.tbar._redraw();
    }
     getTab(name_or_id) {
      if (name_or_id in this.tabs) {
          return this.tabs[name_or_id];
      }
      for (let k in this.tabs) {
          let t=this.tabs[k];
          if (t.name===name_or_id) {
              return t;
          }
      }
    }
     updateBarPos() {
      let barpos=this.getAttribute("bar_pos");
      if (barpos!==this._last_bar_pos) {
          this.horiz = barpos=="top"||barpos=="bottom";
          this._last_bar_pos = barpos;
          this.tbar.setAttribute("bar_pos", barpos);
          this.tbar.update(true);
          this.update();
      }
    }
     updateHoriz() {
      let horiz=this.tbar.horiz;
      if (this._last_horiz!==horiz) {
          this._last_horiz = horiz;
          this._remakeStyle();
      }
    }
     update() {
      super.update();
      if (this._tab!==undefined) {
          this._tab.update();
      }
      this.style["display"] = "flex";
      this.style["flex-direction"] = !this.horiz ? "row" : "column";
      this.updateHoriz();
      this.updateBarPos();
      this.tbar.update();
    }
    static  define() {
      return {tagname: "tabcontainer-x", 
     style: "tabs"}
    }
  }
  _ESClass.register(TabContainer);
  _es6_module.add_class(TabContainer);
  TabContainer = _es6_module.add_export('TabContainer', TabContainer);
  UIBase.register(TabContainer);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_tabs.js');
es6_module_define('ui_textbox', ["../toolsys/toolprop.js", "../core/ui_base.js", "../toolsys/simple_toolsys.js", "../util/util.js", "../config/const.js", "../controller/simple_controller.js", "../util/vectormath.js", "../util/events.js", "./ui_button.js", "../core/units.js"], function _ui_textbox_module(_es6_module) {
  "use strict";
  var units=es6_import(_es6_module, '../core/units.js');
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../util/events.js');
  var simple_toolsys=es6_import(_es6_module, '../toolsys/simple_toolsys.js');
  var toolprop=es6_import(_es6_module, '../toolsys/toolprop.js');
  var DataPathError=es6_import_item(_es6_module, '../controller/simple_controller.js', 'DataPathError');
  var Vector3=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../util/vectormath.js', 'Quat');
  var Matrix4=es6_import_item(_es6_module, '../util/vectormath.js', 'Matrix4');
  var isNumber=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'isNumber');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  function myToFixed(s, n) {
    s = s.toFixed(n);
    while (s.endsWith('0')) {
      s = s.slice(0, s.length-1);
    }
    if (s.endsWith("\.")) {
        s = s.slice(0, s.length-1);
    }
    return s;
  }
  let keymap=events.keymap;
  let EnumProperty=toolprop.EnumProperty, PropTypes=toolprop.PropTypes;
  let UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, IconSheets=ui_base.IconSheets;
  let parsepx=ui_base.parsepx;
  var Button=es6_import_item(_es6_module, './ui_button.js', 'Button');
  class TextBoxBase extends UIBase {
    static  define() {
      return {}
    }
  }
  _ESClass.register(TextBoxBase);
  _es6_module.add_class(TextBoxBase);
  TextBoxBase = _es6_module.add_export('TextBoxBase', TextBoxBase);
  class TextBox extends TextBoxBase {
     constructor() {
      super();
      this._width = "min-content";
      let margin=Math.ceil(3*this.getDPI());
      this._had_error = false;
      this.decimalPlaces = 4;
      this.baseUnit = undefined;
      this.displayUnit = undefined;
      this.dom = document.createElement("input");
      this.dom.tabIndex = 0;
      this.dom.setAttribute("tabindex", 0);
      this.dom.setAttribute("tab-index", 0);
      this.dom.style["margin"] = margin+"px";
      this.dom.setAttribute("type", "textbox");
      this.dom.onchange = (e) =>        {
        this._change(this.dom.value);
      };
      this.radix = 16;
      this.dom.oninput = (e) =>        {
        this._change(this.dom.value);
      };
      this.shadow.appendChild(this.dom);
      this.dom.addEventListener("focus", (e) =>        {
        console.log("Textbox focus");
        this._startModal();
        this._focus = 1;
        this.setCSS();
      });
      this.dom.addEventListener("blur", (e) =>        {
        console.log("Textbox blur");
        if (this._modal) {
            this._endModal(true);
            this._focus = 0;
            this.setCSS();
        }
      });
    }
     _startModal() {
      console.log("textbox modal");
      if (this._modal) {
          this._endModal(true);
      }
      let ignore=0;
      let finish=(ok) =>        {
        this._endModal(ok);
      };
      let keydown=(e) =>        {
        e.stopPropagation();
        switch (e.keyCode) {
          case keymap.Enter:
            finish(true);
            break;
          case keymap.Escape:
            finish(false);
            break;
        }
        return ;
        if (ignore)
          return ;
        let e2=new KeyboardEvent(e.type, e);
        ignore = 1;
        this.dom.dispatchEvent(e2);
        ignore = 0;
      };
      this._modal = true;
      this.pushModal({on_mousemove: (e) =>          {
          console.log(e.x, e.y);
          e.stopPropagation();
        }, 
     on_keydown: keydown, 
     on_keypress: keydown, 
     on_keyup: keydown, 
     on_mousedown: (e) =>          {
          e.stopPropagation();
          console.log("mouse down", e.x, e.y);
        }}, false);
    }
     _endModal(ok) {
      console.log("textbox end modal");
      this._modal = false;
      this.popModal();
      if (this.onend) {
          this.onend(ok);
      }
    }
    get  tabIndex() {
      return this.dom.tabIndex;
    }
    set  tabIndex(val) {
      this.dom.tabIndex = val;
    }
     init() {
      super.init();
      this.style["display"] = "flex";
      this.style["width"] = this._width;
      this.setCSS();
    }
    set  width(val) {
      if (typeof val==="number") {
          val+="px";
      }
      this._width = val;
      this.style["width"] = val;
    }
     setCSS() {
      super.setCSS();
      this.overrideDefault("BoxBG", this.getDefault("background-color"));
      this.background = this.getDefault("background-color");
      this.dom.style["margin"] = this.dom.style["padding"] = "0px";
      if (this.getDefault("background-color")) {
          this.dom.style["background-color"] = this.getDefault("background-color");
      }
      if (this._focus) {
          this.dom.style["border"] = `2px dashed ${this.getDefault('FocusOutline')}`;
      }
      else {
        this.dom.style["border"] = "none";
      }
      if (this.style["font"]) {
          this.dom.style["font"] = this.style["font"];
      }
      else {
        this.dom.style["font"] = this.getDefault("DefaultText").genCSS();
      }
      this.dom.style["width"] = this.style["width"];
      this.dom.style["height"] = this.style["height"];
    }
     updateDataPath() {
      if (!this.ctx||!this.hasAttribute("datapath")) {
          return ;
      }
      if (this._focus||this._flashtimer!==undefined||(this._had_error&&this._focus)) {
          return ;
      }
      let val=this.getPathValue(this.ctx, this.getAttribute("datapath"));
      if (val===undefined||val===null) {
          this.disabled = true;
          return ;
      }
      else {
        this.disabled = false;
      }
      let prop=this.getPathMeta(this.ctx, this.getAttribute("datapath"));
      let text=this.text;
      if (prop!==undefined&&(prop.type==PropTypes.INT||prop.type==PropTypes.FLOAT)) {
          let is_int=prop.type==PropTypes.INT;
          this.radix = prop.radix;
          if (is_int&&this.radix===2) {
              text = val.toString(this.radix);
              text = "0b"+text;
          }
          else 
            if (is_int&&this.radix===16) {
              text+="h";
          }
          else {
            text = units.buildString(val, this.baseUnit, this.decimalPlaces, this.displayUnit);
          }
      }
      else 
        if (prop!==undefined&&prop.type===PropTypes.STRING) {
          text = val;
      }
      if (this.text!=text) {
          this.text = text;
      }
    }
     update() {
      super.update();
      if (this.dom.style["width"]!==this.style["width"]) {
          this.dom.style["width"] = this.style["width"];
      }
      if (this.dom.style["height"]!==this.style["height"]) {
          this.dom.style["height"] = this.style["height"];
      }
      if (this.hasAttribute("datapath")) {
          this.updateDataPath();
      }
      this.setCSS();
    }
     select() {
      this.dom.select();
    }
     focus() {
      return this.dom.focus();
    }
     blur() {
      return this.dom.blur();
    }
    static  define() {
      return {tagname: "textbox-x", 
     style: "textbox"}
    }
    get  text() {
      return this.dom.value;
    }
    set  text(value) {
      this.dom.value = value;
    }
     _prop_update(prop, text) {
      if ((prop.type===PropTypes.INT||prop.type===PropTypes.FLOAT)) {
          let val=units.parseValue(this.text, this.baseUnit);
          if (!toolprop.isNumber(this.text.trim())) {
              this.flash(ui_base.ErrorColors.ERROR, this.dom);
              this.focus();
              this.dom.focus();
              this._had_error = true;
          }
          else {
            if (this._had_error) {
                this.flash(ui_base.ErrorColors.OK, this.dom);
            }
            this._had_error = false;
            this.setPathValue(this.ctx, this.getAttribute("datapath"), val);
          }
      }
      else 
        if (prop.type==PropTypes.STRING) {
          this.setPathValue(this.ctx, this.getAttribute("datapath"), this.text);
      }
    }
     _change(text) {
      if (this.hasAttribute("datapath")&&this.ctx!==undefined) {
          let prop=this.getPathMeta(this.ctx, this.getAttribute("datapath"));
          if (prop) {
              this._prop_update(prop, text);
          }
      }
      if (this.onchange) {
          this.onchange(text);
      }
    }
  }
  _ESClass.register(TextBox);
  _es6_module.add_class(TextBox);
  TextBox = _es6_module.add_export('TextBox', TextBox);
  UIBase.register(TextBox);
  function checkForTextBox(screen, x, y) {
    let elem=screen.pickElement(x, y);
    if (elem&&__instance_of(elem, TextBoxBase)) {
        return true;
    }
    return false;
  }
  checkForTextBox = _es6_module.add_export('checkForTextBox', checkForTextBox);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_textbox.js');
es6_module_define('ui_treeview', ["../core/ui.js", "../util/ScreenOverdraw.js", "../core/ui_base.js", "../util/vectormath.js", "../core/ui_theme.js", "../util/math.js", "../util/simple_events.js"], function _ui_treeview_module(_es6_module) {
  es6_import(_es6_module, '../util/ScreenOverdraw.js');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var Icons=es6_import_item(_es6_module, '../core/ui_base.js', 'Icons');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var pushModalLight=es6_import_item(_es6_module, '../util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../util/simple_events.js', 'popModalLight');
  var keymap=es6_import_item(_es6_module, '../util/simple_events.js', 'keymap');
  var parsepx=es6_import_item(_es6_module, '../core/ui_theme.js', 'parsepx');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var math=es6_import(_es6_module, '../util/math.js');
  class TreeItem extends Container {
     constructor() {
      super();
      this.treeParent = undefined;
      this.treeChildren = [];
      this.treeView = undefined;
      this.treeDepth = 0;
      this.header = this.row();
      this._icon1 = this.header.iconbutton(Icons.TREE_COLLAPSE);
      this._icon1.iconsheet = 0;
      this._icon1.drawButtonBG = false;
      this._icon2 = undefined;
      this._icon1.onclick = () =>        {
        if (this.opened) {
            this.close();
        }
        else {
          this.open();
        }
      };
      this.opened = true;
      this._label = this.header.label("unlabeled");
      this._labelText = "unlabeled";
    }
    set  icon(id) {
      if (this._icon2) {
          this._icon2 = id;
      }
      else {
        this._icon2 = document.createElement("icon-label-x");
        this._icon2.icon = id;
        this._icon2.iconsheet = 0;
        this.header.insert(1, this._icon2);
      }
    }
    get  icon() {
      if (this._icon2)
        return this._icon2.icon;
      else 
        return -1;
    }
     open() {
      this._icon1.icon = Icons.TREE_COLLAPSE;
      this.opened = true;
      this.treeView._open(this);
    }
     close() {
      this._icon1.icon = Icons.TREE_EXPAND;
      this.opened = false;
      this.treeView._close(this);
    }
    set  text(b) {
      if (typeof b==="string") {
          this._label.text = b;
          this._labelText = b;
      }
      else 
        if (__instance_of(b, HTMLElement)) {
          this._label.remove();
          this.header.add(b);
          this._label = b;
          this._labelText = b;
      }
    }
    get  text() {
      return this._labelText;
    }
     item(name, args={}) {
      args.treeParent = this;
      return this.parentWidget.item(name, args);
    }
     init() {
      super.init();
    }
    static  define() {
      return {tagname: "tree-item-x", 
     style: "treeview"}
    }
  }
  _ESClass.register(TreeItem);
  _es6_module.add_class(TreeItem);
  TreeItem = _es6_module.add_export('TreeItem', TreeItem);
  UIBase.register(TreeItem);
  class TreeView extends Container {
     constructor() {
      super();
      this.items = [];
      this.strokes = [];
    }
     init() {
      super.init();
      this.style["display"] = "flex";
      this.style["flex-direction"] = "column";
      this.overdraw = document.createElement("overdraw-x");
      console.log(this.overdraw.startNode);
      this.overdraw.startNode(this);
      this.style["margin"] = this.style["padding"] = "0px";
      this.updateOverdraw();
    }
     _forAllChildren(item, cb) {
      let visit=(n) =>        {
        cb(n);
        for (let c of n.treeChildren) {
            visit(c);
        }
      };
      for (let c of item.treeChildren) {
          visit(c);
      }
    }
     _open(item) {
      this._forAllChildren(item, (c) =>        {
        if (c.opened) {
            c.unhide();
        }
      });
      this._makeStrokes();
    }
     _close(item) {
      this._forAllChildren(item, (c) =>        {
        c.hide();
      });
      this._makeStrokes();
    }
     _makeStrokes() {
      if (!this.overdraw) {
          return ;
      }
      for (let elem of this.strokes) {
          elem.remove();
      }
      this.strokes.length = 0;
      let hidden=(item) =>        {
        return item.hidden;
        let p=item;
        while (p) {
          if (!p.opened)
            return true;
          p = p.treeParent;
        }
        return false;
      };
      let items=this.items;
      if (items.length==0) {
          return ;
      }
      this.overdraw.clear();
      let next=(i) =>        {
        i++;
        while (i<items.length&&hidden(items[i])) {
          i++;
          continue;
        }
        return i;
      };
      let i=0;
      if (hidden(items[i]))
        i = next(i);
      let origin=this.overdraw.getBoundingClientRect();
      let overdraw=this.overdraw;
      let line=function (x1, y1, x2, y2) {
        let ox=origin.x, oy=origin.y;
        x1-=ox;
        y1-=oy;
        x2-=ox;
        y2-=oy;
        overdraw.line([x1, y1], [x2, y2]);
      };
      console.log("making lines", i);
      let indent=this.getDefault("itemIndent");
      let rowh=this.getDefault("rowHeight");
      let getx=(depth) =>        {
        return (depth+2.2)*indent+origin.x;
      };
      this.overdraw.style["z-index"] = "0";
      let prev=undefined;
      for (; i<items.length; i = next(i)) {
          let item=this.items[i];
          let item2=next(i);
          item2 = item2<items.length ? items[item2] : undefined;
          let r=item._icon1.getBoundingClientRect();
          if (!r)
            continue;
          let x1=getx(item.treeDepth);
          let y1=origin.y+(i+1)*rowh-rowh*0.25;
          if (item2&&item2.treeDepth>item.treeDepth) {
              let y2=y1+rowh*0.75;
              line(x1, y1, x1, y2);
              line(x1, y2, getx(item2.treeDepth)-3, y2);
          }
          else 
            if (item2&&item2.treeDepth===item.treeDepth) {
              line(x1, y1, x1, y1+rowh*0.5);
          }
          prev = item;
      }
    }
     updateOverdraw() {
      let mm=new math.MinMax(2);
      let ok=false;
      for (let item of this.items) {
          if (item.hidden) {
          }
          for (let r of item.getClientRects()) {
              mm.minmax([r.x, r.y]);
              mm.minmax([r.x+r.width, r.y+r.height]);
              ok = true;
          }
      }
      if (!ok) {
          return ;
      }
      let r=this.getClientRects()[0];
      if (!r)
        return ;
      let x=r.left;
      let y=r.top;
      let od=this.overdraw;
      let w=mm.max[0]-mm.min[0];
      let h=mm.max[1]-mm.min[1];
      od.style["margin"] = "0px";
      od.style["padding"] = "0px";
      od.svg.style["margin"] = "0px";
      od.style["position"] = "fixed";
      od.style["width"] = (r.width-1)+"px";
      od.style["height"] = (r.height-1)+"px";
      od.style["left"] = x+"px";
      od.style["top"] = y+"px";
    }
     update() {
      super.update();
      this.updateOverdraw();
    }
     item(name, args={icon: undefined}) {
      let ret=document.createElement("tree-item-x");
      this.add(ret);
      ret._init();
      ret.text = name;
      if (args.icon) {
          ret.icon = args.icon;
      }
      ret.treeParent = args.treeParent;
      ret.treeView = this;
      ret.style["max-height"] = this.getDefault("rowHeight")+"px";
      if (ret.treeParent) {
          ret.treeParent.treeChildren.push(ret);
          ret.treeDepth = ret.treeParent.treeDepth+1;
      }
      let p=ret.treeParent;
      let i=1;
      while (p) {
        p = p.treeParent;
        i++;
      }
      ret.style["margin-left"] = (i*this.getDefault("itemIndent"))+"px";
      this.items.push(ret);
      this.doOnce(() =>        {
        this._makeStrokes();
      });
      return ret;
    }
    static  define() {
      return {tagname: "tree-view-x", 
     style: "treeview"}
    }
  }
  _ESClass.register(TreeView);
  _es6_module.add_class(TreeView);
  TreeView = _es6_module.add_export('TreeView', TreeView);
  UIBase.register(TreeView);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_treeview.js');
es6_module_define('ui_widgets', ["./ui_textbox.js", "../toolsys/simple_toolsys.js", "../util/events.js", "../config/const.js", "../toolsys/toolprop.js", "./ui_button.js", "../core/ui_base.js", "../util/vectormath.js", "../util/util.js", "../core/units.js", "../controller/simple_controller.js"], function _ui_widgets_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../util/events.js');
  var simple_toolsys=es6_import(_es6_module, '../toolsys/simple_toolsys.js');
  var toolprop=es6_import(_es6_module, '../toolsys/toolprop.js');
  var DataPathError=es6_import_item(_es6_module, '../controller/simple_controller.js', 'DataPathError');
  var Vector3=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../util/vectormath.js', 'Quat');
  var Matrix4=es6_import_item(_es6_module, '../util/vectormath.js', 'Matrix4');
  var isNumber=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'isNumber');
  var units=es6_import(_es6_module, '../core/units.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  function myToFixed(s, n) {
    s = s.toFixed(n);
    while (s.endsWith('0')) {
      s = s.slice(0, s.length-1);
    }
    if (s.endsWith("\.")) {
        s = s.slice(0, s.length-1);
    }
    return s;
  }
  let keymap=events.keymap;
  let EnumProperty=toolprop.EnumProperty, PropTypes=toolprop.PropTypes;
  let UIBase=ui_base.UIBase, PackFlags=ui_base.PackFlags, IconSheets=ui_base.IconSheets;
  let parsepx=ui_base.parsepx;
  var Button=es6_import_item(_es6_module, './ui_button.js', 'Button');
  let _ex_Button=es6_import_item(_es6_module, './ui_button.js', 'Button');
  _es6_module.add_export('Button', _ex_Button, true);
  class IconLabel extends UIBase {
     constructor() {
      super();
      this._icon = -1;
      this.iconsheet = 1;
    }
     init() {
      super.init();
      this.style["display"] = "flex";
      this.style["margin"] = this.style["padding"] = "0px";
      this.setCSS();
    }
    set  icon(id) {
      this._icon = id;
      this.setCSS();
    }
    get  icon() {
      return this._icon;
    }
     setCSS() {
      let size=ui_base.iconmanager.getTileSize(this.iconsheet);
      ui_base.iconmanager.setCSS(this.icon, this);
      this.style["width"] = size+"px";
      this.style["height"] = size+"px";
    }
    static  define() {
      return {tagname: "icon-label-x"}
    }
  }
  _ESClass.register(IconLabel);
  _es6_module.add_class(IconLabel);
  IconLabel = _es6_module.add_export('IconLabel', IconLabel);
  UIBase.register(IconLabel);
  class ValueButtonBase extends Button {
     constructor() {
      super();
    }
    get  value() {
      return this._value;
    }
    set  value(val) {
      this._value = val;
      if (this.ctx&&this.hasAttribute("datapath")) {
          this.setPathValue(this.ctx, this.getAttribute("datapath"), this._value);
      }
    }
     updateDataPath() {
      if (!this.hasAttribute("datapath"))
        return ;
      if (this.ctx===undefined)
        return ;
      let val=this.getPathValue(this.ctx, this.getAttribute("datapath"));
      if (val===undefined) {
          let redraw=!this.disabled;
          this.disabled = true;
          if (redraw)
            this._redraw();
          return ;
      }
      else {
        let redraw=this.disabled;
        this.disabled = false;
        if (redraw)
          this._redraw();
      }
      if (val!==this._value) {
          this._value = val;
          this.updateWidth();
          this._repos_canvas();
          this._redraw();
          this.setCSS();
      }
    }
     update() {
      this.updateDataPath();
      super.update();
    }
  }
  _ESClass.register(ValueButtonBase);
  _es6_module.add_class(ValueButtonBase);
  ValueButtonBase = _es6_module.add_export('ValueButtonBase', ValueButtonBase);
  class Check extends UIBase {
     constructor() {
      super();
      this._checked = false;
      this._highlight = false;
      this._focus = false;
      let shadow=this.shadow;
      let span=document.createElement("span");
      span.setAttribute("class", "checkx");
      span.style["display"] = "flex";
      span.style["flex-direction"] = "row";
      span.style["margin"] = span.style["padding"] = "0px";
      let sheet=0;
      let size=ui_base.iconmanager.getTileSize(0);
      let check=this.canvas = document.createElement("canvas");
      this.g = check.getContext("2d");
      check.setAttribute("id", check._id);
      check.setAttribute("name", check._id);
      let mdown=(e) =>        {
        this._highlight = false;
        this.checked = !this.checked;
      };
      let mup=(e) =>        {
        this._highlight = false;
        this.blur();
        this._redraw();
      };
      let mover=(e) =>        {
        this._highlight = true;
        this._redraw();
      };
      let mleave=(e) =>        {
        this._highlight = false;
        this._redraw();
      };
      span.addEventListener("mouseover", mover);
      span.addEventListener("mousein", mover);
      span.addEventListener("mouseleave", mleave);
      span.addEventListener("mouseout", mleave);
      this.addEventListener("blur", (e) =>        {
        this._highlight = this._focus = false;
        this._redraw();
      });
      this.addEventListener("focusin", (e) =>        {
        this._focus = true;
        this._redraw();
      });
      this.addEventListener("focus", (e) =>        {
        this._focus = true;
        this._redraw();
      });
      span.addEventListener("mousedown", mdown);
      span.addEventListener("touchstart", mdown);
      span.addEventListener("mouseup", mup);
      span.addEventListener("touchend", mup);
      this.addEventListener("keydown", (e) =>        {
        switch (e.keyCode) {
          case keymap["Escape"]:
            this._highlight = undefined;
            this._redraw();
            e.preventDefault();
            e.stopPropagation();
            this.blur();
            break;
          case keymap["Enter"]:
          case keymap["Space"]:
            this.checked = !this.checked;
            e.preventDefault();
            e.stopPropagation();
            break;
        }
      });
      this.checkbox = check;
      span.appendChild(check);
      let label=this._label = document.createElement("label");
      label.setAttribute("class", "checkx");
      span.setAttribute("class", "checkx");
      let side=this.getDefault("CheckSide");
      if (side==="right") {
          span.prepend(label);
      }
      else {
        span.appendChild(label);
      }
      shadow.appendChild(span);
    }
     init() {
      this.tabIndex = 1;
      this.setAttribute("class", "checkx");
      let style=document.createElement("style");
      let color=this.getDefault("FocusOutline");
      style.textContent = `
      .checkx:focus {
        outline : none;
      }
    `;
      this.prepend(style);
    }
    get  disabled() {
      return super.disabled;
    }
    set  disabled(val) {
      super.disabled = val;
      this._redraw();
    }
    get  value() {
      return this.checked;
    }
    set  value(v) {
      this.checked = v;
    }
     setCSS() {
      this._label.style["font"] = this.getDefault("DefaultText").genCSS();
      this._label.style["color"] = this.getDefault("DefaultText").color;
      super.setCSS();
    }
     updateDataPath() {
      if (!this.getAttribute("datapath")) {
          return ;
      }
      let val=this.getPathValue(this.ctx, this.getAttribute("datapath"));
      if (val===undefined) {
          this.disabled = true;
          return ;
      }
      else {
        this.disabled = false;
      }
      val = !!val;
      if (!!this._checked!=!!val) {
          this._checked = val;
          this._redraw();
      }
    }
     _repos_canvas() {
      if (this.canvas===undefined)
        return ;
      let r=this.canvas.getClientRects()[0];
      if (r===undefined) {
          return ;
      }
    }
     _redraw() {
      if (this.canvas===undefined)
        return ;
      let canvas=this.canvas, g=this.g;
      let dpi=UIBase.getDPI();
      let tilesize=ui_base.iconmanager.getTileSize(0);
      let pad=this.getDefault("BoxMargin");
      let csize=tilesize+pad*2;
      canvas.style["margin"] = "2px";
      canvas.style["width"] = csize+"px";
      canvas.style["height"] = csize+"px";
      csize = ~~(csize*dpi+0.5);
      tilesize = ~~(tilesize*dpi+0.5);
      canvas.width = csize;
      canvas.height = csize;
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.beginPath();
      g.rect(0, 0, canvas.width, canvas.height);
      g.fill();
      let color;
      if (!this._checked&&this._highlight) {
          color = this.getDefault("BoxHighlight");
      }
      ui_base.drawRoundBox(this, canvas, g, undefined, undefined, undefined, undefined, color);
      if (this._checked) {
          let x=(csize-tilesize)*0.5, y=(csize-tilesize)*0.5;
          ui_base.iconmanager.canvasDraw(this, canvas, g, ui_base.Icons.LARGE_CHECK, x, y);
      }
      if (this._focus) {
          color = this.getDefault("FocusOutline");
          g.lineWidth*=dpi;
          ui_base.drawRoundBox(this, canvas, g, undefined, undefined, undefined, "stroke", color);
      }
    }
    set  checked(v) {
      if (!!this._checked!=!!v) {
          this._checked = v;
          this._redraw();
          if (this.onclick) {
              this.onclick(v);
          }
          if (this.onchange) {
              this.onchange(v);
          }
          if (this.hasAttribute("datapath")) {
              this.setPathValue(this.ctx, this.getAttribute("datapath"), this._checked);
          }
      }
    }
    get  checked() {
      return this._checked;
    }
     updateDPI() {
      let dpi=UIBase.getDPI();
      if (dpi!==this._last_dpi) {
          this._last_dpi = dpi;
          this._redraw();
      }
    }
     update() {
      super.update();
      this.updateDPI();
      if (this.hasAttribute("datapath")) {
          this.updateDataPath();
      }
      let updatekey=this.getDefault("DefaultText").hash();
      if (updatekey!==this._updatekey) {
          this._updatekey = updatekey;
          this.setCSS();
      }
    }
    get  label() {
      return this._label.textContent;
    }
    set  label(l) {
      this._label.textContent = l;
    }
    static  define() {
      return {tagname: "check-x", 
     style: "checkbox"}
    }
  }
  _ESClass.register(Check);
  _es6_module.add_class(Check);
  Check = _es6_module.add_export('Check', Check);
  UIBase.register(Check);
  class IconCheck extends Button {
     constructor() {
      super();
      this._checked = undefined;
      this._drawCheck = true;
      this._icon = -1;
      this._icon_pressed = undefined;
      this.iconsheet = ui_base.IconSheets.LARGE;
    }
     updateDefaultSize() {

    }
     _calcUpdateKey() {
      return super._calcUpdateKey()+":"+this._icon;
    }
    get  drawCheck() {
      return this._drawCheck;
    }
    set  drawCheck(val) {
      if (val&&(this.packflag&PackFlags.HIDE_CHECK_MARKS)) {
          this.packflag&=~PackFlags.HIDE_CHECK_MARKS;
      }
      this._drawCheck = val;
      this._redraw();
    }
    get  icon() {
      return this._icon;
    }
    set  icon(val) {
      this._icon = val;
      this._repos_canvas();
      this._redraw();
    }
    get  checked() {
      return this._checked;
    }
    set  checked(val) {
      if (!!val!=!!this._checked) {
          this._checked = val;
          this._redraw();
          if (this.onchange) {
              this.onchange(val);
          }
      }
    }
     updateDataPath() {
      if (!this.hasAttribute("datapath")||!this.ctx) {
          return ;
      }
      if (this._icon<0) {
          let rdef;
          try {
            rdef = this.ctx.api.resolvePath(this.ctx, this.getAttribute("datapath"));
          }
          catch (error) {
              if (__instance_of(error, DataPathError)) {
                  return ;
              }
              else {
                throw error;
              }
          }
          if (rdef!==undefined&&rdef.prop) {
              let icon, title;
              if (rdef.subkey&&(rdef.prop.type==PropTypes.FLAG||rdef.prop.type==PropTypes.ENUM)) {
                  icon = rdef.prop.iconmap[rdef.subkey];
                  title = rdef.prop.descriptions[rdef.subkey];
                  if (title===undefined&&rdef.subkey.length>0) {
                      title = rdef.subkey;
                      title = title[0].toUpperCase()+title.slice(1, title.length).toLowerCase();
                  }
              }
              else {
                icon = rdef.prop.icon;
                title = rdef.prop.description;
              }
              if (icon!==undefined&&icon!==this.icon)
                this.icon = icon;
              if (title!==undefined)
                this.description = title;
          }
      }
      let val=this.getPathValue(this.ctx, this.getAttribute("datapath"));
      if (val===undefined) {
          this.disabled = true;
          return ;
      }
      else {
        this.disabled = false;
      }
      val = !!val;
      if (val!=!!this._checked) {
          this._checked = val;
          this._redraw();
      }
    }
     update() {
      if (this.packflag&PackFlags.HIDE_CHECK_MARKS) {
          this.drawCheck = false;
      }
      if (this.hasAttribute("datapath")) {
          this.updateDataPath();
      }
      super.update();
    }
     _getsize() {
      let margin=this.getDefault("BoxMargin");
      return ui_base.iconmanager.getTileSize(this.iconsheet)+margin*2;
    }
     _repos_canvas() {
      let dpi=UIBase.getDPI();
      let w=(~~(this._getsize()*dpi))/dpi;
      let h=(~~(this._getsize()*dpi))/dpi;
      this.dom.style["width"] = w+"px";
      this.dom.style["height"] = h+"px";
      if (this._div!==undefined) {
          this._div.style["width"] = w+"px";
          this._div.style["height"] = h+"px";
      }
      super._repos_canvas();
    }
    set  icon(f) {
      this._icon = f;
      this._redraw();
    }
    get  icon() {
      return this._icon;
    }
     _onpress() {
      this.checked^=1;
      if (this.hasAttribute("datapath")) {
          this.setPathValue(this.ctx, this.getAttribute("datapath"), this.checked);
      }
      console.log("click!", this.checked);
      this._redraw();
    }
     _redraw() {
      this._repos_canvas();
      if (this._checked) {
          this._highlight = false;
      }
      let pressed=this._pressed;
      this._pressed = this._checked;
      super._redraw(false);
      this._pressed = pressed;
      let icon=this._icon;
      if (this._checked&&this._icon_pressed!==undefined) {
          icon = this._icon_pressed;
      }
      let tsize=ui_base.iconmanager.getTileSize(this.iconsheet);
      let size=this._getsize();
      let off=size>tsize ? (size-tsize)*0.5 : 0.0;
      this.g.save();
      this.g.translate(off, off);
      ui_base.iconmanager.canvasDraw(this, this.dom, this.g, icon, undefined, undefined, this.iconsheet);
      if (this.drawCheck) {
          let icon2=this._checked ? ui_base.Icons.CHECKED : ui_base.Icons.UNCHECKED;
          ui_base.iconmanager.canvasDraw(this, this.dom, this.g, icon2, undefined, undefined, this.iconsheet);
      }
      this.g.restore();
    }
    static  define() {
      return {tagname: "iconcheck-x", 
     style: "iconcheck"}
    }
  }
  _ESClass.register(IconCheck);
  _es6_module.add_class(IconCheck);
  IconCheck = _es6_module.add_export('IconCheck', IconCheck);
  UIBase.register(IconCheck);
  class IconButton extends Button {
     constructor() {
      super();
      this._icon = 0;
      this._icon_pressed = undefined;
      this.iconsheet = ui_base.Icons.LARGE;
      this.drawButtonBG = true;
    }
     updateDefaultSize() {

    }
     _calcUpdateKey() {
      return super._calcUpdateKey()+":"+this._icon;
    }
    get  icon() {
      return this._icon;
    }
    set  icon(val) {
      this._icon = val;
      this._repos_canvas();
      this._redraw();
    }
     update() {
      super.update();
    }
     _getsize() {
      let margin=this.getDefault("BoxMargin");
      return ui_base.iconmanager.getTileSize(this.iconsheet)+margin*2;
    }
     _repos_canvas() {
      let dpi=UIBase.getDPI();
      let w=(~~(this._getsize()*dpi))/dpi;
      let h=(~~(this._getsize()*dpi))/dpi;
      this.dom.style["width"] = w+"px";
      this.dom.style["height"] = h+"px";
      if (this._div!==undefined) {
          this._div.style["width"] = w+"px";
          this._div.style["height"] = h+"px";
      }
      super._repos_canvas();
    }
     _redraw() {
      this._repos_canvas();
      if (this.drawButtonBG) {
          super._redraw(false);
      }
      let icon=this._icon;
      if (this._checked&&this._icon_pressed!==undefined) {
          icon = this._icon_pressed;
      }
      let tsize=ui_base.iconmanager.getTileSize(this.iconsheet);
      let size=this._getsize();
      let dpi=UIBase.getDPI();
      let off=size>tsize ? (size-tsize)*0.5*dpi : 0.0;
      this.g.save();
      this.g.translate(off, off);
      ui_base.iconmanager.canvasDraw(this, this.dom, this.g, icon, undefined, undefined, this.iconsheet);
      this.g.restore();
    }
    static  define() {
      return {tagname: "iconbutton-x", 
     style: "iconbutton"}
    }
  }
  _ESClass.register(IconButton);
  _es6_module.add_class(IconButton);
  IconButton = _es6_module.add_export('IconButton', IconButton);
  UIBase.register(IconButton);
  class Check1 extends Button {
     constructor() {
      super();
      this._namePad = 40;
      this._value = undefined;
    }
     _redraw() {
      let dpi=this.getDPI();
      let box=40;
      ui_base.drawRoundBox(this, this.dom, this.g, box);
      let r=this.getDefault("BoxRadius")*dpi;
      let pad=this.getDefault("BoxMargin")*dpi;
      let ts=this.getDefault("DefaultText").size;
      let text=this._genLabel();
      let tw=ui_base.measureText(this, text, this.dom, this.g).width;
      let cx=this.dom.width/2-tw/2;
      let cy=this.dom.height/2;
      ui_base.drawText(this, box, cy+ts/2, text, {canvas: this.dom, 
     g: this.g});
    }
    static  define() {
      return {tagname: "check1-x"}
    }
  }
  _ESClass.register(Check1);
  _es6_module.add_class(Check1);
  Check1 = _es6_module.add_export('Check1', Check1);
  UIBase.register(Check1);
  let _ex_checkForTextBox=es6_import_item(_es6_module, './ui_textbox.js', 'checkForTextBox');
  _es6_module.add_export('checkForTextBox', _ex_checkForTextBox, true);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_widgets.js');
es6_module_define('ui_widgets2', ["../util/util.js", "../util/events.js", "../toolsys/toolprop.js", "../util/vectormath.js", "../core/ui.js", "./ui_richedit.js", "../core/units.js", "./ui_widgets.js", "../core/ui_base.js"], function _ui_widgets2_module(_es6_module) {
  "use strict";
  es6_import(_es6_module, './ui_richedit.js');
  var util=es6_import(_es6_module, '../util/util.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../util/events.js');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../util/vectormath.js', 'Quat');
  var Matrix4=es6_import_item(_es6_module, '../util/vectormath.js', 'Matrix4');
  var RowFrame=es6_import_item(_es6_module, '../core/ui.js', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var isNumber=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'isNumber');
  es6_import(_es6_module, './ui_widgets.js');
  let keymap=events.keymap;
  var EnumProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'EnumProperty');
  var PropTypes=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'PropTypes');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var PackFlags=es6_import_item(_es6_module, '../core/ui_base.js', 'PackFlags');
  var IconSheets=es6_import_item(_es6_module, '../core/ui_base.js', 'IconSheets');
  var parsepx=es6_import_item(_es6_module, '../core/ui_base.js', 'parsepx');
  var units=es6_import(_es6_module, '../core/units.js');
  var ToolProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'ToolProperty');
  class VectorPanel extends ColumnFrame {
     constructor() {
      super();
      this.range = [-1e+17, 1e+17];
      this.name = "";
      this.axes = "XYZW";
      this.value = new Vector3();
      this.sliders = [];
      this.hasUniformSlider = false;
      let makeParam=(key) =>        {
        Object.defineProperty(this, key, {get: function () {
            return this._getNumParam(key);
          }, 
      set: function (val) {
            this._setNumParam(key, val);
          }});
      };
      this.__range = [-1e+17, 1e+17];
      this._range = new Array(2);
      Object.defineProperty(this._range, 0, {get: () =>          {
          return this.__range[0];
        }, 
     set: (val) =>          {
          return this.__range[0] = val;
        }});
      Object.defineProperty(this._range, 1, {get: () =>          {
          return this.__range[1];
        }, 
     set: (val) =>          {
          return this.__range[1] = val;
        }});
      makeParam("isInt");
      makeParam("radix");
      makeParam("decimalPlaces");
      makeParam("baseUnit");
      makeParam("displayUnit");
      makeParam("step");
      makeParam("expRate");
      makeParam("stepIsRelative");
      window.vp = this;
    }
     init() {
      super.init();
      this.rebuild();
      this.setCSS();
      this.background = this.getDefault("InnerPanelBG");
      this.style["padding"] = "5px";
    }
     _getNumParam(key) {
      return this["_"+key];
    }
     _setNumParam(key, val) {
      if (key==="range") {
          this.__range[0] = val[0];
          this.__range[1] = val[1];
          return ;
      }
      this["_"+key] = val;
      for (let slider of this.sliders) {
          slider[key] = val;
      }
    }
     rebuild() {
      this.clear();
      if (this.name) {
          this.label(this.name);
      }
      let frame, row;
      if (this.hasUniformSlider) {
          row = this.row();
          frame = row.col();
      }
      else {
        frame = this;
      }
      console.warn("rebuilding");
      this.sliders = [];
      for (let i=0; i<this.value.length; i++) {
          let slider=frame.slider(undefined, this.axes[i], this.value[i], this.range[0], this.range[1], 0.001, this.isInt);
          slider.axis = i;
          let this2=this;
          slider.baseUnit = this.baseUnit;
          slider.displayUnit = this.displayUnit;
          slider.isInt = this.isInt;
          slider.range = this.__range;
          slider.radix = this.radix;
          slider.step = this.step;
          slider.expRate = this.expRate;
          slider.stepIsRelative = this.stepIsRelative;
          if (this.stepIsRelative) {
              slider.step = ToolProperty.calcRelativeStep(this.step, this.value[i]);
          }
          slider.onchange = function (e) {
            this2.value[this.axis] = this.value;
            if (this2.hasAttribute("datapath")) {
                this2.setPathValue(this2.ctx, this2.getAttribute("datapath"), this2.value);
            }
            if (this2.uslider) {
                this2.uslider.setValue(this2.uniformValue, false);
            }
            if (this2.onchange) {
                this2.onchange(this2.value);
            }
          };
          this.sliders.push(slider);
      }
      if (this.hasUniformSlider) {
          let uslider=this.uslider = document.createElement("numslider-x");
          row._prepend(uslider);
          uslider.range = this.range;
          uslider.baseUnit = this.baseUnit;
          uslider.displayUnit = this.displayUnit;
          uslider.expRate = this.expRate;
          uslider.step = this.step;
          uslider.expRate = this.expRate;
          uslider.isInt = this.isInt;
          uslider.radix = this.radix;
          uslider.decimalPlaces = this.decimalPlaces;
          uslider.stepIsRelative = this.stepIsRelative;
          uslider.vertical = true;
          uslider.setValue(this.uniformValue, false);
          this.sliders.push(uslider);
          uslider.onchange = () =>            {
            this.uniformValue = uslider.value;
          };
      }
      else {
        this.uslider = undefined;
      }
      this.setCSS();
    }
    get  uniformValue() {
      let sum=0.0;
      for (let i=0; i<this.value.length; i++) {
          sum+=isNaN(this.value[i]) ? 0.0 : this.value[i];
      }
      return sum/this.value.length;
    }
    set  uniformValue(val) {
      let old=this.uniformValue;
      let doupdate=false;
      if (old===0.0||val===0.0) {
          doupdate = this.value.dot(this.value)!==0.0;
          this.value.zero();
      }
      else {
        let ratio=val/old;
        for (let i=0; i<this.value.length; i++) {
            this.value[i]*=ratio;
        }
        doupdate = true;
      }
      if (doupdate) {
          if (this.hasAttribute("datapath")) {
              this.setPathValue(this.ctx, this.getAttribute("datapath"), this.value);
          }
          if (this.onchange) {
              this.onchange(this.value);
          }
          for (let i=0; i<this.value.length; i++) {
              this.sliders[i].setValue(this.value[i], false);
              this.sliders[i]._redraw();
          }
          if (this.uslider) {
              this.uslider.setValue(val, false);
              this.uslider._redraw();
          }
      }
    }
     setValue(value) {
      if (!value) {
          return ;
      }
      if (value.length!==this.value.length) {
          switch (value.length) {
            case 2:
              this.value = new Vector2(value);
              break;
            case 3:
              this.value = new Vector3(value);
              break;
            case 4:
              this.value = new Vector4(value);
              break;
            default:
              throw new Error("invalid vector size "+value.length);
          }
          this.rebuild();
      }
      else {
        this.value.load(value);
      }
      if (this.onchange) {
          this.onchange(this.value);
      }
      return this;
    }
     updateDataPath() {
      if (!this.hasAttribute("datapath")) {
          return ;
      }
      let path=this.getAttribute("datapath");
      let val=this.getPathValue(this.ctx, path);
      if (val===undefined) {
          this.disabled = true;
          return ;
      }
      let meta=this.getPathMeta(this.ctx, path);
      let name=meta.uiname!==undefined ? meta.uiname : meta.name;
      if (this.hasAttribute("name")) {
          name = this.getAttribute("name");
      }
      if (name&&name!==this.name) {
          this.name = name;
          this.rebuild();
          return ;
      }
      let loadNumParam=(k, do_rebuild) =>        {
        if (do_rebuild===undefined) {
            do_rebuild = false;
        }
        if (meta&&meta[k]!==undefined&&this[k]===undefined) {
            this[k] = meta[k];
            if (this[k]!==meta[k]&&do_rebuild) {
                this.doOnce(this.rebuild);
            }
        }
      };
      loadNumParam("baseUnit");
      loadNumParam("displayUnit");
      loadNumParam("decimalPlaces");
      loadNumParam("isInt");
      loadNumParam("radix");
      loadNumParam("step");
      loadNumParam("expRate");
      loadNumParam("stepIsRelative");
      if (meta&&meta.hasUniformSlider!==undefined&&meta.hasUniformSlider!==this.hasUniformSlider) {
          this.hasUniformSlider = meta.hasUniformSlider;
          this.doOnce(this.rebuild);
      }
      if (meta&&meta.range) {
          this.range[0] = meta.range[0];
          this.range[1] = meta.range[1];
      }
      this.disabled = false;
      let length=val.length;
      if (meta)
        length = meta.getValue().length;
      if (this.value.length!==length) {
          switch (length) {
            case 2:
              val = new Vector2(val);
              break;
            case 3:
              val = new Vector3(val);
              break;
            case 4:
              val = new Vector4(val);
              break;
            default:
              val = meta.getValue().copy().load(val);
              break;
          }
          this.value = val;
          this.rebuild();
          for (let i=0; i<this.value.length; i++) {
              this.sliders[i].setValue(val[i], false);
              this.sliders[i]._redraw();
          }
      }
      else {
        if (this.value.vectorDistance(val)>0) {
            this.value.load(val);
            if (this.uslider) {
                this.uslider.setValue(this.uniformValue, false);
            }
            for (let i=0; i<this.value.length; i++) {
                this.sliders[i].setValue(val[i], false);
                this.sliders[i]._redraw();
            }
        }
      }
    }
     update() {
      super.update();
      this.updateDataPath();
      if (this.stepIsRelative) {
          for (let slider of this.sliders) {
              slider.step = ToolProperty.calcRelativeStep(this.step, slider.value);
          }
      }
      if (this.uslider) {
          this.uslider.step = this.step;
          if (this.stepIsRelative) {
              this.uslider.step = ToolProperty.calcRelativeStep(this.step, this.uniformValue);
          }
      }
    }
    static  define() {
      return {tagname: "vector-panel-x"}
    }
  }
  _ESClass.register(VectorPanel);
  _es6_module.add_class(VectorPanel);
  VectorPanel = _es6_module.add_export('VectorPanel', VectorPanel);
  UIBase.register(VectorPanel);
  class ToolTip extends UIBase {
     constructor() {
      super();
      this.visibleToPick = false;
      this.div = document.createElement("div");
      this.styletag = document.createElement("style");
      this.styletag.textContent = `
      div {
        padding : 15px;
      }
    `;
      this.shadow.appendChild(this.styletag);
      this.shadow.appendChild(this.div);
    }
    static  show(message, screen, x, y) {
      let ret=document.createElement(this.define().tagname);
      ret.text = message;
      let size=ret._estimateSize();
      console.log(size);
      x = Math.min(Math.max(x, 0), screen.size[0]-size[0]);
      y = Math.min(Math.max(y, 0), screen.size[1]-size[1]);
      ret._popup = screen.popup(ret, x, y);
      ret._popup.add(ret);
      return ret;
    }
     end() {
      this._popup.end();
    }
     init() {
      super.init();
      this.setCSS();
    }
    set  text(val) {
      this.div.innerHTML = val.replace(/[\n]/g, "<br>\n");
    }
    get  text() {
      return this.div.innerHTML;
    }
     _estimateSize() {
      let text=this.div.textContent;
      let block=ui_base.measureTextBlock(this, text, undefined, undefined, undefined, this.getDefault("ToolTipText"));
      return [block.width+50, block.height+30];
    }
     setCSS() {
      super.setCSS();
      let color=this.getDefault("BoxBG");
      let bcolor=this.getDefault("BoxBorder");
      this.div.style["background-color"] = color;
      this.div.style["border"] = "2px solid "+bcolor;
      this.div.style["font"] = this.getDefault("ToolTipText").genCSS();
    }
    static  define() {
      return {tagname: "tool-tip-x", 
     style: "tooltip"}
    }
  }
  _ESClass.register(ToolTip);
  _es6_module.add_class(ToolTip);
  ToolTip = _es6_module.add_export('ToolTip', ToolTip);
  
  UIBase.register(ToolTip);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_widgets2.js');
es6_module_define('all', ["./splinetool.js"], function _all_module(_es6_module) {
  es6_import(_es6_module, './splinetool.js');
}, '/dev/fairmotion/src/editors/viewport/toolmodes/all.js');
es6_module_define('splinetool', ["../../events.js", "../../../curve/spline_draw.js", "../view2d_editor.js", "../selectmode.js", "../../../path.ux/scripts/pathux.js", "../spline_createops.js", "../transform_ops.js", "../../../core/toolops_api.js", "./toolmode.js", "../spline_selectops.js", "../../../curve/spline_types.js", "../transform.js", "../spline_editops.js"], function _splinetool_module(_es6_module) {
  "use strict";
  var ExtrudeVertOp=es6_import_item(_es6_module, '../spline_createops.js', 'ExtrudeVertOp');
  var DeleteVertOp=es6_import_item(_es6_module, '../spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, '../spline_editops.js', 'DeleteSegmentOp');
  var WidgetResizeOp=es6_import_item(_es6_module, '../transform_ops.js', 'WidgetResizeOp');
  var WidgetRotateOp=es6_import_item(_es6_module, '../transform_ops.js', 'WidgetRotateOp');
  var KeyMap=es6_import_item(_es6_module, '../../events.js', 'KeyMap');
  var ToolKeyHandler=es6_import_item(_es6_module, '../../events.js', 'ToolKeyHandler');
  var FuncKeyHandler=es6_import_item(_es6_module, '../../events.js', 'FuncKeyHandler');
  var HotKey=es6_import_item(_es6_module, '../../events.js', 'HotKey');
  var charmap=es6_import_item(_es6_module, '../../events.js', 'charmap');
  var TouchEventManager=es6_import_item(_es6_module, '../../events.js', 'TouchEventManager');
  var EventHandler=es6_import_item(_es6_module, '../../events.js', 'EventHandler');
  var SelectLinkedOp=es6_import_item(_es6_module, '../spline_selectops.js', 'SelectLinkedOp');
  var SelectOneOp=es6_import_item(_es6_module, '../spline_selectops.js', 'SelectOneOp');
  var TranslateOp=es6_import_item(_es6_module, '../transform.js', 'TranslateOp');
  var SelMask=es6_import_item(_es6_module, '../selectmode.js', 'SelMask');
  var ToolModes=es6_import_item(_es6_module, '../selectmode.js', 'ToolModes');
  var SplineTypes=es6_import_item(_es6_module, '../../../curve/spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../../../curve/spline_types.js', 'SplineFlags');
  var SplineVertex=es6_import_item(_es6_module, '../../../curve/spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, '../../../curve/spline_types.js', 'SplineSegment');
  var SplineFace=es6_import_item(_es6_module, '../../../curve/spline_types.js', 'SplineFace');
  var View2DEditor=es6_import_item(_es6_module, '../view2d_editor.js', 'View2DEditor');
  var SessionFlags=es6_import_item(_es6_module, '../view2d_editor.js', 'SessionFlags');
  var redraw_element=es6_import_item(_es6_module, '../../../curve/spline_draw.js', 'redraw_element');
  var UndoFlags=es6_import_item(_es6_module, '../../../core/toolops_api.js', 'UndoFlags');
  var ToolFlags=es6_import_item(_es6_module, '../../../core/toolops_api.js', 'ToolFlags');
  var ModalStates=es6_import_item(_es6_module, '../../../core/toolops_api.js', 'ModalStates');
  var ToolOp=es6_import_item(_es6_module, '../../../core/toolops_api.js', 'ToolOp');
  var ToolMacro=es6_import_item(_es6_module, '../../../core/toolops_api.js', 'ToolMacro');
  var DeleteVertOp=es6_import_item(_es6_module, '../spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, '../spline_editops.js', 'DeleteSegmentOp');
  var DeleteFaceOp=es6_import_item(_es6_module, '../spline_editops.js', 'DeleteFaceOp');
  var ChangeFaceZ=es6_import_item(_es6_module, '../spline_editops.js', 'ChangeFaceZ');
  var SplitEdgeOp=es6_import_item(_es6_module, '../spline_editops.js', 'SplitEdgeOp');
  var DuplicateOp=es6_import_item(_es6_module, '../spline_editops.js', 'DuplicateOp');
  var DisconnectHandlesOp=es6_import_item(_es6_module, '../spline_editops.js', 'DisconnectHandlesOp');
  var SplitEdgePickOp=es6_import_item(_es6_module, '../spline_editops.js', 'SplitEdgePickOp');
  var ToolMode=es6_import_item(_es6_module, './toolmode.js', 'ToolMode');
  var nstructjs=es6_import_item(_es6_module, '../../../path.ux/scripts/pathux.js', 'nstructjs');
  var WidgetResizeOp=es6_import_item(_es6_module, '../transform_ops.js', 'WidgetResizeOp');
  var WidgetRotateOp=es6_import_item(_es6_module, '../transform_ops.js', 'WidgetRotateOp');
  var ToolModes=es6_import_item(_es6_module, '../selectmode.js', 'ToolModes');
  window.anim_to_playback = [];
  class SplineToolMode extends ToolMode {
    
    
    
    
     constructor() {
      super();
      this.keymap = undefined;
      this.mpos = new Vector2();
      this.last_mpos = new Vector2();
      this.start_mpos = new Vector2();
      this.mdown = false;
    }
     rightClickMenu(e, localX, localY, view2d) {

    }
     draw(view2d) {
      super.draw(view2d);
    }
     duplicate() {
      return new this.constructor();
    }
    static  contextOverride() {

    }
    static  buildSideBar(container) {

    }
    static  buildHeader(container) {

    }
    static  buildProperties(container) {

    }
     on_tick() {
      if (!this.ctx) {
          return ;
      }
      let ctx=this.ctx;
      let widgets=[WidgetResizeOp, WidgetRotateOp];
      if (ctx.view2d.toolmode==ToolModes.RESIZE) {
          ctx.view2d.widgets.ensure_toolop(ctx, WidgetResizeOp);
      }
      else 
        if (ctx.view2d.toolmode==ToolModes.ROTATE) {
          ctx.view2d.widgets.ensure_toolop(ctx, WidgetRotateOp);
      }
      else {
        for (let cls of widgets) {
            ctx.view2d.widgets.ensure_not_toolop(ctx, cls);
        }
      }
    }
    static  toolDefine() {
      return {name: "spline", 
     uiName: "Spline", 
     flag: 0, 
     icon: -1, 
     nodeInputs: {}, 
     nodeOutputs: {}, 
     nodeFlag: 0}
    }
     defineKeyMap() {
      let k=this.keymap = new KeyMap([]);
      k.add_tool(new HotKey("PageUp", [], "Send Face Up"), "spline.change_face_z(offset=1, selmode=selectmode)");
      k.add_tool(new HotKey("PageDown", [], "Send Face Down"), "spline.change_face_z(offset=-1, selmode=selectmode)");
      k.add_tool(new HotKey("G", [], "Translate"), "spline.translate(datamode=selectmode)");
      k.add_tool(new HotKey("S", [], "Scale"), "spline.scale(datamode=selectmode)");
      k.add_tool(new HotKey("S", ["SHIFT"], "Scale Time"), "spline.shift_time()");
      k.add_tool(new HotKey("R", [], "Rotate"), "spline.rotate(datamode=selectmode)");
      k.add_tool(new HotKey("A", [], "Select Linked"), "spline.toggle_select_all()");
      k.add_tool(new HotKey("A", ["ALT"], "Animation Playback"), "editor.playback()");
      k.add_tool(new HotKey("H", [], "Hide Selection"), "spline.hide(selmode=selectmode)");
      k.add_tool(new HotKey("H", ["ALT"], "Reveal Selection"), "spline.unhide(selmode=selectmode)");
      k.add_tool(new HotKey("G", ["CTRL"], "Ghost Selection"), "spline.hide(selmode=selectmode, ghost=1)");
      k.add_tool(new HotKey("G", ["ALT"], "Unghost Selection"), "spline.unhide(selmode=selectmode, ghost=1)");
      k.add(new HotKey("L", [], "Select Linked"), new FuncKeyHandler(function (ctx) {
        var mpos=ctx.keymap_mpos;
        var ret=ctx.spline.q.findnearest_vert(ctx.view2d, mpos, 55, undefined, ctx.view2d.edit_all_layers);
        console.log("select linked", ret);
        if (ret!=undefined) {
            var tool=new SelectLinkedOp(true, ctx.view2d.selectmode);
            tool.inputs.vertex_eid.setValue(ret[0].eid);
            tool.inputs.mode.setValue("SELECT");
            ctx.appstate.toolstack.exec_tool(tool);
        }
      }));
      k.add(new HotKey("L", ["SHIFT"], "Select Linked"), new FuncKeyHandler(function (ctx) {
        var mpos=ctx.keymap_mpos;
        var ret=ctx.spline.q.findnearest_vert(ctx.view2d, mpos, 55, undefined, ctx.view2d.edit_all_layers);
        if (ret!=undefined) {
            var tool=new SelectLinkedOp(true);
            tool.inputs.vertex_eid.setValue(ret[0].eid);
            tool.inputs.mode.setValue("deselect");
            ctx.appstate.toolstack.exec_tool(tool);
        }
      }));
      k.add_tool(new HotKey("B", [], "Toggle Break-Tangents"), "spline.toggle_break_tangents()");
      k.add_tool(new HotKey("B", ["SHIFT"], "Toggle Break-Curvature"), "spline.toggle_break_curvature()");
      var this2=this;
      function del_tool(ctx) {
        console.log("delete");
        if (this2.selectmode&SelMask.SEGMENT) {
            console.log("kill segments");
            var op=new DeleteSegmentOp();
            g_app_state.toolstack.exec_tool(op);
        }
        else 
          if (this2.selectmode&SelMask.FACE) {
            console.log("kill faces");
            var op=new DeleteFaceOp();
            g_app_state.toolstack.exec_tool(op);
        }
        else {
          console.log("kill verts");
          var op=new DeleteVertOp();
          g_app_state.toolstack.exec_tool(op);
        }
      }
      k.add(new HotKey("X", [], "Delete"), new FuncKeyHandler(del_tool));
      k.add(new HotKey("Delete", [], "Delete"), new FuncKeyHandler(del_tool));
      k.add(new HotKey("Backspace", [], "Delete"), new FuncKeyHandler(del_tool));
      k.add_tool(new HotKey("D", [], "Dissolve Vertices"), "spline.dissolve_verts()");
      k.add_tool(new HotKey("D", ["SHIFT"], "Duplicate"), "spline.duplicate_transform()");
      k.add_tool(new HotKey("F", [], "Create Face/Edge"), "spline.make_edge_face()");
      k.add_tool(new HotKey("E", [], "Split Segments"), "spline.split_edges()");
      k.add_tool(new HotKey("M", [], "Mirror Verts"), "spline.mirror_verts()");
      k.add_tool(new HotKey("C", [], "Circle Select"), "view2d.circle_select()");
      k.add(new HotKey("Z", [], "Toggle Only Render"), new FuncKeyHandler(function (ctx) {
        ctx.view2d.only_render^=1;
        window.redraw_viewport();
      }));
      k.add(new HotKey("W", [], "Tools Menu"), new FuncKeyHandler(function (ctx) {
        var mpos=ctx.keymap_mpos;
        mpos = ctx.screen.mpos;
        ctx.view2d.tools_menu(ctx, mpos);
      }));
    }
     tools_menu(ctx, mpos, view2d) {
      let ops=["spline.key_edges()", "spline.key_current_frame()", "spline.connect_handles()", "spline.disconnect_handles()", "spline.toggle_step_mode()", "spline.toggle_manual_handles()", "editor.paste_pose()", "editor.copy_pose()"];
      var menu=view2d.toolop_menu(ctx, "Tools", ops);
      view2d.call_menu(menu, view2d, mpos);
    }
     _get_spline() {
      return this.ctx.spline;
    }
     on_mousedown(event, localX, localY) {
      var spline=this.ctx.spline;
      var toolmode=this.ctx.view2d.toolmode;
      if (this.highlight_spline!==undefined) {
      }
      if (this.highlight_spline!==undefined&&this.highlight_spline!==spline) {
          var newpath;
          console.log("spline switch!");
          if (this.highlight_spline.is_anim_path) {
              newpath = "frameset.pathspline";
          }
          else {
            newpath = "frameset.drawspline";
          }
          console.log(spline._debug_id, this.highlight_spline._debug_id);
          console.log("new path!", G.active_splinepath, newpath);
          this.ctx.switch_active_spline(newpath);
          spline = this._get_spline();
          redraw_viewport();
      }
      if ("size" in spline&&spline[0]!=window.innerWidth&&spline[1]!=window.innerHeight) {
          spline.size[0] = window.innerWidth;
          spline.size[1] = window.innerHeight;
      }
      if (event.button==0) {
          var can_append=toolmode==ToolModes.APPEND;
          can_append = can_append&&(this.selectmode&(SelMask.VERTEX|SelMask.HANDLE));
          can_append = can_append&&spline.verts.highlight===undefined&&spline.handles.highlight===undefined;
          if (can_append) {
              var co=new Vector3([event.x, event.y, 0]);
              this.view2d.unproject(co);
              console.log(co);
              var op=new ExtrudeVertOp(co, this.ctx.view2d.extrude_mode);
              op.inputs.location.setValue(co);
              op.inputs.linewidth.setValue(this.ctx.view2d.default_linewidth);
              op.inputs.stroke.setValue(this.ctx.view2d.default_stroke);
              g_app_state.toolstack.exec_tool(op);
              redraw_viewport();
          }
          else {
            for (var i=0; i<spline.elists.length; i++) {
                var list=spline.elists[i];
                if (!(this.selectmode&list.type))
                  continue;
                
                if (list.highlight==undefined)
                  continue;
                var op=new SelectOneOp(list.highlight, !event.shiftKey, !(list.highlight.flag&SplineFlags.SELECT), this.selectmode, true);
                g_app_state.toolstack.exec_tool(op);
            }
          }
          this.start_mpos[0] = event.x;
          this.start_mpos[1] = event.y;
          this.start_mpos[2] = 0.0;
          this.mdown = true;
      }
    }
     ensure_paths_off() {
      if (g_app_state.active_splinepath!="frameset.drawspline") {
          this.highlight_spline = undefined;
          var spline=this.ctx.spline;
          g_app_state.switch_active_spline("frameset.drawspline");
          spline.clear_highlight();
          spline.solve();
          redraw_viewport();
      }
    }
    get  draw_anim_paths() {
      return this.ctx.view2d.draw_anim_paths;
    }
     findnearest(mpos, selectmask, limit, ignore_layers) {
      var frameset=this.ctx.frameset;
      var editor=this.ctx.view2d;
      var closest=[0, 0, 0];
      var mindis=1e+17;
      var found=false;
      if (!this.draw_anim_paths) {
          this.ensure_paths_off();
          var ret=this.ctx.spline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, ignore_layers);
          if (ret!=undefined) {
              return [this.ctx.spline, ret[0], ret[1]];
          }
          else {
            return undefined;
          }
      }
      var actspline=this.ctx.spline;
      var pathspline=this.ctx.frameset.pathspline;
      var drawspline=this.ctx.frameset.spline;
      var ret=drawspline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, ignore_layers);
      if (ret!=undefined&&ret[1]<limit) {
          mindis = ret[1]-(drawspline===actspline ? 3 : 0);
          found = true;
          closest[0] = drawspline;
          closest[1] = ret[0];
          closest[2] = mindis;
      }
      var ret=frameset.pathspline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, false);
      if (ret!=undefined) {
          ret[1]-=pathspline===actspline ? 2 : 0;
          if (ret[1]<limit&&ret[1]<mindis) {
              closest[0] = pathspline;
              closest[1] = ret[0];
              closest[2] = ret[1]-(pathspline===actspline ? 3 : 0);
              mindis = ret[1];
              found = true;
          }
      }
      if (!found)
        return undefined;
      return closest;
    }
     on_mousemove(event) {
      if (this.ctx==undefined)
        return ;
      var toolmode=this.ctx.view2d.toolmode;
      var selectmode=this.selectmode;
      var limit=selectmode&SelMask.SEGMENT ? 55 : 12;
      if (toolmode==ToolModes.SELECT)
        limit*=3;
      var spline=this.ctx.spline;
      spline.size = [window.innerWidth, window.innerHeight];
      this.mpos[0] = event.x, this.mpos[1] = event.y, this.mpos[2] = 0.0;
      var selectmode=this.selectmode;
      if (this.mdown) {
          this.mdown = false;
          let mpos=new Vector2();
          mpos.load(this.start_mpos);
          var op=new TranslateOp(mpos);
          console.log("start_mpos:", mpos);
          op.inputs.datamode.setValue(this.ctx.view2d.selectmode);
          op.inputs.edit_all_layers.setValue(this.ctx.view2d.edit_all_layers);
          var ctx=new Context();
          if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
              op.inputs.proportional.setValue(true);
              op.inputs.propradius.setValue(ctx.view2d.propradius);
          }
          g_app_state.toolstack.exec_tool(op);
          return ;
      }
      if (this.mdown)
        return ;
      var ret=this.findnearest([event.x, event.y], this.ctx.view2d.selectmode, limit, this.ctx.view2d.edit_all_layers);
      if (ret!=undefined&&typeof (ret[1])!="number"&&ret[2]!=SelMask.MULTIRES) {
          if (this.highlight_spline!=undefined) {
              for (var list of this.highlight_spline.elists) {
                  if (list.highlight!=undefined) {
                      redraw_element(list.highlight, this.view2d);
                  }
              }
          }
          if (ret[0]!==this.highlight_spline&&this.highlight_spline!=undefined) {
              this.highlight_spline.clear_highlight();
          }
          this.highlight_spline = ret[0];
          this.highlight_spline.clear_highlight();
          var list=this.highlight_spline.get_elist(ret[1].type);
          list.highlight = ret[1];
          redraw_element(list.highlight, this.view2d);
      }
      else {
        if (this.highlight_spline!==undefined) {
            for (var i=0; i<this.highlight_spline.elists.length; i++) {
                var list=this.highlight_spline.elists[i];
                if (list.highlight!=undefined) {
                    redraw_element(list.highlight, this.view2d);
                }
            }
            this.highlight_spline.clear_highlight();
        }
      }
    }
     on_mouseup(event) {
      var spline=this._get_spline();
      spline.size = [window.innerWidth, window.innerHeight];
      this.mdown = false;
    }
     do_alt_select(event, mpos, view2d) {

    }
     getKeyMaps() {
      if (this.keymap===undefined) {
          this.defineKeyMap();
      }
      return [this.keymap];
    }
    static  buildEditMenu() {
      var ops=["spline.select_linked(vertex_eid=active_vertex())", "view2d.circle_select()", "spline.toggle_select_all()", "spline.hide()", "spline.unhide()", "spline.connect_handles()", "spline.disconnect_handles()", "spline.duplicate_transform()", "spline.mirror_verts()", "spline.split_edges()", "spline.make_edge_face()", "spline.dissolve_verts()", "spline.delete_verts()", "spline.delete_segments()", "spline.delete_faces()", "spline.split_edges()", "spline.toggle_manual_handles()"];
      ops.reverse();
      return ops;
    }
     delete_menu(event) {
      var view2d=this.view2d;
      var ctx=new Context();
      var menu=this.gen_delete_menu(true);
      menu.close_on_right = true;
      menu.swap_mouse_button = 2;
      view2d.call_menu(menu, view2d, [event.x, event.y]);
    }
     dataLink(scene, getblock, getblock_us) {
      this.ctx = g_app_state.ctx;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(SplineToolMode);
  _es6_module.add_class(SplineToolMode);
  SplineToolMode = _es6_module.add_export('SplineToolMode', SplineToolMode);
  SplineToolMode.STRUCT = nstructjs.inherit(SplineToolMode, ToolMode)+`
}`;
  ToolMode.register(SplineToolMode);
}, '/dev/fairmotion/src/editors/viewport/toolmodes/splinetool.js');
es6_module_define('toolmode', ["../../../path.ux/scripts/util/simple_events.js", "../../../path.ux/scripts/pathux.js", "../../../core/eventdag.js"], function _toolmode_module(_es6_module) {
  var NodeBase=es6_import_item(_es6_module, '../../../core/eventdag.js', 'NodeBase');
  var KeyMap=es6_import_item(_es6_module, '../../../path.ux/scripts/util/simple_events.js', 'KeyMap');
  var nstructjs=es6_import_item(_es6_module, '../../../path.ux/scripts/pathux.js', 'nstructjs');
  const ToolModeFlags={}
  _es6_module.add_export('ToolModeFlags', ToolModeFlags);
  const ToolModes=[];
  _es6_module.add_export('ToolModes', ToolModes);
  ToolModes.map = {}
  class ToolMode extends NodeBase {
    
     constructor() {
      super();
      this.ctx = undefined;
      this.keymap = new KeyMap([]);
    }
     rightClickMenu(e, localX, localY, view2d) {

    }
     on_mousedown(e, localX, localY) {

    }
     on_mousemove(e, localX, localY) {

    }
     on_mouseup(e, localX, localY) {

    }
     do_select(event, mpos, view2d, do_multiple) {

    }
     do_alt_select(event, mpos, view2d) {

    }
     draw(view2d) {

    }
     onActive() {

    }
     onInactive() {

    }
     duplicate() {
      return new this.constructor();
    }
    static  contextOverride() {

    }
    static  buildEditMenu(container) {

    }
    static  buildSideBar(container) {

    }
    static  buildHeader(container) {

    }
    static  buildProperties(container) {

    }
     on_tick() {
      if (!this.ctx) {
          return ;
      }
    }
    static  register(cls) {
      if (cls.toolDefine===this.toolDefine) {
          throw new Error("you forgot to implement toolDefine()");
      }
      ToolModes.push(cls);
      ToolModes.map[cls.toolDefine().name] = cls;
      if (!cls.STRUCT) {
          console.warn("auto-generating STRUCT data for "+cls.name);
          cls.STRUCT = nstructjs.inherit(cls, ToolMode)+`\n}`;
          cls.prototype.loadSTRUCT = function (reader) {
            reader(this);
          };
      }
      nstructjs.register(cls);
    }
    static  nodedef() {
      let def=this.toolDefine();
      return {name: def.name, 
     uiName: def.uiName, 
     flag: def.nodeFlag, 
     icon: def.icon, 
     inputs: def.nodeInputs, 
     outputs: def.nodeOutputs}
    }
    static  toolDefine() {
      return {name: "", 
     uiName: "", 
     flag: 0, 
     icon: -1, 
     nodeInputs: {}, 
     nodeOutputs: {}, 
     nodeFlag: 0}
    }
     getKeyMaps() {
      return [this.keymap];
    }
     dataLink(scene, getblock, getblock_us) {

    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(ToolMode);
  _es6_module.add_class(ToolMode);
  ToolMode = _es6_module.add_export('ToolMode', ToolMode);
  ToolMode.STRUCT = `
ToolMode {
  
}`;
}, '/dev/fairmotion/src/editors/viewport/toolmodes/toolmode.js');
es6_module_define('struct', ["../path.ux/scripts/pathux.js", "../path.ux/scripts/util/parseutil.js"], function _struct_module(_es6_module) {
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var PUTL=es6_import(_es6_module, '../path.ux/scripts/util/parseutil.js');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Matrix4');
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Quat');
  let STRUCT=nstructjs.STRUCT;
  STRUCT = _es6_module.add_export('STRUCT', STRUCT);
  function profile_reset() {
  }
  profile_reset = _es6_module.add_export('profile_reset', profile_reset);
  function profile_report() {
  }
  profile_report = _es6_module.add_export('profile_report', profile_report);
  window.STRUCT_ENDIAN = false;
  nstructjs.binpack.STRUCT_ENDIAN = false;
  class arraybufferCompat extends Array {
     constructor() {
      super();
    }
     loadSTRUCT(reader) {
      reader(this);
      this.length = 0;
      let d=this._data;
      for (let i=0; i<d.length; i++) {
          this.push(d[i]);
      }
    }
  }
  _ESClass.register(arraybufferCompat);
  _es6_module.add_class(arraybufferCompat);
  arraybufferCompat = _es6_module.add_export('arraybufferCompat', arraybufferCompat);
  arraybufferCompat.STRUCT = `arraybuffer {
  _data : array(byte);
}`;
  nstructjs.register(arraybufferCompat);
  nstructjs.setDebugMode(false);
  nstructjs.setWarningMode(1);
  window.istruct = nstructjs.manager;
  function patch_dataref_type(buf) {
    return buf.replace(/dataref\([a-zA-Z0-9_$]+\)/g, "dataref");
  }
  class Mat4Compat extends Matrix4 {
     constructor() {
      super();
    }
    static  fromSTRUCT(reader) {
      let ret=new Matrix4();
      reader(ret);
      ret.$matrix = ret._matrix;
      delete ret._matrix;
      return ret;
    }
  }
  _ESClass.register(Mat4Compat);
  _es6_module.add_class(Mat4Compat);
  Mat4Compat.STRUCT = `
Mat4Compat {
  _matrix : mat4_intern | obj.$matrix;
}
`;
  class Mat4Intern  {
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(Mat4Intern);
  _es6_module.add_class(Mat4Intern);
  Mat4Intern = _es6_module.add_export('Mat4Intern', Mat4Intern);
  Mat4Intern.STRUCT = `
mat4_intern {
  m11 : float;
  m12 : float;
  m13 : float;
  m14 : float;
  m21 : float;
  m22 : float;
  m23 : float;
  m24 : float;
  m31 : float;
  m32 : float;
  m33 : float;
  m34 : float;
  m41 : float;
  m42 : float;
  m43 : float;
  m44 : float;
}
`;
  let vecpatches=[];
  function makeVecPatch(cls, size, name) {
    let dummycls={fromSTRUCT: function fromSTRUCT(reader) {
        let ret=new cls();
        reader(ret);
        return ret;
      }, 
    prototype: {}}
    let s="_"+name+"{\n";
    for (let i=0; i<size; i++) {
        s+=`  ${i} : float;\n`;
    }
    s+="}\n";
    dummycls.STRUCT = s;
    dummycls._structName = dummycls.name = name;
    vecpatches.push(dummycls);
  }
  makeVecPatch(Vector2, 2, "vec2");
  makeVecPatch(Vector3, 3, "vec3");
  makeVecPatch(Vector4, 4, "vec4");
  makeVecPatch(Vector4, 4, "quat");
  let _old=nstructjs.STRUCT.prototype.parse_structs;
  nstructjs.STRUCT.prototype.parse_structs = function (buf, defined_classes) {
    window._fstructs = buf;
    buf = patch_dataref_type(buf);
    let ret=_old.call(this, buf);
    if (!this.structs.dataref) {
        this.register(__dataref);
    }
    if (!this.structs.arraybuffer) {
        this.register(arraybufferCompat);
    }
    if (!this.structs.mat4) {
        console.warn("PATCHING MATRIX 4");
        this.register(Mat4Intern);
        this.register(Mat4Compat, "mat4");
    }
    for (let v of vecpatches) {
        if (!this.structs[v._structName]) {
            v.structName = v._structName;
            this.register(v, v._structName);
        }
    }
    return ret;
  }
  function gen_struct_str() {
    return nstructjs.write_scripts(istruct);
  }
  gen_struct_str = _es6_module.add_export('gen_struct_str', gen_struct_str);
  window.init_struct_packer = function () {
    
    init_toolop_structs();
    var errs=[];
    let buf="";
    for (var cls of defined_classes) {
        if (cls.STRUCT) {
            cls.STRUCT = patch_dataref_type(cls.STRUCT);
            buf+=cls.STRUCT+"\n";
        }
    }
    window._struct_scripts = buf;
    for (var cls of defined_classes) {
        if (cls.name=="Matrix4UI"||cls.name=="Matrix4"||cls.name=="Vector3"||cls.name=="Vector4"||cls.name=="Vector2") {
            continue;
        }
        if (cls.STRUCT) {
            cls.STRUCT = patch_dataref_type(cls.STRUCT);
        }
        try {
          if (cls.STRUCT!==undefined) {
              istruct.register(cls);
          }
        }
        catch (err) {
            if (__instance_of(err, PUTL.PUTLParseError)) {
                console.log("cls.structName: ", cls.structName);
                print_stack(err);
                console.log("Error parsing struct: "+err.message);
            }
            else {
              errs.push([err, cls]);
            }
        }
    }
    for (var i=0; i<errs.length; i++) {
        let err=errs[i][0];
        let cls=errs[i][1];
        console.log(cls.STRUCT);
        print_stack(err);
        if (i==errs.length-1)
          throw err;
    }
    window.safe_global = {}
    for (var k in window) {
        if (k.search("bar")>=0||k=="localStorage"||(k.startsWith("on")&&k[2]!="l")) {
            continue;
        }
        if (k.startsWith("webkit")) {
            continue;
        }
        safe_global[k] = window[k];
    }
  }
}, '/dev/fairmotion/src/core/struct.js');
es6_module_define('curve', ["./curvebase.js"], function _curve_module(_es6_module) {
  "use strict";
  var $rets_2n55_derivative;
  var $rets_wIhz_normal;
  class ClothoidInterface  {
    static  evaluate(p1, p2, t1, t2, k1, k2, s, cdata) {

    }
    static  derivative(p1, p2, t1, t2, k1, k2, s, cdata) {
      var df=0.0001;
      var a=this.evaluate(p1, p2, t1, t2, k1, k2, s, cdata);
      var b=this.evaluate(p1, p2, t1, t2, k1, k2, s+df, cdata);
      b.sub(a).mulScalar(1.0/df);
      return $rets_2n55_derivative.next().load(b);
    }
    static  normal(p1, p2, t1, t2, k1, k2, s, cdata) {
      var df=0.0001;
      var a=this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
      var b=this.derivative(p1, p2, t1, t2, k1, k2, s+df, cdata);
      b.sub(a).mulScalar(1.0/df);
      return $rets_wIhz_normal.next().load(b);
    }
    static  curvature(p1, p2, t1, t2, k1, k2, s, cdata) {
      var dv1=this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
      var dv2=this.normal(p1, p2, t1, t2, k1, k2, s, cdata);
      return (dv1[0]*dv2[1]-dv2[1]*dv1[0])/Math.pow(dv1.dot(dv1), 3.0/2.0);
    }
    static  curvature_dv(p1, p2, t1, t2, k1, k2, s, cdata) {
      var df=0.0001;
      var a=this.curvature(p1, p2, t1, t2, k1, k2, s, cdata);
      var b=this.curvature(p1, p2, t1, t2, k1, k2, s+df, cdata);
      return (b-a)/df;
    }
    static  curvature_dv2(p1, p2, t1, t2, k1, k2, s, cdata) {
      var df=0.0001;
      var a=this.curvature_dv(p1, p2, t1, t2, k1, k2, s, cdata);
      var b=this.curvature_dv(p1, p2, t1, t2, k1, k2, s+df, cdata);
      return (b-a)/df;
    }
    static  closest_point(p1, p2, t1, t2, k1, k2, p, cdata) {

    }
    static  update(p1, p2, t1, t2, k1, k2, s, cdata) {

    }
  }
  var $rets_2n55_derivative=cachering.fromConstructor(Vector2, 16);
  var $rets_wIhz_normal=cachering.fromConstructor(Vector2, 16);
  _ESClass.register(ClothoidInterface);
  _es6_module.add_class(ClothoidInterface);
  var CurveInterfaces=es6_import_item(_es6_module, './curvebase.js', 'CurveInterfaces');
  var CurveTypes=es6_import_item(_es6_module, './curvebase.js', 'CurveTypes');
  CurveInterfaces[CurveTypes.CLOTHOID] = ClothoidInterface;
}, '/dev/fairmotion/src/curve/curve.js');
es6_module_define('curvebase', [], function _curvebase_module(_es6_module) {
  var CurveTypes={CLOTHOID: 1}
  CurveTypes = _es6_module.add_export('CurveTypes', CurveTypes);
  var CurveFlags={SELECT: 1, 
   UPDATE: 2}
  CurveFlags = _es6_module.add_export('CurveFlags', CurveFlags);
  var CurveInterfaces={}
  CurveInterfaces = _es6_module.add_export('CurveInterfaces', CurveInterfaces);
  class CurveData  {
    
    
     constructor(type) {
      this.type = type;
      this.flag = 0;
      this.length = 0;
      this.cfi = CurveInterfaces[type];
    }
     update() {
      this.flag|=CurveFlags.UPDATE;
    }
     copy() {
      var ret=new CurveData(this.type);
      ret.flag = this.flag;
      ret.length = this.length;
      ret.cfi = this.cfi;
      ret.update();
      return ret;
    }
  }
  _ESClass.register(CurveData);
  _es6_module.add_class(CurveData);
  CurveData = _es6_module.add_export('CurveData', CurveData);
  var $rets_LxMz_derivative;
  var $rets_dBy__normal;
  class CurveInterface  {
    static  evaluate(p1, p2, t1, t2, k1, k2, s, cdata) {

    }
    static  derivative(p1, p2, t1, t2, k1, k2, s, cdata) {
      var df=0.0001;
      var a=this.evaluate(p1, p2, t1, t2, k1, k2, s, cdata);
      var b=this.evaluate(p1, p2, t1, t2, k1, k2, s+df, cdata);
      b.sub(a).mulScalar(1.0/df);
      return $rets_LxMz_derivative.next().load(b);
    }
    static  normal(p1, p2, t1, t2, k1, k2, s, cdata) {
      var df=0.0001;
      var a=this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
      var b=this.derivative(p1, p2, t1, t2, k1, k2, s+df, cdata);
      b.sub(a).mulScalar(1.0/df);
      return $rets_dBy__normal.next().load(b);
    }
    static  curvature(p1, p2, t1, t2, k1, k2, s, cdata) {
      var dv1=this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
      var dv2=this.normal(p1, p2, t1, t2, k1, k2, s, cdata);
      return (dv1[0]*dv2[1]-dv2[1]*dv1[0])/Math.pow(dv1.dot(dv1), 3.0/2.0);
    }
    static  curvature_dv(p1, p2, t1, t2, k1, k2, s, cdata) {
      var df=0.0001;
      var a=this.curvature(p1, p2, t1, t2, k1, k2, s, cdata);
      var b=this.curvature(p1, p2, t1, t2, k1, k2, s+df, cdata);
      return (b-a)/df;
    }
    static  curvature_dv2(p1, p2, t1, t2, k1, k2, s, cdata) {
      var df=0.0001;
      var a=this.curvature_dv(p1, p2, t1, t2, k1, k2, s, cdata);
      var b=this.curvature_dv(p1, p2, t1, t2, k1, k2, s+df, cdata);
      return (b-a)/df;
    }
    static  closest_point(p1, p2, t1, t2, k1, k2, p, cdata) {

    }
    static  update(p1, p2, t1, t2, k1, k2, s, cdata) {

    }
  }
  var $rets_LxMz_derivative=cachering.fromConstructor(Vector2, 16);
  var $rets_dBy__normal=cachering.fromConstructor(Vector2, 16);
  _ESClass.register(CurveInterface);
  _es6_module.add_class(CurveInterface);
}, '/dev/fairmotion/src/curve/curvebase.js');
es6_module_define('spline_math', ["../config/config.js", "./spline_math_hermite.js", "../wasm/native_api.js"], function _spline_math_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  var FEPS=1e-18;
  var PI=Math.PI;
  var sin=Math.sin, acos=Math.acos, asin=Math.asin, atan2=Math.atan2, sqrt=Math.sqrt;
  var cos=Math.cos, pow=Math.pow, abs=Math.abs;
  var SPI2=Math.sqrt(PI/2);
  var math=es6_import(_es6_module, './spline_math_hermite.js');
  var spiraltheta=math.spiraltheta;
  spiraltheta = _es6_module.add_export('spiraltheta', spiraltheta);
  var spiralcurvature=math.spiralcurvature;
  spiralcurvature = _es6_module.add_export('spiralcurvature', spiralcurvature);
  var spiralcurvature_dv=math.spiralcurvature_dv;
  spiralcurvature_dv = _es6_module.add_export('spiralcurvature_dv', spiralcurvature_dv);
  var approx=math.approx;
  approx = _es6_module.add_export('approx', approx);
  var INT_STEPS=math.INT_STEPS;
  INT_STEPS = _es6_module.add_export('INT_STEPS', INT_STEPS);
  var ORDER=math.ORDER;
  ORDER = _es6_module.add_export('ORDER', ORDER);
  var DISABLE_SOLVE=es6_import_item(_es6_module, '../config/config.js', 'DISABLE_SOLVE');
  function do_solve_nacl(sflags, spline, steps, gk, return_promise) {
    if (DISABLE_SOLVE)
      return ;
    if (window.common!=undefined&&window.common.naclModule!=undefined) {
        var draw_id=window.push_solve(spline);
        return window.nacl_do_solve(sflags, spline, steps, gk, return_promise, draw_id);
    }
    else {
      return math.do_solve.apply(this, arguments);
    }
  }
  var native_api=es6_import(_es6_module, '../wasm/native_api.js');
  function do_solve() {
    if (config.USE_NACL) {
        return do_solve_nacl.apply(this, arguments);
    }
    else 
      if (!DEBUG.no_native&&config.USE_WASM&&native_api.isReady()) {
        return native_api.do_solve.apply(this, arguments);
    }
    else {
      return math.do_solve.apply(this, arguments);
    }
  }
  do_solve = _es6_module.add_export('do_solve', do_solve);
  var KSCALE=ORDER+1;
  KSCALE = _es6_module.add_export('KSCALE', KSCALE);
  var KANGLE=ORDER+2;
  KANGLE = _es6_module.add_export('KANGLE', KANGLE);
  var KSTARTX=ORDER+3;
  KSTARTX = _es6_module.add_export('KSTARTX', KSTARTX);
  var KSTARTY=ORDER+4;
  KSTARTY = _es6_module.add_export('KSTARTY', KSTARTY);
  var KSTARTZ=ORDER+5;
  KSTARTZ = _es6_module.add_export('KSTARTZ', KSTARTZ);
  var KTOTKS=ORDER+6;
  KTOTKS = _es6_module.add_export('KTOTKS', KTOTKS);
  var eval_curve_vs=cachering.fromConstructor(Vector3, 64);
  var _eval_start=eval_curve_vs.next();
  function eval_curve(s, v1, v2, ks, order, angle_only, no_update) {
    var start=_eval_start;
    if (order==undefined)
      order = ORDER;
    s*=0.99999999;
    var eps=1e-09;
    var ang, scale, start;
    if (!no_update) {
        var start=approx(-0.5+eps, ks, order);
        var end=approx(0.5-eps, ks, order);
        end.sub(start);
        var a1=atan2(end[0], end[1]);
        var vec=eval_curve_vs.next();
        vec.load(v2).sub(v1);
        var a2=atan2(vec[0], vec[1]);
        ang = a2-a1;
        scale = vec.vectorLength()/end.vectorLength();
        ks[KSCALE] = scale;
        ks[KANGLE] = ang;
        ks[KSTARTX] = start[0];
        ks[KSTARTY] = start[1];
        ks[KSTARTZ] = start[2];
    }
    else {
      ang = ks[KANGLE];
      scale = ks[KSCALE];
      start[0] = ks[KSTARTX];
      start[1] = ks[KSTARTY];
      start[2] = ks[KSTARTZ];
    }
    if (!angle_only) {
        var co=approx(s, ks, order);
        co.sub(start).rot2d(-ang).mulScalar(scale).add(v1);
        return co;
    }
  }
  eval_curve = _es6_module.add_export('eval_curve', eval_curve);
  
}, '/dev/fairmotion/src/curve/spline_math.js');
es6_module_define('spline_math_hermite', ["../path.ux/scripts/util/vectormath.js", "./solver.js", "../core/toolops_api.js", "./spline_base.js"], function _spline_math_hermite_module(_es6_module) {
  "use strict";
  var SplineFlags=es6_import_item(_es6_module, './spline_base.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, './spline_base.js', 'SplineTypes');
  var solver=es6_import_item(_es6_module, './solver.js', 'solver');
  var constraint=es6_import_item(_es6_module, './solver.js', 'constraint');
  var ModalStates=es6_import_item(_es6_module, '../core/toolops_api.js', 'ModalStates');
  var FEPS=1e-18;
  var PI=Math.PI;
  var sin=Math.sin, acos=Math.acos, asin=Math.asin, atan2=Math.atan2, sqrt=Math.sqrt;
  var cos=Math.cos, pow=Math.pow, abs=Math.abs;
  var SPI2=Math.sqrt(PI/2);
  var INCREMENTAL=true;
  var ORDER=4;
  ORDER = _es6_module.add_export('ORDER', ORDER);
  var KSCALE=ORDER+1;
  KSCALE = _es6_module.add_export('KSCALE', KSCALE);
  var KANGLE=ORDER+2;
  KANGLE = _es6_module.add_export('KANGLE', KANGLE);
  var KSTARTX=ORDER+3;
  KSTARTX = _es6_module.add_export('KSTARTX', KSTARTX);
  var KSTARTY=ORDER+4;
  KSTARTY = _es6_module.add_export('KSTARTY', KSTARTY);
  var KSTARTZ=ORDER+5;
  KSTARTZ = _es6_module.add_export('KSTARTZ', KSTARTZ);
  window.KSCALE = KSCALE;
  var KTOTKS=ORDER+6;
  KTOTKS = _es6_module.add_export('KTOTKS', KTOTKS);
  var INT_STEPS=4;
  INT_STEPS = _es6_module.add_export('INT_STEPS', INT_STEPS);
  function set_int_steps(steps) {
    INT_STEPS = steps;
  }
  set_int_steps = _es6_module.add_export('set_int_steps', set_int_steps);
  function get_int_steps(steps) {
    return INT_STEPS;
  }
  get_int_steps = _es6_module.add_export('get_int_steps', get_int_steps);
  var _approx_cache_vs=cachering.fromConstructor(Vector3, 32);
  var mmax=Math.max, mmin=Math.min;
  var mfloor=Math.floor, mceil=Math.ceil, abs=Math.abs, sqrt=Math.sqrt, sin=Math.sin, cos=Math.cos;
  var polytheta_spower=function polytheta_spower(s, ks, order) {
    var s2=s*s, s3=s2*s, s4=s3*s, s5=s4*s, s6=s5*s, s7=s6*s, s8=s7*s, s9=s8*s;
    switch (order) {
      case 2:
        var k1=ks[0], k2=ks[1];
        return (-((s-2)*k1-k2*s)*s)/2.0;
      case 4:
        var k1=ks[0], dv1_k1=ks[1], dv1_k2=ks[2], k2=ks[3];
        return (((((3*s-4)*dv1_k2-6*(s-2)*k2)*s+(3*s2-8*s+6)*dv1_k1)*s+6*(s3-2*s2+2)*k1)*s)/12;
      case 6:
        var k1=ks[0], dv1_k1=ks[1], dv2_k1=ks[2], dv2_k2=ks[3], dv1_k2=ks[4], k2=ks[5];
        return (-((((60*dv1_k2*s2-168*dv1_k2*s+120*dv1_k2-10*dv2_k2*s2+24*dv2_k2*s-15*dv2_k2-120*k2*s2+360*k2*s-300*k2)*s+(10*s3-36*s2+45*s-20)*dv2_k1)*s+12*(5*s4-16*s3+15*s2-5)*dv1_k1)*s+60*(2*s5-6*s4+5*s3-2)*k1)*s)/120;
    }
  }
  var polycurvature_spower=function polycurvature_spower(s, ks, order) {
    var k1=ks[0], dv1_k1=ks[1], dv2_k1=ks[2], dv2_k2=ks[3], dv1_k2=ks[4], k2=ks[5];
    var s2=s*s, s3=s2*s, s4=s3*s, s5=s4*s, s6=s5*s, s7=s6*s, s8=s7*s, s9=s8*s;
    switch (order) {
      case 2:
        var k1=ks[0], k2=ks[1];
        return -((s-1)*k1-k2*s);
      case 4:
        var k1=ks[0], dv1_k1=ks[1], dv1_k2=ks[2], k2=ks[3];
        return (((s-1)*dv1_k1+dv1_k2*s)*(s-1)-(2*s-3)*k2*s)*s+(2*s+1)*(s-1)*(s-1)*k1;
      case 6:
        return (-((((((s-1)*dv2_k1-dv2_k2*s)*(s-1)+2*(3*s-4)*dv1_k2*s)*s+2*(3*s+1)*(s-1)*(s-1)*dv1_k1)*(s-1)-2*(6*s2-15*s+10)*k2*s2)*s+2*(6*s2+3*s+1)*(s-1)*(s-1)*(s-1)*k1))/2.0;
    }
  }
  var polycurvature_dv_spower=function polycurvature_spower(s, ks, order) {
    var s2=s*s, s3=s2*s, s4=s3*s, s5=s4*s, s6=s5*s, s7=s6*s, s8=s7*s, s9=s8*s;
    switch (order) {
      case 2:
        var k1=ks[0], k2=ks[1];
        return -(k1-k2);
      case 4:
        var k1=ks[0], dv1_k1=ks[1], dv1_k2=ks[2], k2=ks[3];
        return (6*(k1-k2)*(s-1)+(3*s-2)*dv1_k2)*s+(3*s-1)*(s-1)*dv1_k1;
      case 6:
        var k1=ks[0], dv1_k1=ks[1], dv2_k1=ks[2], dv2_k2=ks[3], dv1_k2=ks[4], k2=ks[5];
        return (-(((2*(30*(k1-k2)*(s-1)*(s-1)+(5*s-6)*(3*s-2)*dv1_k2)-(5*s-3)*(s-1)*dv2_k2)*s+(5*s-2)*(s-1)*(s-1)*dv2_k1)*s+2*(5*s+1)*(3*s-1)*(s-1)*(s-1)*dv1_k1))/2.0;
    }
  }
  var spower_funcs=[polytheta_spower, polycurvature_spower, polycurvature_dv_spower];
  spower_funcs = _es6_module.add_export('spower_funcs', spower_funcs);
  var approx_ret_cache=cachering.fromConstructor(Vector3, 42);
  var abs=Math.abs;
  var mmax=Math.max, mmin=Math.min;
  es6_import(_es6_module, '../path.ux/scripts/util/vectormath.js');
  var acache=[new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()];
  var acur=0;
  var eval_curve_vs=cachering.fromConstructor(Vector3, 64);
  var _eval_start=new Vector3();
  function approx(s1, ks, order, dis, steps) {
    s1*=1.0-1e-07;
    if (steps==undefined)
      steps = INT_STEPS;
    var s=0, ds=s1/steps;
    var ds2=ds*ds, ds3=ds2*ds, ds4=ds3*ds;
    var ret=approx_ret_cache.next();
    ret[0] = ret[1] = ret[2] = 0.0;
    var x=0, y=0;
    var k1=ks[0], dv1_k1=ks[1], dv1_k2=ks[2], k2=ks[3];
    for (var i=0; i<steps; i++) {
        var st=s+0.5;
        var s2=st*st, s3=st*st*st, s4=s2*s2, s5=s4*st, s6=s5*st, s7=s6*st, s8=s7*st, s9=s8*st, s10=s9*st;
        var th=(((((3*st-4)*dv1_k2-6*(st-2)*k2)*st+(3*s2-8*st+6)*dv1_k1)*st+6*(s3-2*s2+2)*k1)*st)/12;
        var dx=sin(th), dy=cos(th);
        var kt=(((st-1)*dv1_k1+dv1_k2*st)*(st-1)-(2*st-3)*k2*st)*st+(2*st+1)*(st-1)*(st-1)*k1;
        var dkt=(6*(k1-k2)*(st-1)+(3*st-2)*dv1_k2)*st+(3*st-1)*(st-1)*dv1_k1;
        var dk2t=(6*(k1-k2)*((st+0.0001)-1)+(3*(st+0.0001)-2)*dv1_k2)*(st+0.0001)+(3*(st+0.0001)-1)*((st+0.0001)-1)*dv1_k1;
        dk2t = (dk2t-dkt)/(0.0001);
        var kt2=kt*kt, kt3=kt*kt*kt;
        x+=((5*(4*((dy*dkt-kt2*dx)*ds2+3*(dy*kt*ds+2*dx))+((dk2t-kt3)*dy-3*dkt*kt*dx)*ds3)-(((4*dk2t-kt3)*kt+3*dkt*dkt)*dx+6*dy*dkt*kt2)*ds4)*ds)/120;
        y+=(-(5*(4*((dy*kt2+dkt*dx)*ds2-3*(2*dy-kt*dx*ds))+((dk2t-kt3)*dx+3*dy*dkt*kt)*ds3)+(((4*dk2t-kt3)*kt+3*dkt*dkt)*dy-6*dkt*kt2*dx)*ds4)*ds)/120;
        s+=ds;
    }
    ret[0] = x;
    ret[1] = y;
    return ret;
  }
  approx = _es6_module.add_export('approx', approx);
  var spiraltheta=polytheta_spower;
  spiraltheta = _es6_module.add_export('spiraltheta', spiraltheta);
  var spiralcurvature=polycurvature_spower;
  spiralcurvature = _es6_module.add_export('spiralcurvature', spiralcurvature);
  var spiralcurvature_dv=polycurvature_dv_spower;
  spiralcurvature_dv = _es6_module.add_export('spiralcurvature_dv', spiralcurvature_dv);
  var ORDER=4;
  ORDER = _es6_module.add_export('ORDER', ORDER);
  const con_cache={list: [], 
   used: 0}
  function build_solver(spline, order, goal_order, gk, do_basic, update_verts) {
    var slv=new solver();
    con_cache.used = 0;
    if (order===undefined)
      order = ORDER;
    if (gk===undefined)
      gk = 1.0;
    var UPDATE=SplineFlags.UPDATE;
    for (let seg of spline.segments) {
        let ok=(seg.v1.flag&SplineFlags.UPDATE)&&(seg.v2.flag&SplineFlags.UPDATE);
        for (let i=0; !ok&&i<2; i++) {
            let v=i ? seg.v2 : seg.v1;
            for (let seg2 of v.segments) {
                let ok2=(seg2.v1.flag&SplineFlags.UPDATE)&&(seg2.v2.flag&SplineFlags.UPDATE);
                if (ok2) {
                    ok = true;
                    break;
                }
            }
        }
        if (ok) {
            for (var j=0; j<KTOTKS; j++) {
                seg._last_ks[j] = seg.ks[j];
            }
            seg.flag|=SplineFlags.TEMP_TAG;
            slv.edge_segs.push(seg);
        }
        else {
          seg.flag&=~SplineFlags.TEMP_TAG;
        }
    }
    function hard_tan_c(params) {
      var seg=params[0], tan=params[1], s=params[2];
      var dv=seg.derivative(s, order, undefined, true);
      dv.normalize();
      var a1=Math.atan2(tan[0], tan[1]);
      var a2=Math.atan2(dv[0], dv[1]);
      var diff=Math.abs(a1-a2);
      return abs(dv.vectorDistance(tan));
    }
    function tan_c(params) {
      var seg1=params[0], seg2=params[1];
      var v, s1=0, s2=0;
      if (seg1.v1==seg2.v1||seg1.v1==seg2.v2)
        v = seg1.v1;
      else 
        if (seg1.v2==seg2.v1||seg1.v2==seg2.v2)
        v = seg1.v2;
      else 
        console.trace("EVIL INCARNATE!");
      var eps=0.0001;
      s1 = v==seg1.v1 ? eps : 1.0-eps;
      s2 = v==seg2.v1 ? eps : 1.0-eps;
      var t1=seg1.derivative(s1, order, undefined, true);
      var t2=seg2.derivative(s2, order, undefined, true);
      t1.normalize();
      t2.normalize();
      if (seg1.v1.eid==seg2.v1.eid||seg1.v2.eid==seg2.v2.eid) {
          t1.negate();
      }
      var d=t1.dot(t2);
      d = mmax(mmin(d, 1.0), -1.0);
      return acos(d);
      var ret=abs(t1.vectorDistance(t2));
      return ret;
    }
    function handle_curv_c(params) {
      if (order<4)
        return 0;
      var seg1=params[0], seg2=params[1];
      var h1=params[2], h2=params[3];
      var len1=seg1.ks[KSCALE]-h1.vectorDistance(seg1.handle_vertex(h1));
      var len2=seg2.ks[KSCALE]-h2.vectorDistance(seg2.handle_vertex(h2));
      var k1i=h1==seg1.h1 ? 1 : order-2;
      var k2i=h2==seg2.h1 ? 1 : order-2;
      var k1=(len1!=0.0 ? 1.0/len1 : 0.0)*seg1.ks[KSCALE];
      var k2=(len2!=0.0 ? 1.0/len2 : 0.0)*seg2.ks[KSCALE];
      var s1=seg1.ks[k1i]<0.0 ? -1 : 1;
      var s2=seg2.ks[k2i]<0.0 ? -1 : 1;
      if (isNaN(k1)||isNaN(k2)) {
          console.log("NaN 2!");
          return 0;
      }
      console.log(k1, k2);
      if (abs(seg1.ks[k1i])<k1)
        seg1.ks[k1i] = k1*s1;
      if (abs(seg2.ks[k2i])<k2)
        seg2.ks[k2i] = k2*s2;
      return 0;
    }
    function copy_c(params) {
      var v=params[1], seg=params[0];
      var s1=v===seg.v1 ? 0 : order-1;
      var s2=v===seg.v1 ? order-1 : 0;
      seg.ks[s1]+=(seg.ks[s2]-seg.ks[s1])*gk*0.5;
      return 0.0;
    }
    function get_ratio(seg1, seg2) {
      var ratio=seg1.ks[KSCALE]/seg2.ks[KSCALE];
      if (seg2.ks[KSCALE]==0.0) {
          return 100000.0;
      }
      if (ratio>1.0)
        ratio = 1.0/ratio;
      if (isNaN(ratio)) {
          console.log("NaN 3!");
          ratio = 0.5;
      }
      return Math.pow(ratio, 2.0);
    }
    function curv_c_spower(params) {
      var seg1=params[0], seg2=params[1];
      var v, s1, s2;
      seg1.evaluate(0.5);
      seg2.evaluate(0.5);
      if (seg1.v1==seg2.v1||seg1.v1==seg2.v2)
        v = seg1.v1;
      else 
        if (seg1.v2==seg2.v1||seg1.v2==seg2.v2)
        v = seg1.v2;
      else 
        console.trace("EVIL INCARNATE!");
      var ratio=get_ratio(seg1, seg2);
      var mfac=ratio*gk*0.7;
      var s1=v===seg1.v1 ? 0 : order-1;
      var s2=v===seg2.v1 ? 0 : order-1;
      var sz1=seg1.ks[KSCALE];
      var sz2=seg2.ks[KSCALE];
      var k2sign=s1==s2 ? -1.0 : 1.0;
      var ret=0.0;
      for (var i=0; i<1; i++) {
          var s1=v===seg1.v1 ? i : order-1-i;
          var s2=v===seg2.v1 ? i : order-1-i;
          var k1=seg1.ks[s1]/sz1;
          var k2=k2sign*seg2.ks[s2]/sz2;
          var goalk=(k1+k2)*0.5;
          ret+=abs(k1-goalk)+abs(k2-goalk);
          seg1.ks[s1]+=(goalk*sz1-seg1.ks[s1])*mfac;
          seg2.ks[s2]+=(k2sign*goalk*sz2-seg2.ks[s2])*mfac;
      }
      return ret*5.0;
    }
    function curv_c_spower_basic(params) {
      var seg1=params[0], seg2=params[1];
      var v, s1=0, s2=0;
      seg1.evaluate(0.5);
      seg2.evaluate(0.5);
      if (seg1.v1==seg2.v1||seg1.v1==seg2.v2)
        v = seg1.v1;
      else 
        if (seg1.v2==seg2.v1||seg1.v2==seg2.v2)
        v = seg1.v2;
      else 
        console.trace("EVIL INCARNATE!");
      var ratio=get_ratio(seg1, seg2);
      var mfac=ratio*gk*0.7;
      var s1=v===seg1.v1 ? 0 : order-1;
      var s2=v===seg2.v1 ? 0 : order-1;
      var sz1=seg1.ks[KSCALE];
      var sz2=seg2.ks[KSCALE];
      var k2sign=s1==s2 ? -1.0 : 1.0;
      var ret=0.0;
      var len=Math.floor(order/2);
      for (var i=0; i<1; i++) {
          var s1=v===seg1.v1 ? i : order-1-i;
          var s2=v===seg2.v1 ? i : order-1-i;
          var k1=seg1.ks[s1]/sz1;
          var k2=k2sign*seg2.ks[s2]/sz2;
          var goalk=(k1+k2)*0.5;
          ret+=abs(k1-goalk)+abs(k2-goalk);
          if (i==0) {
              seg1.ks[s1]+=(goalk*sz1-seg1.ks[s1])*mfac;
              seg2.ks[s2]+=(k2sign*goalk*sz2-seg2.ks[s2])*mfac;
          }
          else 
            if (i==1) {
              seg1.ks[s1] = seg1.ks[order-1]-seg1.ks[0];
              seg2.ks[s2] = seg2.ks[order-1]-seg2.ks[0];
          }
          else {
            seg1.ks[s1] = seg2.ks[s2] = 0.0;
          }
      }
      return ret;
    }
    var curv_c=do_basic ? curv_c_spower_basic : curv_c_spower;
    for (let h of spline.handles) {
        var seg=h.owning_segment;
        var v=seg.handle_vertex(h);
        let bad=!h.use;
        bad = bad||seg.v1.vectorDistance(seg.v2)<2;
        bad = bad||!((v.flag)&SplineFlags.UPDATE);
        bad = bad||!h.owning_vertex;
        if (bad) {
            continue;
        }
        var tan1=new Vector3(h).sub(seg.handle_vertex(h)).normalize();
        if (h===seg.h2)
          tan1.negate();
        if (isNaN(tan1.dot(tan1))||tan1.dot(tan1)===0.0) {
            console.log("NaN 4!");
            continue;
        }
        var s=h===seg.h1 ? 0 : 1;
        var do_tan=!((h.flag)&SplineFlags.BREAK_TANGENTS);
        do_tan = do_tan&&!(h.flag&SplineFlags.AUTO_PAIRED_HANDLE);
        if (do_tan) {
            var tc=new constraint("hard_tan_c", 0.25, [seg.ks], order, hard_tan_c, [seg, tan1, s]);
            tc.k2 = 1.0;
            if (update_verts)
              update_verts.add(h);
            slv.add(tc);
        }
        if (h.hpair===undefined)
          continue;
        var ss1=seg, h2=h.hpair, ss2=h2.owning_segment;
        if ((h.flag&SplineFlags.AUTO_PAIRED_HANDLE)&&!((seg.handle_vertex(h).flag&SplineFlags.BREAK_TANGENTS))) {
            var tc=new constraint("tan_c", 0.3, [ss1.ks, ss2.ks], order, tan_c, [ss1, ss2]);
            tc.k2 = 0.8;
            if (update_verts)
              update_verts.add(h);
            slv.add(tc);
        }
        var cc=new constraint("curv_c", 1, [ss1.ks], order, curv_c, [ss1, ss2, h, h2]);
        slv.add(cc);
        var cc=new constraint("curv_c", 1, [ss2.ks], order, curv_c, [ss1, ss2, h, h2]);
        slv.add(cc);
        if (update_verts)
          update_verts.add(h);
    }
    var limits={v_curve_limit: 12, 
    v_tan_limit: 1}
    var manual_w=0.08;
    var manual_w_2=0.6;
    for (let v of spline.verts) {
        let bad=!(v.flag&SplineFlags.UPDATE);
        bad = bad||!(v.flag&SplineFlags.USE_HANDLES);
        bad = bad||(v.segments.length!==1);
        if (bad) {
            continue;
        }
        let ss1=v.segments[0];
        let h=ss1.handle(v);
        let tan=new Vector3(h).sub(v).normalize();
        let s=v===ss1.v1 ? 0.0 : 1.0;
        if (v===ss1.v2) {
            tan.negate();
        }
        let tc=new constraint("hard_tan_c", manual_w, [ss1.ks], order, hard_tan_c, [ss1, tan, s]);
        tc.k2 = manual_w_2;
        slv.add(tc);
        if (update_verts)
          update_verts.add(v);
    }
    for (let v of spline.verts) {
        let bad=!(v.flag&SplineFlags.UPDATE);
        bad = bad||(v.segments.length!==2);
        if (bad) {
            continue;
        }
        let ss1=v.segments[0], ss2=v.segments[1];
        for (let j=0; j<v.segments.length; j++) {
            let seg=v.segments[j];
            if (seg.v1.vectorDistance(seg.v2)<2) {
                bad = true;
            }
        }
        if (bad) {
            continue;
        }
        let mindis=Math.min(ss1.other_vert(v).vectorDistance(v), ss2.other_vert(v).vectorDistance(v));
        let maxdis=Math.max(ss1.other_vert(v).vectorDistance(v), ss2.other_vert(v).vectorDistance(v));
        if (bad&&DEBUG.degenerate_geometry) {
            console.log("Ignoring!");
        }
        if (!(v.flag&(SplineFlags.BREAK_TANGENTS|SplineFlags.USE_HANDLES))) {
            let tc=new constraint("tan_c", 0.5, [ss2.ks], order, tan_c, [ss1, ss2]);
            tc.k2 = 0.8;
            slv.add(tc);
            tc = new constraint("tan_c", 0.5, [ss1.ks], order, tan_c, [ss2, ss1]);
            tc.k2 = 0.8;
            slv.add(tc);
            if (update_verts)
              update_verts.add(v);
        }
        else 
          if (!(v.flag&SplineFlags.BREAK_TANGENTS)) {
            let h=ss1.handle(v);
            let tan=new Vector3(h).sub(v).normalize();
            let s=v===ss1.v1 ? 0.0 : 1.0;
            if (v===ss1.v2) {
                tan.negate();
            }
            let tc=new constraint("hard_tan_c", manual_w, [ss1.ks], order, hard_tan_c, [ss1, tan, s]);
            tc.k2 = manual_w_2;
            slv.add(tc);
            h = ss2.handle(v);
            tan = new Vector3(h).sub(v).normalize();
            s = v===ss2.v1 ? 0.0 : 1.0;
            if (v===ss2.v2) {
                tan.negate();
            }
            tc = new constraint("hard_tan_c", manual_w, [ss2.ks], order, hard_tan_c, [ss2, tan, s]);
            tc.k2 = manual_w_2;
            slv.add(tc);
            if (update_verts)
              update_verts.add(v);
        }
        else {
          continue;
        }
        if (v.flag&SplineFlags.BREAK_CURVATURES)
          continue;
        if (v.flag&SplineFlags.USE_HANDLES)
          continue;
        if (mindis==0.0) {
            bad = true;
        }
        else {
          bad = bad||maxdis/mindis>9.0;
        }
        if (bad)
          continue;
        let cc=new constraint("curv_c", 1, [ss1.ks], order, curv_c, [ss1, ss2]);
        slv.add(cc);
        cc = new constraint("curv_c", 1, [ss2.ks], order, curv_c, [ss2, ss1]);
        slv.add(cc);
        if (update_verts)
          update_verts.add(v);
    }
    return slv;
  }
  build_solver = _es6_module.add_export('build_solver', build_solver);
  function solve_intern(spline, order, goal_order, steps, gk, do_basic) {
    if (order===undefined) {
        order = ORDER;
    }
    if (goal_order===undefined) {
        goal_order = ORDER;
    }
    if (steps===undefined) {
        steps = 65;
    }
    if (gk===undefined) {
        gk = 1.0;
    }
    if (do_basic===undefined) {
        do_basic = false;
    }
    let start_time=time_ms();
    window._SOLVING = true;
    let slv=build_solver(spline, order, goal_order, gk, do_basic);
    let totsteps=slv.solve(steps, gk, order==ORDER, slv.edge_segs);
    for (let v of spline.verts) {
        v.flag&=~SplineFlags.UPDATE;
    }
    window._SOLVING = false;
    for (let i=0; i<spline.segments.length; i++) {
        let seg=spline.segments[i];
        seg.evaluate(0.5, undefined, undefined, undefined, true);
    }
    let end_time=time_ms()-start_time;
    if (end_time>50)
      console.log("solve time", end_time.toFixed(2), "ms", "steps", totsteps);
  }
  function solve_pre(spline) {
    spline.propagate_update_flags();
    spline.propagate_update_flags();
    for (let seg of spline.segments) {
        if (!(seg.v1.flag&SplineFlags.UPDATE)||!(seg.v2.flag&SplineFlags.UPDATE))
          continue;
        for (let i=0; i<seg.ks.length; i++) {
            seg.ks[i] = 0.0;
        }
        seg.evaluate(0.5);
    }
  }
  solve_pre = _es6_module.add_export('solve_pre', solve_pre);
  function do_solve(splineflags, spline, steps, gk) {
    solve_pre(spline);
    spline.resolve = 0;
    solve_intern(spline, ORDER, undefined, 65, 1, 0);
    for (var i=0; i<spline.segments.length; i++) {
        var seg=spline.segments[i];
        seg.evaluate(0.5, undefined, undefined, undefined, true);
        for (var j=0; j<seg.ks.length; j++) {
            if (isNaN(seg.ks[j])) {
                console.log("NaN!");
                seg.ks[j] = 0;
            }
        }
        if (g_app_state.modalstate!=ModalStates.TRANSFROMING) {
            if ((seg.v1.flag&SplineFlags.UPDATE)||(seg.v2.flag&SplineFlags.UPDATE))
              seg.update_aabb();
        }
    }
    for (var f of spline.faces) {
        for (var path of f.paths) {
            for (var l of path) {
                if (l.v.flag&SplineFlags.UPDATE)
                  f.flag|=SplineFlags.UPDATE_AABB;
            }
        }
    }
    if (!spline.is_anim_path) {
        for (var i=0; i<spline.handles.length; i++) {
            var h=spline.handles[i];
            h.flag&=~(SplineFlags.UPDATE|SplineFlags.TEMP_TAG);
        }
        for (var i=0; i<spline.verts.length; i++) {
            var v=spline.verts[i];
            v.flag&=~(SplineFlags.UPDATE|SplineFlags.TEMP_TAG);
        }
    }
    if (spline.on_resolve!=undefined) {
        spline.on_resolve();
        spline.on_resolve = undefined;
    }
  }
  do_solve = _es6_module.add_export('do_solve', do_solve);
}, '/dev/fairmotion/src/curve/spline_math_hermite.js');
es6_module_define('spline_element_array', ["../core/eventdag.js", "../core/struct.js", "./spline_types.js"], function _spline_element_array_module(_es6_module) {
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var SplineFlags=es6_import_item(_es6_module, './spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, './spline_types.js', 'SplineTypes');
  var CustomDataLayer=es6_import_item(_es6_module, './spline_types.js', 'CustomDataLayer');
  var CustomData=es6_import_item(_es6_module, './spline_types.js', 'CustomData');
  var CustomDataSet=es6_import_item(_es6_module, './spline_types.js', 'CustomDataSet');
  var DataPathNode=es6_import_item(_es6_module, '../core/eventdag.js', 'DataPathNode');
  var SplineLayerFlags={HIDE: 2, 
   CAN_SELECT: 4, 
   MASK: 8}
  SplineLayerFlags = _es6_module.add_export('SplineLayerFlags', SplineLayerFlags);
  class SplineLayer extends set {
    
    
    
     constructor(elements=undefined) {
      super(elements);
      this.id = -1;
      this.order = 0;
      this.flag = 0;
      this.name = "unnamed";
    }
     copyStructure() {
      let ret=new SplineLayer();
      ret.id = this.id;
      ret.order = this.order;
      ret.flag = this.flag;
      ret.name = ""+this.name;
      return ret;
    }
     add(e) {
      if (e==undefined) {
          console.trace("WARNING: e was undefined in SplineLayer.add");
          return ;
      }
      super.add(e);
      e.layers[this.id] = 1;
    }
     remove(e) {
      super.remove(e);
      delete e.layers[this.id];
    }
     _to_EIDs() {
      var ret=[];
      for (var e of this) {
          ret.push(e.eid);
      }
      return ret;
    }
    static  fromSTRUCT(reader) {
      var ret=new SplineLayer();
      reader(ret);
      return ret;
    }
     afterSTRUCT(spline) {
      if (this.eids===undefined)
        return ;
      var corrupted=false;
      for (var eid of this.eids) {
          var e=spline.eidmap[eid];
          if (e===undefined) {
              corrupted = true;
              continue;
          }
          this.add(e);
      }
      if (corrupted) {
          console.trace("Warning: corrupted layerset!", this, spline, "<==");
      }
      delete this.eids;
    }
  }
  _ESClass.register(SplineLayer);
  _es6_module.add_class(SplineLayer);
  SplineLayer = _es6_module.add_export('SplineLayer', SplineLayer);
  SplineLayer.STRUCT = `
SplineLayer {
  id    : int;
  order : int;
  flag  : int;
  eids  : array(int) | obj._to_EIDs();
  name  : string;
}
`;
  class SplineLayerSet extends Array {
    
    
    
    
     constructor() {
      super();
      this.active = undefined;
      this.namemap = {};
      this.idmap = {};
      this.idgen = new SDIDGen();
      this._active = undefined;
      this.flag = 0;
    }
     copyStructure() {
      let ret=new SplineLayerSet();
      ret.idgen = this.idgen.copy();
      ret.flag = this.flag;
      for (let layer of this) {
          let layer2=layer.copyStructure();
          ret.namemap[layer2.name] = layer2;
          ret.idmap[layer2.id] = layer2;
          if (layer===this.active) {
              ret.active = layer2;
          }
          super.push.call(ret, layer2);
      }
      return ret;
    }
     rename(id, oldname, newname, validate=false) {
      let layer=this.idmap[id];
      if (layer===undefined) {
          console.warn("Unknown layer at id", id);
          return ;
      }
      if (layer.name!=old_name) {
          console.warn("old layer name doesn't match");
      }
      if (validate) {
          newname = this.validate_name(newname);
      }
      delete this.namemap[layer.name];
      layer.name = newname;
      this.namemap[newname] = layer;
      return true;
    }
     get(id) {
      if (id==undefined) {
          throw new Error("id cannot be undefined");
      }
      if (!(id in this.idmap)) {
          console.log("WARNING: layer ", id, "not in spline layerset!", this);
          return undefined;
      }
      return this.idmap[id];
    }
    get  active() {
      if (this._active==undefined) {
          this._active = this[0];
      }
      return this._active;
    }
    set  active(val) {
      this._active = val;
    }
     new_layer() {
      var ret=new SplineLayer();
      ret.name = this.new_name();
      ret.id = this.idgen.gen_id();
      this.push(ret);
      return ret;
    }
     new_name() {
      var name="Layer", i=1;
      while ((name+" "+i) in this.namemap) {
        i++;
      }
      return name+" "+i;
    }
     validate_name(name) {
      if (!(name in this.namemap))
        return name;
      var i=1;
      while ((name+" "+i) in this.namemap) {
        i++;
      }
      return name+" "+i;
    }
     push(layer) {
      layer.name = this.validate_name(layer.name);
      this.namemap[layer.name] = layer;
      this.idmap[layer.id] = layer;
      super.push(layer);
      this.update_orders();
      if (this.active==undefined)
        this.active = layer;
    }
     insert(i, layer) {
      layer.name = this.validate_name(layer.name);
      this.namemap[layer.name] = layer;
      this.idmap[layer.id] = layer;
      super.insert(i, layer);
      this.update_orders();
    }
     change_layer_order(layer, new_i) {
      var start=this.indexOf(layer);
      if (start==undefined) {
          console.trace("Evil error in change_layer_order!", layer, new_i);
          return ;
      }
      if (new_i==start)
        return ;
      var min=Math.min(new_i, start), max=Math.max(new_i, start);
      var diff=max-min;
      let idx=start;
      if (start>new_i) {
          for (var i=0; i<diff; i++) {
              if (idx<1)
                break;
              var t=this[idx];
              this[idx] = this[idx-1];
              this[idx-1] = t;
              idx--;
          }
      }
      else {
        for (var i=0; i<diff; i++) {
            if (idx>=this.length-1)
              break;
            var t=this[idx];
            this[idx] = this[idx+1];
            this[idx+1] = t;
            idx++;
        }
      }
      this.update_orders();
    }
     update_orders() {
      for (var i=0; i<this.length; i++) {
          this[i].order = i;
      }
    }
     _new_active(i) {
      if (this.length==0) {
          console.log("WARNING: no layers left, adding a layer!");
          this.new_layer();
          return ;
      }
      i = Math.min(Math.max(0, i), this.length-1);
      this.active = this[i];
    }
     remove(layer) {
      var i=this.indexOf(layer);
      super.remove(layer);
      delete this.namemap[layer.name];
      delete this.idmap[layer.id];
      if (layer==this.active)
        this._new_active(i);
      this.update_orders();
    }
     pop_i(i) {
      var layer=this[i];
      super.pop_i(i);
      delete this.namemap[layer.name];
      delete this.idmap[layer.id];
      if (layer==this.active)
        this._new_active(i);
      this.update_orders();
    }
     pop() {
      var layer=super.pop();
      delete this.namemap[layer.name];
      delete this.idmap[layer.id];
      if (layer==this.active)
        this._new_active(this.length-1);
    }
    static  fromSTRUCT(reader) {
      var ret=new SplineLayerSet();
      reader(ret);
      for (var i=0; i<ret._layers.length; i++) {
          if (!ret._layers[i].name) {
              console.log("Layer name corruption detected");
              ret._layers[i].name = "Layer "+(i+1);
          }
          ret._layers[i].order = i;
          ret.push(ret._layers[i]);
      }
      ret.active = ret.idmap[ret.active];
      delete ret._layers;
      return ret;
    }
     afterSTRUCT(spline) {
      for (var layer of this) {
          layer.afterSTRUCT(spline);
      }
    }
  }
  _ESClass.register(SplineLayerSet);
  _es6_module.add_class(SplineLayerSet);
  SplineLayerSet = _es6_module.add_export('SplineLayerSet', SplineLayerSet);
  SplineLayerSet.STRUCT = `
  SplineLayerSet {
    idgen  : SDIDGen;
    active : int | obj.active != undefined ? obj.active.id : -1;
    flag   : int;
    _layers : array(SplineLayer) | obj;
  }
`;
  class IterCache  {
     constructor(callback, count=8) {
      this.stack = [];
      this.free = [];
      this.cache = [];
      this.callback = callback;
      for (var i=0; i<count; i++) {
          this.cache.push(callback());
          this.free.push(this.cache[this.cache.length-1]);
      }
    }
     push() {
      if (this.free.length==0) {
          console.log("Error in IterCache!");
          return this.callback();
      }
      for (var i=0; i<this.stack.length; i++) {
          var iter=this.stack[i];
          if (iter.is_done()) {
              this.stack.remove(iter);
              i--;
              this.free.push(iter);
          }
      }
      var iter=this.free.pop();
      this.stack.push(iter);
      return iter;
    }
     pop() {
      this.free.push(this.stack.pop());
    }
    static  fromConstructor(cls, count) {
      return new IterCache(function () {
        return new cls();
      }, count);
    }
  }
  _ESClass.register(IterCache);
  _es6_module.add_class(IterCache);
  IterCache = _es6_module.add_export('IterCache', IterCache);
  class EditableIter  {
    
    
     constructor(list, layerset, all_layers) {
      this.init(list, layerset, all_layers);
    }
     init(list, layerset, all_layers) {
      this.list = list;
      this.layerset = layerset;
      this.all_layers = all_layers;
      this.i = 0;
      this.ret = {done: false, 
     value: undefined};
      return this;
    }
     [Symbol.iterator]() {
      return this;
    }
     reset() {
      this.ret.done = false;
      this.ret.value = undefined;
      this.i = 0;
      return this;
    }
     next() {
      let actlayer=this.layerset.active.id;
      while (this.i<this.list.length) {
        let e=this.list[this.i];
        let ok=!e.hidden;
        ok = ok&&(this.all_layers||actlayer in e.layers);
        if (ok)
          break;
        this.i++;
      }
      if (this.i>=this.list.length) {
          this.ret.done = true;
          this.ret.value = undefined;
          return this.ret;
      }
      this.i++;
      this.ret.done = false;
      this.ret.value = this.list[this.i-1];
      return this.ret;
    }
  }
  _ESClass.register(EditableIter);
  _es6_module.add_class(EditableIter);
  EditableIter = _es6_module.add_export('EditableIter', EditableIter);
  class SelectedEditableIter  {
    
    
     constructor(selset, layerset) {
      this.ret = {done: false, 
     value: undefined};
      this._c = 0;
      if (selset!=undefined) {
          this.init(selset, layerset);
      }
    }
     [Symbol.iterator]() {
      return this;
    }
     reset() {
      return this.init(this.set, this.layerset);
    }
     init(selset, layerset) {
      this.set = selset;
      this.iter = undefined;
      this.ret.done = false;
      this.layerset = layerset;
      this._c = 0;
      return this;
    }
     is_done() {
      return this.iter==undefined;
    }
     next() {
      if (this.iter==undefined) {
          this.iter = this.set[Symbol.iterator]();
          this.ret.done = false;
      }
      if (this._c++>100000) {
          console.log("infinite loop detected 2!");
          this.ret.done = true;
          this.ret.value = undefined;
          return this.ret;
      }
      var actlayer=this.layerset.active.id;
      function visible(e) {
        return !e.hidden&&actlayer in e.layers;
      }
      var ret=undefined;
      var good=false;
      var c=0;
      var iter=this.iter;
      do {
        ret = iter.next();
        if (ret.done)
          break;
        var e=ret.value;
        good = visible(e);
        if (e.type==SplineTypes.HANDLE) {
            good = good||visible(e.owning_segment);
        }
        if (good) {
            this.ret.value = e;
            break;
        }
        ret = iter.next();
        if (c++>100000) {
            console.log("Infinite loop detected!!", ret, iter);
            break;
        }
      } while (!good);
      
      if (good==false) {
          this.ret.done = true;
          this.ret.value = undefined;
          this.iter = undefined;
      }
      return this.ret;
    }
  }
  _ESClass.register(SelectedEditableIter);
  _es6_module.add_class(SelectedEditableIter);
  SelectedEditableIter = _es6_module.add_export('SelectedEditableIter', SelectedEditableIter);
  class SelectedEditableAllLayersIter  {
    
    
     constructor(selset, layerset) {
      this.ret = {done: false, 
     value: undefined};
      this._c = 0;
      if (selset!=undefined) {
          this.init(selset, layerset);
      }
    }
     [Symbol.iterator]() {
      return this;
    }
     reset() {
      return this.init(this.set, this.layerset);
    }
     init(selset, layerset) {
      this.set = selset;
      this.iter = undefined;
      this.ret.done = false;
      this.layerset = layerset;
      this._c = 0;
      return this;
    }
     is_done() {
      return this.iter==undefined;
    }
     next() {
      if (this.iter==undefined) {
          this.iter = this.set[Symbol.iterator]();
          this.ret.done = false;
      }
      if (this._c++>100000) {
          console.log("infinite loop detected 2!");
          this.ret.done = true;
          this.ret.value = undefined;
          return this.ret;
      }
      var actlayer=this.layerset.active.id;
      function visible(e) {
        return !e.hidden;
      }
      var ret=undefined;
      var good=false;
      var c=0;
      var iter=this.iter;
      do {
        ret = iter.next();
        if (ret.done)
          break;
        var e=ret.value;
        good = visible(e);
        if (e.type==SplineTypes.HANDLE) {
            good = good||visible(e.owning_segment);
        }
        if (good) {
            this.ret.value = e;
            break;
        }
        ret = iter.next();
        if (c++>100000) {
            console.log("Infinite loop detected!!", ret, iter);
            break;
        }
      } while (!good);
      
      if (good==false) {
          this.ret.done = true;
          this.ret.value = undefined;
          this.iter = undefined;
      }
      return this.ret;
    }
  }
  _ESClass.register(SelectedEditableAllLayersIter);
  _es6_module.add_class(SelectedEditableAllLayersIter);
  SelectedEditableAllLayersIter = _es6_module.add_export('SelectedEditableAllLayersIter', SelectedEditableAllLayersIter);
  class ElementArraySet extends set {
     constructor(arg) {
      super(arg);
      this.layerset = undefined;
    }
     editable(ctx) {
      if (ctx===undefined) {
          console.warn("Missing ctx in editable() iterator!");
      }
      let ignore_layers=ctx!==undefined ? ctx.edit_all_layers : false;
      return ignore_layers ? new SelectedEditableAllLayersIter(this, this.layerset) : new SelectedEditableIter(this, this.layerset);
    }
  }
  _ESClass.register(ElementArraySet);
  _es6_module.add_class(ElementArraySet);
  ElementArraySet = _es6_module.add_export('ElementArraySet', ElementArraySet);
  class ElementArray extends Array {
    
    
    
    
    
    
    
     constructor(type, idgen, idmap, global_sel, layerset, spline) {
      super();
      this.layerset = layerset;
      this.cdata = new CustomData(this);
      this.type = type;
      this.spline = spline;
      this.idgen = idgen;
      this.idmap = idmap;
      this.local_idmap = {};
      this.global_sel = global_sel;
      this.on_select = undefined;
      this.select_listeners = new EventDispatcher("select");
      this.selected = new ElementArraySet();
      this.selected.layerset = layerset;
      this.active = undefined;
      this.highlight = undefined;
    }
     editable(ctx) {
      if (ctx===undefined) {
          throw new Error("Missing ctx argument");
      }
      return new EditableIter(this, this.layerset, ctx.edit_all_layers);
    }
     dag_get_datapath() {
      var tname;
      switch (this.type) {
        case SplineTypes.VERTEX:
          tname = "verts";
          break;
        case SplineTypes.HANDLE:
          tname = "handles";
          break;
        case SplineTypes.SEGMENT:
          tname = "segments";
          break;
        case SplineTypes.FACE:
          tname = "faces";
          break;
      }
      var suffix="."+tname;
      var name="drawspline";
      for (var i=0; i<this.cdata.layers.length; i++) {
          if (this.cdata.layers[i].name=="TimeDataLayer")
            name = "pathspline";
      }
      return "frameset."+name+suffix;
    }
     remove_undefineds() {
      for (var i=0; i<this.length; i++) {
          if (this[i]==undefined) {
              this.pop_i(this[i]);
              i--;
          }
      }
    }
     swap(a, b) {
      if (a==undefined||b==undefined) {
          console.trace("Warning, undefined in ElementArray.swap(): a, b:", a, b);
          return ;
      }
      var i1=this.indexOf(a), i2=this.indexOf(b);
      if (i1<0||i2<0) {
          console.log(i1, i2, a, b);
          throw new Error("Elements not in list");
      }
      this[i2] = a;
      this[i1] = b;
    }
     on_layer_add(layer, i) {
      for (var e of this) {
          e.cdata.on_add(layercls, i);
      }
    }
     on_layer_del(layer, i) {
      for (var e of this) {
          e.cdata.on_del(layercls, i);
      }
    }
     push(e, custom_eid=undefined, add_to_layerset=true) {
      if (e.cdata===undefined||e.cdata.length!==this.cdata.layers.length) {
          e.cdata = this.cdata.gen_edata();
      }
      if (custom_eid===undefined) {
          e.eid = this.idgen.gen_id();
      }
      else {
        e.eid = custom_eid;
      }
      this.idmap[e.eid] = e;
      this.local_idmap[e.eid] = e;
      GArray.prototype.push.call(this, e);
      if (e.flag&SplineFlags.SELECT) {
          e.flag&=~SplineFlags.SELECT;
          this.setselect(e, true);
      }
      if (add_to_layerset) {
          this.layerset.active.add(e);
          e.layers[this.layerset.active.id] = 1;
      }
    }
     remove(e, soft_error=false) {
      var idx=this.indexOf(e);
      if (idx<0) {
          throw new Error("Element not in list");
      }
      if (this.active===e) {
          this.active = undefined;
      }
      if (this.selected.has(e))
        this.setselect(e, false);
      delete this.idmap[e.eid];
      delete this.local_idmap[e.eid];
      this[idx] = this[this.length-1];
      this.length--;
      for (var k in e.layers) {
          var layer=this.layerset.idmap[k];
          if (layer!=undefined) {
              layer.remove(e);
          }
          else {
            console.trace("Failed to find layer "+k+"!", e, this, this.layerset);
          }
      }
    }
     setselect(e, state) {
      if (e.type!==this.type) {
          console.trace("Warning: bad element fed to ElementArray! Got ", e.type, " but expected", this.type);
          return ;
      }
      let selchange=0;
      if (state&&!(e.flag&SplineFlags.SELECT)) {
          this.dag_update("on_select_add", this.type);
          selchange = 1;
      }
      else 
        if (!state&&(e.flag&SplineFlags.SELECT)) {
          this.dag_update("on_select_sub", this.type);
          selchange = 1;
      }
      if (selchange) {
          this.dag_update("on_select_change", this.type);
      }
      var changed=!!(e.flag&SplineFlags.SELECT)!=!!state;
      if (state) {
          if (this.active===undefined)
            this.active = e;
          this.global_sel.add(e);
          this.selected.add(e);
          e.flag|=SplineFlags.SELECT;
      }
      else {
        if (this.active===e) {
            this.active = undefined;
        }
        this.global_sel.remove(e);
        this.selected.remove(e);
        e.flag&=~SplineFlags.SELECT;
      }
      if (changed&&this.on_select!==undefined) {
          this.on_select(e, state);
          this.select_listeners.fire(e, state);
      }
    }
     clear_selection() {
      for (var i=0; i<this.length; i++) {
          this.setselect(this[i], false);
      }
    }
     select_all() {
      for (var i=0; i<this.length; i++) {
          this.setselect(this[i], true);
      }
    }
    static  fromSTRUCT(reader) {
      var ret=new ElementArray();
      reader(ret);
      ret.cdata.owner = ret;
      var active=ret.active;
      ret.active = undefined;
      for (var i=0; i<ret.arr.length; i++) {
          GArray.prototype.push.call(ret, ret.arr[i]);
          if (ret.arr[i].eid==active) {
              ret.active = ret.arr[i];
          }
      }
      delete ret.arr;
      return ret;
    }
     afterSTRUCT(type, idgen, idmap, global_sel, layerset, spline) {
      this.type = type;
      this.idgen = idgen;
      this.idmap = idmap;
      this.global_sel = global_sel;
      this.local_idmap = {};
      this.layerset = layerset;
      this.spline = spline;
      var selected=new ElementArraySet();
      selected.layerset = layerset;
      for (var i=0; i<this.selected.length; i++) {
          var eid=this.selected[i];
          if (!(eid in idmap)) {
              console.log("WARNING: afterSTRUCT: eid", eid, "not in eidmap!", Object.keys(idmap));
              continue;
          }
          selected.add(idmap[this.selected[i]]);
      }
      this.selected = selected;
      for (var e of this) {
          this.local_idmap[e.eid] = e;
          if (e.cdata==undefined) {
              e.cdata = this.cdata.gen_edata();
          }
      }
      this.cdata.afterSTRUCT(this, this.cdata);
    }
    static  nodedef() {
      return {inputs: {}, 
     outputs: {on_select_add: 0, 
      on_select_sub: 0, 
      on_select_change: 0}}
    }
  }
  _ESClass.register(ElementArray);
  _es6_module.add_class(ElementArray);
  ElementArray = _es6_module.add_export('ElementArray', ElementArray);
  mixin(ElementArray, DataPathNode);
  ElementArray.STRUCT = `
  ElementArray {
    arr      : array(abstract(SplineElement)) | obj;
    selected : iter(e, int) | e.eid;
    active   : int | obj.active != undefined ? obj.active.eid : -1;
    cdata    : CustomData;
  }
`;
}, '/dev/fairmotion/src/curve/spline_element_array.js');
es6_module_define('spline_base', ["../core/eventdag.js", "../core/toolprops.js", "../core/struct.js", "../util/mathlib.js"], function _spline_base_module(_es6_module) {
  var TPropFlags=es6_import_item(_es6_module, '../core/toolprops.js', 'TPropFlags');
  var PropTypes=es6_import_item(_es6_module, '../core/toolprops.js', 'PropTypes');
  var acos=Math.acos, asin=Math.asin, abs=Math.abs, log=Math.log, sqrt=Math.sqrt, pow=Math.pow, PI=Math.PI, floor=Math.floor, min=Math.min, max=Math.max, sin=Math.sin, cos=Math.cos, tan=Math.tan, atan=Math.atan, atan2=Math.atan2, exp=Math.exp;
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  es6_import(_es6_module, '../util/mathlib.js');
  var DataPathNode=es6_import_item(_es6_module, '../core/eventdag.js', 'DataPathNode');
  const MaterialFlags={SELECT: 1, 
   MASK_TO_FACE: 2}
  _es6_module.add_export('MaterialFlags', MaterialFlags);
  var RecalcFlags={DRAWSORT: 1, 
   SOLVE: 2, 
   ALL: 1|2}
  RecalcFlags = _es6_module.add_export('RecalcFlags', RecalcFlags);
  var SplineFlags={SELECT: 1, 
   BREAK_TANGENTS: 2, 
   USE_HANDLES: 4, 
   UPDATE: 8, 
   TEMP_TAG: 16, 
   BREAK_CURVATURES: 32, 
   HIDE: 64, 
   FRAME_DIRTY: 128, 
   PINNED: 256, 
   NO_RENDER: 512, 
   AUTO_PAIRED_HANDLE: 1<<10, 
   UPDATE_AABB: 1<<11, 
   DRAW_TEMP: 1<<12, 
   GHOST: 1<<13, 
   UI_SELECT: 1<<14, 
   FIXED_KS: 1<<21, 
   REDRAW_PRE: 1<<22, 
   REDRAW: 1<<23}
  SplineFlags = _es6_module.add_export('SplineFlags', SplineFlags);
  var SplineTypes={VERTEX: 1, 
   HANDLE: 2, 
   SEGMENT: 4, 
   LOOP: 8, 
   FACE: 16, 
   ALL: 31}
  SplineTypes = _es6_module.add_export('SplineTypes', SplineTypes);
  var ClosestModes={CLOSEST: 0, 
   START: 1, 
   END: 2, 
   ALL: 3}
  ClosestModes = _es6_module.add_export('ClosestModes', ClosestModes);
  class CustomDataLayer  {
     constructor() {
      this.shared = undefined;
    }
     segment_split(old_segment, old_v1, old_v2, new_segments) {

    }
     update(owner) {

    }
     post_solve(owner) {

    }
     interp(srcs, ws) {

    }
     copy(src) {

    }
    static  fromSTRUCT(reader) {
      var obj=new CustomDataLayer();
      reader(obj);
      return obj;
    }
     curve_effect(owner) {

    }
  }
  _ESClass.register(CustomDataLayer);
  _es6_module.add_class(CustomDataLayer);
  CustomDataLayer = _es6_module.add_export('CustomDataLayer', CustomDataLayer);
  class empty_class  {
    static  fromSTRUCT(reader) {
      var ret=new empty_class();
      reader(ret);
      return ret;
    }
  }
  _ESClass.register(empty_class);
  _es6_module.add_class(empty_class);
  empty_class = _es6_module.add_export('empty_class', empty_class);
  empty_class.STRUCT = `
  empty_class {
  }
`;
  CustomDataLayer.layerinfo = {type_name: "(bad type name)", 
   has_curve_effect: false, 
   shared_class: empty_class}
  CustomDataLayer.STRUCT = `
  CustomDataLayer {
  }
`;
  class CustomData  {
    
    
     constructor(owner, layer_add_callback, layer_del_callback) {
      this.owner = owner;
      this.callbacks = {on_add: layer_add_callback, 
     on_del: layer_del_callback};
      this.layers = [];
      this.shared_data = [];
      this.startmap = {};
    }
     load_layout(src) {
      for (var i=0; i<src.layers.length; i++) {
          this.layers.push(src.layers[i]);
      }
      for (var k in src.startmap) {
          this.startmap[k] = src.startmap[k];
      }
    }
     add_layer(cls, name) {
      var templ=cls;
      var i=this.get_layer(templ.layerinfo.type_name);
      if (i!=undefined) {
          var n=this.num_layers(templ.layerinfo.type_name);
          i+=n;
          this.layers.insert(i, templ);
      }
      else {
        i = this.layers.length;
        this.startmap[templ.layerinfo.type_name] = i;
        this.layers.push(templ);
      }
      var scls=templ.layerinfo.shared_class;
      scls = scls==undefined ? empty_class : scls;
      var shared=new scls;
      this.shared_data.push(shared);
      for (var e of this.owner) {
          e.cdata.on_add(templ, i, shared);
      }
      if (this.callbacks.on_add!=undefined)
        this.callbacks.on_add(templ, i, shared);
    }
     gen_edata() {
      var ret=new CustomDataSet();
      for (var i=0; i<this.layers.length; i++) {
          var layer=new this.layers[i]();
          layer.shared = this.shared_data[i];
          ret.push(layer);
      }
      return ret;
    }
     get_shared(type) {
      return this.shared_data[this.get_layer_i(type, 0)];
    }
     get_layer_i(type, i=0) {
      if (!(type in this.startmap))
        return -1;
      return this.startmap[type]+i;
    }
     get_layer(type, i) {
      if (i==undefined)
        i = 0;
      return this.layers[this.startmap[type]+i];
    }
     num_layers(type) {
      var i=this.get_layer_i(type, 0);
      if (i==undefined||i==-1)
        return 0;
      while (i<this.layers.length&&this.layers[i++].type==type) {
        ;      }
      return i;
    }
     loadSTRUCT(reader) {
      reader(this);
      for (var i=0; i<this.layers.length; i++) {
          this.layers[i] = this.layers[i].constructor;
          var l=this.layers[i];
          var typename=l.layerinfo.type_name;
          if (!(typename in this.startmap)) {
              this.startmap[typename] = i;
          }
      }
      if (this.shared_data.length!=this.layers.length) {
          for (var i=0; i<this.layers.length; i++) {
              var layer=this.layers[i];
              var scls=layer.layerinfo.shared_class;
              scls = scls==undefined ? empty_class : scls;
              var shared=new scls;
              if (this.shared_data.length>i)
                this.shared_data[i] = shared;
              else 
                this.shared_data.push(shared);
          }
      }
    }
     afterSTRUCT(element_array, cdata) {
      for (var e of element_array) {
          var i=0;
          for (var layer of e.cdata) {
              layer.shared = cdata.shared_data[i];
              i++;
          }
      }
    }
  }
  _ESClass.register(CustomData);
  _es6_module.add_class(CustomData);
  CustomData = _es6_module.add_export('CustomData', CustomData);
  CustomData.STRUCT = `
  CustomData {
    layers      : array(e, abstract(CustomDataLayer)) | new e();
    shared_data : array(abstract(Object));
  }
`;
  var $srcs2_yeRO_interp;
  class CustomDataSet extends Array {
     constructor() {
      super();
    }
     on_add(cls, i, shared) {
      var layer=new cls();
      layer.shared = shared;
      this.insert(i, layer);
    }
     get_layer(cls) {
      for (var i=0; i<this.length; i++) {
          if (this[i].constructor===cls)
            return this[i];
      }
    }
     on_del(cls, i) {
      this.pop_u(i);
    }
     get_data(layout, layer_name) {

    }
     on_segment_split(old_segment, old_v1, old_v2, new_segments) {

    }
     interp(srcs, ws) {
      while ($srcs2_yeRO_interp.length<srcs.length) {
        $srcs2_yeRO_interp.push(0);
      }
      $srcs2_yeRO_interp.length = srcs.length;
      for (var i=0; i<this.length; i++) {
          for (var j=0; j<srcs.length; j++) {
              $srcs2_yeRO_interp[j] = srcs[j][i];
          }
          this[i].interp($srcs2_yeRO_interp, ws);
      }
    }
     copy(src) {
      for (var i=0; i<this.length; i++) {
          this[i].copy(src[i]);
      }
    }
     loadSTRUCT(reader) {
      reader(this);
      for (var i=0; i<this.arr.length; i++) {
          this.push(this.arr[i]);
      }
      delete this.arr;
    }
  }
  var $srcs2_yeRO_interp=[];
  _ESClass.register(CustomDataSet);
  _es6_module.add_class(CustomDataSet);
  CustomDataSet = _es6_module.add_export('CustomDataSet', CustomDataSet);
  CustomDataSet.STRUCT = `
  CustomDataSet {
    arr : iter(abstract(CustomDataLayer)) | obj;
  }
`;
  class SplineElement extends DataPathNode {
    
    
    
    
    
    
     constructor(type) {
      super();
      this.type = type;
      this.cdata = new CustomDataSet();
      this.masklayer = 1;
      this.layers = {};
    }
     has_layer() {
      for (var k in this.layers) {
          return true;
      }
      return false;
    }
     dag_get_datapath() {
      var suffix=".verts["+this.eid+"]";
      var name="drawspline";
      for (var i=0; i<this.cdata.length; i++) {
          if (this.cdata[i].constructor.name=="TimeDataLayer")
            name = "pathspline";
      }
      return "frameset."+name+suffix;
    }
     in_layer(layer) {
      return layer!=undefined&&layer.id in this.layers;
    }
    get  aabb() {
      console.trace("Implement Me!");
    }
     sethide(state) {
      if (state)
        this.flag|=SplineFlags.HIDE;
      else 
        this.flag&=~SplineFlags.HIDE;
    }
    set  hidden(state) {
      if (state)
        this.flag|=SplineFlags.HIDE;
      else 
        this.flag&=~SplineFlags.HIDE;
    }
    get  hidden() {
      return !!(this.flag&SplineFlags.HIDE);
    }
     valueOf() {
      return this.eid;
    }
     [Symbol.keystr]() {
      return ""+this.eid;
    }
     post_solve() {
      for (var i=0; i<this.cdata.length; i++) {
          this.cdata[i].post_solve(this);
      }
    }
     loadSTRUCT(reader) {
      reader(this);
    }
    static  nodedef() {
      return {name: "SplineElement", 
     uiName: "SplineElement", 
     outputs: {depend: undefined, 
      on_select: 0.0, 
      eid: 0.0}}
    }
  }
  _ESClass.register(SplineElement);
  _es6_module.add_class(SplineElement);
  SplineElement = _es6_module.add_export('SplineElement', SplineElement);
  SplineElement.STRUCT = `
SplineElement {
  eid        : int;
  flag       : int;
  type       : int;
  cdata      : CustomDataSet;
}
`;
  var derivative_cache_vs=cachering.fromConstructor(Vector3, 64);
  var closest_point_ret_cache_vs=cachering.fromConstructor(Vector3, 256);
  var closest_point_ret_cache=new cachering(function () {
    return [0, 0];
  }, 256);
  var closest_point_cache_vs=cachering.fromConstructor(Vector3, 64);
  var flip_wrapper_cache;
  var $flip_out_FuKE__get_nextprev;
  var $ret_cache_vCw8_global_to_local;
  var $_co_LHf7_global_to_local;
  var $arr_FYYd_global_to_local;
  var $_vec_C_qR_global_to_local;
  class CurveEffect  {
     constructor() {
      this.child = undefined;
      this.prior = undefined;
    }
     rescale(ceff, width) {
      if (this.prior!=undefined)
        return this.prior.rescale(ceff, width);
      return width;
    }
    get  reversed() {
      return flip_wrapper_cache.next().bind(this);
    }
     set_parent(p) {
      this.prior = p;
      p.child = this;
    }
     _get_nextprev(donext, _flip_out) {
      var i=0, p=this;
      while (p.prior!=undefined) {
        p = p.prior;
        i++;
      }
      p = p._get_nextprev(donext, $flip_out_FuKE__get_nextprev);
      var flip=$flip_out_FuKE__get_nextprev[0];
      if (p==undefined) {
          return undefined;
      }
      while (i>0) {
        p = p.child;
        i--;
      }
      if (p==undefined) {
          console.log("EVIL! no MultiResEffector!", this);
          return undefined;
      }
      if (flip)
        p = p.reversed;
      return p;
    }
    get  next() {
      return this._get_nextprev(1);
    }
    get  prev() {
      return this._get_nextprev(0);
    }
     evaluate(s) {
      if (this.prior!=undefined) {
          return this.prior.evaluate(s);
      }
    }
     derivative(s) {
      var df=0.001;
      var a, b;
      if (s<0.5) {
          a = this.evaluate(s);
          b = this.evaluate(s+df);
      }
      else {
        a = this.evaluate(s-df);
        b = this.evaluate(s);
      }
      b.sub(a).mulScalar(1.0/df);
      return b;
    }
     derivative2(s, funcs) {
      var df=0.001;
      var a, b;
      if (s<0.5) {
          a = this.derivative(s);
          b = this.derivative(s+df);
      }
      else {
        a = this.derivative(s-df);
        b = this.derivative(s);
      }
      b.sub(a).mulScalar(1.0/df);
      return b;
    }
     curvature(s, prior) {
      var dv1=this.derivative(s);
      var dv2=this.derivative(s);
      return (dv2[0]*dv1[1]-dv2[1]*dv1[0])/Math.pow(dv1[0]*dv1[0]+dv1[1]*dv1[1], 3.0/2.0);
    }
     closest_point(p, mode, fast=false) {
      var minret=undefined, mindis=1e+18, maxdis=0;
      var p2=closest_point_cache_vs.next().zero();
      for (var i=0; i<p.length; i++) {
          p2[i] = p[i];
      }
      p = p2;
      if (mode==undefined)
        mode = 0;
      var steps=5, s=0, ds=1.0/(steps);
      var n=closest_point_cache_vs.next();
      var n1=closest_point_cache_vs.next(), n2=closest_point_cache_vs.next();
      var n3=closest_point_cache_vs.next(), n4=closest_point_cache_vs.next();
      if (mode==ClosestModes.ALL)
        minret = [];
      for (var i=0; i<steps; i++, s+=ds) {
          var start=s-1e-05, end=s+ds+1e-05;
          start = Math.min(Math.max(start, 0.0), 1.0);
          end = Math.min(Math.max(end, 0.0), 1.0);
          var mid=(start+end)*0.5;
          var bad=false;
          var angle_limit=fast ? 0.65 : 0.2;
          var steps=fast ? 5 : 20;
          for (var j=0; j<steps; j++) {
              mid = (start+end)*0.5;
              var co=this.evaluate(mid);
              var sco=this.evaluate(start);
              var eco=this.evaluate(end);
              var d1=this.normal(start).normalize();
              var d2=this.normal(end).normalize();
              var dm=this.normal(mid).normalize();
              n1.load(sco).sub(p).normalize();
              n2.load(eco).sub(p).normalize();
              n.load(co).sub(p).normalize();
              if (n1.dot(d1)<0.0)
                d1.negate();
              if (n2.dot(d2)<0.0)
                d2.negate();
              if (n.dot(dm)<0)
                dm.negate();
              var mang=acos(n.normalizedDot(dm));
              if (mang<0.001)
                break;
              var ang1=acos(n1.normalizedDot(d1));
              var ang2=acos(n2.normalizedDot(d2));
              var w1=n1.cross(d1)[2]<0.0;
              var w2=n2.cross(d2)[2]<0.0;
              var wm=n.cross(dm)[2]<0.0;
              if (isNaN(mang)) {
                  console.log(p, co, mid, dm);
              }
              if (j==0&&w1==w2) {
                  bad = true;
                  break;
              }
              else 
                if (w1==w2) {
              }
              if (w1==w2) {
                  var dis1, dis2;
                  dis1 = ang1, dis2 = ang2;
                  if (dis2<dis1) {
                      start = mid;
                  }
                  else 
                    if (dis1<dis2) {
                      end = mid;
                  }
                  else {
                    break;
                  }
              }
              else 
                if (wm==w1) {
                  start = mid;
              }
              else {
                end = mid;
              }
          }
          if (bad)
            continue;
          var co=this.evaluate(mid);
          n1.load(this.normal(mid)).normalize();
          n2.load(co).sub(p).normalize();
          if (n2.dot(n1)<0) {
              n2.negate();
          }
          var angle=acos(Math.min(Math.max(n1.dot(n2), -1), 1));
          if (angle>angle_limit)
            continue;
          if (mode!=ClosestModes.ALL&&minret==undefined) {
              var minret=closest_point_ret_cache.next();
              minret[0] = minret[1] = undefined;
          }
          var dis=co.vectorDistance(p);
          if (mode==ClosestModes.CLOSEST) {
              if (dis<mindis) {
                  minret[0] = closest_point_cache_vs.next().load(co);
                  minret[1] = mid;
                  mindis = dis;
              }
          }
          else 
            if (mode==ClosestModes.START) {
              if (mid<mindis) {
                  minret[0] = closest_point_cache_vs.next().load(co);
                  minret[1] = mid;
                  mindis = mid;
              }
          }
          else 
            if (mode==ClosestModes.END) {
              if (mid>maxdis) {
                  minret[0] = closest_point_cache_vs.next().load(co);
                  minret[1] = mid;
                  maxdis = mid;
              }
          }
          else 
            if (mode==ClosestModes.ALL) {
              var ret=closest_point_ret_cache.next();
              ret[0] = closest_point_cache_vs.next().load(co);
              ret[1] = mid;
              minret.push(ret);
          }
      }
      if (minret==undefined&&mode==ClosestModes.CLOSEST) {
          var v1=this.evaluate(0), v2=this.evaluate(1);
          var dis1=v1.vectorDistance(p), dis2=v2.vectorDistance(p);
          minret = closest_point_ret_cache.next();
          minret[0] = closest_point_cache_vs.next().load(dis1<dis2 ? v1 : v2);
          minret[1] = dis1<dis2 ? 0.0 : 1.0;
      }
      else 
        if (minret==undefined&&mode==ClosestModes.START) {
          minret = closest_point_ret_cache.next();
          minret[0] = closest_point_cache_vs.next().load(this.v1);
          minret[1] = 0.0;
      }
      if (minret==undefined&&mode==ClosestModes.END) {
          minret = closest_point_ret_cache.next();
          minret[0] = closest_point_cache_vs.next().load(this.v2);
          minret[1] = 1.0;
      }
      return minret;
    }
     normal(s) {
      var ret=this.derivative(s);
      var t=ret[0];
      ret[0] = -ret[1];
      ret[1] = t;
      ret.normalize();
      return ret;
    }
     global_to_local(p, no_effects=false, fixed_s=undefined) {
      var co;
      if (fixed_s!=undefined) {
          $arr_FYYd_global_to_local[0] = this.evaluate(fixed_s);
          $arr_FYYd_global_to_local[1] = fixed_s;
          co = $arr_FYYd_global_to_local;
      }
      else {
        co = this.closest_point(p);
      }
      var s, t, a=0.0;
      if (co==undefined) {
          co = $_co_LHf7_global_to_local;
          if (p.vectorDistance(this.v1)<p.vectorDistance(this.v2)) {
              co.load(this.v1);
              s = 0;
              t = p.vectorDistance(this.v1);
          }
          else {
            co.load(this.v2);
            s = 1.0;
            t = p.vectorDistance(this.v2);
          }
      }
      else {
        s = co[1];
        co = co[0];
        t = p.vectorDistance(co)*0.15;
      }
      var n1=this.normal(s).normalize();
      var n2=$_vec_C_qR_global_to_local.zero().load(p).sub(co).normalize();
      n1[2] = n2[2] = 0.0;
      a = asin(n1[0]*n2[1]-n1[1]*n2[0]);
      var dot=n1.dot(n2);
      co.sub(p);
      co[2] = 0.0;
      t = co.vectorLength();
      if (dot<0.0) {
          t = -t;
          a = 2.0*Math.PI-a;
      }
      var ret=$ret_cache_vCw8_global_to_local.next();
      ret[0] = s;
      ret[1] = t;
      ret[2] = a;
      return ret;
    }
     local_to_global(p) {
      var s=p[0], t=p[1], a=p[2];
      var co=this.evaluate(s);
      var no=this.normal(s).normalize();
      no.mulScalar(t);
      no.rot2d(a);
      co.add(no);
      return co;
    }
  }
  var $flip_out_FuKE__get_nextprev=[0];
  var $ret_cache_vCw8_global_to_local=cachering.fromConstructor(Vector3, 64);
  var $_co_LHf7_global_to_local=new Vector3();
  var $arr_FYYd_global_to_local=[0, 0];
  var $_vec_C_qR_global_to_local=new Vector3();
  _ESClass.register(CurveEffect);
  _es6_module.add_class(CurveEffect);
  CurveEffect = _es6_module.add_export('CurveEffect', CurveEffect);
  class FlipWrapper extends CurveEffect {
    
     constructor() {
      super();
      this.eff = undefined;
      this.depth = 0;
    }
     rescale(eff, width) {
      return this.eff.rescale(eff, width);
    }
    get  reversed() {
      return this.eff;
    }
     bind(eff) {
      this.eff = eff;
      return this;
    }
    get  next() {
      return this.eff.next;
    }
    get  prev() {
      return this.eff.prev;
    }
     push(s) {
      if (this.depth==0) {
          s = 1.0-s;
      }
      this.depth++;
      return s;
    }
     pop(value) {
      this.depth--;
      return value;
    }
     evaluate(s) {
      s = this.push(s);
      return this.pop(this.eff.evaluate(s));
    }
     derivative(s) {
      s = this.push(s);
      return this.pop(this.eff.derivative(s));
    }
     normal(s) {
      s = this.push(s);
      return this.pop(this.eff.normal(s));
    }
     curvature(s) {
      s = this.push(s);
      return this.pop(this.eff.curvature(s));
    }
  }
  _ESClass.register(FlipWrapper);
  _es6_module.add_class(FlipWrapper);
  FlipWrapper = _es6_module.add_export('FlipWrapper', FlipWrapper);
  flip_wrapper_cache = cachering.fromConstructor(FlipWrapper, 32);
}, '/dev/fairmotion/src/curve/spline_base.js');
es6_module_define('spline_types', ["./spline_base", "../core/toolprops.js", "./spline_math.js", "../core/eventdag.js", "../config/config.js", "./spline_multires.js", "../core/struct.js", "./spline_base.js", "../editors/viewport/selectmode.js", "../core/toolprops_iter.js", "../util/mathlib.js"], function _spline_types_module(_es6_module) {
  "use strict";
  var ENABLE_MULTIRES=es6_import_item(_es6_module, '../config/config.js', 'ENABLE_MULTIRES');
  var PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var TPropFlags=es6_import_item(_es6_module, '../core/toolprops.js', 'TPropFlags');
  var PropTypes=es6_import_item(_es6_module, '../core/toolprops.js', 'PropTypes');
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var math=es6_import(_es6_module, '../util/mathlib.js');
  var DataPathNode=es6_import_item(_es6_module, '../core/eventdag.js', 'DataPathNode');
  var NodeBase=es6_import_item(_es6_module, '../core/eventdag.js', 'NodeBase');
  var abs=Math.abs, acos=Math.acos, asin=Math.asin, atan2=Math.atan2, PI=Math.PI, sqrt=Math.sqrt, pow=Math.pow, log=Math.log;
  var ___spline_base=es6_import(_es6_module, './spline_base');
  for (let k in ___spline_base) {
      _es6_module.add_export(k, ___spline_base[k], true);
  }
  var MultiResLayer=es6_import_item(_es6_module, './spline_multires.js', 'MultiResLayer');
  var has_multires=es6_import_item(_es6_module, './spline_multires.js', 'has_multires');
  var ensure_multires=es6_import_item(_es6_module, './spline_multires.js', 'ensure_multires');
  var decompose_id=es6_import_item(_es6_module, './spline_multires.js', 'decompose_id');
  var compose_id=es6_import_item(_es6_module, './spline_multires.js', 'compose_id');
  var SplineTypes=es6_import_item(_es6_module, './spline_base.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, './spline_base.js', 'SplineFlags');
  var ClosestModes=es6_import_item(_es6_module, './spline_base.js', 'ClosestModes');
  var RecalcFlags=es6_import_item(_es6_module, './spline_base.js', 'RecalcFlags');
  var MaterialFlags=es6_import_item(_es6_module, './spline_base.js', 'MaterialFlags');
  var CustomDataLayer=es6_import_item(_es6_module, './spline_base.js', 'CustomDataLayer');
  var CustomData=es6_import_item(_es6_module, './spline_base.js', 'CustomData');
  var CustomDataSet=es6_import_item(_es6_module, './spline_base.js', 'CustomDataSet');
  var SplineElement=es6_import_item(_es6_module, './spline_base.js', 'SplineElement');
  var CurveEffect=es6_import_item(_es6_module, './spline_base.js', 'CurveEffect');
  var SelMask=es6_import_item(_es6_module, '../editors/viewport/selectmode.js', 'SelMask');
  var ORDER=es6_import_item(_es6_module, './spline_math.js', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, './spline_math.js', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, './spline_math.js', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, './spline_math.js', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, './spline_math.js', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, './spline_math.js', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, './spline_math.js', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, './spline_math.js', 'INT_STEPS');
  var eval_curve=es6_import_item(_es6_module, './spline_math.js', 'eval_curve');
  var spiraltheta=es6_import_item(_es6_module, './spline_math.js', 'spiraltheta');
  var spiralcurvature=es6_import_item(_es6_module, './spline_math.js', 'spiralcurvature');
  var spiralcurvature_dv=es6_import_item(_es6_module, './spline_math.js', 'spiralcurvature_dv');
  var $ret_W0cG_aabb;
  class SplineVertex extends SplineElement {
    
    
    
     constructor(co) {
      super(SplineTypes.VERTEX);
      Vector3.prototype.initVector3.apply(this, arguments);
      if (co!==undefined) {
          this[0] = co[0];
          this[1] = co[1];
          if (co.length>2) {
              this[2] = co[2];
          }
      }
      this.type = SplineTypes.VERTEX;
      this.flag = SplineFlags.FRAME_DIRTY|SplineFlags.UPDATE;
      this.segments = [];
      this.eid = 0;
      this.frames = {};
      this.hpair = undefined;
    }
    static  nodedef() {
      return {name: "SplineVertex", 
     uiName: "SplineVertex", 
     inputs: {}, 
     outputs: NodeBase.Inherit()}
    }
    get  aabb() {
      $ret_W0cG_aabb[0].load(this);
      $ret_W0cG_aabb[1].load(this);
      return $ret_W0cG_aabb;
    }
     sethide(state) {
      if (state)
        this.flag|=SplineFlags.HIDE;
      else 
        this.flag&=~SplineFlags.HIDE;
      if (this.type==SplineTypes.HANDLE)
        return ;
      if (state) {
          for (var i=0; i<this.segments.length; i++) {
              this.segments[i].sethide(true);
          }
      }
      else {
        for (var i=0; i<this.segments.length; i++) {
            this.segments[i].sethide(false);
        }
      }
    }
    get  hidden() {
      if (this.type==SplineTypes.VERTEX) {
          return !!(this.flag&SplineFlags.HIDE);
      }
      else {
        var s=this.owning_segment;
        return (this.flag&SplineFlags.HIDE)||!this.use||s.v1.hidden||s.v2.hidden;
      }
    }
    get  owning_segment() {
      return this.segments[0];
    }
    get  owning_vertex() {
      return this.owning_segment.handle_vertex(this);
    }
    get  use() {
      if (this.type!=SplineTypes.HANDLE)
        return true;
      var s=this.owning_segment;
      if (s===undefined) {
          console.warn("Corrupted handle detected", this.eid);
          return false;
      }
      var v=s.handle_vertex(this);
      var ret=v!=undefined&&(v.segments!=undefined&&v.segments.length>2||(v.flag&SplineFlags.USE_HANDLES));
      return ret;
    }
    set  hidden(val) {
      if (val)
        this.flag|=SplineFlags.HIDE;
      else 
        this.flag&=~SplineFlags.HIDE;
    }
     other_segment(s) {
      if (s==this.segments[0])
        return this.segments[1];
      else 
        if (s==this.segments[1])
        return this.segments[0];
      return undefined;
    }
     toJSON() {
      var ret={};
      ret.frame = this.frame;
      ret.segments = [];
      ret[0] = this[0];
      ret[1] = this[1];
      ret[2] = this[2];
      ret.frames = this.frames;
      ret.length = 3;
      for (var i=0; i<this.segments.length; i++) {
          if (this.segments[i]!=undefined)
            ret.segments.push(this.segments[i].eid);
      }
      ret.flag = this.flag;
      ret.eid = this.eid;
      return ret;
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.load(this.co);
      delete this.co;
      for (let axis=0; axis<3; axis++) {
          if (isNaN(this[axis])) {
              console.warn("NaN vertex", this.eid);
              this[axis] = 0;
          }
      }
      return this;
    }
  }
  var $ret_W0cG_aabb=[new Vector3(), new Vector3()];
  _ESClass.register(SplineVertex);
  _es6_module.add_class(SplineVertex);
  SplineVertex = _es6_module.add_export('SplineVertex', SplineVertex);
  
  SplineVertex.STRUCT = STRUCT.inherit(SplineVertex, SplineElement)+`
  co       : vec3          | obj;
  segments : array(e, int) | e.eid;
  hpair    : int           | obj.hpair != undefined? obj.hpair.eid : -1;
}
`;
  mixin(SplineVertex, Vector3);
  var derivative_cache_vs=cachering.fromConstructor(Vector3, 64);
  var closest_point_ret_cache_vs=cachering.fromConstructor(Vector3, 256);
  var closest_point_ret_cache=new cachering(function () {
    return [0, 0];
  }, 256);
  var closest_point_cache_vs=cachering.fromConstructor(Vector3, 64);
  class EffectWrapper extends CurveEffect {
     constructor(owner) {
      super();
      this.seg = owner;
    }
     rescale(ceff, width) {
      while (ceff.prior!=undefined) {
        ceff = ceff.prior;
      }
      var seg1=this.seg;
      var seg2=ceff.seg;
      var l1=seg1.length, l2=seg2.length;
      width = (width*l2)/l1;
      return width;
    }
     _get_nextprev(donext, flip_out) {
      var seg1=this.seg;
      var v=donext ? seg1.v2 : seg1.v1;
      if (v.segments.length!=2)
        return undefined;
      var seg2=v.other_segment(seg1);
      flip_out[0] = (donext&&seg2.v1==v)||(!donext&&seg2.v2==v);
      return seg2._evalwrap;
    }
     evaluate(s) {
      return this.seg.evaluate(s, undefined, undefined, undefined, true);
    }
     derivative(s) {
      return this.seg.derivative(s, undefined, undefined, true);
    }
  }
  _ESClass.register(EffectWrapper);
  _es6_module.add_class(EffectWrapper);
  EffectWrapper = _es6_module.add_export('EffectWrapper', EffectWrapper);
  var $minmax_B0BP_update_aabb;
  class SplineSegment extends SplineElement {
    
    
    
    
    
    
    
    
     constructor(v1, v2) {
      super(SplineTypes.SEGMENT);
      this._evalwrap = new EffectWrapper(this);
      this.l = undefined;
      this.v1 = v1;
      this.v2 = v2;
      this.topoid = -1;
      this.stringid = -1;
      this.has_multires = false;
      this.mat = new Material();
      this.mat.update = this._material_update.bind(this);
      this.z = this.finalz = 5;
      this._aabb = [new Vector3(), new Vector3()];
      this.h1 = this.h2 = undefined;
      this.type = SplineTypes.SEGMENT;
      this.flag = 0;
      this.eid = 0;
      this.ks = new Array(KTOTKS);
      this._last_ks = new Array(KTOTKS);
      for (var i=0; i<this.ks.length; i++) {
          this.ks[i] = 0;
          this._last_ks[i] = 0;
      }
    }
     _material_update() {
      this.flag|=SplineFlags.REDRAW|SplineFlags.FRAME_DIRTY|SplineFlags.UPDATE;
      this.v1.flag|=SplineFlags.UPDATE;
      this.v2.flag|=SplineFlags.UPDATE;
    }
    get  aabb() {
      if (this.flag&SplineFlags.UPDATE_AABB)
        this.update_aabb();
      return this._aabb;
    }
    set  aabb(val) {
      this._aabb = val;
    }
     _update_has_multires() {
      this.has_multires = false;
      for (var i=0; i<this.cdata.length; i++) {
          if (__instance_of(this.cdata[i], MultiResLayer)) {
              this.has_multires = true;
              break;
          }
      }
    }
     update_aabb(steps=8) {
      this._update_has_multires();
      this.flag&=~SplineFlags.UPDATE_AABB;
      var min=this._aabb[0], max=this._aabb[1];
      $minmax_B0BP_update_aabb.reset();
      min.zero();
      max.zero();
      var co=this.evaluate(0);
      $minmax_B0BP_update_aabb.minmax(co);
      var ds=1.0/(steps-1);
      for (let i=0, s=0; i<steps; i++, s+=ds) {
          var co=this.evaluate(s*0.999999999);
          $minmax_B0BP_update_aabb.minmax(co);
      }
      min.load($minmax_B0BP_update_aabb.min);
      max.load($minmax_B0BP_update_aabb.max);
      min[2] = max[2] = 0.0;
    }
     closest_point(p, mode, fast=false) {
      var minret=undefined, mindis=1e+18, maxdis=0;
      var p2=closest_point_cache_vs.next().zero();
      for (var i=0; i<p.length; i++) {
          p2[i] = p[i];
      }
      p = p2;
      if (mode==undefined)
        mode = 0;
      var steps=5, s=0, ds=1.0/(steps);
      var n=closest_point_cache_vs.next();
      var n1=closest_point_cache_vs.next(), n2=closest_point_cache_vs.next();
      var n3=closest_point_cache_vs.next(), n4=closest_point_cache_vs.next();
      if (mode==ClosestModes.ALL)
        minret = [];
      for (var i=0; i<steps; i++, s+=ds) {
          var start=s-1e-05, end=s+ds+1e-05;
          start = Math.min(Math.max(start, 0.0), 1.0);
          end = Math.min(Math.max(end, 0.0), 1.0);
          var mid=(start+end)*0.5;
          var bad=false;
          var angle_limit=fast ? 0.65 : 0.2;
          var steps=fast ? 5 : 20;
          for (var j=0; j<steps; j++) {
              mid = (start+end)*0.5;
              var co=this.evaluate(mid, undefined, undefined, undefined, true);
              var sco=this.evaluate(start, undefined, undefined, undefined, true);
              var eco=this.evaluate(end, undefined, undefined, undefined, true);
              var d1=this.normal(start, true).normalize();
              var d2=this.normal(end, true).normalize();
              var dm=this.normal(mid, true).normalize();
              n1.load(sco).sub(p).normalize();
              n2.load(eco).sub(p).normalize();
              n.load(co).sub(p).normalize();
              if (n1.dot(d1)<0.0)
                d1.negate();
              if (n2.dot(d2)<0.0)
                d2.negate();
              if (n.dot(dm)<0)
                dm.negate();
              var mang=acos(n.normalizedDot(dm));
              if (mang<0.001)
                break;
              var ang1=acos(n1.normalizedDot(d1));
              var ang2=acos(n2.normalizedDot(d2));
              var w1=n1.cross(d1)[2]<0.0;
              var w2=n2.cross(d2)[2]<0.0;
              var wm=n.cross(dm)[2]<0.0;
              if (isNaN(mang)) {
                  console.warn("NaN!", p, co, mid, dm);
              }
              if (j==0&&w1==w2) {
                  bad = true;
                  break;
              }
              else 
                if (w1==w2) {
              }
              if (w1==w2) {
                  var dis1, dis2;
                  dis1 = ang1, dis2 = ang2;
                  if (dis2<dis1) {
                      start = mid;
                  }
                  else 
                    if (dis1<dis2) {
                      end = mid;
                  }
                  else {
                    break;
                  }
              }
              else 
                if (wm==w1) {
                  start = mid;
              }
              else {
                end = mid;
              }
          }
          if (bad)
            continue;
          var co=this.evaluate(mid, undefined, undefined, undefined, true);
          n1.load(this.normal(mid, true)).normalize();
          n2.load(co).sub(p).normalize();
          if (n2.dot(n1)<0) {
              n2.negate();
          }
          var angle=acos(Math.min(Math.max(n1.dot(n2), -1), 1));
          if (angle>angle_limit)
            continue;
          if (mode!=ClosestModes.ALL&&minret==undefined) {
              var minret=closest_point_ret_cache.next();
              minret[0] = minret[1] = undefined;
          }
          var dis=co.vectorDistance(p);
          if (mode==ClosestModes.CLOSEST) {
              if (dis<mindis) {
                  minret[0] = closest_point_cache_vs.next().load(co);
                  minret[1] = mid;
                  mindis = dis;
              }
          }
          else 
            if (mode==ClosestModes.START) {
              if (mid<mindis) {
                  minret[0] = closest_point_cache_vs.next().load(co);
                  minret[1] = mid;
                  mindis = mid;
              }
          }
          else 
            if (mode==ClosestModes.END) {
              if (mid>maxdis) {
                  minret[0] = closest_point_cache_vs.next().load(co);
                  minret[1] = mid;
                  maxdis = mid;
              }
          }
          else 
            if (mode==ClosestModes.ALL) {
              var ret=closest_point_ret_cache.next();
              ret[0] = closest_point_cache_vs.next().load(co);
              ret[1] = mid;
              minret.push(ret);
          }
      }
      if (minret==undefined&&mode==ClosestModes.CLOSEST) {
          var dis1=this.v1.vectorDistance(p), dis2=this.v2.vectorDistance(p);
          minret = closest_point_ret_cache.next();
          minret[0] = closest_point_cache_vs.next().load(dis1<dis2 ? this.v1 : this.v2);
          minret[1] = dis1<dis2 ? 0.0 : 1.0;
      }
      else 
        if (minret==undefined&&mode==ClosestModes.START) {
          minret = closest_point_ret_cache.next();
          minret[0] = closest_point_cache_vs.next().load(this.v1);
          minret[1] = 0.0;
      }
      if (minret==undefined&&mode==ClosestModes.END) {
          minret = closest_point_ret_cache.next();
          minret[0] = closest_point_cache_vs.next().load(this.v2);
          minret[1] = 1.0;
      }
      return minret;
    }
     normal(s, no_effects=!ENABLE_MULTIRES) {
      var ret=this.derivative(s, undefined, undefined, no_effects);
      var t=ret[0];
      ret[0] = -ret[1];
      ret[1] = t;
      ret.normalize();
      return ret;
    }
     ends(v) {
      if (v===this.v1)
        return 0.0;
      if (v===this.v2)
        return 1.0;
    }
     handle(v) {
      if (v===this.v1)
        return this.h1;
      if (v===this.v2)
        return this.h2;
    }
     handle_vertex(h) {
      if (h===this.h1)
        return this.v1;
      if (h===this.h2)
        return this.v2;
    }
    get  is_line() {
      var r1=(this.v1.flag&SplineFlags.BREAK_TANGENTS);
      var r2=(this.v2.flag&SplineFlags.BREAK_TANGENTS);
      return r1&&r2;
    }
    get  renderable() {
      return !(this.flag&SplineFlags.NO_RENDER);
    }
    set  renderable(val) {
      if (!val)
        this.flag|=SplineFlags.NO_RENDER;
      else 
        this.flag&=~SplineFlags.NO_RENDER;
    }
     update_handle(h) {
      var ov=this.handle_vertex(h);
      if (h.hpair!=undefined) {
          var seg=h.hpair.owning_segment;
          var v=this.handle_vertex(h);
          var len=h.hpair.vectorDistance(v);
          h.hpair.load(h).sub(v).negate().normalize().mulScalar(len).add(v);
          seg.update();
          return h.hpair;
      }
      else 
        if (ov.segments.length==2&&h.use&&!(ov.flag&SplineFlags.BREAK_TANGENTS)) {
          var h2=h.owning_vertex.other_segment(h.owning_segment).handle(h.owning_vertex);
          var hv=h2.owning_segment.handle_vertex(h2), len=h2.vectorDistance(hv);
          h2.load(h).sub(hv).negate().normalize().mulScalar(len).add(hv);
          h2.owning_segment.update();
          return h2;
      }
    }
     other_handle(h_or_v) {
      if (h_or_v==this.v1)
        return this.h2;
      if (h_or_v==this.v2)
        return this.h1;
      if (h_or_v==this.h1)
        return this.h2;
      if (h_or_v==this.h2)
        return this.h1;
    }
    get  length() {
      return this.ks[KSCALE];
    }
     toJSON() {
      var ret={};
      ret.frames = this.frames;
      ret.ks = [];
      for (var i=0; i<this.ks.length; i++) {
          ret.ks.push(this.ks[i]);
      }
      ret.v1 = this.v1.eid;
      ret.v2 = this.v2.eid;
      ret.h1 = this.h1!=undefined ? this.h1.eid : -1;
      ret.h2 = this.h2!=undefined ? this.h2.eid : -1;
      ret.eid = this.eid;
      ret.flag = this.flag;
      return ret;
    }
     curvature(s, order, override_scale) {
      if (order==undefined)
        order = ORDER;
      eval_curve(0.5, this.v1, this.v2, this.ks, order, 1);
      var k=spiralcurvature(s, this.ks, order);
      return k/(1e-05+this.ks[KSCALE]);
    }
     curvature_dv(s, order, override_scale) {
      if (order==undefined)
        order = ORDER;
      eval_curve(0.5, this.v1, this.v2, this.ks, order, 1);
      var k=spiralcurvature_dv(s, this.ks, order);
      return k/(1e-05+this.ks[KSCALE]);
    }
     derivative(s, order, no_update_curve, no_effects) {
      if (order==undefined)
        order = ORDER;
      var ret=derivative_cache_vs.next().zero();
      var ks=this.ks;
      if (!no_update_curve)
        eval_curve(0.5, this.v1, this.v2, ks, order, 1);
      var th=spiraltheta(s, ks, order);
      var k=spiralcurvature(s, ks, order);
      var ang=ks[KANGLE];
      ret[0] = sin(th+ang)*ks[KSCALE];
      ret[1] = cos(th+ang)*ks[KSCALE];
      ret[2] = 0.0;
      return ret;
    }
     theta(s, order, no_effects) {
      if (order==undefined)
        order = ORDER;
      return spiraltheta(s, this.ks, order)*this.ks[KSCALE];
    }
     offset_eval(s, offset, order, no_update) {
      if (order==undefined)
        order = ORDER;
      var ret=this.evaluate(s, order, undefined, no_update);
      if (offset==0.0)
        return ret;
      var tan=this.derivative(s, order, no_update);
      var t=tan[0];
      tan[0] = -tan[1];
      tan[1] = t;
      tan.normalize().mulScalar(offset);
      ret.add(tan);
      return ret;
    }
     evaluate(s, order, override_scale, no_update, no_effects=!ENABLE_MULTIRES) {
      if (no_effects) {
          if (order==undefined)
            order = ORDER;
          s = (s+1e-08)*(1.0-2e-08);
          s-=0.5;
          var co=eval_curve(s, this.v1, this.v2, this.ks, order, undefined, no_update);
          return co;
      }
      else {
        var wrap=this._evalwrap;
        var last=wrap;
        for (var i=0; i<this.cdata.length; i++) {
            if (this.cdata[i].constructor.layerinfo.has_curve_effect) {
                var eff=this.cdata[i].curve_effect(this);
                eff.set_parent(last);
                last = eff;
            }
        }
        return last.evaluate(s);
      }
    }
     post_solve() {
      super.post_solve();
    }
     update() {
      this._update_has_multires();
      this.flag|=SplineFlags.UPDATE|SplineFlags.UPDATE_AABB;
      this.h1.flag|=SplineFlags.UPDATE;
      this.h2.flag|=SplineFlags.UPDATE;
      for (var i=0; i<this.cdata.length; i++) {
          this.cdata[i].update(this);
      }
      var l=this.l;
      if (l==undefined)
        return ;
      var c=0;
      do {
        if (c++>10000) {
            console.log("Infinte loop detected!");
            break;
        }
        l.f.update();
        l = l.radial_next;
      } while (l!=undefined&&l!=this.l);
      
    }
     global_to_local(s, fixed_s=undefined) {
      return this._evalwrap.global_to_local(s, fixed_s);
    }
     local_to_global(p) {
      return this._evalwrap.local_to_global(p);
    }
     shared_vert(s) {
      if (this.v1===s.v1||this.v1==s.v2)
        return this.v1;
      if (this.v2===s.v1||this.v2==s.v2)
        return this.v2;
    }
     other_vert(v) {
      if (v==this.v1)
        return this.v2;
      if (v==this.v2)
        return this.v1;
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.mat.update = this._material_update.bind(this);
    }
  }
  var $minmax_B0BP_update_aabb=new MinMax(2);
  _ESClass.register(SplineSegment);
  _es6_module.add_class(SplineSegment);
  SplineSegment = _es6_module.add_export('SplineSegment', SplineSegment);
  SplineSegment.STRUCT = STRUCT.inherit(SplineSegment, SplineElement)+`
  ks   : array(float);
  
  v1   : int | obj.v1.eid;
  v2   : int | obj.v2.eid;
  
  h1   : int | obj.h1 != undefined ? obj.h1.eid : -1;
  h2   : int | obj.h2 != undefined ? obj.h2.eid : -1;
  
  l    : int | obj.l != undefined  ? obj.l.eid : -1;
  
  mat  : Material;

  aabb   : array(vec3);
  z      : float;
  finalz : float;
  has_multires : int;
  
  topoid   : int;
  stringid : int;
}
`;
  class SplineLoop extends SplineElement {
     constructor(f, s, v) {
      super(SplineTypes.LOOP);
      this.f = f, this.s = s, this.v = v;
      this.next = this.prev = undefined;
      this.radial_next = this.radial_prev = undefined;
    }
    static  fromSTRUCT(reader) {
      var ret=new SplineLoop();
      reader(ret);
      return ret;
    }
  }
  _ESClass.register(SplineLoop);
  _es6_module.add_class(SplineLoop);
  SplineLoop = _es6_module.add_export('SplineLoop', SplineLoop);
  SplineLoop.STRUCT = STRUCT.inherit(SplineLoop, SplineElement)+`
    f    : int | obj.f.eid;
    s    : int | obj.s.eid;
    v    : int | obj.v.eid;
    next : int | obj.next.eid;
    prev : int | obj.prev.eid;
    radial_next : int | obj.radial_next != undefined ? obj.radial_next.eid : -1;
    radial_prev : int | obj.radial_prev != undefined ? obj.radial_prev.eid : -1;
  }
`;
  class SplineLoopPathIter  {
    
     constructor(path) {
      this.path = path;
      this.ret = {done: false, 
     value: undefined};
      this.l = path!=undefined ? path.l : undefined;
    }
     init(path) {
      this.path = path;
      this.l = path.l;
      this.ret.done = false;
      this.ret.value = undefined;
      return this;
    }
     next() {
      var ret=this.ret;
      if (this.l==undefined) {
          ret.done = true;
          ret.value = undefined;
          return ret;
      }
      ret.value = this.l;
      this.l = this.l.next;
      if (this.l===this.path.l)
        this.l = undefined;
      return ret;
    }
     reset() {
      this.l = this.path.l;
      this.ret.done = false;
      this.ret.value = undefined;
    }
  }
  _ESClass.register(SplineLoopPathIter);
  _es6_module.add_class(SplineLoopPathIter);
  var $cent_uKa5_update_winding;
  class SplineLoopPath  {
    
     constructor(l, f) {
      this.l = l;
      this.f = f;
      this.totvert = undefined;
      this.winding = 0;
    }
     [Symbol.iterator]() {
      if (this.itercache==undefined) {
          this.itercache = cachering.fromConstructor(SplineLoopPathIter, 4);
      }
      return this.itercache.next().init(this);
    }
     update_winding() {
      $cent_uKa5_update_winding.zero();
      for (var l of this) {
          $cent_uKa5_update_winding.add(l.v);
      }
      $cent_uKa5_update_winding.mulScalar(1.0/this.totvert);
      var wsum=0;
      for (var l of this) {
          wsum+=math.winding(l.v, l.next.v, $cent_uKa5_update_winding) ? 1 : -1;
      }
      this.winding = wsum>=0;
    }
     asArray() {
      var l=this.l;
      var ret=[];
      do {
        ret.push(l);
        l = l.next;
      } while (l!==this.l);
      
      return ret;
    }
    static  fromSTRUCT(reader) {
      var ret=new SplineLoopPath();
      reader(ret);
      var l=ret.l = ret.loops[0];
      l.p = ret;
      for (var i=1; i<ret.loops.length; i++) {
          l.next = ret.loops[i];
          ret.loops[i].prev = l;
          ret.loops[i].p = ret;
          l = ret.loops[i];
      }
      ret.loops[0].prev = ret.loops[ret.loops.length-1];
      ret.loops[ret.loops.length-1].next = ret.loops[0];
      delete ret.loops;
      return ret;
    }
  }
  var $cent_uKa5_update_winding=new Vector3();
  _ESClass.register(SplineLoopPath);
  _es6_module.add_class(SplineLoopPath);
  SplineLoopPath = _es6_module.add_export('SplineLoopPath', SplineLoopPath);
  SplineLoopPath.STRUCT = ` 
  SplineLoopPath {
    totvert : int;
    loops   : array(SplineLoop) | obj.asArray();
    winding : int;
  }
`;
  var $minmax_kdcK_update_aabb;
  class SplineFace extends SplineElement {
    
    
    
     constructor() {
      super(SplineTypes.FACE);
      this.z = this.finalz = 0;
      this.mat = new Material();
      this.paths = new GArray();
      this.flag|=SplineFlags.UPDATE_AABB;
      this._aabb = [new Vector3(), new Vector3()];
      var this2=this;
      this.mat.update = this._mat_update.bind(this);
    }
     _mat_update() {
      this.flag|=SplineFlags.REDRAW;
    }
     update() {
      this.flag|=SplineFlags.UPDATE_AABB|SplineFlags.REDRAW;
    }
     update_aabb() {
      this.flag&=~SplineFlags.UPDATE_AABB;
      $minmax_kdcK_update_aabb.reset();
      for (var path of this.paths) {
          for (var l of path) {
              $minmax_kdcK_update_aabb.minmax(l.v.aabb[0]);
              $minmax_kdcK_update_aabb.minmax(l.v.aabb[1]);
              $minmax_kdcK_update_aabb.minmax(l.s.aabb[0]);
              $minmax_kdcK_update_aabb.minmax(l.s.aabb[1]);
          }
      }
      this._aabb[0].load($minmax_kdcK_update_aabb.min);
      this._aabb[1].load($minmax_kdcK_update_aabb.max);
      this._aabb[0][2] = this._aabb[1][2] = 0.0;
    }
    get  aabb() {
      if (this.flag&SplineFlags.UPDATE_AABB)
        this.update_aabb();
      return this._aabb;
    }
    set  aabb(val) {
      this._aabb = val;
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.flag|=SplineFlags.UPDATE_AABB;
      this.mat.update = this._mat_update.bind(this);
    }
  }
  var $minmax_kdcK_update_aabb=new MinMax(3);
  _ESClass.register(SplineFace);
  _es6_module.add_class(SplineFace);
  SplineFace = _es6_module.add_export('SplineFace', SplineFace);
  SplineFace.STRUCT = STRUCT.inherit(SplineFace, SplineElement)+`
    paths  : array(SplineLoopPath);
    mat    : Material;
    aabb   : array(vec3);
    z      : float;
    finalz : float;
  }
`;
  class Material  {
    
    
    
    
    
    
    
     constructor() {
      this.fillcolor = [0, 0, 0, 1];
      this.strokecolor = [0, 0, 0, 1];
      this.linewidth = 2.0;
      this.flag = 0;
      this.opacity = 1.0;
      this.fill_over_stroke = false;
      this.blur = 0.0;
    }
     update() {
      throw new Error("override me! should have happened in splinesegment or splineface constructors!");
    }
     equals(is_stroke, mat) {
      var color1=is_stroke ? this.strokecolor : this.fillcolor;
      var color2=is_stroke ? mat.strokecolor : mat.fillcolor;
      for (var i=0; i<4; i++) {
          if (color1[i]!=color2[i])
            return false;
      }
      if (this.flag!=mat.flag)
        return false;
      if (this.opacity!=mat.opacity)
        return false;
      if (this.blur!=mat.blur)
        return false;
      if (is_stroke&&this.linewidth!=mat.linewidth)
        return false;
      return true;
    }
     load(mat) {
      for (var i=0; i<4; i++) {
          this.fillcolor[i] = mat.fillcolor[i];
          this.strokecolor[i] = mat.strokecolor[i];
      }
      this.opacity = mat.opacity;
      this.linewidth = mat.linewidth;
      this.fill_over_stroke = mat.fill_over_stroke;
      this.blur = mat.blur;
      this.flag = mat.flag;
      return this;
    }
    get  css_fillcolor() {
      var r=Math.floor(this.fillcolor[0]*255);
      var g=Math.floor(this.fillcolor[1]*255);
      var b=Math.floor(this.fillcolor[2]*255);
      return "rgba("+r+","+g+","+b+","+this.fillcolor[3]+")";
    }
    static  fromSTRUCT(reader) {
      var ret=new Material();
      reader(ret);
      return ret;
    }
  }
  _ESClass.register(Material);
  _es6_module.add_class(Material);
  Material = _es6_module.add_export('Material', Material);
  Material.STRUCT = `
  Material {
    fillcolor        : array(float);
    strokecolor      : array(float);
    opacity          : float;
    fill_over_stroke : int;
    linewidth        : float;
    blur             : float;
    flag             : int;
  }
`;
  var ToolIter=es6_import_item(_es6_module, '../core/toolprops_iter.js', 'ToolIter');
  var TPropIterable=es6_import_item(_es6_module, '../core/toolprops_iter.js', 'TPropIterable');
  class ElementRefIter extends ToolIter {
    
     constructor() {
      super();
      this.ret = {done: false, 
     value: undefined};
      this.spline = this.ctx = this.iter = undefined;
    }
     init(eset) {
      this.ret.done = false;
      this.nextitem = undefined;
      this.eset = eset;
      this.ctx = eset!=undefined ? eset.ctx : undefined;
      this.spline = this.ctx!=undefined ? this.ctx.spline : undefined;
      return this;
    }
     spawn() {
      var ret=new ElementRefIter();
      ret.init(this.eset);
      return ret;
    }
     next() {
      var ret=this.ret;
      if (this.spline==undefined)
        this.spline = this.ctx.spline;
      if (this.iter==undefined)
        this.iter = set.prototype[Symbol.iterator].call(this.eset);
      var spline=this.spline;
      var next, e=undefined;
      do {
        var next=this.iter.next();
        if (next.done)
          break;
        e = spline.eidmap[next.value];
        if (e==undefined) {
            console.log("Warning, bad eid", next.value);
        }
      } while (next.done!=true&&e==undefined);
      
      if (e==undefined||next.done==true) {
          this.spline = undefined;
          this.iter = undefined;
          ret.done = true;
          ret.value = undefined;
      }
      else {
        ret.value = e;
      }
      return ret;
    }
     reset() {
      this.i = 0;
      this.ret.done = false;
      this.spline = undefined;
      this.iter = undefined;
    }
     [Symbol.iterator]() {
      return this;
    }
    static  fromSTRUCT(reader) {
      var ret=new ElementRefIter();
      reader(ret);
      for (var i=0; i<ret.saved_items.length; i++) {
          ret.add(ret.saved_items[i]);
      }
      delete ret.saved_items;
      return ret;
    }
  }
  _ESClass.register(ElementRefIter);
  _es6_module.add_class(ElementRefIter);
  ElementRefIter = _es6_module.add_export('ElementRefIter', ElementRefIter);
  ElementRefIter.STRUCT = `
  ElementRefIter {
    mask        : int;
    saved_items : iter(int) | obj;
  }
`;
  class ElementRefSet extends set {
     constructor(mask) {
      super();
      this.mask = mask==undefined ? SplineTypes.ALL : mask;
    }
     add(item) {
      var start_item=item;
      if (!(typeof item=="number"||__instance_of(item, Number)))
        item = item.eid;
      if (item==undefined) {
          console.trace("ERROR in ElementRefSet!!", start_item);
          return ;
      }
      set.prototype.add.call(this, item);
    }
     copy() {
      var ret=new ElementRefSet(this.mask);
      for (var eid of set.prototype[Symbol.iterator].call(this)) {
          ret.add(eid);
      }
      return ret;
    }
     [Symbol.iterator]() {
      if (this.itercaches==undefined) {
          this.itercaches = cachering.fromConstructor(ElementRefIter, 8);
      }
      return this.itercaches.next().init(this);
    }
  }
  _ESClass.register(ElementRefSet);
  _es6_module.add_class(ElementRefSet);
  ElementRefSet = _es6_module.add_export('ElementRefSet', ElementRefSet);
  
  mixin(ElementRefSet, TPropIterable);
}, '/dev/fairmotion/src/curve/spline_types.js');
es6_module_define('spline_query', ["./spline_multires.js", "../editors/viewport/selectmode.js"], function _spline_query_module(_es6_module) {
  var SelMask=es6_import_item(_es6_module, '../editors/viewport/selectmode.js', 'SelMask');
  var has_multires=es6_import_item(_es6_module, './spline_multires.js', 'has_multires');
  var compose_id=es6_import_item(_es6_module, './spline_multires.js', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, './spline_multires.js', 'decompose_id');
  var MResFlags=es6_import_item(_es6_module, './spline_multires.js', 'MResFlags');
  var MultiResLayer=es6_import_item(_es6_module, './spline_multires.js', 'MultiResLayer');
  var PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var sqrt=Math.sqrt;
  let findnearest_segment_tmp=new Vector2();
  var $_mpos_7cJ0_findnearest_vert;
  var $_v_s2Jz_findnearest_vert;
  class SplineQuery  {
     constructor(spline) {
      this.spline = spline;
    }
     findnearest(editor, mpos, selectmask, limit, ignore_layers) {
      if (limit==undefined)
        limit = 15;
      var dis=1e+18;
      var data=undefined;
      if (selectmask&SelMask.VERTEX) {
          var ret=this.findnearest_vert(editor, mpos, limit, undefined, ignore_layers);
          if (ret!=undefined&&ret[1]<dis) {
              data = ret;
              dis = ret[1];
          }
      }
      if (selectmask&SelMask.HANDLE) {
          var ret=this.findnearest_vert(editor, mpos, limit, true, ignore_layers);
          if (ret!=undefined&&ret[1]<dis) {
              data = ret;
              dis = ret[1];
          }
      }
      if (selectmask&SelMask.SEGMENT) {
          var ret=this.findnearest_segment(editor, mpos, limit, ignore_layers);
          if (ret!=undefined&&ret[1]<dis) {
              data = ret;
              dis = ret[1];
          }
      }
      if (selectmask&SelMask.FACE) {
          mpos = [mpos[0], mpos[1]];
          mpos[0]+=editor.pos[0];
          mpos[1]+=editor.pos[1];
          var ret=this.findnearest_face(editor, mpos, limit, ignore_layers);
          if (ret!=undefined&&ret[1]<dis) {
              data = ret;
              dis = ret[1];
          }
      }
      return data;
    }
     findnearest_segment(editor, mpos, limit, ignore_layers) {
      var spline=this.spline;
      var actlayer=spline.layerset.active;
      var sret=undefined, mindis=limit;
      mpos = findnearest_segment_tmp.load(mpos);
      editor.unproject(mpos);
      for (var seg of spline.segments) {
          var ret=seg.closest_point(mpos, undefined, true);
          if (ret==undefined)
            continue;
          ret = ret[0];
          if (seg.hidden||seg.v1.hidden||seg.v2.hidden)
            continue;
          if (!ignore_layers&&!seg.in_layer(actlayer))
            continue;
          var dis=sqrt((ret[0]-mpos[0])*(ret[0]-mpos[0])+(ret[1]-mpos[1])*(ret[1]-mpos[1]));
          if (dis<mindis) {
              sret = seg;
              mindis = dis;
          }
      }
      if (sret!=undefined)
        return [sret, mindis, SelMask.SEGMENT];
    }
     findnearest_face(editor, mpos, limit, ignore_layers) {
      var spline=this.spline;
      var actlayer=spline.layerset.active;
      var g=spline.canvas;
      var dis=0, closest=undefined;
      if (g==undefined)
        return ;
      for (var i=0; i<spline.faces.length; i++) {
          var f=spline.faces[i];
          if ((!ignore_layers&&!f.in_layer(actlayer))||f.hidden)
            continue;
          spline.trace_face(g, f);
          if (g.isPointInPath(mpos[0], window.innerHeight-mpos[1])) {
              closest = f;
          }
      }
      g.beginPath();
      if (closest!=undefined)
        return [closest, dis, SelMask.FACE];
    }
     findnearest_vert(editor, mpos, limit, do_handles, ignore_layers) {
      var spline=this.spline;
      var actlayer=spline.layerset.active;
      if (limit==undefined)
        limit = 15;
      var min=1e+17;
      var ret=undefined;
      mpos = $_mpos_7cJ0_findnearest_vert.load(mpos);
      mpos[2] = 0.0;
      var list=do_handles ? spline.handles : spline.verts;
      for (var v of list) {
          if (v.hidden)
            continue;
          if (!ignore_layers&&!v.in_layer(actlayer))
            continue;
          var co=v;
          $_v_s2Jz_findnearest_vert.load(co);
          $_v_s2Jz_findnearest_vert[2] = 0.0;
          editor.project($_v_s2Jz_findnearest_vert);
          var dis=$_v_s2Jz_findnearest_vert.vectorDistance(mpos);
          if (dis<limit&&dis<min) {
              min = dis;
              ret = v;
          }
      }
      if (ret!=undefined) {
          return [ret, min, do_handles ? SelMask.HANDLE : SelMask.VERTEX];
      }
    }
  }
  var $_mpos_7cJ0_findnearest_vert=new Vector3();
  var $_v_s2Jz_findnearest_vert=new Vector3();
  _ESClass.register(SplineQuery);
  _es6_module.add_class(SplineQuery);
  SplineQuery = _es6_module.add_export('SplineQuery', SplineQuery);
}, '/dev/fairmotion/src/curve/spline_query.js');
es6_module_define('spline_draw', ["../util/vectormath.js", "../editors/viewport/view2d_editor.js", "./spline_draw_sort", "./spline_math.js", "../editors/viewport/selectmode.js", "../util/mathlib.js", "./spline_draw_new.js", "./spline_types.js", "../core/animdata.js", "../config/config.js", "./spline_draw_sort.js", "./spline_element_array.js"], function _spline_draw_module(_es6_module) {
  var aabb_isect_minmax2d=es6_import_item(_es6_module, '../util/mathlib.js', 'aabb_isect_minmax2d');
  var ENABLE_MULTIRES=es6_import_item(_es6_module, '../config/config.js', 'ENABLE_MULTIRES');
  var SessionFlags=es6_import_item(_es6_module, '../editors/viewport/view2d_editor.js', 'SessionFlags');
  var SelMask=es6_import_item(_es6_module, '../editors/viewport/selectmode.js', 'SelMask');
  var ORDER=es6_import_item(_es6_module, './spline_math.js', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, './spline_math.js', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, './spline_math.js', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, './spline_math.js', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, './spline_math.js', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, './spline_math.js', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, './spline_math.js', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, './spline_math.js', 'INT_STEPS');
  var get_vtime=es6_import_item(_es6_module, '../core/animdata.js', 'get_vtime');
  var spline_draw_cache_vs=cachering.fromConstructor(Vector3, 64);
  var spline_draw_trans_vs=cachering.fromConstructor(Vector3, 32);
  var PI=Math.PI;
  var pow=Math.pow, cos=Math.cos, sin=Math.sin, abs=Math.abs, floor=Math.floor, ceil=Math.ceil, sqrt=Math.sqrt, log=Math.log, acos=Math.acos, asin=Math.asin;
  var DRAW_MAXCURVELEN=10000;
  DRAW_MAXCURVELEN = _es6_module.add_export('DRAW_MAXCURVELEN', DRAW_MAXCURVELEN);
  var SplineFlags=es6_import_item(_es6_module, './spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, './spline_types.js', 'SplineTypes');
  var SplineElement=es6_import_item(_es6_module, './spline_types.js', 'SplineElement');
  var SplineVertex=es6_import_item(_es6_module, './spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, './spline_types.js', 'SplineSegment');
  var SplineLoop=es6_import_item(_es6_module, './spline_types.js', 'SplineLoop');
  var SplineLoopPath=es6_import_item(_es6_module, './spline_types.js', 'SplineLoopPath');
  var SplineFace=es6_import_item(_es6_module, './spline_types.js', 'SplineFace');
  var RecalcFlags=es6_import_item(_es6_module, './spline_types.js', 'RecalcFlags');
  var MaterialFlags=es6_import_item(_es6_module, './spline_types.js', 'MaterialFlags');
  var ElementArray=es6_import_item(_es6_module, './spline_element_array.js', 'ElementArray');
  var SplineLayerFlags=es6_import_item(_es6_module, './spline_element_array.js', 'SplineLayerFlags');
  var ColorFlags={SELECT: 1, 
   ACTIVE: 2, 
   HIGHLIGHT: 4}
  ColorFlags = _es6_module.add_export('ColorFlags', ColorFlags);
  var FlagMap={UNSELECT: 0, 
   SELECT: ColorFlags.SELECT, 
   ACTIVE: ColorFlags.ACTIVE, 
   HIGHLIGHT: ColorFlags.HIGHLIGHT, 
   SELECT_ACTIVE: ColorFlags.SELECT|ColorFlags.ACTIVE, 
   SELECT_HIGHLIGHT: ColorFlags.SELECT|ColorFlags.HIGHLIGHT, 
   HIGHLIGHT_ACTIVE: ColorFlags.HIGHLIGHT|ColorFlags.ACTIVE, 
   SELECT_HIGHLIGHT_ACTIVE: ColorFlags.SELECT|ColorFlags.ACTIVE|ColorFlags.HIGHLIGHT}
  FlagMap = _es6_module.add_export('FlagMap', FlagMap);
  function mix(a, b, t) {
    var ret=[0, 0, 0];
    for (var i=0; i<3; i++) {
        ret[i] = a[i]+(b[i]-a[i])*t;
    }
    return ret;
  }
  var ElementColor={UNSELECT: [1, 0.133, 0.07], 
   SELECT: [1, 0.6, 0.26], 
   HIGHLIGHT: [1, 0.93, 0.4], 
   ACTIVE: [0.3, 0.4, 1.0], 
   SELECT_ACTIVE: mix([1, 0.6, 0.26], [0.1, 0.2, 1.0], 0.7), 
   SELECT_HIGHLIGHT: [1, 1, 0.8], 
   HIGHLIGHT_ACTIVE: mix([1, 0.93, 0.4], [0.3, 0.4, 1.0], 0.5), 
   SELECT_HIGHLIGHT_ACTIVE: [0.85, 0.85, 1.0]}
  ElementColor = _es6_module.add_export('ElementColor', ElementColor);
  var HandleColor={UNSELECT: [0.2, 0.7, 0.07], 
   SELECT: [0.1, 1, 0.26], 
   HIGHLIGHT: [0.2, 0.93, 0.4], 
   ACTIVE: [0.1, 1, 0.75], 
   SELECT_ACTIVE: mix([1, 0.6, 0.26], [0.1, 0.2, 1.0], 0.7), 
   SELECT_HIGHLIGHT: [1, 1, 0.8], 
   HIGHLIGHT_ACTIVE: mix([1, 0.93, 0.4], [0.3, 0.4, 1.0], 0.5), 
   SELECT_HIGHLIGHT_ACTIVE: [0.85, 0.85, 1.0]}
  HandleColor = _es6_module.add_export('HandleColor', HandleColor);
  HandleColor.SELECT_ACTIVE = mix(HandleColor.SELECT, HandleColor.ACTIVE, 0.5);
  HandleColor.SELECT_HIGHLIGHT = mix(HandleColor.SELECT, HandleColor.HIGHLIGHT, 0.5);
  HandleColor.HIGHLIGHT_ACTIVE = mix(HandleColor.HIGHLIGHT, HandleColor.ACTIVE, 0.5);
  HandleColor.SELECT_HIGHLIGHT_ACTIVE = mix(mix(HandleColor.SELECT, HandleColor.ACTIVE, 0.5), HandleColor.HIGHLIGHT, 0.5);
  function rgb2css(color) {
    var r=color[0], g=color[1], b=color[2];
    return "rgb("+(~~(r*255))+","+(~~(g*255))+","+(~~(b*255))+")";
  }
  var element_colormap=new Array(8);
  element_colormap = _es6_module.add_export('element_colormap', element_colormap);
  for (var k in ElementColor) {
      var f=FlagMap[k];
      element_colormap[f] = rgb2css(ElementColor[k]);
  }
  var handle_colormap=new Array(8);
  handle_colormap = _es6_module.add_export('handle_colormap', handle_colormap);
  for (var k in HandleColor) {
      var f=FlagMap[k];
      handle_colormap[f] = rgb2css(HandleColor[k]);
  }
  function get_element_flag(e, list) {
    var f=0;
    f|=e.flag&SplineFlags.SELECT ? ColorFlags.SELECT : 0;
    f|=e===list.highlight ? ColorFlags.HIGHLIGHT : 0;
    f|=e===list.active ? ColorFlags.ACTIVE : 0;
    return f;
  }
  function get_element_color(e, list) {
    if (e.type==SplineTypes.HANDLE)
      return handle_colormap[get_element_flag(e, list)];
    else 
      return element_colormap[get_element_flag(e, list)];
  }
  get_element_color = _es6_module.add_export('get_element_color', get_element_color);
  var VERT_SIZE=3.0;
  var SMALL_VERT_SIZE=1.0;
  var SplineDrawer=es6_import_item(_es6_module, './spline_draw_new.js', 'SplineDrawer');
  var redo_draw_sort=es6_import_item(_es6_module, './spline_draw_sort.js', 'redo_draw_sort');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var ___spline_draw_sort=es6_import(_es6_module, './spline_draw_sort');
  for (let k in ___spline_draw_sort) {
      _es6_module.add_export(k, ___spline_draw_sort[k], true);
  }
  function draw_curve_normals(spline, g, zoom) {
    for (var seg of spline.segments) {
        if (seg.v1.hidden||seg.v2.hidden)
          continue;
        var length=seg.ks[KSCALE];
        if (length<=0||isNaN(length))
          continue;
        if (length>DRAW_MAXCURVELEN)
          length = DRAW_MAXCURVELEN;
        var ls=0.0, dls=5/zoom;
        for (var ls=0; ls<length; ls+=dls) {
            var s=ls/length;
            if (s>1.0)
              continue;
            var co=seg.evaluate(s);
            var n=seg.normal(s).normalize();
            var k=seg.curvature(s);
            n.mulScalar(k*(window._d!=undefined ? window._d : 1000)/zoom);
            g.lineWidth = 1;
            g.strokeColor = "%2233bb";
            g.beginPath();
            g.moveTo(co[0], co[1]);
            g.lineTo(co[0]+n[0], co[1]+n[1]);
            g.stroke();
        }
    }
  }
  draw_curve_normals = _es6_module.add_export('draw_curve_normals', draw_curve_normals);
  var $r_upa9_draw_spline=[[0, 0], [0, 0]];
  function draw_spline(spline, redraw_rects, g, editor, matrix, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime, ignore_layers) {
    spline.canvas = g;
    if (spline.drawlist===undefined||(spline.recalc&RecalcFlags.DRAWSORT)) {
        redo_draw_sort(spline);
    }
    if (spline.drawer===undefined) {
        spline.drawer = new SplineDrawer(spline);
    }
    var zoom=editor.zoom;
    zoom = matrix.m11;
    if (isNaN(zoom)) {
        zoom = 1.0;
    }
    spline.drawer.update(spline, spline.drawlist, spline.draw_layerlist, matrix, redraw_rects, only_render, selectmode, g, zoom, editor, ignore_layers);
    spline.drawer.draw(editor.drawg);
    var actlayer=spline.layerset.active;
    if (!only_render&&draw_normals)
      draw_curve_normals(spline, g, zoom);
    for (var s of spline.segments) {
        s.flag&=~SplineFlags.DRAW_TEMP;
    }
    for (var f of spline.faces) {
        f.flag&=~SplineFlags.DRAW_TEMP;
    }
    var vert_size=editor.draw_small_verts ? SMALL_VERT_SIZE : VERT_SIZE;
    if (only_render)
      return ;
    let tmp1=new Vector2();
    let tmp2=new Vector2();
    g.beginPath();
    if (selectmode&SelMask.HANDLE) {
        var w=vert_size*g.canvas.dpi_scale/zoom;
        for (var i=0; i<spline.handles.length; i++) {
            var v=spline.handles[i];
            var clr=get_element_color(v, spline.handles);
            if (!ignore_layers&&!v.owning_segment.in_layer(actlayer))
              continue;
            if (v.owning_segment!=undefined&&v.owning_segment.flag&SplineFlags.HIDE)
              continue;
            if (v.owning_vertex!=undefined&&v.owning_vertex.flag&SplineFlags.HIDE)
              continue;
            if (!v.use)
              continue;
            if ((v.flag&SplineFlags.AUTO_PAIRED_HANDLE)&&v.hpair!==undefined&&(v.segments.length>2)) {
                continue;
            }
            if (v.flag&SplineFlags.HIDE)
              continue;
            tmp1.load(v).multVecMatrix(matrix);
            g.beginPath();
            if (clr!==last_clr)
              g.fillStyle = clr;
            last_clr = clr;
            g.rect(tmp1[0]-w, tmp1[1]-w, w*2, w*2);
            g.fill();
            g.beginPath();
            g.lineWidth = 1;
            var ov=v.owning_segment.handle_vertex(v);
            tmp2.load(ov).multVecMatrix(matrix);
            g.moveTo(tmp1[0], tmp1[1]);
            g.lineTo(tmp2[0], tmp2[1]);
            g.stroke();
        }
    }
    var last_clr=undefined;
    if (selectmode&SelMask.VERTEX) {
        var w=vert_size*g.canvas.dpi_scale/zoom;
        for (var i=0; i<spline.verts.length; i++) {
            var v=spline.verts[i];
            var clr=get_element_color(v, spline.verts);
            if (!ignore_layers&&!v.in_layer(actlayer))
              continue;
            if (v.flag&SplineFlags.HIDE)
              continue;
            var co=tmp1.load(v);
            co.multVecMatrix(matrix);
            if (draw_time_helpers) {
                var time=get_vtime(v);
                if (curtime==time) {
                    g.beginPath();
                    g.fillStyle = "#33ffaa";
                    g.rect(co[0]-w*2, co[1]-w*2, w*4, w*4);
                    g.fill();
                    g.fillStyle = clr;
                }
            }
            g.beginPath();
            if (clr!==last_clr)
              g.fillStyle = clr;
            last_clr = clr;
            g.rect(co[0]-w, co[1]-w, w*2, w*2);
            g.fill();
        }
    }
    if (spline.transforming&&spline.proportional) {
        g.beginPath();
        g.arc(spline.trans_cent[0], spline.trans_cent[1], spline.prop_radius, -PI, PI);
        g.stroke();
    }
  }
  draw_spline = _es6_module.add_export('draw_spline', draw_spline);
  function patch_canvas2d(g) {
    var this2=this;
    if (g._lineTo==undefined) {
        g._lineTo = g.lineTo;
        g._moveTo = g.moveTo;
        g._drawImage = g.drawImage;
        g._putImageData = g.putImageData;
        g._rect = g.rect;
        g._bezierCurveTo = g.bezierCurveTo;
        g._clearRect = g.clearRect;
        g._translate = g.translate;
        g._scale = g.scale;
        g._rotate = g.rotate;
    }
    return ;
    var a=new Vector3(), b=new Vector3(), c=new Vector3(), d=new Vector3();
    function transform(g, co) {
      var rendermat=g._render_mat;
      if (rendermat!=undefined) {
          co.multVecMatrix(rendermat);
      }
      let dpiscale=g.canvas.dpi_scale||1.0;
      co[1] = g.canvas.height/dpiscale-co[1];
    }
    function untransform(g, co) {
      var rendermat=g._irender_mat;
      let dpiscale=g.canvas.dpi_scale||1.0;
      co[1] = g.canvas.height/dpiscale-co[1];
      if (rendermat!=undefined) {
          co.multVecMatrix(rendermat);
      }
    }
    var co=new Vector3(), co2=new Vector3();
    g.moveTo = function (x, y) {
      co.zero();
      co[0] = x;
      co[1] = y;
      transform(this, co);
      g._moveTo(co[0], co[1]);
    }
    g._arc = g.arc;
    g.arc = function (x, y, r, th1, th2) {
      co[0] = x;
      co[1] = y;
      co2[0] = x+Math.sin(th1)*r;
      co2[1] = y+Math.cos(th1)*r;
      co[2] = co2[2] = 0.0;
      transform(this, co);
      transform(this, co2);
      r = co.vectorDistance(co2);
      co2.sub(co);
      let th=Math.atan2(co2[1], co2[0]);
      let dth=th-th1;
      dth = 0;
      g._arc(co[0], co[1], r, th1+dth, th2+dth);
    }
    g.drawImage = function (image) {
      if (arguments.length==3) {
          var x=arguments[1], y=arguments[2];
          var w=x+image.width, h=y+image.height;
          co.zero();
          co[0] = x;
          co[1] = y;
          transform(this, co);
          x = co[0], y = co[1];
          co.zero();
          co[0] = w;
          co[1] = h;
          transform(this, co);
          console.log(x, y, "w, h", Math.abs(co[0]-x), Math.abs(co[1]-y), w, h);
          this._drawImage(image, x, y, Math.abs(co[0]-x), Math.abs(co[1]-y));
      }
      else 
        if (arguments.length==5) {
          var x=arguments[1], y=arguments[2];
          var w=x+arguments[3], h=y+arguments[4];
          co.zero();
          co[0] = x;
          co[1] = y;
          transform(this, co);
          x = co[0], y = co[1];
          co.zero();
          co[0] = w;
          co[1] = h;
          transform(this, co);
          console.log(x, y, "w, h", Math.abs(co[0]-x), Math.abs(co[1]-y), w, h);
          this._drawImage(image, x, y, Math.abs(co[0]-x), Math.abs(co[1]-y));
      }
      else {
        throw new Error("Invalid call to drawImage");
      }
    }
    g.putImageData = function (imagedata) {
      if (arguments.length==3) {
          co.zero();
          co[0] = arguments[1];
          co[1] = arguments[2];
          transform(this, co);
          var x=co[0], y=co[1];
          this._putImageData(imagedata, x, y);
      }
      else 
        if (arguments.length==5) {
          console.trace("Unimplemented!!!!");
      }
      else {
        throw new Error("Invalid number of argumnets to g.putImageData()");
      }
    }
    g.bezierCurveTo = function (x1, y1, x2, y2, x3, y3) {
      co[0] = x1;
      co[1] = y1;
      co[2] = 0.0;
      transform(this, co);
      x1 = co[0], y1 = co[1];
      co[0] = x2;
      co[1] = y2;
      co[2] = 0.0;
      transform(this, co);
      x2 = co[0], y2 = co[1];
      co[0] = x3;
      co[1] = y3;
      co[2] = 0.0;
      transform(this, co);
      x3 = co[0], y3 = co[1];
      this._bezierCurveTo(x1, y1, x2, y2, x3, y3);
    }
    g.lineTo = function (x, y) {
      co.zero();
      co[0] = x;
      co[1] = y;
      transform(this, co);
      this._lineTo(co[0], co[1]);
    }
    g.rect = function (x, y, wid, hgt) {
      a.loadXYZ(x, y, 0);
      b.loadXYZ(x+wid, y+hgt, 0);
      transform(this, a);
      transform(this, b);
      var xmin=Math.min(a[0], b[0]), xmax=Math.max(a[0], b[0]);
      var ymin=Math.min(a[1], b[1]), ymax=Math.max(a[1], b[1]);
      this._rect(xmin, ymin, Math.abs(xmax-xmin), Math.abs(ymax-ymin));
    }
    g.clearRect = function (x, y, wid, hgt) {
      a.loadXYZ(x, y, 0);
      b.loadXYZ(x+wid, y+hgt, 0);
      transform(this, a);
      transform(this, b);
      var xmin=Math.min(a[0], b[0]), xmax=Math.max(a[0], b[0]);
      var ymin=Math.min(a[1], b[1]), ymax=Math.max(a[1], b[1]);
      this._clearRect(xmin, ymin, Math.abs(xmax-xmin), Math.abs(ymax-ymin));
    }
  }
  patch_canvas2d = _es6_module.add_export('patch_canvas2d', patch_canvas2d);
  function set_rendermat(g, mat) {
    if (g._is_patched==undefined) {
        patch_canvas2d(g);
    }
    g._render_mat = mat;
    if (g._irender_mat===undefined) {
        g._irender_mat = new Matrix4(mat);
    }
    g._irender_mat.load(mat);
    g._irender_mat.invert();
  }
  set_rendermat = _es6_module.add_export('set_rendermat', set_rendermat);
  var $margin_D0uT_redraw_element=new Vector3([15, 15, 15]);
  var $aabb_gPUS_redraw_element=[new Vector3(), new Vector3()];
  function redraw_element(e, view2d) {
    e.flag|=SplineFlags.REDRAW;
    $margin_D0uT_redraw_element[0] = $margin_D0uT_redraw_element[1] = $margin_D0uT_redraw_element[2] = 15.0;
    if (view2d!=undefined)
      $margin_D0uT_redraw_element.mulScalar(1.0/view2d.zoom);
    var e_aabb=e.aabb;
    $aabb_gPUS_redraw_element[0].load(e_aabb[0]), $aabb_gPUS_redraw_element[1].load(e_aabb[1]);
    $aabb_gPUS_redraw_element[0].sub($margin_D0uT_redraw_element), $aabb_gPUS_redraw_element[1].add($margin_D0uT_redraw_element);
    window.redraw_viewport($aabb_gPUS_redraw_element[0], $aabb_gPUS_redraw_element[1]);
  }
  redraw_element = _es6_module.add_export('redraw_element', redraw_element);
}, '/dev/fairmotion/src/curve/spline_draw.js');
es6_module_define('spline_draw_sort', ["../editors/viewport/selectmode.js", "../util/mathlib.js", "./spline_types.js", "./spline_element_array.js", "../core/animdata.js", "./spline_math.js", "../config/config.js", "./spline_multires.js", "../editors/viewport/view2d_editor.js"], function _spline_draw_sort_module(_es6_module) {
  var aabb_isect_minmax2d=es6_import_item(_es6_module, '../util/mathlib.js', 'aabb_isect_minmax2d');
  var ENABLE_MULTIRES=es6_import_item(_es6_module, '../config/config.js', 'ENABLE_MULTIRES');
  var SessionFlags=es6_import_item(_es6_module, '../editors/viewport/view2d_editor.js', 'SessionFlags');
  var SelMask=es6_import_item(_es6_module, '../editors/viewport/selectmode.js', 'SelMask');
  var ORDER=es6_import_item(_es6_module, './spline_math.js', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, './spline_math.js', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, './spline_math.js', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, './spline_math.js', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, './spline_math.js', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, './spline_math.js', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, './spline_math.js', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, './spline_math.js', 'INT_STEPS');
  var get_vtime=es6_import_item(_es6_module, '../core/animdata.js', 'get_vtime');
  var iterpoints=es6_import_item(_es6_module, './spline_multires.js', 'iterpoints');
  var MultiResLayer=es6_import_item(_es6_module, './spline_multires.js', 'MultiResLayer');
  var MResFlags=es6_import_item(_es6_module, './spline_multires.js', 'MResFlags');
  var has_multires=es6_import_item(_es6_module, './spline_multires.js', 'has_multires');
  var spline_draw_cache_vs=cachering.fromConstructor(Vector3, 64);
  var spline_draw_trans_vs=cachering.fromConstructor(Vector3, 32);
  var PI=Math.PI;
  var pow=Math.pow, cos=Math.cos, sin=Math.sin, abs=Math.abs, floor=Math.floor, ceil=Math.ceil, sqrt=Math.sqrt, log=Math.log, acos=Math.acos, asin=Math.asin;
  var SplineFlags=es6_import_item(_es6_module, './spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, './spline_types.js', 'SplineTypes');
  var SplineElement=es6_import_item(_es6_module, './spline_types.js', 'SplineElement');
  var SplineVertex=es6_import_item(_es6_module, './spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, './spline_types.js', 'SplineSegment');
  var SplineLoop=es6_import_item(_es6_module, './spline_types.js', 'SplineLoop');
  var SplineLoopPath=es6_import_item(_es6_module, './spline_types.js', 'SplineLoopPath');
  var SplineFace=es6_import_item(_es6_module, './spline_types.js', 'SplineFace');
  var RecalcFlags=es6_import_item(_es6_module, './spline_types.js', 'RecalcFlags');
  var MaterialFlags=es6_import_item(_es6_module, './spline_types.js', 'MaterialFlags');
  var ElementArray=es6_import_item(_es6_module, './spline_element_array.js', 'ElementArray');
  var SplineLayerFlags=es6_import_item(_es6_module, './spline_element_array.js', 'SplineLayerFlags');
  function calc_string_ids(spline, startid) {
    if (startid===undefined) {
        startid = 0;
    }
    var string_idgen=startid;
    var tmp=new Array();
    var visit=new set();
    for (var seg of spline.segments) {
        seg.stringid = -1;
    }
    for (var v of spline.verts) {
        if (v.segments.length!=2) {
            continue;
        }
        var v2=v, startv=v2, seg=undefined;
        var _i=0;
        for (var j=0; j<v.segments.length; j++) {
            if (!visit.has(v.segments[j].eid)) {
                seg = v.segments[j];
                break;
            }
        }
        if (seg==undefined) {
            continue;
        }
        do {
          v2 = seg.other_vert(v2);
          if (v2.segments.length!=2) {
              break;
          }
          seg = v2.other_segment(seg);
          if (visit.has(seg.eid)) {
              break;
          }
          if (_i++>1000) {
              console.trace("infinite loop detected!");
              break;
          }
        } while (v2!=startv);
        
        var lastseg=undefined;
        startv = v2;
        _i = 0;
        do {
          if (lastseg!=undefined) {
              var bad=true;
              for (var k1 in seg.layers) {
                  for (var k2 in lastseg.layers) {
                      if (k1==k2) {
                          bad = false;
                          break;
                      }
                  }
                  if (bad) {
                      break;
                  }
              }
              bad = bad||!seg.mat.equals(true, lastseg.mat);
              if (bad) {
                  string_idgen++;
              }
          }
          if (visit.has(seg.eid)) {
              break;
          }
          seg.stringid = string_idgen;
          visit.add(seg.eid);
          v2 = seg.other_vert(v2);
          if (v2.segments.length!=2) {
              break;
          }
          lastseg = seg;
          seg = v2.other_segment(seg);
          if (_i++>1000) {
              console.trace("infinite loop detected!");
              break;
          }
        } while (v2!=startv);
        
    }
    for (var seg of spline.segments) {
        if (seg.stringid==-1) {
            seg.stringid = string_idgen++;
        }
    }
    return string_idgen;
  }
  calc_string_ids = _es6_module.add_export('calc_string_ids', calc_string_ids);
  var $lists_geMs_sort_layer_segments=new cachering(function () {
    return [];
  }, 2);
  function sort_layer_segments(layer, spline) {
    var list=$lists_geMs_sort_layer_segments.next();
    list.length = 0;
    var visit={}
    var layerid=layer.id;
    var topogroup_idgen=0;
    function recurse(seg) {
      if (seg.eid in visit) {
          return ;
      }
      visit[seg.eid] = 1;
      seg.topoid = topogroup_idgen;
      for (var i=0; i<2; i++) {
          var v=i ? seg.v2 : seg.v1;
          if (v.segments.length!=2)
            continue;
          for (var j=0; j<v.segments.length; j++) {
              var s2=v.segments[j];
              if (!(s2.eid in visit)) {
                  recurse(s2);
              }
          }
      }
      if (!s.hidden||(s.flag&SplineFlags.GHOST))
        list.push(seg);
    }
    if (1) {
        for (var s of layer) {
            if (s.type!=SplineTypes.SEGMENT)
              continue;
            if (!(layerid in s.layers))
              continue;
            if (s.v1.segments.length==2&&s.v2.segments.length==2)
              continue;
            if (!(s.eid in visit)) {
                topogroup_idgen++;
                recurse(s);
            }
        }
        for (var s of layer) {
            if (s.type!=SplineTypes.SEGMENT)
              continue;
            if (!(layerid in s.layers))
              continue;
            if (!(s.eid in visit)) {
                topogroup_idgen++;
                recurse(s);
            }
        }
    }
    return list;
  }
  sort_layer_segments = _es6_module.add_export('sort_layer_segments', sort_layer_segments);
  function redo_draw_sort(spline) {
    var min_z=100000000000000.0;
    var max_z=-100000000000000.0;
    var layerset=spline.layerset;
    console.log("start sort");
    var time=time_ms();
    for (var f of spline.faces) {
        if (f.hidden&&!(f.flag&SplineFlags.GHOST))
          continue;
        if (isNaN(f.z))
          f.z = 0;
        max_z = Math.max(max_z, f.z+1);
        min_z = Math.min(min_z, f.z+1);
    }
    for (var s of spline.segments) {
        if (s.hidden&&!(s.flag&SplineFlags.GHOST))
          continue;
        if (isNaN(s.z))
          s.z = 0;
        max_z = Math.max(max_z, s.z+2);
        min_z = Math.min(min_z, s.z);
    }
    function calc_z(e, check_face) {
      if (isNaN(e.z)) {
          e.z = 0;
      }
      if (check_face&&e.type==SplineTypes.SEGMENT&&e.l!==undefined) {
          var l=e.l;
          var _i=0;
          var f_max_z=calc_z(e, true);
          do {
            if (_i++>1000) {
                console.trace("infinite loop!");
                break;
            }
            var fz=calc_z(l.f);
            f_max_z = f_max_z===undefined ? fz : Math.max(f_max_z, fz);
            l = l.radial_next;
          } while (l!=e.l);
          
          return f_max_z+1;
      }
      var layer=0;
      for (var k in e.layers) {
          layer = k;
          break;
      }
      if (!(layer in layerset.idmap)) {
          console.log("Bad layer!", layer);
          return -1;
      }
      layer = layerset.idmap[layer];
      return layer.order*(max_z-min_z)+(e.z-min_z);
    }
    function get_layer(e) {
      for (var k in e.layers) {
          return k;
      }
      return undefined;
    }
    var dl=spline.drawlist = [];
    var ll=spline.draw_layerlist = [];
    spline._layer_maxz = max_z;
    for (var f of spline.faces) {
        f.finalz = -1;
        if (f.hidden&&!(f.flag&SplineFlags.GHOST))
          continue;
        dl.push(f);
    }
    var visit={}
    for (var i=0; i<spline.layerset.length; i++) {
        var layer=spline.layerset[i];
        var elist=sort_layer_segments(layer, spline);
        for (var j=0; j<elist.length; j++) {
            var s=elist[j];
            if (!(s.eid in visit))
              dl.push(elist[j]);
            visit[s.eid] = 1;
        }
    }
    for (var s of spline.segments) {
        s.finalz = -1;
        if (s.hidden&&!(s.flag&SplineFlags.GHOST))
          continue;
        if (!(s.eid in visit)) {
            dl.push(s);
        }
    }
    var zs={}
    for (var e of dl) {
        zs[e.eid] = calc_z(e);
    }
    if (!spline.is_anim_path) {
        dl.sort(function (a, b) {
          return zs[a.eid]-zs[b.eid];
        });
    }
    for (var i=0; i<dl.length; i++) {
        var lk=undefined;
        for (var k in dl[i].layers) {
            lk = k;
            break;
        }
        ll.push(lk);
    }
    for (var i=0; i<spline.drawlist.length; i++) {
        spline.drawlist[i].finalz = i;
    }
    calc_string_ids(spline, spline.segments.length);
    spline.recalc&=~RecalcFlags.DRAWSORT;
    console.log("time taken:"+(time_ms()-time).toFixed(2)+"ms");
  }
  redo_draw_sort = _es6_module.add_export('redo_draw_sort', redo_draw_sort);
}, '/dev/fairmotion/src/curve/spline_draw_sort.js');
es6_module_define('spline', ["../core/eventdag.js", "../core/struct.js", "./solver_new.js", "./spline_query.js", "../config/config.js", "./spline_math.js", "../wasm/native_api.js", "../editors/viewport/selectmode.js", "./spline_types.js", "./spline_draw.js", "../path.ux/scripts/config/const.js", "../editors/viewport/view2d_editor.js", "./spline_multires.js", "../core/lib_api.js", "../core/toolops_api.js", "./solver.js", "./spline_element_array.js"], function _spline_module(_es6_module) {
  "use strict";
  const MMLEN=8;
  const UARR=Uint16Array;
  const UMAX=((1<<16)-1);
  const UMUL=2;
  const PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var spline_multires=es6_import(_es6_module, './spline_multires.js');
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var DataBlock=es6_import_item(_es6_module, '../core/lib_api.js', 'DataBlock');
  var DataTypes=es6_import_item(_es6_module, '../core/lib_api.js', 'DataTypes');
  var SessionFlags=es6_import_item(_es6_module, '../editors/viewport/view2d_editor.js', 'SessionFlags');
  var SelMask=es6_import_item(_es6_module, '../editors/viewport/selectmode.js', 'SelMask');
  var SplineQuery=es6_import_item(_es6_module, './spline_query.js', 'SplineQuery');
  var draw_spline=es6_import_item(_es6_module, './spline_draw.js', 'draw_spline');
  var patch_canvas2d=es6_import_item(_es6_module, './spline_draw.js', 'patch_canvas2d');
  var set_rendermat=es6_import_item(_es6_module, './spline_draw.js', 'set_rendermat');
  var solve=es6_import_item(_es6_module, './solver_new.js', 'solve');
  var ModalStates=es6_import_item(_es6_module, '../core/toolops_api.js', 'ModalStates');
  var DataPathNode=es6_import_item(_es6_module, '../core/eventdag.js', 'DataPathNode');
  var config=es6_import(_es6_module, '../config/config.js');
  const FEPS=1e-18;
  const SPI2=Math.sqrt(PI/2);
  var _SOLVING=false;
  _SOLVING = _es6_module.add_export('_SOLVING', _SOLVING);
  var INCREMENTAL=1;
  INCREMENTAL = _es6_module.add_export('INCREMENTAL', INCREMENTAL);
  var ORDER=es6_import_item(_es6_module, './spline_math.js', 'ORDER');
  var KSCALE=es6_import_item(_es6_module, './spline_math.js', 'KSCALE');
  var KANGLE=es6_import_item(_es6_module, './spline_math.js', 'KANGLE');
  var KSTARTX=es6_import_item(_es6_module, './spline_math.js', 'KSTARTX');
  var KSTARTY=es6_import_item(_es6_module, './spline_math.js', 'KSTARTY');
  var KSTARTZ=es6_import_item(_es6_module, './spline_math.js', 'KSTARTZ');
  var KTOTKS=es6_import_item(_es6_module, './spline_math.js', 'KTOTKS');
  var INT_STEPS=es6_import_item(_es6_module, './spline_math.js', 'INT_STEPS');
  var solver=es6_import_item(_es6_module, './solver.js', 'solver');
  var constraint=es6_import_item(_es6_module, './solver.js', 'constraint');
  es6_import(_es6_module, '../path.ux/scripts/config/const.js');
  var native_api=es6_import(_es6_module, '../wasm/native_api.js');
  var SplineFlags=es6_import_item(_es6_module, './spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, './spline_types.js', 'SplineTypes');
  var SplineElement=es6_import_item(_es6_module, './spline_types.js', 'SplineElement');
  var SplineVertex=es6_import_item(_es6_module, './spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, './spline_types.js', 'SplineSegment');
  var SplineLoop=es6_import_item(_es6_module, './spline_types.js', 'SplineLoop');
  var SplineLoopPath=es6_import_item(_es6_module, './spline_types.js', 'SplineLoopPath');
  var SplineFace=es6_import_item(_es6_module, './spline_types.js', 'SplineFace');
  var ElementArraySet=es6_import_item(_es6_module, './spline_element_array.js', 'ElementArraySet');
  var ElementArray=es6_import_item(_es6_module, './spline_element_array.js', 'ElementArray');
  var SplineLayer=es6_import_item(_es6_module, './spline_element_array.js', 'SplineLayer');
  var SplineLayerSet=es6_import_item(_es6_module, './spline_element_array.js', 'SplineLayerSet');
  let _internal_idgen=0;
  var rect_tmp=[new Vector2(), new Vector2()];
  var eval_curve=es6_import_item(_es6_module, './spline_math.js', 'eval_curve');
  var do_solve=es6_import_item(_es6_module, './spline_math.js', 'do_solve');
  var RestrictFlags={NO_EXTRUDE: 1, 
   NO_DELETE: 2, 
   NO_CONNECT: 4, 
   NO_DISSOLVE: 8, 
   NO_SPLIT_EDGE: 16, 
   VALENCE2: 32, 
   NO_CREATE: 64|1|4|16}
  RestrictFlags = _es6_module.add_export('RestrictFlags', RestrictFlags);
  function dom_bind(obj, name, dom_id) {
    Object.defineProperty(obj, name, {get: function () {
        var check=document.getElementById(dom_id);
        return check.checked;
      }, 
    set: function (val) {
        var check=document.getElementById(dom_id);
        check.checked = !!val;
      }});
  }
  var split_edge_rets=new cachering(function () {
    return [0, 0, 0];
  }, 64);
  var _elist_map={"verts": SplineTypes.VERTEX, 
   "handles": SplineTypes.HANDLE, 
   "segments": SplineTypes.SEGMENT, 
   "faces": SplineTypes.FACE}
  class AllPointsIter  {
    
    
     constructor(spline) {
      this.spline = spline;
      this.stage = 0;
      this.iter = spline.verts[Symbol.iterator]();
      this.ret = {done: false, 
     value: undefined};
    }
     [Symbol.iterator]() {
      return this;
    }
     next() {
      var ret=this.iter.next();
      this.ret.done = ret.done;
      this.ret.value = ret.value;
      if (ret.done&&this.stage==0) {
          this.stage = 1;
          this.iter = this.spline.handles[Symbol.iterator]();
          return this.next();
      }
      return this.ret;
    }
  }
  _ESClass.register(AllPointsIter);
  _es6_module.add_class(AllPointsIter);
  AllPointsIter = _es6_module.add_export('AllPointsIter', AllPointsIter);
  var RecalcFlags=es6_import_item(_es6_module, './spline_types.js', 'RecalcFlags');
  var $debug_id_gen_KA8u_constructor;
  var $ws_teYB_split_edge;
  var $lastco_tpkR_trace_face;
  var $srcs_PEFg_split_edge;
  class Spline extends DataBlock {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
     constructor(name=undefined) {
      super(DataTypes.SPLINE, name);
      this.updateGen = 0;
      this._vert_add_set = new set();
      this._vert_rem_set = new set();
      this._vert_time_set = new set();
      this._debug_id = $debug_id_gen_KA8u_constructor++;
      this._pending_solve = undefined;
      this._resolve_after = undefined;
      this.solving = undefined;
      this.actlevel = 0;
      var mformat=spline_multires._format;
      this.mres_format = new Array(mformat.length);
      for (var i=0; i<mformat.length; i++) {
          this.mres_format[i] = mformat[i];
      }
      this._internal_id = _internal_idgen++;
      this.drawlist = [];
      this.recalc = RecalcFlags.DRAWSORT;
      this.size = [0, 0];
      this.restrict = 0;
      this.canvas = undefined;
      this.query = this.q = new SplineQuery(this);
      this.frame = 0;
      this.rendermat = new Matrix4();
      this.last_sim_ms = time_ms();
      this.segments = [];
      this.handles = [];
      this._idgen = new SDIDGen();
      this.last_save_time = time_ms();
      this.proportional = false;
      this.prop_radius = 100;
      this.eidmap = {};
      this.elist_map = {};
      this.elists = [];
      this.selectmode = 1;
      this.layerset = new SplineLayerSet();
      this.layerset.new_layer();
      this.selected = new ElementArraySet();
      this.selected.layerset = this.layerset;
      this.draw_verts = true;
      this.draw_normals = true;
      this.init_elists();
    }
     dag_get_datapath() {
      if (this.is_anim_path||(this.verts.cdata.layers.length>0&&this.verts.cdata.layers[0].name==="TimeDataLayer"))
        return "frameset.pathspline";
      else 
        return "frameset.drawspline";
    }
     force_full_resolve() {
      this.resolve = 1;
      for (var seg of this.segments) {
          seg.flag|=SplineFlags.UPDATE;
      }
      for (var v of this.verts) {
          v.flag|=SplineFlags.UPDATE;
      }
      for (var h of this.handles) {
          h.flag|=SplineFlags.UPDATE;
      }
    }
     regen_sort() {
      this.updateGen++;
      this.recalc|=RecalcFlags.DRAWSORT;
    }
     regen_solve() {
      this.resolve = 1;
      this.updateGen++;
      this.recalc|=RecalcFlags.SOLVE;
    }
     regen_render() {
      this.resolve = 1;
      this.updateGen++;
      this.recalc|=RecalcFlags.ALL;
    }
     init_elists() {
      this.elist_map = {};
      this.elists = [];
      for (var k in _elist_map) {
          var type=_elist_map[k];
          var list=new ElementArray(type, this.idgen, this.eidmap, this.selected, this.layerset, this);
          this[k] = list;
          this.elist_map[type] = list;
          this.elists.push(list);
      }
      this.init_sel_handlers();
    }
     init_sel_handlers() {
      var this2=this;
      this.verts.on_select = function (v, state) {
        for (var i=0; i<v.segments.length; i++) {
            var seg=v.segments[i];
            this2.handles.setselect(seg.handle(v), state);
        }
      };
    }
    get  idgen() {
      return this._idgen;
    }
    set  idgen(idgen) {
      this._idgen = idgen;
      if (this.elists==undefined) {
          return ;
      }
      for (var i=0; i<this.elists.length; i++) {
          this.elists[i].idgen = idgen;
      }
    }
     copy() {
      var ret=new Spline();
      ret.idgen = this.idgen.copy();
      ret.layerset = this.layerset.copyStructure();
      for (var i=0; i<ret.elists.length; i++) {
          ret.elists[i].idgen = ret.idgen;
          ret.elists[i].cdata.load_layout(this.elists[i].cdata);
      }
      var eidmap=ret.eidmap;
      for (let si=0; si<2; si++) {
          var list1=si ? this.handles : this.verts;
          var list2=si ? ret.handles : ret.verts;
          for (let i=0; i<list1.length; i++) {
              var v=list1[i];
              var v2=new SplineVertex(v);
              if (si===1) {
                  v2.type = SplineTypes.HANDLE;
              }
              v2.load(v);
              v2.flag = v.flag;
              v2.eid = v.eid;
              list2.push(v2, v2.eid, false);
              for (let layeri in v.layers) {
                  ret.layerset.idmap[layeri].add(v2);
              }
              if (si===1) {
                  ret.copy_handle_data(v2, v);
              }
              else {
                ret.copy_vert_data(v2, v);
              }
              eidmap[v.eid] = v2;
              if (v===list1.active)
                list2.active = v2;
          }
      }
      for (let i=0; i<this.segments.length; i++) {
          var s=this.segments[i];
          var s2=new SplineSegment();
          s2.eid = s.eid;
          s2.flag = s.flag;
          ret.segments.push(s2);
          eidmap[s2.eid] = s2;
          if (s===this.segments.active)
            ret.segments.active = s;
          s2.h1 = eidmap[s.h1.eid];
          s2.h2 = eidmap[s.h2.eid];
          s2.h1.segments.push(s2);
          s2.h2.segments.push(s2);
          s2.v1 = eidmap[s.v1.eid];
          s2.v2 = eidmap[s.v2.eid];
          s2.v1.segments.push(s2);
          s2.v2.segments.push(s2);
          for (var j=0; j<s.ks.length; j++) {
              s2.ks[j] = s.ks[j];
          }
          if (s.h1.hpair!==undefined)
            s2.h1.hpair = eidmap[s.h1.hpair.eid];
          if (s.h2.hpair!==undefined)
            s2.h2.hpair = eidmap[s.h2.hpair.eid];
          ret.copy_segment_data(s2, s);
          for (let layeri in s.layers) {
              ret.layerset.idmap[layeri].add(s2);
          }
      }
      for (var i=0; i<this.faces.length; i++) {
          var f=this.faces[i];
          var vlists=[];
          for (var list of f.paths) {
              var verts=[];
              vlists.push(verts);
              var l=list.l;
              do {
                verts.push(eidmap[l.v.eid]);
                l = l.next;
              } while (l!=list.l);
              
          }
          var f2=ret.make_face(vlists, f.eid);
          ret.copy_face_data(f2, f);
          eidmap[f2.eid] = f2;
          if (f==this.faces.active)
            ret.faces.active = f2;
          for (let layeri in f.layers) {
              ret.layerset.idmap[layeri].add(f2);
          }
      }
      return ret;
    }
     copy_element_data(dst, src) {
      if (dst.flag&SplineFlags.SELECT) {
          this.setselect(dst, false);
      }
      dst.cdata.copy(src);
      dst.flag = src.flag;
      if (dst.flag&SplineFlags.SELECT) {
          dst.flag&=~SplineFlags.SELECT;
          this.setselect(dst, true);
      }
    }
     copy_vert_data(dst, src) {
      this.copy_element_data(dst, src);
    }
     copy_handle_data(dst, src) {
      this.copy_element_data(dst, src);
    }
     copy_segment_data(dst, src) {
      this.copy_element_data(dst, src);
      dst.z = src.z;
      dst.mat.load(src.mat);
    }
     copy_face_data(dst, src) {
      this.copy_element_data(dst, src);
      dst.z = src.z;
      dst.mat.load(src.mat);
    }
    get  points() {
      return new AllPointsIter(this);
    }
     make_vertex(co, eid=undefined) {
      var v=new SplineVertex(co);
      v.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      this.verts.push(v, eid);
      this._vert_add_set.add(v.eid);
      this.dag_update("on_vert_add", this._vert_add_set);
      this.dag_update("on_vert_change");
      return v;
    }
     get_elist(type) {
      return this.elist_map[type];
    }
     make_handle(co, __eid=undefined) {
      var h=new SplineVertex();
      h.flag|=SplineFlags.BREAK_TANGENTS;
      h.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      h.type = SplineTypes.HANDLE;
      this.handles.push(h, __eid);
      return h;
    }
     split_edge(seg, s=0.5) {
      var co=seg.evaluate(s);
      var hpair=seg.h2.hpair;
      if (hpair!=undefined) {
          this.disconnect_handle(seg.h2);
      }
      var nv=this.make_vertex(co);
      nv.flag|=seg.v1.flag&seg.v2.flag;
      if (nv.flag&SplineFlags.SELECT) {
          nv.flag&=~SplineFlags.SELECT;
          this.verts.setselect(nv, true);
      }
      var v1=seg.v1, v2=seg.v2;
      var nseg=this.make_segment(nv, seg.v2);
      seg.v2.segments.remove(seg);
      nv.segments.push(seg);
      seg.v2 = nv;
      if (seg.l!==undefined) {
          var start=seg.l;
          var l=seg.l;
          var i=0;
          var lst=[];
          do {
            lst.push(l);
            if (i++>100) {
                console.trace("Infinite loop error");
                break;
            }
            l = l.radial_next;
          } while (l!==seg.l);
          
          for (var j=0; j<lst.length; j++) {
              var l=lst[j];
              var newl=this.make_loop();
              newl.f = l.f, newl.p = l.p;
              if (l.v===v1) {
                  newl.s = nseg;
                  newl.v = nv;
                  l.next.prev = newl;
                  newl.next = l.next;
                  l.next = newl;
                  newl.prev = l;
              }
              else 
                if (1) {
                  this._radial_loop_remove(l);
                  newl.s = seg;
                  newl.v = nv;
                  l.s = nseg;
                  l.next.prev = newl;
                  newl.next = l.next;
                  l.next = newl;
                  newl.prev = l;
                  this._radial_loop_insert(l);
              }
              this._radial_loop_insert(newl);
              l.p.totvert++;
          }
      }
      nv.flag|=SplineFlags.UPDATE;
      seg.v1.flag|=SplineFlags.UPDATE;
      nseg.v2.flag|=SplineFlags.UPDATE;
      var ret=split_edge_rets.next();
      ret[0] = nseg;
      ret[1] = nv;
      if (hpair!==undefined) {
          this.connect_handles(nseg.h2, hpair);
      }
      this.copy_segment_data(nseg, seg);
      $srcs_PEFg_split_edge[0] = v1.cdata, $srcs_PEFg_split_edge[1] = v2.cdata;
      this.copy_vert_data(nv, v1);
      nv.cdata.interp($srcs_PEFg_split_edge, $ws_teYB_split_edge);
      this.resolve = 1;
      return ret;
    }
     find_segment(v1, v2) {
      for (var i=0; i<v1.segments.length; i++) {
          if (v1.segments[i].other_vert(v1)===v2)
            return v1.segments[i];
      }
      return undefined;
    }
     disconnect_handle(h1) {
      h1.hpair.hpair = undefined;
      h1.hpair = undefined;
    }
     connect_handles(h1, h2) {
      var s1=h1.segments[0], s2=h2.segments[0];
      if (s1.handle_vertex(h1)!=s2.handle_vertex(h2)) {
          console.trace("Invalid call to connect_handles");
          return ;
      }
      if (h1.hpair!=undefined)
        this.disconnect_handle(h1);
      if (h2.hpair!=undefined)
        this.disconnect_handle(h2);
      h1.hpair = h2;
      h2.hpair = h1;
    }
     export_ks() {
      var mmlen=MMLEN;
      var size=4/UMUL+8/UMUL+this.segments.length*ORDER;
      size+=this.segments.length*(4/UMUL);
      size+=(8*Math.floor(this.segments.length/mmlen))/UMUL;
      var ret=new UARR(size);
      var view=new DataView(ret.buffer);
      var c=0, d=0;
      view.setInt32(c*UMUL, UMUL);
      c+=4/UMUL;
      var mink, maxk;
      for (var i=0; i<this.segments.length; i++) {
          var s=this.segments[i];
          if (d==0) {
              mink = 10000, maxk = -10000;
              for (var si=i; si<i+mmlen+1; si++) {
                  if (si>=this.segments.length)
                    break;
                  var s2=this.segments[si];
                  for (var j=0; j<ORDER; j++) {
                      mink = Math.min(mink, s2.ks[j]);
                      maxk = Math.max(maxk, s2.ks[j]);
                  }
              }
              view.setFloat32(c*UMUL, mink);
              view.setFloat32(c*UMUL+4, maxk);
              c+=8/UMUL;
          }
          view.setInt32(c*UMUL, s.eid);
          c+=4/UMUL;
          for (var j=0; j<ORDER; j++) {
              var k=s.ks[j];
              k = (k-mink)/(maxk-mink);
              if (k<0.0) {
                  console.log("EVIL!", k, mink, maxk);
              }
              k = Math.abs(Math.floor(k*UMAX));
              ret[c++] = k;
          }
          d = (d+1)%mmlen;
      }
      var ret2=ret;
      return ret2;
    }
     import_ks(data) {
      data = new UARR(data.buffer);
      var view=new DataView(data.buffer);
      var mmlen=MMLEN;
      var d=0, i=0;
      var datasize=view.getInt32(0);
      if (datasize!=UMUL) {
          return undefined;
      }
      i+=4/UMUL;
      while (i<data.length) {
        if (d==0) {
            var mink=view.getFloat32(i*UMUL);
            var maxk=view.getFloat32(i*UMUL+4);
            i+=8/UMUL;
        }
        d = (d+1)%mmlen;
        if (i>=data.length) {
            console.log("SPLINE CACHE ERROR", i, data.length);
            break;
        }
        var eid=view.getInt32(i*UMUL);
        i+=4/UMUL;
        var s=this.eidmap[eid];
        if (s==undefined||!(__instance_of(s, SplineSegment))) {
            console.log("Could not find segment", data[i-1]);
            i+=ORDER;
            continue;
        }
        for (var j=0; j<ORDER; j++) {
            var k=data[i++]/UMAX;
            k = k*(maxk-mink)+mink;
            s.ks[j] = k;
        }
      }
      return data;
    }
     fix_spline() {
      this.verts.remove_undefineds();
      this.handles.remove_undefineds();
      this.segments.remove_undefineds();
      this.faces.remove_undefineds();
      for (var i=0; i<2; i++) {
          var list=i ? this.handles : this.verts;
          for (var v of list) {
              for (var j=0; j<v.segments.length; j++) {
                  if (v.segments[j]==undefined) {
                      console.warn("Corruption detected for element", v.eid);
                      v.segments.pop_i(j);
                      j--;
                  }
              }
          }
      }
      var hset=new set();
      for (var s of this.segments) {
          hset.add(s.h1);
          hset.add(s.h2);
          for (let si=0; si<2; si++) {
              let h=si ? s.h2 : s.h1;
              if (h.segments.indexOf(s)<0) {
                  console.warn("fixing segment reference for handle", h.eid);
                  h.segments.length = 0;
                  h.segments.push(s);
              }
          }
      }
      let delset=new set();
      for (var h of this.handles) {
          if (!hset.has(h)) {
              delset.add(h);
          }
      }
      for (let h of delset) {
          console.log("Removing orphaned handle", h.eid, h);
          this.handles.remove(h);
      }
      var delsegments=new set();
      for (var v of this.verts) {
          for (var i=0; i<v.segments.length; i++) {
              var s=v.segments[i];
              if (s.v1!==v&&s.v2!==v) {
                  console.log("Corrupted segment! Deleting!");
                  v.segments.remove(s, true);
                  i--;
                  delsegments.add(s);
              }
          }
      }
      for (var s of delsegments) {
          this.kill_segment(s, true, true);
          continue;
          this.segments.remove(s, true);
          delete this.eidmap[s.eid];
          if (s.v1.indexOf(s)>=0)
            s.v1.segments.remove(s, true);
          if (s.v2.indexOf(s)>=0)
            s.v2.segments.remove(s, true);
          if (s.h1!==undefined&&s.h1.type===SplineTypes.HANDLE) {
              this.handles.remove(s.h1, true);
              delete this.eidmap[s.h1.eid];
          }
          if (s.h2!==undefined&&s.h2.type===SplineTypes.HANDLE) {
              this.handles.remove(s.h2, true);
              delete this.eidmap[s.h2.eid];
          }
          if (s.l!=undefined) {
              var l=s.l, c;
              var radial_next=l.radial_next;
              do {
                if (c++>100) {
                    console.log("Infinite loop (in fix_splines)!");
                    break;
                }
                this.kill_face(l.f);
                l = l.radial_next;
                if (l==undefined)
                  break;
              } while (l!=s.l);
              
          }
      }
      for (var s of this.segments) {
          if (s.v1.segments===undefined||s.v2.segments===undefined) {
              if (__instance_of(s.h1, SplineVertex))
                this.handles.remove(s.h1);
              if (__instance_of(s.h2, SplineVertex))
                this.handles.remove(s.h2);
              this.segments.remove(s);
              continue;
          }
          if (s.v1.segments.indexOf(s)<0) {
              s.v1.segments.push(s);
          }
          if (s.v2.segments.indexOf(s)<0) {
              s.v2.segments.push(s);
          }
          if (s.h1===undefined||s.h1.type!==SplineTypes.HANDLE) {
              console.log("Missing handle 1; adding. . .", s.eid, s);
              s.h1 = this.make_handle();
              s.h1.load(s.v1).interp(s.v2, 1.0/3.0);
          }
          if (s.h2===undefined||s.h2.type!==SplineTypes.HANDLE) {
              console.log("Missing handle 2; adding. . .", s.eid, s);
              s.h2 = this.make_handle();
              s.h2.load(s.v2).interp(s.v2, 2.0/3.0);
          }
          if (s.h1.segments[0]!==s)
            s.h1.segments = [s];
          if (s.h2.segments[0]!==s)
            s.h2.segments = [s];
      }
      var max_eid=0;
      for (var i=0; i<this.elists.length; i++) {
          var elist=this.elists[i];
          for (var e of elist) {
              max_eid = Math.max(e.eid, max_eid);
          }
      }
      var curid=!("cur_id" in this.idgen) ? "cur_eid" : "cur_id";
      if (max_eid>=this.idgen[curid]) {
          console.trace("IDGEN ERROR! DOOM! DOOM!");
          this.idgen[curid] = max_eid+1;
      }
    }
     select_none(ctx, datamode) {
      if (ctx===undefined) {
          throw new Error("ctx cannot be undefined");
      }
      if (datamode===undefined) {
          throw new Error("datamode cannot be undefined");
      }
      for (let elist of this.elists) {
          if (!(datamode&elist.type)) {
              continue;
          }
          for (let e of elist.selected.editable(ctx)) {
              this.setselect(e, false);
          }
      }
    }
     select_flush(datamode) {
      if (datamode&(SplineTypes.VERTEX|SplineTypes.HANDLE)) {
          var fset=new set();
          var sset=new set();
          var fact=this.faces.active, sact=this.segments.active;
          for (var v of this.verts.selected) {
              for (var s of v.segments) {
                  if (sset.has(s))
                    continue;
                  if (s.other_vert(v).flag&SplineFlags.SELECT) {
                      sset.add(s);
                  }
                  var l=s.l;
                  if (l===undefined)
                    continue;
                  var c=0;
                  do {
                    if (c++>1000) {
                        console.warn("Infinite loop detected!");
                        break;
                    }
                    var f=l.f;
                    if (f.flag&SplineFlags.SELECT) {
                        l = l.next;
                        continue;
                    }
                    var good=true;
                    for (var path of f.paths) {
                        for (var l2 of path) {
                            if (!(l2.v.flag&SplineFlags.SELECT)) {
                                good = false;
                                break;
                            }
                        }
                        if (!good)
                          break;
                    }
                    if (good) {
                        fset.add(f);
                    }
                    l = l.next;
                  } while (l!=s.l);
                  
              }
          }
          this.segments.clear_selection();
          this.faces.clear_selection();
          if (sact===undefined||!sset.has(sact)) {
              for (var s of sset) {
                  sact = s;
                  break;
              }
          }
          if (fact===undefined||!fset.has(fact)) {
              for (var f of fset) {
                  fact = f;
                  break;
              }
          }
          this.segments.active = sact;
          this.faces.active = fact;
          for (var s of sset) {
              this.segments.setselect(s, true);
          }
          for (var f of fset) {
              this.faces.setselect(f, true);
          }
      }
      else 
        if (datamode===SplineTypes.SEGMENT) {
          this.verts.clear_selection();
          this.faces.clear_selection();
          for (var s of this.segments.selected) {
              this.verts.setselect(s.v1, true);
              this.verts.setselect(s.v2, true);
              var l=s.l;
              if (l===undefined)
                continue;
              var c=0;
              do {
                if (c++>1000) {
                    console.warn("Infinite loop detected!");
                    break;
                }
                var f=l.f;
                if (f.flag&SplineFlags.SELECT) {
                    l = l.next;
                    continue;
                }
                var good=true;
                for (var path of f.paths) {
                    for (var l2 of path) {
                        if (!(l2.s.flag&SplineFlags.SELECT)) {
                            good = false;
                            break;
                        }
                    }
                    if (!good)
                      break;
                }
                if (good) {
                    console.log("selecting face");
                    this.faces.setselect(f, true);
                }
                l = l.next;
              } while (l!==s.l);
              
          }
      }
      else 
        if (datamode===SplineTypes.FACE) {
          this.verts.clear_selection();
          this.segments.clear_selection();
          for (var f of this.faces.selected) {
              for (var path of f.paths) {
                  for (var l of path) {
                      this.verts.setselect(l.v, true);
                      this.segments.setselect(l.s, true);
                  }
              }
          }
      }
    }
     make_segment(v1, v2, __eid, check_existing=true) {
      if (__eid===undefined)
        __eid = this.idgen.gen_id();
      if (check_existing) {
          var seg=this.find_segment(v1, v2);
          if (seg!==undefined)
            return seg;
      }
      var seg=new SplineSegment(v1, v2);
      seg.h1 = this.make_handle();
      seg.h2 = this.make_handle();
      seg.h1.load(v1).interp(v2, 1.0/3.0);
      seg.h2.load(v1).interp(v2, 2.0/3.0);
      seg.h1.segments.push(seg);
      seg.h2.segments.push(seg);
      seg.v1.segments.push(seg);
      seg.v2.segments.push(seg);
      seg.v1.flag|=SplineFlags.UPDATE;
      seg.v2.flag|=SplineFlags.UPDATE;
      seg.h1.flag|=SplineFlags.UPDATE;
      seg.h2.flag|=SplineFlags.UPDATE;
      seg.flag|=SplineFlags.UPDATE;
      this.segments.push(seg, __eid);
      return seg;
    }
     _radial_loop_insert(l) {
      if (l.s.l===undefined) {
          l.radial_next = l.radial_prev = l;
          l.s.l = l;
          return ;
      }
      l.radial_next = l.s.l;
      l.radial_prev = l.s.l.radial_prev;
      l.s.l.radial_prev.radial_next = l.s.l.radial_prev = l;
      l.s.l = l;
    }
     _radial_loop_remove(l) {
      l.radial_next.radial_prev = l.radial_prev;
      l.radial_prev.radial_next = l.radial_next;
      if (l===l.radial_next) {
          l.s.l = undefined;
      }
      else 
        if (l===l.s.l) {
          l.s.l = l.radial_next;
      }
    }
     make_face(vlists, custom_eid=undefined) {
      var f=new SplineFace();
      if (custom_eid==-1)
        custom_eid = undefined;
      this.faces.push(f);
      for (var i=0; i<vlists.length; i++) {
          var verts=vlists[i];
          if (verts.length<3) {
              throw new Error("Must have at least three vertices for face");
          }
          var vset={};
          for (var j=0; j<verts.length; j++) {
              if (verts[j].eid in vset) {
                  console.log(vlists);
                  throw new Error("Duplicate verts in make_face");
              }
              vset[verts[j].eid] = 1;
          }
      }
      for (var i=0; i<vlists.length; i++) {
          var verts=vlists[i];
          var list=new SplineLoopPath();
          list.f = f;
          list.totvert = verts.length;
          f.paths.push(list);
          var l=undefined, prevl=undefined;
          for (var j=0; j<verts.length; j++) {
              var v1=verts[j], v2=verts[(j+1)%verts.length];
              var s=this.make_segment(v1, v2, undefined, true);
              var l=this.make_loop();
              l.v = v1;
              l.s = s;
              l.f = f;
              l.p = list;
              if (prevl==undefined) {
                  list.l = l;
              }
              else {
                l.prev = prevl;
                prevl.next = l;
              }
              prevl = l;
          }
          list.l.prev = prevl;
          prevl.next = list.l;
          var l=list.l;
          do {
            this._radial_loop_insert(l);
            l = l.next;
          } while (l!=list.l);
          
      }
      return f;
    }
     make_loop() {
      var l=new SplineLoop();
      l.eid = this.idgen.gen_id();
      this.eidmap[l.eid] = l;
      return l;
    }
     kill_loop(l) {
      delete this.eidmap[l.eid];
    }
     _element_kill(e) {

    }
     kill_face(f) {
      for (var i=0; i<f.paths.length; i++) {
          var path=f.paths[i];
          for (var l of path) {
              this._radial_loop_remove(l);
              this.kill_loop(l);
          }
      }
      this._element_kill(f);
      this.faces.remove(f);
    }
     kill_segment(seg, kill_faces=true, soft_error=false) {
      var i=0;
      while (kill_faces&&seg.l!=undefined) {
        this.kill_face(seg.l.f);
        if (i++>1000) {
            console.trace("Infinite loop in kill_segment!!", seg);
            break;
        }
      }
      if (seg.v1.segments!=undefined)
        seg.v1.segments.remove(seg, soft_error);
      if (seg.v2.segments!=undefined)
        seg.v2.segments.remove(seg, soft_error);
      this.handles.remove(seg.h1, soft_error);
      this.handles.remove(seg.h2, soft_error);
      this._element_kill(seg);
      this.segments.remove(seg, soft_error);
    }
     do_save() {
      var obj=this.toJSON();
      var buf=JSON.stringify(obj);
      var blob=new Blob([buf], {type: "application/json"});
      var obj_url=window.URL.createObjectURL(blob);
      window.open(obj_url);
    }
     dissolve_vertex(v) {
      var ls2=[];
      if (v.segments.length!=2)
        return ;
      for (var i=0; i<v.segments.length; i++) {
          var s=v.segments[i];
          if (s.l==undefined)
            continue;
          var lst=[];
          var l=s.l;
          do {
            lst.push(l);
            l = l.radial_next;
          } while (l!=s.l);
          
          for (var j=0; j<lst.length; j++) {
              var l=lst[j];
              if (l.v!==v&&l.next.v!==v)
                continue;
              console.log("vs", v.eid, "|", l.prev.v.eid, l.v.eid, l.next.v.eid);
              if (l.v!==v) {
                  l = l.next;
              }
              console.log("vl", v.eid, l.v.eid);
              if (l===l.p.l)
                l.p.l = l.next;
              if (l.p.totvert<=3||l.p.l===l) {
                  console.log("DESTROYING FACE!!", l.f.eid);
                  this.kill_face(l.f);
                  continue;
              }
              this._radial_loop_remove(l);
              ls2.push(l.prev);
              l.prev.next = l.next;
              l.next.prev = l.prev;
              this.kill_loop(l);
              l.p.totvert--;
          }
      }
      if (v.segments.length==2) {
          var s1=v.segments[0], s2=v.segments[1];
          var v1=s1.other_vert(v), v2=s2.other_vert(v);
          var existing=this.find_segment(v1, v2);
          if (s1.v1==v)
            s1.v1 = v2;
          else 
            s1.v2 = v2;
          var ci=0;
          while (s2.l!=undefined) {
            this._radial_loop_remove(s2.l);
            if (ci++>100) {
                console.warn("Infinite loop error!");
                break;
            }
          }
          while (s1.l!=undefined) {
            this._radial_loop_remove(s1.l);
            if (ci++>100) {
                console.warn("Infinite loop error!");
                break;
            }
          }
          this.kill_segment(s2);
          v2.segments.push(s1);
          v.segments.length = 0;
          if (existing) {
              this.kill_segment(s1);
              s1 = existing;
          }
          if (s1.l==undefined) {
              for (var i=0; i<ls2.length; i++) {
                  var l=ls2[i];
                  l.s = s1;
                  this._radial_loop_insert(l);
                  console.log(s1.v1.eid, s1.v2.eid, "|", l.prev.v.eid, l.v.eid, l.next.v.eid);
              }
          }
          v.flag|=SplineFlags.UPDATE;
          v2.flag|=SplineFlags.UPDATE;
      }
      this.kill_vertex(v);
      this.resolve = 1;
    }
     buildSelCtxKey() {
      let key="";
      key+=this.layerset.active.id;
      return key;
    }
     kill_vertex(v) {
      this._vert_rem_set.add(v.eid);
      this.dag_update("on_vert_add", this._vert_rem_set);
      this.dag_update("on_vert_change");
      if (v.flag&SplineFlags.SELECT) {
          this.verts.setselect(v, false);
      }
      if (this.hpair!=undefined)
        this.disconnect_handle(this);
      while (v.segments.length>0) {
        var last=v.segments.length;
        this.kill_segment(v.segments[0]);
        if (last==v.segments.length) {
            console.log("EEK!");
            break;
        }
      }
      if (this.verts.active==v)
        this.verts.active = undefined;
      if (this.verts.highlight==v)
        this.verts.highlight = undefined;
      delete this.eidmap[v.eid];
      this._element_kill(v);
      this.verts.remove(v);
    }
     _vert_flag_update(v, depth, limit) {
      if (depth>=limit)
        return ;
      v.flag|=SplineFlags.TEMP_TAG;
      for (var i=0; i<v.segments.length; i++) {
          var s=v.segments[i], v2=s.other_vert(v);
          if (v2==undefined||v2.segments==undefined) {
              console.trace("ERROR 1: v, s, v2:", v, s, v2);
              continue;
          }
          var has_tan=v2.segments.length<=2;
          for (var j=0; j<v2.segments.length; j++) {
              var h=v2.segments[j].handle(v2);
              if (h.hpair!=undefined) {
                  has_tan = true;
              }
          }
          if (!has_tan) {
          }
          if (!(v2.flag&SplineFlags.TEMP_TAG)) {
              this._vert_flag_update(v2, depth+1, limit);
          }
      }
      for (var j=0; j<v.segments.length; j++) {
          var s=v.segments[j], v2=s.other_vert(v);
          if (v2.segments.length>2||(v2.flag&SplineFlags.BREAK_TANGENTS))
            v2.flag|=SplineFlags.TEMP_TAG;
      }
    }
     propagate_draw_flags(repeat=2) {
      for (var seg of this.segments) {
          seg.flag&=~SplineFlags.TEMP_TAG;
      }
      for (var seg of this.segments) {
          if (!(seg.flag&SplineFlags.REDRAW_PRE))
            continue;
          for (var i=0; i<2; i++) {
              var v=i ? seg.v2 : seg.v1;
              for (var j=0; j<v.segments.length; j++) {
                  var seg2=v.segments[j];
                  seg2.flag|=SplineFlags.TEMP_TAG;
                  var l=seg2.l;
                  if (l==undefined)
                    continue;
                  var _i=0;
                  do {
                    if (_i++>1000) {
                        console.warn("infinite loop!");
                        break;
                    }
                    l.f.flag|=SplineFlags.REDRAW_PRE;
                    l = l.radial_next;
                  } while (l!=seg2.l);
                  
              }
          }
      }
      for (var seg of this.segments) {
          if (seg.flag&SplineFlags.TEMP_TAG) {
              seg.flag|=SplineFlags.REDRAW_PRE;
          }
      }
      if (repeat!=undefined&&repeat>0) {
          this.propagate_draw_flags(repeat-1);
      }
    }
     propagate_update_flags() {
      for (let seg of this.segments) {
          if ((seg.v1.flag&SplineFlags.UPDATE)&&(seg.v1.flag&SplineFlags.BREAK_TANGENTS)) {
              seg.v2.flag|=SplineFlags.UPDATE;
          }
          if ((seg.v2.flag&SplineFlags.UPDATE)&&(seg.v2.flag&SplineFlags.BREAK_TANGENTS)) {
              seg.v1.flag|=SplineFlags.UPDATE;
          }
      }
      var verts=this.verts;
      for (var i=0; i<verts.length; i++) {
          var v=verts[i];
          v.flag&=~SplineFlags.TEMP_TAG;
      }
      var limit=5;
      for (var i=0; i<verts.length; i++) {
          var v=verts[i];
          if (v.flag&SplineFlags.UPDATE) {
              this._vert_flag_update(v, 0, limit);
          }
      }
      for (var i=0; i<verts.length; i++) {
          var v=verts[i];
          if (v.flag&SplineFlags.TEMP_TAG) {
              v.flag|=SplineFlags.UPDATE;
          }
      }
    }
     solve(steps, gk, force_queue=false) {
      var this2=this;
      var dag_trigger=function () {
        this2.dag_update("on_solve", true);
      };
      if (this._pending_solve!==undefined&&force_queue) {
          var this2=this;
          this._pending_solve = this._pending_solve.then(function () {
            this2.solve();
          });
          this.solving = true;
          return this._pending_solve;
      }
      else 
        if (this._pending_solve!==undefined) {
          var do_accept;
          var promise=new Promise(function (accept, reject) {
            do_accept = function () {
              accept();
            }
          });
          this._resolve_after = function () {
            do_accept();
          };
          return promise;
      }
      else {
        this._pending_solve = this.solve_intern(steps, gk);
        this.solving = true;
        return this._pending_solve;
      }
    }
     solve_intern(steps, gk) {
      var this2=this;
      var dag_trigger=function () {
        this2.dag_update("on_solve", true);
        the_global_dag.exec(g_app_state.screen.ctx);
      };
      for (var v of this.verts) {
          if (v.flag&SplineFlags.UPDATE) {
              for (var i=0; i<v.segments.length; i++) {
                  var seg=v.segments[i];
                  seg.flag|=SplineFlags.REDRAW_PRE;
                  var l=seg.l;
                  if (!l)
                    continue;
                  var _i=0;
                  do {
                    if (_i++>5000) {
                        console.warn("infinite loop!");
                        break;
                    }
                    l.f.flag|=SplineFlags.REDRAW_PRE;
                    l = l.radial_next;
                  } while (l!=seg.l);
                  
              }
          }
      }
      this.propagate_draw_flags();
      var this2=this;
      if (!DEBUG.no_native&&config.USE_WASM&&native_api.isReady()) {
          var ret=native_api.do_solve(SplineFlags, this, steps, gk, true);
          ret.then(function () {
            this2._pending_solve = undefined;
            this2.solving = false;
            this2._do_post_solve();
            dag_trigger();
            if (this2._resolve_after) {
                var cb=this2._resolve_after;
                this2._resolve_after = undefined;
                this2._pending_solve = this2.solve_intern().then(function () {
                  cb.call(this2);
                });
                this2.solving = true;
            }
          });
          return ret;
      }
      else 
        if (!DEBUG.no_native&&config.USE_NACL&&window.common!=undefined&&window.common.naclModule!=undefined) {
          var ret=do_solve(SplineFlags, this, steps, gk, true);
          ret.then(function () {
            this2._pending_solve = undefined;
            this2.solving = false;
            this2._do_post_solve();
            dag_trigger();
            if (this2._resolve_after) {
                var cb=this2._resolve_after;
                this2._resolve_after = undefined;
                this2._pending_solve = this2.solve_intern().then(function () {
                  cb.call(this2);
                });
                this2.solving = true;
            }
          });
          return ret;
      }
      else {
        var do_accept;
        var promise=new Promise(function (accept, reject) {
          do_accept = function () {
            accept();
          }
        });
        var this2=this;
        var timer=window.setInterval(function () {
          window.clearInterval(timer);
          do_solve(SplineFlags, this2, steps, gk);
          this2._pending_solve = undefined;
          this2.solving = false;
          do_accept();
          this2._do_post_solve();
          dag_trigger();
          if (this2._resolve_after) {
              var cb=this2._resolve_after;
              this2._resolve_after = undefined;
              this2._pending_solve = this2.solve_intern().then(function () {
                cb.call(this2);
              });
              this2.solving = true;
          }
        }, 10);
        return promise;
      }
    }
     _do_post_solve() {
      for (var seg of this.segments) {
          if (seg.flag&SplineFlags.REDRAW_PRE) {
              seg.flag&=~SplineFlags.REDRAW_PRE;
              seg.flag|=SplineFlags.REDRAW;
          }
      }
      for (var f of this.faces) {
          if (f.flag&SplineFlags.REDRAW_PRE) {
              f.flag&=~SplineFlags.REDRAW_PRE;
              f.flag|=SplineFlags.REDRAW;
          }
      }
      for (var seg of this.segments) {
          seg.post_solve();
      }
    }
     solve_p(steps, gk) {
      console.trace("solve_p: DEPRECATED");
      return this.solve(steps, gk);
    }
     trace_face(g, f) {
      g.beginPath();
      $lastco_tpkR_trace_face.zero();
      for (var path of f.paths) {
          var first=true;
          for (var l of path) {
              var seg=l.s;
              var flip=seg.v1!==l.v;
              var s=flip ? seg.ks[KSCALE] : 0, ds=flip ? -2 : 2;
              while ((!flip&&s<seg.ks[KSCALE])||(flip&&s>=0)) {
                var co=seg.evaluate(s/seg.length);
                if (first) {
                    first = false;
                    g.moveTo(co[0], co[1]);
                }
                else {
                  g.lineTo(co[0], co[1]);
                }
                s+=ds;
              }
          }
      }
      g.closePath();
    }
     forEachPoint(cb, thisvar) {
      for (var si=0; si<2; si++) {
          var list=si ? this.handles : this.verts;
          var last_len=list.length;
          for (var i=0; i<list.length; i++) {
              if (thisvar!=undefined)
                cb.call(thisvar, list[i]);
              else 
                cb(list[i]);
              last_len = list.length;
          }
      }
    }
     build_shash() {
      var sh={};
      var cellsize=150;
      sh.cellsize = cellsize;
      function hash(x, y, cellsize) {
        return Math.floor(x/cellsize)+","+Math.floor(y/cellsize);
      }
      for (var si=0; si<2; si++) {
          var list=si ? this.handles : this.verts;
          for (var v of list) {
              var h=hash(v[0], v[1], cellsize);
              if (!(h in sh)) {
                  sh[h] = [];
              }
              sh[h].push(v);
          }
      }
      var sqrt2=sqrt(2);
      sh.forEachPoint = function sh_lookupPoints(co, radius, callback, thisvar) {
        var cellsize=this.cellsize;
        var cellradius=Math.ceil(sqrt2*radius/cellsize);
        var sx=Math.floor(co[0]/cellsize)-cellradius;
        var sy=Math.floor(co[1]/cellsize)-cellradius;
        var ex=Math.ceil(co[0]/cellsize)+cellradius;
        var ey=Math.ceil(co[1]/cellsize)+cellradius;
        for (var x=sx; x<=ex; x++) {
            for (var y=sy; y<=ey; y++) {
                var h=hash(x*cellsize, y*cellsize, cellsize);
                if (!(h in this))
                  continue;
                var list=this[h];
                for (var i=0; i<list.length; i++) {
                    var e=list[i];
                    var dis=e.vectorDistance(co);
                    if (dis<radius&&co!==e) {
                        callback.call(thisvar, e, dis);
                    }
                }
            }
        }
      };
      return sh;
    }
     unhide_all() {
      for (var i=0; i<this.verts.length; i++) {
          var v=this.verts[i];
          if (v.flag&SplineFlags.HIDE) {
              v.flag&=~SplineFlags.HIDE;
              v.flag|=SplineFlags.SELECT;
          }
      }
    }
     duplicate_verts() {
      var newvs=[];
      var idmap={};
      for (var i=0; i<this.verts.length; i++) {
          var v=this.verts[i];
          if (!(v.flag&SplineFlags.SELECT))
            continue;
          if (v.hidden)
            continue;
          var nv=this.make_vertex(v);
          idmap[v.eid] = nv;
          idmap[nv.eid] = v;
          nv.flag = v.flag&~SplineFlags.SELECT;
          newvs.push(nv);
      }
      for (var i=0; i<this.segments.length; i++) {
          var seg=this.segments[i];
          if ((seg.v1.flag&SplineFlags.SELECT)&&(seg.v2.flag&SplineFlags.SELECT)) {
              var v1=idmap[seg.v1.eid], v2=idmap[seg.v2.eid];
              if (v1==undefined||v2==undefined||v1==v2)
                continue;
              this.make_segment(v1, v2);
          }
      }
      for (var i=0; i<this.verts.length; i++) {
          var v=this.verts[i];
          this.verts.setselect(v, false);
      }
      for (var i=0; i<newvs.length; i++) {
          this.verts.setselect(newvs[i], true);
      }
      this.start_mpos[0] = this.mpos[0];
      this.start_mpos[1] = this.mpos[1];
      this.start_transform();
      this.resolve = 1;
    }
     clear_highlight() {
      for (var i=0; i<this.elists.length; i++) {
          this.elists[i].highlight = undefined;
      }
    }
     validate_active() {
      for (var i=0; i<this.elists.length; i++) {
          var elist=this.elists[i];
          if (elist.active!=undefined&&elist.active.hidden)
            elist.active = undefined;
      }
    }
     clear_active(e) {
      this.set_active(undefined);
    }
     set_active(e) {
      if (e===undefined) {
          for (var i=0; i<this.elists.length; i++) {
              this.elists[i].active = undefined;
          }
          return ;
      }
      var elist=this.get_elist(e.type);
      elist.active = e;
    }
     setselect(e, state) {
      var elist=this.get_elist(e.type);
      elist.setselect(e, state);
    }
     clear_selection(e) {
      for (var i=0; i<this.elists.length; i++) {
          this.elists[i].clear_selection();
      }
    }
     do_mirror() {
      this.start_transform('s');
      for (var i=0; i<this.transdata.length; i++) {
          var start=this.transdata[i][0], v=this.transdata[i][1];
          if (v.flag&SplineFlags.HIDE)
            continue;
          v.sub(this.trans_cent);
          v[0] = -v[0];
          v.add(this.trans_cent);
      }
      this.end_transform();
      this.resolve = 1;
    }
     toJSON(self) {
      var ret={};
      ret.frame = this.frame;
      ret.verts = {length: this.verts.length};
      ret.segments = [];
      ret.handles = [];
      ret.draw_verts = this.draw_verts;
      ret.draw_normals = this.draw_normals;
      ret._cur_id = this.idgen.cur_id;
      for (var i=0; i<this.verts.length; i++) {
          ret.verts[i] = this.verts[i].toJSON();
      }
      if (this.verts.active!=undefined)
        ret.verts.active = this.verts.active.eid;
      else 
        ret.verts.active = undefined;
      if (this.handles.active!=undefined)
        ret.handles.active = this.handles.active.eid;
      if (this.segments.active!=undefined)
        ret.segments.active = this.segments.active.eid;
      for (var i=0; i<this.segments.length; i++) {
          ret.segments.push(this.segments[i].toJSON());
      }
      for (var i=0; i<this.handles.length; i++) {
          ret.handles.push(this.handles[i].toJSON());
      }
      return ret;
    }
     reset() {
      this.idgen = new SDIDGen();
      this.init_elists();
    }
     import_json(obj) {
      var spline2=Spline.fromJSON(obj);
      var miny=1e+18, maxy=1e-18;
      var newmap={};
      for (var i=0; i<spline2.verts.length; i++) {
          var v=spline2.verts[i];
          var nv=this.make_vertex(v, v.eid);
          nv.flag = v.flag;
          nv.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
          miny = Math.min(miny, nv[1]);
          maxy = Math.max(maxy, nv[1]);
          newmap[v.eid] = nv;
      }
      for (var i=0; i<spline2.verts.length; i++) {
          var v=spline2.verts[i], nv=newmap[v.eid];
          nv[1] = ((maxy-miny)-(nv[1]-miny))+miny;
      }
      for (var i=0; i<spline2.segments.length; i++) {
          var seg=spline2.segments[i];
          var v1=newmap[seg.v1.eid], v2=newmap[seg.v2.eid];
          var nseg=this.make_segment(v1, v2);
          nseg.flag = seg.flag|SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
          newmap[seg.eid] = nseg;
      }
      this.resolve = 1;
    }
    static  fromJSON(obj) {
      var spline=new Spline();
      spline.idgen.cur_id = obj._cur_id;
      spline.draw_verts = obj.draw_verts;
      spline.draw_normals = obj.draw_normals;
      var eidmap={};
      for (var i=0; i<obj.verts.length; i++) {
          var cv=obj.verts[i];
          var v=spline.make_vertex(cv);
          v.flag|=SplineFlags.FRAME_DIRTY;
          v.flag = cv.flag;
          v.eid = cv.eid;
          v.segments = cv.segments;
          eidmap[v.eid] = v;
      }
      for (var i=0; i<obj.handles.length; i++) {
          var cv=obj.handles[i];
          var v=spline.make_handle(cv);
          v.flag = cv.flag;
          v.eid = cv.eid;
          v.segments = cv.segments;
          eidmap[v.eid] = v;
      }
      for (var i=0; i<obj.segments.length; i++) {
          var s=obj.segments[i];
          var segments=obj.segments;
          var v1=eidmap[s.v1], v2=eidmap[s.v2];
          var h1=eidmap[s.h1], h2=eidmap[s.h2];
          var seg=new SplineSegment();
          seg.eid = s.eid;
          seg.flag = s.flag;
          if (seg.ks.length===s.ks.length) {
              seg.ks = s.ks;
          }
          else {
            spline.resolve = true;
            for (var j=0; j<spline.verts.length; j++) {
                spline.verts[j].flag|=SplineFlags.UPDATE;
            }
          }
          for (var j=0; j<seg.ks.length; j++) {
              if (isNaN(seg.ks[j])) {
                  seg.ks[j] = 0.0;
              }
          }
          seg.v1 = v1, seg.v2 = v2, seg.h1 = h1, seg.h2 = h2;
          spline.segments.push(seg);
          eidmap[seg.eid] = seg;
      }
      for (var i=0; i<obj.verts.length; i++) {
          var v=obj.verts[i];
          for (var j=0; j<v.segments.length; j++) {
              v.segments[j] = eidmap[v.segments[j]];
          }
      }
      for (var i=0; i<obj.handles.length; i++) {
          var v=obj.handles[i];
          for (var j=0; j<v.segments.length; j++) {
              v.segments[j] = eidmap[v.segments[j]];
          }
      }
      if (obj.verts.active!==undefined)
        spline.verts.active = eidmap[obj.verts.active];
      if (obj.handles.active!==undefined)
        spline.handles.active = eidmap[obj.handles.active];
      if (obj.segments.active!==undefined)
        spline.segments.active = eidmap[obj.segments.active];
      spline.eidmap = eidmap;
      return spline;
    }
     prune_singles() {
      var del=[];
      for (var i=0; i<this.verts.length; i++) {
          var v=this.verts[i];
          if (v.segments.length==0) {
              del.push(v);
          }
      }
      for (var i=0; i<del.length; i++) {
          this.kill_vertex(del[i]);
      }
    }
     draw(redraw_rects, g, editor, matrix, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime, ignore_layers) {
      this.canvas = g;
      this.selectmode = selectmode;
      if (g._is_patched===undefined) {
          patch_canvas2d(g);
      }
      g._is_patched = this;
      g.lineWidth = 1;
      if (this.resolve) {
          this.solve().then(function () {
            for (var i=0; i<redraw_rects.length; i++) {
                var rr=redraw_rects[i];
                if (rr) {
                    window.redraw_viewport(rr[0], rr[1]);
                }
                else 
                  if (redraw_rects.length<2) {
                    window.redraw_viewport();
                }
            }
          });
      }
      draw_spline(this, redraw_rects, g, editor, matrix, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime, ignore_layers);
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.afterSTRUCT();
      this.query = this.q = new SplineQuery(this);
      var eidmap={};
      this.elists = [];
      this.elist_map = {};
      for (var k in _elist_map) {
          var type=_elist_map[k];
          var v=this[k];
          if (v==undefined)
            continue;
          this.elists.push(v);
          this.elist_map[type] = v;
      }
      this.init_sel_handlers();
      for (var si=0; si<2; si++) {
          var list=si ? this.handles : this.verts;
          for (var i=0; i<list.length; i++) {
              var v=list[i];
              eidmap[v.eid] = v;
              if (v.type==SplineTypes.VERTEX)
                v.hpair = undefined;
          }
      }
      for (var h of this.handles) {
          h.hpair = eidmap[h.hpair];
      }
      for (var i=0; i<this.segments.length; i++) {
          var s=this.segments[i];
          s.v1 = eidmap[s.v1];
          s.v2 = eidmap[s.v2];
          s.h1 = eidmap[s.h1];
          s.h2 = eidmap[s.h2];
          eidmap[s.eid] = s;
      }
      for (var si=0; si<2; si++) {
          var list=si ? this.handles : this.verts;
          for (var i=0; i<list.length; i++) {
              var v=list[i];
              for (var j=0; j<v.segments.length; j++) {
                  v.segments[j] = eidmap[v.segments[j]];
              }
          }
      }
      for (var i=0; i<this.faces.length; i++) {
          var f=this.faces[i];
          f.flag|=SplineFlags.UPDATE_AABB;
          eidmap[f.eid] = f;
          for (var path of f.paths) {
              path.f = f;
              var l=path.l;
              do {
                eidmap[l.eid] = l;
                l.f = f;
                l.s = eidmap[l.s];
                l.v = eidmap[l.v];
                l = l.next;
              } while (l!=path.l);
              
          }
      }
      for (var i=0; i<this.faces.length; i++) {
          var f=this.faces[i];
          for (var path of f.paths) {
              var l=path.l;
              do {
                l.radial_next = eidmap[l.radial_next];
                l.radial_prev = eidmap[l.radial_prev];
                l = l.next;
              } while (l!=path.l);
              
          }
      }
      for (var i=0; i<this.segments.length; i++) {
          var s=this.segments[i];
          s.l = eidmap[s.l];
      }
      this.eidmap = eidmap;
      var selected=new ElementArraySet();
      selected.layerset = this.layerset;
      for (var i=0; i<this.selected.length; i++) {
          var eid=this.selected[i];
          if (!(eid in eidmap)) {
              console.log("WARNING! eid", eid, "not in eidmap!", Object.keys(eidmap));
              continue;
          }
          selected.add(eidmap[this.selected[i]]);
      }
      this.selected = selected;
      this.verts.afterSTRUCT(SplineTypes.VERTEX, this.idgen, this.eidmap, this.selected, this.layerset, this);
      this.handles.afterSTRUCT(SplineTypes.HANDLE, this.idgen, this.eidmap, this.selected, this.layerset, this);
      this.segments.afterSTRUCT(SplineTypes.SEGMENT, this.idgen, this.eidmap, this.selected, this.layerset, this);
      this.faces.afterSTRUCT(SplineTypes.FACE, this.idgen, this.eidmap, this.selected, this.layerset, this);
      if (this.layerset==undefined) {
          this.layerset = new SplineLayerSet();
          this.layerset.new_layer();
      }
      else {
        this.layerset.afterSTRUCT(this);
      }
      this.regen_sort();
      if (spline_multires.has_multires(this)&&this.mres_format!=undefined) {
          console.log("Converting old multires layout. . .");
          for (var seg of this.segments) {
              var mr=seg.cdata.get_layer(spline_multires.MultiResLayer);
              mr._convert(this.mres_format, spline_multires._format);
          }
      }
      var arr=[];
      for (var i=0; i<spline_multires._format.length; i++) {
          arr.push(spline_multires._format[i]);
      }
      this.mres_format = arr;
      return this;
    }
     flagUpdateVertTime(v) {
      if (v) {
          this._vert_time_set.add(v.eid);
      }
      this.dag_update("on_vert_time_change", this._vert_time_set);
    }
     dag_exec(ctx, inputs, outputs, graph) {
      outputs.on_vert_add.loadData(this._vert_add_set);
      this._vert_add_set = new set();
      this._vert_rem_set = new set();
      this._vert_time_set = new set();
    }
    static  nodedef() {
      return {name: "Spline", 
     uiName: "Spline", 
     outputs: {on_solve: null, 
      on_vert_time_change: new set(), 
      on_vert_add: new set(), 
      on_vert_remove: new set(), 
      on_vert_change: null}, 
     inputs: {}}
    }
  }
  var $debug_id_gen_KA8u_constructor=0;
  var $ws_teYB_split_edge=[0.5, 0.5];
  var $lastco_tpkR_trace_face=new Vector3();
  var $srcs_PEFg_split_edge=[0, 0];
  _ESClass.register(Spline);
  _es6_module.add_class(Spline);
  Spline = _es6_module.add_export('Spline', Spline);
  
  mixin(Spline, DataPathNode);
  Spline.STRUCT = STRUCT.inherit(Spline, DataBlock)+`
    idgen    : SDIDGen;
    
    selected : iter(e, int) | e.eid;
    
    verts    : ElementArray;
    handles  : ElementArray;
    segments : ElementArray;
    faces    : ElementArray;
    layerset : SplineLayerSet;
    
    restrict : int;
    actlevel : int;
    
    mres_format : array(string);
}
`;
}, '/dev/fairmotion/src/curve/spline.js');
es6_module_define('solver', [], function _solver_module(_es6_module) {
  var SQRT2=Math.sqrt(2.0);
  var FEPS=1e-17;
  var PI=Math.PI;
  var sin=Math.sin, cos=Math.cos, atan2=Math.atan2;
  var sqrt=Math.sqrt, pow=Math.pow, log=Math.log, abs=Math.abs;
  var SPI2=Math.sqrt(PI/2);
  class constraint  {
     constructor(typename, k, klst, klen, ceval, params, limit) {
      if (limit==undefined)
        limit = 1e-05;
      this.limit = limit;
      this.type = typename;
      this.klst = klst;
      this.ceval = ceval;
      this.params = params;
      this.klen = [];
      if (!(__instance_of(klen, Array))) {
          for (var i=0; i<klst.length; i++) {
              this.klen.push(klen);
          }
      }
      else {
        this.klen = klen;
      }
      this.glst = [];
      for (var i=0; i<klst.length; i++) {
          var gs=[];
          this.glst.push(gs);
          for (var j=0; j<klen; j++) {
              gs.push(0);
          }
      }
      this.k = k;
    }
     exec(do_gs) {
      if (do_gs==undefined)
        do_gs = true;
      var r1=this.ceval(this.params);
      if (abs(r1)<=this.limit)
        return 0.0;
      if (!do_gs)
        return r1;
      var df=3e-06;
      for (var ki=0; ki<this.klst.length; ki++) {
          var ks=this.klst[ki];
          var gs=this.glst[ki];
          for (var i=0; i<this.klen[ki]; i++) {
              var orig=ks[i];
              ks[i]+=df;
              var r2=this.ceval(this.params);
              gs[i] = (r2-r1)/df;
              ks[i] = orig;
              if (ks.length>5) {
              }
          }
      }
      return r1;
    }
  }
  _ESClass.register(constraint);
  _es6_module.add_class(constraint);
  constraint = _es6_module.add_export('constraint', constraint);
  class solver  {
    
     constructor() {
      this.cs = [];
      this.threshold = 0.001;
      this.edge_segs = [];
    }
     add(c) {
      this.cs.push(c);
    }
     solve(steps, gk, final_solve, edge_segs) {
      if (gk==undefined)
        gk = 1.0;
      var err=0.0;
      var clen=this.cs.length;
      for (var i=0; i<steps; i++) {
          for (var j=0; j<edge_segs.length; j++) {
              var seg=edge_segs[j];
              var ks=seg.ks;
              for (var k=0; k<ks.length; k++) {
                  ks[k] = seg._last_ks[k];
              }
          }
          err/=this.cs.length;
          if (i>0&&err<this.threshold)
            break;
          if (isNaN(err))
            break;
          err = 0.0;
          var cs=this.cs;
          var visit={};
          for (var j=0; j<cs.length; j++) {
              var j2=i%2 ? clen-j-1 : j;
              var c=cs[j2];
              var r=c.exec(true);
              err+=abs(r);
              if (r==0.0)
                continue;
              var klst=c.klst, glst=c.glst;
              var totgs=0.0;
              for (var ki=0; ki<klst.length; ki++) {
                  var klen=c.klen[ki];
                  var gs=glst[ki];
                  totgs = 0.0;
                  for (var k=0; k<klen; k++) {
                      totgs+=gs[k]*gs[k];
                  }
                  if (totgs==0.0)
                    continue;
                  var rmul=r/totgs;
                  ks = klst[ki];
                  gs = glst[ki];
                  var ck=i>8&&c.k2!==undefined ? c.k2 : c.k;
                  let mul=1.0/Math.pow(1.0+ks[KSCALE], 0.25);
                  for (var k=0; k<klen; k++) {
                      ks[k]+=-rmul*gs[k]*ck*gk*mul;
                  }
              }
          }
      }
      for (var j=0; j<edge_segs.length; j++) {
          var seg=edge_segs[j];
          var ks=seg.ks;
          for (var k=0; k<ks.length; k++) {
              seg.ks[k] = seg._last_ks[k];
          }
      }
      if (final_solve||isNaN(err)) {
          console.log("err", err, "steps", i, "\n");
      }
      return i;
    }
  }
  _ESClass.register(solver);
  _es6_module.add_class(solver);
  solver = _es6_module.add_export('solver', solver);
}, '/dev/fairmotion/src/curve/solver.js');
es6_module_define('spline_multires', ["../util/binomial_table.js", "./spline_base.js", "../core/struct.js"], function _spline_multires_module(_es6_module) {
  "use strict";
  var acos=Math.acos, asin=Math.asin, abs=Math.abs, log=Math.log, sqrt=Math.sqrt, pow=Math.pow, PI=Math.PI, floor=Math.floor, min=Math.min, max=Math.max, sin=Math.sin, cos=Math.cos, tan=Math.tan, atan=Math.atan, atan2=Math.atan2, exp=Math.exp, ceil=Math.ceil;
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var CustomDataLayer=es6_import_item(_es6_module, './spline_base.js', 'CustomDataLayer');
  var SplineTypes=es6_import_item(_es6_module, './spline_base.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, './spline_base.js', 'SplineFlags');
  var CurveEffect=es6_import_item(_es6_module, './spline_base.js', 'CurveEffect');
  var MResFlags={SELECT: 1, 
   ACTIVE: 2, 
   REBASE: 4, 
   UPDATE: 8, 
   HIGHLIGHT: 16, 
   HIDE: 64, 
   FRAME_DIRTY: 128}
  MResFlags = _es6_module.add_export('MResFlags', MResFlags);
  var _a=0;
  var TX=0;
  TX = _es6_module.add_export('TX', TX);
  var TY=1;
  TY = _es6_module.add_export('TY', TY);
  var TVX=2;
  TVX = _es6_module.add_export('TVX', TVX);
  var TVY=3;
  TVY = _es6_module.add_export('TVY', TVY);
  var TSEG=4;
  TSEG = _es6_module.add_export('TSEG', TSEG);
  var TS=5;
  TS = _es6_module.add_export('TS', TS);
  var TT=6;
  TT = _es6_module.add_export('TT', TT);
  var TA=7;
  TA = _es6_module.add_export('TA', TA);
  var TFLAG=8;
  TFLAG = _es6_module.add_export('TFLAG', TFLAG);
  var TID=9;
  TID = _es6_module.add_export('TID', TID);
  var TLEVEL=10;
  TLEVEL = _es6_module.add_export('TLEVEL', TLEVEL);
  var TSUPPORT=11;
  TSUPPORT = _es6_module.add_export('TSUPPORT', TSUPPORT);
  var TBASIS=12;
  TBASIS = _es6_module.add_export('TBASIS', TBASIS);
  var TDEGREE=13;
  TDEGREE = _es6_module.add_export('TDEGREE', TDEGREE);
  var TNEXT=14;
  TNEXT = _es6_module.add_export('TNEXT', TNEXT);
  var TTOT=15;
  TTOT = _es6_module.add_export('TTOT', TTOT);
  var _format=["TX", "TY", "TVX", "TVY", "TSEG", "TS", "TT", "TA", "TFLAG", "TID", "TLEVEL", "TSUPPORT", "TBASIS", "TDEGREE", "TNEXT"];
  _format = _es6_module.add_export('_format', _format);
  var IHEAD=0, ITAIL=1, IFREEHEAD=2, ITOTPOINT=3, ITOT=4;
  var $p_0ysx_recalc_offset;
  class BoundPoint  {
    
     constructor() {
      this.mr = undefined;
      this.i = undefined;
      this.data = undefined;
      this.composed_id = -1;
      this.offset = {};
      var this2=this;
      Object.defineProperty(this.offset, "0", {get: function () {
          return this2.data[this2.i+TVX];
        }, 
     set: function (val) {
          this2.data[this2.i+TVX] = val;
        }});
      Object.defineProperty(this.offset, "1", {get: function () {
          return this2.data[this2.i+TVY];
        }, 
     set: function (val) {
          this2.data[this2.i+TVY] = val;
        }});
    }
     recalc_offset(spline) {
      var seg=spline.eidmap[this.seg];
      var co=seg._evalwrap.evaluate(this.s);
      this.offset[0] = this[0]-co[0];
      this.offset[1] = this[1]-co[1];
      $p_0ysx_recalc_offset[0] = this[0];
      $p_0ysx_recalc_offset[1] = this[1];
      var sta=seg._evalwrap.global_to_local($p_0ysx_recalc_offset, undefined, this.s);
      this.t = sta[1];
      this.a = sta[2];
    }
     toString() {
      var next=this.data!=undefined ? this.data[this.i+TNEXT] : "(error)";
      return "{\n"+"\"0\"   : "+this[0]+",\n"+"\"1\"   : "+this[1]+",\n"+".offset : ["+this.offset[0]+", "+this.offset[1]+"],\n"+"id      : "+this.id+",\n"+"seg     : "+this.seg+",\n"+"t       : "+this.t+",\n"+"s       : "+this.s+",\n"+"flag    : "+this.flag+",\n"+"next    : "+next+"\n"+"}\n";
    }
     bind(mr, i) {
      this.mr = mr;
      this.i = i;
      this.data = mr.data;
      this.composed_id = compose_id(this.seg, this.id);
      return this;
    }
    get  0() {
      return this.data[this.i+TX];
    }
    set  0(val) {
      this.data[this.i+TX] = val;
    }
    get  1() {
      return this.data[this.i+TY];
    }
    set  1(val) {
      this.data[this.i+TY] = val;
    }
    get  support() {
      return this.data[this.i+TSUPPORT];
    }
    set  support(val) {
      this.data[this.i+TSUPPORT] = val;
    }
    get  degree() {
      return this.data[this.i+TDEGREE];
    }
    set  degree(val) {
      this.data[this.i+TDEGREE] = val;
    }
    get  basis() {
      return this.data[this.i+TBASIS];
    }
    set  basis(val) {
      this.data[this.i+TBASIS] = val;
    }
    get  seg() {
      return this.data[this.i+TSEG];
    }
    set  seg(val) {
      this.data[this.i+TSEG] = val;
    }
    get  level() {
      return this.data[this.i+TLEVEL];
    }
    set  level(val) {
      this.data[this.i+TLEVEL] = val;
    }
    get  s() {
      return this.data[this.i+TS];
    }
    set  s(val) {
      this.data[this.i+TS] = val;
    }
    get  t() {
      return this.data[this.i+TT];
    }
    set  t(val) {
      this.data[this.i+TT] = val;
    }
    get  a() {
      return this.data[this.i+TA];
    }
    set  a(val) {
      this.data[this.i+TA] = val;
    }
    get  flag() {
      return this.data[this.i+TFLAG];
    }
    set  flag(val) {
      this.data[this.i+TFLAG] = val;
    }
    get  id() {
      return this.data[this.i+TID];
    }
    set  id(val) {
      this.data[this.i+TID] = val;
    }
    get  next() {
      return this.data[this.i+TNEXT];
    }
  }
  var $p_0ysx_recalc_offset=new Vector3([0, 0, 0]);
  _ESClass.register(BoundPoint);
  _es6_module.add_class(BoundPoint);
  BoundPoint = _es6_module.add_export('BoundPoint', BoundPoint);
  var pointiter_ret_cache=cachering.fromConstructor(BoundPoint, 12);
  var add_point_cache=cachering.fromConstructor(BoundPoint, 12);
  var get_point_cache=cachering.fromConstructor(BoundPoint, 12);
  class point_iter  {
    
     constructor() {
      this.ret = {done: true, 
     value: undefined};
    }
     [Symbol.iterator]() {
      return this;
    }
     cache_init(mr, level) {
      this.mr = mr;
      this.level = level;
      this.data = mr.data;
      this.cur = mr.index[level*ITOT+IHEAD];
      this.ret.done = false;
      this.ret.value = undefined;
      return this;
    }
     next() {
      if (this.cur==-1) {
          this.ret.done = true;
          this.ret.value = undefined;
          this.mr = undefined;
          return this.ret;
      }
      var d=this.data;
      var cur=this.cur;
      var p=pointiter_ret_cache.next();
      p.bind(this.mr, this.cur);
      this.cur = d[cur+TNEXT];
      if (this.cur==cur) {
          console.log("EEK! bad data in mres iterator!", this, this.mr, this.cur, cur, "level:", this.level);
          this.cur = -1;
      }
      this.ret.value = p;
      return this.ret;
    }
  }
  _ESClass.register(point_iter);
  _es6_module.add_class(point_iter);
  var binomial_table=es6_import_item(_es6_module, '../util/binomial_table.js', 'binomial_table');
  var bernstein_offsets=es6_import_item(_es6_module, '../util/binomial_table.js', 'bernstein_offsets');
  function binomial(n, k) {
    if (binomial_table.length>n) {
        return binomial_table[n][k];
    }
    if (k==0.0||k==n) {
        return 1;
    }
    return binomial(n-1, k-1)+binomial(n-1, k);
  }
  function bernstein(degree, s) {
    degree = Math.max(Math.floor(degree), 0.0);
    var half=Math.floor(degree/2);
    return binomial(degree, half)*pow(s, half)*pow(1.0-s, degree-half);
  }
  function bernstein2(degree, s) {
    var a=floor(degree+1);
    var b=ceil(degree+1);
    if (isNaN(a)||a<=0) {
        return 0.0;
    }
    var start=0.0, mid=0.5, end=1.0;
    if (a>=0&&a<bernstein_offsets.length) {
        start = bernstein_offsets[a][0];
        mid = bernstein_offsets[a][1];
        end = bernstein_offsets[a][2];
    }
    var off=0.5-mid;
    if (1||a<4) {
        var t=1.0-abs(s-0.5)*2.0;
        s-=off*t;
    }
    else {
      s*=2.0;
      s = start*(1.0-s)+mid*s;
    }
    var height=bernstein(a, mid, 0, a, Math.floor(a/2));
    return bernstein(a, s)/height;
  }
  function crappybasis(s, k, support, degree) {
    if (s<k-support||s>=k+support)
      return 0.0;
    var start=k-support, end=k+support;
    var t=(s-start)/(end-start);
    var degree2=degree-2.0;
    var sign=degree2<0.0 ? -1.0 : 1.0;
    degree2 = pow(degree2, 0.25)*sign+2.0;
    t = bernstein2(degree, t);
    if (isNaN(t))
      t = 0.0;
    return t;
  }
  var $sum_6s9k_evaluate;
  var $ks_5ncd_evaluate;
  class MultiResEffector extends CurveEffect {
     constructor(owner) {
      super();
      this.mr = owner;
    }
     evaluate(s) {
      var n=this.prior.derivative(s);
      var t=n[0];
      n[0] = n[1];
      n[1] = t;
      n.normalize();
      n.mulScalar(10.0);
      var co=this.prior.evaluate(s);
      $sum_6s9k_evaluate.zero();
      var i=0;
      for (var p in this.mr.points(0)) {
          $ks_5ncd_evaluate[i] = p.s;
          i++;
      }
      for (var p in this.mr.points(0)) {
          var w=crappybasis(s, p.s, p.support, p.degree);
          if (isNaN(w))
            continue;
          $sum_6s9k_evaluate[0]+=p.offset[0]*w;
          $sum_6s9k_evaluate[1]+=p.offset[1]*w;
      }
      for (var i=0; i<2; i++) {
          var next=i ? this.next : this.prev;
          var soff=i ? -1.0 : 1.0;
          var sign=i ? -1.0 : 1.0;
          if (next!=undefined) {
              var mr=!(__instance_of(next, MultiResEffector)) ? next.eff.mr : next.mr;
              for (var p in mr.points(0)) {
                  if ((!i&&p.s-support>=0)||(i&&p.s+support<=1.0))
                    continue;
                  var support=p.support;
                  var ps=p.s;
                  var s2;
                  if (!i) {
                      s2 = next.rescale(this, s)+1.0;
                  }
                  else {
                    s2 = -next.rescale(this, 1.0-s);
                  }
                  var w=crappybasis(s2, ps, support, p.degree);
                  $sum_6s9k_evaluate[0]+=p.offset[0]*w;
                  $sum_6s9k_evaluate[1]+=p.offset[1]*w;
              }
          }
      }
      co.add($sum_6s9k_evaluate);
      return co;
    }
  }
  var $sum_6s9k_evaluate=new Vector3();
  var $ks_5ncd_evaluate=new Array(2000);
  _ESClass.register(MultiResEffector);
  _es6_module.add_class(MultiResEffector);
  MultiResEffector = _es6_module.add_export('MultiResEffector', MultiResEffector);
  class MultiResGlobal  {
     constructor() {
      this.active = undefined;
    }
    static  fromSTRUCT(reader) {
      var ret=new MultiResGlobal();
      reader(ret);
      return ret;
    }
  }
  _ESClass.register(MultiResGlobal);
  _es6_module.add_class(MultiResGlobal);
  MultiResGlobal = _es6_module.add_export('MultiResGlobal', MultiResGlobal);
  MultiResGlobal.STRUCT = `
  MultiResGlobal {
    active : double | obj.active == undefined ? -1 : obj.active;
  }
`;
  var $_co_vf2w_add_point;
  var $sta_SpPG_recalc_worldcos_level;
  class MultiResLayer extends CustomDataLayer {
     constructor(size=16) {
      super(this);
      this._effector = new MultiResEffector(this);
      this.max_layers = 8;
      this.data = new Float64Array(size*TTOT);
      this.index = new Array(this.max_layers*ITOT);
      this.totpoint = 0;
      this._size = size;
      this._freecur = 0;
      for (var i=0; i<this.max_layers; i++) {
          this.index[i*ITOT+IHEAD] = -1;
          this.index[i*ITOT+ITAIL] = -1;
          this.index[i*ITOT+IFREEHEAD] = 0;
      }
      this.points_iter_cache = cachering.fromConstructor(point_iter, 8);
    }
     _convert(formata, formatb) {
      var totp=this.data.length/formata.length;
      var data=new Float64Array(totp*formatb.length);
      var odata=this.data;
      var ttota=formata.length, ttotb=formatb.length;
      console.log("FORMATA", formata, "\n");
      console.log("FORMATB", formatb, "\n");
      var fa=[], fb=[];
      var fmap={};
      for (var i=0; i<formata.length; i++) {
          for (var j=0; j<formatb.length; j++) {
              if (formata[i]==formatb[j]) {
                  fmap[i] = j;
              }
          }
      }
      console.log("FMAP", fmap, "\n");
      for (var i=0; i<totp; i++) {
          for (var j=0; j<formata.length; j++) {
              var src=odata[i*ttota+j];
              if ((formata[j]=="TNEXT"||formata[j]=="TID")&&src!=-1) {
                  src = Math.floor((src/ttota)*ttotb);
              }
              data[i*ttotb+fmap[j]] = src;
          }
      }
      for (var i=0; i<this.max_layers; i++) {
          if (this.index[i*ITOT+IHEAD]!=-1)
            this.index[i*ITOT+IHEAD] = Math.floor((this.index[i*ITOT+IHEAD]/ttota)*ttotb);
          if (this.index[i*ITOT+ITAIL]!=-1)
            this.index[i*ITOT+ITAIL] = Math.floor((this.index[i*ITOT+ITAIL]/ttota)*ttotb);
          if (this.index[i*ITOT+IFREEHEAD]!=-1)
            this.index[i*ITOT+IFREEHEAD] = Math.floor((this.index[i*ITOT+IFREEHEAD]/ttota)*ttotb);
      }
      this.data = data;
    }
     fix_points(seg=undefined) {
      var index=this.index;
      for (var i=0; i<this.index.length; i+=ITOT) {
          index[i] = index[i+1] = -1;
          index[i+2] = index[i+3] = 0;
      }
      var data=this.data;
      for (var i=0; i<data.length; i+=TTOT) {
          if (data[i]==0&&data[i+1]==0&&data[i+2]==0&&data[TNEXT]==0)
            continue;
          this._freecur = i+TTOT;
          var lvl=data[i+TLEVEL];
          if (index[lvl*ITOT+IHEAD]==-1) {
              index[lvl*ITOT+IHEAD] = index[lvl*ITOT+ITAIL] = i;
              data[i+TNEXT] = -1;
          }
          else {
            var i2=index[lvl*ITOT+ITAIL];
            data[i2+TNEXT] = i;
            data[i+TNEXT] = -1;
            index[lvl*ITOT+ITAIL] = i;
          }
          index[lvl*ITOT+ITOTPOINT]++;
      }
      if (seg==undefined)
        return ;
      for (var i=0; i<this.max_layers; i++) {
          for (var p in this.points(i)) {
              p.seg = seg.eid;
          }
      }
    }
     points(level) {
      return this.points_iter_cache.next().cache_init(this, level);
    }
     add_point(level, co=$_co_vf2w_add_point) {
      this._freecur+=TTOT-(this._freecur%TTOT);
      var i=this._freecur;
      if (this._freecur+TTOT>=this._size) {
          this.resize(this._freecur+3);
      }
      var j=0;
      this.data[i+TX] = co[0];
      this.data[i+TY] = co[1];
      this.data[i+TLEVEL] = level;
      this.data[i+TID] = i;
      this.data[i+TNEXT] = -1;
      this.data[i+TSUPPORT] = 0.3;
      this.data[i+TDEGREE] = 2.0;
      this._freecur = i+TTOT;
      var head=this.index[level*ITOT+IHEAD];
      var tail=this.index[level*ITOT+ITAIL];
      if (head==-1||tail==-1) {
          this.index[level*ITOT+IHEAD] = i;
          this.index[level*ITOT+ITAIL] = i;
      }
      else {
        this.data[tail+TNEXT] = i;
        this.index[level*ITOT+ITAIL] = i;
      }
      this.index[level*ITOT+ITOTPOINT]++;
      this.totpoint++;
      return add_point_cache.next().bind(this, i);
    }
     get(id, allocate_object=false) {
      if (allocate_object)
        return new BoundPoint().bind(this, id);
      else 
        return get_point_cache.next().bind(this, id);
    }
     curve_effect() {
      return this._effector;
    }
     resize(newsize) {
      if (newsize<this._size)
        return ;
      newsize*=2.0;
      var array=new Float64Array(newsize);
      var oldsize=this.data.length;
      for (var i=0; i<oldsize; i++) {
          array[i] = this.data[i];
      }
      this._size = newsize;
      this.data = array;
    }
     segment_split(old_segment, old_v1, old_v2, new_segments) {

    }
     recalc_worldcos_level(seg, level) {
      for (var p in this.points(level)) {
          $sta_SpPG_recalc_worldcos_level[0] = p.s;
          $sta_SpPG_recalc_worldcos_level[1] = p.t;
          $sta_SpPG_recalc_worldcos_level[2] = p.a;
          var co=seg._evalwrap.local_to_global($sta_SpPG_recalc_worldcos_level);
          var co2=seg._evalwrap.evaluate($sta_SpPG_recalc_worldcos_level[0]);
          p[0] = co[0];
          p[1] = co[1];
          p.offset[0] = co[0]-co2[0];
          p.offset[1] = co[1]-co2[1];
      }
    }
     recalc_wordscos(seg) {
      for (var i=0; i<this.max_layers; i++) {
          this.recalc_worldcos_level(seg, i);
      }
    }
     post_solve(owner_segment) {
      this.recalc_wordscos(owner_segment);
    }
     interp(srcs, ws) {
      this.time = 0.0;
      for (var i=0; i<srcs.length; i++) {

      }
    }
    static  fromSTRUCT(reader) {
      var ret=STRUCT.chain_fromSTRUCT(MultiResLayer, reader);
      ret.max_layers = 8;
      return ret;
    }
  }
  var $_co_vf2w_add_point=[0, 0];
  var $sta_SpPG_recalc_worldcos_level=[0, 0, 0];
  _ESClass.register(MultiResLayer);
  _es6_module.add_class(MultiResLayer);
  MultiResLayer = _es6_module.add_export('MultiResLayer', MultiResLayer);
  MultiResLayer.STRUCT = STRUCT.inherit(MultiResLayer, CustomDataLayer)+`
    data            : array(double);
    index           : array(double);
    max_layers      : int;
    totpoint        : int;
    _freecur        : int;
    _size           : int;
  }
`;
  MultiResLayer.layerinfo = {type_name: "MultiResLayer", 
   has_curve_effect: true, 
   shared_class: MultiResGlobal}
  function test_fix_points() {
    var spline=new Context().spline;
    for (var seg in spline.segments) {
        var mr=seg.cdata.get_layer(MultiResLayer);
        mr.fix_points(seg);
    }
  }
  test_fix_points = _es6_module.add_export('test_fix_points', test_fix_points);
  function test_multires(n) {
    var mr=new MultiResLayer();
    var adds=[0.5, -0.25, -1, 1, 1, -2, 4, 9, 11.3, 3, 4, 0.245345, 1.0234, 8, 7, 4, 6];
    var iadd=0.0;
    for (var i=0; i<5; i++, iadd+=0.2*(i+1)) {
        var add=iadd;
        var p=mr.add_point(0, [-4, -3]);
        var c=0;
        p.id = adds[c++]+add++;
        p.offset[0] = adds[c++]+add++;
        p.offset[1] = adds[c++]+add++;
        p.flag = adds[c++]+add++;
        p.seg = adds[c++]+add++;
        p.t = adds[c++]+add++;
        p.s = adds[c++]+add++;
        p[0] = adds[c++]+add++;
        p[1] = adds[c++]+add++;
        add = iadd;
        c = 0;
        console.log(p.id==adds[c++]+add++, adds[c-1]+add-1, p.id, "id");
        console.log(p.offset[0]==adds[c++]+add++, adds[c-1]+add-1, p.offset[0], "offset[0]");
        console.log(p.offset[1]==adds[c++]+add++, adds[c-1]+add-1, p.offset[1], "offset[1]");
        console.log(p.flag==adds[c++]+add++, adds[c-1]+add-1, p.flag, "flag");
        console.log(p.seg==adds[c++]+add++, adds[c-1]+add-1, p.seg, "seg");
        console.log(p.t==adds[c++]+add++, adds[c-1]+add-1, p.t, "t");
        console.log(p.s==adds[c++]+add++, adds[c-1]+add-1, p.s, "s");
        console.log(p[0]==adds[c++]+add++, adds[c-1]+add-1, p[0], "[0]");
        console.log(p[1]==adds[c++]+add++, adds[c-1]+add-1, p[1], "[1]");
    }
    var _c=0;
    for (var p of mr.points(0)) {
        console.log(""+p);
        if (_c++>1000) {
            console.trace("Infinite loop!");
            break;
        }
    }
    return mr;
  }
  test_multires = _es6_module.add_export('test_multires', test_multires);
  function compose_id(eid, index) {
    var mul=(1<<24);
    return index+eid*mul;
  }
  compose_id = _es6_module.add_export('compose_id', compose_id);
  var $ret_DpkE_decompose_id=[0, 0];
  function decompose_id(id) {
    var mul=(1<<24);
    var eid=Math.floor(id/mul);
    id-=eid*mul;
    $ret_DpkE_decompose_id[0] = eid;
    $ret_DpkE_decompose_id[1] = id;
    return $ret_DpkE_decompose_id;
  }
  decompose_id = _es6_module.add_export('decompose_id', decompose_id);
  var _test_id_start=0;
  function test_ids(steps, start) {
    if (steps===undefined) {
        steps = 1;
    }
    if (start===undefined) {
        start = _test_id_start;
    }
    var max_mres=5000000;
    var max_seg=500000;
    console.log("starting at", start);
    for (var i=start; i<start+steps; i++) {
        for (var j=0; j<max_seg; j++) {
            var id=compose_id(i, j);
            var ret=decompose_id(id);
            if (i!=ret[0]||j!=ret[1]) {
                console.log("Found bad combination!!", ret[0], ret[1], "||", i, j);
            }
        }
    }
    console.log("finished");
    _test_id_start = i;
  }
  test_ids = _es6_module.add_export('test_ids', test_ids);
  function has_multires(spline) {
    return spline.segments.cdata.num_layers("MultiResLayer")>0;
  }
  has_multires = _es6_module.add_export('has_multires', has_multires);
  function ensure_multires(spline) {
    if (spline.segments.cdata.num_layers("MultiResLayer")==0) {
        spline.segments.cdata.add_layer(MultiResLayer);
    }
  }
  ensure_multires = _es6_module.add_export('ensure_multires', ensure_multires);
  var empty_iter={_ret: {done: true, 
    value: undefined}, 
   next: function () {
      this._ret.done = true;
      this._ret.value = undefined;
      return this._ret;
    }}
  empty_iter[Symbol.iterator] = function () {
    return this;
  }
  class GlobalIter  {
    
     constructor(spline, level, return_keys=false) {
      this.spline = spline;
      this.level = level;
      this.return_keys = return_keys;
      this.seg = undefined;
      this.segiter = spline.segments[Symbol.iterator]();
      this.pointiter = undefined;
      this.ret = {done: false, 
     value: undefined};
    }
     next() {
      if (this.pointiter==undefined) {
          this.seg = this.segiter.next();
          if (this.seg.done==true) {
              this.ret.done = true;
              this.ret.value = undefined;
              return this.ret;
          }
          this.seg = this.seg.value;
          var mr=this.seg.cdata.get_layer(MultiResLayer);
          this.pointiter = mr.points(this.level);
      }
      var p=this.pointiter.next();
      if (p.done) {
          this.pointiter = undefined;
          return this.next();
      }
      p = p.value;
      this.ret.value = this.return_keys ? compose_id(p.seg, p.id) : p;
      return this.ret;
    }
     [Symbol.iterator]() {
      return this;
    }
  }
  _ESClass.register(GlobalIter);
  _es6_module.add_class(GlobalIter);
  function iterpoints(spline, level, return_keys) {
    if (return_keys===undefined) {
        return_keys = false;
    }
    if (spline.segments.cdata.num_layers("MultiResLayer")==0)
      return empty_iter;
    return new GlobalIter(spline, level, return_keys);
  }
  iterpoints = _es6_module.add_export('iterpoints', iterpoints);
  iterpoints.selected = function (spline, level) {
  }
}, '/dev/fairmotion/src/curve/spline_multires.js');
