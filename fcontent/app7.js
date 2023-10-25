
es6_module_define('ui_widgets', ["./ui_button.js", "../config/const.js", "../path-controller/toolsys/toolsys.js", "../path-controller/util/events.js", "./ui_textbox.js", "../path-controller/toolsys/toolprop.js", "../path-controller/util/simple_events.js", "../core/ui_base.js", "../path-controller/util/util.js", "../core/units.js", "../path-controller/util/vectormath.js", "../path-controller/controller/controller.js"], function _ui_widgets_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../path-controller/util/util.js');
  var vectormath=es6_import(_es6_module, '../path-controller/util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../path-controller/util/events.js');
  var toolsys=es6_import(_es6_module, '../path-controller/toolsys/toolsys.js');
  var toolprop=es6_import(_es6_module, '../path-controller/toolsys/toolprop.js');
  var DataPathError=es6_import_item(_es6_module, '../path-controller/controller/controller.js', 'DataPathError');
  var Vector3=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Quat');
  var Matrix4=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Matrix4');
  var isNumber=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'isNumber');
  var PropFlags=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'PropFlags');
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
  var OldButton=es6_import_item(_es6_module, './ui_button.js', 'OldButton');
  var eventWasTouch=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'eventWasTouch');
  var popModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'popModalLight');
  var pushModalLight=es6_import_item(_es6_module, '../path-controller/util/simple_events.js', 'pushModalLight');
  let _ex_Button=es6_import_item(_es6_module, './ui_button.js', 'Button');
  _es6_module.add_export('Button', _ex_Button, true);
  class IconLabel extends UIBase {
     constructor() {
      super();
      this._icon = -1;
      this.iconsheet = 1;
    }
    get  icon() {
      return this._icon;
    }
    set  icon(id) {
      this._icon = id;
      this.setCSS();
    }
    static  define() {
      return {tagname: "icon-label-x"}
    }
     init() {
      super.init();
      this.style["display"] = "flex";
      this.style["margin"] = this.style["padding"] = "0px";
      this.setCSS();
    }
     setCSS() {
      let size=ui_base.iconmanager.getTileSize(this.iconsheet);
      ui_base.iconmanager.setCSS(this.icon, this);
      this.style["width"] = size+"px";
      this.style["height"] = size+"px";
    }
  }
  _ESClass.register(IconLabel);
  _es6_module.add_class(IconLabel);
  IconLabel = _es6_module.add_export('IconLabel', IconLabel);
  UIBase.internalRegister(IconLabel);
  class ValueButtonBase extends OldButton {
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
          this.internalDisabled = true;
          if (redraw)
            this._redraw();
          return ;
      }
      else {
        let redraw=this.disabled;
        this.internalDisabled = false;
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
      span.addEventListener("pointerover", mover, {passive: true});
      span.addEventListener("mousein", mover, {passive: true});
      span.addEventListener("mouseleave", mleave, {passive: true});
      span.addEventListener("pointerout", mleave, {passive: true});
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
      span.addEventListener("pointerdown", mdown, {passive: true});
      span.addEventListener("pointerup", mup, {passive: true});
      span.addEventListener("pointercancel", mup, {passive: true});
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
      label.style["align-self"] = "center";
      let side=this.getDefault("CheckSide");
      if (side==="right") {
          span.prepend(label);
      }
      else {
        span.appendChild(label);
      }
      shadow.appendChild(span);
    }
    get  internalDisabled() {
      return super.internalDisabled;
    }
    set  internalDisabled(val) {
      if (!!this.internalDisabled===!!val) {
          return ;
      }
      super.internalDisabled = val;
      this._redraw();
    }
    get  value() {
      return this.checked;
    }
    set  value(v) {
      this.checked = v;
    }
    get  checked() {
      return this._checked;
    }
    set  checked(v) {
      v = !!v;
      if (this._checked!==v) {
          this._checked = v;
          this.setCSS();
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
    get  label() {
      return this._label.textContent;
    }
    set  label(l) {
      this._label.textContent = l;
    }
    static  define() {
      return {tagname: "check-x", 
     style: "checkbox", 
     parentStyle: "button"}
    }
     init() {
      this.tabIndex = 1;
      this.setAttribute("class", "checkx");
      let style=document.createElement("style");
      let color=this.getDefault("focus-border-color");
      style.textContent = `
      .checkx:focus {
        outline : none;
      }
    `;
      this.prepend(style);
    }
     setCSS() {
      this._label.style["font"] = this.getDefault("DefaultText").genCSS();
      this._label.style["color"] = this.getDefault("DefaultText").color;
      this._label.style['font'] = 'normal 14px poppins';
      super.setCSS();
      this.style["background-color"] = "rgba(0,0,0,0)";
    }
     updateDataPath() {
      if (!this.getAttribute("datapath")) {
          return ;
      }
      let val=this.getPathValue(this.ctx, this.getAttribute("datapath"));
      let redraw=false;
      if (val===undefined) {
          this.internalDisabled = true;
          return ;
      }
      else {
        redraw = this.internalDisabled;
        this.internalDisabled = false;
      }
      val = !!val;
      redraw = redraw||!!this._checked!==!!val;
      if (redraw) {
          this._checked = val;
          this._repos_canvas();
          this.setCSS();
          this._redraw();
      }
    }
     _repos_canvas() {

    }
     _redraw() {
      if (this.canvas===undefined) {
          this._updatekey = "";
          return ;
      }
      let canvas=this.canvas, g=this.g;
      let dpi=UIBase.getDPI();
      let tilesize=ui_base.iconmanager.getTileSize(0);
      let pad=this.getDefault("padding");
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
          color = this.getDefault("focus-border-color");
          g.lineWidth*=dpi;
          ui_base.drawRoundBox(this, canvas, g, undefined, undefined, undefined, "stroke", color);
      }
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
      let ready=ui_base.getIconManager().isReady(0);
      if (this.hasAttribute("datapath")) {
          this.updateDataPath();
      }
      let updatekey=this.getDefault("DefaultText").hash();
      updatekey+=this._checked+":"+this._label.textContent;
      updatekey+=":"+ready;
      if (updatekey!==this._updatekey) {
          this._repos_canvas();
          this.setCSS();
          this._updatekey = updatekey;
          this._redraw();
      }
    }
  }
  _ESClass.register(Check);
  _es6_module.add_class(Check);
  Check = _es6_module.add_export('Check', Check);
  UIBase.internalRegister(Check);
  class IconButton extends UIBase {
     constructor() {
      super();
      this._customIcon = undefined;
      this._pressed = false;
      this._highlight = false;
      this._draw_pressed = true;
      this._icon = -1;
      this._icon_pressed = undefined;
      this.iconsheet = 0;
      this.drawButtonBG = true;
      this._extraIcon = undefined;
      this.extraDom = undefined;
      this.dom = document.createElement("div");
      this.shadow.appendChild(this.dom);
      this._last_iconsheet = undefined;
      this.addEventListener("keydown", (e) =>        {
        switch (e.keyCode) {
          case keymap["Enter"]:
          case keymap["Space"]:
            this.click();
            break;
        }
      });
    }
     click() {
      if (this._onpress) {
          let rect=this.getClientRects();
          let x=rect.x+rect.width*0.5;
          let y=rect.y+rect.height*0.5;
          let e={x: x, 
       y: y, 
       stopPropagation: () =>              {            }, 
       preventDefault: () =>              {            }};
          this._onpress(e);
      }
      super.click();
    }
    get  customIcon() {
      return this._customIcon;
    }
    set  customIcon(domImage) {
      this._customIcon = domImage;
      this.setCSS();
    }
    get  icon() {
      return this._icon;
    }
    set  icon(val) {
      this._icon = val;
      this.setCSS();
    }
    static  define() {
      return {tagname: "iconbutton-x", 
     style: "iconbutton"}
    }
     _on_press() {
      this._pressed = true;
      this.setCSS();
    }
     _on_depress() {
      this._pressed = false;
      this.setCSS();
    }
     updateDefaultSize() {

    }
     setCSS() {
      super.setCSS();
      let def;
      let pstyle=this.getDefault("depressed");
      let hstyle=this.getDefault("highlight");
      this.noMarginsOrPadding();
      if (this._pressed&&this._draw_pressed) {
          def = (k) =>            {
            return this.getSubDefault("depressed", k);
          };
      }
      else 
        if (this._highlight) {
          def = (k) =>            {
            return this.getSubDefault("highlight", k);
          };
      }
      else {
        def = (k) =>          {
          return this.getDefault(k);
        };
      }
      let loadstyle=(key, addpx) =>        {
        let val=def(key);
        if (addpx) {
            val = (""+val).trim();
            if (!val.toLowerCase().endsWith("px")) {
                val+="px";
            }
        }
        this.style[key] = val;
      };
      let keys=["margin", "padding", "margin-left", "margin-right", "margin-top", "margin-botton", "padding-left", "padding-bottom", "padding-top", "padding-right", "border-radius"];
      for (let k of keys) {
          loadstyle(k, true);
      }
      loadstyle("background-color", false);
      loadstyle("color", false);
      let border=`${def("border-width", true)} ${def("border-style", false)} ${def("border-color", false)}`;
      this.style["border"] = border;
      let w=this.getDefault("width");
      let size=ui_base.iconmanager.getTileSize(this.iconsheet);
      w = size;
      this.style["width"] = w+"px";
      this.style["height"] = w+"px";
      this.dom.style["width"] = w+"px";
      this.dom.style["height"] = w+"px";
      this.dom.style["margin"] = this.dom.style["padding"] = "0px";
      this.style["display"] = "flex";
      this.style["align-items"] = "center";
      if (this._customIcon) {
          this.dom.style["background-image"] = `url("${this._customIcon.src}")`;
          this.dom.style["background-size"] = "contain";
          this.dom.style["background-repeat"] = "no-repeat";
      }
      else {
        let icon=this.icon;
        if (this._pressed&&this._icon_pressed!==undefined) {
            icon = this._icon_pressed;
        }
        ui_base.iconmanager.setCSS(icon, this.dom, this.iconsheet);
      }
      if (this._extraIcon!==undefined) {
          let dom;
          if (!this.extraDom) {
              this.extraDom = dom = document.createElement("div");
              this.shadow.appendChild(dom);
          }
          else {
            dom = this.extraDom;
          }
          dom.style["position"] = "absolute";
          dom.style["margin"] = dom.style["padding"] = "0px";
          dom.style["pointer-events"] = "none";
          dom.style["width"] = size+"px";
          dom.style["height"] = size+"px";
          ui_base.iconmanager.setCSS(this._extraIcon, dom, this.iconsheet);
      }
      else 
        if (this.extraDom) {
          this.extraDom.remove();
      }
    }
     init() {
      super.init();
      let press=(e) =>        {
        e.stopPropagation();
        e.preventDefault();
        if (this.modalRunning) {
            this.popModal();
        }
        if (!eventWasTouch(e)&&e.button!==0) {
            return ;
        }
        if (1) {
            let this2=this;
            this.pushModal({on_mouseup: function on_mouseup(e) {
                if (this2.onclick&&eventWasTouch(e)) {
                    this2.onclick();
                }
                this.end();
              }, 
        on_touchcancel: function on_touchcancel(e) {
                this.on_mouseup(e);
                this.end();
              }, 
        on_touchend: function on_touchend(e) {
                this.on_mouseup(e);
                this.end();
              }, 
        on_keydown: function on_keydown(e) {
                this.end();
              }, 
        end: function end() {
                if (this2.modalRunning) {
                    this2.popModal();
                    this2._on_depress(e);
                    this2.setCSS();
                }
              }});
        }
        this._on_press(e);
      };
      let depress=(e) =>        {
        e.stopPropagation();
        e.preventDefault();
        this._on_depress();
        this.setCSS();
      };
      let high=(e) =>        {
        this._highlight = true;
        this.setCSS();
      };
      let unhigh=(e) =>        {
        this._highlight = false;
        this.setCSS();
      };
      this.tabIndex = 0;
      this.addEventListener("mouseover", high);
      this.addEventListener("mouseexit", unhigh);
      this.addEventListener("mouseleave", unhigh);
      this.addEventListener("focus", high);
      this.addEventListener("blur", unhigh);
      this.addEventListener("mousedown", press, {capture: true});
      this.addEventListener("mouseup", depress, {capture: true});
      this.setCSS();
      this.dom.style["pointer-events"] = "none";
    }
     update() {
      super.update();
      if (this.iconsheet!==this._last_iconsheet) {
          this.setCSS();
          this._last_iconsheet = this.iconsheet;
      }
    }
     _getsize() {
      let margin=this.getDefault("padding");
      return ui_base.iconmanager.getTileSize(this.iconsheet)+margin*2;
    }
  }
  _ESClass.register(IconButton);
  _es6_module.add_class(IconButton);
  IconButton = _es6_module.add_export('IconButton', IconButton);
  UIBase.internalRegister(IconButton);
  class IconCheck extends IconButton {
     constructor() {
      super();
      this._checked = undefined;
      this._drawCheck = undefined;
    }
    get  drawCheck() {
      let ret=this._drawCheck;
      ret = ret===undefined ? this.getDefault("drawCheck") : ret;
      ret = ret===undefined ? true : ret;
      return ret;
    }
    set  drawCheck(val) {
      val = !!val;
      if (val&&(this.packflag&PackFlags.HIDE_CHECK_MARKS)) {
          this.packflag&=~PackFlags.HIDE_CHECK_MARKS;
      }
      let old=!!this.drawCheck;
      this._drawCheck = val;
      if (val!==old) {
          this.updateDrawCheck();
          this.setCSS();
      }
    }
     click() {
      super.click();
      this.checked^=true;
    }
    get  icon() {
      return this._icon;
    }
    set  icon(val) {
      this._icon = val;
      this.setCSS();
    }
    get  checked() {
      return this._checked;
    }
    set  checked(val) {
      if (!!val!==!!this._checked) {
          this._checked = val;
          this._updatePressed(!!val);
          this.setCSS();
          if (this.onchange) {
              this.onchange(val);
          }
      }
    }
    get  noEmboss() {
      let ret=this.getAttribute("no-emboss");
      if (!ret) {
          return false;
      }
      ret = ret.toLowerCase().trim();
      return ret==='true'||ret==='yes'||ret==='on';
    }
    set  noEmboss(val) {
      this.setAttribute('no-emboss', val ? 'true' : 'false');
    }
    static  define() {
      return {tagname: "iconcheck-x", 
     style: "iconcheck", 
     parentStyle: "iconbutton"}
    }
     _updatePressed(val) {
      if (this._icon_pressed) {
          this._draw_pressed = false;
      }
      this._pressed = val;
      this.setCSS();
    }
     _on_depress() {
      return ;
    }
     _on_press() {
      this.checked^=true;
      if (this.hasAttribute("datapath")) {
          this.setPathValue(this.ctx, this.getAttribute("datapath"), !!this.checked);
      }
      this.setCSS();
    }
     updateDefaultSize() {

    }
     _calcUpdateKey() {
      return super._calcUpdateKey()+":"+this._icon;
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
              let icon, icon2, title;
              if (rdef.prop.flag&PropFlags.NO_UNDO) {
                  this.setUndo(false);
              }
              else {
                this.setUndo(true);
              }
              if (rdef.subkey&&(rdef.prop.type===PropTypes.FLAG||rdef.prop.type===PropTypes.ENUM)) {
                  icon = rdef.prop.iconmap[rdef.subkey];
                  icon2 = rdef.prop.iconmap2[rdef.subkey];
                  title = rdef.prop.descriptions[rdef.subkey];
                  if (!title&&rdef.subkey.length>0) {
                      title = rdef.subkey;
                      title = title[0].toUpperCase()+title.slice(1, title.length).toLowerCase();
                  }
              }
              else {
                icon2 = rdef.prop.icon2;
                icon = rdef.prop.icon;
                title = rdef.prop.description;
              }
              if (icon2!==undefined&&icon2!==-1) {
                  this._icon_pressed = icon;
                  icon = icon2;
              }
              if (icon!==undefined&&icon!==this.icon)
                this.icon = icon;
              if (title)
                this.description = title;
          }
      }
      let val=this.getPathValue(this.ctx, this.getAttribute("datapath"));
      if (val===undefined) {
          this.internalDisabled = true;
          return ;
      }
      else {
        this.internalDisabled = false;
      }
      val = !!val;
      if (val!==!!this._checked) {
          this._checked = val;
          this._updatePressed(!!val);
          this.setCSS();
      }
    }
     updateDrawCheck() {
      if (this.drawCheck) {
          this._extraIcon = this._checked ? ui_base.Icons.ENUM_CHECKED : ui_base.Icons.ENUM_UNCHECKED;
      }
      else {
        this._extraIcon = undefined;
      }
    }
     update() {
      if (this.packflag&PackFlags.HIDE_CHECK_MARKS) {
          this.drawCheck = false;
      }
      this.updateDrawCheck();
      if (this.hasAttribute("datapath")) {
          this.updateDataPath();
      }
      super.update();
    }
     _getsize() {
      let margin=this.getDefault("padding");
      return ui_base.iconmanager.getTileSize(this.iconsheet)+margin*2;
    }
     setCSS() {
      this.updateDrawCheck();
      super.setCSS();
    }
  }
  _ESClass.register(IconCheck);
  _es6_module.add_class(IconCheck);
  IconCheck = _es6_module.add_export('IconCheck', IconCheck);
  UIBase.internalRegister(IconCheck);
  class Check1 extends Button {
     constructor() {
      super();
      this._namePad = 40;
      this._value = undefined;
    }
    static  define() {
      return {tagname: "check1-x", 
     parentStyle: "button"}
    }
     _redraw() {
      let dpi=this.getDPI();
      let box=40;
      ui_base.drawRoundBox(this, this.dom, this.g, box);
      let ts=this.getDefault("DefaultText").size;
      let text=this._genLabel();
      let tw=ui_base.measureText(this, text, this.dom, this.g).width;
      let cx=this.dom.width/2-tw/2;
      let cy=this.dom.height/2;
      ui_base.drawText(this, box, cy+ts/2, text, {canvas: this.dom, 
     g: this.g});
    }
  }
  _ESClass.register(Check1);
  _es6_module.add_class(Check1);
  Check1 = _es6_module.add_export('Check1', Check1);
  UIBase.internalRegister(Check1);
  let _ex_checkForTextBox=es6_import_item(_es6_module, './ui_textbox.js', 'checkForTextBox');
  _es6_module.add_export('checkForTextBox', _ex_checkForTextBox, true);
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_widgets.js');


