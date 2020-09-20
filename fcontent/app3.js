es6_module_define('ui_base', ["../util/simple_events.js", "./ui_theme.js", "./anim.js", "../util/util.js", "../controller/controller.js", "../util/math.js", "../icon_enum.js", "../toolsys/toolprop.js", "../util/colorutils.js", "../util/cssutils.js", "../controller/simple_controller.js", "./theme.js", "./aspect.js", "../util/vectormath.js", "./units.js", "../config/const.js"], function _ui_base_module(_es6_module) {
  let _ui_base=undefined;
  if (window.document&&document.body) {
      console.log("ensuring body.style.margin/padding are zero");
      document.body.style["margin"] = "0px";
      document.body.style["padding"] = "0px";
  }
  var cssutils=es6_import(_es6_module, '../util/cssutils.js');
  var Animator=es6_import_item(_es6_module, './anim.js', 'Animator');
  es6_import(_es6_module, './units.js');
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var math=es6_import(_es6_module, '../util/math.js');
  var toolprop=es6_import(_es6_module, '../toolsys/toolprop.js');
  var controller=es6_import(_es6_module, '../controller/controller.js');
  var pushModalLight=es6_import_item(_es6_module, '../util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../util/simple_events.js', 'popModalLight');
  var copyEvent=es6_import_item(_es6_module, '../util/simple_events.js', 'copyEvent');
  var pathDebugEvent=es6_import_item(_es6_module, '../util/simple_events.js', 'pathDebugEvent');
  var getDataPathToolOp=es6_import_item(_es6_module, '../controller/simple_controller.js', 'getDataPathToolOp');
  var units=es6_import(_es6_module, './units.js');
  var rgb_to_hsv=es6_import_item(_es6_module, '../util/colorutils.js', 'rgb_to_hsv');
  var hsv_to_rgb=es6_import_item(_es6_module, '../util/colorutils.js', 'hsv_to_rgb');
  var ___ui_theme_js=es6_import(_es6_module, './ui_theme.js');
  for (let k in ___ui_theme_js) {
      _es6_module.add_export(k, ___ui_theme_js[k], true);
  }
  var CSSFont=es6_import_item(_es6_module, './ui_theme.js', 'CSSFont');
  var theme=es6_import_item(_es6_module, './ui_theme.js', 'theme');
  var parsepx=es6_import_item(_es6_module, './ui_theme.js', 'parsepx');
  var DefaultTheme=es6_import_item(_es6_module, './theme.js', 'DefaultTheme');
  let _ex_theme=es6_import_item(_es6_module, './ui_theme.js', 'theme');
  _es6_module.add_export('theme', _ex_theme, true);
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  window.__cconst = cconst;
  let Vector4=vectormath.Vector4;
  let _ex_Icons=es6_import_item(_es6_module, '../icon_enum.js', 'Icons');
  _es6_module.add_export('Icons', _ex_Icons, true);
  var Icons=es6_import_item(_es6_module, '../icon_enum.js', 'Icons');
  let _ex_setIconMap=es6_import_item(_es6_module, '../icon_enum.js', 'setIconMap');
  _es6_module.add_export('setIconMap', _ex_setIconMap, true);
  var setIconMap=es6_import_item(_es6_module, '../icon_enum.js', 'setIconMap');
  var AfterAspect=es6_import_item(_es6_module, './aspect.js', 'AfterAspect');
  var initAspectClass=es6_import_item(_es6_module, './aspect.js', 'initAspectClass');
  var _setUIBase=es6_import_item(_es6_module, './aspect.js', '_setUIBase');
  const EnumProperty=toolprop.EnumProperty;
  let Area;
  let _setAreaClass=(cls) =>    {
    Area = cls;
  }
  _setAreaClass = _es6_module.add_export('_setAreaClass', _setAreaClass);
  const ErrorColors={WARNING: "yellow", 
   ERROR: "red", 
   OK: "green"}
  _es6_module.add_export('ErrorColors', ErrorColors);
  window.__theme = theme;
  function setTheme(theme2) {
    for (let k in theme2) {
        let v=theme2[k];
        if (typeof v!=="object") {
            theme[k] = v;
            continue;
        }
        if (!(k in theme)) {
            theme[k] = {};
        }
        for (let k2 in v) {
            theme[k][k2] = v[k2];
        }
    }
  }
  setTheme = _es6_module.add_export('setTheme', setTheme);
  setTheme(DefaultTheme);
  let _last_report=util.time_ms();
  function report(msg) {
    if (util.time_ms()-_last_report>350) {
        console.warn(msg);
        _last_report = util.time_ms();
    }
  }
  report = _es6_module.add_export('report', report);
  function getDefault(key, elem) {
    console.warn("Deprecated call to ui_base.js:getDefault");
    if (key in theme.base) {
        return theme.base[key];
    }
    else {
      throw new Error("Unknown default", key);
    }
  }
  getDefault = _es6_module.add_export('getDefault', getDefault);
  function IsMobile() {
    console.warn("ui_base.IsMobile is deprecated; use util.isMobile instead");
    return util.isMobile();
  }
  IsMobile = _es6_module.add_export('IsMobile', IsMobile);
  
  let keys=["margin", "padding", "margin-block-start", "margin-block-end"];
  keys = keys.concat(["padding-block-start", "padding-block-end"]);
  keys = keys.concat(["margin-left", "margin-top", "margin-bottom", "margin-right"]);
  keys = keys.concat(["padding-left", "padding-top", "padding-bottom", "padding-right"]);
  const marginPaddingCSSKeys=keys;
  _es6_module.add_export('marginPaddingCSSKeys', marginPaddingCSSKeys);
  class _IconManager  {
     constructor(image, tilesize, number_of_horizontal_tiles, drawsize) {
      this.tilex = number_of_horizontal_tiles;
      this.tilesize = tilesize;
      this.drawsize = drawsize;
      this.image = image;
    }
     canvasDraw(elem, canvas, g, icon, x=0, y=0) {
      let tx=icon%this.tilex;
      let ty=~~(icon/this.tilex);
      let dpi=elem.getDPI();
      let ts=this.tilesize;
      let ds=this.drawsize;
      g.drawImage(this.image, tx*ts, ty*ts, ts, ts, x, y, ds*dpi, ds*dpi);
    }
     setCSS(icon, dom) {
      dom.style["background"] = this.getCSS(icon);
      dom.style["background-size"] = (this.drawsize*this.tilex)+"px";
      if (!dom.style["width"]) {
          dom.style["width"] = this.drawsize+"px";
      }
      if (!dom.style["height"]) {
          dom.style["height"] = this.drawsize+"px";
      }
    }
     getCSS(icon) {
      if (icon==-1) {
          return '';
      }
      let ratio=this.drawsize/this.tilesize;
      let x=(-(icon%this.tilex)*this.tilesize)*ratio;
      let y=(-(~~(icon/this.tilex))*this.tilesize)*ratio;
      return `url("${this.image.src}") ${x}px ${y}px`;
    }
  }
  _ESClass.register(_IconManager);
  _es6_module.add_class(_IconManager);
  class IconManager  {
     constructor(images, sizes, horizontal_tile_count) {
      this.iconsheets = [];
      this.tilex = horizontal_tile_count;
      for (let i=0; i<images.length; i++) {
          let size, drawsize;
          if (typeof sizes[i]=="object") {
              size = sizes[i][0], drawsize = sizes[i][1];
          }
          else {
            size = drawsize = sizes[i];
          }
          if (util.isMobile()) {
              drawsize = ~~(drawsize*theme.base.mobileSizeMultiplier);
          }
          this.iconsheets.push(new _IconManager(images[i], size, horizontal_tile_count, drawsize));
      }
    }
     load(manager2) {
      this.iconsheets = manager2.iconsheets;
      this.tilex = manager2.tilex;
      return this;
    }
     reset(horizontal_tile_count) {
      this.iconsheets.length = 0;
      this.tilex = horizontal_tile_count;
    }
     add(image, size, drawsize=size) {
      this.iconsheets.push(new _IconManager(image, size, this.tilex, drawsize));
      return this;
    }
     canvasDraw(elem, canvas, g, icon, x=0, y=0, sheet=0) {
      let base=this.iconsheets[sheet];
      sheet = this.findSheet(sheet);
      let ds=sheet.drawsize;
      sheet.drawsize = base.drawsize;
      sheet.canvasDraw(elem, canvas, g, icon, x, y);
      sheet.drawsize = ds;
    }
     findClosestSheet(size) {
      let sheets=this.iconsheets.concat([]);
      sheets.sort((a, b) =>        {
        return a.drawsize-b.drawsize;
      });
      let sheet;
      for (let i=0; i<sheets.length; i++) {
          if (sheets[i].drawsize<=size) {
              sheet = sheets[i];
              break;
          }
      }
      if (!sheet)
        sheet = sheets[sheets.length-1];
      return this.iconsheets.indexOf(sheet);
    }
     findSheet(sheet) {
      if (sheet===undefined) {
          console.warn("sheet was undefined");
          sheet = 0;
      }
      let base=this.iconsheets[sheet];
      let dpi=UIBase.getDPI();
      let minsheet=undefined;
      let goal=dpi*base.drawsize;
      for (let sheet of this.iconsheets) {
          minsheet = sheet;
          if (sheet.drawsize>=goal) {
              break;
          }
      }
      return minsheet===undefined ? base : minsheet;
    }
     getTileSize(sheet=0) {
      return this.iconsheets[sheet].drawsize;
      return this.findSheet(sheet).drawsize;
    }
     getRealSize(sheet=0) {
      return this.iconsheets[sheet].tilesize;
      return this.findSheet(sheet).tilesize;
    }
     getCSS(icon, sheet=0) {
      let base=this.iconsheets[sheet];
      sheet = this.findSheet(sheet);
      let ds=sheet.drawsize;
      sheet.drawsize = base.drawsize;
      let ret=sheet.getCSS(icon);
      sheet.drawsize = ds;
      return ret;
    }
     setCSS(icon, dom, sheet=0) {
      let base=this.iconsheets[sheet];
      sheet = this.findSheet(sheet);
      let ds=sheet.drawsize;
      sheet.drawsize = base.drawsize;
      let ret=sheet.setCSS(icon, dom);
      sheet.drawsize = ds;
      return ret;
    }
  }
  _ESClass.register(IconManager);
  _es6_module.add_class(IconManager);
  IconManager = _es6_module.add_export('IconManager', IconManager);
  let iconmanager=new IconManager([document.getElementById("iconsheet16"), document.getElementById("iconsheet32"), document.getElementById("iconsheet48")], [16, 32, 64], 16);
  iconmanager = _es6_module.add_export('iconmanager', iconmanager);
  window._iconmanager = iconmanager;
  let IconSheets={SMALL: 0, 
   LARGE: 1, 
   XLARGE: 2}
  IconSheets = _es6_module.add_export('IconSheets', IconSheets);
  function getIconManager() {
    return iconmanager;
  }
  getIconManager = _es6_module.add_export('getIconManager', getIconManager);
  function setIconManager(manager, IconSheetsOverride) {
    iconmanager.load(manager);
    if (IconSheetsOverride!==undefined) {
        for (let k in IconSheetsOverride) {
            IconSheets[k] = IconSheetsOverride[k];
        }
    }
  }
  setIconManager = _es6_module.add_export('setIconManager', setIconManager);
  function makeIconDiv(icon, sheet) {
    if (sheet===undefined) {
        sheet = 0;
    }
    let size=iconmanager.getRealSize(sheet);
    let drawsize=iconmanager.getTileSize(sheet);
    let icontest=document.createElement("div");
    icontest.style["width"] = icontest.style["min-width"] = drawsize+"px";
    icontest.style["height"] = icontest.style["min-height"] = drawsize+"px";
    icontest.style["background-color"] = "orange";
    icontest.style["margin"] = "0px";
    icontest.style["padding"] = "0px";
    iconmanager.setCSS(icon, icontest, sheet);
    return icontest;
  }
  makeIconDiv = _es6_module.add_export('makeIconDiv', makeIconDiv);
  let Vector2=vectormath.Vector2;
  let Matrix4=vectormath.Matrix4;
  let dpistack=[];
  dpistack = _es6_module.add_export('dpistack', dpistack);
  const UIFlags={}
  _es6_module.add_export('UIFlags', UIFlags);
  const PackFlags={INHERIT_WIDTH: 1, 
   INHERIT_HEIGHT: 2, 
   VERTICAL: 4, 
   USE_ICONS: 8, 
   SMALL_ICON: 16, 
   LARGE_ICON: 32, 
   STRIP_HORIZ: 512, 
   STRIP_VERT: 1024, 
   STRIP: 512|1024, 
   SIMPLE_NUMSLIDERS: 2048, 
   FORCE_ROLLER_SLIDER: 4096, 
   HIDE_CHECK_MARKS: (1<<13), 
   NO_NUMSLIDER_TEXTBOX: (1<<14)}
  _es6_module.add_export('PackFlags', PackFlags);
  let first=(iter) =>    {
    if (iter===undefined) {
        return undefined;
    }
    if (!(Symbol.iterator in iter)) {
        for (let item in iter) {
            return item;
        }
        return undefined;
    }
    for (let item of iter) {
        return item;
    }
  }
  var DataPathError=es6_import_item(_es6_module, '../controller/controller.js', 'DataPathError');
  let _ex_DataPathError=es6_import_item(_es6_module, '../controller/controller.js', 'DataPathError');
  _es6_module.add_export('DataPathError', _ex_DataPathError, true);
  let _mobile_theme_patterns=[/.*width.*/, /.*height.*/, /.*size.*/, /.*margin.*/, /.*pad/, /.*radius.*/];
  let _idgen=0;
  window._testSetScrollbars = function (color, contrast, width, border) {
    if (color===undefined) {
        color = "grey";
    }
    if (contrast===undefined) {
        contrast = 0.5;
    }
    if (width===undefined) {
        width = 15;
    }
    if (border===undefined) {
        border = "solid";
    }
    let buf=styleScrollBars(color, undefined, contrast, width, border, "*");
    CTX.screen.mergeGlobalCSS(buf);
    return buf;
  }
  function styleScrollBars(color, color2, contrast, width, border, selector) {
    if (color===undefined) {
        color = "grey";
    }
    if (color2===undefined) {
        color2 = undefined;
    }
    if (contrast===undefined) {
        contrast = 0.5;
    }
    if (width===undefined) {
        width = 15;
    }
    if (border===undefined) {
        border = "1px groove black";
    }
    if (selector===undefined) {
        selector = "*";
    }
    if (!color2) {
        let c=css2color(color);
        let a=c.length>3 ? c[3] : 1.0;
        c = rgb_to_hsv(c[0], c[1], c[2]);
        let inv=c.slice(0, c.length);
        inv[2] = 1.0-inv[2];
        inv[2]+=(c[2]-inv[2])*(1.0-contrast);
        inv = hsv_to_rgb(inv[0], inv[1], inv[2]);
        inv.length = 4;
        inv[3] = a;
        inv = color2css(inv);
        color2 = inv;
    }
    let buf=`

${selector} {
  scrollbar-width : ${width <= 16 ? 'thin' : 'auto'};
  scrollbar-color : ${color2} ${color};
}

${selector}::-webkit-scrollbar {
  width : ${width}px;
  background-color : ${color};
}

${selector}::-webkit-scrollbar-track {
  background-color : ${color};
  border : ${border};
}

${selector}::-webkit-scrollbar-thumb {
  background-color : ${color2};
  border : ${border};
}
    `;
    return buf;
  }
  styleScrollBars = _es6_module.add_export('styleScrollBars', styleScrollBars);
  window.styleScrollBars = styleScrollBars;
  class UIBase extends HTMLElement {
     constructor() {
      super();
      this.pathUndoGen = 0;
      this._lastPathUndoGen = 0;
      this._useDataPathUndo = undefined;
      this._active_animations = [];
      this._screenStyleTag = document.createElement("style");
      this._screenStyleUpdateHash = 0;
      initAspectClass(this, new Set(["appendChild", "animate", "shadow", "removeNode", "prepend", "add", "init"]));
      this.shadow = this.attachShadow({mode: 'open'});
      if (cconst.DEBUG.paranoidEvents) {
          this.__cbs = [];
      }
      this.shadow.appendChild(this._screenStyleTag);
      this.shadow._appendChild = this.shadow.appendChild;
      let appendChild=this.shadow.appendChild;
      this.shadow.appendChild = (child) =>        {
        if (child&&typeof child==="object"&&__instance_of(child, UIBase)) {
            child.parentWidget = this;
        }
        return this.shadow._appendChild(child);
      };
      this._wasAddedToNodeAtSomeTime = false;
      this.visibleToPick = true;
      this._override_class = undefined;
      this.parentWidget = undefined;
      let tagname=this.constructor.define().tagname;
      this._id = tagname.replace(/\-/g, "_")+(_idgen++);
      this.default_overrides = {};
      this.class_default_overrides = {};
      this._last_description = undefined;
      this._modaldata = undefined;
      this.packflag = this.getDefault("BasePackFlag");
      this._disabled = false;
      this._disdata = undefined;
      this._ctx = undefined;
      this._description = undefined;
      let style=document.createElement("style");
      style.textContent = `
    .DefaultText {
      font: `+_getFont(this)+`;
    }
    `;
      this.shadow.appendChild(style);
      this._init_done = false;
      let do_touch=(e, type, button) =>        {
        button = button===undefined ? 0 : button;
        let e2=copyEvent(e);
        if (e.touches.length==0) {
        }
        else {
          let t=e.touches[0];
          e2.pageX = t.pageX;
          e2.pageY = t.pageY;
          e2.screenX = t.screenX;
          e2.screenY = t.screenY;
          e2.clientX = t.clientX;
          e2.clientY = t.clientY;
          e2.x = t.x;
          e2.y = t.y;
        }
        e2.button = button;
        e2 = new MouseEvent(type, e2);
        e2.was_touch = true;
        e2.stopPropagation = e.stopPropagation.bind(e);
        e2.preventDefault = e.preventDefault.bind(e);
        e2.touches = e.touches;
        this.dispatchEvent(e2);
      };
      this.addEventListener("touchstart", (e) =>        {
        do_touch(e, "mousedown", 0);
      }, {passive: false});
      this.addEventListener("touchmove", (e) =>        {
        do_touch(e, "mousemove");
      }, {passive: false});
      this.addEventListener("touchcancel", (e) =>        {
        do_touch(e, "mouseup", 2);
      }, {passive: false});
      this.addEventListener("touchend", (e) =>        {
        do_touch(e, "mouseup", 0);
      }, {passive: false});
    }
     hide(sethide=true) {
      this.hidden = sethide;
      for (let n of this.shadow.childNodes) {
          n.hidden = sethide;
      }
      this._forEachChildWidget((n) =>        {
        n.hide(sethide);
      });
    }
     unhide() {
      this.hide(false);
    }
    set  useDataPathUndo(val) {
      this._useDataPathUndo = val;
    }
    get  parentWidget() {
      return this._parentWidget;
    }
    set  parentWidget(val) {
      if (val) {
          this._wasAddedToNodeAtSomeTime = true;
      }
      this._parentWidget = val;
    }
    get  useDataPathUndo() {
      let p=this;
      while (p) {
        if (p._useDataPathUndo!==undefined) {
            console.log(p._useDataPathUndo, p.tagName);
            return p._useDataPathUndo;
        }
        p = p.parentWidget;
      }
      return false;
    }
     findArea() {
      let p=this;
      while (p) {
        if (__instance_of(p, Area)) {
            return p;
        }
        p = p.parentWidget;
      }
    }
     addEventListener(type, cb, options) {
      if (cconst.DEBUG.domEventAddRemove) {
          console.log("addEventListener", type, this._id, options);
      }
      let cb2=(e) =>        {
        if (cconst.DEBUG.paranoidEvents) {
            if (this.isDead()) {
                this.removeEventListener(type, cb, options);
                return ;
            }
        }
        if (cconst.DEBUG.domEvents) {
            pathDebugEvent(e);
        }
        let area=this.findArea();
        if (area) {
            area.push_ctx_active();
            try {
              let ret=cb(e);
              area.pop_ctx_active();
              return ret;
            }
            catch (error) {
                area.pop_ctx_active();
                throw error;
            }
        }
        else {
          if (cconst.DEBUG.areaContextPushes) {
              console.warn("Element is not part of an area?", element);
          }
          return cb(e);
        }
      };
      cb._cb = cb2;
      if (cconst.DEBUG.paranoidEvents) {
          this.__cbs.push([type, cb2, options]);
      }
      return super.addEventListener(type, cb, options);
    }
     removeEventListener(type, cb, options) {
      if (cconst.DEBUG.paranoidEvents) {
          for (let item of this.__cbs) {
              if (item[0]==type&&item[1]===cb._cb2&&(""+item[2])===(""+options)) {
                  this.__cbs.remove(item);
                  break;
              }
          }
      }
      if (cconst.DEBUG.domEventAddRemove) {
          console.log("removeEventListener", type, this._id, options);
      }
      if (!cb._cb) {
          return super.removeEventListener(type, cb, options);
      }
      else {
        return super.removeEventListener(type, cb._cb, options);
      }
    }
     connectedCallback() {

    }
    get  description() {
      return this._description;
    }
    set  description(val) {
      this._description = val;
      if (val===undefined||val===null) {
          return ;
      }
      if (cconst.showPathsInToolTips&&this.hasAttribute("datapath")) {
          let s=""+this._description;
          let path=this.getAttribute("datapath");
          s+="\n    path: "+path;
          if (this.hasAttribute("mass_set_path")) {
              let m=this.getAttribute("mass_set_path");
              s+="\n    massSetPath: "+m;
          }
          this.title = s;
      }
      else {
        this.title = ""+val;
      }
    }
     noMarginsOrPadding() {
      let keys=["margin", "padding", "margin-block-start", "margin-block-end"];
      keys = keys.concat(["padding-block-start", "padding-block-end"]);
      keys = keys.concat(["margin-left", "margin-top", "margin-bottom", "margin-right"]);
      keys = keys.concat(["padding-left", "padding-top", "padding-bottom", "padding-right"]);
      for (let k of keys) {
          this.style[k] = "0px";
      }
      return this;
    }
     regenTabOrder() {
      let screen=this.getScreen();
      if (screen!==undefined) {
          screen.needsTabRecalc = true;
      }
      return this;
    }
     noMargins() {
      this.style["margin"] = this.style["margin-left"] = this.style["margin-right"] = "0px";
      this.style["margin-top"] = this.style["margin-bottom"] = "0px";
      return this;
    }
     noPadding() {
      this.style["padding"] = this.style["padding-left"] = this.style["padding-right"] = "0px";
      this.style["padding-top"] = this.style["padding-bottom"] = "0px";
      return this;
    }
    get  background() {
      return this.__background;
    }
    set  background(bg) {
      this.__background = bg;
      this.overrideDefault("background-color", bg);
      this.style["background-color"] = bg;
    }
     getTotalRect() {
      let found=false;
      let min=new Vector2([1e+17, 1e+17]);
      let max=new Vector2([-1e+17, -1e+17]);
      let doaabb=(n) =>        {
        let rs=n.getClientRects();
        for (let r of rs) {
            min[0] = Math.min(min[0], r.x);
            min[1] = Math.min(min[1], r.y);
            max[0] = Math.max(max[0], r.x+r.width);
            max[1] = Math.max(max[1], r.y+r.height);
            found = true;
        }
      };
      doaabb(this);
      this._forEachChildWidget((n) =>        {
        doaabb(n);
      });
      if (found) {
          return {width: max[0]-min[0], 
       height: max[1]-min[1], 
       x: min[0], 
       y: min[1], 
       left: min[0], 
       top: min[1], 
       right: max[0], 
       bottom: max[1]}
      }
      else {
        return undefined;
      }
    }
     parseNumber(value, args={}) {
      value = (""+value).trim().toLowerCase();
      let baseUnit=args.baseUnit||this.baseUnit;
      let isInt=args.isInt||this.isInt;
      let sign=1.0;
      if (value.startsWith("-")) {
          value = value.slice(1, value.length).trim();
          sign = -1;
      }
      let hexre=/-?[0-9a-f]+h$/;
      if (value.startsWith("0b")) {
          value = value.slice(2, value.length).trim();
          value = parseInt(value, 2);
      }
      else 
        if (value.startsWith("0x")) {
          value = value.slice(2, value.length).trim();
          value = parseInt(value, 16);
      }
      else 
        if (value.search(hexre)===0) {
          value = value.slice(0, value.length-1).trim();
          value = parseInt(value, 16);
      }
      else {
        value = units.parseValue(value, baseUnit);
      }
      if (isInt) {
          value = ~~value;
      }
      return value*sign;
    }
     formatNumber(value, args={}) {
      let baseUnit=args.baseUnit||this.baseUnit;
      let displayUnit=args.displayUnit||this.displayUnit;
      let isInt=args.isInt||this.isInt;
      let radix=args.radix||this.radix||10;
      let decimalPlaces=args.decimalPlaces||this.decimalPlaces;
      if (isInt&&radix!==10) {
          let ret=Math.floor(value).toString(radix);
          if (radix===2)
            return "0b"+ret;
          else 
            if (radix===16)
            return ret+"h";
      }
      return units.buildString(value, baseUnit, decimalPlaces, displayUnit);
    }
     setCSS() {
      let bg=this.getDefault("background-color");
      if (bg) {
          this.style["background-color"] = bg;
      }
      let zoom=this.getZoom();
      this.style["transform"] = `scale(${zoom},${zoom})`;
    }
     traverse(type_or_set) {
      let this2=this;
      let classes=type_or_set;
      let is_set=__instance_of(type_or_set, Set);
      is_set = is_set||__instance_of(type_or_set, util.set);
      is_set = is_set||Array.isArray(type_or_set);
      if (!is_set) {
          classes = [type_or_set];
      }
      let visit=new Set();
      return (function* () {
        let stack=[this2];
        while (stack.length>0) {
          let n=stack.pop();
          visit.add(n);
          if (!n||!n.childNodes) {
              continue;
          }
          for (let cls of classes) {
              if (__instance_of(n, cls)) {
                  yield n;
              }
          }
          for (let c of n.childNodes) {
              if (!visit.has(c)) {
                  stack.push(c);
              }
          }
          if (n.shadow) {
              for (let c of n.shadow.childNodes) {
                  if (!visit.has(c)) {
                      stack.push(c);
                  }
              }
          }
        }
      })();
    }
     appendChild(child) {
      if (__instance_of(child, UIBase)) {
          child.ctx = this.ctx;
          child.parentWidget = this;
          child.useDataPathUndo = this.useDataPathUndo;
      }
      return super.appendChild(child);
    }
     init() {
      this._init_done = true;
      if (this._id)
        this.setAttribute("id", this._id);
    }
     _ondestroy() {
      if (this.tabIndex>=0) {
          this.regenTabOrder();
      }
      if (cconst.DEBUG.paranoidEvents) {
          for (let item of this.__cbs) {
              this.removeEventListener(item[0], item[1], item[2]);
          }
          this.__cbs = [];
      }
      if (this.ondestroy!==undefined) {
          this.ondestroy();
      }
    }
     remove(trigger_on_destroy=true) {
      if (this.tabIndex>=0) {
          this.regenTabOrder();
      }
      super.remove();
      if (trigger_on_destroy) {
          this._ondestroy();
      }
      if (this.on_remove) {
          this.on_remove();
      }
      this.parentWidget = undefined;
    }
     on_remove() {

    }
     removeChild(child, trigger_on_destroy=true) {
      super.removeChild(child);
      if (trigger_on_destroy) {
          child._ondestroy();
      }
    }
     flushUpdate() {
      this.update();
      this._forEachChildWidget((c) =>        {
        c.flushUpdate();
      });
    }
     _forEachChildWidget(cb, thisvar) {
      let rec=(n) =>        {
        if (__instance_of(n, UIBase)) {
            if (thisvar!==undefined) {
                cb.call(thisvar, n);
            }
            else {
              cb(n);
            }
        }
        else {
          for (let n2 of n.childNodes) {
              rec(n2);
          }
          if (n.shadow!==undefined) {
              for (let n2 of n.shadow.childNodes) {
                  rec(n2);
              }
          }
        }
      };
      for (let n of this.childNodes) {
          rec(n);
      }
      for (let n of this.shadow.childNodes) {
          rec(n);
      }
    }
     _init() {
      if (this._init_done) {
          return ;
      }
      this._init_done = true;
      this.init();
    }
    static  setDefault(element) {
      return element;
    }
     getWinWidth() {
      return window.innerWidth;
    }
     getWinHeight() {
      return window.innerHeight;
    }
     calcZ() {
      let p=this;
      let n=this;
      while (n) {
        if (n.style&&n.style["z-index"]) {
            let z=parseFloat(n.style["z-index"]);
            return z;
        }
        n = n.parentNode;
        if (!n) {
            n = p = p.parentWidget;
        }
      }
      return 0;
    }
     pickElement(x, y, args={}, marginy=0, nodeclass=UIBase, excluded_classes=undefined) {
      let marginx;
      let clip;
      if (typeof args==="object") {
          marginx = args.sx||0;
          marginy = args.sy||0;
          nodeclass = args.nodeclass||UIBase;
          excluded_classes = args.excluded_classes;
          clip = args.clip;
      }
      else {
        marginx = args;
        args = {marginx: marginx||0, 
      marginy: marginy||0, 
      nodeclass: nodeclass||UIBase, 
      excluded_classes: excluded_classes, 
      clip: clip};
      }
      if (!clip) {
          clip = {pos: new Vector2([-10000, 10000]), 
       size: new Vector2([20000, 10000])};
      }
      let ret=undefined;
      let retzindex=undefined;
      let testwidget=(n) =>        {
        if (__instance_of(n, nodeclass)) {
            let ok=true;
            ok = n.visibleToPick;
            ok = ok&&!n.hidden;
            ok = ok&&!(excluded_classes!==undefined&&excluded_classes.indexOf(n.constructor)>=0);
            return ok;
        }
      };
      let rec=(n, widget, widget_zindex, zindex, clip, depth) =>        {
        if (depth===undefined) {
            depth = 0;
        }
        if (n.style&&n.style["z-index"]) {
            if (!(__instance_of(n, UIBase))||n.visibleToPick) {
                zindex = parseInt(n.style["z-index"]);
            }
        }
        if (n.getClientRects&&n.getClientRects().length>0) {
            let rects=n.getClientRects();
            let rect=n.getBoundingClientRect();
            if (n.style&&n.style["overflow"]==="hidden"||n.style["overflow"]==="scroll") {
                clip = math.aabb_intersect_2d(clip.pos, clip.size, [rect.x, rect.y], [rect.width, rect.height]);
                if (!clip) {
                    return ;
                }
            }
            if (testwidget(n)) {
                widget = n;
                widget_zindex = zindex;
            }
            let ok=true;
            if (__instance_of(n, UIBase)) {
                ok = ok&&n.visibleToPick;
            }
            if (!ok) {
                return ;
            }
            for (let rect of rects) {
                ok = true;
                let clip2=math.aabb_intersect_2d(clip.pos, clip.size, [rect.x, rect.y], [rect.width, rect.height]);
                if (!clip2) {
                    ok = false;
                    continue;
                }
                ok = ok&&!n.hidden;
                ok = ok&&(retzindex===undefined||widget_zindex>=retzindex);
                ok = ok&&(retzindex===undefined||zindex>=retzindex);
                ok = ok&&x>=clip2.pos[0]-marginx&&x<=clip2.pos[0]+clip2.size[0]+marginy;
                ok = ok&&y>=clip2.pos[1]-marginy&&y<=clip2.pos[1]+clip2.size[1]+marginx;
                if (n.visibleToPick!==undefined) {
                    ok = ok&&n.visibleToPick;
                }
                if (ok) {
                    ret = widget;
                    retzindex = zindex;
                }
            }
        }
        let isleaf=n.childNodes.length===0;
        if (n.shadow!==undefined) {
            isleaf = isleaf&&(n.shadow.childNodes.length===0);
        }
        if (typeof n==="object"&&__instance_of(n, UIBase)&&!n.visibleToPick) {
            return ;
        }
        if (!isleaf) {
            if (n.shadow!==undefined) {
                for (let i=0; i<n.shadow.childNodes.length; i++) {
                    let i2=i;
                    let n2=n.shadow.childNodes[i2];
                    if (n2.childNodes&&n2.style) {
                        rec(n2, widget, widget_zindex, zindex, clip, depth+1);
                    }
                }
            }
            for (let i=0; i<n.childNodes.length; i++) {
                let i2=i;
                let n2=n.childNodes[i2];
                if (n2.childNodes&&n2.style) {
                    rec(n2, widget, widget_zindex, zindex, clip, depth+1);
                }
            }
        }
      };
      let p=this;
      while (p&&!p.style["z-index"]&&p.style["z-index"]!==0.0) {
        p = p.parentWidget;
      }
      let zindex=p!==undefined ? parseInt(p.style["z-index"]) : 0;
      rec(this, testwidget(this) ? this : undefined, zindex, zindex, clip, 0);
      return ret;
    }
    set  disabled(val) {
      if (!!this._disabled==!!val)
        return ;
      if (val&&!this._disdata) {
          let style=this.getDefault("Disabled")||{"background-color": "black"};
          this._disdata = {style: {}, 
       defaults: {}};
          for (let k in style) {
              this._disdata.style[k] = this.style[k];
              this._disdata.defaults[k] = this.default_overrides[k];
              let v=style[k];
              if (typeof v==="object"&&__instance_of(v, CSSFont)) {
                  this.style[k] = style[k].genCSS();
                  this.default_overrides[k] = style[k];
              }
              else {
                this.style[k] = style[k];
                this.default_overrides[k] = style[k];
              }
          }
          this._disabled = val;
          this.on_disabled();
      }
      else 
        if (!val&&this._disdata) {
          for (let k in this._disdata.style) {
              this.style[k] = this._disdata.style[k];
          }
          for (let k in this._disdata.defaults) {
              let v=this._disdata.defaults[k];
              if (v===undefined) {
                  delete this.default_overrides[k];
              }
              else {
                this.default_overrides[k] = v;
              }
          }
          this.background = this.style["background-color"];
          this._disdata = undefined;
          this._disabled = val;
          this.on_enabled();
      }
      this._disabled = val;
      let rec=(n) =>        {
        if (__instance_of(n, UIBase)) {
            let changed=!!n.disabled!=!!val;
            n.disabled = val;
            if (changed) {
                n.update();
                n.setCSS();
            }
        }
        for (let c of n.childNodes) {
            rec(c);
        }
        if (!n.shadow)
          return ;
        for (let c of n.shadow.childNodes) {
            rec(c);
        }
      };
      rec(this);
    }
     on_disabled() {

    }
     on_enabled() {

    }
     pushModal(handlers=this, autoStopPropagation=true) {
      if (this._modaldata!==undefined) {
          console.warn("UIBase.prototype.pushModal called when already in modal mode");
          popModalLight(this._modaldata);
          this._modaldata = undefined;
      }
      this._modaldata = pushModalLight(handlers, autoStopPropagation);
      return this._modaldata;
    }
     popModal() {
      if (this._modaldata===undefined) {
          console.warn("Invalid call to UIBase.prototype.popModal");
          return ;
      }
      popModalLight(this._modaldata);
      this._modaldata = undefined;
    }
    get  disabled() {
      return this._disabled;
    }
     flash(color, rect_element=this, timems=355) {
      console.warn("flash");
      if (typeof color!="object") {
          color = css2color(color);
      }
      color = new Vector4(color);
      let csscolor=color2css(color);
      if (this._flashtimer!==undefined&&this._flashcolor!==csscolor) {
          window.setTimeout(() =>            {
            this.flash(color, rect_element, timems);
          }, 100);
          return ;
      }
      else 
        if (this._flashtimer!==undefined) {
          return ;
      }
      let rect=rect_element.getBoundingClientRect();
      if (rect===undefined) {
          return ;
      }
      let timer;
      let tick=0;
      let max=~~(timems/20);
      let x=rect.x, y=rect.y;
      let cb=(e) =>        {
        if (timer===undefined) {
            return ;
        }
        let a=1.0-tick/max;
        div.style["background-color"] = color2css(color, a*a*0.5);
        if (tick>max) {
            window.clearInterval(timer);
            this._flashtimer = undefined;
            this._flashcolor = undefined;
            timer = undefined;
            div.remove();
            this.focus();
        }
        tick++;
      };
      setTimeout(cb, 5);
      this._flashtimer = timer = window.setInterval(cb, 20);
      let div=document.createElement("div");
      div.style["pointer-events"] = "none";
      div.tabIndex = undefined;
      div.style["z-index"] = "900";
      div.style["display"] = "float";
      div.style["position"] = "absolute";
      div.style["margin"] = "0px";
      div.style["left"] = x+"px";
      div.style["top"] = y+"px";
      div.style["background-color"] = color2css(color, 0.5);
      div.style["width"] = rect.width+"px";
      div.style["height"] = rect.height+"px";
      div.setAttribute("class", "UIBaseFlash");
      let screen=this.getScreen();
      if (screen!==undefined) {
          screen._enterPopupSafe();
      }
      document.body.appendChild(div);
      this.focus();
      this._flashcolor = csscolor;
      if (screen!==undefined) {
          screen._exitPopupSafe();
      }
    }
     destory() {

    }
     on_resize(newsize) {

    }
    get  ctx() {
      return this._ctx;
    }
     toJSON() {
      let ret={};
      if (this.hasAttribute("datapath")) {
          ret.datapath = this.getAttribute("datapath");
      }
      return ret;
    }
     loadJSON(obj) {
      if (!this._init_done) {
          this._init();
      }
    }
     getPathValue(ctx, path) {
      try {
        return ctx.api.getValue(ctx, path);
      }
      catch (error) {
          return undefined;
      }
    }
     undoBreakPoint() {
      this.pathUndoGen++;
    }
     setPathValueUndo(ctx, path, val) {
      let mass_set_path=this.getAttribute("mass_set_path");
      let rdef=ctx.api.resolvePath(ctx, path);
      let prop=rdef.prop;
      if (ctx.api.getValue(ctx, path)===val) {
          return ;
      }
      let toolstack=this.ctx.toolstack;
      let head=toolstack.head;
      let bad=head===undefined||!(__instance_of(head, getDataPathToolOp()));
      bad = bad||head.hashThis()!==head.hash(mass_set_path, path, prop.type, this._id);
      bad = bad||this.pathUndoGen!==this._lastPathUndoGen;
      if (!bad) {
          toolstack.undo();
          head.setValue(ctx, val, rdef.obj);
          toolstack.redo();
      }
      else {
        this._lastPathUndoGen = this.pathUndoGen;
        let toolop=getDataPathToolOp().create(ctx, path, val, this._id, mass_set_path);
        ctx.toolstack.execTool(this.ctx, toolop);
      }
    }
     pushReportContext(key) {
      if (this.ctx.api.pushReportContext) {
          this.ctx.api.pushReportContext(key);
      }
    }
     popReportContext() {
      if (this.ctx.api.popReportContext)
        this.ctx.api.popReportContext();
    }
     setPathValue(ctx, path, val) {
      if (this.useDataPathUndo) {
          this.pushReportContext(this._reportCtxName);
          try {
            this.setPathValueUndo(ctx, path, val);
          }
          catch (error) {
              this.popReportContext();
              if (!(__instance_of(error, DataPathError))) {
                  throw error;
              }
              else {
                return ;
              }
          }
          this.popReportContext();
          return ;
      }
      this.pushReportContext(this._reportCtxName);
      try {
        if (this.hasAttribute("mass_set_path")) {
            ctx.api.massSetProp(ctx, this.getAttribute("mass_set_path"), val);
            ctx.api.setValue(ctx, path, val);
        }
        else {
          ctx.api.setValue(ctx, path, val);
        }
      }
      catch (error) {
          this.popReportContext();
          if (!(__instance_of(error, DataPathError))) {
              throw error;
          }
          return ;
      }
      this.popReportContext();
    }
    get  _reportCtxName() {
      return ""+this._id;
    }
     getPathMeta(ctx, path) {
      this.pushReportContext(this._reportCtxName);
      let ret=ctx.api.resolvePath(ctx, path);
      this.popReportContext();
      return ret!==undefined ? ret.prop : undefined;
    }
     getPathDescription(ctx, path) {
      let ret;
      this.pushReportContext(this._reportCtxName);
      try {
        ret = ctx.api.getDescription(ctx, path);
      }
      catch (error) {
          this.popReportContext();
          if (__instance_of(error, DataPathError)) {
              return undefined;
          }
          else {
            throw error;
          }
      }
      this.popReportContext();
      return ret;
    }
     getScreen() {
      if (this.ctx!==undefined)
        return this.ctx.screen;
    }
     isDead() {
      return !this.isConnected;
      let p=this, lastp=this;
      function find(c, n) {
        for (let n2 of c) {
            if (n2===n) {
                return true;
            }
        }
      }
      while (p) {
        lastp = p;
        let parent=p.parentWidget;
        if (!parent) {
            parent = p.parentElement ? p.parentElement : p.parentNode;
        }
        if (parent&&p&&!find(parent.childNodes, p)) {
            if (parent.shadow!==undefined&&!find(parent.shadow.childNodes)) {
                return true;
            }
        }
        p = parent;
        if (p===document.body) {
            return false;
        }
      }
      return true;
    }
     doOnce(func, timeout=undefined) {
      if (func._doOnce===undefined) {
          func._doOnce_reqs = new Set();
          func._doOnce = (thisvar) =>            {
            if (func._doOnce_reqs.has(thisvar._id)) {
                return ;
            }
            func._doOnce_reqs.add(thisvar._id);
            let f=() =>              {
              if (this.isDead()) {
                  if (func===this._init||!cconst.DEBUG.doOnce) {
                      return ;
                  }
                  console.warn("Ignoring doOnce call for dead element", this._id, func);
                  return ;
              }
              if (!this.ctx) {
                  if (cconst.DEBUG.doOnce) {
                      console.warn("doOnce call is waiting for context...", this._id, func);
                  }
                  window.setTimeout(f, 0);
                  return ;
              }
              func._doOnce_reqs.delete(thisvar._id);
              func.call(thisvar);
            }
            window.setTimeout(f, timeout);
          };
      }
      func._doOnce(this);
    }
    set  ctx(c) {
      this._ctx = c;
      this._forEachChildWidget((n) =>        {
        n.ctx = c;
      });
    }
     float(x=0, y=0, zindex=undefined) {
      this.style.position = "absolute";
      this.style.left = x+"px";
      this.style.top = y+"px";
      if (zindex!==undefined) {
          this.style["z-index"] = zindex;
      }
      return this;
    }
     _ensureChildrenCtx() {
      let ctx=this.ctx;
      if (ctx===undefined) {
          return ;
      }
      this._forEachChildWidget((n) =>        {
        n.parentWidget = this;
        if (n.ctx===undefined) {
            n.ctx = ctx;
        }
        n._ensureChildrenCtx(ctx);
      });
    }
     update() {
      if (this.ctx&&this._description===undefined&&this.getAttribute("datapath")) {
          let d=this.getPathDescription(this.ctx, this.getAttribute("datapath"));
          this.description = d;
      }
      if (!this._init_done) {
          this._init();
      }
    }
     onadd() {
      if (!this._init_done) {
          this.doOnce(this._init);
      }
      if (this.tabIndex>=0) {
          this.regenTabOrder();
      }
    }
     getZoom() {
      if (this.parentWidget!==undefined) {
          return this.parentWidget.getZoom();
      }
      return 1.0;
    }
     getDPI() {
      if (this.parentWidget!==undefined) {
          return this.parentWidget.getDPI();
      }
      return UIBase.getDPI();
    }
    static  getDPI() {
      return window.devicePixelRatio;
      return window.devicePixelRatio;
    }
     saveData() {
      return {}
    }
     loadData(obj) {
      return this;
    }
    static  register(cls) {
      customElements.define(cls.define().tagname, cls);
    }
     overrideDefault(key, val) {
      this.default_overrides[key] = val;
    }
     overrideClass(style) {
      this._override_class = style;
    }
     overrideClassDefault(style, key, val) {
      if (!(style in this.class_default_overrides)) {
          this.class_default_overrides[style] = {};
      }
      this.class_default_overrides[style][key] = val;
    }
     _doMobileDefault(key, val) {
      if (!util.isMobile())
        return val;
      key = key.toLowerCase();
      let ok=false;
      for (let re of _mobile_theme_patterns) {
          if (key.search(re)>=0) {
              ok = true;
              break;
          }
      }
      if (ok) {
          val*=theme.base.mobileSizeMultiplier;
      }
      return val;
    }
     getDefault(key, doMobile=true) {
      let p=this;
      while (p) {
        if (key in p.default_overrides) {
            let v=p.default_overrides[key];
            return doMobile ? this._doMobileDefault(key, v) : v;
        }
        p = p.parentWidget;
      }
      return this.getClassDefault(key, doMobile);
    }
     getStyleClass() {
      if (this._override_class!==undefined) {
          return this._override_class;
      }
      let p=this.constructor, lastp=undefined;
      while (p&&p!==lastp&&p!==UIBase&&p!==Object) {
        let def=p.define();
        if (def.style) {
            return def.style;
        }
        if (!p.prototype||!p.prototype.__proto__)
          break;
        p = p.prototype.__proto__.constructor;
      }
      return "base";
    }
     getClassDefault(key, doMobile=true) {
      let style=this.getStyleClass();
      let val=undefined;
      let p=this;
      while (p) {
        let def=p.class_default_overrides[style];
        if (def&&(key in def)) {
            val = def[key];
            break;
        }
        p = p.parentWidget;
      }
      if (val===undefined&&style in theme&&key in theme[style]) {
          val = theme[style][key];
      }
      else 
        if (val===undefined) {
          val = theme.base[key];
      }
      return doMobile ? this._doMobileDefault(key, val) : val;
    }
     getStyle() {
      console.warn("deprecated call to UIBase.getStyle");
      return this.getStyleClass();
    }
     animate(_extra_handlers={}) {
      let transform=new DOMMatrix(this.style["transform"]);
      let update_trans=() =>        {
        let t=transform;
        let css="matrix("+t.a+","+t.b+","+t.c+","+t.d+","+t.e+","+t.f+")";
        this.style["transform"] = css;
      };
      let handlers={background_get: function background_get() {
          return css2color(this.background);
        }, 
     background_set: function background_set(c) {
          if (typeof c!=="string") {
              c = color2css(c);
          }
          this.background = c;
        }, 
     dx_get: function dx_get() {
          return transform.m41;
        }, 
     dx_set: function dx_set(x) {
          transform.m41 = x;
          update_trans();
        }, 
     dy_get: function dy_get() {
          return transform.m42;
        }, 
     dy_set: function dy_set(x) {
          transform.m42 = x;
          update_trans();
        }};
      handlers = Object.assign(handlers, _extra_handlers);
      let handler={get: (target, key, receiver) =>          {
          if ((key+"_get") in handlers) {
              return handlers[key+"_get"].call(target);
          }
          else {
            return target[key];
          }
        }, 
     set: (target, key, val, receiver) =>          {
          if ((key+"_set") in handlers) {
              handlers[key+"_set"].call(target, val);
          }
          else {
            target[key] = val;
          }
          return true;
        }};
      let proxy=new Proxy(this, handler);
      let anim=new Animator(proxy);
      anim.onend = () =>        {
        this._active_animations.remove(anim);
      };
      this._active_animations.push(anim);
      return anim;
    }
     abortAnimations() {
      for (let anim of util.list(this._active_animations)) {
          anim.end();
      }
      this._active_animations = [];
    }
    static  define() {
      throw new Error("Missing define() for ux element");
    }
  }
  _ESClass.register(UIBase);
  _es6_module.add_class(UIBase);
  UIBase = _es6_module.add_export('UIBase', UIBase);
  function drawRoundBox2(elem, options) {
    if (options===undefined) {
        options = {};
    }
    drawRoundBox(elem, options.canvas, options.g, options.width, options.height, options.r, options.op, options.color, options.margin, options.no_clear);
  }
  drawRoundBox2 = _es6_module.add_export('drawRoundBox2', drawRoundBox2);
  function drawRoundBox(elem, canvas, g, width, height, r, op, color, margin, no_clear) {
    if (r===undefined) {
        r = undefined;
    }
    if (op===undefined) {
        op = "fill";
    }
    if (color===undefined) {
        color = undefined;
    }
    if (margin===undefined) {
        margin = undefined;
    }
    if (no_clear===undefined) {
        no_clear = false;
    }
    width = width===undefined ? canvas.width : width;
    height = height===undefined ? canvas.height : height;
    g.save();
    let dpi=elem.getDPI();
    r = r===undefined ? elem.getDefault("BoxRadius") : r;
    if (margin===undefined) {
        margin = elem.getDefault("BoxDrawMargin");
    }
    r*=dpi;
    let r1=r, r2=r;
    if (r>(height-margin*2)*0.5) {
        r1 = (height-margin*2)*0.5;
    }
    if (r>(width-margin*2)*0.5) {
        r2 = (width-margin*2)*0.5;
    }
    let bg=color;
    if (bg===undefined&&canvas._background!==undefined) {
        bg = canvas._background;
    }
    else 
      if (bg===undefined) {
        bg = elem.getDefault("BoxBG");
    }
    if (op=="fill"&&!no_clear) {
        g.clearRect(0, 0, width, height);
    }
    g.fillStyle = bg;
    g.strokeStyle = color===undefined ? elem.getDefault("BoxBorder") : color;
    let w=width, h=height;
    let th=Math.PI/4;
    let th2=Math.PI*0.75;
    g.beginPath();
    g.moveTo(margin, margin+r1);
    g.lineTo(margin, h-r1-margin);
    g.quadraticCurveTo(margin, h-margin, margin+r2, h-margin);
    g.lineTo(w-margin-r2, h-margin);
    g.quadraticCurveTo(w-margin, h-margin, w-margin, h-margin-r1);
    g.lineTo(w-margin, margin+r1);
    g.quadraticCurveTo(w-margin, margin, w-margin-r2, margin);
    g.lineTo(margin+r2, margin);
    g.quadraticCurveTo(margin, margin, margin, margin+r1);
    g.closePath();
    if (op=="clip") {
        g.clip();
    }
    else 
      if (op=="fill") {
        g.fill();
        g.stroke();
    }
    else {
      g.stroke();
    }
    g.restore();
  }
  drawRoundBox = _es6_module.add_export('drawRoundBox', drawRoundBox);
  
  function _getFont_new(elem, size, font, do_dpi) {
    if (font===undefined) {
        font = "DefaultText";
    }
    if (do_dpi===undefined) {
        do_dpi = true;
    }
    font = elem.getDefault(font);
    return font.genCSS(size);
  }
  _getFont_new = _es6_module.add_export('_getFont_new', _getFont_new);
  function getFont(elem, size, font, do_dpi) {
    if (font===undefined) {
        font = "DefaultText";
    }
    if (do_dpi===undefined) {
        do_dpi = true;
    }
    return _getFont_new(elem, size, font = "DefaultText", do_dpi = true);
  }
  getFont = _es6_module.add_export('getFont', getFont);
  function _getFont(elem, size, font, do_dpi) {
    if (font===undefined) {
        font = "DefaultText";
    }
    if (do_dpi===undefined) {
        do_dpi = true;
    }
    let dpi=elem.getDPI();
    let font2=elem.getDefault(font);
    if (font2!==undefined) {
        return _getFont_new(elem, size, font, do_dpi);
    }
    console.warn("Old style font detected");
    if (!do_dpi) {
        dpi = 1;
    }
    if (size!==undefined) {
        return ""+(size*dpi)+"px "+getDefault(font+"Font");
    }
    else {
      let size=getDefault(font+"Size");
      if (size===undefined) {
          console.warn("Unknown fontsize for font", font);
          size = 14;
      }
      return ""+size+"px "+getDefault(font+"Font");
    }
  }
  _getFont = _es6_module.add_export('_getFont', _getFont);
  function _ensureFont(elem, canvas, g, size) {
    if (canvas.font) {
        g.font = canvas.font;
    }
    else {
      let font=elem.getDefault("DefaultText");
      g.font = font.genCSS(size);
    }
  }
  _ensureFont = _es6_module.add_export('_ensureFont', _ensureFont);
  let _mc;
  function get_measure_canvas() {
    if (_mc!==undefined) {
        return _mc;
    }
    _mc = document.createElement("canvas");
    _mc.width = 256;
    _mc.height = 256;
    _mc.g = _mc.getContext("2d");
    return _mc;
  }
  function measureTextBlock(elem, text, canvas, g, size, font) {
    if (canvas===undefined) {
        canvas = undefined;
    }
    if (g===undefined) {
        g = undefined;
    }
    if (size===undefined) {
        size = undefined;
    }
    if (font===undefined) {
        font = undefined;
    }
    let lines=text.split("\n");
    let ret={width: 0, 
    height: 0}
    if (size===undefined) {
        if (font!==undefined&&typeof font==="object") {
            size = font.size;
        }
        if (size===undefined) {
            size = elem.getDefault("DefaultText").size;
        }
    }
    for (let line of lines) {
        let m=measureText(elem, line, canvas, g, size, font);
        ret.width = Math.max(ret.width, m.width);
        let h=m.height!==undefined ? m.height : size*1.25;
        ret.height+=h;
    }
    return ret;
  }
  measureTextBlock = _es6_module.add_export('measureTextBlock', measureTextBlock);
  function measureText(elem, text, canvas, g, size, font) {
    if (canvas===undefined) {
        canvas = undefined;
    }
    if (g===undefined) {
        g = undefined;
    }
    if (size===undefined) {
        size = undefined;
    }
    if (font===undefined) {
        font = undefined;
    }
    if (typeof canvas==="object"&&canvas!==null&&!(__instance_of(canvas, HTMLCanvasElement))&&canvas.tagName!=="CANVAS") {
        let args=canvas;
        canvas = args.canvas;
        g = args.g;
        size = args.size;
        font = args.font;
    }
    if (g===undefined) {
        canvas = get_measure_canvas();
        g = canvas.g;
    }
    if (font!==undefined) {
        if (typeof font==="object"&&__instance_of(font, CSSFont)) {
            font = font.genCSS(size);
        }
        g.font = font;
    }
    else {
      _ensureFont(elem, canvas, g, size);
    }
    let ret=g.measureText(text);
    if (ret&&util.isMobile()) {
        let ret2={};
        let dpi=UIBase.getDPI();
        for (let k in ret) {
            let v=ret[k];
            if (typeof v==="number") {
                v*=dpi;
            }
            ret2[k] = v;
        }
        ret = ret2;
    }
    if (size!==undefined) {
        g.font = undefined;
    }
    return ret;
  }
  measureText = _es6_module.add_export('measureText', measureText);
  function drawText(elem, x, y, text, args) {
    if (args===undefined) {
        args = {};
    }
    let canvas=args.canvas, g=args.g, color=args.color, font=args.font;
    let size=args.size;
    if (size===undefined) {
        if (font!==undefined&&__instance_of(font, CSSFont)) {
            size = font.size;
        }
        else {
          size = elem.getDefault("DefaultText").size;
        }
    }
    size*=UIBase.getDPI();
    if (font===undefined) {
        _ensureFont(elem, canvas, g, size);
    }
    else 
      if (typeof font==="object"&&__instance_of(font, CSSFont)) {
        g.font = font = font.genCSS(size);
    }
    else 
      if (font) {
        g.font = font;
    }
    if (color===undefined) {
        color = elem.getDefault("DefaultText").color;
    }
    if (typeof color==="object") {
        color = color2css(color);
    }
    g.fillStyle = color;
    g.fillText(text, x+0.5, y+0.5);
    if (size!==undefined) {
        g.font = undefined;
    }
  }
  drawText = _es6_module.add_export('drawText', drawText);
  let PIDX=0, PSHADOW=1, PTOT=2;
  function saveUIData(node, key) {
    if (key===undefined) {
        throw new Error("ui_base.saveUIData(): key cannot be undefined");
    }
    let paths=[];
    let rec=(n, path, ni, is_shadow) =>      {
      path = path.slice(0, path.length);
      let pi=path.length;
      for (let i=0; i<PTOT; i++) {
          path.push(undefined);
      }
      path[pi] = ni;
      path[pi+1] = is_shadow;
      if (__instance_of(n, UIBase)) {
          let path2=path.slice(0, path.length);
          path2.push(n.saveData());
          if (path2[pi+2]) {
              paths.push(path2);
          }
      }
      for (let i=0; i<n.childNodes.length; i++) {
          let n2=n.childNodes[i];
          rec(n2, path, i, false);
      }
      let shadow=n.shadow;
      if (!shadow)
        return ;
      for (let i=0; i<shadow.childNodes.length; i++) {
          let n2=shadow.childNodes[i];
          rec(n2, path, i, true);
      }
    }
    rec(node, [], 0, false);
    return JSON.stringify({key: key, 
    paths: paths, 
    _ui_version: 1});
  }
  saveUIData = _es6_module.add_export('saveUIData', saveUIData);
  window._saveUIData = saveUIData;
  function loadUIData(node, buf) {
    if (buf===undefined||buf===null) {
        return ;
    }
    let obj=JSON.parse(buf);
    let key=buf.key;
    for (let path of obj.paths) {
        let n=node;
        let data=path[path.length-1];
        path = path.slice(2, path.length-1);
        for (let pi=0; pi<path.length; pi+=PTOT) {
            let ni=path[pi], shadow=path[pi+1];
            let list;
            if (shadow) {
                list = n.shadow;
                if (list) {
                    list = list.childNodes;
                }
            }
            else {
              list = n.childNodes;
            }
            if (list===undefined||list[ni]===undefined) {
                n = undefined;
                break;
            }
            n = list[ni];
        }
        if (n!==undefined&&__instance_of(n, UIBase)) {
            n._init();
            n.loadData(data);
        }
    }
  }
  loadUIData = _es6_module.add_export('loadUIData', loadUIData);
  window._loadUIData = loadUIData;
  _setUIBase(UIBase);
}, '/dev/fairmotion/src/path.ux/scripts/core/ui_base.js');
es6_module_define('ui_theme', ["../util/vectormath.js", "../util/struct.js", "../util/util.js", "../config/const.js"], function _ui_theme_module(_es6_module) {
  var util=es6_import(_es6_module, '../util/util.js');
  var Vector3=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector4');
  var nstructjs=es6_import(_es6_module, '../util/struct.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  let ColorSchemeTypes={LIGHT: "light", 
   DARK: "dark"}
  ColorSchemeTypes = _es6_module.add_export('ColorSchemeTypes', ColorSchemeTypes);
  function parsepx(css) {
    return parseFloat(css.trim().replace("px", ""));
  }
  parsepx = _es6_module.add_export('parsepx', parsepx);
  function color2css(c, alpha_override) {
    let r=~~(c[0]*255);
    let g=~~(c[1]*255);
    let b=~~(c[2]*255);
    let a=c.length<4 ? 1.0 : c[3];
    a = alpha_override!==undefined ? alpha_override : a;
    if (c.length==3&&alpha_override===undefined) {
        return `rgb(${r},${g},${b})`;
    }
    else {
      return `rgba(${r},${g},${b}, ${a})`;
    }
  }
  color2css = _es6_module.add_export('color2css', color2css);
  window.color2css = color2css;
  let css2color_rets=util.cachering.fromConstructor(Vector4, 64);
  let cmap={red: [1, 0, 0, 1], 
   green: [0, 1, 0, 1], 
   blue: [0, 0, 1, 1], 
   yellow: [1, 1, 0, 1], 
   white: [1, 1, 1, 1], 
   black: [0, 0, 0, 1], 
   grey: [0.7, 0.7, 0.7, 1], 
   teal: [0, 1, 1, 1], 
   orange: [1, 0.55, 0.25, 1], 
   brown: [0.7, 0.4, 0.3, 1]}
  function color2web(color) {
    function tostr(n) {
      n = ~~(n*255);
      let s=n.toString(16);
      if (s.length>2) {
          s = s.slice(0, 2);
      }
      while (s.length<2) {
        s = "0"+s;
      }
      return s;
    }
    if (color.length===3||color[3]===1.0) {
        let r=tostr(color[0]);
        let g=tostr(color[1]);
        let b=tostr(color[2]);
        return "#"+r+g+b;
    }
    else {
      let r=tostr(color[0]);
      let g=tostr(color[1]);
      let b=tostr(color[2]);
      let a=tostr(color[3]);
      return "#"+r+g+b+a;
    }
  }
  color2web = _es6_module.add_export('color2web', color2web);
  window.color2web = color2web;
  function css2color(color) {
    if (!color) {
        return new Vector4([0, 0, 0, 1]);
    }
    color = (""+color).trim();
    let ret=css2color_rets.next();
    if (color[0]==="#") {
        color = color.slice(1, color.length);
        let parts=[];
        for (let i=0; i<color.length>>1; i++) {
            let part="0x"+color.slice(i*2, i*2+2);
            parts.push(parseInt(part));
        }
        ret.zero();
        let i;
        for (i = 0; i<Math.min(parts.length, ret.length); i++) {
            ret[i] = parts[i]/255.0;
        }
        if (i<4) {
            ret[3] = 1.0;
        }
        return ret;
    }
    if (color in cmap) {
        return ret.load(cmap[color]);
    }
    color = color.replace("rgba", "").replace("rgb", "").replace(/[\(\)]/g, "").trim().split(",");
    for (let i=0; i<color.length; i++) {
        ret[i] = parseFloat(color[i]);
        if (i<3) {
            ret[i]/=255;
        }
    }
    return ret;
  }
  css2color = _es6_module.add_export('css2color', css2color);
  window.css2color = css2color;
  function web2color(str) {
    if (typeof str==="string"&&str.trim()[0]!=="#") {
        str = "#"+str.trim();
    }
    return css2color(str);
  }
  web2color = _es6_module.add_export('web2color', web2color);
  window.web2color = web2color;
  let validate_pat=/\#?[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/;
  function validateWebColor(str) {
    if (typeof str!=="string"&&!(__instance_of(str, String)))
      return false;
    return str.trim().search(validate_pat)===0;
  }
  validateWebColor = _es6_module.add_export('validateWebColor', validateWebColor);
  let theme={}
  theme = _es6_module.add_export('theme', theme);
  function invertTheme() {
    cconst.colorSchemeType = cconst.colorSchemeType===ColorSchemeTypes.LIGHT ? ColorSchemeTypes.DARK : ColorSchemeTypes.LIGHT;
    function inverted(color) {
      if (Array.isArray(color)) {
          for (let i=0; i<3; i++) {
              color[i] = 1.0-color[i];
          }
          return color;
      }
      color = css2color(color);
      return color2css(inverted(color));
    }
    let bg=document.body.style["background-color"];
    bg = cconst.colorSchemeType===ColorSchemeTypes.LIGHT ? "rgb(200,200,200)" : "rgb(55, 55, 55)";
    document.body.style["background-color"] = bg;
    for (let style in theme) {
        style = theme[style];
        for (let k in style) {
            let v=style[k];
            if (__instance_of(v, CSSFont)) {
                v.color = inverted(v.color);
            }
            else 
              if (typeof v==="string") {
                v = v.trim().toLowerCase();
                let iscolor=v.search("rgb")>=0;
                iscolor = iscolor||v in cmap;
                iscolor = iscolor||validateWebColor(v);
                if (iscolor) {
                    style[k] = inverted(v);
                }
            }
        }
    }
  }
  invertTheme = _es6_module.add_export('invertTheme', invertTheme);
  window.invertTheme = invertTheme;
  function setColorSchemeType(mode) {
    if (!!mode!==cconst.colorSchemeType) {
        invertTheme();
        cconst.colorSchemeType = mode;
    }
  }
  setColorSchemeType = _es6_module.add_export('setColorSchemeType', setColorSchemeType);
  window.validateWebColor = validateWebColor;
  class CSSFont  {
     constructor(args={}) {
      this._size = args.size ? args.size : 12;
      this.font = args.font;
      this.style = args.style!==undefined ? args.style : "normal";
      this.weight = args.weight!==undefined ? args.weight : "normal";
      this.variant = args.variant!==undefined ? args.variant : "normal";
      this.color = args.color;
    }
    set  size(val) {
      this._size = val;
    }
    get  size() {
      if (util.isMobile()) {
          let mul=theme.base.mobileTextSizeMultiplier/visualViewport.scale;
          if (mul) {
              return this._size*mul;
              
          }
      }
      return this._size;
    }
     copyTo(b) {
      b._size = this._size;
      b.font = this.font;
      b.style = this.style;
      b.color = this.color;
      b.variant = this.variant;
      b.weight = this.weight;
    }
     copy() {
      let ret=new CSSFont();
      this.copyTo(ret);
      return ret;
    }
     genCSS(size=this.size) {
      return `${this.style} ${this.variant} ${this.weight} ${size}px ${this.font}`;
    }
     hash() {
      return this.genCSS+":"+this.size+":"+this.color;
    }
  }
  _ESClass.register(CSSFont);
  _es6_module.add_class(CSSFont);
  CSSFont = _es6_module.add_export('CSSFont', CSSFont);
  CSSFont.STRUCT = `
CSSFont {
  size     : float | obj._size;
  font     : string | obj.font || "";
  style    : string | obj.font || "";
  color    : string | ""+obj.color;
  variant  : string | obj.variant || "";
  weight   : string | ""+obj.weight;
}
`;
  nstructjs.register(CSSFont);
  function exportTheme(theme1) {
    if (theme1===undefined) {
        theme1 = theme;
    }
    let sortkeys=(obj) =>      {
      let keys=[];
      for (let k in obj) {
          keys.push(k);
      }
      keys.sort();
      return keys;
    }
    let s="var theme = {\n";
    function writekey(v, indent) {
      if (indent===undefined) {
          indent = "";
      }
      if (typeof v==="string") {
          if (v.search("\n")>=0) {
              v = "`"+v+"`";
          }
          else {
            v = "'"+v+"'";
          }
          return v;
      }
      else 
        if (typeof v==="object") {
          if (__instance_of(v, CSSFont)) {
              return `new CSSFont({
${indent}  font    : ${writekey(v.font)},
${indent}  weight  : ${writekey(v.weight)},
${indent}  variant : ${writekey(v.variant)},
${indent}  style   : ${writekey(v.style)},
${indent}  size    : ${writekey(v._size)},
${indent}  color   : ${writekey(v.color)}
${indent}})`;
          }
          else {
            let s="{\n";
            for (let k of sortkeys(v)) {
                let v2=v[k];
                if (k.search(" ")>=0||k.search("-")>=0) {
                    k = "'"+k+"'";
                }
                s+=indent+"  "+k+" : "+writekey(v2, indent+"  ")+",\n";
            }
            s+=indent+"}";
            return s;
          }
      }
      else {
        return ""+v;
      }
      return "error";
    }
    for (let k of sortkeys(theme1)) {
        let k2=k;
        if (k.search("-")>=0||k.search(" ")>=0) {
            k2 = "'"+k+"'";
        }
        s+="  "+k2+": ";
        let v=theme1[k];
        if (typeof v!=="object"||__instance_of(v, CSSFont)) {
            s+=writekey(v, "  ")+",\n";
        }
        else {
          s+=" {\n";
          let s2="";
          let maxwid=0;
          for (let k2 of sortkeys(v)) {
              if (k2.search("-")>=0||k2.search(" ")>=0) {
                  k2 = "'"+k2+"'";
              }
              maxwid = Math.max(maxwid, k2.length);
          }
          for (let k2 of sortkeys(v)) {
              let v2=v[k2];
              if (k2.search("-")>=0||k2.search(" ")>=0) {
                  k2 = "'"+k2+"'";
              }
              let pad="";
              for (let i=0; i<maxwid-k2.length; i++) {
                  pad+=" ";
              }
              s2+="    "+k2+pad+": "+writekey(v2, "    ")+",\n";
          }
          s+=s2;
          s+="  },\n\n";
        }
    }
    s+="};\n";
    return s;
  }
  exportTheme = _es6_module.add_export('exportTheme', exportTheme);
  window._exportTheme = exportTheme;
}, '/dev/fairmotion/src/path.ux/scripts/core/ui_theme.js');
es6_module_define('units', ["../util/vectormath.js", "../util/util.js"], function _units_module(_es6_module) {
  var util=es6_import(_es6_module, '../util/util.js');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../util/vectormath.js', 'Quat');
  var Matrix4=es6_import_item(_es6_module, '../util/vectormath.js', 'Matrix4');
  function normString(s) {
    s = s.replace(/ /g, "").replace(/\t/g, "");
    return s.toLowerCase();
  }
  function myToFixed(f, decimals) {
    f = f.toFixed(decimals);
    while (f.endsWith("0")&&f.search(/\./)>=0) {
      f = f.slice(0, f.length-1);
    }
    if (f.endsWith(".")) {
        f = f.slice(0, f.length-1);
    }
    if (f.length===0)
      f = "0";
    return f.trim();
  }
  const Units=[];
  _es6_module.add_export('Units', Units);
  class Unit  {
    static  getUnit(name) {
      for (let cls of Units) {
          if (cls.unitDefine().name===name) {
              return cls;
          }
      }
      throw new Error("Unknown unit "+name);
    }
    static  register(cls) {
      Units.push(cls);
    }
    static  unitDefine() {
      return {name: "", 
     uiname: "", 
     type: "", 
     icon: -1, 
     pattern: undefined}
    }
    static  parse(string) {

    }
    static  validate(string) {
      string = normString(string);
      let def=this.unitDefine();
      let m=string.match(def.pattern);
      if (!m)
        return false;
      return m[0]===string;
    }
    static  toInternal(value) {

    }
    static  fromInternal(value) {

    }
    static  buildString(value, decimals=2) {

    }
  }
  _ESClass.register(Unit);
  _es6_module.add_class(Unit);
  Unit = _es6_module.add_export('Unit', Unit);
  class MeterUnit extends Unit {
    static  unitDefine() {
      return {name: "meter", 
     uiname: "Meter", 
     type: "distance", 
     icon: -1, 
     pattern: /-?\d+(\.\d*)?m$/}
    }
    static  parse(string) {
      string = normString(string);
      if (string.endsWith("m")) {
          string = string.slice(0, string.length-1);
      }
      return parseFloat(string);
    }
    static  toInternal(value) {
      return value;
    }
    static  fromInternal(value) {
      return value;
    }
    static  buildString(value, decimals=2) {
      return ""+myToFixed(value, decimals)+" m";
    }
  }
  _ESClass.register(MeterUnit);
  _es6_module.add_class(MeterUnit);
  MeterUnit = _es6_module.add_export('MeterUnit', MeterUnit);
  Unit.register(MeterUnit);
  class InchUnit extends Unit {
    static  unitDefine() {
      return {name: "inch", 
     uiname: "Inch", 
     type: "distance", 
     icon: -1, 
     pattern: /-?\d+(\.\d*)?(in|inch)$/}
    }
    static  parse(string) {
      string = string.toLowerCase();
      let i=string.indexOf("i");
      if (i>=0) {
          string = string.slice(0, i);
      }
      return parseInt(string);
    }
    static  toInternal(value) {
      return value*0.0254;
    }
    static  fromInternal(value) {
      return value/0.0254;
    }
    static  buildString(value, decimals=2) {
      return ""+myToFixed(value, decimals)+"in";
    }
  }
  _ESClass.register(InchUnit);
  _es6_module.add_class(InchUnit);
  InchUnit = _es6_module.add_export('InchUnit', InchUnit);
  Unit.register(InchUnit);
  let foot_re=/((-?\d+(\.\d*)?ft)(-?\d+(\.\d*)?(in|inch))?)|(-?\d+(\.\d*)?(in|inch))$/;
  class FootUnit extends Unit {
    static  unitDefine() {
      return {name: "foot", 
     uiname: "Foot", 
     type: "distance", 
     icon: -1, 
     pattern: foot_re}
    }
    static  parse(string) {
      string = normString(string);
      let i=string.search("ft");
      let parts=[];
      let vft=0.0, vin=0.0;
      if (i>=0) {
          parts = string.split("ft");
          let j=parts[1].search("in");
          if (j>=0) {
              parts = [parts[0]].concat(parts[1].split("in"));
              vin = parseFloat(parts[1]);
          }
          vft = parseFloat(parts[0]);
      }
      else {
        string = string.replace(/in/g, "");
        vin = parseFloat(string);
      }
      return vin/12.0+vft;
    }
    static  toInternal(value) {
      return value*0.3048;
    }
    static  fromInternal(value) {
      return value/0.3048;
    }
    static  buildString(value, decimals=2) {
      let vft=~~(value/12);
      let vin=value%12;
      if (vft===0.0) {
          return myToFixed(value, decimals)+" in";
      }
      let s=""+vft+" ft";
      if (vin!==0.0) {
          s+=" "+myToFixed(value, decimals)+" in";
      }
      return s;
    }
  }
  _ESClass.register(FootUnit);
  _es6_module.add_class(FootUnit);
  FootUnit = _es6_module.add_export('FootUnit', FootUnit);
  Unit.register(FootUnit);
  class MileUnit extends Unit {
    static  unitDefine() {
      return {name: "mile", 
     uiname: "Mile", 
     type: "distance", 
     icon: -1, 
     pattern: /-?\d+(\.\d+)?miles$/}
    }
    static  parse(string) {
      string = normString(string);
      string = string.replace(/miles/, "");
      return parseFloat(string);
    }
    static  toInternal(value) {
      return value*1609.34;
    }
    static  fromInternal(value) {
      return value/1609.34;
    }
    static  buildString(value, decimals=3) {
      return ""+myToFixed(value, decimals)+" miles";
    }
  }
  _ESClass.register(MileUnit);
  _es6_module.add_class(MileUnit);
  MileUnit = _es6_module.add_export('MileUnit', MileUnit);
  Unit.register(MileUnit);
  class DegreeUnit extends Unit {
    static  unitDefine() {
      return {name: "degree", 
     uiname: "Degrees", 
     type: "angle", 
     icon: -1, 
     pattern: /-?\d+(\.\d+)?(\u00B0|degree|deg|d|degree|degrees)?$/}
    }
    static  parse(string) {
      string = normString(string);
      if (string.search("d")>=0) {
          string = string.slice(0, string.search("d")).trim();
      }
      else 
        if (string.search("\u00B0")>=0) {
          string = string.slice(0, string.search("\u00B0")).trim();
      }
      return parseFloat(string);
    }
    static  toInternal(value) {
      return value/180.0*Math.PI;
    }
    static  fromInternal(value) {
      return value*180.0/Math.PI;
    }
    static  buildString(value, decimals=3) {
      return ""+myToFixed(value, decimals)+" \u00B0";
    }
  }
  _ESClass.register(DegreeUnit);
  _es6_module.add_class(DegreeUnit);
  DegreeUnit = _es6_module.add_export('DegreeUnit', DegreeUnit);
  
  Unit.register(DegreeUnit);
  class RadianUnit extends Unit {
    static  unitDefine() {
      return {name: "radian", 
     uiname: "Radians", 
     type: "angle", 
     icon: -1, 
     pattern: /-?\d+(\.\d+)?(r|rad|radian|radians)$/}
    }
    static  parse(string) {
      string = normString(string);
      if (string.search("r")>=0) {
          string = string.slice(0, string.search("r")).trim();
      }
      return parseFloat(string);
    }
    static  toInternal(value) {
      return value;
    }
    static  fromInternal(value) {
      return value;
    }
    static  buildString(value, decimals=3) {
      return ""+myToFixed(value, decimals)+" r";
    }
  }
  _ESClass.register(RadianUnit);
  _es6_module.add_class(RadianUnit);
  RadianUnit = _es6_module.add_export('RadianUnit', RadianUnit);
  
  Unit.register(RadianUnit);
  function setBaseUnit(unit) {
    Unit.baseUnit = unit;
  }
  setBaseUnit = _es6_module.add_export('setBaseUnit', setBaseUnit);
  function setMetric(val) {
    Unit.isMetric = val;
  }
  setMetric = _es6_module.add_export('setMetric', setMetric);
  Unit.isMetric = true;
  Unit.baseUnit = "meter";
  let numre=/[+\-]?[0-9]+(\.[0-9]*)?$/;
  let hexre1=/[+\-]?[0-9a-fA-F]+h$/;
  let hexre2=/[+\-]?0x[0-9a-fA-F]+$/;
  let binre=/[+\-]?0b[01]+$/;
  let expre=/[+\-]?[0-9]+(\.[0-9]*)?[eE]\-?[0-9]+$/;
  function isNumber(s) {
    s = (""+s).trim();
    function test(re) {
      return s.search(re)==0;
    }
    return test(numre)||test(hexre1)||test(hexre2)||test(binre)||test(expre);
  }
  function parseValue(string, baseUnit) {
    if (baseUnit===undefined) {
        baseUnit = undefined;
    }
    let base;
    if (isNumber(string)) {
        let f=parseFloat(string);
        return f;
    }
    if (baseUnit&&baseUnit!=="none") {
        base = Unit.getUnit(baseUnit);
        if (base===undefined) {
            console.warn("Unknown unit "+baseUnit);
            return NaN;
        }
    }
    else {
      base = Unit.getUnit(Unit.baseUnit);
    }
    for (let unit of Units) {
        let def=unit.unitDefine();
        if (unit.validate(string)) {
            console.log(unit);
            let value=unit.parse(string);
            value = unit.toInternal(value);
            return base.fromInternal(value);
        }
    }
    return NaN;
  }
  parseValue = _es6_module.add_export('parseValue', parseValue);
  function convert(value, unita, unitb) {
    if (typeof unita==="string")
      unita = Unit.getUnit(unita);
    if (typeof unitb==="string")
      unitb = Unit.getUnit(unitb);
    return unitb.fromInternal(unita.toInternal(value));
  }
  convert = _es6_module.add_export('convert', convert);
  function buildString(value, baseUnit, decimalPlaces, displayUnit) {
    if (baseUnit===undefined) {
        baseUnit = Unit.baseUnit;
    }
    if (decimalPlaces===undefined) {
        decimalPlaces = 3;
    }
    if (displayUnit===undefined) {
        displayUnit = Unit.baseUnit;
    }
    if (typeof baseUnit==="string"&&baseUnit!=="none") {
        baseUnit = Unit.getUnit(baseUnit);
    }
    if (typeof displayUnit==="string"&&displayUnit!=="none") {
        displayUnit = Unit.getUnit(displayUnit);
    }
    if (baseUnit!=="none"&&displayUnit!==baseUnit&&displayUnit!=="none") {
        value = convert(value, baseUnit, displayUnit);
    }
    if (displayUnit!=="none") {
        return displayUnit.buildString(value, decimalPlaces);
    }
    else {
      return myToFixed(value, decimalPlaces);
    }
  }
  buildString = _es6_module.add_export('buildString', buildString);
  window._parseValueTest = parseValue;
  window._buildStringTest = buildString;
}, '/dev/fairmotion/src/path.ux/scripts/core/units.js');
es6_module_define('curve1d', ["./curve1d_bspline.js", "../util/vectormath.js", "../util/struct.js", "./curve1d_base.js", "../util/events.js", "./curve1d_anim.js", "../icon_enum.js", "./curve1d_basic.js", "../util/util.js"], function _curve1d_module(_es6_module) {
  "use strict";
  var nstructjs=es6_import_item(_es6_module, '../util/struct.js', 'nstructjs');
  var Icons=es6_import_item(_es6_module, '../icon_enum.js', 'Icons');
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var EventDispatcher=es6_import_item(_es6_module, '../util/events.js', 'EventDispatcher');
  let _ex_getCurve=es6_import_item(_es6_module, './curve1d_base.js', 'getCurve');
  _es6_module.add_export('getCurve', _ex_getCurve, true);
  var Vector2=vectormath.Vector2;
  es6_import(_es6_module, './curve1d_basic.js');
  es6_import(_es6_module, './curve1d_bspline.js');
  es6_import(_es6_module, './curve1d_anim.js');
  function mySafeJSONStringify(obj) {
    return JSON.stringify(obj.toJSON(), function (key) {
      let v=this[key];
      if (typeof v==="number") {
          if (v!==Math.floor(v)) {
              v = parseFloat(v.toFixed(5));
          }
          else {
            v = v;
          }
      }
      return v;
    });
  }
  mySafeJSONStringify = _es6_module.add_export('mySafeJSONStringify', mySafeJSONStringify);
  function mySafeJSONParse(buf) {
    return JSON.parse(buf, (key, val) =>      {    });
  }
  mySafeJSONParse = _es6_module.add_export('mySafeJSONParse', mySafeJSONParse);
  
  window.mySafeJSONStringify = mySafeJSONStringify;
  let _ex_CurveConstructors=es6_import_item(_es6_module, './curve1d_base.js', 'CurveConstructors');
  _es6_module.add_export('CurveConstructors', _ex_CurveConstructors, true);
  let _ex_CURVE_VERSION=es6_import_item(_es6_module, './curve1d_base.js', 'CURVE_VERSION');
  _es6_module.add_export('CURVE_VERSION', _ex_CURVE_VERSION, true);
  let _ex_CurveTypeData=es6_import_item(_es6_module, './curve1d_base.js', 'CurveTypeData');
  _es6_module.add_export('CurveTypeData', _ex_CurveTypeData, true);
  var CurveConstructors=es6_import_item(_es6_module, './curve1d_base.js', 'CurveConstructors');
  var CURVE_VERSION=es6_import_item(_es6_module, './curve1d_base.js', 'CURVE_VERSION');
  var CurveTypeData=es6_import_item(_es6_module, './curve1d_base.js', 'CurveTypeData');
  class Curve1D extends EventDispatcher {
     constructor() {
      super();
      this.uiZoom = 1.0;
      this.generators = [];
      this.VERSION = CURVE_VERSION;
      for (let gen of CurveConstructors) {
          gen = new gen();
          gen.parent = this;
          this.generators.push(gen);
      }
      this.generators.active = this.generators[0];
    }
    get  generatorType() {
      return this.generators.active ? this.generators.active.type : undefined;
    }
     load(b) {
      if (b===undefined) {
          return ;
      }
      let buf1=mySafeJSONStringify(b);
      let buf2=mySafeJSONStringify(this);
      if (buf1===buf2) {
          return ;
      }
      this.loadJSON(JSON.parse(buf1));
      this._on_change();
      this.redraw();
      return this;
    }
     copy() {
      let ret=new Curve1D();
      ret.loadJSON(JSON.parse(mySafeJSONStringify(this)));
      return ret;
    }
     _on_change() {

    }
     redraw() {
      this._fireEvent("draw", this);
    }
     setGenerator(type) {
      for (let gen of this.generators) {
          if (gen.type===type||gen.constructor.name===type||gen.constructor===type) {
              if (this.generators.active) {
                  this.generators.active.onInactive();
              }
              this.generators.active = gen;
              gen.onActive();
              return ;
          }
      }
      throw new Error("unknown curve type"+type);
    }
    get  fastmode() {
      return this._fastmode;
    }
    set  fastmode(val) {
      this._fastmode = val;
      for (let gen of this.generators) {
          gen.fastmode = val;
      }
    }
     toJSON() {
      let ret={generators: [], 
     uiZoom: this.uiZoom, 
     VERSION: this.VERSION, 
     active_generator: this.generatorType};
      for (let gen of this.generators) {
          ret.generators.push(gen.toJSON());
      }
      return ret;
    }
     getGenerator(type, throw_on_error=true) {
      for (let gen of this.generators) {
          if (gen.type===type) {
              return gen;
          }
      }
      for (let cls of CurveConstructors) {
          if (cls.name===type) {
              let gen=new cls();
              this.generators.push(gen);
              return gen;
          }
      }
      if (throw_on_error) {
          throw new Error("Unknown generator "+type+".");
      }
      else {
        return undefined;
      }
    }
     switchGenerator(type) {
      let gen=this.getGenerator(type);
      if (gen!==this.generators.active) {
          let old=this.generators.active;
          this.generators.active = gen;
          old.onInactive(this);
          gen.onActive(this);
      }
      return gen;
    }
     equals(b) {
      let a=mySafeJSONStringify(this).trim();
      let b2=mySafeJSONStringify(b).trim();
      if (a!==b2) {
          console.log(a);
          console.log(b2);
      }
      return a===b2;
    }
     destroy() {
      return this;
    }
     loadJSON(obj) {
      this.VERSION = obj.VERSION;
      this.uiZoom = parseFloat(obj.uiZoom)||this.uiZoom;
      for (let gen of obj.generators) {
          let gen2=this.getGenerator(gen.type, false);
          if (!gen2||!(__instance_of(gen2, CurveTypeData))) {
              console.warn("Bad curve generator class:", gen2);
              if (gen2) {
                  this.generators.remove(gen2);
              }
              continue;
          }
          gen2.parent = undefined;
          gen2.reset();
          gen2.loadJSON(gen);
          gen2.parent = this;
          if (gen.type===obj.active_generator) {
              this.generators.active = gen2;
          }
      }
      return this;
    }
     evaluate(s) {
      return this.generators.active.evaluate(s);
    }
     derivative(s) {
      return this.generators.active.derivative(s);
    }
     derivative2(s) {
      return this.generators.active.derivative2(s);
    }
     inverse(s) {
      return this.generators.active.inverse(s);
    }
     reset() {
      this.generators.active.reset();
    }
     update() {
      return this.generators.active.update();
    }
     draw(canvas, g, draw_transform) {
      var w=canvas.width, h=canvas.height;
      g.save();
      let sz=draw_transform[0], pan=draw_transform[1];
      g.beginPath();
      g.moveTo(-1, 0);
      g.lineTo(1, 0);
      g.strokeStyle = "red";
      g.stroke();
      g.beginPath();
      g.moveTo(0, -1);
      g.lineTo(0, 1);
      g.strokeStyle = "green";
      g.stroke();
      var f=0, steps=64;
      var df=1/(steps-1);
      var w=6.0/sz;
      let curve=this.generators.active;
      g.beginPath();
      for (var i=0; i<steps; i++, f+=df) {
          var val=curve.evaluate(f);
          (i==0 ? g.moveTo : g.lineTo).call(g, f, val, w, w);
      }
      g.strokeStyle = "grey";
      g.stroke();
      if (this.overlay_curvefunc!==undefined) {
          g.beginPath();
          f = 0.0;
          for (var i=0; i<steps; i++, f+=df) {
              var val=this.overlay_curvefunc(f);
              (i==0 ? g.moveTo : g.lineTo).call(g, f, val, w, w);
          }
          g.strokeStyle = "green";
          g.stroke();
      }
      this.generators.active.draw(canvas, g, draw_transform);
      g.restore();
      return this;
    }
     loadSTRUCT(reader) {
      this.generators = [];
      reader(this);
      console.log("VERSION", this.VERSION);
      if (this.VERSION<=0.75) {
          this.generators = [];
          for (let cls of CurveConstructors) {
              this.generators.push(new cls());
          }
          this.generators.active = this.getGenerator("BSplineCurve");
      }
      console.log("ACTIVE", this._active);
      for (let gen of this.generators.concat([])) {
          if (!(__instance_of(gen, CurveTypeData))) {
              console.warn("Bad generator data found:", gen);
              this.generators.remove(gen);
              continue;
          }
          if (gen.type===this._active) {
              console.log("found active", this._active);
              this.generators.active = gen;
          }
      }
      delete this._active;
    }
  }
  _ESClass.register(Curve1D);
  _es6_module.add_class(Curve1D);
  Curve1D = _es6_module.add_export('Curve1D', Curve1D);
  Curve1D.STRUCT = `
Curve1D {
  generators  : array(abstract(CurveTypeData));
  _active     : string | obj.generators.active.type;
  VERSION     : float;
  uiZoom      : float;
}
`;
  nstructjs.register(Curve1D);
}, '/dev/fairmotion/src/path.ux/scripts/curve/curve1d.js');
es6_module_define('curve1d_anim', ["./curve1d_base.js", "../util/struct.js", "./ease.js", "../util/util.js"], function _curve1d_anim_module(_es6_module) {
  var nstructjs=es6_import_item(_es6_module, '../util/struct.js', 'nstructjs');
  var CurveConstructors=es6_import_item(_es6_module, './curve1d_base.js', 'CurveConstructors');
  var CurveTypeData=es6_import_item(_es6_module, './curve1d_base.js', 'CurveTypeData');
  var Ease=es6_import_item(_es6_module, './ease.js', 'default');
  var util=es6_import(_es6_module, '../util/util.js');
  function bez3(a, b, c, t) {
    var r1=a+(b-a)*t;
    var r2=b+(c-b)*t;
    return r1+(r2-r1)*t;
  }
  function bez4(a, b, c, d, t) {
    var r1=bez3(a, b, c, t);
    var r2=bez3(b, c, d, t);
    return r1+(r2-r1)*t;
  }
  class ParamKey  {
     constructor(key, val) {
      this.key = key;
      this.val = val;
    }
  }
  _ESClass.register(ParamKey);
  _es6_module.add_class(ParamKey);
  ParamKey = _es6_module.add_export('ParamKey', ParamKey);
  ParamKey.STRUCT = `
ParamKey {
  key : string;
  val : float;
}
`;
  nstructjs.register(ParamKey);
  let BOOL_FLAG=1e+17;
  class SimpleCurveBase extends CurveTypeData {
     constructor() {
      super();
      this.type = this.constructor.name;
      let def=this.constructor.define();
      let params=def.params;
      this.params = {};
      for (let k in params) {
          this.params[k] = params[k][1];
      }
    }
     redraw() {
      if (this.parent)
        this.parent.redraw();
    }
    get  hasGUI() {
      return true;
    }
     makeGUI(container) {
      let def=this.constructor.define();
      let params=def.params;
      for (let k in params) {
          let p=params[k];
          if (p[2]===BOOL_FLAG) {
              let check=container.check(undefined, p[0]);
              check.checked = !!this.params[k];
              check.key = k;
              let this2=this;
              check.onchange = function () {
                this2.params[this.key] = this.checked ? 1 : 0;
                this2.update();
                this2.redraw();
              };
          }
          else {
            let slider=container.slider(undefined, {name: p[0], 
        defaultval: this.params[k], 
        min: p[2], 
        max: p[3]});
            slider.baseUnit = slider.displayUnit = "none";
            slider.key = k;
            let this2=this;
            slider.onchange = function () {
              this2.params[this.key] = this.value;
              this2.update();
              this2.redraw();
            };
          }
      }
    }
     killGUI(container) {
      container.clear();
    }
     evaluate(s) {
      throw new Error("implement me!");
    }
     reset() {

    }
     update() {
      super.update();
    }
     draw(canvas, g, draw_transform) {
      let steps=128;
      let s=0, ds=1.0/(steps-1);
      g.beginPath();
      for (let i=0; i<steps; i++, s+=ds) {
          let co=this.evaluate(s);
          if (i) {
              g.lineTo(co[0], co[1]);
          }
          else {
            g.moveTo(co[0], co[1]);
          }
      }
      g.stroke();
    }
     _saveParams() {
      let ret=[];
      for (let k in this.params) {
          ret.push(new ParamKey(k, this.params[k]));
      }
      return ret;
    }
     toJSON() {
      return Object.assign(super.toJSON(), {params: this.params});
    }
     loadJSON(obj) {
      for (let k in obj.params) {
          this.params[k] = obj.params[k];
      }
      return this;
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      let ps=this.params;
      this.params = {};
      let pdef=this.constructor.define().params;
      if (!pdef) {
          console.warn("Missing define function for curve", this.constructor.name);
          return ;
      }
      console.log(this.constructor.define(), this, "<-----");
      for (let pair of ps) {
          if (pair.key in pdef) {
              this.params[pair.key] = pair.val;
          }
      }
      for (let k in pdef) {
          if (!(k in this.params)) {
              this.params[k] = pdef[k][1];
          }
      }
    }
  }
  _ESClass.register(SimpleCurveBase);
  _es6_module.add_class(SimpleCurveBase);
  SimpleCurveBase = _es6_module.add_export('SimpleCurveBase', SimpleCurveBase);
  SimpleCurveBase.STRUCT = nstructjs.inherit(SimpleCurveBase, CurveTypeData)+`
  params : array(ParamKey) | obj._saveParams();
}
`;
  nstructjs.register(SimpleCurveBase);
  class BounceCurve extends SimpleCurveBase {
     _evaluate(t) {
      let params=this.params;
      let decay=params.decay+1.0;
      let scale=params.scale;
      let freq=params.freq;
      let phase=params.phase;
      let offset=params.offset;
      t*=freq;
      let t2=Math.abs(Math.cos(phase+t*Math.PI*2.0))*scale;
      
      t2*=Math.exp(decay*t)/Math.exp(decay);
      return t2;
    }
     evaluate(t) {
      let s=this._evaluate(0.0);
      let e=this._evaluate(1.0);
      return (this._evaluate(t)-s)/(e-s)+this.params.offset;
    }
    static  define() {
      return {params: {decay: ["Decay", 1.0, 0.1, 5.0], 
      scale: ["Scale", 1.0, 0.01, 10.0], 
      freq: ["Freq", 1.0, 0.01, 50.0], 
      phase: ["Phase", 0.0, -Math.PI*2.0, Math.PI*2.0], 
      offset: ["Offset", 0.0, -2.0, 2.0]}, 
     name: "bounce", 
     uiname: "Bounce"}
    }
  }
  _ESClass.register(BounceCurve);
  _es6_module.add_class(BounceCurve);
  BounceCurve = _es6_module.add_export('BounceCurve', BounceCurve);
  CurveTypeData.register(BounceCurve);
  BounceCurve.STRUCT = nstructjs.inherit(BounceCurve, SimpleCurveBase)+`
}`;
  nstructjs.register(BounceCurve);
  class ElasticCurve extends SimpleCurveBase {
     constructor() {
      super();
      this._func = undefined;
      this._last_hash = undefined;
    }
     evaluate(t) {
      let hash=~~(this.params.mode*127+this.params.amplitude*256+this.params.period*512);
      if (hash!==this._last_hash||!this._func) {
          this._last_hash = hash;
          if (this.params.mode) {
              this._func = Ease.getElasticOut(this.params.amplitude, this.params.period);
          }
          else {
            this._func = Ease.getElasticIn(this.params.amplitude, this.params.period);
          }
      }
      return this._func(t);
    }
    static  define() {
      return {params: {mode: ["Out Mode", false, BOOL_FLAG, BOOL_FLAG], 
      amplitude: ["Amplitude", 1.0, 0.01, 10.0], 
      period: ["Period", 1.0, 0.01, 5.0]}, 
     name: "elastic", 
     uiname: "Elastic"}
    }
  }
  _ESClass.register(ElasticCurve);
  _es6_module.add_class(ElasticCurve);
  ElasticCurve = _es6_module.add_export('ElasticCurve', ElasticCurve);
  CurveTypeData.register(ElasticCurve);
  ElasticCurve.STRUCT = nstructjs.inherit(ElasticCurve, SimpleCurveBase)+`
}`;
  nstructjs.register(ElasticCurve);
  class EaseCurve extends SimpleCurveBase {
     constructor() {
      super();
    }
     evaluate(t) {
      let amp=this.params.amplitude;
      let a1=this.params.mode_in ? 1.0-amp : 0.0;
      let a2=this.params.mode_out ? amp : 0.0;
      return bez4(0.0, a1, a2, 1.0, t);
    }
    static  define() {
      return {params: {mode_in: ["in", true, BOOL_FLAG, BOOL_FLAG], 
      mode_out: ["out", true, BOOL_FLAG, BOOL_FLAG], 
      amplitude: ["Amplitude", 1.0, 0.01, 4.0]}, 
     name: "ease", 
     uiname: "Ease"}
    }
  }
  _ESClass.register(EaseCurve);
  _es6_module.add_class(EaseCurve);
  EaseCurve = _es6_module.add_export('EaseCurve', EaseCurve);
  CurveTypeData.register(EaseCurve);
  EaseCurve.STRUCT = nstructjs.inherit(EaseCurve, SimpleCurveBase)+`
}`;
  nstructjs.register(EaseCurve);
  class RandCurve extends SimpleCurveBase {
     constructor() {
      super();
      this.random = new util.MersenneRandom();
      this.seed = 0;
    }
    set  seed(v) {
      this.random.seed(v);
      this._seed = v;
    }
    get  seed() {
      return this._seed;
    }
     evaluate(t) {
      let r=this.random.random();
      let decay=this.params.decay+1.0;
      let amp=this.params.amplitude;
      let in_mode=this.params.in_mode;
      if (in_mode) {
          t = 1.0-t;
      }
      let d;
      if (in_mode) {
          d = Math.exp(t*decay)/Math.exp(decay);
      }
      else {
        d = Math.exp(t*decay)/Math.exp(decay);
      }
      t = t+(r-t)*d;
      if (in_mode) {
          t = 1.0-t;
      }
      return t;
    }
    static  define() {
      return {params: {amplitude: ["Amplitude", 1.0, 0.01, 4.0], 
      decay: ["Decay", 1.0, 0.0, 5.0], 
      in_mode: ["In", true, BOOL_FLAG, BOOL_FLAG]}, 
     name: "random", 
     uiname: "Random"}
    }
  }
  _ESClass.register(RandCurve);
  _es6_module.add_class(RandCurve);
  RandCurve = _es6_module.add_export('RandCurve', RandCurve);
  CurveTypeData.register(RandCurve);
  EaseCurve.STRUCT = nstructjs.inherit(RandCurve, SimpleCurveBase)+`
}`;
  nstructjs.register(RandCurve);
}, '/dev/fairmotion/src/path.ux/scripts/curve/curve1d_anim.js');
es6_module_define('curve1d_base', ["../util/struct.js"], function _curve1d_base_module(_es6_module) {
  var nstructjs=es6_import_item(_es6_module, '../util/struct.js', 'nstructjs');
  const CurveConstructors=[];
  _es6_module.add_export('CurveConstructors', CurveConstructors);
  const CURVE_VERSION=1.0;
  _es6_module.add_export('CURVE_VERSION', CURVE_VERSION);
  const CurveFlags={SELECT: 1}
  _es6_module.add_export('CurveFlags', CurveFlags);
  const TangentModes={SMOOTH: 1, 
   BREAK: 2}
  _es6_module.add_export('TangentModes', TangentModes);
  function getCurve(type, throw_on_error) {
    if (throw_on_error===undefined) {
        throw_on_error = true;
    }
    for (let cls of CurveConstructors) {
        if (cls.name===type)
          return cls;
        if (cls.define().name===type)
          return cls;
    }
    if (throw_on_error) {
        throw new Error("Unknown curve type "+type);
    }
    else {
      console.warn("Unknown curve type", type);
      return getCurve("ease");
    }
  }
  getCurve = _es6_module.add_export('getCurve', getCurve);
  class CurveTypeData  {
     constructor() {
      this.type = this.constructor.name;
    }
    static  register(cls) {
      CurveConstructors.push(cls);
    }
     toJSON() {
      return {type: this.type}
    }
     loadJSON(obj) {
      this.type = obj.type;
      return this;
    }
     redraw() {
      if (this.parent)
        this.parent.redraw();
    }
    get  hasGUI() {
      throw new Error("get hasGUI(): implement me!");
    }
     makeGUI(container) {

    }
     killGUI(container) {
      container.clear();
    }
     evaluate(s) {
      throw new Error("implement me!");
    }
     derivative(s) {
      let df=0.0001;
      if (s>1.0-df*3) {
          return (this.evaluate(s)-this.evaluate(s-df))/df;
      }
      else 
        if (s<df*3) {
          return (this.evaluate(s+df)-this.evaluate(s))/df;
      }
      else {
        return (this.evaluate(s+df)-this.evaluate(s-df))/(2*df);
      }
    }
     derivative2(s) {
      let df=0.0001;
      if (s>1.0-df*3) {
          return (this.derivative(s)-this.derivative(s-df))/df;
      }
      else 
        if (s<df*3) {
          return (this.derivative(s+df)-this.derivative(s))/df;
      }
      else {
        return (this.derivative(s+df)-this.derivative(s-df))/(2*df);
      }
    }
     inverse(y) {
      let steps=9;
      let ds=1.0/steps, s=0.0;
      let best=undefined;
      let ret=undefined;
      for (let i=0; i<steps; i++, s+=ds) {
          let s1=s, s2=s+ds;
          let mid;
          for (let j=0; j<11; j++) {
              let y1=this.evaluate(s1);
              let y2=this.evaluate(s2);
              mid = (s1+s2)*0.5;
              if (Math.abs(y1-y)<Math.abs(y2-y)) {
                  s2 = mid;
              }
              else {
                s1 = mid;
              }
          }
          let ymid=this.evaluate(mid);
          if (best===undefined||Math.abs(y-ymid)<best) {
              best = Math.abs(y-ymid);
              ret = mid;
          }
      }
      return ret===undefined ? 0.0 : ret;
    }
    static  define() {
      return {uiname: "Some Curve", 
     name: "somecurve"}
    }
     onActive(parent, draw_transform) {

    }
     onInactive(parent, draw_transform) {

    }
     reset() {

    }
     destroy() {

    }
     update() {
      if (this.parent)
        this.parent._on_change();
    }
     draw(canvas, g, draw_transform) {

    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(CurveTypeData);
  _es6_module.add_class(CurveTypeData);
  CurveTypeData = _es6_module.add_export('CurveTypeData', CurveTypeData);
  CurveTypeData.STRUCT = `
CurveTypeData {
  type : string;
}
`;
  nstructjs.register(CurveTypeData);
}, '/dev/fairmotion/src/path.ux/scripts/curve/curve1d_base.js');
es6_module_define('curve1d_basic', ["./curve1d_base.js", "../util/vectormath.js", "../util/struct.js"], function _curve1d_basic_module(_es6_module) {
  var nstructjs=es6_import_item(_es6_module, '../util/struct.js', 'nstructjs');
  var CurveFlags=es6_import_item(_es6_module, './curve1d_base.js', 'CurveFlags');
  var TangentModes=es6_import_item(_es6_module, './curve1d_base.js', 'TangentModes');
  var CurveTypeData=es6_import_item(_es6_module, './curve1d_base.js', 'CurveTypeData');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../util/vectormath.js', 'Quat');
  var Matrix4=es6_import_item(_es6_module, '../util/vectormath.js', 'Matrix4');
  class EquationCurve extends CurveTypeData {
     constructor(type) {
      super();
      this.equation = "x";
    }
    static  define() {
      return {uiname: "Equation", 
     name: "equation"}
    }
     toJSON() {
      let ret=super.toJSON();
      return Object.assign(ret, {equation: this.equation});
    }
     loadJSON(obj) {
      super.loadJSON(obj);
      if (obj.equation!==undefined) {
          this.equation = obj.equation;
      }
      return this;
    }
    get  hasGUI() {
      return this.uidata!==undefined;
    }
     makeGUI(container, canvas, drawTransform) {
      this.uidata = {canvas: canvas, 
     g: canvas.g, 
     draw_trans: drawTransform};
      let text=this.uidata.textbox = container.textbox(undefined, this.equation);
      text.onchange = (val) =>        {
        console.log(val);
        this.equation = val;
        this.update();
        this.redraw();
      };
    }
     killGUI(dom, gui, canvas, g, draw_transform) {
      if (this.uidata!==undefined) {
          this.uidata.textbox.remove();
      }
      this.uidata = undefined;
    }
     evaluate(s) {
      let sin=Math.sin, cos=Math.cos, pi=Math.PI, PI=Math.PI, e=Math.E, E=Math.E, tan=Math.tan, abs=Math.abs, floor=Math.floor, ceil=Math.ceil, acos=Math.acos, asin=Math.asin, atan=Math.atan, cosh=Math.cos, sinh=Math.sinh, log=Math.log, pow=Math.pow, exp=Math.exp, sqrt=Math.sqrt, cbrt=Math.cbrt, min=Math.min, max=Math.max;
      try {
        let x=s;
        let ret=eval(this.equation);
        this._haserror = false;
        return ret;
      }
      catch (error) {
          this._haserror = true;
          console.log("ERROR!");
          return 0.0;
      }
    }
     derivative(s) {
      let df=0.0001;
      if (s>1.0-df*3) {
          return (this.evaluate(s)-this.evaluate(s-df))/df;
      }
      else 
        if (s<df*3) {
          return (this.evaluate(s+df)-this.evaluate(s))/df;
      }
      else {
        return (this.evaluate(s+df)-this.evaluate(s-df))/(2*df);
      }
    }
     derivative2(s) {
      let df=0.0001;
      if (s>1.0-df*3) {
          return (this.derivative(s)-this.derivative(s-df))/df;
      }
      else 
        if (s<df*3) {
          return (this.derivative(s+df)-this.derivative(s))/df;
      }
      else {
        return (this.derivative(s+df)-this.derivative(s-df))/(2*df);
      }
    }
     inverse(y) {
      let steps=9;
      let ds=1.0/steps, s=0.0;
      let best=undefined;
      let ret=undefined;
      for (let i=0; i<steps; i++, s+=ds) {
          let s1=s, s2=s+ds;
          let mid;
          for (let j=0; j<11; j++) {
              let y1=this.evaluate(s1);
              let y2=this.evaluate(s2);
              mid = (s1+s2)*0.5;
              if (Math.abs(y1-y)<Math.abs(y2-y)) {
                  s2 = mid;
              }
              else {
                s1 = mid;
              }
          }
          let ymid=this.evaluate(mid);
          if (best===undefined||Math.abs(y-ymid)<best) {
              best = Math.abs(y-ymid);
              ret = mid;
          }
      }
      return ret===undefined ? 0.0 : ret;
    }
     onActive(parent, draw_transform) {

    }
     onInactive(parent, draw_transform) {

    }
     reset() {
      this.equation = "x";
    }
     destroy() {

    }
     draw(canvas, g, draw_transform) {
      g.save();
      if (this._haserror) {
          g.fillStyle = g.strokeStyle = "rgba(255, 50, 0, 0.25)";
          g.beginPath();
          g.rect(0, 0, 1, 1);
          g.fill();
          g.beginPath();
          g.moveTo(0, 0);
          g.lineTo(1, 1);
          g.moveTo(0, 1);
          g.lineTo(1, 0);
          g.lineWidth*=3;
          g.stroke();
          g.restore();
          return ;
      }
      g.restore();
    }
  }
  _ESClass.register(EquationCurve);
  _es6_module.add_class(EquationCurve);
  EquationCurve.STRUCT = nstructjs.inherit(EquationCurve, CurveTypeData)+`
  equation : string;
}
`;
  nstructjs.register(EquationCurve);
  CurveTypeData.register(EquationCurve);
  class GuassianCurve extends CurveTypeData {
     constructor(type) {
      super();
      this.height = 1.0;
      this.offset = 1.0;
      this.deviation = 0.3;
    }
    static  define() {
      return {uiname: "Guassian", 
     name: "guassian"}
    }
     toJSON() {
      let ret=super.toJSON();
      return Object.assign(ret, {height: this.height, 
     offset: this.offset, 
     deviation: this.deviation});
    }
     loadJSON(obj) {
      super.loadJSON(obj);
      this.height = obj.height!==undefined ? obj.height : 1.0;
      this.offset = obj.offset;
      this.deviation = obj.deviation;
      return this;
    }
    get  hasGUI() {
      return this.uidata!==undefined;
    }
     makeGUI(container, canvas, drawTransform) {
      this.uidata = {canvas: canvas, 
     g: canvas.g, 
     draw_trans: drawTransform};
      this.uidata.hslider = container.slider(undefined, "Height", this.height, -10, 10, 0.0001);
      this.uidata.hslider.onchange = () =>        {
        this.height = this.uidata.hslider.value;
        this.redraw();
        this.update();
      };
      this.uidata.oslider = container.slider(undefined, "Offset", this.offset, -10, 10, 0.0001);
      this.uidata.oslider.onchange = () =>        {
        this.offset = this.uidata.oslider.value;
        this.redraw();
        this.update();
      };
      this.uidata.dslider = container.slider(undefined, "STD Deviation", this.deviation, -10, 10, 0.0001);
      this.uidata.dslider.onchange = () =>        {
        this.deviation = this.uidata.dslider.value;
        this.redraw();
        this.update();
      };
    }
     killGUI(dom, gui, canvas, g, draw_transform) {
      if (this.uidata!==undefined) {
          this.uidata.hslider.remove();
          this.uidata.oslider.remove();
          this.uidata.dslider.remove();
      }
      this.uidata = undefined;
    }
     evaluate(s) {
      let r=this.height*Math.exp(-((s-this.offset)*(s-this.offset))/(2*this.deviation*this.deviation));
      return r;
    }
     derivative(s) {
      let df=0.0001;
      if (s>1.0-df*3) {
          return (this.evaluate(s)-this.evaluate(s-df))/df;
      }
      else 
        if (s<df*3) {
          return (this.evaluate(s+df)-this.evaluate(s))/df;
      }
      else {
        return (this.evaluate(s+df)-this.evaluate(s-df))/(2*df);
      }
    }
     derivative2(s) {
      let df=0.0001;
      if (s>1.0-df*3) {
          return (this.derivative(s)-this.derivative(s-df))/df;
      }
      else 
        if (s<df*3) {
          return (this.derivative(s+df)-this.derivative(s))/df;
      }
      else {
        return (this.derivative(s+df)-this.derivative(s-df))/(2*df);
      }
    }
     inverse(y) {
      let steps=9;
      let ds=1.0/steps, s=0.0;
      let best=undefined;
      let ret=undefined;
      for (let i=0; i<steps; i++, s+=ds) {
          let s1=s, s2=s+ds;
          let mid;
          for (let j=0; j<11; j++) {
              let y1=this.evaluate(s1);
              let y2=this.evaluate(s2);
              mid = (s1+s2)*0.5;
              if (Math.abs(y1-y)<Math.abs(y2-y)) {
                  s2 = mid;
              }
              else {
                s1 = mid;
              }
          }
          let ymid=this.evaluate(mid);
          if (best===undefined||Math.abs(y-ymid)<best) {
              best = Math.abs(y-ymid);
              ret = mid;
          }
      }
      return ret===undefined ? 0.0 : ret;
    }
  }
  _ESClass.register(GuassianCurve);
  _es6_module.add_class(GuassianCurve);
  GuassianCurve.STRUCT = nstructjs.inherit(GuassianCurve, CurveTypeData)+`
  height    : float;
  offset    : float;
  deviation : float;
}
`;
  nstructjs.register(GuassianCurve);
  CurveTypeData.register(GuassianCurve);
}, '/dev/fairmotion/src/path.ux/scripts/curve/curve1d_basic.js');
es6_module_define('curve1d_bspline', ["../util/util.js", "../util/struct.js", "../icon_enum.js", "../util/vectormath.js", "./curve1d_base.js"], function _curve1d_bspline_module(_es6_module) {
  "use strict";
  var nstructjs=es6_import_item(_es6_module, '../util/struct.js', 'nstructjs');
  var Icons=es6_import_item(_es6_module, '../icon_enum.js', 'Icons');
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var Vector2=vectormath.Vector2;
  let RecalcFlags={BASIS: 1, 
   FULL: 2, 
   ALL: 3, 
   FULL_BASIS: 4}
  function mySafeJSONStringify(obj) {
    return JSON.stringify(obj.toJSON(), function (key) {
      let v=this[key];
      if (typeof v==="number") {
          if (v!==Math.floor(v)) {
              v = parseFloat(v.toFixed(5));
          }
          else {
            v = v;
          }
      }
      return v;
    });
  }
  mySafeJSONStringify = _es6_module.add_export('mySafeJSONStringify', mySafeJSONStringify);
  function mySafeJSONParse(buf) {
    return JSON.parse(buf, (key, val) =>      {    });
  }
  mySafeJSONParse = _es6_module.add_export('mySafeJSONParse', mySafeJSONParse);
  
  window.mySafeJSONStringify = mySafeJSONStringify;
  var bin_cache={}
  window._bin_cache = bin_cache;
  var eval2_rets=util.cachering.fromConstructor(Vector2, 32);
  function bez3(a, b, c, t) {
    var r1=a+(b-a)*t;
    var r2=b+(c-b)*t;
    return r1+(r2-r1)*t;
  }
  function bez4(a, b, c, d, t) {
    var r1=bez3(a, b, c, t);
    var r2=bez3(b, c, d, t);
    return r1+(r2-r1)*t;
  }
  function binomial(n, i) {
    if (i>n) {
        throw new Error("Bad call to binomial(n, i), i was > than n");
    }
    if (i==0||i==n) {
        return 1;
    }
    var key=""+n+","+i;
    if (key in bin_cache)
      return bin_cache[key];
    var ret=binomial(n-1, i-1)+bin(n-1, i);
    bin_cache[key] = ret;
    return ret;
  }
  binomial = _es6_module.add_export('binomial', binomial);
  window.bin = binomial;
  var CurveFlags=es6_import_item(_es6_module, './curve1d_base.js', 'CurveFlags');
  var TangentModes=es6_import_item(_es6_module, './curve1d_base.js', 'TangentModes');
  var CurveTypeData=es6_import_item(_es6_module, './curve1d_base.js', 'CurveTypeData');
  class Curve1DPoint extends Vector2 {
     constructor(co) {
      super(co);
      this.rco = new Vector2(co);
      this.sco = new Vector2(co);
      this.startco = new Vector2();
      this.eid = -1;
      this.flag = 0;
      this.tangent = TangentModes.SMOOTH;
    }
     copy() {
      var ret=new Curve1DPoint(this);
      ret.tangent = this.tangent;
      ret.rco.load(ret);
      return ret;
    }
     toJSON() {
      return {0: this[0], 
     1: this[1], 
     eid: this.eid, 
     flag: this.flag, 
     tangent: this.tangent}
    }
    static  fromJSON(obj) {
      var ret=new Curve1DPoint(obj);
      ret.eid = obj.eid;
      ret.flag = obj.flag;
      ret.tangent = obj.tangent;
      return ret;
    }
     loadSTRUCT(reader) {
      reader(this);
      this.sco.load(this);
      this.rco.load(this);
      this.recalc = RecalcFlags.ALL;
    }
  }
  _ESClass.register(Curve1DPoint);
  _es6_module.add_class(Curve1DPoint);
  Curve1DPoint = _es6_module.add_export('Curve1DPoint', Curve1DPoint);
  
  Curve1DPoint.STRUCT = `
Curve1DPoint {
  0       : float;
  1       : float;
  eid     : int;
  flag    : int;
  deg     : int;
  tangent : int;
  rco     : vec2;
}
`;
  nstructjs.register(Curve1DPoint);
  class BSplineCurve extends CurveTypeData {
     constructor() {
      super();
      this.fastmode = false;
      this.points = [];
      this.length = 0;
      this.interpolating = false;
      this._ps = [];
      this.hermite = [];
      this.fastmode = false;
      this.deg = 6;
      this.recalc = RecalcFlags.ALL;
      this.basis_tables = [];
      this.eidgen = new util.IDGen();
      this.add(0, 0);
      this.add(1, 1);
      this.mpos = new Vector2();
      this.on_mousedown = this.on_mousedown.bind(this);
      this.on_mousemove = this.on_mousemove.bind(this);
      this.on_mouseup = this.on_mouseup.bind(this);
      this.on_keydown = this.on_keydown.bind(this);
      this.on_touchstart = this.on_touchstart.bind(this);
      this.on_touchmove = this.on_touchmove.bind(this);
      this.on_touchend = this.on_touchend.bind(this);
      this.on_touchcancel = this.on_touchcancel.bind(this);
    }
    static  define() {
      return {uiname: "B-Spline", 
     name: "bspline"}
    }
     remove(p) {
      let ret=this.points.remove(p);
      this.length = this.points.length;
      return ret;
    }
     add(x, y, no_update=false) {
      var p=new Curve1DPoint();
      this.recalc = RecalcFlags.ALL;
      p.eid = this.eidgen.next();
      p[0] = x;
      p[1] = y;
      p.sco.load(p);
      p.rco.load(p);
      this.points.push(p);
      if (!no_update) {
          this.update();
      }
      this.length = this.points.length;
      return p;
    }
     update() {
      super.update();
    }
     updateKnots(recalc=true) {
      if (recalc) {
          this.recalc = RecalcFlags.ALL;
      }
      if (!this.interpolating) {
          for (var i=0; i<this.points.length; i++) {
              this.points[i].rco.load(this.points[i]);
          }
      }
      this.points.sort(function (a, b) {
        return a[0]-b[0];
      });
      this._ps = [];
      if (this.points.length<2) {
          return ;
      }
      var a=this.points[0][0], b=this.points[this.points.length-1][0];
      for (var i=0; i<this.points.length-1; i++) {
          this._ps.push(this.points[i]);
      }
      if (this.points.length<3) {
          return ;
      }
      var l1=this.points[this.points.length-1];
      var l2=this.points[this.points.length-2];
      var p=l1.copy();
      p.rco[0] = l1.rco[0]-4e-05;
      p.rco[1] = l2.rco[1]+(l1.rco[1]-l2.rco[1])*1.0/3.0;
      var p=l1.copy();
      p.rco[0] = l1.rco[0]-3e-05;
      p.rco[1] = l2.rco[1]+(l1.rco[1]-l2.rco[1])*1.0/3.0;
      var p=l1.copy();
      p.rco[0] = l1.rco[0]-1e-05;
      p.rco[1] = l2.rco[1]+(l1.rco[1]-l2.rco[1])*1.0/3.0;
      this._ps.push(p);
      var p=l1.copy();
      p.rco[0] = l1.rco[0]-1e-05;
      p.rco[1] = l2.rco[1]+(l1.rco[1]-l2.rco[1])*2.0/3.0;
      this._ps.push(p);
      this._ps.push(l1);
      if (!this.interpolating) {
          for (var i=0; i<this._ps.length; i++) {
              this._ps[i].rco.load(this._ps[i]);
          }
      }
      for (var i=0; i<this.points.length; i++) {
          var p=this.points[i];
          var x=p[0], y=p[1];
          p.sco[0] = x;
          p.sco[1] = y;
      }
    }
     toJSON() {
      let ret=super.toJSON();
      ret.interpolating = this.interpolating;
      var ps=[];
      for (var i=0; i<this.points.length; i++) {
          ps.push(this.points[i].toJSON());
      }
      ret = Object.assign(ret, {points: ps, 
     deg: this.deg, 
     eidgen: this.eidgen.toJSON()});
      return ret;
    }
     loadJSON(obj) {
      super.loadJSON(obj);
      this.interpolating = obj.interpolating;
      this.length = 0;
      this.points = [];
      this._ps = [];
      this.hightlight = undefined;
      this.eidgen = util.IDGen.fromJSON(obj.eidgen);
      this.recalc = RecalcFlags.ALL;
      this.mpos = [0, 0];
      for (var i=0; i<obj.points.length; i++) {
          this.points.push(Curve1DPoint.fromJSON(obj.points[i]));
      }
      this.deg = obj.deg;
      this.updateKnots();
      this.redraw();
      return this;
    }
     basis(t, i) {
      if (this.recalc&RecalcFlags.FULL_BASIS) {
          return this._basis(t, i);
      }
      if (this.recalc&RecalcFlags.BASIS) {
          this.regen_basis();
          this.recalc&=~RecalcFlags.BASIS;
      }
      i = Math.min(Math.max(i, 0), this._ps.length-1);
      t = Math.min(Math.max(t, 0.0), 1.0)*0.999999999;
      var table=this.basis_tables[i];
      var s=t*(table.length/4)*0.99999;
      var j=~~s;
      s-=j;
      j*=4;
      return table[j]+(table[j+3]-table[j])*s;
      return bez4(table[j], table[j+1], table[j+2], table[j+3], s);
    }
     reset() {
      this.length = 0;
      this.points = [];
      this._ps = [];
      this.add(0, 0, true);
      this.add(1, 1, true);
      this.recalc = 1;
      this.updateKnots();
      this.update();
      return this;
    }
     regen_hermite(steps) {
      if (steps===undefined) {
          steps = this.fastmode ? 180 : 340;
      }
      if (this.interpolating) {
          steps*=2;
      }
      this.hermite = new Array(steps);
      var table=this.hermite;
      var eps=1e-05;
      var dt=(1.0-eps*4.001)/(steps-1);
      var t=eps*4;
      var lastdv1, lastf3;
      for (var j=0; j<steps; j++, t+=dt) {
          var f1=this._evaluate(t-eps*2);
          var f2=this._evaluate(t-eps);
          var f3=this._evaluate(t);
          var f4=this._evaluate(t+eps);
          var f5=this._evaluate(t+eps*2);
          var dv1=(f4-f2)/(eps*2);
          dv1/=steps;
          if (j>0) {
              var j2=j-1;
              table[j2*4] = lastf3;
              table[j2*4+1] = lastf3+lastdv1/3.0;
              table[j2*4+2] = f3-dv1/3.0;
              table[j2*4+3] = f3;
          }
          lastdv1 = dv1;
          lastf3 = f3;
      }
    }
     solve_interpolating() {
      for (let p of this._ps) {
          p.rco.load(p);
      }
      this._evaluate2(0.5);
      let error1=(p) =>        {
        return this._evaluate(p[0])-p[1];
      };
      let error=(p) =>        {
        return error1(p);
      };
      let err=0.0;
      let g=new Vector2();
      for (let step=0; step<25; step++) {
          err = 0.0;
          for (let p of this._ps) {
              let r1=error(p);
              const df=1e-05;
              err+=Math.abs(r1);
              if (p===this._ps[0]||p===this._ps[this._ps.length-1]) {
              }
              g.zero();
              for (let i=0; i<2; i++) {
                  let orig=p.rco[i];
                  p.rco[i]+=df;
                  let r2=error(p);
                  p.rco[i] = orig;
                  g[i] = (r2-r1)/df;
              }
              let totgs=g.dot(g);
              if (totgs<1e-08) {
                  continue;
              }
              r1/=totgs;
              let k=0.5;
              p.rco[0]+=-r1*g[0]*k;
              p.rco[1]+=-r1*g[1]*k;
          }
          this.updateKnots(false);
          let th=this.fastmode ? 0.001 : 5e-05;
          if (err<th) {
              break;
          }
      }
    }
     regen_basis() {
      var steps=this.fastmode ? 64 : 128;
      if (this.interpolating) {
          steps*=2;
      }
      this.basis_tables = new Array(this._ps.length);
      for (var i=0; i<this._ps.length; i++) {
          var table=this.basis_tables[i] = new Array((steps-1)*4);
          var eps=1e-05;
          var dt=(1.0-eps*8)/(steps-1);
          var t=eps*4;
          var lastdv1, lastf3;
          for (var j=0; j<steps; j++, t+=dt) {
              var f1=this._basis(t-eps*2, i);
              var f2=this._basis(t-eps, i);
              var f3=this._basis(t, i);
              var f4=this._basis(t+eps, i);
              var f5=this._basis(t+eps*2, i);
              var dv1=(f4-f2)/(eps*2);
              dv1/=steps;
              if (j>0) {
                  var j2=j-1;
                  table[j2*4] = lastf3;
                  table[j2*4+1] = lastf3+lastdv1/3.0;
                  table[j2*4+2] = f3-dv1/3.0;
                  table[j2*4+3] = f3;
              }
              lastdv1 = dv1;
              lastf3 = f3;
          }
      }
    }
     _basis(t, i) {
      var len=this._ps.length;
      var ps=this._ps;
      function safe_inv(n) {
        return n==0 ? 0 : 1.0/n;
      }
      function bas(s, i, n) {
        var kp=Math.min(Math.max(i-1, 0), len-1);
        var kn=Math.min(Math.max(i+1, 0), len-1);
        var knn=Math.min(Math.max(i+n, 0), len-1);
        var knn1=Math.min(Math.max(i+n+1, 0), len-1);
        var ki=Math.min(Math.max(i, 0), len-1);
        if (n==0) {
            return s>=ps[ki].rco[0]&&s<ps[kn].rco[0] ? 1 : 0;
        }
        else {
          var a=(s-ps[ki].rco[0])*safe_inv(ps[knn].rco[0]-ps[ki].rco[0]+0.0001);
          var b=(ps[knn1].rco[0]-s)*safe_inv(ps[knn1].rco[0]-ps[kn].rco[0]+0.0001);
          var ret=a*bas(s, i, n-1)+b*bas(s, i+1, n-1);
          return ret;
        }
      }
      var p=this._ps[i].rco, nk, pk;
      var deg=this.deg;
      var b=bas(t, i-deg, deg);
      return b;
    }
     evaluate(t) {
      var a=this.points[0].rco, b=this.points[this.points.length-1].rco;
      if (t<a[0])
        return a[1];
      if (t>b[0])
        return b[1];
      if (this.points.length==2) {
          t = (t-a[0])/(b[0]-a[0]);
          return a[1]+(b[1]-a[1])*t;
      }
      if (this.recalc) {
          this.regen_basis();
          if (this.interpolating) {
              this.solve_interpolating();
          }
          this.regen_hermite();
          this.recalc = 0;
      }
      t*=0.999999;
      var table=this.hermite;
      var s=t*(table.length/4);
      var i=Math.floor(s);
      s-=i;
      i*=4;
      return table[i]+(table[i+3]-table[i])*s;
    }
     _evaluate(t) {
      var start_t=t;
      if (this.points.length>1) {
          var a=this.points[0], b=this.points[this.points.length-1];
          if (t<a[0])
            return a[1];
          if (t>=b[0])
            return b[1];
      }
      for (var i=0; i<35; i++) {
          var df=0.0001;
          var ret1=this._evaluate2(t<0.5 ? t : t-df);
          var ret2=this._evaluate2(t<0.5 ? t+df : t);
          var f1=Math.abs(ret1[0]-start_t);
          var f2=Math.abs(ret2[0]-start_t);
          var g=(f2-f1)/df;
          if (f1==f2)
            break;
          if (f1==0.0||g==0.0)
            return this._evaluate2(t)[1];
          var fac=-(f1/g)*0.5;
          if (fac==0.0) {
              fac = 0.01;
          }
          else 
            if (Math.abs(fac)>0.1) {
              fac = 0.1*Math.sign(fac);
          }
          t+=fac;
          var eps=1e-05;
          t = Math.min(Math.max(t, eps), 1.0-eps);
      }
      return this._evaluate2(t)[1];
    }
     _evaluate2(t) {
      var ret=eval2_rets.next();
      t*=0.9999999;
      var totbasis=0;
      var sumx=0;
      var sumy=0;
      for (var i=0; i<this._ps.length; i++) {
          var p=this._ps[i].rco;
          var b=this.basis(t, i);
          sumx+=b*p[0];
          sumy+=b*p[1];
          totbasis+=b;
      }
      if (totbasis!=0.0) {
          sumx/=totbasis;
          sumy/=totbasis;
      }
      ret[0] = sumx;
      ret[1] = sumy;
      return ret;
    }
    get  hasGUI() {
      return this.uidata!==undefined;
    }
     _wrapTouchEvent(e) {
      return {x: e.touches.length ? e.touches[0].pageX : this.mpos[0], 
     y: e.touches.length ? e.touches[0].pageY : this.mpos[1], 
     button: 0, 
     shiftKey: e.shiftKey, 
     altKey: e.altKey, 
     ctrlKey: e.ctrlKey, 
     isTouch: true, 
     commandKey: e.commandKey, 
     stopPropagation: e.stopPropagation(), 
     preventDefault: e.preventDefault()}
    }
     on_touchstart(e) {
      this.mpos[0] = e.touches[0].pageX;
      this.mpos[1] = e.touches[0].pageY;
      let e2=this._wrapTouchEvent(e);
      this.on_mousemove(e2);
      this.on_mousedown(e2);
    }
     on_touchmove(e) {
      this.mpos[0] = e.touches[0].pageX;
      this.mpos[1] = e.touches[0].pageY;
      let e2=this._wrapTouchEvent(e);
      this.on_mousemove(e2);
    }
     on_touchend(e) {
      this.on_mouseup(this._wrapTouchEvent(e));
    }
     on_touchcancel(e) {
      this.on_touchend(e);
    }
     makeGUI(container, canvas, drawTransform) {
      this.uidata = {start_mpos: new Vector2(), 
     transpoints: [], 
     dom: container, 
     canvas: canvas, 
     g: canvas.g, 
     transforming: false, 
     draw_trans: drawTransform};
      canvas.addEventListener("touchstart", this.on_touchstart);
      canvas.addEventListener("touchmove", this.on_touchmove);
      canvas.addEventListener("touchend", this.on_touchend);
      canvas.addEventListener("touchcancel", this.on_touchcancel);
      canvas.addEventListener("mousedown", this.on_mousedown);
      canvas.addEventListener("mousemove", this.on_mousemove);
      canvas.addEventListener("mouseup", this.on_mouseup);
      canvas.addEventListener("keydown", this.on_keydown);
      let row=container.row();
      let fullUpdate=() =>        {
        this.updateKnots();
        this.update();
        this.regen_basis();
        this.recalc = RecalcFlags.ALL;
        this.redraw();
      };
      row.iconbutton(Icons.TINY_X, "Delete Point", () =>        {
        console.log("delete point");
        for (var i=0; i<this.points.length; i++) {
            var p=this.points[i];
            if (p.flag&CurveFlags.SELECT) {
                this.points.remove(p);
                i--;
            }
        }
        fullUpdate();
      });
      row.button("Reset", () =>        {
        this.reset();
      });
      row.simpleslider(undefined, "Degree", this.deg, 1, 6, 1, true, true, (slider) =>        {
        this.deg = Math.floor(slider.value);
        fullUpdate();
        console.log(this.deg);
      });
      row = container.row();
      let check=row.check(undefined, "Interpolating");
      check.checked = this.interpolating;
      check.onchange = () =>        {
        this.interpolating = check.value;
        console.log(check.value);
        fullUpdate();
      };
      return this;
    }
     killGUI(container, canvas) {
      if (this.uidata!==undefined) {
          let ud=this.uidata;
          this.uidata = undefined;
          console.log("removing event handlers for bspline curve");
          canvas.removeEventListener("touchstart", this.on_touchstart);
          canvas.removeEventListener("touchmove", this.on_touchmove);
          canvas.removeEventListener("touchend", this.on_touchend);
          canvas.removeEventListener("touchcancel", this.on_touchcancel);
          canvas.removeEventListener("mousedown", this.on_mousedown);
          canvas.removeEventListener("mousemove", this.on_mousemove);
          canvas.removeEventListener("mouseup", this.on_mouseup);
          canvas.removeEventListener("keydown", this.on_keydown);
      }
      return this;
    }
     start_transform() {
      this.uidata.transpoints = [];
      for (let p of this.points) {
          if (p.flag&CurveFlags.SELECT) {
              this.uidata.transpoints.push(p);
              p.startco.load(p);
          }
      }
    }
     on_mousedown(e) {
      console.log("bspline mdown", e.x, e.y);
      this.uidata.start_mpos.load(this.transform_mpos(e.x, e.y));
      this.fastmode = true;
      console.log(this.uidata.start_mpos, this.uidata.draw_trans);
      var mpos=this.transform_mpos(e.x, e.y);
      var x=mpos[0], y=mpos[1];
      this.do_highlight(x, y);
      if (this.points.highlight!=undefined) {
          if (!e.shiftKey) {
              for (var i=0; i<this.points.length; i++) {
                  this.points[i].flag&=~CurveFlags.SELECT;
              }
              this.points.highlight.flag|=CurveFlags.SELECT;
          }
          else {
            this.points.highlight.flag^=CurveFlags.SELECT;
          }
          this.uidata.transforming = true;
          this.start_transform();
          this.updateKnots();
          this.update();
          this.redraw();
          return ;
      }
      else 
        if (!e.isTouch) {
          var p=this.add(this.uidata.start_mpos[0], this.uidata.start_mpos[1]);
          this.points.highlight = p;
          this.updateKnots();
          this.update();
          this.redraw();
          this.points.highlight.flag|=CurveFlags.SELECT;
          this.uidata.transforming = true;
          this.uidata.transpoints = [this.points.highlight];
          this.uidata.transpoints[0].startco.load(this.uidata.transpoints[0]);
      }
    }
     do_highlight(x, y) {
      var trans=this.uidata.draw_trans;
      var mindis=1e+17, minp=undefined;
      var limit=19/trans[0], limitsqr=limit*limit;
      for (var i=0; i<this.points.length; i++) {
          var p=this.points[i];
          var dx=x-p.sco[0], dy=y-p.sco[1], dis=dx*dx+dy*dy;
          if (dis<mindis&&dis<limitsqr) {
              mindis = dis;
              minp = p;
          }
      }
      if (this.points.highlight!==minp) {
          this.points.highlight = minp;
          this.redraw();
      }
    }
     do_transform(x, y) {
      var off=new Vector2([x, y]).sub(this.uidata.start_mpos);
      for (var i=0; i<this.uidata.transpoints.length; i++) {
          var p=this.uidata.transpoints[i];
          p.load(p.startco).add(off);
          p[0] = Math.min(Math.max(p[0], 0), 1);
          p[1] = Math.min(Math.max(p[1], 0), 1);
      }
      this.updateKnots();
      this.update();
      this.redraw();
    }
     transform_mpos(x, y) {
      var r=this.uidata.canvas.getClientRects()[0];
      let dpi=devicePixelRatio;
      x-=parseInt(r.left);
      y-=parseInt(r.top);
      x*=dpi;
      y*=dpi;
      var trans=this.uidata.draw_trans;
      x = x/trans[0]-trans[1][0];
      y = -y/trans[0]-trans[1][1];
      return [x, y];
    }
     on_mousemove(e) {
      if (e.isTouch&&this.uidata.transforming) {
          e.preventDefault();
      }
      var mpos=this.transform_mpos(e.x, e.y);
      var x=mpos[0], y=mpos[1];
      if (this.uidata.transforming) {
          this.do_transform(x, y);
          this.evaluate(0.5);
      }
      else {
        this.do_highlight(x, y);
      }
    }
     on_mouseup(e) {
      this.uidata.transforming = false;
      this.fastmode = false;
      this.updateKnots();
      this.update();
    }
     on_keydown(e) {
      console.log(e.keyCode);
      switch (e.keyCode) {
        case 88:
        case 46:
          if (this.points.highlight!=undefined) {
              this.points.remove(this.points.highlight);
              this.recalc = RecalcFlags.ALL;
              this.points.highlight = undefined;
              this.updateKnots();
              this.update();
              if (this._save_hook!==undefined) {
                  this._save_hook();
              }
          }
          break;
      }
    }
     draw(canvas, g, draw_trans) {
      g.save();
      if (this.uidata===undefined) {
          return ;
      }
      this.uidata.canvas = canvas;
      this.uidata.g = g;
      this.uidata.draw_trans = draw_trans;
      let sz=draw_trans[0], pan=draw_trans[1];
      g.lineWidth*=3.0;
      for (var ssi=0; ssi<2; ssi++) {
          break;
          for (var si=0; si<this.points.length; si++) {
              g.beginPath();
              var f=0;
              for (var i=0; i<steps; i++, f+=df) {
                  var totbasis=0;
                  for (var j=0; j<this.points.length; j++) {
                      totbasis+=this.basis(f, j);
                  }
                  var val=this.basis(f, si);
                  if (ssi)
                    val/=(totbasis==0 ? 1 : totbasis);
                  (i==0 ? g.moveTo : g.lineTo).call(g, f, ssi ? val : val*0.5, w, w);
              }
              var color, alpha=this.points[si]===this.points.highlight ? 1.0 : 0.7;
              if (ssi) {
                  color = "rgba(105, 25, 5,"+alpha+")";
              }
              else {
                color = "rgba(25, 145, 45,"+alpha+")";
              }
              g.strokeStyle = color;
              g.stroke();
          }
      }
      g.lineWidth/=3.0;
      let w=0.03;
      for (let p of this.points) {
          g.beginPath();
          if (p===this.points.highlight) {
              g.fillStyle = "green";
          }
          else 
            if (p.flag&CurveFlags.SELECT) {
              g.fillStyle = "red";
          }
          else {
            g.fillStyle = "orange";
          }
          g.rect(p.sco[0]-w/2, p.sco[1]-w/2, w, w);
          g.fill();
      }
      g.restore();
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.updateKnots();
      this.regen_basis();
      this.recalc = RecalcFlags.ALL;
    }
  }
  _ESClass.register(BSplineCurve);
  _es6_module.add_class(BSplineCurve);
  BSplineCurve.STRUCT = nstructjs.inherit(BSplineCurve, CurveTypeData)+`
  points        : array(Curve1DPoint);
  deg           : int;
  eidgen        : IDGen;
  interpolating : bool;
}
`;
  nstructjs.register(BSplineCurve);
  CurveTypeData.register(BSplineCurve);
}, '/dev/fairmotion/src/path.ux/scripts/curve/curve1d_bspline.js');
es6_module_define('curve1d_utils', ["./curve1d_base.js", "../toolsys/toolprop.js"], function _curve1d_utils_module(_es6_module) {
  var CurveConstructors=es6_import_item(_es6_module, './curve1d_base.js', 'CurveConstructors');
  var EnumProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'EnumProperty');
  function makeGenEnum() {
    let enumdef={}
    let uinames={}
    let icons={}
    for (let cls of CurveConstructors) {
        let def=cls.define();
        let uiname=def.uiname;
        uiname = uiname===undefined ? def.name : uiname;
        enumdef[def.name] = cls.name;
        uinames[def.name] = uiname;
        icons[def.name] = def.icon!==undefined ? def.icon : -1;
    }
    return new EnumProperty(undefined, enumdef).addUINames(uinames).addIcons(icons);
  }
  makeGenEnum = _es6_module.add_export('makeGenEnum', makeGenEnum);
}, '/dev/fairmotion/src/path.ux/scripts/curve/curve1d_utils.js');
es6_module_define('ease', [], function _ease_module(_es6_module) {
  function Ease() {
    throw "Ease cannot be instantiated.";
  }
  Ease;
  Ease = _es6_module.set_default_export('Ease', Ease);
  
  Ease.linear = function (t) {
    return t;
  }
  Ease.none = Ease.linear;
  Ease.get = function (amount) {
    if (amount<-1) {
        amount = -1;
    }
    else 
      if (amount>1) {
        amount = 1;
    }
    return function (t) {
      if (amount==0) {
          return t;
      }
      if (amount<0) {
          return t*(t*-amount+1+amount);
      }
      return t*((2-t)*amount+(1-amount));
    }
  }
  Ease.getPowIn = function (pow) {
    return function (t) {
      return Math.pow(t, pow);
    }
  }
  Ease.getPowOut = function (pow) {
    return function (t) {
      return 1-Math.pow(1-t, pow);
    }
  }
  Ease.getPowInOut = function (pow) {
    return function (t) {
      if ((t*=2)<1)
        return 0.5*Math.pow(t, pow);
      return 1-0.5*Math.abs(Math.pow(2-t, pow));
    }
  }
  Ease.quadIn = Ease.getPowIn(2);
  Ease.quadOut = Ease.getPowOut(2);
  Ease.quadInOut = Ease.getPowInOut(2);
  Ease.cubicIn = Ease.getPowIn(3);
  Ease.cubicOut = Ease.getPowOut(3);
  Ease.cubicInOut = Ease.getPowInOut(3);
  Ease.quartIn = Ease.getPowIn(4);
  Ease.quartOut = Ease.getPowOut(4);
  Ease.quartInOut = Ease.getPowInOut(4);
  Ease.quintIn = Ease.getPowIn(5);
  Ease.quintOut = Ease.getPowOut(5);
  Ease.quintInOut = Ease.getPowInOut(5);
  Ease.sineIn = function (t) {
    return 1-Math.cos(t*Math.PI/2);
  }
  Ease.sineOut = function (t) {
    return Math.sin(t*Math.PI/2);
  }
  Ease.sineInOut = function (t) {
    return -0.5*(Math.cos(Math.PI*t)-1);
  }
  Ease.getBackIn = function (amount) {
    return function (t) {
      return t*t*((amount+1)*t-amount);
    }
  }
  Ease.backIn = Ease.getBackIn(1.7);
  Ease.getBackOut = function (amount) {
    return function (t) {
      return (--t*t*((amount+1)*t+amount)+1);
    }
  }
  Ease.backOut = Ease.getBackOut(1.7);
  Ease.getBackInOut = function (amount) {
    amount*=1.525;
    return function (t) {
      if ((t*=2)<1)
        return 0.5*(t*t*((amount+1)*t-amount));
      return 0.5*((t-=2)*t*((amount+1)*t+amount)+2);
    }
  }
  Ease.backInOut = Ease.getBackInOut(1.7);
  Ease.circIn = function (t) {
    return -(Math.sqrt(1-t*t)-1);
  }
  Ease.circOut = function (t) {
    return Math.sqrt(1-(--t)*t);
  }
  Ease.circInOut = function (t) {
    if ((t*=2)<1)
      return -0.5*(Math.sqrt(1-t*t)-1);
    return 0.5*(Math.sqrt(1-(t-=2)*t)+1);
  }
  Ease.bounceIn = function (t) {
    return 1-Ease.bounceOut(1-t);
  }
  Ease.bounceOut = function (t) {
    if (t<1/2.75) {
        return (7.5625*t*t);
    }
    else 
      if (t<2/2.75) {
        return (7.5625*(t-=1.5/2.75)*t+0.75);
    }
    else 
      if (t<2.5/2.75) {
        return (7.5625*(t-=2.25/2.75)*t+0.9375);
    }
    else {
      return (7.5625*(t-=2.625/2.75)*t+0.984375);
    }
  }
  Ease.bounceInOut = function (t) {
    if (t<0.5)
      return Ease.bounceIn(t*2)*0.5;
    return Ease.bounceOut(t*2-1)*0.5+0.5;
  }
  Ease.getElasticIn = function (amplitude, period) {
    var pi2=Math.PI*2;
    return function (t) {
      if (t==0||t==1)
        return t;
      var s=period/pi2*Math.asin(1/amplitude);
      return -(amplitude*Math.pow(2, 10*(t-=1))*Math.sin((t-s)*pi2/period));
    }
  }
  Ease.elasticIn = Ease.getElasticIn(1, 0.3);
  Ease.getElasticOut = function (amplitude, period) {
    var pi2=Math.PI*2;
    return function (t) {
      if (t==0||t==1)
        return t;
      var s=period/pi2*Math.asin(1/amplitude);
      return (amplitude*Math.pow(2, -10*t)*Math.sin((t-s)*pi2/period)+1);
    }
  }
  Ease.elasticOut = Ease.getElasticOut(1, 0.3);
  Ease.getElasticInOut = function (amplitude, period) {
    var pi2=Math.PI*2;
    return function (t) {
      var s=period/pi2*Math.asin(1/amplitude);
      if ((t*=2)<1)
        return -0.5*(amplitude*Math.pow(2, 10*(t-=1))*Math.sin((t-s)*pi2/period));
      return amplitude*Math.pow(2, -10*(t-=1))*Math.sin((t-s)*pi2/period)*0.5+1;
    }
  }
  Ease.elasticInOut = Ease.getElasticInOut(1, 0.3*1.5);
}, '/dev/fairmotion/src/path.ux/scripts/curve/ease.js');
es6_module_define('docbrowser', ["../util/simple_events.js", "../util/struct.js", "../core/ui_base.js"], function _docbrowser_module(_es6_module) {
  var pushModalLight=es6_import_item(_es6_module, '../util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../util/simple_events.js', 'popModalLight');
  var nstructjs=es6_import(_es6_module, '../util/struct.js');
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  let countstr=function (buf, s) {
    let count=0;
    while (buf.length>0) {
      let i=buf.search(s);
      if (i<0) {
          break;
      }
      buf = buf.slice(i+1, buf.length);
      count++;
    }
    return count;
  }
  function basename(path) {
    while (path.length>0&&path.trim().endsWith("/")) {
      path = path.slice(0, path.length-1);
    }
    path = path.replace(/\/+/g, "/");
    path = path.split("/");
    return path[path.length-1];
  }
  function dirname(path) {
    while (path.length>0&&path.trim().endsWith("/")) {
      path = path.slice(0, path.length-1);
    }
    path = path.split("/");
    path.length--;
    let s="";
    for (let t of path) {
        s+=t+"/";
    }
    while (s.endsWith("/")) {
      s = s.slice(0, s.length-1);
    }
    return s;
  }
  function relative(a1, b1) {
    let a=a1, b=b1;
    let i=1;
    while (i<=a.length&&b.startsWith(a.slice(0, i+1))) {
      i++;
    }
    i--;
    let pref="";
    a = a.slice(i, a.length).trim();
    b = b.slice(i, b.length).trim();
    let s="";
    for (let i=0; i<countstr(a, "/"); i++) {
        s+="../";
    }
    if (s.endsWith("/")&&b.startsWith("/")) {
        s = s.slice(0, s.length-1);
    }
    return s+b;
  }
  window._relative = relative;
  class SavedDocument  {
     constructor() {
      this.data = "";
    }
  }
  _ESClass.register(SavedDocument);
  _es6_module.add_class(SavedDocument);
  SavedDocument = _es6_module.add_export('SavedDocument', SavedDocument);
  SavedDocument.STRUCT = `
SavedDocument {
  data : string;
}`;
  nstructjs.register(SavedDocument);
  class DocsAPI  {
     updateDoc(relpath, data) {

    }
     uploadImage(blobInfo, success, onError) {

    }
     newDoc(relpath, data) {

    }
     hasDoc(relpath, data) {

    }
     uploadImage(relpath, blobInfo, success, onError) {

    }
  }
  _ESClass.register(DocsAPI);
  _es6_module.add_class(DocsAPI);
  DocsAPI = _es6_module.add_export('DocsAPI', DocsAPI);
  window.PATHUX_DOCPATH = "../simple_docsys/docsys.js";
  window.PATHUX_DOC_CONFIG = "../simple_docsys/docs.config.js";
  class ElectronAPI extends DocsAPI {
     constructor() {
      super();
      this.first = true;
    }
     _doinit() {
      if (!this.first) {
          return ;
      }
      let docsys=require(PATHUX_DOCPATH);
      this.config = docsys.readConfig(PATHUX_DOC_CONFIG);
      this.first = false;
    }
     uploadImage(relpath, blobInfo, success, onError) {
      return new Promise((accept, reject) =>        {
        this._doinit();
        let blob=blobInfo.blob();
        return blob.arrayBuffer().then((data) =>          {
          let path=this.config.uploadImage(relpath, blobInfo.filename(), data);
          success(path);
        });
      }).catch((error) =>        {
        onError(""+error);
      });
    }
     hasDoc(relpath) {
      this._doinit();
      return new Promise((accept, reject) =>        {
        accept(this.config.hasDoc(relpath));
      });
    }
     updateDoc(relpath, data) {
      this._doinit();
      return new Promise((accept, reject) =>        {
        accept(this.config.updateDoc(relpath, data));
      });
    }
     newDoc(relpath, data) {
      this._doinit();
      return new Promise((accept, reject) =>        {
        accept(this.config.newDoc(relpath, data));
      });
    }
  }
  _ESClass.register(ElectronAPI);
  _es6_module.add_class(ElectronAPI);
  ElectronAPI = _es6_module.add_export('ElectronAPI', ElectronAPI);
  class ServerAPI extends DocsAPI {
     constructor() {
      super();
    }
     hasDoc(relpath) {
      return this.callAPI("hasDoc", relpath);
    }
     updateDoc(relpath, data) {
      return this.callAPI("updateDoc", relpath, data);
    }
     newDoc(relpath, data) {
      return this.callAPI("newDoc", relpath, data);
    }
     uploadImage(relpath, blobInfo, success, onError) {
      return new Promise((accept, reject) =>        {
        let blob=blobInfo.blob();
        return blob.arrayBuffer().then((data) =>          {
          console.log("data!", data);
          let uint8=new Uint8Array(data);
          let data2=[];
          for (let i=0; i<uint8.length; i++) {
              data2.push(uint8[i]);
          }
          console.log("data2", data2);
          this.callAPI("uploadImage", relpath, blobInfo.filename(), data2).then((path) =>            {
            success(path);
          });
        });
      }).catch((error) =>        {
        onError(""+error);
      });
    }
     callAPI() {
      let key=arguments[0];
      let args=[];
      for (let i=1; i<arguments.length; i++) {
          args.push(arguments[i]);
      }
      console.log(args, arguments.length);
      let path=location.origin+"/api/"+key;
      console.log(path);
      return new Promise((accept, reject) =>        {
        fetch(path, {headers: {"Content-Type": "application/json"}, 
      method: "POST", 
      cache: "no-cache", 
      body: JSON.stringify(args)}).then((res) =>          {
          console.log(path);
          if (res.ok||res.status<300) {
              res.text().then((data) =>                {
                console.log("got json", data);
                data = JSON.parse(data);
                accept(data.result);
              }).catch((error) =>                {
                console.log("ERROR!", error);
                reject(error);
              });
          }
          else {
            res.text().then((data) =>              {
              console.log(data);
              reject(data);
            });
          }
        }).catch((error) =>          {
          reject(error);
        });
      });
    }
  }
  _ESClass.register(ServerAPI);
  _es6_module.add_class(ServerAPI);
  ServerAPI = _es6_module.add_export('ServerAPI', ServerAPI);
  class DocHistoryItem  {
     constructor(url, title) {
      this.url = url;
      this.title = ""+title;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(DocHistoryItem);
  _es6_module.add_class(DocHistoryItem);
  DocHistoryItem = _es6_module.add_export('DocHistoryItem', DocHistoryItem);
  DocHistoryItem.STRUCT = `
DocHistoryItem {
  url   : string;
  title : string;
}
`;
  nstructjs.register(DocHistoryItem);
  class DocHistory extends Array {
     constructor() {
      super();
      this.cur = 0;
    }
     push(url, title=url) {
      console.warn("history push", url);
      this.length = this.cur+1;
      this[this.length-1] = new DocHistoryItem(url, title);
      this.cur++;
      return this;
    }
     go(dir) {
      dir = Math.sign(dir);
      this.cur = Math.min(Math.max(this.cur+dir, 0), this.length-1);
      return this[this.cur];
    }
     loadSTRUCT(reader) {
      reader(this);
      this.length = 0;
      let cur=this.cur;
      this.cur = 0;
      for (let item of this._items) {
          this.push(item);
      }
      this.cur = cur;
    }
  }
  _ESClass.register(DocHistory);
  _es6_module.add_class(DocHistory);
  DocHistory = _es6_module.add_export('DocHistory', DocHistory);
  DocHistory.STRUCT = `
DocHistory {
  _items : array(DocHistoryItem) | this;
  cur    : int;
}
`;
  nstructjs.register(DocHistory);
  class DocsBrowser extends UIBase {
     constructor() {
      super();
      this.editMode = false;
      this.history = new DocHistory();
      this._prefix = cconst.docManualPath;
      this.saveReq = 0;
      this.saveReqStart = util.time_ms();
      this._last_save = util.time_ms();
      this.header = document.createElement("rowframe-x");
      this.shadow.appendChild(this.header);
      this.makeHeader();
      this.root = document.createElement("iframe");
      this.shadow.appendChild(this.root);
      this.root.onload = () =>        {
        this.initDoc();
      };
      if (window.haveElectron) {
          this.serverapi = new ElectronAPI();
      }
      else {
        this.serverapi = new ServerAPI();
      }
      this.root.style["margin"] = this.root.style["padding"] = this.root.style["border"] = "0px";
      this.root.style["width"] = "100%";
      this.root.style["height"] = "100%";
      this.currentPath = "";
      this._doDocInit = true;
      this.contentDiv = undefined;
    }
     setEditMode(state) {
      this.editMode = state;
      if (this.tinymce&&this.editMode) {
          this.disableLinks();
          this.tinymce.show();
      }
      else 
        if (this.tinymce&&!this.editMode) {
          this.tinymce.hide();
          this.enableLinks();
      }
      this.makeHeader();
      if (state&&this.oneditstart) {
          this.oneditstart(this);
      }
      else 
        if (!state&&this.oneditend) {
          this.queueSave();
          this.oneditend(this);
      }
    }
     go(dir) {
      if (!this.root.contentWindow) {
          return ;
      }
      if (dir>0) {
          this.root.contentWindow.history.forward();
      }
      else {
        this.root.contentWindow.history.back();
      }
    }
     makeHeader() {
      this.makeHeader_intern();
      this.flushUpdate();
    }
     makeHeader_intern() {
      console.log("making header");
      this.header.clear();
      let check=this.header.check(undefined, "Edit Enabled");
      check.value = this.editMode;
      check.onchange = () =>        {
        console.log("check click!", check.checked);
        this.setEditMode(check.checked);
      };
      if (!this.editMode) {
          this.header.iconbutton(Icons.LEFT_ARROW, "Back", () =>            {
            this.go(-1);
          });
          this.header.iconbutton(Icons.RIGHT_ARROW, "Forward", () =>            {
            this.go(1);
          });
          return ;
      }
      if (!this.contentDiv||!this.contentDiv.contentEditable) {
          setTimeout(() =>            {
            this.makeHeader();
          });
          return ;
      }
      this.header.button("NoteBox", () =>        {
        this.undoPre("Note Box");
        this.execCommand("formatBlock", undefined, "p");
        let sel=this.root.contentDocument.getSelection();
        let p=sel.anchorNode;
        if (!(__instance_of(p, HTMLElement))) {
            p = p.parentElement;
        }
        p.setAttribute("class", "notebox");
        this.undoPost("Note Box");
        console.log(p);
      });
      let indexOf=(list, item) =>        {
        for (let i=0; i<list.length; i++) {
            if (list[i]===item) {
                return i;
            }
        }
        return -1;
      };
      this.header.button("Remove", () =>        {
        let sel=this.root.contentDocument.getSelection();
        let p=sel.anchorNode;
        if (!p)
          return ;
        if (!(__instance_of(p, HTMLElement))) {
            p = p.parentElement;
        }
        if (!p) {
            return ;
        }
        let parent=p.parentNode;
        let i=indexOf(p.parentNode.childNodes, p);
        if (p===this.contentDiv||p===this.contentDiv.parentNode||p===this.root.contentDocument.body) {
            return ;
        }
        p.remove();
        console.log(p, i);
        let add=parent.childNodes.length>0 ? parent.childNodes[i] : undefined;
        for (let i=0; i<p.childNodes.length; i++) {
            if (!add) {
                parent.appendChild(p.childNodes[i]);
            }
            else {
              parent.insertBefore(p.childNodes[i], add);
            }
        }
      });
      this.header.iconbutton(Icons.BOLD, "Bold", () =>        {
        this.execCommand("bold");
        console.log("ACTIVE", this.root.contentDocument.activeElement);
      }).iconsheet = 0;
      this.header.iconbutton(Icons.ITALIC, "Italic", () =>        {
        this.execCommand("italic");
      }).iconsheet = 0;
      this.header.iconbutton(Icons.UNDERLINE, "Underline", () =>        {
        this.execCommand("underline");
      }).iconsheet = 0;
      this.header.iconbutton(Icons.STRIKETHRU, "StrikeThrough", () =>        {
        this.execCommand("strikeThrough");
      }).iconsheet = 0;
      this.header.button("PRE", () =>        {
        this.execCommand("formatBlock", false, "pre");
      }).iconsheet = 0;
      this.header.listenum(undefined, "Style", {Paragraph: "P", 
     "Heading 1": "H1", 
     "Heading 2": "H2", 
     "Heading 3": "H3", 
     "Heading 4": "H4", 
     "Heading 5": "H5"}).onselect = (e) =>        {
        this.execCommand("formatBlock", false, e.toLowerCase());
      };
    }
     init() {
      super.init();
      this.setCSS();
    }
     execCommand() {
      this.undoPre(arguments[0]);
      this.root.contentDocument.execCommand(...arguments);
      this.undoPost(arguments[0]);
    }
     loadSource(data) {
      this.saveReq = 0;
      let cb=() =>        {
        if (this.root.readyState!=='loading') {
            this.initDoc();
        }
        else {
          window.setTimeout(cb, 5);
        }
      };
      this.root.setAttribute("srcDoc", data);
      this.root.onload = cb;
      this._doDocInit = true;
      this.contentDiv = undefined;
    }
     load(url) {
      this.history.push(url, url);
      this.saveReq = 0;
      this.currentPath = url;
      this.root.setAttribute("src", url);
      this.root.onload = () =>        {
        this.initDoc();
      };
      this._doDocInit = true;
      this.contentDiv = undefined;
    }
     initDoc() {
      this._doDocInit = false;
      this.contentDiv = undefined;
      console.log("doc loaded");
      let visit=(n) =>        {
        if (n.getAttribute) {
        }
        if (n.getAttribute&&n.getAttribute("class")==="contents") {
            this.contentDiv = n;
            console.log("found content div");
            return ;
        }
        for (let c of n.childNodes) {
            visit(c);
        }
      };
      if (!this.root.contentDocument) {
          return ;
      }
      visit(this.root.contentDocument.body);
      if (this.contentDiv) {
          if (this.editMode) {
              this.disableLinks();
          }
          let globals=this.root.contentWindow;
          console.log("tinymce globals:", globals.document, globals);
          window.tinymce = undefined;
          window.tinyMCEPreInit = {suffix: "", 
       baseURL: this.currentPath, 
       documentBaseURL: location.href};
          let loc=globals.document.location;
          if (loc.href==="about:srcdoc") {
              loc.href = document.location.href;
          }
          let base_url="/example/lib/tinymce/js/tinymce";
          if (window.haveElectron) {
              base_url = "lib/tinymce/js/tinymce";
              let path=document.location.href;
              path = path.slice(7, path.length);
              path = "file://"+require('path').dirname(path);
              console.log("%c"+path, "blue");
              tinyMCEPreInit.baseURL = path;
              tinyMCEPreInit.documentBaseURL = path;
          }
          let tinymce=this.tinymce = globals.tinymce = window.tinymce = _tinymce(globals);
          tinymce.init({selector: "div.contents", 
       base_url: base_url, 
       paste_data_images: true, 
       allow_html_data_urls: true, 
       plugins: ['quickbars', 'paste'], 
       toolbar: true, 
       menubar: true, 
       inline: true, 
       images_upload_handler: (blobInfo, success, onError) =>              {
              console.log("uploading image!", blobInfo);
              this.serverapi.uploadImage(this.getDocPath(), blobInfo, success, onError);
            }, 
       setup: function (editor) {
              console.log("tinymce editor setup!", editor);
            }}).then((arg) =>            {
            this.tinymce = arg[0];
            if (!this.editMode) {
                this.tinymce.hide();
            }
            else {
              this.disableLinks();
            }
          });
          let onchange=(e) =>            {
            console.log("Input event!");
            this.queueSave();
          };
          this.contentDiv.addEventListener("input", onchange);
          this.contentDiv.addEventListener("change", onchange);
      }
    }
     queueSave() {
      if (!this.saveReq) {
          this.saveReqStart = util.time_ms();
      }
      this.saveReq = 1;
    }
     undoPre() {
      let undo=this.tinymce.editors[0].undoManager;
      undo.beforeChange();
    }
     undoPost(label) {
      let undo=this.tinymce.editors[0].undoManager;
      undo.add();
    }
     enableLinks() {
      let visit=(n) =>        {
        if (n.getAttribute&&n.getAttribute("class")==="contents") {
            return ;
        }
        if (n.tagName==="A") {
            if (n.getAttribute("_href")) {
                n.setAttribute("href", n.getAttribute("_href"));
            }
        }
        for (let c of n.childNodes) {
            visit(c);
        }
      };
      visit(this.root.contentDocument.body);
    }
     disableLinks() {
      let visit=(n) =>        {
        if (n.getAttribute&&n.getAttribute("class")==="contents") {
            return ;
        }
        if (n.tagName==="A") {
            n.setAttribute("_href", n.getAttribute("href"));
            n.removeAttribute("href");
        }
        for (let c of n.childNodes) {
            visit(c);
        }
      };
      visit(this.root.contentDocument.body);
    }
     patchImageTags() {
      console.log("patching image tags");
      if (!this.contentDiv) {
          return ;
      }
      let tags=[];
      let traverse=(n) =>        {
        if (n.tagName==="IMG"&&!n.getAttribute("_PATCHED_")) {
            tags.push(n);
        }
        for (let c of n.children) {
            traverse(c);
        }
      };
      traverse(this.contentDiv);
      console.log("Image Tags found:", tags);
      for (let t of tags) {
          this.patchImage(t);
          t.setAttribute("_PATCHED_", true);
      }
    }
     patchImage(img) {
      img.style.float = "right";
      return ;
      console.warn("Patching image!");
      let grab=(i, vs) =>        {
        console.log("Transform Modal start");
        let horiz=i%2!=0 ? 1 : 0;
        let update=() =>          {
          let x=vs[0][0], y=vs[0][1];
          let w=vs[2][0]-vs[0][0];
          let h=vs[1][1]-vs[0][1];
          img.style["display"] = "float";
          img.style["left"] = x+"px";
          img.style["top"] = y+"px";
          img.style["width"] = w+"px";
          img.style["height"] = h+"px";
        }
        update();
        let modaldata;
        let first=true;
        let last_mpos=new Vector2();
        let start_mpos=new Vector2();
        let end=() =>          {
          if (modaldata) {
              console.log("done.");
              popModalLight(modaldata);
              modaldata = undefined;
          }
        }
        let ghandlers={on_mousedown: function on_mousedown(e) {
          }, 
      on_mousemove: function on_mousemove(e) {
            console.log("modal move");
            if (first) {
                first = false;
                start_mpos[0] = last_mpos[0] = e.x;
                start_mpos[1] = last_mpos[1] = e.y;
                return ;
            }
            let dx=e.x-last_mpos[0], dy=last_mpos[1]-e.y;
            console.log(dx.toFixed(2), dy.toFixed(2));
            last_mpos[0] = e.x;
            last_mpos[1] = e.y;
          }, 
      on_mouseup: function on_mouseup(e) {
            end();
          }, 
      on_keydown: function on_keydown(e) {
            console.log(e.keyCode);
            if (e.keyCode===27) {
                end();
            }
          }}
        modaldata = pushModalLight(ghandlers);
        console.warn("grab!", modaldata);
      };
      let mpos=new Vector2();
      let first=true;
      let tdown=true;
      let mdown=false;
      let ix=0, iy=0;
      let width=img.width, height=img.height;
      img.setAttribute("draggable", "false");
      let getsize=() =>        {
        let r=img.getClientRects[0];
        if (!r) {
            setTimeout(getsize, 2);
            return ;
        }
        console.log("got image size", width, height, img.width, img.height);
        width = r.width;
        height = r.height;
      };
      let resizing=false;
      let moving=false;
      let handlers={pointerover: function pointerover(e) {
          console.log("mouse over!");
        }, 
     pointerleave: function pointerleave(e) {
          console.log("mouse leave!");
        }, 
     pointerdown: function pointerdown(e, x, y, button) {
          if (x===undefined) {
              x = e.x;
          }
          if (y===undefined) {
              y = e.y;
          }
          if (button===undefined) {
              button = e.button;
          }
          mpos[0] = x;
          mpos[1] = y;
          mdown = true;
          resizing = false;
          moving = false;
          img.setPointerCapture(e.pointerId);
        }, 
     pointermove: function pointermove(e, x, y, button) {
          if (x===undefined) {
              x = e.x;
          }
          if (y===undefined) {
              y = e.y;
          }
          if (button===undefined) {
              button = e.button;
          }
          if (first) {
              mpos[0] = x;
              mpos[1] = y;
              first = false;
              return ;
          }
          console.log(moving);
          if (moving) {
              let dx=x-mpos[0], dy=y-mpos[1];
              console.log("mdown!", dx, dy);
              ix+=dx;
              iy+=dy;
              img.style["position"] = "relative";
              img.style["display"] = "inline";
              img.style["left"] = ix+"px";
              img.style.float = "right";
              img.style["top"] = iy+"px";
          }
          if (resizing) {
              let dx=x-mpos[0], dy=y-mpos[1];
              console.log("mdown!", dx, dy);
              width+=dy;
              height+=dy;
              img.style["width"] = width+"px";
              img.style["height"] = height+"px";
              console.log("ix", ix);
          }
          mpos[0] = x;
          mpos[1] = y;
          let r=img.getBoundingClientRect();
          if (!r) {
              return ;
          }
          let verts=[new Vector2([r.x, r.y]), new Vector2([r.x, r.y+r.height]), new Vector2([r.x+r.width, r.y+r.height]), new Vector2([r.x+r.width, r.y])];
          let ret=undefined;
          let mindis=1e+17;
          for (let i=0; i<4; i++) {
              let i1=i, i2=(i+1)%4;
              let v1=verts[i1], v2=verts[i2];
              let horiz=i%2!==0.0 ? 1 : 0;
              let dv=mpos[horiz]-v1[horiz];
              if (Math.abs(dv)<15&&Math.abs(dv)<mindis) {
                  mindis = Math.abs(dv);
                  ret = i;
                  console.log("border!", i);
              }
          }
          if (ret!==undefined&&!moving) {
              img.setAttribute("draggable", "false");
              if (mdown) {
                  resizing = true;
                  img.setPointerCapture(e.pointerId);
              }
          }
          else 
            if (!resizing&&mdown) {
              moving = true;
              img.setPointerCapture(e.pointerId);
          }
        }, 
     pointerup: function pointerup(e, x, y, button) {
          if (x===undefined) {
              x = e.x;
          }
          if (y===undefined) {
              y = e.y;
          }
          if (button===undefined) {
              button = e.button;
          }
          mpos[0] = x;
          mpos[1] = y;
          mdown = false;
          if (resizing) {
              this.releasePointerCapture(e.pointerId);
          }
          resizing = false;
          moving = false;
        }, 
     pointercancel: function pointercancel(e) {
          mdown = false;
          moving = false;
        }};
      window.setInterval(() =>        {
        if (1||!mdown) {
            let val=img.getAttribute("draggable");
            img.setAttribute("draggable", "false");
            img.setAttribute("draggable", val);
        }
      }, 200);
      for (let k in handlers) {
          img.addEventListener(k, handlers[k].bind(this), true);
      }
    }
     toMarkdown() {
      if (this.contentDiv===undefined) {
          return ;
      }
      let buf="";
      let visit;
      let liststack=[];
      let image_idgen=0;
      let getlist=() =>        {
        if (liststack.length>0)
          return liststack[liststack.length-1];
      };
      let handlers={TEXT: function TEXT(n) {
          console.log("Text data:", n.data);
          buf+=n.textContent;
        }, 
     H1: function H1(n) {
          buf+="\n# "+n.innerHTML.trim()+"\n\n";
        }, 
     H2: function H2(n) {
          buf+="\n## "+n.innerHTML.trim()+"\n\n";
        }, 
     H3: function H3(n) {
          buf+="\n### "+n.innerHTML.trim()+"\n\n";
        }, 
     H4: function H4(n) {
          buf+="\n#### "+n.innerHTML.trim()+"\n\n";
        }, 
     H5: function H5(n) {
          buf+="\n##### "+n.innerHTML.trim()+"\n\n";
        }, 
     IMG: function IMG(n) {
          buf+=`<!--$IMG${image_idgen++}-->`;
          buf+=n.outerHTML;
          buf+=`<!--/$IMG${image_idgen++}-->`;
          visit();
        }, 
     TABLE: function TABLE(n) {
          buf+=n.outerHTML;
          visit();
        }, 
     P: function P(n) {
          buf+="\n";
          visit();
        }, 
     BR: function BR(n) {
          buf+="\n";
        }, 
     A: function A(n) {
          buf+=`[${n.innerHTML}](${n.getAttribute("href")})`;
        }, 
     B: function B(n) {
          buf+="<b>";
          visit();
          buf+="</b>";
        }, 
     STRONG: function STRONG(n) {
          buf+="<strong>";
          visit();
          buf+="</strong>";
        }, 
     EM: function EM(n) {
          buf+="<em>";
          visit();
          buf+="</em>";
        }, 
     STRIKE: function STRIKE(n) {
          buf+="<strike>";
          visit();
          buf+="</strike>";
        }, 
     I: function I(n) {
          buf+="<i>";
          visit();
          buf+="</i>";
        }, 
     U: function U(n) {
          buf+="<u>";
          visit();
          buf+="</u>";
        }, 
     UL: function UL(n) {
          liststack.push(["UL", 0]);
          visit();
          liststack.pop();
        }, 
     OL: function OL(n) {
          liststack.push(["OL", 1]);
          visit();
          liststack.pop();
        }, 
     LI: function LI(n) {
          let head=getlist();
          if (head&&head[0]==="OL") {
              buf+=head[1]+".  ";
              head[1]++;
          }
          else {
            buf+="*  ";
          }
          visit();
        }, 
     PRE: function PRE(n) {
          let start=buf;
          visit();
          let data=buf.slice(start.length, buf.length);
          let lines=data.split("\n");
          let bad=false;
          for (let l of lines) {
              if (!l.startsWith("    ")) {
                  bad = true;
                  break;
              }
          }
          if (bad) {
              buf = start+"<pre>"+data+"</pre>\n";
          }
          else {
            buf = start+data;
          }
        }};
      let traverse=(n) =>        {
        visit = () =>          {
          for (let c of n.childNodes) {
              traverse(c);
          }
        }
        if (n.constructor.name==="Text") {
            handlers.TEXT(n);
        }
        else {
          let tag=n.tagName;
          if (tag in handlers) {
              handlers[tag](n);
          }
          else {
            visit();
          }
        }
      };
      traverse(this.contentDiv);
      return buf;
    }
     getDocPath() {
      if (!this.root.contentDocument) {
          return undefined;
      }
      let href=this.root.contentDocument.location.href;
      console.log(document.location.href, this.root.src);
      let path=relative(dirname(document.location.href), href).trim();
      while (path.startsWith("/")) {
        path = path.slice(1, path.length);
      }
      console.log(path, this._prefix);
      if (!path)
        return ;
      if (path.startsWith(this._prefix)) {
          path = path.slice(this._prefix.length, path.length).trim();
      }
      if (!path.startsWith("/")) {
          path = "/"+path;
      }
      return path;
    }
     save() {
      if (!this.contentDiv) {
          this.report("Save Error", "red");
          return ;
      }
      if (this.saveReq===2) {
          if (util.time_ms()-this.saveReqStart>13000) {
              this.saveReqStart = util.time_ms();
              this.saveReq = 1;
              console.log("save timeout");
          }
          else {
            return ;
          }
      }
      this.report("Saving...", "yellow", 400);
      let path=this.getDocPath();
      console.log("saving "+path);
      this.saveReq = 2;
      this.serverapi.updateDoc(path, this.contentDiv.innerHTML).then((result) =>        {
        this.saveReq = 0;
        console.log("Sucess! Saved document", result);
        if (result) {
            console.log("Server changed final document; reloading...");
            this.contentDiv.innerHTML = result;
        }
        this.report("Saved", "green", 750);
      }).catch((error) =>        {
        console.error(error);
      });
    }
     updateCurrentPath() {
      if (!this.contentDiv) {
          return ;
      }
      let href=this.root.contentDocument.location.href;
      href = relative(dirname(location.href), href).trim();
      if (href!==this.currentPath) {
          console.log("path change detected", href);
          this.history.push(href, href);
          this.currentPath = href;
      }
    }
     report(message, color=undefined, timeout=undefined) {
      if (this.ctx.report) {
          console.warn("%c"+message, "color : "+color+";");
          this.ctx.report(message, color, timeout);
      }
      else {
        console.warn("%c"+message, "color : "+color+";");
      }
    }
     update() {
      if (this.saveReq) {
          if (util.pollTimer(this._id, 500)) {
              this.report("saving...", "yellow", 400);
          }
      }
      this.updateCurrentPath();
      if (this._doDocInit&&this.root.contentDocument&&this.root.contentDocument.readyState==="complete") {
      }
      else 
        if (!this._doDocInit&&this.saveReq) {
          if (util.time_ms()-this._last_save>500) {
              this.save();
              this._last_save = util.time_ms();
          }
      }
    }
     setCSS() {
      this.style.width = "100%";
      this.style.height = "max-contents";
      this.root.style["background-color"] = "grey";
    }
    static  newSTRUCT() {
      return document.createElement("docs-browser-x");
    }
     loadSTRUCT(reader) {
      reader(this);
      this.doOnce(this.makeHeader);
      this.root.setAttribute("src", this.currentPath);
    }
    static  define() {
      return {tagname: "docs-browser-x", 
     style: "docsbrowser"}
    }
  }
  _ESClass.register(DocsBrowser);
  _es6_module.add_class(DocsBrowser);
  DocsBrowser = _es6_module.add_export('DocsBrowser', DocsBrowser);
  DocsBrowser.STRUCT = `
DocsBrowser {
  currentPath   : string;
  savedDocument : string;
  editMode      : bool;
  history       : DocHistory;
}
`;
  UIBase.register(DocsBrowser);
  nstructjs.register(DocsBrowser);
}, '/dev/fairmotion/src/path.ux/scripts/docbrowser/docbrowser.js');
es6_module_define('icon_enum', [], function _icon_enum_module(_es6_module) {
  "use strict";
  function setIconMap(icons) {
    for (let k in icons) {
        Icons[k] = icons[k];
    }
  }
  setIconMap = _es6_module.add_export('setIconMap', setIconMap);
  let Icons={HFLIP: 0, 
   TRANSLATE: 1, 
   ROTATE: 2, 
   HELP_PICKER: 3, 
   UNDO: 4, 
   REDO: 5, 
   CIRCLE_SEL: 6, 
   BACKSPACE: 7, 
   LEFT_ARROW: 8, 
   RIGHT_ARROW: 9, 
   UI_EXPAND: 10, 
   UI_COLLAPSE: 11, 
   FILTER_SEL_OPS: 12, 
   SCROLL_DOWN: 13, 
   SCROLL_UP: 14, 
   NOTE_EXCL: 15, 
   TINY_X: 16, 
   FOLDER: 17, 
   FILE: 18, 
   SMALL_PLUS: 19, 
   SMALL_MINUS: 20, 
   MAKE_SEGMENT: 21, 
   MAKE_POLYGON: 22, 
   FACE_MODE: 23, 
   EDGE_MODE: 24, 
   VERT_MODE: 25, 
   CURSOR_ARROW: 26, 
   TOGGLE_SEL_ALL: 27, 
   DELETE: 28, 
   RESIZE: 29, 
   Z_UP: 30, 
   Z_DOWN: 31, 
   SPLIT_EDGE: 32, 
   SHOW_ANIMPATHS: 33, 
   UNCHECKED: 34, 
   CHECKED: 35, 
   ENUM_UNCHECKED: 36, 
   ENUM_CHECKED: 37, 
   APPEND_VERTEX: 38, 
   LARGE_CHECK: 39, 
   BOLD: 40, 
   ITALIC: 41, 
   UNDERLINE: 42, 
   STRIKETHRU: 43, 
   TREE_EXPAND: 44, 
   TREE_COLLAPSE: 45, 
   ZOOM_OUT: 46, 
   ZOOM_IN: 47}
  Icons = _es6_module.add_export('Icons', Icons);
}, '/dev/fairmotion/src/path.ux/scripts/icon_enum.js');
es6_module_define('pathux', ["./util/image.js", "./widgets/ui_panel.js", "./widgets/ui_menu.js", "./widgets/ui_button.js", "./core/ui_base.js", "./widgets/ui_noteframe.js", "./screen/FrameManager.js", "./toolsys/toolprop.js", "./widgets/ui_textbox.js", "./curve/curve1d.js", "./widgets/ui_listbox.js", "./widgets/ui_widgets.js", "./util/events.js", "./util/parseutil.js", "./widgets/ui_widgets2.js", "./util/simple_events.js", "./widgets/theme_editor.js", "./widgets/ui_tabs.js", "./widgets/ui_curvewidget.js", "./widgets/ui_colorpicker2.js", "./util/math.js", "./toolsys/simple_toolsys.js", "./util/ScreenOverdraw.js", "./screen/ScreenArea.js", "./util/polyfill.js", "./widgets/ui_numsliders.js", "./util/graphpack.js", "./util/solver.js", "./controller/controller_ops.js", "./util/vectormath.js", "./widgets/ui_table.js", "./curve/curve1d_base.js", "./platforms/electron/electron_api.js", "./controller/controller.js", "./widgets/ui_treeview.js", "./controller/context.js", "./util/util.js", "./util/struct.js", "./util/html5_fileapi.js", "./config/const.js", "./widgets/ui_lasttool.js", "./toolsys/toolprop_abstract.js", "./core/ui_theme.js", "./widgets/ui_richedit.js", "./core/ui.js", "./controller/simple_controller.js"], function _pathux_module(_es6_module) {
  es6_import(_es6_module, './util/polyfill.js');
  var ___core_ui_base_js=es6_import(_es6_module, './core/ui_base.js');
  for (let k in ___core_ui_base_js) {
      _es6_module.add_export(k, ___core_ui_base_js[k], true);
  }
  var ___core_ui_js=es6_import(_es6_module, './core/ui.js');
  for (let k in ___core_ui_js) {
      _es6_module.add_export(k, ___core_ui_js[k], true);
  }
  var ___widgets_ui_widgets_js=es6_import(_es6_module, './widgets/ui_widgets.js');
  for (let k in ___widgets_ui_widgets_js) {
      _es6_module.add_export(k, ___widgets_ui_widgets_js[k], true);
  }
  var ___widgets_ui_widgets2_js=es6_import(_es6_module, './widgets/ui_widgets2.js');
  for (let k in ___widgets_ui_widgets2_js) {
      _es6_module.add_export(k, ___widgets_ui_widgets2_js[k], true);
  }
  var ___core_ui_theme_js=es6_import(_es6_module, './core/ui_theme.js');
  for (let k in ___core_ui_theme_js) {
      _es6_module.add_export(k, ___core_ui_theme_js[k], true);
  }
  var ___widgets_ui_button_js=es6_import(_es6_module, './widgets/ui_button.js');
  for (let k in ___widgets_ui_button_js) {
      _es6_module.add_export(k, ___widgets_ui_button_js[k], true);
  }
  var ___widgets_ui_richedit_js=es6_import(_es6_module, './widgets/ui_richedit.js');
  for (let k in ___widgets_ui_richedit_js) {
      _es6_module.add_export(k, ___widgets_ui_richedit_js[k], true);
  }
  var ___widgets_ui_curvewidget_js=es6_import(_es6_module, './widgets/ui_curvewidget.js');
  for (let k in ___widgets_ui_curvewidget_js) {
      _es6_module.add_export(k, ___widgets_ui_curvewidget_js[k], true);
  }
  var ___widgets_ui_panel_js=es6_import(_es6_module, './widgets/ui_panel.js');
  for (let k in ___widgets_ui_panel_js) {
      _es6_module.add_export(k, ___widgets_ui_panel_js[k], true);
  }
  var ___widgets_ui_colorpicker2_js=es6_import(_es6_module, './widgets/ui_colorpicker2.js');
  for (let k in ___widgets_ui_colorpicker2_js) {
      _es6_module.add_export(k, ___widgets_ui_colorpicker2_js[k], true);
  }
  var ___widgets_ui_tabs_js=es6_import(_es6_module, './widgets/ui_tabs.js');
  for (let k in ___widgets_ui_tabs_js) {
      _es6_module.add_export(k, ___widgets_ui_tabs_js[k], true);
  }
  var ___widgets_ui_listbox_js=es6_import(_es6_module, './widgets/ui_listbox.js');
  for (let k in ___widgets_ui_listbox_js) {
      _es6_module.add_export(k, ___widgets_ui_listbox_js[k], true);
  }
  var ___widgets_ui_menu_js=es6_import(_es6_module, './widgets/ui_menu.js');
  for (let k in ___widgets_ui_menu_js) {
      _es6_module.add_export(k, ___widgets_ui_menu_js[k], true);
  }
  var ___widgets_ui_table_js=es6_import(_es6_module, './widgets/ui_table.js');
  for (let k in ___widgets_ui_table_js) {
      _es6_module.add_export(k, ___widgets_ui_table_js[k], true);
  }
  var ___widgets_ui_noteframe_js=es6_import(_es6_module, './widgets/ui_noteframe.js');
  for (let k in ___widgets_ui_noteframe_js) {
      _es6_module.add_export(k, ___widgets_ui_noteframe_js[k], true);
  }
  var ___widgets_ui_numsliders_js=es6_import(_es6_module, './widgets/ui_numsliders.js');
  for (let k in ___widgets_ui_numsliders_js) {
      _es6_module.add_export(k, ___widgets_ui_numsliders_js[k], true);
  }
  var ___widgets_ui_lasttool_js=es6_import(_es6_module, './widgets/ui_lasttool.js');
  for (let k in ___widgets_ui_lasttool_js) {
      _es6_module.add_export(k, ___widgets_ui_lasttool_js[k], true);
  }
  var ___widgets_ui_textbox_js=es6_import(_es6_module, './widgets/ui_textbox.js');
  for (let k in ___widgets_ui_textbox_js) {
      _es6_module.add_export(k, ___widgets_ui_textbox_js[k], true);
  }
  var ___util_graphpack_js=es6_import(_es6_module, './util/graphpack.js');
  for (let k in ___util_graphpack_js) {
      _es6_module.add_export(k, ___util_graphpack_js[k], true);
  }
  var solver1=es6_import(_es6_module, './util/solver.js');
  var electron_api1=es6_import(_es6_module, './platforms/electron/electron_api.js');
  const electron_api=electron_api1;
  _es6_module.add_export('electron_api', electron_api);
  var ___platforms_electron_electron_api_js=es6_import(_es6_module, './platforms/electron/electron_api.js');
  for (let k in ___platforms_electron_electron_api_js) {
      _es6_module.add_export(k, ___platforms_electron_electron_api_js[k], true);
  }
  var ___widgets_theme_editor_js=es6_import(_es6_module, './widgets/theme_editor.js');
  for (let k in ___widgets_theme_editor_js) {
      _es6_module.add_export(k, ___widgets_theme_editor_js[k], true);
  }
  var ___widgets_ui_treeview_js=es6_import(_es6_module, './widgets/ui_treeview.js');
  for (let k in ___widgets_ui_treeview_js) {
      _es6_module.add_export(k, ___widgets_ui_treeview_js[k], true);
  }
  const solver=solver1;
  _es6_module.add_export('solver', solver);
  var math1=es6_import(_es6_module, './util/math.js');
  const math=math1;
  _es6_module.add_export('math', math);
  var ___screen_FrameManager_js=es6_import(_es6_module, './screen/FrameManager.js');
  for (let k in ___screen_FrameManager_js) {
      _es6_module.add_export(k, ___screen_FrameManager_js[k], true);
  }
  var util1=es6_import(_es6_module, './util/util.js');
  var vectormath1=es6_import(_es6_module, './util/vectormath.js');
  const util=util1;
  _es6_module.add_export('util', util);
  const vectormath=vectormath1;
  _es6_module.add_export('vectormath', vectormath);
  var ___util_vectormath_js=es6_import(_es6_module, './util/vectormath.js');
  for (let k in ___util_vectormath_js) {
      _es6_module.add_export(k, ___util_vectormath_js[k], true);
  }
  var ___toolsys_toolprop_js=es6_import(_es6_module, './toolsys/toolprop.js');
  for (let k in ___toolsys_toolprop_js) {
      _es6_module.add_export(k, ___toolsys_toolprop_js[k], true);
  }
  var toolprop_abstract1=es6_import(_es6_module, './toolsys/toolprop_abstract.js');
  const toolprop_abstract=toolprop_abstract1;
  _es6_module.add_export('toolprop_abstract', toolprop_abstract);
  var ___toolsys_simple_toolsys_js=es6_import(_es6_module, './toolsys/simple_toolsys.js');
  for (let k in ___toolsys_simple_toolsys_js) {
      _es6_module.add_export(k, ___toolsys_simple_toolsys_js[k], true);
  }
  var ___controller_controller_js=es6_import(_es6_module, './controller/controller.js');
  for (let k in ___controller_controller_js) {
      _es6_module.add_export(k, ___controller_controller_js[k], true);
  }
  var ___controller_controller_ops_js=es6_import(_es6_module, './controller/controller_ops.js');
  for (let k in ___controller_controller_ops_js) {
      _es6_module.add_export(k, ___controller_controller_ops_js[k], true);
  }
  var ___controller_simple_controller_js=es6_import(_es6_module, './controller/simple_controller.js');
  for (let k in ___controller_simple_controller_js) {
      _es6_module.add_export(k, ___controller_simple_controller_js[k], true);
  }
  var html5_fileapi1=es6_import(_es6_module, './util/html5_fileapi.js');
  const html5_fileapi=html5_fileapi1;
  _es6_module.add_export('html5_fileapi', html5_fileapi);
  var ___util_image_js=es6_import(_es6_module, './util/image.js');
  for (let k in ___util_image_js) {
      _es6_module.add_export(k, ___util_image_js[k], true);
  }
  var ___screen_ScreenArea_js=es6_import(_es6_module, './screen/ScreenArea.js');
  for (let k in ___screen_ScreenArea_js) {
      _es6_module.add_export(k, ___screen_ScreenArea_js[k], true);
  }
  var ___util_ScreenOverdraw_js=es6_import(_es6_module, './util/ScreenOverdraw.js');
  for (let k in ___util_ScreenOverdraw_js) {
      _es6_module.add_export(k, ___util_ScreenOverdraw_js[k], true);
  }
  var ___util_struct_js=es6_import(_es6_module, './util/struct.js');
  for (let k in ___util_struct_js) {
      _es6_module.add_export(k, ___util_struct_js[k], true);
  }
  var ___util_simple_events_js=es6_import(_es6_module, './util/simple_events.js');
  for (let k in ___util_simple_events_js) {
      _es6_module.add_export(k, ___util_simple_events_js[k], true);
  }
  var ___util_events_js=es6_import(_es6_module, './util/events.js');
  for (let k in ___util_events_js) {
      _es6_module.add_export(k, ___util_events_js[k], true);
  }
  var ___curve_curve1d_js=es6_import(_es6_module, './curve/curve1d.js');
  for (let k in ___curve_curve1d_js) {
      _es6_module.add_export(k, ___curve_curve1d_js[k], true);
  }
  var ___curve_curve1d_base_js=es6_import(_es6_module, './curve/curve1d_base.js');
  for (let k in ___curve_curve1d_base_js) {
      _es6_module.add_export(k, ___curve_curve1d_base_js[k], true);
  }
  var ___controller_context_js=es6_import(_es6_module, './controller/context.js');
  for (let k in ___controller_context_js) {
      _es6_module.add_export(k, ___controller_context_js[k], true);
  }
  var parseutil1=es6_import(_es6_module, './util/parseutil.js');
  const parseutil=parseutil1;
  _es6_module.add_export('parseutil', parseutil);
  var cconst1=es6_import_item(_es6_module, './config/const.js', 'default');
  const cconst=cconst1;
  _es6_module.add_export('cconst', cconst);
}, '/dev/fairmotion/src/path.ux/scripts/pathux.js');
es6_module_define('electron_api', ["../../config/const.js", "../../widgets/ui_menu.js", "../../core/ui_base.js"], function _electron_api_module(_es6_module) {
  "use strict";
  var Menu=es6_import_item(_es6_module, '../../widgets/ui_menu.js', 'Menu');
  var DropBox=es6_import_item(_es6_module, '../../widgets/ui_menu.js', 'DropBox');
  var getIconManager=es6_import_item(_es6_module, '../../core/ui_base.js', 'getIconManager');
  var cconst=es6_import_item(_es6_module, '../../config/const.js', 'default');
  let _menu_init=false;
  let _init=false;
  function patchDropBox() {
    DropBox.prototype._onpress = function _onpress(e) {
      if (this._menu!==undefined) {
          this._menu.close();
          this._menu = undefined;
          this._pressed = false;
          this._redraw();
          return ;
      }
      this._build_menu();
      let getCurrentWindow=require("electron").remote.getCurrentWindow, Menu=require("electron").remote.Menu, MenuItem=require("electron").remote.MenuItem;
      let emenu=buildElectronMenu(this._menu);
      this._menu.close = () =>        {
        emenu.closePopup(getCurrentWindow);
      }
      if (this._menu===undefined) {
          return ;
      }
      this._menu._dropbox = this;
      this.dom._background = this.getDefault("BoxDepressed");
      this._background = this.getDefault("BoxDepressed");
      this._redraw();
      this._pressed = true;
      this.setCSS();
      let onclose=this._menu.onclose;
      this._menu.onclose = () =>        {
        this._pressed = false;
        this._redraw();
        let menu=this._menu;
        if (menu) {
            this._menu = undefined;
            menu._dropbox = undefined;
        }
        if (onclose) {
            onclose.call(menu);
        }
      }
      let menu=this._menu;
      let screen=this.getScreen();
      let dpi=this.getDPI();
      let x=e.x, y=e.y;
      let rects=this.dom.getClientRects();
      x = rects[0].x;
      y = rects[0].y+Math.ceil(rects[0].height);
      x = ~~x;
      y = ~~y;
      emenu.popup({x: x, 
     y: y, 
     callback: () =>          {
          if (this._menu) {
              this._menu.onclose();
          }
        }});
    }
  }
  let on_tick=() =>    {
    let nativeTheme=require("electron").remote.nativeTheme;
    let mode=nativeTheme.shouldUseDarkColors ? "dark" : "light";
    if (mode!==cconst.colorSchemeType) {
        nativeTheme.themeSource = cconst.colorSchemeType;
    }
  }
  function checkInit() {
    if (window.haveElectron&&!_init) {
        _init = true;
        patchDropBox();
        setInterval(on_tick, 350);
    }
  }
  checkInit = _es6_module.add_export('checkInit', checkInit);
  let iconcache={}
  iconcache = _es6_module.add_export('iconcache', iconcache);
  function makeIconKey(icon, iconsheet, invertColors) {
    return ""+icon+":"+iconsheet+":"+invertColors;
  }
  function getNativeIcon(icon, iconsheet, invertColors) {
    if (iconsheet===undefined) {
        iconsheet = 0;
    }
    if (invertColors===undefined) {
        invertColors = false;
    }
    let icongen=require("./icogen.js");
    window.icongen = icongen;
    let nativeImage=require("electron").nativeImage;
    let manager=getIconManager();
    let sheet=manager.findSheet(iconsheet);
    let images=[];
    let sizes=icongen.GetRequiredICOImageSizes();
    if (1) {
        let size=16;
        let iconsheet=manager.findClosestSheet(size);
        let tilesize=manager.getTileSize(iconsheet);
        let canvas=document.createElement("canvas");
        canvas.width = canvas.height = size;
        let g=canvas.getContext("2d");
        if (invertColors) {
            g.filter = "invert(100%)";
        }
        let scale=size/tilesize;
        g.scale(scale, scale);
        let header="data:image/png;base64,";
        manager.canvasDraw({getDPI: () =>            {
            return 1.0;
          }}, canvas, g, icon, 0, 0, iconsheet);
        let data=canvas.toDataURL();
        data = data.slice(header.length, data.length);
        data = Buffer.from(data, "base64");
        require("fs").writeFileSync("myicon2.png", data);
        images.push(data);
    }
    return "myicon2.png";
    return icon;
    return undefined;
    window._icon = icon;
    return icon;
  }
  getNativeIcon = _es6_module.add_export('getNativeIcon', getNativeIcon);
  let map={CTRL: "Control", 
   ALT: "Alt", 
   SHIFT: "Shift", 
   COMMAND: "Command"}
  function buildElectronHotkey(hk) {
    hk = hk.trim().replace(/[ \t-]+/g, "+");
    for (let k in map) {
        hk = hk.replace(k, map[k]);
    }
    return hk;
  }
  buildElectronHotkey = _es6_module.add_export('buildElectronHotkey', buildElectronHotkey);
  function buildElectronMenu(menu) {
    let electron=require("electron").remote;
    let ElectronMenu=electron.Menu;
    let ElectronMenuItem=electron.MenuItem;
    let emenu=new ElectronMenu();
    let buildItem=(item) =>      {
      if (item._isMenu) {
          let menu2=item._menu;
          return new ElectronMenuItem({submenu: buildElectronMenu(item._menu), 
       label: menu2.getAttribute("title")});
      }
      let hotkey=item.hotkey;
      let icon=item.icon;
      let label=""+item.label;
      if (hotkey&&typeof hotkey!=="string") {
          hotkey = buildElectronHotkey(hotkey);
      }
      else {
        hotkey = ""+hotkey;
      }
      if (icon<0) {
          icon = undefined;
      }
      let args={id: ""+item._id, 
     label: label, 
     accelerator: hotkey, 
     icon: icon ? getNativeIcon(icon) : undefined, 
     click: function () {
          menu.onselect(item._id);
        }, 
     registerAccelerator: false}
      return new ElectronMenuItem(args);
    }
    for (let item of menu.items) {
        emenu.append(buildItem(item));
    }
    return emenu;
  }
  buildElectronMenu = _es6_module.add_export('buildElectronMenu', buildElectronMenu);
  function initMenuBar(menuEditor) {
    checkInit();
    if (!window.haveElectron) {
        return ;
    }
    if (_menu_init) {
        return ;
    }
    _menu_init = true;
    let electron=require("electron").remote;
    let win=electron.getCurrentWindow();
    let ElectronMenu=electron.Menu;
    let ElectronMenuItem=electron.MenuItem;
    let menu=new ElectronMenu();
    let _roles=new Set(["undo", "redo", "cut", "copy", "paste", "delete", "about", "quit", "open", "save", "load", "paste", "cut", "zoom"]);
    let roles={}
    for (let k of _roles) {
        roles[k] = k;
    }
    roles = Object.assign(roles, {"select all": "selectAll", 
    "file": "fileMenu", 
    "edit": "editMenu", 
    "view": "viewMenu", 
    "app": "appMenu", 
    "help": "help", 
    "zoom in": "zoomIn", 
    "zoom out": "zoomOut"});
    let header=menuEditor.header;
    for (let dbox of header.traverse(DropBox)) {
        dbox._build_menu();
        dbox.update();
        dbox._build_menu();
        let menu2=dbox._menu;
        menu2.ctx = dbox.ctx;
        menu2._init();
        menu2.update();
        let title=dbox._genLabel();
        let args={label: title, 
      tooltip: dbox.description, 
      submenu: buildElectronMenu(menu2)};
        menu.insert(0, new ElectronMenuItem(args));
    }
    ElectronMenu.setApplicationMenu(menu);
  }
  initMenuBar = _es6_module.add_export('initMenuBar', initMenuBar);
}, '/dev/fairmotion/src/path.ux/scripts/platforms/electron/electron_api.js');
es6_module_define('icogen', [], function _icogen_module(_es6_module) {
  "use strict";
  if (window.haveElectron) {
      let fs=require("fs");
      let path=require("path");
      let pngjsNozlib=require("pngjs-nozlib");
      let png=require("pngjs");
      const REQUIRED_IMAGE_SIZES=[16, 24, 32, 48, 64, 128, 256];
      const DEFAULT_FILE_NAME='app';
      const FILE_EXTENSION='.ico';
      const HEADER_SIZE=6;
      const DIRECTORY_SIZE=16;
      const BITMAPINFOHEADER_SIZE=40;
      const BI_RGB=0;
      const convertPNGtoDIB=(src, width, height, bpp) =>        {
        const cols=width*bpp;
        const rows=height*cols;
        const rowEnd=rows-cols;
        const dest=Buffer.alloc(src.length);
        for (let row=0; row<rows; row+=cols) {
            for (let col=0; col<cols; col+=bpp) {
                let pos=row+col;
                const r=src.readUInt8(pos);
                const g=src.readUInt8(pos+1);
                const b=src.readUInt8(pos+2);
                const a=src.readUInt8(pos+3);
                pos = rowEnd-row+col;
                dest.writeUInt8(b, pos);
                dest.writeUInt8(g, pos+1);
                dest.writeUInt8(r, pos+2);
                dest.writeUInt8(a, pos+3);
            }
        }
        return dest;
      };
      const createBitmapInfoHeader=(png, compression) =>        {
        const b=Buffer.alloc(BITMAPINFOHEADER_SIZE);
        b.writeUInt32LE(BITMAPINFOHEADER_SIZE, 0);
        b.writeInt32LE(png.width, 4);
        b.writeInt32LE(png.height*2, 8);
        b.writeUInt16LE(1, 12);
        b.writeUInt16LE(png.bpp*8, 14);
        b.writeUInt32LE(compression, 16);
        b.writeUInt32LE(png.data.length, 20);
        b.writeInt32LE(0, 24);
        b.writeInt32LE(0, 28);
        b.writeUInt32LE(0, 32);
        b.writeUInt32LE(0, 36);
        return b;
      };
      const createDirectory=(png, offset) =>        {
        const b=Buffer.alloc(DIRECTORY_SIZE);
        const size=png.data.length+BITMAPINFOHEADER_SIZE;
        const width=256<=png.width ? 0 : png.width;
        const height=256<=png.height ? 0 : png.height;
        const bpp=png.bpp*8;
        b.writeUInt8(width, 0);
        b.writeUInt8(height, 1);
        b.writeUInt8(0, 2);
        b.writeUInt8(0, 3);
        b.writeUInt16LE(1, 4);
        b.writeUInt16LE(bpp, 6);
        b.writeUInt32LE(size, 8);
        b.writeUInt32LE(offset, 12);
        return b;
      };
      const createFileHeader=(count) =>        {
        const b=Buffer.alloc(HEADER_SIZE);
        b.writeUInt16LE(0, 0);
        b.writeUInt16LE(1, 2);
        b.writeUInt16LE(count, 4);
        return b;
      };
      const checkOptions=(options) =>        {
        if (options) {
            return {name: typeof options.name==='string'&&options.name!=='' ? options.name : DEFAULT_FILE_NAME, 
        sizes: Array.isArray(options.sizes) ? options.sizes : REQUIRED_IMAGE_SIZES}
        }
        else {
          return {name: DEFAULT_FILE_NAME, 
       sizes: REQUIRED_IMAGE_SIZES}
        }
      };
      const GetRequiredICOImageSizes=() =>        {
        return REQUIRED_IMAGE_SIZES;
      };
      let stream=require("stream");
      class WriteStream extends stream.Writable {
         constructor() {
          super();
          this.data = [];
        }
         _write(chunk, encoding, cb) {
          let buf=chunk;
          if (!(__instance_of(buf, Buffer))) {
              Buffer.from(chunk, encoding);
          }
          for (let i=0; i<buf.length; i++) {
              this.data.push(buf[i]);
          }
          cb(null);
        }
         end() {
          this.data = Buffer.from(this.data);
          super.end();
        }
      }
      _ESClass.register(WriteStream);
      _es6_module.add_class(WriteStream);
      exports.GetRequiredICOImageSizes = GetRequiredICOImageSizes;
      const GenerateICO=(images, logger) =>        {
        if (logger===undefined) {
            logger = console;
        }
        logger.log('ICO:');
        const stream=new WriteStream();
        stream.write(createFileHeader(images.length), 'binary');
        let pngs=[];
        for (let image of images) {
            pngs.push(pngjsNozlib.PNG.sync.read(image));
        }
        let offset=HEADER_SIZE+DIRECTORY_SIZE*images.length;
        pngs.forEach((png) =>          {
          const directory=createDirectory(png, offset);
          stream.write(directory, 'binary');
          offset+=png.data.length+BITMAPINFOHEADER_SIZE;
        });
        pngs.forEach((png) =>          {
          const header=createBitmapInfoHeader(png, BI_RGB);
          stream.write(header, 'binary');
          const dib=convertPNGtoDIB(png.data, png.width, png.height, png.bpp);
          stream.write(dib, 'binary');
        });
        stream.end();
        return stream.data;
      };
      exports.GenerateICO = GenerateICO;
      let _default=GenerateICO;
      exports.default = _default;
  }
}, '/dev/fairmotion/src/path.ux/scripts/platforms/electron/icogen.js');
es6_module_define('AreaDocker', ["./area_wrangler.js", "./ScreenArea.js", "../util/struct.js", "../core/ui_base.js", "../core/ui.js", "../config/const.js", "../widgets/ui_menu.js", "../util/util.js"], function _AreaDocker_module(_es6_module) {
  var UIBase=es6_import_item(_es6_module, '../core/ui_base.js', 'UIBase');
  var saveUIData=es6_import_item(_es6_module, '../core/ui_base.js', 'saveUIData');
  var loadUIData=es6_import_item(_es6_module, '../core/ui_base.js', 'loadUIData');
  var util=es6_import(_es6_module, '../util/util.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var nstructjs=es6_import(_es6_module, '../util/struct.js');
  var Container=es6_import_item(_es6_module, '../core/ui.js', 'Container');
  var Area=es6_import_item(_es6_module, './ScreenArea.js', 'Area');
  var Icons=es6_import_item(_es6_module, '../core/ui_base.js', 'Icons');
  var startMenu=es6_import_item(_es6_module, '../widgets/ui_menu.js', 'startMenu');
  var getAreaIntName=es6_import_item(_es6_module, './area_wrangler.js', 'getAreaIntName');
  var setAreaTypes=es6_import_item(_es6_module, './area_wrangler.js', 'setAreaTypes');
  var AreaWrangler=es6_import_item(_es6_module, './area_wrangler.js', 'AreaWrangler');
  var areaclasses=es6_import_item(_es6_module, './area_wrangler.js', 'areaclasses');
  let ignore=0;
  window.testSnapScreenVerts = function (arg) {
    let screen=CTX.screen;
    screen.unlisten();
    screen.on_resize([screen.size[0]-75, screen.size[1]], screen.size);
    screen.on_resize = screen.updateSize = () =>      {    }
    let p=CTX.propsbar;
    p.pos[0]+=50;
    p.owning_sarea.loadFromPosSize();
    screen.regenBorders();
    screen.size[0] = window.innerWidth-5;
    screen.snapScreenVerts(arg);
  }
  class AreaDocker extends Container {
     constructor() {
      super();
      this.tbar = this.tabs();
      this.tbar.enableDrag();
      this.tbar.addEventListener("dragstart", (e) =>        {
        console.log("drag start", e);
        let name=this.tbar.tbar.tabs.active.name;
        let id=this.tbar.tbar.tabs.active._id;
        let sarea=this.getArea().owning_sarea;
        let area=this.getArea();
        this.ctx.screen.dragArea = [area, sarea];
        e.dataTransfer.setData("area", name+"|"+this._id);
        e.preventDefault();
      });
      this.tbar.addEventListener("dragover", (e) =>        {
        console.log("drag over");
        console.log(e.dataTransfer.getData("area"));
        let data=e.dataTransfer.getData("area");
        if (!data) {
            return ;
        }
        let area=this.ctx.screen.dragArea[0], sarea=this.ctx.screen.dragArea[1];
        if (!area||this.getArea()===area) {
            return ;
        }
        if (area.constructor.define().areaname in this.getArea().owning_sarea.editormap) {
            return ;
        }
        this.ctx.screen.dragArea[1] = this.getArea().owning_sarea;
        try {
          sarea.removeChild(area);
        }
        catch (error) {
            util.print_stack(error);
        }
        this.getArea().owning_sarea.appendChild(area);
        this.rebuild();
        e.preventDefault();
      });
      this.tbar.addEventListener("dragexit", (e) =>        {
        console.log("drag exit");
        console.log(e.dataTransfer.getData("area"));
        if (this.tbar.__fake) {
            this.tbar.removeTab(this.tbar.__fake);
            this.tbar.__fake = undefined;
        }
      });
      this.tbar.addEventListener("drop", (e) =>        {
        console.log("drop event", e);
        console.log(e.dataTransfer.getData("area"));
      });
      this.tbar.addEventListener("dragend", (e) =>        {
        console.log("drag end event", e);
        console.log(e.dataTransfer.getData("area"));
      });
      this.tbar.onchange = (tab) =>        {
        if (ignore) {
            return ;
        }
        if (!tab||!this.getArea()||!this.getArea().parentWidget) {
            return ;
        }
        if (tab.id==="add") {
            this.addTabMenu(tab);
            return ;
        }
        console.warn("CHANGE AREA", tab.id);
        let sarea=this.getArea().parentWidget;
        if (!sarea) {
            return ;
        }
        for (let area of sarea.editors) {
            if (area._id===tab.id&&area!==sarea.area) {
                let ud=saveUIData(this.tbar, "tabs");
                sarea.switch_editor(area.constructor);
                if (area.switcher) {
                    ignore++;
                    area.switcher.update();
                    try {
                      loadUIData(sarea.area.switcher.tbar, ud);
                    }
                    finally {
                        ignore = Math.max(ignore-1, 0);
                      }
                    area.switcher.rebuild();
                }
            }
        }
      };
    }
     addTabMenu(tab) {
      console.log("Add Tab!");
      let rect=tab.getClientRects()[0];
      let mpos=this.ctx.screen.mpos;
      let menu=document.createElement("menu-x");
      menu.closeOnMouseUp = false;
      menu.ctx = this.ctx;
      menu._init();
      let prop=Area.makeAreasEnum();
      let sarea=this.getArea().parentWidget;
      if (!sarea) {
          return ;
      }
      for (let k in Object.assign({}, prop.values)) {
          let ok=true;
          for (let area of sarea.editors) {
              if (area.constructor.define().uiname===k) {
                  ok = false;
              }
          }
          if (!ok) {
              continue;
          }
          let icon=prop.iconmap[k];
          menu.addItemExtra(k, prop.values[k], undefined, icon);
      }
      console.log(mpos[0], mpos[1], rect.x, rect.y);
      menu.onselect = (val) =>        {
        console.log("menu select", val, this.getArea().parentWidget);
        let sarea=this.getArea().parentWidget;
        if (sarea) {
            let cls=areaclasses[val];
            ignore++;
            let area, ud;
            try {
              ud = saveUIData(this.tbar, "tab");
              sarea.switchEditor(cls);
              console.log("switching", cls);
              area = sarea.area;
              area._init();
            }
            catch (error) {
                util.print_stack(error);
                throw error;
            }
            finally {
                ignore = Math.max(ignore-1, 0);
              }
            console.log("AREA", area.switcher, area);
            if (area.switcher) {
                ignore++;
                try {
                  area.parentWidget = sarea;
                  area.owning_sarea = sarea;
                  area.switcher.parentWidget = area;
                  area.switcher.ctx = area.ctx;
                  area.switcher._init();
                  area.switcher.update();
                  console.log("loading data", ud);
                  loadUIData(area.switcher.tbar, ud);
                  area.switcher.rebuild();
                  area.flushUpdate();
                }
                catch (error) {
                    throw error;
                }
                finally {
                    ignore = Math.max(ignore-1, 0);
                  }
            }
        }
      };
      startMenu(menu, mpos[0], rect.y, false, 0);
    }
     getArea() {
      let p=this;
      while (p&&!(__instance_of(p, Area))) {
        p = p.parentWidget;
      }
      return p;
    }
     _hash() {
      let area=this.getArea();
      if (!area)
        return ;
      let sarea=area.parentWidget;
      if (!sarea) {
          return ;
      }
      let hash="";
      for (let area2 of sarea.editors) {
          hash+=area2.tagName+":";
      }
      return hash+(sarea.area ? sarea.area.tagName : "");
    }
     rebuild() {
      console.log("rebuild");
      if (!this.getArea()||!this.getArea().parentWidget) {
          this._last_hash = undefined;
          this.tbar.clear();
          return ;
      }
      ignore++;
      let ud=saveUIData(this.tbar, "tbar");
      this.tbar.clear();
      let sarea=this.getArea().parentWidget;
      for (let area of sarea.editors) {
          let uiname=area.constructor.define().uiname;
          let tab=this.tbar.tab(uiname, area._id);
      }
      let tab=this.tbar.icontab(Icons.SMALL_PLUS, "add", "Add Editor", false);
      loadUIData(this.tbar, ud);
      let tc=this.tbar.getTabCount();
      this.tbar.moveTab(tab, tc-1);
      ignore = Math.max(ignore-1, 0);
    }
     update() {
      super.update();
      if (!this.ctx)
        return ;
      let area=this.getArea();
      if (!area)
        return ;
      let sarea=area.parentWidget;
      if (!sarea)
        return ;
      let hash=this._hash();
      if (hash!==this._last_hash) {
          this._last_hash = hash;
          this.rebuild();
      }
      if (this._last_hash) {
          this.tbar.setActive(this.getArea()._id);
      }
    }
     init() {
      super.init();
    }
    static  define() {
      return {tagname: "area-docker-x"}
    }
  }
  _ESClass.register(AreaDocker);
  _es6_module.add_class(AreaDocker);
  AreaDocker = _es6_module.add_export('AreaDocker', AreaDocker);
  UIBase.register(AreaDocker);
}, '/dev/fairmotion/src/path.ux/scripts/screen/AreaDocker.js');
es6_module_define('area_wrangler', ["../util/vectormath.js", "../core/ui_base.js", "../util/struct.js", "../widgets/ui_noteframe.js", "../util/util.js", "../util/simple_events.js", "../core/ui.js", "./FrameManager_mesh.js"], function _area_wrangler_module(_es6_module) {
  let _ScreenArea=undefined;
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var ui=es6_import(_es6_module, '../core/ui.js');
  var ui_noteframe=es6_import(_es6_module, '../widgets/ui_noteframe.js');
  var haveModal=es6_import_item(_es6_module, '../util/simple_events.js', 'haveModal');
  es6_import(_es6_module, '../util/struct.js');
  let UIBase=ui_base.UIBase;
  let Vector2=vectormath.Vector2;
  let ScreenClass=undefined;
  var snap=es6_import_item(_es6_module, './FrameManager_mesh.js', 'snap');
  var snapi=es6_import_item(_es6_module, './FrameManager_mesh.js', 'snapi');
  function setScreenClass(cls) {
    ScreenClass = cls;
  }
  setScreenClass = _es6_module.add_export('setScreenClass', setScreenClass);
  function getAreaIntName(name) {
    let hash=0;
    for (let i=0; i<name.length; i++) {
        let c=name.charCodeAt(i);
        if (i%2==0) {
            hash+=c<<8;
            hash*=13;
            hash = hash&((1<<15)-1);
        }
        else {
          hash+=c;
        }
    }
    return hash;
  }
  getAreaIntName = _es6_module.add_export('getAreaIntName', getAreaIntName);
  window.getAreaIntName = getAreaIntName;
  var AreaTypes={TEST_CANVAS_EDITOR: 0}
  AreaTypes = _es6_module.add_export('AreaTypes', AreaTypes);
  function setAreaTypes(def) {
    for (let k in AreaTypes) {
        delete AreaTypes[k];
    }
    for (let k in def) {
        AreaTypes[k] = def[k];
    }
  }
  setAreaTypes = _es6_module.add_export('setAreaTypes', setAreaTypes);
  let areaclasses={}
  areaclasses = _es6_module.add_export('areaclasses', areaclasses);
  class AreaWrangler  {
     constructor() {
      this.stacks = {};
      this.lasts = {};
      this.lastArea = undefined;
      this.stack = [];
      this.idgen = 0;
      this._last_screen_id = undefined;
    }
     _checkWrangler(ctx) {
      if (ctx===undefined) {
          return true;
      }
      if (this._last_screen_id===undefined) {
          this._last_screen_id = ctx.screen._id;
          return true;
      }
      if (ctx.screen._id!==this._last_screen_id) {
          this.reset();
          this._last_screen_id = ctx.screen._id;
          console.warn("contextWrangler detected a new screen; new file?");
          return false;
      }
      return true;
    }
     reset() {
      this.stacks = {};
      this.lasts = {};
      this.lastArea = undefined;
      this.stack = [];
      this._last_screen_id = undefined;
      return this;
    }
     push(type, area, pushLastRef=true) {
      if (pushLastRef||this.lasts[type.name]===undefined) {
          this.lasts[type.name] = area;
          this.lastArea = area;
      }
      if (!(type.name in this.stacks)) {
          this.stacks[type.name] = [];
      }
      this.stacks[type.name].push(area);
      this.stack.push(area);
    }
     pop(type, area) {
      if (!(type.name in this.stacks)) {
          console.warn("pop_ctx_area called in error");
          return ;
      }
      if (this.stacks[type.name].length>0) {
          this.stacks[type.name].pop();
      }
      if (this.stack.length>0) {
          this.stack.pop();
      }
    }
     getLastArea(type) {
      if (type===undefined) {
          if (this.stack.length>0) {
              return this.stack[this.stack.length-1];
          }
          else {
            return this.lastArea;
          }
      }
      else {
        if (type.name in this.stacks) {
            let stack=this.stacks[type.name];
            if (stack.length>0) {
                return stack[stack.length-1];
            }
        }
        return this.lasts[type.name];
      }
    }
  }
  _ESClass.register(AreaWrangler);
  _es6_module.add_class(AreaWrangler);
  AreaWrangler = _es6_module.add_export('AreaWrangler', AreaWrangler);
}, '/dev/fairmotion/src/path.ux/scripts/screen/area_wrangler.js');
es6_module_define('FrameManager', ["../widgets/ui_listbox.js", "../util/util.js", "../widgets/ui_tabs.js", "./ScreenArea.js", "../widgets/ui_panel.js", "../widgets/ui_widgets.js", "../widgets/ui_colorpicker2.js", "../util/vectormath.js", "../config/const.js", "../widgets/ui_menu.js", "../util/struct.js", "../widgets/ui_curvewidget.js", "../widgets/ui_noteframe.js", "../widgets/ui_widgets2.js", "../util/simple_events.js", "./FrameManager_mesh.js", "../widgets/ui_dialog.js", "../util/math.js", "../widgets/dragbox.js", "../widgets/ui_treeview.js", "../util/ScreenOverdraw.js", "../core/ui_base.js", "../widgets/ui_table.js", "./FrameManager_ops.js", "./AreaDocker.js"], function _FrameManager_module(_es6_module) {
  var ToolTipViewer=es6_import_item(_es6_module, './FrameManager_ops.js', 'ToolTipViewer');
  let _FrameManager=undefined;
  es6_import(_es6_module, '../widgets/dragbox.js');
  es6_import(_es6_module, '../widgets/ui_widgets2.js');
  es6_import(_es6_module, '../widgets/ui_panel.js');
  es6_import(_es6_module, '../widgets/ui_treeview.js');
  es6_import(_es6_module, '../util/ScreenOverdraw.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var haveModal=es6_import_item(_es6_module, '../util/simple_events.js', 'haveModal');
  var pushModalLight=es6_import_item(_es6_module, '../util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../util/simple_events.js', 'popModalLight');
  var _setScreenClass=es6_import_item(_es6_module, '../util/simple_events.js', '_setScreenClass');
  var util=es6_import(_es6_module, '../util/util.js');
  es6_import(_es6_module, '../widgets/ui_curvewidget.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var ScreenArea=es6_import(_es6_module, './ScreenArea.js');
  var FrameManager_ops=es6_import(_es6_module, './FrameManager_ops.js');
  var math=es6_import(_es6_module, '../util/math.js');
  var ui_menu=es6_import(_es6_module, '../widgets/ui_menu.js');
  es6_import(_es6_module, '../util/struct.js');
  var KeyMap=es6_import_item(_es6_module, '../util/simple_events.js', 'KeyMap');
  var HotKey=es6_import_item(_es6_module, '../util/simple_events.js', 'HotKey');
  var keymap=es6_import_item(_es6_module, '../util/simple_events.js', 'keymap');
  var AreaDocker=es6_import_item(_es6_module, './AreaDocker.js', 'AreaDocker');
  var snap=es6_import_item(_es6_module, './FrameManager_mesh.js', 'snap');
  var snapi=es6_import_item(_es6_module, './FrameManager_mesh.js', 'snapi');
  var ScreenBorder=es6_import_item(_es6_module, './FrameManager_mesh.js', 'ScreenBorder');
  var ScreenVert=es6_import_item(_es6_module, './FrameManager_mesh.js', 'ScreenVert');
  var ScreenHalfEdge=es6_import_item(_es6_module, './FrameManager_mesh.js', 'ScreenHalfEdge');
  let _ex_ScreenBorder=es6_import_item(_es6_module, './FrameManager_mesh.js', 'ScreenBorder');
  _es6_module.add_export('ScreenBorder', _ex_ScreenBorder, true);
  let _ex_ScreenVert=es6_import_item(_es6_module, './FrameManager_mesh.js', 'ScreenVert');
  _es6_module.add_export('ScreenVert', _ex_ScreenVert, true);
  let _ex_ScreenHalfEdge=es6_import_item(_es6_module, './FrameManager_mesh.js', 'ScreenHalfEdge');
  _es6_module.add_export('ScreenHalfEdge', _ex_ScreenHalfEdge, true);
  var theme=es6_import_item(_es6_module, '../core/ui_base.js', 'theme');
  var FrameManager_mesh=es6_import(_es6_module, './FrameManager_mesh.js');
  var makePopupArea=es6_import_item(_es6_module, '../widgets/ui_dialog.js', 'makePopupArea');
  let Area=ScreenArea.Area;
  es6_import(_es6_module, '../widgets/ui_widgets.js');
  es6_import(_es6_module, '../widgets/ui_tabs.js');
  es6_import(_es6_module, '../widgets/ui_colorpicker2.js');
  es6_import(_es6_module, '../widgets/ui_noteframe.js');
  es6_import(_es6_module, '../widgets/ui_listbox.js');
  es6_import(_es6_module, '../widgets/ui_table.js');
  var AreaFlags=es6_import_item(_es6_module, './ScreenArea.js', 'AreaFlags');
  function list(iter) {
    let ret=[];
    for (let item of iter) {
        ret.push(item);
    }
    return ret;
  }
  ui_menu.startMenuEventWrangling();
  let _events_started=false;
  function registerToolStackGetter(func) {
    FrameManager_ops.registerToolStackGetter(func);
  }
  registerToolStackGetter = _es6_module.add_export('registerToolStackGetter', registerToolStackGetter);
  window._nstructjs = nstructjs;
  let Vector2=vectormath.Vector2, UIBase=ui_base.UIBase, styleScrollBars=ui_base.styleScrollBars;
  let update_stack=new Array(8192);
  update_stack.cur = 0;
  let screen_idgen=0;
  class Screen extends ui_base.UIBase {
     constructor() {
      super();
      this.globalCSS = document.createElement("style");
      this.shadow.prepend(this.globalCSS);
      this._do_updateSize = true;
      this._resize_callbacks = [];
      this.allBordersMovable = cconst.DEBUG.allBordersMovable;
      this.needsBorderRegen = true;
      this._popup_safe = 0;
      this.testAllKeyMaps = false;
      this.needsTabRecalc = true;
      this._screen_id = screen_idgen++;
      this._popups = [];
      this._ctx = undefined;
      this.keymap = new KeyMap();
      this.size = new Vector2([window.innerWidth, window.innerHeight]);
      this.pos = new Vector2();
      this.idgen = 0;
      this.sareas = [];
      this.sareas.active = undefined;
      this.mpos = [0, 0];
      this.screenborders = [];
      this.screenverts = [];
      this._vertmap = {};
      this._edgemap = {};
      this._idmap = {};
      this._aabb = [new Vector2(), new Vector2()];
      this.shadow.addEventListener("mousemove", (e) =>        {
        let elem=this.pickElement(e.x, e.y, 1, 1, ScreenArea.ScreenArea);
        if (0) {
            let elem2=this.pickElement(e.x, e.y);
            console.log(elem2 ? elem2.tagName : undefined);
        }
        if (elem!==undefined) {
            if (elem.area) {
                elem.area.push_ctx_active();
                elem.area.pop_ctx_active();
            }
            this.sareas.active = elem;
        }
        this.mpos[0] = e.x;
        this.mpos[1] = e.y;
      });
      this.shadow.addEventListener("touchmove", (e) =>        {
        this.mpos[0] = e.touches[0].pageX;
        this.mpos[1] = e.touches[0].pageY;
      });
    }
     mergeGlobalCSS(style) {
      return new Promise((accept, reject) =>        {
        let sheet;
        let finish=() =>          {
          let sheet2=this.globalCSS.sheet;
          if (!sheet2) {
              this.doOnce(finish);
              return ;
          }
          let map={}
          for (let rule of sheet2.rules) {
              map[rule.selectorText] = rule;
          }
          for (let rule of sheet.rules) {
              let k=rule.selectorText;
              if (k in map) {
                  let rule2=map[k];
                  if (!rule.styleMap) {
                      for (let k in rule.style) {
                          let desc=Object.getOwnPropertyDescriptor(rule.style, k);
                          if (!desc||!desc.writable) {
                              continue;
                          }
                          let v=rule.style[k];
                          if (v) {
                              rule2.style[k] = rule.style[k];
                          }
                      }
                      continue;
                  }
                  for (let /*unprocessed ExpandNode*/[key, val] of list(rule.styleMap.entries())) {
                      if (1||rule2.styleMap.has(key)) {
                          let sval="";
                          if (Array.isArray(val)) {
                              for (let item of val) {
                                  sval+=" "+val;
                              }
                              sval = sval.trim();
                          }
                          else {
                            sval = (""+val).trim();
                          }
                          rule2.style[key] = sval;
                          rule2.styleMap.set(key, val);
                      }
                      else {
                        rule2.styleMap.append(key, val);
                      }
                  }
              }
              else {
                sheet2.insertRule(rule.cssText);
              }
          }
        }
        if (typeof style==="string") {
            try {
              sheet = new CSSStyleSheet();
            }
            catch (error) {
                sheet = undefined;
            }
            if (sheet&&sheet.replaceSync) {
                sheet.replaceSync(style);
                finish();
            }
            else {
              let tag=document.createElement("style");
              tag.textContent = style;
              document.body.appendChild(tag);
              let cb=() =>                {
                if (!tag.sheet) {
                    this.doOnce(cb);
                    return ;
                }
                sheet = tag.sheet;
                finish();
                tag.remove();
              };
              this.doOnce(cb);
            }
        }
        else 
          if (!(__instance_of(style, CSSStyleSheet))) {
            sheet = style.sheet;
            finish();
        }
        else {
          sheet = style;
          finish();
        }
      });
    }
     newScreenArea() {
      let ret=document.createElement("screenarea-x");
      ret.ctx = this.ctx;
      if (ret.ctx) {
          ret.init();
      }
      return ret;
    }
     copy() {
      let ret=document.createElement(this.constructor.define().tagname);
      ret.ctx = this.ctx;
      ret._init();
      for (let sarea of this.sareas) {
          let sarea2=sarea.copy(ret);
          sarea2._ctx = this.ctx;
          sarea2.screen = ret;
          sarea2.parentWidget = ret;
          ret.appendChild(sarea2);
      }
      for (let sarea of ret.sareas) {
          sarea.ctx = this.ctx;
          sarea.area.ctx = this.ctx;
          sarea.area.push_ctx_active();
          sarea._init();
          sarea.area._init();
          sarea.area.pop_ctx_active();
          for (let area of sarea.editors) {
              area.ctx = this.ctx;
              area.push_ctx_active();
              area._init();
              area.pop_ctx_active();
          }
      }
      ret.update();
      ret.regenBorders();
      ret.setCSS();
      return ret;
    }
     findScreenArea(x, y) {
      for (let i=this.sareas.length-1; i>=0; i--) {
          let sarea=this.sareas[i];
          let ok=x>=sarea.pos[0]&&x<=sarea.pos[0]+sarea.size[0];
          ok = ok&&(y>=sarea.pos[1]&&y<=sarea.pos[1]+sarea.size[1]);
          if (ok) {
              return sarea;
          }
      }
    }
     pickElement(x, y, sx, sy, nodeclass, excluded_classes) {

    }
     pickElement(x, y, args, sy, nodeclass, excluded_classes) {
      let sx;
      let clip;
      if (typeof args==="object") {
          sx = args.sx;
          sy = args.sy;
          nodeclass = args.nodeclass;
          excluded_classes = args.excluded_classes;
          clip = args.clip;
      }
      else {
        sx = args;
        args = {sx: sx, 
      sy: sy, 
      nodeclass: nodeclass, 
      excluded_classes: excluded_classes};
      }
      if (clip===undefined) {
          clip = args.clip = {pos: new Vector2(this.pos), 
       size: new Vector2(this.size)};
      }
      
      if (!this.ctx) {
          console.warn("no ctx in screen");
          return ;
      }
      let ret;
      for (let i=this._popups.length-1; i>=0; i--) {
          let popup=this._popups[i];
          ret = ret||popup.pickElement(x, y, args);
      }
      ret = ret||super.pickElement(x, y, args);
      return ret;
    }
     _enterPopupSafe() {
      if (this._popup_safe===undefined) {
          this._popup_safe = 0;
      }
      this._popup_safe++;
    }
    * _allAreas() {
      for (let sarea of this.sareas) {
          for (let area of sarea.editors) {
              yield [area, area._area_id, sarea];
          }
      }
    }
     _exitPopupSafe() {
      this._popup_safe = Math.max(this._popup_safe-1, 0);
    }
     popupMenu(menu, x, y) {
      let popup=this.popup(undefined, x, y, false);
      popup.add(menu);
      menu.start();
      return menu;
    }
     popup(owning_node, elem_or_x, y, closeOnMouseOut=true, popupDelay=250) {
      let ret=this._popup(...arguments);
      if (popupDelay===0) {
          return ret;
      }
      let z=ret.style["z-index"];
      ret.style["z-index"] = "-10";
      let cb=() =>        {
        let rect=ret.getClientRects()[0];
        let size=this.size;
        if (!rect) {
            this.doOnce(cb);
            return ;
        }
        console.log("rect", rect);
        if (rect.bottom>size[1]) {
            ret.style["top"] = (size[1]-rect.height-10)+"px";
        }
        else 
          if (rect.top<0) {
            ret.style["top"] = "10px";
        }
        if (rect.right>size[0]) {
            ret.style["left"] = (size[0]-rect.width-10)+"px";
        }
        else 
          if (rect.left<0) {
            ret.style["left"] = "10px";
        }
        ret.style["z-index"] = z;
      };
      setTimeout(cb, popupDelay);
      return ret;
    }
     draggablePopup(x, y) {
      let ret=document.createElement("drag-box-x");
      ret.ctx = this.ctx;
      ret.parentWidget = this;
      ret._init();
      this._popups.push(ret);
      ret._onend = () =>        {
        if (this._popups.indexOf(ret)>=0) {
            this._popups.remove(ret);
        }
      };
      ret.style["z-index"] = 205;
      ret.style["position"] = "absolute";
      ret.style["left"] = x+"px";
      ret.style["top"] = y+"px";
      document.body.appendChild(ret);
      return ret;
    }
     _popup(owning_node, elem_or_x, y, closeOnMouseOut=true) {
      let x;
      let sarea=this.sareas.active;
      let w=owning_node;
      while (w) {
        if (__instance_of(w, ScreenArea.ScreenArea)) {
            sarea = w;
            break;
        }
        w = w.parentWidget;
      }
      if (typeof elem_or_x==="object") {
          let r=elem_or_x.getClientRects()[0];
          x = r.x;
          y = r.y;
      }
      else {
        x = elem_or_x;
      }
      let container=document.createElement("container-x");
      container.ctx = this.ctx;
      container._init();
      let remove=container.remove;
      container.remove = () =>        {
        if (this._popups.indexOf(container)>=0) {
            this._popups.remove(container);
        }
        return remove.apply(container, arguments);
      };
      container.background = this.getDefault("BoxSubBG");
      container.style["position"] = "absolute";
      container.style["z-index"] = 205;
      container.style["left"] = x+"px";
      container.style["top"] = y+"px";
      container.style["margin"] = "0px";
      container.parentWidget = this;
      let mm=new math.MinMax(2);
      let p=new Vector2();
      let _update=container.update;
      document.body.appendChild(container);
      this.setCSS();
      this._popups.push(container);
      let touchpick, mousepick, keydown;
      let done=false;
      let end=() =>        {
        if (this._popup_safe) {
            return ;
        }
        if (done)
          return ;
        console.warn("container end");
        this.ctx.screen.removeEventListener("touchstart", touchpick, true);
        this.ctx.screen.removeEventListener("touchmove", touchpick, true);
        this.ctx.screen.removeEventListener("mousedown", mousepick, true);
        this.ctx.screen.removeEventListener("mousemove", mousepick, true);
        this.ctx.screen.removeEventListener("mouseup", mousepick, true);
        window.removeEventListener("keydown", keydown);
        done = true;
        container.remove();
      };
      container.end = end;
      let _remove=container.remove;
      container.remove = function () {
        if (arguments.length==0) {
            end();
        }
        _remove.apply(this, arguments);
      };
      container._ondestroy = () =>        {
        end();
      };
      let bad_time=util.time_ms();
      let last_pick_time=util.time_ms();
      mousepick = (e, x, y, do_timeout) =>        {
        if (do_timeout===undefined) {
            do_timeout = true;
        }
        if (sarea&&sarea.area) {
            sarea.area.push_ctx_active();
            sarea.area.pop_ctx_active();
        }
        if (util.time_ms()-last_pick_time<250) {
            return ;
        }
        last_pick_time = util.time_ms();
        x = x===undefined ? e.x : x;
        y = y===undefined ? e.y : y;
        let elem=this.pickElement(x, y, 2, 2, undefined, [ScreenBorder]);
        let startelem=elem;
        if (elem===undefined) {
            if (closeOnMouseOut) {
                end();
            }
            return ;
        }
        let ok=false;
        let elem2=elem;
        while (elem) {
          if (elem===container) {
              ok = true;
              break;
          }
          elem = elem.parentWidget;
        }
        if (!ok) {
            do_timeout = !do_timeout||(util.time_ms()-bad_time>100);
            if (closeOnMouseOut&&do_timeout) {
                end();
            }
        }
        else {
          bad_time = util.time_ms();
        }
      };
      touchpick = (e) =>        {
        let x=e.touches[0].pageX, y=e.touches[0].pageY;
        return mousepick(e, x, y, false);
      };
      keydown = (e) =>        {
        console.log(e.keyCode);
        switch (e.keyCode) {
          case keymap["Escape"]:
            end();
            break;
        }
      };
      this.ctx.screen.addEventListener("touchstart", touchpick, true);
      this.ctx.screen.addEventListener("touchmove", touchpick, true);
      this.ctx.screen.addEventListener("mousemove", mousepick, true);
      this.ctx.screen.addEventListener("mousedown", mousepick, true);
      this.ctx.screen.addEventListener("mouseup", mousepick, true);
      window.addEventListener("keydown", keydown);
      this.calcTabOrder();
      return container;
    }
     _recalcAABB(save=true) {
      let mm=new math.MinMax(2);
      for (let v of this.screenverts) {
          mm.minmax(v);
      }
      if (save) {
          this._aabb[0].load(mm.min);
          this._aabb[1].load(mm.max);
      }
      return [new Vector2(mm.min), new Vector2(mm.max)];
    }
    get  borders() {
      let this2=this;
      return (function* () {
        for (let k in this2._edgemap) {
            yield this2._edgemap[k];
        }
      })();
    }
     load() {

    }
     save() {

    }
     popupArea(area_class) {
      return makePopupArea(area_class, this);
    }
     remove(trigger_destroy=true) {
      this.unlisten();
      if (trigger_destroy) {
          return super.remove();
      }
      else {
        HTMLElement.prototype.remove.call(this);
      }
    }
     unlisten() {
      if (this.listen_timer!==undefined) {
          window.clearInterval(this.listen_timer);
          this.listen_timer = undefined;
      }
    }
     updateSize() {
      if (!cconst.autoSizeUpdate) {
          return ;
      }
      let width=window.innerWidth;
      let height=window.innerHeight;
      if (0) {
          width = window.screen.availWidth||window.screen.width;
          height = window.screen.availHeight||window.screen.height;
          let dpi=0.985/visualViewport.scale;
          width*=dpi*0.985;
          height*=dpi;
          width = ~~width;
          height = ~~height;
      }
      else {
      }
      let ratio=window.outerHeight/window.innerHeight;
      let scale=visualViewport.scale;
      let pad=4;
      width = visualViewport.width*scale-pad;
      height = visualViewport.height*scale-pad;
      let ox=visualViewport.offsetLeft;
      let oy=visualViewport.offsetTop;
      if (cconst.DEBUG.customWindowSize) {
          let s=cconst.DEBUG.customWindowSize;
          width = s.width;
          height = s.height;
          ox = 0;
          oy = 0;
          window._DEBUG = cconst.DEBUG;
      }
      let key=this._calcSizeKey(width, height, ox, oy, devicePixelRatio, scale);
      document.body.style.margin = document.body.style.padding = "0px";
      document.body.style["transform-origin"] = "top left";
      document.body.style["transform"] = `translate(${ox}px,${oy}px) scale(${1.0/scale})`;
      if (key!==this._last_ckey1) {
          console.log("resizing", key, this._last_ckey1);
          this._last_ckey1 = key;
          this.on_resize(this.size, [width, height], false);
          this.on_resize(this.size, this.size, false);
          let scale=visualViewport.scale;
          this.regenBorders();
          this.setCSS();
          this.completeUpdate();
      }
    }
     listen(args={updateSize: true}) {
      ui_menu.setWranglerScreen(this);
      let ctx=this.ctx;
      startEvents(() =>        {
        return ctx.screen;
      });
      if (this.listen_timer!==undefined) {
          return ;
      }
      this._do_updateSize = args.updateSize!==undefined ? args.updateSize : true;
      this.listen_timer = window.setInterval(() =>        {
        if (this.isDead()) {
            console.log("dead screen");
            this.unlisten();
            return ;
        }
        this.update();
      }, 150);
    }
     _calcSizeKey(w, h, x, y, dpi, scale) {
      if (arguments.length!==6) {
          throw new Error("eek");
      }
      let s="";
      for (let i=0; i<arguments.length; i++) {
          s+=arguments[i].toFixed(0)+":";
      }
      return s;
    }
     _ondestroy() {
      if (ui_menu.getWranglerScreen()===this) {
      }
      this.unlisten();
      let recurse=(n, second_pass, parent) =>        {
        if (n.__pass===second_pass) {
            console.warn("CYCLE IN DOM TREE!", n, parent);
            return ;
        }
        n.__pass = second_pass;
        n._forEachChildWidget((n2) =>          {
          if (n===n2)
            return ;
          recurse(n2, second_pass, n);
          try {
            if (!second_pass&&!n2.__destroyed) {
                n2.__destroyed = true;
                n2._ondestroy();
            }
          }
          catch (error) {
              print_stack(error);
              console.log("failed to exectue an ondestroy callback");
          }
          n2.__destroyed = true;
          try {
            if (second_pass) {
                n2.remove();
            }
          }
          catch (error) {
              print_stack(error);
              console.log("failed to remove element after ondestroy callback");
          }
        });
      };
      let id=~~(Math.random()*1024*1024);
      recurse(this, id);
      recurse(this, id+1);
    }
     destroy() {
      this._ondestroy();
    }
     clear() {
      this._ondestroy();
      this.sareas = [];
      this.sareas.active = undefined;
      for (let child of list(this.childNodes)) {
          child.remove();
      }
      for (let child of list(this.shadow.childNodes)) {
          child.remove();
      }
    }
     _test_save() {
      let obj=JSON.parse(JSON.stringify(this));
      console.log(JSON.stringify(this));
      this.loadJSON(obj);
    }
     loadJSON(obj, schedule_resize=false) {
      this.clear();
      super.loadJSON();
      for (let sarea of obj.sareas) {
          let sarea2=document.createElement("screenarea-x");
          sarea2.ctx = this.ctx;
          sarea2.screen = this;
          this.appendChild(sarea2);
          sarea2.loadJSON(sarea);
      }
      this.regenBorders();
      this.setCSS();
      if (schedule_resize) {
          window.setTimeout(() =>            {
            this.on_resize(this.size, [window.innerWidth, window.innerHeight]);
          }, 50);
      }
    }
    static  fromJSON(obj, schedule_resize=false) {
      let ret=document.createElement(this.define().tagname);
      return ret.loadJSON(obj, schedule_resize);
    }
     toJSON() {
      let ret={sareas: this.sareas};
      ret.size = this.size;
      ret.idgen = this.idgen;
      return Object.assign(super.toJSON(), ret);
    }
     getHotKey(toolpath) {
      let test=(keymap) =>        {
        for (let hk of keymap) {
            if (typeof hk.action!="string")
              continue;
            if (hk.action.trim().startsWith(toolpath.trim())) {
                return hk;
            }
        }
      };
      let ret=test(this.keymap);
      if (ret)
        return ret;
      if (this.sareas.active&&this.sareas.active.keymap) {
          let area=this.sareas.active.area;
          for (let keymap of area.getKeyMaps()) {
              ret = test(keymap);
              if (ret)
                return ret;
          }
      }
      if (ret===undefined) {
          for (let sarea of this.sareas) {
              let area=sarea.area;
              for (let keymap of area.getKeyMaps()) {
                  ret = test(keymap);
                  if (ret) {
                      return ret;
                  }
              }
          }
      }
      return undefined;
    }
     addEventListener(type, cb, options) {
      if (type==="resize") {
          this._resize_callbacks.push(cb);
      }
      else {
        return super.addEventListener(type, cb, options);
      }
    }
     removeEventListener(type, cb, options) {
      if (type==="resize") {
          if (this._resize_callbacks.indexOf(cb)>=0)
            this._resize_callbacks.remove(cb);
      }
      else {
        return super.removeEventListener(type, cb, options);
      }
    }
     execKeyMap(e) {
      let handled=false;
      console.warn("execKeyMap called", document.activeElement.tagName);
      if (this.sareas.active) {
          let area=this.sareas.active.area;
          if (!area) {
              console.warn("eek");
              return ;
          }
          for (let keymap of area.getKeyMaps()) {
              if (keymap===undefined) {
                  console.warn("eek!");
              }
              if (keymap.handle(this.ctx, e)) {
                  handled = true;
                  break;
              }
          }
      }
      handled = handled||this.keymap.handle(this.ctx, e);
      if (!handled&&this.testAllKeyMaps) {
          for (let sarea of this.sareas) {
              if (handled) {
                  break;
              }
              for (let keymap of sarea.area.getKeyMaps()) {
                  if (keymap.handle(this.ctx, e)) {
                      handled = true;
                      break;
                  }
              }
          }
      }
      return handled;
    }
    static  define() {
      return {tagname: "screen-x"}
    }
     calcTabOrder() {
      let nodes=[];
      let visit={};
      let rec=(n) =>        {
        let bad=n.tabIndex<0||n.tabIndex===undefined||n.tabIndex===null;
        bad = bad||!(__instance_of(n, UIBase));
        if (n._id in visit||n.hidden) {
            return ;
        }
        visit[n._id] = 1;
        if (!bad) {
            n.__pos = n.getClientRects()[0];
            if (n.__pos) {
                nodes.push(n);
            }
        }
        n._forEachChildWidget((n2) =>          {
          rec(n2);
        });
      };
      for (let sarea of this.sareas) {
          rec(sarea);
      }
      for (let popup of this._popups) {
          rec(popup);
      }
      for (let i=0; i<nodes.length; i++) {
          let n=nodes[i];
          n.tabIndex = i+1;
      }
    }
     drawUpdate() {
      if (window.redraw_all!==undefined) {
          window.redraw_all();
      }
    }
     update() {
      let move=[];
      for (let child of this.childNodes) {
          if (__instance_of(child, ScreenArea)) {
              move.push(child);
          }
      }
      for (let child of move) {
          console.warn("moved screen area to shadow");
          HTMLElement.prototype.remove.call(child);
          this.shadow.appendChild(child);
      }
      if (this._do_updateSize) {
          this.updateSize();
      }
      if (this.needsTabRecalc) {
          this.needsTabRecalc = false;
          this.calcTabOrder();
      }
      outer: for (let sarea of this.sareas) {
          for (let b of sarea._borders) {
              let movable=this.isBorderMovable(b);
              if (movable!==b.movable) {
                  console.log("detected change in movable borders");
                  this.regenBorders();
                  break outer;
              }
          }
      }
      if (this._update_gen) {
          let ret;
          try {
            ret = this._update_gen.next();
          }
          catch (error) {
              util.print_stack(error);
              console.log("error in update_intern tasklet");
              this._update_gen = undefined;
              return ;
          }
          if (ret!==undefined&&ret.done) {
              this._update_gen = undefined;
          }
      }
      else {
        this._update_gen = this.update_intern();
      }
    }
    get  ctx() {
      return this._ctx;
    }
    set  ctx(val) {
      this._ctx = val;
      let rec=(n) =>        {
        if (__instance_of(n, UIBase)) {
            n.ctx = val;
        }
        for (let n2 of n.childNodes) {
            rec(n2);
        }
        if (n.shadow) {
            for (let n2 of n.shadow.childNodes) {
                rec(n2);
            }
        }
      };
      for (let n of this.childNodes) {
          rec(n);
      }
      for (let n of this.shadow.childNodes) {
          rec(n);
      }
    }
     completeSetCSS() {
      let rec=(n) =>        {
        n.setCSS();
        n._forEachChildWidget((c) =>          {
          rec(c);
        });
      };
      rec(this);
    }
     completeUpdate() {
      for (let step of this.update_intern()) {

      }
    }
     updateScrollStyling() {
      let s=theme.scrollbars;
      if (!s)
        return ;
      let key=""+s.color+":"+s.color2+":"+s.border+":"+s.contrast+":"+s.width;
      if (key!==this._last_scrollstyle_key) {
          this._last_scrollstyle_key = key;
          this.mergeGlobalCSS(styleScrollBars(s.color, s.color2, s.contrast, s.width, s.border, "*"));
      }
    }
     update_intern() {
      this.updateScrollStyling();
      let popups=this._popups;
      let cssText="";
      let sheet=this.globalCSS.sheet;
      if (sheet) {
          for (let rule of sheet.rules) {
              cssText+=rule.cssText+"\n";
          }
          window.cssText = cssText;
      }
      let cssTextHash=util.strhash(cssText);
      if (this.needsBorderRegen) {
          this.needsBorderRegen = false;
          this.regenBorders();
      }
      super.update();
      let this2=this;
      for (let sarea of this.sareas) {
          sarea.ctx = this.ctx;
      }
      return (function* () {
        let stack=update_stack;
        stack.cur = 0;
        let lastn=this2;
        function push(n) {
          stack[stack.cur++] = n;
        }
        function pop(n) {
          if (stack.cur<0) {
              throw new Error("Screen.update(): stack overflow!");
          }
          return stack[--stack.cur];
        }
        let ctx=this2.ctx;
        let SCOPE_POP=Symbol("pop");
        let AREA_CTX_POP=Symbol("pop2");
        let scopestack=[];
        let areastack=[];
        let t=util.time_ms();
        push(this2);
        for (let p of popups) {
            push(p);
        }
        while (stack.cur>0) {
          let n=pop();
          if (n===undefined) {
              continue;
          }
          else 
            if (n===SCOPE_POP) {
              scopestack.pop();
              continue;
          }
          else 
            if (n===AREA_CTX_POP) {
              areastack.pop().pop_ctx_active(ctx, true);
              continue;
          }
          if (__instance_of(n, Area)) {
              areastack.push(n);
              n.push_ctx_active(ctx, true);
              push(AREA_CTX_POP);
          }
          if (!n.hidden&&n!==this2&&__instance_of(n, UIBase)) {
              n._ctx = ctx;
              if (n._screenStyleUpdateHash!==cssTextHash) {
                  n._screenStyleTag.textContent = cssText;
                  n._screenStyleUpdateHash = cssTextHash;
              }
              if (scopestack.length>0&&scopestack[scopestack.length-1]) {
                  n.parentWidget = scopestack[scopestack.length-1];
              }
              n.update();
          }
          if (util.time_ms()-t>20) {
              yield ;
              t = util.time_ms();
          }
          for (let n2 of n.childNodes) {
              push(n2);
          }
          if (n.shadow===undefined) {
              continue;
          }
          for (let n2 of n.shadow.childNodes) {
              push(n2);
          }
          if (__instance_of(n, UIBase)) {
              scopestack.push(n);
              push(SCOPE_POP);
          }
        }
      })();
    }
     loadFromVerts() {
      let old=[0, 0];
      for (let sarea of this.sareas) {
          old[0] = sarea.size[0];
          old[1] = sarea.size[1];
          sarea.loadFromVerts();
          sarea.on_resize(old);
          sarea.setCSS();
      }
      this.setCSS();
    }
     splitArea(sarea, t=0.5, horiz=true) {
      let w=sarea.size[0], h=sarea.size[1];
      let x=sarea.pos[0], y=sarea.size[1];
      let s1, s2;
      if (!horiz) {
          s1 = sarea;
          if (s1.ctx===undefined) {
              s1.ctx = this.ctx;
          }
          s2 = s1.copy(this);
          s1.size[0]*=t;
          s2.size[0]*=(1.0-t);
          s2.pos[0]+=w*t;
      }
      else {
        s1 = sarea;
        if (s1.ctx===undefined) {
            s1.ctx = this.ctx;
        }
        s2 = s1.copy(this);
        s1.size[1]*=t;
        s2.size[1]*=(1.0-t);
        s2.pos[1]+=h*t;
      }
      s2.ctx = this.ctx;
      this.appendChild(s2);
      s1.on_resize(s1.size);
      s2.on_resize(s2.size);
      this.regenBorders();
      this.solveAreaConstraints();
      s1.setCSS();
      s2.setCSS();
      this.setCSS();
      if (s2.area!==undefined)
        s2.area.onadd();
      return s2;
    }
     setCSS() {
      this.style["width"] = this.size[0]+"px";
      this.style["height"] = this.size[1]+"px";
      for (let key in this._edgemap) {
          let b=this._edgemap[key];
          b.setCSS();
      }
    }
     regenScreenMesh() {
      this.regenBorders();
    }
     regenBorders_stage2() {
      for (let b of this.screenborders) {
          b.halfedges = [];
      }
      function hashHalfEdge(border, sarea) {
        return border._id+":"+sarea._id;
      }
      function has_he(border, border2, sarea) {
        for (let he of border.halfedges) {
            if (border2===he.border&&sarea===he.sarea) {
                return true;
            }
        }
        return false;
      }
      for (let b1 of this.screenborders) {
          for (let sarea of b1.sareas) {
              let he=new ScreenHalfEdge(b1, sarea);
              b1.halfedges.push(he);
          }
          let axis=b1.horiz ? 1 : 0;
          let min=Math.min(b1.v1[axis], b1.v2[axis]);
          let max=Math.max(b1.v1[axis], b1.v2[axis]);
          for (let b2 of this.walkBorderLine(b1)) {
              if (b1===b2) {
                  continue;
              }
              let ok=b2.v1[axis]>=min&&b2.v1[axis]<=max;
              ok = ok||(b2.v2[axis]>=min&&b2.v2[axis]<=max);
              for (let sarea of b2.sareas) {
                  let ok2=ok&&!has_he(b2, b1, sarea);
                  if (ok2) {
                      let he2=new ScreenHalfEdge(b2, sarea);
                      b1.halfedges.push(he2);
                  }
              }
          }
      }
      for (let b of this.screenborders) {
          let movable=true;
          for (let sarea of b.sareas) {
              movable = movable&&this.isBorderMovable(b);
          }
          b.movable = movable;
      }
    }
     hasBorder(b) {
      return b._id in this._idmap;
    }
     killScreenVertex(v) {
      this.screenverts.remove(v);
      delete this._edgemap[ScreenVert.hash(v)];
      delete this._idmap[v._id];
      return this;
    }
     freeBorder(b, sarea) {
      if (b.sareas.indexOf(sarea)>=0) {
          b.sareas.remove(sarea);
      }
      let dels=[];
      for (let he of b.halfedges) {
          if (he.sarea===sarea) {
              dels.push([b, he]);
          }
          for (let he2 of he.border.halfedges) {
              if (he2===he)
                continue;
              if (he2.sarea===sarea) {
                  dels.push([he.border, he2]);
              }
          }
      }
      for (let d of dels) {
          if (d[0].halfedges.indexOf(d[1])<0) {
              console.warn("Double remove detected; use util.set?");
              continue;
          }
          d[0].halfedges.remove(d[1]);
      }
      if (b.sareas.length===0) {
          this.killBorder(b);
      }
    }
     killBorder(b) {
      console.log("killing border", b._id, b);
      if (this.screenborders.indexOf(b)<0) {
          console.log("unknown border", b);
          b.remove();
          return ;
      }
      this.screenborders.remove(b);
      let del=[];
      for (let he of b.halfedges) {
          if (he===he2)
            continue;
          for (let he2 of he.border.halfedges) {
              if (he2.border===b) {
                  del.push([he.border, he2]);
              }
          }
      }
      for (let d of del) {
          d[0].halfedges.remove(d[1]);
      }
      delete this._edgemap[ScreenBorder.hash(b.v1, b.v2)];
      delete this._idmap[b._id];
      b.v1.borders.remove(b);
      b.v2.borders.remove(b);
      if (b.v1.borders.length===0) {
          this.killScreenVertex(b.v1);
      }
      if (b.v2.borders.length===0) {
          this.killScreenVertex(b.v2);
      }
      b.remove();
      return this;
    }
     regenBorders() {
      for (let b of this.screenborders) {
          b.remove();
          HTMLElement.prototype.remove.call(b);
      }
      this._idmap = {};
      this.screenborders = [];
      this._edgemap = {};
      this._vertmap = {};
      this.screenverts = [];
      for (let sarea of this.sareas) {
          if (sarea.hidden)
            continue;
          sarea.makeBorders(this);
      }
      for (let key in this._edgemap) {
          let b=this._edgemap[key];
          b.setCSS();
      }
      this.regenBorders_stage2();
      this._recalcAABB();
      for (let b of this.screenborders) {
          b.outer = this.isBorderOuter(b);
          b.movable = this.isBorderMovable(b);
          b.setCSS();
      }
      this.updateDebugBoxes();
    }
     _get_debug_overlay() {
      if (!this._debug_overlay) {
          this._debug_overlay = document.createElement("overdraw-x");
          let s=this._debug_overlay;
          s.startNode(this, this);
      }
      return this._debug_overlay;
    }
     updateDebugBoxes() {
      if (cconst.DEBUG.screenborders) {
          let overlay=this._get_debug_overlay();
          overlay.clear();
          for (let b of this.screenborders) {
              overlay.line(b.v1, b.v2, "red");
          }
          let del=[];
          for (let child of document.body.childNodes) {
              if (child.getAttribute&&child.getAttribute("class")==="__debug") {
                  del.push(child);
              }
          }
          for (let n of del) {
              n.remove();
          }
          let box=(x, y, s, text, color) =>            {
            if (color===undefined) {
                color = "red";
            }
            x-=s*0.5;
            y-=s*0.5;
            x = Math.min(Math.max(x, 0.0), this.size[0]-s);
            y = Math.min(Math.max(y, 0.0), this.size[1]-s);
            let ret=document.createElement("div");
            ret.setAttribute("class", "__debug");
            ret.style["position"] = "absolute";
            ret.style["left"] = x+"px";
            ret.style["top"] = y+"px";
            ret.style["height"] = s+"px";
            ret.style["width"] = s+"px";
            ret.style["z-index"] = "1000";
            ret.style["pointer-events"] = "none";
            ret.style["padding"] = ret.style["margin"] = "0px";
            ret.style['display'] = "float";
            ret.style["background-color"] = color;
            document.body.appendChild(ret);
            let colors=["orange", "black", "white"];
            for (let i=2; i>=0; i--) {
                ret = document.createElement("div");
                ret.setAttribute("class", "__debug");
                ret.style["position"] = "absolute";
                ret.style["left"] = x+"px";
                ret.style["top"] = y+"px";
                ret.style["height"] = s+"px";
                ret.style["width"] = "250px";
                ret.style["z-index"] = ""+(1005-i-1);
                ret.style["pointer-events"] = "none";
                ret.style["color"] = colors[i];
                let w=(i)*2;
                ret.style["-webkit-text-stroke-width"] = w+"px";
                ret.style["-webkit-text-stroke-color"] = colors[i];
                ret.style["text-stroke-width"] = w+"px";
                ret.style["text-stroke-color"] = colors[i];
                ret.style["padding"] = ret.style["margin"] = "0px";
                ret.style['display'] = "float";
                ret.style["background-color"] = "rgba(0,0,0,0)";
                ret.innerText = ""+text;
                document.body.appendChild(ret);
            }
          };
          for (let v of this.screenverts) {
              box(v[0], v[1], 10*v.borders.length, ""+v.borders.length, "rgba(255,0,0,0.5)");
          }
          for (let b of this.screenborders) {
              for (let he of b.halfedges) {
                  let txt=`${he.side}, ${b.sareas.length}, ${b.halfedges.length}`;
                  let p=new Vector2(b.v1).add(b.v2).mulScalar(0.5);
                  let size=10*b.halfedges.length;
                  let wadd=25+size*0.5;
                  let axis=b.horiz&1;
                  if (p[axis]>he.sarea.pos[axis]) {
                      p[axis]-=wadd;
                  }
                  else {
                    p[axis]+=wadd;
                  }
                  box(p[0], p[1], size, txt, "rgba(155,255,75,0.5)");
              }
          }
      }
    }
     checkAreaConstraint(sarea, checkOnly=false) {
      let min=sarea.minSize, max=sarea.maxSize;
      let vs=sarea._verts;
      let chg=0.0;
      let mask=0;
      let moveBorder=(sidea, sideb, dh) =>        {
        let b1=sarea._borders[sidea];
        let b2=sarea._borders[sideb];
        let bad=0;
        for (let i=0; i<2; i++) {
            let b=i ? b2 : b1;
            let bad2=sarea.borderLock&(1<<sidea);
            bad2 = bad2||!b.movable;
            bad2 = bad2||this.isBorderOuter(b);
            if (bad2)
              bad|=1<<i;
        }
        if (bad===0) {
            this.moveBorder(b1, dh*0.5);
            this.moveBorder(b2, -dh*0.5);
        }
        else 
          if (bad===1) {
            this.moveBorder(b2, -dh);
        }
        else 
          if (bad===2) {
            this.moveBorder(b1, dh);
        }
        else 
          if (bad===3) {
            if (!this.isBorderOuter(b1)) {
                this.moveBorder(b1, dh);
            }
            else 
              if (!this.isBorderOuter(b2)) {
                this.moveBorder(b2, -dh);
            }
            else {
              this.moveBorder(b1, dh*0.5);
              this.moveBorder(b2, -dh*0.5);
            }
        }
      };
      if (max[0]!==undefined&&sarea.size[0]>max[0]) {
          let dh=(sarea.size[0]-max[0]);
          chg+=Math.abs(dh);
          mask|=1;
          moveBorder(0, 2, dh);
      }
      if (min[0]!==undefined&&sarea.size[0]<min[0]) {
          let dh=(min[0]-sarea.size[0]);
          chg+=Math.abs(dh);
          mask|=2;
          moveBorder(2, 0, dh);
      }
      if (max[1]!==undefined&&sarea.size[1]>max[1]) {
          let dh=(sarea.size[1]-max[1]);
          chg+=Math.abs(dh);
          mask|=4;
          moveBorder(3, 1, dh);
      }
      if (min[1]!==undefined&&sarea.size[1]<min[1]) {
          let dh=(min[1]-sarea.size[1]);
          chg+=Math.abs(dh);
          mask|=8;
          moveBorder(1, 3, dh);
      }
      if (sarea.pos[0]+sarea.size[0]>this.size[0]) {
          mask|=16;
          let dh=((this.size[0]-sarea.size[0])-sarea.pos[0]);
          chg+=Math.abs(dh);
          if (sarea.floating) {
              sarea.pos[0] = this.size[0]-sarea.size[0];
              sarea.loadFromPosSize();
          }
          else {
            this.moveBorder(sarea._borders[0], dh);
            this.moveBorder(sarea._borders[2], dh);
          }
      }
      if (chg===0.0) {
          return false;
      }
      return mask;
    }
     walkBorderLine(b) {
      let visit=new util.set();
      let ret=[b];
      visit.add(b);
      let rec=(b, v) =>        {
        for (let b2 of v.borders) {
            if (b2===b) {
                continue;
            }
            if (b2.horiz===b.horiz&&!visit.has(b2)) {
                visit.add(b2);
                ret.push(b2);
                rec(b2, b2.otherVertex(v));
            }
        }
      };
      rec(b, b.v1);
      let ret2=ret;
      ret = [];
      rec(b, b.v2);
      ret2.reverse();
      return ret2.concat(ret);
    }
     moveBorderWithoutVerts(halfedge, df) {
      let side=halfedge.side;
      let sarea=halfedge.sarea;
      switch (side) {
        case 0:
          sarea.pos[0]+=df;
          sarea.size[0]-=df;
          break;
        case 1:
          sarea.size[1]+=df;
          break;
        case 2:
          sarea.size[0]+=df;
          break;
        case 3:
          sarea.pos[1]+=df;
          sarea.size[1]-=df;
          break;
      }
    }
     moveBorder(b, df, strict=true) {
      return this.moveBorderSimple(b, df, strict);
    }
     moveBorderSimple(b, df, strict=true) {
      let axis=b.horiz&1;
      let axis2=axis^1;
      let min=Math.min(b.v1[axis2], b.v2[axis2]);
      let max=Math.max(b.v1[axis2], b.v2[axis2]);
      let test=(v) =>        {
        return v[axis2]>=min&&v[axis2]<=max;
      };
      let vs=new util.set();
      for (let b2 of this.walkBorderLine(b)) {
          if (strict&&!test(b2.v1)&&!test(b2.v2)) {
              return false;
          }
          vs.add(b2.v1);
          vs.add(b2.v2);
      }
      for (let v of vs) {
          v[axis]+=df;
      }
      for (let v of vs) {
          for (let b of v.borders) {
              for (let sarea of b.sareas) {
                  sarea.loadFromVerts();
              }
          }
      }
      return true;
    }
     moveBorderUnused(b, df, strict=true) {
      if (!b) {
          console.warn("missing border");
          return false;
      }
      let axis=b.horiz&1;
      let vs=new util.set();
      let visit=new util.set();
      let axis2=axis^1;
      let min=Math.min(b.v1[axis2], b.v2[axis2]);
      let max=Math.max(b.v1[axis2], b.v2[axis2]);
      let test=(v) =>        {
        return v[axis2]>=min&&v[axis2]<=max;
      };
      let first=true;
      let found=false;
      let halfedges=new util.set();
      let borders=new util.set();
      for (let b2 of this.walkBorderLine(b)) {
          if (!strict) {
              vs.add(b2.v1);
              vs.add(b2.v2);
              continue;
          }
          let t1=test(b2.v1), t2=test(b2.v2);
          if (!t1||!t2) {
              found = true;
              if (first) {
                  first = false;
                  df = Math.max(Math.abs(df), FrameManager_mesh.SnapLimit)*Math.sign(df);
              }
          }
          if (!t1&&!t2) {
              continue;
          }
          borders.add(b2);
          for (let sarea of b2.sareas) {
              halfedges.add(new ScreenHalfEdge(b2, sarea));
          }
          vs.add(b2.v1);
          vs.add(b2.v2);
      }
      for (let b2 of this.walkBorderLine(b)) {
          if (borders.has(b2)) {
              continue;
          }
          for (let he of b2.halfedges) {
              borders.remove(he.border);
              if (halfedges.has(he)) {
                  halfedges.remove(he);
              }
          }
      }
      for (let v of vs) {
          let ok=v[axis2]>=min&&v[axis2]<=max;
          if (!ok&&strict) {
          }
      }
      if (!found||!strict) {
          for (let v of vs) {
              v[axis]+=df;
          }
      }
      else {
        let borders=new util.set();
        for (let he of halfedges) {
            borders.add(he.border);
            this.moveBorderWithoutVerts(he, df);
        }
        for (let he of halfedges) {
            he.sarea.loadFromPosSize();
        }
        for (let b of borders) {
            let sareas=b.sareas.slice(0, b.sareas.length);
            this.killBorder(b);
            for (let sarea of sareas) {
                sarea.loadFromPosSize();
            }
        }
        return halfedges.length>0;
      }
      for (let sarea of b.sareas) {
          sarea.loadFromVerts();
      }
      for (let he of b.halfedges) {
          he.sarea.loadFromVerts();
          for (let sarea of he.border.sareas) {
              sarea.loadFromVerts();
              for (let b2 of sarea._borders) {
                  b2.setCSS();
              }
          }
      }
      b.setCSS();
      return true;
    }
     solveAreaConstraints(snapArgument=true) {
      let repeat=false;
      let found=false;
      let time=util.time_ms();
      for (let i=0; i<10; i++) {
          repeat = false;
          for (let sarea of this.sareas) {
              if (sarea.hidden)
                continue;
              repeat = repeat||this.checkAreaConstraint(sarea);
          }
          found = found||repeat;
          if (repeat) {
              for (let sarea of this.sareas) {
                  sarea.loadFromVerts();
              }
              this.snapScreenVerts(snapArgument);
          }
          else {
            break;
          }
      }
      if (found) {
          this.snapScreenVerts(snapArgument);
          if (cconst.DEBUG.areaConstraintSolver) {
              time = util.time_ms()-time;
              console.log(`enforced area constraint ${time.toFixed(2)}ms`);
          }
          this._recalcAABB();
          this.setCSS();
      }
    }
     snapScreenVerts(fitToSize=true) {
      let this2=this;
      function* screenverts() {
        for (let v of this2.screenverts) {
            let ok=0;
            for (let sarea of v.sareas) {
                if (!(sarea.flag&AreaFlags.INDEPENDENT)) {
                    ok = 1;
                }
            }
            if (ok) {
                yield v;
            }
        }
      }
      let mm=new math.MinMax(2);
      for (let v of screenverts()) {
          mm.minmax(v);
      }
      let min=mm.min, max=mm.max;
      if (fitToSize) {
          let vec=new Vector2(max).sub(min);
          let sz=new Vector2(this.size);
          sz.div(vec);
          for (let v of screenverts()) {
              v.sub(min).mul(sz);
          }
          this.pos.zero();
      }
      else {
        for (let v of screenverts()) {

        }
        [min, max] = this._recalcAABB();
        this.size.load(max).sub(min);
        this.pos.zero();
      }
      let found=1;
      for (let sarea of this.sareas) {
          if (sarea.hidden)
            continue;
          let old=new Vector2(sarea.size);
          let oldpos=new Vector2(sarea.pos);
          sarea.loadFromVerts();
          found = found||old.vectorDistance(sarea.size)>1;
          found = found||oldpos.vectorDistance(sarea.pos)>1;
          sarea.on_resize(old);
      }
      if (found) {
          this._recalcAABB();
          this.setCSS();
      }
    }
     on_resize(oldsize, newsize=this.size, _set_key=true) {
      console.warn("resizing");
      if (_set_key) {
          this._last_ckey1 = this._calcSizeKey(newsize[0], newsize[1], this.pos[0], this.pos[1], devicePixelRatio, visualViewport.scale);
      }
      let ratio=[newsize[0]/oldsize[0], newsize[1]/oldsize[1]];
      for (let v of this.screenverts) {
          v[0]*=ratio[0];
          v[1]*=ratio[1];
      }
      let min=[1e+17, 1e+17], max=[-1e+17, -1e+17];
      let olds=[];
      for (let sarea of this.sareas) {
          olds.push([sarea.size[0], sarea.size[1]]);
          sarea.loadFromVerts();
      }
      this.size[0] = newsize[0];
      this.size[1] = newsize[1];
      this.snapScreenVerts();
      this.solveAreaConstraints();
      this._recalcAABB();
      let i=0;
      for (let sarea of this.sareas) {
          sarea.on_resize(sarea.size, olds[i]);
          sarea.setCSS();
          i++;
      }
      this.regenBorders();
      this.setCSS();
      this.calcTabOrder();
      this._fireResizeCB(oldsize);
    }
     _fireResizeCB(oldsize=this.size) {
      for (let cb of this._resize_callbacks) {
          cb(oldsize);
      }
    }
     getScreenVert(pos, added_id="") {
      let key=ScreenVert.hash(pos, added_id);
      if (!(key in this._vertmap)) {
          let v=new ScreenVert(pos, this.idgen++, added_id);
          this._vertmap[key] = v;
          this._idmap[v._id] = v;
          this.screenverts.push(v);
      }
      return this._vertmap[key];
    }
     isBorderOuter(border) {
      let sides=0;
      for (let he of border.halfedges) {
          sides|=1<<he.side;
      }
      let bits=0;
      for (let i=0; i<4; i++) {
          bits+=(sides&(1<<i)) ? 1 : 0;
      }
      let ret=bits<2;
      let floating=false;
      for (let sarea of border.sareas) {
          floating = floating||sarea.floating;
      }
      if (floating) {
          let axis=border.horiz ? 1 : 0;
          ret = Math.abs(border.v1[axis]-this.pos[axis])<4;
          ret = ret||Math.abs(border.v1[axis]-this.pos[axis]-this.size[axis])<4;
      }
      border.outer = ret;
      return ret;
    }
     isBorderMovable(b, limit=5) {
      if (this.allBordersMovable)
        return true;
      for (let he of b.halfedges) {
          if (he.sarea.borderLock&(1<<he.side)) {
              return false;
          }
      }
      let ok=!this.isBorderOuter(b);
      for (let sarea of b.sareas) {
          if (sarea.floating) {
              ok = true;
              break;
          }
      }
      return ok;
    }
     getScreenBorder(sarea, v1, v2, side) {
      let suffix=sarea._get_v_suffix();
      if (!(__instance_of(v1, ScreenVert))) {
          v1 = this.getScreenVert(v1, suffix);
      }
      if (!(__instance_of(v2, ScreenVert))) {
          v2 = this.getScreenVert(v2, suffix);
      }
      let hash=ScreenBorder.hash(v1, v2);
      if (!(hash in this._edgemap)) {
          let sb=this._edgemap[hash] = document.createElement("screenborder-x");
          sb.screen = this;
          sb.v1 = v1;
          sb.v2 = v2;
          sb._id = this.idgen++;
          v1.borders.push(sb);
          v2.borders.push(sb);
          sb.ctx = this.ctx;
          this.screenborders.push(sb);
          this.appendChild(sb);
          sb.setCSS();
          this._edgemap[hash] = sb;
          this._idmap[sb._id] = sb;
      }
      return this._edgemap[hash];
    }
     minmaxArea(sarea, mm=undefined) {
      if (mm===undefined) {
          mm = new math.MinMax(2);
      }
      for (let b of sarea._borders) {
          mm.minmax(b.v1);
          mm.minmax(b.v2);
      }
      return mm;
    }
     areasBorder(sarea1, sarea2) {
      for (let b of sarea1._borders) {
          for (let sa of b.sareas) {
              if (sa===sarea2)
                return true;
          }
      }
      return false;
    }
     replaceArea(dst, src) {
      if (dst===src)
        return ;
      src.pos[0] = dst.pos[0];
      src.pos[1] = dst.pos[1];
      src.size[0] = dst.size[0];
      src.size[1] = dst.size[1];
      src.loadFromPosSize();
      if (this.sareas.indexOf(src)<0) {
          this.appendChild(src);
      }
      src.setCSS();
      this.removeArea(dst);
      this.regenScreenMesh();
      this.snapScreenVerts();
      this._updateAll();
    }
     _internalRegenAll() {
      this.snapScreenVerts();
      this._recalcAABB();
      this.calcTabOrder();
      this.setCSS();
    }
     _updateAll() {
      for (let sarea of this.sareas) {
          sarea.setCSS();
      }
      this.setCSS();
      this.update();
    }
     removeArea(sarea) {
      if (this.sareas.indexOf(sarea)<0) {
          console.warn(sarea, "<- Warning: tried to remove unknown area");
          return ;
      }
      this.sareas.remove(sarea);
      sarea.remove();
      for (let i=0; i<2; i++) {
          this.snapScreenVerts();
          this.regenScreenMesh();
      }
      this._updateAll();
      this.drawUpdate();
    }
     appendChild(child) {
      if (__instance_of(child, ScreenArea.ScreenArea)) {
          child.screen = this;
          child.ctx = this.ctx;
          child.parentWidget = this;
          this.sareas.push(child);
          if (child.size.dot(child.size)===0) {
              child.size[0] = this.size[0];
              child.size[1] = this.size[1];
          }
          if (!child._has_evts) {
              child._has_evts = true;
              let onfocus=(e) =>                {
                this.sareas.active = child;
              };
              let onblur=(e) =>                {
                if (this.sareas.active===child) {
                    this.sareas.active = undefined;
                }
              };
              child.addEventListener("focus", onfocus);
              child.addEventListener("mouseenter", onfocus);
              child.addEventListener("blur", onblur);
              child.addEventListener("mouseleave", onblur);
          }
          this.regenBorders();
          child.setCSS();
          this.drawUpdate();
          child._init();
      }
      return this.shadow.appendChild(child);
    }
     add(child) {
      return this.appendChild(child);
    }
     hintPickerTool() {
      (new FrameManager_ops.ToolTipViewer(this)).start();
    }
     splitTool() {
      console.log("screen split!");
      let tool=new FrameManager_ops.SplitTool(this);
      tool.start();
    }
     areaDragTool(sarea=this.sareas.active) {
      if (sarea===undefined) {
          console.warn("no active screen area");
          return ;
      }
      console.log("screen area drag!");
      let mpos=this.mpos;
      let tool=new FrameManager_ops.AreaDragTool(this, this.sareas.active, mpos);
      tool.start();
    }
     makeBorders() {
      for (let sarea of this.sareas) {
          sarea.makeBorders(this);
      }
    }
     on_keydown(e) {
      if (!haveModal()&&this.execKeyMap(e)) {
          e.preventDefault();
          return ;
      }
      if (!haveModal()&&this.sareas.active!==undefined&&this.sareas.active.on_keydown) {
          let area=this.sareas.active;
          return this.sareas.active.on_keydown(e);
      }
    }
     on_keyup(e) {
      if (!haveModal()&&this.sareas.active!==undefined&&this.sareas.active.on_keyup) {
          return this.sareas.active.on_keyup(e);
      }
    }
     on_keypress(e) {
      if (!haveModal()&&this.sareas.active!==undefined&&this.sareas.active.on_keypress) {
          return this.sareas.active.on_keypress(e);
      }
    }
     draw() {
      for (let sarea of this.sareas) {
          sarea.draw();
      }
    }
    static  newSTRUCT() {
      return document.createElement(this.define().tagname);
    }
     afterSTRUCT() {
      for (let sarea of this.sareas) {
          sarea._ctx = this.ctx;
          sarea.afterSTRUCT();
      }
    }
     loadSTRUCT(reader) {
      reader(this);
      this.size = new Vector2(this.size);
      let sareas=this.sareas;
      this.sareas = [];
      for (let sarea of sareas) {
          sarea.screen = this;
          sarea.parentWidget = this;
          this.appendChild(sarea);
      }
      this.regenBorders();
      this.setCSS();
      this.doOnce(() =>        {
        this.loadUIData(this.uidata);
        this.uidata = undefined;
      });
      return this;
    }
     test_struct() {
      let data=[];
      nstructjs.manager.write_object(data, this);
      data = new DataView(new Uint8Array(data).buffer);
      let screen2=nstructjs.manager.read_object(data, this.constructor);
      screen2.ctx = this.ctx;
      for (let sarea of screen2.sareas) {
          sarea.screen = screen2;
          sarea.ctx = this.ctx;
          sarea.area.ctx = this.ctx;
      }
      let parent=this.parentElement;
      this.remove();
      this.ctx.screen = screen2;
      parent.appendChild(screen2);
      screen2.regenBorders();
      screen2.update();
      screen2.listen();
      screen2.doOnce(() =>        {
        screen2.on_resize(screen2.size, [window.innerWidth, window.innerHeight]);
      });
      console.log(data);
      return screen2;
    }
     saveUIData() {
      try {
        return ui_base.saveUIData(this, "screen");
      }
      catch (error) {
          util.print_stack(error);
          console.log("Failed to save UI state data");
      }
    }
     loadUIData(str) {
      try {
        ui_base.loadUIData(this, str);
      }
      catch (error) {
          util.print_stack(error);
          console.log("Failed to load UI state data");
      }
    }
  }
  _ESClass.register(Screen);
  _es6_module.add_class(Screen);
  Screen = _es6_module.add_export('Screen', Screen);
  Screen.STRUCT = `
pathux.Screen { 
  size  : vec2;
  pos   : vec2;
  sareas : array(pathux.ScreenArea);
  idgen : int;
  uidata : string | obj.saveUIData();
}
`;
  nstructjs.manager.add_class(Screen);
  ui_base.UIBase.register(Screen);
  ScreenArea.setScreenClass(Screen);
  let get_screen_cb;
  function startEvents(getScreenFunc) {
    get_screen_cb = getScreenFunc;
    if (_events_started) {
        return ;
    }
    _events_started = true;
    window.addEventListener("keydown", (e) =>      {
      let screen=get_screen_cb();
      return screen.on_keydown(e);
    });
  }
  startEvents = _es6_module.add_export('startEvents', startEvents);
  _setScreenClass(Screen);
}, '/dev/fairmotion/src/path.ux/scripts/screen/FrameManager.js');
es6_module_define('FrameManager_mesh', ["../util/vectormath.js", "./FrameManager_ops.js", "../core/ui_base.js", "../config/const.js", "../util/struct.js"], function _FrameManager_mesh_module(_es6_module) {
  var nstructjs=es6_import(_es6_module, '../util/struct.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var FrameManager_ops=es6_import(_es6_module, './FrameManager_ops.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  let SnapLimit=1;
  SnapLimit = _es6_module.add_export('SnapLimit', SnapLimit);
  function snap(c, snap_limit) {
    if (snap_limit===undefined) {
        snap_limit = SnapLimit;
    }
    if (Array.isArray(c)) {
        for (let i=0; i<c.length; i++) {
            c[i] = Math.floor(c[i]/snap_limit)*snap_limit;
        }
    }
    else {
      c = Math.floor(c/snap_limit)*snap_limit;
    }
    return c;
  }
  snap = _es6_module.add_export('snap', snap);
  function snapi(c, snap_limit) {
    if (snap_limit===undefined) {
        snap_limit = SnapLimit;
    }
    if (Array.isArray(c)) {
        for (let i=0; i<c.length; i++) {
            c[i] = Math.ceil(c[i]/snap_limit)*snap_limit;
        }
    }
    else {
      c = Math.ceil(c/snap_limit)*snap_limit;
    }
    return c;
  }
  snapi = _es6_module.add_export('snapi', snapi);
  class ScreenVert extends Vector2 {
     constructor(pos, id, added_id) {
      super(pos);
      this.added_id = added_id;
      this.sareas = [];
      this.borders = [];
      this._id = id;
    }
    static  hash(pos, added_id) {
      let x=snap(pos[0]);
      let y=snap(pos[1]);
      return ""+x+":"+y+": + added_id";
    }
     valueOf() {
      return ScreenVert.hash(this, this.added_id);
    }
     [Symbol.keystr]() {
      return ScreenVert.hash(this, this.added_id);
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(ScreenVert);
  _es6_module.add_class(ScreenVert);
  ScreenVert = _es6_module.add_export('ScreenVert', ScreenVert);
  ScreenVert.STRUCT = `
pathux.ScreenVert {
  0 : float;
  1 : float;
}
`;
  nstructjs.register(ScreenVert);
  class ScreenHalfEdge  {
     constructor(border, sarea) {
      this.sarea = sarea;
      this.border = border;
      this.side = sarea._side(border);
    }
    get  v1() {
      return this.border.v1;
    }
    get  v2() {
      return this.border.v2;
    }
     [Symbol.keystr]() {
      return this.sarea._id+":"+this.border._id;
    }
  }
  _ESClass.register(ScreenHalfEdge);
  _es6_module.add_class(ScreenHalfEdge);
  ScreenHalfEdge = _es6_module.add_export('ScreenHalfEdge', ScreenHalfEdge);
  class ScreenBorder extends ui_base.UIBase {
     constructor() {
      super();
      this.visibleToPick = false;
      this.screen = undefined;
      this.v1 = undefined;
      this.v2 = undefined;
      this._id = undefined;
      this.outer = undefined;
      this.halfedges = [];
      this.sareas = [];
      this._innerstyle = document.createElement("style");
      this._style = undefined;
      this.shadow.appendChild(this._innerstyle);
      this.inner = document.createElement("div");
      this.shadow.appendChild(this.inner);
      this.addEventListener("mousedown", (e) =>        {
        console.log(this.sareas.length, this.sareas, "|||||");
        let ok=this.movable;
        if (!ok) {
            console.log("border is not movable");
            return ;
        }
        console.log("area resize start!");
        let tool=new FrameManager_ops.AreaResizeTool(this.screen, this, [e.x, e.y]);
        tool.start();
        e.preventDefault();
        e.stopPropagation();
      });
    }
    get  dead() {
      return !this.parentNode;
    }
    get  side() {
      throw new Error("side accedd");
    }
    set  side(val) {
      throw new Error("side accedd");
    }
    get  valence() {
      let ret=0;
      let horiz=this.horiz;
      let visit={};
      for (let i=0; i<2; i++) {
          let sv=i ? this.v2 : this.v1;
          for (let sa of sv.borders) {
              if (sa.horiz!=this.horiz)
                continue;
              if (sa._id in visit)
                continue;
              visit[sa._id] = 1;
              let a0x=Math.min(this.v1[0], this.v2[0]);
              let a0y=Math.min(this.v1[1], this.v2[1]);
              let a1x=Math.max(this.v1[0], this.v2[0]);
              let a1y=Math.max(this.v1[1], this.v2[1]);
              let b0x=Math.min(sa.v1[0], sa.v2[0]);
              let b0y=Math.min(sa.v1[1], sa.v2[1]);
              let b1x=Math.min(sa.v1[0], sa.v2[0]);
              let b1y=Math.min(sa.v1[1], sa.v2[1]);
              let ok;
              let eps=0.001;
              if (horiz) {
                  ok = (a0y<=b1y+eps&&a1y>=a0y-eps);
              }
              else {
                ok = (a0x<=b1x+eps&&a1x>=a0x-eps);
              }
              if (ok) {
                  ret+=sa.sareas.length;
              }
          }
      }
      return ret;
    }
     otherVertex(v) {
      if (v===this.v1)
        return this.v2;
      else 
        return this.v1;
    }
    get  horiz() {
      let dx=this.v2[0]-this.v1[0];
      let dy=this.v2[1]-this.v1[1];
      return Math.abs(dx)>Math.abs(dy);
    }
     setCSS() {
      this.style["pointer-events"] = this.movable ? "auto" : "none";
      if (this._style===undefined) {
          this._style = document.createElement("style");
          this.appendChild(this._style);
      }
      let pad=this.getDefault("ScreenBorderMousePadding");
      let wid=this.getDefault("ScreenBorderWidth");
      let v1=this.v1, v2=this.v2;
      let vec=new Vector2(v2).sub(v1);
      let x=Math.min(v1[0], v2[0]), y=Math.min(v1[1], v2[1]);
      let w, h;
      let cursor, bstyle;
      this.style["display"] = "flex";
      this.style["display"] = this.horiz ? "row" : "column";
      this.style["justify-content"] = "center";
      this.style["align-items"] = "center";
      if (!this.horiz) {
          this.style["padding-left"] = this.style["padding-right"] = pad+"px";
          x-=wid*0.5+pad;
          w = wid*2;
          h = Math.abs(vec[1]);
          cursor = 'e-resize';
          bstyle = "border-left-style : solid;\n    border-right-style : solid;\n";
          bstyle = "border-top-style : none;\n    border-bottom-style : none;\n";
      }
      else {
        this.style["padding-top"] = this.style["padding-bottom"] = pad+"px";
        y-=wid*0.5+pad;
        w = Math.abs(vec[0]);
        h = wid;
        cursor = 'n-resize';
        bstyle = "border-top-style : solid;\n    border-bottom-style : solid;\n";
      }
      let color=this.getDefault("ScreenBorderOuter");
      let debug=cconst.DEBUG.screenborders;
      if (debug) {
          wid = 4;
          let alpha=1.0;
          let c=this.sareas.length*75;
          let r=0, g=0, b=0;
          if (this.movable) {
              b = 255;
          }
          if (this.halfedges.length>1) {
              g = 255;
          }
          if (this.outer) {
              r = 255;
          }
          color = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      }
      let innerbuf=`
        .screenborder_inner_${this._id} {
          ${bstyle}
          ${this.horiz ? 'height' : 'width'} : ${wid}px;
          ${!this.horiz ? 'height' : 'width'} : 100%;
          margin : 0px;
          padding : 0px;
          
          background-color : ${this.getDefault("ScreenBorderInner")};
          border-color : ${color};
          border-width : ${wid*0.5}px;
          border-style : ${debug && this.outer ? "dashed" : "solid"};
          pointer-events : none;
        }`;
      let sbuf=`
        .screenborder_${this._id} {
        }
    `;
      let ok=this.movable;
      if (!this.outer) {
          for (let sarea of this.sareas) {
              ok = ok||sarea.floating;
          }
      }
      if (ok) {
          sbuf+=`
        .screenborder_${this._id}:hover {
          cursor : ${cursor};
        }
      `;
      }
      this._style.textContent = sbuf;
      this._innerstyle.textContent = innerbuf;
      this.setAttribute("class", "screenborder_"+this._id);
      this.inner.setAttribute("class", "screenborder_inner_"+this._id);
      this.style["position"] = "absolute";
      this.style["left"] = x+"px";
      this.style["top"] = y+"px";
      this.style["width"] = w+"px";
      this.style["height"] = h+"px";
      this.style["z-index"] = "25";
    }
    static  hash(v1, v2) {
      return Math.min(v1._id, v2._id)+":"+Math.max(v1._id, v2._id);
    }
     valueOf() {
      return ScreenBorder.hash(this.v1, this.v2);
    }
     [Symbol.keystr]() {
      return ScreenBorder.hash(this.v1, this.v2);
    }
    static  define() {
      return {tagname: "screenborder-x"}
    }
  }
  _ESClass.register(ScreenBorder);
  _es6_module.add_class(ScreenBorder);
  ScreenBorder = _es6_module.add_export('ScreenBorder', ScreenBorder);
  ui_base.UIBase.register(ScreenBorder);
}, '/dev/fairmotion/src/path.ux/scripts/screen/FrameManager_mesh.js');
es6_module_define('FrameManager_ops', ["../widgets/ui_widgets2.js", "../util/vectormath.js", "../util/simple_events.js", "../toolsys/simple_toolsys.js", "../core/ui_base.js", "../config/const.js", "../util/util.js"], function _FrameManager_ops_module(_es6_module) {
  "use strict";
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var simple_toolsys=es6_import(_es6_module, '../toolsys/simple_toolsys.js');
  var ToolTip=es6_import_item(_es6_module, '../widgets/ui_widgets2.js', 'ToolTip');
  let toolstack_getter=function () {
    throw new Error("must pass a toolstack getter to registerToolStackGetter, I know it's dumb");
  }
  function registerToolStackGetter(func) {
    toolstack_getter = func;
  }
  registerToolStackGetter = _es6_module.add_export('registerToolStackGetter', registerToolStackGetter);
  let Vector2=vectormath.Vector2, Vector3=vectormath.Vector3, UndoFlags=simple_toolsys.UndoFlags, ToolFlags=simple_toolsys.ToolFlags;
  var pushModalLight=es6_import_item(_es6_module, '../util/simple_events.js', 'pushModalLight');
  var popModalLight=es6_import_item(_es6_module, '../util/simple_events.js', 'popModalLight');
  var keymap=es6_import_item(_es6_module, '../util/simple_events.js', 'keymap');
  class ToolBase extends simple_toolsys.ToolOp {
     constructor(screen) {
      super();
      this.screen = screen;
      this._finished = false;
    }
     start() {
      this.modalStart(undefined);
    }
     cancel() {
      this.finish();
    }
     finish() {
      this._finished = true;
      this.overdraw.end();
      this.popModal(this.screen);
    }
     popModal() {
      console.log("popModal called");
      popModalLight(this.modaldata);
      this.modaldata = undefined;
    }
     modalStart(ctx) {
      this.ctx = ctx;
      if (this.modaldata!==undefined) {
          console.log("Error, modaldata was not undefined");
          popModalLight(this.modaldata);
      }
      this.overdraw = document.createElement("overdraw-x");
      this.overdraw.start(this.screen);
      let handlers={};
      let keys=Object.getOwnPropertyNames(this);
      for (let k in this.__proto__) {
          keys.push(k);
      }
      for (let k of Object.getOwnPropertyNames(this.__proto__)) {
          keys.push(k);
      }
      for (let k in this) {
          keys.push(k);
      }
      for (let k of keys) {
          if (k.startsWith("on")) {
              handlers[k] = this[k].bind(this);
          }
      }
      this.modaldata = pushModalLight(handlers);
    }
     on_mousemove(e) {

    }
     on_mouseup(e) {
      this.finish();
    }
     on_keydown(e) {
      console.log("s", e.keyCode);
      switch (e.keyCode) {
        case keymap.Escape:
          this.cancel();
          break;
        case keymap.Space:
        case keymap.Enter:
          this.finish();
          break;
      }
    }
  }
  _ESClass.register(ToolBase);
  _es6_module.add_class(ToolBase);
  ToolBase = _es6_module.add_export('ToolBase', ToolBase);
  class AreaResizeTool extends ToolBase {
     constructor(screen, border, mpos) {
      if (screen===undefined)
        screen = _appstate.screen;
      super(screen);
      this.start_mpos = new Vector2(mpos);
      this.sarea = border.sareas[0];
      if (!this.sarea||border.dead) {
          console.log(border.dead, border);
          throw new Error("border corruption");
      }
      this.screen = screen;
      this.side = this.sarea._side(border);
    }
    get  border() {
      return this.sarea._borders[this.side];
    }
    static  tooldef() {
      return {uiname: "Resize Area", 
     toolpath: "screen.area.resize", 
     icon: ui_base.Icons.RESIZE, 
     description: "change size of area", 
     is_modal: true, 
     hotkey: undefined, 
     undoflag: UndoFlags.NO_UNDO, 
     flag: 0, 
     inputs: {}, 
     outputs: {}}
    }
     getBorders() {
      let horiz=this.border.horiz;
      let ret=[];
      let visit=new Set();
      let rec=(v) =>        {
        if (visit.has(v._id)) {
            return ;
        }
        visit.add(v._id);
        for (let border of v.borders) {
            if (border.horiz==horiz&&!visit.has(border._id)) {
                visit.add(border._id);
                ret.push(border);
                rec(border.otherVertex(v));
            }
        }
      };
      rec(this.border.v1);
      rec(this.border.v2);
      return ret;
    }
     on_mouseup(e) {
      this.finish();
    }
     finish() {
      super.finish();
      this.screen.snapScreenVerts();
      this.screen.regenBorders();
      this.screen.snapScreenVerts();
      this.screen.loadFromVerts();
    }
     on_keydown(e) {
      switch (e.keyCode) {
        case keymap["Escape"]:
        case keymap["Enter"]:
        case keymap["Space"]:
          this.finish();
          break;
      }
    }
     on_mousemove(e) {
      let mpos=new Vector2([e.x, e.y]);
      mpos.sub(this.start_mpos);
      let axis=this.border.horiz ? 1 : 0;
      this.overdraw.clear();
      let visit=new Set();
      let borders=this.getBorders();
      let color=cconst.DEBUG.screenborders ? "rgba(1.0, 0.5, 0.0, 0.1)" : "rgba(1.0, 0.5, 0.0, 1.0)";
      let bad=false;
      for (let border of borders) {
          bad = bad||!this.screen.isBorderMovable(border);
          border.oldv1 = new Vector2(border.v1);
          border.oldv2 = new Vector2(border.v2);
      }
      if (bad) {
          console.log("border is not movable");
          return ;
      }
      let check=() =>        {
        let count=0;
        for (let sarea of this.screen.sareas) {
            if (sarea.size[0]<15||sarea.size[1]<15) {
                count++;
            }
        }
        return count;
      };
      let badcount=check();
      let snapMode=true;
      let df=mpos[axis];
      let border=this.border;
      this.screen.moveBorder(border, df, false);
      for (let border of borders) {
          if (border.outer) {
              snapMode = false;
          }
          this.overdraw.line(border.v1, border.v2, color);
      }
      this.start_mpos[0] = e.x;
      this.start_mpos[1] = e.y;
      this.screen.loadFromVerts();
      this.screen.setCSS();
      if (check()!=badcount) {
          console.log("bad");
          for (let border of borders) {
              border.v1.load(border.oldv1);
              border.v2.load(border.oldv2);
          }
      }
      this.screen.snapScreenVerts(snapMode);
      this.screen.loadFromVerts();
      this.screen.solveAreaConstraints(snapMode);
      this.screen.setCSS();
      this.screen.updateDebugBoxes();
      this.screen._fireResizeCB();
    }
  }
  _ESClass.register(AreaResizeTool);
  _es6_module.add_class(AreaResizeTool);
  AreaResizeTool = _es6_module.add_export('AreaResizeTool', AreaResizeTool);
  class SplitTool extends ToolBase {
     constructor(screen) {
      if (screen===undefined)
        screen = _appstate.screen;
      super(screen);
      this.done = false;
      this.screen = screen;
      this.ctx = screen.ctx;
      this.sarea = undefined;
      this.t = undefined;
      this.started = false;
    }
    static  tooldef() {
      return {uiname: "Split Area", 
     toolpath: "screen.area.split", 
     icon: ui_base.Icons.SMALL_PLUS, 
     description: "split an area in two", 
     is_modal: true, 
     hotkey: "BLEH-B", 
     undoflag: UndoFlags.NO_UNDO, 
     flag: 0, 
     inputs: {}, 
     outputs: {}}
    }
     modalStart(ctx) {
      if (this.started) {
          console.trace("double call to modalStart()");
          return ;
      }
      this.overdraw = document.createElement("overdraw-x");
      this.overdraw.start(this.screen);
      super.modalStart(ctx);
    }
     cancel() {
      return this.finish(true);
    }
     finish(canceled=false) {
      if (this.done) {
          return ;
      }
      this.done = true;
      this.overdraw.end();
      this.popModal(this.screen);
      if (canceled||!this.sarea) {
          return ;
      }
      let sarea=this.sarea, screen=this.screen;
      let t=this.t;
      screen.splitArea(sarea, t, this.horiz);
      screen._internalRegenAll();
    }
     on_mousemove(e) {
      let x=e.x, y=e.y;
      let screen=this.screen;
      let sarea=screen.findScreenArea(x, y);
      console.log(sarea, x, y);
      this.overdraw.clear();
      if (sarea!==undefined) {
          x = (x-sarea.pos[0])/(sarea.size[0]);
          y = (y-sarea.pos[1])/(sarea.size[1]);
          let dx=1.0-Math.abs(x-0.5);
          let dy=1.0-Math.abs(y-0.5);
          this.sarea = sarea;
          let horiz=this.horiz = dx<dy;
          if (horiz) {
              this.t = y;
              this.overdraw.line([sarea.pos[0], e.y], [sarea.pos[0]+sarea.size[0], e.y]);
          }
          else {
            this.t = x;
            this.overdraw.line([e.x, sarea.pos[1]], [e.x, sarea.pos[1]+sarea.size[1]]);
          }
      }
    }
     on_mousedown(e) {

    }
     on_mouseup(e) {
      this.finish();
      if (e.button) {
          this.stopPropagation();
          this.preventDefault();
      }
    }
     on_keydown(e) {
      console.log("s", e.keyCode);
      switch (e.keyCode) {
        case keymap.Escape:
          this.cancel();
          break;
        case keymap.Space:
        case keymap.Enter:
          this.finish();
          break;
      }
    }
  }
  _ESClass.register(SplitTool);
  _es6_module.add_class(SplitTool);
  SplitTool = _es6_module.add_export('SplitTool', SplitTool);
  class AreaDragTool extends ToolBase {
     constructor(screen, sarea, mpos) {
      if (screen===undefined)
        screen = _appstate.screen;
      super(screen);
      this.cursorbox = undefined;
      this.boxes = [];
      this.boxes.active = undefined;
      this.sarea = sarea;
      this.start_mpos = new Vector2(mpos);
      this.screen = screen;
    }
    static  tooldef() {
      return {uiname: "Drag Area", 
     toolpath: "screen.area.drag", 
     icon: ui_base.Icons.TRANSLATE, 
     description: "move or duplicate area", 
     is_modal: true, 
     hotkey: undefined, 
     undoflag: UndoFlags.NO_UNDO, 
     flag: 0, 
     inputs: {}, 
     outputs: {}}
    }
     finish() {
      super.finish();
      this.screen.regenBorders();
      this.screen.solveAreaConstraints();
      this.screen.snapScreenVerts();
      this.screen._recalcAABB();
      console.log("tool finish");
    }
     getBoxRect(b) {
      let sa=b.sarea;
      let pos, size;
      if (b.horiz==-1) {
          pos = sa.pos;
          size = sa.size;
      }
      else 
        if (b.horiz) {
          if (b.side=='b') {
              pos = [sa.pos[0], sa.pos[1]+sa.size[1]*b.t];
              size = [sa.size[0], sa.size[1]*(1.0-b.t)];
          }
          else {
            pos = [sa.pos[0], sa.pos[1]];
            size = [sa.size[0], sa.size[1]*b.t];
          }
      }
      else {
        if (b.side=='r') {
            pos = [sa.pos[0]+sa.size[0]*b.t, sa.pos[1]];
            size = [sa.size[0]*(1.0-b.t), sa.size[1]];
        }
        else {
          pos = [sa.pos[0], sa.pos[1]];
          size = [sa.size[0]*b.t, sa.size[1]];
        }
      }
      let color="rgba(100, 100, 100, 0.2)";
      let ret=this.overdraw.rect(pos, size, color);
      ret.style["pointer-events"] = "none";
      return ret;
    }
     doSplit(b) {
      if (this.sarea) {
          return this.doSplitDrop(b);
      }
      let src=this.sarea, dst=b.sarea;
      let screen=this.screen;
      let t=b.t;
      screen.splitArea(dst, t, b.horiz);
      screen._internalRegenAll();
    }
     doSplitDrop(b) {
      if (b.horiz==-1&&b.sarea===this.sarea) {
          return ;
      }
      console.log("BBBB", b.horiz, b.sarea===this.sarea, b);
      let can_rip=false;
      let sa=this.sarea;
      let screen=this.screen;
      can_rip = sa.size[0]==screen.size[0]||sa.size[1]==screen.size[1];
      can_rip = can_rip&&b.sarea!==sa;
      can_rip = can_rip&&(b.horiz==-1||!screen.areasBorder(sa, b.sarea));
      let expand=b.horiz==-1&&b.sarea!==sa&&screen.areasBorder(b.sarea, sa);
      can_rip = can_rip||expand;
      console.log("can_rip:", can_rip, expand);
      if (can_rip) {
          screen.removeArea(sa);
          screen.snapScreenVerts();
      }
      if (b.horiz==-1) {
          let src=this.sarea, dst=b.sarea;
          if (can_rip) {
              let mm;
              if (expand) {
                  mm = screen.minmaxArea(src);
                  screen.minmaxArea(dst, mm);
              }
              console.log("replacing. . .", expand);
              screen.replaceArea(dst, src);
              if (expand) {
                  console.log("\nEXPANDING:", src.size[0], src.size[1]);
                  src.pos[0] = mm.min[0];
                  src.pos[1] = mm.min[1];
                  src.size[0] = mm.max[0]-mm.min[0];
                  src.size[1] = mm.max[1]-mm.min[1];
                  src.loadFromPosSize();
                  screen._internalRegenAll();
              }
          }
          else {
            screen.replaceArea(dst, src.copy());
            screen._internalRegenAll();
          }
      }
      else {
        let src=this.sarea, dst=b.sarea;
        let t=b.t;
        let nsa=screen.splitArea(dst, t, b.horiz);
        if (can_rip) {
            screen.replaceArea(nsa, src);
        }
        else {
          screen.replaceArea(nsa, src.copy());
        }
        screen._internalRegenAll();
      }
    }
     makeBoxes(sa) {
      let sz=util.isMobile() ? 100 : 40;
      let cx=sa.pos[0]+sa.size[0]*0.5;
      let cy=sa.pos[1]+sa.size[1]*0.5;
      let color=this.color = "rgba(200, 200, 200, 0.55)";
      let hcolor=this.hcolor = "rgba(230, 230, 230, 0.75)";
      let idgen=0;
      let boxes=this.boxes;
      let box=(x, y, sz, horiz, t, side) =>        {
        let b=this.overdraw.rect([x-sz[0]*0.5, y-sz[1]*0.5], sz, color);
        boxes.push(b);
        b.sarea = sa;
        let style=document.createElement("style");
        let cls=`mybox_${idgen++}`;
        b.horiz = horiz;
        b.t = t;
        b.side = side;
        b.setAttribute("class", cls);
        b.setAttribute("is_box", true);
        b.addEventListener("mousemove", this.on_mousemove.bind(this));
        let onclick=b.onclick = (e) =>          {
          let type=e.type.toLowerCase();
          if ((e.type=="mousedown"||e.type=="mouseup")&&e.button!=0) {
              return ;
          }
          console.log("split click");
          if (!this._finished) {
              this.finish();
              this.doSplit(b);
              e.preventDefault();
              e.stopPropagation();
          }
        }
        b.addEventListener("click", onclick);
        b.addEventListener("mousedown", onclick);
        b.addEventListener("mouseup", onclick);
        b.addEventListener("mouseenter", (e) =>          {
          console.log("mouse enter box");
          if (this.curbox!==undefined) {
              if (this.curbox.rect) {
                  this.curbox.rect.remove();
                  this.curbox.rect = undefined;
              }
          }
          if (b.rect!==undefined) {
              b.rect.remove();
              b.rect = undefined;
          }
          b.rect = this.getBoxRect(b);
          this.curbox = b;
          console.log("setting hcolor");
          b.setColor(hcolor);
        });
        b.addEventListener("mouseleave", (e) =>          {
          console.log("mouse leave box");
          if (b.rect) {
              b.rect.remove();
              b.rect = undefined;
          }
          if (this.curbox===b) {
              this.curbox = undefined;
          }
          b.setColor(color);
        });
        style.textContent = `
        .${cls}:hover {
          background-color : orange;
          fill:orange;stroke-width:2
        }
      `;
        b.appendChild(style);
        b.setAttribute("class", cls);
        return b;
      };
      let pad=5;
      if (this.sarea) {
          box(cx, cy, [sz, sz], -1, -1, -1);
      }
      box(cx-sz*0.75-pad, cy, [sz*0.5, sz], false, 0.5, 'l');
      box(cx-sz*1.2-pad, cy, [sz*0.25, sz], false, 0.3, 'l');
      box(cx+sz*0.75+pad, cy, [sz*0.5, sz], false, 0.5, 'r');
      box(cx+sz*1.2+pad, cy, [sz*0.25, sz], false, 0.7, 'r');
      box(cx, cy-sz*0.75-pad, [sz, sz*0.5], true, 0.5, 't');
      box(cx, cy-sz*1.2-pad, [sz, sz*0.25], true, 0.3, 't');
      box(cx, cy+sz*0.75+pad, [sz, sz*0.5], true, 0.5, 'b');
      box(cx, cy+sz*1.2+pad, [sz, sz*0.25], true, 0.7, 'b');
    }
     getActiveBox(x, y) {
      for (let n of this.boxes) {
          if (n.hasAttribute&&n.hasAttribute("is_box")) {
              let rect=n.getClientRects()[0];
              if (x>=rect.x&&y>=rect.y&&x<rect.x+rect.width&&y<rect.y+rect.height) {
                  return n;
              }
          }
      }
    }
     on_drag(e) {
      this.on_mousemove(e);
    }
     on_dragend(e) {
      this.on_mouseup(e);
    }
     on_mousemove(e) {
      let wid=55;
      let color="rgb(200, 200, 200, 0.7)";
      let n=this.getActiveBox(e.x, e.y);
      if (n!==undefined) {
          n.setColor(this.hcolor);
      }
      if (this.boxes.active!==undefined&&this.boxes.active!==n) {
          this.boxes.active.setColor(this.color);
          this.boxes.active.dispatchEvent(new MouseEvent("mouseleave", e));
      }
      if (n!==undefined) {
          n.dispatchEvent(new MouseEvent("mouseenter", e));
      }
      this.boxes.active = n;
      if (this.sarea===undefined) {
          return ;
      }
      if (this.cursorbox===undefined) {
          wid = 25;
          this.cursorbox = this.overdraw.rect([e.x-wid*0.5, e.y-wid*0.5], [wid, wid], color);
          this.cursorbox.style["pointer-events"] = "none";
      }
      else {
        this.cursorbox.style["x"] = (e.x-wid*0.5)+"px";
        this.cursorbox.style["y"] = (e.y-wid*0.5)+"px";
      }
    }
     on_mouseup(e) {
      console.log("e.button", e.button, e, e.x, e.y, this.getActiveBox(e.x, e.y));
      if (e.button) {
          e.stopPropagation();
          e.preventDefault();
      }
      else {
        let box=this.getActiveBox(e.x, e.y);
        if (box!==undefined) {
            box.onclick(e);
        }
      }
      this.finish();
    }
     modalStart(ctx) {
      super.modalStart(ctx);
      let screen=this.screen;
      this.overdraw.clear();
      if (this.sarea) {
          let sa=this.sarea;
          let box=this.overdraw.rect(sa.pos, sa.size, "rgba(100, 100, 100, 0.5)");
          box.style["pointer-events"] = "none";
      }
      for (let sa of screen.sareas) {
          this.makeBoxes(sa);
      }
    }
  }
  _ESClass.register(AreaDragTool);
  _es6_module.add_class(AreaDragTool);
  AreaDragTool = _es6_module.add_export('AreaDragTool', AreaDragTool);
  class ToolTipViewer extends ToolBase {
     constructor(screen) {
      super(screen);
      this.tooltip = undefined;
      this.element = undefined;
    }
    static  tooldef() {
      return {uiname: "Help Tool", 
     toolpath: "screen.help_picker", 
     icon: ui_base.Icons.HELP, 
     description: "view tooltips", 
     is_modal: true, 
     hotkey: undefined, 
     undoflag: UndoFlags.NO_UNDO, 
     flag: 0, 
     inputs: {}, 
     outputs: {}}
    }
     on_mousemove(e) {
      this.pick(e);
    }
     on_mousedown(e) {
      this.pick(e);
    }
     on_mouseup(e) {
      this.finish();
    }
     finish() {
      super.finish();
    }
     on_keydown(e) {
      switch (e.keyCode) {
        case keymap.Escape:
        case keymap.Enter:
        case Keymap.Space:
          if (this.tooltip) {
              this.tooltip.end();
          }
          this.finish();
          break;
      }
    }
     pick(e) {
      let x=e.x, y=e.y;
      let ele=this.screen.pickElement(x, y);
      console.log(ele ? ele.tagName : ele);
      if (ele!==undefined&&ele!==this.element&&ele.title) {
          if (this.tooltip) {
              this.tooltip.end();
          }
          this.element = ele;
          let tip=ele.title;
          this.tooltip = ToolTip.show(tip, this.screen, x, y);
      }
      e.preventDefault();
      e.stopPropagation();
    }
  }
  _ESClass.register(ToolTipViewer);
  _es6_module.add_class(ToolTipViewer);
  ToolTipViewer = _es6_module.add_export('ToolTipViewer', ToolTipViewer);
}, '/dev/fairmotion/src/path.ux/scripts/screen/FrameManager_ops.js');
es6_module_define('ScreenArea', ["../toolsys/toolprop.js", "../core/ui.js", "./area_wrangler.js", "../core/ui_base.js", "../util/simple_events.js", "../config/const.js", "../widgets/ui_noteframe.js", "../util/util.js", "../util/vectormath.js", "../util/struct.js", "./FrameManager_mesh.js"], function _ScreenArea_module(_es6_module) {
  let _ScreenArea=undefined;
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var ui_base=es6_import(_es6_module, '../core/ui_base.js');
  var ui=es6_import(_es6_module, '../core/ui.js');
  var ui_noteframe=es6_import(_es6_module, '../widgets/ui_noteframe.js');
  var haveModal=es6_import_item(_es6_module, '../util/simple_events.js', 'haveModal');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  es6_import(_es6_module, '../util/struct.js');
  let UIBase=ui_base.UIBase;
  var EnumProperty=es6_import_item(_es6_module, '../toolsys/toolprop.js', 'EnumProperty');
  let Vector2=vectormath.Vector2;
  let Screen=undefined;
  var snap=es6_import_item(_es6_module, './FrameManager_mesh.js', 'snap');
  var snapi=es6_import_item(_es6_module, './FrameManager_mesh.js', 'snapi');
  const AreaFlags={HIDDEN: 1, 
   FLOATING: 2, 
   INDEPENDENT: 4, 
   NO_SWITCHER: 8}
  _es6_module.add_export('AreaFlags', AreaFlags);
  var ___area_wrangler_js=es6_import(_es6_module, './area_wrangler.js');
  for (let k in ___area_wrangler_js) {
      _es6_module.add_export(k, ___area_wrangler_js[k], true);
  }
  var getAreaIntName=es6_import_item(_es6_module, './area_wrangler.js', 'getAreaIntName');
  var setAreaTypes=es6_import_item(_es6_module, './area_wrangler.js', 'setAreaTypes');
  var AreaWrangler=es6_import_item(_es6_module, './area_wrangler.js', 'AreaWrangler');
  var areaclasses=es6_import_item(_es6_module, './area_wrangler.js', 'areaclasses');
  let contextWrangler=new AreaWrangler();
  window._contextWrangler = contextWrangler;
  const BorderMask={LEFT: 1, 
   BOTTOM: 2, 
   RIGHT: 4, 
   TOP: 8, 
   ALL: 1|2|4|8}
  _es6_module.add_export('BorderMask', BorderMask);
  const BorderSides={LEFT: 0, 
   BOTTOM: 1, 
   RIGHT: 2, 
   TOP: 3}
  _es6_module.add_export('BorderSides', BorderSides);
  class Area extends ui_base.UIBase {
     constructor() {
      super();
      let def=this.constructor.define();
      this.borderLock = def.borderLock||0;
      this.flag = def.flag||0;
      this.inactive = true;
      this.areaDragToolEnabled = true;
      this.owning_sarea = undefined;
      this._area_id = contextWrangler.idgen++;
      this.pos = undefined;
      this.size = undefined;
      this.minSize = [5, 5];
      this.maxSize = [undefined, undefined];
      let appendChild=this.shadow.appendChild;
      this.shadow.appendChild = (child) =>        {
        appendChild.call(this.shadow, child);
        if (__instance_of(child, UIBase)) {
            child.parentWidget = this;
        }
      };
      let prepend=this.shadow.prepend;
      this.shadow.prepend = (child) =>        {
        prepend.call(this.shadow, child);
        if (__instance_of(child, UIBase)) {
            child.parentWidget = this;
        }
      };
    }
    set  floating(val) {
      if (val) {
          this.flag|=AreaFlags.FLOATING;
      }
      else {
        this.flag&=~AreaFlags.FLOATING;
      }
    }
    get  floating() {
      return ~~(this.flag&AreaFlags.FLOATING);
    }
     init() {
      super.init();
      this.style["overflow"] = "hidden";
      this.noMarginsOrPadding();
      let onover=(e) =>        {
        this.push_ctx_active();
        this.pop_ctx_active();
      };
      super.addEventListener("mouseover", onover, {passive: true});
      super.addEventListener("mousemove", onover, {passive: true});
      super.addEventListener("mousein", onover, {passive: true});
      super.addEventListener("mouseenter", onover, {passive: true});
      super.addEventListener("touchstart", onover, {passive: true});
      super.addEventListener("focusin", onover, {passive: true});
      super.addEventListener("focus", onover, {passive: true});
    }
     _get_v_suffix() {
      if (this.flag&AreaFlags.INDEPENDENT) {
          return this._id;
      }
      else {
        return "";
      }
    }
     getKeyMaps() {
      return this.keymap!==undefined ? [this.keymap] : [];
    }
     on_fileload(isActiveEditor) {
      contextWrangler.reset();
    }
     buildDataPath() {
      let p=this;
      let sarea=this.owning_sarea;
      if (sarea===undefined||sarea.screen===undefined) {
          console.warn("Area.buildDataPath(): Failed to build data path");
          return "";
      }
      let screen=sarea.screen;
      let idx1=screen.sareas.indexOf(sarea);
      let idx2=sarea.editors.indexOf(this);
      if (idx1<0||idx2<0) {
          throw new Error("malformed area data");
      }
      let ret=`screen.sareas[${idx1}].editors[${idx2}]`;
      return ret;
    }
     saveData() {
      return {_area_id: this._area_id, 
     areaName: this.areaName}
    }
     loadData(obj) {
      let id=obj._area_id;
      if (id!==undefined&&id!==null) {
          this._area_id = id;
      }
    }
     draw() {

    }
     copy() {
      console.warn("You might want to implement this, Area.prototype.copy based method called");
      let ret=document.createElement(this.constructor.define().tagname);
      return ret;
    }
     on_resize(size, oldsize) {
      super.on_resize(size, oldsize);
    }
     on_area_focus() {

    }
     on_area_blur() {

    }
     on_area_active() {

    }
     on_area_inactive() {

    }
    static  getActiveArea(type) {
      return contextWrangler.getLastArea(type);
    }
     push_ctx_active(dontSetLastRef=false) {
      contextWrangler.push(this.constructor, this, !dontSetLastRef);
    }
     pop_ctx_active(dontSetLastRef=false) {
      contextWrangler.pop(this.constructor, this, !dontSetLastRef);
    }
    static  register(cls) {
      let def=cls.define();
      if (!def.areaname) {
          throw new Error("Missing areaname key in define()");
      }
      areaclasses[def.areaname] = cls;
      ui_base.UIBase.register(cls);
    }
     getScreen() {
      throw new Error("replace me in Area.prototype");
    }
     toJSON() {
      return Object.assign(super.toJSON(), {areaname: this.constructor.define().areaname, 
     _area_id: this._area_id});
    }
     loadJSON(obj) {
      super.loadJSON(obj);
      this._area_id = obj._area_id;
      return this;
    }
     getBarHeight() {
      return this.header.getClientRects()[0].height;
    }
    static  makeAreasEnum() {
      let areas={};
      let icons={};
      let i=0;
      for (let k in areaclasses) {
          let cls=areaclasses[k];
          let def=cls.define();
          if (def.flag&AreaFlags.HIDDEN)
            continue;
          let uiname=def.uiname;
          if (uiname===undefined) {
              uiname = k.replace("_", " ").toLowerCase();
              uiname = uiname[0].toUpperCase()+uiname.slice(1, uiname.length);
          }
          areas[uiname] = k;
          icons[uiname] = def.icon!==undefined ? def.icon : -1;
      }
      let prop=new EnumProperty(undefined, areas);
      prop.addIcons(icons);
      return prop;
    }
     makeAreaSwitcher(container) {
      if (cconst.useAreaTabSwitcher) {
          let ret=document.createElement("area-docker-x");
          container.add(ret);
          return ret;
      }
      let prop=Area.makeAreasEnum();
      return container.listenum(undefined, {name: this.constructor.define().uiname, 
     enumDef: prop, 
     callback: (id) =>          {
          let cls=areaclasses[id];
          this.owning_sarea.switch_editor(cls);
        }});
    }
     makeHeader(container, add_note_area=true) {
      let row=this.header = container.row();
      row.remove();
      container._prepend(row);
      row.setCSS.after(() =>        {
        return row.background = this.getDefault("AreaHeaderBG");
      });
      let rh=~~(16*this.getDPI());
      container.noMarginsOrPadding();
      row.noMarginsOrPadding();
      row.style["width"] = "100%";
      row.style["margin"] = "0px";
      row.style["padding"] = "0px";
      let mdown=false;
      let mpos=new Vector2();
      let mpre=(e, pageX, pageY) =>        {
        pageX = pageX===undefined ? e.pageX : pageX;
        pageY = pageY===undefined ? e.pageY : pageY;
        let node=this.getScreen().pickElement(pageX, pageY);
        if (node!==row) {
            return false;
        }
        return true;
      };
      row.addEventListener("mouseout", (e) =>        {
        mdown = false;
      });
      row.addEventListener("mouseleave", (e) =>        {
        mdown = false;
      });
      row.addEventListener("mousedown", (e) =>        {
        if (!mpre(e))
          return ;
        mpos[0] = e.pageX;
        mpos[1] = e.pageY;
        mdown = true;
      }, false);
      let do_mousemove=(e, pageX, pageY) =>        {
        let mdown2=e.buttons!=0||(e.touches&&e.touches.length>0);
        if (!mdown2||!mpre(e, pageX, pageY))
          return ;
        if (e.type==="mousemove"&&e.was_touch) {
            return ;
        }
        let dx=pageX-mpos[0];
        let dy=pageY-mpos[1];
        let dis=dx*dx+dy*dy;
        let limit=7;
        if (dis>limit*limit) {
            let sarea=this.owning_sarea;
            if (sarea===undefined) {
                console.warn("Error: missing sarea ref");
                return ;
            }
            let screen=sarea.screen;
            if (screen===undefined) {
                console.log("Error: missing screen ref");
                return ;
            }
            if (!this.areaDragToolEnabled) {
                return ;
            }
            mdown = false;
            console.log("area drag tool!", e.type, e);
            screen.areaDragTool(this.owning_sarea);
        }
      };
      row.addEventListener("mousemove", (e) =>        {
        return do_mousemove(e, e.pageX, e.pageY);
      }, false);
      row.addEventListener("mouseup", (e) =>        {
        if (!mpre(e))
          return ;
        mdown = false;
      }, false);
      row.addEventListener("touchstart", (e) =>        {
        console.log("touchstart", e);
        if (!mpre(e, e.touches[0].pageX, e.touches[0].pageY))
          return ;
        if (e.touches.length==0)
          return ;
        mpos[0] = e.touches[0].pageX;
        mpos[1] = e.touches[0].pageY;
        mdown = true;
      }, false);
      row.addEventListener("touchmove", (e) =>        {
        return do_mousemove(e, e.touches[0].pageX, e.touches[0].pageY);
      }, false);
      let touchend=(e) =>        {
        let node=this.getScreen().pickElement(e.pageX, e.pageY);
        if (node!==row) {
            return ;
        }
        if (e.touches.length==0)
          return ;
        mdown = false;
      };
      row.addEventListener("touchcancel", (e) =>        {
        touchend(e);
      }, false);
      row.addEventListener("touchend", (e) =>        {
        touchend(e);
      }, false);
      if (!(this.flag&AreaFlags.NO_SWITCHER)) {
          this.switcher = this.makeAreaSwitcher(row);
      }
      if (util.isMobile()||cconst.addHelpPickers) {
          this.helppicker = row.helppicker();
          this.helppicker.iconsheet = 0;
      }
      if (add_note_area) {
          let notef=document.createElement("noteframe-x");
          notef.ctx = this.ctx;
          row._add(notef);
      }
      this.header = row;
      return row;
    }
     setCSS() {
      if (this.size!==undefined) {
          this.style["position"] = "absolute";
          this.style["width"] = this.size[0]+"px";
          this.style["height"] = this.size[1]+"px";
      }
    }
     update() {
      if (this.owning_sarea===undefined||this!==this.owning_sarea.area) {
          return ;
      }
      super.update();
    }
     loadSTRUCT(reader) {
      reader(this);
    }
    static  define() {
      return {tagname: undefined, 
     areaname: undefined, 
     uiname: undefined, 
     icon: undefined}
    }
     _isDead() {
      if (this.dead) {
          return true;
      }
      let screen=this.getScreen();
      if (screen===undefined)
        return true;
      if (screen.parentNode===undefined)
        return true;
    }
     afterSTRUCT() {
      let f=() =>        {
        if (this._isDead()) {
            return ;
        }
        if (!this.ctx) {
            this.doOnce(f);
            return ;
        }
        try {
          console.log("load ui data");
          ui_base.loadUIData(this, this.saved_uidata);
          this.saved_uidata = undefined;
        }
        catch (error) {
            console.log("failed to load ui data");
            util.print_stack(error);
        }
      };
      this.doOnce(f);
    }
    static  newSTRUCT(reader) {
      return document.createElement(this.define().tagname);
    }
     loadSTRUCT(reader) {
      reader(this);
    }
     _getSavedUIData() {
      return ui_base.saveUIData(this, "area");
    }
  }
  _ESClass.register(Area);
  _es6_module.add_class(Area);
  Area = _es6_module.add_export('Area', Area);
  Area.STRUCT = `
pathux.Area { 
  flag : int;
  saved_uidata : string | obj._getSavedUIData();
}
`;
  nstructjs.manager.add_class(Area);
  class ScreenArea extends ui_base.UIBase {
     constructor() {
      super();
      this._borders = [];
      this._verts = [];
      this.dead = false;
      this._sarea_id = contextWrangler.idgen++;
      this._pos = new Vector2();
      this._size = new Vector2([512, 512]);
      if (cconst.DEBUG.screenAreaPosSizeAccesses) {
          let wrapVector=(name, axis) =>            {
            Object.defineProperty(this[name], axis, {get: function () {
                return this["_"+axis];
              }, 
        set: function (val) {
                console.warn(`ScreenArea.${name}[${axis}] set:`, val);
                this["_"+axis] = val;
              }});
          };
          wrapVector("size", 0);
          wrapVector("size", 1);
          wrapVector("pos", 0);
          wrapVector("pos", 1);
      }
      this.area = undefined;
      this.editors = [];
      this.editormap = {};
      this.addEventListener("mouseover", (e) =>        {
        if (haveModal()) {
            return ;
        }
        let screen=this.getScreen();
        if (screen.sareas.active!==this&&screen.sareas.active&&screen.sareas.active.area) {
            screen.sareas.active.area.on_area_blur();
        }
        if (screen.sareas.active!==this) {
            this.area.on_area_focus();
        }
        screen.sareas.active = this;
      });
    }
    get  floating() {
      return this.area ? this.area.floating : undefined;
    }
    set  floating(val) {
      if (this.area) {
          this.area.floating = val;
      }
    }
    get  flag() {
      return this.area ? this.area.flag : 0;
    }
     _get_v_suffix() {
      return this.area ? this.area._get_v_suffix() : "";
    }
    get  borderLock() {
      return this.area!==undefined ? this.area.borderLock : 0;
    }
    get  minSize() {
      return this.area!==undefined ? this.area.minSize : [5, 5];
    }
    get  maxSize() {
      return this.area!==undefined ? this.area.maxSize : [undefined, undefined];
    }
     bringToFront() {
      let screen=this.getScreen();
      this.remove(false);
      screen.sareas.remove(this);
      screen.appendChild(this);
      let zindex=0;
      if (screen.style["z-index"]) {
          zindex = parseInt(screen.style["z-index"])+1;
      }
      for (let sarea of screen.sareas) {
          let zindex=sarea.style["z-index"];
          if (sarea.style["z-index"]) {
              zindex = Math.max(zindex, parseInt(sarea.style["z-index"])+1);
          }
      }
      this.style["z-index"] = zindex;
    }
     _side(border) {
      let ret=this._borders.indexOf(border);
      if (ret<0) {
          throw new Error("border not in screen area");
      }
      return ret;
    }
     init() {
      super.init();
      this.noMarginsOrPadding();
    }
     draw() {
      if (this.area.draw) {
          this.area.push_ctx_active();
          this.area.draw();
          this.area.pop_ctx_active();
      }
    }
     _isDead() {
      if (this.dead) {
          return true;
      }
      let screen=this.getScreen();
      if (screen===undefined)
        return true;
      if (screen.parentNode===undefined)
        return true;
    }
     toJSON() {
      let ret={editors: this.editors, 
     _sarea_id: this._sarea_id, 
     area: this.area.constructor.define().areaname, 
     pos: this.pos, 
     size: this.size};
      return Object.assign(super.toJSON(), ret);
    }
     on_keydown(e) {
      if (this.area.on_keydown) {
          this.area.push_ctx_active();
          this.area.on_keydown(e);
          this.area.pop_ctx_active();
      }
    }
     loadJSON(obj) {
      if (obj===undefined) {
          console.warn("undefined in loadJSON");
          return ;
      }
      super.loadJSON(obj);
      this.pos.load(obj.pos);
      this.size.load(obj.size);
      for (let editor of obj.editors) {
          let areaname=editor.areaname;
          let tagname=areaclasses[areaname].define().tagname;
          let area=document.createElement(tagname);
          area.owning_sarea = this;
          this.editormap[areaname] = area;
          this.editors.push(this.editormap[areaname]);
          area.pos = new Vector2(obj.pos);
          area.size = new Vector2(obj.size);
          area.ctx = this.ctx;
          area.inactive = true;
          area.loadJSON(editor);
          area.owning_sarea = undefined;
          if (areaname===obj.area) {
              this.area = area;
          }
      }
      if (this.area!==undefined) {
          this.area.ctx = this.ctx;
          this.area.style["width"] = "100%";
          this.area.style["height"] = "100%";
          this.area.owning_sarea = this;
          this.area.parentWidget = this;
          this.area.pos = this.pos;
          this.area.size = this.size;
          this.area.inactive = false;
          this.shadow.appendChild(this.area);
          this.area.on_area_active();
          this.area.onadd();
      }
      this.setCSS();
    }
     _ondestroy() {
      super._ondestroy();
      this.dead = true;
      for (let editor of this.editors) {
          if (editor===this.area)
            continue;
          editor._ondestroy();
      }
    }
     getScreen() {
      if (this.screen!==undefined) {
          return this.screen;
      }
      let p=this.parentNode;
      let _i=0;
      while (p&&!(__instance_of(p, Screen))&&p!==p.parentNode) {
        p = this.parentNode;
        if (_i++>1000) {
            console.warn("infinite loop detected in ScreenArea.prototype.getScreen()");
            return undefined;
        }
      }
      return p&&__instance_of(p, Screen) ? p : undefined;
    }
     copy(screen) {
      let ret=document.createElement("screenarea-x");
      ret.screen = screen;
      ret.ctx = this.ctx;
      ret.pos[0] = this.pos[0];
      ret.pos[1] = this.pos[1];
      ret.size[0] = this.size[0];
      ret.size[1] = this.size[1];
      for (let area of this.editors) {
          let cpy=area.copy();
          cpy.ctx = this.ctx;
          cpy.parentWidget = ret;
          ret.editors.push(cpy);
          if (area===this.area) {
              ret.area = cpy;
          }
      }
      ret.ctx = this.ctx;
      if (ret.area!==undefined) {
          ret.area.ctx = this.ctx;
          ret.area.pos = ret.pos;
          ret.area.size = ret.size;
          ret.area.owning_sarea = ret;
          ret.area.parentWidget = ret;
          ret.shadow.appendChild(ret.area);
          if (ret.area._init_done) {
              ret.area.push_ctx_active();
              ret.area.on_area_active();
              ret.area.pop_ctx_active();
          }
          else {
            ret.doOnce(() =>              {
              if (this.dead) {
                  return ;
              }
              ret._init();
              ret.area._init();
              ret.area.push_ctx_active();
              ret.area.on_area_active();
              ret.area.pop_ctx_active();
            });
          }
      }
      return ret;
    }
     snapToScreenSize() {
      let screen=this.getScreen();
      let co=new Vector2();
      let changed=0;
      for (let v of this._verts) {
          co.load(v);
          v[0] = Math.min(Math.max(v[0], 0), screen.size[0]);
          v[1] = Math.min(Math.max(v[1], 0), screen.size[1]);
          if (co.vectorDistance(v)>0.1) {
              changed = 1;
          }
      }
      if (changed) {
          this.loadFromVerts();
      }
    }
     loadFromPosSize() {
      let screen=this.getScreen();
      if (!screen)
        return ;
      for (let b of this._borders) {
          screen.freeBorder(b);
      }
      this.makeBorders(screen);
      this.setCSS();
      return this;
    }
     loadFromVerts() {
      if (this._verts.length==0) {
          return ;
      }
      let min=new Vector2([1e+17, 1e+17]);
      let max=new Vector2([-1e+17, -1e+17]);
      for (let v of this._verts) {
          min.min(v);
          max.max(v);
      }
      this.pos[0] = min[0];
      this.pos[1] = min[1];
      this.size[0] = max[0]-min[0];
      this.size[1] = max[1]-min[1];
      this.setCSS();
      return this;
    }
     on_resize(size, oldsize) {
      super.on_resize(size, oldsize);
      if (this.area!==undefined) {
          this.area.on_resize(size, oldsize);
      }
    }
     makeBorders(screen) {
      this._borders.length = 0;
      this._verts.length = 0;
      let p=this.pos, s=this.size;
      let vs=[new Vector2([p[0], p[1]]), new Vector2([p[0], p[1]+s[1]]), new Vector2([p[0]+s[0], p[1]+s[1]]), new Vector2([p[0]+s[0], p[1]])];
      for (let i=0; i<vs.length; i++) {
          vs[i] = snap(vs[i]);
          vs[i] = screen.getScreenVert(vs[i], i);
          this._verts.push(vs[i]);
      }
      for (let i=0; i<vs.length; i++) {
          let v1=vs[i], v2=vs[(i+1)%vs.length];
          let b=screen.getScreenBorder(this, v1, v2, i);
          for (let j=0; j<2; j++) {
              let v=j ? b.v2 : b.v1;
              if (v.sareas.indexOf(this)<0) {
                  v.sareas.push(this);
              }
          }
          if (b.sareas.indexOf(this)<0) {
              b.sareas.push(this);
          }
          this._borders.push(b);
          b.movable = screen.isBorderMovable(b);
      }
      return this;
    }
     setCSS() {
      this.style["position"] = "absolute";
      this.style["left"] = this.pos[0]+"px";
      this.style["top"] = this.pos[1]+"px";
      this.style["width"] = this.size[0]+"px";
      this.style["height"] = this.size[1]+"px";
      if (this.area!==undefined) {
          this.area.setCSS();
      }
    }
     appendChild(child) {
      if (__instance_of(child, Area)) {
          child.ctx = this.ctx;
          child.pos = this.pos;
          child.size = this.size;
          if (this.editors.indexOf(child)<0) {
              this.editors.push(child);
          }
          child.owning_sarea = undefined;
      }
      super.appendChild(child);
      if (__instance_of(child, ui_base.UIBase)) {
          child.parentWidget = this;
          child.onadd();
      }
    }
     switch_editor(cls) {
      return this.switchEditor(cls);
    }
     switchEditor(cls) {
      let def=cls.define();
      let name=def.areaname;
      if (!(name in this.editormap)) {
          this.editormap[name] = document.createElement(def.tagname);
          this.editormap[name].ctx = this.ctx;
          this.editormap[name].parentWidget = this;
          this.editormap[name].owning_sarea = this;
          this.editormap[name].inactive = false;
          this.editors.push(this.editormap[name]);
      }
      if (this.area!==undefined) {
          this.area.pos = new Vector2(this.area.pos);
          this.area.size = new Vector2(this.area.size);
          this.area.owning_sarea = undefined;
          this.area.inactive = true;
          this.area.push_ctx_active();
          this.area._init();
          this.area.on_area_inactive();
          this.area.pop_ctx_active();
          this.area.remove();
      }
      this.area = this.editormap[name];
      this.area.inactive = false;
      this.area.parentWidget = this;
      this.area.pos = this.pos;
      this.area.size = this.size;
      this.area.owning_sarea = this;
      this.area.ctx = this.ctx;
      this.area.packflag|=this.packflag;
      this.shadow.appendChild(this.area);
      this.area.style["width"] = "100%";
      this.area.style["height"] = "100%";
      this.area.push_ctx_active();
      this.area._init();
      this.area.on_resize(this.size, this.size);
      this.area.pop_ctx_active();
      this.area.push_ctx_active();
      this.area.on_area_active();
      this.area.pop_ctx_active();
      this.regenTabOrder();
    }
     _checkWrangler() {
      if (this.ctx)
        contextWrangler._checkWrangler(this.ctx);
    }
     update() {
      this._checkWrangler();
      super.update();
      if (this.area!==undefined) {
          this.area.owning_sarea = this;
          this.area.parentWidget = this;
          this.area.size = this.size;
          this.area.pos = this.pos;
          let screen=this.getScreen();
          let oldsize=[this.size[0], this.size[1]];
          let moved=screen ? screen.checkAreaConstraint(this, true) : 0;
          if (moved) {
              if (cconst.DEBUG.areaConstraintSolver) {
                  console.log("screen constraint solve", moved, this.area.minSize, this.area.maxSize, this.area.tagName, this.size);
              }
              screen.solveAreaConstraints();
              screen.regenBorders();
              this.on_resize(oldsize);
          }
          this.area.push_ctx_active(true);
      }
      this._forEachChildWidget((n) =>        {
        n.update();
      });
      if (this.area!==undefined) {
          this.area.pop_ctx_active(true);
      }
    }
     appendChild(ch) {
      if (__instance_of(ch, Area)) {
          this.editors.push(ch);
          this.editormap[ch.constructor.define().areaname] = ch;
      }
      else {
        super.appendChild(ch);
      }
    }
     removeChild(ch) {
      if (__instance_of(ch, Area)) {
          ch.owining_sarea = undefined;
          ch.pos = undefined;
          ch.size = undefined;
          if (this.area===ch&&this.editors.length>1) {
              let i=(this.editors.indexOf(ch)+1)%this.editors.length;
              this.switchEditor(this.editors[i].constructor);
          }
          else 
            if (this.area===ch) {
              this.editors = [];
              this.editormap = {};
              this.area = undefined;
              ch.remove();
              return ;
          }
          let areaname=ch.constructor.define().areaname;
          this.editors.remove(ch);
          delete this.editormap[areaname];
          ch.parentWidget = undefined;
      }
      else {
        return super.removeChild(ch);
      }
    }
    static  newSTRUCT() {
      return document.createElement("screenarea-x");
    }
     afterSTRUCT() {
      for (let area of this.editors) {
          area.pos = this.pos;
          area.size = this.size;
          area.owning_sarea = this;
          area.push_ctx_active();
          area._ctx = this.ctx;
          area.afterSTRUCT();
          area.pop_ctx_active();
      }
    }
    get  pos() {
      return this._pos;
    }
    set  pos(val) {
      if (cconst.DEBUG.screenAreaPosSizeAccesses) {
          console.log("ScreenArea set pos", val);
      }
      this._pos.load(val);
    }
    get  size() {
      return this._size;
    }
    set  size(val) {
      if (cconst.DEBUG.screenAreaPosSizeAccesses) {
          console.log("ScreenArea set size", val);
      }
      this._size.load(val);
    }
     loadSTRUCT(reader) {
      reader(this);
      this.pos = new Vector2(this.pos);
      this.size = new Vector2(this.size);
      let editors=[];
      for (let area of this.editors) {
          if (!area.constructor||!area.constructor.define) {
              continue;
          }
          let areaname=area.constructor.define().areaname;
          area.inactive = true;
          area.owning_sarea = undefined;
          this.editormap[areaname] = area;
          if (areaname===this.area) {
              this.area = area;
          }
          area.parentWidget = this;
          editors.push(area);
      }
      this.editors = editors;
      if (typeof this.area!=="object") {
          let area=this.editors[0];
          console.warn("Failed to find active area!", this.area);
          if (typeof area!=="object") {
              for (let k in areaclasses) {
                  area = areaclasses[k].define().tagname;
                  area = document.createElement(area);
                  let areaname=area.constructor.define().areaname;
                  this.editors.push(area);
                  this.editormap[areaname] = area;
                  break;
              }
          }
          if (area) {
              this.area = area;
          }
      }
      if (this.area!==undefined) {
          this.area.style["width"] = "100%";
          this.area.style["height"] = "100%";
          this.area.owning_saea = this;
          this.area.parentWidget = this;
          this.area.pos = this.pos;
          this.area.size = this.size;
          this.area.inactive = false;
          this.shadow.appendChild(this.area);
          let f=() =>            {
            if (this._isDead()) {
                return ;
            }
            if (!this.ctx&&this.parentNode) {
                console.log("waiting to start. . .");
                this.doOnce(f);
                return ;
            }
            this.area.ctx = this.ctx;
            this.area._init();
            this.area.on_area_active();
            this.area.onadd();
          };
          this.doOnce(f);
      }
    }
    static  define() {
      return {tagname: "screenarea-x"}
    }
  }
  _ESClass.register(ScreenArea);
  _es6_module.add_class(ScreenArea);
  ScreenArea = _es6_module.add_export('ScreenArea', ScreenArea);
  ScreenArea.STRUCT = `
pathux.ScreenArea { 
  pos      : vec2;
  size     : vec2;
  type     : string;
  hidden   : bool;
  editors  : array(abstract(pathux.Area));
  area     : string | obj.area.constructor.define().areaname;
}
`;
  nstructjs.manager.add_class(ScreenArea);
  ui_base.UIBase.register(ScreenArea);
  ui_base._setAreaClass(Area);
}, '/dev/fairmotion/src/path.ux/scripts/screen/ScreenArea.js');
es6_module_define('simple_toolsys', ["../util/simple_events.js", "../util/events.js", "./toolprop.js"], function _simple_toolsys_module(_es6_module) {
  "use strict";
  var events=es6_import(_es6_module, '../util/events.js');
  var keymap=es6_import_item(_es6_module, '../util/simple_events.js', 'keymap');
  var PropTypes=es6_import_item(_es6_module, './toolprop.js', 'PropTypes');
  let ToolClasses=[];
  ToolClasses = _es6_module.add_export('ToolClasses', ToolClasses);
  function setContextClass(cls) {
    console.warn("setContextClass is deprecated");
  }
  setContextClass = _es6_module.add_export('setContextClass', setContextClass);
  const ToolFlags={PRIVATE: 1}
  _es6_module.add_export('ToolFlags', ToolFlags);
  const UndoFlags={NO_UNDO: 2, 
   IS_UNDO_ROOT: 4, 
   UNDO_BARRIER: 8, 
   HAS_UNDO_DATA: 16}
  _es6_module.add_export('UndoFlags', UndoFlags);
  class InheritFlag  {
     constructor(slots={}) {
      this.slots = slots;
    }
  }
  _ESClass.register(InheritFlag);
  _es6_module.add_class(InheritFlag);
  let modalstack=[];
  class ToolOp extends events.EventHandler {
    static  tooldef() {
      if (this===ToolOp) {
          throw new Error("Tools must implemented static tooldef() methods!");
      }
      return {}
    }
    static  inherit(slots) {
      return new InheritFlag(slots);
    }
    static  invoke(ctx, args) {
      let tool=new this();
      for (let k in args) {
          if (!(k in tool.inputs)) {
              console.warn("Unknown tool argument "+k);
              continue;
          }
          let prop=tool.inputs[k];
          let val=args[k];
          if ((typeof val==="string")&&prop.type&(PropTypes.ENUM|PropTypes.FLAG)) {
              if (val in prop.values) {
                  val = prop.values[val];
              }
              else {
                console.warn("Possible invalid enum/flag:", val);
                continue;
              }
          }
          tool.inputs[k].setValue(val);
      }
      return tool;
    }
     genToolString() {
      let def=this.constructor.tooldef();
      let path=def.toolpath+"(";
      for (let k in this.inputs) {
          let prop=this.inputs[k];
          path+=k+"=";
          if (prop.type===PropTypes.STRING)
            path+="'";
          if (prop.type===PropTypes.FLOAT) {
              path+=prop.getValue().toFixed(3);
          }
          else {
            path+=prop.getValue();
          }
          if (prop.type===PropTypes.STRING)
            path+="'";
          path+=" ";
      }
      path+=")";
      return path;
    }
    static  register(cls) {
      if (ToolClasses.indexOf(cls)>=0) {
          console.warn("Tried to register same ToolOp class twice:", cls.name, cls);
          return ;
      }
      ToolClasses.push(cls);
    }
    static  isRegistered(cls) {
      return ToolClasses.indexOf(cls)>=0;
    }
    static  unregister(cls) {
      if (ToolClasses.indexOf(cls)>=0) {
          ToolClasses.remove(cls);
      }
    }
     constructor() {
      super();
      this._overdraw = undefined;
      var def=this.constructor.tooldef();
      if (def.undoflag!==undefined) {
          this.undoflag = def.undoflag;
      }
      if (def.flag!==undefined) {
          this.flag = def.flag;
      }
      this._accept = this._reject = undefined;
      this._promise = undefined;
      for (var k in def) {
          this[k] = def[k];
      }
      let getSlots=(slots, key) =>        {
        if (slots===undefined)
          return {}
        if (!(__instance_of(slots, InheritFlag))) {
            return slots;
        }
        slots = {}
        let p=this.constructor;
        while (p!==undefined&&p!==Object&&p!==ToolOp) {
          if (p.tooldef) {
              let def=p.tooldef();
              if (def[key]!==undefined) {
                  let slots2=def[key];
                  let stop=!(__instance_of(slots2, InheritFlag));
                  if (__instance_of(slots2, InheritFlag)) {
                      slots2 = slots2.slots;
                  }
                  for (let k in slots2) {
                      if (!(k in slots)) {
                          slots[k] = slots2[k];
                      }
                  }
                  if (stop) {
                      break;
                  }
              }
          }
          p = p.prototype.__proto__.constructor;
        }
        return slots;
      };
      let dinputs=getSlots(def.inputs, "inputs");
      let doutputs=getSlots(def.outputs, "outputs");
      this.inputs = {};
      this.outputs = {};
      if (dinputs) {
          for (let k in dinputs) {
              this.inputs[k] = dinputs[k].copy();
          }
      }
      if (doutputs) {
          for (let k in doutputs) {
              this.outputs[k] = doutputs[k].copy();
          }
      }
      this.drawlines = [];
    }
    static  onTick() {
      for (let toolop of modalstack) {
          toolop.on_tick();
      }
    }
     on_tick() {

    }
     on_keydown(e) {
      switch (e.keyCode) {
        case keymap["Enter"]:
        case keymap["Space"]:
          this.modalEnd(false);
          break;
        case keymap["Escape"]:
          this.modalEnd(true);
          break;
      }
    }
    static  searchBoxOk(ctx) {
      let flag=this.tooldef().flag;
      let ret=!(flag&&(flag&ToolFlags.PRIVATE));
      ret = ret&&this.canRun(ctx);
      return ret;
    }
    static  canRun(ctx) {
      return true;
    }
     undoPre(ctx) {
      this._undo = _appstate.genUndoFile();
    }
     undo(ctx) {
      _appstate.loadUndoFile(this._undo);
    }
     exec_pre(ctx) {
      this.execPre(ctx);
    }
     execPre(ctx) {

    }
     exec(ctx) {

    }
     execPost(ctx) {

    }
     resetDrawLines() {
      var ctx=this.modal_ctx;
      for (var dl of this.drawlines) {
          dl.remove();
      }
      this.drawlines.length = 0;
    }
     error(msg) {
      console.warn(msg);
    }
     getOverdraw() {
      if (this._overdraw===undefined) {
          this._overdraw = document.createElement("overdraw-x");
          this._overdraw.start(this.modal_ctx.screen);
      }
      return this._overdraw;
    }
     addDrawLine(v1, v2, style) {
      let line=this.getOverdraw().line(v1, v2, style);
      this.drawlines.push(line);
      return line;
    }
     pushModal(node) {
      throw new Error("cannot call this; use modalStart");
    }
     popModal() {
      throw new Error("cannot call this; use modalEnd");
    }
     modalStart(ctx) {
      if (this.modalRunning) {
          console.warn("Warning, tool is already in modal mode consuming events");
          return this._promise;
      }
      this.modal_ctx = ctx;
      this.modalRunning = true;
      this._promise = new Promise((accept, reject) =>        {
        this._accept = accept;
        this._reject = reject;
        modalstack.push(this);
        super.pushModal(ctx.screen);
      });
      return this._promise;
    }
     toolCancel() {

    }
     modalEnd(was_cancelled) {
      if (this._modalstate) {
          modalstack.pop();
      }
      if (this._overdraw!==undefined) {
          this._overdraw.end();
          this._overdraw = undefined;
      }
      if (was_cancelled&&this._on_cancel!==undefined) {
          this._accept(this.modal_ctx, true);
          this._on_cancel(this);
      }
      this.resetDrawLines();
      var ctx=this.modal_ctx;
      this.modal_ctx = undefined;
      this.modalRunning = false;
      this.is_modal = false;
      super.popModal();
      this._promise = undefined;
      this._accept(ctx, false);
      this._accept = this._reject = undefined;
    }
  }
  _ESClass.register(ToolOp);
  _es6_module.add_class(ToolOp);
  ToolOp = _es6_module.add_export('ToolOp', ToolOp);
  class ToolMacro extends ToolOp {
    static  tooldef() {
      return {uiname: "Tool Macro"}
    }
     constructor() {
      super();
      this.tools = [];
      this.curtool = 0;
      this.has_modal = false;
      this.connects = [];
    }
     connect(srctool, dsttool, callback, thisvar) {
      this.connects.push({srctool: srctool, 
     dsttool: dsttool, 
     callback: callback, 
     thisvar: thisvar});
      return this;
    }
     add(tool) {
      if (tool.is_modal) {
          this.is_modal = true;
      }
      this.tools.push(tool);
      return this;
    }
     _do_connections(tool) {
      for (var c of this.connects) {
          if (c.srctool===tool) {
              c.callback.call(c.thisvar, c.srctool, c.dsttool);
          }
      }
    }
    static  canRun(ctx) {
      return true;
    }
     modalStart(ctx) {
      this._promise = new Promise((function (accept, reject) {
        this._accept = accept;
        this._reject = reject;
      }).bind(this));
      this.curtool = 0;
      let i;
      for (i = 0; i<this.tools.length; i++) {
          if (this.tools[i].is_modal)
            break;
          this.tools[i].undoPre(ctx);
          this.tools[i].execPre(ctx);
          this.tools[i].exec(ctx);
          this.tools[i].execPost(ctx);
          this._do_connections(this.tools[i]);
      }
      var on_modal_end=(function on_modal_end() {
        this._do_connections(this.tools[this.curtool]);
        this.curtool++;
        while (this.curtool<this.tools.length&&!this.tools[this.curtool].is_modal) {
          this.tools[this.curtool].undoPre(ctx);
          this.tools[this.curtool].execPre(ctx);
          this.tools[this.curtool].exec(ctx);
          this.tools[this.curtool].execPost(ctx);
          this._do_connections(this.tools[this.curtool]);
          this.curtool++;
        }
        if (this.curtool<this.tools.length) {
            this.tools[this.curtool].undoPre(ctx);
            this.tools[this.curtool].modalStart(ctx).then(on_modal_end);
        }
        else {
          this._accept(this, false);
        }
      }).bind(this);
      if (i<this.tools.length) {
          this.curtool = i;
          this.tools[this.curtool].undoPre(ctx);
          this.tools[this.curtool].modalStart(ctx).then(on_modal_end);
      }
      return this._promise;
    }
     exec(ctx) {
      for (var i=0; i<this.tools.length; i++) {
          this.tools[i].undoPre(ctx);
          this.tools[i].execPre(ctx);
          this.tools[i].exec(ctx);
          this.tools[i].execPost(ctx);
          this._do_connections(this.tools[i]);
      }
    }
     undoPre() {
      return ;
    }
     undo(ctx) {
      for (var i=this.tools.length-1; i>=0; i--) {
          this.tools[i].undo(ctx);
      }
    }
  }
  _ESClass.register(ToolMacro);
  _es6_module.add_class(ToolMacro);
  ToolMacro = _es6_module.add_export('ToolMacro', ToolMacro);
  class ToolStack extends Array {
     constructor(ctx) {
      super();
      this.cur = -1;
      this.ctx = ctx;
      this.modalRunning = 0;
    }
    get  head() {
      return this[this.cur];
    }
     setRestrictedToolContext(ctx) {
      this.toolctx = ctx;
    }
     reset(ctx) {
      if (ctx!==undefined) {
          this.ctx = ctx;
      }
      this.modalRunning = 0;
      this.cur = -1;
      this.length = 0;
    }
     execTool(ctx, toolop) {
      if (this.ctx===undefined) {
          this.ctx = ctx;
      }
      if (!toolop.constructor.canRun(ctx)) {
          console.log("toolop.constructor.canRun returned false");
          return ;
      }
      let tctx=this.toolctx!==undefined ? this.toolctx : ctx;
      tctx = tctx.toLocked();
      toolop._execCtx = tctx;
      if (!(toolop.undoflag&UndoFlags.NO_UNDO)) {
          this.cur++;
          this.length = this.cur+1;
          this[this.cur] = toolop;
          toolop.undoPre(ctx.toLocked());
      }
      if (toolop.is_modal) {
          this.modalRunning = true;
          toolop._on_cancel = (function (toolop) {
            this.pop_i(this.cur);
            this.cur--;
          }).bind(this);
          toolop.modalStart(ctx.toLocked());
      }
      else {
        toolop.execPre(tctx);
        toolop.exec(tctx);
        toolop.execPost(tctx);
      }
    }
     undo() {
      if (this.cur>=0&&!(this[this.cur].undoflag&UndoFlags.IS_UNDO_ROOT)) {
          let tool=this[this.cur];
          tool.undo(tool._execCtx);
          this.cur--;
      }
    }
     redo() {
      if (this.cur>=-1&&this.cur+1<this.length) {
          this.cur++;
          let tool=this[this.cur];
          let ctx=tool._execCtx;
          tool.undoPre(ctx);
          tool.execPre(ctx);
          tool.exec(ctx);
          tool.execPost(ctx);
      }
    }
  }
  _ESClass.register(ToolStack);
  _es6_module.add_class(ToolStack);
  ToolStack = _es6_module.add_export('ToolStack', ToolStack);
}, '/dev/fairmotion/src/path.ux/scripts/toolsys/simple_toolsys.js');
es6_module_define('toolpath', ["../controller/controller.js", "../util/util.js", "../util/parseutil.js", "./simple_toolsys.js"], function _toolpath_module(_es6_module) {
  var ToolClasses=es6_import_item(_es6_module, './simple_toolsys.js', 'ToolClasses');
  var ToolOp=es6_import_item(_es6_module, './simple_toolsys.js', 'ToolOp');
  var ToolFlags=es6_import_item(_es6_module, './simple_toolsys.js', 'ToolFlags');
  var UndoFlags=es6_import_item(_es6_module, './simple_toolsys.js', 'UndoFlags');
  var ToolMacro=es6_import_item(_es6_module, './simple_toolsys.js', 'ToolMacro');
  var tokdef=es6_import_item(_es6_module, '../util/parseutil.js', 'tokdef');
  var lexer=es6_import_item(_es6_module, '../util/parseutil.js', 'lexer');
  var parser=es6_import_item(_es6_module, '../util/parseutil.js', 'parser');
  var PUTLParseError=es6_import_item(_es6_module, '../util/parseutil.js', 'PUTLParseError');
  var DataPathError=es6_import_item(_es6_module, '../controller/controller.js', 'DataPathError');
  var cachering=es6_import_item(_es6_module, '../util/util.js', 'cachering');
  let ToolPaths={}
  ToolPaths = _es6_module.add_export('ToolPaths', ToolPaths);
  var initToolPaths_run=false;
  function buildParser() {
    let t=(name, re, func) =>      {
      return new tokdef(name, re, func);
    }
    let tokens=[t('ID', /[a-zA-Z_$]+[a-zA-Z0-9_$]*/, (t) =>      {
      if (t.value=="true"||t.value=="false") {
          t.type = "BOOL";
          t.value = t.value=="true";
      }
      return t;
    }), t('LPAREN', /\(/), t('RPAREN', /\)/), t('LSBRACKET', /\[/), t('RSBRACKET', /\]/), t('DOT', /\./), t('COMMA', /\,/), t('EQUALS', /\=/), t('STRLIT', /"[^"]*"/, (t) =>      {
      t.value = t.value.slice(1, t.value.length-1);
      return t;
    }), t('STRLIT', /'[^']*'/, (t) =>      {
      t.value = t.value.slice(1, t.value.length-1);
      return t;
    }), t('NUMBER', /-?[0-9]+/, (t) =>      {
      t.value = parseInt(t.value);
      return t;
    }), t('NUMBER', /[0-9]+\.[0-9]*/, (t) =>      {
      t.value = parseFloat(t.value);
      return t;
    }), t('WS', /[ \n\r\t]/, (t) =>      {
      return undefined;
    })];
    let lexerror=(t) =>      {
      console.warn("Parse error");
      return true;
    }
    let valid_datatypes={"STRLIT": 1, 
    "NUMBER": 1, 
    "BOOL": 1}
    function p_Start(p) {
      let args={}
      while (!p.at_end()) {
        let keyword=p.expect("ID");
        p.expect("EQUALS");
        let t=p.next();
        if (!(t.type in valid_datatypes)) {
            throw new PUTLParseError("parse error: unexpected "+t.type);
        }
        args[keyword] = t.value;
      }
      return args;
    }
    let lex=new lexer(tokens, lexerror);
    let p=new parser(lex);
    p.start = p_Start;
    return p;
  }
  buildParser = _es6_module.add_export('buildParser', buildParser);
  let Parser=buildParser();
  Parser = _es6_module.add_export('Parser', Parser);
  function parseToolPath(str, check_tool_exists) {
    if (check_tool_exists===undefined) {
        check_tool_exists = true;
    }
    if (!initToolPaths_run) {
        initToolPaths_run = true;
        initToolPaths();
    }
    let startstr=str;
    let i1=str.search(/\(/);
    let i2=str.search(/\)/);
    let args="";
    if (i1>=0&&i2>=0) {
        args = str.slice(i1+1, i2).trim();
        str = str.slice(0, i1).trim();
    }
    if (!(str in ToolPaths)&&check_tool_exists) {
        throw new DataPathError("unknown tool "+str);
    }
    let ret;
    try {
      ret = Parser.parse(args);
    }
    catch (error) {
        console.log(error);
        throw new DataPathError(`"${startstr}"\n  ${error.message}`);
    }
    return {toolclass: ToolPaths[str], 
    args: ret}
  }
  parseToolPath = _es6_module.add_export('parseToolPath', parseToolPath);
  function testToolParser() {
    let ret=parseToolPath("view3d.sometool(selectmode=1 str='str' bool=true)", false);
    return ret;
  }
  testToolParser = _es6_module.add_export('testToolParser', testToolParser);
  window.parseToolPath = parseToolPath;
  function initToolPaths() {
    for (let cls of ToolClasses) {
        if (!cls.hasOwnProperty("tooldef")) {
            continue;
        }
        let def=cls.tooldef();
        let path=def.toolpath;
        ToolPaths[path] = cls;
    }
  }
  initToolPaths = _es6_module.add_export('initToolPaths', initToolPaths);
}, '/dev/fairmotion/src/path.ux/scripts/toolsys/toolpath.js');
es6_module_define('toolprop', ["../util/util.js", "../util/struct.js", "../util/vectormath.js", "../curve/curve1d.js", "./toolprop_abstract.js"], function _toolprop_module(_es6_module) {
  var util=es6_import(_es6_module, '../util/util.js');
  var Vector2=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector2');
  var Vector3=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector3');
  var Vector4=es6_import_item(_es6_module, '../util/vectormath.js', 'Vector4');
  var Quat=es6_import_item(_es6_module, '../util/vectormath.js', 'Quat');
  var Matrix4=es6_import_item(_es6_module, '../util/vectormath.js', 'Matrix4');
  var ToolPropertyIF=es6_import_item(_es6_module, './toolprop_abstract.js', 'ToolPropertyIF');
  var PropTypes=es6_import_item(_es6_module, './toolprop_abstract.js', 'PropTypes');
  var PropFlags=es6_import_item(_es6_module, './toolprop_abstract.js', 'PropFlags');
  var nstructjs=es6_import(_es6_module, '../util/struct.js');
  let _ex_PropTypes=es6_import_item(_es6_module, './toolprop_abstract.js', 'PropTypes');
  _es6_module.add_export('PropTypes', _ex_PropTypes, true);
  let _ex_PropFlags=es6_import_item(_es6_module, './toolprop_abstract.js', 'PropFlags');
  _es6_module.add_export('PropFlags', _ex_PropFlags, true);
  let first=(iter) =>    {
    if (iter===undefined) {
        return undefined;
    }
    if (!(Symbol.iterator in iter)) {
        for (let item in iter) {
            return item;
        }
        return undefined;
    }
    for (let item of iter) {
        return item;
    }
  }
  function setPropTypes(types) {
    for (let k in types) {
        PropTypes[k] = types[k];
    }
  }
  setPropTypes = _es6_module.add_export('setPropTypes', setPropTypes);
  const PropSubTypes={COLOR: 1}
  _es6_module.add_export('PropSubTypes', PropSubTypes);
  let customPropertyTypes=[];
  customPropertyTypes = _es6_module.add_export('customPropertyTypes', customPropertyTypes);
  let PropClasses={}
  PropClasses = _es6_module.add_export('PropClasses', PropClasses);
  function _addClass(cls) {
    PropClasses[new cls().type] = cls;
  }
  let customPropTypeBase=17;
  class ToolProperty extends ToolPropertyIF {
     constructor(type, subtype, apiname, uiname, description, flag, icon) {
      super();
      this.data = undefined;
      if (type===undefined) {
          type = this.constructor.PROP_TYPE_ID;
      }
      this.type = type;
      this.subtype = subtype;
      this.wasSet = false;
      this.apiname = apiname;
      this.uiname = uiname!==undefined ? uiname : apiname;
      this.description = description;
      this.flag = flag;
      this.icon = icon;
      this.decimalPlaces = 4;
      this.radix = 10;
      this.step = 0.05;
      this.callbacks = {};
    }
    static  register(cls) {
      cls.PROP_TYPE_ID = (1<<customPropTypeBase);
      PropTypes[cls.name] = cls.PROP_TYPE_ID;
      customPropTypeBase++;
      customPropertyTypes.push(cls);
      PropClasses[new cls().type] = cls;
      return cls.PROP_TYPE_ID;
    }
     private() {
      this.flag|=PropFlags.PRIVATE;
      return this;
    }
     report() {
      console.warn(...arguments);
    }
     _fire(type, arg1, arg2) {
      if (this.callbacks[type]===undefined) {
          return ;
      }
      for (let cb of this.callbacks[type]) {
          cb.call(this, arg1, arg2);
      }
      return this;
    }
     on(type, cb) {
      if (this.callbacks[type]===undefined) {
          this.callbacks[type] = [];
      }
      this.callbacks[type].push(cb);
      return this;
    }
     off(type, cb) {
      this.callbacks[type].remove(cb);
      return this;
    }
     toJSON() {
      return {type: this.type, 
     subtype: this.subtype, 
     apiname: this.apiname, 
     uiname: this.uiname, 
     description: this.description, 
     flag: this.flag, 
     icon: this.icon, 
     data: this.data, 
     range: this.range, 
     uiRange: this.uiRange, 
     step: this.step}
    }
     loadJSON(obj) {
      this.type = obj.type;
      this.subtype = obj.subtype;
      this.apiname = obj.apiname;
      this.uiname = obj.uiname;
      this.description = obj.description;
      this.flag = obj.flag;
      this.icon = obj.icon;
      this.data = obj.data;
      return this;
    }
     getValue() {
      return this.data;
    }
     setValue(val) {
      if (this.constructor===ToolProperty) {
          throw new Error("implement me!");
      }
      this.wasSet = true;
      this._fire("change", val);
    }
     copyTo(b) {
      b.apiname = this.apiname;
      b.uiname = this.uiname;
      b.description = this.description;
      b.flag = this.flag;
      b.icon = this.icon;
      b.baseUnit = this.baseUnit;
      b.subtype = this.subtype;
      b.displayUnit = this.displayUnit;
      for (let k in this.callbacks) {
          b.callbacks[k] = this.callbacks[k];
      }
    }
     copy() {
      let ret=new this.constructor();
      this.copyTo(ret);
      ret.data = this.data;
      return ret;
    }
     setStep(step) {
      this.step = step;
      return this;
    }
    static  calcRelativeStep(step, value, logBase=1.5) {
      value = Math.log(Math.abs(value)+1.0)/Math.log(logBase);
      value = Math.max(value, step);
      this.report(util.termColor("STEP", "red"), value);
      return value;
    }
     getStep(value=1.0) {
      if (this.stepIsRelative) {
          return ToolProperty.calcRelativeStep(this.step, value);
      }
      else {
        return this.step;
      }
    }
     setRelativeStep(step) {
      this.step = step;
      this.stepIsRelative = true;
    }
     setRange(min, max) {
      if (min===undefined||max===undefined) {
          throw new Error("min and/or max cannot be undefined");
      }
      this.range = [min, max];
      return this;
    }
     noUnits() {
      this.baseUnit = this.displayUnit = "none";
      return this;
    }
     setBaseUnit(unit) {
      this.baseUnit = unit;
      return this;
    }
     setDisplayUnit(unit) {
      this.displayUnit = unit;
      return this;
    }
     setUIRange(min, max) {
      if (min===undefined||max===undefined) {
          throw new Error("min and/or max cannot be undefined");
      }
      this.uiRange = [min, max];
      return this;
    }
     setIcon(icon) {
      this.icon = icon;
      return this;
    }
     loadSTRUCT(reader) {
      reader(this);
    }
  }
  _ESClass.register(ToolProperty);
  _es6_module.add_class(ToolProperty);
  ToolProperty = _es6_module.add_export('ToolProperty', ToolProperty);
  ToolProperty.STRUCT = `
ToolProperty { 
  type           : int;
  flag           : int;
  subtype        : int;
  icon           : int;
  baseUnit       : string | ""+this.baseUnit;
  displayUnit    : string | ""+this.displayUnit;
  range          : array(float) | this.range ? this.range : [-1e17, 1e17];
  uiRange        : array(float) | this.range ? this.range : [-1e17, 1e17];
  description    : string;
  stepIsRelative : bool;
  step           : float;
  expRate        : float;
  radix          : float;
  decimalPlaces  : int;
}
`;
  nstructjs.register(ToolProperty);
  class StringProperty extends ToolProperty {
     constructor(value, apiname, uiname, description, flag, icon) {
      super(PropTypes.STRING, undefined, apiname, uiname, description, flag, icon);
      this.multiLine = false;
      if (value)
        this.setValue(value);
      this.wasSet = false;
    }
     copyTo(b) {
      super.copyTo(b);
      b.data = this.data;
      b.multiLine = this.multiLine;
      return this;
    }
     copy() {
      let ret=new StringProperty();
      this.copyTo(ret);
      return ret;
    }
     setValue(val) {
      super.setValue(val);
      this.data = val;
    }
  }
  _ESClass.register(StringProperty);
  _es6_module.add_class(StringProperty);
  StringProperty = _es6_module.add_export('StringProperty', StringProperty);
  StringProperty.STRUCT = nstructjs.inherit(StringProperty, ToolProperty)+`
  data : string;
}
`;
  nstructjs.register(StringProperty);
  let num_res=[/([0-9]+)/, /((0x)?[0-9a-fA-F]+(h?))/, /([0-9]+\.[0-9]*)/, /([0-9]*\.[0-9]+)/];
  function isNumber(f) {
    if (f=="NaN"||(typeof f=="number"&&isNaN(f))) {
        return false;
    }
    f = (""+f).trim();
    let ok=false;
    for (let re of num_res) {
        let ret=f.match(re);
        if (!ret) {
            ok = false;
            continue;
        }
        ok = ret[0].length==f.length;
        if (ok) {
            break;
        }
    }
    return ok;
  }
  isNumber = _es6_module.add_export('isNumber', isNumber);
  _addClass(StringProperty);
  window.isNumber = isNumber;
  class NumProperty extends ToolProperty {
     constructor(type, value, apiname, uiname, description, flag, icon) {
      super(type, undefined, apiname, uiname, description, flag, icon);
      this.data = 0;
      this.range = [0, 0];
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
    }
  }
  _ESClass.register(NumProperty);
  _es6_module.add_class(NumProperty);
  NumProperty = _es6_module.add_export('NumProperty', NumProperty);
  
  NumProperty.STRUCT = nstructjs.inherit(NumProperty, ToolProperty)+`
  range : array(float);
  data  : float;
}
`;
  class _NumberPropertyBase extends ToolProperty {
     constructor(type, value, apiname, uiname, description, flag, icon) {
      super(type, undefined, apiname, uiname, description, flag, icon);
      this.data = 0.0;
      this.expRate = 1.33;
      this.step = 0.1;
      this.range = [-1e+17, 1e+17];
      this.uiRange = undefined;
      if (value!==undefined&&value!==null) {
          this.setValue(value);
          this.wasSet = false;
      }
    }
    get  ui_range() {
      this.report("NumberProperty.ui_range is deprecated");
      return this.uiRange;
    }
     toJSON() {
      let json=super.toJSON();
      json.data = this.data;
      json.expRate = this.expRate;
      return json;
    }
     loadJSON(obj) {
      super.loadJSON(obj);
      this.data = obj.data||this.data;
      this.expRate = obj.expRate||this.expRate;
      return this;
    }
    set  ui_range(val) {
      this.report("NumberProperty.ui_range is deprecated");
      this.uiRange = val;
    }
     copyTo(b) {
      super.copyTo(b);
      b.displayUnit = this.displayUnit;
      b.baseUnit = this.baseUnit;
      b.data = this.data;
      b.expRate = this.expRate;
      b.step = this.step;
      b.range = this.range;
      b.uiRange = this.uiRange;
    }
     setExpRate(exp) {
      this.expRate = exp;
    }
     setValue(val) {
      if (val===undefined||val===null) {
          return ;
      }
      if (typeof val!=="number") {
          throw new Error("Invalid number "+val);
      }
      this.data = val;
      super.setValue(val);
      return this;
    }
     loadJSON(obj) {
      super.loadJSON(obj);
      let get=(key) =>        {
        if (key in obj) {
            this[key] = obj[key];
        }
      };
      get("range");
      get("step");
      get("expRate");
      get("ui_range");
      return this;
    }
  }
  _ESClass.register(_NumberPropertyBase);
  _es6_module.add_class(_NumberPropertyBase);
  _NumberPropertyBase = _es6_module.add_export('_NumberPropertyBase', _NumberPropertyBase);
  
  _NumberPropertyBase.STRUCT = nstructjs.inherit(_NumberPropertyBase, ToolProperty)+`
  range    : array(float);
  expRate  : float;
  data     : float;
  step     : float;
}
`;
  nstructjs.register(_NumberPropertyBase);
  class IntProperty extends _NumberPropertyBase {
     constructor(value, apiname, uiname, description, flag, icon) {
      super(PropTypes.INT, value, apiname, uiname, description, flag, icon);
      this.radix = 10;
    }
     setValue(val) {
      super.setValue(Math.floor(val));
      return this;
    }
     setRadix(radix) {
      this.radix = radix;
    }
     toJSON() {
      let json=super.toJSON();
      json.data = this.data;
      json.radix = this.radix;
      return json;
    }
     loadJSON(obj) {
      super.loadJSON(obj);
      this.data = obj.data||this.data;
      this.radix = obj.radix||this.radix;
      return this;
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
    }
  }
  _ESClass.register(IntProperty);
  _es6_module.add_class(IntProperty);
  IntProperty = _es6_module.add_export('IntProperty', IntProperty);
  IntProperty.STRUCT = nstructjs.inherit(IntProperty, _NumberPropertyBase)+`
  data : int;
}`;
  nstructjs.register(IntProperty);
  _addClass(IntProperty);
  class BoolProperty extends ToolProperty {
     constructor(value, apiname, uiname, description, flag, icon) {
      super(PropTypes.BOOL, undefined, apiname, uiname, description, flag, icon);
      this.data = !!value;
    }
     copyTo(b) {
      super.copyTo(b);
      b.data = this.data;
      return this;
    }
     copy() {
      let ret=new BoolProperty();
      this.copyTo(ret);
      return ret;
    }
     setValue(val) {
      this.data = !!val;
      return this;
    }
     getValue() {
      return this.data;
    }
     toJSON() {
      let ret=super.toJSON();
      return ret;
    }
     loadJSON(obj) {
      super.loadJSON(obj);
      return this;
    }
  }
  _ESClass.register(BoolProperty);
  _es6_module.add_class(BoolProperty);
  BoolProperty = _es6_module.add_export('BoolProperty', BoolProperty);
  _addClass(BoolProperty);
  BoolProperty.STRUCT = nstructjs.inherit(BoolProperty, ToolProperty)+`
  data : bool;
}
`;
  nstructjs.register(BoolProperty);
  class FloatProperty extends _NumberPropertyBase {
     constructor(value, apiname, uiname, description, flag, icon) {
      super(PropTypes.FLOAT, value, apiname, uiname, description, flag, icon);
      this.decimalPlaces = 4;
    }
     setDecimalPlaces(n) {
      this.decimalPlaces = n;
      return this;
    }
     copyTo(b) {
      super.copyTo(b);
      b.data = this.data;
      return this;
    }
     setValue(val) {
      this.data = val;
      super.setValue(val);
      return this;
    }
     toJSON() {
      let json=super.toJSON();
      json.data = this.data;
      json.decimalPlaces = this.decimalPlaces;
      return json;
    }
     loadJSON(obj) {
      super.loadJSON(obj);
      this.data = obj.data||this.data;
      this.decimalPlaces = obj.decimalPlaces||this.decimalPlaces;
      return this;
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
    }
  }
  _ESClass.register(FloatProperty);
  _es6_module.add_class(FloatProperty);
  FloatProperty = _es6_module.add_export('FloatProperty', FloatProperty);
  _addClass(FloatProperty);
  FloatProperty.STRUCT = nstructjs.inherit(FloatProperty, _NumberPropertyBase)+`
  decimalPlaces : int;
  data          : float;
}
`;
  class EnumKeyPair  {
     constructor(key, val) {
      this.key = ""+key;
      this.val = ""+val;
      this.key_is_int = typeof key==="number"||typeof key==="boolean";
      this.val_is_int = typeof val==="number"||typeof val==="boolean";
    }
     loadSTRUCT(reader) {
      reader(this);
      if (this.val_is_int) {
          this.val = parseInt(this.val);
      }
      if (this.key_is_int) {
          this.key = parseInt(this.key);
      }
    }
  }
  _ESClass.register(EnumKeyPair);
  _es6_module.add_class(EnumKeyPair);
  EnumKeyPair.STRUCT = `
EnumKeyPair {
  key        : string;
  val        : string;
  key_is_int : bool;
  val_is_int : bool; 
}
`;
  nstructjs.register(EnumKeyPair);
  class EnumProperty extends ToolProperty {
     constructor(string, valid_values, apiname, uiname, description, flag, icon) {
      super(PropTypes.ENUM, undefined, apiname, uiname, description, flag, icon);
      this.values = {};
      this.keys = {};
      this.ui_value_names = {};
      this.descriptions = {};
      if (valid_values===undefined)
        return this;
      if (__instance_of(valid_values, Array)||__instance_of(valid_values, String)) {
          for (var i=0; i<valid_values.length; i++) {
              this.values[valid_values[i]] = valid_values[i];
              this.keys[valid_values[i]] = valid_values[i];
          }
      }
      else {
        for (var k in valid_values) {
            this.values[k] = valid_values[k];
            this.keys[valid_values[k]] = k;
        }
      }
      if (string===undefined) {
          this.data = first(valid_values);
      }
      else {
        this.setValue(string);
      }
      for (var k in this.values) {
          let uin=k.replace(/[_-]/g, " ").trim();
          uin = uin.split(" ");
          let uiname="";
          for (let word of uin) {
              uiname+=word[0].toUpperCase()+word.slice(1, word.length).toLowerCase()+" ";
          }
          uiname = uiname.trim();
          this.ui_value_names[k] = uiname;
          this.descriptions[k] = uiname;
      }
      this.iconmap = {};
      this.wasSet = false;
    }
     addUINames(map) {
      for (let k in map) {
          this.ui_value_names[k] = map[k];
      }
      return this;
    }
     addDescriptions(map) {
      for (let k in map) {
          this.descriptions[k] = map[k];
      }
      return this;
    }
     addIcons(iconmap) {
      if (this.iconmap===undefined) {
          this.iconmap = {};
      }
      for (var k in iconmap) {
          this.iconmap[k] = iconmap[k];
      }
      return this;
    }
     copyTo(p) {
      super.copyTo(p);
      p.keys = Object.assign({}, this.keys);
      p.values = Object.assign({}, this.values);
      p.data = this.data;
      p.ui_value_names = this.ui_value_names;
      p.update = this.update;
      p.api_update = this.api_update;
      p.iconmap = this.iconmap;
      p.descriptions = this.descriptions;
      return p;
    }
     copy() {
      var p=new EnumProperty("dummy", {"dummy": 0}, this.apiname, this.uiname, this.description, this.flag);
      this.copyTo(p);
      return p;
    }
     getValue() {
      if (this.data in this.values)
        return this.values[this.data];
      else 
        return this.data;
    }
     setValue(val) {
      if (!(val in this.values)&&(val in this.keys))
        val = this.keys[val];
      if (!(val in this.values)) {
          this.report("Invalid value for enum!", val, this.values);
          return ;
      }
      this.data = val;
      super.setValue(val);
      return this;
    }
     _loadMap(obj) {
      if (!obj) {
          return ;
      }
      let ret={};
      for (let k of obj) {
          ret[k.key] = k.val;
      }
      return ret;
    }
     _saveMap(obj) {
      obj = obj===undefined ? {} : obj;
      let ret=[];
      for (let k in obj) {
          ret.push(new EnumKeyPair(k, obj[k]));
      }
      return ret;
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
      this.keys = this._loadMap(obj.keys);
      this.values = this._loadMap(obj.values);
      this.ui_value_names = this._loadMap(obj.ui_value_names);
      this.iconmap = this._loadMap(obj.iconmap);
      this.descriptions = this._loadMap(obj.descriptions);
      if (this.data_is_int) {
          this.data = parseInt(this.data);
      }
    }
     _is_data_int() {
      return typeof (this.data)!=="string";
    }
  }
  _ESClass.register(EnumProperty);
  _es6_module.add_class(EnumProperty);
  EnumProperty = _es6_module.add_export('EnumProperty', EnumProperty);
  _addClass(EnumProperty);
  EnumProperty.STRUCT = nstructjs.inherit(EnumProperty, ToolProperty)+`
  data            : string             | ""+this.data;
  data_is_int     : bool               | this._is_data_int();
  _keys           : array(EnumKeyPair) | this._saveMap(this.keys) ;
  _values         : array(EnumKeyPair) | this._saveMap(this.keys) ;
  _ui_value_names : array(EnumKeyPair) | this._saveMap(this.ui_value_names) ;
  _iconmap        : array(EnumKeyPair) | this._saveMap(this.iconmap) ;
  _descriptions   : array(EnumKeyPair) | this._saveMap(this.descriptions) ;  
}
`;
  nstructjs.register(EnumProperty);
  class FlagProperty extends EnumProperty {
     constructor(string, valid_values, apiname, uiname, description, flag, icon) {
      super(string, valid_values, apiname, uiname, description, flag, icon);
      this.type = PropTypes.FLAG;
      this.wasSet = false;
    }
     setValue(bitmask) {
      this.data = bitmask;
      ToolProperty.prototype.setValue.call(this, bitmask);
      return this;
    }
     copy() {
      let ret=new FlagProperty();
      this.copyTo(ret);
      return ret;
    }
  }
  _ESClass.register(FlagProperty);
  _es6_module.add_class(FlagProperty);
  FlagProperty = _es6_module.add_export('FlagProperty', FlagProperty);
  _addClass(FlagProperty);
  FlagProperty.STRUCT = nstructjs.inherit(FlagProperty, EnumProperty)+`
}
`;
  nstructjs.register(FlagProperty);
  class VecPropertyBase extends FloatProperty {
     constructor(data, apiname, uiname, description) {
      super(undefined, apiname, uiname, description);
      this.hasUniformSlider = false;
    }
     uniformSlider(state=true) {
      this.hasUniformSlider = state;
      return this;
    }
     copyTo(b) {
      super.copyTo(b);
      b.hasUniformSlider = this.hasUniformSlider;
    }
  }
  _ESClass.register(VecPropertyBase);
  _es6_module.add_class(VecPropertyBase);
  VecPropertyBase = _es6_module.add_export('VecPropertyBase', VecPropertyBase);
  VecPropertyBase.STRUCT = nstructjs.inherit(VecPropertyBase, FloatProperty)+`
  hasUniformSlider : bool;
}
`;
  class Vec2Property extends FloatProperty {
     constructor(data, apiname, uiname, description) {
      super(undefined, apiname, uiname, description);
      this.type = PropTypes.VEC2;
      this.data = new Vector2(data);
    }
     setValue(v) {
      this.data.load(v);
      ToolProperty.prototype.setValue.call(this, v);
      return this;
    }
     getValue() {
      return this.data;
    }
     copyTo(b) {
      let data=b.data;
      super.copyTo(b);
      b.data = data;
      b.data.load(this.data);
    }
     copy() {
      let ret=new Vec2Property();
      this.copyTo(ret);
      return ret;
    }
  }
  _ESClass.register(Vec2Property);
  _es6_module.add_class(Vec2Property);
  Vec2Property = _es6_module.add_export('Vec2Property', Vec2Property);
  Vec2Property.STRUCT = nstructjs.inherit(Vec2Property, VecPropertyBase)+`
  data : vec2;
}
`;
  nstructjs.register(Vec2Property);
  _addClass(Vec2Property);
  class Vec3Property extends VecPropertyBase {
     constructor(data, apiname, uiname, description) {
      super(undefined, apiname, uiname, description);
      this.type = PropTypes.VEC3;
      this.data = new Vector3(data);
    }
     setValue(v) {
      this.data.load(v);
      ToolProperty.prototype.setValue.call(this, v);
      return this;
    }
     getValue() {
      return this.data;
    }
     copyTo(b) {
      let data=b.data;
      super.copyTo(b);
      b.data = data;
      b.data.load(this.data);
    }
     copy() {
      let ret=new Vec3Property();
      this.copyTo(ret);
      return ret;
    }
  }
  _ESClass.register(Vec3Property);
  _es6_module.add_class(Vec3Property);
  Vec3Property = _es6_module.add_export('Vec3Property', Vec3Property);
  Vec3Property.STRUCT = nstructjs.inherit(Vec3Property, VecPropertyBase)+`
  data : vec3;
}
`;
  nstructjs.register(Vec3Property);
  _addClass(Vec3Property);
  class Vec4Property extends FloatProperty {
     constructor(data, apiname, uiname, description) {
      super(undefined, apiname, uiname, description);
      this.type = PropTypes.VEC4;
      this.data = new Vector4(data);
    }
     setValue(v) {
      this.data.load(v);
      ToolProperty.prototype.setValue.call(this, v);
      return this;
    }
     getValue() {
      return this.data;
    }
     copyTo(b) {
      let data=b.data;
      super.copyTo(b);
      b.data = data;
      b.data.load(this.data);
    }
     copy() {
      let ret=new Vec4Property();
      this.copyTo(ret);
      return ret;
    }
  }
  _ESClass.register(Vec4Property);
  _es6_module.add_class(Vec4Property);
  Vec4Property = _es6_module.add_export('Vec4Property', Vec4Property);
  Vec4Property.STRUCT = nstructjs.inherit(Vec4Property, VecPropertyBase)+`
  data : vec4;
}
`;
  nstructjs.register(Vec4Property);
  _addClass(Vec4Property);
  class QuatProperty extends ToolProperty {
     constructor(data, apiname, uiname, description) {
      super(PropTypes.QUAT, undefined, apiname, uiname, description);
      this.data = new Quat(data);
    }
     setValue(v) {
      this.data.load(v);
      super.setValue(v);
      return this;
    }
     getValue() {
      return this.data;
    }
     copyTo(b) {
      super.copyTo(b);
      b.data.load(this.data);
    }
     copy() {
      let ret=new QuatProperty();
      this.copyTo(ret);
      return ret;
    }
  }
  _ESClass.register(QuatProperty);
  _es6_module.add_class(QuatProperty);
  QuatProperty = _es6_module.add_export('QuatProperty', QuatProperty);
  QuatProperty.STRUCT = nstructjs.inherit(QuatProperty, VecPropertyBase)+`
  data : vec4;
}
`;
  nstructjs.register(QuatProperty);
  _addClass(QuatProperty);
  class Mat4Property extends ToolProperty {
     constructor(data, apiname, uiname, description) {
      super(PropTypes.MATRIX4, undefined, apiname, uiname, description);
      this.data = new Matrix4(data);
    }
     setValue(v) {
      this.data.load(v);
      super.setValue(v);
      return this;
    }
     getValue() {
      return this.data;
    }
     copyTo(b) {
      super.copyTo(b);
      b.data.load(this.data);
    }
     copy() {
      let ret=new Mat4Property();
      this.copyTo(ret);
      return ret;
    }
     loadSTRUCT(reader) {
      reader(this);
      super.loadSTRUCT(reader);
    }
  }
  _ESClass.register(Mat4Property);
  _es6_module.add_class(Mat4Property);
  Mat4Property = _es6_module.add_export('Mat4Property', Mat4Property);
  Mat4Property.STRUCT = nstructjs.inherit(Mat4Property, FloatProperty)+`
  data           : mat4;
}
`;
  nstructjs.register(Mat4Property);
  _addClass(Mat4Property);
  class ListProperty extends ToolProperty {
     constructor(prop, list=[], uiname="") {
      super(PropTypes.PROPLIST);
      this.uiname = uiname;
      if (typeof prop=="number") {
          prop = PropClasses[prop];
          if (prop!==undefined) {
              prop = new prop();
          }
      }
      else 
        if (prop!==undefined) {
          if (__instance_of(prop, ToolProperty)) {
              prop = prop.copy();
          }
          else {
            prop = new prop();
          }
      }
      this.prop = prop;
      this.value = [];
      for (let val of list) {
          this.push(val);
      }
      this.wasSet = false;
    }
     copyTo(b) {
      super.copyTo(b);
      b.prop = this.prop.copy();
      for (let prop of this.value) {
          b.value.push(prop.copy());
      }
      return b;
    }
     copy() {
      let ret=new ListProperty(this.prop.copy());
      this.copyTo(ret);
      return ret;
    }
     push(item=undefined) {
      if (item===undefined) {
          item = this.prop.copy();
      }
      if (!(__instance_of(item, ToolProperty))) {
          let prop=this.prop.copy();
          prop.setValue(item);
          item = prop;
      }
      this.value.push(item);
      return item;
    }
     clear() {
      this.value.length = 0;
    }
     setValue(value) {
      this.clear();
      for (let item of value) {
          let prop=this.push();
          if (typeof item!=="object") {
              prop.setValue(item);
          }
          else 
            if (__instance_of(item, prop.constructor)) {
              item.copyTo(prop);
          }
          else {
            this.report(item);
            throw new Error("invalid value "+item);
          }
      }
      super.setValue(value);
      return this;
    }
     getValue() {
      return this.value;
    }
     [Symbol.iterator]() {
      let list=this.value;
      return (function* () {
        for (let item of list) {
            yield item.getValue();
        }
      })();
    }
    get  length() {
      return this.value.length;
    }
    set  length(val) {
      this.value.length = val;
    }
  }
  _ESClass.register(ListProperty);
  _es6_module.add_class(ListProperty);
  ListProperty = _es6_module.add_export('ListProperty', ListProperty);
  _addClass(ListProperty);
  class StringSetProperty extends ToolProperty {
     constructor(value=undefined, definition=[]) {
      super(PropTypes.STRSET);
      let values=[];
      this.value = new util.set();
      let def=definition;
      if (Array.isArray(def)||__instance_of(def, util.set)||__instance_of(def, Set)) {
          for (let item of def) {
              values.push(item);
          }
      }
      else 
        if (typeof def==="object") {
          for (let k in def) {
              values.push(k);
          }
      }
      else 
        if (typeof def==="string") {
          values.push(def);
      }
      this.values = {};
      this.ui_value_names = {};
      this.descriptions = {};
      this.iconmap = {};
      for (let v of values) {
          this.values[v] = v;
          let uiname=v.replace(/\_/g, " ").trim();
          uiname = uiname[0].toUpperCase()+uiname.slice(1, uiname.length);
          this.ui_value_names[v] = uiname;
      }
      if (value!==undefined) {
          this.setValue(value);
      }
      this.wasSet = false;
    }
     setValue(values, destructive=true, soft_fail=true) {
      let bad=typeof values!=="string";
      bad = bad&&typeof values!=="object";
      bad = bad&&values!==undefined&&values!==null;
      if (bad) {
          if (soft_fail) {
              this.report("Invalid argument to StringSetProperty.prototype.setValue() "+values);
              return ;
          }
          else {
            throw new Error("Invalid argument to StringSetProperty.prototype.setValue() "+values);
          }
      }
      if (!values) {
          this.value.clear();
      }
      else 
        if (typeof values==="string") {
          if (destructive)
            this.value.clear();
          if (!(values in this.values)) {
              if (soft_fail) {
                  this.report(`"${values}" is not in this StringSetProperty`);
                  return ;
              }
              else {
                throw new Error(`"${values}" is not in this StringSetProperty`);
              }
          }
          this.value.add(values);
      }
      else {
        let data=[];
        if (Array.isArray(values)||__instance_of(values, util.set)||__instance_of(values, Set)) {
            for (let item of values) {
                data.push(item);
            }
        }
        else {
          for (let k in values) {
              data.push(k);
          }
        }
        for (let item of data) {
            if (!(item in this.values)) {
                if (soft_fail) {
                    this.report(`"${item}" is not in this StringSetProperty`);
                    continue;
                }
                else {
                  throw new Error(`"${item}" is not in this StringSetProperty`);
                }
            }
            this.value.add(item);
        }
      }
      super.setValue();
      return this;
    }
     getValue() {
      return this.value;
    }
     addIcons(iconmap) {
      if (iconmap===undefined)
        return ;
      for (let k in iconmap) {
          this.iconmap[k] = iconmap[k];
      }
      return this;
    }
     addUINames(map) {
      for (let k in map) {
          this.ui_value_names[k] = map[k];
      }
      return this;
    }
     addDescriptions(map) {
      for (let k in map) {
          this.descriptions[k] = map[k];
      }
      return this;
    }
     copyTo(b) {
      super.copyTo(b);
      for (let val of this.value) {
          b.value.add(val);
      }
      b.values = {};
      for (let k in this.values) {
          b.values[k] = this.values[k];
      }
      for (let k in this.ui_value_names) {
          b.ui_value_names[k] = this.ui_value_names[k];
      }
      for (let k in this.iconmap) {
          b.iconmap[k] = this.iconmap[k];
      }
      for (let k in this.descriptions) {
          b.descriptions[k] = this.descriptions[k];
      }
    }
     copy() {
      let ret=new StringSetProperty(undefined, {});
      this.copyTo(ret);
      return ret;
    }
  }
  _ESClass.register(StringSetProperty);
  _es6_module.add_class(StringSetProperty);
  StringSetProperty = _es6_module.add_export('StringSetProperty', StringSetProperty);
  _addClass(StringSetProperty);
  var Curve1D=es6_import_item(_es6_module, '../curve/curve1d.js', 'Curve1D');
  class Curve1DProperty extends ToolPropertyIF {
     constructor(curve, apiname, uiname, description, flag, icon) {
      super(PropTypes.CURVE, undefined, apiname, uiname, description, flag, icon);
      this.data = new Curve1D();
      if (curve!==undefined) {
          this.setValue(curve);
      }
      this.wasSet = false;
    }
     getValue() {
      return this.data;
    }
     evaluate(t) {
      return this.data.evaluate(t);
    }
     setValue(curve) {
      if (curve===undefined) {
          return ;
      }
      this.data.load(curve);
    }
     copyTo(b) {
      super.copyTo(b);
      b.setValue(this.data);
    }
     copy() {
      let ret=new Curve1DProperty();
      this.copyTo(ret);
      return ret;
    }
  }
  _ESClass.register(Curve1DProperty);
  _es6_module.add_class(Curve1DProperty);
  Curve1DProperty = _es6_module.add_export('Curve1DProperty', Curve1DProperty);
}, '/dev/fairmotion/src/path.ux/scripts/toolsys/toolprop.js');
es6_module_define('toolprop_abstract', ["../util/util.js"], function _toolprop_abstract_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, '../util/util.js');
  let PropTypes={INT: 1, 
   STRING: 2, 
   BOOL: 4, 
   ENUM: 8, 
   FLAG: 16, 
   FLOAT: 32, 
   VEC2: 64, 
   VEC3: 128, 
   VEC4: 256, 
   MATRIX4: 512, 
   QUAT: 1024, 
   PROPLIST: 4096, 
   STRSET: 8192, 
   CURVE: 8192<<1}
  PropTypes = _es6_module.add_export('PropTypes', PropTypes);
  const PropSubTypes={COLOR: 1}
  _es6_module.add_export('PropSubTypes', PropSubTypes);
  const PropFlags={SELECT: 1, 
   PRIVATE: 2, 
   LABEL: 4, 
   USE_ICONS: 64, 
   USE_CUSTOM_GETSET: 128, 
   SAVE_LAST_VALUE: 256, 
   READ_ONLY: 512, 
   SIMPLE_SLIDER: 1024, 
   FORCE_ROLLER_SLIDER: 2048}
  _es6_module.add_export('PropFlags', PropFlags);
  class ToolPropertyIF  {
     constructor(type, subtype, apiname, uiname, description, flag, icon) {
      this.data = undefined;
      this.type = type;
      this.subtype = subtype;
      this.apiname = apiname;
      this.uiname = uiname;
      this.description = description;
      this.flag = flag;
      this.icon = icon;
    }
     copyTo(b) {

    }
     copy() {

    }
     _fire(type, arg1, arg2) {

    }
     on(type, cb) {

    }
     off(type, cb) {

    }
     getValue() {

    }
     setValue(val) {

    }
     setStep(step) {

    }
     setRange(min, max) {

    }
     setUnit(unit) {

    }
     setUIRange(min, max) {

    }
     setIcon(icon) {

    }
  }
  _ESClass.register(ToolPropertyIF);
  _es6_module.add_class(ToolPropertyIF);
  ToolPropertyIF = _es6_module.add_export('ToolPropertyIF', ToolPropertyIF);
  class StringPropertyIF extends ToolPropertyIF {
     constructor() {
      super(PropTypes.STRING);
    }
  }
  _ESClass.register(StringPropertyIF);
  _es6_module.add_class(StringPropertyIF);
  StringPropertyIF = _es6_module.add_export('StringPropertyIF', StringPropertyIF);
  class NumPropertyIF extends ToolPropertyIF {
  }
  _ESClass.register(NumPropertyIF);
  _es6_module.add_class(NumPropertyIF);
  NumPropertyIF = _es6_module.add_export('NumPropertyIF', NumPropertyIF);
  
  class IntPropertyIF extends ToolPropertyIF {
     constructor() {
      super(PropTypes.INT);
    }
     setRadix(radix) {
      throw new Error("implement me");
    }
  }
  _ESClass.register(IntPropertyIF);
  _es6_module.add_class(IntPropertyIF);
  IntPropertyIF = _es6_module.add_export('IntPropertyIF', IntPropertyIF);
  class FloatPropertyIF extends ToolPropertyIF {
     constructor() {
      super(PropTypes.FLOAT);
    }
     setDecimalPlaces(n) {

    }
  }
  _ESClass.register(FloatPropertyIF);
  _es6_module.add_class(FloatPropertyIF);
  FloatPropertyIF = _es6_module.add_export('FloatPropertyIF', FloatPropertyIF);
  class EnumPropertyIF extends ToolPropertyIF {
     constructor(value, valid_values) {
      super(PropTypes.ENUM);
      this.values = {};
      this.keys = {};
      this.ui_value_names = {};
      this.iconmap = {};
      if (valid_values===undefined)
        return this;
      if (__instance_of(valid_values, Array)||__instance_of(valid_values, String)) {
          for (var i=0; i<valid_values.length; i++) {
              this.values[valid_values[i]] = valid_values[i];
              this.keys[valid_values[i]] = valid_values[i];
          }
      }
      else {
        for (var k in valid_values) {
            this.values[k] = valid_values[k];
            this.keys[valid_values[k]] = k;
        }
      }
      for (var k in this.values) {
          var uin=k[0].toUpperCase()+k.slice(1, k.length);
          uin = uin.replace(/\_/g, " ");
          this.ui_value_names[k] = uin;
      }
    }
     addIcons(iconmap) {
      if (this.iconmap===undefined) {
          this.iconmap = {};
      }
      for (var k in iconmap) {
          this.iconmap[k] = iconmap[k];
      }
    }
  }
  _ESClass.register(EnumPropertyIF);
  _es6_module.add_class(EnumPropertyIF);
  EnumPropertyIF = _es6_module.add_export('EnumPropertyIF', EnumPropertyIF);
  class FlagPropertyIF extends EnumPropertyIF {
     constructor(valid_values) {
      super(PropTypes.FLAG);
    }
  }
  _ESClass.register(FlagPropertyIF);
  _es6_module.add_class(FlagPropertyIF);
  FlagPropertyIF = _es6_module.add_export('FlagPropertyIF', FlagPropertyIF);
  class Vec2PropertyIF extends ToolPropertyIF {
     constructor(valid_values) {
      super(PropTypes.VEC2);
    }
  }
  _ESClass.register(Vec2PropertyIF);
  _es6_module.add_class(Vec2PropertyIF);
  Vec2PropertyIF = _es6_module.add_export('Vec2PropertyIF', Vec2PropertyIF);
  class Vec3PropertyIF extends ToolPropertyIF {
     constructor(valid_values) {
      super(PropTypes.VEC3);
    }
  }
  _ESClass.register(Vec3PropertyIF);
  _es6_module.add_class(Vec3PropertyIF);
  Vec3PropertyIF = _es6_module.add_export('Vec3PropertyIF', Vec3PropertyIF);
  class Vec4PropertyIF extends ToolPropertyIF {
     constructor(valid_values) {
      super(PropTypes.VEC4);
    }
  }
  _ESClass.register(Vec4PropertyIF);
  _es6_module.add_class(Vec4PropertyIF);
  Vec4PropertyIF = _es6_module.add_export('Vec4PropertyIF', Vec4PropertyIF);
  class ListPropertyIF extends ToolPropertyIF {
     constructor(prop) {
      super(PropTypes.PROPLIST);
      this.prop = prop;
    }
     copyTo(b) {

    }
     copy() {

    }
     clear() {

    }
     push(item=this.prop.copy()) {

    }
     [Symbol.iterator]() {

    }
    get  length() {

    }
    set  length(val) {

    }
  }
  _ESClass.register(ListPropertyIF);
  _es6_module.add_class(ListPropertyIF);
  ListPropertyIF = _es6_module.add_export('ListPropertyIF', ListPropertyIF);
  class StringSetPropertyIF extends ToolPropertyIF {
     constructor(value=undefined, definition=[]) {
      super(PropTypes.STRSET);
    }
     setValue(values, destructive=true, soft_fail=true) {

    }
     getValue() {

    }
     addIcons(iconmap) {

    }
     addUINames(map) {

    }
     addDescriptions(map) {

    }
     copyTo(b) {

    }
     copy() {

    }
  }
  _ESClass.register(StringSetPropertyIF);
  _es6_module.add_class(StringSetPropertyIF);
  StringSetPropertyIF = _es6_module.add_export('StringSetPropertyIF', StringSetPropertyIF);
  class Curve1DPropertyIF extends ToolPropertyIF {
     constructor(curve, uiname) {
      super(PropTypes.CURVE);
      this.data = curve;
    }
     getValue() {
      return this.curve;
    }
     setValue(curve) {
      if (curve===undefined) {
          return ;
      }
      let json=JSON.parse(JSON.stringify(curve));
      this.data.load(json);
    }
     copyTo(b) {
      b.setValue(this.data);
    }
  }
  _ESClass.register(Curve1DPropertyIF);
  _es6_module.add_class(Curve1DPropertyIF);
  Curve1DPropertyIF = _es6_module.add_export('Curve1DPropertyIF', Curve1DPropertyIF);
}, '/dev/fairmotion/src/path.ux/scripts/toolsys/toolprop_abstract.js');
es6_module_define('colorutils', ["../config/const.js", "../util/vectormath.js", "../util/util.js"], function _colorutils_module(_es6_module) {
  var util=es6_import(_es6_module, '../util/util.js');
  var vectormath=es6_import(_es6_module, '../util/vectormath.js');
  var cconst=es6_import_item(_es6_module, '../config/const.js', 'default');
  let rgb_to_hsv_rets=new util.cachering(() =>    {
    return [0, 0, 0];
  }, 64);
  function rgb_to_hsv(r, g, b) {
    var computedH=0;
    var computedS=0;
    var computedV=0;
    if (r==null||g==null||b==null||isNaN(r)||isNaN(g)||isNaN(b)) {
        throw new Error(`Please enter numeric RGB values! r: ${r} g: ${g} b: ${b}`);
        return ;
    }
    var minRGB=Math.min(r, Math.min(g, b));
    var maxRGB=Math.max(r, Math.max(g, b));
    if (minRGB==maxRGB) {
        computedV = minRGB;
        let ret=rgb_to_hsv_rets.next();
        ret[0] = 0, ret[1] = 0, ret[2] = computedV;
        return ret;
    }
    var d=(r==minRGB) ? g-b : ((b==minRGB) ? r-g : b-r);
    var h=(r==minRGB) ? 3 : ((b==minRGB) ? 1 : 5);
    computedH = (60*(h-d/(maxRGB-minRGB)))/360.0;
    computedS = (maxRGB-minRGB)/maxRGB;
    computedV = maxRGB;
    let ret=rgb_to_hsv_rets.next();
    ret[0] = computedH, ret[1] = computedS, ret[2] = computedV;
    return ret;
  }
  rgb_to_hsv = _es6_module.add_export('rgb_to_hsv', rgb_to_hsv);
  let hsv_to_rgb_rets=new util.cachering(() =>    {
    return [0, 0, 0];
  }, 64);
  function hsv_to_rgb(h, s, v) {
    let c=0, m=0, x=0;
    let ret=hsv_to_rgb_rets.next();
    ret[0] = ret[1] = ret[2] = 0.0;
    h*=360.0;
    c = v*s;
    x = c*(1.0-Math.abs(((h/60.0)%2)-1.0));
    m = v-c;
    let color;
    function RgbF_Create(r, g, b) {
      ret[0] = r;
      ret[1] = g;
      ret[2] = b;
      return ret;
    }
    if (h>=0.0&&h<60.0) {
        color = RgbF_Create(c+m, x+m, m);
    }
    else 
      if (h>=60.0&&h<120.0) {
        color = RgbF_Create(x+m, c+m, m);
    }
    else 
      if (h>=120.0&&h<180.0) {
        color = RgbF_Create(m, c+m, x+m);
    }
    else 
      if (h>=180.0&&h<240.0) {
        color = RgbF_Create(m, x+m, c+m);
    }
    else 
      if (h>=240.0&&h<300.0) {
        color = RgbF_Create(x+m, m, c+m);
    }
    else 
      if (h>=300.0) {
        color = RgbF_Create(c+m, m, x+m);
    }
    else {
      color = RgbF_Create(m, m, m);
    }
    return color;
  }
  hsv_to_rgb = _es6_module.add_export('hsv_to_rgb', hsv_to_rgb);
}, '/dev/fairmotion/src/path.ux/scripts/util/colorutils.js');
es6_module_define('cssutils', [], function _cssutils_module(_es6_module) {
  function css2matrix(s) {
    return new DOMMatrix(s);
  }
  css2matrix = _es6_module.add_export('css2matrix', css2matrix);
  function matrix2css(m) {
    if (m.$matrix) {
        m = m.$matrix;
    }
    return `matrix(${m.m11},${m.m12},${m.m21},${m.m22},${m.m41},${m.m42})`;
  }
  matrix2css = _es6_module.add_export('matrix2css', matrix2css);
}, '/dev/fairmotion/src/path.ux/scripts/util/cssutils.js');
es6_module_define('events', ["./util.js", "./simple_events.js"], function _events_module(_es6_module) {
  "use strict";
  var util=es6_import(_es6_module, './util.js');
  var simple_events=es6_import(_es6_module, './simple_events.js');
  let _ex_keymap=es6_import_item(_es6_module, './simple_events.js', 'keymap');
  _es6_module.add_export('keymap', _ex_keymap, true);
  let _ex_reverse_keymap=es6_import_item(_es6_module, './simple_events.js', 'reverse_keymap');
  _es6_module.add_export('reverse_keymap', _ex_reverse_keymap, true);
  let _ex_keymap_latin_1=es6_import_item(_es6_module, './simple_events.js', 'keymap_latin_1');
  _es6_module.add_export('keymap_latin_1', _ex_keymap_latin_1, true);
  class EventDispatcher  {
     constructor() {
      this._cbs = {};
    }
     _fireEvent(type, data) {
      let stop=false;
      data = {stopPropagation: function stopPropagation() {
          stop = true;
        }, 
     data: data};
      if (type in this._cbs) {
          for (let cb of this._cbs[type]) {
              cb(data);
              if (stop) {
                  break;
              }
          }
      }
    }
     on(type, cb) {
      if (!(type in this._cbs)) {
          this._cbs[type] = [];
      }
      this._cbs[type].push(cb);
      return this;
    }
     off(type, cb) {
      if (!(type in this._cbs)) {
          console.warn("event handler not in list", type, cb);
          return this;
      }
      let stack=this._cbs[type];
      if (stack.indexOf(cb)<0) {
          console.warn("event handler not in list", type, cb);
          return this;
      }
      stack.remove(cb);
      return this;
    }
  }
  _ESClass.register(EventDispatcher);
  _es6_module.add_class(EventDispatcher);
  EventDispatcher = _es6_module.add_export('EventDispatcher', EventDispatcher);
  function copyMouseEvent(e) {
    let ret={}
    function bind(func, obj) {
      return function () {
        return this._orig.apply(func, arguments);
      }
    }
    let exclude=new Set(["__proto__"]);
    ret._orig = e;
    for (let k in e) {
        let v=e[k];
        if (exclude.has(k)) {
            continue;
        }
        if (typeof v=="function") {
            v = bind(v);
        }
        ret[k] = v;
    }
    return ret;
  }
  copyMouseEvent = _es6_module.add_export('copyMouseEvent', copyMouseEvent);
  const DomEventTypes={on_mousemove: 'mousemove', 
   on_mousedown: 'mousedown', 
   on_mouseup: 'mouseup', 
   on_touchstart: 'touchstart', 
   on_touchcancel: 'touchcanel', 
   on_touchmove: 'touchmove', 
   on_touchend: 'touchend', 
   on_mousewheel: 'mousewheel', 
   on_keydown: 'keydown', 
   on_keyup: 'keyup', 
   on_pointerdown: 'pointerdown', 
   on_pointermove: 'pointermove', 
   on_pointercancel: 'pointercancel', 
   on_pointerup: 'pointerup'}
  _es6_module.add_export('DomEventTypes', DomEventTypes);
  function getDom(dom, eventtype) {
    if (eventtype.startsWith("key"))
      return window;
    return dom;
  }
  let modalStack=[];
  modalStack = _es6_module.add_export('modalStack', modalStack);
  function isModalHead(owner) {
    return modalStack.length==0||modalStack[modalStack.length-1]===owner;
  }
  isModalHead = _es6_module.add_export('isModalHead', isModalHead);
  class EventHandler  {
     pushModal(dom, _is_root) {
      this._modalstate = simple_events.pushModalLight(this);
      return ;
    }
     popModal() {
      if (this._modalstate!==undefined) {
          simple_events.popModalLight(this._modalstate);
          this._modalstate = undefined;
      }
    }
  }
  _ESClass.register(EventHandler);
  _es6_module.add_class(EventHandler);
  EventHandler = _es6_module.add_export('EventHandler', EventHandler);
  function pushModal(dom, handlers) {
    console.warn("Deprecated call to pathux.events.pushModal; use api in simple_events.js instead");
    let h=new EventHandler();
    for (let k in handlers) {
        h[k] = handlers[k];
    }
    handlers.popModal = () =>      {
      return h.popModal(dom);
    }
    h.pushModal(dom, false);
    return h;
  }
  pushModal = _es6_module.add_export('pushModal', pushModal);
}, '/dev/fairmotion/src/path.ux/scripts/util/events.js');
es6_module_define('expr', ["./vectormath.js", "./parseutil.js"], function _expr_module(_es6_module) {
  var vectormath=es6_import(_es6_module, './vectormath.js');
  var lexer=es6_import_item(_es6_module, './parseutil.js', 'lexer');
  var tokdef=es6_import_item(_es6_module, './parseutil.js', 'tokdef');
  var token=es6_import_item(_es6_module, './parseutil.js', 'token');
  var parser=es6_import_item(_es6_module, './parseutil.js', 'parser');
  var PUTLParseError=es6_import_item(_es6_module, './parseutil.js', 'PUTLParseError');
  let tk=(n, r, f) =>    {
    return new tokdef(n, r, f);
  }
  let count=(str, match) =>    {
    let c=0;
    do {
      let i=str.search(match);
      if (i<0) {
          break;
      }
      c++;
      str = str.slice(i+1, str.length);
    } while (1);
    
    return c;
  }
  let tokens=[tk("ID", /[a-zA-Z$_]+[a-zA-Z0-9$_]*/), tk("NUM", /[0-9]+(\.[0-9]*)?/), tk("LPAREN", /\(/), tk("RPAREN", /\)/), tk("STRLIT", /"[^"]*"/, (t) =>    {
    let v=t.value;
    t.lexer.lineno+=count(t.value, "\n");
    return t;
  }), tk("WS", /[ \t\n\r]/, (t) =>    {
    t.lexer.lineno+=count(t.value, "\n");
  }), tk("COMMA", /\,/), tk("COLON", /:/), tk("LSBRACKET", /\[/), tk("RSBRACKET", /\]/), tk("LBRACKET", /\{/), tk("RBRACKET", /\}/), tk("DOT", /\./), tk("PLUS", /\+/), tk("MINUS", /\-/), tk("TIMES", /\*/), tk("DIVIDE", /\//), tk("EXP", /\*\*/), tk("LAND", /\&\&/), tk("BAND", /\&/), tk("LOR", /\|\|/), tk("BOR", /\|/), tk("EQUALS", /=/), tk("LEQUALS", /\<\=/), tk("GEQUALS", /\>\=/), tk("LTHAN", /\</), tk("GTHAN", /\>/), tk("MOD", /\%/), tk("XOR", /\^/), tk("BITINV", /\~/)];
  let lex=new lexer(tokens, (t) =>    {
    console.log("Token error");
    return true;
  });
  let parse=new parser(lex);
  let binops=new Set([".", "/", "*", "**", "^", "%", "&", "+", "-", "&&", "||", "&", "|", "<", ">", "==", "=", "<=", ">="]);
  let precedence;
  if (1) {
      let table=[["**"], ["*", "/"], ["+", "-"], ["."], ["="], ["("], [")"]];
      let pr={};
      for (let i=0; i<table.length; i++) {
          for (let c of table[i]) {
              pr[c] = i;
          }
      }
      precedence = pr;
  }
  function indent(n, chr) {
    if (chr===undefined) {
        chr = "  ";
    }
    let s="";
    for (let i=0; i<n; i++) {
        s+=chr;
    }
    return s;
  }
  class Node extends Array {
     constructor(type) {
      super();
      this.type = type;
      this.parent = undefined;
    }
     push(n) {
      n.parent = this;
      return super.push(n);
    }
     remove(n) {
      let i=this.indexOf(n);
      if (i<0) {
          console.log(n);
          throw new Error("item not in array");
      }
      while (i<this.length) {
        this[i] = this[i+1];
        i++;
      }
      n.parent = undefined;
      this.length--;
      return this;
    }
     insert(starti, n) {
      let i=this.length-1;
      this.length++;
      if (n.parent) {
          n.parent.remove(n);
      }
      while (i>starti) {
        this[i] = this[i-1];
        i--;
      }
      n.parent = this;
      this[starti] = n;
      return this;
    }
     replace(n, n2) {
      if (n2.parent) {
          n2.parent.remove(n2);
      }
      this[this.indexOf(n)] = n2;
      n.parent = undefined;
      n2.parent = this;
      return this;
    }
     toString(t=0) {
      let tab=indent(t, "-");
      let typestr=this.type;
      if (this.value!==undefined) {
          typestr+=" : "+this.value;
      }
      else 
        if (this.op!==undefined) {
          typestr+=" ("+this.op+")";
      }
      let s=tab+typestr+" {\n";
      for (let c of this) {
          s+=c.toString(t+1);
      }
      s+=tab+"}\n";
      return s;
    }
  }
  _ESClass.register(Node);
  _es6_module.add_class(Node);
  Node = _es6_module.add_export('Node', Node);
  function parseExpr(s) {
    let p=parse;
    function Value() {
      let t=p.next();
      if (t&&t.value==="(") {
          t = p.next();
      }
      if (t===undefined) {
          p.error(undefined, "Expected a value");
          return ;
      }
      let n=new Node();
      n.value = t.value;
      if (t.type==="ID") {
          n.type = "Ident";
      }
      else 
        if (t.type==="NUM") {
          n.type = "Number";
      }
      else 
        if (t.type==="STRLIT") {
          n.type = "StrLit";
      }
      else 
        if (t.type==="MINUS") {
          let t2=p.peek_i(0);
          if (t2&&t2.type==="NUM") {
              p.next();
              n.type = "Number";
              n.value = -t2.value;
          }
          else 
            if (t2&&t2.type==="ID") {
              p.next();
              n.type = "Negate";
              let n2=new Node();
              n2.type = "Ident";
              n2.value = t2.value;
              n.push(n2);
          }
          else {
            p.error(t, "Expected a value, not '"+t.value+"'");
          }
      }
      else {
        p.error(t, "Expected a value, not '"+t.value+"'");
      }
      return n;
    }
    function bin_next(depth) {
      if (depth===undefined) {
          depth = 0;
      }
      let a=p.peek_i(0);
      let b=p.peek_i(1);
      if (b&&b.value===")") {
          b.type = a.type;
          b.value = a.value;
          p.next();
          let c=p.peek_i(2);
          if (c&&binops.has(c.value)) {
              return {value: b, 
         op: c.value, 
         prec: -10}
          }
      }
      if (b&&binops.has(b.value)) {
          return {value: a, 
       op: b.value, 
       prec: precedence[b.value]}
      }
      else {
        return Value(a);
      }
    }
    function BinOp(left, depth) {
      if (depth===undefined) {
          depth = 0;
      }
      console.log(indent(depth)+"BinOp", left.toString());
      let op=p.next();
      let right;
      let n;
      let prec=precedence[op.value];
      let r=bin_next(depth+1);
      if (__instance_of(r, Node)) {
          right = r;
      }
      else {
        if (r.prec>prec) {
            if (!n) {
                n = new Node("BinOp");
                n.op = op.value;
                n.push(left);
            }
            n.push(Value());
            return n;
        }
        else {
          right = BinOp(Value(), depth+2);
        }
      }
      n = new Node("BinOp", op);
      n.op = op.value;
      n.push(right);
      n.push(left);
      console.log("\n\n", n.toString(), "\n\n");
      left = n;
      console.log(n.toString());
      return n;
    }
    function Start() {
      let ret=Value();
      while (!p.at_end()) {
        let t=p.peek_i(0);
        if (t===undefined) {
            break;
        }
        console.log(t.toString());
        if (binops.has(t.value)) {
            console.log("binary op!");
            ret = BinOp(ret);
        }
        else 
          if (t.value===",") {
            let n=new Node();
            n.type = "ExprList";
            p.next();
            n.push(ret);
            let n2=Start();
            if (n2.type==="ExprList") {
                for (let c of n2) {
                    n.push(c);
                }
            }
            else {
              n.push(n2);
            }
            return n;
        }
        else 
          if (t.value==="(") {
            let n=new Node("FuncCall");
            n.push(ret);
            n.push(Start());
            p.expect("RPAREN");
            return n;
        }
        else 
          if (t.value===")") {
            return ret;
        }
        else {
          console.log(ret.toString());
          p.error(t, "Unexpected token "+t.value);
        }
      }
      return ret;
    }
    function Run() {
      let ret=[];
      while (!p.at_end()) {
        ret.push(Start());
      }
      return ret;
    }
    p.start = Run;
    return p.parse(s);
  }
  parseExpr = _es6_module.add_export('parseExpr', parseExpr);
}, '/dev/fairmotion/src/path.ux/scripts/util/expr.js');
es6_module_define('graphpack', ["./util.js", "./solver.js", "./vectormath.js", "./math.js"], function _graphpack_module(_es6_module) {
  "use strict";
  var Vector2=es6_import_item(_es6_module, './vectormath.js', 'Vector2');
  var math=es6_import(_es6_module, './math.js');
  var util=es6_import(_es6_module, './util.js');
  var Constraint=es6_import_item(_es6_module, './solver.js', 'Constraint');
  var Solver=es6_import_item(_es6_module, './solver.js', 'Solver');
  let idgen=0;
  class PackNodeVertex extends Vector2 {
     constructor(node, co) {
      super(co);
      this.node = node;
      this._id = idgen++;
      this.edges = [];
      this._absPos = new Vector2();
    }
    get  absPos() {
      this._absPos.load(this).add(this.node.pos);
      return this._absPos;
    }
     [Symbol.keystr]() {
      return this._id;
    }
  }
  _ESClass.register(PackNodeVertex);
  _es6_module.add_class(PackNodeVertex);
  PackNodeVertex = _es6_module.add_export('PackNodeVertex', PackNodeVertex);
  class PackNode  {
     constructor() {
      this.pos = new Vector2();
      this.vel = new Vector2();
      this.oldpos = new Vector2();
      this._id = idgen++;
      this.size = new Vector2();
      this.verts = [];
    }
     [Symbol.keystr]() {
      return this._id;
    }
  }
  _ESClass.register(PackNode);
  _es6_module.add_class(PackNode);
  PackNode = _es6_module.add_export('PackNode', PackNode);
  function copyGraph(nodes) {
    let ret=[];
    let idmap={}
    for (let n of nodes) {
        let n2=new PackNode();
        n2._id = n._id;
        n2.pos.load(n.pos);
        n2.vel.load(n.vel);
        n2.size.load(n.size);
        n2.verts = [];
        idmap[n2._id] = n2;
        for (let v of n.verts) {
            let v2=new PackNodeVertex(n2, v);
            v2._id = v._id;
            idmap[v2._id] = v2;
            n2.verts.push(v2);
        }
        ret.push(n2);
    }
    for (let n of nodes) {
        for (let v of n.verts) {
            let v2=idmap[v._id];
            for (let v3 of v.edges) {
                v2.edges.push(idmap[v3._id]);
            }
        }
    }
    return ret;
  }
  function getCenter(nodes) {
    let cent=new Vector2();
    for (let n of nodes) {
        cent.add(n.pos);
    }
    if (nodes.length===0)
      return cent;
    cent.mulScalar(1.0/nodes.length);
    return cent;
  }
  function loadGraph(nodes, copy) {
    let idmap={}
    for (let i=0; i<nodes.length; i++) {
        nodes[i].pos.load(copy[i].pos);
        nodes[i].oldpos.load(copy[i].oldpos);
        nodes[i].vel.load(copy[i].vel);
    }
  }
  function graphGetIslands(nodes) {
    let islands=[];
    let visit1=new util.set();
    let rec=(n, island) =>      {
      island.push(n);
      visit1.add(n);
      for (let v of n.verts) {
          for (let e of v.edges) {
              let n2=e.node;
              if (n2!==n&&!visit1.has(n2)) {
                  rec(n2, island);
              }
          }
      }
    }
    for (let n of nodes) {
        if (visit1.has(n)) {
            continue;
        }
        let island=[];
        islands.push(island);
        rec(n, island);
    }
    return islands;
  }
  graphGetIslands = _es6_module.add_export('graphGetIslands', graphGetIslands);
  function graphPack(nodes, margin, steps, updateCb) {
    if (margin===undefined) {
        margin = 15;
    }
    if (steps===undefined) {
        steps = 10;
    }
    if (updateCb===undefined) {
        updateCb = undefined;
    }
    let orignodes=nodes;
    nodes = copyGraph(nodes);
    for (let n of nodes) {
        n.pos[0]+=(Math.random()-0.5)*5.0;
        n.pos[1]+=(Math.random()-0.5)*5.0;
    }
    let nodemap={}
    for (let n of nodes) {
        n.vel.zero();
        nodemap[n._id] = n;
        for (let v of n.verts) {
            nodemap[v._id] = v;
        }
    }
    let visit=new util.set();
    let verts=new util.set();
    let isect=[];
    let disableEdges=false;
    function edge_c(params) {
      let v1=params[0], v2=params[1];
      if (disableEdges)
        return 0;
      return v1.absPos.vectorDistance(v2.absPos);
    }
    let p1=new Vector2();
    let p2=new Vector2();
    let s1=new Vector2();
    let s2=new Vector2();
    function loadBoxes(n1, n2, margin1) {
      if (margin1===undefined) {
          margin1 = margin;
      }
      p1.load(n1.pos);
      p2.load(n2.pos);
      s1.load(n1.size);
      s2.load(n2.size);
      p1.subScalar(margin1);
      p2.subScalar(margin1);
      s1.addScalar(margin1*2.0);
      s2.addScalar(margin1*2.0);
    }
    let disableArea=false;
    function area_c(params) {
      let n1=params[0], n2=params[1];
      if (disableArea)
        return 0.0;
      loadBoxes(n1, n2);
      let a1=n1.size[0]*n1.size[1];
      let a2=n2.size[0]*n2.size[1];
      return math.aabb_overlap_area(p1, s1, p2, s2);
      return (math.aabb_overlap_area(p1, s1, p2, s2)/(a1+a2));
    }
    let lasterr, besterr, best;
    let err;
    let islands=graphGetIslands(nodes);
    let fakeVerts=[];
    for (let island of islands) {
        let n=island[0];
        let fv=new PackNodeVertex(n);
        fakeVerts.push(fv);
    }
    let solveStep1=(gk) =>      {
      if (gk===undefined) {
          gk = 1.0;
      }
      let solver=new Solver();
      isect.length = 0;
      visit = new util.set();
      if (fakeVerts.length>1) {
          for (let i=1; i<fakeVerts.length; i++) {
              let v1=fakeVerts[0];
              let v2=fakeVerts[i];
              let con=new Constraint("edge_c", edge_c, [v1.node.pos, v2.node.pos], [v1, v2]);
              con.k = 0.25;
              solver.add(con);
          }
      }
      for (let n1 of nodes) {
          for (let v of n1.verts) {
              verts.add(v);
              for (let v2 of v.edges) {
                  if (v2._id<v._id)
                    continue;
                  let con=new Constraint("edge_c", edge_c, [v.node.pos, v2.node.pos], [v, v2]);
                  con.k = 1.0;
                  solver.add(con);
              }
          }
          for (let n2 of nodes) {
              if (n1===n2)
                continue;
              let key=Math.min(n1._id, n2._id)+":"+Math.max(n1._id, n2._id);
              if (visit.has(key))
                continue;
              loadBoxes(n1, n2);
              let area=math.aabb_overlap_area(p1, s1, p2, s2);
              if (area>0.01) {
                  isect.push([n1, n2]);
                  visit.add(key);
              }
          }
          for (let /*unprocessed ExpandNode*/[n1, n2] of isect) {
              let con=new Constraint("area_c", area_c, [n1.pos, n2.pos], [n1, n2]);
              solver.add(con);
              con.k = 1.0;
          }
      }
      return solver;
    }
    let i=1;
    let solveStep=(gk) =>      {
      if (gk===undefined) {
          gk = 0.5;
      }
      let solver=solveStep1();
      if (i%40===0.0) {
          let c1=getCenter(nodes);
          let rfac=1000.0;
          if (best)
            loadGraph(nodes, best);
          for (let n of nodes) {
              n.pos[0]+=(Math.random()-0.5)*rfac;
              n.pos[1]+=(Math.random()-0.5)*rfac;
              n.vel.zero();
          }
          let c2=getCenter(nodes);
          c1.sub(c2);
          for (let n of nodes) {
              n.pos.add(c1);
          }
      }
      let err=1e+17;
      for (let n of nodes) {
          n.oldpos.load(n.pos);
          n.pos.addFac(n.vel, 0.5);
      }
      disableEdges = false;
      disableArea = true;
      solver.solve(1, gk);
      disableEdges = true;
      disableArea = false;
      for (let j=0; j<10; j++) {
          solver = solveStep1();
          err = solver.solve(10, gk);
      }
      for (let n of nodes) {
          n.vel.load(n.pos).sub(n.oldpos);
      }
      disableEdges = false;
      disableArea = true;
      err = 0.0;
      for (let con of solver.constraints) {
          err+=con.evaluate(true);
      }
      disableEdges = false;
      disableArea = false;
      lasterr = err;
      let add=Math.random()*besterr*Math.exp(-i*0.1);
      if (besterr===undefined||err<besterr+add) {
          best = copyGraph(nodes);
          besterr = err;
      }
      i++;
      return err;
    }
    for (let j=0; j<steps; j++) {
        solveStep();
    }
    loadGraph(orignodes, best ? best : nodes);
    if (updateCb) {
        if (nodes._timer!==undefined) {
            window.clearInterval(nodes._timer);
        }
        nodes._timer = window.setInterval(() =>          {
          let time=util.time_ms();
          while (util.time_ms()-time<50) {
            let err=solveStep();
          }
          if (cconst.DEBUG.boxPacker) {
              console.log("err", (besterr/nodes.length).toFixed(2), (lasterr/nodes.length).toFixed(2), "isects", isect.length);
          }
          if (best)
            loadGraph(orignodes, best);
          if (updateCb()===false) {
              clearInterval(nodes._timer);
              return ;
          }
        }, 100);
        let timer=nodes._timer;
        return {stop: () =>            {
            if (best)
              loadGraph(nodes, best);
            window.clearInterval(timer);
            nodes._timer = undefined;
          }}
    }
  }
  graphPack = _es6_module.add_export('graphPack', graphPack);
}, '/dev/fairmotion/src/path.ux/scripts/util/graphpack.js');
es6_module_define('html5_fileapi', [], function _html5_fileapi_module(_es6_module) {
  function saveFile(data, filename, exts, mime) {
    if (filename===undefined) {
        filename = "unnamed";
    }
    if (exts===undefined) {
        exts = [];
    }
    if (mime===undefined) {
        mime = "application/x-octet-stream";
    }
    let blob=new Blob([data], {type: mime});
    let url=URL.createObjectURL(blob);
    let a=document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", filename);
    a.click();
  }
  saveFile = _es6_module.add_export('saveFile', saveFile);
  function loadFile(filename, exts) {
    if (filename===undefined) {
        filename = "unnamed";
    }
    if (exts===undefined) {
        exts = [];
    }
    let input=document.createElement("input");
    input.type = "file";
    exts = exts.join(",");
    input.setAttribute("accept", exts);
    return new Promise((accept, reject) =>      {
      input.onchange = function (e) {
        if (this.files===undefined||this.files.length!==1) {
            reject("file load error");
            return ;
        }
        let file=this.files[0];
        let reader=new FileReader();
        reader.onload = function (e2) {
          accept(e2.target.result);
        }
        reader.readAsArrayBuffer(file);
      }
      input.click();
    });
  }
  loadFile = _es6_module.add_export('loadFile', loadFile);
  window._testLoadFile = function (exts) {
    if (exts===undefined) {
        exts = ["*.*"];
    }
    loadFile(undefined, exts).then((data) =>      {
      console.log("got file data:", data);
    });
  }
  window._testSaveFile = function () {
    let buf=_appstate.createFile();
    saveFile(buf, "unnamed.w3d", [".w3d"]);
  }
}, '/dev/fairmotion/src/path.ux/scripts/util/html5_fileapi.js');
es6_module_define('image', ["./util.js"], function _image_module(_es6_module) {
  var util=es6_import(_es6_module, './util.js');
  function getImageData(image) {
    if (typeof image=="string") {
        let src=image;
        image = new Image();
        image.src = src;
    }
    function render() {
      let canvas=document.createElement("canvas");
      let g=canvas.getContext("2d");
      canvas.width = image.width;
      canvas.height = image.height;
      g.drawImage(image, 0, 0);
      return g.getImageData(0, 0, image.width, image.height);
    }
    return new Promise((accept, reject) =>      {
      if (!image.complete) {
          image.onload = () =>            {
            console.log("image loaded");
            accept(render(image));
          };
      }
      else {
        accept(render(image));
      }
    });
  }
  getImageData = _es6_module.add_export('getImageData', getImageData);
  function loadImageFile() {
    let this2=this;
    return new Promise((accept, reject) =>      {
      let input=document.createElement("input");
      input.type = "file";
      input.addEventListener("change", function (e) {
        let files=this.files;
        console.log("file!", e, this.files);
        console.log("got file", e, files);
        if (files.length==0)
          return ;
        var reader=new FileReader();
        reader.onload = function (e) {
          var img=new Image();
          let dataurl=img.src = e.target.result;
          window._image_url = e.target.result;
          img.onload = (e) =>            {
            this2.getImageData(img).then((data) =>              {
              data.dataurl = dataurl;
              accept(data);
            });
          }
        }
        reader.readAsDataURL(files[0]);
      });
      input.click();
    });
  }
  loadImageFile = _es6_module.add_export('loadImageFile', loadImageFile);
}, '/dev/fairmotion/src/path.ux/scripts/util/image.js');