es6_module_define('ui_widgets2', ["./ui_button.js", "../util/util.js", "./ui_widgets.js", "../core/ui_base.js", "./ui_richedit.js", "../path-controller/util/events.js", "../path-controller/util/vectormath.js", "../core/units.js", "../core/ui.js", "../path-controller/toolsys/toolprop.js"], function _ui_widgets2_module(_es6_module) {
  "use strict";
  es6_import(_es6_module, './ui_richedit.js');
  var util=es6_import(_es6_module, '../util/util.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var events=es6_import(_es6_module, '../path-controller/util/events.js');
  var Vector2=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Quat');
  var Matrix4=es6_import_item(_es6_module, '../path-controller/util/vectormath.js', 'Matrix4');
  var RowFrame=es6_import_item(_es6_module, '../core/ui.js', 'RowFrame');
  var ColumnFrame=es6_import_item(_es6_module, '../core/ui.js', 'ColumnFrame');
  var isNumber=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'isNumber');
  var PropFlags=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'PropFlags');
  es6_import(_es6_module, './ui_widgets.js');
  let keymap=events.keymap;
  var EnumProperty=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'EnumProperty');
  var PropTypes=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'PropTypes');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var PackFlags=es6_import_item(_es6_module, '../core/ui_base.js', 'PackFlags');
  var IconSheets=es6_import_item(_es6_module, '../core/ui_base.js', 'IconSheets');
  var parsepx=es6_import_item(_es6_module, '../core/ui_base.js', 'parsepx');
  var units=es6_import(_es6_module, '../core/units.js');
  var ToolProperty=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'ToolProperty');
  var Button=es6_import_item(_es6_module, './ui_button.js', 'Button');
  class VectorPopupButton extends Button {
     constructor() {
      super();
      this.value = new Vector4();
    }
    static  define() {
      return {tagname: "vector-popup-button-x", 
     style: "vecPopupButton"}
    }
     _onpress(e) {
      if (e.button&&e.button!==0) {
          return ;
      }
      let panel=UIBase.createElement("vector-panel-x");
      let screen=this.ctx.screen;
      let popup=screen.popup(this, this);
      popup.add(panel);
      popup.button("ok", () =>        {
        popup.end();
      });
      if (this.hasAttribute("datapath")) {
          panel.setAttribute("datapath", this.getAttribute("datapath"));
      }
      if (this.hasAttribute("mass_set_path")) {
          panel.setAttribute("mass_set_path", this.getAttribute("mass_set_path"));
      }
      popup.flushUpdate();
    }
     updateDataPath() {
      if (!this.hasAttribute("datapath")) {
          return ;
      }
      let value=this.getPathValue(this.ctx, this.getAttribute("datapath"));
      if (!value) {
          this.internalDisabled = true;
          return ;
      }
      if (this.internalDisabled) {
          this.internalDisabled = false;
      }
      if (this.value.length!==value.length) {
          switch (value.length) {
            case 2:
              this.value = new Vector2();
              break;
            case 3:
              this.value = new Vector3();
              break;
            case 4:
              this.value = new Vector4();
              break;
          }
      }
      if (this.value.vectorDistance(value)>0.0001) {
          this.value.load(value);
          console.log("updated vector popup button value");
      }
    }
     update() {
      super.update();
      this.updateDataPath();
    }
  }
  _ESClass.register(VectorPopupButton);
  _es6_module.add_class(VectorPopupButton);
  VectorPopupButton = _es6_module.add_export('VectorPopupButton', VectorPopupButton);
  UIBase.internalRegister(VectorPopupButton);
  class VectorPanel extends ColumnFrame {
     constructor() {
      super();
      this.range = [-1e+17, 1e+17];
      this.name = "";
      this.axes = "XYZW";
      this.value = new Vector3();
      this.sliders = [];
      this.hasUniformSlider = false;
      this.packflag|=PackFlags.FORCE_ROLLER_SLIDER;
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
      makeParam("slideSpeed");
      makeParam("expRate");
      makeParam("stepIsRelative");
      window.vp = this;
    }
     init() {
      super.init();
      this.rebuild();
      this.setCSS();
      this.background = this.getDefault("InnerPanelBG");
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
      this.sliders = [];
      for (let i=0; i<this.value.length; i++) {
          let slider=frame.slider(undefined, {name: this.axes[i], 
       defaultval: this.value[i], 
       min: this.range[0], 
       max: this.range[1], 
       step: this.step||0.001, 
       is_int: this.isInt, 
       packflag: this.packflag});
          slider.addLabel = false;
          slider.labelOnTop = false;
          slider.axis = i;
          let this2=this;
          slider.baseUnit = this.baseUnit;
          slider.slideSpeed = this.slideSpeed;
          slider.decimalPlaces = this.decimalPlaces;
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
          let uslider=this.uslider = UIBase.createElement("numslider-x");
          row._prepend(uslider);
          uslider.range = this.range;
          uslider.baseUnit = this.baseUnit;
          uslider.slideSpeed = this.slideSpeed;
          uslider.decimalPlaces = this.decimalPlaces;
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
          this.internalDisabled = true;
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
      loadNumParam("decimalPlaces");
      loadNumParam("baseUnit");
      loadNumParam("slideSpeed");
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
          let update=this.range[0]!==meta.range[0];
          update = update||this.range[1]!==meta.range[1];
          this.range[0] = meta.range[0];
          this.range[1] = meta.range[1];
          if (update) {
              this.doOnce(this.rebuild);
          }
      }
      this.internalDisabled = false;
      let length=val.length;
      if (meta&&(meta.flag&PropFlags.USE_CUSTOM_GETSET)) {
          let rdef=this.ctx.api.resolvePath(this.ctx, path);
          meta.ctx = this.ctx;
          meta.dataref = rdef.obj;
          meta.datapath = path;
          length = meta.getValue().length;
          meta.dataref = undefined;
      }
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
  UIBase.internalRegister(VectorPanel);
  class ToolTip extends UIBase {
     constructor() {
      super();
      this.visibleToPick = false;
      this.div = document.createElement("div");
      this.shadow.appendChild(this.div);
      this._start_time = undefined;
      this.timeout = undefined;
    }
    static  show(message, screen, x, y) {
      let ret=UIBase.createElement(this.define().tagname);
      ret._start_time = util.time_ms();
      ret.timeout = ret.getDefault("timeout");
      ret.text = message;
      let size=ret._estimateSize();
      let pad=5;
      size = [size[0]+pad, size[1]+pad];
      console.log(size);
      x = Math.min(Math.max(x, 0), screen.size[0]-size[0]);
      y = Math.min(Math.max(y, 0), screen.size[1]-size[1]);
      let dpi=UIBase.getDPI();
      x+=10/dpi;
      y+=15/dpi;
      ret._popup = screen.popup(ret, x, y);
      ret._popup.background = "rgba(0,0,0,0)";
      ret._popup.style["border"] = "none";
      ret.div.style["padding"] = "15px";
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
     update() {
      super.update();
      if (util.time_ms()-this._start_time>this.timeout) {
          this.end();
      }
    }
     setCSS() {
      super.setCSS();
      let color=this.getDefault("background-color");
      let bcolor=this.getDefault("border-color");
      this.background = color;
      let radius=this.getDefault("border-radius", undefined, 5);
      let bstyle=this.getDefault("border-style", undefined, "solid");
      let bwidth=this.getDefault("border-width", undefined, 1);
      let padding=this.getDefault("padding", undefined, 15);
      this.noMarginsOrPadding();
      this.div.style["padding"] = padding+"px";
      this.div.style["background-color"] = "rgba(0,0,0,0)";
      this.div.style["border"] = `${bwidth}px ${bstyle} ${bcolor}`;
      this.div.style["border-radius"] = radius+"px";
      this.style["border-radius"] = radius+"px";
      let font=this.getDefault("ToolTipText");
      this.div.style["color"] = font.color;
      this.div.style["font"] = font.genCSS();
    }
    static  define() {
      return {tagname: "tool-tip-x", 
     style: "tooltip"}
    }
  }
  _ESClass.register(ToolTip);
  _es6_module.add_class(ToolTip);
  ToolTip = _es6_module.add_export('ToolTip', ToolTip);
  
  UIBase.internalRegister(ToolTip);
  window._ToolTip = ToolTip;
}, '/dev/fairmotion/src/path.ux/scripts/widgets/ui_widgets2.js');


es6_module_define('xmlpage', ["../util/util.js", "../widgets/ui_menu.js", "../path-controller/toolsys/toolprop.js", "../core/ui_base.js", "../core/ui.js", "../widgets/ui_numsliders.js"], function _xmlpage_module(_es6_module) {
  var isNumber=es6_import_item(_es6_module, '../path-controller/toolsys/toolprop.js', 'isNumber');
  let pagecache=new Map();
  var PackFlags=es6_import_item(_es6_module, '../core/ui_base.js', 'PackFlags');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var sliderDomAttributes=es6_import_item(_es6_module, '../widgets/ui_numsliders.js', 'sliderDomAttributes');
  var util=es6_import(_es6_module, '../util/util.js');
  var Menu=es6_import_item(_es6_module, '../widgets/ui_menu.js', 'Menu');
  var Icons=es6_import_item(_es6_module, '../core/ui_base.js', 'Icons');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var domTransferAttrs=new Set(["id", "title", "tab-index"]);
  domTransferAttrs = _es6_module.add_export('domTransferAttrs', domTransferAttrs);
  var domEventAttrs=new Set(["click", "mousedown", "mouseup", "mousemove", "keydown", "keypress"]);
  domEventAttrs = _es6_module.add_export('domEventAttrs', domEventAttrs);
  function parseXML(xml) {
    let parser=new DOMParser();
    xml = `<root>${xml}</root>`;
    return parser.parseFromString(xml.trim(), "application/xml");
  }
  parseXML = _es6_module.add_export('parseXML', parseXML);
  let num_re=/[0-9]+$/;
  function getIconFlag(elem) {
    if (!elem.hasAttribute("useIcons")) {
        return 0;
    }
    let attr=elem.getAttribute("useIcons");
    if (typeof attr==="string") {
        attr = attr.toLowerCase().trim();
    }
    if (attr==="false"||attr==="no") {
        return 0;
    }
    if (attr==="true"||attr==="yes") {
        return PackFlags.USE_ICONS;
    }
    else 
      if (attr==="small") {
        return PackFlags.SMALL_ICON|PackFlags.USE_ICONS;
    }
    else 
      if (attr==="large") {
        return PackFlags.LARGE_ICON|PackFlags.USE_ICONS;
    }
    else {
      let isnum=typeof attr==="number";
      let sheet=attr;
      if (typeof sheet==="string"&&sheet.search(num_re)===0) {
          sheet = parseInt(sheet);
          isnum = true;
      }
      if (!isnum) {
          return PackFlags.USE_ICONS;
      }
      let flag=PackFlags.USE_ICONS|PackFlags.CUSTOM_ICON_SHEET;
      flag|=((sheet-1)<<PackFlags.CUSTOM_ICON_SHEET_START);
      return flag;
    }
    return 0;
  }
  function getPackFlag(elem) {
    let packflag=getIconFlag(elem);
    if (elem.hasAttribute("drawChecks")) {
        if (!getbool(elem, "drawChecks")) {
            packflag|=PackFlags.HIDE_CHECK_MARKS;
        }
        else {
          packflag&=~PackFlags.HIDE_CHECK_MARKS;
        }
    }
    if (getbool(elem, "simpleSlider")) {
        packflag|=PackFlags.SIMPLE_NUMSLIDERS;
    }
    if (getbool(elem, "rollarSlider")) {
        packflag|=PackFlags.FORCE_ROLLER_SLIDER;
    }
    return packflag;
  }
  function myParseFloat(s) {
    s = ''+s;
    s = s.trim().toLowerCase();
    if (s.endsWith("px")) {
        s = s.slice(0, s.length-2);
    }
    return parseFloat(s);
  }
  function getbool(elem, attr) {
    let ret=elem.getAttribute(attr);
    if (!ret) {
        return false;
    }
    ret = ret.toLowerCase();
    return ret==="1"||ret==="true"||ret==="yes";
  }
  function getfloat(elem, attr, defaultval) {
    if (!elem.hasAttribute(attr)) {
        return defaultval;
    }
    return myParseFloat(elem.getAttribute(attr));
  }
  const customHandlers={}
  _es6_module.add_export('customHandlers', customHandlers);
  class Handler  {
     constructor(ctx, container) {
      this.container = container;
      this.stack = [];
      this.ctx = ctx;
      this.codefuncs = {};
      this.templateVars = {};
      let attrs=util.list(sliderDomAttributes);
      this.inheritDomAttrs = {};
      this.inheritDomAttrKeys = new Set(attrs);
    }
     push() {
      this.stack.push(this.container);
      this.stack.push(new Set(this.inheritDomAttrKeys));
      this.stack.push(Object.assign({}, this.inheritDomAttrs));
    }
     pop() {
      this.inheritDomAttrs = this.stack.pop();
      this.inheritDomAttrKeys = this.stack.pop();
      this.container = this.stack.pop();
    }
     handle(elem) {
      if (elem.constructor===XMLDocument||elem.nodeName==='root') {
          for (let child of elem.childNodes) {
              this.handle(child);
          }
          window.tree = elem;
          return ;
      }
      else 
        if (elem.constructor===Text||elem.constructor===Comment) {
          return ;
      }
      let tagname=""+elem.tagName;
      if (tagname in customHandlers) {
          customHandlers[tagname](this, elem);
      }
      else 
        if (this[tagname]) {
          this[tagname](elem);
      }
      else {
        let elem2=UIBase.createElement(tagname.toLowerCase());
        window.__elem = elem;
        for (let k of elem.getAttributeNames()) {
            elem2.setAttribute(k, elem.getAttribute(k));
        }
        if (__instance_of(elem2, UIBase)) {
            if (!elem2.hasAttribute("datapath")&&elem2.hasAttribute("path")) {
                elem2.setAttribute("datapath", elem2.getAttribute("path"));
            }
            if (elem2.hasAttribute("datapath")) {
                let path=elem2.getAttribute("datapath");
                path = this.container._joinPrefix(path);
                elem2.setAttribute("datapath", path);
            }
            if (elem2.hasAttribute("massSetPath")||this.container.massSetPrefix) {
                let massSetPath="";
                if (elem2.hasAttribute("massSetPath")) {
                    massSetPath = elem2.getAttribute("massSetPath");
                }
                let path=elem2.getAttribute("datapath");
                path = this.container._getMassPath(this.container.ctx, path, massSetPath);
                elem2.setAttribute("massSetPath", path);
                elem2.setAttribute("mass_set_path", path);
            }
            this.container.add(elem2);
            this._style(elem, elem2);
            if (__instance_of(elem2, Container)) {
                this.push();
                this.container = elem2;
                this._container(elem, elem2, true);
                this.visit(elem);
                this.pop();
                return ;
            }
        }
        else {
          console.warn("Unknown element "+elem.tagName+" ("+elem.constructor.name+")");
          let elem2=document.createElement(elem.tagName.toLowerCase());
          for (let attr of elem.getAttributeNames()) {
              elem2.setAttribute(attr, elem.getAttribute(attr));
          }
          this._basic(elem, elem2);
          this.container.shadow.appendChild(elem2);
          if (!(__instance_of(elem2, UIBase))) {
              elem2.pathux_ctx = this.container.ctx;
          }
          else {
            elem2.ctx = this.container.ctx;
          }
        }
        this.visit(elem);
      }
    }
     _style(elem, elem2) {
      let style={};
      if (elem.hasAttribute("class")) {
          elem2.setAttribute("class", elem.getAttribute("class"));
          let cls=elem2.getAttribute("class").trim();
          let keys=[cls, (elem2.tagName.toLowerCase()+"."+cls).trim(), "#"+elem.getAttribute("id").trim()];
          for (let sheet of document.styleSheets) {
              for (let rule of sheet.rules) {
                  for (let k of keys) {
                      if (rule.selectorText.trim()===k) {
                          for (let k2 of rule.styleMap.keys()) {
                              let val=rule.style[k2];
                              style[k2] = val;
                          }
                      }
                  }
              }
          }
      }
      if (elem.hasAttribute("style")) {
          let stylecode=elem.getAttribute("style");
          stylecode = stylecode.split(";");
          for (let row of stylecode) {
              row = row.trim();
              let i=row.search(/\:/);
              if (i>=0) {
                  let key=row.slice(0, i).trim();
                  let val=row.slice(i+1, row.length).trim();
                  style[key] = val;
              }
          }
      }
      let keys=Object.keys(style);
      if (keys.length===0) {
          return ;
      }
      function setStyle() {
        for (let k of keys) {
            elem2.style[k] = style[k];
        }
      }
      if (__instance_of(elem2, UIBase)) {
          elem2.setCSS.after(() =>            {
            setStyle();
          });
      }
      setStyle();
    }
     visit(node) {
      for (let child of node.childNodes) {
          this.handle(child);
      }
    }
     _getattr(elem, k) {
      let val=elem.getAttribute(k);
      if (!val) {
          return val;
      }
      if (val.startsWith("##")) {
          val = val.slice(2, val.length).trim();
          if (!(val in this.templateVars)) {
              console.error(`unknown template variable '${val}'`);
              val = '';
          }
          else {
            val = this.templateVars[val];
          }
      }
      return val;
    }
     _basic(elem, elem2) {
      this._style(elem, elem2);
      for (let k of elem.getAttributeNames()) {
          if (k.startsWith("custom")) {
              elem2.setAttribute(k, this._getattr(elem, k));
          }
      }
      let codeattrs=[];
      for (let k of elem.getAttributeNames()) {
          let val=""+elem.getAttribute(k);
          if (val.startsWith('ng[')) {
              val = val.slice(3, val.endsWith("]") ? val.length-1 : val.length);
              codeattrs.push([k, "ng", val]);
          }
      }
      for (let k of domEventAttrs) {
          let k2='on'+k;
          if (elem.hasAttribute(k2)) {
              codeattrs.push([k, "dom", elem.getAttribute(k2)]);
          }
      }
      for (let /*unprocessed ExpandNode*/[k, eventType, id] of codeattrs) {
          if (!(id in this.codefuncs)) {
              console.error("Unknown code fragment "+id);
              continue;
          }
          if (eventType==="dom") {
              if (k==='click') {
                  let onclick=elem2.onclick;
                  let func=this.codefuncs[id];
                  elem2.onclick = function () {
                    if (onclick) {
                        onclick.apply(this, arguments);
                    }
                    return func.apply(this, arguments);
                  };
              }
              else {
                elem2.addEventListener(k, this.codefuncs[id]);
              }
          }
          else 
            if (eventType==="ng") {
              elem2.addEventListener(k, this.codefuncs[id]);
          }
      }
      for (let k of domTransferAttrs) {
          if (elem.hasAttribute(k)) {
              elem2.setAttribute(k, elem.getAttribute(k));
          }
      }
      for (let k in this.inheritDomAttrs) {
          if (!elem.hasAttribute(k)) {
              elem.setAttribute(k, this.inheritDomAttrs[k]);
          }
      }
      for (let k of sliderDomAttributes) {
          if (elem.hasAttribute(k)) {
              elem2.setAttribute(k, elem.getAttribute(k));
          }
      }
      if (!(__instance_of(elem2, UIBase))) {
          return ;
      }
      if (elem.hasAttribute("theme-class")) {
          elem2.overrideClass(elem.getAttribute("theme-class"));
          if (elem2._init_done) {
              elem2.setCSS();
              elem2.flushUpdate();
          }
      }
      if (elem.hasAttribute("useIcons")&&typeof elem2.useIcons==="function") {
          let val=elem.getAttribute("useIcons").trim().toLowerCase();
          if (val==="small"||val==="true"||val==="yes") {
              val = true;
          }
          else 
            if (val==="large") {
              val = 1;
          }
          else 
            if (val==="false"||val==="no") {
              val = false;
          }
          else {
            val = parseInt(val)-1;
          }
          elem2.useIcons(val);
      }
      if (elem.hasAttribute("sliderTextBox")) {
          let textbox=getbool(elem, "sliderTextBox");
          if (textbox) {
              elem2.packflag&=~PackFlags.NO_NUMSLIDER_TEXTBOX;
              elem2.inherit_packflag&=~PackFlags.NO_NUMSLIDER_TEXTBOX;
          }
          else {
            elem2.packflag|=PackFlags.NO_NUMSLIDER_TEXTBOX;
            elem2.inherit_packflag|=PackFlags.NO_NUMSLIDER_TEXTBOX;
          }
      }
      if (elem.hasAttribute("sliderMode")) {
          let sliderMode=elem.getAttribute("sliderMode");
          if (sliderMode==="slider") {
              elem2.packflag&=~PackFlags.FORCE_ROLLER_SLIDER;
              elem2.inherit_packflag&=~PackFlags.FORCE_ROLLER_SLIDER;
              elem2.packflag|=PackFlags.SIMPLE_NUMSLIDERS;
              elem2.inherit_packflag|=PackFlags.SIMPLE_NUMSLIDERS;
          }
          else 
            if (sliderMode==="roller") {
              elem2.packflag&=~PackFlags.SIMPLE_NUMSLIDERS;
              elem2.packflag|=PackFlags.FORCE_ROLLER_SLIDER;
              elem2.inherit_packflag&=~PackFlags.SIMPLE_NUMSLIDERS;
              elem2.inherit_packflag|=PackFlags.FORCE_ROLLER_SLIDER;
          }
      }
      if (elem.hasAttribute("showLabel")) {
          let state=getbool(elem, "showLabel");
          if (state) {
              elem2.packflag|=PackFlags.FORCE_PROP_LABELS;
              elem2.inherit_packflag|=PackFlags.FORCE_PROP_LABELS;
          }
          else {
            elem2.packflag&=~PackFlags.FORCE_PROP_LABELS;
            elem2.inherit_packflag&=~PackFlags.FORCE_PROP_LABELS;
          }
      }
      function doBox(key) {
        if (elem.hasAttribute(key)) {
            let val=elem.getAttribute(key).toLowerCase().trim();
            if (val.endsWith("px")) {
                val = val.slice(0, val.length-2).trim();
            }
            if (val.endsWith("%")) {
                console.warn(`Relative styling of '${key}' may be unstable for this element`, elem);
                elem.setCSS.after(function () {
                  this.style[key] = val;
                });
            }
            else {
              val = parseFloat(val);
              if (isNaN(val)||typeof val!=="number") {
                  console.error(`Invalid style ${key}:${elem.getAttribute(key)}`);
                  return ;
              }
              elem2.overrideDefault(key, val);
              elem2.setCSS();
              elem2.style[key] = ""+val+"px";
            }
        }
      }
      doBox("width");
      doBox("height");
      doBox("margin");
      doBox("padding");
      for (let i=0; i<2; i++) {
          let key=i ? "margin" : "padding";
          doBox(key+"-bottom");
          doBox(key+"-top");
          doBox(key+"-left");
          doBox(key+"-right");
      }
    }
     _handlePathPrefix(elem, con) {
      if (elem.hasAttribute("path")) {
          let prefix=con.dataPrefix;
          let path=elem.getAttribute("path").trim();
          if (prefix.length>0) {
              prefix+=".";
          }
          prefix+=path;
          con.dataPrefix = prefix;
      }
      if (elem.hasAttribute("massSetPath")) {
          let prefix=con.massSetPrefix;
          let path=elem.getAttribute("massSetPath").trim();
          if (prefix.length>0) {
              prefix+=".";
          }
          prefix+=path;
          con.massSetPrefix = prefix;
      }
    }
     _container(elem, con, ignorePathPrefix=false) {
      for (let k of this.inheritDomAttrKeys) {
          if (elem.hasAttribute(k)) {
              this.inheritDomAttrs[k] = elem.getAttribute(k);
          }
      }
      let packflag=getPackFlag(elem);
      con.packflag|=packflag;
      con.inherit_packflag|=packflag;
      this._basic(elem, con);
      if (!ignorePathPrefix) {
          this._handlePathPrefix(elem, con);
      }
    }
     noteframe(elem) {
      let ret=this.container.noteframe();
      if (ret) {
          this._basic(elem, ret);
      }
    }
     cell(elem) {
      this.push();
      this.container = this.container.cell();
      this._container(elem, this.container);
      this.visit(elem);
      this.pop();
    }
     table(elem) {
      this.push();
      this.container = this.container.table();
      this._container(elem, this.container);
      this.visit(elem);
      this.pop();
    }
     panel(elem) {
      let title=""+elem.getAttribute("label");
      let closed=getbool(elem, "closed");
      this.push();
      this.container = this.container.panel(title);
      this.container.closed = closed;
      this._container(elem, this.container);
      this.visit(elem);
      this.pop();
    }
     pathlabel(elem) {
      this._prop(elem, "pathlabel");
    }
     code(elem) {
      window._codelem = elem;
      let buf='';
      for (let elem2 of elem.childNodes) {
          if (elem2.nodeName==="#text") {
              buf+=elem2.textContent+'\n';
          }
      }
      var func, $scope=this.templateScope;
      buf = `
func = function() {
  ${buf};
}
    `;
      eval(buf);
      let id=""+elem.getAttribute("id");
      this.codefuncs[id] = func;
    }
     textbox(elem) {
      if (elem.hasAttribute("path")) {
          this._prop(elem, 'textbox');
      }
      else {
      }
    }
     label(elem) {
      let elem2=this.container.label(elem.innerHTML);
      this._basic(elem, elem2);
    }
     colorfield(elem) {
      this._prop(elem, "colorfield");
    }
     prop(elem) {
      this._prop(elem, "prop");
    }
     _prop(elem, key) {
      let packflag=getPackFlag(elem);
      let path=elem.getAttribute("path");
      let elem2;
      if (key==='pathlabel') {
          elem2 = this.container.pathlabel(path, elem.innerHTML, packflag);
      }
      else 
        if (key==='textbox') {
          elem2 = this.container.textbox(path, undefined, undefined, packflag);
          elem2.update();
          if (elem.hasAttribute("modal")) {
              elem2.setAttribute("modal", elem.getAttribute("modal"));
          }
          if (elem.hasAttribute("realtime")) {
              elem2.setAttribute("realtime", elem.getAttribute("realtime"));
          }
      }
      else 
        if (key==="colorfield") {
          elem2 = this.container.colorPicker(path, {packflag: packflag, 
       themeOverride: elem.hasAttribute("theme-class") ? elem.getAttribute("theme-class") : undefined});
      }
      else {
        elem2 = this.container[key](path, packflag);
      }
      if (!elem2) {
          elem2 = document.createElement("span");
          elem2.innerHTML = "error";
          this.container.shadow.appendChild(elem2);
      }
      else {
        this._basic(elem, elem2);
        if (elem.hasAttribute("massSetPath")||this.container.massSetPrefix) {
            let mpath=elem.getAttribute("massSetPath");
            if (!mpath) {
                mpath = elem.getAttribute("path");
            }
            mpath = this.container._getMassPath(this.container.ctx, path, mpath);
            elem2.setAttribute("mass_set_path", mpath);
        }
      }
    }
     strip(elem) {
      this.push();
      let dir;
      if (elem.hasAttribute("mode")) {
          dir = elem.getAttribute("mode").toLowerCase().trim();
          dir = dir==="horizontal";
      }
      let margin1=getfloat(elem, "margin1", undefined);
      let margin2=getfloat(elem, "margin2", undefined);
      this.container = this.container.strip(undefined, margin1, margin2, dir);
      this._container(elem, this.container);
      this.visit(elem);
      this.pop();
    }
     column(elem) {
      this.push();
      this.container = this.container.col();
      this._container(elem, this.container);
      this.visit(elem);
      this.pop();
    }
     row(elem) {
      this.push();
      this.container = this.container.row();
      this._container(elem, this.container);
      this.visit(elem);
      this.pop();
    }
     toolPanel(elem) {
      this.tool(elem, "toolPanel");
    }
     tool(elem, key="tool") {
      let path=elem.getAttribute("path");
      let packflag=getPackFlag(elem);
      let noIcons=false, iconflags;
      if (getbool(elem, "useIcons")) {
          packflag|=PackFlags.USE_ICONS;
      }
      else 
        if (elem.hasAttribute("useIcons")) {
          packflag&=~PackFlags.USE_ICONS;
          noIcons = true;
      }
      let label=(""+elem.textContent).trim();
      if (label.length>0) {
          path+="|"+label;
      }
      if (noIcons) {
          iconflags = this.container.useIcons(false);
      }
      let elem2=this.container[key](path, packflag);
      if (elem2) {
          this._basic(elem, elem2);
      }
      else {
        elem2 = document.createElement("strip");
        elem2.innerHTML = "error";
        this.container.shadow.appendChild(elem2);
        this._basic(elem, elem2);
      }
      if (noIcons) {
          this.container.inherit_packflag|=iconflags;
          this.container.packflag|=iconflags;
      }
    }
     dropbox(elem) {
      return this.menu(elem, true);
    }
     menu(elem, isDropBox=false) {
      let packflag=getPackFlag(elem);
      let title=elem.getAttribute("name");
      let list=[];
      for (let child of elem.childNodes) {
          if (child.tagName==="tool") {
              let path=child.getAttribute("path");
              let label=child.innerHTML.trim();
              if (label.length>0) {
                  path+="|"+label;
              }
              list.push(path);
          }
          else 
            if (child.tagName==="sep") {
              list.push(Menu.SEP);
          }
          else 
            if (child.tagName==="item") {
              let id, icon, hotkey, description;
              if (child.hasAttribute("id")) {
                  id = child.getAttribute("id");
              }
              if (child.hasAttribute("icon")) {
                  icon = child.getAttribute("icon").toUpperCase().trim();
                  icon = Icons[icon];
              }
              if (child.hasAttribute("hotkey")) {
                  hotkey = child.getAttribute("hotkey");
              }
              if (child.hasAttribute("description")) {
                  description = child.getAttribute("description");
              }
              list.push({name: child.innerHTML.trim(), 
         id: id, 
         icon: icon, 
         hotkey: hotkey, 
         description: description});
          }
      }
      let ret=this.container.menu(title, list, packflag);
      if (isDropBox) {
          ret.removeAttribute("simple");
      }
      if (elem.hasAttribute("id")) {
          ret.setAttribute("id", elem.getAttribute("id"));
      }
      this._basic(elem, ret);
      return ret;
    }
     button(elem) {
      let title=elem.innerHTML.trim();
      let ret=this.container.button(title);
      if (elem.hasAttribute("id")) {
          ret.setAttribute("id", elem.getAttribute("id"));
      }
      this._basic(elem, ret);
    }
     iconbutton(elem) {
      let title=elem.innerHTML.trim();
      let icon=elem.getAttribute("icon");
      if (icon) {
          icon = UIBase.getIconEnum()[icon];
      }
      let ret=this.container.iconbutton(icon, title);
      if (elem.hasAttribute("id")) {
          ret.setAttribute("id", elem.getAttribute("id"));
      }
      this._basic(elem, ret);
    }
     tab(elem) {
      this.push();
      let title=""+elem.getAttribute("label");
      let tabs=this.container;
      this.container = this.container.tab(title);
      if (elem.hasAttribute("overflow")) {
          this.container.setAttribute("overflow", elem.getAttribute("overflow"));
      }
      if (elem.hasAttribute("overflow-y")) {
          this.container.setAttribute("overflow-y", elem.getAttribute("overflow-y"));
      }
      this._container(elem, this.container);
      this.visit(elem);
      this.pop();
    }
     tabs(elem) {
      let pos=elem.getAttribute("pos")||"left";
      this.push();
      let tabs=this.container.tabs(pos);
      this.container = tabs;
      if (elem.hasAttribute("movable-tabs")) {
          tabs.setAttribute("movable-tabs", elem.getAttribute("movable-tabs"));
      }
      this._container(elem, tabs);
      this.visit(elem);
      this.pop();
    }
  }
  _ESClass.register(Handler);
  _es6_module.add_class(Handler);
  function initPage(ctx, xml, parentContainer, templateVars, templateScope) {
    if (parentContainer===undefined) {
        parentContainer = undefined;
    }
    if (templateVars===undefined) {
        templateVars = {};
    }
    if (templateScope===undefined) {
        templateScope = {};
    }
    let tree=parseXML(xml);
    let container=UIBase.createElement("container-x");
    container.ctx = ctx;
    if (ctx) {
        container._init();
    }
    if (parentContainer) {
        parentContainer.add(container);
    }
    let handler=new Handler(ctx, container);
    handler.templateVars = Object.assign({}, templateVars);
    handler.templateScope = templateScope;
    handler.handle(tree);
    return container;
  }
  initPage = _es6_module.add_export('initPage', initPage);
  function loadPage(ctx, url, parentContainer_or_args, loadSourceOnly, modifySourceCB, templateVars, templateScope) {
    if (parentContainer_or_args===undefined) {
        parentContainer_or_args = undefined;
    }
    if (loadSourceOnly===undefined) {
        loadSourceOnly = false;
    }
    let source;
    let parentContainer;
    if (parentContainer_or_args!==undefined&&!(__instance_of(parentContainer_or_args, HTMLElement))) {
        let args=parentContainer_or_args;
        parentContainer = args.parentContainer;
        loadSourceOnly = args.loadSourceOnly;
        modifySourceCB = args.modifySourceCB;
        templateVars = args.templateVars;
        templateScope = args.templateScope;
    }
    else {
      parentContainer = parentContainer_or_args;
    }
    if (pagecache.has(url)) {
        source = pagecache.get(url);
        if (modifySourceCB) {
            source = modifySourceCB(source);
        }
        return new Promise((accept, reject) =>          {
          if (loadSourceOnly) {
              accept(source);
          }
          else {
            accept(initPage(ctx, source, parentContainer, templateVars, templateScope));
          }
        });
    }
    else {
      return new Promise((accept, reject) =>        {
        fetch(url).then((res) =>          {
          return res.text();
        }).then((data) =>          {
          pagecache.set(url, data);
          if (modifySourceCB) {
              data = modifySourceCB(data);
          }
          if (loadSourceOnly) {
              accept(data);
          }
          else {
            accept(initPage(ctx, data, parentContainer, templateVars, templateScope));
          }
        });
      });
    }
  }
  loadPage = _es6_module.add_export('loadPage', loadPage);
}, '/dev/fairmotion/src/path.ux/scripts/xmlpage/xmlpage.js');


es6_module_define('all', ["./pentool.js", "./splinetool.js"], function _all_module(_es6_module) {
  es6_import(_es6_module, './splinetool.js');
  es6_import(_es6_module, './pentool.js');
}, '/dev/fairmotion/src/editors/viewport/toolmodes/all.js');


es6_module_define('pentool', ["../../../curve/spline_types.js", "./toolmode.js", "../../../path.ux/scripts/pathux.js", "../../../path.ux/scripts/util/util.js", "../../../core/keymap.js", "../../../core/toolops_api.js"], function _pentool_module(_es6_module) {
  "use strict";
  var SplineTypes=es6_import_item(_es6_module, '../../../curve/spline_types.js', 'SplineTypes');
  var SplineFlags=es6_import_item(_es6_module, '../../../curve/spline_types.js', 'SplineFlags');
  var SplineVertex=es6_import_item(_es6_module, '../../../curve/spline_types.js', 'SplineVertex');
  var SplineSegment=es6_import_item(_es6_module, '../../../curve/spline_types.js', 'SplineSegment');
  var SplineFace=es6_import_item(_es6_module, '../../../curve/spline_types.js', 'SplineFace');
  var ToolOp=es6_import_item(_es6_module, '../../../core/toolops_api.js', 'ToolOp');
  var ToolMacro=es6_import_item(_es6_module, '../../../core/toolops_api.js', 'ToolMacro');
  var KeyMap=es6_import_item(_es6_module, '../../../core/keymap.js', 'KeyMap');
  var HotKey=es6_import_item(_es6_module, '../../../core/keymap.js', 'HotKey');
  var util=es6_import(_es6_module, '../../../path.ux/scripts/util/util.js');
  var ToolMode=es6_import_item(_es6_module, './toolmode.js', 'ToolMode');
  var nstructjs=es6_import_item(_es6_module, '../../../path.ux/scripts/pathux.js', 'nstructjs');
  var ListProperty=es6_import_item(_es6_module, '../../../path.ux/scripts/pathux.js', 'ListProperty');
  var Vec3Property=es6_import_item(_es6_module, '../../../path.ux/scripts/pathux.js', 'Vec3Property');
  var Vec4Property=es6_import_item(_es6_module, '../../../path.ux/scripts/pathux.js', 'Vec4Property');
  var BoolProperty=es6_import_item(_es6_module, '../../../path.ux/scripts/pathux.js', 'BoolProperty');
  var IntProperty=es6_import_item(_es6_module, '../../../path.ux/scripts/pathux.js', 'IntProperty');
  var FloatProperty=es6_import_item(_es6_module, '../../../path.ux/scripts/pathux.js', 'FloatProperty');
  var StringProperty=es6_import_item(_es6_module, '../../../path.ux/scripts/pathux.js', 'StringProperty');
  window.anim_to_playback = [];
  class StrokeOp extends ToolOp {
     constructor() {
      super();
      this._first = true;
      this.startMpos = new Vector2();
      this.lastMpos = new Vector2();
      this._start = 0;
      this._verts = [];
      let on_pointermove=this.on_pointermove;
      let touches=new Map();
      this.on_pointermove = (e) =>        {
        console.log(e, e.pointerType, e.pointerId, touches.size);
        if (e.pointerType=="touch") {
            touches.set(e.pointerId, {});
        }
        if (0) {
            if (e.getCoalescedEvents) {
                for (let e2 of e.getCoalescedEvents()) {
                    on_pointermove.call(this, e2);
                }
            }
            else {
              on_pointermove.call(this, e);
            }
        }
        else {
          on_pointermove.call(this, e);
        }
      };
    }
    static  tooldef() {
      return {uiname: "Add Stroke", 
     toolpath: "pen.stroke", 
     inputs: {points: new ListProperty(Vec3Property), 
      lineWidth: new FloatProperty(), 
      strokeColor: new Vec4Property([0, 0, 0, 1]), 
      limit: new FloatProperty(75), 
      mouseX: new FloatProperty(-1).private(), 
      mouseY: new FloatProperty(-1).private()}, 
     is_modal: true}
    }
     on_pointerdown(e) {
      console.log("pointer down", e);
    }
     on_pointermove(e) {
      let $_t0twwt=this.getInputs(), limit=$_t0twwt.limit, lineWidth=$_t0twwt.lineWidth, strokeColor=$_t0twwt.strokeColor, mouseX=$_t0twwt.mouseX, mouseY=$_t0twwt.mouseY;
      if (mouseX>=0) {
          this.startMpos[0] = mouseX;
          this.startMpos[1] = mouseY;
          this.lastMpos.load(this.startMpos);
          this._first = false;
      }
      let appendPoint=(v) =>        {
        this.inputs.points.push(new Vector3([v[0], v[1], lineWidth]));
        spline.verts.active = v;
      };
      let ctx=this.modal_ctx;
      let view2d=ctx.view2d;
      let p=new Vector2().loadXY(e.x, e.y);
      p = view2d.getLocalMouse(p[0], p[1]);
      let spline=ctx.frameset.spline;
      view2d.unproject(p);
      if (this._first) {
          let newv=spline.make_vertex(p);
          this.onPointCreate(spline, newv, undefined, lineWidth, strokeColor);
          appendPoint(newv);
          this._first = false;
          this.startMpos.load(p);
          view2d.project(this.startMpos);
          this.lastMpos.load(p);
          this._splineUpdate(this.modal_ctx);
          return ;
      }
      if (this.lastMpos.vectorDistance(p)>limit) {
          let actv=spline.verts.active;
          let newv=spline.make_vertex(p);
          this.onPointCreate(spline, newv, actv, lineWidth, strokeColor);
          appendPoint(newv);
          this._splineUpdate(this.modal_ctx);
          this.lastMpos.load(p);
      }
    }
     onPointCreate(spline, newv, lastv, lineWidth, strokeColor) {
      if (lastv) {
          let s=spline.make_segment(lastv, newv);
          s.mat.linewidth = lineWidth;
          for (let j=0; j<4; j++) {
              s.mat.strokecolor[j] = strokeColor[j];
          }
          if (s.v1===lastv) {
              s.w1 = lastv[2]||1.0;
              s.w2 = newv[2]||1.0;
          }
          else {
            s.w1 = newv[2]||1.0;
            s.w2 = lastv[2]||1.0;
          }
      }
      if (lastv&&lastv.segments.length===2) {
          let n1=new Vector2();
          let n2=new Vector2();
          let s1=lastv.segments[0];
          let s2=lastv.segments[1];
          let a=s1.other_vert(lastv);
          let b=lastv;
          let c=s2.other_vert(lastv);
          n1.load(a).sub(b);
          n2.load(c).sub(b);
          let bad=n1.dot(n1)<0.001||n2.dot(n2)<0.001;
          n1.normalize();
          n2.normalize();
          bad = bad||Math.acos(n1.dot(n2))<Math.PI*0.25;
          if (bad) {
              lastv.flag|=SplineFlags.BREAK_TANGENTS;
          }
      }
    }
     _splineUpdate(ctx) {
      let spline=ctx.frameset.spline;
      spline.regen_sort();
      spline.regen_solve();
      spline.regen_render();
      window.redraw_viewport();
    }
     on_pointerup(e) {
      this.finish(this.modal_ctx);
    }
     finish(ctx) {
      this.modalEnd(false);
    }
     cancel(ctx) {
      this.modalEnd(true);
    }
     exec(ctx) {
      let spline=ctx.frameset.spline;
      let lastv;
      let $_t1jppv=this.getInputs(), lineWidth=$_t1jppv.lineWidth, strokeColor=$_t1jppv.strokeColor;
      for (let p of this.inputs.points) {
          let newv=spline.make_vertex(p);
          this.onPointCreate(spline, newv, lastv, lineWidth, strokeColor);
          lastv = newv;
      }
      this._splineUpdate(ctx);
    }
     _exec(ctx) {
      return ;
      let spline=ctx.frameset.spline;
      let lastv=undefined;
      let arr=this.inputs.points.value;
      lastv = this._verts[this._start-1];
      let lastp=arr[this._start-1];
      lastp = lastp ? lastp.getValue() : undefined;
      let n1=new Vector2();
      let n2=new Vector2();
      let n3=new Vector2();
      let lwid=this.inputs.lineWidth.getValue();
      let color=this.inputs.strokeColor.getValue();
      for (let i=this._start; i<arr.length; i++) {
          let v=arr[i];
          v = v.getValue();
          let x=v[0], y=v[1], p=v[2];
          let v2=spline.make_vertex(v);
          if (lastv) {
              let s=spline.make_segment(lastv, v2);
              s.mat.linewidth = lwid;
              for (let j=0; j<4; j++) {
                  s.mat.strokecolor[j] = color[j];
              }
              if (s.v1===lastv) {
                  s.w1 = lastp[2]||1.0;
                  s.w2 = v[2]||1.0;
              }
              else {
                s.w1 = v[2]||1.0;
                s.w2 = lastp[2]||1.0;
              }
          }
          if (lastv&&lastv.segments.length===2) {
              let s1=lastv.segments[0];
              let s2=lastv.segments[1];
              let a=s1.other_vert(lastv);
              let b=lastv;
              let c=s2.other_vert(lastv);
              n1.load(a).sub(b);
              n2.load(c).sub(b);
              let bad=n1.dot(n1)<0.001||n2.dot(n2)<0.001;
              n1.normalize();
              n2.normalize();
              bad = bad||Math.acos(n1.dot(n2))<Math.PI*0.25;
              if (bad) {
                  lastv.flag|=SplineFlags.BREAK_TANGENTS;
              }
          }
          lastv = v2;
          lastp = v;
          this._verts.push(v2);
      }
      spline.regen_sort();
      spline.regen_render();
      spline.regen_solve();
      spline.checkSolve();
    }
     undoPre(ctx) {
      return this.undo_pre(ctx);
    }
     undo_pre(ctx) {
      this._start = 0;
      this._verts = [];
      let spline=ctx.frameset.spline;
      this._undo = {start_eid: spline.idgen.cur_id};
    }
     undo(ctx) {
      this._start = 0;
      this._verts = [];
      let spline=ctx.frameset.spline;
      let a=this._undo.start_eid;
      let b=spline.idgen.cur_id;
      for (let i=a; i<=b; i++) {
          let e=spline.eidmap[i];
          if (e!==undefined&&e.type===SplineTypes.VERTEX) {
              spline.kill_vertex(e);
          }
      }
      spline.idgen.cur_id = a;
      spline.regen_sort();
      spline.regen_render();
      spline.regen_solve();
      window.redraw_viewport();
    }
  }
  _ESClass.register(StrokeOp);
  _es6_module.add_class(StrokeOp);
  StrokeOp = _es6_module.add_export('StrokeOp', StrokeOp);
  class PenToolMode extends ToolMode {
    
    
    
    
     constructor() {
      super();
      this.keymap = undefined;
      this.mpos = new Vector2();
      this.last_mpos = new Vector2();
      this.start_mpos = new Vector2();
      this.mdown = false;
      this.limit = 75;
      this.stroke = [];
      this.smoothness = 1.0;
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
      container.prop("active_tool.limit");
      container.label("Yay");
    }
    static  buildHeader(container) {

    }
    static  defineAPI(api) {
      let st=super.defineAPI(api);
      let def=st.float("limit", "limit", "Limit", "Minimum distance between points");
      def.range(0, 300).noUnits();
      return st;
    }
    static  buildProperties(container) {

    }
     on_tick() {

    }
    static  toolDefine() {
      return {name: "pen", 
     uiName: "Pen", 
     flag: 0, 
     icon: Icons.PEN_TOOL, 
     nodeInputs: {}, 
     nodeOutputs: {}, 
     nodeFlag: 0}
    }
     defineKeyMap() {
      let k=this.keymap = new KeyMap("view2d:pentool");
      return k;
    }
     tools_menu(ctx, mpos, view2d) {
      let ops=[];
      var menu=view2d.toolop_menu(ctx, "Tools", ops);
      view2d.call_menu(menu, view2d, mpos);
    }
     getSpline() {
      return this.ctx.frameset.spline;
    }
     getMouse(event) {
      let view2d=this.ctx.view2d;
      let p=new Vector3([event.x, event.y, 0.0]);
      view2d.unproject(p);
      p = new Vector3(p);
      if (event.touches&&event.touches.length>0) {
          let f=event.touches[0];
          f = f.force||f.pressure||1.0;
          p[2] = f;
      }
      else {
        p[2] = 1.0;
      }
      return p;
    }
     addPoint(mpos) {
      let spline=this.getSpline();
      let v3=new Vec3Property();
      v3.setValue(mpos);
      if (this.tool===this.ctx.toolstack.head) {
      }
      else {
        this.ctx.toolstack.execTool(this.ctx, this.tool);
        this.tool = new StrokeOp();
        this.tool.inputs.limit.setValue(this.limit);
        this.tool.inputs.lineWidth.setValue(this.ctx.view2d.default_linewidth);
        this.tool.inputs.strokeColor.setValue(this.ctx.view2d.default_stroke);
        this.ctx.toolstack.execTool(this.ctx, this.tool);
      }
      this.tool._start = this.tool.inputs.points.value.length;
      this.tool.inputs.points.value.push(v3);
      this.tool.exec(this.ctx);
      this.stroke.push(mpos);
      window.redraw_viewport();
    }
     on_mousedown(event, localX, localY) {
      if (event.altKey||event.shiftKey||event.ctrlKey||event.commandKey) {
          return ;
      }
      event.stopPropagation();
      event.preventDefault();
      this.tool = new StrokeOp();
      this.tool.inputs.lineWidth.setValue(this.ctx.view2d.default_linewidth);
      this.tool.inputs.strokeColor.setValue(this.ctx.view2d.default_stroke);
      this.ctx.toolstack.execTool(this.ctx, this.tool);
    }
     ensure_paths_off() {
      if (g_app_state.active_splinepath!=="frameset.drawspline") {
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
     updateHighlight(x, y, was_touch) {

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
      return [];
    }
     delete_menu(event) {

    }
     dataLink(scene, getblock, getblock_us) {
      this.ctx = g_app_state.ctx;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(PenToolMode);
  _es6_module.add_class(PenToolMode);
  PenToolMode = _es6_module.add_export('PenToolMode', PenToolMode);
  PenToolMode.STRUCT = nstructjs.inherit(PenToolMode, ToolMode)+`
  limit : float;
}`;
  ToolMode.register(PenToolMode);
}, '/dev/fairmotion/src/editors/viewport/toolmodes/pentool.js');


es6_module_define('splinetool', ["../view2d_ops.js", "../spline_createops.js", "../selectmode.js", "../../../curve/spline_types.js", "../transform_ops.js", "../../../path.ux/scripts/util/util.js", "../../../core/keymap.js", "./toolmode.js", "../../../curve/spline_draw.js", "../../../path.ux/scripts/pathux.js", "../view2d_editor.js", "../../../core/toolops_api.js", "../../../path.ux/scripts/core/ui_base.js", "../spline_selectops.js", "../spline_editops.js", "../transform.js"], function _splinetool_module(_es6_module) {
  "use strict";
  var UIBase=es6_import_item(_es6_module, '../../../path.ux/scripts/core/ui_base.js', 'UIBase');
  var ExtrudeVertOp=es6_import_item(_es6_module, '../spline_createops.js', 'ExtrudeVertOp');
  var DeleteVertOp=es6_import_item(_es6_module, '../spline_editops.js', 'DeleteVertOp');
  var DeleteSegmentOp=es6_import_item(_es6_module, '../spline_editops.js', 'DeleteSegmentOp');
  var WidgetResizeOp=es6_import_item(_es6_module, '../transform_ops.js', 'WidgetResizeOp');
  var WidgetRotateOp=es6_import_item(_es6_module, '../transform_ops.js', 'WidgetRotateOp');
  var KeyMap=es6_import_item(_es6_module, '../../../core/keymap.js', 'KeyMap');
  var HotKey=es6_import_item(_es6_module, '../../../core/keymap.js', 'HotKey');
  var SelectLinkedOp=es6_import_item(_es6_module, '../spline_selectops.js', 'SelectLinkedOp');
  var SelectOneOp=es6_import_item(_es6_module, '../spline_selectops.js', 'SelectOneOp');
  var SelOpModes=es6_import_item(_es6_module, '../spline_selectops.js', 'SelOpModes');
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
  var util=es6_import(_es6_module, '../../../path.ux/scripts/util/util.js');
  var ToolMode=es6_import_item(_es6_module, './toolmode.js', 'ToolMode');
  var nstructjs=es6_import_item(_es6_module, '../../../path.ux/scripts/pathux.js', 'nstructjs');
  var WidgetResizeOp=es6_import_item(_es6_module, '../transform_ops.js', 'WidgetResizeOp');
  var WidgetRotateOp=es6_import_item(_es6_module, '../transform_ops.js', 'WidgetRotateOp');
  var ToolModes=es6_import_item(_es6_module, '../selectmode.js', 'ToolModes');
  var PanOp=es6_import_item(_es6_module, '../view2d_ops.js', 'PanOp');
  window.anim_to_playback = [];
  class SplineToolMode extends ToolMode {
    
    
    
    
    
     constructor() {
      super();
      this.keymap = undefined;
      this.mpos = new Vector2();
      this.last_mpos = new Vector2();
      this.start_mpos = new Vector2();
      this.mdown = false;
      this._undo_touches = new Map();
      this._first_touch_id = -1;
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
      let panel=container.panel("Tools");
      panel.toolPanel("spline.vertex_smooth()");
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
      let this2=this;
      function del_tool(ctx) {
        console.log("delete");
        if (this2.selectmode&SelMask.SEGMENT) {
            console.log("kill segments");
            let op=new DeleteSegmentOp();
            g_app_state.toolstack.execTool(ctx, op);
        }
        else 
          if (this2.selectmode&SelMask.FACE) {
            console.log("kill faces");
            let op=new DeleteFaceOp();
            g_app_state.toolstack.execTool(ctx, op);
        }
        else {
          console.log("kill verts");
          let op=new DeleteVertOp();
          g_app_state.toolstack.execTool(ctx, op);
        }
      }
      this.keymap = new KeyMap("view2d:spline", [new HotKey("PageUp", [], "spline.change_face_z(offset=1 selmode='selectmode')|Move Up"), new HotKey("PageDown", [], "spline.change_face_z(offset=-1 selmode='selectmode')|Move Down"), new HotKey("G", [], "spline.translate(datamode='selectmode')"), new HotKey("S", [], "spline.scale(datamode='selectmode')"), new HotKey("R", [], "spline.rotate(datamode='selectmode')"), new HotKey("S", ["SHIFT"], "spline.shift_time()"), new HotKey("A", [], "spline.toggle_select_all(mode='SELECT')|Select All"), new HotKey("A", ["ALT"], "spline.toggle_select_all(mode='DESELECT')|Select None"), new HotKey("H", [], "spline.hide(selmode='selectmode')|Hide Selection"), new HotKey("H", ["ALT"], "spline.unhide(selmode='selectmode')|Reveal Selection"), new HotKey("G", [], "spline.hide(selmode='selectmode' ghost=1)|Ghost Selection"), new HotKey("G", [], "spline.unhide(selmode='selectmode' ghost=1)|Unghost Selection"), new HotKey("L", [], "spline.select_linked_pick(mode='SELECT')|Select Linked"), new HotKey("L", [], "spline.select_linked_pick(mode='SELECT')|Select Linked"), new HotKey("L", ["SHIFT"], "spline.select_linked_pick(mode='DESELECT')|Deselect Linked"), new HotKey("B", [], "spline.toggle_break_tangents()|Toggle Break-Tangents"), new HotKey("B", ["SHIFT"], "spline.toggle_break_curvature()|Toggle Break-Curvature"), new HotKey("X", [], del_tool, "Delete"), new HotKey("Delete", [], del_tool, "Delete"), new HotKey("Backspace", [], del_tool, "Delete"), new HotKey("D", [], "spline.dissolve_verts()|Dissolve Vertices"), new HotKey("D", ["SHIFT"], "spline.duplicate_transform()|Duplicate"), new HotKey("F", [], "spline.make_edge_face()|Create Face/Edge"), new HotKey("E", [], "spline.split_edges()|Split Segments"), new HotKey("M", [], "spline.mirror_verts()|Mirror Verts"), new HotKey("C", [], "view2d.circle_select()|Circle Select"), new HotKey("Z", [], function (ctx) {
        console.warn("ZKEY", arguments, this);
        ctx.view2d.only_render^=1;
        window.redraw_viewport();
      }, "Toggle Only Render"), new HotKey("W", [], function (ctx) {
        let mpos=ctx.keymap_mpos;
        mpos = ctx.screen.mpos;
        ctx.view2d.tools_menu(ctx, mpos);
      }, "Tools Menu")]);
      return ;
      let k=this.keymap = new KeyMap("view2d:splinetool");
    }
     tools_menu(ctx, mpos, view2d) {
      let ops=["spline.flip_segments()", "spline.key_edges()", "spline.key_current_frame()", "spline.connect_handles()", "spline.disconnect_handles()", "spline.toggle_step_mode()", "spline.toggle_manual_handles()", "editor.paste_pose()", "editor.copy_pose()"];
      let menu=view2d.toolop_menu(ctx, "Tools", ops);
      view2d.call_menu(menu, view2d, mpos);
    }
     _get_spline() {
      return this.ctx.spline;
    }
     on_mousedown(event) {
      if (this._do_touch_undo(event)) {
          return true;
      }
      let spline=this.ctx.spline;
      let toolmode=this.ctx.view2d.toolmode;
      this.start_mpos[0] = event.x;
      this.start_mpos[1] = event.y;
      this.updateHighlight(event.x, event.y, event.pointerType!=="mouse");
      if (this.highlight_spline!==undefined&&this.highlight_spline!==spline) {
          this._clear_undo_touch(false);
          console.log("spline switch!");
          let newpath;
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
          return true;
      }
      let ret=false;
      if (event.button===0) {
          let can_append=toolmode===ToolModes.APPEND;
          can_append = can_append&&(this.selectmode&(SelMask.VERTEX|SelMask.HANDLE));
          can_append = can_append&&spline.verts.highlight===undefined&&spline.handles.highlight===undefined;
          if (can_append) {
              let co=new Vector3([event.x, event.y, 0]);
              this.view2d.unproject(co);
              console.log(co);
              let op=new ExtrudeVertOp(co, this.ctx.view2d.extrude_mode);
              op.inputs.location.setValue(co);
              op.inputs.linewidth.setValue(this.ctx.view2d.default_linewidth);
              op.inputs.stroke.setValue(this.ctx.view2d.default_stroke);
              this._clear_undo_touch(true);
              g_app_state.toolstack.execTool(this.ctx, op);
              redraw_viewport();
              ret = true;
          }
          else {
            this._clear_undo_touch(false);
            for (let i=0; i<spline.elists.length; i++) {
                let list=spline.elists[i];
                if (!(this.selectmode&list.type))
                  continue;
                
                if (list.highlight===undefined)
                  continue;
                let op=new SelectOneOp(list.highlight, !event.shiftKey, !(list.highlight.flag&SplineFlags.SELECT), this.selectmode, true);
                g_app_state.toolstack.execTool(this.ctx, op);
                ret = true;
                break;
            }
          }
          this.start_mpos[0] = event.x;
          this.start_mpos[1] = event.y;
          this.mdown = true;
      }
      return ret;
    }
     ensure_paths_off() {
      if (g_app_state.active_splinepath!="frameset.drawspline") {
          this.highlight_spline = undefined;
          let spline=this.ctx.spline;
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
      let frameset=this.ctx.frameset;
      let editor=this.ctx.view2d;
      let closest=[0, 0, 0];
      let mindis=1e+17;
      let found=false;
      console.warn("findnearest");
      if (!this.draw_anim_paths) {
          this.ensure_paths_off();
          let ret=this.ctx.spline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, ignore_layers);
          if (ret!=undefined) {
              return [this.ctx.spline, ret[0], ret[1]];
          }
          else {
            return undefined;
          }
      }
      let actspline=this.ctx.spline;
      let pathspline=this.ctx.frameset.pathspline;
      let drawspline=this.ctx.frameset.spline;
      let ret=drawspline.q.zrest(editor, [mpos[0], mpos[1]], selectmask, limit, ignore_layers);
      if (ret!==undefined&&ret[1]<limit) {
          mindis = ret[1]-(drawspline===actspline ? 3 : 0);
          found = true;
          closest[0] = drawspline;
          closest[1] = ret[0];
          closest[2] = mindis;
      }
      ret = frameset.pathspline.q.findnearest(editor, [mpos[0], mpos[1]], selectmask, limit, false);
      if (ret!==undefined) {
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
     updateHighlight(x, y, was_touch) {
      if (this.ctx.state.modalstate===ModalStates.TRANSFORMING) {
          return ;
      }
      let toolmode=this.ctx.view2d.toolmode;
      let limit;
      if (this.ctx.view2d.selectmode&SelMask.SEGMENT) {
          limit = 55;
      }
      else {
        limit = (util.isMobile()||was_touch) ? 25 : 15;
      }
      limit*=UIBase.getDPI();
      if (toolmode===ToolModes.SELECT)
        limit*=3;
      let ret=this.findnearest([x, y], this.ctx.view2d.selectmode, limit, this.ctx.view2d.edit_all_layers);
      let redraw=false;
      if (ret!==undefined) {
          if (ret[0]!==this.highlight_spline&&this.highlight_spline!==undefined) {
              this.highlight_spline.clear_highlight();
              redraw = true;
          }
          this.highlight_spline = ret[0];
          this.highlight_spline.clear_highlight();
      }
      else {
        if (this.highlight_spline!==undefined) {
            this.highlight_spline.clear_highlight();
            redraw = true;
        }
        this.highlight_spline = undefined;
      }
      if (this.highlight_spline&&ret&&ret[1]) {
          let list=this.highlight_spline.get_elist(ret[1].type);
          redraw|=list.highlight!==ret[1];
          list.highlight = ret[1];
      }
      if (redraw) {
          window.redraw_viewport();
      }
    }
     _do_touch_undo(event) {
      if (event.pointerType==="touch") {
          if (!this._undo_touches.has(event.pointerId)) {
              this._undo_touches.set(event.pointerId, {});
          }
          if (this._undo_touches.size===1) {
              this._first_touch_id = event.pointerId;
          }
      }
      if (this._undo_touches.size>1&&this._cancel_on_touch) {
          console.log("touch undo!");
          this.ctx.toolstack.undo();
          this._clear_undo_touch(false);
          this.ctx.toolstack.execTool(this.ctx, new PanOp());
          window.redraw_viewport();
          return true;
      }
    }
     on_mousemove(event) {
      if (this.ctx===undefined)
        return ;
      this.mpos[0] = event.x, this.mpos[1] = event.y, this.mpos[2] = 0.0;
      let selectmode=this.selectmode;
      if (this._do_touch_undo(event)) {
          return ;
      }
      this.updateHighlight(event.x, event.y, !!event.touches);
      let translate=(this.mdown&&this.start_mpos.vectorDistance(this.mpos)>15/UIBase.getDPI());
      if (translate) {
          this.mdown = false;
          let mpos=new Vector2();
          mpos.load(this.start_mpos);
          let op=new TranslateOp(mpos);
          console.log("start_mpos:", mpos);
          op.inputs.datamode.setValue(this.ctx.view2d.selectmode);
          op.inputs.edit_all_layers.setValue(this.ctx.view2d.edit_all_layers);
          let ctx=new Context();
          if (ctx.view2d.session_flag&SessionFlags.PROP_TRANSFORM) {
              op.inputs.proportional.setValue(true);
              op.inputs.propradius.setValue(ctx.view2d.propradius);
          }
          let _cancel_on_touch=this._cancel_on_touch;
          this._cancel_on_touch = false;
          op.touchCancelable(() =>            {
            console.log("touch-induced cancel!");
            this.ctx.toolstack.execTool(this.ctx, new PanOp());
            if (_cancel_on_touch) {
                this.ctx.toolstack.undo();
            }
          });
          g_app_state.toolstack.execTool(this.ctx, op);
      }
    }
     _clear_undo_touch(cancel=false) {
      this._undo_touches = new Map();
      this._cancel_on_touch = cancel;
    }
     on_mouseup(event) {
      this._clear_undo_touch(false);
      this.start_mpos[0] = event.x;
      this.start_mpos[1] = event.y;
      this.mdown = true;
      let spline=this._get_spline();
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
      return ["spline.toggle_manual_handles()", "spline.split_edges()", "spline.delete_faces()", "spline.delete_segments()", "spline.delete_verts()", "spline.dissolve_verts()", "spline.make_edge_face()", "spline.split_edges()", "spline.mirror_verts()", "spline.duplicate_transform()", "spline.disconnect_handles()", "spline.connect_handles()", "spline.unhide()", "spline.hide()", "spline.toggle_select_all(mode='SELECT')|Select All", "spline.toggle_select_all(mode='DESELECT')|Deselect All", "view2d.circle_select()", "spline.select_linked(vertex_eid='active_vertex' mode='SELECT')|Select Linked::L", "spline.select_linked(vertex_eid='active_vertex' mode='DESELECT')|Deselect Linked::Shift+L"];
    }
     delete_menu(event) {
      let view2d=this.view2d;
      let ctx=new Context();
      let menu=this.gen_delete_menu(true);
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


es6_module_define('toolmode', ["../../../core/keymap.js", "../../../core/eventdag.js", "../../../path.ux/scripts/pathux.js"], function _toolmode_module(_es6_module) {
  var NodeBase=es6_import_item(_es6_module, '../../../core/eventdag.js', 'NodeBase');
  var KeyMap=es6_import_item(_es6_module, '../../../core/keymap.js', 'KeyMap');
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
      this.keymap = new KeyMap("view2d:"+this.constructor.name);
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
    static  defineAPI(api) {
      let st=api.mapStruct(this, true);
      st.string("name", "constructor.name", "Name", "Name");
      return st;
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
  function initToolModeAPI(api) {
    for (let tool of ToolModes) {
        tool.defineAPI(api);
    }
  }
  initToolModeAPI = _es6_module.add_export('initToolModeAPI', initToolModeAPI);
}, '/dev/fairmotion/src/editors/viewport/toolmodes/toolmode.js');


es6_module_define('struct', ["../path.ux/scripts/pathux.js", "./toolops_api.js", "../util/parseutil.js"], function _struct_module(_es6_module) {
  var nstructjs=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'nstructjs');
  var PUTL=es6_import(_es6_module, '../util/parseutil.js');
  var Matrix4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Matrix4');
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Quat');
  var ToolOp=es6_import_item(_es6_module, './toolops_api.js', 'ToolOp');
  let STRUCT=nstructjs.STRUCT;
  STRUCT = _es6_module.add_export('STRUCT', STRUCT);
  function profile_reset() {
  }
  profile_reset = _es6_module.add_export('profile_reset', profile_reset);
  function profile_report() {
  }
  profile_report = _es6_module.add_export('profile_report', profile_report);
  window.STRUCT_ENDIAN = false;
  console.log(nstructjs);
  nstructjs.setEndian(false);
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
  _data : array(byte) | this ? this : [];
}`;
  nstructjs.register(arraybufferCompat);
  nstructjs.setWarningMode(0);
  nstructjs.setDebugMode(false);
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
    let isToolOp=(cls) =>      {
      if (cls===ToolOp) {
          return true;
      }
      if (cls.__proto__!==Object&&cls.__proto__!==Object.__proto__) {
          return isToolOp(cls.__proto__);
      }
      return false;
    }
    for (var cls of defined_classes) {
        if (cls.name=="Matrix4UI"||cls.name=="Matrix4"||cls.name=="Vector3"||cls.name=="Vector4"||cls.name=="Vector2") {
            continue;
        }
        if (cls.STRUCT) {
            cls.STRUCT = patch_dataref_type(cls.STRUCT);
        }
        try {
          if (cls.STRUCT!==undefined&&!istruct.isRegistered(cls)&&!isToolOp(cls)) {
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
        if (i===errs.length-1)
          throw err;
    }
    nstructjs.validateStructs();
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
  let clothoid_dv_rets=cachering.fromConstructor(Vector2, 16);
  let clothoid_no_rets=cachering.fromConstructor(Vector2, 16);
  class ClothoidInterface  {
    static  evaluate(p1, p2, t1, t2, k1, k2, s, cdata) {

    }
    static  derivative(p1, p2, t1, t2, k1, k2, s, cdata) {
      let df=0.0001;
      let a=this.evaluate(p1, p2, t1, t2, k1, k2, s, cdata);
      let b=this.evaluate(p1, p2, t1, t2, k1, k2, s+df, cdata);
      b.sub(a).mulScalar(1.0/df);
      return clothoid_dv_rets.next().load(b);
    }
    static  normal(p1, p2, t1, t2, k1, k2, s, cdata) {
      let df=0.0001;
      let a=this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
      let b=this.derivative(p1, p2, t1, t2, k1, k2, s+df, cdata);
      b.sub(a).mulScalar(1.0/df);
      return clothoid_no_rets.next().load(b);
    }
    static  curvature(p1, p2, t1, t2, k1, k2, s, cdata) {
      let dv1=this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
      let dv2=this.normal(p1, p2, t1, t2, k1, k2, s, cdata);
      return (dv1[0]*dv2[1]-dv2[1]*dv1[0])/Math.pow(dv1.dot(dv1), 3.0/2.0);
    }
    static  curvature_dv(p1, p2, t1, t2, k1, k2, s, cdata) {
      let df=0.0001;
      let a=this.curvature(p1, p2, t1, t2, k1, k2, s, cdata);
      let b=this.curvature(p1, p2, t1, t2, k1, k2, s+df, cdata);
      return (b-a)/df;
    }
    static  curvature_dv2(p1, p2, t1, t2, k1, k2, s, cdata) {
      let df=0.0001;
      let a=this.curvature_dv(p1, p2, t1, t2, k1, k2, s, cdata);
      let b=this.curvature_dv(p1, p2, t1, t2, k1, k2, s+df, cdata);
      return (b-a)/df;
    }
    static  closest_point(p1, p2, t1, t2, k1, k2, p, cdata) {

    }
    static  update(p1, p2, t1, t2, k1, k2, s, cdata) {

    }
  }
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
  var $rets_ZFk2_derivative;
  var $rets_eqla_normal;
  class CurveInterface  {
    static  evaluate(p1, p2, t1, t2, k1, k2, s, cdata) {

    }
    static  derivative(p1, p2, t1, t2, k1, k2, s, cdata) {
      var df=0.0001;
      var a=this.evaluate(p1, p2, t1, t2, k1, k2, s, cdata);
      var b=this.evaluate(p1, p2, t1, t2, k1, k2, s+df, cdata);
      b.sub(a).mulScalar(1.0/df);
      return $rets_ZFk2_derivative.next().load(b);
    }
    static  normal(p1, p2, t1, t2, k1, k2, s, cdata) {
      var df=0.0001;
      var a=this.derivative(p1, p2, t1, t2, k1, k2, s, cdata);
      var b=this.derivative(p1, p2, t1, t2, k1, k2, s+df, cdata);
      b.sub(a).mulScalar(1.0/df);
      return $rets_eqla_normal.next().load(b);
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
  var $rets_ZFk2_derivative=cachering.fromConstructor(Vector2, 16);
  var $rets_eqla_normal=cachering.fromConstructor(Vector2, 16);
  _ESClass.register(CurveInterface);
  _es6_module.add_class(CurveInterface);
}, '/dev/fairmotion/src/curve/curvebase.js');


es6_module_define('bspline', [], function _bspline_module(_es6_module) {
  let _bspline=undefined;
  let _i=0;
  let IW=_i++;
  let IDV1=_i++;
  let IDV2=_i++;
  let IDV3=_i++;
  let IDV4=_i++;
  let ITOT=_i;
  function Table(size, start, end, ds) {
    this.start = start;
    this.end = end;
    this.ds = ds;
    this.size = size;
    this.t = new Float64Array(size*ITOT);
    this.w = new Array(size);
    this.dv = new Array(size);
    this.dv2 = new Array(size);
    this.dv3 = new Array(size);
    this.dv4 = new Array(size);
    this.start = start;
    this.end = end;
    this.ds = ds;
    this.ds2 = ds*ds;
    this.ds3 = ds*ds*ds;
    this.ds4 = ds*ds*ds*ds;
    this.ds5 = ds*ds*ds*ds*ds;
    this.ds6 = ds*ds*ds*ds*ds*ds;
    this.ds7 = ds*ds*ds*ds*ds*ds*ds;
    this.ds8 = ds*ds*ds*ds*ds*ds*ds*ds;
    this.ds9 = ds*ds*ds*ds*ds*ds*ds*ds*ds;
  }
  Table = _es6_module.add_export('Table', Table);
  let cache={}
  window.NO_CACHE = false;
  let uniform_vec=new Array(1024);
  for (let i=0; i<uniform_vec.length; i++) {
      uniform_vec[i] = i;
  }
  class BasisCache  {
     constructor(knots) {
      this.size = undefined;
      this.recalc = 1;
      this.tables = [];
      this.dpad = 1;
      if (knots!==undefined) {
          this.gen(knots);
      }
    }
     gen(ks, degree) {
      if (NO_CACHE) {
          this.recalc = 1;
          return ;
      }
      this.tables = [];
      let start_time=time_ms();
      console.log("start generating tables");
      let sz=14;
      if (degree<3)
        sz = 128;
      else 
        if (degree<4)
        sz = 40;
      this.size = sz;
      this.degree = degree;
      let dpad=this.dpad;
      for (let i=-degree-dpad; i<ks.length+degree+dpad; i++) {
          let j1=Math.max(0, i-degree-dpad);
          let j2=Math.min(ks.length-1, i+degree+dpad);
          if (i===-degree-dpad)
            j1 = 0;
          let tstart=ks[j1];
          let tend=ks[j2];
          let ds=(tend-tstart)/(this.size-1.0);
          let table=new Table(this.size, tstart, tend, ds);
          this.tables.push(table);
      }
      this.recalc = 0;
      if (ks.length===0)
        return ;
      let start=ks[0], end=ks[ks.length-1];
      let s=start, steps=this.size, ds=(end-start)/(steps-1.0);
      this.start = start;
      this.end = end;
      let df=1e-05;
      let lastk=ks[ks.length-1];
      dpad = this.dpad;
      for (let j=-degree-dpad; j<ks.length+degree+dpad; j++) {
          let j1=Math.min(Math.max(j+degree+dpad, 0), this.tables.length-1);
          let table=this.tables[j1];
          start = table.start, end = table.end, ds = table.ds;
          let ac=0.0;
          for (let i=0, s2=start; i<steps; i++, s2+=ds) {
              let s=s2;
              s = min(lastk-1e-08, s);
              let table=this.tables[j+degree+dpad];
              let dv, dv2, dv3, dv4;
              dv = dv2 = dv3 = dv4 = 0.0;
              let w=table.w[i] = basis(s, j, degree, ks);
              table.t[ac++] = w;
              let s2=s;
              dv = basis_dv(s2, j, degree, ks, 1);
              table.t[ac++] = dv;
              if (this.degree>2) {
                  dv2 = basis_dv(s, j, degree, ks, 2);
                  table.t[ac++] = dv2;
              }
              else {
                ac++;
              }
              if (this.degree>3) {
                  dv3 = basis_dv(s, j, degree, ks, 3);
                  table.t[ac++] = dv3;
              }
              else {
                ac++;
              }
              if (this.degree>4) {
                  dv4 = basis_dv(s, j, degree, ks, 4);
                  table.t[ac++] = dv4;
              }
              else {
                ac++;
              }
              table.dv[i] = dv;
              table.dv2[i] = dv2;
              table.dv3[i] = dv3;
              table.dv4[i] = dv4;
          }
      }
    }
     update() {
      this.recalc = 1;
    }
     basis(s, j, n, ks, no_cache) {
      let origs=s;
      if (NO_CACHE||(no_cache!==undefined&&no_cache)) {
          return basis(s, j, n, ks, true);
      }
      if (this.recalc) {
          this.gen(ks, n);
      }
      j = min(max(j+n+this.dpad, 0), this.tables.length-1);
      let table=this.tables[j];
      let start=table.start, end=table.end, ds=table.ds;
      if (s<start||s>=end)
        return 0.0;
      let div=(end-start);
      let tsize=this.size;
      s = (s-start)/div;
      s = min(max(s, 0.0), 1.0)*(tsize-1.0);
      let t=s;
      s = floor(s);
      s = min(max(s, 0.0), tsize-1);
      t-=s;
      let s2=min(s+1, tsize);
      let ac1=s*ITOT;
      let ac2=s2*ITOT;
      let tb=table.t;
      let w1=table.w[s], dv1a=table.dv[s], dv2a=table.dv2[s], dv3a=table.dv3[s], dv4a=table.dv4[s];
      let w2=table.w[s2], dv1b=table.dv[s2], dv2b=table.dv2[s2], dv3b=table.dv3[s2], dv4b=table.dv4[s2];
      let t2=1.0-t;
      let t3=t;
      t*=ds;
      t2*=-ds;
      let eps=1e-06;
      t3 = (t3*(1.0-eps*2.0))+eps;
      s = t3*ds;
      s2 = s*s, s3 = s*s*s, s4 = s2*s2, s5 = s4*s, s6 = s3*s3, s7 = s6*s, s8 = s7*s;
      let ds2=ds*ds, ds3=ds*ds*ds, ds4=ds3*ds, ds5=ds4*ds, ds6=ds5*ds, ds7=ds6*ds, ds8=ds7*ds;
      let polynomial=((((dv3a*s3+6*w1+3*dv2a*s2+6*dv1a*s)*ds5+3*(2*ds3*dv3a+ds3*dv3b+20*ds2*dv2a-14*ds2*dv2b+90*ds*dv1a+78*ds*dv1b+168*w1-168*w2)*s5)*ds-(4*ds3*dv3a+3*ds3*dv3b+45*ds2*dv2a-39*ds2*dv2b+216*ds*dv1a+204*ds*dv1b+420*w1-420*w2)*s6)*ds+((dv3a+dv3b)*ds3+120*(w1-w2)+12*(dv2a-dv2b)*ds2+60*(dv1a+dv1b)*ds)*s7-((4*dv3a+dv3b)*ds3+210*(w1-w2)+15*(2*dv2a-dv2b)*ds2+30*(4*dv1a+3*dv1b)*ds)*ds3*s4)/(6*ds7);
      if (isNaN(polynomial)) {
          return 0;
      }
      return polynomial;
    }
  }
  _ESClass.register(BasisCache);
  _es6_module.add_class(BasisCache);
  BasisCache = _es6_module.add_export('BasisCache', BasisCache);
  let basis_dv_cache=new cachering(function () {
    let ret=new Array(32);
    for (let i=0; i<ret.length; i++) {
        ret[i] = 0.0;
    }
    ret.j = undefined;
    ret.n = undefined;
    ret.init = function (j, n) {
      this.j = j;
      this.n = n;
      for (let i=0; i<this.length; i++) {
          this[i] = 0;
      }
    }
    return ret;
  }, 64);
  function basis_dv(s, j, n, ks, dvn) {
    if (dvn===undefined)
      dvn = 1;
    return compiled_basis_dv(s, j, n, ks, dvn);
    if (dvn===0) {
        return basis(s, j, n, ks);
    }
    let klen=ks.length;
    let j1=j, j2=j+1, jn=j+n, jn1=j+n+1;
    j1 = min(max(j1, 0.0), klen-1);
    j2 = min(max(j2, 0.0), klen-1);
    jn = min(max(jn, 0.0), klen-1);
    jn1 = min(max(jn1, 0.0), klen-1);
    if (n<1) {
        return 0;
    }
    else 
      if (0&&n<=1) {
        let j3=min(max(j+2, 0.0), klen-1);
        let j4=min(max(j+3, 0.0), klen-1);
        let ret=0.0;
        if (s>=ks[j1]&&s<ks[j2])
          ret = 1.0/(ks[j2]-ks[j1]);
        else 
          if (s>=ks[j2]&&s<ks[j3])
          ret = -1.0/(ks[j3]-ks[j2]);
        return ret;
    }
    else {
      let kj1=ks[j1];
      let kj2=ks[j2];
      let kjn=ks[jn]+1e-10;
      let kjn1=ks[jn1]+1e-10;
      let div=((kj1-kjn)*(kj2-kjn1));
      if (div===0.0) {
          div = 0.0;
      }
      let lastdv=basis_dv(s, j, n-1, ks, dvn-1);
      let ret=((kj1-s)*basis_dv(s, j, n-1, ks, dvn)-dvn*basis_dv(s, j, n-1, ks, dvn-1))*(kj2-kjn1);
      ret-=((kjn1-s)*basis_dv(s, j+1, n-1, ks, dvn)-dvn*basis_dv(s, j+1, n-1, ks, dvn-1))*(kj1-kjn);
      if (div!==0.0)
        ret/=div;
      else 
        ret/=0.0001;
      return ret;
    }
  }
  basis_dv = _es6_module.add_export('basis_dv', basis_dv);
  let min=Math.min, max=Math.max;
  let dtmp=new Array(64);
  let ktmp=new Array(64);
  function deBoor(k, x, knots, controls, degree) {
    let p=degree;
    let t=knots;
    let c=controls;
    let d=dtmp;
    for (let j=0; j<p+1; j++) {
        let j2=Math.min(Math.max(j+k-p, 0), knots.length-1);
        d[j] = c[j2];
    }
    for (let r=1; r<p+1; r++) {
        for (let j=p; j>r-1; j--) {
            let alpha=(x-t[j+k-p])/(t[j+1+k-r]-t[j+k-p]);
            d[j] = (1.0-alpha)*d[j-1]+alpha*d[j];
        }
    }
    return d[p];
  }
  deBoor = _es6_module.add_export('deBoor', deBoor);
  function basis(s, j, n, ks, no_cache) {
    if (no_cache===undefined) {
        no_cache = false;
    }
    return compiled_basis(s, j, n, ks);
    let klen=ks.length;
    let j1=j, j2=j+1, jn=j+n, jn1=j+n+1;
    j1 = min(max(j1, 0.0), klen-1);
    j2 = min(max(j2, 0.0), klen-1);
    jn = min(max(jn, 0.0), klen-1);
    jn1 = min(max(jn1, 0.0), klen-1);
    if (n===0) {
        return s>=ks[j1]&&s<ks[j2];
    }
    else {
      let A=s-ks[j1];
      let div=ks[jn]-ks[j1];
      div+=1e-05;
      A = (A/div)*basis(s, j, n-1, ks);
      let B=ks[jn1]-s;
      div = ks[jn1]-ks[j2];
      div+=1e-05;
      B = (B/div)*basis(s, j+1, n-1, ks);
      return A+B;
    }
  }
  basis = _es6_module.add_export('basis', basis);
  function uniform_basis_intern(s, j, n) {
    let ret=basis(s, j, n, uniform_vec);
    if (n===0) {
        return (s>=j&&s<j+1) ? 1.0 : 0.0;
    }
    else {
      let A=(s-j)/n;
      let B=(n+j+1-s)/n;
      return uniform_basis(s, j, n-1)*A+uniform_basis(s, j+1, n-1)*B;
    }
  }
  uniform_basis_intern = _es6_module.add_export('uniform_basis_intern', uniform_basis_intern);
  function get_hash(h) {
    return cache[h];
  }
  function set_hash(h, val) {
    cache[h] = val;
  }
  function uniform_basis(s, j, n, len) {
    uniform_vec.length = len===undefined ? 1024 : len;
    return basis(s, j, n, uniform_vec);
    let hash=s+j*100.0+n*10000.0;
    let ret=get_hash(hash);
    if (ret===undefined) {
        ret = uniform_basis_intern(s, j, n);
        set_hash(hash, ret);
    }
    return ret;
  }
  uniform_basis = _es6_module.add_export('uniform_basis', uniform_basis);
  let toHash2_stack=new Array(4096);
  let toHash2_stack_2=new Float64Array(4096);
  let toHash2_stack_3=new Float64Array(4096);
  let _str_prejit=new Array(4096);
  let strpre=8;
  let RNDLEN=1024;
  let rndtab=new Float64Array(RNDLEN);
  for (let i=0; i<rndtab.length; i++) {
      rndtab[i] = Math.random()*0.99999999;
  }
  function precheck(key) {
    let s1="";
    let seed=key.length%RNDLEN;
    seed = floor(rndtab[seed]*RNDLEN);
    let klen=key.length;
    for (let i=0; i<strpre; i++) {
        s1+=key[floor(rndtab[seed]*klen)];
        seed = (seed+1)%RNDLEN;
    }
    return s1;
  }
  let _vbuf=new Uint8Array(8);
  let _view=new DataView(_vbuf.buffer);
  let _fview=new Float32Array(_vbuf.buffer);
  let _iview=new Int32Array(_vbuf.buffer);
  let _sview=new Int16Array(_vbuf.buffer);
  function pack_float(f) {
    let s="";
    _fview[0] = f;
    for (let i=0; i<4; i++) {
        s+=String.fromCharCode(_vbuf[i]);
    }
    return s;
  }
  function pack_int(f) {
    let s="";
    _iview[0] = f;
    for (let i=0; i<4; i++) {
        s+=String.fromCharCode(_vbuf[i]);
    }
    return s;
  }
  function pack_short(f) {
    let s="";
    _sview[0] = f;
    for (let i=0; i<2; i++) {
        s+=String.fromCharCode(_vbuf[i]);
    }
    return s;
  }
  function pack_byte(f) {
    return String.fromCharCode(f);
  }
  let tiny_strpool={}
  let tiny_strpool_idgen=1;
  function pack_str(f) {
    let ret="";
    if (!(f in tiny_strpool)) {
        tiny_strpool[f] = tiny_strpool_idgen++;
    }
    return pack_short(tiny_strpool[f]);
  }
  let tiny_strpool2={}
  let tiny_strpool_idgen2=1;
  function pack_op(f) {
    let ret="";
    if (!(f in tiny_strpool2)) {
        tiny_strpool2[f] = tiny_strpool_idgen2++;
    }
    return pack_byte(tiny_strpool2[f]);
  }
  window.pack_float = pack_float;
  window.precheck = precheck;
  let _str_prehash={}
  let _str_idhash=window._str_idhash = {}
  let _str_idhash_rev=window._str_idhash_rev = {}
  let _str_idgen=0;
  function spool(hash) {
    if (hash in _str_idhash) {
        return _str_idhash[hash];
    }
    else {
      let ret=_str_idgen++;
      _str_idhash[hash] = ret;
      _str_idhash_rev[ret] = hash;
      return ret;
    }
  }
  function spool_len(id) {
    return _str_idhash_rev[id].length;
  }
  window.tot_symcls = 0.0;
  let KILL_ZEROS=true;
  class symcls  {
     constructor(name_or_value, op) {
      this._id = tot_symcls++;
      this._last_h = undefined;
      this.value = undefined;
      this.name = "";
      this.a = this.b = undefined;
      this.use_parens = false;
      this.op = undefined;
      this.parent = undefined;
      this._toString = undefined;
      this.is_func = false;
      this._hash = this._toString = undefined;
      this.key = this.tag = undefined;
      this._done = this._visit = false;
      this.id = undefined;
      this.ins = this.ins_ids = undefined;
      this.is_tag = this.is_root = undefined;
      if (typeof name_or_value==="number"||typeof name_or_value==="boolean") {
          this.value = name_or_value;
      }
      else 
        if (typeof name_or_value==="string"||__instance_of(name_or_value, String)) {
          this.name = name_or_value;
      }
    }
     binop(b, op) {
      if (typeof b==="string"||typeof b==="number"||typeof b==="boolean") {
          b = new symcls(b);
      }
      let ret=new symcls();
      let a=this;
      if (a.value!==undefined&&b.value!==undefined&&a.a===undefined&&b.a===undefined) {
          ret.value = eval(a.value+" "+op+" "+b.value);
          return ret;
      }
      ret.use_parens = true;
      ret.op = op;
      if (KILL_ZEROS&&a.value!==undefined&&a.value===0.0&&(op==="*"||op==="/")) {
          return sym(0);
      }
      else 
        if (KILL_ZEROS&&b.value!==undefined&&b.value===0.0&&(op==="*")) {
          return sym(0);
      }
      else 
        if (KILL_ZEROS&&this.a===undefined&&this.value===0.0&&op==="+") {
          return b.copy();
      }
      else 
        if (KILL_ZEROS&&b.a===undefined&&b.value===0.0&&(op==="+"||op==="-")) {
          return this.copy();
      }
      else 
        if (this.value===1.0&&op==="*"&&this.a===undefined) {
          return b.copy();
      }
      else 
        if (b.value===1.0&&(op==="*"||op==="/")&&b.a===undefined) {
          return this.copy();
      }
      if (this.b!==undefined&&this.b.value!==undefined&&b.value!==undefined&&op==="+") {
          ret = this.copy();
          ret.b.value = this.b.value+b.value;
          return ret;
      }
      ret.a = a.copy();
      ret.b = b.copy();
      ret.a.parent = ret;
      ret.b.parent = ret;
      return ret;
    }
     hash() {
      if (this._hash===undefined) {
          this._hash = spool(this.toHash());
      }
      return this._hash;
    }
     index(arg1) {
      if (typeof arg1==="string"||__instance_of(arg1, String)||typeof arg1==="number"||typeof arg1==="boolean") {
          arg1 = sym(arg1);
      }
      else {
        arg1 = arg1.copy();
      }
      let ret=sym();
      ret.op = "i";
      ret.a = this.copy();
      ret.b = arg1;
      return ret;
    }
     func(fname, arg1) {
      if (typeof fname==="string"||__instance_of(fname, String)) {
          fname = sym(fname);
      }
      let ret=sym();
      if (arg1===undefined) {
          ret.a = fname.copy();
          ret.b = this.copy();
          ret.op = "c";
      }
      else {
        if (typeof arg1==="string"||__instance_of(arg1, String)||typeof arg1==="number"||typeof arg1==="boolean") {
            arg1 = sym(arg1);
        }
        ret.a = this.copy();
        ret.b = arg1.copy();
        ret.op = fname;
      }
      ret.is_func = true;
      return ret;
    }
     copy(copy_strcache) {
      let ret=new symcls();
      ret.name = this.name;
      ret.value = this.value;
      ret.use_parens = this.use_parens;
      ret.op = this.op;
      ret.is_func = this.is_func;
      if (copy_strcache) {
          ret._toString = this._toString;
          ret._hash = this._hash;
      }
      else {
        ret._hash = ret._toString = undefined;
      }
      if (this.a!==undefined) {
          ret.a = this.a.copy(copy_strcache);
          ret.b = this.b.copy(copy_strcache);
          ret.a.parent = ret;
          ret.b.parent = ret;
      }
      return ret;
    }
     negate() {
      return this.binop(-1.0, "*");
    }
     add(b) {
      return this.binop(b, "+");
    }
     sub(b) {
      return this.binop(b, "-");
    }
     mul(b) {
      return this.binop(b, "*");
    }
     div(b) {
      return this.binop(b, "/");
    }
     pow(b) {
      return this.binop(b, "p");
    }
     clear_toString() {
      this._toString = undefined;
      this._hash = undefined;
      this._last_h = undefined;
      if (this.a!==undefined) {
      }
    }
     toHash2() {
      let stack=toHash2_stack, stack2=toHash2_stack_2, top=0;
      let stack3=toHash2_stack_3;
      stack[top] = this;
      stack2[top] = 0;
      stack3[top] = 0;
      let ret="";
      let _i=0;
      while (top>=0) {
        if (_i>100000) {
            console.log("infinite loop!");
            break;
        }
        let item=stack[top];
        let stage=stack2[top];
        let start=stack3[top];
        top--;
        if (stage===0) {
            ret+=item.name+"|";
            ret+=(item.value!==undefined ? item.value : "")+"|";
            ret+=item.is_func+"|";
        }
        if (item.a!==undefined&&stage===0) {
            ret+=item.op+"$";
            top++;
            stack[top] = item;
            stack2[top] = 1;
            stack3[top] = start;
            top++;
            stack[top] = item.a;
            stack2[top] = 0;
            stack3[top] = ret.length;
        }
        else 
          if (item.b!==undefined&&stage===1) {
            ret+="$";
            top++;
            stack[top] = item.b;
            stack2[top] = 0;
            stack3[top] = ret.length;
        }
      }
      return ret;
    }
     toHash3() {
      let ret="";
      if (this._last_h!==undefined) {
          return this._last_h;
      }
      ret+=pack_str(this.name);
      ret+=this.value!==undefined ? pack_short(this.value*15000) : "";
      ret+=pack_byte(this.is_func);
      if (this.a!==undefined) {
          ret+=pack_op(this.op);
          ret+=this.a.toHash3();
          ret+=this.b.toHash3();
      }
      this._last_h = ret;
      return ret;
    }
     toHash() {
      return this.toHash3();
      let ret="";
      if (this._last_h!==undefined) {
      }
      ret+=this.name+"|";
      ret+=(this.value!==undefined ? this.value : "")+"|";
      ret+=this.is_func+"|";
      if (this.a!==undefined) {
          ret+=this.op+"$";
          ret+=this.a.toHash()+"$";
          ret+=this.b.toHash()+"$";
      }
      this._last_h = ret;
      return ret;
    }
     toString() {
      if (this._toString!==undefined) {
          return this._toString;
      }
      let use_parens=this.use_parens;
      use_parens = use_parens&&!(this.parent!==undefined&&(this.parent.op==="i"||this.parent.op==="c"||this.parent.op.length>2));
      use_parens = use_parens&&!(this.value!==undefined&&this.a===undefined);
      use_parens = use_parens&&!(this.name!==undefined&&this.name!==""&&this.a===undefined);
      let s=use_parens ? "(" : "";
      if (this.a!==undefined&&this.op==="i") {
          return ""+this.a+"["+this.b+"]";
      }
      else 
        if (this.a!==undefined&&this.is_func&&this.op!=="c") {
          s+=""+this.op+"("+this.a+", "+this.b+")";
      }
      else 
        if (this.a!==undefined&&this.is_func&&this.op==="c") {
          s+=""+this.a+"("+this.b+")";
      }
      else 
        if (this.a!==undefined&&this.op!=="p") {
          s+=""+this.a+" "+this.op+" "+this.b;
      }
      else 
        if (this.a!==undefined&&this.op==="p") {
          return "pow("+this.a+", "+this.b+")";
      }
      else 
        if (this.value!==undefined&&this.a===undefined) {
          s+=""+this.value;
      }
      else 
        if (this.name!==undefined&&this.name!=="") {
          s+=this.name;
      }
      else {
        s+="{ERROR!}";
      }
      s+=use_parens ? ")" : "";
      this._toString = s;
      return s;
    }
  }
  _ESClass.register(symcls);
  _es6_module.add_class(symcls);
  symcls = _es6_module.add_export('symcls', symcls);
  function sym(name_or_value) {
    return new symcls(name_or_value);
  }
  sym = _es6_module.add_export('sym', sym);
  function recurse2_a(n, root, map, haskeys, map2, subpart_i, symtags) {
    function recurse2(n, root) {
      let key=n.hash();
      if (map.has(key)) {
          n.tag = symtags.get(map2.get(key));
          n.tag.key = key;
          n.tag.is_tag = true;
          n.key = key;
          if (root!==undefined&&n!==root) {
              if (!haskeys.has(root.key)) {
                  haskeys.set(root.key, new hashtable());
              }
              haskeys.get(root.key).set(key, 1);
          }
      }
      if (n.a!==undefined) {
          recurse2(n.a, root);
          recurse2(n.b, root);
      }
      return n;
    }
    return recurse2(n, root);
  }
  function optimize(tree) {
    tot_symcls = 0;
    let start_tree=tree.copy(true);
    function output() {
      console.log.apply(console, arguments);
    }
    function optimize_pass(tree, subpart_start_i) {
      if (subpart_start_i===undefined)
        subpart_start_i = 0;
      let subpart_i=subpart_start_i;
      let totstep=8;
      let curstage=1;
      output("begin optimization stage "+(curstage++)+" of "+totstep+". . .");
      let symtags=new hashtable();
      let map=new hashtable();
      let mapcount=new hashtable();
      function recurse(n, depth) {
        if (depth===undefined)
          depth = 0;
        if (n.a===undefined)
          return ;
        let hash;
        if (n.a!==undefined) {
            let str=n.toHash();
            if (str.length<25) {
                return ;
            }
        }
        if (depth>3) {
            hash = hash===undefined ? n.hash() : hash;
            map.set(hash, n.copy());
            if (!mapcount.has(hash)) {
                mapcount.set(hash, 0);
            }
            mapcount.set(hash, mapcount.get(hash)+1);
        }
        if (n.a!==undefined) {
            recurse(n.a, depth+1);
        }
        if (n.b!==undefined) {
            recurse(n.b, depth+1);
        }
      }
      recurse(tree);
      let keys=map.keys();
      keys.sort(function (a, b) {
        return -spool_len(a)*mapcount.get(a)+spool_len(b)*mapcount.get(b);
      });
      let map2=new hashtable();
      output("begin optimization stage "+(curstage++)+" of "+totstep+". . .");
      let keys3=[];
      let i2=0;
      let max_si=0;
      function next() {
        for (let i=0; i<keys.length; i++) {
            if (mapcount.get(keys[i])<3) {
                map.remove(keys[i]);
                continue;
            }
            map2.set(keys[i], i2++);
            max_si = max(map2.get(keys[i]), max_si);
            symtags.set(i2-1, sym("SUBPART"+((i2-1)+subpart_i)));
        }
      }
      next();
      output("begin optimization stage "+(curstage++)+" of "+totstep+". . .");
      keys = undefined;
      let haskeys=new hashtable();
      tree = recurse2_a(tree, undefined, map, haskeys, map2, subpart_i, symtags);
      keys3 = map2.keys();
      keys3.sort(function (a, b) {
        return -spool_len(a)*mapcount.get(a)+spool_len(b)*mapcount.get(b);
      });
      function recurse3(n, key) {
        if (n.a!==undefined) {
            if (n.a.tag!==undefined&&!n.a.is_tag&&n.a.key===key) {
                n.a.parent = undefined;
                n.a = n.a.tag;
                n.clear_toString();
            }
            else {
              recurse3(n.a, key);
            }
            if (n.b.tag!==undefined&&!n.b.is_tag&&n.b.key===key) {
                n.b.parent = undefined;
                n.b = n.b.tag;
                n.clear_toString();
            }
            else {
              recurse3(n.b, key);
            }
        }
        return n;
      }
      output("begin optimization stage "+(curstage++)+" of "+totstep+". . .");
      for (let i=0; i<keys3.length; i++) {
          tree = recurse3(tree, keys3[i]);
      }
      let exists=new hashtable();
      function recurse4(n, key) {
        if (n.is_tag) {
            exists.set(n.key, true);
        }
        if (n.is_tag&&n.key!==undefined&&n.key===key)
          return true;
        if (n.a!==undefined) {
            if (recurse4(n.a, key))
              return true;
            if (recurse4(n.b, key))
              return true;
        }
        return false;
      }
      recurse4(tree);
      output("begin optimization stage "+(curstage++)+" of "+totstep+". . .");
      keys3.sort(function (a, b) {
        return -map2.get(a)+map2.get(b);
      });
      output("begin optimization stage "+(curstage++)+" of "+totstep+". . .");
      output(keys3.length);
      let last_time2=time_ms();
      haskeys = new hashtable();
      window.haskeys = haskeys;
      for (let i=0; i<keys3.length; i++) {
          if (time_ms()-last_time2>500) {
              output("optimizing key", i+1, "of", keys3.length);
              last_time2 = time_ms();
          }
          let n=map.get(keys3[i]);
          let last_time=time_ms();
          for (let j=0; j<keys3.length; j++) {
              if (i===j)
                continue;
              if (time_ms()-last_time>500) {
                  output("  subkey part 1:", j+1, "of", keys3.length+", for", i+1);
                  last_time = time_ms();
              }
              recurse2_a(n, n, map, haskeys, map2, subpart_i, symtags);
          }
          for (let j=0; j<keys3.length; j++) {
              let key=keys3[j];
              if (i===j)
                continue;
              if (time_ms()-last_time>500) {
                  output("  subkey part 2", j+1, "of", keys3.length+", for", i+1);
                  last_time = time_ms();
              }
              if (haskeys.get(n.key)===undefined||!(haskeys.get(n.key).has(key)))
                continue;
              recurse3(n, keys3[j]);
              recurse4(n, keys3[j]);
              n.clear_toString();
          }
      }
      output("begin optimization stage "+(curstage++)+" of "+totstep+". . .");
      function tag(n, root) {
        if (n!==root&&n.is_tag) {
            let k=n.key;
            if (k===root.key) {
                output("Cycle!", k, root.key);
                throw RuntimeError("Cycle! "+k+", "+root.key);
                return ;
            }
            root.ins.set(n.key, 1);
            let id=map2.get(n.key);
            root.ins_ids.set(id, id);
        }
        if (n.a!==undefined) {
            tag(n.a, root);
            tag(n.b, root);
        }
      }
      output("begin optimization stage "+(curstage++)+" of "+totstep+". . .");
      let dag=[];
      window.dag = dag;
      function visit_n(k) {
        let n2=map.get(k);
        if (!n2._done) {
            dagsort(n2);
        }
      }
      function dagsort(n) {
        if (n._done) {
            return ;
        }
        if (n._visit) {
            throw new Error("CYCLE!", n, n._visit);
        }
        if (n.is_root) {
            n._visit = true;
            n.ins.forEach(visit_n, this);
            n._visit = false;
            dag.push(n);
            n._done = true;
        }
        if (n.a!==undefined) {
            dagsort(n.a);
            dagsort(n.b);
        }
      }
      for (let i=0; i<keys3.length; i++) {
          let n=map.get(keys3[i]);
          n.is_root = true;
          n.ins = new hashtable();
          n.ins_ids = new hashtable();
          n.id = map2.get(keys3[i]);
      }
      for (let i=0; i<keys3.length; i++) {
          let n=map.get(keys3[i]);
          n._visit = n._done = false;
          n.key = keys3[i];
          tag(n, n);
      }
      for (let i=0; i<keys3.length; i++) {
          let n=map.get(keys3[i]);
          if (!n._done) {
              dagsort(n);
          }
      }
      let i1=0;
      let header="";
      for (let i=0; i<dag.length; i++) {
          let n=dag[i];
          let key=n.key;
          if (subpart_i>0||i>0)
            header+=", ";
          n.clear_toString();
          header+="\n    ";
          header+="SUBPART"+map2.get(key)+" = "+""+n;
      }
      header+="\n";
      let finals=header+""+tree;
      output("finished!");
      return [tree, finals, header, max_si];
    }
    let si=0;
    let header2="";
    let r=optimize_pass(tree, si);
    if (i>0&&header2.trim()!==""&&header2.trim()[header2.length-1]!==",")
      header2+=", ";
    header2+=r[2];
    tree = r[0].copy();
    si+=r[3]+1;
    header2 = header2.trim();
    if (header2.trim()!=="")
      header2 = "let "+header2+";\n";
    let final2=header2+"\n  return "+tree+";\n";
    let ret=undefined, func;
    let code1="ret = function(s, j, n, ks, dvn) {"+final2+"};";
    code1 = splitline(code1);
    eval(code1);
    func = ret;
    let func2=undefined;
    let code2="ret = function(s, j, n, ks, dvn) {return "+(""+start_tree)+";};";
    code2 = splitline(code2);
    func = ret;
    eval(code2);
    return [func, func2, code1, code2, tree];
  }
  optimize = _es6_module.add_export('optimize', optimize);
  function get_cache(k, v) {
    let ret;
    try {
      ret = JSON.parse(myLocalStorage["_store_"+k]);
    }
    catch (error) {
        print_stack(error);
        return undefined;
    }
    if (ret==="undefined") {
        return undefined;
    }
  }
  get_cache = _es6_module.add_export('get_cache', get_cache);
  window.get_cache = get_cache;
  function store_cache(k, v) {
    myLocalStorage["_store_"+k] = JSON.stringify(v);
  }
  store_cache = _es6_module.add_export('store_cache', store_cache);
  window.store_cache = store_cache;
  window.test_sym = function test_sym() {
    let x=sym("x");
    x = x.binop(2, "*");
    let degree=2, klen=10, j=2;
    let dvn=1;
    KILL_ZEROS = false;
    let tree=gen_basis_dv_code(j, degree, klen, dvn);
    let start_tree=tree.copy();
    KILL_ZEROS = true;
    tree = gen_basis_dv_code(j, degree, klen, dvn);
    window.tree_func = optimize(tree);
    let skey=""+j+"|"+degree+"|"+klen+"|"+dvn;
    store_cache(skey, tree_func[2]);
    let tst=new Float32Array(10);
    for (let i=0; i<tst.length; i++) {
        tst[i] = i;
    }
    let finals=tree_func[2];
    console.log("ratio: ", finals.replace(" ", "").replace("\n", "").length/(""+start_tree).replace(" ", "").replace("\n", "").length);
    window.test = function (s, j) {
      console.log("testing...");
      if (j===undefined)
        j = 3.0;
      let func=window.tree_func[0];
      let func2=basis_dv;
      let time1=0;
      let time2=0;
      let steps=250, steps2=10;
      for (let si=0; si<steps2; si++) {
          let start_time=time_ms();
          for (let i=0; i<steps; i++) {
              let r1=func(s+i*0.0001, j, degree, tst);
          }
          time1+=(time_ms()-start_time);
          start_time = time_ms();
          for (let i=0; i<steps; i++) {
              let r2=func2(s+i*0.0001, j, degree, tst, dvn);
          }
          time2+=(time_ms()-start_time);
      }
      time1 = time1.toFixed(2)+"ms";
      time2 = time2.toFixed(2)+"ms";
      console.log(r1, r2, time1, time2);
      
    }
    let dv_test=""+tree;
    let dv_test2="";
    let ci=0;
    let set={"(": 0, 
    ")": 0, 
    "+": 0, 
    "/": 0, 
    "*": 0}
    for (let i=0; i<dv_test.length; i++, ci++) {
        if (ci>79&&(dv_test[i] in set)) {
            dv_test2+="\n";
            ci = 0.0;
        }
        dv_test2+=dv_test[i];
    }
    dv_test = dv_test2;
  }
  window.sym = sym;
  function splitline(dv_test) {
    let dv_test2="";
    let ci=0;
    let set={"(": 0, 
    ")": 0, 
    "+": 0, 
    "/": 0, 
    "*": 0}
    for (let i=0; i<dv_test.length; i++, ci++) {
        if (ci>79&&(dv_test[i] in set)) {
            dv_test2+="\n";
            ci = 0.0;
        }
        dv_test2+=dv_test[i];
    }
    return dv_test2;
  }
  window.splitline = splitline;
  function gen_basis_code(j, n, klen, gen_reduce) {
    let s=sym("s");
    j = sym("j");
    let ks=sym("ks");
    return basis_sym_general(s, j, n, ks, gen_reduce);
  }
  gen_basis_code = _es6_module.add_export('gen_basis_code', gen_basis_code);
  function make_cache_table(maxknotsize, make_dvs) {
    let basis_caches1=new Array(12);
    for (let i=0; i<basis_caches1.length; i++) {
        let arr=new Array(maxknotsize);
        basis_caches1[i] = arr;
        for (let j=1; j<arr.length; j++) {
            arr[j] = new Array(j);
            if (make_dvs) {
                let arr2=arr[j];
                for (let k=0; k<arr2.length; k++) {
                    arr2[k] = new Array(5);
                }
            }
        }
    }
    return basis_caches1;
  }
  const basis_caches=make_cache_table(256, false);
  _es6_module.add_export('basis_caches', basis_caches);
  const basis_caches_dv=make_cache_table(256, true);
  _es6_module.add_export('basis_caches_dv', basis_caches_dv);
  const DV_JADD=0.0;
  _es6_module.add_export('DV_JADD', DV_JADD);
  window.load_seven = function () {
    for (let k in basis_json) {
        let k1=k;
        k = k.split("|");
        if (k.length<4)
          continue;
        console.log(k);
        if (k[1]==="7") {
            console.log("found!", k);
            let hash=""+0+"|"+7+"|"+2+"|"+k[3];
            myLocalStorage[hash] = basis_json[k1];
            let ret;
            console.log(hash, eval(basis_json[k1]));
        }
    }
  }
  window.save_local_storage = function () {
    let ret=JSON.stringify(myLocalStorage);
    let blob=new Blob([ret], {type: "application/binary"});
    let url=URL.createObjectURL(blob);
    console.log(url);
    window.open(url);
    return url;
  }
  function add_to_table_dv(j, n, klen, dvn, table) {
    let hash=""+0+"|"+n+"|"+2+"|"+dvn;
    let s=myLocalStorage[hash];
    if (s===undefined||s==="undefined") {
        let tree=gen_basis_dv_code(j, n, klen, dvn);
        s = optimize(tree)[2];
        console.log("storing basis function. . .");
        myLocalStorage[hash] = s;
    }
    let ret;
    eval(s);
    table[n][2][0][dvn] = ret;
    return ret;
  }
  let zero=function (a, b, c, d, e) {
    return 0.0;
  }
  function get_basis_dv_func(j, n, klen, dvn) {
    if (dvn<=0) {
        return zero;
    }
    let ret=basis_caches_dv[n][2][0][dvn];
    if (ret===undefined) {
        ret = add_to_table_dv(0, n, klen, dvn, basis_caches_dv);
    }
    return ret;
  }
  get_basis_dv_func = _es6_module.add_export('get_basis_dv_func', get_basis_dv_func);
  window.get_basis_dv_func = get_basis_dv_func;
  function compiled_basis_dv(s, j, n, ks, dvn) {
    let func=get_basis_dv_func(j, n, ks.length, dvn);
    return func(s, j, n, ks, dvn);
  }
  compiled_basis_dv = _es6_module.add_export('compiled_basis_dv', compiled_basis_dv);
  function gen_basis_dv_code(j, degree, klen, dv, gen_reduce) {
    let s=sym("s");
    let n=degree;
    j = sym("j");
    let ks=new Array(klen);
    for (let i=0; i<klen; i++) {
        ks[i] = gen_reduce ? sym("k"+(i+1)) : sym("ks").index(j);
    }
    ks = sym("ks");
    return basis_dv_sym(s, j, degree, ks, dv, gen_reduce);
  }
  gen_basis_dv_code = _es6_module.add_export('gen_basis_dv_code', gen_basis_dv_code);
  function get_basis_func(j, n, klen) {
    let KLEN=5;
    let ret=basis_caches[n][KLEN][j];
    if (ret===undefined) {
        let hash="bs:"+n;
        let s=myLocalStorage[hash];
        if (s===undefined||s==="undefined") {
            console.log("storing basis function. . .");
            let tree=gen_basis_code(j, n, klen);
            s = optimize(tree)[2];
            myLocalStorage[hash] = s;
        }
        eval(s);
        basis_caches[n][KLEN][j] = ret;
    }
    return ret;
  }
  get_basis_func = _es6_module.add_export('get_basis_func', get_basis_func);
  function compiled_basis(s, j, n, ks) {
    let func=get_basis_func(j, n, ks.length);
    return func(s, j, n, ks);
  }
  compiled_basis = _es6_module.add_export('compiled_basis', compiled_basis);
  window._sym_eps1 = 1e-09;
  window._sym_eps2 = 1e-06;
  window._sym_do_clamping = true;
  window._sym_more_symbolic = false;
  function basis_sym(s, j, n, ks, gen_reduce) {
    let klen=ks.length;
    let j1=j, j2=j+1, jn=j+n, jn1=j+n+1;
    j1 = _sym_do_clamping ? min(max(j1, 0.0), klen-1) : j1;
    j2 = _sym_do_clamping ? min(max(j2, 0.0), klen-1) : j2;
    jn = _sym_do_clamping ? min(max(jn, 0.0), klen-1) : jn;
    jn1 = _sym_do_clamping ? min(max(jn1, 0.0), klen-1) : jn1;
    if (n===0) {
        return sym("(s >= ks["+j1+"] && s < ks["+j2+"])");
    }
    else {
      let A=s.sub(ks[j1]);
      let div=ks[jn].sub(ks[j1]);
      let cancelA=div.binop(0.0, "!=");
      if (_sym_eps1!==0.0)
        div = div.add(_sym_eps1);
      A = A.mul(basis_sym(s, j, n-1, ks, gen_reduce)).div(div).mul(cancelA);
      let B=ks[jn1].sub(s);
      div = ks[jn1].sub(ks[j2]);
      let cancelB=div.binop(0.0, "!=");
      if (_sym_eps1!==0.0)
        div = div.add(_sym_eps1);
      B = B.mul(basis_sym(s, j+1, n-1, ks, gen_reduce)).div(div).mul(cancelB);
      return A.add(B);
    }
  }
  basis_sym = _es6_module.add_export('basis_sym', basis_sym);
  function basis_sym_general(s, j, n, ks, gen_reduce) {
    let j1, j2, jn1, kn2;
    if (_sym_do_clamping) {
        let j1=j.add(0).func("max", 0.0).func("min", sym("(ks.length-1)"));
        let j2=j.add(1).func("max", 0.0).func("min", sym("(ks.length-1)"));
        let jn=j.add(n).func("max", 0.0).func("min", sym("(ks.length-1)"));
        let jn1=j.add(n+1).func("max", 0.0).func("min", sym("(ks.length-1)"));
    }
    else {
      j1 = j, j2 = j.add(1), jn = j.add(n), jn1 = j.add(n+1);
    }
    if (_sym_more_symbolic&&n===1) {
        return sym("lin("+j1+","+j2+","+jn1+")");
    }
    else 
      if (_sym_more_symbolic&&n===0) {
        return j1.func("step", j2);
    }
    if (n===0) {
        let r1=s.binop(ks.index(j1), ">=");
        let r2=s.binop(ks.index(j2), "<");
        return r1.binop(r2, "&&");
        r1 = s.sub(ks.index(j1));
        r2 = ks.index(j2).sub(s);
        r1 = s.sub(ks.index(j1));
        r2 = ks.index(j2).sub(s);
        let eps1=1e-06;
        r1 = r1.add(eps1);
        r2 = r2.add(eps1);
        r1 = r1.div(r1.func("abs")).mul(0.5).add(0.5-eps1);
        r2 = r2.div(r2.func("abs")).mul(0.5).add(0.5+eps1);
    }
    else {
      let A=s.sub(ks.index(j1));
      let div=ks.index(jn).sub(ks.index(j1));
      let cancelA=div.binop(0.0, "!=");
      if (_sym_eps1!==undefined)
        div = div.add(_sym_eps1);
      A = A.mul(basis_sym_general(s, j, n-1, ks, gen_reduce)).div(div).mul(cancelA);
      let B=ks.index(jn1).sub(s);
      div = ks.index(jn1).sub(ks.index(j2));
      let cancelB=div.binop(0.0, "!=");
      if (_sym_eps1!==undefined)
        div = div.add(_sym_eps1);
      B = B.mul(basis_sym_general(s, j.add(1), n-1, ks, gen_reduce)).div(div).mul(cancelB);
      return A.add(B);
    }
  }
  basis_sym_general = _es6_module.add_export('basis_sym_general', basis_sym_general);
  function basis_dv_sym(s, j, n, ks, dvn, gen_reduce) {
    if (dvn===0) {
        return basis_sym_general(s, j, n, ks, gen_reduce);
    }
    let j1, j2, jn, jn1, j3, j4;
    if (_sym_do_clamping) {
        let j1=j.add(0).func("max", 0.0).func("min", sym("(ks.length-1)"));
        let j2=j.add(1).func("max", 0.0).func("min", sym("(ks.length-1)"));
        let jn=j.add(n).func("max", 0.0).func("min", sym("(ks.length-1)"));
        let jn1=j.add(n+1).func("max", 0.0).func("min", sym("(ks.length-1)"));
        let j3=j.add(2).func("max", 0.0).func("min", sym("(ks.length-1)"));
        let j4=j.add(3).func("max", 0.0).func("min", sym("(ks.length-1)"));
    }
    else {
      j1 = j, j2 = j.add(1), jn = j.add(n), jn1 = j.add(n+1);
      j3 = j.add(2), j4 = j.add(3);
    }
    if (n<1) {
        return sym(0);
    }
    else 
      if (n<=1) {
        let div1="(0.000+(ks["+j3+"])-(ks["+j2+"]))";
        let div2="(0.000+(ks["+j2+"])-(ks["+j1+"]))";
        let b="(s >= ks["+j2+"] && s < ks["+j3+"]) ? (-1.0/"+div1+") : 0.0";
        let s="(s >= ks["+j1+"] && s < ks["+j2+"]) ? (1.0/"+div2+") : ("+b+")";
        return sym("("+s+")");
        let r1=s.binop(ks.index(j1), ">=").binop(s.binop(ks.index(j2), "<"), "&&");
        let r2=s.binop(ks.index(j2), ">=").binop(s.binop(ks.index(j3), "<"), "&&");
        let ret=r1.sub(r2);
        div1 = ks.index(j2).sub(ks.index(j1));
        let div3=div1.add(div1.binop("0.0", "=="));
        div2 = ks.index(j3).sub(ks.index(j2));
        let div4=div2.add(div2.binop("0.0", "=="));
        let cancel=div2.binop("0.0", "==").mul(div1.binop("0.0", "=="));
        r1 = sym(1.0).div(div3).mul(div1.binop("0.0", "!="));
        r2 = sym(-1.0).div(div4).mul(div2.binop("0.0", "!="));
        a = s.binop(ks.index(j1), ">=").binop(s.binop(ks.index(j2), "<"), "&&");
        b = s.binop(ks.index(j2), ">=").binop(s.binop(ks.index(j3), "<"), "&&");
        return r1.mul(a).add(r2.mul(b));
        ret = 0.0;
        if (s>=ks[j1]&&s<ks[j2])
          ret = 1.0/(ks[j2]-ks[j1]);
        else 
          if (s>=ks[j2]&&s<ks[j3])
          ret = -1.0/(ks[j3]-ks[j2]);
    }
    else {
      let kj1=ks.index(j1);
      let kj2=ks.index(j2);
      let kjn=ks.index(jn);
      let kjn1=ks.index(jn1);
      kjn.add(_sym_eps2);
      if (!_sym_more_symbolic) {
          kj1 = kj1.sub(_sym_eps2);
          kj2 = kj2.sub(_sym_eps2);
          kjn = kjn.add(_sym_eps2);
          kjn1 = kjn1.add(_sym_eps2);
      }
      let div=kj1.sub(kjn).mul(kj2.sub(kjn1));
      let cancel=div.func("abs").binop(0.0001, ">=");
      if (!_sym_more_symbolic) {
          div = div.add(0.0);
      }
      let ret=(kj1.sub(s).mul(basis_dv_sym(s, j, n-1, ks, dvn, gen_reduce)).sub(basis_dv_sym(s, j, n-1, ks, dvn-1, gen_reduce).mul(dvn)));
      ret = ret.mul(kj2.sub(kjn1));
      let ret2=(kjn1.sub(s).mul(basis_dv_sym(s, j.add(1.0), n-1, ks, dvn)).sub(basis_dv_sym(s, j.add(1.0), n-1, ks, dvn-1, gen_reduce).mul(dvn)));
      ret2 = ret2.mul(kj1.sub(kjn));
      ret = ret.sub(ret2).div(div);
      return ret;
    }
  }
  basis_dv_sym = _es6_module.add_export('basis_dv_sym', basis_dv_sym);
  let _jit=[0.529914898565039, 0.36828512651845813, 0.06964468420483172, 0.7305932911112905, 0.5716458782553673, 0.8704596017487347, 0.4227079786360264, 0.5019868116360158, 0.8813679129816592, 0.1114522460848093, 0.6895110581535846, 0.6958548363763839, 0.3031193600036204, 0.37011902872473, 0.2962806692812592, 0.028554908465594053, 0.823489741422236, 0.46635359339416027, 0.32072878000326455, 0.790815538726747, 0.24832243379205465, 0.4548102973494679, 0.17482145293615758, 0.12876217160373926, 0.47663668682798743, 0.5577574144117534, 0.44505770644173026, 0.4608486376237124, 0.17487138183787465, 0.9557673167437315, 0.48691147728823125, 0.21344363503158092, 0.4561011800542474, 0.5500841496977955, 0.056078286841511726, 0.2025157359894365, 0.3545380241703242, 0.37520054122433066, 0.9240472037345171, 0.5759296049363911, 0.23126523662358522, 0.8160425815731287, 0.2655198322609067, 0.5174507955089211, 0.5305957165546715, 0.7498655256349593, 0.16992988483980298, 0.8977103955112398, 0.6693002553656697, 0.6586289645638317, 0.014608860714361072, 0.46719147730618715, 0.22958142310380936, 0.2482534891460091, 0.9248246876522899, 0.5719250738620758, 0.8759879691060632, 0.014760041143745184, 0.27814899617806077, 0.8179157497361302, 0.8425747095607221, 0.5784667218104005, 0.8781018694862723, 0.25768745923414826, 0.12491370760835707, 0.17019980889745057, 0.6778648062609136, 0.7985234088264406, 0.5552649961318821, 0.4146097879856825, 0.3286898732185364, 0.3871084579732269, 0.5073949920479208, 0.26263241469860077, 0.16050022304989398, 0.7419972626958042, 0.10826557059772313, 0.15192136517725885, 0.08435141341760755, 0.8828735174611211, 0.9579186830669641, 0.4730489938519895, 0.13362190243788064, 0.3206780105829239, 0.5988038030918688, 0.4641053748782724, 0.8168729823082685, 0.18584533245302737, 0.862093557137996, 0.5530180907808244, 0.9900481395889074, 0.5014054768253118, 0.5830419992562383, 0.31904217251576483, 0.285037521738559, 0.25403662770986557, 0.20903456234373152, 0.8835178036242723, 0.8222054259385914, 0.5918245937209576];
  window._jit = _jit;
  window._jit_cur = 0;
}, '/dev/fairmotion/src/curve/bspline.js');


es6_module_define('spline_math', ["../wasm/native_api.js", "../config/config.js", "./spline_math_hermite.js"], function _spline_math_module(_es6_module) {
  "use strict";
  var config=es6_import(_es6_module, '../config/config.js');
  let FEPS=1e-18;
  let PI=Math.PI;
  let sin=Math.sin, acos=Math.acos, asin=Math.asin, atan2=Math.atan2, sqrt=Math.sqrt;
  let cos=Math.cos, pow=Math.pow, abs=Math.abs;
  let SPI2=Math.sqrt(PI/2);
  var math=es6_import(_es6_module, './spline_math_hermite.js');
  let spiraltheta=math.spiraltheta;
  spiraltheta = _es6_module.add_export('spiraltheta', spiraltheta);
  let spiralcurvature=math.spiralcurvature;
  spiralcurvature = _es6_module.add_export('spiralcurvature', spiralcurvature);
  let spiralcurvature_dv=math.spiralcurvature_dv;
  spiralcurvature_dv = _es6_module.add_export('spiralcurvature_dv', spiralcurvature_dv);
  let approx=math.approx;
  approx = _es6_module.add_export('approx', approx);
  let INT_STEPS=math.INT_STEPS;
  INT_STEPS = _es6_module.add_export('INT_STEPS', INT_STEPS);
  let ORDER=math.ORDER;
  ORDER = _es6_module.add_export('ORDER', ORDER);
  var DISABLE_SOLVE=es6_import_item(_es6_module, '../config/config.js', 'DISABLE_SOLVE');
  var native_api=es6_import(_es6_module, '../wasm/native_api.js');
  function do_solve() {
    if (DISABLE_SOLVE||window.DISABLE_SOLVE)
      return ;
    if (!DEBUG.no_native&&config.USE_WASM&&native_api.isReady()) {
        return native_api.do_solve.apply(this, arguments);
    }
    else {
      return math.do_solve.apply(this, arguments);
    }
  }
  do_solve = _es6_module.add_export('do_solve', do_solve);
  const KSCALE=ORDER+1;
  _es6_module.add_export('KSCALE', KSCALE);
  const KANGLE=ORDER+2;
  _es6_module.add_export('KANGLE', KANGLE);
  const KSTARTX=ORDER+3;
  _es6_module.add_export('KSTARTX', KSTARTX);
  const KSTARTY=ORDER+4;
  _es6_module.add_export('KSTARTY', KSTARTY);
  const KSTARTZ=ORDER+5;
  _es6_module.add_export('KSTARTZ', KSTARTZ);
  const KV1X=ORDER+6;
  _es6_module.add_export('KV1X', KV1X);
  const KV1Y=ORDER+7;
  _es6_module.add_export('KV1Y', KV1Y);
  const KV2X=ORDER+8;
  _es6_module.add_export('KV2X', KV2X);
  const KV2Y=ORDER+9;
  _es6_module.add_export('KV2Y', KV2Y);
  const KTOTKS=ORDER+10;
  _es6_module.add_export('KTOTKS', KTOTKS);
  const eval_curve_vs=cachering.fromConstructor(Vector3, 64);
  const eval_ret_vs=cachering.fromConstructor(Vector2, 256);
  function eval_curve(seg, s, v1, v2, ks, order, angle_only, no_update) {
    if (native_api.isReady()&&!(window.DEBUG.no_native||window.DEBUG.no_nativeEval)) {
        return native_api.evalCurve(seg, s, v1, v2, ks, angle_only, no_update);
    }
    if (order===undefined)
      order = ORDER;
    s*=0.99999999;
    let eps=1e-09;
    let ang, scale, start, end;
    if (!no_update) {
        start = approx(-0.5+eps, ks, order);
        end = approx(0.5-eps, ks, order);
        end.sub(start);
        let a1=atan2(end[0], end[1]);
        let vec=eval_curve_vs.next();
        vec.load(v2).sub(v1);
        let a2=atan2(vec[0], vec[1]);
        ang = a2-a1;
        scale = vec.vectorLength()/end.vectorLength();
        ks[KSCALE] = scale;
        ks[KANGLE] = ang;
        ks[KSTARTX] = start[0];
        ks[KSTARTY] = start[1];
    }
    else {
      ang = ks[KANGLE];
      scale = ks[KSCALE];
      start[0] = ks[KSTARTX];
      start[1] = ks[KSTARTY];
    }
    if (!angle_only) {
        let co=approx(s, ks, order);
        co.sub(start).rot2d(-ang).mulScalar(scale).add(v1);
        return eval_ret_vs.next().load(co);
    }
  }
  eval_curve = _es6_module.add_export('eval_curve', eval_curve);
  
}, '/dev/fairmotion/src/curve/spline_math.js');


es6_module_define('spline_math_hermite', ["../path.ux/scripts/util/vectormath.js", "./spline_base.js", "./solver.js", "../core/toolops_api.js"], function _spline_math_hermite_module(_es6_module) {
  "USE_PREPROCESSOR";
  "use strict";
  var SplineFlags=es6_import_item(_es6_module, './spline_base.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, './spline_base.js', 'SplineTypes');
  var solver=es6_import_item(_es6_module, './solver.js', 'solver');
  var constraint=es6_import_item(_es6_module, './solver.js', 'constraint');
  var ModalStates=es6_import_item(_es6_module, '../core/toolops_api.js', 'ModalStates');
  let FEPS=1e-18;
  let PI=Math.PI;
  let sin=Math.sin, acos=Math.acos, asin=Math.asin, atan2=Math.atan2, sqrt=Math.sqrt;
  let cos=Math.cos, pow=Math.pow, abs=Math.abs, floor=Math.floor, ceil=Math.ceil;
  let mmax=Math.max, mmin=Math.min;
  let SPI2=Math.sqrt(PI/2);
  let INCREMENTAL=true;
  let ORDER=4;
  ORDER = _es6_module.add_export('ORDER', ORDER);
  let KSCALE=ORDER+1;
  KSCALE = _es6_module.add_export('KSCALE', KSCALE);
  let KANGLE=ORDER+2;
  KANGLE = _es6_module.add_export('KANGLE', KANGLE);
  let KSTARTX=ORDER+3;
  KSTARTX = _es6_module.add_export('KSTARTX', KSTARTX);
  let KSTARTY=ORDER+4;
  KSTARTY = _es6_module.add_export('KSTARTY', KSTARTY);
  let KSTARTZ=ORDER+5;
  KSTARTZ = _es6_module.add_export('KSTARTZ', KSTARTZ);
  window.KSCALE = KSCALE;
  let KTOTKS=ORDER+6;
  KTOTKS = _es6_module.add_export('KTOTKS', KTOTKS);
  let INT_STEPS=4;
  INT_STEPS = _es6_module.add_export('INT_STEPS', INT_STEPS);
  function set_int_steps(steps) {
    INT_STEPS = steps;
  }
  set_int_steps = _es6_module.add_export('set_int_steps', set_int_steps);
  function get_int_steps(steps) {
    return INT_STEPS;
  }
  get_int_steps = _es6_module.add_export('get_int_steps', get_int_steps);
  let _approx_cache_vs=cachering.fromConstructor(Vector3, 32);
  const POLYTHETA_BEZ=(s, k1, k2, k3, k4) =>    {
    return (-(((3*(s)-4)*k3-k4*(s))*(s)*(s)+((s)*(s)-2*(s)+2)*((s)-2)*k1-(3*(s)*(s)-8*(s)+6)*k2*(s))*(s))*0.25;
  }
  const POLYCURVATURE_BEZ=(s, k1, k2, k3, k4) =>    {
    return (-(((3*((s)-1)*k3-k4*(s))*(s)-3*((s)-1)*((s)-1)*k2)*(s)+((s)-1)*((s)-1)*((s)-1)*k1));
  }
  const POLYCURVATURE_BEZ_DV=(s, k1, k2, k3, k4) =>    {
    return (-3*(k1*(s)*(s)-2*k1*(s)+k1-3*k2*(s)*(s)+4*k2*(s)-k2+3*k3*(s)*(s)-2*k3*(s)-k4*(s)*(s)));
  }
  const POLYTHETA_SBEZ=(s, k1, k2, dv1_k1, dv1_k2) =>    {
    let s2=s*s, s3=s2*s;
    return (((((3*s-4)*dv1_k2-6*(s-2)*k2)*s+(3*s2-8*s+6)*dv1_k1)*s+6*(s3-2*s2+2)*k1)*s)/12;
  }
  const POLYCURVATURE_SBEZ=(s, k1, k2, dv1_k1, dv1_k2) =>    {
    return (((s-1)*dv1_k1+dv1_k2*s)*(s-1)-(2*s-3)*k2*s)*s+(2*s+1)*(s-1)*(s-1)*k1;
  }
  const POLYCURVATURE_SBEZ_DV=(s, k1, k2, dv1_k1, dv1_k2) =>    {
    return (6*(k1-k2)*(s-1)+(3*s-2)*dv1_k2)*s+(3*s-1)*(s-1)*dv1_k1;
  }
  let polytheta_spower=function polytheta_spower(s, ks, order) {
    let s2=s*s, s3=s2*s, s4=s3*s, s5=s4*s, s6=s5*s, s7=s6*s, s8=s7*s, s9=s8*s;
    switch (order) {
      case 2:
{        let k1=ks[0], k2=ks[1];
        return (-((s-2)*k1-k2*s)*s)/2.0;
}
      case 4:
{        let k1=ks[0], dv1_k1=ks[1], dv1_k2=ks[2], k2=ks[3];
        return (((((3*s-4)*dv1_k2-6*(s-2)*k2)*s+(3*s2-8*s+6)*dv1_k1)*s+6*(s3-2*s2+2)*k1)*s)/12;
}
      case 6:
{        let k1=ks[0], dv1_k1=ks[1], dv2_k1=ks[2], dv2_k2=ks[3], dv1_k2=ks[4], k2=ks[5];
        return (-((((60*dv1_k2*s2-168*dv1_k2*s+120*dv1_k2-10*dv2_k2*s2+24*dv2_k2*s-15*dv2_k2-120*k2*s2+360*k2*s-300*k2)*s+(10*s3-36*s2+45*s-20)*dv2_k1)*s+12*(5*s4-16*s3+15*s2-5)*dv1_k1)*s+60*(2*s5-6*s4+5*s3-2)*k1)*s)/120;
}
    }
  }
  let polycurvature_spower=function polycurvature_spower(s, ks, order) {
    let k1=ks[0], dv1_k1=ks[1], dv2_k1=ks[2], dv2_k2=ks[3], dv1_k2=ks[4], k2=ks[5];
    let s2=s*s, s3=s2*s, s4=s3*s, s5=s4*s, s6=s5*s, s7=s6*s, s8=s7*s, s9=s8*s;
    switch (order) {
      case 2:
{        let k1=ks[0], k2=ks[1];
        return -((s-1)*k1-k2*s);
}
      case 4:
{        let k1=ks[0], dv1_k1=ks[1], dv1_k2=ks[2], k2=ks[3];
        return (((s-1)*dv1_k1+dv1_k2*s)*(s-1)-(2*s-3)*k2*s)*s+(2*s+1)*(s-1)*(s-1)*k1;
}
      case 6:
{        return (-((((((s-1)*dv2_k1-dv2_k2*s)*(s-1)+2*(3*s-4)*dv1_k2*s)*s+2*(3*s+1)*(s-1)*(s-1)*dv1_k1)*(s-1)-2*(6*s2-15*s+10)*k2*s2)*s+2*(6*s2+3*s+1)*(s-1)*(s-1)*(s-1)*k1))/2.0;
}
    }
  }
  let polycurvature_dv_spower=function polycurvature_spower(s, ks, order) {
    let s2=s*s, s3=s2*s, s4=s3*s, s5=s4*s, s6=s5*s, s7=s6*s, s8=s7*s, s9=s8*s;
    switch (order) {
      case 2:
{        let k1=ks[0], k2=ks[1];
        return -(k1-k2);
}
      case 4:
{        let k1=ks[0], dv1_k1=ks[1], dv1_k2=ks[2], k2=ks[3];
        return (6*(k1-k2)*(s-1)+(3*s-2)*dv1_k2)*s+(3*s-1)*(s-1)*dv1_k1;
}
      case 6:
{        let k1=ks[0], dv1_k1=ks[1], dv2_k1=ks[2], dv2_k2=ks[3], dv1_k2=ks[4], k2=ks[5];
        return (-(((2*(30*(k1-k2)*(s-1)*(s-1)+(5*s-6)*(3*s-2)*dv1_k2)-(5*s-3)*(s-1)*dv2_k2)*s+(5*s-2)*(s-1)*(s-1)*dv2_k1)*s+2*(5*s+1)*(3*s-1)*(s-1)*(s-1)*dv1_k1))/2.0;
}
    }
  }
  let spower_funcs=[polytheta_spower, polycurvature_spower, polycurvature_dv_spower];
  spower_funcs = _es6_module.add_export('spower_funcs', spower_funcs);
  let approx_ret_cache=cachering.fromConstructor(Vector3, 42);
  const FAST_INT_STEPS=3;
  const ONE_INT_STEPS=0.333333333;
  es6_import(_es6_module, '../path.ux/scripts/util/vectormath.js');
  let acache=[new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3(), new Vector3()];
  let acur=0;
  let eval_curve_vs=cachering.fromConstructor(Vector2, 64);
  let _eval_start=new Vector2();
  function approx(s1, ks, order, dis, steps) {
    s1*=1.0-1e-07;
    if (steps===undefined)
      steps = INT_STEPS;
    let s=0, ds=s1/steps;
    let ds2=ds*ds, ds3=ds2*ds, ds4=ds3*ds;
    let ret=approx_ret_cache.next();
    ret[0] = ret[1] = 0.0;
    let x=0, y=0;
    let k1=ks[0], dv1_k1=ks[1], dv1_k2=ks[2], k2=ks[3];
    for (let i=0; i<steps; i++) {
        let st=s+0.5;
        let s2=st*st, s3=st*st*st, s4=s2*s2, s5=s4*st, s6=s5*st, s7=s6*st, s8=s7*st, s9=s8*st, s10=s9*st;
        let th=POLYTHETA_SBEZ(st, k1, k2, dv1_k1, dv1_k2);
        let dx=sin(th), dy=cos(th);
        let kt=POLYCURVATURE_SBEZ(st, k1, k2, dv1_k1, dv1_k2);
        let dkt=POLYCURVATURE_SBEZ_DV(st, k1, k2, dv1_k1, dv1_k2);
        let dk2t=POLYCURVATURE_SBEZ_DV((st+0.0001), k1, k2, dv1_k1, dv1_k2);
        dk2t = (dk2t-dkt)/(0.0001);
        let kt2=kt*kt, kt3=kt*kt*kt;
        x+=((5*(4*((dy*dkt-kt2*dx)*ds2+3*(dy*kt*ds+2*dx))+((dk2t-kt3)*dy-3*dkt*kt*dx)*ds3)-(((4*dk2t-kt3)*kt+3*dkt*dkt)*dx+6*dy*dkt*kt2)*ds4)*ds)/120;
        y+=(-(5*(4*((dy*kt2+dkt*dx)*ds2-3*(2*dy-kt*dx*ds))+((dk2t-kt3)*dx+3*dy*dkt*kt)*ds3)+(((4*dk2t-kt3)*kt+3*dkt*dkt)*dy-6*dkt*kt2*dx)*ds4)*ds)/120;
        s+=ds;
    }
    ret[0] = x;
    ret[1] = y;
    return ret;
  }
  approx = _es6_module.add_export('approx', approx);
  let spiraltheta=polytheta_spower;
  spiraltheta = _es6_module.add_export('spiraltheta', spiraltheta);
  let spiralcurvature=polycurvature_spower;
  spiralcurvature = _es6_module.add_export('spiralcurvature', spiralcurvature);
  let spiralcurvature_dv=polycurvature_dv_spower;
  spiralcurvature_dv = _es6_module.add_export('spiralcurvature_dv', spiralcurvature_dv);
  const con_cache={list: [], 
   used: 0}
  function build_solver(spline, order, goal_order, gk, do_basic, update_verts) {
    let slv=new solver();
    con_cache.used = 0;
    if (order===undefined)
      order = ORDER;
    if (gk===undefined)
      gk = 1.0;
    let UPDATE=SplineFlags.UPDATE;
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
            for (let j=0; j<KTOTKS; j++) {
                seg._last_ks[j] = seg.ks[j];
            }
            seg.flag|=SplineFlags.TEMP_TAG;
        }
        else {
          seg.flag&=~SplineFlags.TEMP_TAG;
        }
    }
    function hard_tan_c(params) {
      let seg=params[0], tan=params[1], s=params[2];
      let dv=seg.derivative(s, order, undefined, true);
      dv.normalize();
      let a1=Math.atan2(tan[0], tan[1]);
      let a2=Math.atan2(dv[0], dv[1]);
      let diff=Math.abs(a1-a2);
      return abs(dv.vectorDistance(tan));
    }
    function tan_c(params) {
      let seg1=params[0], seg2=params[1];
      let v, s1=0, s2=0;
      if (seg1.v1===seg2.v1||seg1.v1===seg2.v2)
        v = seg1.v1;
      else 
        if (seg1.v2===seg2.v1||seg1.v2===seg2.v2)
        v = seg1.v2;
      else 
        console.trace("EVIL INCARNATE!");
      let eps=0.0001;
      s1 = v===seg1.v1 ? eps : 1.0-eps;
      s2 = v===seg2.v1 ? eps : 1.0-eps;
      let t1=seg1.derivative(s1, order, undefined, true);
      let t2=seg2.derivative(s2, order, undefined, true);
      t1.normalize();
      t2.normalize();
      if (seg1.v1.eid===seg2.v1.eid||seg1.v2.eid===seg2.v2.eid) {
          t1.negate();
      }
      let d=t1.dot(t2);
      d = mmax(mmin(d, 1.0), -1.0);
      return acos(d);
    }
    function handle_curv_c(params) {
      if (order<4)
        return 0;
      let seg1=params[0], seg2=params[1];
      let h1=params[2], h2=params[3];
      let len1=seg1.ks[KSCALE]-h1.vectorDistance(seg1.handle_vertex(h1));
      let len2=seg2.ks[KSCALE]-h2.vectorDistance(seg2.handle_vertex(h2));
      let k1i=h1===seg1.h1 ? 1 : order-2;
      let k2i=h2===seg2.h1 ? 1 : order-2;
      let k1=(len1!==0.0 ? 1.0/len1 : 0.0)*seg1.ks[KSCALE];
      let k2=(len2!==0.0 ? 1.0/len2 : 0.0)*seg2.ks[KSCALE];
      let s1=seg1.ks[k1i]<0.0 ? -1 : 1;
      let s2=seg2.ks[k2i]<0.0 ? -1 : 1;
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
      let v=params[1], seg=params[0];
      let s1=v===seg.v1 ? 0 : order-1;
      let s2=v===seg.v1 ? order-1 : 0;
      seg.ks[s1]+=(seg.ks[s2]-seg.ks[s1])*gk*0.5;
      return 0.0;
    }
    function get_ratio(seg1, seg2) {
      let ratio=seg1.ks[KSCALE]/seg2.ks[KSCALE];
      if (seg2.ks[KSCALE]===0.0) {
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
      let seg1=params[0], seg2=params[1];
      let v, s1, s2;
      seg1.evaluate(0.5);
      seg2.evaluate(0.5);
      if (seg1.v1===seg2.v1||seg1.v1===seg2.v2)
        v = seg1.v1;
      else 
        if (seg1.v2===seg2.v1||seg1.v2===seg2.v2)
        v = seg1.v2;
      else 
        console.trace("EVIL INCARNATE!");
      let ratio=get_ratio(seg1, seg2);
      let mfac=ratio*gk*0.7;
      s1 = v===seg1.v1 ? 0 : order-1;
      s2 = v===seg2.v1 ? 0 : order-1;
      let sz1=seg1.ks[KSCALE];
      let sz2=seg2.ks[KSCALE];
      let k2sign=s1===s2 ? -1.0 : 1.0;
      let ret=0.0;
      for (let i=0; i<1; i++) {
          let s1=v===seg1.v1 ? i : order-1-i;
          let s2=v===seg2.v1 ? i : order-1-i;
          let k1=seg1.ks[s1]/sz1;
          let k2=k2sign*seg2.ks[s2]/sz2;
          let goalk=(k1+k2)*0.5;
          ret+=abs(k1-goalk)+abs(k2-goalk);
          seg1.ks[s1]+=(goalk*sz1-seg1.ks[s1])*mfac;
          seg2.ks[s2]+=(k2sign*goalk*sz2-seg2.ks[s2])*mfac;
      }
      return ret*5.0;
    }
    function curv_c_spower_basic(params) {
      let seg1=params[0], seg2=params[1];
      let v, s1=0, s2=0;
      seg1.evaluate(0.5);
      seg2.evaluate(0.5);
      if (seg1.v1===seg2.v1||seg1.v1===seg2.v2)
        v = seg1.v1;
      else 
        if (seg1.v2===seg2.v1||seg1.v2===seg2.v2)
        v = seg1.v2;
      else 
        console.trace("EVIL INCARNATE!");
      let ratio=get_ratio(seg1, seg2);
      let mfac=ratio*gk*0.7;
      s1 = v===seg1.v1 ? 0 : order-1;
      s2 = v===seg2.v1 ? 0 : order-1;
      let sz1=seg1.ks[KSCALE];
      let sz2=seg2.ks[KSCALE];
      let k2sign=s1===s2 ? -1.0 : 1.0;
      let ret=0.0;
      let len=Math.floor(order/2);
      for (let i=0; i<1; i++) {
          let s1=v===seg1.v1 ? i : order-1-i;
          let s2=v===seg2.v1 ? i : order-1-i;
          let k1=seg1.ks[s1]/sz1;
          let k2=k2sign*seg2.ks[s2]/sz2;
          let goalk=(k1+k2)*0.5;
          ret+=abs(k1-goalk)+abs(k2-goalk);
          if (i===0) {
              seg1.ks[s1]+=(goalk*sz1-seg1.ks[s1])*mfac;
              seg2.ks[s2]+=(k2sign*goalk*sz2-seg2.ks[s2])*mfac;
          }
          else 
            if (i===1) {
              seg1.ks[s1] = seg1.ks[order-1]-seg1.ks[0];
              seg2.ks[s2] = seg2.ks[order-1]-seg2.ks[0];
          }
          else {
            seg1.ks[s1] = seg2.ks[s2] = 0.0;
          }
      }
      return ret;
    }
    let curv_c=do_basic ? curv_c_spower_basic : curv_c_spower;
    for (let h of spline.handles) {
        let seg=h.owning_segment;
        let v=seg.handle_vertex(h);
        let bad=!h.use;
        bad = bad||seg.v1.vectorDistance(seg.v2)<2;
        bad = bad||!((v.flag)&SplineFlags.UPDATE);
        bad = bad||!h.owning_vertex;
        if (bad) {
            continue;
        }
        let tan1=new Vector3(h).sub(seg.handle_vertex(h)).normalize();
        if (h===seg.h2)
          tan1.negate();
        if (isNaN(tan1.dot(tan1))||tan1.dot(tan1)===0.0) {
            console.log("NaN 4!");
            continue;
        }
        let s=h===seg.h1 ? 0 : 1;
        let do_tan=!((h.flag)&SplineFlags.BREAK_TANGENTS);
        do_tan = do_tan&&!(h.flag&SplineFlags.AUTO_PAIRED_HANDLE);
        if (do_tan) {
            let tc=new constraint("hard_tan_c", 0.25, [seg.ks], order, hard_tan_c, [seg, tan1, s]);
            tc.k2 = 1.0;
            if (update_verts)
              update_verts.add(h);
            slv.add(tc);
        }
        if (h.hpair===undefined)
          continue;
        let ss1=seg, h2=h.hpair, ss2=h2.owning_segment;
        if ((h.flag&SplineFlags.AUTO_PAIRED_HANDLE)&&!((seg.handle_vertex(h).flag&SplineFlags.BREAK_TANGENTS))) {
            let tc=new constraint("tan_c", 0.3, [ss1.ks, ss2.ks], order, tan_c, [ss1, ss2]);
            tc.k2 = 0.8;
            if (update_verts)
              update_verts.add(h);
            slv.add(tc);
        }
        let cc=new constraint("curv_c", 1, [ss1.ks], order, curv_c, [ss1, ss2, h, h2]);
        slv.add(cc);
        cc = new constraint("curv_c", 1, [ss2.ks], order, curv_c, [ss1, ss2, h, h2]);
        slv.add(cc);
        if (update_verts)
          update_verts.add(h);
    }
    let limits={v_curve_limit: 12, 
    v_tan_limit: 1}
    let manual_w=0.08;
    let manual_w_2=0.6;
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
        if (mindis===0.0) {
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
    for (let i=0; i<3; i++) {
        spline.propagate_update_flags();
    }
    for (let seg of spline.segments) {
        seg.updateCoincident();
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
    for (let i=0; i<spline.segments.length; i++) {
        let seg=spline.segments[i];
        seg.evaluate(0.5, undefined, undefined, undefined, true);
        for (let j=0; j<seg.ks.length; j++) {
            if (isNaN(seg.ks[j])) {
                console.log("NaN!");
                seg.ks[j] = 0;
            }
        }
        if (g_app_state.modalstate!==ModalStates.TRANSFROMING) {
            if ((seg.v1.flag&SplineFlags.UPDATE)||(seg.v2.flag&SplineFlags.UPDATE))
              seg.update_aabb();
        }
    }
    for (let f of spline.faces) {
        for (let path of f.paths) {
            for (let l of path) {
                if (l.v.flag&SplineFlags.UPDATE)
                  f.flag|=SplineFlags.UPDATE_AABB;
            }
        }
    }
    if (!spline.is_anim_path) {
        for (let i=0; i<spline.handles.length; i++) {
            let h=spline.handles[i];
            h.flag&=~(SplineFlags.UPDATE|SplineFlags.TEMP_TAG);
        }
        for (let i=0; i<spline.verts.length; i++) {
            let v=spline.verts[i];
            v.flag&=~(SplineFlags.UPDATE|SplineFlags.TEMP_TAG);
        }
    }
    if (spline.on_resolve!==undefined) {
        spline.on_resolve();
        spline.on_resolve = undefined;
    }
  }
  do_solve = _es6_module.add_export('do_solve', do_solve);
}, '/dev/fairmotion/src/curve/spline_math_hermite.js');


es6_module_define('spline_element_array', ["./spline_types.js", "../core/eventdag.js", "../core/struct.js"], function _spline_element_array_module(_es6_module) {
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  var SplineFlags=es6_import_item(_es6_module, './spline_types.js', 'SplineFlags');
  var SplineTypes=es6_import_item(_es6_module, './spline_types.js', 'SplineTypes');
  var CustomDataLayer=es6_import_item(_es6_module, './spline_types.js', 'CustomDataLayer');
  var CustomData=es6_import_item(_es6_module, './spline_types.js', 'CustomData');
  var CustomDataSet=es6_import_item(_es6_module, './spline_types.js', 'CustomDataSet');
  var DataPathNode=es6_import_item(_es6_module, '../core/eventdag.js', 'DataPathNode');
  let SplineLayerFlags={HIDE: 2, 
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
      let ret=[];
      for (let e of this) {
          ret.push(e.eid);
      }
      return ret;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
     afterSTRUCT(spline) {
      if (this.eids===undefined)
        return ;
      let corrupted=false;
      for (let eid of this.eids) {
          let e=spline.eidmap[eid];
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
      let ret=new SplineLayer();
      ret.name = this.new_name();
      ret.id = this.idgen.gen_id();
      this.push(ret);
      return ret;
    }
     new_name() {
      let name="Layer", i=1;
      while ((name+" "+i) in this.namemap) {
        i++;
      }
      return name+" "+i;
    }
     validate_name(name) {
      if (!(name in this.namemap))
        return name;
      let i=1;
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
      let start=this.indexOf(layer);
      if (start==undefined) {
          console.trace("Evil error in change_layer_order!", layer, new_i);
          return ;
      }
      if (new_i==start)
        return ;
      let min=Math.min(new_i, start), max=Math.max(new_i, start);
      let diff=max-min;
      let idx=start;
      if (start>new_i) {
          for (let i=0; i<diff; i++) {
              if (idx<1)
                break;
              let t=this[idx];
              this[idx] = this[idx-1];
              this[idx-1] = t;
              idx--;
          }
      }
      else {
        for (let i=0; i<diff; i++) {
            if (idx>=this.length-1)
              break;
            let t=this[idx];
            this[idx] = this[idx+1];
            this[idx+1] = t;
            idx++;
        }
      }
      this.update_orders();
    }
     update_orders() {
      for (let i=0; i<this.length; i++) {
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
      let i=this.indexOf(layer);
      super.remove(layer);
      delete this.namemap[layer.name];
      delete this.idmap[layer.id];
      if (layer==this.active)
        this._new_active(i);
      this.update_orders();
    }
     pop_i(i) {
      let layer=this[i];
      super.pop_i(i);
      delete this.namemap[layer.name];
      delete this.idmap[layer.id];
      if (layer==this.active)
        this._new_active(i);
      this.update_orders();
    }
     pop() {
      let layer=super.pop();
      delete this.namemap[layer.name];
      delete this.idmap[layer.id];
      if (layer==this.active)
        this._new_active(this.length-1);
    }
    static  fromSTRUCT(reader) {
      let ret=new SplineLayerSet();
      reader(ret);
      for (let i=0; i<ret._layers.length; i++) {
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
      for (let layer of this) {
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
      for (let i=0; i<count; i++) {
          this.cache.push(callback());
          this.free.push(this.cache[this.cache.length-1]);
      }
    }
     push() {
      if (this.free.length==0) {
          console.log("Error in IterCache!");
          return this.callback();
      }
      for (let i=0; i<this.stack.length; i++) {
          let iter=this.stack[i];
          if (iter.is_done()) {
              this.stack.remove(iter);
              i--;
              this.free.push(iter);
          }
      }
      let iter=this.free.pop();
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
      let actlayer=this.layerset.active.id;
      function visible(e) {
        return !e.hidden&&actlayer in e.layers;
      }
      let ret=undefined;
      let good=false;
      let c=0;
      let iter=this.iter;
      do {
        ret = iter.next();
        if (ret.done)
          break;
        let e=ret.value;
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
      let actlayer=this.layerset.active.id;
      function visible(e) {
        return !e.hidden;
      }
      let ret=undefined;
      let good=false;
      let c=0;
      let iter=this.iter;
      do {
        ret = iter.next();
        if (ret.done)
          break;
        let e=ret.value;
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
      
      if (good===false) {
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
    get  visible() {
      let this2=this;
      return (function* () {
        let layerset=this2.layerset;
        for (let e of this2) {
            let bad=e.flag&(SplineFlags.HIDE|SplineFlags.NO_RENDER);
            let ok=false;
            let found=false;
            for (let k in e.layers) {
                found = true;
                let l=layerset.idmap[k];
                if (!(l.flag&SplineLayerFlags.HIDE)) {
                    ok = true;
                }
            }
            if (ok||!found) {
                yield e;
            }
        }
      })();
    }
     dag_get_datapath() {
      let tname;
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
      let suffix="."+tname;
      let name="drawspline";
      for (let i=0; i<this.cdata.layers.length; i++) {
          if (this.cdata.layers[i].name==="TimeDataLayer")
            name = "pathspline";
      }
      return "frameset."+name+suffix;
    }
     remove_undefineds() {
      for (let i=0; i<this.length; i++) {
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
      let i1=this.indexOf(a), i2=this.indexOf(b);
      if (i1<0||i2<0) {
          console.log(i1, i2, a, b);
          throw new Error("Elements not in list");
      }
      this[i2] = a;
      this[i1] = b;
    }
     on_layer_add(layer, i) {
      for (let e of this) {
          e.cdata.on_add(layercls, i);
      }
    }
     on_layer_del(layer, i) {
      for (let e of this) {
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
     onDestroy() {
      for (let e of this) {
          e.onDestroy();
      }
    }
     remove(e, soft_error=false) {
      e.onDestroy();
      let idx=this.indexOf(e);
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
      for (let k in e.layers) {
          let layer=this.layerset.idmap[k];
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
      let changed=!!(e.flag&SplineFlags.SELECT)!=!!state;
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
      for (let i=0; i<this.length; i++) {
          this.setselect(this[i], false);
      }
    }
     select_all() {
      for (let i=0; i<this.length; i++) {
          this.setselect(this[i], true);
      }
    }
    static  fromSTRUCT(reader) {
      let ret=new ElementArray();
      reader(ret);
      ret.cdata.owner = ret;
      let active=ret.active;
      ret.active = undefined;
      for (let i=0; i<ret.arr.length; i++) {
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
      let selected=new ElementArraySet();
      selected.layerset = layerset;
      for (let i=0; i<this.selected.length; i++) {
          let eid=this.selected[i];
          if (!(eid in idmap)) {
              console.log("WARNING: afterSTRUCT: eid", eid, "not in eidmap!", Object.keys(idmap));
              continue;
          }
          selected.add(idmap[this.selected[i]]);
      }
      this.selected = selected;
      for (let e of this) {
          this.local_idmap[e.eid] = e;
          if (e.cdata===undefined) {
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


es6_module_define('spline_base', ["../path.ux/scripts/pathux.js", "../util/mathlib.js", "../core/eventdag.js", "../core/toolprops.js", "../core/struct.js"], function _spline_base_module(_es6_module) {
  var TPropFlags=es6_import_item(_es6_module, '../core/toolprops.js', 'TPropFlags');
  var PropTypes=es6_import_item(_es6_module, '../core/toolprops.js', 'PropTypes');
  let acos=Math.acos, asin=Math.asin, abs=Math.abs, log=Math.log, sqrt=Math.sqrt, pow=Math.pow, PI=Math.PI, floor=Math.floor, min=Math.min, max=Math.max, sin=Math.sin, cos=Math.cos, tan=Math.tan, atan=Math.atan, atan2=Math.atan2, exp=Math.exp;
  var STRUCT=es6_import_item(_es6_module, '../core/struct.js', 'STRUCT');
  es6_import(_es6_module, '../util/mathlib.js');
  var DataPathNode=es6_import_item(_es6_module, '../core/eventdag.js', 'DataPathNode');
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
  const MaterialFlags={SELECT: 1, 
   MASK_TO_FACE: 2}
  _es6_module.add_export('MaterialFlags', MaterialFlags);
  const RecalcFlags={DRAWSORT: 1, 
   SOLVE: 2, 
   ALL: 1|2}
  _es6_module.add_export('RecalcFlags', RecalcFlags);
  const SplineFlags={SELECT: 1, 
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
   REDRAW: 1<<23, 
   COINCIDENT: 1<<24}
  _es6_module.add_export('SplineFlags', SplineFlags);
  const SplineTypes={VERTEX: 1, 
   HANDLE: 2, 
   SEGMENT: 4, 
   LOOP: 8, 
   FACE: 16, 
   ALL: 31}
  _es6_module.add_export('SplineTypes', SplineTypes);
  const ClosestModes={CLOSEST: 0, 
   START: 1, 
   END: 2, 
   ALL: 3}
  _es6_module.add_export('ClosestModes', ClosestModes);
  const IsectModes={CLOSEST: 0, 
   START: 1, 
   END: 2, 
   ENDSTART: 3}
  _es6_module.add_export('IsectModes', IsectModes);
  class empty_class  {
    static  fromSTRUCT(reader) {
      let ret=new empty_class();
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
  let _gtl_co=new Vector2();
  let _gtl_vec=new Vector2();
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
     loadSTRUCT(reader) {
      reader(this);
    }
     curve_effect(owner) {

    }
    static  define() {
      return {typeName: undefined, 
     hasCurveEffect: false, 
     sharedClass: empty_class}
    }
    static  _getDef() {
      if (this.__define&&this.__define.clsname===this.name) {
          return this.__define;
      }
      if (this.define===super.define) {
          throw new Error("define() for customdatalayer doesn't exist!!!");
      }
      let def=this.define();
      def.clsname = this.name;
      if (!def.sharedClass)
        def.sharedClass = empty_class;
      this.__define = def;
      return def;
    }
  }
  _ESClass.register(CustomDataLayer);
  _es6_module.add_class(CustomDataLayer);
  CustomDataLayer = _es6_module.add_export('CustomDataLayer', CustomDataLayer);
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
      for (let i=0; i<src.layers.length; i++) {
          this.layers.push(src.layers[i]);
      }
      for (let k in src.startmap) {
          this.startmap[k] = src.startmap[k];
      }
    }
     add_layer(cls, name=cls._getDef().typeName) {
      let templ=cls;
      let i=this.get_layer(templ._getDef().typeName);
      if (i!==undefined) {
          let n=this.num_layers(templ._getDef().typeName);
          i+=n;
          this.layers.insert(i, templ);
      }
      else {
        i = this.layers.length;
        this.startmap[templ._getDef().typeName] = i;
        this.layers.push(templ);
      }
      let scls=templ._getDef().sharedClass;
      scls = scls===undefined ? empty_class : scls;
      let shared=new scls;
      this.shared_data.push(shared);
      for (let e of this.owner) {
          e.cdata.on_add(templ, i, shared);
      }
      if (this.callbacks.on_add!==undefined)
        this.callbacks.on_add(templ, i, shared);
    }
     gen_edata() {
      let ret=new CustomDataSet();
      for (let i=0; i<this.layers.length; i++) {
          let layer=new this.layers[i]();
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
     has_layer(type) {
      return type in this.startmap;
    }
     get_layer(type, i=0) {
      return this.layers[this.startmap[type]+i];
    }
     num_layers(type) {
      let i=this.get_layer_i(type, 0);
      if (i===undefined||i===-1)
        return 0;
      while (i<this.layers.length&&this.layers[i++].type===type) {
        
      }
      return i;
    }
     loadSTRUCT(reader) {
      reader(this);
      for (let i=0; i<this.layers.length; i++) {
          this.layers[i] = this.layers[i].constructor;
          let l=this.layers[i];
          let typename=l._getDef().typeName;
          if (!(typename in this.startmap)) {
              this.startmap[typename] = i;
          }
      }
      if (this.shared_data.length!==this.layers.length) {
          for (let i=0; i<this.layers.length; i++) {
              let layer=this.layers[i];
              let scls=layer._getDef().sharedClass;
              scls = scls===undefined ? empty_class : scls;
              let shared=new scls;
              if (this.shared_data.length>i)
                this.shared_data[i] = shared;
              else 
                this.shared_data.push(shared);
          }
      }
    }
     afterSTRUCT(element_array, cdata) {
      for (let e of element_array) {
          let i=0;
          for (let layer of e.cdata) {
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
  var $srcs2_hr4Q_interp;
  class CustomDataSet extends Array {
     constructor() {
      super();
    }
     on_add(cls, i, shared) {
      let layer=new cls();
      layer.shared = shared;
      this.insert(i, layer);
    }
     get_layer(cls) {
      for (let i=0; i<this.length; i++) {
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
      while ($srcs2_hr4Q_interp.length<srcs.length) {
        $srcs2_hr4Q_interp.push(0);
      }
      $srcs2_hr4Q_interp.length = srcs.length;
      for (let i=0; i<this.length; i++) {
          for (let j=0; j<srcs.length; j++) {
              $srcs2_hr4Q_interp[j] = srcs[j][i];
          }
          this[i].interp($srcs2_hr4Q_interp, ws);
      }
    }
     copy(src) {
      for (let i=0; i<this.length; i++) {
          this[i].copy(src);
      }
    }
     loadSTRUCT(reader) {
      reader(this);
      for (let i=0; i<this.arr.length; i++) {
          this.push(this.arr[i]);
      }
      delete this.arr;
    }
  }
  var $srcs2_hr4Q_interp=[];
  _ESClass.register(CustomDataSet);
  _es6_module.add_class(CustomDataSet);
  CustomDataSet = _es6_module.add_export('CustomDataSet', CustomDataSet);
  CustomDataSet.STRUCT = `
  CustomDataSet {
    arr : iter(abstract(CustomDataLayer)) | obj;
  }
`;
  let times={}
  function flagwarn(msg, id) {
    if (!(id in times)) {
        times[id] = util.time_ms();
    }
    if (util.time_ms()-times[id]>150) {
        console.warn(msg);
        times[id] = util.time_ms();
    }
  }
  class SplineElement extends DataPathNode {
    
    
    
    
    
    
     constructor(type) {
      super();
      this.type = type;
      this.cdata = new CustomDataSet();
      this.masklayer = 1;
      this.layers = {};
    }
     onDestroy() {

    }
     has_layer() {
      for (let k in this.layers) {
          return true;
      }
      return false;
    }
     dag_get_datapath() {
      let suffix;
      switch (this.type) {
        case SplineTypes.VERTEX:
          suffix = ".verts";
          break;
        case SplineTypes.HANDLE:
          suffix = ".handles";
          break;
        case SplineTypes.SEGMENT:
          suffix = ".segments";
          break;
        case SplineTypes.LOOP:
          suffix = ".loops";
          break;
        case SplineTypes.FACE:
          suffix = ".faces";
          break;
      }
      suffix+="["+this.eid+"]";
      let name="drawspline";
      for (let i=0; i<this.cdata.length; i++) {
          if (this.cdata[i].constructor.name==="TimeDataLayer")
            name = "pathspline";
      }
      return "frameset."+name+suffix;
    }
     in_layer(layer) {
      return layer!==undefined&&layer.id in this.layers;
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
      for (let i=0; i<this.cdata.length; i++) {
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
  let derivative_cache_vs=cachering.fromConstructor(Vector3, 64);
  let closest_point_ret_cache_vs=cachering.fromConstructor(Vector3, 256);
  let closest_point_ret_cache=new cachering(function () {
    return [0, 0];
  }, 256);
  let closest_point_cache_vs=cachering.fromConstructor(Vector3, 64);
  let _gtl_ret_cache=cachering.fromConstructor(Vector3, 64);
  let _gtl_arr=[0, 0];
  let flip_wrapper_cache;
  let _flip_out_tmp=[0];
  class CurveEffect  {
     constructor() {
      this.child = undefined;
      this.prior = undefined;
    }
     rescale(ceff, width) {
      if (this.prior!==undefined)
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
      let i=0, p=this;
      let flip_out=_flip_out_tmp;
      while (p.prior!==undefined) {
        p = p.prior;
        i++;
      }
      p = p._get_nextprev(donext, flip_out);
      let flip=flip_out[0];
      if (p===undefined) {
          return undefined;
      }
      while (i>0) {
        p = p.child;
        i--;
      }
      if (p===undefined) {
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
      if (this.prior!==undefined) {
          return this.prior.evaluate(s);
      }
    }
     derivative(s) {
      let df=0.001;
      let a, b;
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
      let df=0.001;
      let a, b;
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
      let dv1=this.derivative(s);
      let dv2=this.derivative(s);
      return (dv2[0]*dv1[1]-dv2[1]*dv1[0])/Math.pow(dv1[0]*dv1[0]+dv1[1]*dv1[1], 3.0/2.0);
    }
     closest_point(p, mode, fast=false) {
      let minret=undefined, mindis=1e+18, maxdis=0;
      let p2=closest_point_cache_vs.next().zero();
      for (let i=0; i<p.length; i++) {
          p2[i] = p[i];
      }
      p = p2;
      if (mode===undefined)
        mode = 0;
      let steps=5, s=0, ds=1.0/(steps);
      let n=closest_point_cache_vs.next();
      let n1=closest_point_cache_vs.next(), n2=closest_point_cache_vs.next();
      let n3=closest_point_cache_vs.next(), n4=closest_point_cache_vs.next();
      if (mode===ClosestModes.ALL)
        minret = [];
      for (let i=0; i<steps; i++, s+=ds) {
          let start=s-1e-05, end=s+ds+1e-05;
          start = Math.min(Math.max(start, 0.0), 1.0);
          end = Math.min(Math.max(end, 0.0), 1.0);
          let mid=(start+end)*0.5;
          let bad=false;
          let angle_limit=fast ? 0.65 : 0.2;
          let steps=fast ? 5 : 20;
          for (let j=0; j<steps; j++) {
              mid = (start+end)*0.5;
              let co=this.evaluate(mid);
              let sco=this.evaluate(start);
              let eco=this.evaluate(end);
              let d1=this.normal(start).normalize();
              let d2=this.normal(end).normalize();
              let dm=this.normal(mid).normalize();
              n1.load(sco).sub(p).normalize();
              n2.load(eco).sub(p).normalize();
              n.load(co).sub(p).normalize();
              if (n1.dot(d1)<0.0)
                d1.negate();
              if (n2.dot(d2)<0.0)
                d2.negate();
              if (n.dot(dm)<0)
                dm.negate();
              let mang=acos(n.normalizedDot(dm));
              if (mang<0.001)
                break;
              let ang1=acos(n1.normalizedDot(d1));
              let ang2=acos(n2.normalizedDot(d2));
              let w1=n1.cross(d1)[2]<0.0;
              let w2=n2.cross(d2)[2]<0.0;
              let wm=n.cross(dm)[2]<0.0;
              if (isNaN(mang)) {
                  console.log(p, co, mid, dm);
              }
              if (j===0&&w1===w2) {
                  bad = true;
                  break;
              }
              else 
                if (w1===w2) {
              }
              if (w1===w2) {
                  let dis1, dis2;
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
                if (wm===w1) {
                  start = mid;
              }
              else {
                end = mid;
              }
          }
          if (bad)
            continue;
          let co=this.evaluate(mid);
          n1.load(this.normal(mid)).normalize();
          n2.load(co).sub(p).normalize();
          if (n2.dot(n1)<0) {
              n2.negate();
          }
          let angle=acos(Math.min(Math.max(n1.dot(n2), -1), 1));
          if (angle>angle_limit)
            continue;
          if (mode!==ClosestModes.ALL&&minret===undefined) {
              let minret=closest_point_ret_cache.next();
              minret[0] = minret[1] = undefined;
          }
          let dis=co.vectorDistance(p);
          if (mode===ClosestModes.CLOSEST) {
              if (dis<mindis) {
                  minret[0] = closest_point_cache_vs.next().load(co);
                  minret[1] = mid;
                  mindis = dis;
              }
          }
          else 
            if (mode===ClosestModes.START) {
              if (mid<mindis) {
                  minret[0] = closest_point_cache_vs.next().load(co);
                  minret[1] = mid;
                  mindis = mid;
              }
          }
          else 
            if (mode===ClosestModes.END) {
              if (mid>maxdis) {
                  minret[0] = closest_point_cache_vs.next().load(co);
                  minret[1] = mid;
                  maxdis = mid;
              }
          }
          else 
            if (mode===ClosestModes.ALL) {
              let ret=closest_point_ret_cache.next();
              ret[0] = closest_point_cache_vs.next().load(co);
              ret[1] = mid;
              minret.push(ret);
          }
      }
      if (minret===undefined&&mode===ClosestModes.CLOSEST) {
          let v1=this.evaluate(0), v2=this.evaluate(1);
          let dis1=v1.vectorDistance(p), dis2=v2.vectorDistance(p);
          minret = closest_point_ret_cache.next();
          minret[0] = closest_point_cache_vs.next().load(dis1<dis2 ? v1 : v2);
          minret[1] = dis1<dis2 ? 0.0 : 1.0;
      }
      else 
        if (minret===undefined&&mode===ClosestModes.START) {
          minret = closest_point_ret_cache.next();
          minret[0] = closest_point_cache_vs.next().load(this.v1);
          minret[1] = 0.0;
      }
      if (minret===undefined&&mode===ClosestModes.END) {
          minret = closest_point_ret_cache.next();
          minret[0] = closest_point_cache_vs.next().load(this.v2);
          minret[1] = 1.0;
      }
      return minret;
    }
     normal(s) {
      let ret=this.derivative(s);
      let t=ret[0];
      ret[0] = -ret[1];
      ret[1] = t;
      ret.normalize();
      return ret;
    }
     global_to_local(p, no_effects=false, fixed_s=undefined) {
      let ret_cache=_gtl_ret_cache;
      let arr=_gtl_arr;
      let co;
      if (fixed_s!==undefined) {
          arr[0] = this.evaluate(fixed_s);
          arr[1] = fixed_s;
          co = arr;
      }
      else {
        co = this.closest_point(p);
      }
      let _co=_gtl_co;
      let _vec=_gtl_vec;
      let s, t, a=0.0;
      if (co===undefined) {
          co = _co;
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
        s = co.s;
        co = co.co;
        t = p.vectorDistance(co)*0.15;
      }
      let n1=this.normal(s).normalize();
      let n2=_vec.zero().load(p).sub(co).normalize();
      n1[2] = n2[2] = 0.0;
      a = asin(n1[0]*n2[1]-n1[1]*n2[0]);
      let dot=n1.dot(n2);
      co.sub(p);
      co[2] = 0.0;
      t = co.vectorLength();
      if (dot<0.0) {
          t = -t;
          a = 2.0*Math.PI-a;
      }
      let ret=ret_cache.next();
      ret[0] = s;
      ret[1] = t;
      ret[2] = a;
      return ret;
    }
     local_to_global(p) {
      let s=p[0], t=p[1], a=p[2];
      let co=this.evaluate(s);
      let no=this.normal(s).normalize();
      no.mulScalar(t);
      no.rot2d(a);
      co.add(no);
      return co;
    }
  }
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
      if (this.depth===0) {
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


es6_module_define('spline_types', ["./bspline.js", "../core/eventdag.js", "./spline_multires.js", "./spline_base", "../editors/viewport/selectmode.js", "../path.ux/scripts/pathux.js", "./spline_math.js", "../core/toolprops.js", "../core/toolprops_iter.js", "../wasm/native_api.js", "./spline_base.js", "../core/struct.js", "../util/mathlib.js", "../util/bezier.js", "../config/config.js"], function _spline_types_module(_es6_module) {
  "use strict";
  var ENABLE_MULTIRES=es6_import_item(_es6_module, '../config/config.js', 'ENABLE_MULTIRES');
  var PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var bspline=es6_import(_es6_module, './bspline.js');
  var MinMax=es6_import_item(_es6_module, '../util/mathlib.js', 'MinMax');
  var Vector2=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'Vector2');
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
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
  var IsectModes=es6_import_item(_es6_module, './spline_base.js', 'IsectModes');
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
  let eval_ret_vs=cachering.fromConstructor(Vector2, 512);
  let evaluateSide_rets=cachering.fromConstructor(Vector2, 512);
  var bez3=es6_import_item(_es6_module, '../util/bezier.js', 'bez3');
  var bez4=es6_import_item(_es6_module, '../util/bezier.js', 'bez4');
  let _seg_aabb_ret=[new Vector3(), new Vector3()];
  class SplineVertex extends SplineElement {
    
    
    
    
    
     constructor(co) {
      super(SplineTypes.VERTEX);
      Vector2.prototype.initVector2.apply(this, arguments);
      this._no_warning = false;
      if (co!==undefined) {
          this[0] = co[0];
          this[1] = co[1];
      }
      this.type = SplineTypes.VERTEX;
      this.flag = SplineFlags.FRAME_DIRTY|SplineFlags.UPDATE;
      this.segments = [];
      this.eid = 0;
      this.frames = {};
      this.hpair = undefined;
    }
    get  2() {
      return 0.0;
    }
    set  2(val) {
      console.warn("Attempt to set [2] in SplineVertex!");
    }
    get  width() {
      if (this.type!==SplineTypes.VERTEX) {
          console.warn("Dynamic vertex width not supported for handle vertices");
          return 0.0;
      }
      if (!this.segments)
        return 0.0;
      let tot=0.0;
      let sum=0.0;
      for (let s of this.segments) {
          tot++;
          sum+=this===s.v1 ? s.w1 : s.w2;
      }
      return tot ? sum/tot : 0.0;
    }
    set  width(w) {
      if (this.type!==SplineTypes.VERTEX) {
          console.warn("Dynamic vertex width not supported for handle vertices");
          return ;
      }
      if (!this.segments)
        return ;
      let old=this.width;
      if (w===0.0) {
          console.warn("Cannot set width to zero");
          return ;
      }
      if (isNaN(old)||old===0.0) {
          console.warn("Corrupted width data; fixing...");
          for (let s of this.segments) {
              if (isNaN(s.w1)||s.w1===0.0)
                s.w1 = w;
              if (isNaN(s.w2)||s.w2===0.0)
                s.w2 = w;
              s.mat.update();
          }
          return ;
      }
      let ratio=w/old;
      for (let s of this.segments) {
          if (this===s.v1)
            s.w1*=ratio;
          else 
            if (this===s.v2)
            s.w2*=ratio;
          else 
            throw new Error("spline mesh integrity error");
          s.mat.update();
      }
      if (this.segments.length===2) {
          let s1=this.segments[0];
          let s2=this.segments[1];
          let w1=this===s1.v1 ? s1.w1 : s1.w2;
          let w2=this===s2.v1 ? s2.w1 : s2.w2;
          let w=(w1+w2)*0.5;
          s1.setVertWidth(this, w);
          s2.setVertWidth(this, w);
      }
    }
    get  shift() {
      if (!this.segments)
        return ;
      if (this.segments.length!==2) {
          return 0.0;
      }
      let tot=0.0;
      let sum=0.0;
      if (this.segments.length===2) {
          let s1=this.segments[0];
          let s2=this.segments[1];
          let shift1=this===s1.v1 ? s1.shift1 : s1.shift2;
          let shift2=this===s2.v1 ? s2.shift1 : s2.shift2;
          if ((this===s1.v1)===(this===s2.v1)) {
              sum = shift1-shift2;
          }
          else {
            sum = shift1+shift2;
          }
          tot = 2.0;
      }
      else {
        for (let s of this.segments) {
            tot++;
            sum+=this===s.v1 ? -s.shift1 : s.shift2;
        }
      }
      return tot ? sum/tot : 0.0;
    }
    set  shift(w) {
      if (!this.segments||this.segments.length!==2)
        return ;
      let tot=0.0;
      let sum=0.0;
      let old=this.shift;
      let df=w-old;
      if (this.segments.length===2) {
          let s1=this.segments[0];
          let s2=this.segments[1];
          let shift1=this===s1.v1 ? s1.shift1 : s1.shift2;
          let shift2=this===s2.v1 ? s2.shift1 : s2.shift2;
          if ((this===s1.v1)===(this===s2.v1)) {
              shift1+=df;
              shift2-=df;
          }
          else {
            shift1+=df;
            shift2+=df;
          }
          if (this===s1.v1)
            s1.shift1 = shift1;
          else 
            s1.shift2 = shift1;
          if (this===s2.v1)
            s2.shift1 = shift2;
          else 
            s2.shift2 = shift2;
          s1.mat.update();
          s2.mat.update();
      }
      else {
        for (let s of this.segments) {
            if (this===s.v1) {
                s.shift1+=df;
            }
            else {
              s.shift2+=df;
            }
            s.mat.update();
        }
      }
    }
    set  __shift(w) {
      if (!this.segments)
        return ;
      let old=this.shift;
      let df=w-old;
      for (let s of this.segments) {
          if (this===s.v1) {
              s.shift1-=df;
          }
          else {
            s.shift2+=df;
          }
          s.mat.update();
      }
    }
    static  nodedef() {
      return {name: "SplineVertex", 
     uiName: "SplineVertex", 
     inputs: {}, 
     outputs: NodeBase.Inherit()}
    }
    get  aabb() {
      let ret=_seg_aabb_ret;
      ret[0].load(this);
      ret[1].load(this);
      return ret;
    }
     sethide(state) {
      if (state)
        this.flag|=SplineFlags.HIDE;
      else 
        this.flag&=~SplineFlags.HIDE;
      if (this.type===SplineTypes.HANDLE)
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
      if (this.type===SplineTypes.VERTEX) {
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
      if (this.type!==SplineTypes.HANDLE)
        return true;
      var s=this.owning_segment;
      if (s===undefined) {
          console.warn("Corrupted handle detected", this.eid);
          return false;
      }
      var v=s.handle_vertex(this);
      var ret=v!==undefined&&(v.segments!==undefined&&v.segments.length>2||(v.flag&SplineFlags.USE_HANDLES));
      return ret;
    }
    set  hidden(value) {
      if (value)
        this.flag|=SplineFlags.HIDE;
      else 
        this.flag&=~SplineFlags.HIDE;
    }
    get  valence() {
      return this.segments.length;
    }
     other_segment(s) {
      if (s===this.segments[0])
        s = this.segments[1];
      else 
        if (s===this.segments[1])
        s = this.segments[0];
      if (!s) {
          throw new Error("bad segment in SplineVertex.prototype.other_segment()");
      }
      if (s.v1!==this&&s.v2!==this) {
          throw new Error("mesh integrity error");
      }
      return s;
    }
     toJSON() {
      var ret={};
      ret.frame = this.frame;
      ret.segments = [];
      ret[0] = this[0];
      ret[1] = this[1];
      ret.frames = this.frames;
      ret.length = 3;
      for (var i=0; i<this.segments.length; i++) {
          if (this.segments[i]!==undefined)
            ret.segments.push(this.segments[i].eid);
      }
      ret.flag = this.flag;
      ret.eid = this.eid;
      return ret;
    }
     loadSTRUCT(reader) {
      this._no_warning = true;
      reader(this);
      super.loadSTRUCT(reader);
      this._no_warning = false;
      this.load(this.co);
      delete this.co;
      for (let axis=0; axis<2; axis++) {
          if (isNaN(this[axis])) {
              console.warn("NaN vertex", this.eid);
              this[axis] = 0;
          }
      }
      return this;
    }
  }
  _ESClass.register(SplineVertex);
  _es6_module.add_class(SplineVertex);
  SplineVertex = _es6_module.add_export('SplineVertex', SplineVertex);
  
  SplineVertex.STRUCT = STRUCT.inherit(SplineVertex, SplineElement)+`
  co       : vec2          | this;
  segments : array(e, int) | e.eid;
  hpair    : int           | this.hpair != undefined? this.hpair.eid : -1;
}
`;
  mixin(SplineVertex, Vector2);
  class ClosestPointRecord  {
    
    
    
     constructor() {
      this.s = 0;
      this.co = new Vector2();
      this.sign = 1.0;
    }
     reset() {
      this.sign = this.s = undefined;
      return this;
    }
  }
  _ESClass.register(ClosestPointRecord);
  _es6_module.add_class(ClosestPointRecord);
  ClosestPointRecord = _es6_module.add_export('ClosestPointRecord', ClosestPointRecord);
  var derivative_cache_vs=cachering.fromConstructor(Vector3, 64);
  var closest_point_ret_cache_vs=cachering.fromConstructor(Vector3, 256);
  var closest_point_ret_cache=cachering.fromConstructor(ClosestPointRecord, 256);
  var closest_point_cache_vs=cachering.fromConstructor(Vector3, 512);
  class EffectWrapper extends CurveEffect {
    
     constructor(owner) {
      super();
      this.seg = owner;
    }
     rescale(ceff, width) {
      while (ceff.prior!==undefined) {
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
      if (v.segments.length!==2)
        return undefined;
      var seg2=v.other_segment(seg1);
      flip_out[0] = (donext&&seg2.v1===v)||(!donext&&seg2.v2===v);
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
  let intersect_rets=new cachering(() =>    {
    return {co: new Vector2(), 
    targetS: 0, 
    sourceS: 0}
  }, 512);
  let __static_minmax=new MinMax(2);
  let __angle_temp=cachering.fromConstructor(Vector2, 64);
  let bstmp1=new Array(32);
  let bstmp2=new Array(32);
  let bstmp3=new Array(32);
  let bstmpb=[0, 0];
  let shiftout=[0];
  class SplineSegment extends SplineElement {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
     constructor(v1, v2) {
      super(SplineTypes.SEGMENT);
      this._evalwrap = new EffectWrapper(this);
      this.l = undefined;
      this.w1 = 1.0;
      this.w2 = 1.0;
      this.shift1 = 0.0;
      this.shift2 = 0.0;
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
     onDestroy() {
      native_api.onSegmentDestroy(this);
    }
     sinangle(v) {
      if (v.segments.length===2) {
          let s1=this;
          let s2=v.other_segment(s1);
          let t1=__angle_temp.next();
          let t2=__angle_temp.next();
          let v1=s1.other_vert(v);
          let v2=s2.other_vert(v);
          t1.load(v1).sub(v);
          t2.load(v2).sub(v);
          if (t1.dot(t1)<1e-05||t2.dot(t2)<1e-05) {
              return 0.0;
          }
          t1.normalize();
          t2.normalize();
          let th=-(t1[0]*t2[1]-t1[1]*t2[0]);
          let eps=0.0001;
          th = th*(1.0-eps*2.0)+eps*Math.sign(th);
          return th;
      }
      return 0.0;
    }
     shift(s) {
      this.width(s, shiftout);
      return shiftout[0];
      s = s*s*(3.0-2.0*s);
      let ret=this.shift1+(this.shift2-this.shift1)*s;
      return ret;
    }
     dshift(s) {
      let df=0.0001;
      let a=this.shift(s-df);
      let b=this.shift(s+df);
      return (b-a)/(2.0*df);
    }
     dwidth(s) {
      let df=0.0001;
      let a=this.width(s-df);
      let b=this.width(s+df);
      return (b-a)/(2.0*df);
    }
     setVertWidth(v, w) {
      if (w===undefined||isNaN(w)) {
          console.warn("Got bad width data", w);
      }
      if (v===this.v1) {
          this.w1 = w;
      }
      else 
        if (v===this.v2) {
          this.w2 = w;
      }
      else {
        console.log(this, v, "bleh");
        throw new Error("vertex not in edge "+v);
      }
    }
     widthFunction(s) {
      return s;
    }
     width(s, outShift) {
      let seg=this;
      let v;
      let len;
      function walk() {
        let lastv=v;
        if (v.segments.length===2) {
            seg = v.other_segment(seg);
            v = seg.other_vert(v);
        }
        len = seg.length;
        len = Math.max(len, 0.0001);
        bstmpb[0] = (v===seg.v1 ? seg.w1 : seg.w2)*seg.mat.linewidth;
        bstmpb[1] = v===seg.v1 ? seg.shift1 : seg.shift2;
        return bstmpb;
      }
      v = this.v1;
      seg = this;
      let l0b, l0, l1, l2, l3, l4, l5, l6, l7, l8;
      l3 = Math.max(seg.length, 0.0001);
      l4 = l3;
      let w3=this.w1*this.mat.linewidth;
      let s3=this.shift1;
      let $_t0qhtl=walk(), w2=$_t0qhtl[0], s2=$_t0qhtl[1];
      l2 = len;
      let $_t1rnqv=walk(), w1=$_t1rnqv[0], s1=$_t1rnqv[1];
      l1 = len;
      let $_t2haia=walk(), w0=$_t2haia[0], s0=$_t2haia[1];
      l0 = len;
      let $_t3umvq=walk(), w0b=$_t3umvq[0], s0b=$_t3umvq[1];
      l0b = len;
      seg = this;
      v = this.v2;
      let w4=this.w2*this.mat.linewidth;
      let s4=this.shift2;
      let $_t4rqow=walk(), w5=$_t4rqow[0], s5=$_t4rqow[1];
      l5 = len;
      let $_t5hjdj=walk(), w6=$_t5hjdj[0], s6=$_t5hjdj[1];
      l6 = len;
      let $_t6hwmo=walk(), w7=$_t6hwmo[0], s7=$_t6hwmo[1];
      l7 = len;
      let $_t7cmra=walk(), w8=$_t7cmra[0], s8=$_t7cmra[1];
      l8 = len;
      seg = this;
      let ks=bstmp1;
      let ws=bstmp2;
      let ss=bstmp3;
      bstmp1.length = 5;
      bstmp2.length = 5;
      ks[0] = -l0-l1-l2;
      ks[1] = -l1-l2;
      ks[2] = -l2;
      ks[3] = 0;
      ks[4] = l4;
      ks[5] = l4+l5;
      ks[6] = l4+l5+l6;
      ks[7] = l4+l5+l6+l7;
      ws[0] = w2;
      ws[1] = w3;
      ws[2] = w4;
      ws[3] = w5;
      ws[4] = w6;
      ws[5] = w7;
      ws[6] = w8;
      ss[0] = s2;
      ss[1] = s3;
      ss[2] = s4;
      ss[3] = s5;
      ss[4] = s6;
      ss[5] = s7;
      ss[6] = s8;
      if (l4===0.0) {
          return 0.0;
      }
      s*=l4;
      if (outShift) {
          outShift[0] = bspline.deBoor(3, s, ks, ss, 3);
      }
      return bspline.deBoor(3, s, ks, ws, 3);
    }
     _material_update(spline) {
      if (spline&&spline.segmentNeedsResort(this)) {
          console.log("segment material flagged resort!");
          spline.regen_sort();
      }
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
      let minmax=__static_minmax;
      minmax.reset();
      min.zero();
      max.zero();
      var co=this.evaluate(0);
      minmax.minmax(co);
      var ds=1.0/(steps-1);
      for (let i=0, s=0; i<steps; i++, s+=ds) {
          var co=this.evaluate(s*0.999999999);
          minmax.minmax(co);
      }
      min.load(minmax.min);
      max.load(minmax.max);
    }
     intersect(seg, side1=false, side2=false, mode=IsectModes.CLOSEST) {
      if (this.flag&SplineFlags.COINCIDENT) {
          return undefined;
      }
      let steps=5;
      let lastco=undefined, lastno;
      let p1=new Vector2();
      let p2=new Vector2();
      let p3=new Vector2();
      let p4=new Vector2();
      let mindis=undefined;
      let minret=new Vector2();
      let mins, mins2;
      let s=0, ds=1.0/(steps-1);
      for (let i=0; i<steps; i++, s+=ds) {
          let s1=s, s2=s+ds;
          let co1=this.evaluateSide(s1, side1);
          let co2=this.evaluateSide(s2, side1);
          let cl1=seg.closest_point(co1, ClosestModes.CLOSEST, undefined, side2);
          let cl2=seg.closest_point(co2, ClosestModes.CLOSEST, undefined, side2);
          let p1=cl1.co;
          let p2=cl2.co;
          if (cl1.sign!==cl2.sign) {
              for (let bi=0; bi<2; bi++) {
                  let s3=(s1+s)*0.5;
                  let s4=(s2+s)*0.5;
                  for (let j=0; j<2; j++) {
                      let s5=j ? s4 : s3;
                      let co3=this.evaluateSide(s5, side1);
                      let cl3=seg.closest_point(co3, ClosestModes.CLOSEST, undefined, side2);
                      if (cl3.sign!==cl1.sign) {
                          s2 = s5;
                          break;
                      }
                      else 
                        if (cl3.sign!==cl2.sign) {
                          s1 = s5;
                          break;
                      }
                  }
                  s = (s1+s2)*0.5;
              }
              co1 = this.evaluateSide(s1, side1);
              cl1 = seg.closest_point(co1, ClosestModes.CLOSEST, undefined, side2);
              let dis1;
              if (mode===IsectModes.START) {
                  dis1 = cl1.s;
              }
              else 
                if (mode===IsectModes.END) {
                  dis1 = 1.0-cl1.s;
              }
              else 
                if (mode===IsectModes.ENDSTART) {
                  dis1 = 1.0-Math.abs(cl1.s-0.5)*2.0;
              }
              else {
                dis1 = co1.vectorDistance(cl1.co);
              }
              if (mindis===undefined||dis1<mindis) {
                  minret.load(co1);
                  mins = cl1.s;
                  mins2 = s1;
                  mindis = dis1;
              }
          }
      }
      if (mindis!==undefined) {
          let ret=intersect_rets.next();
          ret.co.load(minret);
          ret.targetS = mins;
          ret.sourceS = mins2;
          return ret;
      }
      return undefined;
    }
     closest_point(p, mode, fast=false, widthSide=undefined) {
      if (this.flag&SplineFlags.COINCIDENT) {
          return undefined;
      }
      var minret=undefined, mindis=1e+18, maxdis=0;
      var p2=closest_point_cache_vs.next().zero();
      for (var i=0; i<p.length; i++) {
          p2[i] = p[i];
      }
      p = p2;
      if (mode===undefined)
        mode = 0;
      var steps=5, s=0, ds=1.0/(steps);
      var n=closest_point_cache_vs.next();
      var n1=closest_point_cache_vs.next(), n2=closest_point_cache_vs.next();
      var n3=closest_point_cache_vs.next(), n4=closest_point_cache_vs.next();
      if (mode===ClosestModes.ALL)
        minret = [];
      let d1=closest_point_cache_vs.next();
      let d2=closest_point_cache_vs.next();
      let dm=closest_point_cache_vs.next();
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
              let co, sco, eco;
              if (widthSide!==undefined) {
                  co = this.evaluateSide(start, widthSide, undefined, d1);
                  sco = this.evaluateSide(mid, widthSide, undefined, dm);
                  eco = this.evaluateSide(end, widthSide, undefined, d2);
                  d1.normalize();
                  d2.normalize();
                  dm.normalize();
              }
              else {
                co = this.evaluate(mid, undefined, undefined, undefined, true);
                sco = this.evaluate(start, undefined, undefined, undefined, true);
                eco = this.evaluate(end, undefined, undefined, undefined, true);
                d1.load(this.normal(start, true).normalize());
                dm.load(this.normal(mid, true).normalize());
                d2.load(this.normal(end, true).normalize());
              }
              sco[2] = eco[2] = co[2] = 0.0;
              n1.load(sco).sub(p).normalize();
              n2.load(eco).sub(p).normalize();
              n.load(co).sub(p);
              n[2] = 0.0;
              n.normalize();
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
                  if (!window.__adssad)
                    window.__adssad = 0;
                  if (time_ms()-window.__adssad>500) {
                      console.warn("NaN!", p, co, mid, dm, n, mang);
                      window.__adssad = time_ms();
                      mang = 0.0;
                      n.zero();
                  }
              }
              if (j===0&&w1===w2) {
                  bad = true;
                  break;
              }
              else 
                if (w1===w2) {
              }
              if (w1===w2) {
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
                if (wm===w1) {
                  start = mid;
              }
              else {
                end = mid;
              }
          }
          if (bad)
            continue;
          let co;
          if (widthSide) {
              co = this.evaluateSide(mid, widthSide, undefined, n1);
              n1.normalize();
          }
          else {
            co = this.evaluate(mid, undefined, undefined, undefined, true);
            n1.load(this.normal(mid, true)).normalize();
          }
          n2.load(co).sub(p).normalize();
          let sign=1.0;
          if (n2.dot(n1)<0) {
              sign = -1.0;
              n2.negate();
          }
          var angle=acos(Math.min(Math.max(n1.dot(n2), -1), 1));
          if (angle>angle_limit)
            continue;
          if (mode!==ClosestModes.ALL&&minret===undefined) {
              minret = closest_point_ret_cache.next().reset();
          }
          var dis=co.vectorDistance(p);
          if (mode===ClosestModes.CLOSEST) {
              if (dis<mindis) {
                  minret.co.load(co);
                  minret.s = mid;
                  minret.sign = sign;
                  mindis = dis;
              }
          }
          else 
            if (mode===ClosestModes.START) {
              if (mid<mindis) {
                  minret.co.load(co);
                  minret.s = mid;
                  minret.sign = sign;
                  mindis = mid;
              }
          }
          else 
            if (mode===ClosestModes.END) {
              if (mid>maxdis) {
                  minret.co.load(co);
                  minret.s = mid;
                  minret.sign = sign;
                  maxdis = mid;
              }
          }
          else 
            if (mode===ClosestModes.ALL) {
              let ret=closest_point_ret_cache.next().reset();
              ret.co.load(co);
              ret.s = mid;
              ret.sign = sign;
              minret.push(ret);
          }
      }
      if (minret===undefined&&mode===ClosestModes.CLOSEST) {
          var dis1=this.v1.vectorDistance(p), dis2=this.v2.vectorDistance(p);
          minret = closest_point_ret_cache.next().reset();
          minret.co.load(dis1<dis2 ? this.v1 : this.v2);
          minret.s = dis1<dis2 ? 0.0 : 1.0;
          minret.sign = 1.0;
      }
      else 
        if (minret===undefined&&mode===ClosestModes.START) {
          minret = closest_point_ret_cache.next();
          minret.co.load(this.v1);
          minret.s = 0.0;
          minret.sign = 1.0;
      }
      if (minret===undefined&&mode===ClosestModes.END) {
          minret = closest_point_ret_cache.next();
          minret.co.load(this.v2);
          minret.s = 1.0;
          minret.sign = 1.0;
      }
      return minret;
    }
     normal(s, no_effects=!ENABLE_MULTIRES) {
      if (this.flag&SplineFlags.COINCIDENT) {
          return derivative_cache_vs.next().zero();
      }
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
      if (h.hpair!==undefined) {
          var seg=h.hpair.owning_segment;
          var v=this.handle_vertex(h);
          var len=h.hpair.vectorDistance(v);
          h.hpair.load(h).sub(v).negate().normalize().mulScalar(len).add(v);
          seg.update();
          return h.hpair;
      }
      else 
        if (ov.segments.length===2&&h.use&&!(ov.flag&SplineFlags.BREAK_TANGENTS)) {
          var h2=h.owning_vertex.other_segment(h.owning_segment).handle(h.owning_vertex);
          var hv=h2.owning_segment.handle_vertex(h2), len=h2.vectorDistance(hv);
          h2.load(h).sub(hv).negate().normalize().mulScalar(len).add(hv);
          h2.owning_segment.update();
          return h2;
      }
    }
     other_handle(h_or_v) {
      if (h_or_v===this.v1)
        return this.h2;
      if (h_or_v===this.v2)
        return this.h1;
      if (h_or_v===this.h1)
        return this.h2;
      if (h_or_v===this.h2)
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
      ret.h1 = this.h1!==undefined ? this.h1.eid : -1;
      ret.h2 = this.h2!==undefined ? this.h2.eid : -1;
      ret.eid = this.eid;
      ret.flag = this.flag;
      return ret;
    }
     curvature(s, order, override_scale) {
      if (order===undefined)
        order = ORDER;
      if (this.flag&SplineFlags.COINCIDENT) {
          return 0.0;
      }
      eval_curve(this, 0.5, this.v1, this.v2, this.ks, order, 1);
      var k=spiralcurvature(s, this.ks, order);
      return k/(1e-07+this.ks[KSCALE]);
    }
     curvature_dv(s, order, override_scale) {
      if (order===undefined)
        order = ORDER;
      if (this.flag&SplineFlags.COINCIDENT) {
          return 0.0;
      }
      eval_curve(this, 0.5, this.v1, this.v2, this.ks, order, 1);
      var k=spiralcurvature_dv(s, this.ks, order);
      return k/(1e-05+this.ks[KSCALE]);
    }
     derivative(s, order, no_update_curve, no_effects) {
      if (this.flag&SplineFlags.COINCIDENT) {
          return derivative_cache_vs.next().zero();
      }
      if (order===undefined)
        order = ORDER;
      var ret=derivative_cache_vs.next().zero();
      var ks=this.ks;
      if (!no_update_curve)
        eval_curve(this, 0.5, this.v1, this.v2, ks, order, 1);
      var th=spiraltheta(s, ks, order);
      var k=spiralcurvature(s, ks, order);
      var ang=ks[KANGLE];
      ret[0] = sin(th+ang)*ks[KSCALE];
      ret[1] = cos(th+ang)*ks[KSCALE];
      if (ret.length>2)
        ret[2] = 0.0;
      return ret;
    }
     theta(s, order, no_effects) {
      if (order===undefined)
        order = ORDER;
      return spiraltheta(s, this.ks, order)*this.ks[KSCALE];
    }
     offset_eval(s, offset, order, no_update) {
      if (order===undefined)
        order = ORDER;
      var ret=this.evaluate(s, order, undefined, no_update);
      if (offset===0.0)
        return ret;
      var tan=this.derivative(s, order, no_update);
      var t=tan[0];
      tan[0] = -tan[1];
      tan[1] = t;
      tan.normalize().mulScalar(offset);
      ret.add(tan);
      return ret;
    }
     curvatureSide(s, side, no_out) {
      let df=0.0001;
      let dv0=this.evaluateSide(s, side);
      let dv1=this.evaluateSide(s+df, side);
      let dv2=this.evaluateSide(s+df*2, side);
      dv2.sub(dv1).mulScalar(1.0/df);
      dv1.sub(dv0).mulScalar(1.0/df);
      dv2.sub(dv1).mulScalar(1.0/df);
      let k=(dv1[0]*dv2[1]-dv1[1]*dv2[0])/Math.pow(dv1.dot(dv1), 3.0/2.0);
      if (no_out) {
          dv1.normalize();
          let t=dv1[0];
          dv1[0] = -dv1[1];
          dv1[1] = t;
          no_out[0] = dv1[0];
          no_out[1] = dv1[1];
      }
      return k;
    }
     evaluateSide(s, side=0, dv_out, normal_out, lw_dlw_out) {
      if (this.flag&SplineFlags.COINCIDENT) {
          if (dv_out) {
              dv_out[0] = dv_out[1] = 0.0;
          }
          if (normal_out) {
              normal_out[0] = normal_out[1] = 0.0;
          }
          if (lw_dlw_out) {
              lw_dlw_out[0] = lw_dlw_out[1] = 0.0;
          }
          return evaluateSide_rets.next().load(this.v1);
      }
      side = side ? 1.0 : -1.0;
      let co=evaluateSide_rets.next().load(this.evaluate(s));
      let dv=this.derivative(s);
      let shift=this.shift(s)*side;
      let dshift=this.dshift(s)*side;
      let lw=this.width(s)*side;
      let dlw=this.dwidth(s)*side;
      dlw = dlw*shift+dlw+dshift*lw;
      lw = lw+lw*shift;
      let dx=-dv[1]*lw*0.5/this.length;
      let dy=dv[0]*lw*0.5/this.length;
      if (normal_out) {
          normal_out[0] = dx;
          normal_out[1] = dy;
      }
      if (lw_dlw_out) {
          lw_dlw_out[0] = lw;
          lw_dlw_out[1] = dlw;
      }
      if (dv_out) {
          let seglen=this.length;
          let k=-seglen*this.curvature(s);
          let dx2=(-0.5*(dlw*dv[1]+dv[0]*k*lw-2*dv[0]*seglen))/seglen;
          let dy2=(0.5*(dlw*dv[0]-dv[1]*k*lw+2*dv[1]*seglen))/seglen;
          dv_out[0] = dx2;
          dv_out[1] = dy2;
      }
      co[0]+=dx;
      co[1]+=dy;
      return co;
    }
     evaluate(s, order, override_scale, no_update, no_effects=!ENABLE_MULTIRES) {
      if (this.flag&SplineFlags.COINCIDENT) {
          return eval_ret_vs.next().load(this.v1);
      }
      if (no_effects) {
          if (order===undefined)
            order = ORDER;
          s = (s+1e-08)*(1.0-2e-08);
          s-=0.5;
          var co=eval_curve(this, s, this.v1, this.v2, this.ks, order, undefined, no_update);
          return eval_ret_vs.next().load(co);
      }
      else {
        var wrap=this._evalwrap;
        var last=wrap;
        for (var i=0; i<this.cdata.length; i++) {
            if (this.cdata[i].constructor._getDef().hasCurveEffect) {
                var eff=this.cdata[i].curve_effect(this);
                eff.set_parent(last);
                last = eff;
            }
        }
        return eval_ret_vs.next().load(last.evaluate(s));
      }
    }
     post_solve() {
      super.post_solve();
    }
     updateCoincident() {
      if (this.v1.vectorDistance(this.v2)<0.001) {
          this.flag|=SplineFlags.COINCIDENT;
      }
      else {
        this.flag&=~SplineFlags.COINCIDENT;
      }
    }
     update() {
      this.updateCoincident();
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
      if (this.v1===s.v1||this.v1===s.v2)
        return this.v1;
      if (this.v2===s.v1||this.v2===s.v2)
        return this.v2;
    }
     other_vert(v) {
      if (v===this.v1)
        return this.v2;
      if (v===this.v2)
        return this.v1;
      console.log(this.v1.eid, this.v2.eid, v ? v.eid : v, this.eid, v);
      throw new Error("vertex not in segment: "+(v ? v.eid : v));
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.flag&=~(SplineFlags.UPDATE|SplineFlags.REDRAW);
      this.mat.update = this._material_update.bind(this);
    }
  }
  _ESClass.register(SplineSegment);
  _es6_module.add_class(SplineSegment);
  SplineSegment = _es6_module.add_export('SplineSegment', SplineSegment);
  SplineSegment.STRUCT = STRUCT.inherit(SplineSegment, SplineElement)+`
  ks       : array(float);
  
  v1       : int | obj.v1.eid;
  v2       : int | obj.v2.eid;
  
  h1       : int | obj.h1 != undefined ? obj.h1.eid : -1;
  h2       : int | obj.h2 != undefined ? obj.h2.eid : -1;
  
  w1       : float;
  w2       : float;
  
  shift1   : float;
  shift2   : float;
  
  l        : int | obj.l != undefined  ? obj.l.eid : -1;
  
  mat      : Material;

  aabb     : array(vec3);
  z        : float;
  finalz   : float;
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
  var $cent_ix6j_update_winding;
  class SplineLoopPath  {
    
     constructor(l, f) {
      this.l = l;
      this.f = f;
      this.totvert = undefined;
      this.winding = 0;
    }
     [Symbol.iterator]() {
      if (this.itercache===undefined) {
          this.itercache = cachering.fromConstructor(SplineLoopPathIter, 4);
      }
      return this.itercache.next().init(this);
    }
     update_winding() {
      $cent_ix6j_update_winding.zero();
      for (var l of this) {
          $cent_ix6j_update_winding.add(l.v);
      }
      $cent_ix6j_update_winding.mulScalar(1.0/this.totvert);
      var wsum=0;
      for (var l of this) {
          wsum+=math.winding(l.v, l.next.v, $cent_ix6j_update_winding) ? 1 : -1;
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
  var $cent_ix6j_update_winding=new Vector3();
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
  var $minmax_FUFd_update_aabb;
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
      $minmax_FUFd_update_aabb.reset();
      for (var path of this.paths) {
          for (var l of path) {
              $minmax_FUFd_update_aabb.minmax(l.v.aabb[0]);
              $minmax_FUFd_update_aabb.minmax(l.v.aabb[1]);
              $minmax_FUFd_update_aabb.minmax(l.s.aabb[0]);
              $minmax_FUFd_update_aabb.minmax(l.s.aabb[1]);
          }
      }
      this._aabb[0].load($minmax_FUFd_update_aabb.min);
      this._aabb[1].load($minmax_FUFd_update_aabb.max);
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
  var $minmax_FUFd_update_aabb=new MinMax(3);
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
      this.fillcolor = new Vector4([0, 0, 0, 1]);
      this.strokecolor = new Vector4([0, 0, 0, 1]);
      this.strokecolor2 = new Vector4([0, 0, 0, 1]);
      this.linewidth = 2.0;
      this.linewidth2 = 0.0;
      this.flag = 0;
      this.opacity = 1.0;
      this.fill_over_stroke = false;
      this.blur = 0.0;
    }
     update(optional_spline) {
      throw new Error("override me! should have happened in splinesegment or splineface constructors!");
    }
     equals(is_stroke, mat) {
      let color1=is_stroke ? this.strokecolor : this.fillcolor;
      let color2=is_stroke ? mat.strokecolor : mat.fillcolor;
      for (var i=0; i<4; i++) {
          if (color1[i]!==color2[i])
            return false;
      }
      if (this.flag!==mat.flag)
        return false;
      if (this.opacity!==mat.opacity)
        return false;
      if (this.blur!==mat.blur)
        return false;
      if (is_stroke&&this.linewidth!==mat.linewidth)
        return false;
      return true;
    }
     load(mat) {
      for (var i=0; i<4; i++) {
          this.fillcolor[i] = mat.fillcolor[i];
          this.strokecolor[i] = mat.strokecolor[i];
          this.strokecolor2[i] = mat.strokecolor2[i];
      }
      this.opacity = mat.opacity;
      this.linewidth = mat.linewidth;
      this.fill_over_stroke = mat.fill_over_stroke;
      this.blur = mat.blur;
      this.linewidth2 = mat.linewidth2;
      this.flag = mat.flag;
      return this;
    }
    get  css_fillcolor() {
      var r=Math.floor(this.fillcolor[0]*255);
      var g=Math.floor(this.fillcolor[1]*255);
      var b=Math.floor(this.fillcolor[2]*255);
      return "rgba("+r+","+g+","+b+","+this.fillcolor[3]+")";
    }
     loadSTRUCT(reader) {
      reader(this);
      this.fillcolor = new Vector4(this.fillcolor);
      if (isNaN(this.fillcolor[3])) {
          this.fillcolor[3] = 1.0;
      }
      this.strokecolor = new Vector4(this.strokecolor);
      if (isNaN(this.strokecolor[3])) {
          this.strokecolor[3] = 1.0;
      }
    }
  }
  _ESClass.register(Material);
  _es6_module.add_class(Material);
  Material = _es6_module.add_export('Material', Material);
  Material.STRUCT = `
  Material {
    fillcolor        : vec4;
    strokecolor      : vec4;
    strokecolor2     : vec4;
    opacity          : float;
    fill_over_stroke : int;
    linewidth        : float;
    linewidth2       : float;
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
  var native_api=es6_import(_es6_module, '../wasm/native_api.js');
}, '/dev/fairmotion/src/curve/spline_types.js');


es6_module_define('spline_query', ["./spline_base.js", "../editors/viewport/selectmode.js", "../path.ux/scripts/util/math.js", "./spline_multires.js"], function _spline_query_module(_es6_module) {
  var SelMask=es6_import_item(_es6_module, '../editors/viewport/selectmode.js', 'SelMask');
  var has_multires=es6_import_item(_es6_module, './spline_multires.js', 'has_multires');
  var compose_id=es6_import_item(_es6_module, './spline_multires.js', 'compose_id');
  var decompose_id=es6_import_item(_es6_module, './spline_multires.js', 'decompose_id');
  var MResFlags=es6_import_item(_es6_module, './spline_multires.js', 'MResFlags');
  var MultiResLayer=es6_import_item(_es6_module, './spline_multires.js', 'MultiResLayer');
  var PI=Math.PI, abs=Math.abs, sqrt=Math.sqrt, floor=Math.floor, ceil=Math.ceil, sin=Math.sin, cos=Math.cos, acos=Math.acos, asin=Math.asin, tan=Math.tan, atan=Math.atan, atan2=Math.atan2;
  var SplineFlags=es6_import_item(_es6_module, './spline_base.js', 'SplineFlags');
  var math=es6_import(_es6_module, '../path.ux/scripts/util/math.js');
  var sqrt=Math.sqrt;
  let findnearest_segment_tmp=new Vector2();
  let _mpos_fn_v=new Vector2();
  let _v_fn_v=new Vector2();
  class SplineQuery  {
     constructor(spline) {
      this.spline = spline;
    }
     findnearest(editor, mpos, selectmask, limit, ignore_layers) {
      if (limit===undefined)
        limit = 15;
      var dis=1e+18;
      var data=undefined;
      if (selectmask&SelMask.VERTEX) {
          var ret=this.findnearest_vert(editor, mpos, limit, undefined, ignore_layers);
          if (ret!==undefined&&ret[1]<dis) {
              data = ret;
              dis = ret[1];
          }
      }
      if (selectmask&SelMask.HANDLE) {
          var ret=this.findnearest_vert(editor, mpos, limit, true, ignore_layers);
          if (ret!==undefined&&ret[1]<dis) {
              data = ret;
              dis = ret[1];
          }
      }
      if (selectmask&SelMask.SEGMENT) {
          var ret=this.findnearest_segment(editor, mpos, limit, ignore_layers);
          if (ret!==undefined&&ret[1]<dis) {
              data = ret;
              dis = ret[1];
          }
      }
      if (selectmask&SelMask.FACE) {
          var ret=this.findnearest_face(editor, mpos, limit, ignore_layers);
          if (ret!==undefined&&ret[1]<dis) {
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
          if (ret===undefined)
            continue;
          let s=ret.s;
          ret = ret.co;
          if (seg.hidden||seg.v1.hidden||seg.v2.hidden)
            continue;
          if (!ignore_layers&&!seg.in_layer(actlayer))
            continue;
          var dis=sqrt((ret[0]-mpos[0])*(ret[0]-mpos[0])+(ret[1]-mpos[1])*(ret[1]-mpos[1]));
          let width=seg.width(s)*0.5;
          dis = Math.max(dis-width, 0.0);
          if (dis<mindis) {
              sret = seg;
              mindis = dis;
          }
      }
      if (sret!==undefined)
        return [sret, mindis, SelMask.SEGMENT];
    }
     findnearest_face(editor, mpos, limit, ignore_layers) {
      let spline=this.spline, actlayer=spline.layerset.active;
      let mindis=0, closest=undefined;
      let p=new Vector2([5000, 5001]);
      mpos = new Vector2(mpos);
      editor.unproject(mpos);
      p.add(mpos);
      for (let f of spline.faces) {
          if ((!ignore_layers&&!f.in_layer(actlayer))||f.hidden)
            continue;
          let sum=0;
          for (let list of f.paths) {
              for (let l of list) {
                  let v1=l.v, v2=l.next.v;
                  let steps=4;
                  let s=0.0, ds=1.0/(steps-1);
                  let lastco=undefined;
                  for (let i=0; i<steps; i++, s+=ds) {
                      let co=l.s.evaluate(s);
                      if (lastco) {
                          if (math.line_line_cross(lastco, co, mpos, p)) {
                              sum+=1;
                          }
                      }
                      lastco = co;
                  }
              }
          }
          if (sum%2!==1) {
              continue;
          }
          let dist=-f.finalz+(f.flag&SplineFlags.SELECT)*1000;
          if (!closest||dist<mindis) {
              closest = f;
              mindis = dist;
          }
      }
      if (closest!==undefined) {
          return [closest, mindis, SelMask.FACE];
      }
    }
     findnearest_vert(editor, mpos, limit, do_handles, ignore_layers) {
      var spline=this.spline;
      var actlayer=spline.layerset.active;
      if (limit===undefined)
        limit = 15;
      var min=1e+17;
      var ret=undefined;
      let _mpos=_mpos_fn_v;
      let _v=_v_fn_v;
      mpos = _mpos.load(mpos);
      var list=do_handles ? spline.handles : spline.verts;
      for (var v of list) {
          if (v.hidden)
            continue;
          if (!ignore_layers&&!v.in_layer(actlayer))
            continue;
          var co=v;
          _v.load(co);
          editor.project(_v);
          var dis=_v.vectorDistance(mpos);
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
  _ESClass.register(SplineQuery);
  _es6_module.add_class(SplineQuery);
  SplineQuery = _es6_module.add_export('SplineQuery', SplineQuery);
}, '/dev/fairmotion/src/curve/spline_query.js');


es6_module_define('spline_draw', ["./spline_types.js", "../editors/viewport/view2d_editor.js", "../config/config.js", "../core/animdata.js", "../util/vectormath.js", "./spline_element_array.js", "./spline_math.js", "./spline_draw_sort.js", "./spline_draw_new.js", "../util/mathlib.js", "../editors/viewport/selectmode.js", "./spline_draw_sort"], function _spline_draw_module(_es6_module) {
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
  let spline_draw_cache_vs=cachering.fromConstructor(Vector3, 64);
  let spline_draw_trans_vs=cachering.fromConstructor(Vector3, 32);
  let PI=Math.PI;
  let pow=Math.pow, cos=Math.cos, sin=Math.sin, abs=Math.abs, floor=Math.floor, ceil=Math.ceil, sqrt=Math.sqrt, log=Math.log, acos=Math.acos, asin=Math.asin;
  const DRAW_MAXCURVELEN=10000;
  _es6_module.add_export('DRAW_MAXCURVELEN', DRAW_MAXCURVELEN);
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
  const ColorFlags={SELECT: 1, 
   ACTIVE: 2, 
   HIGHLIGHT: 4}
  _es6_module.add_export('ColorFlags', ColorFlags);
  const FlagMap={UNSELECT: 0, 
   SELECT: ColorFlags.SELECT, 
   ACTIVE: ColorFlags.ACTIVE, 
   HIGHLIGHT: ColorFlags.HIGHLIGHT, 
   SELECT_ACTIVE: ColorFlags.SELECT|ColorFlags.ACTIVE, 
   SELECT_HIGHLIGHT: ColorFlags.SELECT|ColorFlags.HIGHLIGHT, 
   HIGHLIGHT_ACTIVE: ColorFlags.HIGHLIGHT|ColorFlags.ACTIVE, 
   SELECT_HIGHLIGHT_ACTIVE: ColorFlags.SELECT|ColorFlags.ACTIVE|ColorFlags.HIGHLIGHT}
  _es6_module.add_export('FlagMap', FlagMap);
  function mix(a, b, t) {
    let ret=[0, 0, 0];
    for (let i=0; i<3; i++) {
        ret[i] = a[i]+(b[i]-a[i])*t;
    }
    return ret;
  }
  const ElementColor={UNSELECT: [1, 0.133, 0.07], 
   SELECT: [1, 0.6, 0.26], 
   HIGHLIGHT: [1, 0.93, 0.4], 
   ACTIVE: [0.3, 0.4, 1.0], 
   SELECT_ACTIVE: mix([1, 0.6, 0.26], [0.1, 0.2, 1.0], 0.7), 
   SELECT_HIGHLIGHT: [1, 1, 0.8], 
   HIGHLIGHT_ACTIVE: mix([1, 0.93, 0.4], [0.3, 0.4, 1.0], 0.5), 
   SELECT_HIGHLIGHT_ACTIVE: [0.85, 0.85, 1.0]}
  _es6_module.add_export('ElementColor', ElementColor);
  const HandleColor={UNSELECT: [0.2, 0.7, 0.07], 
   SELECT: [0.1, 1, 0.26], 
   HIGHLIGHT: [0.2, 0.93, 0.4], 
   ACTIVE: [0.1, 1, 0.75], 
   SELECT_ACTIVE: mix([1, 0.6, 0.26], [0.1, 0.2, 1.0], 0.7), 
   SELECT_HIGHLIGHT: [1, 1, 0.8], 
   HIGHLIGHT_ACTIVE: mix([1, 0.93, 0.4], [0.3, 0.4, 1.0], 0.5), 
   SELECT_HIGHLIGHT_ACTIVE: [0.85, 0.85, 1.0]}
  _es6_module.add_export('HandleColor', HandleColor);
  HandleColor.SELECT_ACTIVE = mix(HandleColor.SELECT, HandleColor.ACTIVE, 0.5);
  HandleColor.SELECT_HIGHLIGHT = mix(HandleColor.SELECT, HandleColor.HIGHLIGHT, 0.5);
  HandleColor.HIGHLIGHT_ACTIVE = mix(HandleColor.HIGHLIGHT, HandleColor.ACTIVE, 0.5);
  HandleColor.SELECT_HIGHLIGHT_ACTIVE = mix(mix(HandleColor.SELECT, HandleColor.ACTIVE, 0.5), HandleColor.HIGHLIGHT, 0.5);
  function rgb2css(color) {
    let r=color[0], g=color[1], b=color[2];
    return "rgb("+(~~(r*255))+","+(~~(g*255))+","+(~~(b*255))+")";
  }
  const element_colormap=new Array(8);
  _es6_module.add_export('element_colormap', element_colormap);
  for (let k in ElementColor) {
      let f=FlagMap[k];
      element_colormap[f] = rgb2css(ElementColor[k]);
  }
  const handle_colormap=new Array(8);
  _es6_module.add_export('handle_colormap', handle_colormap);
  for (let k in HandleColor) {
      let f=FlagMap[k];
      handle_colormap[f] = rgb2css(HandleColor[k]);
  }
  function get_element_flag(e, list) {
    let f=0;
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
  const VERT_SIZE=3.0;
  const SMALL_VERT_SIZE=1.0;
  var SplineDrawer=es6_import_item(_es6_module, './spline_draw_new.js', 'SplineDrawer');
  var redo_draw_sort=es6_import_item(_es6_module, './spline_draw_sort.js', 'redo_draw_sort');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var ___spline_draw_sort=es6_import(_es6_module, './spline_draw_sort');
  for (let k in ___spline_draw_sort) {
      _es6_module.add_export(k, ___spline_draw_sort[k], true);
  }
  function draw_curve_normals(spline, g, zoom) {
    for (let seg of spline.segments) {
        if (seg.v1.hidden||seg.v2.hidden)
          continue;
        let length=seg.ks[KSCALE];
        if (length<=0||isNaN(length))
          continue;
        if (length>DRAW_MAXCURVELEN)
          length = DRAW_MAXCURVELEN;
        let ls=0.0, dls=5/zoom;
        for (ls = 0; ls<length; ls+=dls) {
            let s=ls/length;
            if (s>1.0)
              continue;
            let co=seg.evaluate(s);
            let n=seg.normal(s).normalize();
            let k=seg.curvature(s);
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
  function draw_spline(spline, redraw_rects, g, editor, matrix, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime, ignore_layers) {
    spline.canvas = g;
    if (spline.drawlist===undefined||(spline.recalc&RecalcFlags.DRAWSORT)) {
        redo_draw_sort(spline);
    }
    if (spline.drawer===undefined) {
        spline.drawer = new SplineDrawer(spline);
    }
    let zoom=editor.zoom;
    zoom = matrix.m11;
    if (isNaN(zoom)) {
        zoom = 1.0;
    }
    spline.drawer.update(spline, spline.drawlist, spline.draw_layerlist, matrix, redraw_rects, only_render, selectmode, g, zoom, editor, ignore_layers, editor.draw_stroke_debug);
    let promise=spline.drawer.draw(editor.drawg);
    let actlayer=spline.layerset.active;
    if (!only_render&&draw_normals)
      draw_curve_normals(spline, g, zoom);
    let r=[[0, 0], [0, 0]];
    for (let s of spline.segments) {
        s.flag&=~SplineFlags.DRAW_TEMP;
    }
    for (let f of spline.faces) {
        f.flag&=~SplineFlags.DRAW_TEMP;
    }
    let vert_size=editor.draw_small_verts ? SMALL_VERT_SIZE : VERT_SIZE;
    if (only_render)
      return promise;
    let tmp1=new Vector2();
    let tmp2=new Vector2();
    let last_clr=undefined;
    g.beginPath();
    if (selectmode&SelMask.SEGMENT) {
        let dv=new Vector2();
        for (let seg of spline.segments) {
            let skip=(!ignore_layers&&!seg.in_layer(actlayer));
            skip = skip||(seg.flag&SplineFlags.HIDE);
            skip = skip||(!(seg.flag&SplineFlags.SELECT)&&seg!==spline.segments.active&&seg!==spline.segments.highlight);
            if (skip) {
                continue;
            }
            let steps=seg.length/24;
            steps = Math.min(Math.max(steps, 3), 64);
            steps = isNaN(steps) ? 3 : steps;
            let s=0, ds=1.0/(steps-1);
            g.beginPath();
            for (let side=0; side<2; side++) {
                let lastp=undefined;
                for (let i=0; i<steps; i++, s+=ds) {
                    let p=seg.evaluateSide(s, side, dv);
                    tmp1.load(p).multVecMatrix(matrix);
                    if (side===0&&i===0) {
                        g.moveTo(tmp1[0], tmp1[1]);
                    }
                    else {
                      g.lineTo(tmp1[0], tmp1[1]);
                    }
                    lastp = p;
                }
                s-=ds;
                ds*=-1;
            }
            let clr=get_element_color(seg, spline.segments);
            g.fillStyle = clr;
            g.fill();
        }
    }
    g.beginPath();
    if (selectmode&SelMask.HANDLE) {
        let w=vert_size*g.canvas.dpi_scale/zoom;
        for (let v of spline.handles) {
            let clr=get_element_color(v, spline.handles);
            if (!ignore_layers&&!v.owning_segment.in_layer(actlayer))
              continue;
            if (v.owning_segment!==undefined&&(v.owning_segment.flag&SplineFlags.HIDE))
              continue;
            if (v.owning_vertex!==undefined&&(v.owning_vertex.flag&SplineFlags.HIDE))
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
            let ov=v.owning_segment.handle_vertex(v);
            tmp2.load(ov).multVecMatrix(matrix);
            g.moveTo(tmp1[0], tmp1[1]);
            g.lineTo(tmp2[0], tmp2[1]);
            g.stroke();
        }
    }
    if (selectmode&SelMask.VERTEX) {
        let w=vert_size*g.canvas.dpi_scale/zoom;
        for (let i=0; i<spline.verts.length; i++) {
            let v=spline.verts[i];
            let clr=get_element_color(v, spline.verts);
            if (!ignore_layers&&!v.in_layer(actlayer))
              continue;
            if (v.flag&SplineFlags.HIDE)
              continue;
            let co=tmp1.load(v);
            co.multVecMatrix(matrix);
            if (draw_time_helpers) {
                let time=get_vtime(v);
                if (curtime===time) {
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
    return promise;
  }
  draw_spline = _es6_module.add_export('draw_spline', draw_spline);
  let __margin=new Vector2([15, 15]);
  let __aabb=[new Vector2(), new Vector2()];
  function redraw_element(e, view2d) {
    let margin=__margin;
    let aabb=__aabb;
    e.flag|=SplineFlags.REDRAW;
    margin[0] = margin[1] = 15.0;
    if (view2d!==undefined)
      margin.mulScalar(1.0/view2d.zoom);
    let e_aabb=e.aabb;
    aabb[0].load(e_aabb[0]);
    aabb[1].load(e_aabb[1]);
    aabb[0].sub(margin);
    aabb[1].add(margin);
    window.redraw_viewport(aabb[0], aabb[1]);
  }
  redraw_element = _es6_module.add_export('redraw_element', redraw_element);
}, '/dev/fairmotion/src/curve/spline_draw.js');


es6_module_define('spline_draw_sort', ["../config/config.js", "./spline_multires.js", "./spline_types.js", "../editors/viewport/view2d_editor.js", "./spline_element_array.js", "../core/animdata.js", "./spline_math.js", "../util/mathlib.js", "../editors/viewport/selectmode.js", "../core/evillog.js"], function _spline_draw_sort_module(_es6_module) {
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
  var evillog=es6_import_item(_es6_module, '../core/evillog.js', 'evillog');
  let spline_draw_cache_vs=cachering.fromConstructor(Vector3, 64);
  let spline_draw_trans_vs=cachering.fromConstructor(Vector3, 32);
  let PI=Math.PI;
  let pow=Math.pow, cos=Math.cos, sin=Math.sin, abs=Math.abs, floor=Math.floor, ceil=Math.ceil, sqrt=Math.sqrt, log=Math.log, acos=Math.acos, asin=Math.asin;
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
    for (let group of spline.drawStrokeGroups) {
        for (let seg of group.segments) {
            seg.stringid = startid+seg.id;
        }
    }
  }
  calc_string_ids = _es6_module.add_export('calc_string_ids', calc_string_ids);
  const _sort_layer_segments_lists=new cachering(function () {
    return [];
  }, 2);
  function sort_layer_segments(layer, spline) {
    const lists=_sort_layer_segments_lists;
    let list=lists.next();
    list.length = 0;
    let visit={}
    let layerid=layer.id;
    let topogroup_idgen=0;
    function recurse(seg, start_seg) {
      if (start_seg===undefined) {
          start_seg = seg;
      }
      if (seg.eid in visit) {
          return ;
      }
      visit[seg.eid] = 1;
      seg.topoid = topogroup_idgen;
      for (let i=0; i<2; i++) {
          let v=i ? seg.v2 : seg.v1;
          if (v.segments.length!==2)
            continue;
          for (let seg2 of v.segments) {
              if (!(seg2.eid in visit)) {
                  recurse(seg2, start_seg);
              }
          }
      }
      if (!seg.hidden||(seg.flag&SplineFlags.GHOST)) {
          list.push(seg);
      }
    }
    if (1) {
        for (let seg of layer) {
            if (seg.type!==SplineTypes.SEGMENT)
              continue;
            if (!(layerid in seg.layers))
              continue;
            if (seg.v1.segments.length===2&&seg.v2.segments.length===2)
              continue;
            if (!(seg.eid in visit)) {
                topogroup_idgen++;
                recurse(seg);
            }
        }
        for (let seg of layer) {
            if (seg.type!==SplineTypes.SEGMENT)
              continue;
            if (!(layerid in seg.layers))
              continue;
            if (!(seg.eid in visit)) {
                topogroup_idgen++;
                recurse(seg);
            }
        }
    }
    return list;
  }
  sort_layer_segments = _es6_module.add_export('sort_layer_segments', sort_layer_segments);
  function redo_draw_sort(spline) {
    spline.redoSegGroups();
    let min_z=100000000000000.0;
    let max_z=-100000000000000.0;
    let layerset=spline.layerset;
    if (_DEBUG.drawsort) {
        console.log("start sort");
    }
    let time=time_ms();
    let gmap=new Map();
    let gsmap=new Map();
    let gi=0;
    let gmaxz=new Map();
    for (let g of spline.drawStrokeGroups) {
        let maxz=-1e+17;
        for (let seg of g.segments) {
            if (seg===undefined) {
                evillog("Missing segment in draw stroke group! patching. . .");
                let lst=[];
                for (let seg2 of g.segments) {
                    if (seg2) {
                        lst.push(seg2);
                    }
                }
                g.segments.length = 0;
                for (let seg2 of lst) {
                    g.segments.push(seg2);
                }
                break;
            }
        }
        for (let seg of g.segments) {
            gsmap.set(seg, g);
            gmap.set(seg, gi);
            maxz = Math.max(maxz, seg.z);
        }
        for (let seg of g.segments) {
            gmaxz.set(seg, maxz);
        }
        gmap.set(g, gi);
        gi++;
    }
    for (let seg of spline.segments) {
        seg.updateCoincident();
    }
    for (let f of spline.faces) {
        if (f.hidden&&!(f.flag&SplineFlags.GHOST))
          continue;
        if (isNaN(f.z))
          f.z = 0;
        max_z = Math.max(max_z, f.z+1);
        min_z = Math.min(min_z, f.z);
    }
    for (let s of spline.segments) {
        if (s.hidden&&!(s.flag&SplineFlags.GHOST))
          continue;
        if (isNaN(s.z))
          s.z = 0;
        max_z = Math.max(max_z, s.z+2);
        min_z = Math.min(min_z, s.z);
    }
    function calc_z(e, check_face) {
      if (check_face===undefined) {
          check_face = true;
      }
      if (isNaN(e.z)) {
          e.z = 0;
      }
      if (check_face&&e.type===SplineTypes.SEGMENT&&e.l!==undefined) {
          let l=e.l;
          let _i=0;
          let f_max_z=calc_z(e, false);
          do {
            if (_i++>1000) {
                console.trace("infinite loop!");
                break;
            }
            let fz=calc_z(l.f);
            f_max_z = f_max_z===undefined ? fz : Math.max(f_max_z, fz);
            l = l.radial_next;
          } while (l!==e.l);
          
          return f_max_z+1;
      }
      let layer=0;
      for (let k in e.layers) {
          layer = k;
          break;
      }
      if (!(layer in layerset.idmap)) {
          console.log("Bad layer!", layer);
          return -1;
      }
      let z=gmaxz.get(e)||e.z;
      layer = layerset.idmap[layer];
      return layer.order*(max_z-min_z)+(z-min_z);
    }
    function get_layer(e) {
      for (let k in e.layers) {
          return k;
      }
      return undefined;
    }
    let dl=spline.drawlist = [];
    let ll=spline.draw_layerlist = [];
    spline._layer_maxz = max_z;
    for (let f of spline.faces) {
        f.finalz = -1;
        if (f.hidden&&!(f.flag&SplineFlags.GHOST))
          continue;
        dl.push(f);
    }
    let visit={}
    for (let i=0; i<spline.layerset.length; i++) {
        let layer=spline.layerset[i];
        let elist=sort_layer_segments(layer, spline);
        for (let j=0; j<elist.length; j++) {
            let s=elist[j];
            if (!(s.eid in visit))
              dl.push(elist[j]);
            visit[s.eid] = 1;
        }
    }
    for (let s of spline.segments) {
        s.finalz = -1;
        if (s.hidden&&!(s.flag&SplineFlags.GHOST))
          continue;
        if (!(s.eid in visit)) {
            dl.push(s);
        }
    }
    let zs={}
    for (let e of dl) {
        zs[e.eid] = calc_z(e);
    }
    if (!spline.is_anim_path) {
        dl.sort(function (a, b) {
          return zs[a.eid]-zs[b.eid];
        });
    }
    for (let i=0; i<dl.length; i++) {
        let lk=undefined;
        for (let k in dl[i].layers) {
            lk = k;
            break;
        }
        ll.push(lk);
    }
    let visit2=new Set();
    let list2=[];
    for (let item of spline.drawlist) {
        if (item.type===SplineTypes.SEGMENT) {
            let g=gsmap.get(item);
            if (!g) {
                continue;
            }
            if (visit2.has(g))
              continue;
            visit2.add(g);
            list2.push(g);
            for (let seg of g.segments) {
                for (let i=0; i<2; i++) {
                    let v=i ? seg.v2 : seg.v1;
                    if (v.segments.length>2&&!visit2.has(v)) {
                        visit2.add(v);
                        list2.push(v);
                    }
                }
            }
        }
        else {
          list2.push(item);
        }
        spline.drawlist = list2;
    }
    for (let i=0; i<spline.drawlist.length; i++) {
        if (spline.drawlist[i]===undefined) {
            let j=i;
            console.warn("corrupted drawlist; fixing...");
            while (j<spline.drawlist.length) {
              spline.drawlist[j] = spline.drawlist[j+1];
              j++;
            }
            spline.drawlist.length--;
            i--;
        }
        spline.drawlist[i].finalz = i;
    }
    calc_string_ids(spline, spline.segments.length);
    spline.recalc&=~RecalcFlags.DRAWSORT;
    if (_DEBUG.drawsort) {
        console.log("time taken:"+(time_ms()-time).toFixed(2)+"ms");
    }
  }
  redo_draw_sort = _es6_module.add_export('redo_draw_sort', redo_draw_sort);
}, '/dev/fairmotion/src/curve/spline_draw_sort.js');


es6_module_define('spline', ["./spline_draw.js", "../core/struct.js", "./spline_strokegroup.js", "../config/config.js", "./solver.js", "./solver_new.js", "./spline_multires.js", "../editors/viewport/selectmode.js", "../core/eventdag.js", "../core/toolops_api.js", "../path.ux/scripts/pathux.js", "./spline_query.js", "../wasm/native_api.js", "../core/lib_api.js", "./spline_math.js", "../editors/viewport/view2d_editor.js", "./spline_element_array.js", "./spline_types.js", "../path.ux/scripts/config/const.js"], function _spline_module(_es6_module) {
  "use strict";
  var util=es6_import_item(_es6_module, '../path.ux/scripts/pathux.js', 'util');
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
  var redo_draw_sort=es6_import_item(_es6_module, './spline_draw.js', 'redo_draw_sort');
  var solve=es6_import_item(_es6_module, './solver_new.js', 'solve');
  var ModalStates=es6_import_item(_es6_module, '../core/toolops_api.js', 'ModalStates');
  var DataPathNode=es6_import_item(_es6_module, '../core/eventdag.js', 'DataPathNode');
  var config=es6_import(_es6_module, '../config/config.js');
  const FEPS=1e-18;
  const SPI2=Math.sqrt(PI/2);
  let _SOLVING=false;
  _SOLVING = _es6_module.add_export('_SOLVING', _SOLVING);
  let INCREMENTAL=1;
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
  let rect_tmp=[new Vector2(), new Vector2()];
  var eval_curve=es6_import_item(_es6_module, './spline_math.js', 'eval_curve');
  var do_solve=es6_import_item(_es6_module, './spline_math.js', 'do_solve');
  let RestrictFlags={NO_EXTRUDE: 1, 
   NO_DELETE: 2, 
   NO_CONNECT: 4, 
   NO_DISSOLVE: 8, 
   NO_SPLIT_EDGE: 16, 
   VALENCE2: 32, 
   NO_CREATE: 64|1|4|16}
  RestrictFlags = _es6_module.add_export('RestrictFlags', RestrictFlags);
  function dom_bind(obj, name, dom_id) {
    Object.defineProperty(obj, name, {get: function () {
        let check=document.getElementById(dom_id);
        return check.checked;
      }, 
    set: function (val) {
        let check=document.getElementById(dom_id);
        check.checked = !!val;
      }});
  }
  let split_edge_rets=new cachering(function () {
    return [0, 0, 0];
  }, 64);
  let _elist_map={"verts": SplineTypes.VERTEX, 
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
      let ret=this.iter.next();
      this.ret.done = ret.done;
      this.ret.value = ret.value;
      if (ret.done&&this.stage===0) {
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
  let debug_id_gen=0;
  let _se_ws=[0.5, 0.5];
  let _se_srcs=[0, 0];
  let _trace_face_lastco=new Vector3();
  class Spline extends DataBlock {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
     constructor(name=undefined) {
      super(DataTypes.SPLINE, name);
      this.updateGen = 0;
      this.draw_layerlist = [];
      this.solvePromise = undefined;
      this.solveTimeout = undefined;
      this.strokeGroups = [];
      this._strokeGroupMap = new Map();
      this._drawStrokeVertSplits = new Set();
      this.drawStrokeGroups = [];
      this._drawStrokeGroupMap = new Map();
      this._vert_add_set = new set();
      this._vert_rem_set = new set();
      this._vert_time_set = new set();
      this._debug_id = debug_id_gen++;
      this.pending_solve = undefined;
      this._resolve_after = undefined;
      this.solving = undefined;
      this.actlevel = 0;
      let mformat=spline_multires._format;
      this.mres_format = new Array(mformat.length);
      for (let i=0; i<mformat.length; i++) {
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
    static  blockDefine() {
      return {typeName: "spline", 
     defaultName: "Spline", 
     uiName: "Spline", 
     typeIndex: 6, 
     linkOrder: 3, 
     accessorName: "splines"}
    }
     dag_get_datapath() {
      if (this.is_anim_path||(this.verts.cdata.layers.length>0&&this.verts.cdata.layers[0].name==="TimeDataLayer"))
        return "frameset.pathspline";
      else 
        return "frameset.drawspline";
    }
     force_full_resolve() {
      this.resolve = 1;
      for (let seg of this.segments) {
          seg.flag|=SplineFlags.UPDATE;
      }
      for (let v of this.verts) {
          v.flag|=SplineFlags.UPDATE;
      }
      for (let h of this.handles) {
          h.flag|=SplineFlags.UPDATE;
      }
    }
     check_sort() {
      if (!this.drawlist||(this.recalc&RecalcFlags.DRAWSORT)) {
          redo_draw_sort(this);
      }
    }
     queue_redraw() {
      window.redraw_viewport();
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
      for (let list of this.elists) {
          list.onDestroy();
      }
      this.elist_map = {};
      this.elists = [];
      for (let k in _elist_map) {
          let type=_elist_map[k];
          let list=new ElementArray(type, this.idgen, this.eidmap, this.selected, this.layerset, this);
          this[k] = list;
          this.elist_map[type] = list;
          this.elists.push(list);
      }
      this.init_sel_handlers();
    }
     init_sel_handlers() {
      let this2=this;
      this.verts.on_select = function (v, state) {
        for (let i=0; i<v.segments.length; i++) {
            let seg=v.segments[i];
            this2.handles.setselect(seg.handle(v), state);
        }
      };
    }
    get  idgen() {
      return this._idgen;
    }
    set  idgen(idgen) {
      this._idgen = idgen;
      if (this.elists===undefined) {
          return ;
      }
      for (let i=0; i<this.elists.length; i++) {
          this.elists[i].idgen = idgen;
      }
    }
     copy() {
      let ret=new Spline();
      ret.idgen = this.idgen.copy();
      ret.layerset = this.layerset.copyStructure();
      for (let i=0; i<ret.elists.length; i++) {
          ret.elists[i].idgen = ret.idgen;
          ret.elists[i].cdata.load_layout(this.elists[i].cdata);
      }
      let eidmap=ret.eidmap;
      for (let si=0; si<2; si++) {
          let list1=si ? this.handles : this.verts;
          let list2=si ? ret.handles : ret.verts;
          for (let i=0; i<list1.length; i++) {
              let v=list1[i];
              let v2=new SplineVertex(v);
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
          let s=this.segments[i];
          let s2=new SplineSegment();
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
          for (let j=0; j<s.ks.length; j++) {
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
      for (let i=0; i<this.faces.length; i++) {
          let f=this.faces[i];
          let vlists=[];
          for (let list of f.paths) {
              let verts=[];
              vlists.push(verts);
              let l=list.l;
              do {
                verts.push(eidmap[l.v.eid]);
                l = l.next;
              } while (l!==list.l);
              
          }
          let f2=ret.make_face(vlists, f.eid);
          ret.copy_face_data(f2, f);
          eidmap[f2.eid] = f2;
          if (f===this.faces.active)
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
      dst.cdata.copy(src.cdata);
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
      dst.w1 = src.w1;
      dst.w2 = src.w2;
      dst.shift1 = src.shift1;
      dst.shift2 = src.shift2;
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
      let v=new SplineVertex(co);
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
      let h=new SplineVertex();
      h.flag|=SplineFlags.BREAK_TANGENTS;
      h.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
      h.type = SplineTypes.HANDLE;
      this.handles.push(h, __eid);
      return h;
    }
     split_edge(seg, s=0.5) {
      let co=seg.evaluate(s);
      let ws=_se_ws;
      let srcs=_se_srcs;
      let hpair=seg.h2.hpair;
      if (hpair!==undefined) {
          this.disconnect_handle(seg.h2);
      }
      let nv=this.make_vertex(co);
      nv.flag|=seg.v1.flag&seg.v2.flag;
      if (nv.flag&SplineFlags.SELECT) {
          nv.flag&=~SplineFlags.SELECT;
          this.verts.setselect(nv, true);
      }
      let v1=seg.v1, v2=seg.v2;
      let nseg=this.make_segment(nv, seg.v2);
      let w1=seg.w1+(seg.w2-seg.w1)*s;
      let w2=seg.w2;
      let shift1=seg.shift1+(seg.shift2-seg.shift1)*s;
      let shift2=seg.shift2;
      seg.w2 = w1;
      seg.shift2 = shift1;
      seg.v2.segments.remove(seg);
      nv.segments.push(seg);
      seg.v2 = nv;
      if (seg.l!==undefined) {
          let start=seg.l;
          let l=seg.l;
          let i=0;
          let lst=[];
          do {
            lst.push(l);
            if (i++>100) {
                console.trace("Infinite loop error");
                break;
            }
            l = l.radial_next;
          } while (l!==seg.l);
          
          for (let j=0; j<lst.length; j++) {
              let l=lst[j];
              let newl=this.make_loop();
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
      let ret=split_edge_rets.next();
      ret[0] = nseg;
      ret[1] = nv;
      if (hpair!==undefined) {
          this.connect_handles(nseg.h2, hpair);
      }
      this.copy_segment_data(nseg, seg);
      nseg.w1 = w1;
      nseg.w2 = w2;
      nseg.shift1 = shift1;
      nseg.shift2 = shift2;
      srcs[0] = v1.cdata, srcs[1] = v2.cdata;
      this.copy_vert_data(nv, v1);
      nv.cdata.interp(srcs, ws);
      this.resolve = 1;
      return ret;
    }
     find_segment(v1, v2) {
      for (let i=0; i<v1.segments.length; i++) {
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
      let s1=h1.segments[0], s2=h2.segments[0];
      if (s1.handle_vertex(h1)!==s2.handle_vertex(h2)) {
          console.trace("Invalid call to connect_handles");
          return ;
      }
      if (h1.hpair!==undefined)
        this.disconnect_handle(h1);
      if (h2.hpair!==undefined)
        this.disconnect_handle(h2);
      h1.hpair = h2;
      h2.hpair = h1;
    }
     export_ks() {
      let size=this.segments.length*ORDER+1;
      let ret=new Float32Array(size);
      let i=1;
      ret[0] = 0;
      for (let seg of this.segments) {
          for (let j=0; j<ORDER; j++) {
              ret[i++] = seg.ks[j];
          }
      }
      return new Uint8Array(ret.buffer);
    }
     import_ks(data) {
      let i=1;
      data = new Float32Array(data.buffer);
      let version=data[0];
      for (let seg of this.segments) {
          for (let j=0; j<ORDER; j++) {
              seg.ks[j] = data[i++];
          }
      }
      return true;
    }
     export_ks_old() {
      let mmlen=MMLEN;
      let size=4/UMUL+8/UMUL+this.segments.length*ORDER;
      size+=this.segments.length*(4/UMUL);
      size+=(8*Math.floor(this.segments.length/mmlen))/UMUL;
      let ret=new UARR(size);
      let view=new DataView(ret.buffer);
      let c=0, d=0;
      view.setInt32(c*UMUL, UMUL);
      c+=4/UMUL;
      let mink, maxk;
      for (let i=0; i<this.segments.length; i++) {
          let s=this.segments[i];
          if (d===0) {
              mink = 10000, maxk = -10000;
              for (let si=i; si<i+mmlen+1; si++) {
                  if (si>=this.segments.length)
                    break;
                  let s2=this.segments[si];
                  for (let j=0; j<ORDER; j++) {
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
          for (let j=0; j<ORDER; j++) {
              let k=s.ks[j];
              k = (k-mink)/(maxk-mink);
              if (k<0.0) {
                  console.log("EVIL!", k, mink, maxk);
              }
              k = Math.abs(Math.floor(k*UMAX));
              ret[c++] = k;
          }
          d = (d+1)%mmlen;
      }
      let ret2=ret;
      return ret2;
    }
     import_ks_old(data) {
      data = new UARR(data.buffer);
      let view=new DataView(data.buffer);
      let mmlen=MMLEN;
      let d=0, i=0;
      let datasize=view.getInt32(0);
      if (datasize!==UMUL) {
          return undefined;
      }
      i+=4/UMUL;
      while (i<data.length) {
        let mink, maxk;
        if (d===0) {
            mink = view.getFloat32(i*UMUL);
            maxk = view.getFloat32(i*UMUL+4);
            i+=8/UMUL;
        }
        d = (d+1)%mmlen;
        if (i>=data.length) {
            console.log("SPLINE CACHE ERROR", i, data.length);
            break;
        }
        let eid=view.getInt32(i*UMUL);
        i+=4/UMUL;
        let s=this.eidmap[eid];
        if (s===undefined||!(__instance_of(s, SplineSegment))) {
            console.log("Could not find segment", data[i-1]);
            i+=ORDER;
            continue;
        }
        for (let j=0; j<ORDER; j++) {
            let k=data[i++]/UMAX;
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
      for (let i=0; i<2; i++) {
          let list=i ? this.handles : this.verts;
          for (let v of list) {
              for (let j=0; j<v.segments.length; j++) {
                  if (v.segments[j]===undefined) {
                      console.warn("Corruption detected for element", v.eid);
                      v.segments.pop_i(j);
                      j--;
                  }
              }
          }
      }
      let hset=new set();
      for (let s of this.segments) {
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
      for (let h of this.handles) {
          if (!hset.has(h)) {
              delset.add(h);
          }
      }
      for (let h of delset) {
          console.log("Removing orphaned handle", h.eid, h);
          this.handles.remove(h);
      }
      let delsegments=new set();
      for (let v of this.verts) {
          for (let i=0; i<v.segments.length; i++) {
              let s=v.segments[i];
              if (s.v1!==v&&s.v2!==v) {
                  console.log("Corrupted segment! Deleting!");
                  v.segments.remove(s, true);
                  i--;
                  delsegments.add(s);
              }
          }
      }
      for (let s of delsegments) {
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
          if (s.l!==undefined) {
              let l=s.l, c;
              let radial_next=l.radial_next;
              do {
                if (c++>100) {
                    console.log("Infinite loop (in fix_splines)!");
                    break;
                }
                this.kill_face(l.f);
                l = l.radial_next;
                if (l===undefined)
                  break;
              } while (l!==s.l);
              
          }
      }
      for (let s of this.segments) {
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
      let max_eid=0;
      for (let i=0; i<this.elists.length; i++) {
          let elist=this.elists[i];
          for (let e of elist) {
              max_eid = Math.max(e.eid, max_eid);
          }
      }
      let curid=!("cur_id" in this.idgen) ? "cur_eid" : "cur_id";
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
          let fset=new set();
          let sset=new set();
          let fact=this.faces.active, sact=this.segments.active;
          for (let v of this.verts.selected) {
              for (let s of v.segments) {
                  if (sset.has(s))
                    continue;
                  if (s.other_vert(v).flag&SplineFlags.SELECT) {
                      sset.add(s);
                  }
                  let l=s.l;
                  if (l===undefined)
                    continue;
                  let c=0;
                  do {
                    if (c++>1000) {
                        console.warn("Infinite loop detected!");
                        break;
                    }
                    let f=l.f;
                    if (f.flag&SplineFlags.SELECT) {
                        l = l.next;
                        continue;
                    }
                    let good=true;
                    for (let path of f.paths) {
                        for (let l2 of path) {
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
                  } while (l!==s.l);
                  
              }
          }
          this.segments.clear_selection();
          this.faces.clear_selection();
          if (sact===undefined||!sset.has(sact)) {
              for (let s of sset) {
                  sact = s;
                  break;
              }
          }
          if (fact===undefined||!fset.has(fact)) {
              for (let f of fset) {
                  fact = f;
                  break;
              }
          }
          this.segments.active = sact;
          this.faces.active = fact;
          for (let s of sset) {
              this.segments.setselect(s, true);
          }
          for (let f of fset) {
              this.faces.setselect(f, true);
          }
      }
      else 
        if (datamode===SplineTypes.SEGMENT) {
          this.verts.clear_selection();
          this.faces.clear_selection();
          for (let s of this.segments.selected) {
              this.verts.setselect(s.v1, true);
              this.verts.setselect(s.v2, true);
              let l=s.l;
              if (l===undefined)
                continue;
              let c=0;
              do {
                if (c++>1000) {
                    console.warn("Infinite loop detected!");
                    break;
                }
                let f=l.f;
                if (f.flag&SplineFlags.SELECT) {
                    l = l.next;
                    continue;
                }
                let good=true;
                for (let path of f.paths) {
                    for (let l2 of path) {
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
          for (let f of this.faces.selected) {
              for (let path of f.paths) {
                  for (let l of path) {
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
          let seg=this.find_segment(v1, v2);
          if (seg!==undefined)
            return seg;
      }
      let seg=new SplineSegment(v1, v2);
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
     flip_segment(seg) {
      let v=seg.v1;
      let t=seg.v1;
      seg.v1 = seg.v2;
      seg.v2 = t;
      t = seg.h1;
      seg.h1 = seg.h2;
      seg.h2 = t;
      t = seg.w1;
      seg.w1 = seg.w2;
      seg.w2 = t;
      t = seg.shift1;
      seg.shift1 = seg.shift2;
      seg.shift2 = t;
      return this;
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
      let f=new SplineFace();
      if (custom_eid===-1)
        custom_eid = undefined;
      this.faces.push(f);
      for (let i=0; i<vlists.length; i++) {
          let verts=vlists[i];
          if (verts.length<3) {
              throw new Error("Must have at least three vertices for face");
          }
          let vset={};
          for (let j=0; j<verts.length; j++) {
              if (verts[j].eid in vset) {
                  console.log(vlists);
                  throw new Error("Duplicate verts in make_face");
              }
              vset[verts[j].eid] = 1;
          }
      }
      let min_z;
      for (let i=0; i<vlists.length; i++) {
          let verts=vlists[i];
          let list=new SplineLoopPath();
          list.f = f;
          list.totvert = verts.length;
          f.paths.push(list);
          let l=undefined, prevl=undefined;
          for (let j=0; j<verts.length; j++) {
              let v1=verts[j], v2=verts[(j+1)%verts.length];
              let exists=this.find_segment(v1, v2);
              let s=this.make_segment(v1, v2, undefined, true);
              let l=this.make_loop();
              if (!exists) {
                  let select=false;
                  outer: for (let i=0; i<2; i++) {
                      let v=i ? s.v2 : s.v1;
                      for (let s2 of v.segments) {
                          if (s2.flag&SplineFlags.SELECT) {
                              select = true;
                              break outer;
                          }
                      }
                  }
                  if (select) {
                      this.setselect(s, true);
                  }
              }
              min_z = Math.min(min_z, s.z);
              l.v = v1;
              l.s = s;
              l.f = f;
              l.p = list;
              if (prevl===undefined) {
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
          l = list.l;
          do {
            this._radial_loop_insert(l);
            l = l.next;
          } while (l!==list.l);
          
      }
      f.z = min_z-1;
      return f;
    }
     make_loop() {
      let l=new SplineLoop();
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
      for (let i=0; i<f.paths.length; i++) {
          let path=f.paths[i];
          for (let l of path) {
              this._radial_loop_remove(l);
              this.kill_loop(l);
          }
      }
      this._element_kill(f);
      this.faces.remove(f);
    }
     kill_segment(seg, kill_faces=true, soft_error=false) {
      let i=0;
      while (kill_faces&&seg.l!==undefined) {
        this.kill_face(seg.l.f);
        if (i++>1000) {
            console.trace("Infinite loop in kill_segment!!", seg);
            break;
        }
      }
      if (seg.v1.segments!==undefined)
        seg.v1.segments.remove(seg, soft_error);
      if (seg.v2.segments!==undefined)
        seg.v2.segments.remove(seg, soft_error);
      this.handles.remove(seg.h1, soft_error);
      this.handles.remove(seg.h2, soft_error);
      this._element_kill(seg);
      this.segments.remove(seg, soft_error);
    }
     do_save() {
      let obj=this.toJSON();
      let buf=JSON.stringify(obj);
      let blob=new Blob([buf], {type: "application/json"});
      let obj_url=window.URL.createObjectURL(blob);
      window.open(obj_url);
    }
     dissolve_vertex(v) {
      if (!(v.eid in this.eidmap)) {
          throw new Error("spline.dissolve_vertex called in error");
      }
      let ls2=[];
      if (v.segments.length!==2)
        return ;
      for (let i=0; i<v.segments.length; i++) {
          let s=v.segments[i];
          if (s.l===undefined)
            continue;
          let lst=[];
          let l=s.l;
          let _i=0;
          do {
            lst.push(l);
            l = l.radial_next;
            if (_i++>10000) {
                console.warn("infinite loop detected in dissolve_vertex");
                break;
            }
          } while (l!==s.l);
          
          for (let j=0; j<lst.length; j++) {
              let l=lst[j];
              if (l.v!==v&&l.next.v!==v)
                continue;
              if (l.v!==v) {
                  l = l.next;
              }
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
      if (v.segments.length===2) {
          let s1=v.segments[0], s2=v.segments[1];
          let v1=s1.other_vert(v), v2=s2.other_vert(v);
          let existing=this.find_segment(v1, v2);
          let w1=v===s1.v1 ? s1.w2 : s1.w1;
          let w2=v===s2.v1 ? s2.w2 : s2.w1;
          let shift1=v===s1.v1 ? s1.shift2 : s1.shift1;
          let shift2=v===s2.v1 ? s2.shift2 : s2.shift1;
          if (s1.v1===v)
            s1.v1 = v2;
          else 
            s1.v2 = v2;
          let ci=0;
          while (s2.l!==undefined) {
            this._radial_loop_remove(s2.l);
            if (ci++>100) {
                console.warn("Infinite loop error!");
                break;
            }
          }
          while (s1.l!==undefined) {
            this._radial_loop_remove(s1.l);
            if (ci++>100) {
                console.warn("Infinite loop error!");
                break;
            }
          }
          this.kill_segment(s2);
          v2.segments.push(s1);
          v.segments.length = 0;
          let flip=false;
          if (existing) {
              flip = existing.v1!==s1.v1;
              this.kill_segment(s1);
              s1 = existing;
          }
          if (!flip) {
              s1.w1 = w1;
              s1.w2 = w2;
              s1.shift1 = shift1;
              s1.shift2 = shift2;
          }
          else {
            s1.w1 = w2;
            s1.w2 = w1;
            s1.shift1 = shift2;
            s1.shift2 = shift1;
          }
          if (s1.l===undefined) {
              for (let i=0; i<ls2.length; i++) {
                  let l=ls2[i];
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
      if (!(v.eid in this.eidmap)) {
          throw new Error("spline.kill_vertex called in error");
      }
      this._vert_rem_set.add(v.eid);
      this.dag_update("on_vert_add", this._vert_rem_set);
      this.dag_update("on_vert_change");
      if (v.flag&SplineFlags.SELECT) {
          this.verts.setselect(v, false);
      }
      if (this.hpair!==undefined)
        this.disconnect_handle(this);
      while (v.segments.length>0) {
        let last=v.segments.length;
        this.kill_segment(v.segments[0]);
        if (last===v.segments.length) {
            console.log("EEK!");
            break;
        }
      }
      if (this.verts.active===v)
        this.verts.active = undefined;
      if (this.verts.highlight===v)
        this.verts.highlight = undefined;
      delete this.eidmap[v.eid];
      this._element_kill(v);
      this.verts.remove(v);
    }
     _vert_flag_update(v, depth, limit) {
      if (depth>=limit)
        return ;
      v.flag|=SplineFlags.TEMP_TAG;
      for (let i=0; i<v.segments.length; i++) {
          let s=v.segments[i], v2=s.other_vert(v);
          if (v2===undefined||v2.segments===undefined) {
              console.trace("ERROR 1: v, s, v2:", v, s, v2);
              continue;
          }
          let has_tan=v2.segments.length<=2;
          for (let j=0; j<v2.segments.length; j++) {
              let h=v2.segments[j].handle(v2);
              if (h.hpair!==undefined) {
                  has_tan = true;
              }
          }
          if (!has_tan) {
          }
          if (!(v2.flag&SplineFlags.TEMP_TAG)) {
              this._vert_flag_update(v2, depth+1, limit);
          }
      }
      for (let j=0; j<v.segments.length; j++) {
          let s=v.segments[j], v2=s.other_vert(v);
          if (v2.segments.length>2||(v2.flag&SplineFlags.BREAK_TANGENTS))
            v2.flag|=SplineFlags.TEMP_TAG;
      }
    }
     propagate_draw_flags(repeat=2) {
      for (let seg of this.segments) {
          seg.flag&=~SplineFlags.TEMP_TAG;
      }
      for (let seg of this.segments) {
          if (!(seg.flag&SplineFlags.REDRAW_PRE))
            continue;
          for (let i=0; i<2; i++) {
              let v=i ? seg.v2 : seg.v1;
              for (let j=0; j<v.segments.length; j++) {
                  let seg2=v.segments[j];
                  seg2.flag|=SplineFlags.TEMP_TAG;
                  let l=seg2.l;
                  if (l===undefined)
                    continue;
                  let _i=0;
                  do {
                    if (_i++>1000) {
                        console.warn("infinite loop!");
                        break;
                    }
                    l.f.flag|=SplineFlags.REDRAW_PRE;
                    l = l.radial_next;
                  } while (l!==seg2.l);
                  
              }
          }
      }
      for (let seg of this.segments) {
          if (seg.flag&SplineFlags.TEMP_TAG) {
              seg.flag|=SplineFlags.REDRAW_PRE;
          }
      }
      if (repeat!==undefined&&repeat>0) {
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
      let verts=this.verts;
      for (let i=0; i<verts.length; i++) {
          let v=verts[i];
          v.flag&=~SplineFlags.TEMP_TAG;
      }
      let limit=5;
      for (let i=0; i<verts.length; i++) {
          let v=verts[i];
          if (v.flag&SplineFlags.UPDATE) {
              this._vert_flag_update(v, 0, limit);
          }
      }
      for (let i=0; i<verts.length; i++) {
          let v=verts[i];
          if (v.flag&SplineFlags.TEMP_TAG) {
              v.flag|=SplineFlags.UPDATE;
          }
      }
    }
     solve(steps, gk, force_queue=false) {
      let this2=this;
      let dag_trigger=function () {
        this2.dag_update("on_solve", true);
      };
      if (this.pending_solve!==undefined&&force_queue) {
          let this2=this;
          this.pending_solve = this.pending_solve.then(function () {
            this2.solve();
          });
          this.solving = true;
          return this.pending_solve;
      }
      else 
        if (this.pending_solve!==undefined) {
          let do_accept;
          let promise=new Promise(function (accept, reject) {
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
        this.pending_solve = this.solve_intern(steps, gk);
        this.solving = true;
        return this.pending_solve;
      }
    }
     on_destroy() {
      for (let elist of this.elists) {
          elist.onDestroy();
      }
    }
     solve_intern(steps, gk) {
      let this2=this;
      let dag_trigger=function () {
        this2.dag_update("on_solve", true);
        the_global_dag.exec(g_app_state.screen.ctx);
      };
      for (let v of this.verts) {
          if (v.flag&SplineFlags.UPDATE) {
              for (let i=0; i<v.segments.length; i++) {
                  let seg=v.segments[i];
                  seg.flag|=SplineFlags.REDRAW_PRE;
                  let l=seg.l;
                  if (!l)
                    continue;
                  let _i=0;
                  do {
                    if (_i++>5000) {
                        console.warn("infinite loop!");
                        break;
                    }
                    l.f.flag|=SplineFlags.REDRAW_PRE;
                    l = l.radial_next;
                  } while (l!==seg.l);
                  
              }
          }
      }
      this.propagate_draw_flags();
      if (window.DISABLE_SOLVE||config.DISABLE_SOLVE) {
          return new Promise((accept, reject) =>            {
            accept();
          });
      }
      if (!DEBUG.no_native&&config.USE_WASM&&native_api.isReady()) {
          window._block_drawing++;
          let ret=native_api.do_solve(SplineFlags, this, steps, gk, true);
          ret.then(function () {
            window._block_drawing--;
            this2.pending_solve = undefined;
            this2.solving = false;
            this2._do_post_solve();
            dag_trigger();
            if (this2._resolve_after) {
                let cb=this2._resolve_after;
                this2._resolve_after = undefined;
                this2.pending_solve = this2.solve_intern().then(function () {
                  cb.call(this2);
                });
                this2.solving = true;
            }
          }).catch((error) =>            {
            window._block_drawing--;
            console.error(error.stack);
            console.error(error.message);
          });
          return ret;
      }
      else {
        let do_accept;
        let promise=new Promise(function (accept, reject) {
          do_accept = function () {
            accept();
          }
        });
        window._block_drawing++;
        let this2=this;
        window.setTimeout(function () {
          window._block_drawing--;
          do_solve(SplineFlags, this2, steps, gk);
          this2.pending_solve = undefined;
          this2.solving = false;
          do_accept();
          this2._do_post_solve();
          dag_trigger();
          if (this2._resolve_after) {
              let cb=this2._resolve_after;
              this2._resolve_after = undefined;
              this2.pending_solve = this2.solve_intern().then(function () {
                cb.call(this2);
              });
              this2.solving = true;
          }
        }, 10);
        return promise;
      }
    }
     _do_post_solve() {
      for (let seg of this.segments) {
          if (seg.flag&SplineFlags.REDRAW_PRE) {
              seg.flag&=~SplineFlags.REDRAW_PRE;
              seg.flag|=SplineFlags.REDRAW;
          }
      }
      for (let f of this.faces) {
          if (f.flag&SplineFlags.REDRAW_PRE) {
              f.flag&=~SplineFlags.REDRAW_PRE;
              f.flag|=SplineFlags.REDRAW;
          }
      }
      for (let seg of this.segments) {
          seg.post_solve();
      }
    }
     solve_p(steps, gk) {
      console.trace("solve_p: DEPRECATED");
      return this.solve(steps, gk);
    }
     trace_face(g, f) {
      g.beginPath();
      let lastco=_trace_face_lastco;
      lastco.zero();
      for (let path of f.paths) {
          let first=true;
          for (let l of path) {
              let seg=l.s;
              let flip=seg.v1!==l.v;
              let s=flip ? seg.ks[KSCALE] : 0, ds=flip ? -2 : 2;
              while ((!flip&&s<seg.ks[KSCALE])||(flip&&s>=0)) {
                let co=seg.evaluate(s/seg.length);
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
      for (let si=0; si<2; si++) {
          let list=si ? this.handles : this.verts;
          let last_len=list.length;
          for (let i=0; i<list.length; i++) {
              if (thislet!==undefined)
                cb.call(thisvar, list[i]);
              else 
                cb(list[i]);
              last_len = list.length;
          }
      }
    }
     build_shash() {
      let sh={};
      let cellsize=150;
      sh.cellsize = cellsize;
      function hash(x, y, cellsize) {
        return Math.floor(x/cellsize)+","+Math.floor(y/cellsize);
      }
      for (let si=0; si<2; si++) {
          let list=si ? this.handles : this.verts;
          for (let v of list) {
              let h=hash(v[0], v[1], cellsize);
              if (!(h in sh)) {
                  sh[h] = [];
              }
              sh[h].push(v);
          }
      }
      let sqrt2=sqrt(2);
      sh.forEachPoint = function sh_lookupPoints(co, radius, callback, thisvar) {
        let cellsize=this.cellsize;
        let cellradius=Math.ceil(sqrt2*radius/cellsize);
        let sx=Math.floor(co[0]/cellsize)-cellradius;
        let sy=Math.floor(co[1]/cellsize)-cellradius;
        let ex=Math.ceil(co[0]/cellsize)+cellradius;
        let ey=Math.ceil(co[1]/cellsize)+cellradius;
        for (let x=sx; x<=ex; x++) {
            for (let y=sy; y<=ey; y++) {
                let h=hash(x*cellsize, y*cellsize, cellsize);
                if (!(h in this))
                  continue;
                let list=this[h];
                for (let i=0; i<list.length; i++) {
                    let e=list[i];
                    let dis=e.vectorDistance(co);
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
      for (let i=0; i<this.verts.length; i++) {
          let v=this.verts[i];
          if (v.flag&SplineFlags.HIDE) {
              v.flag&=~SplineFlags.HIDE;
              v.flag|=SplineFlags.SELECT;
          }
      }
    }
     duplicate_verts() {
      let newvs=[];
      let idmap={};
      for (let i=0; i<this.verts.length; i++) {
          let v=this.verts[i];
          if (!(v.flag&SplineFlags.SELECT))
            continue;
          if (v.hidden)
            continue;
          let nv=this.make_vertex(v);
          idmap[v.eid] = nv;
          idmap[nv.eid] = v;
          nv.flag = v.flag&~SplineFlags.SELECT;
          newvs.push(nv);
      }
      for (let i=0; i<this.segments.length; i++) {
          let seg=this.segments[i];
          if ((seg.v1.flag&SplineFlags.SELECT)&&(seg.v2.flag&SplineFlags.SELECT)) {
              let v1=idmap[seg.v1.eid], v2=idmap[seg.v2.eid];
              if (v1===undefined||v2===undefined||v1===v2)
                continue;
              this.make_segment(v1, v2);
          }
      }
      for (let i=0; i<this.verts.length; i++) {
          let v=this.verts[i];
          this.verts.setselect(v, false);
      }
      for (let i=0; i<newvs.length; i++) {
          this.verts.setselect(newvs[i], true);
      }
      this.start_mpos[0] = this.mpos[0];
      this.start_mpos[1] = this.mpos[1];
      this.start_transform();
      this.resolve = 1;
    }
     has_highlight(selmask=255) {
      for (let list of this.elists) {
          if ((list.type&selmask)&&list.highlight)
            return true;
      }
      return false;
    }
     clear_highlight() {
      for (let i=0; i<this.elists.length; i++) {
          this.elists[i].highlight = undefined;
      }
    }
     validate_active() {
      for (let i=0; i<this.elists.length; i++) {
          let elist=this.elists[i];
          if (elist.active!==undefined&&elist.active.hidden)
            elist.active = undefined;
      }
    }
     clear_active(e) {
      this.set_active(undefined);
    }
     set_active(e) {
      if (e===undefined) {
          for (let i=0; i<this.elists.length; i++) {
              this.elists[i].active = undefined;
          }
          return ;
      }
      let elist=this.get_elist(e.type);
      elist.active = e;
    }
     setselect(e, state) {
      let elist=this.get_elist(e.type);
      elist.setselect(e, state);
    }
     clear_selection(e) {
      for (let i=0; i<this.elists.length; i++) {
          this.elists[i].clear_selection();
      }
    }
     do_mirror() {
      this.start_transform('s');
      for (let i=0; i<this.transdata.length; i++) {
          let start=this.transdata[i][0], v=this.transdata[i][1];
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
      let ret={};
      ret.frame = this.frame;
      ret.verts = {length: this.verts.length};
      ret.segments = [];
      ret.handles = [];
      ret.draw_verts = this.draw_verts;
      ret.draw_normals = this.draw_normals;
      ret._cur_id = this.idgen.cur_id;
      for (let i=0; i<this.verts.length; i++) {
          ret.verts[i] = this.verts[i].toJSON();
      }
      if (this.verts.active!==undefined)
        ret.verts.active = this.verts.active.eid;
      else 
        ret.verts.active = undefined;
      if (this.handles.active!==undefined)
        ret.handles.active = this.handles.active.eid;
      if (this.segments.active!==undefined)
        ret.segments.active = this.segments.active.eid;
      for (let i=0; i<this.segments.length; i++) {
          ret.segments.push(this.segments[i].toJSON());
      }
      for (let i=0; i<this.handles.length; i++) {
          ret.handles.push(this.handles[i].toJSON());
      }
      return ret;
    }
     reset() {
      this.idgen = new SDIDGen();
      this.strokeGroups = [];
      this._strokeGroupMap = new Map();
      this.init_elists();
      this.updateGen++;
    }
     import_json(obj) {
      let spline2=Spline.fromJSON(obj);
      let miny=1e+18, maxy=1e-18;
      let newmap={};
      for (let i=0; i<spline2.verts.length; i++) {
          let v=spline2.verts[i];
          let nv=this.make_vertex(v, v.eid);
          nv.flag = v.flag;
          nv.flag|=SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
          miny = Math.min(miny, nv[1]);
          maxy = Math.max(maxy, nv[1]);
          newmap[v.eid] = nv;
      }
      for (let i=0; i<spline2.verts.length; i++) {
          let v=spline2.verts[i], nv=newmap[v.eid];
          nv[1] = ((maxy-miny)-(nv[1]-miny))+miny;
      }
      for (let i=0; i<spline2.segments.length; i++) {
          let seg=spline2.segments[i];
          let v1=newmap[seg.v1.eid], v2=newmap[seg.v2.eid];
          let nseg=this.make_segment(v1, v2);
          nseg.flag = seg.flag|SplineFlags.UPDATE|SplineFlags.FRAME_DIRTY;
          newmap[seg.eid] = nseg;
      }
      this.resolve = 1;
    }
     segmentNeedsResort(seg) {
      let sliced;
      let resort1=vertexIsSplit(this, seg.v1);
      let resort2=vertexIsSplit(this, seg.v2);
      if (!!resort1!==!!this._drawStrokeVertSplits.has(seg.v1.eid)) {
          return true;
      }
      if (!!resort2!==!!this._drawStrokeVertSplits.has(seg.v2.eid)) {
          return true;
      }
      return false;
      outer: for (let v of [seg.v1, seg.v2]) {
          for (let seg1 of v.segments) {
              for (let seg2 of v.segments) {
                  if (seg1===seg2) {
                      continue;
                  }
                  if (!seg1.mat.equals(true, seg2.mat)) {
                      sliced = v;
                      break outer;
                  }
              }
          }
      }
      if (sliced&&!this._drawStrokeVertSplits.has(sliced.eid)) {
          return true;
      }
      return false;
    }
     redoSegGroups() {
      buildSegmentGroups(this);
      splitSegmentGroups(this);
    }
    static  fromJSON(obj) {
      let spline=new Spline();
      spline.idgen.cur_id = obj._cur_id;
      spline.draw_verts = obj.draw_verts;
      spline.draw_normals = obj.draw_normals;
      let eidmap={};
      for (let i=0; i<obj.verts.length; i++) {
          let cv=obj.verts[i];
          let v=spline.make_vertex(cv);
          v.flag|=SplineFlags.FRAME_DIRTY;
          v.flag = cv.flag;
          v.eid = cv.eid;
          v.segments = cv.segments;
          eidmap[v.eid] = v;
      }
      for (let i=0; i<obj.handles.length; i++) {
          let cv=obj.handles[i];
          let v=spline.make_handle(cv);
          v.flag = cv.flag;
          v.eid = cv.eid;
          v.segments = cv.segments;
          eidmap[v.eid] = v;
      }
      for (let i=0; i<obj.segments.length; i++) {
          let s=obj.segments[i];
          let segments=obj.segments;
          let v1=eidmap[s.v1], v2=eidmap[s.v2];
          let h1=eidmap[s.h1], h2=eidmap[s.h2];
          let seg=new SplineSegment();
          seg.eid = s.eid;
          seg.flag = s.flag;
          if (seg.ks.length===s.ks.length) {
              seg.ks = s.ks;
          }
          else {
            spline.resolve = true;
            for (let j=0; j<spline.verts.length; j++) {
                spline.verts[j].flag|=SplineFlags.UPDATE;
            }
          }
          for (let j=0; j<seg.ks.length; j++) {
              if (isNaN(seg.ks[j])) {
                  seg.ks[j] = 0.0;
              }
          }
          seg.v1 = v1, seg.v2 = v2, seg.h1 = h1, seg.h2 = h2;
          spline.segments.push(seg);
          eidmap[seg.eid] = seg;
      }
      for (let i=0; i<obj.verts.length; i++) {
          let v=obj.verts[i];
          for (let j=0; j<v.segments.length; j++) {
              v.segments[j] = eidmap[v.segments[j]];
          }
      }
      for (let i=0; i<obj.handles.length; i++) {
          let v=obj.handles[i];
          for (let j=0; j<v.segments.length; j++) {
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
      let del=[];
      for (let i=0; i<this.verts.length; i++) {
          let v=this.verts[i];
          if (v.segments.length===0) {
              del.push(v);
          }
      }
      for (let i=0; i<del.length; i++) {
          this.kill_vertex(del[i]);
      }
    }
     checkSolve() {
      if (this.resolve) {
          if (this.solvePromise&&util.time_ms()-this.solveTimeout<1000) {
              return ;
          }
          else {
            this.solvePromise = this.solve().then(() =>              {
              this.solvePromise = undefined;
              this.queue_redraw();
            });
            this.solveTimeout = util.time_ms();
          }
      }
    }
     draw(redraw_rects, g, editor, matrix, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime, ignore_layers) {
      this.canvas = g;
      this.selectmode = selectmode;
      g.lineWidth = 1;
      this.checkSolve();
      return draw_spline(this, redraw_rects, g, editor, matrix, selectmode, only_render, draw_normals, alpha, draw_time_helpers, curtime, ignore_layers);
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.afterSTRUCT();
      this.query = this.q = new SplineQuery(this);
      let eidmap={};
      this.elists = [];
      this.elist_map = {};
      for (let k in _elist_map) {
          let type=_elist_map[k];
          let v=this[k];
          if (v===undefined)
            continue;
          this.elists.push(v);
          this.elist_map[type] = v;
      }
      this.init_sel_handlers();
      for (let si=0; si<2; si++) {
          let list=si ? this.handles : this.verts;
          for (let i=0; i<list.length; i++) {
              let v=list[i];
              eidmap[v.eid] = v;
              if (v.type===SplineTypes.VERTEX)
                v.hpair = undefined;
          }
      }
      for (let h of this.handles) {
          h.hpair = eidmap[h.hpair];
      }
      for (let i=0; i<this.segments.length; i++) {
          let s=this.segments[i];
          s.v1 = eidmap[s.v1];
          s.v2 = eidmap[s.v2];
          s.h1 = eidmap[s.h1];
          s.h2 = eidmap[s.h2];
          eidmap[s.eid] = s;
      }
      for (let si=0; si<2; si++) {
          let list=si ? this.handles : this.verts;
          for (let i=0; i<list.length; i++) {
              let v=list[i];
              for (let j=0; j<v.segments.length; j++) {
                  v.segments[j] = eidmap[v.segments[j]];
              }
          }
      }
      for (let i=0; i<this.faces.length; i++) {
          let f=this.faces[i];
          f.flag|=SplineFlags.UPDATE_AABB;
          eidmap[f.eid] = f;
          for (let path of f.paths) {
              path.f = f;
              let l=path.l;
              do {
                eidmap[l.eid] = l;
                l.f = f;
                l.s = eidmap[l.s];
                l.v = eidmap[l.v];
                l = l.next;
              } while (l!==path.l);
              
          }
      }
      for (let i=0; i<this.faces.length; i++) {
          let f=this.faces[i];
          for (let path of f.paths) {
              let l=path.l;
              do {
                l.radial_next = eidmap[l.radial_next];
                l.radial_prev = eidmap[l.radial_prev];
                l = l.next;
              } while (l!==path.l);
              
          }
      }
      for (let i=0; i<this.segments.length; i++) {
          let s=this.segments[i];
          s.l = eidmap[s.l];
      }
      this.eidmap = eidmap;
      let selected=new ElementArraySet();
      selected.layerset = this.layerset;
      for (let i=0; i<this.selected.length; i++) {
          let eid=this.selected[i];
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
      if (this.layerset===undefined) {
          this.layerset = new SplineLayerSet();
          this.layerset.new_layer();
      }
      else {
        this.layerset.afterSTRUCT(this);
      }
      this._strokeGroupMap = new Map();
      for (let group of this.strokeGroups) {
          this._strokeGroupMap.set(group.hash, group);
          group.afterSTRUCT(this);
      }
      this.regen_sort();
      if (spline_multires.has_multires(this)&&this.mres_format!==undefined) {
          console.log("Converting old multires layout. . .");
          for (let seg of this.segments) {
              let mr=seg.cdata.get_layer(spline_multires.MultiResLayer);
              mr._convert(this.mres_format, spline_multires._format);
          }
      }
      let arr=[];
      for (let i=0; i<spline_multires._format.length; i++) {
          arr.push(spline_multires._format[i]);
      }
      this.mres_format = arr;
      for (let seg of this.segments) {
          seg.updateCoincident();
      }
      return this;
    }
     flagUpdateVertTime(v) {
      if (v) {
          this._vert_time_set.add(v.eid);
      }
      this.dag_update("on_vert_time_change", this._vert_time_set);
    }
     flagUpdateKeyframes(v) {
      this.dag_update("on_keyframe_insert", 1);
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
     outputs: {on_keyframe_insert: null, 
      on_solve: null, 
      on_vert_time_change: new set(), 
      on_vert_add: new set(), 
      on_vert_remove: new set(), 
      on_vert_change: null}, 
     inputs: {}}
    }
  }
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
    strokeGroups : array(SplineStrokeGroup);
}
`;
  DataBlock.register(Spline);
  var SplineStrokeGroup=es6_import_item(_es6_module, './spline_strokegroup.js', 'SplineStrokeGroup');
  var buildSegmentGroups=es6_import_item(_es6_module, './spline_strokegroup.js', 'buildSegmentGroups');
  var splitSegmentGroups=es6_import_item(_es6_module, './spline_strokegroup.js', 'splitSegmentGroups');
  var vertexIsSplit=es6_import_item(_es6_module, './spline_strokegroup.js', 'vertexIsSplit');
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

